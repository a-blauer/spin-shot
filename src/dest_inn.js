// The Crossroads Inn, in the Vale: the coaching inn where the Vale's two roads cross, the Thimblewick road south to
// north and the old drove road west to east. You come up the Thimblewick road from the south between its hedges, past
// the coach that never came in (it went through the hedge and over on its side; the luggage is still in the grass);
// the farrier's and the wheelwright's on the right before the crossroads, the tollhouse and its gate down the west
// road. At the crossing the finger post; on the north-east corner the Four Ways itself: stone below, timbered above,
// its sign out over the road, the taproom at the corner (its doors stand open: the fire is still in), the carriage way
// through its middle to the stable yard behind (the stables with their split doors, the coach house with the mail
// coach in it). The Blight came up through the inn's cellar: its heart has burst the cellar flaps in the yard, the
// Toadstool is up through the roof tiles, and its threads run out under the carriage way to the crossroads and down
// all four roads. North of the inn the beer garden (the old oak with its ring bench, the skittle alley); north-west the
// green round the duck pond, its cottages and the pound; south-west the stubble with its stooks; south-east the
// orchard. The way on: the Wildwood road north, past the coaching halt where the stations come up. The drove road is
// shut both ways: an elm down across it in the west, the carters' barricade in the east.
//
// Local frame (dest.js): +Y north, +X east, z up; the ground is flat at z = 0. Playable: x in [-5400, 5400],
// y in [-5800, 5800]. The pond is shallow: anything can wade it; its edge is only a step.
import * as THREE from 'three';
import { V, R } from './mapkit.js';
import { destKit } from './dest_kit.js';
import { blightMass, hedgeLump, haystack, scarecrow, appleTree, cartShed, farTree, handPump, raisedBed, duckHouse, stoneWall, gatePost, gateLeaf } from './dest_props.js';
import { oak, oakTrunk, flagFloor, fallenOak, rainBarrel } from './dest_props_wood.js';
import { pollardWillow } from './dest_props_fen.js';
import { shroomHouse, thatchCottage, toadstoolCluster, grassTuft, cabbage, pumpkin, VC } from './village_shapes.js';
import { cart, crate, sack, woodpile, washLine, trough, anvil, flowerClump, reeds, lilies, planter } from './village_props.js';
import { ruinWall, wallBodies } from './dest_props_abbey.js';
import { MB, SMITHY, smithy, stook } from './dest_props_mill.js';
import { barrel } from './dest_props_vale.js';
import { IN, inn, innTop, BAR, barCounter, settle, TB, pubTable, picnicTable, ringBench, SIGN, innSign, ST, stableBlock, CH, coachHouse, CO, stagecoach, luggage, cartWheel, tyringPlatform, milestone, FP, fingerpost4, mountingBlock, cellarFlaps, hurdle, bale, muckHeap, SK, skittleAlley, TH, tollhouse } from './dest_props_inn.js';

export const IX = { spawn: [0, -5300], floor: [0, 4900], floorR: 820, cross: [0, -300], inn: [940, 1500], heart: [2150, 1580], pond: [-2700, 1700], pondR: [950, 620], toll: [-2400, -760], smithy: [950, -1500], wreck: [780, -3500], oak: [1050, 3330], stable: [2320, 2560], coach: [3150, 1450] };
// the roads: the Thimblewick road south to north through the crossing, the drove road west to east
const ROAD_NS = [[0, -5850], [60, -4200], [-20, -2400], [0, -300], [30, 1200], [-40, 3200], [0, 4300], [0, 5850]];
const ROAD_EW = [[-5850, -260], [-3800, -340], [-2000, -250], [0, -300], [1800, -360], [3600, -240], [5850, -300]];
// the pond's shore (radius out from its middle each way)
const pondK = (a) => 1 + 0.08 * Math.sin(a * 3 + 2) + 0.05 * Math.sin(a * 5 + 1);
const pondAt = (a) => [IX.pond[0] + Math.cos(a) * IX.pondR[0] * pondK(a), IX.pond[1] + Math.sin(a) * IX.pondR[1] * pondK(a)];
const inPond = (x, y, m = 0) => { const dx = x - IX.pond[0], dy = y - IX.pond[1], a = Math.atan2(dy / IX.pondR[1], dx / IX.pondR[0]), k = pondK(a); return Math.hypot(dx / (IX.pondR[0] * k + m), dy / (IX.pondR[1] * k + m)) < 1; };
// where things stand (x0, x1, y0, y1): kept clear of trees, hedges and the scatter
const BLD = [[250, 1500, 50, 2900], [1300, 3480, 280, 2800], [250, 3400, 2880, 4060], [-4700, -3700, 2300, 3100], [-3100, -2300, 3000, 3800], [-1700, -900, 2800, 3600], [-4700, -3900, 600, 1400],
  [-1700, -900, 250, 950], [-2800, -2000, -1200, -380], [600, 1300, -1800, -1200], [1300, 2100, -1400, -900], [1900, 2900, -2200, -1600], [1500, 2300, -3000, -2400], [250, 800, -3800, -3150], [-950, 950, 4050, 5750]];

export function buildInn(M, O) {
  const { hx, hy } = O;
  const K = destKit(M, 91, O, { exactNav: true }), { S, body, round, trunk, patch, path, band, rnd, rr, lineDist, Box, Lamp, Glow } = K;
  const pick = (L) => L[Math.floor(rnd() * L.length)];
  const SOL = (x, y, w, d, h, yaw = 0, nav = true) => body(x, y, w, d, h, yaw, 0, nav);
  const D2R = Math.PI / 180, TOAD = { r: 0.8, g: 1, b: 0.35 }, TOAD_GLOW = 0xc4ff58, FIRE = { r: 1, g: 0.62, b: 0.3 };
  const at = (x, y, yaw, u, v) => [x + u * Math.cos(yaw * D2R) - v * Math.sin(yaw * D2R), y + u * Math.sin(yaw * D2R) + v * Math.cos(yaw * D2R)];
  const navBand = (x, y, w, d) => O.GM.NavBlockBox({ min: V(x - w / 2, y - d / 2, 0), max: V(x + w / 2, y + d / 2, 100) }, 1);
  const roofBody = (x, y, yaw, hl, hw, ze, zr) => { for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const v0 = hw * (1 - i / 4), v1 = hw * (1 - (i + 1) / 4), z0 = ze + (zr - ze) * (i / 4), z1 = ze + (zr - ze) * ((i + 1) / 4), [px, py] = at(x, y, yaw, 0, sd * (v0 + v1) / 2); body(px, py, hl * 2, v0 - v1, z1 - z0 + 14, yaw, z0 - 6); } };
  const wall = (x0, y0, x1, y1, o) => { const len = Math.round(Math.hypot(x1 - x0, y1 - y0)), yaw = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI, mx = (x0 + x1) / 2, my = (y0 + y1) / 2, P = { ruin: 0, ...o, len }, B = wallBodies(P); S(ruinWall(P), mx, my, 0, yaw);
    for (const [s0, s1, z0, z1] of B.runs) { const [px, py] = at(mx, my, yaw, (s0 + s1) / 2, 0); body(px, py, s1 - s0, P.t || 70, z1 - z0, yaw, z0); }
    for (const [s0, s1, y0, y1, z0, z1] of B.butt) { const [px, py] = at(mx, my, yaw, (s0 + s1) / 2, (y0 + y1) / 2); body(px, py, s1 - s0, Math.abs(y1 - y0), z1 - z0, yaw, z0); } };
  const cottage = (x, y, yaw, w, d, h, wall2, sd) => { S(thatchCottage(w, d, h, wall2, sd), x, y, 0, yaw); SOL(x, y, w + 40, d + 40, h + 160, yaw); };
  const shroom = (x, y, yaw, h, r, cap, sd) => { S(shroomHouse(h, r, cap, sd % 2 ? VC.cream2 : VC.cream, sd), x, y, 0, yaw); round(x, y, r * 1.12, h); round(x, y, r * 1.98, r * 1.08, h - 42); };
  const SPOT = [];
  const nearRoad = (x, y, m) => lineDist(x, y, ROAD_NS) < m || lineDist(x, y, ROAD_EW) < m;
  const inBld = (x, y, m = 0) => BLD.some(([a, b, c, d]) => x > a - m && x < b + m && y > c - m && y < d + m);

  // ---- the ground: meadow grass, worn round the inn and the yard, stubble to the south-west, the green by the pond
  Box(V(0, 0, -60), V(hx * 2 + 24000, hy * 2 + 24000, 120), 0x6a8f42, true, false);
  for (let i = 0; i < 46; i++) { const x = rr(-hx + 300, hx - 300), y = rr(-hy + 300, hy - 300); if (inPond(x, y, 200)) continue; patch(x, y, rr(500, 1200), pick([0x729a46, 0x66903e, 0x7aa24c, 0x6e9440])); }
  patch(-2400, 1900, 3600, 0x82ae52); patch(-2300, 2000, 2600, 0x88b456);
  // the stubble field south-west of the crossing: a band of rows (the drills the reaper left), its edges ragged
  band([[-5050, -3350], [-1000, -3350]], 3500, 1.9, (i, j) => (j === 0 || j === 4 ? 0xa89a5e : (i + j) % 2 ? 0xc4ae6a : 0xb8a466), 0.05);
  patch(1900, 1600, 3000, 0x8a7e5a); patch(1700, 3450, 2600, 0x7a9a4c); patch(3800, -3900, 2800, 0x66903e);

  // ---- the roads: worn earth, two tones; the crossing worn wide; the inn's forecourt and its yard cobbled
  path(ROAD_NS, 440, 0x9a7c52, 0x8a8478); path(ROAD_EW, 400, 0x9a7c52, 0x8a8478);
  patch(0, -300, 1000, 0x9a7e56); patch(40, -320, 760, 0xa08458);
  K.settRoad([[405, 60], [405, 2900]], 310, 2.4, { kerbW: 0 });
  K.settRoad([[2080, 300], [2080, 2330]], 1520, 2.4, { kerbW: 0 });
  K.settRoad([[540, 1500], [1360, 1500]], 470, 2.6, { kerbW: 0 });

  // ---- the pond on the green: muddy shore, the water, reeds round it, lilies, the duck house on its island post,
  // pollard willows on the bank
  M.Shape('inpond', () => { const pos = [], col = [], idx = [], n = 64; const ring = (m, z, c) => { const b = pos.length / 3, C = new THREE.Color(c); for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, [px, py] = pondAt(a), dx = px - IX.pond[0], dy = py - IX.pond[1], L = Math.hypot(dx, dy); pos.push(px + (dx / L) * m, py + (dy / L) * m, z); col.push(C.r, C.g, C.b); } return b; };
    const b0 = ring(120, 1.0, 0x5a5038), b1 = ring(0, 1.15, 0x5a6a48), b2 = ring(-160, 1.5, 0x3e6e7a), b3 = ring(-600, 1.5, 0x356474), c0 = pos.length / 3; pos.push(IX.pond[0], IX.pond[1], 1.5); col.push(0.19, 0.37, 0.43);
    for (const [a, b] of [[b0, b1], [b1, b2], [b2, b3]]) for (let i = 0; i < n; i++) { const j = (i + 1) % n; idx.push(a + i, a + j, b + i, a + j, b + j, b + i); }
    for (let i = 0; i < n; i++) idx.push(b3 + i, b3 + ((i + 1) % n), c0); return { pos, col, idx }; }, V(0, 0, 0), R(0, 0, 0));
  for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2 + rr(-0.1, 0.1); if (Math.cos(a) > 0.75) continue; const [px, py] = pondAt(a), dx = px - IX.pond[0], dy = py - IX.pond[1], L = Math.hypot(dx, dy), x = px - (dx / L) * rr(40, 110), y = py - (dy / L) * rr(40, 110), h = pick([120, 150]); S(reeds(h, pick([1, 2, 3])), x, y, 0, rr(0, 360)); round(x, y, 62, h * 0.9, 0, false); navBand(x, y, 124, 124); }
  S(lilies(160, 3), IX.pond[0] - 300, IX.pond[1] + 150, 2.4, 20); S(lilies(130, 4), IX.pond[0] + 250, IX.pond[1] - 200, 2.4, 140); S(lilies(110, 5), IX.pond[0] - 100, IX.pond[1] - 280, 2.4, 260);
  { const [dx, dy] = [IX.pond[0] + 160, IX.pond[1] + 60]; S(duckHouse(), dx, dy, 0, 200); body(dx, dy, 250, 135, 140, 200, 0, false); }
  for (const a of [0.9, 2.2, 3.6, 4.9]) { const [px, py] = pondAt(a), dx = px - IX.pond[0], dy = py - IX.pond[1], L = Math.hypot(dx, dy), x = px + (dx / L) * 150, y = py + (dy / L) * 150, h = pick([300, 340]); S(pollardWillow(h, Math.round(x)), x, y, 0, rr(0, 360)); trunk(x, y, 40, h); SPOT.push([x, y, 200]); }

  // ---- the inn: its ground floor and its upper floor and roof; the bodies of its walls (the taproom open behind its
  // doors, the carriage way through), its sign, its name, its lamps, the taproom's fire
  const [ix, iy] = IX.inn, IY = -90, IL = (u, v) => [ix + v, iy - u];
  const IB = (u0, u1, v0, v1, h, z0 = 0, nav = true) => { const [x0, y0] = IL(u0, v0), [x1, y1] = IL(u1, v1); body((x0 + x1) / 2, (y0 + y1) / 2, Math.abs(x1 - x0), Math.abs(y1 - y0), h, 0, z0, nav); };
  S(inn(1), ix, iy, 0, IY); S(innTop(1), ix, iy, 0, IY);
  { const { g, e, r, jet, pass, passH, door, bay, back, side } = IN;
    IB(-1300, -240, -380, 380, g); IB(-1300, -240, -380 - jet, 380, e - g, g, false);
    IB(pass, pass + 40, -380, side[0], g); IB(pass, pass + 40, side[1], 380, g);
    IB(-pass, pass, -380 - jet, 380, e - passH, passH, false);
    IB(pass + 40, door[0], -380, -340, g); IB(door[1], bay[0], -380, -340, g); IB(bay[1], 1300, -380, -340, g); IB(bay[0], bay[1], -380 - bay[4], -340, bay[3] + 50);
    IB(pass + 40, back[0], 340, 380, g); IB(back[1], 1300, 340, 380, g); IB(1260, 1300, -340, 340, g);
    IB(pass, 1300, -380 - jet, 380, e - g, g, false);
    IB(1300, 1300 + IN.stack[0], -IN.stack[1], IN.stack[1], r + 150);
    IB(IN.fire[0], IN.fire[1], IN.fire[2], IN.fire[3], g);
    for (const u of [door[0] + 2, door[1] - 2]) IB(u - 4, u + 4, -380 - (door[1] - door[0]) / 2 - 4, -380, door[2]);
    for (const u of [back[0] + 2, back[1] - 2]) IB(u - 4, u + 4, 380, 380 + (back[1] - back[0]) / 2 + 4, back[2]);
    roofBody(ix - jet / 2, iy, IY, 1340, 445, e - 60, r); }
  for (const [u, v, z] of IN.lamps.slice(0, 4)) { const [x, y] = IL(u, v); Lamp(V(x, y, z), { r: 1, g: 0.8, b: 0.5 }, 2, 520, false); Glow(V(x, y, z), V(14, 14, 18), 0xffd27a, 2); }
  { const [u, v, z] = IN.lamps[4], [x, y] = IL(u, v); Lamp(V(x, y, z + 40), FIRE, 2.4, 700, false); Glow(V(x, y, z - 10), V(30, 60, 24), 0xff9a40, 2); }
  { const [x, y] = IL(IN.board[0], IN.board[1]); M.Sign(V(x - 3, y, IN.board[2] - 8), 180, 'THE FOUR WAYS', { r: 0.86, g: 0.72, b: 0.36 }, 36); }
  // the sign on its post at the corner, out over the road; its name both sides
  { const sx = 380, sy = 250; S(innSign(), sx, sy, 0, 180); round(sx, sy, 22, SIGN.post); navBand(sx, sy, 40, 40);
    for (const s of [-1, 1]) M.Sign(V(sx - SIGN.x, sy + s * 3.8, SIGN.z + 42), s * 90, 'THE FOUR WAYS', { r: 0.86, g: 0.72, b: 0.36 }, 17); }
  // the taproom: the bar along the wall to the carriage way, the settles either side of the fire, the tables
  { const [x, y] = IL(380, -50), L = 300; S(barCounter(L, 1), x, y, 0, IY + 90); body(x, y - BAR.d / 2 + 35, L, 70, BAR.h + 6); body(x, y + BAR.d / 2 - 25, L, 50, 232); }
  for (const s of [-1, 1]) { const [x, y] = IL(1050, s * 250); S(settle(220), x, y, 0, IY + (s > 0 ? 0 : 180)); body(x, y, 52, 220, 150); }
  for (const [u, v, sd, yw] of [[680, -130, 1, 10], [770, 190, 2, 40]]) { const [x, y] = IL(u, v); S(pubTable(0, sd), x, y, 0, yw); round(x, y, TB.r - 10, 80); }
  for (const [u, v, sd] of [[1200, 300, 1], [1235, 262, 2]]) { const [x, y] = IL(u, v); S(barrel(sd), x, y, 0, rr(0, 360)); round(x, y, 34, 90); }

  // ---- the forecourt: tables out front under the bay, casks by the door, the horse trough and its pump, the mounting
  // block, flowers in tubs either side of the carriage way
  S(picnicTable(1), 360, 470, 0, 90); body(360, 470, 210, 212, 80, 90);
  for (const [x, y, sd] of [[470, 1080, 1], [520, 1110, 2], [480, 1150, 3]]) { S(barrel(sd), x, y, 0, rr(0, 360)); round(x, y, 34, 90); }
  S(trough(220), 430, 2330, 0, 90); SOL(430, 2330, 70, 230, 60); S(handPump(), 480, 2470, 0, 180); round(480, 2470, 36, 200); navBand(480, 2470, 60, 60);
  S(mountingBlock(), 470, 1880, 0, -90); SOL(470, 1880, 120, 112, 92);
  for (const [x, y, c] of [[505, 1210, 0xd84a5a], [505, 1790, 0xf0c040], [505, 2780, 0xe8e0f0]]) { S(planter(44, c, Math.round(y)), x, y, 0, 0); round(x, y, 46, 80); }

  // ---- the stable yard: the stables along its north side, the coach house on its east with the mail coach in it and a
  // cart, the wall round the rest with its back gate to the drove road; the pump and trough, the muck heap, bales,
  // hurdles, barrels by the inn's back door
  { const [sx, sy] = IX.stable, L = 6 * ST.stall + 60; S(stableBlock(6, 1), sx, sy, 0, 0); SOL(sx, sy, L, ST.d, ST.e); roofBody(sx, sy, 0, L / 2 + 30, ST.d / 2 + 40, ST.e - 40, ST.r);
    body(sx, sy - ST.d / 2 - 20, 260, 40, 160, 0, ST.e, false); body(sx, sy + 40, 120, 120, 240, 0, ST.r - 20, false);
    for (let i = 0; i < 6; i++) { const x = sx - L / 2 + 30 + ST.stall * (i + 0.5) - 122; body(x, sy - ST.d / 2 - 4, 118, 8, 92, 0, 124, false); } }
  { const [cx, cy] = IX.coach, n = 2, L = n * CH.bay + 60, hl = L / 2, hd = CH.d / 2; S(coachHouse(n, 1), cx, cy, 0, -90);
    const P = (u, v) => at(cx, cy, -90, u, v);
    { const [x, y] = P(0, hd - 15); body(x, y, 30, L, CH.e); } for (const s of [-1, 1]) { const [x, y] = P(s * (hl - 15), 0); body(x, y, CH.d - 20, 30, CH.e); }
    for (let i = 0; i <= n; i++) { const [x, y] = P(-hl + 30 + i * CH.bay, -hd + 14); round(x, y, 22, CH.e); }
    roofBody(cx, cy, -90, hl + 30, hd + 40, CH.e - 40, CH.r);
    { const [x, y] = P(-hl + 30 + CH.bay / 2, 40); S(stagecoach(0, 1), x, y, 0, 180); body(x - 25, y, 350, 240, 300); body(x - 256, y, 252, 30, 60, 0, 0, false); navBand(x - 256, y, 252, 40); }
    { const [x, y] = P(hl - 30 - CH.bay / 2, 40); S(cart(1, 2), x, y, 0, 180); body(x - 52, y, 276, 136, 150, 0); } }
  wall(1330, 330, 2620, 330, { h: 170, t: 60, cope: true, seed: 5 }); wall(3000, 330, 3460, 330, { h: 170, t: 60, cope: true, seed: 6 }); wall(3460, 330, 3460, 990, { h: 170, t: 60, cope: true, seed: 7 });
  for (const x of [2620, 3000]) { S(gatePost(170), x, 330, 0, 0); round(x, 330, 15, 176); }
  for (const [x, yw] of [[2634, 0], [2986, 0]]) { S(gateLeaf(174, 130), x, 346, -3, yw); body(x, 346 + 87, 14, 174, 140); }
  S(trough(200), 1640, 880, 0, 0); SOL(1640, 880, 210, 70, 60); S(handPump(), 1640, 960, 0, 90); round(1640, 960, 36, 200); navBand(1640, 960, 60, 60);
  S(muckHeap(150, 1), 1560, 2160, 0, 30); round(1560, 2160, 130, 70);
  for (const [x, y, z, yw, sd] of [[2700, 2200, 0, 0, 1], [2790, 2210, 0, 5, 2], [2745, 2205, 44, 90, 1]]) { S(bale(sd), x, y, z, yw); }
  body(2745, 2205, 200, 80, 90);
  for (const [x, y, yw] of [[1460, 520, 15], [1500, 700, -10]]) { S(hurdle(240, Math.round(y)), x, y, 0, yw + 90); body(x, y, 20, 240, 126, yw); }
  for (const [x, y, sd] of [[1400, 1190, 1], [1440, 1240, 2]]) { S(barrel(sd), x, y, 0, rr(0, 360)); round(x, y, 34, 90); }
  S(cart(0, 3), 2600, 760, 0, 30); body(2600, 760, 250, 150, 150, 30);

  // ---- the Blight came up through the cellar: the flaps burst in the yard, its heart heaving up beside them; out of
  // the roof's tiles its caps; its masses about the place
  const blightAt = [];
  { const [x, y] = IX.heart; S(blightMass(430, 4, 'toad'), x, y, 0, 20); round(x, y, 430 * 0.62, 430 * 0.55); blightAt.push([x, y, 430]); Lamp(V(x + 60, y - 40, 170), TOAD, 2.2, 1100, false); Glow(V(x, y, 120), V(22, 22, 26), TOAD_GLOW, 2);
    S(cellarFlaps(), x - 420, y - 180, 0, 20); { const [fx, fy] = at(x - 420, y - 180, 20, -100, 0); body(fx, fy, 34, 150, 104, 20); } SPOT.push([x - 420, y - 180, 160]); }
  for (const [ex, ey, r, sd] of [[-2000, 980, 220, 1], [1350, -2050, 200, 2], [2050, 3380, 220, 3], [-2950, -1350, 200, 5], [3800, -3800, 220, 6], [880, -3950, 170, 7], [-4000, 4300, 200, 8]]) {
    if (inBld(ex, ey, 100) && ex !== 2050) continue; S(blightMass(r, sd, 'toad'), ex, ey, 0, rr(0, 360)); round(ex, ey, r * 0.62, r * 0.55); blightAt.push([ex, ey, r]); Lamp(V(ex, ey, 100), TOAD, 2.2, 600, false); SPOT.push([ex, ey, r]); }
  // caps up through the tiles of the inn's roof and the stables'
  { const s2 = (IN.r - IN.e) / (IN.D / 2 + IN.jet / 2); for (const [u, v, sc] of [[-900, 160, 1.3], [-620, 230, 1.1], [-1080, -200, 1.2], [700, 190, 1.0]]) { const [x, y] = IL(u, v), z = IN.r - s2 * Math.abs(v + IN.jet / 2) - 46 * sc; S(toadstoolCluster(sc, 0xc8392e, Math.round(Math.abs(u)) % 3 + 1), x, y, z, rr(0, 360)); } }
  { const [sx, sy] = IX.stable, s2 = (ST.r - ST.e) / (ST.d / 2); for (const [dx, dv, sc] of [[-600, 120, 1.1], [450, -110, 1.0]]) S(toadstoolCluster(sc, 0xc8392e, 2), sx + dx, sy + dv, ST.r - s2 * Math.abs(dv) - 44 * sc, rr(0, 360)); }

  // ---- the beer garden north of the inn: the old oak and the bench round it, the tables, the skittle alley along its
  // north side, casks by it; a fence along the road
  { const [ox, oy] = IX.oak, h = 1500, tr = oakTrunk(h); S(oak(h, 3), ox, oy, 0, 40); trunk(ox, oy, tr, 700); S(ringBench(Math.round(tr + 14)), ox, oy, 0, 10); round(ox, oy, tr + 14 + 50, 50); SPOT.push([ox, oy, 300]); }
  for (const [x, y, yw, sd] of [[620, 3060, 90, 1], [620, 3620, 90, 2], [1650, 3080, 0, 1], [2250, 3080, 0, 2], [2850, 3100, 0, 1], [1500, 3560, 20, 2]]) { S(picnicTable(sd), x, y, 0, yw); body(x, y, 210, 212, 80, yw); }
  S(skittleAlley(1600), 2400, 3820, 0, 0);
  { const n = Math.round(1600 / 320); for (let i = 0; i <= n; i++) for (const sy of [-1, 1]) round(1600 + (1600 * i) / n, 3820 + sy * (SK.w / 2 - 10), 16, SK.e); body(2400 + 800 - 120, 3820, 150, 150, 46); body(3184, 3820, 14, SK.w - 40, 130); body(1640, 3900, 70, 50, 48); }
  for (const [x, y, sd] of [[3320, 3700, 1], [3330, 3780, 2], [3340, 3860, 3]]) { S(barrel(sd), x, y, 0, rr(0, 360)); round(x, y, 34, 90); }

  // ---- the coaching halt at the north end: the stations' floor; the milestone; a trough
  { const [x, y] = IX.floor; S(flagFloor(IX.floorR, 9, 0x5a5440, true, [0xa49d90, 0x968e80, 0xb0a898, 0x8a8274]), x, y, 0.4, 0); }
  S(milestone(), 330, 4150, 0, -90); SOL(330, 4150, 40, 64, 120); M.Sign(V(311, 4150, 72), 180, 'THIMBLEWICK 4', { r: 0.18, g: 0.17, b: 0.16 }, 8);
  S(trough(220), -620, 4250, 0, 0); SOL(-620, 4250, 230, 70, 60);

  // ---- the crossroads: the finger post on its south-west corner, an arm to each road
  { const fx = -330, fy = -640; S(fingerpost4(), fx, fy, 0, 0); round(fx, fy, 18, FP.post); navBand(fx, fy, 40, 40);
    const names = { 0: 'MILLBROOK', 90: 'THE WILDWOOD', 180: 'BRAMBLE FARM', 270: 'THIMBLEWICK' };
    for (const [a, z] of FP.arms) { const d = FP.reach / 2 + 2, c = Math.cos(a * D2R), s = Math.sin(a * D2R); for (const sd of [-1, 1]) { const nx = -s * sd, ny = c * sd; M.Sign(V(fx + c * d + nx * 2.9, fy + s * d + ny * 2.9, z), a + sd * 90, names[a], { r: 0.16, g: 0.16, b: 0.18 }, 10); } } }

  // ---- the green round the pond: its cottages (thatched and mushroom), their gardens; the pump; the pound
  cottage(-4200, 2700, 0, 620, 460, 310, VC.cream, 1);
  cottage(-2700, 3400, -90, 600, 440, 300, VC.cream2, 2);
  shroom(-1300, 3200, 180, 460, 270, VC.red, 3);
  cottage(-4300, 1000, 30, 560, 440, 300, 0xe8dcc0, 4);
  const garden = (x, y, yaw, sd) => { const P = (u, v) => at(x, y, yaw, u, v);
    { const [gx, gy] = P(-560, 0); patch(gx, gy, 520, 0x5a4a34); for (let i = 0; i < 6; i++) { const [cx, cy] = P(-680 + (i % 3) * 120, -90 + Math.floor(i / 3) * 180); if (i % 2) { S(cabbage(26), cx, cy, 0, rr(0, 360)); round(cx, cy, 26, 40); } else { S(pumpkin(34), cx, cy, 0, rr(0, 360)); round(cx, cy, 34, 50); } } }
    { const sy = sd % 2 ? 1 : -1, [fx, fy] = P(340, sy * 200); S(flowerClump(40, sd % 2 ? 0xf08aa8 : 0xf6c43a, 0xffffff, sd), fx, fy, 0, rr(0, 360)); }
    if (sd % 2) { const [wx, wy] = P(-120, 330); S(woodpile(220, 4, sd), wx, wy, 0, yaw); SOL(wx, wy, 230, 70, 110, yaw); } else { const [wx, wy] = P(-380, -320); S(washLine(420, sd), wx, wy, 0, yaw); for (const e of [-1, 1]) { const [px, py] = at(wx, wy, yaw, e * 210, 0); round(px, py, 8, 200); navBand(px, py, 30, 30); } } };
  [[-4200, 2700, 0], [-2700, 3400, -90], [-4300, 1000, 30]].forEach(([x, y, yw], i) => garden(x, y, yw, i + 1));
  S(handPump(), -1500, 1500, 0, 30); round(-1500, 1500, 36, 200); navBand(-1500, 1500, 60, 60); S(trough(160), -1480, 1400, 0, 30); SOL(-1480, 1400, 170, 60, 60, 30);
  { const [px, py] = [-1300, 600], R0 = 330; for (let i = 0; i < 8; i++) { if (i === 6) continue; const a0 = (i / 8) * Math.PI * 2, a1 = ((i + 1) / 8) * Math.PI * 2, x0 = px + Math.cos(a0) * R0, y0 = py + Math.sin(a0) * R0, x1 = px + Math.cos(a1) * R0, y1 = py + Math.sin(a1) * R0, L = Math.hypot(x1 - x0, y1 - y0) + 20, yw = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
    S(stoneWall(L, 120, i % 3 + 1), (x0 + x1) / 2, (y0 + y1) / 2, 0, yw); body((x0 + x1) / 2, (y0 + y1) / 2, L, 60, 126, yw); } SPOT.push([px, py, 420]); }
  { const h = 1600, x = -3600, y = 2150, tr = oakTrunk(h); S(oak(h, 5), x, y, 0, 120); trunk(x, y, tr, 700); SPOT.push([x, y, 260]); }

  // ---- the tollhouse on the drove road west of the crossing, its gate swung back; the keeper's garden behind it
  { const [tx, ty] = IX.toll; S(tollhouse(1), tx, ty, 0, 180); const P = (u, v) => at(tx, ty, 180, u, v);
    { const [x, y] = P(0, TH.d / 2 - 20); body(x, y, TH.w, TH.d - 20, TH.e); } { const [x, y] = P(0, -TH.bay / 2); body(x, y, TH.w - 2 * TH.bay + 60, TH.bay + 10, TH.e); }
    for (const s of [-1, 1]) { const [x, y] = P(s * (TH.w / 2 - TH.bay / 2), -TH.bay / 4); body(x, y, TH.bay, TH.bay / 2, TH.e); }
    roofBody(...P(0, TH.d / 2 - 20), 180, TH.w / 2 + 30, TH.d / 2 + 40, TH.e - 40, TH.r);
    { const [x, y] = P(TH.board[0], -TH.bay - 6.5); M.Sign(V(x, y, TH.board[2] - 4), 90, 'TOLLS', { r: 0.14, g: 0.14, b: 0.16 }, 22); }
    for (const [u, v] of [[-110, 420], [110, 420]]) { const [x, y] = P(u, v); S(raisedBed(360, 140), x, y, 0, 180); SOL(x, y, 370, 150, 40, 180); }
    { const [x, y] = P(330, 300); S(rainBarrel(2), x, y, 0, 0); round(x, y, 34, 110); } { const [x, y] = P(-340, 260); S(woodpile(220, 4, 2), x, y, 0, 90); SOL(x, y, 230, 70, 110, 90); } }
  { const gx = -2150, n = -30, s = -490, W = 220; for (const y of [n, s]) { S(gatePost(170), gx, y, 0, 0); round(gx, y, 15, 176); }
    for (const y of [n - 16, s + 16]) { S(gateLeaf(W, 130), gx + 14, y, -3, -90); body(gx + 14 + W / 2, y, W, 14, 140); } }

  // ---- the farrier's on the Thimblewick road south of the crossing: the forge open to the road, the tyring platform
  // beside it, wheels against its wall, the anvil, the trough; the wheelwright's shed and the smith's cottage
  { const [x, y] = IX.smithy, hw = SMITHY.w / 2, hd = SMITHY.d / 2; S(smithy(2), x, y, 0, 180);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) { round(x + sx * (hw - 10), y + sy * (hd - 10), 14, SMITHY.e); navBand(x + sx * (hw - 10), y + sy * (hd - 10), 40, 40); }
    SOL(x + hw - 80, y, 150, 230, 96); body(x + hw - 80, y, 80, 130, 600, 0, 90); body(x + hw - 80, y - 170, 120, 72, 150, 0); roofBody(x, y, 90, SMITHY.d / 2 + 30, SMITHY.w / 2 + 30, SMITHY.e, SMITHY.r);
    S(anvil(), x - 330, y + 120, 0, 90); SOL(x - 330, y + 120, 90, 60, 90, 90); S(trough(160), x - 300, y - 200, 0, 0); SOL(x - 300, y - 200, 170, 60, 60); }
  S(tyringPlatform(), 1550, -1120, 0, 0); SPOT.push([1550, -1120, 180], [1880, -1120, 280]);
  for (const [x, y, sd] of [[880, -1790, 1], [990, -1795, 2], [1100, -1790, 3]]) { S(cartWheel(70, 12, sd), x, y, 0, 0); body(x, y + 10, 150, 50, 150); }
  { const x = 2400, y = -1900; S(cartShed(900, 420), x, y, 0, 180); SOL(x, y, 920, 440, 360, 180); S(cartWheel(64, 90), 2050, -1500, 0, 0); round(2050, -1500, 70, 24, 0, false);
    S(cart(0, 1), 1950, -1380, 0, 200); body(1950, -1380, 250, 150, 150, 200); }
  cottage(1900, -2700, 90, 560, 440, 300, VC.cream, 6); garden(1900, -2700, 90, 6);

  // ---- the coach that never came in: through the hedge and over on its side on the verge, its luggage in the grass,
  // a wheel off it lying where it rolled
  { const [x, y] = IX.wreck; S(stagecoach(1, 2), x, y, 0, 90); body(x - 150, y + 25, 300, 360, 270, 0);
    for (const [dx, dy, k, yw] of [[-200, 220, 0, 20], [230, -260, 0, 170], [-130, -320, 1, 0], [180, 330, 2, 60], [260, 140, 0, 95]]) { S(luggage(k, Math.abs(dx)), x + dx, y + dy, 0, yw); if (k === 0) body(x + dx, y + dy, 84, 54, 48, yw); else round(x + dx, y + dy, 26, 46); }
    S(cartWheel(CO.rr, 90), x + 120, y + 280, 0, 0); round(x + 120, y + 280, CO.rr + 4, 26, 0, false); SPOT.push([x - 150, y, 520]); }

  // ---- the fields: stubble and stooks south-west, haystacks, the scarecrow; the orchard south-east
  const stooks = [];
  for (let x = -5000; x <= -800; x += 500) for (let y = -5300; y <= -1500; y += 520) { const px = x + rr(-60, 60), py = y + rr(-60, 60); if (nearRoad(px, py, 420) || inBld(px, py, 200) || Math.hypot(px - IX.toll[0], py - IX.toll[1]) < 900) continue; stooks.push({ x: px, y: py, half: 60, circle: true, place: () => { S(stook(Math.round(px)), px, py, 0, rr(0, 360)); round(px, py, 56, 140); } }); }
  for (const [x, y, r, h] of [[-4500, -1700, 200, 340], [-4800, -4600, 190, 320], [-1300, -4800, 210, 350]]) { S(haystack(r, h, Math.round(x)), x, y, 0, rr(0, 360)); round(x, y, r * 0.95, h); SPOT.push([x, y, r + 100]); }
  S(scarecrow(1), -3000, -3600, 0, 160); round(-3000, -3600, 30, 260);
  const trees = [];
  for (let x = 2700; x <= 4900; x += 560) for (let y = -5100; y <= -2700; y += 560) { const px = x + rr(-50, 50), py = y + rr(-50, 50); if (Math.hypot(px - 3800, py + 3800) < 380) continue; trees.push({ x: px, y: py, half: 30, circle: true, place: () => { S(appleTree(560, Math.round(px)), px, py, 0, rr(0, 360)); trunk(px, py, 30, 300); } }); }
  const nOrch = trees.length;
  for (let k = 0; k < 800 && trees.length < nOrch + 20; k++) { const x = rr(-hx + 300, hx - 300), y = rr(-hy + 300, hy - 300), h = pick([1000, 1200, 1400]); if (nearRoad(x, y, 560) || inBld(x, y, 300) || Math.hypot(x + 2400, y - 1900) < 1900 || Math.hypot(x, y + 300) < 1500 || Math.hypot(x - IX.floor[0], y - IX.floor[1]) < 1200 || Math.hypot(x - IX.spawn[0], y - IX.spawn[1]) < 800 || (x < -800 && y < -1500 && x > -5100) || SPOT.some(([sx, sy, sr]) => Math.hypot(x - sx, y - sy) < sr + 200) || trees.some((t) => Math.hypot(x - t.x, y - t.y) < 1300) || stooks.some((s) => Math.hypot(x - s.x, y - s.y) < 300)) continue;
    const sd = k % 5; trees.push({ x, y, half: oakTrunk(h), circle: true, place: () => { S(oak(h, sd), x, y, 0, rr(0, 360)); trunk(x, y, oakTrunk(h), h * 0.45); } }); }
  // the hedges: round the edge (gaps where the roads come in and go out) and along the roads between the fields
  const hedges = [], hedgeAt = (x, y, i) => { if (inPond(x, y, 220) || inBld(x, y, 120)) return; const r = pick([170, 190, 210]); hedges.push({ x, y, half: r * 0.9, circle: true, place: () => { S(hedgeLump(r, pick([0x4e7a30, 0x5a8634, 0x467028]), i % 7 === 0 ? 0xf2ecd8 : 0, i), x, y, 0, rr(0, 360)); round(x, y, r * 0.9, r * 1.1); } }); };
  for (const [x0, y0, x1, y1] of [[-hx + 150, -hy + 150, hx - 150, -hy + 150], [-hx + 150, hy - 150, hx - 150, hy - 150], [-hx + 150, -hy + 150, -hx + 150, hy - 150], [hx - 150, -hy + 150, hx - 150, hy - 150]]) { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.round(L / 330);
    for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n; if (nearRoad(x, y, 380)) continue; hedgeAt(x, y, i); } }
  for (const [P, side, from, to, gaps] of [[ROAD_NS, 1, -5500, -2100, [[-3900, -3150]]], [ROAD_NS, -1, -5500, -1100, [[-2800, -2450]]], [ROAD_EW, 1, -5100, -3500, []], [ROAD_EW, -1, -5100, -3000, [[-4300, -3900]]], [ROAD_EW, -1, 2200, 5100, [[3250, 3650]]], [ROAD_EW, 1, 3700, 5100, []]]) {
    const along = P === ROAD_NS; for (let t = from; t <= to; t += 300) { if (gaps.some(([a, b]) => t > a && t < b)) continue; let best = null; for (let j = 0; j < P.length - 1; j++) { const [ax, ay] = P[j], [bx, by] = P[j + 1], c = along ? ay : ax, d = along ? by : bx; if (t < Math.min(c, d) || t > Math.max(c, d)) continue; const f = (t - c) / (d - c), qx = ax + (bx - ax) * f, qy = ay + (by - ay) * f; best = along ? [qx + side * 430, qy] : [qx, qy + side * 420]; }
      if (best) hedgeAt(best[0], best[1], Math.round(t / 300)); } }
  for (const p of K.plan(hedges.concat(trees, stooks), IX.spawn)) p.place();

  // ---- the drove road shut both ways: the elm down across it in the west, the carters' barricade in the east
  { const fx = -5170, fy = -280, L = 2000, tr = 110; S(fallenOak(L, tr, 3), fx, fy, 0, 90); body(fx, fy + 80, tr * 2.1, L - 160, tr * 1.75, 0); const pr = tr * 3.2; body(fx, fy - L / 2 - 30, pr * 2 + 40, tr * 1.3, pr * 1.68); SPOT.push([fx, fy, 1100]); navBand(-4760, 740, 140, 140); }
  { const bx = 5190, by = -290; S(cart(1, 1), bx, by, 0, 90); body(bx, by, 250, 150, 150, 90);
    for (const [dy, yw] of [[-330, 4], [270, -6]]) { S(hurdle(240, Math.round(dy)), bx - 20, by + dy, 0, 90 + yw); body(bx - 20, by + dy, 20, 240, 126, yw); }
    for (const [dx, dy, z, sd] of [[-130, -120, 0, 1], [-130, -30, 0, 2], [-130, 60, 0, 1], [-130, -75, 44, 2]]) S(bale(sd), bx + dx, by + dy, z, 90); body(bx - 130, by - 30, 60, 290, 90);
    for (const [dx, dy, w] of [[120, -150, 70], [140, 160, 60]]) { S(crate(w, 2), bx + dx, by + dy, 0, 15); SOL(bx + dx, by + dy, w, w, w, 15); } SPOT.push([bx, by, 600]);
    navBand(bx + 5, by - 60, 410, 1100); }   // the slivers shut in between the barricade, the hedges and the edge

  // ---- the Toadstool's threads out of the heart: under the carriage way to the crossroads and down the roads, out to
  // the stables, the beer garden, the pond
  { const [hx0, hy0] = IX.heart, veins = [];
    for (const P of [[[hx0, hy0], [1300, 1500], [500, 1500], [100, 900], [0, -300], [-30, -1800], [40, -3400]], [[hx0, hy0], [1300, 1500], [400, 1300], [-200, -300], [-1600, -280], [-2900, -300]], [[0, -300], [1200, -330], [2400, -320], [3600, -250]],
      [[hx0, hy0], [2500, 2100], [2400, 2700], [2050, 3380]], [[500, 1500], [0, 2200], [-900, 2000], [-2000, 980]], [[hx0, hy0], [2900, 900], [3300, 200], [3800, -1200], [3800, -3800]], [[0, -300], [600, -900], [1350, -2050]]]) {
      const pts = []; for (let k = 0; k < P.length - 1; k++) { const [x0, y0] = P[k], [x1, y1] = P[k + 1], n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 160)); for (let i = 0; i < n; i++) { const t = i / n; pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]); } } pts.push(P[P.length - 1]); veins.push(pts); }
    M.Shape('inveins', () => { const pos = [], col = [], idx = []; for (const pts of veins) { const n = pts.length, b0 = pos.length / 3;
      for (let j = 0; j < n; j++) { const [x, y] = pts[j], [xa, ya] = pts[Math.max(0, j - 1)], [xb, yb] = pts[Math.min(n - 1, j + 1)], L = Math.hypot(xb - xa, yb - ya) || 1, nx2 = -(yb - ya) / L, ny2 = (xb - xa) / L, wv = j && j < n - 1 ? Math.sin(x * 0.011 + j) * 40 : 0, w = 9 * (1 - (j / n) * 0.7);
        for (const e of [-1, 1]) { pos.push(x + nx2 * (wv + w * e), y + ny2 * (wv + w * e), 2.9); col.push(0.88, 0.84, 0.72); } }
      for (let j = 0; j < n - 1; j++) { const a = b0 + j * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } } return { pos, col, idx }; }, V(0, 0, 0), R(0, 0, 0));
    for (const pts of veins) for (let j = 3; j < pts.length; j += 3) { const [vx, vy] = pts[j]; if (blightAt.some(([bx, by, br]) => Math.hypot(vx - bx, vy - by) < br + 120) || nearRoad(vx, vy, 260) || inPond(vx, vy, 120) || inBld(vx, vy, 60) || !K.clear(vx, vy, 160)) continue;
      const ts = pick([0.8, 1, 1.2]); S(toadstoolCluster(ts, 0xc8392e, pick([1, 2, 3])), vx, vy, 0, rr(0, 360)); round(vx, vy, 22 * ts, 40 * ts); } }

  // ---- tufts of long grass about the meadows and the green, never on a road, a floor or in the yard
  { const nav = O.GM, [cx, cy] = [O.cx, O.cy], ok = (x, y) => { const [ix2, iy2] = nav.cellOf(cx + x, cy + y); return nav.navFree(ix2, iy2) && K.clear(x, y, 40); };
    let n = 0; for (let k = 0; k < 3000 && n < 340; k++) { const x = rr(-hx + 150, hx - 150), y = rr(-hy + 150, hy - 150); if (!ok(x, y) || nearRoad(x, y, 260) || inPond(x, y, 40) || inBld(x, y, 40) || Math.hypot(x - IX.floor[0], y - IX.floor[1]) < IX.floorR + 80 || Math.hypot(x - IX.spawn[0], y - IX.spawn[1]) < 300) continue;
      S(grassTuft(pick([30, 36]), pick([1, 2, 3, 4])), x, y, 0, rr(0, 360)); n++; } }

  // ---- beyond the hedges (out of reach): the Vale's fields and woods going on, the roads on into them
  for (let i = 0; i < 64; i++) { const side = i % 4, u = rr(-1, 1), d = rr(900, 3400), x = side < 2 ? (side ? 1 : -1) * (hx + d) : u * (hx + 2800), y = side < 2 ? u * (hy + 2800) : (side === 2 ? 1 : -1) * (hy + d); if (Math.abs(x) < 400 && Math.abs(y) > hy) continue; if (Math.abs(y + 290) < 400 && Math.abs(x) > hx) continue; S(farTree(pick([1500, 1800]), i % 2, pick([0x355e2c, 0x3e6a30]), i), x, y, 0, rr(0, 360)); }
  path([[0, -5850], [0, -9000], [-200, -12000]], 440, 0x9a7c52); path([[0, 5850], [80, 8600], [-160, 11000]], 440, 0x9a7c52); path([[-5850, -260], [-9000, -200], [-12000, -400]], 400, 0x9a7c52); path([[5850, -300], [9000, -380], [12000, -200]], 400, 0x9a7c52);

  // where the Toadstool's beds come up: the green, the meadows north and east, the stubble, the orchard, the verges
  const bedAt = ([x, y]) => { for (let r = 0; r <= 1600; r += 100) { const n = Math.max(1, Math.round(r / 50)); for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (Math.abs(px) < hx - 500 && Math.abs(py) < hy - 500 && K.clear(px, py, 430) && !inPond(px, py, 300) && !nearRoad(px, py, 450) && !inBld(px, py, 200) && Math.hypot(px - IX.floor[0], py - IX.floor[1]) > IX.floorR + 400) return [Math.round(px), Math.round(py)]; } } return [x, y]; };
  const beds = [[-1800, 2500], [3900, 2500], [-3500, -3300], [3800, -3000], [-1100, -4300], [1700, 4600]].map(bedAt);
  return {
    spots: { spawn: IX.spawn, yaw: Math.PI, exit: [0, 5450], textYaw: -90, ammo: [650, -5300], ammoYaw: 90,
      bench: [-660, 5130], benchYaw: 0, box: [660, 4900], chest: [660, 4900], chestYaw: 180, press: [-660, 4630], pressYaw: 0 },
    keep: [[IX.floor[0], IX.floor[1], 900]],
    beds, bossAt: null,
  };
}

// ---- the air at the crossroads: seeds and thistledown on the breeze over the fields, smoke off the inn's chimneys,
// chaff in the stable yard, the Toadstool's spores round its heart
export function innAir(g, dt, A) {
  const c = g.camera.position, [cx, cy] = A.c; if (Math.abs(c.x - cx) > A.hx + 600 || Math.abs(c.z - cy) > A.hy + 600) return;
  const st = (innAir.st ||= { a: 0, s: 0, h: 0, p: 0 });
  st.a += dt * 10; while (st.a > 1) { st.a -= 1; const a = Math.random() * 6.28, r = 300 + Math.random() * 2000;
    g.fx.add({ pos: new THREE.Vector3(c.x + Math.cos(a) * r, 60 + Math.random() * 360, c.z + Math.sin(a) * r), vel: new THREE.Vector3(30 + Math.random() * 40, (Math.random() - 0.4) * 12, (Math.random() - 0.5) * 30), life: 8, size0: 5, size1: 5, c0: [1, 1, 0.96, 0.9], fadeIn: 1, fadeOut: 1.5, tex: 'FX_Disc', kind: 'fx', glow: 0.3 }); }
  const [ix, iy] = IX.inn, near = Math.hypot(c.x - (cx + ix), c.z - (cy + iy)) < 4500;
  if (near) { st.s += dt * 3; while (st.s > 1) { st.s -= 1; const [sx, sy, sz] = [[ix, iy - 1300 - IN.stack[0] / 2, IN.r + 210], [ix - 15, iy + 1160, IN.r + 230], [ix - 15, iy + 400, IN.r + 230]][Math.floor(Math.random() * 3)];
    g.fx.add({ pos: new THREE.Vector3(cx + sx + (Math.random() - 0.5) * 20, sz, cy + sy + (Math.random() - 0.5) * 20), vel: new THREE.Vector3(16 + Math.random() * 10, 34 + Math.random() * 16, (Math.random() - 0.5) * 8), life: 7, size0: 30, size1: 120, c0: [0.82, 0.8, 0.78, 0.34], c1: [0.82, 0.8, 0.78, 0], fadeIn: 0.6, fadeOut: 3, tex: 'FX_Disc', kind: 'fx', glow: 0 }); } }
  const [hx0, hy0] = IX.heart, hd = Math.hypot(c.x - (cx + hx0), c.z - (cy + hy0));
  if (hd < 3000) { st.h += dt * 7; while (st.h > 1) { st.h -= 1; const a = Math.random() * 6.28, r = Math.random() * 900;
    g.fx.add({ pos: new THREE.Vector3(cx + hx0 + Math.cos(a) * r, 20 + Math.random() * 200, cy + hy0 + Math.sin(a) * r), vel: new THREE.Vector3((Math.random() - 0.5) * 16, 8 + Math.random() * 14, (Math.random() - 0.5) * 16), life: 6, size0: 6, size1: 9, c0: [0.8, 1, 0.42, 0.8], fadeIn: 0.8, fadeOut: 1.5, tex: 'FX_Disc', kind: 'fx', glow: 0.8 }); } }
}
