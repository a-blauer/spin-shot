// What an Armored Blight grows: bark. Not strapped-on plates but the fungus hardening over itself, the way bracket
// fungus shingles a dead trunk: flat round plates zoned in rings (dark heart, paler bands, a cream rim) laid on the
// body's own surface, and shelves standing out from the shoulders. Sculpted once at run time (sdf.js), then placed on
// each creature's actual mesh: anchors are picked from its vertices (facing out, well spread), so the bark fits a
// Rotcap's barrel chest, a Rat's back or a Puffball's sphere alike.
import * as THREE from 'three';
import { C, U, H, S, reset, sph, ell, cap, torus, fbm, mesh, wants, getCol, setCol, getD } from './sdf.js';

const SH_SEAM = C(0x140e0a), SH_A = C(0x3a3029), SH_B = C(0x463a2e), SH_C = C(0x2f2924), SH_RIM = C(0xa88a5c), SH_LIP = C(0x8c7552);
const BARK = C(0x2a1d14), BARK2 = C(0x3a2a1c), BAND = C(0x4a3624), BAND2 = C(0x5c442c), RIM = C(0x9c8058), GILL = C(0x8a7658);
const len2 = (x, y) => Math.sqrt(x * x + y * y);

// a plate: radius 10, lying on the surface with its face along +z (its underside at z about -1)
function plate(p) {
  reset();
  U(ell(p, [0, 0, 0.2], [10, 7.2, 2.0]), BARK2, 1.0);
  S(ell(p, [0, 0, -3.2], [11, 8.2, 3.0]), 0.8);                  // a flat back, so it sits on the body and does not stick out behind
  if (wants()) {   // faint growth zones (a scale, not a target): dark heart, a little lighter outward, a thin pale lip
    const r = len2(p[0] / 10, p[1] / 7.2), n = fbm(p[0] * 0.35, p[1] * 0.35, p[2] * 0.35) * 0.08;
    const z = r + n; setCol(z > 0.92 ? RIM : z > 0.76 ? BAND2 : z > 0.5 ? BAND : BARK2);
  }
  return getD();
}
// a shelf: a bracket standing out from the surface. Its root is at the origin, it grows out along +z, its top is +y.
// Three tiers, the biggest in the middle; pale gills underneath, a cream lip.
const TIERS = [[0, 0.6, 5.6, 10, 2.3, 6.4], [0.6, 3.4, 4.0, 7.2, 1.8, 4.6], [-0.5, -2.4, 4.4, 7.8, 1.7, 4.8]];
function shelf(p) {
  reset();
  for (const [x, y, z, rx, ry, rz] of TIERS) U(ell(p, [x, y, z], [rx, ry, rz]), BARK2, 0.9);
  U(ell(p, [0, 0.4, 0.6], [6.5, 6.2, 2.6]), BARK, 1.6);           // the knot it grows out of
  S(sph(p, [0, 0, -14], 13.5), 0.8);                              // cut flat behind
  if (wants()) {
    let best = null, bd = 1e9; for (const T of TIERS) { const d = ell(p, [T[0], T[1], T[2]], [T[3], T[4], T[5]]); if (d < bd) { bd = d; best = T; } }
    const [x, y, z, rx, ry, rz] = best, r = len2((p[0] - x) / rx, (p[2] - z) / rz), under = p[1] < y - ry * 0.25;
    const n = fbm(p[0] * 0.4, p[1] * 0.4, p[2] * 0.4) * 0.05;
    setCol(under ? GILL : r + n > 0.84 ? RIM : r + n > 0.66 ? BAND2 : r + n > 0.45 ? BAND : BARK2);
  }
  return getD();
}

let GEO = null;
function toGeo(G) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(G.pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(G.nor, 3, true)); g.setAttribute('color', new THREE.BufferAttribute(G.col, 3, true)); g.setIndex(new THREE.BufferAttribute(G.idx, 1)); return g; }
export function gearGeos() {
  if (GEO) return GEO;
  GEO = { plate: toGeo(mesh(plate, [-12, -10.5, -2], [12, 10.5, 4.5], 0.55, 0.15)), shelf: toGeo(mesh(shelf, [-11, -5, -1.5], [11, 6.5, 12.5], 0.5, 0.15)) };
  return GEO;
}

// ---- where the bark goes on one part of one kind of creature: [{ type, m }] in the part's own frame
const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _f = new THREE.Vector3(0, 0, 1);
function frame(pos, nor, size, type, lift, tilt = 0) {
  _z.copy(nor).normalize();
  _y.copy(_up).addScaledVector(_z, -_up.dot(_z)); if (_y.lengthSq() < 0.04) _y.copy(_f).addScaledVector(_z, -_f.dot(_z)); _y.normalize();
  _x.crossVectors(_y, _z);
  const m = new THREE.Matrix4().makeBasis(_x, _y, _z); m.scale(new THREE.Vector3(size, size, size));
  if (tilt) m.multiply(new THREE.Matrix4().makeRotationX(tilt));   // shingled: the lower edge stands a little proud
  m.setPosition(pos.clone().addScaledVector(_z, lift * size));
  return { type, m };
}
// spread picks: the best-scoring candidate first, then always the one furthest from those already picked
function spread(cands, n, minGap) {
  const out = []; if (!cands.length) return out;
  cands.sort((a, b) => b.s - a.s); out.push(cands[0]);
  while (out.length < n) {
    let best = null, bd = -1;
    for (const c of cands) { let d = 1e9; for (const o of out) d = Math.min(d, c.p.distanceTo(o.p)); if (d > bd) { bd = d; best = c; } }
    if (!best || bd < minGap) break; out.push(best);
  }
  return out;
}
// role: the part's role; side: +1 / -1 for an arm on the right / left; beast: four-footed
export function armorAnchors(geo, role, side, beast) {
  if (!geo.attributes.normal) geo.computeVertexNormals();
  geo.computeBoundingBox(); const b = geo.boundingBox, W = b.max.x - b.min.x, Hh = b.max.y - b.min.y, Dd = b.max.z - b.min.z;
  const P = geo.attributes.position, N = geo.attributes.normal, cands = [];
  const p = new THREE.Vector3(), n = new THREE.Vector3();
  const step = Math.max(1, Math.floor(P.count / 1500));
  const isArm = role === 'ArmFront' || role === 'ArmBack', isBody = role === 'Body';
  if (!isArm && !isBody) return [];
  for (let i = 0; i < P.count; i += step) {
    p.fromBufferAttribute(P, i); n.fromBufferAttribute(N, i).normalize();
    const v = (p.y - b.min.y) / Math.max(1, Hh);
    let s = -1;
    if (isBody && beast) { if (n.y > 0.55 && v > 0.55) s = n.y + v * 0.3; }                                // a beast: plates along the back
    else if (isBody) { if (n.z > 0.45 && v > 0.32 && v < 0.9) s = n.z + (1 - Math.abs(v - 0.62) * 2) * 0.4 - Math.abs(p.x) / Math.max(1, W) * 0.3; }   // a chest: front, upper middle
    else if (isArm) { if (v > 0.72 && n.x * side > 0.2 + (n.y > 0.5 ? -0.4 : 0)) s = v + n.x * side * 0.5; } // a shoulder: the top, facing out
    if (s > 0) cands.push({ p: p.clone(), n: n.clone(), s });
  }
  const out = [];
  if (isBody) {
    // shingles: a dozen small scales close enough to overlap, over the chest (or along a beast's back)
    const size = Math.max(4, Math.min(20, Math.min(W, Hh) * 0.15)), picks = spread(cands, beast ? 10 : 12, size * 0.95);
    for (const c of picks) out.push(frame(c.p, c.n, size / 10 * (0.9 + (c.s * 7 % 1) * 0.25), 'plate', 0.0, beast ? 0.2 : -0.3));
  } else {
    const size = Math.max(5, Math.min(22, W * 0.62)), picks = spread(cands, 1, 0);
    for (const c of picks) { const o = c.n.clone(); o.y = Math.max(o.y, 0.15); o.x = side * Math.max(Math.abs(o.x), 0.6); out.push(frame(c.p, o, size / 10, 'shelf', -0.1)); }
    // and one plate a little lower on the outside of the upper arm
    const low = cands.filter((c) => (c.p.y - b.min.y) / Math.max(1, Hh) < 0.86).sort((a, b2) => b2.n.x * side - a.n.x * side)[0];
    if (low) out.push(frame(low.p, low.n, Math.max(4, W * 0.42) / 10, 'plate', 0.05));
  }
  return out;
}


// ---- the carapace: the part's own surface, lifted a little off it and kept only where armour grows, coloured as bark
// split into plates (a jittered cell pattern) with dark seams between them and a paler lip where the bark ends.
const h3 = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 1274126177) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
export function barkShell(geo, role, side, beast) {
  const isArm = role === 'ArmFront' || role === 'ArmBack', isBody = role === 'Body';
  if (!isArm && !isBody) return null;
  if (!geo.attributes.normal) geo.computeVertexNormals();
  geo.computeBoundingBox(); const b = geo.boundingBox, W = b.max.x - b.min.x, Hh = b.max.y - b.min.y, Dd = b.max.z - b.min.z;
  const P = geo.attributes.position, N = geo.attributes.normal, n = P.count;
  // smooth normals by position (the bake splits vertices along paint borders), so the lifted shell does not crack open
  const key = (i) => `${Math.round(P.getX(i) * 4)},${Math.round(P.getY(i) * 4)},${Math.round(P.getZ(i) * 4)}`;
  const acc = new Map(); for (let i = 0; i < n; i++) { const k = key(i); let a = acc.get(k); if (!a) acc.set(k, a = [0, 0, 0]); a[0] += N.getX(i); a[1] += N.getY(i); a[2] += N.getZ(i); }
  const t = Math.max(1.2, Math.min(W, Hh) * 0.035), cell = Math.max(6, Math.min(W, Hh) * 0.28);
  // where the bark grows: 0 none .. 1 full; the edge of it is soft so the lip can be told apart
  const grow = (x, y, z, nx, ny, nz) => {
    const v = (y - b.min.y) / Math.max(1, Hh);
    if (beast && isBody) return Math.min(1, Math.max(0, (ny + 0.15) * 2.2)) * Math.min(1, Math.max(0, (v - 0.4) * 4));
    if (isBody) return Math.min(1, Math.max(0, (v - 0.36) * 5)) * Math.min(1, Math.max(0, (0.97 - v) * 8)) * (face ? 1 : Math.min(1, Math.max(0, (nz + 0.35) * 2.5)));   // a face on the body: bark all round it instead
    return Math.min(1, Math.max(0, (v - 0.62) * 5)) * Math.min(1, Math.max(0, (nx * side + ny + 0.3) * 2));   // an arm: a shoulder cap
  };
  // keep clear of the face: anything near a glowing eye or maw stays bare
  const AW = geo.attributes.aW, glow = [];
  if (AW) for (let i = 0; i < n; i += 2) if (AW.getZ(i) > 0.25) glow.push(P.getX(i), P.getY(i), P.getZ(i));
  const clear = Math.max(8, Math.min(W, Hh) * 0.13), face = glow.length > 0;
  const nearGlow = (x, y, z) => { for (let j = 0; j < glow.length; j += 3) { const dx = x - glow[j], dy = y - glow[j + 1], dz = z - glow[j + 2]; if (dx * dx + dy * dy + dz * dz < clear * clear) return true; } return false; };
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), keep = new Uint8Array(n), g = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = acc.get(key(i)), L = Math.hypot(a[0], a[1], a[2]) || 1, nx = a[0] / L, ny = a[1] / L, nz = a[2] / L;
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), w = nearGlow(x, y, z) ? 0 : grow(x, y, z, nx, ny, nz); g[i] = w; keep[i] = w > 0.5 ? 1 : 0;
    // plates: the nearest and next-nearest of a jittered lattice of cell centres; near the border between two, a seam
    const cx = Math.floor(x / cell), cy = Math.floor(y / cell), cz = Math.floor(z / cell); let d1 = 1e9, d2 = 1e9, id = 0;
    for (let a2 = -1; a2 <= 1; a2++) for (let b2 = -1; b2 <= 1; b2++) for (let c2 = -1; c2 <= 1; c2++) {
      const X = cx + a2, Y = cy + b2, Z = cz + c2, px = (X + h3(X, Y, Z)) * cell, py = (Y + h3(Y, Z, X)) * cell, pz = (Z + h3(Z, X, Y)) * cell, d = Math.hypot(x - px, y - py, z - pz);
      if (d < d1) { d2 = d1; d1 = d; id = h3(X, Z, Y); } else if (d < d2) d2 = d;
    }
    const e = (d2 - d1) / cell, seam = e < 0.07, edge = e < 0.16, lip = w < 0.7;
    // each plate stands at its own height, swelling toward its middle, so the plates read as separate scales
    const lift = t * (seam ? 0.55 : (0.85 + 0.5 * id) * (edge ? 0.8 + e : 1));
    pos[i * 3] = x + nx * lift; pos[i * 3 + 1] = y + ny * lift; pos[i * 3 + 2] = z + nz * lift; nor[i * 3] = nx; nor[i * 3 + 1] = ny; nor[i * 3 + 2] = nz;
    const base = id < 0.33 ? SH_A : id < 0.66 ? SH_B : SH_C, c = seam ? SH_SEAM : lip ? SH_LIP : edge ? SH_RIM : base;
    const k = 0.9 + 0.2 * fbm(x * 0.08, y * 0.08, z * 0.08);
    col[i * 3] = c[0] * k; col[i * 3 + 1] = c[1] * k; col[i * 3 + 2] = c[2] * k;
  }
  const src = geo.index ? geo.index.array : null, tri = src ? src.length / 3 : n / 3, idx = [];
  for (let f = 0; f < tri; f++) { const a = src ? src[f * 3] : f * 3, b2 = src ? src[f * 3 + 1] : f * 3 + 1, c = src ? src[f * 3 + 2] : f * 3 + 2; if (keep[a] && keep[b2] && keep[c]) idx.push(a, b2, c); }
  if (idx.length < 9) return null;
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setIndex(idx); return out;
}
