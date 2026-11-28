// Sculpted pieces for the Wildwood's places (Old Oak Woods first). Same rules as dest_props.js: UE frame (X the front,
// Y right, Z up, cm), each returns [key, build] for world.Shape(), keys carry every number the shape depends on, things
// stand on z = 0, and every piece is whole: nothing hangs in the air or stops short of what holds it.
import { shapeB as shape, wob } from './propkit.js';
import { dark, mix } from './village_shapes.js';
import { q, hx, rng } from './dest_props.js';

export const WC = {   // the wood's own colours
  bark: [0x5a4a3c, 0x4e4034, 0x625040], barkD: 0x3a2e26, lichen: 0x7e8058, moss: 0x4e6e2e, mossL: 0x6a8a3a,
  leaf: [0x3e6a2c, 0x46722e, 0x385f28], fern: 0x4e7e30, fernL: 0x6e9a40, fernD: 0x36581f,
  log: 0x6e5440, logD: 0x4a3828, grain: 0xc8a878, grainD: 0x9a7c56, heart: 0x8a6440,
  earth: 0x4e3e2e, earthD: 0x382c22, turf: 0x5a7232, charcoal: 0x26221e, ash: 0x8a847a,
  canvas: 0xc8b890, canvasD: 0x9a8c68, rope: 0xb09a6c, iron: 0x3a3a40, stone: [0x8a8a7e, 0x7e7e72, 0x969484, 0x74746a],
};
const barkC = (seed, base) => (t, a) => (Math.sin(a * 5 + Math.sin(t * 5 + seed) * 0.7 + seed) > 0.35 ? WC.barkD : Math.sin(a * 2 + t * 3 + seed * 2) > 0.9 ? WC.lichen : base);

// ---- an old oak: a short thick trunk leaning a little, buttress roots running out into the ground, four or five great
// boughs out and up, and a broad crown of leaf masses at their ends with one over the top. The crown's underside is
// well over a gnome's head (about h/2), so the trunk is all that stands in your way.
export function oak(h = 1600, seed = 1) {
  h = q(h, 100);
  return ['doak|' + [h, seed % 4].join('|'), shape((G) => {
    const R = rng(seed * 313 + h), tr = h * 0.055, base = WC.bark[seed % 3], bc = barkC(seed, base);
    const lx = (R() - 0.5) * tr * 1.2, ly = (R() - 0.5) * tr * 1.2;
    G.tube([[0, 0, -30], [lx * 0.3, ly * 0.3, h * 0.12], [lx, ly, h * 0.3], [lx * 1.2, ly * 1.2, h * 0.42]], (t) => tr * (1.5 - 0.6 * t), bc, { S: 14, M: 12 });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + R() * 0.5, L = tr * (1.8 + R() * 0.8); G.tube([[Math.cos(a) * tr * 0.5, Math.sin(a) * tr * 0.5, h * 0.07], [Math.cos(a) * L * 0.6, Math.sin(a) * L * 0.6, tr * 0.32], [Math.cos(a) * L, Math.sin(a) * L, -10]], (t) => tr * 0.5 * (1 - t * 0.7), bc, { S: 7, M: 6, flat: () => [1, 0.7] }); }
    const lumps = [], nL = 4 + (seed % 2);
    for (let i = 0; i < nL; i++) {
      const a = (i / nL) * Math.PI * 2 + R() * 0.7, L = h * (0.3 + R() * 0.1), tip = [Math.cos(a) * L + lx, Math.sin(a) * L + ly, h * (0.6 + R() * 0.1)];
      G.tube([[lx * 1.1, ly * 1.1, h * 0.36], [lx + (tip[0] - lx) * 0.45, ly + (tip[1] - ly) * 0.45, h * 0.47 + R() * h * 0.05], [lx + (tip[0] - lx) * 0.8, ly + (tip[1] - ly) * 0.8, tip[2] - h * 0.05], tip], (t) => tr * 0.6 * (1 - t * 0.68), bc, { S: 8, M: 10 });
      lumps.push([tip[0], tip[1], tip[2] + h * 0.07, h * (0.19 + R() * 0.04)]);
    }
    lumps.push([lx, ly, h * 0.8, h * 0.26]);
    for (let i = 0; i < nL; i++) { const a = ((i + 0.5) / nL) * Math.PI * 2, d = h * 0.2; lumps.push([Math.cos(a) * d + lx, Math.sin(a) * d + ly, h * (0.72 + R() * 0.06), h * 0.17]); }
    const leaf = WC.leaf[seed % 3], top = mix(leaf, 0x7aa848, 0.35), under = dark(leaf, 0.6);
    lumps.forEach(([x, y, z, r], i) => G.blob(x, y, z, r * 1.12, r * 1.12, r * 0.78, (nx, ny, nz) => (nz > 0.5 ? top : nz < -0.35 ? under : leaf), { nu: 13, nv: 8, warp: (px, py, pz, nx, ny, nz) => { const w = 1 + wob(nx * 3 + i * 1.3, ny * 3 + nz * 2) * 0.13; return [px * w, py * w, pz * w]; } }));
  })];
}
// how wide an oak's trunk is at chest height, for its body
export const oakTrunk = (h) => q(h, 100) * 0.055 * 1.4;

// ---- the great oak: older than the woods round it. A vast trunk split at the foot into a hollow you could stand a
// cart in (dark inside, a lip of bark round it), ridged and burred, roots like walls, a crown that shades the glade.
// The hollow faces +X.
export function greatOak(h = 2800) {
  h = q(h, 100);
  return ['dgreatoak|' + h, shape((G) => {
    const R = rng(h * 7 + 1), tr = h * 0.08, bc = barkC(3, WC.bark[1]);
    G.tube([[0, 0, -40], [10, -6, h * 0.1], [-12, 14, h * 0.26], [0, 30, h * 0.4]], (t) => tr * (1.45 - 0.55 * t), bc, { S: 18 });
    // burrs: knobbly swellings on the trunk
    for (let i = 0; i < 7; i++) { const a = R() * Math.PI * 2, z = h * (0.06 + R() * 0.26), r = tr * (1.36 - 0.5 * (z / (h * 0.4))); if (Math.cos(a) > 0.6 && z < h * 0.2) continue; G.blob(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92, z, tr * 0.22, tr * 0.22, tr * 0.18, WC.bark[2], { nu: 8, nv: 5 }); }
    // the hollow: a tall dark split in the +X face, a thick lip of bark round it
    const hr = tr * 1.42 * 0.97, hz = h * 0.13;
    G.blob(hr - tr * 0.18, 0, hz * 0.5 + 6, tr * 0.2, tr * 0.42, hz * 0.5, 0x120e0a, { nu: 12, nv: 8 });
    { const lip = []; for (let i = 0; i <= 16; i++) { const t = -0.1 + (i / 16) * (Math.PI + 0.2), y = Math.cos(t) * tr * 0.46, z = Math.max(0, hz * 0.5 + 6 + Math.sin(t) * hz * 0.56); lip.push([hr - tr * 0.06, y, z]); } lip[0][2] = -6; lip[16][2] = -6; G.tube(lip, (t) => tr * (0.13 - 0.03 * Math.abs(t - 0.5)), barkC(5, WC.bark[0]), { S: 7, M: 24 }); }
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + 0.45, L = tr * (2.2 + R() * 0.7); G.tube([[Math.cos(a) * tr * 0.5, Math.sin(a) * tr * 0.5, h * 0.06], [Math.cos(a) * L * 0.55, Math.sin(a) * L * 0.55, tr * 0.36], [Math.cos(a) * L, Math.sin(a) * L, -14]], (t) => tr * 0.46 * (1 - t * 0.7), bc, { S: 8, flat: () => [1, 0.62] }); }
    const lumps = [];
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + R() * 0.5, L = h * (0.33 + R() * 0.08), tip = [Math.cos(a) * L, Math.sin(a) * L + 30, h * (0.58 + R() * 0.08)]; G.tube([[0, 30, h * 0.36], [tip[0] * 0.45, tip[1] * 0.45, h * 0.47], [tip[0] * 0.82, tip[1] * 0.82, tip[2] - h * 0.04], tip], (t) => tr * 0.56 * (1 - t * 0.66), bc, { S: 9 }); lumps.push([tip[0], tip[1], tip[2] + h * 0.07, h * (0.18 + R() * 0.03)]); }
    lumps.push([0, 30, h * 0.78, h * 0.27]); for (let i = 0; i < 6; i++) { const a = ((i + 0.5) / 6) * Math.PI * 2; lumps.push([Math.cos(a) * h * 0.22, Math.sin(a) * h * 0.22 + 30, h * (0.7 + R() * 0.05), h * 0.16]); }
    const leaf = 0x3a6428, top = mix(leaf, 0x7aa848, 0.35), under = dark(leaf, 0.6);
    lumps.forEach(([x, y, z, r], i) => G.blob(x, y, z, r * 1.12, r * 1.12, r * 0.78, (nx, ny, nz) => (nz > 0.5 ? top : nz < -0.35 ? under : leaf), { nu: 14, nv: 9, warp: (px, py, pz, nx, ny, nz) => { const w = 1 + wob(nx * 3 + i * 1.7, ny * 3 + nz * 2) * 0.13; return [px * w, py * w, pz * w]; } }));
  })];
}
export const greatTrunk = (h) => q(h, 100) * 0.08 * 1.42;

// ---- a fallen oak, long dead, along X: the trunk lying half bedded in the ground, its root plate stood on edge at the
// -X end with earth still in it, broken boughs on the +X end, moss along the top. Lies from -L/2 to +L/2.
export function fallenOak(L = 2400, tr = 120, seed = 1) {
  L = q(L, 100); tr = q(tr);
  return ['dfallenoak|' + [L, tr, seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 59 + L), z0 = tr * 0.82, bc = barkC(seed, WC.bark[0]), mossTop = (t, a) => (Math.sin(a) > 0.7 && Math.sin(t * 13 + seed) > 0.1 ? (Math.sin(t * 40) > 0 ? WC.moss : WC.mossL) : bc(t, a));
    G.tube([[-L / 2, 0, z0], [-L * 0.15, 12, z0 - 4], [L * 0.2, -10, z0 - 10], [L / 2, 0, z0 - 18]], (t) => tr * (1.08 - 0.38 * t), mossTop, { S: 14 });
    // the root plate: a ragged disc of earth stood on edge, roots running out of it every way
    const px = -L / 2 - tr * 0.2, pr = tr * 3.2;
    G.blob(px, 0, pr * 0.82, tr * 0.5, pr, pr * 0.85, (nx, ny, nz) => (nx < -0.3 ? (wob(ny * 6, nz * 6) > 0.3 ? WC.earthD : WC.earth) : nz > 0.7 ? WC.turf : WC.earth), { nu: 14, nv: 10, warp: (x, y, z, nx, ny, nz) => { const w = 1 + wob(ny * 4 + seed, nz * 4) * 0.12; return [x, y * w, z * w]; } });
    for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 2 + R() * 0.4, r = pr * (0.75 + R() * 0.2), ry = Math.cos(a) * r, rz = pr * 0.82 + Math.sin(a) * r * 0.85; if (rz < 14) continue; G.tube([[px + tr * 0.1, ry * 0.6, pr * 0.82 + (rz - pr * 0.82) * 0.6], [px - tr * 0.3, ry, rz], [px - tr * 0.9 - R() * tr * 0.6, ry * 1.22, Math.max(10, pr * 0.82 + (rz - pr * 0.82) * 1.2)]], (t) => tr * 0.18 * (1 - t * 0.75), WC.bark[2], { S: 5 }); }
    // broken boughs at the far end: stubs and one long limb along the ground
    G.tube([[L * 0.32, 0, z0 + tr * 0.6], [L * 0.38, -tr * 0.8, z0 + tr * 1.4], [L * 0.41, -tr * 1.2, z0 + tr * 1.9]], (t) => tr * 0.28 * (1 - t * 0.5), bc, { S: 7 });
    G.tube([[L * 0.44, tr * 0.6, z0 - 8], [L * 0.52, tr * 2.2, tr * 0.5], [L * 0.62, tr * 3.6, tr * 0.3]], (t) => tr * 0.24 * (1 - t * 0.6), bc, { S: 7 });
    // the splintered end: pale wood showing
    G.blob(L / 2 + 4, 0, z0 - 18, tr * 0.12, tr * 0.66, tr * 0.66, WC.grainD, { nu: 10, nv: 6 });
    // moss cushions and a few brackets of shelf fungus along the top and side
    for (let i = 0; i < 7; i++) { const x = -L / 2 + L * (0.1 + 0.8 * R()), r = tr * (1.08 - 0.38 * ((x + L / 2) / L)); G.blob(x, r * 0.15, z0 + r * 0.88, tr * (0.4 + R() * 0.3), tr * 0.34, tr * 0.16, i % 2 ? WC.moss : WC.mossL, { nu: 8, nv: 4 }); }
    for (let i = 0; i < 5; i++) { const x = -L * 0.3 + i * L * 0.14, r = tr * (1.08 - 0.38 * ((x + L / 2) / L)); G.blob(x, -r * 0.92, z0 + 10, tr * 0.2, tr * 0.16, tr * 0.06, i % 2 ? 0xc8a870 : 0xa88a58, { nu: 8, nv: 4 }); }
  })];
}

// ---- a stump: flared foot, bark round it, the sawn top with its rings (and an axe left in it)
export function stump(r = 40, h = 50, seed = 1, axe = false) {
  r = q(r, 5); h = q(h, 5);
  return ['dstump|' + [r, h, seed % 3, axe ? 1 : 0].join('|'), shape((G) => {
    const R = rng(seed * 17 + r), bc = barkC(seed, WC.bark[seed % 3]);
    G.lathe([[r * 1.5, -6], [r * 1.3, h * 0.12], [r * 1.06, h * 0.4], [r, h - 2], [r * 0.97, h]], (k) => (k < 1 ? WC.barkD : WC.bark[seed % 3]), 14);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + R(), L = r * 2.1; G.tube([[Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, h * 0.25], [Math.cos(a) * L, Math.sin(a) * L, -6]], (t) => r * 0.3 * (1 - t * 0.6), bc, { S: 6, flat: () => [1, 0.7] }); }
    for (let k = 0; k < 4; k++) { const rk = r * (0.95 - k * 0.24); G.lathe([[rk, h], [rk, h + 0.6 + k * 0.4], [0, h + 0.6 + k * 0.4]], k % 2 ? WC.grain : WC.grainD, 14); }
    if (axe) { const b = G.n; G.tube([[0, 0, 0], [0, 0, 70]], 2.6, 0x8a6a44, { S: 6 }); G.blob(0, 6, -2, 3, 11, 9, WC.iron, { e: 6, nu: 6, nv: 4 }); G.blob(0, -3, 0, 3.4, 5, 6, WC.iron, { e: 6, nu: 6, nv: 4 }); G.place(b, { x: r * 0.2, y: 0, z: h + 8, pitch: -38 }); }
  })];
}

// ---- a stack of cut logs along Y: rows of n, n-1, ... logs (each len long, radius lr), the sawn ends showing their
// rings, a stake at each end of the bottom row to keep it from rolling
export function logPile(n = 4, len = 360, lr = 30, seed = 1) {
  len = q(len, 20); lr = q(lr, 2);
  return ['dlogs|' + [n, len, lr, seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 41 + n), d = lr * 2;
    for (let row = 0; row < n; row++) for (let i = 0; i < n - row; i++) {
      const x = (i - (n - row - 1) / 2) * d * 1.01, z = lr + row * lr * 1.72, r = lr * (0.9 + R() * 0.14), y0 = -len / 2 + (R() - 0.5) * 24, y1 = len / 2 + (R() - 0.5) * 24, bc = barkC(i + row, WC.bark[(i + row) % 3]);
      G.tube([[x, y0, z], [x, y1, z]], r, bc, { S: 10, caps: false });
      for (const [yy, s] of [[y0, -1], [y1, 1]]) for (let k = 0; k < 3; k++) { const rk = r * (1 - k * 0.3), ring = []; for (let j = 0; j < 10; j++) { const a = (j / 10) * Math.PI * 2; ring.push([x + Math.cos(a) * rk, yy + s * k * 0.5, z + Math.sin(a) * rk]); } G.fan(x, yy + s * k * 0.5, z, ring, k === 0 ? WC.grainD : k === 1 ? WC.grain : WC.heart); }
    }
    for (const s of [-1, 1]) G.tube([[s * (n * d * 0.5 + 6), 0, -10], [s * (n * d * 0.5 + 8), 0, lr * 2.4]], 6, WC.log, { S: 6 });
  })];
}

// ---- a fern: fronds arching out from a crown, each a tapering ribbon with a pale rib, the tips curling down
export function fern(s = 1, seed = 1) {
  return ['dfern|' + [Math.round(s * 10), seed % 4].join('|'), shape((G) => {
    const R = rng(seed * 29 + Math.round(s * 10)), n = 7 + (seed % 3);
    G.blob(0, 0, 4, 10 * s, 10 * s, 6 * s, WC.fernD, { nu: 6, nv: 3 });
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + R() * 0.5, L = s * (70 + R() * 36), up = 0.7 + R() * 0.35, wd = s * (10 + R() * 4), col = i % 2 ? WC.fern : mix(WC.fern, WC.fernL, 0.4);
      G.surf((u, v) => { const t = v, ca = Math.cos(a), sa = Math.sin(a), r = L * t, z = Math.max(1.5, L * (up * t - (up + 0.25) * t * t * 0.95) + 6), w = wd * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (u - 0.5) * 2; return [ca * r - sa * w, sa * r + ca * w, z + Math.abs(u - 0.5) * wd * 0.3]; }, 0, 1, 2, 0, 1, 7, (u) => (Math.abs(u - 0.5) < 0.2 ? mix(col, 0xb4c878, 0.35) : col));
    }
  })];
}

// ---- the forester's lodge: a log cabin, its front (+X) on a porch. Logs notched at the corners and running past them,
// a stone footing, the door and two windows in the front, a window in each side, gables of upright boards, a shingled
// roof with moss on it, a stone chimney up the +Y gable end. The porch: a plank deck, four posts, its own lower roof.
// Sizes: CB.W deep (X), CB.L long (Y), eave CB.eave, ridge CB.ridge; the porch runs CB.porch out from the front wall.
export const CB = { W: 700, L: 960, eave: 320, ridge: 610, over: 56, porch: 230, porchZ: 26, porchEave: 250, chimY: 560 };
export function logCabin(seed = 1) {
  return ['dcabin|' + (seed % 2), shape((G) => {
    const R = rng(seed * 101 + 7), { W, L, eave, ridge, over, porch, porchZ, porchEave } = CB, hw = W / 2, hl = L / 2, lr = 15, step = lr * 1.86;
    const logC = (k) => (t, a) => (Math.sin(a * 5 + t * 23 + k) > 0.55 ? WC.logD : Math.sin(t * 9 + k * 3) > 0.85 ? WC.lichen : WC.log);
    const holes = { front: [[-50, 50, 26, 236], [-330, -210, 110, 220], [210, 330, 110, 220]], side: [[-60, 60, 110, 220]] };   // [y0, y1, z0, z1] along each wall
    // stone footing
    for (const sx of [-1, 1]) G.blob(sx * hw, 0, 14, 26, hl + 26, 20, 0x7e7a6e, { e: 6, nu: 10, nv: 4 });
    for (const sy of [-1, 1]) G.blob(0, sy * hl, 14, hw + 26, 26, 20, 0x7e7a6e, { e: 6, nu: 10, nv: 4 });
    // a dark core inside the logs, so no chink ever shows daylight
    G.blob(0, 0, (30 + eave) / 2, hw - 6, hl - 6, (eave - 30) / 2, 0x2a2018, { e: 10, nu: 6, nv: 4 });
    // the walls, course by course; the end walls' logs sit half a course up from the long walls'
    let k = 0;
    for (let z = 30 + lr; z < eave; z += step, k++) {
      for (const [axis, half, len, list, off] of [['x', hw, L, holes.front, 0], ['y', hl, W, holes.side, step / 2]]) {
        const zz = z + off; if (zz > eave) continue;
        for (const s of [-1, 1]) {
          const cuts = (axis === 'x' && s < 0) ? [] : list.filter(([, , z0, z1]) => zz > z0 - lr * 0.6 && zz < z1 + lr * 0.6);
          const a0 = -len / 2 - 24, a1 = len / 2 + 24; let segs = [[a0, a1]];
          for (const [c0, c1] of cuts) segs = segs.flatMap(([u0, u1]) => (c1 <= u0 || c0 >= u1 ? [[u0, u1]] : [[u0, c0], [c1, u1]].filter(([p0, p1]) => p1 - p0 > 20)));
          for (const [u0, u1] of segs) { const r = lr * (0.94 + R() * 0.1), p = axis === 'x' ? [[s * half, u0, zz], [s * half, u1, zz]] : [[u0, s * half, zz], [u1, s * half, zz]]; G.tube(p, r, logC(k + s), { S: 8, M: Math.max(2, Math.round((u1 - u0) / 80)), caps: false });
            for (const u of [u0, u1]) { if (Math.abs(u) < len / 2) continue; const ring = [], cx = axis === 'x' ? s * half : u, cy = axis === 'x' ? u : s * half; for (let j = 0; j < 8; j++) { const a = (j / 8) * Math.PI * 2; ring.push(axis === 'x' ? [cx + Math.cos(a) * r, cy, zz + Math.sin(a) * r] : [cx, cy + Math.cos(a) * r, zz + Math.sin(a) * r]); } G.fan(cx, cy, zz, ring, WC.grainD); } }
        }
      }
    }
    // the door: planks in a frame, a latch; the windows: frames, dark panes with a cross, shutters folded back
    const frame = 0x4e3a28, door = 0x6a4e34;
    G.blob(hw + 4, 0, 26 + 105, 5, 50, 105, door, { e: 8, nu: 6, nv: 4 });
    for (let i = -2; i <= 2; i++) G.blob(hw + 9, i * 20, 131, 1.5, 1.2, 100, 0x4e3626, { e: 6, nu: 4, nv: 3 });
    for (const yy of [-56, 56]) G.blob(hw + 6, yy, 131, 8, 7, 108, frame, { e: 8, nu: 4, nv: 3 });
    G.blob(hw + 6, 0, 243, 8, 64, 8, frame, { e: 8, nu: 4, nv: 3 }); G.blob(hw + 12, 30, 126, 3, 6, 3, WC.iron, { nu: 6, nv: 3 });
    const win = (place) => { const b = G.n; G.blob(0, 0, 0, 6, 54, 50, 0x1a2228, { e: 8, nu: 4, nv: 3 }); G.blob(4, 0, 0, 3, 2.5, 50, frame, { e: 6, nu: 4, nv: 3 }); G.blob(4, 0, 0, 3, 54, 2.5, frame, { e: 6, nu: 4, nv: 3 });
      for (const s of [-1, 1]) { G.blob(4, s * 62, 0, 6, 7, 58, frame, { e: 8, nu: 4, nv: 3 }); G.blob(4, 0, s * 58, 6, 66, 7, frame, { e: 8, nu: 4, nv: 3 }); G.blob(5, s * 98, 0, 3, 30, 54, 0x5a6a4a, { e: 8, nu: 4, nv: 3 }); } G.place(b, place); };
    for (const yy of [-270, 270]) win({ x: hw, y: yy, z: 165 });
    for (const s of [-1, 1]) win({ x: 0, y: s * hl, z: 165, yaw: s * 90 });
    // gable ends: upright boards from the eave up to the roof line, a vent under the ridge
    const roofZ = (x) => eave + (ridge - eave) * (1 - Math.abs(x) / hw);
    for (const s of [-1, 1]) { for (let x = -hw + 15; x < hw - 10; x += 30) { const top = roofZ(Math.abs(x) + 15); G.blob(x, s * (hl + 2), (eave + top) / 2, 14.5, 4, (top - eave) / 2, (Math.round(x / 30) % 2 ? 0x7a5c40 : 0x6e5238), { e: 8, nu: 4, nv: 3 }); } G.blob(0, s * (hl + 7), ridge - 90, 26, 3, 16, 0x1a1410, { e: 8, nu: 4, nv: 3 }); }
    // the roof: shakes in courses on both slopes, an eave board, moss on the north slope; the ridge capped
    const pitch = Math.atan2(ridge - eave, hw), rows = 9;
    for (const sx of [-1, 1]) {
      const xa = sx * (hw + over), za = eave - over * Math.tan(pitch), nz = Math.cos(pitch), nx = sx * Math.sin(pitch);
      G.surf((u, v) => { const x = xa + (0 - xa) * v, z = za + (ridge - za) * v, lift = ((v * rows) % 1) * 4; return [x + nx * lift, -hl - over + u * (L + over * 2), z + nz * lift + 3]; }, 0, 1, 20, 0, 1, rows * 2, (u, v) => (sx < 0 && wob(u * 9, v * 5 + seed) > 0.4 ? WC.moss : [0x5a4a3c, 0x66543e, 0x4e4034][(Math.floor(v * rows) + Math.floor(u * 30) * 5) % 3]));
      G.surf((u, v) => { const x = xa + (0 - xa) * v, z = za + (ridge - za) * v; return [x - nx * 8, -hl - over + u * (L + over * 2), z - nz * 8 - 4]; }, 0, 1, 6, 0, 1, 2, 0x3a2c20);
      G.blob(xa * 0.99, 0, za - 2, 7, hl + over, 9, 0x4e3a28, { e: 8, nu: 4, nv: 3 });
    }
    G.blob(0, 0, ridge + 8, 16, hl + over + 4, 9, 0x3e3226, { e: 6, nu: 6, nv: 3 });
    // the chimney: a stone stack up the +Y gable end, out through the roof's edge and up past the ridge
    { const cy = CB.chimY, st = (i) => WC.stone[i % 4];
      for (let i = 0, z = 0; z < ridge + 120; i++, z += 40) { const w = z < eave ? 78 : 58; G.blob(0, cy, z + 20, w + (i % 2) * 3, 50, 21, st(i), { e: 4, nu: 8, nv: 4 }); }
      G.blob(0, cy, ridge + 150, 64, 54, 10, 0x5e5a52, { e: 6, nu: 8, nv: 3 }); G.blob(0, cy, ridge + 152, 28, 22, 12, 0x1a1612, { e: 6, nu: 6, nv: 3 }); }
    // the porch: a plank deck at porchZ, posts, a beam, its roof a lean-to off the wall; two steps down at the door
    { const px = hw + porch, d0 = hw + 8;
      G.blob((d0 + px) / 2, 0, porchZ / 2, (px - d0) / 2, hl + 20, porchZ / 2, 0x3a2c20, { e: 10, nu: 6, nv: 3 });
      for (let x = d0 + 12; x < px - 6; x += 22) G.blob(x, 0, porchZ - 2, 10.5, hl + 18, 3, Math.round(x / 22) % 2 ? 0x8a6a48 : 0x7a5c3e, { e: 8, nu: 4, nv: 3 });
      for (const yy of [-hl + 10, -hl / 3, hl / 3, hl - 10]) { G.tube([[px - 16, yy, porchZ - 4], [px - 16, yy, porchEave + 6]], 11, WC.log, { S: 8, M: 4 }); G.tube([[px - 16, yy, porchEave - 60], [px - 60, yy, porchEave - 6]], 5, WC.logD, { S: 6, M: 3 }); }
      G.tube([[px - 16, -hl - 20, porchEave + 4], [px - 16, hl + 20, porchEave + 4]], 12, WC.log, { S: 8, M: 10 });
      const za = porchEave - 4, zb = eave - 30, x0 = px + 40, x1 = d0, pz = (x) => za + (zb - za) * (x0 - x) / (x0 - x1);
      G.surf((u, v) => { const x = x0 + (x1 - x0) * v; return [x, -hl - 40 + u * (L + 80), pz(x) + 14 + ((v * 5) % 1) * 3]; }, 0, 1, 16, 0, 1, 10, (u, v) => [0x5a4a3c, 0x66543e][(Math.floor(v * 5) + Math.floor(u * 24)) % 2]);
      G.surf((u, v) => { const x = x0 + (x1 - x0) * v; return [x, -hl - 40 + u * (L + 80), pz(x) + 6]; }, 0, 1, 4, 0, 1, 2, 0x3a2c20);
      for (let i = 0; i < 2; i++) G.blob(px + 22 + i * 28, 0, porchZ * (1 - (i + 1) / 3) / 2 + 1, 15, 66, porchZ * (1 - (i + 1) / 3) / 2 + 1, 0x6e5238, { e: 8, nu: 4, nv: 3 }); }
  })];
}

// ---- a woodshed: a lean-to roof on four posts over cordwood stacked to the eaves (split ends out), open at the front
// (+X). len along Y.
export function woodshed(len = 560) {
  len = q(len, 20);
  return ['dwoodshed|' + len, shape((G) => {
    const R = rng(len + 3), hl = len / 2, D = 220, hB = 230, hF = 280;
    for (const [x, h] of [[-D / 2, hB], [D / 2, hF]]) for (const y of [-hl, hl]) G.tube([[x, y, -6], [x, y, h]], 9, WC.log, { S: 7, M: 4 });
    for (const [x, h] of [[-D / 2, hB], [D / 2, hF]]) G.tube([[x, -hl - 14, h - 4], [x, hl + 14, h - 4]], 9, WC.logD, { S: 7, M: 8 });
    G.surf((u, v) => { const x = -D / 2 - 40 + (D + 90) * v, z = hB + 6 + (hF - hB) * ((x + D / 2) / D); return [x, -hl - 30 + u * (len + 60), z + ((v * 6) % 1) * 3]; }, 0, 1, 12, 0, 1, 12, (u, v) => [0x5a4a3c, 0x66543e, 0x4e4034][(Math.floor(v * 6) + Math.floor(u * 18)) % 3]);
    G.blob(-D / 2 + 8, 0, hB / 2, 4, hl, hB / 2, 0x4e3a28, { e: 10, nu: 4, nv: 3 });
    // the cordwood: split logs end-on in rows, a little ragged
    for (let z = 14; z < hB - 20; z += 26) for (let y = -hl + 16; y < hl - 10; y += 28) { const r = 11 + R() * 3, x = D / 2 - 40 + R() * 10; G.tube([[-D / 2 + 14, y, z], [x, y, z]], r, WC.log, { S: 5, M: 2, caps: false }); const ring = []; for (let j = 0; j < 5; j++) { const a = (j / 5) * Math.PI * 2 + y; ring.push([x, y + Math.cos(a) * r, z + Math.sin(a) * r]); } G.fan(x, y, z, ring, R() > 0.5 ? WC.grain : WC.grainD); }
  })];
}

// ---- a sawing trestle: two sawhorses with a great log across them and the two-man saw stood in its cut, sawdust below
export function sawTrestle() {
  return ['dsawtrestle', shape((G) => {
    for (const y of [-150, 150]) { for (const s of [-1, 1]) for (const e of [-1, 1]) G.tube([[s * 40, y + e * 30, -6], [0, y, 96]], 5.5, WC.log, { S: 6, M: 3 }); G.tube([[-46, y, 92], [46, y, 92]], 7, WC.logD, { S: 6, M: 3 }); }
    G.tube([[0, -260, 132], [0, 260, 132]], 34, barkC(2, WC.bark[2]), { S: 12, M: 8, caps: false });
    for (const [yy, s] of [[-260, -1], [260, 1]]) { for (let k = 0; k < 3; k++) { const rk = 34 * (1 - k * 0.3), ring = []; for (let j = 0; j < 12; j++) { const a = (j / 12) * Math.PI * 2; ring.push([Math.cos(a) * rk, yy + s * k * 0.5, 132 + Math.sin(a) * rk]); } G.fan(0, yy + s * k * 0.5, 132, ring, k === 0 ? WC.grainD : k === 1 ? WC.grain : WC.heart); } }
    // the saw: a long blade down into the cut at y = 60, a handle up at each end
    G.blob(0, 60, 150, 70, 1.2, 14, 0x9a9aa0, { e: 8, nu: 6, nv: 3 });
    for (const s of [-1, 1]) { G.tube([[s * 70, 60, 150], [s * 78, 60, 176]], 3, 0x9a9aa0, { S: 4, M: 2 }); G.tube([[s * 78, 60, 170], [s * 78, 60, 206]], 4.5, 0x8a6a44, { S: 6, M: 2 }); }
    G.blob(0, 60, 100, 6, 2, 3, 0xd8c8a0, { nu: 5, nv: 3 });
  })];
}

// ---- a canvas tent: a ridge pole on two uprights, the canvas down to the ground both sides and pegged, the door flaps
// tied back at the front (+X) on a dark inside, guy ropes out to pegs. L along X, W across.
export function tent(L = 330, W = 280, H = 230) {
  return ['dtent|' + [L, W, H].join('|'), shape((G) => {
    const hl = L / 2, hw = W / 2;
    for (const x of [-hl, hl]) G.tube([[x, 0, -6], [x, 0, H + 14]], 4.5, 0x7a5c3e, { S: 6, M: 3 });
    G.tube([[-hl - 16, 0, H], [hl + 16, 0, H]], 4.5, 0x7a5c3e, { S: 6, M: 6 });
    for (const s of [-1, 1]) G.surf((u, v) => { const x = -hl + u * L, sag = Math.sin(u * Math.PI) * 6 * v; return [x, s * (hw * v), H - (H - 4) * v - sag]; }, 0, 1, 8, 0, 1, 4, (u, v) => (v > 0.92 ? WC.canvasD : (Math.floor(u * 8) % 2 ? WC.canvas : mix(WC.canvas, WC.canvasD, 0.25))));
    G.surf((u, v) => { const s = (u - 0.5) * 2; return [-hl, s * hw * v, H - (H - 4) * v]; }, 0, 1, 4, 0, 1, 4, WC.canvasD);
    G.surf((u, v) => { const s = (u - 0.5) * 2; return [hl - 6, s * hw * v * 0.9, H - (H - 4) * v]; }, 0, 1, 4, 0, 1, 4, 0x1e1a14);
    for (const s of [-1, 1]) { G.surf((u, v) => [hl + 2 + v * 10, s * (hw * u * 0.5 + 8 * v), H - (H - 4) * u], 0, 1, 4, 0, 1, 1, WC.canvas); G.tube([[hl + 8, s * hw * 0.26, H * 0.46], [hl + 4, s * hw * 0.3, H * 0.4]], 1.6, WC.rope, { S: 4, M: 2 }); }
    for (const x of [-hl * 0.6, 0, hl * 0.6]) for (const s of [-1, 1]) G.tube([[x, s * hw, 6], [x, s * (hw + 10), -4]], 2.2, 0x8a6a44, { S: 4, M: 2 });
    for (const x of [-hl - 16, hl + 16]) { const xs = x < 0 ? -1 : 1; G.tube([[x, 0, H], [x + xs * 90, 0, 0]], 1.3, WC.rope, { S: 4, M: 4 }); G.tube([[x + xs * 92, 0, 10], [x + xs * 90, 0, -10]], 2.4, 0x8a6a44, { S: 4, M: 2 }); }
  })];
}

// ---- a campfire: a ring of stones, an ash bed, charred logs crossed in it, a tripod of poles over it with a pot on a
// chain. The embers' glow is left to the map (a light).
export function campfire() {
  return ['dcampfire', shape((G) => {
    G.blob(0, 0, 1.2, 64, 64, 1.4, WC.ash, { nu: 12, nv: 3 });
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, b = G.n; G.blob(0, 0, 0, 18 + (i % 3) * 3, 14, 12 + (i % 2) * 3, WC.stone[i % 4], { e: 2.6, nu: 7, nv: 4 }); G.place(b, { x: Math.cos(a) * 70, y: Math.sin(a) * 70, z: 7, yaw: (a * 180) / Math.PI }); }
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI + 0.3; G.tube([[Math.cos(a) * 46, Math.sin(a) * 46, 6], [-Math.cos(a) * 46, -Math.sin(a) * 46, 14 + i * 3]], 7, (t) => (t > 0.3 && t < 0.7 ? WC.charcoal : 0x4a3a2c), { S: 6, M: 4 }); }
    for (let i = 0; i < 6; i++) G.blob(Math.cos(i * 2.1) * 18, Math.sin(i * 2.1) * 18, 5, 6, 5, 3, i % 2 ? 0xff7a2a : 0xd84a1a, { nu: 5, nv: 3 });
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5; G.tube([[Math.cos(a) * 96, Math.sin(a) * 96, -6], [Math.cos(a) * 6, Math.sin(a) * 6, 166], [-Math.cos(a) * 8, -Math.sin(a) * 8, 180]], 3.6, 0x6a5038, { S: 5, M: 4 }); }
    G.tube([[0, 0, 168], [0, 0, 86]], 1.1, WC.iron, { S: 4, M: 4, caps: false });
    G.lathe([[16, 52], [22, 62], [23, 76], [19, 86], [17, 86]], 0x2e2e32, 12); G.blob(0, 0, 52, 15, 15, 2, 0x2e2e32, { nu: 10, nv: 3 });
  })];
}
// ---- a log seat: a split log on two chocks
export function logSeat(len = 200) {
  len = q(len, 20);
  return ['dlogseat|' + len, shape((G) => {
    for (const y of [-len * 0.32, len * 0.32]) G.blob(0, y, 9, 16, 12, 11, WC.logD, { e: 4, nu: 6, nv: 3 });
    G.tube([[0, -len / 2, 32], [0, len / 2, 32]], 17, barkC(5, WC.bark[1]), { S: 9, M: 6, flat: () => [1, 0.8] });
    G.blob(0, 0, 44, 15, len / 2 - 4, 3, WC.grain, { e: 6, nu: 6, nv: 3 });
  })];
}

// ---- a charcoal burner's mound: a dome of earth and turf over the stacked wood, vent holes round its foot, a ring of
// raked soil about it
export function charcoalMound(r = 280, seed = 1) {
  r = q(r, 20);
  return ['dcharmound|' + [r, seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 61 + r);
    G.blob(0, 0, 2, r * 1.18, r * 1.18, 3, WC.earthD, { nu: 14, nv: 3 });
    G.blob(0, 0, 0, r, r, r * 0.62, (nx, ny, nz) => (nz > 0.25 && wob(nx * 5 + seed, ny * 5) > 0.15 ? WC.turf : wob(nx * 7, ny * 7 + nz * 3) > 0.5 ? WC.earthD : WC.earth), { nu: 16, nv: 9, warp: (x, y, z, nx, ny, nz) => { const w = 1 + wob(nx * 3 + seed, ny * 3) * 0.06; return [x * w, y * w, Math.max(z * w, -2)]; } });
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2 + R() * 0.3, el = 0.35, rr2 = r * Math.cos(el) * 0.97; G.blob(Math.cos(a) * rr2, Math.sin(a) * rr2, r * 0.62 * Math.sin(el) * 0.97, 7, 7, 6, 0x14100c, { nu: 6, nv: 4 }); }
    G.blob(0, 0, r * 0.6, 12, 12, 8, 0x14100c, { nu: 8, nv: 4 });
  })];
}

// ---- a lean-to of poles and bark: two forked uprights at the front (+X), a ridge pole across, poles down to the
// ground behind, bark slabs over them, a bed of bracken inside
export function leanTo(len = 360) {
  len = q(len, 20);
  return ['dleanto|' + len, shape((G) => {
    const hl = len / 2, H = 220, D = 260;
    for (const y of [-hl, hl]) { G.tube([[60, y, -8], [60, y, H + 10]], 7, WC.log, { S: 6, M: 4 }); G.tube([[60, y, H - 10], [70, y + (y < 0 ? -12 : 12), H + 22]], 3.5, WC.log, { S: 5, M: 2 }); }
    G.tube([[60, -hl - 24, H], [60, hl + 24, H]], 7, WC.logD, { S: 6, M: 6 });
    for (let y = -hl; y <= hl + 1; y += len / 4) G.tube([[64, y, H + 6], [60 - D, y, -6]], 4.5, WC.log, { S: 5, M: 5 });
    G.surf((u, v) => { const x = 66 - (D + 6) * v, z = H + 14 - (H + 10) * v; return [x, -hl - 20 + u * (len + 40), z + ((u * 9) % 1) * 4]; }, 0, 1, 10, 0, 1, 6, (u) => [0x6a5848, 0x5a4a3c, 0x7a6650][Math.floor(u * 10) % 3]);
    G.blob(-40, 0, 8, 80, hl - 20, 9, 0x7a6a3a, { nu: 10, nv: 4 });
  })];
}

// ---- a standing stone: a rough slab stood on end, leaning a little, lichen and moss on it, its foot sunk in the turf
export function standingStone(h = 300, seed = 1) {
  h = q(h, 20);
  return ['dmenhir|' + [h, seed % 5].join('|'), shape((G) => {
    const R = rng(seed * 83 + h), w = h * (0.26 + R() * 0.08), d = h * (0.14 + R() * 0.05), lean = (R() - 0.5) * 8, base = WC.stone[seed % 4];
    const b = G.n; G.blob(0, 0, h / 2 - 12, w, d, h / 2 + 12, (nx, ny, nz) => (nz > 0.7 ? WC.lichen : wob(nx * 4 + seed, nz * 5) > 0.55 ? WC.moss : wob(ny * 6, nz * 7 + seed) > 0.6 ? 0xa8a68a : base), { e: 3, nu: 10, nv: 8, warp: (x, y, z) => [x * (1 - 0.18 * (z / h)) + wob(z * 0.02 + seed, 1) * 8, y * (1 - 0.1 * (z / h)), z + wob(x * 0.03, y * 0.03 + seed) * 10] });
    G.place(b, { pitch: lean });
    G.blob(0, 0, 3, w * 1.2, d * 1.4, 5, WC.moss, { nu: 10, nv: 3 });
  })];
}
// ---- the altar stone: a flat slab on two squat stones, a little offering of a bowl and a candle stub on it
export function altarStone() {
  return ['daltar', shape((G) => {
    for (const y of [-90, 90]) G.blob(0, y, 34, 46, 34, 36, WC.stone[(y > 0) + 1], { e: 3, nu: 8, nv: 6 });
    G.blob(0, 0, 80, 74, 150, 14, (nx, ny, nz) => (nz > 0.6 && wob(nx * 3, ny * 3) > 0.4 ? WC.lichen : WC.stone[0]), { e: 4, nu: 10, nv: 5 });
    G.lathe([[0, 94], [14, 94], [18, 102], [16, 104], [0, 100]], 0x8a6a48, 10, [0, -40, 0]);
    G.lathe([[5, 94], [5, 108], [0, 110]], 0xe8e0c8, 6, [10, 50, 0]);
  })];
}

// ---- a footbridge along X over a brook: stone abutments at either end, two log stringers on them, a plank deck
// (its top at FB.deck) and a rail each side on posts. L long, W wide.
export const FB = { deck: 34 };
export function footbridge(L = 760, W = 230) {
  L = q(L, 20); W = q(W, 10);
  return ['dbridge|' + [L, W].join('|'), shape((G) => {
    const hl = L / 2, hw = W / 2, top = FB.deck;
    for (const s of [-1, 1]) G.blob(s * (hl - 50), 0, 12, 70, hw + 30, 22, (nx, ny, nz) => WC.stone[Math.floor((nx + 2) * 3 + ny * 5) & 3], { e: 4, nu: 10, nv: 4 });
    for (const y of [-hw * 0.6, hw * 0.6]) G.tube([[-hl, y, top - 16], [hl, y, top - 16]], 12, WC.log, { S: 8, M: 10 });
    for (let x = -hl + 12; x < hl - 6; x += 24) G.blob(x, 0, top - 3.5, 11, hw + 6 + ((x / 24) % 2) * 3, 3.5, Math.round(x / 24) % 3 ? 0x8a6a48 : 0x7a5c3e, { e: 8, nu: 4, nv: 3 });
    for (const s of [-1, 1]) { for (let x = -hl + 30; x <= hl - 29; x += (L - 60) / 4) G.tube([[x, s * (hw - 4), top - 20], [x, s * (hw - 4), top + 96]], 6, WC.log, { S: 6, M: 4 }); G.tube([[-hl + 24, s * (hw - 4), top + 92], [hl - 24, s * (hw - 4), top + 92]], 5.5, WC.logD, { S: 6, M: 10 }); }
  })];
}

// ---- a waymarker: a squared stone post with a rounded head, a carved arrow on its face (+X) and moss at its foot
export function waymarker() {
  return ['dwaymark', shape((G) => {
    G.blob(0, 0, 80, 22, 22, 86, (nx, ny, nz) => (nz > 0.8 ? WC.lichen : wob(ny * 5, nz * 5) > 0.6 ? WC.moss : WC.stone[2]), { e: 5, nu: 8, nv: 6 });
    G.blob(22, 0, 120, 1.5, 3, 30, 0x3a3a34, { e: 6, nu: 4, nv: 3 }); for (const s of [-1, 1]) G.blob(22, s * 9, 140, 1.5, 3, 12, 0x3a3a34, { e: 6, nu: 4, nv: 3 });
    G.blob(0, 0, 4, 34, 34, 6, WC.moss, { nu: 8, nv: 3 });
  })];
}

// ---- a hunter's hide: a plank platform at HD.deck on four poles, a rail round three sides, a canvas roof on the back
// poles, a ladder up the open front (+X)
export const HD = { deck: 300, w: 260 };
export function hide() {
  return ['dhide', shape((G) => {
    const hw = HD.w / 2, dz = HD.deck;
    for (const [x, y] of [[-hw, -hw], [-hw, hw], [hw, -hw], [hw, hw]]) G.tube([[x, y, -10], [x, y, x < 0 ? dz + 230 : dz + 110]], 9, WC.log, { S: 7, M: 6 });
    for (const s of [-1, 1]) G.tube([[-hw - 10, s * hw, dz - 14], [hw + 10, s * hw, dz - 14]], 8, WC.logD, { S: 6, M: 4 });
    for (let x = -hw + 10; x < hw; x += 22) G.blob(x, 0, dz - 2, 10, hw + 8, 3.5, Math.round(x / 22) % 2 ? 0x8a6a48 : 0x7a5c3e, { e: 8, nu: 4, nv: 3 });
    for (const [a, b] of [[[-hw, -hw], [-hw, hw]], [[-hw, -hw], [hw, -hw]], [[-hw, hw], [hw, hw]]]) G.tube([[a[0], a[1], dz + 90], [b[0], b[1], dz + 90]], 4.5, WC.logD, { S: 5, M: 4 });
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const t = (i + 1) / 4; G.tube([[-hw + t * HD.w, s * hw, dz], [-hw + t * HD.w, s * hw, dz + 90]], 3, WC.log, { S: 4, M: 2 }); }
    G.surf((u, v) => [-hw - 30 + (HD.w + 50) * v, -hw - 30 + u * (HD.w + 60), dz + 236 - 126 * v + Math.sin(u * Math.PI * 3) * 3], 0, 1, 6, 0, 1, 4, (u) => (Math.floor(u * 6) % 2 ? WC.canvas : WC.canvasD));
    { const b = G.n; for (const s of [-1, 1]) G.tube([[0, s * 26, 0], [0, s * 26, dz + 40]], 4, WC.log, { S: 5, M: 6 }); for (let z = 30; z < dz + 20; z += 34) G.tube([[0, -28, z], [0, 28, z]], 2.6, WC.logD, { S: 4, M: 2 }); G.place(b, { x: hw + 70, y: 0, z: 0, pitch: -13 }); }
  })];
}

// ---- the wood's sign: a timber arch over the way in, two rough posts and a beam, the name board hung under it on
// chains (the name itself is the map's: a Sign). Spans Y, w between the posts.
export function woodArch(w = 600) {
  w = q(w, 20);
  return ['dwoodarch|' + w, shape((G) => {
    const hw = w / 2, H = 440;
    for (const s of [-1, 1]) { G.tube([[0, s * hw, -12], [0, s * hw, H + 10]], 17, barkC(s + 3, WC.bark[1]), { S: 9, M: 6 }); G.tube([[0, s * hw, H - 120], [0, s * (hw - 90), H - 8]], 7, WC.log, { S: 6, M: 3 }); G.blob(0, s * hw, 2, 34, 34, 8, WC.moss, { nu: 8, nv: 3 }); }
    G.tube([[0, -hw - 50, H], [0, hw + 50, H]], 15, barkC(7, WC.bark[0]), { S: 9, M: 10 });
    for (const s of [-1, 1]) G.tube([[0, s * 150, H - 14], [0, s * 150, H - 60]], 1.4, WC.iron, { S: 4, M: 3, caps: false });
    G.blob(0, 0, H - 92, 5, 190, 36, 0x6a4e34, { e: 8, nu: 6, nv: 3 }); G.blob(0, 0, H - 92, 6, 182, 30, 0x5a4028, { e: 8, nu: 6, nv: 3 });
  })];
}

// ---- an old floor of flagstones in the forest: rings of flat stones, moss in the joints, lichen on some, a few gone
// at the ragged edge, a round stone at the middle
export function flagFloor(r = 900, seed = 1) {
  r = q(r, 50);
  return ['dflags|' + [r, seed % 2].join('|'), shape((G) => {
    const R = rng(seed * 19 + r);
    G.blob(0, 0, 0.6, r, r, 0.8, WC.moss, { nu: 24, nv: 2 });
    for (let ring = 0, rr = 110; rr < r - 40; ring++, rr += 92) {
      const n = Math.max(1, Math.round((2 * Math.PI * rr) / 104));
      for (let i = 0; i < n; i++) { if (R() < 0.12 && rr > r * 0.6) continue; const a = (i / n) * Math.PI * 2 + ring * 0.37 + R() * 0.08, b = G.n; G.blob(0, 0, 0, 40 + R() * 6, Math.min(44, (Math.PI * rr) / n - 6), 2.2, (nx, ny, nz) => (nz > 0.5 && wob(nx * 3 + i, ny * 3 + ring) > 0.55 ? WC.lichen : WC.stone[(i + ring) % 4]), { e: 3, nu: 6, nv: 2 }); G.place(b, { x: Math.cos(a) * rr, y: Math.sin(a) * rr, z: 1.8, yaw: (a * 180) / Math.PI }); }
    }
    G.blob(0, 0, 2, 64, 64, 2.4, WC.stone[2], { e: 3, nu: 10, nv: 2 });
  })];
}
// ---- a rain barrel: staves and hoops, the water dark in it
export function rainBarrel(seed = 1) {
  return ['drainbarrel|' + (seed % 2), shape((G) => {
    G.lathe([[30, 0], [34, 30], [35, 54], [33, 84], [31, 88]], (k) => (k % 2 ? 0x6e5238 : 0x7a5c40), 14);
    for (const z of [12, 46, 78]) G.lathe([[34.5 + (z === 46 ? 1 : 0), z - 3], [35 + (z === 46 ? 1 : 0), z + 3]], WC.iron, 14);
    G.lathe([[0, 82], [30, 82]], 0x1e2a2a, 14);
  })];
}
