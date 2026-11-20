// 3D creatures. Every enemy and boss is a small jointed model of flat-shaded blocks, posed in code and drawn through
// a handful of instanced batches (one draw call per shape for the whole horde). The look is the opposite of the old
// cut-outs: gaunt, grey, torn, more bone than colour.
// Creature3D extends the old Puppet so the game keeps one interface (tick / hurt / popPart / startDeath / draw) and the
// affix effects that hang around a body (flames, frost, shields) still work.
import * as THREE from 'three';
import { Puppet } from './puppet.js';
import { toonMaterial } from './render.js';

// ------------------------------------------------------------------ batches
const flat = (g) => { const n = g.toNonIndexed(); n.computeVertexNormals(); return n; };
const GEO = [new THREE.BoxGeometry(1, 1, 1), flat(new THREE.IcosahedronGeometry(0.5, 1)), flat(new THREE.ConeGeometry(0.5, 1, 6)), flat(new THREE.CylinderGeometry(0.5, 0.5, 1, 7))];
const BOX = 0, BALL = 1, CONE = 2, CYL = 3;
const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
class Batch {
  constructor() { this.meshes = []; this.n = []; this.gibs = []; this.ready = false; }
  init(scene) {
    if (this.ready) return; this.ready = true;
    for (let g = 0; g < 2; g++) for (let s = 0; s < 4; s++) {
      const cap = g ? 500 : s === BOX ? 7000 : 1500;
      const m = new THREE.InstancedMesh(GEO[s], toonMaterial({ glow: g ? 1.25 : 0 }), cap);
      m.setColorAt(0, _c.set(1, 1, 1)); m.count = 0; m.frustumCulled = false; m.userData.cap = cap;
      scene.add(m); this.meshes.push(m); this.n.push(0);
    }
  }
  begin() { for (let i = 0; i < this.n.length; i++) this.n[i] = 0; }
  push(shape, glow, M, r, g, b) {
    const k = (glow ? 4 : 0) + shape, mesh = this.meshes[k]; if (!mesh) return;
    const i = this.n[k]; if (i >= mesh.userData.cap) return;
    mesh.instanceMatrix.array.set(M.elements, i * 16);
    const c = mesh.instanceColor.array; c[i * 3] = r; c[i * 3 + 1] = g; c[i * 3 + 2] = b;
    this.n[k] = i + 1;
  }
  end() { this.meshes.forEach((m, k) => { m.count = this.n[k]; m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; }); }
  // loose pieces: limbs shot off, and everything when a body bursts
  gib(shape, glow, M, col, vel, groundY) {
    if (this.gibs.length > 260) this.gibs.shift();
    const G = { shape, glow, p: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3(), col, v: vel, ax: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(), w: 4 + Math.random() * 9, t: 0, life: 7, gy: groundY, rest: false };
    M.decompose(G.p, G.q, G.s); this.gibs.push(G);
  }
  tick(dt) {
    for (let i = this.gibs.length - 1; i >= 0; i--) {
      const G = this.gibs[i]; G.t += dt;
      if (G.t > G.life) { this.gibs.splice(i, 1); continue; }
      if (G.rest) continue;
      G.v.y -= 1900 * dt; G.p.addScaledVector(G.v, dt);
      G.q.premultiply(_q.setFromAxisAngle(G.ax, G.w * dt));
      const floor = G.gy + Math.min(G.s.x, G.s.y, G.s.z) * 0.5;
      if (G.p.y < floor) { G.p.y = floor; if (Math.abs(G.v.y) < 160) { G.rest = true; } else { G.v.y *= -0.32; G.v.x *= 0.55; G.v.z *= 0.55; G.w *= 0.5; } }
    }
  }
  drawGibs() {
    for (const G of this.gibs) { const k = G.t > G.life - 1 ? Math.max(0.01, G.life - G.t) : 1; _s.copy(G.s).multiplyScalar(k); _m.compose(G.p, G.q, _s); this.push(G.shape, G.glow, _m, G.col[0], G.col[1], G.col[2]); }
  }
}
export const C3D = new Batch();

// ------------------------------------------------------------------ models
const rgb = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const grey = (c, t) => { const l = c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15; return mix(c, [l, l, l], t); };
const BONE = rgb(0xb5aa90), DARK = rgb(0x17141a), BLOOD = rgb(0x4d1014), CLOTH = rgb(0x34302d), RAG = rgb(0x4a4238), IRON = rgb(0x2b2d33), ROT = rgb(0x5d5a4c), GOLD = rgb(0x9c7a2a), WOOD = rgb(0x3d2a1c);
class Model {
  constructor(type) { this.type = type; this.bones = []; this.geos = []; this.idx = {}; this.anim = {}; }
  bone(name, parent, x, y, z, role) { const p = parent == null ? -1 : (typeof parent === 'string' ? this.idx[parent] : parent); this.bones.push({ name, parent: p, pos: [x, y, z], role: role || (p >= 0 ? this.bones[p].role : null) }); this.idx[name] = this.bones.length - 1; return this.bones.length - 1; }
  g(bone, shape, sx, sy, sz, x, y, z, col, glow = 0, rx = 0, ry = 0, rz = 0) {
    const b = typeof bone === 'string' ? this.idx[bone] : bone;
    const L = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
    this.geos.push({ bone: b, shape, glow, L, col, role: this.bones[b].role, body: this.bones[b].role == null });
    return this;
  }
}
// a two-legged body. Everything is in centimetres for a creature of scale 1.
function humanoid(o) {
  const M = new Model(o.type || 'biped');
  const leg = o.leg ?? 84, torso = o.torso ?? 60, sw = o.sw ?? 44, hip = o.hip ?? 30, td = o.depth ?? 21, hs = o.head ?? 23, arm = o.arm ?? 68, at = o.armT ?? 10, lt = o.legT ?? 12;
  const skin = o.skin, cloth = o.cloth ?? CLOTH, pants = o.pants ?? RAG;
  M.bone('pelvis', null, 0, leg, 0);
  M.g('pelvis', BOX, hip + 6, 15, td, 0, 3, 0, pants);
  M.bone('spine', 'pelvis', 0, 9, 0);
  M.g('spine', BOX, sw * 0.74, torso * 0.46, td * 0.92, 0, torso * 0.22, 0, o.belly ?? cloth);
  M.bone('chest', 'spine', 0, torso * 0.44, 0);
  M.g('chest', BOX, sw, torso * 0.56, td * 1.08, 0, torso * 0.28, 0, cloth);
  M.g('chest', BOX, sw * 0.5, 7, td * 0.7, 0, torso * 0.58, 0, skin);                                   // collar bones
  M.bone('head', 'chest', 0, torso * 0.56 + 2, 1, 'Head');
  M.g('head', BOX, hs * 0.42, 9, hs * 0.42, 0, 2, -1, skin);
  M.g('head', BOX, hs * 0.82, hs * 0.8, hs * 0.92, 0, 7 + hs * 0.5, 1, o.skull ?? skin);
  M.g('head', BOX, hs * 0.66, hs * 0.26, hs * 0.7, 0, 5 + (o.jawDrop ?? 0) * -hs * 0.3, 3 + (o.jawDrop ?? 0) * 3, o.jaw ?? mul(skin, 0.7));   // jaw
  M.g('head', BOX, hs * 0.5, hs * 0.14, 2, 0, 8 + hs * 0.2 - (o.jawDrop ?? 0) * hs * 0.1, hs * 0.48, DARK);                                      // mouth
  for (const s of [-1, 1]) M.g('head', BOX, hs * 0.2, hs * 0.16, 2, s * hs * 0.2, 7 + hs * 0.56, hs * 0.48, o.eye ?? DARK, o.eye ? 1 : 0);        // sockets
  for (const s of [-1, 1]) {
    const R = s > 0;
    M.bone(R ? 'armR' : 'armL', 'chest', s * (sw / 2 + at * 0.35), torso * 0.5, 0, R ? 'ArmFront' : 'ArmBack');
    M.g(R ? 'armR' : 'armL', BOX, at, arm * 0.5, at, 0, -arm * 0.24, 0, o.sleeve ?? skin);
    M.bone(R ? 'foreR' : 'foreL', R ? 'armR' : 'armL', 0, -arm * 0.48, 0);
    M.g(R ? 'foreR' : 'foreL', BOX, at * 0.82, arm * 0.48, at * 0.82, 0, -arm * 0.24, 0, skin);
    M.g(R ? 'foreR' : 'foreL', BOX, at * 1.05, at * 1.2, at * 0.9, 0, -arm * 0.5, 0, o.hand ?? mul(skin, 0.8));
    M.bone(R ? 'legR' : 'legL', 'pelvis', s * hip * 0.3, 0, 0, R ? 'LegFront' : 'LegBack');
    M.g(R ? 'legR' : 'legL', BOX, lt, leg * 0.52, lt, 0, -leg * 0.25, 0, pants);
    M.bone(R ? 'shinR' : 'shinL', R ? 'legR' : 'legL', 0, -leg * 0.5, 0);
    M.g(R ? 'shinR' : 'shinL', BOX, lt * 0.8, leg * 0.46, lt * 0.8, 0, -leg * 0.23, 0, o.shin ?? skin);
    M.g(R ? 'shinR' : 'shinL', BOX, lt, 6, lt * 1.9, 0, -leg * 0.5 + 3, lt * 0.45, o.boot ?? DARK);
  }
  M.top = leg + 9 + torso + 9 + hs * 0.9; M.bodyR = sw * 0.75; M.sizes = { leg, torso, sw, hip, td, hs, arm, at, lt };
  return M;
}
const ribs = (M, z, col = BONE, n = 4, w = 30) => { for (let i = 0; i < n; i++) M.g('chest', BOX, w - i * 2, 2.5, 3, 0, 8 + i * 7, z, col); };
const skinOf = (hexc, t = 0.6, k = 0.72) => mul(mix(grey(rgb(hexc), 0.7), ROT, t), k);
const BUILD = {
  Shambler(c) { const s = skinOf(c.body), M = humanoid({ skin: s, cloth: rgb(0x3b3a35), pants: rgb(0x2a2c30), jawDrop: 0.6 }); M.g('chest', BOX, 20, 24, 3, -8, 16, 11.5, BLOOD); ribs(M, 12.5, BONE, 3, 16); M.g('spine', BOX, 14, 10, 4, 8, 6, 9, BLOOD); M.anim = { reach: 0.85, hunch: 0.22 }; return M; },
  Sprinter(c) { const s = skinOf(c.body, 0.45, 0.78), M = humanoid({ skin: s, cloth: s, belly: s, pants: rgb(0x2b2622), sw: 40, armT: 8.5, legT: 10.5, leg: 88, jawDrop: 0.3 }); ribs(M, 11.5, mul(s, 0.6), 5, 34); M.g('head', BOX, 14, 6, 3, 0, 8, 12, BLOOD); M.g('chest', BOX, 26, 10, 2, 0, 34, 12, BLOOD); M.anim = { flail: 1, hunch: 0.42 }; return M; },
  Crawler(c) { const s = skinOf(c.body), M = humanoid({ type: 'crawler', skin: s, cloth: rgb(0x38332e), leg: 20, legT: 0.01, arm: 74, armT: 11 }); for (let i = 0; i < 5; i++) M.g('pelvis', BOX, 9 - i, 6, 14, (i % 2 ? 4 : -4), -4 - i * 2, -14 - i * 13, i % 2 ? BLOOD : mul(BLOOD, 1.6)); M.g('pelvis', BOX, 26, 8, 10, 0, -6, -4, BLOOD); M.top = 58; M.bodyR = 46; M.anim = { hunch: 0 }; return M; },
  Bloater(c) { const s = mul(mix(grey(rgb(c.body), 0.75), rgb(0x8a8468), 0.5), 0.8), M = humanoid({ skin: s, cloth: rgb(0x403a30), sw: 58, hip: 44, depth: 30, torso: 66, leg: 62, legT: 17, armT: 13, arm: 56, head: 21 }); M.g('spine', BALL, 84, 74, 80, 0, 22, 8, s); for (const [x, y, z, r] of [[-22, 30, 40, 13], [18, 12, 44, 16], [4, 44, 42, 10], [30, 36, 28, 12], [-30, 8, 30, 11]]) M.g('spine', BALL, r, r, r, x, y, z, r > 12 ? rgb(0x4a5226) : rgb(0x66722c), r > 14 ? 1 : 0); M.g('spine', BOX, 60, 5, 62, 0, -2, 8, DARK); M.bodyR = 52; M.anim = { reach: 0.2, hunch: 0.05, waddle: 1 }; return M; },
  Spitter(c) { const s = skinOf(c.body, 0.5), M = humanoid({ skin: s, cloth: rgb(0x2f3329), pants: rgb(0x26282a), sw: 38, armT: 8, arm: 58, jawDrop: 1.4, head: 22 }); M.g('head', BALL, 24, 26, 22, 0, -6, 9, rgb(0x3e5220), 1); M.g('chest', BOX, 14, 26, 3, 0, 14, 12, rgb(0x4a5a24)); M.g('head', BOX, 8, 12, 4, 0, 0, 14, rgb(0x6e8a2e), 1); M.anim = { reach: 0.15, hunch: 0.5 }; return M; },
  Leaper(c) { const s = skinOf(c.body, 0.7, 0.6), M = humanoid({ type: 'quad', skin: s, cloth: s, belly: s, pants: s, sw: 36, hip: 26, arm: 86, leg: 78, armT: 8, legT: 10, head: 21, jawDrop: 0.8, eye: rgb(0xb8b0a0) }); for (let i = 0; i < 6; i++) M.g(i < 3 ? 'spine' : 'chest', CONE, 6, 16 - i, 6, 0, 6 + (i % 3) * 11, -12, BONE, 0, -1.2); for (const b of ['foreR', 'foreL']) for (const x of [-3, 0, 3]) M.g(b, CONE, 3, 12, 3, x, -48, 4, BONE, 0, 2.6); M.top = 105; M.bodyR = 34; M.anim = {}; return M; },
  Wisp(c) { const M = new Model('flyer'); M.bone('body', null, 0, 40, 0); M.bone('head', 'body', 0, 0, 4, 'Head'); M.g('head', BALL, 30, 30, 32, 0, 0, 0, BONE); M.g('head', BOX, 20, 8, 20, 0, -15, 4, mul(BONE, 0.8)); for (const s of [-1, 1]) M.g('head', BOX, 7, 8, 3, s * 7, 3, 14, rgb(0xb0241c), 1); M.g('head', CONE, 5, 8, 5, 0, -4, 16, DARK, 0, 1.6); for (let i = 0; i < 5; i++) M.g('body', BOX, 7 - i, 8, 7 - i, 0, -22 - i * 9, -6 - i * 5, i % 2 ? BONE : mul(BONE, 0.7)); for (const s of [-1, 1]) { M.bone(s > 0 ? 'wingR' : 'wingL', 'body', s * 10, -6, -4); const b = s > 0 ? 'wingR' : 'wingL'; M.g(b, BOX, 46, 2, 5, s * 24, 0, 0, BONE); M.g(b, BOX, 44, 1.5, 34, s * 26, -1, -14, rgb(0x241c26)); M.g(b, BOX, 30, 1.5, 22, s * 60, -1, -10, rgb(0x2e2430)); } M.top = 72; M.bodyR = 34; M.anim = {}; return M; },
  Brute(c) { const s = skinOf(c.body, 0.5, 0.66), M = humanoid({ skin: s, cloth: s, belly: rgb(0x2e2622), pants: rgb(0x26221f), sw: 74, hip: 42, depth: 36, torso: 70, leg: 70, legT: 20, armT: 21, arm: 88, head: 20 }); M.g('chest', BOX, 78, 22, 40, 0, 44, -2, s); for (let i = 0; i < 5; i++) M.g(i < 2 ? 'spine' : 'chest', BOX, 10, 8, 8, 0, 4 + (i % 3) * 13, -21, BONE); M.g('spine', BOX, 50, 44, 3, 0, 10, 18.5, rgb(0x3a2a26)); for (const b of ['foreR', 'foreL']) M.g(b, BOX, 26, 24, 24, 0, -46, 0, mul(s, 0.75)); for (const [x, y] of [[-20, 30], [14, 18], [22, 40]]) M.g('chest', BOX, 2, 16, 2, x, y, 20, DARK, 0, 0, 0, 0.5); M.bodyR = 54; M.anim = { reach: 0.1, hunch: 0.3, heavy: 1 }; return M; },
  Screamer(c) { const s = mul(grey(rgb(c.body), 0.85), 0.72), M = humanoid({ skin: s, cloth: rgb(0x46423e), pants: rgb(0x3a3632), sw: 36, armT: 7.5, legT: 9.5, leg: 92, torso: 64, arm: 76, jawDrop: 2.4, head: 24 }); M.g('head', BOX, 12, 16, 3, 0, 4, 12.5, DARK); for (let i = 0; i < 7; i++) M.g('head', BOX, 3, 34 + (i % 3) * 8, 2, -9 + i * 3, 8 - (i % 3) * 4, -10 + (i % 2) * 2, DARK); M.g('chest', BOX, 34, 60, 3, 0, 0, 11.5, rgb(0x55504a)); M.anim = { clutch: 1, hunch: 0.15 }; return M; },
  Burrower(c) { const s = skinOf(c.body, 0.4, 0.6), M = humanoid({ type: 'crawler', skin: s, cloth: s, belly: s, leg: 24, legT: 9, arm: 70, armT: 13 }); for (let i = 0; i < 4; i++) M.g(i < 2 ? 'spine' : 'chest', BOX, 40 - i * 4, 12, 6, 0, 6 + (i % 2) * 16, -13, rgb(0x3a3026)); for (const b of ['foreR', 'foreL']) for (const x of [-5, 0, 5]) M.g(b, CONE, 5, 22, 5, x, -46, 2, BONE, 0, 2.9); M.top = 62; M.bodyR = 48; M.anim = {}; return M; },
  Gilded(c) { const s = skinOf(c.body, 0.8, 0.62), M = humanoid({ skin: s, cloth: rgb(0x2c2620), pants: rgb(0x231f1b), skull: GOLD, sw: 40, eye: rgb(0xd8b040) }); M.g('chest', BOX, 46, 6, 24, 0, 30, 0, GOLD, 1); M.g('chest', BOX, 4, 30, 3, -10, 14, 12, GOLD, 1); M.g('chest', BALL, 40, 46, 30, 0, 8, -22, rgb(0x4a3c28)); M.g('chest', BOX, 10, 6, 6, 0, 32, -22, GOLD, 1); for (const b of ['foreR', 'foreL']) M.g(b, BOX, 11, 6, 11, 0, -20, 0, GOLD, 1); M.anim = { flail: 0.6, hunch: 0.35 }; return M; },
  Riot(c) { const s = skinOf(c.body, 0.6), M = humanoid({ skin: s, cloth: IRON, pants: rgb(0x22242a), sleeve: rgb(0x22242a), boot: IRON, sw: 50, armT: 12, legT: 14, skull: rgb(0x1c1e22) }); M.g('head', BOX, 24, 8, 3, 0, 20, 12, rgb(0x5a7a8a), 1); M.g('chest', BOX, 54, 30, 27, 0, 24, 0, rgb(0x33363c)); M.bone('shield', 'chest', -14, -6, 30); M.g('shield', BOX, 72, 124, 6, 0, 0, 0, WOOD); M.g('shield', BOX, 64, 5, 7, 0, 34, 0, IRON); M.g('shield', BOX, 64, 5, 7, 0, -34, 0, IRON); M.g('shield', BOX, 7, 9, 9, 24, 0, 0, GOLD); M.g('shield', BOX, 26, 3, 7, -8, 50, 0, BLOOD); M.bodyR = 44; M.anim = { shield: 1, reach: 0.2, hunch: 0.15 }; return M; },
  Priest(c) { const R = rgb(0x1e1722), s = mul(grey(rgb(c.head), 0.8), 0.6), M = humanoid({ skin: s, cloth: R, belly: R, pants: R, sleeve: R, shin: R, sw: 42, leg: 92, torso: 66, arm: 72, eye: rgb(0x8a5ad0), head: 22 }); for (let i = 0; i < 4; i++) M.g('pelvis', BOX, 40 + i * 9, 24, 24 + i * 7, 0, -10 - i * 22, 0, mul(R, 1 - i * 0.08)); M.g('head', BOX, 26, 24, 26, 0, 22, -2, R); M.g('head', BOX, 22, 8, 10, 0, 30, 8, R); M.g('foreR', CYL, 4, 190, 4, 0, -20, 8, WOOD); M.g('foreR', BALL, 18, 18, 18, 0, 80, 8, rgb(0x8a4ad8), 1); M.g('chest', BOX, 6, 40, 3, 0, 10, 12, rgb(0x6a3aa8), 1); M.anim = { staff: 1, hunch: 0.1, glide: 1 }; return M; },
  // ---- bosses
  BigTony(c) { const s = rgb(0x6a5a52), suit = rgb(0x1c1c22), M = humanoid({ skin: s, cloth: suit, pants: rgb(0x15151a), sleeve: suit, boot: DARK, sw: 86, hip: 60, depth: 44, torso: 72, leg: 66, legT: 23, armT: 22, arm: 82, head: 24, jawDrop: 0.4 }); M.g('spine', BALL, 108, 86, 96, 0, 20, 10, suit); M.g('spine', BOX, 30, 64, 4, 0, 22, 57, rgb(0x8a8478)); M.g('chest', BOX, 10, 40, 4, 0, 10, 28, rgb(0x5a1014)); for (const b of ['foreR', 'foreL']) { M.g(b, BOX, 30, 26, 28, 0, -44, 0, mul(s, 0.8)); M.g(b, BOX, 32, 8, 30, 0, -50, 0, GOLD, 1); } M.g('head', BOX, 24, 4, 22, 0, 30, 2, mul(s, 0.7)); M.g('chest', BOX, 40, 12, 3, 14, 30, 24, BLOOD); M.bodyR = 70; M.anim = { reach: 0.1, hunch: 0.12, heavy: 1, waddle: 0.6 }; return M; },
  Abomination(c) { const s = rgb(0x625650), M = humanoid({ skin: s, cloth: s, belly: rgb(0x4a2a2a), pants: rgb(0x2a2420), sw: 88, hip: 52, depth: 46, torso: 78, leg: 66, legT: 22, armT: 20, arm: 96, head: 24, jawDrop: 1.2 }); for (const [x, y, z, r] of [[-34, 40, -10, 50], [30, 16, 14, 46], [10, 56, -18, 40], [-20, 6, 20, 38]]) M.g('chest', BALL, r, r * 0.9, r, x, y, z, mix(s, BLOOD, 0.25)); ribs(M, 25, BONE, 5, 50); M.bone('head2', 'chest', 34, 44, 6); M.g('head2', BOX, 18, 18, 20, 0, 9, 0, mul(s, 0.9)); M.g('head2', BOX, 10, 3, 2, 0, 6, 10.5, DARK); for (const q of [-1, 1]) M.g('head2', BOX, 4, 4, 2, q * 4, 12, 10.5, DARK); M.bone('arm3', 'chest', -30, 50, -20, 'ArmBack'); M.g('arm3', BOX, 15, 50, 15, 0, 24, 0, s); M.bone('fore3', 'arm3', 0, 50, 0); M.g('fore3', BOX, 12, 52, 12, 0, 24, 0, s); M.g('fore3', BOX, 16, 16, 16, 0, 52, 0, mul(s, 0.75)); for (let i = 0; i < 6; i++) M.g('chest', BOX, 2, 20, 2, -36 + i * 14, 20 + (i % 2) * 14, 25, DARK, 0, 0, 0, i % 2 ? 0.6 : -0.6); M.bodyR = 74; M.anim = { reach: 0.3, hunch: 0.25, heavy: 1 }; return M; },
  Carrion(c) { const s = rgb(0x5a5450), M = humanoid({ skin: s, cloth: s, belly: rgb(0x2a1a1c), pants: rgb(0x221a1c), shin: BONE, sw: 46, hip: 30, torso: 72, leg: 98, legT: 9, armT: 8, arm: 86, head: 20, eye: rgb(0xc03020) }); M.g('chest', BOX, 34, 34, 6, 0, 16, 9, rgb(0xa01c14), 1); ribs(M, 12, BONE, 5, 44); M.g('head', CONE, 12, 34, 12, 0, 14, 22, BONE, 0, 1.75); for (const q of [-1, 1]) { const b = q > 0 ? 'wingR' : 'wingL'; M.bone(b, 'chest', q * 16, 34, -12); M.g(b, BOX, 90, 5, 6, q * 46, 0, 0, BONE); M.g(b, BOX, 86, 2, 70, q * 48, -2, -32, rgb(0x241a20)); M.bone(b + '2', b, q * 92, 0, 0); M.g(b + '2', BOX, 80, 4, 5, q * 40, 0, 0, BONE); M.g(b + '2', BOX, 76, 2, 54, q * 42, -2, -26, rgb(0x2c2026)); } M.bodyR = 46; M.anim = { reach: 0.4, hunch: 0.3, wings: 1 }; return M; },
  Croupier(c) { const s = rgb(0x8a857c), vest = rgb(0x1a2420), M = humanoid({ skin: s, cloth: vest, belly: rgb(0x8a8478), pants: rgb(0x121216), sleeve: rgb(0x8a8478), boot: DARK, sw: 42, torso: 70, leg: 104, arm: 92, armT: 8, legT: 10, head: 22 }); M.g('head', BOX, 26, 5, 16, 0, 22, 10, rgb(0x1f6a44), 1); M.g('head', BOX, 20, 16, 3, 0, 14, 11.5, s); M.g('chest', BOX, 12, 6, 4, 0, 34, 12, rgb(0x6a1016)); for (const q of [-1, 1]) { const b = q > 0 ? 'armR2' : 'armL2'; M.bone(b, 'chest', q * 22, 22, -6, 'ArmBack'); M.g(b, BOX, 7, 46, 7, 0, -22, 0, rgb(0x8a8478)); M.bone(b + 'f', b, 0, -46, 0); M.g(b + 'f', BOX, 6, 46, 6, 0, -22, 0, s); for (let k = 0; k < 3; k++) M.g(b + 'f', BOX, 10, 15, 1, (k - 1) * 7, -52, 0, rgb(0xe6dfc8), 1, 0, 0, (k - 1) * 0.35); } for (const b of ['foreR', 'foreL']) for (let k = 0; k < 3; k++) M.g(b, BOX, 10, 15, 1, (k - 1) * 7, -56, 0, rgb(0xe6dfc8), 1, 0, 0, (k - 1) * 0.35); M.bodyR = 40; M.anim = { reach: 0.5, hunch: 0.1, four: 1 }; return M; },
  Gravedigger(c) { const R = rgb(0x1f1c1a), s = rgb(0x5a554c), M = humanoid({ skin: s, cloth: R, belly: R, pants: rgb(0x191614), sleeve: R, boot: DARK, sw: 82, hip: 50, depth: 40, torso: 76, leg: 76, legT: 20, armT: 18, arm: 92, head: 22, eye: rgb(0xb89040) }); M.g('head', BOX, 34, 30, 34, 0, 20, -3, R); M.g('head', BOX, 30, 8, 12, 0, 31, 12, R); M.g('chest', BOX, 60, 110, 30, 0, 10, -34, WOOD); M.g('chest', BOX, 6, 112, 32, 0, 10, -34, IRON); M.g('chest', BOX, 62, 6, 32, 0, 36, -34, IRON); M.g('foreR', CYL, 6, 210, 6, 0, -30, 10, WOOD); M.g('foreR', BOX, 40, 50, 4, 0, -150, 10, rgb(0x4a4c52)); M.g('foreL', BOX, 3, 34, 3, 0, -62, 0, IRON); M.g('foreL', BOX, 20, 26, 20, 0, -90, 0, rgb(0xd89a30), 1); M.g('foreL', BOX, 24, 4, 24, 0, -76, 0, IRON); for (let i = 0; i < 5; i++) M.g('spine', BOX, 86 - i * 4, 3, 44, 0, 4 + i * 8, 0, IRON, 0, 0, 0, (i % 2 ? 0.08 : -0.08)); M.bodyR = 68; M.anim = { reach: 0.15, hunch: 0.22, heavy: 1, tool: 1 }; return M; },
  LastDealer(c) { const tux = rgb(0x101014), M = humanoid({ skin: BONE, skull: BONE, jaw: mul(BONE, 0.8), cloth: tux, belly: rgb(0x8a857a), pants: tux, sleeve: tux, shin: tux, boot: DARK, sw: 60, hip: 34, torso: 78, leg: 106, arm: 104, armT: 9, legT: 11, head: 26, jawDrop: 0.5, eye: rgb(0xd03a2a) }); M.g('head', CYL, 34, 30, 34, 0, 40, 0, tux); M.g('head', CYL, 50, 3, 50, 0, 26, 0, tux); M.g('head', CYL, 35, 5, 35, 0, 29, 0, rgb(0x7a1016)); M.g('chest', BOX, 14, 7, 4, 0, 38, 12, rgb(0x7a1016)); ribs(M, 12.5, BONE, 4, 30); for (const b of ['foreR', 'foreL']) for (let k = 0; k < 5; k++) M.g(b, BOX, 11, 17, 1, (k - 2) * 7, -62 - Math.abs(k - 2) * -2, 0, rgb(0xeee6d0), 1, 0, 0, (k - 2) * 0.3); M.bone('halo', 'chest', 0, 30, -26); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; M.g('halo', BOX, 14, 26, 4, Math.cos(a) * 80, Math.sin(a) * 80, 0, k % 2 ? rgb(0x8a1016) : DARK, k % 2, 0, 0, a + 1.57); } for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; M.g('halo', BOX, 22, 5, 5, Math.cos(a) * 98, Math.sin(a) * 98, 0, GOLD, k % 3 === 0 ? 1 : 0, 0, 0, a + 1.57); } M.g('halo', CYL, 22, 8, 22, 0, 0, 0, GOLD, 0, 1.5708); M.bodyR = 54; M.anim = { reach: 0.55, hunch: 0.08, halo: 1 }; return M; },
};
const MODELS = {};
function modelFor(creature, def) { return MODELS[creature] || (MODELS[creature] = (BUILD[creature] || BUILD.Shambler)(def || { body: 0x7e9b6b, head: 0x9db88a })); }

// ------------------------------------------------------------------ one creature
const ZERO3 = [0, 0, 0];
export class Creature3D extends Puppet {
  constructor(creature, scale, tint, aura, auraSize, def) {
    super(creature, scale, tint, aura, auraSize);
    this.is3D = true;
    const M = this.model = modelFor(creature, def);
    this.rot = new Float32Array(M.bones.length * 3);
    this.world = M.bones.map(() => new THREE.Matrix4());
    this.root = new THREE.Matrix4();
    this.gone = new Set();
    this.heightCm = M.top * scale; this.bodyR = M.bodyR * scale;
    this.yaw = Math.random() * 6.28; this.blood = 0; this.vary = 0.9 + Math.random() * 0.2; this.side = Math.random() < 0.5 ? 1 : -1;
    this.dieYaw = null; this.dieT = 0;
  }
  r(name, x, y = 0, z = 0) { const i = this.model.idx[name]; if (i === undefined) return; this.rot[i * 3] = x; this.rot[i * 3 + 1] = y; this.rot[i * 3 + 2] = z; }
  ra(name, x, y = 0, z = 0) { const i = this.model.idx[name]; if (i === undefined) return; this.rot[i * 3] += x; this.rot[i * 3 + 1] += y; this.rot[i * 3 + 2] += z; }
  addWound(at) { this.blood = Math.min(1, this.blood + 0.22); }
  startDeath(fromDir) { if (this.dying) return; super.startDeath(fromDir); this.dieYaw = fromDir && (fromDir.x || fromDir.z) ? Math.atan2(-fromDir.x, -fromDir.z) : this.yaw; this.dieT = 0; }
  popPart(roles) {
    const have = roles.filter((R) => !this.gone.has(R) && this.model.geos.some((g) => g.role === R));
    if (!have.length) return null;
    const R = have[Math.floor(Math.random() * have.length)]; this.gone.add(R);
    return { role3: R, size: [20, 60], tex: null, spr: null };
  }
  popHead() { if (this.gone.has('Head')) return null; this.gone.add('Head'); return { role3: 'Head', size: [24, 24], tex: null, spr: null }; }
  partWorld(P) { const out = new THREE.Vector3(); if (!this.feet) return out; if (P && P.role3) { const g = this.model.geos.find((q) => q.role === P.role3); if (g) return out.setFromMatrixPosition(this.world[g.bone]); } return out.copy(this.feet).add(_v.set(0, this.heightCm * 0.6, 0)); }
  headWorld() { const out = new THREE.Vector3(), i = this.model.idx.head; if (i === undefined || !this.feet) return out.copy(this.feet || out).add(_v.set(0, this.heightCm * 0.85, 0)); return out.setFromMatrixPosition(this.world[i]); }
  // a limb comes away as loose pieces
  throwPart(P, vel) {
    if (!P || !P.role3) return;
    for (const g of this.model.geos) { if (g.role !== P.role3) continue; _m.multiplyMatrices(this.world[g.bone], g.L); C3D.gib(g.shape, g.glow, _m, this.colorOf(g, 0), vel.clone().add(_v.set((Math.random() - 0.5) * 160, Math.random() * 120, (Math.random() - 0.5) * 160)), this.groundY ?? this.feet.y); }
  }
  // the whole body flies apart
  burst(dir) {
    if (!this.feet) return;
    for (const g of this.model.geos) { if (g.role && this.gone.has(g.role)) continue; if (Math.random() < 0.25) continue; _m.multiplyMatrices(this.world[g.bone], g.L); const c = Math.random() < 0.4 ? BLOOD : this.colorOf(g, 0); C3D.gib(g.shape, g.glow, _m, c, new THREE.Vector3((Math.random() - 0.5) * 900 + dir.x * 300, 300 + Math.random() * 800, (Math.random() - 0.5) * 900 + dir.z * 300), this.groundY ?? this.feet.y); }
  }
  colorOf(g, flash) {
    let c = g.col; const t = this.tint, v = this.vary;
    let r = c[0] * t[0] * v, gg = c[1] * t[1] * v, b = c[2] * t[2] * v;
    if (g.body && this.blood > 0 && !g.glow) { const k = this.blood * 0.55; r += (BLOOD[0] - r) * k; gg += (BLOOD[1] - gg) * k; b += (BLOOD[2] - b) * k; }
    if (flash) { r += (1 - r) * 0.75; gg += (0.92 - gg) * 0.75; b += (0.88 - b) * 0.75; }
    return [r, gg, b];
  }
  tick(dt, feet, S) {
    super.tick(dt, feet, S);
    // face where it is going; standing still, face its prey
    let want = this.yaw; const sp = Math.hypot(S.vel.x, S.vel.z);
    if (sp > 40) want = Math.atan2(S.vel.x, S.vel.z); else if (S.faceToward) want = Math.atan2(S.faceToward.x - feet.x, S.faceToward.z - feet.z);
    if (S.faceToward && (S.windup || S.lunge)) want = Math.atan2(S.faceToward.x - feet.x, S.faceToward.z - feet.z);
    if (this.dying) want = this.dieYaw ?? this.yaw;
    let d = want - this.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    this.yaw += d * Math.min(1, dt * (this.dying ? 14 : 7));
    if (this.dying) this.dieT += dt;
    this.pose();
  }
  pose() {
    const M = this.model, A = M.anim, w = this.walk, s = Math.min(1.15, this.stride || 0), t = this.time + (this.seed || 0), type = M.type;
    this.rot.fill(0);
    const wind = this.windup, lunge = this.lunge, hurt = this.hurtT * (this.hurtSide || 1), tw = this.twitch || 0, dig = this.dig || 0;
    let rootY = 0, pitch = 0, roll = 0;
    if (type === 'flyer') {
      const f = Math.sin(t * 13);
      this.r('wingR', 0, 0, -0.25 - f * 0.75); this.r('wingL', 0, 0, 0.25 + f * 0.75);
      this.r('head', 0.15 + lunge * 0.5, Math.sin(t * 1.7) * 0.2, 0); this.r('body', 0.25 + lunge * 0.4);
      rootY = Math.sin(t * 3) * 6;
    } else {
      const swing = Math.sin(w) * 0.8 * s, hunch = (A.hunch || 0);
      if (type === 'crawler') {
        this.r('pelvis', 1.38, Math.sin(w) * 0.12 * s, 0); this.r('spine', -0.1); this.r('chest', -0.2, -Math.sin(w) * 0.2 * s, 0); this.r('head', -1.0 + Math.sin(t * 1.3) * 0.15 - lunge * 0.3, Math.sin(t * 0.9) * 0.3, 0);
        this.r('armR', -2.9 + Math.sin(w) * 0.75 * s - wind * 0.5 + lunge * 0.7, 0, -0.25); this.r('armL', -2.9 - Math.sin(w) * 0.75 * s - wind * 0.5 + lunge * 0.7, 0, 0.25);
        this.r('foreR', -0.5 + Math.cos(w) * 0.5 * s); this.r('foreL', -0.5 - Math.cos(w) * 0.5 * s);
        this.r('legR', 0.25 + Math.sin(w) * 0.1); this.r('legL', 0.25 - Math.sin(w) * 0.1);
        rootY = -M.bones[0].pos[1] + 13 + Math.abs(Math.sin(w)) * 2 * s;
      } else if (type === 'quad') {
        const b = 1.22;
        this.r('pelvis', b - lunge * 0.5 + wind * 0.2, 0, Math.sin(w) * 0.08 * s); this.r('head', -1.0 + lunge * 0.3 + Math.sin(t * 1.5) * 0.12, Math.sin(t * 1.1) * 0.25, 0);
        this.r('armR', -b - 0.15 + swing * 0.9 - lunge * 1.2, 0, -0.12); this.r('armL', -b - 0.15 - swing * 0.9 - lunge * 1.2, 0, 0.12);
        this.r('foreR', -0.25 - Math.max(0, Math.sin(w + 1)) * 0.6 * s); this.r('foreL', -0.25 - Math.max(0, Math.sin(w + 4.1)) * 0.6 * s);
        this.r('legR', -b - 0.55 - swing * 0.8); this.r('legL', -b - 0.55 + swing * 0.8);
        this.r('shinR', 1.15 + Math.max(0, Math.sin(w + 2)) * 0.5 * s); this.r('shinL', 1.15 + Math.max(0, Math.sin(w + 5.1)) * 0.5 * s);
        rootY = -22 - wind * 10 + lunge * 16 + Math.abs(Math.sin(w)) * 4 * s;
      } else {
        const heavy = A.heavy ? 0.6 : 1;
        this.r('legR', -swing * heavy); this.r('legL', swing * heavy);
        this.r('shinR', Math.max(0, Math.sin(w - 1.1)) * 1.05 * s * heavy + 0.06); this.r('shinL', Math.max(0, Math.sin(w - 1.1 + Math.PI)) * 1.05 * s * heavy + 0.06);
        this.r('pelvis', 0, 0, Math.sin(w) * (A.waddle ? 0.12 : 0.05) * s);
        this.r('spine', hunch * 0.55 + 0.1 * s - wind * 0.3 + lunge * 0.45 - Math.abs(hurt) * 0.3 + Math.sin(t * 1.4) * 0.02, 0, hurt * 0.22);
        this.r('chest', hunch * 0.45 + lunge * 0.25, Math.sin(w) * 0.14 * s, -Math.sin(w) * (A.waddle ? 0.08 : 0.03) * s + hurt * 0.18);
        this.r('head', -hunch * 0.7 + Math.sin(t * 0.7) * 0.07 - lunge * 0.3 + (A.clutch ? -0.5 : 0), Math.sin(t * 0.5) * 0.18, Math.sin(t * 0.9) * 0.1 + tw * 0.5 * this.side);
        // arms
        const reach = A.reach || 0, k1 = 0.85 + 0.15 * Math.sin(t * 1.3), k2 = 0.85 + 0.15 * Math.sin(t * 1.1 + 2);
        let aR = -1.3 * reach * k1 * (this.side > 0 ? 1 : 0.55) + (1 - reach) * (swing * 0.7), aL = -1.3 * reach * k2 * (this.side > 0 ? 0.55 : 1) + (1 - reach) * (-swing * 0.7);
        let fR = -0.35 - 0.2 * reach, fL = -0.35 - 0.2 * reach, zR = -0.08, zL = 0.08;
        if (A.flail) { aR = -0.5 + Math.sin(w * 1.0) * 1.25 * A.flail * Math.max(0.3, s); aL = -0.5 - Math.sin(w * 1.0 + 0.6) * 1.25 * A.flail * Math.max(0.3, s); zR = -0.3; zL = 0.3; fR = fL = -0.8; }
        if (A.clutch) { aR = aL = -2.75; zR = 0.55; zL = -0.55; fR = fL = -2.1; }
        if (A.shield) { aL = -0.9; zL = -0.3; fL = -1.1; this.r('shield', Math.sin(w) * 0.04 * s, 0.12, Math.sin(w) * 0.03 * s); }
        if (A.staff) { aR = -1.15 + Math.sin(t * 0.8) * 0.06; fR = -0.5; zR = -0.1; }
        if (A.tool) { aR = -0.45; fR = -0.5; aL = -0.7; fL = -0.7; }
        if (A.heavy && !A.tool) { zR = -0.28; zL = 0.28; }
        // wind-up: both arms back over the head; the swing brings them down hard
        aR = aR * (1 - wind) + (-2.9) * wind; aL = A.shield ? aL : aL * (1 - wind) + (-2.9) * wind; fR -= wind * 0.6;
        aR = aR * (1 - lunge) + (-0.75) * lunge; if (!A.shield) aL = aL * (1 - lunge) + (-0.75) * lunge;
        this.r('armR', aR, 0, zR - Math.abs(hurt) * 0.3); this.r('armL', aL, 0, zL + Math.abs(hurt) * 0.3); this.r('foreR', fR); this.r('foreL', fL);
        if (A.four) { this.r('armR2', -0.9 + Math.sin(t * 2.1) * 0.25 - wind * 1.2 + lunge, 0, -0.9); this.r('armL2', -0.9 + Math.sin(t * 1.8 + 1) * 0.25 - wind * 1.2 + lunge, 0, 0.9); this.r('armR2f', -1.0 + Math.sin(t * 3) * 0.2); this.r('armL2f', -1.0 + Math.cos(t * 3) * 0.2); }
        if (A.wings) { const f = Math.sin(t * 2.4) * 0.22 + wind * 0.5 - lunge * 0.4; this.r('wingR', 0.1, -0.35, 0.35 + f); this.r('wingL', 0.1, 0.35, -0.35 - f); this.r('wingR2', 0, -0.3, -0.5 - f * 0.8); this.r('wingL2', 0, 0.3, 0.5 + f * 0.8); }
        if (A.halo) this.r('halo', 0, 0, t * 0.9);
        if (M.idx.arm3 !== undefined) { this.r('arm3', -0.6 + Math.sin(t * 1.7) * 0.3 - wind * 0.8, 0, 0.5); this.r('fore3', -0.9 + Math.sin(t * 2.3) * 0.3 + lunge * 0.8); this.r('head2', Math.sin(t * 1.9) * 0.2, Math.sin(t * 1.3) * 0.5, 0.3); }
        rootY = -(1 - Math.cos(swing * heavy)) * M.bones[0].pos[1] * 0.25 + Math.abs(Math.sin(w)) * 3 * s - wind * 6 + (A.glide ? 6 + Math.sin(t * 1.6) * 3 : 0);
      }
      // clawing up out of the ground: arms straight up, thrashing
      if (dig > 0.02 && type !== 'flyer') { const q = dig; this.r('armR', this.rot[M.idx.armR * 3] * (1 - q) + (-2.95 + Math.sin(t * 15) * 0.3) * q, 0, -0.2); this.r('armL', this.rot[M.idx.armL * 3] * (1 - q) + (-2.95 + Math.cos(t * 13) * 0.3) * q, 0, 0.2); this.ra('head', -0.5 * q); roll += Math.sin(t * 17) * 0.06 * q; }
    }
    // dying: knocked off its feet backwards, limbs loose, then into the dirt
    if (this.dying) {
      const a = Math.min(1, this.dieT / 0.38), e = 1 - (1 - a) * (1 - a);
      pitch = -1.5 * e; rootY += Math.sin(a * Math.PI) * 18 - e * (M.type === 'biped' ? M.bones[0].pos[1] * 0.0 : 0);
      if (M.type === 'biped' || M.type === 'quad') { this.ra('armR', -0.6 * e, 0, -0.9 * e); this.ra('armL', -0.6 * e, 0, 0.9 * e); this.ra('legR', -0.3 * e, 0, -0.2 * e); this.ra('legL', 0.15 * e, 0, 0.2 * e); this.ra('head', -0.5 * e); this.ra('spine', -0.2 * e); }
      if (this.dieT > 0.9) rootY -= (this.dieT - 0.9) * 110 / Math.max(0.4, this.baseScale);
    }
    this.rootY = rootY; this.pitch = pitch; this.roll = roll;
  }
  draw(batch, fxBatch, addBatch, alive) {
    if (!this.visible || !this.feet) return;
    const M = this.model, k = this.baseScale, f = this.feet;
    const sink = (this.sink || 0) * M.top * 1.05;
    // root: feet, facing, fall, scale. When falling, pivot about the feet so the body lands on the ground.
    _q.setFromEuler(_e.set(this.pitch, this.yaw, this.roll, 'YXZ'));
    this.root.compose(_v.set(f.x, f.y + (this.rootY - sink) * k + (this.dying ? Math.sin(Math.min(1, this.dieT / 0.38) * Math.PI / 2) * M.bodyR * 0.25 * k : 0), f.z), _q, _s.set(k, k, k));
    const B = M.bones, W = this.world, R = this.rot;
    for (let i = 0; i < B.length; i++) {
      const b = B[i];
      _m.compose(_v.set(b.pos[0], b.pos[1], b.pos[2]), _q.setFromEuler(_e.set(R[i * 3], R[i * 3 + 1], R[i * 3 + 2], 'XYZ')), _s.set(1, 1, 1));
      W[i].multiplyMatrices(b.parent < 0 ? this.root : W[b.parent], _m);
    }
    const flash = this.flashT > 0;
    for (const g of M.geos) {
      if (g.role && this.gone.has(g.role)) continue;
      _m2.multiplyMatrices(W[g.bone], g.L);
      const c = this.colorOf(g, flash);
      C3D.push(g.shape, g.glow, _m2, c[0], c[1], c[2]);
    }
    // stumps where something came off
    for (const R0 of this.gone) { const g = M.geos.find((q) => q.role === R0); if (!g) continue; _m2.multiplyMatrices(W[g.bone], _m.makeScale(9, 6, 9)); C3D.push(BALL, 0, _m2, BLOOD[0] * 1.3, BLOOD[1], BLOOD[2]); }
    super.draw(batch, fxBatch, addBatch, alive);   // shadow, dig hole, aura and the effects that hang round a modified enemy
  }
}
