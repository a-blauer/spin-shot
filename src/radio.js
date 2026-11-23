// The radio: the game's music is whatever the player has loaded into it. Songs are the player's own files, kept in
// this browser (IndexedDB) and never uploaded anywhere; the game ships with none.
//
// In co-op the host's radio is the station. Its state (which song, how far in) rides in the host's state message and
// every guest plays the same song at the same place, provided they have loaded a file with the same name. Anyone can
// press the keys: a guest's skip or restart is sent to the host, who acts on it for everybody.
const DB = 'polyshot-radio', STORE = 'tracks';
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
    this.missing = '';           // a guest: the song the host is playing that this machine does not have
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
    if (n && this.active && this.cur < 0 && this.role !== 'client') this.play(0, 0);
    return n;
  }
  async clear() {
    this.stop(); this.tracks = []; this.cur = -1;
    if (this.db) { try { await tx(this.db, 'readwrite', (s) => s.clear()); } catch (e) { /* nothing to do */ } }
    if (this.onChange) this.onChange();
  }
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
  stop() { this.loadSeq++; if (this.src) { try { this.src.onended = null; this.src.stop(); } catch (e) { /* already stopped */ } this.src = null; } }
  pos() { return this.src && this.audio.ctx ? Math.max(0, this.audio.ctx.currentTime - this.startAt) : 0; }
  // start song i at `at` seconds in
  async play(i, at = 0, quiet = false) {
    const A = this.audio, ctx = A.ctx;
    if (!ctx || !A.musicBus || !this.tracks.length) return;
    i = ((i % this.tracks.length) + this.tracks.length) % this.tracks.length;
    this.stop(); const seq = this.loadSeq; this.cur = i; this.missing = '';
    const T = this.tracks[i], t0 = performance.now();
    let buf;
    try { buf = T.buf || await ctx.decodeAudioData(T.data.slice(0)); } catch (e) { buf = null; }
    if (seq !== this.loadSeq) return;                       // something else was asked for while this one was decoding
    if (!buf) { if (this.role !== 'client' && this.tracks.length > 1) this.play(i + 1, 0); return; }   // not a file this browser can play
    for (const O of this.tracks) if (O !== T) O.buf = null;  // one decoded song in memory at a time
    T.buf = buf; this.dur = buf.duration;
    if (this.role === 'client') at = Math.max(0, at + (performance.now() - t0) / 1000);  // a guest: the host's song moved on while this was decoding
    if (at >= buf.duration - 0.25) { if (this.role !== 'client') this.play(i + 1, 0); return; }
    if (!this.gain) { this.gain = ctx.createGain(); this.gain.gain.value = (A.musicVol ?? 0.5) * 0.9; this.gain.connect(A.musicBus); }
    const src = ctx.createBufferSource(); src.buffer = buf; src.connect(this.gain);
    src.onended = () => { if (this.src === src) { this.src = null; if (this.active && this.role !== 'client') this.play(this.cur + 1, 0); } };
    src.start(0, at); this.src = src; this.startAt = ctx.currentTime - at;
    if (!quiet && this.game && this.game.player) this.game.player.toast(`♪  ${T.title}`, '#8fd0ff');
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
    this.play(next ? this.cur + 1 : Math.max(0, this.cur), 0);
  }
  // host -> guests, in the state message
  state() { return this.active && this.cur >= 0 && this.tracks[this.cur] ? [this.tracks[this.cur].key, Math.round(this.pos() * 10) / 10] : null; }
  // a guest hears what the host hears
  sync(rd) {
    if (!Array.isArray(rd) || typeof rd[0] !== 'string') { this.want = null; if (this.src) this.stop(); this.cur = -1; return; }
    const key = rd[0].slice(0, 60), at = Math.max(0, Math.min(36000, +rd[1] || 0));
    this.want = [key, at];
    if (!this.active) return;
    const i = this.tracks.findIndex((t) => t.key === key);
    if (i < 0) {
      if (this.missing !== key) { this.missing = key; this.stop(); this.cur = -1; if (this.game && this.game.player) this.game.player.toast('The host’s radio is playing a song you have not loaded', '#8fd0ff'); }
      return;
    }
    if (this.cur === i && this.src) { if (Math.abs(this.pos() - at) > 0.75) this.play(i, at, true); return; }
    if (this.cur === i && !this.src) return;                 // still decoding it
    this.play(i, at);
  }
}
