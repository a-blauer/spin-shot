// Sculpted shapes for the Descent's furnishings: cloth that hangs and drapes, cushions, barrels, trees, mushrooms,
// figures, chains and vines. Each returns [key, build] for world.Shape(); keys carry every number the shape depends
// on (rounded, so near-identical props share one batch). Local frames: X along the thing's length, Y its depth, Z up;
// hung things have their hanging line at z = 0 and fall toward -Z.
import { shape, sstep, wob } from './propkit.js';

const q = (v, s = 10) => Math.round(v / s) * s;
const hx = (c) => (c >>> 0).toString(16);
const dark = (c, k) => { const r = Math.round(((c >> 16) & 255) * k), g = Math.round(((c >> 8) & 255) * k), b = Math.round((c & 255) * k); return (Math.min(255, r) << 16) | (Math.min(255, g) << 8) | Math.min(255, b); };
const rng = (seed) => { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };

// A cloth hung from a rod: folds that deepen toward the hem, a band of trim at the hem, a pointed or swallow-tailed foot,
// a rod with turned finials. w across, h down to the start of the foot.
export function banner(w, h, col, trim, { rod = 0x2a2018, foot = 'point', tip = 70, folds = 0, finial = trim, emblem = null } = {}) {
  w = q(w); h = q(h); tip = q(tip);
  const nf = folds || Math.max(2, Math.round(w / 70)), band = Math.min(22, h * 0.1);
  return ['banner|' + [w, h, hx(col), hx(trim), hx(rod), foot, tip, nf, hx(finial), emblem ? hx(emblem) : 0].join('|'), shape((G) => {
    const L = (u) => h + (foot === 'point' ? tip * (1 - Math.abs(2 * u - 1)) : foot === 'tails' ? tip * Math.abs(2 * u - 1) : 0);
    const Y = (u, s) => { const fold = Math.sin(u * Math.PI * 2 * nf + 0.6) * (4 + 15 * s) * (0.6 + 0.4 * Math.sin(u * Math.PI)) + wob(u * 6, s * 3) * 4 * s, belly = 8 * Math.sin(u * Math.PI) * s; return fold + belly; };
    const pt = (u, z, s) => [(u - 0.5) * w * (1 - 0.04 * s * Math.sin(u * Math.PI)), Y(u, s), z];
    const nu = Math.max(12, nf * 6);
    G.surf((u, v) => { const l = L(u) - band; return pt(u, -6 - v * l, (6 + v * l) / (h + tip)); }, 0, 1, nu, 0, 1, 10, col);
    G.surf((u, v) => { const l = L(u), z = -6 - (l - band) - v * band; return pt(u, z, -z / (h + tip)); }, 0, 1, nu, 0, 1, 1, trim);
    // a sleeve round the rod
    G.surf((u, v) => { const a = v * Math.PI * 2; return [(u - 0.5) * w, Math.sin(a) * 8, Math.cos(a) * 8 - 2]; }, 0, 1, nu, 0, 1, 8, dark(col, 0.85), false);
    if (emblem) {   // a lozenge sewn on the face, riding the folds
      const cz = -(h * 0.45), r = Math.min(w, h) * 0.22;
      G.surf((u, v) => { const a = u * Math.PI * 2, rr = v * r, x = Math.cos(a) * rr * 0.8, z = cz + Math.sin(a) * rr * 1.1, uu = 0.5 + x / w, s = -z / (h + tip); return [x, Y(uu, s) + 1.2, z]; }, 0, 1, 4, 0, 1, 2, emblem, true);
    }
    G.tube([[-w / 2 - 26, 0, 0], [w / 2 + 26, 0, 0]], 5, rod, { S: 8, caps: false });
    for (const e of [-1, 1]) { const b = G.n; G.lathe([[0, -11], [7, -9], [10, -2], [6, 4], [9, 9], [0, 14]], finial, 10); G.place(b, { x: e * (w / 2 + 34), pitch: e * 90 }); }
  })];
}

// A rug on the floor: a field, a border, ends that curl up a touch, a fringe at each short end. w along X, d along Y.
export function rug(w, d, col, edge) {
  w = q(w, 20); d = q(d, 20);
  return ['rug|' + [w, d, hx(col), hx(edge)].join('|'), shape((G) => {
    const b = Math.min(28, Math.min(w, d) * 0.12), Z = (x, y) => 0.8 + 3 * sstep(w / 2 - 22, w / 2, Math.abs(x)) + 1.2 * sstep(d / 2 - 14, d / 2, Math.abs(y)) + wob(x * 0.01, y * 0.013) * 0.4;
    const S = (x0, x1, y0, y1, c, nx, ny) => G.surf((u, v) => { const x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * v; return [x, y, Z(x, y)]; }, 0, 1, nx, 0, 1, ny, c);
    const W = w / 2, D = d / 2;
    S(-W + b, W - b, -D + b, D - b, col, 10, 6);
    S(-W, W, -D, -D + b, edge, 12, 1); S(-W, W, D - b, D, edge, 12, 1); S(-W, -W + b, -D + b, D - b, edge, 2, 6); S(W - b, W, -D + b, D - b, edge, 2, 6);
    // an inner line of the edge colour
    S(-W + b + 10, W - b - 10, -D + b + 10, -D + b + 15, edge, 8, 1); S(-W + b + 10, W - b - 10, D - b - 15, D - b - 10, edge, 8, 1);
    const fr = dark(edge, 1.25);
    for (const e of [-1, 1]) for (let y = -D + 6; y <= D - 6; y += 12) G.surf((u, v) => [e * (W + v * 16), y + (u - 0.5) * 6, 1 + v * 0.2], 0, 1, 1, 0, 1, 1, fr);
  })];
}

// A barrel: bellied staves, two pairs of hoops, a lid sunk inside the chime. Stands on z = 0. d across the belly, h tall.
export function barrel(col, hoop, d = 86, h = 110) {
  return ['barrel|' + [hx(col), hx(hoop), d, h].join('|'), shape((G) => {
    const R = d / 2, r0 = R * 0.84, at = (z) => r0 + (R - r0) * Math.sin((z / h) * Math.PI), prof = [], cs = [];
    const pt = (r, z, c) => { prof.push([r, z]); if (c !== undefined) cs.push(c); };   // c: the colour of the span that starts here
    const hoopAt = (z0, z1, out) => { pt(at(z0), z0, hoop); pt(at(z0) + out, z0, hoop); pt(at(z1) + out, z1, hoop); pt(at(z1), z1, col); };
    hoopAt(0, 6, 2); hoopAt(14, 22, 2.5);
    for (let z = 30; z <= h - 30; z += 8) pt(at(z), z, col);
    hoopAt(h - 22, h - 14, 2.5); hoopAt(h - 6, h, 2);
    cs[cs.length - 1] = hoop; pt(r0 - 4, h, dark(col, 0.7)); pt(r0 - 4, h - 6);
    G.lathe(prof, (k) => cs[k], 18);
  })];
}

// A soft block: a cushion, a mattress, a bolster. Half sizes, how square, how much it puffs.
export function cushion(a, b, c, col, { e = 5, puff = 0.18, piping = null } = {}) {
  return ['cushion|' + [q(a, 2), q(b, 2), q(c, 2), hx(col), e, puff, piping ? hx(piping) : 0].join('|'), shape((G) => {
    G.blob(0, 0, 0, a, b, c, col, { e, nu: 24, nv: 14, warp: (x, y, z, nx, ny, nz) => { const k = 1 + puff * (1 - Math.abs(nz)) * 0.2 + (z > 0 ? puff * 0.5 * (1 - (x / a) ** 2) * (1 - (y / b) ** 2) : 0); return [x * (1 - puff * 0.12 * (z / c) ** 2), y * (1 - puff * 0.12 * (z / c) ** 2), z * k]; } });
    if (piping) { const pts = []; for (let i = 0; i <= 32; i++) { const t = (i / 32) * Math.PI * 2, ct = Math.cos(t), st = Math.sin(t), sp = (v) => Math.sign(v) * Math.pow(Math.abs(v), 2 / e); pts.push([a * sp(ct), b * sp(st), 0]); } G.tube(pts, 1.6, piping, { S: 6, caps: false }); }
  })];
}

// A blanket thrown over a mattress: flat on top, falling over three sides with a wavy hem. Top at z = 0.
export function blanket(len, wid, drop, col, fold = 0xd8d0c0) {
  return ['blanket|' + [q(len, 4), q(wid, 4), q(drop, 2), hx(col), hx(fold)].join('|'), shape((G) => {
    // u along the bed (0 head .. 1 foot) and round the cross-section: s in [-1, 1] across the top, past it down the sides
    const half = wid / 2, R = 7;
    const sec = (s, x) => {   // a point across the blanket: s from -1 (bottom of the left side) to 1 (bottom of the right)
      const top = half - R, span = top * 2 + Math.PI * R + drop * 2, d = ((s + 1) / 2) * span;
      const hem = (Math.sin(x * 0.09) * 3 + wob(x * 0.02) * 2) * sstep(0, 1, 0);
      if (d < drop) { const z = -R - (drop - d); return [-half - 1.5 + (drop - d) * 0.04, z + (d < 6 ? hem : 0)]; }
      if (d < drop + (Math.PI * R) / 2) { const a = Math.PI - ((d - drop) / R); return [-top + Math.cos(a) * (R + 1.5), -R + Math.sin(a) * (R + 1.5)]; }
      if (d < drop + (Math.PI * R) / 2 + top * 2) return [-top + (d - drop - (Math.PI * R) / 2), 1.5];
      const d2 = d - drop - (Math.PI * R) / 2 - top * 2;
      if (d2 < (Math.PI * R) / 2) { const a = Math.PI / 2 - d2 / R; return [top + Math.cos(a) * (R + 1.5), -R + Math.sin(a) * (R + 1.5)]; }
      const d3 = d2 - (Math.PI * R) / 2; return [half + 1.5 + d3 * 0.04, -R - d3];
    };
    G.surf((u, v) => { const x = -len / 2 + u * len, [y, z] = sec(v * 2 - 1, x); const sag = Math.sin(u * Math.PI * 5 + v * 3) * 1.4 * Math.abs(v * 2 - 1); return [x, y + sag * 0.3, z + sag * (Math.abs(v * 2 - 1) > 0.85 ? 1 : 0.2)]; }, 0, 1, 18, 0, 1, 26, col);
    // the turned-down sheet at the head end
    G.surf((u, v) => { const x = -len / 2 - 2 + u * 18, [y, z] = sec(v * 2 - 1, 0); return [x, y * 1.01, z + 1.2]; }, 0, 1, 2, 0, 1, 26, fold);
  })];
}

// A canvas awning: a sloping roof of stripes that sags between the posts and ends in a scalloped valance.
// len along X, dep along Y (front at +Y), falling `fall` from back to front; z = 0 at the back edge.
export function awning(len, dep, fall, c1, c2, n = 6) {
  len = q(len); dep = q(dep);
  return ['awning|' + [len, dep, q(fall, 2), hx(c1), hx(c2), n].join('|'), shape((G) => {
    const Z = (x, y) => -fall * (y + dep / 2) / dep - 7 * Math.sin(((y + dep / 2) / dep) * Math.PI) * (0.6 + 0.4 * Math.cos((x / len) * Math.PI * 2 * 0.5));
    for (let i = 0; i < n; i++) {
      const x0 = -len / 2 + (len * i) / n, x1 = x0 + len / n, c = i % 2 ? c1 : c2;
      G.surf((u, v) => { const x = x0 + (x1 - x0) * u, y = -dep / 2 + dep * v; return [x, y, Z(x, y)]; }, 0, 1, 3, 0, 1, 6, c);
      // valance: a scallop hanging off the front edge
      G.surf((u, v) => { const x = x0 + (x1 - x0) * u, yf = dep / 2, z0 = Z(x, yf), dd = 22 + 12 * Math.sin(u * Math.PI); return [x, yf + v * 2, z0 - v * dd]; }, 0, 1, 6, 0, 1, 2, c);
    }
  })];
}

// A bale of hay: a soft block, straw ends ragged, two loops of twine pulled tight into it. 140 x 90 x 80, on z = 0.
export function hay(col, twine = 0x6a5420) {
  return ['hay|' + hx(col) + '|' + hx(twine), shape((G) => {
    const a = 70, b = 45, c = 40, lo = dark(col, 0.8), hi = dark(col, 1.14);
    const straw = (x, y, z) => { const w = wob(y * 9 + z * 7, z * 5 - y * 3); return w > 0.5 ? lo : w < -0.62 ? hi : col; };
    G.blob(0, 0, c, a, b, c, (x, y, z) => straw(x, y, z), { e: 16, nu: 36, nv: 18, warp: (x, y, z) => {
      const end = sstep(a - 10, a, Math.abs(x)), r = (wob(y * 0.15, z * 0.17) * 3 + 1.5) * end;   // the cut ends are ragged
      const pull = 1 - 0.035 * Math.max(sstep(9, 0, Math.abs(Math.abs(x) - 36)), 0);         // the twine draws it in
      return [x + Math.sign(x) * r, y * pull, (z) * pull + c * (1 - pull) * 0];
    } });
    for (const e of [-1, 1]) { const pts = []; for (let i = 0; i <= 28; i++) { const t = (i / 28) * Math.PI * 2, sp = (v) => Math.sign(v) * Math.pow(Math.abs(v), 2 / 16); pts.push([e * 36, b * 0.975 * sp(Math.cos(t)), c + c * 0.975 * sp(Math.sin(t))]); } G.tube(pts, 2, twine, { S: 5, caps: false }); }
  })];
}

// A dead tree: a trunk that flares into roots, leans, forks into crooked limbs that fork again. Base at z = 0.
export function deadTree(h, col, seed = 1) {
  h = q(h, 20); seed = Math.abs(Math.round(seed)) % 7 + 1;
  return ['tree|' + [h, hx(col), seed].join('|'), shape((G) => {
    const R = rng(seed * 977), bark = (t, a) => (wob(t * 9 + a * 2.1, a * 3) > 0.45 ? dark(col, 0.72) : wob(t * 4, a * 1.7 + 2) > 0.62 ? dark(col, 1.25) : col);
    const lean = [R() * 30 - 15, R() * 30 - 15], top = h * 0.62, r0 = 34;
    const trunk = []; for (let i = 0; i <= 6; i++) { const t = i / 6; trunk.push([lean[0] * t * t + wob(t * 3, seed) * 6, lean[1] * t * t + wob(seed, t * 3) * 6, t * top]); }
    G.tube(trunk, (t) => r0 * (1 - 0.5 * t) + 22 * sstep(0.18, 0, t), bark, { S: 12, M: 18 });
    for (let i = 0; i < 5; i++) {   // roots: flattened, running out and down into the floor
      const a = (i / 5) * Math.PI * 2 + R(), len = 70 + R() * 60, c = Math.cos(a), s = Math.sin(a);
      G.tube([[c * 14, s * 14, 26], [c * len * 0.5, s * len * 0.5, 10], [c * len, s * len, -4]], (t) => 16 * (1 - 0.75 * t), bark, { S: 8, flat: () => [1, 0.6] });
    }
    const limb = (p, dir, len, r, depth) => {
      const pts = [p]; let [x, y, z] = p, [dx, dy, dz] = dir;
      for (let k = 1; k <= 4; k++) { dx += (R() - 0.5) * 0.5; dy += (R() - 0.5) * 0.5; dz += (R() - 0.35) * 0.3; const L = Math.hypot(dx, dy, dz); dx /= L; dy /= L; dz /= L; x += dx * len / 4; y += dy * len / 4; z += dz * len / 4; pts.push([x, y, z]); }
      G.tube(pts, (t) => Math.max(1.5, r * (1 - 0.8 * t)), bark, { S: depth ? 6 : 8, M: depth ? 6 : 10 });
      if (depth < 2) { const n = depth ? 2 : 2 + (R() < 0.5 ? 1 : 0); for (let j = 0; j < n; j++) { const at = pts[2 + (j % 2)], a = R() * Math.PI * 2; limb(at, [dx + Math.cos(a) * 0.9, dy + Math.sin(a) * 0.9, dz + 0.2], len * (0.5 + R() * 0.15), r * 0.5, depth + 1); } }
    };
    const n = 4;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + R() * 0.8, f = 0.5 + 0.12 * i / n + R() * 0.08, t = f / 0.62 > 1 ? 1 : f / 0.62, at = [lean[0] * t * t, lean[1] * t * t, h * f];
      limb(at, [Math.cos(a), Math.sin(a), 0.7 + R() * 0.6], h * (0.32 + R() * 0.14), r0 * 0.45, 0);
    }
    limb([lean[0], lean[1], top - 4], [lean[0] * 0.02, lean[1] * 0.02, 1], h * 0.38, r0 * 0.5, 0);
  })];
}

// A toadstool: a bulbed stem with a ring, a domed cap with a lip, gills beneath and pale spots. h the stem's height, w the
// cap across. Base at z = 0.
export function mushroom(h, w, cap, stem, spots = 0xf0e8d8, seed = 1) {
  h = q(h); w = q(w);
  return ['shroom|' + [h, w, hx(cap), hx(stem), hx(spots), seed % 5].join('|'), shape((G) => {
    const r = h * 0.08, bend = (z) => [Math.sin((z / h) * 1.4) * h * 0.04 * ((seed % 3) - 1), 0];
    const prof = [[r * 2.1, 0], [r * 2.2, h * 0.04], [r * 1.7, h * 0.14], [r * 1.25, h * 0.3], [r * 1.05, h * 0.55], [r * 1.0, h * 0.7], [r * 1.9, h * 0.72], [r * 1.7, h * 0.75], [r * 1.05, h * 0.77], [r * 1.1, h * 0.99], [0, h]];
    const b0 = G.n; G.lathe(prof, (k) => (k === 5 || k === 6 ? dark(stem, 0.88) : stem), 14);
    G.map(b0, ([x, y, z]) => { const [bx, by] = bend(z); return [x + bx, y + by, z]; });
    const R = w / 2, H = w * 0.42, [tx] = bend(h);
    // the cap: a dome down to a lip, curling under; then the gills, darker, back up to the stem
    const capP = [[R * 0.98, h - 4], [R, h + H * 0.06], [R * 0.93, h + H * 0.32], [R * 0.75, h + H * 0.62], [R * 0.45, h + H * 0.88], [R * 0.2, h + H * 0.98], [0, h + H]];
    const b1 = G.n; G.lathe(capP, cap, 22); G.lathe([[r * 1.2, h + 2], [R * 0.6, h + 1], [R * 0.97, h - 3]], dark(cap, 0.55), 22);
    G.map(b1, ([x, y, z]) => [x + tx, y, z]);
    const Rr = rng(seed * 131 + h);
    for (let i = 0; i < 9; i++) {   // spots lie on the dome
      const a = Rr() * Math.PI * 2, k = 0.3 + Rr() * 0.6, rr = R * (k < 0.9 ? 1 - k * k * 0.1 : 0.9) * Math.sin(k * Math.PI / 2), zz = h + H * Math.cos(k * Math.PI / 2) * 0.98 + 1, s = R * (0.07 + Rr() * 0.06);
      const cx = Math.cos(a) * rr * 0.96 + tx, cy = Math.sin(a) * rr * 0.96, nx = Math.cos(a) * Math.sin(k * 1.4), nz = Math.cos(k * 1.4);
      const b2 = G.n; G.blob(0, 0, 0, s, s, s * 0.25, spots, { e: 2, nu: 8, nv: 4 });
      G.place(b2, { x: cx, y: cy, z: zz, yaw: (a * 180) / Math.PI, pitch: Math.atan2(nx, nz) * 57.3 * 0.9 });
    }
  })];
}

// A robed figure for a plinth: the robe falls in folds from the shoulders to a hem that pools, a hood or bare head, arms
// in sleeves (one raised for pose 1). h is the figure's height; base at z = 0; it faces +Y.
export function statue(h, col, pose = 0) {
  h = q(h);
  return ['statue|' + [h, hx(col), pose].join('|'), shape((G) => {
    const s = h / 250, shade = dark(col, 0.82), fold = (a, z) => 1 + 0.07 * Math.sin(a * 7 + z * 0.02) * sstep(150 * s, 20 * s, z);
    // the robe: lathe profile, then folds pushed in and out round it
    const prof = [[52, 0], [56, 6], [50, 30], [42, 70], [34, 110], [30, 130], [36, 150], [42, 168], [40, 178], [22, 186], [14, 192]].map(([r, z]) => [r * s, z * s]);
    const b0 = G.n; G.lathe(prof, (k) => (k === 0 ? shade : col), 24, [0, 0, 0], [1, 0.72]);
    G.map(b0, ([x, y, z]) => { const a = Math.atan2(y, x), k = fold(a, z); return [x * k, y * k, z]; });
    // a cord at the waist
    const belt = []; for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2; belt.push([Math.cos(a) * 31 * s, Math.sin(a) * 31 * s * 0.72, 128 * s]); } G.tube(belt, 2.4 * s, shade, { S: 6, caps: false });
    // the head under a hood
    G.blob(0, 2 * s, 212 * s, 17 * s, 19 * s, 22 * s, col, { e: 2.2, nu: 16, nv: 10 });
    // the hood: a cowl round the back and top of the head, its front edge framing the face, falling to the shoulders
    G.surf((u, v) => { const a = -Math.PI * 0.08 + u * Math.PI * 1.16, ph = v * Math.PI * 0.62, R = 23 * s + 6 * s * v * v, x = Math.cos(a) * Math.sin(ph + 0.6) * R * 1.05, y = -Math.sin(a) * Math.sin(ph + 0.6) * R - 4 * s, z = 214 * s + Math.cos(ph + 0.6) * R * 1.15 - v * v * 26 * s; return [x, y, z]; }, 0, 1, 16, 0, 1, 8, shade);
    G.surf((u, v) => { const a = Math.PI * (1.08 + u * 0.84), ph = v * Math.PI * 0.62, R = 23 * s + 6 * s * v * v, x = Math.cos(a) * Math.sin(ph + 0.6) * R * 1.05, y = -Math.sin(a) * Math.sin(ph + 0.6) * R * 0.55 - 4 * s, z = 214 * s + Math.cos(ph + 0.6) * R * 1.15 - v * v * 26 * s; return [x, y, z]; }, 0, 1, 10, 0, 1, 8, shade);
    // sleeves: one hangs, one is raised or folded across
    const arm = (e, up) => {
      const sh = [e * 34 * s, 0, 172 * s], el = up ? [e * 52 * s, 16 * s, 214 * s] : [e * 40 * s, 10 * s, 118 * s], wr = up ? [e * 46 * s, 30 * s, 270 * s] : [e * 18 * s, 26 * s, 112 * s];
      G.tube([sh, el, wr], (t) => (13 + 6 * t) * s, col, { S: 10 });
      G.blob(wr[0], wr[1] + 2 * s, wr[2] + (up ? 8 : 0) * s, 7 * s, 7 * s, 9 * s, col, { e: 2, nu: 8, nv: 6 });
    };
    arm(-1, false); arm(1, pose === 1);
  })];
}

// A chain: oval links, each turned a quarter to the last, hanging `len` down from z = 0.
export function chain(len, col = 0x2a2e30, link = 30) {
  len = q(len, link * 0.7);
  return ['chain|' + [len, hx(col), link].join('|'), shape((G) => {
    const pitch = link * 0.7, n = Math.max(1, Math.floor(len / pitch));
    for (let i = 0; i < n; i++) {
      const pts = []; for (let k = 0; k <= 16; k++) { const a = (k / 16) * Math.PI * 2; pts.push([Math.cos(a) * link * 0.26, 0, Math.sin(a) * link * 0.5]); }
      const b = G.n; G.tube(pts, link * 0.075, col, { S: 6, caps: false, M: 16 }); G.place(b, { z: -link * 0.5 - i * pitch, yaw: i % 2 ? 90 : 0 });
    }
  })];
}

// A vine hanging from the roof: a stem that twists as it falls, with leaves along it and a curl at the end.
export function vine(len, col, leaf, seed = 1) {
  len = q(len, 20);
  return ['vine|' + [len, hx(col), hx(leaf), seed % 6].join('|'), shape((G) => {
    const R = rng(seed * 53 + len), amp = 10 + R() * 10, tw = 2 + R() * 2, pts = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10, a = t * tw * Math.PI; pts.push([Math.cos(a) * amp * t, Math.sin(a) * amp * t, -t * len]); }
    const a = tw * Math.PI; for (let i = 1; i <= 3; i++) { const b = a + i * 1.6; pts.push([Math.cos(b) * (amp + 8 - i * 4), Math.sin(b) * (amp + 8 - i * 4), -len - i * 6]); }
    G.tube(pts, (t) => 4.5 * (1 - 0.6 * t), col, { S: 6 });
    for (let i = 1; i < 10; i++) {
      const p = pts[i], d = R() * Math.PI * 2, L = 18 + R() * 12, W = L * 0.45, b = G.n;
      G.surf((u, v) => { const x = u * L, y = (v - 0.5) * W * Math.sin(u * Math.PI) * 2, z = -Math.sin(u * Math.PI * 0.8) * 4 - Math.abs(v - 0.5) * 3; return [x, y, z]; }, 0, 1, 4, 0, 1, 2, i % 3 ? leaf : dark(leaf, 0.8));
      G.place(b, { x: p[0], y: p[1], z: p[2], yaw: (d * 180) / Math.PI, pitch: 30 });
    }
  })];
}

// A web strung across a corner or between two things: radial threads and a spiral, sagging a little. r its reach.
export function web(r, col = 0xd8d8d0) {
  r = q(r, 20);
  return ['web|' + [r, hx(col)].join('|'), shape((G) => {
    const n = 9, th = 0.9, sag = (rr) => -rr * 0.12;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + 0.2 * Math.sin(i * 3.1), e = r * (0.85 + 0.15 * Math.sin(i * 2.3)); G.tube([[0, 0, 0], [Math.cos(a) * e * 0.5, sag(e * 0.5), Math.sin(a) * e * 0.5], [Math.cos(a) * e, 0, Math.sin(a) * e]], th, col, { S: 4, caps: false, M: 8 }); }
    const sp = []; for (let k = 0; k <= n * 6; k++) { const a = (k / n) * Math.PI * 2, rr = r * 0.12 + (k / (n * 6)) * r * 0.72; sp.push([Math.cos(a) * rr, sag(rr) * 0.8, Math.sin(a) * rr]); }
    G.tube(sp, th * 0.8, col, { S: 4, caps: false, M: n * 6 * 4 });
  })];
}

// A stage curtain: deep pleats from a rod at z = 0 down `h` to a hem that just breaks on the floor, tied back toward one
// side (side = -1 or 1) with a cord at `tie` of the way down. w across when hanging free.
export function curtain(w, h, col, side = 1, tie = 0.62, cord = 0xd8b04a) {
  w = q(w); h = q(h);
  return ['curtain|' + [w, h, hx(col), side, tie, hx(cord)].join('|'), shape((G) => {
    const nf = Math.max(4, Math.round(w / 55)), xs = side * w / 2, lo = dark(col, 0.7);
    const pinch = (v) => (v < tie ? sstep(0, tie, v) ** 1.6 : 1 - 0.55 * sstep(tie, 1, v));   // 0 free .. 1 drawn into the tie
    const P = (u, v) => {
      const x0 = (u - 0.5) * w, k = pinch(v) * 0.86, x = x0 + (xs - x0) * k, A = 7 + 10 * k + 4 * v;   // gathered cloth pleats deeper
      const y = Math.sin(u * Math.PI * 2 * nf) * A + wob(u * 7, v * 4) * 3, pool = sstep(0.96, 1, v) * 10;
      return [x + (v > tie ? side * 30 * (v - tie) : 0), y + pool * Math.sin(u * 9), -v * h];
    };
    G.surf(P, 0, 1, nf * 8, 0, 1, 26, (u, v) => (Math.sin(u * Math.PI * 2 * nf) < -0.55 ? lo : col));
    // the tie: a cord round the gathered cloth, with a tassel
    const [cx] = P(0.5, tie), r = w * 0.07 + 18, pts = [];
    for (let i = 0; i <= 18; i++) { const a = (i / 18) * Math.PI * 2; pts.push([cx + Math.cos(a) * r * 1.1, Math.sin(a) * 30, -tie * h + Math.sin(a * 2) * 4]); }
    G.tube(pts, 3, cord, { S: 6, caps: false });
    G.lathe([[0, 0], [4, -2], [9, -14], [11, -40], [0, -44]], cord, 10, [cx - side * r, 30, -tie * h - 6]);
  })];
}

// A swagged valance across the top of a stage: a pelmet board, then a row of swags that hang in deep curves, a tassel
// where each pair meet. len across, drop the deepest a swag falls; z = 0 at the top.
export function valance(len, drop, col, trim) {
  len = q(len, 20); drop = q(drop);
  return ['valance|' + [len, drop, hx(col), hx(trim)].join('|'), shape((G) => {
    const n = Math.max(3, Math.round(len / 600)), sw = len / n, lo = dark(col, 0.7);
    // the pelmet: a flat panel along the top with a gold edge
    G.surf((u, v) => [(u - 0.5) * len, -24, -v * 80], 0, 1, 2, 0, 1, 1, col); G.surf((u, v) => [(u - 0.5) * len, -25, -80 - v * 14], 0, 1, 2, 0, 1, 1, trim);
    for (let i = 0; i < n; i++) {
      const x0 = -len / 2 + i * sw;
      // a swag: cloth caught at its two top corners; rows of folds run as curves across it, deeper toward the bottom
      G.surf((u, v) => { const x = x0 + u * sw, c = Math.sin(u * Math.PI), z = -40 - v * (drop * 0.25 + drop * 0.75 * c) - 30 * c * v; const y = 6 + 26 * c * v + Math.sin(v * Math.PI * 5) * 5 * c; return [x, y, z]; }, 0, 1, 16, 0, 1, 14, (u, v) => (Math.sin(v * Math.PI * 5) > 0.6 ? lo : col));
      G.surf((u, v) => { const x = x0 + u * sw, c = Math.sin(u * Math.PI), z = -40 - (drop * 0.25 + drop * 0.75 * c) - 30 * c - v * 12; return [x, 6 + 26 * c, z]; }, 0, 1, 16, 0, 1, 1, trim);
      if (i > 0) { const at = [x0, 14, -60]; G.blob(at[0], at[1], at[2], 14, 14, 16, trim, { e: 2, nu: 10, nv: 6 }); G.lathe([[0, 0], [6, -6], [12, -34], [14, -70], [0, -76]], trim, 10, [x0, 14, -70]); }
    }
  })];
}

// The big top's canvas: from a ring round the king pole it falls in stripes to the eaves, sagging between the ropes, and
// ends in a scalloped valance. r0 the ring, R the eaves, fall how far it drops, n stripes (even).
export function canopy(r0, R, fall, c1, c2, n = 24) {
  r0 = q(r0); R = q(R); fall = q(fall);
  return ['canopy|' + [r0, R, fall, hx(c1), hx(c2), n].join('|'), shape((G) => {
    const Z = (r, a) => { const t = (r - r0) / (R - r0); return -fall * t - 60 * Math.sin(t * Math.PI) * (0.55 + 0.45 * Math.abs(Math.sin((a * n) / 4))); };
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, c = i % 2 ? c1 : c2;
      G.surf((u, v) => { const a = a0 + (a1 - a0) * u, r = r0 + (R - r0) * v; return [Math.cos(a) * r, Math.sin(a) * r, Z(r, a)]; }, 0, 1, 4, 0, 1, 14, c);
      G.surf((u, v) => { const a = a0 + (a1 - a0) * u, r = R + 2, d = 70 + 40 * Math.sin(u * Math.PI); return [Math.cos(a) * r, Math.sin(a) * r, Z(R, a) - v * d]; }, 0, 1, 8, 0, 1, 2, c);
    }
    // the ring the canvas is laced to, and a rope down every seam
    const ring = []; for (let i = 0; i <= 32; i++) { const a = (i / 32) * Math.PI * 2; ring.push([Math.cos(a) * r0, Math.sin(a) * r0, 0]); } G.tube(ring, 10, 0xd8b04a, { S: 8, caps: false });
    for (let i = 0; i < n; i += 2) { const a = (i / n) * Math.PI * 2, pts = []; for (let k = 0; k <= 8; k++) { const r = r0 + ((R - r0) * k) / 8; pts.push([Math.cos(a) * r, Math.sin(a) * r, Z(r, a) - 3]); } G.tube(pts, 3, 0xc8b890, { S: 5, caps: false }); }
  })];
}

// A string of pennants between two points (from at [0, 0, 0] to `to`), sagging `sag` at the middle.
export function bunting(to, sag, cols) {
  const [tx, ty, tz] = to.map((v) => q(v, 20)); sag = q(sag);
  return ['bunting|' + [tx, ty, tz, sag, cols.map(hx).join(',')].join('|'), shape((G) => {
    const L = Math.hypot(tx, ty, tz), P = (t) => [tx * t, ty * t, tz * t - sag * 4 * t * (1 - t)], pts = [];
    for (let i = 0; i <= 16; i++) pts.push(P(i / 16));
    G.tube(pts, 2.2, 0xd8d0b8, { S: 5, caps: false });
    const n = Math.max(3, Math.floor(L / 80)), ax = tx / L, ay = ty / L;
    for (let i = 1; i < n; i++) {
      const t0 = (i - 0.42) / n, t1 = (i + 0.42) / n, A = P(t0), B = P(t1), M = P((t0 + t1) / 2), c = cols[i % cols.length], sw = Math.sin(i * 1.7) * 6;
      G.surf((u, v) => { const top = [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, A[2] + (B[2] - A[2]) * u], tip = [M[0] - ay * sw, M[1] + ax * sw, M[2] - 60], k = v; return [top[0] + (tip[0] - top[0]) * k * (1 - Math.abs(u - 0.5) * 0) , top[1] + (tip[1] - top[1]) * k, top[2] + (tip[2] - top[2]) * k]; }, 0, 1, 1, 0, 1, 2, c);
    }
  })];
}

// A web strung between two posts: anchor lines to a hub, radials, and a spiral of sagging silk. len between the posts
// (along X, posts at -len/2 and len/2), from z0 to z1.
export function webSheet(len, z0, z1, col = 0xd8d4e0) {
  len = q(len, 20);
  return ['websheet|' + [len, q(z0), q(z1), hx(col)].join('|'), shape((G) => {
    const hz = z0 + (z1 - z0) * 0.55, hub = [len * 0.04, 0, hz], th = 1.6, W = len / 2;
    const line = (a, b, s = 0) => { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + s * 0.3, (a[2] + b[2]) / 2 - s]; G.tube([a, m, b], th, col, { S: 4, caps: false, M: 8 }); };
    // anchors: from points up and down each post to the hub
    const anchors = []; for (const e of [-1, 1]) for (const f of [0.08, 0.42, 0.78, 1]) anchors.push([e * W, 0, z0 + (z1 - z0) * f]);
    anchors.push([-W * 0.3, 0, z1 + 4], [W * 0.35, 0, z1 + 4], [-W * 0.2, 0, z0 - 30], [W * 0.25, 0, z0 - 30]);
    for (const p of anchors) line(p, hub, 10);
    // a spiral, each turn joined to the radials and sagging between them
    const ang = anchors.map((p) => Math.atan2(p[2] - hz, p[0] - hub[0])).sort((a, b) => a - b), turns = 7, pts = [];
    const reach = (a) => { let best = 1e9; for (const p of anchors) { const d = Math.hypot(p[0] - hub[0], p[2] - hz), b = Math.atan2(p[2] - hz, p[0] - hub[0]), da = Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))); if (da < 0.5) best = Math.min(best, d); } return best === 1e9 ? Math.min(W, (z1 - z0) / 2) : best; };
    for (let k = 0; k <= turns * ang.length; k++) { const a = ang[k % ang.length] + Math.floor(k / ang.length) * Math.PI * 2, t = 0.12 + (0.8 * k) / (turns * ang.length), r = reach(ang[k % ang.length]) * t; pts.push([hub[0] + Math.cos(a) * r, 0, hz + Math.sin(a) * r]); }
    for (let k = 0; k + 1 < pts.length; k++) line(pts[k], pts[k + 1], Math.hypot(pts[k][0] - pts[k + 1][0], pts[k][2] - pts[k + 1][2]) * 0.08);
  })];
}
