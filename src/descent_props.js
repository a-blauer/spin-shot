// Things the Descent's rooms are furnished with. Each is built once, here, to one standard: a person's things are a
// person's size (a table is waist high, a bench knee high, a shelf a little over head height), everything you can
// bump into has a body, and nothing pokes through anything else. `along` means the long side runs along X.
// Heights given as `z` are the height of the floor the thing stands on (so it can go on a platform).
import { V, R } from './mapkit.js';

export function props(K, Q) {
  const { M, T, H, rnd, rr } = K;
  const { Box, BoxRot, Glow, Cyl, Oct, Ball, ConeShape, Pyramid } = M;
  const { out, AX, AY, L, hit, solid, deco, tile, tall, chain } = Q;
  const wood = 0x5a3e26, wdark = 0x3a2c20, iron = 0x3a3e46;
  const xy = (along, a, b) => (along ? [a, b] : [b, a]);
  const P = {};

  // ---- the building
  P.column = (x, y, d, col, trim, style = 'round', h = H) => {
    if (style === 'round') Cyl(V(x, y, h / 2), d, h, col, true, true); else if (style === 'oct') Oct(V(x, y, h / 2), V(d, d, h), col, true, true); else Box(V(x, y, h / 2), V(d, d, h), col, true, true);
    const cap = style === 'square' ? (z, s, t) => Box(V(x, y, z), V(s, s, t), trim, false, false) : (z, s, t) => Oct(V(x, y, z), V(s, s, t), trim, false, false);
    cap(35, d + 110, 70); cap(92, d + 50, 44); cap(h - 35, d + 110, 70); cap(h - 92, d + 50, 44);
    tall(x, y, d / 2 + 170);
  };
  P.obelisk = (x, y, h, col, glow, w = 150) => {
    solid(x, y, 0, w + 60, w + 60, 50, T.trim); solid(x, y, 50, w, w, h * 0.78, col, false); Pyramid(V(x, y, 50 + h * 0.78 + h * 0.11), V(w, w, h * 0.22), col);
    if (glow) for (const e of [-1, 1]) { Glow(V(x + e * (w / 2 + 1), y, 50 + h * 0.4), V(4, w * 0.22, h * 0.5), glow, 0); Glow(V(x, y + e * (w / 2 + 1), 50 + h * 0.4), V(w * 0.22, 4, h * 0.5), glow, 0); }
    tall(x, y, w / 2 + 160);
  };
  P.banner = (x, y, z, w, h, col, along, trim = 0xc8a03a) => {   // hung cloth: z is the rod's height
    const [sx, sy] = xy(along, w, 6); deco(x, y, z, along ? w + 40 : 12, along ? 12 : w + 40, 12, wdark); deco(x, y, z - h, sx, sy, h, col); deco(x, y, z - h - 4, along ? w : 8, along ? 8 : w, 16, trim);
    Pyramid(V(x, y, z - h - 44), V(along ? w * 0.5 : 6, along ? 6 : w * 0.5, 80), col, R(180, 0, 0));
  };
  P.rug = (x, y, w, d, col, edge) => { tile(x - w / 2, y - d / 2, x + w / 2, y + d / 2, 2.4, edge); tile(x - w / 2 + 24, y - d / 2 + 24, x + w / 2 - 24, y + d / 2 - 24, 3.4, col); };

  // ---- furniture
  P.table = (x, y, along, len = 240, col = wood, z = 0) => {
    const [w, d] = xy(along, len, 92); solid(x, y, z + 68, w, d, 10, col, false);
    for (const e of [-1, 1]) deco(x + (along ? e * (len / 2 - 22) : 0), y + (along ? 0 : e * (len / 2 - 22)), z, along ? 12 : 72, along ? 72 : 12, 68, wdark);
    hit(x, y, z, w, d, 78, len >= 200);
  };
  P.bench = (x, y, along, len = 220, col = wood, z = 0) => {
    const [w, d] = xy(along, len, 40); solid(x, y, z + 36, w, d, 8, col, false);
    for (const e of [-1, 1]) deco(x + (along ? e * (len / 2 - 18) : 0), y + (along ? 0 : e * (len / 2 - 18)), z, along ? 10 : 34, along ? 34 : 10, 36, wdark);
    hit(x, y, z, w, d, 44, false);
  };
  // a long table with a bench each side
  P.mess = (x, y, along, len = 320, col = wood) => { P.table(x, y, along, len, col); for (const e of [-1, 1]) P.bench(x + (along ? 0 : e * 96), y + (along ? e * 96 : 0), along, len - 30, col); };
  P.pew = (x, y, len = 300, face = 1, col = wood, z = 0) => {   // a pew across X; `face` is which way (+Y or -Y) it looks
    solid(x, y, z + 36, len, 46, 8, col, false); deco(x, y - face * 24, z, len, 8, 92, col); for (const e of [-1, 1]) deco(x + e * (len / 2 - 4), y, z, 8, 52, 60, wdark);
    hit(x, y, z, len, 54, 92, true);
  };
  P.shelf = (x, y, along, len = 400, h = 230, col = 0x4a3626, books = [0x7a2a22, 0x2a4a6a, 0x3a5a2a, 0x8a6a2a, 0x4a2a5a]) => {
    const [w, d] = xy(along, len, 70); solid(x, y, 0, w, d, h, col);
    for (let z = 4; z < h; z += 56) deco(x, y, z, w + 8, d + 8, 8, wdark);
    for (let z = 12, t = 0; z + 40 < h; z += 56, t++) for (let p = -len / 2 + 18, i = t; p < len / 2 - 50; i++) {
      const bw = 44 + ((i * 37) % 50), bh = 30 + ((i * 13) % 14), c = books[(i * 7 + t) % books.length];
      for (const e of [-1, 1]) deco(x + (along ? p + bw / 2 : e * (d / 2 + 1)), y + (along ? e * (d / 2 + 1) : p + bw / 2), z, along ? bw - 6 : 4, along ? 4 : bw - 6, bh, c);
      p += bw;
    }
    if (h > 400) tall(x, y, len / 2 + 60);
  };
  P.bed = (x, y, along, col = 0x6a6a5a, z = 0) => { const [w, d] = xy(along, 200, 90); solid(x, y, z + 30, w, d, 14, col, false); deco(x, y, z, w - 10, d - 10, 30, wdark); deco(x - (along ? 76 : 0), y - (along ? 0 : 76), z + 44, along ? 40 : 70, along ? 70 : 40, 12, 0xd8d0c0); hit(x, y, z, w, d, 46, true); };
  P.throne = (x, y, face, col, trim, z = 0) => {   // faces +Y or -Y
    solid(x, y, z, 150, 130, 60, col, false); deco(x, y - face * 55, z + 60, 150, 24, 280, col); deco(x, y - face * 55, z + 340, 170, 28, 30, trim); Pyramid(V(x, y - face * 55, z + 410), V(60, 24, 80), trim);
    for (const e of [-1, 1]) { deco(x + e * 66, y, z + 60, 22, 120, 50, trim); Ball(V(x + e * 66, y + face * 56, z + 118), V(34, 34, 34), trim); }
    hit(x, y, z, 160, 140, 340, true);
  };

  // ---- yards and stores
  P.fence = (x, y, len, along, col = wdark, h = 100) => {
    const [w, d] = xy(along, len, 22);
    for (const z of [h * 0.4, h * 0.8]) deco(x, y, z, along ? len : 10, along ? 10 : len, 12, col);
    for (let p = -len / 2; p <= len / 2 + 1; p += len / Math.max(2, Math.round(len / 180))) deco(x + (along ? p : 0), y + (along ? 0 : p), 0, 18, 18, h + 8, col);
    hit(x, y, 0, w, d, h, true);
  };
  P.grave = (x, y, col = 0x6a6e70, lean = 0) => { BoxRot(V(x, y, 46), V(70, 16, 92), col, R(lean, 0, 0), false); Ball(V(x, y, 92), V(70, 16, 40), col); hit(x, y, 0, 74, 26, 100, false); tile(x - 40, y + 14, x + 40, y + 210, 2.6, 0x2a241c); };
  P.deadTree = (x, y, h = 520, col = 0x2a2018) => {
    Cyl(V(x, y, h * 0.3), 64, h * 0.6, col, true, false); Cyl(V(x, y, 14), 110, 28, col, false, false);
    for (let i = 0; i < 4; i++) { const a = i * 1.7 + x * 0.01, len = h * (0.34 + (i % 2) * 0.12), tilt = 38 + i * 9; BoxRot(V(x + Math.cos(a) * len * 0.3, y + Math.sin(a) * len * 0.3, h * 0.6 + len * 0.36), V(22, 22, len), col, R(tilt * Math.cos(a), 0, -tilt * Math.sin(a)), false); }
    tall(x, y, h * 0.5);
  };
  P.hay = (x, y, along, z = 0, col = 0xb89a3a) => { const [w, d] = xy(along, 140, 90); solid(x, y, z, w, d, 80, col, z === 0); for (const e of [-1, 1]) deco(x + (along ? e * 36 : 0), y + (along ? 0 : e * 36), z, along ? 6 : d + 4, along ? d + 4 : 6, 82, 0x6a5420); };
  P.wagon = (x, y, along, col = wood) => {
    const [w, d] = xy(along, 280, 130); solid(x, y, 56, w, d, 16, col, false); for (const e of [-1, 1]) deco(x + (along ? 0 : e * 62), y + (along ? e * 62 : 0), 72, along ? 280 : 8, along ? 8 : 280, 40, wdark);
    for (const a of [-1, 1]) for (const e of [-1, 1]) Cyl(V(x + (along ? a * 90 : e * 72), y + (along ? e * 72 : a * 90), 38), 76, 12, wdark, false, false, along ? AY : AX);
    hit(x, y, 0, w, d, 112, true);
  };
  P.container = (x, y, along, col, z = 0) => {
    const [w, d] = xy(along, 620, 250); solid(x, y, z, w, d, 250, col, z === 0);
    for (let p = -280; p <= 280; p += 70) for (const e of [-1, 1]) deco(x + (along ? p : e * 126), y + (along ? e * 126 : p), z + 14, along ? 14 : 6, along ? 6 : 14, 222, 0x202428);
    deco(x, y, z, w + 8, d + 8, 14, 0x202428); deco(x, y, z + 236, w + 8, d + 8, 14, 0x202428);
    if (z + 250 > 400) tall(x, y, 380);
  };
  P.junk = (x, y, s = 320) => {
    hit(x, y, 0, s * 0.8, s * 0.8, s * 0.45, true);
    for (let i = 0; i < 7; i++) { const a = i * 2.4, r = (i % 3) * s * 0.14, b = s * (0.18 + (i % 4) * 0.06); Box(V(x + Math.cos(a) * r, y + Math.sin(a) * r, b * 0.4 + (i > 3 ? s * 0.2 : 0)), V(b * 1.3, b, b * 0.8), [0x5a4a3a, 0x3a3e46, 0x6a3a2a, 0x4a4e56][i % 4], false, false, i * 37); }
    BoxRot(V(x, y, s * 0.5), V(18, 18, s * 0.7), iron, R(24, 30, 12), false);
  };
  P.rack = (x, y, along, col = wdark) => {   // a rack of long arms
    const [w, d] = xy(along, 220, 44); solid(x, y, 0, w, d, 26, col, false); for (const e of [-1, 1]) deco(x + (along ? e * 104 : 0), y + (along ? 0 : e * 104), 26, 12, 12, 130, col); deco(x, y, 148, along ? 220 : 16, along ? 16 : 220, 12, col);
    for (let i = -3; i <= 3; i++) BoxRot(V(x + (along ? i * 28 : 0), y + (along ? 0 : i * 28), 92), V(8, 8, 150), i % 2 ? 0x8a8e96 : 0x5a3e26, R(along ? 0 : 8, 0, along ? 8 : 0), false);
    hit(x, y, 0, w, d, 160, true);
  };

  // ---- figures and machines
  P.statue = (x, y, h = 250, col = 0x8a8a84, plinth = T.trim, pose = 0) => {
    solid(x, y, 0, 120, 120, 70, plinth); deco(x, y, 70, 100, 100, 10, col);
    const s = h / 250; deco(x - 20 * s, y, 80, 30 * s, 34 * s, 110 * s, col); deco(x + 20 * s, y, 80, 30 * s, 34 * s, 110 * s, col); deco(x, y, 80 + 110 * s, 84 * s, 46 * s, 86 * s, col); Ball(V(x, y, 80 + 222 * s), V(48 * s, 48 * s, 56 * s), col);
    for (const e of [-1, 1]) BoxRot(V(x + e * 56 * s, y + (pose && e > 0 ? 30 * s : 0), 80 + (pose && e > 0 ? 190 : 150) * s), V(24 * s, 24 * s, 88 * s), col, R(pose && e > 0 ? 70 : 0, 0, e * 8), false);
    hit(x, y, 70, 100, 80, h, false);
  };
  P.armor = (x, y, col = 0x8a8e96) => { solid(x, y, 0, 70, 70, 16, wdark, false); deco(x, y, 16, 14, 14, 110, wdark); deco(x, y, 96, 70, 40, 66, col); Ball(V(x, y, 186), V(42, 44, 48), col); deco(x, y, 204, 8, 46, 20, 0x8a2a22); for (const e of [-1, 1]) deco(x + e * 44, y, 104, 18, 30, 56, col); hit(x, y, 0, 80, 60, 200, false); };
  P.cage = (x, y, s = 170, h = 210, col = iron) => {
    deco(x, y, 0, s + 10, s + 10, 12, col); deco(x, y, h, s + 10, s + 10, 12, col);
    for (let i = 0; i <= 4; i++) for (const e of [-1, 1]) { const p = -s / 2 + i * s / 4; deco(x + p, y + e * s / 2, 12, 8, 8, h - 12, col); deco(x + e * s / 2, y + p, 12, 8, 8, h - 12, col); }
    hit(x, y, 0, s, s, h, true);
  };
  P.tank = (x, y, d, h, col, band = iron, z = 0) => {
    Cyl(V(x, y, z + h / 2), d, h, col, true, z === 0); for (const f of [0.12, 0.5, 0.88]) Cyl(V(x, y, z + h * f), d + 14, 16, band, false, false); Ball(V(x, y, z + h), V(d, d, d * 0.34), col);
    if (z + h > 420) tall(x, y, d / 2 + 160);
  };
  P.vat = (x, y, d, h, liquid, col = iron) => {   // glass, with something in it
    Cyl(V(x, y, 25), d + 40, 50, col, true, true); Glow(V(x, y, 50 + h / 2), V(d - 16, d - 16, h), liquid, 1); for (const f of [0, 0.5, 1]) Cyl(V(x, y, 50 + h * f), d + 10, 12, col, false, false);
    Cyl(V(x, y, 62 + h), d + 40, 24, col, false, false); hit(x, y, 50, d * 0.8, d * 0.8, h, false); L(x, y, 50 + h * 0.6, [((liquid >> 16) & 255) / 255, ((liquid >> 8) & 255) / 255, (liquid & 255) / 255], 700, 1.4);
    if (h > 380) tall(x, y, d / 2 + 140);
  };
  P.gear = (x, y, z, d, col, along = true, th = 26) => {   // stood on edge; `along` true puts its face along X
    const rot = along ? AY : AX; Cyl(V(x, y, z), d, th, col, false, false, rot); Oct(V(x, y, z), along ? V(d * 1.12, th * 0.7, d * 1.12) : V(th * 0.7, d * 1.12, d * 1.12), col, false, false);
    Box(V(x, y, z), along ? V(d * 0.8, th * 0.7, d * 0.8) : V(th * 0.7, d * 0.8, d * 0.8), col, false, false); Cyl(V(x, y, z), d * 0.28, th + 16, 0x2a2420, false, false, rot);
  };
  P.crystal = (x, y, h, cols, glow) => {
    hit(x, y, 0, h * 0.42, h * 0.42, h * 0.55, true); Pyramid(V(x, y, h / 2), V(h * 0.3, h * 0.3, h), cols[0]);
    for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.5, hh = h * (0.4 + (i % 3) * 0.12); Pyramid(V(x + Math.cos(a) * h * 0.2, y + Math.sin(a) * h * 0.2, hh * 0.45), V(hh * 0.26, hh * 0.26, hh), cols[(i + 1) % cols.length], R(Math.cos(a) * 22, i * 40, -Math.sin(a) * 22)); }
    if (glow) { Cyl(V(x, y, 2), h * 0.8, 3, 0x241a40, false, false); Glow(V(x, y, 4.2), V(h * 0.5, h * 0.5, 2), glow, 7); if (h > 300) L(x, y, h * 0.6, [((glow >> 16) & 255) / 255, ((glow >> 8) & 255) / 255, (glow & 255) / 255], 900, 1.6); }
    if (h > 420) tall(x, y, h * 0.4 + 120);
  };
  P.mushroom = (x, y, h, cap, glow, stem = 0xd8cfa8) => {
    const w = h * 0.95; Cyl(V(x, y, h / 2), h * 0.16, h, stem, true, false); ConeShape(V(x, y, h + w * 0.2), V(w, w, w * 0.42), cap); Cyl(V(x, y, h - 2), w * 0.86, 6, stem, false, false);
    if (glow) { Glow(V(x, y, h - 8), V(w * 0.7, w * 0.7, 4), glow, 1); for (let i = 0; i < 5; i++) { const a = i * 1.26 + h; Glow(V(x + Math.cos(a) * w * 0.26, y + Math.sin(a) * w * 0.26, h + w * 0.22), V(w * 0.09, w * 0.09, w * 0.07), glow, 2); } }
    if (h > 420) tall(x, y, w / 2 + 120);
  };
  P.stall = (x, y, along, c1, c2) => {   // a market stall: counter, four posts, a striped awning
    const [w, d] = xy(along, 260, 90); solid(x, y, 0, w, d, 92, wood); deco(x, y, 92, w + 16, d + 16, 8, wdark);
    for (const a of [-1, 1]) for (const e of [-1, 1]) deco(x + (along ? a * 132 : e * 70), y + (along ? e * 70 : a * 132), 0, 12, 12, 250, wdark);
    for (let i = 0; i < 6; i++) { const p = -110 + i * 44; deco(x + (along ? p : 0), y + (along ? 0 : p), 250, along ? 44 : 190, along ? 190 : 44, 10, i % 2 ? c1 : c2); }
    for (let i = 0; i < 3; i++) Ball(V(x + (along ? -70 + i * 70 : 0), y + (along ? 0 : -70 + i * 70), 112), V(36, 36, 30), [0xc8402a, 0xd8a030, 0x6a8a3a][i]);
  };
  P.fountain = (x, y, d, col, water, lampc) => {
    Cyl(V(x, y, 32), d, 64, col, true, true); Cyl(V(x, y, 66), d + 30, 10, T.trim, false, false); Glow(V(x, y, 60), V(d - 60, d - 60, 6), water, 1);
    Cyl(V(x, y, 150), 60, 180, col, false, false); Cyl(V(x, y, 244), d * 0.42, 16, col, false, false); Glow(V(x, y, 256), V(d * 0.34, d * 0.34, 6), water, 1); Ball(V(x, y, 290), V(50, 50, 60), T.trim);
    hit(x, y, 64, 70, 70, 200, false); if (lampc) L(x, y, 320, lampc, 1500, 2.4); tall(x, y, d / 2 + 60);
  };
  // shallow water you can wade: a sheet of it with a low kerb
  P.pool = (x0, y0, x1, y1, water, rim, glint) => {
    tile(x0, y0, x1, y1, 2.6, water); if (glint) for (let i = 0; i < 5; i++) Glow(V(x0 + (x1 - x0) * (0.2 + ((i * 37) % 60) / 100), y0 + (y1 - y0) * (0.15 + i * 0.17), 4), V((x1 - x0) * 0.16, 10, 2), glint, 0);
    for (const [a, b, c, d] of [[x0 - 20, y0 - 20, x1 + 20, y0], [x0 - 20, y1, x1 + 20, y1 + 20], [x0 - 20, y0, x0, y1], [x1, y0, x1 + 20, y1]]) Box(V((a + c) / 2, (b + d) / 2, 9), V(c - a, d - b, 18), rim, true, false);
  };
  // a lamp on a post
  P.lampPost = (x, y, h, lampc, col = iron, z = 0) => { solid(x, y, z, 22, 22, h, col, false); deco(x, y, z, 50, 50, 14, col); deco(x, y, z + h, 46, 46, 50, col); Glow(V(x, y, z + h + 25), V(32, 32, 36), 0xffe6a0, 0); L(x, y, z + h + 30, lampc, 1300, 2); };
  // something hanging from the roof on a chain, clear of heads: `fn(z)` draws it at the chain's end
  P.hung = (x, y, z, fn) => { chain(x, y, z, H); fn(z); tall(x, y, 260); };
  return P;
}
