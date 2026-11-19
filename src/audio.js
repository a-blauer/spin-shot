// WebAudio sound player: lazy-decoded mp3 buffers, 3D panning with distance falloff (~3m..45m), per-sound
// throttling (35 ms) so crowds of ghouls don't stack the same groan, and looping ambience beds.
import * as THREE from 'three';

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
    this.musicGain = ctx.createGain(); this.musicGain.gain.value = this.musicVol ?? 0.5; this.musicGain.connect(this.master);
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
    o.type = 'sine'; o.frequency.setValueAtTime(170 - w * 70, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.09 + w * 0.12);
    g.gain.setValueAtTime(0.25 + w * 0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12 + w * 0.2);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.4);
    if (!this._nz) { this._nz = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate); const d = this._nz.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = ctx.createBufferSource(), ng = ctx.createGain(), bp = ctx.createBiquadFilter();
    s.buffer = this._nz; bp.type = 'bandpass'; bp.frequency.value = 2600 - w * 1400; bp.Q.value = 0.7;
    ng.gain.setValueAtTime(0.12 + w * 0.2, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.05 + w * 0.1);
    s.connect(bp); bp.connect(ng); ng.connect(this.master); s.start(t); s.stop(t + 0.3);
  }
  setMusicVol(v) { this.musicVol = v; if (this.musicGain) this.musicGain.gain.value = v; }
  unlock() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8;
      // mastering: a bus compressor glues everything together and a short room reverb gives the dry effects a space
      const ctx = this.ctx, comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16; comp.knee.value = 18; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.16;
      this.master.connect(comp); comp.connect(ctx.destination);
      const len = Math.floor(ctx.sampleRate * 0.9), ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
      const verb = ctx.createConvolver(); verb.buffer = ir; const wet = ctx.createGain(); wet.gain.value = 0.16;
      this.master.connect(verb); verb.connect(wet); wet.connect(ctx.destination);
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
      src.playbackRate.value = pitch * (1 + (Math.random() * 2 - 1) * jitter);
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(g);
      if (pos) {
        const p = this.ctx.createPanner();
        p.panningModel = 'equalpower';
        p.distanceModel = 'inverse';
        p.refDistance = 350;
        p.maxDistance = 6000;
        p.rolloffFactor = 1.2;
        if (p.positionX) { p.positionX.value = pos.x; p.positionY.value = pos.y; p.positionZ.value = pos.z; } else p.setPosition(pos.x, pos.y, pos.z);
        g.connect(p); p.connect(this.master);
      } else g.connect(this.master);
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
