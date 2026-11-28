// Cogsworth Depot, in the Works: the gnomes' railway depot where the valley's freight comes in. The road comes in at the
// south gate into the yard; the main line runs the length of the depot (in through the south wall, out under the arch
// in the north wall) with the station loop beside it: the platform under its canopy, the station house with its clock.
// West of the line: the signal box, the coal stage, the water tower, the turntable and the engine shed. East: the goods
// yard, two sidings under the gantry crane, the goods shed. The Blight came in on a freight train: a van on the east
// siding has burst open and its growth has spread, its sacs of rust hanging from the gantry, the canopy and the tower.
//
// Local frame (dest.js): +Y north, +X east, z up; ground flat at z = 0 (platforms are low enough to step onto).
import { V, R } from './mapkit.js';
import { destKit } from './dest_kit.js';
import { farTree, blightMass, raisedBed, handPump, churn, wheelbarrow, scarecrow } from './dest_props.js';
import { rainBarrel } from './dest_props_wood.js';
import { brickRun, brickHouse, farHouse, track, GAUGE, bufferStop, locomotive, LOCO_LEN, wagon, waterTower, gantry, gantryHangs, canopy, canopyHangs, signalBox, barrel, depotGate, footbridge2, FB2, handCrane, timberStack, RAIL_TOP, coachBody, COACH, railRack, handTrolley, boilerTrestles, waterCrane, coalBay, weighPlate, hayBale, ashHeap, beanWigwam, gardenShed, KC } from './dest_props_works.js';
import { shapeB as shape } from './propkit.js';
import { rock, toadstoolCluster, grassTuft, lanternPost, hill, mix, cabbage, pumpkin } from './village_shapes.js';
import { crate, sack, cart, cobbleSquare, trough, grindstone } from './village_props.js';

export const CD = { lineA: -300, lineB: 0, platform: [430, 0], station: [1250, 0], shed: [-2700, 2500], turn: [-2700, 300], tower: [-1250, 900], coal: [-1350, -1300], signal: [-1000, -2900],
  goods: [3600, -1800], sidA: 2150, sidB: 2550, gantry: [2350, 1300], floor: [700, 4900], floorR: 900 };
const RB = 'dest_depot', GX = 700;   // GX: where the road comes in through the south wall
const q20 = (v) => Math.round(v / 20) * 20;

// a low wall-mounted platform: setts on top, a stone edge with a white line along the track side
const platformShape = (len, w) => ['dplatform|' + [len, w].join('|'), shape((G) => { const hl = len / 2, hw = w / 2;
  G.box(0, 0, 7, hw, hl, 7, 0x8a8478); for (let y = -hl + 20; y < hl; y += 40) for (let x = -hw + 30; x < hw - 20; x += 60) G.box(x + ((y / 40) % 2 ? 15 : 0), y, 14.6, 28, 18, 1.2, [0x9a948a, 0x8e887e, 0xa49e92][Math.abs(Math.round(x + y)) % 3]);
  for (const s of [-1, 1]) { G.box(s * (hw - 14), 0, 15.5, 14, hl, 1.6, 0xc8c0b0); } G.box(-hw + 22, 0, 16.8, 3, hl, 0.6, 0xf2ecd8); })];
// a semaphore signal: an iron post with a ladder, the red arm with its white band, the lamp
const signalPost = () => ['dsignal', shape((G) => { G.tube([[0, 0, -8], [0, 0, 520]], 7, KC.iron, { S: 8, M: 6 }); G.lathe([[10, 520], [12, 526], [0, 534]], KC.iron, 8);
  G.box(10, 26, 470, 2, 36, 7, KC.red); G.box(11, 46, 470, 1.5, 6, 7.2, KC.cream); G.box(0, 0, 470, 5, 5, 8, KC.iron); G.tube([[-2, 0, 470], [14, 0, 470]], 3, KC.iron, { S: 6, M: 2 }); G.box(8, -6, 452, 6, 6, 8, KC.iron); G.box(14.5, -6, 452, 1, 4, 4, 0xfff0c0);
  for (const s of [-1, 1]) G.tube([[-12, s * 12, 0], [-12, s * 12, 440]], 1.6, KC.iron, { S: 4, M: 4 }); for (let z = 30; z < 440; z += 36) G.box(-12, 0, z, 1.2, 12, 1.2, KC.iron); G.box(-6, 0, 440, 8, 3, 2, KC.iron); for (const z of [60, 220, 380]) G.box(-8, 0, z, 5, 13.5, 1.6, KC.iron); })];
// a station clock on a bracket off the wall (faces +X)
const clockShape = () => ['dclock', shape((G) => { G.box(18, 0, 0, 18, 4, 4, KC.iron); for (const s of [-1, 1]) { const b = G.n; G.lathe([[0, -6], [34, -6], [36, -3], [36, 3], [34, 6], [0, 6]], KC.green, 16, [0, 0, 0]); G.place(b, { x: 40 + s * 0, y: s * 7, z: 0, roll: 90 }); const c = G.n; G.lathe([[0, 0], [30, 0]], KC.cream, 16, [0, 0, 0]); G.place(c, { x: 40, y: s * 13.5, z: 0, roll: s * 90 }); G.box(40, s * 14, 6, 1.5, 0.6, 14, KC.iron); G.box(46, s * 14, 0, 8, 0.6, 1.5, KC.iron); } })];
// a pile of sleepers, a heap of coal, a pair of spare wheels on their axle
const sleeperPile = () => ['dsleepers', shape((G) => { for (let r = 0; r < 4; r++) for (let i = 0; i < 5 - (r % 2); i++) G.box((r % 2 ? 90 : 0) + (r % 2 ? 0 : -90) * 0 + (r % 2 ? -90 : 0) * 0, -88 + i * 40 + (r % 2) * 20, 9 + r * 18, 115, 17, 8.5, r % 2 ? KC.sleeper : mix(KC.sleeper, 0x000000, 0.15)); })];
const coalHeap = (r) => ['dcoalheap|' + r, shape((G) => { G.blob(0, 0, 0, r, r * 0.8, r * 0.5, (nx, ny, nz) => (Math.sin(nx * 23 + ny * 17) > 0.6 ? KC.coalL : KC.coal), { nu: 14, nv: 7, warp: (x, y, z) => [x, y, Math.max(z, -2)] }); })];
const wheelset = () => ['dwheelset', shape((G) => { G.tube([[0, -GAUGE / 2 - 30, 40], [0, GAUGE / 2 + 30, 40]], 7, KC.ironL, { S: 8, M: 3 }); for (const s of [-1, 1]) { const b = G.n; G.lathe([[0, -6], [36, -6], [40, -2], [40, 2], [36, 6], [0, 6]], KC.iron, 16, [0, 0, 0]); G.place(b, { y: s * (GAUGE / 2 + 8), z: 40, roll: 90 }); } })];

export function buildDepot(M, O) {
  const { hx, hy } = O;
  const K = destKit(M, 37, O, { exactNav: true }), { S, body, round, trunk, patch, blot, path, band, settRoad, rnd, rr, Box, lineDist } = K;
  const pick = (L) => L[Math.floor(rnd() * L.length)];
  const SOL = (x, y, w, d, h, yaw = 0, nav = true) => body(x, y, w, d, h, yaw, 0, nav);
  const roofSolid = (hx0, hy0, x0, z0, x1, z1, y0, y1) => { const L = Math.hypot(x1 - x0, z1 - z0), a = (Math.atan2(z1 - z0, Math.abs(x1 - x0)) * 180) / Math.PI * (x1 < x0 ? -1 : 1); M.SolidRot(V(hx0 + (x0 + x1) / 2, hy0 + (y0 + y1) / 2, (z0 + z1) / 2 - 12), V(L, y1 - y0, 24), R(-a, 0, 0)); };
  // a brick house and its bodies: walls, roof slabs, chimneys (the house turned by yaw 0 or 180 only)
  const house = (x, y, W, D, H, opts, seed, yaw = 0) => { S(brickHouse(W, D, H, opts, seed), x, y, 0, yaw); const c = Math.round(Math.cos((yaw * Math.PI) / 180)), s = Math.round(Math.sin((yaw * Math.PI) / 180)), at = (lx, ly) => [x + lx * c - ly * s, y + lx * s + ly * c];
    SOL(x, y, c ? W + 30 : D + 30, c ? D + 30 : W + 30, H + 4); const pitch = opts.pitch || 0.62, ridge = H + (W / 2) * pitch;
    for (const sx of [-1, 1]) { const x0 = sx * (W / 2 + 30), z0 = H - 30 * pitch, L = Math.hypot(x0, ridge - z0), a = (Math.atan2(ridge - z0, Math.abs(x0)) * 180) / Math.PI * (sx > 0 ? -1 : 1), [mx, my] = at(x0 / 2, 0); M.SolidRot(V(mx, my, (z0 + ridge) / 2 - 12), V(L, D + 60, 24), R(-a, yaw, 0)); }
    for (const cy of opts.chimneys || []) { const [cx2, cy2] = at(W * 0.35, cy); body(cx2, cy2, 80, 100, ridge + 130); } };
  const lamp = (x, y, side = 1) => { S(lanternPost(320, Math.abs(Math.round(x + y)) % 4), x, y, 0, side < 0 ? 0 : 180); round(x, y, 12, 320, 0, false); K.lit(x + (side < 0 ? 62 : -62), y, 262, { r: 1, g: 0.78, b: 0.45 }, 800); };
  const hangs = [];
  // a ramp off the end of a platform 16 high: setts on a slope down to the ground over len, w wide; (x, y) the foot of the
  // platform's end, dir the way down (degrees)
  const rampShape = (len, w, h) => ['dramp|' + [len, w, h].join('|'), shape((G) => { const hw = w / 2;
    G.surf((u, v) => [u * len, (v - 0.5) * w, h * (1 - u) - 0.4], 0, 1, Math.max(2, Math.round(len / 24)), 0, 1, Math.max(2, Math.round(w / 34)), (u, v) => [0x8a8478, 0x7e786e, 0x948e82][(Math.floor(u * len / 24) + Math.floor(v * w / 34)) % 3]);
    for (const s2 of [-1, 1]) G.surf((u, v) => [u * len, s2 * hw, (h * (1 - u) - 0.4) * v], 0, 1, 2, 0, 1, 1, 0x6e6a62); })];
  const ramp = (x, y, dir, w, len = 130, h = 16) => { const a = (dir * Math.PI) / 180; S(rampShape(len, w, h), x, y, 0, dir); const L = Math.hypot(len, h), pit = (Math.atan2(h, len) * 180) / Math.PI;
    M.SolidRot(V(x + Math.cos(a) * len / 2, y + Math.sin(a) * len / 2, h / 2 - 4), V(L, w, 8), R(pit, dir, 0)); };

  // ---- the walls round the depot: brick with piers and stone copings; the line comes in and goes out under an arch in
  // the south and the north wall, the road comes in at the gate (GX) in the south wall
  const WH = 300, wall = (x0, x1, y, alongY = false, seed = 1) => { const L = Math.abs(x1 - x0), n = Math.max(1, Math.round(L / 600)), seg = L / n;
    for (let i = 0; i < n; i++) { const a = Math.min(x0, x1) + seg * i, b = a + seg, sd = seed + i; S(['dbwall|' + [Math.round(seg), sd % 4].join('|'), shape((G) => { brickRun(G, -seg / 2, seg / 2, 0, 0, WH, 34, sd, false, true); G.box(0, 0, WH + 6, seg / 2, 24, 6, KC.trim); for (const s of [-1, 1]) { brickRun(G, s * seg / 2 - 30, s * seg / 2 + 30, 0, 0, WH + 30, 54, sd + 5); G.box(s * seg / 2, 0, WH + 36, 34, 34, 6, KC.trim); } })], alongY ? y : (a + b) / 2, alongY ? (a + b) / 2 : y, 0, alongY ? 90 : 0); }
    if (alongY) body(y, (x0 + x1) / 2, 60, L, WH + 40); else body((x0 + x1) / 2, y, L, 60, WH + 40); };
  const yS = -hy + 80, yN = hy - 80, xW = -hx + 80, xE = hx - 80;
  // (the outer ends run on to the side walls' outer faces, and the side walls the whole way, so the corners are closed)
  wall(xW - 30, CD.lineA - 330, yS, false, 1); wall(CD.lineA + 330, GX - 390, yS, false, 3); wall(GX + 390, xE + 30, yS, false, 5);
  wall(xW - 30, CD.lineA - 330, yN, false, 7); wall(CD.lineA + 330, xE + 30, yN, false, 9);
  wall(yS - 30, yN + 30, xW, true, 13); wall(yS - 30, yN + 30, xE, true, 17);
  S(depotGate(700), GX, yS, 0, 90); for (const s of [-1, 1]) body(GX + s * 390, yS, 100, 100, 400);
  M.Sign(V(GX, yS - 6, 430), -90, 'COGSWORTH DEPOT', { r: 0.95, g: 0.86, b: 0.6 }, 30); M.Sign(V(GX, yS + 6, 430), 90, 'COGSWORTH DEPOT', { r: 0.95, g: 0.86, b: 0.6 }, 30);
  for (const y of [yS, yN]) { S(['dlinearch', shape((G) => { for (const s of [-1, 1]) brickRun(G, s * 250, s * 330, 0, 0, 380, 70, 21 + s); G.surf((u, v) => { const a = Math.PI * u, rr0 = 250 + v * 80; return [Math.cos(a) * rr0, 0, 380 + Math.sin(a) * rr0 * 0.6]; }, 0, 1, 16, 0, 1, 1, KC.brick[2]); for (const s of [-1, 1]) G.surf((u, v) => { const a = Math.PI * u, rr0 = 250 + v * 80; return [Math.cos(a) * rr0, s * 35, 380 + Math.sin(a) * rr0 * 0.6]; }, 0, 1, 16, 0, 1, 1, KC.brick[1]); G.box(0, 0, 380 + 330 * 0.6 + 30, 340, 40, 30, KC.brick[0]); G.box(0, 0, 380 + 330 * 0.6 + 64, 350, 44, 6, KC.trim); })], CD.lineA, y, 0, 0);
    for (const s of [-1, 1]) body(CD.lineA + s * 290, y, 80, 70, 600); body(CD.lineA, y, 660, 70, 160, 0, 520, false); }

  // ---- the ground: packed earth, cinders black either side of every line (the lines carry their own grey ballast),
  // setts on the roads and the station's forecourt, weeds along the foot of the walls
  Box(V(0, 0, -60), V(hx * 2 + 24000, hy * 2 + 24000, 120), 0x6e6252, true, false);
  for (let i = 0; i < 34; i++) patch(rr(-hx + 500, hx - 500), rr(-hy + 500, hy - 500), rr(500, 1200), pick([0x665a4a, 0x786c58, 0x6a6050, 0x726656]));
  for (const [x, y, r] of [[-1350, -1300, 900], [-2700, 1500, 700], [3560, 5000, 1000], [-1500, -1000, 500], [3000, 5300, 600]]) for (let k = 0; k < 6; k++) { const a = rr(0, Math.PI * 2), d = rr(0, r); patch(x + Math.cos(a) * d, y + Math.sin(a) * d, rr(160, 360), pick([0x3e3a36, 0x46413c, 0x4e4842])); }
  for (const [x, y] of [[-600, -1700], [-650, 700], [2350, -2900], [1050, -4300], [-2000, -3300], [3300, 1900], [-1900, 2300], [4200, -2300]]) patch(x, y, rr(90, 170), pick([0x4a5458, 0x465052, 0x505a5c]));
  const WEED = [0x5e6a3a, 0x66703e, 0x58633a, 0x6e6a44], weed = (i, j) => (j === 0 || j === 4 ? 0x6a6448 : WEED[(i * 3 + j) % 4]);
  for (const [pts, w] of [[[[xW + 150, yS + 160], [CD.lineA - 420, yS + 160]], 300], [[[CD.lineA + 420, yS + 160], [GX - 480, yS + 160]], 240], [[[GX + 480, yS + 160], [xE - 150, yS + 160]], 300],
    [[[xW + 150, yN - 160], [CD.lineA - 420, yN - 160]], 300], [[[CD.lineA + 420, yN - 160], [CD.floor[0] - CD.floorR - 120, yN - 160]], 300], [[[CD.floor[0] + CD.floorR + 120, yN - 160], [xE - 150, yN - 160]], 300],
    [[[xW + 160, yS + 300], [xW + 160, yN - 300]], 320], [[[xE - 160, yS + 300], [xE - 160, yN - 300]], 320]]) band(pts, w, 1.0, weed, 0.3);
  // what the lines run on: laid here so the cinders and the crossings know them
  const LINES = [[[CD.lineA, -hy - 400], [CD.lineA, hy + 400]], [[CD.lineB, -2400], [CD.lineB, 2400]], [[CD.lineA, -3300], [CD.lineB, -2400]], [[CD.lineB, 2400], [CD.lineA, 3300]],
    [[CD.lineA, 3600], [CD.sidA, 1800]], [[CD.sidA, 1800], [CD.sidA, -3600]], [[CD.sidA, 1000], [CD.sidB, 400]], [[CD.sidB, 400], [CD.sidB, -3600]],
    [[CD.lineA, 1600], [CD.turn[0] + 420, CD.turn[1] + 160]], [[CD.turn[0], CD.turn[1] + 480], [CD.shed[0] - 180, CD.shed[1] - 700]], [[CD.turn[0], CD.turn[1] + 480], [CD.shed[0] + 180, CD.shed[1] - 700]],
    [[CD.shed[0] - 180, CD.shed[1] - 700], [CD.shed[0] - 180, CD.shed[1] - 200]], [[CD.shed[0] + 180, CD.shed[1] - 700], [CD.shed[0] + 180, CD.shed[1] - 200]]];
  const CIND = [0x4e4842, 0x554e47, 0x5a524a, 0x4a443e];
  LINES.forEach(([a, b], k) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, ext = 140, A = [a[0] - ux * ext, a[1] - uy * ext], B = [b[0] + ux * ext, b[1] + uy * ext];
    if (Math.abs(A[1]) > hy - 100) A[1] = Math.sign(A[1]) * (hy - 100); if (Math.abs(B[1]) > hy - 100) B[1] = Math.sign(B[1]) * (hy - 100);
    band([A, B], 560, 1.6 + k * 0.05, (i, j) => (j === 0 || j === 4 ? 0x645a4e : CIND[(i * 7 + j * 3 + k) % 4]), 0.18); });
  const nearLine = (x, y, m) => LINES.some(([a, b]) => lineDist(x, y, [a, b]) < m);
  // the roads: in at the gate and up to the station's forecourt; off it to the goods platform, to the workshop over the
  // main line, and on north to the square by the north wall (over the line to the sidings)
  const ROADS = [[[GX, yS + 40], [GX, -4700], [1000, -3800], [1550, -2700], [1780, -1700], [1790, -1000]],
    [[1500, -3150], [1900, -3750], [2500, -4100], [3040, -3850], [3040, -3000]],
    [[GX - 120, -4720], [-200, -4600], [-1600, -4250], [-2800, -3700], [-3150, -3000]],
    [[1790, 1000], [1700, 2000], [1400, 3200], [1100, 4150]]];
  const rw = [380, 320, 320, 360];
  ROADS.forEach((P, k) => settRoad(P, rw[k], 2.6 + k * 0.08, { skip: (x, y) => nearLine(x, y, 160) }));
  settRoad([[1790, -1010], [1790, 1010]], 400, 2.95, { kerbW: 18, skip: () => false });
  // level crossings: timber planks between and outside the rails, flush with the rails' tops
  const crossing = (w) => ['dcrossing|' + w, shape((G) => { const hw = GAUGE / 2; for (const [y0, y1] of [[-hw + 7, hw - 7], [hw + 7, hw + 62], [-hw - 62, -hw - 7]]) { const n = Math.max(1, Math.round((y1 - y0) / 22)); for (let i = 0; i < n; i++) { const a = y0 + ((y1 - y0) * i) / n, b = y0 + ((y1 - y0) * (i + 1)) / n; G.box(0, (a + b) / 2, 6.5, w / 2, (b - a) / 2 - 1, 3.6, i % 2 ? KC.wood : mix(KC.wood, 0x000000, 0.12)); } } for (const sx of [-1, 1]) G.box(sx * (w / 2 - 8), 0, 9.5, 6, hw + 64, 0.8, KC.iron); })];
  for (const P of ROADS) for (let i = 0; i < P.length - 1; i++) for (const [a, b] of LINES) { const [x1, y1] = P[i], [x2, y2] = P[i + 1], [x3, y3] = a, [x4, y4] = b, d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4); if (Math.abs(d) < 1e-6) continue;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d, u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / d; if (t < 0 || t > 1 || u < 0 || u > 1) continue;
    const cx = x1 + t * (x2 - x1), cy = y1 + t * (y2 - y1), yaw = (Math.atan2(y4 - y3, x4 - x3) * 180) / Math.PI, ang = Math.abs(Math.sin(Math.atan2(y2 - y1, x2 - x1) - Math.atan2(y4 - y3, x4 - x3))); S(crossing(q20(Math.min(900, 400 / Math.max(0.45, ang)))), cx, cy, 0, yaw); }

  // ---- the lines (LINES, above): the main line end to end, the station loop, the sidings, the turntable and shed roads;
  // each a hair above the last so their beds never fight where they meet
  const lay = (x0, y0, x1, y1, k) => { const L = Math.hypot(x1 - x0, y1 - y0); S(track(L, Math.abs(Math.round(x0 + y0))), (x0 + x1) / 2, (y0 + y1) / 2, k * 0.06, (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI); };
  LINES.forEach(([a, b], k) => lay(a[0], a[1], b[0], b[1], k));
  for (const x of [CD.sidA, CD.sidB]) { S(bufferStop(), x, -3640, 0, 90); body(x, -3640, 70, 280, 80); }

  // ---- the platform and its canopy, the station house with the clock, benches, lamps, the name boards
  { const [px, py] = CD.platform, len = 2600, w = 300; S(platformShape(len, w), px, py, 0, 0); body(px, py, w, len, 16, 0, 0, false); ramp(px + 20, py + len / 2, 90, 240); ramp(px + 20, py - len / 2, -90, 240);
    S(canopy(2000, 420, 330), px + 20, py, 0, 0); for (let y = -900; y <= 900; y += 1800 / Math.round(1800 / 400)) round(px + 20, py + y, 12, 360, 16, false);
    M.SolidRot(V(px + 20, py, 370), V(480, 2040, 16), R(0, 0, 0)); for (const [hx2, hy2, hz] of canopyHangs(2000, 420, 330)) hangs.push([px + 20 + hx2, py + hy2, hz]);
    for (const y of [-700, 0, 700]) { S(['dpbench', shape((G) => { for (const s of [-1, 1]) { G.box(0, s * 80, 22, 18, 4, 22, KC.iron); G.box(-10, s * 80, 58, 4, 4, 36, KC.iron); } G.box(0, 0, 44, 20, 92, 3, KC.wood); G.box(-14, 0, 70, 3, 92, 12, KC.wood); })], px + 80, py + y + 250, 16, 180); body(px + 80, py + y + 250, 50, 190, 90, 0, 16, false); }
    for (const y of [-1100, -400, 400, 1100]) lamp(px + 120, py + y, 1);
    for (const s of [-1, 1]) { const y = py + s * 1150; S(['dnameboard', shape((G) => { for (const t of [-1, 1]) G.tube([[0, t * 120, 0], [0, t * 120, 230]], 4, KC.green, { S: 6, M: 3 }); G.box(0, 0, 200, 4, 140, 26, KC.green); G.box(0, 0, 200, 4.5, 132, 20, KC.cream); })], px + 60, y, 16, 0); M.Sign(V(px + 66, y, 216), 0, 'COGSWORTH', { r: 0.18, g: 0.3, b: 0.22 }, 22); M.Sign(V(px + 54, y, 216), 180, 'COGSWORTH', { r: 0.18, g: 0.3, b: 0.22 }, 22); round(px + 60, y - 120, 6, 230, 16, false); round(px + 60, y + 120, 6, 230, 16, false); } }
  { const [x, y] = CD.station; house(x, y, 640, 1500, 420, { doors: [{ y: 0, w: 140, h: 260, side: -1, color: KC.green, arch: true }, { y: -500, w: 110, h: 230, side: -1 }, { y: 500, w: 110, h: 230, side: 1 }], windows: { back: [-300, 300, -650, 650], front: [-400, 0, 300], ends: [-160, 160] }, chimneys: [-450, 450], wz: 180 }, 1);
    S(clockShape(), x - 320, y, 300, 180); body(x - 360, y, 60, 90, 80, 0, 260, false);
    for (const dy of [-260, 260]) { S(barrel(Math.round(dy)), x + 360, y + dy, 0, 0); round(x + 360, y + dy, 36, 92); } }

  // ---- the engine: standing at the platform on the loop, the fire still in; a train of wagons behind it on the main line
  S(locomotive(0), CD.lineB, 400, RAIL_TOP, 90); body(CD.lineB, 400, 220, LOCO_LEN + 20, 420); K.lit(CD.lineB, 400 + LOCO_LEN / 2 - 50, 130, { r: 1, g: 0.86, b: 0.6 }, 600);
  for (const [i, k] of [0, 0, 1, 2].entries()) { const y = -1300 - i * 560; S(wagon(k, i + 1), CD.lineA, y, RAIL_TOP, 90); body(CD.lineA, y, 190, 560, k === 1 ? 190 : k === 2 ? 280 : 240); }

  // ---- west of the line: the signal box, the coal stage, the water tower, the turntable, the engine shed
  { const [x, y] = CD.signal; S(signalBox(), x, y, 0, 180); body(x, y, 360, 460, 600); body(x + 110, y - 380, 120, 300, 240, 0, 0, false); }
  for (const [x, y] of [[CD.lineA - 160, -2200], [CD.lineA - 160, 2700], [CD.lineB + 160, -2600]]) { S(signalPost(), x, y, 0, 0); round(x, y, 14, 530); }
  { const [x, y] = CD.coal; S(['dcoalstage', shape((G) => { brickRun(G, -260, 260, -180, 0, 160, 40, 2); brickRun(G, -260, 260, 180, 0, 160, 40, 3); brickRun(G, -180, 180, -260, 0, 160, 40, 4, true); G.box(0, 0, 80, 240, 160, 80, KC.coal); G.blob(0, 0, 160, 230, 150, 70, (nx, ny, nz) => (Math.sin(nx * 23 + ny * 17) > 0.6 ? KC.coalL : KC.coal), { nu: 14, nv: 6, warp: (x2, y2, z2) => [x2, y2, Math.max(z2, -4)] }); G.box(0, 0, 166, 270, 190, 6, KC.trim); for (const s of [-1, 1]) G.tube([[s * 200, 190, 160], [s * 200, 190, 420]], 6, KC.iron, { S: 6, M: 4 }); G.box(0, 190, 420, 230, 6, 8, KC.iron); G.surf((u, v) => [-202 + u * 404, 190 + v * 120, 300 - v * 110], 0, 1, 2, 0, 1, 2, KC.iron); })], x, y, 0, 90); body(x, y, 380, 540, 230); round(x - 190, y - 200, 10, 420, 0, false); round(x - 190, y + 200, 10, 420, 0, false);
    for (const [dx, dy] of [[-420, -200], [-460, -120]]) S(sack(26, 0x2e2a26), x + dx, y + dy, -4, rr(0, 360)); body(x - 440, y - 160, 120, 160, 50); S(coalHeap(170), x - 380, y + 420, 0, 30); trunk(x - 380, y + 420, 150, 80); }
  { const [x, y] = CD.tower; S(waterTower(), x, y, 0, 0); body(x, y, 340, 340, 420); round(x, y, 180, 290, 420); hangs.push([x + 170 + 190, y, 420 - 28]); }
  { const [x, y] = CD.turn, r = 480; S(['dturntable|' + r, shape((G) => { G.lathe([[r + 30, -2], [r + 30, 6], [r, 6], [r, -2]], 0x8a8478, 32); G.lathe([[0, 1], [r, 1]], 0x3a3634, 32); G.lathe([[r - 30, 3], [r - 22, 3], [r - 22, 6], [r - 30, 6]], KC.rail, 32); for (const s of [-1, 1]) { G.box(0, s * GAUGE / 2, 6.4, r, 4.5, 0.4, KC.iron); G.box(0, s * GAUGE / 2, 8.1, r, 1.8, 1.3, KC.rail); G.box(0, s * GAUGE / 2, 9.9, r, 3.2, 0.5, mix(KC.rail, 0xffffff, 0.3)); G.box(0, s * (GAUGE / 2 + 30), 8, r, 6, 6, KC.iron); } for (let x2 = -r + 20; x2 < r; x2 += 48) G.box(x2, 0, 4.2, 9, GAUGE / 2 + 26, 1.8, KC.sleeper); G.box(0, GAUGE / 2 + 60, 6, 20, 26, 6, KC.iron); })], x, y, 0, 90); }
  // the engine shed faces the turntable: its front (+X as built) turned to the south, its two doors on the shed roads
  { const [x, y] = CD.shed; house(x, y, 1100, 1500, 560, { doors: [{ y: -180, w: 240, h: 400, side: 1, color: 0x5a3e2e }, { y: 180, w: 240, h: 400, side: 1, color: 0x5a3e2e }], windows: { back: [-500, 0, 500], ends: [-300, 300] }, chimneys: [-300, 300], wz: 260, pitch: 0.5 }, 3, -90);
    S(wheelset(), x + 700, y - 400, 0, 90); body(x + 700, y - 400, 100, 260, 90); S(sleeperPile(), x + 750, y + 300, 0, 0); body(x + 750, y + 300, 250, 220, 80); }

  // ---- east: the goods yard, its sidings under the gantry, the goods shed with its loading door; the burst van
  { const [x, y] = CD.goods; house(x, y, 800, 2000, 460, { doors: [{ y: -500, w: 260, h: 300, side: -1, color: 0x5a3e2e }, { y: 300, w: 260, h: 300, side: -1, color: 0x5a3e2e }], windows: { back: [-900, -100, 800], front: [-600, 0, 600], ends: [-200, 200] }, chimneys: [700], wz: 250 }, 5, 0);
    for (const [dx, dy, w] of [[-560, -900, 70], [-560, -820, 60], [-640, -860, 70], [-560, 820, 70], [-650, 800, 64]]) S(crate(w, Math.round(dx - dy)), x + dx, y + dy, 0, rr(-8, 8)); body(x - 600, y - 860, 200, 220, 140); body(x - 600, y + 810, 200, 160, 140);
    for (const [dx, dy] of [[-520, -300], [-520, -230], [-590, -260], [-520, 1200], [-590, 1240]]) S(barrel(Math.round(dx + dy)), x + dx, y + dy, 0, 0); body(x - 555, y - 265, 160, 150, 92); body(x - 555, y + 1220, 160, 130, 92); }
  { const [x, y] = CD.gantry, span = 1000, Hh = 720; S(gantry(span, Hh), x, y, 0, 90); for (const s of [-1, 1]) { body(x + s * span / 2, y, 70, 480, 120); for (const k of [-1, 1]) trunk(x + s * span / 2, y + k * 200, 20, Hh); }
    for (const [gx, gy, gz] of gantryHangs(span, Hh)) hangs.push([x - gy, y + gx, gz]); }
  { S(wagon(0, 4), CD.sidA, -1900, RAIL_TOP, 90); body(CD.sidA, -1900, 190, 560, 240); S(wagon(1, 5), CD.sidA, -2500, RAIL_TOP, 90); body(CD.sidA, -2500, 190, 560, 190);
    S(wagon(2, 6), CD.sidB, -700, RAIL_TOP, 90); body(CD.sidB, -700, 190, 560, 280); }
  // the Blight: out through the van's open door and over the yard; a smaller growth under the canopy's south end
  const blightAt = [];
  for (const [x, y, r, sd] of [[CD.sidB + 280, -650, 380, 2], [CD.platform[0] + 360, -1520, 220, 4], [CD.tower[0] - 400, CD.tower[1] - 300, 200, 3]]) { S(blightMass(r, sd, 'rust'), x, y, 0, rr(0, 360)); trunk(x, y, r * 0.62, r * 0.55); blightAt.push([x, y, r]); K.lit(x, y, 90, { r: 1, g: 0.82, b: 0.3 }, 700, 0xffd24e); }
  for (const [x, y, r] of blightAt) for (let k = 0; k < 5; k++) { const a = rr(0, Math.PI * 2), d = rr(r * 0.8, r * 2.6); patch(x + Math.cos(a) * d, y + Math.sin(a) * d, rr(220, 520), pick([0x7a4a2a, 0x8a5a32, 0x6a3e24])); }
  for (let i = 0; i < 14; i++) { const a = rr(0, Math.PI * 2), d = rr(500, 1400), x = blightAt[0][0] + Math.cos(a) * d, y = blightAt[0][1] + Math.sin(a) * d; if (!K.clear(x, y, 60)) continue; const s = pick([0.7, 0.9, 1.1]); S(toadstoolCluster(s, 0xc4782c, pick([1, 2, 3])), x, y, 0, rr(0, 360)); round(x, y, 22 * s, 40 * s, 0, false); }

  // ---- the footbridge over the lines north of the station, closed (boarded at the foot of both stairs). Its towers
  // stand clear of the lines (west of line A, east of the loop); its stairs come down northward
  { const y = 1800, xm = -145, span = 950, { D, land, foot, sw } = FB2, xs0 = foot + 6, xs1 = land - 4, L = Math.hypot(xs0 - xs1, D + 2), ang = Math.atan2(D + 2, xs0 - xs1), dx = (xs1 - xs0) / L, dz = (D + 2) / L, nx = dz, nz = -dx, s0 = 46, T = 58, o = -4 + T / 2;
    S(footbridge2(span), xm, y, 0, 90);
    for (const s of [-1, 1]) { const tx = xm - s * span / 2;
      body(tx, y, 160, 180, D);
      const ux = xs0 + dx * (s0 + (L - s0) / 2) + nx * o, uz = dz * (s0 + (L - s0) / 2) + nz * o;   // the slab's middle (stair frame: x along the stair, z up)
      M.SolidRot(V(tx, y + ux, uz), V(L - s0, 2 * sw + 12, T), R((ang * 180) / Math.PI, 90, 0));
      body(tx, y + xs0 + 10, 2 * sw + 14, 10, 110);
      for (let i = 0; i < 5; i++) { const a = land + ((xs0 - land) * i) / 5, b = land + ((xs0 - land) * (i + 1)) / 5, h = (D + 2) * (xs0 - a) / (xs0 - xs1); body(tx, y + (a + b) / 2, 2 * sw + 14, b - a, h); }   // the boarded space under the stair
      O.GM.NavBlockBox({ min: V(tx - 70, y + 230, 0), max: V(tx + 70, y + xs0 + 20, 100) }, 1);
    }
    M.SolidRot(V(xm, y, D - 2), V(span + 160, 120, 10), R(0, 0, 0)); }
  // ---- the workshop and the stores west, the office by the gate, timber and drums about them
  house(-3700, -2700, 700, 1100, 420, { doors: [{ y: -250, w: 200, h: 280, side: 1, color: 0x5a3e2e }, { y: 300, w: 110, h: 230, side: 1 }], windows: { front: [0, 450], back: [-300, 100, 400], ends: [0] }, chimneys: [350], wz: 200 }, 7, 0);
  house(-2700, -4800, 500, 800, 360, { doors: [{ y: 0, w: 220, h: 260, side: 1, color: 0x6a4a34 }], windows: { back: [-200, 200], ends: [0] }, wz: 180 }, 9, 0);
  house(1500, -4900, 420, 560, 330, { doors: [{ y: -100, w: 110, h: 230, side: -1 }], windows: { back: [140], front: [-120, 120], ends: [0] }, chimneys: [180], wz: 170 }, 11, 0);
  S(timberStack(420), -3000, -2200, 0, 90); body(-3000, -2200, 150, 430, 90); S(timberStack(360), -3000, -3300, 0, 90); body(-3000, -3300, 150, 370, 90);
  for (const [x, y] of [[-3200, -1900], [-3270, -1950], [-3180, -1990], [-4200, -2000], [-4140, -2050]]) S(barrel(Math.round(x + y)), x, y, 0, 0); body(-3215, -1950, 170, 170, 92); body(-4170, -2025, 140, 130, 92);
  // ---- the goods platform along the goods shed's west face: low, crates and sacks on it, the hand crane at its end
  { const [gx, gy] = CD.goods, x = gx - 560; S(['dgoodsplat', shape((G) => { G.box(0, 0, 7.5, 150, 1100, 7.5, 0x8a8478); for (let y = -1080; y < 1100; y += 60) G.box(0, y + 30, 15.6, 148, 29, 1, Math.round(y / 60) % 2 ? 0x7a6a56 : 0x84745e); })], x, gy, 0, 0); body(x, gy, 300, 2200, 16, 0, 0, false); ramp(x, gy - 1100, -90, 240); ramp(x, gy + 1100, 90, 240);
    S(handCrane(), x - 60, gy - 1000, 16, 180); round(x - 60, gy - 1000, 42, 400, 0); for (const [dy, w] of [[-200, 64], [-130, 56], [450, 70]]) S(crate(w, Math.round(dy)), x + 20, gy + dy, 16, rr(-8, 8)); body(x + 20, gy - 165, 150, 160, 150, 0, 16); body(x + 20, gy + 450, 150, 150, 150, 0, 16);
    for (const dy of [700, 760, 820]) S(sack(26, 0xc8b48a), x + 30, gy + dy, 12, rr(0, 360)); body(x + 30, gy + 760, 90, 190, 54, 0, 12); }

  // ---- the yard's odds and ends: lamps, a cart, crates, sacks, a pile of sleepers, a spare wheelset
  for (const [x, y] of [[-800, -4060], [1150, -4350], [-1400, -2000], [1700, -2400], [1980, 2380], [-1500, 3000], [2900, 600], [-3500, -600], [-800, 4300], [800, 4300]]) lamp(x, y, x < 0 ? -1 : 1);
  S(cart(1, 7), 1500, -3600, 0, 20); body(1500, -3600, 240, 140, 150, 20);
  for (const [x, y, w] of [[-1900, -3800, 70], [-1820, -3790, 60], [-1880, -3720, 64]]) S(crate(w, Math.round(x + y)), x, y, 0, rr(-8, 8)); body(-1860, -3770, 200, 180, 140);
  S(sleeperPile(), 3200, 2600, 0, 30); body(3200, 2600, 260, 230, 80, 30); S(wheelset(), 3500, 3100, 0, 0); body(3500, 3100, 100, 260, 90);
  for (const [x, y] of [[4200, -3800], [-4300, 2600], [4300, 3800], [-4200, -3600]]) { S(rock(pick([90, 120]), pick([1, 2, 3]), true), x, y, 0, rr(0, 360)); trunk(x, y, 100, 100); }
  for (let i = 0; i < 120; i++) { const x = rr(-hx + 200, hx - 200), y = rr(-hy + 200, hy - 200); if (!K.clear(x, y, 50) || nearLine(x, y, 170) || ROADS.some((P) => lineDist(x, y, P) < 220)) continue; S(grassTuft(pick([30, 38]), pick([1, 2, 3])), x, y, 0, rr(0, 360)); }
  // tufts and weeds where the ground is left alone: at the foot of the walls, by the fences' posts, round the lamps
  for (let i = 0; i < 220; i++) { const side = i % 4, u = rr(-1, 1), e = rr(40, 260), x = side < 2 ? (side ? 1 : -1) * (hx - 80 - e) : u * (hx - 200), y = side < 2 ? u * (hy - 200) : (side === 2 ? 1 : -1) * (hy - 80 - e); if (!K.clear(x, y, 40) || nearLine(x, y, 170) || ROADS.some((P) => lineDist(x, y, P) < 210)) continue; S(grassTuft(pick([26, 32, 40]), pick([1, 2, 3])), x, y, 0, rr(0, 360)); }
  for (const [x, y] of [[-3500, -600], [-1400, -2000], [1700, -2400], [-1500, 3000], [2900, 600], [3600, 4800]]) for (let k = 0; k < 4; k++) { const a = rr(0, Math.PI * 2), d = rr(40, 110), tx2 = x + Math.cos(a) * d, ty2 = y + Math.sin(a) * d; if (K.clear(tx2, ty2, 20)) S(grassTuft(pick([24, 30]), pick([1, 2, 3])), tx2, ty2, 0, rr(0, 360)); }

  // a body in a piece's own frame (lx along its X, ly along its Y), the piece at (x0, y0) turned by yaw
  const rb = (x0, y0, yaw, lx, ly, w, d, h, z0 = 0, nav = true) => { const c = Math.cos((yaw * Math.PI) / 180), sn = Math.sin((yaw * Math.PI) / 180); body(x0 + lx * c - ly * sn, y0 + lx * sn + ly * c, w, d, h, yaw, z0, nav); };

  // ---- north-east: the coal merchants' yard. Three bays against the north wall, the weighbridge and its hut, two carts,
  // sacks filled and waiting
  [3000, 3560, 4120].forEach((x, i) => { const y = yN - 30 - 227, yw = -90; S(coalBay(520, 420, 190, i + 1), x, y, 0, yw);
    rb(x, y, yw, -210, 0, 34, 554, 200); for (const e of [-1, 1]) { rb(x, y, yw, -96, e * 260, 194, 34, 200); rb(x, y, yw, 105, e * 260, 210, 34, 128); } rb(x, y, yw, -40, 0, 330, 440, 120); });
  S(weighPlate(440, 240), 3640, 4380, 0, 0);
  house(4180, 4380, 300, 380, 280, { doors: [{ y: 100, w: 100, h: 210, side: 1, color: KC.green }], windows: { back: [-70], ends: [0] }, chimneys: [-120], wz: 160 }, 13, 0);
  S(cart(2, 3), 3000, 4950, 0, 100); body(3000, 4950, 330, 160, 150, 100); S(cart(0, 5), 4500, 5000, 0, 70); body(4500, 5000, 330, 160, 150, 70);
  for (const [x, y] of [[3420, 5240], [3460, 5180], [3380, 5170], [3430, 5110], [3700, 5260], [3740, 5200]]) S(sack(27, 0x2e2a26), x, y, -3, rr(0, 360)); body(3420, 5180, 140, 190, 56); body(3720, 5230, 120, 130, 56);
  lamp(3600, 4800, 1);
  // ---- the east wall: the stables for the drays, hay, the trough and the pump, a dray loaded with barrels
  house(5175, -800, 600, 1400, 360, { doors: [-420, 0, 420].map((y) => ({ y, w: 170, h: 240, side: -1, color: 0x5a4a34 })), windows: { back: [-210, 210], ends: [0] }, chimneys: [560], wz: 200 }, 15, 0);
  for (const [x, y, z, a] of [[4440, -1360, 0, 0], [4440, -1270, 0, 0], [4440, -1315, 42, 90], [4520, -1330, 0, 90]]) S(hayBale(Math.round(x + y + z)), x, y, z, a); body(4470, -1320, 200, 190, 84);
  S(trough(180), 4700, -700, 0, 90); body(4700, -700, 90, 200, 60); S(handPump(), 4700, -520, 0, 180); round(4700, -520, 22, 150);
  S(cart(1, 2), 4450, 100, 0, 200); body(4450, 100, 330, 160, 150, 200);
  // ---- south-east: the gangers' mess in an old carriage body; rails on their racks, sleepers, the trolley on its spur
  { const x = 3900, y = -4800; S(coachBody(1), x, y, 0, 0); body(x, y, COACH.len + 10, COACH.w + 8, 330); body(x + COACH.stepX, y + COACH.w / 2 + 36, 76, 64, 46); }
  S(railRack(640), 4700, -5450, 0, 0); body(4700, -5450, 660, 200, 100); S(railRack(560), 3000, -5450, 0, 0); body(3000, -5450, 580, 200, 100);
  { const x = 2250, y = -5450; S(track(560, 5), x, y, 0, 0); S(handTrolley(), x - 60, y, RAIL_TOP, 0); body(x - 60, y, 270, 190, 110); for (const e of [-1, 1]) { S(['dchock', shape((G) => { G.box(0, 0, 12, 10, 80, 7, KC.woodD); G.box(-8, 0, 6, 12, 70, 6, KC.wood); })], x + e * 300, y, 0, e > 0 ? 0 : 180); } }
  S(sleeperPile(), 4900, -4200, 0, 10); body(4900, -4200, 260, 230, 80, 10); S(grindstone(), 4400, -4250, 0, 30); round(4400, -4250, 50, 120);
  // ---- west wall: the railwaymen's allotments, fenced, a gate on the east; beds of cabbages and pumpkins, beans on
  // their canes, a shed with its water butt, a barrow and a scarecrow
  { const x0 = -5340, x1 = -4260, y0 = -1300, y1 = 1300;
    const edge = (len) => ['dedging|' + len, shape((G) => { G.box(0, 0, 7, len / 2, 3, 7, 0x6a5440); for (let x = -len / 2 + 60; x < len / 2 - 20; x += 120) G.box(x, -5, 6, 3, 3, 8, 0x4e3e30); })];
    for (const [x, y, len, yw] of [[(x0 + x1) / 2, y0, x1 - x0, 0], [(x0 + x1) / 2, y1, x1 - x0, 0], [x0, 0, y1 - y0, 90], [x1, (y0 - 160) / 2, -160 - y0, 90], [x1, (160 + y1) / 2, y1 - 160, 90]]) S(edge(Math.round(len)), x, y, 0, yw);
    for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1], [x1, -160], [x1, 160]]) { S(['dedgepost', shape((G) => { G.box(0, 0, 22, 6, 6, 22, 0x5a4634); G.box(0, 0, 45, 7, 7, 1.5, 0x4a3a2a); })], x, y, 0, 0); round(x, y, 8, 46, 0, false); }
    for (const [bx, by, crop] of [[-5030, -950, 'cab'], [-5030, -450, 'pump'], [-4570, -950, 'cab'], [-4570, -450, 'beans']]) { S(raisedBed(300, 140), bx, by, 0, 0); body(bx, by, 300, 140, crop === 'beans' ? 236 : crop === 'pump' ? 104 : 86);
      if (crop === 'cab') for (let i = 0; i < 5; i++) S(cabbage(pick([22, 26])), bx - 116 + i * 58, by + (i % 2 ? 22 : -22), 34, rr(0, 360));
      if (crop === 'pump') for (let i = 0; i < 3; i++) S(pumpkin(pick([32, 38])), bx - 90 + i * 90, by, 34, rr(0, 360));
      if (crop === 'beans') for (let i = 0; i < 3; i++) { S(beanWigwam(i + 1), bx - 96 + i * 96, by, 34, rr(0, 360)); } }
    S(gardenShed(220, 300), -5180, 900, 0, 0); body(-5180, 900, 240, 320, 240); S(rainBarrel(2), -5020, 1100, 0, 0); round(-5020, 1100, 34, 100);
    S(wheelbarrow(1), -4700, 300, 0, 200); body(-4700, 300, 170, 90, 70, 200); S(scarecrow(3), -4800, 700, 0, 120); round(-4800, 700, 14, 200); }
  // ---- north-west: the engine works' yard behind the shed: a boiler on trestles with its tubes drawn, the sand house,
  // a heap of ash and clinker, spare rails; a water crane on the shed road and one at the platform's north end
  { const x = -4500, y = 4300; S(boilerTrestles(), x, y, 0, 0); body(x, y, 620, 170, 280); body(x + 338, y + 85, 150, 24, 290); }
  house(-4900, 5350, 360, 480, 300, { doors: [{ y: -60, w: 110, h: 220, side: 1, color: 0x5a3e2e }], windows: { front: [140], ends: [0] }, chimneys: [180], wz: 170 }, 17, 0);
  S(ashHeap(170, 1), -3500, 3650, 0, 30); round(-3500, 3650, 160, 68); S(railRack(600), -4300, 3500, 0, 90); body(-4300, 3500, 200, 620, 100);
  S(waterCrane(), -3100, 1550, 0, 0); round(-3100, 1550, 30, 360); body(-3020, 1470, 60, 60, 80);
  S(waterCrane(), 250, 1450, 0, 180); round(250, 1450, 30, 360); body(170, 1530, 60, 60, 80);
  // ---- on the platform: milk churns waiting at its north end; the notice board on the forecourt
  for (const [dx, dy] of [[0, 0], [44, 18], [10, 52]]) S(churn(84), 340 + dx, 1205 + dy, 16, rr(0, 360)); round(360, 1230, 56, 100, 16);
  // a timetable board on the forecourt: two green posts, a framed board with its sheets pinned up, a little roof over it
  S(['dtimetable', shape((G) => { for (const s2 of [-1, 1]) G.box(0, s2 * 100, 125, 5, 5, 125, KC.green); G.box(0, 0, 160, 4, 104, 66, KC.green); G.box(-4.5, 0, 160, 0.6, 96, 58, 0x3a3226);
    for (const [y, z, w, h, c] of [[-60, 182, 28, 34, 0xe8dcc0], [-20, 178, 30, 38, 0xf0e6cc], [26, 184, 32, 30, 0xe0d4b4], [66, 176, 24, 40, 0xece0c4], [-48, 130, 34, 26, 0xd8ccb0], [10, 128, 40, 30, 0xe8dcc0], [64, 134, 22, 24, 0xf0e6cc]]) { G.box(-5.4, y, z, 0.4, w / 2, h / 2, c); for (let k = 0; k < 3; k++) G.box(-5.7, y, z + h / 2 - 8 - k * 9, 0.2, w / 2 - 5, 1, 0x6a5e4e); G.box(-5.8, y, z + h / 2 - 3, 0.3, 1.4, 1.4, KC.red); }
    G.surf((u, v) => [-30 + v * 46, (u - 0.5) * 230, 252 - v * 18], 0, 1, 4, 0, 1, 1, 0x3a3a3e); G.box(-6, 0, 250, 3, 112, 3, KC.green); })], 1640, -700, 0, 0); body(1640, -700, 40, 220, 260);

  // ---- the way on: a cobbled square by the north wall where the stations come up, the line under its arch beside it
  { const [x, y] = CD.floor; S(cobbleSquare(60, CD.floorR, 60), x, y, 0.4, 0); }

  // ---- beyond the walls (out of reach): the Works' roofs and chimneys, the ironworks' stacks smoking, hills
  for (let i = 0; i < 26; i++) { const side = i % 4, u = rr(-0.9, 0.9), d = rr(900, 3000), x = side < 2 ? (side ? 1 : -1) * (hx + d) : u * (hx + 2000), y = side < 2 ? u * (hy + 2000) : (side === 2 ? 1 : -1) * (hy + d);
    S(farHouse(pick([600, 800]), pick([900, 1200]), pick([420, 560]), i), x, y, 0, side < 2 ? 0 : 90); }
  for (const [x, y, h] of [[-9000, 9000, 2600], [-7000, 11000, 3000], [8000, 10000, 2800]]) S(['dstack|' + h, shape((G) => { G.lathe([[110, 0], [90, h * 0.2], [70, h], [80, h + 30], [0, h + 30]], (k) => (k < 3 ? KC.brick[k % 4] : KC.iron), 14); })], x, y, 0, 0);
  for (let i = 0; i < 40; i++) { const side = i % 4, u = rr(-1, 1), d = rr(3200, 5200), x = side < 2 ? (side ? 1 : -1) * (hx + d) : u * (hx + 4000), y = side < 2 ? u * (hy + 4000) : (side === 2 ? 1 : -1) * (hy + d); S(farTree(pick([1600, 2000]), i % 3 === 0 ? 1 : 0, pick([0x3e5e2e, 0x48683a]), pick([1, 2])), x, y, 0, rr(0, 360)); }
  for (const [x, y, rx, ry, h] of [[-15000, 0, 5000, 9000, 2400], [15500, 1500, 5500, 9000, 2600], [0, 16000, 9000, 4000, 2800], [0, -16000, 9000, 4000, 2400]]) S(hill(rx, ry, h, 0x5a7a3e), x, y, -40, 0);

  return {
    spots: { spawn: [GX, -5350], yaw: Math.PI, exit: [650, 5650], textYaw: -90, ammo: [GX + 500, -5250], ammoYaw: 90,
      bench: [100, 5030], benchYaw: 0, box: [1300, 4800], chest: [1300, 4800], chestYaw: 180, press: [100, 4530], pressYaw: 0 },
    keep: [[CD.floor[0], CD.floor[1], 900]],
    hangs, beds: null,
  };
}
