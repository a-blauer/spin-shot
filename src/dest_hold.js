// The Old Hold, Under the Hill: the gnomes' forefathers' hold, cut into the hill's granite and left long ago. You come in
// at the south through the great doors (shut behind you, the day through the crack between them) into the gate hall,
// where two stone gnomes leaning on their hammers keep the inner gate, its portcullis still up. Past it the great hall:
// two rows of carved pillars carrying the beams of its roof, banners on the beams, the hold's cog set in brass in the
// floor of the nave, two great hearths either side of the gate, the feasting tables, and at the north end the throne on
// its dais, where the Nightshade has grown up over the old king's seat. West of the hall the forges (three hearths and
// their bellows, anvils, troughs, the smiths' racks, the ore tramway in from the delving); east the cistern, its pool
// under a forest of columns and their vaults, the water from a carved gnome's mouth. South-west the barracks, south-east
// the stores. North-east the mint (the coin press, the melting hearth, the counting tables) and behind its round stone
// door, still shut, the vault, which looters broke into anyway through the wall from the road. North-west the delving,
// the raw rock the miners were cutting when they broke through into the dark: the Nightshade came up out of that breach.
// North of the hall the Kings' Road, the old kings in stone along it, to the Deep Gate: the way on, down, toward the Rot.
//
// Local frame (dest.js): +Y north, +X east, z up; the floor flat at z = 0. Under a roof everywhere: each hall has its own.
import * as THREE from 'three';
import { V, R } from './mapkit.js';
import { destKit } from './dest_kit.js';
import { blightMass } from './dest_props.js';
import { toadstoolCluster, lanternPost, rock } from './village_shapes.js';
import { crate, sack } from './village_props.js';
import { barrel } from './dest_props_works.js';
import { barrelPile } from './dest_props_brew.js';
import { ruinWall, wallBodies, portcullis } from './dest_props_abbey.js';
import { cavePillar, mineTrack, MRAIL, oreTub, scaffold, ingotStack, toolRack } from './dest_props_mine.js';
import { HD, PIL, holdPillar, pilaster, BRZ, brazier, sconce, STAT, gnomeStatue, throne, dais, greatDoors, deepGate, DGATE, HEARTH, hearth, FORGE, forgeHearth, bellows, anvil, trough, smithRack, longTable, bench, banner, trophy,
  BUNK, bunks, weaponRack, dummy, chest, shelves, cask, mushString, cisternColumn, spout, coinPress, countTable, VDOOR, vaultDoor, goldHeap, timberProp, cogInlay, holdRubble, holdRubbleH, coalHeap } from './dest_props_hold.js';
import { shapeB as shape, facet } from './propkit.js';

export const HL = { spawn: [0, -5150], exit: [0, 5420], floor: [0, 4450], floorR: 800, arena: [0, -300], heart: [-4150, 4750], throne: [0, 2800] };
const T = 200;   // the walls' thickness
// the halls: [x0, x1, y0, y1, the height of the roof]
export const HROOMS = { gate: [-2100, 2100, -5600, -3600, 1700], great: [-2100, 2100, -3400, 3000, 2300], barr: [-5200, -2300, -5600, -3600, 1400], store: [2300, 5200, -5600, -3600, 1400],
  forge: [-5200, -2300, -3400, 1600, 1600], cist: [2300, 5200, -3400, 1600, 1600], kroad: [-2100, 2100, 3200, 5600, 1500], mint: [2300, 5200, 1800, 3600, 1500], vault: [2300, 5200, 3800, 5600, 1400], delv: [-5200, -2300, 1800, 5600, 1650] };
const PY = [-2567, -1733, -900, -67, 767, 1600];   // the bays of the great hall, the forge and the cistern
const PX = 1150;   // the great hall's rows of pillars
const CXS = [3025, 3750, 4475];   // the cistern's rows of columns
const CSPRING = 1150, CRISE = 450;   // where the cistern's vaults spring, and how far they rise
const KSPRING = 1500, KRISE = 450;   // the Kings' Road's vault
// the ways between the halls: [x, y, in a wall along 'x' or 'y', width, where its arch springs]
const DOORS = { great: [0, -5700, 'x', 1100, 850], inner: [0, -3500, 'x', 1200, 900], b1: [-2200, -4600, 'y', 800, 700], s0: [2200, -4600, 'y', 800, 700], b2: [-3750, -3500, 'x', 800, 700], s1: [4112, -3500, 'x', 700, 700],
  w1: [-2200, -2150, 'y', 800, 760], w2: [-2200, 350, 'y', 800, 760], w3: [-2200, 2350, 'y', 800, 700], e1: [2200, -2150, 'y', 800, 760], e2: [2200, 350, 'y', 800, 760], e3: [2200, 2350, 'y', 800, 700],
  f1: [-3750, 1700, 'x', 900, 750], c1: [4112, 1700, 'x', 700, 700], n1: [-1650, 3100, 'x', 700, 700], n2: [1650, 3100, 'x', 700, 700], k1: [-2200, 4400, 'y', 800, 700] };
const BREACH = [2200, 4700];   // where the looters broke through from the road into the vault

export function buildHold(M, O) {
  const { hx, hy } = O;
  const K = destKit(M, 71, O, { exactNav: true }), { S, body, round, trunk, patch, rnd, rr, Box, Lamp, Glow, lineDist } = K;
  const pick = (L) => L[Math.floor(rnd() * L.length)];
  const D2R = Math.PI / 180;
  const at = (x, y, yaw, u, v) => [x + u * Math.cos(yaw * D2R) - v * Math.sin(yaw * D2R), y + u * Math.sin(yaw * D2R) + v * Math.cos(yaw * D2R)];
  const both = (P, x, y, z, yaw) => { S(P.main, x, y, z, yaw); M.Shape(P.glow[0], P.glow[1], V(x, y, z), R(0, yaw, 0), 0xffffff, 1, true); };
  const WARM = { r: 1, g: 0.7, b: 0.4 }, FIRE = { r: 1, g: 0.56, b: 0.26 }, VIO = { r: 0.75, g: 0.55, b: 1 }, DAY = { r: 0.95, g: 0.92, b: 0.82 }, SHADE_GLOW = 0xc27cff;
  const lit = (x, y, z, c = WARM, r = 800) => Lamp(V(x, y, z), c, 2.2, r, false);
  // something thinner than a cell of the walking grid: shut the cells round it
  const navBand = (x, y, w, d) => O.GM.NavBlockBox({ min: V(x - w / 2, y - d / 2, 0), max: V(x + w / 2, y + d / 2, 100) }, 1);
  const inRect = (x, y, [x0, x1, y0, y1], m = 0) => x > x0 + m && x < x1 - m && y > y0 + m && y < y1 - m;
  const doorAt = (d) => DOORS[d];

  // ---- the floor under everything: the hill's own rock
  Box(V(0, 0, -60), V(hx * 2 + 4000, hy * 2 + 4000, 120), 0x3a3630, true, false);

  // ---- the walls: coursed granite, big blocks below with a band at the height of the arches' crowns, bigger ones over
  // them to the roofs; each wall's bodies follow its blocks. Arches round-headed; the gates in square cuts their own
  // pieces fill; the looters' breach knocked through a course at a time.
  const PAL = { stone: HD.stone, stoneD: HD.stoneD, soot: HD.soot, lichen: HD.damp }, LOW = 1610;
  let wallN = 0;
  const wall = (x0, y0, x1, y1, top, holes) => {
    const len = Math.round(Math.hypot(x1 - x0, y1 - y0)), yaw = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI, mx = (x0 + x1) / 2, my = (y0 + y1) / 2, sd = ++wallN;
    const lo = { len, h: Math.min(top, LOW), t: T, co: 70, bl: 140, seed: sd, holes, pal: PAL, str: top >= 1100 ? [980] : [] };
    S(ruinWall(lo), mx, my, 0, yaw); const B = wallBodies(lo);
    for (const [s0, s1, z0, z1] of B.runs) { const [px, py] = at(mx, my, yaw, (s0 + s1) / 2, 0); body(px, py, s1 - s0, T, z1 - z0, yaw, z0); }
    if (top > LOW) { const up = { len, h: Math.ceil((top - LOW) / 140) * 140, t: T, co: 140, bl: 280, seed: sd + 50, pal: PAL }; S(ruinWall(up), mx, my, LOW, yaw); body(mx, my, len, T, up.h, yaw, LOW, false); }
  };
  const holesAt = (L, m) => (L || []).map(({ at: a, ...H }) => ({ ...H, s: Math.round(a - m) }));
  const wallX = (y, x0, x1, top, holes) => wall(x0, y, x1, y, top, holesAt(holes, (x0 + x1) / 2));
  const wallY = (x, y0, y1, top, holes) => wall(x, y0, x, y1, top, holesAt(holes, (y0 + y1) / 2));
  const arch = (d) => { const D = DOORS[d]; return { at: D[2] === 'x' ? D[0] : D[1], w: D[3], z0: 0, z1: D[4], k: 'r' }; };
  const H1 = 1480, H2 = 1680, H3 = 1780, HG = 2380, HK = 2030, HM = 1580;
  wallX(-5700, -5400, -2300, H1, []);
  wallX(-5700, -2300, 2300, H3, [arch('great')]);
  wallX(-5700, 2300, 5400, H1, []);
  wallX(-3500, -5400, -2300, H2, [arch('b2')]);
  wallX(-3500, -2300, 2300, HG, [arch('inner')]);
  wallX(-3500, 2300, 5400, H2, [arch('s1')]);
  wallX(1700, -5400, -2300, H2, [arch('f1')]);
  wallX(1700, 2300, 5400, H2, [arch('c1')]);
  wallX(3100, -2300, 2300, HG, [arch('n1'), arch('n2')]);
  wallX(3700, 2300, 5400, HM, [{ at: 3750, w: 1100, z0: 0, z1: 1100, k: 'q' }]);
  wallX(5700, -2300, 2300, HK, [{ at: 0, w: 1400, z0: 0, z1: 1360, k: 'q' }]);
  wallX(5700, 2300, 5400, H1, []);
  wallY(-5300, -5600, -3600, H1, []);
  wallY(-5300, -3400, 1600, H2, []);
  wallY(-2200, -5600, -3600, H3, [arch('b1')]);
  wallY(-2200, -3400, 3000, HG, [arch('w1'), arch('w2'), arch('w3')]);
  wallY(-2200, 3200, 5600, HK, [arch('k1')]);
  wallY(2200, -5600, -3600, H3, [arch('s0')]);
  wallY(2200, -3400, 3000, HG, [arch('e1'), arch('e2'), arch('e3')]);
  wallY(2200, 3200, 5600, HK, [[600, 490], [540, 560], [480, 630], [380, 700], [240, 770]].map(([w, z1], i) => ({ at: BREACH[1] + [0, -20, 30, 10, -30][i], w, z0: 0, z1, k: 'q' })));
  wallY(5300, -5600, -3600, H1, []);
  wallY(5300, -3400, 1600, H2, []);
  wallY(5300, 1800, 3600, HM, []);
  wallY(5300, 3800, 5600, H1, []);

  // ---- the roofs: a slab of the rock over each hall, run into its walls, and the beams under it (pillars carry them in
  // the great hall and the forge; corbels on the walls elsewhere), a boss where two cross; the cistern vaulted bay by bay
  // over its columns; the Kings' Road one long vault with ribs across it. All named hceil (hidden in the plans).
  const ceiling = (key, [x0, x1, y0, y1, hc], alongY = [], alongX = [], corbels = true) => M.Shape('hceil|' + key, shape((G) => {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, bw = 80, bd = 140;
    G.box(cx, cy, hc + 40, (x1 - x0) / 2 + 100, (y1 - y0) / 2 + 100, 40, (nx, ny, nz) => (nz < 0 ? 0x44484e : HD.stoneD));
    for (const x of alongY) G.box(x, cy, hc - bd / 2 + 1, bw, (y1 - y0) / 2 + 100, bd / 2 + 1, (nx, ny, nz) => (nz < 0 ? HD.stone[2] : HD.stone[1]));
    for (const y of alongX) G.box(cx, y, hc - bd / 2 + 1, (x1 - x0) / 2 + 100, bw, bd / 2 + 1, (nx, ny, nz) => (nz < 0 ? HD.stone[2] : HD.stone[0]));
    for (const x of alongY) for (const y of alongX) G.lathe([[0, 0], [52, 4], [70, 16], [70, 27]], HD.stoneL, 12, [x, y, hc - bd - 26]);
    if (corbels) { const corb = (x, y, dx, dy) => { for (let k = 0; k < 3; k++) { const d = 40 + k * 30, z = hc - bd - 50 - (2 - k) * 50; G.box(x + dx * d / 2, y + dy * d / 2, z + 25, dx ? d / 2 : bw + 10, dy ? d / 2 : bw + 10, 25, HD.stone[k]); } };
      if (corbels !== 'x') for (const x of alongY) { corb(x, y0, 0, 1); corb(x, y1, 0, -1); } if (corbels !== 'y') for (const y of alongX) { corb(x0, y, 1, 0); corb(x1, y, -1, 0); } }
  }), V(0, 0, 0), R(0, 0, 0));
  const RM = HROOMS;
  ceiling('gate', RM.gate, [-1700, -1000, 1000, 1700], []);
  ceiling('great', RM.great, [-PX, PX], PY, 'x');
  ceiling('barr', RM.barr, [-4475, -3025], []);
  ceiling('store', RM.store, [3025, 4475], []);
  ceiling('forge', RM.forge, [-3750], PY.slice(0, 5));
  ceiling('mint', RM.mint, [3025, 4475], []);
  ceiling('vault', RM.vault, [3025, 4475], []);
  // the cistern's vaults: every bay between the column lines two barrels crossing (the higher of the two at every point)
  const cBays = (v, lines, a, b) => { const L = [a, ...lines, b]; for (let i = 0; i < L.length - 1; i++) if (v <= L[i + 1] || i === L.length - 2) { const t = (v - L[i]) / (L[i + 1] - L[i]); return Math.sqrt(Math.max(0, 1 - (2 * Math.max(0, Math.min(1, t)) - 1) ** 2)); } return 0; };
  const cistZ = (x, y) => CSPRING + CRISE * Math.max(cBays(x, CXS, 2300, 5200), cBays(y, PY.slice(0, 5), -3400, 1600));
  M.Shape('hceil|cist', () => { const pos = [], cl = [], idx = [], C = new THREE.Color(), st = 60, X0 = 2200, Y0 = -3500, nx = Math.ceil(3100 / st), ny = Math.ceil(5200 / st);
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const x = Math.min(5300, X0 + i * st), y = Math.min(1700, Y0 + j * st), z = cistZ(Math.max(2300, Math.min(5200, x)), Math.max(-3400, Math.min(1600, y))), n = Math.sin(x * 0.011 + y * 0.007) + Math.sin(x * 0.004 - y * 0.013);
      const crs = Math.floor((z - CSPRING) / 45), blk = Math.floor((x + y) / 140) + crs; pos.push(x, y, z); C.setHex(n > 1.3 ? HD.damp : (crs + blk) % 5 === 0 ? HD.stone[2] : crs % 2 ? HD.stone[1] : HD.stone[3], THREE.NoColorSpace); cl.push(C.r, C.g, C.b); }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    return facet({ pos, col: cl, idx }); }, V(0, 0, 0), R(0, 0, 0));
  // the Kings' Road: one vault from wall to wall, ribs across it every so far, landing on corbels
  const kroadZ = (x) => KSPRING + KRISE * Math.sqrt(Math.max(0, 1 - (x / 2100) ** 2));
  const KRIBS = [3800, 4500, 5200];
  M.Shape('hceil|kroad', shape((G) => {
    G.surf((u, v) => { const x = -2200 + u * 4400; return [x, 3100 + v * 2600, kroadZ(x)]; }, 0, 1, 44, 0, 1, 26, (u, v) => { const i = Math.floor(u * 44), j = Math.floor(v * 26 + (i % 2) * 0.5); return (i * 7 + j * 3) % 11 === 0 ? HD.stone[2] : (i * 5 + j) % 13 === 0 ? HD.damp : i % 2 ? HD.stone[1] : HD.stone[3]; });
    for (const y of KRIBS) { const P = (u, e, dz) => { const x = -2100 + u * 4200; return [x, y + e, kroadZ(x) - dz]; };
      G.surf((u, v) => P(u, (v - 0.5) * 140, 60), 0, 1, 30, 0, 1, 1, HD.stoneL); for (const s of [-1, 1]) G.surf((u, v) => P(u, s * 70, v * 62), 0, 1, 30, 0, 1, 1, HD.stone[1]);
      for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) { const d = 40 + k * 30, z = KSPRING - 60 - 50 - (2 - k) * 50; G.box(sx * (2100 - d / 2), y, z + 25, d / 2, 80, 25, HD.stone[k]); } }
  }), V(0, 0, 0), R(0, 0, 0));

  // ---- the floors: flags in rows (running bond), dark joints, a border of long stones along every wall; the great
  // hall's nave a runner of paler stone up to the dais; a sill of the pale stone through every way between the halls
  let flagN = 0;
  const flags = ([x0, x1, y0, y1], s = 250, skip = null, z = 1.2) => { const key = 'hflags|' + (flagN++) + '|' + [x0, x1, y0, y1, s].join(',');
    M.Shape(key, () => { const pos = [], cl = [], idx = [], C = new THREE.Color(); let sd = 7 + flagN * 131; const r = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
      const quad = (ax, ay, bx, by, zz, hex) => { const k = pos.length / 3; pos.push(ax, ay, zz, bx, ay, zz, bx, by, zz, ax, by, zz); C.setHex(hex, THREE.NoColorSpace); for (let i = 0; i < 4; i++) cl.push(C.r, C.g, C.b); idx.push(k, k + 1, k + 2, k, k + 2, k + 3); };
      const col = () => { const u = r(), c = HD.flag[Math.floor(r() * 4)]; return u < 0.08 ? HD.soot : u < 0.2 ? mixc(c, 0x2a2826, 0.3) : u < 0.3 ? mixc(c, 0x8a867e, 0.25) : c; };
      quad(x0, y0, x1, y1, z - 0.3, HD.joint);
      const B = 110, g = 5;
      for (const [ax, ay, bx, by, alongX] of [[x0, y0, x1, y0 + B, 1], [x0, y1 - B, x1, y1, 1], [x0, y0 + B, x0 + B, y1 - B, 0], [x1 - B, y0 + B, x1, y1 - B, 0]]) { const L = alongX ? bx - ax : by - ay, n = Math.max(1, Math.round(L / 420));
        for (let i = 0; i < n; i++) { const a = (L * i) / n, b = (L * (i + 1)) / n, cx = alongX ? ax + (a + b) / 2 : (ax + bx) / 2, cy = alongX ? (ay + by) / 2 : ay + (a + b) / 2; if (skip && skip(cx, cy)) continue;
          if (alongX) quad(ax + a + g, ay + g, ax + b - g, by - g, z, mixc(HD.stoneD, HD.flag[i % 4], 0.4)); else quad(ax + g, ay + a + g, bx - g, ay + b - g, z, mixc(HD.stoneD, HD.flag[i % 4], 0.4)); } }
      for (let row = 0, y = y0 + B; y < y1 - B - 1; row++) { const yb = Math.min(y1 - B, y + s);
        for (let x = x0 + B - (row % 2 ? s / 2 : 0); x < x1 - B; x += s) { const xa = Math.max(x0 + B, x), xb = Math.min(x1 - B, x + s); if (xb - xa < 30 || (skip && skip((xa + xb) / 2, (y + yb) / 2))) continue; quad(xa + g, y + g, xb - g, yb - g, z, col()); }
        y = yb; }
      return { pos, col: cl, idx }; }, V(0, 0, 0), R(0, 0, 0)); };
  const inPool = (x, y, m = 0) => x > 2700 - m && x < 4900 + m && y > -2950 - m && y < 1150 + m;
  for (const k of ['gate', 'great', 'barr', 'store', 'forge', 'kroad', 'mint', 'vault']) flags(RM[k], k === 'great' || k === 'kroad' ? 300 : 250);
  flags(RM.cist, 250, (x, y) => inPool(x, y, 40));
  // the sills through the ways between the halls
  M.Shape('hsills', shape((G) => { for (const d of Object.values(DOORS)) { const [x, y, a, w] = d; if (a === 'x') G.box(x, y, 1.6, w / 2, T / 2, 0.4, HD.stoneL); else G.box(x, y, 1.6, T / 2, w / 2, 0.4, HD.stoneL); }
    G.box(BREACH[0], BREACH[1], 1.6, T / 2, 300, 0.4, HD.stoneD); }), V(0, 0, 0), R(0, 0, 0));
  // the nave's runner, the hold's cog at its middle (where the boss comes)
  M.Shape('hrunner', shape((G) => { const y0 = -3400, y1 = 2120, n = Math.round((y1 - y0) / 350); for (let i = 0; i < n; i++) { const a = y0 + ((y1 - y0) * i) / n, b = y0 + ((y1 - y0) * (i + 1)) / n; for (const s of [-1, 1]) G.box(s * 172, (a + b) / 2, 1.8, 168, (b - a) / 2 - 3, 0.6, i % 2 === (s > 0 ? 1 : 0) ? mixc(HD.flag[2], 0x9a968e, 0.35) : mixc(HD.flag[0], 0x9a968e, 0.3)); }
    for (const s of [-1, 1]) G.box(s * 362, (y0 + y1) / 2, 1.8, 18, (y1 - y0) / 2, 0.6, HD.stoneD); }), V(0, 0, 0), R(0, 0, 0));
  S(cogInlay(700), HL.arena[0], HL.arena[1], 0, 0);

  // ---- the pillars of the great hall and the forge, the pilasters on the great hall's walls under the beams' ends
  const pillar = (x, y, h, sd) => { S(holdPillar(h, PIL.w, sd), x, y, 0, sd * 90); body(x, y, PIL.w + 120, PIL.w + 120, 112); body(x, y, PIL.w, PIL.w, h - 112, 0, 112); body(x, y, PIL.w + 168, PIL.w + 168, 300, 0, h - 290, false); };
  const pilasterAt = (x, y, yaw, h, sd, w = 240) => { S(pilaster(h, w, 70, sd), x, y, 0, yaw); { const [bx, by] = at(x, y, yaw, 65, 0); body(bx, by, 130, w + 120, 112, yaw); } { const [px, py] = at(x, y, yaw, 35, 0); body(px, py, 70, w, h - 112, yaw, 112); } };
  PY.forEach((y, i) => { for (const s of [-1, 1]) pillar(s * PX, y, 2160, i * 2 + (s > 0 ? 1 : 0)); });
  for (const s of [-1, 1]) { pilasterAt(s * PX, -3400, 90, 2160, 7); pilasterAt(s * PX, 3000, -90, 2160, 8); }
  PY.slice(0, 5).forEach((y, i) => pillar(-3750, y, 1460, i + 20));

  // ---- the gate hall: the great doors shut behind you, the day through their crack; the two stone gnomes keeping the
  // inner gate, its portcullis up in the arch; braziers, benches, banners from the beams, the expedition's gear
  { const [x, y, , w, zs] = DOORS.great; both(greatDoors(w, zs), x, y, 0, 90);
    body(x, y, w, 60, zs); for (const [z0, z1] of [[zs, zs + 200], [zs + 200, zs + 400], [zs + 400, zs + w / 2]]) { const e = Math.sqrt(Math.max(0, (w / 2) ** 2 - (z1 - zs) ** 2)); body(x, y, Math.max(60, e * 2), 60, z1 - z0, 0, z0); }
    lit(0, -5450, 320, DAY, 1300); }
  { const [x, y, , w, zs] = DOORS.inner; S(portcullis(w - 40, 760), x, y, zs + 400, 0); }
  for (const s of [-1, 1]) { const x = s * 850, y = -3930;
    S(gnomeStatue(1000, 0, s > 0 ? 1 : 2), x, y, 0, -90); body(x, y, STAT.w, STAT.w, STAT.p); body(x, y - 30, 420, 480, 1000, 0, STAT.p);
    const B = brazier(1); both(B, x, -4470, 0, 0); round(x, -4470, 58, BRZ[1].h + 26); lit(x, -4470, 300, FIRE, 1100); }
  for (const s of [-1, 1]) { const B = brazier(0); both(B, s * 1050, -5330, 0, 0); round(s * 1050, -5330, 48, 190); lit(s * 1050, -5330, 280, FIRE, 900); }
  for (const s of [-1, 1]) { S(bench(500), s * 2070, -5280, 0, 90); body(s * 2070, -5280, 44, 500, 45); S(bench(500), s * 2070, -3900, 0, 90); body(s * 2070, -3900, 44, 500, 45); }
  for (const s of [-1, 1]) for (const y of [-5300, -3880]) { both(sconce(), s * 2100, y, 360, s > 0 ? 180 : 0); lit(s * (2100 - 60), y, 440, WARM, 520); }
  for (const s of [-1, 1]) S(banner(280, 660, 120, s > 0 ? 1 : 0, s + 3), s * 1700, -4600, 1700 - 140, 0);
  { for (const [dx, dy, k] of [[0, 0, 1], [80, 10, 2], [40, 74, 3], [-70, 60, 4]]) { S(crate(70, k), -1650 + dx, -5420 + dy, 0, k * 13); } body(-1645, -5385, 230, 210, 72);
    for (const [dx, dy] of [[0, 0], [60, -10], [30, 50]]) S(sack(26, 0x8a7a5a), -1350 + dx, -5460 + dy, -3, dx * 3); body(-1320, -5440, 150, 140, 56);
    for (const [dx, dy, k] of [[0, 0, 0], [75, 0, 1], [36, 64, 2]]) S(barrel(k + 4), 1600 + dx, -5430 + dy, 0, 0); body(1636, -5405, 170, 170, 92); }

  // ---- the great hall: the two hearths either side of the gate, banners from the beams down the nave, braziers by the
  // pillars, trophies on the walls, the feasting tables, the dais and the throne, the banners behind it
  for (const s of [-1, 1]) { const x = s * 1720, y = -3400; both(hearth(640, 2300, s > 0 ? 1 : 2), x, y, 0, 90);
    body(x, y + 70, 640, 140, 470); body(x, y + 84, 720, 168, 80, 0, 470, false); body(x, y + 60, 600, 120, 1800, 0, 550, false); lit(x, y + 110, 140, FIRE, 1300); }
  [-2983, -2150, -1317, -483, 350, 1183].forEach((y, i) => { for (const s of [-1, 1]) S(banner(300, 760, 160, (i + (s > 0 ? 1 : 0)) % 2, i), s * PX, y, 2160, 0); });
  for (const i of [0, 2, 3, 5]) for (const s of [-1, 1]) { const x = s * 860, y = PY[i]; both(brazier(0), x, y, 0, 0); round(x, y, 48, 190); lit(x, y, 300, FIRE, 950); }
  for (const y of [-1317, -483, 1183]) for (const s of [-1, 1]) S(trophy(y > 0 ? 1 : 0), s * 2100, y, 760, s > 0 ? 180 : 0);
  PY.forEach((y, i) => { if (i % 2) return; for (const s of [-1, 1]) { both(sconce(), s * 2100, y, 860, s > 0 ? 180 : 0); lit(s * (2100 - 70), y, 940, WARM, 560); } });
  for (const s of [-1, 1]) { const x = s * 420; S(longTable(1100, 1, s > 0 ? 3 : 1), x, 1350, 0, 90); body(x, 1350, 160, 1100, 80); for (const t of [-1, 1]) { S(bench(900), x + t * 140, 1350, 0, 90); body(x + t * 140, 1350, 44, 900, 45); } }
  { S(dais(1500, 700, 3, 15), 0, 2650, 0, -90); body(0, 2560, 1860, 880, 15, 0, 0, false); body(0, 2605, 1680, 790, 15, 0, 15, false); body(0, 2650, 1500, 700, 15, 0, 30, false);
    S(throne(), 0, 2840, 45, -90); body(0, 2840, 360, 240, 600, 0, 45);
    for (const s of [-1, 1]) { both(brazier(1), s * 560, 2420, 45, 0); round(s * 560, 2420, 58, BRZ[1].h + 26, 45); lit(s * 560, 2420, 360, FIRE, 1000); }
    for (const [x, b] of [[-560, 0], [0, 1], [560, 0]]) S(banner(320, 820, x ? 480 : 380, b, x ? 5 : 6), x, 2930, 2300, 90); }

  // ---- the forges, west: three hearths on the west wall with their bellows, an anvil and a trough before each, the
  // smiths' racks between them, coal heaped in the corners, copper in stacks, finished work in a rack; the tramway in
  // from the delving to its stop by the forges
  const FY = [-3070, -1317, 350];
  FY.forEach((y, i) => { const x = -5200;
    both(forgeHearth(1600, i + 1), x, y, 0, 0); body(x + FORGE.d / 2, y, FORGE.d, FORGE.w, FORGE.h); body(x + 30, y, 60, FORGE.w, 220, 0, FORGE.h);
    body(x + FORGE.d / 2, y, FORGE.d + 10, FORGE.w + 20, 380, 0, 540, false); body(x + 115, y, 230, 340, 1600 - 920, 0, 920, false); for (const s of [-1, 1]) round(x + FORGE.d - 16, y + s * (FORGE.w / 2 - 14), 10, 450, FORGE.h, false);
    lit(x + 240, y, 220, FIRE, 1300);
    S(bellows(460), x + 240, y + FORGE.w / 2 + 60 + 280, 0, -90); body(x + 240, y + FORGE.w / 2 + 60 + 280 + 40, 200, 640, 260); round(x + 240, y + FORGE.w / 2 + 60 + 280 + 260, 14, 460, 0);
    S(anvil(), x + 640, y - 150, 0, 0); body(x + 640, y - 150, 100, 82, 112);
    S(trough(280), x + 760, y + 250, 0, 0); body(x + 760, y + 250, 284, 104, 74); });
  for (const y of [-2160, -500, 1450]) S(smithRack(300), -5200, y, 0, 0);
  for (const [x, y, r, sd] of [[-2700, 1250, 220, 1], [-2650, -3080, 200, 2]]) { S(coalHeap(r, sd), x, y, 0, sd * 70); round(x, y, r * 0.9, r * 0.5); }
  for (const [x, y, sd] of [[-2760, -1317, 1], [-2760, -483, 2], [-2900, -900, 3]]) { S(ingotStack(5, sd), x, y, 0, sd * 30); body(x, y, 150, 150, 84, sd * 30); }
  { S(weaponRack(400, 2), -4400, -3330, 0, 90); body(-4400, -3330, 420, 100, 200, 0, 0, false); navBand(-4400, -3330, 420, 100); }
  { const y0 = 950, y1 = 4700; S(mineTrack(y1 - y0, 3), -3400, (y0 + y1) / 2, 0, 90); S(['hdstop', shape((G) => { G.box(0, 0, 30, 20, 70, 30, HD.oakD); for (const s of [-1, 1]) G.box(30, s * 50, 20, 30, 8, 20, HD.oak[1]); })], -3400, y0 - 20, 0, -90); body(-3400, y0 - 30, 160, 60, 60);
    for (const [y, load, sd] of [[1300, 1, 1], [3150, 2, 2], [4380, 1, 3]]) { S(oreTub(load, sd), -3400, y, MRAIL, 90); body(-3400, y, 110, 170, 130); } }
  for (const [x, y] of [[-3430, -2150], [-3430, -483], [-4070, 1183]]) { both(brazier(0), x, y, 0, 0); round(x, y, 48, 190); lit(x, y, 300, FIRE, 900); }

  // ---- the barracks, south-west: stone bunks along two walls, footlockers before them, the long table and its benches,
  // the hearth, racks of spears and axes, the practice dummies, shields on the walls
  { S(bunks(4, 1), -5200, -4600, 0, 0); body(-5200 + BUNK.d / 2, -4600, BUNK.d, 4 * BUNK.L + 24, BUNK.h);
    S(bunks(5, 2), -3900, -5600, 0, 90); body(-3900, -5600 + BUNK.d / 2, 5 * BUNK.L + 24, BUNK.d, BUNK.h);
    for (let i = 0; i < 4; i++) { const y = -4600 - 1.5 * BUNK.L + i * BUNK.L; S(chest(0, 0, i), -5200 + BUNK.d + 50, y, 0, 0); body(-5200 + BUNK.d + 50, y, 70, 106, 60); }
    for (let i = 0; i < 5; i += 2) { const x = -3900 - 2 * BUNK.L + i * BUNK.L; S(chest(0, 0, i + 1), x, -5600 + BUNK.d + 50, 0, 90); body(x, -5600 + BUNK.d + 50, 106, 70, 60); }
    S(longTable(1200, 1, 2), -3750, -4500, 0, 0); body(-3750, -4500, 1200, 160, 80); for (const t of [-1, 1]) { S(bench(1000), -3750, -4500 + t * 140, 0, 0); body(-3750, -4500 + t * 140, 1000, 44, 45); }
    both(hearth(640, 1400, 3), -4700, -3600, 0, -90); body(-4700, -3670, 640, 140, 470); body(-4700, -3684, 720, 168, 80, 0, 470, false); body(-4700, -3660, 600, 120, 900, 0, 550, false); lit(-4700, -3710, 140, FIRE, 1200);
    for (const y of [-5300, -3900]) { S(weaponRack(400, y), -2420, y, 0, 0); body(-2420, y, 100, 420, 200, 0, 0, false); navBand(-2420, y, 100, 420); }
    for (const [x, y, sd] of [[-3000, -5200, 1], [-2700, -5050, 2]]) { S(dummy(sd), x, y, 0, sd * 40); round(x, y, 40, 200); }
    for (const x of [-3100, -2600]) S(trophy(x > -3000 ? 1 : 0), x, -3600, 700, -90);
    for (const [x, y, yaw] of [[-5200, -3900, 0], [-3000, -5600, 90], [-4300, -3600, -90]]) { both(sconce(), x, y, 400, yaw); const [lx, ly] = at(x, y, yaw, 70, 0); lit(lx, ly, 480, WARM, 600); } }

  // ---- the stores, south-east: shelves of jars and crocks, the great casks on their cradles, barrels in piles, crates,
  // sacks of meal, mushrooms drying on strings from the beams
  { for (const x of [2900, 4200]) { S(shelves(800, 300, 0, x), x, -5600, 0, 90); body(x, -5600 + 32, 800, 64, 300); }
    for (const [y, sd] of [[-5250, 1], [-4750, 2], [-4250, 3]]) { S(cask(90, 220, sd), 5060, y, 0, 180); body(5060, y, 244, 200, 210); }
    for (const [x, sd] of [[2850, 1], [4900, 2]]) { S(barrelPile(4, sd), x, -3720, 0, 0); body(x, -3720, 290, 100, 240); }
    for (const [dx, dy, k] of [[0, 0, 5], [76, 4, 6], [0, 76, 7], [80, 80, 8], [40, 40, 9]]) S(crate(70, k), 2560 + dx, -5040 + dy, k === 9 ? 59.5 : 0, k * 11); body(2600, -5000, 200, 200, 144);
    for (const [x, y] of [[3650, -4150], [3720, -4120], [3680, -4060], [3760, -4050], [3600, -4080]]) { S(sack(28, 0xb8a47a), x, y, -3, (x + y) % 360); round(x, y, 30, 62); }
    for (const x of [3025, 4475]) for (const y of [-5250, -4950, -4650, -4350, -4050]) S(mushString(6, x + y), x + rr(-30, 30), y, 1400 - 140, rr(0, 360));
    for (const [x, y, yaw] of [[2300, -5200, 0], [5200, -3900, 180], [3600, -5600, 90]]) { both(sconce(), x, y, 400, yaw); const [lx, ly] = at(x, y, yaw, 70, 0); lit(lx, ly, 480, WARM, 650); } }

  // ---- the cistern, east: the pool under its forest of columns, their vaults; half-columns on the walls; stepping
  // stones across to the spout, a carved gnome on the east wall, his water into a basin and on into the pool
  CXS.forEach((x, i) => PY.slice(0, 5).forEach((y, j) => { S(cisternColumn(CSPRING, 70, i * 5 + j), x, y, 0, 0); body(x, y, 200, 200, 36); round(x, y, 78, CSPRING - 36, 36); }));
  PY.slice(0, 5).forEach((y, j) => pilasterAt(5200, y, 180, CSPRING - 10, j + 40, 160));
  M.Shape('hcorb|cist', shape((G) => { for (let k = 0; k < 3; k++) { const d = 40 + k * 30, z = CSPRING - 150 + k * 50; for (const x of CXS) for (const [y, dy] of [[-3400, 1], [1600, -1]]) G.box(x, y + dy * d / 2, z + 25, 90, d / 2, 25, HD.stone[k]); for (const y of PY.slice(0, 5)) G.box(2300 + d / 2, y, z + 25, d / 2, 90, 25, HD.stone[k]); } }), V(0, 0, 0), R(0, 0, 0));
  { const x0 = 2700, x1 = 4900, y0 = -2950, y1 = 1150, kw = 60;
    M.Shape('hpool', () => { const pos = [], cl = [], idx = [], C = new THREE.Color(), st = 100, nx = Math.round((x1 - x0) / st), ny = Math.round((y1 - y0) / st);
      for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const x = x0 + i * st, y = y0 + j * st, n = Math.sin(x * 0.013 + y * 0.009) + Math.sin(x * 0.006 - y * 0.017 + 1); pos.push(x, y, 1.3); C.setHex(n > 1.2 ? HD.waterL : n < -1.3 ? 0x142628 : HD.water, THREE.NoColorSpace); cl.push(C.r, C.g, C.b); }
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
      return { pos, col: cl, idx }; }, V(0, 0, 0), R(0, 0, 0));
    M.Shape('hkerb', shape((G) => { for (const [cx, cy, hx2, hy2] of [[(x0 + x1) / 2, y0 - kw / 2, (x1 - x0) / 2 + kw, kw / 2], [(x0 + x1) / 2, y1 + kw / 2, (x1 - x0) / 2 + kw, kw / 2], [x0 - kw / 2, (y0 + y1) / 2, kw / 2, (y1 - y0) / 2], [x1 + kw / 2, (y0 + y1) / 2, kw / 2, (y1 - y0) / 2]])
      for (let k = 0, n = Math.max(1, Math.round(Math.max(hx2, hy2) / 120)); k < n; k++) { const along = hx2 > hy2, L = 2 * Math.max(hx2, hy2), a = -L / 2 + (L * k) / n, b = a + L / n; G.box(along ? cx + (a + b) / 2 : cx, along ? cy : cy + (a + b) / 2, 5, along ? (b - a) / 2 - 1 : hx2, along ? hy2 : (b - a) / 2 - 1, 5, pick4(HD.stone, k) ); }
      for (let x = x0 + 120; x < x1; x += 240) { const y = -483 + ((x / 240) % 2 ? 14 : -14); G.box(x, y, 4, 88, 88, 4, pick4(HD.flag, Math.round(x / 240))); } }), V(0, 0, 0), R(0, 0, 0));
    S(spout(), 5200, -483, 0, 180); body(5200 - 85, -483, 170, 340, 76); body(5200 - 40, -483, 80, 240, 620, 0, 400, false);
    M.Shape('hchannel', shape((G) => { G.box(4970, -483, 1.4, 70, 40, 0.3, HD.waterL); for (const s of [-1, 1]) G.box(4970, -483 + s * 50, 4, 70, 10, 4, HD.stoneD); }), V(0, 0, 0), R(0, 0, 0));
    for (const [x, y] of [[2560, -3220], [2560, 1420], [5040, -3220], [5040, 1420]]) { both(brazier(1), x, y, 0, 0); round(x, y, 58, BRZ[1].h + 26); lit(x, y, 320, FIRE, 1000); }
    lit(5000, -483, 500, { r: 0.6, g: 0.8, b: 1 }, 900); lit(3750, -1317, 80, { r: 0.55, g: 0.75, b: 1 }, 1200); lit(3750, 350, 80, { r: 0.55, g: 0.75, b: 1 }, 1200); }

  // ---- the mint, north-east: the coin press, the melting hearth on the east wall, the counting tables, chests by the
  // vault's door, shelves of strongboxes; the round stone door of the vault, rolled shut
  { S(coinPress(), 3750, 2650, 0, 0); body(3750, 2650, 190, 150, 70); body(3750, 2650, 70, 150, 360, 0, 60); body(3750, 2650, 60, 560, 70, 0, 450, false);
    both(forgeHearth(1500, 4), 5200, 2300, 0, 180); body(5200 - FORGE.d / 2, 2300, FORGE.d, FORGE.w, FORGE.h); body(5200 - 30, 2300, 60, FORGE.w, 220, 0, FORGE.h); body(5200 - FORGE.d / 2, 2300, FORGE.d + 10, FORGE.w + 20, 380, 0, 540, false); body(5200 - 115, 2300, 230, 340, 1500 - 920, 0, 920, false);
    for (const s of [-1, 1]) round(5200 - FORGE.d + 16, 2300 + s * (FORGE.w / 2 - 14), 10, 450, FORGE.h, false); lit(5200 - 240, 2300, 220, FIRE, 1200);
    for (const [x, y, yaw, sd] of [[2950, 3000, 0, 1], [4550, 3150, 180, 2]]) { S(countTable(sd), x, y, 0, yaw); body(x, y, 104, 224, 80); }
    for (const [x, y, yaw, sd] of [[3080, 3480, -90, 1], [3240, 3490, -80, 2], [4400, 3480, -100, 3]]) { S(chest(0, 0, sd), x, y, 0, yaw); body(x, y, 110, 110, 60); }
    S(shelves(600, 300, 1, 5), 2300, 3200, 0, 0); body(2300 + 32, 3200, 64, 600, 300);
    { const [x, y] = [3750, 3700]; S(vaultDoor(1100, 1100, T), x, y, 0, -90); body(x, y, 1100, T + 40, 1100); }
    for (const [x, y, yaw] of [[2300, 2900, 0], [3050, 3600, -90], [4800, 1800, 90]]) { both(sconce(), x, y, 400, yaw); const [lx, ly] = at(x, y, yaw, 70, 0); lit(lx, ly, 480, WARM, 700); } }

  // ---- the vault: looted shelves, chests standing open and empty, the gold the looters could not carry heaped in the
  // far corner, the Nightshade grown up through it; the breach they made through the wall from the road, its rubble
  { for (const [x, sd] of [[2950, 1], [3900, 2]]) { S(shelves(800, 320, 2, sd), x, 5600, 0, -90); body(x, 5600 - 32, 800, 64, 320); }
    S(shelves(700, 320, 1, 3), 5200, 4300, 0, 180); body(5200 - 32, 4300, 64, 700, 320);
    for (const [x, y, yaw, fill, sd] of [[3300, 4350, 30, 0, 1], [4050, 4200, -20, 0, 2], [4500, 4700, 200, 1, 3], [2900, 5150, 80, 0, 4]]) { S(chest(1, fill, sd), x, y, 0, yaw); body(x, y, 120, 120, 60, yaw); }
    S(goldHeap(230, 1), 4780, 5180, 0, 20); round(4780, 5180, 200, 90);
    for (const [x, y, r, sd] of [[2480, 4760, 160, 3], [1900, 4700, 200, 4], [2560, 4520, 100, 5]]) { S(holdRubble(r, sd), x, y, 0, sd * 47); round(x, y, r * 0.62, holdRubbleH(r) + 10); }
    for (const [x, y, yaw] of [[5200, 5000, 180], [3000, 3800, 90]]) { both(sconce(), x, y, 400, yaw); const [lx, ly] = at(x, y, yaw, 70, 0); lit(lx, ly, 480, WARM, 600); } }

  // ---- the Kings' Road: the old kings in stone along it, braziers either side of the Deep Gate, the gate shut, the
  // Nightshade's light under it; the ring of the floor where the stations come up
  { for (const [x, y, yaw, sd] of [[-1200, 3900, 0, 1], [-1200, 5150, 0, 2], [1200, 3900, 180, 3], [1200, 5150, 180, 4]]) { S(gnomeStatue(900, 1, sd), x, y, 0, yaw); body(x, y, STAT.w, STAT.w, STAT.p); const [fx, fy] = at(x, y, yaw, 30, 0); body(fx, fy, 440, 400, 880, 0, STAT.p); }
    both(deepGate(1400, 1360, T), 0, 5700, 0, -90); { const dh = 1360 - DGATE.lint; body(0, 5700, 1400 - 2 * DGATE.jamb, 60, dh); for (const s of [-1, 1]) body(s * (700 - DGATE.jamb / 2), 5700, DGATE.jamb, T + 48, dh); body(0, 5700, 1460, T + 80, DGATE.lint, 0, dh, false); } lit(0, 5450, 140, VIO, 900);
    for (const s of [-1, 1]) { both(brazier(1), s * 800, 5480, 0, 0); round(s * 800, 5480, 58, BRZ[1].h + 26); lit(s * 800, 5480, 320, FIRE, 1100); }
    M.Shape('hring', shape((G) => { const [x, y] = HL.floor, r = HL.floorR; G.lathe([[r - 40, 1.8], [r + 40, 1.8], [r + 40, 2.6], [r - 40, 2.6], [r - 40, 1.8]], HD.stoneD, 48, [x, y, 0], [1, 1], true); for (let j = 0; j < 8; j++) { const a = (j / 8) * Math.PI * 2, b = G.n; G.box(0, 0, 2.6, 30, 12, 0.6, HD.brass); G.place(b, { x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, yaw: (a * 180) / Math.PI }); } }), V(0, 0, 0), R(0, 0, 0));
    for (const [x, y, yaw] of [[-2100, 3400, 0], [-2100, 5450, 0], [2100, 3400, 180], [2100, 4250, 180]]) { both(sconce(), x, y, 400, yaw); const [lx, ly] = at(x, y, yaw, 70, 0); lit(lx, ly, 480, WARM, 650); }
    for (const [x, y] of [[-900, 3500], [900, 3500]]) { both(brazier(0), x, y, 0, 0); round(x, y, 48, 190); lit(x, y, 300, FIRE, 1000); } }

  // ---- the delving, north-west: the raw rock past the masons' last wall, cut rough and propped, where the miners broke
  // through into the dark; its roof, its rock walls, two pillars of rock left standing, the tramway's end at the face
  // and the scaffold there, timber props, lanterns on posts, the miners' cache; the breach, and the Nightshade's heart
  // come up out of it
  const ROCK = { rock: [0x585c62, 0x4e5258, 0x62666c, 0x464a50], rockD: 0x34383c, rockL: 0x747880 };
  const ceilD = (x, y) => { let z = 1660 + 150 * Math.sin(x * 0.0017 + y * 0.0011) + 90 * Math.sin(x * 0.0041 - y * 0.0033 + 1.3) + 50 * Math.sin(x * 0.009 + y * 0.011 + 0.4);
    const db = Math.hypot(x - HL.heart[0], y - HL.heart[1]); if (db < 1100) z += 380 * (1 - db / 1100) ** 2;
    z = Math.max(1440, z); if (y < 1950) z = Math.min(z, 1640); if (x > -2450) z = Math.min(z, 1980); return z; };
  M.Shape('hroof|delv', () => { const pos = [], cl = [], idx = [], C = new THREE.Color(), st = 200, X0 = -5400, Y0 = 1700, nx = Math.round(3200 / st), ny = Math.round(4100 / st);
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const ex = i > 0 && i < nx && j > 0 && j < ny, x = X0 + i * st + (ex ? ((j * 7 + i * 13) % 5 - 2) * 26 : 0), y = Y0 + j * st + (ex ? ((i * 11 + j * 3) % 5 - 2) * 26 : 0), z = ceilD(x, y) + (ex ? ((i * 17 + j * 29) % 7 - 3) * 16 : 0), n = Math.sin(x * 0.013 + y * 0.007) + Math.sin(x * 0.005 - y * 0.017);
      pos.push(x, y, z); C.setHex(n > 1.2 ? ROCK.rockL : n < -1.2 ? ROCK.rockD : ROCK.rock[(i + j * 3) % 4], THREE.NoColorSpace); cl.push(C.r, C.g, C.b); }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    return facet({ pos, col: cl, idx }); }, V(0, 0, 0), R(0, 0, 0));
  // its rock walls, west and north: a curtain of the rock from the floor into the roof, its foot flaring, bays and bosses
  // in it; solid as far out as it comes at walking height
  const DP = [], DN = []; { const add = (x, y, nx2, ny2) => { DP.push([x, y]); DN.push([nx2, ny2]); };
    for (let y = 1640; y < 5030; y += 60) add(-5235, y, 1, 0);
    for (let k = 0; k <= 12; k++) { const a = Math.PI - (k / 12) * (Math.PI / 2), x = -4635 + Math.cos(a) * 600, y = 5030 + Math.sin(a) * 600; add(x, y, -Math.cos(a), -Math.sin(a)); }
    for (let x = -4575; x <= -2240; x += 60) add(x, 5630, 0, -1); }
  const ND = DP.length, nvD = 16, dinD = (i, v) => Math.max(0, 140 + 120 * Math.sin(i * 0.13 + 0.5) + 70 * Math.sin(i * 0.41 + 2) + 30 * Math.sin(i * 1.4 + v * 4.1) + 20 * Math.sin(i * 3.1 - v * 6.3) + ((i * 7 + Math.round(v * 14) * 3) % 5 - 2) * 6 + (v < 0.08 ? 40 * (1 - v / 0.08) : 0)) * (i < 4 || i > ND - 5 ? 0.3 : 1);
  M.Shape('hdwall|delv', () => { const pos = [], cl = [], idx = [], C = new THREE.Color();
    for (let i = 0; i < ND; i++) { const [bx, by] = DP[i], [nx2, ny2] = DN[i], top = ceilD(bx, by) + 160;
      for (let j = 0; j <= nvD; j++) { const v = j / nvD, d = dinD(i, v), z = -40 + v * (top + 40), nn = Math.sin(i * 0.71 + j * 1.9) + Math.sin(i * 0.23 - j * 0.7);
        pos.push(bx + nx2 * d, by + ny2 * d, z); C.setHex(j === 0 ? ROCK.rockD : nn > 1.1 ? ROCK.rockL : nn < -1.1 ? ROCK.rockD : ROCK.rock[(i + j) % 4], THREE.NoColorSpace); cl.push(C.r, C.g, C.b); } }
    for (let i = 0; i < ND - 1; i++) for (let j = 0; j < nvD; j++) { const a = i * (nvD + 1) + j, b = a + 1, c = a + nvD + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    return facet({ pos, col: cl, idx }); }, V(0, 0, 0), R(0, 0, 0));
  for (let i = 0; i < ND - 1; i += 2) { const a = DP[i], b = DP[Math.min(ND - 1, i + 2)], [nx2, ny2] = DN[Math.min(ND - 1, i + 1)]; let dm = 0; for (let k = i; k <= Math.min(ND - 1, i + 2); k++) for (const v of [0, 1 / nvD, 2 / nvD]) dm = Math.max(dm, dinD(k, v));
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) + 30, Th = 500 + dm, mx = (a[0] + b[0]) / 2 + nx2 * (dm - Th / 2), my = (a[1] + b[1]) / 2 + ny2 * (dm - Th / 2); body(mx, my, L, Th, 2400, (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI); }
  // how far in the rock comes along the north face at walking height, near x
  const northFace = (x0, x1) => { let y = 5630; DP.forEach(([bx, by], i) => { if (DN[i][1] > -0.9 || bx < x0 || bx > x1) return; for (let j = 0; j <= 4; j++) y = Math.min(y, by - dinD(i, j / nvD)); }); return y; };
  for (const [x, y, r, sd] of [[-4300, 3000, 300, 1], [-2900, 4250, 240, 2]]) { const h = Math.round(ceilD(x, y) / 50) * 50; S(cavePillar(r, h, sd, ROCK), x, y, 0, sd * 80); round(x, y, r * 1.08, h); }
  { const yc = northFace(-3950, -2850) - 76; S(scaffold(1000, 900, 2), -3400, yc, 0, -90); body(-3400, yc, 1000, 140, 980, 0, 0, false); navBand(-3400, (yc - 90 + 5640) / 2, 1040, 5640 - (yc - 90)); }
  for (const [x, y, sd] of [[-4750, 2350, 1], [-3950, 2250, 2], [-2700, 3500, 3], [-4150, 3950, 4]]) { const h = Math.round(ceilD(x, y) / 10) * 10 + 20; S(timberProp(h, sd), x, y, 0, sd * 30); body(x, y, 40, 40, h); navBand(x, y, 70, 70); }
  for (const [x, y, yaw, sd] of [[-3200, 2250, 180, 1], [-3200, 3550, 180, 2], [-3250, 4450, 180, 3], [-2900, 3800, 180, 4]]) { S(lanternPost(300, sd), x, y, 0, yaw); round(x, y, 12, 300, 0, false); navBand(x, y, 40, 40); const [lx, ly] = at(x, y, yaw + 180, 62, 0); lit(lx, ly, 242, WARM, 750); }
  { S(toolRack(), -2700, 3200, 0, 180); body(-2720, 3200, 70, 240, 150);
    for (const [dx, dy, k] of [[0, 0, 0], [72, 10, 1], [30, 70, 2]]) S(barrel(k + 7), -2600 + dx, 5250 + dy, 0, 0); body(-2564, 5285, 180, 180, 92);
    for (const [dx, dy] of [[0, 0], [60, 20], [-10, 60]]) S(sack(26, 0x7a6a4a), -2850 + dx, 5300 + dy, -3, dx); body(-2826, 5326, 150, 150, 72); }
  for (const [x, y, r, sd] of [[-4950, 2150, 180, 1], [-4950, 4050, 150, 3], [-2650, 2650, 120, 4]]) { S(holdRubble(r, sd), x, y, 0, sd * 60); round(x, y, r * 0.62, holdRubbleH(r) + 10); }
  for (let i = 0, n = 0; i < 400 && n < 40; i++) { const x = rr(-5100, -2400), y = rr(1900, 5500), r = pick([16, 22, 30]); if (!K.clear(x, y, r + 60) || Math.abs(x + 3400) < 160 || Math.hypot(x - HL.heart[0], y - HL.heart[1]) < 700) continue; S(rock(r, pick([1, 2, 3]), false), x, y, -r * 0.3, rr(0, 360)); n++; }
  // the breach: the floor broken open into the dark, its broken edge, the violet light up out of it, the heart grown up
  // through it
  const blightAt = [];
  { const [bx, by] = HL.heart;
    M.Shape('hbreach', shape((G) => { const n = 28; G.lathe([[0, 0.8], [440, 0.8]], 0x060408, n); G.lathe([[300, 1.0], [440, 1.0]], 0x140c1c, n, [0, 0, 0], [1, 1], true);
      for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2 + (k % 3) * 0.07, m = G.n; G.box(0, 0, 0, 60 + (k % 3) * 14, 34 + (k % 2) * 10, 10, pick4(HD.flag, k)); G.place(m, { x: Math.cos(a) * 470, y: Math.sin(a) * 470, z: 8, yaw: (a * 180) / Math.PI + 90, roll: (k % 2 ? 14 : -10), pitch: 8 }); } }), V(bx, by, 0), R(0, 0, 0));
    M.Shape('hbreach|glow', shape((G) => { G.lathe([[0, 1.1], [250, 1.1]], 0x7a4ab4, 20); G.lathe([[0, 1.2], [120, 1.2]], 0xb48aff, 14); }), V(bx, by, 0), R(0, 0, 0), 0xffffff, 1, true);
    for (const [a, r, sd] of [[0.2, 150, 1], [2.6, 120, 2], [3.8, 160, 3], [5.2, 130, 4]]) { const x = bx + Math.cos(a) * 560, y = by + Math.sin(a) * 560; S(holdRubble(r, sd + 10), x, y, 0, sd * 77); round(x, y, r * 0.62, holdRubbleH(r) + 10); }
    round(bx, by, 520, 140); lit(bx, by, 60, VIO, 1500); Glow(V(bx, by, 30), V(22, 22, 26), SHADE_GLOW, 2);
    S(blightMass(360, 3, 'shade'), bx + 120, by + 110, 0, 40); trunk(bx + 120, by + 110, 360 * 0.62, 360 * 0.55); blightAt.push([bx + 120, by + 110, 360]); }

  // ---- the Nightshade through the hold: its masses (the delving, the forge, the throne, the vault's gold, the cistern,
  // the stores, the hall), its threads out of the heart through the doors, toadstools along them, its light
  for (const [x, y, r, sd, z] of [[-3450, 3850, 240, 4, 0], [-4800, 3500, 220, 5, 0], [-4500, 1300, 220, 6, 0], [-480, 2700, 230, 7, 45], [4920, 5330, 240, 8, 0], [3050, 1400, 180, 9, 0], [3400, -3800, 160, 10, 0], [1450, -2950, 160, 11, 0]]) {
    S(blightMass(r, sd, 'shade'), x, y, z, rr(0, 360)); trunk(x, y, r * 0.62, r * 0.55); blightAt.push([x, y, r]); lit(x, y, z + r * 0.5 + 40, VIO, 700); Glow(V(x, y, z + r * 0.4), V(22, 22, 26), SHADE_GLOW, 2); }
  { const [hx0, hy0] = HL.heart, veins = [];
    for (const P of [[[hx0, hy0], [-4100, 4200], [-3720, 3300], [-3800, 2400], [-3750, 1700], [-3920, 900], [-4300, 150]], [[hx0, hy0], [-3700, 4750], [-2950, 4550], [-2200, 4400], [-1500, 4250], [-1000, 3950]],
      [[hx0, hy0], [-4300, 3650], [-3300, 2900], [-2600, 2420], [-2200, 2350], [-1600, 2400], [-1060, 2460]], [[4920, 5330], [4250, 4950], [3350, 4800], [2200, 4700], [1600, 4620], [1250, 4400]], [[-4500, 1300], [-4100, 600], [-3300, -300]]]) {
      const pts = []; for (let k = 0; k < P.length - 1; k++) { const [x0, y0] = P[k], [x1, y1] = P[k + 1], n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 160)); for (let i = 0; i < n; i++) { const t = i / n; pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]); } } pts.push(P[P.length - 1]); veins.push(pts); }
    M.Shape('hdveins', () => { const pos = [], col = [], idx = []; for (const pts of veins) { const n = pts.length, b0 = pos.length / 3;
      for (let j = 0; j < n; j++) { const [x, y] = pts[j], [xa, ya] = pts[Math.max(0, j - 1)], [xb, yb] = pts[Math.min(n - 1, j + 1)], L = Math.hypot(xb - xa, yb - ya) || 1, nx2 = -(yb - ya) / L, ny2 = (xb - xa) / L, wv = j && j < n - 1 ? Math.sin(x * 0.011 + j) * 34 : 0, w = 10 * (1 - (j / n) * 0.7);
        for (const e of [-1, 1]) { pos.push(x + nx2 * (wv + w * e), y + ny2 * (wv + w * e), 2.9); col.push(0.5, 0.34, 0.66); } }
      for (let j = 0; j < n - 1; j++) { const a = b0 + j * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } } return { pos, col, idx }; }, V(0, 0, 0), R(0, 0, 0));
    for (const pts of veins) for (let j = 3; j < pts.length; j += 3) { const [vx, vy] = pts[j]; if (blightAt.some(([bx, by, br]) => Math.hypot(vx - bx, vy - by) < br + 120) || !K.clear(vx, vy, 160) || Object.values(DOORS).some((d) => Math.hypot(vx - d[0], vy - d[1]) < 500) || Math.abs(vx + 3400) < 140) continue;
      const ts = pick([0.8, 1, 1.2]); S(toadstoolCluster(ts, 0x56367c, pick([1, 2, 3])), vx, vy, 0, rr(0, 360)); round(vx, vy, 22 * ts, 40 * ts); }
    for (const [x, y, ts] of [[-700, 2450, 0.9], [-250, 2380, 0.8], [-860, 2900, 1]]) { S(toadstoolCluster(ts, 0x56367c, 2), x, y, 45, rr(0, 360)); round(x, y, 22 * ts, 40 * ts, 45); } }

  // where the Nightshade's beds come up: in the hall's nave, the forge, the cistern's floor, the delving, the mint
  const openAt = (x, y, m) => { const [ix, iy] = O.GM.cellOf(O.cx + x, O.cy + y); return O.GM.navFree(ix, iy) && K.clear(x, y, m); };
  const settle = ([x, y]) => { for (let r = 0; r <= 1600; r += 100) { const n = Math.max(1, Math.round(r / 50)); for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (Math.abs(px) < hx - 300 && Math.abs(py) < hy - 300 && openAt(px, py, 330) && Math.hypot(px - HL.floor[0], py - HL.floor[1]) > 1300 && Math.hypot(px - HL.spawn[0], py - HL.spawn[1]) > 1300) return [Math.round(px), Math.round(py)]; } } return [x, y]; };
  const beds = [[-700, -1600], [700, 500], [-3000, -900], [3750, -3150], [-3900, 3300], [3700, 2200]].map(settle);
  return {
    spots: { spawn: HL.spawn, yaw: Math.PI, exit: HL.exit, textYaw: -90, ammo: [HL.spawn[0] + 650, HL.spawn[1] - 150], ammoYaw: 90,
      bench: [HL.floor[0] - 540, HL.floor[1] + 60], benchYaw: 0, box: [HL.floor[0] + 640, HL.floor[1] - 180], chest: [HL.floor[0] + 640, HL.floor[1] - 180], chestYaw: 180, press: [HL.floor[0] - 540, HL.floor[1] - 440], pressYaw: 0 },
    keep: [[HL.floor[0], HL.floor[1], HL.floorR], [HL.heart[0], HL.heart[1], 700]], bossAt: HL.arena, hangs: null, beds,
  };
}
const pick4 = (a, i) => a[((i % a.length) + a.length) % a.length];
const mixc = (a, b, t) => { const f = (k) => Math.round(((a >> k) & 255) * (1 - t) + ((b >> k) & 255) * t); return (f(16) << 16) | (f(8) << 8) | f(0); };

// ---- the air in the hold: dust turning in the firelight, the day's dust in the crack of the great doors, embers up off
// the forges, the Nightshade's motes drifting up out of the breach
export function holdAir(g, dt, A) {
  const c = g.camera.position, [cx, cy] = A.c; if (Math.abs(c.x - cx) > A.hx + 600 || Math.abs(c.z - cy) > A.hy + 600) return;
  const st = (holdAir.st ||= { a: 0, d: 0, e: 0, s: 0 });
  st.a += dt * 14; while (st.a > 1) { st.a -= 1; const a = Math.random() * 6.28, r = 200 + Math.pow(Math.random(), 1.5) * 1600;
    g.fx.add({ pos: new THREE.Vector3(c.x + Math.cos(a) * r, 60 + Math.random() * 900, c.z + Math.sin(a) * r), vel: new THREE.Vector3((Math.random() - 0.5) * 20, (Math.random() - 0.3) * 12, (Math.random() - 0.5) * 20), life: 7, size0: 4, size1: 4, c0: [1, 0.86, 0.66, 0.7], fadeIn: 1.2, fadeOut: 1.5, tex: 'FX_Disc', kind: 'fx' }); }
  const dx = cx + 0, dz = cy - 5600; if (Math.hypot(c.x - dx, c.z - dz) < 2600) { st.d += dt * 8; while (st.d > 1) { st.d -= 1; const x = dx + (Math.random() - 0.5) * 160, z = dz + Math.random() * 1000;
    g.fx.add({ pos: new THREE.Vector3(x, 20 + Math.random() * 600, z), vel: new THREE.Vector3((Math.random() - 0.5) * 10, -6 + Math.random() * 10, (Math.random() - 0.5) * 10), life: 6, size0: 3, size1: 3, c0: [1, 0.98, 0.9, 0.8], fadeIn: 1.2, fadeOut: 1.5, tex: 'FX_Disc', kind: 'fx' }); } }
  for (const fy of [-3070, -1317, 350]) { const fx = cx - 5200 + 240, fz = cy + fy; if (Math.hypot(c.x - fx, c.z - fz) > 2400) continue; st.e += dt * 3; while (st.e > 1) { st.e -= 1;
    g.fx.add({ pos: new THREE.Vector3(fx + (Math.random() - 0.5) * 160, 110, fz + (Math.random() - 0.5) * 200), vel: new THREE.Vector3((Math.random() - 0.5) * 40, 160 + Math.random() * 120, (Math.random() - 0.5) * 40), life: 2.2, size0: 3, size1: 1.5, c0: [1, 0.6, 0.2, 1], fadeIn: 0.05, fadeOut: 0.8, tex: 'FX_Disc', kind: 'fx', glow: 1 }); } }
  const hx0 = cx + HL.heart[0], hz0 = cy + HL.heart[1]; if (Math.hypot(c.x - hx0, c.z - hz0) < 3500) { st.s += dt * 5; while (st.s > 1) { st.s -= 1; const a = Math.random() * 6.28, r = Math.random() * 500;
    g.fx.add({ pos: new THREE.Vector3(hx0 + Math.cos(a) * r, 30 + Math.random() * 200, hz0 + Math.sin(a) * r), vel: new THREE.Vector3((Math.random() - 0.5) * 30, 40 + Math.random() * 50, (Math.random() - 0.5) * 30), life: 6, size0: 5, size1: 3, c0: [0.8, 0.55, 1, 0.9], fadeIn: 0.8, fadeOut: 1.5, tex: 'FX_Disc', kind: 'fx', glow: 0.6 }); } }
}
