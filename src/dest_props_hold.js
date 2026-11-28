// Sculpted pieces for The Old Hold, Under the Hill: the gnomes' forefathers' hold, cut into the hill's own granite. Its
// pillars with their carved bands and rune panels, its stone gnomes, the throne and the dais, braziers and torches, the
// great doors and the Deep Gate, the hearths and the forges, the long tables, the barracks, the stores, the cistern's
// columns and its spout, the mint and its vault. Same rules as dest_props.js: UE frame (X the front, Y right, Z up),
// [key, build] pairs, keys carry every number the shape depends on, things stand on z = 0, every piece whole.
import { shapeB as shape, shapeF } from './propkit.js';
import { dark, mix } from './village_shapes.js';
import { q, rng } from './dest_props.js';

export const HD = {   // the hold's colours: slate-grey granite, darker where it was laid as plinths, lighter where carved
  stone: [0x5e6268, 0x565a60, 0x676b71, 0x505459], stoneD: 0x3c4046, stoneL: 0x7c8086, soot: 0x2a2a2e, damp: 0x46504e,
  flag: [0x58554f, 0x504d48, 0x605d57, 0x4a4743], joint: 0x2c2a28,
  statue: [0x8a8780, 0x807d76, 0x948f88], statueD: 0x6c6964, eye: 0x4a4844,
  brass: 0xb88c3c, brassD: 0x7c5c26, brassL: 0xe0b860, gold: 0xd8ae48, goldL: 0xf2d27a, goldD: 0x9a7428,
  iron: 0x34363a, ironD: 0x222326, ironL: 0x5a5e64, rust: 0x5a3e30,
  oak: [0x5e4630, 0x56402c, 0x664c34], oakD: 0x3e2e20, oakL: 0x7a5c3e, leather: 0x5a3a24, leatherD: 0x3e2818, straw: 0xb09a5a, strawD: 0x8a7640,
  red: 0x7a2622, redD: 0x561a18, blue: 0x26365e, blueD: 0x1a2644, cream: 0xc8b88e, wool: 0x6a6052,
  coal: 0x2a1c18, ember: 0xff6a20, fire: 0xffa040, flame: 0xffd27a, water: 0x1c3438, waterL: 0x2c4c52, shade: 0x8a5cc8,
};
const N = (s) => Math.abs(Math.round(s)) || 0;
const pick = (a, i) => a[((i % a.length) + a.length) % a.length];
const pair = (key, draw) => ({ main: [key, shape((G) => draw(G, null))], glow: [key + '|glow', shape((P) => draw(null, P))] });

// ---- a prism standing on z0 up to z1 over a convex polygon (counter-clockwise [x, y]), capped top and bottom; c a
// colour or c(i) for side i (-1 the top, -2 the bottom)
const prism = (G, poly, z0, z1, c) => {
  const n = poly.length, cf = typeof c === 'function' ? c : () => c;
  for (let i = 0; i < n; i++) { const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % n], k = G.n, col = cf(i); G.v(ax, ay, z0, col); G.v(bx, by, z0, col); G.v(bx, by, z1, col); G.v(ax, ay, z1, col); G.idx.push(k, k + 1, k + 2, k, k + 2, k + 3); }
  let k = G.n; const top = cf(-1); for (const [x, y] of poly) G.v(x, y, z1, top); for (let i = 1; i < n - 1; i++) G.idx.push(k, k + i, k + i + 1);
  k = G.n; const bot = cf(-2); for (const [x, y] of poly) G.v(x, y, z0, bot); for (let i = 1; i < n - 1; i++) G.idx.push(k, k + i + 1, k + i);
};
// a square a by b (half sizes) with its corners chamfered by c; the same cut in half (its back on x = 0, d deep)
const cham = (a, c, b = a) => [[a, -b + c], [a, b - c], [a - c, b], [-a + c, b], [-a, b - c], [-a, -b + c], [-a + c, -b], [a - c, -b]];
const halfCham = (d, c, b) => [[0, -b], [d - c, -b], [d, -b + c], [d, b - c], [d - c, b], [0, b]];

// ---- the hold's runes: strokes in a panel 120 wide (u -60..60) and 200 high, cut on a face with its normal +X at x0
const RUNES = [
  [[0, 10, 0, 190], [0, 190, 40, 150], [0, 120, -40, 80]],
  [[0, 20, 40, 100], [40, 100, 0, 180], [0, 180, -40, 100], [-40, 100, 0, 20]],
  [[-30, 10, -30, 190], [30, 10, 30, 190], [-30, 100, 30, 140]],
  [[0, 10, 0, 190], [0, 190, -36, 150], [0, 190, 36, 150], [-36, 60, 36, 60]],
  [[0, 10, 0, 160], [-42, 160, 42, 160], [-42, 190, 42, 190], [-42, 160, -42, 190], [42, 160, 42, 190]],
  [[-40, 20, 40, 70], [40, 70, -40, 120], [-40, 120, 40, 170]],
];
const rune = (G, x0, u0, z0, k, s = 1, col = HD.brass) => { for (const [a, b, c, d] of RUNES[k % RUNES.length]) { const L = Math.hypot(c - a, d - b) * s, m = G.n; G.box(0, 0, 0, 1.5, L / 2 + 4 * s, 4.5 * s, col); G.place(m, { x: x0 + 1.5, y: u0 + ((a + c) / 2) * s, z: z0 + ((b + d) / 2) * s, roll: (Math.atan2(d - b, c - a) * 180) / Math.PI }); } };
// a rune panel on the +X face at x0: a dark sunk-looking field, a lighter frame, the rune's strokes in brass
const runePanel = (G, x0, u0, z0, w, h, k) => { G.box(x0 + 2, u0, z0 + h / 2, 2, w / 2 + 8, h / 2 + 8, HD.stoneL); G.box(x0 + 3, u0, z0 + h / 2, 3, w / 2, h / 2, HD.soot); rune(G, x0 + 5, u0, z0 + (h - 200 * (h / 240)) / 2, k, h / 240); };

// ---- a pillar of the hold: a square shaft of drums, its corners chamfered, on a stepped base; a carved band at knee
// height, rune panels on its four faces at eye height with a band over them, another band two-thirds up; a capital
// stepping out in four courses to carry the beams. h: floor to the underside of the beams (it runs 10 into them).
export const PIL = { w: 280 };
export function holdPillar(h = 2160, w = 280, seed = 1) {
  h = q(h, 10); w = q(w, 10); seed = N(seed);
  return ['hdpillar|' + [h, w, seed % 6].join('|'), shape((G) => {
    const a = w / 2, S = HD.stone, R = rng(seed * 31 + h), top = h + 10;
    prism(G, cham(a + 60, 18), 0, 50, HD.stoneD);
    prism(G, cham(a + 40, 16), 50, 88, (i) => (i === -1 ? HD.stoneL : HD.stoneL));
    prism(G, cham(a + 22, 14), 88, 112, (i) => pick(S, i + seed));
    // the shaft in drums, each its own stone
    for (let z = 112, j = 0; z < top - 300; j++) { const z1 = Math.min(top - 300, z + 280 + Math.round(R() * 60)); prism(G, cham(a, 26), z, z1, (i) => (i < 0 ? HD.stoneD : pick(S, j * 3 + i + seed))); z = z1; }
    // the bands: lighter stone standing a little proud, studded with brass on every face
    const band = (z0, z1, studs) => { prism(G, cham(a + 8, 28), z0, z1, HD.stoneL);
      if (studs) for (let f = 0; f < 4; f++) for (const u of [-a * 0.55, -a * 0.18, a * 0.18, a * 0.55]) { const m = G.n; G.box(a + 10, u, (z0 + z1) / 2, 2, 6, 6, HD.brass); G.place(m, { yaw: f * 90 }); } };
    band(250, 300, true); band(580, 620, false); band(Math.round(h * 0.66), Math.round(h * 0.66) + 44, true);
    // the rune panels at eye height, one rune to a face
    for (let f = 0; f < 4; f++) { const m = G.n; runePanel(G, a, 0, 330, a * 1.1, 220, seed + f * 2); G.place(m, { yaw: f * 90 }); }
    // the capital
    prism(G, cham(a + 14, 26), top - 300, top - 240, HD.stoneL);
    prism(G, cham(a + 36, 26), top - 240, top - 170, (i) => pick(S, i + 2));
    prism(G, cham(a + 62, 24), top - 170, top - 84, (i) => pick(S, i + 1));
    prism(G, cham(a + 84, 18), top - 84, top, HD.stoneD);
  })];
}
// ---- the same against a wall: half a pillar, its back on x = 0, standing d out into the room (+X)
export function pilaster(h = 2160, w = 240, d = 70, seed = 1) {
  h = q(h, 10); w = q(w, 10); d = q(d, 10); seed = N(seed);
  return ['hdpilast|' + [h, w, d, seed % 6].join('|'), shape((G) => {
    const b = w / 2, S = HD.stone, top = h + 10;
    prism(G, halfCham(d + 60, 18, b + 60), 0, 50, HD.stoneD);
    prism(G, halfCham(d + 40, 16, b + 40), 50, 88, HD.stoneL);
    prism(G, halfCham(d + 22, 14, b + 22), 88, 112, (i) => pick(S, i + seed));
    for (let z = 112, j = 0; z < top - 300; j++) { const z1 = Math.min(top - 300, z + 300); prism(G, halfCham(d, 22, b), z, z1, (i) => (i < 0 ? HD.stoneD : pick(S, j * 3 + i + seed))); z = z1; }
    for (const [z0, z1] of [[250, 300], [580, 620], [Math.round(h * 0.66), Math.round(h * 0.66) + 44]]) prism(G, halfCham(d + 8, 24, b + 8), z0, z1, HD.stoneL);
    runePanel(G, d, 0, 330, b * 1.1, 220, seed);
    prism(G, halfCham(d + 14, 22, b + 14), top - 300, top - 240, HD.stoneL);
    prism(G, halfCham(d + 36, 22, b + 36), top - 240, top - 170, (i) => pick(S, i + 2));
    prism(G, halfCham(d + 62, 20, b + 62), top - 170, top - 84, (i) => pick(S, i + 1));
    prism(G, halfCham(d + 84, 16, b + 84), top - 84, top, HD.stoneD);
  })];
}

// ---- braziers. kind 0: a tall iron stand, three legs splayed from a ring to the floor, the bowl on top (170); kind 1: a
// bronze bowl on a stone pedestal (124). Their coals and flames glow (a pair: draw main, then glow).
export const BRZ = [{ h: 170, r: 50 }, { h: 124, r: 84 }];
export function brazier(kind = 0) {
  const B = BRZ[kind];
  return pair('hdbrazier|' + kind, (G, P) => {
    const { h, r } = B;
    if (G) {
      if (kind === 0) {
        for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.5; G.tube([[Math.cos(a) * 44, Math.sin(a) * 44, 0], [Math.cos(a) * 30, Math.sin(a) * 30, 60], [Math.cos(a) * 16, Math.sin(a) * 16, 120], [Math.cos(a) * 20, Math.sin(a) * 20, h - 26]], 4, HD.iron, { S: 5, M: 8 });
          G.blob(Math.cos(a) * 46, Math.sin(a) * 46, 4, 9, 9, 5, HD.ironD, { nu: 6, nv: 4 }); }
        G.lathe([[22, h - 34], [26, h - 30], [26, h - 24], [22, h - 20], [22, h - 34]], HD.iron, 10, [0, 0, 0], [1, 1], true);
        G.lathe([[17, 96], [21, 100], [21, 106], [17, 110], [17, 96]], HD.iron, 10, [0, 0, 0], [1, 1], true);
        G.lathe([[0, h - 30], [22, h - 30], [r - 6, h - 6], [r, h + 6], [r - 4, h + 8], [r - 10, h - 2], [0, h - 8]], (k) => (k === 3 ? HD.brassD : HD.ironL), 14);
      } else {
        prism(G, cham(56, 14), 0, 18, HD.stoneD); prism(G, cham(42, 10), 18, h - 34, (i) => pick(HD.stone, i)); prism(G, cham(52, 12), h - 34, h - 22, HD.stoneL);
        G.lathe([[0, h - 22], [40, h - 22], [r - 8, h + 6], [r, h + 22], [r - 6, h + 26], [r - 14, h + 12], [0, h + 4]], (k) => (k === 3 ? HD.brassL : HD.brass), 16);
      }
      G.blob(0, 0, kind ? h + 10 : h - 2, r * 0.78, r * 0.78, 9, HD.coal, { nu: 10, nv: 4 });
    }
    if (P) { const z = kind ? h + 14 : h + 2;
      P.blob(0, 0, z, r * 0.7, r * 0.7, 6, HD.ember, { nu: 10, nv: 4, warp: (x, y, zz) => [x, y, zz + Math.sin(x * 0.2) * Math.cos(y * 0.2) * 3] });
      for (const [dx, dy, fh, fr] of [[0, 0, 70, 22], [r * 0.34, r * 0.2, 46, 15], [-r * 0.3, r * 0.26, 52, 16], [r * 0.05, -r * 0.36, 40, 14]]) P.blob(dx, dy, z + fh * 0.5, fr, fr, fh * 0.55, dx || dy ? HD.fire : HD.flame, { nu: 8, nv: 6, warp: (x, y, zz, nx, ny, nz) => { const t = Math.max(0, Math.min(1, zz / (fh * 0.55) * 0.5 + 0.5)); return [x * (1.15 - t * 0.9), y * (1.15 - t * 0.9), zz]; } });
    }
  });
}
// ---- a torch in an iron bracket on a wall (its back on x = 0, the torch leaning out +X); its flame glows
export function sconce() {
  return pair('hdsconce', (G, P) => {
    if (G) { G.box(3, 0, 0, 3, 16, 34, HD.iron); for (const z of [-26, 26]) G.blob(6, 0, z, 3, 5, 5, HD.ironL, { nu: 6, nv: 4 });
      G.tube([[4, 0, -10], [30, 0, -2], [44, 0, 14]], 3, HD.iron, { S: 5 }); G.lathe([[0, 0], [10, 0], [12, 16], [0, 16]], HD.iron, 8, [44, 0, 12]);
      G.tube([[44, 0, -16], [48, 0, 18], [54, 0, 46]], 5, HD.oakD, { S: 6 }); G.lathe([[0, 0], [8, 0], [9, 14], [5, 20], [0, 20]], HD.straw, 8, [54, 0, 42]); }
    if (P) { P.blob(55, 0, 72, 10, 10, 18, HD.fire, { nu: 8, nv: 6, warp: (x, y, z) => { const t = z / 18 * 0.5 + 0.5; return [x * (1.2 - t * 0.9), y * (1.2 - t * 0.9), z]; } }); P.blob(55, 0, 66, 6, 6, 10, HD.flame, { nu: 6, nv: 5 }); }
  });
}

// ---- a stone gnome: the hold's guardians at its gates (kind 0: a warrior, both hands on his war-hammer stood on its
// head) and its kings along the road (kind 1: a crown on his hat, both hands on a staff crowned with a cog). h: the
// figure's height from the plinth's top to the tip of his hat; the plinth (STAT.p high, STAT.w square) under it.
export const STAT = { p: 160, w: 580 };
export function gnomeStatue(h = 1000, kind = 0, seed = 1) {
  h = q(h, 20); seed = N(seed);
  return ['hdstatue|' + [h, kind, seed % 3].join('|'), shape((G) => {
    const k = h / 1000, p = STAT.p, T = HD.statue, c0 = pick(T, seed), c1 = pick(T, seed + 1), c2 = pick(T, seed + 2), cd = HD.statueD;
    // the plinth: a footing, the die (a rune panel and a band on its front), a cornice
    G.box(0, 0, 25, STAT.w / 2, STAT.w / 2, 25, HD.stoneD);
    G.box(0, 0, 50 + 45, STAT.w / 2 - 24, STAT.w / 2 - 24, 45, (nx, ny, nz) => (nz ? HD.stoneD : pick(HD.stone, Math.round(nx * 2 + ny * 3) + 4)));
    runePanel(G, STAT.w / 2 - 24, 0, 54, 200, 82, seed + kind * 3);
    G.box(0, 0, 140 + 10, STAT.w / 2 - 8, STAT.w / 2 - 8, 10, HD.stoneL);
    const F = (from) => G.place(from, { z: p, s: k });
    const m0 = G.n;
    // boots, the coat to his knees (its hem darker, a row of buttons down its front), the belt and its buckle
    for (const s of [-1, 1]) G.blob(64, s * 64, 26, 76, 42, 28, cd, { nu: 12, nv: 8, warp: (x, y, z) => [x, y, Math.max(z, -26)] });
    const coat = [[204, 0], [208, 36], [198, 140], [184, 260], [170, 370], [162, 440], [156, 500], [144, 548], [118, 590], [70, 616], [0, 624]];
    G.lathe(coat, (j) => (j === 0 ? cd : c0), 22);
    const rAt = (z) => { for (let j = 1; j < coat.length; j++) if (coat[j][1] >= z) { const [r0, z0] = coat[j - 1], [r1, z1] = coat[j]; return r0 + ((r1 - r0) * (z - z0)) / (z1 - z0); } return 0; };
    for (let z = 110; z < 350; z += 56) G.blob(rAt(z) - 1, 0, z, 10, 10, 10, c2, { nu: 8, nv: 5 });
    G.lathe([[164, 366], [175, 372], [175, 414], [164, 420]], cd, 22); G.box(176, 0, 393, 9, 28, 22, c2); G.box(184, 0, 393, 2, 16, 12, cd);
    // the beard to his belt, his moustache, the round head, the great nose, cheeks, brows and eyes under them
    G.blob(150, 0, 500, 64, 116, 150, c2, { nu: 16, nv: 12, warp: (x, y, z) => { const f = 0.34 + 0.66 * Math.pow(Math.max(0, Math.min(1, (z + 150) / 300)), 0.7); return [x * (0.55 + 0.45 * f) + Math.sin(y * 0.09) * 5, y * f, z]; } });
    for (const s of [-1, 1]) { const m = G.n; G.blob(0, 0, 0, 26, 54, 17, c1, { nu: 10, nv: 6 }); G.place(m, { x: 194, y: s * 46, z: 600, roll: s * 18 }); }
    G.blob(40, 0, 640, 122, 122, 120, c0, { nu: 16, nv: 12 });
    G.blob(184, 0, 640, 44, 36, 42, c1, { nu: 12, nv: 8 });
    for (const s of [-1, 1]) { G.blob(156, s * 60, 652, 34, 30, 30, c0, { nu: 10, nv: 6 }); G.blob(165, s * 42, 690, 10, 10, 10, HD.eye, { nu: 6, nv: 4 }); const m = G.n; G.blob(0, 0, 0, 14, 34, 11, c2, { nu: 8, nv: 5 }); G.place(m, { x: 168, y: s * 44, z: 706, roll: -s * 10 }); }
    // his hat: a band round his brow, the tall cone bent back at its tip; a crown on a king's
    G.lathe([[144, 700], [158, 708], [158, 734], [144, 742], [0, 742]], cd, 22, [24, 0, 0]);
    G.tube([[24, 0, 738], [16, 0, 840], [-6, 0, 934], [-50, 0, 1000]], (t) => 144 * Math.pow(1 - t, 1.08) + 3, c1, { S: 16, M: 18 });
    if (kind === 1) { G.lathe([[128, 738], [150, 738], [150, 760], [128, 760]], c2, 22, [22, 0, 0]);
      for (let j = 0; j < 10; j++) { const a = (j / 10) * Math.PI * 2, m = G.n; G.box(0, 0, 0, 7, 16, 24, c2); G.map(m, ([x, y, z]) => [x * (1 - (z + 24) / 96), y * (1 - (z + 24) / 50), z]); G.place(m, { x: 22 + Math.cos(a) * 142, y: Math.sin(a) * 142, z: 784, yaw: (a * 180) / Math.PI }); } }
    // the sleeves round the beard to the cuffs, the hands on the haft or the staff
    for (const s of [-1, 1]) { G.tube([[14, s * 140, 560], [70, s * 186, 488], [146, s * 116, 446], [180, s * 50, 452]], (t) => 52 - t * 16, s > 0 ? c0 : c1, { S: 12, M: 12 }); G.blob(180, s * 48, 452, 24, 22, 32, cd, { nu: 8, nv: 6 }); G.blob(200, s * 30, 452, 32, 30, 31, c2, { nu: 10, nv: 6 }); }
    if (kind === 0) { G.box(206, 0, 48, 62, 100, 48, cd); for (const s of [-1, 1]) G.box(206, s * 96, 48, 66, 6, 52, c2); G.box(206, 0, 112, 12, 12, 26, c1);
      G.tube([[206, 0, 96], [206, 0, 474]], 18, c1, { S: 10 }); for (const z of [300, 340, 380]) G.lathe([[20, z - 6], [22, z], [20, z + 6]], c2, 10, [206, 0, 0]); G.blob(206, 0, 484, 24, 24, 24, c0, { nu: 8, nv: 6 }); }
    else { G.tube([[206, 0, 0], [206, 0, 880]], 16, c1, { S: 10 }); G.lathe([[20, 0], [20, 30], [16, 34]], cd, 10, [206, 0, 0]);
      const m = G.n; G.lathe([[0, -9], [64, -9], [64, 9], [0, 9]], c2, 20); for (let j = 0; j < 8; j++) { const a = (j / 8) * Math.PI * 2, b = G.n; G.box(0, 0, 0, 12, 12, 9, c2); G.place(b, { x: Math.cos(a) * 72, y: Math.sin(a) * 72, yaw: (a * 180) / Math.PI }); } G.lathe([[0, -14], [20, -14], [20, 14], [0, 14]], c0, 10);
      G.place(m, { x: 206, z: 944, pitch: 90 }); }
    F(m0);
  })];
}
// ---- the throne of the hold: a seat of the pale stone on its block, arms ending in scrolls, a tall back with a gable,
// the hold's cog over it in brass, a red cushion. Its front +X.
export function throne() {
  return ['hdthrone', shape((G) => {
    const L = HD.stoneL, S = HD.stone;
    G.box(10, 0, 35, 100, 140, 35, (nx, ny, nz) => (nz > 0 ? L : S[1])); G.box(10, 0, 74, 104, 144, 4, HD.stoneD);
    G.blob(20, 0, 86, 86, 118, 10, HD.red, { e: 4, nu: 12, nv: 6 });
    for (const s of [-1, 1]) { G.box(14, s * 158, 75, 106, 20, 75, (nx, ny, nz) => (nz > 0 ? L : S[2])); const m = G.n; G.lathe([[0, -22], [26, -22], [28, -14], [28, 14], [26, 22], [0, 22]], L, 12); G.place(m, { x: 120, y: s * 158, z: 150, roll: 90 }); }
    G.box(-92, 0, 260, 22, 160, 260, (nx) => (nx > 0 ? L : S[0]));
    for (let i = 0; i < 6; i++) { const w = 160 - i * 26; G.box(-92, 0, 527 + i * 14, 22, w, 7, i % 2 ? L : S[3]); }
    runePanel(G, -70, 0, 190, 200, 240, 3);
    { const m = G.n; G.lathe([[0, -8], [58, -8], [58, 8], [0, 8]], HD.brass, 20); for (let j = 0; j < 8; j++) { const a = (j / 8) * Math.PI * 2, b = G.n; G.box(0, 0, 0, 10, 10, 7, HD.brass); G.place(b, { x: Math.cos(a) * 66, y: Math.sin(a) * 66, yaw: (a * 180) / Math.PI }); } G.lathe([[0, -12], [18, -12], [18, 12], [0, 12]], HD.brassL, 10); G.place(m, { x: -64, z: 520, pitch: 90 }); }
  })];
}
// ---- a dais of n steps, each rise high, the top w by d (its front +X, back on x = -d/2): every step's nosing pale
export function dais(w = 1800, d = 700, n = 3, rise = 15) {
  w = q(w, 10); d = q(d, 10);
  return ['hddais|' + [w, d, n, rise].join('|'), shape((G) => {
    for (let i = 0; i < n; i++) { const e = (n - 1 - i) * 90, hx = d / 2 + e / 2, hy = w / 2 + e, cx = -d / 2 + hx, z0 = i * rise;
      G.box(cx, 0, z0 + rise / 2, hx, hy, rise / 2, (nx, ny, nz) => (nz > 0 ? pick(HD.flag, i + 1) : HD.stoneD));
      G.box(cx + hx - 8, 0, z0 + rise / 2, 8, hy, rise / 2 + 0.4, HD.stoneL); for (const s of [-1, 1]) G.box(cx, s * (hy - 8), z0 + rise / 2, hx, 8, rise / 2 + 0.4, HD.stoneL); }
  })];
}

// ---- a prism over a polygon in the (y, z) plane (counter-clockwise seen from +X), from x0 back to x1 front; c a colour
// or c(i) (-1 the front, -2 the back)
const prismX = (G, poly, x0, x1, c) => {
  const n = poly.length, cf = typeof c === 'function' ? c : () => c;
  for (let i = 0; i < n; i++) { const [ay, az] = poly[i], [by, bz] = poly[(i + 1) % n], k = G.n, col = cf(i); G.v(x0, ay, az, col); G.v(x0, by, bz, col); G.v(x1, by, bz, col); G.v(x1, ay, az, col); G.idx.push(k, k + 1, k + 2, k, k + 2, k + 3); }
  let k = G.n; const fr = cf(-1); for (const [y, z] of poly) G.v(x1, y, z, fr); for (let i = 1; i < n - 1; i++) G.idx.push(k, k + i, k + i + 1);
  k = G.n; const bk = cf(-2); for (const [y, z] of poly) G.v(x0, y, z, bk); for (let i = 1; i < n - 1; i++) G.idx.push(k, k + i + 1, k + i);
};
// a ring handle on a boss plate, on a face whose normal is +X at x0
const ringHandle = (G, x0, y, z, r = 30) => { G.box(x0 + 3, y, z + r * 0.3, 3, r * 0.5, r * 0.5, HD.ironL); const m = G.n; G.lathe([[r - 4, -4], [r, 0], [r - 4, 4], [r - 8, 0], [r - 4, -4]], HD.iron, 14, [0, 0, 0], [1, 1], true); G.place(m, { x: x0 + 10, y, z: z - r * 0.4, pitch: 90 }); G.box(x0 + 8, y, z + r * 0.3 - 6, 3, 6, 10, HD.iron); };

// ---- the great doors of the hold, shut, in a round-arched opening w wide whose arch springs at zs: two leaves of oak
// planks banded with iron, studded, a ring on each; the day's light through the crack between them and under them
// (glow: a pane behind them, a blade of light along the floor). Its front (the hall's side) +X; the leaves stand on
// x -26..26.
export function greatDoors(w = 1100, zs = 850) {
  w = q(w, 10); zs = q(zs, 10);
  return pair('hdgdoors|' + [w, zs].join('|'), (G, P) => {
    const r = w / 2, gap = 7, top = (u) => zs + Math.sqrt(Math.max(0, r * r - u * u)) - 3;
    if (G) for (const s of [-1, 1]) {
      const n = 6, u0 = gap / 2, u1 = r - 2, du = (u1 - u0) / n;
      for (let i = 0; i < n; i++) { const a = u0 + i * du, b = a + du, P2 = [[a, 6], [b, 6], [b, top(b)], [a, top(a)]].map(([u, z]) => [s * u, z]); if (s < 0) P2.reverse(); prismX(G, P2, -24 + (i % 2), 24 - (i % 2), pick(HD.oak, i + (s > 0 ? 0 : 1))); }
      for (const z of [180, 520, zs - 60]) { const L = Math.min(u1, Math.sqrt(Math.max(0, r * r - Math.max(0, z + 40 - zs) ** 2)) - 6); G.box(27, s * (u0 + L) / 2, z, 3, (L - u0) / 2, 22, HD.iron); for (let u = u0 + 40; u < L - 20; u += 70) G.blob(31, s * u, z, 3, 6, 6, HD.ironL, { nu: 6, nv: 4 }); }
      ringHandle(G, 24, s * (u0 + 90), 440, 34);
    }
    if (P) { P.box(-32, 0, (zs + r) / 2, 2, r, (zs + r) / 2, 0xfff0c8);
      const pos = [[30, -gap * 0.6, 0.7], [30, gap * 0.6, 0.7], [1100, 90, 0.7], [1100, -90, 0.7]]; const k = P.n; for (const [x, y, z] of pos) P.v(x, y, z, 0xb8a888); P.idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
      P.box(26, 0, 3, 2, r - 6, 3, 0xfff0c8); }
  });
}
// ---- the Deep Gate: the way down out of the hold, in a square cut w wide and h high through a wall t thick: two
// jambs and a lintel carved with the hold's runes and its cog, the two stone leaves shut between them, studded,
// ringed; the Nightshade's light through the crack and under them (glow). Front +X; the wall's middle on x = 0.
export const DGATE = { jamb: 150, lint: 230 };
export function deepGate(w = 1400, h = 1360, t = 200) {
  w = q(w, 10); h = q(h, 10); t = q(t, 10);
  return pair('hddgate|' + [w, h, t].join('|'), (G, P) => {
    const { jamb, lint } = DGATE, iw = w / 2 - jamb, dh = h - lint, hd = t / 2 + 24;
    if (G) {
      for (const s of [-1, 1]) { const y = s * (w / 2 - jamb / 2);
        G.box(0, y, 40, hd + 10, jamb / 2 + 10, 40, HD.stoneD);
        for (let z = 80, j = 0; z < dh; j++) { const z1 = Math.min(dh, z + 230); G.box(0, y, (z + z1) / 2, hd, jamb / 2, (z1 - z) / 2 - 0.5, pick(HD.stone, j + (s > 0 ? 1 : 3))); z = z1; }
        G.box(0, y, 560, hd + 6, jamb / 2 + 6, 26, HD.stoneL); runePanel(G, hd, y, 640, jamb * 0.8, 260, 2 + (s > 0 ? 3 : 0)); }
      G.box(0, 0, dh + lint / 2, hd + 16, w / 2 + 30, lint / 2, (nx, ny, nz) => (nz < 0 ? HD.stoneD : HD.stone[2]));
      G.box(hd + 17, 0, dh + 26, 1, w / 2 + 30, 14, HD.stoneL); G.box(hd + 17, 0, h - 26, 1, w / 2 + 30, 14, HD.stoneL);
      for (let i = -3; i <= 3; i++) if (i) rune(G, hd + 16, i * 150, dh + 50, i + 7, 0.62);
      { const m = G.n; G.lathe([[0, -10], [84, -10], [84, 10], [0, 10]], HD.brass, 24); for (let j = 0; j < 10; j++) { const a = (j / 10) * Math.PI * 2, b = G.n; G.box(0, 0, 0, 14, 14, 9, HD.brass); G.place(b, { x: Math.cos(a) * 94, y: Math.sin(a) * 94, yaw: (a * 180) / Math.PI }); } G.lathe([[0, -16], [30, -16], [30, 16], [0, 16]], HD.brassL, 12); G.place(m, { x: hd + 18, z: dh + lint / 2, pitch: 90 }); }
      // the leaves: shut, a hair apart, panels framed in the pale stone, iron studs, a ring each
      for (const s of [-1, 1]) { const y0 = s * 4, y1 = s * iw, yc = (y0 + y1) / 2, hw = (iw - 4) / 2;
        G.box(0, yc, dh / 2 + 2, 30, hw, dh / 2 - 2, pick(HD.stone, s > 0 ? 0 : 2));
        for (const [z0, z1] of [[70, dh * 0.46], [dh * 0.54, dh - 70]]) { G.box(32, yc, (z0 + z1) / 2, 2, hw - 50, (z1 - z0) / 2, HD.stoneL); G.box(33, yc, (z0 + z1) / 2, 3, hw - 66, (z1 - z0) / 2 - 16, pick(HD.stone, s > 0 ? 3 : 1)); rune(G, 35, yc, (z0 + z1) / 2 - 100, s > 0 ? 4 : 1, 1); }
        for (const z of [40, dh * 0.5, dh - 40]) for (let u = 40; u < iw - 30; u += 60) G.blob(31, s * u, z, 4, 6, 6, HD.iron, { nu: 6, nv: 4 });
        ringHandle(G, 30, s * 70, dh * 0.5 - 60, 40); }
    }
    if (P) { const V = 0xb070ff; P.box(-34, 0, dh / 2, 2, 12, dh / 2, V); P.box(0, 0, 2, 32, iw - 10, 2, V);
      const k = P.n; for (const [x, y] of [[34, -10], [34, 10], [820, 150], [820, -150]]) P.v(x, y, 0.7, 0x6a4a9a); P.idx.push(k, k + 1, k + 2, k, k + 2, k + 3); }
  });
}

// ---- a great hearth against a wall (its back on x = 0, its front +X), w wide: jambs, the fire-back sooted, firedogs
// and logs, the mantel, a hood stepping in to the chimney breast that runs up to the roof (to z = ceil); a crane on
// the west jamb swung over the fire with the pot on its chain. Its fire glows.
export const HEARTH = { d: 140, jh: 470 };
export function hearth(w = 760, ceil = 2300, seed = 1) {
  w = q(w, 10); ceil = q(ceil, 10); seed = N(seed);
  return pair('hdhearth|' + [w, ceil, seed % 3].join('|'), (G, P) => {
    const { d, jh } = HEARTH, ow = w / 2 - 110;
    if (G) {
      G.box(d / 2 + 50, 0, 6, d / 2 + 50, w / 2 + 60, 6, HD.stoneD);
      for (const s of [-1, 1]) { const y = s * (w / 2 - 55); for (let z = 12, j = 0; z < jh; j++) { const z1 = Math.min(jh, z + 115); G.box(d / 2, y, (z + z1) / 2, d / 2, 55, (z1 - z) / 2 - 0.4, pick(HD.stone, j * 2 + (s > 0 ? 1 : 0))); z = z1; } }
      G.box(1, 0, jh / 2 + 6, 1, ow, jh / 2 - 6, HD.soot); G.box(d / 2, 0, 13, d / 2 - 2, ow, 1, HD.soot);
      for (const s of [-1, 1]) { G.box(d * 0.55, s * (ow * 0.5), 30, 30, 5, 16, HD.iron); G.box(d * 0.55 + 26, s * (ow * 0.5), 52, 5, 5, 8, HD.ironL); }
      for (const [y, z, a] of [[0, 54, 0], [-30, 74, 12], [34, 72, -14]]) G.tube([[d * 0.15, y + Math.sin(a) * 160, z], [d * 0.95, y - Math.sin(a) * 160, z]], 14, pick(HD.oak, y), { S: 7 });
      G.box(d / 2 + 14, 0, jh + 40, d / 2 + 14, w / 2 + 40, 40, (nx, ny, nz) => (nz < 0 ? HD.stoneD : HD.stoneL));
      for (let z = jh + 80, j = 0; z < jh + 340; j++) { const t = (z - jh - 80) / 260, z1 = Math.min(jh + 340, z + 65), dd = d + 10 - t * 50, ww = w / 2 - t * 70; G.box(dd / 2, 0, (z + z1) / 2, dd / 2, ww, (z1 - z) / 2 - 0.3, pick(HD.stone, j)); z = z1; }
      for (let z = jh + 340, j = 0; z < ceil + 20; j++) { const z1 = Math.min(ceil + 20, z + 160); G.box(50, 0, (z + z1) / 2, 50, w / 2 - 70, (z1 - z) / 2 - 0.3, pick(HD.stone, j + 1)); z = z1; }
      G.box(52, 0, jh + 560, 52, w / 2 - 50, 22, HD.stoneL); runePanel(G, 100, 0, jh + 620, 140, 200, seed + 2);
      // the crane: its post in irons on the jamb's inner face, the arm over the fire, the pot on its chain
      const py = -(ow - 8); G.tube([[d * 0.7, py, 14], [d * 0.7, py, 330]], 4, HD.iron, { S: 6 }); for (const z of [60, 300]) G.box(d * 0.7, py - 6, z, 6, 6, 6, HD.ironL);
      G.tube([[d * 0.7, py, 320], [d * 0.7, 0, 320]], 4, HD.iron, { S: 6 }); G.tube([[d * 0.7, py + 2, 180], [d * 0.7, py * 0.4, 316]], 3, HD.iron, { S: 5 });
      G.tube([[d * 0.7, 0, 318], [d * 0.7, 0, 200]], 1.6, HD.ironL, { S: 4 }); G.lathe([[0, 120], [34, 122], [44, 150], [42, 180], [34, 196], [36, 200], [30, 202], [0, 200]], HD.ironD, 14, [d * 0.7, 0, 0]);
      G.tube([[d * 0.7 - 30, 0, 196], [d * 0.7, 0, 230], [d * 0.7 + 30, 0, 196]], 1.6, HD.ironL, { S: 4 });
    }
    if (P) { P.blob(d * 0.55, 0, 44, d * 0.36, ow * 0.7, 8, HD.ember, { nu: 10, nv: 4 });
      for (const [dy, fh, fr] of [[0, 120, 46], [-90, 80, 32], [96, 90, 30], [-40, 60, 26], [50, 70, 26]]) P.blob(d * 0.55, dy, 60 + fh * 0.5, fr, fr * 0.7, fh * 0.55, dy ? HD.fire : HD.flame, { nu: 8, nv: 6, warp: (x, y, z) => { const t = Math.max(0, Math.min(1, z / (fh * 0.55) * 0.5 + 0.5)); return [x * (1.15 - t * 0.9), y * (1.15 - t * 0.9), z]; } }); }
  });
}

// a frustum between two rectangles (x0, x1, y0, y1 at z0; the same primed at z1), its sides and both ends
const loft = (G, [ax0, ax1, ay0, ay1, z0], [bx0, bx1, by0, by1, z1], c) => {
  const cf = typeof c === 'function' ? c : () => c, A = [[ax1, ay0], [ax1, ay1], [ax0, ay1], [ax0, ay0]], B = [[bx1, by0], [bx1, by1], [bx0, by1], [bx0, by0]];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4, k = G.n, col = cf(i); G.v(A[i][0], A[i][1], z0, col); G.v(A[j][0], A[j][1], z0, col); G.v(B[j][0], B[j][1], z1, col); G.v(B[i][0], B[i][1], z1, col); G.idx.push(k, k + 1, k + 2, k, k + 2, k + 3); }
  let k = G.n; for (const [x, y] of B) G.v(x, y, z1, cf(-1)); G.idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
  k = G.n; for (const [x, y] of A) G.v(x, y, z0, cf(-2)); G.idx.push(k, k + 2, k + 1, k, k + 3, k + 2);
};

// ---- a smith's forge against a wall (back on x = 0, front +X): the raised hearth of coursed stone, its fire-back, the
// coal bed and its fire (glow), the tuyere in from its +Y side (where the bellows go), the hood on two iron posts
// narrowing to the flue that runs up to the roof (z = ceil); tongs and a poker leaning on its front
export const FORGE = { d: 440, w: 640, h: 90 };
export function forgeHearth(ceil = 1600, seed = 1) {
  ceil = q(ceil, 10); seed = N(seed);
  return pair('hdforge|' + [ceil, seed % 3].join('|'), (G, P) => {
    const { d, w, h } = FORGE, hw = w / 2;
    if (G) {
      for (let k = 0; k < 2; k++) for (let y = -hw, j = 0; y < hw - 1; j++) { const y1 = Math.min(hw, y + (k ? 150 : 110) + (j % 2) * 40); G.box(d / 2, (y + y1) / 2, k * 45 + 22.5, d / 2, (y1 - y) / 2 - 0.4, 22.3, pick(HD.stone, j + k * 2 + seed)); y = y1; }
      G.box(d - 4, 0, h + 3, 6, hw + 2, 3, HD.iron); for (const s of [-1, 1]) G.box(d / 2, s * (hw - 4), h + 3, d / 2, 6, 3, HD.iron);
      G.box(30, 0, h + 110, 30, hw, 110, (nx) => (nx > 0 ? HD.soot : HD.stone[1]));
      G.box(240, 0, h + 3, 120, 170, 3, HD.coal);
      G.tube([[240, hw + 60, h + 26], [240, 210, h + 20], [236, 150, h + 10]], 9, HD.iron, { S: 8 }); { const m = G.n; G.lathe([[0, 0], [16, 0], [16, 8], [0, 8]], HD.ironL, 10); G.place(m, { x: 240, y: hw + 60, z: h + 26, roll: -90 }); }
      const zb = 540, zt = 920;
      for (const s of [-1, 1]) { G.tube([[d - 16, s * (hw - 14), h], [d - 16, s * (hw - 14), zb + 4]], 8, HD.iron, { S: 6 }); G.box(d - 16, s * (hw - 14), h + 6, 14, 14, 6, HD.ironD); }
      loft(G, [0, d, -hw - 10, hw + 10, zb], [0, 230, -170, 170, zt], (i) => (i === -2 ? HD.soot : pick(HD.stone, i + 1)));
      G.box(d / 2, 0, zb + 10, d / 2, hw + 10, 10, HD.iron); G.box(5, 0, zb + 10, 5, hw + 10, 10, HD.iron);
      for (let z = zt, j = 0; z < ceil + 20; j++) { const z1 = Math.min(ceil + 20, z + 170); G.box(115, 0, (z + z1) / 2, 115, 170, (z1 - z) / 2 - 0.3, pick(HD.stone, j + 2)); z = z1; }
      G.tube([[d + 40, -150, 0], [d + 2, -140, h - 4]], 3, HD.ironD, { S: 5 }); G.tube([[d + 38, -126, 0], [d + 2, -120, h - 4]], 3, HD.ironD, { S: 5 });
      G.tube([[d + 46, 120, 0], [d + 2, 112, h - 2]], 3, HD.iron, { S: 5 }); G.box(d + 4, 112, h - 2, 4, 10, 4, HD.iron);
    }
    if (P) { P.blob(240, 0, h + 8, 110, 150, 7, HD.ember, { nu: 12, nv: 4 });
      for (const [dx, dy, fh, fr] of [[0, 0, 90, 36], [40, -70, 60, 24], [-30, 80, 66, 24], [50, 60, 50, 20]]) P.blob(240 + dx, dy, h + 10 + fh * 0.5, fr, fr, fh * 0.55, dx ? HD.fire : HD.flame, { nu: 8, nv: 6, warp: (x, y, z) => { const t = Math.max(0, Math.min(1, z / (fh * 0.55) * 0.5 + 0.5)); return [x * (1.15 - t * 0.9), y * (1.15 - t * 0.9), z]; } }); }
  });
}
// ---- the great bellows: two boards and the leather between on a timber frame, the nozzle +X; behind it the post and
// the rocker whose chain works the top board, a handle on the rocker's tail
export function bellows(L = 460) {
  L = q(L, 20);
  return ['hdbellows|' + L, shape((G) => {
    const O = HD.oak, hl = L / 2;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.box(sx * hl * 0.6, sy * 80, 70, 8, 8, 70, O[(sx + sy + 2) % 3]);
    for (const sy of [-1, 1]) G.box(0, sy * 80, 134, hl * 0.6 + 10, 8, 6, HD.oakD); for (const sx of [-1, 1]) { G.box(sx * hl * 0.6, 0, 134, 8, 88, 6, HD.oakD); G.box(sx * hl * 0.6, 0, 40, 8, 88, 6, HD.oakD); } G.box(0, 0, 40, hl * 0.6, 8, 6, HD.oakD);
    const tear = (s) => { const P = []; for (let i = 0; i <= 12; i++) { const a = Math.PI / 2 + (i / 12) * Math.PI; P.push([-hl + 100 + Math.cos(a) * 100 * s, Math.sin(a) * 100 * s]); } P.push([hl - 70, -22 * s], [hl - 70, 22 * s]); return P; };
    const ring = (s, z) => tear(s).map(([x, y]) => [x, y, z]);
    prism(G, tear(1), 140, 150, HD.oakL);
    { const A = ring(0.96, 150), B = ring(1.08, 176), C = ring(0.96, 202), n = A.length; for (const [U, W] of [[A, B], [B, C]]) for (let i = 0; i < n; i++) { const j = (i + 1) % n, k = G.n; for (const p of [U[i], U[j], W[j], W[i]]) G.v(p[0], p[1], p[2], i % 2 ? HD.leather : HD.leatherD); G.idx.push(k, k + 1, k + 2, k, k + 2, k + 3); } }
    { const m = G.n; prism(G, tear(1), 0, 10, HD.oak[1]); G.place(m, { z: 202 }); }
    G.tube([[hl - 74, 0, 176], [hl + 50, 0, 168]], (t) => 22 - t * 12, HD.iron, { S: 8 });
    G.box(-hl - 30, 0, 230, 12, 12, 230, HD.oakD); G.box(-hl - 30, 0, 6, 30, 30, 6, HD.stoneD);
    G.tube([[-hl - 30, 0, 452], [-hl + 160, 0, 452], [hl * 0.2, 0, 448]], 7, HD.oak[2], { S: 6 }); G.tube([[-hl - 30, 0, 452], [-hl - 130, 0, 456]], 6, HD.oak[0], { S: 6 }); G.box(-hl - 130, 0, 420, 5, 16, 36, HD.oakD);
    G.tube([[hl * 0.2, 0, 446], [hl * 0.2, 0, 212]], 2, HD.ironL, { S: 4 }); G.box(hl * 0.2, 0, 214, 10, 10, 4, HD.iron);
  })];
}
// ---- an anvil on its block of stone, the horn +X
export function anvil() {
  return ['hdanvil', shape((G) => {
    G.box(0, 0, 30, 46, 40, 30, (nx, ny, nz) => (nz > 0 ? HD.stoneL : HD.stone[2])); G.box(0, 0, 66, 34, 26, 6, HD.ironD); G.box(0, 0, 84, 18, 14, 12, HD.iron);
    G.box(-4, 0, 102, 44, 18, 8, (nx, ny, nz) => (nz > 0 ? HD.ironL : HD.iron)); G.tube([[38, 0, 104], [66, 0, 103], [92, 0, 99]], (t) => 15 * (1 - t) + 1.5, HD.iron, { S: 8 }); G.box(-54, 0, 104, 8, 14, 6, HD.iron);
  })];
}
// ---- a stone quench trough, dark water in it
export function trough(L = 280) {
  L = q(L, 20);
  return ['hdtrough|' + L, shape((G) => {
    const hl = L / 2; G.box(0, 0, 6, hl, 50, 6, HD.stoneD); for (const s of [-1, 1]) { G.box(0, s * 43, 40, hl, 7, 34, pick(HD.stone, s + 2)); G.box(s * (hl - 7), 0, 40, 7, 36, 34, pick(HD.stone, s + 1)); }
    G.box(0, 0, 50, hl - 14, 36, 8, HD.water); G.box(0, 0, 58.5, hl - 14, 36, 0.5, HD.waterL);
  })];
}
// ---- a smith's rack on a wall (back on x = 0): an oak board on two brackets, pegs, tongs and hammers hung from them
export function smithRack(L = 300) {
  L = q(L, 20);
  return ['hdsrack|' + L, shape((G) => {
    const hl = L / 2; G.box(4, 0, 340, 4, hl, 30, HD.oak[0]); for (const s of [-1, 1]) G.box(14, s * (hl - 20), 300, 14, 4, 12, HD.oakD);
    for (let i = 0; i < 6; i++) { const y = -hl + 30 + (i * (L - 60)) / 5; G.tube([[8, y, 330], [30, y, 334]], 3, HD.oakD, { S: 4 });
      if (i % 2) { G.tube([[26, y - 5, 332], [26, y - 10, 210]], 2.2, HD.iron, { S: 4 }); G.tube([[26, y + 5, 332], [26, y + 10, 210]], 2.2, HD.iron, { S: 4 }); G.tube([[26, y - 10, 210], [26, y - 12, 190]], 3, HD.ironD, { S: 4 }); G.tube([[26, y + 10, 210], [26, y + 12, 190]], 3, HD.ironD, { S: 4 }); }
      else { G.tube([[24, y, 336], [24, y, 236]], 3.5, HD.oakL, { S: 5 }); G.box(24, y, 228, 11, 20, 10, HD.iron); } }
  })];
}
// ---- an oak table along X, its top on two trestles; on it, if laid, tankards, plates, a jug and a loaf
export function longTable(L = 1000, laid = 1, seed = 1) {
  L = q(L, 50); seed = N(seed);
  return ['hdtable|' + [L, laid, seed % 4].join('|'), shape((G) => {
    const hl = L / 2, O = HD.oak, R = rng(seed * 13 + L), top = 76;
    for (let i = -1; i <= 1; i++) G.box(0, i * 27, top - 4, hl, 13.2, 4, O[(i + 4 + seed) % 3]);
    for (const s of [-1, 1]) { const x = s * (hl - 90); for (const t of [-1, 1]) G.tube([[x, t * 54, 2], [x, t * 22, top - 8]], 6, HD.oakD, { S: 5 }); G.box(x, 0, 6, 10, 64, 6, HD.oakD); G.box(x, 0, top - 12, 12, 30, 4, HD.oakD); G.box(x, 0, (top - 8) / 2 + 6, 6, 6, (top - 8) / 2 - 6, HD.oakD); }
    G.box(0, 0, 40, hl - 90, 6, 6, O[1]);
    if (laid) for (let x = -hl + 70; x < hl - 50; x += 120 + R() * 60) for (const y of [-26, 26]) { const r = R();
      if (r < 0.32) { const m = G.n; G.lathe([[10, 0], [11, 22], [0, 22]], HD.iron, 8); G.lathe([[0, 0], [10, 0]], HD.iron, 8); G.tube([[10, 0, 18], [17, 0, 14], [10, 0, 5]], 1.6, HD.iron, { S: 4 }); G.place(m, { x, y, z: top, yaw: R() * 360 }); }
      else if (r < 0.7) { const m = G.n; G.lathe([[0, 0], [17, 0], [18, 2.4], [0, 2.4]], HD.wool, 10); G.place(m, { x, y, z: top }); }
      else if (r < 0.8) { const m = G.n; G.lathe([[0, 0], [12, 0], [15, 16], [11, 28], [7, 32], [8, 36], [0, 36]], HD.cream, 10); G.place(m, { x, y, z: top }); }
      else if (r < 0.88) G.blob(x, y, top + 9, 22, 13, 10, 0xb08048, { nu: 10, nv: 6 }); }
  })];
}
// ---- an oak bench along X
export function bench(L = 900) {
  L = q(L, 50);
  return ['hdbench|' + L, shape((G) => {
    const hl = L / 2; G.box(0, 0, 41, hl, 20, 4, HD.oak[2]);
    for (let x = -hl + 40; x <= hl - 39; x += Math.max(200, (L - 80) / Math.ceil((L - 80) / 400))) G.box(x, 0, 18.5, 7, 16, 18.5, HD.oakD);
    G.box(0, 0, 18, hl - 40, 4, 4, HD.oakD);
  })];
}
// ---- a banner of the hold hung from a beam (z = 0 its top: the chains run up 2 into the beam): a rod, the cloth in
// folds h deep with gold borders and a swallowtail, the hold's cog on both faces; it hangs on the YZ plane
export function banner(w = 300, h = 760, chain = 160, blue = 0, seed = 1) {
  w = q(w, 20); h = q(h, 20); chain = q(chain, 10); seed = N(seed);
  return ['hdbanner|' + [w, h, chain, blue, seed % 3].join('|'), shape((G) => {
    const C = blue ? HD.blue : HD.red, CD = blue ? HD.blueD : HD.redD, z0 = -chain - 6, hw = w / 2, n = 8;
    for (const s of [-1, 1]) G.tube([[0, s * (hw - 10), z0], [0, s * (hw - 10), 2]], 1.8, HD.ironL, { S: 4 });
    G.tube([[0, -hw - 20, z0], [0, hw + 20, z0]], 5, HD.oakD, { S: 6 }); for (const s of [-1, 1]) G.blob(0, s * (hw + 24), z0, 8, 8, 8, HD.brass, { nu: 8, nv: 5 });
    for (let i = 0; i < n; i++) { const y0 = -hw + (i * w) / n, y1 = y0 + w / n, ym = (y0 + y1) / 2, notch = Math.max(0, 1 - Math.abs(ym) / (hw * 0.5)) * 90, bot = z0 - 5 - h + notch, edge = i === 0 || i === n - 1;
      G.box((i % 2 ? 2 : -2), ym, (z0 - 5 + bot) / 2, 1.6, (y1 - y0) / 2 + 0.4, (z0 - 5 - bot) / 2, edge ? HD.gold : i % 3 ? C : CD); }
    for (const sx of [-1, 1]) { const m = G.n, cz = z0 - 5 - h * 0.34; G.lathe([[0, -1], [hw * 0.42, -1], [hw * 0.42, 1], [0, 1]], HD.gold, 16); for (let j = 0; j < 8; j++) { const a = (j / 8) * Math.PI * 2, b = G.n; G.box(0, 0, 0, hw * 0.07, hw * 0.07, 1, HD.gold); G.place(b, { x: Math.cos(a) * hw * 0.48, y: Math.sin(a) * hw * 0.48, yaw: (a * 180) / Math.PI }); } G.lathe([[0, -1.4], [hw * 0.16, -1.4], [hw * 0.16, 1.4], [0, 1.4]], C, 10);
      G.place(m, { x: sx * 4.6, z: cz, pitch: 90 }); }
  })];
}
// ---- a trophy on a wall (back on x = 0, centred on z = 0): a round shield, red and gold, its boss, two axes crossed
// behind it
export function trophy(seed = 1) {
  seed = N(seed);
  return ['hdtrophy|' + (seed % 2), shape((G) => {
    for (const s of [-1, 1]) { G.tube([[5, s * 120, -130], [5, -s * 96, 112]], 4, HD.oak[1], { S: 5 }); const m = G.n; G.box(0, 0, 0, 3, 18, 28, HD.ironL); G.map(m, ([x, y, z]) => [x, y + (z > 0 ? 6 : -6) * (y > 0 ? 1 : 0), z]); G.place(m, { x: 5, y: -s * 110, z: 124, roll: s * 38 }); }
    const m = G.n; G.lathe([[0, 0], [86, 0], [86, 6], [80, 9], [0, 9]], (k) => (k === 1 ? HD.iron : seed % 2 ? HD.blue : HD.red), 20); G.lathe([[0, 9], [22, 9], [18, 20], [0, 22]], HD.brass, 10);
    for (let j = 0; j < 2; j++) { const b = G.n; G.box(0, 0, 9.5, 4, 70, 0.8, HD.gold); G.place(b, { yaw: 45 + j * 90 }); }
    G.place(m, { x: 9, pitch: 90 });
  })];
}

// ---- barracks ------------------------------------------------------------------------------------------------------
// a row of n stone bunks along Y against a wall (back on x = 0, 120 deep): two beds each, straw ticks, a blanket and
// a pillow on each, stone posts at every end
export const BUNK = { L: 240, d: 120, h: 270 };
export function bunks(n = 3, seed = 1) {
  seed = N(seed);
  return ['hdbunks|' + [n, seed % 4].join('|'), shape((G) => {
    const { L, d, h } = BUNK, R = rng(seed * 7 + n), y0 = (-n * L) / 2;
    for (let i = 0; i <= n; i++) { const y = y0 + i * L; for (const x of [12, d - 12]) G.box(x, y, h / 2, 12, 12, h / 2, pick(HD.stone, i + (x > 50 ? 1 : 0))); G.box(d / 2, y, h - 8, d / 2, 14, 8, HD.stoneL); }
    for (let i = 0; i < n; i++) { const yc = y0 + (i + 0.5) * L; for (const z of [34, 160]) { G.box(d / 2, yc, z, d / 2, L / 2 - 12, 7, HD.stone[2]);
      G.blob(d / 2, yc, z + 15, d / 2 - 8, L / 2 - 22, 9, HD.straw, { e: 5, nu: 10, nv: 5 }); if (R() < 0.8) G.box(d / 2 + 4, yc + L * 0.1, z + 25, d / 2 - 10, L * 0.24, 2.5, R() < 0.5 ? HD.wool : HD.red);
      if (R() < 0.85) G.blob(d / 2, yc - L / 2 + 40, z + 28, 30, 20, 8, HD.cream, { nu: 8, nv: 5 }); } }
  })];
}
// ---- a weapons rack: two oak ends, a top bar and a foot bar (along Y), spears and axes stood in it
export function weaponRack(L = 400, seed = 1) {
  L = q(L, 20); seed = N(seed);
  return ['hdwrack|' + [L, seed % 3].join('|'), shape((G) => {
    const hl = L / 2, R = rng(seed * 11 + L);
    for (const s of [-1, 1]) { G.box(0, s * hl, 100, 10, 10, 100, HD.oakD); G.box(0, s * hl, 5, 40, 14, 5, HD.oakD); }
    G.box(0, 0, 186, 12, hl + 10, 8, HD.oak[0]); G.box(16, 0, 40, 8, hl + 10, 8, HD.oak[1]);
    for (let y = -hl + 40, i = 0; y < hl - 30; y += 50, i++) { const top = 186 + 40 + R() * 70;
      G.tube([[20, y, 30], [4, y, top]], 3.2, HD.oakL, { S: 5 });
      if (i % 3 === 1) { const m = G.n; G.box(0, 0, 0, 2, 26, 22, HD.ironL); G.map(m, ([x, yy, z]) => [x, yy + (yy > 0 ? z * 0.3 : 0), z]); G.place(m, { x: 4, y: y + 22, z: top - 20 }); }
      else G.tube([[4, y, top], [3, y, top + 34]], (t) => 6 * (1 - t) + 0.6, HD.ironL, { S: 5 }); }
  })];
}
// ---- a practice dummy: a post on crossed feet, a crossbar for arms, a stuffed sack for a body, a pot for a helm
export function dummy(seed = 1) {
  seed = N(seed);
  return ['hddummy|' + (seed % 2), shape((G) => {
    for (const yw of [0, 90]) { const m = G.n; G.box(0, 0, 6, 60, 8, 6, HD.oakD); G.place(m, { yaw: yw + 20 }); }
    G.tube([[0, 0, 0], [0, 0, 190]], 6, HD.oak[0], { S: 6 }); G.tube([[0, -70, 128], [0, 70, 128]], 4.5, HD.oak[2], { S: 6 });
    G.blob(0, 0, 110, 30, 36, 50, HD.straw, { nu: 12, nv: 8, warp: (x, y, z) => [x, y, z + Math.sin(y * 0.1) * 2] }); G.box(0, 0, 92, 31, 37, 3, HD.leatherD);
    G.blob(0, 0, 176, 20, 20, 22, HD.cream, { nu: 10, nv: 8 }); G.lathe([[0, 186], [22, 186], [23, 196], [18, 208], [0, 210]], seed % 2 ? HD.iron : HD.ironL, 10);
  })];
}
// ---- an oak chest bound with iron (100 x 64, 56 high), its lid shut or thrown back; open, coins in it (fill 1) or
// nothing (fill 0). Front +X.
export function chest(open = 0, fill = 0, seed = 1) {
  seed = N(seed);
  return ['hdchest|' + [open, fill, seed % 3].join('|'), shape((G) => {
    const c = pick(HD.oak, seed), hx = 32, hy = 50, h = 52;
    G.box(0, 0, 3, hx + 2, hy + 2, 3, HD.oakD);
    G.box(0, 0, 4 + (h - 4) / 2, hx, hy, (h - 4) / 2 - 0.3, (nx, ny, nz) => (nz > 0 ? HD.oakD : c));
    for (const y of [-hy + 12, 0, hy - 12]) G.box(0, y, h / 2 + 2, hx + 1.5, 4, h / 2 - 1, HD.iron);
    G.box(hx + 1.5, 0, h - 14, 1.5, 8, 10, HD.ironL);
    if (fill) G.blob(0, 0, h - 10, hx - 4, hy - 4, 8, HD.gold, { e: 4, nu: 10, nv: 4, warp: (x, y, z) => [x, y, z + Math.sin(x * 0.3 + y * 0.2) * 2] });
    else G.box(0, 0, h - 6, hx - 3, hy - 3, 0.6, HD.oakD);
    const m = G.n; G.box(hx, 0, 0, hx + 1, hy + 1, 5, c); G.blob(hx, 0, 4, hx, hy, 10, c, { e: 6, nu: 10, nv: 4, warp: (x, y, z) => [x, y, Math.max(0, z)] }); for (const y of [-hy + 12, 0, hy - 12]) G.box(hx, y, 6, hx + 2, 4, 6, HD.iron);
    if (open) G.place(m, { pitch: -110 }); G.map(m, ([x, y, z]) => [x - hx, y, z + h + 5]);
  })];
}
// ---- shelves against a wall (back on x = 0, 60 deep) L long, h high: oak uprights and boards; kind 0 the stores'
// jars and crocks, 1 the vault's strongboxes, 2 the vault's looted (bare, one board down at an end)
export function shelves(L = 600, h = 300, kind = 0, seed = 1) {
  L = q(L, 20); h = q(h, 20); seed = N(seed);
  return ['hdshelf|' + [L, h, kind, seed % 4].join('|'), shape((G) => {
    const hl = L / 2, R = rng(seed * 17 + L + kind), nU = Math.max(2, Math.round(L / 200) + 1), nB = Math.max(3, Math.round(h / 80)), dz = (h - 20) / nB;
    for (let i = 0; i < nU; i++) { const y = -hl + 6 + (i * (L - 12)) / (nU - 1); G.box(30, y, h / 2, 28, 6, h / 2, HD.oakD); }
    for (let k = 0; k < nB; k++) { const z = 16 + k * dz, broken = kind === 2 && k === 2; if (broken) { const m = G.n; G.box(0, 0, 0, 28, hl * 0.48, 3, pick(HD.oak, k)); G.place(m, { x: 32, y: -hl * 0.5 + 6, z: z - 64, roll: -26 }); continue; }
      G.box(30, 0, z, 28, hl - 2, 3, pick(HD.oak, k + seed));
      if (kind === 2) { if (R() < 0.3) G.blob(30 + (R() - 0.5) * 20, (R() - 0.5) * L * 0.8, z + 4, 10, 14, 1.5, HD.cream, { nu: 6, nv: 3 }); continue; }
      for (let y = -hl + 30; y < hl - 24; y += 40 + R() * 30) { if (R() < 0.18) continue;
        if (kind === 0) { const r = 10 + R() * 8, hh = 20 + R() * 22, m = G.n; G.lathe([[0, 0], [r, 0], [r + 3, hh * 0.4], [r * 0.6, hh], [r * 0.7, hh + 4], [0, hh + 4]], pick([0x8a6a4a, 0x6a7a6a, 0xa08a6a, 0x5a4a3a], Math.floor(R() * 4)), 8); G.place(m, { x: 30, y, z: z + 3 }); }
        else G.box(30, y, z + 3 + 14, 18, 16, 14, (nx, ny, nz) => (Math.abs(ny) > 0.5 ? HD.iron : HD.oakD)); } }
  })];
}
// ---- a great cask lying on its cradle, its head +X, a spigot in it
export function cask(r = 90, L = 220, seed = 1) {
  r = q(r, 10); L = q(L, 20); seed = N(seed);
  return ['hdcask|' + [r, L, seed % 3].join('|'), shape((G) => {
    const hl = L / 2, c = pick(HD.oak, seed);
    for (const s of [-1, 1]) { G.box(s * hl * 0.55, 0, 16, 14, r * 0.9, 16, HD.oakD); for (const t of [-1, 1]) G.box(s * hl * 0.55, t * r * 0.62, 34, 14, 14, 14, HD.oakD); }
    const m = G.n; G.lathe([[r * 0.86, -hl], [r * 0.96, -hl * 0.55], [r, 0], [r * 0.96, hl * 0.55], [r * 0.86, hl]], (k) => (k % 2 ? c : dark(c, 0.9)), 20);
    for (const z of [-hl * 0.86, -hl * 0.4, hl * 0.4, hl * 0.86]) G.lathe([[r * (0.88 + 0.1 * (1 - Math.abs(z) / hl)) + 1.5, z - 5], [r * (0.88 + 0.1 * (1 - Math.abs(z) / hl)) + 1.5, z + 5]], HD.iron, 20, [0, 0, 0], [1, 1], true);
    G.tube([[0, 0, hl], [0, 0, hl + 16]], 5, HD.brass, { S: 6 }); G.box(0, -6, hl + 16, 4, 10, 3, HD.brass);
    G.place(m, { z: r + 26, pitch: 90 });
  })];
}
// ---- mushrooms drying on a string hung from a beam (z = 0 its top): n caps threaded down a cord
export function mushString(n = 6, seed = 1) {
  seed = N(seed);
  return ['hdmush|' + [n, seed % 3].join('|'), shape((G) => {
    const L = 40 + n * 34, R = rng(seed * 5 + n); G.tube([[0, 0, 2], [0, 0, -L]], 0.9, HD.cream, { S: 4, M: 2 });
    for (let i = 0; i < n; i++) { const z = -40 - i * 34, a = R() * 6.28, m = G.n, c = pick([0x9a7a5a, 0x8a6a4a, 0xb09070], i + seed);
      G.lathe([[0, -14], [3, -14], [3, -4], [16, -6], [17, 0], [10, 6], [0, 8]], (k) => (k < 2 ? HD.cream : c), 8); G.place(m, { x: Math.cos(a) * 2, y: Math.sin(a) * 2, z, roll: (R() - 0.5) * 30 }); }
  })];
}

// ---- the cistern -----------------------------------------------------------------------------------------------------
// a column of the cistern: a square plinth, a roll, the round shaft narrowing a little, a cushion capital and its
// abacus at h (z = h its top: it runs 10 into the vault's springing)
export function cisternColumn(h = 1150, r = 70, seed = 1) {
  h = q(h, 10); r = q(r, 5); seed = N(seed);
  return ['hdccol|' + [h, r, seed % 4].join('|'), shape((G) => {
    G.box(0, 0, 18, r + 30, r + 30, 18, HD.stoneD); G.lathe([[r + 14, 36], [r + 20, 44], [r + 14, 54], [r + 2, 56]], HD.stoneL, 16);
    G.lathe([[r + 2, 56], [r, 120], [r * 0.95, h * 0.6], [r * 0.9, h - 130]], (k) => pick(HD.stone, k + seed), 16);
    G.lathe([[r * 0.9 + 6, h - 136], [r * 0.9 + 8, h - 128], [r * 0.9 + 6, h - 120], [r * 0.9, h - 118]], HD.stoneL, 16);
    loft(G, [-r * 0.9, r * 0.9, -r * 0.9, r * 0.9, h - 120], [-r - 40, r + 40, -r - 40, r + 40, h - 34], (i) => (i === -2 ? HD.stoneD : pick(HD.stone, i + 1)));
    G.box(0, 0, h - 12, r + 52, r + 52, 22, HD.stoneD);
  })];
}
// ---- the spout of the cistern on a wall (back on x = 0): a carved gnome's face, the water from its mouth falling
// into the half-round basin at its foot; the basin's water and the fall are the shape's own
export function spout() {
  return ['hdspout', shape((G) => {
    const T = HD.statue;
    G.blob(0, 0, 640, 70, 120, 120, T[0], { nu: 14, nv: 10, warp: (x, y, z) => [Math.max(0, x), y, z] });
    G.blob(66, 0, 640, 36, 30, 34, T[1], { nu: 10, nv: 8 }); for (const s of [-1, 1]) { G.blob(60, s * 40, 676, 8, 8, 8, HD.eye, { nu: 6, nv: 4 }); G.blob(54, s * 42, 692, 12, 28, 9, T[2], { nu: 8, nv: 5 }); }
    G.blob(0, 0, 520, 66, 104, 120, T[2], { nu: 14, nv: 10, warp: (x, y, z) => { const f = 0.3 + 0.7 * Math.max(0, Math.min(1, (z + 120) / 240)); return [Math.max(0, x) * (0.5 + 0.5 * f), y * f, z]; } });
    { const m = G.n; G.lathe([[118, 700], [128, 706], [128, 726], [118, 732], [0, 732]], HD.statueD, 16); G.map(m, ([x, y, z]) => [Math.max(0, x), y, z]); }
    { const m = G.n; G.tube([[0, 0, 0], [0, 0, 300]], (t) => 118 * (1 - t) + 3, T[1], { S: 14, M: 10 }); G.map(m, ([x, y, z]) => [Math.max(0, x), y, z]); G.place(m, { z: 728 }); }
    G.tube([[40, 0, 584], [104, 0, 580]], 10, HD.brass, { S: 8 });
    G.tube([[104, 0, 576], [128, 0, 540], [140, 0, 400], [146, 0, 150], [148, 0, 66]], (t) => 7 + t * 4, 0x6a98a6, { S: 8, M: 20 });
    const B = 170; G.surf((u, v) => { const a = -Math.PI / 2 + u * Math.PI; return [Math.cos(a) * B * (v < 0.5 ? 1 : 0.84), Math.sin(a) * B * (v < 0.5 ? 1 : 0.84), v < 0.5 ? (v < 0.25 ? 0 : 76) : 76 - (v - 0.5) * 32]; }, 0, 1, 16, 0, 1, 3, (u, v) => (v < 0.5 ? HD.stone[2] : HD.stoneL));
    G.surf((u, v) => { const a = -Math.PI / 2 + u * Math.PI, rr = B * 0.84 * (1 - v); return [Math.cos(a) * rr, Math.sin(a) * rr, 64]; }, 0, 1, 16, 0, 1, 1, HD.waterL);
    G.box(1, 0, 38, 1, B, 38, HD.stoneD);
  })];
}

// ---- the mint and the vault -----------------------------------------------------------------------------------------
// a screw press for striking coin: a stone block, two iron cheeks and their crosshead, the screw through it, the bar
// across its top weighted with iron balls, the platen over the die
export function coinPress() {
  return ['hdpress', shape((G) => {
    G.box(0, 0, 30, 90, 70, 30, (nx, ny, nz) => (nz > 0 ? HD.stoneL : HD.stone[1])); G.box(0, 0, 70, 26, 26, 10, HD.ironD);
    for (const s of [-1, 1]) G.box(0, s * 56, 230, 16, 12, 170, HD.iron); G.box(0, 0, 410, 22, 72, 20, HD.ironD);
    G.tube([[0, 0, 160], [0, 0, 480]], 11, HD.ironL, { S: 10 }); for (let z = 180; z < 380; z += 18) G.lathe([[11, z], [14, z + 5], [11, z + 10]], HD.iron, 10);
    G.box(0, 0, 150, 30, 40, 10, HD.iron); G.box(0, 0, 486, 18, 18, 10, HD.iron);
    G.tube([[0, -240, 486], [0, 240, 486]], 6, HD.iron, { S: 8 }); for (const s of [-1, 1]) G.blob(0, s * 252, 486, 26, 26, 26, HD.ironD, { nu: 10, nv: 8 });
    G.box(70, 50, 64, 18, 22, 4, HD.oakD); for (let i = 0; i < 9; i++) G.lathe([[0, 0], [6, 0], [6, 1.6], [0, 1.6]], HD.gold, 8, [62 + (i % 3) * 8, 42 + Math.floor(i / 3) * 8, 68]);
  })];
}
// ---- the counting table: an oak table (along Y), a balance on it, stacks of coin, the ledger open, a lamp
export function countTable(seed = 1) {
  seed = N(seed);
  return ['hdcount|' + (seed % 3), shape((G) => {
    const R = rng(seed * 3 + 7), top = 78;
    G.box(0, 0, top - 4, 50, 110, 4, HD.oak[seed % 3]); for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.box(sx * 42, sy * 100, (top - 8) / 2, 5, 5, (top - 8) / 2, HD.oakD);
    G.box(0, 0, 22, 42, 100, 3, HD.oakD);
    G.box(0, 50, top + 3, 16, 16, 3, HD.brassD); G.tube([[0, 50, top + 6], [0, 50, top + 86]], 2.5, HD.brass, { S: 6 }); G.tube([[0, 14, top + 86], [0, 86, top + 86]], 1.8, HD.brass, { S: 5 });
    for (const y of [14, 86]) { G.tube([[0, y, top + 86], [0, y, top + 30]], 0.6, HD.brassD, { S: 3 }); G.lathe([[0, 0], [14, 0], [18, 6], [0, 4]], HD.brass, 10, [0, y, top + 26]); }
    for (let i = 0; i < 7; i++) { const x = -42 + R() * 22, y = -98 + R() * 86, hh = 4 + Math.floor(R() * 6) * 3; G.lathe([[0, 0], [6.5, 0], [6.5, hh], [0, hh]], HD.gold, 8, [x, y, top]); }
    G.box(10, -40, top + 2, 22, 30, 2, HD.cream); G.box(10, -40, top + 1, 23, 31, 1, HD.redD); G.box(10, -40, top + 4.2, 0.8, 30, 0.6, HD.oakD);
  })];
}
// ---- the vault door: a slab of stone with a round hole filling a square cut w wide and h high through a wall t thick,
// and in the hole, set back, the great round door rolled shut: rings cut in it, the hold's cog in brass at its
// middle, iron bars across it into the frame. Front +X, the wall's middle on x = 0.
export const VDOOR = { R: 470, zc: 520 };
export function vaultDoor(w = 1100, h = 1100, t = 200) {
  w = q(w, 10); h = q(h, 10); t = q(t, 10);
  return ['hdvdoor|' + [w, h, t].join('|'), shape((G) => {
    const { R, zc } = VDOOR, hw = w / 2, xf = t / 2 + 20, NA = 40;
    // the frame: the face of the slab between the round hole and its square edge, front and back, and the hole's lining
    const angs = []; for (let i = 0; i < NA; i++) angs.push((i / NA) * Math.PI * 2); for (const [cy, cz] of [[hw, h - zc], [-hw, h - zc], [-hw, -zc], [hw, -zc]]) angs.push(Math.atan2(cz, cy)); angs.sort((a, b) => a - b);
    const edge = (a) => { const c = Math.cos(a), s = Math.sin(a), t1 = Math.abs(c) > 1e-6 ? hw / Math.abs(c) : Infinity, t2 = s > 1e-6 ? (h - zc) / s : s < -1e-6 ? zc / -s : Infinity, tt = Math.min(t1, t2); return [c * tt, zc + s * tt]; };
    const ring = (a) => [Math.cos(a) * R, zc + Math.sin(a) * R];
    for (const [x, sgn] of [[xf, 1], [-xf, -1]]) for (let i = 0; i < angs.length; i++) { const a0 = angs[i], a1 = angs[(i + 1) % angs.length], P = [ring(a0), ring(a1), edge(a1), edge(a0)], k = G.n, col = pick(HD.stone, Math.floor((((a0 + a1) / 2 + 0.2) / (Math.PI * 2)) * 11));
      for (const [y, z] of P) G.v(x, y, z, col); if (sgn > 0) G.idx.push(k, k + 2, k + 1, k, k + 3, k + 2); else G.idx.push(k, k + 1, k + 2, k, k + 2, k + 3); }
    for (let i = 0; i < NA; i++) { const a0 = (i / NA) * Math.PI * 2, a1 = ((i + 1) / NA) * Math.PI * 2, [y0, z0] = ring(a0), [y1, z1] = ring(a1), k = G.n; for (const [x, y, z] of [[xf, y0, z0], [xf, y1, z1], [-xf, y1, z1], [-xf, y0, z0]]) G.v(x, y, z, HD.stoneD); G.idx.push(k, k + 1, k + 2, k, k + 2, k + 3); }
    { const m = G.n; G.lathe([[R + 12, 0], [R + 30, 0], [R + 30, 14], [R + 12, 14], [R + 12, 0]], HD.stoneL, NA, [0, 0, 0], [1, 1], true); G.place(m, { x: xf, z: zc, pitch: 90 }); }
    // the door in the hole, set back: its rings, the cog, the bars
    const m = G.n; G.lathe([[0, -50], [R + 30, -50], [R + 30, 50], [R - 20, 50], [R - 20, 58], [R - 90, 58], [R - 90, 50], [R - 150, 50], [R - 150, 62], [R - 210, 62], [0, 62]], (k) => (k === 4 || k === 8 ? HD.stoneL : pick(HD.stone, k)), NA);
    G.lathe([[0, 62], [110, 62], [110, 74], [0, 74]], HD.brass, 24); for (let j = 0; j < 10; j++) { const a = (j / 10) * Math.PI * 2, b = G.n; G.box(0, 0, 0, 20, 18, 6, HD.brass); G.place(b, { x: Math.cos(a) * 124, y: Math.sin(a) * 124, z: 68, yaw: (a * 180) / Math.PI }); } G.lathe([[0, 74], [40, 74], [40, 90], [0, 90]], HD.brassL, 14);
    for (const yw of [0, 60, 120]) { const b = G.n; G.box(0, 0, 66, R + 10, 14, 6, HD.iron); G.place(b, { yaw: yw }); }
    // its back: the bars across it, the hub of the wheel that rolled it, the lugs
    for (const yw of [30, 90, 150]) { const b = G.n; G.box(0, 0, -56, R + 10, 16, 6, HD.ironD); G.place(b, { yaw: yw }); } G.lathe([[0, -50], [90, -50], [90, -66], [70, -76], [0, -76]], HD.iron, 16); G.lathe([[0, -76], [24, -76], [24, -96], [0, -96]], HD.ironL, 10);
    G.place(m, { z: zc, pitch: 90 });
  })];
}
// ---- a heap of gold left in the vault: coin heaped, a cup or two in it, coins spilled about its foot
export function goldHeap(r = 160, seed = 1) {
  r = q(r, 10); seed = N(seed);
  return ['hdgold|' + [r, seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 41 + r);
    G.blob(0, 0, 0, r, r * 0.86, r * 0.42, (nx, ny, nz) => (Math.sin(nx * 23 + ny * 17) > 0.5 ? HD.goldL : Math.sin(nx * 11 - ny * 29) > 0.3 ? HD.goldD : HD.gold), { nu: 16, nv: 8, warp: (x, y, z) => [x, y, Math.max(-2, z)] });
    for (let i = 0; i < 2; i++) { const a = R() * 6.28, m = G.n; G.lathe([[0, 0], [12, 0], [6, 4], [5, 26], [18, 34], [20, 48], [0, 44]], HD.goldL, 10); G.place(m, { x: Math.cos(a) * r * 0.4, y: Math.sin(a) * r * 0.4, z: r * 0.3, roll: (R() - 0.5) * 40 }); }
    for (let i = 0; i < 26; i++) { const a = R() * 6.28, d = r * (1.02 + R() * 0.6); G.lathe([[0, 0], [6, 0], [6, 1.6], [0, 1.6]], R() < 0.3 ? HD.goldL : HD.gold, 8, [Math.cos(a) * d, Math.sin(a) * d * 0.86, 0]); }
  })];
}

// ---- the delving and the rest ---------------------------------------------------------------------------------------
// a timber prop under the roof of the delving: a post from the floor to h with a head block, a sole plate at its foot
export function timberProp(h = 1500, seed = 1) {
  h = q(h, 10); seed = N(seed);
  return ['hdprop|' + [h, seed % 3].join('|'), shape((G) => {
    G.box(0, 0, 6, 34, 34, 6, HD.oakD); G.box(0, 0, h / 2, 15, 15, h / 2 - 6, pick(HD.oak, seed)); G.box(0, 0, h - 14, 60, 20, 14, HD.oakD); for (const s of [-1, 1]) G.box(s * 30, 0, h - 34, 6, 18, 8, HD.oak[2]);
  })];
}
// ---- the hold's sign in the floor: a ring of brass cogged round, six spokes, the hub, on a field of dark stone
export function cogInlay(r = 700) {
  r = q(r, 10);
  return ['hdinlay|' + r, shape((G) => {
    G.lathe([[0, 0], [r + 40, 0], [r + 40, 2], [0, 2]], HD.stoneD, 48);
    G.lathe([[r - 50, 2], [r, 2], [r, 3.4], [r - 50, 3.4], [r - 50, 2]], HD.brass, 48, [0, 0, 0], [1, 1], true);
    for (let j = 0; j < 16; j++) { const a = (j / 16) * Math.PI * 2, b = G.n; G.box(0, 0, 2.7, 22, 26, 0.7, HD.brass); G.place(b, { x: Math.cos(a) * (r + 18), y: Math.sin(a) * (r + 18), yaw: (a * 180) / Math.PI }); }
    for (let j = 0; j < 6; j++) { const a = (j / 6) * Math.PI * 2, b = G.n; G.box(0, 0, 2.7, (r - 160) / 2, 14, 0.7, HD.brassD); G.place(b, { x: Math.cos(a) * ((r - 160) / 2 + 110), y: Math.sin(a) * ((r - 160) / 2 + 110), yaw: (a * 180) / Math.PI }); }
    G.lathe([[0, 2], [110, 2], [110, 3.6], [0, 3.6]], HD.brass, 24); G.lathe([[70, 3.6], [96, 3.6], [96, 4.4], [70, 4.4], [70, 3.6]], HD.brassL, 24, [0, 0, 0], [1, 1], true);
  })];
}
// ---- fallen stone of the hold: a low heap and blocks tumbled off it
export function holdRubble(r = 160, seed = 1) {
  seed = N(seed); r = q(r, 20);
  return ['hdrubble|' + [r, seed % 5].join('|'), shapeF((G) => {
    const R = rng(seed * 29 + r), S = HD.stone;
    G.blob(0, 0, -4, r * 0.78, r * 0.68, r * 0.24, (nx, ny, nz) => (nz > 0.3 ? S[1] : HD.stoneD), { nu: 10, nv: 5 });
    for (let i = 0; i < 13; i++) { const a = R() * Math.PI * 2, d = r * Math.sqrt(R()) * 0.66, sz = 13 + R() * 16, ex = Math.cos(a) * d / (r * 0.78), ey = Math.sin(a) * d / (r * 0.68), zs = r * 0.24 * Math.sqrt(Math.max(0, 1 - ex * ex - ey * ey)) - 4, b = G.n;
      G.box(0, 0, 0, sz * 1.5, sz, sz * 0.7, S[i % 4]); G.place(b, { x: Math.cos(a) * d, y: Math.sin(a) * d, z: Math.max(sz * 0.4, zs + sz * 0.15), yaw: R() * 180, pitch: (R() - 0.5) * 24, roll: (R() - 0.5) * 24 }); }
  })];
}
export const holdRubbleH = (r) => q(r, 20) * 0.32;
// ---- a heap of coal, a shovel stood in it
export function coalHeap(r = 180, seed = 1) {
  r = q(r, 10); seed = N(seed);
  return ['hdcoal|' + [r, seed % 3].join('|'), shapeF((G) => {
    const R = rng(seed * 19 + r);
    G.blob(0, 0, 0, r, r * 0.8, r * 0.5, (nx, ny, nz) => (Math.sin(nx * 31 + ny * 17 + seed) > 0.6 ? 0x3a3430 : HD.coal), { nu: 14, nv: 7, warp: (x, y, z) => [x * (1 + 0.08 * Math.sin(y * 0.05 + seed)), y, Math.max(-2, z * (1 + 0.1 * Math.sin(x * 0.04)))] });
    for (let i = 0; i < 9; i++) { const a = R() * 6.28, d = r * (0.95 + R() * 0.25), b = G.n; G.blob(0, 0, 0, 8 + R() * 6, 7 + R() * 5, 6, HD.coal, { nu: 5, nv: 4 }); G.place(b, { x: Math.cos(a) * d, y: Math.sin(a) * d * 0.8, z: 4 }); }
    G.tube([[r * 0.2, 0, r * 0.3], [r * 0.32, 10, r * 0.5 + 90]], 3, HD.oakL, { S: 5 }); { const b = G.n; G.box(0, 0, 0, 16, 14, 2, HD.iron); G.place(b, { x: r * 0.18, y: -2, z: r * 0.24, pitch: -60 }); }
  })];
}
