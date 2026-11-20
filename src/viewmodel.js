// First-person view model (port of UDMHViewModel): chunky 2-tone guns built from toon primitives held in
// gloved hands, rendered in a separate overlay pass. Procedural sway, bob, sprint pose, ADS, spring recoil,
// reload choreography with sound cues, weapon switch, landing dip, slide/wall-run tilt, muzzle flash, shells.
import * as THREE from 'three';
import { toonMaterial, hex, sprite, Atlas, G } from './render.js';
import { PRIM } from './world.js';
import { URot } from './mapkit.js';
import { buildGun, gunFeel } from './guns.js';
import { Meta } from './meta.js';

const d2r = (d) => d * Math.PI / 180;
const V = (x, y, z) => (y === undefined ? { X: x, Y: x, Z: x } : { X: x, Y: y, Z: z });
const R = (p, y, r) => new URot(p, y, r);
// view space mapping: UE-local (X fwd, Y right, Z up) -> three camera-local (x right, y up, -z fwd)
const P3 = (v) => new THREE.Vector3(v.Y, v.Z, -v.X);
function quatVM(rot) {
  const [a, b, c] = rot.rows;
  const m = new THREE.Matrix4().makeBasis(P3(b), P3(c), P3(a).negate());
  return new THREE.Quaternion().setFromRotationMatrix(m);
}
const ViewScale = 0.31;   // smaller in the frame so the gun does not crowd the view
const HipPos = { X: 31, Y: 12.5, Z: -14 };
const Metal = hex(0x4C4E5C), MetalDark = hex(0x2A2A33), MetalLight = hex(0x8C90A0), Wood = hex(0x7A4528), WoodLight = hex(0xA8643A);
const Glove = hex(0x4E3324), GloveLight = hex(0x6E4A32), Cuff = hex(0xC9A46A), Sleeve = hex(0xB0603A), SleeveStripe = hex(0xE8C24A), Brass = hex(0xE0A83A);
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const interp = (cur, target, dt, speed) => cur + (target - cur) * Math.min(1, dt * speed);

export const vmSun = { value: new THREE.Vector3(0, 1, 0) };
const matCache = new Map();
const extCache = new Map();
const TAPER = new THREE.CylinderGeometry(0.5, 0.62, 1, 16);   // sleeve: wider toward the elbow (bottom = first point)
const worldMats = new Map();
const BOXG = new THREE.BoxGeometry(1, 1, 1);
function vmMat(color, glow) {
  const key = color.getHexString() + glow;
  if (!matCache.has(key)) {
    const m = toonMaterial({ glow });
    m.uniforms.uColor.value.copy(color);
    m.uniforms.sunDir = vmSun;
    matCache.set(key, m);
  }
  return matCache.get(key);
}

// small sprite quad (muzzle flash) using the fx atlas
function flashMesh(name, additive) {
  const s = sprite(name);
  const m = new THREE.ShaderMaterial({
    uniforms: { map: { value: Atlas.tex.fx }, uv4: { value: new THREE.Vector4(...s.gl) }, tint: { value: new THREE.Vector4(1, 1, 1, 1) }, glow: { value: additive ? 1.5 : 0.8 } },
    vertexShader: `varying vec2 vUv; uniform vec4 uv4; void main(){ vUv = vec2(mix(uv4.x, uv4.z, uv.x), mix(uv4.y, uv4.w, uv.y)); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: additive
      ? `uniform sampler2D map; uniform vec4 tint; uniform float glow; varying vec2 vUv; void main(){ vec4 t = texture2D(map, vUv); gl_FragColor = vec4(t.rgb * t.a * tint.rgb * tint.a * glow, 1.0); }`
      : `uniform sampler2D map; uniform vec4 tint; uniform float glow; varying vec2 vUv; void main(){ vec4 t = texture2D(map, vUv); float a = t.a * tint.a; if (a < 0.01) discard; gl_FragColor = vec4(t.rgb * tint.rgb * (1.0 + glow), a); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const q = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m);
  q.renderOrder = 10;
  q.visible = false;
  return q;
}

export class ViewModel {
  constructor(game) {
    this.game = game;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(72, 1, 1, 400);
    this.root = new THREE.Group();
    this.root.scale.setScalar(ViewScale);
    this.scene.add(this.root);
    this.gun = new THREE.Group();
    this.root.add(this.gun);
    this.parts = [];
    this.weaponDef = 0; this.weaponTier = 0; this.pendingDef = -1; this.pendingTier = 0;
    this.cls = 'Pistol';
    this.swayPos = new THREE.Vector3(); this.swayVel = new THREE.Vector3();
    this.swayRot = new THREE.Vector3(); this.swayRotVel = new THREE.Vector3();
    this.recoilPos = new THREE.Vector3(); this.recoilPosVel = new THREE.Vector3();
    this.recoilRot = new THREE.Vector3(); this.recoilRotVel = new THREE.Vector3();
    this.landZ = 0; this.landVel = 0; this.bobPhase = 0; this.bobAmp = 0;
    this.sprintA = 0; this.aimA = 0; this.slideA = 0; this.wallA = 0; this.airA = 0;
    this.switchT = 0; this.swapped = false; this.flashTime = 0; this.lastReload = 0; this.spinSpeed = 0; this.time = 0;
    this.scoped = false;
  }

  // ---------------------------------------------------------------- building
  Part(parent, meshId, loc, size, color, rot = null, glow = 0) {
    const m = new THREE.Mesh(PRIM.GEOS[meshId], vmMat(color, glow > 0 ? Math.min(1.3, glow * 0.45) : 0));
    m.position.copy(P3(loc));
    if (rot) m.quaternion.copy(quatVM(rot));
    m.scale.set(size.Y, size.Z, size.X);
    (parent || this.gun).add(m);
    this.parts.push(m);
    return m;
  }
  // Side profile ([x forward, z up] points) extruded across the gun to width w, with chamfered edges.
  Ext(pts, w, color, o = {}) {
    const bevel = Math.min(o.bevel === undefined ? 0.4 : o.bevel, w * 0.35);
    const key = JSON.stringify([pts, w, bevel, o.holes || 0]);
    let g = extCache.get(key);
    if (!g) {
      const sh = new THREE.Shape(pts.map((q) => new THREE.Vector2(q[0], q[1])));
      for (const h of o.holes || []) sh.holes.push(new THREE.Path(h.map((q) => new THREE.Vector2(q[0], q[1]))));
      g = new THREE.ExtrudeGeometry(sh, { depth: w - 2 * bevel, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 1, curveSegments: 6 });
      g.translate(0, 0, -(w - 2 * bevel) / 2);
      g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 1));   // (x fwd, z up, depth) -> view (right, up, -fwd)
      g = g.toNonIndexed(); g.computeVertexNormals();
      extCache.set(key, g);
    }
    const m = new THREE.Mesh(g, vmMat(color, o.glow > 0 ? Math.min(1.3, o.glow * 0.45) : 0));
    m.position.set(o.y || 0, 0, 0);
    (o.parent || this.gun).add(m);
    this.parts.push(m);
    return m;
  }
  // Capsule between two points (fingers, wrists, sleeves).
  Cap(parent, a, b, r, color, r2 = r) {
    const A = P3(a), Bv = P3(b), d = Bv.clone().sub(A), len = d.length();
    const m = new THREE.Mesh(r2 === r ? PRIM.GEOS[1] : TAPER, vmMat(color, 0));
    m.position.copy(A).add(Bv).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    m.scale.set(r * 2, len, r * 2);
    (parent || this.gun).add(m); this.parts.push(m);
    for (const [q, rr] of [[A, r2], [Bv, r]]) { const sph = new THREE.Mesh(PRIM.GEOS[2], vmMat(color, 0)); sph.position.copy(q); sph.scale.setScalar(rr * 2); (parent || this.gun).add(sph); this.parts.push(sph); }
    return m;
  }
  Box(loc, size, color, rot = null, glow = 0, parent = null) { return this.Part(parent || this.gun, 0, loc, size, color, rot, glow); }
  Tube(loc, d, len, color, glow = 0, parent = null) { return this.Part(parent || this.gun, 1, loc, V(d, d, len), color, R(90, 0, 0), glow); }
  scene_(loc) {
    const g = new THREE.Group();
    g.position.copy(P3(loc));
    g.userData.rest = P3(loc);
    this.gun.add(g);
    this.parts.push(g);
    return g;
  }
  clear() {
    for (const p of this.parts) p.removeFromParent();
    this.parts = [];
    this.MagRoot = this.PumpRoot = this.SpinPart = this.CylPart = this.support = this.muzzle = this.eject = null;
    this.flash = [];
  }
  // ---- melee: the off hand whips a weapon across the view. Built once per weapon, in camera space (x right, y up, -z forward).
  meleeBuild(W) {
    if (this.mg) this.scene.remove(this.mg);
    const g = new THREE.Group(), tool = new THREE.Group(); g.add(tool);
    const sk = Meta.skin(), M = (c, glow = 0) => vmMat(new THREE.Color(c), glow);
    const box = (w, h, d, c, x, y, z, glow = 0) => { const m = new THREE.Mesh(BOXG, M(c, glow)); m.scale.set(w, h, d); m.position.set(x, y, z); tool.add(m); return m; };
    const cyl = (r, h, c, x, y, z, glow = 0, r2 = r) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r, h, 10), M(c, glow)); m.position.set(x, y, z); tool.add(m); return m; };
    const steel = 0xc8ccd4, dark = 0x46464e, wood = 0x6a4a32, edge = 0xf2f4f8;
    // handle runs up from the fist at the origin; the business end is at +y
    switch (W.model) {
      case 'knife': cyl(0.55, 3.4, wood, 0, 0.6, 0); box(2.2, 0.4, 0.9, 0xffcd5a, 0, 2.5, 0); box(1.5, 7.5, 0.25, steel, 0.15, 6.4, 0); box(0.5, 7.5, 0.3, edge, 0.9, 6.4, 0); box(1.1, 1.6, 0.25, steel, -0.1, 10.6, 0).rotation.z = 0.5; break;
      case 'hatchet': cyl(0.5, 9, wood, 0, 3.4, 0); box(3.6, 2.8, 0.5, dark, 1.6, 7.2, 0); box(1, 3.6, 0.35, edge, 3.6, 7.2, 0); box(1.2, 1.2, 0.6, dark, -0.8, 7.2, 0); break;
      case 'bat': cyl(0.5, 4, 0x2a2430, 0, 0.8, 0); cyl(0.55, 12, 0xc9a46a, 0, 8, 0, 0, 1.05); cyl(1.05, 1, 0xb08a52, 0, 14.4, 0); for (let i = 0; i < 3; i++) box(2.6, 0.25, 0.25, steel, 0, 9.5 + i * 1.6, 0).rotation.y = i * 1.1; break;
      case 'prod': cyl(0.6, 5, 0x2a2430, 0, 1.2, 0); cyl(0.4, 10, 0xe8c81e, 0, 8.5, 0); for (const s of [-1, 1]) box(0.25, 2.2, 0.25, steel, s * 0.5, 14.4, 0); box(0.7, 0.7, 0.7, 0x7fd3ff, 0, 15.2, 0, 2.2); break;
      case 'machete': cyl(0.55, 3.6, 0x2a2430, 0, 0.6, 0); box(2.4, 13, 0.25, steel, 0.5, 9, 0); box(0.6, 13, 0.3, edge, 1.9, 9, 0); box(2, 2.2, 0.25, steel, 0.9, 16, 0).rotation.z = 0.45; break;
      case 'sledge': cyl(0.55, 15, wood, 0, 6.4, 0); box(6.4, 3.4, 3.4, dark, 0, 14.6, 0); box(1, 3.8, 3.8, steel, 3.2, 14.6, 0); box(1, 3.8, 3.8, steel, -3.2, 14.6, 0); break;
      case 'brand': cyl(0.5, 4, wood, 0, 0.8, 0); cyl(0.3, 11, dark, 0, 8, 0); box(3.2, 3.2, 0.6, 0xff7a2a, 0, 14.6, 0, 2); box(1.4, 1.4, 0.8, 0xffe27a, 0, 14.6, 0, 2.6); break;
      case 'cleaver': cyl(0.55, 3.6, wood, 0, 0.6, 0); box(4.6, 7, 0.3, steel, 1.6, 6.4, 0); box(0.6, 7, 0.36, edge, 4, 6.4, 0); box(0.9, 0.9, 0.5, 0x140d12, 0.2, 9, 0); box(2, 1.4, 0.34, 0x8a1f24, 2.6, 4.2, 0); break;
      case 'katana': cyl(0.5, 5, 0x8a1f24, 0, 1, 0); box(2, 0.4, 2, 0xffcd5a, 0, 3.8, 0); box(1.1, 17, 0.22, steel, 0.1, 12.6, 0); box(0.4, 17, 0.26, edge, 0.7, 12.6, 0); break;
      default: cyl(0.55, 13, wood, 0, 5.4, 0); box(1.6, 1.2, 1.2, wood, 0, -1, 0); box(5, 6, 0.4, 0xe0ac2a, 0, 15, 0, 0.5); box(4, 1.2, 0.5, 0xfff4d8, 0, 12.4, 0, 0.5); break;   // shovel
    }
    // The weapon sits in a fist at the end of a full arm. The arm hangs off a shoulder pivot below the screen, so the
    // swing is the arm rotating about that shoulder, never a weapon sliding through the air.
    const ARM = 21, pivot = new THREE.Group(), hand = new THREE.Group(); hand.position.set(0, 0, -ARM); pivot.add(hand);
    g.remove(tool); hand.add(tool); tool.scale.setScalar(0.62); this.mtool = tool; this.mhand = hand;
    const fist = new THREE.Mesh(new THREE.SphereGeometry(1.25, 10, 8), M(sk.glove)); fist.scale.set(1, 1.1, 1.15); hand.add(fist);
    const fore = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.5, ARM * 0.5, 10), M(sk.sleeve)); fore.rotation.x = Math.PI / 2; fore.position.set(0, 0, -ARM * 0.72); pivot.add(fore);
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.1, ARM * 0.6, 10), M(sk.sleeve)); upper.rotation.x = Math.PI / 2; upper.position.set(0, 0, -ARM * 0.25); pivot.add(upper);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 1.3, 10), M(sk.cuff)); cuff.rotation.x = Math.PI / 2; cuff.position.set(0, 0, -ARM + 2); pivot.add(cuff);
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.8, 10), M(sk.stripe)); stripe.rotation.x = Math.PI / 2; stripe.position.set(0, 0, -ARM * 0.47); pivot.add(stripe);
    pivot.rotation.order = 'YXZ'; g.add(pivot); this.mpivot = pivot;
    g.visible = false; this.scene.add(g); this.mg = g; this.mgName = W.name;
    if (!this.mslash) { this.mslash = flashMesh('FX_Slash', true); this.scene.add(this.mslash); }
  }
  meleeShow(W) { this.meleeBuild(W); this.mT = 0; this.mDur = 0.5; this.mStep = 3; }   // new weapon: flourish it once
  meleeSwing(W, step, dur) { if (this.mgName !== W.name || !this.mg) this.meleeBuild(W); this.mT = 0; this.mDur = dur; this.mStep = step; }
  tickMelee(dt) {
    if (!this.mg) { this.mDip = 0; return; }
    const active = this.mT !== undefined && this.mT < this.mDur && !this.hidden && !this.scoped;
    this.mDip = (this.mDip || 0) + ((active ? 1 : 0) - (this.mDip || 0)) * Math.min(1, dt * (active ? 40 : 14));   // gun drops out of the way, then comes back up
    if (!active) { this.mg.visible = false; if (this.mslash) this.mslash.visible = false; return; }
    this.mT += dt;
    // wind back a touch, whip through, then follow through and drop away
    const t = Math.min(1, this.mT / this.mDur), w = Math.min(1, t / 0.6), s = w < 0.12 ? -0.12 * Math.sin(w / 0.12 * Math.PI) : 1 - Math.pow(1 - (w - 0.12) / 0.88, 3), out = Math.max(0, (t - 0.72) / 0.28);
    const L = (a, b) => a + (b - a) * s, P = this.mpivot, tool = this.mtool;
    this.mg.visible = true; this.mg.position.set(0, 0, 0); this.mg.rotation.set(0, 0, 0);
    // The gun stays in the right hand. The left hand lets go of it (the support hand is hidden) and does the swinging.
    if (this.mStep === 0) { P.position.set(-8, -15 - out * 9, -1); P.rotation.set(L(0.8, 0.66), L(0.9, -0.8), 0); tool.rotation.set(-0.5, 0, L(0.5, -1.25)); }           // left to right
    else if (this.mStep === 1) { P.position.set(-8, -15 - out * 9, -1); P.rotation.set(L(0.66, 0.8), L(-0.8, 0.9), 0); tool.rotation.set(-0.5, 0, L(-1.25, 0.5)); }      // back across, right to left
    else if (this.mStep === 2) { P.position.set(-5, -16 - out * 8, -1); P.rotation.set(L(1.25, 0.08), L(-0.1, 0), 0); tool.rotation.set(L(0.3, -1.1), 0, 0.1); }         // overhead finisher
    else { P.position.set(-8, -15 - out * 9, -1); P.rotation.set(0.6 + Math.sin(t * Math.PI) * 0.2, 0.3, 0); tool.rotation.set(-0.4, t * 6.28, -0.2); }                // new weapon: show it off
    const q = this.mslash;
    if (q && this.mStep < 3) {
      const a = Math.max(0, 1 - Math.abs(t - 0.3) / 0.16);
      q.visible = a > 0.01; q.position.set(this.mStep === 2 ? 1 : (this.mStep ? 1 : -1), this.mStep === 2 ? -1 : -2.5, -20);
      q.scale.set(this.mStep === 2 ? 9 : 30, this.mStep === 2 ? 24 : 8, 1); q.rotation.z = this.mStep === 0 ? -0.2 : this.mStep === 1 ? Math.PI + 0.2 : Math.PI / 2;
      q.material.uniforms.tint.value.set(1, 0.95, 0.85, a * 0.32);
    }
  }
  setWeapon(def, tier, animate) {
    if (animate && this.parts.length) {
      this.pendingDef = def; this.pendingTier = tier; this.switchT = 0.36; this.swapped = false;
      return;
    }
    this.weaponDef = def; this.weaponTier = tier;
    this.build();
    if (!animate) this.switchT = 0;
  }
  build() {
    this.clear();
    const W = this.game.data.weapons[this.weaponDef];
    this.cls = W.cls;
    const Accent = hex(W.color);
    const Trim = this.weaponTier > 0 ? hex(0xF2C43A) : MetalLight;
    const TrimGlow = this.weaponTier > 0 ? 0.6 + 0.25 * this.weaponTier : 0;
    this.spinAxis = null;
    this.feel = gunFeel(W); this.actT = 0; this.cylTarget = 0; this.cylAngle = 0;
    const spec = buildGun(this, W, this.weaponTier, Meta.gunLevel(W.name) >= 5);
    const sk = Meta.skin();
    const Glove = hex(sk.glove), GloveLight = hex(sk.gloveL), Cuff = hex(sk.cuff), Sleeve = hex(sk.sleeve), SleeveStripe = hex(sk.stripe);
    const SightZ = spec.Sight, MuzzleAt = spec.Muzzle, EjectAt = spec.Eject, SupportRest = spec.Support;
    this.gunPartCount = this.parts.length;
    this.magRest = this.MagRoot.position.clone();
    this.sightZ = SightZ;
    this.supportRest = P3(SupportRest);
    this.muzzle = this.scene_(MuzzleAt);
    this.eject = this.scene_(EjectAt);
    // --- hands: leather gloves, cream cuffs, rust sleeves ---------------------------------------------------
    const g = this.gun;
    this.Ext([[-7.6, 2.8], [-3.2, 3.2], [-1.6, -1], [-3.4, -8.6], [-8.8, -9.4], [-10.4, -4]], 6.4, Glove, { bevel: 1.8, y: 0.5 });   // palm behind the grip
    for (let i = 0; i < 3; i++) this.Cap(g, V(1.3 - i * 0.95, 3.0, -1.6 - i * 2.7), V(1.3 - i * 0.95, -2.9, -1.8 - i * 2.7), 1.45, i === 0 ? GloveLight : Glove);   // fingers round the front strap
    this.Cap(g, V(-1.6, 3.0, 1.9), V(3.4, 2.5, 1.3), 1.3, GloveLight);                          // trigger finger
    this.Cap(g, V(-5.4, -3.0, 2.2), V(-0.8, -3.3, 3.2), 1.45, GloveLight);                      // thumb
    this.Cap(g, V(-13.6, 2.6, -11.4), V(-9.4, 1.2, -6.6), 4.5, Cuff);
    this.Cap(g, V(-38, 11, -42), V(-14.4, 2.9, -12.4), 5.0, Sleeve, 6.6);
    this.Cap(g, V(-18.6, 4.3, -17.6), V(-17.4, 3.9, -16.2), 5.5, SleeveStripe);
    this.support = this.scene_(SupportRest);
    const sp = this.support;
    const palm = this.Part(sp, 2, V(0, -0.6, -2.6), V(9.4, 7.4, 4.6), Glove);
    void palm;
    for (let i = 0; i < 4; i++) this.Cap(sp, V(-3.4 + i * 2.3, 2.5, -2.2), V(-3.4 + i * 2.3, 3.5, 2.2), 1.25, i === 1 ? GloveLight : Glove);
    this.Cap(sp, V(-1.6, -3.3, -1.8), V(1.4, -3.9, 2.2), 1.4, GloveLight);
    this.Cap(sp, V(-7.4, -9.4, -10), V(-3.2, -4.2, -5), 4.2, Cuff);
    this.Cap(sp, V(-24, -34, -34), V(-8, -10.2, -10.8), 4.8, Sleeve, 6.4);
    // muzzle flash: star facing the camera, flame along the barrel, additive glow
    const big = ['Shotgun', 'Sniper', 'Launcher'].includes(this.cls);
    this.FS = big ? 30 : (this.cls === 'Pistol' ? 18 : 22);
    const tint = (this.cls === 'Energy' || this.cls === 'Wonder') ? Accent.clone().lerp(new THREE.Color(1, 1, 1), 0.35) : new THREE.Color(1, 1, 1);
    const star = flashMesh('FX_Star', false); star.material.uniforms.tint.value.set(tint.r, tint.g, tint.b, 1);
    const flame = flashMesh('FX_Flame', false); flame.material.uniforms.tint.value.set(tint.r, tint.g, tint.b, 1);
    const glow = flashMesh('FX_Glow', true); glow.material.uniforms.tint.value.set(1, 0.7, 0.35, 0.6);
    // lies flat along the barrel: texture +X -> forward (-z), normal up
    flame.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0)));
    flame.position.set(0, 0, -this.FS * 0.55);
    for (const q of [star, flame, glow]) { this.muzzle.add(q); this.parts.push(q); }
    this.flash = [star, flame, glow];
    // Aiming down sights puts the highest point on the gun's centre line just under the crosshair, measured from the
    // finished model, so no sight, rail or hammer ever sits on top of the aim point.
    this.gun.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(this.gun.matrixWorld).invert(), v = new THREE.Vector3(); let top = -1e9;
    const skip = new Set(this.flash); if (this.support) this.support.traverse((o) => skip.add(o));
    this.gun.traverse((o) => {
      if (!o.isMesh || skip.has(o) || !o.geometry || !o.geometry.attributes.position) return;
      const a = o.geometry.attributes.position, m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
      for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i).applyMatrix4(m); if (Math.abs(v.x) < 1.6 && v.z < 6 && v.y > top) top = v.y; }
    });
    this.sightTop = top > -1e8 ? top : this.sightZ;
  }

  // Static copy of a weapon model (no hands, no flash) lit like the world: for wall-buy plaques.
  static displayModel(game, def, tier = 0) {
    const vm = new ViewModel(game);
    vm.weaponDef = def; vm.weaponTier = tier;
    vm.build();
    vm.parts.forEach((o, i) => { o.userData.extra = i >= vm.gunPartCount; });
    const g = vm.gun.clone(true);
    const drop = [];
    g.traverse((o) => { if (o !== g && o.userData.extra) drop.push(o); });
    for (const o of drop) o.removeFromParent();
    g.traverse((o) => {
      if (!o.isMesh) return;
      const src = o.material;
      const key = src.uniforms.uColor.value.getHexString() + '|' + src.uniforms.uGlow.value;
      if (!worldMats.has(key)) { const m = toonMaterial({ glow: src.uniforms.uGlow.value }); m.uniforms.uColor.value.copy(src.uniforms.uColor.value); worldMats.set(key, m); }
      o.material = worldMats.get(key);
    });
    g.position.set(0, 0, 0); g.quaternion.identity();
    return g;
  }

  // ---------------------------------------------------------------- events
  fire(kick, continuous) {
    const K = Math.min(3, Math.max(0.05, kick));
    const ads = 1 - this.aimA * 0.82;   // aiming steadies the gun: the sights stay close to the target
    // UE (x back, y, z up) -> view (y, z, -x)
    const f = this.feel;
    const rx = (Math.random() * 12 - 6) * K * f.side;
    this.recoilPosVel.add(new THREE.Vector3(rx * 1.4, 22 * K * f.rise, 100 * K * f.pos).multiplyScalar(ads));
    this.recoilRotVel.add(new THREE.Vector3(240 * K * f.rise, (Math.random() * 110 - 55) * K * f.side, (Math.random() * 260 - 130) * K * f.side).multiplyScalar(ads));
    if (f.shake > 0 && !continuous) this.game.player.addShake(f.shake);
    if (!continuous && f.action !== 'none') { this.actT = { pump: 0.4, bolt: 0.75, lever: 0.34, revolver: 0.18 }[f.action]; this.actDur = this.actT; this.actSnd = false; }
    if (f.action === 'revolver') this.cylTarget += Math.PI / 3;
    if (!continuous || Math.random() < 0.5) {
      this.flashTime = continuous ? 0.03 : 0.05;
      const J = 0.8 + Math.random() * 0.5;
      const [star, flame, glow] = this.flash;
      for (const q of this.flash) q.visible = !this.scoped;
      star.userData.spin = Math.random() * Math.PI * 2;
      star.scale.set(this.FS * J * 1.3, this.FS * J * 1.3, 1);
      flame.scale.set(this.FS * 1.3 * J, this.FS * 0.55 * (0.8 + Math.random() * 0.4), 1);
      glow.scale.set(this.FS * 5, this.FS * 5, 1);
    }
    if (this.cls === 'LMG' || this.cls === 'Wonder') this.spinSpeed = Math.min(this.spinSpeed + 400, 1800);
    if (!continuous && !['Launcher', 'Energy', 'Wonder'].includes(this.cls)) {
      const p = this.toWorld(this.eject, 70);
      const cam = this.game.camera;
      const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
      const fwd = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 2).negate();
      const vel = right.multiplyScalar(180 + Math.random() * 80).add(up.multiplyScalar(160 + Math.random() * 100)).addScaledVector(fwd, -40).add(this.game.player.vel);
      this.game.fx.debris('FX_Shell', p, vel, this.cls === 'Shotgun' ? 5 : 3.2, 3, Math.random() * 1800 - 900, true);
    }
  }
  land(impact) { this.landVel -= Math.min(1.5, Math.max(0, impact)) * 60; }
  jolt(a) {
    this.recoilPosVel.add(new THREE.Vector3(0, -10, 20).multiplyScalar(a));
    this.recoilRotVel.add(new THREE.Vector3(-40, 0, 25).multiplyScalar(a));
  }
  // world position of a view-model point: project through the overlay camera, unproject into the world camera
  toWorld(obj, dist = 45) {
    const p = new THREE.Vector3();
    obj.getWorldPosition(p);
    p.project(this.camera);
    const cam = this.game.camera;
    const w = new THREE.Vector3(p.x, p.y, 0.5).unproject(cam);
    const o = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);
    return o.clone().add(w.sub(o).normalize().multiplyScalar(dist));
  }
  muzzleWorld() { return this.muzzle ? this.toWorld(this.muzzle, 60) : this.game.player.eye(); }

  // ---------------------------------------------------------------- per frame
  update(dt, In) {
    if (dt <= 0) return;
    dt = Math.min(dt, 0.05);
    this.time += dt;
    const hs = Math.hypot(In.localVel.x, In.localVel.z);
    this.sprintA = interp(this.sprintA, (In.sprinting && !In.aiming && !In.reloading && In.grounded) ? 1 : 0, dt, 9);
    this.aimA = interp(this.aimA, (In.aiming && !In.reloading && this.switchT <= 0) ? 1 : 0, dt, 14);
    this.slideA = interp(this.slideA, In.sliding ? 1 : 0, dt, 10);
    this.wallA = interp(this.wallA, In.wallSide, dt, 8);
    this.airA = interp(this.airA, In.grounded ? 0 : 1, dt, 6);
    this.scoped = this.cls === 'Sniper' && this.aimA > 0.92;

    // sway (UE: Y right, Z up) -> view x, y
    const sm = 1 - this.aimA * 0.75;
    const lx = Math.max(-6, Math.min(6, In.look.x)), ly = Math.max(-6, Math.min(6, In.look.y));
    this.swayVel.add(new THREE.Vector3(-lx * 0.9 * sm, -ly * 0.7 * sm, 0).multiplyScalar(40));
    spring(this.swayPos, this.swayVel, 160, 18, dt);
    const lx8 = Math.max(-8, Math.min(8, In.look.x)), ly8 = Math.max(-8, Math.min(8, In.look.y));
    this.swayRotVel.add(new THREE.Vector3(ly8 * 1.4, -lx8 * 1.6, -lx8 * 2.4).multiplyScalar(22 * sm));
    spring(this.swayRot, this.swayRotVel, 140, 16, dt);
    this.swayPos.clampScalar(-5, 5);
    this.swayRot.clampScalar(-12, 12);

    const bobT = In.grounded && !In.sliding ? Math.min(1.6, hs / 640) : 0;
    this.bobAmp = interp(this.bobAmp, bobT, dt, 8);
    this.bobPhase += dt * (6 + hs * 0.0105);
    const bm = this.bobAmp * (1 - this.aimA * 0.85) * (1 + this.sprintA * 0.6);
    const bob = new THREE.Vector3(Math.sin(this.bobPhase) * 1.6 * bm, -Math.abs(Math.cos(this.bobPhase)) * 1.4 * bm + Math.sin(this.time * 1.6) * 0.25, 0);
    const bobRot = new THREE.Vector3(Math.abs(Math.cos(this.bobPhase)) * 1.2 * bm, Math.sin(this.bobPhase) * 0.8 * bm, Math.sin(this.bobPhase) * 1.6 * bm);

    spring(this.recoilPos, this.recoilPosVel, this.feel.k, this.feel.d, dt);
    spring(this.recoilRot, this.recoilRotVel, this.feel.k * 0.92, this.feel.d * 0.9, dt);
    { const a = (0 - this.landZ) * 120 - this.landVel * 13; this.landVel += a * dt; this.landZ += this.landVel * dt; }

    // positions in UE-local terms (x fwd, y right, z up) then mapped
    const ads = { X: 26, Y: 0, Z: -(this.sightTop ?? this.sightZ) - 0.45 };
    const pos = { X: HipPos.X + (ads.X - HipPos.X) * this.aimA, Y: HipPos.Y + (ads.Y - HipPos.Y) * this.aimA, Z: HipPos.Z + (ads.Z - HipPos.Z) * this.aimA };
    const rot = { P: 0, Y: 0, R: 0 };
    const add = (x, y, z, k) => { pos.X += x * k; pos.Y += y * k; pos.Z += z * k; };
    const addR = (p, y, r, k) => { rot.P += p * k; rot.Y += y * k; rot.R += r * k; };
    add(-6, -2, -6, this.sprintA); addR(-16, -32, -24, this.sprintA);
    add(-2, -2, -3, this.slideA); addR(4, 0, -16, this.slideA);
    rot.R += -this.wallA * 10;
    pos.Z += this.airA * 1.2; rot.P += this.airA * 3;
    pos.Z += Math.sin(this.time * 1.4) * 0.3 * (1 - this.aimA);

    let reloadPose = 0, magOffZ = 0;
    const supOff = new THREE.Vector3();
    let pumpOff = 0;
    if (In.reloading) {
      const T = Math.min(1, Math.max(0, In.reloadFrac));
      reloadPose = sstep(0, 0.14, T) * (1 - sstep(0.82, 1, T));
      const out = sstep(0.18, 0.32, T), inA = sstep(0.45, 0.62, T);
      magOffZ = -26 * out * (1 - inA);
      if (out > 0.99 && inA < 0.01) magOffZ = -60;
      const toMag = this.magRest.clone().sub(this.supportRest).add(P3(V(-2, -3, -8)));
      supOff.copy(toMag).multiplyScalar(sstep(0.1, 0.25, T) * (1 - sstep(0.62, 0.78, T))).add(new THREE.Vector3(0, magOffZ * 0.6, 0));
      if (this.PumpRoot) {
        const rack = Math.sin(sstep(0.84, 0.98, T) * Math.PI);
        pumpOff = -7 * rack;
        supOff.z += 7 * rack;
      }
      const crossed = (m) => this.lastReload < m && T >= m;
      if (crossed(0.2)) this.game.audio.play('S_MagOut', 0.7);
      if (crossed(0.6)) { this.game.audio.play(this.cls === 'Shotgun' ? 'S_ShellIn' : 'S_MagIn', 0.8); this.jolt(0.6); }
      if (crossed(0.86) && ['Shotgun', 'Sniper', 'Rifle', 'LMG'].includes(this.cls)) { this.game.audio.play('S_Rack', 0.8); this.jolt(0.5); }
      this.lastReload = T;
    } else this.lastReload = 0;
    {
      // each reload style holds the gun differently: tipped to dump a cylinder, broken open, muzzle up for a tube...
      const RP = { mag: [14, -8, 30], revolver: [22, -26, 72], break: [-40, -6, 14], shell: [10, -12, 44], box: [6, -16, 38], tube: [34, -10, 18], cell: [8, -16, 36] }[this.feel.reload] || [14, -8, 30];
      add(-3, -3, -4, reloadPose); addR(RP[0], RP[1], RP[2], reloadPose);
      if (In.reloading && this.feel.reload === 'shell') { const T = In.reloadFrac; for (const m of [0.32, 0.46]) if (this.lastReloadShell < m && T >= m) { this.game.audio.play('S_ShellIn', 0.7); this.jolt(0.35); } this.lastReloadShell = T; } else this.lastReloadShell = 0;
    }
    // the action cycling after a shot: pump racks, bolt lifts and pulls, lever flicks, cylinder indexes
    if (this.actT > 0) {
      this.actT -= dt;
      const u = 1 - Math.max(0, this.actT) / this.actDur, w = Math.sin(Math.min(1, u) * Math.PI);
      const a = this.feel.action;
      if (a === 'pump' && this.PumpRoot && u > 0.25) { const r = Math.sin(((u - 0.25) / 0.75) * Math.PI); pumpOff = -7 * r; supOff.z += 7 * r; if (!this.actSnd) { this.actSnd = true; this.game.audio.play('S_Rack', 0.75); } }
      else if (a === 'bolt' && u > 0.2) { const r = Math.sin(((u - 0.2) / 0.8) * Math.PI); addR(7, -5, 24, r); add(-2, 0, -1.5, r); if (!this.actSnd && u > 0.4) { this.actSnd = true; this.game.audio.play('S_Rack', 0.8, 0.85); } }
      else if (a === 'lever') { addR(-13, 0, 9, w); add(1.5, 0, -1.5, w); if (!this.actSnd && u > 0.3) { this.actSnd = true; this.game.audio.play('S_Rack', 0.5, 1.3); } }
    }
    if (this.CylPart) { this.cylAngle += (this.cylTarget - this.cylAngle) * Math.min(1, dt * 30); this.CylPart.rotation.z = this.cylAngle; }

    if (this.switchT > 0) {
      this.switchT -= dt;
      if (this.switchT <= 0.18 && !this.swapped && this.pendingDef >= 0) {
        this.swapped = true;
        this.weaponDef = this.pendingDef; this.weaponTier = this.pendingTier; this.pendingDef = -1;
        this.build();
        this.game.audio.play('S_Switch', 0.7);
      }
    }
    const drop = this.switchT <= 0 ? 0 : (this.switchT > 0.18 ? 1 - sstep(0.18, 0.36, this.switchT) : sstep(0, 0.18, this.switchT));
    add(-4, 2, -22, drop); addR(-35, 10, 20, drop);

    const p3 = P3(pos).add(this.swayPos).add(bob).add(this.recoilPos).add(new THREE.Vector3(0, this.landZ, 0));
    this.gun.position.copy(p3);
    if (this.mDip > 0.001) { this.gun.position.y -= this.mDip * 4; this.gun.position.x += this.mDip * 3; }   // gun hand eases aside to make room
    if (this.support) this.support.visible = !(this.mDip > 0.15);   // the left hand is busy swinging
    // UE pitch (nose up) -> rotation about view x; yaw (right) -> about -y; roll -> about -z
    const P = rot.P + this.swayRot.x + bobRot.x + this.recoilRot.x;
    const Y = rot.Y + this.swayRot.y + bobRot.y + this.recoilRot.y;
    const Rr = rot.R + this.swayRot.z + bobRot.z + this.recoilRot.z;
    this.gun.quaternion.copy(quatVM(R(P, Y, Rr)));
    if (this.MagRoot) this.MagRoot.position.copy(this.magRest).add(new THREE.Vector3(0, magOffZ, 0));
    if (this.support) this.support.position.copy(this.supportRest).add(supOff);
    if (this.PumpRoot) this.PumpRoot.position.copy(this.PumpRoot.userData.rest).add(new THREE.Vector3(0, 0, -(pumpOff + Math.min(0, -this.recoilPos.z * 0.6))));
    if (this.SpinPart) {
      this.spinSpeed = interp(this.spinSpeed, this.cls === 'Wonder' ? 600 : 0, dt, 1.5);
      const a = this.spinSpeed * dt * Math.PI / 180;
      if (this.spinAxis === 'x') this.SpinPart.rotateX(a); else this.SpinPart.rotateZ(a);
    }
    if (this.flashTime > 0) {
      this.flashTime -= dt;
      if (this.flashTime <= 0) for (const q of this.flash) q.visible = false;
    }
    // star and glow always face the overlay camera
    if (this.flash.length) {
      const inv = this.muzzle.getWorldQuaternion(new THREE.Quaternion()).invert();
      const spin = this.flash[0].userData.spin || 0;
      this.flash[0].quaternion.copy(inv).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), spin));
      this.flash[2].quaternion.copy(inv);
    }
    this.root.visible = !this.scoped && !this.hidden;
    this.tickMelee(dt);
  }
}

function spring(x, v, k, damp, dt) {
  const ax = -x.x * k - v.x * damp, ay = -x.y * k - v.y * damp, az = -x.z * k - v.z * damp;
  v.x += ax * dt; v.y += ay * dt; v.z += az * dt;
  x.addScaledVector(v, dt);
}
