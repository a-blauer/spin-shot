// Ranger's Ridge, in the Wildwood: the long bare crest above the forest, where the Wildwood's rangers keep watch over
// the valleys either side. The trail comes up onto it from the south past the rangers' sign and runs its length between
// cairns. Their station is on the west side: the round watch tower, the hut with its turf roof, the hounds' kennels, the
// alarm bell, the archery butts, the woodshed and the woodpile. East, at the cliff's edge, the hoist that brings their
// stores up from the valley road. In the saddle, the mire where the spring rises under their well-house; the trail
// crosses it on a boardwalk. The Blight (Mirecap) came up in the mire: its heart is there, its threads out over the
// crest. West of the mire, the warning beacon on its pillar, burning (the rangers lit it when the Blight came, and ran);
// east, the viewpoint at the cliff's edge with its toposcope and telescope. North of the saddle, the old ring: a fort of
// the old folk, its drystone wall fallen in places, standing stones inside it (the boss comes there). The way on: north,
// where the trail leaves along the crest between two old stones. Either side, the ridge falls away in cliffs to the
// forest in the valleys 1800 below.
//
// Local frame (dest.js): +Y north, +X east, z up; the crest is flat at z = 0. Playable: x in [-4400, 4400], y in
// [-6000, 6000]. The crest ends in cliffs just past the playable edge east and west; only the place you are in is drawn,
// so its valleys can lie where its neighbours are.
import * as THREE from 'three';
import { V, R } from './mapkit.js';
import { destKit } from './dest_kit.js';
import { blightMass } from './dest_props.js';
import { flagFloor, standingStone, logSeat, campfire, woodshed, stump, sawTrestle, rainBarrel, logPile, waymarker } from './dest_props_wood.js';
import { deadPine, pineTrunk } from './dest_props_rot.js';
import { walkway, landing } from './dest_props_lake.js';
import { toadstoolCluster, rock, hill } from './village_shapes.js';
import { archeryButt, crate, cart, sack } from './village_props.js';
import { watchTower, WTW, rangerHut, RH, kennels, KN, alarmBell, hoist, HS, beacon, BC, toposcope, telescope, weatherPost, tor, torParts, windPine, pineR, cairn, heather, cottonGrass, peatHag, bogPool, springHead, cliffFace, ropeFence, ringWall, ringRuns, RW, trailSign, TS, valleyTree, hearthStones } from './dest_props_ridge.js';

export const RR = {
  spawn: [0, -5300], floor: [0, 4900], floorR: 820, ring: [0, 2350], ringR: 1250,
  mire: [650, -250], mireR: [1450, 860], heart: [1250, -60], spring: [-560, 260],
  hut: [-2150, -3150], tower: [-3300, -2350], kennels: [-3150, -3900], butts: [-3720, -4800],
  hoist: [4270, -1750], beacon: [-4020, -300], view: [4070, 950],
};
const RING_GAPS = [[-90, 640], [-10, 520], [90, 640], [155, 500], [215, 520]];
// the mire's edge (a: the angle round it; m: how far out past it), and whether a spot is in it
const mireK = (a) => 1 + 0.1 * Math.sin(3 * a + 1) + 0.06 * Math.sin(5 * a + 2);
const inMire = (x, y, m = 0) => { const dx = x - RR.mire[0], dy = y - RR.mire[1], a = Math.atan2(dy / RR.mireR[1], dx / RR.mireR[0]), k = mireK(a); return Math.hypot(dx / (RR.mireR[0] * k + m), dy / (RR.mireR[1] * k + m)) < 1; };
// the trail: up from the south to the mire, over it on the boardwalk, through the old ring, on to the north
const TRAIL_S = [[0, -6100], [40, -5300], [-120, -4500], [-300, -3700], [-240, -2900], [20, -2150], [170, -1500], [200, -1300]];
const WALK = [[200, -1250], [330, -650], [300, -50], [160, 560]];
const TRAIL_N = [[160, 560], [60, 900], [0, 1100], [-60, 1800], [40, 2700], [0, 3600], [0, 4100]];
const TRAIL_X = [[0, 5700], [0, 6100]];
// the side paths: to the station, from the hut to the tower, to the hoist, to the beacon, to the viewpoint, to the spring
const STATION = [[-290, -3300], [-900, -3230], [-1500, -3170], [-1780, -3150]];
const TOWERWAY = [[-1790, -2960], [-2200, -2560], [-2700, -2380], [-3030, -2350]];
const HOISTWAY = [[110, -1760], [1200, -1830], [2500, -1700], [3500, -1760], [4050, -1750]];
const BEACONWAY = [[50, -2050], [-900, -1550], [-2000, -950], [-3200, -470], [-3830, -330]];
const VIEWWAY = [[230, 680], [1300, 900], [2600, 1000], [3780, 960]];
const SPRINGWAY = [[150, 600], [-150, 470], [-430, 360]];
const PATHS = [TRAIL_S, TRAIL_N, TRAIL_X, STATION, TOWERWAY, HOISTWAY, BEACONWAY, VIEWWAY, SPRINGWAY];
// the valleys: their floor, the river and the road in the east one, the long lake in the west one
const VZ = -3000;
const riverX = (y) => 4400 + 4200 + 900 * Math.sin(y / 2600 + 1) + 300 * Math.sin(y / 900);
const roadX = (y) => 4400 + 1000 + 160 * Math.sin(y / 1700 + 0.5);
const VL = [-4400 - 5200, 2400], VLR = [1900, 5000], vlK = (a) => 1 + 0.08 * Math.sin(3 * a + 2) + 0.05 * Math.sin(5 * a);
const inVL = (x, y, m = 0) => { const dx = x - VL[0], dy = y - VL[1], a = Math.atan2(dy / VLR[1], dx / VLR[0]), k = vlK(a); return Math.hypot(dx / (VLR[0] * k + m), dy / (VLR[1] * k + m)) < 1; };

export function buildRidge(M, O) {
  const { hx, hy } = O;
  const K = destKit(M, 61, O, { exactNav: true }), { S, body, round, trunk, patch, path, band, rnd, rr, lineDist, Box, Cyl, Lamp, Glow } = K;
  const pick = (L) => L[Math.floor(rnd() * L.length)];
  const SOL = (x, y, w, d, h, yaw = 0, nav = true) => body(x, y, w, d, h, yaw, 0, nav);
  const D2R = Math.PI / 180, MIRE = { r: 0.45, g: 1, b: 0.82 }, MIRE_GLOW = 0x6effd2, FIRE = { r: 1, g: 0.6, b: 0.28 };
  const at = (x, y, yaw, u, v) => [x + u * Math.cos(yaw * D2R) - v * Math.sin(yaw * D2R), y + u * Math.sin(yaw * D2R) + v * Math.cos(yaw * D2R)];
  const roofBody = (x, y, yaw, hl, hw, ze, zr) => { for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const v0 = hw * (1 - i / 4), v1 = hw * (1 - (i + 1) / 4), z0 = ze + (zr - ze) * (i / 4), z1 = ze + (zr - ze) * ((i + 1) / 4), [px, py] = at(x, y, yaw, 0, sd * (v0 + v1) / 2); body(px, py, hl * 2, v0 - v1, z1 - z0 + 14, yaw, z0 - 6); } };
  const both = (P, x, y, z, yaw) => { S(P.main, x, y, z, yaw); M.Shape(P.glow[0], P.glow[1], V(x, y, z), R(0, yaw, 0), 0xffffff, 1, true); };
  // a slanted pole (a derrick's leg, a stay) where it is low enough to walk into: boxes stepping up under it to its line
  const legBody = (x0, y0, z0, x1, y1, z1, r) => { const L = Math.hypot(x1 - x0, y1 - y0), yaw = Math.atan2(y1 - y0, x1 - x0) / D2R, tEnd = Math.min(1, (170 - z0) / (z1 - z0)), n = Math.max(1, Math.ceil(Math.max(L * tEnd, (z1 - z0) * tEnd) / 30));
    for (let i = 0; i < n; i++) { const t0 = (tEnd * i) / n, t1 = (tEnd * (i + 1)) / n, tm = (t0 + t1) / 2; body(x0 + (x1 - x0) * tm, y0 + (y1 - y0) * tm, Math.max(r * 2, L * (t1 - t0)) + 2, r * 2 + 2, z0 + (z1 - z0) * t1 + r, yaw); } };
  const SPOT = [];   // things the trees and the scatter keep off: [x, y, r]
  const keepOff = (x, y, m = 0) => SPOT.some(([sx, sy, r]) => Math.hypot(x - sx, y - sy) < r + m);
  const onPath = (x, y, m = 0) => PATHS.some((P) => lineDist(x, y, P) < m) || lineDist(x, y, WALK) < 90 + m;
  const inRing = (x, y, m = 0) => Math.hypot(x - RR.ring[0], y - RR.ring[1]) < RR.ringR + RW.w / 2 + m;

  // ---- the crest: moor grass, browner and purpler in patches; the mire's moss in the saddle; the slab of it stops at the
  // cliffs, and runs on north and south (out of reach) to the hills the ridge climbs to
  Box(V(0, 0, -60), V((hx + 80) * 2, (hy + 800) * 2, 120), 0x6e7e48, true, false);
  for (const s of [-1, 1]) Box(V(0, s * (hy + 800 + 4100), -60), V((hx + 80) * 2, 8200, 120), 0x6e7e48, false, false);
  for (let i = 0; i < 40; i++) { const x = rr(-hx + 300, hx - 300), y = rr(-hy + 300, hy - 300), d = rr(700, 1600); if (inMire(x, y, d / 2)) continue; patch(x, y, d, pick([0x6a7a46, 0x72804a, 0x687648, 0x707a4a, 0x6c7448])); }
  patch(RR.ring[0], RR.ring[1], 2200, 0x748250); patch(RR.floor[0], RR.floor[1], 2000, 0x6e7a4a);
  M.Shape('rgmire', () => { const pos = [], col = [], idx = [], C = new THREE.Color(), n = 96;
    const ring = (f, m, z, cf) => { const b = pos.length / 3; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, k = mireK(a); pos.push(RR.mire[0] + Math.cos(a) * (RR.mireR[0] * k * f + m), RR.mire[1] + Math.sin(a) * (RR.mireR[1] * k * f + m), z); C.setHex(cf(i), THREE.NoColorSpace); col.push(C.r, C.g, C.b); } return b; };
    const RGs = [ring(1, 170, 0.22, (i) => (i % 2 ? 0x6e7a46 : 0x707c48)), ring(1, 0, 0.24, (i) => [0x7a7a40, 0x847240, 0x6e7438][i % 3]), ring(0.62, 0, 0.26, (i) => [0x6a7038, 0x7a6a38][i % 2]), ring(0.28, 0, 0.27, () => 0x646a36)];
    const c0 = pos.length / 3; C.setHex(0x5e6634, THREE.NoColorSpace); pos.push(RR.mire[0], RR.mire[1], 0.27); col.push(C.r, C.g, C.b);
    for (let r = 0; r < RGs.length - 1; r++) { const a = RGs[r], b = RGs[r + 1]; for (let i = 0; i < n; i++) { const j = (i + 1) % n; idx.push(a + i, a + j, b + i, a + j, b + j, b + i); } }
    const L0 = RGs[RGs.length - 1]; for (let i = 0; i < n; i++) idx.push(L0 + i, L0 + ((i + 1) % n), c0);
    return { pos, col, idx }; }, V(0, 0, 0), R(0, 0, 0));
  // the cliffs east and west, from the crest's lip down to the valleys
  S(cliffFace(33000, 3000, 1), hx + 80, 0, 0, 90); S(cliffFace(33000, 3000, 2), -hx - 80, 0, 0, -90);
  // stones along the lip, here and there
  for (const sx of [-1, 1]) for (let y = -hy + 200; y < hy; y += rr(380, 760)) { if (rnd() < 0.35) continue; const x = sx * (hx + rr(20, 50)), r = pick([24, 28]); S(rock(r, Math.round(y) & 7, true), x, y, 0, rr(0, 360)); round(x, y, r * 0.95, r); }

  // ---- the way in: the trail up from the south, the rangers' sign by it
  { const x = -380, y = -4700; S(trailSign(), x, y, 0, 0); body(x, y, TS.w + 26, 14, 232); M.Sign(V(x, y - 4, TS.z), -90, "RANGER'S RIDGE", { r: 0.95, g: 0.9, b: 0.74 }, 22); SPOT.push([x, y, 200]); }
  for (const [x, y, r] of [[-700, -5650, 120], [-960, -5380, 90], [760, -5760, 110]]) { S(rock(r, Math.round(Math.abs(x)) % 3 + 1, true), x, y, 0, rr(0, 360)); round(x, y, r * 0.92, r * 0.9); SPOT.push([x, y, r + 60]); }

  // ---- the rangers' station. The hut, its door to the trail (east): the porch, the bench by the door; the woodshed
  // against its back
  { const [x, y] = RR.hut, yaw = 90, { w, d, e, r } = RH, hw = w / 2, hd = d / 2;
    S(rangerHut(1), x, y, 0, yaw);
    { const [bx, by] = at(x, y, yaw, 0, -5); body(bx, by, w, d + 10, e + 10, yaw); }
    roofBody(x, y, yaw, hw + 50, hd + 60, e - 14, r + 22);
    { const [cx2, cy2] = at(x, y, yaw, -hw - 30, 0); body(cx2, cy2, 96, 124, r + 156, yaw); }
    for (const sx of [-1, 1]) { const [px, py] = at(x, y, yaw, sx * 80, -hd - 100); round(px, py, 6, 222); }
    { const [px, py] = at(x, y, yaw, 0, -hd - 50); body(px, py, 190, 130, 22, yaw, 220); }
    { const [bx, by] = at(x, y, yaw, -140, -hd - 34); body(bx, by, 144, 40, 46, yaw); }
    { const [bx, by] = at(x, y, yaw, hw - 30, -hd - 40); S(rainBarrel(1), bx, by, 0, 0); round(bx, by, 36, 100); }
    SPOT.push([x, y, 640]);
    // the woodshed at its back, its cordwood facing west; the chopping block and the axe before it, the log pile
    { const [wx, wy] = at(x, y, yaw, 0, hd + 140); S(woodshed(400), wx, wy, 0, 180); SOL(wx, wy, 250, 420, 290); SPOT.push([wx, wy, 300]);
      S(stump(44, 46, 2, true), wx - 60, wy + 350, 0, 30); round(wx - 60, wy + 350, 50, 50); SPOT.push([wx - 60, wy + 350, 90]);
      S(logPile(4, 360, 30, 2), wx - 380, wy - 120, 0, 0); SOL(wx - 380, wy - 120, 268, 400, 218); SPOT.push([wx - 380, wy - 120, 260]); } }
  // the watch tower, its door to the east
  { const [x, y] = RR.tower; S(watchTower(1), x, y, 0, 90); round(x, y, WTW.r + 3, WTW.e + 16); round(x, y, WTW.r + 74, 200, WTW.gal - 104, false);
    round(x, y, WTW.r + 96, 150, WTW.e + 14, false); round(x, y, (WTW.r + 96) * 0.55, 170, WTW.e + 164, false); SPOT.push([x, y, WTW.r + 160]);
    S(sawTrestle(), x + 420, y - 420, 0, 0); SOL(x + 420, y - 420, 120, 372, 98); body(x + 420, y - 420, 86, 532, 74, 0, 96); SPOT.push([x + 420, y - 420, 320]); }
  // the kennels, the run before them to the east; the alarm bell by the hut; the weather post; the rangers' fire
  { const [x, y] = RR.kennels, yaw = 90, { n, w, d, e, run } = KN, L = n * w, hl = L / 2, hd = d / 2, ry = -hd - run;
    S(kennels(), x, y, 0, yaw);
    body(x, y, L + 14, d + 14, e + 10, yaw); body(x, y, L + 44, 2 * (hd + 30) + 4, 80, yaw, e + 4);
    for (const sx of [-1, 1]) { const [fx, fy] = at(x, y, yaw, sx * hl, (-hd + ry) / 2); body(fx, fy, 10, run + 8, 100, yaw); }
    for (const sx of [-1, 1]) { const [fx, fy] = at(x, y, yaw, (sx * (hl + 60)) / 2, ry); body(fx, fy, hl - 60 + 8, 10, 100, yaw); }
    { const ga = yaw - 70, [gx, gy] = at(x, y, yaw, 62, ry), [mx, my] = at(gx, gy, ga, 58, 0); body(mx, my, 116, 10, 100, ga); }
    { const [tx, ty] = at(x, y, yaw, hl - 60, ry + 60); body(tx, ty, 90, 34, 34, yaw); }
    SPOT.push([x, y, 400]); const [rx2, ry2] = at(x, y, yaw, 0, (ry - hd) / 2); SPOT.push([rx2, ry2, 380]); }
  { const x = -1720, y = -2800; S(alarmBell(), x, y, 0, 0); for (const sy of [-1, 1]) round(x, y + sy * 70, 10, 292); body(x, y, 24, 176, 20, 0, 272); round(x, y, 27, 58, 216, false); SPOT.push([x, y, 150]); }
  { const x = -2350, y = -2650; S(weatherPost(), x, y, 0, 0); round(x, y, 16, 332); round(x + 60, y, 11, 100); SPOT.push([x + 30, y, 110]); }
  { const fx = -1250, fy = -3780; S(campfire(), fx, fy, 0, 0); round(fx, fy, 92, 180); SPOT.push([fx, fy, 330]);
    for (const a of [0.5, 2.3, 4.2]) { const sx = fx + Math.cos(a) * 240, sy = fy + Math.sin(a) * 240, yw = (a * 180) / Math.PI + 90; S(logSeat(200), sx, sy, 0, yw + 90); SOL(sx, sy, 40, 210, 50, yw + 90); } }
  S(cart(1, 2), -1450, -2450, 0, 200); SOL(-1450, -2450, 240, 140, 150, 200); SPOT.push([-1450, -2450, 200]);
  // the archery butts, west of the station, the shooting mark east of them
  for (const dy of [-300, 0, 300]) { const x = RR.butts[0], y = RR.butts[1] + dy; S(archeryButt(), x, y, 0, 0); body(x, y, 36, 152, 180); legBody(x - 70, y, 0, x - 10, y, 140, 6); SPOT.push([x - 20, y, 150]); }
  { const x = RR.butts[0] + 900, y = RR.butts[1]; S(logSeat(700), x, y, 0, 0); SOL(x, y, 40, 710, 50); SPOT.push([x, y - 250, 120], [x, y, 120], [x, y + 250, 120]); }
  // the waymarkers where the side paths leave the trail
  for (const [x, y, yaw] of [[-470, -3420, 180], [230, -1900, 0], [-180, -2180, 180], [330, 830, 0]]) { S(waymarker(), x, y, 0, yaw); round(x, y, 26, 170); SPOT.push([x, y, 70]); }

  // ---- the hoist at the east cliff's edge: its platform out to the lip, the derrick's jib out over the drop; the stores
  // brought up waiting by it; a rope fence along the lip either side
  { const [x, y] = RR.hoist, { w, d } = HS, hw = w / 2, hd = d / 2; S(hoist(), x, y, 0, 0);
    body(x, y, w, d, 11, 0, 0, false);
    for (const sy of [-1, 1]) legBody(x - hw + 60, y + sy * (hd - 30), 10, x + hw + 20, y + sy * 30, 614, 9);
    legBody(x - hw - 40, y, 4, x - hw + 40, y, 120, 6); legBody(x - hw + 40, y, 120, x + hw + 20, y, 624, 6);
    body(x - hw + 120, y - 12, 96, 178, 164);
    body(x - hw + 44, y + hd - 59, 68, 68, 120); body(x - hw + 104, y + hd - 56, 56, 56, 64);
    SPOT.push([x - 60, y, 330]);
    for (const [dx, dy, w2, yw] of [[-470, 230, 70, 8], [-390, 270, 60, -6], [-480, 310, 64, 14]]) { S(crate(w2, Math.round(dx + dy)), x + dx, y + dy, 0, yw); SOL(x + dx, y + dy, w2 + 2, w2 + 2, w2 * 0.85 + 2, yw); }
    for (let i = 0; i < 5; i++) { const sx = x - 470 + (i % 3) * 56, sy = y - 260 - Math.floor(i / 3) * 62; S(sack(26, 0xc8b48a), sx, sy, -3, rr(0, 360)); round(sx, sy, 29, 66); }
    SPOT.push([x - 440, y + 270, 160], [x - 420, y - 290, 160]);
    S(cart(1, 3), x - 720, y - 220, 0, 15); SOL(x - 720, y - 220, 240, 140, 150, 15); SPOT.push([x - 720, y - 220, 200]);
    for (const [fy, len] of [[-2250, 500], [-1250, 500]]) { S(ropeFence(len), hx - 10, fy, 0, 90); body(hx - 10, fy, 12, len, 100); } }

  // ---- the warning beacon at the west edge, burning; the ladder they lit it from thrown down in the heather; the
  // brushwood stacked to keep it going
  { const [x, y] = RR.beacon, { r, h } = BC, bz = h + 22; both(beacon(), x, y, 0, 0);
    round(x, y, r + 70, 26); round(x, y, r + 30, 50); round(x, y, r + 3, h + 22); round(x, y, 84, 110, bz + 26, false);
    Lamp(V(x, y, bz + 100), FIRE, 2.2, 1500, false); Lamp(V(x, y, bz + 170), { r: 1, g: 0.78, b: 0.45 }, 2.2, 900, false);
    SPOT.push([x, y, r + 220], [x + r + 240, y + 20, 220]);
    S(logPile(3, 300, 22, 5), x + 300, y - 460, 0, 0); SOL(x + 300, y - 460, 159, 340, 140); SPOT.push([x + 300, y - 460, 230]); }

  // ---- the viewpoint at the east edge: the toposcope on its flags, the telescope, a bench to sit and look, the rope
  // fence along the lip
  { const [x, y] = RR.view; S(flagFloor(330, 3, 0x4a5236, true, [0x9a968c, 0x8e8a80, 0xa6a296, 0x86827a]), x, y, 0.4, 0);
    S(toposcope(), x, y, 0, 0); round(x, y, 70, 14); round(x, y, 58, 116);
    S(telescope(), x + 170, y + 220, 0, -40); round(x + 170, y + 220, 48, 150);
    S(logSeat(200), x - 240, y - 250, 0, 0); SOL(x - 240, y - 250, 40, 210, 50);
    S(ropeFence(1200), hx - 10, y, 0, 90); body(hx - 10, y, 12, 1200, 100);
    SPOT.push([x, y, 420]); }

  // ---- the old ring: its wall round, fallen where the ways in are; standing stones inside it by the wall; the old
  // hearth at its middle
  { const [cx, cy] = RR.ring, r = RR.ringR, { w, h, ch, step, cap } = RW, dA = step / r, nC = Math.round(h / ch);
    S(ringWall(r, RING_GAPS, 1), cx, cy, 0, 0);
    const seg = (b0, b1, hh) => { const n = Math.max(1, Math.ceil(((b1 - b0) * r) / 120)); for (let i = 0; i < n; i++) { const s0 = b0 + ((b1 - b0) * i) / n, s1 = b0 + ((b1 - b0) * (i + 1)) / n, m = (s0 + s1) / 2; body(cx + Math.cos(m) * r, cy + Math.sin(m) * r, 2 * r * Math.sin((s1 - s0) / 2) + 2, w + 4, hh, m / D2R + 90); } };
    for (const [a0, a1] of ringRuns(r, RING_GAPS)) for (let k = 0; k < nC; k++) { const hh = (k + 1) * ch + (k === nC - 1 ? cap * 0.5 : 0); if (k < nC - 1) { seg(a0 + k * dA, a0 + (k + 1) * dA, hh); seg(a1 - (k + 1) * dA, a1 - k * dA, hh); } else seg(a0 + k * dA, a1 - k * dA, hh); }
    for (const [adeg, hs, sd] of [[25, 300, 1], [62, 250, 2], [125, 330, 3], [185, 280, 4], [250, 260, 0], [305, 310, 2]]) { const a = adeg * D2R, sx = cx + Math.cos(a) * 930, sy = cy + Math.sin(a) * 930, yaw = adeg + 90; S(standingStone(hs, sd), sx, sy, 0, yaw); body(sx, sy, hs * 0.3 * 2 * 0.86, hs * 0.17 * 2 * 0.9, hs, yaw); SPOT.push([sx, sy, 150]); }
    S(hearthStones(110, 1), cx + 60, cy + 40, 0, 20); SPOT.push([cx + 60, cy + 40, 160]); }

  // ---- the mire in the saddle: its pools, the peat hags the weather has cut, the spring's well-house at its west edge
  // and the runnel from it under the boardwalk; the boardwalk the trail crosses it on
  { const [x, y] = RR.spring; S(springHead(), x, y, 0, 0); body(x, y, 164, 94, 154); body(x, y, 186, 120, 54, 0, 154); body(x + 11, y - 110, 192, 84, 50); SPOT.push([x, y - 40, 240]);
    band([[x + 104, y - 110], [x + 320, y - 170], [x + 560, y - 230], [x + 820, y - 280], [x + 1100, y - 360], [x + 1180, y - 390]], 70, 2.1, (i, j) => (j === 0 || j === 4 ? 0x4e5a3a : 0x4a6a74), 0.15); }
  { const segs = []; for (let k = 0; k < WALK.length - 1; k++) { const [x0, y0] = WALK[k], [x1, y1] = WALK[k + 1], L = Math.hypot(x1 - x0, y1 - y0), yaw = Math.atan2(y1 - y0, x1 - x0) / D2R, a = k ? 90 : 0, b = k < WALK.length - 2 ? 90 : 0;
      const Ls = L - a - b, ux = (x1 - x0) / L, uy = (y1 - y0) / L, mx = x0 + ux * (a + Ls / 2), my = y0 + uy * (a + Ls / 2); segs.push([mx, my, Ls + 2, yaw]); }
    for (const [mx, my, Ls, yaw] of segs) { S(walkway(Ls, 180), mx, my, 0, yaw); body(mx, my, Ls, 180, 13, yaw, 0, false); }
    for (const k of [1, 2]) { const [x, y] = WALK[k], [x0, y0] = WALK[k - 1], yaw = Math.atan2(y - y0, x - x0) / D2R; S(landing(180), x, y, 0, yaw); body(x, y, 180, 180, 13, yaw, 0, false); } }
  // ---- the Blight came up in the mire: its heart there, masses out over the crest, the pines by it dead
  const blightAt = [];
  { const [x, y] = RR.heart; S(blightMass(400, 2, 'mire'), x, y, 0, 30); round(x, y, 400 * 0.62, 400 * 0.55); blightAt.push([x, y, 400]); Lamp(V(x + 40, y - 30, 170), MIRE, 2.2, 1200, false); Glow(V(x, y, 130), V(22, 22, 26), MIRE_GLOW, 2); SPOT.push([x, y, 420]);
    for (const [ex, ey, r, sd] of [[2350, 700, 230, 3], [-700, -950, 200, 1], [2050, -1350, 210, 4], [-1500, 1300, 220, 2], [1250, 1250, 190, 1], [2900, -2900, 200, 3]]) { S(blightMass(r, sd, 'mire'), ex, ey, 0, rr(0, 360)); round(ex, ey, r * 0.62, r * 0.55); blightAt.push([ex, ey, r]); Lamp(V(ex, ey, 110), MIRE, 2.2, 650, false); SPOT.push([ex, ey, r + 60]); } }
  for (const [x, y, h, sd] of [[1900, 260, 1300, 1], [760, 520, 1100, 4], [1650, -760, 1200, 3]]) { S(deadPine(h, sd), x, y, 0, rr(0, 360)); trunk(x, y, pineTrunk(h), h * 0.4); SPOT.push([x, y, 120]); }

  const POOLS = [];
  { const x = 640, y = -140; patch(x, y, 560, 0x7e7e40); S(bogPool(150, 110, 7), x, y, 0, 30); POOLS.push([x, y, 180]); }
  { let n = 0; for (let k = 0; k < 4000 && n < 14; k++) { const x = rr(RR.mire[0] - 1350, RR.mire[0] + 1350), y = rr(RR.mire[1] - 800, RR.mire[1] + 800), rx = rr(110, 260), ry = rx * rr(0.55, 0.8);
      if (!inMire(x, y, -rx * 1.2 - 60) || lineDist(x, y, WALK) < rx * 1.2 + 120 || Math.hypot(x - RR.heart[0], y - RR.heart[1]) < 500 + rx || keepOff(x, y, rx * 1.2) || POOLS.some(([px, py, pr]) => Math.hypot(x - px, y - py) < pr + rx * 1.2 + 110)) continue;
      patch(x, y, rx * 3.2, pick([0x7e7e40, 0x8a7438, 0x6a7638])); S(bogPool(rx, ry, n), x, y, 0, rr(0, 360)); POOLS.push([x, y, rx * 1.2]); n++; } }
  { let n = 0; const H = []; for (let k = 0; k < 6000 && n < 9; k++) { const x = rr(RR.mire[0] - 1500, RR.mire[0] + 1500), y = rr(RR.mire[1] - 900, RR.mire[1] + 900), w = pick([260, 300, 340, 380, 420]), d = pick([140, 160, 180, 200]), h = pick([48, 56, 64, 72]), yaw = rr(0, 180);
      if (!inMire(x, y, -w / 4) || lineDist(x, y, WALK) < w / 2 + 170 || Math.hypot(x - RR.heart[0], y - RR.heart[1]) < 440 + w / 2 || keepOff(x, y, w / 2 + 30) || POOLS.some(([px, py, pr]) => Math.hypot(x - px, y - py) < pr + w / 2 + 40) || H.some(([qx, qy, qr]) => Math.hypot(x - qx, y - qy) < qr + w / 2 + 220) || onPath(x, y, w / 2 + 60)) continue;
      S(peatHag(w, d, h, n), x, y, 0, yaw); body(x, y, w * 0.96, d * 0.96, h, yaw); H.push([x, y, w / 2]); SPOT.push([x, y, w / 2 + 30]); n++; } }

  // ---- the paths: the trail, the station's ways, the ways to the hoist, the beacon, the viewpoint, the spring
  for (const P of PATHS) path(P, P === TRAIL_S || P === TRAIL_N || P === TRAIL_X ? 250 : 190, 0x7a6448, 0x8e8a80);
  // cairns along the trail
  { const along = (P, s) => { let acc = 0; for (let j = 1; j < P.length; j++) { const [x0, y0] = P[j - 1], [x1, y1] = P[j], L = Math.hypot(x1 - x0, y1 - y0); if (acc + L >= s) { const t = (s - acc) / L; return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, -(y1 - y0) / L, (x1 - x0) / L]; } acc += L; } return null; };
    let side = 1; for (const [P, s0, s1] of [[TRAIL_S, 700, 4400], [TRAIL_N, 250, 300]]) for (let s = s0; s <= s1; s += 1150) { const q2 = along(P, s); if (!q2) continue; const [x, y, nx, ny] = q2, cx2 = x + nx * 220 * side, cy2 = y + ny * 220 * side; side = -side; if (keepOff(cx2, cy2, 60) || onPath(cx2, cy2, 70)) continue;
      const h = pick([100, 120, 140]); S(cairn(h, Math.round(s)), cx2, cy2, 0, rr(0, 360)); round(cx2, cy2, h * 0.62 * 0.92, h); SPOT.push([cx2, cy2, 110]); }
    S(cairn(200, 7), -1350, 5150, 0, 20); round(-1350, 5150, 200 * 0.62 * 0.92, 200); SPOT.push([-1350, 5150, 180]); }

  // ---- the way on: the old stones where the trail leaves north; their floor where the stations come up
  { const [x, y] = RR.floor; S(flagFloor(RR.floorR, 8, 0x4a5236, true, [0x9a968c, 0x8e8a80, 0xa6a296, 0x86827a]), x, y, 0.4, 0);
    for (const [ox, h, sd] of [[-560, 320, 2], [560, 300, 5]]) { S(standingStone(h, sd), x + ox, y + 760, 0, 90); body(x + ox, y + 760, h * 0.3 * 2 * 0.86, h * 0.17 * 2 * 0.9, h, 90); } }

  // ---- the tors: granite stacked up out of the turf
  for (const [x, y, r, h, sd, yaw] of [[2700, -3900, 560, 480, 1, 20], [-2700, 1550, 460, 400, 2, -30], [3100, 4300, 620, 520, 3, 70], [-3300, 4700, 380, 320, 4, 10], [2000, -5300, 400, 340, 5, -15], [-1250, -1950, 320, 260, 6, 40]]) {
    S(tor(r, h, sd), x, y, 0, yaw);
    for (const p of torParts(r, h, sd)) { const [px, py] = at(x, y, yaw, p.x, p.y); body(px, py, p.bw * 2 * 0.9, p.bd * 2 * 0.9, p.z1 - p.z0, yaw, p.z0); }
    SPOT.push([x, y, r * 1.15]); }

  // ---- the pines, bent east by the wind off the west, most of them on the weather side; boulders in the turf
  const items = [];
  const treeOK = (x, y, m) => !onPath(x, y, 200 + m) && !keepOff(x, y, 100 + m) && !inMire(x, y, 150 + m) && !inRing(x, y, 200 + m) && Math.hypot(x - RR.floor[0], y - RR.floor[1]) > RR.floorR + 250 + m
    && Math.hypot(x - RR.spawn[0], y - RR.spawn[1]) > 900 + m && Math.abs(x) < hx - 150 && Math.abs(y) < hy - 150;
  for (let k = 0; k < 5000 && items.length < 46; k++) { const west = rnd() < 0.68, x = west ? rr(-hx + 200, -600) : rr(600, hx - 200), y = rr(-hy + 200, hy - 200); if (!treeOK(x, y, 60) || items.some((t) => Math.hypot(t.x - x, t.y - y) < 420)) continue;
    const h = pick([700, 800, 900, 1000, 1100]), sd = items.length, tr = pineR(h) * 1.55; items.push({ x, y, half: tr, circle: true, place: () => { S(windPine(h, sd), x, y, 0, rr(-12, 12)); trunk(x, y, tr, h * 0.4); SPOT.push([x, y, 90]); } }); }
  for (let k = 0; k < 3000 && items.length < 74; k++) { const x = rr(-hx + 200, hx - 200), y = rr(-hy + 200, hy - 200); if (!treeOK(x, y, 20) || items.some((t) => Math.hypot(t.x - x, t.y - y) < 300)) continue;
    const r = pick([60, 80, 100, 130]); items.push({ x, y, half: r * 0.92, circle: true, place: () => { S(rock(r, Math.round(x + y) & 7, true), x, y, 0, rr(0, 360)); round(x, y, r * 0.92, r * 0.9); SPOT.push([x, y, r + 30]); } }); }
  for (const p of K.plan(items, RR.spawn)) p.place();

  // ---- the Mirecap's threads out of the heart: over the mire to its masses, along the trail, up into the old ring; its
  // toadstools along them
  { const [hx0, hy0] = RR.heart, veins = [];
    for (const [ex, ey] of [[2350, 700], [-700, -950], [2050, -1350], [-1500, 1300], [1250, 1250], [2900, -2900], [0, 1700], [-300, -300], [2600, 2000]]) { const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([hx0 + (ex - hx0) * t + Math.sin(t * 7 + ex) * 120 * t, hy0 + (ey - hy0) * t + Math.cos(t * 5 + ey) * 120 * t]); } veins.push(pts); }
    M.Shape('rgveins', () => { const pos = [], col = [], idx = []; for (const pts of veins) { const n = pts.length; for (let j = 0; j < n - 1; j++) { const [x0, y0] = pts[j], [x1, y1] = pts[j + 1], L = Math.hypot(x1 - x0, y1 - y0), m = Math.max(2, Math.round(L / 40)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
      for (let i = 0; i <= m; i++) { const t = i / m, wv = Math.sin((x0 + i * 40) * 0.011 + j) * 40 + Math.sin((y0 + i * 40) * 0.023) * 16, px = x0 + (x1 - x0) * t + nx * wv, py = y0 + (y1 - y0) * t + ny * wv, w = 9 * (1 - ((j + t) / n) * 0.7); for (const e of [-1, 1]) { pos.push(px + nx * w * e, py + ny * w * e, 2.9); col.push(0.5, 0.8, 0.7); } }
      const b = pos.length / 3 - (m + 1) * 2; for (let i = 0; i < m; i++) { const a = b + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } } } return { pos, col, idx }; }, V(0, 0, 0), R(0, 0, 0));
    for (const pts of veins) for (let j = 2; j < pts.length; j += 2) { const [vx, vy] = pts[j]; if (blightAt.some(([bx, by, br]) => Math.hypot(vx - bx, vy - by) < br + 120) || onPath(vx, vy, 200) || keepOff(vx, vy, 60) || POOLS.some(([px, py, pr]) => Math.hypot(vx - px, vy - py) < pr + 40) || !K.clear(vx, vy, 160)) continue;
      const ts = pick([0.8, 1, 1.2]); S(toadstoolCluster(ts, 0x3e6c4c, pick([1, 2, 3])), vx, vy, 0, rr(0, 360)); round(vx, vy, 22 * ts, 40 * ts); } }

  // ---- heather over the crest in cushions (never on a path, a floor, in the mire's middle or in a pool); cotton grass
  // in the mire
  { const nav = O.GM, [cx, cy] = [O.cx, O.cy], ok = (x, y) => { const [ix, iy] = nav.cellOf(cx + x, cy + y); return nav.navFree(ix, iy) && K.clear(x, y, 30); };
    const hOK = (x, y) => ok(x, y) && !onPath(x, y, 150) && !inMire(x, y, -120) && Math.hypot(x - RR.floor[0], y - RR.floor[1]) > RR.floorR + 40 && !keepOff(x, y, 10) && Math.hypot(x - RR.view[0], y - RR.view[1]) > 380 && Math.abs(x) < hx - 60 && Math.abs(y) < hy - 60;
    let n = 0; for (let k = 0; k < 600 && n < 380; k++) { const x0 = rr(-hx + 200, hx - 200), y0 = rr(-hy + 200, hy - 200), m = 2 + Math.floor(rnd() * 7), sp = rr(120, 260); if (!hOK(x0, y0)) continue;
      for (let j = 0; j < m; j++) { const x = x0 + (j ? rr(-sp, sp) : 0), y = y0 + (j ? rr(-sp, sp) : 0); if (!hOK(x, y)) continue; S(heather(pick([40, 50, 60, 70, 90]), n), x, y, 0, rr(0, 360)); n++; } }
    n = 0; for (let k = 0; k < 4000 && n < 160; k++) { const x = rr(RR.mire[0] - 1500, RR.mire[0] + 1500), y = rr(RR.mire[1] - 900, RR.mire[1] + 900); if (!inMire(x, y, -40) || POOLS.some(([px, py, pr]) => Math.hypot(x - px, y - py) < pr + 14) || lineDist(x, y, WALK) < 120 || onPath(x, y, 130) || !K.clear(x, y, 24)) continue;
      S(cottonGrass(n), x, y, 0, rr(0, 360)); n++; } }

  // ---- the valleys below the cliffs: the Wildwood's floor, its forest, the river and the valley road east, the long lake
  // west; the hills beyond; the ridge going on north and south to higher ground
  Box(V(0, 0, VZ - 60), V(80000, 80000, 120), 0x30442a, false, false);
  for (let i = 0; i < 64; i++) { const sd = i % 2 ? 1 : -1, x = sd * rr(hx + 600, hx + 14000), y = rr(-16000, 16000); Cyl(V(x, y, VZ + 0.3 + i * 0.012), rr(2200, 5200), 1, pick([0x2a3e26, 0x344a2c, 0x3a4e2e, 0x2e4228]), false, false, null); }
  { const RV = [], RD = []; for (let y = -16000; y <= 16000; y += 700) { RV.push([riverX(y), y]); RD.push([roadX(y), y]); }
    band(RV, 380, VZ + 1.6, (i, j) => (j === 0 || j === 4 ? 0x4a5a44 : (i + j) % 5 === 0 ? 0x5a7e92 : 0x4a6e86), 0.08);
    band(RD, 170, VZ + 1.3, (i, j) => (j === 0 || j === 4 ? 0x5e5a40 : 0x7a6a4c), 0.05); }
  M.Shape('rgvlake', () => { const pos = [], col = [], idx = [], C = new THREE.Color(), n = 72;
    const ring = (m, z, c) => { const b = pos.length / 3; C.setHex(c, THREE.NoColorSpace); for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, k = vlK(a); pos.push(VL[0] + Math.cos(a) * (VLR[0] * k + m), VL[1] + Math.sin(a) * (VLR[1] * k + m), z); col.push(C.r, C.g, C.b); } return b; };
    const RGs = [ring(120, VZ + 1.4, 0x4a5640), ring(0, VZ + 1.6, 0x56788c), ring(-500, VZ + 1.6, 0x4a6a82)], c0 = pos.length / 3; C.setHex(0x44627a, THREE.NoColorSpace); pos.push(VL[0], VL[1], VZ + 1.6); col.push(C.r, C.g, C.b);
    for (let r = 0; r < RGs.length - 1; r++) { const a = RGs[r], b = RGs[r + 1]; for (let i = 0; i < n; i++) { const j = (i + 1) % n; idx.push(a + i, a + j, b + i, a + j, b + j, b + i); } }
    const L0 = RGs[RGs.length - 1]; for (let i = 0; i < n; i++) idx.push(L0 + i, L0 + ((i + 1) % n), c0);
    return { pos, col, idx }; }, V(0, 0, 0), R(0, 0, 0));
  { const LEAF = [0x2a4426, 0x30502c, 0x26401f, 0x3a5430, 0x34482a]; let n = 0;
    for (let k = 0; k < 12000 && n < 760; k++) { const sd = k % 2 ? 1 : -1, d = hx + 700 + Math.pow(rnd(), 1.5) * 12500, x = sd * d, y = rr(-15500, 15500);
      if (sd > 0 && (Math.abs(x - riverX(y)) < 420 || Math.abs(x - roadX(y)) < 170)) continue; if (sd < 0 && inVL(x, y, 220)) continue;
      S(valleyTree(pick([600, 800, 800, 1000]), rnd() < 0.6 ? 1 : 0, pick(LEAF), n), x, y, VZ, rr(0, 360)); n++; } }
  for (const [x, y, rx, ry, h, c, z] of [[hx + 15500, -4000, 4500, 9000, 3800, 0x40583a, VZ], [hx + 15000, 9500, 4000, 7000, 3400, 0x3e5636, VZ], [-hx - 16000, 0, 5000, 11000, 4000, 0x40583a, VZ], [-hx - 14500, -12500, 4000, 6000, 3200, 0x44593a, VZ], [-hx - 9000, 15500, 5000, 5000, 3600, 0x46603c, VZ],
    [0, 15900, 5300, 3000, 900, 0x667848, -200], [300, 18600, 6200, 3600, 2100, 0x627446, -200], [1500, 23500, 8000, 5200, 3800, 0x5e6a52, -400], [0, -15900, 5100, 2900, 700, 0x667848, -200], [-400, -18800, 6000, 3400, 1600, 0x627446, -200]]) S(hill(rx, ry, h, c), x, y, z, 0);

  // where the Mirecap's beds come up: by the station, by the tor in the south-east, on the beacon's way, by the ring
  // east and west, by the north-east tor
  const settle = ([x, y]) => { for (let r = 0; r <= 1600; r += 100) { const n = Math.max(1, Math.round(r / 50)); for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (Math.abs(px) < hx - 500 && Math.abs(py) < hy - 500 && K.clear(px, py, 430) && Math.hypot(px - RR.floor[0], py - RR.floor[1]) > RR.floorR + 400) return [Math.round(px), Math.round(py)]; } } return [x, y]; };
  const beds = [[-1200, -2900], [2300, -3000], [-2500, -1100], [2500, 2300], [-2500, 3600], [1700, 4100]].map(settle);
  return {
    spots: { spawn: RR.spawn, yaw: Math.PI, exit: [0, 5450], textYaw: -90, ammo: [650, -5300], ammoYaw: 90,
      bench: [-660, 5130], benchYaw: 0, box: [660, 4900], chest: [660, 4900], chestYaw: 180, press: [-660, 4630], pressYaw: 0 },
    keep: [[RR.floor[0], RR.floor[1], 900], [RR.heart[0], RR.heart[1], 450]],
    beds, bossAt: RR.ring,
  };
}

// ---- the air on the ridge: bits of heather and seed blowing east over the crest, sparks and smoke off the beacon
// (the smoke leaning away east on the wind), the Mirecap's wisps off its heart
export function ridgeAir(g, dt, A) {
  const c = g.camera.position, [cx, cy] = A.c; if (Math.abs(c.x - cx) > A.hx + 600 || Math.abs(c.z - cy) > A.hy + 600) return;
  const st = (ridgeAir.st ||= { s: 0, b: 0, k: 0, w: 0 });
  st.s += dt * 7; while (st.s > 1) { st.s -= 1; const a = Math.random() * 6.28, r = 200 + Math.random() * 1600;
    g.fx.add({ pos: new THREE.Vector3(c.x + Math.cos(a) * r, 20 + Math.random() * 220, c.z + Math.sin(a) * r), vel: new THREE.Vector3(130 + Math.random() * 70, (Math.random() - 0.3) * 24, (Math.random() - 0.5) * 30), drag: 0, life: 3 + Math.random() * 2, size0: 3, size1: 2, c0: [0.9, 0.86, 0.8, 0.8], c1: [0.9, 0.86, 0.8, 0], fadeIn: 0.15, fadeOut: 0.3, tex: 'FX_Disc', kind: 'fx', glow: 0 }); }
  const bx = cx + RR.beacon[0], bz = cy + RR.beacon[1], top = BC.h + 22 + 90;
  if (Math.hypot(c.x - bx, c.z - bz) < 6000) {
    st.b += dt * 10; while (st.b > 1) { st.b -= 1; g.fx.add({ pos: new THREE.Vector3(bx + (Math.random() - 0.5) * 80, top, bz + (Math.random() - 0.5) * 80), vel: new THREE.Vector3(30 + Math.random() * 40, 120 + Math.random() * 90, (Math.random() - 0.5) * 40), drag: 0.3, life: 1.4 + Math.random(), size0: 4, size1: 2, c0: [1, 0.8, 0.4, 1], c1: [1, 0.4, 0.15, 0], fadeIn: 0.1, fadeOut: 0.6, tex: 'FX_Disc', kind: 'fx', glow: 1 }); }
    st.k += dt * 7; while (st.k > 1) { st.k -= 1; g.fx.add({ pos: new THREE.Vector3(bx + (Math.random() - 0.5) * 70, top + 40 + Math.random() * 30, bz + (Math.random() - 0.5) * 70), vel: new THREE.Vector3(60 + Math.random() * 50, 55 + Math.random() * 40, (Math.random() - 0.5) * 30), drag: 0.05, life: 6 + Math.random() * 2, size0: 60, size1: 300, rot: Math.random() * 360, rotVel: (Math.random() - 0.5) * 20, c0: [0.34, 0.32, 0.3, 0.45], c1: [0.55, 0.55, 0.57, 0], fadeIn: 0.08, fadeOut: 0.7, tex: 'FX_Disc', kind: 'fx', glow: 0 }); } }
  const hx0 = cx + RR.heart[0], hz0 = cy + RR.heart[1]; if (Math.hypot(c.x - hx0, c.z - hz0) < 3500) { st.w += dt * 3; while (st.w > 1) { st.w -= 1; const a = Math.random() * 6.28, r = 200 + Math.random() * 700;
    g.fx.add({ pos: new THREE.Vector3(hx0 + Math.cos(a) * r, 40 + Math.random() * 120, hz0 + Math.sin(a) * r), vel: new THREE.Vector3((Math.random() - 0.2) * 50, (Math.random() - 0.3) * 18, (Math.random() - 0.5) * 50), drag: 0.1, life: 6, size0: 14, size1: 10, c0: [0.5, 1, 0.85, 1], c1: [0.4, 1, 0.8, 0], fadeIn: 0.2, fadeOut: 0.35, tex: 'FX_Disc', kind: 'fx', glow: 1 }); } }
}
