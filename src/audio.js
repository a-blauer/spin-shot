// WebAudio sound player: lazy-decoded mp3 buffers, 3D panning with distance falloff (~3m..45m), per-sound
// throttling (35 ms) so crowds of ghouls don't stack the same groan, and looping ambience beds.
import * as THREE from 'three';

// ---- The mix ---------------------------------------------------------------------------------------------------
// Every file is peak-normalised, which says nothing about how loud it sounds. TRIM is the correction that puts each
// sound's loudest 100 ms where its job needs it (measured with tools/meter_audio.py against the volume the game
// plays it at): the player's gun and explosions on top (-9 to -14 dBFS), hit feedback and the player's own pain
// just under (-12 to -17), creature voices and rewards behind that (-13 to -16), foley and interface lowest.
const TRIM = {
  S_HitMarker: 2.6, S_Headshot: 1.27, S_Kill: 1.11, S_Crit: 1.33, S_Explosion: 1.69, S_Slam: 1.07, S_Stomp: 0.93, S_BossRoar: 1.58, S_Screech: 0.72,
  S_Groan0: 1.62, S_Groan1: 1.44, S_Groan2: 1.51, S_Groan3: 1.41, S_Snarl: 1.17, S_Wings: 1.68, S_Attack: 1.18, S_Spit: 0.89, S_EnemyDie: 0.86, S_Gib: 0.65, S_Splat: 1.13,
  S_RoundStart: 0.74, S_RoundEnd: 0.75, S_LevelUp: 0.69, S_Upgrade: 0.85, S_Win: 0.79, S_Lose: 0.92, S_Jackpot: 0.75, S_PowerUp: 0.93, S_Luck: 0.98,
  S_Buy: 0.71, S_Deny: 0.68, S_Cash: 0.75, S_Coin: 0.76, S_JumpPad: 0.61, S_Hurt: 1.42, S_Heartbeat: 1.49,
  S_Step0: 0.98, S_Step1: 1.03, S_Step2: 1.06, S_Step3: 1.01, S_Land: 0.89, S_Jump: 0.72, S_AirJump: 0.81, S_Dash: 1.08, S_Slide: 0.92, S_Wallrun: 0.90, S_Grapple: 0.99,
  S_MagIn: 0.95, S_MagOut: 1.16, S_Rack: 1.55, S_ShellIn: 1.55, S_ShellDrop: 0.60, S_Switch: 1.45, S_Dry: 1.7,
  S_HitFlesh: 1.09, S_HitFlesh2: 1.01, S_HitWall: 1.68, S_Ricochet: 0.82, S_Door: 0.99, S_Chain: 1.74, S_Beam: 0.80, S_Energy: 1.09, S_Launcher: 1.87,
  S_UIMove: 1.0, S_UISelect: 1.11, S_SlotTick: 1.1, S_SlotStop: 1.02, S_SlotPull: 0.99, S_Saw: 1.52, S_Flame: 1.75, S_Plasma: 1.37,
};
// Dry bus: interface, rewards and hit confirmation. No room reverb, and never muffled when you are hurt.
const DRY = new Set(['S_UIMove', 'S_UISelect', 'S_Buy', 'S_Deny', 'S_Upgrade', 'S_LevelUp', 'S_Luck', 'S_Coin', 'S_Cash', 'S_PowerUp', 'S_HitMarker', 'S_Headshot', 'S_Kill', 'S_Crit',
  'S_RoundStart', 'S_RoundEnd', 'S_Win', 'S_Lose', 'S_Jackpot', 'S_Heartbeat', 'S_Hurt', 'S_SlotTick']);
// Sounds that repeat many times a second are never played at exactly the same pitch twice.
const JIT = { S_HitMarker: 0.05, S_HitFlesh: 0.09, S_HitFlesh2: 0.09, S_HitWall: 0.1, S_Step0: 0.09, S_Step1: 0.09, S_Step2: 0.09, S_Step3: 0.09, S_ShellDrop: 0.12, S_ShellIn: 0.05, S_Kill: 0.04,
  S_Coin: 0.06, S_Cash: 0.05, S_Dash: 0.05, S_Jump: 0.05, S_Land: 0.07, S_Explosion: 0.1, S_Gib: 0.1, S_Splat: 0.12, S_EnemyDie: 0.1, S_Attack: 0.1, S_Ricochet: 0.15, S_Chain: 0.08, S_Rack: 0.03 };
// The loud ones push the music down for a moment so they land in clear air.
const DUCK = { S_Explosion: 0.45, S_Slam: 0.5, S_Stomp: 0.6, S_BossRoar: 0.45, S_Screech: 0.6 };

export class Audio {
  constructor(base = 'audio/') {
    this.base = base;
    this.ctx = null;
    this.buffers = new Map();
    this.loading = new Map();
    this.last = new Map();
    this.loops = new Map();
    this.listener = { pos: new THREE.Vector3(), fwd: new THREE.Vector3(0, 0, -1), up: new THREE.Vector3(0, 1, 0) };
  }
  // Small generative score (no samples): bass, plucked lead and drums on a 16-step loop in A minor.
  // mode: 'off' | 'calm' | 'fight' | 'boss' | 'casino'
  music(mode) {
    this.musicMode = mode;
    if (!this.ctx || this._mus) return;
    const ctx = this.ctx;
    this.musicGain = ctx.createGain(); this.musicGain.gain.value = (this.musicVol ?? 0.5) * 0.8; this.musicGain.connect(this.musicBus);
    const out = this.musicGain;
    const noise = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate); { const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const tone = (t, f, dur, type, vol, cut) => { const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(); o.type = type; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = cut; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02); };
    const kick = (t) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.2); };
    const hat = (t, v) => { const s = ctx.createBufferSource(), g = ctx.createGain(), hp = ctx.createBiquadFilter(); s.buffer = noise; hp.type = 'highpass'; hp.frequency.value = 6000; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05); s.connect(hp); hp.connect(g); g.connect(out); s.start(t); s.stop(t + 0.06); };
    const hz = (n) => 55 * Math.pow(2, n / 12);
    const prog = { calm: [0, 0, 5, 7], fight: [0, 0, 5, 7], boss: [0, 1, 0, 6], casino: [3, 8, 5, 10] };   // roots, semitones above A
    const arp = [0, 7, 12, 15, 12, 7, 19, 15];
    let step = 0, next = 0;
    this._mus = setInterval(() => {
      if (ctx.state !== 'running') return;
      if (next < ctx.currentTime) next = ctx.currentTime + 0.05;
      while (next < ctx.currentTime + 0.25) {
        const m = this.musicMode, bpm = m === 'boss' ? 132 : m === 'fight' ? 116 : m === 'casino' ? 104 : 84, sd = 60 / bpm / 4;
        if (m && m !== 'off') {
          const bar = Math.floor(step / 16) % 4, s = step % 16, root = (prog[m] || prog.calm)[bar], major = m === 'casino';
          if (s % 8 === 0 || (m !== 'calm' && s % 8 === 6)) tone(next, hz(root), sd * 3.5, 'sawtooth', 0.16, 320);
          if (m !== 'calm' ? s % 2 === 0 : s % 4 === 0) { let n = arp[(s / 2) % 8 | 0]; if (major && n === 15) n = 16; tone(next, hz(root + 24 + n), sd * 1.6, 'triangle', m === 'calm' ? 0.05 : 0.07, 2400); }
          if (m === 'fight' || m === 'boss') { if (s % 4 === 0 || (m === 'boss' && s === 14)) kick(next); if (s % 2 === 1) hat(next, 0.05); if (s === 4 || s === 12) hat(next, 0.14); }
          if (m === 'casino' && (s % 4 === 2)) hat(next, 0.06);
        }
        step++; next += sd;
      }
    }, 60);
  }
  // Body for a gunshot, layered under the sample: a pitched-down thump and a filtered noise crack sized by `weight` (0..1).
  gunPunch(weight) {
    const ctx = this.ctx; if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime, w = Math.max(0, Math.min(1, weight));
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(190 - w * 60, t); o.frequency.exponentialRampToValueAtTime(58, t + 0.09 + w * 0.12);
    g.gain.setValueAtTime(0.2 + w * 0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12 + w * 0.2);
    o.connect(g); g.connect(this.gunBus); o.start(t); o.stop(t + 0.4);
    if (!this._nz) { this._nz = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate); const d = this._nz.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = ctx.createBufferSource(), ng = ctx.createGain(), bp = ctx.createBiquadFilter();
    s.buffer = this._nz; bp.type = 'bandpass'; bp.frequency.value = 2600 - w * 1400; bp.Q.value = 0.7;
    ng.gain.setValueAtTime(0.12 + w * 0.2, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.05 + w * 0.1);
    s.connect(bp); bp.connect(ng); ng.connect(this.gunBus); s.start(t); s.stop(t + 0.3);
  }
  setMusicVol(v) { this.musicVol = v; if (this.musicGain) this.musicGain.gain.value = v * 0.8; }
  // Push the music down to `to` (0..1) and let it come back over about half a second.
  duck(to = 0.6, hold = 0.12) {
    if (!this.musicBus) return; const t = this.ctx.currentTime, g = this.musicBus.gain;
    g.cancelScheduledValues(t); g.setTargetAtTime(to, t, 0.015); g.setTargetAtTime(1, t + hold, 0.3);
  }
  // k = 0 clear .. 1 nearly deaf: the low-pass over the world, the gun and the music.
  setMuffle(k) {
    k = Math.max(0, Math.min(1, k)); if (!this.muffle || Math.abs(k - this.muffleK) < 0.04) return;
    this.muffleK = k; this.muffle.frequency.setTargetAtTime(k <= 0 ? 20000 : 16000 * Math.pow(0.075, k), this.ctx.currentTime, 0.2);
  }
  // The weight under a gunshot: the recordings have almost nothing below 250 Hz, so the chest thump is built here. A sine
  // dropping through 190-60 Hz, with a quieter octave above it so the punch still reads on speakers with no bass.
  gunBody(weight, vol = 1) {
    const ctx = this.ctx; if (!ctx || ctx.state !== 'running' || weight <= 0) return;
    const t = ctx.currentTime, w = Math.min(1, weight), f0 = 190 - 60 * w, f1 = 68 - 14 * w, dur = 0.09 + 0.16 * w, g0 = (0.2 + 0.3 * w) * vol;
    for (const [mul, gain, type] of [[1, g0, 'sine'], [2, g0 * 0.3, 'triangle']]) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type;
      o.frequency.setValueAtTime(f0 * mul, t); o.frequency.exponentialRampToValueAtTime(f1 * mul, t + 0.05 + 0.06 * w);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.003); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(this.gunBus); o.start(t); o.stop(t + dur + 0.05);
    }
  }
  unlock() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = this.ctx;
      // Output chain: buses -> glue compressor -> brickwall limiter -> output trim. The glue has a slow attack so the
      // front of a gunshot gets through before it clamps; the limiter after it is what stops a horde, three explosions
      // and the music from ever clipping the output.
      const glue = ctx.createDynamicsCompressor(); glue.threshold.value = -14; glue.knee.value = 8; glue.ratio.value = 2; glue.attack.value = 0.012; glue.release.value = 0.22;
      const limit = ctx.createDynamicsCompressor(); limit.threshold.value = -3; limit.knee.value = 0; limit.ratio.value = 20; limit.attack.value = 0.001; limit.release.value = 0.09;
      // (Web Audio compressors add their own make-up gain, about 4 dB for the glue: `pre` takes it back off so the
      // limiter only works on real peaks, and the spread between loud and quiet sounds survives.)
      const pre = ctx.createGain(); pre.gain.value = 0.7;
      const out = ctx.createGain(); out.gain.value = 0.95;
      glue.connect(pre); pre.connect(limit); limit.connect(out); out.connect(ctx.destination);
      this._out = out; this._limit = limit; this._glue = glue;
      // When you are badly hurt the world goes dull: everything but the dry bus runs through this low-pass.
      this.muffle = ctx.createBiquadFilter(); this.muffle.type = 'lowpass'; this.muffle.frequency.value = 20000; this.muffle.Q.value = 0.5; this.muffle.connect(glue); this.muffleK = 0;
      const hp = (f) => { const b = ctx.createBiquadFilter(); b.type = 'highpass'; b.frequency.value = f; b.Q.value = 0.7; return b; };
      // World bus (kept under the name `master`): creatures, footsteps, impacts, explosions. Rumble under 40 Hz is cut:
      // nothing can reproduce it and it only makes the compressor pump.
      this.master = ctx.createGain(); this.master.gain.value = 1;
      const wHP = hp(40); this.master.connect(wHP); wHP.connect(this.muffle);
      // Gun bus: the player's weapon. A little weight at 110 Hz, a little bite at 3 kHz.
      this.gunBus = ctx.createGain(); this.gunBus.gain.value = 1;
      const gHP = hp(55), gLo = ctx.createBiquadFilter(), gHi = ctx.createBiquadFilter();
      gLo.type = 'lowshelf'; gLo.frequency.value = 140; gLo.gain.value = 2.5; gHi.type = 'peaking'; gHi.frequency.value = 3200; gHi.Q.value = 0.8; gHi.gain.value = 2;
      this.gunBus.connect(gHP); gHP.connect(gLo); gLo.connect(gHi); gHi.connect(this.muffle);
      // Dry bus: straight to the glue.
      this.uiBus = ctx.createGain(); this.uiBus.gain.value = 1; this.uiBus.connect(glue);
      // Music: its own level, ducked under gunfire and explosions.
      this.musicBus = ctx.createGain(); this.musicBus.gain.value = 1; this.musicBus.connect(this.muffle);
      // Room reverb, fed only by the world and the gun, and only their mids: reverb on bass is mud, on highs is hiss.
      const len = Math.floor(ctx.sampleRate * 0.9), ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
      const verb = ctx.createConvolver(); verb.buffer = ir;
      const vIn = hp(320), vLP = ctx.createBiquadFilter(); vLP.type = 'lowpass'; vLP.frequency.value = 5200;
      const wet = ctx.createGain(); wet.gain.value = 0.5;
      const sW = ctx.createGain(); sW.gain.value = 0.3; const sG = ctx.createGain(); sG.gain.value = 0.2;
      this.master.connect(sW); sW.connect(vIn); this.gunBus.connect(sG); sG.connect(vIn);
      vIn.connect(vLP); vLP.connect(verb); verb.connect(wet); wet.connect(this.muffle);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  load(name) {
    if (this.buffers.has(name)) return Promise.resolve(this.buffers.get(name));
    if (this.loading.has(name)) return this.loading.get(name);
    if (!this.ctx) return Promise.resolve(null);
    const p = fetch(this.base + name + '.mp3').then((r) => r.arrayBuffer()).then((b) => this.ctx.decodeAudioData(b)).then((buf) => { this.buffers.set(name, buf); return buf; }).catch(() => null);
    this.loading.set(name, p);
    return p;
  }
  preload(names) { if (this.ctx) for (const n of names) this.load(n); }
  setListener(pos, fwd, up) {
    this.listener.pos.copy(pos); this.listener.fwd.copy(fwd); this.listener.up.copy(up);
    if (!this.ctx) return;
    const L = this.ctx.listener;
    if (L.positionX) {
      const t = this.ctx.currentTime;
      L.positionX.setValueAtTime(pos.x, t); L.positionY.setValueAtTime(pos.y, t); L.positionZ.setValueAtTime(pos.z, t);
      L.forwardX.setValueAtTime(fwd.x, t); L.forwardY.setValueAtTime(fwd.y, t); L.forwardZ.setValueAtTime(fwd.z, t);
      L.upX.setValueAtTime(up.x, t); L.upY.setValueAtTime(up.y, t); L.upZ.setValueAtTime(up.z, t);
    } else {
      L.setPosition(pos.x, pos.y, pos.z);
      L.setOrientation(fwd.x, fwd.y, fwd.z, up.x, up.y, up.z);
    }
  }
  _throttled(name) {
    const now = performance.now();
    const l = this.last.get(name) || 0;
    if (now - l < 35) return true;
    this.last.set(name, now);
    return false;
  }
  // 2D (UI / player) sound
  play(name, vol = 1, pitch = 1, jitter = 0) { this._play(name, null, vol, pitch, jitter); }
  // positional sound (three-space position, cm)
  playAt(name, pos, vol = 1, pitch = 1, jitter = 0.06) {
    if (pos && pos.distanceTo(this.listener.pos) > 6000) return;
    this._play(name, pos, vol, pitch, jitter);
  }
  _play(name, pos, vol, pitch, jitter) {
    if (!this.ctx || this._throttled(name)) return;
    const go = (buf) => {
      if (!buf) return;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = pitch * (1 + (Math.random() * 2 - 1) * Math.max(jitter, JIT[name] || 0));
      const g = this.ctx.createGain();
      g.gain.value = vol * (TRIM[name] || 1);
      src.connect(g);
      const bus = DRY.has(name) ? this.uiBus : this.master;
      if (DUCK[name] && (!pos || pos.distanceTo(this.listener.pos) < 2500)) this.duck(DUCK[name], 0.25);
      if (pos) {
        const p = this.ctx.createPanner();
        p.panningModel = 'equalpower';
        p.distanceModel = 'inverse';
        p.refDistance = 350;
        p.maxDistance = 6000;
        p.rolloffFactor = 1.2;
        if (p.positionX) { p.positionX.value = pos.x; p.positionY.value = pos.y; p.positionZ.value = pos.z; } else p.setPosition(pos.x, pos.y, pos.z);
        // air between you and it takes the top off: full range up close, about 2.5 kHz at 50 metres
        const d = pos.distanceTo(this.listener.pos);
        if (d > 900) { const air = this.ctx.createBiquadFilter(); air.type = 'lowpass'; air.frequency.value = Math.max(2500, 16000 * Math.pow(0.5, (d - 900) / 1500)); g.connect(air); air.connect(p); } else g.connect(p);
        p.connect(bus);
      } else g.connect(bus);
      src.start();
    };
    const b = this.buffers.get(name);
    if (b) go(b); else this.load(name).then(go);
  }
  loop(name, vol) {
    if (!this.ctx) return;
    let L = this.loops.get(name);
    if (!L) {
      L = { gain: this.ctx.createGain(), started: false };
      L.gain.gain.value = 0;
      L.gain.connect(this.master);
      this.loops.set(name, L);
      this.load(name).then((buf) => {
        if (!buf) return;
        const src = this.ctx.createBufferSource();
        src.buffer = buf; src.loop = true; src.connect(L.gain); src.start(); L.started = true;
      });
    }
    L.gain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.5);
  }
}
