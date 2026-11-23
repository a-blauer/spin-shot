// 2D paper-cutout puppets: each creature is a FRONT-FACING stack of flat sprite parts (legs, arms, body, head,
// wings...) on pivots. The rig billboards around the vertical axis so it always faces the player, and is animated
// procedurally: a waddling walk (alternating leg lifts, body rock), breathing, arm sway, wind-up/lunge toward the
// camera, flinch, death fall.
import * as THREE from 'three';
import { sprite, Cam, Atlas } from './render.js';

let PARTS = null;
export function setParts(p) { PARTS = p; }

const LayerStep = 0.9;
const UP = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4();
const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _c = new THREE.Vector3();
const _right = new THREE.Vector3(), _toCam = new THREE.Vector3();
const D2R = Math.PI / 180;
const interpTo = (cur, tgt, dt, speed) => cur + (tgt - cur) * Math.min(1, dt * speed);

export class Puppet {
  constructor(creature, scale, tint, aura, auraSize) {
    this.parts = [];
    this.baseScale = scale;
    this.tint = tint.slice();
    this.aura = aura; this.auraSize = auraSize;
    let top = 0;
    for (const D of PARTS) {
      if (D.creature !== creature) continue;
      this.parts.push({ role: D.role, spr: sprite(D.tex), tex: D.tex, rest: [D.pivot[0], D.pivot[1]], layer: D.layer, off: D.offset, size: D.size, phase: Math.random() * 6, visible: true });
      top = Math.max(top, D.pivot[1] + D.offset[1] + D.size[1] * 0.5);
    }
    this.top = top;
    { const m = this.parts[0] && Atlas.meta[this.parts[0].tex]; this.atlas = m ? m.atlas : ''; }
    this.heightCm = Math.max(40, top) * scale;
    { const Hd = this.parts.find((q) => q.role === 'Head'); this.headFrac = Hd && top > 0 ? Math.min(0.9, Math.max(0.45, (Hd.rest[1] + Hd.off[1] - Hd.size[1] * 0.42) / top)) : 0.74; }   // where the head starts, as a fraction of the height: read off the art
    this.facing = Math.random() < 0.5 ? -1 : 1; this.time = 0; this.walk = Math.random() * 6;
    this.hurtT = 0; this.flashT = 0; this.windup = 0; this.lunge = 0;
    this.dying = false; this.deathT = 0; this.deathDir = 1;
    this.visible = true;
    this.state = null;
  }
  setTint(t) { this.tint = t.slice(); }
  // modifier looks: each one tints the cut-out and adds its own gear or effect in draw()
  setMods(names) {
    this.mods = names;
    const T = { Blazing: [0.62, 0.42, 0.36], Frozen: [0.62, 0.86, 1.12], Vampiric: [0.9, 0.82, 0.95], Splitting: [0.72, 1.05, 0.6], Hasted: [1.08, 1.04, 0.72], Armored: [0.86, 0.88, 0.92], Blinking: [0.82, 0.62, 1.12], Gilded: [1.3, 1.02, 0.42], Volatile: [1.1, 0.62, 0.55], Shielded: [0.9, 0.98, 1.1] };
    for (const n of names) { const m = T[n]; if (m) this.tint = [this.tint[0] * m[0], this.tint[1] * m[1], this.tint[2] * m[2]]; }
  }
  hurt(strength) { this.hurtSide = Math.random() < 0.5 ? -1 : 1; this.hurtT = Math.max(this.hurtT, Math.min(1, Math.max(0.2, strength))); this.flashT = 0.085; }
  startDeath(fromDir) {
    if (this.dying) return;
    this.dying = true; this.deathT = 0;
    let side = this.facing;
    const d = fromDir.dot(Cam.right);
    if (Math.abs(d) > 0.15) side = d > 0 ? 1 : -1;
    this.deathDir = side;
  }
  popPart(roles) {
    const c = this.parts.filter((p) => roles.includes(p.role) && p.visible);
    if (!c.length) return null;
    const p = c[Math.floor(Math.random() * c.length)]; p.visible = false; return p;
  }
  partWorld(P) { const out = new THREE.Vector3(); if (!this.feet || !this.toCam) return out; this.partTransform(P, out, _x, _y); return out; }
  // open wound where a shot landed: stored in the body part's own space so it rides the animation
  addWound(at) {
    const B = this.parts.find((p) => p.role === 'Body' && p.visible); if (!B || !this.feet) return;
    this.partTransform(B, _c, _x, _y);
    const d = at.clone().sub(_c);
    const u = Math.max(-0.42, Math.min(0.42, d.dot(_x) / Math.max(_x.lengthSq(), 1))), v = Math.max(-0.42, Math.min(0.42, d.dot(_y) / Math.max(_y.lengthSq(), 1)));
    this.wounds = this.wounds || [];
    if (this.wounds.length >= 6) this.wounds.shift();
    this.wounds.push({ u, v, s: 16 + Math.random() * 14, k: Math.floor(Math.random() * 4), part: B });
  }
  popHead() {
    for (const p of this.parts) if (p.role === 'Head' && p.visible) { p.visible = false; return p; }
    return null;
  }

  // S: { vel, grounded, flying, crawler, faceToward, windup, lunge, sink, frenzy, speedRef }
  tick(dt, feet, S) {
    this.time += dt;
    this.feet = feet;
    _toCam.set(Cam.pos.x - feet.x, 0, Cam.pos.z - feet.z);
    if (_toCam.lengthSq() < 1) _toCam.set(0, 0, 1);
    _toCam.normalize();
    _right.crossVectors(UP, _toCam); // = f x up with f = -toCam
    this.right = this.right || new THREE.Vector3(); this.right.copy(_right);
    this.toCam = this.toCam || new THREE.Vector3(); this.toCam.copy(_toCam);

    const speed = Math.hypot(S.vel.x, S.vel.z);
    const sideV = S.vel.x * _right.x + S.vel.z * _right.z;
    this.hurtT = Math.max(0, this.hurtT - dt * 4);
    if (this.flashT > 0) this.flashT -= dt;
    this.windup = interpTo(this.windup, S.windup || 0, dt, 14);
    this.lunge = interpTo(this.lunge, S.lunge || 0, dt, 22);
    const stride = Math.min(1.3, Math.max(0, speed / Math.max(S.speedRef || 200, 1)));
    this.stride = stride;
    this.walk += dt * (S.grounded ? 2.6 + speed / 46 : 2) * (1 + (S.frenzy || 0) * 0.4);
    this.S = S;
    if (this.seed === undefined) { this.seed = Math.random() * 100; this.amp = 0.8 + Math.random() * 0.5; }
    // idle life: a slow weight shift, plus a sharp twitch every few seconds
    this.idle = interpTo(this.idle || 0, stride < 0.15 ? 1 : 0, dt, 5);
    this.reach = interpTo(this.reach || 0, stride > 0.2 && !S.crawler && !S.flying ? 1 : 0, dt, 4);
    this.twitch = Math.pow(Math.max(0, Math.sin(this.time * 0.9 + this.seed)), 24);

    let offX = 0, offZ = 0, sqX = 1, sqZ = 1;
    const breath = Math.sin(this.time * 2.4) * 0.018;
    sqZ += breath; sqX -= breath * 0.5;
    const sw = Math.sin(this.walk);
    if (S.flying) offZ += Math.sin(this.time * 3) * 10;
    else if (S.crawler) offX += sw * 5 * stride;
    else { offZ += Math.abs(sw) * 13 * stride * this.amp; offX += sw * 7 * stride; }       // waddle: bob + side-to-side shift
    offX += Math.sin(this.time * 1.1 + this.seed) * 4 * this.idle; sqZ += Math.sin(this.time * 1.6 + this.seed) * 0.02 * this.idle - this.twitch * 0.04;
    // rock side to side with each step, lean into sideways movement
    let rock = S.flying ? Math.sin(this.time * 2.2) * 4 : sw * (S.crawler ? 4 : 10) * Math.min(stride, 1) * this.amp + Math.sin(this.time * 0.8 + this.seed) * 3 * this.idle + this.twitch * 6;
    this.lean = interpTo(this.lean || 0, Math.max(-1, Math.min(1, sideV / 400)) * -9, dt, 6);
    rock += this.lean * this.facing;
    // wind-up crouches and swells; the lunge pops the whole cut-out toward the camera
    sqZ += -this.windup * 0.07 + this.lunge * 0.14; sqX += this.windup * 0.06 + this.lunge * 0.14;
    offZ += this.lunge * 8;
    rock += this.hurtT * 12 * (this.hurtSide || 1);
    sqX += this.hurtT * 0.12; sqZ -= this.hurtT * 0.1;
    if (!S.grounded && !S.flying) { sqZ += 0.08; sqX -= 0.06; }
    offZ -= (S.sink || 0) * this.heightCm / Math.max(this.baseScale, 0.01) * 1.05;
    let deathRot = 0;
    if (this.dying) {
      this.deathT += dt;
      const A = Math.min(1, this.deathT / 0.32);
      deathRot = (1 - (1 - A) * (1 - A)) * 88;
      offZ += Math.sin(A * Math.PI) * 25;
      if (this.deathT > 0.9) offZ -= (this.deathT - 0.9) * 120;
    }
    this.dig = interpTo(this.dig || 0, S.digging || 0, dt, 10);
    if (this.dig > 0.01) { rock += Math.sin(this.time * 17) * 7 * this.dig; offX += Math.sin(this.time * 23) * 3 * this.dig; }   // struggling up out of the dirt
    this.sink = S.sink || 0;
    this.bodyRot = rock;
    this.rootPitch = rock * 0.5 * this.facing + (this.dying ? deathRot * this.deathDir : 0);
    this.sqX = sqX; this.sqZ = sqZ; this.offX = offX; this.offZ = offZ;
  }

  // per-part pose: [rotation (deg, clockwise), vertical offset, scale]
  partAngle(P) {
    const S = this.S || {}, sw = Math.sin(this.walk), cw = Math.cos(this.walk), st = this.stride, T = this.time;   // S is empty for an enemy killed on the frame it spawned
    const side = (P.role === 'ArmBack' || P.role === 'LegBack' || P.role === 'WingBack') ? -1 : (P.rest[0] < -1 && P.role === 'Prop' ? -1 : 1);
    let rot = 0, oz = 0, sc = 1;
    switch (P.role) {
      case 'LegFront': case 'LegBack': {
        const lift = Math.max(0, side * sw);
        const plant = Math.max(0, -side * sw);
        oz = lift * 22 * st * this.amp; rot = -side * (lift * 24 - plant * 10) * st * this.amp; sc = 1 - lift * 0.1 * st;
        rot += side * Math.sin(T * 0.8 + this.seed) * 3 * this.idle;
        if (!S.grounded && !S.flying) { rot = -side * 16; oz = 6; }
        break;
      }
      case 'ArmFront': case 'ArmBack': {
        const idle = Math.sin(T * 1.7 + P.phase) * 4 + (Math.sin(T * 0.9 + P.phase * 2 + this.seed) * 12 + this.twitch * side * -30) * this.idle;
        // walking: arms come up and grope toward the player, pumping in time with the legs
        const swing = S.crawler ? Math.max(0, -side * sw) * 34 * Math.max(st, 0.2) : (-side * sw * 26 * this.amp - 24 - Math.sin(T * 2.3 + P.phase) * 8) * this.reach;
        // raise outward on the wind-up, then slam down and forward (bigger = closer to the camera)
        rot = side * (idle + swing - this.windup * 50 + this.lunge * 34 - (this.dig || 0) * (95 + Math.sin(T * 14 + P.phase) * 30));   // digging: arms straight up, clawing
        oz = S.crawler ? Math.max(0, -side * sw) * 10 * st : 0;
        sc = 1 + this.lunge * 0.3 + this.windup * 0.06 + this.reach * (0.06 + Math.max(0, -side * sw) * 0.1);
        break;
      }
      case 'Head': rot = Math.sin(T * 1.3 + P.phase) * 4 + (Math.sin(T * 0.55 + this.seed) * 9 + this.twitch * 16) * this.idle - sw * 9 * st * this.amp + this.hurtT * 14 * (this.hurtSide || 1); oz = Math.abs(cw) * 6 * st - this.windup * 4; sc = 1 + this.lunge * 0.08; break;
      case 'Body': rot = this.bodyRot * 0.3; break;
      case 'WingFront': case 'WingBack': rot = -side * (Math.sin(T * 11) * 30 - 6); break;
      case 'Tail': rot = Math.sin(T * 3.5 + P.phase) * 14 + sw * 14 * st; sc = 1 + Math.sin(T * 9 + P.phase) * 0.08; break;
      default: rot = side * (Math.sin(T * 1.4 + P.phase) * 5 + sw * 8 * st - this.windup * 20 + this.lunge * 14) + this.bodyRot * 0.3; break;
    }
    return [rot, oz, sc];
  }

  // plane -> world for a part; returns center and axes (world)
  partTransform(P, outC, outX, outY) {
    const [rot, oz, sc] = this.partAngle(P);
    const a = -rot * D2R; // UE pitch(-Rot): CCW in the (right, up) plane
    const ca = Math.cos(a), sa = Math.sin(a);
    const px = P.rest[0], pz = P.rest[1] + oz;
    const cx = px + (ca * P.off[0] - sa * P.off[1]) * sc, cz = pz + (sa * P.off[0] + ca * P.off[1]) * sc;
    let ax = ca * P.size[0] * sc, az = sa * P.size[0] * sc;   // quad x axis
    let bx = -sa * P.size[1] * sc, bz = ca * P.size[1] * sc;  // quad y axis
    const s = this.baseScale, SX = s * this.sqX * this.facing, SZ = s * this.sqZ;
    const r = this.rootPitch * D2R, cr = Math.cos(r), sr = Math.sin(r);
    const rx = (x, z) => cr * x - sr * z, rz = (x, z) => sr * x + cr * z;
    const Cx = rx(cx * SX, cz * SZ), Cz = rz(cx * SX, cz * SZ);
    const Ax = rx(ax * SX, az * SZ), Az = rz(ax * SX, az * SZ);
    const Bx = rx(bx * SX, bz * SZ), Bz = rz(bx * SX, bz * SZ);
    const R = this.right, f = this.feet;
    const depth = P.layer * LayerStep * s;
    const ox = this.offX * this.facing * s, ozr = this.offZ * s;
    outC.set(f.x + R.x * (Cx + ox) + this.toCam.x * depth, f.y + Cz + ozr, f.z + R.z * (Cx + ox) + this.toCam.z * depth);
    outX.set(R.x * Ax, Az, R.z * Ax);
    outY.set(R.x * Bx, Bz, R.z * Bx);
  }

  // Gear and effects for modifiers, pinned to body parts so they move with the animation.
  drawMods(fx, add) {
    const T = this.time, s = this.baseScale, sd = this.seed || 0;
    const find = (role) => this.parts.find((p) => p.role === role && p.visible);
    const body = find('Body') || find('Head') || this.parts[0], head = find('Head') || body;
    // pin(part, u, v): point on a part in fractions of its size; leaves unit axes in _x/_y and the part's world size in pw/ph
    let pw = 1, ph = 1;
    const pin = (P, u, v, lift = 3) => { this.partTransform(P, _c, _x, _y); pw = _x.length(); ph = _y.length(); _c.addScaledVector(_x, u).addScaledVector(_y, v).addScaledVector(this.toCam, lift); _x.normalize(); _y.normalize(); return _c; };
    const flame = (P, u, v0, i, size, r, g, b) => { const t = (T * 1.5 + i * 0.37 + sd) % 1; pin(P, u + Math.sin(T * 5 + i) * 0.04, v0 + t * 0.55, 5); const z = size * s * (1 - t * 0.7); _t.copy(Cam.right).negate(); add.pushBasis(FLAME(), _c, Cam.up, _t, z * 1.5, z, r, g, b, 1 - t, 0, 0, 1.6); };
    for (const m of this.mods) switch (m) {
      case 'Armored': {
        pin(body, 0, 0.02, 3); const w = pw, h = ph;
        fx.pushBasis(DISC(), _c, _x, _y, w * 0.86, h * 0.74, 0.34, 0.37, 0.42, 1, 0, 0, 0);                    // breastplate rim
        pin(body, 0, 0.04, 4); fx.pushBasis(DISC(), _c, _x, _y, w * 0.74, h * 0.62, 0.58, 0.62, 0.68, 1, 0, 0, 0);
        pin(body, -0.12, 0.12, 5); fx.pushBasis(DISC(), _c, _x, _y, w * 0.2, h * 0.3, 0.8, 0.84, 0.88, 1, 0, 0, 0);  // shine
        pin(body, 0, -0.2, 5); fx.pushBasis(DISC(), _c, _x, _y, w * 0.8, h * 0.1, 0.3, 0.32, 0.36, 1, 0, 0, 0);      // belt plate
        for (const u of [-0.24, 0.24]) { pin(body, u, 0.22, 6); fx.pushBasis(DISC(), _c, _x, _y, 7 * s, 7 * s, 0.22, 0.24, 0.28, 1, 0, 0, 0); pin(body, u, -0.06, 6); fx.pushBasis(DISC(), _c, _x, _y, 7 * s, 7 * s, 0.22, 0.24, 0.28, 1, 0, 0, 0); }
        for (const role of ['ArmFront', 'ArmBack']) { const A = find(role); if (!A) continue; pin(A, 0, 0.36, 6); fx.pushBasis(DISC(), _c, _x, _y, 40 * s, 34 * s, 0.34, 0.37, 0.42, 1, 0, 0, 0); pin(A, 0, 0.38, 7); fx.pushBasis(DISC(), _c, _x, _y, 30 * s, 24 * s, 0.6, 0.64, 0.7, 1, 0, 0, 0); }
        break;
      }
      case 'Blazing': {
        for (let i = 0; i < 4; i++) flame(body, Math.sin(i * 2.4 + sd) * 0.36, -0.1, i, 48, 1, 0.5, 0.1);
        for (let i = 0; i < 3; i++) flame(head, Math.sin(i * 1.9 + sd) * 0.3, 0.2, i + 4, 40, 1, 0.62, 0.15);
        _c.set(this.feet.x, this.feet.y + 14 * s, this.feet.z); add.pushBasis(GLOW(), _c, Cam.right, Cam.up, 150 * s, 60 * s, 1, 0.4, 0.05, 0.6 + Math.sin(T * 9) * 0.15, 0, 0, 1.6);
        break;
      }
      case 'Volatile': {
        const beat = 0.5 + 0.5 * Math.sin(T * 9 + sd);
        pin(body, 0, 0, 2); add.pushBasis(GLOW(), _c, Cam.right, Cam.up, (110 + beat * 50) * s, (110 + beat * 50) * s, 1, 0.16, 0.06, 0.55 + beat * 0.35, 0, 0, 1.8);
        for (const u of [-0.16, 0, 0.16]) { pin(body, u, 0.02, 5); fx.pushBasis(DISC(), _c, _x, _y, 11 * s, 34 * s, 0.78, 0.1, 0.08, 1, 0, 0, 0); pin(body, u, 0.02 + 17 * s / Math.max(ph, 1), 6); fx.pushBasis(DISC(), _c, _x, _y, 9 * s, 6 * s, 0.95, 0.85, 0.6, 1, 0, 0, 0); }
        pin(body, 0, 0.02, 6); fx.pushBasis(DISC(), _c, _x, _y, 54 * s, 6 * s, 0.15, 0.1, 0.1, 1, 0, 0, 0);          // strap
        pin(body, 0.16, 0.02 + 26 * s / Math.max(ph, 1), 7); add.pushBasis(SPARK(), _c, Cam.right, Cam.up, (18 + beat * 14) * s, (18 + beat * 14) * s, 1, 0.8, 0.3, 1, 0, 0, 2.2);
        for (let i = 0; i < 3; i++) flame(head, Math.sin(i * 2.1 + sd) * 0.28, 0.25, i, 34, 1, 0.3, 0.08);
        break;
      }
      case 'Frozen': {
        const ice = (P, u, v, z, rot) => { pin(P, u, v, 5); const c = Math.cos(rot), n = Math.sin(rot); _t.copy(_x).multiplyScalar(c).addScaledVector(_y, n); _t2.copy(_y).multiplyScalar(c).addScaledVector(_x, -n); fx.pushBasis(STAR(), _c, _t, _t2, z * s * 0.55, z * s, 0.78, 0.93, 1, 1, 0, 0, 0.5); };
        ice(head, -0.3, 0.42, 34, 0.5); ice(head, 0.05, 0.5, 42, 0); ice(head, 0.34, 0.4, 30, -0.5); ice(body, -0.42, 0.3, 30, 0.9); ice(body, 0.42, 0.28, 34, -0.9); ice(body, 0.1, -0.1, 22, 0.2);
        for (let i = 0; i < 3; i++) { const t = (T * 0.6 + i * 0.33 + sd) % 1; pin(body, Math.sin(i * 3 + sd) * 0.5, 0.2 - t * 0.8, 6); fx.pushBasis(PUFF(), _c, Cam.right, Cam.up, (30 + t * 30) * s, (30 + t * 30) * s, 0.8, 0.95, 1, (1 - t) * 0.5, 0, 0, 0.3); }
        break;
      }
      case 'Shielded': {
        if (!this.shieldOn) break;
        _c.set(this.feet.x + this.toCam.x * 12, this.feet.y + this.top * 0.5 * s, this.feet.z + this.toCam.z * 12);
        const z = this.top * s * (1.15 + Math.sin(T * 3) * 0.03);
        add.pushBasis(RING(), _c, Cam.right, Cam.up, z, z * 1.1, 0.3, 0.7, 1, 0.9, 0, 0, 1.6);
        add.pushBasis(GLOW(), _c, Cam.right, Cam.up, z * 1.1, z * 1.2, 0.15, 0.4, 0.9, 0.35, 0, 0, 1.2);
        break;
      }
      case 'Vampiric': {
        for (const u of [-0.18, 0.18]) { pin(head, u, 0.1, 6); add.pushBasis(GLOW(), _c, Cam.right, Cam.up, 26 * s, 26 * s, 1, 0.05, 0.1, 1, 0, 0, 2); }
        for (let i = 0; i < 4; i++) { const a = T * 2.2 + i * 1.57 + sd; pin(body, Math.cos(a) * 0.75, Math.sin(a * 0.5) * 0.2 + 0.1, Math.sin(a) > 0 ? 8 : -8); fx.pushBasis(DISC(), _c, Cam.right, Cam.up, 12 * s, 15 * s, 0.7, 0.03, 0.08, 1, 0, 0, 0.3); }
        pin(head, 0, -0.32, 6); fx.pushBasis(DISC(), _c, _x, _y, 9 * s, 22 * s, 0.6, 0.02, 0.06, 1, 0, 0, 0);          // blood down the chin
        break;
      }
      case 'Splitting': {
        pin(body, 0, 0, 5); fx.pushBasis(DISC(), _c, _x, _y, 5 * s, ph * 0.95, 0.1, 0.22, 0.06, 1, 0, 0, 0);          // seam
        pin(head, 0, 0, 5); fx.pushBasis(DISC(), _c, _x, _y, 4 * s, ph * 0.9, 0.1, 0.22, 0.06, 1, 0, 0, 0);
        for (let i = 0; i < 5; i++) { const t = (T * 0.8 + i * 0.21 + sd) % 1, z = Math.sin(t * Math.PI) * (16 + (i % 3) * 7) * s; pin(i % 2 ? body : head, Math.sin(i * 2.7 + sd) * 0.36, Math.cos(i * 1.9 + sd) * 0.3, 6); fx.pushBasis(DISC(), _c, _x, _y, z, z, 0.55, 0.95, 0.3, 1, 0, 0, 0.4); }
        break;
      }
      case 'Hasted': {
        pin(head, 0, 0.75, 4); add.pushBasis(BOLT(), _c, Cam.right, Cam.up, 34 * s, 50 * s, 1, 0.9, 0.25, 0.7 + Math.sin(T * 30) * 0.3, 0, 0, 2);
        for (let i = 0; i < 4; i++) { const t = (T * 3 + i * 0.25 + sd) % 1, sideS = i % 2 ? 1 : -1; pin(body, sideS * (0.6 + t * 0.5), 0.35 - i * 0.22, -4); add.pushBasis(GLOW(), _c, Cam.right, Cam.up, (70 - t * 30) * s, 7 * s, 1, 0.9, 0.4, (1 - t) * 0.8, 0, 0, 1.6); }
        break;
      }
      case 'Blinking': {
        for (let i = 0; i < 4; i++) { const a = T * 1.6 + i * 1.57 + sd; pin(body, Math.cos(a) * 0.7, Math.sin(a * 1.3) * 0.45, Math.sin(a) > 0 ? 8 : -8); add.pushBasis(PUFF(), _c, Cam.right, Cam.up, 38 * s, 38 * s, 0.6, 0.2, 1, 0.55, 0, 0, 1.4); }
        if (Math.sin(T * 13 + sd) > 0.82) { pin(body, 0, 0, 8); add.pushBasis(GLOW(), _c, Cam.right, Cam.up, 190 * s, 230 * s, 0.6, 0.25, 1, 0.5, 0, 0, 1.6); }
        break;
      }
      case 'Gilded': {
        pin(head, 0, 0.78 + Math.sin(T * 3) * 0.05, 4); fx.pushBasis(COIN(), _c, Cam.right, Cam.up, 34 * s, 34 * s, 1, 1, 1, 1, 0, 0, 0.6);
        for (let i = 0; i < 5; i++) { const t = (T * 1.1 + i * 0.2 + sd) % 1, z = Math.sin(t * Math.PI) * 26 * s; pin(i % 2 ? body : head, Math.sin(i * 2.3 + sd + Math.floor(T * 1.1 + i * 0.2)) * 0.4, Math.cos(i * 1.7 + sd) * 0.35, 7); add.pushBasis(STAR(), _c, Cam.right, Cam.up, z, z, 1, 0.9, 0.4, 1, 0, 0, 2); }
        break;
      }
      default: break;
    }
  }

  draw(batch, fxBatch, addBatch, alive) {
    if (!this.visible || !this.feet) return;
    const flash = this.flashT > 0 ? 1 : 0;
    const t = this.tint;
    for (const P of this.is3D ? [] : this.parts) {
      if (!P.visible) continue;
      this.partTransform(P, _c, _x, _y);
      _m.makeBasis(_x, _y, this.toCam).setPosition(_c);
      batch.pushMatrix(P.spr, _m, t[0], t[1], t[2], 1, flash, 0, 0);
    }
    // wounds: dark blood with pale flesh and bone showing through
    if (this.wounds && !this.dying && !this.is3D) for (const w of this.wounds) {
      if (!w.part.visible) continue;
      this.partTransform(w.part, _c, _x, _y);
      _c.addScaledVector(_x, w.u).addScaledVector(_y, w.v).addScaledVector(this.toCam, 3);
      const s = w.s * this.baseScale;
      _x.normalize(); _y.normalize();
      fxBatch.pushBasis(BLOOD(w.k), _c, _x, _y, s * 1.5, s * 1.5, 0.5, 0.02, 0.05, 1, 0, 0, 0);
      fxBatch.pushBasis(BLOOD((w.k + 1) % 4), _c, _x, _y, s * 0.8, s * 0.8, 0.86, 0.36, 0.34, 1, 0, 0, 0);
      fxBatch.pushBasis(DISC(), _c, _x, _y, s * 0.3, s * 0.22, 0.95, 0.9, 0.78, 1, 0, 0, 0);
    }
    if (this.mods && this.mods.length && alive && !this.dying) this.drawMods(fxBatch, addBatch);
    // dug-out hole and a ring of loose dirt while it climbs out
    if (this.dig > 0.02 && this.groundY !== undefined && alive) {
      const w = 150 * this.baseScale * Math.min(1, this.dig * 1.5);
      _c.set(this.feet.x, this.groundY + 2, this.feet.z); fxBatch.pushBasis(DISC(), _c, X1, Z1, w * 1.25, w * 1.25, 0.3, 0.2, 0.13, 1, 0, 0, 0);
      _c.y += 1; fxBatch.pushBasis(DISC(), _c, X1, Z1, w * 0.85, w * 0.85, 0.07, 0.04, 0.05, 1, 0, 0, 0);
      for (let i = 0; i < 7; i++) { const a = i * 0.9 + (this.seed || 0); _c.set(this.feet.x + Math.cos(a) * w * 0.6, this.groundY + 3, this.feet.z + Math.sin(a) * w * 0.6); const z = (22 + (i % 3) * 9) * this.baseScale; fxBatch.pushBasis(DISC(), _c, X1, Z1, z, z, 0.36, 0.25, 0.16, 1, 0, 0, 0); }
    }
    // blob shadow
    const sh = this.dying ? Math.max(0, 1 - this.deathT) : 1;
    if (sh > 0 && this.groundY !== undefined) {
      _c.set(this.feet.x, this.groundY + 1.5, this.feet.z);
      const w = 90 * this.baseScale * sh;
      fxBatch.pushBasis(DISC(), _c, X1, Z1, w, w, 0.02, 0.02, 0.04, 0.32, 0, 0, 0);
    }
    if (this.auraSize > 0 && alive) {
      _c.set(this.feet.x - this.toCam.x * 2, this.feet.y + this.top * 0.5 * this.baseScale, this.feet.z - this.toCam.z * 2);
      addBatch.pushBasis(GLOW(), _c, Cam.right, Cam.up, this.auraSize, this.auraSize * 1.2, this.aura[0], this.aura[1], this.aura[2], 0.75, 0, 0, 1.6);
    }
  }
  headWorld() {
    const out = new THREE.Vector3();
    for (const P of this.parts) if (P.role === 'Head') { this.partTransform(P, out, _x, _y); return out; }
    return out.copy(this.feet).add(new THREE.Vector3(0, this.heightCm * 0.85, 0));
  }
}
const X1 = new THREE.Vector3(1, 0, 0), Z1 = new THREE.Vector3(0, 0, -1);
let _disc = null, _glow = null;
const _bl = [];
const BLOOD = (k) => _bl[k] || (_bl[k] = sprite('FX_Blood_' + k));
const DISC = () => _disc || (_disc = sprite('FX_Disc'));
const GLOW = () => _glow || (_glow = sprite('FX_Glow'));
const _sp = {}, SPR = (n) => () => _sp[n] || (_sp[n] = sprite(n));
const FLAME = SPR('FX_Flame'), SPARK = SPR('FX_Spark'), STAR = SPR('FX_Star'), PUFF = SPR('FX_Puff'), RING = SPR('FX_Ring'), BOLT = SPR('FX_Bolt'), COIN = SPR('FX_Coin');
const _t = new THREE.Vector3(), _t2 = new THREE.Vector3();
