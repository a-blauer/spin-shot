// Sculpted pieces for Millbrook, in the Vale: the watermill and its wheel, the race and the weir, the bridge's
// cutwaters, the granary on its staddle stones, the bakery's oven, the smithy, the maypole, stooks in the stubble.
// Same rules as dest_props.js: UE frame (X the front, Y right, Z up), [key, build] pairs, keys carry every number the
// shape depends on, things stand on z = 0, every piece whole.
import { shapeB as shape, shapeF } from './propkit.js';
import { dark, mix } from './village_shapes.js';
import { q, rng } from './dest_props.js';

export const MB = {   // the village's colours: warm grey stone, cream boards, red-brown tiles, dark oak
  stone: [0xa49d90, 0x968e80, 0xb0a898, 0x8a8274], stoneD: 0x7a746a, board: 0xe8dcc0, boardD: 0xcfc2a4, wood: 0x8a5a34, woodD: 0x5a3a22,
  tile: [0x9a5a3a, 0x8a4e32, 0xa86644], tileD: 0x6e3a26, wet: 0x4a3a2a, slime: 0x4e6a3a, iron: 0x3a3a40, foam: 0xe8eef0, water: 0x4a7a8a,
  straw: 0xd8b062, strawD: 0xa8823e, brick: [0xa8583a, 0x9a4e34, 0xb4643e], ribbon: [0xc8392e, 0xf6c43a, 0x4a7ab8, 0xe8e0d0],
};
const N = (s) => Math.abs(Math.round(s)) || 0;
const deg = (r) => (r * 180) / Math.PI;
const pick = (a, i) => a[((i % a.length) + a.length) % a.length];

// coursed stone over a rectangle face: blocks in running bond along X from x0 to x1 (at y, t thick, facing ±Y), z0 to
// z1, leaving the openings [xa, xb, za, zb] clear. For walls drawn inside a building's shape.
export const courses = (G, x0, x1, y, t, z0, z1, holes = [], co = 38, bl = 76, cols = MB.stone, seed = 0) => {
  for (let k = 0, z = z0; z < z1 - 1; k++, z += co) { const zt = Math.min(z1, z + co), zm = (z + zt) / 2, cuts = holes.filter(([, , za, zb]) => zm > za && zm < zb).sort((a, b) => a[0] - b[0]), solid = []; let p = x0;
    for (const [a, b] of cuts) { if (a > p) solid.push([p, Math.min(a, x1)]); p = Math.max(p, b); } if (p < x1) solid.push([p, x1]);
    for (const [i0, i1] of solid) for (let s = x0 - (k % 2 ? bl / 2 : 0); s < i1; s += bl) { const a = Math.max(i0, s), b = Math.min(i1, s + bl); if (b - a < 5) continue; G.box((a + b) / 2, y, (z + zt) / 2, (b - a) / 2 - 0.6, t / 2, (zt - z) / 2 - 0.5, k === 0 ? MB.stoneD : pick(cols, k * 3 + Math.round(a / bl) + seed)); } } };
// the same along Y (a wall at x running from y0 to y1)
export const coursesY = (G, y0, y1, x, t, z0, z1, holes = [], co = 38, bl = 76, cols = MB.stone, seed = 0) => { const b = G.n; courses(G, y0, y1, 0, t, z0, z1, holes, co, bl, cols, seed); G.map(b, ([px, py, pz]) => [x - py, px, pz]); };
// a pitched roof of tiles over a box: ridge along X, eaves at ze, ridge at zr, half-widths hw (to the eaves' edge,
// over the walls by ov) and hd along X; tiles in rows, the ridge capped
export const tileRoof = (G, hl, hw, ze, zr, seed = 0, cols = MB.tile) => {
  const run = hw, rise = zr - ze, L = Math.hypot(run, rise), ang = Math.atan2(rise, run), rows = Math.max(3, Math.round(L / 34));
  for (const sd of [-1, 1]) for (let i = 0; i < rows; i++) { const t = (i + 0.5) / rows, y = sd * run * (1 - t), z = ze + rise * t, b = G.n;
    G.box(0, 0, 0, hl, L / rows / 2 + 1.5, 5, pick(cols, i + (sd > 0 ? 1 : 0) + seed)); G.place(b, { y, z: z + 2, roll: -sd * deg(ang) }); }
  G.box(0, 0, zr + 2, hl + 4, 12, 8, MB.tileD);
};

// ---- the watermill: a stone ground floor, a weatherboarded floor over it, a steep roof of red tiles, the lucam (the
// hoist's hood) out over the yard door on the north side with its beam and chain; the wheel's axle comes out of the
// south wall. 950 along X, 680 deep; the yard (north) is +Y. The east end's door burst off its hinges (the Blight
// came up through the floor).
export const MILL = { w: 950, d: 680, g: 380, e: 660, r: 1010, axleZ: 380 };
export function millHouse(seed = 1) {
  seed = N(seed);
  return ['mbmill2|' + (seed % 3), shapeF((G) => {
    const { w, d, g, e, r } = MILL, hw = w / 2, hd = d / 2, t = 70;
    // the stone ground floor: four walls of coursed stone; the yard door, the east door (gone), small windows
    courses(G, -hw, hw, hd - t / 2, t, 0, g, [[-150, 150, 0, 300], [-380, -290, 120, 220], [290, 380, 120, 220]], 38, 76, MB.stone, seed);
    courses(G, -hw, hw, -hd + t / 2, t, 0, g, [[-340, -250, 120, 220], [250, 340, 120, 220]], 38, 76, MB.stone, seed + 1);
    coursesY(G, -hd + t, hd - t, hw - t / 2, t, 0, g, [[-110, 110, 0, 280]], 38, 76, MB.stone, seed + 2);
    coursesY(G, -hd + t, hd - t, -hw + t / 2, t, 0, g, [[-60, 60, 120, 220]], 38, 76, MB.stone, seed + 3);
    G.box(0, 0, g - 3, hw, hd, 3, MB.stoneD);   // the floor's beam course: closes the top of the stone
    // the dark inside, behind the doorways and the windows
    const DK = 0x16130f; G.box(0, hd - t / 2, 150, 150, 2, 150, DK); G.box(hw - t / 2, 0, 140, 2, 110, 140, DK); for (const x of [-335, 335]) G.box(x, hd - t / 2, 170, 45, 2, 50, DK); for (const x of [-295, 295]) G.box(x, -hd + t / 2, 170, 45, 2, 50, DK); G.box(-hw + t / 2, 0, 170, 2, 60, 50, DK);
    // the boarded floor: boards round all four sides, corner posts, the loading door under the lucam, windows
    const bz = (z0, z1, sx, sy, len, nx) => { for (let z = z0, i = 0; z < z1 - 1; z += 24, i++) { const zt = Math.min(z1, z + 24); if (nx) G.box(sx, sy, (z + zt) / 2, 3, len, (zt - z) / 2 + 0.5, i % 2 ? MB.board : MB.boardD); else G.box(sx, sy, (z + zt) / 2, len, 3, (zt - z) / 2 + 0.5, i % 2 ? MB.board : MB.boardD); } };
    for (const sy of [-1, 1]) bz(g, e, 0, sy * (hd + 3), hw + 3, false);
    for (const sx of [-1, 1]) bz(g, e, sx * (hw + 3), 0, hd + 3, true);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.box(sx * (hw + 3), sy * (hd + 3), (g + e) / 2, 9, 9, (e - g) / 2, MB.woodD);
    G.box(0, hd + 7, g + 140, 80, 4, 110, MB.woodD); G.box(0, hd + 9, g + 140, 70, 3, 100, MB.wood);
    for (const [x, y] of [[-300, -hd - 7], [300, -hd - 7], [-300, hd + 7], [300, hd + 7]]) { G.box(x, y, g + 150, 38, 4, 38, MB.woodD); G.box(x, y + Math.sign(y) * 1.5, g + 150, 30, 3, 30, 0x2e3438); }
    for (const sx of [-1, 1]) { G.box(sx * (hw + 7), 0, g + 150, 4, 38, 38, MB.woodD); G.box(sx * (hw + 8.5), 0, g + 150, 3, 30, 30, 0x2e3438); }
    // the gable ends, boarded up to the ridge
    for (const sx of [-1, 1]) for (let z = e, i = 0; z < r - 4; z += 24, i++) { const half = (hd + 20) * (1 - (z + 12 - e) / (r - e)); if (half < 6) break; G.box(sx * (hw + 3), 0, z + 12, 3, half, 12.5, i % 2 ? MB.board : MB.boardD); }
    tileRoof(G, hw + 40, hd + 40, e - 6, r, seed);
    // the lucam: a gabled hood of boards out over the yard door, on the roof's north slope, its hoist beam and chain
    { const ly = hd + 70, lz = e - 40; G.box(0, hd + 20, lz + 110, 90, 70, 110, MB.boardD); G.box(0, ly, lz + 2, 92, 22, 4, MB.woodD);
      for (const sx of [-1, 1]) G.box(sx * 92, hd + 30, lz + 110, 4, 62, 112, MB.woodD);
      const b = G.n; tileRoof(G, 80, 112, lz + 220, lz + 300, seed + 1); G.place(b, { yaw: 90, y: hd + 10 });
      for (let z = lz + 220, i = 0; z < lz + 296; z += 16, i++) G.box(0, hd + 87, z + 8, 112 * (1 - (z + 8 - lz - 220) / 80) + 2, 3, 8.5, i % 2 ? MB.board : MB.boardD);   // its gable, up under the tiles
      G.box(0, hd + 110, lz + 190, 8, 60, 8, MB.woodD); G.tube([[0, hd + 160, lz + 182], [0, hd + 160, lz + 40]], 2.5, MB.iron, { S: 5, M: 6 }); G.blob(0, hd + 160, lz + 34, 7, 7, 7, MB.iron, { nu: 6, nv: 4 }); }
    // the yard doors, folded back against the wall; the axle's bearing block on the south wall
    for (const sx of [-1, 1]) { G.box(sx * 220, hd + 8, 150, 70, 5, 150, MB.wood); for (const z of [60, 240]) G.box(sx * 220, hd + 14, z, 64, 2, 5, MB.iron); }
    G.box(0, -hd - 10, MILL.axleZ, 46, 10, 46, MB.stoneD);
    // the east door, off its hinges and lying against the wall's foot
    { const b = G.n; G.box(0, 0, 0, 4, 100, 140, MB.wood); G.place(b, { x: hw + 30, y: 40, z: 136, pitch: -12 }); }
  })];
}
// ---- the mill's wheel: two rims on spokes, paddles between them, its hub and the axle running into the wall (+Y);
// green and black where it dips. r its radius, wd its width; centred on its axle.
export function millWheel(r = 380, wd = 150, axle = 160) {
  r = q(r, 10); wd = q(wd, 10);
  return ['mbwheel|' + [r, wd, axle].join('|'), shape((G) => {
    for (const s of [-1, 1]) { const pts = []; for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2; pts.push([Math.cos(a) * r, s * wd / 2, Math.sin(a) * r]); } G.tube(pts, 8, (t) => (Math.sin(t * Math.PI * 2) < -0.6 ? MB.slime : MB.woodD), { S: 6, M: 80, caps: false });
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.15; G.tube([[0, s * wd / 2, 0], [Math.cos(a) * (r - 4), s * wd / 2, Math.sin(a) * (r - 4)]], 6, MB.wood, { S: 6 }); } }
    for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2, b = G.n, low = Math.sin(a) < -0.55; G.box(0, 0, 0, 34, wd / 2 + 6, 4, low ? MB.wet : dark(MB.wood, 0.92)); G.place(b, { x: Math.cos(a) * (r - 26), z: Math.sin(a) * (r - 26), pitch: -deg(a) }); }
    { const b = G.n; G.lathe([[40, -wd / 2 - 14], [46, -wd / 2], [46, wd / 2], [40, wd / 2 + 14]], MB.iron, 14); G.map(b, ([x, y, z]) => [x, z, y]); }
    G.tube([[0, -wd / 2 - 20, 0], [0, wd / 2 + axle, 0]], 16, MB.woodD, { S: 10 });
  })];
}
// ---- a race's kerb: two lines of dressed stones along X, the channel w wide between them (the water is the map's)
export function raceKerb(len = 1000, w = 180) {
  len = q(len, 20); w = q(w, 10);
  return ['mbrace|' + [len, w].join('|'), shapeF((G) => { for (const sy of [-1, 1]) for (let x = -len / 2, i = 0; x < len / 2 - 1; x += 70, i++) { const e = Math.min(len / 2, x + 70); G.box((x + e) / 2, sy * (w / 2 + 22), 13, (e - x) / 2 - 0.6, 22, 13, pick(MB.stone, i + (sy > 0 ? 2 : 0))); } })];
}
// ---- the weir: a long sill of stone across the stream (along Y), the water white where it falls over its +X side
export function weir(len = 500) {
  len = q(len, 20);
  return ['mbweir|' + len, shapeF((G) => { for (let y = -len / 2, i = 0; y < len / 2 - 1; y += 60, i++) { const e = Math.min(len / 2, y + 60); G.box(0, (y + e) / 2, 15, 34, (e - y) / 2 - 0.6, 15, pick(MB.stone, i)); G.box(46, (y + e) / 2, 6, 12, (e - y) / 2 - 0.6, 6, MB.foam); G.box(72, (y + e) / 2, 3.2, 16, (e - y) / 2 - 2, 1.4, mix(MB.foam, MB.water, 0.45)); } })];
}
// ---- the sluice at the race's head: two posts in the kerbs, a beam across, the gate board and its rack and wheel
export function sluice(w = 180) {
  w = q(w, 10);
  return ['mbsluice|' + w, shape((G) => { const hw = w / 2 + 22;
    for (const sy of [-1, 1]) G.box(0, sy * hw, 130, 10, 10, 130, MB.woodD);
    G.box(0, 0, 250, 12, hw + 10, 10, MB.woodD); G.box(0, 0, 90, 5, w / 2 + 4, 70, MB.wood); G.box(0, 0, 175, 4, 6, 78, MB.iron);
    const b = G.n; G.lathe([[22, -3], [22, 3]], MB.iron, 12); G.place(b, { z: 274, y: 0, roll: 90 }); })];
}
// ---- a bridge pier's cutwater: a pointed nose of coursed stone along X (its point at +X), w wide, h high, its
// coping following it to the point
export function cutwater(len = 180, w = 160, h = 90) {
  len = q(len, 10); w = q(w, 10); h = q(h, 10);
  return ['mbcut2|' + [len, w, h].join('|'), shapeF((G) => { const n = 8; for (let z = 0, k = 0; z < h - 1; z += 30, k++) { const zt = Math.min(h, z + 30); for (let i = 0; i < n; i++) { const u0 = (i / n) * len, u1 = ((i + 1) / n) * len, hw = (w / 2) * (1 - (u0 + u1) / 2 / len) + 3; G.box((u0 + u1) / 2, 0, (z + zt) / 2, (u1 - u0) / 2 + 0.5, hw, (zt - z) / 2 - 0.5, pick(MB.stone, Math.floor(i / 2) + k)); } }
    for (let i = 0; i < n; i++) { const u0 = (i / n) * len, u1 = ((i + 1) / n) * len, hw = (w / 2) * (1 - (u0 + u1) / 2 / len) + 9; G.box((u0 + u1) / 2, 0, h + 5, (u1 - u0) / 2 + 0.5, hw, 5, MB.stoneD); } })];
}
// ---- the granary: a little boarded store raised on staddle stones (a gnome's mushrooms of stone, so the rats cannot
// climb), a pyramid roof of tiles, its door at the top of three wooden steps that stop short of it
export const GRAN = { w: 360, floor: 90, e: 380, top: 600 };
export function granary(seed = 1) {
  seed = N(seed);
  return ['mbgranary|' + (seed % 2), shape((G) => {
    const { w, floor: fz, e, top } = GRAN, hw = w / 2;
    for (const x of [-hw + 30, 0, hw - 30]) for (const y of [-hw + 30, 0, hw - 30]) { G.lathe([[18, 0], [14, 20], [10, fz - 26]], MB.stone[1], 10, [x, y, 0]); G.lathe([[8, fz - 28], [34, fz - 22], [36, fz - 16], [10, fz - 14]], MB.stone[2], 12, [x, y, 0]); }
    G.box(0, 0, fz - 7, hw + 6, hw + 6, 7, MB.woodD);
    for (let z = fz, i = 0; z < e - 1; z += 24, i++) { const zt = Math.min(e, z + 24); for (const sy of [-1, 1]) G.box(0, sy * (hw - 3), (z + zt) / 2, hw, 3, (zt - z) / 2 + 0.5, i % 2 ? MB.board : MB.boardD); for (const sx of [-1, 1]) if (!(sx > 0 && z < fz + 230 && z + 24 > fz)) G.box(sx * (hw - 3), 0, (z + zt) / 2, 3, hw - 6, (zt - z) / 2 + 0.5, i % 2 ? MB.board : MB.boardD); else { G.box(hw - 3, -hw / 2 - 20, (z + zt) / 2, 3, hw / 2 - 26, (zt - z) / 2 + 0.5, i % 2 ? MB.board : MB.boardD); G.box(hw - 3, hw / 2 + 20, (z + zt) / 2, 3, hw / 2 - 26, (zt - z) / 2 + 0.5, i % 2 ? MB.board : MB.boardD); } }
    G.box(hw, 0, fz + 115, 4, 44, 115, MB.wood); G.box(hw + 3, 30, fz + 110, 3, 4, 4, MB.iron);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.box(sx * (hw - 3), sy * (hw - 3), (fz + e) / 2, 8, 8, (e - fz) / 2, MB.woodD);
    // the pyramid roof: rings of tiles stepping in to its peak, a finial
    const rings = 7; for (let i = 0; i < rings; i++) { const t0 = i / rings, t1 = (i + 1) / rings, r0 = (hw + 36) * (1 - t0), r1 = (hw + 36) * (1 - t1), z0 = e + (top - e) * t0, z1 = e + (top - e) * t1, c = pick(MB.tile, i + seed);
      G.lathe([[r0 * 1.414, z0 - 6], [r1 * 1.414, z1 - 4], [r1 * 1.414 - 6, z1 - 4]], c, 4, [0, 0, 0], [1, 1], false); }
    G.lathe([[10, top - 10], [6, top + 30], [0, top + 40]], MB.woodD, 6);
    // the steps, standing on the ground a hand short of the door
    for (let i = 0; i < 3; i++) G.box(hw + 46 + (2 - i) * 22 + 22, 0, 12 + i * 24, 11 + 0 * i, 40, 12 + i * 24, MB.wood);
  })];
}
// ---- the bakery's oven: a dome of brick against the house's end wall (at x = 0, the dome out to +X), its mouth and a
// chimney up the wall
export function breadOven() {
  return ['mboven', shapeF((G) => {
    G.box(70, 0, 40, 74, 90, 40, MB.stone[1]);
    G.blob(70, 0, 80, 70, 84, 80, (nx, ny, nz) => pick(MB.brick, Math.round((nx + ny * 2 + nz * 3) * 3)), { nu: 14, nv: 8 });
    G.box(141, 0, 78, 4, 26, 22, 0x1e1a18); G.box(144, 0, 104, 6, 34, 5, MB.stoneD);
    for (let z = 0; z < 720; z += 40) G.box(18, 0, z + 20, 18, 40, 19.5, pick(MB.brick, z / 40));
    G.box(18, 0, 726, 22, 44, 6, MB.stoneD);
  })];
}
// ---- the smithy: an open shed on four posts under a tiled roof (ridge along Y), the forge's hearth of stone at the
// back with its hood and tall chimney, the bellows beside it on their frame, tongs and shoes on the post
export const SMITHY = { w: 520, d: 440, e: 300, r: 470 };
export function smithy(seed = 1) {
  seed = N(seed);
  return ['mbsmithy|' + (seed % 2), shape((G) => {
    const { w, d, e, r } = SMITHY, hw = w / 2, hd = d / 2;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.box(sx * (hw - 10), sy * (hd - 10), e / 2, 10, 10, e / 2, MB.woodD);
    for (const sx of [-1, 1]) G.box(sx * (hw - 10), 0, e - 8, 10, hd + 10, 10, MB.woodD);
    for (const sy of [-1, 1]) G.box(0, sy * (hd - 10), e - 8, hw + 10, 10, 10, MB.woodD);
    { const b = G.n; tileRoof(G, hd + 30, hw + 30, e, r, seed); G.place(b, { yaw: 90 }); }
    // the hearth at the back (-X): a stone block, a hood over it, the chimney through the roof
    { const b = G.n; courses(G, -110, 110, 0, 140, 0, 90, [], 30, 55, MB.stone, seed); G.map(b, ([x, y, z]) => [-hw + 80 + y, x, z]); }
    G.box(-hw + 80, 0, 92, 70, 110, 4, 0x2e2a28); G.blob(-hw + 80, 0, 100, 40, 50, 8, 0x1a1614, { nu: 8, nv: 4 }); G.blob(-hw + 84, 10, 104, 12, 12, 6, 0xff7a2a, { nu: 6, nv: 3 });
    { const b = G.n; courses(G, -60, 60, 0, 70, 230, r + 220, [], 34, 40, MB.brick, seed); G.map(b, ([x, y, z]) => [-hw + 80 + y, x, z]); }
    for (let i = 0; i < 4; i++) G.box(-hw + 80, 0, 92 + 35 * i + 17.5, 70 - 8 * i, 110 - 15 * i, 18, MB.stone[(i + 1) % 4]);
    // the bellows on a frame beside the hearth
    for (const sx of [-1, 1]) G.box(-hw + 80 + sx * 50, 170, 50, 6, 6, 50, MB.woodD);
    G.box(-hw + 80, 170, 104, 70, 36, 4, MB.wood); G.blob(-hw + 80, 170, 122, 60, 32, 14, 0x5a3a28, { nu: 10, nv: 5 }); G.box(-hw + 80, 170, 140, 66, 34, 4, MB.wood); G.tube([[-hw + 80, 140, 122], [-hw + 80, 100, 100]], 5, MB.iron, { S: 6 });
    // tongs and horseshoes hung on the front post
    for (let i = 0; i < 3; i++) { const b = G.n; G.lathe([[9, -1.5], [9, 1.5], [6, 1.5], [6, -1.5], [9, -1.5]], MB.iron, 10, [0, 0, 0], [1, 1], true); G.place(b, { x: hw - 10, y: -hd - 1.4, z: 150 + i * 28, roll: 90 }); }
  })];
}
// ---- the maypole on the green after the dance: a tall pole, a garland at its crown, the ribbons in the village's
// colours plaited round and round it down to a man's height, their loose ends hanging from the garland
export function maypole(h = 900) {
  h = q(h, 50);
  return ['mbmaypole2|' + h, shape((G) => {
    const rAt = (z) => 16 - (7 * z) / h;
    G.lathe([[16, 0], [13, h * 0.5], [9, h]], MB.board, 10); G.lathe([[12, h], [0, h + 30]], MB.ribbon[1], 8);
    { const b = G.n; G.lathe([[34, -9], [34, 9], [8, 9], [8, -9], [34, -9]], 0x5c8e3a, 16, [0, 0, 0], [1, 1], true); G.place(b, { z: h - 60 }); }
    for (let i = 0; i < 4; i++) { const pts = [], z0 = h - 80, z1 = 210; for (let k = 0; k <= 36; k++) { const t = k / 36, z = z0 + (z1 - z0) * t, a = i * (Math.PI / 2) + t * Math.PI * 7, r = rAt(z) + 1.2; pts.push([Math.cos(a) * r, Math.sin(a) * r, z]); } G.tube(pts, 2.4, MB.ribbon[i], { S: 4, M: 72, caps: false }); }
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.2; G.tube([[Math.cos(a) * 30, Math.sin(a) * 30, h - 66], [Math.cos(a) * 40, Math.sin(a) * 40, h - 160], [Math.cos(a) * 44, Math.sin(a) * 44, h - 240 - (i % 3) * 30]], 2.2, MB.ribbon[i % 4], { S: 4, M: 8 }); }
  })];
}
// ---- a stook: sheaves of the cut barley stood up together to dry, leaning in on each other, their ears bushy at the
// top, a band of straw round each
export function stook(seed = 1) {
  seed = N(seed);
  return ['mbstook2|' + (seed % 3), shape((G) => {
    const R = rng(seed * 7 + 1), n = 7 + (seed % 3);
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + R() * 0.3, c = i % 2 ? MB.straw : MB.strawD, ft = [Math.cos(a) * 34, Math.sin(a) * 34, -2], mid = [Math.cos(a) * 20, Math.sin(a) * 20, 56], top = [Math.cos(a) * 9, Math.sin(a) * 9, 96];
      G.tube([ft, mid, top], 7, c, { S: 6, M: 6 }); G.blob(mid[0] * 0.98, mid[1] * 0.98, 60, 8.5, 8.5, 4, MB.wood, { nu: 6, nv: 3 });
      G.blob(Math.cos(a) * 12, Math.sin(a) * 12, 108, 12, 12, 16, mix(c, 0xe8c878, 0.4), { nu: 8, nv: 5 }); }
  })];
}
// ---- the washing place: flat stones laid down the bank into the water (along X, the water at +X)
export function washSlabs(seed = 1) {
  seed = N(seed);
  return ['mbslabs|' + (seed % 2), shapeF((G) => { const R = rng(seed * 3 + 2); for (let i = 0; i < 4; i++) G.box(i * 80, (R() - 0.5) * 30, 6 - i * 1.2, 46 + R() * 10, 70 + R() * 20, 6 - i * 1.2, pick(MB.stone, i + seed)); })];
}
// ---- a finger post at the crossroads: a post and three arms (blank, the paint long gone), a little cap
export function fingerpost() {
  return ['mbfinger', shape((G) => {
    G.box(0, 0, 150, 8, 8, 150, MB.woodD); G.lathe([[10, 300], [0, 318]], MB.woodD, 4);
    for (const [a, z] of [[0, 270], [120, 240], [235, 210]]) { const b = G.n; G.box(48, 0, 0, 44, 3, 12, MB.board); G.box(96, 0, 0, 6, 3, 8, MB.board); G.place(b, { yaw: a, z }); }
  })];
}
