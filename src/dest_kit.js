// What every destination builds with: ground cover, worn paths, lamps, and the bodies that make a drawn thing solid.
// Local frame as in dest.js: +Y north, +X east, z up, the playable ground at z = 0.
import * as THREE from 'three';
import { V, R } from './mapkit.js';
import { dark, mix } from './village_shapes.js';

export function destKit(M, seed0 = 1, O = null) {
  const { Box, Cyl, Glow, Lamp, Shape, Solid, Oct } = M;
  let seed = seed0; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }, rr = (a, b) => a + rnd() * (b - a);
  // a sculpted piece ([key, build] pair) at a spot, turned (yaw in degrees) and scaled
  const S = (pair, x, y, z = 0, yaw = 0, s = 1) => Shape(pair[0], pair[1], V(x, y, z), R(0, yaw, 0), 0xffffff, s);
  // a body for something drawn: a box standing on z0, turned by yaw (degrees); nav false for things you can step past
  const body = (x, y, w, d, h, yaw = 0, z0 = 0, nav = true) => Solid(V(x, y, z0 + h / 2), V(w, d, h), nav, yaw);
  // a round body (a trunk, a tank, a stack): eight sides from two turned boxes
  const round = (x, y, r, h, z0 = 0, nav = true) => { for (const yw of [0, 45]) { Solid(V(x, y, z0 + h / 2), V(r * 2, r * 0.83, h), nav, yw); Solid(V(x, y, z0 + h / 2), V(r * 0.83, r * 2, h), nav, yw); } };
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
      if (skip && skip(ex, ey)) continue; Oct(V(ex, ey, z), V(sx, sy, 7), edge, false, false, R(0, yaw, 0)); }
  };
  // distance from a point to a polyline
  const distSeg = (px, py, [ax, ay], [bx, by]) => { const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, t = L ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)) : 0; return Math.hypot(px - ax - dx * t, py - ay - dy * t); };
  const lineDist = (x, y, pts) => { let d = Infinity; for (let j = 1; j < pts.length; j++) d = Math.min(d, distSeg(x, y, pts[j - 1], pts[j])); return d; };
  // is (x, y) at least m clear of every ground-standing body built so far in this place? For scattering small things
  // (tufts, stones) so none ends up inside something solid. Needs the place's origin (O.cx, O.cy). The ground's own slab
  // is not in the way.
  const clear = (x, y, m = 20) => { const L = M.world.scanCol || [], ch = M.world.chunk, wx = (O ? O.cx : 0) + x, wz = (O ? O.cy : 0) + y;
    for (const c of L) { if (c.ch !== ch) continue; const b = c.b; if (b.min.y > 60 || b.max.y < 6) continue; if (wx > b.min.x - m && wx < b.max.x + m && wz > b.min.z - m && wz < b.max.z + m) return false; } return true; };
  return { S, body, round, lit, patch, blot, path, rnd, rr, lineDist, clear, Box, Cyl, Glow, Lamp, Shape, Solid };
}
