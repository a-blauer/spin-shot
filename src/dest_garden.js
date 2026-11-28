// The Weeping Garden, in The Rot: the garden the gnomes made for their dead of the Rot, walled in old brick, marble
// mourners along its walks. The Char came up under the Weeping Tree at its heart and the gardeners burned what they
// could to stop it; it has the garden now. You come in at the south gate (shut behind you), by the lodge, up the
// avenue of black weeping cherries to the lower garden: the long canal between two fountains, black water weeping from
// their bowls, the four parterres (two of them burnt), mourners at the canal's corners; the cross walk west into the
// maze of hedges (its north-east corner burnt, a gravel square at its heart with a mourner in it) and east to the
// glasshouse's side door (its glass half gone, dead palms in it, the Char's caps grown huge in its heat). South-west
// the rose garden: four beds round its sundial, rose arches over the walks between them, the roses gone over in one
// bed, burnt in two, the Char come up in the fourth; south-east the gardeners' yard (the bothy, sheds, frames, bins,
// hives). Up through the balustrade the great lawn and the Weeping
// Tree, its curtains of black strands, the mourners round it; the grotto west with its pool, the temple east. North
// the pergola walk, the clipped yews (some burnt), the lily pond and the dovecote, and the north gate: the way on,
// toward the Root. The boss comes on the lawn.
//
// Local frame (dest.js): +Y north, +X east, z up; the ground flat at z = 0.
import * as THREE from 'three';
import { V, R } from './mapkit.js';
import { destKit } from './dest_kit.js';
import { blightMass } from './dest_props.js';
import { flagFloor, rainBarrel } from './dest_props_wood.js';
import { RC, farPine, bareHill, giantCap, capStalk, puffballs, burntSnag, snagR } from './dest_props_rot.js';
import { gasLamp, parkBench } from './dest_props_town.js';
import { brickHouse, gardenShed } from './dest_props_works.js';
import { hiveBench, wheelbarrow, raisedBed } from './dest_props.js';
import { dovecote, DV } from './dest_props_vale.js';
import { sundial, ruinWall, wallBodies } from './dest_props_abbey.js';
import { lilies } from './village_props.js';
import { WG, wallPier, gatePier, ironGates, weepingCherry, cherryR, WT, weepingTree, hedge, urn, MOURN, mourner, fountain, BAL, balustrade, GH, glasshouse, RB, roseBush, RA, roseArch, deadPalm, grotto, pergola, TEMPLE, temple, deadBed, coldFrame, compostBins, pottingBench, topiary } from './dest_props_garden.js';
import { shapeB as shape } from './propkit.js';

export const GD = { spawn: [0, -5250], exit: [0, 5420], floor: [0, 4800], floorR: 800, tree: [0, 1500], heart: [0, 1265], arena: [0, 150],
  fountS: [0, -3650], fountN: [0, -950], balY: -350, glass: [3800, -2250], grotto: [-4300, 2000], temple: [4000, 1800], pond: [3500, 4650], rose: [-3800, -4600] };
const MAZE = [-5270, -2900, -3450, -1050], MN = 7;
const PARTS = [[-1500, -2800, 0], [1500, -2800, 1], [-1500, -1700, 1], [1500, -1700, 0]];   // the parterres: [x, y, burnt]
const BAL_RUNS = [[-4800, -3200], [-2600, -600], [600, 2600], [3200, 4800]];

export function buildGarden(M, O) {
  const { hx, hy } = O;
  const K = destKit(M, 83, O, { exactNav: true }), { S, body, round, trunk, patch, path, rnd, rr, lineDist, Box, Lamp, Glow } = K;
  const pick = (L) => L[Math.floor(rnd() * L.length)];
  const D2R = Math.PI / 180;
  const at = (x, y, yaw, u, v) => [x + u * Math.cos(yaw * D2R) - v * Math.sin(yaw * D2R), y + u * Math.sin(yaw * D2R) + v * Math.cos(yaw * D2R)];
  const LAMP = { r: 1, g: 0.78, b: 0.5 }, EMBER = { r: 1, g: 0.45, b: 0.16 }, CHAR_GLOW = 0xff5a22;
  const lit = (x, y, z, c = LAMP, r = 500) => Lamp(V(x, y, z), c, 2.2, r, false);
  const navBand = (x, y, w, d) => O.GM.NavBlockBox({ min: V(x - w / 2, y - d / 2, 0), max: V(x + w / 2, y + d / 2, 100) }, 1);
  const SPOT = [];   // things already standing (x, y, r): nothing scattered on them
  const keepOff = (x, y, m = 0) => SPOT.some(([sx, sy, sr]) => Math.hypot(x - sx, y - sy) < sr + m);

  // ---- the ground: the garden's soil gone grey, the lawns dull, ash where they burned it
  Box(V(0, 0, -60), V(hx * 2 + 24000, hy * 2 + 24000, 120), 0x4a4640, true, false);
  for (let i = 0; i < 46; i++) patch(rr(-hx + 300, hx - 300), rr(-hy + 300, hy - 300), rr(500, 1200), pick([0x524e46, 0x4e4a42, 0x56524a, 0x48443e]));
  patch(GD.tree[0], GD.tree[1], 5200, 0x545a48); for (let i = 0; i < 10; i++) patch(rr(-2400, 2400), rr(-200, 3200), rr(600, 1300), pick([0x5a604c, 0x50564a, 0x5e624e]));
  for (const [x, y, d] of [[1500, -2800, 1500], [-1500, -1700, 1500], [-4300, -1700, 1300], [GD.rose[0], GD.rose[1], 1600], [GD.glass[0], GD.glass[1], 1300], [0, 1300, 1800]]) patch(x, y, d, pick([0x3e3a36, 0x423e38, 0x3a3632]));

  // ---- the garden wall: old brick, coped, a pier every so often, broken down in two places; the gates south and
  // north between their great piers, shut
  const BRICK = { stone: WG.brick, stoneD: WG.brickD, soot: 0x3e3430, lichen: 0x5e5a46 }, GW = { h: 300, t: 60, co: 50, bl: 100, cope: true, pal: BRICK };
  const wall = (x0, y0, x1, y1, o) => { const len = Math.round(Math.hypot(x1 - x0, y1 - y0)), yaw = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI, mx = (x0 + x1) / 2, my = (y0 + y1) / 2, P = { ...GW, ...o, len }, B = wallBodies(P); S(ruinWall(P), mx, my, 0, yaw);
    for (const [s0, s1, z0, z1] of B.runs) { const [px, py] = at(mx, my, yaw, (s0 + s1) / 2, 0); body(px, py, s1 - s0, P.t, z1 - z0, yaw, z0); } };
  const piers = (x0, y0, x1, y1, skip = () => false) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.round(L / 700); for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n; if (skip(x, y)) continue; S(wallPier(340, 100, i), x, y, 0, 0); body(x, y, 100, 100, 340); } };
  const WX = 5300, WY = 5700;
  for (const s of [-1, 1]) { wall(-WX - 30, s * WY, -520, s * WY, { seed: s + 2 }); wall(520, s * WY, WX + 30, s * WY, { seed: s + 5 });
    piers(-WX + 700, s * WY, -700, s * WY); piers(700, s * WY, WX - 700, s * WY);
    S(gatePier(460, s + 2), -430, s * WY, 0, 0); S(gatePier(460, s + 3), 430, s * WY, 0, 0); body(-430, s * WY, 170, 170, 460); body(430, s * WY, 170, 170, 460);
    S(ironGates(700, 330), 0, s * WY, 0, 90); body(0, s * WY, 690, 20, 400); }
  wall(-WX, -WY + 30, -WX, 900, { seed: 11 }); wall(-WX, 900, -WX, 2700, { seed: 12, ruin: 0.4 }); wall(-WX, 2700, -WX, WY - 30, { seed: 13 });
  wall(WX, -WY + 30, WX, -1300, { seed: 14 }); wall(WX, -1300, WX, 400, { seed: 15, ruin: 0.35 }); wall(WX, 400, WX, WY - 30, { seed: 16 });
  for (const s of [-1, 1]) piers(s * WX, -WY + 700, s * WX, WY - 700, (x, y) => (s < 0 ? y > 1100 && y < 2500 : y > -1100 && y < 200));
  for (const s of [-1, 1]) for (const t of [-1, 1]) { S(wallPier(360, 120, 9), s * WX, t * WY, 0, 0); body(s * WX, t * WY, 120, 120, 360); }

  // ---- beyond the wall (out of reach): the Rot's dead woods, bare hills, the road both ways
  for (let i = 0; i < 150; i++) { const side = i % 4, u = rr(-1, 1), d = rr(400, 3800), x = side < 2 ? (side ? 1 : -1) * (hx + d) : u * (hx + 3200), y = side < 2 ? u * (hy + 3200) : (side === 2 ? 1 : -1) * (hy + d); if (Math.abs(x) < 500 && Math.abs(y) > hy) continue;
    S(farPine(pick([1600, 2000, 2400]), i), x, y, 0, rr(0, 360)); }
  path([[0, -5760], [0, -8000], [300, -11000]], 360, 0x6a6052, 0x7e786e); path([[0, 5760], [-200, 8200], [200, 11000]], 360, 0x6a6052, 0x7e786e);
  for (const [x, y, rx, ry, h] of [[-12500, 1000, 5000, 9000, 1500], [12500, -1000, 5000, 9000, 1700], [-2000, 14000, 9000, 4000, 1900], [8000, -13500, 6000, 4000, 1500], [-9000, -13000, 6000, 4000, 1400]]) S(bareHill(rx, ry, h, 0x4a453e), x, y, -40, 0);

  // ---- the walks: gravel, edged in stone; the avenue up from the gate, round the fountains, both sides of the canal,
  // across between the parterres and round them, through the balustrade and up to the tree, round the tree, on north
  // to the gate; the pergola walk
  const WALK = [], RINGS = [];
  const walk = (x0, x1, y0, y1) => WALK.push([Math.min(x0, x1), Math.max(x0, x1), Math.min(y0, y1), Math.max(y0, y1)]);
  const ringWalk = (cx, cy, r0, r1) => RINGS.push([cx, cy, r0, r1]);
  walk(-220, 220, -5670, -4100); ringWalk(...GD.fountS, 0, 640); ringWalk(...GD.fountN, 0, 640);
  for (const s of [-1, 1]) walk(s * 200, s * 600, -3700, -950);
  walk(-2900, 3100, -2350, -2150); walk(-220, 220, -330, 300);
  for (const [cx, cy] of PARTS) { walk(cx - 860, cx + 860, cy - 610, cy - 460); walk(cx - 860, cx + 860, cy + 460, cy + 610); walk(cx - 860, cx - 710, cy - 460, cy + 460); walk(cx + 710, cx + 860, cy - 460, cy + 460); walk(cx - 30, cx + 30, cy - 460, cy + 460); walk(cx - 700, cx + 700, cy - 25, cy + 25); }
  ringWalk(...GD.tree, 1420, 1640); walk(-220, 220, 3120, 4050); walk(-3300, 3300, 3720, 4080);
  walk(-1200, 1200, -460, -240);
  { const [rx, ry] = GD.rose; ringWalk(rx, ry, 0, 260); walk(rx - 120, rx + 120, ry - 960, ry + 960); walk(rx - 960, rx + 960, ry - 120, ry + 120); }
  { const cw = (MAZE[1] - MAZE[0]) / MN, ch = (MAZE[3] - MAZE[2]) / MN; walk(MAZE[0] + 2 * cw + 40, MAZE[0] + 5 * cw - 40, MAZE[2] + 2 * ch + 40, MAZE[2] + 5 * ch - 40); }
  const onWalk = (x, y, m = 0) => WALK.some(([a, b, c, d]) => x > a - m && x < b + m && y > c - m && y < d + m) || RINGS.some(([cx, cy, r0, r1]) => { const d = Math.hypot(x - cx, y - cy); return d > r0 - m && d < r1 + m; });
  M.Shape('wgwalks', shape((G) => {
    const quad = (ax, ay, bx, by, z, c) => { const k = G.n; G.v(ax, ay, z, c); G.v(bx, ay, z, c); G.v(bx, by, z, c); G.v(ax, by, z, c); G.idx.push(k, k + 1, k + 2, k, k + 2, k + 3); };
    WALK.forEach(([a, b, c, d], i) => { quad(a, c, b, d, 1.2 + (i % 7) * 0.02, i % 2 ? WG.gravel : 0x827c70); });
    RINGS.forEach(([cx, cy, r0, r1], i) => { const n = 48; for (let k = 0; k < n; k++) { const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2, P = [[r0, a0], [r1, a0], [r1, a1], [r0, a1]].map(([r, a]) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r]), c = k % 2 ? WG.gravel : 0x7e786c, z = 1.4 + i * 0.03, b = G.n; for (const [x, y] of P) G.v(x, y, z, c); G.idx.push(b, b + 1, b + 2, b, b + 2, b + 3); } });
  }), V(0, 0, 0), R(0, 0, 0));

  // ---- the lodge by the south gate; the avenue of weeping cherries up from it, lamps along it
  S(brickHouse(520, 700, 330, { doors: [{ y: 120, w: 110, h: 220, side: 1 }], windows: { front: [-170], back: [0], ends: [0] }, chimneys: [-250] }, 2), -1300, -5150, 0, 0); body(-1300, -5150, 540, 720, 330); SPOT.push([-1300, -5150, 520]);
  for (const s of [-1, 1]) for (const [i, y] of [-5050, -4550, -4050].entries()) { const x = s * 620; S(weepingCherry(pick([520, 560, 600]), i * 2 + (s > 0 ? 1 : 0)), x, y, 0, rr(0, 360)); trunk(x, y, cherryR, 320); SPOT.push([x, y, 400]); }
  for (const s of [-1, 1]) for (const y of [-5300, -4300]) { S(gasLamp(), s * 330, y, 0, 0); round(s * 330, y, 17, 262, 0, false); navBand(s * 330, y, 40, 40); lit(s * 330, y, 292, LAMP, 420); SPOT.push([s * 330, y, 60]); }

  // ---- the lower garden: the canal between its fountains, the four parterres (two burnt by the gardeners), the
  // mourners at the canal's corners, benches on its walks
  for (const [x, y] of [GD.fountS, GD.fountN]) { S(fountain(420, Math.abs(y)), x, y, 0, 0); round(x, y, 430, 52); round(x, y, 60, 416, 50); SPOT.push([x, y, 640]); }
  M.Shape('wgcanal', shape((G) => { const [x0, x1, y0, y1] = [-160, 160, -3200, -1400]; for (const s of [-1, 1]) { G.box(s * 180, (y0 + y1) / 2, 6, 20, (y1 - y0) / 2 + 40, 6, WG.stone[1]); G.box(0, s > 0 ? y1 + 20 : y0 - 20, 6, 160, 20, 6, WG.stone[0]); }
    G.box(0, (y0 + y1) / 2, 0.8, 160, (y1 - y0) / 2, 0.8, WG.water); G.box(0, (y0 + y1) / 2, 1.7, 158, (y1 - y0) / 2 - 2, 0.1, WG.waterL); }), V(0, 0, 0), R(0, 0, 0));
  for (const [cx, cy, burnt] of PARTS) {
    for (const [ax, ay, bx, by] of [[cx - 700, cy - 450, cx - 160, cy - 450], [cx + 160, cy - 450, cx + 700, cy - 450], [cx - 700, cy + 450, cx - 160, cy + 450], [cx + 160, cy + 450, cx + 700, cy + 450], [cx - 700, cy - 450, cx - 700, cy - 160], [cx - 700, cy + 160, cx - 700, cy + 450], [cx + 700, cy - 450, cx + 700, cy - 160], [cx + 700, cy + 160, cx + 700, cy + 450]]) {
      const L = Math.hypot(bx - ax, by - ay) + 50, yaw = ax === bx ? 90 : 0; S(hedge(L, 60, 50, Math.round(ax + ay), burnt), (ax + bx) / 2, (ay + by) / 2, 0, yaw); body((ax + bx) / 2, (ay + by) / 2, yaw ? 50 : L, yaw ? L : 50, 64); }
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) S(deadBed(500, 300, Math.round(cx + sx * 7 + sy * 3), burnt), cx + sx * 340, cy + sy * 210, 0, 0);
    S(urn(Math.round(cx / 100), 120), cx, cy, 0, 0); body(cx, cy, 84, 84, 124); round(cx, cy, 44, 80, 124); }
  for (const [x, y, yaw, k] of [[-660, -3300, 0, 0], [660, -3300, 180, 1], [-660, -1300, 0, 1], [660, -1300, 180, 0]]) { S(mourner(270, k, Math.abs(x + y)), x, y, 0, yaw); body(x, y, MOURN.w + 20, MOURN.w + 20, MOURN.p); round(x, y, 80, 290, MOURN.p); SPOT.push([x, y, 200]); }
  for (const s of [-1, 1]) for (const y of [-2700, -1800]) { S(parkBench(200), s * 560, y, 0, s > 0 ? 180 : 0); body(s * 560, y, 60, 200, 60, 0, 0); SPOT.push([s * 560, y, 140]); }

  // ---- the maze: hedges on a seven by seven grid, half its dead ends opened, its west side the garden wall; a gravel
  // square three cells wide at its heart, a mourner in it, two benches and four urns; its north-east corner burnt
  { const [X0, X1, Y0, Y1] = MAZE, cw = (X1 - X0) / MN, chh = (Y1 - Y0) / MN, ENT = { e: [1, 3, 5], n: [4], s: [2] };
    const Ew = [...Array(MN)].map(() => Array(MN).fill(true)), Nw = [...Array(MN)].map(() => Array(MN).fill(true));
    let sd = 977; const r = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    const seen = [...Array(MN)].map(() => Array(MN).fill(false)), st = [[0, 0]]; seen[0][0] = true;
    while (st.length) { const [i, j] = st[st.length - 1], nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [i + a, j + b, a, b]).filter(([a, b]) => a >= 0 && b >= 0 && a < MN && b < MN && !seen[a][b]);
      if (!nb.length) { st.pop(); continue; } const [a, b, da, db] = nb[Math.floor(r() * nb.length)];
      if (da === 1) Ew[i][j] = false; else if (da === -1) Ew[a][b] = false; else if (db === 1) Nw[i][j] = false; else Nw[a][b] = false; seen[a][b] = true; st.push([a, b]); }
    for (let i = 2; i <= 4; i++) for (let j = 2; j <= 4; j++) { if (i < 4) Ew[i][j] = false; if (j < 4) Nw[i][j] = false; }
    const inner = (i, j) => [i < MN - 1 && Ew[i][j] ? [1, 0] : null, i > 0 && Ew[i - 1][j] ? [-1, 0] : null, j < MN - 1 && Nw[i][j] ? [0, 1] : null, j > 0 && Nw[i][j - 1] ? [0, -1] : null].filter(Boolean);
    const shut = (i, j) => inner(i, j).length + (i === 0 ? 1 : 0) + (i === MN - 1 && !ENT.e.includes(j) ? 1 : 0) + (j === 0 && !ENT.s.includes(i) ? 1 : 0) + (j === MN - 1 && !ENT.n.includes(i) ? 1 : 0);
    for (let i = 0; i < MN; i++) for (let j = 0; j < MN; j++) { const w = inner(i, j); if (shut(i, j) >= 3 && w.length && r() < 0.5) { const [a, b] = w[Math.floor(r() * w.length)]; if (a === 1) Ew[i][j] = false; else if (a === -1) Ew[i - 1][j] = false; else if (b === 1) Nw[i][j] = false; else Nw[i][j - 1] = false; } }
    const segs = [];
    for (let i = 0; i < MN - 1; i++) for (let j = 0; j < MN; j++) if (Ew[i][j]) segs.push([X0 + (i + 1) * cw, Y0 + j * chh, X0 + (i + 1) * cw, Y0 + (j + 1) * chh]);
    for (let i = 0; i < MN; i++) for (let j = 0; j < MN - 1; j++) if (Nw[i][j]) segs.push([X0 + i * cw, Y0 + (j + 1) * chh, X0 + (i + 1) * cw, Y0 + (j + 1) * chh]);
    for (let i = 0; i < MN; i++) { if (!ENT.s.includes(i)) segs.push([X0 + i * cw, Y0, X0 + (i + 1) * cw, Y0]); if (!ENT.n.includes(i)) segs.push([X0 + i * cw, Y1, X0 + (i + 1) * cw, Y1]); }
    for (let j = 0; j < MN; j++) if (!ENT.e.includes(j)) segs.push([X1, Y0 + j * chh, X1, Y0 + (j + 1) * chh]);
    for (const [ax, ay, bx, by] of segs) { const mx = (ax + bx) / 2, my = (ay + by) / 2, L = Math.hypot(bx - ax, by - ay) + 70, yaw = ax === bx ? 90 : 0, burnt = mx > X0 + 4.5 * cw - 10 && my > Y0 + 4 * chh - 10 ? 1 : 0, x0 = Math.max(X0 + 10, mx - (yaw ? 0 : L / 2)), x1 = yaw ? mx : mx + L / 2, Lc = yaw ? L : x1 - x0, cx = yaw ? mx : (x0 + x1) / 2;
      S(hedge(Lc, 220, 70, Math.round(mx + my), burnt), cx, my, 0, yaw); body(cx, my, yaw ? 70 : Lc, yaw ? Lc : 70, 224); }
    const [mx, my] = [X0 + 3.5 * cw, Y0 + 3.5 * chh]; S(mourner(270, 0, 7), mx, my, 0, 0); body(mx, my, MOURN.w + 20, MOURN.w + 20, MOURN.p); round(mx, my, 80, 290, MOURN.p);
    for (const s of [-1, 1]) { S(parkBench(200), mx + s * cw, my, 0, s < 0 ? 0 : 180); body(mx + s * cw, my, 60, 200, 60); }
    for (const a of [-1, 1]) for (const b of [-1, 1]) { const ux = mx + a * cw, uy = my + b * chh; S(urn(7 + a + 2 * b, 110), ux, uy, 0, 0); body(ux, uy, 84, 84, 114); round(ux, uy, 44, 80, 114); } }

  // ---- the glasshouse, east: its glass half gone; dead palms in it, the Char's caps grown huge in its heat, the old
  // basin in its middle
  { const [gx, gy] = GD.glass, L = 2600, W = 1400, hl = L / 2, hw = W / 2, t = GH.t, E = GH.E;
    S(glasshouse(L, W, 1), gx, gy, 0, 90);
    const sd2 = GH.side / 2;   // the long sides either side of their doors, the glass over the doors, the leaves open
    for (const s of [-1, 1]) { const x = gx + s * (hw - t / 2); for (const e of [-1, 1]) body(x, gy + e * (hl + sd2) / 2, t, hl - sd2, E); body(x, gy, t, GH.side, E - GH.doorH, 0, GH.doorH, false);
      for (const e of [-1, 1]) body(gx + s * (hw - t / 2 + sd2 / 2), gy + e * sd2, sd2 - 4, 8, GH.doorH); }
    for (const s of [-1, 1]) { const y = gy + s * (hl - t / 2); for (const e of [-1, 1]) body(gx + e * (hw + GH.door / 2) / 2, y, (hw - GH.door / 2), t, E); body(gx, y, GH.door, t, GH.E + GH.rise - GH.doorH, 0, GH.doorH, false);
      for (const e of [-1, 1]) { const sw = (GH.swing * Math.PI) / 180, lx = s * (hl - t / 2) + s * (GH.door / 4) * Math.sin(sw), ly = e * (GH.door / 2 - (GH.door / 4) * Math.cos(sw)), [wx, wy] = at(gx, gy, 90, lx, ly); body(wx, wy, 8, GH.door / 2 - 4, GH.doorH, 90 + s * e * GH.swing); } }
    SPOT.push([gx, gy, 1500]);
    for (const [dx, dy, h] of [[-300, -800, 640], [320, -600, 600], [-320, 500, 660], [300, 800, 580], [-350, -100, 560]]) { S(deadPalm(h, dx + dy), gx + dx, gy + dy, 0, rr(0, 360)); round(gx + dx, gy + dy, 20, h); }
    S(fountain(220, 3), gx, gy, 0, 0); round(gx, gy, 230, 52); round(gx, gy, 60, 416, 50);
    for (const [dx, dy, h, w, sd] of [[380, 250, 820, 380, 2], [-330, -450, 700, 320, 3], [250, 1000, 620, 300, 4]]) { S(giantCap(h, w, sd), gx + dx, gy + dy, 0, rr(0, 360)); round(gx + dx, gy + dy, capStalk(w) * 1.7, h * 0.4); body(gx + dx, gy + dy, capStalk(w) * 2, capStalk(w) * 2, h * 0.6, 0, h * 0.4, false); }
    lit(gx, gy, 300, EMBER, 1300); }

  // ---- the balustrade between the lower garden and the lawn, gaps in it to pass
  for (const [a, b] of BAL_RUNS) { const L = b - a; S(balustrade(L, a), (a + b) / 2, GD.balY, 0, 0); body((a + b) / 2, GD.balY, L, BAL.w + 12, BAL.h + 20); }

  // ---- the rose garden, south-west: four square beds round the sundial, the cross walks between them under rose
  // arches; the roses gone over in one bed, burnt to stubs in two, the Char come up in the fourth; dead trees burnt
  // where they stood, benches by the sundial, the ash heaped
  { const [rx, ry] = GD.rose; S(sundial(), rx, ry, 0, 30); body(rx, ry, 70, 70, 120, 30); SPOT.push([rx, ry, 200]);
    for (const [dx, dy, kind] of [[580, 580, 0], [-580, 580, 1], [-580, -580, 1], [580, -580, 2]]) { S(deadBed(560, 560, Math.abs(dx * 3 + dy), kind ? 1 : 0), rx + dx, ry + dy, 0, 0);
      if (kind < 2) for (const [bx, by] of [[0, 0], [-170, -170], [170, -170], [-170, 170], [170, 170]]) { const x = rx + dx + bx, y = ry + dy + by, sd = Math.abs(Math.round(x * 0.37 + y * 0.61)), h = 100 + (sd % 4) * 10; S(roseBush(h, sd, kind), x, y, 0, rr(0, 360)); round(x, y, RB.r, kind ? Math.round(h * 0.6) + 10 : h + 20); } }
    for (const [dx, dy, yaw, sd] of [[0, 900, 0, 1], [0, -900, 0, 2], [900, 0, 90, 3], [-900, 0, 90, 4]]) { const x = rx + dx, y = ry + dy; S(roseArch(sd, dx < 0 || dy < 0 ? 1 : 0), x, y, 0, yaw); for (const s of [-1, 1]) { const [px, py] = at(x, y, yaw, (s * RA.w) / 2, 0); body(px, py, 28, RA.d + 28, RA.h - RA.w / 2, yaw); } }
    for (const [dx, dy, h, sd] of [[-1100, 800, 420, 1], [1050, -850, 360, 2]]) { S(burntSnag(h, sd), rx + dx, ry + dy, 0, rr(0, 360)); round(rx + dx, ry + dy, snagR(sd), h); SPOT.push([rx + dx, ry + dy, 120]); }
    for (const [dx, dy, yaw] of [[-240, 240, 315], [240, -240, 135]]) { S(parkBench(200), rx + dx, ry + dy, 0, yaw); body(rx + dx, ry + dy, 60, 200, 60, yaw); }
    for (const [dx, dy] of [[1150, 700], [-1000, -800]]) { S(['wgash|' + dx, shape((G) => { G.blob(0, 0, 0, 110, 90, 34, (nx, ny, nz) => (nz > 0.4 ? WG.ash : 0x5a5650), { nu: 12, nv: 6, warp: (x, y, z) => [x, y, Math.max(0, z)] }); for (let i = 0; i < 6; i++) G.tube([[i * 14 - 40, (i % 3) * 20 - 20, 10], [i * 14 - 30, (i % 3) * 20 - 26, 46]], 3, WG.char, { S: 4 }); })], rx + dx, ry + dy, 0, 0); round(rx + dx, ry + dy, 90, 40); } }

  // ---- the gardeners' yard, south-east: the bothy, the potting sheds, frames, the compost bins, the hives, the
  // potting bench, beds gone to seed, a barrow, the water butts
  { S(brickHouse(560, 820, 330, { doors: [{ y: -150, w: 110, h: 220, side: 1 }], windows: { front: [150], back: [0], ends: [0] }, chimneys: [300] }, 3), 4600, -4450, 0, 180); body(4600, -4450, 580, 840, 330); SPOT.push([4600, -4450, 560]);
    for (const [x, sd] of [[2850, 1], [3450, 2]]) { S(gardenShed(220, 300), x, -5480, 0, 90); body(x, -5480, 300, 220, 260); SPOT.push([x, -5480, 220]); }
    S(pottingBench(300, 2), 4050, -5630, 0, 0); body(4050, -5630, 300, 76, 120);
    for (const [y, sd] of [[-4700, 1], [-4380, 2], [-4060, 3]]) { S(coldFrame(400, sd), 3150, y, 0, 0); body(3150, y, 400, 112, 64); }
    S(compostBins(3, 1), 5100, -3950, 0, 90); body(5100, -3950, 130, 430, 104);
    S(hiveBench(3), 2700, -4050, 0, 90); body(2700, -4050, 320, 130, 110);
    for (const [y, sd] of [[-4250, 1], [-4550, 2]]) { S(deadBed(500, 200, sd + 20, 0), 3800, y, 0, 0); }
    S(wheelbarrow(1), 3700, -4850, 0, 40); body(3700, -4850, 160, 90, 70, 40);
    for (const [x, y] of [[3100, -5300], [3700, -5300]]) { S(rainBarrel(x), x, y, 0, 0); round(x, y, 36, 90); }
    for (const [x, y] of [[2600, -5300], [4200, -3800]]) { S(gasLamp(), x, y, 0, 0); round(x, y, 17, 262, 0, false); navBand(x, y, 40, 40); lit(x, y, 292, LAMP, 420); } }

  // ---- the great lawn: the Weeping Tree, the Char's heart come up through the cleft at its foot; the mourners round
  // it on the ring walk, benches between them, lamps; weeping cherries round the lawn's edge
  { const [tx, ty] = GD.tree; S(weepingTree(1700, 1), tx, ty, 0, -90); trunk(tx, ty, 140, 900); round(tx, ty, 230, 50);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.3, x = tx + Math.cos(a) * 300, y = ty + Math.sin(a) * 300; navBand(x, y, 80, 80); }
    SPOT.push([tx, ty, 420]);
    const [hx0, hy0] = GD.heart; S(blightMass(420, 2, 'char'), hx0, hy0, 0, 20); trunk(hx0, hy0, 420 * 0.62, 420 * 0.55); Lamp(V(hx0, hy0 - 60, 180), EMBER, 2.2, 1400, false); Glow(V(hx0, hy0, 120), V(22, 22, 26), CHAR_GLOW, 2); SPOT.push([hx0, hy0, 420]);
    for (const a of [-30, 30, 90, 150, 210]) { const x = tx + Math.cos(a * D2R) * 1530, y = ty + Math.sin(a * D2R) * 1530; S(mourner(270, a % 60 ? 1 : 0, a + 360), x, y, 0, a + 180); body(x, y, MOURN.w + 20, MOURN.w + 20, MOURN.p, a + 180); round(x, y, 80, 290, MOURN.p); SPOT.push([x, y, 200]); }
    for (const a of [0, 60, 120, 180]) { const x = tx + Math.cos(a * D2R) * 1530, y = ty + Math.sin(a * D2R) * 1530; S(parkBench(200), x, y, 0, a + 180); body(x, y, 60, 200, 60, a + 180); }
    for (const a of [-60, 240, 45, 135]) { const x = tx + Math.cos(a * D2R) * 1700, y = ty + Math.sin(a * D2R) * 1700; S(gasLamp(), x, y, 0, 0); round(x, y, 17, 262, 0, false); navBand(x, y, 40, 40); lit(x, y, 292, LAMP, 520); }
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2 + 0.1, x = tx + Math.cos(a) * 2600, y = ty + Math.sin(a) * 2350; if (y < 0 || Math.abs(x) < 500 && y > ty) continue; S(weepingCherry(pick([520, 580, 640]), k + 20), x, y, 0, rr(0, 360)); trunk(x, y, cherryR, 320); SPOT.push([x, y, 400]); } }

  // ---- the grotto, west, its pool before it, an urn in its niche; the temple east, a mourner with her wreath in it
  { const [gx, gy] = GD.grotto; S(grotto(1), gx, gy, 0, 0);
    for (const [dx, dy, r] of [[10, -380, 230], [10, 380, 230], [-280, 0, 260], [-160, -560, 160], [-120, 560, 170], [240, -420, 100]]) round(gx + dx, gy + dy, r, 640);
    S(urn(5, 100), gx + 110, gy, 0, 0); body(gx + 110, gy, 84, 84, 104);
    M.Shape('wgpool|g', shape((G) => { G.lathe([[300, 0], [340, 0], [344, 12], [300, 12], [296, 0]], WG.stone[1], 32, [0, 0, 0], [1, 1], true); G.lathe([[0, 0], [299, 0], [299, 1.6], [0, 1.6]], WG.water, 32); }), V(gx + 640, gy, 0), R(0, 0, 0));
    S(lilies(120, 3), gx + 600, gy + 80, 1.7, 0); SPOT.push([gx, gy, 900]);
    const [ex, ey] = GD.temple; S(temple(1), ex, ey, 0, 0); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; round(ex + Math.cos(a) * TEMPLE.r, ey + Math.sin(a) * TEMPLE.r, 34, 430, 30); } body(ex, ey, 1000, 1000, 15, 0, 0, false); body(ex, ey, 920, 920, 15, 0, 15, false);
    S(mourner(270, 1, 9), ex, ey, 30, -90); body(ex, ey, MOURN.w + 20, MOURN.w + 20, MOURN.p, 0, 30); round(ex, ey, 80, 290, MOURN.p + 30); SPOT.push([ex, ey, 600]); lit(ex, ey - 200, 420, LAMP, 600); }

  // ---- the north: the pergola walk, the clipped yews (some burnt), the lily pond and the dovecote; the paved floor
  // before the north gate where the stations come up
  { for (const s of [-1, 1]) { S(pergola(2400, s + 2), s * 1800, 3900, 0, 0); for (let i = 0; i <= 6; i++) for (const y of [3730, 4070]) { const x = s * 1800 - 1200 + i * 400; body(x, y, 52, 52, 16, 0, 0, false); body(x, y, 36, 36, 280); } }
    for (const s of [-1, 1]) for (const x of [-2600, -1000, 1000, 2600]) if (Math.sign(x) === s) { S(urn(Math.abs(x), 110), x, 3500, 0, 0); body(x, 3500, 84, 84, 114); round(x, 3500, 44, 80, 114); }
    const [fx, fy] = GD.floor; S(flagFloor(GD.floorR, 5, 0x3e3a34, false, [0xa8a296, 0x9c968a, 0xb2ac9e, 0x8e887e]), fx, fy, 0.4, 0);
    for (const [i, [x, y]] of [[-4600, 4600], [-4000, 4600], [-3400, 4600], [-2800, 4600], [-4600, 5200], [-4000, 5200], [-3400, 5200], [-2800, 5200]].entries()) { const kind = i % 3, h = kind === 0 ? 320 : 280, burnt = i === 2 || i === 5 || i === 6 ? 1 : 0; S(topiary(h, kind, i, burnt), x, y, 0, rr(0, 360)); round(x, y, kind === 0 ? 105 : 80, h); SPOT.push([x, y, 160]); }
    { const [px, py] = GD.pond; M.Shape('wgpool|p', shape((G) => { G.lathe([[560, 0], [610, 0], [614, 12], [560, 12], [556, 0]], WG.stone[0], 40, [0, 0, 0], [1, 1], true); G.lathe([[0, 0], [559, 0], [559, 1.6], [0, 1.6]], WG.water, 40); }), V(px, py, 0), R(0, 0, 0));
      for (let i = 0; i < 6; i++) { const a = i * 1.1, d = 200 + (i % 3) * 110; S(lilies(pick([90, 120]), i + 1), px + Math.cos(a) * d, py + Math.sin(a) * d, 1.7, 0); } SPOT.push([px, py, 640]);
      S(dovecote(), 4700, 5150, 0, 200); round(4700, 5150, DV.r + 14, DV.wall); SPOT.push([4700, 5150, 300]); }
    for (const [x, y] of [[-700, 4300], [700, 4300], [-700, 5300], [700, 5300]]) { S(gasLamp(), x, y, 0, 0); round(x, y, 17, 262, 0, false); navBand(x, y, 40, 40); lit(x, y, 292, LAMP, 520); } }

  // ---- the Char through the garden: its masses (the glasshouse, the maze's burnt corner, the rose garden, the yard,
  // the lower garden, the grotto), giant caps and puffballs about them, its threads out from the heart under the tree
  // through the balustrade's gaps and down the walks, the embers' light
  const blightAt = [[...GD.heart, 420]];
  for (const [x, y, r, sd] of [[4150, -3300, 260, 3], [-3200, -1500, 240, 4], [-3220, -5180, 220, 5], [2700, -3500, 200, 6], [1000, -600, 180, 7], [-3500, 2700, 220, 8], [2300, 2400, 200, 9]]) {
    if (keepOff(x, y, r * 0.7) || !K.clear(x, y, r * 0.7)) continue; S(blightMass(r, sd, 'char'), x, y, 0, rr(0, 360)); trunk(x, y, r * 0.62, r * 0.55); blightAt.push([x, y, r]); lit(x, y, r * 0.5 + 40, EMBER, 700); Glow(V(x, y, r * 0.4), V(22, 22, 26), CHAR_GLOW, 2); SPOT.push([x, y, r]); }
  for (const [x, y, h, w, sd] of [[-900, 900, 900, 440, 5], [1100, 1000, 760, 380, 6], [-3000, -1900, 640, 300, 7], [-3600, 3100, 700, 340, 8], [2700, 2700, 620, 300, 9], [-500, 2300, 560, 280, 10]]) {
    if (keepOff(x, y, capStalk(w) * 1.7 + 40) || !K.clear(x, y, 120)) continue; S(giantCap(h, w, sd), x, y, 0, rr(0, 360)); round(x, y, capStalk(w) * 1.7, h * 0.4); body(x, y, capStalk(w) * 2, capStalk(w) * 2, h * 0.6, 0, h * 0.4, false); SPOT.push([x, y, capStalk(w) * 1.7 + 40]); }
  { const veins = [], [hx0, hy0] = GD.heart;
    for (const P of [[[hx0, hy0], [-300, 700], [0, 0], [0, -400], [-80, -900], [-420, -1300], [-420, -2600], [-380, -3400]], [[hx0, hy0], [700, 600], [2000, 0], [2900, -350], [3500, -900], [3800, -1400]],
      [[hx0, hy0], [-800, 500], [-2000, -100], [-2900, -350], [-3100, -800], [-3200, -1300]], [[hx0, hy0], [600, 1900], [300, 2800], [0, 3300], [-300, 3900]], [[hx0, hy0], [-1300, 1700], [-2600, 2100], [-3500, 2300]]]) {
      const pts = []; for (let k = 0; k < P.length - 1; k++) { const [x0, y0] = P[k], [x1, y1] = P[k + 1], n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 160)); for (let i = 0; i < n; i++) { const t = i / n; pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]); } } pts.push(P[P.length - 1]); veins.push(pts); }
    M.Shape('wgveins', () => { const pos = [], col = [], idx = []; for (const pts of veins) { const n = pts.length, b0 = pos.length / 3;
      for (let j = 0; j < n; j++) { const [x, y] = pts[j], [xa, ya] = pts[Math.max(0, j - 1)], [xb, yb] = pts[Math.min(n - 1, j + 1)], L = Math.hypot(xb - xa, yb - ya) || 1, nx2 = -(yb - ya) / L, ny2 = (xb - xa) / L, wv = j && j < n - 1 ? Math.sin(x * 0.011 + j) * 40 : 0, w = 11 * (1 - (j / n) * 0.7);
        for (const e of [-1, 1]) { pos.push(x + nx2 * (wv + w * e), y + ny2 * (wv + w * e), 2.9); col.push(0.7, 0.26, 0.1); } }
      for (let j = 0; j < n - 1; j++) { const a = b0 + j * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } } return { pos, col, idx }; }, V(0, 0, 0), R(0, 0, 0));
    for (const pts of veins) for (let j = 4; j < pts.length; j += 4) { const [vx, vy] = pts[j]; if (keepOff(vx, vy, 120) || !K.clear(vx, vy, 120) || blightAt.some(([bx, by, br]) => Math.hypot(vx - bx, vy - by) < br + 150)) continue;
      const r = pick([40, 50, 60]); S(puffballs(r, j), vx, vy, 0, rr(0, 360)); round(vx, vy, r * 0.9, r * 1.2); SPOT.push([vx, vy, r + 40]); } }

  // where the Char's beds come up: on the lawn, in the lower garden both sides, by the glasshouse, in the north
  const openAt = (x, y, m) => { const [ix, iy] = O.GM.cellOf(O.cx + x, O.cy + y); return O.GM.navFree(ix, iy) && K.clear(x, y, m); };
  const settle = ([x, y]) => { for (let r = 0; r <= 1600; r += 100) { const n = Math.max(1, Math.round(r / 50)); for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (Math.abs(px) < hx - 300 && Math.abs(py) < hy - 300 && openAt(px, py, 330) && Math.hypot(px - GD.floor[0], py - GD.floor[1]) > 1300 && Math.hypot(px - GD.spawn[0], py - GD.spawn[1]) > 1300) return [Math.round(px), Math.round(py)]; } } return [x, y]; };
  const beds = [[-1200, 600], [1500, 1800], [-1100, -2250], [1100, -2250], [2700, -1000], [-2000, 3400]].map(settle);
  return {
    spots: { spawn: GD.spawn, yaw: Math.PI, exit: GD.exit, textYaw: -90, ammo: [GD.spawn[0] + 650, GD.spawn[1] - 150], ammoYaw: 90,
      bench: [GD.floor[0] - 540, GD.floor[1] + 60], benchYaw: 0, box: [GD.floor[0] + 640, GD.floor[1] - 180], chest: [GD.floor[0] + 640, GD.floor[1] - 180], chestYaw: 180, press: [GD.floor[0] - 540, GD.floor[1] - 440], pressYaw: 0 },
    keep: [[GD.floor[0], GD.floor[1], GD.floorR]], bossAt: GD.arena, hangs: null, beds,
  };
}

// ---- the air in the garden: ash coming down, the black sap dropping from the Weeping Tree's strands, embers up off the
// Char's heart, a grey petal or two off the cherries
export function gardenAir(g, dt, A) {
  const c = g.camera.position, [cx, cy] = A.c; if (Math.abs(c.x - cx) > A.hx + 600 || Math.abs(c.z - cy) > A.hy + 600) return;
  const st = (gardenAir.st ||= { a: 0, d: 0, e: 0 });
  st.a += dt * 12; while (st.a > 1) { st.a -= 1; const a = Math.random() * 6.28, r = 200 + Math.random() * 2000;
    g.fx.add({ pos: new THREE.Vector3(c.x + Math.cos(a) * r, 500 + Math.random() * 900, c.z + Math.sin(a) * r), vel: new THREE.Vector3((Math.random() - 0.5) * 40, -40 - Math.random() * 30, (Math.random() - 0.5) * 40), life: 9, size0: 5, size1: 4, c0: Math.random() < 0.2 ? [0.86, 0.8, 0.84, 0.8] : [0.55, 0.53, 0.52, 0.8], fadeIn: 1, fadeOut: 1.5, tex: 'FX_Disc', kind: 'fx' }); }
  const tx = cx + GD.tree[0], tz = cy + GD.tree[1]; if (Math.hypot(c.x - tx, c.z - tz) < 3000) { st.d += dt * 6; while (st.d > 1) { st.d -= 1; const a = Math.random() * 6.28, r = 300 + Math.random() * 700;
    g.fx.add({ pos: new THREE.Vector3(tx + Math.cos(a) * r, 300 + Math.random() * 200, tz + Math.sin(a) * r), vel: new THREE.Vector3(0, -700, 0), gravity: 0, life: 0.5, size0: 3, size1: 3, c0: [0.05, 0.04, 0.05, 0.9], fadeIn: 0.05, fadeOut: 0.1, tex: 'FX_Disc', kind: 'fx' }); }
    st.e += dt * 5; while (st.e > 1) { st.e -= 1; const hx0 = cx + GD.heart[0], hz0 = cy + GD.heart[1];
      g.fx.add({ pos: new THREE.Vector3(hx0 + (Math.random() - 0.5) * 300, 60 + Math.random() * 100, hz0 + (Math.random() - 0.5) * 300), vel: new THREE.Vector3((Math.random() - 0.5) * 50, 120 + Math.random() * 90, (Math.random() - 0.5) * 50), life: 2.5, size0: 3, size1: 1.5, c0: [1, 0.5, 0.18, 1], fadeIn: 0.05, fadeOut: 0.9, tex: 'FX_Disc', kind: 'fx', glow: 1 }); } }
}
