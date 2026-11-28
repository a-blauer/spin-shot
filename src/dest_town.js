// Market Town, in the Works: the town where the works' goods are bought and sold. Main Street comes up from the south
// between its terraces of houses and shops, across Mill Lane, into the Market Square: the market hall on its piers in
// the middle, the stalls in their rows, the town pump and the bandstand, gas lamps all round, and on the north side
// the town hall under its clock. The church stands in its yard to the north-west, the gasworks to the south-east, the
// allotments to the north-east; the back gardens lie behind the terraces, the hedge and the fields round it all. The
// Blight (Rustcap) came up through the flags in the middle of the market and burst the stalls; its threads run out
// across the square. The way on is the little square past the town gardens, where the north road leaves the town.
//
// Local frame (dest.js): +Y north, +X east, z up; the ground is flat at z = 0. Playable: x in [-5400, 5400],
// y in [-5800, 5800].
import * as THREE from 'three';
import { V, R } from './mapkit.js';
import { destKit } from './dest_kit.js';
import { blightMass, handPump, farTree, hedgeLump, gatePost, gateLeaf, raisedBed, wheelbarrow } from './dest_props.js';
import { toadstoolCluster, hill, grassTuft } from './village_shapes.js';
import { trough, crate, sack, washLine } from './village_props.js';
import { barrel } from './dest_props_vale.js';
import { brickHouse, beanWigwam, gardenShed, coalBay, ashHeap, weighPlate, hayBale, KC } from './dest_props_works.js';
import { oak, oakTrunk } from './dest_props_wood.js';
import { TC, townHouse, HS, HOUSE, marketStall, stallWreck, marketHall, MH, hallPiers, townHall, TH, bandstand, BS, gasLamp, pillarBox, parkBench, townBoard, gasholder, GH, church, CHU, headstone, stack, penRail, bedPlants, coalHeap } from './dest_props_town.js';

export const MT = { sq: [-1900, -1500, 1900, 1200], hall: [0, 300], heart: [0, -820], band: [1250, 650], pump: [-1250, 650], townHall: [0, 2080], gardens: [0, 3350], plaza: [0, 4750], church: [-3700, 2450], vicarage: [-3700, 3750], gas: [4000, -4650], retort: [2150, -4350], cattle: [3750, -800] };
const MAIN = [[0, -5900], [0, -1500]], MILL = [[-5500, -3600], [5500, -3600]];
const SIDE_W = [[-1500, 1200], [-1500, 3000], [-900, 3800], [0, 4250]], SIDE_E = SIDE_W.map(([x, y]) => [-x, y]);
const CHURCH_LANE = [[-1700, 1290], [-2700, 1380], [-3400, 1750], [-3600, 1990]];
const CHURCH_ST = [[-3800, -3300], [-3800, 1000], [-3500, 1640]], MARKET_LANE = [[3750, -3300], [3750, -2450]];
const deg = (r) => (r * 180) / Math.PI;

export function buildTown(M, O) {
  const { hx, hy } = O;
  const K = destKit(M, 37, O, { exactNav: true }), { S, body, round, trunk, lit, patch, path, rnd, rr, lineDist } = K;
  const pick = (L) => L[Math.floor(rnd() * L.length)];
  const SOL = (x, y, w, d, h, yaw = 0, nav = true) => body(x, y, w, d, h, yaw, 0, nav);
  const offs = (x, y, yaw, lx, ly) => { const c = Math.cos((yaw * Math.PI) / 180), s = Math.sin((yaw * Math.PI) / 180); return [x + lx * c - ly * s, y + lx * s + ly * c]; };
  const RUST = { r: 1, g: 0.82, b: 0.3 }, RUST_GLOW = 0xffd24e, LAMP = { r: 1, g: 0.84, b: 0.55 };

  // ---- the ground: grass gone thin behind the houses, trodden earth by the back doors; the streets in setts, the
  // square in great flags, every road a little over the one before it where they meet
  K.Box(V(0, 0, -60), V(hx * 2 + 24000, hy * 2 + 24000, 120), 0x66763e, true, false);
  for (let i = 0; i < 26; i++) { const x = rr(-hx + 300, hx - 300), y = rr(-hy + 300, hy - 300); patch(x, y, rr(500, 1000), pick([0x6a7842, 0x60703c, 0x707c48, 0x5c6a3a])); }
  const [sx0, sy0, sx1, sy1] = MT.sq, sqZ = 3.2;
  const ROADS = [[MAIN, 700], [MILL, 600], [[[0, sy0], [0, sy1]], sx1 - sx0], [SIDE_W, 560], [SIDE_E, 560], [[[0, 4250], [0, 5250]], 1800], [[[0, 5250], [0, 5900]], 600], [CHURCH_LANE, 420], [CHURCH_ST, 500], [MARKET_LANE, 500], [[[3750, -2450], [3750, 850]], 1900]];
  K.settRoad(MAIN, 700, 2.6, { skip: (x, y) => Math.abs(y - MILL[0][1]) < 320 });
  K.settRoad(MILL, 600, 2.9, { skip: (x, y) => Math.abs(x) < 370 || (y > MILL[0][1] && (Math.abs(x - CHURCH_ST[0][0]) < 270 || Math.abs(x - MARKET_LANE[0][0]) < 270)) });
  K.settRoad([[0, sy0], [0, sy1]], sx1 - sx0, sqZ, { sl: 64, sw: 90, cols: [0xa09a8c, 0x948e80, 0xaaa496, 0x8c8678], grit: 0x5a5650 });
  K.settRoad(SIDE_W, 560, 3.5, { skip: (x, y) => x < -1600 && y < 1540 }); K.settRoad(SIDE_E, 560, 3.5);
  K.settRoad([[0, 4250], [0, 5250]], 1800, 3.8, { sl: 64, sw: 90, cols: [0xa09a8c, 0x948e80, 0xaaa496, 0x8c8678], grit: 0x5a5650 }); K.settRoad([[0, 5250], [0, 5900]], 600, 4.1);
  K.settRoad(CHURCH_LANE, 420, 4.4, { cols: [0x8a8478, 0x7e786e, 0x948e82], skip: (x, y) => x < -3300 && y < 1900 && x > -3900 });
  K.settRoad(CHURCH_ST, 500, 4.1, { skip: (x, y) => y > 1250 }); K.settRoad(MARKET_LANE, 500, 4.1);
  K.settRoad([[3750, -2450], [3750, 850]], 1900, 4.4, { cols: [0x8a8478, 0x7e786e, 0x948e82, 0x847c70], skip: (x, y) => y < -2300 && Math.abs(x - 3750) < 270 });
  const onRoad = (x, y, m = 0) => ROADS.some(([pts, w]) => lineDist(x, y, pts) < w / 2 + m);

  // ---- the terraces: houses and shops shoulder to shoulder along the streets, fronts to the street, an alley through
  // every few for the back gardens. Every one whole and solid, walls and roof and chimney.
  const houses = []; let seedN = 3;
  const house = (cx, cy, yaw, w, d, storeys, seed, front, ends = 0) => {
    S(townHouse(w, d, storeys, seed, front, ends), cx, cy, 0, yaw);
    const { eave, gable, ridge } = HS(storeys, w, d, seed), hd = d / 2, hw = w / 2, ov = HOUSE.ov, p = HOUSE.pitch, at = (lx, ly) => offs(cx, cy, yaw, lx, ly);
    body(cx, cy, d + 12, w, eave, yaw);
    if (gable) for (const sy of [-1, 1]) { const L = Math.hypot(hw, ridge - eave), a = deg(Math.atan2(ridge - eave, hw)) * (sy > 0 ? -1 : 1), [mx, my] = at(0, (sy * hw) / 2); M.SolidRot(V(mx, my, (eave + ridge) / 2 - 12), V(L, d + 40, 24), R(-a, yaw + 90, 0)); }
    else for (const sx of [-1, 1]) { const z0 = eave - ov * p, L = Math.hypot(hd + ov, ridge - z0), a = deg(Math.atan2(ridge - z0, hd + ov)) * (sx > 0 ? -1 : 1), [mx, my] = at((sx * (hd + ov)) / 2, 0); M.SolidRot(V(mx, my, (z0 + ridge) / 2 - 12), V(L, w, 24), R(-a, yaw, 0)); }
    { const [chx, chy] = gable ? at(-hd + 70, 0) : at(0, (seed % 2 ? 1 : -1) * (hw - 46)); body(chx, chy, gable ? 72 : 60, gable ? 60 : 76, ridge + 150 - eave, yaw, eave, false); }
    houses.push({ x: cx, y: cy, yaw, w, d });
  };
  // a row of them with their fronts along the line a -> b, facing its left as you go from a to b
  const terrace = (a, b, opts = {}) => {
    const [x0, y0] = a, [x1, y1] = b, L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy, ny = ux, yaw = deg(Math.atan2(ny, nx)), d = 640;
    const plan = []; let s = 0, run = 0;
    while (s < L - 400) {
      if (opts.alley && run >= opts.alley && L - s > 1300) { if (plan.length) plan[plan.length - 1].end |= 2; s += 380; run = 0; continue; }
      const w = pick([440, 520, 520, 600]); if (s + w > L + 1) break;
      plan.push({ s, w, end: run === 0 ? 1 : 0 }); s += w; run++;
    }
    if (plan.length) plan[plan.length - 1].end |= 2;
    plan.forEach(({ s, w, end }, k) => { const seed = (seedN += 7), storeys = opts.tall ? pick([2, 3, 3]) : pick([2, 2, 3]), front = opts.shops ? (k % 4 === 3 ? 0 : 1) : k % 5 === 2 ? 1 : 0;
      house(x0 + ux * (s + w / 2) - nx * (d / 2), y0 + uy * (s + w / 2) - ny * (d / 2), yaw, w, d, storeys, seed, front, end); });
  };
  terrace([-370, -2300], [-370, -3200], { shops: true }); terrace([370, -3200], [370, -2300], { shops: true });
  terrace([-370, -4000], [-370, -5000], { alley: 1 }); terrace([370, -5000], [370, -4000], { alley: 1 });
  terrace([-4700, -3920], [-1250, -3920], { alley: 3 });
  terrace([-1250, -3280], [-3530, -3280], { alley: 3 }); terrace([-4070, -3280], [-4700, -3280], {}); terrace([4700, -3280], [4020, -3280], {}); terrace([3480, -3280], [1250, -3280], { alley: 3 });
  terrace([-4070, 1000], [-4070, -2350], { alley: 2 }); terrace([-3530, -2350], [-3530, 1000], { alley: 2 });
  terrace([sx0 - 20, sy1 - 240], [sx0 - 20, sy0 + 60], { shops: true, tall: true, alley: 3 }); terrace([sx1 + 20, sy0 + 60], [sx1 + 20, sy1 - 240], { shops: true, tall: true, alley: 3 });
  terrace([sx0 + 20, sy0 - 20], [-380, sy0 - 20], { shops: true }); terrace([380, sy0 - 20], [sx1 - 20, sy0 - 20], { shops: true });
  terrace([-1800, 2900], [-1800, 1700], {}); terrace([1800, 1700], [1800, 2900], {});
  terrace([-920, 5200], [-920, 4300], { shops: true }); terrace([920, 4300], [920, 5200], { shops: true });

  // ---- the market square: the hall on its piers, sacks of the corn market by them
  { const [x, y] = MT.hall; S(marketHall(), x, y, sqZ - 2, 0); for (const [px, py] of hallPiers()) SOL(x + px, y + py, 84, 84, MH.z0);
    body(x, y, MH.d + 80, MH.w + 80, MH.ridge + 300 - MH.z0, 0, MH.z0 - 2, false);
    for (const [dx, dy] of [[-200, -120], [-160, -60], [-205, -10], [200, 380], [160, 440]]) { S(sack(26, 0xc8b48a), x + dx, y + dy, sqZ - 4, rr(0, 360)); round(x + dx, y + dy, 26, 50); } }
  // the stalls in two rows either side of the aisle up from Main Street, their goods out; the two by the growth knocked over
  const STALLS = [];
  for (const [y, yaw] of [[-1180, 90], [-460, -90]]) for (const x of [-1500, -1200, -900, 900, 1200, 1500]) { const g = (STALLS.length * 3) % 5; S(marketStall(300, STALLS.length + 1, g), x, y, sqZ - 2, yaw); SOL(x, y, 130, 310, 230, yaw); STALLS.push([x, y]); }
  for (const [x, y, yaw, sd] of [[-500, -1180, 90, 2], [480, -460, -90, 3]]) { S(stallWreck(300, sd), x, y, sqZ - 1, yaw); const [bx, by] = offs(x, y, yaw, 50, 0); body(bx, by, 80, 300, 40, yaw, 0, false); }   // the fallen top: a step up, not a wall
  // the pump and its trough, the bandstand (open to the hall), benches, the pillar box
  { const [x, y] = MT.pump; S(handPump(), x, y, sqZ - 2, 0); round(x, y, 34, 190); S(trough(220), x + 160, y, sqZ - 2, 90); SOL(x + 160, y, 230, 60, 62, 90); }
  { const [x, y] = MT.band, yw = 157.5; S(bandstand(), x, y, sqZ, yw); round(x, y, BS.r + 26, BS.deck + 4, sqZ - 4, false);
    for (let i = 0; i < 8; i++) { const a = ((i * 45 + yw) * Math.PI) / 180; round(x + Math.cos(a) * BS.r, y + Math.sin(a) * BS.r, 9, BS.top, sqZ); }
    round(x, y, BS.r + 44, 150, sqZ + BS.top, false); }
  for (const [x, y, yaw] of [[-1700, -800, 0], [1700, -800, 180], [-1700, 100, 0], [1700, 100, 180], [-600, 1050, -90], [600, 1050, -90]]) { S(parkBench(200), x, y, sqZ - 1, yaw); SOL(x, y, 70, 210, 100, yaw); }
  { S(pillarBox(), 460, sy0 + 80, sqZ - 1, -90); round(460, sy0 + 80, 26, 150); S(pillarBox(), -2400, -3360, 2.9, -90); round(-2400, -3360, 26, 150); }

  // ---- the Blight: up through the flags in the middle of the market, the stalls round it burst; its threads run out
  // across the square and up the street, its caps along them
  const blightAt = [];
  { const [x, y] = MT.heart; S(blightMass(420, 2, 'rust'), x, y, sqZ - 1, 15); round(x, y, 420 * 0.62, 420 * 0.55); blightAt.push([x, y, 420]); lit(x + 40, y - 30, 120, RUST, 1000, RUST_GLOW); }
  const veins = [];
  { const [hx0, hy0] = MT.heart; for (const [ex, ey] of [[-1750, -1350], [1700, -1300], [-1600, 250], [1650, 120], [-120, -2700], [520, 1150], [-700, 1100]]) { const pts = []; for (let i = 0; i <= 7; i++) { const t = i / 7; pts.push([hx0 + (ex - hx0) * t + Math.sin(t * 7 + ex) * 120 * t, hy0 + (ey - hy0) * t + Math.cos(t * 5 + ey) * 120 * t]); } veins.push(pts); } }

  // ---- the town hall on the square's north side, its portico to the square, the clock over all; lawns either side
  { const [x, y] = MT.townHall, yaw = -90, hd = TH.d / 2, at = (lx, ly) => offs(x, y, yaw, lx, ly); S(townHall(), x, y, 0, yaw);
    SOL(x, y, TH.w + 32, TH.d + 32, TH.eave + 24); body(x, y, TH.w + 20, TH.d + 20, 100, 0, TH.eave + 24, false); body(x, y, TH.w - 500, TH.d - 400, TH.ridge - TH.eave - 100, 0, TH.eave + 124, false); body(x, y, TH.tw, TH.tw, TH.ttop - TH.eave - 40, 0, TH.eave, false);
    { const [px, py] = at(hd + 130, 0); body(px, py, 680, 260, TH.pod, 0, 0, false); }
    { const [px, py] = at(hd + 275, 0); body(px, py, 680, 30, 30, 0, 0, false); } { const [px, py] = at(hd + 305, 0); body(px, py, 680, 30, 15, 0, 0, false); }
    for (const cy of TH.col) { const [cx, cyy] = at(hd + TH.colX, cy); round(cx, cyy, TH.colR, 432, TH.pod); }
    { const [px, py] = at(hd + (TH.port + 82) / 2, 0); body(px, py, 680, TH.port + 82, 230, 0, TH.pod + 430, false); }
    { const [px, py] = at(hd + TH.port + 84, 0); M.Sign(V(px, py, TH.pod + 470), yaw, 'TOWN HALL', { r: 0.95, g: 0.92, b: 0.82 }, 30); }
    for (const s of [-1, 1]) { patch(x + s * 990, y - 200, 700, 0x5e7a3c); S(raisedBed(380, 130), x + s * 990, y - 420, 0, 90); SOL(x + s * 990, y - 420, 380, 130, 104, 90); S(bedPlants(340, 110, 0xe86a8a, 0xf2d04a, s + 2), x + s * 990, y - 420, 36, 90); } }

  // ---- the church in its yard, north-west of the square: headstones in rows, two yews
  { const [x, y] = MT.church, [pxc, pyc, phx, phy] = CHU.porch, tx = x - CHU.L / 2 - CHU.tw / 2 + 10; S(church(), x, y, 0, 0);
    SOL(x, y, CHU.L + 8, CHU.W + 8, CHU.eave + 10); body(x, y, CHU.L, CHU.W * 0.6, CHU.ridge - CHU.eave, 0, CHU.eave + 10, false);
    SOL(tx, y, CHU.tw + 24, CHU.tw + 24, CHU.tz + 20); round(tx, y, 70, CHU.spire - CHU.tz - 100, CHU.tz + 20, false); SOL(x + pxc, y + pyc, phx * 2 + 40, phy * 2 + 6, 300);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++) { const gx = x - 1050 + i * 180 + rr(-20, 20), gy = y - 520 - r * 230 + rr(-20, 20); S(headstone(r * 5 + i + 1), gx, gy, 0, rr(-6, 6)); SOL(gx, gy, 30, 76, 104); }
    for (let i = 0; i < 4; i++) { const gx = x + 700 + (i % 2) * 200, gy = y - 100 + Math.floor(i / 2) * 260; S(headstone(i + 17), gx, gy, 0, rr(-6, 6)); SOL(gx, gy, 30, 76, 104); }
    for (const [dx, dy] of [[-800, 520], [850, 500]]) { S(hedgeLump(260, 0x2e4a2c, 0, 2), x + dx, y + dy, 0, rr(0, 360)); trunk(x + dx, y + dy, 260 * 1.08, 260 * 1.25); }
    patch(x - 100, y - 300, 2500, 0x5a7442); }

  // ---- the gasworks, south-east: the holder in its ring of columns, the retort house and its stack, coal in bays
  { const [x, y] = MT.gas; S(gasholder(), x, y, 0, 0); round(x, y, GH.bell + 40, GH.bellH + 50); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; round(x + Math.cos(a) * GH.r, y + Math.sin(a) * GH.r, 28, GH.h + 14); }
    K.blot(x - 1350, y - 80, 3700, 1300, 0x4e4c46); K.blot(x - 700, y + 150, 2400, 900, 0x56544c); K.blot(x - 2300, y + 250, 1300, 700, 0x5a5850); }
  { const [x, y] = MT.retort, yaw = 90, W = 560, D = 1300, H = 460, opts = { doors: [{ y: 0, w: 240, h: 320, side: 1, color: 0x5a3e2e, arch: true }, { y: -480, w: 110, h: 230, side: 1 }], windows: { front: [-300, 300, 520], back: [-450, -150, 150, 450] }, chimneys: [], wz: 240, wh: 160, ww: 90 };
    S(brickHouse(W, D, H, opts, 5), x, y, 0, yaw); SOL(x, y, D + 30, W + 30, H + 4);
    const pitch = 0.62, ridge = H + (W / 2) * pitch; for (const sx of [-1, 1]) { const x0 = sx * (W / 2 + 30), z0 = H - 30 * pitch, L = Math.hypot(x0, ridge - z0), a = deg(Math.atan2(ridge - z0, Math.abs(x0))) * (sx > 0 ? -1 : 1), [mx, my] = offs(x, y, yaw, x0 / 2, 0); M.SolidRot(V(mx, my, (z0 + ridge) / 2 - 12), V(L, D + 60, 24), R(-a, yaw, 0)); }
    S(stack(1700, 90), x - D / 2 - 140, y, 0, 0); SOL(x - D / 2 - 140, y, 216, 216, 1740);
    S(coalHeap(260, 130, 2), 2350, -4980, 0, 30); round(2350, -4980, 240, 120);
    [[3100, -5000, 0]].forEach(([cx, cy, k]) => { S(coalBay(520, 420, 190, k + 1), cx, cy, 0, 0); const rb = (lx, ly, w, d, h) => { const [bx, by] = offs(cx, cy, 0, lx, ly); SOL(bx, by, w, d, h, 0); }; rb(-210, 0, 34, 554, 200); for (const e of [-1, 1]) { rb(-96, e * 260, 194, 34, 200); rb(105, e * 260, 210, 34, 128); } rb(-40, 0, 330, 440, 120); });
    S(ashHeap(160, 1), 1620, -5000, 0, 20); round(1620, -5000, 140, 60); for (const [bx, by] of [[2950, -4150], [3040, -4120], [2990, -4220]]) { if (!K.clear(bx, by, 45)) continue; S(barrel(Math.round(bx)), bx, by, 0, rr(0, 360)); round(bx, by, 38, 96); } }

  // ---- the town gardens north of the hall: a lawn, oaks, a path round, beds, benches
  { const [x, y] = MT.gardens; patch(x, y, 2300, 0x5e7e3a); patch(x, y + 100, 1500, 0x62823e);
    const ring = []; for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2; ring.push([x + Math.cos(a) * 520, y + Math.sin(a) * 640]); } path(ring, 170, 0x9a8a6a, 0x8a8478);
    for (const [dx, dy, h, sd] of [[-760, -420, 1000, 1], [740, -380, 900, 2]]) { S(oak(h, sd), x + dx, y + dy, 0, rr(0, 360)); trunk(x + dx, y + dy, oakTrunk(h), h * 0.4); body(x + dx, y + dy, h * 0.9, h * 0.9, h * 0.45, 0, h * 0.55, false); }
    for (const [dx, dy, yaw] of [[-700, 0, 0], [700, 0, 180], [0, -760, 90]]) { S(parkBench(200), x + dx, y + dy, 0, yaw); SOL(x + dx, y + dy, 70, 210, 100, yaw); }
    for (const s of [-1, 1]) { S(raisedBed(360, 130), x + s * 240, y, 0, 90); SOL(x + s * 240, y, 360, 130, 104, 90); S(bedPlants(320, 110, s > 0 ? 0x9a7ae8 : 0xe86a8a, 0xf2d04a, s + 4), x + s * 240, y, 36, 90); }
    const mx = x + 30, my = y + 160; S(blightMass(260, 3, 'rust'), mx, my, 0, 40); round(mx, my, 260 * 0.62, 260 * 0.55); blightAt.push([mx, my, 260]); lit(mx, my, 90, RUST, 700, RUST_GLOW); }

  // ---- the way on: the little square at the top of the town, crates and sacks by the shops, the road out north
  { for (const [x, y, n] of [[-700, 4400, 2], [-700, 4500, 1], [700, 4450, 2]]) { for (let k = 0; k < n; k++) S(crate(66, Math.abs(x + y) + k), x, y, 3.8 + k * 56, rr(-8, 8)); SOL(x, y, 80, 80, n * 56); }
    for (const [x, y] of [[700, 4620], [760, 4680]]) S(sack(26, 0xc8b48a), x, y, 3, rr(0, 360)); SOL(730, 4650, 140, 140, 52); }
  // the town's name where Main Street comes in
  { S(townBoard(300), 560, -5150, 0, -90); for (const s of [-1, 1]) round(560 + s * 156, -5150, 8, 262); body(560, -5150, 320, 10, 90, 0, 150, false); M.Sign(V(560, -5155, 196), -90, 'MARKET TOWN', { r: 0.16, g: 0.16, b: 0.18 }, 28); }

  // ---- gas lamps: round the square, along the streets, in the little square
  const lamps = [];
  for (let i = 0; i < 6; i++) { const t = (i + 0.5) / 6; lamps.push([sx0 + 80 + t * (sx1 - sx0 - 160), sy0 + 70], [sx0 + 80 + t * (sx1 - sx0 - 160), sy1 - 70]); }
  for (const t of [0.25, 0.75]) lamps.push([sx0 + 70, sy0 + t * (sy1 - sy0)], [sx1 - 70, sy0 + t * (sy1 - sy0)]);
  for (let y = -5000; y < -1800; y += 760) if (Math.abs(y + 3600) > 500) lamps.push([-310, y], [310, y + 380]);
  for (let x = -4600; x <= 4600; x += 920) if (Math.abs(x) > 500) lamps.push([x, -3600 + (Math.round(x / 920) % 2 ? 260 : -260)]);
  for (const s of [-1, 1]) lamps.push([s * 1250, 2000], [s * 1250, 2700], [s * 790, 4400], [s * 790, 5100]);
  for (const [x, y] of lamps) { if (!K.clear(x, y, 30)) continue; S(gasLamp(), x, y, 3, 0); round(x, y, 17, 262, 0, false); lit(x, y, 292, LAMP, 360, 0xffd88a); }

  // ---- the town's edge: a hedge all round (open where the roads come in and go out, a gate across each end of Mill
  // Lane), every lump of it solid; the strips behind it shut on the walking grid so none is a pocket
  { const step = 330; for (const sd of [-1, 1]) { for (let x = -hx + 160; x <= hx - 160; x += step) { if (Math.abs(x) < 430) continue; const y = sd * (hy - 150), r = pick([180, 200, 220]); S(hedgeLump(r, pick([0x4e7a30, 0x46722c, 0x527e34]), 0, Math.round(x) % 3 + 1), x, y, 0, rr(0, 360)); trunk(x, y, r * 1.08, r * 1.25); }
      for (let y = -hy + 480; y <= hy - 480; y += step) { if (Math.abs(y - MILL[0][1]) < 600) continue; const x = sd * (hx - 150), r = pick([180, 200, 220]); S(hedgeLump(r, pick([0x4e7a30, 0x46722c, 0x527e34]), 0, Math.round(y) % 3 + 1), x, y, 0, rr(0, 360)); trunk(x, y, r * 1.08, r * 1.25); } }
    for (const sd of [-1, 1]) { O.GM.NavBlockBox({ min: V(-hx, sd < 0 ? -hy : hy - 160, 0), max: V(hx, sd < 0 ? -hy + 160 : hy, 100) }, 1); O.GM.NavBlockBox({ min: V(sd < 0 ? -hx : hx - 160, -hy, 0), max: V(sd < 0 ? -hx + 160 : hx, hy, 100) }, 1); }
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) O.GM.NavBlockBox({ min: V(sx < 0 ? -hx : hx - 460, sy < 0 ? -hy : hy - 460, 0), max: V(sx < 0 ? -hx + 460 : hx, sy < 0 ? -hy + 460 : hy, 100) }, 1);
    for (const sd of [-1, 1]) { const gx = sd * (hx - 150), gy = MILL[0][1]; for (const s of [-1, 1]) { S(gatePost(170), gx, gy + s * 330, 0, 0); body(gx, gy + s * 330, 30, 30, 176); }
      for (const s of [-1, 1]) { S(gateLeaf(300, 130), gx, gy + s * 316, -3, s > 0 ? 180 : 0); body(gx, gy + s * 166, 14, 300, 140); }
      for (const s of [-1, 1]) { const y = gy + s * 530; S(hedgeLump(180, 0x4e7a30, 0, 2), gx, y, 0, rr(0, 360)); trunk(gx, y, 180 * 1.08, 180 * 1.25); } } }

  // ---- the cattle market, east of the square: two blocks of pens either side of the sale aisle, each pen open to its
  // own side; the auctioneer's office, troughs, hay; the weighbridge where the lane comes in from Mill Lane
  { const [mx, my] = MT.cattle, cz = 4.4;
    for (const by of [my - 840, my + 560]) { const x0 = mx - 770, n = 3, pw = 320, y0 = by - 320, y1 = by + 320;
      const railNav = (xa, ya, xb, yb) => O.GM.NavBlockBox({ min: V(Math.min(xa, xb) - 12, Math.min(ya, yb) - 12, 0), max: V(Math.max(xa, xb) + 12, Math.max(ya, yb) + 12, 100) }, 1);   // a rail is thinner than a cell: shut the cells either side of it
      S(penRail(n * pw, 100), x0 + (n * pw) / 2, by, cz, 0); body(x0 + (n * pw) / 2, by, n * pw + 12, 12, 112, 0, cz, false); railNav(x0, by, x0 + n * pw, by);
      for (let i = 0; i <= n; i++) { const x = x0 + i * pw; for (const [ya, yb, sk] of [[y0, by, 2], [by, y1, 1]]) { S(penRail(yb - ya, 100, sk), x, (ya + yb) / 2, cz, 90); body(x, (ya + yb) / 2, 12, yb - ya + 12, 112, 0, cz, false); railNav(x, ya, x, yb); } }
      for (let i = 0; i < n; i++) if ((i + Math.round(by)) % 2) { const hx0 = x0 + i * pw + pw / 2 + rr(-40, 40), hy0 = by + (i % 2 ? 160 : -160); const hyaw = rr(0, 180); S(hayBale(i), hx0, hy0, cz, hyaw); S(hayBale(i + 1), hx0, hy0, cz + 42, hyaw + 90); SOL(hx0, hy0, 96, 96, 88); } }
    { const ox = mx + 720, oy = my - 140; S(brickHouse(420, 640, 340, { doors: [{ y: 120, w: 110, h: 230, side: 1, color: KC.green }], windows: { front: [-160], ends: [0] }, chimneys: [-200], wz: 170 }, 9), ox, oy, cz, 180);
      SOL(ox, oy, 450, 670, 344); const ridge = 340 + 210 * 0.62; for (const sx of [-1, 1]) { const x0 = sx * 240, z0 = 340 - 30 * 0.62, L = Math.hypot(x0, ridge - z0), a = deg(Math.atan2(ridge - z0, Math.abs(x0))) * (sx > 0 ? -1 : 1), [qx, qy] = offs(ox, oy, 180, x0 / 2, 0); M.SolidRot(V(qx, qy, (z0 + ridge) / 2 - 12), V(L, 700, 24), R(-a, 180, 0)); }
      { const [qx, qy] = offs(ox, oy, 180, 0.35 * 210, -200); body(qx, qy, 80, 100, ridge + 140, 0, 0, false); } }
    for (const [tx, ty] of [[mx + 150, my - 820 + 500], [mx - 640, my - 1580]]) { S(trough(220), tx, ty, cz, 0); SOL(tx, ty, 230, 60, 70); }
    S(weighPlate(440, 240), mx, my - 1650, cz, 90); }

  // ---- the vicarage north of the church: a tall house standing on its own in its garden, its front to the church
  { const [x, y] = MT.vicarage; house(x, y, -90, 600, 640, 3, 41, 0, 3);
    patch(x, y - 200, 1900, 0x5e7e3a); const [ox, oy] = [x - 700, y + 500]; S(oak(1200, 7), ox, oy, 0, rr(0, 360)); trunk(ox, oy, oakTrunk(1200), 480); body(ox, oy, 1080, 1080, 540, 0, 660, false);
    for (const [dx, c] of [[-260, 0xe86a8a], [260, 0x9a7ae8]]) { S(raisedBed(360, 130), x + dx, y - 560, 0, 0); SOL(x + dx, y - 560, 360, 130, 104); S(bedPlants(320, 110, c, 0xffffff, dx > 0 ? 7 : 8), x + dx, y - 560, 36, 0); }
    S(parkBench(200), x + 560, y - 500, 0, 180); SOL(x + 560, y - 500, 70, 210, 100, 180); }

  // ---- behind the terraces: the back gardens (open to walk, an alley through every few houses): washing out, sheds,
  // water butts, beds of greens, a barrow; the allotments north-east, rows of plots with their beans and sheds
  const clearOf = (x, y, m) => !onRoad(x, y, m) && K.clear(x, y, m) && !blightAt.some(([bx, by, br]) => Math.hypot(x - bx, y - by) < br * 0.7 + m);
  const inside = (x, y, m) => Math.abs(x) < hx - 420 - m && Math.abs(y) < hy - 420 - m;
  houses.forEach((h, i) => { if (i % 3 === 2) return; const kind = (i * 7 + 3) % 6, back = -(h.d / 2 + 170 + (i % 3) * 90), side = ((i % 4) - 1.5) * h.w * 0.22, [x, y] = offs(h.x, h.y, h.yaw, back, side);
    if (!inside(x, y, 0)) return;
    if (kind === 0 || kind === 3) { const [ax, ay] = offs(h.x, h.y, h.yaw, back, side - 200), [bx, by] = offs(h.x, h.y, h.yaw, back, side + 200); if (!clearOf(ax, ay, 40) || !clearOf(bx, by, 40) || !clearOf(x, y, 40)) return; S(washLine(400, i), x, y, 0, h.yaw + 90); round(ax, ay, 10, 200, 0, false); round(bx, by, 10, 200, 0, false); }
    else if (kind === 1) { if (!clearOf(x, y, 190)) return; S(gardenShed(220, 300), x, y, 0, h.yaw); SOL(x, y, 250, 320, 240, h.yaw); }
    else if (kind === 2) { if (!clearOf(x, y, 50)) return; S(barrel(i), x, y, 0, rr(0, 360)); round(x, y, 38, 96); }
    else if (kind === 4) { if (!clearOf(x, y, 200)) return; S(raisedBed(360, 130), x, y, 0, h.yaw + 90); SOL(x, y, 360, 130, 44, h.yaw + 90); }
    else { if (!clearOf(x, y, 110)) return; S(wheelbarrow(i % 2), x, y, 0, rr(0, 360)); SOL(x, y, 170, 170, 70, 0, false); } });
  { const ax0 = 2900, ay0 = 1500; for (let c = 0; c < 3; c++) for (let r = 0; r < 5; r++) { const x = ax0 + c * 760, y = ay0 + r * 680; if (!inside(x, y, 300) || !clearOf(x, y, 260)) continue;
      patch(x, y, 560, 0x6a5a40); if ((c + r) % 3 === 0) { for (let k = 0; k < 2; k++) S(beanWigwam(k + c), x - 100 + k * 200, y, 0, rr(0, 360)); SOL(x, y, 320, 110, 200, 0, false); }
      else if ((c + r) % 3 === 1) { S(raisedBed(380, 130), x, y - 100, 0, 0); SOL(x, y - 100, 380, 130, 44); S(raisedBed(380, 130), x, y + 100, 0, 0); SOL(x, y + 100, 380, 130, 44); }
      else { S(gardenShed(220, 300), x, y, 0, 90 * ((c + r) % 4)); SOL(x, y, 250, 320, 240, 90 * ((c + r) % 4)); } } }
  // the gardens' trees and bushes
  for (let i = 0, n = 0; i < 300 && n < 34; i++) { const x = rr(-hx + 500, hx - 500), y = rr(-hy + 500, hy - 500); if (!clearOf(x, y, 300)) continue; const r = pick([160, 200, 220]); S(hedgeLump(r, pick([0x4e7a30, 0x46722c, 0x5a7e34]), i % 4 ? 0 : 0xe8e0d0, i % 3 + 1), x, y, 0, rr(0, 360)); trunk(x, y, r * 1.08, r * 1.25); n++; }
  for (let i = 0, n = 0; i < 200 && n < 6; i++) { const x = rr(-hx + 800, hx - 800), y = rr(-hy + 800, hy - 800), h = pick([1100, 1300]); if (!clearOf(x, y, 600) || Math.hypot(x - MT.gardens[0], y - MT.gardens[1]) < 1700) continue; S(oak(h, i), x, y, 0, rr(0, 360)); trunk(x, y, oakTrunk(h), h * 0.4); body(x, y, h * 0.9, h * 0.9, h * 0.45, 0, h * 0.55, false); n++; }
  // the Rustcap in the gardens and yards: two more masses, caps along the threads from the heart
  for (const [x0, y0, r, sd] of [[-4400, -4300, 240, 4], [3420, -940, 260, 1], [-2900, 1500, 220, 2]]) { let x = x0, y = y0; const fits = (x, y) => clearOf(x, y, r * 0.7) && inside(x, y, r + 300); for (let k = 0; k < 40 && !fits(x, y); k++) { x = x0 + rr(-600, 600); y = y0 + rr(-600, 600); } if (!fits(x, y)) continue;
    S(blightMass(r, sd, 'rust'), x, y, 0, rr(0, 360)); round(x, y, r * 0.62, r * 0.55); blightAt.push([x, y, r]); lit(x, y, 90, RUST, 650, RUST_GLOW); }
  M.Shape('tcveins', () => { const pos = [], col = [], idx = []; for (const pts of veins) { const n = pts.length; for (let j = 0; j < n - 1; j++) { const [x0, y0] = pts[j], [x1, y1] = pts[j + 1], L = Math.hypot(x1 - x0, y1 - y0), m = Math.max(2, Math.round(L / 40)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
    for (let i = 0; i <= m; i++) { const t = i / m, wv = Math.sin((x0 + i * 40) * 0.011 + j) * 34 + Math.sin((y0 + i * 40) * 0.023) * 14, px = x0 + (x1 - x0) * t + nx * wv, py = y0 + (y1 - y0) * t + ny * wv, w = 9 * (1 - ((j + t) / n) * 0.7); for (const e of [-1, 1]) { pos.push(px + nx * w * e, py + ny * w * e, sqZ + 1.6); col.push(0.86, 0.58, 0.24); } }
    const b = pos.length / 3 - (m + 1) * 2; for (let i = 0; i < m; i++) { const a = b + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } } } return { pos, col, idx }; }, V(0, 0, 0), R(0, 0, 0));
  for (const pts of veins) for (let j = 2; j < pts.length; j += 2) { const [vx, vy] = pts[j]; const ts = pick([0.8, 1]), tx = vx + rr(-40, 40), ty = vy + rr(-40, 40); if (blightAt.some(([bx, by, br]) => Math.hypot(tx - bx, ty - by) < br + 80) || !K.clear(tx, ty, 50)) continue; S(toadstoolCluster(ts, 0xc4782c, pick([1, 2, 3])), tx, ty, sqZ - 1, rr(0, 360)); round(tx, ty, 22 * ts, 40 * ts, 0, false); }

  // ---- tufts of grass in the gardens, never on a road
  { const nav = O.GM, ok = (x, y) => { const [ix, iy] = nav.cellOf(O.cx + x, O.cy + y); return nav.navFree(ix, iy) && K.clear(x, y, 40) && !onRoad(x, y, 60); };
    let n = 0; for (let k = 0; k < 2000 && n < 260; k++) { const x = rr(-hx + 200, hx - 200), y = rr(-hy + 200, hy - 200); if (!ok(x, y)) continue; S(grassTuft(pick([30, 38, 46]), pick([1, 2, 3])), x, y, 0, rr(0, 360)); n++; } }

  // ---- beyond the hedge (out of reach): fields and hedgerows, a farm or two, the hills; the roads in and out
  for (let i = 0; i < 110; i++) { const side = i % 4, u = rr(-1, 1), d = rr(400, 3600), x = side < 2 ? (side ? 1 : -1) * (hx + d) : u * (hx + 3000), y = side < 2 ? u * (hy + 3000) : (side === 2 ? 1 : -1) * (hy + d); if (Math.abs(x) < 500 && Math.abs(y) > hy) continue; if (Math.abs(y - MILL[0][1]) < 400 && Math.abs(x) > hx) continue;
    S(farTree(pick([900, 1200, 1500]), 0, pick([0x4e7e32, 0x46722e]), pick([1, 2])), x, y, 0, rr(0, 360)); }
  for (const [x, y, rx, ry, h] of [[-13000, 0, 5000, 9000, 2000], [13500, 1500, 5500, 9000, 2200], [0, 14500, 9000, 4000, 2400], [-9000, -14000, 6000, 4000, 1800], [9000, -13500, 6000, 4000, 2000]]) S(hill(rx, ry, h), x, y, -40, 0);
  path([[0, -5900], [0, -9000], [-300, -12000]], 600, 0x7a7466); path([[0, 5900], [100, 8600], [-200, 11000]], 600, 0x7a7466); for (const s of [-1, 1]) path([[s * 5500, -3600], [s * 8000, -3700], [s * 11000, -3400]], 420, 0x7a7466);

  // where the Rustcap's pools come up: in the square, the streets, the gardens
  const settle = ([x, y]) => { for (let r = 0; r <= 1600; r += 100) { const n = Math.max(1, Math.round(r / 50)); for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (Math.abs(px) < hx - 500 && Math.abs(py) < hy - 500 && K.clear(px, py, 430) && Math.hypot(px - MT.plaza[0], py - MT.plaza[1]) > 1300) return [Math.round(px), Math.round(py)]; } } return [x, y]; };
  const beds = [[-900, 300], [900, -100], [0, -3000], [-3000, -2000], [3000, -2000], [3600, 2600]].map(settle);
  return {
    spots: { spawn: [0, -5300], yaw: Math.PI, exit: [0, 5450], textYaw: -90, ammo: [-650, -5300], ammoYaw: 90,
      bench: [-600, 4950], benchYaw: 0, box: [600, 4750], chest: [600, 4750], chestYaw: 180, press: [-600, 4500], pressYaw: 0 },
    keep: [[MT.plaza[0], MT.plaza[1], 900]],
    beds, bossAt: null,
  };
}

// ---- the air in the town: motes of the Rustcap drifting off the heart and down the streets, the more the nearer it
export function townAir(g, dt, A) {
  const c = g.camera.position, [cx, cy] = A.c; if (Math.abs(c.x - cx) > A.hx + 600 || Math.abs(c.z - cy) > A.hy + 600) return;
  const st = (townAir.st ||= { a: 0, h: 0 });
  st.a += dt * 18; while (st.a > 1) { st.a -= 1; const a = Math.random() * 6.28, r = 260 + Math.pow(Math.random(), 1.5) * 2200, s = 7 + Math.random() * 5;
    g.fx.add({ pos: new THREE.Vector3(c.x + Math.cos(a) * r, 80 + Math.random() * 700, c.z + Math.sin(a) * r), vel: new THREE.Vector3((Math.random() - 0.5) * 50, -20 - Math.random() * 20, (Math.random() - 0.5) * 50), life: 8, size0: s, size1: s, c0: [1, 0.78, 0.4, 0.9], fadeIn: 1, fadeOut: 1.5, tex: 'FX_Disc', kind: 'fx', glow: 0.4 }); }
  const hx0 = cx + MT.heart[0], hz0 = cy + MT.heart[1]; if (Math.hypot(c.x - hx0, c.z - hz0) < 3500) { st.h += dt * 12; while (st.h > 1) { st.h -= 1; const a = Math.random() * 6.28, r = 150 + Math.random() * 500;
    g.fx.add({ pos: new THREE.Vector3(hx0 + Math.cos(a) * r, 30 + Math.random() * 200, hz0 + Math.sin(a) * r), vel: new THREE.Vector3((Math.random() - 0.5) * 30, 40 + Math.random() * 50, (Math.random() - 0.5) * 30), life: 5, size0: 8, size1: 5, c0: [1, 0.72, 0.3, 1], c1: [1, 0.6, 0.2, 0], fadeIn: 0.4, fadeOut: 1.5, tex: 'FX_Disc', kind: 'fx', glow: 0.8 }); } }
}
