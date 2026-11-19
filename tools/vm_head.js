// First-person view model (port of UDMHViewModel): chunky 2-tone guns built from toon primitives held in
// gloved hands, rendered in a separate overlay pass. Procedural sway, bob, sprint pose, ADS, spring recoil,
// reload choreography with sound cues, weapon switch, landing dip, slide/wall-run tilt, muzzle flash, shells.
import * as THREE from 'three';
import { toonMaterial, hex, sprite, Atlas, G } from './render.js';
import { PRIM } from './world.js';
import { URot } from './mapkit.js';

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
const ViewScale = 0.4;
const HipPos = { X: 34, Y: 13, Z: -15 };
const Metal = hex(0x4C4E5C), MetalDark = hex(0x2A2A33), MetalLight = hex(0x8C90A0), Wood = hex(0x7A4528), WoodLight = hex(0xA8643A);
const Glove = hex(0x4E3324), GloveLight = hex(0x6E4A32), Cuff = hex(0xC9A46A), Sleeve = hex(0xB0603A), SleeveStripe = hex(0xE8C24A), Brass = hex(0xE0A83A);
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const interp = (cur, target, dt, speed) => cur + (target - cur) * Math.min(1, dt * speed);

export const vmSun = { value: new THREE.Vector3(0, 1, 0) };
const matCache = new Map();
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
  Box(loc, size, color, rot = null, glow = 0, parent = null) { return this.Part(parent || this.gun, 0, loc, size, color, rot, glow); }
  Tube(loc, d, len, color, glow = 0, parent = null) { return this.Part(parent || this.gun, 1, loc, V(len, d, d), color, R(90, 0, 0), glow); }
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
    this.MagRoot = this.PumpRoot = this.SpinPart = this.support = this.muzzle = this.eject = null;
    this.flash = [];
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
    const NameHas = (s) => W.name.toLowerCase().includes(s.toLowerCase());
    let SightZ = 9, BarrelLen = 30;
    let MuzzleAt = V(30, 0, 6), EjectAt = V(4, 3, 7);
    let SupportRest = V(16, 0, 1);
    this.spinAxis = null;
