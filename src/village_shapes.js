// Sculpted pieces for the gnome village: mushroom cottages, a thatched cottage, trees, bushes, flowers, fences,
// lanterns, the well, the windmill, the casino's toadstool and its tables, the noticeboard, rocks and hills.
// Same rules as descent_shapes.js: UE frame (X the front, Y right, Z up, cm), each returns [key, build] for
// world.Shape(), keys carry every number the shape depends on. Things stand on z = 0.
import { shape, sstep, wob } from './propkit.js';

const q = (v, s = 10) => Math.round(v / s) * s;
const hx = (c) => (c >>> 0).toString(16);
export const dark = (c, k) => { const r = Math.round(((c >> 16) & 255) * k), g = Math.round(((c >> 8) & 255) * k), b = Math.round((c & 255) * k); return (Math.min(255, r) << 16) | (Math.min(255, g) << 8) | Math.min(255, b); };
export const mix = (a, b, t) => { const f = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t); return (f(16) << 16) | (f(8) << 8) | f(0); };
const rng = (seed) => { let s = (seed | 0) % 2147483647; if (s <= 0) s += 2147483646; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };

export const VC = {
  cream: 0xf2e4c6, cream2: 0xe2cfa8, red: 0xc8392e, spot: 0xfbf4e6, wood: 0x8a5a34, woodD: 0x5a3a22, woodL: 0xb07a48, thatch: 0xd2a254, stone: 0xa49d90, stoneD: 0x7a746a,
  moss: 0x6a8a3a, grass: 0x7fae4c, leaf: 0x5c8e3a, leaf2: 0x76a844, leaf3: 0x4a7a30, glass: 0xffd27a, brass: 0xc8a24a, iron: 0x3a3a40, felt: 0x2f7a4a, feltR: 0x8a2a2a, water: 0x4a8aa0,
};

// the cottage stem's profile, and its radius at a height (so windows, glows and pots sit on its skin)
export const stemProfile = (h, r) => [[r * 1.08, 0], [r * 1.12, 18], [r * 1.02, 30], [r * 1.06, h * 0.25], [r * 1.1, h * 0.5], [r * 1.04, h * 0.78], [r * 0.95, h * 0.92], [r * 0.9, h]];
export function stemR(h, r, z) { const P = stemProfile(h, r); for (let i = 1; i < P.length; i++) if (z <= P[i][1]) { const t = (z - P[i - 1][1]) / Math.max(1e-6, P[i][1] - P[i - 1][1]); return P[i - 1][0] + (P[i][0] - P[i - 1][0]) * t; } return P[P.length - 1][0]; }
// ---- a mushroom cottage: a fat stem with a round door, windows and a flower box, under a spotted cap with a chimney
export function shroomHouse(h, r, cap = VC.red, stem = VC.cream, seed = 1) {
  h = q(h); r = q(r);
  return ['vshroomhouse|' + [h, r, hx(cap), hx(stem), seed % 7].join('|'), shape((G) => {
    const R = rng(seed * 97 + h);
    // the stem bulges a little and leans; stone footing ring
    const prof = stemProfile(h, r);
    G.lathe([[r * 1.18, 0], [r * 1.2, 26], [r * 1.12, 34]], VC.stoneD, 20);
    G.lathe(prof, (k) => (k === 0 ? dark(stem, 0.85) : stem), 22);
    // the door, on the front (+X): a round-topped plank door in a stone frame, with a brass knob and a step
    const dh = Math.min(240, h * 0.5), dw = 120, fx = r * 1.04;
    // everything on the front sits on the stem's own skin (it bulges as it rises), so the stem never shows through the door
    const skin = (x, z, inset) => Math.sqrt(Math.max(0, stemR(h, r, Math.max(0, z)) ** 2 - x * x)) + inset;
    const door = (u, v, inset) => { const x = (u - 0.5) * dw, top = dh - dw / 2, z = v * (top + Math.sqrt(Math.max(0, (dw / 2) ** 2 - x * x))); return [skin(x, z, inset), x, z]; };
    G.surf((u, v) => door(u, v, 6), 0, 1, 16, 0, 1, 10, (u) => ((Math.floor(u * 4) % 2) ? VC.wood : dark(VC.wood, 0.9)));
    G.surf((u, v) => { const a = Math.PI * u, rr = dw / 2 + 4 + v * 14, y = Math.cos(a) * rr, z = dh - dw / 2 + Math.sin(a) * rr; return [skin(y, z, 9), y, z]; }, 0, 1, 16, 0, 1, 1, VC.stone);
    for (const s of [-1, 1]) G.blob(skin(s * (dw / 2 + 11), (dh - dw / 2) / 2, 3), s * (dw / 2 + 11), (dh - dw / 2) / 2, 8, 7, (dh - dw / 2) / 2, VC.stone, { e: 6 });
    G.blob(skin(34, dh * 0.45, 12), 34, dh * 0.45, 5, 5, 5, VC.brass);
    G.blob(skin(0, 0, 18), 0, 5, 26, 54, 6, VC.stone, { e: 4 }); G.blob(skin(0, 0, 40), 0, 2, 22, 46, 3, VC.stoneD, { e: 4 });   // a worn stone step, not a plank
    // round windows round the stem, each with a frame, a cross and a glow behind; flower boxes under two of them
    for (const [a, z] of [[50, h * 0.42], [-50, h * 0.42], [130, h * 0.62], [-150, h * 0.3], [0, h * 0.78]]) {
      const ar = (a * Math.PI) / 180, rr = stemR(h, r, z) + 1, b = G.n, wr = 34;
      G.surf((u, v) => { const t = u * Math.PI * 2, k = v * wr; return [0, Math.cos(t) * k, Math.sin(t) * k]; }, 0, 1, 14, 0, 1, 1, VC.glass);
      G.surf((u, v) => { const t = u * Math.PI * 2, k = wr + v * 10; return [2, Math.cos(t) * k, Math.sin(t) * k]; }, 0, 1, 14, 0, 1, 1, VC.woodD);
      G.blob(3, 0, 0, 2, wr, 3, VC.woodD, { e: 6, nu: 6, nv: 3 }); G.blob(3, 0, 0, 2, 3, wr, VC.woodD, { e: 6, nu: 6, nv: 3 });
      G.place(b, { x: Math.cos(ar) * (rr + 1), y: Math.sin(ar) * (rr + 1), z, yaw: a });
      if (Math.abs(a) === 50) {
        const b2 = G.n; G.blob(10, 0, -wr - 14, 20, wr + 12, 12, VC.woodL, { e: 8 });
        for (let i = 0; i < 6; i++) G.blob(16, (i - 2.5) * 12, -wr - 2, 9, 9, 9, [0xf08aa8, 0xf6d04a, 0xffffff, 0xa070d0][i % 4], { nu: 8, nv: 5 });
        G.place(b2, { x: Math.cos(ar) * rr, y: Math.sin(ar) * rr, z, yaw: a });
      }
    }
    // the cap: a deep dome, a curled lip, gills under it, and spots
    const CR = r * 2.15, CH = r * 1.35, z0 = h - 20;
    const capP = [[CR * 0.92, z0 - 22], [CR, z0 + 2], [CR * 0.97, z0 + CH * 0.22], [CR * 0.86, z0 + CH * 0.5], [CR * 0.64, z0 + CH * 0.78], [CR * 0.36, z0 + CH * 0.95], [0, z0 + CH]];
    G.lathe(capP, cap, 30);
    G.lathe([[r * 0.95, z0 + 6], [CR * 0.6, z0 - 4], [CR * 0.9, z0 - 20]], dark(cap, 0.5), 30);
    for (let i = 0; i < 16; i++) {
      const a = R() * Math.PI * 2, k = 0.2 + R() * 0.65, rr = CR * Math.sin(k * Math.PI / 2) * 0.98, zz = z0 + CH * Math.cos(k * Math.PI / 2) * 0.98 + 2, s = CR * (0.06 + R() * 0.06);
      const b = G.n; G.blob(0, 0, 0, s, s * 0.85, s * 0.2, VC.spot, { nu: 10, nv: 5 });
      G.place(b, { x: Math.cos(a) * rr, y: Math.sin(a) * rr, z: zz, yaw: (a * 180) / Math.PI, pitch: k * 80 });
    }
    // a stone chimney through the cap, with a cowl
    const cx = -CR * 0.35, cy = CR * 0.25, cz = z0 + CH * 0.72;
    G.lathe([[34, 0], [36, 10], [32, 150], [40, 156], [40, 172], [30, 176]], (k) => (k >= 2 ? VC.stoneD : VC.stone), 10, [cx, cy, cz - 30]);
  })];
}

// ---- a cottage with a thatched roof that droops to the eaves, timbered walls, a round door and a stone chimney
export function thatchCottage(w, d, h, wall = VC.cream, seed = 1) {
  w = q(w); d = q(d); h = q(h);
  return ['vthatch|' + [w, d, h, hx(wall), seed % 5].join('|'), shape((G) => {
    G.blob(0, 0, h / 2, w / 2, d / 2, h / 2 + 4, wall, { e: 10, nu: 24, nv: 10 });
    G.blob(0, 0, 14, w / 2 + 10, d / 2 + 10, 16, VC.stoneD, { e: 10 });
    // timbers: corner posts, a sill and a beam, and crossed braces on the long sides
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.blob(sx * (w / 2 - 2), sy * (d / 2 - 2), h / 2, 10, 10, h / 2, VC.woodD, { e: 8, nu: 6, nv: 4 });
    for (const sx of [-1, 1]) { G.blob(sx * (w / 2 + 2), 0, h - 10, 8, d / 2, 8, VC.woodD, { e: 8, nu: 6, nv: 4 }); G.blob(sx * (w / 2 + 2), 0, h * 0.5, 7, d / 2, 7, VC.woodD, { e: 8, nu: 6, nv: 4 }); }
    for (const sy of [-1, 1]) { G.blob(0, sy * (d / 2 + 2), h - 10, w / 2, 8, 8, VC.woodD, { e: 8, nu: 6, nv: 4 }); G.tube([[-w / 2 + 20, sy * (d / 2 + 3), 30], [-w * 0.05, sy * (d / 2 + 3), h - 20]], 6, VC.woodD, { S: 6 }); G.tube([[w / 2 - 20, sy * (d / 2 + 3), 30], [w * 0.05, sy * (d / 2 + 3), h - 20]], 6, VC.woodD, { S: 6 }); }
    // the front (+X): round door, windows either side with shutters, a glow in each pane
    const fx = w / 2 + 6;
    G.surf((u, v) => { const y = (u - 0.5) * 110, top = 160, z = v * (top + Math.sqrt(Math.max(0, 55 * 55 - y * y))); return [fx, y, z]; }, 0, 1, 8, 0, 1, 6, (u) => (Math.floor(u * 5) % 2 ? VC.wood : dark(VC.wood, 0.88)));
    G.blob(fx + 4, 30, 100, 5, 5, 5, VC.brass);
    for (const sy of [-1, 1]) for (const yy of [sy * d * 0.3]) { G.blob(fx, yy, h * 0.55, 3, 42, 36, VC.glass, { e: 8, nu: 6, nv: 4 }); G.blob(fx + 2, yy, h * 0.55, 3, 46, 4, VC.woodD, { e: 8, nu: 6, nv: 3 }); G.blob(fx + 2, yy, h * 0.55, 3, 4, 40, VC.woodD, { e: 8, nu: 6, nv: 3 }); for (const e of [-1, 1]) G.blob(fx + 4, yy + e * 64, h * 0.55, 4, 20, 42, 0x4a7a8a, { e: 8, nu: 6, nv: 4 }); }
    // the thatch: a deep, soft roof with a ridge, its edge ragged and lifted at the eaves
    const R = rng(seed * 31 + w), rw = w / 2 + 70, rd = d / 2 + 70, rh = h * 1.05;
    G.surf((u, v) => {
      const a = u * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), sq = (t) => Math.sign(t) * Math.pow(Math.abs(t), 0.6);
      const ex = rw * sq(ca), ey = rd * sq(sa), k = Math.pow(v, 1.4), rag = v < 0.08 ? wob(a * 9, seed) * 10 : 0;
      return [ex * (1 - k * 0.9), ey * (1 - k * 0.98), h - 30 + rag + rh * Math.sin(k * Math.PI / 2) + wob(a * 5, v * 4) * 6 * (1 - v)];
    }, 0, 1, 40, 0, 1, 10, (u, v) => (v < 0.1 ? dark(VC.thatch, 0.8) : mix(VC.thatch, 0xe0b868, wob(u * 20, v * 6) * 0.5 + 0.3)), true);
    G.blob(0, 0, h - 30 + rh, w * 0.1, rd * 0.12, 18, dark(VC.thatch, 0.75), { e: 4 });
    const cx = -w * 0.25, cy = -d * 0.2;
    G.lathe([[34, 0], [34, rh + 120], [42, rh + 126], [42, rh + 140], [30, rh + 146]], VC.stone, 8, [cx, cy, h - 60]);
    void R;
  })];
}

// ---- a broad tree: a flared trunk with roots and two boughs, under a crown of soft lumps in three greens
export function tree(h, leaf = VC.leaf, seed = 1, kind = 0) {
  h = q(h, 20);
  return ['vtree|' + [h, hx(leaf), seed % 9, kind].join('|'), shape((G) => {
    const R = rng(seed * 131 + h), tr = h * 0.055, bark = mix(VC.woodD, 0x6a5040, 0.4), lean = (R() - 0.5) * h * 0.08;
    G.tube([[0, 0, -20], [lean * 0.3, 0, h * 0.3], [lean, 0, h * 0.62]], (t) => tr * (1.5 - 0.6 * t) * (t < 0.08 ? 1.3 : 1), (t, a) => (Math.sin(a * 5 + t * 9) > 0.6 ? dark(bark, 0.82) : bark), { S: 12 });
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + R(); G.tube([[0, 0, h * 0.08], [Math.cos(a) * tr * 2.2, Math.sin(a) * tr * 2.2, 10], [Math.cos(a) * tr * 3.4, Math.sin(a) * tr * 3.4, -10]], (t) => tr * 0.5 * (1 - t * 0.7), bark, { S: 6 }); }
    for (const s of [-1, 1]) G.tube([[lean * 0.5, 0, h * 0.42], [lean + s * h * 0.12, s * h * 0.06, h * 0.6], [lean + s * h * 0.2, s * h * 0.1, h * 0.7]], (t) => tr * 0.55 * (1 - t * 0.6), bark, { S: 8 });
    if (kind === 1) {   // a fir: tiers of drooping skirts
      const tiers = 6; for (let i = 0; i < tiers; i++) { const t = i / tiers, rr = h * (0.36 - t * 0.27), z = h * (0.22 + t * 0.7); G.lathe([[rr * 0.1, z + h * 0.14], [rr * 0.6, z + h * 0.06], [rr, z - h * 0.02], [rr * 0.9, z - h * 0.05], [0, z - h * 0.02]], (k) => (k === 2 ? dark(leaf, 0.8) : mix(leaf, VC.leaf3, t * 0.5)), 14); }
      return;
    }
    const cols = [leaf, mix(leaf, VC.leaf2, 0.6), mix(leaf, VC.leaf3, 0.6)], cz = h * 0.74, crw = h * 0.42;
    for (let i = 0; i < 9; i++) {
      const a = R() * Math.PI * 2, rr = i === 0 ? 0 : crw * (0.35 + R() * 0.45), z = cz + (i === 0 ? h * 0.08 : (R() - 0.3) * h * 0.22), s = crw * (i === 0 ? 0.75 : 0.42 + R() * 0.2);
      G.blob(lean + Math.cos(a) * rr, Math.sin(a) * rr, z, s, s * (0.9 + R() * 0.2), s * 0.78, cols[i % 3], { e: 2, nu: 16, nv: 10, warp: (x, y, z2, nx, ny, nz) => { const w2 = 1 + 0.08 * wob(nx * 6 + i, ny * 6 + nz * 3); return [x * w2, y * w2, z2 * w2]; } });
    }
  })];
}

// ---- a round bush of a few lumps, sometimes with berries or blossom
export function bush(r, leaf = VC.leaf2, dots = 0, seed = 1) {
  r = q(r);
  return ['vbush|' + [r, hx(leaf), hx(dots), seed % 6].join('|'), shape((G) => {
    const R = rng(seed * 17 + r);
    for (let i = 0; i < 5; i++) { const a = R() * 6.28, d = i ? r * 0.5 : 0, s = r * (i ? 0.62 : 0.8); G.blob(Math.cos(a) * d, Math.sin(a) * d, s * 0.7, s, s, s * 0.8, i % 2 ? leaf : dark(leaf, 0.88), { nu: 12, nv: 8 }); }
    if (dots) for (let i = 0; i < 14; i++) { const a = R() * 6.28, k = R() * 0.9, rr = r * 0.95 * Math.sin(k * 1.4) + r * 0.2, z = r * (0.55 + 0.6 * Math.cos(k * 1.4)); G.blob(Math.cos(a) * rr, Math.sin(a) * rr, z, r * 0.07, r * 0.07, r * 0.07, dots, { nu: 6, nv: 4 }); }
  })];
}

// ---- a flower on a curved stem: a cup of petals round a centre; big ones are as tall as a gnome
export function flower(h, petal, centre = 0xf6c43a, seed = 1, n = 6) {
  h = q(h, 5);
  return ['vflower|' + [h, hx(petal), hx(centre), seed % 5, n].join('|'), shape((G) => {
    const bend = ((seed % 5) - 2) * h * 0.05, top = [bend, 0, h];
    G.tube([[0, 0, 0], [bend * 0.3, 0, h * 0.5], top], h * 0.025 + 1.5, 0x5a8a34, { S: 6, caps: false });
    for (const s of [-1, 1]) { const b = G.n; G.blob(h * 0.12, 0, 0, h * 0.13, h * 0.05, h * 0.015, 0x6a9a3a, { nu: 8, nv: 4 }); G.place(b, { x: bend * 0.2, z: h * (0.3 + 0.12 * s), yaw: s * 70 + 20, pitch: -25 }); }
    const pr = h * 0.16;
    for (let i = 0; i < n; i++) { const a = (i / n) * 360, b = G.n; G.blob(pr * 0.6, 0, 0, pr * 0.62, pr * 0.32, pr * 0.08, petal, { nu: 10, nv: 5 }); G.place(b, { x: top[0], y: top[1], z: top[2], yaw: a, pitch: -28 }); }
    G.blob(top[0], top[1], top[2] + pr * 0.12, pr * 0.32, pr * 0.32, pr * 0.2, centre, { nu: 10, nv: 6 });
  })];
}

// ---- a picket fence: posts, two rails and pointed pickets; len along X
export function fence(len, col = 0xe8dcc0, h = 90) {
  len = q(len, 20); h = q(h);
  return ['vfence|' + [len, hx(col), h].join('|'), shape((G) => {
    const n = Math.max(2, Math.round(len / 22));
    for (let i = 0; i <= n; i++) { const x = -len / 2 + (len * i) / n, post = i % 5 === 0, hh = post ? h + 10 : h - 8 + (i % 2) * 4; G.blob(x, 0, hh / 2, post ? 6 : 4.5, post ? 6 : 2.5, hh / 2, post ? dark(col, 0.85) : col, { e: 8, nu: 6, nv: 3 }); G.lathe([[post ? 6 : 4.5, 0], [0, post ? 10 : 9]], col, 4, [x, 0, hh]); }
    for (const z of [h * 0.3, h * 0.72]) G.blob(0, -4, z, len / 2, 2, 4, dark(col, 0.9), { e: 10, nu: 6, nv: 3 });
  })];
}

// ---- a lantern post: a crooked wooden post with a hook arm and a caged lantern hanging off it (lit by the map)
export function lanternPost(h = 300, seed = 1) {
  h = q(h);
  return ['vlpost|' + [h, seed % 4].join('|'), shape((G) => {
    const k = ((seed % 4) - 1.5) * 6;
    G.tube([[0, 0, 0], [k, 0, h * 0.5], [-k * 0.5, 0, h]], (t) => 9 - t * 2, (t, a) => (Math.sin(a * 3 + t * 30) > 0.7 ? VC.woodD : VC.wood), { S: 8 });
    G.tube([[-k * 0.5, 0, h - 10], [30, 0, h + 6], [62, 0, h - 4]], 3.5, VC.iron, { S: 6 });
    G.lathe([[0, -22], [12, -20], [14, -6], [12, 10], [0, 14]], VC.iron, 8, [62, 0, h - 58]);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.785; G.tube([[62 + Math.cos(a) * 13, Math.sin(a) * 13, h - 78], [62 + Math.cos(a) * 13, Math.sin(a) * 13, h - 50]], 1.3, VC.iron, { S: 4, caps: false }); }
    G.blob(62, 0, h - 64, 10, 10, 13, VC.glass, { nu: 10, nv: 6 });
    G.tube([[62, 0, h - 44], [62, 0, h - 6]], 1.2, VC.iron, { S: 4 });
  })];
}

// ---- the village well: a stone ring, a little shingled roof on two posts, a crank, a rope and a bucket
export function well() {
  return ['vwell', shape((G) => {
    const R = rng(5);
    for (let row = 0; row < 4; row++) for (let i = 0; i < 14; i++) { const a = ((i + (row % 2) * 0.5) / 14) * Math.PI * 2, c = mix(VC.stone, VC.stoneD, R() * 0.7), b = G.n; G.blob(0, 0, 0, 20, 16, 12, c, { e: 4, nu: 8, nv: 5 }); G.place(b, { x: Math.cos(a) * 92, y: Math.sin(a) * 92, z: 13 + row * 23, yaw: (a * 180) / Math.PI }); }
    G.lathe([[78, 2], [78, 70], [0, 70]], 0x1a2a2a, 20);
    G.lathe([[80, 98], [90, 100], [90, 106], [78, 106]], VC.stoneD, 20);
    for (const s of [-1, 1]) G.tube([[0, s * 96, 96], [0, s * 96, 280]], 7, VC.wood, { S: 6 });
    G.tube([[0, -110, 220], [0, 110, 220]], 5, VC.woodD, { S: 6 });
    G.tube([[0, 110, 220], [24, 118, 220], [24, 118, 196]], 2.5, VC.iron, { S: 4 });
    G.tube([[0, 0, 220], [0, 0, 150]], 1.2, 0xc8b48a, { S: 4 });
    G.lathe([[16, 0], [20, 26], [21, 28], [0, 28]], VC.wood, 10, [0, 0, 122]); G.tube([[0, -20, 150], [0, 0, 160], [0, 20, 150]], 1.2, VC.iron, { S: 4 });
    // the roof: two pitched planes of shingles
    for (const s of [-1, 1]) for (let r = 0; r < 5; r++) G.surf((u, v) => { const t = (r + v) / 5; return [s * (8 + t * 118), (u - 0.5) * 300, 330 - t * 74 - (r % 2) * 0]; }, 0, 1, 12, 0, 1, 1, (u) => (Math.floor(u * 12 + r) % 2 ? VC.red : dark(VC.red, 0.85)));
    G.tube([[0, -154, 332], [0, 154, 332]], 7, VC.woodD, { S: 6 });
    for (const s of [-1, 1]) G.tube([[0, s * 96, 280], [0, s * 96, 330]], 6, VC.wood, { S: 6 });
  })];
}

// ---- a windmill: a tapering stone tower, a wooden cap, four lattice sails, a door and two windows
export function windmill(h = 1100) {
  h = q(h);
  return ['vmill|' + h, shape((G) => {
    const rb = h * 0.2, rt = h * 0.13;
    G.lathe([[rb * 1.05, 0], [rb, 30], [rt, h], [rt * 1.12, h + 8]], (k) => (k === 0 ? VC.stoneD : VC.cream), 20);
    for (let i = 0; i < 6; i++) G.lathe([[rb - (rb - rt) * (i / 6) + 2, h * (i / 6) + 40], [rb - (rb - rt) * (i / 6) + 3, h * (i / 6) + 48]], VC.cream2, 20);
    G.lathe([[rt * 1.2, h], [rt * 1.25, h + 30], [rt * 0.9, h + rt * 1.1], [0, h + rt * 1.4]], VC.wood, 16);
    G.surf((u, v) => { const y = (u - 0.5) * 100, z = v * (180 + Math.sqrt(Math.max(0, 2500 - y * y))); return [rb + 4, y, z]; }, 0, 1, 6, 0, 1, 5, VC.woodD);
    for (const z of [h * 0.45, h * 0.72]) { const r = rb - (rb - rt) * (z / h) + 3; G.blob(r, 0, z, 3, 34, 44, VC.glass, { e: 8, nu: 6, nv: 4 }); G.blob(r + 2, 0, z, 3, 38, 4, VC.woodD, { e: 8, nu: 4, nv: 3 }); }
    // the sails, on a hub at the front of the cap
    const hx0 = rt * 1.3, hz = h + rt * 0.45;
    const b = G.n; G.lathe([[18, -30], [22, 10], [0, 28]], VC.woodD, 10);
    G.place(b, { x: hx0, z: hz, pitch: 90 });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.3, L = h * 0.62, ca = Math.cos(a), sa = Math.sin(a);
      G.tube([[hx0 + 20, 0, hz], [hx0 + 20, ca * L, hz + sa * L]], 6, VC.woodD, { S: 6 });
      for (let k = 0; k < 7; k++) { const t = 0.25 + k * 0.11, py = ca * L * t, pz = hz + sa * L * t, ny = -sa * 90, nz = ca * 90; G.tube([[hx0 + 22, py, pz], [hx0 + 22, py + ny, pz + nz]], 2.5, VC.wood, { S: 4 }); }
      G.surf((u, v) => { const t = 0.25 + u * 0.72; return [hx0 + 24, ca * L * t - sa * 90 * v, hz + sa * L * t + ca * 90 * v]; }, 0, 1, 4, 0, 1, 1, i % 2 ? 0xf0e8d8 : 0xe8d4b0);
    }
  })];
}

// ---- a rock: a lumpy, mossy boulder
export function rock(r, seed = 1, mossy = true) {
  r = q(r);
  return ['vrock|' + [r, seed % 8, mossy ? 1 : 0].join('|'), shape((G) => {
    G.blob(0, 0, r * 0.35, r, r * 0.8, r * 0.6, (x, y, z) => (mossy && z > 0.55 ? VC.moss : mix(VC.stone, VC.stoneD, 0.3 + 0.3 * wob(x * 5 + seed, y * 5))), { e: 2.6, nu: 18, nv: 10, warp: (x, y, z, nx, ny, nz) => { const k = 1 + 0.16 * wob(nx * 3 + seed, ny * 3 + nz * 2); return [x * k, y * k, Math.max(-r * 0.35, z * k)]; } });
  })];
}

// ---- a hill on the skyline: a long soft swell of grass with a few dark bands of hedge
export function hill(rx, ry, h, col = 0x6e9a44) {
  rx = q(rx, 100); ry = q(ry, 100); h = q(h, 50);
  return ['vhill|' + [rx, ry, h, hx(col)].join('|'), shape((G) => {
    G.blob(0, 0, 0, rx, ry, h, (x, y, z) => (z < 0 ? dark(col, 0.7) : mix(col, 0x86b052, 0.3 + 0.3 * wob(x * 3, y * 3))), { e: 2.2, nu: 28, nv: 12 });
  })];
}

// ---- a cabbage, a pumpkin
export function cabbage(r = 26) { r = q(r, 2); return ['vcab|' + r, shape((G) => { G.blob(0, 0, r * 0.7, r, r, r * 0.8, 0x8ac060, { nu: 12, nv: 8 }); for (let i = 0; i < 6; i++) { const b = G.n; G.blob(r * 0.6, 0, 0, r * 0.6, r * 0.5, r * 0.08, 0x6aa048, { nu: 8, nv: 4 }); G.place(b, { z: r * 0.5, yaw: i * 60, pitch: -40 }); } })]; }
export function pumpkin(r = 40) { r = q(r, 2); return ['vpump|' + r, shape((G) => { G.blob(0, 0, r * 0.75, r, r, r * 0.75, (x, y) => (Math.cos(Math.atan2(y, x) * 8) > 0.7 ? 0xd06a1a : 0xe8862a), { nu: 24, nv: 10, warp: (x, y, z, nx, ny) => { const k = 1 - 0.06 * Math.max(0, Math.cos(Math.atan2(ny, nx) * 8)); return [x * k, y * k, z]; } }); G.tube([[0, 0, r * 1.4], [4, 2, r * 1.65], [10, 0, r * 1.7]], 3, 0x5a6a2a, { S: 5 }); })]; }

// ---- a wooden noticeboard under its own little roof, papers pinned all over it (for the challenge board)
export function noticeBoard(w = 300) {
  w = q(w);
  return ['vboard|' + w, shape((G) => {
    for (const s of [-1, 1]) G.tube([[0, s * w / 2, -10], [0, s * w / 2, 290]], 9, VC.wood, { S: 8 });
    G.blob(0, 0, 175, 6, w / 2 - 6, 85, VC.woodL, { e: 8 });
    G.blob(1, 0, 175, 7, w / 2 - 2, 89, VC.woodD, { e: 10, nu: 6, nv: 3 });
    G.blob(4, 0, 175, 5, w / 2 - 14, 78, 0xa07a4a, { e: 10 });
    const R = rng(7);
    for (let i = 0; i < 9; i++) { const y = (R() - 0.5) * (w - 70), z = 110 + R() * 130, a = (R() - 0.5) * 14, b = G.n; G.blob(0, 0, 0, 1, 26 + R() * 10, 34 + R() * 10, [0xf4ecd6, 0xe8dcc0, 0xf6e4b0, 0xdce8f0][i % 4], { e: 10, nu: 4, nv: 3 }); G.blob(2, 0, 30, 2, 3, 3, 0xc83a2e, { nu: 4, nv: 3 }); G.place(b, { x: 10, y, z, roll: a }); }
    for (const s of [-1, 1]) G.surf((u, v) => [s * v * 60, (u - 0.5) * (w + 60), 300 + (1 - v) * 40], 0, 1, 8, 0, 1, 2, (u) => (Math.floor(u * 8) % 2 ? VC.red : dark(VC.red, 0.85)));
    G.tube([[0, -w / 2 - 30, 340], [0, w / 2 + 30, 340]], 6, VC.woodD, { S: 6 });
  })];
}

// ---- a wardrobe: a tall painted cabinet with two doors, carved crown, brass handles, little feet
export function wardrobeCab() {
  return ['vwardrobe', shape((G) => {
    const col = 0x3a6a8a, trim = 0xe8d8b0;
    G.blob(0, 0, 130, 40, 80, 120, col, { e: 10 });
    for (const s of [-1, 1]) { G.blob(41, s * 39, 128, 3, 36, 104, dark(col, 0.85), { e: 10 }); G.blob(43, s * 39, 128, 2, 28, 94, mix(col, trim, 0.15), { e: 10 }); G.blob(46, s * 6, 128, 3, 2, 14, VC.brass, { e: 4 }); G.blob(44, s * 39, 160, 1.6, 10, 10, trim, { nu: 8, nv: 4 }); }
    G.blob(0, 0, 258, 46, 88, 10, dark(col, 0.8), { e: 8 });
    G.surf((u, v) => { const y = (u - 0.5) * 170, z = 268 + v * 34 * (1 - Math.pow(Math.abs(u - 0.5) * 2, 2)); return [44, y, z]; }, 0, 1, 16, 0, 1, 3, trim);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.blob(sx * 32, sy * 70, 6, 8, 8, 8, VC.woodD);
  })];
}
// ---- a full-length mirror on a stand, oval, in a carved frame
export function mirror() {
  return ['vmirror', shape((G) => {
    G.surf((u, v) => { const a = u * Math.PI * 2, r = v; return [2, Math.cos(a) * 44 * r, 150 + Math.sin(a) * 82 * r]; }, 0, 1, 24, 0, 1, 1, 0xcfe4ec);
    G.surf((u, v) => { const a = u * Math.PI * 2, r = 1 + v * 0.14; return [0, Math.cos(a) * 44 * r, 150 + Math.sin(a) * 82 * r]; }, 0, 1, 24, 0, 1, 1, VC.brass);
    for (const s of [-1, 1]) G.tube([[-4, s * 56, 0], [-4, s * 52, 160]], 4, VC.woodD, { S: 6 });
    G.tube([[-30, -60, 2], [-30, 60, 2]], 5, VC.woodD, { S: 6 });
  })];
}

// ---- the Lucky Toadstool: a giant cap held up on twisted root pillars, gold-rimmed, lamps under the gills
export function toadstoolCap(R = 1400, H = 700, cap = 0xb82a2a) {
  R = q(R, 50); H = q(H, 50);
  return ['vtoad|' + [R, H, hx(cap)].join('|'), shape((G) => {
    const rr = rng(3);
    G.lathe([[R * 0.95, -40], [R, 0], [R * 0.96, H * 0.25], [R * 0.82, H * 0.55], [R * 0.58, H * 0.82], [R * 0.3, H * 0.96], [0, H]], cap, 40);
    G.lathe([[R * 0.95, -42], [R * 1.0, -48], [R * 1.01, -36]], VC.brass, 40);
    G.lathe([[R * 0.15, 10], [R * 0.55, 2], [R * 0.95, -40]], dark(cap, 0.45), 40);
    for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; G.tube([[Math.cos(a) * R * 0.18, Math.sin(a) * R * 0.18, 8], [Math.cos(a) * R * 0.93, Math.sin(a) * R * 0.93, -36]], 4, dark(cap, 0.36), { S: 3, caps: false }); }
    for (let i = 0; i < 26; i++) { const a = rr() * Math.PI * 2, k = 0.15 + rr() * 0.7, r2 = R * Math.sin(k * Math.PI / 2) * 0.97, z = H * Math.cos(k * Math.PI / 2) * 0.97 + 4, s = R * (0.05 + rr() * 0.05), b = G.n; G.blob(0, 0, 0, s, s * 0.85, s * 0.18, VC.spot, { nu: 10, nv: 5 }); G.place(b, { x: Math.cos(a) * r2, y: Math.sin(a) * r2, z, yaw: (a * 180) / Math.PI, pitch: k * 80 }); }
  })];
}
export function rootPillar(h, seed = 1) {
  h = q(h);
  return ['vroot|' + [h, seed % 4].join('|'), shape((G) => {
    const c = VC.cream2;
    for (let k = 0; k < 3; k++) { const ph = (k / 3) * Math.PI * 2 + seed; const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8, a = ph + t * 3.2; pts.push([Math.cos(a) * 22, Math.sin(a) * 22, t * h]); } G.tube(pts, (t) => 20 + 14 * (1 - t) + (t > 0.9 ? 10 : 0), (t, a) => (Math.sin(a * 4 + t * 20) > 0.6 ? dark(c, 0.86) : c), { S: 10 }); }
    G.lathe([[70, 0], [64, 20], [40, 40]], dark(c, 0.8), 14);
  })];
}

// ---- casino furniture
export function slotMachine(col = 0xb8282a) {
  return ['vslot|' + hx(col), shape((G) => {
    G.blob(0, 0, 70, 34, 42, 70, VC.woodD, { e: 8 });
    G.blob(0, 0, 160, 32, 40, 40, col, { e: 6 });
    G.blob(31, 0, 166, 4, 30, 18, 0xf4ecd6, { e: 8 });
    for (const y of [-16, 0, 16]) G.blob(34, y, 166, 2, 6, 12, [0xd8302a, 0x2a8a4a, 0xe8b830][(y / 16 + 1) | 0], { e: 4, nu: 6, nv: 4 });
    G.lathe([[34, 0], [36, 20], [26, 44], [0, 52]], VC.brass, 16, [0, 0, 196]);
    G.blob(40, 0, 120, 8, 30, 6, VC.brass, { e: 8 });
    G.tube([[0, 46, 150], [0, 54, 160], [0, 54, 220]], 3, 0xc8c8d0, { S: 6 }); G.blob(0, 54, 226, 9, 9, 9, 0xd8302a);
    G.blob(36, 0, 60, 2, 30, 8, VC.brass, { e: 8 });
  })];
}
export function rouletteTable(wheel = true) {
  return ['vroul' + (wheel ? '' : 'n'), shape((G) => {
    G.blob(0, 0, 84, 150, 90, 8, VC.felt, { e: 8 });
    G.blob(0, 0, 80, 158, 98, 10, VC.woodD, { e: 8 });
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.tube([[sx * 120, sy * 70, 0], [sx * 120, sy * 70, 76]], 7, VC.woodD, { S: 6 });
    // the wheel, at one end (left off when the casino turns a live one there)
    if (wheel) {
    G.lathe([[60, 0], [62, 10], [56, 14], [44, 12], [40, 8], [0, 12]], (k) => (k === 3 ? 0x1a1a1a : VC.woodL), 37, [-90, 0, 90]);
      for (let i = 0; i < 37; i++) { const a = (i / 37) * Math.PI * 2, c = i === 0 ? 0x2a8a3a : i % 2 ? 0xb82a2a : 0x1a1a1a; G.surf((u, v) => { const t = a + u * (Math.PI * 2 / 37), r = 40 + v * 12; return [-90 + Math.cos(t) * r, Math.sin(t) * r, 103]; }, 0, 1, 1, 0, 1, 1, c); }
      G.lathe([[10, 0], [8, 12], [2, 22], [0, 26]], VC.brass, 10, [-90, 0, 102]);
    }
    // the layout: numbered squares in three rows (the live casino paints its own, with the numbers on it)
    if (wheel) for (let c = 0; c < 12; c++) for (let r = 0; r < 3; r++) { const n = c * 3 + r + 1, red = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(n); G.blob(-10 + c * 13, (r - 1) * 22, 93, 6, 10, 0.6, red ? 0xb82a2a : 0x1a1a1a, { e: 10, nu: 4, nv: 2 }); }
  })];
}
export function cardTable(round = true, props = true) {
  return ['vcard|' + (round ? 1 : 0) + (props ? '' : 'n'), shape((G) => {
    if (round) { G.lathe([[130, 76], [132, 84], [122, 92], [0, 92]], (k) => (k === 2 ? VC.felt : VC.woodD), 32); G.lathe([[122, 92], [0, 92.4]], VC.felt, 32); }
    G.lathe([[50, 0], [24, 10], [20, 74], [60, 78]], VC.woodD, 12);
    if (props) for (let i = 0; i < 5; i++) { const a = -0.9 + i * 0.45, b = G.n; G.blob(0, 0, 0, 12, 17, 0.6, 0xf4ecd6, { e: 10, nu: 4, nv: 2 }); G.place(b, { x: Math.cos(a) * 80, y: Math.sin(a) * 80, z: 93.4, yaw: (a * 180) / Math.PI }); }
    for (let k = 0; k < 4; k++) G.lathe([[7, 0], [7, 2]], [0xd8302a, 0x1a1a1a, 0x2a6ad0, 0xf2eee4][k], 12, [-40, -30 + k * 18, 92.5 + 0]);
  })];
}
// a dice table: a long felt tray with a padded rail, two dice resting in it
export function diceTable(props = true) {
  return ['vdice' + (props ? '' : 'n'), shape((G) => {
    G.blob(0, 0, 80, 140, 70, 10, VC.woodD, { e: 8 });
    G.blob(0, 0, 92, 128, 58, 3, 0x2a5a8a, { e: 10 });
    G.blob(0, 0, 100, 142, 72, 10, 0x6a2a1a, { e: 6, warp: (x, y, z) => [x, y, z] });
    G.blob(0, 0, 97, 126, 56, 10, 0x2a5a8a, { e: 10 });
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.tube([[sx * 110, sy * 50, 0], [sx * 110, sy * 50, 74]], 7, VC.woodD, { S: 6 });
    if (props) for (const [x, y, a] of [[30, 10, 20], [52, -14, -35]]) { const b = G.n; G.blob(0, 0, 0, 9, 9, 9, 0xf4ecd6, { e: 8 }); for (const [dx, dy] of [[0, 0], [4, 4], [-4, -4]]) G.blob(9.2, dx, dy, 0.6, 1.6, 1.6, 0x1a1a1a, { nu: 6, nv: 3 }); G.place(b, { x, y, z: 109, yaw: a }); }
  })];
}

// ---- a shop counter with a striped awning over it is built from boxes and descent_shapes.awning; a hat stand and a
// gun rack dress it
export function hatStand() {
  return ['vhatstand', shape((G) => {
    G.tube([[0, 0, 0], [0, 0, 170]], 4, VC.woodD, { S: 6 }); G.lathe([[30, 0], [26, 6], [0, 8]], VC.woodD, 10);
    for (const [a, z, c] of [[0, 150, 0xc8392e], [120, 125, 0x3a6a8a], [240, 100, 0x6a8a3a]]) { const b = G.n; G.lathe([[22, 0], [22, 4], [12, 6], [9, 30], [2, 56], [0, 58]], c, 12); G.place(b, { x: Math.cos((a * Math.PI) / 180) * 20, y: Math.sin((a * Math.PI) / 180) * 20, z, pitch: 15 }); }
  })];
}

// ---- a tuft of grass: a dozen blades leaning out and curling over, two greens and a sun-bleached tip
export function grassTuft(h = 40, seed = 1) {
  h = q(h, 5);
  return ['vtuft|' + [h, seed % 6].join('|'), shape((G) => {
    const R = rng(seed * 59 + h), n = 11;
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2, lean = 0.25 + R() * 0.6, L = h * (0.6 + R() * 0.5), w0 = 2.6 + R() * 1.6, col = i % 3 ? 0x6e9c3c : 0x88b450, tip = mix(col, 0xd8d080, 0.45);
      G.surf((u, v) => { const t = v, bend = lean * t * t, x = Math.cos(a) * (bend * L + R() * 0), y = Math.sin(a) * bend * L, z = L * t * (1 - lean * 0.35 * t), w = w0 * (1 - t), px = -Math.sin(a) * w * (u - 0.5) * 2, py = Math.cos(a) * w * (u - 0.5) * 2; return [x + px, y + py, z]; }, 0, 1, 1, 0, 1, 4, (u, v) => (v > 0.7 ? tip : col));
    }
  })];
}
// ---- a little ring of toadstools, three to five, for the foot of a tree or a wall
export function toadstoolCluster(s = 1, cap = 0xc8392e, seed = 1) {
  return ['vtcl|' + [Math.round(s * 10), hx(cap), seed % 6].join('|'), shape((G) => {
    const R = rng(seed * 71 + 3), n = 3 + (seed % 3);
    for (let i = 0; i < n; i++) {
      const a = R() * 6.28, d = i ? 10 + R() * 16 : 0, h = (12 + R() * 16) * s * (i ? 0.8 : 1.2), w = h * (0.8 + R() * 0.4), x = Math.cos(a) * d * s, y = Math.sin(a) * d * s;
      G.lathe([[w * 0.16, 0], [w * 0.14, h * 0.5], [w * 0.12, h]], VC.cream, 8, [x, y, 0]);
      G.lathe([[w * 0.5, h - 2], [w * 0.52, h + 1], [w * 0.42, h + w * 0.22], [w * 0.2, h + w * 0.36], [0, h + w * 0.4]], cap, 12, [x, y, 0]);
      for (let k = 0; k < 4; k++) { const b = R() * 6.28, r = w * 0.3; G.blob(x + Math.cos(b) * r, y + Math.sin(b) * r, h + w * 0.24, w * 0.06, w * 0.06, w * 0.03, VC.spot, { nu: 6, nv: 3 }); }
    }
  })];
}
// ---- a fern: fronds springing from a crown, arching out and down, each with its leaflets either side of the rib
export function fern(h = 70, seed = 1) {
  h = q(h, 5);
  return ['vfern|' + [h, seed % 5].join('|'), shape((G) => {
    const R = rng(seed * 71 + h), n = 7 + Math.floor(R() * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + R() * 0.4, L = h * (0.8 + R() * 0.5), up = 0.9 + R() * 0.5, col = i % 2 ? 0x4e7a32 : 0x5e8a3a, tip = mix(col, 0x9aa850, 0.35);
      const P = (t) => [Math.cos(a) * L * t, Math.sin(a) * L * t, L * up * Math.sin(t * Math.PI * 0.85) * 0.75];
      G.surf((u, v) => { const t = v, [x, y, z] = P(t), w = L * 0.22 * Math.sin(Math.min(1, t * 1.15) * Math.PI) * (1 - t * 0.3), s = (u - 0.5) * 2; return [x - Math.sin(a) * w * s, y + Math.cos(a) * w * s, z - Math.abs(s) * w * 0.35]; }, 0, 1, 2, 0, 1, 8, (u, v) => (v > 0.75 ? tip : col));
    }
  })];
}
// ---- an old log gone to moss, a shelf fungus or two on its side
export function mossLog(len = 220, seed = 1) {
  len = q(len, 10);
  return ['vlog|' + [len, seed % 4].join('|'), shape((G) => {
    const R = rng(seed * 13 + len), r = 26 + R() * 10;
    G.tube([[-len / 2, 0, r * 0.8], [0, R() * 20 - 10, r * 0.85], [len / 2, 0, r * 0.75]], r, (t, a) => (Math.sin(a) > 0.35 ? VC.moss : Math.sin(a) > 0.1 ? mix(VC.moss, VC.woodD, 0.5) : VC.woodD), { S: 12 });
    for (const e of [-1, 1]) G.lathe([[r * 0.9, 0], [r * 0.6, 2], [0, 3]], 0xc8a878, 12, [e * len / 2, 0, r * 0.8], [0.05, 1]);
    for (let k = 0; k < 3; k++) { const x = -len * 0.3 + k * len * 0.25; G.blob(x, -r * 0.95, r * (0.9 + k * 0.15), 14, 9, 3, 0xd8b070, { e: 2.5, nu: 10, nv: 4 }); }
  })];
}
