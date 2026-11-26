// The light show: a concert rig hung in every room of the Descent, played by the music.
// The music bus is tapped by an analyser. From its spectrum we take the kick (the low band against its own running
// average: a beat is a jump well above it, with a short refractory time), the level (how loud the song is: a quiet
// stretch dims the rig, a drop opens it all up) and the brightness of the highs (which sets how fast things move).
// The rig: six laser emitters high on the walls, each throwing a fan of thin beams with bright cores that land on the
// floor as dots; four moving heads on the ceiling throwing soft cones of light with pools under them; strobes on the
// emitters. A "look" (fan sweep, scanning bars, crossing beams, a spinning tunnel, a chase) runs for sixteen beats
// and then the rig moves to the next, in a new pair of colours from a palette that sits well together. Strong beats
// flash the strobes (scaled by the player's strobe setting, which can turn them off) and push the lasers brighter.
import * as THREE from 'three';

const PALETTE = [[1, 0.16, 0.62], [0.12, 0.88, 1], [1, 0.72, 0.12], [0.55, 1, 0.25], [0.62, 0.32, 1], [1, 0.32, 0.18]];
const LOOKS = ['fan', 'scan', 'cross', 'tunnel', 'chase'];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V3(0, 1, 0);
const add = (c, o) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c[0], c[1], c[2]), transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide });
// a soft cone of light: bright at the lamp, fading to nothing at the floor
function coneTex() {
  const c = document.createElement('canvas'); c.width = 4; c.height = 128; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.18)'); gr.addColorStop(0.92, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,1)');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
}
function dotTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
}

export class LightShow {
  constructor(g) {
    this.g = g; this.root = new THREE.Group(); this.root.visible = false; g.scene.add(this.root);
    this.E = 6; this.B = 7;   // emitters, beams each
    const beamG = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true); beamG.translate(0, 0.5, 0);
    const dot = dotTex(), cone = coneTex();
    this.lasers = [];
    for (let e = 0; e < this.E; e++) for (let b = 0; b < this.B; b++) {
      const halo = new THREE.Mesh(beamG, add([1, 1, 1], 0.12)), core = new THREE.Mesh(beamG, add([1, 1, 1], 0.9)), hit = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: dot, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      halo.frustumCulled = core.frustumCulled = hit.frustumCulled = false; hit.rotation.x = -Math.PI / 2;
      this.root.add(halo, core, hit); this.lasers.push({ e, b, halo, core, hit });
    }
    this.heads = [];
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 24, 1, true), new THREE.MeshBasicMaterial({ map: cone, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide }));
      m.geometry.translate(0, -0.5, 0); m.frustumCulled = false;
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: dot, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); pool.rotation.x = -Math.PI / 2; pool.frustumCulled = false;
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(26, 10, 8), add([1, 1, 1], 0.9));
      this.root.add(m, pool, lamp); this.heads.push({ m, pool, lamp });
    }
    this.strobes = [];
    for (let e = 0; e < this.E; e++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: dot, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); s.frustumCulled = false; this.root.add(s); this.strobes.push(s); }
    // a white wash over the whole screen for the biggest strobe hits (kept light, and off with the strobe setting)
    this.wash = document.createElement('div'); this.wash.style.cssText = 'position:fixed;inset:0;pointer-events:none;background:#fff;opacity:0;mix-blend-mode:screen;z-index:3';
    document.body.appendChild(this.wash);
    this.t = 0; this.beats = 0; this.pulse = 0; this.flash = 0; this.lv = 0; this.avg = 0; this.lastBeat = -9; this.bpm = 120; this.look = 0; this.cols = [0, 1]; this.hi = 0.5;
  }
  // the analyser on the music bus, made once the sound system is up
  tap() {
    if (this.an) return true; const A = this.g.audio; if (!A || !A.ctx || !A.musicBus) return false;
    this.an = A.ctx.createAnalyser(); this.an.fftSize = 1024; this.an.smoothingTimeConstant = 0.55; A.musicBus.connect(this.an);
    this.spec = new Uint8Array(this.an.frequencyBinCount); this.binHz = A.ctx.sampleRate / this.an.fftSize; return true;
  }
  listen(dt) {
    if (!this.tap()) return;
    this.an.getByteFrequencyData(this.spec);
    const band = (f0, f1) => { const a = Math.max(1, Math.floor(f0 / this.binHz)), b = Math.max(a + 1, Math.floor(f1 / this.binHz)); let s = 0; for (let i = a; i < b; i++) s += this.spec[i]; return s / (b - a) / 255; };
    const low = band(40, 150), all = band(40, 8000), hi = band(3000, 9000);
    this.lv += (all - this.lv) * Math.min(1, dt * 4); this.hi += (hi - this.hi) * Math.min(1, dt * 2);
    this.avg += (low - this.avg) * Math.min(1, dt * 1.6);
    const now = this.t, gap = now - this.lastBeat;
    if (low > 0.18 && low > this.avg * 1.22 + 0.03 && gap > 0.24) {
      if (gap < 1.2) this.bpm += (60 / gap - this.bpm) * 0.25;
      this.lastBeat = now; this.beats++; const big = low > this.avg * 1.6 + 0.06;
      this.pulse = 1; if (big || this.beats % 8 === 0) this.flash = 1;
      if (this.beats % 16 === 0) this.next();
    }
  }
  next() { this.look = (this.look + 1) % LOOKS.length; const a = Math.floor(Math.random() * PALETTE.length); let b = (a + 2 + Math.floor(Math.random() * 3)) % PALETTE.length; this.cols = [a, b]; }
  tick(dt) {
    const g = this.g, D = g.descent, S = g.settings || {}, on = (S.lights ?? 1) > 0 && D && D.A && g.phase !== 'Village' && g.phase !== 'GameOver' && !(g.village && g.village.on);
    this.root.visible = !!on; if (!on) { this.wash.style.opacity = 0; return; }
    const A = D.A(); if (!A || A.village) { this.root.visible = false; return; }
    this.t += dt; this.listen(dt);
    // no beat heard for a while (a quiet song, or none): keep time on our own, softly
    if (this.t - this.lastBeat > 60 / Math.max(70, this.bpm) * 2.2) { this.lastBeat = this.t; this.beats++; this.pulse = 0.45; if (this.beats % 16 === 0) this.next(); }
    this.pulse = Math.max(0, this.pulse - dt * 5); this.flash = Math.max(0, this.flash - dt * 12);
    const amt = S.lights ?? 1, energy = Math.min(1, 0.3 + this.lv * 2.2), bright = amt * (0.35 + 0.65 * energy) * (0.75 + 0.5 * this.pulse);
    const [cx, cz] = A.c, hx = A.hx, hz = A.hy, H = Math.min(A.H, 2600), t = this.t, beatPh = Math.min(1, (this.t - this.lastBeat) / (60 / Math.max(70, this.bpm)));
    const speed = 0.6 + this.hi * 2.5, look = LOOKS[this.look], C0 = PALETTE[this.cols[0]], C1 = PALETTE[this.cols[1]];
    // the emitters: high on the long walls and the two ends
    const EM = [[-0.92, -0.6], [-0.92, 0.6], [0.92, -0.6], [0.92, 0.6], [0, -0.95], [0, 0.95]].map(([u, v]) => V3(cx + u * (hx - 60), H - 140, cz + v * (hz - 60)));
    const mid = V3(cx, 0, cz);
    for (const L of this.lasers) {
      const e = L.e, b = L.b, o = EM[e], col = (e + (look === 'chase' ? Math.floor(t * 4) : 0)) % 2 ? C1 : C0, k = (b - (this.B - 1) / 2) / ((this.B - 1) / 2);
      const toMid = mid.clone().sub(o); toMid.y = 0; toMid.normalize(); const yaw0 = Math.atan2(toMid.x, toMid.z);
      let yaw = yaw0, pitch = -0.45, on2 = 1;
      if (look === 'fan') { yaw = yaw0 + k * 0.62 + Math.sin(t * speed + e) * 0.35; pitch = -0.38 - 0.12 * Math.sin(t * speed * 0.7 + b); }
      else if (look === 'scan') { yaw = yaw0 + k * 0.08; pitch = -0.15 - 0.55 * (0.5 + 0.5 * Math.sin(t * speed * 1.4 + (e % 2) * Math.PI)); }
      else if (look === 'cross') { const a = t * speed * 0.8 + e * 1.05, tgt = V3(cx + Math.cos(a) * hx * 0.45, 0, cz + Math.sin(a * 1.3) * hz * 0.45), d = tgt.sub(o); yaw = Math.atan2(d.x, d.z) + k * 0.05; pitch = Math.atan2(d.y, Math.hypot(d.x, d.z)) + k * 0.03; }
      else if (look === 'tunnel') { const a = t * speed * 1.6 + (b / this.B) * Math.PI * 2; yaw = yaw0 + Math.cos(a) * 0.38; pitch = -0.42 + Math.sin(a) * 0.26; }
      else if (look === 'chase') { const lit = Math.floor(t * 6 + e) % this.B; on2 = b === lit || b === (lit + 3) % this.B ? 1 : 0.08; yaw = yaw0 + k * 0.7; pitch = -0.5; }
      const dir = V3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).normalize();
      // the beam runs until it meets the floor (or the far side of the room)
      let len = dir.y < -0.02 ? o.y / -dir.y : 9000; len = Math.min(len, 9000);
      const end = o.clone().addScaledVector(dir, len), inRoom = Math.abs(end.x - cx) < hx && Math.abs(end.z - cz) < hz; if (!inRoom) { const s = Math.min(Math.abs((dir.x > 0 ? cx + hx - o.x : cx - hx - o.x) / (dir.x || 1e-6)), Math.abs((dir.z > 0 ? cz + hz - o.z : cz - hz - o.z) / (dir.z || 1e-6))); len = Math.min(len, s); }
      const w = 2.2 + this.pulse * 1.6, op = bright * on2;
      for (const [m, ww, oo] of [[L.halo, w * 4.5, 0.1], [L.core, w, 0.85]]) { m.position.copy(o); m.quaternion.setFromUnitVectors(UP, dir); m.scale.set(ww, len, ww); m.material.color.setRGB(col[0], col[1], col[2]); m.material.opacity = oo * op; }
      L.hit.visible = dir.y < -0.02 && inRoom; L.hit.position.copy(o).addScaledVector(dir, len); L.hit.position.y = 6; L.hit.scale.setScalar(60 + this.pulse * 50); L.hit.material.color.setRGB(col[0], col[1], col[2]); L.hit.material.opacity = 0.8 * op;
    }
    // the moving heads: soft cones from the ceiling, swinging on the bar, pools of light under them
    this.heads.forEach((Hd, i) => {
      const o = V3(cx + (i - 1.5) * hx * 0.42, H - 40, cz + (i % 2 ? 1 : -1) * hz * 0.2), a = t * speed * 0.5 + i * 1.7, col = i % 2 ? C0 : C1;
      const tgt = V3(cx + Math.sin(a) * hx * 0.55, 0, cz + Math.cos(a * 0.8 + i) * hz * 0.55), d = tgt.clone().sub(o), L = d.length(), r = 260 + 120 * this.pulse;
      Hd.m.position.copy(o); Hd.m.quaternion.setFromUnitVectors(V3(0, -1, 0), d.clone().normalize()); Hd.m.scale.set(r, L, r);
      Hd.m.geometry.parameters; Hd.m.material.color.setRGB(col[0], col[1], col[2]); Hd.m.material.opacity = 0.45 * bright;
      Hd.pool.position.set(tgt.x, 5, tgt.z); Hd.pool.scale.setScalar(r * 2.6); Hd.pool.material.color.setRGB(col[0], col[1], col[2]); Hd.pool.material.opacity = 0.55 * bright;
      Hd.lamp.position.copy(o); Hd.lamp.material.color.setRGB(col[0], col[1], col[2]);
    });
    // strobes on the emitters, and a light wash over the screen on the biggest hits
    const st = (S.strobe ?? 0.6) * amt, f = this.flash * st;
    this.strobes.forEach((s, i) => { s.position.copy(EM[i]); s.lookAt(g.camera.position); s.scale.setScalar(260 + 340 * f); s.material.opacity = f * (beatPh < 0.5 ? 1 : 0.4); });
    this.wash.style.opacity = (f * 0.16).toFixed(3);
  }
}
