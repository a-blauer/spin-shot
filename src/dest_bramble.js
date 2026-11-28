// Bramble Farm, in the Vale: the first place the Blight took outside the woods. A gnome homestead a few fields from
// Thimblewick: the farmhouse on the west side of a packed-earth yard, the great barn north of it with the farm track
// running through it door to door, the silo at the barn's shoulder, the pond and the windmill to the north-west, the
// pumpkin patch and the vegetable beds to the east, the orchard in the south-west corner, haystacks and beehives in
// the north-east, all inside drystone walls and a hawthorn hedge. The lane comes in at the south gate; the way on is
// the north gate, past the round threshing floor where the stations come up. The Blight came up under the barn: its
// growth is thickest round the barn's north end and thins out across the fields.
//
// Local frame (dest.js): +Y north, +X east, z up; the ground is flat at z = 0. Playable: x in [-5400, 5400],
// y in [-5800, 5800]. (In the rendered world east is on your left as you face north.)
import { V, R } from './mapkit.js';
import { shape, wob } from './propkit.js';
import { destKit } from './dest_kit.js';
import { stoneWall, gatePost, gateLeaf, farmhouse, FH, barn, BN, silo, handPump, churn, churnStand, coop, scarecrow, haystack, hiveBench, wheelbarrow, ladder, basket, appleTree, railFence, raisedBed, farmSign, cartShed, plough, furrows, blightMass, duckHouse, wheatField, farTree, hedgeLump, FC } from './dest_props.js';
import { hay } from './descent_shapes.js';
import { windmill, pumpkin, cabbage, rock, bush, tree, grassTuft, wellFine, hill, toadstoolCluster, mix } from './village_shapes.js';
import { woodpile, choppingBlock, washLine, trough, cart, crate, sack, reeds, lilies, rowboat, flowerClump, cobbleSquare } from './village_props.js';

// where the farm's parts stand (local)
export const BR = {
  gateS: [0, -5700], gateN: [0, 5700], wallIn: 100,
  yard: [0, -1900], house: [-2600, -1500], barn: [0, 1000], silo: [1260, 1900], pond: [-3300, 2100], mill: [-3700, 4500],
  patch: [3400, 1550], beds: [3800, -1350], coop: [2350, -3000], orchard: [-3800, -4200], hives: [4350, 4500], stacks: [2600, 4200], floor: [0, 4550], floorR: 1100,
};
// the farm track: in at the south gate, across the yard, through the barn door to door, up to the threshing floor;
// and the last stretch from the floor out through the north gate
const TRACK = [[0, -5800], [40, -4600], [-60, -3300], [60, -2500], [0, -1500], [0, -340], [0, 2340], [-20, 3000], [0, 3480]];
const TRACK_N = [[0, 5620], [0, 5800]];
// the pond's shore: an irregular ring round its middle
const POND = (a) => { const [px, py] = BR.pond; return [px + Math.cos(a) * (1050 + 160 * Math.sin(a * 3 + 0.5) + 90 * Math.sin(a * 5)), py + Math.sin(a) * (760 + 110 * Math.sin(a * 2 + 1.2))]; };

// ---- small pieces only this farm uses
const benchFarm = () => ['dbenchf', shape((G) => { for (const s of [-1, 1]) G.blob(0, s * 90, 22, 18, 6, 22, FC.oakD, { e: 8, nu: 6, nv: 3 }); G.blob(0, 0, 46, 24, 110, 4, FC.oak, { e: 8, nu: 8, nv: 3 }); G.blob(-26, 0, 80, 3, 110, 30, FC.oak, { e: 8, nu: 8, nv: 3 }); for (const s of [-1, 1]) G.blob(-24, s * 90, 64, 4, 6, 18, FC.oakD, { e: 8, nu: 6, nv: 3 }); })];
const barrelFarm = () => ['dbutt', shape((G) => { G.lathe([[40, 0], [44, 30], [46, 60], [44, 90], [40, 118], [38, 120]], (k) => (k === 1 || k === 4 ? FC.iron : FC.oak), 18); G.blob(0, 0, 116, 37, 37, 2, 0x2e4a52, { nu: 14, nv: 3 }); })];
const stallFront = () => ['dstall', shape((G) => { for (let i = 0; i < 4; i++) G.blob(0, 0, 22 + i * 34, 150, 6, 14, i % 2 ? FC.oak : mix(FC.oak, 0x5a4430, 0.5), { e: 8, nu: 8, nv: 3 }); for (const s of [-1, 0, 1]) G.blob(s * 146, 0, 70, 8, 8, 70, FC.oakD, { e: 8, nu: 6, nv: 3 }); G.blob(0, 0, 142, 156, 9, 5, FC.oakD, { e: 8, nu: 8, nv: 3 }); })];
const vineLeaves = (seed) => ['dvine|' + (seed % 5), shape((G) => { const k = seed % 5; G.tube([[0, -60, 4], [40, -20 + k * 4, 6], [80, 10, 4], [110, 40, 5]], 3, 0x4e6a2a, { S: 5 }); for (let i = 0; i < 5; i++) { const b = G.n; G.blob(0, 0, 0, 24, 20, 4, i % 2 ? 0x4e7a30 : 0x5a8a38, { nu: 10, nv: 4, warp: (x, y, z) => [x, y, z + wob(x * 0.1, y * 0.1) * 3] }); G.place(b, { x: i * 26 - 10, y: -50 + i * 22 + (i % 2 ? 20 : -20), z: 8, yaw: i * 70 }); } })];
const fallenApples = () => ['dfallen', shape((G) => { G.blob(0, 0, 6, 6.5, 6.5, 6.5, 0xb8302a, { nu: 8, nv: 5 }); G.blob(14, 6, 6, 6, 6, 6, 0xc8402a, { nu: 8, nv: 5 }); })];

export function buildBramble(M, O) {
  const { hx, hy } = O;
  const K = destKit(M, 11, O), { S, body, round, patch, blot, path, rnd, rr, Box } = K;
  // a few of each kind of plant, so the same ones are drawn together: pick(list) takes one of them
  const pick = (L) => L[Math.floor(rnd() * L.length)];
  const LEAF = [0x4e7a30, 0x5a8638, 0x466e2c], hedgeBush = (rf = 0) => { const r0 = pick([180, 220]), r = rf || r0; return [hedgeLump(r, pick(LEAF), pick([0, 0, 0xf2f0e8]), pick([1, 2])), r]; };
  // a hawthorn bush in a hedge: drawn, and an eight-sided body as wide as its leaves at chest height (on the walking
  // grid too, so the horde is led round the leaves and not into them)
  const bush = (x, y, rot, [pair, r]) => { S(pair, x, y, 0, rot); round(x, y, r * 1.08, r * 1.25); };
  const SOL = (x, y, w, d, h, yaw = 0, nav = true) => body(x, y, w, d, h, yaw, 0, nav);
  // ---- the ground: meadow grass, worn to earth round the yard and under the barn's doors
  Box(V(0, 0, -60), V(hx * 2 + 24000, hy * 2 + 24000, 120), 0x5e8436, true, false);
  for (const [x, y, d, c] of [[-1800, 3200, 2600, 0x668c3c], [2600, -3400, 2400, 0x62883a], [-4200, -800, 2000, 0x5a8034], [3800, 3400, 2200, 0x6a8e40], [1800, -200, 1600, 0x72904a], [-2600, -4400, 1800, 0x668a3a], [3600, 1500, 2400, 0x5c7e34]]) patch(x, y, d, c);
  for (const [x, y, w, d, yw] of [[0, -1900, 3000, 2400, 10], [-700, -1400, 1600, 1500, 35], [700, -2400, 1500, 1300, 70], [0, -500, 1400, 700, 0], [0, 2600, 1300, 800, 0]]) blot(x, y, w, d, 0x7e6a48, yw);
  for (const [x, y, w, d, yw] of [[-400, -2100, 900, 600, 20], [500, -1500, 800, 500, 60], [-1300, -2300, 700, 500, 5]]) blot(x, y, w, d, 0x8a7652, yw);
  // ---- the walls: drystone round three sides, the gates in the south and north walls; the east side is hedge
  const WH = 120, wall = (x0, x1, y, alongY) => {   // a run from x0 to x1 (along X, or along Y if alongY) at y
    const L = x1 - x0, n = Math.max(1, Math.round(L / 1000)), seg = L / n;
    for (let i = 0; i < n; i++) { const m = x0 + seg * (i + 0.5), sd = 1 + ((i + Math.round(Math.abs(y) / 100)) % 3); if (alongY) S(stoneWall(seg + 12, WH, sd), y, m, 0, 90); else S(stoneWall(seg + 12, WH, sd), m, y, 0, 0); }   // three of each length
    if (alongY) body(y, (x0 + x1) / 2, 92, L, WH + 16); else body((x0 + x1) / 2, y, L, 92, WH + 16);
  };
  const yS = -hy + BR.wallIn, yN = hy - BR.wallIn, xW = -hx + BR.wallIn, xE = hx - BR.wallIn;
  wall(xW, -300, yS, false); wall(300, xE - 260, yS, false);
  wall(xW, -340, yN, false); wall(340, xE - 260, yN, false);
  wall(yS + 46, yN - 46, xW, true);
  // the east side: a thick hawthorn hedge, a field oak standing in it here and there
  for (let y = yS + 120; y < yN - 60; y += 230) { const hb = hedgeBush(), bx = xE + rr(-30, 30); bush(bx, y, rr(0, 360), hb); }
  body(xE, 0, 460, yN - yS - 80, 300);
  for (const [i, y] of [-4200, -1300, 1900, 4300].entries()) { S(tree(1300, 0x4e7e32, i % 3, 0), xE + 60, y, 0, rr(0, 360)); round(xE + 60, y, 90, 600); }
  // ---- the gates: oak posts each side of the gap, the five-bar leaves swung open into the farm, a sign at the lane
  for (const [gy, half, dir] of [[yS, 280, 1], [yN, 320, -1]]) {
    for (const s of [-1, 1]) { S(gatePost(170), s * half, gy, 0, 0); body(s * half, gy, 30, 30, 176); }
    for (const s of [-1, 1]) { const x = s * (half - 16), w = half - 30; S(gateLeaf(w, 130), x, gy + dir * 14, -3, dir > 0 ? 0 : 180); body(x, gy + dir * (14 + w / 2), 14, w, 140); }
  }
  S(farmSign(240), -560, yS + 70, 0, 0); body(-560, yS + 70, 24, 24, 310);
  M.Sign(V(-560 - 6, yS + 70 + 130, 196), 180, 'BRAMBLE FARM', '#f2e6c8', 34);
  // a churn stand by the gate, where the milk was left for the cart
  S(churnStand(200), 620, yS + 220, 0, 0); body(620, yS + 220, 210, 90, 104);
  for (const [dx, h] of [[-60, 84], [0, 84], [62, 76]]) S(churn(h), 620 + dx, yS + 220, 100, rr(0, 360));
  // ---- the track
  path(TRACK, 360, 0x8a6a46, undefined, (x, y) => Math.abs(x - BR.barn[0]) < BN.W / 2 + 30 && Math.abs(y - BR.barn[1]) < BN.L / 2 + 30); path(TRACK_N, 380, 0x8a6a46);   // no edge stones on the barn's boards
  // a pitched roof's body: a slab from the eave (x0, z0) up to the ridge (x1, z1), y0..y1 along the ridge (house
  // frame at hx0, hy0, the house unturned)
  const roofSolid = (hx0, hy0, x0, z0, x1, z1, y0, y1) => { const L = Math.hypot(x1 - x0, z1 - z0), a = (Math.atan2(z1 - z0, Math.abs(x1 - x0)) * 180) / Math.PI * (x1 < x0 ? -1 : 1); M.SolidRot(V(hx0 + (x0 + x1) / 2, hy0 + (y0 + y1) / 2, (z0 + z1) / 2 - 12), V(L, y1 - y0, 26), R(a, 0, 0)); };
  const fence = (x0, y0, x1, y1, h = 96) => { const L = Math.hypot(x1 - x0, y1 - y0), along = Math.abs(x1 - x0) > Math.abs(y1 - y0); S(railFence(L, h, Math.round(x0 + y0)), (x0 + x1) / 2, (y0 + y1) / 2, 0, along ? 0 : 90); body((x0 + x1) / 2, (y0 + y1) / 2, along ? L : 20, along ? 20 : L, h + 12); };

  // ---- the farmhouse, west of the yard, its front on the yard: whole and solid, roof and chimney included
  { const [x, y] = BR.house, w = 1100, d = 760, hd = d / 2, hw = w / 2;
    S(farmhouse(w, d, 2), x, y, 0, 0);
    body(x, y, d, w, FH.g + 4); body(x + FH.jet / 2, y, d + FH.jet, w, FH.up - FH.g, 0, FH.g + 4, false);   // the upper storey stands out over the front
    for (const s of [-1, 1]) roofSolid(x, y, s > 0 ? hd + FH.jet + FH.over : -hd - FH.over, FH.up - 20, FH.jet / 2, FH.ridge, -hw - 46, hw + 46);
    body(x - hd * 0.25, y + hw + 56, 180, 120, FH.ridge + 160);
    body(x + hd + 30, y, 64, 168, 16, 0, 0, false);
    K.lit(x + hd + 31, y + 114, 172, { r: 1, g: 0.75, b: 0.42 }, 700);
    // round it: a bench under a front window, the woodpile against the south gable with the block, a water butt at
    // the corner, the washing line out the back, the kitchen garden through the back door
    S(benchFarm(), x + hd + 32, y - 330, 0, 0); SOL(x + hd + 32, y - 330, 64, 230, 64);
    S(woodpile(420, 5, 3), x - 40, y - hw - 90, 0, 0); SOL(x - 40, y - hw - 90, 430, 100, 150);
    S(choppingBlock(), x + 420, y - hw - 260, 0, 30); SOL(x + 420, y - hw - 260, 70, 70, 60);
    S(barrelFarm(), x + hd + 60, y + hw - 40, 0, 0); round(x + hd + 60, y + hw - 40, 48, 120);
    S(washLine(560, 2), x - 900, y - 1250, 0, 90); SOL(x - 900, y - 1250 - 280, 24, 24, 220); SOL(x - 900, y - 1250 + 280, 24, 24, 220);
    path([[x - hd - 30, y + 250], [x - 700, y + 230], [x - 1060, y + 120]], 200, 0x86684a);
    // the kitchen garden: four raised beds behind a rail fence, cabbages and leeks; the walks between and round the beds
    // are wide enough for anything that comes after you, and the fence is open to the house and to the north
    const gx = x - 1750, gy = y + 100;
    for (const [i, by] of [-660, -220, 220, 660].entries()) {
      S(raisedBed(480, 150), gx, gy + by, 0, 0); SOL(gx, gy + by, 480, 150, 44);
      for (let k = 0; k < 5; k++) { const cx = gx - 190 + k * 95; if (i % 2 === 0) S(cabbage(pick([22, 26])), cx, gy + by + rr(-12, 12), 36, rr(0, 360)); else for (let j = 0; j < 3; j++) S(grassTuft(pick([36, 44]), pick([1, 2, 3])), cx + rr(-18, 18), gy + by + rr(-30, 30), 36, rr(0, 360)); }
    }
    fence(gx - 600, gy - 980, gx + 600, gy - 980); fence(gx - 600, gy + 980, gx - 300, gy + 980); fence(gx + 300, gy + 980, gx + 600, gy + 980); fence(gx - 600, gy - 980, gx - 600, gy + 980);
    fence(gx + 600, gy - 980, gx + 600, gy - 300); fence(gx + 600, gy + 300, gx + 600, gy + 980);
  }
  // ---- the yard: the well, the pump and trough, a laden hay cart by the barn, a wheelbarrow, sacks and crates
  { S(wellFine(), -800, -1300, 0, 0); SOL(-800, -1300, 236, 236, 120); for (const sy of [-1, 1]) SOL(-800, -1300 + sy * 88, 20, 20, 300, 0, false);
    S(handPump(), 700, -2200, 0, 0); SOL(700, -2200, 70, 70, 200);
    S(trough(220), 860, -2200, 0, 0); SOL(860, -2200, 230, 70, 70);
    S(cart(1, 2), 1350, -620, 0, 28); SOL(1350, -620, 240, 140, 150, 28);
    S(wheelbarrow(1), -1300, -2700, 0, -40); SOL(-1300, -2700, 170, 80, 70, -40);
    for (const [dx, dy] of [[0, 0], [60, 40], [-50, 50]]) S(sack(26, 0xc8b48a), 1500 + dx, -1100 + dy, -4, rr(0, 360)); SOL(1505, -1075, 160, 120, 60);
    for (const [dx, dy, w, z] of [[0, 0, 80, 0], [90, 10, 70, 0], [40, 0, 70, 68]]) S(crate(w, Math.round(dx)), -1700 + dx, -600 + dy, z, rr(-8, 8)); SOL(-1655, -600, 190, 90, 150);
  }
  // ---- the barn, the track running through it door to door: its walls, gables, roof and posts are all bodies
  { const [x, y] = BR.barn, { W, L, eave, kneeX, knee, ridge, over, doorW, doorH } = BN, hw = W / 2, hl = L / 2, dh = doorW / 2;
    S(barn(1), x, y, 0, 0);
    for (const sx of [-1, 1]) body(x + sx * hw, y, 40, L, eave + 26);
    for (const sy of [-1, 1]) {
      const gy = y + sy * hl;
      for (const sx of [-1, 1]) { body(x + sx * (dh + hw) / 2, gy, hw - dh, 40, eave + 26); body(x + sx * (dh + kneeX) / 2, gy, kneeX - dh, 40, 400, 0, eave + 26, false); body(x + sx * (kneeX + hw) / 2, gy, hw - kneeX, 40, 230, 0, eave + 26, false); }
      body(x, gy, doorW + 20, 40, ridge - doorH - 30, 0, doorH + 30, false);
      for (const sx of [-1, 1]) body(x + sx * (dh + 200), gy + sy * 22, 400, 14, doorH + 12, 0, 18);
    }
    for (const sx of [-1, 1]) { roofSolid(x, y, sx * (hw + over), eave - 26, sx * kneeX, knee, -hl - over, hl + over); roofSolid(x, y, sx * kneeX, knee, 0, ridge, -hl - over, hl + over); }
    for (const sx of [-1, 1]) for (const py of BN.posts) body(x + sx * BN.postX, y + py, 32, 32, eave);
    // inside: hay stacked down the west aisle, two and three high; stalls down the east aisle; lanterns on the beams
    for (const [by, n] of [[-1180, 2], [-700, 3], [60, 2], [620, 3]]) {
      for (let k = 0; k < n; k++) S(hay(FC.straw), x - 740, y + by, k * 80, k % 2 ? 90 : 0);
      S(hay(FC.straw), x - 740, y + by + 160, 0, 90);
      body(x - 740, y + by + 60, 160, 290, n * 80);
    }
    for (const sy of [-1, 0, 1]) { const py = y + 300 + sy * 560; S(stallFront(), x + 700, py, 0, 0); body(x + 700, py, 300, 16, 150); }
    for (const py of [y - 260, y + 860]) { S(trough(200), x + 780, py, 0, 90); body(x + 780, py, 70, 210, 70); }
    for (const py of BN.posts) { const lx = x + (py > 0 ? 280 : -280), ly = y + py; Box(V(lx, ly, eave - 60), V(2.4, 2.4, 100), 0x2a2018, false, false); K.lit(lx, ly, eave - 130, { r: 1, g: 0.74, b: 0.42 }, 900); }
  }
  // ---- the silo at the barn's north-east shoulder, ladder to the east
  { const [x, y] = BR.silo; S(silo(1500, 270), x, y, 0, 0); round(x, y, 290, 1500); body(x + 296, y, 20, 70, 1540); }

  // ---- the chicken coop and its run, south-east of the yard
  { const [x, y] = BR.coop; S(coop(1), x, y, 0, 180); body(x, y, 190, 250, 210); body(x - 110, y, 120, 50, 30, 0, 0, false);
    fence(x + 120, y - 420, x + 980, y - 420, 90); fence(x + 120, y + 420, x + 980, y + 420, 90); fence(x + 980, y - 420, x + 980, y + 420, 90);
    S(sack(22, 0xd8c8a0), x + 300, y + 200, -4, 30); SOL(x + 300, y + 200, 50, 50, 40, 0, false);
  }
  // ---- the vegetable beds east of the yard: four long beds, cabbages and leeks, a wheelbarrow of earth
  { const [x, y] = BR.beds;
    for (const [i, by] of [-450, -150, 150, 450].entries()) {
      S(raisedBed(760, 160), x, y + by, 0, 0); SOL(x, y + by, 760, 160, 44);
      for (let k = 0; k < 8; k++) { const cx = x - 330 + k * 94; if (i % 2 === 0) S(cabbage(pick([22, 26])), cx, y + by + rr(-14, 14), 36, rr(0, 360)); else for (let j = 0; j < 3; j++) S(grassTuft(pick([36, 44]), pick([1, 2, 3])), cx + rr(-18, 18), y + by + rr(-34, 34), 36, rr(0, 360)); }
    }
    S(wheelbarrow(1), x - 560, y + 300, 0, 200); SOL(x - 560, y + 300, 170, 80, 70, 200);
  }
  // ---- the pumpkin patch: rows of them sprawling on their vines, a scarecrow in the middle, crates of the picked ones
  { const [x, y] = BR.patch;
    for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) {
      const px = x - 900 + c * 300 + rr(-50, 50), py = y - 950 + r * 380 + rr(-40, 40);
      if (Math.hypot(px - x, py - y) < 260 || Math.hypot(px - (x - 1105), py - (y - 1090)) < 330 || Math.hypot(px - 2700, py - 1200) < 300) continue;   // clear of the scarecrow, the crates and the Blight's growth
      const pr = rnd() < 0.15 ? pick([52, 60]) : pick([28, 34, 40]); S(pumpkin(pr), px, py, 0, rr(0, 360)); round(px, py, pr * 0.95, pr * 1.5, 0, pr > 40);
      S(vineLeaves(Math.floor(rnd() * 5)), px - pr - 20, py + rr(-30, 30), 0, rr(0, 360));
    }
    S(scarecrow(2), x, y, 0, 200); SOL(x, y, 40, 40, 300);
    for (const dx of [-1150, -1060]) S(crate(80, 2), x + dx, y - 1090, 0, 10);
    SOL(x - 1105, y - 1090, 190, 100, 110);
    for (const [k, dx] of [-60, 0, 60].entries()) S(pumpkin(26), x - 1105 + dx, y - 1090, 66, k * 50);
    // a rail fence along its west side, open in the middle
    for (const [y0, y1] of [[y - 1250, y - 180], [y + 180, y + 1250]]) fence(x - 1300, y0, x - 1300, y1);
  }
  // ---- the orchard in the south-west: old apple trees in loose rows, a ladder against one, baskets, fallen fruit
  { const [x, y] = BR.orchard, at = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const tx = x - 700 + c * 700 + rr(-90, 90), ty = y - 650 + r * 650 + rr(-80, 80), h = pick([480, 540]);
      S(appleTree(h, pick([1, 2, 3])), tx, ty, 0, rr(0, 360)); round(tx, ty, h * 0.07, h * 0.5); body(tx, ty, h * 0.9, h * 0.9, h * 0.5, 0, h * 0.5, false); at.push([tx, ty, h]);
      for (let k = 0; k < 4; k++) { const a = rnd() * 6.28, d = rr(90, 260); S(fallenApples(), tx + Math.cos(a) * d, ty + Math.sin(a) * d, 0, rr(0, 360)); }
    }
    { const [tx, ty] = at[4]; S(ladder(320, 100), tx + 150, ty, 0, 0); body(tx + 100, ty, 110, 60, 300, 0, 0, false); }
    for (const [k, [tx, ty]] of [at[1], at[6]].entries()) { S(basket(30), tx + 180, ty - 120 + k * 40, 0, 0); SOL(tx + 180, ty - 120 + k * 40, 64, 64, 50, 0, false); }
  }
  // ---- the pond, north-west: still water inside a muddy shore, reeds, lilies, stones, a rowboat drawn up on the bank
  { const [px, py] = BR.pond, N = 48;
    M.Shape('dpond|bramble', () => { const pos = [], col = [], idx = [], put = (x, y, z, c) => { pos.push(x - px, y - py, z); col.push(((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255); };
      const rings = [[1.12, 0.4, 0x6a5a3a], [1.04, 1.2, 0x5a4a32], [1.0, 1.6, 0x3e6a72], [0.8, 1.9, 0x356070], [0.5, 2.1, 0x2c5464], [0, 2.2, 0x284e5e]];
      for (const [k, z, c] of rings) for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2, [ex, ey] = POND(a); put(px + (ex - px) * k, py + (ey - py) * k, z, c); }
      for (let r = 0; r < rings.length - 1; r++) for (let i = 0; i < N; i++) { const a = r * N + i, b = r * N + ((i + 1) % N), c2 = a + N, d = b + N; idx.push(a, c2, b, b, c2, d); }
      return { pos, col, idx }; }, V(px, py, 0), R(0, 0, 0));
    // nothing walks in the water: the shore is a ring of movement-only fences and the walking grid is closed over it
    for (let i = 0; i < 32; i++) { const a0 = (i / 32) * Math.PI * 2, a1 = ((i + 1) / 32) * Math.PI * 2, [x0, y0] = POND(a0), [x1, y1] = POND(a1), L = Math.hypot(x1 - x0, y1 - y0); M.BlockerYaw(V((x0 + x1) / 2, (y0 + y1) / 2, 150), V(L + 30, 40, 300), (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI); }
    for (let gx = px - 1300; gx <= px + 1300; gx += 100) for (let gy = py - 1000; gy <= py + 1000; gy += 100) { const a = Math.atan2(gy - py, gx - px), [ex, ey] = POND(a); if (Math.hypot(gx - px, gy - py) < Math.hypot(ex - px, ey - py) - 60) O.GM.NavBlockBox({ min: V(gx - 50, gy - 50, 0), max: V(gx + 50, gy + 50, 100) }, 1); }
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + 0.2, [ex, ey] = POND(a); S(reeds(pick([120, 150]), pick([1, 2, 3])), px + (ex - px) * 1.02, py + (ey - py) * 1.02, 0, rr(0, 360)); if (i % 3 === 0) { const rx = px + (ex - px) * 1.08, ry = py + (ey - py) * 1.08, rs = pick([36, 48]); S(rock(rs, pick([1, 2]), true), rx, ry, 0, rr(0, 360)); round(rx, ry, rs * 1.1, 52, 0, false); } }
    S(lilies(180, 7), px - 300, py + 200, 2.4, 20); S(lilies(140, 8), px + 350, py - 150, 2.4, 140); S(lilies(120, 9), px + 100, py + 380, 2.4, 260);
    { const a = -0.6, [ex, ey] = POND(a), bx = px + (ex - px) * 1.14, by = py + (ey - py) * 1.14; S(rowboat(320, 0x6a5038, 2), bx, by, 0, (a * 180) / Math.PI + 90); SOL(bx, by, 330, 120, 80, (a * 180) / Math.PI + 90); }
  }
  // ---- the windmill on the north-west rise, its sails to the east
  { const [x, y] = BR.mill; S(windmill(1150), x, y, 0, 0); round(x, y, 240, 1260); S(sack(26, 0xd8c8a0), x + 300, y - 60, -4, 0); S(sack(24, 0xd8c8a0), x + 320, y + 10, -4, 40); SOL(x + 310, y - 25, 90, 120, 50, 0, false); }
  // ---- haystacks in the north-east field and the hives by the wall
  { const [x, y] = BR.stacks; for (const [dx, dy, r, h] of [[-700, -400, 210, 360], [0, 200, 230, 400], [700, -300, 200, 340], [-200, 800, 190, 320]]) { S(haystack(r, h, Math.round(Math.abs(dx + dy))), x + dx, y + dy, 0, rr(0, 360)); round(x + dx, y + dy, r * 0.95, h * 0.7); }
    for (const [dx, dy, yw] of [[400, 700, 20], [500, 820, 70]]) S(hay(FC.straw), x + dx, y + dy, 0, yw); SOL(x + 450, y + 760, 220, 220, 80, 30); }
  { const [x, y] = BR.hives; for (const dy of [0, -420]) { S(hiveBench(3), x, y + dy, 0, 180); SOL(x, y + dy, 90, 330, 132); }
    for (let i = 0; i < 6; i++) S(flowerClump(44, [0xf08aa8, 0xf6d04a, 0xffffff][i % 3], 0xffffff, 1 + (i % 2)), x - 300 + rr(-200, 200), y - 200 + rr(-500, 400), 0, rr(0, 360)); }
  // ---- the threshing floor, round and cobbled, by the north gate: where the bench and the box come up
  { const [x, y] = BR.floor; S(cobbleSquare(60, BR.floorR, 60), x, y, 0.4, 0);
    for (const [dx, dy] of [[-1000, 500], [1000, 520]]) { S(sack(28, 0xd8c8a0), x + dx, y + dy, -4, 0); S(sack(24, 0xd8c8a0), x + dx + 50, y + dy + 30, -4, 50); SOL(x + dx + 25, y + dy + 15, 120, 100, 56, 0, false); }
  }
  // ---- the fields: a hedgerow across the south-east with the ploughed field beyond it and the plough still in it; the
  // house field between the house and the barn turned over and half sown; field oaks standing about
  const hedge = (x0, y0, x1, y1, gaps = []) => {   // a hawthorn hedge along a line, solid, with gaps where a way goes through
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.round(L / 220), ux = (x1 - x0) / L, uy = (y1 - y0) / L; let run = null;
    const close = (t) => { if (run === null) return; const a = run, b = t, cx = x0 + ux * (a + b) / 2, cy = y0 + uy * (a + b) / 2; body(cx, cy, b - a + 160, 430, 280, (Math.atan2(uy, ux) * 180) / Math.PI); run = null; };
    const inGap = (t) => gaps.some(([g0, g1]) => t > g0 && t < g1); let last = 0;
    for (let i = 0; i <= n; i++) { const t = (L * i) / n; if (inGap(t)) { close(last + 30); continue; } if (run === null) run = t;
      // the bushes either side of a way through are the small ones, stood back from it, so the way is a good cart's width
      const side = i > 0 && inGap((L * (i - 1)) / n) ? 1 : i < n && inGap((L * (i + 1)) / n) ? -1 : 0, ts = t + side * 50;
      const hb = hedgeBush(side ? 180 : 0), bx = x0 + ux * ts + rr(-20, 20), by = y0 + uy * ts + rr(-20, 20); bush(bx, by, rr(0, 360), hb); last = t; }
    close(L);
  };
  hedge(1500, -3700, 5150, -3700, [[2050, 2480]]);   // the way through is east of the coop run, clear of its fence
  { S(furrows(2600, 1400, 16), 3200, -4650, 0, 0); S(plough(), 2400, -4300, 3, 20); SOL(2400, -4300, 240, 90, 90, 20, false); }
  { S(furrows(1500, 900, 11), -2350, 250, 0, 90); for (let i = 0; i < 6; i++) for (let k = 0; k < 5; k++) S(grassTuft(rr(26, 36), i * 7 + k), -2750 + i * 160 + rr(-14, 14), 250 - 520 + k * 260 + rr(-30, 30), 4, rr(0, 360)); }
  for (const [i, [x, y, h]] of [[-1900, -4700, 1260], [4550, -500, 1340], [-4700, 700, 1200], [2150, 2950, 1140], [-2100, 3500, 1340], [4700, 3000, 1260], [-600, -3500, 1140]].entries()) { S(tree(h, 0x4e7e32, i % 3, 0), x, y, 0, rr(0, 360)); round(x, y, h * 0.06, h * 0.45); }
  // ---- the cart shed on the east of the yard, open to it, a cart backed into it
  { S(cartShed(900, 420), 2250, -1600, 0, 180); body(2250 + 200, -1600, 30, 900, 300); for (const s of [-1, 1]) body(2250, -1600 + s * 444, 420, 20, 330); for (const y of [-430, 0, 430]) body(2250 - 194, -1600 + y, 30, 30, 360);
    M.SolidRot(V(2250, -1600, 330), V(Math.hypot(500, 80), 980, 20), R(-9, 0, 0)); S(cart(0, 1), 2300, -1700, 0, 180); SOL(2300, -1700, 240, 140, 150, 180); }
  // the duck house on the pond's east shore
  { const [ex, ey] = POND(0.15), bx = BR.pond[0] + (ex - BR.pond[0]) * 0.93, by = BR.pond[1] + (ey - BR.pond[1]) * 0.93; S(duckHouse(), bx, by, 0, 180); body(bx, by, 250, 135, 140, 180, 0, false); }
  // ---- the Blight: it came up under the barn. A split in the ground by the far door with the growth heaving out of
  // it, a mass bursting up through the barn floor in its north-west corner, pale threads running out across the
  // fields from it, caps crowding along them and at the feet of the buildings
  const blightAt = [[-760, 2880, 300, 1], [640, 3120, 230, 2], [-640, 2120, 210, 3], [2700, 1200, 180, 4], [-1900, 2900, 170, 5], [1700, 3300, 160, 1]];
  for (const [x, y, r, sd] of blightAt) { S(blightMass(r, sd), x, y, 0, rr(0, 360)); round(x, y, r * 0.7, r * 0.9); for (let k = 0; k < 4; k++) { const a = rnd() * 6.28, d = r * rr(0.3, 0.7); M.Glow(V(x + Math.cos(a) * d, y + Math.sin(a) * d, r * 0.42), V(14, 14, 14), 0xc4ff58, 2); } }
  for (const [x, y, w, d, yw] of [[-60, 2900, 1700, 700, 8], [-700, 2850, 600, 500, 30], [600, 3100, 500, 420, 70]]) blot(x, y, w, d, 0x4a3a2c, yw);
  { const veins = [[[-760, 2880], [-1250, 2760], [-1600, 2820], [-1900, 2900]], [[640, 3120], [1200, 3200], [1700, 3300]], [[-60, 2600], [700, 2700], [1650, 2450], [2200, 1900], [2700, 1200]], [[-760, 2880], [-900, 3300], [-1500, 3500]], [[640, 3120], [1100, 2900], [1900, 2800]]];
    M.Shape('dveins|bramble', () => { const pos = [], col = [], idx = []; for (const pts of veins) { const n = pts.length; for (let j = 0; j < n - 1; j++) { const [x0, y0] = pts[j], [x1, y1] = pts[j + 1], L = Math.hypot(x1 - x0, y1 - y0), m = Math.max(2, Math.round(L / 40)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
      for (let i = 0; i <= m; i++) { const t = i / m, x = x0 + (x1 - x0) * t + nx * Math.sin((x0 + i * 40) * 0.01) * 40, y = y0 + (y1 - y0) * t + ny * Math.sin((y0 + i * 40) * 0.013) * 40, w = 14 * (1 - (j + t) / n * 0.6); for (const e of [-1, 1]) { pos.push(x + nx * w * e, y + ny * w * e, 3.6); col.push(0.86, 0.82, 0.7); } }
      const b = pos.length / 3 - (m + 1) * 2; for (let i = 0; i < m; i++) { const a = b + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } } } return { pos, col, idx }; }, V(0, 0, 0), R(0, 0, 0));
    for (const pts of veins) for (let j = 1; j < pts.length; j++) { const [x, y] = pts[j]; if (blightAt.some(([bx, by, br]) => Math.hypot(x - bx, y - by) < br + 120)) continue; const s = pick([0.7, 0.9, 1.1]), sd = pick([1, 2, 3]), tx = x + rr(-60, 60), ty = y + rr(-60, 60); S(toadstoolCluster(s, 0xa4432a, sd), tx, ty, 0, rr(0, 360)); round(tx, ty, 22 * s, 40 * s, 0, false); }
  }
  for (const [x, y] of [[-2420, -915], [-2960, -915], [1300, 2240], [2200, -2850], [-1200, 2380], [960, 2480]]) { const s = pick([0.7, 0.9]); S(toadstoolCluster(s, 0xa4432a, pick([1, 2, 3])), x, y, 0, rr(0, 360)); round(x, y, 22 * s, 40 * s, 0, false); }
  // ---- beyond the walls (out of reach): the lane south between hedges, fields of wheat west and east, the Wildwood's
  // edge dark to the north where the track goes on, hills all round, and Thimblewick's giants on the southern skyline
  { const field = (x, y, w, d, c) => S(wheatField(w, d, c, Math.round(Math.abs(x + y) / 100)), x, y, 0, 0);
    field(-8200, -1800, 4600, 4800, 0xd8b45e); field(-8200, 4300, 4600, 3600, 0xc8a856); field(8400, -3200, 5000, 4400, 0xd2ae5a); field(8000, 2600, 4000, 3200, 0x7a9a44); field(-4200, -8600, 5200, 3000, 0xd8b45e); field(4200, -8400, 5600, 2800, 0x6a8a3c);
    for (const [x0, y0, x1, y1] of [[-300, -6100, -300, -12000], [300, -6100, 300, -12000], [-5700, 600, -11000, 600], [5700, -800, 11000, -800], [-6000, -6100, -12000, -6100]]) { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.round(L / 300); for (let i = 0; i <= n; i++) { const t = i / n; S(hedgeLump(220, LEAF[i % 2 ? 2 : 0], 0, 1 + (i % 2)), x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 0, rr(0, 360)); } }
    path([[0, -5800], [0, -9000], [200, -12000]], 340, 0x8a6a46); path([[0, 5800], [80, 7400], [-120, 9200]], 340, 0x8a6a46);
    for (let i = 0; i < 70; i++) { const x = -9000 + i * 260 + rr(-80, 80), y = 7800 + rr(0, 2600) + (Math.abs(x) < 600 ? 1400 : 0); S(farTree(pick([1800, 2200, 2600]), i % 3 === 0 ? 1 : 0, pick([0x2e5a2a, 0x355e2c]), pick([1, 2])), x, y, 0, rr(0, 360)); }
    for (const [x, y, rx, ry, h] of [[-14000, 0, 5000, 9000, 2400], [14500, 2000, 5500, 9000, 2600], [0, 15500, 9000, 4000, 2800], [-9000, -14500, 6000, 4000, 2000], [9000, -14000, 6000, 4000, 2200], [-12000, 11000, 5000, 4000, 2600], [12000, 11000, 5000, 4000, 2400]]) S(hill(rx, ry, h, 0x5e8a3c), x, y, 0, 0);
    for (const [x, y, h] of [[-1800, -16500, 6400], [1600, -17200, 7200], [-4600, -15800, 5400]]) S(farTree(h, 0, 0x3e6a2c, 1), x, y, 0, rr(0, 360));
  }
  // ---- the meadow: tufts of longer grass where nothing walks a path, thicker along the walls and the hedges
  { const nav = O.GM, [cx, cy] = [O.cx, O.cy], ok = (x, y) => { const [ix, iy] = nav.cellOf(cx + x, cy + y); if (!nav.navFree(ix, iy)) return false; for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (!nav.navFree(ix + a, iy + b)) return false; return K.clear(x, y, 40) && K.lineDist(x, y, TRACK) > 300 && Math.hypot((x - BR.yard[0]) / 1700, (y - BR.yard[1]) / 1400) > 1 && Math.hypot(x - BR.floor[0], y - BR.floor[1]) > BR.floorR + 120; };
    let n = 0; for (let k = 0; k < 900 && n < 260; k++) { const edge = rnd() < 0.45, x = edge ? (rnd() < 0.5 ? -1 : 1) * rr(hx - 500, hx - 180) : rr(-hx + 300, hx - 300), y = edge && rnd() < 0.5 ? rr(-hy + 300, hy - 300) : edge ? (rnd() < 0.5 ? -1 : 1) * rr(hy - 520, hy - 200) : rr(-hy + 300, hy - 300); if (!ok(x, y)) continue; S(grassTuft(pick([30, 38]), pick([1, 2, 3])), x, y, 0, rr(0, 360)); n++; } }
  // where the Blight's puffball beds go (the strain of the Vale): in the patch, by the barn's far door, along the
  // orchard, by the pond, between the stacks
  const beds = [[3000, 950], [-900, 2900], [-2900, -3500], [-2300, 2700], [1800, 3600], [3900, 2500]];
  return {
    spots: { spawn: [0, -5250], yaw: Math.PI, exit: [0, 5300], textYaw: -90, ammo: [650, -5250], ammoYaw: 90,
      bench: [-800, 4780], benchYaw: -90, box: [800, 4780], chest: [0, 4500], chestYaw: -90, press: [-1000, 4250] },
    keep: [[BR.floor[0], BR.floor[1], 900]],
    beds,
  };
}
