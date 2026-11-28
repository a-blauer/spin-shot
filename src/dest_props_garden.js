// Sculpted pieces for The Weeping Garden, in The Rot: the garden the gnomes made for their dead of the Rot, gone to
// ruin with them. Its brick walls and their piers, the iron gates, the black weeping trees and the great one at its
// heart, its clipped hedges (and the maze of them), marble mourners and urns, the fountains and the balustrades, the
// glasshouse, the grotto, the pergola, the temple; the gardeners' frames, bins and benches. Same rules as dest_props.js:
// UE frame (X the front, Y right, Z up), [key, build] pairs, keys carry every number the shape depends on, things stand
// on z = 0 (a thing hung from above has z = 0 its top), every piece whole.
import { shapeB as shape, shapeF, wob } from './propkit.js';
import { dark, mix } from './village_shapes.js';
import { q, rng } from './dest_props.js';

export const WG = {   // the garden's colours: old brick, marble gone grey, hedges dying, black bark, still black water
  brick: [0x7a5a4c, 0x6e5044, 0x84624f, 0x664a3e], brickD: 0x523c32, coping: [0xa8a296, 0x9c968a, 0xb2ac9e],
  marble: [0xd4d0c8, 0xc8c4bc, 0xdcd8d0], marbleD: 0xa29e96, stain: 0x5a5652, stone: [0xb2ac9e, 0xa6a094, 0xbcb6a8], stoneD: 0x86817a,
  hedge: [0x5a6448, 0x505a40, 0x667052, 0x48523a], hedgeD: 0x34402c, dead: [0x6a6050, 0x5e5444, 0x766a58], char: 0x1c1918, charL: 0x34302c, ash: 0x6e6862,
  bark: 0x2a2624, barkL: 0x3e3834, barkD: 0x1a1716, weep: [0x34303a, 0x2c2832, 0x3c3640], sap: 0x0e0c10, bloom: [0xd8c8cc, 0xc4b4ba],
  iron: 0x26302a, ironL: 0x4a564e, glass: 0xa6b8b2, glassD: 0x7e908c, water: 0x1a2220, waterL: 0x2a3430,
  soil: 0x3a3028, soilD: 0x2a2420, gravel: 0x8a8478, timber: 0x6e5a44, timberD: 0x54442f, timberL: 0x857058, terra: 0xa8603c, terraD: 0x80462c,
  tufa: [0xa49a86, 0x968c78, 0xb0a690, 0x8a806e], tufaD: 0x6e6656,
  cane: [0x3e3834, 0x4a4036, 0x463a30], hip: [0x4a1a1e, 0x2e1416, 0x5a2226],
};
const N = (s) => Math.abs(Math.round(s)) || 0;
const pick = (a, i) => a[((i % a.length) + a.length) % a.length];

// ---- a pier of the garden wall: square brick to h, a stone cap with a lip, a ball on a neck
export function wallPier(h = 340, w = 100, seed = 1) {
  h = q(h, 10); w = q(w, 10); seed = N(seed);
  return ['wgpier|' + [h, w, seed % 3].join('|'), shape((G) => {
    const a = w / 2, B = WG.brick;
    G.box(0, 0, 12, a + 6, a + 6, 12, WG.brickD);
    for (let z = 24, k = 0; z < h; k++) { const z1 = Math.min(h, z + 50); G.box(0, 0, (z + z1) / 2, a, a, (z1 - z) / 2 - 0.4, pick(B, (k * 3 + seed) % 7 === 0 ? 3 : k % 2 ? 0 : 2)); z = z1; }
    G.box(0, 0, h + 8, a + 12, a + 12, 8, WG.coping[0]); G.box(0, 0, h + 22, a + 4, a + 4, 6, WG.coping[1]);
    G.lathe([[14, h + 28], [10, h + 36], [12, h + 40]], WG.coping[2], 10); G.blob(0, 0, h + 62, 24, 24, 24, WG.coping[0], { nu: 12, nv: 8 });
  })];
}
// ---- the great piers of a gate: broad brick, a panel of stone in the face, a heavy cap, an urn on top
export function gatePier(h = 460, seed = 1) {
  h = q(h, 10); seed = N(seed);
  return ['wggpier|' + [h, seed % 3].join('|'), shape((G) => {
    const a = 85, B = WG.brick;
    G.box(0, 0, 15, a + 10, a + 10, 15, WG.coping[1]);
    for (let z = 30, k = 0; z < h; k++) { const z1 = Math.min(h, z + 50); G.box(0, 0, (z + z1) / 2, a, a, (z1 - z) / 2 - 0.4, pick(B, (k * 3 + seed) % 7 === 0 ? 3 : k % 2 ? 0 : 2)); z = z1; }
    for (let f = 0; f < 4; f++) { const m = G.n; G.box(a + 2, 0, h * 0.55, 2, a * 0.55, h * 0.22, WG.coping[2]); G.place(m, { yaw: f * 90 }); }
    G.box(0, 0, h + 10, a + 16, a + 16, 10, WG.coping[0]); G.box(0, 0, h + 26, a + 8, a + 8, 6, WG.coping[1]);
    G.lathe([[34, h + 32], [26, h + 44], [20, h + 52], [36, h + 70], [44, h + 96], [40, h + 112], [46, h + 118], [0, h + 118]], (k) => (k > 4 ? WG.coping[2] : WG.coping[0]), 14);
    G.blob(0, 0, h + 128, 18, 18, 14, WG.coping[1], { nu: 10, nv: 6 });
  })];
}
// ---- a pair of wrought-iron gates shut across an opening w wide: bars with spear-heads, rails, a scrolled arch over
// the meeting stiles, the chain and padlock that hold them; the opening along Y, the gates on x = 0
export function ironGates(w = 700, h = 330) {
  w = q(w, 10); h = q(h, 10);
  return ['wggates|' + [w, h].join('|'), shape((G) => {
    const hw = w / 2, I = WG.iron, top = (y) => h + 60 * Math.cos((y / hw) * Math.PI / 2);
    for (const s of [-1, 1]) {
      G.box(0, s * (hw - 5), (top(hw) + 10) / 2, 4, 5, (top(hw) + 10) / 2, I); G.box(0, s * 5, (top(0) + 6) / 2, 4, 4, (top(0) + 6) / 2, I);
      for (const z of [40, h * 0.55]) G.box(0, s * hw / 2, z, 3, hw / 2 - 4, 3, I);
      for (let y = 30; y < hw - 14; y += 28) { const t = top(y); G.tube([[0, s * y, 6], [0, s * y, t]], 1.8, I, { S: 4, M: 2 }); G.tube([[0, s * y, t], [0, s * y, t + 16]], (u) => 4 * (1 - u) + 0.3, WG.ironL, { S: 4, M: 2 }); }
      G.tube([...Array(9).keys()].map((i) => { const y = 5 + ((hw - 10) * i) / 8; return [0, s * y, top(y) - 6]; }), 3, I, { S: 5 });
      for (const y of [hw * 0.3, hw * 0.65]) { const m = G.n; G.tube([[0, -30, 0], [0, -20, 18], [0, 0, 22], [0, 16, 14], [0, 12, 0], [0, 0, -4]], 1.6, WG.ironL, { S: 4 }); G.place(m, { y: s * y, z: h * 0.55 + 30 }); }
    }
    for (const y of [-12, 0, 12]) { const m = G.n; G.lathe([[3, -5], [6, 0], [3, 5], [0, 0], [3, -5]], WG.ironL, 8, [0, 0, 0], [1, 1], true); G.place(m, { y, z: h * 0.45, roll: 90 }); }
    G.box(6, 0, h * 0.45 - 26, 4, 12, 14, WG.ironL);
  })];
}

// ---- a weeping cherry, black and bare but for a little grey blossom: a leaning trunk, its branches arching out and
// over, the strands hanging from them straight down, never lower than a gnome can pass under (z 240)
export const WC_LOW = 240;
export function weepingCherry(h = 560, seed = 1) {
  h = q(h, 20); seed = N(seed);
  return ['wgcherry|' + [h, seed % 6].join('|'), shape((G) => {
    const R = rng(seed * 53 + h), zc = h * 0.58, lean = (R() - 0.5) * 40;
    G.tube([[0, 0, -10], [lean * 0.3, 0, zc * 0.4], [lean, R() * 10, zc]], (t) => 20 - t * 8, WG.bark, { S: 8, M: 8 });
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + R(); G.tube([[0, 0, 26], [Math.cos(a) * 30, Math.sin(a) * 30, 6], [Math.cos(a) * 44, Math.sin(a) * 44, -6]], (t) => 10 - t * 6, WG.barkD, { S: 5 }); }
    const nb = 7 + (seed % 3);
    for (let i = 0; i < nb; i++) { const a = (i / nb) * Math.PI * 2 + R() * 0.5, r = h * (0.36 + R() * 0.14), up = h * (0.32 + R() * 0.12), cx = lean, P = (t) => [cx + Math.cos(a) * r * t, Math.sin(a) * r * t, zc + up * Math.sin(Math.min(1, t * 1.25) * Math.PI * 0.62) - (t > 0.75 ? (t - 0.75) * up * 0.9 : 0)];
      const pts = [...Array(11).keys()].map((k) => P(k / 10)); G.tube(pts, (t) => 7 - t * 4.5, WG.bark, { S: 5, M: 20 });
      for (let j = 0; j < 7; j++) { const t = 0.45 + j * 0.09, [x, y, z] = P(Math.min(1, t)), L = Math.max(30, z - WC_LOW - R() * 50); G.tube([[x, y, z], [x + (R() - 0.5) * 8, y + (R() - 0.5) * 8, z - L * 0.5], [x + (R() - 0.5) * 12, y + (R() - 0.5) * 12, z - L]], 1.6, pick(WG.weep, j + i), { S: 3, M: 3 });
        if (R() < 0.3) G.blob(x, y, z - L * (0.3 + R() * 0.5), 5, 5, 4, pick(WG.bloom, j), { nu: 5, nv: 4 }); } }
  })];
}
export const cherryR = 22;
// ---- the Weeping Tree: the great black tree at the garden's heart. A vast trunk on buttressed roots, a cleft at its
// foot (where the Char came up), six great limbs arching out and down, their twigs, and from them the curtains of
// strands hanging to a gnome's reach (z 260), the black sap gathering at their ends
export const WT = { trunk: 120, low: 260 };
export function weepingTree(h = 1700, seed = 1) {
  h = q(h, 50); seed = N(seed);
  return ['wgtree|' + [h, seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 71 + h), T = WT.trunk, zs = h * 0.42;
    G.tube([[0, 0, -20], [6, -4, zs * 0.5], [-8, 6, zs]], (t) => T * (1 - t * 0.3) + 10 * Math.sin(t * 9), WG.bark, { S: 14, M: 10 });
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + R() * 0.4, L = T * (1.6 + R() * 0.6); G.tube([[Math.cos(a) * T * 0.5, Math.sin(a) * T * 0.5, zs * 0.28], [Math.cos(a) * (T + L * 0.5), Math.sin(a) * (T + L * 0.5), zs * 0.08], [Math.cos(a) * (T + L), Math.sin(a) * (T + L), -12]], (t) => 42 * (1 - t) + 6, k % 2 ? WG.bark : WG.barkL, { S: 7, M: 8, flat: () => [1, 0.55] }); }
    { const m = G.n; G.blob(0, 0, 0, 30, 44, 90, WG.barkD, { nu: 8, nv: 6 }); G.place(m, { x: T * 0.92, y: -10, z: 70 }); G.blob(T * 0.95, -10, 60, 12, 30, 70, WG.sap, { nu: 8, nv: 6 }); }
    const limbs = [];
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.3 + R() * 0.3, r = h * (0.5 + R() * 0.12), up = h * (0.36 + R() * 0.1);
      const P = (t) => [Math.cos(a) * r * t, Math.sin(a) * r * t, zs + up * Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.62) - (t > 0.7 ? (t - 0.7) * up * 1.1 : 0)];
      G.tube([...Array(13).keys()].map((k) => P(k / 12)), (t) => 46 * (1 - t) + 6, i % 2 ? WG.bark : WG.barkL, { S: 8, M: 26 }); limbs.push(P);
      for (let j = 0; j < 3; j++) { const t0 = 0.35 + j * 0.2, [x0, y0, z0] = P(t0), b = a + (j % 2 ? 0.5 : -0.5), L = r * 0.35, Q = (t) => { const tt = Math.min(1, t); return [x0 + Math.cos(b) * L * tt, y0 + Math.sin(b) * L * tt, z0 + 40 * Math.sin(tt * Math.PI) - 20 * tt]; }; G.tube([...Array(9).keys()].map((k) => Q(k / 8)), (t) => 14 * (1 - t) + 3, WG.bark, { S: 5, M: 16 });
        limbs.push(Q); } }
    for (const P of limbs) for (let j = 0; j < 14; j++) { const t = 0.3 + (j / 14) * 0.7, [x, y, z] = P(t), L = Math.max(60, z - WT.low - R() * 70), c = pick(WG.weep, j + Math.round(x));
      const ex = x + (R() - 0.5) * 24, ey = y + (R() - 0.5) * 24, ez = z - L; G.tube([[x, y, z], [x + (R() - 0.5) * 16, y + (R() - 0.5) * 16, z - L * 0.5], [ex, ey, ez]], (u) => 2.6 - u * 1.2, c, { S: 3, M: 4 });
      if (R() < 0.25) G.blob(ex, ey, ez - 3, 3, 3, 6, WG.sap, { nu: 5, nv: 4 }); }
  })];
}

// ---- a clipped hedge along X, len long, d deep, h high: leafy and square-shouldered, grey-green going brown in
// patches; burnt, charred black with grey ash on its top
export function hedge(len = 600, h = 220, d = 80, seed = 1, burnt = 0) {
  len = q(len, 20); h = q(h, 10); d = q(d, 10); seed = N(seed);
  return ['wghedge2|' + [len, h, d, seed % 5, burnt].join('|'), shapeF((G) => {
    const hl = len / 2, R = rng(seed * 41 + len + h);
    // the clipped body: one long block, its faces lumpy with the leaves, square at the ends
    G.surf((u, v) => { const a = u * Math.PI * 2, ph = -Math.PI / 2 + v * Math.PI, cp = Math.cos(ph), sp = (q2, p) => Math.sign(q2) * Math.pow(Math.abs(q2), p), x = hl * sp(cp, 0.18) * sp(Math.cos(a), 0.12), y = (d / 2) * sp(cp, 0.3) * sp(Math.sin(a), 0.3), z = (h / 2) * sp(Math.sin(ph), 0.3), n = wob(x * 0.045 + seed, z * 0.05 + y * 0.03) + 0.5 * wob(x * 0.11 - y * 0.05, z * 0.13 + seed);
      const k = burnt ? 1 + 0.06 * n : 1 + 0.13 * n; return [x * (1 + 0.012 * n), y * k, h / 2 + Math.max(-h / 2, z * (z > 0 ? 1 + 0.06 * n : 1))]; }, 0, 1, Math.max(16, Math.round(len / 22)), 0, 1, 12,
      (u, v) => { const w = wob(u * 13 + seed, v * 4), w2 = wob(u * 41 - seed, v * 11); return burnt ? (v > 0.7 && w > -0.2 ? WG.ash : w2 > 0.4 ? WG.charL : WG.char) : v < 0.12 ? WG.hedgeD : w > 0.45 ? pick(WG.dead, Math.round(u * 40)) : w2 > 0.5 ? WG.hedge[2] : w2 < -0.4 ? WG.hedge[3] : pick(WG.hedge, Math.round(w * 2 + 1)); }, true);
    // twigs: dead ones up out of its top; on a burnt one, the charred stems standing out of the ash
    for (let i = 0; i < Math.round(len / (burnt ? 40 : 90)); i++) { const x = (R() - 0.5) * (len - 100), y = (R() - 0.5) * (d - 20), hh = burnt ? 20 + R() * 40 : 10 + R() * 26; G.tube([[x, y, h - 8], [x + (R() - 0.5) * 10, y + (R() - 0.5) * 10, h + hh]], burnt ? 2 : 1.4, burnt ? WG.char : pick(WG.dead, i), { S: 3, M: 2 }); }
  })];
}
// ---- a stone urn on its pedestal, dead stalks in it
export function urn(seed = 1, h = 120) {
  seed = N(seed); h = q(h, 10);
  return ['wgurn|' + [seed % 3, h].join('|'), shape((G) => {
    const S = WG.stone, R = rng(seed * 5 + 3);
    G.box(0, 0, 8, 40, 40, 8, WG.stoneD); G.box(0, 0, 16 + (h - 36) / 2, 30, 30, (h - 36) / 2, S[0]); G.box(0, 0, h - 12, 38, 38, 8, S[1]); G.box(0, 0, h - 2, 34, 34, 2, S[2]);
    G.lathe([[16, 0], [12, 10], [10, 20], [30, 34], [38, 54], [36, 70], [42, 76], [40, 82], [0, 80]], (k) => (k > 5 ? S[2] : k > 3 ? S[0] : S[1]), 16, [0, 0, h]);
    for (const s of [-1, 1]) G.tube([[0, s * 34, h + 66], [0, s * 46, h + 62], [0, s * 44, h + 46], [0, s * 34, h + 42]], 3, S[1], { S: 5 });
    G.lathe([[0, h + 74], [34, h + 74], [34, h + 76], [0, h + 77]], WG.soilD, 12);
    for (let i = 0; i < 6; i++) { const a = R() * 6.28, d = R() * 20; G.tube([[Math.cos(a) * d, Math.sin(a) * d, h + 75], [Math.cos(a) * (d + 10), Math.sin(a) * (d + 10), h + 110 + R() * 40]], 1.2, pick(WG.dead, i), { S: 3, M: 2 }); }
  })];
}
// ---- a mourner: a gnome in marble, cloaked and hooded (the hood his hat's point), on a plinth, his head bowed; kind 0
// his face in his hands, kind 1 a wreath held before him. Dark runs down the stone from under his hood. Front +X.
export const MOURN = { p: 110, w: 190 };
export function mourner(h = 270, kind = 0, seed = 1) {
  h = q(h, 10); seed = N(seed);
  return ['wgmourn|' + [h, kind, seed % 3].join('|'), shape((G) => {
    const M = WG.marble, p = MOURN.p, k = h / 270, c0 = pick(M, seed), c1 = pick(M, seed + 1);
    G.box(0, 0, 10, MOURN.w / 2 + 10, MOURN.w / 2 + 10, 10, WG.stoneD); G.box(0, 0, 20 + (p - 40) / 2, MOURN.w / 2, MOURN.w / 2, (p - 40) / 2, (nx, ny, nz) => (nz ? M[2] : M[1])); G.box(0, 0, p - 10, MOURN.w / 2 + 8, MOURN.w / 2 + 8, 10, M[0]);
    G.box(MOURN.w / 2 + 1, 0, p * 0.5, 1.5, MOURN.w * 0.32, p * 0.22, WG.marbleD);
    const m0 = G.n;
    G.lathe([[74, 0], [76, 20], [70, 80], [60, 140], [50, 176], [38, 196], [0, 204]], (j) => (j === 0 ? WG.marbleD : c0), 16);
    const hd = [16, 0, 190];
    G.tube([[hd[0], 0, hd[2]], [hd[0] + 26, 0, hd[2] + 40], [hd[0] + 20, 0, hd[2] + 72], [hd[0] + 2, 0, hd[2] + 80]], (t) => 56 * Math.pow(1 - t, 1.1) + 2, c1, { S: 14, M: 12 });
    G.blob(hd[0] + 46, 0, hd[2] + 6, 12, 30, 28, WG.stain, { nu: 10, nv: 6 });
    G.blob(hd[0] + 44, 0, hd[2] - 26, 14, 18, 22, c1, { nu: 8, nv: 6, warp: (x, y, z) => [x, y * (0.4 + 0.6 * Math.max(0, (z + 22) / 44)), z] });
    for (const s of [-1, 1]) G.box(hd[0] + 52, s * 12, hd[2] - 40, 1.2, 2.2, 36, WG.stain);
    if (kind === 0) for (const s of [-1, 1]) { G.tube([[8, s * 50, 160], [40, s * 46, 140], [56, s * 20, hd[2] - 4]], (t) => 18 - t * 4, c0, { S: 8 }); G.blob(60, s * 14, hd[2] + 2, 14, 12, 16, c1, { nu: 8, nv: 6 }); }
    else { for (const s of [-1, 1]) { G.tube([[8, s * 50, 160], [44, s * 44, 120], [66, s * 22, 110]], (t) => 18 - t * 4, c0, { S: 8 }); G.blob(70, s * 18, 110, 13, 12, 13, c1, { nu: 8, nv: 6 }); }
      const m = G.n; G.lathe([[34, -6], [40, 0], [34, 6], [28, 0], [34, -6]], WG.marbleD, 16, [0, 0, 0], [1, 1], true); for (let j = 0; j < 12; j++) { const a = (j / 12) * Math.PI * 2; G.blob(Math.cos(a) * 36, Math.sin(a) * 36, 0, 8, 6, 6, c0, { nu: 6, nv: 4 }); } G.place(m, { x: 80, z: 92, pitch: 72 }); }
    G.place(m0, { z: p, s: k });
  })];
}

// ---- a fountain: the round basin's kerb, its still black water; the pedestal and two bowls over it, black water
// weeping from their rims; a pine cone of stone on top
export function fountain(r = 420, seed = 1) {
  r = q(r, 20); seed = N(seed);
  return ['wgfount|' + [r, seed % 2].join('|'), shape((G) => {
    const S = WG.stone;
    G.lathe([[r - 40, 0], [r, 0], [r + 6, 34], [r, 50], [r - 40, 50], [r - 44, 40], [r - 44, 0]], (k) => (k === 2 || k === 3 ? S[2] : S[0]), 40, [0, 0, 0], [1, 1], true);
    G.lathe([[0, 0], [r - 43, 0], [r - 43, 32], [0, 32]], WG.water, 40); G.lathe([[0, 32.4], [r - 43, 32.4]], WG.waterL, 40);
    G.lathe([[60, 0], [50, 40], [34, 70], [30, 150], [40, 170]], (k) => pick(S, k), 14);
    G.lathe([[40, 170], [150, 186], [160, 204], [146, 206], [40, 196]], (k) => (k === 2 ? S[2] : S[1]), 24); G.lathe([[0, 197], [146, 205]], WG.water, 24);
    G.lathe([[20, 196], [18, 300], [26, 310]], S[0], 10); G.lathe([[26, 310], [74, 320], [80, 334], [70, 336], [26, 328]], S[1], 18); G.lathe([[0, 329], [70, 335]], WG.water, 18);
    G.lathe([[12, 328], [16, 350], [22, 372], [18, 394], [8, 410], [0, 416]], S[2], 10);
    for (let j = 0; j < 10; j++) { const a = (j / 10) * Math.PI * 2 + 0.2; G.tube([[Math.cos(a) * 158, Math.sin(a) * 158, 202], [Math.cos(a) * 162, Math.sin(a) * 162, 120], [Math.cos(a) * 164, Math.sin(a) * 164, 32]], 1.6, WG.sap, { S: 3, M: 3 }); }
    for (let j = 0; j < 6; j++) { const a = (j / 6) * Math.PI * 2; G.tube([[Math.cos(a) * 78, Math.sin(a) * 78, 332], [Math.cos(a) * 82, Math.sin(a) * 82, 260], [Math.cos(a) * 84, Math.sin(a) * 84, 205]], 1.4, WG.sap, { S: 3, M: 3 }); }
  })];
}
// ---- a stone balustrade along X: plinth, vase balusters, the rail, and a post at each end with a ball on it
export const BAL = { h: 100, w: 46 };
export function balustrade(len = 600, seed = 1) {
  len = q(len, 20); seed = N(seed);
  return ['wgbal|' + [len, seed % 3].join('|'), shape((G) => {
    const hl = len / 2, S = WG.stone, { h, w } = BAL;
    G.box(0, 0, 9, hl, w / 2, 9, WG.stoneD); G.box(0, 0, h - 10, hl, w / 2 + 2, 10, S[2]); G.box(0, 0, 21, hl, w / 2 - 6, 3, S[0]);
    for (let x = -hl + 70; x < hl - 50; x += 34) G.lathe([[8, 24], [12, 34], [15, 48], [9, 66], [8, 72], [10, 78], [10, h - 20]], (k) => pick(S, k + seed), 8, [x, 0, 0]);
    for (const s of [-1, 1]) { const x = s * (hl - 30); G.box(x, 0, h / 2 + 6, 30, w / 2 + 6, h / 2 + 6, S[1]); G.box(x, 0, h + 16, 34, w / 2 + 10, 4, S[2]); G.lathe([[10, h + 20], [8, h + 28]], S[0], 8, [x, 0, 0]); G.blob(x, 0, h + 42, 16, 16, 16, S[2], { nu: 10, nv: 6 }); }
  })];
}

// ---- the glasshouse: L long (X) and W wide, on a low brick wall; iron uprights and glazing bars to the eaves at
// GH.E, the roof's ribs a segmental arch to the ridge, glass between them (pale where it still holds, gone from half
// the panes overhead); its two ends glazed to their arch, a door in each (the +X one open). Its inside is open.
export const GH = { E: 560, rise: 460, door: 400, doorH: 330, plinth: 70, t: 40, swing: 90, side: 260 };
export function glasshouse(L = 2600, W = 1400, seed = 1) {
  L = q(L, 130); W = q(W, 100); seed = N(seed);
  return ['wgglass|' + [L, W, seed % 3].join('|'), shape((G) => {
    const { E, rise, door, doorH, plinth, t } = GH, hl = L / 2, hw = W / 2, R = rng(seed * 61 + L), I = WG.iron, bay = 130, nb = Math.round(L / bay);
    const roofZ = (y) => E + rise * Math.sqrt(Math.max(0, 1 - (y / hw) ** 2));
    const pane = (P, keep) => { if (!keep) return; const k = G.n, c = R() < 0.15 ? WG.glassD : WG.glass; for (const [x, y, z] of P) G.v(x, y, z, c); G.idx.push(k, k + 1, k + 2, k, k + 2, k + 3); };
    // the brick wall it stands on, broken only by the doors (one in each end, one in the middle of each side)
    const sd2 = GH.side / 2;
    for (const s of [-1, 1]) { for (const e of [-1, 1]) G.box(e * (hl + sd2) / 2, s * (hw - t / 2), plinth / 2, (hl - sd2) / 2, t / 2, plinth / 2, WG.brick[1]); G.box(0, s * (hw - t / 2), 3, sd2, t / 2 + 6, 3, WG.stone[0]); }
    for (const s of [-1, 1]) for (const e of [-1, 1]) G.box(s * (hl - t / 2), e * (hw + door / 2) / 2, plinth / 2, t / 2, (hw - door / 2) / 2, plinth / 2, WG.brick[2]);
    for (const s of [-1, 1]) for (const e of [-1, 1]) G.box(e * (hl + 4 + sd2) / 2, s * (hw - t / 2), plinth + 3, (hl + 4 - sd2) / 2, t / 2 + 4, 3, WG.coping[0]);
    // the long sides: uprights, bars, glass; the side door's jambs down to the sill, its head, a pane over it, its two
    // leaves swung open square to the wall
    for (const s of [-1, 1]) { const y = s * (hw - t / 2);
      for (let i = 0; i <= nb; i++) { const x = -hl + i * bay; if (Math.abs(x) < 2) continue; const z0 = Math.abs(Math.abs(x) - sd2) < 2 ? 0 : plinth; G.box(x, y, (z0 + E) / 2, 4, 4, (E - z0) / 2, I); }
      for (const z of [plinth + 6, 260, 420, E]) { if (z < doorH) { for (const e of [-1, 1]) G.box(e * (hl + sd2) / 2, y, z, (hl - sd2) / 2, 4, 3, I); } else G.box(0, y, z, hl, 4, 3, I); }
      G.box(0, y, doorH, sd2 + 4, 5, 4, I);
      for (let i = 0; i < nb; i++) { const x0 = -hl + i * bay + 4, x1 = x0 + bay - 8, dr = x0 > -sd2 && x1 < sd2; for (const [z0, z1] of dr ? [[doorH + 7, 417], [423, E - 3]] : [[plinth + 9, 257], [263, 417], [423, E - 3]]) pane([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], z0 < 250 || R() > 0.4); }
      for (const e of [-1, 1]) { const m = G.n, lw = sd2 / 2; G.box(0, 0, doorH / 2, 3, lw - 2, doorH / 2 - 2, I); for (const z of [120, 240]) G.box(0, 0, z, 4, lw - 2, 3, I); for (const f of [-1, 1]) pane([[f * 3.5, -lw + 6, 30], [f * 3.5, lw - 6, 30], [f * 3.5, lw - 6, doorH - 20], [f * 3.5, -lw + 6, doorH - 20]], true); G.place(m, { x: e * sd2, y: s * (hw - t / 2 + lw), yaw: 0 }); } }
    // the roof: ribs over it at every upright, the eaves beams, glass between the ribs, half of it gone
    const nA = 10, ya = (k) => -hw + (W * k) / nA;
    for (let i = 0; i <= nb; i++) { const x = -hl + i * bay; for (let k = 0; k < nA; k++) { const y0 = ya(k), y1 = ya(k + 1), z0 = roofZ(y0), z1 = roofZ(y1), m = G.n, L2 = Math.hypot(y1 - y0, z1 - z0); G.box(0, 0, 0, 4, L2 / 2 + 2, 4, I); G.place(m, { x, y: (y0 + y1) / 2, z: (z0 + z1) / 2, roll: (Math.atan2(z1 - z0, y1 - y0) * 180) / Math.PI }); } }
    for (const s of [-1, 1]) G.box(0, s * hw, E, hl + 6, 6, 6, I); G.box(0, 0, E + rise + 4, hl + 6, 8, 6, I);
    for (let i = 0; i < nb; i++) { const x0 = -hl + i * bay + 4, x1 = x0 + bay - 8; for (let k = 0; k < nA; k++) { const y0 = ya(k) + 3, y1 = ya(k + 1) - 3; pane([[x0, y0, roofZ(y0) + 1], [x1, y0, roofZ(y0) + 1], [x1, y1, roofZ(y1) + 1], [x0, y1, roofZ(y1) + 1]], R() > 0.5); } }
    // the ends: uprights to the arch, bars, glass, the door's frame; both doors' leaves swung open square to the wall
    for (const s of [-1, 1]) { const x = s * (hl - t / 2), n = 10;
      for (let k = 0; k <= n; k++) { const y = -hw + (W * k) / n; if (Math.abs(y) < door / 2 - 2) continue; G.box(x, y, (plinth + roofZ(y)) / 2, 4, 4, (roofZ(y) - plinth) / 2, I); }
      for (const y of [-door / 2, door / 2]) G.box(x, y, roofZ(y) / 2, 6, 6, roofZ(y) / 2, I); G.box(x, 0, doorH, 6, door / 2 + 6, 6, I);
      for (let k = 0; k < n; k++) { const y0 = -hw + (W * k) / n + 4, y1 = y0 + W / n - 8; for (const [z0, zt] of [[plinth + 6, 260], [263, 420], [423, 2000]]) { const a = Math.max(y0, -hw), b = Math.min(y1, hw); if (b < -door / 2 + 6 && a < -door / 2 || a > door / 2 - 6) { const t0 = Math.min(zt, roofZ(a) - 3), t1 = Math.min(zt, roofZ(b) - 3); if (t0 > z0 + 10 && t1 > z0 + 10) pane([[x, a, z0], [x, b, z0], [x, b, t1], [x, a, t0]], z0 < 250 || R() > 0.4); } } }
      for (let k = 0; k < 4; k++) { const y0 = -door / 2 + 6 + (k * (door - 12)) / 4, y1 = y0 + (door - 12) / 4 - 4; pane([[x, y0, doorH + 8], [x, y1, doorH + 8], [x, y1, roofZ(y1) - 3], [x, y0, roofZ(y0) - 3]], R() > 0.3); }
      G.lathe([[10, 0], [6, 30], [12, 40], [0, 70]], I, 8, [x, 0, E + rise + 6]);
      for (const e of [-1, 1]) { const m = G.n; G.box(0, 0, doorH / 2, 3, door / 4 - 2, doorH / 2 - 2, I); for (const z of [120, 240]) G.box(0, 0, z, 4, door / 4 - 2, 3, I); for (const f of [-1, 1]) pane([[f * 3.5, -door / 4 + 6, 30], [f * 3.5, door / 4 - 6, 30], [f * 3.5, door / 4 - 6, doorH - 20], [f * 3.5, -door / 4 + 6, doorH - 20]], true); const sw = (GH.swing * Math.PI) / 180; G.place(m, { x: x + s * (door / 4) * Math.sin(sw), y: e * (door / 2 - (door / 4) * Math.cos(sw)), yaw: s * e * GH.swing }); }
    }
  })];
}
// ---- a palm dead in the glasshouse: a ringed trunk curving up, its dead fronds hung down round its head
export function deadPalm(h = 620, seed = 1) {
  h = q(h, 20); seed = N(seed);
  return ['wgpalm|' + [h, seed % 4].join('|'), shape((G) => {
    const R = rng(seed * 29 + h), bx = (R() - 0.5) * 80, by = (R() - 0.5) * 80, P = (t) => [bx * t * t, by * t * t, t * h];
    G.tube([0, 0.33, 0.66, 1].map(P), (t) => 18 - t * 6, (t) => (Math.floor(t * 30) % 2 ? WG.timberD : WG.dead[1]), { S: 8, M: 16 });
    const [tx, ty, tz] = P(1); G.blob(tx, ty, tz, 20, 20, 18, WG.dead[2], { nu: 8, nv: 6 });
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2 + R() * 0.3, L = 200 + R() * 80, pts = [[tx, ty, tz + 6], [tx + Math.cos(a) * L * 0.4, ty + Math.sin(a) * L * 0.4, tz + 30], [tx + Math.cos(a) * L * 0.75, ty + Math.sin(a) * L * 0.75, tz - 40], [tx + Math.cos(a) * L * 0.9, ty + Math.sin(a) * L * 0.9, tz - 160 - R() * 80]];
      G.tube(pts, (t) => 9 * (1 - t) + 1.5, pick(WG.dead, i), { S: 4, M: 10, flat: () => [1, 0.3] }); }
  })];
}
// ---- the grotto: a hollow of tufa, a niche under its arch (front +X, 330 deep, 200 wide), water weeping black down
// its back into the pool before it; shells set in the rock, dead ferns on it
export function grotto(seed = 1) {
  seed = N(seed);
  return ['wggrotto|' + (seed % 2), shapeF((G) => {
    const T = WG.tufa, col = (nx, ny, nz) => { const w = wob(nx * 6 + seed, ny * 5 + nz * 7); return w > 0.6 ? T[2] : w < -0.5 ? WG.tufaD : pick(T, Math.round((w + 1) * 2)); };
    const lump = (x, y, z, a, b, c) => G.blob(x, y, z, a, b, c, col, { nu: 12, nv: 8, warp: (px, py, pz) => [px * (1 + 0.12 * wob(py * 0.02 + x, pz * 0.02)), py * (1 + 0.1 * wob(px * 0.02, pz * 0.03 + y)), Math.max(pz, -z)] });
    lump(10, -370, 300, 310, 270, 300); lump(10, 370, 300, 310, 270, 300); lump(-280, 0, 330, 230, 330, 330); lump(60, 0, 600, 300, 420, 190);
    lump(-160, -560, 160, 200, 180, 160); lump(-120, 560, 200, 220, 160, 200); lump(240, -420, 110, 140, 110, 110);
    // the water weeping black down the niche's back: down the back lump's own middle edge (its vertices, warped as the
    // lump is), from under the arch to its foot, a last drop to the floor and the black pooled there
    { const [bx, , bz, ba, bc] = [-280, 0, 330, 230, 330], P = [];
      for (let j = 5; j >= 1; j--) { const ph = -Math.PI / 2 + (j * Math.PI) / 8, lx = ba * Math.cos(ph), lz = bc * Math.sin(ph); P.push([bx + lx * (1 + 0.12 * wob(bx, lz * 0.02)), 0, bz + lz]); }
      const Q = []; for (let k = 0; k < P.length - 1; k++) for (let t = 0; t < 3; t++) Q.push(P[k].map((v, i) => v + ((P[k + 1][i] - v) * t) / 3));
      const [fx, , fz] = P[P.length - 1]; Q.push([fx, 0, fz], [fx + 4, 0, 1.5]);
      G.tube(Q, (u) => 5.5 - u * 2.5, WG.sap, { S: 5, M: Q.length * 2 }); G.blob(fx + 20, 0, 0, 60, 44, 1.2, WG.sap, { nu: 14, nv: 4, warp: (x, y, z) => [x, y, Math.max(0.2, z)] }); }
  })];
}
export const GROTTO = { niche: [130, 0], r: 640 };
// ---- a pergola along X: stone posts in two rows, beams along them, rafters across, a dead rose wound up every post and
// over the top, its last roses withered black-red
export function pergola(len = 1600, seed = 1) {
  len = q(len, 400); seed = N(seed);
  return ['wgperg|' + [len, seed % 3].join('|'), shape((G) => {
    const hl = len / 2, R = rng(seed * 13 + len), S = WG.stone, H = 270, n = Math.round(len / 400);
    for (let i = 0; i <= n; i++) { const x = -hl + i * 400; for (const y of [-170, 170]) { G.box(x, y, 8, 26, 26, 8, WG.stoneD); G.box(x, y, (H - 6) / 2 + 8, 18, 18, (H - 6) / 2 - 2, pick(S, i)); G.box(x, y, H + 4, 24, 24, 6, S[2]);
      const pts = []; for (let k = 0; k <= 10; k++) { const a = k * 1.3 + R() * 6, z = 6 + (k / 10) * (H + 4); pts.push([x + Math.cos(a) * 22, y + Math.sin(a) * 22, z]); } G.tube(pts, 2.6, WG.barkL, { S: 4, M: 30 }); } }
    for (const y of [-170, 170]) G.box(0, y, H + 18, hl + 40, 10, 8, WG.timberD);
    for (let x = -hl - 20; x <= hl + 20; x += 80) G.box(x, 0, H + 32, 7, 220, 6, WG.timber);
    for (let i = 0; i < n * 3; i++) { const x = -hl + R() * len, y = (R() < 0.5 ? -1 : 1) * 170; G.tube([[x, y, H + 26], [x + 30, y * 0.6, H + 40], [x + 60, y * 0.2, H + 36], [x + 90, -y * 0.2, H + 40]], 2, WG.barkL, { S: 4 }); if (R() < 0.7) G.blob(x + 60, y * 0.2, H + 44, 7, 7, 6, R() < 0.5 ? 0x4a1a1e : 0x2e1416, { nu: 6, nv: 4 }); }
  })];
}
// ---- a rose bush gone over: its canes up out of a knotted crown and arching out, a shoot off each, the last roses
// withered black-red at their ends; burnt, black stubs of cane and nothing more. RB.r: how far it reaches (its body)
export const RB = { r: 56 };
export function roseBush(h = 110, seed = 1, burnt = 0) {
  h = q(h, 10); seed = N(seed); burnt = burnt ? 1 : 0;
  return ['wgrose|' + [h, seed % 5, burnt].join('|'), shape((G) => {
    const R = rng(seed * 53 + h + burnt * 7), n = burnt ? 6 : 7 + (seed % 3), reach = RB.r - 16;
    G.blob(0, 0, 0, 16, 16, 12, burnt ? WG.char : WG.bark, { nu: 8, nv: 5, warp: (x, y, z) => [x, y, Math.max(0, z)] });
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + R() * 0.7, ca = Math.cos(a), sa = Math.sin(a), rr = (0.55 + R() * 0.45) * reach, j = () => (R() - 0.5) * 6;
      if (burnt) { const top = (0.3 + R() * 0.3) * h; G.tube([[ca * 5, sa * 5, 8], [ca * rr * 0.25 + j(), sa * rr * 0.25 + j(), top * 0.6], [ca * rr * 0.4, sa * rr * 0.4, top]], (u) => 3.4 - u * 1.4, R() < 0.5 ? WG.char : WG.charL, { S: 4, M: 5 }); continue; }
      const top = (0.72 + R() * 0.28) * h, P = [[ca * 5, sa * 5, 8], [ca * rr * 0.25 + j(), sa * rr * 0.25 + j(), top * 0.5], [ca * rr * 0.62 + j(), sa * rr * 0.62 + j(), top * 0.88], [ca * rr * 0.9, sa * rr * 0.9, top], [ca * rr, sa * rr, top * 0.84]];
      G.tube(P, (u) => 2.8 - u * 1.5, pick(WG.cane, i + seed), { S: 4, M: 8 });
      const [ex, ey, ez] = P[4]; G.blob(ex, ey, ez - 4, 6, 6, 6, pick(WG.hip, i), { nu: 6, nv: 4 });
      const [sx, sy, sz] = P[2], b = a + (R() < 0.5 ? 1 : -1) * 0.9, sl = 12 + R() * 8, tx = sx + Math.cos(b) * sl * 0.6 - ca * 4, ty = sy + Math.sin(b) * sl * 0.6 - sa * 4, tz = sz + sl;
      G.tube([[sx, sy, sz], [tx, ty, tz]], (u) => 1.4 - u * 0.5, pick(WG.cane, i + 1), { S: 3, M: 2 }); if (R() < 0.6) G.blob(tx, ty, tz + 1, 3.5, 3.5, 4, pick(WG.hip, i + 1), { nu: 5, nv: 4 });
    }
  })];
}
// ---- a rose arch over a walk: two iron hoops on their posts with rungs between, a dead rose climbed up both sides and
// over, short shoots off it, its withered heads hanging from the top; burnt, the rose's black stems part way up the
// posts. RA: the span between the posts, the crown's height, the depth between the hoops
export const RA = { w: 260, h: 340, d: 60 };
export function roseArch(seed = 1, burnt = 0) {
  seed = N(seed); burnt = burnt ? 1 : 0;
  return ['wgarch|' + [seed % 3, burnt].join('|'), shape((G) => {
    const { w, h, d } = RA, hw = w / 2, zs = h - hw, I = WG.iron, R = rng(seed * 71 + burnt * 3 + 1);
    const hoop = (k) => { const a = Math.PI - (k / 12) * Math.PI; return [Math.cos(a) * hw, zs + Math.sin(a) * hw]; };
    for (const y of [-d / 2, d / 2]) {
      const P = []; for (const z of [0, 70, 140]) P.push([-hw, y, z]); for (let k = 0; k <= 12; k++) { const [x, z] = hoop(k); P.push([x, y, z]); } for (const z of [140, 70, 0]) P.push([hw, y, z]);
      G.tube(P, 3.2, I, { S: 6, M: 60, caps: 'flat' }); for (const x of [-hw, hw]) G.box(x, y, 1.5, 8, 8, 1.5, I);
    }
    for (const x of [-hw, hw]) for (const z of [60, 130, zs]) G.box(x, 0, z, 2.2, d / 2, 2.2, I);
    for (let k = 2; k <= 10; k += 2) { const [x, z] = hoop(k); G.box(x, 0, z, 2.2, d / 2, 2.2, I); }
    // the rose: a cane wound up each post and on round its hoop toward the crown
    for (const sx of [-1, 1]) for (const y of [-d / 2, d / 2]) {
      const ph = R() * 6, up = burnt ? 0.3 + R() * 0.35 : 1, nU = 9, kEnd = burnt ? 0 : 4 + Math.floor(R() * 3), P = [];
      for (let k = 0; k <= nU; k++) { const z = 4 + (k / nU) * (zs - 4) * up, a = ph + k * 1.25; P.push([sx * hw + Math.cos(a) * 4.6, y + Math.sin(a) * 4.6, z]); }
      for (let k = 1; k <= kEnd; k++) { const kk = sx < 0 ? k : 12 - k, [x, z] = hoop(kk), a = ph + (nU + k) * 1.25, nx = x / hw, nz = (z - zs) / hw; P.push([x + nx * Math.cos(a) * 4.6, y + Math.sin(a) * 4.6, z + nz * Math.cos(a) * 4.6]); }
      G.tube(P, (u) => (burnt ? 2.6 : 2.2) - u * 0.9, burnt ? WG.char : pick(WG.cane, Math.round(ph)), { S: 4, M: 12 + kEnd * 4 });
      if (burnt) continue;
      // shoots off the posts, outward of the walk, a withered rose on some
      for (const k of [4, 6, 8]) { const [px, py, pz] = P[k], tx = sx * (hw + 9), tz = pz + 10 + R() * 8; G.tube([[px, py, pz], [tx, py, tz]], 1.3, pick(WG.cane, k), { S: 3, M: 2 }); if (R() < 0.6) G.blob(tx, py, tz, 4.5, 4.5, 4.5, pick(WG.hip, k), { nu: 5, nv: 4 }); }
      // the dead heads hanging from it over the top
      for (let k = nU + 2; k < P.length; k++) { if (R() < 0.35) continue; const [px, py, pz] = P[k], L = 14 + R() * 14, qx = px + (R() - 0.5) * 6; G.tube([[px, py, pz], [qx, py, pz - L]], 1.1, pick(WG.cane, k), { S: 3, M: 2 }); G.blob(qx, py, pz - L - 3, 5.5, 5.5, 6, pick(WG.hip, k), { nu: 6, nv: 4 }); }
    }
  })];
}
// ---- a little round temple: two steps, eight columns, the ring over them, the dome and its finial
export const TEMPLE = { r: 400, h: 430 };
export function temple(seed = 1) {
  seed = N(seed);
  return ['wgtemple|' + (seed % 2), shape((G) => {
    const { r, h } = TEMPLE, M = WG.marble;
    G.lathe([[r + 90, 0], [r + 90, 15], [r + 50, 15], [r + 50, 30], [0, 30]], (k) => (k < 2 ? WG.stoneD : M[1]), 32);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; G.lathe([[34, 30], [34, 44], [26, 54], [24, 60], [20, h - 30], [28, h - 18], [34, h - 6], [34, h]], (k) => (k === 3 ? pick(M, i) : M[2]), 12, [Math.cos(a) * r, Math.sin(a) * r, 0]); }
    G.lathe([[r - 50, h], [r + 50, h], [r + 50, h + 40], [r + 60, h + 50], [r + 60, h + 62], [r - 50, h + 62], [r - 50, h]], (k) => pick(M, k), 32, [0, 0, 0], [1, 1], true);
    G.lathe([[r + 40, h + 62], [r + 20, h + 110], [r * 0.85, h + 200], [r * 0.6, h + 270], [r * 0.3, h + 310], [0, h + 320]], (k) => (k % 2 ? M[0] : M[1]), 32);
    G.lathe([[0, h + 62], [r - 50, h + 62]], WG.marbleD, 32);
    G.lathe([[20, h + 318], [12, h + 340], [18, h + 356], [0, h + 380]], WG.stoneD, 10);
  })];
}

// ---- the gardeners' things: a bed of dead flowers (or burnt), cold frames, the compost bins, the potting bench
export function deadBed(w = 600, d = 300, seed = 1, burnt = 0) {
  w = q(w, 20); d = q(d, 20); seed = N(seed);
  return ['wgbed|' + [w, d, seed % 4, burnt].join('|'), shape((G) => {
    const R = rng(seed * 37 + w + d);
    G.box(0, 0, 2, w / 2, d / 2, 2, burnt ? WG.char : WG.soil); G.box(0, 0, 4.2, w / 2 - 8, d / 2 - 8, 0.4, burnt ? WG.charL : WG.soilD);
    const n = Math.round((w * d) / 6000);
    for (let i = 0; i < n; i++) { const x = (R() - 0.5) * (w - 30), y = (R() - 0.5) * (d - 30), hh = burnt ? 8 + R() * 14 : 16 + R() * 18, lean = (R() - 0.5) * 12;
      G.tube([[x, y, 3], [x + lean, y + lean * 0.5, hh]], burnt ? 1.8 : 1.2, burnt ? WG.char : pick(WG.dead, i), { S: 3, M: 2 });
      if (!burnt && R() < 0.5) G.blob(x + lean, y + lean * 0.5, hh, 5, 5, 4, R() < 0.5 ? 0x4a3a34 : 0x5e4a40, { nu: 5, nv: 4 }); }
    if (burnt) for (let i = 0; i < 4; i++) G.box((R() - 0.5) * (w - 80), (R() - 0.5) * (d - 80), 4.8, 30 + R() * 30, 20 + R() * 20, 0.4, WG.ash);
  })];
}
export function coldFrame(len = 400, seed = 1) {
  len = q(len, 100); seed = N(seed);
  return ['wgframe|' + [len, seed % 2].join('|'), shape((G) => {
    const hl = len / 2, T = WG.timber; G.box(0, 50, 30, hl, 6, 30, T); G.box(0, -50, 18, hl, 6, 18, T); for (const s of [-1, 1]) G.box(s * (hl - 6), 0, 24, 6, 56, 24, WG.timberD);
    G.box(0, 0, 4, hl - 12, 44, 4, WG.soilD);
    for (let i = 0, n = Math.round(len / 100); i < n; i++) { const x = -hl + 50 + i * 100, open = (i + seed) % 3 === 1, m = G.n; G.box(0, 0, 0, 46, 54, 2, WG.timberD); G.box(0, 0, 1.6, 40, 48, 1, open ? WG.glassD : WG.glass); G.place(m, { x, z: open ? 70 : 38, roll: open ? -32 : -6, y: open ? 4 : 0 }); if (open) G.tube([[x, -50, 36], [x, -36, 74]], 1.6, WG.timberL, { S: 3 }); }
  })];
}
export function compostBins(n = 3, seed = 1) {
  seed = N(seed);
  return ['wgcomp|' + [n, seed % 2].join('|'), shape((G) => {
    const w = 140, hw = (n * w) / 2;
    for (let i = 0; i <= n; i++) G.box(-hw + i * w, 0, 50, 5, 60, 50, WG.timberD);
    for (let z = 10; z < 100; z += 18) { G.box(0, 58, z, hw, 3, 7, WG.timber); for (let i = 0; i <= n; i++) G.box(-hw + i * w, 0, z, 4, 58, 7, WG.timber); }
    for (let i = 0; i < n; i++) G.blob(-hw + (i + 0.5) * w, 0, 0, w / 2 - 12, 48, 50 + (i % 2) * 20, i === n - 1 ? 0x4a3e30 : WG.soilD, { nu: 10, nv: 6, warp: (x, y, z) => [x, y, Math.max(0, z)] });
  })];
}
export function pottingBench(len = 300, seed = 1) {
  len = q(len, 50); seed = N(seed);
  return ['wgpot|' + [len, seed % 3].join('|'), shape((G) => {
    const hl = len / 2, R = rng(seed * 9 + len);
    G.box(0, 0, 78, hl, 36, 4, WG.timber); G.box(0, 0, 30, hl - 10, 30, 3, WG.timberD); G.box(0, -34, 100, hl, 3, 22, WG.timberD);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.box(sx * (hl - 8), sy * 28, 38, 5, 5, 38, WG.timberD);
    const pot = (x, y, z, r) => G.lathe([[r * 0.7, 0], [r, r * 1.5], [r * 1.12, r * 1.55], [r * 1.12, r * 1.75], [r * 0.85, r * 1.75], [r * 0.85, r * 0.3], [0, r * 0.3]], (k) => (k === 2 ? WG.terraD : WG.terra), 10, [x, y, z]);
    for (let x = -hl + 30; x < hl - 20; x += 50 + R() * 30) pot(x, (R() - 0.5) * 30, 82, 12 + R() * 6);
    for (let x = -hl + 40; x < hl - 30; x += 70) for (let k = 0; k < 3; k++) pot(x, 0, 33 + k * 6, 14);
  })];
}
// ---- a clipped yew gone wild at its edges: kind 0 a cone, 1 a ball on a clipped stem, 2 three tiers of balls;
// burnt, black
export function topiary(h = 300, kind = 0, seed = 1, burnt = 0) {
  h = q(h, 10); seed = N(seed);
  return ['wgtopi|' + [h, kind, seed % 4, burnt].join('|'), shapeF((G) => {
    const col = (nx, ny, nz) => { const w = wob(nx * 6 + seed, ny * 6 + nz * 5); return burnt ? (nz > 0.5 && w > 0 ? WG.ash : w > 0.5 ? WG.charL : WG.char) : nz < -0.5 ? WG.hedgeD : w > 0.55 ? pick(WG.dead, seed) : w < -0.4 ? WG.hedge[3] : pick(WG.hedge, seed + Math.round(w * 2)); };
    const bump = (k) => (x, y, z) => { const n = wob(x * 0.06 + seed, y * 0.06 + z * 0.05); return [x * (1 + k * n), y * (1 + k * n), z]; };
    G.lathe([[30, 0], [30, 14], [0, 16]], 0x4a3a2c, 10);
    if (kind === 0) G.surf((u, v) => { const a = u * Math.PI * 2, r = (h * 0.32) * Math.pow(1 - v, 0.9) * (1 + 0.06 * wob(Math.cos(a) * 3 + seed, v * 6)), z = v * h; return [Math.cos(a) * r, Math.sin(a) * r, z]; }, 0, 1, 14, 0, 1, 10, (u, v) => col(Math.cos(u * 6.28), Math.sin(u * 6.28), v * 2 - 1), true);
    else if (kind === 1) { G.tube([[0, 0, 10], [0, 0, h * 0.5]], 8, WG.barkL, { S: 6 }); G.blob(0, 0, h * 0.5 + h * 0.18, h * 0.24, h * 0.24, h * 0.22, col, { nu: 14, nv: 10, warp: bump(0.08) }); G.blob(0, 0, 40, h * 0.16, h * 0.16, 34, col, { nu: 12, nv: 6, warp: (x, y, z) => [x, y, Math.max(z, -30)] }); }
    else { let z = 10; for (const r of [h * 0.2, h * 0.15, h * 0.1]) { G.blob(0, 0, z + r * 0.9, r, r, r * 0.9, col, { nu: 12, nv: 8, warp: bump(0.07) }); z += r * 1.75; } }
  })];
}
