// Set pieces shared by the later maps, built from the same primitives as everything else.
// mapKit(M) binds them to a world under construction.
import { V, V2, R, LC, FMath } from './mapkit.js';

const rr = (a, b) => FMath.FRandRange(a, b);
export const rgb = (c) => LC(((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255);

export function mapKit(M) {
  const { Box, BoxRot, Glow, Cyl, Ball, ConeShape, Pyramid, Oct, Ring, Lamp, GM } = M;
  const K = {};
  const IRON = 0x33363c, STEEL = 0x5a5e66;
  const L = (x, y, yaw, dx, dy, z) => M.L(V(x, y, 0), yaw, dx, dy, z);
  const solid = (x, y, yaw, len, wid, h) => { const a = Math.abs(Math.cos(yaw * Math.PI / 180)), b = Math.abs(Math.sin(yaw * Math.PI / 180)), hx = (len * a + wid * b) / 2, hy = (len * b + wid * a) / 2; GM.NavBlockBox({ min: V(x - hx, y - hy, 0), max: V(x + hx, y + hy, h) }, 1); };
  K.solid = solid;

  K.rails = (x0, y0, x1, y1, tie = 0x3a2a1c) => {
    const alongX = Math.abs(x1 - x0) > Math.abs(y1 - y0), len = Math.hypot(x1 - x0, y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    for (const s of [-1, 1]) Box(V(cx + (alongX ? 0 : s * 70), cy + (alongX ? s * 70 : 0), 9), alongX ? V(len, 8, 8) : V(8, len, 8), STEEL, false, false);
    for (let d = 40; d < len; d += 90) { const t = d / len; Box(V(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 4), alongX ? V(26, 210, 7) : V(210, 26, 7), tie, false, false); }
  };
  K.lantern = (x, y, z, col = 0xFFB45A, rad = 900) => {
    Box(V(x, y, z + 26), V(4, 4, 40), IRON, false, false); Box(V(x, y, z), V(22, 22, 8), IRON, false, false); Box(V(x, y, z - 34), V(22, 22, 6), IRON, false, false);
    Glow(V(x, y, z - 16), V(16, 16, 28), col); Lamp(V(x, y, z - 16), rgb(col), 10, rad, false);
  };
  // a lamp on a post (wood or iron), for anywhere without a wall to hang one on
  K.post = (x, y, h = 360, col = 0xFFB45A, wood = 0x4a3a30, rad = 1000) => {
    Box(V(x, y, h / 2), V(18, 18, h), wood, true, false); Box(V(x + 26, y, h - 10), V(60, 8, 8), wood, false, false);
    Box(V(x + 50, y, h - 40), V(20, 20, 6), IRON, false, false); Glow(V(x + 50, y, h - 28), V(15, 15, 24), col); Box(V(x + 50, y, h - 14), V(22, 22, 6), IRON, false, false);
    Lamp(V(x + 50, y, h - 28), rgb(col), 10, rad, false);
  };
  // a pine: trunk and three tiers, each carrying snow if `snow` is a colour
  K.pine = (x, y, h, snow = 0, leaf = 0x24463a) => {
    Cyl(V(x, y, h * 0.2), h * 0.07, h * 0.4, 0x3a2a20, true, true);
    for (let i = 0; i < 3; i++) {
      const z = h * (0.34 + i * 0.22), w = h * (0.46 - i * 0.11), hh = h * 0.36;
      ConeShape(V(x, y, z + hh / 2 - h * 0.08), V(w, w, hh), i % 2 ? leaf : 0x1c382e, false);
      if (snow) ConeShape(V(x, y, z + hh * 0.72 - h * 0.08), V(w * 0.56, w * 0.56, hh * 0.52), snow, false);
    }
  };
  // a rail car, `yaw` 0 = along X, 90 = along Y. kind: box | coach | flat | tank | caboose
  K.car = (x, y, yaw, len, col, kind = 'box', snow = 0) => {
    const P = (dx, dy, z) => L(x, y, yaw, dx, dy, z);
    Box(P(0, 0, 45), V(len - 100, 210, 70), 0x23262c, true, false, yaw);
    for (const sx of [-1, 1]) for (const k of [-60, 60]) for (const sy of [-1, 1]) Cyl(P(sx * (len * 0.5 - 150) + k, sy * 108, 40), 72, 18, 0x18181c, false, false, R(0, yaw, 90));
    Box(P(len / 2 + 14, 0, 70), V(40, 30, 24), IRON, false, false, yaw); Box(P(-len / 2 - 14, 0, 70), V(40, 30, 24), IRON, false, false, yaw);
    if (kind === 'flat') {
      Box(P(0, 0, 92), V(len, 300, 24), 0x4a3a30, true, false, yaw);
      for (let i = 0; i < 6; i++) { const r = Math.floor(i / 3), c = i % 3 - (r ? 0.5 : 1); if (r && i === 5) continue; Cyl(P(0, c * 86, 146 + r * 76), 84, len - 120, i % 2 ? 0x6a4a2e : 0x5a3e28, true, false, R(90, yaw, 0)); }
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) Box(P(sx * (len / 2 - 60), sy * 140, 190), V(14, 14, 190), 0x3a2a20, false, false, yaw);
      solid(x, y, yaw, len, 300, 140); return;
    }
    if (kind === 'tank') {
      Cyl(P(0, 0, 250), 300, len - 80, col, true, false, R(90, yaw, 0)); for (const k of [-0.3, 0, 0.3]) Cyl(P(k * len, 0, 250), 312, 14, IRON, false, false, R(90, yaw, 0));
      Cyl(P(0, 0, 420), 110, 60, IRON, false, false); Box(P(0, 0, 110), V(len - 60, 240, 30), 0x23262c, true, false, yaw);
      if (snow) Box(P(0, 0, 404), V(len - 200, 120, 12), snow, false, false, yaw);
      solid(x, y, yaw, len, 300, 400); return;
    }
    Box(P(0, 0, 270), V(len, 320, 360), col, true, false, yaw);
    Box(P(0, 0, 458), V(len + 10, 334, 16), 0x2a2420, true, false, yaw); Box(P(0, 0, 474), V(len - 40, 180, 16), 0x2a2420, false, false, yaw);
    if (snow) { Box(P(0, 0, 488), V(len - 60, 250, 14), snow, false, false, yaw); Box(P(rr(-100, 100), 0, 500), V(len * 0.5, 170, 14), snow, false, false, yaw); }
    if (kind === 'coach' || kind === 'caboose') {
      const n = Math.max(3, Math.floor(len / 150));
      for (let i = 0; i < n; i++) { const dx = -len / 2 + len * (i + 0.5) / n; for (const sy of [-1, 1]) { Glow(P(dx, sy * 161, 310), yaw ? V(4, 70, 90) : V(70, 4, 90), (i * 7 + 3) % 5 === 0 ? 0xFFB45A : 0x3a2a1c); Box(P(dx, sy * 163, 258), V(86, 4, 8), 0x1c1a1c, false, false, yaw); } }
      for (const sy of [-1, 1]) Box(P(0, sy * 162, 160), V(len, 4, 12), 0xb9974a, false, false, yaw);
      if (kind === 'caboose') { Box(P(0, 0, 520), V(len * 0.34, 220, 90), col, true, false, yaw); Box(P(0, 0, 572), V(len * 0.38, 240, 12), 0x2a2420, false, false, yaw); for (const sy of [-1, 1]) Glow(P(0, sy * 112, 524), yaw ? V(4, 80, 44) : V(80, 4, 44), 0xFFB45A); }
    } else {
      for (const sy of [-1, 1]) { Box(P(0, sy * 162, 260), V(300, 6, 280), 0x3a2a20, false, false, yaw); Box(P(0, sy * 166, 412), V(340, 6, 10), IRON, false, false, yaw); Box(P(0, sy * 166, 108), V(340, 6, 10), IRON, false, false, yaw); }
      for (let i = 0; i < 6; i++) { const dx = -len / 2 + len * (i + 0.5) / 6; if (Math.abs(dx) < 200) continue; Box(P(dx, 0, 270), V(12, 330, 360), 0x2a2420, false, false, yaw); }
    }
    solid(x, y, yaw, len, 320, 450);
  };
  // a steam locomotive and tender, nose toward +X at yaw 0. About 1500 long.
  K.loco = (x, y, yaw, col = 0x23262c, snow = 0, lit = true) => {
    const P = (dx, dy, z) => L(x, y, yaw, dx, dy, z);
    Box(P(100, 0, 70), V(1000, 200, 60), 0x18181c, true, false, yaw);
    Cyl(P(250, 0, 250), 250, 620, col, true, false, R(90, yaw, 0)); Cyl(P(566, 0, 250), 262, 30, 0x18181c, false, false, R(90, yaw, 0));
    for (const k of [0, 180, 360]) Cyl(P(60 + k, 0, 250), 258, 12, 0xb9974a, false, false, R(90, yaw, 0));
    Cyl(P(480, 0, 440), 80, 170, 0x18181c, false, false); Cyl(P(480, 0, 530), 110, 30, 0x18181c, false, false);
    Ball(P(300, 0, 380), V(110, 110, 90), 0xb9974a); Ball(P(120, 0, 380), V(90, 90, 80), col);
    Box(P(-190, 0, 290), V(280, 310, 380), col, true, false, yaw); Box(P(-190, 0, 490), V(320, 340, 16), 0x18181c, false, false, yaw);
    for (const sy of [-1, 1]) Glow(P(-150, sy * 157, 360), yaw ? V(4, 90, 90) : V(90, 4, 90), lit ? 0xFF8A3A : 0x2a2420);
    if (lit) { Glow(P(586, 0, 330), V(8, 70, 70), 0xFFE2A0, 2); Lamp(P(640, 0, 330), LC(1, 0.85, 0.6), 12, 1200, false); }
    BoxRot(P(640, 0, 60), V(160, 230, 14), 0x8a2a22, R(34, yaw, 0), false); Box(P(600, 0, 40), V(20, 240, 60), 0x18181c, false, false, yaw);
    for (const sy of [-1, 1]) { for (const k of [-40, 150, 340]) { Ring(P(k, sy * 112, 96), V(180, 20, 180), 0x8a2a22, R(0, yaw, 0)); Box(P(k, sy * 112, 96), V(170, 8, 12), 0x8a2a22, false, false, yaw); } Box(P(150, sy * 126, 80), V(420, 8, 14), STEEL, false, false, yaw); Cyl(P(500, sy * 108, 50), 80, 16, 0x18181c, false, false, R(0, yaw, 90)); }
    Box(P(-560, 0, 70), V(360, 200, 60), 0x18181c, true, false, yaw); Box(P(-560, 0, 220), V(400, 300, 250), col, true, false, yaw);
    for (let i = 0; i < 5; i++) Pyramid(P(-560 + rr(-130, 130), rr(-90, 90), 360 + rr(0, 20)), V(rr(110, 180), rr(110, 180), rr(50, 90)), 0x101014, R(0, rr(0, 90), 0));
    for (const sy of [-1, 1]) for (const k of [-110, 110]) Cyl(P(-560 + k, sy * 108, 44), 80, 16, 0x18181c, false, false, R(0, yaw, 90));
    if (snow) { Box(P(-190, 0, 504), V(280, 300, 14), snow, false, false, yaw); Box(P(250, 0, 378), V(520, 110, 12), snow, false, false, yaw); }
    solid(x, y, yaw, 1000, 320, 400); solid(M.L(V(x, y, 0), yaw, -560, 0, 0).X, M.L(V(x, y, 0), yaw, -560, 0, 0).Y, yaw, 420, 320, 400);
  };
  // a cabin or shack: walls, a pitched roof along its longer side, a lit window, a door on the `door` side (0 +X, 90 +Y, 180 -X, -90 -Y)
  K.cabin = (x0, y0, x1, y1, h, wall, roof, o = {}) => {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = x1 - x0, d = y1 - y0, alongX = w >= d, span = alongX ? d : w, rise = o.rise || span * 0.34;
    Box(V(cx, cy, h / 2), V(w, d, h), wall, true, true);
    if (o.logs) for (let z = 40; z < h; z += 52) { Box(V(cx, y0 - 3, z), V(w + 26, 6, 6), o.logs, false, false); Box(V(cx, y1 + 3, z), V(w + 26, 6, 6), o.logs, false, false); Box(V(x0 - 3, cy, z + 26), V(6, d + 26, 6), o.logs, false, false); Box(V(x1 + 3, cy, z + 26), V(6, d + 26, 6), o.logs, false, false); }
    const sl = Math.hypot(span / 2 + 40, rise), ang = Math.atan2(rise, span / 2 + 40) * 180 / Math.PI;
    for (const s of [-1, 1]) {
      const c = alongX ? V(cx, cy + s * (span / 4 + 10), h + rise / 2 + 6) : V(cx + s * (span / 4 + 10), cy, h + rise / 2 + 6);
      BoxRot(c, alongX ? V(w + 70, sl, 16) : V(sl, d + 70, 16), roof, alongX ? R(0, 0, s * ang) : R(-s * ang, 0, 0), true);
      if (o.snow) BoxRot(c.add(V(0, 0, 14)), alongX ? V(w + 40, sl * 0.78, 12) : V(sl * 0.78, d + 40, 12), o.snow, alongX ? R(0, 0, s * ang) : R(-s * ang, 0, 0), false);
    }
    for (const s of [-1, 1]) Pyramid(alongX ? V(cx + s * (w / 2 - 4), cy, h + rise / 2) : V(cx, cy + s * (d / 2 - 4), h + rise / 2), alongX ? V(10, span, rise) : V(span, 10, rise), wall);   // gable ends
    const door = o.door === undefined ? -90 : o.door, n = [Math.round(Math.cos(door * Math.PI / 180)), Math.round(Math.sin(door * Math.PI / 180))];
    const fx = n[0] ? (n[0] > 0 ? x1 : x0) : cx, fy = n[1] ? (n[1] > 0 ? y1 : y0) : cy, t = [-n[1], n[0]];
    Box(V(fx + n[0] * 3, fy + n[1] * 3, 105), n[0] ? V(6, 100, 210) : V(100, 6, 210), o.doorCol || 0x2a1e18, false, false);
    const wo = (n[0] ? d : w) * 0.3;
    for (const s of [-1, 1]) { Glow(V(fx + n[0] * 3 + t[0] * s * wo, fy + n[1] * 3 + t[1] * s * wo, 170), n[0] ? V(6, 80, 80) : V(80, 6, 80), s > 0 || !o.dark ? (o.glow || 0xFFB45A) : 0x2a2420); Box(V(fx + n[0] * 5 + t[0] * s * wo, fy + n[1] * 5 + t[1] * s * wo, 170), n[0] ? V(4, 8, 84) : V(8, 4, 84), 0x2a1e18, false, false); }
    if (o.chimney !== false) { const px = x0 + w * 0.22, py = y0 + d * 0.3; Box(V(px, py, h + rise * 0.7 + 60), V(60, 60, 200), o.stone || 0x5a5a62, true, false); if (o.smoke !== false) Lamp(V(fx + n[0] * 80, fy + n[1] * 80, 200), rgb(o.glow || 0xFFB45A), 8, 700, false); }
  };
  // a drift or a mound: a flattened ball, no collision
  K.mound = (x, y, w, d, h, col) => Ball(V(x, y, h * 0.1), V(w, d, h), col);
  // stacked strata along the top of a boundary wall
  K.cliffs = (x0, y0, x1, y1, z, cols, cap, step = 500) => {
    const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(len / step)), alongY = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    for (let i = 0; i <= n; i++) {
      const t = i / n, cx = x0 + (x1 - x0) * t + (alongY ? 0 : rr(-60, 60)), cy = y0 + (y1 - y0) * t + (alongY ? rr(-60, 60) : 0); let zz = z;
      const tiers = 1 + ((i * 7) % 3);
      for (let k = 0; k < tiers; k++) {
        const h = 140 + ((i + k * 5) % 4) * 70, w = 560 - k * 120 + rr(-40, 40), deep = 320 - k * 50, yaw = rr(-14, 14);
        Box(V(cx, cy, zz + h / 2), alongY ? V(deep, w, h) : V(w, deep, h), cols[(i + k) % cols.length], true, false, yaw);
        if (cap) Box(V(cx, cy, zz + h + 4), alongY ? V(deep + 14, w + 14, 20) : V(w + 14, deep + 14, 20), cap, false, false, yaw);
        zz += h;
      }
      if (i % 4 === 0) Pyramid(V(cx, cy, zz + 100), V(220, 220, 200), cap || cols[0], R(0, rr(0, 90), 0));
    }
  };
  // A slope from a doorway at (x, y) down into the lower district: a ramp on a solid footing, with the ground along both
  // sides closed to the flow field so everything comes up the middle. `alongY`: the way through runs along Y. `dir`: which
  // way (+1/-1 on that axis) is downhill.
  K.slope = (x, y, alongY, dir, zTop, zBot, run = 760, w = 400, col = 0x4a3a30, rock = 0x3a3a3e) => {
    const drop = zTop - zBot, P = (t) => (alongY ? [x, y + dir * (64 + t)] : [x + dir * (64 + t), y]), a = P(0), b = P(run);
    M.Slope(V(b[0], b[1], zBot), V(a[0], a[1], zTop), w, col);
    for (let k = 0; k < 4; k++) { const h = drop * (1 - (k + 1) / 4); if (h < 5) continue; const c = P(run * (k / 4 + 0.125)); Box(V(c[0], c[1], zBot + h / 2 - 16), alongY ? V(w - 20, run / 4 + 2, h) : V(run / 4 + 2, w - 20, h), rock, true, false); }
    for (const s of [-1, 1]) { const o0 = s > 0 ? w / 2 + 10 : -w / 2 - 110, o1 = s > 0 ? w / 2 + 110 : -w / 2 - 10;
      GM.NavBlockBox({ min: V(Math.min(a[0], b[0]) + (alongY ? o0 : 0), Math.min(a[1], b[1]) + (alongY ? 0 : o0), zBot), max: V(Math.max(a[0], b[0]) + (alongY ? o1 : 0), Math.max(a[1], b[1]) + (alongY ? 0 : o1), zBot + 100) }, 1); }
  };
  return K;
}
