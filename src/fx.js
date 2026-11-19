// Flat-vector sprite effects (port of ADMHFx): muzzle stars, white impact crescents, blood sprays & splats,
// gibs that bounce and settle, puffs, shock rings, tracers, lightning, coins and persistent decals.
// CPU-simulated particles drawn through three instanced sprite batches (masked / translucent / additive).
import * as THREE from 'three';
import { SpriteBatch, sprite, Cam } from './render.js';

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
      creature: new SpriteBatch(scene, 'sprite', 'creatures', 600, 4),
    };
    this.parts = [];
    this.decals = [];
    this.serial = 0;
  }
  groundY(p, maxDown = 600) {
    const h = this.game.phys.raycastDown(new THREE.Vector3(p.x, p.y + 20, p.z), maxDown + 20);
    return h ? h.point.y : -1e9;
  }
  add(o) {
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
        if (P.groundY > -1e8 && P.pos.y < P.groundY + 2 && P.vel.y < 0) {
          P.pos.y = P.groundY + 2;
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
      const masked = P.kind === 'sprite' || P.kind === 'creature';
      if (masked && alpha < 1) { w *= Math.max(0.02, alpha); h *= Math.max(0.02, alpha); }
      const col = P.c0 === P.c1 ? P.c0 : lerpC(P.c0, P.c1, t);
      const a = masked ? (col[3] ?? 1) : (col[3] ?? 1) * alpha;
      this.batches[P.kind].pushBasis(P.spr, P.pos, _r, _u, w * (P.flip ? -1 : 1), h, col[0], col[1], col[2], a, 0, 0, P.glow);
    };
    for (const D of this.decals) draw(D);
    for (const P of this.parts) if (P.delay <= 0) draw(P);
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
    this.add({ pos: pos.clone(), life: 0.16, size0: R * 1.2, size1: R * 2.2, rot: rnd(0, 360), c0: [1, 0.95, 0.8, 1], c1: [...lerpC(color, [1, 0.6, 0.15], 0.5)], fadeOut: 0.5, tex: 'FX_Star', glow: 1.2 });
    this.add({ pos: pos.clone(), life: 0.45, size0: R * 3.5, size1: R * 4.5, c0: [...lerpC(color, [1, 0.7, 0.3], 0.5)], c1: [color[0], color[1], color[2], 0], fadeOut: 0.4, tex: 'FX_Glow', kind: 'add', glow: 2.5 });
    const puffs = Math.min(14, Math.max(5, Math.round(R / 30)));
    for (let i = 0; i < puffs; i++) {
      const d = vrand(); d.y = d.y * 0.6 + 0.35;
      this.add({ pos: pos.clone().addScaledVector(d, R * 0.2), vel: d.clone().multiplyScalar(R * rnd(1.6, 3.2)).add(new THREE.Vector3(0, 80, 0)), drag: 3.5, gravity: -60, life: rnd(0.6, 1.1),
        size0: R * rnd(0.45, 0.7), size1: R * rnd(0.9, 1.3), rot: rnd(0, 360), rotVel: rnd(-60, 60), c0: [1, 0.62, 0.18, 1], c1: [0.16, 0.13, 0.13, 0.9], fadeOut: 0.45, tex: 'FX_Puff' });
    }
    for (let i = 0; i < 10; i++) {
      const v = vrand().add(new THREE.Vector3(0, 0.7, 0)).normalize().multiplyScalar(rnd(900, 1900));
      this.add({ mode: 'streak', pos: pos.clone(), vel: v, gravity: 1800, life: rnd(0.35, 0.7), size0: 10, size1: 10, stretch: 6, c0: [1, 0.85, 0.4, 1], c1: [1, 0.4, 0.1, 1], groundY: ground, tex: 'FX_Spark', glow: 1 });
    }
    if (ground > -1e8 && pos.y - ground < R) {
      this.ring(new THREE.Vector3(pos.x, ground + 4, pos.z), R * 1.1, lerpC(color, [1, 1, 1], 0.4), 0.3);
      this.decal('FX_Scorch', new THREE.Vector3(pos.x, ground, pos.z), UP, R * 1.4, [1, 1, 1, 1], 30);
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
  ring(pos, radius, color, life = 0.35) {
    const r = new THREE.Vector3(), u = new THREE.Vector3();
    decalBasis(UP, rnd(0, 360), r, u);
    this.add({ mode: 'fixed', right: r, up: u, pos: pos.clone().add(new THREE.Vector3(0, 3, 0)), life, size0: radius * 0.4, size1: radius * 2,
      c0: [...lerpC(color, [1, 1, 1], 0.3)], c1: [color[0], color[1], color[2], 0], fadeOut: 0.7, tex: 'FX_Ring', kind: 'add', glow: 2 });
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
