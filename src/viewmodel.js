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
const flatCache = new WeakMap();
const BOXG = new THREE.BoxGeometry(1, 1, 1);
// View-model shading: the world's two-tone look plus what makes a held object read up close: a second, brighter
// band where a face turns to the light, a hard specular glint on metal, and a cool rim along edges facing away.
const gunInv = { value: new THREE.Matrix4() };
function gunMaterial(color, glow, metal, grain = 0) {
  return new THREE.ShaderMaterial({
    uniforms: { sunDir: vmSun, litTint: G.litTint, shadowTint: G.shadowTint, uColor: { value: color.clone() }, uGlow: { value: glow }, uMetal: { value: metal }, uGunInv: gunInv, uGrain: { value: grain } },
    vertexShader: /* glsl */`
      uniform mat4 uGunInv; varying vec3 vN; varying vec3 vW; varying vec3 vL;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vL = (uGunInv * w).xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform vec3 sunDir; uniform vec4 litTint; uniform vec4 shadowTint; uniform vec3 uColor; uniform float uGlow; uniform float uMetal; uniform float uGrain;
      varying vec3 vN; varying vec3 vW; varying vec3 vL;
      void main() {
        vec3 n = normalize(vN), v = normalize(-vW);
        vec3 L = normalize(sunDir + vec3(-0.25, 0.55, 0.45));          // the key light is pulled up and toward the shooter so the gun is never a silhouette
        float ndl = dot(n, L);
        float b1 = smoothstep(-0.04, 0.06, ndl), b2 = smoothstep(0.62, 0.7, ndl);
        vec3 c = mix(uColor * mix(shadowTint.rgb, vec3(1.0), 0.25), uColor * litTint.rgb, b1);
        c *= 1.0 + b2 * mix(0.12, 0.3, uMetal);
        c *= mix(0.84, 1.0, clamp(n.y * 0.5 + 0.5, 0.0, 1.0));
        if (uGrain > 0.5) {   // long dark streaks and the odd pale one, running the length of the gun
          float g = sin(vL.y * 1.9 + vL.x * 0.9 + sin(vL.z * 0.22 + vL.y * 0.7) * 1.7);
          c *= 1.0 - 0.16 * smoothstep(0.55, 0.75, g);
          c *= 1.0 + 0.1 * smoothstep(0.8, 0.95, -g);
        }
        float sp = pow(max(dot(n, normalize(L + v)), 0.0), mix(14.0, 48.0, uMetal));
        c += mix(uColor, vec3(1.0, 0.97, 0.9), 0.65) * smoothstep(0.52, 0.6, sp) * uMetal * 0.5;
        float rim = pow(1.0 - max(dot(n, v), 0.0), 2.6) * smoothstep(-0.3, 0.5, n.y);
        c += (uColor * 0.5 + vec3(0.1, 0.12, 0.18)) * smoothstep(0.42, 0.55, rim) * (0.3 + 0.35 * uMetal);
        c += uColor * uGlow;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}
function vmMat(color, glow) {
  const metal = color.metal === undefined ? 0.2 : color.metal;
  const grain = color.grain ? 1 : 0;
  const key = color.getHexString() + glow + '|' + metal + '|' + grain;
  if (!matCache.has(key)) matCache.set(key, gunMaterial(color, glow, metal, grain));
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
    this.scoped = false; this.A = {}; this.cyc = 9; this.cycDur = 0.1; this.shots = 0; this.drawT = 9; this.spool = 0; this.chargeA = 0;
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
    for (const p of this.parts) { p.removeFromParent(); if (p.userData.merged) p.geometry.dispose(); }
    this.parts = [];
    this.MagRoot = this.PumpRoot = this.SpinPart = this.CylPart = this.support = this.muzzle = this.eject = this.hand = null;
    this.A = {};   // named moving parts: slide, hammer, bolt, lever, barrels, cover, charge, crank, emit, mag, pump, cyl...
    this.Cards = null; this.cardT = 9;
    for (const f of this.flyers || []) f.m.removeFromParent(); this.flyers = [];
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
    const P0 = this.mpivot, tool0 = this.mtool;
    if (!active) {
      if (this.mslash) this.mslash.visible = false;
      // blade in hand: it rests in the right fist, low and angled across the view, and rides the walk
      if (this.wield && !this.hidden) {
        this.wRaise = Math.min(1, (this.wRaise || 0) + dt * 5);
        const r = this.wRaise, e = 1 - (1 - r) * (1 - r), bob = Math.sin((this.bobPhase || 0) * 2) * 0.3 * (this.bobAmp || 0);
        this.mg.visible = true; this.mg.position.set(0, 0, 0); this.mg.rotation.set(0, 0, 0);
        P0.position.set(11, -15.5 - (1 - e) * 10 + bob, -1); P0.rotation.set(0.56, 0.16, 0); tool0.rotation.set(-0.95, 0, 0.42);
      } else { this.mg.visible = false; this.wRaise = 0; }
      return;
    }
    this.wRaise = 0;
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
    const mir = this.wield ? -1 : 1;
    if (mir < 0) { P.position.x = -P.position.x; P.rotation.y = -P.rotation.y; tool.rotation.z = -tool.rotation.z; if (this.wield) P.position.y += out * 9 * 0.75; }   // right hand, and it does not drop out of sight after
    const q = this.mslash;
    if (q && this.mStep < 3) {
      const a = Math.max(0, 1 - Math.abs(t - 0.3) / 0.16);
      const st = mir < 0 && this.mStep < 2 ? 1 - this.mStep : this.mStep;
      q.visible = a > 0.01; q.position.set(st === 2 ? 1 * mir : (st ? 1 : -1), st === 2 ? -1 : -2.5, -20);
      q.scale.set(st === 2 ? 9 : 30, st === 2 ? 24 : 8, 1); q.rotation.z = st === 0 ? -0.2 : st === 1 ? Math.PI + 0.2 : Math.PI / 2;
      q.material.uniforms.tint.value.set(1, 0.95, 0.85, a * 0.32);
    }
  }
  setWeapon(def, tier, animate) {
    if (!this.game.data.weapons[def]) return;   // an empty slot has no model to show
    if (animate && this.parts.length) {
      this.switchDur = 0.3 + 0.1 * gunFeel(this.game.data.weapons[def]).weight;
      this.pendingDef = def; this.pendingTier = tier; this.switchT = this.switchDur; this.swapped = false;
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
    this.feel = gunFeel(W); this.cyc = 9; this.cylTarget = 0; this.cylAngle = 0; this.shots = 0; this.emitK = 1; this.reelSpin = 0; this.crankA = 0;
    const spec = buildGun(this, W, this.weaponTier, Meta.gunLevel(W.name) >= 5);
    const sk = Meta.skin();
    const Glove = hex(sk.glove), GloveLight = hex(sk.gloveL), Cuff = hex(sk.cuff), Sleeve = hex(sk.sleeve), SleeveStripe = hex(sk.stripe);
    const SightZ = spec.Sight, MuzzleAt = spec.Muzzle, EjectAt = spec.Eject, SupportRest = spec.Support;
    this.gunPartCount = this.parts.length;
    if (this.PumpRoot) this.A.pump = this.PumpRoot;
    if (!this.A.mag) this.A.mag = this.MagRoot;
    this.magRest = this.MagRoot.position.clone();
    this.muzzleRest = P3(MuzzleAt);
    this.sightZ = SightZ;
    this.supportRest = P3(SupportRest);
    this.muzzle = this.scene_(MuzzleAt);
    this.eject = this.scene_(EjectAt);
    // --- hands: leather gloves, cream cuffs, rust sleeves ---------------------------------------------------
    const g = this.hand = this.scene_(V(0, 0, 0));
    this.Ext([[-7.6, 2.8], [-3.2, 3.2], [-1.6, -1], [-3.4, -8.6], [-8.8, -9.4], [-10.4, -4]], 6.4, Glove, { bevel: 1.8, y: 0.5, parent: g });   // palm behind the grip
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
    this.Cap(sp, V(-4.6, -8.2, -11), V(-2.4, -3.8, -5), 3.7, Cuff);                  // the forearm comes up from below, so it never crosses the view when the hand works the gun
    this.Cap(sp, V(-12, -28, -48), V(-5, -8.8, -11.8), 4.2, Sleeve, 5.6);
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
    if (!this.noMerge) this.mergeStatic();
  }
  // A detailed gun is a couple of hundred small meshes. Everything that shares a parent and a material is welded into
  // one, so the whole gun draws in a few dozen calls. Moving parts keep their own groups and still animate.
  mergeStatic() {
    const keep = new Set(this.flash); for (const C of this.Cards || []) { keep.add(C.c); keep.add(C.pp); }
    const groups = []; this.gun.traverse((o) => { if (!o.isMesh) groups.push(o); });
    const nm = new THREE.Matrix3(), v = new THREE.Vector3();
    for (const P of groups) {
      const by = new Map();
      for (const m of P.children) { if (!m.isMesh || keep.has(m) || m.children.length || !m.material.uniforms || !m.material.uniforms.uMetal) continue; if (!by.has(m.material)) by.set(m.material, []); by.get(m.material).push(m); }
      for (const [mat, list] of by) {
        if (list.length < 2) continue;
        let n = 0; const src = list.map((m) => { let g = flatCache.get(m.geometry); if (!g) { g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry; flatCache.set(m.geometry, g); } n += g.attributes.position.count; return g; });
        const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let k = 0;
        list.forEach((m, i) => {
          m.updateMatrix(); nm.getNormalMatrix(m.matrix);
          const p = src[i].attributes.position, q = src[i].attributes.normal;
          for (let j = 0; j < p.count; j++, k += 3) {
            v.fromBufferAttribute(p, j).applyMatrix4(m.matrix); pos[k] = v.x; pos[k + 1] = v.y; pos[k + 2] = v.z;
            v.fromBufferAttribute(q, j).applyMatrix3(nm).normalize(); nor[k] = v.x; nor[k + 1] = v.y; nor[k + 2] = v.z;
          }
          m.removeFromParent();
        });
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
        const M = new THREE.Mesh(g, mat); M.userData.merged = true; P.add(M); this.parts.push(M);
      }
    }
  }

  // Static copy of a weapon model (no hands, no flash) lit like the world: for wall-buy plaques.
  static displayModel(game, def, tier = 0) {
    const vm = new ViewModel(game);
    vm.weaponDef = def; vm.weaponTier = tier; vm.noMerge = true;
    vm.build();
    vm.parts.forEach((o, i) => { o.userData.extra = i >= vm.gunPartCount; });
    if (vm.feel.reload === 'revolver' && vm.A.mag) vm.A.mag.visible = false;   // no speedloader on a display piece
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
  twinLeft(n) { return !!this.feel.twin && n % 2 === 0; }
  fire(kick, continuous) {
    const K = Math.min(3, Math.max(0.05, kick));
    const ads = 1 - this.aimA * 0.82;   // aiming steadies the gun: the sights stay close to the target
    const f = this.feel;
    this.shots++;
    const left = this.twinLeft(this.shots);
    // UE (x back, y, z up) -> view (y, z, -x)
    const rx = (Math.random() * 12 - 6) * K * f.side;
    if (left) {
      // the off-hand pistol kicks on its own; the gun hand barely feels it
      this.twinV = (this.twinV || 0) + 260 * K * f.rise * ads;
      this.recoilPosVel.add(new THREE.Vector3(-4 * K, 4 * K, 30 * K * f.pos).multiplyScalar(ads));
      this.recoilRotVel.add(new THREE.Vector3(30 * K, -40 * K, -90 * K).multiplyScalar(ads));
    } else {
      this.recoilPosVel.add(new THREE.Vector3(rx * 1.4, 22 * K * f.rise, 100 * K * f.pos).multiplyScalar(ads));
      this.recoilRotVel.add(new THREE.Vector3(240 * K * f.rise, (Math.random() * 110 - 55) * K * f.side, (f.twin ? 90 * K : (Math.random() * 260 - 130) * K * f.side)).multiplyScalar(ads));
    }
    if (f.shake > 0 && !continuous) this.game.player.addShake(f.shake);
    if (!continuous) { this.cyc = 0; this.cycDur = Math.max(0.03, f.cycle); this.cycSnd = false; this.cycShell = !f.shell; }
    this.cylTurn = f.action === 'revolver';
    if (f.action === 'reels') this.reelSpin = (this.reelSpin || 0) + 1;
    this.emitP = 1;
    if (this.muzzle) { this.muzzle.position.copy(this.muzzleRest); if (left && this.A.twin) this.muzzle.position.add(this.A.twin.userData.rest); }
    if (f.flash > 0 && (!continuous || Math.random() < 0.5)) {
      this.flashTime = continuous ? 0.03 : 0.05;
      const J = (0.8 + Math.random() * 0.5) * f.flash;
      const [star, flame, glow] = this.flash;
      for (const q of this.flash) q.visible = !this.scoped;
      star.userData.spin = Math.random() * Math.PI * 2;
      star.scale.set(this.FS * J * 1.3, this.FS * J * 1.3, 1);
      flame.scale.set(this.FS * 1.3 * J, this.FS * 0.55 * J * (0.8 + Math.random() * 0.4), 1);
      glow.scale.set(this.FS * 5 * f.flash, this.FS * 5 * f.flash, 1);
    }
    if (this.cls === 'LMG' || this.cls === 'Wonder') this.spinSpeed = Math.min(this.spinSpeed + 400, 1800);
    this.fireExtras(continuous);
  }
  // A spent case out of the port: small brass for pistols, long brass for rifles, a fat red hull for shotguns.
  ejectShell() {
    if (!this.eject) return;
    const cam = this.game.camera, kind = this.feel.shell;
    if (this.twinLeft(this.shots) && this.A.twin) this.eject.position.copy(this.eject.userData.rest).add(this.A.twin.userData.rest); else this.eject.position.copy(this.eject.userData.rest);
    const p = this.toWorld(this.eject, 70);
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    const fwd = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 2).negate();
    const hard = kind === 'rifle' ? 1.25 : kind === 'shot' ? 0.8 : 1;
    const vel = right.multiplyScalar((180 + Math.random() * 80) * hard).add(up.multiplyScalar(160 + Math.random() * 100)).addScaledVector(fwd, kind === 'shot' ? -90 : -40).add(this.game.player.vel);
    this.game.fx.debris('FX_Shell', p, vel, kind === 'shot' ? 5.4 : kind === 'rifle' ? 3.8 : 2.7, 3, Math.random() * 1800 - 900, true);
  }
  // ---- small things thrown off the gun when it fires: cards, coins, chips, sparks. They live in the gun's own space. ----
  fling(geo, size, color, glow, from, vel, spin, life = 0.7, grav = 260) {
    if (!this.gun || this.flyers.length > 40) return;
    const m = new THREE.Mesh(PRIM.GEOS[geo], vmMat(new THREE.Color(color), glow));
    m.scale.set(size[0], size[1], size[2]);
    m.position.copy(from); m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    this.gun.add(m);
    this.flyers.push({ m, vel, spin, life, t: 0, grav, s: m.scale.clone() });
  }
  tickFlyers(dt) {
    for (let i = this.flyers.length - 1; i >= 0; i--) {
      const f = this.flyers[i]; f.t += dt;
      if (f.t >= f.life) { f.m.removeFromParent(); this.flyers.splice(i, 1); continue; }
      f.vel.y -= f.grav * dt; f.m.position.addScaledVector(f.vel, dt);
      f.m.rotation.x += f.spin.x * dt; f.m.rotation.y += f.spin.y * dt; f.m.rotation.z += f.spin.z * dt;
      const k = Math.min(1, (f.life - f.t) / 0.15); f.m.scale.copy(f.s).multiplyScalar(k);
    }
    // Dead Man's Hand: the fanned hand is thrown, then five new cards are dealt up out of the shoe one after another
    if (this.Cards) {
      this.cardT += dt; const t = this.cardT;
      for (const C of this.Cards) {
        const i = C.k + 2; let z = 0, y = 0, x = 0, s = 1, vis = true;
        if (t < 0.08) { const u = t / 0.08; z = -46 * u; x = C.k * 5 * u; y = 2 * u; }
        else { const d0 = 0.11 + i * 0.035; if (t < d0) vis = false; else { const u = Math.min(1, (t - d0) / 0.07); z = 7 * (1 - u); y = -3 * (1 - u); s = 0.4 + 0.6 * u; } }
        for (const [m, r] of [[C.c, C.cr], [C.pp, C.pr]]) { m.visible = vis; m.position.set(r.x + x, r.y + y, r.z + z); }
        C.c.scale.setScalar(1).multiply(C.cs || (C.cs = C.c.scale.clone())); if (s !== 1) C.c.scale.multiplyScalar(s);
      }
    }
  }
  fireExtras(continuous) {
    const name = (this.game.data.weapons[this.weaponDef] || {}).name, cls = this.cls, G0 = this.game, r = (a, b) => a + Math.random() * (b - a);
    const ej = this.eject ? this.gun.worldToLocal(this.eject.getWorldPosition(new THREE.Vector3())) : new THREE.Vector3(), mz = this.muzzle ? this.gun.worldToLocal(this.muzzle.getWorldPosition(new THREE.Vector3())) : new THREE.Vector3();
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    if (this.Cards) { this.cardT = 0; for (const q of this.flash) q.visible = false; return; }
    if (name === 'Gold Rush') this.fling(2, [1.5, 1.2, 1.4], 0xFFC83C, 0.5, ej, V3(r(40, 70), r(70, 110), r(-10, 10)), V3(r(16, 26), 0, r(8, 14)), 0.65, 300);   // a fleck of gold off every shot
    else if (name === 'Thunderhead') for (let i = 0; i < 3; i++) this.fling(2, [1, 1, 1], 0xBFEFFF, 1.3, mz, V3(r(-60, 60), r(-20, 90), r(-30, 30)), V3(0, 0, 0), 0.25, 120);   // sparks
    else if (name === 'Fireworks Finale') for (let i = 0; i < 5; i++) this.fling(2, [1.3, 1.3, 1.3], [0xFF5078, 0xFFE070, 0x60E0FF, 0x90FF70, 0xFFA040][i], 1.2, mz, V3(r(-70, 70), r(-20, 90), r(-40, 40)), V3(0, 0, 0), 0.4, 200);
    else if (cls === 'Energy' && !continuous) for (let i = 0; i < 3; i++) this.fling(2, [1, 1, 1], (this.game.data.weapons[this.weaponDef] || {}).color || 0x9CE8FF, 1.3, mz, V3(r(-60, 60), r(-30, 70), r(-30, 30)), V3(0, 0, 0), 0.22, 120);   // sparks off the emitter
    // smoke rolls off anything with a big charge
    if (!continuous && (cls === 'Launcher' || cls === 'Shotgun' || cls === 'Sniper' || name === 'Saloon Six') && this.muzzle) {
      const p = this.toWorld(this.muzzle, 80), cam = G0.camera, fwd = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 2).negate();
      const n = cls === 'Launcher' ? 3 : 2;
      for (let i = 0; i < n; i++) G0.fx.puff(p.clone().addScaledVector(fwd, i * 14), [0.78, 0.76, 0.72], cls === 'Launcher' ? 34 : 20, 0.5 + i * 0.12, fwd.clone().multiplyScalar(60 + i * 50).add(G0.player.vel));
      if (cls === 'Launcher') { const ep = this.toWorld(this.eject || this.muzzle, 60); G0.fx.puff(ep.addScaledVector(fwd, -30), [0.6, 0.58, 0.55], 30, 0.45, fwd.clone().multiplyScalar(-160).add(G0.player.vel)); }   // backblast
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
  muzzleWorld() {
    if (!this.muzzle) return this.game.player.eye();
    if (this.feel.twin && this.A.twin) { this.muzzle.position.copy(this.muzzleRest); if (this.twinLeft(this.shots + 1)) this.muzzle.position.add(this.A.twin.userData.rest); this.muzzle.updateMatrixWorld(true); }   // the pistol about to fire
    return this.toWorld(this.muzzle, 60);
  }

  // ---------------------------------------------------------------- per frame
  update(dt, In) {
    if (dt <= 0) return;
    dt = Math.min(dt, 0.05);
    this.time += dt;
    const f = this.feel, w = f.weight, A = this.A, audio = this.game.audio;
    const hs = Math.hypot(In.localVel.x, In.localVel.z);
    this.sprintA = interp(this.sprintA, (In.sprinting && !In.aiming && !In.reloading && In.grounded) ? 1 : 0, dt, 9);
    this.aimA = interp(this.aimA, (In.aiming && !In.reloading && this.switchT <= 0) ? 1 : 0, dt, 14 / Math.pow(w, 0.7));   // heavy guns come up to the eye slower
    this.slideA = interp(this.slideA, In.sliding ? 1 : 0, dt, 10);
    this.wallA = interp(this.wallA, In.wallSide, dt, 8);
    this.airA = interp(this.airA, In.grounded ? 0 : 1, dt, 6);
    this.scoped = this.cls === 'Sniper' && this.aimA > 0.92;

    // sway (UE: Y right, Z up) -> view x, y. A heavy gun lags further behind the hand and takes longer to settle.
    const sm = 1 - this.aimA * 0.75;
    const lx = Math.max(-6, Math.min(6, In.look.x)), ly = Math.max(-6, Math.min(6, In.look.y));
    this.swayVel.add(new THREE.Vector3(-lx * 0.9 * sm, -ly * 0.7 * sm, 0).multiplyScalar(40));
    spring(this.swayPos, this.swayVel, 160 / w, 18 / Math.sqrt(w), dt);
    const lx8 = Math.max(-8, Math.min(8, In.look.x)), ly8 = Math.max(-8, Math.min(8, In.look.y));
    this.swayRotVel.add(new THREE.Vector3(ly8 * 1.4, -lx8 * 1.6, -lx8 * 2.4).multiplyScalar(22 * sm));
    spring(this.swayRot, this.swayRotVel, 140 / w, 16 / Math.sqrt(w), dt);
    this.swayPos.clampScalar(-5, 5);
    this.swayRot.clampScalar(-12, 12);

    const bobT = In.grounded && !In.sliding ? Math.min(1.6, hs / 640) : 0;
    this.bobAmp = interp(this.bobAmp, bobT, dt, 8);
    this.bobPhase += dt * (6 + hs * 0.0105);
    const bm = this.bobAmp * (1 - this.aimA * 0.85) * (1 + this.sprintA * 0.6) * (0.7 + 0.32 * w);
    const bob = new THREE.Vector3(Math.sin(this.bobPhase) * 1.6 * bm, -Math.abs(Math.cos(this.bobPhase)) * 1.4 * bm + Math.sin(this.time * 1.6) * 0.25, 0);
    const bobRot = new THREE.Vector3(Math.abs(Math.cos(this.bobPhase)) * 1.2 * bm, Math.sin(this.bobPhase) * 0.8 * bm, Math.sin(this.bobPhase) * 1.6 * bm);

    spring(this.recoilPos, this.recoilPosVel, f.k, f.d, dt);
    spring(this.recoilRot, this.recoilRotVel, f.k * 0.92, f.d * 0.9, dt);
    { const a = (0 - this.landZ) * 120 - this.landVel * 13; this.landVel += a * dt; this.landZ += this.landVel * dt; }
    { const a = (0 - (this.twinR || 0)) * 330 - (this.twinV || 0) * 24; this.twinV = (this.twinV || 0) + a * dt; this.twinR = (this.twinR || 0) + this.twinV * dt; }

    // positions in UE-local terms (x fwd, y right, z up) then mapped
    const hipK = 1 - this.aimA, hip = f.hip || [0, 0, 0, 0, 0, 0];
    const ads = { X: 26, Y: 0, Z: -(this.sightTop ?? this.sightZ) - 0.45 };
    const pos = { X: HipPos.X + (ads.X - HipPos.X) * this.aimA, Y: HipPos.Y + (ads.Y - HipPos.Y) * this.aimA, Z: HipPos.Z + (ads.Z - HipPos.Z) * this.aimA };
    const rot = { P: 0, Y: 0, R: 0 };
    const add = (x, y, z, k) => { pos.X += x * k; pos.Y += y * k; pos.Z += z * k; };
    const rel = { P: 0, Y: 0, R: 0 }; let relOn = false;   // how far a reload has turned the gun: the off hand does not turn with it
    const addR = (p, y, r, k) => { rot.P += p * k; rot.Y += y * k; rot.R += r * k; if (relOn) { rel.P += p * k; rel.Y += y * k; rel.R += r * k; } };
    add(hip[0], hip[1], hip[2], hipK); addR(hip[3], hip[4], hip[5], hipK);
    add(-6, -2, -6, this.sprintA); addR(-16, -32, -24, this.sprintA);
    add(-2, -2, -3, this.slideA); addR(4, 0, -16, this.slideA);
    rot.R += -this.wallA * 10;
    pos.Z += this.airA * 1.2; rot.P += this.airA * 3;
    pos.Z += Math.sin(this.time * 1.4) * 0.3 * (1 - this.aimA);

    // ---- moving parts: everything starts the frame at rest, then the action, the reload and the draw move it ----
    for (const k in A) { const g = A[k]; g.position.copy(g.userData.rest); g.rotation.set(0, 0, 0); g.scale.setScalar(1); g.visible = true; }
    const U = (fw, rt = 0, up = 0) => new THREE.Vector3(rt, up, -fw);
    const mv = (n, fw, rt = 0, up = 0) => { const g = A[n]; if (g) { g.position.x += rt; g.position.y += up; g.position.z -= fw; } };
    const rx = (n, deg) => { const g = A[n]; if (g) g.rotation.x += d2r(deg); };
    const rz = (n, deg) => { const g = A[n]; if (g) g.rotation.z += d2r(deg); };
    const supPos = this.supportRest.clone(), handOff = new THREE.Vector3(); let handRot = 0, gunSpin = 0;
    const supTo = (t, k) => { if (k > 0) supPos.lerp(t, Math.min(1, k)); };
    const magOff = new THREE.Vector3();
    const bump = (x, a, b, c, d) => sstep(a, b, x) * (1 - sstep(c, d, x));
    const OFF = U(6, -12, -38);                                    // where the off hand goes when it leaves the view
    const play = (n, v = 0.8, p = 1) => audio.play(n, v, p);

    const pumpCycle = (r) => { mv('pump', -7 * r); };
    const leverCycle = (r) => { rx('lever', 46 * r); handOff.add(U(1.6 * r, 0, -4.4 * r)); handRot += 16 * r; addR(-9, 0, 7, r); add(1.5, 0, -1.5, r); };
    const boltCycle = (u) => {
      const reach = bump(u, 0, 0.16, 0.84, 1), lift = bump(u, 0.14, 0.28, 0.7, 0.84), pull = bump(u, 0.26, 0.42, 0.5, 0.7), mid = Math.sin(Math.min(1, Math.max(0, u)) * Math.PI);
      rz('bolt', 58 * lift); mv('bolt', -7.5 * pull);
      handOff.add(U(1, 4.2, 6.2).multiplyScalar(reach)).add(U(-7.5 * pull, -1.6 * lift, 2.6 * lift));
      addR(5, -4, 15, mid); add(-2, 0, -1.2, mid);
    };
    const chargeCycle = (u) => {   // the off hand racks the handle
      const reach = bump(u, 0, 0.3, 0.72, 1), pull = bump(u, 0.28, 0.5, 0.56, 0.7);
      const cp = (A.charge ? A.charge.userData.rest : this.magRest).clone();
      mv('charge', -5.5 * pull);
      supTo(cp.add(U(-1 - 5.5 * pull, -1.5, 1)), reach);
    };

    // ---- the action cycling after a shot
    this.cyc += dt;
    const u = this.cyc / this.cycDur, act = f.action;
    const RT = In.reloading ? Math.min(1, Math.max(0, In.reloadFrac)) : -1;
    if (In.reloading && this.lastReload === 0) this.reloadFrom = In.ammo || 0;        // what was left when the reload began
    const wasEmpty = (this.reloadFrom || 0) <= 0;
    const manual = !In.reloading;                                                     // a reload takes over from the hand that works the action
    const blow = u < 1 ? (u < 0.28 ? u / 0.28 : 1 - (u - 0.28) / 0.72) : 0;     // back fast, forward slower
    if (!this.cycShell && u >= f.shellAt && this.cyc < this.cycDur + 0.25 && (manual || f.shellAt === 0)) { this.cycShell = true; this.ejectShell(); }
    const rackSnd = (at, v = 0.75, p = 1) => { if (!this.cycSnd && u >= at && u < 1.5) { this.cycSnd = true; play('S_Rack', v, p); } };
    if (act === 'slide') {
      const cur = this.twinLeft(this.shots) ? 'slide2' : 'slide';
      if (In.empty && f.lock) { mv('slide', -3.4); mv('slide2', -3.4); } else mv(cur, -3.4 * blow);
      rx(this.twinLeft(this.shots) ? 'hammer2' : 'hammer', 30 * blow);
    } else if (act === 'recip') mv('charge', -3.2 * blow);
    else if (act === 'revolver') {
      // The hammer falls with the shot and is thumbed back for the next, turning the cylinder one chamber as it comes.
      // It stays down through a reload and is cocked again at the end, and it is cocked as the gun is drawn.
      let h = u < 0.2 ? 0 : 36 * Math.min(1, (u - 0.2) / 0.5);
      if (RT >= 0) h = 36 * sstep(0.86, 0.96, RT); else if (this.drawT < 0.5) h = Math.min(h, 36 * sstep(0.22, 0.4, this.drawT));
      rx('hammer', h);
      if (this.cylTurn && u >= 0.25) { this.cylTurn = false; this.cylTarget += Math.PI / 3; }
      if (this.drawT >= 0.3 && this.drawClick !== this.weaponDef) { this.drawClick = this.weaponDef; play('S_Rack', 0.35, 1.9); }
    }
    else if (act === 'hammers') rx('hammer', RT >= 0 ? 30 * sstep(0.78, 0.86, RT) : (In.empty || u < 0.5) ? 0 : 30 * Math.min(1, (u - 0.5) / 0.4));   // cocked when the gun is snapped shut
    else if (act === 'pump') { if (u < 1 && manual) { pumpCycle(u > 0.18 ? Math.sin(((u - 0.18) / 0.82) * Math.PI) : 0); rackSnd(0.3); } }
    else if (act === 'lever') { rx('hammer', u < 0.3 ? 0 : 30 * Math.min(1, (u - 0.3) / 0.3)); if (u < 1 && manual) { leverCycle(Math.sin(u * Math.PI)); rackSnd(0.25, 0.5, 1.3); } }
    else if (act === 'bolt') { if (u < 1 && manual) { boltCycle(u); rackSnd(0.32, 0.8, 0.85); } }
    else if (act === 'load' && manual && A.mag) {
      // a launcher holds one round in the tube: after the shot the off hand fetches the next and seats it
      if (In.empty) A.mag.visible = false;
      else if (u < 1) {
        const front = this.magRest.clone().add(U(15, 0, 0));
        const mp = U(26, -16, -30).lerp(front, sstep(0.22, 0.6, u)).lerp(this.magRest, sstep(0.64, 0.86, u));
        A.mag.position.copy(mp); A.mag.visible = u > 0.22;
        supTo(mp.clone().add(U(3, -2.5, -3)), bump(u, 0.04, 0.22, 0.88, 1));
        if (!this.cycSnd && u >= 0.84) { this.cycSnd = true; play('S_ShellIn', 0.7, 0.8); this.jolt(0.5); }
      }
    }
    if (this.A.twin) this.A.twin.rotation.x += d2r((this.twinR || 0) - this.recoilRot.x * 0.8);          // each pistol kicks on its own
    // glowing emitters swell with every shot and breathe at rest; the rail gun's swells as it charges
    this.emitP = Math.max(0, (this.emitP || 0) - dt * 7);
    this.chargeA = interp(this.chargeA, In.charge || 0, dt, 30);
    let emitScale = 1 + 0.06 * Math.sin(this.time * 5.5) + 0.45 * this.emitP + 1.4 * this.chargeA;
    if (this.chargeA > 0.02) { add((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, 0, this.chargeA); add(-2.5, 0, 0, this.chargeA); }   // drawn back and humming
    if (f.action === 'reels' || f.reload === 'charge') {
      // three reels: each shot knocks them on a third of a turn, one after another
      this.reelA = this.reelA || [0, 0, 0];
      for (let i = 0; i < 3; i++) { const target = (this.reelSpin || 0) * 120; this.reelA[i] += (target - this.reelA[i]) * Math.min(1, dt * (16 - i * 4)); rx('reel' + i, this.reelA[i]); }
    }

    // ---- reload choreography
    let pumpOff = 0;
    if (In.reloading) {
      relOn = true;
      const T = Math.min(1, Math.max(0, In.reloadFrac)), last = this.lastReload;
      const cue = (m, fn) => { if (last < m && T >= m) fn(); };
      const rp = f.rp || [14, -8, 30];
      const pose = (a, b, c, d, px = -2, py = -2, pz = 3) => { const k = bump(T, a, b, c, d); add(px, py, pz, k); addR(rp[0], rp[1], rp[2], k); return k; };
      const magSwap = (t, dir, grab, inSnd = 'S_MagIn') => {
        const k = sstep(t[1], t[2], T) * (1 - sstep(t[3], t[4], T));
        magOff.copy(dir).multiplyScalar(k);
        supTo(this.magRest.clone().add(magOff).add(grab), sstep(t[0], t[1], T) * (1 - sstep(t[4] + 0.02, t[5], T)));
        cue(t[1], () => play('S_MagOut', 0.7));
        cue(t[4], () => { play(inSnd, 0.8); this.jolt(0.7); });
      };
      const finish = (a, b) => {
        const v = (T - a) / (b - a), on = v > 0 && v < 1;
        if (!wasEmpty && !['slap', 'rev'].includes(f.charge)) return;      // there is still a round in the chamber: nothing to rack
        if (['bolt', 'pump', 'lever'].includes(f.charge) && !this.cycShell) cue(a + (b - a) * 0.42, () => { this.cycShell = true; this.ejectShell(); });   // the last empty comes out now
        switch (f.charge) {
          case 'slide': { const s = 1 - sstep(a, a + (b - a) * 0.3, T); mv('slide', -3.4 * s); mv('slide2', -3.4 * s); cue(a + 0.01, () => { play('S_Rack', 0.6, 1.4); this.jolt(0.4); }); break; }
          case 'handle': if (on) chargeCycle(v); cue(a + (b - a) * 0.5, () => { play('S_Rack', 0.8); this.jolt(0.5); }); break;
          case 'bolt': if (on) boltCycle(v); cue(a + (b - a) * 0.35, () => { play('S_Rack', 0.8, 0.85); this.jolt(0.4); }); break;
          case 'pump': if (on) pumpCycle(Math.sin(v * Math.PI)); cue(a + (b - a) * 0.4, () => { play('S_Rack', 0.8); this.jolt(0.5); }); break;
          case 'lever': if (on) leverCycle(Math.sin(v * Math.PI)); cue(a + (b - a) * 0.4, () => { play('S_Rack', 0.6, 1.3); this.jolt(0.4); }); break;
          case 'slap': supTo(this.magRest.clone().add(U(0, -1, -8 + 3 * bump(v, 0.3, 0.5, 0.5, 0.7))), bump(v, 0, 0.3, 0.7, 1)); cue(a + (b - a) * 0.5, () => { play('S_MagIn', 0.6, 0.8); this.jolt(0.8); }); break;
          case 'rev': cue(a + (b - a) * 0.4, () => { this.spinSpeed = 2600; play('S_Saw', 0.5, 1.2); this.jolt(0.6); }); break;
          default: break;
        }
      };
      const md = f.magDir ? U(f.magDir[0], f.magDir[1], f.magDir[2]) : U(-3, -9, -28);
      const racks = wasEmpty || ['slap', 'rev'].includes(f.charge), st = racks ? 1 : 1.2;   // with nothing to rack the swap takes its time
      switch (f.reload) {
        case 'twin': {   // no free hand: both magazines are thumbed out, the guns dip out of sight and come back loaded
          const tip = bump(T, 0.04, 0.16, 0.74, 0.86), dip = bump(T, 0.26, 0.4, 0.58, 0.74), fall = sstep(0.18, 0.34, T);
          addR(26, 0, 0, tip); add(0, 0, 3, tip); add(-4, 0, -30, dip);
          if (this.A.twin) this.A.twin.rotation.z += d2r(-24 * tip);
          rot.R += 20 * tip;
          const gone = T > 0.3 && T < 0.5;
          for (const n of ['mag', 'mag2']) if (A[n]) { A[n].position.y -= (T < 0.5 ? fall * fall * 46 : 0); A[n].visible = !gone; }
          if (wasEmpty) { mv('slide', -3.4 * (1 - sstep(0.8, 0.84, T))); mv('slide2', -3.4 * (1 - sstep(0.87, 0.91, T))); }
          cue(0.18, () => play('S_MagOut', 0.8)); cue(0.5, () => { play('S_MagIn', 0.8); this.jolt(0.5); }); cue(0.56, () => play('S_MagIn', 0.7, 1.1));
          if (wasEmpty) { cue(0.81, () => { play('S_Rack', 0.6, 1.4); this.jolt(0.4); }); cue(0.88, () => { play('S_Rack', 0.6, 1.5); this.jolt(-0.4); }); }
          supPos.copy(this.supportRest);
          break;
        }
        case 'revolver': {
          // Swing the cylinder out, dump the brass, press a full loader in, pull the loader away, flick it shut, cock.
          const open = bump(T, 0.05, 0.16, 0.74, 0.82);
          add(-1, -1, 3.5, open); addR(rp[0], rp[1], rp[2], open);
          addR(0, 0, -14, bump(T, 0.74, 0.8, 0.8, 0.9));                                   // the wrist flick that closes it
          const swing = U(0, -5.2, -1.6);
          if (A.cyl) A.cyl.position.add(swing.clone().multiplyScalar(open));
          if (A.rims) A.rims.visible = T < 0.19 || T >= 0.58;                               // out with the empties, in with the loader's six
          cue(0.19, () => { play('S_ShellDrop', 0.9); this.jolt(-0.6); const at = A.cyl ? A.cyl.position.clone() : new THREE.Vector3(); for (let i = 0; i < 6; i++) this.fling(1, [0.9, 2.4, 0.9], 0xD9A03A, 0.3, at.clone().add(U(-2, 0, 0)), new THREE.Vector3(-20 + Math.random() * 30, 10 + Math.random() * 40, 40 + Math.random() * 40), new THREE.Vector3(Math.random() * 12, Math.random() * 12, Math.random() * 12), 0.6, 320); });
          const cylAt = (A.cyl ? A.cyl.userData.rest : this.magRest).clone().add(swing), back = cylAt.clone().add(U(-8, 0, 0));
          const mp = OFF.clone().lerp(back, sstep(0.28, 0.48, T)).lerp(cylAt, sstep(0.5, 0.58, T)).lerp(back, sstep(0.6, 0.66, T)).lerp(OFF, sstep(0.66, 0.78, T));
          if (A.mag) { A.mag.position.copy(mp); A.mag.visible = T > 0.28 && T < 0.78; }
          if (A.loaderRounds) A.loaderRounds.visible = T < 0.58;                            // the rounds stay in the cylinder; the empty loader comes away
          supTo(mp.clone().add(U(-4, -1.5, -2)), bump(T, 0.22, 0.32, 0.7, 0.8));
          cue(0.58, () => { play('S_ShellIn', 0.8); this.jolt(0.5); });
          cue(0.8, () => { play('S_Rack', 0.8, 1.35); this.jolt(0.9); });
          cue(0.91, () => play('S_Rack', 0.35, 1.9));
          break;
        }
        case 'break': {
          const open = bump(T, 0.04, 0.15, 0.7, 0.77);
          add(-2, -1, 3, open); addR(rp[0], rp[1], rp[2], open);
          rx('barrels', -38 * open);
          const B = A.barrels, q = B ? B.quaternion.clone().setFromEuler(B.rotation) : new THREE.Quaternion(), piv = B ? B.userData.rest : new THREE.Vector3();
          const home = this.magRest.clone().sub(piv).applyQuaternion(q).add(piv), axis = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
          const mp = OFF.clone().lerp(home.clone().addScaledVector(axis, -9), sstep(0.3, 0.48, T)).lerp(home, sstep(0.5, 0.6, T));
          if (A.mag) { A.mag.position.copy(T < 0.3 ? home : mp); A.mag.quaternion.copy(q); A.mag.visible = T < 0.16 || T > 0.3; }
          cue(0.16, () => { play('S_HullDrop', 0.9); this.jolt(-0.5); for (const s of [-1, 1]) this.fling(1, [3.2, 5.2, 3.2], 0xB0262C, 0.2, home.clone().add(new THREE.Vector3(s * 2, 0, 0)), new THREE.Vector3(s * 14, 60 + Math.random() * 30, 70 + Math.random() * 30), new THREE.Vector3(6 + Math.random() * 8, 0, Math.random() * 8), 0.7, 320); const p = this.toWorld(this.eject, 60); this.game.fx.puff(p, [0.75, 0.73, 0.7], 18, 0.5, this.game.player.vel); });
          supTo(mp.clone().add(U(-4, -1.5, -2)), bump(T, 0.2, 0.32, 0.6, 0.7));
          const sr = this.supportRest.clone().sub(piv).applyQuaternion(q).add(piv); supPos.lerp(sr, T < 0.2 ? 1 - sstep(0.16, 0.2, T) : sstep(0.6, 0.7, T));
          cue(0.58, () => { play('S_ShellIn', 0.8); this.jolt(0.4); }); cue(0.61, () => play('S_ShellIn', 0.7, 1.15));
          cue(0.75, () => { play('S_Rack', 0.9, 0.9); this.jolt(1.1); });
          break;
        }
        case 'shell': {
          pose(0, 0.1, wasEmpty ? 0.8 : 0.88, wasEmpty ? 0.94 : 1, -1, -2, 7);
          const n = f.shells || 3, w0 = 0.12, len = ((wasEmpty ? 0.74 : 0.88) - w0) / n, port = this.magRest.clone().add(U(0, 0, -3.6));   // fed up through the gate in its belly
          let vis = false; const mp = OFF.clone();
          for (let i = 0; i < n; i++) {
            const v = (T - w0 - i * len) / len; if (v <= 0 || v >= 1) continue;
            mp.copy(OFF).lerp(port.clone().add(U(-3, -2, -8)), sstep(0, 0.5, v)).lerp(port, sstep(0.55, 0.82, v)); vis = v < 0.86;
            cue(w0 + (i + 0.8) * len, () => { play('S_ShellIn', 0.75, 0.95 + i * 0.06); this.jolt(0.35); });
          }
          if (A.mag) { A.mag.position.copy(mp); A.mag.visible = vis; }
          supTo(mp.clone().add(U(-3, -1.5, -3.5)), bump(T, 0.05, 0.14, wasEmpty ? 0.72 : 0.86, wasEmpty ? 0.8 : 0.94));
          finish(0.78, 0.97);
          break;
        }
        case 'box': {
          pose(0, 0.1, 0.9, 1, -2, -1, 2);
          const lid = bump(T, 0.1, 0.18, 0.7, 0.76);
          rx('cover', -56 * lid);
          const latch = (A.cover ? A.cover.userData.rest : this.magRest).clone().add(U(-8, -4.6, -0.5));   // the near edge of the cover, well forward of the eye
          supTo(latch.clone().add(U(0, 0, 3 * lid)), bump(T, 0.04, 0.1, 0.16, 0.2));
          magSwap([0.18, 0.26, 0.38, 0.48, 0.6, 0.66], U(-2, -20, -26), U(0, -3, -5));
          supTo(latch.clone().add(U(0, 0, 3 * lid)), bump(T, 0.66, 0.7, 0.76, 0.8));
          cue(0.12, () => play('S_Rack', 0.5, 1.5)); cue(0.75, () => { play('S_Rack', 0.9, 0.75); this.jolt(1.1); });
          finish(0.8, 0.97);
          break;
        }
        case 'drumtop': {
          pose(0, 0.1, 0.88, 1, 6, -1, -4);
          magSwap([0.08, 0.18, 0.32, 0.46, 0.6, 0.7], U(-2, -34, -8), U(-1, -4.5, -2));   // slid off to the side, never over the sights
          if (T > 0.78 && T < 0.96) { this.crankA = (this.crankA || 0) + dt * 540; this.spinSpeed = Math.max(this.spinSpeed, 500); }   // a turn of the crank to seat the first round
          cue(0.79, () => play('S_Rack', 0.7, 0.9)); cue(0.88, () => play('S_Rack', 0.4, 1.6));
          break;
        }
        case 'muzzle': {
          pose(0, 0.14, 0.84, 1, -4, -2, 2);
          const front = this.magRest.clone().add(U(16, 0, 0));
          if (wasEmpty) {
            const mp = U(26, -16, -30).lerp(front, sstep(0.26, 0.5, T)).lerp(this.magRest, sstep(0.54, 0.7, T));
            if (A.mag) { A.mag.position.copy(mp); A.mag.visible = T > 0.26; }
            supTo(mp.clone().add(U(3, -2.5, -3)), bump(T, 0.1, 0.26, 0.72, 0.84));
            if (f.beats) for (let i = 0; i < f.beats; i++) cue(0.56 + i * 0.045, () => { play('S_ShellIn', 0.8, 0.9 + i * 0.08); this.jolt(0.4); });
            else cue(0.68, () => { play('S_MagIn', 0.9, 0.8); this.jolt(0.9); });
          } else {   // the round in the tube stays where it is: the hand checks it is seated
            const press = bump(T, 0.34, 0.44, 0.5, 0.6);
            supTo(this.magRest.clone().add(U(8 - 3 * press, -2.5, -3)), bump(T, 0.12, 0.32, 0.62, 0.8));
            cue(0.44, () => { play('S_MagIn', 0.7, 0.8); this.jolt(0.6); });
          }
          cue(0.86, () => { play('S_Rack', 0.5, 0.7); this.jolt(0.3); });
          break;
        }
        case 'cell': {
          pose(0, 0.12, 0.84, 1, -2, -2, 3);
          if (A.mag) A.mag.rotation.y = d2r(90) * bump(T, 0.12, 0.2, 0.6, 0.68);
          magSwap([0.06, 0.2, 0.32, 0.46, 0.6, 0.72], U(-2, -8, -28), U(0, -0.5, -6), 'S_MagIn');
          cue(0.21, () => { play('S_Flame', 0.4, 1.6); const p = this.toWorld(this.MagRoot, 60); for (let i = 0; i < 3; i++) this.game.fx.puff(p, [0.85, 0.9, 0.95], 16 + i * 6, 0.5 + i * 0.1, new THREE.Vector3(0, -40 - i * 20, 0).add(this.game.player.vel)); });   // spent cell vents
          emitScale = T < 0.2 ? emitScale : T < 0.7 ? 0.12 : emitScale + 1.1 * (1 - sstep(0.7, 0.92, T));
          cue(0.7, () => { play('S_PowerUp', 0.35, 1.6); this.jolt(0.5); });
          break;
        }
        case 'charge': {   // throw the lever: the rotors spin up, a fresh capacitor stack goes in, and it hums back to life
          pose(0, 0.1, 0.88, 1, -2, -1, 2);
          const lev = A.lever ? A.lever.userData.rest.clone().add(U(0, 0.5, 6)) : this.magRest.clone();
          const pull = bump(T, 0.12, 0.22, 0.26, 0.38);
          rx('lever', 62 * pull);
          supTo(lev.add(U(-5.4 * pull, 0, -2 * pull)), bump(T, 0.03, 0.12, 0.3, 0.42));
          cue(0.14, () => play('S_Rack', 0.8, 0.7));
          this.reelA = this.reelA || [0, 0, 0];
          for (let i = 0; i < 3; i++) if (T > 0.2 && T < 0.58 + i * 0.1) this.reelA[i] += dt * 1400;
          for (let i = 0; i < 3; i++) cue(0.58 + i * 0.1, () => { play('S_Chain', 0.35, 1 + i * 0.15); this.jolt(0.3); this.reelA[i] = Math.round(this.reelA[i] / 120) * 120; this.reelSpin = Math.round(this.reelA[i] / 120); });
          magOff.copy(U(0, 0, -16)).multiplyScalar(T < 0.3 ? sstep(0.04, 0.14, T) : 1 - sstep(0.4, 0.74, T));
          cue(0.62, () => play('S_MagIn', 0.8, 0.9));
          cue(0.84, () => { play('S_PowerUp', 0.4, 1.3); this.jolt(0.8); this.emitP = 1.5; });
          break;
        }
        case 'deck': {   // knock the spent cassette away, slap a fresh one on, and five new blades spring into the mouth
          pose(0, 0.1, 0.86, 1, 6, -1, -3);
          const D = A.deck, home = D ? D.userData.rest.clone() : this.magRest.clone();
          const off = sstep(0.1, 0.22, T);
          const dp = OFF.clone().lerp(home.clone().add(U(0, -11, 3)), sstep(0.34, 0.52, T)).lerp(home, sstep(0.54, 0.62, T));
          if (D) { if (T < 0.3) { D.position.copy(home).add(U(-4 * off, -16 * off, 5 * off)); D.rotation.z = d2r(70 * off); D.visible = T < 0.22; } else { D.position.copy(dp); D.visible = T > 0.34; } }
          cue(0.11, () => { play('S_Switch', 0.8, 0.8); for (let i = 0; i < 3; i++) this.fling(0, [5, 0.14, 1.4], 0xC9CED8, 0.2, home.clone(), new THREE.Vector3(-50 - Math.random() * 60, 20 + Math.random() * 60, Math.random() * 40 - 10), new THREE.Vector3(Math.random() * 8 - 4, 10 + Math.random() * 12, Math.random() * 8 - 4), 0.7, 200); });
          supTo(dp.clone().add(U(-1, -4, -0.5)), bump(T, 0.28, 0.38, 0.64, 0.76));
          cue(0.61, () => { play('S_MagIn', 0.8, 1.2); this.jolt(0.7); });
          if (A.mag) A.mag.visible = wasEmpty ? T > 0.72 : (T < 0.1 || T > 0.72);          // an empty gun has no hand of cards left to show
          cue(0.73, () => { this.cardT = 0.09; for (let i = 0; i < 5; i++) setTimeout(() => play('S_Rack', 0.3, 1.8 + i * 0.1), i * 35); });
          break;
        }
        default: {   // box magazines, drums and stick mags
          pose(0, 0.12, 0.86, 1);
          magSwap([0.08 * st, 0.2 * st, 0.33 * st, 0.47 * st, 0.6 * st, 0.72 * st], md, U(0, -0.5, -5.5));
          finish(0.74, 0.96);
        }
      }
      this.lastReload = T; relOn = false;
    } else {
      this.lastReload = 0;
      if (f.reload === 'revolver' && A.mag) A.mag.visible = false;                    // the speedloader lives in a pocket
      if (f.reload === 'muzzle' && A.mag && In.empty) A.mag.visible = false;          // nothing left in the tube
      if (f.reload === 'deck' && A.mag && In.empty) A.mag.visible = false;            // the last hand has been thrown
    }
    void pumpOff;
    if (A.emit) { A.emit.scale.setScalar(Math.max(0.05, emitScale)); if (this.cls === 'Energy') A.emit.position.y += Math.sin(this.time * 2.3) * 0.35; }

    // ---- bringing a gun up
    if (this.switchT > 0) {
      const half = (this.switchDur || 0.36) / 2;
      this.switchT -= dt;
      if (this.switchT <= half && !this.swapped && this.pendingDef >= 0) {
        this.swapped = true;
        this.weaponDef = this.pendingDef; this.weaponTier = this.pendingTier; this.pendingDef = -1;
        this.build();
        this.drawT = 0;
        audio.play('S_Switch', 0.7);
        return this.update(1e-4, In);          // pose the new gun this frame
      }
    }
    {
      const dur = this.switchDur || 0.36, half = dur / 2;
      const drop = this.switchT <= 0 ? 0 : (this.switchT > half ? 1 - sstep(half, dur, this.switchT) : sstep(0, half, this.switchT));
      add(-4, 2, -22, drop); addR(-35, 10, 20, drop);
      // each kind of gun arrives its own way
      this.drawT += dt;
      const d = this.feel.draw, t = this.drawT;
      if (d === 'heavy' && t < 0.5) { const s = bump(t, 0.12, 0.26, 0.3, 0.5); add(0, 0, -3.5, s); addR(-5, 0, 0, s); if (this.drawSnd !== this.weaponDef && t > 0.2) { this.drawSnd = this.weaponDef; this.game.player.addShake(0.12); } }   // it lands in the hands with a thud
    }
    if (this.CylPart) { this.cylAngle += (this.cylTarget - this.cylAngle) * Math.min(1, dt * 30); this.CylPart.rotation.z = this.cylAngle; }
    if (f.action === 'crank') { this.crankA = (this.crankA || 0) + this.spinSpeed * dt * 0.3; this.spinSpeed = Math.max(this.spinSpeed, (In.spool || 0) * 1700); }
    rx('crank', this.crankA || 0);
    if (f.action === 'crank' && A.crank && (!In.reloading || RT > 0.76)) {   // the hand stays on the handle and goes round with it
      const arm = this.supportRest.clone().sub(A.crank.userData.rest).applyEuler(A.crank.rotation).add(A.crank.userData.rest);
      supPos.lerp(arm, In.reloading ? sstep(0.7, 0.78, RT) : 1);
    }

    const p3 = P3(pos).add(this.swayPos).add(bob).add(this.recoilPos).add(new THREE.Vector3(0, this.landZ, 0));
    this.gun.position.copy(p3);
    if (this.mDip > 0.001) { this.gun.position.y -= this.mDip * 4; this.gun.position.x += this.mDip * 3; }   // gun hand eases aside to make room
    if (this.support) this.support.visible = !(this.mDip > 0.15);   // the left hand is busy swinging
    // UE pitch (nose up) -> rotation about view x; yaw (right) -> about -y; roll -> about -z
    const P = rot.P + this.swayRot.x + bobRot.x + this.recoilRot.x;
    const Y = rot.Y + this.swayRot.y + bobRot.y + this.recoilRot.y;
    const Rr = rot.R + this.swayRot.z + bobRot.z + this.recoilRot.z;
    this.gun.quaternion.copy(quatVM(R(P, Y, Rr)));
    if (this.inspect) { this.gun.position.copy(P3({ X: this.inspect[0], Y: this.inspect[1], Z: this.inspect[2] })); this.gun.quaternion.copy(quatVM(R(this.inspect[3], this.inspect[4], this.inspect[5]))); if (this.hand) this.hand.visible = false; if (this.support) this.support.visible = false; }
    if (gunSpin) {   // a spin around the trigger finger: the gun turns, the hand holding it does not
      const sq = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), d2r(gunSpin));
      this.gun.quaternion.multiply(sq);
      if (this.hand) this.hand.quaternion.copy(sq).invert();
      if (this.support) { supPos.applyQuaternion(sq.clone().invert()); this.support.quaternion.copy(sq).invert(); }
    } else if (this.support) this.support.quaternion.copy(quatVM(R(rel.P, rel.Y, rel.R))).invert();   // the forearm keeps coming from the body, however the gun is turned
    if (this.MagRoot && magOff.lengthSq() > 0) this.MagRoot.position.copy(this.magRest).add(magOff);
    // the off hand rides whatever it is holding (a pump, the barrels) and goes wherever the reload sent it
    if (this.support) {
      const on = f.supOn && A[f.supOn];
      if (on && !In.reloading) supPos.add(on.position).sub(on.userData.rest);
      else if (on && In.reloading && f.charge === 'pump') supPos.add(on.position).sub(on.userData.rest);
      this.support.position.copy(supPos);
      if (!gunSpin && !on) {   // off the gun the hand relaxes: fingers tip forward instead of standing straight up
        const away = Math.min(1, supPos.distanceTo(this.supportRest) / 7);
        if (away > 0.01) this.support.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), d2r(-40 * away)));
      }
    }
    if (this.hand) { this.hand.position.copy(handOff); if (!gunSpin) this.hand.rotation.set(d2r(handRot), 0, 0); }
    if (this.SpinPart && f.action === 'saw') {
      // The blade on the arbor is the next one to be thrown: it leaves with the shot and the next drops onto the spindle.
      // An empty saw has a bare arbor until a fresh stack is seated.
      let s = In.empty ? 0 : u < 1 ? sstep(0.3, 0.8, u) : 1;
      if (RT >= 0 && wasEmpty) s = sstep(0.6, 0.76, RT);
      this.SpinPart.scale.setScalar(Math.max(0.001, s)); this.SpinPart.visible = s > 0.02;
    }
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
    this.gun.updateMatrixWorld(true); gunInv.value.copy(this.gun.matrixWorld).invert();
    this.tickFlyers(dt);
    this.root.visible = !this.scoped && !this.hidden && !this.wield;
    this.tickMelee(dt);
  }
}

function spring(x, v, k, damp, dt) {
  const ax = -x.x * k - v.x * damp, ay = -x.y * k - v.y * damp, az = -x.z * k - v.z * damp;
  v.x += ax * dt; v.y += ay * dt; v.z += az * dt;
  x.addScaledVector(v, dt);
}
