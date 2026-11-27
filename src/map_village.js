// Thimblewick: the gnome village every run starts from, a hollow among the roots of a few enormous old trees.
// Built into the Descent's map as one more chunk, far from the rooms, so a run starts by walking through the Way Down and
// ends by coming home, with no loading between. Local frame: +Y is north (and +X east; note that in the rendered world
// east is on your left as you face north).
//
// The plan is a cross. The south road comes in under the welcome arch, past two cottages, over the humped bridge and
// under an arching root into the cobbled square, where the well stands. The four streets leave the square on its axes:
// north to the Way Down at the foot of the oldest giant, east to the door of the Lucky Toadstool, west to Mossbottom's
// counter (Bramble & Bolt), south back over the bridge. Everything else has a lane of its own off the north and south
// roads: home and its dressing porch to the north-west, Mother Inkcap's grove of standing stones by a still pool to the
// north-east, Flintwhistle's forge on the stream bank to the south-west (its waterwheel in the stream), the campfire on
// the brook to the east, and Old Hobnail's training yard across the water to the south-east. The edge of the hollow is
// thicket, roots and the giants themselves. Stations and people are added at run time (village.js) from VSPOTS.
import * as THREE from 'three';
import { V, R } from './mapkit.js';
import { shroomHouse, thatchCottage, tree, bush, flower, fence, lanternPost, rock, hill, cabbage, pumpkin, mirror, wellFine, toadstoolCap, rootPillar, slotMachine, rouletteTable, cardTable, diceTable, hatStand, grassTuft, toadstoolCluster, fern, mossLog, stemR, giantTree, giantLimbs, giantRoots, rootArch, wardrobeFine, dressScreen, VC, dark, mix } from './village_shapes.js';
import { cobbleSquare, planter, woodpile, choppingBlock, washLine, reeds, lilies, standingStone, waterwheel, anvil, trough, grindstone, dummy, archeryButt, cart, crate, sack, stump, welcomeArch, thicket, lecternStand, flowerClump, rowboat, treeDeck, dressForm, clothRack } from './village_props.js';
import { awning, barrel, hay, bench } from './descent_shapes.js';
import { wob } from './propkit.js';

export const VSIZE = 3000;   // the walkable square, half its side
const STREAM_Y = -1850, GATE = [0, 2600], CASINO = [2250, 0];
const SHOP = [-1650, 0], FORGE = [-1800, -1250], HOME = [-1950, 1650], GROVE = [1550, 1700], YARD = [1500, -2750], FIRE = [900, -1000];
const LECT = [GROVE[0] - 420, GROVE[1]];   // the grove is a ring of stones round a pool; the lectern stands on its west shore
const ARCH_S = -1250, ARCH_N = 1750, WELCOME = -3250, SQ = 640;   // the root arches over the roads, the welcome arch, the square's cobbles
export const streamY = (x) => STREAM_Y + Math.sin(x * 0.0009) * 260 + Math.sin(x * 0.0023) * 90;
// the old giants: [x, y, height, trunk radius, seed]
const GIANTS = [[0, 4900, 6400, 680, 1], [-2850, 2750, 5200, 520, 2], [2750, 2650, 5600, 540, 3], [-3700, -1150, 4800, 470, 4], [3050, -2250, 5000, 430, 5], [-2300, -3050, 4400, 420, 6], [1700, -3850, 4600, 430, 7]];
// the cottages: [x, y, height, stem radius, cap colour, yaw]
const COTS = [[-1100, -2900, 340, 230, 0xc8392e, 0], [-2800, -650, 360, 230, 0x3a6a9a, 0]];
// where the treehouse ladder comes down (on the north-east giant's deck), and its foot
const LADDER_A = Math.PI * 1.35, GIANTS_LADDER = [2750 + Math.cos(LADDER_A) * (540 * 2 + 12), 2650 + Math.sin(LADDER_A) * (540 * 2 + 12)];
// the paths: [points, width]
const PATHS = [
  [[[0, -3500], [0, STREAM_Y - 600]], 380], [[[0, STREAM_Y + 600], [0, -SQ - 25]], 380], [[[0, SQ + 25], [0, GATE[1] - 270]], 380],
  [[[-SQ - 25, 0], [SHOP[0] + 660, 0]], 360], [[[SQ + 25, 0], [CASINO[0] - 1130, 0]], 400],
  [[[-150, 950], [-650, 1180], [HOME[0] + 830, HOME[1] - 90]], 280], [[[150, 950], [650, 1250], [LECT[0] - 150, LECT[1] - 60]], 280],
  [[[-150, -1000], [-700, -1100], [FORGE[0] + 650, FORGE[1]]], 300], [[[-990, -60], [-1150, -330], [-1700, -560], [COTS[1][0] + 280, COTS[1][1]]], 240],
  [[[150, -1000], [FIRE[0] - 260, FIRE[1]]], 260], [[[150, -2660], [700, -2670], [YARD[0] - 420, YARD[1] + 90]], 260], [[[-150, -2890], [COTS[0][0] + 280, COTS[0][1]]], 220],
];
// what a giant's roots must not run into: [x, y, r]
const STRUCTS = [[0, 0, 760], [SHOP[0], SHOP[1], 720], [FORGE[0], FORGE[1], 560], [-1900, -1700, 360], [HOME[0], HOME[1], 520], [HOME[0] + 610, HOME[1], 480], [HOME[0] - 800, HOME[1] - 150, 430],
  [CASINO[0], CASINO[1], 1300], [GATE[0], GATE[1], 760], [0, 3300, 1300], [-1050, 2600, 480], [1050, 2600, 480], [GROVE[0], GROVE[1], 600], [YARD[0], YARD[1], 580], [FIRE[0], FIRE[1], 340],
  [0, WELCOME, 420], [GIANTS_LADDER[0], GIANTS_LADDER[1], 160], [-450, ARCH_S, 200], [450, ARCH_S, 200], [-470, ARCH_N, 200], [470, ARCH_N, 200]].concat(COTS.map(([x, y, , r]) => [x, y, r * 2.3]));
const distSeg = (px, py, [ax, ay], [bx, by]) => { const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, t = L ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)) : 0; return Math.hypot(px - ax - dx * t, py - ay - dy * t); };
const pathDist = (x, y) => { let d = Infinity; for (const [pts, w] of PATHS) for (let j = 1; j < pts.length; j++) d = Math.min(d, distSeg(x, y, pts[j - 1], pts[j]) - w / 2); return d; };
// which of a giant's roots to leave out: any that would run into a building, or lie low across a path
function rootMask(x, y, h, r, sd) {
  let m = 0;
  for (const Q of giantRoots(h, r, sd, 0, true)) {
    const C = new THREE.CatmullRomCurve3(Q.pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
    for (let k = 0; k <= 24; k++) { const t = k / 24, P = C.getPointAt(t), rad = Q.rad(t), wx = x + P.x, wy = y + P.y;
      if (STRUCTS.some(([sx, sy, sr]) => Math.hypot(wx - sx, wy - sy) < sr + rad) || (P.z - rad < 190 && pathDist(wx, wy) < rad + 40) || Math.abs(wy - streamY(wx)) < 300 + rad) { m |= 1 << Q.i; break; } }
  }
  return m;
}
// where the village's stations and people stand (local frame; yaw in radians as the player's: Math.PI faces +Y)
export const VSPOTS = {
  spawn: [0, -2700, Math.PI],
  shop: { at: [SHOP[0] + 760, SHOP[1]], npc: [SHOP[0] + 410, SHOP[1], -Math.PI / 2], yaw: 0 },
  gunshop: { at: [FORGE[0] + 700, FORGE[1]], npc: [FORGE[0] + 420, FORGE[1], -Math.PI / 2], yaw: 0 },
  wardrobe: { at: [HOME[0] + 640, HOME[1] - 260], mirror: [HOME[0] + 640, HOME[1] + 260], yaw: 0 },
  lectern: { at: [LECT[0] - 100, LECT[1]], npc: [LECT[0] + 130, LECT[1], Math.PI / 2], yaw: 180 },
  trainer: { at: [YARD[0] - 400, YARD[1] + 100], npc: [YARD[0] - 220, YARD[1] + 200, Math.PI / 2 + 0.5], yaw: 0 },
  gate: { at: [GATE[0], GATE[1] - 100], npc: [520, GATE[1] - 400, 0.3] },
  casino: {
    c: CASINO,
    // at: where you stand to play; table: where the table stands (and how it is turned); npc: the dealer, facing you
    roulette: { at: [CASINO[0] - 380, CASINO[1] - 470], table: [CASINO[0] - 380, CASINO[1] - 620, 0], npc: [CASINO[0] - 380, CASINO[1] - 760, Math.PI] },
    blackjack: { at: [CASINO[0] - 380, CASINO[1] + 440], table: [CASINO[0] - 380, CASINO[1] + 590, 0], npc: [CASINO[0] - 380, CASINO[1] + 730, 0] },
    dice: { at: [CASINO[0] + 420, CASINO[1] - 480], table: [CASINO[0] + 420, CASINO[1] - 620, 0], npc: [CASINO[0] + 420, CASINO[1] - 740, Math.PI] },
    slots: [[CASINO[0] + 620, CASINO[1] + 160], [CASINO[0] + 620, CASINO[1] + 380], [CASINO[0] + 620, CASINO[1] + 600]],
    T: 0.7, SL: 0.66, slotOut: 62,   // the tables and machines are built at gnome height: scaled by T and SL; a machine stands slotOut beyond where you play it
  },
  // the villagers, each about something: two at the well, one on the bridge watching the water, one by the fire, one at
  // the market cart, one with the standing stones
  folk: [[-150, -205, -1.39], [95, -250, 1.75], [1990, -1330, 0.15], [FIRE[0] + 255, FIRE[1] + 52, 1.37], [560, 920, 1.02], [GROVE[0] - 140, GROVE[1] - 560, -2.6]],
  fire: FIRE,
  signs: [],   // painted signs: { kind, o, at: [x, y, z], face: [x, y], h, glow } (filled in as the village is built; hung by village.js)
  smoke: [],   // chimney tops, for the smoke
};

export function buildVillage(M, cx, cy) {
  const { Box, Cyl, Glow, Lamp, Ball, Shape, Solid, Blocker, Ramp, Oct } = M;
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }, rr = (a, b) => a + rnd() * (b - a);
  const S = (pair, x, y, z = 0, yaw = 0, s = 1) => Shape(pair[0], pair[1], V(x, y, z), R(0, yaw, 0), 0xffffff, s);
  const lit = (x, y, z, c = { r: 1, g: 0.78, b: 0.45 }, r = 900) => { Glow(V(x, y, z), V(22, 22, 26), 0xffd27a, 2); Lamp(V(x, y, z + 10), c, 2.2, r, false); };
  // a lantern on a rope: an iron cap, a warm glass, a little cage; every other one throws light
  let lampN = 0;
  const hang = (x, y, top, z, col = 0xffc870) => {
    Box(V(x, y, (top + z + 30) / 2), V(2.4, 2.4, top - z - 30), 0x2a2018, false, false);
    Cyl(V(x, y, z + 26), 26, 8, VC.iron, false, false); Glow(V(x, y, z), V(24, 24, 34), col, 2); Cyl(V(x, y, z - 22), 20, 6, VC.iron, false, false);
    for (const [u, v] of [[-11, -11], [11, -11], [-11, 11], [11, 11]]) Box(V(x + u, y + v, z + 2), V(1.6, 1.6, 44), VC.iron, false, false);
    if (lampN++ % 2 === 0) Lamp(V(x, y, z - 10), { r: 1, g: 0.72, b: 0.42 }, 1.9, 800, false);
  };
  // a lantern standing on a counter or a sill: z is the top it stands on
  const tableLamp = (x, y, z, col = 0xffd27a) => {
    Cyl(V(x, y, z + 3), 15, 6, VC.iron, false, false); Glow(V(x, y, z + 21), V(17, 17, 24), col, 2); Cyl(V(x, y, z + 37), 17, 6, VC.iron, false, false); Cyl(V(x, y, z + 43), 7, 6, VC.iron, false, false);
    for (const [u, v] of [[-9, -9], [9, -9], [-9, 9], [9, 9]]) Box(V(x + u, y + v, z + 20), V(1.6, 1.6, 32), VC.iron, false, false);
    for (const s of [-1, 1]) Box(V(x, y + s * 7, z + 52), V(2, 2, 14), VC.iron, false, false); Box(V(x, y, z + 59), V(2, 16, 2), VC.iron, false, false);
  };
  // a small lantern on a short chain from a ceiling at `top`, its flame at z
  const lampHang = (x, y, top, z, col = 0xffd27a) => {
    Box(V(x, y, (top + z + 18) / 2), V(2, 2, top - z - 18), 0x2a2018, false, false); Cyl(V(x, y, z + 15), 15, 5, VC.iron, false, false); Cyl(V(x, y, z + 20), 6, 5, VC.iron, false, false);
    Glow(V(x, y, z), V(15, 15, 22), col, 2); Cyl(V(x, y, z - 13), 12, 4, VC.iron, false, false);
    for (const [u, v] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) Box(V(x + u, y + v, z + 1), V(1.5, 1.5, 28), VC.iron, false, false);
  };
  const post = (x, y, h = 300, side = 1, light = true) => { S(lanternPost(h, Math.abs(Math.round(x + y)) % 4), x, y, 0, side < 0 ? 0 : 180); Solid(V(x, y, h / 2), V(24, 24, h), false); if (light) lit(x + (side < 0 ? 62 : -62), y, h - 58); };
  const avoid = [];   // circles kept clear of planting: [x, y, r]
  // a mushroom cottage's body: round, as its stem is (eight sides from four boxes), not a square with empty corners
  const stemBody = (x, y, h, r) => { const R0 = r * 1.12; for (const yw of [0, 45]) { Solid(V(x, y, h / 2), V(R0 * 2, R0 * 0.83, h), true, yw); Solid(V(x, y, h / 2), V(R0 * 0.83, R0 * 2, h), true, yw); } };
  const bodies = [], rootPts = [], pend = [];   // what a hanging lantern must keep out of: [x, y, r, top]; the giants' roots, sampled; lanterns waiting to be hung
  const onStream = (x, y, pad = 0) => Math.abs(y - streamY(x)) < 300 + pad;
  const clear = (x, y, pad = 0) => Math.abs(x) < VSIZE + 1400 && Math.abs(y) < VSIZE + 1400 && !avoid.some(([ax, ay, r]) => Math.hypot(x - ax, y - ay) < r + pad) && !rootPts.some(([rx, ry, rz, rad]) => rz - rad < 160 && Math.hypot(x - rx, y - ry) < rad + pad + 20) && pathDist(x, y) > pad * 0.5 && !onStream(x, y, pad * 0.5);
  // things planted by hand: a spot, kept only if it is clear (so nothing grows through a wall, a root or the road)
  const plant = (x, y, pad, fn) => { if (!clear(x, y, pad)) return false; fn(x, y); avoid.push([x, y, pad * 0.6]); return true; };
  VSPOTS.signs.length = 0; VSPOTS.smoke.length = 0;   // a rebuilt village starts its lists again
  M.at({ x: cx, y: cy, z: 0, rot: 0 }, () => {
    // ---- the ground: deep moss, darker and mossier under the giants, sunnier meadow where the canopy opens, worn earth
    // where feet go (each patch at its own height, so overlapping ones never fight)
    Box(V(0, 0, -60), V(30000, 30000, 120), 0x4c7030, true, false);
    let gN = 0; const patch = (x, y, d, c) => Cyl(V(x, y, 0.3 + (gN++) * 0.03), d, 1, c, false, false);
    for (const [x, y, d, c] of [[1400, -700, 1600, 0x5e8a3a], [-200, -2650, 1500, 0x5a8638], [-1500, 2300, 1300, 0x56803a], [2000, 1500, 1200, 0x5a8638], [-2300, -1600, 1100, 0x527a34], [600, 2300, 1100, 0x5a8236], [2300, -1300, 1000, 0x56803a], [-600, 900, 900, 0x5a8638]]) patch(x, y, d, c);
    for (const [x, y, d] of [[SHOP[0] + 820, 0, 420], [FORGE[0] + 700, FORGE[1], 420], [FORGE[0] + 150, FORGE[1] - 380, 520], [GROVE[0] - 80, GROVE[1], 300], [HOME[0] + 820, HOME[1], 300], [-1200, -2900, 260]]) patch(x, y, d, 0x6a5a3a);
    // ---- the paths: one ribbon of soft dirt each, wavering, two tones blotched through it, edged here and there with
    // pebbles, each a hair above the last so where two meet they do not fight
    let pathN = 0;
    const path = (pts, w, col = 0x8c6c48) => {
      const pz = 2.6 + (pathN++) * 0.25;
      const segs = []; for (let k = 0; k < pts.length - 1; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / 60)); for (let i = 0; i < n; i++) segs.push([x0 + (x1 - x0) * (i / n), y0 + (y1 - y0) * (i / n), -(y1 - y0) / L, (x1 - x0) / L]); }
      { const [x1, y1] = pts[pts.length - 1], q = segs[segs.length - 1]; segs.push([x1, y1, q[2], q[3]]); }
      const x0 = segs[0][0], y0 = segs[0][1], key = 'vpath|' + pts.flat().map(Math.round).join(',') + '|' + w + '|' + col, dk = dark(col, 0.86), lt = mix(col, 0x6a8a3a, 0.3);
      Shape(key, () => { const pos = [], cl = [], idx = [], C = new THREE.Color(); const N = segs.length;
        for (let i = 0; i < N; i++) { const [x, y, nx, ny] = segs[i], hw = w * 0.5 * (0.9 + 0.12 * Math.sin(i * 0.7) + 0.06 * Math.sin(i * 2.3)); for (let j = 0; j <= 4; j++) { const e = (j / 4 - 0.5) * 2 * hw, px = x + nx * e - x0, py = y + ny * e - y0, n = Math.sin(px * 0.011 + py * 0.007) + Math.sin(px * 0.023 - py * 0.017); pos.push(px, py, 0); C.setHex(j === 0 || j === 4 ? lt : n > 0.9 ? lt : n < -0.8 ? dk : col, THREE.NoColorSpace); cl.push(C.r, C.g, C.b); } }
        for (let i = 0; i < N - 1; i++) for (let j = 0; j < 4; j++) { const a = i * 5 + j, b2 = a + 1, c = a + 5, d = c + 1; idx.push(a, c, b2, b2, c, d); }
        return { pos, col: cl, idx }; }, V(x0, y0, pz), R(0, 0, 0));
      for (let i = 0; i < segs.length; i += 3) { if (rnd() < 0.45) continue; const [x, y, nx, ny] = segs[i]; const sd = rnd() < 0.5 ? -1 : 1, e = sd * (w / 2 + rr(-6, 8)); Oct(V(x + nx * e, y + ny * e, pz + 2 + rr(0, 2)), V(rr(22, 40), rr(18, 32), 8), mix(VC.stone, VC.moss, rnd() * 0.5), false, false, R(0, rr(0, 90), 0)); }
    };
    for (const [pts, w] of PATHS) path(pts, w);

    // ---- the square: cobbles laid in rings round the well, a kerb; four lamp posts on the diagonals with a bench before
    // each facing the well, tubs of flowers either side of each street where it leaves, string lights post to post
    avoid.push([0, 0, SQ + 60]);
    S(cobbleSquare(130, SQ, 52), 0, 0, 1.2, 0);
    bodies.push([0, 0, 220, 360]);
    S(wellFine(), 0, 0, 0, 0); Solid(V(0, 0, 60), V(236, 236, 120), true); for (const sy of [-1, 1]) Solid(V(0, sy * 88, 200), V(20, 20, 180), false);
    const SQH = 560, SQL = 600, lampA = [0, 1, 2, 3].map((i) => (i / 4) * Math.PI * 2 + Math.PI / 4);
    for (const a of lampA) { const x = Math.cos(a) * SQL, y = Math.sin(a) * SQL; S(lanternPost(SQH, Math.round(a * 3)), x, y, 0, (a * 180) / Math.PI + 180); Solid(V(x, y, SQH / 2), V(24, 24, SQH), false); lit(x - Math.cos(a) * 62, y - Math.sin(a) * 62, SQH - 58, undefined, 1200);
      const bx = Math.cos(a) * 470, by = Math.sin(a) * 470, yw = (a * 180) / Math.PI + 90; S(bench(200, VC.woodL, VC.woodD), bx, by, 0, yw); Solid(V(bx, by, 22), V(200, 44, 44), false, yw); }
    for (const ax of [0, 90, 180, 270]) for (const s of [-1, 1]) { const a = ((ax + s * 27) * Math.PI) / 180, x = Math.cos(a) * 610, y = Math.sin(a) * 610; S(planter(46, [0xf08aa8, 0xf6d04a, 0xffffff, 0xa070d0][(ax / 90 + (s > 0 ? 1 : 0)) % 4], ax / 90 + s), x, y, 0, rr(0, 360)); Solid(V(x, y, 30), V(84, 84, 60), false); }
    // string lights: paper lanterns hung from post to post round the square
    const paper = (x0, y0, z0, x1, y1, z1, sag = 60) => {
      const n = Math.max(4, Math.round(Math.hypot(x1 - x0, y1 - y0) / 110)), cols = [0xff9a5a, 0xffd27a, 0xff6a5a, 0xffe6a0]; let p = null;
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, z = z0 + (z1 - z0) * t - Math.sin(t * Math.PI) * sag;
        if (p) { const L = Math.hypot(x - p[0], y - p[1], z - p[2]), yaw = (Math.atan2(y - p[1], x - p[0]) * 180) / Math.PI, pitch = (Math.atan2(z - p[2], Math.hypot(x - p[0], y - p[1])) * 180) / Math.PI; M.BoxRot(V((x + p[0]) / 2, (y + p[1]) / 2, (z + p[2]) / 2), V(L + 1, 1.6, 1.6), 0x2a2018, R(pitch, yaw, 0), false); }
        if (i > 0 && i < n) { Box(V(x, y, z - 6), V(2, 2, 12), 0x2a2018, false, false); Glow(V(x, y, z - 26), V(26, 26, 32), cols[i % 4], 2); Cyl(V(x, y, z - 9), 16, 4, 0x3a2418, false, false); Cyl(V(x, y, z - 43), 14, 4, 0x3a2418, false, false); }
        p = [x, y, z];
      }
    };
    for (let i = 0; i < 4; i++) { const a = lampA[i], b = lampA[(i + 1) % 4]; paper(Math.cos(a) * SQL, Math.sin(a) * SQL, SQH - 20, Math.cos(b) * SQL, Math.sin(b) * SQL, SQH - 20, 80); }
    // a market cart of pumpkins on the square's north side, its handles down, crates by it
    S(cart(1, 1), 430, 840, 0, 200); Solid(V(430, 840, 60), V(200, 120, 120), false, 200); avoid.push([430, 840, 200]);
    for (const [u, v] of [[540, 760], [585, 830]]) { S(crate(60, Math.round(u)), u, v, 0, rr(-15, 15)); Solid(V(u, v, 26), V(60, 60, 52), false); }

    // ---- the old giants, moss thick round their feet; their roots arch out across the ground
    for (const [x, y, h, r, sd] of GIANTS) {
      const mask = rootMask(x, y, h, r, sd);
      S(giantTree(h, r, sd, [0x3e6a2c, 0x46722e, 0x3a6230][sd % 3], mask, sd === 3 ? 908 : 0), x, y, 0, 0);   // (the third giant carries the treehouse)
      Solid(V(x, y, h / 2), V(r * 2, r * 2, h), true); Solid(V(x, y, 260), V(r * 2.7, r * 2.7, 520), true);
      // each root gets a body along it wherever it is low enough to walk into; where it arches high you can walk under it
      for (const Q of giantRoots(h, r, sd, mask)) { const C = new THREE.CatmullRomCurve3(Q.pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal'), L = C.getLength();
        for (let d = 0; d < L; d += 60) { const t = d / L, P = C.getPointAt(t), rad = Q.rad(t); rootPts.push([x + P.x, y + P.y, P.z, rad]); if (P.z - rad > 170 || Math.hypot(P.x, P.y) < r * 1.3) continue; const top = Math.max(30, P.z + rad * 0.85); Solid(V(x + P.x, y + P.y, top / 2), V(rad * 1.45, rad * 1.45, top), false); } }
      avoid.push([x, y, r * 1.2]);
      patch(x, y, r * 5.2, 0x4a7a2c); patch(x, y, r * 3.6, 0x426e28);
      bodies.push([x, y, r * 1.3, h]);
      // lanterns on ropes only where a limb reaches out over the high street (settled once everything is placed)
      for (const L of giantLimbs(h, r, sd)) { const ca = Math.cos(L.a), sa = Math.sin(L.a), C = new THREE.CatmullRomCurve3([[ca * r * 0.3, sa * r * 0.3, L.z0 - r * 0.3], [ca * L.L * 0.5, sa * L.L * 0.5, L.z0 + h * 0.06], L.tip].map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
        for (const t of [0.6, 0.85]) { const P = C.getPointAt(t), px = x + P.x, py = y + P.y; if (Math.abs(px) < 420 && py > -3000 && py < GATE[1] - 300 && Math.hypot(px, py) > SQ + 150) pend.push([px, py, P.z, rr(380, 620), t > 0.7 ? 0xffb860 : 0xffd27a]); } }
    }
    // roots that have broken the surface and arch over the roads, a lantern under each
    for (const [x, y, yaw, span, hg] of [[0, ARCH_S, 0, 860, 520], [0, ARCH_N, 8, 900, 560]]) {
      S(rootArch(span, hg, 72, Math.round(x + y)), x, y, 0, yaw); const a = (yaw * Math.PI) / 180;
      for (const s of [-1, 1]) { Solid(V(x + Math.cos(a) * s * (span / 2 + 20), y + Math.sin(a) * s * (span / 2 + 20), hg / 2), V(150, 150, hg), true, yaw); avoid.push([x + Math.cos(a) * s * (span / 2 + 20), y + Math.sin(a) * s * (span / 2 + 20), 170]); }
      hang(x, y, hg - 70, hg - 190);
      // ferns and a cluster of caps round each foot
      for (const s of [-1, 1]) { const fx = x + Math.cos(a) * s * (span / 2 + 60), fy = y + Math.sin(a) * s * (span / 2 + 60); for (let k = 0; k < 3; k++) { const b = k * 2.1 + s, px = fx + Math.cos(b) * 150, py = fy + Math.sin(b) * 150; if (pathDist(px, py) > 30 && !onStream(px, py, 20)) { const [kk, bb] = fern(90, k + 3); Shape(kk, bb, V(px, py, 0), R(0, rr(0, 360), 0)); } } const [kk, bb] = toadstoolCluster(1.1, 0xc8392e, 3 + s); if (!onStream(fx, fy + 60)) Shape(kk, bb, V(fx + 40 * s, fy + 60, 0), R(0, 40, 0)); }
    }

    // ---- the stream, west to east across the south of the hollow: one ribbon of water, deeper blue down its middle, a
    // lip of mud and grass along each bank, stones where it bends, reeds in clumps, lily pads in its slow reaches; a
    // humped bridge for the road
    { const xs = []; for (let x = -4800; x <= 4800; x += 80) xs.push(x);
      const at = (x) => { const y = streamY(x), dy = (streamY(x + 20) - streamY(x - 20)) / 40, L = Math.hypot(1, dy); return [y, -dy / L, 1 / L]; };   // centre, and the normal across it
      Shape('vstream2', () => { const pos = [], cl = [], idx = [], C = new THREE.Color(), W = 260, n = 8;
        for (const x of xs) { const [y, nx, ny] = at(x); for (let j = 0; j <= n; j++) { const e = (j / n - 0.5) * 2, k = Math.abs(e); pos.push(x + nx * e * W, y + ny * e * W, 1.4 + (1 - k) * 0.3); C.setHex(k > 0.86 ? 0x5a8a7a : k > 0.6 ? 0x4a8a98 : k > 0.25 ? 0x3e7a8a : 0x356c7e, THREE.NoColorSpace); cl.push(C.r, C.g, C.b); } }
        for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < n; j++) { const a = i * (n + 1) + j, b2 = a + 1, c = a + n + 1, d = c + 1; idx.push(a, c, b2, b2, c, d); }
        return { pos, col: cl, idx }; }, V(0, 0, 0), R(0, 0, 0));
      for (const sd of [-1, 1]) Shape('vbank' + sd, () => { const pos = [], cl = [], idx = [], C = new THREE.Color(), cols = [0x5a4a32, 0x6a5a3a, 0x5a7a34, 0x4e7030], offs = [248, 268, 292, 320], zs = [1.2, 4.5, 4, 0.6];
        for (const x of xs) { const [y, nx, ny] = at(x); for (let j = 0; j < 4; j++) { const o = sd * (offs[j] + Math.sin(x * 0.013 + sd) * 6); pos.push(x + nx * o, y + ny * o, zs[j]); C.setHex(cols[j], THREE.NoColorSpace); cl.push(C.r, C.g, C.b); } }
        for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < 3; j++) { const a = i * 4 + j, b2 = a + 1, c = a + 4, d = c + 1; if (sd > 0) idx.push(a, c, b2, b2, c, d); else idx.push(a, b2, c, b2, d, c); }
        return { pos, col: cl, idx }; }, V(0, 0, 0), R(0, 0, 0));
      const offGiant = (px, py) => !GIANTS.some(([gx, gy, , gr]) => Math.hypot(px - gx, py - gy) < gr * 1.6) && !rootPts.some(([rx, ry, rz, rad]) => rz - rad < 150 && Math.hypot(px - rx, py - ry) < rad + 50);
      // stones on the outside of each bend, reeds in clumps on alternate banks, lilies in three still reaches
      for (const x of [-3400, -2700, -1250, -700, 820, 1500, 2350, 3300]) { const [y, nx, ny] = at(x), sd = (streamY(x + 400) + streamY(x - 400) - 2 * y) > 0 ? -1 : 1; for (let k = 0; k < 3; k++) { const o = sd * (250 + k * 30), px = x + k * 60 - 60 + nx * o, py = y + ny * o; if (!offGiant(px, py)) continue; const r2 = [70, 46, 30][k]; S(rock(r2, 70 + k + Math.round(x / 100)), px, py, -r2 * 0.2, rr(0, 360)); Solid(V(px, py, r2 * 0.4), V(r2 * 1.5, r2 * 1.3, r2 * 0.8), false); avoid.push([px, py, r2 * 1.1]); } }
      let ri = 0; for (let x = -3600; x <= 3600; x += 320) { if (Math.abs(x) < 520 || Math.abs(x - -2150) < 260) continue; const [y, nx, ny] = at(x), sd = ri++ % 2 ? 1 : -1, o = sd * rr(225, 255), px = x + rr(-60, 60) + nx * o, py = y + ny * o; if (!offGiant(px, py)) continue; S(reeds(rr(100, 150), ri), px, py, 0, rr(0, 360)); if (rnd() < 0.5) S(reeds(90, ri + 2), px + rr(40, 80), py + nx * 20, 0, rr(0, 360)); }
      for (const [x, k] of [[-2900, 0.55], [1150, -0.5], [2800, 0.5]]) { const [y, nx, ny] = at(x); S(lilies(130, Math.round(x)), x + nx * k * 260, y + ny * k * 260, 1.6, rr(0, 360)); }
      avoid.push([0, STREAM_Y, 650]);
      const y0 = STREAM_Y - 600, y1 = STREAM_Y - 220, y2 = STREAM_Y + 220, y3 = STREAM_Y + 600, top = 80;
      Ramp(V(0, y0, 0), V(0, y1, top), 440, VC.woodL); Ramp(V(0, y3, 0), V(0, y2, top), 440, VC.woodL); Box(V(0, STREAM_Y, top - 14), V(440, y2 - y1 + 20, 28), VC.woodL, true, false);
      for (let y = y0 + 30; y < y3; y += 44) Box(V(0, y, (y < y1 ? ((y - y0) / (y1 - y0)) * top : y > y2 ? ((y3 - y) / (y3 - y2)) * top : top) + 1), V(450, 8, 4), VC.woodD, false, false);
      for (const sx of [-1, 1]) { for (const y of [y1, y2]) Oct(V(sx * 200, y, 30), V(110, 110, 70), mix(VC.stone, VC.moss, 0.4), true, false); for (let y = y0; y <= y3; y += 160) { const h = (y < y1 ? ((y - y0) / (y1 - y0)) * top : y > y2 ? ((y3 - y) / (y3 - y2)) * top : top); Cyl(V(sx * 224, y, h + 45), 14, 90, VC.woodD, true, false); } Box(V(sx * 224, STREAM_Y, top + 88), V(12, y2 - y1, 10), VC.wood, false, false); }
      for (const [x, y] of [[-300, y0 - 60], [300, y3 + 60]]) post(x, y, 300, x < 0 ? -1 : 1); }

    // ---- Bramble & Bolt: Mossbottom's red-capped cottage at the end of the west street, its counter facing the square.
    // Clothes only now: hats piled on the counter, shirts folded, bolts of cloth on a rack, a dress form and a hat stand
    { const [x, y] = SHOP; S(shroomHouse(500, 310, 0xc8392e, VC.cream, 3), x, y, 0, 0); stemBody(x, y, 500, 310); avoid.push([x, y, 760]); bodies.push([x, y, 310 * 2.3, 1100]);
      const ct = [x + 590, y]; Box(V(ct[0], ct[1], 42), V(90, 620, 84), VC.woodL, true, true); Box(V(ct[0] + 4, ct[1], 88), V(110, 650, 12), VC.woodD, false, false);
      for (let i = 0; i < 6; i++) Box(V(ct[0] + 46, ct[1] - 270 + i * 108, 42), V(4, 80, 64), dark(VC.woodL, 0.85), false, false);
      { const [k, b] = awning(760, 300, 70, 0xc8392e, 0xf4ecd6, 8); Shape(k, b, V(ct[0] - 110, ct[1], 330), R(0, -90, 0)); }
      for (const s of [-1, 1]) Cyl(V(ct[0] + 40, ct[1] + s * 370, 160), 16, 320, VC.woodD, true, false);
      // on the counter: a brass till, a pile of hats, folded shirts, a lantern; a hat stand and a dress form beside it
      Box(V(ct[0], ct[1] + 220, 116), V(50, 70, 44), VC.brass, false, false); Box(V(ct[0], ct[1] + 220, 144), V(40, 60, 14), dark(VC.brass, 0.7), false, false);
      for (let i = 0; i < 3; i++) Cyl(V(ct[0], ct[1] - 200 + i * 10, 100 + i * 14), 60 - i * 8, 12, [0xc8392e, 0x3a6a8a, 0x5a8a3a][i], false, false);
      for (let i = 0; i < 4; i++) Box(V(ct[0], ct[1] + 20 + (i % 2) * 6, 98 + i * 9), V(60, 70, 8), [0xe8d8b0, 0x8a4a5a, 0x4a6a8a, 0xd8a03a][i], false, false);
      tableLamp(ct[0] - 10, ct[1] - 290, 94); Lamp(V(ct[0] + 60, ct[1], 260), { r: 1, g: 0.8, b: 0.5 }, 2, 700, false);
      S(hatStand(), ct[0] + 120, ct[1] + 470, 0, 0); Solid(V(ct[0] + 120, ct[1] + 470, 90), V(60, 60, 180), false);
      S(dressForm(0x8a4a5a), ct[0] + 120, ct[1] - 470, 0, 180); Solid(V(ct[0] + 120, ct[1] - 470, 110), V(70, 70, 220), false);
      // a rack of cloth on bolts against the house, south of the counter: a frame and five rolls in the shop's colours
      S(clothRack(220, 1), x + 410, y + 440, 0, 0); Solid(V(x + 410, y + 440, 70), V(70, 236, 140), false); avoid.push([x + 410, y + 440, 150]);   // bolts of cloth on a draper's rack, ends to the street
      VSPOTS.signs.push({ kind: 'wood', o: { text: 'Bramble & Bolt', sub: 'clothes, hats & trinkets', w: 1000, h: 280, leaves: true, seed: 3 }, at: [x + 490, y, 430], face: [1, 0], h: 110 });
      for (const s of [-1, 1]) Box(V(x + 486, y + s * 150, 520), V(3, 3, 70), VC.iron, false, false);
      for (const [dx, dy] of [[150, 560], [215, 600]]) { const [k, b] = barrel(0x7a5232, 0x2a2420); Shape(k, b, V(x + dx, y + dy, 0), R(0, dx, 0)); Solid(V(x + dx, y + dy, 55), V(84, 84, 110), true); }
      S(crate(64, 2), x + 280, y + 640, 0, 12); Solid(V(x + 280, y + 640, 27), V(64, 64, 54), false); }

    // ---- Flintwhistle's forge: a stone-and-timber smithy on the stream bank at the end of the mill lane. Its counter faces
    // the lane, the guns racked behind it; the hearth glows in the yard between the smithy and the water, and the
    // waterwheel in the stream drives the bellows down its axle. An anvil, a quench trough, a grindstone, coal, kegs
    { const [x, y] = FORGE; S(thatchCottage(600, 480, 300, 0x9a8c78, 6), x, y, 0, 0); Solid(V(x, y, 230), V(640, 520, 460), true); avoid.push([x, y, 560]); bodies.push([x, y, 470, 900], [x + 120, y - 400, 160, 600]);
      const ct = [x + 520, y], dark2 = 0x3a2a1e;
      Box(V(ct[0], ct[1], 42), V(90, 600, 84), 0x5a4030, true, true); Box(V(ct[0] + 4, ct[1], 88), V(110, 630, 12), dark2, false, false); for (const s of [-1, 1]) Box(V(ct[0] + 47, ct[1] + s * 250, 42), V(4, 40, 70), VC.iron, false, false);
      { const [k, b] = awning(740, 300, 70, 0x3a4a5a, 0xd8c8a0, 8); Shape(k, b, V(ct[0] - 110, ct[1], 330), R(0, -90, 0)); }
      for (const s of [-1, 1]) Cyl(V(ct[0] + 40, ct[1] + s * 360, 160), 16, 320, dark2, true, false);
      // the rack behind the counter: a board on two posts, six long guns on pegs
      { const rx = ct[0] - 205; Box(V(rx, ct[1], 190), V(14, 520, 190), dark2, false, false); for (const s of [-1, 1]) Box(V(rx, ct[1] + s * 270, 150), V(20, 20, 300), dark2, true, false);
        for (let i = 0; i < 6; i++) { const gy = ct[1] - 210 + i * 84, l = 150 + (i % 3) * 20; Box(V(rx + 12, gy, 160 + l / 2), V(8, 8, l), VC.iron, false, false); Box(V(rx + 12, gy + 4, 140), V(10, 22, 50), [0x7a4a2a, 0x5a3a22, 0x8a5a34][i % 3], false, false); Box(V(rx + 14, gy, 210), V(6, 14, 24), VC.brass, false, false); } }
      // on the counter: a revolver on a cloth, a box of shells, a lantern
      Box(V(ct[0], ct[1] - 100, 95), V(70, 110, 2), 0x2a4a3a, false, false); Box(V(ct[0], ct[1] - 100, 100), V(14, 60, 8), VC.iron, false, false); Box(V(ct[0], ct[1] - 124, 104), V(10, 18, 16), 0x7a4a2a, false, false);
      Box(V(ct[0], ct[1] + 160, 106), V(40, 60, 24), 0x8a2a22, false, false); tableLamp(ct[0] - 10, ct[1] + 260, 94); Lamp(V(ct[0] + 60, ct[1], 260), { r: 1, g: 0.78, b: 0.5 }, 2, 700, false);
      // the hearth in the yard: a stone hearth, coals, a hood and a stack, its bellows by it
      { const fx = x + 120, fy = y - 400; Box(V(fx, fy, 50), V(200, 160, 100), 0x6a645a, true, true); Box(V(fx, fy, 101), V(150, 110, 4), 0x2a1a10, false, false); Glow(V(fx, fy, 104), V(130, 90, 6), 0xff6a1a, 2); Glow(V(fx, fy, 116), V(80, 50, 20), 0xffb04a, 2);
        Box(V(fx, fy, 260), V(220, 180, 40), 0x4a4038, false, false); for (const sx of [-1, 1]) for (const sy of [-1, 1]) Box(V(fx + sx * 96, fy + sy * 76, 160), V(14, 14, 120), 0x4a4038, false, false); Box(V(fx, fy, 420), V(70, 70, 300), 0x5a5048, true, false); Lamp(V(fx, fy, 160), { r: 1, g: 0.5, b: 0.2 }, 2.4, 800, false); VSPOTS.smoke.push([fx, fy, 600]);
        Box(V(fx - 150, fy, 60), V(90, 60, 40), 0x6a3a22, false, false); Box(V(fx - 150, fy, 84), V(70, 50, 8), 0x3a2a1e, false, false); Box(V(fx - 104, fy, 70), V(24, 12, 10), 0x3a2a1e, false, false);
        // the anvil and its hammer east of the hearth, the quench trough and the grindstone toward the counter, coal heaped
        // against the smithy wall, fuel stacked on the west wall
        S(anvil(), fx + 230, fy + 40, 0, 20); Solid(V(fx + 230, fy + 40, 50), V(70, 70, 100), false);
        S(trough(160), fx + 300, fy - 80, 0, 0); Solid(V(fx + 300, fy - 80, 30), V(160, 50, 60), false);
        S(grindstone(), fx + 430, fy - 30, 0, 80); Solid(V(fx + 430, fy - 30, 50), V(80, 60, 100), false);
        for (let i = 0; i < 9; i++) { const a = i * 0.7, d = (i % 3) * 16; Ball(V(fx - 140 + Math.cos(a) * d, fy + 98 + Math.sin(a) * d, 10 + (2 - (i % 3)) * 8), V(30 - (i % 3) * 5, 28, 20), 0x1e1e22); }
        S(woodpile(200, 4, 2), x - 352, y - 60, 0, 90); Solid(V(x - 352, y - 60, 45), V(60, 200, 90), false); }
      // the waterwheel in the stream, its axle running back through the bellows housing to the smithy wall
      { const wx = x - 100, wy = streamY(wx) + 230; S(waterwheel(170, 70, wy + 300 > y - 240 ? y - 240 - wy : 300), wx, wy, 90, 0); Solid(V(wx, wy, 120), V(380, 110, 240), false); Box(V(wx, y - 300, 60), V(90, 80, 120), 0x4a4038, true, false); Box(V(wx, y - 300, 124), V(100, 90, 8), 0x3a2a1e, false, false); }
      // a target on a post, powder kegs, a crate of shot by the counter
      { const tx = x + 120, ty = y + 320; Cyl(V(tx, ty, 90), 12, 180, dark2, true, false); for (const [d, c] of [[110, 0xf2e4c6], [80, 0xc8392e], [50, 0xf2e4c6], [22, 0xc8392e]]) Cyl(V(tx + 8 - d * 0.01, ty, 200), d, 4 + (110 - d) * 0.02, c, false, false, R(0, 90, 90)); }
      for (const [dx, dy] of [[640, 330], [705, 380], [630, 410]]) { const [k, b] = barrel(0x5a3a22, 0x1a1410); Shape(k, b, V(x + dx, y + dy, 0), R(0, dx, 0)); Solid(V(x + dx, y + dy, 55), V(84, 84, 110), true); Box(V(x + dx, y + dy, 112), V(30, 30, 4), 0xc8392e, false, false); }
      VSPOTS.signs.push({ kind: 'wood', o: { text: 'The Forge', sub: 'guns worked from weapon fragments', w: 1100, h: 280, seed: 12 }, at: [x + 316, y, 400], face: [1, 0], h: 104 });
      Box(V(x + 296, y, 517), V(56, 380, 16), 0x3a2a1e, false, false); for (const s of [-1, 1]) { Box(V(x + 312, y + s * 160, 480), V(3, 3, 60), VC.iron, false, false); Box(V(x + 300, y + s * 186, 470), V(14, 14, 110), 0x3a2a1e, false, false); } }

    // ---- home: your thatched cottage in the north-west, and before its door the dressing porch: a deck under a pergola
    // of climbing roses, the painted wardrobe, a folding screen, the long mirror, a rug, hats on a stand, a dresser with
    // two lamps, pots of flowers. Behind the cottage the kitchen garden, a scarecrow, the washing line and the woodpile
    { const [x, y] = HOME; S(thatchCottage(700, 560, 320, VC.cream, 2), x, y, 0, 0); Solid(V(x, y, 250), V(740, 600, 500), true); avoid.push([x, y, 560]); bodies.push([x, y, 520, 900], [x + 610, y, 520, 420]);
      const dx = x + 610, dy = y, DW = 400, DD = 860;
      Box(V(dx, dy, 12), V(DW, DD, 24), VC.woodL, true, false); for (let i = 0; i < 9; i++) Box(V(dx + (i - 4) * 44, dy, 25), V(4, DD, 2), VC.woodD, false, false);
      Box(V(dx + DW / 2 + 6, dy, 14), V(14, DD + 12, 28), VC.woodD, false, false);
      // the pergola: four posts, two beams, slats across, roses climbing the front posts
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) Cyl(V(dx + sx * (DW / 2 - 20), dy + sy * (DD / 2 - 20), 170), 18, 340, VC.woodD, true, false);
      for (const sx of [-1, 1]) Box(V(dx + sx * (DW / 2 - 20), dy, 346), V(20, DD + 60, 22), VC.woodD, false, false);
      for (let i = 0; i < 9; i++) Box(V(dx, dy - DD / 2 + 30 + i * ((DD - 60) / 8), 362), V(DW + 60, 12, 12), VC.wood, false, false);
      for (const sy of [-1, 1]) for (let k = 0; k < 7; k++) { const z = 40 + k * 44, px = dx + DW / 2 - 20 + Math.sin(k * 1.7) * 14, py = dy + sy * (DD / 2 - 20) + Math.cos(k * 1.3) * 14; Ball(V(px, py, z), V(30, 30, 26), k % 2 ? VC.leaf2 : VC.leaf); if (k % 2 === 0) Ball(V(px + 12, py, z + 8), V(12, 12, 12), [0xf08aa8, 0xc8392e, 0xf6f0e0][k % 3]); }
      for (let i = 0; i < 8; i++) { const py = dy - DD / 2 + 60 + i * ((DD - 120) / 7); Ball(V(dx + (i % 2 ? 60 : -40), py, 372), V(50, 40, 18), i % 2 ? VC.leaf : VC.leaf2); if (i % 3 === 0) Ball(V(dx + (i % 2 ? 70 : -30), py + 10, 382), V(12, 12, 10), 0xf08aa8); }
      // a round rug in the middle, the wardrobe and the mirror facing out, the screen between them
      Cyl(V(dx, dy, 25.4), 300, 1, 0x8a3a4a, false, false); Cyl(V(dx, dy, 25.8), 250, 1, 0xd8b878, false, false); Cyl(V(dx, dy, 26.2), 190, 1, 0x6a2a3a, false, false);
      S(wardrobeFine(), dx - 130, dy - 260, 24, 0); Solid(V(dx - 130, dy - 260, 160), V(100, 190, 320), true);
      S(mirror(), dx - 110, dy + 260, 24, 0); Solid(V(dx - 115, dy + 260, 120), V(30, 120, 240), false);
      S(dressScreen(), dx - 150, dy, 24, 0); Solid(V(dx - 150, dy, 120), V(60, 200, 240), false);
      S(hatStand(), dx + 120, dy + 380, 24, 0); Solid(V(dx + 120, dy + 380, 110), V(60, 60, 180), false);
      // the dresser: a low chest with two lamps and a jewellery box; a stool before it
      { const sx = dx + 110, sy = dy - 380; Box(V(sx, sy, 70), V(80, 160, 92), 0x6a4428, true, true); for (const z of [52, 88]) Box(V(sx + 41, sy, z), V(3, 140, 28), 0x7a5232, false, false); for (const z of [52, 88]) Ball(V(sx + 43, sy, z), V(6, 6, 6), VC.brass);
        for (const s of [-1, 1]) { Cyl(V(sx, sy + s * 56, 124), 14, 24, VC.brass, false, false); Glow(V(sx, sy + s * 56, 152), V(30, 30, 30), 0xffd8a0, 2); }
        Box(V(sx, sy, 124), V(30, 40, 18), 0x8a2a3a, false, false); Lamp(V(sx, sy, 200), { r: 1, g: 0.8, b: 0.55 }, 2, 600, false); }
      Cyl(V(dx + 30, dy - 250, 50), 50, 10, 0x8a3a4a, false, false); Solid(V(dx + 30, dy - 250, 50), V(44, 44, 54), false); for (const [u, v] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) Cyl(V(dx + 30 + u, dy - 250 + v, 24), 5, 48, VC.woodD, false, false);
      for (const [px, py, c] of [[dx + DW / 2 + 40, dy - 300, 0xf08aa8], [dx + DW / 2 + 40, dy + 300, 0xf6d04a], [dx + DW / 2 + 40, dy, 0xa070d0]]) { Cyl(V(px, py, 22), 50, 44, 0xb8643a, true, false); Cyl(V(px, py, 45), 56, 5, 0x8a4a2a, false, false); S(bush(36, VC.leaf2, c, Math.round(py)), px, py, 40, 0); Solid(V(px, py, 60), V(64, 64, 120), false); }
      VSPOTS.signs.push({ kind: 'wood', o: { text: 'Dressing Porch', w: 700, h: 170, leaves: true, seed: 9 }, at: [dx + DW / 2 - 10, dy, 292], face: [1, 0], h: 56 }); for (const s of [-1, 1]) Box(V(dx + DW / 2 - 14, dy + s * 90, 330), V(3, 3, 30), VC.iron, false, false); avoid.push([dx, dy, 520], [dx + DW / 2 + 200, dy, 220]);
      // the kitchen garden west of the cottage: beds of cabbages and pumpkins, a fence round three sides, a scarecrow
      { const gx = x - 800, gy = y - 150; Box(V(gx, gy, 2), V(560, 400, 3), 0x4a3424, false, false);
        for (let r2 = 0; r2 < 3; r2++) for (let c = 0; c < 4; c++) { const px = gx - 210 + c * 140, py = gy - 120 + r2 * 120; if (r2 === 1) S(pumpkin(rr(32, 44)), px, py, 0, rr(0, 360)); else S(cabbage(rr(22, 30)), px, py, 0, rr(0, 360)); Solid(V(px, py, 25), V(50, 50, 50), false); }
        for (const [fx, fy, yaw, len] of [[gx, gy - 220, 0, 600], [gx, gy + 220, 0, 600], [gx - 310, gy, 90, 440]]) { S(fence(len), fx, fy, 0, yaw); Solid(V(fx, fy, 45), yaw ? V(12, len, 90) : V(len, 12, 90), false); }
        S(dummy(2), gx - 60, gy + 60, 0, 30); Solid(V(gx - 60, gy + 60, 110), V(60, 60, 220), false);
        avoid.push([gx, gy, 420]); }
      // the washing line north of the cottage, a woodpile against its north wall, the chopping block by it
      S(washLine(420, 1), x + 50, y + 530, 0, 0); for (const e of [-1, 1]) Solid(V(x + 50 + e * 210, y + 530, 100), V(14, 14, 200), false);
      S(woodpile(240, 4, 1), x + 40, y + 330, 0, 0); Solid(V(x + 40, y + 330, 45), V(240, 60, 90), false);
      S(choppingBlock(), x + 230, y + 400, 0, 40); Solid(V(x + 230, y + 400, 25), V(56, 56, 50), false);
      avoid.push([x + 50, y + 530, 260]); }

    // ---- Mother Inkcap's grove, north-east past the second root arch: a ring of old standing stones round a still, dark
    // pool, open to the west where the lane comes in. The lectern stands on the west shore on its stone step; across the
    // water the stones that face it have runes cut in them, glowing. Blue-green caps lit round the stones' feet, books
    // stacked on the grass, lily pads and reeds in the pool
    { const [gx, gy] = GROVE, [x, y] = LECT, AI = M.world.AddInstance.bind(M.world), PR = 250, SR = 470;
      avoid.push([gx, gy, SR + 60]); bodies.push([gx, gy, SR, 300]);
      S(lecternStand(), x, y, 0, 0); Solid(V(x, y, 80), V(120, 140, 160), true);
      for (const s of [-1, 1]) Glow(V(x + 6, y + s * 74, s < 0 ? 182 : 170), V(6, 6, 11), 0xffc860, 2);
      Lamp(V(x + 4, y, 178), { r: 0.78, g: 0.72, b: 1 }, 2, 640, false);   // the book's own light: its glare sits on the pages
      // the pool: dark still water, a lip of stones round it, lily pads, reeds on the far side
      patch(gx, gy, (SR + 120) * 2, 0x4a7a2e);
      Cyl(V(gx, gy, 1.6), PR * 2 + 70, 1, 0x5a4a32, false, false); Cyl(V(gx, gy, 2.2), PR * 2, 1, 0x2e5a66, false, false); Cyl(V(gx, gy, 2.6), PR * 1.4, 1, 0x26505c, false, false);
      for (let i = 0; i < 15; i++) { const a = (i / 15) * Math.PI * 2 + 0.1; if (Math.abs(Math.atan2(Math.sin(a - Math.PI), Math.cos(a - Math.PI))) < 0.32) continue; const rs = 30 + (i % 3) * 10, qx = gx + Math.cos(a) * (PR + 16), qy = gy + Math.sin(a) * (PR + 16); S(rock(rs, 40 + i, i % 2 === 0), qx, qy, -rs * 0.2, (a * 180) / Math.PI); Solid(V(qx, qy, rs * 0.4), V(rs * 1.5, rs * 1.4, rs * 0.8), false); }
      for (const yw of [0, 45]) { Solid(V(gx, gy, 20), V(PR * 1.9, PR * 0.79, 40), false, yw); Solid(V(gx, gy, 20), V(PR * 0.79, PR * 1.9, 40), false, yw); }
      S(lilies(140, 11), gx - 40, gy + 70, 3, 30); S(lilies(100, 12), gx + 90, gy - 100, 3, 200);
      for (const a of [0.35, 0.9, -0.5]) S(reeds(130, Math.round(a * 10) + 5), gx + Math.cos(a) * (PR - 20), gy + Math.sin(a) * (PR - 20), 0, rr(0, 360));
      // the stones, round the pool, open to the west; the three across the water from the lectern carry a rune each
      const runes = { 0: [[0, -26, 0, 26], [0, 6, 16, 22], [0, 6, -16, 22]], 1: [[-14, -24, 14, 24], [14, -24, -14, 24]], [-1]: [[0, -26, 0, 26], [0, -26, 16, -10]] };
      [135, 90, 45, 0, -45, -90, -135].forEach((deg, i) => {
        const a = (deg * Math.PI) / 180, sx = gx + Math.cos(a) * SR, sy = gy + Math.sin(a) * SR, h = [250, 290, 330, 380, 330, 290, 250][i], w = [100, 92, 104, 116, 98, 92, 104][i], yw = deg - 90;
        S(standingStone(h, w, i + 1), sx, sy, 0, yw); Solid(V(sx, sy, h / 2), V(w, w * 0.4, h), true, yw);
        const rk = deg === 0 ? 0 : deg === 45 ? 1 : deg === -45 ? -1 : null;
        if (rk !== null) { const fx = -Math.cos(a), fy = -Math.sin(a), zc = h * 0.6, nz = 0.024, sd = i + 1, off = w * 0.32 * (1 - 0.3 * ((zc + 10) / (h + 20))) * (1 + (0.11 * Math.round(wob(sd, nz * 2 - 1) * 3)) / 3) * (1 + 0.15 * wob(nz * 3, sd)) + 1, rx = sx + fx * off, ry = sy + fy * off;   // the stone's own face there (as standingStone shapes it)
          for (const [u0, v0, u1, v1] of runes[rk]) { const L = Math.hypot(u1 - u0, v1 - v0), mu = (u0 + u1) / 2, mv = (v0 + v1) / 2, ang = (Math.atan2(v1 - v0, u1 - u0) * 180) / Math.PI;
            AI(0, V(rx + -fy * mu, ry + fx * mu, zc + mv), V(5, 3, L + 4), R(90 - ang, yw, 0), 0x2e8a7a, false, true, false); }
        }
        for (let k = 0; k < 2; k++) { const b = a + (k ? 0.22 : -0.22), px = gx + Math.cos(b) * (SR + 70), py = gy + Math.sin(b) * (SR + 70), [kk, bb] = toadstoolCluster(0.9 + k * 0.4, 0x7ad8c4, 40 + i * 2 + k); Shape(kk, bb, V(px, py, 0), R(0, rr(0, 360), 0)); }
      });
      // books stacked on the grass by the lectern, a crate of scrolls, a stump to sit on
      for (const [u, v, n] of [[-60, -150, 3], [30, 150, 2]]) for (let b = 0; b < n; b++) Box(V(x + u, y + v, 6 + b * 13), V(56 - b * 6, 40 - b * 4, 12), [0x6a2a3a, 0x2a3a6a, 0x3a5a2a][(b + n) % 3], false, false, b * 17 + n * 30);
      S(crate(56, 3), x - 60, y + 230, 0, 20); Solid(V(x - 60, y + 230, 24), V(56, 56, 48), false); for (let k = 0; k < 4; k++) M.Cyl(V(x - 60 - 14 + k * 9, y + 230, 54), 8, 50, 0xe8dcb8, false, false, R(80, 20 + k * 30, 0));
      S(stump(26, 40, 2), x + 20, y - 220, 0, 0); Solid(V(x + 20, y - 220, 20), V(50, 50, 40), false);
      // the sign, on a post where the lane comes in
      { const px = x - 300, py = y - 250; Cyl(V(px, py, 170), 14, 340, 0x4a2e1e, true, false); Box(V(px + 30, py + 30, 330), V(110, 12, 12), 0x4a2e1e, false, false, 45); Box(V(px + 70, py + 70, 300), V(3, 3, 50), VC.iron, false, false);
        VSPOTS.signs.push({ kind: 'wood', o: { text: 'The Lectern', sub: 'a harder road, a richer haul', w: 1000, h: 250, seed: 5 }, at: [px + 70, py + 70, 250], face: [-0.7, -0.7], h: 56 }); avoid.push([px, py, 80]); } }

    // ---- the Training Yard, across the stream south-east: a sanded ring fenced round, straw dummies, archery butts at the
    // far side, the practice weapons in a rack, hay bales to sit on, and a banner for each class on its pole
    { const [x, y] = YARD, R0 = 440;
      Cyl(V(x, y, 3), R0 * 2, 4, 0xc8b484, false, false); Cyl(V(x, y, 5), R0 * 2 - 70, 2, 0xd8c494, false, false);
      for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, m = a + Math.PI / 18; if (Math.abs(Math.atan2(Math.sin(m - Math.PI * 0.926), Math.cos(m - Math.PI * 0.926))) < 0.3) continue; S(fence(Math.round(2 * R0 * Math.sin(Math.PI / 18) + 14)), x + Math.cos(a + Math.PI / 18) * R0, y + Math.sin(a + Math.PI / 18) * R0, 0, (a * 180) / Math.PI + 10 + 90); }
      for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2 + Math.PI / 18; if (Math.abs(Math.atan2(Math.sin(a - Math.PI * 0.926), Math.cos(a - Math.PI * 0.926))) < 0.3) continue; Solid(V(x + Math.cos(a) * R0, y + Math.sin(a) * R0, 45), V(20, Math.round(2 * R0 * Math.sin(Math.PI / 18) + 14), 90), false, (a * 180) / Math.PI); }
      // the dummies, facing the gate
      for (const [u, v, t] of [[40, -160, 170], [-120, 20, 190], [150, 130, 160]]) { S(dummy(Math.round(u)), x + u, y + v, 0, t); Solid(V(x + u, y + v, 110), V(80, 80, 220), false); }
      // two straw butts at the far side
      for (const s of [-1, 1]) { const tx = x + 320, ty = y + s * 150; S(archeryButt(), tx, ty, 0, 180 + s * 12); Solid(V(tx, ty, 100), V(60, 150, 200), false); }
      // the rack of practice weapons: wooden swords, staves and a pair of padded mallets
      { const rx = x - 120, ry = y - 330; Box(V(rx, ry, 70), V(220, 30, 14), 0x5a3a22, false, false); Box(V(rx, ry, 150), V(220, 30, 14), 0x5a3a22, false, false); for (const s of [-1, 1]) Cyl(V(rx + s * 100, ry, 90), 14, 180, 0x4a2e1e, true, false);
        for (let i = 0; i < 6; i++) { const wx = rx - 80 + i * 32; Box(V(wx, ry + 8, 120), V(8, 8, 200), i % 3 === 2 ? 0x8a6a42 : 0xb8945a, false, false); if (i % 3 === 0) Box(V(wx, ry + 8, 70), V(28, 10, 6), 0x5a3a22, false, false); if (i % 3 === 2) Ball(V(wx, ry + 8, 220), V(24, 24, 30), 0x8a3a2a); }
        Solid(V(rx, ry, 100), V(230, 50, 200), false); }
      // hay bales by the fence, a water barrel
      for (const [u, v, yw] of [[-260, 260, 30], [-170, 330, 60], [-210, 300, 45]]) { if (u === -210) { const [k, b] = hay(0xd8bc6e); Shape(k, b, V(x + u, y + v, 80), R(0, yw, 0)); continue; } const [k, b] = hay(0xd8bc6e); Shape(k, b, V(x + u, y + v, 0), R(0, yw, 0)); Solid(V(x + u, y + v, 40), V(140, 90, 80), false, yw); }
      { const [k, b] = barrel(0x6a4a2a, 0x2a2420); Shape(k, b, V(x + 60, y - 330, 0), R(0, 20, 0)); Solid(V(x + 60, y - 330, 55), V(84, 84, 110), true); Cyl(V(x + 60, y - 330, 104), 70, 2, 0x3a5a66, false, false); }
      // the class banners, each on its pole round the ring
      { const cols = [0xffcd5a, 0xff6a4d, 0x6ec8ff, 0x8fe08f, 0xffa23a]; for (let i = 0; i < 5; i++) { const a = -0.3 + i * 0.62, bx = x + Math.cos(a) * (R0 + 70), by = y + Math.sin(a) * (R0 + 70);
          Cyl(V(bx, by, 220), 12, 440, 0x3a2a1e, true, false); Ball(V(bx, by, 446), V(18, 18, 18), VC.brass); Box(V(bx, by, 410), V(8, 120, 8), 0x3a2a1e, false, false); Box(V(bx, by, 340), V(4, 110, 130), cols[i], false, false); Box(V(bx, by, 272), V(4, 110, 10), 0x2a1a12, false, false); } }
      // the gate: two lamp posts and the sign on a beam between them
      { const gx = x - R0 - 40, gy = y + 100; for (const s of [-1, 1]) post(gx, gy + s * 200, 360, -1, true);
        VSPOTS.signs.push({ kind: 'wood', o: { text: 'Training Yard', sub: 'Old Hobnail teaches every class', w: 1100, h: 260, seed: 21 }, at: [gx, gy, 330], face: [-1, 0], h: 70 }); Box(V(gx, gy, 372), V(14, 420, 14), 0x3a2a1e, false, false); }
      avoid.push([x, y, R0 + 160]); bodies.push([x, y, 300, 900]); }

    // ---- the Lucky Toadstool: a giant cap on twisted roots at the end of the east street, a wooden floor, lamps under the
    // gills, the tables
    { const [x, y] = CASINO, Rr = 1150; avoid.push([x, y, Rr + 260]); bodies.push([x, y, Rr + 140, 1300]);
      S(toadstoolCap(Rr, 560, 0xb82a2a), x, y, 620, 0);
      Cyl(V(x, y, 9), Rr * 2 - 100, 18, 0x7a4a2a, true, false); Cyl(V(x, y, 19), Rr * 2 - 160, 2, 0x8a5a34, false, false);
      for (let r = 300; r < Rr - 80; r += 130) Cyl(V(x, y, 20 + (r % 3) * 0.1), r * 2, 1, r % 260 ? 0x7a4a2a : 0x6a3e24, false, false);
      Cyl(V(x, y, 21), 1300, 1, 0x7a1a1a, false, false); Cyl(V(x, y, 21.4), 1200, 1, 0x9a2a22, false, false);
      for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + 0.45, px = x + Math.cos(a) * (Rr - 230), py = y + Math.sin(a) * (Rr - 230); if (Math.cos(a) < -0.8) continue; S(rootPillar(620, i), px, py, 18, (a * 180) / Math.PI); Solid(V(px, py, 320), V(110, 110, 640), true); }
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, r = i % 3 ? 760 : 400, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; Box(V(px, py, 560), V(3, 3, 80), VC.iron, false, false); Glow(V(px, py, 505), V(34, 34, 42), i % 2 ? 0xffc46a : 0xff8a5a, 2); Lamp(V(px, py, 500), { r: 1, g: 0.7, b: 0.45 }, 2, 900, false); }
      for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; Glow(V(x + Math.cos(a) * (Rr + 6), y + Math.sin(a) * (Rr + 6), 572), V(12, 12, 12), i % 2 ? 0xfff0a0 : 0xff6a4a, 2); }
      const ex = x - Rr - 60; for (const s of [-1, 1]) { Cyl(V(ex, y + s * 330, 200), 50, 400, VC.woodD, true, false); Glow(V(ex, y + s * 330, 420), V(40, 40, 40), 0xffd27a, 2); }
      VSPOTS.signs.push({ kind: 'marquee', o: {}, at: [ex - 14, y, 540], face: [-1, 0], h: 330, glow: 1 });
      Box(V(ex + 260, y, 23), V(560, 220, 1), 0x9a2a22, false, false);
      const C = VSPOTS.casino;
      { const [tx, ty] = C.roulette.table; S(rouletteTable(false), tx, ty, 18, 0, C.T); Solid(V(tx, ty, 50), V(220, 140, 90), true); }
      { const [tx, ty] = C.blackjack.table; S(cardTable(true, false), tx, ty, 18, -90, C.T); Solid(V(tx, ty, 45), V(180, 180, 80), true); }
      { const [tx, ty] = C.dice.table; S(diceTable(false), tx, ty, 18, 0, C.T); Solid(V(tx, ty, 50), V(210, 110, 90), true); }
      C.slots.forEach(([sx, sy], i) => { S(slotMachine([0xb8282a, 0x2a6aa8, 0x3a8a4a][i]), sx + C.slotOut, sy, 18, 180, C.SL); Solid(V(sx + C.slotOut, sy, 90), V(56, 60, 160), true); });
      for (const T of [C.roulette, C.blackjack, C.dice]) for (const s of [-1, 1]) { const sx = T.at[0] + s * 110, sy = T.at[1]; Cyl(V(sx, sy, 44), 40, 7, 0x9a2a22, false, false); Cyl(V(sx, sy, 30), 9, 28, VC.brass, false, false); Cyl(V(sx, sy, 20), 32, 4, VC.brass, false, false); Solid(V(sx, sy, 26), V(34, 34, 52), false); }
      Box(V(x + 960, y - 200, 55), V(100, 500, 110), VC.woodD, true, true); Box(V(x + 960, y - 200, 114), V(120, 520, 10), VC.brass, false, false);
      for (let i = 0; i < 7; i++) Cyl(V(x + 990, y - 400 + i * 60, 140), 16, 40, [0x2a6a3a, 0x8a2a2a, 0xc8a24a, 0x3a4a8a][i % 4], false, false);
      // ---- the dressing of the place
      const gold = 0xd8b04a, wine = 0x6a1418, deep = 0x3a0c10, pillarA = [0, 1, 2, 4, 5, 6].map((i) => (i / 7) * Math.PI * 2 + 0.45);
      // the floor: a gold border to the carpet, plank seams beyond it, and a medallion in the middle
      Cyl(V(x, y, 21.2), 1330, 1, gold, false, false);
      for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2, r0 = 690, r1 = Rr - 90; Box(V(x + Math.cos(a) * (r0 + r1) / 2, y + Math.sin(a) * (r0 + r1) / 2, 20.4), V(r1 - r0, 3, 1), 0x4a2a18, false, false, (a * 180) / Math.PI); }
      Cyl(V(x, y, 21.8), 620, 1, gold, false, false); Cyl(V(x, y, 22.0), 580, 1, deep, false, false); Cyl(V(x, y, 22.2), 520, 1, gold, false, false); Cyl(V(x, y, 22.4), 500, 1, wine, false, false);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; Box(V(x + Math.cos(a) * 270, y + Math.sin(a) * 270, 22.6), V(30, 30, 1), gold, false, false, (a * 180) / Math.PI + 45); }
      // the prize wheel on its dais: a round step, a post, the wheel facing the door with a ring of bulbs, and its pointer
      { Cyl(V(x, y, 33), 460, 24, 0x5a3420, true, false); Cyl(V(x, y, 46), 470, 4, gold, false, false); Cyl(V(x, y, 47), 420, 1, wine, false, false);
        Cyl(V(x, y, 150), 30, 210, gold, false, false); Cyl(V(x, y, 52), 90, 14, gold, false, false);
        const WZ = 340, WR = 160, AXW = R(90, 0, 0);
        Cyl(V(x, y, WZ), WR * 2 + 16, 18, 0x3a2414, false, false, AXW); Cyl(V(x - 10, y, WZ), WR * 2, 2, gold, false, false, AXW); Cyl(V(x - 11, y, WZ), WR * 2 - 24, 2, 0xb8282a, false, false, AXW);
        Cyl(V(x - 12, y, WZ), WR * 2 - 90, 2, 0xf2e4c6, false, false, AXW); Cyl(V(x - 13, y, WZ), WR * 2 - 120, 2, 0x2a6a3a, false, false, AXW); Cyl(V(x - 14, y, WZ), 70, 4, gold, false, false, AXW); Cyl(V(x + 10, y, WZ), WR * 2, 2, gold, false, false, AXW);
        for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, py = y + Math.cos(a) * (WR - 12), pz = WZ + Math.sin(a) * (WR - 12); Glow(V(x - 13, py, pz), V(8, 14, 14), i % 2 ? 0xfff0a0 : 0xff6a4a, 2); Glow(V(x + 13, py, pz), V(8, 14, 14), i % 2 ? 0xfff0a0 : 0xff6a4a, 2); }
        for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + 0.26, py = y + Math.cos(a) * (WR - 52), pz = WZ + Math.sin(a) * (WR - 52); Ball(V(x - 15, py, pz), V(6, 12, 12), [0xd8b04a, 0x3a6aa8, 0xf2e4c6][i % 3]); }
        Box(V(x - 4, y, WZ + WR + 20), V(30, 20, 44), gold, false, false); Box(V(x - 4, y, WZ + WR + 2), V(12, 10, 14), 0xb8282a, false, false);
        Solid(V(x, y, 270), V(50, WR * 2 + 20, 540), true); Lamp(V(x - 160, y, 360), { r: 1, g: 0.8, b: 0.5 }, 2, 700, false); }
      // a brass ring chandelier round the wheel, hung from the cap on four chains: candles on it, crystal drops under it
      { const CZ = 560, CR = 310;
        for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; Box(V(x + Math.cos(a) * CR, y + Math.sin(a) * CR, CZ), V(10, (2 * Math.PI * CR) / 28 + 4, 10), gold, false, false, (a * 180) / Math.PI); }
        for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; Box(V(x + Math.cos(a) * CR, y + Math.sin(a) * CR, (CZ + 640) / 2), V(3, 3, 640 - CZ), VC.iron, false, false); }
        for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, px = x + Math.cos(a) * CR, py = y + Math.sin(a) * CR; Cyl(V(px, py, CZ + 16), 12, 22, 0xf2e4c6, false, false); Glow(V(px, py, CZ + 34), V(10, 10, 16), 0xffd27a, 2); Ball(V(px, py, CZ - 22), V(7, 7, 14), 0xcfe8f0); Box(V(px, py, CZ - 9), V(1.5, 1.5, 6), gold, false, false); }
        Lamp(V(x, y, CZ), { r: 1, g: 0.75, b: 0.45 }, 2.2, 1100, false); }
      // banners hung from the cap's rim between the pillars: wine red, a gold diamond, a gold fringe
      for (let i = 0; i < pillarA.length; i++) { const a = pillarA[i] + Math.PI / 7; if (Math.cos(a) < -0.75) continue; const r0 = Rr - 80, px = x + Math.cos(a) * r0, py = y + Math.sin(a) * r0, yw = (a * 180) / Math.PI;
        Box(V(px, py, 586), V(6, 6, 24), VC.iron, false, false); Box(V(px, py, 572), V(10, 130, 8), gold, false, false);
        Box(V(px, py, 460), V(4, 116, 220), wine, false, false, yw); Box(V(px - Math.cos(a) * 3, py - Math.sin(a) * 3, 470), V(2, 40, 40), gold, false, false, yw); Box(V(px - Math.cos(a) * 3.5, py - Math.sin(a) * 3.5, 470), V(2, 24, 24), deep, false, false, yw);
        Box(V(px - Math.cos(a) * 3, py - Math.sin(a) * 3, 356), V(2, 116, 10), gold, false, false, yw); for (const e of [-1, 1]) Box(V(px - Math.cos(a) * 3 - Math.sin(a) * e * 56, py - Math.sin(a) * 3 + Math.cos(a) * e * 56, 460), V(2, 6, 220), gold, false, false, yw); }
      // a brass rail round the edge, between the pillars, open at the door and behind the bar
      for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2, b = ((i + 1) / 60) * Math.PI * 2, m = (a + b) / 2, deg = (((m * 180) / Math.PI) + 360) % 360;
        if (Math.cos(m) < -0.86 || (deg > 330 || deg < 10) || pillarA.some((p) => Math.abs(Math.atan2(Math.sin(m - p), Math.cos(m - p))) < 0.1)) continue;
        const r0 = Rr - 40, px = x + Math.cos(a) * r0, py = y + Math.sin(a) * r0;
        Cyl(V(px, py, 64), 8, 88, gold, false, false); Ball(V(px, py, 112), V(10, 10, 10), gold);
        Box(V(x + Math.cos(m) * r0, y + Math.sin(m) * r0, 98), V(6, (2 * Math.PI * r0) / 60 + 2, 6), gold, false, false, (m * 180) / Math.PI); Box(V(x + Math.cos(m) * r0, y + Math.sin(m) * r0, 56), V(4, (2 * Math.PI * r0) / 60 + 2, 4), gold, false, false, (m * 180) / Math.PI);
        Solid(V(x + Math.cos(m) * r0, y + Math.sin(m) * r0, 60), V(16, (2 * Math.PI * r0) / 60 + 6, 120), false, (m * 180) / Math.PI); }
      // behind the bar a back shelf with bottles and a mirror; stools before it
      { const bx = x + 1045, by = y - 200; Box(V(bx, by, 170), V(18, 480, 300), 0x3a2216, false, false); Box(V(bx - 10, by, 230), V(2, 200, 110), 0xcfe4ec, false, false); Box(V(bx - 11, by, 230), V(2, 214, 124), gold, false, false);
        for (const z of [110, 170]) { Box(V(bx - 18, by, z), V(20, 470, 6), 0x5a3420, false, false); for (let k = 0; k < 9; k++) { if (Math.abs(k - 4) < 2 && z > 150) continue; const pyb = by - 210 + k * 52; Cyl(V(bx - 20, pyb, z + 18), 12, 30, [0x2a6a3a, 0x8a2a2a, 0xc8a24a, 0x3a4a8a, 0x6a3a8a][(k + z) % 5], false, false); Cyl(V(bx - 20, pyb, z + 38), 5, 12, 0x2a2a2e, false, false); } }
        for (let k = 0; k < 3; k++) { const sy = y - 440 + k * 125; Cyl(V(x + 870, sy, 66), 44, 8, wine, false, false); Cyl(V(x + 870, sy, 36), 10, 56, gold, false, false); Cyl(V(x + 870, sy, 6), 36, 6, gold, false, false); Cyl(V(x + 870, sy, 30), 30, 3, gold, false, false); Solid(V(x + 870, sy, 35), V(40, 40, 70), false); }
        for (const s of [-1, 1]) { Box(V(bx - 21, by + s * 214, 262), V(26, 30, 4), 0x3a2216, false, false); Box(V(bx - 13, by + s * 214, 252), V(4, 6, 20), gold, false, false); tableLamp(bx - 22, by + s * 214, 264); }   // a lamp each end of the back bar, on a little gilt bracket
        Lamp(V(bx - 120, by, 300), { r: 1, g: 0.75, b: 0.45 }, 1.8, 600, false); }
      // the cashier's cage: a counter, brass bars, a little roof, a lamp, its sign
      { const cx2 = x - 60, cy2 = y + 850; Box(V(cx2, cy2, 52), V(230, 80, 104), 0x5a3420, true, false); Box(V(cx2, cy2 - 2, 106), V(244, 92, 8), gold, false, false);
        Box(V(cx2, cy2 + 44, 160), V(230, 10, 320), 0x3a2216, false, false);
        for (let k = 0; k <= 12; k++) { if (k === 6) continue; Cyl(V(cx2 - 108 + k * 18, cy2 - 38, 184), 3, 150, gold, false, false); } Box(V(cx2, cy2 - 38, 112), V(30, 10, 8), 0x3a2216, false, false);
        Box(V(cx2, cy2, 266), V(250, 100, 12), 0x5a3420, false, false); Box(V(cx2, cy2 - 50, 266), V(254, 4, 16), gold, false, false);
        for (let k = 0; k < 4; k++) Cyl(V(cx2 - 60 + k * 28, cy2 + 10, 114 + (k % 2) * 6), 22, 8 + (k % 2) * 12, [0xb8282a, 0x3a6aa8, 0x2a2a2e, 0xd8b04a][k], false, false);
        lampHang(cx2, cy2, 260, 226); Lamp(V(cx2, cy2 - 60, 230), { r: 1, g: 0.8, b: 0.5 }, 1.8, 500, false);   // a little lantern on a chain from the cage's roof
        VSPOTS.signs.push({ kind: 'wood', o: { text: 'Cashier', w: 500, h: 150, seed: 21 }, at: [cx2, cy2 - 54, 300], face: [0, -1], h: 44 }); for (const e of [-1, 1]) Box(V(cx2 + e * 70, cy2 - 52, 286), V(3, 3, 14), VC.iron, false, false);
        Solid(V(cx2, cy2, 140), V(240, 100, 280), true); }
      // a round rug under each table, and brass stanchions with a velvet rope either side of the door
      for (const T of [C.roulette, C.blackjack, C.dice]) { const [tx, ty] = T.table; Cyl(V(tx, ty, 21.0), 470, 1, gold, false, false); Cyl(V(tx, ty, 21.1), 440, 1, 0x1e4a32, false, false); Cyl(V(tx, ty, 21.2), 380, 1, gold, false, false); Cyl(V(tx, ty, 21.3), 370, 1, 0x1e4a32, false, false); }
      { const sx2 = x - Rr + 120; for (const e of [-1, 1]) { const ys = [y + e * 150, y + e * 330]; for (const py of ys) { Cyl(V(sx2, py, 60), 10, 100, gold, false, false); Cyl(V(sx2, py, 12), 40, 8, gold, false, false); Ball(V(sx2, py, 114), V(14, 14, 14), gold); Solid(V(sx2, py, 55), V(26, 26, 110), false); }
        for (let k = 0; k <= 8; k++) { const t = k / 8, py = ys[0] + (ys[1] - ys[0]) * t, z = 96 - Math.sin(t * Math.PI) * 26; Box(V(sx2, py, z), V(8, (ys[1] - ys[0]) / 8 + 3, 8), 0x8a1a22, false, false); } } }
      // big potted toadstools in the open corners, and a sconce on each pillar
      for (const [dx, dy] of [[20, -780], [-760, 330], [-760, -330]]) { const px = x + dx, py = y + dy; Cyl(V(px, py, 40), 90, 80, 0x7a3a22, true, false); Cyl(V(px, py, 81), 96, 6, gold, false, false); const [k, b] = toadstoolCluster(1.6, 0xb8282a, Math.round(px)); Shape(k, b, V(px, py, 80), R(0, dx, 0)); }
      for (const a of pillarA) { const r0 = Rr - 230 - 62, px = x + Math.cos(a) * r0, py = y + Math.sin(a) * r0; Box(V(px + Math.cos(a) * 10, py + Math.sin(a) * 10, 300), V(20, 20, 30), gold, false, false); Glow(V(px, py, 324), V(18, 18, 22), 0xffd27a, 2); }
    }

    // ---- the Way Down: the arch set into a knoll of mossy boulders at the foot of the oldest giant
    { const [x, y] = GATE; avoid.push([x, y, 900]); bodies.push([x, y, 520, 1000]);
      const AF = y - 66 + 60, behind = (r) => AF + r * 1.2;
      for (let i = 0; i < 7; i++) { const r = rr(560, 760), ax = (i - 3) * 340 + rr(-50, 50), ay = behind(r) + rr(20, 160); S(rock(r, 20 + i), ax, ay, r * 0.18 + (3 - Math.abs(i - 3)) * 70, rr(0, 360)); bodies.push([ax, ay, r * 1.05, r * 1.5]); avoid.push([ax, ay, r * 1.1]); Solid(V(ax, ay, r * 0.6), V(r * 1.5, r * 1.2, r * 1.2), true); }
      for (const sg of [-1, 1]) { const r = rr(380, 460), ax = sg * (640 + r), ay = y - 40 + rr(-30, 40); S(rock(r, 3 + (sg + 1) * 6), ax, ay, -r * 0.2, rr(0, 360)); bodies.push([ax, ay, r * 1.05, r]); avoid.push([ax, ay, r * 1.1]); Solid(V(ax, ay, r * 0.35), V(r * 1.5, r * 1.2, r * 1.0), true, rr(0, 90)); }
      for (const sg of [-1, 1]) { S(bush(150, VC.leaf, 0, 40 + sg), x + sg * 380, y - 40, 0, 0); S(bush(120, VC.leaf2, 0xf08aa8, 50 + sg), x + sg * 470, y - 170, 0, 0); Solid(V(x + sg * 380, y - 40, 70), V(220, 220, 140), false); Solid(V(x + sg * 470, y - 170, 60), V(180, 180, 120), false); }
      Solid(V(x, y + 190, 430), V(680, 200, 860), true);
      Blocker(V(0, y + 260, 1500), V(VSIZE * 2 + 1200, 160, 3000));
      for (let k = 0; k < 9; k++) Box(V(x, y - 80 - k * 40, 2 + k * 0.01), V(700 - k * 20, 40, 2), mix(VC.stone, VC.stoneD, (k % 2) * 0.4), false, false);
      for (const s of [-1, 1]) { S(lanternPost(360, s + 2), x + s * 560, y - 320, 0, s < 0 ? 0 : 180); Solid(V(x + s * 560, y - 320, 180), V(24, 24, 360), false); lit(x + s * 560 + (s < 0 ? 62 : -62), y - 320, 302, { r: 1, g: 0.8, b: 0.4 }, 1100); }
      for (let i = 0; i < 8; i++) S(flowerClump(i % 2 ? 36 : 44, [0xf08aa8, 0xf6d04a, 0xffffff, 0xa070d0][i % 4], 0xffffff, i), x + (i < 4 ? -1 : 1) * (250 + (i % 4) * 66), y - 330 + rr(-25, 25), 0, rr(0, 360)); }

    // ---- the cottages: each faces its path, a lantern by the door, pots either side of it, a lit window or two, smoke
    // from the chimney; and what a household keeps outside: a woodpile and chopping block, a bench, a washing line
    const shroomExtras = (x, y, h, r, yaw, lamp = true) => {
      const ya = (yaw * Math.PI) / 180, L = (u, v) => [x + Math.cos(ya) * u - Math.sin(ya) * v, y + Math.sin(ya) * u + Math.cos(ya) * v];
      const CR = r * 2.15, CH = r * 1.35, [smx, smy] = L(-CR * 0.35, CR * 0.25); VSPOTS.smoke.push([smx, smy, h - 20 + CH * 0.72 + 146]);
      const fx = stemR(h, r, 40) + 70; for (const sd of [-1, 1]) { const [px, py] = L(fx, sd * 100); Cyl(V(px, py, 18), 42, 36, 0xb8643a, false, false); Cyl(V(px, py, 37), 48, 5, 0x8a4a2a, false, false); S(bush(30, VC.leaf2, sd > 0 ? 0xf6d04a : 0xf08aa8, 70 + sd + Math.round(Math.abs(x)) % 5), px, py, 30, 0); Solid(V(px, py, 35), V(56, 56, 70), false); }
      if (lamp) { const lr = stemR(h, r, 200), [lx, ly] = L(lr + 26, 96), [bx, by] = L(lr + 8, 96); Box(V(bx, by, 228), V(30, 4, 4), VC.iron, false, false, yaw); Cyl(V(lx, ly, 232), 22, 6, VC.iron, false, false); Glow(V(lx, ly, 212), V(16, 16, 24), 0xffc870, 2); Cyl(V(lx, ly, 196), 16, 4, VC.iron, false, false); Lamp(V(lx + Math.cos(ya) * 30, ly + Math.sin(ya) * 30, 220), { r: 1, g: 0.76, b: 0.46 }, 1.8, 560, false); }
    };
    COTS.forEach(([x, y, h, r, cap, yaw], i) => { bodies.push([x, y, r * 2.3, h * 2]); S(shroomHouse(h, r, cap, i % 2 ? VC.cream2 : VC.cream, 10 + i), x, y, 0, yaw); stemBody(x, y, h, r); avoid.push([x, y, r * 1.5]); shroomExtras(x, y, h, r, yaw); });
    shroomExtras(SHOP[0], SHOP[1], 500, 310, 0, false);
    // the south-west cottage: a woodpile against its north side with the chopping block, a vegetable bed and a bench
    { const [x, y] = COTS[0]; S(woodpile(200, 3, 3), x - 40, y + 300, 0, 0); Solid(V(x - 40, y + 300, 35), V(200, 60, 70), false); S(choppingBlock(), x - 300, y + 330, 0, 200); Solid(V(x - 300, y + 330, 25), V(56, 56, 50), false);
      S(bench(160, VC.wood, VC.woodD), x + 300, y - 230, 0, 90); Solid(V(x + 300, y - 230, 22), V(44, 160, 44), false, 0); avoid.push([x + 300, y - 230, 100]);
      { const gx = x - 20, gy = y - 420; Box(V(gx, gy, 2), V(360, 160, 3), 0x4a3424, false, false); for (let c = 0; c < 4; c++) { S(cabbage(26), gx - 120 + c * 80, gy - 30, 0, c * 50); S(cabbage(22), gx - 80 + c * 80, gy + 40, 0, c * 70); } S(fence(380), gx, gy - 110, 0, 0); Solid(V(gx, gy - 110, 45), V(380, 12, 90), false); avoid.push([gx, gy, 230]); } }
    // the west cottage, at the end of its lane past the forge: a washing line to the north, a cart and sacks by the path
    { const [x, y] = COTS[1]; S(washLine(380, 2), x + 40, y + 520, 0, 10); for (const e of [-1, 1]) Solid(V(x + 40 + e * 187, y + 520 + e * 33, 100), V(14, 14, 200), false); avoid.push([x + 40, y + 520, 240]);
      S(cart(0, 2), x + 420, y - 260, 0, 160); Solid(V(x + 420, y - 260, 60), V(200, 120, 120), false, 160);
      for (const [u, v] of [[330, 260], [380, 300]]) { S(sack(26), x + u, y + v, 0, u); Solid(V(x + u, y + v, 25), V(50, 50, 50), false); } S(crate(64, 3), x + 300, y + 330, 0, 25); Solid(V(x + 300, y + 330, 27), V(64, 64, 54), false); }
    for (const [x, y, w, d, h, yaw] of [[HOME[0], HOME[1], 700, 560, 320, 0], [FORGE[0], FORGE[1], 600, 480, 300, 0]]) {
      const ya = (yaw * Math.PI) / 180, fx = w / 2 + 9; for (const sd of [-1, 1]) { const ly = sd * d * 0.3; Glow(V(x + Math.cos(ya) * fx - Math.sin(ya) * ly, y + Math.sin(ya) * fx + Math.cos(ya) * ly, h * 0.55), V(3, 80, 68), 0xffc870, 0, R(0, yaw, 0)); }
      const cx2 = -w * 0.25, cy2 = -d * 0.2; VSPOTS.smoke.push([x + cx2 * Math.cos(ya) - cy2 * Math.sin(ya), y + cx2 * Math.sin(ya) + cy2 * Math.cos(ya), h - 60 + h * 1.05 + 150]);
    }

    // ---- the treehouse up the north-east giant: a ring deck round the trunk on joists and knee braces that run into the
    // bark, a railing open where the ladder comes up, a little cottage on it, lanterns hung from the rim
    { const [gx, gy, , gr] = GIANTS[2], z = 908, R0 = Math.round(gr * 0.9), R1 = gr * 2.0, GAP = 0.06;
      S(treeDeck(R0, R1, gr, LADDER_A, GAP), gx, gy, z, 0);
      { const a = Math.PI * 1.2, hx2 = gx + Math.cos(a) * (R0 + R1) / 2, hy2 = gy + Math.sin(a) * (R0 + R1) / 2; S(shroomHouse(260, 150, 0x6a8a3a, VC.cream2, 31), hx2, hy2, z, 200); }
      // the ladder: two rails from the ground to a handhold above the deck, rungs up to the deck's edge
      { const a = LADDER_A, ca = Math.cos(a), sa = Math.sin(a), lx = gx + ca * (R1 + 12), ly = gy + sa * (R1 + 12), top = z + 70;
        for (const s of [-1, 1]) Cyl(V(lx - sa * s * 26, ly + ca * s * 26, top / 2), 6, top, 0xa8885a, false, false);
        for (let k = 1; k <= 12; k++) Box(V(lx, ly, k * (z / 12.5)), V(8, 58, 5), VC.woodD, false, false, (a * 180) / Math.PI + 90);
        Solid(V(lx, ly, top / 2), V(30, 70, top), false, (a * 180) / Math.PI); avoid.push([lx, ly, 120]); }
      for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; hang(gx + Math.cos(a) * (R1 - 14), gy + Math.sin(a) * (R1 - 14), z - 30, z - 140); } }

    // ---- the campfire on the brook, east of the bridge: a ring of stones, a teepee of logs, embers, log seats round it,
    // a pot on a tripod, a woodpile and two stumps to sit on
    { const [x, y] = FIRE; avoid.push([x, y, 330]);
      patch(x, y, 560, 0x5a4a32); Cyl(V(x, y, 2.4 + gN * 0.03), 120, 1, 0x2a1a10, false, false);
      for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 2; Oct(V(x + Math.cos(a) * 74, y + Math.sin(a) * 74, 12), V(40, 34, 26), mix(VC.stone, VC.stoneD, (i % 3) / 2), false, false, R(0, (a * 180) / Math.PI, 0)); }
      for (let k = 0; k < 5; k++) { const a = (k / 5) * 360; M.Cyl(V(x + Math.cos((a * Math.PI) / 180) * 18, y + Math.sin((a * Math.PI) / 180) * 18, 30), 14, 80, k % 2 ? VC.woodD : VC.wood, false, false, R(-62, a + 180, 0)); }
      Glow(V(x, y, 14), V(60, 60, 20), 0xff6a1a, 2); Glow(V(x, y, 26), V(30, 30, 30), 0xffc04a, 2); Solid(V(x, y, 40), V(170, 170, 80), false);
      Lamp(V(x, y, 90), { r: 1, g: 0.55, b: 0.25 }, 2.6, 1400, false);
      for (let k = 0; k < 2; k++) { const a = (k / 2) * Math.PI + 0.9, bx = x + Math.cos(a) * 250, by = y + Math.sin(a) * 250, yaw = (a * 180) / Math.PI + 90; M.Cyl(V(bx, by, 24), 46, 190, VC.wood, false, false, R(90, yaw, 0)); Solid(V(bx, by, 24), V(186, 44, 48), true, yaw); for (const e of [-1, 1]) Cyl(V(bx + Math.cos(a + Math.PI / 2) * e * 95, by + Math.sin(a + Math.PI / 2) * e * 95, 24), 40, 3, 0xd8b07a, false, false); }
      for (const [a, d] of [[4.1, 240], [5.0, 260]]) { const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d; S(stump(30, 42, Math.round(a)), px, py, 0, a * 50); Solid(V(px, py, 21), V(64, 64, 42), false); }
      S(woodpile(180, 3, 4), x + 60, y + 300, 0, 10); Solid(V(x + 60, y + 300, 35), V(180, 60, 70), false, 10);
      // the tripod: three iron legs from the ground meeting at a lashed apex over the fire, a chain down to the pot's bail
      { const AZ = 210, legs = [0, 1, 2].map((k) => { const a = (k / 3) * Math.PI * 2 + 0.5; return [x + Math.cos(a) * 96, y + Math.sin(a) * 96]; });
        const rod = (ax, ay, az, bx, by, bz, t, col) => { const L = Math.hypot(bx - ax, by - ay, bz - az), yaw = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI, pitch = (Math.atan2(bz - az, Math.hypot(bx - ax, by - ay)) * 180) / Math.PI; M.BoxRot(V((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2), V(L + t, t, t), col, R(pitch, yaw, 0), false); };
        for (const [lx, ly] of legs) { rod(lx, ly, 0, x + (lx - x) * 0.02, y + (ly - y) * 0.02, AZ + 6, 7, VC.iron); Oct(V(lx, ly, 3), V(16, 16, 6), VC.iron, false, false); }
        Cyl(V(x, y, AZ), 16, 22, 0x8a6a3a, false, false); Cyl(V(x, y, AZ + 12), 10, 6, VC.iron, false, false);
        for (let k = 0; k < 7; k++) { const z = AZ - 12 - k * 9; Box(V(x, y, z), V(k % 2 ? 2 : 6, k % 2 ? 6 : 2, 9), VC.iron, false, false); }
        Box(V(x, y, 140), V(2, 2, 12), VC.iron, false, false);
        rod(x - 24, y, 112, x, y, 140, 2.5, VC.iron); rod(x, y, 140, x + 24, y, 112, 2.5, VC.iron);
        Ball(V(x, y, 96), V(50, 50, 40), 0x2a2a2e); Cyl(V(x, y, 116), 44, 4, 0x3a3a40, false, false); Cyl(V(x, y, 117), 38, 2, 0x6a4a2a, false, false);
        for (const s2 of [-1, 1]) Box(V(x + s2 * 24, y, 110), V(4, 6, 8), VC.iron, false, false);
        Solid(V(x, y, 105), V(70, 70, 210), false); }
    }

    // ---- the fishing jetty on the brook, below the Lucky Toadstool: a plank deck on posts out over the water, a ramp up to
    // it from the bank, a rowboat tied alongside, a bucket and a rod, a lantern on its end post
    { const jx = 1950, y0 = streamY(jx) + 300, y1 = streamY(jx) - 20, top = 36, mid = (y0 + y1) / 2, L = y0 - y1;
      Ramp(V(jx, y0 + 90, 0), V(jx, y0, top), 130, VC.woodL); Box(V(jx, mid, top - 8), V(130, L, 16), VC.woodL, true, false);
      for (let k = 0; k < Math.round(L / 30); k++) Box(V(jx, y1 + 15 + k * 30, top + 0.6), V(134, 3, 1.4), VC.woodD, false, false);
      for (const sx of [-1, 1]) { for (let k = 0; k <= 2; k++) Cyl(V(jx + sx * 58, y1 + 10 + k * ((L - 20) / 2), top / 2 - 10), 14, top + 26, VC.woodD, false, false); Box(V(jx + sx * 64, mid, top + 4), V(8, L, 8), VC.wood, false, false); }
      Cyl(V(jx + 58, y1 + 10, top + 50), 12, 110, VC.woodD, false, false); Box(V(jx + 58, y1 + 10, top + 104), V(40, 4, 4), VC.iron, false, false); Cyl(V(jx + 78, y1 + 10, top + 98), 18, 6, VC.iron, false, false); Glow(V(jx + 78, y1 + 10, top + 82), V(14, 14, 20), 0xffc870, 2); Lamp(V(jx + 78, y1 + 10, top + 80), { r: 1, g: 0.76, b: 0.46 }, 1.6, 500, false);
      S(rowboat(300, 0x7a5a3a, 1), jx - 150, mid - 30, 2, 82); Box(V(jx - 95, y1 + 40, top + 2), V(60, 2, 2), 0xc8b48a, false, false);
      for (const sx of [-1, 1]) Solid(V(jx + sx * 64, mid, top + 30), V(10, L, 60), false);
      Solid(V(jx - 150, mid - 30, 40), V(90, 300, 80), false, 82 - 90);
      Cyl(V(jx + 30, y0 - 50, top + 18), 30, 34, VC.wood, false, false); Cyl(V(jx + 30, y0 - 50, top + 34), 26, 2, 0x3a5a66, false, false);
      M.Cyl(V(jx - 40, y0 - 40, top + 80), 3, 170, VC.woodL, false, false, R(-30, 90, 0));
      avoid.push([jx, mid, 200], [jx - 150, mid - 30, 190]); }
    // ---- the welcome arch over the south road, its board hung both ways, a lantern each side, and the road running on
    // into the dark of the wood where nobody goes
    { const y = WELCOME; S(welcomeArch(520, 430), 0, y, 0, 0); for (const s of [-1, 1]) Solid(V(s * 260, y, 230), V(80, 80, 460), true); avoid.push([0, y, 420]);
      for (const [fy, f] of [[y + 3, 1], [y - 3, -1]]) VSPOTS.signs.push({ kind: 'wood', o: { text: 'Thimblewick', sub: f > 0 ? 'mind the roots' : 'home of the gnomes', w: 1000, h: 250, leaves: true, seed: 31 }, at: [0, fy, 300], face: [0, f], h: 70 });
      for (const s of [-1, 1]) { Glow(V(s * 326, y, 346), V(18, 18, 22), 0xffd27a, 2); Lamp(V(s * 326, y, 350), { r: 1, g: 0.78, b: 0.45 }, 1.8, 700, false); }
      for (const s of [-1, 1]) { const fir = s > 0; S(tree(fir ? 1500 : 1300, VC.leaf3, 300 + s, fir ? 1 : 0), s * 520, y - 420, 0, s * 40); }
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const px = s * (380 + k * 90), py = y + rr(-60, 60); S(bush(90 + k * 20, k % 2 ? VC.leaf : VC.leaf3, k === 1 ? 0xf6f0e0 : 0, 80 + k + s), px, py, 0, rr(0, 360)); Solid(V(px, py, 50), V(150, 150, 100), false); avoid.push([px, py, 120]); } }

    // ---- lantern posts along the roads, one every few hundred paces, alternating sides
    for (const [x, y] of [[300, -3000], [-300, 1250], [300, 2150]]) post(x, y, 300, x < 0 ? -1 : 1);

    // ---- planting, by hand: shade plants round the giants' feet, thicket along the edge of the hollow, flowers along the
    // house fronts, a few drifts of wildflowers in the open meadows, tufts along the road verges
    // round each giant: ferns and caps in the gaps between its roots, moss
    for (const [x, y, , r, sd] of GIANTS) { for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2 + sd, d = r * (1.45 + (k % 3) * 0.3), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
        if (k % 3 === 2) plant(px, py, 50, () => { const [kk, bb] = toadstoolCluster(1 + (k % 2) * 0.4, k % 4 === 2 ? 0x7ad8c4 : 0xc8392e, sd * 7 + k); Shape(kk, bb, V(px, py, 0), R(0, k * 40, 0)); });
        else plant(px, py, 70, () => { const [kk, bb] = fern(k % 2 ? 110 : 85, sd + k); Shape(kk, bb, V(px, py, 0), R(0, k * 53, 0)); }); } }
    // the thicket round the edge of the hollow, and young trees standing out of it
    { const line = (x0, y0, x1, y1, n) => { for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t + rr(-60, 60), y = y0 + (y1 - y0) * t + rr(-60, 60), r = rr(190, 280);
          if (!clear(x, y, r * 0.6) || GIANTS.some(([gx, gy, , gr]) => Math.hypot(x - gx, y - gy) < gr * 1.7)) continue;
          S(thicket(r, i + Math.round(x0)), x, y, 0, rr(0, 360)); Solid(V(x, y, r * 0.5), V(r * 1.4, r * 1.4, r), false); avoid.push([x, y, r * 0.9]);
          if (i % 3 === 1 && clear(x, y + 1, 0)) { const fir = rnd() < 0.4, h = fir ? rr(800, 1050) : rr(650, 900); S(tree(h, [VC.leaf3, VC.leaf, 0x3e6a2c][i % 3], 200 + i, fir ? 1 : 0), x + rr(-60, 60), y + rr(-60, 60), 0, rr(0, 360)); } } };
      line(-3200, -2600, -3200, 2300, 16); line(3200, -1700, 3200, 2000, 12); line(-2700, -3300, -500, -3300, 7); line(500, -3300, 2700, -3300, 7); line(-2300, 2700, -900, 2700, 4); line(900, 2700, 2100, 2750, 4); }
    // flowers along the house fronts and either side of the doors
    const bed = (x, y, yaw, w, cols, n, seed0) => { const ya = (yaw * Math.PI) / 180; for (let i = 0; i < n; i++) { const t = (i / Math.max(1, n - 1) - 0.5) * w, px = x - Math.sin(ya) * t + rr(-10, 10), py = y + Math.cos(ya) * t + rr(-10, 10); S(flowerClump(i % 2 ? 34 : 42, cols[i % cols.length], cols[(i + 1) % cols.length], seed0 + i), px, py, 0, rr(0, 360)); } };
    bed(FORGE[0] - 340, FORGE[1] + 160, 0, 200, [0xf6d04a, 0xff8a4a], 3, 3);
    for (const [x, y, h, r, , yaw] of COTS) { const ya = (yaw * Math.PI) / 180, d = r * 1.12 / Math.cos(Math.PI / 8) + 46; for (const sd of [-1, 1]) { const a = ya + sd * 1.15; bed(x + Math.cos(a) * d, y + Math.sin(a) * d, yaw + sd * 66, 110, [0xf08aa8, 0xa070d0, 0xf6d04a], 3, Math.round(x / 10) + sd); } }
    bed(SHOP[0] + 280, SHOP[1] - 300, -30, 150, [0xff8a4a, 0xf6d04a], 3, 9); bed(SHOP[0] + 280, SHOP[1] + 300, 30, 150, [0xf08aa8, 0xa070d0], 3, 10);
    // drifts of wildflowers: one colour leading, another through it, in the open meadows
    for (const [x, y, r, c1, c2, n] of [[1350, -650, 260, 0xf6d04a, 0xffffff, 12], [-450, -2450, 220, 0xa070d0, 0xf08aa8, 10], [620, -3000, 170, 0xffffff, 0xf6d04a, 8], [1800, 2480, 190, 0x6a9ae0, 0xffffff, 9], [-2250, 1000, 220, 0xf08aa8, 0xffffff, 10], [-2450, -1350, 200, 0xf6d04a, 0xff8a4a, 9], [600, 1950, 180, 0xffffff, 0xa070d0, 8]]) {
      for (let i = 0; i < n; i++) { const a = rr(0, 6.28), d = r * Math.sqrt(rnd()), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d; if (!clear(px, py, 10)) continue; if (i % 5 === 0) { const [k, b] = flower(70, c2, 0xf6c43a, i, 6); Shape(k, b, V(px, py, 0), R(0, rr(0, 360), 0), 0xffffff, rr(0.9, 1.2)); } else S(flowerClump(i % 2 ? 36 : 46, c1, c2, i), px, py, 0, rr(0, 360)); }
      for (let i = 0; i < 6; i++) { const a = rr(0, 6.28), d = r * Math.sqrt(rnd()) * 1.2, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d; if (!clear(px, py, 10)) continue; const [k, b] = grassTuft(45, i); Shape(k, b, V(px, py, 0), R(0, rr(0, 360), 0)); } }
    // the road verges: tufts and the odd fern in clumps, thicker away from the square, none in front of a door
    for (const [pts, w] of PATHS) { for (let j = 1; j < pts.length; j++) { const [ax, ay] = pts[j - 1], [bx, by] = pts[j], L = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / L, ny = (bx - ax) / L;
        for (let d = 60; d < L - 60; d += 110) { if (rnd() < 0.4) continue; const sd = rnd() < 0.5 ? -1 : 1, e = sd * (w / 2 + rr(14, 60)), px = ax + (bx - ax) * (d / L) + nx * e, py = ay + (by - ay) * (d / L) + ny * e; if (Math.hypot(px, py) < SQ + 120 || !clear(px, py, 8)) continue;
          for (let k = 0; k < 2 + (rnd() < 0.4 ? 1 : 0); k++) { const qx = px + rr(-26, 26), qy = py + rr(-26, 26), r2 = rnd(); if (r2 < 0.7) { const [kk, bb] = grassTuft(r2 < 0.35 ? 40 : 55, k + (d % 5)); Shape(kk, bb, V(qx, qy, 0), R(0, rr(0, 360), 0)); } else { const [kk, bb] = fern(65, k); Shape(kk, bb, V(qx, qy, 0), R(0, rr(0, 360), 0)); } } } } }
    // grass round the foot of every house and the counters, where nobody walks
    for (const [x, y, ax, ay, n] of [[SHOP[0], SHOP[1], 400, 400, 10], [FORGE[0], FORGE[1], 350, 290, 8], [HOME[0], HOME[1], 400, 330, 10], [COTS[0][0], COTS[0][1], 310, 310, 8], [COTS[1][0], COTS[1][1], 310, 310, 8]]) for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + rr(-0.2, 0.2), px = x + Math.cos(a) * ax, py = y + Math.sin(a) * ay; if (pathDist(px, py) < 20 || onStream(px, py) || !clear(px, py, 4)) continue; const [kk, bb] = grassTuft(50, i); Shape(kk, bb, V(px, py, 0), R(0, rr(0, 360), 0)); }
    // a few mossy logs lying where they fell, at the edges
    for (const [x, y, yaw, L] of [[-2550, 950, 30, 300], [2650, -800, 80, 280], [-700, -3150, 10, 260], [2400, 1250, 150, 240]]) plant(x, y, 160, () => { const [k, b] = mossLog(L, Math.round(x)); Shape(k, b, V(x, y, 0), R(0, yaw, 0)); Solid(V(x, y, 30), V(L * 0.8, 60, 60), true, yaw); });

    // ---- the wood round the hollow: more giants' trunks and firs, fading into the haze
    for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2 + rr(-0.03, 0.03), d = rr(3800, 5200), ca = Math.cos(a), sa = Math.sin(a), k = Math.max(Math.abs(ca), Math.abs(sa)), x = (ca / k) * d, y = (sa / k) * d;
      if (GIANTS.some(([gx, gy, , gr]) => Math.hypot(x - gx, y - gy) < (i % 4 === 0 ? 2600 : gr * 3.4))) { rr(0, 1); rr(0, 1); rr(0, 1); continue; }
      if (i % 4 === 0) S(giantTree(rr(4200, 5600), rr(380, 520), 10 + (i % 7), 0x3a6230), x, y, 0, rr(0, 360)); else { const fir = rnd() < 0.45, h = fir ? rr(1300, 1900) : rr(1100, 1600); S(tree(h, [VC.leaf3, 0x3e6a2c, VC.leaf][i % 3], i, fir ? 1 : 0), x, y, 0, rr(0, 360)); } }
    // ---- the far hills, a blue haze of ridges
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + rr(-0.1, 0.1), d = rr(10000, 13000); S(hill(rr(4000, 7000), rr(2500, 4000), rr(1600, 3200), [0x5a8a3e, 0x669644, 0x527a38][i % 3]), Math.cos(a) * d, Math.sin(a) * d, -400, (a * 180) / Math.PI); }
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.3, d = rr(18000, 23000); S(hill(rr(7000, 10000), rr(3000, 5000), rr(3500, 6000), 0x6a8a98), Math.cos(a) * d, Math.sin(a) * d, -800, (a * 180) / Math.PI); }
    // ---- the limbs' lanterns over the high street, now that everything is in place: none where its rope or glass would
    // pass through a roof, a rock, a trunk or a root, and none crowded on another
    { const hung = [];
      for (const [px, py, top, z, col] of pend) {
        if (bodies.some(([bx, by, br, bt]) => Math.hypot(px - bx, py - by) < br + 40 && z - 50 < bt)) continue;
        if (rootPts.some(([rx, ry, rz, rad]) => Math.hypot(px - rx, py - ry) < rad + 45 && rz + rad > z - 60 && rz - rad < top - 40)) continue;
        if (hung.some(([hx2, hy2]) => Math.hypot(px - hx2, py - hy2) < 500)) continue;
        hung.push([px, py]); hang(px, py, top, z, col);
      } }
    // ---- the edge: nobody walks out of the hollow
    for (const s of [-1, 1]) { Blocker(V(s * (VSIZE + 400), 0, 1500), V(200, VSIZE * 2 + 1200, 3000)); Blocker(V(0, s * (VSIZE + 400), 1500), V(VSIZE * 2 + 1200, 200, 3000)); }
  });
}
