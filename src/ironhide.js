// Old Ironhide, in the round: a great boar in riveted iron. Sculpted once (sdf.js) the first time it comes up:
// a barrel body under a hump of shoulder, four overlapping back plates ridged with spikes (the plates the fight breaks off,
// each its own mesh), a helm over the face with a red-hot eye slit, a long snout and two curling tusks, four thick legs
// in greaves on hooves, and a stub of a tail. Faces +z, feet at y 0, about 150 high and 240 long before it is scaled.
import * as THREE from 'three';
import { C, U, H, S, reset, sph, ell, cap, chain, torus, fbm, mesh, wants, getCol, setCol } from './sdf.js';
import { toonMaterial } from './render.js';

const HIDE = C(0x5a3a28), HIDE2 = C(0x6e4a32), BRISTLE = C(0x2e2018), IRON = C(0x5c6068), IRON2 = C(0x464a52), RUST = C(0x8a4a2a), RIVET = C(0xb89a5a), TUSK = C(0xe6dcc4), SNOUT = C(0x8a5a4a), HOOF = C(0x1e1814), EYE = C(0xff5a20), DARK = C(0x140c08);
const grain = (p, k = 0.12) => { if (wants()) { const n = fbm(p[0] * 0.05, p[1] * 0.05, p[2] * 0.05); setCol(getCol().map((x) => Math.max(0, Math.min(1, x * (1 + n * k))))); } };
function body(p) {
  reset();
  U(ell(p, [0, 92, -10], [60, 54, 100]), HIDE, 20);                     // the barrel
  U(ell(p, [0, 112, 30], [56, 46, 52]), HIDE2, 24);                      // the hump over the shoulders
  U(ell(p, [0, 70, -20], [48, 30, 80]), HIDE, 20);                       // the belly
  U(cap(p, [0, 96, 70], [0, 92, 92], 40, 36), HIDE2, 14);                // the neck into the head
  // the bristle crest down the back, between the plates
  for (let i = 0; i < 9; i++) { const z = 70 - i * 18; U(cap(p, [0, 146 - i * 1.2, z], [0, 160 - i * 2, z - 14], 5, 1), BRISTLE, 4); }
  U(cap(p, [0, 92, -108], [0, 104, -128], 6, 2), BRISTLE, 6);            // the tail
  grain(p);
  return D_();
}
// a plate: a curved shell over the back, riveted along its front edge, with a spike up the middle
function plate(i) {
  const z0 = 56 - i * 44;
  return (p) => {
    reset();
    U(ell(p, [0, 104, z0], [66 - i * 2, 54, 30]), IRON, 6);
    S(ell(p, [0, 100, z0], [60 - i * 2, 50, 40]), 4);                   // hollow underneath, so it is a shell
    S(cap(p, [-200, 70, z0], [200, 70, z0], 66), 6);                     // open below the flanks
    U(cap(p, [0, 150, z0], [0, 186 - i * 4, z0 - 12], 10, 1), IRON2, 6); // the spike
    for (let k = -3; k <= 3; k++) { const a = k * 0.42; H(sph(p, [Math.sin(a) * 62, 104 + Math.cos(a) * 50, z0 + 24], 3.4), RIVET); }
    if (wants()) { const n = fbm(p[0] * 0.04 + i, p[1] * 0.04, p[2] * 0.04), c = getCol(); if (n > 0.3 && Math.abs(c[0] - IRON[0]) < 0.04 && Math.abs(c[2] - IRON[2]) < 0.04) setCol(RUST); }
    return D_();
  };
}
function head(p) {
  reset();
  U(ell(p, [0, 0, 18], [40, 38, 44]), HIDE2, 16);                        // the skull (head frame: origin at the neck)
  U(cap(p, [0, -6, 40], [0, -14, 92], 26, 21), HIDE, 14);                // the snout
  U(ell(p, [0, -14, 96], [22, 18, 6]), SNOUT, 4); for (const e of [-1, 1]) S(sph(p, [e * 8, -14, 101], 4.5), 3, DARK);   // the disc, its nostrils
  for (const e of [-1, 1]) { chain(p, [[e * 18, -22, 70], [e * 30, -18, 84], [e * 36, 0, 90], [e * 30, 16, 86]], 6, 2, TUSK, 4); U(ell(p, [e * 34, 30, 0], [8, 18, 12]), HIDE2, 6); }   // tusks, ears
  // the helm: a visor of iron over the brow and down the snout's top, a slit for the eyes, rivets, a crest
  H(ell(p, [0, 10, 30], [44, 30, 40]), IRON); S(ell(p, [0, 6, 28], [40, 26, 38]), 3);
  S(cap(p, [-60, -14, 30], [60, -14, 30], 18), 3);
  H(cap(p, [-30, 12, 64], [30, 12, 64], 3.8), EYE);                      // the red-hot slit behind the visor
  S(cap(p, [-28, 12, 70], [28, 12, 70], 5), 2);
  for (let k = -2; k <= 2; k++) H(sph(p, [k * 15, 26, 56 - Math.abs(k) * 3], 3.2), RIVET);
  U(cap(p, [0, 36, 10], [0, 50, -10], 6, 2), IRON2, 4);
  grain(p, 0.08);
  return D_();
}
// a leg, hanging from its hip at the origin to the hoof at y -h
const leg = (front) => (p) => {
  reset(); const h = front ? 78 : 74;
  U(ell(p, [0, -18, 0], [20, 30, 22]), HIDE, 10); U(cap(p, [0, -30, 0], [0, -h + 14, front ? 4 : -4], 13, 10), HIDE2, 8);
  U(ell(p, [0, -h + 6, front ? 6 : -2], [12, 8, 14]), HOOF, 4); S(cap(p, [0, -h, 18], [0, -h + 14, 18], 2.5), 2);   // the hoof, cloven
  if (front) { H(cap(p, [0, -36, 0], [0, -62, 4], 16, 14), IRON2); H(torus(p, [0, -62, 4], 15, 2.2, Math.PI / 2), RIVET); }   // greaves on the forelegs
  grain(p);
  return D_();
};
// sdf.js keeps the distance in its own state; read it back
import * as SD from './sdf.js';
function D_() { return SD.getD(); }

let GEO = null;
function geo(G) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(G.pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(G.nor, 3, true)); g.setAttribute('color', new THREE.BufferAttribute(G.col, 3, true)); g.setIndex(new THREE.BufferAttribute(G.idx, 1)); g.computeBoundingSphere(); return g; }
function build() {
  if (GEO) return GEO;
  GEO = {
    body: geo(mesh(body, [-80, 30, -150], [80, 175, 110], 4, 0.12)),
    head: geo(mesh(head, [-60, -50, -40], [60, 70, 115], 3, 0.1)),
    plates: [0, 1, 2, 3].map((i) => geo(mesh(plate(i), [-80, 40, 56 - i * 44 - 60], [80, 200, 56 - i * 44 + 40], 3.5, 0.1))),
    legF: geo(mesh(leg(true), [-30, -90, -30], [30, 10, 30], 3, 0.1)), legB: geo(mesh(leg(false), [-30, -90, -30], [30, 10, 30], 3, 0.1)),
  };
  return GEO;
}
const HIPS = [[-34, 76, 52, 1], [34, 76, 52, 1], [-34, 74, -64, 0], [34, 74, -64, 0]];
export class IronhideRig {
  constructor(scene) {
    const G = build(), mat = toonMaterial({ vcol: true }); this.mat = mat;
    this.root = new THREE.Group(); this.root.matrixAutoUpdate = false; scene.add(this.root);
    const M = (g) => { const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m; };
    this.body = M(G.body); this.root.add(this.body);
    this.head = new THREE.Group(); this.head.position.set(0, 104, 92); this.head.add(M(G.head)); this.root.add(this.head);
    this.plates = G.plates.map((g) => { const m = M(g); this.root.add(m); return m; });
    this.legs = HIPS.map(([x, y, z, f]) => { const g = new THREE.Group(); g.position.set(x, y, z); g.add(M(f ? G.legF : G.legB)); this.root.add(g); return g; });
    this.fly = []; this.seen = 0;
  }
  // P: the Body3D it stands in for (its walk cycle, wind-up, lunge, tint, plates left); R: its root matrix
  pose(P, R, k) {
    this.root.visible = true; this.seen = 2;
    this.root.matrix.copy(R).multiply(new THREE.Matrix4().makeScale(k, k, k)); this.root.matrixWorldNeedsUpdate = true;
    const sw = Math.sin(P.walk || 0), st = Math.min(1.2, P.stride || 0), T = P.time || 0;
    this.legs.forEach((L, i) => { const s = (i === 0 || i === 3) ? 1 : -1; L.rotation.x = s * sw * 0.55 * Math.min(st, 1.1) - (i < 2 ? (P.lunge || 0) * 0.6 : 0); });
    this.head.rotation.x = -0.14 - (P.windup || 0) * 0.35 + (P.lunge || 0) * 0.3 + Math.sin(T * 1.6) * 0.04; this.head.rotation.y = Math.sin(T * 0.7) * 0.08;
    const n = P.plates === undefined ? 4 : P.plates;
    this.plates.forEach((m, i) => { m.visible = i < n; });
    if (n < this.lastN && this.lastN !== undefined) { /* the one that just came off */ }
    this.lastN = n;
    const t = P.tint || [1, 1, 1], fl = P.flashT > 0 ? 1.6 : 1; this.mat.uniforms.uColor.value.setRGB(t[0] * fl, t[1] * fl, t[2] * fl);
  }
  frame() { if (this.seen > 0) this.seen--; else this.root.visible = false; }
  dispose(scene) { scene.remove(this.root); }
}
