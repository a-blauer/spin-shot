// Millbrook, in the Vale: a mill village on the brook, a morning's walk down the Vale from Thimblewick. The lane comes
// in at the south between the hedges, past the cottages (thatched ones and mushroom ones like Thimblewick's) round the
// green with its well, its old oak and the maypole; the bakery with its oven, the smithy by the lane, the little shop.
// The stone bridge takes the lane over the Mill Brook. North of it: the mill pond above its weir in the west, the race
// running from the sluice along the mill's south wall and the great wheel turning in it, the mill itself (the Blight
// came up through its floor, where the grain lay spilled: its heart has burst out of the mill's east door), the yard
// with the granary on its staddle stones and the miller's house. Downstream, the washing stones, willows, a boat tied
// up; meadows of stooks to the north-east, gardens and hives to the south-east, the hay meadow south-west, a wood above
// the pond. The way on: the crossroads at the north end where the stations come up.
//
// Local frame (dest.js): +Y north, +X east, z up; the ground is flat at z = 0. Playable: x in [-5400, 5400],
// y in [-5800, 5800]. The brook, the pond and the race are shallow: anything can wade them anywhere; their kerbs are
// only a step.
import * as THREE from 'three';
import { V, R } from './mapkit.js';
import { destKit } from './dest_kit.js';
import { blightMass, hedgeLump, haystack, scarecrow, hiveBench, raisedBed, appleTree, cartShed, wheelbarrow, farTree } from './dest_props.js';
import { oak, oakTrunk, flagFloor } from './dest_props_wood.js';
import { pollardWillow, fenReeds } from './dest_props_fen.js';
import { shroomHouse, thatchCottage, tree, toadstoolCluster, wellFine, cabbage, pumpkin, grassTuft, VC } from './village_shapes.js';
import { cart, crate, sack, woodpile, washLine, trough, anvil, flowerClump, rowboat } from './village_props.js';
import { ruinWall, wallBodies } from './dest_props_abbey.js';
import { MB, MILL, millHouse, millWheel, raceKerb, weir, sluice, cutwater, GRAN, granary, breadOven, SMITHY, smithy, maypole, stook, washSlabs, fingerpost } from './dest_props_mill.js';

export const ML = { spawn: [0, -5300], floor: [0, 4900], floorR: 850, green: [-500, -2300], greenR: 780, mill: [-1450, 2020], pond: [-4150, 1050], pondR: [1250, 820], heart: [-720, 2030] };
// the water: the mill pond's shore (radius out from its middle each way), the brook below the weir, the race from the
// sluice past the wheel and back to the brook
const pondK = (a) => 1 + 0.07 * Math.sin(a * 3 + 1) + 0.05 * Math.sin(a * 5 + 2);
const pondAt = (a) => [ML.pond[0] + Math.cos(a) * ML.pondR[0] * pondK(a), ML.pond[1] + Math.sin(a) * ML.pondR[1] * pondK(a)];
const inPond = (x, y, m = 0) => { const dx = x - ML.pond[0], dy = y - ML.pond[1], a = Math.atan2(dy / ML.pondR[1], dx / ML.pondR[0]), k = pondK(a); return Math.hypot(dx / (ML.pondR[0] * k + m), dy / (ML.pondR[1] * k + m)) < 1; };
const WEIR = pondAt(-0.7);
const BROOK = [[WEIR[0] + 60, WEIR[1] - 40], [-2600, 300], [-2000, 190], [-1400, 180], [-900, 230], [-300, 280], [300, 220], [1000, 120], [1700, 160], [2400, 330], [3100, 420], [3800, 330], [4500, 160], [5600, 120]];
const RACE = [[pondAt(0.6)[0] - 40, 1520], [-2300, 1522], [-1450, 1520], [-1000, 1500], [-760, 1300], [-700, 900], [-720, 500], [-760, 280]];
// the lane: up from the south past the green to the bridge, and on north past the yard to the crossroads
const LANE_S = [[0, -5850], [60, -4600], [-40, -3600], [300, -2900], [430, -2200], [250, -1400], [60, -700], [0, -150]];
const LANE_N = [[0, 640], [-60, 1400], [-180, 2200], [-140, 3000], [0, 3900], [0, 5850]];
const PATHS = [LANE_S, LANE_N, [[300, -2900], [-200, -2800], [-900, -2600]], [[250, -1400], [-400, -1700]], [[-180, 2200], [-900, 2500], [-1900, 2600], [-2500, 2650]], [[60, -700], [1000, -400], [1500, -200]], [[0, 3900], [1600, 3600], [3000, 3800]], [[-40, -3600], [-1500, -3900], [-2900, -3600]], [[60, -4600], [1500, -4000], [3000, -3300]]];
// where things stand (x0, x1, y0, y1): kept clear of trees and the scatter
const BLD = [[-2050, -800, 1500, 2420], [-3300, -2500, 2280, 2940], [-850, -300, 2560, 3040], [-2400, -1600, -2000, -1400], [-2450, -1750, -2800, -2200], [-2250, -1500, -3650, -2950], [-1200, -600, -4000, -3300], [950, 1700, -2250, -1450], [1000, 1700, -3100, -2500], [950, 1600, -4000, -3400], [800, 1450, -4850, -4150], [-1620, -980, -1180, -620], [550, 1250, -1150, -450], [1400, 2050, -950, -250]];

export function buildMill(M, O) {
  const { hx, hy } = O;
  const K = destKit(M, 73, O, { exactNav: true }), { S, body, round, trunk, patch, path, band, rnd, rr, lineDist, Cyl, Box, Lamp, Glow } = K;
  const pick = (L) => L[Math.floor(rnd() * L.length)];
  const SOL = (x, y, w, d, h, yaw = 0, nav = true) => body(x, y, w, d, h, yaw, 0, nav);
  const D2R = Math.PI / 180, TOAD = { r: 0.8, g: 1, b: 0.35 }, TOAD_GLOW = 0xc4ff58;
  const at = (x, y, yaw, u, v) => [x + u * Math.cos(yaw * D2R) - v * Math.sin(yaw * D2R), y + u * Math.sin(yaw * D2R) + v * Math.cos(yaw * D2R)];
  // a neat wall of coursed stone (the abbey's wall, never ruined) from (x0, y0) to (x1, y1); its bodies follow its stones
  const wall = (x0, y0, x1, y1, o) => { const len = Math.round(Math.hypot(x1 - x0, y1 - y0)), yaw = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI, mx = (x0 + x1) / 2, my = (y0 + y1) / 2, P = { ruin: 0, ...o, len }, B = wallBodies(P); S(ruinWall(P), mx, my, 0, yaw);
    for (const [s0, s1, z0, z1] of B.runs) { const [px, py] = at(mx, my, yaw, (s0 + s1) / 2, 0); body(px, py, s1 - s0, P.t || 70, z1 - z0, yaw, z0); }
    for (const [s0, s1, y0, y1, z0, z1] of B.butt) { const [px, py] = at(mx, my, yaw, (s0 + s1) / 2, (y0 + y1) / 2); body(px, py, s1 - s0, Math.abs(y1 - y0), z1 - z0, yaw, z0); }
    return P; };
  const navBand = (x, y, w, d) => O.GM.NavBlockBox({ min: V(x - w / 2, y - d / 2, 0), max: V(x + w / 2, y + d / 2, 100) }, 1);
  // a roof's body: steps of boxes up its two slopes (ridge along the house's X), from its eaves at ze to its ridge at zr
  const roofBody = (x, y, yaw, hl, hw, ze, zr) => { for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const v0 = hw * (1 - i / 4), v1 = hw * (1 - (i + 1) / 4), z0 = ze + (zr - ze) * (i / 4), z1 = ze + (zr - ze) * ((i + 1) / 4), [px, py] = at(x, y, yaw, 0, sd * (v0 + v1) / 2); body(px, py, hl * 2, v0 - v1, z1 - z0 + 14, yaw, z0 - 6); } };
  // the houses: a thatched cottage (its front +X) on a box as high as its thatch; a mushroom cottage, its stem round and
  // its cap held up over the path
  const cottage = (x, y, yaw, w, d, h, wall2, sd) => { S(thatchCottage(w, d, h, wall2, sd), x, y, 0, yaw); SOL(x, y, w + 40, d + 40, h + 160, yaw); };
  const shroom = (x, y, yaw, h, r, cap, sd) => { S(shroomHouse(h, r, cap, sd % 2 ? VC.cream2 : VC.cream, sd), x, y, 0, yaw); round(x, y, r * 1.12, h); round(x, y, r * 1.98, r * 1.08, h - 42); };
  const SPOT = [];   // things a garden or a scatter must keep off: [x, y, r]

  // ---- the ground: meadow grass, lighter on the green, worn where the lane and the yard are
  Box(V(0, 0, -60), V(hx * 2 + 24000, hy * 2 + 24000, 120), 0x6a8f42, true, false);
  for (let i = 0; i < 46; i++) { const x = rr(-hx + 300, hx - 300), y = rr(-hy + 300, hy - 300); if (inPond(x, y, 200) || lineDist(x, y, BROOK) < 420) continue; patch(x, y, rr(500, 1200), pick([0x729a46, 0x66903e, 0x7aa24c, 0x6e9440])); }
  patch(ML.green[0], ML.green[1], ML.greenR * 2, 0x82ae52); patch(ML.green[0] + 120, ML.green[1] - 80, ML.greenR * 1.5, 0x88b456);
  patch(-1150, 2700, 1700, 0x8a8058); patch(-900, 2800, 1100, 0x968a62);

  // ---- the water: the mill pond, the brook below the weir, the race; muddy banks under all of them, reeds at their edges
  M.Shape('mbpond', () => { const pos = [], col = [], idx = [], C = new THREE.Color(), n = 64; const ring = (m, z, c) => { const b = pos.length / 3; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, [px, py] = pondAt(a), dx = px - ML.pond[0], dy = py - ML.pond[1], L = Math.hypot(dx, dy); pos.push(px + (dx / L) * m, py + (dy / L) * m, z); C.setHex(c, THREE.NoColorSpace); col.push(C.r, C.g, C.b); } return b; };
    const b0 = ring(120, 1.0, 0x5a5038), b1 = ring(0, 1.15, 0x5a6a48), b2 = ring(-160, 1.5, 0x3e6e7a), b3 = ring(-700, 1.5, 0x356474), c0 = pos.length / 3; pos.push(ML.pond[0], ML.pond[1], 1.5); col.push(0.19, 0.37, 0.43);
    for (const [a, b] of [[b0, b1], [b1, b2], [b2, b3]]) for (let i = 0; i < n; i++) { const j = (i + 1) % n; idx.push(a + i, a + j, b + i, a + j, b + j, b + i); }
    for (let i = 0; i < n; i++) idx.push(b3 + i, b3 + ((i + 1) % n), c0); return { pos, col, idx }; }, V(0, 0, 0), R(0, 0, 0));
  band(BROOK, 640, 1.0, (i, j) => (j === 0 || j === 4 ? 0x5a5038 : 0x5e6a48), 0.1);
  band(BROOK, 470, 1.5, (i, j) => (j === 0 || j === 4 ? 0x4a7480 : (i + j) % 7 === 0 ? 0x4e8290 : 0x3e6e7a), 0.08);
  band(RACE, 180, 1.4, (i, j) => (j === 0 || j === 4 ? 0x3a6470 : 0x3e6e7a), 0.02);
  // the weir where the pond spills into the brook, the sluice at the race's head, the race's kerbs
  { const [wx, wy] = WEIR, yw = -40; S(weir(500), wx, wy, 0, yw); body(wx, wy, 70, 500, 30, yw); }
  { const [sx] = RACE[0]; S(sluice(180), sx + 40, 1520, 0, 0); for (const sy of [-1, 1]) round(sx + 40, 1520 + sy * 112, 12, 260); body(sx + 40, 1520, 12, 184, 160, 0); }
  for (let j = 0; j < RACE.length - 1; j++) { const [x0, y0] = RACE[j], [x1, y1] = RACE[j + 1], L = Math.hypot(x1 - x0, y1 - y0), yw = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI; if (j === 0) { S(raceKerb(L - 60, 180), (x0 + x1) / 2 + 30, (y0 + y1) / 2, 0, yw); continue; } S(raceKerb(L, 180), (x0 + x1) / 2, (y0 + y1) / 2, 0, yw); }
  // reeds along the pond's shore and the brook's banks, in clumps
  for (let i = 0; i < 26; i++) { const a = rr(-Math.PI, Math.PI); if (Math.cos(a) > 0.7 && Math.abs(Math.sin(a)) < 0.6) continue; const [px, py] = pondAt(a), dx = px - ML.pond[0], dy = py - ML.pond[1], L = Math.hypot(dx, dy), x = px - (dx / L) * rr(40, 120), y = py - (dy / L) * rr(40, 120); if (Math.abs(x) > hx - 120) continue; const h = pick([110, 130, 150]); S(fenReeds(h, i), x, y, 0, rr(0, 360)); round(x, y, 26, h, 0, false); navBand(x, y, 52, 52); }

  // ---- the mill on its race: the wheel in the race at its south wall, the axle into it; the yard to the north
  { const [x, y] = ML.mill; S(millHouse(1), x, y, 0, 0); SOL(x, y, MILL.w + 16, MILL.d + 16, MILL.e); roofBody(x, y, 0, MILL.w / 2 + 40, MILL.d / 2 + 40, MILL.e - 6, MILL.r);
    body(x, y + MILL.d / 2 + 20, 184, 140, 220, 0, MILL.e - 40); body(x + MILL.w / 2 + 34, y + 40, 30, 208, 140, 0); navBand(x + MILL.w / 2 + 34, y + 40, 30, 208);
    S(millWheel(380, 150, 160), x, 1520, 386, 0); body(x, 1520, 776, 172, 778, 0, 0); }
  // the yard: worn cobbles; the granary on its staddles, carts and sacks of flour, the miller's house and its garden
  { const [gx, gy] = [-560, 2800]; S(granary(1), gx, gy, 0, 0); SOL(gx, gy, GRAN.w + 12, GRAN.w + 12, GRAN.top + 40); SOL(gx + 270, gy, 70, 84, 74); }
  S(cart(2, 1), -1150, 2760, 0, 20); SOL(-1150, 2760, 240, 140, 150, 20);
  S(cart(0, 2), -1850, 2950, 0, -70); SOL(-1850, 2950, 240, 140, 150, -70);
  for (const [x, y, r] of [[-1300, 2440, 26], [-1250, 2470, 24], [-1360, 2480, 26], [-1600, 2450, 26], [-1650, 2490, 22]]) { S(sack(r, 0xe8dcc0), x, y, 0, rr(0, 360)); round(x, y, r * 1.1, r * 2.6); }
  for (const [x, y, w] of [[-1980, 2480, 70], [-1990, 2560, 60]]) { S(crate(w, 3), x, y, 0, 10); SOL(x, y, w, w, w, 10); }
  S(wheelbarrow(1), -1500, 2900, 0, 140); SOL(-1500, 2900, 170, 80, 80, 140);
  cottage(-2900, 2610, 0, 700, 520, 320, VC.cream, 2);
  // the Blight came up through the mill's floor where the grain lay spilled: its heart has burst out of the east door
  const blightAt = [];
  { const [x, y] = ML.heart; S(blightMass(400, 2, 'toad'), x, y, 0, 30); round(x, y, 400 * 0.62, 400 * 0.55); blightAt.push([x, y, 400]); Lamp(V(x + 60, y - 40, 160), TOAD, 2.2, 1100, false); Glow(V(x, y, 120), V(22, 22, 26), TOAD_GLOW, 2);
    for (const [ex, ey, r, sd] of [[-2300, 2300, 200, 3], [-3700, 2400, 220, 1]]) { S(blightMass(r, sd, 'toad'), ex, ey, 0, rr(0, 360)); round(ex, ey, r * 0.62, r * 0.55); blightAt.push([ex, ey, r]); Lamp(V(ex, ey, 100), TOAD, 2.2, 600, false); } }

  // ---- the bridge: the lane over the brook between two coped parapets, cutwaters up and down stream from its pier
  K.settRoad([[0, -170], [0, 660]], 360, 2.6, { kerbW: 0 });
  for (const sx of [-1, 1]) wall(sx * 210, -150, sx * 210, 640, { h: 96, t: 60, cope: true, seed: 3 + sx, bl: 60, co: 32 });
  for (const sx of [-1, 1]) { S(cutwater(200, 150, 90), sx * 240, 250, 0, sx > 0 ? 0 : 180); body(sx * 340, 250, 200, 110, 100, 0); }

  // ---- the green: the old oak, the well, the maypole wound with its ribbons after the dance
  { const [x, y] = ML.green; S(oak(1300, 4), x + 300, y - 380, 0, 40); trunk(x + 300, y - 380, oakTrunk(1300), 600); S(wellFine(), x - 220, y + 60, 0, 0); round(x - 220, y + 60, 90, 120); S(maypole(900), x - 260, y + 460, 0, 0); round(x - 260, y + 460, 18, 900); navBand(x - 260, y + 460, 40, 40); }
  // ---- the cottages round the green and along the lane; the bakery and its oven, the smithy, the shop
  cottage(-2000, -1700, 0, 560, 440, 300, VC.cream, 1);
  shroom(-2100, -2500, 0, 480, 280, VC.red, 3);
  cottage(-1880, -3300, 25, 560, 440, 300, 0xe8dcc0, 4);
  shroom(-900, -3650, 90, 440, 260, 0x8a5a34, 5);
  cottage(1320, -1900, 180, 640, 480, 320, VC.cream2, 5); S(breadOven(), 1320, -1900 + 240 + 2, 0, 90); SOL(1320, -1900 + 242 + 74, 180, 148, 160); SOL(1320, -1900 + 242 + 18, 80, 36, 740);
  shroom(1350, -2800, 180, 500, 290, VC.red, 6);
  cottage(1280, -3700, 180, 560, 440, 300, VC.cream, 7);
  shroom(1120, -4500, 150, 420, 250, 0xd8b46a, 8);
  shroom(900, -800, 180, 400, 240, 0x5c8e3a, 9);
  cottage(1720, -600, 90, 560, 440, 300, 0xe8dcc0, 3);
  { const x = -1300, y = -900; S(smithy(1), x, y, 0, 0); const hw = SMITHY.w / 2, hd = SMITHY.d / 2; for (const sx of [-1, 1]) for (const sy of [-1, 1]) { round(x + sx * (hw - 10), y + sy * (hd - 10), 14, SMITHY.e); navBand(x + sx * (hw - 10), y + sy * (hd - 10), 28, 28); }
    SOL(x - hw + 80, y, 150, 230, 96); body(x - hw + 80, y, 80, 130, 600, 0, 90); body(x - hw + 80, y + 170, 120, 72, 150, 0); roofBody(x, y, 90, SMITHY.d / 2 + 30, SMITHY.w / 2 + 30, SMITHY.e, SMITHY.r);
    S(anvil(), x + 120, y - 40, 0, 90); SOL(x + 120, y - 40, 90, 60, 90, 90); S(trough(160), x + 60, y + 160, 0, 0); SOL(x + 60, y + 160, 170, 60, 60); }

  // ---- the gardens: vegetables behind the cottages, flowers by their doors, woodpiles and washing lines
  const garden = (x, y, yaw, sd) => { const P = (u, v) => at(x, y, yaw, u, v);
    { const [gx, gy] = P(-520, 0); patch(gx, gy, 520, 0x5a4a34); for (let i = 0; i < 6; i++) { const [cx, cy] = P(-640 + (i % 3) * 120, -90 + Math.floor(i / 3) * 180); if (i % 2) { S(cabbage(26), cx, cy, 0, rr(0, 360)); } else { S(pumpkin(34), cx, cy, 0, rr(0, 360)); round(cx, cy, 36, 50); } } }
    { const sy = sd % 2 ? 1 : -1, [fx, fy] = P(330, sy * 190); S(flowerClump(40, sd % 2 ? 0xf08aa8 : 0xf6c43a, 0xffffff, sd), fx, fy, 0, rr(0, 360)); }
    if (sd % 2) { const [wx, wy] = P(-120, 330); S(woodpile(220, 4, sd), wx, wy, 0, yaw); SOL(wx, wy, 230, 70, 110, yaw); } else { const [wx, wy] = P(-360, -320); S(washLine(420, sd), wx, wy, 0, yaw); for (const e of [-1, 1]) { const [px, py] = at(wx, wy, yaw, e * 210, 0); round(px, py, 8, 190); navBand(px, py, 24, 24); } } };
  [[-2000, -1700, 0], [-2100, -2500, 0], [-1880, -3300, 25], [-900, -3650, 90], [1320, -1900, 180], [1350, -2800, 180], [1280, -3700, 180], [1120, -4500, 150], [1720, -600, 90], [-2900, 2610, 0]].forEach(([x, y, yw], i) => garden(x, y, yw, i));

  // ---- downstream: the washing stones, the stepping stones, willows along the banks, a boat tied up
  S(washSlabs(1), 1500, -160, 0, 90); S(washSlabs(2), 3300, 150, 0, 90);
  for (const [x, y] of [[2560, 160], [2600, 270], [2560, 380], [2610, 490]]) Cyl(V(x, y, 3.5), 70, 7, MB.stone[1], false, false, null);
  const willows = [];
  for (let k = 0; k < BROOK.length - 1; k++) { if (k < 1) continue; const [x0, y0] = BROOK[k], [x1, y1] = BROOK[k + 1], L = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / L, ny = (x1 - x0) / L; for (const sd of [-1, 1]) { if ((k + (sd > 0 ? 1 : 0)) % 2) continue; const t = 0.5, x = x0 + (x1 - x0) * t + nx * sd * 400, y = y0 + (y1 - y0) * t + ny * sd * 400; if (Math.abs(x) > hx - 300 || Math.abs(x) < 500 || BLD.some(([a, b, c, d]) => x > a - 200 && x < b + 200 && y > c - 200 && y < d + 200)) continue; willows.push([x, y]); } }
  for (const [x, y] of willows) { const h = pick([280, 320, 360]); S(pollardWillow(h, Math.round(x)), x, y, 0, rr(0, 360)); trunk(x, y, 40, h); }
  S(rowboat(300, 0x7a5a3a, 2), 3600, 560, 1.5, 15); SOL(3600, 560, 300, 110, 60, 15);

  // ---- the meadows: stooks north-east, haystacks and the cart shed south-west, the scarecrow; gardens and hives
  // south-east with a few old apple trees
  const stooks = [];
  for (let x = 1700; x <= 5000; x += 520) for (let y = 1200; y <= 4800; y += 540) { const px = x + rr(-60, 60), py = y + rr(-60, 60); if (lineDist(px, py, BROOK) < 600 || PATHS.some((P) => lineDist(px, py, P) < 260) || Math.hypot(px - ML.floor[0], py - ML.floor[1]) < ML.floorR + 400 || rnd() < 0.25) continue; stooks.push({ x: px, y: py, half: 36, circle: true, place: () => { S(stook(Math.round(px)), px, py, 0, rr(0, 360)); round(px, py, 36, 118); } }); }
  S(scarecrow(2), 3400, 3000, 0, 200); round(3400, 3000, 30, 260);
  for (const [x, y, r, h] of [[-3600, -2600, 200, 340], [-4300, -3300, 180, 300], [-3300, -3800, 220, 360], [-4500, -2000, 190, 320]]) { S(haystack(r, h, Math.round(x)), x, y, 0, rr(0, 360)); round(x, y, r * 0.95, h); }
  S(cartShed(900, 420), -4500, -4600, 0, 0); SOL(-4500, -4600, 920, 440, 360);
  for (const [x, y, sd] of [[2600, -2500, 1], [3100, -2500, 2], [2600, -2100, 3], [3100, -2100, 4]]) { S(raisedBed(360, 140), x, y, 0, 0); SOL(x, y, 370, 150, 40); for (let i = 0; i < 4; i++) { S(cabbage(24), x - 130 + i * 86, y, 30, rr(0, 360)); round(x - 130 + i * 86, y, 30, 72); } void sd; }
  S(hiveBench(3), 4200, -3000, 0, 90); SOL(4200, -3000, 120, 330, 120, 90);
  const trees = [];
  for (const [x, y] of [[3600, -2100], [4400, -2200], [3700, -3700], [4500, -4100], [2700, -3500], [3300, -4500]]) trees.push({ x, y, half: 30, circle: true, place: () => { S(appleTree(560, Math.round(x)), x, y, 0, rr(0, 360)); trunk(x, y, 30, 300); } });
  // the wood above the pond, oaks along the lanes and in the hedgerows
  const treeOK = (x, y, m) => !inPond(x, y, 260) && lineDist(x, y, BROOK) > 480 + m && lineDist(x, y, RACE) > 300 + m && PATHS.every((P) => lineDist(x, y, P) > 280 + m) && !BLD.some(([a, b, c, d]) => x > a - 200 - m && x < b + 200 + m && y > c - 200 - m && y < d + 200 + m) && Math.hypot(x - ML.green[0], y - ML.green[1]) > ML.greenR + 200 && Math.hypot(x - ML.floor[0], y - ML.floor[1]) > ML.floorR + 300 && Math.abs(x) < hx - 250 && Math.abs(y) < hy - 250;
  for (let k = 0; k < 600 && trees.length < 40; k++) { const wood = k < 300, x = wood ? rr(-5100, -2300) : rr(-hx + 300, hx - 300), y = wood ? rr(2600, 5300) : rr(-hy + 300, hy - 300), h = pick([900, 1100, 1300]); if (!treeOK(x, y, 100) || trees.some((t) => Math.hypot(x - t.x, y - t.y) < (wood ? 600 : 1100)) || stooks.some((s) => Math.hypot(x - s.x, y - s.y) < 300)) continue;
    const sd = k % 5; trees.push({ x, y, half: oakTrunk(h), circle: true, place: () => { if (wood && sd % 2) { S(tree(h * 0.7, VC.leaf, sd, sd % 3), x, y, 0, rr(0, 360)); trunk(x, y, 34, h * 0.4); } else { S(oak(h, sd), x, y, 0, rr(0, 360)); trunk(x, y, oakTrunk(h), h * 0.45); } } }); }
  // the hedges round it all, gaps where the lane comes in and goes out and where the water runs through
  const hedges = [];
  for (const [x0, y0, x1, y1] of [[-hx + 150, -hy + 150, hx - 150, -hy + 150], [-hx + 150, hy - 150, hx - 150, hy - 150], [-hx + 150, -hy + 150, -hx + 150, hy - 150], [hx - 150, -hy + 150, hx - 150, hy - 150]]) { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.round(L / 330);
    for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n; if (Math.abs(x) < 450 && Math.abs(y) > hy - 400) continue; if (inPond(x, y, 200) || lineDist(x, y, BROOK) < 440) continue; const r = pick([170, 190, 210]); hedges.push({ x, y, half: r * 0.9, circle: true, place: () => { S(hedgeLump(r, pick([0x4e7a30, 0x5a8634, 0x467028]), i % 7 === 0 ? 0xf2ecd8 : 0, i), x, y, 0, rr(0, 360)); round(x, y, r * 0.9, r * 1.1); } }); } }
  for (const p of K.plan(hedges.concat(trees, stooks), ML.spawn)) p.place();

  // ---- the Toadstool's threads out of the heart: across the yard, along the race, down to the bridge, out to the green
  { const [hx0, hy0] = ML.heart, veins = [];
    for (const [ex, ey] of [[-1800, 3200], [-600, 3600], [-2600, 2300], [-1450, 1300], [0, 900], [-300, -900], [-500, -2000], [600, 2600]]) { const pts = []; for (let i = 0; i <= 7; i++) { const t = i / 7; pts.push([hx0 + (ex - hx0) * t + Math.sin(t * 7 + ex) * 120 * t, hy0 + (ey - hy0) * t + Math.cos(t * 5 + ey) * 120 * t]); } veins.push(pts); }
    M.Shape('mbveins', () => { const pos = [], col = [], idx = []; for (const pts of veins) { const n = pts.length; for (let j = 0; j < n - 1; j++) { const [x0, y0] = pts[j], [x1, y1] = pts[j + 1], L = Math.hypot(x1 - x0, y1 - y0), m = Math.max(2, Math.round(L / 40)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
      for (let i = 0; i <= m; i++) { const t = i / m, wv = Math.sin((x0 + i * 40) * 0.011 + j) * 40 + Math.sin((y0 + i * 40) * 0.023) * 16, px = x0 + (x1 - x0) * t + nx * wv, py = y0 + (y1 - y0) * t + ny * wv, w = 9 * (1 - ((j + t) / n) * 0.7); for (const e of [-1, 1]) { pos.push(px + nx * w * e, py + ny * w * e, 2.9); col.push(0.88, 0.84, 0.72); } }
      const b = pos.length / 3 - (m + 1) * 2; for (let i = 0; i < m; i++) { const a = b + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } } } return { pos, col, idx }; }, V(0, 0, 0), R(0, 0, 0));
    for (const pts of veins) for (let j = 2; j < pts.length; j += 2) { const [vx, vy] = pts[j]; if (blightAt.some(([bx, by, br]) => Math.hypot(vx - bx, vy - by) < br + 120) || PATHS.some((P) => lineDist(vx, vy, P) < 220) || lineDist(vx, vy, BROOK) < 300 || !K.clear(vx, vy, 200)) continue; const ts = pick([0.8, 1, 1.2]); S(toadstoolCluster(ts, 0xc8392e, pick([1, 2, 3])), vx, vy, 0, rr(0, 360)); round(vx, vy, 22 * ts, 40 * ts); } }

  // ---- the way on: the crossroads at the north end, the stations' floor, the finger post
  { const [x, y] = ML.floor; S(flagFloor(ML.floorR, 7, 0x5a5440, true, [0xa49d90, 0x968e80, 0xb0a898, 0x8a8274]), x, y, 0.4, 0); S(fingerpost(), x + 560, y - 640, 0, 30); round(x + 560, y - 640, 12, 320); navBand(x + 560, y - 640, 30, 30); }

  // ---- the paths, worn into the grass; the yard's cobbles
  for (const P of PATHS) path(P, P === LANE_S || P === LANE_N ? 330 : 200, 0x9a7c52, 0x8a8478);
  K.settRoad([[-1950, 2560], [-300, 2560]], 260, 2.4, { kerbW: 0, cols: [0x8a8478, 0x7e786e, 0x948e82, 0x847c70] });

  // ---- tufts of long grass about the meadows and along the banks, never on a path or a floor
  { const nav = O.GM, [cx, cy] = [O.cx, O.cy], ok = (x, y) => { const [ix, iy] = nav.cellOf(cx + x, cy + y); return nav.navFree(ix, iy) && K.clear(x, y, 40); };
    let n = 0; for (let k = 0; k < 3000 && n < 360; k++) { const x = rr(-hx + 150, hx - 150), y = rr(-hy + 150, hy - 150); if (!ok(x, y) || PATHS.some((P) => lineDist(x, y, P) < 200) || inPond(x, y, 40) || lineDist(x, y, BROOK) < 260 || Math.hypot(x - ML.floor[0], y - ML.floor[1]) < ML.floorR + 80 || Math.hypot(x - ML.spawn[0], y - ML.spawn[1]) < 500 || BLD.some(([a, b, c, d]) => x > a && x < b && y > c && y < d)) continue;
      S(grassTuft(pick([30, 36]), pick([1, 2, 3, 4])), x, y, 0, rr(0, 360)); n++; } }

  // ---- beyond the hedges (out of reach): the Vale's fields and woods going on, hills behind
  for (let i = 0; i < 64; i++) { const side = i % 4, u = rr(-1, 1), d = rr(900, 3400), x = side < 2 ? (side ? 1 : -1) * (hx + d) : u * (hx + 2800), y = side < 2 ? u * (hy + 2800) : (side === 2 ? 1 : -1) * (hy + d); if (Math.abs(x) < 300 && Math.abs(y) > hy) continue; S(farTree(pick([1500, 1800]), i % 2, pick([0x355e2c, 0x3e6a30]), i % 3), x, y, 0, rr(0, 360)); }
  path([[0, -5850], [0, -9000], [-200, -12000]], 330, 0x9a7c52); path([[0, 5850], [80, 8600], [-160, 11000]], 330, 0x9a7c52);

  // where the Toadstool's beds come up: the green, the yard, the meadow, the gardens, the hay meadow, the wood
  const settle = ([x, y]) => { for (let r = 0; r <= 1600; r += 100) { const n = Math.max(1, Math.round(r / 50)); for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (Math.abs(px) < hx - 500 && Math.abs(py) < hy - 500 && K.clear(px, py, 430) && !inPond(px, py, 300) && lineDist(px, py, BROOK) > 500 && Math.hypot(px - ML.floor[0], py - ML.floor[1]) > ML.floorR + 400) return [Math.round(px), Math.round(py)]; } } return [x, y]; };
  const beds = [[-300, -2200], [-1100, 3300], [3300, 2500], [2900, -3300], [-3900, -3000], [-3600, 3800]].map(settle);
  return {
    spots: { spawn: ML.spawn, yaw: Math.PI, exit: [0, 5450], textYaw: -90, ammo: [650, -5300], ammoYaw: 90,
      bench: [-660, 5130], benchYaw: 0, box: [660, 4900], chest: [660, 4900], chestYaw: 180, press: [-660, 4630], pressYaw: 0 },
    keep: [[ML.floor[0], ML.floor[1], 900]],
    beds, bossAt: null,
  };
}

// ---- the air at Millbrook: thistledown and seeds drifting over the meadows on the breeze, a mist off the brook and
// the pond, flour dust round the mill
export function millAir(g, dt, A) {
  const c = g.camera.position, [cx, cy] = A.c; if (Math.abs(c.x - cx) > A.hx + 600 || Math.abs(c.z - cy) > A.hy + 600) return;
  const st = (millAir.st ||= { a: 0, m: 0, f: 0 });
  st.a += dt * 10; while (st.a > 1) { st.a -= 1; const a = Math.random() * 6.28, r = 300 + Math.random() * 2000;
    g.fx.add({ pos: new THREE.Vector3(c.x + Math.cos(a) * r, 60 + Math.random() * 360, c.z + Math.sin(a) * r), vel: new THREE.Vector3(30 + Math.random() * 40, (Math.random() - 0.4) * 12, (Math.random() - 0.5) * 30), life: 8, size0: 5, size1: 5, c0: [1, 1, 0.96, 0.9], fadeIn: 1, fadeOut: 1.5, tex: 'FX_Disc', kind: 'fx', glow: 0.3 }); }
  const ly = c.z - cy, lx = c.x - cx; if (ly > -1200 && ly < 2600) { st.m += dt * 4; while (st.m > 1) { st.m -= 1; const x = lx + (Math.random() - 0.5) * 3600, y = Math.random() < 0.4 ? ML.pond[1] + (Math.random() - 0.5) * 1200 : 250 + (Math.random() - 0.5) * 300; if (x > -2900 || Math.random() < 0.6) {
    g.fx.add({ pos: new THREE.Vector3(cx + x, 20 + Math.random() * 40, cy + y), vel: new THREE.Vector3(14 + Math.random() * 10, 2, (Math.random() - 0.5) * 6), life: 7, size0: 90, size1: 160, c0: [0.92, 0.95, 0.96, 0.12], c1: [0.92, 0.95, 0.96, 0], fadeIn: 2, fadeOut: 3, tex: 'FX_Disc', kind: 'fx', glow: 0 }); } } }
  const mx = cx + ML.mill[0], mz = cy + ML.mill[1]; if (Math.hypot(c.x - mx, c.z - mz) < 3000) { st.f += dt * 6; while (st.f > 1) { st.f -= 1; const a = Math.random() * 6.28, r = 450 + Math.random() * 300;
    g.fx.add({ pos: new THREE.Vector3(mx + Math.cos(a) * r, 40 + Math.random() * 400, mz + Math.sin(a) * r), vel: new THREE.Vector3((Math.random() - 0.5) * 20, 6 + Math.random() * 10, (Math.random() - 0.5) * 20), life: 5, size0: 4, size1: 6, c0: [1, 0.98, 0.9, 0.7], fadeIn: 0.6, fadeOut: 1.2, tex: 'FX_Disc', kind: 'fx', glow: 0.2 }); } }
}
