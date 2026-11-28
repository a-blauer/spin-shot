// Old Oak Woods, in the Wildwood: the old wood north of the Vale where the foresters work. The forest road comes in
// under the timber arch in the south, past the forester's lodge (west) and the woodcutters' camp (east), over the
// footbridge across the brook, past the charcoal burners' clearing (west) and the old stone circle (east), by the
// great hollow oak, into the glade where a giant oak lies fallen; the way on is the road out of the glade's north end,
// where the stations come up on an old flagstone floor. The Blight came up under the fallen giant: its heart heaves
// out of the root plate, pale threads run across the glade, and it has taken the stone circle too.
//
// Local frame (dest.js): +Y north, +X east, z up; the ground is flat at z = 0. Playable: x in [-5600, 5600],
// y in [-6000, 6000]. The brook is shallow: anything can wade it anywhere (stones at the two fords, the bridge for
// the road); only the bridge's rails stop you.
import { V, R } from './mapkit.js';
import { shape } from './propkit.js';
import { destKit } from './dest_kit.js';
import { hedgeLump, farTree, blightMass, raisedBed, railFence, wheelbarrow } from './dest_props.js';
import { oak, oakTrunk, greatOak, greatTrunk, fallenOak, stump, logPile, fern, logCabin, CB, woodshed, sawTrestle, tent, campfire, logSeat, charcoalMound, leanTo, standingStone, altarStone, footbridge, FB, waymarker, hide, HD, woodArch, flagFloor, rainBarrel, WC } from './dest_props_wood.js';
import { rock, toadstoolCluster, grassTuft, hill, lanternPost, mix } from './village_shapes.js';
import { choppingBlock, cart, crate, sack, reeds, flowerClump, washLine } from './village_props.js';

export const OW = {
  lodge: [-2600, -3600], camp: [2800, -3500], char: [-3600, 900], circle: [3300, 1500], great: [-1300, 2300],
  glade: [0, 3900], hide: [4100, 4300], floor: [0, 5000], floorR: 950,
};
const ROAD_S = [[0, -6100], [-80, -5000], [120, -4000], [300, -3000], [220, -2100], [0, -1610]];
const ROAD_M = [[0, -790], [-260, -300], [-480, 500], [-380, 1400], [-80, 2250], [60, 2900]];
const ROAD_N = [[0, 5900], [0, 6100]];
export const ROADS = [ROAD_S, ROAD_M, [[60, 2900], [0, 3700], [0, 5900]]];
const STREAM = [[-6100, -700], [-4600, -1000], [-3300, -820], [-2200, -1300], [-1000, -1100], [0, -1200], [1100, -1500], [2300, -1260], [3500, -1650], [4600, -1400], [6100, -1700]];
const SW = 300;   // the brook's width
// where it can be crossed: [x centre, half width along x]
const BRIDGE = { x: 0, y: -1200, yaw: 90, L: 780, W: 240 };
const FORDS = [[-3150, 230], [2950, 230]];
// the brook's middle at x (a polyline in x)
const streamY = (x) => { for (let i = 1; i < STREAM.length; i++) { const [x0, y0] = STREAM[i - 1], [x1, y1] = STREAM[i]; if (x <= x1) return y0 + (y1 - y0) * ((x - x0) / (x1 - x0)); } return STREAM[STREAM.length - 1][1]; };

export function buildOakwoods(M, O) {
  const { hx, hy } = O;
  const K = destKit(M, 23, O, { exactNav: true }), { S, body, round, trunk, patch, blot, path, rnd, rr, Box, lineDist } = K;
  const pick = (L) => L[Math.floor(rnd() * L.length)];
  const SOL = (x, y, w, d, h, yaw = 0, nav = true) => body(x, y, w, d, h, yaw, 0, nav);
  // a pitched roof's body: a slab from the eave (x0, z0) up to the ridge (x1, z1), y0..y1 along the ridge (a frame at
  // hx0, hy0, turned by yaw)
  const roofSolid = (hx0, hy0, x0, z0, x1, z1, y0, y1) => { const L = Math.hypot(x1 - x0, z1 - z0), a = (Math.atan2(z1 - z0, Math.abs(x1 - x0)) * 180) / Math.PI * (x1 < x0 ? -1 : 1); M.SolidRot(V(hx0 + (x0 + x1) / 2, hy0 + (y0 + y1) / 2, (z0 + z1) / 2 - 12), V(L, y1 - y0, 24), R(-a, 0, 0)); };
  const offs = (x, y, yaw, lx, ly) => { const c = Math.cos((yaw * Math.PI) / 180), s = Math.sin((yaw * Math.PI) / 180); return [x + lx * c - ly * s, y + lx * s + ly * c]; };

  // ---- the ground: moss and leaf litter under the trees, grass in the glades, bare earth where people work
  Box(V(0, 0, -60), V(hx * 2 + 24000, hy * 2 + 24000, 120), 0x48662e, true, false);
  for (const [x, y, d, c] of [[-3600, -4600, 2600, 0x56703a], [3800, -1400, 2400, 0x4e6a32], [-4200, 3200, 2600, 0x52703a], [1800, 600, 2000, 0x5a7438], [3600, 4600, 2200, 0x4e6c30], [-1400, -2600, 1800, 0x5a5a36], [4200, -4800, 1800, 0x5e5a38]]) patch(x, y, d, c);
  for (const [x, y, d, c] of [[0, 3900, 3600, 0x56783a], [0, 3900, 3000, 0x5e8038], [-200, 4100, 2300, 0x648a3c], [0, 4950, 2100, 0x5e8038], [OW.circle[0], OW.circle[1], 1800, 0x547636], [OW.circle[0], OW.circle[1], 1400, 0x5a7c38], [0, -5300, 1700, 0x527238]]) patch(x, y, d, c);
  for (const [x, y, d, c] of [[OW.camp[0], OW.camp[1], 2200, 0x566038], [OW.camp[0] + 100, OW.camp[1], 1700, 0x5e5838], [OW.camp[0] + 150, OW.camp[1] - 50, 1200, 0x665a3c], [OW.char[0], OW.char[1], 1800, 0x4e5432], [OW.char[0] + 50, OW.char[1], 1400, 0x4a4434], [OW.lodge[0] + 300, OW.lodge[1], 1800, 0x56603a], [OW.lodge[0] + 350, OW.lodge[1], 1300, 0x62583c]]) patch(x, y, d, c);
  for (let i = 0; i < 40; i++) { const x = rr(-hx + 300, hx - 300), y = rr(-hy + 300, hy - 300); if (Math.hypot((x - OW.glade[0]) / 1900, (y - OW.glade[1]) / 1500) < 1) continue; patch(x, y, rr(380, 760), pick([0x52603a, 0x58583a, 0x4e5a34])); }
  path(ROAD_S, 340, 0x7a6448); path(ROAD_M, 340, 0x7a6448); path(ROAD_N, 360, 0x7a6448); path([[60, 2900], [30, 3400]], 300, 0x7a6448);

  // ---- the brook: a ribbon of shallow water on its muddy bed, banks of stones, reeds and ferns; open everywhere
  { const pts = []; for (let x = -6100; x <= 6100; x += 60) pts.push([x, streamY(x) + Math.sin(x * 0.004) * 40]);
    const at = (x) => pts[Math.max(0, Math.min(pts.length - 1, Math.round((x + 6100) / 60)))];
    const ribbon = (key, w, z, col) => M.Shape(key, () => { const pos = [], cl = [], idx = []; const C = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
      for (let i = 0; i < pts.length; i++) { const [x, y] = pts[i], [xa, ya] = pts[Math.max(0, i - 1)], [xb, yb] = pts[Math.min(pts.length - 1, i + 1)], L = Math.hypot(xb - xa, yb - ya), nx = -(yb - ya) / L, ny = (xb - xa) / L, hw = w / 2 * (1 + 0.08 * Math.sin(i * 0.7)); for (let j = 0; j <= 4; j++) { const e = (j / 4 - 0.5) * 2 * hw; pos.push(x + nx * e, y + ny * e, z); cl.push(...C(col(i, j))); } }
      for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < 4; j++) { const a = i * 5 + j, b = a + 1, c = a + 5, d = c + 1; idx.push(a, c, b, b, c, d); }
      return { pos, col: cl, idx }; }, V(0, 0, 0), R(0, 0, 0));
    ribbon('dbrookbed|oak', SW + 150, 0.9, (i, j) => (j === 0 || j === 4 ? 0x5a5a3a : 0x4a3e2e));
    ribbon('dbrook|oak', SW, 1.6, (i, j) => { const ford = FORDS.some(([fx, fw]) => Math.abs(pts[i][0] - fx) < fw); return ford ? (j % 2 ? 0x6a948a : 0x5a8480) : j === 2 ? 0x3e6664 : Math.sin(i * 0.9 + j) > 0.6 ? 0x5a8480 : 0x4a7470; });
    // where the bridge runs: along its length (u) and across it (n), from its middle
    const bu = [Math.cos((BRIDGE.yaw * Math.PI) / 180), Math.sin((BRIDGE.yaw * Math.PI) / 180)], bn = [-bu[1], bu[0]];
    const along = (x, y) => (x - BRIDGE.x) * bu[0] + (y - BRIDGE.y) * bu[1], across = (x, y) => (x - BRIDGE.x) * bn[0] + (y - BRIDGE.y) * bn[1];
    // the walking grid along the bridge's rails, both sides, its whole length: shut, so the horde is led round the rails'
    // ends onto the deck and never along a rail's outside
    for (let gx = -450; gx <= 450; gx += 100) for (let gy = -1750; gy <= -650; gy += 100) { const a = Math.abs(along(gx, gy)), c = Math.abs(across(gx, gy)); if (a < BRIDGE.L / 2 - 10 && c >= 78 && c < 190) O.GM.NavBlockBox({ min: V(gx - 50, gy - 50, 0), max: V(gx + 50, gy + 50, 100) }, 1); }   // no longer than the water is wide: nothing sticks out onto the banks
    // the banks: stones bedded along both edges, reeds in clumps, ferns behind
    for (let i = 0; i < pts.length; i += 2) { const [x, y] = pts[i]; if (Math.abs(x) > hx - 100 || Math.abs(x - BRIDGE.x) < 260) continue; for (const s of [-1, 1]) { const e = s * (SW / 2 + rr(10, 50)); if (rnd() < 0.45) S(rock(pick([22, 30]), pick([1, 2, 3]), true), x + rr(-20, 20), y + e, -4, rr(0, 360)); } }
    for (let x = -hx + 400; x < hx - 300; x += rr(380, 700)) { if (Math.abs(x - BRIDGE.x) < 400 || FORDS.some(([fx, fw]) => Math.abs(x - fx) < fw + 150)) continue; const s = rnd() < 0.5 ? -1 : 1, [px, py] = at(x); S(reeds(pick([120, 150]), pick([1, 2, 3])), px, py + s * (SW / 2 - 10), 0, rr(0, 360)); }
    // the fords: flat stones across, the water running light over them
    for (const [fx, fw] of FORDS) for (let k = 0; k < 9; k++) { const x = fx + rr(-fw * 0.7, fw * 0.7), y = at(x)[1] + rr(-SW * 0.4, SW * 0.4); S(rock(pick([26, 34]), pick([1, 2]), false), x, y, -14, rr(0, 360)); }
    // the footbridge: its deck is walked on (no grid block), its rails stop you
    { const { x, y, yaw, L, W } = BRIDGE; S(footbridge(L, W), x, y, 0, yaw); body(x, y, L, W, FB.deck, yaw, 0, false); for (const s of [-1, 1]) { const [rx, ry] = offs(x, y, yaw, 0, s * (W / 2 - 4)); body(rx, ry, L - 40, 16, FB.deck + 100, yaw, 0, false); } }
  }

  // ---- the way in: the timber arch over the road with the wood's name on it, boulders either side, the waymarker
  { const y = -5650; S(woodArch(600), 0, y, 0, 90); for (const s of [-1, 1]) round(s * 300, y, 22, 450);
    M.Sign(V(0, y - 10, 348), -90, 'OLD OAK WOODS', { r: 0.95, g: 0.9, b: 0.76 }, 34); M.Sign(V(0, y + 10, 348), 90, 'OLD OAK WOODS', { r: 0.95, g: 0.9, b: 0.76 }, 34);
    for (const [x, yy, r] of [[-620, -5700, 170], [-820, -5450, 120], [640, -5760, 150], [860, -5520, 110], [-560, -5980, 130], [580, -5990, 140]]) { S(rock(r, Math.round(Math.abs(x)) % 3 + 1, true), x, yy, 0, rr(0, 360)); round(x, yy, r * 0.92, r * 0.9); }
    S(waymarker(), 420, -5200, 0, 180); round(420, -5200, 26, 170); }

  // ---- the forester's lodge, west of the road, its porch on the road side: whole and solid, roof and chimney included
  { const [x, y] = OW.lodge, { W, L, eave, ridge, over, porch, porchZ, porchEave } = CB, hw = W / 2, hl = L / 2;
    S(logCabin(1), x, y, 0, 0);
    SOL(x, y, W + 34, L + 52, eave + 10);
    for (const sx of [-1, 1]) roofSolid(x, y, sx * (hw + over), eave - over * ((ridge - eave) / hw), 0, ridge, -hl - over, hl + over);
    SOL(x, y + CB.chimY, 160, 110, ridge + 160);
    body(x + hw + porch / 2 + 4, y, porch, L + 40, porchZ, 0, 0, false);
    for (const yy of [-hl + 10, -hl / 3, hl / 3, hl - 10]) round(x + hw + porch - 16, y + yy, 13, porchEave + 10, 0, false);
    M.SolidRot(V(x + hw + porch / 2 + 20, y, (porchEave + eave - 30) / 2 + 14), V(porch + 70, L + 80, 18), R(-((Math.atan2(eave - 30 - porchEave, porch + 30) * 180) / Math.PI), 0, 0));
    K.lit(x + hw + 20, y + 120, 236, { r: 1, g: 0.78, b: 0.45 }, 800);
    // round it: the woodshed, the chopping block and the axe, a barrel under the eave, the washing line, the herb beds
    S(woodshed(560), x - 120, y - 1050, 0, 0); SOL(x - 120, y - 1050, 250, 580, 290);
    S(stump(44, 46, 2, true), x + 420, y - 900, 0, 30); round(x + 420, y - 900, 50, 50);
    S(choppingBlock(), x + 600, y - 640, 0, 0); round(x + 600, y - 640, 40, 60);
    S(rainBarrel(1), x + hw + 30, y - hl - 30, 0, 0); round(x + hw + 30, y - hl - 30, 38, 90);
    S(washLine(700, 3), x - 120, y + 1000, 0, 0); for (const s of [-1, 1]) round(x - 120 + s * 350, y + 1000, 14, 220, 0, false);
    const gx = x - 1250; for (const [i, by] of [-260, 0, 260].entries()) { S(raisedBed(420, 140), gx, y + by, 0, 0); SOL(gx, y + by, 420, 140, 44);
      for (let k = 0; k < 5; k++) S(i === 1 ? flowerClump(26, 0xb88ae0, 0xffffff, 1 + (k % 2)) : grassTuft(pick([36, 44]), pick([1, 2, 3])), gx - 160 + k * 80, y + by + rr(-12, 12), 36, rr(0, 360)); }
    for (const [x0, y0, x1, y1] of [[gx - 300, y - 460, gx + 300, y - 460], [gx - 300, y + 460, gx + 300, y + 460], [gx - 300, y - 460, gx - 300, y + 460]]) { const Lf = Math.hypot(x1 - x0, y1 - y0), along = Math.abs(x1 - x0) > 1; S(railFence(Lf, 96, Math.round(x0 + y0)), (x0 + x1) / 2, (y0 + y1) / 2, 0, along ? 0 : 90); body((x0 + x1) / 2, (y0 + y1) / 2, along ? Lf : 20, along ? 20 : Lf, 108); }
    path([[x + hw + porch + 40, y - 60], [x + 1300, y - 160], [ROAD_S[2][0] - 40, ROAD_S[2][1] + 260]], 200, 0x7e6a4c); }

  // ---- the woodcutters' camp, east of the road: log piles, the saw trestle, stumps, the tent, the fire and its seats
  { const [x, y] = OW.camp;
    for (const [dx, dy, n, len, yw] of [[700, -650, 4, 380, 90], [950, 250, 4, 360, 0], [-650, -800, 3, 340, 20]]) { S(logPile(n, len, 30, Math.round(dx)), x + dx, y + dy, 0, yw); SOL(x + dx, y + dy, n * 61 + 24, len + 40, 30 + (n - 1) * 52 + 32, yw); }
    S(sawTrestle(), x - 100, y + 400, 0, 0); SOL(x - 100, y + 400, 120, 560, 170);
    for (const [dx, dy, r, axe] of [[-500, 700, 40, true], [400, 900, 46, true], [-900, -100, 52, false], [600, -1100, 44, false], [-200, -1200, 38, false], [1300, -300, 48, false]]) { S(stump(r, 46 + (r % 3) * 6, Math.round(dx), axe), x + dx, y + dy, 0, rr(0, 360)); round(x + dx, y + dy, r * 1.08, 56 + (r % 3) * 6); }
    S(tent(330, 280, 230), x + 700, y + 800, 0, 180); SOL(x + 700, y + 800, 370, 300, 240);
    { const fx = x + 100, fy = y - 200; S(campfire(), fx, fy, 0, 0); round(fx, fy, 92, 180); K.lit(fx, fy, 40, { r: 1, g: 0.55, b: 0.25 }, 700, 0xff8a3a);
      for (const a of [0.6, 2.4, 4.3]) { const sx = fx + Math.cos(a) * 240, sy = fy + Math.sin(a) * 240, yw = (a * 180) / Math.PI + 90; S(logSeat(200), sx, sy, 0, yw + 90); SOL(sx, sy, 40, 210, 50, yw + 90); } }
    S(cart(2, 3), x - 1100, y - 300, 0, 75); SOL(x - 1100, y - 300, 240, 140, 150, 75);
    for (const [dx, dy, w] of [[1200, 500, 70], [1280, 590, 60]]) { S(crate(w, Math.round(dx + dy)), x + dx, y + dy, 0, rr(-10, 10)); } SOL(x + 1240, y + 545, 160, 160, 80);
    for (const [dx, dy] of [[1150, 700], [1230, 760]]) S(sack(24, 0xc8b48a), x + dx, y + dy, -4, rr(0, 360)); SOL(x + 1190, y + 730, 130, 110, 50);
    S(lanternPost(300, 2), x + 400, y + 200, 0, 180); round(x + 400, y + 200, 12, 300, 0, false); K.lit(x + 400 - 62, y + 200, 242, { r: 1, g: 0.76, b: 0.42 }, 800);
    for (const [dx, dy] of [[-100, 400], [700, -650], [-650, -800]]) patch(x + dx, y + dy, 380, 0xa88c5e);
    path([[ROAD_S[3][0] + 40, ROAD_S[3][1] - 100], [1300, -3250], [x - 300, y - 100]], 220, 0x7e6a4c); }

  // ---- the charcoal burners' clearing, west of the road past the brook: two mounds, their lean-to, sacks and cordwood
  { const [x, y] = OW.char;
    for (const [dx, dy, r] of [[-350, 300, 320], [450, -350, 260]]) { S(charcoalMound(r, Math.round(r / 20)), x + dx, y + dy, 0, rr(0, 360)); round(x + dx, y + dy, r * 0.86, r * 0.5); }
    patch(x + 50, y, 1000, 0x3a3430);
    for (const [dx, dy, r] of [[-350, 300, 320], [450, -350, 260]]) K.lit(x + dx, y + dy, r * 0.62 + 6, { r: 1, g: 0.42, b: 0.18 }, 360, 0xff7a3a);
    S(leanTo(380), x - 800, y - 500, 0, 40); { const [cx2, cy2] = offs(x - 800, y - 500, 40, -70, 0); SOL(cx2, cy2, 280, 420, 230, 40); }
    for (const [dx, dy, yw] of [[700, 500, 10], [900, 260, 100]]) { S(logPile(3, 300, 22, Math.round(dx)), x + dx, y + dy, 0, yw); SOL(x + dx, y + dy, 3 * 45 + 24, 340, 22 * 2 + 2 * 38 + 20, yw); }
    for (const [dx, dy] of [[-200, -650], [-120, -700], [-160, -600]]) S(sack(26, 0x2e2a26), x + dx, y + dy, -4, rr(0, 360)); SOL(x - 160, y - 650, 170, 150, 56);
    S(wheelbarrow(1), x + 300, y - 800, 0, 30); SOL(x + 300, y - 800, 170, 80, 70, 30);
    path([[-470, 500], [-1600, 650], [x + 700, y - 100]], 220, 0x7e6a4c); }

  // ---- the stone circle, east of the road past the brook: nine stones (two long fallen), the altar in the middle; the
  // Blight has come up in its north side
  { const [x, y] = OW.circle, Rr = 650;
    for (let i = 0; i < 9; i++) { if (i === 3 || i === 7) continue; const a = (i / 9) * Math.PI * 2 + 0.2, sx = x + Math.cos(a) * Rr, sy = y + Math.sin(a) * Rr, h = [300, 340, 280, 0, 360, 300, 320, 0, 260][i], yw = (a * 180) / Math.PI; S(standingStone(h, i + 1), sx, sy, 0, yw); body(sx, sy, h * 0.3 * 2 * 0.86, h * 0.17 * 2 * 0.9, h, yw); }
    for (const i of [3, 7]) { const a = (i / 9) * Math.PI * 2 + 0.2, sx = x + Math.cos(a) * (Rr + 60), sy = y + Math.sin(a) * (Rr + 60); S(rock(90, i, true), sx, sy, 0, rr(0, 360)); round(sx, sy, 84, 70); }
    S(altarStone(), x, y, 0, 20); SOL(x, y, 160, 320, 100, 20);
    path([[-380, 1400], [900, 1450], [x - Rr - 100, y - 50]], 200, 0x7e6a4c); }

  // ---- the great oak, by the road: older than anything; its hollow faces the road
  { const [x, y] = OW.great, h = 2800; S(greatOak(h), x, y, 0, 0); round(x, y, greatTrunk(h), h * 0.42); round(x, y, greatTrunk(h) * 1.5, 70, 0, false);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, d = 780 + rr(-40, 40), tx = x + Math.cos(a) * d, ty = y + Math.sin(a) * d; if (lineDist(tx, ty, ROAD_M) < 260) continue; const s = pick([0.7, 0.9]); S(toadstoolCluster(s, 0x8a5a3a, pick([1, 2, 3])), tx, ty, 0, rr(0, 360)); round(tx, ty, 22 * s, 40 * s, 0, false); } }

  // ---- the glade: open grass, wildflowers, two boulders; the fallen giant along its west side, its root plate south
  const blightAt = [];
  { const fx = -1950, fy = 4300, L = 2800, tr = 150; S(fallenOak(L, tr, 2), fx, fy, 0, 90);
    body(fx, fy + 100, tr * 2.1, L - 200, tr * 1.75, 0);
    const pr = tr * 3.2; body(fx, fy - L / 2 - 30, pr * 2 + 40, tr * 1.3, pr * 1.68);
    for (const [x, y, r] of [[1300, 3300, 150], [1500, 4600, 120], [-700, 5100, 110]]) { S(rock(r, Math.round(x) % 3 + 1, true), x, y, 0, rr(0, 360)); trunk(x, y, r * 0.92, r * 0.9); }
    for (let i = 0; i < 16; i++) { const a = rr(0, Math.PI * 2), d = Math.sqrt(rnd()) * 1, x = Math.cos(a) * d * 1700, y = OW.glade[1] + Math.sin(a) * d * 1300; if (x < -1500) continue; S(flowerClump(pick([30, 40]), pick([0x6a7ae8, 0xe8e0f8, 0xf2d04a]), 0xffffff, pick([1, 2])), x, y, 0, rr(0, 360)); }
    // the Blight's heart, heaving out from under the root plate
    const hx0 = fx + 280, hy0 = fy - L / 2 - 220; S(blightMass(460, 3, 'mire'), hx0, hy0, 0, 30); round(hx0, hy0, 460 * 0.62, 460 * 0.55); blightAt.push([hx0, hy0, 460]);
    K.lit(hx0 + 120, hy0 + 60, 120, { r: 0.45, g: 1, b: 0.82 }, 900, 0x6effd2); }
  // and at the stone circle, and over a log pile at the camp
  for (const [x, y, r, sd] of [[OW.circle[0] + 80, OW.circle[1] + 900, 330, 1], [OW.camp[0] - 300, OW.camp[1] - 1150, 220, 4]]) { S(blightMass(r, sd, 'mire'), x, y, 0, rr(0, 360)); round(x, y, r * 0.62, r * 0.55); blightAt.push([x, y, r]); K.lit(x, y, 90, { r: 0.45, g: 1, b: 0.82 }, 700, 0x6effd2); }
  // pale threads across the ground from the heart, the mire's caps along them
  { const [hx0, hy0] = blightAt[0], veins = [];
    for (const [ex, ey] of [[600, 3300], [900, 4500], [-300, 5000], [-200, 2500], [-1200, 1900], [-2900, 2500]]) { const pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push([hx0 + (ex - hx0) * t + Math.sin(t * 7 + ex) * 120 * t, hy0 + (ey - hy0) * t + Math.cos(t * 5 + ey) * 120 * t]); } veins.push(pts); }
    M.Shape('dveins|oak', () => { const pos = [], col = [], idx = []; for (const pts of veins) { const n = pts.length; for (let j = 0; j < n - 1; j++) { const [x0, y0] = pts[j], [x1, y1] = pts[j + 1], L = Math.hypot(x1 - x0, y1 - y0), m = Math.max(2, Math.round(L / 40)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
      for (let i = 0; i <= m; i++) { const t = i / m, wv = Math.sin((x0 + i * 40) * 0.011 + j) * 46 + Math.sin((y0 + i * 40) * 0.023) * 18, x = x0 + (x1 - x0) * t + nx * wv, y = y0 + (y1 - y0) * t + ny * wv, w = 9 * (1 - (j + t) / n * 0.7); for (const e of [-1, 1]) { pos.push(x + nx * w * e, y + ny * w * e, 3.6); col.push(0.5, 0.62, 0.52); } }
      const b = pos.length / 3 - (m + 1) * 2; for (let i = 0; i < m; i++) { const a = b + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } } } return { pos, col, idx }; }, V(0, 0, 0), R(0, 0, 0));
    for (const pts of veins) for (let j = 2; j < pts.length; j += 2) { const [x, y] = pts[j]; if (blightAt.some(([bx, by, br]) => Math.hypot(x - bx, y - by) < br + 120) || lineDist(x, y, ROAD_M) < 220) continue; const s = pick([0.7, 0.9, 1.1]), sd = pick([1, 2, 3]), tx = x + rr(-60, 60), ty = y + rr(-60, 60); S(toadstoolCluster(s, 0x3e6c4c, sd), tx, ty, 0, rr(0, 360)); round(tx, ty, 22 * s, 40 * s, 0, false); } }

  // ---- the way on: the flagstone floor at the glade's north end where the stations come up, the road out between two
  // old oaks, the waymarker pointing on
  { const [x, y] = OW.floor; S(flagFloor(OW.floorR, 1), x, y, 0.4, 0);
    S(waymarker(), 520, 5650, 0, 180); round(520, 5650, 26, 170);
    for (const [ox, h, sd] of [[-560, 2200, 1], [560, 2000, 2]]) { S(oak(h, sd), ox, 5850, 0, rr(0, 360)); trunk(ox, 5850, oakTrunk(h), h * 0.45); } }

  // ---- the hunter's hide in the north-east, looking out over the glade: its poles and deck are solid
  { const [x, y] = OW.hide; S(hide(), x, y, 0, 180); for (const [dx, dy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) round(x + dx * HD.w / 2, y + dy * HD.w / 2, 12, HD.deck + 120, 0, false); body(x, y, HD.w + 20, HD.w + 20, 22, 0, HD.deck - 18, false); }

  // ---- the east bank: a ridge of great mossy boulders, broken by trees
  for (const [y, r] of [[-3400, 300], [-2700, 240], [-600, 340], [200, 260], [900, 300], [2000, 280], [2700, 220], [-4300, 260]]) { const x = hx - 260 + rr(-60, 60); S(rock(r, Math.round(y) % 3 + 1, true), x, y, 0, rr(0, 360)); trunk(x, y, r * 0.92, r * 0.9); }

  // ---- the oaks: everywhere the paths, the brook and the clearings are not; thickest round the edge
  const clear = [[0, -5300, 1000, 900], [OW.lodge[0] - 300, OW.lodge[1], 1700, 1500], [OW.camp[0] + 200, OW.camp[1] + 100, 1700, 1500], [OW.char[0], OW.char[1], 1400, 1200], [OW.circle[0], OW.circle[1] + 200, 1200, 1300], [OW.great[0], OW.great[1], 850, 850], [0, 3900, 2100, 1600], [0, 5000, 1300, 1100], [OW.hide[0], OW.hide[1], 600, 600], [FORDS[0][0], streamY(FORDS[0][0]), 600, 500], [FORDS[1][0], streamY(FORDS[1][0]), 600, 500], [-1950, 4300, 500, 1700]];
  const free = (x, y, m) => !clear.some(([cx, cy, ax, ay]) => Math.hypot((x - cx) / (ax + m), (y - cy) / (ay + m)) < 1) && ROADS.every((P) => lineDist(x, y, P) > 330 + m) && Math.abs(y - streamY(x)) > SW / 2 + 120 + m;
  const plants = [];
  for (let gx = -hx + 260; gx < hx - 200; gx += 600) for (let gy = -hy + 260; gy < hy - 200; gy += 600) {
    const x = gx + rr(-170, 170), y = gy + rr(-170, 170), edge = Math.min(hx - Math.abs(x), hy - Math.abs(y)) < 900, h = pick([1500, 1800, 2100]), sd = pick([1, 2, 3]), rot = rr(0, 360);
    if (!edge && rnd() > 0.8) continue; if (!free(x, y, 80) || Math.abs(x) > hx - 150 || Math.abs(y) > hy - 150) continue;
    if (blightAt.some(([bx, by, br]) => Math.hypot(x - bx, y - by) < br + 300)) continue;
    plants.push({ x, y, half: oakTrunk(h), circle: true, place: () => { S(oak(h, sd), x, y, 0, rot); trunk(x, y, oakTrunk(h), h * 0.45); } });
  }
  // undergrowth: holly and hazel by some of the trees and thick along the edge, every bush solid
  const LEAF = [0x2e5426, 0x365e2a, 0x2a4c22];
  for (const { x, y } of plants.slice()) { const edge = Math.min(hx - Math.abs(x), hy - Math.abs(y)) < 900; if (!edge && rnd() > 0.35) continue; const a = rr(0, Math.PI * 2), d = rr(330, 420), bx = x + Math.cos(a) * d, by = y + Math.sin(a) * d, r = pick([140, 180]), leaf = pick(LEAF), bloom = pick([0, 0, 0xe8e0d0]), sd2 = pick([1, 2]), rot2 = rr(0, 360);
    if (!free(bx, by, r) || Math.abs(bx) > hx - 100 || Math.abs(by) > hy - 100 || blightAt.some(([qx, qy, qr]) => Math.hypot(bx - qx, by - qy) < qr + r + 60)) continue;
    plants.push({ x: bx, y: by, half: r * 1.08, circle: true, place: () => { S(hedgeLump(r, leaf, bloom, sd2), bx, by, 0, rot2); trunk(bx, by, r * 1.08, r * 1.25); } }); }
  for (const p of K.plan(plants, [0, -5300])) p.place();
  // fallen branches and old stumps on the forest floor
  for (let i = 0; i < 14; i++) { const x = rr(-hx + 500, hx - 500), y = rr(-hy + 500, hy - 500); if (!free(x, y, 120) || !K.clear(x, y, 120)) continue; const r = pick([36, 48]); S(stump(r, pick([40, 60]), i, false), x, y, 0, rr(0, 360)); round(x, y, r * 1.08, 66, 0, false); }

  // ---- the forest floor: ferns everywhere under the trees, thicker by the brook; tufts and flowers in the glade
  { const nav = O.GM, [cx, cy] = [O.cx, O.cy], ok = (x, y) => { const [ix, iy] = nav.cellOf(cx + x, cy + y); return nav.navFree(ix, iy) && K.clear(x, y, 50); };
    let n = 0; for (let k = 0; k < 2400 && n < 520; k++) { const x = rr(-hx + 150, hx - 150), y = rr(-hy + 150, hy - 150); if (!free(x, y, -60) && Math.abs(y - streamY(x)) > SW / 2 + 400) continue; if (Math.abs(y - streamY(x)) < SW / 2 + 40 || !ok(x, y) || ROADS.some((P) => lineDist(x, y, P) < 220)) continue; if (Math.hypot(x / 2000, (y - 3900) / 1500) < 1 || Math.hypot((x - OW.floor[0]) / OW.floorR, (y - OW.floor[1]) / OW.floorR) < 1.1) continue; S(fern(pick([0.9, 1.2, 1.5]), pick([1, 2, 3])), x, y, 0, rr(0, 360)); n++; }
    let t = 0; for (let k = 0; k < 900 && t < 160; k++) { const a = rr(0, Math.PI * 2), d = Math.sqrt(rnd()), x = Math.cos(a) * d * 2000, y = 3900 + Math.sin(a) * d * 1500; if (!ok(x, y) || Math.hypot((x - OW.floor[0]) / OW.floorR, (y - OW.floor[1]) / OW.floorR) < 1.05) continue; S(grassTuft(pick([30, 38]), pick([1, 2, 3])), x, y, 0, rr(0, 360)); t++; } }

  // ---- beyond the edge (out of reach): the Wildwood going on every way, darker and deeper, hills behind
  for (let i = 0; i < 150; i++) { const side = i % 4, u = rr(-1, 1), d = rr(250, 3600), x = side < 2 ? (side ? 1 : -1) * (hx + d) : u * (hx + 3000), y = side < 2 ? u * (hy + 3000) : (side === 2 ? 1 : -1) * (hy + d); if (Math.abs(x) < 700 && Math.abs(y) > hy) { if (Math.abs(x) < 260) continue; }
    S(farTree(pick([1900, 2300, 2700]), i % 3 === 0 ? 1 : 0, pick([0x2a4e24, 0x30552a, 0x26462a]), pick([1, 2])), x, y, 0, rr(0, 360)); }
  path([[0, -6100], [0, -9000], [-200, -12000]], 340, 0x7a6448); path([[0, 6100], [80, 8600], [-160, 11000]], 340, 0x7a6448);
  for (const [x, y, rx, ry, h] of [[-13000, 0, 5000, 9000, 2600], [13500, 1500, 5500, 9000, 2800], [0, 14500, 9000, 4000, 3000], [-9000, -14000, 6000, 4000, 2200], [9000, -13500, 6000, 4000, 2400]]) S(hill(rx, ry, h, 0x3e6a2c), x, y, -40, 0);

  // where the Mirecap's pools come up: by the brook, in the camp, by the lodge, at the circle, in the glade
  // (each settled on the nearest open ground: a pool is never drawn under a stump, a seat or a tree)
  const settle = ([x, y]) => { for (let r = 0; r <= 1600; r += 100) { const n = Math.max(1, Math.round(r / 50)); for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (Math.abs(px) < hx - 500 && Math.abs(py) < hy - 500 && K.clear(px, py, 430) && Math.abs(py - streamY(px)) > SW / 2 + 420 && Math.hypot(px - OW.floor[0], py - OW.floor[1]) > OW.floorR + 400) return [Math.round(px), Math.round(py)]; } } return [x, y]; };
  const beds = [[-1500, -2300], [2300, -2700], [-2700, 1700], [2500, 2400], [-700, 3700], [900, 4300]].map(settle);
  return {
    spots: { spawn: [0, -5300], yaw: Math.PI, exit: [0, 5650], textYaw: -90, ammo: [650, -5300], ammoYaw: 90,
      bench: [-660, 5230], benchYaw: 0, box: [660, 5000], chest: [660, 5000], chestYaw: 180, press: [-660, 4730], pressYaw: 0 },
    keep: [[OW.floor[0], OW.floor[1], 900]],
    beds, bossAt: [200, 3800],
  };
}
