// Sculpted pieces for the Vale's places after Bramble Farm (Cider Orchard first): pruned orchard trees and their fruit,
// the cider makers' press and horse mill, barrels and their racks, the cooper's work, a dovecote, the old wassail tree.
// Same rules as dest_props.js: UE frame (X the front, Y right, Z up, cm), [key, build] pairs, keys carry every number
// the shape depends on, things stand on z = 0, every piece whole: nothing hangs in the air or stops short of its hold.
import { shapeB as shape, wob } from './propkit.js';
import { dark, mix } from './village_shapes.js';
import { q, rng } from './dest_props.js';

export const VA = {   // the orchard's colours
  stone: [0xa49a88, 0x968c7a, 0xb0a692], stoneD: 0x7a7062, timber: 0x7a5a3a, timberD: 0x5a4028, timberL: 0x9a7650,
  tile: [0x9a4a32, 0x8a4230, 0xa65438], tileD: 0x6e3424, bark: 0x5e4a3a, barkD: 0x463628,
  leaf: [0x4e7e32, 0x5a8a3a, 0x46722e], apple: [0xc8342a, 0xb02a24, 0xd8503a], appleG: [0xa8b83a, 0xc8c04a, 0x98a832],
  straw: 0xd8c07a, strawD: 0xb89a58, pomace: 0x7a4e2a, pomaceD: 0x5a3820, iron: 0x3a3a40, brass: 0xc8a04a,
  ribbon: [0xc83a3a, 0xe8c04a, 0xf0e8d0, 0x4a7ac8], glass: 0xffd27a,
};
const N = (s) => Math.abs(Math.round(s)) || 0;
const deg = (r) => (r * 180) / Math.PI;
const barkC = (seed) => (t, a) => (Math.sin(a * 5 + t * 14 + seed) > 0.5 ? VA.barkD : VA.bark);

// ---- an orchard apple tree, pruned open in the middle: a short leaning trunk, three or four limbs out and up from its
// head, a crown of leaf masses round them (lower edge well over a gnome's head), apples hung on the undersides.
// crop: 0 none, 1 red, 2 green-gold. The trunk is all that stands in your way.
export function orchardTree(h = 560, seed = 1, crop = 1) {
  seed = N(seed); h = q(h, 20);
  return ['vaotree3|' + [h, seed % 5, crop].join('|'), shape((G) => {
    const R = rng(seed * 97 + h), tr = h * 0.05, th = h * 0.3, lx = (R() - 0.5) * tr * 1.6, ly = (R() - 0.5) * tr * 1.6, bc = barkC(seed);
    G.tube([[0, 0, -16], [lx * 0.4, ly * 0.4, th * 0.5], [lx, ly, th]], (t) => tr * (1.35 - 0.3 * t), bc, { S: 9, M: 6 });
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + R(); G.tube([[0, 0, h * 0.05], [Math.cos(a) * tr * 1.9, Math.sin(a) * tr * 1.9, 6], [Math.cos(a) * tr * 2.7, Math.sin(a) * tr * 2.7, -8]], (t) => tr * 0.42 * (1 - t * 0.6), bc, { S: 5, M: 3 }); }
    const nL = 3 + (seed % 2), lumps = [];
    for (let i = 0; i < nL; i++) { const a = (i / nL) * Math.PI * 2 + R() * 0.5, L = h * (0.3 + R() * 0.05), tip = [lx + Math.cos(a) * L, ly + Math.sin(a) * L, h * (0.6 + R() * 0.06)];
      G.tube([[lx, ly, th - 10], [lx + Math.cos(a) * L * 0.45, ly + Math.sin(a) * L * 0.45, th + (tip[2] - th) * 0.55], tip], (t) => tr * 0.62 * (1 - t * 0.6), bc, { S: 6, M: 5 });
      lumps.push([tip[0], tip[1], tip[2] + h * 0.04, h * (0.17 + R() * 0.03)]);
      const a2 = a + Math.PI / nL; lumps.push([lx + Math.cos(a2) * L * 0.85, ly + Math.sin(a2) * L * 0.85, h * (0.66 + R() * 0.05), h * 0.15]); }
    lumps.push([lx, ly, h * 0.8, h * 0.15]);
    const ww = (i, nx, ny, nz) => 1 + wob(nx * 3 + i, ny * 3 + nz * 2) * 0.12;
    lumps.forEach(([x, y, z, r], i) => { const lf = VA.leaf[i % 3], top = mix(lf, 0x8aba54, 0.3), under = dark(lf, 0.66);
      G.blob(x, y, z, r * 1.12, r * 1.12, r * 0.78, (nx, ny, nz) => (nz > 0.5 ? top : nz < -0.35 ? under : lf), { nu: 9, nv: 6, warp: (px, py, pz, nx, ny, nz) => { const w = ww(i, nx, ny, nz); return [px * w, py * w, pz * w]; } }); });
    // the apples: hung at the masses' own corners on their lower halves (between corners the faces sit inside the
    // curve, and an apple there would hang off nothing), half sunk in; never one inside a neighbouring mass
    if (crop) { const C = crop === 1 ? VA.apple : VA.appleG, inside = (px, py, pz, j) => lumps.some(([x2, y2, z2, r2], k) => { if (k === j) return false; const u = (px - x2) / (r2 * 1.12), v = (py - y2) / (r2 * 1.12), t = (pz - z2) / (r2 * 0.78), L = Math.hypot(u, v, t) || 1; return L < ww(k, u / L, v / L, t / L) + 0.3; });
      lumps.forEach(([x, y, z, r], i) => { const used = new Set(); for (let k = 0; k < 7; k++) { const ia = Math.floor(R() * 9), ie = 1 + Math.floor(R() * 3), key = ia * 10 + ie; if (used.has(key)) continue; used.add(key);
        const th = (ia / 9) * Math.PI * 2, ph = -Math.PI / 2 + (ie / 6) * Math.PI, cp = Math.cos(ph), nx = cp * Math.cos(th), ny = cp * Math.sin(th), nz = Math.sin(ph), w = ww(i, nx, ny, nz);
        const px = x + nx * r * 1.12 * w, py = y + ny * r * 1.12 * w, pz = z + nz * r * 0.78 * w; if (inside(px, py, pz, i)) continue; const s = 7 + R() * 1.8;
        G.blob(px - nx * s * 0.4, py - ny * s * 0.4, pz - nz * s * 0.4, s, s, s * 0.92, C[(i + k) % 3], { nu: 5, nv: 3 }); } }); }
  })];
}
export const orchardTrunk = (h) => q(h, 20) * 0.05 * 1.35;

// ---- windfalls: apples lying in the grass under a tree, a few gone brown
export function windfalls(r = 140, seed = 1, crop = 1) {
  seed = N(seed); r = q(r, 20);
  return ['vawind|' + [r, seed % 3, crop].join('|'), shape((G) => {
    const R = rng(seed * 13 + r), C = crop === 2 ? VA.appleG : VA.apple;
    for (let i = 0; i < 12; i++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()) * r, s = 4.5 + R() * 1.5; G.blob(Math.cos(a) * d, Math.sin(a) * d, s * 0.6, s, s, s * 0.9, i % 5 === 4 ? 0x6a4a2a : C[i % 3], { nu: 5, nv: 3 }); }
  })];
}

// ---- a crate of picked apples: a slatted crate heaped with them (stacks two high)
export const AC = { w: 70, d: 50, h: 46 };
export function appleCrate(seed = 1, crop = 1) {
  seed = N(seed);
  return ['vacrate|' + [seed % 3, crop].join('|'), shape((G) => {
    const { w, d, h } = AC, R = rng(seed * 7 + 3), C = crop === 2 ? VA.appleG : VA.apple, wd = seed % 2 ? VA.timberL : 0xb08a5a;
    G.box(0, 0, 3, w / 2, d / 2, 3, dark(wd, 0.85));
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.box(sx * (w / 2 - 3), sy * (d / 2 - 3), h / 2, 3, 3, h / 2, dark(wd, 0.8));
    for (const z of [12, 26, 40]) { for (const sy of [-1, 1]) G.box(0, sy * (d / 2 - 1), z, w / 2, 1.2, 5, wd); for (const sx of [-1, 1]) G.box(sx * (w / 2 - 1), 0, z, 1.2, d / 2, 5, wd); }
    G.box(0, 0, h - 8, w / 2 - 2, d / 2 - 2, 2, dark(wd, 0.7));
    for (let i = 0; i < 14; i++) { const x = (R() - 0.5) * (w - 14), y = (R() - 0.5) * (d - 14), s = 5.5 + R(); G.blob(x, y, h - 4 + R() * 4, s, s, s * 0.92, C[i % 3], { nu: 5, nv: 3 }); }
  })];
}

// ---- a barrel standing on end: bellied staves, iron hoops, its head with the bung
export function barrel(seed = 1) {
  seed = N(seed);
  return ['vabarrel|' + (seed % 3), shape((G) => {
    const h = 92, r0 = 31, rm = 36, rad = (t) => r0 + (rm - r0) * Math.sin(Math.PI * t), wd = [VA.timber, VA.timberL, 0x8a6440][seed % 3];
    G.tube([[0, 0, 0], [0, 0, h]], rad, (t, a) => (Math.floor((a / (Math.PI * 2)) * 16) % 2 ? wd : dark(wd, 0.86)), { S: 16, M: 6 });
    for (const t of [0.08, 0.3, 0.7, 0.92]) { const r = rad(t) + 1.4; G.lathe([[r, t * h - 2.5], [r, t * h + 2.5]], VA.iron, 16, [0, 0, 0], [1, 1], true); }
    G.lathe([[r0 - 3, h + 0.5], [0, h + 0.5]], dark(wd, 0.8), 16); G.lathe([[5, h + 0.6], [5, h + 2.4], [0, h + 2.4]], 0x4a3626, 8, [12, 0, 0]);
  })];
}
// ---- a rack of barrels lying on their sides: two long timbers on blocks, a row of n barrels across them, a row of n-1
// in the hollows on top. Along Y; the barrels' heads face +X and -X.
export function barrelRack(n = 4) {
  return ['vabrack|' + n, shape((G) => {
    const L = 100, r0 = 31, rm = 36, rad = (t) => r0 + (rm - r0) * Math.sin(Math.PI * t), pitch = 78, len = n * pitch + 40;
    for (const sx of [-1, 1]) { G.box(sx * 36, 0, 14, 7, len / 2, 6, VA.timberD); for (const y of [-len / 2 + 20, 0, len / 2 - 20]) G.box(sx * 36, y, 4, 9, 9, 4, VA.stoneD); }
    const one = (y, z, k) => { const b = G.n; G.tube([[0, 0, -L / 2], [0, 0, L / 2]], rad, (t, a) => (Math.floor((a / (Math.PI * 2)) * 16) % 2 ? VA.timber : dark(VA.timber, 0.86)), { S: 14, M: 5 });
      for (const t of [0.1, 0.9]) { const r = rad(t) + 1.4; G.lathe([[r, t * L - L / 2 - 2.5], [r, t * L - L / 2 + 2.5]], VA.iron, 14, [0, 0, 0], [1, 1], true); }
      G.place(b, { pitch: 90, y, z }); void k; };
    for (let i = 0; i < n; i++) one(-((n - 1) * pitch) / 2 + i * pitch, 20 + rm - 1, i);
    for (let i = 0; i < n - 1; i++) one(-((n - 2) * pitch) / 2 + i * pitch, 20 + rm - 1 + Math.sqrt(Math.max(0, (2 * rm) ** 2 - (pitch / 2) ** 2)) - 2, i);
  })];
}

// ---- the twin-screw cider press: a heavy bed on its sills with a lip and a spout to the tub, two great posts and the
// crosshead over them, two wooden screws down through it to the pressing board, the cheese of straw and pomace under
// it in layers, its straw ends sticking out. The spout faces +X.
export function ciderPress() {
  return ['vapress', shape((G) => {
    const T = VA.timber, TD = VA.timberD;
    for (const sy of [-1, 1]) G.box(0, sy * 110, 10, 150, 16, 10, TD);
    G.box(0, 0, 40, 135, 140, 20, T); for (const sx of [-1, 1]) G.box(sx * 129, 0, 64, 6, 140, 4, TD); for (const sy of [-1, 1]) G.box(0, sy * 134, 64, 135, 6, 4, TD);
    G.box(150, 0, 52, 18, 12, 6, TD); G.box(160, 0, 56, 10, 8, 3, VA.pomaceD);
    for (const sy of [-1, 1]) G.box(0, sy * 152, 230, 16, 16, 230, TD);
    G.box(0, 0, 440, 26, 172, 22, T);
    // the cheese: layers of pomace in straw, the straw ends out of each, slats between
    for (let k = 0; k < 8; k++) { const z = 62 + k * 18; G.box(0, 0, z + 6.5, 92, 82, 6.5, VA.pomace); G.box(0, 0, z + 15.5, 96, 86, 2.5, k % 2 ? VA.straw : VA.strawD);
      for (let j = 0; j < 6; j++) { const a = (j / 6) * Math.PI * 2 + k, b = G.n; G.box(0, 0, 0, 14, 3, 1.4, VA.straw); G.place(b, { x: Math.cos(a) * 98, y: Math.sin(a) * 88, z: z + 15.5, yaw: deg(a) }); } }
    G.box(0, 0, 213, 104, 94, 7, TD);
    // the screws: down through the crosshead to the board, a capstan block on each with its bar
    for (const sy of [-1, 1]) { const y = sy * 66; G.tube([[0, y, 215], [0, y, 470]], 9, T, { S: 10 });
      for (let z = 240; z < 418; z += 14) G.lathe([[9, z], [12.5, z + 5], [9, z + 10]], dark(T, 0.85), 10, [0, y, 0], [1, 1], true);
      G.box(0, y, 476, 16, 16, 12, TD); G.tube([[-58, y, 478], [58, y, 478]], 3.5, T, { S: 6 }); }
    // the tub under the spout
    G.lathe([[0, 0], [40, 0], [44, 46], [41, 46], [37, 3]], (k) => (k < 2 ? VA.timber : TD), 14, [196, 0, 0]);
    for (const z of [10, 36]) G.lathe([[40.5 + (z / 46) * 4, z - 2], [40.5 + (z / 46) * 4, z + 2]], VA.iron, 14, [196, 0, 0], [1, 1], true);
    G.lathe([[39, 30], [0, 30]], 0xc8862e, 14, [196, 0, 0]);
  })];
}
export const PRESS = { w: 330, d: 340, h: 490 };   // its body's size (x, y, z): the bed and posts, and the tub at +X

// ---- the press shed: six posts with knee braces, plates and ties, a gabled roof of tiles over it (ridge along Y),
// open on every side. w along X, d along Y; eave and ridge heights in SH.
export const SH = { eave: 400, ridge: 600, ov: 46 };
export function pressShed(w = 760, d = 860, mid = true) {
  w = q(w, 20); d = q(d, 20);
  return ['vashed|' + [w, d, mid ? 1 : 0].join('|'), shape((G) => {
    const { eave, ridge, ov } = SH, hw = w / 2, hd = d / 2, T = VA.timber, TD = VA.timberD, ys = [-hd, 0, hd], trusses = mid ? ys : [-hd, hd];
    for (const sx of [-1, 1]) for (const y of ys) { G.box(sx * hw, y, 6, 20, 20, 6, VA.stoneD); G.box(sx * hw, y, (12 + eave) / 2, 11, 11, (eave - 12) / 2, T);
      for (const dy of [-1, 1]) { if ((y === -hd && dy < 0) || (y === hd && dy > 0)) continue; G.tube([[sx * hw, y, eave - 110], [sx * hw, y + dy * 100, eave + 2]], 5, TD, { S: 4 }); } }
    for (const sx of [-1, 1]) G.box(sx * hw, 0, eave + 9, 12, hd + 30, 9, TD);
    for (const y of trusses) { G.box(0, y, eave + 9, hw + 12, 10, 9, TD); G.box(0, y, (eave + ridge) / 2 + 4, 8, 8, (ridge - eave) / 2 - 4, T); for (const sx of [-1, 1]) G.tube([[sx * (hw - 20), y, eave + 18], [0, y, ridge - 40]], 5, TD, { S: 4 }); }
    G.box(0, 0, ridge - 6, 10, hd + ov + 10, 8, TD);
    const rows = 9, slope = Math.atan2(ridge - eave, hw);
    for (const sx of [-1, 1]) { const xa = sx * (hw + ov), za = eave + 18 - ov * Math.tan(slope);
      G.surf((u, v) => { const x = xa * (1 - v), z = za + (ridge + 4 - za) * v, lift = ((v * rows) % 1) * 3; return [x + sx * lift * 0.5, -hd - ov + u * (d + ov * 2), z + lift]; }, 0, 1, 14, 0, 1, rows * 2, (u, v) => VA.tile[(Math.floor(v * rows) + Math.floor(u * 14)) % 3]);
      G.surf((u, v) => { const x = xa * (1 - v), z = za + (ridge + 4 - za) * v - 6; return [x, -hd - ov + (1 - u) * (d + ov * 2), z]; }, 0, 1, 2, 0, 1, 2, TD); }
    G.box(0, 0, ridge + 10, 14, hd + ov + 6, 8, VA.tileD);
  })];
}

// ---- the horse mill: a ring of stone (the chase) round a raised middle, crushed apples in its trough, the great stone
// wheel standing in the trough on its axle from the middle post, the axle running on out as the sweep for the pony
export const HM = { R: 300, wall: 72, wheel: 95, sweep: 560 };
export function horseMill() {
  return ['vahmill', shape((G) => {
    const { R, wall, wheel, sweep } = HM, floor = 34;
    G.lathe([[0, wall], [140, wall], [160, wall], [165, floor], [275, floor], [280, wall], [R, wall], [R + 6, 0]], (k) => (k === 3 || k === 4 ? VA.stoneD : VA.stone[k % 3]), 36);
    G.lathe([[166, floor + 1], [274, floor + 1]], VA.pomace, 36, [0, 0, 0], [1, 1], true);
    for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2 + 0.3, r = 185 + ((i * 37) % 70), s = 5 + (i % 3); G.blob(Math.cos(a) * r, Math.sin(a) * r, floor + 3, s, s, s * 0.8, i % 4 ? VA.pomace : VA.apple[i % 3], { nu: 5, nv: 3 }); }
    G.lathe([[34, wall], [30, 190], [36, 196], [36, 206], [0, 210]], (k) => (k < 2 ? VA.stone[1] : VA.iron), 12);
    // the wheel: standing in the trough on the axle out from the post's head, along +X
    const wz = floor + wheel, wx = 220;
    { const b = G.n; G.lathe([[0, -20], [wheel - 6, -20], [wheel, -14], [wheel, 14], [wheel - 6, 20], [0, 20]], (k) => (k === 2 ? VA.stoneD : VA.stone[2]), 22); G.lathe([[16, -22], [16, 22]], VA.iron, 10, [0, 0, 0], [1, 1], true); G.place(b, { pitch: 90, x: wx, z: wz }); }
    G.box((wx + 30) / 2, 0, wz, (wx - 30) / 2, 9, 9, VA.timberD);
    G.box((sweep + wx) / 2, 0, wz, (sweep - wx) / 2, 8, 8, VA.timber);
    G.box(sweep, 0, wz, 6, 46, 6, VA.timberD); for (const sy of [-1, 1]) G.box(sweep + 2, sy * 44, wz - 10, 3, 3, 12, VA.iron);
  })];
}

// ---- the cooper's work: staves stacked crosswise to season in a square chimney
export function staveStack(layers = 10) {
  return ['vastaves|' + layers, shape((G) => {
    for (let k = 0; k < layers; k++) { const z = 4 + k * 7, along = k % 2 === 0; for (const s of [-1, 1]) { if (along) G.box(0, s * 36, z, 46, 5, 3.6, k % 3 ? VA.timberL : 0xb08a5a); else G.box(s * 36, 0, z, 5, 46, 3.6, k % 3 ? VA.timberL : 0xb08a5a); } }
  })];
}
// ---- a barrel being raised: staves stood in a ring in the raising hoop, flared open at the top, over a cresset of
// glowing coals that steams them to bend
export function barrelRaising() {
  return ['vaRaise3', shape((G) => {
    G.lathe([[22, 0], [18, 18], [26, 30], [28, 34], [0, 34]], VA.iron, 10);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; G.tube([[Math.cos(a) * 18, Math.sin(a) * 18, 18], [Math.cos(a) * 28, Math.sin(a) * 28, 40]], 1.6, VA.iron, { S: 4 }); }
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, s = 8 + (i % 3) * 2; G.blob(Math.cos(a) * 12, Math.sin(a) * 12, 36, s, s, 5, i % 3 ? 0xff8a3a : 0xffc060, { nu: 5, nv: 3 }); }
    const n = 18; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, b = G.n;
      G.box(0, 0, 0, 2.2, 5.6, 46, i % 3 ? VA.timberL : 0xb08a5a); G.place(b, { x: Math.cos(a) * 40, y: Math.sin(a) * 40, z: 44.5, yaw: deg(a), pitch: 8 }); }
    for (const [z0, z1] of [[18, 26], [4, 10]]) { const zm = (z0 + z1) / 2, ro = 40 + (zm - 44.5) * Math.tan((8 * Math.PI) / 180) + 2.2; G.lathe([[ro - 1.5, z0], [ro + 1.2, z0], [ro + 1.2, z1], [ro - 1.5, z1], [ro - 1.5, z0]], VA.iron, 18, [0, 0, 0], [1, 1], true); }
  })];
}

// ---- the dovecote: a round tower of stone, a ledge round it, rows of dove holes each with its sill, a small door, a
// cone of tiles and the little lantern on its top where the birds come and go
export const DV = { r: 230, wall: 560, apex: 860 };
export function dovecote() {
  return ['vadove2', shape((G) => {
    const { r, wall, apex } = DV, S = VA.stone, wr = (z) => (z < 36 ? r + 14 : z < 120 ? r + 4 - (4 * (z - 36)) / 84 : r - (6 * (z - 120)) / (wall - 120));   // the wall's radius at height z
    G.lathe([[r + 14, -4], [r + 14, 30], [r + 4, 36], [r, 120], [r - 6, wall], [0, wall]], (k) => (k < 2 ? VA.stoneD : S[k % 3]), 32);
    for (let k = 0; k < 9; k++) { const z = 50 + k * 56, w0 = wr(z); G.lathe([[w0 - 1, z], [w0 + 0.6, z], [w0 + 0.6, z + 2], [w0 - 1, z + 2]], dark(S[1], 0.9), 32, [0, 0, 0], [1, 1], true); }
    G.lathe([[r - 4, 352], [r + 16, 352], [r + 16, 362], [r - 4, 362]], VA.stoneD, 32, [0, 0, 0], [1, 1], true);
    for (const [z, n, off] of [[400, 16, 0], [450, 16, 0.5], [500, 16, 0]]) for (let i = 0; i < n; i++) { const a = ((i + off) / n) * Math.PI * 2, rr = wr(z), b = G.n;
      G.box(0, 0, 0, 3, 9, 12, 0x1a1612); G.box(5, 0, -14, 6, 12, 2, VA.stoneD); G.place(b, { x: Math.cos(a) * (rr - 1), y: Math.sin(a) * (rr - 1), z, yaw: deg(a) }); }
    { const dz = 0; G.box(r + 2, 0, 110 + dz, 4, 44, 80, VA.timberD); G.box(r + 6, 30, 110, 2, 3, 3, VA.iron); G.box(r + 4, 0, 196, 6, 52, 6, VA.stoneD); }
    // the roof: courses of tiles in rings up to the lantern
    const ov = 40, z0 = wall - 10, zl = apex - 110;
    G.lathe([[r + ov, z0 - 14], [r + ov - 4, z0 - 4], [r * 0.55, z0 + (zl - z0) * 0.5], [46, zl]].concat([[46, zl], [0, zl]]), (k) => (k < 1 ? VA.tileD : VA.tile[k % 3]), 32);
    { const P = [[r + ov - 4, z0 - 4], [r * 0.55, z0 + (zl - z0) * 0.5], [46, zl]], rc = (z) => { const i = z < P[1][1] ? 0 : 1, [ra, za] = P[i], [rb, zb] = P[i + 1]; return ra + ((rb - ra) * (z - za)) / (zb - za); };   // the cone's radius at height z
      for (let k = 1; k < 8; k++) { const z = z0 - 4 + ((zl - z0 + 4) * k) / 8, rr = rc(z); G.lathe([[rr - 2, z - 2], [rr + 2, z - 2], [rr + 2, z + 1.5], [rr - 2, z + 1.5], [rr - 2, z - 2]], VA.tile[k % 3], 32, [0, 0, 0], [1, 1], true); } }
    G.lathe([[r + 2, wall - 2], [r + ov, z0 - 14], [r + ov - 2, z0 - 18], [r - 2, wall - 22]], VA.timberD, 32, [0, 0, 0], [1, 1], true);
    // the lantern: posts with gaps for the birds, a little cone on top, a finial
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; G.box(Math.cos(a) * 40, Math.sin(a) * 40, zl + 36, 5, 5, 36, VA.timberD); }
    G.lathe([[44, zl], [44, zl + 6], [0, zl + 6]], VA.timberD, 12);
    G.lathe([[56, zl + 70], [44, zl + 80], [0, apex]], (k) => (k ? VA.tile[1] : VA.tileD), 12);
    G.tube([[0, 0, apex - 6], [0, 0, apex + 40]], 2.5, VA.iron, { S: 5 }); G.blob(0, 0, apex + 44, 6, 6, 6, VA.brass, { nu: 6, nv: 4 });
  })];
}

// ---- the wassail tree: the oldest tree in the orchard, vast and twisted, a crown wider than the shed, its boughs hung
// with ribbons and lanterns from the wassailing, two balls of mistletoe in it. Its boughs are fixed (no chance in them)
// so the lanterns' places can be had outside the shape: wassailLamps(h).
const WB = (h) => [0, 1, 2, 3, 4].map((i) => { const a = (i / 5) * Math.PI * 2 + 0.4, L = h * (0.44 + 0.03 * ((i * 7) % 3)), tz = h * (0.52 + 0.04 * ((i * 3) % 3));
  return { a, L, pts: [[10, 6, 280], [Math.cos(a) * L * 0.4, Math.sin(a) * L * 0.4, 345 + (i % 2) * 20], [Math.cos(a) * L * 0.75, Math.sin(a) * L * 0.75, tz - 30], [Math.cos(a) * L, Math.sin(a) * L, tz]] }; });
const along = (P, u) => { const seg = []; let tot = 0; for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1], P[i][2] - P[i - 1][2]); seg.push(d); tot += d; }
  let s = u * tot; for (let i = 1; i < P.length; i++) { if (s <= seg[i - 1] || i === P.length - 1) { const t = Math.min(1, s / seg[i - 1]); return P[i - 1].map((v, k) => v + (P[i][k] - v) * t); } s -= seg[i - 1]; } return P[P.length - 1]; };
export const wassailLamps = (h = 980) => WB(q(h, 20)).slice(0, 4).map(({ pts }, i) => { const p = along(pts, 0.62 + (i % 2) * 0.1); return [p[0], p[1], p[2] - 70]; });
export function wassailTree(h = 980) {
  h = q(h, 20);
  return ['vawassail2|' + h, shape((G) => {
    const tr = 64, bc = barkC(3), boughs = WB(h);
    G.tube([[0, 0, -20], [24, -10, 90], [-16, 18, 200], [10, 6, 300]], (t) => tr * (1.4 - 0.45 * t), bc, { S: 14, M: 12 });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.3, L = tr * (2.4 + (i % 3) * 0.2); G.tube([[Math.cos(a) * tr * 0.5, Math.sin(a) * tr * 0.5, 70], [Math.cos(a) * L * 0.6, Math.sin(a) * L * 0.6, 14], [Math.cos(a) * L, Math.sin(a) * L, -12]], (t) => tr * 0.5 * (1 - t * 0.55), bc, { S: 7, M: 6, flat: () => [1, 0.75] }); }
    const lumps = [];
    boughs.forEach(({ a, L, pts }) => { G.tube(pts, (t) => tr * 0.62 * (1 - t * 0.6), bc, { S: 8, M: 10 }); const tip = pts[3]; lumps.push([tip[0], tip[1], tip[2] + h * 0.05, h * 0.2]); lumps.push([Math.cos(a + 0.6) * L * 0.7, Math.sin(a + 0.6) * L * 0.7, h * 0.6, h * 0.17]); });
    lumps.push([0, 0, h * 0.78, h * 0.24]);
    lumps.forEach(([x, y, z, r], i) => { const lf = VA.leaf[i % 3], top = mix(lf, 0x8aba54, 0.3), under = dark(lf, 0.64);
      G.blob(x, y, z, r * 1.1, r * 1.1, r * 0.72, (nx, ny, nz) => (nz > 0.5 ? top : nz < -0.35 ? under : lf), { nu: 11, nv: 7, warp: (px, py, pz, nx, ny, nz) => { const w = 1 + wob(nx * 3 + i, ny * 3 + nz * 2) * 0.12; return [px * w, py * w, pz * w]; } }); });
    // mistletoe: two round tufts on boughs, under the crown
    for (const k of [1, 3]) { const p = along(boughs[k].pts, 0.5); G.blob(p[0], p[1], p[2] + 6, 30, 30, 26, 0x8aa84a, { nu: 8, nv: 6, warp: (px, py, pz, nx, ny) => { const w = 1 + wob(nx * 6, ny * 6) * 0.25; return [px * w, py * w, pz * w]; } }); }
    // ribbons tied on the boughs, hanging
    boughs.forEach(({ pts }, i) => { for (const u of [0.42, 0.56, 0.8]) { const [x, y, z] = along(pts, u), len = 50 + ((i * 3 + Math.round(u * 10)) % 4) * 16;
      G.surf((s2, v) => [x + Math.sin(v * 4 + i) * 4 * v, y + (s2 - 0.5) * 7, z + 4 - v * (len + 4)], 0, 1, 1, 0, 1, 5, VA.ribbon[(i + Math.round(u * 10)) % 4]); } });
    // the lanterns, each on a cord from its bough
    boughs.slice(0, 4).forEach(({ pts }, i) => { const p = along(pts, 0.62 + (i % 2) * 0.1), [x, y] = p, z = p[2] - 70;
      G.tube([[x, y, p[2] + 2], [x, y, z + 8]], 0.8, VA.iron, { S: 3 }); G.lathe([[0, z - 14], [7, z - 12], [8, z + 4], [5, z + 8], [0, z + 9]], VA.iron, 8, [x, y, 0]); G.blob(x, y, z - 3, 5.5, 5.5, 8, VA.glass, { nu: 6, nv: 4 }); });
  })];
}
export const WASSAIL_TR = 64 * 1.4;

// ---- a heap of pressed pomace thrown out by the press, the straw through it
export function pomaceHeap(r = 160, seed = 1) {
  seed = N(seed); r = q(r, 10);
  return ['vapomace|' + [r, seed % 3].join('|'), shape((G) => {
    G.blob(0, 0, 0, r, r * 0.85, r * 0.42, (nx, ny, nz) => (wob(nx * 7 + seed, ny * 7) > 0.55 ? VA.strawD : nz > 0.6 ? VA.pomace : VA.pomaceD), { nu: 14, nv: 6, warp: (x, y, z) => [x, y, Math.max(z, -3)] });
  })];
}

// ---- a two-wheeled cart: a boarded bed on its axle, the shafts down on the ground in front (+X); load 1 heaped with
// apples, load 2 with two barrels lying in it
export function orchardCart(load = 1) {
  return ['vacart|' + load, shape((G) => {
    const T = VA.timber, TD = VA.timberD, wr = 58, side = 76, bz = wr + 10;
    for (const sy of [-1, 1]) { const b = G.n;
      G.lathe([[wr, -4], [wr, 4], [wr - 8, 4], [wr - 8, -4], [wr, -4]], TD, 16, [0, 0, 0], [1, 1], true); G.lathe([[10, -12], [10, 12]], VA.iron, 10);
      for (let k = 0; k < 8; k++) { const c = G.n; G.box((wr - 4 + 10) / 2, 0, 0, (wr - 4 - 10) / 2, 2.5, 3, T); G.place(c, { yaw: (k / 8) * 360 }); }
      G.lathe([[wr + 1.5, -4.5], [wr + 1.5, 4.5]], VA.iron, 16, [0, 0, 0], [1, 1], true); G.place(b, { roll: 90, y: sy * side, z: wr }); }
    G.box(0, 0, wr, 4, side + 14, 4, VA.iron);
    G.box(0, 0, bz + 4, 110, 62, 4, TD);
    for (const sy of [-1, 1]) G.box(0, sy * 60, bz + 30, 110, 3, 22, T); for (const sx of [-1, 1]) G.box(sx * 108, 0, bz + 30, 3, 60, 22, T);
    for (const sy of [-1, 1]) G.tube([[100, sy * 46, bz + 2], [260, sy * 40, 40], [380, sy * 36, 4.5]], 4.5, T, { S: 6 });
    G.box(300, 0, 26, 3, 40, 3, T);
    if (load === 1) { G.blob(0, 0, bz + 20, 104, 56, 30, VA.apple[1], { nu: 10, nv: 5 }); for (let i = 0; i < 40; i++) { const x = -96 + ((i * 37) % 192), y = -48 + ((i * 53) % 96), d = Math.hypot(x / 104, y / 56), z = bz + 20 + 30 * Math.sqrt(Math.max(0, 1 - d * d)); if (d > 0.95) continue; G.blob(x, y, z, 7.5, 7.5, 7, VA.apple[i % 3], { nu: 5, nv: 3 }); } }
    if (load === 2) for (const x of [-54, 54]) { const b = G.n; G.tube([[0, 0, -48], [0, 0, 48]], (t) => 31 + 5 * Math.sin(Math.PI * t), (t, a) => (Math.floor((a / (Math.PI * 2)) * 16) % 2 ? T : dark(T, 0.86)), { S: 14, M: 5 }); G.place(b, { roll: 90, x, z: bz + 8 + 36 }); }
  })];
}
