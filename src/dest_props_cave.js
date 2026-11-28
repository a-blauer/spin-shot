// Sculpted pieces for the caves Under the Hill (Glimmer Caves first): crystals that glow out of the rock, stalagmites
// and the stalactites over them, the cascade into the lake, the gem-gatherers' gear. Same rules as dest_props.js: UE
// frame (X the front, Y right, Z up), [key, build] pairs, keys carry every number the shape depends on, things stand
// on z = 0 (or hang from it, for what grows down from the roof), every piece whole.
import { shapeB as shape, shapeF, wob } from './propkit.js';
import { dark, mix } from './village_shapes.js';
import { q, rng } from './dest_props.js';

export const GC = {   // the caves' colours
  rock: [0x5a586a, 0x625f72, 0x55526a, 0x6a6680], rockD: 0x3a3848, rockL: 0x7e7a90, floor: 0x4a4856, wet: 0x2c3040,
  violet: [0x9a72e0, 0xb894ff, 0x7e58c8], cyan: [0x5ac8e6, 0x8ae4fa, 0x3aa8c8], pale: 0xe6e0ff,
  shade: [0x4a2a5a, 0x5e3672, 0x38204a],
  water: 0x162636, waterL: 0x24405a, foam: 0xd8eaf4, timber: 0x7a5a3a, timberD: 0x5a4028, timberL: 0x8e6c48, iron: 0x2e3034, canvas: 0xb8a888,
};
const N = (s) => Math.abs(Math.round(s)) || 0;
const HUES = [GC.violet, GC.cyan, GC.shade];
export const CRB = (h) => Math.max(h * 0.26, 70 + h * 0.14);

// ---- a cluster of crystals out of a knob of rock: hexagonal points of several lengths, leaning out from the middle
// (CRB(h): the reach of its points at walking height, for its body),
// lighter at their tips. hue 0 violet, 1 the blue of the lake, 2 the Nightshade's (dark, gone bad). Its foot just under
// the floor; nothing stands on air.
export function crystal(h = 300, seed = 1, hue = 0) {
  seed = N(seed); h = q(h, 20);
  return ['gcryst2|' + [h, seed % 6, hue].join('|'), shapeF((G) => {
    const R = rng(seed * 41 + h), C = HUES[hue] || GC.violet, n = 4 + (seed % 3), br = h * 0.24;
    G.blob(0, 0, -br * 0.15, br, br * 0.85, br * 0.5, (nx, ny, nz) => (nz > 0.5 ? GC.rock[1] : GC.rock[seed % 4]), { nu: 9, nv: 5 });
    for (let i = 0; i < n; i++) {
      const main = i === 0, a = (i / n) * Math.PI * 2 + R() * 0.6, d = main ? 0 : br * (0.15 + R() * 0.25), L = main ? h : h * (0.35 + R() * 0.4), w = main ? h * 0.12 : L * (0.12 + R() * 0.05), tilt = main ? R() * 8 : 12 + R() * 14, b = G.n;   // leaning out no more than a body round it can hold
      G.lathe([[w * 0.8, -w * 1.2], [w, 0], [w, L * 0.78], [0, L]], (k) => (k < 1 ? C[2] : k < 2 ? C[0] : C[1]), 6);
      G.place(b, { x: Math.cos(a) * d, y: Math.sin(a) * d, z: br * 0.2, yaw: (a * 180) / Math.PI + R() * 30, pitch: tilt });
    }
  })];
}
// ---- crystals growing down out of the roof: a knob of rock (its top at z = 0, set into the roof) and points hanging
// from it
export function hangCrystal(len = 200, seed = 1, hue = 0) {
  seed = N(seed); len = q(len, 20);
  return ['ghcryst|' + [len, seed % 4, hue].join('|'), shapeF((G) => {
    const R = rng(seed * 13 + len), C = HUES[hue] || GC.violet, br = len * 0.3;
    G.blob(0, 0, br * 0.2, br, br * 0.9, br * 0.6, GC.rock[(seed + 1) % 4], { nu: 9, nv: 5 });
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + R(), d = i ? br * 0.45 : 0, L = i ? len * (0.4 + R() * 0.3) : len, w = L * 0.13, b = G.n;
      G.lathe([[w * 0.8, -w * 1.2], [w, 0], [w, L * 0.78], [0, L]], (k) => (k < 1 ? C[2] : k < 2 ? C[0] : C[1]), 6);
      G.place(b, { x: Math.cos(a) * d, y: Math.sin(a) * d, z: -br * 0.1, yaw: (a * 180) / Math.PI, pitch: 180 + (i ? 12 + R() * 14 : R() * 6) }); }
  })];
}
// ---- a stalagmite: drip-built rock rising to a blunt point, ringed where it grew in seasons, its foot spread on the
// floor. And a stalactite, the same hung from the roof (its root at z = 0, set into the roof, its point below).
export function stalagmite(h = 300, seed = 1) {
  seed = N(seed); h = q(h, 20);
  return ['gmite|' + [h, seed % 4].join('|'), shapeF((G) => {
    const R = rng(seed * 7 + h), r0 = h * 0.2, P = [[r0 * 1.5, -10], [r0 * 1.25, h * 0.04]];
    for (let k = 1; k <= 7; k++) { const t = k / 8; P.push([r0 * (1 - t * 0.82) * (1 + (k % 2 ? 0.08 : -0.04) * (1 + R())), h * t]); }
    P.push([r0 * 0.1, h * 0.97], [0, h]);
    G.lathe(P, (k) => (k < 2 ? GC.rockD : k % 3 === 0 ? GC.rockL : GC.rock[(k + seed) % 4]), 7, [0, 0, 0], [1, 0.85 + (seed % 3) * 0.06]);
  })];
}
export function stalactite(len = 200, seed = 1) {
  seed = N(seed); len = q(len, 20);
  return ['gtite|' + [len, seed % 4].join('|'), shapeF((G) => {
    const r0 = len * 0.16, P = [[0, -len], [r0 * 0.12, -len * 0.96]]; for (let k = 6; k >= 1; k--) { const t = k / 7; P.push([r0 * (1 - t * 0.8) * (k % 2 ? 1.06 : 0.96), -len * t]); }
    P.push([r0 * 1.3, 0], [r0 * 1.6, 40], [0, 50]);
    G.lathe(P, (k) => (k > P.length - 3 ? GC.rock[0] : k % 3 === 0 ? GC.rockL : GC.rock[(k + seed) % 4]), 7);
  })];
}
// ---- a column where a stalactite met the stalagmite under it: floor to roof (h), waisted where they joined
export function caveColumn(h = 1800, r = 90, seed = 1) {
  seed = N(seed); h = q(h, 50); r = q(r, 10);
  return ['gcol|' + [h, r, seed % 4].join('|'), shapeF((G) => {
    const P = [[r * 2.2, -20], [r * 1.6, h * 0.04]]; for (let k = 1; k < 12; k++) { const t = k / 12, waist = 0.42 + 0.58 * Math.abs(t - 0.55) / 0.55; P.push([r * waist * (k % 2 ? 1.07 : 0.96), h * t]); }
    P.push([r * 1.8, h * 0.97], [r * 2.4, h + 60], [0, h + 80]);
    G.lathe(P, (k) => (k < 2 || k > P.length - 3 ? GC.rockD : k % 3 === 0 ? GC.rockL : GC.rock[(k + seed) % 4]), 8);
  })];
}
// ---- the cascade: water falling down the rock from a lip h up into the lake, a sheet bellied out from the wall (the
// wall at x = 0, the water out toward +X), white where it breaks, foam heaped where it lands. w wide along Y.
export function cascade(h = 900, w = 160) {
  h = q(h, 50); w = q(w, 20);
  return ['gcascade|' + [h, w].join('|'), shape((G) => {
    const bands = 9; for (let i = 0; i < bands; i++) { const c = i % 3 === 0 ? GC.foam : i % 3 === 1 ? 0x9ac8e0 : 0xbcdcec;
      G.surf((u, v) => { const z = h * (1 - v), out = 18 + 60 * Math.sin(v * Math.PI * 0.5) ** 1.5, y = -w / 2 + ((i + u) / bands) * w * (1 + v * 0.25) - w * v * 0.125; return [out + Math.sin(u * 7 + i) * 3, y, z]; }, 0, 1, 1, 0, 1, 10, c); }
    G.blob(0, 0, h + 10, 40, w * 0.6, 26, GC.rock[1], { nu: 10, nv: 5 });   // the lip it pours over
    for (let i = 0; i < 6; i++) G.blob(70 + (i % 3) * 22, (i - 2.5) * w * 0.2, 6, 34, 28, 14 + (i % 2) * 6, GC.foam, { nu: 8, nv: 4 });
  })];
}
// ---- a sorting table for the stones: trestles, a board, the day's crystals in trays and a lamp
export function gemTable(w = 260) {
  w = q(w, 20);
  return ['ggemtable|' + w, shape((G) => {
    const hw = w / 2; G.box(0, 0, 82, 46, hw, 3, GC.timberL);
    for (const sy of [-1, 1]) { G.tube([[-36, sy * (hw - 24), -4], [0, sy * (hw - 24), 79]], 3, GC.timber, { S: 5 }); G.tube([[36, sy * (hw - 24), -4], [0, sy * (hw - 24), 79]], 3, GC.timber, { S: 5 }); }
    for (let i = 0; i < 3; i++) { const y = -hw + 50 + i * (w - 100) / 2; G.box(0, y, 88, 22, 30, 3, GC.timberD); for (let k = 0; k < 4; k++) { const b = G.n; G.lathe([[3, 0], [3.4, 9], [0, 14]], HUES[(i + k) % 2][k % 3], 6); G.place(b, { x: -12 + (k % 2) * 22, y: y - 14 + Math.floor(k / 2) * 26, z: 90, pitch: 70, yaw: k * 50 }); } }
    G.lathe([[9, 85], [9, 89], [7, 92], [7, 108], [9, 110], [3, 116], [0, 118]], (k) => (k === 3 ? 0xffd27a : 0x2e3034), 8, [26, hw - 30, 0]);
  })];
}
// ---- a crate of crystals packed in straw, its lid off and leant against it
export function crystalCrate(seed = 1, hue = 0) {
  seed = N(seed);
  return ['gccrate2|' + [seed % 3, hue].join('|'), shape((G) => {
    const W = 36, H = 52, c = [0x8a6a44, 0x7a5c3a, 0x96764c][seed % 3];
    G.box(0, 0, H / 2, W, W, H / 2, c); for (const z of [10, H - 8]) G.box(0, 0, z, W + 1, W + 1, 3, dark(c, 0.8));
    G.box(0, 0, H + 1, W - 3, W - 3, 1.5, 0xc8b06a);
    for (let k = 0; k < 6; k++) { const b = G.n; G.lathe([[4, -4], [4.5, 0], [4.5, 12], [0, 18]], HUES[hue][k % 3], 6); G.place(b, { x: -18 + (k % 3) * 18, y: -12 + Math.floor(k / 3) * 24, z: H + 2, pitch: 20 + k * 9, yaw: k * 70 }); }
    { const b = G.n; G.box(0, 0, 0, 2, W, H * 0.9 / 2, c); G.place(b, { x: W + 8, z: H * 0.43, pitch: -14 }); }   // its top against the crate
  })];
}
// ---- a boardwalk over the shallows: planks across two stringers on short posts driven into the lake bed, no rail
// (nothing to pin anything against); its deck one step up (FB.deck). L long along X, W wide.
export function boardwalk(L = 1400, W = 220) {
  L = q(L, 20); W = q(W, 10);
  return ['gboard|' + [L, W].join('|'), shape((G) => {
    const hl = L / 2, hw = W / 2, top = 16;
    for (const y of [-hw * 0.7, hw * 0.7]) G.box(0, y, top - 8, hl, 6, 5, GC.timberD);
    for (let x = -hl + 12; x < hl - 6; x += 24) G.box(x, 0, top - 2, 11, hw + ((x / 24) % 2) * 3, 2, Math.round(x / 24) % 3 ? GC.timberL : GC.timber);
    for (let x = -hl + 40; x <= hl - 39; x += (L - 80) / Math.max(1, Math.round(L / 260))) for (const y of [-hw * 0.7, hw * 0.7]) G.box(x, y, (top - 13) / 2 - 6, 6, 6, (top - 13) / 2 + 6, GC.timberD);
  })];
}
