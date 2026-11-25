// Third-person player characters: chunky flat-shaded figures built from primitives in the game's palette, assembled
// from the cosmetic pieces in cosmetics.js. Origin at the feet, facing +Z, about 180 units tall.
import * as THREE from 'three';
import { toonMaterial } from './render.js';
import { cosItem, shapeOf } from './cosmetics.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const mats = new Map();
function mat(c, glow = 0) { const k = c + ':' + glow; if (!mats.has(k)) { const m = toonMaterial({ glow }); m.uniforms.uColor.value.setHex(c); mats.set(k, m); } return mats.get(k); }
const G = { dome: new THREE.SphereGeometry(0.5, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2), box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 14), cone: new THREE.ConeGeometry(0.5, 1, 14), ball: new THREE.SphereGeometry(0.5, 14, 10), tor: new THREE.TorusGeometry(0.5, 0.09, 6, 18) };
const geo = new Map();
function taper(top, bot) { const k = top + '/' + bot; if (!geo.has(k)) geo.set(k, new THREE.CylinderGeometry(top, bot, 1, 14)); return geo.get(k); }
function add(p, g, c, sx, sy, sz, x = 0, y = 0, z = 0, glow = 0) { const m = new THREE.Mesh(g, mat(c, glow)); m.scale.set(sx, sy, sz); m.position.set(x, y, z); p.add(m); return m; }
// a box with its edges taken off: heads, hands, boots and anything else that should not look like a crate
function rbox(p, c, w, h, d, x = 0, y = 0, z = 0, r = 4, glow = 0) { w = Math.round(w * 2) / 2; h = Math.round(h * 2) / 2; d = Math.round(d * 2) / 2; r = Math.round(r * 10) / 10; const k = `r${w}/${h}/${d}/${r}`; if (!geo.has(k)) geo.set(k, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 0.1, h / 2 - 0.1, d / 2 - 0.1))); const m = new THREE.Mesh(geo.get(k), mat(c, glow)); m.position.set(x, y, z); p.add(m); return m; }
// A smooth body swept down a curve: an oval section at every point (a across `ref`, b the other way), closed off round
// at both ends. Noses, beards, locks and moustaches are made of these, so they read as one sculpted shape, not a pile of balls.
function sweep(p, c, pts, rads, o = {}) {
  const key = 'sw' + JSON.stringify([pts.map((q) => q.map((v) => Math.round(v * 10) / 10)), rads.map((q) => q.map((v) => Math.round(v * 10) / 10)), o.ref || 0, o.cap || 0]);
  if (!geo.has(key)) {
    const N = 30, S = 16, V = (q) => new THREE.Vector3(q[0], q[1], q[2]), curve = new THREE.CatmullRomCurve3(pts.map(V), false, 'catmullrom', 0.5);
    const rc = new THREE.CatmullRomCurve3(rads.map((r, i) => new THREE.Vector3(r[0], r[1], i)), false, 'catmullrom', 0.5);
    const ref = V(o.ref || [1, 0, 0]), len = curve.getLength(), cap = o.cap || [1, 1];
    const c0 = Math.min(0.45, (cap[0] * Math.min(rads[0][0], rads[0][1])) / len), c1 = Math.min(0.45, (cap[1] * Math.min(rads[rads.length - 1][0], rads[rads.length - 1][1])) / len);
    const pos = [], idx = [], P = new THREE.Vector3(), T = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), R = new THREE.Vector3();
    for (let i = 0; i <= N; i++) {
      const t = i / N; curve.getPoint(t, P); curve.getTangent(t, T); rc.getPoint(t, R);
      A.copy(ref).addScaledVector(T, -ref.dot(T)); if (A.lengthSq() < 1e-6) A.set(0, 0, 1).addScaledVector(T, -T.z); A.normalize(); B.crossVectors(T, A);
      const e = t < c0 ? Math.sqrt(Math.max(0, 1 - ((c0 - t) / c0) ** 2)) : t > 1 - c1 ? Math.sqrt(Math.max(0, 1 - ((t - 1 + c1) / c1) ** 2)) : 1, a = Math.max(0.05, R.x) * e, b = Math.max(0.05, R.y) * e;
      for (let j = 0; j < S; j++) { const th = (j / S) * Math.PI * 2, ca = Math.cos(th) * a, sb = Math.sin(th) * b; pos.push(P.x + A.x * ca + B.x * sb, P.y + A.y * ca + B.y * sb, P.z + A.z * ca + B.z * sb); }
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < S; j++) { const a = i * S + j, b = i * S + ((j + 1) % S), c2 = a + S, d = b + S; idx.push(a, b, c2, b, d, c2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); geo.set(key, g);
  }
  const m = new THREE.Mesh(geo.get(key), mat(c)); p.add(m); return m;
}
// the same toon material, shaded per vertex as well (the grooves between locks of hair)
function matV(c) { const k = 'v' + c; if (!mats.has(k)) { const m = toonMaterial({}); m.uniforms.uColor.value.setHex(c); m.vertexColors = true; mats.set(k, m); } return mats.get(k); }
// A shell laid over the body: F(u, v) gives, for u across (-1..1) and v down (0..1), a point on the surface under it, that
// surface's outward direction, how thick the shell stands there and how light it is. The thickness is zero all round the
// edge, so the front and a shallow back meet and close into one solid piece. Beards and hair are made this way: one
// carved piece each, its locks cut into the thickness and darkened in the grooves.
function shell(p, c, key, nu, nv, F) {
  if (!geo.has(key)) {
    const pos = [], col = [], idx = [], row = nu + 1, front = [];
    for (const side of [1, -1]) {
      const off = pos.length / 3;
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
        const f = F(-1 + (2 * i) / nu, j / nv), t = side > 0 ? f[6] : -f[6] * 0.5;
        pos.push(f[0] + f[3] * t, f[1] + f[4] * t, f[2] + f[5] * t); if (c === null) { const q = new THREE.Color(f[7]); col.push(q.r, q.g, q.b); } else col.push(f[7], f[7], f[7]); if (side > 0) front.push([f[0] + f[3] * t, f[1] + f[4] * t, f[2] + f[5] * t]);
      }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = off + j * row + i, b = a + 1, c2 = a + row, d = c2 + 1; if (side > 0) idx.push(a, c2, b, b, c2, d); else idx.push(a, b, c2, b, d, c2); }
    }
    // wind the front so it faces out along the surface's outward direction (checked once, in the middle)
    const m = (Math.floor(nv / 2) * row + Math.floor(nu / 2)) * 3, A = new THREE.Vector3(...pos.slice(m, m + 3)), B = new THREE.Vector3(...pos.slice(m + row * 3, m + row * 3 + 3)), Cc = new THREE.Vector3(...pos.slice(m + 3, m + 6));
    const fm = F(-1 + (2 * Math.floor(nu / 2)) / nu, Math.floor(nv / 2) / nv), n = new THREE.Vector3().subVectors(B, A).cross(new THREE.Vector3().subVectors(Cc, A));
    if (n.dot(new THREE.Vector3(fm[3], fm[4], fm[5])) < 0) for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    g.userData.front = front; geo.set(key, g);
  }
  const g = geo.get(key), m = new THREE.Mesh(g, matV(c === null ? 0xffffff : c)); p.add(m); return g.userData.front;
}
// Soft cloth swept up a smooth spine: a hat's crown or a jester's horn. Round in section (a little narrower front to back),
// closed round at the tip, open at the base (the brim or the head covers it). Colour is painted per vertex, with a pair of
// rings at every colour edge so stripes and dipped tips are clean, and the cloth creases on the inside of every bend.
function clothTube(p, key, spine, radAt, colAt, edges = [], mod = null, closeTip = true) {
  if (!geo.has(key)) {
    const curve = new THREE.CatmullRomCurve3(spine.map((q) => new THREE.Vector3(q[0], q[1], q[2])), false, 'centripetal'), L = curve.getLength(), S = 30;
    const ss = []; for (let i = 0; i <= 80; i++) ss.push(i / 80); for (const e of edges) if (e > 0.01 && e < 0.99) ss.push(e - 0.0006, e + 0.0006); ss.sort((a, b) => a - b);
    const F = ss.map((s) => ({ s, P: curve.getPointAt(s), T: curve.getTangentAt(s) }));
    let N = new THREE.Vector3(1, 0, 0);
    for (const f of F) { N = N.clone().addScaledVector(f.T, -N.dot(f.T)).normalize(); f.N = N; f.B = new THREE.Vector3().crossVectors(f.T, N); }
    F.forEach((f, i) => { const a = F[Math.max(0, i - 2)], b = F[Math.min(F.length - 1, i + 2)]; f.K = new THREE.Vector3().subVectors(b.T, a.T).divideScalar(Math.max(1e-3, (b.s - a.s) * L)); });
    const tipS = closeTip ? Math.min(0.3, (radAt(1) * 1.2) / L) : 0, pos = [], col = [], idx = [], C = new THREE.Color(), d = new THREE.Vector3();
    for (const f of F) {
      const e = tipS && f.s > 1 - tipS ? Math.sqrt(Math.max(0, 1 - ((f.s - 1 + tipS) / tipS) ** 2)) : 1, r = radAt(f.s) * e, k = f.K.length(), kn = k > 1e-4 ? f.K.clone().divideScalar(k) : null;
      for (let j = 0; j < S; j++) {
        const ph = (j / S) * Math.PI * 2, c = Math.cos(ph), sn = Math.sin(ph); d.copy(f.N).multiplyScalar(c).addScaledVector(f.B, sn);
        const crease = Math.pow(kn ? Math.max(0, d.dot(kn)) : 0, 1.5) * Math.min(1, k * 22) * Math.pow(0.5 + 0.5 * Math.cos((f.s * L * Math.PI * 2) / 13 + 1), 2), rr = r * (1 - 0.09 * crease + 0.014 * Math.sin(4 * ph + f.s * 6)) * (mod ? mod(f.s, ph) : 1);   // a few soft folds where it bends
        pos.push(f.P.x + (f.N.x * c + f.B.x * sn * 0.92) * rr, f.P.y + (f.N.y * c + f.B.y * sn * 0.92) * rr, f.P.z + (f.N.z * c + f.B.z * sn * 0.92) * rr);
        C.set(colAt(f.s, ph)).multiplyScalar((1 - 0.28 * crease) * (mod ? Math.min(1, 0.5 + 0.5 * mod(f.s, ph) ** 6) : 1)); col.push(C.r, C.g, C.b);
      }
    }
    for (let i = 0; i < F.length - 1; i++) for (let j = 0; j < S; j++) { const a = i * S + j, b = i * S + ((j + 1) % S), c2 = a + S, dd = b + S; idx.push(a, b, c2, b, dd, c2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
    // wind it to face out: check one face low on the crown against the way out from the spine
    { const m = 6 * S, A = new THREE.Vector3().fromArray(pos, m * 3), Bv = new THREE.Vector3().fromArray(pos, (m + 1) * 3), Cv = new THREE.Vector3().fromArray(pos, (m + S) * 3);
      if (new THREE.Vector3().subVectors(Bv, A).cross(new THREE.Vector3().subVectors(Cv, A)).dot(new THREE.Vector3().subVectors(A, F[6].P)) < 0) for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; } g.setIndex(idx); }
    g.computeVertexNormals(); g.userData.F = F; g.userData.L = L; geo.set(key, g);
  }
  const g = geo.get(key), F = g.userData.F, L = g.userData.L; p.add(new THREE.Mesh(g, matV(0xffffff)));
  // a point on the cloth at s up it, on the side facing `dir`, and the way out there: for things sewn or pinned onto it
  const surf = (s, dir) => { let f = F[0]; for (const q of F) if (Math.abs(q.s - s) < Math.abs(f.s - s)) f = q; const ph = Math.atan2(f.B.dot(dir), f.N.dot(dir)), c = Math.cos(ph), sn = Math.sin(ph), r = radAt(f.s);
    const o = f.N.clone().multiplyScalar(c).addScaledVector(f.B, sn * 0.92); const slope = (radAt(Math.min(1, f.s + 0.01)) - radAt(Math.max(0, f.s - 0.01))) / (0.02 * L);   // the crown narrows as it rises, so the cloth faces a little upward
    return { p: f.P.clone().addScaledVector(o, r), n: f.N.clone().multiplyScalar(c).addScaledVector(f.B, sn / 0.92).normalize().addScaledVector(f.T, -slope).normalize() }; };
  return { p: F[F.length - 1].P.clone(), surf };
}
// An oval-sectioned body swept along a smooth spine (a foot: ankle to toe), its sections a across and b the other way,
// cut flat at `floor` so it stands on its sole; closed round at the toe (tip says how round). colAt(s, point) colours it.
function sweepAB(p, key, spine, abAt, colAt, floor = -1e9, tip = 1) {
  if (!geo.has(key)) {
    const curve = new THREE.CatmullRomCurve3(spine.map((q) => new THREE.Vector3(q[0], q[1], q[2])), false, 'centripetal'), L = curve.getLength(), M = 48, S = 28;
    const [a1, b1] = abAt(1), tipS = Math.min(0.35, (Math.min(a1, b1) * tip) / L), pos = [], col = [], idx = [], C = new THREE.Color();
    let N = new THREE.Vector3(1, 0, 0);
    for (let i = 0; i <= M; i++) {
      const t = i / M, P = curve.getPointAt(t), T = curve.getTangentAt(t); N = N.clone().addScaledVector(T, -N.dot(T)).normalize(); const B = new THREE.Vector3().crossVectors(T, N);
      const e = t > 1 - tipS ? Math.sqrt(Math.max(0, 1 - ((t - 1 + tipS) / tipS) ** 2)) : 1, [a, b] = abAt(t);
      for (let j = 0; j < S; j++) { const ph = (j / S) * Math.PI * 2, q = P.clone().addScaledVector(N, Math.cos(ph) * a * e).addScaledVector(B, Math.sin(ph) * b * e); q.y = Math.max(q.y, floor); pos.push(q.x, q.y, q.z); C.set(colAt(t, q)); col.push(C.r, C.g, C.b); }
    }
    for (let i = 0; i < M; i++) for (let j = 0; j < S; j++) { const a = i * S + j, b = i * S + ((j + 1) % S), c2 = a + S, d = b + S; idx.push(a, b, c2, b, d, c2); }
    { const m = 20 * S, A = new THREE.Vector3().fromArray(pos, m * 3), Bv = new THREE.Vector3().fromArray(pos, (m + 1) * 3), Cv = new THREE.Vector3().fromArray(pos, (m + S) * 3), mid = curve.getPointAt(20 / M);
      if (new THREE.Vector3().subVectors(Bv, A).cross(new THREE.Vector3().subVectors(Cv, A)).dot(new THREE.Vector3().subVectors(A, mid)) < 0) for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); geo.set(key, g);
  }
  p.add(new THREE.Mesh(geo.get(key), matV(0xffffff)));
}
// A ring of cloth turned round the hat's axis from a profile [[r, y], ...]: brims, cuffs, a beanie. closed: the profile is a
// loop (a cuff with thickness); mod(t, ph) nudges [r, y] at each point (waves in a brim, knit ribs), colAt(t, ph) colours it.
function clothRing(p, key, P, closed, colAt, mod = () => [0, 0]) {
  if (!geo.has(key)) {
    const S = 48, n = P.length, pos = [], col = [], idx = [], C = new THREE.Color();
    for (let i = 0; i < n; i++) for (let j = 0; j < S; j++) { const ph = (j / S) * Math.PI * 2, t = i / (closed ? n : n - 1), [dr, dy] = mod(t, ph, i), r = P[i][0] + dr; pos.push(Math.sin(ph) * r, P[i][1] + dy, Math.cos(ph) * r * 0.92); C.set(colAt(t, ph, i)); col.push(C.r, C.g, C.b); }
    for (let i = 0; i < (closed ? n : n - 1); i++) for (let j = 0; j < S; j++) { const a = i * S + j, b = i * S + ((j + 1) % S), c2 = ((i + 1) % n) * S + j, d = ((i + 1) % n) * S + ((j + 1) % S); idx.push(a, b, c2, b, d, c2); }
    // face out: the outermost ring's faces should point away from the axis
    let im = 0; for (let i = 0; i < n; i++) if (P[i][0] > P[im][0]) im = i;
    { const ia = closed ? im : Math.min(im, n - 2), a = ia * S, A = new THREE.Vector3().fromArray(pos, a * 3), Bv = new THREE.Vector3().fromArray(pos, (a + 1) * 3), Cv = new THREE.Vector3().fromArray(pos, (((ia + 1) % n) * S) * 3);
      if (new THREE.Vector3().subVectors(Bv, A).cross(new THREE.Vector3().subVectors(Cv, A)).dot(new THREE.Vector3(A.x, 0, A.z)) < 0) for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); geo.set(key, g);
  }
  p.add(new THREE.Mesh(geo.get(key), matV(0xffffff)));
}
// a profile [[t, value], ...] read at t, smoothly
function prof(P, t) { t = Math.max(P[0][0], Math.min(P[P.length - 1][0], t)); for (let i = 1; i < P.length; i++) if (t <= P[i][0]) { const f = (t - P[i - 1][0]) / (P[i][0] - P[i - 1][0] || 1), k = f * f * (3 - 2 * f); return P[i - 1][1] + (P[i][1] - P[i - 1][1]) * k; } return P[P.length - 1][1]; }
// a smooth curve through [[t, value], ...] (cubic, so a profile has no flat steps at its knots)
function cprof(P, t) {
  if (t <= P[0][0]) return P[0][1]; if (t >= P[P.length - 1][0]) return P[P.length - 1][1];
  let i = 1; while (t > P[i][0]) i++;
  const t0 = P[i - 1][0], t1 = P[i][0], h = t1 - t0, f = (t - t0) / h, m = (k) => (k <= 0 ? (P[1][1] - P[0][1]) / (P[1][0] - P[0][0]) : k >= P.length - 1 ? (P[k][1] - P[k - 1][1]) / (P[k][0] - P[k - 1][0]) : (P[k + 1][1] - P[k - 1][1]) / (P[k + 1][0] - P[k - 1][0]));
  const f2 = f * f, f3 = f2 * f; return (2 * f3 - 3 * f2 + 1) * P[i - 1][1] + (f3 - 2 * f2 + f) * h * m(i - 1) + (-2 * f3 + 3 * f2) * P[i][1] + (f3 - f2) * h * m(i);
}
// A surface all the way round an upright axis: rows at heights ys (bottom to top), S points round each, pt(ph, y) where
// each sits (ph 0 is the front), colAt(ph, y) its colour. A pair of rows at the same height gives a clean colour edge.
function wrapSurf(p, key, ys, S, pt, colAt) {
  if (!geo.has(key)) {
    const pos = [], col = [], idx = [], C = new THREE.Color();
    for (const y of ys) for (let j = 0; j < S; j++) { const ph = (j / S) * Math.PI * 2, q = pt(ph, y); pos.push(q[0], q[1], q[2]); C.set(colAt(ph, q[1], y)); col.push(C.r, C.g, C.b); }
    for (let i = 0; i < ys.length - 1; i++) for (let j = 0; j < S; j++) { const a = i * S + j, b = i * S + ((j + 1) % S), c2 = a + S, d = b + S; idx.push(a, c2, b, b, c2, d); }
    { const m = Math.floor(ys.length / 2) * S + 2, A = new THREE.Vector3().fromArray(pos, m * 3), Bv = new THREE.Vector3().fromArray(pos, (m + S) * 3), Cv = new THREE.Vector3().fromArray(pos, (m + 1) * 3);
      if (new THREE.Vector3().subVectors(Bv, A).cross(new THREE.Vector3().subVectors(Cv, A)).dot(new THREE.Vector3(A.x, 0, A.z)) < 0) for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); geo.set(key, g);
  }
  p.add(new THREE.Mesh(geo.get(key), matV(0xffffff)));
}
// rows from a to b about `step` apart, with a doubled row at each height in `edges` (for clean colour edges)
function rowsOf(a, b, step, edges = []) { const n = Math.max(2, Math.round((b - a) / step)), ys = []; for (let i = 0; i <= n; i++) ys.push(a + ((b - a) * i) / n); for (const e of edges) if (e > a && e < b) ys.push(e - 0.05, e + 0.05); return ys.sort((x, y) => x - y); }
// The torso every outfit is cut to, in the body's frame: sections between an oval and a rounded square, from the hips to the neck.
const TPROF = [[0, 25.6, 18.4], [10, 26, 18.6], [24, 27.2, 19.4], [38, 29, 20.2], [47, 31.4, 20.6], [53, 32.4, 19.8], [57.5, 29.6, 18], [60.5, 22, 15], [63, 13, 11.8]];
const TA = TPROF.map((q) => [q[0], q[1]]), TBD = TPROF.map((q) => [q[0], q[2]]), SUP = 2.6;
function torsoAt(ph, y, lift = 0) {   // the point at angle ph (0 the front, rising to the wearer's left) and height y, and the way out there
  const P = (h, yy) => { const a = cprof(TA, yy), b = cprof(TBD, yy), sn = Math.sin(h), c = Math.cos(h); return new THREE.Vector3(a * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / SUP), yy, b * Math.sign(c) * Math.pow(Math.abs(c), 2 / SUP)); };
  const p0 = P(ph, y), n = new THREE.Vector3().subVectors(P(ph + 0.004, y), P(ph - 0.004, y)).cross(new THREE.Vector3().subVectors(P(ph, y + 0.2), P(ph, y - 0.2))).normalize();
  if (n.dot(new THREE.Vector3(p0.x, 0, p0.z)) < 0) n.negate(); return [p0.addScaledVector(n, lift), n];
}
// the angle round the torso at which it reaches x across, at height y (front half)
function torsoPh(x, y) { const a = cprof(TA, y); return Math.asin(Math.min(1, Math.pow(Math.min(1, Math.abs(x) / a), SUP / 2))) * Math.sign(x); }
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// the head under the hat: an egg 42 x 38 x 38 centred 15 up. A point on it at angle th round from the front and height y, with its outward direction.
function headPt(th, y, lift = 0) {
  const sy = Math.max(0.3, Math.sqrt(Math.max(0, 1 - ((y - 15) / 19) ** 2))), x = 21 * sy * Math.sin(th), z = 19 * sy * Math.cos(th);
  const n = new THREE.Vector3(x / 441, (y - 15) / 361, z / 361).normalize(); return [x + n.x * lift, y + n.y * lift, z + n.z * lift, n.x, n.y, n.z];
}
const shade = (c, k) => { const o = new THREE.Color(c); o.multiplyScalar(k); return o.getHex(); };
const mix = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k).getHex();
export const charMat = mat, charShade = shade, charMix = mix;
const grp = (p, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); return g; };

export function buildCharacter(look) {
  // The body: a frame (how broad the shoulder, how narrow the waist) and ten sliders. Everything worn hangs on the same
  // groups the body is made of, so a piece fits whatever the body under it is: thick limbs scale what is on them, long
  // limbs stretch the sleeve or the trouser leg and carry the hand, the boot and the gun with them.
  const FM = 0, SV = shapeOf(look), wt = SV.weight, mu = 0;
  const aK = 0.88 * (1 + 0.2 * SV.arms), lF = 0.64 * (1 + 0.18 * SV.legs), LEG = 1.2, lq = (62 * lF - 21) / 41, HIP = 41 * lq * LEG + 21;
  const WX = wt > 0 ? 1 + 0.24 * wt : 1 + 0.15 * wt, WZ = wt > 0 ? 1 + 0.38 * wt : 1 + 0.16 * wt, LIMB = wt > 0 ? 1 + 0.26 * wt : 1 + 0.16 * wt;
  const SW = 1, HPW = 1;
  const ARMW = LIMB * (1 + 0.2 * mu) * (1 - 0.06 * FM), LEGW = LIMB * (1 + 0.1 * mu), HS = 1 + 0.12 * SV.head;
  const chest = 0, rear = 0, groin = 0;
  const tone = cosItem('tone', look.tone).c, HAIR = cosItem('hair', look.hair), HC = cosItem('haircol', look.haircol).c;
  const BT = cosItem('boots', look.boots), GL = cosItem('gloves', look.gloves), NK = cosItem('neck', look.neck), SH = cosItem('shoulder', look.shoulder), WS = cosItem('waist', look.waist);
  const O = cosItem('outfit', look.outfit), L = cosItem('legs', look.legs), H = cosItem('hat', look.hat), F = cosItem('face', look.face), B = cosItem('back', look.back);
  const NS = cosItem('nose', look.nose), BL = cosItem('blush', look.blush), BE = cosItem('beard', look.beard).id, ST = cosItem('stache', look.stache).id;
  const HCI = cosItem('hatcol', look.hatcol), HP = cosItem('hatpat', look.hatpat).id, TIP = cosItem('hattip', look.hattip).id;
  const root = new THREE.Group(), R = { root, hipY: HIP };
  const body = R.body = grp(root, 0, HIP, 0); body.scale.set(WX, 1, WZ);
  const st = O.style;

  // ---- legs: a thigh and shin that take the leg's length, and a boot the size of a foot whatever the leg is
  const FW = Math.max(LEGW * 0.94, 1 + 0.1 * wt), tucked = ['tall', 'spur'].includes(BT.style);
  for (const s of [-1, 1]) {
    const leg = grp(root, s * 15 * WX * Math.max(0.94, HPW), HIP, 0); R[s < 0 ? 'legL' : 'legR'] = leg; leg.scale.set(LEGW, LEG, LEGW);
    const peg = BT.style === 'peg' && s > 0;
    if (peg) { const pg = grp(leg, 0, 0, 0); pg.scale.y = HIP / (62 * LEG); add(pg, taper(0.5, 0.42), L.a, 26, 20, 26, 0, -10, 0); add(pg, G.cyl, 0x6a6a72, 19, 3, 19, 0, -21, 0); add(pg, taper(0.4, 0.25), BT.a, 16, 42, 16, 0, -41, 0); add(pg, G.cyl, 0x3a3a40, 9, 2.4, 9, 0, -61, 0); continue; }
    // the foot hangs from the ankle at its own size: y 0 is the ankle, -21 the ground
    const up = grp(leg, 0, 0, 0), ft = grp(leg, 0, -41 * lq, 0); up.scale.y = lq; ft.scale.set(FW / LEGW, 1 / LEG, FW / LEGW);
    // the trouser leg: one piece of cloth from the hip to the hem. It narrows to the knee, folds a little there, and either
    // breaks over the boot in a turned hem or narrows to go into a tall boot. y here runs 0 (hip) to -41 (ankle).
    const lw = 26, LKY = [L.id, L.a, L.b, tucked].join(':');
    const tS = (y) => (2 - y) / 41.5, hemC = L.id === 'denim' ? mix(L.a, 0xffffff, 0.28) : shade(L.a, 0.84);
    const bands = L.id === 'teal' ? [[tS(-2), tS(-4)], [tS(-35.8), tS(-38.2)]] : [];
    const legR = (t) => cprof(tucked ? [[0, 13.6], [0.2, 13.2], [0.45, 12], [0.55, 11.4], [0.8, 10.4], [1, 9.6]] : [[0, 13.6], [0.2, 13.2], [0.45, 12], [0.55, 11.6], [0.75, 11], [0.88, 11.3], [0.9, 12.5], [1, 12.6]], t);
    const fold = (t, ph) => 1 - 0.05 * Math.exp(-(((t - 0.55) / 0.08) ** 2)) * Math.pow(0.5 + 0.5 * Math.cos(t * 41.5 * 2.2 + Math.sin(ph)), 2) - (tucked ? 0 : 0.04 * Math.exp(-(((t - 0.82) / 0.05) ** 2)) * (0.5 + 0.5 * Math.cos(ph * 3)));
    clothTube(up, 'leg' + LKY, [[0, 2, 0], [0, -39.5, 0]], legR, (t) => (!tucked && t > 0.9 ? hemC : bands.some((q) => t > q[0] && t < q[1]) ? L.b : L.a), [...(tucked ? [] : [0.9]), ...bands.flat()], fold, false);
    // a point on the leg's cloth at angle ph (0 the wearer's left, PI/2 the front) and height y, lift off it, and the way out
    const legAt = (ph, y, lift = 0.3) => { const r = legR(tS(y)) + lift; return [new THREE.Vector3(r * Math.cos(ph), y, 0.92 * r * Math.sin(ph)), new THREE.Vector3(Math.cos(ph), 0, Math.sin(ph) / 0.92).normalize()]; };
    const OUT = s > 0 ? 0 : Math.PI, FRONT = Math.PI / 2;
    // something laid on the leg: centred on angle phC, hw radians either side, between heights y0 and y1
    const legPanel = (k, c, y0, y1, phC, hw, th = 0.8, lift = 0.3) => shell(up, c, 'lp' + LKY + k + s, 12, 26, (u, v) => {
      const y = y1 + (y0 - y1) * v, ph = phC + u * hw, [P, n] = legAt(ph, y, lift), r = legR(tS(y)), e = Math.min((1 - Math.abs(u)) * hw * r, y1 - y, y - y0);
      return [P.x, P.y, P.z, n.x, n.y, n.z, th * Math.sqrt(Math.max(0, Math.min(1, e / 0.6))), 1];
    });
    const legDisc = (c, ph, y, d, out) => { const [P, n] = legAt(ph, y, out), g = grp(up, P.x, P.y, P.z); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n); add(g, G.cyl, c, d, 1.2, d / lq).rotation.x = Math.PI / 2; return g; };
    if (L.chaps) { legPanel('ch', L.b, -36, -1, OUT, 1.45, 1.8);   // leather over the outside of the leg, fringed down the seam, buckled at the hip
      for (let k = 0; k < 9; k++) { const [P] = legAt(OUT + s * 0.25 * ((k % 2) - 0.5), -3 - k * 3.8, 1.6), m = add(up, taper(0.5, 0.2), shade(L.b, 0.8), 2.2, 8 / lq, 1.4, P.x + s * 1.6, P.y - 2 / lq, P.z); m.rotation.z = s * 0.3; }
      legDisc(0xc9c9d0, OUT + s * 0.6, -4, 5, 2.2); }
    if (L.stripe || L.id === 'red' || L.id === 'white') legPanel('sp', L.b, -38, -1, OUT, L.id === 'red' ? 0.11 : 0.16, 0.6);   // a stripe down the outside
    switch (L.id) {   // what each pair is known by
      case 'denim': legPanel('sm', shade(L.a, 0.72), -36, -1, OUT, 0.045, 0.3); break;   // the outer seam
      case 'dust': legPanel('kp', shade(L.a, 0.78), -27.5, -16.5, FRONT, 0.42, 1); legPanel('kps', shade(L.a, 0.6), -19.8, -19, FRONT, 0.36, 1.3); break;   // a knee patch, stitched across
      case 'black': for (let k = 0; k < 5; k++) legDisc(0xc9c9d0, OUT, -5 - k * 7.4, 2.8, 0.9); break;   // studs down the seam
      case 'white': for (const d of [-0.42, 0.42]) legPanel('cr' + d, shade(L.a, 0.8), -36, -3, FRONT + d, 0.03, 0.25); break;   // pressed creases
      default: break;
    }
    const bs = BT.style, B1 = shade(BT.a, 0.95), B2 = shade(BT.b, 0.8), GOLDM = 0xc9a43a;
    const sole = (th = 4, c = B2, pointed = false) => sweepAB(ft, 'so' + [th, c, pointed].join(':'), [[0, -21 + th / 2, -10.6], [0, -21 + th / 2, 5], [0, -21 + th / 2, pointed ? 24 : 21]],   // a sole cut to the foot's outline
      (t) => [pointed ? cprof([[0, 9.8], [0.35, 10.6], [0.72, 8], [1, 3.4]], t) : cprof([[0, 10.4], [0.4, 11.3], [0.8, 10.8], [1, 9]], t), th / 2], () => c, -1e9, pointed ? 0.4 : 1);
    // the shaft: smooth leather from h above the ankle to 9 below it, wide enough at every height to take the trouser leg inside
    const legLen = 41 * lq * LEG, needR = (yf) => (yf <= 0 ? 0 : legR(tS(Math.min(2, -41 + yf / (lq * LEG)))) * LEGW / (FW) + 0.9);
    const shaftR = (yf) => Math.max(11.75, needR(yf)), BKY = [BT.id, L.id, Math.round(lq * 100), Math.round(LEGW * 100), Math.round(FW * 100)].join(':');
    const shaft = (h, c = B1) => { clothTube(ft, 'sh' + BKY + h + c, [[0, h, -1], [0, -9, -1]], (t) => shaftR(h - t * (h + 9)), () => c, [], (t, ph) => 1 + 0.012 * Math.cos(ph * 5 + t * 4), false); return shaftR(h); };
    const tallH = Math.min(23, 0.6 * legLen), spurH = Math.min(18, 0.52 * legLen);   // tall boots come to just below the knee, whatever the leg
    // the foot: one smooth shape from inside the shaft, down round the heel, over the instep to the toe, standing flat on
    // its sole. cap: a toe cap or rubber toe in another colour; pointed: a riding boot's narrow toe.
    const vamp = (c = B1, cap = null, pointed = false, soleTop = -16.2) => sweepAB(ft, 'ft' + [BT.id, c, cap, pointed, soleTop].join(':'),
      pointed ? [[0, -2, -2], [0, -11, -2.4], [0, -14.4, 5], [0, -15.6, 13], [0, -16.2, 21.4]] : [[0, -2, -2], [0, -11, -2], [0, -14.2, 5.6], [0, -15.4, 12.6], [0, -15.8, 18.4]],
      (t) => pointed ? [cprof([[0, 11.2], [0.3, 10.8], [0.6, 9.6], [0.85, 6.6], [1, 3.4]], t), cprof([[0, 11], [0.3, 10.2], [0.6, 7.4], [0.85, 5.2], [1, 3]], t)]
        : [cprof([[0, 11.2], [0.3, 10.9], [0.6, 10.4], [0.85, 9.8], [1, 9]], t), cprof([[0, 11], [0.3, 10.4], [0.6, 7.8], [0.85, 6.4], [1, 5.6]], t)],
      (t, q) => (cap !== null && t > 0.72 && q.y < -9.5 ? cap : c), soleTop, pointed ? 0.5 : 1);
    if (bs === 'sandal') {
      add(ft, G.cyl, tone, 17, 9, 17, 0, -4, -1); rbox(ft, tone, 18, 9, 27, 0, -13.2, 4.5, 4.4); for (let k = 0; k < 4; k++) add(ft, G.ball, shade(tone, 0.9), 4.4, 4.4, 5.4, -6.4 + k * 4.3, -15, 18.2 - Math.abs(k - 1) * 0.8);
      rbox(ft, BT.a, 20, 3, 4.5, 0, -10, 11.5, 1.2); rbox(ft, BT.a, 20.5, 3, 4.5, 0, -8.2, 2.5, 1.2); add(ft, G.box, BT.a, 3, 3, 12, 0, -9, 7); add(ft, G.cyl, BT.a, 19, 2.6, 19, 0, -3, -1); add(ft, G.ball, GOLDM, 3.4, 3.4, 2, s * 9.6, -3, 2); sole(3.4, BT.b); continue;
    }
    if (bs === 'spur') {   // a riding boot: tall stitched shaft, pointed toe, a heel under it and a spur behind
      { const rT = shaft(spurH), H = spurH; add(ft, G.cyl, BT.b, rT * 2 + 1, 2.4, rT * 2 + 1, 0, H - 0.6, -1); for (const k of [-1, 1]) { add(ft, G.box, BT.b, 1.3, H * 0.72, 1.3, k * 4, H * 0.44, shaftR(H * 0.44) - 1.2).rotation.z = k * 0.42; add(ft, G.box, shade(BT.a, 0.7), 2.4, 6, 3, k * (rT + 0.2), H - 1, -1); } }   // stitching up the front, pull straps either side
      vamp(B1, null, true, -17.8);
      sole(3, B2, true); add(ft, G.box, shade(BT.b, 0.6), 18, 6.4, 9, 0, -17.8, -6.4);
      add(ft, G.box, GOLDM, 2.6, 2.2, 9, 0, -12.6, -14); add(ft, G.cyl, 0xffcd5a, 8.5, 1.4, 8.5, 0, -12.6, -19.6).rotation.z = Math.PI / 2; for (let k = 0; k < 6; k++) add(ft, G.box, 0xffcd5a, 1.2, 2.6, 2.6, 0, -12.6 + Math.sin(k * 1.047) * 5, -19.6 + Math.cos(k * 1.047) * 5);
      if (BT.id === 'snake') for (let k = 0; k < 7; k++) { const y = spurH * 0.72 - k * spurH * 0.2; add(ft, G.ball, shade(BT.a, 0.7), 4, 3, 2, (k % 2 ? 4.5 : -4.5) * (k % 3 ? 1 : 0.2), y, (y > 0 ? shaftR(y) : 11.75) - 1.6 - (k > 4 ? 0.4 : 0)); }
      if (BT.id === 'redb') { const z = shaftR(6) - 0.6; for (let k = 0; k < 5; k++) add(ft, G.cone, BT.b, 3, 5, 1.4, Math.sin(k * 1.2566) * 3.4, 6 + Math.cos(k * 1.2566) * 3.4, z).rotation.z = -k * 1.2566; add(ft, G.cyl, BT.b, 5, 1.4, 5, 0, 6, z).rotation.x = Math.PI / 2; }
      continue;
    }
    if (bs === 'tall') {   // a long smooth boot the trousers go into
      const rT = shaft(tallH); vamp(B1, BT.id === 'rubber' ? shade(BT.a, 0.8) : BT.id === 'goldb' ? BT.b : null); add(ft, G.cyl, BT.b, rT * 2 + 1.2, 3, rT * 2 + 1.2, 0, tallH - 1, -1); sole(4.6); add(ft, G.box, shade(BT.b, 0.6), 21, 2.6, 10, 0, -19.8, -6.4);
      if (BT.id === 'rubber') { const r = shaftR(3); add(ft, G.cyl, shade(BT.a, 0.8), r * 2 + 0.6, 2, r * 2 + 0.6, 0, 3, -1); }
      if (BT.id === 'blackb') for (const y of [tallH * 0.2, tallH * 0.6]) { const r = shaftR(y); add(ft, G.cyl, BT.b, r * 2 + 0.8, 2.6, r * 2 + 0.8, 0, y, -1); add(ft, G.box, 0xc9c9d0, 1.6, 4, 4.6, s * (r + 0.6), y, 2); }   // strap and buckle
      if (BT.id === 'goldb') { add(ft, G.box, BT.b, 2.4, tallH, 1.4, 0, tallH / 2 - 2.5, shaftR(tallH / 2) - 1.2 + 0.4); add(ft, G.ball, BT.b, 5, 5, 2.4, s * (shaftR(tallH * 0.6) + 0.2), tallH * 0.6, -1); }
      continue;
    }
    if (bs === 'low') {   // a canvas shoe: a white rubber toe and sole, a stripe down the side, laces
      { const rT = shaft(2.6, B1); add(ft, G.cyl, 0xf2e8d5, rT * 2 + 0.6, 1.6, rT * 2 + 0.6, 0, 3.4, -1); } vamp(B1, 0xf2e8d5, false, -16); rbox(ft, BT.a, 10, 9, 4, 0, -2.6, 8.6, 1.6);
      sole(5, 0xf2e8d5); sweepAB(ft, 'rim' + BT.b, [[0, -17.2, -10.4], [0, -17.2, 5], [0, -17.2, 21.2]], (t) => [cprof([[0, 10.7], [0.4, 11.6], [0.8, 11.1], [1, 9.3]], t), 0.65], () => BT.b);   // the coloured line round the rubber sole for (const k of [-1, 1]) add(ft, G.box, BT.b, 0.9, 4.4, 13, k * 10.6, -10.4, 1).rotation.x = 0.5;
      for (let k = 0; k < 3; k++) add(ft, G.box, 0xf2e8d5, 8.4, 1.3, 1.6, 0, -4.6 - k * 2.6, 9.6 + k * 1.9).rotation.x = -0.6;
      continue;
    }
    // a working boot: a round toe with a cap, laces up the front and a heavy sole
    { const rT = shaft(8); add(ft, G.cyl, shade(BT.a, 0.72), rT * 2 + 1, 2.6, rT * 2 + 1, 0, 7.4, -1); } vamp(B1, shade(BT.a, 0.78));
    sole(4.8); add(ft, G.box, shade(BT.b, 0.6), 21.6, 2.6, 10, 0, -19.8, -6.4); rbox(ft, shade(BT.a, 1.15), 8, 14, 2, 0, -1, 10.2, 1);
    for (let k = 0; k < 4; k++) add(ft, G.box, BT.b, 9.5, 1.2, 1.4, 0, 4.4 - k * 3.3, 11 + (k > 2 ? 0.6 : 0));
    if (st === 'stripes' && s < 0) { add(ft, G.tor, 0x6a6a72, 27, 27, 24, 0, 11, -1).rotation.x = Math.PI / 2; for (let k = 0; k < 3; k++) add(ft, G.tor, 0x6a6a72, 7, 9, 5, s * (14 + k * 2.4), 7 - k * 6.4, -3).rotation.y = k % 2 ? 0 : Math.PI / 2; add(ft, G.ball, 0x3a3a40, 13, 13, 13, s * 24, -14.4, -4); }
  }
  // hips, and what the sliders put on them: all of it under the trousers (or the coat, when there are tails)
  const under = st === 'coat' ? O.a : shade(L.a, 0.85);
  if (rear > 0.02) for (const s of [-1, 1]) { const d = 16 + 9 * rear; add(body, G.ball, under, d, d, d, s * 9 * HPW, -3, -18 - 6.5 * rear + d / 2); }
  if (groin > 0.02) add(body, G.ball, st === 'coat' ? O.a : L.a, 13 + 7 * groin, 12 + 6 * groin, 10 + 8 * groin, 0, -5, 13.5 + 1.5 * groin);
  add(body, G.cyl, shade(L.a, 0.85), 50 * HPW, 12, 36, 0, 2, 0);             // hips
  const wg = grp(body, 0, 0, 0); wg.scale.x = Math.max(1, HPW);            // what hangs at the waist sits out as far as the hips do
  add(body, G.cyl, O.c, 52, 7, 38, 0, 7, 0);                                 // belt
  rbox(body, 0xffcd5a, 11, 8.6, 3, 0, 7, 19, 2); add(body, G.box, shade(O.c, 0.7), 5, 4, 3.4, 0, 7, 19);   // buckle
  for (const x of [-21, -9, 9, 21]) add(body, G.box, shade(O.c, 0.75), 2.4, 8.4, 39.2, x, 7, 0);          // belt loops
  if (st !== 'coat') { for (const s of [-1, 1]) { rbox(body, shade(L.a, 0.72), 12, 8, 1.6, s * 11.5 * HPW, -1, -18, 0.8); add(body, G.box, shade(L.a, 0.6), 9, 1, 1.8, s * 11.5 * HPW, 1.6, -18); } add(body, G.box, shade(L.a, 0.68), 1.4, 7, 1.4, 1.2, -1.6, 17.9); }
  switch (WS.id) {
    case 'holster': add(wg, G.box, WS.a, 12, 22, 10, 27, -4, 4); add(wg, G.box, WS.b, 7, 10, 8, 27, 9, 4); break;
    case 'twin': for (const s of [-1, 1]) { add(wg, G.box, WS.a, 12, 22, 10, s * 27, -4, 4); add(wg, G.box, WS.b, 7, 10, 8, s * 27, 9, 4); } break;
    case 'ammo': add(wg, G.cyl, WS.a, 55, 9, 41, 0, 7, 0); for (let i = -4; i <= 4; i++) if (i) add(wg, G.cyl, WS.b, 4, 10, 4, i * 5.4, 7, 20 - Math.abs(i) * 0.7); break;
    case 'sash': add(wg, G.cyl, WS.a, 56, 14, 42, 0, 7, 0); add(wg, G.box, WS.a, 12, 34, 4, -18, -12, 19); add(wg, G.box, WS.b, 12, 4, 4.5, -18, -27, 19); break;
    case 'tool': add(wg, G.box, WS.a, 14, 16, 8, -24, -2, 12); add(wg, G.box, WS.a, 14, 16, 8, 24, -2, 12); add(wg, G.box, WS.b, 4, 24, 4, 24, 4, 17); add(wg, G.box, WS.b, 10, 5, 5, 24, 16, 17); break;
    case 'rope': { const t = add(wg, G.tor, WS.a, 30, 30, 26, 27, -4, 2); t.rotation.y = Math.PI / 2; add(wg, G.tor, WS.b, 24, 24, 22, 27, -4, 2).rotation.y = Math.PI / 2; break; }
    case 'chips': add(wg, G.ball, WS.a, 22, 24, 16, -24, -6, 12); add(wg, G.cyl, WS.b, 12, 3, 12, -24, 6, 12); add(wg, G.cyl, 0xf2e8d5, 12, 3, 12, -24, 9, 12); break;
    case 'champ': add(wg, G.cyl, WS.a, 57, 14, 43, 0, 7, 0); add(wg, G.cyl, WS.b, 26, 4, 26, 0, 7, 20).rotation.x = Math.PI / 2; for (const s of [-1, 1]) add(wg, G.cyl, WS.b, 12, 3, 12, s * 19, 7, 15).rotation.x = Math.PI / 2; break;
    case 'skulls': for (const x of [-22, 22]) { add(wg, G.box, WS.a, 2, 10, 2, x, 0, 16); add(wg, G.box, WS.b, 12, 11, 11, x, -10, 16); add(wg, G.box, 0x140d12, 8, 3, 1, x, -9, 22); } break;
    default: break;
  }

  // ---- the torso and what is worn on it. One smooth torso in the outfit's colour (or in the shirt under a coat or vest);
  // everything worn over it (a coat, a vest, a bib, braces, lapels, ribs) is a panel cut to the torso's own shape, so it
  // lies on it and its edges are clean. Stripes and seams are painted on with a doubled row at each edge.
  const OKY = [O.id, O.a, O.b, O.c].join(':');
  const BCK = Math.PI;
  // a panel on the front (or back) of the torso between heights y0 and y1, xr(y) -> [x0, x1] across it, th thick
  const panel = (key, c, y0, y1, xr, th = 1, back = false, lift = 0.15) => shell(body, c, 'pn' + OKY + key + '/' + lift, 20, 24, (u, v) => {   // lift: how far off the torso it starts (on top of a coat, the coat's thickness)
    const y = y1 + (y0 - y1) * v, [x0, x1] = xr(y), x = x0 + ((u + 1) / 2) * (x1 - x0), p0 = torsoPh(x, y), [P, nn] = torsoAt(back ? BCK - p0 : p0, y, lift), e = Math.min(x - x0, x1 - x, y1 - y, y - y0);
    return [P.x, P.y, P.z, nn.x, nn.y, nn.z, th * Math.sqrt(Math.max(0, Math.min(1, e / 0.7))), 1];
  });
  // a strip of cloth laid along a path across the front: path(t) -> [x, y] for t 0..1, w wide
  const strip = (key, c, path, w, th = 1, back = false, lift = 0.15) => shell(body, c, 'st' + OKY + key + '/' + lift, 30, 6, (u, v) => {
    const t = (u + 1) / 2, [x, y0] = path(t), [x2, y2] = path(Math.min(1, t + 0.01)), [x1, y1] = path(Math.max(0, t - 0.01)), dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    const off = (v - 0.5) * w, xx = x - (dy / L) * off, yy = y0 + (dx / L) * off, p0 = torsoPh(xx, yy), [P, nn] = torsoAt(back ? BCK - p0 : p0, yy, lift), e = Math.min(w / 2 - Math.abs(off), t * 40, (1 - t) * 40);
    return [P.x, P.y, P.z, nn.x, nn.y, nn.z, th * Math.sqrt(Math.max(0, Math.min(1, e / 0.6))), 1];
  });
  // a garment wrapped round the torso from one side of a front opening, round the back, to the other: xo(y) is how far the
  // opening reaches either side of the middle at each height. colFn(ph, y) can colour it (trim); th is how thick it stands.
  const wrapPanel = (key, c, y0, y1, xo, th = 1.4, colFn = null) => shell(body, colFn ? null : c, 'wp' + OKY + key, 72, 32, (u, v) => {
    const y = y1 + (y0 - y1) * v, p0 = torsoPh(Math.max(0.3, xo(y)), y), ph = p0 + ((u + 1) / 2) * (2 * Math.PI - 2 * p0), [P, nn] = torsoAt(ph, y, 0.15), a = cprof(TA, y);
    const e = Math.min((ph - p0) * a * 0.75, (2 * Math.PI - p0 - ph) * a * 0.75, y1 - y, y - y0);
    return [P.x, P.y, P.z, nn.x, nn.y, nn.z, th * Math.sqrt(Math.max(0, Math.min(1, e / 0.8))), colFn ? colFn(ph, y) : 1];
  });
  // something small pinned flat on the torso at (x, y), standing `out` off it: buttons, badges, buckles
  const pin = (m, x, y, out = 0.6, back = false) => { const p0 = torsoPh(x, y), [P, nn] = torsoAt(back ? BCK - p0 : p0, y, out); m.position.copy(P); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nn); return m; };
  const disc = (c, x, y, d = 3.6, out = 0.7, back = false) => { const g = new THREE.Group(), m = add(g, G.cyl, c, d, 1.2, d); m.rotation.x = Math.PI / 2; body.add(g); return pin(g, x, y, out, back); };   // a flat disc facing out
  const torso = (top, colAt, edges = []) => wrapSurf(body, 'torso' + OKY + top + edges.join(','), rowsOf(0, top, 1.6, edges), 96, (ph, y) => torsoAt(ph, y)[0].toArray(), colAt);
  const opening = (yv, x0, x1) => (y) => (y > yv ? x0 + ((y - yv) / (61 - yv)) * (x1 - x0) : 0.4);   // a V from yv up to the neck
  const lapels = (c, yv, xo, w0) => { for (const sg of [-1, 1]) panel('lap' + sg + c, c, yv, 59, (y) => { const a = xo(y), w = w0 * Math.min(1, (y - yv) / 12); return sg > 0 ? [a, a + w + 0.01] : [-(a + w + 0.01), -a]; }, 1.3, false, 1.5); };   // laid back on the coat
  const pocket = (x, y, c = shade(O.a, 0.84)) => { panel('pk' + x + '/' + y, c, y - 5, y + 5, () => [x - 5.5, x + 5.5], 0.8); panel('pf' + x + '/' + y, shade(O.a, 0.72), y + 3, y + 6.2, () => [x - 5.9, x + 5.9], 1.5); disc(O.c, x, y + 4.4, 2.6, 1.7); };
  const collar = (c) => { for (const sg of [-1, 1]) { const m = add(body, G.box, c, 10, 5.4, 2.4, sg * 7, 59.4, 15.6); m.rotation.z = sg * 0.55; m.rotation.y = -sg * 0.35; } };
  const placket = (c, y0 = 10, y1 = 60, bc = O.c) => { panel('plk', c, y0, y1, () => [-2.2, 2.2], 0.7); for (const y of [22, 34, 46]) disc(bc, 0, y, 3.4, 1.4); };
  const GOLDM = 0xc9a43a;
  if (st === 'poncho') {
    torso(30, () => O.a);   // all that shows of it is below the poncho's hem
    // the poncho: hangs from the neck over the shoulders to a hem, falling into soft folds that deepen toward the hem
    const pt = (ph, y) => { const t = Math.max(0, Math.min(1, (62 - y) / 45)), k = 1 + 0.045 * Math.pow(t, 1.3) * Math.cos(9 * ph + 0.4), a = (17 + 30 * Math.pow(t, 0.85)) * k, b = (15.5 + 20.5 * Math.pow(t, 0.85)) * k, sn = Math.sin(ph), c = Math.cos(ph);
      return [a * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / 2.2), y - (t > 0.98 ? 1.2 * Math.sin(9 * ph) : 0), b * Math.sign(c) * Math.pow(Math.abs(c), 2 / 2.2)]; };
    const band = (y) => (y > 23 && y < 29 ? O.b : y > 37.5 && y < 42.5 ? shade(O.b, 0.8) : O.a);
    wrapSurf(body, 'poncho' + OKY, rowsOf(17, 62, 1.5, [23, 29, 37.5, 42.5]), 108, pt, (ph, y, y0) => band(y0));
    const on = (ph, y, out) => { const p = new THREE.Vector3(...pt(ph, y)), q = new THREE.Vector3(...pt(ph + 0.01, y)), r = new THREE.Vector3(...pt(ph, y + 0.5)), n = new THREE.Vector3().subVectors(q, p).cross(new THREE.Vector3().subVectors(r, p)).normalize(); if (n.dot(new THREE.Vector3(p.x, 0, p.z)) < 0) n.negate(); return [p.addScaledVector(n, out), n]; };
    for (let i = 0; i < 12; i++) { const [P, n] = on(((i + 0.5) / 12) * Math.PI * 2, 33, 0.4), g = grp(body, P.x, P.y, P.z); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n); add(g, G.box, O.c, 4.4, 4.4, 1, 0, 0, 0).rotation.z = Math.PI / 4; }   // a row of diamonds woven in
    for (let i = 0; i < 30; i++) { const ph = (i / 30) * Math.PI * 2, [P] = on(ph, 17.4, -0.6); add(body, taper(0.5, 0.32), i % 2 ? O.b : shade(O.b, 0.8), 2.4, 7.4, 2.4, P.x, P.y - 1.2 * Math.sin(9 * ph) - 3.4, P.z); }   // the fringe
    { const m = add(body, G.tor, O.b, 35, 32, 22, 0, 61.6, 0); m.rotation.x = Math.PI / 2; }   // trim round the neck
  } else if (st === 'shirt' || st === 'badge' || st === 'plaid') {
    const bands = st === 'plaid' ? [18, 22, 32, 36, 46, 50] : [50.9, 52.3];
    torso(63, (ph, y, y0) => (st === 'plaid' ? ((y0 > 18 && y0 < 22) || (y0 > 32 && y0 < 36) || (y0 > 46 && y0 < 50) ? O.b : O.a) : y0 > 50.9 && y0 < 52.3 ? shade(O.a, 0.86) : O.a), bands);
    placket(O.b); collar(st === 'plaid' ? shade(O.a, 0.85) : mix(O.a, 0xffffff, 0.16));
    if (st === 'plaid') { for (const sg of [-1, 1]) for (const bk of [false, true]) { panel('pl' + sg + bk, O.b, 8, 58, () => (sg > 0 ? [14, 18] : [-18, -14]), 0.4, bk); panel('br' + sg + bk, O.c, 9, 61, () => (sg > 0 ? [6.4, 11.6] : [-11.6, -6.4]), 1.3, bk); } for (const sg of [-1, 1]) disc(GOLDM, sg * 9, 14, 3.4, 1.8); }   // check lines, and braces over it
    if (st === 'shirt') pocket(13, 43);
    if (st === 'badge') { pocket(8.6, 42); wrapPanel('wc', O.c, 10.6, 59, () => 14, 1.6);   // a leather waistcoat open over the shirt, a star on it
      const g = disc(0xffcd5a, -19, 46, 3, 2); for (let k = 0; k < 5; k++) add(g, G.cone, 0xffcd5a, 4.4, 6, 2.2, Math.sin(k * 1.2566) * 6, Math.cos(k * 1.2566) * 6, 0.6).rotation.z = -k * 1.2566; }
  } else if (st === 'overalls') {
    torso(63, () => O.a);
    panel('bib', O.b, 14, 41, () => [-15, 15], 1.3); for (const sg of [-1, 1]) { panel('sf' + sg, O.b, 39, 61, () => (sg > 0 ? [8.6, 15.4] : [-15.4, -8.6]), 1.3); panel('sb' + sg, O.b, 14, 61, () => (sg > 0 ? [8.6, 15.4] : [-15.4, -8.6]), 1.3, true); disc(GOLDM, sg * 12, 39, 3.6, 2.2); }
    panel('bp', shade(O.b, 0.84), 25.5, 34.5, () => [-7, 7], 2.2); panel('bpf', shade(O.b, 0.7), 33.4, 36, () => [-7.3, 7.3], 2.8);   // the bib pocket
    add(body, G.box, 0xc8211b, 8, 13, 3, 15, -7, -18.6).rotation.z = 0.2; add(body, G.box, 0x9aa0aa, 3, 15, 2, -16, -3, -19); add(body, G.box, 0x9aa0aa, 7, 4, 2, -16, 5, -19);   // a rag and a wrench in the back pockets
  } else if (st === 'coat' || st === 'suit') {
    const xo = opening(30, 1.6, 10.5), trim = O.id === 'showman' || O.id === 'gilded';
    torso(63, (ph, y) => (Math.abs(Math.sin(ph)) < 0.5 && Math.cos(ph) > 0 ? O.c : O.a));   // the shirt shows in the opening
    panel('tie', O.b, 27, 57, (y) => { const w = y > 54 ? 2.4 : 1.4 + 1.6 * ((54 - y) / 27); return [-w, w]; }, 0.9);
    wrapPanel('coat', O.a, 10.6, 61, xo, 1.4);   // down to the belt (the tails hang from under it)
    lapels(O.id === 'gilded' ? O.b : shade(O.a, 0.8), 30, xo, 9);
    for (const sg of [-1, 1]) { for (const y of [24, 16]) disc(O.id === 'undertaker' ? 0x9aa0aa : st === 'suit' ? shade(O.a, 0.6) : O.b, sg * (st === 'suit' ? 3.4 : 10.5), y, 3.6, 2); panel('flap' + sg, shade(O.a, 0.74), 19, 21.6, () => (sg > 0 ? [12, 24] : [-24, -12]), 1, false, 1.5); }
    if (st === 'coat') { for (const sg of [-1, 1]) { const m = add(body, G.box, shade(O.a, 0.86), 5, 10, 15, sg * 13.6, 63, -2); m.rotation.z = sg * 0.28; }   // the collar turned up
      // the tails: from the waist to below the hips, flaring and falling into folds, split up the back
      const tail = (p0, p1, sk) => shell(body, null, 'tl' + OKY + sk, 40, 26, (u, v) => {
        const y = 9 - v * 31, t = v, ph = p0 + ((u + 1) / 2) * (p1 - p0), k = 1 + 0.035 * t * Math.cos(7 * ph), a = (27.2 + 7.6 * t) * k, b = (19.6 + 7 * t) * k, sn = Math.sin(ph), c = Math.cos(ph);
        const x = a * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / 2.3), z = b * Math.sign(c) * Math.pow(Math.abs(c), 2 / 2.3), n = new THREE.Vector3(x / (a * a), 0.12, z / (b * b)).normalize(), hy = y - (v > 0.97 ? 1.2 * Math.sin(7 * ph) : 0);
        const e = Math.min((ph - p0) * a * 0.8, (p1 - ph) * a * 0.8, (1 - v) * 31, v * 31 + 2);
        return [x, hy, z, n.x, n.y, n.z, 1.4 * Math.sqrt(Math.max(0, Math.min(1, e / 0.8))), trim && y < -16.2 && y > -19 ? O.b : O.a];
      });
      tail(0.42, Math.PI - 0.05, 'r'); tail(Math.PI + 0.05, 2 * Math.PI - 0.42, 'l'); }
    if (O.id === 'undertaker') { add(body, G.tor, GOLDM, 15, 10, 4, 9.5, 21, 21.4); disc(O.c, 0, 57, 5, 1.4); }
    if (O.id === 'showman') for (let i = 0; i < 3; i++) { const y = 51 - i * 8.6, w = 15.5 - i * 2; panel('frog' + i, O.b, y - 1.3, y + 1.3, () => [-w, w], 1.1, false, 1.6); for (const sg of [-1, 1]) disc(O.b, sg * w, y, 4.4, 2.6); }   // frogging across the chest
    if (O.id === 'gilded') disc(O.b, -17, 38, 7, 2.4);
    if (st === 'suit') { for (const x of [-21, -13, 13, 21]) for (const bk of [false, true]) panel('ps' + x + bk, O.b, 11.2, bk ? 58 : 55, () => [x - 0.6, x + 0.6], 0.25, bk, 1.5);   // pinstripes
      panel('hk', O.c, 45.8, 50.2, () => [-18.7, -12.3], 1, false, 1.5);   // a handkerchief in the breast pocket
      if (O.id === 'highroller') { disc(0xc8211b, 14.5, 51, 6.4, 2.2); add(body, G.tor, GOLDM, 15, 10, 4, 10, 20, 21.6); } }
  } else if (st === 'vest') {
    const xo = opening(24, 1, 13);
    torso(63, () => 0xece6d6);
    wrapPanel('vest', O.a, 10.6, 59, xo, 1.6);
    for (let i = 0; i < 3; i++) { const y = 40 - i * 9; disc(O.b, xo(y) + 2.2, y, 3.2, 2); }
    add(body, G.tor, GOLDM, 13, 9, 4, 12, 22, 22.4);
    for (const sg of [-1, 1]) add(body, G.cone, O.b, 9, 11, 4.4, sg * 6.5, 57, 20.6).rotation.z = sg * Math.PI / 2; add(body, G.ball, shade(O.b, 0.75), 5, 5, 4, 0, 57, 21.2);   // a bow tie
  } else if (st === 'stripes') {
    const E = []; for (let i = 0; i < 5; i++) E.push(11.5 + i * 10, 16.5 + i * 10);
    torso(63, (ph, y, y0) => (E.some((e, k) => k % 2 === 0 && y0 > e && y0 < E[k + 1]) ? O.b : O.a), E);
    panel('num', 0xf2e8d5, 43.3, 50.7, () => [-20, -7], 0.7); for (const x of [-17, -15, -12.5, -10]) panel('d' + x, 0x140d12, 44.7, 49.3, () => [x - 0.6, x + 0.6], 1.1);
  } else if (st === 'hazmat') {
    torso(63, (ph, y, y0) => (y0 > 17 && y0 < 23 ? O.b : O.a), [17, 23]);
    panel('zip', O.b, 9, 60, () => [-3, 3], 0.8);
    { const g = disc(0x140d12, 14, 44, 16, 0.5); for (let k = 0; k < 3; k++) add(g, G.cyl, O.a, 5.6, 1.4, 5.6, Math.sin(k * 2.094) * 4.6, Math.cos(k * 2.094) * 4.6, 0.9).rotation.x = Math.PI / 2; }
    add(body, G.tor, shade(O.a, 0.84), 36, 36, 44, 0, 62.4, 0).rotation.x = Math.PI / 2;
    { const g = disc(0x140d12, 0, 38, 19, 0.5, true); for (let k = 0; k < 3; k++) add(g, G.cyl, O.a, 6.6, 1.4, 6.6, Math.sin(k * 2.094) * 5, Math.cos(k * 2.094) * 5, 0.9).rotation.x = Math.PI / 2; }
    panel('dos', 0x3a3a40, 22, 30, () => [-19, -7], 1); panel('dosw', 0x9fd6e0, 24, 28, () => [-17.5, -8.5], 1.6);   // a dosimeter on the chest
  } else if (st === 'bones') {
    torso(63, () => O.a);
    panel('st', O.b, 16, 56, () => [-2.4, 2.4], 1.4);   // breastbone and ribs, curving down round the chest
    for (let i = 0; i < 4; i++) { const Y = 50 - i * 9, W = 18 - i * 2; strip('rib' + i, O.b, (t) => { const x = -W + 2 * W * t; return [x, Y - 0.014 * x * x]; }, 4, 1.4); }
    for (let i = 0; i < 6; i++) panel('vt' + i, O.b, 10.6 + i * 8, 15.4 + i * 8, () => [-3.2, 3.2], 1.4, true);   // the spine down the back
    add(body, G.box, O.b, 22, 4.4, 1.6, 0, 3, 19.4); for (const sg of [-1, 1]) add(body, G.box, O.b, 10, 4, 1.6, sg * 13, -1, 18.6).rotation.z = -sg * 0.5;
  } else torso(63, () => O.a);
  add(body, taper(0.42, 0.5), O.c, 26, 6, 24, 0, 62, 0);   // the collar band round the neck
  // ---- round the neck: bands follow the slope of the shoulders, and what hangs from them is laid on the chest
  {
    const NKY = [NK.id, NK.a, NK.b, O.id].join(':');
    const neckBand = (c, y0, y1, lift, k = '') => wrapSurf(body, 'nb' + NKY + k, rowsOf(y0, y1, 0.8), 72, (ph, y) => torsoAt(ph, y, lift + 0.5 * (y - y0) / (y1 - y0))[0].toArray(), () => c);
    const onShirt = st === 'coat' || st === 'suit' || st === 'vest' || st === 'badge' ? 1.7 : 1.1;   // over a coat's front it has to clear the coat
    const hang = (k, c, path, w, th = 1.2) => strip('nk' + NKY + k, c, path, w, th, false, onShirt);
    switch (NK.id) {
      case 'kerchief': neckBand(NK.a, 58.6, 62.6, 0.8); panel('kf' + NKY, NK.a, 44, 59, (y) => { const w = 12 * (y - 44) / 15 + 0.01; return [-w, w]; }, 1.2, false, onShirt); disc(NK.b, 0, 57.6, 4.4, onShirt + 1.4); break;
      case 'bolo': for (const x of [-2.6, 2.6]) hang('b' + x, NK.a, (t) => [x, 60 - t * 26], 1.3, 0.8); { const g = disc(NK.b, 0, 55, 8, onShirt + 0.6); add(g, G.cyl, shade(NK.b, 0.7), 5, 1.6, 5, 0, 0, 0.8).rotation.x = Math.PI / 2; } break;
      case 'scarf': neckBand(NK.a, 57.8, 62.8, 1.4); panel('sf' + NKY, NK.a, 16, 58, () => [6.4, 17.6], 1.6, false, onShirt);
        for (const y of [18, 28]) panel('sfs' + y + NKY, NK.b, y, y + 5, () => [6.3, 17.7], 0.6, false, onShirt + 1.5); break;
      case 'bowtie': for (const sg of [-1, 1]) add(body, G.cone, NK.a, 12, 12, 5, sg * 7, 57, 21.2).rotation.z = sg * Math.PI / 2; add(body, G.ball, NK.b, 5, 5, 4, 0, 57, 22); break;
      case 'chain': hang('c', NK.a, (t) => { const x = -13 + 26 * t; return [x, 60 - 26 * (1 - Math.pow(Math.abs(x) / 13, 1.6))]; }, 2, 1.2); { const g = disc(NK.b, 0, 32, 1, onShirt + 1); add(g, G.box, NK.b, 8, 8, 2.4, 0, 0, 1, 0.5).rotation.z = Math.PI / 4; } break;
      case 'bandolier': { const P = (t) => [-25 + 47 * t, 12 + 49 * t];   // over one shoulder and across the chest, shells along it
        hang('bf', NK.a, P, 9, 1.6); strip('nkbb' + NKY, NK.a, P, 9, 1.6, true, st === 'coat' || st === 'suit' || st === 'vest' || st === 'badge' ? 1.7 : 0.15);
        for (let i = 1; i < 8; i++) { const [x, y] = P(i / 8), g = disc(NK.a, x, y, 0.5, onShirt + 1.4); const sh = add(g, G.cyl, NK.b, 3.6, 7.4, 3.6, 0, 0, 1.6); sh.rotation.z = -0.8; } break; }
      case 'teeth': hang('t', NK.a, (t) => { const x = -13 + 26 * t; return [x, 60 - 20 * (1 - Math.pow(Math.abs(x) / 13, 1.6))]; }, 2.4, 1.2);
        for (let i = -2; i <= 2; i++) { const x = i * 5.4, y = 60 - 20 * (1 - Math.pow(Math.abs(x) / 13, 1.6)) - 1.6, g = disc(NK.a, x, y, 0.5, onShirt + 1.2); add(g, G.cone, NK.b, 4, 8, 3, 0, -3.6, 0.6).rotation.z = Math.PI; } break;
      case 'lei': for (let i = 0; i < 22; i++) { const ph = (i / 22) * Math.PI * 2, y = 56 - 8 * Math.pow(Math.max(0, Math.cos(ph)), 1.5), [P] = torsoAt(ph, y, onShirt + 1.8); add(body, G.ball, i % 2 ? NK.a : NK.b, 7.6, 7, 7.6, P.x, P.y, P.z); } break;   // a garland of flowers close round the shoulders
      case 'noose': neckBand(NK.a, 59.4, 61.8, 0.9); hang('r', NK.a, (t) => [6.5, 59 - 26 * t], 3.6, 2); { const g = disc(NK.b, 6.5, 55, 0.5, onShirt + 1.6); add(g, G.box, NK.b, 7, 8, 5, 0, 0, 1.2); } break;
      case 'medal': panel('md' + NKY, NK.a, 39, 51, () => [-18, -10], 0.8, false, onShirt); disc(NK.b, -14, 35, 11, onShirt + 0.6); break;
      default: break;
    }
  }
  // ---- arms: shoulder pivots; the sleeve takes the arm's length and carries the hand (and the gun) out with it
  for (const s of [-1, 1]) {
    const arm = grp(body, s * 36 * SW, 54, 0); R[s < 0 ? 'armL' : 'armR'] = arm; arm.scale.set(ARMW / WX, 1, ARMW / WZ);
    const sl = grp(arm, 0, 0, 0), wr = grp(arm, 0, -43 * (aK - 1), 0); sl.scale.y = aK; R[s < 0 ? 'wristL' : 'wristR'] = wr;
    // shoulder, upper arm, an elbow, a forearm into the cuff, and a hand with a thumb and fingers
    add(arm, G.ball, O.a, 25, 23, 25, 0, 0, 0);
    { // the sleeve: one piece of cloth from the shoulder to the cuff, easing in at the elbow where it folds a little;
      // stripes, garters and a rolled-back sleeve are part of it
      const yS = (y) => (2 - y) / 41, B = [];   // a height on the arm as a fraction down the sleeve
      const band = (y0, y1, c, bump = 0) => B.push([yS(y1), yS(y0), c, bump]);
      if (st === 'stripes') for (let i = 0; i < 3; i++) band(-12 - i * 10, -8 - i * 10, O.b);
      if (st === 'plaid') band(-24, -20, O.b);
      if (st === 'shirt' || st === 'plaid' || st === 'badge') band(-37.6, -33.2, shade(O.a, 0.84), 0.09);
      if (st === 'vest') band(-16.3, -13.7, O.b, 0.06);
      if (st === 'hazmat') band(-37.5, -34.5, O.b, 0.03);
      const inB = (t) => B.find((q) => t > q[0] && t < q[1]);
      const radAt = (t) => cprof([[0, 11.8], [0.25, 10.8], [0.5, 9.9], [0.62, 9.8], [0.8, 9.9], [1, 8.9]], t) * (1 + ((inB(t) || [])[3] || 0));
      const fold = (t, ph) => 1 - 0.055 * Math.exp(-(((t - 0.56) / 0.1) ** 2)) * Math.pow(0.5 + 0.5 * Math.cos(t * 41 * 2.1 + Math.cos(ph) * 0.8), 2);
      clothTube(sl, 'slv' + OKY, [[0, 2, 0], [0, -18, 0.5], [0, -39, 0]], radAt, (t) => { const q = inB(t); return q ? q[2] : O.a; }, B.flatMap((q) => [q[0], q[1]]), fold, false);
      if (st === 'coat' || st === 'suit') for (let k = 0; k < 2; k++) add(sl, G.ball, O.id === 'undertaker' ? 0x9aa0aa : O.b, 2.6, 2.6 / aK, 2.6, 0, -33.6 - k * 3.4, -9.4);     // cuff buttons
    }
    add(sl, G.cyl, O.c, 18.5, 6, 18.5, 0, -40, 0);                              // cuff
    const bare = GL.id === 'bare', hc = bare ? (st === 'hazmat' || st === 'bones' ? O.b : tone) : GL.a, big = GL.style === 'big' ? 1.3 : 1, hk = Math.pow(ARMW, -0.5) * (1 - 0.06 * FM);
    const hand = grp(wr, 0, -50, 0); hand.scale.set(big * hk, big, big * hk);     // a thick arm does not mean a hand to match
    rbox(hand, hc, 10, 14, 17, 0, 1, 0, 3.6);                                                                  // palm
    for (let k = 0; k < 4; k++) { const f = rbox(hand, shade(hc, k % 2 ? 0.92 : 1), 9, 9, 3.8, 0, -8.5, -6.3 + k * 4.2, 1.6); f.rotation.z = s * 0.25; f.position.x = s * -1.2; }   // four fingers, curled in a little
    { const t = rbox(hand, hc, 5, 9, 5, s * -5, 0, 9.5, 2); t.rotation.x = 0.5; }                              // thumb
    if (!bare) { add(sl, G.cyl, GL.b, 20, 5, 20, 0, -42, 0); if (GL.style === 'long') add(sl, taper(0.5, 0.46), GL.a, 21.5, 16, 21.5, 0, -32, 0); if (GL.style === 'wrap') for (let i = 0; i < 3; i++) rbox(wr, GL.b, Math.round(11 * hk + 1), 2.2, Math.round(18 * hk + 1), 0, -46 - i * 3.6, 0, 1); }
    // shoulder piece (left shoulder for single items)
    switch (SH.id) {
      case 'patch': add(arm, G.ball, SH.a, 28, 14, 28, 0, 8, 0); add(arm, G.cyl, SH.b, 29, 2, 29, 0, 4, 0); break;
      case 'epaulette': add(arm, G.cyl, SH.a, 30, 4, 30, 0, 11, 0); for (let i = 0; i < 5; i++) add(arm, G.box, SH.a, 2, 9, 2, s * 13, 5, -10 + i * 5); add(arm, G.ball, SH.b, 8, 5, 8, 0, 14, 0); break;
      case 'pauldron': if (s < 0) { add(arm, G.ball, SH.a, 36, 26, 34, -2, 8, 0); add(arm, G.ball, SH.b, 38, 6, 36, -2, 2, 0); add(arm, G.ball, SH.b, 6, 6, 6, -2, 20, 0); } break;
      case 'spikes': add(arm, G.ball, SH.a, 30, 16, 30, 0, 9, 0); for (const z of [-8, 0, 8]) add(arm, G.cone, SH.b, 7, 16, 7, s * 6, 20, z).rotation.z = -s * 0.5; break;
      case 'crow': case 'parrot': if (s < 0) { const b = grp(arm, -2, 16, 0); add(b, G.ball, SH.a, 14, 18, 16, 0, 8, 0); add(b, G.ball, SH.a, 11, 11, 11, 0, 20, 3); add(b, G.cone, SH.b, 5, 9, 5, 0, 19, 10).rotation.x = Math.PI / 2; add(b, G.box, SH.id === 'parrot' ? SH.b : SH.a, 6, 5, 18, 0, 4, -10); add(b, G.ball, 0x140d12, 2.5, 2.5, 2.5, -4, 22, 7); add(b, G.ball, 0x140d12, 2.5, 2.5, 2.5, 4, 22, 7); R.bird = b; } break;
      case 'fur': add(arm, G.ball, SH.a, 36, 22, 36, 0, 8, 0); add(arm, G.ball, SH.b, 22, 12, 30, s * 6, 14, 0); break;
      case 'roll': if (s < 0) { add(arm, G.cyl, SH.a, 20, 44, 20, 8, 14, 0).rotation.x = Math.PI / 2; for (const z of [-14, 14]) add(arm, G.cyl, SH.b, 21, 4, 21, 8, 14, z).rotation.x = Math.PI / 2; } break;
      case 'lantern': if (s < 0) { add(arm, G.box, SH.a, 3, 14, 3, -4, 16, 0); add(arm, G.cyl, SH.a, 12, 3, 12, -4, 30, 0); add(arm, G.cyl, SH.b, 10, 12, 10, -4, 23, 0, 1.6); } break;
      default: break;
    }
  }
  // ---- gun in the right hand
  const gun = R.gun = grp(R.wristR, 0, -52, 8); gun.scale.set(1 / ARMW, 1, 1 / ARMW);   // the gun is the same gun in any hand
  add(gun, G.box, 0x2a2a32, 7, 10, 44, 0, 4, 18); add(gun, G.box, 0x4E3324, 7, 16, 9, 0, -4, 2); add(gun, G.cyl, 0x46464e, 5, 16, 5, 0, 6, 42).rotation.x = Math.PI / 2;

  // ---- the head. A gnome has no face: the hat comes down to the nose, the nose sits on the beard, and those three
  // (with the build and the clothes) are the character. The skin that shows is cheeks, ears and nose.
  const head = R.head = grp(body, 0, 60, 0); head.scale.set(HS / WX, HS, HS / WZ);
  const PI = Math.PI, HF = (18 * WZ + 2) / HS, BC = HC, BD = shade(HC, 0.86), dark = 0x140d12;
  add(head, G.cyl, tone, 20, 8, 20, 0, 0, 0);                                                // neck
  add(head, G.ball, tone, 42, 38, 38, 0, 15, 0);                                             // cheeks, under the brim
  for (const s of [-1, 1]) { add(head, G.ball, shade(tone, 0.94), 7, 13, 9, s * 20.6, 13, -2); add(head, G.cone, shade(tone, 0.94), 6, 9, 4, s * 23, 19, -3).rotation.z = -s * 0.7; }   // ears, a little pointed
  { // the nose: one sculpted shape from under the brim to the tip
    const NC = BL.id === 'red' ? mix(tone, 0xd8463a, 0.6) : BL.id === 'rosy' ? mix(tone, 0xe0705e, 0.48) : mix(tone, 0xd8705a, 0.34), nose = grp(head, 0, 14 - 2 * Math.max(0, SV.nose), 17.5); nose.scale.setScalar(1.22 * (1 + 0.4 * SV.nose));   // a bigger nose sits a little lower, clear of the brim
    // [spine from the bridge to the tip], [section at each point], how round the tip is
    const N = {
      round: [[[0, 2, -2], [0, 0.5, 2], [0, -1.8, 5], [0, -2.6, 6.6]], [[3.2, 3], [5, 4.6], [6.4, 6.2], [5.8, 5.4]], 1],
      potato: [[[0, 2, -2], [0, 0, 2.6], [0, -2.4, 6], [0, -3.6, 7]], [[4, 3.4], [6.6, 5], [8.6, 6.6], [7.4, 5.8]], 1],
      long: [[[0, 2, -2], [0, 1.2, 4], [0, -0.6, 10], [0, -3, 15.5], [0, -4.4, 17.4]], [[3.4, 3], [3.4, 3.2], [3.8, 3.6], [4.6, 4.4], [4.4, 4]], 1],
      button: [[[0, 0.6, -2], [0, -0.4, 1.6], [0, -1, 4.4], [0, -0.8, 6.4]], [[3, 2.8], [3.8, 3.4], [4.2, 3.8], [3.8, 3.4]], 1],
      pointed: [[[0, 2, -2], [0, 0.8, 4], [0, -1.4, 10], [0, -2.6, 15.6]], [[3.6, 3.2], [4.6, 4.2], [3.4, 3.2], [1.1, 1]], 0.6],
      bulb: [[[0, 2, -2], [0, 1.6, 2.4], [0, -1.6, 6], [0, -6, 7.6], [0, -8, 6.6]], [[3, 2.8], [3.4, 3.2], [5.6, 5.4], [7.6, 7], [6.6, 5.6]], 1],
      hook: [[[0, 1.2, -2], [0, 1.8, 3.6], [0, 0.6, 8.6], [0, -2.8, 12], [0, -6, 10.8]], [[3.2, 3], [3.4, 3.2], [3.8, 3.6], [4.2, 4], [3.2, 2.8]], 1],
    }, D = N[NS.id] || N.round;
    sweep(nose, NC, D[0], D[1], { cap: [1, D[2]] });
    if (BL.id !== 'plain') for (const s of [-1, 1]) add(head, G.ball, mix(tone, 0xe05a6a, BL.id === 'red' ? 0.5 : 0.36), 10, 8, 5, s * 13.5, 11.5, 14.6);
  }
  const red = 0xc8211b;
  // a plait down a path: lobes leaning alternately left and right, a red tie, then the loose end
  const plait = (par, pts, n, ca, cb) => {
    const cv = new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(q[0], q[1], q[2]))), P = new THREE.Vector3(), T = new THREE.Vector3();
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / (n + 1); cv.getPoint(t, P); cv.getTangent(t, T); const w = 10 - i * 0.3, m = add(par, G.ball, i % 2 ? cb : ca, w, 8.2, w * 0.8, P.x, P.y, P.z); m.rotation.set(-Math.atan2(T.z, -T.y), 0, i % 2 ? -0.55 : 0.55); }
    cv.getPoint(n / (n + 1), P); add(par, G.cyl, red, 7.2, 3, 7.2, P.x, P.y, P.z); const E = cv.getPoint(1);
    sweep(par, ca, [[P.x, P.y - 1, P.z], [(P.x + E.x) / 2, (P.y + E.y) / 2 - 1, (P.z + E.z) / 2], [E.x, E.y, E.z]], [[2.8, 2.4], [4.2, 3.4], [3, 2.4]], { cap: [1, 1.2] });
  };
  // ---- beard: one carved piece. It grows from the cheeks just under the brim and from under the nose, wraps the face from
  // ear to ear, then hangs down the chest; its locks are cut into it, darker in the grooves, and end in a scalloped hem.
  {
    // over a poncho it is tipped out to clear it, and hangs straight again below the poncho's hem
    const bl = 1 + 0.4 * SV.beardL, bw = 1 + 0.3 * SV.beardW, z0 = HF - 2.5, bgP = grp(head, 0, 6, 8), bg = grp(bgP, 0, -6, -8); bgP.rotation.x = st === 'poncho' ? -0.3 : -0.05;
    const lum = new THREE.Color(HC).getHSL({}).l, pale = lum > 0.62, BCm = pale ? shade(HC, 0.92) : HC, BDm = pale ? shade(HC, 0.8) : BD, mc = pale ? HC : new THREE.Color(HC).offsetHSL(0, 0.03, 0.13).getHex();
    const bz = (y) => (st === 'poncho' && y < -40 ? (y + 40) * 0.31 : 0);
    const room = (HIP + 60) / HS - 22, cap = (L, k) => Math.min(L, room / k);
    // style: length, half width down it, thickness down it, locks across, hem shape, how deep the grooves are, how much the hem scallops
    const ST0 = {
      long: { L: cap(72 * bl, 1), W: [[0, 21], [0.22, 23.5], [0.55, 20], [0.82, 12], [1, 6]], T: [[0, 11], [0.3, 13], [0.75, 9.5], [1, 7]], N: 7, hem: (u) => 1 - 0.28 * u * u, A: 0.34, S: 0.14 },
      round: { L: 52 * bl, W: [[0, 22], [0.28, 28.5], [0.62, 27.5], [0.9, 21], [1, 15]], T: [[0, 12], [0.3, 16], [0.8, 13], [1, 10]], N: 7, hem: (u) => 1 - 0.14 * u * u, A: 0.3, S: 0.12 },
      forked: { L: cap(68 * bl, 1), W: [[0, 21], [0.25, 22.5], [0.6, 19.5], [1, 16]], T: [[0, 11], [0.3, 12.5], [1, 8]], N: 6, hem: (u) => 0.6 + 0.4 * Math.exp(-(((Math.abs(u) - 0.45) / 0.28) ** 2)), A: 0.34, S: 0.1 },
      short: { L: 27 * bl, W: [[0, 21], [0.45, 22.5], [1, 17]], T: [[0, 9], [0.5, 10], [1, 8]], N: 5, hem: (u) => 1 - 0.22 * u * u, A: 0.3, S: 0.16 },
      wizard: { L: cap(96 * bl, 1), W: [[0, 20], [0.2, 20.5], [0.5, 13], [0.8, 6], [1, 2.4]], T: [[0, 11], [0.3, 11], [0.7, 7], [1, 3]], N: 5, hem: (u) => 1 - 0.1 * u * u, A: 0.34, S: 0.06 },
      curly: { L: 48 * bl, W: [[0, 22], [0.3, 27], [0.7, 24.5], [1, 16]], T: [[0, 12], [0.3, 15], [1, 12]], N: 9, hem: (u) => 1 - 0.14 * u * u, A: 0.6, S: 0.14, curly: true },
      braid: { L: 22 * bl, W: [[0, 21], [0.5, 21.5], [1, 15]], T: [[0, 9], [1, 7.5]], N: 5, hem: (u) => 1 - 0.2 * u * u, A: 0.3, S: 0.14 },
      twin: { L: 20 * bl, W: [[0, 21], [0.5, 21.5], [1, 16]], T: [[0, 9], [1, 7.5]], N: 5, hem: (u) => 1 - 0.18 * u * u, A: 0.3, S: 0.14 },
    }[BE];
    let front = null;
    if (ST0) {
      const P = ST0, Y0 = 6, top = (u) => Y0 + 13 * Math.abs(u) ** 1.6;   // the top edge: under the nose in the middle, up to the brim beside the ears
      const lockAt = (u, v) => { const q = ((u + 1) / 2) * P.N + 0.22 * v * Math.sin(v * 5.2 + u * 1.7); return [q, Math.sin(Math.PI * (q - Math.floor(q)))]; };
      const bottom = (u) => Y0 - P.L * P.hem(u) * (1 - P.S * (1 - lockAt(u, 1)[1]));
      const F = (u, v) => {
        const yt = top(u), yb = bottom(u), y = yt + (yb - yt) * v, t = Math.max(0, (Y0 - y) / P.L);
        // on the face it lies on the head; from the jaw down it hangs as a curtain in front of the neck and chest, wrapping back at the sides
        const H = headPt(u * 1.5, y, 0.2), hw = prof(P.W, t) * bw, w = sstep(12, -2, y);
        const cx = hw * Math.sin((u * Math.PI) / 2), cz = HF - 1.5 - 17 * u * u + bz(y);
        const x = H[0] + (cx - H[0]) * w, z = H[2] + (cz - H[2]) * w;
        const n = new THREE.Vector3(H[3] * (1 - w) + Math.sin(u * 1.4) * w, H[4] * (1 - w), H[5] * (1 - w) + Math.cos(u * 1.4) * w).normalize();
        // thick in the middle, rounded off at the sides, the hem and the top; the middle comes in gently under the moustache
        const len = yt - yb, fromTop = yt - y, fromHem = y - yb, ramp = 2.5 + 12 * (1 - Math.abs(u)) ** 2, R = Math.min(6, len * 0.3);
        let T = prof(P.T, t) * Math.pow(Math.max(0, 1 - u * u), 0.25) * sstep(0, ramp, fromTop) * Math.sqrt(Math.max(0, 1 - Math.max(0, 1 - fromHem / R) ** 2));
        const [q, pl] = lockAt(u, v); let k = pl;
        if (P.curly) { const r = fromTop / 8 + 0.5 * Math.floor(q); k = Math.pow(pl * Math.sin(Math.PI * (r - Math.floor(r))), 0.8); }   // round knobs, staggered row to row
        T *= 1 - P.A + P.A * Math.sqrt(k);
        return [x, y, z, n.x, n.y, n.z, T, P.curly ? 0.55 + 0.45 * Math.sqrt(k) : 0.68 + 0.32 * Math.pow(k, 0.6)];
      };
      const key = 'beard' + JSON.stringify([BE, Math.round(bl * 20), Math.round(bw * 20), Math.round(HF * 4), st === 'poncho', Math.round(room)]);
      front = shell(bg, BCm, key, P.N * (P.curly ? 9 : 8), P.curly ? 72 : 44, F);
      if (BE === 'braid') plait(bg, [[0, -10, z0 + 4], [0, -26, z0 + 4.4 + bz(-26)], [0, -44 * bl, z0 + 4 + bz(-44 * bl)], [0.6, -54 * bl, z0 + 3.4 + bz(-54 * bl)]], 6, BCm, BDm);
      if (BE === 'twin') for (const s of [-1, 1]) plait(bg, [[s * 8, -8, z0 + 3.4], [s * 9, -22, z0 + 4 + bz(-22)], [s * 9.6, -38 * bl, z0 + 3.6 + bz(-38 * bl)], [s * 10, -48 * bl, z0 + 3 + bz(-48 * bl)]], 5, BCm, BDm);
    }
    // the front of the beard at (x, y), so the moustache can lie on it rather than sink into it
    const frontZ = (x, y) => { if (!front) return -1e9; let best = 1e9, z = -1e9; for (const p of front) { const d = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (d < best) { best = d; z = p[2]; } } return best < 16 ? z : -1e9; };
    const MS = {
      droop: [[[0.4, 6.2, 22.6], [6, 5.2, 22], [11, 1.8, 20.2], [14, -3.6, 18.4], [15.2, -8.6, 17]], [[3.4, 3.2], [3.8, 3.4], [3.1, 2.8], [2, 1.9], [0.9, 0.9]], 0.8],
      handlebar: [[[0.4, 6, 22.6], [6.6, 5.6, 21.8], [12.4, 5, 19.8], [16.4, 6.8, 17.6], [17.6, 10.2, 16.6], [15.8, 12, 16.4]], [[3, 2.8], [3.2, 3], [2.4, 2.2], [1.7, 1.6], [1.3, 1.2], [1, 1]], 1],
      walrus: [[[0.4, 4.6, 23.4], [5.4, 3.4, 23], [9.8, -0.8, 21.8], [11.6, -6, 20.4]], [[4.8, 4.2], [5.6, 4.6], [5, 4], [3.8, 3.2]], 1.4],
      curl: [[[0.4, 6, 22.6], [6.6, 5.2, 21.8], [12.2, 2.4, 20], [14.8, -2.2, 18.6], [13.4, -5.6, 18.4], [10.6, -5, 19], [11, -2.4, 19.4]], [[3, 2.8], [3.2, 3], [2.6, 2.4], [2, 1.9], [1.6, 1.5], [1.2, 1.2], [1, 1]], 1],
    }[ST];
    if (MS) { const pts = MS[0].map((q, i) => [q[0], q[1], Math.max(q[2], frontZ(q[0], q[1]) + MS[1][i][1] * 0.55)]);
      for (const s of [-1, 1]) sweep(bg, mc, pts.map((q) => [s * q[0], q[1], q[2]]), MS[1], { ref: [0, 1, 0], cap: [1, MS[2]] }); }
  }
  // ---- hair: it comes out from under the brim all round the back and sides, so the hat looks pulled down over it
  {
    const hc = HC, hd = shade(HC, 0.82), back = -(18 * WZ + 1.5) / HS;
    // a skirt of hair under the brim, from behind one ear round the back to behind the other. L(u): how far down it comes;
    // short hair stays on the head down to the nape, long hair (hang) carries on down the back
    const nape = (side, mid) => (u) => side + (mid - side) * Math.pow(Math.cos((u * Math.PI) / 2), 1.2);
    const skirt = (key, L, Tk, N, S, flare = 0, hang = false) => shell(head, hc, 'hair' + key + Math.round(back * 4), N * 8, 36, (u, v) => {
      const th = Math.PI + u * (Math.PI - 1.72), q = ((u + 1) / 2) * N + 0.18 * v * Math.sin(v * 4 + u * 2), pl = Math.sin(Math.PI * (q - Math.floor(q)));
      const yt = 20.6, yb = yt - L(u) * (1 - S * (1 - pl)), y = yt + (yb - yt) * v, H = headPt(th, y, 0.3);
      // below the back of the head it hangs down the back
      const w = hang ? sstep(6, -6, y) : 0, cx = Math.sin(th) * 20 * (0.9 + 0.1 * Math.abs(Math.sin(th))), cz = Math.min(H[2], back - 1.2) - 3 * Math.cos(th) * 0;
      const x = H[0] + (cx - H[0]) * w, z = H[2] + (cz - H[2]) * w, n = new THREE.Vector3(H[3] * (1 - w) + Math.sin(th) * 0.4 * w, H[4] * (1 - w), H[5] * (1 - w) - w).normalize();
      const len = yt - yb, fromHem = y - yb, R = Math.min(5, len * 0.35);
      const T = Tk(v) * Math.pow(Math.max(0, 1 - u ** 8), 0.5) * Math.sqrt(Math.max(0, 1 - Math.max(0, 1 - fromHem / R) ** 2)) * (0.7 + 0.3 * Math.sqrt(pl)) + flare * v * v * Math.min(1, fromHem / 2);
      return [x, y, z, n.x, n.y, n.z, T, 0.7 + 0.3 * Math.pow(pl, 0.6)];
    });
    switch (HAIR.id) {
      case 'tufts': skirt('tufts', nape(9, 24), (v) => 2.4 + 2 * v, 11, 0.45, 3); break;   // short and tufted, the ends flicking out
      case 'braids': { skirt('braids', nape(7, 24), (v) => 2.6, 9, 0.3);
        const zf = HF + (st === 'poncho' ? 7.5 : 3.4); for (const s of [-1, 1]) plait(head, [[s * 17, 18, -12], [s * 21.4, 9, -11], [s * 24.6, -1, -4], [s * 23.6, -10, zf - 3], [s * 22.4, -24, zf + 0.4], [s * 21.6, -36, zf + 1.4]], 11, hc, hd); break; }   // from behind the ears, forward over the shoulders
      case 'pigtails': skirt('pig', nape(7, 24), (v) => 2.6, 9, 0.3);
        for (const s of [-1, 1]) { add(head, G.cyl, red, 7.4, 3.4, 7.4, s * 19, 15, -12.2).rotation.z = s * PI / 2;   // a bunch tied behind each ear
          sweep(head, s > 0 ? hc : hd, [[s * 17, 15, -11.6], [s * 23, 15, -13.6], [s * 29, 12, -15.4], [s * 33.4, 6, -16], [s * 35, 0.4, -15]], [[4.6, 4.2], [7, 6], [7.2, 6], [4.8, 4.2], [1.6, 1.4]], { ref: [0, 0, 1], cap: [1, 0.9] }); } break;
      case 'long': skirt('long', (u) => 12 + 44 * (1 - Math.abs(u) ** 3), (v) => 3.6 + 1.4 * Math.sin(v * Math.PI), 9, 0.12, 0, true); break;   // down the back to the shoulder blades, short behind the ears
      case 'pony': { skirt('pony', nape(8, 22), (v) => 2.4, 9, 0.2);   // gathered at the back of the head and hanging down the back
        const zt = Math.min(-21, back - 2.6);
        add(head, G.cyl, red, 9, 4, 9, 0, 10, -20.4).rotation.x = PI / 2 - 0.5;
        sweep(head, hc, [[0, 10, -19.4], [0, 5, zt - 3], [0, -10, zt - 2.4], [0, -24, zt - 1], [0, -34, zt + 0.4]], [[4.6, 4.2], [7.2, 6.2], [6.6, 5.4], [4.6, 3.8], [1.6, 1.4]], { ref: [1, 0, 0], cap: [1, 0.9] }); break; }
      default: break;
    }
  }
  // ---- what sits on the nose or sticks out of the beard
  switch (F.id) {
    case 'specs': for (const s of [-1, 1]) add(head, G.tor, F.a, 13, 13, 9, s * 8.4, 17.5, 22.5); add(head, G.box, F.a, 5, 1.5, 1.5, 0, 18.6, 23); for (const s of [-1, 1]) add(head, G.box, F.a, 1.3, 1.5, 20, s * 15.6, 18, 13); break;
    case 'shades': for (const s of [-1, 1]) add(head, G.ball, F.a, 14.5, 10, 3, s * 8.6, 17.4, 22.4); add(head, G.box, F.a, 6, 2, 2, 0, 19, 22.6); for (const s of [-1, 1]) add(head, G.box, F.a, 1.4, 2, 20, s * 16, 18.4, 13); break;
    case 'monocle': add(head, G.tor, F.a, 15, 15, 9, 9, 17.5, 22.6); add(head, G.cyl, 0xbfe4ee, 12, 0.5, 12, 9, 17.5, 22.4).rotation.x = PI / 2; add(head, G.box, F.a, 0.9, 20, 0.9, 16.6, 7.5, 20.6).rotation.z = 0.1; break;
    case 'cigar': add(head, G.cyl, F.a, 5, 18, 5, 8, 4.6, 26).rotation.x = PI / 2 - 0.15; add(head, G.ball, F.b, 6, 6, 6, 8, 6, 35, 1.6); break;
    case 'pipe': add(head, G.cyl, F.a, 2.6, 17, 2.6, 8, 3.6, 26).rotation.x = PI / 2 - 0.3; add(head, G.cyl, F.a, 8.5, 9, 8.5, 8, 4.4, 35.5); add(head, G.cyl, 0x1c1a20, 6, 1, 6, 8, 9, 35.5); add(head, G.ball, F.b, 4.4, 2.4, 4.4, 8, 9.4, 35.5, 1.4); break;
    default: break;
  }
  // ---- the hat. It sits at the top of the nose and hides everything above it.
  const HA = HCI.c !== undefined ? HCI.c : H.a, HB = H.b, hat = R.hat = grp(head, 0, 21, 0);
  const hh = 1 + 0.4 * SV.hatH, flop = 1 + SV.hatF, brimW = 6 + 7 * (SV.brim + 1);
  const colOf = (i, n) => (HP === 'stripes' ? (i % 2 ? HB : HA) : HP === 'dip' && i >= n - 2 ? HB : HA);
  // A soft crown swept up a spine that leans as it rises: p0 is where it stands, bend(i) how much each of n lengths of it
  // tips. One smooth piece of cloth (clothTube), coloured per length so stripes and dipped tips keep their old layout.
  const banded = HP === 'band' && ['gnome', 'straight', 'curl', 'stocking', 'wizard', 'halo'].includes(H.id);
  const cone = (h, n, r0, r1, bend, p0 = [0, 0, 0], col = colOf, band = banded) => {
    const p = new THREE.Vector3(p0[0], p0[1], p0[2]), q = new THREE.Quaternion(), up = new THREE.Vector3(), L = h / n, pts = [p.toArray()];
    for (let i = 0; i < n; i++) { const b = bend(i); q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(b[0], 0, b[1]))); up.set(0, 1, 0).applyQuaternion(q); p.addScaledVector(up, L); pts.push(p.toArray()); }
    const bs = [4.5 / h, 11.5 / h], inBand = (s) => band && s > bs[0] && s < bs[1];
    const radAt = (s) => (r0 + (r1 - r0) * s) * (inBand(s) ? 1.035 : 1), colAt = (s) => (inBand(s) ? HB : col(Math.min(n - 1, Math.floor(s * n)), n));
    const edges = []; for (let i = 1; i < n; i++) edges.push(i / n); if (band) edges.push(...bs);
    const key = 'hat' + JSON.stringify([pts.map((v) => v.map((x) => Math.round(x * 10))), r0, r1, n, Array.from({ length: n }, (_, i) => col(i, n)), band && HB]);
    const T = clothTube(hat, key, pts, radAt, colAt, edges);
    if (band) { const B = T.surf(8 / h, new THREE.Vector3(0, 0, 1)), m = add(hat, G.box, 0xc9a43a, 8, 6, 2, B.p.x, B.p.y, B.p.z); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), B.n); }   // the buckle on the band
    return T;
  };
  // a felt brim turned round the base, its edge rolled and gently waved
  const brim = (r0, e = brimW) => { const R = r0, E = e;
    clothRing(hat, 'brim' + [R, E, HA].join('/'), [[R - 3, 4.6], [R - 3, -1.6], [R + 0.6, -2.8], [R + E * 0.55, -2.4], [R + E - 0.6, -1.4], [R + E + 0.8, 0.2], [R + E + 0.4, 1.8], [R + E - 1, 2.2], [R + E * 0.5, 1.6], [R + 0.4, 2.8]], true,
      (t, ph, i) => shade(HA, i >= 4 && i <= 6 ? 0.92 : 1), (t, ph, i) => [0, (i >= 3 && i <= 7 ? 1 : i >= 2 && i <= 8 ? 0.5 : 0) * 1.1 * Math.sin(5 * ph + 1)]); };
  // spots, stars and patches sewn onto the lower crown, each laid flat on the cloth where it sits
  const scatter = (T, sMax) => {
    if (!['spots', 'stars', 'patches'].includes(HP) || !T.surf) return;
    for (let k = 0; k < 11; k++) { const a = k * 2.4 + 0.4, S = T.surf(0.1 + (((k * 7) % 5) / 4) * (sMax - 0.1), new THREE.Vector3(Math.sin(a), 0, Math.cos(a))), g = grp(hat, S.p.x, S.p.y, S.p.z); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), S.n);   // laid flat on the cloth
      if (HP === 'spots') add(g, G.cyl, HB, 7.4, 0.8, 7.4, 0, 0, 0).rotation.x = PI / 2;   // a flat disc (a squashed ball would shade like a bead)
      else if (HP === 'stars') for (let j = 0; j < 5; j++) add(g, G.cone, 0xffcd5a, 2.6, 4.4, 1.2, Math.sin(j * 1.2566) * 2.4, Math.cos(j * 1.2566) * 2.4, 0.5).rotation.z = -j * 1.2566;
      else { const m = rbox(g, k % 2 ? HB : shade(HA, 0.72), 7.4, 6.6, 1.4, 0, 0, -0.1, 0.6); m.rotation.z = (k % 3 - 1) * 0.3; } }
  };
  let tipAt = null;
  const R0 = 25.5;
  switch (H.id) {
    case 'gnome': brim(R0); tipAt = cone(78 * hh, 7, R0, 2.4, (i) => [-0.03 * flop * i, 0.085 * flop * i]); scatter(tipAt, 0.42); break;
    case 'halo': brim(R0); tipAt = cone(70 * hh, 6, R0, 2.4, (i) => [-0.03 * flop * i, 0.06 * flop * i]); scatter(tipAt, 0.42); { const m = add(hat, G.tor, HB, 40, 40, 26, tipAt.p.x, tipAt.p.y + 10, tipAt.p.z, 1.6); m.rotation.x = PI / 2; } break;
    case 'straight': brim(R0, brimW * 0.6); tipAt = cone(84 * hh, 4, R0, 1.6, () => [0, 0]); scatter(tipAt, 0.38); break;
    case 'curl': brim(R0, brimW * 0.7); tipAt = cone(74 * hh, 8, R0, 2.6, (i) => (i < 3 ? [0, 0] : [0.52 * flop, 0])); scatter(tipAt, 0.25); break;
    case 'stocking': tipAt = cone(112 * hh, 9, R0, 3, (i) => (i < 1 ? [0, 0] : [-0.04, 0.34 * Math.min(flop, 1.25 - 0.15 * SV.hatH)]), [0, 0, 0], colOf, false);   // however floppy, the tip hangs beside the head, never down over the face scatter(tipAt, 0.28);   // a ribbed knit cuff turned up round it
      clothRing(hat, 'cuff' + HB, [[R0 - 2, 9], [R0 - 2, -1.4], [R0 + 1.6, -1.8], [R0 + 3.2, 0.6], [R0 + 3.6, 4], [R0 + 3.2, 7.6], [R0 + 1.4, 9.4]], true, (t, ph) => shade(HB, 0.84 + 0.16 * Math.cos(30 * ph)), (t, ph, i) => [i >= 2 && i <= 5 ? 0.45 * Math.cos(30 * ph) : 0, 0]); break;
    case 'wizard': { const W = R0 + 14 + brimW;   // a wide soft brim that droops and waves toward its edge
      clothRing(hat, 'wbrim' + [W, HA].join('/'), [[R0 - 4, 4], [R0 - 4, 0], [R0 + 2, -0.6], [W * 0.75, -1.2], [W - 0.6, -1.6], [W + 0.6, -0.4], [W - 0.2, 0.9], [W * 0.75, 0.6], [R0 + 2, 2.2]], true, (t, ph, i) => shade(HA, i >= 4 && i <= 6 ? 0.9 : 1),
        (t, ph, i) => { const k = i >= 3 && i <= 7 ? (i === 3 || i === 7 ? 0.55 : 1) : 0; return [0, -k * (2.6 + 1.8 * Math.sin(3 * ph + 0.6))]; });
      tipAt = cone(76 * hh, 6, R0 - 1.5, 2.2, (i) => (i === 3 ? [-0.5 * flop, 0.2] : i > 3 ? [-0.12 * flop, 0.05] : [0, 0])); scatter(tipAt, 0.4); break; }
    case 'jester': add(hat, G.dome, HB, 53, 30, 49, 0, 0, 0); add(hat, G.cyl, HA, 54, 6, 50, 0, 3, 0); for (const s of [-1, 1]) { const t = cone(54 * hh, 6, 14, 2, (i) => [0, -s * (i === 0 ? 0.6 : 0.24 * flop)], [s * 8, 6, 0], () => (s > 0 ? HA : HB), false); add(hat, G.ball, 0xffcd5a, 8, 8, 8, t.p.x, t.p.y, t.p.z); add(hat, G.ball, 0x3a2a22, 2.4, 2.4, 2.4, t.p.x, t.p.y - 3.4, t.p.z + 1.4); } break;
    case 'mushroom': { const Hh = 25 * hh, P = []; for (let k = 0; k <= 12; k++) { const e = (k / 12) * (Math.PI / 2); P.push([k === 12 ? 0 : 42 * Math.cos(e), 1 + Hh * Math.sin(e)]); }   // a smooth turned cap
      clothRing(hat, 'mush' + [HA, Math.round(hh * 20)].join(':'), P, false, () => HA);
      add(hat, G.cyl, 0xf2e8d5, 82, 3.4, 76, 0, 1, 0); add(hat, G.tor, HA, 84, 78, 12, 0, 2, 0).rotation.x = PI / 2;
      for (let k = 0; k < 9; k++) { const a = k * 2.4, e = 0.35 + (k % 3) * 0.26, p = new THREE.Vector3(42 * Math.cos(e) * Math.sin(a), 1 + Hh * Math.sin(e), 38.64 * Math.cos(e) * Math.cos(a)), n = new THREE.Vector3(p.x / 1764, (p.y - 1) / (Hh * Hh), p.z / 1493).normalize(), d = 13 - (k % 3) * 2;
        const g = grp(hat, p.x, p.y, p.z); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n); add(g, G.cyl, HB, d, 1, d, 0, 0, 0.2).rotation.x = PI / 2; }   // spots lying flat on it
      break; }
    case 'acorn': add(hat, G.dome, HA, 58, 44 * hh, 54, 0, 0, 0); add(hat, G.cyl, shade(HA, 0.8), 60, 5, 56, 0, 2.5, 0); for (let k = 1; k < 4; k++) { const e = k * 0.36, m = add(hat, G.tor, HB, 58 * Math.cos(e), 54 * Math.cos(e), 16, 0, 22 * hh * Math.sin(e), 0); m.rotation.x = PI / 2; } { const st = add(hat, G.cyl, HB, 5, 10, 5, 2, 22 * hh + 3, 0); st.rotation.z = -0.3; add(hat, G.ball, 0x4f8a3a, 14, 2.4, 8, 9, 22 * hh + 6, 0).rotation.z = 0.3; } break;
    case 'pot': add(hat, G.cyl, HA, 56, 34 * hh, 52, 0, 17 * hh, 0); add(hat, G.tor, HB, 57, 53, 16, 0, 1.5, 0).rotation.x = PI / 2; add(hat, G.cyl, shade(HA, 0.8), 57, 2.4, 53, 0, 34 * hh, 0); for (const s of [-1, 1]) add(hat, G.tor, HB, 15, 12, 30, s * 30, 22 * hh, 0); add(hat, G.ball, shade(HA, 0.7), 9, 7, 3, 14, 20 * hh, 24.6); break;
    case 'horns': add(hat, G.dome, HA, 55, 46 * hh, 51, 0, 2, 0); add(hat, G.cyl, 0xc9a43a, 56.4, 6, 52.4, 0, 4, 0); add(hat, G.box, 0xc9a43a, 5, 24 * hh, 52.6, 0, 13 * hh, 0); for (const s of [-1, 1]) { const h = add(hat, G.cone, HB, 13, 30, 13, s * 30, 16, 0); h.rotation.z = -s * 0.75; add(hat, G.cyl, 0xc9a43a, 14, 4, 14, s * 24.6, 9.6, 0).rotation.z = -s * 0.75; } break;
    case 'visor': add(hat, G.dome, HB, 54, 40, 49, 0, 0, 0); add(hat, G.cyl, shade(HB, 1.4), 55, 5, 50, 0, 2.5, 0); { const v = add(hat, G.cyl, HA, 48, 2, 40, 0, 1.4, 27, 0.25); v.rotation.x = 0.16; } break;
    case 'cowboy': case 'whitehat': {
      add(hat, G.cyl, HA, 82, 3, 70, 0, 2, 0);                                                                                   // brim, curled up at the sides and dipped front and back
      for (const s of [-1, 1]) { const c = add(hat, G.ball, HA, 17, 9, 58, s * 36.5, 6, 0); c.rotation.z = s * 0.6; add(hat, G.ball, shade(HA, 0.8), 6, 4, 50, s * 40.5, 9.6, 0).rotation.z = s * 0.6; }
      for (const z of [-1, 1]) add(hat, G.ball, HA, 44, 5, 15, 0, 1.4, z * 31).rotation.x = z * 0.14;
      add(hat, taper(0.42, 0.5), HA, 50, 21, 44, 0, 13.5, 0); for (const s of [-1, 1]) add(hat, G.ball, HA, 19, 10, 39, s * 8.6, 24, -1); add(hat, G.ball, shade(HA, 0.72), 8, 4, 30, 0, 26.4, -1);   // a crown pinched into a crease
      add(hat, G.cyl, HB, 51, 5, 45, 0, 6, 0);
      if (H.id === 'whitehat') { for (let k = 0; k < 5; k++) add(hat, G.cone, HB, 3.4, 5, 1.6, Math.sin(k * 1.2566) * 3.6, 6 + Math.cos(k * 1.2566) * 3.6, 22.9).rotation.z = -k * 1.2566; }
      else { add(hat, G.box, 0xc9a43a, 5.4, 4.4, 1.6, 13, 6, 21.4); const q = add(hat, G.cone, 0xf2e8d5, 5, 22, 2, -24, 17, 6); q.rotation.z = 0.5; add(hat, G.cone, 0xc8211b, 2.4, 9, 2.2, -27.4, 22.6, 6).rotation.z = 0.5; }   // a buckle, and a feather in the band
      break; }
    case 'cap': add(hat, G.dome, HA, 54, 38, 49, 0, 0, 0); add(hat, G.cyl, shade(HA, 0.8), 54.6, 3, 49.6, 0, 1.5, 0); { const b = add(hat, G.cyl, HA, 42, 2.4, 34, 0, 1.6, 26); b.rotation.x = 0.1; } add(hat, G.dome, HB, 30, 28, 49.6, 0, 1, 0.6); add(hat, G.ball, HB, 5, 3, 5, 0, 19, 0); break;
    case 'bowler': add(hat, G.cyl, HA, 70, 3, 62, 0, 2, 0); add(hat, G.tor, HA, 69, 61, 16, 0, 2.6, 0).rotation.x = Math.PI / 2; add(hat, G.dome, HA, 52, 50, 47, 0, 3, 0); add(hat, G.cyl, HB, 53, 5, 48, 0, 6, 0); add(hat, G.box, shade(HB, 0.7), 2, 6, 6, 26.6, 6, 0); break;
    case 'beanie':   // knitted: a soft crown ribbed all the way up, and a deeper-ribbed cuff folded up round the bottom
      clothRing(hat, 'beanie' + HA, [[26.8, -1], [27.6, 10], [27.4, 14], [26.4, 19], [23.6, 24], [18.6, 28], [11.4, 30.6], [4, 31.6], [0, 31.8]], false, (t, ph, i) => shade(HA, 0.86 + 0.14 * Math.cos(36 * ph)), (t, ph, i) => [i < 7 ? 0.3 * Math.cos(36 * ph) : 0, 0]);
      clothRing(hat, 'bcuff' + HA, [[26.4, 11], [26.4, -1.6], [28.4, -2], [29.4, 1], [29.6, 5], [29.2, 9], [28, 11.4]], true, (t, ph) => shade(HA, 0.72 + 0.2 * Math.cos(28 * ph)), (t, ph, i) => [i >= 2 && i <= 5 ? 0.55 * Math.cos(28 * ph) : 0, 0]);
      add(hat, G.ball, HB, 14, 13, 14, 0, 34.6, 0); break;
    case 'tophat': add(hat, G.cyl, HA, 72, 4, 64, 0, 2, 0); add(hat, taper(0.52, 0.46), HA, 48, 50, 44, 0, 28, 0); add(hat, G.cyl, HB, 46, 8, 42, 0, 9, 0); break;
    case 'sombrero': add(hat, G.cyl, HA, 120, 5, 110, 0, 2, 0); add(hat, G.tor, HB, 118, 108, 30, 0, 5, 0).rotation.x = Math.PI / 2; add(hat, G.cone, HA, 46, 42, 42, 0, 24, 0); add(hat, G.cyl, HB, 44, 6, 40, 0, 7, 0); break;
    case 'miner': add(hat, G.dome, HA, 57, 46, 52, 0, 1, 0); add(hat, G.cyl, HA, 66, 3.4, 60, 0, 2, 0); add(hat, G.box, shade(HA, 0.8), 6, 3, 50, 0, 22.6, 0); add(hat, G.cyl, 0x3a3a40, 16, 8, 16, 0, 12, 25).rotation.x = Math.PI / 2; add(hat, G.cyl, HB, 12, 3, 12, 0, 12, 30, 1.8).rotation.x = Math.PI / 2; break;
    case 'fez': add(hat, taper(0.42, 0.5), HA, 40, 30, 38, 0, 16, 0); add(hat, G.box, HB, 2, 22, 2, 14, 24, 10); add(hat, G.ball, HB, 7, 7, 7, 14, 12, 10); break;
    case 'cone': add(hat, G.box, HA, 56, 5, 56, 0, 2, 0); add(hat, G.cone, HA, 42, 62, 42, 0, 34, 0); add(hat, taper(0.3, 0.38), HB, 42, 10, 42, 0, 28, 0); break;
    case 'crown': add(hat, G.dome, HB, 52, 36, 47, 0, 2, 0); add(hat, G.cyl, HA, 53, 13, 48, 0, 6, 0); for (let i = 0; i < 6; i++) { const a = (i + 0.5) / 6 * Math.PI * 2; add(hat, G.ball, i % 2 ? 0x2a6ad0 : 0x2aa05a, 5, 5, 4, Math.sin(a) * 26, 6, Math.cos(a) * 23.6, 0.6); } for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; add(hat, G.cone, HA, 10, 16, 10, Math.sin(a) * 23.5, 20, Math.cos(a) * 21); add(hat, G.ball, 0xfff4d8, 4, 4, 4, Math.sin(a) * 23.5, 29, Math.cos(a) * 21); } add(hat, G.ball, HB, 9, 9, 6, 0, 7, 24, 0.8); break;
    default: break;
  }

  // something on the tip, for the hats that come to one
  if (tipAt && TIP !== 'none') {
    const t = grp(hat, tipAt.p.x, tipAt.p.y, tipAt.p.z);
    switch (TIP) {
      case 'pompom': add(t, G.ball, 0xf2e8d5, 14, 14, 14, 0, 2, 0); break;
      case 'bell': add(t, G.ball, 0xffcd5a, 10, 10, 10, 0, -2, 0); add(t, G.box, 0x3a2a22, 6, 1.4, 1.4, 0, -5.4, 4.4); add(t, G.ball, 0x3a2a22, 2.4, 2.4, 2.4, 0, -7.6, 0); break;
      case 'star': for (let j = 0; j < 5; j++) add(t, G.cone, 0xffcd5a, 6, 11, 3, Math.sin(j * 1.2566) * 6, 4 + Math.cos(j * 1.2566) * 6, 0, 0.5).rotation.z = -j * 1.2566; add(t, G.cyl, 0xffcd5a, 9, 3, 9, 0, 4, 0, 0.5).rotation.x = PI / 2; break;
      case 'tassel': add(t, G.box, HB, 1.6, 14, 1.6, 0, -7, 0); add(t, G.ball, HB, 6, 6, 6, 0, -1, 0); add(t, G.cone, HB, 7, 12, 7, 0, -19, 0); break;
      case 'flower': for (let j = 0; j < 6; j++) add(t, G.ball, 0xe86a9a, 7, 7, 4, Math.sin(j * 1.047) * 5.4, 3 + Math.cos(j * 1.047) * 5.4, 0); add(t, G.ball, 0xffcd5a, 6, 6, 5, 0, 3, 1); break;
      case 'lantern': add(t, G.box, 0x3a3a40, 1.4, 8, 1.4, 0, -4, 0); add(t, G.cyl, 0x3a3a40, 9, 2, 9, 0, -8, 0); add(t, G.cyl, 0xffe27a, 7.5, 9, 7.5, 0, -13.4, 0, 1.6); add(t, G.cyl, 0x3a3a40, 9, 2, 9, 0, -18.6, 0); break;
      default: break;
    }
  }
  // ---- back
  const back = grp(body, 0, 36, -22);
  switch (B.id) {
    case 'pack': add(back, G.cyl, B.a, 26, 60, 26, 0, 10, -8).rotation.z = Math.PI / 2; for (const x of [-16, 16]) add(back, G.cyl, B.b, 27, 5, 27, x, 10, -8).rotation.z = Math.PI / 2; break;
    case 'shotgun': { const g = grp(back, 0, 8, -6); g.rotation.z = 0.7; add(g, G.box, B.a, 8, 34, 10, 0, -34, 0); add(g, G.cyl, B.b, 7, 70, 7, 0, 18, 0); add(g, G.box, B.a, 9, 24, 9, 0, 4, 0); break; }
    case 'guitar': { const g = grp(back, 0, 0, -8); g.rotation.z = -0.6; add(g, G.cyl, B.a, 40, 10, 40, 0, -14, 0).rotation.x = Math.PI / 2; add(g, G.cyl, B.a, 30, 10, 30, 0, 12, 0).rotation.x = Math.PI / 2; add(g, G.cyl, 0x140d12, 12, 11, 12, 0, -8, 0).rotation.x = Math.PI / 2; add(g, G.box, B.b, 7, 60, 6, 0, 54, 0); add(g, G.box, B.b, 11, 14, 6, 0, 88, 0); break; }
    case 'cape': { const c = R.cape = grp(back, 0, 24, 0);   // cloth from the shoulders: round the back, flaring to the hem in folds that deepen as it falls
      shell(c, null, 'cape' + [B.a, B.b].join(':'), 48, 40, (u, v) => {
        const y = -v * 86 - (v > 0.97 ? 1.4 * Math.sin(u * 9) : 0), hw = 30 + 7 * v, x = u * hw, z = -4 - 7 * (1 - u * u) * (0.35 + 0.65 * (1 - v)) - 1.8 * v * Math.cos(u * Math.PI * 3.5);
        const n = new THREE.Vector3(2 * u * 7 / hw * (0.35 + 0.65 * (1 - v)) + 1.8 * v * Math.PI * 3.5 * Math.sin(u * Math.PI * 3.5) / hw, 0.05, -1).normalize(), e = Math.min((1 - Math.abs(u)) * hw, (1 - v) * 86, v * 86 + 1.5);
        return [x, y, z, n.x, n.y, n.z, 1.3 * Math.sqrt(Math.max(0, Math.min(1, e / 0.8))), v > 0.93 ? B.b : B.a];
      });
      add(back, G.box, B.b, 64, 8, 10, 0, 24, 2); break; }
    case 'sack': add(back, G.ball, B.a, 48, 52, 40, 0, 4, -14); add(back, G.cyl, B.a, 14, 14, 14, 0, 34, -14); add(back, G.box, B.b, 6, 20, 2, 0, 4, -34.5); add(back, G.box, B.b, 14, 4, 2, 0, 10, -34.5); add(back, G.box, B.b, 14, 4, 2, 0, -2, -34.5); break;
    case 'shovel': { const g = grp(back, 0, 10, -6); g.rotation.z = -0.5; add(g, G.cyl, B.b, 5, 96, 5, 0, 0, 0); add(g, G.box, B.a, 26, 30, 4, 0, 60, 0); add(g, G.box, B.b, 18, 5, 5, 0, -48, 0); break; }
    case 'tank': for (const x of [-12, 12]) { add(back, G.cyl, B.a, 20, 54, 20, x, 10, -10); add(back, G.ball, B.a, 20, 20, 20, x, 37, -10); add(back, G.cyl, B.b, 8, 8, 8, x, 48, -10); } add(back, G.box, B.b, 50, 6, 4, 0, 10, 0); break;
    case 'tomb': add(back, G.box, B.a, 46, 54, 12, 0, 6, -8); add(back, G.cyl, B.a, 46, 12, 46, 0, 33, -8).rotation.x = Math.PI / 2; add(back, G.box, B.b, 22, 5, 2, 0, 22, -14.5); add(back, G.box, B.b, 5, 26, 2, 0, 16, -14.5); break;
    case 'wings': for (const s of [-1, 1]) { const w = R[s < 0 ? 'wingL' : 'wingR'] = grp(back, s * 10, 26, -4); for (let i = 0; i < 4; i++) { const f = add(w, G.box, i === 3 ? B.b : B.a, 14, 58 - i * 9, 4, s * (12 + i * 13), -10 - i * 5, -2); f.rotation.z = s * (0.25 + i * 0.12); } } break;
    default: break;
  }
  root.userData.rig = R; R.topY = new THREE.Box3().setFromObject(root).max.y; R.headY = HIP + 60 + 16 * HS;
  return root;
}

// walk / idle / aim pose. `speed` in world units per second.
export function animateCharacter(root, t, speed, opts = {}) {
  const R = root.userData.rig, k = Math.min(1, speed / 500), w = t * (6 + k * 7), s = Math.sin(w);
  R.legL.rotation.x = s * 0.75 * k; R.legR.rotation.x = -s * 0.75 * k;
  R.body.position.y = (R.hipY || 62) + Math.abs(Math.cos(w)) * 5 * k + Math.sin(t * 2.2) * 1.2 * (1 - k);
  R.body.rotation.z = s * 0.05 * k; R.body.rotation.x = 0.08 * k;
  R.armL.rotation.x = opts.preview ? -0.15 + Math.sin(t * 1.6) * 0.06 - s * 0.6 * k : -0.9 + s * 0.12 * k; R.armL.rotation.z = opts.preview ? -0.12 : 0.35;
  R.armR.rotation.x = -1.25 + Math.sin(t * 2.2) * 0.03 + s * 0.08 * k; R.armR.rotation.z = -0.1;
  R.gun.rotation.x = 1.25;
  R.head.rotation.y = opts.preview ? Math.sin(t * 0.7) * 0.25 : 0; R.head.rotation.z = Math.sin(t * 1.3) * 0.03 + s * 0.04 * k;
  if (R.cape) R.cape.rotation.x = 0.12 + k * 0.5 + Math.sin(t * 3) * 0.05;
  if (R.bird) R.bird.rotation.z = Math.sin(t * 3.1) * 0.08;
  if (R.wingL) { const f = Math.sin(t * 3) * 0.2; R.wingL.rotation.y = -0.3 - f; R.wingR.rotation.y = 0.3 + f; }
}
