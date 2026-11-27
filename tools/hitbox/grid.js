window.__hbGrid = (E, N, yawDeg) => {
  const g = __dmh, V = E.pos.constructor, fy = E.pos.y - E.feetOffset, B = E.puppet;
  B._hk = null; const hb = B.hitBound(); const R0 = Math.max(hb.r, E.hitR) * 1.1, Y0 = Math.min(hb.y0, fy) - 15, Y1 = Math.max(hb.y1, fy + E.hitH) + 15;
  const a = yawDeg * Math.PI / 180, fx = Math.sin(a), fz = Math.cos(a), dist = Math.max(1400, 3.5 * (Y1 - Y0)), o = new V(E.pos.x - fx * dist, fy + 150, E.pos.z - fz * dist);
  const rows = [];
  for (let j = N - 1; j >= 0; j--) { let row = '';
    for (let i = 0; i < N; i++) {
      const u = -R0 + (2 * R0 * (i + 0.5)) / N, v = Y0 + ((Y1 - Y0) * (j + 0.5)) / N, d = new V(E.pos.x + fz * u, v, E.pos.z - fx * u).sub(o).normalize();
      B._hk = null; const m = window.__bodyRay(B, o, d, dist * 3);
      const tc = g.rayCyl(o, d, dist * 3, E.pos.x, E.pos.z, E.hitR, fy, fy + E.hitH), oldHead = tc !== null && o.y + d.y * tc > E.headY();
      const tn = g.rayEnemy(o, d, dist * 3, E, 0), newHead = tn !== null && E.headAt(o.clone().addScaledVector(d, tn));
      row += (m ? (m.role === 'Head' ? 'H' : 'B') : '.') + (tc !== null ? (oldHead ? 'h' : 'b') : '.') + (tn !== null ? (newHead ? 'h' : 'b') : '.') + ' ';
    } rows.push(row.trim()); }
  return rows;
};
'ok'
