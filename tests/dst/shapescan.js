// Inside each sculpted prop used in the destination: split its mesh into its separate pieces (connected by shared
// vertices), join pieces that touch (an edge of one crosses a face of the other, or a corner lies within EPS of it),
// and report any piece that is not joined, through others, to the prop's foot. A loose rooster, a pot off its chimney.
(() => {
  const g = __dmh, W = g.world, GEOS = W.constructor.PRIM_GEOS, EPS = window.__EPS || 2.5;
  const D = g.descent, A = D.A(), cx = A.c[0], cz = A.c[1];
  const inA = (b) => Math.abs((b.min.x + b.max.x) / 2 - cx) < A.hx + 300 && Math.abs((b.min.z + b.max.z) / 2 - cz) < A.hy + 300;
  const ids = new Map(); for (const r of W.scanAll || []) { if (r[1] || !inA(r[3])) continue; const G = GEOS[r[0]]; if (!G || !G.userData || !G.userData.shape) continue; if (!ids.has(r[0])) ids.set(r[0], r); }
  if (window.__ST) for (let i = 0; i < GEOS.length; i++) { const G = GEOS[i]; if (G && G.userData && /^st_/.test(G.userData.shape || '')) ids.set(i, [i]); }   // the stations' sculpts too (after a clear)
  const out = [];
  const t0 = performance.now();
  for (const [id, r] of ids) {
    const G = GEOS[id], P = G.attributes.position, I = G.index; if (!I) continue;
    const n = P.count, par = new Int32Array(n); for (let i = 0; i < n; i++) par[i] = i;
    const f = (i) => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; }, u = (a, b) => { a = f(a); b = f(b); if (a !== b) par[a] = b; };
    // vertices at the same spot are the same vertex (a surface's seam, a lathe's wrap)
    const key = new Map(); for (let i = 0; i < n; i++) { const k = Math.round(P.getX(i) * 20) + ',' + Math.round(P.getY(i) * 20) + ',' + Math.round(P.getZ(i) * 20); const o = key.get(k); if (o !== undefined) u(i, o); else key.set(k, i); }
    const T = I.count / 3; for (let t = 0; t < T; t++) { u(I.getX(t * 3), I.getX(t * 3 + 1)); u(I.getX(t * 3), I.getX(t * 3 + 2)); }
    const comp = new Map(); for (let i = 0; i < n; i++) { const c = f(i); let a = comp.get(c); if (!a) comp.set(c, a = { v: [], t: [], min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9] }); a.v.push(i); const p = [P.getX(i), P.getY(i), P.getZ(i)]; for (let k = 0; k < 3; k++) { a.min[k] = Math.min(a.min[k], p[k]); a.max[k] = Math.max(a.max[k], p[k]); } }
    for (let t = 0; t < T; t++) comp.get(f(I.getX(t * 3))).t.push(t);
    const C = [...comp.values()]; if (C.length < 2) continue;
    // a coarse grid of the triangles, for the touch tests
    if (!G.boundingBox) G.computeBoundingBox(); const BB = G.boundingBox, diag = BB.max.clone().sub(BB.min).length();
    const cell = Math.max(8, diag / 160), grid = new Map(), gk = (x, y, z) => x + '|' + y + '|' + z;
    const tri = (t) => { const a = I.getX(t * 3), b = I.getX(t * 3 + 1), c = I.getX(t * 3 + 2); return [[P.getX(a), P.getY(a), P.getZ(a)], [P.getX(b), P.getY(b), P.getZ(b)], [P.getX(c), P.getY(c), P.getZ(c)]]; };
    C.forEach((c, ci) => { for (const t of c.t) { const [p, q, s] = tri(t); const lo = [0, 1, 2].map((k) => Math.floor((Math.min(p[k], q[k], s[k]) - EPS) / cell)), hi = [0, 1, 2].map((k) => Math.floor((Math.max(p[k], q[k], s[k]) + EPS) / cell));
      if ((hi[0] - lo[0] + 1) * (hi[1] - lo[1] + 1) * (hi[2] - lo[2] + 1) > 60000) continue;
      for (let x = lo[0]; x <= hi[0]; x++) for (let y = lo[1]; y <= hi[1]; y++) for (let z = lo[2]; z <= hi[2]; z++) { const k = gk(x, y, z); let L = grid.get(k); if (!L) grid.set(k, L = []); L.push([ci, t]); } } });
    const cp = new Int32Array(C.length); for (let i = 0; i < C.length; i++) cp[i] = i; const cf = (i) => { while (cp[i] !== i) { cp[i] = cp[cp[i]]; i = cp[i]; } return i; };
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const ptTri = (p, [a, b, c]) => {   // distance from p to the triangle
      const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a), d1 = dot(ab, ap), d2 = dot(ac, ap); if (d1 <= 0 && d2 <= 0) return Math.hypot(...ap);
      const bp = sub(p, b), d3 = dot(ab, bp), d4 = dot(ac, bp); if (d3 >= 0 && d4 <= d3) return Math.hypot(...bp);
      const vc = d1 * d4 - d3 * d2; if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return Math.hypot(...sub(p, [a[0] + ab[0] * v, a[1] + ab[1] * v, a[2] + ab[2] * v])); }
      const cpp = sub(p, c), d5 = dot(ab, cpp), d6 = dot(ac, cpp); if (d6 >= 0 && d5 <= d6) return Math.hypot(...cpp);
      const vb = d5 * d2 - d1 * d6; if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); return Math.hypot(...sub(p, [a[0] + ac[0] * w, a[1] + ac[1] * w, a[2] + ac[2] * w])); }
      const va = d3 * d6 - d5 * d4; if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const w = (d4 - d3) / (d4 - d3 + d5 - d6); return Math.hypot(...sub(p, [b[0] + (c[0] - b[0]) * w, b[1] + (c[1] - b[1]) * w, b[2] + (c[2] - b[2]) * w])); }
      const den = 1 / (va + vb + vc), v = vb * den, w = vc * den; return Math.hypot(...sub(p, [a[0] + ab[0] * v + ac[0] * w, a[1] + ab[1] * v + ac[1] * w, a[2] + ab[2] * v + ac[2] * w])); };
    const segTri = (p, q, [a, b, c]) => { const e1 = sub(b, a), e2 = sub(c, a), d = sub(q, p), h = cr(d, e2), det = dot(e1, h); if (Math.abs(det) < 1e-9) return false; const iv = 1 / det, s = sub(p, a), uu = iv * dot(s, h); if (uu < 0 || uu > 1) return false; const qq = cr(s, e1), vv = iv * dot(d, qq); if (vv < 0 || uu + vv > 1) return false; const tt = iv * dot(e2, qq); return tt >= 0 && tt <= 1; };
    const touch = (ci, p, q) => { const lo = [0, 1, 2].map((k) => Math.floor((Math.min(p[k], q ? q[k] : p[k]) - EPS) / cell)), hi = [0, 1, 2].map((k) => Math.floor((Math.max(p[k], q ? q[k] : p[k]) + EPS) / cell)); const hit = new Set();
      for (let x = lo[0]; x <= hi[0]; x++) for (let y = lo[1]; y <= hi[1]; y++) for (let z = lo[2]; z <= hi[2]; z++) { const L = grid.get(gk(x, y, z)); if (!L) continue; for (const [cj, t] of L) { if (cj === ci || hit.has(cj) || cf(cj) === cf(ci)) continue; const tr = tri(t); if (ptTri(p, tr) <= EPS || (q && segTri(p, q, tr))) hit.add(cj); } } return hit; };
    C.forEach((c, ci) => { const step = Math.max(1, Math.floor(c.t.length / 900));
      for (let k = 0; k < c.t.length; k += step) { const t = c.t[k], [a, b, cc] = tri(t); for (const [p, q] of [[a, b], [b, cc], [cc, a]]) for (const cj of touch(ci, p, q)) { const A1 = cf(ci), B1 = cf(cj); if (A1 !== B1) cp[A1] = B1; } } });
    let zmin = 1e9; for (const c of C) zmin = Math.min(zmin, c.min[1]);   // three's Y is up
    const roots = new Set(); C.forEach((c, ci) => { if (c.min[1] <= zmin + EPS) roots.add(cf(ci)); });
    const loose = []; C.forEach((c, ci) => { if (!roots.has(cf(ci))) loose.push([Math.round((c.min[0] + c.max[0]) / 2), Math.round((c.min[2] + c.max[2]) / 2), Math.round(c.min[1]), Math.round(c.max[0] - c.min[0]), Math.round(c.max[2] - c.min[2]), Math.round(c.max[1] - c.min[1])]); });   // x, y (UE), z, sizes
    if (loose.length) out.push([G.userData.shape || ('id' + id), C.length, loose.length, loose.slice(0, 8)]);
  }
  return JSON.stringify({ shapes: ids.size, ms: Math.round(performance.now() - t0), loose: out });
})()
