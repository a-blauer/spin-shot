(() => {
  const g = __dmh, W = g.world, GEOS = W.constructor.PRIM_GEOS, V3 = g.player.pos.constructor, M4 = g.camera.matrixWorld.constructor;
  const LO = window.__LO || 0, HI = window.__HI || 1e9;
  const A = g.descent.A(), cx = A.c[0], cz = A.c[1], RX = A.hx + 300, RZ = A.hy + 300;
  const inV = (b) => Math.abs((b.min.x + b.max.x) / 2 - cx) < RX && Math.abs((b.min.z + b.max.z) / 2 - cz) < RZ;
  const items = W.scanAll.filter((r) => inV(r[3]) && !r[1]);
  const cols = (W.scanCol || []).filter((c) => inV(c.b));
  const probe = new V3(), m = new M4(), v = new V3();
  // 1) things at body height that look solid but nothing stops you
  const walk = [];
  for (const r of items) {
    const b = r[3], sx = b.max.x - b.min.x, sz = b.max.z - b.min.z, h = b.max.y - b.min.y;
    if (b.min.y > 110 || b.max.y < 40 || Math.max(sx, sz) < 16) continue;
    const G = GEOS[r[0]]; if (!G) continue; const P = G.attributes.position; m.fromArray(r[4]);
    const pts = []; const step = Math.max(1, Math.floor(P.count / 400));
    for (let i = 0; i < P.count; i += step) { v.set(P.getX(i), P.getY(i), P.getZ(i)).applyMatrix4(m); if (v.y > 25 && v.y < 110) pts.push([v.x, v.y, v.z]); }
    if (pts.length < 3) continue;
    let mx = 0, mz = 0; for (const p of pts) { mx += p[0]; mz += p[2]; } mx /= pts.length; mz /= pts.length;
    let n = 0, hit = 0; const k = Math.max(1, Math.floor(pts.length / 24));
    // a long thin piece (a row of hops, a run of wall) is probed across its short side: probed along its length from its
    // middle, the probe would land inside the piece's own body and see nothing
    const thin = Math.max(sx, sz) > 4 * Math.min(sx, sz);
    for (let i = 0; i < pts.length; i += k) { const p = pts[i]; let nx = p[0] - mx, nz = p[2] - mz, L = Math.hypot(nx, nz); if (thin) { if (sx > sz) { nx = 0; nz = Math.sign(nz) || 1; } else { nz = 0; nx = Math.sign(nx) || 1; } L = Math.abs(sx > sz ? p[2] - mz : p[0] - mx); } else { if (L < 1) { nx = 1; nz = 0; L = 1; } nx /= L; nz /= L; }
      probe.set(p[0] + nx * 90, Math.max(30, Math.min(90, p[1])), p[2] + nz * 90); n++; const h = g.phys.raycast(probe, new V3(-nx, 0, -nz), 90 + Math.min(40, L + 6)); if (h) hit++; }
    if (hit / n < 0.34) walk.push([Math.round(mx - cx), Math.round(mz - cz), Math.round(sx), Math.round(h), Math.round(sz), +(hit / n).toFixed(2), r[5]]);
  }
  // 2) collision boxes with nothing drawn in them: invisible walls
  const ghost = [];
  for (const c of cols) {
    const b = c.b; if (b.max.x - b.min.x > 3000 || b.max.z - b.min.z > 3000) continue;
    const any = items.some((r) => { const q = r[3]; return q.min.x < b.max.x - 4 && q.max.x > b.min.x + 4 && q.min.z < b.max.z - 4 && q.max.z > b.min.z + 4 && q.min.y < b.max.y - 4 && q.max.y > b.min.y + 4; });
    if (!any) ghost.push([Math.round((b.min.x + b.max.x) / 2 - cx), Math.round((b.min.z + b.max.z) / 2 - cz), Math.round(b.max.x - b.min.x), Math.round(b.max.y - b.min.y), Math.round(b.max.z - b.min.z), c.st]);
  }
  // 3) clipping: a drawn piece whose surface lies deep inside some other structure's body
  const HELP = new Set(window.__HELP || []); const lineOf = (st) => { for (const fr of String(st || '').split('|')) { const mm = fr.trim().match(/:(\d+):\d+\)?$/); if (mm) { const l = +mm[1]; if (l > LO && l < HI && !HELP.has(l)) return l; } } return 0; };
  const CB = cols.map((c) => { const o = { b: c.b, l: lineOf(c.st), st: c.st }; if (c.m) { const M = new M4().fromArray(c.m); o.inv = M.clone().invert(); const e = M.elements; o.s = [Math.hypot(e[0], e[1], e[2]), Math.hypot(e[4], e[5], e[6]), Math.hypot(e[8], e[9], e[10])]; } return o; }).filter((c) => c.b.max.x - c.b.min.x < 3000);
  const lv = new V3();
  const clip = {};
  for (const r of items) {
    const b = r[3]; if (b.max.x - b.min.x > 12000) continue; const la = lineOf(r[5]); const G = GEOS[r[0]]; if (!G) continue; const P = G.attributes.position; m.fromArray(r[4]);
    const step = Math.max(1, Math.floor(P.count / 220));
    for (let i = 0; i < P.count; i += step) { v.set(P.getX(i), P.getY(i), P.getZ(i)).applyMatrix4(m); if (v.y < 4 || v.y > 700) continue;
      for (const c of CB) { if (Math.abs(c.l - la) <= 2) continue; const q = c.b, e = 14; if (v.x > q.min.x + e && v.x < q.max.x - e && v.z > q.min.z + e && v.z < q.max.z - e && v.y > q.min.y + 6 && v.y < q.max.y - 6 && (!c.inv || (lv.copy(v).applyMatrix4(c.inv), Math.abs(lv.x) < 0.5 - e / c.s[0] && Math.abs(lv.y) < 0.5 - 6 / c.s[1] && Math.abs(lv.z) < 0.5 - e / c.s[2]))) { const k = la + '>' + c.l; (clip[k] || (clip[k] = [0, Math.round(v.x - cx), Math.round(v.z - cz), Math.round(v.y), r[5], c.st]))[0]++; } } }
  }
  return JSON.stringify({ n: items.length, ncol: cols.length, walk, ghost, clip: Object.entries(clip).map(([k, v]) => [k].concat(v)) });
})()
