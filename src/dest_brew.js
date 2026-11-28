// The Brewery, in the Works: Hopwell Brewery on the canal, an afternoon's haze over it from its own chimney. The road
// comes in from the south past the brewery's row of cottages and its inn (the Tap) to the gate in the yard wall. In the
// yard: the maltings down its west side with its two kilns at the north end; the cooper's lean-to on the east side, his
// fire, barrels in every stage and piled finished; the steam dray loading; the wharf along the canal with its crane,
// bollards and the barge half loaded. At the north end of the yard the tower brewhouse (five storeys, its lucam and
// hoist, its ventilator), the copper house east of it with the two coppers, the fermenting shed west of it with the
// tuns behind its arcade, the mains overhead between them. Behind: the boiler house and its chimney, the coal, the water
// tank on its tower. Across the canal (the lock, the towpath) the hop garden and the oast. West of the maltings the barley
// is stacked. The Blight (Rustcap) came up in the fermenting shed: the middle tun has burst and its heart is pouring out
// through the arcade; it has come through the maltings' door, and onto the wharf, and into the hops; its sacs of rust
// hang from the mains, the copper house's beams, the arcade's arches, the crane and the cooperage. The way on: the old
// road north from the yard past the brewhouse.
//
// Local frame (dest.js): +Y north, +X east, z up; the ground is flat at z = 0. Playable: x in [-5600, 5600],
// y in [-6000, 6000]. The canal is shallow: anything can wade it anywhere.
import * as THREE from 'three';
import { V, R } from './mapkit.js';
import { destKit } from './dest_kit.js';
import { blightMass, farTree, handPump, haystack, raisedBed, wheatField } from './dest_props.js';
import { oak, oakTrunk, flagFloor, footbridge, FB } from './dest_props_wood.js';
import { toadstoolCluster, grassTuft, hill } from './village_shapes.js';
import { crate, sack, cart, flowerClump } from './village_props.js';
import { KC, brickRun, brickHouse, waterTower, handCrane, barrel as wbarrel, hayBale, depotGate } from './dest_props_works.js';
import { townHouse, HS, HOUSE, gasLamp, stack, coalHeap } from './dest_props_town.js';
import { staveStack, barrelRaising } from './dest_props_vale.js';
import { trestle } from './dest_props_lake.js';
import { shapeB as shape } from './propkit.js';
import { brewhouse, BRW, copperKettle, CK, copperShed, CS, copperShedHangs, tun, TUN, tunShed, TS, maltKiln, KILN, oast, OAST, hopRow, barge, BG, lockGates, LG, steamDray, pipeRun, pipeHangs, workShed, WS, firePot, barrelPile, innSign, bollard } from './dest_props_brew.js';

export const BR = {
  spawn: [0, -5300], floor: [0, 4900], floorR: 850, wallY: -2900,
  maltings: [-2950, -1900], kilns: [[-2950, -640], [-2950, -100]], tshed: [-1700, 1450], house: [200, 2150], cshed: [1650, 2000],
  boiler: [1700, 2950], chimney: [2150, 3250], tank: [-1000, 3200], cooper: [2200, -1500], tap: [1050, -3900],
  canal: 3350, canalW: 440, lockY: [1300, 2200], oast: [4750, 2800], heart: [-1700, 1470],
};
const CX = BR.canal, CW = BR.canalW / 2;
// the roads and the paths
const ROAD = [[0, -6100], [40, -5000], [-30, -4000], [0, -2950]];
const YARDWAY = [[0, -2900], [60, -1500], [200, -300], [200, 1760]];
const NWAY = [[0, 4450], [-450, 3700], [-600, 2700], [-600, 1500]];
const ROAD_N = [[0, 5300], [0, 6100]];
const TAPLANE = [[0, -3500], [800, -3420], [1800, -3460], [3000, -3500]];
const TOWPATH = [[3800, -6100], [3800, -3600], [3780, 0], [3800, 3600], [3800, 6100]];
const HOPWAY = [[3800, -1300], [4400, -700]];
const BARLEY = [[-2650, -1600], [-3700, -1400], [-4400, -600]];
const PATHS = [ROAD, NWAY, ROAD_N, TAPLANE, TOWPATH, HOPWAY, BARLEY];

export function buildBrew(M, O) {
  const { hx, hy } = O;
  const K = destKit(M, 59, O, { exactNav: true }), { S, body, round, trunk, patch, path, band, rnd, rr, lineDist, Box, Lamp, Glow } = K;
  const pick = (L) => L[Math.floor(rnd() * L.length)];
  const SOL = (x, y, w, d, h, yaw = 0, nav = true) => body(x, y, w, d, h, yaw, 0, nav);
  const D2R = Math.PI / 180, RUST = { r: 1, g: 0.82, b: 0.3 }, RUST_GLOW = 0xffd24e, WARM = { r: 1, g: 0.78, b: 0.45 };
  const at = (x, y, yaw, u, v) => [x + u * Math.cos(yaw * D2R) - v * Math.sin(yaw * D2R), y + u * Math.sin(yaw * D2R) + v * Math.cos(yaw * D2R)];
  const navBand = (x, y, w, d) => O.GM.NavBlockBox({ min: V(x - w / 2, y - d / 2, 0), max: V(x + w / 2, y + d / 2, 100) }, 1);
  const roofBody = (x, y, yaw, hl, hw, ze, zr) => { for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const v0 = hw * (1 - i / 4), v1 = hw * (1 - (i + 1) / 4), z0 = ze + (zr - ze) * (i / 4), z1 = ze + (zr - ze) * ((i + 1) / 4), [px, py] = at(x, y, yaw, 0, sd * (v0 + v1) / 2); body(px, py, hl * 2, v0 - v1, z1 - z0 + 14, yaw, z0 - 6); } };
  const both = (P, x, y, z, yaw) => { S(P.main, x, y, z, yaw); M.Shape(P.glow[0], P.glow[1], V(x, y, z), R(0, yaw, 0), 0xffffff, 1, true); };
  const SPOT = [], hangs = [];
  const keepOff = (x, y, m = 0) => SPOT.some(([sx, sy, r]) => Math.hypot(x - sx, y - sy) < r + m);
  const onPath = (x, y, m = 0) => PATHS.some((P) => lineDist(x, y, P) < m) || lineDist(x, y, YARDWAY) < m;
  const inCanal = (x, y, m = 0) => Math.abs(x - CX) < CW + m;
  const hang = (x, y, z) => hangs.push([Math.round(x), Math.round(y), Math.round(z)]);

  // ---- a brick wall with stone copings, piers at every bay (the depot's walls), its body along it
  const WH = 300, wall = (x0, x1, y, alongY = false, seed = 1) => { const L = Math.abs(x1 - x0), n = Math.max(1, Math.round(L / 600)), seg = L / n;
    for (let i = 0; i < n; i++) { const a = Math.min(x0, x1) + seg * i, b = a + seg, sd = seed + i; S(['dbwall|' + [Math.round(seg), sd % 4].join('|'), shape((G) => { brickRun(G, -seg / 2, seg / 2, 0, 0, WH, 34, sd, false, true); G.box(0, 0, WH + 6, seg / 2, 24, 6, KC.trim); for (const s of [-1, 1]) { brickRun(G, s * seg / 2 - 30, s * seg / 2 + 30, 0, 0, WH + 30, 54, sd + 5); G.box(s * seg / 2, 0, WH + 36, 34, 34, 6, KC.trim); } })], alongY ? y : (a + b) / 2, alongY ? (a + b) / 2 : y, 0, alongY ? 90 : 0); }
    if (alongY) body(y, (x0 + x1) / 2, 60, L, WH + 40); else body((x0 + x1) / 2, y, L, 60, WH + 40); };
  // ---- a brick house (dest_props_works), its body and its roof's steps; front +X turned by yaw (a multiple of 90)
  const brick = (x, y, W, D, H, opts, seed, yaw = 0) => { S(brickHouse(W, D, H, { ...opts, coarse: true }, seed), x, y, 0, yaw); const pitch = opts.pitch || 0.62, ridge = H + (W / 2) * pitch;
    SOL(x, y, W + 30, D + 30, H + 4, yaw); roofBody(x, y, yaw + 90, D / 2 + 30, W / 2 + 30, H - 30 * pitch, ridge);
    for (const cy of opts.chimneys || []) { const [chx, chy] = at(x, y, yaw, W * 0.35, cy); body(chx, chy, 68, 88, ridge + 130 - H, yaw, H, false); }
    SPOT.push([x, y, Math.hypot(W, D) / 2 + 60]); };
  // ---- a town house (dest_props_town), its body, its roof's steps, its chimney; front +X turned by yaw
  const house = (x, y, yaw, w, d, storeys, seed, front, ends = 0) => { S(townHouse(w, d, storeys, seed, front, ends), x, y, 0, yaw);
    const { eave, gable, ridge } = HS(storeys, w, d, seed), ov = HOUSE.ov, p = HOUSE.pitch; body(x, y, d + 12, w, eave, yaw);
    if (gable) roofBody(x, y, yaw, d / 2 + ov, w / 2 + ov, eave - ov * p, ridge); else roofBody(x, y, yaw + 90, w / 2 + ov, d / 2 + ov, eave - ov * p, ridge);
    { const [chx, chy] = gable ? at(x, y, yaw, -d / 2 + 70, 0) : at(x, y, yaw, 0, (seed % 2 ? 1 : -1) * (w / 2 - 46)); body(chx, chy, gable ? 72 : 60, gable ? 60 : 76, ridge + 150 - eave, yaw, eave, false); }
    SPOT.push([x, y, Math.hypot(w, d) / 2 + 60]); };

  // ---- the ground: trodden earth and cinders in the yard, setts where the carts go, grass outside the walls
  Box(V(0, 0, -60), V(hx * 2 + 24000, hy * 2 + 24000, 120), 0x6a7a44, true, false);
  for (let i = 0; i < 40; i++) { const x = rr(-hx + 300, hx - 300), y = rr(-hy + 300, hy - 300); if (inCanal(x, y, 400) || (x > -2700 && x < 3100 && y > -2950 && y < 2600)) continue; patch(x, y, rr(500, 1200), pick([0x6e7e46, 0x66763e, 0x728248, 0x627240])); }
  for (const [x, y, d, c] of [[0, -1200, 3400, 0x7a7466], [-400, 700, 2600, 0x746e62], [1500, -1400, 2400, 0x7e786a], [-1500, -600, 2000, 0x787264], [400, 2600, 2600, 0x6e6a5e], [1800, 900, 1800, 0x7a7468], [-1600, 2700, 1800, 0x726c60]]) patch(x, y, d, c);
  K.settRoad(YARDWAY, 300, 2.6, { kerbW: 0, cols: [0x8a8478, 0x7e786e, 0x948e82, 0x847c70] });
  K.settRoad([[2965, -2860], [2965, 880]], 230, 2.6, { kerbW: 0, cols: [0x8a8478, 0x7e786e, 0x948e82, 0x847c70] });
  K.settRoad([[600, -1550], [1900, -1550]], 260, 2.4, { kerbW: 0, cols: [0x847e72, 0x7a746a, 0x8e887c, 0x807a6e] });

  // ---- the canal: stone copings flush with the ground, the water between; the lock, its gates, its keeper's hut
  band([[CX, -6200], [CX, 6200]], BR.canalW + 110, 0.9, () => 0x8a8478, 0);
  band([[CX, -6200], [CX, 6200]], BR.canalW, 1.05, (i, j) => (j === 0 || j === 4 ? 0x5e7480 : (i + j) % 6 === 0 ? 0x627a86 : 0x4e6470), 0);
  for (const [y, sd] of [[BR.lockY[0], 1], [BR.lockY[1], 2]]) { S(lockGates(BR.canalW), CX, y, 0, 90);
    void sd; const a = 18 * D2R; for (const s of [-1, 1]) {   // each leaf from its heel at the coping to the mitre in the middle; its balance beam back over the bank
      const hx0 = CX - s * CW, hy0 = y, dx = s * CW, dy = CW * Math.tan(a), len = Math.hypot(dx, dy), yw = (Math.atan2(dy, dx) * 180) / Math.PI; body(hx0 + dx / 2, hy0 + dy / 2, len, 24, LG.h + 40, yw);
      const [bx, by] = [CX - s * (CW + 120), y - 320]; body((hx0 + bx) / 2, (hy0 + by) / 2, Math.hypot(bx - hx0, by - hy0) + 20, 30, 34, (Math.atan2(by - hy0, bx - hx0) * 180) / Math.PI, LG.h + 2, false);
      for (let k = 0; k <= 8; k++) navBand(hx0 + (bx - hx0) * (k / 8), hy0 + (by - hy0) * (k / 8), 44, 44); }   // tall things can't go under the beams: the walking grid goes round them
    SPOT.push([CX, y, 520]); }
  brick(CX + 820, (BR.lockY[0] + BR.lockY[1]) / 2, 400, 520, 300, { doors: [{ y: 120, w: 100, h: 220, side: -1, color: KC.green }], windows: { back: [-120], ends: [0] }, chimneys: [-170], wz: 160, ww: 70, wh: 90 }, 6, 0);

  // ---- the bridges over the canal: the lane's (setts between brick parapets), the footbridge at the north end
  K.settRoad([[CX - 330, -3500], [CX + 330, -3500]], 380, 2.6, { kerbW: 0 });
  for (const s of [-1, 1]) { const y = -3500 + s * 215; S(['bwparapet', shape((G) => { brickRun(G, -300, 300, 0, 0, 110, 40, 7 + s, false, true); G.box(0, 0, 116, 304, 26, 6, KC.trim); for (const e of [-1, 1]) { brickRun(G, e * 300 - 26, e * 300 + 26, 0, 0, 140, 52, 9); G.box(e * 300, 0, 146, 32, 32, 6, KC.trim); } })], CX, y, 0, 0); body(CX, y, 652, 56, 150); }
  { const by = 4100, L = 640; S(footbridge(L, 230), CX, by, 0, 0); body(CX, by, L, 230, FB.deck, 0, 0, false); for (const s of [-1, 1]) body(CX, by + s * 111, L - 40, 16, FB.deck + 100, 0, 0, false); SPOT.push([CX, by, 380]); }

  // ---- the road in from the south past the brewery's cottages and its inn; gas lamps along it
  [[-700, -4520, 4, 2], [-700, -4080, 5, 0], [-700, -3640, 8, 1]].forEach(([x, y, sd, ends]) => house(x, y, 0, 440, 560, 2, sd, 0, ends));
  for (const [x, y, k] of [[-330, -4560, 1], [-340, -3700, 2]]) { S(flowerClump(36, [0xf08aa8, 0xf6c43a][k % 2], 0xffffff, k), x, y, 0, rr(0, 360)); }
  for (const [x, y, sd] of [[-1350, -4500, 1], [-1350, -3700, 2]]) { S(raisedBed(360, 140), x, y, 0, 90); SOL(x, y, 150, 370, 40, 0); }
  // the Tap: the brewery's inn, its sign out over the road, tables in front of it, its barrels
  { const [x, y] = BR.tap; house(x, y, 180, 700, 560, 3, 14, 1, 3);
    S(innSign(), x - 280, y + 250, 0, 180); M.Sign(V(x - 350, y + 250 - 4, 262), -90, 'THE TAP', { r: 0.95, g: 0.84, b: 0.5 }, 16); M.Sign(V(x - 350, y + 250 + 4, 262), 90, 'THE TAP', { r: 0.95, g: 0.84, b: 0.5 }, 16);
    M.Sign(V(x - 293, y, 248), 180, 'THE TAP', { r: 0.95, g: 0.88, b: 0.62 }, 26);
    for (const [dx, dy, sd] of [[-560, -200, 1], [-560, 200, 2]]) { const tx = x + dx, ty = y + dy; S(trestle(sd, 0), tx, ty, 0, 90); body(tx, ty, 190, 304, 80, 0); for (const [u, v, w, h] of [[-125, 14, 26, 31], [40, 22, 26, 31]]) { const [px, py] = at(tx, ty, 90, u, v); body(px, py, w, w, h, 90, 79); } SPOT.push([tx, ty, 200]); }
    for (const [dx, dy] of [[-330, -320], [-330, -250], [-380, -290]]) { S(wbarrel(Math.round(dx + dy)), x + dx, y + dy, 0, rr(0, 360)); round(x + dx, y + dy, 36, 92); }
    Lamp(V(x - 350, y + 250, 300), WARM, 2.2, 500, false); }
  for (const [x, y] of [[260, -5000], [-280, -4300], [260, -3700], [-300, -3200], [600, -3330], [2300, -3330]]) { S(gasLamp(), x, y, 0, 0); round(x, y, 17, 262, 0, false); K.lit(x, y, 292, WARM, 380, 0xffd88a); SPOT.push([x, y, 50]); }
  // the way in: a heap of setts and kerbstones by the road, the ammo's crate beside it (dest.js)
  for (const [x, y, w] of [[-700, -5650, 90], [-620, -5560, 80], [-760, -5520, 70]]) { S(crate(w, Math.round(x + y)), x, y, 0, rr(-20, 20)); SOL(x, y, w, w, w * 0.85); } SPOT.push([-700, -5580, 200]);

  // ---- the yard wall and the gate, HOPWELL BREWERY on its arch; the maltings closes the yard's south-west corner
  { const y = BR.wallY; wall(BR.maltings[0] + 300, -440, y, false, 1); wall(440, CX - CW - 60, y, false, 5);
    S(depotGate(700), 0, y, 0, -90); for (const s of [-1, 1]) body(s * 390, y, 100, 100, 400);
    M.Sign(V(0, y - 6, 430), -90, 'HOPWELL BREWERY', { r: 0.95, g: 0.86, b: 0.6 }, 26); M.Sign(V(0, y + 6, 430), 90, 'HOPWELL BREWERY', { r: 0.95, g: 0.86, b: 0.6 }, 26);
    for (const s of [-1, 1]) hang(s * 150, y, 402); SPOT.push([0, y, 460]); }

  // ---- the maltings down the yard's west side, its doors to the yard, its two kilns at the north end; sacks of malt
  { const [x, y] = BR.maltings; brick(x, y, 600, 2000, 460, { doors: [{ y: -700, w: 240, h: 300, side: 1, color: KC.green }, { y: 0, w: 240, h: 300, side: 1, color: KC.green }, { y: 650, w: 200, h: 260, side: 1, color: KC.green }], windows: { front: [-880, -400, 330, 880], back: [-700, -230, 250, 720], ends: [-150, 150] }, wz: 200, ww: 70, wh: 100 }, 3, 0);
    for (const [kx, ky] of BR.kilns) { S(maltKiln(Math.round(ky)), kx, ky, 0, 0); SOL(kx, ky, KILN.s + 16, KILN.s + 16, KILN.e); const h = KILN.s / 2 + 34, sl = (KILN.zt - KILN.e) / (KILN.s / 2 - 68); for (let i = 0; i < 4; i++) { const hh = h - (i * (h - 70)) / 4, z0 = KILN.e - 34 * sl + i * ((KILN.zt + 30 - (KILN.e - 34 * sl)) / 4); body(kx, ky, hh * 2, hh * 2, 60, 0, z0); } SPOT.push([kx, ky, 380]); }
    for (const [dx, dy, n] of [[400, -500, 5], [420, 400, 4]]) for (let i = 0; i < n; i++) { const sx = x + dx + (i % 2) * 52, sy = y + dy + Math.floor(i / 2) * 50; S(sack(26, 0xd8c8a0), sx, sy, -3, rr(0, 360)); round(sx, sy, 29, 66); }
    SPOT.push([x + 420, y - 450, 140], [x + 440, y + 450, 120]); }

  // ---- the fermenting shed behind its arcade: three tuns, the middle one burst, the Rustcap's heart pouring out of it
  const blightAt = [];
  { const [x, y] = BR.tshed, L = 1500, d = 640, hd = d / 2, t = 34; S(tunShed(L, d, 1), x, y, 0, 0);
    body(x, y + hd - t / 2, L, t + 4, TS.e); for (const sx of [-1, 1]) body(x + sx * (L / 2 - t / 2), y, t + 4, d, TS.e);
    const n = Math.round(L / TS.bay), b0 = L / n; for (let i = 0; i <= n; i++) { const px = x - L / 2 + b0 * i, w = i === 0 || i === n ? 50 : 70, cx2 = i === 0 ? px + 25 : i === n ? px - 25 : px; body(cx2, y - hd + t / 2, w + 4, t + 4, TS.spring + 6); }
    body(x, y - hd + t / 2, L, t + 4, TS.e - TS.spring - 120, 0, TS.spring + 120, false);
    roofBody(x, y, 0, L / 2 + 30, hd + 40, TS.e - 40 * TS.pitch, TS.e + hd * TS.pitch);
    for (let i = 0; i < n; i++) hang(x - L / 2 + b0 * (i + 0.5), y - hd + t / 2, TS.spring + (b0 - 70) / 2 - 2);
    const ty = y + hd - t - TUN.r - 20, [hx0, hy0] = BR.heart;
    for (const dx of [-420, 420]) { S(tun(Math.abs(dx), false), x + dx, ty, 0, -90); round(x + dx, ty, TUN.r + 6, TUN.h + 20); const [lx, ly] = at(x + dx, ty, -90, TUN.r + 50, 0); body(lx, ly, 100, 64, TUN.h + 20, -90); } S(tun(3, true), x, ty, 0, 90); S(blightMass(300, 2, 'rust'), hx0, hy0, 0, 20); round(hx0, hy0, 300 * 0.62, 300 * 0.55); body(x, y + hd - t - 90, 520, 180, 220); blightAt.push([hx0, hy0, 300]); Lamp(V(hx0, hy0 - 60, 170), RUST, 2.2, 1100, false); Glow(V(hx0, hy0, 120), V(22, 22, 26), RUST_GLOW, 2);
    SPOT.push([x, y, 900]); }

  // ---- the brewhouse, its chain and sack out over the yard; the copper house east of it, its coppers; the mains
  // overhead from the coppers to the fermenting shed, the wort pump where they come down
  { const [x, y] = BR.house, { W, D, H, ridge } = BRW; S(brewhouse(1), x, y, 0, -90); SOL(x, y, D + 50, W + 50, H);
    roofBody(x, y, 0, D / 2 + 44, W / 2 + BRW.over, H - BRW.over * BRW.pitch, ridge);
    SPOT.push([x, y, 640]); }
  { const [x, y] = BR.cshed, len = 1000, d = 700; S(copperShed(len, d), x, y, 0, 0);
    const n = Math.max(1, Math.round(len / 330)); for (let i = 0; i <= n; i++) for (const sy of [-1, 1]) round(x - len / 2 + (len * i) / n, y + sy * d / 2, 20, CS.e);
    for (const [hx2, hy2, hz] of copperShedHangs(len, d)) hang(x + hx2, y + hy2, hz);
    for (const dx of [-250, 250]) { S(copperKettle(1000, Math.abs(dx)), x + dx, y + 50, 0, -90); SOL(x + dx, y + 50, 2 * (CK.r + 48), 2 * (CK.r + 48), CK.base + 10); round(x + dx, y + 50, CK.r + 2, CK.h + 96, CK.base); const [px, py] = at(x + dx, y + 50, -90, 0, CK.r + 55); body(px, py, 150, 44, 70, 0, CK.base + 35, false); }
    SPOT.push([x, y, 620]); }
  { const L = 2250, h = 420, span = 450, x = -950 + L / 2, y = BR.tshed[1]; S(pipeRun(L, h, span), x, y, 0, 0);
    const n = Math.round(L / span), sp = L / n; for (let i = 1; i < n; i++) { const px = x - L / 2 + sp * i; for (const s of [-1, 1]) { body(px, y + s * 70, 18, 18, h); navBand(px, y + s * 70, 40, 40); } body(px, y, 18, 172, 20, 0, h - 16, false); }
    body(x - 40, y, L - 80, 90, 34, 0, h - 4, false); round(x + L / 2 - 12, y, 62, 196); body(x + L / 2 - 12, y + 84, 120, 24, 120, 0, 50);
    for (const [hx2, hy2, hz] of pipeHangs(L, h, span)) hang(x + hx2, y + hy2, hz);
    SPOT.push([x + L / 2 - 12, y, 160]); }

  // ---- behind: the boiler house, its chimney, the coal; the water tank on its brick tower
  { const [x, y] = BR.boiler; brick(x, y, 560, 800, 380, { doors: [{ y: -200, w: 200, h: 260, side: -1, color: KC.green }], windows: { back: [150], front: [-200, 200], ends: [0] }, wz: 180, ww: 80, wh: 110 }, 7, 0);
    const [cx2, cy2] = BR.chimney; S(stack(1800, 100), cx2, cy2, 0, 0); SOL(cx2, cy2, 232, 232, 1840); SPOT.push([cx2, cy2, 200]);
    S(coalHeap(300, 150, 2), 2550, 2700, 0, 0); round(2550, 2700, 270, 140); SPOT.push([2550, 2700, 340]); }
  { const [x, y] = BR.tank; S(waterTower(), x, y, 0, 0); body(x, y, 340, 340, 420); round(x, y, 180, 290, 420); hang(x + 170 + 190, y, 420 - 28); SPOT.push([x, y, 300]); }

  // ---- the cooper's lean-to on the yard's east side, open to the west: a cask being raised in its hoops over the fire,
  // staves stacked, casks finished; piles of barrels outside
  { const [x, y] = BR.cooper, len = 1200, d = 560, yaw = -90, hd = d / 2, t = 30; S(workShed(len, d, 1), x, y, 0, yaw);
    { const [bx, by] = at(x, y, yaw, 0, hd - t / 2); body(bx, by, len, t + 4, WS.e + 22 + d * WS.pitch, yaw); }
    for (const sx of [-1, 1]) { const [ex, ey] = at(x, y, yaw, sx * (len / 2 - t / 2), 0); body(ex, ey, t + 4, d, WS.e, yaw); }
    const n = Math.max(2, Math.round(len / 300)); for (let i = 0; i <= n; i++) { const [px, py] = at(x, y, yaw, -len / 2 + 30 + ((len - 60) * i) / n, -hd + 12); round(px, py, 13, WS.e); if (i > 0) hang(...at(x, y, yaw, -len / 2 + 30 + ((len - 60) * (i - 0.5)) / n, -hd + 12), WS.e - 1); }
    { const L2 = d + 40; for (let i = 0; i < 4; i++) { const v0 = -hd - 40 + (L2 * i) / 4, v1 = v0 + L2 / 4, z0 = WS.e + 22 + (v0 + hd) * WS.pitch, [px, py] = at(x, y, yaw, 0, (v0 + v1) / 2); body(px, py, len + 48, L2 / 4, 20 + (L2 / 4) * WS.pitch, yaw, z0 - 6, false); } }
    { const [px, py] = at(x, y, yaw, -300, -40); S(barrelRaising(), px, py, 0, 0); round(px, py, 50, 100); }
    { const [px, py] = at(x, y, yaw, 120, 40); const F = firePot(); both(F, px, py, 0, 0); round(px, py, 46, 88); Lamp(V(px, py, 80), { r: 1, g: 0.6, b: 0.28 }, 2.2, 520, false); }
    for (const [u, v] of [[-480, 120], [-480, -10]]) { const [px, py] = at(x, y, yaw, u, v); S(staveStack(10), px, py, 0, yaw + 8); SOL(px, py, 112, 112, 76, yaw + 8); }
    for (const [u, v] of [[400, 140], [470, 60], [380, 50]]) { const [px, py] = at(x, y, yaw, u, v); S(wbarrel(Math.round(u + v)), px, py, 0, rr(0, 360)); round(px, py, 36, 92); }
    SPOT.push([x, y, 700]);
    for (const [px, py, yw, nn] of [[1650, -2450, 0, 4], [1600, -650, 90, 3]]) { S(barrelPile(nn, Math.abs(px)), px, py, 0, yw); SOL(px, py, nn * 64 + 28, 90, 32 + (nn - 1) * 55 + 32, yw); SPOT.push([px, py, nn * 40 + 80]); } }

  // ---- the wharf along the canal: bollards, the crane with its jib out over the water, the barge moored and half
  // loaded, barrels and crates waiting; the steam dray come for its load
  for (let y = -2600; y <= 700; y += 470) { S(bollard(), CX - CW - 30, y, 0, 0); round(CX - CW - 30, y, 18, 50); }
  { const x = 2990, y = -700; S(handCrane(), x, y, 16, 0); round(x, y, 42, 400, 0); hang(x + 240, y, 368); SPOT.push([x, y, 160]); }
  { const x = CX, y = -850; S(barge(1), x, y, 0, 92); SOL(x, y, BG.len + 20, BG.w + 20, BG.h + 66, 92); { const [cx2, cy2] = at(x, y, 92, -BG.len / 2 * 0.79 + 20, 0); body(cx2, cy2, 170, BG.w + 20, BG.h + 110, 92); } SPOT.push([x, y, 520]); }
  for (const [y, nn] of [[-2200, 4], [200, 3]]) { S(barrelPile(nn, Math.abs(y)), 2960, y, 0, 90); SOL(2960, y, nn * 64 + 28, 90, 32 + (nn - 1) * 55 + 32, 90); SPOT.push([2960, y, nn * 40 + 80]); }
  for (const [x, y, w] of [[2920, -1240, 70], [2930, -1330, 60], [3000, -1290, 64]]) { S(crate(w, Math.round(y)), x, y, 2.6, rr(-10, 10)); SOL(x, y, w, w, w * 0.85 + 3); }
  { const x = 2660, y = -250; S(steamDray(1), x, y, 0, -90); SOL(x, y, 620, 240, 210, -90); { const [cx2, cy2] = at(x, y, -90, 200, 0); body(cx2, cy2, 200, 240, 350, -90, 0, false); } SPOT.push([x, y, 380]); }

  // ---- the yard's things: the pump, a cart of sacks by the maltings, gas lamps
  S(handPump(), -1200, -1700, 0, 30); SOL(-1200, -1700, 70, 70, 200); SPOT.push([-1200, -1700, 90]);
  S(cart(2, 1), -2100, -1300, 0, 80); SOL(-2100, -1300, 240, 140, 150, 80); SPOT.push([-2100, -1300, 180]);
  for (const [x, y] of [[-900, 300], [1100, 600], [-1800, -2400], [1300, -2500], [2600, 1100]]) { S(gasLamp(), x, y, 0, 0); round(x, y, 17, 262, 0, false); K.lit(x, y, 292, WARM, 380, 0xffd88a); SPOT.push([x, y, 50]); }

  // ---- across the canal: the hop garden in two blocks of rows, the oast and its barn, pockets of hops waiting
  for (const [y0, y1] of [[-2500, -1000], [-600, 900]]) for (const x of [4150, 4450, 4750, 5050]) { const L = y1 - y0, y = (y0 + y1) / 2; S(hopRow(L, Math.round(x + y0)), x, y, 0, 90); SOL(x, y, 40, L, 520); SPOT.push([x, y0, 120], [x, y, 120], [x, y1, 120]); }
  { const [x, y] = BR.oast; S(oast(1), x, y, 0, 0); round(x, y, OAST.r + 4, OAST.e); const sl = (OAST.top - 140 - OAST.e) / (OAST.r - 40); for (let i = 0; i < 4; i++) { const r0 = OAST.r + 34 - i * ((OAST.r + 34 - 50) / 4), z0 = OAST.e - 34 * sl + i * ((OAST.top - 140 - (OAST.e - 34 * sl)) / 4); round(x, y, r0, 60, z0, false); }
    brick(x - 560, y, 460, 640, 330, { doors: [{ y: 0, w: 220, h: 260, side: -1, color: KC.green }], windows: { back: [-200, 200] }, wz: 170, ww: 70, wh: 100 }, 4, 0);
    for (let i = 0; i < 5; i++) { const sx = x + 330 + (i % 3) * 56, sy = y - 300 + Math.floor(i / 3) * 70; S(sack(30, 0xc8c090), sx, sy, -3, rr(0, 360)); round(sx, sy, 33, 76); }
    SPOT.push([x, y, 360], [x + 380, y - 270, 130]); }

  // ---- west of the maltings, the barley in its stacks, bales, a cart; the fields beyond the edge
  for (const [x, y, r, h] of [[-4600, -2300, 200, 340], [-4200, -1100, 220, 360], [-4800, 200, 190, 320], [-4300, 1300, 210, 350]]) { S(haystack(r, h, Math.round(Math.abs(x))), x, y, 0, rr(0, 360)); round(x, y, r * 0.95, h); SPOT.push([x, y, r + 80]); }
  for (const [x, y, yw] of [[-3900, -2500, 10], [-3800, -2400, 80], [-4000, -300, 30], [-3700, 600, 60], [-3760, 520, 150]]) { S(hayBale(Math.round(x)), x, y, 0, yw); SOL(x, y, 94, 58, 44, yw); }
  S(cart(1, 2), -4400, -500, 0, 120); SOL(-4400, -500, 240, 140, 150, 120); SPOT.push([-4400, -500, 180]);

  // ---- the way on: the old road north past the brewhouse; the stations' floor
  { const [x, y] = BR.floor; S(flagFloor(BR.floorR, 9, 0x5a5448, true, [0xa49d90, 0x968e80, 0xb0a898, 0x8a8274]), x, y, 0.4, 0); }

  // ---- the paths
  for (const P of PATHS) path(P, P === ROAD || P === ROAD_N ? 340 : 220, 0x8a7a5a, 0x8a8478);

  // ---- the Rustcap: come up in the fermenting shed, through the maltings' door, onto the wharf, into the hops; its
  // threads out across the yard; its rusty toadstools
  { for (const [x, y, r, sd] of [[-2400, -1880, 220, 4], [2700, 450, 200, 3], [4600, -800, 180, 1]]) { S(blightMass(r, sd, 'rust'), x, y, 0, rr(0, 360)); round(x, y, r * 0.62, r * 0.55); blightAt.push([x, y, r]); Lamp(V(x, y, 100), RUST, 2.2, 600, false); }
    const [hx0, hy0] = BR.heart, veins = [];
    for (const [ex, ey] of [[-2400, -1880], [2700, 450], [-600, -600], [900, 300], [-2300, 2600], [400, 3600], [-1000, -2400]]) { const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([hx0 + (ex - hx0) * t + Math.sin(t * 7 + ex) * 120 * t, hy0 + (ey - hy0) * t + Math.cos(t * 5 + ey) * 120 * t]); } veins.push(pts); }
    M.Shape('brveins', () => { const pos = [], col = [], idx = []; for (const pts of veins) { const n = pts.length; for (let j = 0; j < n - 1; j++) { const [x0, y0] = pts[j], [x1, y1] = pts[j + 1], L = Math.hypot(x1 - x0, y1 - y0), m = Math.max(2, Math.round(L / 40)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
      for (let i = 0; i <= m; i++) { const t = i / m, wv = Math.sin((x0 + i * 40) * 0.011 + j) * 40 + Math.sin((y0 + i * 40) * 0.023) * 16, px = x0 + (x1 - x0) * t + nx * wv, py = y0 + (y1 - y0) * t + ny * wv, w = 9 * (1 - ((j + t) / n) * 0.7); for (const e of [-1, 1]) { pos.push(px + nx * w * e, py + ny * w * e, 3.1); col.push(0.78, 0.46, 0.2); } }
      const b = pos.length / 3 - (m + 1) * 2; for (let i = 0; i < m; i++) { const a = b + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } } } return { pos, col, idx }; }, V(0, 0, 0), R(0, 0, 0));
    for (const pts of veins) for (let j = 2; j < pts.length; j += 2) { const [vx, vy] = pts[j]; if (blightAt.some(([bx, by, br]) => Math.hypot(vx - bx, vy - by) < br + 120) || onPath(vx, vy, 200) || lineDist(vx, vy, YARDWAY) < 220 || keepOff(vx, vy, 60) || !K.clear(vx, vy, 200)) continue;
      const ts = pick([0.8, 1, 1.2]); S(toadstoolCluster(ts, 0xc4782c, pick([1, 2, 3])), vx, vy, 0, rr(0, 360)); round(vx, vy, 22 * ts, 40 * ts); }
    for (const [x, y, r] of blightAt) for (let k = 0; k < 4; k++) { const a = rr(0, Math.PI * 2), d = rr(r * 0.9, r * 2.2), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d; if (inCanal(px, py, 60)) continue; patch(px, py, rr(220, 480), pick([0x7a4a2a, 0x8a5a32, 0x6a3e24])); } }

  // ---- trees round the edges, a few in the cottages' gardens and along the towpath; tufts of grass outside the yard
  const trees = [];
  const treeOK = (x, y, m) => !inCanal(x, y, 300 + m) && !onPath(x, y, 240 + m) && !keepOff(x, y, 140 + m) && !(x > -3400 - m && x < 3200 + m && y > -3050 - m && y < 3700 + m)
    && Math.hypot(x - BR.floor[0], y - BR.floor[1]) > BR.floorR + 260 + m && Math.hypot(x - BR.spawn[0], y - BR.spawn[1]) > 760 + m && !(x > 3950 - m && x < 5300 + m && y > -2700 - m && y < 1100 + m) && Math.abs(x) < hx - 120 && Math.abs(y) < hy - 120;
  for (let gx = -hx + 260; gx < hx - 200; gx += 560) for (let gy = -hy + 260; gy < hy - 200; gy += 560) {
    const x = gx + rr(-170, 170), y = gy + rr(-170, 170), edge = Math.min(hx - Math.abs(x), hy - Math.abs(y)) < 900;
    if (!edge && rnd() > 0.1) continue; if (edge && rnd() > 0.42) continue; if (!treeOK(x, y, 60)) continue;
    const h = pick([1000, 1200, 1400]), sd = Math.abs(Math.round(x * 7 + y)) % 6; trees.push({ x, y, half: oakTrunk(h), circle: true, place: () => { S(oak(h, sd), x, y, 0, rr(0, 360)); trunk(x, y, oakTrunk(h), h * 0.5); } }); }
  for (const p of K.plan(trees, BR.spawn)) p.place();
  { const nav = O.GM, [cx, cy] = [O.cx, O.cy], ok = (x, y) => { const [ix, iy] = nav.cellOf(cx + x, cy + y); return nav.navFree(ix, iy) && K.clear(x, y, 40); };
    let n = 0; for (let k = 0; k < 3000 && n < 240; k++) { const x = rr(-hx + 150, hx - 150), y = rr(-hy + 150, hy - 150); if (!ok(x, y) || onPath(x, y, 200) || inCanal(x, y, 150) || (x > -3300 && x < 3150 && y > -2950 && y < 2600) || Math.hypot(x - BR.floor[0], y - BR.floor[1]) < BR.floorR + 60 || keepOff(x, y, 30)) continue;
      S(grassTuft(pick([28, 32, 36]), pick([1, 2, 3, 4])), x, y, 0, rr(0, 360)); n++; } }

  // ---- beyond the edge (out of reach): the barley fields west, hop gardens and woods, the town's chimneys to the south
  for (let i = 0; i < 90; i++) { const side = i % 4, u = rr(-1, 1), d = rr(500, 3600), x = side < 2 ? (side ? 1 : -1) * (hx + d) : u * (hx + 3000), y = side < 2 ? u * (hy + 3000) : (side === 2 ? 1 : -1) * (hy + d); if (Math.abs(x) < 500 && Math.abs(y) > hy) continue; if (Math.abs(x - CX) < 500 && Math.abs(y) > hy) continue;
    S(farTree(pick([1200, 1500, 1800]), i % 5 === 0 ? 1 : 0, pick([0x3e5a2a, 0x46622e, 0x365224]), pick([1, 2])), x, y, 0, rr(0, 360)); }
  S(wheatField(4400, 5200, 0xd8b45e, 1), -8600, -600, 0, 0); S(wheatField(4000, 3600, 0xc8a856, 2), -8400, 4600, 0, 0); S(wheatField(4600, 3400, 0xd2ae5a, 3), -8000, -5200, 0, 0);
  path([[0, -6100], [0, -9000], [-200, -12000]], 340, 0x8a7a5a); path([[0, 6100], [80, 8600], [-160, 11000]], 340, 0x8a7a5a);
  band([[CX, 6200], [CX + 100, 12000]], BR.canalW, 1.05, () => 0x4e6470, 0); band([[CX, -6200], [CX - 100, -12000]], BR.canalW, 1.05, () => 0x4e6470, 0);
  for (const [x, y, rx, ry, h] of [[-14000, 0, 5000, 9000, 1800], [14500, 1500, 5500, 9000, 2000], [0, 14500, 9000, 4000, 2200], [-9000, -14500, 6000, 4000, 1600]]) S(hill(rx, ry, h, 0x5e7a3c), x, y, -40, 0);
  for (const [x, y, h] of [[-2500, -13500, 2600], [1800, -14500, 3000], [5200, -13000, 2400]]) { S(stack(h, 110), x, y, 0, 0); }

  // where the Rustcap's pools come up: in the yard, by the wharf, in the hops, by the barley, behind the brewhouse
  const settle = ([x, y]) => { for (let r = 0; r <= 1600; r += 100) { const n = Math.max(1, Math.round(r / 50)); for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (Math.abs(px) < hx - 500 && Math.abs(py) < hy - 500 && K.clear(px, py, 430) && !inCanal(px, py, 300) && Math.hypot(px - BR.floor[0], py - BR.floor[1]) > BR.floorR + 400) return [Math.round(px), Math.round(py)]; } } return [x, y]; };
  const beds = [[-800, -800], [1000, -1200], [4600, 1600], [-4200, -1800], [-1200, 3600], [2400, -4600]].map(settle);
  return {
    spots: { spawn: BR.spawn, yaw: Math.PI, exit: [0, 5450], textYaw: -90, ammo: [650, -5300], ammoYaw: 90,
      bench: [-660, 5130], benchYaw: 0, box: [660, 4900], chest: [660, 4900], chestYaw: 180, press: [-660, 4630], pressYaw: 0 },
    keep: [[BR.floor[0], BR.floor[1], 900]],
    hangs, beds, bossAt: null,
  };
}

// ---- the air at the Brewery: smoke off the chimney and steam off the coppers' pipes drifting east, malt dust by the
// maltings, rust spores off the heart
export function brewAir(g, dt, A) {
  const c = g.camera.position, [cx, cy] = A.c; if (Math.abs(c.x - cx) > A.hx + 600 || Math.abs(c.z - cy) > A.hy + 600) return;
  const st = (brewAir.st ||= { s: 0, v: 0, m: 0, r: 0 });
  st.s += dt * 3; while (st.s > 1) { st.s -= 1; const x = cx + BR.chimney[0], z = cy + BR.chimney[1];
    g.fx.add({ pos: new THREE.Vector3(x + (Math.random() - 0.5) * 60, 1840, z + (Math.random() - 0.5) * 60), vel: new THREE.Vector3(40 + Math.random() * 30, 50 + Math.random() * 30, (Math.random() - 0.5) * 20), life: 9, size0: 120, size1: 420, c0: [0.46, 0.44, 0.42, 0.42], c1: [0.6, 0.58, 0.56, 0], fadeIn: 0.6, fadeOut: 4, tex: 'FX_Disc', kind: 'fx', glow: 0 }); }
  st.v += dt * 2.5; while (st.v > 1) { st.v -= 1; const dx = Math.random() < 0.5 ? -250 : 250, x = cx + BR.cshed[0] + dx, z = cy + BR.cshed[1] + 50;
    g.fx.add({ pos: new THREE.Vector3(x, 1010, z), vel: new THREE.Vector3(24 + Math.random() * 20, 70 + Math.random() * 30, (Math.random() - 0.5) * 16), life: 5, size0: 60, size1: 240, c0: [0.96, 0.96, 0.95, 0.34], c1: [0.96, 0.96, 0.95, 0], fadeIn: 0.4, fadeOut: 2.5, tex: 'FX_Disc', kind: 'fx', glow: 0 }); }
  const mx = cx + BR.maltings[0] + 320, mz = cy + BR.maltings[1]; if (Math.hypot(c.x - mx, c.z - mz) < 3000) { st.m += dt * 5; while (st.m > 1) { st.m -= 1;
    g.fx.add({ pos: new THREE.Vector3(mx + Math.random() * 200, 30 + Math.random() * 240, mz + (Math.random() - 0.5) * 1800), vel: new THREE.Vector3(10 + Math.random() * 14, 4 + Math.random() * 6, (Math.random() - 0.5) * 10), life: 5, size0: 4, size1: 6, c0: [1, 0.94, 0.78, 0.7], fadeIn: 0.6, fadeOut: 1.2, tex: 'FX_Disc', kind: 'fx', glow: 0.1 }); } }
  const hx0 = cx + BR.heart[0], hz0 = cy + BR.heart[1]; if (Math.hypot(c.x - hx0, c.z - hz0) < 3000) { st.r += dt * 4; while (st.r > 1) { st.r -= 1; const a = Math.random() * 6.28, r = 150 + Math.random() * 600;
    g.fx.add({ pos: new THREE.Vector3(hx0 + Math.cos(a) * r, 30 + Math.random() * 200, hz0 + Math.sin(a) * r), vel: new THREE.Vector3((Math.random() - 0.5) * 30, 10 + Math.random() * 20, (Math.random() - 0.5) * 30), life: 5, size0: 6, size1: 4, c0: [1, 0.66, 0.24, 0.9], c1: [1, 0.5, 0.16, 0], fadeIn: 0.8, fadeOut: 1.6, tex: 'FX_Disc', kind: 'fx', glow: 0.8 }); } }
}
