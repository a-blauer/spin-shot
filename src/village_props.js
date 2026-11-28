// Hand-made dressing for Thimblewick: the cobbled square, tubs of flowers, woodpiles and washing lines, the smithy's
// waterwheel, anvil, trough and grindstone, the Lectern grove's standing stones, reeds and lily pads for the water, the
// training yard's dummies and straw butts, a hand cart, crates and sacks, stumps, the welcome arch over the south road,
// and thickets for the edge of the hollow. Same rules as village_shapes.js: UE frame (X the front, Y right, Z up), each
// returns [key, build] for world.Shape(), keys carry every number the shape depends on, things stand on z = 0.
import { shape, wob } from './propkit.js';
import { block } from './descent_shapes.js';
import { VC, dark, mix } from './village_shapes.js';

const q = (v, s = 10) => Math.round(v / s) * s;
const hx = (c) => (c >>> 0).toString(16);
const rng = (seed) => { let s = (seed | 0) % 2147483647; if (s <= 0) s += 2147483646; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
const BARK = 0x5a4232, BARKD = 0x3a2a1e, END = 0xd8b884, ENDD = 0xb89464;
// an open band of revolution about Z (no discs closing its ends, which G.lathe always adds): prof [[r, z], ...]
const oring = (G, prof, c, S = 16, at = [0, 0, 0]) => G.surf((u, v) => { const a = u * Math.PI * 2, i = Math.min(prof.length - 1, Math.round(v * (prof.length - 1))), [r, z] = prof[i]; return [at[0] + Math.cos(a) * r, at[1] + Math.sin(a) * r, at[2] + z]; }, 0, 1, S, 0, 1, prof.length - 1, c, true);

// ---- the square: cobbles laid in rings round the well, each stone a low cushion with grout between; a band of darker
// stones half way out, four rays of pale stones pointing down the four streets, and a kerb of dressed stones round the
// edge, flush with the ground so nobody trips on it. r0: the inner edge (the well's footing), r1: the cobbles' edge.
export function cobbleSquare(r0 = 130, r1 = 640, kerb = 52) {
  return ['vcobble|' + [r0, r1, kerb].join('|'), shape((G) => {
    const R = rng(29), W = 31, GAP = 3.2, LEN = 37;
    // grout: a dark annulus under everything
    G.surf((u, v) => { const a = u * Math.PI * 2, r = r0 - 6 + v * (r1 + kerb + 4 - r0 + 6); return [Math.cos(a) * r, Math.sin(a) * r, 0.3]; }, 0, 1, 96, 0, 1, 2, 0x4e4a42, true);
    const tones = [0xa49d90, 0x9a9284, 0xb0a898, 0x8e877a, 0xa8a090, 0x988e80];
    const stone = (ra, rb, a0, a1, c, hgt) => {
      G.surf((u, v) => {
        const r = ra + (rb - ra) * v, a = a0 + (a1 - a0) * u, eu = 2 * u - 1, ev = 2 * v - 1, k = (1 - eu ** 4) * (1 - ev ** 4);
        return [Math.cos(a) * r, Math.sin(a) * r, 0.8 + hgt * k];
      }, 0, 1, 4, 0, 1, 3, c);
    };
    let ring = 0;
    for (let ra = r0; ra + W <= r1 + 0.5; ra += W, ring++) {
      const rb = ra + W - GAP, rm = (ra + rb) / 2, n = Math.max(8, Math.round((2 * Math.PI * rm) / LEN)), da = (2 * Math.PI) / n, off = ring % 2 ? da / 2 : 0, ga = GAP / rm;
      for (let i = 0; i < n; i++) {
        const a0 = off + i * da + ga / 2, a1 = off + (i + 1) * da - ga / 2, am = (a0 + a1) / 2;
        let c = tones[Math.floor(R() * tones.length)];
        const ray = [0, Math.PI / 2, Math.PI, Math.PI * 1.5].some((t) => Math.abs(Math.atan2(Math.sin(am - t), Math.cos(am - t))) * rm < LEN * 0.9) && rm > r0 + W * 1.5;
        if (ray) c = mix(0xd2c8b4, c, 0.25);
        else if (ring === 6) c = mix(0x6e665a, c, 0.3);
        else if (R() < 0.09) c = mix(c, VC.moss, 0.45);
        else if (R() < 0.07) c = mix(c, 0xb09a7a, 0.6);
        stone(ra, rb, a0, a1, c, 1.9 + R() * 1.4);
      }
    }
    // the kerb: dressed stones, longer, with a bevelled top
    const nk = Math.round((2 * Math.PI * (r1 + kerb / 2)) / 74), dk = (2 * Math.PI) / nk;
    for (let i = 0; i < nk; i++) {
      const a0 = i * dk + 2.2 / r1, a1 = (i + 1) * dk - 2.2 / r1, c = mix(0xb4ac9c, 0x8a8274, R() * 0.6), cm = R() < 0.15 ? mix(c, VC.moss, 0.4) : c;
      G.surf((u, v) => { const r = r1 + 2 + v * (kerb - 4), a = a0 + (a1 - a0) * u, eu = 2 * u - 1, ev = 2 * v - 1, k = (1 - eu ** 6) * (1 - ev ** 6); return [Math.cos(a) * r, Math.sin(a) * r, 1 + 3.4 * k]; }, 0, 1, 5, 0, 1, 3, cm);
    }
  })];
}

// ---- a half-barrel tub of flowers: staves, two iron hoops, dark earth, a crown of blooms and leaves trailing over
export function planter(r = 48, bloom = 0xf08aa8, seed = 1) {
  r = q(r, 4);
  return ['vplanter|' + [r, hx(bloom), seed % 4].join('|'), shape((G) => {
    const R = rng(seed * 37 + r), h = r * 0.82, n = 14;
    G.surf((u, v) => { const a = u * Math.PI * 2, z = v * h, rr = r * (0.9 + 0.1 * v) + Math.sin(a * n) * 0.6; return [Math.cos(a) * rr, Math.sin(a) * rr, z]; }, 0, 1, n * 2, 0, 1, 3, (u) => (Math.floor(u * n) % 2 ? VC.wood : dark(VC.wood, 0.86)), true);
    for (const z of [h * 0.2, h * 0.78]) oring(G, [[r * (0.9 + 0.1 * z / h) + 1.2, z - 3], [r * (0.9 + 0.1 * z / h) + 1.6, z], [r * (0.9 + 0.1 * z / h) + 1.2, z + 3]], VC.iron, 24);
    oring(G, [[r - 5, h - 4], [r - 4, h + 1], [r + 0.5, h], [r + 0.5, h - 6]], dark(VC.wood, 0.7), 24);
    G.lathe([[r - 5, h - 4], [0, h - 2]], 0x3a2a1e, 20);
    for (let i = 0; i < 9; i++) { const a = R() * 6.28, d = R() * r * 0.6; G.blob(Math.cos(a) * d, Math.sin(a) * d, h + 6 + R() * 8, 14 + R() * 6, 14 + R() * 6, 9, i % 2 ? VC.leaf2 : VC.leaf, { nu: 10, nv: 6 }); }
    for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.28 + R(); G.tube([[Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, h + 4], [Math.cos(a) * (r + 8), Math.sin(a) * (r + 8), h - 6], [Math.cos(a) * (r + 6), Math.sin(a) * (r + 6), h - 30 - R() * 14]], 2.2, VC.leaf3, { S: 5 }); for (let k = 0; k < 3; k++) G.blob(Math.cos(a) * (r + 7), Math.sin(a) * (r + 7), h - 10 - k * 9, 5, 5, 3.5, VC.leaf2, { nu: 6, nv: 4 }); }
    for (let i = 0; i < 7; i++) {
      const a = R() * 6.28, d = R() * r * 0.55, x = Math.cos(a) * d, y = Math.sin(a) * d, z = h + 18 + R() * 12, pr = 6 + R() * 2;
      G.tube([[x, y, h + 2], [x, y, z]], 1.4, VC.leaf3, { S: 4, caps: false });
      for (let k = 0; k < 5; k++) { const b = G.n; G.blob(pr * 0.6, 0, 0, pr * 0.62, pr * 0.34, pr * 0.1, i % 3 === 2 ? 0xfff2e0 : bloom, { nu: 6, nv: 4 }); G.place(b, { x, y, z, yaw: k * 72 + i * 13, pitch: -25 }); }
      G.blob(x, y, z + 1.5, pr * 0.3, pr * 0.3, pr * 0.22, 0xf6c43a, { nu: 6, nv: 4 });
    }
  })];
}

// ---- a woodpile: split logs stacked between stakes, their cut ends pale, the top row thinner; len along X
export function woodpile(len = 220, rows = 4, seed = 1) {
  len = q(len, 20);
  return ['vwood|' + [len, rows, seed % 4].join('|'), shape((G) => {
    const R = rng(seed * 53 + len), dep = 46;
    for (let row = 0; row < rows; row++) {
      const rr = 11 - row * 0.6, n = Math.floor((len - 16) / (rr * 2.1)), z = 10 + row * rr * 1.75;
      for (let i = 0; i < n; i++) {
        const x = -len / 2 + 10 + rr + i * ((len - 20 - rr * 2) / Math.max(1, n - 1)) + (row % 2 ? rr * 0.5 : 0), r2 = rr * (0.85 + R() * 0.3), dz = (R() - 0.5) * 2;
        if (x > len / 2 - 10 - rr * 0.5) continue;
        G.tube([[x, -dep / 2 - R() * 4, z + dz], [x, dep / 2 + R() * 4, z + dz]], r2, (t, a) => (Math.sin(a * 3 + i) > 0.6 ? BARKD : BARK), { S: 7, caps: false, M: 2 });
        for (const e of [-1, 1]) { const y = e * (dep / 2 + 2); G.surf((u, v) => { const a = u * Math.PI * 2, k = v; return [x + Math.cos(a) * r2 * k, y, z + dz + Math.sin(a) * r2 * k]; }, 0, 1, 7, 0, 1, 1, (u, v) => (v < 0.45 ? ENDD : END), true); }
      }
    }
    for (const e of [-1, 1]) for (const s of [-1, 1]) G.tube([[e * (len / 2 - 4), s * (dep / 2 - 6), -4], [e * (len / 2 - 2 + e * 3), s * (dep / 2 - 6), 14 + rows * 19]], 4, VC.woodD, { S: 6 });
  })];
}
// ---- a chopping block with an axe left in it
export function choppingBlock() {
  return ['vchop', shape((G) => {
    G.lathe([[30, 0], [27, 6], [25, 44], [24, 48]], (k) => (k === 2 ? BARK : BARKD), 14);
    G.lathe([[24, 48], [0, 49]], END, 14); oring(G, [[16, 49.3], [12, 49.3]], ENDD, 14);
    G.blob(4, 0, 58, 12, 2, 9, 0x8a8a90, { e: 6 }); G.blob(-2, 0, 54, 6, 3, 5, VC.iron, { e: 4 });
    G.tube([[-2, 0, 56], [-30, 4, 80], [-52, 8, 98]], 2.8, VC.woodL, { S: 6 });
  })];
}

// ---- a washing line between two T-posts, sagging, clothes pegged on it: a shirt, trousers, socks, a pointed hat
export function washLine(len = 420, seed = 1) {
  len = q(len, 20);
  return ['vwash|' + [len, seed % 3].join('|'), shape((G) => {
    const H = 190, sag = 26, zAt = (x) => H - sag * (1 - (2 * x / len) ** 2);
    for (const e of [-1, 1]) { G.tube([[e * len / 2, 0, -6], [e * len / 2, 0, H + 10]], 5, VC.woodD, { S: 6 }); G.tube([[e * len / 2, -26, H + 4], [e * len / 2, 26, H + 4]], 3.5, VC.woodD, { S: 6 }); }
    const pts = []; for (let i = 0; i <= 12; i++) { const x = -len / 2 + (len * i) / 12; pts.push([x, 0, zAt(x) + 2]); } G.tube(pts, 0.9, 0xe8dcc0, { S: 4, caps: false });
    const peg = (x) => G.blob(x, 0, zAt(x) + 1, 1.4, 2, 5, 0xc8a878, { nu: 4, nv: 3 });
    const cloth = (x, w, h, col, fold = 0) => { G.surf((u, v) => { const xx = x + (u - 0.5) * w, z = zAt(xx) - v * h; return [xx, Math.sin(u * Math.PI * 3 + fold) * 3 * v, z]; }, 0, 1, 6, 0, 1, 6, col); peg(x - w * 0.4); peg(x + w * 0.4); };
    const S = seed % 3, xs = [-len * 0.33, -len * 0.08, len * 0.14, len * 0.33];
    // a shirt with sleeves
    { const x = xs[0], col = [0xd8c8a0, 0x8a4a3a, 0x5a7a9a][S]; cloth(x, 62, 70, col); for (const e of [-1, 1]) G.surf((u, v) => { const xx = x + e * (31 + u * 22), z = zAt(x + e * 31) - 6 - u * 18 - v * 16; return [xx, 1, z]; }, 0, 1, 2, 0, 1, 2, dark(col, 0.92)); }
    // trousers: two legs from a waistband
    { const x = xs[1], col = [0x5a4a3a, 0x3a4a5a, 0x6a5a3a][S]; cloth(x, 50, 14, dark(col, 0.85)); for (const e of [-1, 1]) G.surf((u, v) => { const xx = x + e * (4 + u * 19) + e * v * 3, z = zAt(x) - 12 - v * 62; return [xx, Math.sin(u * 3) * 2, z]; }, 0, 1, 2, 0, 1, 4, col); }
    // a pair of socks, a pointed gnome hat hung by its tip
    for (const [dx, col] of [[-10, 0xc8392e], [10, 0xf2e4c6]]) { const x = xs[2] + dx; G.tube([[x, 0, zAt(x) - 1], [x, 0, zAt(x) - 26], [x + 8, 0, zAt(x) - 34]], 4.5, col, { S: 6 }); peg(x); }
    { const x = xs[3], col = [0x3a6a4a, 0xc8392e, 0x6a4a8a][S]; G.lathe([[0, 0], [1.5, -2], [9, -20], [18, -48], [21, -52], [0, -53]], (k) => (k >= 3 ? dark(col, 0.8) : col), 10, [x, 0, zAt(x) - 1]); peg(x); }
  })];
}

// ---- reeds and bulrushes: a clump of blades leaning out, a few brown heads on their stalks
export function reeds(h = 120, seed = 1) {
  h = q(h, 10);
  return ['vreeds|' + [h, seed % 5].join('|'), shape((G) => {
    const R = rng(seed * 19 + h), n = 13;
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2, lean = 0.08 + R() * 0.3, L = h * (0.55 + R() * 0.5), w0 = 2.4 + R() * 1.6, col = i % 3 ? 0x6a8a3a : 0x86a24a, tip = mix(col, 0xc8b878, 0.5);
      const ox = Math.cos(a) * R() * 14, oy = Math.sin(a) * R() * 14;
      G.surf((u, v) => { const t = v, b = lean * t * t * L, w = w0 * (1 - t * 0.9), s = (u - 0.5) * 2; return [ox + Math.cos(a) * b - Math.sin(a) * w * s, oy + Math.sin(a) * b + Math.cos(a) * w * s, L * t]; }, 0, 1, 1, 0, 1, 5, (u, v) => (v > 0.75 ? tip : col));
    }
    for (let i = 0; i < 3; i++) {
      const a = R() * 6.28, L = h * (0.9 + R() * 0.3), ox = Math.cos(a) * 8, oy = Math.sin(a) * 8, tx = ox + Math.cos(a) * L * 0.08, ty = oy + Math.sin(a) * L * 0.08;
      G.tube([[ox, oy, 0], [tx, ty, L]], 1.3, 0x7a8a44, { S: 4, caps: false });
      G.blob(tx, ty, L - 12, 4.2, 4.2, 13, 0x6a4026, { nu: 8, nv: 6 }); G.tube([[tx, ty, L], [tx, ty, L + 10]], 0.8, 0x8a7a44, { S: 3 });
    }
  })];
}
// ---- lily pads on still water, a notch out of each, one or two flowers
export function lilies(r = 120, seed = 1) {
  r = q(r, 10);
  return ['vlily|' + [r, seed % 4].join('|'), shape((G) => {
    const R = rng(seed * 41 + r), n = 4 + Math.floor(r / 50);
    for (let i = 0; i < n; i++) {
      const a = R() * 6.28, d = i ? r * (0.25 + R() * 0.7) : 0, x = Math.cos(a) * d, y = Math.sin(a) * d, pr = 16 + R() * 14, rot = R() * 6.28, col = [0x4e8a34, 0x5e9a3c, 0x3e7a30][i % 3];
      G.surf((u, v) => { const t = rot + 0.35 + u * (Math.PI * 2 - 0.7), k = v; return [x + Math.cos(t) * pr * k, y + Math.sin(t) * pr * k, 0.6 + (1 - k) * 0.6]; }, 0, 1, 14, 0, 1, 1, (u, v) => (v > 0.85 ? dark(col, 0.85) : col));
      if (i % 3 === 1) { for (let k = 0; k < 7; k++) { const b = G.n; G.blob(6, 0, 0, 6, 2.6, 1.4, 0xf8eef0, { nu: 6, nv: 3 }); G.place(b, { x, y, z: 3, yaw: k * 51, pitch: -30 }); } G.blob(x, y, 4.5, 2.6, 2.6, 2, 0xf6c43a, { nu: 6, nv: 4 }); }
    }
  })];
}

// ---- a standing stone: a tall weathered slab leaning a little, narrower at the top, lichen on its face, moss on its crown
export function standingStone(h = 300, w = 90, seed = 1) {
  h = q(h); w = q(w);
  return ['vstone|' + [h, w, seed % 6].join('|'), shape((G) => {
    const lean = ((seed % 5) - 2) * 0.03, tilt = ((seed % 3) - 1) * 0.18;
    const col = (x, y, z) => { const n = wob(x * 6 + seed, z * 4 + y * 3), m = wob(x * 2.3 - seed, y * 2 + z * 1.4); return z > 0.86 ? (m > 0 ? VC.moss : dark(VC.moss, 0.85)) : n > 0.7 ? 0xc0c49a : n > 0.5 ? 0xa8ac88 : m < -0.75 ? 0x6e695f : mix(0x9e978a, 0x857f74, z * 0.5 + 0.5); };
    G.blob(0, 0, h / 2, w / 2, w * 0.32, h / 2 + 10, col, { e: 4.5, nu: 14, nv: 12, warp: (x, y, z, nx, ny, nz) => {
      const t = (z + h / 2 + 10) / (h + 20), k = (1 - 0.3 * t) * (1 + 0.11 * Math.round(wob(nx * 2 + seed, nz * 2 + ny) * 3) / 3);
      const top = nz > 0.5 ? (tilt * x - 0.15 * Math.abs(y)) * 1.0 : 0;   // a chipped, slanting crown
      return [x * k + lean * (z + h / 2), y * k * (1 + 0.15 * wob(nz * 3, seed)), z + top + (nz < -0.6 ? -6 : 0)];
    } });
    G.blob(0, 0, -6, w * 0.66, w * 0.46, 14, dark(VC.moss, 0.82), { nu: 12, nv: 5, warp: (x, y, z, nx, ny) => { const k = 1 + 0.18 * wob(nx * 4 + seed, ny * 4); return [x * k, y * k, z]; } });
    for (let i = 0; i < 3; i++) { const a = i * 2.1 + seed, r = w * 0.6; G.blob(Math.cos(a) * r, Math.sin(a) * r * 0.7, 4, 16 + i * 4, 12 + i * 3, 9, mix(0x8e887c, VC.moss, 0.3), { e: 3, nu: 8, nv: 5 }); }
  })];
}

// ---- the smithy's waterwheel: two rims on spokes, paddles between them, an iron-bound hub on an axle that runs back
// to the forge, and the frame it turns in. The wheel stands in the XZ plane (turning about Y); axle along +Y.
export function waterwheel(r = 170, wd = 70, axle = 300) {
  r = q(r); wd = q(wd);
  return ['vwheel|' + [r, wd, axle].join('|'), shape((G) => {
    const wet = 0x4a3a2a, wood = 0x7a5a3a, rim = (y) => { const pts = []; for (let i = 0; i <= 32; i++) { const a = (i / 32) * Math.PI * 2; pts.push([Math.cos(a) * r, y, Math.sin(a) * r]); } G.tube(pts, 6, (t) => (Math.sin(t * Math.PI * 2) < -0.3 ? wet : wood), { S: 6, caps: false }); };
    for (const s of [-1, 1]) { rim(s * wd / 2); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.2; G.tube([[0, s * wd / 2, 0], [Math.cos(a) * r, s * wd / 2, Math.sin(a) * r]], 4, wood, { S: 5 }); } }
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, c = Math.sin(a) < -0.3 ? wet : dark(wood, 0.9), b = G.n; G.blob(0, 0, 0, 22, wd / 2 + 4, 3, c, { e: 10, nu: 6, nv: 3 }); G.place(b, { x: Math.cos(a) * (r + 2), z: Math.sin(a) * (r + 2), pitch: -(a * 180) / Math.PI + 90 }); }
    { const hb = G.n; G.lathe([[22, -wd / 2 - 8], [26, -wd / 2], [26, wd / 2], [22, wd / 2 + 8]], VC.iron, 12); G.map(hb, ([x, y, z]) => [x, z, y]); }   // (the hub is turned on Z, then laid along Y)
    G.tube([[0, -wd / 2 - 40, 0], [0, axle, 0]], 9, VC.woodD, { S: 8 });
    for (const y of [-wd / 2 - 30, wd / 2 + 30]) { for (const e of [-1, 1]) G.tube([[e * 70, y, -r - 40], [0, y, 6]], 7, VC.woodD, { S: 6 }); G.blob(0, y, 4, 12, 12, 10, VC.iron, { e: 4 }); }
  })];
}
// ---- an anvil on its stump, a hammer resting on the face
export function anvil() {
  return ['vanvil', shape((G) => {
    G.lathe([[34, 0], [30, 8], [28, 52], [27, 56]], (k) => (k === 2 ? BARK : BARKD), 14); G.lathe([[27, 56], [0, 57]], END, 14);
    const I = 0x34343a, IL = 0x55555e;
    G.blob(0, 0, 64, 30, 18, 8, I, { e: 6 }); G.blob(0, 0, 76, 16, 11, 10, I, { e: 5 }); G.blob(0, 0, 90, 34, 14, 7, I, { e: 7 }); G.blob(0, 0, 96.5, 32, 12.5, 1.2, IL, { e: 8 });
    G.tube([[30, 0, 92], [48, 0, 92], [64, 0, 88]], (t) => 10 * (1 - t * 0.92), I, { S: 8 });
    G.blob(-6, 2, 100, 3, 12, 3, 0x6a4a2a, { e: 4 }); G.tube([[-6, 10, 100], [-40, 32, 99], [-58, 44, 98]], 2.6, VC.woodL, { S: 6 }); G.blob(-6, 0, 100, 7, 5, 5, I, { e: 5 });
  })];
}
// ---- a quench trough: a plank box on legs with dark water in it
export function trough(len = 160) {
  len = q(len, 20);
  return ['vtrough|' + len, shape((G) => {
    const W = 50, H = 58, L = len / 2, wd = 0x6a4a2e;
    block(G, -L, -W / 2, 12, L, -W / 2 + 6, H, wd); block(G, -L, W / 2 - 6, 12, L, W / 2, H, wd); block(G, -L, -W / 2, 12, -L + 6, W / 2, H, dark(wd, 0.85)); block(G, L - 6, -W / 2, 12, L, W / 2, H, dark(wd, 0.85)); block(G, -L, -W / 2, 12, L, W / 2, 16, wd);
    G.surf((u, v) => [-L + 6 + (2 * L - 12) * u, -W / 2 + 6 + (W - 12) * v, H - 8], 0, 1, 2, 0, 1, 1, 0x2a3a3e);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) block(G, sx * (L - 14) - 4, sy * (W / 2 - 4) - 4, 0, sx * (L - 14) + 4, sy * (W / 2 - 4) + 4, 14, dark(wd, 0.75));
    for (const x of [-L * 0.5, L * 0.5]) G.surf((u, v) => [x - 2 + 4 * u, -W / 2 - 1 + (W + 2) * v, H + 0.5], 0, 1, 1, 0, 1, 1, VC.iron);
  })];
}
// ---- a grindstone: a stone wheel in a wooden frame, a crank on one side
export function grindstone() {
  return ['vgrind', shape((G) => {
    const wd = 0x6a4a2e;
    for (const s of [-1, 1]) { G.tube([[-40, s * 22, 0], [0, s * 22, 74], [40, s * 22, 0]], 4, wd, { S: 6 }); }
    G.tube([[0, -30, 70], [0, 34, 70]], 3, VC.iron, { S: 6 }); G.tube([[0, 34, 70], [0, 40, 70], [14, 40, 56], [14, 48, 56]], 2.4, VC.iron, { S: 5 });
    const b = G.n; G.lathe([[42, -9], [44, -6], [44, 6], [42, 9], [0, 9]], (k) => (k === 1 ? 0xa8a296 : 0x8e887c), 24); G.lathe([[42, -9], [0, -9]], 0x8e887c, 24);
    G.map(b, ([x, y, z]) => [x, z, y + 70]);
    block(G, -34, -22, 18, 34, 22, 22, wd);
  })];
}

// ---- the training yard: a straw dummy and an archery butt
export function dummy(seed = 1) {
  return ['vdummy|' + (seed % 3), shape((G) => {
    const sack = 0xc8a86a, sackD = 0xa8884e, rope = 0x8a6a3a, post = 0x5a3a22;
    for (const a of [0, 90]) G.tube([[-46 * Math.cos(a * Math.PI / 180), -46 * Math.sin(a * Math.PI / 180), 4], [46 * Math.cos(a * Math.PI / 180), 46 * Math.sin(a * Math.PI / 180), 4]], 5, post, { S: 6 });
    G.tube([[0, 0, 0], [0, 0, 196]], 6.5, post, { S: 8 });
    G.blob(0, 0, 122, 30, 26, 44, (x, y, z) => (wob(x * 6, z * 8 + y * 4) > 0.55 ? sackD : sack), { nu: 16, nv: 12, warp: (x, y, z) => [x * (1 - 0.06 * Math.cos(z / 9)), y, z] });
    for (const z of [96, 146]) G.lathe([[31 - Math.abs(122 - z) * 0.06, z - 2.5], [32.5 - Math.abs(122 - z) * 0.06, z], [31 - Math.abs(122 - z) * 0.06, z + 2.5]], rope, 16, [0, 0, 0], [1, 0.87]);
    G.tube([[0, -64, 150], [0, 64, 150]], 4, post, { S: 6 }); for (const e of [-1, 1]) { G.blob(0, e * 66, 150, 11, 13, 11, sack, { nu: 10, nv: 6 }); G.lathe([[11.6, -2], [12.4, 0], [11.6, 2]], rope, 10, [0, e * 56, 150], [1, 1]); }
    G.blob(0, 0, 184, 21, 20, 22, sack, { nu: 14, nv: 10 }); G.tube([[0, 0, 167], [0, 0, 162]], 6, rope, { S: 8 });
    for (let k = 0; k < 5; k++) { const a = (k / 5) * 6.28; G.tube([[Math.cos(a) * 4, Math.sin(a) * 4, 204], [Math.cos(a) * 12, Math.sin(a) * 12, 214]], 1.2, 0xe0c878, { S: 3 }); }
    // a stitched face on the front (+X): two crosses for eyes, a line of stitches for a mouth
    for (const e of [-1, 1]) for (const r2 of [45, -45]) { const b = G.n; G.blob(0, 0, 0, 0.8, 5, 1.1, 0x2a1a12, { nu: 4, nv: 3 }); G.place(b, { x: 20, y: e * 8, z: 190, roll: r2 }); }
    for (let k = -2; k <= 2; k++) G.blob(20.4, k * 4, 176 - Math.abs(k) * 0.6, 0.8, 1.2, 2.6, 0x2a1a12, { nu: 4, nv: 3 });
    G.blob(0, 0, 4, 10, 10, 6, post);
  })];
}
export function archeryButt() {
  return ['vbutt', shape((G) => {
    const post = 0x5a3a22, straw = 0xd8bc6e;
    for (const e of [-1, 1]) G.tube([[-6, e * 50, 0], [-6, e * 30, 160]], 5, post, { S: 6 }); G.tube([[-70, 0, 0], [-10, 0, 140]], 5, post, { S: 6 });
    const b = G.n;
    G.lathe([[0, -16], [62, -16], [70, -10], [72, 0], [70, 10], [62, 16], [0, 16]], (k) => (k === 3 || k === 2 ? dark(straw, 0.88) : straw), 28);
    for (const [r, c] of [[58, 0xf2e4c6], [44, 0x3a6aa8], [30, 0xc8392e], [14, 0xe8b830]]) G.surf((u, v) => { const a = u * Math.PI * 2, k = v * r; return [Math.cos(a) * k, Math.sin(a) * k, 16.6 + (58 - r) * 0.02]; }, 0, 1, 28, 0, 1, 1, c, true);
    G.map(b, ([x, y, z]) => [z, x, y + 106]);
    for (const [y, z, a] of [[10, 112, 6], [-18, 96, -8], [22, 88, 4]]) { G.tube([[10, y, z], [46, y + a, z + 3]], 1, VC.woodL, { S: 3 }); G.blob(46, y + a, z + 3, 2.5, 0.5, 3.5, 0xf2e4c6, { nu: 4, nv: 3 }); }
  })];
}

// ---- a hand cart: a plank bed on two spoked wheels, long handles down on the ground in front, a load on the bed
export function cart(load = 0, seed = 1) {
  return ['vcart|' + [load, seed % 3].join('|'), shape((G) => {
    const wd = 0x8a5a34, wdD = 0x5a3a22, R = rng(seed * 61 + load), z0 = 62;
    block(G, -80, -48, z0, 80, 48, z0 + 8, wd); for (const e of [-1, 1]) block(G, -80, e * 48 - 3, z0 + 8, 80, e * 48 + 3, z0 + 44, dark(wd, 0.9)); block(G, -86, -48, z0 + 8, -80, 48, z0 + 40, dark(wd, 0.85));
    for (const e of [-1, 1]) G.tube([[-70, e * 40, z0 + 2], [90, e * 40, z0 - 2], [190, e * 38, 8]], 3.6, wdD, { S: 6 });
    G.tube([[184, -38, 10], [184, 38, 10]], 3, wdD, { S: 6 });
    for (const e of [-1, 1]) { const y = e * 60, pts = []; for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2; pts.push([Math.cos(a) * 52, y, 52 + Math.sin(a) * 52]); } G.tube(pts, 4, wdD, { S: 6, caps: false }); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; G.tube([[0, y, 52], [Math.cos(a) * 50, y, 52 + Math.sin(a) * 50]], 2.2, wd, { S: 4 }); } G.blob(0, y, 52, 7, 8, 7, VC.iron, { nu: 8, nv: 5 }); }
    G.tube([[0, -64, 52], [0, 64, 52]], 3.4, VC.iron, { S: 6 });
    block(G, -12, -48, 50, 12, 48, z0 + 1, wdD);   // the bolster the bed rests on, over the axle
    if (load === 0) { for (let i = 0; i < 4; i++) { const x = -50 + i * 32 + R() * 6, y = (i % 2 ? 18 : -18); G.blob(x, y, z0 + 26, 22, 20, 22, 0xc8b48a, { nu: 12, nv: 8, warp: (X, Y, Z) => [X, Y, Z * (Z > 0 ? 1 - Z / 60 : 1)] }); G.tube([[x, y, z0 + 36], [x, y, z0 + 46]], 4, 0x8a6a3a, { S: 6 }); } }   // the tie, out of the sack's flattened top
    else { for (let i = 0; i < 6; i++) { const x = -48 + (i % 3) * 40, y = i < 3 ? -18 : 18, r = 18 + R() * 4; G.blob(x, y, z0 + 8 + r * 0.8, r, r, r * 0.8, (X, Y) => (Math.cos(Math.atan2(Y, X) * 8) > 0.7 ? 0xd06a1a : 0xe8862a), { nu: 16, nv: 8 }); G.tube([[x, y, z0 + 8 + r * 1.55], [x + 3, y, z0 + 14 + r * 1.6]], 2, 0x5a6a2a, { S: 4 }); } }
  })];
}
// ---- a crate of slats, and a grain sack tied at the neck
export function crate(w = 70, seed = 1) {
  w = q(w, 5); seed = Math.abs(Math.round(seed)) || 0;   // a negative seed picked no colour (a black crate)
  return ['vcrate|' + [w, seed % 3].join('|'), shape((G) => {
    const h = w * 0.85, c = [0xa8784a, 0x9a6a40, 0xb08452][seed % 3], cd = dark(c, 0.72), W = w / 2;
    block(G, -W + 4, -W + 4, 2, W - 4, W - 4, h - 2, cd);
    for (let i = 0; i < 4; i++) { const z = 4 + i * ((h - 8) / 4); for (const e of [-1, 1]) { block(G, -W, e * W - (e > 0 ? 4 : 0), z, W, e * W + (e < 0 ? 4 : 0), z + (h - 8) / 4 - 3, c); block(G, e * W - (e > 0 ? 4 : 0), -W, z, e * W + (e < 0 ? 4 : 0), W, z + (h - 8) / 4 - 3, c); } }
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) block(G, sx * W - (sx > 0 ? 7 : 0), sy * W - (sy > 0 ? 7 : 0), 0, sx * W + (sx < 0 ? 7 : 0), sy * W + (sy < 0 ? 7 : 0), h, dark(c, 0.86));
    for (let i = 0; i < 5; i++) block(G, -W + 2, -W + 2 + i * ((w - 4) / 5), h - 4, W - 2, -W + (i + 1) * ((w - 4) / 5), h, i % 2 ? c : dark(c, 0.93));
  })];
}
export function sack(r = 26, col = 0xc8b48a) {
  r = q(r, 2);
  return ['vsack|' + [r, hx(col)].join('|'), shape((G) => {
    G.blob(0, 0, r * 0.95, r, r * 0.92, r, (x, y, z) => (wob(x * 5, z * 6) > 0.6 ? dark(col, 0.88) : col), { nu: 14, nv: 10, warp: (x, y, z) => { const k = z > 0 ? 1 - 0.45 * (z / r) ** 2 : 1; return [x * k, y * k, z < 0 ? z * 0.85 : z]; } });
    G.lathe([[r * 0.34, r * 1.62], [r * 0.2, r * 1.86], [r * 0.24, r * 1.98], [r * 0.4, r * 2.18], [r * 0.3, r * 2.26], [0, r * 2.2]], (k) => (k === 1 ? 0x8a6a3a : col), 10);
  })];
}
// ---- a tree stump to sit on: rings on the top, bark round, a root or two
export function stump(r = 34, h = 46, seed = 1) {
  r = q(r, 2); h = q(h, 2);
  return ['vstump|' + [r, h, seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 7 + r);
    G.lathe([[r * 1.25, 0], [r * 1.05, 8], [r, h * 0.5], [r * 0.98, h]], (k) => (k === 0 ? BARKD : BARK), 14);
    G.lathe([[r * 0.98, h], [r * 0.9, h + 1.5], [0, h + 2]], END, 14); for (const k of [0.3, 0.55, 0.78]) oring(G, [[r * k + 1, h + 2 - 1.5 * (1 - k) + 0.25], [r * k - 1, h + 2 - 1.5 * (1 - k) + 0.25]], ENDD, 14);
    for (let i = 0; i < 3; i++) { const a = R() * 6.28; G.tube([[Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, 10], [Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.5, 0], [Math.cos(a) * r * 1.9, Math.sin(a) * r * 1.9, -6]], (t) => r * 0.22 * (1 - t * 0.6), BARK, { S: 6 }); }
  })];
}

// ---- the welcome arch over the south road: two log posts with the stubs of branches, a crossbeam laid over them, a
// carved hat on top, ivy up the posts, little caps growing out of the bark, chains for the sign board and two lanterns
export function welcomeArch(span = 520, h = 430) {
  span = q(span); h = q(h);
  return ['vwelcome|' + [span, h].join('|'), shape((G) => {
    const R = rng(77), lg = (t, a) => (Math.sin(a * 5 + t * 14) > 0.65 ? BARKD : BARK);
    for (const e of [-1, 1]) {
      const x = e * span / 2;
      G.tube([[x, 0, -20], [x + e * 6, 0, h * 0.5], [x, 0, h + 30]], (t) => 36 - t * 8 + (t < 0.06 ? 16 : 0), lg, { S: 12 });
      G.tube([[x, 0, h * 0.62], [x + e * 34, 8, h * 0.7], [x + e * 50, 10, h * 0.72]], (t) => 8 * (1 - t * 0.6), BARK, { S: 6 });
      for (let k = 0; k < 3; k++) { const z = 60 + k * 70 + R() * 20, a = R() * 6.28; G.lathe([[10, -2], [12, 1], [8, 6], [0, 8]], [0xc8392e, 0xd88a3a, 0xc89a5a][k], 10, [x + Math.cos(a) * 26, Math.sin(a) * 26, z]); }
      const pts = []; for (let i = 0; i <= 26; i++) { const t = i / 26, a = t * Math.PI * 7 + e; pts.push([x + Math.cos(a) * 25, Math.sin(a) * 25, 10 + t * h * 0.85]); } G.tube(pts, 2.2, VC.leaf3, { S: 4, caps: false });
      for (let i = 0; i < 14; i++) { const t = i / 14, a = t * Math.PI * 7 + e + 0.3; G.blob(x + Math.cos(a) * 28, Math.sin(a) * 28, 16 + t * h * 0.85, 8, 8, 4, i % 2 ? VC.leaf2 : VC.leaf, { nu: 6, nv: 4 }); }
      G.tube([[x + e * 26, 0, h - 40], [x + e * 62, 0, h - 40], [x + e * 66, 0, h - 52]], 3, VC.iron, { S: 5 });
      G.lathe([[0, -22], [11, -20], [13, -6], [11, 9], [0, 12]], VC.iron, 8, [x + e * 66, 0, h - 76]); G.blob(x + e * 66, 0, h - 84, 9, 9, 11, VC.glass, { nu: 8, nv: 6 });
    }
    G.tube([[-span / 2 - 80, 0, h + 6], [0, 0, h + 18], [span / 2 + 80, 0, h + 6]], (t) => 30 - Math.abs(t - 0.5) * 10, lg, { S: 12 });
    G.tube([[-span / 2 + 20, 0, h - 70], [0, 0, h - 64], [span / 2 - 20, 0, h - 70]], 11, BARK, { S: 8 });
    for (const e of [-1, 1]) G.tube([[e * (span / 2 - 10), 0, h - 140], [e * (span / 2 - 90), 0, h - 66]], 8, BARK, { S: 6 });
    G.lathe([[56, 0], [50, 16], [30, 64], [14, 112], [5, 138], [0, 142]], (k) => (k < 1 ? 0x2e5a3a : 0x3a6a4a), 16, [0, 0, h + 44]); G.lathe([[64, -4], [66, 2], [56, 8], [50, 4]], 0x6a4a2a, 16, [0, 0, h + 42]); G.blob(0, 0, h + 38, 14, 14, 10, 0x5a3a22, { nu: 8, nv: 5 });
    for (const e of [-1, 1]) G.tube([[e * 150, 0, h - 76], [e * 150, 0, h - 112]], 1.6, VC.iron, { S: 4, caps: false });
  })];
}

// ---- a thicket for the edge of the hollow: a few bushes run together, ferns at their feet, a sapling through them
export function thicket(r = 220, seed = 1) {
  r = q(r, 20);
  return ['vthicket|' + [r, seed % 6].join('|'), shape((G) => {
    const R = rng(seed * 101 + r), greens = [VC.leaf3, VC.leaf, 0x4e7a32, 0x3e6a2c, 0x56843a];
    const lump = (x, y, s, z, i) => G.blob(x, y, z, s, s * (0.85 + R() * 0.3), s * 0.8, greens[i % 5], { nu: 12, nv: 8, warp: (X, Y, Z, nx, ny, nz) => { const w = 1 + 0.13 * wob(nx * 5 + i, ny * 5 + nz * 3 + seed); return [X * w, Y * w, Z * w]; } });
    // a tall heart, a ring of lower lumps round it, and a few low ones out at the edge
    lump(0, 0, r * 0.55, r * 0.62, 0); lump(r * 0.12, -r * 0.1, r * 0.4, r * 1.02, 1);
    for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.28 + R() * 0.5, d = r * (0.45 + R() * 0.2), s = r * (0.34 + R() * 0.14); lump(Math.cos(a) * d, Math.sin(a) * d, s, s * 0.7, i + 2); }
    for (let i = 0; i < 4; i++) { const a = R() * 6.28, d = r * (0.85 + R() * 0.2), s = r * (0.18 + R() * 0.08); lump(Math.cos(a) * d, Math.sin(a) * d, s, s * 0.62, i + 4); }
    if (seed % 3 === 0) for (let k = 0; k < 9; k++) { const a = R() * 6.28, rr = r * (0.3 + R() * 0.6), z = r * (0.5 + R() * 0.6); G.blob(Math.cos(a) * rr * 1.02, Math.sin(a) * rr * 1.02, z, r * 0.035, r * 0.035, r * 0.035, [0xd8302a, 0xf6f0e0, 0xf08aa8][seed % 3 === 0 ? 0 : 1], { nu: 6, nv: 4 }); }
    for (let i = 0; i < 5; i++) { const a = R() * 6.28, d = r * (0.8 + R() * 0.3), x = Math.cos(a) * d, y = Math.sin(a) * d;
      for (let k = 0; k < 6; k++) { const b = (k / 6) * 6.28 + R() * 0.5, L = 50 + R() * 30, col = k % 2 ? 0x4e7a32 : 0x5e8a3a; G.surf((u, v) => { const t = v, w = L * 0.2 * Math.sin(Math.min(1, t * 1.15) * Math.PI), s2 = (u - 0.5) * 2; return [x + Math.cos(b) * L * t - Math.sin(b) * w * s2, y + Math.sin(b) * L * t + Math.cos(b) * w * s2, L * 0.9 * Math.sin(t * Math.PI * 0.85) * 0.75 - Math.abs(s2) * w * 0.35]; }, 0, 1, 2, 0, 1, 6, (u, v) => (v > 0.75 ? mix(col, 0x9aa850, 0.35) : col)); } }
  })];
}

// ---- a lectern for Mother Inkcap's grove: a carved stand on a stone step, a sloped desk with a great open book, a ribbon,
// a candle either side on little arms, and an inkwell with a quill. The reader stands at -X.
export function lecternStand() {
  return ['vlectern', shape((G) => {
    const WD = 0x4a2e1e, WL = 0x7a5034, ST = 0x8a847a;
    G.lathe([[96, 0], [96, 14], [88, 18], [80, 18]], ST, 18); G.lathe([[80, 18], [0, 18.5]], mix(ST, 0xffffff, 0.08), 18);
    G.lathe([[46, 18], [40, 26], [24, 32], [16, 40], [14, 60], [18, 70], [13, 86], [12, 120], [16, 128], [22, 134]], (k) => (k % 3 === 1 ? WD : WL), 12);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5; G.tube([[Math.cos(a) * 14, Math.sin(a) * 14, 70], [Math.cos(a) * 34, Math.sin(a) * 34, 40], [Math.cos(a) * 40, Math.sin(a) * 40, 22]], (t) => 5 - t * 2, WD, { S: 6 }); }
    // the desk, tilted toward the reader
    const b = G.n; block(G, -36, -58, -4, 36, 58, 4, WL, WL, WD); block(G, -40, -60, 0, -34, 60, 10, WD); G.place(b, { z: 142, pitch: -24 });
    const bk = G.n;
    for (const s of [-1, 1]) G.surf((u, v) => { const y = s * (2 + u * 52), z = 6 + 6 * Math.sin(u * Math.PI * 0.9) * (1 - u * 0.3); return [-30 + v * 62, y, z]; }, 0, 1, 8, 0, 1, 3, (u) => (u > 0.92 ? 0xd8c8a0 : 0xf2e6c8));
    for (const s of [-1, 1]) for (let k = 0; k < 6; k++) G.surf((u, v) => [-22 + k * 9 + u * 1.2, s * (10 + v * 36), 6 + 6 * Math.sin(((10 + v * 36) / 54) * Math.PI * 0.9) + 0.3], 0, 1, 1, 0, 1, 3, 0x6a5a4a);
    block(G, -32, -58, 2, 34, -54, 6, 0x5a2a3a); block(G, -32, 54, 2, 34, 58, 6, 0x5a2a3a);
    G.tube([[-28, 2, 8], [-38, 3, -6], [-40, 4, -40]], 1.6, 0x8a2a5a, { S: 4, caps: false });
    G.place(bk, { z: 146, pitch: -24 });
    for (const s of [-1, 1]) { G.tube([[0, s * 20, 128], [6, s * 62, 140], [6, s * 74, 140]], 2.4, VC.brass, { S: 5 }); G.lathe([[8, 0], [6, 3], [5, 4]], VC.brass, 10, [6, s * 74, 140]); G.lathe([[4.2, 4], [4.2, 26 - s * 6], [2, 28 - s * 6]], 0xf2e8d0, 8, [6, s * 74, 140]); }
    G.lathe([[7, 0], [8, 6], [5, 9], [4, 11]], 0x1a1a2a, 10, [24, -66, 154]); G.tube([[24, -64, 164], [28, -58, 188], [32, -52, 204]], (t) => 1 + t * 2.5, 0xf2ece0, { S: 4 });
  })];
}

// ---- a clump of flowers for a bed or a meadow: a low mound of leaves with blossoms standing over it on short stems
export function flowerClump(r = 40, col = 0xf08aa8, col2 = 0xffffff, seed = 1) {
  r = q(r, 5);
  return ['vfclump|' + [r, hx(col), hx(col2), seed % 4].join('|'), shape((G) => {
    const R = rng(seed * 23 + r);
    for (let i = 0; i < 4; i++) { const a = R() * 6.28, d = i ? r * 0.45 : 0, s = r * (i ? 0.5 : 0.65); G.blob(Math.cos(a) * d, Math.sin(a) * d, s * 0.45, s, s * 0.9, s * 0.55, i % 2 ? VC.leaf2 : VC.leaf, { nu: 10, nv: 6 }); }
    const n = Math.round(6 + r / 6);
    for (let i = 0; i < n; i++) {
      const a = R() * 6.28, d = R() * r * 0.85, x = Math.cos(a) * d, y = Math.sin(a) * d, z = r * 0.55 + R() * r * 0.35, pr = r * (0.13 + R() * 0.05), c = R() < 0.3 ? col2 : col;
      G.tube([[x * 0.7, y * 0.7, r * 0.3], [x, y, z]], 1.2, VC.leaf3, { S: 4, caps: false });
      for (let k = 0; k < 5; k++) { const b = G.n; G.blob(pr * 0.6, 0, 0, pr * 0.62, pr * 0.36, pr * 0.1, c, { nu: 6, nv: 4 }); G.place(b, { x, y, z, yaw: k * 72 + i * 17, pitch: -22 }); }
      G.blob(x, y, z + pr * 0.15, pr * 0.3, pr * 0.3, pr * 0.22, 0xf6c43a, { nu: 6, nv: 4 });
    }
  })];
}

// ---- a rowboat: a clinker hull, pointed at both ends, two thwarts, a pair of oars shipped along the seats. len along X
export function rowboat(len = 300, col = 0x7a5a3a, seed = 1) {
  len = q(len, 20);
  return ['vboat|' + [len, hx(col), seed % 3].join('|'), shape((G) => {
    const W = len * 0.2, D = len * 0.13, wAt = (u) => W * Math.pow(Math.sin(Math.PI * u), 0.62), dAt = (u) => D * Math.pow(Math.sin(Math.PI * u), 0.4) + 4, sheer = (u) => 10 * (2 * u - 1) ** 2;
    const hull = (inset, c) => G.surf((u, v) => { const th = (v - 0.5) * Math.PI, w = Math.max(0.5, wAt(u) - inset), d = Math.max(0.5, dAt(u) - inset); return [(u - 0.5) * len, Math.sin(th) * w, D + sheer(u) - Math.cos(th) * d]; }, 0, 1, 24, 0, 1, 10, c);
    hull(0, (u, v) => (Math.floor(v * 10) % 2 ? col : dark(col, 0.86))); hull(3, dark(col, 0.62));
    for (const s of [-1, 1]) G.tube(Array.from({ length: 13 }, (_, i) => { const u = 0.02 + (i / 12) * 0.96; return [(u - 0.5) * len, s * wAt(u), D + sheer(u) + 1]; }), 2.4, dark(col, 0.7), { S: 5 });
    for (const u of [0.38, 0.66]) { const w = wAt(u) - 3; G.blob((u - 0.5) * len, 0, D * 0.55, 7, w, 2.5, VC.woodL, { e: 8, nu: 6, nv: 3 }); }
    for (const s of [-1, 1]) { G.tube([[-len * 0.32, s * 12, D * 0.62], [len * 0.22, s * 16, D * 0.62]], 2, VC.woodL, { S: 5 }); G.blob(len * 0.27, s * 17, D * 0.62, 18, 2, 6, VC.woodL, { e: 6, nu: 6, nv: 3 }); }
  })];
}

// ---- the treehouse deck round a giant's trunk: boards laid round in a ring on joists that run into the trunk, a rim beam,
// knee braces from the trunk out under the deck, a railing with posts, open where the ladder comes up (gap, radians,
// centred on angle `ga`). z = 0 is the deck's top. R0 the inner edge (against the bark), R1 the outer edge.
export function treeDeck(R0 = 560, R1 = 1080, trunkR = 540, ga = 0, gap = 0.22) {
  R0 = q(R0); R1 = q(R1); trunkR = q(trunkR);
  return ['vtdeck|' + [R0, R1, trunkR, Math.round(ga * 100), Math.round(gap * 100)].join('|'), shape((G) => {
    const W = 0x9a6a40, WL = 0xb07a48, WD = 0x5a3a22, T = 12, nb = 48;
    // the boards: true wedges, a hair apart, two tones
    for (let i = 0; i < nb; i++) {
      const a0 = (i / nb) * Math.PI * 2 + 0.004, a1 = ((i + 1) / nb) * Math.PI * 2 - 0.004, c = i % 3 === 0 ? W : i % 3 === 1 ? WL : dark(WL, 0.92);
      G.surf((u, v) => { const a = a0 + (a1 - a0) * u, r = R0 + (R1 - R0) * v; return [Math.cos(a) * r, Math.sin(a) * r, 0]; }, 0, 1, 2, 0, 1, 4, c);
      G.surf((u, v) => { const a = a0 + (a1 - a0) * u, r = R0 + (R1 - R0) * v; return [Math.cos(a) * r, Math.sin(a) * r, -T]; }, 0, 1, 2, 0, 1, 4, dark(c, 0.7));
      G.surf((u, v) => { const a = a0 + (a1 - a0) * u; return [Math.cos(a) * R1, Math.sin(a) * R1, -T * v]; }, 0, 1, 2, 0, 1, 1, dark(c, 0.85));
    }
    // the rim beam under the outer edge, a ring of bark-on log
    { const pts = []; for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2; pts.push([Math.cos(a) * (R1 - 14), Math.sin(a) * (R1 - 14), -T - 12]); } G.tube(pts, 13, WD, { S: 8, caps: false }); }
    // joists from inside the bark out to the rim, and knee braces from the trunk below up to the joists
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + 0.13, ca = Math.cos(a), sa = Math.sin(a);
      G.blob((ca * (trunkR * 0.86 + R1 - 20)) / 2, (sa * (trunkR * 0.86 + R1 - 20)) / 2, -T - 10, (R1 - 20 - trunkR * 0.86) / 2, 9, 10, WD, { e: 8, nu: 8, nv: 3, warp: (x, y, z) => { const c = Math.cos(a), s = Math.sin(a); return [x * c - y * s + 0 * s, x * s + y * c, z]; } });
      if (i % 2 === 0) G.tube([[ca * trunkR * 0.92, sa * trunkR * 0.92, -330], [ca * (R0 + R1) * 0.48, sa * (R0 + R1) * 0.48, -T - 18]], 9, WD, { S: 7 }); }
    // the railing: posts and a top rail, open at the ladder
    const inGap = (a) => Math.abs(Math.atan2(Math.sin(a - ga), Math.cos(a - ga))) < gap;
    const post = (a) => G.tube([[Math.cos(a) * (R1 - 10), Math.sin(a) * (R1 - 10), 0], [Math.cos(a) * (R1 - 10), Math.sin(a) * (R1 - 10), 98]], 4.5, WD, { S: 6 });
    for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; if (!inGap(a)) post(a); }
    for (const e of [-1, 1]) post(ga + e * (gap + 0.004));   // the posts either side of the opening, where the rail ends
    let run = [];
    for (let i = 0; i <= 144; i++) { const a = ga + gap + 0.004 + (i / 144) * (Math.PI * 2 - 2 * gap - 0.008); run.push([Math.cos(a) * (R1 - 10), Math.sin(a) * (R1 - 10), 96]); }
    if (run.length > 1) G.tube(run, 4, WL, { S: 6 });
  })];
}

// ---- a dress form on a tripod stand: a padded torso in shop cloth, a turned neck knob, a tape measure round its shoulders
export function dressForm(col = 0x8a4a5a) {
  return ['vdform|' + hx(col), shape((G) => {
    const WD = 0x5a3a22;
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; G.tube([[Math.cos(a) * 32, Math.sin(a) * 32, 0], [Math.cos(a) * 8, Math.sin(a) * 8, 22], [0, 0, 30]], 3.4, WD, { S: 6 }); }
    G.tube([[0, 0, 28], [0, 0, 122]], 3.6, WD, { S: 6 }); G.lathe([[7, 26], [8, 30], [5, 34]], VC.brass, 10);
    // the torso: hips, waist, bust and shoulders as one turned form, a little flattened front to back
    const prof = [[4, 116], [22, 120], [30, 132], [27, 146], [22, 160], [26, 176], [29, 192], [27, 204], [16, 212], [9, 216], [8, 222]];
    const b = G.n; G.lathe(prof, (k) => (k < 1 ? WD : col), 20); G.map(b, ([x, y, z]) => [x * 0.78, y, z]);
    G.lathe([[8, 222], [11, 226], [9, 232], [0, 234]], WD, 10);
    for (const e of [-1, 1]) G.tube([[e * 6, -18, 205], [e * 10, -24, 196], [e * 9, -21, 170], [e * 8, -18, 156]], 1.6, 0xe8c84a, { S: 4 });
    G.tube([[0, -18, 205], [-14, 0, 210], [0, 18, 205], [14, 0, 210], [0, -18, 205]].map(([x, y, z]) => [x * 0.9, y * 1.05, z]), 1.6, 0xe8c84a, { S: 4, caps: false });
  })];
}

// ---- a draper's rack: three shelves of cloth bolts lying front to back, their round ends to the customer (+X), each
// end showing the rolled layers; a plank back, end boards and a cap. len along Y.
export function clothRack(len = 220, seed = 1) {
  len = q(len, 20);
  return ['vcrack|' + [len, seed % 3].join('|'), shape((G) => {
    const WD = 0x6a4428, WL = 0x8a5a34, D = 56, R = rng(seed * 13 + len), cols = [0xc8392e, 0x3a6a8a, 0xd8a03a, 0x5a8a3a, 0x8a4a5a, 0xe8dcc0, 0x6a3a7a, 0x2e5a4a];
    for (const e of [-1, 1]) block(G, -D / 2, e * len / 2 - (e > 0 ? 8 : 0), 0, D / 2, e * len / 2 + (e < 0 ? 8 : 0), 134, WD);
    block(G, -D / 2, -len / 2, 0, -D / 2 + 5, len / 2, 130, dark(WL, 0.8));
    for (const z of [8, 50, 92]) block(G, -D / 2, -len / 2 + 8, z - 5, D / 2, len / 2 - 8, z, WL, WL, WD);
    block(G, -D / 2 - 4, -len / 2 - 6, 130, D / 2 + 4, len / 2 + 6, 136, WD);
    for (const z0 of [8, 50, 92]) { const n = Math.floor((len - 20) / 29); for (let i = 0; i < n; i++) { const r = 13.5, y = -len / 2 + 12 + r + i * ((len - 24 - 2 * r) / Math.max(1, n - 1)), c = cols[Math.floor(R() * cols.length)], z = z0 + r;
        if (z0 === 92 && i === n - 2) continue;   // one gap on the top shelf, where a bolt has been sold
        G.tube([[-D / 2 + 6, y, z], [D / 2 + 2, y, z]], r, (t, a) => (Math.sin(a * 2 + i) > 0.85 ? dark(c, 0.86) : c), { S: 12, caps: false, M: 2 });
        G.surf((u, v) => { const a = u * Math.PI * 2, k = v; return [D / 2 + 2, y + Math.cos(a) * r * k, z + Math.sin(a) * r * k]; }, 0, 1, 12, 0, 1, 1, c, true);
        for (const k of [0.38, 0.7]) G.surf((u, v) => { const a = u * Math.PI * 2, rr = r * (k + v * 0.07); return [D / 2 + 2.3, y + Math.cos(a) * rr, z + Math.sin(a) * rr]; }, 0, 1, 12, 0, 1, 1, dark(c, 0.72), true);
        G.surf((u, v) => { const a = u * Math.PI * 2, rr = 3 + v * 1.4; return [D / 2 + 2.4, y + Math.cos(a) * rr, z + Math.sin(a) * rr]; }, 0, 1, 8, 0, 1, 1, 0x3a2a1e, true); } }
  })];
}
