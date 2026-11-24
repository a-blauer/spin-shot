// The radio: the game's music is whatever the player has loaded into it. Songs are the player's own files, kept in
// this browser (IndexedDB) and never uploaded anywhere; the game ships with none.
//
// In co-op the host's radio is the station. Its state (which song, how far in) rides in the host's state message and
// every guest plays the same song at the same place. A guest who has the same file loaded plays their own copy; one who
// has not is sent the song by the host while it plays (in small pieces, for this session only: it is held in memory
// and never added to the guest's own shelf). Anyone can press the keys: a guest's skip or restart goes to the host,
// who acts on it for everybody.
const DB = 'polyshot-radio', STORE = 'tracks';
const CHUNK = 12000, MAXCHUNKS = 5000;   // a song goes out in 12 KB pieces; 60 MB is the most the radio will send
const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 6000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 6000)); return btoa(s); };
const unb64 = (str) => { const s = atob(str), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
const keyOf = (name) => String(name).replace(/\.[a-z0-9]{2,5}$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 60);
const titleOf = (name) => String(name).replace(/\.[a-z0-9]{2,5}$/i, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 70);

function idb() {
  return new Promise((res, rej) => {
    let rq; try { rq = indexedDB.open(DB, 1); } catch (e) { rej(e); return; }
    rq.onupgradeneeded = () => { rq.result.createObjectStore(STORE, { keyPath: 'key' }); };
    rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error);
  });
}
const tx = (db, mode, fn) => new Promise((res, rej) => { const t = db.transaction(STORE, mode), rq = fn(t.objectStore(STORE)); t.oncomplete = () => res(rq && rq.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); });

export class Radio {
  constructor(audio) {
    this.audio = audio; this.game = null;
    this.tracks = [];            // [{ key, title, data: ArrayBuffer }], in name order: the same order on every machine
    this.cur = -1; this.src = null; this.gain = null; this.startAt = 0; this.dur = 0; this.active = false; this.loadSeq = 0;
    this.want = null;            // a guest: what the host says is on, [key, seconds]
    this.missing = '';           // a guest: the last song the host played that this machine has no file for
    this.tx = null;              // the host: the song being sent out, { key, u8, n, queue:Set<piece> }
    this.txRate = 6; this.txBudget = 0;
    this.rx = new Map();         // a guest: songs coming in from the host, key -> { n, parts, got, dur, title, buf, ... }
    this.streamKey = '';         // a guest: the incoming song that is playing now
    this.onChange = null;        // the settings panel listens for the list changing
    this.ready = this.restore();
  }
  get role() { return this.game && this.game.net ? this.game.net.role : 'solo'; }
  sort() { this.tracks.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)); }
  async restore() {
    try { this.db = await idb(); const all = await tx(this.db, 'readonly', (s) => s.getAll()); for (const r of all || []) if (r && r.key && r.data) this.tracks.push({ key: r.key, title: r.title || r.key, data: r.data }); this.sort(); }
    catch (e) { this.db = null; }   // no storage here (private window, sandbox): songs still work, for this visit only
    if (this.onChange) this.onChange();
    if (this.active && this.cur < 0 && this.tracks.length && this.role !== 'client') this.play(Math.floor(Math.random() * this.tracks.length), 0);
  }
  // add the files the player picked; returns how many were new
  async addFiles(files) {
    let n = 0;
    for (const f of files) {
      if (!f || !/^audio\//.test(f.type || '') && !/\.(mp3|ogg|wav|m4a|aac|flac|opus)$/i.test(f.name || '')) continue;
      const key = keyOf(f.name); if (!key || this.tracks.some((t) => t.key === key)) continue;
      let data; try { data = await f.arrayBuffer(); } catch (e) { continue; }
      const T = { key, title: titleOf(f.name), data };
      const playing = this.cur >= 0 ? this.tracks[this.cur] : null;
      this.tracks.push(T); this.sort(); if (playing) this.cur = this.tracks.indexOf(playing);
      n++;
      if (this.db) { try { await tx(this.db, 'readwrite', (s) => s.put(T)); } catch (e) { /* over quota: keep it for this visit */ } }
    }
    if (this.onChange) this.onChange();
    this.bag = null;
    if (n && this.active && this.cur < 0 && this.role !== 'client') this.play(Math.floor(Math.random() * this.tracks.length), 0);
    return n;
  }
  async clear() {
    this.stop(); this.tracks = []; this.cur = -1;
    if (this.db) { try { await tx(this.db, 'readwrite', (s) => s.clear()); } catch (e) { /* nothing to do */ } }
    if (this.onChange) this.onChange();
  }
  // a song is on, or about to be (decoding, or arriving from the host): the game's own score stays quiet
  busy() { return this.active && (!!this.src || this.cur >= 0 || !!this.streamKey); }
  setVol(v) { if (this.gain) this.gain.gain.value = v * 0.9; }
  // the game says whether music should be on at all (in a run: yes; on the menus and when the run is over: no)
  setActive(on) {
    if (on === this.active) return;
    if (on && (!this.audio.ctx || !this.audio.musicBus)) return;   // the sound system is not up yet: the game asks again every frame
    this.active = on;
    if (!on) { this.stop(); return; }
    if (this.role === 'client') { if (this.want) this.sync(this.want); return; }
    if (this.tracks.length) this.play(this.cur >= 0 ? this.cur : Math.floor(Math.random() * this.tracks.length), 0);
  }
  stop() { this.loadSeq++; this.streamKey = ''; if (this.src) { try { this.src.onended = null; this.src.stop(); } catch (e) { /* already stopped */ } this.src = null; } }
  pos() { return this.src && this.audio.ctx ? Math.max(0, this.audio.ctx.currentTime - this.startAt) : 0; }
  // start song i at `at` seconds in
  async play(i, at = 0, quiet = false) {
    const A = this.audio, ctx = A.ctx;
    if (!ctx || !A.musicBus || !this.tracks.length) return;
    i = ((i % this.tracks.length) + this.tracks.length) % this.tracks.length;
    this.stop(); const seq = this.loadSeq; this.cur = i; this.missing = ''; this.deal(i);
    const T = this.tracks[i], t0 = performance.now();
    let buf;
    try { buf = T.buf || await ctx.decodeAudioData(T.data.slice(0)); } catch (e) { buf = null; }
    if (seq !== this.loadSeq) return;                       // something else was asked for while this one was decoding
    if (!buf) { if (this.role !== 'client' && this.tracks.length > 1) this.play(this.upNext, 0); return; }   // not a file this browser can play
    for (const O of this.tracks) if (O !== T) O.buf = null;  // one decoded song in memory at a time
    T.buf = buf; this.dur = buf.duration;
    if (this.role === 'client') at = Math.max(0, at + (performance.now() - t0) / 1000);  // a guest: the host's song moved on while this was decoding
    if (at >= buf.duration - 0.25) { if (this.role !== 'client') this.play(this.upNext, 0); return; }
    this.start(buf, at, () => { if (this.active && this.role !== 'client') this.play(this.upNext, 0); });
    if (!quiet) this.say(`♪  ${T.title}`);
  }
  // Shuffle: every song once, in a fresh random order, before any comes round again. The one after this is always
  // already chosen, so the host can start sending it to guests early.
  deal(i) {
    const n = this.tracks.length; this.bag = (this.bag || []).filter((k) => k !== i && k < n);
    if (!this.bag.length) { this.bag = [...Array(n).keys()].filter((k) => k !== i); for (let a = this.bag.length - 1; a > 0; a--) { const b = Math.floor(Math.random() * (a + 1)); [this.bag[a], this.bag[b]] = [this.bag[b], this.bag[a]]; } }
    this.upNext = this.bag.length ? this.bag[this.bag.length - 1] : i;
  }
  say(text) { if (this.game && this.game.player) this.game.player.toast(text, '#8fd0ff'); }
  start(buf, at, ended) {
    const A = this.audio, ctx = A.ctx;
    if (!this.gain) { this.gain = ctx.createGain(); this.gain.gain.value = (A.musicVol ?? 0.5) * 0.9; this.gain.connect(A.musicBus); }
    const src = ctx.createBufferSource(); src.buffer = buf; src.connect(this.gain);
    src.onended = () => { if (this.src === src) { this.src = null; if (ended) ended(); } };
    src.start(0, at); this.src = src; this.startAt = ctx.currentTime - at; this.dur = buf.duration;
  }
  // the keys: +1 next song, 0 start this one again
  press(next) {
    if (!this.active) return;
    if (this.role === 'client') { this.game.net.emit('door', { r: next ? 1 : 2 }); return; }
    this.command(next);
  }
  command(next) {
    if (!this.active) return;
    if (!this.tracks.length) { if (this.game && this.game.player) this.game.player.toast('The radio is empty  -  add songs from the pause menu (P)', '#8fd0ff'); return; }
    this.play(next ? (this.cur < 0 ? Math.floor(Math.random() * this.tracks.length) : this.upNext) : Math.max(0, this.cur), 0);
  }
  // host -> guests, in the state message
  state() {
    const T = this.active && this.cur >= 0 ? this.tracks[this.cur] : null; if (!T) return null;
    const N = this.tracks[this.upNext % this.tracks.length];
    return [T.key, Math.round(this.pos() * 10) / 10, T.title, T.data.byteLength, Math.round((T.buf ? T.buf.duration : 0) * 10) / 10, N && N !== T ? N.key : '', N && N !== T ? N.data.byteLength : 0];
  }
  // a guest hears what the host hears
  sync(rd) {
    if (!Array.isArray(rd) || typeof rd[0] !== 'string') { this.want = null; if (this.src) this.stop(); this.cur = -1; return; }
    const key = rd[0].slice(0, 60), at = Math.max(0, Math.min(36000, +rd[1] || 0));
    this.want = [key, at];
    if (!this.active) return;
    const i = this.tracks.findIndex((t) => t.key === key);
    for (const k of [...this.rx.keys()]) if (k !== key && k !== rd[5]) this.rx.delete(k);   // only this song and the next are kept
    if (i < 0) { this.syncStream(key, at, rd); return; }
    if (this.streamKey) this.stop();
    this.missing = '';
    if (this.cur === i && this.src) { if (Math.abs(this.pos() - at) > 0.75) this.play(i, at, true); return; }
    if (this.cur === i && !this.src) return;                 // still decoding it
    this.play(i, at);
  }
  // ---------------------------------------------------------------- sending a song to guests who do not have it
  ask(key, what) { if (this.game && this.game.net && this.game.net.room) this.game.net.emit('door', { a: ['q', key, what] }); }
  newRx(key, n) { const R = { key, n, parts: new Array(n), got: 0, head: 0, dur: 0, title: '', buf: null, bufHead: 0, decoding: false, asked: 0, last: performance.now(), full: false }; this.rx.set(key, R); return R; }
  // ask for a song, and ask again for whatever has gone missing if nothing has arrived for a while
  fetch(R) {
    const now = performance.now();
    if (R.got >= R.n || (R.asked && (now - R.last < 2500 || now - R.asked < 2500))) return;
    const miss = []; for (let k = R.head; k < R.n && miss.length < 40; k++) if (!R.parts[k]) miss.push(k);
    this.ask(R.key, R.asked && miss.length < 40 ? miss : R.head); R.asked = now;
  }
  swap(buf, at) { if (this.src) { this.src.onended = null; try { this.src.stop(); } catch (e) { /* already stopped */ } this.src = null; } this.start(buf, at, null); }
  // a guest: the host is on a song this machine has no file for
  syncStream(key, at, rd) {
    const n = Math.ceil(Math.max(0, +rd[3] || 0) / CHUNK);
    if (!n || n > MAXCHUNKS) { if (this.missing !== key) { this.missing = key; this.stop(); this.cur = -1; this.say('The host’s radio is playing a song too big to send'); } return; }
    let R = this.rx.get(key); if (!R || R.n !== n) R = this.newRx(key, n);
    R.dur = Math.max(0, +rd[4] || 0) || R.dur; R.title = String(rd[2] || key).slice(0, 70);
    if (this.cur >= 0 || (this.streamKey && this.streamKey !== key)) { this.stop(); this.cur = -1; }
    if (this.missing !== key) { this.missing = key; if (R.got < R.n) this.say(`Radio: receiving “${R.title}” from the host…`); }
    this.fetch(R);
    // once this one is in, fetch the next one too so it starts on time
    if (R.got >= R.n && typeof rd[5] === 'string' && rd[5] && !this.tracks.some((t) => t.key === rd[5])) {
      const nk = rd[5].slice(0, 60), nn = Math.ceil(Math.max(0, +rd[6] || 0) / CHUNK);
      if (nn && nn <= MAXCHUNKS) { let N = this.rx.get(nk); if (!N || N.n !== nn) N = this.newRx(nk, nn); this.fetch(N); }
    }
    const playing = this.streamKey === key && !!this.src;
    if (playing) { if (Math.abs(this.pos() - at) > 0.75 && at < R.buf.duration - 0.5) this.swap(R.buf, at); }
    else if (R.buf && !R.decoding && at < R.buf.duration - 0.5) { this.streamKey = key; this.swap(R.buf, at); this.say(`♪  ${R.title}`); }
    // (re)build what can be played from the pieces in hand: everything once it is all here; before that, the front of
    // the song as soon as it reaches well past where the host is, and again when the part being played is running out
    if (R.decoding || R.full) return;
    const have = R.dur > 0 ? R.dur * R.head / R.n : 0, bufEnd = R.buf ? R.buf.duration : 0;
    if (R.got >= R.n || (R.head > R.bufHead && have > at + 8 && have > bufEnd + 8 && (!playing || bufEnd - at < 15))) this.decodeStream(R);
  }
  async decodeStream(R) {
    const ctx = this.audio.ctx; if (!ctx) return;
    R.decoding = true;
    const head = R.head, all = R.got >= R.n; let len = 0; for (let k = 0; k < head; k++) len += R.parts[k].length;
    const u = new Uint8Array(len); for (let k = 0, o = 0; k < head; k++) { u.set(R.parts[k], o); o += R.parts[k].length; }
    let buf = null; try { buf = await ctx.decodeAudioData(u.buffer); } catch (e) { buf = null; }
    R.decoding = false;
    if (this.rx.get(R.key) !== R) return;                    // the radio has moved on
    R.bufHead = head;
    if (all) R.full = true;
    if (!buf) { if (all) this.say('The host’s song could not be played here'); return; }   // some formats cannot be played in part: wait for all of it
    R.buf = buf; if (all) R.dur = buf.duration;
    if (!this.active || !this.want || this.want[0] !== R.key || this.cur >= 0) return;
    // carry on from the same place on the longer copy
    const going = this.streamKey === R.key && !!this.src, at = going ? this.pos() : this.want[1];
    if (at < buf.duration - 0.5) { this.streamKey = R.key; this.swap(buf, at); if (!going) this.say(`♪  ${R.title}`); }
  }
  // messages on the wire: ['q', key, from | [pieces]] guest -> host;  ['c', key, piece, of, base64] host -> guests
  net(a, fromHost) {
    if (!Array.isArray(a) || typeof a[1] !== 'string') return;
    const key = a[1].slice(0, 60);
    if (a[0] === 'q' && this.role === 'host') {
      const T = this.tracks.find((t) => t.key === key); if (!T) return;
      const n = Math.ceil(T.data.byteLength / CHUNK); if (!n || n > MAXCHUNKS) return;
      if (!this.tx || this.tx.key !== key) this.tx = { key, u8: new Uint8Array(T.data), n, queue: new Set() };
      const Q = this.tx.queue;
      if (Array.isArray(a[2])) { for (const v of a[2].slice(0, 60)) { const k = v | 0; if (k >= 0 && k < n) Q.add(k); } }
      else { for (let k = Math.max(0, a[2] | 0); k < n; k++) Q.add(k); }
    } else if (a[0] === 'c' && fromHost && this.role === 'client') {
      const R = this.rx.get(key), k = a[2] | 0;
      if (!R || (a[3] | 0) !== R.n || k < 0 || k >= R.n || R.parts[k] || typeof a[4] !== 'string' || a[4].length > CHUNK * 1.4) return;
      let u; try { u = unb64(a[4]); } catch (e) { return; }
      R.parts[k] = u; R.got++; R.last = performance.now();
      while (R.head < R.n && R.parts[R.head]) R.head++;
      if (R.got >= R.n && !R.decoding && !R.full) this.decodeStream(R);
    }
  }
  // the host sends a few pieces a frame: quickly over a direct link, gently through the shared room, and slower still
  // the moment the room pushes back, so a song never crowds out the game's own traffic
  tick(dt) {
    const T = this.tx; if (!T) return;
    if (this.role !== 'host') { this.tx = null; return; }
    if (!T.queue.size) return;
    const net = this.game && this.game.net, room = net && net.room; if (!room) { this.tx = null; return; }
    const cap = net.direct ? 40 : 10, now = performance.now(), real = Math.min(0.5, (now - (this.txAt || now)) / 1000);   // by the clock, not by the frame
    this.txAt = now;
    if (net.direct && !T.fast) { T.fast = true; this.txRate = cap; }
    this.txBudget = Math.min(net.direct ? 12 : 4, this.txBudget + Math.min(cap, this.txRate) * real);
    while (this.txBudget >= 1 && T.queue.size) {
      this.txBudget -= 1;
      let k = -1; for (const v of T.queue) if (k < 0 || v < k) k = v;
      T.queue.delete(k);
      const piece = T.u8.subarray(k * CHUNK, Math.min(T.u8.length, (k + 1) * CHUNK));
      let pr; try { pr = room.emit('door', { a: ['c', T.key, k, T.n, b64(piece)] }); } catch (e) { pr = Promise.reject(e); }
      Promise.resolve(pr).then(() => { this.txRate = Math.min(cap, this.txRate + 0.05); }, () => { this.txRate = Math.max(1.5, this.txRate * 0.5); if (this.tx === T) T.queue.add(k); });
    }
  }
}
