// Sculpted pieces for the destinations (the Vale's farms first). Same rules as village_shapes.js: UE frame (X the
// front, Y right, Z up, cm), each returns [key, build] for world.Shape(), keys carry every number the shape depends
// on, and things stand on z = 0. Every piece is whole: no part hangs in the air or stops short of what holds it.
import { shape, wob } from './propkit.js';
import { dark, mix, VC } from './village_shapes.js';

const q = (v, s = 10) => Math.round(v / s) * s;
const hx = (c) => (c >>> 0).toString(16);
const rng = (seed) => { let s = (seed | 0) % 2147483647; if (s <= 0) s += 2147483646; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
export const FC = {   // the farm's own colours
  stone: [0x9a9486, 0x8c8678, 0xa8a090, 0x807b6e, 0xb2aa96, 0x948c7a], mortar: 0x4e4a42, lichen: 0xb4ae6a, lichen2: 0x8a9a58, moss: 0x5e7e34,
  oak: 0x8a6440, oakD: 0x5e4228, oakL: 0xa8804e, weath: 0x9a9080, weathD: 0x6e665a, iron: 0x3a3a40, rust: 0x7a4a2a,
  red: 0x9a3428, redD: 0x6e2219, whitewash: 0xe8e0cc, slate: 0x56606a, slateD: 0x3e464e, thatch: 0xc89a52, straw: 0xd8b062, strawD: 0xa8823e,
};

// ---- a run of drystone wall along X, len long: footing stones half sunk, courses of rough stones battered in towards
// the top, a row of coping stones stood on edge along the crown, lichen on some faces and moss along the foot. A dark
// core runs through it so a chink between stones never shows daylight.
export function stoneWall(len = 1000, h = 120, seed = 1) {
  len = q(len, 20); h = q(h);
  return ['dwall|' + [len, h, seed % 6].join('|'), shape((G) => {
    const R = rng(seed * 977 + len), half = len / 2, t = (z) => 40 - 9 * (z / h), sc = (x, y, z) => (wob(x * 0.05 + seed, z * 0.07) > 0.62 ? FC.lichen : wob(x * 0.03, y * 0.2 + z * 0.05 + seed) > 0.7 ? FC.lichen2 : null);
    G.blob(0, 0, h / 2, half, t(h / 2) - 7, h / 2, FC.mortar, { e: 10, nu: 6, nv: 4 });
    // footing: big stones bedded in the ground
    for (let x = -half + 30; x < half; x += 70 + R() * 30) { const c = FC.stone[Math.floor(R() * 6)]; G.blob(x, 0, 6, 38 + R() * 14, 46, 22, (nx, ny, nz) => sc(x + nx * 30, ny * 40, nz * 10) || c, { e: 3.2, nu: 6, nv: 4 }); }
    // the courses: each stone spans the wall, the joints never line up from one course to the next
    const courses = Math.max(3, Math.round((h - 34) / 26));
    for (let k = 0; k < courses; k++) {
      const z = 26 + k * ((h - 40) / courses) + 10, ch = (h - 40) / courses;
      let x = -half + (k % 2 ? 0 : 22) + R() * 10;
      while (x < half - 8) {
        const w = 30 + R() * 34, sx = Math.min(w, half - x) / 2; if (sx < 9) break;
        const c = FC.stone[Math.floor(R() * 6)], lean = (R() - 0.5) * 6;
        G.blob(x + sx, 0, z, sx + 2, t(z) + R() * 3, ch * 0.55 + R() * 3, (nx, ny, nz) => sc(x + nx * 20, ny * 40, z + nz * 10) || c, { e: 3.4, nu: 6, nv: 4, warp: (px, py, pz) => [px, py, pz + px * lean * 0.01] });
        x += sx * 2 + 1;
      }
    }
    // the coping: flat stones stood on edge, leaning a little this way and that
    for (let x = -half + 18; x < half - 14; x += 15 + R() * 5) { const b = G.n, c = FC.stone[Math.floor(R() * 6)]; G.blob(0, 0, 0, 7 + R() * 3, t(h) + 4, 17 + R() * 6, c, { e: 4, nu: 4, nv: 3 }); G.place(b, { x, z: h - 6, pitch: (R() - 0.5) * 16 }); }
    // moss along the foot on both faces
    for (const s of [-1, 1]) for (let x = -half + 40; x < half - 30; x += 90 + R() * 90) if (R() < 0.7) G.blob(x, s * (t(0) + 2), 4, 40 + R() * 40, 10, 9, FC.moss, { e: 2.6, nu: 6, nv: 3 });
  })];
}

// ---- a gatepost: a squared oak post, pegged, with a weathered cap
export function gatePost(h = 170) {
  h = q(h);
  return ['dgpost|' + h, shape((G) => {
    G.blob(0, 0, h / 2, 14, 14, h / 2, FC.oakD, { e: 8, nu: 8, nv: 4 });
    G.blob(0, 0, h + 4, 17, 17, 6, FC.weathD, { e: 6, nu: 8, nv: 3 });
    for (const z of [h * 0.3, h * 0.62]) for (const s of [-1, 1]) G.blob(s * 14.5, 0, z, 1.5, 3.4, 3.4, FC.oakL, { nu: 6, nv: 4 });
  })];
}
// ---- a five-bar gate leaf, hung on the left (y = 0 at the hinge stile), w long along +Y: two stiles, five rails, the
// brace from the foot of the hinge to the top of the latch, iron straps at the hinges and a latch bar
export function gateLeaf(w = 250, h = 130) {
  w = q(w); h = q(h);
  return ['dgate|' + [w, h].join('|'), shape((G) => {
    const wd = FC.weath, wdD = FC.weathD;
    for (const y of [5, w - 5]) G.blob(0, y, h / 2 + 4, 4.5, 5, h / 2, wdD, { e: 8, nu: 6, nv: 3 });
    for (let k = 0; k < 5; k++) { const z = 16 + k * ((h - 22) / 4); G.blob(0, w / 2, z, 3.2, w / 2 - 4, 5.5, wd, { e: 8, nu: 6, nv: 3 }); }
    { const a = Math.atan2(h - 30, w - 20); G.tube([[0, 10, 14], [0, w - 10, h - 10]], 3.2, wd, { S: 6 }); void a; }
    for (const z of [26, h - 14]) { G.blob(-4, 18, z, 1.2, 18, 3, FC.iron, { e: 8, nu: 6, nv: 3 }); G.blob(-2, 4, z, 3, 3, 4, FC.iron, { nu: 6, nv: 4 }); }
    G.blob(0, w - 2, h * 0.7, 2, 14, 2.4, FC.iron, { e: 8, nu: 6, nv: 3 });
  })];
}

// ---- a farmhouse, two storeys, its front (+X) on the yard. Lime-washed walls over a stone plinth with stone quoins
// at the corners; a timber-framed upper floor jettied out over the front; a deep thatched roof gabled at the ends
// (+Y and -Y), ridge along Y; a stone chimney stack built against the +Y gable; on the front a plank door under a
// little hood on brackets, shuttered windows with flower boxes below, three small windows above. w along Y, d along X.
// FH gives the heights the map needs (the eaves, the ridge, where the door lantern hangs).
export const FH = { g: 340, up: 600, jet: 18, ridge: 930, over: 64 };
export function farmhouse(w = 1100, d = 760, seed = 1) {
  w = q(w, 20); d = q(d, 20);
  return ['dfarmhouse|' + [w, d, seed % 4].join('|'), shape((G) => {
    const R = rng(seed * 131 + w), hw = w / 2, hd = d / 2, { g: zg, up: zu, jet, ridge: zr, over } = FH;
    const lime = (x, y, z) => mix(0xe9dfc8, 0xd8cdb2, 0.5 + 0.5 * wob(x * 0.01 + y * 0.012, z * 0.02 + seed)), lime2 = (x, y, z) => mix(0xf1e8d2, 0xe0d4ba, 0.5 + 0.5 * wob(y * 0.015 - x * 0.01, z * 0.018));
    const oakB = 0x56402a, stoneQ = [0xa89e8a, 0x968e7c, 0xb0a690], shut = seed % 2 ? 0x5e8a6a : 0x58789a, frame = 0xe8e2d2;
    // plinth and the ground floor
    G.blob(0, 0, 16, hd + 8, hw + 8, 16, 0x8a8272, { e: 10, nu: 8, nv: 4 });
    G.blob(0, 0, zg / 2 + 8, hd, hw, zg / 2 - 4, (nx, ny, nz) => lime(nx * hd, ny * hw, (nz + 1) * zg / 2), { e: 14, nu: 24, nv: 8 });
    // quoins: long and short stones in turn up every corner, a hair proud of the wall
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (let k = 0, z = 34; z < zg - 10; k++, z += 34) {
      const lx = k % 2 ? 46 : 26, ly = k % 2 ? 26 : 46, c = stoneQ[(k + (sx > 0 ? 1 : 0)) % 3];
      G.blob(sx * (hd - lx + 3), sy * (hw - ly + 3), z + 15, lx, ly, 15, c, { e: 6, nu: 6, nv: 3 });
    }
    // the jetty: a heavy sill beam all round at the floor of the upper storey, standing out at the front
    G.blob(jet / 2, 0, zg + 6, hd + jet / 2 + 6, hw + 6, 10, oakB, { e: 8, nu: 8, nv: 3 });
    // upper storey: infill and the frame over it
    const ux = jet / 2, uhd = hd + jet / 2;
    G.blob(ux, 0, (zg + zu) / 2 + 8, uhd, hw, (zu - zg) / 2 - 4, (nx, ny, nz) => lime2(nx * uhd, ny * hw, zg + (nz + 1) * (zu - zg) / 2), { e: 14, nu: 24, nv: 8 });
    const studs = (face) => {   // face: 'f' front, 'b' back, 'n' +Y, 's' -Y
      const along = face === 'f' || face === 'b' ? w : d + jet, n = Math.round(along / 110), at = (t, z) => face === 'f' ? [ux + uhd + 2, -hw + t, z] : face === 'b' ? [ux - uhd - 2, -hw + t, z] : face === 'n' ? [ux - uhd + t, hw + 2, z] : [ux - uhd + t, -hw - 2, z];
      const ax = face === 'f' || face === 'b';
      for (let i = 0; i <= n; i++) { const t = (along * i) / n, [x, y] = at(t, 0); G.blob(x, y, (zg + zu) / 2 + 8, ax ? 3 : 6, ax ? 6 : 3, (zu - zg) / 2 - 4, oakB, { e: 8, nu: 6, nv: 3 }); }
      for (const z of [zg + 130, zu - 2]) { const [x, y] = at(along / 2, z); G.blob(x, y, z, ax ? 3 : along / 2, ax ? along / 2 : 3, 6, oakB, { e: 8, nu: 6, nv: 3 }); }
      for (const e of [0, 1]) { const t0 = e ? along - 8 : 8, t1 = e ? along - 110 : 110, [x0, y0] = at(t0, 0), [x1, y1] = at(t1, 0); G.tube([[x0, y0, zg + 22], [x1, y1, zg + 124]], 4.5, oakB, { S: 6 }); }
    };
    for (const f of ['f', 'b', 'n', 's']) studs(f);
    // the gables: lime-washed triangles under the thatch, a king post and a collar
    for (const sy of [-1, 1]) {
      const y = sy * (hw + 1), xb = -hd - 2, xf = hd + jet + 2, xr = (xb + xf) / 2;
      G.surf((u, v) => { const x0 = xb + (xr - xb) * v, x1 = xf + (xr - xf) * v; return [x0 + (x1 - x0) * u, y, zu + (zr - 40 - zu) * v]; }, 0, 1, 6, 0, 1, 6, (u, v) => lime2(u * 200, y, v * 300));
      G.blob(xr, y + sy * 2, (zu + zr - 40) / 2, 6, 3, (zr - 40 - zu) / 2, oakB, { e: 8, nu: 6, nv: 3 });
      G.blob(xr, y + sy * 2, zu + 150, (xf - xb) * 0.25, 3, 5, oakB, { e: 8, nu: 6, nv: 3 });
    }
    // ---- the thatch: two deep planes from the eaves to the ridge, rolled at the eaves and the barges, a ridge roll on top
    const ex = (s) => (s > 0 ? hd + jet + over : -hd - over), Y0 = hw + 46, th = 30, xr = jet / 2;
    for (const s of [-1, 1]) {
      const pt = (u, v, off = 0) => { const y = -Y0 + 2 * Y0 * u, x = ex(s) + (xr - ex(s)) * v, rag = v < 0.05 ? wob(y * 0.08, s + seed) * 8 : 0, bump = wob(y * 0.02 + s, v * 3) * 5 * (1 - v); return [x, y, zu - 20 + (zr - zu + 20) * v + rag + bump - off]; };
      G.surf((u, v) => pt(u, v), 0, 1, 30, 0, 1, 8, (u, v) => (v < 0.06 ? dark(FC.thatch, 0.78) : mix(FC.thatch, 0xdcb066, 0.5 + 0.5 * wob(u * 30, v * 5 + s))));
      G.surf((u, v) => pt(u, v, th), 0, 1, 10, 0, 1, 3, dark(FC.thatch, 0.55));
      G.tube([[ex(s), -Y0 - 6, zu - 20 - th / 2], [ex(s), Y0 + 6, zu - 20 - th / 2]], th * 0.55, dark(FC.thatch, 0.72), { S: 8, caps: true });
      for (const sy of [-1, 1]) G.tube([[ex(s), sy * (Y0 + 4), zu - 20 - th / 2], [xr, sy * (Y0 + 4), zr - th / 2]], th * 0.52, dark(FC.thatch, 0.8), { S: 8 });
    }
    G.tube([[xr, -Y0 - 10, zr - 8], [xr, Y0 + 10, zr - 8]], 26, dark(FC.thatch, 0.7), { S: 10 });
    for (let y = -Y0 + 40; y < Y0 - 20; y += 80) G.blob(xr, y, zr + 6, 30, 18, 10, dark(FC.thatch, 0.62), { e: 3, nu: 8, nv: 4 });
    // ---- the chimney: a stone stack against the +Y gable, stepped in above the eaves, a cap and two pots
    { const cx = -hd * 0.25, y0 = hw - 4;
      const stone = (x, y, z) => stoneQ[Math.floor(Math.abs(Math.sin(x * 0.07 + z * 0.13) * 3 + Math.cos(y * 0.11 + z * 0.05) * 2)) % 3];
      G.blob(cx, y0 + 60, (zu + 40) / 2, 90, 60, (zu + 40) / 2, (nx, ny, nz) => stone(nx * 90, ny * 60, nz * 300), { e: 10, nu: 10, nv: 8 });
      G.blob(cx, y0 + 50, zu + 60, 84, 54, 22, 0x8a8272, { e: 8, nu: 8, nv: 3 });
      G.blob(cx, y0 + 46, (zu + zr + 120) / 2 + 20, 62, 46, (zr + 120 - zu) / 2, (nx, ny, nz) => stone(nx * 62, ny * 46 + 50, nz * 200 + 600), { e: 10, nu: 10, nv: 8 });
      G.blob(cx, y0 + 46, zr + 150, 72, 56, 10, 0x7a7262, { e: 8, nu: 8, nv: 3 });
      for (const k of [-1, 1]) G.lathe([[13, 0], [15, 8], [11, 36], [13, 44], [12, 48]], 0xa8604a, 10, [cx + k * 26, y0 + 46, zr + 158]);
    }
    // ---- the front (+X): door at the middle under its hood, two shuttered windows with boxes below, three above
    const fx = hd + 1;
    { // the door: oak planks in a round head, iron straps, a ring; a stone surround; a worn step
      const dw = 124, dh = 214, door = (u, v) => { const y = (u - 0.5) * dw, top = dh - dw / 2; return [fx + 1, y, 18 + v * (top + Math.sqrt(Math.max(0, (dw / 2) ** 2 - y * y)))]; };
      G.surf(door, 0, 1, 12, 0, 1, 10, (u) => (Math.floor(u * 6) % 2 ? 0x7a5232 : 0x6a4428));
      for (const z of [70, 160]) G.blob(fx + 3, -10, z, 1.5, dw / 2 - 14, 3.5, 0x2e2e32, { e: 8, nu: 6, nv: 3 });
      G.blob(fx + 4, 36, 104, 3, 5, 5, 0x2e2e32, { nu: 8, nv: 5 }); G.blob(fx + 6, 36, 96, 2, 7, 1.6, 0x2e2e32, { e: 3, nu: 8, nv: 4 });
      G.surf((u, v) => { const a = Math.PI * u, rr = dw / 2 + 3 + v * 16; return [fx + 4, Math.cos(a) * rr, 18 + dh - dw / 2 + Math.sin(a) * rr]; }, 0, 1, 14, 0, 1, 1, 0xa89e8a);
      for (const s of [-1, 1]) G.blob(fx + 4, s * (dw / 2 + 11), 18 + (dh - dw / 2) / 2, 4, 8, (dh - dw / 2) / 2, 0xa89e8a, { e: 8, nu: 6, nv: 3 });
      G.blob(fx + 30, 0, 7, 32, dw / 2 + 22, 9, 0x968e7c, { e: 6, nu: 10, nv: 3 });
      // the hood: a little pitched roof of shingles on two curved brackets fixed to the wall
      const hz = 18 + dh + 26, hy = dw / 2 + 40;
      for (const s of [-1, 1]) G.tube([[fx, s * (hy - 14), hz - 70], [fx + 30, s * (hy - 14), hz - 34], [fx + 58, s * (hy - 14), hz - 2]], 5, oakB, { S: 6 });
      for (const s of [-1, 1]) { const b = G.n; G.blob(0, 0, 0, 40, hy / 2 + 6, 3, 0x5e4a3a, { e: 8, nu: 6, nv: 3 }); G.place(b, { x: fx + 34, y: s * (hy / 2), z: hz + 14, roll: -s * 24 }); }
      G.blob(fx + 34, 0, hz + 32, 40, 5, 4, 0x4e3a2c, { e: 8, nu: 6, nv: 3 });
      // a lantern on an iron bracket beside the door (the map lights it)
      G.tube([[fx, dw / 2 + 52, 196], [fx + 26, dw / 2 + 52, 200], [fx + 30, dw / 2 + 52, 192]], 2.2, 0x2e2e32, { S: 5 });
      G.lathe([[9, 0], [10, 4], [8, 6], [8, 26], [10, 28], [6, 34], [2, 36]], (k) => (k === 3 ? 0xffd27a : 0x2e2e32), 8, [fx + 30, dw / 2 + 52, 156]);
    }
    const win = (x, y, z, ww, wh, face, panes, shutters) => {   // face +1 front (+X) / -1 back; +2 / -2 the +Y / -Y gables
      const AX = Math.abs(face) === 1, sg = Math.sign(face), P = (a, b, c) => (AX ? [x + sg * a, y + b, z + c] : [x + b, y + sg * a, z + c]);
      const box = (a, b, c, la, lb, lc, col) => { const [px, py, pz] = P(a, b, c); G.blob(px, py, pz, AX ? la : lb, AX ? lb : la, lc, col, { e: 8, nu: 6, nv: 3 }); };
      box(1, 0, 0, 2, ww / 2, wh / 2, 0x2c3a40);
      box(3, 0, 0, 1.2, ww / 2 + 2, 2.5, frame); box(3, 0, 0, 1.2, 2.5, wh / 2 + 2, frame);
      if (panes > 2) { box(3, -ww / 4, 0, 1.2, 1.4, wh / 2, frame); box(3, ww / 4, 0, 1.2, 1.4, wh / 2, frame); }
      box(3, 0, wh / 2 + 3, 2, ww / 2 + 7, 4, frame); box(3, 0, -wh / 2 - 3, 2, ww / 2 + 7, 4, frame); box(3, -ww / 2 - 3, 0, 2, 4, wh / 2 + 6, frame); box(3, ww / 2 + 3, 0, 2, 4, wh / 2 + 6, frame);
      box(8, 0, -wh / 2 - 10, 9, ww / 2 + 14, 5, 0xa89e8a);
      box(2, -ww * 0.18, wh * 0.18, 0.6, ww * 0.12, wh * 0.08, 0x8aa8b0);
      if (shutters) for (const s of [-1, 1]) { box(1.6, s * (ww / 2 + 36), 0, 2.5, 30, wh / 2 + 4, shut); box(4.6, s * (ww / 2 + 36), wh * 0.3, 1.2, 28, 3, dark(shut, 0.8)); box(4.6, s * (ww / 2 + 36), -wh * 0.3, 1.2, 28, 3, dark(shut, 0.8)); }
    };
    for (const s of [-1, 1]) win(fx, s * 330, 186, 128, 128, 1, 4, true);
    for (const y of [-330, 0, 330]) win(hd + jet + 1, y, 470, 92, 100, 1, 2, false);
    win(-hd - 1, -250, 186, 110, 120, -1, 4, false); win(-hd - 1, 250, 470, 92, 100, -1, 2, false);
    win(-hd * 0.2, -hw - 1, 186, 110, 120, -2, 4, true); win(0, -hw - 1, 470, 92, 100, -2, 2, false); win(hd * 0.45, hw + 1, 470, 80, 90, 2, 2, false);
    // the back door, plain planks with a latch
    G.blob(-hd - 2, 250, 112, 2, 52, 104, 0x6a4428, { e: 8, nu: 6, nv: 4 }); G.blob(-hd - 4, 250, 112, 1.2, 56, 3, 0x2e2e32, { e: 8, nu: 6, nv: 3 }); G.blob(-hd - 24, 250, 6, 22, 60, 7, 0x968e7c, { e: 6, nu: 8, nv: 3 });
    // flower boxes under the front windows, on iron brackets, full of colour
    for (const s of [-1, 1]) {
      const y = s * 330, z = 104;
      G.blob(fx + 20, y, z, 20, 74, 14, 0x6a4a2c, { e: 8, nu: 8, nv: 3 });
      for (const k of [-1, 1]) G.tube([[fx, y + k * 52, z - 34], [fx + 16, y + k * 52, z - 14]], 2, 0x2e2e32, { S: 5 });
      for (let i = 0; i < 9; i++) { const yy = y - 62 + i * 15.5, c = [0xe85a6a, 0xf6d04a, 0xffffff, 0xb070d8][(i + (s > 0 ? 1 : 0)) % 4], lx = fx + 20 + (R() - 0.5) * 10; G.blob(lx, yy, z + 18, 9, 9, 8, 0x4e7a30, { nu: 8, nv: 5 }); G.blob(lx + (R() - 0.5) * 4, yy + (R() - 0.5) * 4, z + 25 + R() * 2, 6, 6, 4, c, { nu: 8, nv: 4 }); }
    }
  })];
}

// ---- the great barn, open door to door along Y. Board-and-batten walls in weathered barn red over a stone footing,
// white trim at the corners, round the doors and along the eaves; a gambrel roof of dark shingles with a cupola and a
// weathervane on the ridge. Big sliding doors at both gables (+Y and -Y) pushed open along their rail; a hay door
// above each with a hoist beam; windows down both long sides. Inside: two rows of posts with tie beams, plates and
// knee braces, and the underside of the roof boarded on rafters. BN holds the sizes the map's bodies follow.
export const BN = { W: 1700, L: 2700, eave: 720, kneeX: 530, knee: 1060, ridge: 1330, over: 50, doorW: 720, doorH: 600, posts: [-1000, -340, 340, 1000], postX: 560 };
export function barn(seed = 1) {
  return ['dbarn|' + (seed % 3), shape((G) => {
    const R = rng(seed * 71 + 5), { W, L, eave, kneeX, knee, ridge, over, doorW, doorH } = BN, hw = W / 2, hl = L / 2, dh = doorW / 2;
    const red = (k) => mix(FC.red, k % 3 === 0 ? 0x8a3a2c : k % 3 === 1 ? 0xa4402e : 0x93372a, 0.6), back = 0x3a2a20, white = 0xe6dccb, shingle = [0x4a3e3a, 0x544642, 0x403634], wood = 0x6a4e34;
    const roofZ = (x) => { const a = Math.abs(x); return a >= kneeX ? knee + (eave - knee) * (a - kneeX) / (hw - kneeX) : ridge + (knee - ridge) * a / kneeX; };   // the gambrel line over the walls
    // stone footing all round, broken at the doors
    for (const sx of [-1, 1]) G.blob(sx * hw, 0, 36, 22, hl + 22, 36, 0x8a8478, { e: 8, nu: 10, nv: 4 });
    for (const sy of [-1, 1]) for (const sx of [-1, 1]) G.blob(sx * ((hw + dh) / 2 + 12), sy * hl, 36, (hw - dh) / 2 + 10, 22, 36, 0x8a8478, { e: 8, nu: 10, nv: 4 });
    // ---- the long walls (+X, -X): a dark backing, battens over it
    for (const sx of [-1, 1]) {
      G.blob(sx * (hw - 6), 0, (72 + eave + 26) / 2, 8, hl, (eave + 26 - 72) / 2, back, { e: 10, nu: 6, nv: 4 });
      let k = 0; for (let y = -hl + 15; y < hl - 10; y += 30, k++) {
        const isWin = [-900, -300, 300, 900].some((wy) => Math.abs(y - wy) < 70);
        if (isWin) { G.blob(sx * (hw + 3), y, (72 + 390) / 2, 4, 13, (390 - 72) / 2, red(k), { e: 8, nu: 4, nv: 3 }); G.blob(sx * (hw + 3), y, (552 + eave + 16) / 2, 4, 13, (eave + 16 - 552) / 2, red(k), { e: 8, nu: 4, nv: 3 }); }
        else G.blob(sx * (hw + 3), y, (72 + eave + 16) / 2, 4, 13, (eave + 16 - 72) / 2, red(k), { e: 8, nu: 4, nv: 3 });
      }
      // windows: four a side, dark panes in white frames, one with its glass gone
      for (const [i, wy] of [-900, -300, 300, 900].entries()) {
        G.blob(sx * (hw + 1), wy, 470, 3, 60, 80, i === 2 && sx > 0 ? 0x16120e : 0x2a3438, { e: 8, nu: 4, nv: 3 });
        for (const [a, b] of [[0, 84], [0, -84]]) G.blob(sx * (hw + 7), wy + a, 470 + b, 4, 68, 6, white, { e: 8, nu: 6, nv: 3 });
        for (const a of [-64, 64]) G.blob(sx * (hw + 7), wy + a, 470, 4, 6, 84, white, { e: 8, nu: 6, nv: 3 });
        if (!(i === 2 && sx > 0)) { G.blob(sx * (hw + 6), wy, 470, 3, 3, 80, white, { e: 8, nu: 4, nv: 3 }); G.blob(sx * (hw + 6), wy, 470, 3, 60, 3, white, { e: 8, nu: 4, nv: 3 }); }
      }
      // white corner boards and a fascia under the eaves
      for (const sy of [-1, 1]) G.blob(sx * (hw + 6), sy * (hl - 4), (72 + eave) / 2, 7, 14, (eave - 72) / 2, white, { e: 8, nu: 6, nv: 3 });
      G.blob(sx * (hw + 30), 0, eave - 22, 6, hl + over, 16, white, { e: 8, nu: 6, nv: 3 });
    }
    // ---- the gables (+Y, -Y): the wall round the big door and up under the gambrel, a hay door high up, trim
    for (const sy of [-1, 1]) {
      const y = sy * hl;
      // the backing: each side of the door, the lintel band over it, and the gable above the eaves (left of, between and right of the hay door)
      for (const sx of [-1, 1]) G.blob(sx * (hw + dh) / 2, y - sy * 6, (72 + eave) / 2, (hw - dh) / 2, 8, (eave - 72) / 2, back, { e: 10, nu: 6, nv: 4 });
      G.blob(0, y - sy * 6, (doorH + 40 + eave) / 2, dh, 8, (eave - doorH - 40) / 2, back, { e: 10, nu: 6, nv: 4 });
      G.surf((u, v) => { const x = -hw + u * W; return [x, y - sy * 6, eave + (roofZ(x) - 6 - eave) * v]; }, 0, 1, 24, 0, 1, 4, back);
      // battens, full height where there is no door, stopping at the door head over it, each up to the roof line
      let k = 0; for (let x = -hw + 15; x < hw - 10; x += 30, k++) {
        const top = roofZ(x) - 10, inDoor = Math.abs(x) < dh + 6, inHay = Math.abs(x) < 136 && true;
        const z0 = inDoor ? doorH + 40 : 72;
        if (inHay) { G.blob(x, y + sy * 3, (z0 + 760) / 2, 13, 4, (760 - z0) / 2, red(k), { e: 8, nu: 4, nv: 3 }); G.blob(x, y + sy * 3, (980 + top) / 2, 13, 4, (top - 980) / 2, red(k), { e: 8, nu: 4, nv: 3 }); }
        else G.blob(x, y + sy * 3, (z0 + top) / 2, 13, 4, (top - z0) / 2, red(k), { e: 8, nu: 4, nv: 3 });
      }
      // the door's frame and the hay door's, in white; the hay door's two leaves swung back flat against the wall
      for (const sx of [-1, 1]) G.blob(sx * (dh + 12), y + sy * 8, (72 + doorH + 40) / 2, 13, 6, (doorH + 40 - 72) / 2 + 2, white, { e: 8, nu: 6, nv: 3 });
      G.blob(0, y + sy * 8, doorH + 30, dh + 26, 6, 14, white, { e: 8, nu: 6, nv: 3 });
      for (const [a, b, c, d] of [[0, 752, 140, 8], [0, 988, 140, 8], [-136, 870, 8, 120], [136, 870, 8, 120]]) G.blob(a, y + sy * 8, b, c, 6, d, white, { e: 8, nu: 6, nv: 3 });
      G.blob(0, y - sy * 2, 870, 128, 4, 110, 0x1a1410, { e: 8, nu: 4, nv: 3 });
      for (const sx of [-1, 1]) { G.blob(sx * 206, y + sy * 12, 870, 66, 5, 112, red(sx + 1), { e: 8, nu: 6, nv: 3 }); G.blob(sx * 206, y + sy * 16, 870, 62, 2, 6, white, { e: 8, nu: 6, nv: 3 }); }
      // rake trim along the gambrel edge
      const rk = [[-hw - over, eave - 26], [-kneeX, knee], [0, ridge], [kneeX, knee], [hw + over, eave - 26]];
      for (let i = 0; i < 4; i++) { const [x0, z0] = rk[i], [x1, z1] = rk[i + 1]; G.tube([[x0, y + sy * (over + 2), z0 + 2], [x1, y + sy * (over + 2), z1 + 2]], 9, white, { S: 6, caps: false }); }
      // the hoist: a beam out from under the ridge, a pulley block, a rope down past the hay door with a hook
      G.blob(0, y + sy * 120, 1170, 12, 170, 12, wood, { e: 8, nu: 6, nv: 3 });
      G.blob(0, y + sy * 250, 1146, 10, 12, 16, 0x2e2e32, { e: 6, nu: 6, nv: 4 });
      G.tube([[0, y + sy * 250, 1130], [3, y + sy * 252, 960], [0, y + sy * 250, 830]], 2.2, 0xb89a68, { S: 5 });
      G.tube([[0, y + sy * 250, 832], [0, y + sy * 250, 814], [8, y + sy * 250, 804], [12, y + sy * 250, 816]], 2.4, 0x2e2e32, { S: 5 });
      // the sliding doors, pushed open along the rail: planks, a white frame and the white X
      G.blob(0, y + sy * 26, doorH + 54, hw - 40, 6, 8, 0x2e2e32, { e: 8, nu: 6, nv: 3 });
      for (let x = -hw + 80; x < hw - 60; x += 260) G.blob(x, y + sy * 15, doorH + 54, 5, 12, 6, 0x2e2e32, { e: 6, nu: 6, nv: 3 });
      for (const sx of [-1, 1]) {
        const cx = sx * (dh + 200), dw2 = 196, dz = 18 + (doorH + 12) / 2, hh = (doorH + 12) / 2;
        for (let i = 0; i < 13; i++) G.blob(cx - dw2 + 15 + i * 30, y + sy * 22, dz, 14, 5, hh, red(i + 7), { e: 8, nu: 4, nv: 3 });
        for (const [a, b, c, d] of [[cx, dz + hh - 10, dw2, 10], [cx, dz - hh + 10, dw2, 10], [cx, dz, dw2, 8], [cx - dw2 + 10, dz, 10, hh], [cx + dw2 - 10, dz, 10, hh]]) G.blob(a, y + sy * 28, b, c, 3, d, white, { e: 8, nu: 6, nv: 3 });
        for (const s2 of [-1, 1]) G.tube([[cx - dw2 + 18, y + sy * 29, dz + s2 * (hh - 18)], [cx + dw2 - 18, y + sy * 29, dz - s2 * (hh - 18)]], 6, white, { S: 4 });
        for (const s2 of [-1, 1]) { G.blob(cx + s2 * (dw2 - 40), y + sy * 26, doorH + 40, 8, 4, 16, 0x2e2e32, { e: 6, nu: 6, nv: 3 }); G.blob(cx + s2 * (dw2 - 40), y + sy * 26, doorH + 62, 9, 4, 9, 0x2e2e32, { nu: 8, nv: 5 }); }
      }
    }
    // ---- the roof: rows of shingles on the four slopes, an eave course, the boarded underside on rafters
    const slopes = [[hw + over, eave - 26, kneeX, knee], [kneeX, knee, 0, ridge]];
    for (const sx of [-1, 1]) for (const [xa, za, xb, zb] of slopes) {
      const len = Math.hypot(xa - xb, zb - za), rows = Math.round(len / 34), nx = (zb - za) / len, nz = (xa - xb) / len;   // the slope's outward normal
      G.surf((u, v) => { const x = xa + (xb - xa) * v, z = za + (zb - za) * v, lift = (v * rows) % 1 * 3; return [sx * (x + nx * lift), -hl - over + u * (L + over * 2), z + nz * lift + 2]; }, 0, 1, 24, 0, 1, rows * 2, (u, v) => shingle[(Math.floor(v * rows) + Math.floor(u * 40) * 7) % 3]);
      G.surf((u, v) => { const x = xa + (xb - xa) * v, z = za + (zb - za) * v; return [sx * (x - nx * 12), -hl - over + u * (L + over * 2), z - nz * 12 - 10]; }, 0, 1, 8, 0, 1, 2, 0x4a3828);
      for (let y = -hl + 150; y < hl; y += 300) G.tube([[sx * (xa - nx * 22), y, za - nz * 22 - 10], [sx * (xb - nx * 22), y, zb - nz * 22 - 10]], 9, 0x5a4430, { S: 5 });
    }
    G.tube([[0, -hl - over - 6, ridge + 8], [0, hl + over + 6, ridge + 8]], 14, 0x2e2826, { S: 6 });
    for (const sx of [-1, 1]) G.tube([[sx * kneeX, -hl - over, knee + 4], [sx * kneeX, hl + over, knee + 4]], 7, 0x2e2826, { S: 5 });
    // moss on the north slope, a few slipped shingles
    for (let i = 0; i < 7; i++) { const y = -hl + R() * L, x = kneeX + 60 + R() * 220, z = knee + (eave - knee) * (x - kneeX) / (hw - kneeX); G.blob(x, y, z + 4, 50 + R() * 50, 40 + R() * 40, 4, FC.moss, { e: 2.4, nu: 8, nv: 3 }); }
    // ---- the cupola and the weathervane
    G.blob(0, 0, ridge + 70, 70, 70, 70, white, { e: 12, nu: 24, nv: 8 });
    for (const a of [0, 90, 180, 270]) { const b = G.n; for (let i = 0; i < 5; i++) G.blob(70.5, 0, -32 + i * 16, 2.2, 46, 5, 0x3a2e28, { e: 8, nu: 4, nv: 3 }); G.place(b, { z: ridge + 70, yaw: a }); }
    { const b = G.n; G.lathe([[100, 0], [100, 8], [62, 58], [6, 96], [4, 100]], 0x3e3634, 4, [0, 0, 0], [1, 1]); G.place(b, { z: ridge + 136, yaw: 45 }); }
    G.tube([[0, 0, ridge + 220], [0, 0, ridge + 362]], 2.5, 0x2e2e32, { S: 5 });
    G.blob(0, 0, ridge + 300, 2, 50, 2, 0x2e2e32, { e: 8, nu: 4, nv: 3 }); G.blob(0, 0, ridge + 300, 50, 2, 2, 0x2e2e32, { e: 8, nu: 4, nv: 3 });
    G.blob(0, 0, ridge + 340, 3, 40, 3, 0x2e2e32, { e: 8, nu: 4, nv: 3 });
    { const b = G.n; G.blob(0, 6, 22, 3, 20, 14, 0x2e2e32, { nu: 8, nv: 5 }); G.blob(0, -14, 32, 3, 8, 9, 0x2e2e32, { nu: 6, nv: 4 }); G.blob(0, 24, 30, 3, 10, 16, 0x2e2e32, { nu: 6, nv: 4 }); G.blob(0, -20, 42, 3, 4, 5, 0x2e2e32, { nu: 6, nv: 4 }); G.place(b, { z: ridge + 330 }); }
    // ---- inside: posts, tie beams, plates and knee braces
    for (const sx of [-1, 1]) for (const py of BN.posts) {
      const px = sx * BN.postX;
      G.blob(px, py, eave / 2, 15, 15, eave / 2, wood, { e: 8, nu: 6, nv: 4 });
      G.blob(px, py, 14, 22, 22, 14, 0x8a8478, { e: 6, nu: 6, nv: 3 });
      for (const s2 of [-1, 1]) G.tube([[px, py + s2 * 16, eave - 160], [px, py + s2 * 120, eave - 24]], 7, wood, { S: 5 });
      G.tube([[px - sx * 16, py, eave - 160], [px - sx * 130, py, eave - 24]], 7, wood, { S: 5 });
    }
    for (const py of BN.posts) G.blob(0, py, eave - 8, hw - 4, 14, 14, wood, { e: 8, nu: 8, nv: 3 });
    for (const sx of [-1, 1]) G.blob(sx * BN.postX, 0, eave - 8, 14, hl - 6, 12, wood, { e: 8, nu: 6, nv: 3 });
    // the floor: old boards laid along the length, worn pale down the middle where the carts go
    G.blob(0, 0, 0.9, hw - 4, hl - 4, 0.9, 0x2e241a, { e: 10, nu: 6, nv: 3 });
    for (let x = -hw + 20; x < hw - 10; x += 40) G.blob(x, 0, 1.8, 19.4, hl - 4, 1.6, Math.abs(x) < 330 ? mix(0x7a6650, 0x9a8468, 0.5 + 0.5 * Math.sin(x)) : mix(0x5e4a36, 0x6e5840, 0.5 + 0.5 * Math.sin(x * 1.3)), { e: 8, nu: 4, nv: 3 });
  })];
}

// ---- a stave silo: a stone footing, oak staves bound with iron hoops, a verdigris dome with a vent cap, an iron
// ladder up its side on brackets, a hatch at its foot. Ladder side is +X.
export function silo(h = 1500, r = 270) {
  h = q(h); r = q(r);
  return ['dsilo|' + [h, r].join('|'), shape((G) => {
    const n = Math.round((Math.PI * 2 * r) / 34), st = [0x7a5a3c, 0x6e5034, 0x86643f, 0x735638];
    G.lathe([[r + 18, 0], [r + 18, 104], [r + 12, 116], [r + 2, 122]], (k) => (k < 2 ? 0x8a8478 : 0x7a746a), 24);
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, b = G.n; G.blob(r + 18, 0, 0, 3, 34, 16, i % 2 ? 0x968e7c : 0x7e786a, { e: 6, nu: 6, nv: 3 }); G.place(b, { z: 30 + (i % 3) * 34, yaw: (a * 180) / Math.PI }); }
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, b = G.n; G.blob(r, 0, 0, 7, (Math.PI * r) / n + 0.6, (h - 120) / 2, st[i % 4], { e: 8, nu: 4, nv: 3 }); G.place(b, { z: 120 + (h - 120) / 2, yaw: (a * 180) / Math.PI }); }
    for (let z = 260; z < h - 40; z += 170) G.lathe([[r + 6, z - 7], [r + 9, z - 5], [r + 9, z + 5], [r + 6, z + 7]], FC.iron, 32);
    // the dome
    G.lathe([[r + 26, h - 6], [r + 26, h + 6], [r * 0.92, h + r * 0.35], [r * 0.7, h + r * 0.6], [r * 0.38, h + r * 0.8], [r * 0.14, h + r * 0.86]], (k) => (k < 1 ? 0x4e7a6a : k % 2 ? 0x5e9a84 : 0x6aa892), 24);
    G.lathe([[r * 0.16, h + r * 0.84], [r * 0.16, h + r * 0.96], [r * 0.3, h + r * 1.0], [r * 0.26, h + r * 1.08], [0, h + r * 1.12]], (k) => (k < 2 ? 0x4e7a6a : 0x3e6a5a), 12);
    for (let i = 0; i < 6; i++) { const a = i * 1.04 + 0.4; G.tube([[Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, h + r * 0.36], [Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75, h + r * 0.15], [Math.cos(a) * (r + 2), Math.sin(a) * (r + 2), h - 60]], 4, 0x4a7466, { S: 5 }); }
    // the ladder: two rails standing off the staves on brackets, rungs every forty
    for (const s of [-1, 1]) { G.tube([[r + 26, s * 22, 116], [r + 26, s * 22, h + 40]], 2.6, FC.iron, { S: 6 }); for (let z = 300; z < h; z += 300) G.tube([[r + 26, s * 22, z], [r + 2, s * 22, z]], 2.2, FC.iron, { S: 5 }); }
    for (let z = 160; z < h + 20; z += 40) G.tube([[r + 26, -22, z], [r + 26, 22, z]], 1.8, FC.iron, { S: 5 });
    G.tube([[r + 26, -22, h + 40], [r + 30, -22, h + 60], [r + 18, -22, h + 80]], 2.6, FC.iron, { S: 6 }); G.tube([[r + 26, 22, h + 40], [r + 30, 22, h + 60], [r + 18, 22, h + 80]], 2.6, FC.iron, { S: 6 });
    // the hatch at the foot, round the back
    G.blob(-r - 4, 0, 200, 6, 70, 70, 0x5e4430, { e: 8, nu: 6, nv: 4 }); for (const z of [160, 240]) G.blob(-r - 10, 0, z, 2, 72, 3, FC.iron, { e: 8, nu: 6, nv: 3 });
  })];
}

// ---- a cast-iron hand pump on a stone block: fluted barrel, a spout over the trough side (+X), a long handle
export function handPump() {
  return ['dpump', shape((G) => {
    G.blob(0, 0, 30, 34, 34, 30, 0x9a9282, { e: 6, nu: 8, nv: 4 });
    G.lathe([[13, 60], [15, 66], [12, 76], [12, 150], [15, 156], [15, 168], [10, 176], [11, 184], [4, 192]], (k) => (k === 2 || k === 4 ? 0x2a2a30 : 0x34343a), 12);
    G.tube([[10, 0, 140], [40, 0, 136], [52, 0, 118], [54, 0, 106]], 5, 0x34343a, { S: 8 });
    G.tube([[-4, 0, 176], [-30, 0, 190], [-70, 0, 214], [-104, 0, 228]], 3.4, 0x34343a, { S: 6 }); G.blob(-108, 0, 230, 8, 5, 5, 0x34343a, { nu: 8, nv: 5 });
    G.tube([[2, 0, 176], [2, 0, 196]], 3, 0x34343a, { S: 6 }); G.blob(2, 0, 196, 6, 6, 4, 0x34343a, { nu: 8, nv: 4 });
  })];
}

// ---- a milk churn: a tinned steel body, shoulders, a lidded neck and two grab handles
export function churn(h = 84) {
  h = q(h, 2);
  return ['dchurn|' + h, shape((G) => {
    const k = h / 84, m = 0xb6bcc2, md = 0x8a9096;
    G.lathe([[18 * k, 0], [20 * k, 3], [20 * k, 8], [18 * k, 10], [19 * k, 50 * k], [12 * k, 64 * k], [9 * k, 70 * k], [10 * k, 74 * k], [11.5 * k, 78 * k], [9 * k, 82 * k], [3 * k, 84 * k]], (i) => (i === 1 || i === 2 || i === 7 ? md : m), 14);
    for (const s of [-1, 1]) G.tube([[0, s * 13 * k, 58 * k], [0, s * 20 * k, 62 * k], [0, s * 19 * k, 70 * k], [0, s * 12 * k, 68 * k]], 1.6 * k, md, { S: 5 });
  })];
}
// ---- a churn stand by the lane: a waist-high deck of planks on four posts with steps, churns along it
export function churnStand(w = 200) {
  w = q(w);
  return ['dchst|' + w, shape((G) => {
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.blob(sx * (w / 2 - 10), sy * 36, 46, 7, 7, 46, FC.weathD, { e: 8, nu: 6, nv: 3 });
    for (let i = 0; i < 5; i++) G.blob(0, -36 + i * 18, 96, w / 2, 8.4, 4, i % 2 ? FC.weath : mix(FC.weath, 0x7a7060, 0.4), { e: 8, nu: 6, nv: 3 });
    for (const sx of [-1, 1]) G.tube([[sx * (w / 2 - 10), -32, 12], [sx * (w / 2 - 10), 32, 80]], 3, FC.weathD, { S: 5 });
  })];
}

// ---- a chicken coop: a whitewashed hut on four legs, a pent roof of green-painted boards, a ramp down from the
// pop-hole on the front (+X), a nest box on the +Y side with its own lid
export function coop(seed = 1) {
  return ['dcoop|' + (seed % 3), shape((G) => {
    const ww = 0xe8e0cc, wd = 0xd6ccb4, rf = 0x5a7a52, leg = FC.weathD, z0 = 56;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.blob(sx * 76, sy * 96, z0 / 2, 7, 7, z0 / 2 + 2, leg, { e: 8, nu: 6, nv: 3 });
    G.blob(0, 0, z0 + 4, 90, 110, 6, leg, { e: 8, nu: 8, nv: 3 });
    for (let i = 0; i < 7; i++) G.blob(0, -96 + i * 32, z0 + 70, 86, 15.4, 62, i % 2 ? ww : wd, { e: 10, nu: 6, nv: 3 });
    // pent roof: high at the back (-X), low at the front, overhanging
    { const b = G.n; G.blob(0, 0, 0, 118, 132, 5, rf, { e: 8, nu: 8, nv: 3 }); G.place(b, { z: z0 + 148, pitch: 12 }); }
    for (const sy of [-1, 1]) { G.surf((u, v) => { const x = -86 + 172 * u; return [x, sy * 111, z0 + 132 + v * (24 - x * 0.2)]; }, 0, 1, 4, 0, 1, 2, ww); }
    // pop-hole with its slide door up, and the ramp with cleats
    G.blob(87, 0, z0 + 30, 2, 22, 22, 0x2a221c, { e: 8, nu: 4, nv: 3 }); G.blob(89, 0, z0 + 62, 2, 24, 12, leg, { e: 8, nu: 4, nv: 3 });
    { const b = G.n; G.blob(0, 0, 0, 78, 20, 3, FC.weath, { e: 8, nu: 6, nv: 3 }); for (let i = 0; i < 6; i++) G.blob(-60 + i * 24, 0, 4, 3, 18, 2, leg, { e: 8, nu: 4, nv: 3 }); G.place(b, { x: 150, z: z0 / 2 - 2, pitch: (Math.atan2(z0 + 6, 150) * 180) / Math.PI }); }
    // nest box on the side, lid shut, a latch
    G.blob(0, 124, z0 + 42, 70, 16, 34, ww, { e: 10, nu: 6, nv: 3 }); { const b = G.n; G.blob(0, 0, 0, 74, 22, 3, rf, { e: 8, nu: 6, nv: 3 }); G.place(b, { y: 126, z: z0 + 82, roll: 14 }); }
    G.blob(70, 124, z0 + 50, 3, 3, 6, FC.iron, { e: 6, nu: 6, nv: 3 });
  })];
}

// ---- a scarecrow on a pole: a sack head with button eyes and a stitched grin under a floppy gnome's hat gone pale,
// a patched coat on the cross-arm, straw out of the cuffs and the collar. Faces +X.
export function scarecrow(seed = 1) {
  return ['dscare|' + (seed % 4), shape((G) => {
    const R = rng(seed * 53 + 9), pole = 0x6a5038, sack = 0xc8b088, coat = [0x6a5a48, 0x5a6a5a, 0x7a5a44][seed % 3], patch = 0xa47a4a, hat = [0xa84a3e, 0x6a7a9a][seed % 2];
    G.tube([[0, 0, -10], [0, 0, 236]], 5.5, pole, { S: 8 }); G.tube([[0, -98, 172], [0, 98, 176]], 4.5, pole, { S: 8 });
    // the coat on the frame, sleeves out along the arm, ragged at the hem
    G.blob(2, 0, 142, 26, 40, 46, (x, y, z) => (wob(x * 0.1 + y * 0.12, z * 0.1) > 0.55 ? patch : coat), { nu: 16, nv: 10, warp: (x, y, z) => [x, y, z < -30 ? z + wob(y * 0.3, seed) * 6 : z] });
    for (const s of [-1, 1]) G.tube([[2, s * 30, 174], [2, s * 62, 174], [2, s * 88, 172]], (t) => 13 - t * 2, coat, { S: 8 });
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; G.tube([[2, s * 86, 172], [2 + Math.cos(a) * 10, s * (98 + R() * 8), 172 + Math.sin(a) * 10]], 1.6, i % 2 ? FC.straw : FC.strawD, { S: 4 }); }
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; G.tube([[2, 0, 186], [2 + Math.cos(a) * 18, Math.sin(a) * 18, 192 + R() * 8]], 1.5, i % 2 ? FC.straw : FC.strawD, { S: 4 }); }
    // the head: a tied sack, two buttons, a stitched grin
    G.blob(2, 0, 212, 22, 20, 24, sack, { nu: 14, nv: 10, warp: (x, y, z) => [x, y, z + (z < -18 ? 3 : 0)] });
    for (const s of [-1, 1]) { G.blob(22, s * 8, 218, 2.5, 4, 4, 0x2a2a2e, { nu: 8, nv: 5 }); }
    for (let i = 0; i < 7; i++) G.blob(22.5 - Math.abs(i - 3) * 0.8, -9 + i * 3, 203 - Math.sin((i / 6) * Math.PI) * 4, 1, 1.6, 0.8, 0x3a2a20, { nu: 6, nv: 3 });
    // the hat: wide floppy brim, a tall crown that folds over at the top
    G.lathe([[0, 228], [34, 228], [36, 231], [22, 236], [18, 246]], hat, 16);
    G.tube([[0, 0, 240], [2, 0, 266], [6, 2, 284], [18, 6, 290], [26, 10, 282]], (t) => 17 * (1 - t) + 2, dark(hat, 0.9), { S: 10 });
  })];
}

// ---- a haystack: a round stack built up in courses and drawn in to a thatched peak, sun-bleached on top, a twisted
// rope band round its waist, a skirt of pulled straw at its foot lying flat on the ground
export function haystack(r = 180, h = 320, seed = 1) {
  r = q(r); h = q(h);
  return ['dstack2|' + [r, h, seed % 4].join('|'), shape((G) => {
    const prof = [[r * 0.94, 0], [r, h * 0.16], [r * 0.99, h * 0.4], [r * 0.86, h * 0.62], [r * 0.56, h * 0.82], [r * 0.2, h * 0.95], [0, h]];
    const at = (t) => { let i = 0; while (i < prof.length - 2 && prof[i + 1][1] < t * h) i++; const [r0, z0] = prof[i], [r1, z1] = prof[i + 1], k = (t * h - z0) / Math.max(1, z1 - z0); return [r0 + (r1 - r0) * k, z0 + (z1 - z0) * k]; };
    const gold = 0xe2bc66, pale = 0xf0d48a, deep = 0xc0963e;
    G.surf((u, v) => { const a = u * Math.PI * 2, [rr, z] = at(v), w = 1 + wob(a * 4 + seed, v * 6) * 0.035 + ((v * 9) % 1 < 0.15 ? 0.02 : 0); return [Math.cos(a) * rr * w, Math.sin(a) * rr * w, z]; }, 0, 1, 32, 0, 1, 18,
      (u, v) => (v > 0.9 ? deep : (v * 9) % 1 < 0.12 ? deep : wob(u * 40, v * 9 + seed) > 0.5 ? pale : v > 0.6 ? mix(gold, pale, 0.5) : gold), true);
    G.tube([[0, 0, h - 8], [4, 2, h + 16], [12, 0, h + 24]], 6, deep, { S: 6 });
    { const z = h * 0.48, [rr] = at(0.48); G.lathe([[rr + 1, z - 4], [rr + 4, z - 2], [rr + 4, z + 2], [rr + 1, z + 4]], 0x8a7448, 28); }
    G.surf((u, v) => { const a = u * Math.PI * 2, rr = r * (0.92 + v * 0.22 + 0.04 * wob(a * 6, seed)); return [Math.cos(a) * rr, Math.sin(a) * rr, 2.5 - v * 2]; }, 0, 1, 32, 0, 1, 2, (u, v) => (v > 0.6 ? mix(gold, 0x7a8a40, 0.3) : gold), true);
  })];
}

// ---- straw skeps on a two-legged bench: coiled straw domes, each with a dark entrance at the foot (+X)
export function hiveBench(n = 3) {
  return ['dhives|' + n, shape((G) => {
    const len = n * 96 + 30;
    for (const s of [-1, 1]) G.blob(0, s * (len / 2 - 22), 30, 10, 8, 30, FC.weathD, { e: 8, nu: 6, nv: 3 });
    G.blob(0, 0, 64, 34, len / 2, 5, FC.weath, { e: 8, nu: 8, nv: 3 });
    for (let i = 0; i < n; i++) {
      const y = -len / 2 + 63 + i * 96, prof = [];
      for (let k = 0; k <= 10; k++) { const t = k / 10, r = 36 * Math.sqrt(1 - t * t * 0.96) + (k % 2 ? 2 : 0); prof.push([r, 69 + t * 60]); }
      prof.push([0, 132]);
      G.lathe(prof, (k) => (k % 2 ? FC.strawD : FC.straw), 16, [0, y, 0]);
      G.blob(34, y, 76, 3, 9, 5, 0x1e1810, { e: 6, nu: 6, nv: 3 });
    }
  })];
}

// ---- a wheelbarrow: a plank tray on two shafts, an iron-tyred wheel at the front (+X), two legs at the back
export function wheelbarrow(load = 0) {
  return ['dbarrow|' + load, shape((G) => {
    const wd = FC.oak, wdD = FC.oakD;
    for (const s of [-1, 1]) { G.tube([[-90, s * 26, 52], [-30, s * 24, 42], [40, s * 20, 30], [62, s * 8, 26]], 3.4, wdD, { S: 6 }); G.blob(-50, s * 25, 22, 3, 3, 22, wdD, { e: 8, nu: 6, nv: 3 }); }
    G.blob(10, 0, 44, 46, 34, 4, wd, { e: 8, nu: 8, nv: 3 });
    for (const s of [-1, 1]) { const b = G.n; G.blob(0, 0, 0, 46, 3, 18, wd, { e: 8, nu: 6, nv: 3 }); G.place(b, { x: 10, y: s * 38, z: 60, roll: s * 16 }); }
    { const b = G.n; G.blob(0, 0, 0, 3, 36, 18, wd, { e: 8, nu: 6, nv: 3 }); G.place(b, { x: 58, z: 60, pitch: -24 }); }
    G.blob(-37, 0, 60, 3, 34, 18, wd, { e: 8, nu: 6, nv: 3 });
    { const b = G.n; G.lathe([[24, -4], [26, -3], [26, 3], [24, 4], [18, 4], [18, -4]], (k) => (k < 4 ? FC.iron : wdD), 20); G.place(b, { x: 66, z: 26, roll: 90 }); }
    G.blob(66, 0, 26, 5, 7, 5, FC.iron, { nu: 8, nv: 5 });
    if (load === 1) G.blob(12, 0, 62, 40, 30, 16, 0x5a4430, { nu: 12, nv: 6 });
    if (load === 2) for (let i = 0; i < 4; i++) G.blob(-10 + i * 16, (i % 2 ? 1 : -1) * 10, 60, 12, 12, 12, 0xe8862a, { nu: 10, nv: 6 });
  })];
}

// ---- a wooden ladder leaning back against something: its feet at the origin, its top `reach` out along -X at h
export function ladder(h = 300, reach = 90) {
  h = q(h); reach = q(reach);
  return ['dladder|' + [h, reach].join('|'), shape((G) => {
    for (const s of [-1, 1]) G.tube([[0, s * 22, 0], [-reach, s * 22, h]], 3.2, FC.oak, { S: 6 });
    for (let z = 30; z < h - 10; z += 34) { const x = (-reach * z) / h; G.tube([[x, -22, z], [x, 22, z]], 2.2, FC.oakL, { S: 5 }); }
  })];
}

// ---- a wicker basket heaped with apples
export function basket(r = 30, fruit = 0xc8342a) {
  r = q(r, 2);
  return ['dbasket|' + [r, hx(fruit)].join('|'), shape((G) => {
    const p = []; for (let k = 0; k <= 6; k++) p.push([r * (0.78 + k * 0.04) + (k % 2) * 1.2, k * r * 0.12]);
    G.lathe(p, (k) => (k % 2 ? 0xa07a44 : 0xb88c50), 14);
    G.blob(0, 0, r * 0.7, r * 0.98, r * 0.98, 3, 0x8a6a3a, { nu: 12, nv: 4 });
    for (let i = 0; i < 9; i++) { const a = i * 2.4, d = i ? r * 0.55 * Math.sqrt(i / 9) : 0; G.blob(Math.cos(a) * d, Math.sin(a) * d, r * 0.78 + (i ? 2 : 6), r * 0.24, r * 0.24, r * 0.22, i % 3 ? fruit : mix(fruit, 0xe0b040, 0.4), { nu: 10, nv: 6 }); }
  })];
}

// ---- an apple tree: a short gnarled trunk, three boughs, a round crown of soft lumps; apples hang on the lumps' undersides
export function appleTree(h = 520, seed = 1) {
  h = q(h, 20);
  return ['dapple|' + [h, seed % 6].join('|'), shape((G) => {
    const R = rng(seed * 211 + h), bark = 0x5e4a3a, tr = h * 0.05, leaf = [0x5a8a3a, 0x4e7e32, 0x6a983e];
    G.tube([[0, 0, -16], [h * 0.02, h * 0.01, h * 0.2], [-h * 0.02, h * 0.02, h * 0.42]], (t) => tr * (1.4 - 0.5 * t), (t, a) => (Math.sin(a * 6 + t * 12) > 0.5 ? dark(bark, 0.8) : bark), { S: 10 });
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + R(); G.tube([[0, 0, h * 0.06], [Math.cos(a) * tr * 2, Math.sin(a) * tr * 2, 8], [Math.cos(a) * tr * 3, Math.sin(a) * tr * 3, -6]], (t) => tr * 0.45 * (1 - t * 0.6), bark, { S: 6 }); }
    const lumps = [];
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + R() * 0.6, L = h * (0.26 + R() * 0.06), tip = [Math.cos(a) * L, Math.sin(a) * L, h * (0.62 + R() * 0.08)]; G.tube([[0, 0, h * 0.38], [tip[0] * 0.5, tip[1] * 0.5, h * 0.52], tip], (t) => tr * 0.6 * (1 - t * 0.6), bark, { S: 7 }); lumps.push([tip[0] * 0.9, tip[1] * 0.9, tip[2] + h * 0.06, h * 0.2]); }
    lumps.push([0, 0, h * 0.78, h * 0.26]); for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.7; lumps.push([Math.cos(a) * h * 0.2, Math.sin(a) * h * 0.2, h * 0.66 + R() * h * 0.08, h * 0.17]); }
    const ww = (i, nx, ny, nz) => 1 + wob(nx * 3 + i, ny * 3 + nz * 2) * 0.12;   // how far each lump's skin is pushed out, by direction
    lumps.forEach(([x, y, z, r], i) => G.blob(x, y, z, r * 1.1, r * 1.1, r * 0.82, leaf[i % 3], { nu: 14, nv: 9, warp: (px, py, pz, nx, ny, nz) => { const w = ww(i, nx, ny, nz); return [px * w, py * w, pz * w]; } }));
    // apples on the lumps' undersides, half sunk in the skin at one of its corners (between corners the faces can sit
    // a little inside the curve, and an apple there would hang off nothing); one inside a neighbouring lump is not hung
    const inside = (px, py, pz, j) => lumps.some(([x2, y2, z2, r2], k) => { if (k === j) return false; const u = (px - x2) / (r2 * 1.1), v = (py - y2) / (r2 * 1.1), t = (pz - z2) / (r2 * 0.82), L = Math.hypot(u, v, t) || 1; return L < ww(k, u / L, v / L, t / L) + 0.45; });
    lumps.forEach(([x, y, z, r], i) => { const hung = new Set(); for (let k = 0; k < 7; k++) { const ia = Math.floor(R() * 14), ie = 2 + Math.floor(R() * 3), a = (ia / 14) * Math.PI * 2, el = -Math.PI / 2 + (ie * Math.PI) / 9, ce = Math.cos(el), nx = ce * Math.cos(a), ny = ce * Math.sin(a), nz = Math.sin(el), w = ww(i, nx, ny, nz) * 0.95, px = x + nx * r * 1.1 * w, py = y + ny * r * 1.1 * w, pz = z + nz * r * 0.82 * w; if (hung.has(ia * 9 + ie) || inside(px, py, pz, i)) continue; hung.add(ia * 9 + ie); G.blob(px, py, pz, 6.5, 6.5, 7, k % 4 ? 0xc8342a : 0xd8a040, { nu: 8, nv: 5 }); } });
  })];
}

// ---- a split-rail fence run along X: rough posts every `bay`, three split rails between them, a little crooked
export function railFence(len = 880, h = 100, seed = 1) {
  len = q(len, 20); h = q(h);
  return ['drail|' + [len, h, seed % 4].join('|'), shape((G) => {
    const R = rng(seed * 37 + len), n = Math.max(1, Math.round(len / 220)), bay = len / n;
    for (let i = 0; i <= n; i++) { const x = -len / 2 + i * bay; G.blob(x, 0, h / 2 + 4, 6.5, 6.5, h / 2 + 6, FC.weathD, { e: 6, nu: 6, nv: 3 }); G.blob(x, 0, h + 10, 7, 7, 3, mix(FC.weathD, 0x4a4238, 0.5), { e: 4, nu: 6, nv: 3 }); }
    for (let i = 0; i < n; i++) for (const zk of [0.32, 0.62, 0.9]) { const x0 = -len / 2 + i * bay + 4, x1 = x0 + bay - 8, z = h * zk + (R() - 0.5) * 6; G.tube([[x0, (R() - 0.5) * 3, z], [(x0 + x1) / 2, (R() - 0.5) * 4, z + (R() - 0.5) * 4], [x1, (R() - 0.5) * 3, z + (R() - 0.5) * 3]], 3.4, i % 2 ? FC.weath : mix(FC.weath, 0x8a8070, 0.5), { S: 6, flat: () => [1, 0.7] }); }
  })];
}

// ---- a raised bed: a timber frame round dark tilled earth, the crops set in by the map
export function raisedBed(w = 360, d = 140) {
  w = q(w); d = q(d);
  return ['dbed|' + [w, d].join('|'), shape((G) => {
    for (const s of [-1, 1]) { G.blob(0, s * (d / 2 - 5), 20, w / 2, 5, 20, FC.oak, { e: 8, nu: 8, nv: 3 }); G.blob(s * (w / 2 - 5), 0, 20, 5, d / 2, 20, FC.oakD, { e: 8, nu: 6, nv: 3 }); }
    G.blob(0, 0, 34, w / 2 - 8, d / 2 - 8, 4, 0x3e2c1e, { e: 4, nu: 12, nv: 4 });
    for (let x = -w / 2 + 30; x < w / 2 - 20; x += 40) G.blob(x, 0, 37, 10, d / 2 - 14, 2, 0x4a3424, { e: 3, nu: 6, nv: 3 });
  })];
}

// ---- a farm sign: a post, a board on two chains under an arm (the map writes the name on it)
export function farmSign(w = 220) {
  w = q(w);
  return ['dsign|' + w, shape((G) => {
    G.blob(0, 0, 150, 9, 9, 150, FC.oakD, { e: 8, nu: 6, nv: 3 }); G.blob(0, 0, 304, 11, 11, 5, FC.weathD, { e: 6, nu: 6, nv: 3 });
    G.blob(0, w / 2 + 10, 272, 6, w / 2 + 14, 6, FC.oakD, { e: 8, nu: 6, nv: 3 });
    G.tube([[0, 4, 230], [0, 22, 266]], 3, FC.oakD, { S: 5 });
    for (const s of [-1, 1]) G.tube([[0, w / 2 + 10 + s * (w / 2 - 20), 270], [0, w / 2 + 10 + s * (w / 2 - 20), 218]], 1.4, FC.iron, { S: 4, caps: false });
    G.blob(0, w / 2 + 10, 196, 4, w / 2, 32, 0x7a5a3a, { e: 8, nu: 6, nv: 3 });
  })];
}


// ---- an open-fronted cart shed: three posts on stone pads along the front (+X), planked back and ends, a shingled
// pent roof falling to the back, tools hung on the back wall
export function cartShed(w = 900, d = 420) {
  w = q(w); d = q(d);
  return ['dshed|' + [w, d].join('|'), shape((G) => {
    const hf = 360, hb = 280, hd = d / 2, hw = w / 2, wd = FC.weath, wdD = FC.weathD;
    for (const y of [-hw + 20, 0, hw - 20]) { G.blob(hd - 16, y, 10, 22, 22, 10, 0x8a8478, { e: 6, nu: 6, nv: 3 }); G.blob(hd - 16, y, hf / 2 + 10, 13, 13, hf / 2, wdD, { e: 8, nu: 6, nv: 3 }); }
    G.blob(hd - 16, 0, hf + 6, 16, hw, 12, wdD, { e: 8, nu: 6, nv: 3 });
    const under = (x) => (hf + hb) / 2 + 14 + x * ((hf - hb) / (d + 80)) + 4;   // just up inside the roof slab, so no plank top shows
    for (let y = -hw + 16; y < hw - 10; y += 30) G.blob(-hd + 6, y, under(-hd + 6) / 2, 5, 14, under(-hd + 6) / 2, Math.round(y / 30) % 2 ? wd : mix(wd, 0x7a7060, 0.4), { e: 12, nu: 4, nv: 3 });
    for (const s of [-1, 1]) for (let x = -hd + 16; x < hd - 30; x += 30) { const top = under(x); G.blob(x, s * (hw - 6), top / 2, 14, 5, top / 2, Math.round(x / 30) % 2 ? wd : mix(wd, 0x7a7060, 0.4), { e: 12, nu: 4, nv: 3 }); }
    { const L = Math.hypot(d + 80, hf - hb), a = (Math.atan2(hf - hb, d + 80) * 180) / Math.PI, b = G.n; G.blob(0, 0, 0, L / 2, hw + 40, 6, 0x4a3e3a, { e: 8, nu: 10, nv: 3 }); G.place(b, { x: 0, z: (hf + hb) / 2 + 14, pitch: -a }); }
    // on the back wall: a rake, a scythe, a coil of rope on pegs
    for (const y of [-160, 40, 220]) G.blob(-hd + 14, y, 200, 5, 4, 4, wdD, { e: 6, nu: 6, nv: 3 });
    G.tube([[-hd + 18, -170, 40], [-hd + 18, -160, 214]], 2.4, FC.oakL, { S: 5 }); G.tube([[-hd + 18, -190, 214], [-hd + 18, -150, 214]], 2.6, FC.oakL, { S: 5 }); for (let i = 0; i < 6; i++) G.tube([[-hd + 18, -186 + i * 6, 214], [-hd + 24, -186 + i * 6, 228]], 1, FC.iron, { S: 4 });
    // the scythe hung on its peg by the snath, the blade curving away over the next peg's head; a coil of rope over the third
    G.tube([[-hd + 18, 40, 34], [-hd + 18, 40, 222]], 2.4, FC.oakL, { S: 5 }); G.tube([[-hd + 19, 40, 214], [-hd + 21, 0, 222], [-hd + 23, -40, 206]], 1.6, 0x8a9096, { S: 4, flat: () => [1, 0.3] });
    for (const k of [0, 1]) { const pts = []; for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI * 2; pts.push([-hd + 18 + k * 3, 220 + Math.sin(a) * (20 - k * 3), 180 + k * 2 + Math.cos(a) * (20 - k * 3)]); } G.tube(pts, 2.6, k ? 0xa8885a : 0xb89a68, { S: 5, caps: false }); }
  })];
}

// ---- an old wooden plough left in the furrows: beam, handles, the iron share and coulter
export function plough() {
  return ['dplough', shape((G) => {
    G.tube([[90, 0, 50], [0, 0, 40], [-60, 0, 24]], 5, FC.oakD, { S: 6 });
    for (const s of [-1, 1]) G.tube([[-40, 0, 26], [-90, s * 26, 70], [-120, s * 30, 92]], 3.4, FC.oak, { S: 6 });
    G.tube([[-110, -30, 82], [-110, 30, 82]], 2.4, FC.oak, { S: 5 });
    G.tube([[10, 0, 40], [0, 0, 4]], 3, FC.iron, { S: 5 }); G.tube([[-56, 0, 26], [-20, 0, 6], [30, 0, 2]], 4, FC.rust, { S: 5, flat: () => [1.4, 0.5] });
  })];
}

// ---- a ploughed field: long low ridges of turned earth along X, a lighter top on each, a grassy headland round it
export function furrows(w = 1600, d = 1000, rows = 14) {
  w = q(w); d = q(d);
  return ['dfurrow|' + [w, d, rows].join('|'), shape((G) => {
    const pitch = d / rows;
    for (let i = 0; i < rows; i++) { const y = -d / 2 + pitch * (i + 0.5); G.blob(0, y, 2, w / 2 - 30, pitch * 0.42, 9, (x, yy, z) => (z > 0.45 ? 0x6a5438 : 0x4e3c28), { e: 4, nu: 16, nv: 6 }); }
    G.blob(0, 0, -2, w / 2 + 40, d / 2 + 40, 3, 0x6a7a3a, { e: 10, nu: 10, nv: 3 });
  })];
}

// ---- the Blight where it broke the ground: a low heaving mat of fungal growth, rust-dark and mottled with pale flesh,
// split by black seams; the Vale's red-capped toadstools crowd up out of it (one great one, a ring of big ones, many
// small), pale puffballs swell between them. Glowing pores are left to the map (the strain's lime).
export function blightMass(r = 260, seed = 1) {
  r = q(r);
  return ['dblight2|' + [r, seed % 5].join('|'), shape((G) => {
    const R = rng(seed * 97 + r), flesh = 0xe2d8c0, rust = 0x7a3e2c, rustD = 0x4e2a20, pink = 0xb8907a, seam = 0x2a1a16, cap = 0xa4432a, capD = 0x7a2a1a, gill = 0xd8c8a4;
    const mott = (nx, ny, nz, i) => { const w = wob(nx * 5 + i, ny * 5 + nz * 4); return nz < -0.2 ? rustD : w > 0.68 ? seam : w > 0.25 ? rust : w < -0.45 ? flesh : pink; };
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + R(), d = i ? r * (0.3 + R() * 0.45) : 0, rr2 = r * (i ? 0.34 + R() * 0.18 : 0.6); G.blob(Math.cos(a) * d, Math.sin(a) * d, rr2 * 0.12, rr2, rr2 * (0.8 + R() * 0.3), rr2 * 0.34, (nx, ny, nz) => mott(nx, ny, nz, i), { nu: 12, nv: 7, warp: (x, y, z, nx, ny, nz) => { const w = 1 + wob(nx * 3 + i, ny * 3 + nz) * 0.16; return [x * w, y * w, Math.max(z * w, -rr2 * 0.1)]; } }); }
    const toad = (x, y, z, h, w, lean) => { const b = G.n; G.lathe([[w * 0.24, -4], [w * 0.2, h * 0.18], [w * 0.15, h * 0.55], [w * 0.13, h * 0.92], [w * 0.5, h * 0.94], [w * 0.53, h], [w * 0.42, h + w * 0.22], [0, h + w * 0.3]], (k) => (k < 3 ? flesh : k < 4 ? gill : k < 5 ? capD : cap), 10); for (let q2 = 0; q2 < 5; q2++) { const a = R() * 6.28, rr2 = w * (0.06 + R() * 0.3), skin = h + w * 0.3 - (w * 0.08) * (rr2 / (w * 0.42)); G.blob(Math.cos(a) * rr2, Math.sin(a) * rr2, skin, w * 0.05, w * 0.05, w * 0.03, flesh, { nu: 6, nv: 4 }); } G.place(b, { x, y, z, pitch: lean, yaw: R() * 360 }); };   // warts on the cap's skin
    toad(r * 0.05, 0, r * 0.12, r * 1.15, r * 0.8, 5);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + R(), d = r * (0.42 + R() * 0.15); toad(Math.cos(a) * d, Math.sin(a) * d, r * 0.06, r * (0.5 + R() * 0.15), r * (0.38 + R() * 0.1), (R() - 0.5) * 24); }
    for (let i = 0; i < 12; i++) { const a = R() * Math.PI * 2, d = r * (0.25 + R() * 0.75); toad(Math.cos(a) * d, Math.sin(a) * d, d > r * 0.7 ? 2 : r * 0.04, r * (0.14 + R() * 0.14), r * (0.12 + R() * 0.08), (R() - 0.5) * (d > r * 0.7 ? 14 : 36)); }   // out past the mat they stand in the earth
    for (let i = 0; i < 4; i++) { const a = R() * Math.PI * 2, d = r * (0.3 + R() * 0.5), pr = r * (0.1 + R() * 0.07); G.blob(Math.cos(a) * d, Math.sin(a) * d, r * 0.08 + pr * 0.7, pr, pr, pr * 0.85, (nx, ny, nz) => (nz > 0.6 ? 0xf2ece0 : nz < -0.3 ? 0xa89a80 : flesh), { nu: 12, nv: 8 }); }
  })];
}

// ---- a field of standing wheat (out of reach, past the walls): a soft-edged slab of ears, lighter on top, rows in it
export function wheatField(w = 4000, d = 3000, c = 0xd8b45e, seed = 1) {
  w = q(w, 100); d = q(d, 100);
  return ['dwheat|' + [w, d, hx(c), seed % 4].join('|'), shape((G) => {
    G.blob(0, 0, 0, w / 2, d / 2, 70, (nx, ny, nz) => (nz < 0.3 ? dark(c, 0.7) : wob(nx * 30 + seed, ny * 3) > 0.55 ? dark(c, 0.88) : wob(ny * 40, nx * 2 + seed) < -0.5 ? mix(c, 0xf2dc96, 0.4) : c), { e: 5, nu: 40, nv: 10, warp: (x, y, z, nx, ny, nz) => [x, y, nz > 0.2 ? z + wob(x * 0.004 + seed, y * 0.004) * 10 : z] });
  })];
}

// ---- a duck house on a raft at the pond's edge: a little pitched hut, a ramp to the water
export function duckHouse() {
  return ['dduck', shape((G) => {
    G.blob(0, 0, 4, 90, 70, 4, FC.weathD, { e: 8, nu: 8, nv: 3 });
    G.blob(0, 0, 50, 56, 48, 42, 0xe8e0cc, { e: 10, nu: 8, nv: 4 }); G.blob(57, 0, 30, 2, 18, 20, 0x2a221c, { e: 8, nu: 4, nv: 3 });
    for (const s of [-1, 1]) { const b = G.n; G.blob(0, 0, 0, 66, 36, 3, 0x5a7a52, { e: 8, nu: 6, nv: 3 }); G.place(b, { y: s * 26, z: 104, roll: -s * 32 }); }
    { const b = G.n; G.blob(0, 0, 0, 40, 16, 2, FC.weath, { e: 8, nu: 6, nv: 3 }); G.place(b, { x: 116, z: 4, pitch: -6 }); }
  })];
}


// ---- a tree for the distance (the woods past the walls, the giants on the skyline): a trunk and a crown of a few soft
// lumps, or a fir of stacked skirts; a tenth of a near tree's faces
export function farTree(h = 1800, kind = 0, leaf = 0x355e2c, seed = 1) {
  h = q(h, 200);
  return ['dfartree|' + [h, kind, hx(leaf), seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 59 + h), bark = 0x4e3a2c, tr = h * 0.04;
    G.lathe([[tr * 1.5, -10], [tr, h * 0.1], [tr * 0.7, h * (kind ? 0.5 : 0.6)]], bark, 6);
    if (kind === 1) { for (let i = 0; i < 4; i++) { const t = i / 4, r = h * (0.3 - t * 0.2), z = h * (0.22 + t * 0.72); G.lathe([[r, z], [r * 0.6, z + h * 0.12], [0, z + h * 0.2]], i % 2 ? dark(leaf, 0.88) : leaf, 8); } return; }
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + R(), d = i ? h * 0.16 : 0, r = h * (i ? 0.2 : 0.27); G.blob(Math.cos(a) * d, Math.sin(a) * d, h * (i ? 0.64 : 0.74), r * 1.1, r * 1.1, r * 0.8, i % 2 ? dark(leaf, 0.9) : leaf, { nu: 10, nv: 6 }); }
  })];
}

// ---- a lump of hedge (hawthorn, field maple): four soft masses of leaf, lighter on top, a scatter of may blossom if
// asked; half the faces of a garden bush, made to be set shoulder to shoulder along a line
export function hedgeLump(r = 200, leaf = 0x4e7a30, bloom = 0, seed = 1) {
  r = q(r, 20);
  return ['dhedge|' + [r, hx(leaf), hx(bloom), seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 23 + r), lumps = [];
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + R() * 0.8, d = i ? r * 0.42 : 0, s = r * (i ? 0.66 : 0.82); lumps.push([Math.cos(a) * d, Math.sin(a) * d, s * 0.72, s]); }
    const ww = (x, nx, ny, nz) => 1 + wob(nx * 3 + x * 0.01, ny * 3 + nz * 2) * 0.1;   // how far a lump's skin is pushed out, by direction
    for (const [x, y, z, s] of lumps) G.blob(x, y, z, s, s, s * 0.82, (nx, ny, nz) => (nz > 0.55 ? mix(leaf, 0x8aba54, 0.3) : nz < -0.3 ? dark(leaf, 0.72) : leaf), { nu: 11, nv: 7, warp: (px, py, pz, nx, ny, nz) => { const w = ww(x, nx, ny, nz); return [px * w, py * w, pz * w]; } });
    // may blossom on the lumps' skins, never inside a neighbouring lump (where it would not show) or off the leaves
    if (bloom) for (let i = 0; i < 16; i++) { const j = Math.floor(R() * lumps.length), [x, y, z, s] = lumps[j], a = R() * 6.28, el = 0.2 + R() * 0.9, ce = Math.cos(el), nx = ce * Math.cos(a), ny = ce * Math.sin(a), nz = Math.sin(el), w = ww(x, nx, ny, nz) * 0.95, px = x + nx * s * w, py = y + ny * s * w, pz = z + nz * s * 0.82 * w;
      if (lumps.some(([x2, y2, z2, s2], k) => { if (k === j) return false; const u = (px - x2) / s2, v = (py - y2) / s2, t = (pz - z2) / (s2 * 0.82), L = Math.hypot(u, v, t) || 1; return L < ww(x2, u / L, v / L, t / L) + 0.35; })) continue;
      G.blob(px, py, pz, 7, 7, 4, bloom, { nu: 6, nv: 4 }); }
  })];
}
