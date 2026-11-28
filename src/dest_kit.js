// What every destination builds with: ground cover, worn paths, lamps, and the bodies that make a drawn thing solid.
// Local frame as in dest.js: +Y north, +X east, z up, the playable ground at z = 0.
import * as THREE from 'three';
import { V, R } from './mapkit.js';
import { dark, mix } from './village_shapes.js';

export function destKit(M, seed0 = 1, O = null, opts = {}) {
  const { Box, Cyl, Glow, Lamp, Shape, Solid, Oct } = M;
  let seed = seed0; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }, rr = (a, b) => a + rnd() * (b - a);
  // a sculpted piece ([key, build] pair) at a spot, turned (yaw in degrees) and scaled
  const S = (pair, x, y, z = 0, yaw = 0, s = 1) => Shape(pair[0], pair[1], V(x, y, z), R(0, yaw, 0), 0xffffff, s);
  // With opts.exactNav a body's place on the walking grid is its true shape (the cells whose middles lie within 28 of
  // it: a turned box's own rectangle, a round body's circle), not the square that holds it; otherwise the grid takes the
  // square round it with 40 to spare. A cell shut on the grid but open on the ground turns back a creature that can see
  // you and walks straight at you, so places dense with turned and round things want the exact one.
  const exact = !!opts.exactNav;
  const navCells = (x, y, z0, h, inside) => { if (z0 + h < 40 || z0 > 150) return; const done = new Set(), R2 = inside.r + 30;
    for (let px = x - R2; px <= x + R2 + 1; px += 50) for (let py = y - R2; py <= y + R2 + 1; py += 50) { const [ix, iy] = O.GM.cellOf(O.cx + px, O.cy + py), k = ix * 100000 + iy; if (done.has(k)) continue; done.add(k);
      const [wx, wy] = O.GM.cellCenter(ix, iy), lx = wx - O.cx, ly = wy - O.cy; if (inside(lx - x, ly - y)) O.GM.NavBlockBox({ min: V(lx - 40, ly - 40, z0), max: V(lx + 40, ly + 40, z0 + Math.min(h, 100)) }, 1); } };
  // a body for something drawn: a box standing on z0, turned by yaw (degrees); nav false for things you can step past
  const body = (x, y, w, d, h, yaw = 0, z0 = 0, nav = true) => { if (!exact || !nav) return Solid(V(x, y, z0 + h / 2), V(w, d, h), nav, yaw);
    Solid(V(x, y, z0 + h / 2), V(w, d, h), false, yaw); const c = Math.cos((yaw * Math.PI) / 180), s = Math.sin((yaw * Math.PI) / 180), f = (u, v) => Math.abs(u * c + v * s) <= w / 2 + 28 && Math.abs(-u * s + v * c) <= d / 2 + 28; f.r = Math.hypot(w, d) / 2 + 28; navCells(x, y, z0, h, f); };
  // a round body (a trunk, a tank, a stack): eight sides from two turned boxes
  const round = (x, y, r, h, z0 = 0, nav = true) => { for (const yw of [0, 45]) { Solid(V(x, y, z0 + h / 2), V(r * 2, r * 0.83, h), nav && !exact, yw); Solid(V(x, y, z0 + h / 2), V(r * 0.83, r * 2, h), nav && !exact, yw); }
    if (exact && nav) { const f = (u, v) => Math.hypot(u, v) <= r + 28; f.r = r + 28; navCells(x, y, z0, h, f); } };
  // a warm light: a small glowing body and a lamp a little above it
  const lit = (x, y, z, c = { r: 1, g: 0.78, b: 0.45 }, r = 900, glowCol = 0xffd27a) => { Glow(V(x, y, z), V(22, 22, 26), glowCol, 2); Lamp(V(x, y, z + 10), c, 2.2, r, false); };
  // flat patches of ground cover, each a hair over the last so overlapping ones never fight
  let gN = 0; const patch = (x, y, d, c) => Cyl(V(x, y, 0.3 + (gN++) * 0.02), d, 1, c, false, false, null);
  const blot = (x, y, w, d, c, yaw = 0) => Oct(V(x, y, 0.3 + (gN++) * 0.02), V(w, d, 1), c, false, false, R(0, yaw, 0));
  // a worn path: one ribbon of soft dirt, wavering, two tones through it, edged here and there with stones
  let pathN = 0;
  const path = (pts, w, col = 0x8c6c48, edge = 0x8a8478, skip = null) => {
    const pz = 2.6 + (pathN++) * 0.25;
    const segs = []; for (let k = 0; k < pts.length - 1; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / 60)); for (let i = 0; i < n; i++) segs.push([x0 + (x1 - x0) * (i / n), y0 + (y1 - y0) * (i / n), -(y1 - y0) / L, (x1 - x0) / L]); }
    { const [x1, y1] = pts[pts.length - 1], q = segs[segs.length - 1]; segs.push([x1, y1, q[2], q[3]]); }
    const x0 = segs[0][0], y0 = segs[0][1], key = 'dpath|' + pts.flat().map(Math.round).join(',') + '|' + w + '|' + col, dk = dark(col, 0.86), lt = mix(col, 0x7a8a46, 0.3);
    Shape(key, () => { const pos = [], cl = [], idx = [], C = new THREE.Color(); const N = segs.length;
      for (let i = 0; i < N; i++) { const [x, y, nx, ny] = segs[i], hw = w * 0.5 * (0.9 + 0.12 * Math.sin(i * 0.7) + 0.06 * Math.sin(i * 2.3)); for (let j = 0; j <= 4; j++) { const e = (j / 4 - 0.5) * 2 * hw, px = x + nx * e - x0, py = y + ny * e - y0; pos.push(px, py, 0); C.setHex(j === 0 || j === 4 ? lt : (Math.sin(i * 1.3 + j * 2.1) > 0.35 ? dk : col), THREE.NoColorSpace); cl.push(C.r, C.g, C.b); } }
      for (let i = 0; i < N - 1; i++) for (let j = 0; j < 4; j++) { const a = i * 5 + j, b2 = a + 1, c = a + 5, d = c + 1; idx.push(a, c, b2, b2, c, d); }
      return { pos, col: cl, idx }; }, V(x0, y0, pz), R(0, 0, 0));
    // stones along its edges, bedded in the ground (never sitting on the air past the ribbon); none where skip(x, y)
    // says the path runs over a floor (they would poke up through the boards)
    for (let i = 0; i < segs.length; i += 3) { if (rnd() < 0.5) continue; const [x, y, nx, ny] = segs[i]; const sd = rnd() < 0.5 ? -1 : 1, e = sd * (w / 2 + rr(-6, 8)), z = Math.max(2.5, pz + rr(0, 1.5)), sx = rr(20, 36), sy = rr(16, 30), yaw = rr(0, 90), ex = x + nx * e, ey = y + ny * e;
      if (skip && skip(ex, ey)) continue; const sh = Math.max(7, z * 2 + 0.5); Oct(V(ex, ey, z + 3.5 - sh / 2), V(sx, sy, sh), edge, false, false, R(0, yaw, 0)); }   // a path laid late sits higher: its stones still reach the ground
  };
  // distance from a point to a polyline
  const distSeg = (px, py, [ax, ay], [bx, by]) => { const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, t = L ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)) : 0; return Math.hypot(px - ax - dx * t, py - ay - dy * t); };
  const lineDist = (x, y, pts) => { let d = Infinity; for (let j = 1; j < pts.length; j++) d = Math.min(d, distSeg(x, y, pts[j - 1], pts[j])); return d; };
  // is (x, y) at least m clear of every ground-standing body built so far in this place? For scattering small things
  // (tufts, stones) so none ends up inside something solid. Needs the place's origin (O.cx, O.cy). The ground's own slab
  // is not in the way.
  const clear = (x, y, m = 20) => { const L = M.world.scanCol || [], ch = M.world.chunk, wx = (O ? O.cx : 0) + x, wz = (O ? O.cy : 0) + y;
    for (const c of L) { if (c.ch !== ch) continue; const b = c.b; if (b.min.y > 60 || b.max.y < 6) continue; if (wx > b.min.x - m && wx < b.max.x + m && wz > b.min.z - m && wz < b.max.z + m) return false; } return true; };
  // a round body whose place on the walking grid is round too: the cells whose middles lie within r + 28 of it, not the
  // square round it, so a gap that is open between two trunks is open on the grid as well (a creature that can see you
  // walks straight; a cell shut on the grid that is open on the ground would turn it back there)
  const trunk = (x, y, r, h, z0 = 0) => { round(x, y, r, h, z0, false); const f = (u, v) => Math.hypot(u, v) <= r + 28; f.r = r + 28; navCells(x, y, z0, h, f); };
  // Lay out many solid things (trees, bushes) without sealing off any pocket of open ground. items: [{ x, y, half }],
  // each blocking the walking grid over a square of its half size (and the grid's own margin, 40). Every open cell must
  // stay reachable from start; while one is not, the planned thing that walls its pocket off from the rest (or, failing
  // that, any that touches the pocket) is left out. Works on the walking grid as it stands, so everything else is built
  // first. Returns the items kept, in order.
  const plan = (items, start) => {
    const Cs = 100, hx = O.hx, hy = O.hy, nx = Math.round((hx * 2) / Cs), ny = Math.round((hy * 2) / Cs), N = nx * ny;
    const base = new Uint8Array(N); for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const [ix, iy] = O.GM.cellOf(O.cx - hx + Cs * (i + 0.5), O.cy - hy + Cs * (j + 0.5)); base[j * nx + i] = O.GM.navFree(ix, iy) ? 1 : 0; }
    const cover = items.map((o) => { const out = [], r = o.half + (o.circle ? 28 : 40); for (let j = Math.max(0, Math.floor((o.y - r + hy) / Cs)); j <= Math.min(ny - 1, Math.floor((o.y + r + hy) / Cs)); j++) for (let i = Math.max(0, Math.floor((o.x - r + hx) / Cs)); i <= Math.min(nx - 1, Math.floor((o.x + r + hx) / Cs)); i++) { const x = -hx + Cs * (i + 0.5), y = -hy + Cs * (j + 0.5); if (o.circle ? Math.hypot(x - o.x, y - o.y) <= r : Math.abs(x - o.x) <= r && Math.abs(y - o.y) <= r) out.push(j * nx + i); } return out; });
    const nb = (c) => { const i = c % nx, j = (c - i) / nx, r = []; if (i > 0) r.push(c - 1); if (i < nx - 1) r.push(c + 1); if (j > 0) r.push(c - nx); if (j < ny - 1) r.push(c + nx); return r; };
    const keep = items.map(() => true), s0 = Math.floor((start[1] + hy) / Cs) * nx + Math.floor((start[0] + hx) / Cs);
    for (let iter = 0; iter < 600; iter++) {
      const blk = new Uint8Array(N); items.forEach((o, k) => { if (keep[k]) for (const c of cover[k]) blk[c] = 1; });
      const seen = new Uint8Array(N), q = [s0]; seen[s0] = 1; while (q.length) { const c = q.pop(); for (const d of nb(c)) if (!seen[d] && base[d] && !blk[d]) { seen[d] = 1; q.push(d); } }
      let pocket = -1; for (let c = 0; c < N; c++) if (base[c] && !blk[c] && !seen[c]) { pocket = c; break; }
      if (pocket < 0) break;
      const P = new Uint8Array(N), pq = [pocket]; P[pocket] = 1; while (pq.length) { const c = pq.pop(); for (const d of nb(c)) if (!P[d] && base[d] && !blk[d]) { P[d] = 1; pq.push(d); } }
      let best = -1, both = false;
      items.forEach((o, k) => { if (!keep[k] || both) return; let tp = false, tr = false; for (const c of cover[k]) for (const d of nb(c)) { if (P[d]) tp = true; if (seen[d]) tr = true; } if (tp && (tr || best < 0)) { best = k; both = tr; } });
      if (best < 0) { for (let c = 0; c < N; c++) if (P[c]) base[c] = 0; continue; }   // shut in by the place itself: the builder's to open
      keep[best] = false;
    }
    return items.filter((o, k) => keep[k]);
  };
  // ---- a band of ground along a polyline at height z (cinders by a line, a verge of weeds along a wall): w wide, its
  // edges ragged (rag); col(i, j) the colour at the i-th point along it, j = 0..4 across
  let bandN = 0;
  const band = (pts, w, z, col, rag = 0.12) => {
    const P = []; for (let k = 0; k < pts.length - 1; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / 60)); for (let i = 0; i < n; i++) P.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n]); }
    P.push(pts[pts.length - 1]);
    Shape('dband|' + (bandN++) + '|' + seed0 + '|' + pts.flat().map(Math.round).join(',') + '|' + w + '|' + z, () => { const pos = [], cl = [], idx = [], C = new THREE.Color(), N = P.length;
      for (let i = 0; i < N; i++) { const [x, y] = P[i], [xa, ya] = P[Math.max(0, i - 1)], [xb, yb] = P[Math.min(N - 1, i + 1)], L = Math.hypot(xb - xa, yb - ya) || 1, nx = -(yb - ya) / L, ny = (xb - xa) / L;
        for (let j = 0; j <= 4; j++) { const edge = j === 0 || j === 4, e = (j / 4 - 0.5) * w * (1 + (edge ? rag : rag * 0.3) * (Math.sin(i * 0.83 + j * 1.9) + 0.5 * Math.sin(i * 2.1 - j))); pos.push(x + nx * e, y + ny * e, z); C.setHex(col(i, j), THREE.NoColorSpace); cl.push(C.r, C.g, C.b); } }
      for (let i = 0; i < N - 1; i++) for (let j = 0; j < 4; j++) { const a = i * 5 + j, b = a + 1, c = a + 5, d = c + 1; idx.push(a, c, b, b, c, d); }
      return { pos, col: cl, idx }; }, V(0, 0, 0), R(0, 0, 0));
  };
  // ---- a road of setts along a polyline (smoothed): rows of stone blocks across it, every other row stepped by half a
  // block, on a bed of dark grit; a kerb of long stones along each edge, 3 proud. z: the setts' top. opts.skip(x, y):
  // no kerb there (where a line crosses: the place lays the crossing's planks). Returns the road's length.
  let roadN = 0; const hash = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
  const settRoad = (pts, w, z = 2.6, opts = {}) => {
    const cols = opts.cols || [0x8a8478, 0x7e786e, 0x948e82, 0x847c70], grit = opts.grit || 0x4a443e, kerb = opts.kerb || 0xa8a296, kerbW = opts.kerbW ?? 16, sl = opts.sl || 24, swd = opts.sw || 34, skip = opts.skip || (() => false);
    let P = pts.map((p) => p.slice()); for (let it = 0; it < 3 && P.length > 2; it++) { const Q = [P[0]]; for (let i = 0; i < P.length - 1; i++) { const [x0, y0] = P[i], [x1, y1] = P[i + 1]; Q.push([x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25], [x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75]); } Q.push(P[P.length - 1]); P = Q; }
    const acc = [0]; for (let i = 1; i < P.length; i++) acc.push(acc[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); const total = acc[acc.length - 1];
    const at = (s) => { let i = 1; while (i < P.length - 1 && acc[i] < s) i++; const t = (s - acc[i - 1]) / Math.max(1e-6, acc[i] - acc[i - 1]), [x0, y0] = P[i - 1], [x1, y1] = P[i], L = Math.hypot(x1 - x0, y1 - y0) || 1; return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, (x1 - x0) / L, (y1 - y0) / L]; };
    const off = (q, e, zz) => [q[0] - q[3] * e, q[1] + q[2] * e, zz];
    Shape('dsett|' + (roadN++) + '|' + seed0 + '|' + pts.flat().map(Math.round).join(',') + '|' + w, () => { const pos = [], cl = [], idx = [], C = new THREE.Color();
      const quad = (a, b, c, d, hex) => { const k0 = pos.length / 3; for (const p of [a, b, c, d]) pos.push(p[0], p[1], p[2]); C.setHex(hex, THREE.NoColorSpace); for (let k = 0; k < 4; k++) cl.push(C.r, C.g, C.b); idx.push(k0, k0 + 1, k0 + 2, k0, k0 + 2, k0 + 3); };
      const nRows = Math.max(1, Math.round(total / sl)), hw = w / 2, n = Math.max(1, Math.round(w / swd)), bw = w / n;
      for (let r = 0; r < nRows; r++) { const qa = at((r / nRows) * total), qb = at(((r + 1) / nRows) * total), qm = at(((r + 0.5) / nRows) * total), hl = total / nRows / 2 - 1.5;
        quad(off(qa, -hw, z - 0.4), off(qa, hw, z - 0.4), off(qb, hw, z - 0.4), off(qb, -hw, z - 0.4), grit);
        const sh = r % 2 ? bw / 2 : 0, lo = [qm[0] - qm[2] * hl, qm[1] - qm[3] * hl, qm[2], qm[3]], hi = [qm[0] + qm[2] * hl, qm[1] + qm[3] * hl, qm[2], qm[3]];
        for (let k = -1; k <= n; k++) { const e0 = Math.max(-hw + 1, -hw + k * bw + sh + 1.5), e1 = Math.min(hw - 1, -hw + (k + 1) * bw + sh - 1.5); if (e1 - e0 < 4) continue;
          const c = cols[Math.floor(hash(r, k) * cols.length)], zz = z + (hash(k + 7, r) - 0.5) * 0.4; quad(off(lo, e0, zz), off(lo, e1, zz), off(hi, e1, zz), off(hi, e0, zz), c); } }
      if (kerbW > 0) for (const sd of [-1, 1]) { const nK = Math.max(1, Math.round(total / 70)); for (let i = 0; i < nK; i++) { const qa = at((i / nK) * total), qb = at(((i + 1) / nK) * total - 2), qm = at(((i + 0.5) / nK) * total), mid = off(qm, sd * (hw + kerbW / 2), 0); if (skip(mid[0], mid[1])) continue;
        const e0 = sd * hw, e1 = sd * (hw + kerbW), c = i % 3 ? kerb : dark(kerb, 0.9), zt = z + 3;
        if (sd > 0) { quad(off(qa, e0, zt), off(qa, e1, zt), off(qb, e1, zt), off(qb, e0, zt), c); quad(off(qa, e0, z - 0.4), off(qa, e0, zt), off(qb, e0, zt), off(qb, e0, z - 0.4), dark(c, 0.8)); quad(off(qa, e1, zt), off(qa, e1, 0), off(qb, e1, 0), off(qb, e1, zt), dark(c, 0.75)); }
        else { quad(off(qa, e1, zt), off(qa, e0, zt), off(qb, e0, zt), off(qb, e1, zt), c); quad(off(qa, e0, zt), off(qa, e0, z - 0.4), off(qb, e0, z - 0.4), off(qb, e0, zt), dark(c, 0.8)); quad(off(qa, e1, 0), off(qa, e1, zt), off(qb, e1, zt), off(qb, e1, 0), dark(c, 0.75)); }
        for (const q of [qa, qb]) quad(off(q, e0, z - 0.4), off(q, e1, z - 0.4), off(q, e1, zt), off(q, e0, zt), dark(c, 0.85)); } }
      return { pos, col: cl, idx }; }, V(0, 0, 0), R(0, 0, 0));
    return total;
  };
  return { S, body, round, trunk, lit, patch, blot, path, band, settRoad, rnd, rr, lineDist, clear, plan, Box, Cyl, Glow, Lamp, Shape, Solid };
}
