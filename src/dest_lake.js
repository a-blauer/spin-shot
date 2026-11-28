// Lantern Lake, in the Wildwood: a lake in a clearing of the old forest, where the forest folk keep Lantern Night every
// midsummer. They hang lanterns all round its shore, light the great lantern in the pavilion on its island and set little
// lantern boats out on the water. The festival was being got ready when the Blight came. The road comes in from the south
// under the festival's arch, between lantern posts, to the green on the south shore: the lantern canopy strung from its
// pole, the supper tables laid under it, the stalls round it (two knocked flat when everyone ran). The boardwalk runs
// from the green across the shallows to the island and its pavilion. West of the green, the lantern-makers' hamlet: their
// workshop and their house, the drying racks, the makers' benches; their boathouse and jetty on the shore below it. The
// old weeping willow on the west shore. East, the festival field, the beacon built on it and never lit (where the boss
// comes); the festival-goers' tents beyond it to the north-east round their fire. The Blight (Mirecap) came down the
// stream from the north and came up in the reeds where it runs into the lake: its heart is there, its threads out along
// the north shore and over the water toward the island, and the lanterns near it have burnt out. The way on: the old
// stones where the forest road leaves to the north.
//
// Local frame (dest.js): +Y north, +X east, z up; the ground is flat at z = 0. Playable: x in [-5600, 5600],
// y in [-6000, 6000]. The lake and the stream are shallow: anything can wade them anywhere.
import * as THREE from 'three';
import { V, R } from './mapkit.js';
import { destKit } from './dest_kit.js';
import { blightMass, farTree } from './dest_props.js';
import { oak, oakTrunk, logCabin, CB, flagFloor, footbridge, FB, logSeat, campfire, standingStone } from './dest_props_wood.js';
import { alder, alderTrunk, fenReeds } from './dest_props_fen.js';
import { tree, toadstoolCluster, grassTuft, rock, hill, VC } from './village_shapes.js';
import { lilies, rowboat, crate, woodpile, cart } from './village_props.js';
import { marketStall, stallWreck } from './dest_props_town.js';
import { lanternString, festivalPole, lakePost, deadPost, stallLanterns, pavilion, PAV, walkway, landing, lakeJetty, boathouse, BH, lanternBoat, trestle, dryingRack, weepingWillow, willowTrunk, tent, TENT, bonfire, BONF, lakeArch, ARCH, fallenLantern, withies, strawBale, bunting } from './dest_props_lake.js';

export const LL = {
  spawn: [0, -5300], floor: [0, 4900], floorR: 850, lake: [-300, 1150], lakeR: [2750, 2000], isle: [150, 1500], isleR: 700,
  green: [0, -2250], arch: [0, -4450], workshop: [-3450, -2350], house: [-3550, -3850], heart: [-1550, 3350],
  field: [3900, -400], beacon: [4300, 1700], camp: [3600, 3700], willow: [-3330, 1350],
};
// the lake's shore (a: the angle round it; m: how far out past the shore), and whether a spot is in it
const lakeK = (a) => 1 + 0.07 * Math.sin(3 * a + 0.6) + 0.05 * Math.sin(5 * a + 2.1) + 0.04 * Math.sin(2 * a + 1);
const lakeAt = (a, m = 0) => { const k = lakeK(a); return [LL.lake[0] + Math.cos(a) * (LL.lakeR[0] * k + m), LL.lake[1] + Math.sin(a) * (LL.lakeR[1] * k + m)]; };
const inLake = (x, y, m = 0) => { const dx = x - LL.lake[0], dy = y - LL.lake[1], a = Math.atan2(dy / LL.lakeR[1], dx / LL.lakeR[0]), k = lakeK(a); return Math.hypot(dx / (LL.lakeR[0] * k + m), dy / (LL.lakeR[1] * k + m)) < 1; };
// the island
const isleK = (a) => 1 + 0.08 * Math.sin(3 * a + 1.2) + 0.05 * Math.sin(5 * a);
const isleAt = (a, m = 0) => [LL.isle[0] + Math.cos(a) * (LL.isleR * isleK(a) + m), LL.isle[1] + Math.sin(a) * (LL.isleR * isleK(a) + m)];
const onIsle = (x, y, m = 0) => { const dx = x - LL.isle[0], dy = y - LL.isle[1]; return Math.hypot(dx, dy) < LL.isleR * isleK(Math.atan2(dy, dx)) + m; };
// water: in the lake by more than m, and not on the island or within m of it
const inWater = (x, y, m = 0) => inLake(x, y, -m) && !onIsle(x, y, m);
// the stream down from the north into the lake's north-west
const STREAM = [[-2750, 6100], [-2560, 5300], [-2360, 4500], [-2170, 3800], [-2020, 3250], [-1930, 2700]];
// the roads and paths
const ROAD = [[0, -6100], [50, -5000], [-60, -4200], [0, -3350]];
const ROAD_N = [[0, 5300], [0, 6100]];
const NPATH = [[0, 4150], [-100, 3650], [-250, 3100]];
const SHORE_W = [[-1560, -1010], [-1250, -1170], [-850, -1320]];
const SHORE_E = [[850, -1280], [1350, -1020], [1900, -680], [2500, -560], [3000, -600]];
const WEST = [[-1250, -2450], [-1950, -2500], [-2750, -2380]];
const EAST = [[1250, -2750], [2100, -2700], [2900, -2250]];
const NTRAIL_W = [[-3300, 1900], [-3080, 2700], [-2620, 3420], [-2170, 3720], [-1500, 3820], [-750, 3580], [-250, 3100]];
const NTRAIL_E = [[-250, 3100], [600, 3380], [1500, 3330], [2300, 3020], [3000, 3000]];
const CAMPWAY = [[3000, 3000], [3400, 2400], [3500, 1500], [3700, 800]];
const PATHS = [ROAD, ROAD_N, NPATH, SHORE_W, SHORE_E, WEST, EAST, NTRAIL_W, NTRAIL_E, CAMPWAY];
// the boardwalk from the green out to the island, turning on two landings
const WALK = [[-40, -1060], [-20, -250], [100, 420], [150, 860]];

export function buildLake(M, O) {
  const { hx, hy } = O;
  const K = destKit(M, 47, O, { exactNav: true }), { S, body, round, trunk, patch, path, band, rnd, rr, lineDist, Box, Lamp, Glow } = K;
  const pick = (L) => L[Math.floor(rnd() * L.length)];
  const SOL = (x, y, w, d, h, yaw = 0, nav = true) => body(x, y, w, d, h, yaw, 0, nav);
  const D2R = Math.PI / 180, MIRE = { r: 0.45, g: 1, b: 0.82 }, MIRE_GLOW = 0x6effd2, WARM = { r: 1, g: 0.64, b: 0.32 };
  const at = (x, y, yaw, u, v) => [x + u * Math.cos(yaw * D2R) - v * Math.sin(yaw * D2R), y + u * Math.sin(yaw * D2R) + v * Math.cos(yaw * D2R)];
  const navBand = (x, y, w, d) => O.GM.NavBlockBox({ min: V(x - w / 2, y - d / 2, 0), max: V(x + w / 2, y + d / 2, 100) }, 1);
  const roofBody = (x, y, yaw, hl, hw, ze, zr) => { for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const v0 = hw * (1 - i / 4), v1 = hw * (1 - (i + 1) / 4), z0 = ze + (zr - ze) * (i / 4), z1 = ze + (zr - ze) * ((i + 1) / 4), [px, py] = at(x, y, yaw, 0, sd * (v0 + v1) / 2); body(px, py, hl * 2, v0 - v1, z1 - z0 + 14, yaw, z0 - 6); } };
  const both = (P, x, y, z, yaw) => { S(P.main, x, y, z, yaw); M.Shape(P.glow[0], P.glow[1], V(x, y, z), R(0, yaw, 0), 0xffffff, 1, true); };
  const SPOT = [];   // things the trees and the scatter keep off: [x, y, r]
  // a trestle table and its benches; the jugs on the supper tables, the frames and the paste pot on the makers' benches
  // are solid too
  const table = (x, y, yaw, sd, goods) => { S(trestle(sd, goods), x, y, 0, yaw); body(x, y, 304, 190, 80, yaw); SPOT.push([x, y, 200]);
    for (const [u, v, w, h] of goods ? [[0, -10, 36, 24], [45, 16, 36, 24], [130, 15, 26, 31]] : [[-125, 14, 26, 31], [40, 22, 26, 31]]) { const [px, py] = at(x, y, yaw, u, v); body(px, py, w, w, h, yaw, 79); } };
  const keepOff = (x, y, m = 0) => SPOT.some(([sx, sy, r]) => Math.hypot(x - sx, y - sy) < r + m);
  const onPath = (x, y, m = 0) => PATHS.some((P) => lineDist(x, y, P) < m) || lineDist(x, y, WALK) < 100 + m;

  // ---- a lantern post: lit (its lantern glowing, a pool of light under it) or burnt out; its arm reaches yaw-wards
  const post = (x, y, yaw, h = 300, lit = true) => { const sd = Math.abs(Math.round(x + y)) % 5;
    if (lit) { both(lakePost(h, sd), x, y, 0, yaw); const [lx, ly] = at(x, y, yaw, 64, 0); Lamp(V(lx, ly, h - 40), WARM, 2.2, 520, false); } else S(deadPost(h, sd), x, y, 0, yaw);
    round(x, y, 16, h); SPOT.push([x, y, 60]); };

  // ---- the ground: the clearing's grass going blue at dusk, the green trampled, the field mown
  Box(V(0, 0, -60), V(hx * 2 + 24000, hy * 2 + 24000, 120), 0x50693c, true, false);
  for (let i = 0; i < 44; i++) { const x = rr(-hx + 300, hx - 300), y = rr(-hy + 300, hy - 300); if (inLake(x, y, 500)) continue; patch(x, y, rr(500, 1200), pick([0x56703f, 0x4c6438, 0x5a7444, 0x52683a])); }
  patch(LL.green[0], LL.green[1], 2500, 0x62784a); patch(LL.green[0] - 200, LL.green[1] + 100, 1700, 0x6a7e50); patch(LL.green[0] + 300, LL.green[1] - 300, 900, 0x707e52);
  patch(LL.field[0], LL.field[1] + 300, 2600, 0x6a8048); patch(LL.field[0] + 100, LL.field[1] + 900, 1600, 0x728850);
  patch(LL.camp[0], LL.camp[1], 1700, 0x5e7244); patch(LL.workshop[0] + 500, LL.workshop[1] - 600, 1600, 0x5e6e44);

  // ---- the lake: a muddy bank, the shallows paler, darker out in the middle; the island in it, its sandy rim; the
  // stream down into it from the north-west between its banks
  M.Shape('lklake', () => { const pos = [], col = [], idx = [], C = new THREE.Color(), n = 112;
    const ring = (m, z, c) => { const b = pos.length / 3; C.setHex(c, THREE.NoColorSpace); for (let i = 0; i < n; i++) { const [x, y] = lakeAt((i / n) * Math.PI * 2, m); pos.push(x, y, z); col.push(C.r, C.g, C.b); } return b; };
    const RG = [ring(160, 0.7, 0x4e4a36), ring(14, 0.86, 0x58603e), ring(-80, 1.05, 0x6a8296), ring(-420, 1.05, 0x546e88), ring(-1100, 1.05, 0x46607c)];
    const c0 = pos.length / 3; C.setHex(0x405a76, THREE.NoColorSpace); pos.push(LL.lake[0], LL.lake[1], 1.05); col.push(C.r, C.g, C.b);
    for (let r = 0; r < RG.length - 1; r++) { const a = RG[r], b = RG[r + 1]; for (let i = 0; i < n; i++) { const j = (i + 1) % n; idx.push(a + i, a + j, b + i, a + j, b + j, b + i); } }
    const L0 = RG[RG.length - 1]; for (let i = 0; i < n; i++) idx.push(L0 + i, L0 + ((i + 1) % n), c0);
    return { pos, col, idx }; }, V(0, 0, 0), R(0, 0, 0));
  M.Shape('lkisle', () => { const pos = [], col = [], idx = [], C = new THREE.Color(), n = 64;
    const ring = (m, z, c) => { const b = pos.length / 3; C.setHex(c, THREE.NoColorSpace); for (let i = 0; i < n; i++) { const [x, y] = isleAt((i / n) * Math.PI * 2, m); pos.push(x - LL.isle[0], y - LL.isle[1], z); col.push(C.r, C.g, C.b); } return b; };
    const RG = [ring(46, 1.25, 0x8a7c5a), ring(0, 1.6, 0x6e7646), ring(-110, 1.6, 0x5a7440)];
    const c0 = pos.length / 3; C.setHex(0x5a7440, THREE.NoColorSpace); pos.push(0, 0, 1.6); col.push(C.r, C.g, C.b);
    for (let r = 0; r < RG.length - 1; r++) { const a = RG[r], b = RG[r + 1]; for (let i = 0; i < n; i++) { const j = (i + 1) % n; idx.push(a + i, a + j, b + i, a + j, b + j, b + i); } }
    const L0 = RG[RG.length - 1]; for (let i = 0; i < n; i++) idx.push(L0 + i, L0 + ((i + 1) % n), c0);
    return { pos, col, idx }; }, V(LL.isle[0], LL.isle[1], 0), R(0, 0, 0));
  band(STREAM.slice(0, 5), 330, 0.72, (i, j) => (j === 0 || j === 4 ? 0x4e4a36 : 0x58603e), 0.1);
  band(STREAM, 210, 1.0, (i, j) => (j === 0 || j === 4 ? 0x6a8aa0 : (i + j) % 5 === 0 ? 0x7896aa : 0x52728c), 0.08);
  // stones in the stream's bed, the water running round them
  for (const [u, v, r, sd] of [[0.18, 40, 46, 1], [0.26, -50, 38, 2], [0.47, 30, 52, 3], [0.6, -40, 40, 1], [0.78, 20, 44, 2]]) { const k = Math.min(STREAM.length - 2, Math.floor(u * (STREAM.length - 1))), f = u * (STREAM.length - 1) - k, [x0, y0] = STREAM[k], [x1, y1] = STREAM[k + 1], L = Math.hypot(x1 - x0, y1 - y0), x = x0 + (x1 - x0) * f - ((y1 - y0) / L) * v, y = y0 + (y1 - y0) * f + ((x1 - x0) / L) * v;
    if (Math.hypot(x + 2170, y - 3730) < 330) continue; S(rock(r, sd, false), x, y, -r * 0.35, rr(0, 360)); round(x, y, r * 0.9, r * 0.55); }

  // ---- the road in from the south, the festival's arch over it, lantern posts along it
  { const [x, y] = LL.arch; both(lakeArch(1), x, y, 0, -90);
    for (const sx of [-1, 1]) { round(x + sx * (ARCH.w / 2 - 20), y, 20, ARCH.h); }
    M.Sign(V(x, y - 6, ARCH.h - 128), -90, 'LANTERN LAKE', { r: 0.96, g: 0.86, b: 0.6 }, 30);
    for (const sx of [-1, 1]) Lamp(V(x + sx * (ARCH.w / 2 + 38), y, ARCH.h - 70), WARM, 2.2, 560, false);
    SPOT.push([x, y, 340]); }
  for (const [y, sx] of [[-5000, 1], [-4050, -1], [-3700, 1], [-3350, -1]]) { const px = sx * 245 + (y === -4050 ? -60 : 0); post(px, y, sx > 0 ? 180 : 0, 300); }
  // the way in: a heap of stones by the road, the ammo's crate beside it (dest.js)
  for (const [x, y, r] of [[-640, -5700, 150], [-930, -5360, 110], [720, -5780, 130]]) { S(rock(r, Math.round(Math.abs(x)) % 3 + 1, true), x, y, 0, rr(0, 360)); round(x, y, r * 0.92, r * 0.9); SPOT.push([x, y, r + 60]); }

  // ---- the green: the canopy of lantern strings from its tall pole to a ring of eight, bunting between those; the
  // supper laid on four tables under it; the stalls round it, two of them knocked flat, their lanterns in the grass
  { const [gx, gy] = LL.green, H0 = 760, H1 = 440, RR = 900;
    S(festivalPole(H0, 3), gx, gy, 0, 30); round(gx, gy, 14, H0); SPOT.push([gx, gy, 80]);
    const ring = []; for (let i = 0; i < 8; i++) { const a = ((22.5 + i * 45) * Math.PI) / 180; ring.push([gx + Math.cos(a) * RR, gy + Math.sin(a) * RR]); }
    ring.forEach(([px, py], i) => { S(festivalPole(H1, i), px, py, 0, i * 45 + 60); round(px, py, 13, H1); SPOT.push([px, py, 60]);
      const L = Math.hypot(px - gx, py - gy), yaw = (Math.atan2(py - gy, px - gx) * 180) / Math.PI; both(lanternString(L, 80, 6, i, (H1 - 20) - (H0 - 20)), (gx + px) / 2, (gy + py) / 2, ((H0 - 20) + (H1 - 20)) / 2, yaw); });
    for (let i = 0; i < 8; i++) { if (i === 1 || i === 5) continue; const [ax, ay] = ring[i], [bx, by] = ring[(i + 1) % 8], L = Math.hypot(bx - ax, by - ay), yaw = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
      S(bunting(L, 60, i), (ax + bx) / 2, (ay + by) / 2, H1 - 40, yaw); }
    for (const [dx, dy] of [[0, 0], [-480, 0], [480, 0]]) Lamp(V(gx + dx, gy + dy, 520), WARM, 2.2, dx ? 700 : 900, false);
    for (const [dx, dy, sd] of [[-480, -200, 1], [-480, 200, 2], [480, -200, 3], [480, 200, 4]]) table(gx + dx, gy + dy, 90, sd, 0); }
  // the stalls: lanterns for sale, cloth, bread, apples; the two knocked flat
  const stall = (x, y, yaw, goods, sd, lamps) => { S(marketStall(300, sd, goods), x, y, 0, yaw); SOL(x, y, 150, 312, 230, yaw); SPOT.push([x, y, 220]);
    if (lamps) { both(stallLanterns(300, 4, sd), x, y, 0, yaw); const [lx, ly] = at(x, y, yaw, 56, 0); Lamp(V(lx, ly, 180), WARM, 2.2, 480, false); } };
  const wreck = (x, y, yaw, sd) => { S(stallWreck(300, sd), x, y, 0, yaw); const [bx, by] = at(x, y, yaw, 45, 0); body(bx, by, 330, 320, 42, yaw); SPOT.push([x, y, 240]);
    for (const [u, v, k] of [[160, -90, 0], [185, 40, 1], [150, 120, 2]]) { const [fx, fy] = at(x, y, yaw, u, v); S(fallenLantern(sd + k), fx, fy, 0, yaw + 60 * k + 20); } };
  stall(-1320, -2700, 0, 3, 1, true); wreck(-1420, -2220, 0, 2); stall(-1320, -1740, -12, 0, 3, false);
  stall(1320, -2700, 180, 4, 2, true); stall(1400, -2220, 180, 1, 4, true); wreck(1300, -1740, 192, 3);
  stall(-470, -3330, 0, 3, 4, true); stall(470, -3330, 180, 2, 1, false);

  // ---- the boardwalk from the green across the shallows to the island: plank decks, a landing where it turns,
  // lantern posts along it standing in the water
  { const segs = []; for (let k = 0; k < WALK.length - 1; k++) { const [x0, y0] = WALK[k], [x1, y1] = WALK[k + 1], L = Math.hypot(x1 - x0, y1 - y0), yaw = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI, a = k ? 100 : 0, b = k < WALK.length - 2 ? 100 : 0;
      const Ls = L - a - b, ux = (x1 - x0) / L, uy = (y1 - y0) / L, mx = x0 + ux * (a + Ls / 2), my = y0 + uy * (a + Ls / 2); segs.push([mx, my, Ls + 2, yaw]); }
    for (const [mx, my, Ls, yaw] of segs) { S(walkway(Ls, 200), mx, my, 0, yaw); body(mx, my, Ls, 200, 13, yaw, 0, false); }
    for (const k of [1, 2]) { const [x, y] = WALK[k], [x0, y0] = WALK[k - 1], yaw = (Math.atan2(y - y0, x - x0) * 180) / Math.PI; S(landing(200), x, y, 0, yaw); body(x, y, 200, 200, 13, yaw, 0, false); }
    // the posts: every so far along it, either side by turns, their arms out over the deck
    let side = 1; for (let k = 0; k < WALK.length - 1; k++) { const [x0, y0] = WALK[k], [x1, y1] = WALK[k + 1], L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L;
      for (let s = k ? 220 : 330; s < L - 120; s += 440) { const px = x0 + ux * s - uy * 135 * side, py = y0 + uy * s + ux * 135 * side, yaw = (Math.atan2(-ux * side, uy * side) * 180) / Math.PI; post(px, py, yaw, 300); side = -side; } } }
  // the lantern quay where it leaves the green: a flagged floor at the water's edge
  S(flagFloor(260, 5, 0x4a5236, true, [0x8a8a80, 0x7e7e74, 0x969488, 0x74746a]), WALK[0][0], WALK[0][1] - 120, 0.4, 0);

  // ---- the island: the pavilion in its middle, the great lantern in it; the way up from the boardwalk between two
  // posts; a young birch and a few stones on its north side
  { const [ix, iy] = LL.isle; both(pavilion(1), ix, iy, 1.6, 0); round(ix, iy, PAV.r + 70, PAV.floor + 1.6, 0, false);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; round(ix + Math.cos(a) * PAV.r, iy + Math.sin(a) * PAV.r, 13, PAV.e + 20); }
    Lamp(V(ix, iy, PAV.e - 40), WARM, 2.2, 1300, false); Lamp(V(ix, iy, PAV.e + 60), { r: 1, g: 0.72, b: 0.4 }, 2.2, 900, false);
    SPOT.push([ix, iy, PAV.r + 140]);
    K.settRoad([[WALK[3][0], WALK[3][1] - 20], [ix, iy - PAV.r - 66]], 190, 2.2, { kerbW: 0, cols: [0x8a8a80, 0x7e7e74, 0x969488, 0x8a8478] });
    for (const sx of [-1, 1]) post(WALK[3][0] + sx * 150, WALK[3][1] + 60, sx > 0 ? 180 : 0, 280);
    // the tree with two stones against its foot, all one thing to go round
    { const [tx, ty] = isleAt(Math.PI * 0.62, -150); S(tree(480, VC.leaf, 3, 0), tx, ty, 1.6, 40); trunk(tx, ty, 37, 280); SPOT.push([tx, ty, 160]);
      for (const [dx, dy, r, sd] of [[78, -30, 56, 1], [-52, 66, 46, 2]]) { S(rock(r, sd, true), tx + dx, ty + dy, 1.4, rr(0, 360)); round(tx + dx, ty + dy, r * 0.92, r * 0.9); } } }

  // ---- the lantern-makers: their workshop (the cabin nearer the green, its porch to the east) and their house; the
  // drying racks in front of the workshop hung with lanterns, the makers' benches, the withies stacked, the woodpile,
  // a handcart
  const cabin = (x, y, sd) => { const { W, L, eave, ridge, over, porch, porchZ, porchEave } = CB, hw = W / 2, hl = L / 2;
    S(logCabin(sd, 0x5a6a3e, 0x8a9a6a), x, y, 0, 0); SOL(x, y, W + 34, L + 52, eave + 10);
    roofBody(x, y, 90, hl + over, hw + over, eave - over * ((ridge - eave) / hw), ridge);
    SOL(x, y + CB.chimY, 160, 110, ridge + 160);
    body(x + hw + porch / 2 + 4, y, porch, L + 40, porchZ, 0, 0, false);
    for (const yy of [-hl + 10, -hl / 3, hl / 3, hl - 10]) round(x + hw + porch - 16, y + yy, 13, porchEave + 10, 0, false);
    SPOT.push([x + 100, y, 640]); };
  { const [x, y] = LL.workshop; cabin(x, y, 1);
    for (const [dx, dy, sd] of [[800, 420, 1], [1100, 420, 2], [1400, 420, 3]]) { S(dryingRack(sd), x + dx, y + dy, 0, 90); SOL(x + dx, y + dy, 112, 384, 214); SPOT.push([x + dx, y + dy, 230]); }
    for (const [dx, dy] of [[150, -400], [232, -412]]) { S(crate(64, Math.round(dx)), x + CB.W / 2 + dx, y + dy, CB.porchZ, 8); body(x + CB.W / 2 + dx, y + dy, 64, 64, 64, 8, CB.porchZ); }
    post(x + CB.W / 2 + CB.porch + 70, y + 330, 180, 280);
    S(withies(1), x, y + CB.L / 2 + 260, 0, 0); SOL(x, y + CB.L / 2 + 260, 270, 64, 48); SPOT.push([x, y + CB.L / 2 + 260, 160]);
    for (const [dx, dy, sd] of [[1000, -500, 1], [1000, -900, 2]]) table(x + dx, y + dy, 0, sd, 1); }
  { const [x, y] = LL.house; cabin(x, y, 2);
    S(woodpile(220, 4, 3), x - 40, y - CB.L / 2 - 90, 0, 0); SOL(x - 40, y - CB.L / 2 - 90, 232, 72, 112);
    S(cart(1, 2), x + 760, y - 380, 0, -20); SOL(x + 760, y - 380, 240, 140, 150, -20); SPOT.push([x + 760, y - 380, 180]); }

  // ---- the boathouse and the jetty on the shore below the hamlet; rowboats; the lantern boats waiting in crates
  { const a = -2.12, [sx, sy] = lakeAt(a, 0), yaw = (Math.atan2(LL.lake[1] - sy, LL.lake[0] - sx) * 180) / Math.PI;
    const [bx, by] = at(sx, sy, yaw, 0, 0); S(boathouse(1), bx, by, 0, yaw);
    const hw = BH.w / 2, hd = BH.d / 2;
    for (const sd of [-1, 1]) { const [wx, wy] = at(bx, by, yaw, 0, sd * (hd - 6)); body(wx, wy, BH.w, 22, BH.e, yaw); }
    { const [wx, wy] = at(bx, by, yaw, -hw + 6, 0); body(wx, wy, 22, BH.d, BH.e, yaw); }
    for (const sd of [-1, 1]) { const [px, py] = at(bx, by, yaw, hw - 8, sd * (hd - 8)); round(px, py, 12, BH.e); }
    roofBody(bx, by, yaw, hw, hd, BH.e, BH.r);   // over the walls only: a tall creature going by under the eaves isn't caught on them
    { const [rx, ry] = at(bx, by, yaw, 120, hd - 85); S(rowboat(300, 0x7a5a3a, 1), rx, ry, 1.2, yaw); SOL(rx, ry, 300, 110, 60, yaw); }
    SPOT.push([bx, by, 520]);
    const [jx, jy] = at(bx, by, yaw, 160, -(hd + 330)); S(lakeJetty(600, 260), jx, jy, 0, yaw); body(jx, jy, 600, 260, 13, yaw, 0, false);
    for (const sd of [-1, 1]) { const [px, py] = at(jx, jy, yaw, 284, sd * 114); round(px, py, 10, 86); }
    SPOT.push([jx, jy, 380]);
    for (const [u, v, yw, sd] of [[190, -250, 4, 2], [170, -380, -6, 3]]) { const [rx, ry] = at(jx, jy, yaw, u, v); S(rowboat(300, sd > 2 ? 0x6a4e34 : 0x8a6440, sd), rx, ry, 1.2, yaw + yw); SOL(rx, ry, 300, 110, 60, yaw + yw); SPOT.push([rx, ry, 180]); }
    { const [cx, cy] = at(jx, jy, yaw, -330, -220); S(crate(70, 1), cx, cy, 0, yaw + 10); SOL(cx, cy, 70, 70, 70, yaw + 10); const [cx2, cy2] = at(jx, jy, yaw, -250, -230); S(crate(60, 2), cx2, cy2, 0, yaw - 6); SOL(cx2, cy2, 60, 60, 60, yaw - 6); SPOT.push([cx, cy, 120]); }
    post(...at(jx, jy, yaw, -270, 175), yaw - 90, 290); }

  // ---- the old weeping willow on the west shore, a bench under it looking out over the water
  { const [x, y] = LL.willow; S(weepingWillow(900, 1), x, y, 0, 20); trunk(x, y, willowTrunk(900), 400); SPOT.push([x, y, 260]);
    S(logSeat(200), x + 260, y - 160, 0, 10); SOL(x + 260, y - 160, 40, 210, 50, 10); SPOT.push([x + 260, y - 160, 150]); }

  // ---- the festival field: the beacon at its north end, straw bales round it for the crowd, festival poles along its
  // west side with bunting between, lanterns at its way in; the middle left open (the boss comes there)
  { const [x, y] = LL.beacon; S(bonfire(1), x, y, 0, 0); round(x, y, BONF.r + 72, 40); round(x, y, BONF.r + 4, 160, 40); round(x, y, BONF.r * 0.55, 160, 200); round(x, y, BONF.r * 0.25, 140, 360); SPOT.push([x, y, BONF.r + 200]);
    for (let i = 0; i < 7; i++) { const a = (-135 + i * 15) * D2R, r = 640 + (i % 2) * 30, bx = x + Math.cos(a) * r, by = y + Math.sin(a) * r, yw = (a * 180) / Math.PI + 90; S(strawBale(i), bx, by, 0, yw); SOL(bx, by, 94, 50, 46, yw); } }
  { const P = [[3000, -1900], [3150, -1150], [3250, -150], [3250, 650], [3300, 1350]];
    P.forEach(([px, py], i) => { S(festivalPole(420, i + 2), px, py, 0, 90); round(px, py, 13, 420); SPOT.push([px, py, 60]); });
    for (let i = 0; i < P.length - 1; i++) { const [ax, ay] = P[i], [bx, by] = P[i + 1], L = Math.hypot(bx - ax, by - ay); S(bunting(L, 70, i + 1), (ax + bx) / 2, (ay + by) / 2, 380, (Math.atan2(by - ay, bx - ax) * 180) / Math.PI); }
    post(3300, -2350, 90, 300); post(2600, -2050, 0, 300); }

  // ---- the festival-goers' camp: tents round their fire, a handcart, their bench logs
  { const [x, y] = LL.camp; S(campfire(), x, y, 0, 0); round(x, y, 92, 180); Lamp(V(x, y, 60), { r: 1, g: 0.55, b: 0.25 }, 2.2, 700, false); Glow(V(x, y, 36), V(22, 22, 20), 0xff8a3a, 2); SPOT.push([x, y, 300]);
    for (const a of [1.2, 2.9, 4.9]) { const sx = x + Math.cos(a) * 250, sy = y + Math.sin(a) * 250, yw = (a * 180) / Math.PI; S(logSeat(200), sx, sy, 0, yw); SOL(sx, sy, 40, 210, 50, yw); }
    [30, 90, 150, 210, 330].forEach((deg, i) => { const a = deg * D2R, tx = x + Math.cos(a) * 680, ty = y + Math.sin(a) * 680, yw = deg + 180;
      S(tent(i), tx, ty, 0, yw); SOL(tx, ty, TENT.L + 14, TENT.W + 14, 80, yw); SOL(tx, ty, TENT.L + 14, TENT.W * 0.66 + 14, 80, yw, false); body(tx, ty, TENT.L + 14, TENT.W * 0.32 + 14, 92, yw, 160, false);
      for (const sx of [-1, 1]) { const [gx, gy] = at(tx, ty, yw, sx * (TENT.L / 2 + TENT.guy / 2), 0); body(gx, gy, TENT.guy + 6, 14, TENT.h + 20, yw); }
      SPOT.push([tx, ty, 330]); });
    S(cart(2, 1), x - 950, y, 0, 100); SOL(x - 950, y, 240, 140, 150, 100); SPOT.push([x - 950, y, 180]); }

  // ---- the stream: the trail over it on a footbridge
  { const bx = -2170, by = 3730, yaw = 12, L = 520, W = 230; S(footbridge(L, W), bx, by, 0, yaw); body(bx, by, L, W, FB.deck, yaw, 0, false);
    for (const s of [-1, 1]) { const [rx, ry] = at(bx, by, yaw, 0, s * (W / 2 - 4)); body(rx, ry, L - 40, 16, FB.deck + 100, yaw, 0, false); } SPOT.push([bx, by, 320]); }

  // ---- the Blight came down the stream: its heart in the reeds where the stream runs into the lake, masses up the
  // stream and along the north shore, its threads out over the water to the island; the lanterns by it burnt out, a
  // dropped one or two on the trail
  const blightAt = [];
  { const [x, y] = LL.heart; S(blightMass(380, 2, 'mire'), x, y, 0, 30); round(x, y, 380 * 0.62, 380 * 0.55); blightAt.push([x, y, 380]); Lamp(V(x + 40, y - 30, 160), MIRE, 2.2, 1100, false); Glow(V(x, y, 120), V(22, 22, 26), MIRE_GLOW, 2);
    for (const [ex, ey, r, sd] of [[-2650, 4700, 220, 3], [750, 3750, 200, 1], [-3550, 2500, 200, 4]]) { S(blightMass(r, sd, 'mire'), ex, ey, 0, rr(0, 360)); round(ex, ey, r * 0.62, r * 0.55); blightAt.push([ex, ey, r]); Lamp(V(ex, ey, 100), MIRE, 2.2, 600, false); } }
  for (const [x, y, yaw] of [[-1150, 3960, -60], [-2000, 3480, 100], [-3150, 3050, 30]]) post(x, y, yaw, 290, false);
  for (const [x, y, sd] of [[-1300, 3600, 1], [-1700, 3920, 2], [-2850, 3420, 3]]) { S(fallenLantern(sd), x, y, 0, rr(0, 360)); round(x, y, 30, 38); SPOT.push([x, y, 60]); }
  for (const [x, y, yaw] of [[1100, 3500, -90], [2000, 3290, -110], [-3050, 1850, 180]]) post(x, y, yaw, 290);

  // ---- the way on: the old stones where the forest road leaves north; their floor where the stations come up
  { const [x, y] = LL.floor; S(flagFloor(LL.floorR, 8, 0x4a5236, true, [0x8a8a80, 0x7e7e74, 0x969488, 0x74746a]), x, y, 0.4, 0);
    for (const [ox, h, sd] of [[-560, 320, 2], [560, 300, 5]]) { S(standingStone(h, sd), x + ox, y + 760, 0, 90); body(x + ox, y + 760, h * 0.3 * 2 * 0.86, h * 0.17 * 2 * 0.9, h, 90); }
    for (const sx of [-1, 1]) post(x + sx * 980, y - 620, sx > 0 ? 180 : 0, 300); }

  // ---- the paths: the road, the shore paths, the trails
  for (const P of PATHS) path(P, P === ROAD || P === ROAD_N ? 330 : 210, 0x7c6a4c, 0x8a8478);

  // ---- the reeds along the shores in clumps, a clear way between any two (thick in the north where the Blight came up),
  // along the stream's banks, on the island's north shore; lilies out on the water
  { const nav = O.GM, [cx, cy] = [O.cx, O.cy], ok = (x, y) => { const [ix, iy] = nav.cellOf(cx + x, cy + y); return nav.navFree(ix, iy) && K.clear(x, y, 50); };
    const RC = [], clump = (px, py, k, seed) => { RC.push([px, py]); for (let c = 0; c < k; c++) { const x = px + (c ? rr(-48, 48) : 0), y = py + (c ? rr(-48, 48) : 0), h = pick([110, 130, 150, 170]); if (c && (keepOff(x, y, 30) || !ok(x, y))) continue; S(fenReeds(h, seed + c), x, y, 0, rr(0, 360)); round(x, y, 26, h, 0, false); navBand(x, y, 52, 52); } SPOT.push([px, py, 90]); };
    const apart = (x, y, d) => !RC.some(([qx, qy]) => Math.hypot(x - qx, y - qy) < d);
    for (let k = 0; k < 4000 && RC.length < 44; k++) { const a = rr(-Math.PI, Math.PI), [px, py] = lakeAt(a, rr(-150, 40)), north = Math.sin(a) > 0.55 && Math.cos(a) < 0.1;
      if (!north && rnd() > 0.45) continue; if (Math.abs(px) > hx - 200 || keepOff(px, py, 60) || onPath(px, py, 160) || !ok(px, py) || !apart(px, py, north ? 330 : 440)) continue; clump(px, py, north ? 3 : 2, k); }
    for (let k = 0; k < 600 && RC.length < 58; k++) { const u = rr(0.08, 0.95), j = Math.min(STREAM.length - 2, Math.floor(u * (STREAM.length - 1))), f = u * (STREAM.length - 1) - j, [x0, y0] = STREAM[j], [x1, y1] = STREAM[j + 1], L = Math.hypot(x1 - x0, y1 - y0), sd = rnd() < 0.5 ? -1 : 1, off = sd * rr(120, 170);
      const x = x0 + (x1 - x0) * f - ((y1 - y0) / L) * off, y = y0 + (y1 - y0) * f + ((x1 - x0) / L) * off; if (Math.abs(y) > hy - 200 || keepOff(x, y, 40) || onPath(x, y, 150) || !ok(x, y) || !apart(x, y, 340)) continue; clump(x, y, 2, k); }
    for (let k = 0; k < 400 && RC.length < 64; k++) { const a = rr(0.18, 0.82) * Math.PI, [x, y] = isleAt(a, rr(0, 40)); if (keepOff(x, y, 40) || !ok(x, y) || !apart(x, y, 320)) continue; clump(x, y, 1, k); }
    let l = 0; for (let k = 0; k < 2000 && l < 22; k++) { const x = rr(-3200, 2700), y = rr(-900, 3300); if (!inWater(x, y, 160) || keepOff(x, y, 120) || lineDist(x, y, WALK) < 260) continue; S(lilies(pick([90, 120]), pick([1, 2, 3])), x, y, 1.1, rr(0, 360)); SPOT.push([x, y, 100]); l++; } }

  // ---- the lantern boats out on the water: lit, drifting round the island and off the boardwalk
  { let n = 0; for (let k = 0; k < 600 && n < 20; k++) { const a = rr(0, Math.PI * 2), d = rr(LL.isleR + 160, LL.isleR + 1500), x = LL.isle[0] + Math.cos(a) * d, y = LL.isle[1] + Math.sin(a) * d * 0.75;
      if (!inWater(x, y, 150) || keepOff(x, y, 110) || lineDist(x, y, WALK) < 240) continue; both(lanternBoat(n), x, y, 1.05, rr(0, 360)); round(x, y, 36, 36); SPOT.push([x, y, 80]); if (n % 3 === 0) Lamp(V(x, y, 40), WARM, 2.2, 300, false); n++; } }

  // ---- the forest round the clearing: oaks, alders near the water, birches; thick at the edges and in woods to the
  // south-west, south-east and north-west
  const trees = [];
  const treeOK = (x, y, m) => !inLake(x, y, 260 + m) && lineDist(x, y, STREAM) > 300 + m && !onPath(x, y, 230 + m) && !keepOff(x, y, 120 + m)
    && Math.hypot(x - LL.green[0], y - LL.green[1]) > 1650 + m && !(x > 2500 - m && x < 5000 + m && y > -2400 - m && y < 2400 + m) && Math.hypot(x - LL.camp[0], y - LL.camp[1]) > 1150 + m
    && Math.hypot(x - LL.floor[0], y - LL.floor[1]) > LL.floorR + 250 + m && Math.hypot(x - LL.spawn[0], y - LL.spawn[1]) > 750 + m && Math.abs(x) < hx - 120 && Math.abs(y) < hy - 120;
  for (let gx = -hx + 260; gx < hx - 200; gx += 560) for (let gy = -hy + 260; gy < hy - 200; gy += 560) {
    const x = gx + rr(-170, 170), y = gy + rr(-170, 170), edge = Math.min(hx - Math.abs(x), hy - Math.abs(y)) < 900, wood = (x < -1200 && y < -4000) || (x > 1200 && y < -2900) || (x < -3000 && y > 2600) || (x > 4600 && y > 2400);
    if (!edge && !wood && rnd() > 0.1) continue; if (edge && rnd() > 0.6) continue; if (wood && !edge && rnd() > 0.45) continue; if (!treeOK(x, y, 60)) continue;
    const near = inLake(x, y, 900), h = pick([1000, 1200, 1400]), sd = Math.abs(Math.round(x * 7 + y)) % 6;
    if (near && sd % 2) trees.push({ x, y, half: alderTrunk(h), circle: true, place: () => { S(alder(h, sd), x, y, 0, rr(0, 360)); trunk(x, y, alderTrunk(h), h * 0.45); } });
    else if (sd === 4) trees.push({ x, y, half: 26, circle: true, place: () => { S(tree(h * 0.6, VC.leaf, sd, 1), x, y, 0, rr(0, 360)); trunk(x, y, 26, h * 0.35); } });
    else trees.push({ x, y, half: oakTrunk(h), circle: true, place: () => { S(oak(h, sd), x, y, 0, rr(0, 360)); trunk(x, y, oakTrunk(h), h * 0.5); } }); }
  for (const p of K.plan(trees, LL.spawn)) p.place();

  // ---- the Mirecap's threads out of the heart: up the stream, along the north shore both ways, over the water to the
  // island, up the path to the stones; its toadstools along them
  { const [hx0, hy0] = LL.heart, veins = [];
    for (const [ex, ey] of [[-2650, 4700], [750, 3750], [-3550, 2500], [60, 2150], [-200, 4350], [-1100, 2500], [-2300, 3000]]) { const pts = []; for (let i = 0; i <= 7; i++) { const t = i / 7; pts.push([hx0 + (ex - hx0) * t + Math.sin(t * 7 + ex) * 110 * t, hy0 + (ey - hy0) * t + Math.cos(t * 5 + ey) * 110 * t]); } veins.push(pts); }
    M.Shape('lkveins', () => { const pos = [], col = [], idx = []; for (const pts of veins) { const n = pts.length; for (let j = 0; j < n - 1; j++) { const [x0, y0] = pts[j], [x1, y1] = pts[j + 1], L = Math.hypot(x1 - x0, y1 - y0), m = Math.max(2, Math.round(L / 40)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
      for (let i = 0; i <= m; i++) { const t = i / m, wv = Math.sin((x0 + i * 40) * 0.011 + j) * 40 + Math.sin((y0 + i * 40) * 0.023) * 16, px = x0 + (x1 - x0) * t + nx * wv, py = y0 + (y1 - y0) * t + ny * wv, w = 9 * (1 - ((j + t) / n) * 0.7); for (const e of [-1, 1]) { pos.push(px + nx * w * e, py + ny * w * e, 2.9); col.push(0.5, 0.8, 0.7); } }
      const b = pos.length / 3 - (m + 1) * 2; for (let i = 0; i < m; i++) { const a = b + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } } } return { pos, col, idx }; }, V(0, 0, 0), R(0, 0, 0));
    for (const pts of veins) for (let j = 2; j < pts.length; j += 2) { const [vx, vy] = pts[j]; if (blightAt.some(([bx, by, br]) => Math.hypot(vx - bx, vy - by) < br + 120) || onPath(vx, vy, 220) || inLake(vx, vy, 80) || lineDist(vx, vy, STREAM) < 260 || keepOff(vx, vy, 80) || !K.clear(vx, vy, 200)) continue;
      const ts = pick([0.8, 1, 1.2]); S(toadstoolCluster(ts, 0x3e6c4c, pick([1, 2, 3])), vx, vy, 0, rr(0, 360)); round(vx, vy, 22 * ts, 40 * ts); } }

  // ---- tufts of long grass, never on a path, a floor or in the water
  { const nav = O.GM, [cx, cy] = [O.cx, O.cy], ok = (x, y) => { const [ix, iy] = nav.cellOf(cx + x, cy + y); return nav.navFree(ix, iy) && K.clear(x, y, 40); };
    let n = 0; for (let k = 0; k < 3000 && n < 260; k++) { const x = rr(-hx + 150, hx - 150), y = rr(-hy + 150, hy - 150); if (!ok(x, y) || onPath(x, y, 200) || inLake(x, y, 120) || lineDist(x, y, STREAM) < 240 || Math.hypot(x - LL.floor[0], y - LL.floor[1]) < LL.floorR + 60 || keepOff(x, y, 30) || Math.hypot(x - LL.green[0], y - LL.green[1]) < 1200) continue;
      S(grassTuft(pick([28, 32, 36]), pick([1, 2, 3, 4])), x, y, 0, rr(0, 360)); n++; } }

  // ---- beyond the edge (out of reach): the Wildwood going on, dark; low hills; the road on both ways
  for (let i = 0; i < 140; i++) { const side = i % 4, u = rr(-1, 1), d = rr(300, 3600), x = side < 2 ? (side ? 1 : -1) * (hx + d) : u * (hx + 3000), y = side < 2 ? u * (hy + 3000) : (side === 2 ? 1 : -1) * (hy + d); if (Math.abs(x) < 400 && Math.abs(y) > hy) continue;
    S(farTree(pick([1200, 1400, 1800]), 0, pick([0x2a4822, 0x30502a, 0x264020]), pick([1, 2])), x, y, 0, rr(0, 360)); }
  path([[0, -6100], [0, -9000], [-200, -12000]], 330, 0x7c6a4c); path([[0, 6100], [80, 8600], [-160, 11000]], 330, 0x7c6a4c);
  for (const [x, y, rx, ry, h] of [[-13000, 0, 5000, 9000, 1800], [13500, 1500, 5500, 9000, 2000], [0, 14500, 9000, 4000, 2200], [-9000, -14000, 6000, 4000, 1600], [9000, -13500, 6000, 4000, 1800]]) S(hill(rx, ry, h, 0x3a5230), x, y, -40, 0);

  // where the Mirecap's beds come up: on the green, on the field, by the camp, by the hamlet, on the west shore, by the
  // north path
  const settle = ([x, y]) => { for (let r = 0; r <= 1600; r += 100) { const n = Math.max(1, Math.round(r / 50)); for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (Math.abs(px) < hx - 500 && Math.abs(py) < hy - 500 && K.clear(px, py, 430) && !inLake(px, py, 300) && Math.hypot(px - LL.floor[0], py - LL.floor[1]) > LL.floorR + 400) return [Math.round(px), Math.round(py)]; } } return [x, y]; };
  const beds = [[0, -1700], [3900, -1400], [3500, 2600], [-2600, -3600], [-3900, 600], [-600, 4300]].map(settle);
  return {
    spots: { spawn: LL.spawn, yaw: Math.PI, exit: [0, 5450], textYaw: -90, ammo: [650, -5300], ammoYaw: 90,
      bench: [-660, 5130], benchYaw: 0, box: [660, 4900], chest: [660, 4900], chestYaw: 180, press: [-660, 4630], pressYaw: 0 },
    keep: [[LL.floor[0], LL.floor[1], 900]],
    beds, bossAt: LL.field,
  };
}

// ---- the air at Lantern Lake: fireflies over the grass and the shallows, a mist on the water, the Mirecap's wisps
// drifting off its heart
export function lakeAir(g, dt, A) {
  const c = g.camera.position, [cx, cy] = A.c; if (Math.abs(c.x - cx) > A.hx + 600 || Math.abs(c.z - cy) > A.hy + 600) return;
  const st = (lakeAir.st ||= { f: 0, m: 0, w: 0 });
  st.f += dt * 9; while (st.f > 1) { st.f -= 1; const a = Math.random() * 6.28, r = 200 + Math.random() * 1600;
    g.fx.add({ pos: new THREE.Vector3(c.x + Math.cos(a) * r, 30 + Math.random() * 150, c.z + Math.sin(a) * r), vel: new THREE.Vector3((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 30), drag: 0.2, life: 4 + Math.random() * 3, size0: 4, size1: 3, c0: [1, 0.92, 0.45, 1], c1: [0.9, 1, 0.5, 0], fadeIn: 0.8, fadeOut: 1.6, tex: 'FX_Disc', kind: 'fx', glow: 1 }); }
  st.m += dt * 3; while (st.m > 1) { st.m -= 1; const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * 0.85, x = LL.lake[0] + Math.cos(a) * LL.lakeR[0] * r, y = LL.lake[1] + Math.sin(a) * LL.lakeR[1] * r;
    if (Math.hypot(c.x - cx - x, c.z - cy - y) > 4000) continue;
    g.fx.add({ pos: new THREE.Vector3(cx + x, 14 + Math.random() * 30, cy + y), vel: new THREE.Vector3(10 + Math.random() * 8, 1, (Math.random() - 0.5) * 6), life: 8, size0: 110, size1: 190, c0: [0.86, 0.84, 0.94, 0.1], c1: [0.86, 0.84, 0.94, 0], fadeIn: 2.5, fadeOut: 3, tex: 'FX_Disc', kind: 'fx', glow: 0 }); }
  const hx0 = cx + LL.heart[0], hz0 = cy + LL.heart[1]; if (Math.hypot(c.x - hx0, c.z - hz0) < 3500) { st.w += dt * 3; while (st.w > 1) { st.w -= 1; const a = Math.random() * 6.28, r = 200 + Math.random() * 700;
    g.fx.add({ pos: new THREE.Vector3(hx0 + Math.cos(a) * r, 40 + Math.random() * 120, hz0 + Math.sin(a) * r), vel: new THREE.Vector3((Math.random() - 0.5) * 50, (Math.random() - 0.3) * 18, (Math.random() - 0.5) * 50), drag: 0.1, life: 6, size0: 14, size1: 10, c0: [0.5, 1, 0.85, 1], c1: [0.4, 1, 0.8, 0], fadeIn: 1.2, fadeOut: 2, tex: 'FX_Disc', kind: 'fx', glow: 1 }); } }
}
