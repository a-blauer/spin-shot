// Sculpted pieces for Lantern Lake, in the Wildwood: paper lanterns (their paper drawn as a glowing shape of its own,
// the frame, caps and cords as the plain one), strings of them between festival poles, the shore's lantern posts, the
// round pavilion on the island, the boardwalk and the jetty, the boathouse, lantern boats, the festival's tables, the
// lantern-makers' drying rack, the weeping willow. Same rules as dest_props.js: UE frame (X the front, Y right, Z up),
// [key, build] pairs, keys carry every number the shape depends on, things stand on z = 0, every piece whole. A prop
// with a glowing part returns { main, glow }: draw both at the same place.
import * as THREE from 'three';
import { shapeB as shape } from './propkit.js';
import { dark, mix } from './village_shapes.js';
import { q, rng } from './dest_props.js';

export const LK = {
  paper: [0xe0503a, 0xf09a3a, 0xf6d04a, 0xe86a8a, 0xf4ead6], laq: 0x2e2220, cord: 0x6a4a2a, tassel: 0xc8392e,
  wood: 0x7a5636, woodD: 0x4e3622, woodL: 0x9a7448, plank: [0x8a6440, 0x7e5a38, 0x946c46], shingle: [0x5a4a3e, 0x4e4036, 0x665446],
  willow: [0x8aae58, 0x7a9e48, 0x96b864], bark: 0x5a5048, stone: [0x8a8a80, 0x7e7e74, 0x969688],
  canvas: [0xe8dcc0, 0xd8b878, 0xc89a8a, 0xa8b890], straw: 0xd8b860, strawD: 0xb8983e, rope: 0x9a8058,
  flags: [0xc8392e, 0xf0b43a, 0x3a7ab8, 0xf4ead6, 0x5a9a4a],
};
const N = (s) => Math.abs(Math.round(s)) || 0;
const deg = (r) => (r * 180) / Math.PI;
const pick = (a, i) => a[((i % a.length) + a.length) % a.length];

// ---- one paper lantern hung from (x, y, z), r round: into G its frame (a hook, lacquered caps top and bottom, four
// ribs and two hoops over the paper, a tassel), into P its paper (which glows). Hanging below z by 1.3 r and the cap.
const hang = (G, P, x, y, z, r, col) => {
  const h = r * 1.3, top = z - 8, bot = top - h, prof = [[r * 0.36, bot], [r * 0.82, bot + h * 0.12], [r, bot + h * 0.35], [r, bot + h * 0.65], [r * 0.82, bot + h * 0.88], [r * 0.36, top]];
  if (P) P.lathe(prof, col, 12, [x, y, 0]);
  if (!G) return;
  G.tube([[x, y, z + 1.5], [x, y, top + 4]], 0.9, LK.cord, { S: 4, M: 2, caps: false });
  G.lathe([[r * 0.44, top - 2], [r * 0.44, top + 3], [r * 0.2, top + 6], [0, top + 7]], LK.laq, 10, [x, y, 0]);
  G.lathe([[0, bot - 6], [r * 0.42, bot - 3], [r * 0.42, bot + 2]], LK.laq, 10, [x, y, 0]);
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4, c = Math.cos(a), s = Math.sin(a); G.tube(prof.map(([pr, pz]) => [x + c * (pr + 0.7), y + s * (pr + 0.7), pz]), 0.9, LK.laq, { S: 4, M: 10, caps: false }); }
  for (const f of [0.35, 0.65]) { const zz = bot + h * f; G.lathe([[r + 0.8, zz - 1.2], [r + 0.8, zz + 1.2], [r - 0.5, zz + 1.2], [r - 0.5, zz - 1.2], [r + 0.8, zz - 1.2]], LK.laq, 12, [x, y, 0], [1, 1], true); }
  G.tube([[x, y, bot - 5], [x, y, bot - r * 0.9]], (t) => 1.4 + t * 2.6, LK.tassel, { S: 5, M: 3 });
};
const pair = (key, draw) => ({ main: [key, shape((G) => draw(G, null))], glow: [key + '|glow', shape((P) => draw(null, P))] });

// ---- a string of lanterns: a rope along X from (-L/2, 0, -dz/2) to (L/2, 0, dz/2) sagging sag below the straight line
// at its middle, n lanterns hung along it (its ends are tied into the tops of two poles stood there)
export function lanternString(L = 800, sag = 90, n = 6, seed = 1, dz = 0) {
  L = q(L, 20); sag = q(sag, 10); seed = N(seed); dz = q(dz, 10);
  const zAt = (u) => (dz * u) / L - sag * (1 - (2 * u / L) ** 2);
  return pair('lkstring|' + [L, sag, n, seed % 5, dz].join('|'), (G, P) => {
    if (G) { const pts = []; for (let i = 0; i <= 16; i++) { const u = -L / 2 + (L * i) / 16; pts.push([u, 0, zAt(u)]); } G.tube(pts, 1.6, LK.cord, { S: 5, M: 40, caps: false }); }
    for (let i = 0; i < n; i++) { const u = -L / 2 + (L * (i + 0.5)) / n, r = 15 + ((i + seed) % 3) * 3; hang(G, P, u, 0, zAt(u) - 1, r, pick(LK.paper, i + seed)); }
  });
}
// ---- a festival pole: a tall painted pole, a gilt ball at its top and a pennant streaming from it
export function festivalPole(h = 520, seed = 1) {
  h = q(h, 20); seed = N(seed);
  return ['lkpole|' + [h, seed % 4].join('|'), shape((G) => {
    G.lathe([[11, 0], [10, 20], [8, h]], (k) => (k ? pick(LK.paper, seed) : LK.woodD), 10); G.lathe([[16, -6], [16, 6]], LK.woodD, 10, [0, 0, 22]);
    G.blob(0, 0, h + 8, 10, 10, 10, 0xd8b04a, { nu: 8, nv: 6 });
    G.tube([[0, 0, h - 14], [40, 8, h - 22], [90, 20, h - 36]], (t) => 14 * (1 - t) + 0.6, pick(LK.paper, seed + 2), { S: 6, M: 8, flat: () => [1, 0.12] });
  })];
}
// ---- a lantern post on the shore path: a squared post, an arm out over the path, a lantern hung from its end
export function lakePost(h = 300, seed = 1) {
  h = q(h, 10); seed = N(seed);
  return pair('lkpost|' + [h, seed % 5].join('|'), (G, P) => postDraw(G, P, h, seed));
}
const postDraw = (G, P, h, seed) => {
  if (G) { G.box(0, 0, h / 2, 7, 7, h / 2, LK.woodD); G.box(0, 0, 6, 14, 14, 6, LK.stone[1]); G.box(34, 0, h - 8, 40, 4, 4, LK.woodD); G.tube([[0, 0, h - 60], [36, 0, h - 10]], 2.4, LK.woodD, { S: 5 }); G.lathe([[8, h], [0, h + 12]], LK.woodD, 4); }
  hang(G, P, 64, 0, h - 12, 20, pick(LK.paper, seed));
};
// ---- the same post where the Blight came: its lantern burnt out, only the frame left on its cord
export function deadPost(h = 300, seed = 1) {
  h = q(h, 10); seed = N(seed);
  return ['lkpostdead|' + [h, seed % 5].join('|'), shape((G) => postDraw(G, null, h, seed))];
}
// ---- lanterns for a market stall (dest_props_town's marketStall, its front +X): a rod lashed between its two front posts
// under the canopy, the lanterns hung from it over the counter
export function stallLanterns(w = 300, n = 4, seed = 1) {
  w = q(w, 20); seed = N(seed);
  return pair('lkstall|' + [w, n, seed % 5].join('|'), (G, P) => {
    if (G) G.tube([[56, -w / 2, 212], [56, w / 2, 212]], 2.2, LK.woodD, { S: 5, M: 4 });
    for (let i = 0; i < n; i++) { const y = -w / 2 + 40 + ((w - 80) * i) / Math.max(1, n - 1); hang(G, P, 56, y, 211, 15 + ((i + seed) % 2) * 3, pick(LK.paper, i + seed)); } });
}
// ---- the island's pavilion, where the gnomes hang the great lantern: an eight-sided floor a step up, eight posts at its
// corners, a ring beam on them, a roof of shingles in eight faces sweeping up to a finial (hip rafters under it), the
// great lantern on its chain from the top and a small one under each corner of the eaves
export const PAV = { r: 300, floor: 14, e: 320, top: 610 };
export function pavilion(seed = 1) {
  seed = N(seed);
  return pair('lkpav2|' + (seed % 3), (G, P) => {
    const { r, floor: fz, e, top } = PAV, A8 = (i) => (i / 8) * Math.PI * 2;
    // the roof's line: out at the eave, over the ring beam's top edge, up to the finial
    const roof = [[r + 104, e + 4], [r + 14, e + 20], [r - 90, e + 84], [r * 0.32, top - 96], [0, top]];
    if (G) {
      G.lathe([[r + 70, 0], [r + 70, 7], [r + 40, 7], [r + 40, fz], [0, fz]], (k) => (k < 2 ? LK.stone[0] : LK.plank[1]), 8, [0, 0, 0], [1, 1], false);
      for (let i = 0; i < 8; i++) { const a = A8(i), x = Math.cos(a) * r, y = Math.sin(a) * r; G.lathe([[11, fz - 1], [10, e + 2]], LK.wood, 8, [x, y, 0]); G.box(x, y, fz + 4, 16, 16, 4, LK.stone[2]); }
      G.lathe([[r + 14, e], [r + 14, e + 20], [r - 14, e + 20], [r - 14, e], [r + 14, e]], LK.woodD, 8, [0, 0, 0], [1, 1], true);
      G.lathe(roof, (k) => pick(LK.shingle, k + seed), 8, [0, 0, 0], [1, 1], false);
      G.lathe([[r + 104, e - 4], [r + 104, e + 4]], LK.woodD, 8, [0, 0, 0], [1, 1], true);
      for (let i = 0; i < 8; i++) { const a = A8(i), c = Math.cos(a), sn = Math.sin(a); G.tube(roof.slice(1).map(([pr, pz]) => [c * pr, sn * pr, pz - 6]), 5, LK.woodD, { S: 5, M: 12 }); }
      G.lathe([[10, top - 4], [12, top + 30], [0, top + 70]], 0xd8b04a, 8);
      G.tube([[0, 0, top - 8], [0, 0, e + 20]], 1.8, 0x3a3a40, { S: 5, M: 6 });
    }
    hang(G, P, 0, 0, e + 20, 70, LK.paper[0]);
    for (let i = 0; i < 8; i++) { const a = A8(i); hang(G, P, Math.cos(a) * (r + 96), Math.sin(a) * (r + 96), e + 5, 16, pick(LK.paper, i + 1)); }
  });
}
// ---- a boardwalk on the water: planks across two bearers on posts, its deck a hand above the water; L along X
export function walkway(L = 1200, W = 200) {
  L = q(L, 20); W = q(W, 10);
  return ['lkwalk|' + [L, W].join('|'), shape((G) => {
    const hl = L / 2, hw = W / 2;
    for (const sy of [-1, 1]) G.box(0, sy * (hw - 16), 6, hl, 6, 4, LK.woodD);
    for (let x = -hl, i = 0; x < hl - 1; x += 26, i++) { const e = Math.min(hl, x + 26); G.box((x + e) / 2, 0, 11, (e - x) / 2 - 1.2, hw, 2, pick(LK.plank, i)); }
    for (let x = -hl + 40; x <= hl - 39; x += 200) for (const sy of [-1, 1]) G.box(x, sy * (hw - 16), 0, 7, 7, 6, LK.woodD);
  })];
}
// ---- the jetty at the boathouse: a broader deck of planks on posts, mooring posts standing up at its far corners
export function lakeJetty(L = 600, W = 260) {
  L = q(L, 20); W = q(W, 10);
  return ['lkjetty|' + [L, W].join('|'), shape((G) => {
    const hl = L / 2, hw = W / 2;
    for (const sy of [-1, 0, 1]) G.box(0, sy * (hw - 18), 6, hl, 7, 4, LK.woodD);
    for (let x = -hl, i = 0; x < hl - 1; x += 26, i++) { const e = Math.min(hl, x + 26); G.box((x + e) / 2, 0, 11, (e - x) / 2 - 1.2, hw, 2, pick(LK.plank, i + 1)); }
    for (const sy of [-1, 1]) { G.lathe([[9, 0], [9, 80], [7, 86]], LK.woodD, 8, [hl - 16, sy * (hw - 16), 0]); G.lathe([[10.5, 60], [10.5, 66]], 0x8a7a5a, 8, [hl - 16, sy * (hw - 16), 0]); }
  })];
}
// ---- the boathouse: a shed of upright boards on a stone footing, open at its +X end over the water, a roof of
// shingles; a boat drawn in under it
export const BH = { w: 700, d: 420, e: 260, r: 440 };
export function boathouse(seed = 1) {
  seed = N(seed);
  return ['lkboathouse2|' + (seed % 2), shape((G) => {
    const { w, d, e, r } = BH, hw = w / 2, hd = d / 2;
    for (const sy of [-1, 1]) { G.box(0, sy * (hd - 10), 12, hw, 10, 12, LK.stone[0]); for (let x = -hw, i = 0; x < hw - 1; x += 22, i++) G.box(x + 11, sy * (hd - 6), 24 + (e - 24) / 2, 10.4, 3, (e - 24) / 2, pick(LK.plank, i + (sy > 0 ? 1 : 0))); }
    G.box(-hw + 10, 0, 12, 10, hd, 12, LK.stone[1]); for (let y = -hd, i = 0; y < hd - 1; y += 22, i++) G.box(-hw + 6, y + 11, 24 + (e - 24) / 2, 3, 10.4, (e - 24) / 2, pick(LK.plank, i + 2));
    for (let z = e, i = 0; z < r - 4; z += 22, i++) { const half = hd - 3 - ((z + 22 - e) * (hd - 3)) / (r - e); if (half < 6) break; G.box(-hw + 6, 0, z + 11, 3, half, 11.5, pick(LK.plank, i)); }
    G.box(hw - 8, 0, e - 6, 8, hd + 4, 8, LK.woodD); for (const sy of [-1, 1]) G.box(hw - 8, sy * (hd - 8), e / 2, 8, 8, e / 2, LK.woodD);
    // the roof: its boards' undersides on the line from the walls' top outer edges up to the ridge, out over the eaves
    const wo = hd - 3, sl = (r - e) / wo, ang = Math.atan(sl), run = hd + 40, rows = 7;
    for (const sd of [-1, 1]) for (let i = 0; i < rows; i++) { const t = (i + 0.5) / rows, yy = run * (1 - t), b = G.n; G.box(0, 0, 0, hw + 30, run / rows / Math.cos(ang) / 2 + 1.5, 5, pick(LK.shingle, i + (sd > 0 ? 1 : 0))); G.place(b, { y: sd * yy, z: e + sl * (wo - yy) + 5 / Math.cos(ang), roll: -sd * deg(ang) }); }
    G.box(0, 0, r + 8, hw + 34, 12, 8, LK.woodD);
  })];
}
// ---- a lantern boat set floating on the lake: a little hull of bark, a stick mast, its lantern a box of paper
export function lanternBoat(seed = 1) {
  seed = N(seed);
  return pair('lkboat2|' + (seed % 5), (G, P) => {
    if (G) { G.blob(0, 0, 4, 34, 15, 7, LK.woodL, { nu: 10, nv: 5, warp: (x, y, z) => [x, y * (1 - Math.abs(x) / 50), z] }); for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.box(sx * 6, sy * 6, 20, 1.2, 1.2, 10, LK.woodD); G.box(0, 0, 31, 7.5, 7.5, 1.2, LK.woodD); }
    if (P) P.box(0, 0, 20, 5.6, 5.6, 9.5, pick(LK.paper, seed));
  });
}
// ---- a trestle table and its two benches: laid for the festival's supper (goods 0: bowls, jugs, loaves, cups), or the
// lantern-makers' bench (goods 1: stacks of paper, bare frames, a pot of paste and its brush, a coil of cord)
export function trestle(seed = 1, goods = 0) {
  seed = N(seed);
  return ['lktable|' + [seed % 2, goods].join('|'), shape((G) => {
    const R = rng(seed * 29 + goods), T = 79;
    G.box(0, 0, 76, 150, 40, 3, LK.plank[seed % 3]); for (const sx of [-1, 1]) { G.box(sx * 120, 0, 37, 4, 34, 37, LK.woodD); G.box(sx * 120, 0, 10, 6, 38, 4, LK.woodD); }
    for (const sy of [-1, 1]) { G.box(0, sy * 80, 44, 150, 12, 2.5, LK.plank[(seed + 1) % 3]); for (const sx of [-1, 1]) G.box(sx * 120, sy * 80, 21, 4, 9, 21, LK.woodD); }
    if (goods === 0) {
      for (const x of [-100, -30, 50, 115]) G.lathe([[0, T], [12, T], [15, T + 2], [14, T + 3.5], [0, T + 3.5]], 0xd8ccb0, 10, [x, (x % 3) * 6 - 14, 0]);
      for (const [x, y] of [[-70, 18], [10, -16], [85, 20]]) G.lathe([[0, T], [9, T], [13, T + 8], [11, T + 12], [0, T + 12]], 0x8a5a3a, 10, [x, y, 0]);
      for (const [x, y] of [[-125, 14], [40, 22]]) G.lathe([[0, T], [10, T], [12, T + 14], [9, T + 24], [10, T + 28], [9, T + 30], [0, T + 30]], (k) => (k < 3 ? 0x7a6a5a : 0x5a4e44), 10, [x, y, 0]);
      for (const [x, y] of [[-20, 20], [130, -18]]) G.blob(x, y, T + 9, 22, 13, 9, 0xb07a3a, { nu: 10, nv: 6 });
      for (const [x, y] of [[-95, -18], [-45, 22], [70, -22], [100, 4]]) G.lathe([[0, T], [5, T], [5.5, T + 11], [0, T + 11]], 0x6a5040, 8, [x, y, 0]);
    } else {
      for (const [x, y, n] of [[-110, -12, 4], [-60, 14, 6], [95, -14, 3]]) for (let k = 0; k < n; k++) G.box(x + (R() - 0.5) * 4, y + (R() - 0.5) * 4, T + 1 + k * 1.6, 24, 18, 0.8, pick(LK.paper, k + n));
      for (const [x, y] of [[0, -10], [45, 16]]) for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + 0.4, r = 16; G.tube([[x + Math.cos(a) * 6, y + Math.sin(a) * 6, T], [x + Math.cos(a) * r, y + Math.sin(a) * r, T + 11], [x + Math.cos(a) * 6, y + Math.sin(a) * 6, T + 22]], 0.9, LK.laq, { S: 4, M: 8 }); }
      for (const [x, y] of [[0, -10], [45, 16]]) { G.lathe([[0, T], [7, T], [7, T + 2], [0, T + 2]], LK.laq, 8, [x, y, 0]); G.lathe([[0, T + 21], [7, T + 21], [7, T + 23], [0, T + 23]], LK.laq, 8, [x, y, 0]); }
      G.lathe([[0, T], [9, T], [10, T + 10], [8, T + 12], [0, T + 12]], 0x9a8a70, 10, [128, 14, 0]); G.tube([[124, 14, T + 6], [136, 16, T + 30]], 1.2, LK.woodD, { S: 4 });
      G.lathe([[7, T], [12, T], [12, T + 3], [7, T + 3], [7, T]], LK.cord, 10, [-130, 22, 0], [1, 1], true);
    }
  })];
}
// ---- the lantern-makers' drying rack: an A-frame of poles, rods across it, lanterns hung to dry (paper on some, the
// bare frames of others)
export function dryingRack(seed = 1) {
  seed = N(seed);
  return ['lkrack|' + (seed % 3), shape((G) => {
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.tube([[sx * 180, sy * 50, 0], [sx * 180, 0, 210]], 4, LK.woodD, { S: 5 });
    G.tube([[-190, 0, 206], [190, 0, 206]], 3.5, LK.wood, { S: 5 });
    for (let i = 0; i < 6; i++) { const x = -150 + i * 60, bare = (i + seed) % 3 === 0; if (bare) { const r = 18, h = r * 1.3, top = 196, bot = top - h; G.tube([[x, 0, 205], [x, 0, top]], 0.9, LK.cord, { S: 4, M: 2, caps: false }); for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + 0.4; G.tube([[x + Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36, top], [x + Math.cos(a) * r, Math.sin(a) * r, bot + h * 0.5], [x + Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36, bot]], 0.8, LK.laq, { S: 4, M: 8 }); } G.lathe([[r * 0.4, bot - 2], [r * 0.4, bot + 1]], LK.laq, 8, [x, 0, 0]); G.lathe([[r * 0.4, top - 1], [r * 0.4, top + 2]], LK.laq, 8, [x, 0, 0]); }
      else hang(G, G, x, 0, 205, 18, pick(LK.paper, i + seed)); }
  })];
}
// ---- the old weeping willow on the west shore: a squat trunk, limbs arching out, masses of leaf along them and curtains
// of long leafy strands hanging from them to well above your head
export function weepingWillow(h = 900, seed = 1) {
  h = q(h, 50); seed = N(seed);
  return ['lkwillow7|' + [h, seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 61 + h), tr = h * 0.06;
    G.tube([[0, 0, -20], [10, 0, h * 0.2], [0, 6, h * 0.38]], (t) => tr * (1.4 - 0.5 * t), LK.bark, { S: 10, M: 8 });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + R() * 0.5, ca = Math.cos(a), sa = Math.sin(a), L = h * (0.4 + R() * 0.12), p0 = [0, 6, h * 0.36];
      const p1 = [ca * L * 0.35, sa * L * 0.35, h * (0.62 + R() * 0.1)], p2 = [ca * L * 0.8, sa * L * 0.8, h * (0.82 + R() * 0.08)], p3 = [ca * L, sa * L, h * (0.74 + R() * 0.06)];
      G.tube([p0, p1, p2, p3], (t) => tr * 0.5 * (1 - t * 0.7) + 1, LK.bark, { S: 7, M: 10 });
      const limb = new THREE.CatmullRomCurve3([p0, p1, p2, p3].map((v) => new THREE.Vector3(v[0], v[1], v[2])), false, 'centripetal');
      for (const t of [0.5, 0.74, 0.97]) { const P0 = limb.getPointAt(t), rr = h * (0.1 + R() * 0.03), ph = R() * 6; G.blob(P0.x, P0.y, P0.z + rr * 0.2, rr * 1.05, rr * 1.05, rr * 0.66, pick(LK.willow, i + Math.round(t * 4)), { nu: 10, nv: 7, warp: (x, y, z, nx, ny) => { const k = 1 + 0.14 * Math.sin(Math.atan2(ny, nx) * 3 + ph); return [x * k, y * k, z * (0.9 + 0.2 * k)]; } }); }
      for (let k = 0; k < 24; k++) { const t = 0.32 + (k / 24) * 0.66, P0 = limb.getPointAt(t), s0 = [P0.x + (R() - 0.5) * 36, P0.y + (R() - 0.5) * 36, P0.z - 2], drop = Math.max(220, s0[2] - h * (0.48 + R() * 0.24)), out = 12 + R() * 34, c0 = pick(LK.willow, k + i);
        // each strand a leafy ribbon, built hanging from the origin and turned about its own line so no two face alike
        const ex = ca * out + (R() - 0.5) * 24, ey = sa * out + (R() - 0.5) * 24, ez = drop - s0[2], b0 = G.n;
        G.tube([[0, 0, 0], [ex / 2 + ca * out * 0.4, ey / 2 + sa * out * 0.4, ez / 2], [ex, ey, ez]], (u) => 5.5 - u * 2, (u) => mix(dark(c0, 0.82), 0x8ab45a, u * 0.25), { S: 4, M: 8, flat: () => [1, 0.3] });
        const tw = R() * 180; G.map(b0, ([x, y, z]) => { const c2 = Math.cos((tw * Math.PI) / 180), s2 = Math.sin((tw * Math.PI) / 180), f = Math.min(1, -z / 40); return [x * (1 - f) + (x * c2 - y * s2) * f + s0[0], y * (1 - f) + (x * s2 + y * c2) * f + s0[1], z + s0[2]]; }); }
    }
    G.blob(0, 0, h * 0.8, h * 0.17, h * 0.17, h * 0.12, LK.willow[0], { nu: 10, nv: 7 });
  })];
}
export const willowTrunk = (h) => q(h, 50) * 0.06 * 1.4;

// ---- a canvas ridge tent, its length along X and its door at +X: the canvas from the ridge down to its pegged hem in
// panels, the back closed, the door laced shut with one corner turned back, the two poles through its ends, guy lines
// from their tops to pegs out beyond the ends
export const TENT = { L: 340, W: 300, h: 230, guy: 110 };
export function tent(seed = 1) {
  seed = N(seed);
  return ['lktent2|' + (seed % 4), shape((G) => {
    const { L, W, h, guy } = TENT, hl = L / 2, hw = W / 2, c = pick(LK.canvas, seed), cd = dark(c, 0.9), sag = 9;
    const at = (u, sy, v) => [-hl + L * u, sy * hw * v, h * (1 - v) - sag * Math.sin(v * Math.PI) * (0.45 + 0.55 * Math.sin(u * Math.PI))];
    for (const sy of [-1, 1]) for (let i = 0; i < 8; i++) G.surf((u, v) => at(u, sy, v), i / 8, (i + 1) / 8, 1, 0, 1, 5, i % 2 ? cd : c);
    // the ends: the back whole, the front the door, its two leaves meeting down the middle
    G.surf((t, v) => { const [x0, y0, z0] = at(0, -1, v), [, y1] = at(0, 1, v); return [x0 + 0.5, y0 + (y1 - y0) * t, z0]; }, 0, 1, 4, 0, 1, 5, cd);
    G.surf((t, v) => { const [x0, y0, z0] = at(1, -1, v), [, y1] = at(1, 1, v); return [x0 - 0.5, y0 + (y1 - y0) * t, z0]; }, 0, 1, 4, 0, 1, 5, c);
    G.box(hl - 0.2, 0, (h - 8) / 2 + 2, 0.9, 2.2, (h - 8) / 2, dark(c, 0.6)); for (let k = 0; k < 4; k++) G.box(hl + 1, 0, 40 + k * 42, 1.5, 4, 1.5, LK.woodD);
    // the corner turned back at the door's foot, the dark of the tent behind it
    { const k = G.v(hl + 0.8, 2, 0.5, 0x2a241e), k2 = G.v(hl + 0.8, 2, 66, 0x2a241e), k3 = G.v(hl + 0.8, 58, 0.5, 0x2a241e); G.idx.push(k, k2, k3);
      const f = G.v(hl + 1, 2, 66, cd), f2 = G.v(hl + 1, 58, 0.5, cd), f3 = G.v(hl + 26, 44, 20, dark(c, 0.8)); G.idx.push(f, f2, f3); }
    // the poles through the ends, a spike above the ridge; guy lines to the pegs; pegs along the hems
    for (const sx of [-1, 1]) { G.lathe([[3.5, -6], [3.5, h + 18], [1.5, h + 24]], LK.woodD, 6, [sx * (hl + 1), 0, 0]);
      G.tube([[sx * (hl + 1), 0, h + 12], [sx * (hl + guy), 0, 2]], 0.9, LK.rope, { S: 4, M: 6 }); G.box(sx * (hl + guy), 0, 4, 2.5, 2.5, 8, LK.woodL); }
    for (const sy of [-1, 1]) for (let x = -hl + 30; x <= hl - 29; x += 70) { G.box(x, sy * (hw + 5), 3, 2, 2, 6, LK.woodL); G.tube([[x, sy * hw, 1.5], [x, sy * (hw + 5), 6]], 0.8, LK.rope, { S: 4, M: 2 }); }
  })];
}
// ---- the festival's beacon on the field, built and never lit: split logs leaning in round a pole to its top, a ring
// of stones round its foot, kindling stacked against it
export const BONF = { r: 190, h: 440 };
export function bonfire(seed = 1) {
  seed = N(seed);
  return ['lkbonfire|' + (seed % 2), shape((G) => {
    const R = rng(seed * 13 + 7), { r, h } = BONF;
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2 + R() * 0.12; G.blob(Math.cos(a) * (r + 44), Math.sin(a) * (r + 44), 8, 22 + R() * 8, 17 + R() * 5, 15, pick(LK.stone, i), { nu: 7, nv: 5 }); }
    G.lathe([[9, -10], [7, h + 50], [0, h + 56]], LK.woodD, 7);
    for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2 + R() * 0.15, r0 = r - R() * 24, top = h - 20 - R() * 70, lr = 7 + R() * 3; G.tube([[Math.cos(a) * r0, Math.sin(a) * r0, -4], [Math.cos(a) * (lr + 4), Math.sin(a) * (lr + 4), top]], lr, i % 3 ? LK.woodL : LK.wood, { S: 5, M: 6 }); }
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2 + 0.2 + R() * 0.2, r0 = r + 14 + R() * 10; G.tube([[Math.cos(a) * r0, Math.sin(a) * r0, -2], [Math.cos(a) * (r0 - 60), Math.sin(a) * (r0 - 60), 70 + R() * 40]], 3.5 + R() * 2, 0x8a7a58, { S: 4, M: 3 }); }
  })];
}
// ---- the festival's arch over the road in: two posts on stone feet, knee braces, a beam and its cap, a board hung under
// it on two chains (the map writes LANTERN LAKE on it), a lantern hung from each end of the beam; the beam along Y
export const ARCH = { w: 520, h: 430, board: 300 };
export function lakeArch(seed = 1) {
  seed = N(seed);
  return pair('lkarch|' + (seed % 2), (G, P) => {
    const { w, h, board } = ARCH, hw = w / 2;
    if (G) {
      for (const sy of [-1, 1]) { G.box(0, sy * (hw - 20), h / 2 - 4, 11, 11, h / 2 - 4, LK.woodD); G.box(0, sy * (hw - 20), 10, 18, 18, 10, LK.stone[1]);
        G.tube([[0, sy * (hw - 29), h - 120], [0, sy * (hw - 110), h - 20]], 5, LK.woodD, { S: 6 }); }
      G.box(0, 0, h - 11, 13, hw + 60, 11, LK.wood); G.box(0, 0, h + 5, 16, hw + 68, 5, LK.woodD);
      G.box(0, 0, h - 128, 4, board / 2, 34, 0x34503e); for (const sz of [-1, 1]) G.box(0, 0, h - 128 + sz * 36, 5, board / 2 + 4, 3, LK.woodD); for (const sy of [-1, 1]) G.box(0, sy * (board / 2 + 2), h - 128, 5, 3, 38, LK.woodD);
      for (const sy of [-1, 1]) G.tube([[0, sy * (board / 2 - 30), h - 92], [0, sy * (board / 2 - 30), h - 20]], 1.6, 0x3a3a40, { S: 4, M: 4 });
    }
    for (const sy of [-1, 1]) hang(G, P, 0, sy * (hw + 38), h - 21, 24, LK.paper[sy > 0 ? 1 : 0]);
  });
}
// ---- a lantern dropped where the festival broke up: lying on its side, its paper faded and stove in on top
export function fallenLantern(seed = 1) {
  seed = N(seed);
  return ['lkfallen|' + (seed % 4), shape((G) => {
    const r = 18, b = G.n; hang(G, G, 0, 0, 0, r, mix(pick(LK.paper, seed), 0x8a8070, 0.5));
    G.place(b, { pitch: -90, z: r + 0.8 });
    G.map(b, ([x, y, z]) => [x, y, z > r * 1.25 ? r * 1.25 + (z - r * 1.25) * 0.35 : z]);
  })];
}
// ---- bundles of split withies for the frames, lying in a stack of three
export function withies(seed = 1) {
  seed = N(seed);
  return ['lkwithies|' + (seed % 2), shape((G) => {
    for (const [y, z] of [[-13, 12], [13, 12], [0, 34]]) { G.tube([[-130, y, z], [130, y + (seed % 2 ? 4 : -4), z]], 12, (t, a) => ((Math.round(a * 3) + Math.round(t * 30)) % 3 ? 0xc8b078 : 0xb0985e), { S: 10, M: 6 });
      for (const x of [-70, 70]) G.tube([[x, y, z], [x + 2, y, z]], 12.8, LK.rope, { S: 10, M: 1 }); }
  })];
}
// ---- a bale of straw, its two twines round it: seats round the field
export function strawBale(seed = 1) {
  seed = N(seed);
  return ['lkbale|' + (seed % 3), shape((G) => {
    G.box(0, 0, 22, 46, 24, 22, (nx, ny, nz) => (nz > 0.5 ? LK.straw : Math.abs(nx) > 0.5 ? LK.strawD : mix(LK.straw, LK.strawD, 0.4)));
    for (const x of [-22, 22]) { G.box(x, 0, 44.4, 1.2, 24.6, 0.6, LK.rope); for (const sy of [-1, 1]) G.box(x, sy * 24.4, 22, 1.2, 0.6, 22.6, LK.rope); }
  })];
}
// ---- bunting: a line of little flags from (-L/2, 0, -dz/2) to (L/2, 0, dz/2), sagging sag at its middle
export function bunting(L = 800, sag = 70, seed = 1, dz = 0) {
  L = q(L, 20); sag = q(sag, 10); seed = N(seed); dz = q(dz, 10);
  const zAt = (u) => (dz * u) / L - sag * (1 - (2 * u / L) ** 2);
  return ['lkbunting2|' + [L, sag, seed % 5, dz].join('|'), shape((G) => {
    const pts = []; for (let i = 0; i <= 16; i++) { const u = -L / 2 + (L * i) / 16; pts.push([u, 0, zAt(u)]); } G.tube(pts, 1.4, LK.rope, { S: 4, M: 40, caps: false });
    for (let u = -L / 2 + 30, i = 0; u < L / 2 - 29; u += 44, i++) { const z0 = zAt(u - 15), z1 = zAt(u + 15), c = pick(LK.flags, i + seed), a = G.v(u - 15, 0, z0 - 0.5, c), b = G.v(u + 15, 0, z1 - 0.5, c), d = G.v(u, 0, (z0 + z1) / 2 - 36, dark(c, 0.85)); G.idx.push(a, b, d); }
  })];
}
// ---- where the boardwalk turns: a square deck on four posts, its planks across
export function landing(W = 200) {
  W = q(W, 10);
  return ['lkland|' + W, shape((G) => {
    const hw = W / 2;
    for (const sy of [-1, 1]) G.box(0, sy * (hw - 16), 6, hw, 6, 4, LK.woodD);
    for (let x = -hw, i = 0; x < hw - 1; x += 26, i++) { const e = Math.min(hw, x + 26); G.box((x + e) / 2, 0, 11, (e - x) / 2 - 1.2, hw, 2, pick(LK.plank, i + 2)); }
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.box(sx * (hw - 16), sy * (hw - 16), 0, 7, 7, 6, LK.woodD);
  })];
}
