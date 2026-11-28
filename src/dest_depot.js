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
import { farTree, blightMass } from './dest_props.js';
import { brickRun, brickHouse, farHouse, track, GAUGE, bufferStop, locomotive, LOCO_LEN, wagon, waterTower, gantry, gantryHangs, canopy, canopyHangs, signalBox, barrel, depotGate, footbridge2, handCrane, timberStack, KC } from './dest_props_works.js';
import { shapeB as shape } from './propkit.js';
import { rock, toadstoolCluster, grassTuft, lanternPost, hill, mix } from './village_shapes.js';
import { crate, sack, cart, cobbleSquare } from './village_props.js';

export const CD = { lineA: -300, lineB: 0, platform: [430, 0], station: [1250, 0], shed: [-2700, 2500], turn: [-2700, 300], tower: [-1250, 900], coal: [-1350, -1300], signal: [-1000, -2900],
  goods: [3600, -1800], sidA: 2150, sidB: 2550, gantry: [2350, 1300], floor: [700, 4900], floorR: 900 };
const RB = 'dest_depot';

// a low wall-mounted platform: setts on top, a stone edge with a white line along the track side
const platformShape = (len, w) => ['dplatform|' + [len, w].join('|'), shape((G) => { const hl = len / 2, hw = w / 2;
  G.box(0, 0, 7, hw, hl, 7, 0x8a8478); for (let y = -hl + 20; y < hl; y += 40) for (let x = -hw + 30; x < hw - 20; x += 60) G.box(x + ((y / 40) % 2 ? 15 : 0), y, 14.6, 28, 18, 1.2, [0x9a948a, 0x8e887e, 0xa49e92][Math.abs(Math.round(x + y)) % 3]);
  for (const s of [-1, 1]) { G.box(s * (hw - 14), 0, 15.5, 14, hl, 1.6, 0xc8c0b0); } G.box(-hw + 22, 0, 16.8, 3, hl, 0.6, 0xf2ecd8); })];
// a semaphore signal: an iron post with a ladder, the red arm with its white band, the lamp
const signalPost = () => ['dsignal', shape((G) => { G.tube([[0, 0, -8], [0, 0, 520]], 7, KC.iron, { S: 8, M: 6 }); G.lathe([[10, 520], [12, 526], [0, 534]], KC.iron, 8);
  G.box(10, 26, 470, 2, 36, 7, KC.red); G.box(11, 46, 470, 1.5, 6, 7.2, KC.cream); G.box(0, 0, 470, 5, 5, 8, KC.iron); G.box(8, -6, 452, 6, 6, 8, KC.iron); G.box(14.5, -6, 452, 1, 4, 4, 0xfff0c0);
  for (const s of [-1, 1]) G.tube([[-12, s * 12, 0], [-12, s * 12, 440]], 1.6, KC.iron, { S: 4, M: 4 }); for (let z = 30; z < 440; z += 36) G.box(-12, 0, z, 1.2, 12, 1.2, KC.iron); G.box(-6, 0, 440, 8, 3, 2, KC.iron); })];
// a station clock on a bracket off the wall (faces +X)
const clockShape = () => ['dclock', shape((G) => { G.box(18, 0, 0, 18, 4, 4, KC.iron); for (const s of [-1, 1]) { const b = G.n; G.lathe([[0, -6], [34, -6], [36, -3], [36, 3], [34, 6], [0, 6]], KC.green, 16, [0, 0, 0]); G.place(b, { x: 40 + s * 0, y: s * 7, z: 0, roll: 90 }); const c = G.n; G.lathe([[0, 0], [30, 0]], KC.cream, 16, [0, 0, 0]); G.place(c, { x: 40, y: s * 13.5, z: 0, roll: s * 90 }); G.box(40, s * 14, 6, 1.5, 0.6, 14, KC.iron); G.box(46, s * 14, 0, 8, 0.6, 1.5, KC.iron); } })];
// a pile of sleepers, a heap of coal, a pair of spare wheels on their axle
const sleeperPile = () => ['dsleepers', shape((G) => { for (let r = 0; r < 4; r++) for (let i = 0; i < 5 - (r % 2); i++) G.box((r % 2 ? 90 : 0) + (r % 2 ? 0 : -90) * 0 + (r % 2 ? -90 : 0) * 0, -88 + i * 40 + (r % 2) * 20, 9 + r * 18, 115, 17, 8.5, r % 2 ? KC.sleeper : mix(KC.sleeper, 0x000000, 0.15)); })];
const coalHeap = (r) => ['dcoalheap|' + r, shape((G) => { G.blob(0, 0, 0, r, r * 0.8, r * 0.5, (nx, ny, nz) => (Math.sin(nx * 23 + ny * 17) > 0.6 ? KC.coalL : KC.coal), { nu: 14, nv: 7, warp: (x, y, z) => [x, y, Math.max(z, -2)] }); })];
const wheelset = () => ['dwheelset', shape((G) => { G.tube([[0, -GAUGE / 2 - 30, 40], [0, GAUGE / 2 + 30, 40]], 7, KC.ironL, { S: 8, M: 3 }); for (const s of [-1, 1]) { const b = G.n; G.lathe([[0, -6], [36, -6], [40, -2], [40, 2], [36, 6], [0, 6]], KC.iron, 16, [0, 0, 0]); G.place(b, { y: s * (GAUGE / 2 + 8), z: 40, roll: 90 }); } })];

export function buildDepot(M, O) {
  const { hx, hy } = O;
  const K = destKit(M, 37, O, { exactNav: true }), { S, body, round, trunk, patch, blot, path, rnd, rr, Box, lineDist } = K;
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

  // ---- the ground: cobbled yard, cinders along the lines, grass gone to weeds at the edges
  Box(V(0, 0, -60), V(hx * 2 + 24000, hy * 2 + 24000, 120), 0x6a6458, true, false);
  for (let i = 0; i < 60; i++) { const side = i % 4, u = rr(-1, 1), e = rr(120, 520), x = side < 2 ? (side ? 1 : -1) * (hx - e) : u * (hx - 300), y = side < 2 ? u * (hy - 300) : (side === 2 ? 1 : -1) * (hy - e); patch(x, y, rr(300, 700), pick([0x5e6e3a, 0x667440, 0x58683a, 0x6e7646])); }
  for (let i = 0; i < 30; i++) { const x = rr(-hx + 600, hx - 600), y = rr(-hy + 600, hy - 600); patch(x, y, rr(400, 900), pick([0x625c52, 0x726a5e, 0x5e584e])); }
  for (const [x, y, d, c] of [[CD.station[0] - 300, 0, 2400, 0x7a746a], [0, -4700, 2200, 0x7a746a], [CD.goods[0] - 600, CD.goods[1] + 1200, 2600, 0x726c62], [CD.floor[0], CD.floor[1], 2200, 0x7a746a]]) patch(x, y, d, c);
  path([[0, -6100], [0, -5200], [150, -4300], [600, -3400], [900, -1900]], 380, 0x8a8070); path([[900, 1900], [800, 3600], [700, 4300]], 360, 0x8a8070);

  // ---- the walls round the depot: brick with piers and stone copings; gaps where the road and the line come in
  const WH = 300, wall = (x0, x1, y, alongY = false, seed = 1) => { const L = Math.abs(x1 - x0), n = Math.max(1, Math.round(L / 600)), seg = L / n;
    for (let i = 0; i < n; i++) { const a = Math.min(x0, x1) + seg * i, b = a + seg, sd = seed + i; S(['dbwall|' + [Math.round(seg), sd % 4].join('|'), shape((G) => { brickRun(G, -seg / 2, seg / 2, 0, 0, WH, 34, sd, false, true); G.box(0, 0, WH + 6, seg / 2, 24, 6, KC.trim); for (const s of [-1, 1]) { brickRun(G, s * seg / 2 - 30, s * seg / 2 + 30, 0, 0, WH + 30, 54, sd + 5); G.box(s * seg / 2, 0, WH + 36, 34, 34, 6, KC.trim); } })], alongY ? y : (a + b) / 2, alongY ? (a + b) / 2 : y, 0, alongY ? 90 : 0); }
    if (alongY) body(y, (x0 + x1) / 2, 60, L, WH + 40); else body((x0 + x1) / 2, y, L, 60, WH + 40); };
  const yS = -hy + 80, yN = hy - 80, xW = -hx + 80, xE = hx - 80;
  wall(xW, CD.lineA - 300, yS, false, 1); wall(CD.lineA + 300, -500, yS, false, 3); wall(500, xE, yS, false, 5);
  wall(xW, CD.lineA - 320, yN, false, 7); wall(CD.lineA + 320, -500, yN, false, 9); wall(500, xE, yN, false, 11);
  wall(yS, yN, xW, true, 13); wall(yS, yN, xE, true, 17);
  // the gate the road comes in by, with the depot's name over it; the arch the line leaves by in the north wall
  S(depotGate(700), 0, yS, 0, 90); for (const s of [-1, 1]) body(s * 390, yS, 100, 100, 400);
  M.Sign(V(0, yS - 6, 430), -90, 'COGSWORTH DEPOT', { r: 0.95, g: 0.86, b: 0.6 }, 30); M.Sign(V(0, yS + 6, 430), 90, 'COGSWORTH DEPOT', { r: 0.95, g: 0.86, b: 0.6 }, 30);
  for (const y of [yS, yN]) { S(['dlinearch', shape((G) => { for (const s of [-1, 1]) brickRun(G, s * 250, s * 330, 0, 0, 380, 70, 21 + s); G.surf((u, v) => { const a = Math.PI * u, rr0 = 250 + v * 80; return [Math.cos(a) * rr0, 0, 380 + Math.sin(a) * rr0 * 0.6]; }, 0, 1, 16, 0, 1, 1, KC.brick[2]); for (const s of [-1, 1]) G.surf((u, v) => { const a = Math.PI * u, rr0 = 250 + v * 80; return [Math.cos(a) * rr0, s * 35, 380 + Math.sin(a) * rr0 * 0.6]; }, 0, 1, 16, 0, 1, 1, KC.brick[1]); G.box(0, 0, 380 + 330 * 0.6 + 30, 340, 40, 30, KC.brick[0]); G.box(0, 0, 380 + 330 * 0.6 + 64, 350, 44, 6, KC.trim); })], CD.lineA, y, 0, 0);
    for (const s of [-1, 1]) body(CD.lineA + s * 290, y, 80, 70, 600); body(CD.lineA, y, 660, 70, 160, 0, 520, false); }

  // ---- the lines: the main line end to end, the station loop, the sidings, the shed roads; buffer stops at their ends
  const lay = (x0, y0, x1, y1) => { const L = Math.hypot(x1 - x0, y1 - y0); S(track(L, Math.round(x0 + y0)), (x0 + x1) / 2, (y0 + y1) / 2, 0, (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI); };
  lay(CD.lineA, -hy - 400, CD.lineA, hy + 400);
  lay(CD.lineB, -2400, CD.lineB, 2400); lay(CD.lineA, -3300, CD.lineB, -2400); lay(CD.lineB, 2400, CD.lineA, 3300);
  lay(CD.lineA, 3600, CD.sidA, 1800); lay(CD.sidA, 1800, CD.sidA, -3600); lay(CD.sidA, 1000, CD.sidB, 400); lay(CD.sidB, 400, CD.sidB, -3600);
  for (const x of [CD.sidA, CD.sidB]) { S(bufferStop(), x, -3640, 0, 90); body(x, -3640, 70, 280, 80); }
  lay(CD.lineA, 1600, CD.turn[0] + 420, CD.turn[1] + 160); lay(CD.turn[0], CD.turn[1] + 480, CD.shed[0] - 180, CD.shed[1] - 700); lay(CD.turn[0], CD.turn[1] + 480, CD.shed[0] + 180, CD.shed[1] - 700);
  for (const dx of [-180, 180]) lay(CD.shed[0] + dx, CD.shed[1] - 700, CD.shed[0] + dx, CD.shed[1] - 200);

  // ---- the platform and its canopy, the station house with the clock, benches, lamps, the name boards
  { const [px, py] = CD.platform, len = 2600, w = 300; S(platformShape(len, w), px, py, 0, 0); body(px, py, w, len, 16, 0, 0, false);
    S(canopy(2000, 420, 330), px + 20, py, 0, 0); for (let y = -900; y <= 900; y += 1800 / Math.round(1800 / 400)) round(px + 20, py + y, 12, 360, 16, false);
    M.SolidRot(V(px + 20, py, 370), V(480, 2040, 16), R(0, 0, 0)); for (const [hx2, hy2, hz] of canopyHangs(2000, 420, 330)) hangs.push([px + 20 + hx2, py + hy2, hz]);
    for (const y of [-700, 0, 700]) { S(['dpbench', shape((G) => { for (const s of [-1, 1]) { G.box(0, s * 80, 22, 18, 4, 22, KC.iron); G.box(-10, s * 80, 58, 4, 4, 36, KC.iron); } G.box(0, 0, 44, 20, 92, 3, KC.wood); G.box(-14, 0, 70, 3, 92, 12, KC.wood); })], px + 80, py + y + 250, 16, 180); body(px + 80, py + y + 250, 50, 190, 90, 0, 16, false); }
    for (const y of [-1100, -400, 400, 1100]) lamp(px + 120, py + y, 1);
    for (const s of [-1, 1]) { const y = py + s * 1150; S(['dnameboard', shape((G) => { for (const t of [-1, 1]) G.tube([[0, t * 120, 0], [0, t * 120, 230]], 4, KC.green, { S: 6, M: 3 }); G.box(0, 0, 200, 4, 140, 26, KC.green); G.box(0, 0, 200, 4.5, 132, 20, KC.cream); })], px + 60, y, 16, 0); M.Sign(V(px + 66, y, 216), 0, 'COGSWORTH', { r: 0.18, g: 0.3, b: 0.22 }, 22); M.Sign(V(px + 54, y, 216), 180, 'COGSWORTH', { r: 0.18, g: 0.3, b: 0.22 }, 22); round(px + 60, y - 120, 6, 230, 16, false); round(px + 60, y + 120, 6, 230, 16, false); } }
  { const [x, y] = CD.station; house(x, y, 640, 1500, 420, { doors: [{ y: 0, w: 140, h: 260, side: -1, color: KC.green, arch: true }, { y: -500, w: 110, h: 230, side: -1 }, { y: 500, w: 110, h: 230, side: 1 }], windows: { back: [-300, 300, -650, 650], front: [-400, 0, 300], ends: [-160, 160] }, chimneys: [-450, 450], wz: 180 }, 1);
    S(clockShape(), x - 320, y, 300, 180); body(x - 360, y, 60, 90, 80, 0, 260, false);
    for (const dy of [-260, 260]) { S(barrel(Math.round(dy)), x + 360, y + dy, 0, 0); round(x + 360, y + dy, 36, 92); } }

  // ---- the engine: standing at the platform on the loop, the fire still in; a train of wagons behind it on the main line
  S(locomotive(0), CD.lineB, 400, 0, 90); body(CD.lineB, 400, 220, LOCO_LEN + 20, 420); K.lit(CD.lineB, 400 + LOCO_LEN / 2 - 50, 130, { r: 1, g: 0.86, b: 0.6 }, 600);
  for (const [i, k] of [0, 0, 1, 2].entries()) { const y = -1300 - i * 560; S(wagon(k, i + 1), CD.lineA, y, 0, 90); body(CD.lineA, y, 190, 560, k === 1 ? 190 : k === 2 ? 280 : 240); }

  // ---- west of the line: the signal box, the coal stage, the water tower, the turntable, the engine shed
  { const [x, y] = CD.signal; S(signalBox(), x, y, 0, 180); body(x, y, 360, 460, 600); body(x + 110, y - 380, 120, 300, 240, 0, 0, false); }
  for (const [x, y] of [[CD.lineA - 160, -2200], [CD.lineA - 160, 2700], [CD.lineB + 160, -2600]]) { S(signalPost(), x, y, 0, 0); round(x, y, 14, 530); }
  { const [x, y] = CD.coal; S(['dcoalstage', shape((G) => { brickRun(G, -260, 260, -180, 0, 160, 40, 2); brickRun(G, -260, 260, 180, 0, 160, 40, 3); brickRun(G, -180, 180, -260, 0, 160, 40, 4, true); G.box(0, 0, 80, 240, 160, 80, KC.coal); G.blob(0, 0, 160, 230, 150, 70, (nx, ny, nz) => (Math.sin(nx * 23 + ny * 17) > 0.6 ? KC.coalL : KC.coal), { nu: 14, nv: 6, warp: (x2, y2, z2) => [x2, y2, Math.max(z2, -4)] }); G.box(0, 0, 166, 270, 190, 6, KC.trim); for (const s of [-1, 1]) G.tube([[s * 200, 190, 160], [s * 200, 190, 420]], 6, KC.iron, { S: 6, M: 4 }); G.box(0, 190, 420, 230, 6, 8, KC.iron); G.surf((u, v) => [-120 + u * 240, 190 + v * 120, 300 - v * 110], 0, 1, 2, 0, 1, 2, KC.iron); })], x, y, 0, 90); body(x, y, 380, 540, 230); round(x - 190, y - 200, 10, 420, 0, false); round(x - 190, y + 200, 10, 420, 0, false);
    for (const [dx, dy] of [[-420, -200], [-460, -120]]) S(sack(26, 0x2e2a26), x + dx, y + dy, -4, rr(0, 360)); body(x - 440, y - 160, 120, 160, 50); S(coalHeap(170), x - 380, y + 420, 0, 30); trunk(x - 380, y + 420, 150, 80); }
  { const [x, y] = CD.tower; S(waterTower(), x, y, 0, 0); body(x, y, 340, 340, 420); round(x, y, 180, 290, 420); hangs.push([x + 170 + 190, y, 420 - 28]); }
  { const [x, y] = CD.turn, r = 480; S(['dturntable|' + r, shape((G) => { G.lathe([[r + 30, -2], [r + 30, 6], [r, 6], [r, -2]], 0x8a8478, 32); G.lathe([[0, 1], [r, 1]], 0x3a3634, 32); G.lathe([[r - 30, 3], [r - 22, 3], [r - 22, 6], [r - 30, 6]], KC.rail, 32); for (const s of [-1, 1]) { G.box(0, s * GAUGE / 2, 6.5, r, 3.5, 1.4, KC.rail); G.box(0, s * (GAUGE / 2 + 30), 8, r, 6, 6, KC.iron); } for (let x2 = -r + 20; x2 < r; x2 += 48) G.box(x2, 0, 3, 9, GAUGE / 2 + 26, 2.6, KC.sleeper); G.box(0, GAUGE / 2 + 60, 6, 20, 26, 6, KC.iron); })], x, y, 0, 90); }
  // the engine shed faces the turntable: its front (+X as built) turned to the south, its two doors on the shed roads
  { const [x, y] = CD.shed; house(x, y, 1100, 1500, 560, { doors: [{ y: -180, w: 240, h: 400, side: 1, color: 0x5a3e2e }, { y: 180, w: 240, h: 400, side: 1, color: 0x5a3e2e }], windows: { back: [-500, 0, 500], ends: [-300, 300] }, chimneys: [-300, 300], wz: 260, pitch: 0.5 }, 3, -90);
    S(wheelset(), x + 700, y - 400, 0, 90); body(x + 700, y - 400, 100, 260, 90); S(sleeperPile(), x + 750, y + 300, 0, 0); body(x + 750, y + 300, 250, 220, 80); }

  // ---- east: the goods yard, its sidings under the gantry, the goods shed with its loading door; the burst van
  { const [x, y] = CD.goods; house(x, y, 800, 2000, 460, { doors: [{ y: -500, w: 260, h: 300, side: -1, color: 0x5a3e2e }, { y: 300, w: 260, h: 300, side: -1, color: 0x5a3e2e }], windows: { back: [-900, -100, 800], front: [-600, 0, 600], ends: [-200, 200] }, chimneys: [700], wz: 250 }, 5, 0);
    for (const [dx, dy, w] of [[-560, -900, 70], [-560, -820, 60], [-640, -860, 70], [-560, 820, 70], [-650, 800, 64]]) S(crate(w, Math.round(dx - dy)), x + dx, y + dy, 0, rr(-8, 8)); body(x - 600, y - 860, 200, 220, 140); body(x - 600, y + 810, 200, 160, 140);
    for (const [dx, dy] of [[-520, -300], [-520, -230], [-590, -260], [-520, 1200], [-590, 1240]]) S(barrel(Math.round(dx + dy)), x + dx, y + dy, 0, 0); body(x - 555, y - 265, 160, 150, 92); body(x - 555, y + 1220, 160, 130, 92); }
  { const [x, y] = CD.gantry, span = 1000, Hh = 720; S(gantry(span, Hh), x, y, 0, 90); for (const s of [-1, 1]) { body(x + s * span / 2, y, 70, 480, 120); for (const k of [-1, 1]) trunk(x + s * span / 2, y + k * 200, 20, Hh); }
    for (const [gx, gy, gz] of gantryHangs(span, Hh)) hangs.push([x - gy, y + gx, gz]); }
  { S(wagon(0, 4), CD.sidA, -1900, 0, 90); body(CD.sidA, -1900, 190, 560, 240); S(wagon(1, 5), CD.sidA, -2500, 0, 90); body(CD.sidA, -2500, 190, 560, 190);
    S(wagon(2, 6), CD.sidB, -700, 0, 90); body(CD.sidB, -700, 190, 560, 280); }
  // the Blight: out through the van's open door and over the yard; a smaller growth under the canopy's south end
  const blightAt = [];
  for (const [x, y, r, sd] of [[CD.sidB + 280, -650, 380, 2], [CD.platform[0] + 260, -1450, 220, 4], [CD.tower[0] - 400, CD.tower[1] - 300, 200, 3]]) { S(blightMass(r, sd, 'rust'), x, y, 0, rr(0, 360)); trunk(x, y, r * 0.62, r * 0.55); blightAt.push([x, y, r]); K.lit(x, y, 90, { r: 1, g: 0.82, b: 0.3 }, 700, 0xffd24e); }
  for (const [x, y, r] of blightAt) for (let k = 0; k < 5; k++) { const a = rr(0, Math.PI * 2), d = rr(r * 0.8, r * 2.6); patch(x + Math.cos(a) * d, y + Math.sin(a) * d, rr(220, 520), pick([0x7a4a2a, 0x8a5a32, 0x6a3e24])); }
  for (let i = 0; i < 14; i++) { const a = rr(0, Math.PI * 2), d = rr(500, 1400), x = blightAt[0][0] + Math.cos(a) * d, y = blightAt[0][1] + Math.sin(a) * d; if (!K.clear(x, y, 60)) continue; const s = pick([0.7, 0.9, 1.1]); S(toadstoolCluster(s, 0xc4782c, pick([1, 2, 3])), x, y, 0, rr(0, 360)); round(x, y, 22 * s, 40 * s, 0, false); }

  // ---- the footbridge over the lines north of the station: walk under it; its stair towers are solid
  { const x = (CD.lineA + CD.lineB) / 2 + 140, y = 1850, span = 1100; S(footbridge2(span), x, y, 0, 90); for (const s of [-1, 1]) { body(x + s * span / 2, y, 190, 220, 420); body(x + s * span / 2 + 0, y - 150, 140, 300, 300, 0, 0, false); } M.SolidRot(V(x, y, 422), V(span + 160, 140, 10), R(0, 0, 0)); }
  // ---- the workshop and the stores west, the office by the gate, timber and drums about them
  house(-3700, -2700, 700, 1100, 420, { doors: [{ y: -250, w: 200, h: 280, side: 1, color: 0x5a3e2e }, { y: 300, w: 110, h: 230, side: 1 }], windows: { front: [0, 450], back: [-300, 100, 400], ends: [0] }, chimneys: [350], wz: 200 }, 7, 0);
  house(-2700, -4800, 500, 800, 360, { doors: [{ y: 0, w: 220, h: 260, side: 1, color: 0x6a4a34 }], windows: { back: [-200, 200], ends: [0] }, wz: 180 }, 9, 0);
  house(1500, -4900, 420, 560, 330, { doors: [{ y: -100, w: 110, h: 230, side: -1 }], windows: { back: [140], front: [-120, 120], ends: [0] }, chimneys: [180], wz: 170 }, 11, 0);
  S(timberStack(420), -3000, -2200, 0, 90); body(-3000, -2200, 150, 430, 90); S(timberStack(360), -3000, -3300, 0, 90); body(-3000, -3300, 150, 370, 90);
  for (const [x, y] of [[-3200, -1900], [-3270, -1950], [-3180, -1990], [-4200, -2000], [-4140, -2050]]) S(barrel(Math.round(x + y)), x, y, 0, 0); body(-3215, -1950, 170, 170, 92); body(-4170, -2025, 140, 130, 92);
  // ---- the goods platform along the goods shed's west face: low, crates and sacks on it, the hand crane at its end
  { const [gx, gy] = CD.goods, x = gx - 560; S(['dgoodsplat', shape((G) => { G.box(0, 0, 7.5, 150, 1100, 7.5, 0x8a8478); for (let y = -1080; y < 1100; y += 60) G.box(0, y + 30, 15.6, 148, 29, 1, Math.round(y / 60) % 2 ? 0x7a6a56 : 0x84745e); })], x, gy, 0, 0); body(x, gy, 300, 2200, 16, 0, 0, false);
    S(handCrane(), x - 60, gy - 1000, 16, 180); round(x - 60, gy - 1000, 42, 400, 0); for (const [dy, w] of [[-200, 64], [-130, 56], [450, 70]]) S(crate(w, Math.round(dy)), x + 20, gy + dy, 16, rr(-8, 8)); body(x + 20, gy - 165, 150, 160, 150, 0, 16); body(x + 20, gy + 450, 150, 150, 150, 0, 16);
    for (const dy of [700, 760, 820]) S(sack(26, 0xc8b48a), x + 30, gy + dy, 12, rr(0, 360)); body(x + 30, gy + 760, 90, 190, 54, 0, 12); }

  // ---- the yard's odds and ends: lamps, a cart, crates, sacks, a pile of sleepers, a spare wheelset
  for (const [x, y] of [[-800, -4300], [800, -4300], [-1400, -2000], [1700, -2400], [1700, 2300], [-1500, 3000], [2900, 600], [-3500, -600], [-800, 4300], [800, 4300]]) lamp(x, y, x < 0 ? -1 : 1);
  S(cart(1, 7), 1500, -3600, 0, 20); body(1500, -3600, 240, 140, 150, 20);
  for (const [x, y, w] of [[-1900, -3800, 70], [-1820, -3790, 60], [-1880, -3720, 64]]) S(crate(w, Math.round(x + y)), x, y, 0, rr(-8, 8)); body(-1860, -3770, 200, 180, 140);
  S(sleeperPile(), 3200, 2600, 0, 30); body(3200, 2600, 260, 230, 80, 30); S(wheelset(), 3500, 3100, 0, 0); body(3500, 3100, 100, 260, 90);
  for (const [x, y] of [[4200, -3800], [-4300, 2600], [4300, 3800], [-4200, -3600]]) { S(rock(pick([90, 120]), pick([1, 2, 3]), true), x, y, 0, rr(0, 360)); trunk(x, y, 100, 100); }
  for (let i = 0; i < 120; i++) { const x = rr(-hx + 200, hx - 200), y = rr(-hy + 200, hy - 200); if (!K.clear(x, y, 50) || Math.abs(x - CD.lineA) < 160 || Math.abs(x - CD.lineB) < 160 && Math.abs(y) < 2500) continue; S(grassTuft(pick([30, 38]), pick([1, 2, 3])), x, y, 0, rr(0, 360)); }

  // ---- the way on: a cobbled square by the north wall where the stations come up, the line under its arch beside it
  { const [x, y] = CD.floor; S(cobbleSquare(60, CD.floorR, 60), x, y, 0.4, 0); }

  // ---- beyond the walls (out of reach): the Works' roofs and chimneys, the ironworks' stacks smoking, hills
  for (let i = 0; i < 26; i++) { const side = i % 4, u = rr(-0.9, 0.9), d = rr(900, 3000), x = side < 2 ? (side ? 1 : -1) * (hx + d) : u * (hx + 2000), y = side < 2 ? u * (hy + 2000) : (side === 2 ? 1 : -1) * (hy + d);
    S(farHouse(pick([600, 800]), pick([900, 1200]), pick([420, 560]), i), x, y, 0, side < 2 ? 0 : 90); }
  for (const [x, y, h] of [[-9000, 9000, 2600], [-7000, 11000, 3000], [8000, 10000, 2800]]) S(['dstack|' + h, shape((G) => { G.lathe([[110, 0], [90, h * 0.2], [70, h], [80, h + 30], [0, h + 30]], (k) => (k < 3 ? KC.brick[k % 4] : KC.iron), 14); })], x, y, 0, 0);
  for (let i = 0; i < 40; i++) { const side = i % 4, u = rr(-1, 1), d = rr(3200, 5200), x = side < 2 ? (side ? 1 : -1) * (hx + d) : u * (hx + 4000), y = side < 2 ? u * (hy + 4000) : (side === 2 ? 1 : -1) * (hy + d); S(farTree(pick([1600, 2000]), i % 3 === 0 ? 1 : 0, pick([0x3e5e2e, 0x48683a]), pick([1, 2])), x, y, 0, rr(0, 360)); }
  for (const [x, y, rx, ry, h] of [[-15000, 0, 5000, 9000, 2400], [15500, 1500, 5500, 9000, 2600], [0, 16000, 9000, 4000, 2800], [0, -16000, 9000, 4000, 2400]]) S(hill(rx, ry, h, 0x5a7a3e), x, y, -40, 0);

  return {
    spots: { spawn: [0, -5300], yaw: Math.PI, exit: [650, 5650], textYaw: -90, ammo: [650, -5300], ammoYaw: 90,
      bench: [100, 5030], benchYaw: 0, box: [1300, 4800], chest: [1300, 4800], chestYaw: 180, press: [100, 4530], pressYaw: 0 },
    keep: [[CD.floor[0], CD.floor[1], 900]],
    hangs, beds: null,
  };
}
