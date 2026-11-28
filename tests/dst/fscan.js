// stricter floating finder: pieces are joined only if one's actual surface points lie within EPS of the other's
// oriented box (in the piece's own frame), not merely if their world bounding boxes come near. Glows are left out
// (flames and light strips hover on purpose). A group of joined pieces is held up if any point of it is on the floor.
(() => {
  const g = __dmh, W = g.world, GEOS = W.constructor.PRIM_GEOS, EPS = 1.5;
  const V3 = g.player.pos.constructor, M4 = g.camera.matrixWorld.constructor;
  const lp = {}, lb = {};
  const local = (id) => { if (lp[id]) return lp[id]; const G = GEOS[id], P = G.attributes.position, seen = new Set(), pts = [];
    for (let i = 0; i < P.count; i++) { const k = P.getX(i).toFixed(3) + ',' + P.getY(i).toFixed(3) + ',' + P.getZ(i).toFixed(3); if (!seen.has(k)) { seen.add(k); pts.push([P.getX(i), P.getY(i), P.getZ(i)]); } }
    const vs = pts.length > 240 ? pts.filter((_, i) => i % Math.ceil(pts.length / 240) === 0) : pts.slice(), cs = [];
    if (!G.boundingBox) G.computeBoundingBox(); const B0 = G.boundingBox;
    for (const ax of ['x', 'y', 'z']) for (const m of ['min', 'max']) { let best = null; for (const q of pts) { const v = q[{ x: 0, y: 1, z: 2 }[ax]]; if (best === null || (m === 'min' ? v < best[{ x: 0, y: 1, z: 2 }[ax]] : v > best[{ x: 0, y: 1, z: 2 }[ax]])) best = q; } vs.push(best); }   // the extremes always
    const I = G.index; if (I) { const st = Math.max(3, Math.floor(I.count / 120) * 3); for (let t = 0; t < I.count; t += st) { const a = I.getX(t), b = I.getX(t + 1), c = I.getX(t + 2); cs.push([(P.getX(a) + P.getX(b) + P.getX(c)) / 3, (P.getY(a) + P.getY(b) + P.getY(c)) / 3, (P.getZ(a) + P.getZ(b) + P.getZ(c)) / 3]); } }
    lp[id] = vs.concat(cs);
    if (!G.boundingBox) G.computeBoundingBox(); lb[id] = G.boundingBox; return lp[id]; };
  const L = [];
  const VA = g.descent.A(), inVil = (b) => Math.abs((b.min.x + b.max.x) / 2 - VA.c[0]) < VA.hx + 300 && Math.abs((b.min.z + b.max.z) / 2 - VA.c[1]) < VA.hy + 300;
  (W.scanAll || []).forEach((r, i) => { if (!inVil(r[3])) return; const m = new M4(); m.fromArray(r[4]); const inv = m.clone().invert(), e = r[4];
    const sc = [Math.hypot(e[0], e[1], e[2]), Math.hypot(e[4], e[5], e[6]), Math.hypot(e[8], e[9], e[10])];
    const pw = local(r[0]).map((p) => new V3(p[0], p[1], p[2]).applyMatrix4(m));
    L.push({ i, id: r[0], b: r[3], m, inv, sc, pw, st: r[5], c: r[6], glow: r[1] }); });
  const q = new V3();
  const near = (o, p) => { q.copy(p).applyMatrix4(o.inv); const B = lb[o.id]; let d = 0;
    for (const [ax, s] of [['x', 0], ['y', 1], ['z', 2]]) { const v = Math.max(0, B.min[ax] - q[ax], q[ax] - B.max[ax]) * o.sc[s]; d += v * v; } return d <= EPS * EPS; };
  const cell = 400, H = new Map(), key = (x, y, z) => x + ',' + y + ',' + z, big = [];
  for (const o of L) { const b = o.b; const c0 = [b.min.x, b.min.y, b.min.z].map((v) => Math.floor((v - EPS) / cell)), c1 = [b.max.x, b.max.y, b.max.z].map((v) => Math.floor((v + EPS) / cell));
    if ((c1[0] - c0[0] + 1) * (c1[1] - c0[1] + 1) * (c1[2] - c0[2] + 1) > 4000) { big.push(o); continue; }
    o.cells = []; for (let x = c0[0]; x <= c1[0]; x++) for (let y = c0[1]; y <= c1[1]; y++) for (let z = c0[2]; z <= c1[2]; z++) { const k = key(x, y, z); o.cells.push(k); let a = H.get(k); if (!a) H.set(k, a = []); a.push(o); } }
  const par = L.map((_, i) => i), find = (i) => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; }, idx = new Map(L.map((o, i) => [o, i]));
  const ov = (a, b) => a.b.min.x - EPS <= b.b.max.x && a.b.max.x + EPS >= b.b.min.x && a.b.min.y - EPS <= b.b.max.y && a.b.max.y + EPS >= b.b.min.y && a.b.min.z - EPS <= b.b.max.z && a.b.max.z + EPS >= b.b.min.z;
  // oriented boxes (each piece's own box, in its own frame, grown by EPS) tested for overlap by separating axes
  const obb = (o) => { if (o.ob) return o.ob; const B = lb[o.id], e = o.m.elements, ax = [0, 1, 2].map((k) => new V3(e[k * 4], e[k * 4 + 1], e[k * 4 + 2]).normalize());
    const c = new V3((B.min.x + B.max.x) / 2, (B.min.y + B.max.y) / 2, (B.min.z + B.max.z) / 2).applyMatrix4(o.m);
    const h = [(B.max.x - B.min.x) / 2 * o.sc[0] + EPS, (B.max.y - B.min.y) / 2 * o.sc[1] + EPS, (B.max.z - B.min.z) / 2 * o.sc[2] + EPS];
    return (o.ob = { c, ax, h }); };
  const t = new V3(), cr = new V3();
  const sat = (A, B) => { t.copy(B.c).sub(A.c); const axes = [...A.ax, ...B.ax];
    for (const u of A.ax) for (const v of B.ax) { cr.copy(u).cross(v); if (cr.lengthSq() > 1e-6) axes.push(cr.clone().normalize()); }
    for (const L of axes) { const ra = A.h[0] * Math.abs(A.ax[0].dot(L)) + A.h[1] * Math.abs(A.ax[1].dot(L)) + A.h[2] * Math.abs(A.ax[2].dot(L));
      const rb = B.h[0] * Math.abs(B.ax[0].dot(L)) + B.h[1] * Math.abs(B.ax[1].dot(L)) + B.h[2] * Math.abs(B.ax[2].dot(L)); if (Math.abs(t.dot(L)) > ra + rb) return false; } return true; };
  const joined = (a, b) => sat(obb(a), obb(b));
  for (const o of L) { if (!o.cells) continue; const seen = new Set();
    for (const k of o.cells) for (const p of H.get(k)) { if (p === o || seen.has(p)) continue; seen.add(p); if (!ov(o, p)) continue; const a = find(idx.get(o)), c = find(idx.get(p)); if (a === c) continue; if (joined(o, p)) par[a] = c; }
    for (const p of big) { if (!ov(o, p)) continue; const a = find(idx.get(o)), c = find(idx.get(p)); if (a !== c && joined(o, p)) par[a] = c; } }
  // the rooms' own shells (outer walls and roof) are not pieces in the list: a point on one of them is held up
  const D = g.descent, AR = []; if (D) { const a0 = D.arena; for (let i = 0; i < 80; i++) { D.arena = i; const A = D.A(); if (!A) break; if (!A.village) AR.push(A); } D.arena = a0; }
  const onShell = (p) => { for (const A of AR) for (const sgn of [1, -1]) { const dx = Math.abs(p.x - A.c[0]), dz = Math.abs(p.z - sgn * A.c[1]);
    if (dx > A.hx + EPS || dz > A.hy + EPS) continue; if (p.y >= A.H - EPS || dx >= A.hx - EPS || dz >= A.hy - EPS) return true; } return false; };
  const grounded = new Set();
  for (const o of L) { let ok = o.b.min.y < EPS || o.pw.some(onShell);
    if (!ok) for (const p of o.pw) { if (p.y - o.b.min.y > 2) continue; const h = g.phys.raycastDown(new V3(p.x, p.y - 0.25, p.z), EPS, false); if (h) { ok = true; break; } }
    if (ok) grounded.add(find(idx.get(o))); }
  const comps = new Map();
  for (const o of L) { const r = find(idx.get(o)); if (grounded.has(r)) continue; let c = comps.get(r); if (!c) comps.set(r, c = []); c.push(o); }
  const out = [];
  for (const c of comps.values()) { if (c.every((o) => o.glow)) continue; const o = c.find((o) => !o.glow), b = o.b; out.push([o.i, o.id, 0, 0, Math.round((b.min.x + b.max.x) / 2), Math.round(b.min.y), Math.round((b.min.z + b.max.z) / 2), [b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z].map(Math.round), o.st, c.length]); }
  window.__float2 = out;
  return JSON.stringify({ n: L.length, floating: out.length, sample: out });
})()
