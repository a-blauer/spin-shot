window.__hbRays = (E, N) => {
  const g = __dmh, V = E.pos.constructor, fy = E.pos.y - E.feetOffset, H = E.hitH || E.half * 2, hy = E.headY();
  // the drawn body's extent, to aim the grid: from its sampled surface
  const ps = window.__bodyPoints(E.puppet, 150);
  let top = -1e9, bot = 1e9, rr = 0;
  if (ps) { for (const [, x, y, z] of ps) { top = Math.max(top, y); bot = Math.min(bot, y); rr = Math.max(rr, Math.hypot(x - E.pos.x, z - E.pos.z)); } }
  else if (E.puppet && E.puppet.custom) { const hb = E.puppet.hitBound(); top = hb.y1; bot = hb.y0; rr = hb.r; } else return null;
  const R0 = Math.max(rr, E.hitR || E.radius) * 1.15, Y0 = Math.min(bot, fy) - 20, Y1 = Math.max(top, fy + H) + 20;
  const c = { seen: 0, both: 0, miss: 0, phantom: 0, headSeen: 0, headOk: 0, bodySeen: 0, bodyAsHead: 0, missAt: [], phAt: [] };
  for (const yawDeg of [0, 90, 180, 270]) {
    const a = yawDeg * Math.PI / 180, fx = Math.sin(a), fz = Math.cos(a), dist = Math.max(1400, 3.5 * (Y1 - Y0));
    const o = new V(E.pos.x - fx * dist, fy + 150, E.pos.z - fz * dist);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const u = -R0 + (2 * R0 * (i + 0.5)) / N, v = Y0 + ((Y1 - Y0) * (j + 0.5)) / N;
      const tp = new V(E.pos.x + fz * u, v, E.pos.z - fx * u), d = tp.clone().sub(o).normalize();
      E.puppet._hk = null; const m = window.__bodyRay(E.puppet, o, d, dist * 3), t = g.rayEnemy(o, d, dist * 3, E);
      if (m) c.seen++;
      if (m && t !== null) { c.both++; const atv = o.clone().addScaledVector(d, t), head = E.headAt(atv); if (m.role === 'Head') { c.headSeen++; if (head) c.headOk++; } else { c.bodySeen++; if (head) c.bodyAsHead++; } }
      else if (m) { c.miss++; if (c.missAt.length < 6) c.missAt.push([yawDeg, Math.round(u), Math.round(v - fy), m.role]); }
      else if (t !== null) { c.phantom++; if (c.phAt.length < 6) c.phAt.push([yawDeg, Math.round(u), Math.round(v - fy)]); }
    }
  }
  return c;
};
'ok'
