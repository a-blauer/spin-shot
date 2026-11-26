// Flat-vector sprite effects (port of ADMHFx): muzzle stars, white impact crescents, blood sprays & splats,
// gibs that bounce and settle, puffs, shock rings, tracers, lightning, coins and persistent decals.
// CPU-simulated particles drawn through three instanced sprite batches (masked / translucent / additive).
import * as THREE from 'three';
import { SpriteBatch, sprite, Cam, Atlas } from './render.js';

const UP = new THREE.Vector3(0, 1, 0);
const _r = new THREE.Vector3(), _u = new THREE.Vector3(), _a = new THREE.Vector3(), _t = new THREE.Vector3(), _s = new THREE.Vector3();
const rnd = (a, b) => a + Math.random() * (b - a);
const vrand = () => { const v = new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)); while (v.lengthSq() > 1 || v.lengthSq() < 1e-4) v.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)); return v.normalize(); };
const lerpC = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, (a[3] ?? 1) + ((b[3] ?? 1) - (a[3] ?? 1)) * t];
const easeOut = (t) => 1 - (1 - t) * (1 - t);

export function decalBasis(n, spinDeg, outRight, outUp) {
  const ref = Math.abs(n.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : UP;
  outUp.copy(ref).addScaledVector(n, -ref.dot(n)).normalize();
  outRight.crossVectors(outUp, n).normalize();
  if (spinDeg) {
    const q = new THREE.Quaternion().setFromAxisAngle(n, spinDeg * Math.PI / 180);
    outUp.applyQuaternion(q); outRight.applyQuaternion(q);
  }
}

export class Fx {
  constructor(game, scene) {
    this.game = game;
    this.batches = {
      sprite: new SpriteBatch(scene, 'sprite', 'fx', 3000, 4),
      fx: new SpriteBatch(scene, 'fx', 'fx', 3000, 5),
      add: new SpriteBatch(scene, 'add', 'fx', 2000, 6),
      creature: new SpriteBatch(scene, 'sprite', 'creatures' + (game.map && game.map.pack ? (Array.isArray(game.map.pack) ? game.map.pack[0] : game.map.pack) : ''), 1600, 4),   // a full horde is 64 bodies of up to 7 parts, plus the dying, the summoned and the limbs on the floor: 600 ran out and the newest bodies went undrawn
    };
    this.scene0 = scene; this.mainAtlas = 'creatures' + (game.map && game.map.pack ? (Array.isArray(game.map.pack) ? game.map.pack[0] : game.map.pack) : '');
    this.parts = [];
    this.decals = [];
    this.serial = 0;
  }
  groundY(p, maxDown = 600) {
    const h = this.game.phys.raycastDown(new THREE.Vector3(p.x, p.y + 20, p.z), maxDown + 20);
    return h ? h.point.y : -1e9;
  }
  // The Blight does not bleed: while `sap` is set (a strain's cap, flesh and glow), blood becomes a burst of lit spores, meat
  // becomes chips of cap and stalk, and the stain on the floor is a damp patch of the strain's flesh.
  withSap(S, fn) { const old = this.sap; this.sap = S; try { fn(); } finally { this.sap = old; } }
  sapify(o) {
    const S = this.sap, t = o.tex || '';
    const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    if (t === 'FX_BloodSpray') { const g = mixc(S.flesh, S.glow, 0.55); o.tex = 'FX_Puff'; o.c0 = [g[0], g[1], g[2], 0.85]; o.c1 = [g[0], g[1], g[2], 0]; o.glow = 0.6; }
    else if (t.startsWith('FX_Gib_')) { const eye = t === 'FX_Gib_Eye'; const c = eye ? S.glow : (t === 'FX_Gib_Bone' ? S.flesh : S.cap); o.tex = eye ? 'FX_Disc' : 'FX_Shard'; o.c0 = [c[0], c[1], c[2], 1]; if (eye) o.glow = 1; o.sapSplat = o.splat; o.splat = false; }
    else if (t === 'FX_Disc' && o.splat) { const c = mixc(S.flesh, S.glow, 0.3); o.c0 = [c[0], c[1], c[2], 1]; o.sapSplat = true; o.splat = false; }
    if (o.splat) { o.sapSplat = true; o.splat = false; }
    if (o.sapSplat) o.sapC = mixc(S.flesh, [0.1, 0.08, 0.06], 0.45);
    return o;
  }
  add(o) {
    if (this.sap) o = this.sapify(o);
    const P = Object.assign({
      mode: 'bill', pos: new THREE.Vector3(), vel: new THREE.Vector3(), axis: null, gravity: 0, drag: 0, size0: 50, size1: 50, stretch: 1,
      rot: 0, rotVel: 0, life: 0.3, age: 0, delay: 0, c0: [1, 1, 1, 1], c1: null, fadeIn: 0, fadeOut: 0.4, groundY: -1e9, bounce: 0,
      settle: false, splat: false, settled: false, kind: 'fx', tex: 'FX_Disc', glow: 0, right: null, up: null, atlas: 'fx',
    }, o);
    if (!P.c1) P.c1 = P.c0;
    P.spr = P.sprObj || sprite(P.tex);
    if (this.parts.length > 2400) {
      // drop the oldest long-lived debris first
      const i = this.parts.findIndex((q) => q.settled || q.life > 3);
      this.parts.splice(i >= 0 ? i : 0, 1);
    }
    this.parts.push(P);
    return P;
  }

  update(dt) {
    const keep = [];
    for (const P of this.parts) {
      if (P.delay > 0) { P.delay -= dt; keep.push(P); continue; }
      P.age += dt;
      if (P.age >= P.life) continue;
      if (!P.settled) {
        P.vel.y -= P.gravity * dt;
        if (P.drag > 0) P.vel.multiplyScalar(Math.max(0, 1 - P.drag * dt));
        P.pos.addScaledVector(P.vel, dt);
        P.rot += P.rotVel * dt;
        if (P.spin && P.mode === 'fixed') { P.right.applyAxisAngle(UP, P.spin * dt); P.up.applyAxisAngle(UP, P.spin * dt); }
        if (P.groundY > -1e8 && P.pos.y < P.groundY + 2 && P.vel.y < 0) {
          P.pos.y = P.groundY + 2;
          if (P.sapSplat) { P.sapSplat = false; this.decal('FX_Puff', new THREE.Vector3(P.pos.x, P.groundY, P.pos.z), UP, rnd(30, 60) * Math.max(0.6, P.size0 / 30), [P.sapC[0], P.sapC[1], P.sapC[2], 0.8], 24); }
          if (P.splat) {
            P.splat = false;
            this.decal('FX_Blood_' + Math.floor(Math.random() * 4), new THREE.Vector3(P.pos.x, P.groundY, P.pos.z), UP, rnd(35, 80) * Math.max(0.6, P.size0 / 30), [1, 1, 1, 1], 24);
          }
          if (P.bounce > 0 && -P.vel.y > 200) {
            P.vel.y = -P.vel.y * P.bounce; P.vel.x *= 0.5; P.vel.z *= 0.5; P.rotVel *= 0.5;
          } else if (P.settle) {
            P.settled = true; P.vel.set(0, 0, 0); P.mode = 'fixed';
            P.right = new THREE.Vector3(); P.up = new THREE.Vector3();
            decalBasis(UP, P.rot, P.right, P.up);
            P.pos.y = P.groundY + 1 + (this.serial++ % 8) * 0.15;
          } else { P.vel.set(0, 0, 0); P.gravity = 0; }
        }
      }
      keep.push(P);
    }
    this.parts = keep;
    // decals expire
    for (const d of this.decals) d.age += dt;
    this.decals = this.decals.filter((d) => d.age < d.life);
  }

  draw() {
    for (const b of Object.values(this.batches)) b.begin();
    const draw = (P) => {
      const t = Math.min(1, P.age / Math.max(P.life, 1e-4));
      const size = P.size0 + (P.size1 - P.size0) * easeOut(t);
      let alpha = 1;
      if (P.fadeIn > 0 && t < P.fadeIn) alpha = t / P.fadeIn;
      if (P.fadeOut > 0 && t > 1 - P.fadeOut) alpha *= (1 - t) / P.fadeOut;
      let w = size, h = size * P.stretch;
      if (P.mode === 'bill') {
        // never let a billboard swallow the screen when it pops right in your face
        const mx = P.pos.distanceTo(Cam.pos) * 0.55;
        if (w > mx) { h *= mx / w; w = mx; }
        const c = Math.cos(P.rot * Math.PI / 180), s = Math.sin(P.rot * Math.PI / 180);
        _r.copy(Cam.right).multiplyScalar(c).addScaledVector(Cam.up, s);
        _u.copy(Cam.up).multiplyScalar(c).addScaledVector(Cam.right, -s);
      } else if (P.mode === 'streak') {
        _a.copy(P.vel.lengthSq() > 1 ? P.vel : (P.axis || Cam.up)).normalize();
        _t.subVectors(Cam.pos, P.pos).normalize();
        _s.crossVectors(_a, _t).normalize();
        if (_s.lengthSq() < 1e-6) _s.copy(Cam.up);
        _r.copy(_a); _u.copy(_s);
        w = size * P.stretch; h = size;
      } else {
        _r.copy(P.right); _u.copy(P.up);
      }
      const masked = P.kind === 'sprite' || P.kind === 'creature' || P.kind.charCodeAt(1) === 95;
      if (masked && alpha < 1) { w *= Math.max(0.02, alpha); h *= Math.max(0.02, alpha); }
      const col = P.c0 === P.c1 ? P.c0 : lerpC(P.c0, P.c1, t);
      const a = masked ? (col[3] ?? 1) : (col[3] ?? 1) * alpha;
      this.batches[P.kind].pushBasis(P.spr, P.pos, _r, _u, w * (P.flip ? -1 : 1), h, col[0], col[1], col[2], a, 0, 0, P.glow);
    };
    for (const D of this.decals) draw(D);
    for (const P of this.parts) if (P.delay <= 0) draw(P);
  }
  // a creature drawn from another sheet than this map's own gets a batch of its own (the Descent draws on every sheet)
  kindFor(atlas) {
    if (!atlas || atlas === this.mainAtlas || !Atlas.tex[atlas]) return 'creature';
    const k = 'c_' + atlas; if (!this.batches[k]) this.batches[k] = new SpriteBatch(this.scene0, 'sprite', atlas, 900, 4);
    return k;
  }
  end() { for (const b of Object.values(this.batches)) b.end(); }
  tickDecals(dt) { for (const d of this.decals) d.age += dt; }

  // ================================================================== effects (three-space vectors, colours [r,g,b])
  flash(pos, color, radius, life = 0.12, light = true) {
    const c = [...color];
    this.add({ pos: pos.clone(), life: Math.max(0.05, life), size0: radius * 1.6, size1: radius * 2.4, rot: rnd(0, 360), c0: [...lerpC(c, [1, 1, 1], 0.25)], c1: [c[0], c[1], c[2], 1], fadeOut: 0.6, tex: Math.random() < 0.5 ? 'FX_Star' : 'FX_Star2', glow: 0.6 });
    if (light) this.add({ pos: pos.clone(), life: Math.max(0.05, life), size0: radius * 4, size1: radius * 5, c0: [c[0], c[1], c[2], 0.9], c1: [c[0], c[1], c[2], 0], tex: 'FX_Glow', kind: 'add', glow: 2 });
  }
  glowAt(pos, color, size, life) {
    this.add({ pos: pos.clone(), life, size0: size, size1: size * 1.3, c0: [color[0], color[1], color[2], 1], c1: [color[0], color[1], color[2], 0], fadeOut: 0.8, tex: 'FX_Glow', kind: 'add', glow: 2 });
  }
  puff(pos, color, size, life, vel = null) {
    this.add({ pos: pos.clone(), vel: (vel ? vel.clone() : new THREE.Vector3()).add(new THREE.Vector3(0, 40, 0)), drag: 2, life, size0: size * 0.6, size1: size * 1.4, rot: rnd(0, 360), rotVel: rnd(-60, 60), c0: [color[0], color[1], color[2], 0.9], c1: [color[0], color[1], color[2], 0], fadeOut: 0.7, tex: 'FX_Puff' });
  }
  explosion(pos, radius, color) {
    const R = Math.max(60, radius);
    const ground = this.groundY(pos, R + 200);
    this.add({ pos: pos.clone(), life: 0.14, size0: R * 0.7, size1: R * 1.3, rot: rnd(0, 360), c0: [1, 0.95, 0.8, 1], c1: [...lerpC(color, [1, 0.6, 0.15], 0.5)], fadeOut: 0.5, tex: 'FX_Star', glow: 1.2 });
    this.add({ pos: pos.clone(), life: 0.3, size0: R * 1.8, size1: R * 2.4, c0: [...lerpC(color, [1, 0.7, 0.3], 0.5)], c1: [color[0], color[1], color[2], 0], fadeOut: 0.4, tex: 'FX_Glow', kind: 'add', glow: 2.5 });
    const puffs = Math.min(9, Math.max(4, Math.round(R / 45)));
    for (let i = 0; i < puffs; i++) {
      const d = vrand(); d.y = d.y * 0.6 + 0.35;
      this.add({ pos: pos.clone().addScaledVector(d, R * 0.2), vel: d.clone().multiplyScalar(R * rnd(1.1, 2.0)).add(new THREE.Vector3(0, 60, 0)), drag: 3.5, gravity: -60, life: rnd(0.4, 0.75),
        size0: R * rnd(0.28, 0.42), size1: R * rnd(0.5, 0.75), rot: rnd(0, 360), rotVel: rnd(-60, 60), c0: [1, 0.62, 0.18, 1], c1: [0.16, 0.13, 0.13, 0.9], fadeOut: 0.45, tex: 'FX_Puff' });
    }
    for (let i = 0; i < 10; i++) {
      const v = vrand().add(new THREE.Vector3(0, 0.7, 0)).normalize().multiplyScalar(rnd(900, 1900));
      this.add({ mode: 'streak', pos: pos.clone(), vel: v, gravity: 1800, life: rnd(0.35, 0.7), size0: 10, size1: 10, stretch: 6, c0: [1, 0.85, 0.4, 1], c1: [1, 0.4, 0.1, 1], groundY: ground, tex: 'FX_Spark', glow: 1 });
    }
    if (ground > -1e8 && pos.y - ground < R) {
      this.ring(new THREE.Vector3(pos.x, ground + 4, pos.z), R, lerpC(color, [1, 1, 1], 0.4), 0.26);
      this.decal('FX_Scorch', new THREE.Vector3(pos.x, ground, pos.z), UP, R * 0.9, [1, 1, 1, 1], 30);
    }
  }
  tracer(a, b, color, width = 5, life = 0.06) {
    const d = new THREE.Vector3().subVectors(b, a);
    const len = d.length();
    if (len < 1) return;
    d.divideScalar(len);
    this.add({ mode: 'streak', axis: d.clone(), pos: a.clone().add(b).multiplyScalar(0.5), life, size0: width * 0.7, size1: width * 0.7, stretch: len / Math.max(width * 0.7, 0.1),
      c0: [color[0], color[1], color[2], 0.55], c1: [color[0], color[1], color[2], 0], fadeOut: 1, tex: 'FX_Spark', kind: 'add', glow: 2 });
    if (len > 300) {
      const sz = width * 1.4;
      this.add({ mode: 'streak', pos: a.clone().addScaledVector(d, 120), vel: d.clone().multiplyScalar(26000), life: Math.min((len - 150) / 26000, 0.25), size0: sz, size1: sz, stretch: 280 / sz,
        c0: [...lerpC(color, [1, 1, 1], 0.5)], c1: [color[0], color[1], color[2], 1], fadeOut: 0, tex: 'FX_Spark', kind: 'add', glow: 3 });
    }
  }
  arc(a, b, color) {
    const segs = Math.min(10, Math.max(2, Math.round(a.distanceTo(b) / 160)));
    let prev = a.clone();
    for (let i = 1; i <= segs; i++) {
      const next = a.clone().lerp(b, i / segs);
      if (i < segs) next.addScaledVector(vrand(), 40);
      const d = next.clone().sub(prev);
      this.add({ mode: 'streak', axis: d.clone().normalize(), pos: prev.clone().add(next).multiplyScalar(0.5), life: 0.12, size0: 26, size1: 26, stretch: d.length() / 26,
        c0: [...lerpC(color, [1, 1, 1], 0.4)], c1: [color[0], color[1], color[2], 0], fadeOut: 0.6, tex: 'FX_Bolt', kind: 'add', glow: 3 });
      prev = next;
    }
    this.add({ pos: b.clone(), life: 0.15, size0: 90, size1: 140, c0: [color[0], color[1], color[2], 1], c1: [color[0], color[1], color[2], 0], tex: 'FX_Glow', kind: 'add', glow: 2 });
  }
  // ------------------------------------------------------------------ the effect kit
  // Every kind of effect has its own shape, so you can tell what just happened without reading a number:
  // fire is tongues of flame and embers, frost is a crystal and flying shards, lightning comes down from above and forks
  // along the ground, blood sprays, a blow to the ground cracks it and throws dust, and anything that marks an area is a
  // turning circle of script. A plain ring is only ever the front of a shockwave.
  floorAt(pos) { const g = this.groundY(pos, 700); return new THREE.Vector3(pos.x, g > -1e8 ? g + 3 : pos.y, pos.z); }
  ground(pos, tex, r0, r1, color, life, o = {}) {
    const r = new THREE.Vector3(), u = new THREE.Vector3(); decalBasis(UP, rnd(0, 360), r, u);
    return this.add(Object.assign({ mode: 'fixed', right: r, up: u, pos: pos.clone().add(new THREE.Vector3(0, 1 + (this.serial++ % 8) * 0.2, 0)), life, size0: r0 * 2, size1: r1 * 2,
      c0: [color[0], color[1], color[2], color[3] ?? 1], c1: [color[0], color[1], color[2], 0], fadeOut: 0.6, tex, kind: 'add', glow: 2 }, o));
  }
  // the front of a blast: a hard thin line racing out, a fainter one after it, and a skirt of dust it kicks up
  ring(pos, radius, color, life = 0.35) {
    const c = lerpC(color, [1, 1, 1], 0.35);
    this.ground(pos, 'FX_Shock', radius * 0.25, radius, c, life, { glow: 2.4 });
    this.ground(pos, 'FX_Ring', radius * 0.1, radius * 0.8, [color[0], color[1], color[2], 0.5], life * 1.25, { delay: life * 0.15 });
    const n = Math.min(12, Math.max(5, Math.round(radius / 45)));
    for (let i = 0; i < n; i++) { const a = (i + Math.random()) / n * 6.283, out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      this.add({ pos: pos.clone().addScaledVector(out, radius * 0.2).add(new THREE.Vector3(0, 8, 0)), vel: out.multiplyScalar(radius / Math.max(0.12, life) * 0.9).add(new THREE.Vector3(0, rnd(20, 70), 0)), drag: 3.2, life: life * rnd(1.1, 1.6),
        size0: radius * 0.1, size1: radius * 0.34, rot: rnd(0, 360), rotVel: rnd(-50, 50), c0: [color[0] * 0.5 + 0.4, color[1] * 0.5 + 0.4, color[2] * 0.5 + 0.4, 0.55], c1: [color[0], color[1], color[2], 0], fadeOut: 0.7, tex: 'FX_Smoke' }); }
  }
  fireBurst(pos, R, color = [1, 0.5, 0.12]) {
    const f = this.floorAt(pos), hot = lerpC(color, [1, 0.9, 0.45], 0.45);
    this.ground(f, 'FX_FireRing', R * 0.25, R, hot, 0.38, { glow: 2.6 });
    this.ground(f, 'FX_Disc', R * 0.3, R * 0.8, [color[0], color[1], color[2], 0.35], 0.3);
    const n = Math.min(16, Math.max(7, Math.round(R / 28)));
    for (let i = 0; i < n; i++) { const a = (i + Math.random()) / n * 6.283, d = R * rnd(0.25, 0.9), h = R * rnd(0.2, 0.42);
      this.add({ pos: new THREE.Vector3(f.x + Math.cos(a) * d, f.y + h * 0.4, f.z + Math.sin(a) * d), vel: new THREE.Vector3(Math.cos(a) * 60, rnd(160, 320), Math.sin(a) * 60), drag: 1.5, delay: d / R * 0.12, life: rnd(0.35, 0.6),
        size0: h, size1: h * 0.5, rot: rnd(-12, 12), c0: [hot[0], hot[1], hot[2], 1], c1: [color[0], color[1] * 0.5, color[2] * 0.3, 1], fadeOut: 0.5, tex: 'FX_FlameUp', glow: 1.3 }); }
    for (let i = 0; i < 12; i++) { const v = vrand(); v.y = Math.abs(v.y) + 0.6; this.add({ mode: 'streak', pos: f.clone().add(new THREE.Vector3(rnd(-R, R) * 0.5, 20, rnd(-R, R) * 0.5)), vel: v.normalize().multiplyScalar(rnd(250, 700)), gravity: -160, drag: 1.2, life: rnd(0.5, 1.0), size0: 7, size1: 3, stretch: 3, c0: [1, 0.85, 0.4, 1], c1: [1, 0.3, 0.05, 1], fadeOut: 0.5, tex: 'FX_Spark', kind: 'add', glow: 2 }); }
    for (let i = 0; i < 4; i++) this.add({ pos: f.clone().add(new THREE.Vector3(rnd(-R, R) * 0.4, R * 0.3, rnd(-R, R) * 0.4)), vel: new THREE.Vector3(0, rnd(120, 220), 0), drag: 1, delay: 0.15, life: rnd(0.8, 1.3), size0: R * 0.3, size1: R * 0.7, rot: rnd(0, 360), rotVel: rnd(-30, 30), c0: [0.16, 0.13, 0.13, 0.7], c1: [0.1, 0.1, 0.1, 0], fadeOut: 0.7, tex: 'FX_Smoke' });
    this.glowAt(f.clone().add(new THREE.Vector3(0, 60, 0)), color, R * 2.6, 0.3);
    this.decal('FX_Scorch', f, UP, R * 0.9, [1, 1, 1, 0.9], 14);
  }
  frostBurst(pos, R, color = [0.55, 0.85, 1]) {
    const f = this.floorAt(pos), pale = lerpC(color, [1, 1, 1], 0.6);
    this.ground(f, 'FX_Snow', R * 0.2, R, pale, 0.55, { glow: 2.2, fadeOut: 0.5 });
    this.ground(f, 'FX_Snow', R * 0.9, R * 0.95, [color[0], color[1], color[2], 0.5], 2.2, { kind: 'fx', glow: 0.6, fadeOut: 0.4, delay: 0.2 });   // the rime it leaves
    const n = Math.min(18, Math.max(8, Math.round(R / 24)));
    for (let i = 0; i < n; i++) { const a = (i + Math.random()) / n * 6.283, v = new THREE.Vector3(Math.cos(a), rnd(0.15, 0.9), Math.sin(a)).normalize().multiplyScalar(R * rnd(2.6, 4.4));
      this.add({ mode: 'streak', pos: f.clone().add(new THREE.Vector3(0, 30, 0)), vel: v, drag: 3.5, gravity: 500, life: rnd(0.3, 0.55), size0: rnd(9, 16), size1: 4, stretch: 4, c0: [1, 1, 1, 1], c1: [color[0], color[1], color[2], 1], fadeOut: 0.4, tex: 'FX_Shard', glow: 1.4 }); }
    for (let i = 0; i < 6; i++) { const a = rnd(0, 6.283); this.add({ pos: f.clone().add(new THREE.Vector3(Math.cos(a) * R * 0.4, 30, Math.sin(a) * R * 0.4)), vel: new THREE.Vector3(Math.cos(a) * R, 30, Math.sin(a) * R), drag: 3, life: rnd(0.6, 1), size0: R * 0.25, size1: R * 0.6, rot: rnd(0, 360), c0: [0.9, 0.96, 1, 0.6], c1: [0.8, 0.9, 1, 0], fadeOut: 0.7, tex: 'FX_Smoke' }); }
    this.glowAt(f.clone().add(new THREE.Vector3(0, 50, 0)), color, R * 2.2, 0.25);
  }
  // lightning: a bolt down from overhead, a white core, and forks that run out along the ground from where it lands
  shockStrike(pos, R, color = [0.6, 0.8, 1]) {
    const f = this.floorAt(pos), top = f.clone().add(new THREE.Vector3(rnd(-120, 120), 1100, rnd(-120, 120)));
    this.arc(top, f, color); this.arc(top, f, [1, 1, 1]);
    const n = Math.min(8, Math.max(4, Math.round(R / 60)));
    for (let i = 0; i < n; i++) { const a = (i + Math.random() * 0.6) / n * 6.283, L = R * rnd(0.6, 1);
      const r = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), u = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
      this.add({ mode: 'fixed', right: r, up: u, pos: f.clone().addScaledVector(r, L * 0.5), life: rnd(0.16, 0.3), delay: rnd(0, 0.05), size0: L, size1: L * 1.1, c0: [1, 1, 1, 1], c1: [color[0], color[1], color[2], 0], fadeOut: 0.5, tex: 'FX_Zap', kind: 'add', glow: 3 }); }
    this.add({ pos: f.clone().add(new THREE.Vector3(0, 30, 0)), life: 0.12, size0: R * 0.7, size1: R * 1.1, rot: rnd(0, 360), c0: [1, 1, 1, 1], c1: [color[0], color[1], color[2], 0], tex: 'FX_Star2', kind: 'add', glow: 3 });
    this.sparks(f, UP, color, 10); this.glowAt(f.clone().add(new THREE.Vector3(0, 60, 0)), color, R * 3, 0.18);
    this.decal('FX_Scorch', f, UP, Math.min(90, R * 0.35), [1, 1, 1, 0.8], 10);
  }
  bloodBurst(pos, R, color = [0.75, 0.05, 0.08]) {
    const f = this.floorAt(pos), g = f.y;
    const n = Math.min(18, Math.max(8, Math.round(R / 22)));
    for (let i = 0; i < n; i++) { const a = (i + Math.random()) / n * 6.283, v = new THREE.Vector3(Math.cos(a), rnd(0.5, 1.4), Math.sin(a)).normalize().multiplyScalar(R * rnd(2.2, 3.6));
      this.add({ mode: 'streak', pos: pos.clone(), vel: v, gravity: 1700, life: 1.2, size0: rnd(9, 15), size1: 8, stretch: 3, groundY: g, splat: i % 3 === 0, c0: [color[0], color[1], color[2], 1], fadeOut: 0.1, tex: 'FX_Drop' }); }
    for (let i = 0; i < 6; i++) this.add({ pos: pos.clone(), vel: vrand().multiplyScalar(R * rnd(0.8, 1.6)).add(new THREE.Vector3(0, 80, 0)), drag: 4, gravity: 300, life: rnd(0.3, 0.55), size0: R * 0.2, size1: R * 0.55, rot: rnd(0, 360), c0: [1, 1, 1, 1], c1: [0.7, 0.7, 0.7, 0], fadeOut: 0.6, tex: 'FX_BloodSpray' });
    this.add({ pos: pos.clone(), life: 0.5, size0: R * 0.5, size1: R * 1.3, rot: rnd(0, 360), c0: [color[0], color[1], color[2], 0.5], c1: [color[0] * 0.6, 0, 0, 0], fadeOut: 0.8, tex: 'FX_Smoke' });
    this.decal('FX_Blood_' + Math.floor(Math.random() * 4), f, UP, R * 0.8, [1, 1, 1, 1], 22);
  }
  // a blow to the ground: it cracks, dust rolls out low, and chips of it are thrown up
  quake(pos, R, color = [0.7, 0.6, 0.48]) {
    const f = this.floorAt(pos);
    this.decal('FX_Crack', f, UP, R * 1.1, [1, 1, 1, 0.9], 9);
    this.ground(f, 'FX_Shock', R * 0.2, R, lerpC(color, [1, 1, 1], 0.5), 0.3, { glow: 1.6 });
    this.dust(f, color, R * 0.5);
    for (let i = 0; i < 12; i++) { const a = rnd(0, 6.283), d = R * rnd(0.1, 0.7), sz = rnd(10, 22); this.add({ pos: new THREE.Vector3(f.x + Math.cos(a) * d, f.y + 6, f.z + Math.sin(a) * d), vel: new THREE.Vector3(Math.cos(a) * rnd(60, 220), rnd(380, 820), Math.sin(a) * rnd(60, 220)), gravity: 2100, life: 1.1, size0: sz, size1: sz, rot: rnd(0, 360), rotVel: rnd(-500, 500), groundY: f.y, bounce: 0.3, fadeOut: 0.25, c0: [color[0] * 0.55, color[1] * 0.55, color[2] * 0.55, 1], tex: 'FX_Hole', kind: 'sprite' }); }
  }
  // a turning circle of script on the floor: an aura, a ward, a field that lasts
  rune(pos, R, color, life = 0.8) {
    const f = this.floorAt(pos);
    this.ground(f, 'FX_Rune', R * 0.85, R, color, life, { spin: 0.9, fadeIn: 0.12, fadeOut: 0.4, glow: 2 });
    this.ground(f, 'FX_Disc', R * 0.9, R * 0.9, [color[0], color[1], color[2], 0.12], life, { fadeIn: 0.12, fadeOut: 0.4, glow: 1 });
  }
  heal(pos, color = [0.5, 1, 0.6]) {
    for (let i = 0; i < 5; i++) this.add({ pos: pos.clone().add(new THREE.Vector3(rnd(-40, 40), rnd(-50, 10), rnd(-40, 40))), vel: new THREE.Vector3(0, rnd(90, 170), 0), drag: 0.8, delay: i * 0.05, life: rnd(0.6, 0.9), size0: rnd(12, 20), size1: 8, c0: [color[0], color[1], color[2], 1], c1: [color[0], color[1], color[2], 0], fadeOut: 0.6, tex: 'FX_Cross', kind: 'add', glow: 2 });
  }
  gold(pos, R = 160) {
    const f = this.floorAt(pos); this.coins(pos, 8);
    this.ground(f, 'FX_Shock', R * 0.2, R, [1, 0.85, 0.3], 0.3);
    for (let i = 0; i < 6; i++) this.add({ pos: pos.clone().add(new THREE.Vector3(rnd(-50, 50), rnd(-20, 60), rnd(-50, 50))), delay: i * 0.04, life: 0.3, size0: 10, size1: 44, rot: rnd(0, 360), rotVel: 200, c0: [1, 0.95, 0.6, 1], c1: [1, 0.8, 0.2, 0], fadeOut: 0.6, tex: 'FX_Star2', kind: 'add', glow: 2.4 });
  }
  // a killing mark: a skull that jumps up off the body and is gone
  execute(pos, color = [1, 0.3, 0.25]) {
    this.add({ pos: pos.clone().add(new THREE.Vector3(0, 40, 0)), vel: new THREE.Vector3(0, 240, 0), drag: 3, life: 0.6, size0: 46, size1: 90, c0: [1, 1, 1, 1], c1: [color[0], color[1], color[2], 0], fadeOut: 0.5, tex: 'FX_SkullFx', glow: 1.2 });
    this.add({ pos: pos.clone().add(new THREE.Vector3(0, 40, 0)), life: 0.14, size0: 120, size1: 200, rot: rnd(0, 360), c0: [color[0], color[1], color[2], 1], c1: [color[0], color[1], color[2], 0], tex: 'FX_Star', kind: 'add', glow: 2 });
  }
  gibs(pos, body, scale, count) {
    const ground = this.groundY(pos, 900);
    const kinds = ['FX_Gib_Meat_0', 'FX_Gib_Meat_1', 'FX_Gib_Bone', 'FX_Gib_Meat_0', 'FX_Gib_Eye', 'FX_Gib_Meat_1'];
    const n = Math.min(40, Math.max(3, count));
    for (let i = 0; i < n; i++) {
      const v = vrand(); v.y = v.y * 0.4 + 0.9;
      const sz = rnd(16, 30) * scale;
      const skin = i % 4 === 1 ? [...lerpC(body, [1, 1, 1], 0.15)] : [1, 1, 1, 1];
      this.add({ pos: pos.clone().addScaledVector(vrand(), 25 * scale), vel: v.normalize().multiplyScalar(rnd(400, 950) * Math.sqrt(scale)), gravity: 2200, life: rnd(9, 14),
        size0: sz, size1: sz, rot: rnd(0, 360), rotVel: rnd(-720, 720), groundY: ground, bounce: 0.3, settle: true, splat: i % 3 === 0, fadeOut: 0.1, c0: skin, tex: kinds[i % kinds.length], kind: 'sprite' });
    }
    for (let i = 0; i < 8; i++) {
      this.add({ pos: pos.clone(), vel: vrand().multiplyScalar(rnd(150, 500) * scale).add(new THREE.Vector3(0, 150, 0)), drag: 4, gravity: 500, life: rnd(0.3, 0.55),
        size0: 40 * scale, size1: 90 * scale, rot: rnd(0, 360), c0: [1, 1, 1, 1], c1: [0.7, 0.7, 0.7, 0], fadeOut: 0.6, tex: 'FX_BloodSpray' });
    }
    this.add({ pos: pos.clone(), life: 0.12, size0: 110 * scale, size1: 160 * scale, rot: rnd(0, 360), c0: [1, 1, 1, 1], c1: [1, 1, 1, 0], tex: 'FX_Slash', glow: 0.5 });
    this.bloodPool(pos, 110 * scale);
  }
  fleshHit(pos, dir, scale, heavy) {
    const d = dir.lengthSq() > 0 ? dir.clone().normalize() : UP.clone();
    const s0 = (heavy ? 90 : 60) * scale;
    this.add({ pos: pos.clone().addScaledVector(d, -10), life: heavy ? 0.11 : 0.08, size0: s0, size1: s0 * 1.35, rot: rnd(0, 360), c0: [1, 1, 1, 1], c1: [1, 1, 1, 0], fadeOut: 0.4, tex: 'FX_Slash', glow: 0.5 });
    for (let i = 0; i < (heavy ? 5 : 3); i++) {
      const v = d.clone().addScaledVector(vrand(), 0.6).add(new THREE.Vector3(0, 0.25, 0)).normalize().multiplyScalar(rnd(300, 700));
      const sz = rnd(22, 40) * scale;
      this.add({ pos: pos.clone(), vel: v, drag: 5, gravity: 900, life: rnd(0.22, 0.4), size0: sz, size1: sz * 1.8, rot: rnd(0, 360), c0: [1, 1, 1, 1], c1: [0.8, 0.8, 0.8, 0], fadeOut: 0.5, tex: 'FX_BloodSpray' });
    }
    const ground = this.groundY(pos, 600);
    for (let i = 0; i < (heavy ? 3 : 1); i++) {
      const v = d.clone().addScaledVector(vrand(), 0.5).add(new THREE.Vector3(0, 0.6, 0)).normalize().multiplyScalar(rnd(250, 550));
      const sz = rnd(9, 15);
      this.add({ pos: pos.clone(), vel: v, gravity: 2000, life: 1.5, size0: sz, size1: sz, groundY: ground, splat: true, c0: [0.75, 0.06, 0.09, 1], fadeOut: 0, tex: 'FX_Disc' });
    }
  }
  sparks(pos, normal, color, count) {
    const n = normal.lengthSq() > 0 ? normal.clone().normalize() : UP.clone();
    for (let i = 0; i < Math.max(2, count); i++) {
      this.add({ mode: 'streak', pos: pos.clone().addScaledVector(n, 2), vel: n.clone().addScaledVector(vrand(), 0.75).normalize().multiplyScalar(rnd(500, 1300)), gravity: 1600, drag: 2,
        life: rnd(0.12, 0.28), size0: 5, size1: 5, stretch: 7, c0: [...lerpC(color, [1, 1, 1], 0.4)], c1: [color[0], color[1], color[2], 1], fadeOut: 0.3, tex: 'FX_Spark', kind: 'add', glow: 2 });
    }
    this.add({ pos: pos.clone().addScaledVector(n, 4), life: 0.07, size0: 26, size1: 36, rot: rnd(0, 360), c0: [1, 0.95, 0.7, 1], c1: [1, 0.7, 0.3, 0], tex: 'FX_Star2', glow: 0.8 });
    this.add({ pos: pos.clone().addScaledVector(n, 8), vel: n.clone().multiplyScalar(90).add(new THREE.Vector3(0, 30, 0)), drag: 2, life: rnd(0.35, 0.6), size0: 18, size1: 46, rot: rnd(0, 360),
      c0: [0.75, 0.72, 0.66, 0.85], c1: [0.6, 0.58, 0.55, 0], tex: 'FX_Puff' });
    this.decal('FX_Hole', pos, n, rnd(9, 14), [1, 1, 1, 1], 14);
  }
  dust(pos, color, radius) {
    const n = Math.min(10, Math.max(3, Math.round(radius / 18)));
    const light = lerpC(color, [0.85, 0.8, 0.7], 0.55);
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2);
      const out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      this.add({ pos: pos.clone().addScaledVector(out, radius * 0.3).add(new THREE.Vector3(0, 10, 0)), vel: out.multiplyScalar(radius * rnd(2.5, 4)).add(new THREE.Vector3(0, rnd(40, 120), 0)),
        drag: 4, life: rnd(0.45, 0.8), size0: radius * 0.5, size1: radius * 1.1, rot: rnd(0, 360), rotVel: rnd(-40, 40), c0: [light[0], light[1], light[2], 0.9], c1: [light[0], light[1], light[2], 0], fadeOut: 0.6, tex: 'FX_Puff' });
    }
  }
  debris(tex, pos, vel, size, life, spin, settle, sprObj = null, atlasKind = 'sprite', flip = false) {
    this.add({ pos: pos.clone(), vel: vel.clone(), gravity: 2100, life, size0: size, size1: size, rot: rnd(-20, 20), rotVel: spin, groundY: this.groundY(pos, 900), bounce: 0.35, settle,
      fadeOut: 0.1, tex, sprObj, kind: atlasKind, flip, stretch: sprObj ? sprObj.h / sprObj.w : 1 });
  }
  coins(pos, count) {
    const ground = this.groundY(pos, 600);
    for (let i = 0; i < Math.min(12, Math.max(1, count)); i++) {
      const v = vrand(); v.y = v.y * 0.3 + 1.2;
      this.add({ pos: pos.clone(), vel: v.normalize().multiplyScalar(rnd(350, 650)), gravity: 2000, life: rnd(0.7, 1), size0: 16, size1: 16, groundY: ground, bounce: 0.45, rotVel: rnd(-300, 300), fadeOut: 0.3, tex: 'FX_Coin', glow: 0.4 });
    }
  }
  decal(tex, pos, normal, size, tint = [1, 1, 1, 1], life = 20, translucent = false) {
    if (this.sap && tex.startsWith('FX_Blood_')) { const S = this.sap; tex = 'FX_Puff'; tint = [S.flesh[0] * 0.5 + 0.05, S.flesh[1] * 0.5 + 0.04, S.flesh[2] * 0.5 + 0.03, 0.85]; }
    const n = normal.clone().normalize();
    const r = new THREE.Vector3(), u = new THREE.Vector3();
    decalBasis(n, rnd(0, 360), r, u);
    const D = { mode: 'fixed', right: r, up: u, pos: pos.clone().addScaledVector(n, 0.8 + (this.serial++ % 12) * 0.12), life, age: 0, delay: 0, size0: size, size1: size, stretch: 1,
      c0: tint, c1: tint, fadeIn: 0, fadeOut: 0.08, kind: translucent ? 'fx' : 'sprite', spr: sprite(tex), glow: 0, rot: 0 };
    this.decals.push(D);
    if (this.decals.length > 160) this.decals.shift();
  }
  bloodPool(near, size) {
    const h = this.game.phys.raycastDown(new THREE.Vector3(near.x, near.y + 20, near.z), 920);
    if (!h) return;
    this.decal('FX_Blood_' + Math.floor(Math.random() * 4), h.point, h.normal, size, [1, 1, 1, 1], 26);
  }
}
