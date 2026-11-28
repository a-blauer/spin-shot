// The Withered Abbey, in The Rot: the gnomes' old abbey on the edge of the Root. The brothers fired it to hold the Rot
// back; the roofs burned, the tower came down into the crossing, and the Blight came back through the ashes as the Char.
// Its heart grows out of the fallen tower now, under the one arch of it still standing.
// The pilgrims' road comes in at the south through the gatehouse (its portcullis jammed half up) into the outer court:
// the founder's statue, the guest house with its chimney still standing (west), the fishponds gone to black sludge
// (east). North of the court the cloister: its arcades round a dead garth and its well, the refectory south of it, the
// west range, the chapter house east with its three arches and the slype past it; the infirmary and the brothers' physic
// garden beyond. North of the cloister the church: the west front and its great window, the nave's north arcade still
// standing and the south one fallen to stumps, the crossing under the one arch of the tower, the transepts, the choir
// and its broken east window. The brothers' graves round it, the dead orchard west, the dovecote north-east, and the way
// on: the flagged floor at the north end where the stations come up, out through the north gate.
//
// Local frame (dest.js): +Y north, +X east, z up; the ground is flat at z = 0. Playable: x in [-5400, 5400],
// y in [-5800, 5800]; the precinct wall stands just inside its edges. The fishponds are shallow and their kerbs only a
// step: anything can wade them; only the reeds at their ends stop you.
import * as THREE from 'three';
import { V, R } from './mapkit.js';
import { destKit } from './dest_kit.js';
import { blightMass, hedgeLump } from './dest_props.js';
import { flagFloor } from './dest_props_wood.js';
import { RC, bareHill, farPine, roadBarrier, warnBoard, deadReeds, puffballs } from './dest_props_rot.js';
import { toadstoolCluster } from './village_shapes.js';
import { cart } from './village_props.js';
import { headstone } from './dest_props_town.js';
import { AB, ruinWall, wallBodies, ringWall, ringBodies, pier, pierR, fallenDrums, drumsLen, rubble, rubbleH, tracery, traceryBodies, tombChest, deadTree, deadTrunk, stoneCross, pondKerb, bell, charBeam, well, herbBed, graveCross, highAltar, founder, portcullis, flags, sundial, deadTuft, ledge, graveSlab, cot } from './dest_props_abbey.js';

export const AL = { spawn: [0, -5300], floor: [0, 4850], floorR: 800, heart: [60, 1600], garth: [-1500, -450], cross: [3300, 2200], dove: [3900, 4500] };
// the nave's bays (x of the piers between them and of their middles), the cloister's
const NP = [-2028, -1525, -1023], NB = [-2279, -1776, -1274, -771];
// the worn paths
const P_WEST = [[0, -3850], [-350, -3250], [-1400, -2980], [-2600, -2960], [-3250, -2850], [-3750, -2250], [-3780, -1000], [-3720, 300], [-3500, 1250], [-3050, 1600], [-2720, 1600]];
const P_EAST = [[0, -3850], [500, -3200], [850, -2500], [950, -1800], [1080, -1000], [1100, -100], [1250, 600], [2200, 760], [2420, 1600], [2350, 2500], [1500, 3300], [700, 3900], [250, 4250]];
const P_NORTH = [[-1776, 2660], [-1650, 3300], [-1100, 3900], [-450, 4300]];
const P_FISH = [[500, -3200], [1900, -3330], [3000, -3150], [4700, -3150]];
const P_DOVE = [[2350, 2500], [3100, 3500], [3850, 4000]];
const PATHS = [P_WEST, P_EAST, P_NORTH, P_FISH, P_DOVE];
// where the buildings stand (x0, x1, y0, y1), for keeping trees and graves off them
const BLD = [[-2830, -340, 480, 2740], [-460, 560, -200, 3480], [500, 2210, 970, 2230], [-3520, 960, -2760, 760], [-720, 720, -4760, -3780], [-3420, -1980, -4020, -3080], [1280, 3420, -1380, -220], [1000, 2800, -2780, -1620], [2860, 4900, -4050, -2350]];

export function buildAbbey(M, O) {
  const { hx, hy } = O;
  const K = destKit(M, 61, O, { exactNav: true }), { S, body, round, trunk, patch, path, rnd, rr, lineDist, Cyl, Box, Lamp, Glow } = K;
  const pick = (L) => L[Math.floor(rnd() * L.length)];
  const SOL = (x, y, w, d, h, yaw = 0, nav = true) => body(x, y, w, d, h, yaw, 0, nav);
  const D2R = Math.PI / 180, EMBER = { r: 1, g: 0.42, b: 0.14 }, CHAR_GLOW = 0xff5a22;
  const at = (x, y, yaw, u, v) => [x + u * Math.cos(yaw * D2R) - v * Math.sin(yaw * D2R), y + u * Math.sin(yaw * D2R) + v * Math.cos(yaw * D2R)];
  // a wall of the ruin from (x0, y0) to (x1, y1) (o: as ruinWall's, openings and buttresses at s from its middle); its bodies follow its courses
  const wall = (x0, y0, x1, y1, o) => { const len = Math.round(Math.hypot(x1 - x0, y1 - y0)), yaw = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI, mx = (x0 + x1) / 2, my = (y0 + y1) / 2, P = { ...o, len }, B = wallBodies(P); S(ruinWall(P), mx, my, 0, yaw);
    for (const [s0, s1, z0, z1] of B.runs) { const [px, py] = at(mx, my, yaw, (s0 + s1) / 2, 0); body(px, py, s1 - s0, P.t || 70, z1 - z0, yaw, z0); }
    for (const [s0, s1, y0, y1, z0, z1] of B.butt) { const [px, py] = at(mx, my, yaw, (s0 + s1) / 2, (y0 + y1) / 2); body(px, py, s1 - s0, Math.abs(y1 - y0), z1 - z0, yaw, z0); }
    return P; };
  // a wall along X at y from x0 to x1, its openings and buttresses given at their x (side 1: its north face); one along Y at x from y0 to y1, at their y (side 1: its west face)
  const wallX = (y, x0, x1, o) => { const m = (x0 + x1) / 2, f = (L) => (L || []).map(({ at: a, ...H }) => ({ ...H, s: Math.round(a - m) })); return wall(x0, y, x1, y, { ...o, holes: f(o.holes), butt: f(o.butt) }); };
  const wallY = (x, y0, y1, o) => { const m = (y0 + y1) / 2, f = (L) => (L || []).map(({ at: a, ...H }) => ({ ...H, s: Math.round(a - m) })); return wall(x, y0, x, y1, { ...o, holes: f(o.holes), butt: f(o.butt) }); };
  // a pier and its body; tracery in a window of a wall and its mullions' bodies; a flagged floor over a rect
  const pierAt = (x, y, h, r, cap, sd) => { S(pier(h, r, cap, sd), x, y, 0, sd * 37); round(x, y, pierR(r), h); };
  const traceryAt = (x, y, yaw, w, z0, z1, th, kind, n) => { S(tracery(w, z0, z1, th, kind, n), x, y, 0, yaw); for (const [s, mw, md, bz, bh] of traceryBodies(w, z0, z1, th, kind, n)) { const [px, py] = at(x, y, yaw, s, 0); body(px, py, mw, md, bh, yaw, bz); } };
  const floor = (x0, x1, y0, y1, seed, gone = 0.12, soot = 0) => S(flags(x1 - x0, y1 - y0, seed, gone, soot), (x0 + x1) / 2, (y0 + y1) / 2, 0, 0);
  // something thinner than a cell of the walking grid (a grave's cross, a post): shut the cells round it, so no creature is sent through it
  const navBand = (x, y, w, d) => O.GM.NavBlockBox({ min: V(x - w / 2, y - d / 2, 0), max: V(x + w / 2, y + d / 2, 100) }, 1);

  // ---- the ground: dead grass gone grey-brown, bare earth in drifts, soot and ash thick round the church
  Box(V(0, 0, -60), V(hx * 2 + 24000, hy * 2 + 24000, 120), 0x50483a, true, false);
  for (let i = 0; i < 52; i++) { const x = rr(-hx + 300, hx - 300), y = rr(-hy + 300, hy - 300); patch(x, y, rr(500, 1200), pick([0x5a5240, 0x625a46, 0x544c3c, 0x4a4236, 0x5e5848])); }
  for (const [x, y, d] of [[-1200, 1600, 2600], [600, 1600, 1800], [-1500, -450, 1300], [1300, 2400, 1400], [-2900, 1500, 1200], [200, 3600, 1500]]) patch(x, y, d, pick([0x46403a, 0x4a443e, 0x3e3a36]));

  // ---- the paths, worn into the grass
  for (const P of PATHS) path(P, 300, 0x6a5e4c, 0x7e786e);
  path([[-1500, 170], [-1500, -1070]], 150, 0x7a6e5a, 0x8a8478); path([[-2120, -450], [-880, -450]], 150, 0x7a6e5a, 0x8a8478);
  path([[0, -5850], [0, -4660]], 330, 0x6a5e4c, 0x7e786e);

  // ---- the precinct wall, round the whole place just inside its edge: coped where it still stands to its height,
  // broken down along its run, broken through twice south of the court. The gatehouse in its south side, the north gate
  // in its north.
  const PW = { h: 420, t: 90, ruin: 0.45, cope: true };
  wallX(-4300, -5385, -3800, { ...PW, seed: 1 });
  wallX(-4300, -3800, -2200, { ...PW, seed: 2, holes: [{ at: -3300, w: 360, z0: 0, k: 'v', sp: 0.7 }] });
  wallX(-4300, -2200, -615, { ...PW, seed: 3 });
  wallX(-4300, 615, 2200, { ...PW, seed: 4 });
  wallX(-4300, 2200, 3800, { ...PW, seed: 5, holes: [{ at: 3000, w: 360, z0: 0, k: 'v', sp: 0.7 }] });
  wallX(-4300, 3800, 5385, { ...PW, seed: 6 });
  for (let i = 0; i < 6; i++) { const y0 = -4255 + (9950 * i) / 6, y1 = -4255 + (9950 * (i + 1)) / 6; wallY(-5340, Math.round(y0), Math.round(y1), { ...PW, seed: 7 + i, ruin: 0.3 + (i % 3) * 0.1 }); wallY(5340, Math.round(y0), Math.round(y1), { ...PW, seed: 17 + i, ruin: 0.35 + ((i + 1) % 3) * 0.1 }); }
  wallX(5740, -5385, -3000, { ...PW, seed: 27 }); wallX(5740, -3000, -360, { ...PW, seed: 28 }); wallX(5740, 360, 3000, { ...PW, seed: 29 }); wallX(5740, 3000, 5385, { ...PW, seed: 30 });
  // the north gate: two piers, its arch fallen
  for (const sx of [-1, 1]) wallX(5740, sx < 0 ? -360 : 240, sx < 0 ? -240 : 360, { h: 660, t: 130, seed: 31 + sx, ruin: 0.08 });
  for (const [x, y, r, sd] of [[-760, 5480, 160, 1], [720, 5500, 140, 2]]) { S(rubble(r, sd), x, y, 0, sd * 50); round(x, y, r * 0.62, rubbleH(r)); }

  // ---- the gatehouse: a tall block the road runs through under two arches, the portcullis jammed half up in the outer
  // one, slits and windows high in its walls; roofless, the floor of its upper room gone
  const GT = { h: 1000, t: 130 };
  wallX(-4600, -615, 615, { ...GT, seed: 41, ruin: 0.18, holes: [{ at: 0, w: 400, z0: 0, z1: 380, k: 'p' }, { at: 0, w: 110, z0: 840, z1: 900, k: 'r' }, { at: -380, w: 40, z0: 315, z1: 490, k: 'q' }, { at: 380, w: 40, z0: 315, z1: 490, k: 'q' }], butt: [{ at: -555, side: -1, d: 120, w: 120 }, { at: 555, side: -1, d: 120, w: 120 }] });
  wallX(-3900, -615, 615, { ...GT, seed: 42, ruin: 0.32, holes: [{ at: 0, w: 400, z0: 0, z1: 380, k: 'p' }, { at: -330, w: 110, z0: 560, z1: 680, k: 'r' }, { at: 330, w: 110, z0: 560, z1: 680, k: 'r' }] });
  wallY(-550, -4535, -3965, { ...GT, seed: 43, ruin: 0.28, holes: [{ at: -4250, w: 110, z0: 420, z1: 540, k: 'r' }] });
  wallY(550, -4535, -3965, { ...GT, seed: 44, ruin: 0.3, holes: [{ at: -4250, w: 110, z0: 420, z1: 540, k: 'r' }] });
  S(portcullis(440, 420), 0, -4600, 360, 0); body(0, -4600, 400, 16, 360, 0, 366, false);
  floor(-485, 485, -4535, -3965, 3, 0.2);

  // ---- outside the gate: the pilgrims' road between dead trees, the quarantine barrier swung open, a wayside cross,
  // a handcart left where it stopped
  for (const [x, y, h, sd] of [[-700, -5650, 900, 1], [680, -5600, 1100, 2], [-760, -4950, 900, 3], [740, -5000, 1100, 4], [-2600, -5300, 1100, 5], [2400, -5150, 900, 1], [-4300, -5000, 900, 2], [4200, -5400, 1100, 3], [-3600, -4700, 900, 4], [3500, -4750, 900, 0]]) { S(deadTree(h, sd), x, y, 0, sd * 70); trunk(x, y, deadTrunk(h), h * 0.5); }
  S(roadBarrier(440), -240, -4850, 0, -90); round(-240, -4850, 26, 130); round(200, -4850, 10, 100);
  S(warnBoard(240), 560, -4780, 0, -90); for (const s of [-1, 1]) round(560 + s * 126, -4780, 8, 300); SOL(560, -4780, 252, 10, 120, 0, false); navBand(560, -4780, 270, 20);
  S(stoneCross(300), -1250, -5050, 0, 20); SOL(-1250, -5050, 140, 140, 52, 20); SOL(-1250, -5050, 36, 140, 330, 20);
  S(cart(1, 2), 1450, -4950, 0, 155); SOL(1450, -4950, 240, 140, 150, 155);
  for (const [x, r, sd] of [[-2200, 200, 1], [-1500, 160, 2], [1900, 180, 3], [3400, 220, 4], [4600, 180, 5], [-4600, 200, 6]]) { const y = -4370 - r; S(hedgeLump(r, 0x5a4e3a, 0, sd), x, y, 0, sd * 40); round(x, y, r * 0.9, r * 1.2); }

  // ---- the outer court: the founder on his plinth by the road, his hood broken off; the guest house, its chimney stack
  // still standing at its west end
  S(founder(1), -700, -3400, 0, -60); SOL(-700, -3400, 144, 144, 110, -60); round(-700, -3400, 50, 380);
  const GH = { h: 460, t: 90, ruin: 0.55 };
  wallX(-3900, -3345, -2055, { ...GH, seed: 51, holes: [{ at: -2700, w: 360, z0: 0, z1: 280, k: 'r' }, { at: -3050, w: 110, z0: 180, z1: 300, k: 'r' }] });
  wallX(-3200, -3345, -2055, { ...GH, seed: 52, holes: [{ at: -2450, w: 360, z0: 0, k: 'v', sp: 0.6 }, { at: -2950, w: 110, z0: 180, z1: 300, k: 'r' }] });
  wallY(-3300, -3855, -3245, { ...GH, h: 520, seed: 53, ruin: 0.3 });
  wallY(-2100, -3855, -3245, { ...GH, seed: 54, holes: [{ at: -3550, w: 360, z0: 0, z1: 280, k: 'r' }] });
  wallY(-3180, -3655, -3445, { h: 980, t: 150, seed: 55, ruin: 0.04, holes: [{ at: -3550, w: 120, z0: 0, z1: 120, k: 'q' }] });
  Box(V(-3248, -3550, 60), V(14, 118, 118), 0x1e1c1a, false, false);
  for (const [x, y, L, yw, sd] of [[-2700, -3600, 520, 20, 1], [-2500, -3500, 440, 100, 2]]) { S(charBeam(L, 40, sd), x, y, 0, yw); body(x, y, L, 40, 36, yw); }

  // ---- the fishponds in the court's east corner: long kerbed ponds, the water in them black and still, dead reeds
  for (const [x, y, w, d, sd] of [[3900, -3650, 1500, 520, 1], [3900, -2700, 1500, 440, 2]]) {
    S(pondKerb(w, d), x, y, 0, 0); Box(V(x, y, 1.6), V(w, d, 1), 0x262822, false, false);
    for (let i = 0; i < 16; i++) { const e = i % 2 ? 1 : -1, px = x + e * (w / 2 - rr(40, 260)), py = y + rr(-d / 2 + 50, d / 2 - 50); const rh = pick([100, 120, 140]); S(deadReeds(rh, i + sd), px, py, 0, rr(0, 360)); round(px, py, 24, rh, 0, false); navBand(px, py, 48, 48); } }

  // ---- the church -------------------------------------------------------------------------------------------------
  // the west front: the great door, the great window over it (its tracery whole), the aisles' windows either side, its
  // gable broken at the peak, buttressed
  wallY(-2600, 600, 2600, { h: 700, peak: 1150, t: 140, seed: 61, ruin: 0.08, str: [820], holes: [{ at: 1600, w: 400, z0: 0, z1: 380, k: 'p' }, { at: 1600, w: 560, z0: 900, z1: 1240, k: 'p' }, { at: 875, w: 150, z0: 260, z1: 470, k: 'p' }, { at: 2325, w: 150, z0: 260, z1: 470, k: 'p' }],
    butt: [{ at: 1150, side: 1, d: 160, w: 120 }, { at: 2050, side: 1, d: 160, w: 120 }, { at: 660, side: 1, d: 120, w: 110 }, { at: 2540, side: 1, d: 120, w: 110 }] });
  traceryAt(-2600, 1600, 90, 560, 900, 1240, 140, 0, 3);
  // the nave's north arcade, still standing to its clerestory: pointed arches on clustered piers, a string course, a
  // window over every bay
  wallX(2050, -2530, -530, { h: 1320, t: 110, seed: 62, ruin: 0.22, str: [870], holes: NB.map((x) => ({ at: x, w: 420, z0: 0, z1: 430, k: 'p' })).concat(NP.map((x) => ({ at: x, w: 82, z0: 0, z1: 430, k: 'q' })), NB.map((x) => ({ at: x, w: 150, z0: 980, z1: 1120, k: 'p' }))) });
  NP.forEach((x, i) => pierAt(x, 2050, 430, 56, true, i + 1));
  // the south arcade fell: stumps of its piers, their drums and the stones of its arches across the floor; a stub of it
  // against the west front
  [[NP[0], 520], [NP[1], 240], [NP[2], 660]].forEach(([x, h], i) => pierAt(x, 1150, h, 56, false, i + 4));
  wallX(1150, -2530, -2440, { h: 880, t: 110, seed: 63, ruin: 0.3 });
  for (const [x, y, n, yw, sd] of [[-1760, 1330, 4, 12, 1], [-1240, 930, 3, -24, 2]]) { S(fallenDrums(n, 56, sd), x, y, 0, yw); body(x, y, drumsLen(n, 56) + 10, 130, 112, yw); }
  for (const [x, y, r, sd] of [[-1525, 1260, 200, 2], [-2240, 1080, 160, 3], [-1020, 1290, 140, 4]]) { S(rubble(r, sd), x, y, 0, sd * 40); round(x, y, r * 0.62, rubbleH(r)); }
  // the aisles' outer walls: the south one under the cloister's north walk (its two doors into it), the north one
  // buttressed, its door to the graves and a breach where it fell
  wallX(650, -2530, -455, { h: 650, t: 100, seed: 64, ruin: 0.3, holes: [{ at: NB[0], w: 360, z0: 0, z1: 300, k: 'r' }, { at: NB[3], w: 360, z0: 0, z1: 300, k: 'r' }, { at: NB[1], w: 150, z0: 260, z1: 470, k: 'p' }, { at: NB[2], w: 150, z0: 260, z1: 470, k: 'p' }] });
  wallX(2550, -2530, -455, { h: 680, t: 100, seed: 65, ruin: 0.35, holes: [{ at: NB[0], w: 150, z0: 260, z1: 470, k: 'p' }, { at: NB[1], w: 360, z0: 0, z1: 320, k: 'p' }, { at: NB[2], w: 340, z0: 0, k: 'v', sp: 0.7 }, { at: NB[3], w: 150, z0: 260, z1: 470, k: 'p' }],
    butt: NP.map((x) => ({ at: x, side: 1, d: 120, w: 110 })) });
  // the crossing: its four great piers, the west arch of the tower still standing on two of them with a wall of the tower
  // over it to its belfry; the other two broken off, the tower fallen between them
  pierAt(-400, 1150, 820, 100, true, 1); pierAt(-400, 2050, 820, 100, true, 2); pierAt(500, 1150, 640, 100, false, 3); pierAt(500, 2050, 980, 100, false, 4);
  wallY(-400, 1150, 2050, { h: 2400, t: 150, fall: [0.72, 1], seed: 66, ruin: 0.08, holes: [{ at: 1600, w: 680, z0: 0, z1: 820, k: 'p' }, { at: 1205, w: 110, z0: 0, z1: 820, k: 'q' }, { at: 1995, w: 110, z0: 0, z1: 820, k: 'q' }, { at: 1820, w: 150, z0: 1950, z1: 2120, k: 'r' }, { at: 1400, w: 150, z0: 1950, z1: 2120, k: 'r' }] });
  // the transepts: their ends gabled, a door in each to the graves and the cloister, windows; the north one's east wall
  // with a door out to the graves, the south one's broken through
  wallY(-400, 2500, 3245, { h: 1000, t: 110, seed: 67, ruin: 0.35, holes: [{ at: 2920, w: 160, z0: 300, z1: 560, k: 'p' }] });
  wallY(500, 2190, 3245, { h: 1000, t: 110, seed: 68, ruin: 0.4, holes: [{ at: 2450, w: 160, z0: 300, z1: 560, k: 'p' }, { at: 2900, w: 360, z0: 0, z1: 300, k: 'p' }] });
  wallX(3300, -455, 555, { h: 1100, peak: 300, t: 110, seed: 69, ruin: 0.3, holes: [{ at: 50, w: 320, z0: 700, z1: 950, k: 'p' }, { at: 50, w: 360, z0: 0, z1: 300, k: 'p' }], butt: [{ at: -400, side: 1, d: 120, w: 110 }, { at: 500, side: 1, d: 120, w: 110 }] });
  wallY(-400, -45, 700, { h: 1000, t: 110, seed: 70, ruin: 0.4, holes: [{ at: 300, w: 360, z0: 0, z1: 300, k: 'r' }] });
  wallY(500, -45, 1014, { h: 1000, t: 110, seed: 71, ruin: 0.45, holes: [{ at: 150, w: 160, z0: 300, z1: 560, k: 'p' }, { at: 650, w: 340, z0: 0, k: 'v', sp: 0.7 }] });
  wallX(-100, -455, 555, { h: 1050, peak: 300, t: 110, seed: 72, ruin: 0.35, holes: [{ at: 50, w: 300, z0: 520, z1: 820, k: 'p' }] });
  // the choir: its tall windows, a door north to the graves, its south wall broken through; the east wall with what is
  // left of its great window's tracery; the high altar under it, the founder's tomb before it
  wallX(2050, 636, 2065, { h: 1100, t: 110, seed: 73, ruin: 0.35, holes: [{ at: 800, w: 170, z0: 380, z1: 760, k: 'p' }, { at: 1300, w: 360, z0: 0, z1: 320, k: 'p' }, { at: 1780, w: 170, z0: 380, z1: 760, k: 'p' }], butt: [1050, 1540, 2010].map((x) => ({ at: x, side: 1, d: 120, w: 110 })) });
  wallX(1150, 636, 2065, { h: 1100, t: 110, seed: 74, ruin: 0.4, holes: [{ at: 800, w: 170, z0: 380, z1: 760, k: 'p' }, { at: 1300, w: 340, z0: 0, k: 'v', sp: 0.8 }, { at: 1780, w: 170, z0: 380, z1: 760, k: 'p' }], butt: [1050, 1540, 2010].map((x) => ({ at: x, side: -1, d: 120, w: 110 })) });
  wallY(2000, 1205, 1995, { h: 1300, peak: 400, t: 130, seed: 75, ruin: 0.12, holes: [{ at: 1600, w: 520, z0: 480, z1: 1020, k: 'p' }], butt: [{ at: 1250, side: -1, d: 140, w: 110 }, { at: 1950, side: -1, d: 140, w: 110 }] });
  traceryAt(2000, 1600, 90, 520, 480, 1020, 130, 2, 3);
  S(highAltar(), 1770, 1600, 0, 180); SOL(1770, 1600, 320, 240, 40, 180); SOL(1790, 1600, 108, 200, 114, 180);
  S(tombChest(2), 1250, 1600, 0, 180); SOL(1250, 1600, 236, 104, 80, 180);
  // tombs in the transepts, abbots' slabs in the floor
  for (const [x, y, sd] of [[-80, 2950, 1], [300, 2950, 3]]) { S(tombChest(sd), x, y, 0, 0); SOL(x, y, 236, 104, 80, 0); }
  // the church's floor: flags, many lifted; black with soot toward the crossing
  floor(-2530, -455, 700, 2500, 1, 0.16, 0.7); floor(-345, 445, -45, 3245, 2, 0.22, 0.5); floor(445, 1935, 1205, 1995, 4, 0.14, 0.2);
  // the roof came down burning: its timbers lie across the nave and the aisles, one leans on the north arcade
  for (const [x, y, L, yw, sd] of [[-2050, 1750, 760, 20, 1], [-1250, 1520, 640, -15, 2], [-760, 2440, 520, 0, 3], [-1950, 2440, 480, 178, 4], [-2120, 760, 420, 8, 5], [950, 1750, 560, 20, 6], [120, 2600, 500, 75, 7], [50, 300, 460, 30, 8]]) { S(charBeam(L, 40, sd), x, y, 0, yw); body(x, y, L, 40, 36, yw); }
  { const tl = 50, L = 580, x = NP[1], y = 1600, yw = 90, h = 36, c = Math.cos(tl * D2R), sn = Math.sin(tl * D2R); S(charBeam(L, 40, 9, tl), x, y, 0, yw);
    for (let i = 0; i < 6; i++) { const P = [i / 6, (i + 1) / 6].flatMap((t) => [-1, 1].map((e) => [L * t * c + (e - 1) * (h / 2) * -sn, L * t * sn + (e + 1) * (h / 2) * c])), u0 = Math.min(...P.map((q) => q[0])), u1 = Math.max(...P.map((q) => q[0])), z0 = Math.max(0, Math.min(...P.map((q) => q[1]))), z1 = Math.max(...P.map((q) => q[1])), [px, py] = at(x, y, yw, (u0 + u1) / 2, 0); body(px, py, u1 - u0, 40, z1 - z0, yw, z0); } }

  // ---- the heart of the Char: out of the tower's rubble in the crossing, the bell fallen beside it
  const [HX, HY] = AL.heart, blightAt = [];
  S(rubble(340, 7), HX - 20, HY + 10, 0, 20); round(HX - 20, HY + 10, 340 * 0.6, rubbleH(340));
  S(blightMass(430, 3, 'char'), HX + 30, HY, 0, 30); round(HX + 30, HY, 430 * 0.62, 430 * 0.55); blightAt.push([HX + 30, HY, 430]);
  S(bell(70), 300, 1330, 0, 30); round(300, 1330, 80, 130);
  for (const [dx, dy, r] of [[-330, 360, 50], [330, 300, 45], [280, -330, 55]]) { S(puffballs(r, Math.abs(dx) % 7), HX + dx, HY + dy, 0, rr(0, 360)); round(HX + dx, HY + dy, r * 1.5, r * 1.2); }
  Lamp(V(HX + 60, HY + 30, 180), EMBER, 2.2, 1500, false); Lamp(V(HX - 120, HY - 60, 70), EMBER, 2.2, 700, false); Glow(V(HX + 40, HY + 10, 140), V(22, 22, 26), CHAR_GLOW, 2);

  // ---- the cloister ---------------------------------------------------------------------------------------------
  // its arcades round the garth: round arches on paired colonnettes over a low wall, a wide opening in the middle of
  // each side; the south one half fallen
  const cloArc = (len, n, pw) => { const bw = (len - 120) / n, mid = []; for (let k = 0; k < n; k++) mid.push(-len / 2 + 60 + bw * (k + 0.5)); return { bw, mid, piers: mid.slice(0, -1).map((m) => m + bw / 2), pw }; };
  const cloHoles = (L, m, breach) => { const { bw, mid, piers, pw } = L, H = []; mid.forEach((s, k) => { if (k === 2 || k === 3 || (breach && k >= 4)) return; H.push({ at: m + s, w: bw - pw, z0: 70, z1: 245, k: 'r' }); });
    H.push({ at: m, w: 2 * bw - pw, z0: 0, z1: 245, k: 'r' }); piers.forEach((s, k) => { if (k === 2 || (breach && k >= 3)) return; H.push({ at: m + s, w: pw, z0: 70, z1: 245, k: 'q', col: 2 }); }); if (breach) H.push({ at: m + mid[4] + bw / 2, w: 380, z0: 0, k: 'v', sp: 0.5 }); return H; };
  const CA = { h: 500, t: 60 }, LX = cloArc(1360, 6, 50);   // the east and west sides run between the north and south ones: the same bays
  wallX(200, -2180, -820, { ...CA, seed: 81, ruin: 0.22, holes: cloHoles(LX, -1500) });
  wallX(-1100, -2180, -820, { ...CA, seed: 82, ruin: 0.5, holes: cloHoles(LX, -1500, true) });
  wallY(-2150, -1070, 170, { ...CA, seed: 83, ruin: 0.3, holes: cloHoles(LX, -450) });
  wallY(-850, -1070, 170, { ...CA, seed: 84, ruin: 0.28, holes: cloHoles(LX, -450) });
  // the walks' floors; the garth's dead grass, its well, a dead pear tree
  floor(-2550, -455, 230, 600, 5, 0.1); floor(-2550, -455, -1495, -1130, 6, 0.14); floor(-2550, -2180, -1130, 230, 7, 0.1); floor(-820, -455, -1130, 230, 8, 0.12);
  patch(-1500, -450, 1200, 0x5e5644);
  S(well(70), AL.garth[0], AL.garth[1], 0, 20); round(AL.garth[0], AL.garth[1], 100, 80); for (const sy of [-1, 1]) { const [px, py] = at(AL.garth[0], AL.garth[1], 20, 0, sy * 83); round(px, py, 10, 236); }
  S(deadTree(650, 2), -1180, -120, 0, 40); trunk(-1180, -120, deadTrunk(650), 325);
  // the outer walls: the west range's east wall (two doors from the west walk); the long south wall under the refectory
  // and the chapter house (the refectory's door, the kitchen door, the range's breach, the chapter house's)
  wallY(-2600, -1495, 600, { h: 720, t: 100, seed: 85, ruin: 0.35, holes: [{ at: -900, w: 360, z0: 0, z1: 290, k: 'r' }, { at: 150, w: 360, z0: 0, z1: 290, k: 'r' }, { at: -380, w: 120, z0: 280, z1: 440, k: 'r' }] });
  wallX(-1550, -3455, -1300, { h: 760, t: 110, seed: 86, ruin: 0.35, holes: [{ at: -3000, w: 340, z0: 0, k: 'v', sp: 0.6 }, { at: -2450, w: 360, z0: 0, z1: 290, k: 'r' }, { at: -1550, w: 360, z0: 0, z1: 300, k: 'p' }, { at: -2000, w: 150, z0: 420, z1: 580, k: 'p' }] });
  wallX(-1550, -1300, 855, { h: 760, t: 110, seed: 87, ruin: 0.4, holes: [{ at: -1080, w: 150, z0: 420, z1: 580, k: 'p' }, { at: 300, w: 340, z0: 0, k: 'v', sp: 0.6 }] });
  // the west range: the brothers' cellars, roofless, its vault fallen
  wallY(-3400, -1495, 600, { h: 650, t: 100, seed: 88, ruin: 0.45, holes: [{ at: -1000, w: 360, z0: 0, z1: 290, k: 'r' }, { at: 250, w: 360, z0: 0, z1: 290, k: 'r' }, { at: -1330, w: 110, z0: 260, z1: 420, k: 'r' }, { at: -400, w: 110, z0: 260, z1: 420, k: 'r' }, { at: 470, w: 110, z0: 260, z1: 420, k: 'r' }] });
  wallX(650, -3450, -2670, { h: 900, peak: 200, t: 100, seed: 89, ruin: 0.3, holes: [{ at: -3060, w: 360, z0: 0, z1: 300, k: 'r' }, { at: -3060, w: 140, z0: 560, z1: 760, k: 'r' }] });
  floor(-3350, -2650, -1495, 600, 9, 0.3);
  for (const [x, y, r, sd] of [[-3240, -700, 170, 5], [-2780, -1250, 140, 6]]) { S(rubble(r, sd), x, y, 0, sd * 30); round(x, y, r * 0.62, rubbleH(r)); }
  { const [x, y, L, yw] = [-3000, 300, 560, 80]; S(charBeam(L, 40, 10), x, y, 0, yw); body(x, y, L, 40, 36, yw); }
  // the chapter house: three round arches from the east walk (a door between two windows), its stone bench round the
  // walls, the abbots' slabs in its floor; a door out to the slype, broken through to the south
  wallX(-600, -455, 855, { h: 700, t: 110, seed: 90, ruin: 0.45, holes: [{ at: -100, w: 160, z0: 260, z1: 470, k: 'r' }, { at: 300, w: 160, z0: 260, z1: 470, k: 'r' }, { at: 650, w: 360, z0: 0, z1: 290, k: 'r' }] });
  wallY(-400, -1495, -655, { h: 650, t: 110, seed: 91, ruin: 0.22, holes: [{ at: -1375, w: 140, z0: 90, z1: 280, k: 'r' }, { at: -1075, w: 360, z0: 0, z1: 280, k: 'r' }, { at: -775, w: 140, z0: 90, z1: 280, k: 'r' }] });
  wallY(800, -1495, -655, { h: 800, peak: 200, t: 110, seed: 92, ruin: 0.3, holes: [{ at: -1075, w: 300, z0: 280, z1: 560, k: 'p' }] });
  floor(-345, 745, -1495, -655, 10, 0.12);
  for (const [x, y, len, yw] of [[57, -680, 800, 0], [-112, -1470, 466, 0], [612, -1470, 266, 0], [720, -1075, 740, 90]]) { S(ledge(len), x, y, 0, yw); body(x, y, len, 50, 40, yw); }
  for (const [x, sd] of [[60, 0], [260, 1], [460, 2]]) S(graveSlab(sd), x, -1060, 0, 0);
  // the refectory: the brothers' hall south of the cloister, its tables burnt to their trestles
  wallX(-2600, -2355, -745, { h: 760, t: 110, seed: 93, ruin: 0.4, holes: [{ at: -2000, w: 170, z0: 280, z1: 540, k: 'p' }, { at: -1550, w: 170, z0: 280, z1: 540, k: 'p' }, { at: -1100, w: 360, z0: 0, z1: 300, k: 'p' }], butt: [{ at: -1780, side: -1, d: 100, w: 100 }, { at: -1330, side: -1, d: 100, w: 100 }] });
  wallY(-2300, -2545, -1605, { h: 700, t: 110, seed: 94, ruin: 0.35, holes: [{ at: -2100, w: 360, z0: 0, z1: 290, k: 'r' }] });
  wallY(-800, -2545, -1605, { h: 850, peak: 250, t: 110, seed: 95, ruin: 0.3, holes: [{ at: -2075, w: 260, z0: 300, z1: 560, k: 'p' }] });
  floor(-2245, -855, -2545, -1605, 11, 0.18);
  for (const [x, y, L, yw, sd] of [[-1700, -2280, 700, 2, 11], [-1600, -1880, 640, -4, 12], [-1150, -2250, 300, 70, 13], [-2050, -1850, 360, 110, 14]]) { S(charBeam(L, 40, sd), x, y, 0, yw); body(x, y, L, 40, 36, yw); }

  // ---- the infirmary: a long hall for the old and the sick, the stumps of its arcade down the middle, its beds burnt to
  // their frames; the little window of its chapel at the east end
  wallX(-350, 1350, 3350, { h: 650, t: 100, seed: 101, ruin: 0.45, holes: [{ at: 1700, w: 150, z0: 250, z1: 450, k: 'r' }, { at: 2100, w: 360, z0: 0, z1: 290, k: 'r' }, { at: 2550, w: 150, z0: 250, z1: 450, k: 'r' }, { at: 3000, w: 150, z0: 250, z1: 450, k: 'r' }], butt: [{ at: 1900, side: 1, d: 100, w: 100 }, { at: 2780, side: 1, d: 100, w: 100 }] });
  wallX(-1250, 1350, 3350, { h: 600, t: 100, seed: 102, ruin: 0.55, holes: [{ at: 1700, w: 150, z0: 250, z1: 450, k: 'r' }, { at: 2200, w: 150, z0: 250, z1: 450, k: 'r' }, { at: 2750, w: 340, z0: 0, k: 'v', sp: 0.7 }] });
  wallY(1400, -1200, -400, { h: 750, peak: 200, t: 100, seed: 103, ruin: 0.3, holes: [{ at: -800, w: 360, z0: 0, z1: 300, k: 'p' }] });
  wallY(3300, -1200, -400, { h: 900, peak: 300, t: 100, seed: 104, ruin: 0.2, holes: [{ at: -800, w: 280, z0: 300, z1: 560, k: 'p' }] });
  traceryAt(3300, -800, 90, 280, 300, 560, 100, 0, 2);
  floor(1450, 3250, -1200, -400, 12, 0.2);
  pierAt(1950, -800, 300, 45, false, 5); pierAt(2500, -800, 540, 45, false, 6);
  for (const [x, y, yw, sd] of [[1750, -470, 0, 1], [2300, -470, 0, 2], [2850, -1130, 0, 3], [3060, -470, 0, 4]]) { S(cot(sd), x, y, 0, yw); body(x, y, 194, 90, 34, yw); }
  // the physic garden: raised beds of herbs dead on their stalks, a sundial between them, the stubs of its low wall
  for (const [x, y, sd] of [[1400, -2400, 1], [1900, -2400, 2], [2400, -2400, 3], [1400, -2000, 4], [1900, -2000, 5], [2400, -2000, 6]]) { S(herbBed(320, 180, sd), x, y, 0, 0); body(x, y, 320, 180, 84); }
  S(sundial(), 1900, -2200, 0, 30); SOL(1900, -2200, 68, 68, 16, 30); round(1900, -2200, 18, 120);
  wallX(-2760, 1100, 1560, { h: 220, t: 60, seed: 105, ruin: 0.3 }); wallY(1130, -2730, -2400, { h: 220, t: 60, seed: 106, ruin: 0.35 });
  wallX(-1640, 2280, 2720, { h: 220, t: 60, seed: 107, ruin: 0.3 }); wallY(2690, -1950, -1670, { h: 220, t: 60, seed: 108, ruin: 0.4 });

  // ---- the dovecote in the north-east meadow: a round tower of stone, its roof gone, broken open on its south side
  { const o = { r: 300, h: 720, t: 80, seed: 3, ruin: 0.3, gap: [270, 36, 0.03], nests: 5 }, [x, y] = AL.dove; S(ringWall(o), x, y, 0, 0); for (const [bx, by, len, yw, h] of ringBodies(o)) body(x + bx, y + by, len, o.t, h, yw); }

  // ---- the brothers' graves: rows of wooden crosses, some burnt, some fallen over, here and there a stone; the tall
  // cross in the east burial ground, abbots' tombs by the choir, dead yews
  S(stoneCross(440), AL.cross[0], AL.cross[1], 0, 0); SOL(AL.cross[0], AL.cross[1], 140, 140, 52); SOL(AL.cross[0], AL.cross[1], 36, 36, 460);
  for (const [x, y, sd] of [[2450, 1330, 0], [2450, 1870, 1]]) { S(tombChest(sd), x, y, 0, 0); SOL(x, y, 236, 104, 80, 0); }
  const yews = [[-1000, 3650, 900, 4], [4400, 3150, 900, 0]];
  for (const [x, y, h, sd] of yews) { S(deadTree(h, sd), x, y, 0, sd * 50); trunk(x, y, deadTrunk(h), h * 0.5); }
  const graveOK = (x, y) => PATHS.every((P) => lineDist(x, y, P) > 260) && !BLD.some(([a, b, c, d]) => x > a - 120 && x < b + 120 && y > c - 120 && y < d + 120) && Math.hypot(x - AL.floor[0], y - AL.floor[1]) > AL.floorR + 250 && Math.hypot(x - AL.cross[0], y - AL.cross[1]) > 260 && yews.every(([a, b]) => Math.hypot(x - a, y - b) > 220) && Math.hypot(x - AL.dove[0], y - AL.dove[1]) > 520;
  const graves = [];
  for (let y = 2920; y <= 3800; y += 420) for (let x = -2450; x <= -650; x += 380) graves.push([x + rr(-30, 30), y + rr(-24, 24)]);
  for (let y = 900; y <= 3600; y += 420) for (let x = 2700; x <= 4800; x += 380) graves.push([x + rr(-30, 30), y + rr(-24, 24)]);
  const gItems = [];
  graves.forEach(([x, y], i) => { if (!graveOK(x, y) || rnd() < 0.2) return; const stone = rnd() < 0.26, sd = i;
    gItems.push({ x, y, half: 20, place: () => { if (stone) { S(headstone(sd), x - 60, y, 0, 0); SOL(x - 60, y, 20, 64, 100, 0); navBand(x - 60, y, 20, 64); } else { const h = pick([110, 130, 150]), lean = pick([0, 0, 6, -8, 12, -14]), dx = h * Math.cos(lean * D2R) * Math.sin(0.6 * lean * D2R), dy = -h * Math.sin(lean * D2R); S(graveCross(h, sd, lean), x, y, 0, 0); SOL(x - 62 + dx / 2, y + dy / 2, 16 + Math.abs(dx), 64 + Math.abs(dy), h, 0); navBand(x - 62 + dx / 2, y + dy / 2, 16 + Math.abs(dx), 64 + Math.abs(dy)); } } }); });

  // ---- the dead orchard west of the church and round the court's west side: old fruit trees in rows, dead
  const trees = [];
  const treeOK = (x, y, m) => PATHS.every((P) => lineDist(x, y, P) > 280 + m) && !BLD.some(([a, b, c, d]) => x > a - 160 - m && x < b + 160 + m && y > c - 160 - m && y < d + 160 + m) && Math.abs(x) < hx - 260 && Math.abs(y) < hy - 260;
  for (let x = -5000; x <= -4000; x += 480) for (let y = -3950; y <= 5200; y += 520) { const px = x + rr(-60, 60), py = y + rr(-60, 60), h = pick([550, 650]), sd = Math.abs(Math.round(px + py)) % 5; if (!treeOK(px, py, 40) || rnd() < 0.12) continue;
    trees.push({ x: px, y: py, half: deadTrunk(h), circle: true, place: () => { S(deadTree(h, sd), px, py, 0, rr(0, 360)); trunk(px, py, deadTrunk(h), h * 0.5); } }); }
  // and wild dead trees about the grounds: the meadow north-east, by the ponds, along the walls
  for (let k = 0; k < 400 && trees.length < 62; k++) { const px = rr(-hx + 400, hx - 400), py = rr(-hy + 1700, hy - 400), h = pick([900, 1100]); if (!treeOK(px, py, 120) || Math.hypot(px - AL.floor[0], py - AL.floor[1]) < AL.floorR + 400 || Math.hypot(px - AL.dove[0], py - AL.dove[1]) < 600 || graves.some(([gx, gy]) => Math.hypot(px - gx, py - gy) < 220) || (px > -4100 && px < 2700 && py > 2700) || trees.some((t) => Math.hypot(px - t.x, py - t.y) < 700)) continue;
    const sd = k % 5; trees.push({ x: px, y: py, half: deadTrunk(h), circle: true, place: () => { S(deadTree(h, sd), px, py, 0, rr(0, 360)); trunk(px, py, deadTrunk(h), h * 0.5); } }); }
  for (const p of K.plan(trees.concat(gItems), AL.spawn)) p.place();

  // ---- the veins of the Char out of the heart: down the nave and out of the west door, through the transepts' doors,
  // into the choir, through the cloister to the garth and the west range, out east to the infirmary and the graves
  const veins = [[[HX, HY], [-1000, 1640], [-2000, 1560], [-2560, 1600], [-3300, 1680]], [[HX, HY], [100, 2600], [50, 3360], [-300, 4000]], [[HX, HY], [-150, 900], [-400, 300], [-900, -200], [-1500, -450]],
    [[HX, HY], [900, 1660], [1700, 1600]], [[HX, HY], [350, 1000], [500, 650], [1200, 0], [2100, -500], [2400, -800]], [[HX, HY], [900, 1900], [1300, 2050], [1350, 2500], [2600, 2700]], [[-1500, -450], [-2300, -300], [-2600, 150], [-3000, -150]]];
  const vpts = veins.map((L) => { const out = []; for (let j = 0; j < L.length - 1; j++) { const [x0, y0] = L[j], [x1, y1] = L[j + 1]; for (let i = 0; i < 4; i++) { const t = i / 4; out.push([x0 + (x1 - x0) * t + Math.sin((j + t) * 3.1 + x0) * 60, y0 + (y1 - y0) * t + Math.cos((j + t) * 2.7 + y0) * 60]); } } out.push(L[L.length - 1]); return out; });
  M.Shape('abveins', () => { const pos = [], col = [], idx = []; for (const pts of vpts) { const n = pts.length; for (let j = 0; j < n - 1; j++) { const [x0, y0] = pts[j], [x1, y1] = pts[j + 1], L = Math.hypot(x1 - x0, y1 - y0), m = Math.max(2, Math.round(L / 40)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
    for (let i = 0; i <= m; i++) { const t = i / m, wv = Math.sin((x0 + i * 40) * 0.011 + j) * 40 + Math.sin((y0 + i * 40) * 0.023) * 16, px = x0 + (x1 - x0) * t + nx * wv, py = y0 + (y1 - y0) * t + ny * wv, w = 11 * (1 - ((j + t) / n) * 0.7), hot = Math.sin(px * 0.05 + py * 0.03) > 0.9;
      for (const e of [-1, 1]) { pos.push(px + nx * w * e, py + ny * w * e, 2.8); if (hot) col.push(0.8, 0.32, 0.1); else col.push(0.13, 0.1, 0.1); } }
    const b = pos.length / 3 - (m + 1) * 2; for (let i = 0; i < m; i++) { const a = b + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } } } return { pos, col, idx }; }, V(0, 0, 0), R(0, 0, 0));
  for (const pts of vpts) for (let j = 3; j < pts.length; j += 3) { const [vx, vy] = pts[j]; if (blightAt.some(([bx, by, br]) => Math.hypot(vx - bx, vy - by) < br + 120) || !K.clear(vx, vy, 220)) continue; const ts = pick([0.8, 1, 1.2]); S(toadstoolCluster(ts, RC.cap, pick([1, 2, 3])), vx, vy, 0, rr(0, 360)); round(vx, vy, 22 * ts, 40 * ts); }

  // ---- the way on: the flagged floor at the north end where the stations come up, out through the north gate
  { const [x, y] = AL.floor; S(flagFloor(AL.floorR, 5, 0x3e3a34, false, [0x7e7a72, 0x74706a, 0x8a857c, 0x6e6a64]), x, y, 0.4, 0); }

  // ---- the grounds' dead grass, in tufts under shin height, never on a floor or a path
  { const nav = O.GM, [cx, cy] = [O.cx, O.cy], ok = (x, y) => { const [ix, iy] = nav.cellOf(cx + x, cy + y); return nav.navFree(ix, iy) && K.clear(x, y, 40); };
    let n = 0; for (let k = 0; k < 3000 && n < 420; k++) { const x = rr(-hx + 150, hx - 150), y = rr(-hy + 150, hy - 150); if (!ok(x, y) || PATHS.some((P) => lineDist(x, y, P) < 190) || BLD.some(([a, b, c, d]) => x > a && x < b && y > c && y < d) || Math.hypot(x - AL.floor[0], y - AL.floor[1]) < AL.floorR + 80 || Math.hypot(x - AL.spawn[0], y - AL.spawn[1]) < 500) continue;
      S(deadTuft(pick([0.8, 1, 1.1]), pick([1, 2, 3, 4])), x, y, 0, rr(0, 360)); n++; } }

  // ---- beyond the wall (out of reach): dead woods and hills, the road on south and north
  for (let i = 0; i < 120; i++) { const side = i % 4, u = rr(-1, 1), d = rr(650, 3400), x = side < 2 ? (side ? 1 : -1) * (hx + d) : u * (hx + 2800), y = side < 2 ? u * (hy + 2800) : (side === 2 ? 1 : -1) * (hy + d); if (Math.abs(x) < 300 && Math.abs(y) > hy) continue;
    if (i % 3) S(farPine(pick([1800, 2200]), i % 3), x, y, 0, rr(0, 360)); else S(deadTree(pick([900, 1100]), i % 5), x, y, 0, rr(0, 360)); }
  path([[0, -5850], [0, -9000], [-200, -12000]], 330, 0x6a5e4c); path([[0, 5800], [80, 8600], [-160, 11000]], 330, 0x6a5e4c);
  for (const [x, y, rx, ry, h] of [[-13000, 0, 5000, 9000, 2200], [13500, 1500, 5500, 9000, 2400], [0, 14500, 9000, 4000, 2600], [-9000, -14000, 6000, 4000, 1800], [9000, -13500, 6000, 4000, 2000]]) S(bareHill(rx, ry, h, 0x4e483e), x, y, -40, 0);

  // where the Char's pools come up: in the nave, the garth, the graves, the orchard, the physic garden, the court
  const settle = ([x, y]) => { for (let r = 0; r <= 1600; r += 100) { const n = Math.max(1, Math.round(r / 50)); for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (Math.abs(px) < hx - 500 && Math.abs(py) < hy - 500 && K.clear(px, py, 430) && Math.hypot(px - AL.floor[0], py - AL.floor[1]) > AL.floorR + 400) return [Math.round(px), Math.round(py)]; } } return [x, y]; };
  const beds = [[-1600, 1600], [-1500, -450], [3300, 2900], [-4500, 1500], [1900, -2900], [-1400, -3500]].map(settle);
  return {
    spots: { spawn: AL.spawn, yaw: Math.PI, exit: [0, 5450], textYaw: -90, ammo: [650, -5300], ammoYaw: 90,
      bench: [-660, 5080], benchYaw: 0, box: [660, 4850], chest: [660, 4850], chestYaw: 180, press: [-660, 4580], pressYaw: 0 },
    keep: [[AL.floor[0], AL.floor[1], 900]],
    beds, bossAt: null,
  };
}

// ---- the air at the abbey: ash coming down slowly all the time, grey and pale; embers rising off the heart in the
// crossing. g: the game; A: the arena (its middle, half sizes).
export function abbeyAir(g, dt, A) {
  const c = g.camera.position, [cx, cy] = A.c; if (Math.abs(c.x - cx) > A.hx + 600 || Math.abs(c.z - cy) > A.hy + 600) return;
  const st = (abbeyAir.st ||= { a: 0, h: 0 });
  st.a += dt * 36; while (st.a > 1) { st.a -= 1; const a = Math.random() * 6.28, r = 260 + Math.pow(Math.random(), 1.6) * 2300, s = 8 + Math.random() * 7, w = 0.82 + Math.random() * 0.16;
    g.fx.add({ pos: new THREE.Vector3(c.x + Math.cos(a) * r, 120 + Math.random() * 1000, c.z + Math.sin(a) * r), vel: new THREE.Vector3((Math.random() - 0.5) * 50, -24 - Math.random() * 24, (Math.random() - 0.5) * 50), life: 10, size0: s, size1: s, c0: [0.86 * w, 0.84 * w, 0.82 * w, 0.92], fadeIn: 1.2, fadeOut: 1.5, tex: 'FX_Disc', kind: 'fx', glow: 0.2 }); }
  const hx0 = cx + AL.heart[0], hz0 = cy + AL.heart[1]; if (Math.hypot(c.x - hx0, c.z - hz0) < 4200) { st.h += dt * 12; while (st.h > 1) { st.h -= 1; const a = Math.random() * 6.28, r = 150 + Math.random() * 600;
    g.fx.add({ pos: new THREE.Vector3(hx0 + Math.cos(a) * r, 10 + Math.random() * 80, hz0 + Math.sin(a) * r), vel: new THREE.Vector3((Math.random() - 0.5) * 30, 60 + Math.random() * 100, (Math.random() - 0.5) * 30), life: 3.2, size0: 7, size1: 3, c0: [1, 0.48, 0.16, 1], c1: [1, 0.28, 0.08, 0], fadeIn: 0.2, fadeOut: 1, tex: 'FX_Disc', kind: 'fx', glow: 1 }); } }
}
