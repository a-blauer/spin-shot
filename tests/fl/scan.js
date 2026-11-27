// floating finder: every placed piece of the map that touches nothing else and stands on nothing
(() => {
  const g = __dmh, W = g.world, L = (W.scanAll || []).map((r, i) => ({ i, id: r[0], glow: r[1], ch: r[2], b: r[3], st: r[5] }));
  const T = 6, cell = 400, H = new Map(), key = (x, y, z) => x + ',' + y + ',' + z;
  for (const o of L) { const b = o.b; for (let x = Math.floor((b.min.x - T) / cell); x <= Math.floor((b.max.x + T) / cell); x++) for (let y = Math.floor((b.min.y - T) / cell); y <= Math.floor((b.max.y + T) / cell); y++) for (let z = Math.floor((b.min.z - T) / cell); z <= Math.floor((b.max.z + T) / cell); z++) { const k = key(x, y, z); let a = H.get(k); if (!a) H.set(k, a = []); if (a.length < 4000) a.push(o); } }
  const touch = (a, b) => a.min.x - T <= b.max.x && a.max.x + T >= b.min.x && a.min.y - T <= b.max.y && a.max.y + T >= b.min.y && a.min.z - T <= b.max.z && a.max.z + T >= b.min.z;
  const V = g.player.pos.constructor, out = [];
  // pieces that touch are one thing; a thing is held up if any piece of it stands on the ground (or is the ground)
  const par = L.map((o, i) => i), find = (i) => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
  const idx = new Map(L.map((o, i) => [o, i]));
  for (const o of L) { const b = o.b; if (Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z) > 60000) continue;
    const cx0 = Math.floor((b.min.x - T) / cell), cx1 = Math.floor((b.max.x + T) / cell), cy0 = Math.floor((b.min.y - T) / cell), cy1 = Math.floor((b.max.y + T) / cell), cz0 = Math.floor((b.min.z - T) / cell), cz1 = Math.floor((b.max.z + T) / cell);
    if ((cx1 - cx0 + 1) * (cy1 - cy0 + 1) * (cz1 - cz0 + 1) > 4000) continue;
    for (let x = cx0; x <= cx1; x++) for (let y = cy0; y <= cy1; y++) for (let z = cz0; z <= cz1; z++) for (const p of H.get(key(x, y, z)) || []) if (p !== o && touch(b, p.b)) { const a = find(idx.get(o)), c = find(idx.get(p)); if (a !== c) par[a] = c; } }
  const grounded = new Set();
  for (const o of L) { const b = o.b, cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2;
    let ok = b.min.y < 8;
    if (!ok) { const h = g.phys.raycastDown(new V(cx, b.min.y + 40, cz), 60, false); ok = !!(h && h.point.y >= b.min.y - T - 2); }
    if (ok) grounded.add(find(idx.get(o))); }
  const comps = new Map();
  for (const o of L) { const r = find(idx.get(o)); if (grounded.has(r)) continue; let c = comps.get(r); if (!c) comps.set(r, c = []); c.push(o); }
  for (const c of comps.values()) { const o = c[0], b = o.b, cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2, sz = [b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z];
    out.push([o.i, o.id, o.glow, o.ch, Math.round(cx), Math.round(b.min.y), Math.round(cz), sz.map(Math.round), o.st, c.length]); }
  window.__float = out;
  return JSON.stringify({ n: L.length, floating: out.length, sample: out });
})()
