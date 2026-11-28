// Sporefall Wood, in The Rot: the old pine wood above the Root, where the Blight comes up thickest. The gnomes cut a
// firebreak across it and burned it to hold the Rot back; the Blight came back through the ashes as the Char, and its
// spores fall through the dead pines like snow. The forest road comes in at the south under the timber arch, past the
// quarantine barrier and the expedition's camp (east), the woodsman's cottage gone to the Char (west), the fire-watch
// tower (east), across the burnt break (the crews' pump and beaters west of the road, their felled logs east), past the
// still pond with its drowned pines (north-west) and the grove of great caps (north-east), by the great dead pine where
// the Char's heart heaves out of its hollow, to the way on: an old flagstone floor where the stations come up, the road
// out north between two waystones.
//
// Local frame (dest.js): +Y north, +X east, z up; the ground is flat at z = 0. Playable: x in [-5600, 5600],
// y in [-6000, 6000]. The pond is shallow: anything can wade it anywhere; only the drowned trunks stop you.
import * as THREE from 'three';
import { V, R } from './mapkit.js';
import { destKit } from './dest_kit.js';
import { blightMass, railFence, raisedBed, wheelbarrow } from './dest_props.js';
import { stump, logPile, logCabin, CB, woodshed, tent, campfire, logSeat, standingStone, waymarker, woodArch, flagFloor, rainBarrel } from './dest_props_wood.js';
import { rock, toadstoolCluster, lanternPost } from './village_shapes.js';
import { choppingBlock, cart, crate, sack, rowboat, trough } from './village_props.js';
import { RC, bareHill, deadPine, pineTrunk, greatPine, GREAT_TR, fallenPine, fallenPineBodies, burntSnag, snagR, giantCap, capStalk, puffballs, fireTower, FT, pumpCart, bucket, beaterRack, roadBarrier, warnBoard, bracken, deadReeds, jetty, JT, farPine } from './dest_props_rot.js';

export const SF = {
  camp: [1500, -4800], cottage: [-3000, -3300], tower: [3200, -2500], crew: [-1800, -350], logs: [2500, 1250],
  pond: [-3300, 2750], grove: [3300, 3100], heart: [900, 3450], floor: [0, 5000], floorR: 950,
};
export const ROAD = [[0, -6100], [0, -5000], [-250, -4000], [-150, -3000], [200, -2000], [300, -1000], [100, 0], [-200, 1000], [-500, 1900], [-350, 2800], [-550, 3600], [-300, 4300], [0, 4900], [0, 6100]];
// the firebreak: its south and north edges along x
const breakS = (x) => -1300 + 120 * Math.sin(x * 0.0011) + 60 * Math.sin(x * 0.0031 + 2);
const breakN = (x) => 700 + 140 * Math.sin(x * 0.0009 + 1) + 60 * Math.sin(x * 0.0027);
const inBreak = (x, y, m = 0) => y > breakS(x) - m && y < breakN(x) + m;
// the pond's shore: its radius out from its middle in each direction (rx, ry), wavering
const POND = { rx: 1150, ry: 820 };
const pondK = (a) => 1 + 0.12 * Math.sin(a * 3 + 1) + 0.07 * Math.sin(a * 5 + 2);
const inPond = (x, y, m = 0) => { const dx = x - SF.pond[0], dy = y - SF.pond[1], a = Math.atan2(dy / POND.ry, dx / POND.rx), k = pondK(a); return Math.hypot(dx / (POND.rx * k + m), dy / (POND.ry * k + m)) < 1; };

export function buildSporefall(M, O) {
  const { hx, hy } = O;
  const K = destKit(M, 41, O, { exactNav: true }), { S, body, round, trunk, lit, patch, path, rnd, rr, lineDist, Cyl } = K;
  const pick = (L) => L[Math.floor(rnd() * L.length)];
  const SOL = (x, y, w, d, h, yaw = 0, nav = true) => body(x, y, w, d, h, yaw, 0, nav);
  const roofSolid = (hx0, hy0, x0, z0, x1, z1, y0, y1) => { const L = Math.hypot(x1 - x0, z1 - z0), a = (Math.atan2(z1 - z0, Math.abs(x1 - x0)) * 180) / Math.PI * (x1 < x0 ? -1 : 1); M.SolidRot(V(hx0 + (x0 + x1) / 2, hy0 + (y0 + y1) / 2, (z0 + z1) / 2 - 12), V(L, y1 - y0, 24), R(-a, 0, 0)); };
  const offs = (x, y, yaw, lx, ly) => { const c = Math.cos((yaw * Math.PI) / 180), s = Math.sin((yaw * Math.PI) / 180); return [x + lx * c - ly * s, y + lx * s + ly * c]; };
  const EMBER = { r: 1, g: 0.42, b: 0.14 }, CHAR_GLOW = 0xff5a22;

  // ---- the ground: dark earth, rusty needle litter under the pines, grey spore dust settling thicker to the north
  Box0();
  function Box0() { K.Box(V(0, 0, -60), V(hx * 2 + 24000, hy * 2 + 24000, 120), 0x4a4238, true, false); }
  for (let i = 0; i < 46; i++) { const x = rr(-hx + 300, hx - 300), y = rr(-hy + 300, hy - 300); if (inBreak(x, y, 300) || inPond(x, y, 200)) continue; patch(x, y, rr(500, 1100), pick([0x5a4434, 0x624a36, 0x544030, 0x5e4a3a])); }
  for (let i = 0; i < 18; i++) { const x = rr(-hx + 400, hx - 400), y = rr(1000, hy - 400); if (inPond(x, y, 200)) continue; patch(x, y, rr(500, 1000), pick([0x625c54, 0x6a645a, 0x5e5850])); }

  // ---- the firebreak: a band of burnt ground right across the wood, black and ash-grey in drifts, its edges scorched
  // brown into the needles
  M.Shape('rbreak', () => { const pos = [], cl = [], idx = [], C = new THREE.Color(), nx = 122, ny = 14;
    const n2 = (x, y) => Math.sin(x * 0.0031 + y * 0.0017) + Math.sin(x * 0.0071 - y * 0.0053 + 1.7) * 0.7 + Math.sin(x * 0.019 + y * 0.013 + 0.4) * 0.35;
    for (let i = 0; i <= nx; i++) { const x = -6100 + (12200 * i) / nx, y0 = breakS(x) - 260, y1 = breakN(x) + 260;
      for (let j = 0; j <= ny; j++) { const v = j / ny, y = y0 + (y1 - y0) * v, e = Math.min(v, 1 - v) * (y1 - y0), n = n2(x, y), edge = e < 260 + n * 90;
        pos.push(x, y, 1.9); C.setHex(edge ? (e < 120 + n * 60 ? 0x4a4238 : n > 0.3 ? 0x3e3630 : 0x46392e) : n > 1.05 ? 0x5e5a54 : n > 0.62 ? 0x4a4642 : n < -0.9 ? 0x1c1a18 : n < -0.2 ? 0x24201e : 0x2e2a28, THREE.NoColorSpace); cl.push(C.r, C.g, C.b); } }
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const a = i * (ny + 1) + j, b = a + 1, c = a + ny + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    return { pos, col: cl, idx }; }, V(0, 0, 0), R(0, 0, 0));

  // ---- the road and the paths off it
  path(ROAD, 330, 0x6a5a48, 0x7a766e);
  const P_CAMP = [[0, -5000], [800, -4920], [SF.camp[0] - 300, SF.camp[1] - 40]];
  const P_COT = [[-250, -4000], [-1300, -3720], [SF.cottage[0] + CB.W / 2 + CB.porch + 60, SF.cottage[1] - 60]];
  const P_TOW = [[150, -2200], [1500, -2350], [SF.tower[0] - FT.s0 - 160, SF.tower[1]]];
  const P_CREW = [[300, -1000], [-900, -640], [SF.crew[0] + 350, SF.crew[1] - 120]];
  const P_POND = [[-500, 1900], [-1500, 2050], [SF.pond[0] + 600, SF.pond[1] - 900]];
  const P_GROVE = [[-200, 1000], [1300, 1700], [SF.grove[0] - 900, SF.grove[1] - 500]];
  const PATHS = [P_CAMP, P_COT, P_TOW, P_CREW, P_POND, P_GROVE];
  for (const P of PATHS) path(P, 210, 0x665646, 0x7a766e);

  // ---- the way in: the timber arch with the wood's name, the quarantine barrier raised, the warning board
  { const y = -5650; S(woodArch(600, 0x5e5a50), 0, y, 0, 90); for (const s of [-1, 1]) round(s * 300, y, 22, 450);
    M.Sign(V(0, y - 10, 348), -90, 'SPOREFALL WOOD', { r: 0.95, g: 0.9, b: 0.76 }, 30); M.Sign(V(0, y + 10, 348), 90, 'SPOREFALL WOOD', { r: 0.95, g: 0.9, b: 0.76 }, 30);
    S(roadBarrier(440), -230, -5500, 0, -90); round(-230, -5500, 26, 130); round(210, -5500, 10, 100);
    S(warnBoard(240), 520, -5420, 0, -90); for (const s of [-1, 1]) round(520 + s * 126, -5420, 8, 300); SOL(520, -5420, 252, 10, 120, 0, false);
    M.Sign(V(520, -5426, 196), -90, 'QUARANTINE', { r: 0.92, g: 0.86, b: 0.74 }, 30);
    for (const [x, yy, r] of [[-640, -5720, 150], [-860, -5470, 110], [660, -5780, 140], [880, -5560, 100]]) { S(rock(r, Math.round(Math.abs(x)) % 3 + 1, false), x, yy, 0, rr(0, 360)); round(x, yy, r * 0.92, r * 0.9); } }

  // ---- the expedition's camp, east of the road: two tents, the fire and its seats, the supply cart, crates and sacks
  { const [x, y] = SF.camp;
    S(tent(330, 280, 230), x - 420, y + 380, 0, 200); SOL(x - 420, y + 380, 370, 300, 240, 200);
    S(tent(300, 260, 220), x + 420, y + 460, 0, 160); SOL(x + 420, y + 460, 340, 280, 230, 160);
    { const fx = x - 20, fy = y - 60; S(campfire(), fx, fy, 0, 0); round(fx, fy, 92, 180); lit(fx, fy, 40, { r: 1, g: 0.55, b: 0.25 }, 700, 0xff8a3a);
      for (const a of [0.9, 2.6, 4.6]) { const sx = fx + Math.cos(a) * 240, sy = fy + Math.sin(a) * 240, yw = (a * 180) / Math.PI + 90; S(logSeat(200), sx, sy, 0, yw + 90); SOL(sx, sy, 40, 210, 50, yw + 90); } }
    S(cart(2, 1), x + 620, y - 380, 0, 30); SOL(x + 620, y - 380, 240, 140, 150, 30);
    for (const [dx, dy, w] of [[200, -520, 70], [280, -440, 60], [180, -420, 56]]) S(crate(w, Math.round(dx + dy + 999)), x + dx, y + dy, 0, rr(-10, 10)); SOL(x + 230, y - 470, 200, 200, 80);
    for (const [dx, dy] of [[360, -560], [420, -500]]) S(sack(24, 0xb8a47a), x + dx, y + dy, -4, rr(0, 360)); SOL(x + 390, y - 530, 130, 130, 50);
    S(lanternPost(300, 2), x - 400, y - 180, 0, 180); round(x - 400, y - 180, 12, 300, 0, false); lit(x - 400 - 62, y - 180, 242, { r: 1, g: 0.76, b: 0.42 }, 800);
    S(rainBarrel(2), x - 700, y + 80, 0, 0); round(x - 700, y + 80, 38, 90);
    patch(x, y, 1500, 0x5a4c3c); patch(x + 50, y - 40, 1000, 0x625240); }

  // ---- the woodsman's cottage, west of the road, gone to the Char: whole and solid, roof and chimney; the growth heaves
  // against its back corner, the Char's caps along its walls; the woodshed, the garden gone grey
  const blightAt = [];
  { const [x, y] = SF.cottage, { W, L, eave, ridge, over, porch, porchZ, porchEave } = CB, hw = W / 2, hl = L / 2;
    S(logCabin(2, 0x5e5a50, 0x7a766a), x, y, 0, 0);
    SOL(x, y, W + 34, L + 52, eave + 10);
    for (const sx of [-1, 1]) roofSolid(x, y, sx * (hw + over), eave - over * ((ridge - eave) / hw), 0, ridge, -hl - over, hl + over);
    SOL(x, y + CB.chimY, 160, 110, ridge + 160);
    body(x + hw + porch / 2 + 4, y, porch, L + 40, porchZ, 0, 0, false);
    for (const yy of [-hl + 10, -hl / 3, hl / 3, hl - 10]) round(x + hw + porch - 16, y + yy, 13, porchEave + 10, 0, false);
    M.SolidRot(V(x + hw + porch / 2 + 20, y, (porchEave + eave - 30) / 2 + 14), V(porch + 70, L + 80, 18), R(-((Math.atan2(eave - 30 - porchEave, porch + 30) * 180) / Math.PI), 0, 0));
    S(woodshed(560), x - 120, y - 1050, 0, 0); SOL(x - 120, y - 1050, 250, 580, 290);
    S(choppingBlock(), x + 600, y - 640, 0, 0); round(x + 600, y - 640, 40, 60);
    S(rainBarrel(1), x + hw + 30, y - hl - 30, 0, 0); round(x + hw + 30, y - hl - 30, 38, 90);
    S(wheelbarrow(1), x + 520, y + 760, 0, 120); SOL(x + 520, y + 760, 170, 80, 70, 120);
    // the garden, west: three beds of dead stalks in a rail fence
    const gx = x - 1250; for (const by of [-260, 0, 260]) { S(raisedBed(420, 140), gx, y + by, 0, 0); SOL(gx, y + by, 420, 140, 44);
      for (let k = 0; k < 5; k++) S(bracken(0.5, k + 1), gx - 160 + k * 80, y + by + rr(-12, 12), 36, rr(0, 360)); }
    for (const [x0, y0, x1, y1] of [[gx - 300, y - 460, gx + 300, y - 460], [gx - 300, y + 460, gx + 300, y + 460], [gx - 300, y - 460, gx - 300, y + 460]]) { const Lf = Math.hypot(x1 - x0, y1 - y0), along = Math.abs(x1 - x0) > 1; S(railFence(Lf, 96, Math.round(Math.abs(x0 + y0))), (x0 + x1) / 2, (y0 + y1) / 2, 0, along ? 0 : 90); body((x0 + x1) / 2, (y0 + y1) / 2, along ? Lf + 24 : 20, along ? 20 : Lf + 24, 118); }
    // the Char: a mass of it heaving up against the cottage's back corner, caps all along the north wall's foot
    const mx = x - hw - 200, my = y + hl + 180; S(blightMass(300, 2, 'char'), mx, my, 0, 40); round(mx, my, 300 * 0.62, 300 * 0.55); blightAt.push([mx, my, 300]); lit(mx + 60, my - 40, 90, EMBER, 600, CHAR_GLOW);
    for (let k = 0; k < 5; k++) { const tx = x - hw + 120 + k * 120, ty = y + hl + 50 + rr(0, 30); S(toadstoolCluster(pick([0.8, 1, 1.2]), RC.cap, k + 1), tx, ty, 0, rr(0, 360)); }
    S(puffballs(50, 1), x - 420, y - 1500, 0, 0); round(x - 420, y - 1500, 70, 60); }

  // ---- the fire-watch tower, east of the road on the break's south side, its ladder toward the road; the crew's beaters
  // racked at its foot
  { const [x, y] = SF.tower, yaw = 180; S(fireTower(), x, y, 0, yaw);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) { round(x + sx * FT.s0, y + sy * FT.s0, 28, 30); round(x + sx * (FT.s0 - 4), y + sy * (FT.s0 - 4), 14, FT.D); }
    { const [lx, ly] = offs(x, y, yaw, FT.s0 + 10, 0); SOL(lx, ly, 18, 60, 420, yaw); }
    S(beaterRack(), x - 420, y + 380, 0, 0); SOL(x - 420, y + 380, 90, 250, 200);
    S(rainBarrel(3), x + 300, y + 340, 0, 0); round(x + 300, y + 340, 38, 90);
    S(logSeat(200), x - 360, y - 380, 0, 90); SOL(x - 360, y - 380, 210, 40, 50);
    patch(x, y, 1100, 0x544636); }

  // ---- in the break, west of the road: the fire crews' station, the pump on its cart, beaters, buckets, the trough
  { const [x, y] = SF.crew;
    S(pumpCart(), x, y, 0, 160); { const [cx2, cy2] = offs(x, y, 160, 5, 0), [sx2, sy2] = offs(x, y, 160, 300, 0); SOL(cx2, cy2, 330, 170, 290, 160); SOL(sx2, sy2, 280, 100, 80, 160); }
    S(beaterRack(), x - 500, y - 300, 0, 90); SOL(x - 500, y - 300, 250, 90, 200);
    S(trough(220), x + 300, y - 420, 0, 0); SOL(x + 300, y - 420, 240, 90, 60);
    for (const [dx, dy, sd] of [[180, -300, 1], [420, -260, 2], [-160, -520, 1], [520, -560, 2], [60, -650, 1]]) { S(bucket(sd), x + dx, y + dy, 0, rr(0, 360)); round(x + dx, y + dy, 18, 50, 0, false); }
    for (const [dx, dy, yw] of [[-200, 380, 20], [260, 420, -30]]) { S(logSeat(200), x + dx, y + dy, 0, yw); SOL(x + dx, y + dy, 40, 210, 50, yw); }
    S(crate(66, 7), x - 620, y + 150, 0, 12); SOL(x - 620, y + 150, 100, 100, 70);
    Cyl(V(x, y - 100, 2.3), 1300, 1, 0x3e3a36, false, false, null); }

  // ---- north of the break, east of the road: the logs the crews felled to cut it, stacked to be carted off
  { const [x, y] = SF.logs;
    for (const [dx, dy, n, len, yw] of [[0, 0, 4, 420, 90], [520, 300, 4, 380, 80], [-480, 360, 3, 360, 100]]) { S(logPile(n, len, 32, Math.abs(Math.round(dx + 7))), x + dx, y + dy, 0, yw); SOL(x + dx, y + dy, n * 64 + 24, len + 40, 32 + (n - 1) * 55 + 34, yw); }
    for (const [dx, dy] of [[-200, -320], [320, -280], [760, -60]]) { S(stump(48, 50, Math.abs(Math.round(dx)), false), x + dx, y + dy, 0, rr(0, 360)); round(x + dx, y + dy, 52, 56); }
    patch(x, y, 1500, 0x5e4c3a); }

  // ---- the pond: still black water in a hollow of the wood, grey scum on it, drowned pines standing in it, dead reeds
  // round its shore, a jetty out from the south, a boat pulled up beside it. Shallow: wade it anywhere.
  { const [px, py] = SF.pond, nA = 64, nR = 7, ring = (k) => { const P = []; for (let i = 0; i < nA; i++) { const a = (i / nA) * Math.PI * 2, f = pondK(a); P.push([Math.cos(a) * POND.rx * f * k, Math.sin(a) * POND.ry * f * k]); } return P; };
    const disc = (key, kOut, z, col) => M.Shape(key, () => { const pos = [], cl = [], idx = [], C = new THREE.Color();
      pos.push(0, 0, z); C.setHex(col(0, 0, 0), THREE.NoColorSpace); cl.push(C.r, C.g, C.b);
      for (let r = 1; r <= nR; r++) { const P = ring((kOut * r) / nR); for (let i = 0; i < nA; i++) { const [x, y] = P[i]; pos.push(x, y, z); C.setHex(col(x, y, r), THREE.NoColorSpace); cl.push(C.r, C.g, C.b); } }
      for (let i = 0; i < nA; i++) idx.push(0, 1 + i, 1 + ((i + 1) % nA));
      for (let r = 1; r < nR; r++) for (let i = 0; i < nA; i++) { const a = 1 + (r - 1) * nA + i, b = 1 + (r - 1) * nA + ((i + 1) % nA), c = a + nA, d = b + nA; idx.push(a, c, b, b, c, d); }
      return { pos, col: cl, idx }; }, V(px, py, 0), R(0, 0, 0));
    disc('rpondbed', 1.08, 0.9, () => 0x2e2a24);
    disc('rpond', 1, 1.6, (x, y, r) => { const n = Math.sin(x * 0.006 + y * 0.004) + Math.sin(x * 0.011 - y * 0.009 + 1.3); return r === nR ? 0x3a3a32 : n > 1.25 ? 0x5a5c50 : n > 0.9 ? 0x44463e : r < 3 ? 0x1e2220 : 0x262a26; });
    // drowned pines, standing in it
    for (const [dx, dy, h, sd] of [[-500, 200, 1900, 2], [300, -150, 2100, 5], [650, 380, 1700, 0], [-150, -420, 2000, 1], [-800, -150, 1800, 4]]) { S(deadPine(h, sd, 0), px + dx, py + dy, 0, rr(0, 360)); trunk(px + dx, py + dy, pineTrunk(h), h * 0.4); }
    // the shore: stones bedded round it, dead reeds in clumps
    { const P = ring(1); for (let i = 0; i < nA; i += 2) { const [x, y] = P[i]; if (rnd() < 0.5) S(rock(pick([22, 30]), pick([1, 2, 3]), false), px + x * 1.02, py + y * 1.02, -4, rr(0, 360)); }
      for (let i = 1; i < nA; i += 3) { const [x, y] = P[i], a = Math.atan2(y, x); if (Math.abs(a + Math.PI / 2) < 0.3) continue; S(deadReeds(pick([110, 140]), i), px + x * (0.97 + rnd() * 0.06), py + y * (0.97 + rnd() * 0.06), 0, rr(0, 360)); } }
    // the jetty from the south shore, the boat beside it
    { const jx = px + 120, jy = py - POND.ry * pondK(-Math.PI / 2) - 160; S(jetty(440, 150), jx, jy, 0, 90); body(jx, jy + 220, 150, 440, JT.deck, 0, 0, false);
      for (const sy of [-1, 1]) { round(jx + sy * 81, jy + 430, 8, 70, 0, false); round(jx + sy * 81, jy + 220, 7, 34, 0, false); }
      S(rowboat(300, 0x5a4a3a, 2), jx - 300, jy + 20, 0, 80); SOL(jx - 300, jy + 20, 120, 300, 60, 0); } }

  // ---- the grove of great caps, north-east: the Char's caps grown as tall as the pines, puffballs at their feet
  const caps = [];
  { const [gx, gy] = SF.grove, R0 = 1350;
    for (let k = 0; k < 400 && caps.length < 13; k++) { const a = rr(0, Math.PI * 2), d = Math.sqrt(rnd()) * R0, x = gx + Math.cos(a) * d, y = gy + Math.sin(a) * d, w = q20(rr(260, 640)), h = Math.max(550, Math.round(w * rr(1.6, 2.2) / 50) * 50);
      if (Math.abs(x) > hx - w * 0.6 || Math.abs(y) > hy - w * 0.6) continue;
      const ok = caps.every((c) => { const D = Math.hypot(x - c.x, y - c.y); if (D < capStalk(c.w) * 1.8 + capStalk(w) * 1.8 + 120) return false;
        if (D < c.w + w + 40) { const [lo, hi] = h < c.h ? [{ h, w }, c] : [c, { h, w }]; if (lo.h + lo.w * 0.55 + 40 > hi.h) return false; if (D < lo.w + capStalk(hi.w) * 1.2) return false; } return true; });
      if (ok) caps.push({ x, y, w, h, sd: caps.length }); }
    for (const c of caps) { S(giantCap(c.h, c.w, c.sd), c.x, c.y, 0, rr(0, 360)); const sr = capStalk(c.w); round(c.x, c.y, sr * 1.75, sr * 1.4); trunk(c.x, c.y, sr * 1.15, c.h); }
    for (let k = 0; k < 9; k++) { const a = rr(0, Math.PI * 2), d = rr(200, R0), x = gx + Math.cos(a) * d, y = gy + Math.sin(a) * d; if (caps.some((c) => Math.hypot(x - c.x, y - c.y) < capStalk(c.w) * 1.8 + 160) || !K.clear(x, y, 90)) continue; const r = pick([40, 55, 70]); S(puffballs(r, k), x, y, 0, rr(0, 360)); round(x, y, r * 1.5, r * 1.2); }
    for (let k = 0; k < 6; k++) { const c = caps[k % caps.length]; if (!c) break; lit(c.x + rr(-c.w * 0.4, c.w * 0.4), c.y + rr(-c.w * 0.4, c.w * 0.4), c.h - 20, EMBER, 520, CHAR_GLOW); }
    patch(gx, gy, 2600, 0x5e5850); patch(gx + 100, gy - 80, 1800, 0x66605a); }
  function q20(v) { return Math.round(v / 20) * 20; }

  // ---- the heart: the great dead pine, its hollow toward the road, the Char heaving out of it; threads of it across
  // the ground every way, its caps along them
  { const [x, y] = SF.heart, yaw = 202; S(greatPine(3400), x, y, 0, yaw); trunk(x, y, GREAT_TR, 3400 * 0.45); round(x, y, GREAT_TR * 1.6, 90, 0, false);
    const [mx, my] = offs(x, y, yaw, GREAT_TR + 260, 0); S(blightMass(520, 3, 'char'), mx, my, 0, 30); round(mx, my, 520 * 0.62, 520 * 0.55); blightAt.push([mx, my, 520]);
    lit(mx + 80, my + 40, 140, EMBER, 1200, CHAR_GLOW); lit(x + 120, y - 60, 60, EMBER, 600, CHAR_GLOW);
    patch(x - 100, y - 80, 2400, 0x3a3434); patch(mx, my, 1400, 0x2e2a2c);
    const veins = [];
    for (const [ex, ey] of [[-200, 2200], [1900, 2200], [2300, 3600], [-300, 4300], [1600, 4600], [700, 1600]]) { const pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push([mx + (ex - mx) * t + Math.sin(t * 7 + ex) * 120 * t, my + (ey - my) * t + Math.cos(t * 5 + ey) * 120 * t]); } veins.push(pts); }
    M.Shape('rveins', () => { const pos = [], col = [], idx = []; for (const pts of veins) { const n = pts.length; for (let j = 0; j < n - 1; j++) { const [x0, y0] = pts[j], [x1, y1] = pts[j + 1], L = Math.hypot(x1 - x0, y1 - y0), m = Math.max(2, Math.round(L / 40)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
      for (let i = 0; i <= m; i++) { const t = i / m, wv = Math.sin((x0 + i * 40) * 0.011 + j) * 46 + Math.sin((y0 + i * 40) * 0.023) * 18, px = x0 + (x1 - x0) * t + nx * wv, py = y0 + (y1 - y0) * t + ny * wv, w = 10 * (1 - ((j + t) / n) * 0.7), hot = Math.sin(px * 0.05 + py * 0.03) > 0.92;
        for (const e of [-1, 1]) { pos.push(px + nx * w * e, py + ny * w * e, 2.45); if (hot) col.push(0.8, 0.32, 0.1); else col.push(0.13, 0.1, 0.1); } }
      const b = pos.length / 3 - (m + 1) * 2; for (let i = 0; i < m; i++) { const a = b + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } } } return { pos, col, idx }; }, V(0, 0, 0), R(0, 0, 0));
    for (const pts of veins) for (let j = 2; j < pts.length; j += 2) { const [vx, vy] = pts[j]; if (blightAt.some(([bx, by, br]) => Math.hypot(vx - bx, vy - by) < br + 120) || lineDist(vx, vy, ROAD) < 260) continue; const ts = pick([0.8, 1, 1.2]), tx = vx + rr(-60, 60), ty = vy + rr(-60, 60); S(toadstoolCluster(ts, RC.cap, pick([1, 2, 3])), tx, ty, 0, rr(0, 360)); round(tx, ty, 22 * ts, 40 * ts, 0, false); }
    for (const [dx, dy, r] of [[-500, 420, 55], [480, 520, 45], [420, -560, 60]]) { S(puffballs(r, Math.abs(dx) % 7), x + dx, y + dy, 0, rr(0, 360)); round(x + dx, y + dy, r * 1.5, r * 1.2); } }

  // ---- the way on: the flagstone floor at the north end where the stations come up, the road out between two old
  // waystones, the finger post
  { const [x, y] = SF.floor; S(flagFloor(SF.floorR, 3, 0x3e3a34, false, [0x7e7a72, 0x74706a, 0x8a857c, 0x6e6a64]), x, y, 0.4, 0);
    for (const [ox, h, sd] of [[-560, 320, 2], [560, 300, 5]]) { S(standingStone(h, sd), ox, 5800, 0, 90); body(ox, 5800, h * 0.3 * 2 * 0.86, h * 0.17 * 2 * 0.9, h, 90); }
    S(waymarker(), -520, 5600, 0, 0); round(-520, 5600, 26, 170); }

  // ---- in the break: what the fire left, black snags and stumps, embers still in some; burnt pines at its edges
  const snags = [];
  for (let k = 0; k < 900 && snags.length < 70; k++) { const x = rr(-hx + 200, hx - 200), y = rr(-1500, 900); if (!inBreak(x, y, -80)) continue;
    if (lineDist(x, y, ROAD) < 300 || PATHS.some((P) => lineDist(x, y, P) < 200) || Math.hypot(x - SF.crew[0], y - SF.crew[1]) < 900 || snags.some((s) => Math.hypot(x - s.x, y - s.y) < 330)) continue;
    snags.push({ x, y, h: rnd() < 0.45 ? pick([100, 120, 150]) : pick([250, 350, 450, 600]), sd: snags.length }); }

  // ---- the pines: everywhere the paths, the break and the clearings are not; thickest round the edge. Burnt at the
  // break's edges.
  const clear = [[0, -5300, 1000, 900], [SF.camp[0], SF.camp[1] + 100, 1300, 1000], [SF.cottage[0] - 500, SF.cottage[1] - 200, 1900, 1600], [SF.tower[0], SF.tower[1], 900, 900], [SF.logs[0], SF.logs[1] + 150, 1300, 800],
    [SF.grove[0], SF.grove[1], 1700, 1700], [SF.heart[0], SF.heart[1], 1300, 1200], [0, 5000, 1300, 1100], [SF.pond[0], SF.pond[1], POND.rx * 1.25 + 200, POND.ry * 1.25 + 200]];
  const fallen = [];
  const freeAt = (x, y, m) => !clear.some(([cx, cy, ax, ay]) => Math.hypot((x - cx) / (ax + m), (y - cy) / (ay + m)) < 1) && lineDist(x, y, ROAD) > 330 + m && PATHS.every((P) => lineDist(x, y, P) > 200 + m) && !fallen.some((f) => lineDist(x, y, f.seg) < f.half + m);
  // a few pines already down across the floor
  for (const [x, y, L, yw, sd] of [[-2200, -1900, 2200, 20, 1], [2000, -3600, 2000, 160, 2], [-4300, 600 + 1200, 2400, 75, 3], [4200, -800 + 1800, 2000, 110, 4], [-1600, 4300, 2200, 40, 5], [1700, -5200 + 200, 1800, 10, 6], [-4300, -4900, 2000, 130, 7], [4600, 5000, 1900, 85, 8]]) {
    const c = Math.cos((yw * Math.PI) / 180), s = Math.sin((yw * Math.PI) / 180), seg = [[x - (c * L) / 2 - c * 200, y - (s * L) / 2 - s * 200], [x + (c * L) / 2 + c * 120, y + (s * L) / 2 + s * 120]];
    if (!freeAt(x, y, 300) || inBreak(x, y, 300) || seg.some(([sx, sy]) => Math.abs(sx) > hx - 150 || Math.abs(sy) > hy - 150 || !freeAt(sx, sy, 200))) continue;
    S(fallenPine(L, 70, sd), x, y, 0, yw); fallenPineBodies(K, x, y, L, 70, yw); fallen.push({ seg, half: 190 }); }
  for (const s of snags) { S(burntSnag(s.h, s.sd), s.x, s.y, 0, rr(0, 360)); trunk(s.x, s.y, snagR(s.sd), s.h); if (s.sd % 4 === 0) lit(s.x, s.y, 30, EMBER, 260, CHAR_GLOW); }
  const plants = [];
  for (let gx = -hx + 260; gx < hx - 200; gx += 560) for (let gy = -hy + 260; gy < hy - 200; gy += 560) {
    const x = gx + rr(-160, 160), y = gy + rr(-160, 160), edge = Math.min(hx - Math.abs(x), hy - Math.abs(y)) < 900, h = pick([1800, 2200, 2600]), sd = pick([0, 1, 2, 3, 4, 5]), rot = rr(0, 360);
    if (!edge && rnd() > 0.82) continue; if (!freeAt(x, y, 80) || Math.abs(x) > hx - 150 || Math.abs(y) > hy - 150) continue;
    if (inBreak(x, y, -150)) continue; const burnt = inBreak(x, y, 380) ? 1 : 0;
    if (blightAt.some(([bx, by, br]) => Math.hypot(x - bx, y - by) < br + 300) || snags.some((s) => Math.hypot(x - s.x, y - s.y) < 260)) continue;
    plants.push({ x, y, half: pineTrunk(h), circle: true, place: () => { S(deadPine(h, sd, burnt), x, y, 0, rot); trunk(x, y, pineTrunk(h), h * 0.45); } });
  }
  for (const p of K.plan(plants, [0, -5300])) p.place();
  // old stumps and boulders on the forest floor
  for (let i = 0; i < 26; i++) { const x = rr(-hx + 500, hx - 500), y = rr(-hy + 500, hy - 500); if (!freeAt(x, y, 120) || inBreak(x, y, 100) || inPond(x, y, 300) || !K.clear(x, y, 140)) continue;
    if (i % 3 === 0) { const r = pick([90, 120, 150]); S(rock(r, i % 3 + 1, false), x, y, 0, rr(0, 360)); round(x, y, r * 0.92, r * 0.9); }
    else { const r = pick([40, 50]); S(stump(r, pick([40, 60]), i, false), x, y, 0, rr(0, 360)); round(x, y, r * 1.08, 66, 0, false); } }

  // ---- the forest floor: dead bracken everywhere under the pines; the Char's small caps here and there
  { const nav = O.GM, [cx, cy] = [O.cx, O.cy], ok = (x, y) => { const [ix, iy] = nav.cellOf(cx + x, cy + y); return nav.navFree(ix, iy) && K.clear(x, y, 50); };
    let n = 0; for (let k = 0; k < 2600 && n < 360; k++) { const x = rr(-hx + 150, hx - 150), y = rr(-hy + 150, hy - 150); if (inBreak(x, y, 60) || inPond(x, y, 80) || !ok(x, y) || lineDist(x, y, ROAD) < 220 || PATHS.some((P) => lineDist(x, y, P) < 150)) continue;
      if (Math.hypot(x - SF.floor[0], y - SF.floor[1]) < SF.floorR + 80 || Math.hypot(x - SF.camp[0], y - SF.camp[1]) < 900 || Math.hypot(x, y + 5300) < 700) continue;
      S(bracken(pick([0.8, 1, 1.2, 1.4]), pick([1, 2, 3, 4])), x, y, 0, rr(0, 360)); n++; }
    let t = 0; for (let k = 0; k < 900 && t < 26; k++) { const x = rr(-hx + 300, hx - 300), y = rr(-hy + 300, hy - 300); if (inBreak(x, y, 100) || inPond(x, y, 100) || !ok(x, y) || lineDist(x, y, ROAD) < 260) continue; S(toadstoolCluster(pick([0.7, 0.9]), RC.cap, pick([1, 2, 3, 4])), x, y, 0, rr(0, 360)); t++; } }

  // ---- beyond the edge (out of reach): the dead wood going on every way, hills behind
  for (let i = 0; i < 160; i++) { const side = i % 4, u = rr(-1, 1), d = rr(250, 3600), x = side < 2 ? (side ? 1 : -1) * (hx + d) : u * (hx + 3000), y = side < 2 ? u * (hy + 3000) : (side === 2 ? 1 : -1) * (hy + d); if (Math.abs(x) < 260 && Math.abs(y) > hy) continue;
    S(farPine(pick([1800, 2200, 2600]), i % 3), x, y, 0, rr(0, 360)); }
  path([[0, -6100], [0, -9000], [-200, -12000]], 330, 0x6a5a48); path([[0, 6100], [80, 8600], [-160, 11000]], 330, 0x6a5a48);
  for (const [x, y, rx, ry, h] of [[-13000, 0, 5000, 9000, 2400], [13500, 1500, 5500, 9000, 2600], [0, 14500, 9000, 4000, 2800], [-9000, -14000, 6000, 4000, 2000], [9000, -13500, 6000, 4000, 2200]]) S(bareHill(rx, ry, h, 0x4e483e), x, y, -40, 0);

  // where the Char's pools come up: in the break, by the cottage, by the pond, in the grove, by the heart
  const settle = ([x, y]) => { for (let r = 0; r <= 1600; r += 100) { const n = Math.max(1, Math.round(r / 50)); for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (Math.abs(px) < hx - 500 && Math.abs(py) < hy - 500 && K.clear(px, py, 430) && !inPond(px, py, 420) && Math.hypot(px - SF.floor[0], py - SF.floor[1]) > SF.floorR + 400) return [Math.round(px), Math.round(py)]; } } return [x, y]; };
  const beds = [[-700, -300], [1500, -600], [-2000, -2300], [-1800, 3300], [2300, 2300], [-200, 3000]].map(settle);
  return {
    spots: { spawn: [0, -5300], yaw: Math.PI, exit: [0, 5650], textYaw: -90, ammo: [650, -5300], ammoYaw: 90,
      bench: [-660, 5230], benchYaw: 0, box: [660, 5000], chest: [660, 5000], chestYaw: 180, press: [-660, 4730], pressYaw: 0 },
    keep: [[SF.floor[0], SF.floor[1], 900]],
    beds, bossAt: null,
  };
}

// ---- the air in Sporefall Wood: spores drifting down through the pines all the time, like slow grey snow; embers
// rising off the break and round the heart. g: the game; A: the arena (its middle, half sizes).
export function sporefallAir(g, dt, A) {
  const c = g.camera.position, [cx, cy] = A.c; if (Math.abs(c.x - cx) > A.hx + 600 || Math.abs(c.z - cy) > A.hy + 600) return;
  const st = (sporefallAir.st ||= { a: 0, e: 0, h: 0 });
  st.a += dt * 44; while (st.a > 1) { st.a -= 1; const a = Math.random() * 6.28, r = 260 + Math.pow(Math.random(), 1.6) * 2300, s = 9 + Math.random() * 7, w = 0.9 + Math.random() * 0.1;
    g.fx.add({ pos: new THREE.Vector3(c.x + Math.cos(a) * r, 100 + Math.random() * 900, c.z + Math.sin(a) * r), vel: new THREE.Vector3((Math.random() - 0.5) * 40, -28 - Math.random() * 28, (Math.random() - 0.5) * 40), life: 9, size0: s, size1: s, c0: [0.97 * w, 0.95 * w, 0.9 * w, 0.95], fadeIn: 1.2, fadeOut: 1.5, tex: 'FX_Disc', kind: 'fx', glow: 0.35 }); }
  // embers off the break, near you
  const ly = c.z - cy; if (ly > breakS(c.x - cx) - 1500 && ly < breakN(c.x - cx) + 1500) { st.e += dt * 7; while (st.e > 1) { st.e -= 1; const x = c.x + (Math.random() - 0.5) * 3000, lyy = breakS(x - cx) + Math.random() * (breakN(x - cx) - breakS(x - cx));
    g.fx.add({ pos: new THREE.Vector3(x, 10 + Math.random() * 40, cy + lyy), vel: new THREE.Vector3((Math.random() - 0.5) * 30, 50 + Math.random() * 70, (Math.random() - 0.5) * 30), life: 2.6, size0: 6, size1: 3, c0: [1, 0.5, 0.18, 1], c1: [1, 0.3, 0.1, 0], fadeIn: 0.2, fadeOut: 0.8, tex: 'FX_Disc', kind: 'fx', glow: 1 }); } }
  // and round the heart: embers and a thicker fall of spores off the great pine
  const hx0 = cx + SF.heart[0], hz0 = cy + SF.heart[1]; if (Math.hypot(c.x - hx0, c.z - hz0) < 4000) { st.h += dt * 14; while (st.h > 1) { st.h -= 1; const a = Math.random() * 6.28, r = 200 + Math.random() * 700, ember = Math.random() < 0.5;
    g.fx.add(ember ? { pos: new THREE.Vector3(hx0 + Math.cos(a) * r, 10 + Math.random() * 60, hz0 + Math.sin(a) * r), vel: new THREE.Vector3((Math.random() - 0.5) * 30, 60 + Math.random() * 90, (Math.random() - 0.5) * 30), life: 3, size0: 7, size1: 3, c0: [1, 0.48, 0.16, 1], c1: [1, 0.28, 0.08, 0], fadeIn: 0.2, fadeOut: 1, tex: 'FX_Disc', kind: 'fx', glow: 1 }
      : { pos: new THREE.Vector3(hx0 + Math.cos(a) * r * 1.5, 900 + Math.random() * 1400, hz0 + Math.sin(a) * r * 1.5), vel: new THREE.Vector3((Math.random() - 0.5) * 50, -60 - Math.random() * 40, (Math.random() - 0.5) * 50), life: 10, size0: 9, size1: 9, c0: [0.8, 0.76, 0.72, 0.85], fadeIn: 1, fadeOut: 1.5, tex: 'FX_Disc', kind: 'fx', glow: 0 }); } }
}
