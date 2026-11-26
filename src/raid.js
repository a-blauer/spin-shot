// The Mother Mold (once the Hollow King): the last fight of the Descent, built the way a raid's final encounter is built.
//   - It is enormous and it is not in the room with you: a god rising out of the dark past the edge of a stone island,
//     its hands coming down onto the island to crush whoever it is looking at, its eyes raking the floor.
//   - It cannot be hurt until you have done the encounter's work: its Bearers come up out of the deep carrying cinders;
//     kill one, take its cinder (the carrier glows and has a short fuse) and lay it in one of the three pyres. Three lit
//     pyres bring the King to its knees, its chest open at the island's edge: that is the damage phase, short and loud.
//   - When the phase ends it puts the pyres out with a shockwave you jump, rises, and the work starts again.
//   - At the end it has nothing left to protect: a final stand on a clock. Let the clock run out, or let the long clock
//     (the whole fight's) run out, and the deep takes everyone.
// The host runs the fight; every machine draws the King and animates its arms from the hazards it lays down (they are
// sent to everyone already), and the rest (phase, pyres, cinders, who carries them, the clocks) rides in the Descent's
// state. Everything dangerous is a hazard, so a guest dodges exactly what the host sees.
import * as THREE from 'three';
import { DATA, lin } from './data.js';
import { Geo, wob } from './propkit.js';
import { toonMaterial } from './render.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const ss = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
// the layout, in the room's own frame (x across, y along it, z up; the King is toward -y)
export const RAID = { isle: [0, 1600], R: 3500, cause: 900, king: [0, -4400], pyres: [[-1900, 500], [1900, 500], [0, 3800]], plate: 330, enrage: 480, dmgT: 22, finalT: 30, finalAt: 0.12 };
export const walkable = (x, y) => Math.hypot(x - RAID.isle[0], y - RAID.isle[1]) < RAID.R || (Math.abs(x) < RAID.cause && y > RAID.isle[1] + RAID.R - 600);
const SLAM = [0.62, 0.22, 1], BEAM = [1, 0.3, 0.75], PURGE = [0.75, 0.6, 1];
const same = (a, b) => a && Math.abs(a[0] - b[0]) < 0.02 && Math.abs(a[1] - b[1]) < 0.02 && Math.abs(a[2] - b[2]) < 0.02;
const PH = { rise: 0, gather: 1, kneel: 2, dmg: 3, purge: 4, final: 5, dead: 6, wipe: 7 };

// ---------------------------------------------------------------- the King's body, sculpted
const STONE = 0x4a4438, STONE2 = 0x5c5440, BONE = 0xe2d6bc, BONE2 = 0xc6b696, CROWN = 0xa4432a, CLOTH = 0x2a2218, CAV = 0x0e0a06;
function mesh(build) {
  const G = new Geo(); build(G); const { pos, col, idx } = G.out(), v = new Float32Array(pos.length);
  for (let i = 0; i < pos.length; i += 3) { v[i] = pos[i]; v[i + 1] = pos[i + 2]; v[i + 2] = pos[i + 1]; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(v, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
  const m = new THREE.Mesh(g, toonMaterial({ vcol: true, double: true })); m.frustumCulled = false; return m;
}
const glowMat = (c, o = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c[0], c[1], c[2]), transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false });
const cracked = (base, glow) => (nx, ny, nz) => { const w = wob(nx * 7 + nz * 3, ny * 5 - nz * 2); return Math.abs(w) < 0.045 ? glow : w > 0.45 ? STONE2 : base; };
// the torso, its origin at the waist: a ribbed belly, a great chest with the front of it broken open on a cavity (the heart
// hangs in it), ribs across the hole, shoulders under spiked pauldrons, a torn mantle down the back
function torsoMesh() {
  return mesh((G) => {
    const c = cracked(STONE, 0x9ae048);
    G.blob(0, -40, 380, 620, 420, 560, c, { e: 2.4, nu: 24, nv: 14 });
    G.blob(0, -60, 1300, 1060, 560, 640, c, { e: 2.6, nu: 30, nv: 16, warp: (x, y, z) => [x, y > 200 && Math.abs(x) < 520 && Math.abs(z) < 420 ? y - (1 - Math.abs(x) / 520) * 260 : y, z] });
    G.blob(0, 330, 1300, 430, 140, 430, CAV, { e: 2.2, nu: 18, nv: 12 });                             // the cavity
    for (let k = 0; k < 6; k++) { const z = 980 + k * 115, w = 500 - Math.abs(k - 2.5) * 40; G.tube([[-w - 160, 300, z + 40], [-w * 0.6, 470, z], [0, 520, z - 30], [w * 0.6, 470, z], [w + 160, 300, z + 40]], 26 - Math.abs(k - 2.5) * 2, k % 2 ? BONE : BONE2, { S: 8 }); }
    G.tube([[0, 480, 900], [0, 540, 1300], [0, 470, 1720]], 40, BONE, { S: 8 });                        // the breastbone
    for (const e of [-1, 1]) {
      G.blob(e * 1120, -40, 1760, 430, 400, 330, STONE2, { e: 2.2, nu: 20, nv: 12 });
      for (let k = 0; k < 4; k++) { const b = G.n; G.lathe([[70, 0], [55, 160], [20, 380], [0, 470]], BONE2, 10); G.place(b, { x: e * (980 + k * 120), y: -160 + k * 70, z: 1980 - k * 30, roll: -e * (20 + k * 12), pitch: -18 }); }
      G.blob(e * 760, -80, 380, 300, 340, 360, STONE2, { e: 2.4 });                                    // the hips sinking into the dark
    }
    // the mantle: torn cloth from the shoulders down the back, hanging in folds
    G.surf((u, v) => { const x = (u - 0.5) * 2300, fold = Math.sin(u * 30) * 40 * v, z = 1900 - v * (1500 + wob(u * 9) * 260); return [x * (1 - 0.15 * v), -520 - 140 * v + fold, z]; }, 0, 1, 40, 0, 1, 10, (u, v) => (v > 0.85 && wob(u * 21) > 0 ? CAV : CLOTH));
    for (let k = 0; k < 7; k++) { const b = G.n; G.lathe([[60, 0], [30, 200], [0, 340]], STONE2, 8); G.place(b, { x: 0, y: -560, z: 600 + k * 190, roll: 0, pitch: -70 }); }   // the spine's ridge
    G.tube([[0, -30, 1900], [0, 40, 2150]], 300, STONE, { S: 14 });                                     // the neck
  });
}
// the head: a long skull in a hood of stone, two eye-pits, a jaw hung slightly open, a crown of iron spikes
function headMesh() {
  return mesh((G) => {
    G.blob(0, 40, 330, 330, 380, 400, BONE, { e: 2.2, nu: 24, nv: 14, warp: (x, y, z) => [x * (1 - 0.18 * Math.max(0, -z / 400)), y + (z < -100 ? 40 : 0), z] });
    G.blob(0, -60, 420, 400, 380, 420, STONE, { e: 2.4, nu: 24, nv: 14, warp: (x, y, z) => [x, y > 150 ? y - (y - 150) * 1.6 : y, z] });   // the hood, open at the face
    for (const e of [-1, 1]) G.blob(e * 140, 380, 380, 95, 40, 80, CAV, { e: 2.4, nu: 12, nv: 8 });
    G.blob(0, 360, 230, 50, 40, 40, CAV, { e: 2 });
    G.blob(0, 230, 60, 230, 210, 110, BONE2, { e: 2.6, nu: 18, nv: 10 });                               // the jaw
    for (let i = -3; i <= 3; i++) G.blob(i * 52, 400, 140, 18, 12, 30, BONE, { e: 3, nu: 8, nv: 4 });
    G.lathe([[300, 0], [320, 40], [310, 110], [290, 130]], CROWN, 26, [0, 0, 700]);
    for (let k = 0; k < 11; k++) { const a = (k / 11) * Math.PI * 2, tall = Math.abs(Math.sin(a + Math.PI / 2)) > 0.9 ? 620 : 260 + 140 * ((k * 7) % 3), b = G.n; G.lathe([[48, 0], [36, tall * 0.5], [0, tall]], CROWN, 8); G.place(b, { x: Math.cos(a) * 300, y: Math.sin(a) * 300, z: 800, roll: Math.sin(a) * 14, pitch: -Math.cos(a) * 14 }); }
  });
}
// an arm's two pieces and its hand, each built along +z from 0 to its length
function boneMesh(len, r0, r1, armour) {
  return mesh((G) => {
    G.tube([[0, 0, 0], [0, 20, len * 0.5], [0, 0, len]], (t) => r0 + (r1 - r0) * t + Math.sin(t * Math.PI) * 30, cracked(STONE, 0x9ae048), { S: 14 });
    if (armour) for (let k = 0; k < 3; k++) G.tube([[0, 0, len * (0.2 + k * 0.25)], [0, 0, len * (0.2 + k * 0.25) + 60]], r0 + 30, BONE2, { S: 14 });
    G.blob(0, 0, len, r1 * 1.15, r1 * 1.15, r1 * 1.15, STONE2, { e: 2 });
  });
}
function handMesh() {
  return mesh((G) => {
    G.blob(0, 0, 160, 260, 120, 220, STONE, { e: 2.6, nu: 18, nv: 10 });
    for (let f = 0; f < 4; f++) { const x = -180 + f * 120; G.tube([[x, 0, 330], [x * 1.1, 60, 520], [x * 1.15, 160, 640], [x * 1.15, 290, 660]], (t) => 50 - t * 26, (t) => (t > 0.8 ? BONE : STONE2), { S: 8 }); }
    G.tube([[230, 0, 200], [330, 120, 330], [360, 260, 380]], (t) => 56 - t * 26, (t) => (t > 0.8 ? BONE : STONE2), { S: 8 });
  });
}

// the sculpted King (tools/sculpt_king.mjs -> king.json): loaded once, shared by every fight
let KING = null;
function loadKing() {
  if (KING) return KING;
  KING = fetch('king.json').then((r) => (r.ok ? r.json() : null)).then((j) => {
    if (!j || !j.b64) return null;
    const bin = atob(j.b64), buf = new ArrayBuffer(bin.length), u8 = new Uint8Array(buf); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const dv = new DataView(buf), n = dv.getUint32(0, true), meta = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, n))), base = 4 + n + ((4 - ((4 + n) % 4)) % 4), out = { UL: meta.UL, FL: meta.FL };
    for (const m of meta.parts) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buf, base + m.off[0], m.v * 3), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(buf, base + m.off[1], m.v * 3), 3, true));
      g.setAttribute('color', new THREE.BufferAttribute(new Uint8Array(buf, base + m.off[2], m.v * 3), 3, true));
      g.setIndex(new THREE.BufferAttribute(m.i32 ? new Uint32Array(buf, base + m.off[3], m.i) : new Uint16Array(buf, base + m.off[3], m.i), 1));
      g.computeBoundingSphere(); out[m.name] = g;
    }
    return out;
  }).catch(() => null);
  return KING;
}
// the mantle: torn cloth from the shoulders down the back (cloth stays a surface; the sculpt is solids)
function mantleMesh() {
  return mesh((G) => {
    G.surf((u, v) => { const x = (u - 0.5) * 2300, fold = Math.sin(u * 30) * 50 * v, z = 2050 - v * (1900 + wob(u * 9) * 300); return [x * (1 - 0.12 * v), -380 - 260 * v + fold, z]; }, 0, 1, 48, 0, 1, 12, (u, v) => (v > 0.82 && wob(u * 21) > 0 ? CAV : v < 0.06 ? CROWN : CLOTH));
  });
}

export class Raid {
  constructor(g, D) {
    this.g = g; this.D = D; const A = D.A(); this.A = A; this.c = A.c;
    this.ph = PH.rise; this.t = 0; this.enrage = RAID.enrage; this.lit = [0, 0, 0]; this.cinders = []; this.bearers = []; this.bearerIds = [];
    this.kneel = 0; this.riseK = 0; this.atkT = 6; this.beamT = 16; this.addT = 4; this.bearT = 5; this.cycle = 0; this.hp = 1;
    this.build();
  }
  // the room's frame -> three.js world
  w(x, y, z = 0) { return V3(this.c[0] + x, z, this.c[1] + y); }
  loc(p) { return [p.x - this.c[0], p.z - this.c[1]]; }
  get host() { return this.g.net.role !== 'client'; }

  // ---------------------------------------------------------------- the visuals (every machine)
  build() {
    const S = (this.root = new THREE.Group()); this.g.scene.add(S);
    const K = (this.king = new THREE.Group()); S.add(K); this.SC = 1.7; K.scale.setScalar(this.SC);
    this.torso = new THREE.Group(); K.add(this.torso); this.torsoOld = torsoMesh(); this.torso.add(this.torsoOld);
    this.head = new THREE.Group(); this.head.scale.setScalar(1.25); this.head.position.set(0, 2120, 60); this.torso.add(this.head); this.headOld = headMesh(); this.head.add(this.headOld);
    this.shoulder = V3(1150, 1680, 0); this.armA = 1550 * 2.2; this.armB = 1450 * 2.2;
    // eyes and heart: lights you see from across the dark
    this.eyes = []; for (const e of [-1, 1]) { const m = new THREE.Mesh(new THREE.SphereGeometry(52, 12, 8), glowMat([0.77, 1, 0.35])); m.scale.set(1.5, 0.42, 0.6); m.rotation.z = e * 0.3; m.position.set(e * 140, 385, 400); this.head.add(m); this.eyes.push(m); }
    this.heartAt = V3(0, 1300, 330);   // in the torso's frame (three: x, up, forward)
    this.heart = new THREE.Group(); this.heart.position.copy(this.heartAt); this.torso.add(this.heart);
    this.heartCore = new THREE.Mesh(new THREE.IcosahedronGeometry(150, 1), glowMat([0.85, 1, 0.45])); this.heart.add(this.heartCore);
    this.heartHalo = new THREE.Mesh(new THREE.SphereGeometry(230, 16, 10), glowMat([0.5, 0.9, 0.25], 0.3)); this.heart.add(this.heartHalo);
    // the arms
    this.arms = [-1, 1].map((e) => { const A = { e, up: boneMesh(1550, 230, 190, true), lo: boneMesh(1450, 190, 150, false), hand: handMesh(), act: null, T: null, rest: null };
      A.up.scale.set(1.8, 2.2, 1.8); A.lo.scale.set(1.8, 2.2, 1.8); A.hand.scale.setScalar(2.1); S.add(A.up, A.lo, A.hand); return A; });
    this.reach = (1550 + 1450) * 2.2;
    // a pale ring of light behind it, so the shape of it reads against the dark from anywhere on the island
    { const c = document.createElement('canvas'); c.width = c.height = 256; const q = c.getContext('2d'), gr = q.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(120,90,200,0.0)'); gr.addColorStop(0.55, 'rgba(150,110,255,0.10)'); gr.addColorStop(0.78, 'rgba(200,170,255,0.42)'); gr.addColorStop(0.84, 'rgba(150,110,255,0.12)'); gr.addColorStop(1, 'rgba(120,90,200,0)'); q.fillStyle = gr; q.fillRect(0, 0, 256, 256);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; this.halo = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); this.halo.position.copy(this.w(0, -5900, 3900)); S.add(this.halo); }
    // the beam from its eyes, and the pyres' fires, and the cinders
    this.beam = new THREE.Mesh(new THREE.CylinderGeometry(60, 60, 1, 10, 1, true), glowMat(BEAM, 0.8)); this.beam.visible = false; S.add(this.beam);
    this.beamCore = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 1, 8, 1, true), glowMat([1, 0.9, 1], 1)); this.beam.add(this.beamCore);
    this.fires = RAID.pyres.map(([x, y]) => { const G = new THREE.Group(); G.position.copy(this.w(x, y, 150)); S.add(G);
      const f1 = new THREE.Mesh(new THREE.ConeGeometry(110, 420, 10, 1, true), glowMat([1, 0.55, 0.18], 0.85)); f1.position.y = 200; G.add(f1);
      const f2 = new THREE.Mesh(new THREE.ConeGeometry(60, 260, 8, 1, true), glowMat([1, 0.9, 0.5], 1)); f2.position.y = 140; G.add(f2);
      const pl = new THREE.Mesh(new THREE.RingGeometry(RAID.plate - 30, RAID.plate, 48), glowMat([0.6, 0.85, 1], 0.7)); pl.rotation.x = -Math.PI / 2; pl.position.y = -144; G.add(pl);
      const ember = new THREE.Mesh(new THREE.SphereGeometry(40, 10, 6), glowMat([0.6, 0.85, 1], 0.9)); ember.position.y = 30; G.add(ember);
      return { G, f1, f2, pl, ember }; });
    this.orbs = [];
    // the abyss: past the island's lip the floor is gone into a dark green-black, and a slow mist of spores turns over it
    const cv = document.createElement('canvas'); cv.width = cv.height = 512; const q = cv.getContext('2d'), gr = q.createRadialGradient(256, 256, 0, 256, 256, 256);
    const r0 = RAID.R / 9000; gr.addColorStop(0, 'rgba(5,8,4,0)'); gr.addColorStop(r0 * 0.985, 'rgba(5,8,4,0)'); gr.addColorStop(r0 * 1.02, 'rgba(5,8,4,0.92)'); gr.addColorStop(1, 'rgba(3,5,2,1)');
    q.fillStyle = gr; q.fillRect(0, 0, 512, 512); const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.NoColorSpace;
    const abyss = new THREE.Mesh(new THREE.PlaneGeometry(18000, 18000), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false })); abyss.rotation.x = -Math.PI / 2; abyss.position.copy(this.w(RAID.isle[0], RAID.isle[1], 14)); S.add(abyss);
    const cv2 = document.createElement('canvas'); cv2.width = cv2.height = 256; const q2 = cv2.getContext('2d');
    for (let i = 0; i < 60; i++) { const a = Math.random() * 6.28, r = 40 + Math.random() * 88, g2 = q2.createRadialGradient(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 0, 128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 10 + Math.random() * 26); g2.addColorStop(0, 'rgba(160,230,90,0.2)'); g2.addColorStop(1, 'rgba(160,230,90,0)'); q2.fillStyle = g2; q2.fillRect(0, 0, 256, 256); }
    const tx2 = new THREE.CanvasTexture(cv2); tx2.colorSpace = THREE.NoColorSpace;
    this.mist = new THREE.Mesh(new THREE.PlaneGeometry(16000, 16000), new THREE.MeshBasicMaterial({ map: tx2, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); this.mist.rotation.x = -Math.PI / 2; this.mist.position.copy(this.w(0, -1500, 60)); S.add(this.mist);
    // light falling from far above onto the King: two long shafts
    this.shafts = [];
    for (const [x, y, r] of [[-900, -4300, 1100], [1300, -5000, 800]]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.4, r, 7000, 18, 1, true), glowMat([0.6, 0.9, 0.45], 0.07)); m.position.copy(this.w(x, y, 3500)); S.add(m); this.shafts.push(m); }
    this.pose(0);
    // swap in the sculpted King once it has loaded
    loadKing().then((K) => {
      if (!K || !this.root) return;
      const mat = () => toonMaterial({ vcol: true }), M = (g) => { const m = new THREE.Mesh(g, mat()); m.frustumCulled = false; return m; };
      this.torso.remove(this.torsoOld); this.torso.add(M(K.torso)); this.torso.add(mantleMesh());
      this.head.remove(this.headOld); this.head.add(M(K.head)); this.head.scale.setScalar(1); this.head.position.set(0, 2240, -60);
      this.eyes.forEach((m, i) => { m.position.set((i ? 1 : -1) * 112, 340, 270); m.scale.set(1.3, 0.55, 0.6); });
      this.heart.position.set(0, 1290, 170); this.shoulder.set(1000, 1900, -60); this.armA = K.UL; this.armB = K.FL;
      for (const A of this.arms) { for (const [k, g] of [['up', K.upper], ['lo', K.fore], ['hand', K.hand]]) { A[k].geometry = g; A[k].material = mat(); A[k].scale.set(1, 1, 1); } }
      this.reach = K.UL + K.FL; this.sculpted = true;
    });
  }
  dispose() { if (!this.root) return; this.g.scene.remove(this.root); this.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); this.root = null; }

  // where the King stands and leans: riseK 0..1 brings it up out of the dark, kneel 0..1 brings it forward onto the island
  pose(time) {
    const k = ss(this.kneel), r = ss(this.riseK), br = Math.sin(time * 0.7) * 0.02;
    const base = this.w(RAID.king[0], RAID.king[1] + k * 290, -5000 * (1 - r) + 120 - k * 1005);
    this.king.position.copy(base);
    this.torso.rotation.set(0.05 + br + k * 0.62, Math.sin(time * 0.23) * 0.05 * (1 - k), 0);
    // the head finds whoever it means to crush
    const tgt = this.lookAt || this.w(0, RAID.isle[1], 0); this.king.updateMatrixWorld(true);
    const hw = this.head.getWorldPosition(V3(0, 0, 0)), dx = tgt.x - hw.x, dz = tgt.z - hw.z;
    this.head.rotation.y += (Math.max(-0.7, Math.min(0.7, Math.atan2(dx, dz))) - this.head.rotation.y) * 0.05;
    this.head.rotation.x = 0.25 + k * 0.1;
    this.king.updateMatrixWorld(true);
  }
  heartWorld() { return this.heart.getWorldPosition(V3(0, 0, 0)); }
  // two bones from the shoulder to the hand: the elbow out and back, away from the island
  ik(A, T0) {
    // T0 is where the fingers come down; the wrist rides above it and back toward the shoulder, the hand reaching down from it
    const sh0 = this.torso.localToWorld(V3(A.e * this.shoulder.x, this.shoulder.y, this.shoulder.z)), back = V3(sh0.x - T0.x, 0, sh0.z - T0.z).normalize(), T = this.sculpted ? T0.clone().add(V3(0, 1250, 0)).addScaledVector(back, 900) : T0;
    const sh = this.torso.localToWorld(V3(A.e * this.shoulder.x, this.shoulder.y, this.shoulder.z)), a = this.armA, b = this.armB;
    let d = T.clone().sub(sh); const L = Math.max(Math.abs(a - b) + 10, Math.min(a + b - 10, d.length())); d.normalize();
    const pole = V3(A.e, 0.7, -0.6).normalize(), n = pole.clone().addScaledVector(d, -pole.dot(d)).normalize();
    const ca = (a * a + L * L - b * b) / (2 * a * L), sa = Math.sqrt(Math.max(0, 1 - ca * ca)), el = sh.clone().addScaledVector(d, a * ca).addScaledVector(n, a * sa), hand = sh.clone().addScaledVector(d, L);
    const seg = (m, p0, p1) => { m.position.copy(p0); const dir = p1.clone().sub(p0).normalize(); m.quaternion.setFromUnitVectors(V3(0, 1, 0), dir); };
    seg(A.up, sh, el); seg(A.lo, el, hand); if (this.sculpted) seg(A.hand, hand, T0); else seg(A.hand, hand, hand.clone().add(hand.clone().sub(el).normalize().multiplyScalar(0.55).add(V3(0, -1, 0)).normalize()));
  }
  // where a hand rests: on the lip of the island while it stands, planted on the island while it kneels
  restOf(A) { const k = ss(this.kneel), x = A.e * (2500 - 300 * k), y = this.sculpted ? -2150 + k * 850 : -2500 + k * 1200, z = (1 - ss(this.riseK)) * -4000 + (this.sculpted ? 10 : 500 * (1 - k) + 60); return this.w(x, y, z); }
  canReach(p) { const sh = this.torso.localToWorld(V3((p.x > this.c[0] ? 1 : -1) * this.shoulder.x, this.shoulder.y, this.shoulder.z)); return sh.distanceTo(p) < this.reach * 0.96; }
  // the arms follow the slams laid down on the floor (the hazards every machine already has)
  watchHazards() {
    for (const H of this.g.hazards.list) {
      if (H.raidSeen || H.kind !== 'Marker') continue; H.raidSeen = true;
      if (same(H.color, SLAM)) { const [x] = this.loc(H.pos), A = this.arms[x < 0 ? 0 : 1]; const B = this.arms[x < 0 ? 1 : 0], use = A.act && A.act.t < A.act.dur + 0.8 && !(B.act && B.act.t < B.act.dur + 0.8) ? B : A; use.act = { T: H.pos.clone(), t: 0, dur: H.delay, from: null }; this.lookAt = H.pos.clone(); }
      else if (same(H.color, BEAM)) { (this.beams || (this.beams = [])).push(H); }
    }
  }
  animate(dt, time) {
    this.watchHazards(); this.pose(time);
    for (const A of this.arms) {
      const rest = this.restOf(A); let T = rest;
      if (A.act) {
        const a = A.act; a.t += dt; const up = a.T.clone().add(V3(0, 1500, 0)).lerp(rest, 0.15);
        if (!a.from) a.from = (A.T || rest).clone();
        if (a.t < a.dur - 0.28) T = a.from.clone().lerp(up, ss(a.t / Math.max(0.3, a.dur - 0.28)));
        else if (a.t < a.dur) T = up.clone().lerp(a.T.clone().add(V3(0, 60, 0)), Math.pow((a.t - (a.dur - 0.28)) / 0.28, 2));
        else if (a.t < a.dur + 1.1) T = a.T.clone().add(V3(0, 60, 0));
        else if (a.t < a.dur + 2.1) T = a.T.clone().add(V3(0, 60, 0)).lerp(rest, ss(a.t - a.dur - 1.1));
        else A.act = null;
      }
      A.T = A.T ? A.T.lerp(T, A.act ? 1 : Math.min(1, dt * 3)) : T.clone(); this.ik(A, A.T);
    }
    // the beam: from its eyes to wherever the sweep has got to
    this.beams = (this.beams || []).filter((H) => !H.done && H.age < H.life);
    const live = this.beams.filter((H) => H.life - H.age < 0.5).sort((a, b) => a.life - a.age - (b.life - b.age))[0];
    if (live) { const e = this.eyes[0].getWorldPosition(V3(0, 0, 0)).add(this.eyes[1].getWorldPosition(V3(0, 0, 0))).multiplyScalar(0.5), p = live.pos.clone(), d = p.clone().sub(e);
      this.beam.visible = true; this.beam.position.copy(e).addScaledVector(d, 0.5); this.beam.scale.set(1, d.length(), 1); this.beam.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); }
    else this.beam.visible = false;
    // eyes, heart, mist, fires, cinders
    const ex = this.ph === PH.dmg || this.ph === PH.final, pulse = 1 + Math.sin(time * (ex ? 9 : 3)) * (ex ? 0.18 : 0.06);
    this.heartCore.scale.setScalar(pulse * (ex ? 1.25 : 0.8)); this.heartCore.rotation.y += dt * 0.8; this.heartHalo.scale.setScalar(pulse * (ex ? 1.3 : 0.9)); this.heartHalo.material.opacity = ex ? 0.45 : 0.18;
    for (const m of this.eyes) m.material.color.setRGB(this.ph === PH.final ? 1 : 0.77, this.ph === PH.final ? 0.35 : 1, this.ph === PH.final ? 0.2 : 0.35);
    this.mist.rotation.z += dt * 0.015;
    this.fires.forEach((F, i) => { const on = !!this.lit[i]; F.f1.visible = F.f2.visible = on; F.ember.visible = !on; if (on) { F.f1.scale.set(1 + Math.sin(time * 11 + i) * 0.08, 1 + Math.sin(time * 7 + i) * 0.12, 1); F.f2.scale.y = 1 + Math.sin(time * 13 + i) * 0.15; }
      F.pl.material.color.setRGB(on ? 1 : 0.6, on ? 0.6 : 0.85, on ? 0.2 : 1); F.pl.material.opacity = on ? 0.9 : 0.45 + 0.25 * Math.sin(time * 3 + i); });
    while (this.orbs.length < this.cinders.length) { const m = new THREE.Mesh(new THREE.SphereGeometry(46, 12, 8), glowMat([1, 0.7, 0.3])); m.add(new THREE.Mesh(new THREE.SphereGeometry(110, 12, 8), glowMat([1, 0.5, 0.15], 0.3))); this.root.add(m); this.orbs.push(m); }
    this.orbs.forEach((m, i) => { const C = this.cinders[i]; m.visible = !!C; if (!C) return; const P = C.by ? this.who(C.by) : null;
      m.position.copy(P ? P.pos.clone().add(V3(0, 130, 0)) : this.w(C.x, C.y, 70 + Math.sin(time * 3 + i) * 14)); m.scale.setScalar(C.by && C.life < 6 ? 0.7 + 0.3 * Math.abs(Math.sin(time * 10)) : 1);
      if (Math.random() < dt * 20) this.g.fx.add({ pos: m.position.clone(), vel: V3((Math.random() - 0.5) * 60, 140, (Math.random() - 0.5) * 60), life: 0.6, size0: 26, size1: 4, c0: [1, 0.75, 0.3, 1], c1: [1, 0.3, 0.1, 1], fadeOut: 0.4, tex: 'FX_Spark', kind: 'add', glow: 1.5 }); });
    // ash in the air round you, and embers off the lit pyres
    const P = this.g.player; if (Math.random() < dt * 40) { const a = Math.random() * 6.28, r = 300 + Math.random() * 2200; this.g.fx.add({ pos: P.pos.clone().add(V3(Math.cos(a) * r, 400 + Math.random() * 900, Math.sin(a) * r)), vel: V3(20 - Math.random() * 40, -60 - Math.random() * 40, 30), life: 5, size0: 7, size1: 5, c0: [0.75, 0.6, 1, 0.7], c1: [0.4, 0.3, 0.7, 0], fadeOut: 1.5, tex: 'FX_Spark', kind: 'add', glow: 0.6 }); }
    this.fires.forEach((F, i) => { if (this.lit[i] && Math.random() < dt * 14) this.g.fx.add({ pos: F.G.position.clone().add(V3((Math.random() - 0.5) * 120, 220, (Math.random() - 0.5) * 120)), vel: V3((Math.random() - 0.5) * 80, 300 + Math.random() * 200, (Math.random() - 0.5) * 80), life: 1.4, size0: 14, size1: 3, c0: [1, 0.8, 0.4, 1], c1: [1, 0.3, 0.1, 1], fadeOut: 0.6, tex: 'FX_Spark', kind: 'add', glow: 1.5 }); });
  }

  // ---------------------------------------------------------------- who is in the fight
  me() { return this.g.net.me || 'me'; }
  players() { const g = this.g, L = [{ id: this.me(), pos: g.player.pos, dead: g.player.dead }]; for (const [k, G] of g.net.ghosts) if (G && G.pos) L.push({ id: k, pos: G.pos, dead: !!G.dead }); return L; }
  who(id) { return this.players().find((p) => p.id === id); }
  heartE() { const B = this.g.boss; return B && B.boss && B.boss.raid ? B : null; }

  // ---------------------------------------------------------------- the fight (host)
  begin() {
    const g = this.g, bi = DATA.bosses.findIndex((b) => b.raid); if (bi < 0) return;
    const more = g.net.role === 'host' ? g.net.ghosts.size : 0;
    const E = g.spawnEnemy(0, this.heartWorld(), false, bi, 1, 2.9 * 1.25 * (1 + 0.6 * more), 0, false);
    E.raidHeart = (dt) => this.heartTick(E, dt); E.finalInv = 999; E.emerge = 5.5; E.hitR = 330; E.hitH = 660; E.feetOffset = 330; E.radius = 330; E.half = 330;
    g.boss = E; g.bossSpawned = true; this.ph = PH.rise; this.t = 0;
    g.audio.play('S_BossRoar', 1, 0.6); g.audio.play('S_Phase', 0.9); g.hitstop = Math.max(g.hitstop || 0, 0.3);
  }
  heartTick(E, dt) { E.pos.copy(this.heartWorld()); E.vel.set(0, 0, 0); if (E.emerge > 0) E.emerge -= dt; }
  say(t, col = [0.75, 0.6, 1], d = 3) { this.g.banner(t, col, d); }
  tick(dt) {
    const g = this.g, time = g.time || 0;
    this.t += dt;
    if (this.host) this.run(dt);
    // the King's rise and kneel follow the phase on every machine
    const wantK = this.ph === PH.kneel || this.ph === PH.dmg || this.ph === PH.final ? 1 : this.ph === PH.dead ? 0.4 : 0;
    this.kneel += (wantK - this.kneel) * Math.min(1, dt * (wantK > this.kneel ? 1.1 : 0.8));
    this.riseK = this.ph === PH.rise ? Math.min(1, this.t / 5) : this.ph === PH.dead ? Math.max(0, 1 - Math.max(0, this.t - 1.5) / 5) : 1;
    if (this.ph === PH.dead && this.t > 1.5) this.torso.rotation.z = Math.min(0.5, (this.t - 1.5) * 0.12);
    this.animate(dt, time);
    // the fight's words, on the boss bar
    const E = this.heartE(); if (E) {
      E.raidImmune = !(this.ph === PH.dmg || this.ph === PH.final);
      const n = this.lit.reduce((a, b) => a + b, 0), carry = this.cinders.find((C) => C.by === this.me());
      E.raidSay = this.ph === PH.rise ? 'IT RISES' : this.ph === PH.gather ? (carry ? `YOU CARRY A CINDER  -  TO A PYRE  (${Math.ceil(carry.life)}s)` : `IMMUNE  -  KILL ITS BEARERS, LIGHT THE PYRES  ${n} / 3`) : this.ph === PH.kneel ? 'IT KNEELS  -  GET TO THE EDGE' : this.ph === PH.dmg ? 'THE HEART IS OPEN  -  POUR IT ON' : this.ph === PH.purge ? 'IT RISES  -  JUMP THE SHOCKWAVE' : this.ph === PH.final ? 'FINAL STAND  -  KILL IT NOW' : '';
      E.raidClock = this.ph === PH.final ? this.finalLeft : this.ph === PH.dmg ? this.dmgLeft : this.enrage; E.raidClockCol = this.ph === PH.final ? '#ff5a3a' : this.ph === PH.dmg ? '#ffd24d' : this.enrage < 60 ? '#ff5a3a' : '#c8b8ff';
    }
    // the deep throws back whoever goes over the edge
    const P = g.player, [px, py] = this.loc(P.pos);
    if (!P.dead && !walkable(px, py) && Math.hypot(px - RAID.isle[0], py - RAID.isle[1]) > RAID.R + 80) {
      const a = Math.atan2(py - RAID.isle[1], px - RAID.isle[0]), back = this.w(RAID.isle[0] + Math.cos(a) * (RAID.R - 500), RAID.isle[1] + Math.sin(a) * (RAID.R - 500), 140);
      P.pos.copy(back); P.vel.set(0, 0, 0); P.receiveDamage(P.maxHealth ? P.maxHealth * 0.25 : 40, { pos: back }, false); g.hud.toast('The deep throws you back.', '#c8b8ff');
      const C = this.cinders.find((c) => c.by === this.me()); if (C && this.host) { C.by = null; [C.x, C.y] = this.loc(back); }
    }
  }
  run(dt) {
    const g = this.g, E = this.heartE(), L = this.players(), alive = L.filter((p) => !p.dead);
    if (!E) { if (this.ph !== PH.dead && this.ph !== PH.rise) this.go(PH.dead); return; }
    if (E.dead) { if (this.ph !== PH.dead) this.go(PH.dead); return; }
    this.hp = E.health / E.maxHealth;
    if (this.ph !== PH.final && this.ph !== PH.wipe && this.ph !== PH.rise) { this.enrage -= dt; if (this.enrage <= 0) return this.wipe('THE DEEP TAKES YOU'); }
    const dmgA = E.attackDamage;
    // enemies that end up off the island come back onto it
    for (const Z of g.enemies) { if (Z.dead || Z === E) continue; const [x, y] = this.loc(Z.pos); if (!walkable(x, y)) { const a = Math.random() * 6.28, r = Math.random() * (RAID.R - 600); Z.pos.copy(this.w(RAID.isle[0] + Math.cos(a) * r, RAID.isle[1] + Math.sin(a) * r, Z.half + 20)); Z.vel.set(0, 0, 0); } }
    switch (this.ph) {
      case PH.rise: if (this.t > 5.5) { this.go(PH.gather); this.say('LIGHT THE THREE PYRES', [1, 0.75, 0.35]); } return;
      case PH.gather: this.pressure(dt, dmgA, alive, 1); this.work(dt, L); if (this.lit.every(Boolean)) { this.go(PH.kneel); this.say('THE MOTHER KNEELS', [1, 0.85, 0.4]); g.audio.play('S_BossRoar', 1, 0.7); g.shakeAt(this.w(0, -2000), 3000); } return;
      case PH.kneel: this.adds(dt, 0.5); if (this.t > 2.6) { this.go(PH.dmg); E.finalInv = 0; g.audio.play('S_Phase', 1); } return;
      case PH.dmg: this.dmgLeft = Math.max(0, RAID.dmgT - this.t); this.adds(dt, 0.4);
        if (this.hp < RAID.finalAt) { this.go(PH.final); this.finalLeft = RAID.finalT; this.say('FINAL STAND', [1, 0.3, 0.2], 3.5); g.audio.play('S_BossRoar', 1, 0.5); return; }
        if (this.t > RAID.dmgT) this.purge(dmgA); return;
      case PH.purge: if (this.t > 3) { this.go(PH.gather); this.bearT = 4; this.cycle++; } this.adds(dt, 0.6); return;
      case PH.final: this.finalLeft = Math.max(0, RAID.finalT - this.t); this.pressure(dt, dmgA, alive, 2.2); if (this.finalLeft <= 0) this.wipe('IT WILL NOT DIE'); return;
      default:
    }
  }
  go(ph) { this.ph = ph; this.t = 0; if (ph !== PH.dmg && ph !== PH.final) { const E = this.heartE(); if (E && ph !== PH.dead) E.finalInv = 999; } }
  // the King's attacks while it stands: a hand on whoever it is watching, now and then a sweep of its eyes, and the deep
  // sending up more of the dead
  pressure(dt, dmg, alive, k) {
    const g = this.g; if (!alive.length) return;
    this.atkT -= dt * k; this.beamT -= dt * k; this.adds(dt, k);
    if (this.atkT <= 0) {
      this.atkT = Math.max(3.2, 6.2 - this.cycle * 0.8);
      const P = alive[Math.floor(Math.random() * alive.length)], at = P.pos.clone(); if (P.vel) at.addScaledVector(V3(P.vel.x || 0, 0, P.vel.z || 0), 0.6);
      const [x, y] = this.loc(at); const q = walkable(x, y) ? at : P.pos.clone(); q.y = 0;
      if (this.canReach(q)) { const H = g.hazards.marker(q, dmg * 1.35, 560, 2.1, SLAM); if (H) H.label = 'The King’s hand'; }
      else for (let i = 0; i < 3; i++) { const H = g.hazards.marker(q.clone().add(V3((Math.random() - 0.5) * 500, 0, (Math.random() - 0.5) * 500)), dmg, 300, 1.5 + i * 0.35, BEAM); if (H) H.label = 'The King’s gaze'; }
      if (this.ph === PH.final || this.cycle >= 2) { const a = Math.random() * 6.28, q2 = q.clone().add(V3(Math.cos(a) * 1500, 0, Math.sin(a) * 1500)); const [x2, y2] = this.loc(q2); if (walkable(x2, y2) && this.canReach(q2)) { const H2 = g.hazards.marker(q2, dmg * 1.35, 560, 2.7, SLAM); if (H2) H2.label = 'The King’s hand'; } }
    }
    if (this.beamT <= 0) {
      this.beamT = 17 - Math.min(6, this.cycle * 2); const gid = 'kb' + Math.random();
      const a = Math.random() * Math.PI, dx = Math.cos(a), dy = Math.sin(a);
      for (let i = 0; i <= 16; i++) { const s = -3200 + i * 400, x = RAID.isle[0] + dx * s, y = RAID.isle[1] + dy * s; if (!walkable(x, y)) continue; const H = g.hazards.marker(this.w(x, y, 0), dmg * 0.9, 240, 1.7 + i * 0.11, BEAM); if (H) { H.gid = gid; H.label = 'The King’s gaze'; } }
    }
  }
  adds(dt, k) {
    const g = this.g, D = this.D; this.addT -= dt * k; if (this.addT > 0) return; this.addT = 6.5;
    const more = g.net.role === 'host' ? g.net.ghosts.size : 0, cap = 12 + more * 4, live = g.enemies.filter((Z) => !Z.dead && !Z.isBoss).length; if (live >= cap) return;
    const R = D.roster || { f: [0], o: [] }, pool = R.f.concat(R.o);
    for (let i = 0; i < 2 + more; i++) { const at = this.rimSpot(); if (!at) continue; const Z = g.spawnEnemy(pool[Math.floor(Math.random() * pool.length)] || 0, at, false, -1, 1, 1, 0, false); if (Z) { Z.emerge = 1.2; g.fx.dust(at, lin(0.3, 0.2, 0.4), 90); } }
  }
  // somewhere on the island near its lip, as if climbing up out of the dark
  rimSpot(r = RAID.R - 400) { for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6, x = RAID.isle[0] + Math.cos(a) * r, y = RAID.isle[1] + Math.sin(a) * r; const p = this.g.findFreeLocationNear(this.w(x, y, 0), 0, 300); if (p) return p.add(V3(0, 90, 0)); } return null; }
  // the encounter's work: bearers come up while pyres are dark, each drops a cinder, a cinder is carried to a pyre
  work(dt, L) {
    const g = this.g, need = 3 - this.lit.reduce((a, b) => a + b, 0) - this.cinders.length;
    this.bearers = this.bearers.filter((B) => { if (B.dead) { const [x, y] = this.loc(B.pos); this.cinders.push({ x, y, by: null, life: 30 }); g.hud.toast('A bearer falls: take its cinder to a pyre', '#ffb070'); g.audio.playAt('S_Phase', B.pos, 0.6); return false; } return !B.remove; });
    this.bearT -= dt;
    if (this.bearT <= 0 && this.bearers.length < need) {
      this.bearT = 9; const at = this.rimSpot(RAID.R - 700);
      if (at) { const d = DATA.enemies.findIndex((e) => e.art === 'Wraith'), B = g.spawnEnemy(d >= 0 ? d : 0, at, true, -1, 1, 1.4, 0, false); if (B) { B.bearer = true; B.emerge = 1.4; this.bearers.push(B); this.say('A BEARER CLIMBS UP', [1, 0.7, 0.35], 2); } }
    }
    for (const C of this.cinders) {
      C.life -= dt;
      if (C.by) { const P = this.who(C.by); if (!P || P.dead) { C.by = null; if (P) [C.x, C.y] = this.loc(P.pos); C.life = Math.max(C.life, 8); continue; }
        [C.x, C.y] = this.loc(P.pos);
        RAID.pyres.forEach(([x, y], i) => { if (!this.lit[i] && C.by && Math.hypot(C.x - x, C.y - y) < RAID.plate) { this.lit[i] = 1; C.done = true; C.by = null; g.audio.playAt('S_Explosion', this.w(x, y), 0.7, 0.7); g.fx.flash(this.w(x, y, 200), [1, 0.6, 0.2], 900, 0.5, true); this.say(`A PYRE IS LIT  ${this.lit.reduce((a, b) => a + b, 0)} / 3`, [1, 0.7, 0.3], 2.2); } });
      } else for (const P of L) if (!P.dead && Math.hypot(this.loc(P.pos)[0] - C.x, this.loc(P.pos)[1] - C.y) < 170) { C.by = P.id; C.life = 25; g.audio.play('S_Coin', 0.6); break; }
    }
    this.cinders = this.cinders.filter((C) => !C.done && C.life > 0);
  }
  purge(dmg) {
    const g = this.g; this.go(PH.purge); this.lit = [0, 0, 0];
    const at = this.w(0, RAID.isle[1] - RAID.R + 200, 0), H = g.hazards.ring(at, dmg * 0.9, 1500, 8000, PURGE); if (H) H.label = 'The King’s shockwave';
    g.shakeAt(at, 5000); g.audio.play('S_BossRoar', 1, 0.8); this.say('THE PYRES GO OUT', [0.7, 0.6, 1], 2.4);
  }
  wipe(text) {
    const g = this.g; this.go(PH.wipe); this.say(text, [1, 0.25, 0.2], 4);
    for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.28, r = i ? RAID.R * 0.6 : 0; g.hazards.marker(this.w(RAID.isle[0] + Math.cos(a) * r, RAID.isle[1] + Math.sin(a) * r, 0), 1e6, RAID.R * 0.75, 3, SLAM); }
    g.hazards.marker(this.w(0, RAID.isle[1] + RAID.R - 300, 0), 1e6, 1600, 3, SLAM);
  }
  // ---------------------------------------------------------------- what the guests need to know
  state() { return [this.ph, Math.round(this.t * 10) / 10, this.lit.join(''), this.cinders.map((C) => [Math.round(C.x), Math.round(C.y), C.by || 0, Math.round(C.life)]), Math.round(this.enrage), Math.round((this.dmgLeft || 0) * 10) / 10, Math.round((this.finalLeft || 0) * 10) / 10, this.bearers.map((B) => B.id)]; }
  sync(d) {
    if (!Array.isArray(d)) return;
    const ph = d[0] | 0; if (ph !== this.ph) { this.ph = ph; this.t = +d[1] || 0; }
    this.lit = String(d[2] || '000').split('').slice(0, 3).map((c) => (c === '1' ? 1 : 0));
    this.cinders = (Array.isArray(d[3]) ? d[3] : []).slice(0, 6).map((c) => ({ x: +c[0] || 0, y: +c[1] || 0, by: c[2] ? String(c[2]) : null, life: +c[3] || 0 }));
    this.enrage = +d[4] || 0; this.dmgLeft = +d[5] || 0; this.finalLeft = +d[6] || 0;
    const ids = new Set(Array.isArray(d[7]) ? d[7] : []); for (const Z of this.g.enemies) Z.bearer = ids.has(Z.id);
  }
}
