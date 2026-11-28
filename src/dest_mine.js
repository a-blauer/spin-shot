// Copperdeep Mine, Under the Hill: the great working the gnomes cut into the hill for its copper, a cavern so big its
// roof is held up by pillars of the hill's own rock. You come down the shaft in the lift's cage at the south end, by the
// tally hut; the tramway runs from the landing north through the middle of the cavern to the copper seam in the north
// face, with a branch west to the old galleries (three adits driven into the west face) and one east to the smelter
// (the furnace, its slag heaps, the copper in stacks). The miners' camp is in the north-west, the still pool in the
// north-east, the stamp mill by the seam. The Blight (Nightshade) came out of the seam where they dug too deep: it
// heaves out of the north face west of the way on, a tunnel north out of the cavern.
//
// Local frame (dest.js): +Y north, +X east, z up; the floor flat at z = 0. Under a roof: ceilZ(x, y) is its height.
import * as THREE from 'three';
import { V, R } from './mapkit.js';
import { destKit } from './dest_kit.js';
import { blightMass } from './dest_props.js';
import { logPile, campfire, logSeat, flagFloor, rainBarrel, WC } from './dest_props_wood.js';
import { rock, toadstoolCluster, lanternPost, mix } from './village_shapes.js';
import { crate, sack, rowboat, trough, washLine } from './village_props.js';
import { barrel } from './dest_props_works.js';
import { MC, MGAUGE, MRAIL, cavePillar, mineTrack, oreTub, adit, LIFT, liftHead, furnace, slagHeap, ingotStack, stampMill, scaffold, oreCluster, minersHut, lampLine, lampLinePts, toolRack, handWinch } from './dest_props_mine.js';
import { shapeB as shape, shapeF, facet } from './propkit.js';

export const CM = { lift: [0, -5150], exit: [700, 5180], floor: [700, 4620], floorR: 880, furnace: [3900, -700], camp: [-3300, 3000], pool: [3500, 3500], heart: [-2300, 4850], mill: [2500, 4200], arena: [0, 300] };

export function buildMine(M, O) {
  const { hx, hy } = O;
  const K = destKit(M, 41, O, { exactNav: true }), { S, body, round, trunk, patch, path, rnd, rr, Box, lineDist } = K;
  const pick = (L) => L[Math.floor(rnd() * L.length)];
  const lit = (x, y, z, c = { r: 1, g: 0.78, b: 0.45 }, r = 800, g = 0xffd27a) => K.lit(x, y, z, c, r, g);

  // ---- the roof: rock overhead the whole way, highest over the middle, coming down to the walls; up through it at the
  // lift, the shaft. Stalactites hang from it here and there.
  const ceilZ = (x, y) => {
    const ex = Math.max(Math.abs(x) / hx, Math.abs(y) / hy), e = Math.min(1, Math.max(0, (ex - 0.6) / 0.4));
    let z = 2150 - 600 * e * e + 120 * Math.sin(x * 0.0019 + y * 0.0011) + 90 * Math.sin(x * 0.0043 - y * 0.0037 + 1.3) + 60 * Math.sin(x * 0.009 + y * 0.011 + 0.4);
    const ds = Math.hypot(x - CM.lift[0], y - CM.lift[1]); if (ds < 560) z += (3900 - z) * Math.pow(1 - ds / 560, 1.5);
    return z;
  };
  M.Shape('mceil|' + hx + '|' + hy, () => { const pos = [], cl = [], idx = [], C = new THREE.Color(), st = 300, x0 = -hx - 600, y0 = -hy - 600, nx = Math.ceil((2 * hx + 1200) / st), ny = Math.ceil((2 * hy + 1200) / st);
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const x = x0 + i * st + ((j * 7 + i * 13) % 5 - 2) * 30, y = y0 + j * st + ((i * 11 + j * 3) % 5 - 2) * 30, z = ceilZ(x, y) + ((i * 17 + j * 29) % 7 - 3) * 22, n = Math.sin(x * 0.013 + y * 0.007) + Math.sin(x * 0.005 - y * 0.017); pos.push(x, y, z); C.setHex(z > 2600 ? MC.rockD : n > 1.1 ? MC.rock[2] : n < -1.1 ? MC.rockD : MC.rock[(i + j * 3) % 4], THREE.NoColorSpace); cl.push(C.r, C.g, C.b); }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    return facet({ pos, col: cl, idx }); }, V(0, 0, 0), R(0, 0, 0));
  const tite = (len, seed) => ['mtite|' + len + '|' + seed, shapeF((G) => { G.tube([[0, 0, 40], [6, -4, -len * 0.5], [2, 3, -len]], (t) => Math.max(0.5, 26 * (1 - t) * (1 - t * 0.3)), MC.rock[seed % 4], { S: 6, M: 6, caps: false }); G.blob(0, 0, 30, 40, 36, 24, MC.rock[(seed + 1) % 4], { nu: 8, nv: 4 }); })];
  for (let i = 0; i < 60; i++) { const x = rr(-hx + 400, hx - 400), y = rr(-hy + 400, hy - 400); if (Math.hypot(x - CM.lift[0], y - CM.lift[1]) < 900) continue; S(tite(pick([120, 180, 260]), i % 4), x, y, ceilZ(x, y), rr(0, 360)); }

  // ---- the floor: rock, gravel, damp; ore dust toward the seam, cinders by the smelter
  Box(V(0, 0, -60), V(hx * 2 + 4000, hy * 2 + 4000, 120), MC.floor, true, false);
  for (let i = 0; i < 40; i++) patch(rr(-hx + 300, hx - 300), rr(-hy + 300, hy - 300), rr(300, 900), pick([0x524b42, 0x443e36, 0x5a5248, 0x3e3933]));
  for (let i = 0; i < 14; i++) patch(rr(-4200, 1200), rr(4300, 5500), rr(200, 500), pick([0x465a4c, 0x3e5244, 0x4c5e50]));
  for (let i = 0; i < 10; i++) patch(CM.furnace[0] + rr(-900, 700), CM.furnace[1] + rr(-1400, 1000), rr(200, 450), pick([0x302c2a, 0x3a3532, 0x2a2628]));

  // ---- the walls: the hill's rock all round, rough, floor to roof; the seam's green runs through the north face
  { const n = 6, A = hx - 140, B = hy - 140, N = 150, P = [];
    for (let i = 0; i < N; i++) { const t = (i / N) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t); P.push([A * Math.sign(c) * Math.abs(c) ** (2 / n), B * Math.sign(s) * Math.abs(s) ** (2 / n)]); }
    const NRM = P.map((p, i) => { const a = P[(i + N - 1) % N], b = P[(i + 1) % N], tx = b[0] - a[0], ty = b[1] - a[1], L = Math.hypot(tx, ty); return [ty / L, -tx / L]; });   // outward
    const din = (i, v) => Math.max(0, 56 + 50 * Math.sin(i * 0.69 + 1.1) + 34 * Math.sin(i * 2.1 + v * 4.1) + 26 * Math.sin(i * 4.7 - v * 6.3) + ((i * 7 + Math.round(v * 8) * 3) % 5 - 2) * 9);
    const seam = (x, y) => y > hy - 900 && x > -4700 && x < -200;
    M.Shape('mwall|' + hx + '|' + hy, () => { const pos = [], cl = [], idx = [], C = new THREE.Color(), nv = 8;
      for (let i = 0; i <= N; i++) { const k = i % N, [bx, by] = P[k], [nx2, ny2] = NRM[k], top = ceilZ(bx, by) + 140;
        for (let j = 0; j <= nv; j++) { const v = j / nv, d = din(k, v), z = -40 + v * (top + 40), x = bx - nx2 * d, y = by - ny2 * d, nn = Math.sin(k * 0.71 + j * 1.9) + Math.sin(k * 0.23 - j * 0.7);
          pos.push(x, y, z); const vn = Math.sin(k * 0.45 + j * 0.9) + 0.6 * Math.sin(k * 1.3 - j * 0.55 + 2); C.setHex(seam(bx, by) && vn > 0.75 && j > 0 ? (vn > 1.35 ? MC.oreL : vn > 1.05 ? MC.ore : MC.oreD) : j === 0 ? MC.rockD : nn > 1.1 ? MC.rockL : nn < -1.1 ? MC.rockD : MC.rock[(k + j) % 4], THREE.NoColorSpace); cl.push(C.r, C.g, C.b); } }
      for (let i = 0; i < N; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + 1, c = a + nv + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      return facet({ pos, col: cl, idx }); }, V(0, 0, 0), R(0, 0, 0));
    // the walking grid: shut beyond the wall's line (the corners of the place outside its rounded run)
    for (let gx = -hx + 50; gx < hx; gx += 100) for (let gy = -hy + 50; gy < hy; gy += 100) if (Math.abs(gx / (A - 40)) ** n + Math.abs(gy / (B - 40)) ** n > 1) O.GM.NavBlockBox({ min: V(gx - 50, gy - 50, 0), max: V(gx + 50, gy + 50, 100) }, 1);
    // its bodies: a run of thick blocks, each face at the furthest the rock comes in over its stretch
    for (let i = 0; i < N; i += 2) { const a = P[i], b = P[(i + 2) % N], [nx2, ny2] = NRM[(i + 1) % N]; let dm = 0; for (let k = i; k <= i + 2; k++) for (const v of [0, 0.03, 0.06, 0.09]) dm = Math.max(dm, din(k % N, v)); const L = Math.hypot(b[0] - a[0], b[1] - a[1]) + 30, T = 500 + dm, mx = (a[0] + b[0]) / 2 + nx2 * (T / 2 - dm), my = (a[1] + b[1]) / 2 + ny2 * (T / 2 - dm);
      body(mx, my, L, T, 2400, (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI); }
  }

  // ---- the pillars that hold the roof: round the open middle, between the parts of the mine
  const PILLARS = [[-2800, -2700, 320, 1], [2800, -3000, 280, 2], [-3500, 600, 340, 3], [3300, 1600, 320, 4], [-2100, 3300, 280, 5], [1700, 2500, 300, 6], [-1100, -3300, 190, 7], [1500, -3700, 210, 8],
    [4500, -4500, 260, 9], [-4400, -4600, 240, 10], [-4500, 4700, 260, 11], [4400, 5000, 230, 12], [-200, -2000, 170, 13], [2300, -1600, 200, 14]];
  for (const [x, y, r, sd] of PILLARS) { const h = ceilZ(x, y); S(cavePillar(r, h, sd), x, y, 0, rr(0, 360)); round(x, y, r * 1.02, h); for (let k = 0; k < 5; k++) { const a = rr(0, Math.PI * 2), d = r * rr(1.32, 1.6), s = pick([16, 22, 28]); S(rock(s, pick([1, 2, 3]), false), x + Math.cos(a) * d, y + Math.sin(a) * d, -s * 0.3, rr(0, 360)); } }

  // ---- the tramway: from the landing north through the middle to the seam; a branch west to the galleries and one east
  // to the smelter; the adits' own short roads in
  const TRAM = [[[300, -4800], [300, 3900]], [[300, -2100], [-4000, -2100]], [[300, -700], [3200, -700]], [[-4000, -2100], [-4000, -3200]], [[-4000, -2100], [-4000, -400]]];
  TRAM.forEach(([a, b], k) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); S(mineTrack(L + 60, k + 1), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, k * 0.05, (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI); });
  const nearTram = (x, y, m) => TRAM.some(([a, b]) => lineDist(x, y, [a, b]) < m);
  TRAM.forEach(([a, b], k) => K.band([a, b], 300, 1.2 + k * 0.04, (i, j) => (j === 0 || j === 4 ? 0x46403a : [0x3a3530, 0x3e3934, 0x36322e][(i + j + k) % 3]), 0.2));
  for (const [x, y] of [[-1400, -3900], [1100, -2600], [-2300, -400], [2200, 1300], [-1000, 2300], [3600, -3600], [-3700, -4200], [3900, 4600]]) patch(x, y, rr(110, 200), pick([0x2e3a40, 0x34424a, 0x2a363c]));
  // tubs along it: full ones waiting, one run off the rails and tipped over
  for (const [x, y, yaw, load] of [[300, -3700, 90, 1], [300, -3550, 90, 1], [300, -1200, 90, 0], [-1500, -2100, 0, 2], [-1650, -2100, 0, 2], [1900, -700, 0, 1], [300, 3400, 90, 1], [300, 3250, 90, 1], [-4000, -2900, 90, 2]]) { S(oreTub(load, Math.round(x - y)), x, y, MRAIL, yaw); body(x, y, yaw === 90 ? 100 : 150, yaw === 90 ? 150 : 100, 100); }
  S(oreTub(0, 4), 640, 1180, 0, 25); body(640, 1180, 150, 100, 100, 25);   // off the rails, its load spilled
  S(['mspill', shape((G) => { G.blob(0, 0, 0, 110, 70, 18, (nx, ny) => (Math.sin(nx * 11 + ny * 7) > 0.4 ? MC.ore : MC.rock[1]), { nu: 12, nv: 4, warp: (x, y, z) => [x, y, Math.max(z, -3)] }); })], 790, 1260, 0, 30);

  // ---- the landing at the foot of the shaft: the headframe and its cage, the tally hut, crates and sacks of ore
  { const [x, y] = CM.lift; S(liftHead(), x, y, 0, 90); body(x, y, 2 * LIFT.base + 30, 2 * LIFT.base + 30, LIFT.top); lit(x, y, 3400, { r: 0.8, g: 0.88, b: 1 }, 1400, 0xdde8ff); lit(x + 260, y + 120, 240); }
  S(minersHut(320, 420, 1), -1000, -5000, 0, 0); body(-1000, -5000, 340, 440, 300); lit(-1000 + 180, -5000 - 140, 230);
  for (const [x, y, w] of [[900, -5150, 70], [970, -5080, 60], [930, -5010, 64], [880, -4900, 70]]) S(crate(w, Math.round(Math.abs(x + y))), x, y, 0, rr(-10, 10)); body(930, -5040, 190, 300, 140);
  for (const [x, y] of [[-600, -5300], [-540, -5250], [-610, -5200], [-560, -5330]]) S(sack(28, pick([0x8a7a5a, 0x7a6a4e])), x, y, -3, rr(0, 360)); body(-580, -5270, 150, 180, 56);
  S(logSeat(220), 600, -4950, 0, 0); body(600, -4950, 60, 230, 52);
  S(['mbell', shape((G) => { G.box(0, 0, 140, 6, 6, 140, MC.timber); G.box(0, 0, 4, 12, 12, 4, MC.timberD); G.box(14, 0, 266, 20, 4, 4, MC.iron); G.lathe([[2, 0], [10, 2], [13, 18], [15, 24], [0, 25]], MC.copper, 10, [30, 0, 238]); G.tube([[30, 0, 263], [30, 0, 268]], 1.5, MC.iron, { S: 4, M: 2 }); G.tube([[30, 0, 240], [24, 4, 120]], 0.8, MC.rope, { S: 4, M: 3 }); })], 360, -4880, 0, 180); round(360, -4880, 12, 280, 0, false);
  S(lampLine(900), -500, -4700, 0, 0); for (const [lx, ly, lz] of lampLinePts(900)) lit(-500 + lx, -4700 + ly, lz, undefined, 500); body(-500, -4700 - 450, 30, 30, 320); body(-500, -4700 + 450, 30, 30, 320);

  // ---- the old galleries in the west face: three adits, their tramways running in, pit props stacked, tubs
  for (const [i, y] of [-3200, -1200, 800].entries()) { const x = -hx + 470, h = ceilZ(x, y) + 160; S(adit(860, 420, h, i + 1), x, y, 0, 0); body(x - 20, y, 420, 860, h); lit(x + 240, y + 190, 230, undefined, 600); }
  for (const [x, y] of [[-3700, -3800], [-3600, 0]]) { S(logPile(5, 360, 26, Math.abs(x + y)), x, y, 0, 90); body(x, y, 400, 296, 240); }
  for (const [x, y] of [[-3900, -1600], [-3850, -1520], [-3790, -1600]]) S(barrel(Math.abs(Math.round(x * 3 + y))), x, y, 0, 0); body(-3850, -1570, 180, 160, 92);
  for (const [x, y] of [[-4350, -2500], [-4350, 200]]) { S(toolRack(), x, y, 0, 0); body(x + 20, y, 70, 240, 150); }
  S(handWinch(), -4200, -3800, 0, 0); body(-4200, -3800, 110, 200, 130);

  // ---- the smelter in the east: the furnace (its fire lit), slag heaps, copper stacked, charcoal, the quench trough
  { const [x, y] = CM.furnace, ch = ceilZ(x, y) + 40; S(furnace(ch), x, y, 0, 180); body(x, y, 560, 560, 560); round(x, y, 120, ch); body(x + 390, y, 240, 300, 300); body(x, y - 400, 90, 220, 70); body(x, y - 610, 100, 260, 40, 0, 0, false);
    lit(x - 290, y, 80, { r: 1, g: 0.5, b: 0.18 }, 1300, 0xff8a3a); lit(x - 70, y - 470, 40, { r: 1, g: 0.6, b: 0.25 }, 500, 0xffa850); }
  for (const [x, y, r, sd] of [[4500, -2100, 200, 1], [4700, -1500, 150, 2], [4300, 300, 170, 3]]) { S(slagHeap(r, sd), x, y, 0, rr(0, 360)); round(x, y, r * 0.9, r * 0.42); }
  for (const [x, y, n] of [[2900, -1250, 5], [2750, -1250, 3], [2900, 0, 4]]) { S(ingotStack(n, Math.abs(Math.round(x + y))), x, y, 0, rr(-6, 6)); body(x, y, 140, 140, 14 + n * 13); }
  for (const [x, y] of [[3400, 600], [3470, 640], [3420, 690], [3500, 560]]) S(sack(28, 0x2e2a26), x, y, -3, rr(0, 360)); body(3450, 620, 170, 190, 56);
  S(trough(220), 3200, -1500, 0, 0); body(3200, -1500, 240, 90, 60);
  S(['mcharcoal', shape((G) => { G.blob(0, 0, 0, 170, 140, 70, (nx, ny) => (Math.sin(nx * 19 + ny * 13) > 0.5 ? 0x3a3432 : MC.coal), { nu: 14, nv: 6, warp: (x, y, z) => [x, y, Math.max(z, -3)] }); })], 4400, -3000, 0, 20); round(4400, -3000, 150, 66);
  S(rainBarrel(4), 3330, -1650, 0, 0); round(3330, -1650, 34, 100);
  S(lampLine(1000), 2700, -960, 0, 90); for (const [lx, ly, lz] of lampLinePts(1000)) lit(2700 - ly, -960 + lx, lz, undefined, 500); body(2700 - 500, -960, 30, 30, 320); body(2700 + 500, -960, 30, 30, 320);

  // ---- the miners' camp in the north-west: three huts round the fire, seats, the lamps on their line, the stores
  { const [cx, cy] = CM.camp; S(campfire(), cx, cy, 0, 0); round(cx, cy, 92, 180); lit(cx, cy, 40, { r: 1, g: 0.55, b: 0.25 }, 800, 0xff8a3a);
    for (const [dx, dy, yaw, sd] of [[-700, 350, 0, 1], [-200, 800, -90, 2], [550, 650, -130, 3]]) { const x = cx + dx, y = cy + dy; S(minersHut(320, 420, sd), x, y, 0, yaw); body(x, y, 340, 440, 300, yaw); }
    for (const [dx, dy, yaw] of [[0, -260, 0], [-240, 60, 90], [230, 80, 90]]) { S(logSeat(200), cx + dx, cy + dy, 0, yaw); body(cx + dx, cy + dy, yaw ? 210 : 60, yaw ? 60 : 210, 52); }
    S(lampLine(800), cx + 700, cy - 200, 0, 90); for (const [lx, ly, lz] of lampLinePts(800)) lit(cx + 700 - ly, cy - 200 + lx, lz, undefined, 500); body(cx + 300, cy - 200, 30, 30, 320); body(cx + 1100, cy - 200, 30, 30, 320);
    for (const [x, y, w] of [[cx - 900, cy - 300, 70], [cx - 960, cy - 230, 60]]) S(crate(w, Math.round(Math.abs(x + y))), x, y, 0, rr(-8, 8)); body(cx - 930, cy - 265, 180, 180, 140);
    S(rainBarrel(3), cx - 380, cy + 800, 0, 0); round(cx - 380, cy + 800, 34, 100);
    S(washLine(420, 2), cx - 500, cy - 760, 0, 0); body(cx - 710, cy - 760, 20, 20, 200); body(cx - 290, cy - 760, 20, 20, 200); }

  // ---- the still pool in the north-east: black water, stones round it, a boat drawn up, a little jetty
  { const [px, py] = CM.pool, rx = 900, ry = 650; M.Shape('mpool', () => { const pos = [], cl = [], idx = [], C = new THREE.Color(), n = 40;
      pos.push(0, 0, 1.4); C.setHex(0x1e3a40, THREE.NoColorSpace); cl.push(C.r, C.g, C.b);
      for (let ring = 1; ring <= 3; ring++) for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, w = 1 + 0.12 * Math.sin(a * 3 + 0.7) + 0.07 * Math.sin(a * 7), k = ring / 3; pos.push(Math.cos(a) * rx * w * k, Math.sin(a) * ry * w * k, 1.4); C.setHex(ring === 3 ? 0x3e5a58 : ring === 2 ? 0x24464c : 0x1e3a40, THREE.NoColorSpace); cl.push(C.r, C.g, C.b); }
      for (let i = 0; i < n; i++) idx.push(0, 1 + i, 1 + ((i + 1) % n)); for (let ring = 1; ring < 3; ring++) for (let i = 0; i < n; i++) { const a = 1 + (ring - 1) * n + i, b = 1 + (ring - 1) * n + ((i + 1) % n), c = a + n, d = b + n; idx.push(a, c, b, b, c, d); }
      return { pos, col: cl, idx }; }, V(px, py, 1.1), R(0, 0, 0));   // over every patch of floor
    for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2 + rr(-0.05, 0.05), w = 1 + 0.12 * Math.sin(a * 3 + 0.7) + 0.07 * Math.sin(a * 7), x = px + Math.cos(a) * rx * w * 1.02, y = py + Math.sin(a) * ry * w * 1.02; if (i % 2) S(rock(pick([26, 34, 44]), pick([1, 2, 3]), false), x, y, -8, rr(0, 360)); }
    S(rowboat(300, 0x6a4a30, 2), px - 700, py - 520, 0, 30); body(px - 700, py - 520, 300, 120, 70, 30);
    S(['mjetty', shape((G) => { for (const x of [-20, 180]) for (const y of [-60, 60]) G.box(x, y, 10, 8, 8, 14, MC.timberD); for (let x = -40; x < 200; x += 24) G.box(x + 12, 0, 16, 11, 70, 2.5, Math.round(x / 24) % 2 ? MC.timber : MC.timberL); })], px - 940, py + 80, 0, 0); body(px - 860, py + 80, 250, 150, 16, 0, 0, false);
    lit(px - 900, py + 260, 220, undefined, 600); S(lanternPost(300, 3), px - 830, py + 260, 0, 180); round(px - 830, py + 260, 12, 300, 0, false); }

  // ---- the copper seam in the north face: scaffolds against it, the ore glowing out of the rock, the stamp mill that
  // crushed it, tubs at the foot of the face
  for (const [x, w, h] of [[-3900, 1200, 900], [-1000, 900, 600]]) { const y = hy - 140 - 260; S(scaffold(w, h, Math.abs(x)), x, y, 0, -90); body(x, y + 10, w + 40, 170, h + 80); }
  for (let i = 0; i < 22; i++) { const x = rr(-4600, -300), y = hy - 140 - rr(120, 260); if (Math.abs(x + 3900) < 640 || Math.abs(x + 1000) < 500) continue; const r = pick([40, 55, 70]); S(oreCluster(r, i), x, y, 0, rr(0, 360)); round(x, y, r * 0.8, r * 1.4); if (i % 3 === 0) lit(x, y, r * 1.2, { r: 0.4, g: 1, b: 0.75 }, 380, 0x7ae0b8); }
  { const [x, y] = CM.mill; S(stampMill(), x, y, 0, 0); body(x - 25, y, 250, 520, 520); body(x - 160, y, 120, 320, 340); lit(x + 120, y - 280, 200, undefined, 600); }

  // ---- the Blight: Nightshade, out of the seam where they dug too deep; growth across the floor
  const blightAt = [];
  for (const [x, y, r, sd] of [[CM.heart[0], CM.heart[1], 460, 3], [CM.heart[0] + 900, CM.heart[1] - 300, 220, 4], [CM.heart[0] - 800, CM.heart[1] - 350, 260, 5], [1400, 900, 200, 6]]) { S(blightMass(r, sd, 'shade'), x, y, 0, rr(0, 360)); trunk(x, y, r * 0.62, r * 0.55); blightAt.push([x, y, r]); lit(x, y, r * 0.5 + 10, { r: 0.9, g: 0.5, b: 1 }, 500 + r, 0xe27cff); }
  for (const [x, y, r] of blightAt) for (let k = 0; k < 5; k++) { const a = rr(0, Math.PI * 2), d = rr(r * 0.8, r * 2.4); patch(x + Math.cos(a) * d, y + Math.sin(a) * d, rr(200, 460), pick([0x3a2a44, 0x46324e, 0x2e2238])); }
  for (let i = 0; i < 24; i++) { const [bx, by, br] = blightAt[i % blightAt.length], a = rr(0, Math.PI * 2), d = rr(br + 200, br + 1200), x = bx + Math.cos(a) * d, y = by + Math.sin(a) * d; if (Math.abs(x) > hx - 400 || Math.abs(y) > hy - 400 || !K.clear(x, y, 60) || nearTram(x, y, 120)) continue; const s = pick([0.7, 0.9, 1.1]); S(toadstoolCluster(s, 0x56367c, pick([1, 2, 3])), x, y, 0, rr(0, 360)); round(x, y, 22 * s, 40 * s, 0, false); }

  // ---- the way on: a great tunnel north out of the cavern; the stations come up on the flags before it
  { const [x, y] = CM.exit, h = ceilZ(x, y + 330) + 200; S(adit(1700, 700, h, 7, 300, 480), x, y + 330, 0, -90); body(x, y + 360, 1700, 640, h); for (const s of [-1, 1]) lit(x + s * 380, y + 40, 420, undefined, 700); }
  { const [x, y] = CM.floor; S(flagFloor(CM.floorR, 2, 0x2e2a26, false, [0x7a7266, 0x6e665c, 0x847a6c, 0x6a6258]), x, y, 0.4, 0); }
  // lamps on posts round the foot of the walls, a little in from the rock; scree along the foot
  { const n = 6, A = hx - 140, B = hy - 140; for (let i = 0; i < 28; i++) { const t = ((i + 0.5) / 28) * Math.PI * 2, c = Math.cos(t), s2 = Math.sin(t), bx = A * Math.sign(c) * Math.abs(c) ** (2 / n), by = B * Math.sign(s2) * Math.abs(s2) ** (2 / n), L = Math.hypot(bx, by), x = bx - (bx / L) * 330, y = by - (by / L) * 330;
      if (Math.hypot(x - CM.lift[0], y - CM.lift[1]) < 700 || Math.hypot(x - CM.exit[0], y - CM.exit[1]) < 1100 || y > hy - 900 && x > -4800 && x < -300 || !K.clear(x, y, 60)) continue; const yaw = (Math.atan2(-by, -bx) * 180) / Math.PI; S(lanternPost(300, i % 4), x, y, 0, yaw + 180); round(x, y, 12, 300, 0, false); lit(x + Math.cos((yaw * Math.PI) / 180) * 62, y + Math.sin((yaw * Math.PI) / 180) * 62, 242, undefined, 650); }
    for (let i = 0; i < 90; i++) { const t = rr(0, Math.PI * 2), c = Math.cos(t), s2 = Math.sin(t), bx = A * Math.sign(c) * Math.abs(c) ** (2 / n), by = B * Math.sign(s2) * Math.abs(s2) ** (2 / n), L = Math.hypot(bx, by), d = rr(200, 320), x = bx - (bx / L) * d, y = by - (by / L) * d; if (!K.clear(x, y, 40) || nearTram(x, y, 160)) continue; const r = pick([14, 20, 26, 34]); S(rock(r, pick([1, 2, 3]), false), x, y, -r * 0.3, rr(0, 360)); if (r >= 26) round(x, y, r * 0.8, r * 0.9); } }
  // lamps on posts along the tramway and about the middle
  for (const [x, y] of [[620, -3400], [-20, -1300], [620, 800], [-20, 2400], [-1800, -2350], [-3100, -1850], [1500, -450], [2300, -950], [-600, 3700], [1600, 3900]]) { S(lanternPost(300, Math.abs(Math.round(x + y)) % 4), x, y, 0, x < 300 ? 0 : 180); round(x, y, 12, 300, 0, false); lit(x + (x < 300 ? 62 : -62), y, 242, undefined, 700); }
  // loose rock and scree about the floor
  for (let i = 0; i < 70; i++) { const x = rr(-hx + 300, hx - 300), y = rr(-hy + 300, hy - 300); if (!K.clear(x, y, 80) || nearTram(x, y, 120) || Math.hypot(x - CM.floor[0], y - CM.floor[1]) < CM.floorR + 200 || Math.hypot(x - CM.arena[0], y - CM.arena[1]) < 1400) continue; const r = pick([16, 22, 30, 40]); S(rock(r, pick([1, 2, 3]), false), x, y, -r * 0.3, rr(0, 360)); if (r >= 30) round(x, y, r * 0.8, r * 0.9); }

  return {
    spots: { spawn: [0, -4450], yaw: Math.PI, exit: CM.exit, textYaw: -90, ammo: [600, -4600], ammoYaw: 90,
      bench: [60, 4760], benchYaw: 0, box: [1340, 4520], chest: [1340, 4520], chestYaw: 180, press: [60, 4260], pressYaw: 0 },
    keep: [[CM.floor[0], CM.floor[1], CM.floorR]], bossAt: CM.arena, hangs: null, beds: null,
  };
}
