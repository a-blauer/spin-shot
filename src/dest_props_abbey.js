// Sculpted pieces for the Rot's ruins (The Withered Abbey first): walls of coursed stone broken to ragged tops, cut by
// pointed and round arches; the piers and the stones fallen out of them; the monks' tombs, their graves and their dead
// garden; what the fire left. Same rules as dest_props.js: UE frame (X the front, Y right, Z up), [key, build] pairs,
// keys carry every number the shape depends on, things stand on z = 0, every piece whole.
import * as THREE from 'three';
import { shapeB as shape, shapeF } from './propkit.js';
import { dark } from './village_shapes.js';
import { q, rng } from './dest_props.js';

export const AB = {   // the abbey's colours: grey stone gone dull, soot where it burned, dead grass and ash
  stone: [0x8a867e, 0x7e7a72, 0x96928a, 0x726e66], stoneD: 0x5a5650, soot: 0x4a4540, lichen: 0x76785a,
  bark: 0x3e3a36, barkD: 0x2a2826, char: 0x1e1b1a, charL: 0x34302c, ember: 0xff6a1c, wood: 0x6e665a, woodD: 0x4e4840,
  iron: 0x3a3432, rust: 0x5a3e30, bronze: 0x4e5a4a, verd: 0x5e8070, soil: 0x3e3428, herb: [0x7a7058, 0x6a6250, 0x8a7e62],
};
const N = (s) => Math.abs(Math.round(s)) || 0;
const deg = (r) => (r * 180) / Math.PI;
const pick4 = (a, i) => a[((i % a.length) + a.length) % a.length];

// ---- walls -------------------------------------------------------------------------------------------------------
// A wall of coursed stone along X (from -len/2 to len/2), t thick, standing to h (plus peak at its middle, falling off
// straight to its ends: a gable) and broken toward its ruin (0 whole .. 1 half gone), scaled from fall[0] at its west
// end to fall[1] at its east. Blocks bl long, co high, in running bond; its foot course a darker stone a little proud.
// Openings (holes): { s: centre along it, w: width, z0: sill (0 a door), z1: where its head springs, k: 'p' pointed
// (two arcs of radius w), 'r' round, 'q' square-headed (a cut, nothing above z1; col: shafts stand in it, a pier of
// colonnettes under the arches either side), 'v' a breach (open from z0 up, widening by sp a unit of height) }; the
// arched ones are ringed with voussoirs. Buttresses (butt): { s, side: 1 | -1 (the +Y or -Y face) or 0 (both), d, w }.
// str: heights of string courses (a band of stone standing proud). cope: coping where it still stands to its height.
const holeSpan = (H, z) => { const a = H.w / 2; if (z < H.z0) return null;
  if (H.k === 'v') { const e = a + (z - H.z0) * (H.sp ?? 0.6); return [H.s - e, H.s + e]; }
  if (z <= H.z1) return [H.s - a, H.s + a]; if (H.k === 'q') return null; const dz = z - H.z1;
  if (H.k === 'r') { if (dz >= a) return null; const e = Math.sqrt(a * a - dz * dz); return [H.s - e, H.s + e]; }
  if (dz >= H.w * 0.866) return null; const e = Math.sqrt(H.w * H.w - dz * dz) - a; return e > 0 ? [H.s - e, H.s + e] : null; };
const ruinTop = (o) => { const { len, h, ruin = 0, seed = 1, co = 35, peak = 0, fall = [1, 1] } = o, hl = len / 2;
  return (s) => { const u = (s + hl) / len, f = 0.5 + 0.3 * Math.sin(s * 0.0031 + seed) + 0.2 * Math.sin(s * 0.0089 + seed * 2.1), base = (h + peak * (1 - Math.abs(s) / hl)) * (fall[0] + (fall[1] - fall[0]) * u);
    return Math.max(co * 2, Math.round((base * (1 - ruin * f)) / co) * co); }; };
export const wallTop = ruinTop;
const inHole = (holes, s, z) => holes.some((H) => { const sp = holeSpan(H, z); return sp && s > sp[0] && s < sp[1]; });
// the wall's blocks course by course ([a, b] spans along it), each standing on the course under it or on a square cut
// that something stands in (a pier, colonnettes): nothing hangs where the openings and the breaks took what held it
const wallRows = (o) => { const { len, holes = [], bl = 70, co = 35 } = o, top = ruinTop(o), hl = len / 2, rows = []; let sup = null;
  for (let k = 0; k < 400; k++) { const z = k * co, zm = z + co / 2, cuts = holes.map((H) => holeSpan(H, zm)).filter(Boolean).sort((a, b) => a[0] - b[0]), solid = [], row = []; let p = -hl;
    for (const [a, b] of cuts) { if (a > p) solid.push([p, Math.min(a, hl)]); p = Math.max(p, b); } if (p < hl) solid.push([p, hl]);
    for (const [i0, i1] of solid) for (let s0 = -hl - (k % 2 ? bl / 2 : 0); s0 < i1; s0 += bl) { const a = Math.max(i0, s0), b = Math.min(i1, s0 + bl); if (b - a < 6 || z >= top((a + b) / 2)) continue; if (sup && !sup.some(([c, d]) => Math.min(b, d) - Math.max(a, c) > 8)) continue; row.push([a, b]); }
    rows.push(row); sup = row.concat(holes.filter((H) => H.k === 'q' && zm > H.z0 && zm < H.z1).map((H) => [H.s - H.w / 2, H.s + H.w / 2])); if (!sup.length) break; }
  return rows; };
const covers = (rows, k, s, m = 0) => k >= 0 && k < rows.length && rows[k].some(([a, b]) => s > a - m && s < b + m);
export function ruinWall(o) {
  const { len, h, t = 70, seed = 1, holes = [], butt = [], bl = 70, co = 35, cope = false, str = [] } = o;
  // pal: another stone ({ stone: [4 colours], stoneD, soot, lichen }), for walls that are not the abbey's
  return ['abwall4|' + JSON.stringify([len, h, t, seed, o.ruin || 0, o.peak || 0, o.fall || 0, holes, butt, bl, co, cope, str]) + (o.pal ? '|' + JSON.stringify(o.pal) : ''), shapeF((G) => {
    const PL = o.pal || AB, S = PL.stone, top = ruinTop(o), hl = len / 2, rows = wallRows(o);
    rows.forEach((row, k) => { const z = k * co; for (const [a, b] of row) { const m = (a + b) / 2, j = k * 7 + Math.round(m / bl) + 900, c = k === 0 ? PL.stoneD : (j * 5) % 23 === 0 ? PL.soot : (j * 3) % 17 === 0 ? PL.lichen : S[j % 4];
      G.box(m, 0, z + co / 2, (b - a) / 2 - 0.6, t / 2 + (k === 0 ? 5 : 0), co / 2 - 0.5, c); } });
    if (cope) for (let s0 = -hl; s0 < hl - 10; s0 += bl) { const m = Math.min(hl - bl / 2, s0 + bl / 2), z = top(m); if (z >= h - 1 && covers(rows, z / co - 1, m - bl / 2 + 8) && covers(rows, z / co - 1, m + bl / 2 - 8)) G.box(m, 0, z + 6, bl / 2 - 0.6, t / 2 + 6, 6, PL.stoneD); }
    for (const zs of str) { const k = Math.floor(zs / co); for (let s0 = -hl; s0 < hl - 10; s0 += bl) { const m = Math.min(hl - bl / 2, s0 + bl / 2); if ([m - bl / 2 + 6, m, m + bl / 2 - 6].every((x) => covers(rows, k, x) && covers(rows, k - 1, x) && covers(rows, k + 1, x))) G.box(m, 0, zs + 9, bl / 2 - 0.6, t / 2 + 6, 9, PL.stoneD); } }
    // the arches: voussoirs round each opening's head, standing a little proud of the wall, wherever the wall still
    // stands round them
    for (const H of holes) { if (H.k === 'q' || H.k === 'v') continue; const a = H.w / 2, ring = 34, n = H.k === 'r' ? 9 : 5;
      const vous = (c, rr, ang, i) => { const s = c + Math.cos(ang) * rr, z = H.z1 + Math.sin(ang) * rr, k = Math.floor(z / co); if (z + ring / 2 > top(s) || !covers(rows, k, s, 6) || !covers(rows, k + 1, s, 20)) return; const b = G.n, L = H.k === 'r' ? (Math.PI * rr) / n : (rr * Math.PI) / 3 / n; G.box(0, 0, 0, L / 2 - 0.8, t / 2 + 2, ring / 2, S[(i + 400) % 4]); G.place(b, { x: s, z, pitch: 90 - deg(ang) }); };
      if (H.k === 'r') for (let i = 0; i < n; i++) vous(H.s, a + ring / 2, ((i + 0.5) / n) * Math.PI, i);
      else for (const sd of [-1, 1]) for (let i = 0; i < n; i++) { const t0 = ((i + 0.5) / n) * (Math.PI / 3); vous(H.s - sd * a, H.w + ring / 2, sd > 0 ? t0 : Math.PI - t0, i + (sd > 0 ? 1 : 2)); }
      if (H.z0 > 0 && covers(rows, Math.floor(H.z0 / co) - 1, H.s - a + 4) && covers(rows, Math.floor(H.z0 / co) - 1, H.s + a - 4)) G.box(H.s, 0, H.z0 - 5, a + 10, t / 2 + 6, 5, PL.stoneD); }
    // colonnettes in the square cuts that carry them: a base on the sill, slender shafts, a capital under the springing
    for (const H of holes) { if (H.k !== 'q' || !H.col || !covers(rows, Math.floor(H.z0 / co) - 1, H.s)) continue; const a = H.w / 2, n = H.col, c = pick4(S, Math.round(H.s));
      G.box(H.s, 0, H.z0 + 5, a - 2, t / 2 - 2, 5, PL.stoneD); G.box(H.s, 0, H.z1 - 11, a + 6, t / 2 + 4, 11, pick4(S, Math.round(H.s / 7)));
      for (let i = 0; i < n; i++) { const y = n === 1 ? 0 : (i ? 1 : -1) * t * 0.24, b = G.n; G.lathe([[Math.min(a * 0.55, 10), 0], [Math.min(a * 0.55, 10), H.z1 - H.z0 - 30]], c, 8); G.place(b, { x: H.s, y, z: H.z0 + 9 }); } }
    // buttresses: stepped piers of the same stone against the wall's faces
    for (const B of butt) { const sides = B.side ? [B.side] : [-1, 1], bw = B.w || 90, d = B.d || 90; for (const sd of sides) { const bt = Math.min(top(B.s), h);
      for (let z = 0, k = 0; z < bt; z += co, k++) { const dd = z > bt * 0.55 ? d * 0.55 : d; G.box(B.s, sd * (t / 2 + dd / 2), z + co / 2, bw / 2, dd / 2, co / 2 - 0.5, k === 0 ? PL.stoneD : S[(k + 2) % 4]); } } }
  })];
}
// The wall's bodies, in its own frame: boxes [s0, s1, z0, z1] the whole thickness through, following its blocks as they
// are drawn (round each opening, up to the ragged top, its sills and the masonry over its heads; the colonnettes in
// their cuts), and the buttresses' [s0, s1, y0, y1, z0, z1].
export function wallBodies(o) {
  const { len, h, t = 70, holes = [], butt = [], co = 35 } = o, top = ruinTop(o), hl = len / 2, runs = [], rows = wallRows(o);
  // columns between every edge of every block, so a body stops exactly where the stone does (a door is as wide on the
  // walking grid as it is to the eye)
  const cuts = new Set([-hl, hl]); for (const row of rows) for (const [a, b] of row) { cuts.add(Math.round(a * 10) / 10); cuts.add(Math.round(b * 10) / 10); }
  const edges = [...cuts].sort((a, b) => a - b);
  let act = [];
  for (let ci = 0; ci < edges.length - 1; ci++) { const s = edges[ci], e = edges[ci + 1]; if (e - s < 0.5) continue; const sc = (s + e) / 2, nk = rows.length, iv = [];
    const solid = (k) => covers(rows, k, sc) || holes.some((H) => H.k === 'q' && H.col && Math.abs(sc - H.s) < H.w / 2 && k * co + co / 2 > H.z0 && k * co + co / 2 < H.z1 && covers(rows, Math.floor(H.z0 / co) - 1, H.s));
    for (let k = 0; k < nk;) { if (!solid(k)) { k++; continue; } const k0 = k; while (k < nk && solid(k)) k++; iv.push([k0 * co, k * co]); }
    const next = [];
    for (const [z0, z1] of iv) { const b = act.find((B) => !B.used && B.z0 === z0 && Math.abs(B.z1 - z1) <= co && B.s1 - B.s0 < 420);
      if (b) { b.s1 = e; b.z1 = Math.max(b.z1, z1); b.used = true; next.push(b); } else { const B = { s0: s, s1: e, z0, z1, used: true }; runs.push(B); next.push(B); } }
    for (const B of next) B.used = false; act = next; }
  const bb = [];
  for (const B of butt) { const sides = B.side ? [B.side] : [-1, 1], bw = B.w || 90, d = B.d || 90, bt = Math.min(top(B.s), h), nk = Math.ceil(bt / co); let ks = nk; for (let k = 0; k < nk; k++) if (k * co > bt * 0.55) { ks = k; break; }
    for (const sd of sides) { bb.push([B.s - bw / 2, B.s + bw / 2, (sd * t) / 2, sd * (t / 2 + d), 0, ks * co]); if (ks < nk) bb.push([B.s - bw / 2, B.s + bw / 2, (sd * t) / 2, sd * (t / 2 + d * 0.55), ks * co, nk * co]); } }
  return { runs: runs.map((B) => [B.s0, B.s1, B.z0, B.z1]), butt: bb };
}

// ---- a round wall (a dovecote, a tower): rings of blocks on a circle of radius r (its middle), t thick, standing to h
// and broken toward ruin; a breach (gap: [angle of its middle, half-width at the foot in degrees, widening a unit of
// height]) open to the ground. Nest-holes (nests: rows of them) dark in its inner face.
const ringTop = (o) => { const { r, h, ruin = 0, seed = 1, co = 35 } = o; return (a) => { const s = a * r, f = 0.5 + 0.3 * Math.sin(s * 0.0031 + seed) + 0.2 * Math.sin(s * 0.0089 + seed * 2.1); return Math.max(co * 2, Math.round((h * (1 - ruin * f)) / co) * co); }; };
const ringGap = (o, a, z) => { if (!o.gap) return false; const [g0, gw, gs] = o.gap; const d = Math.abs((((a - (g0 * Math.PI) / 180) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI); return deg(d) < gw + z * gs; };
export function ringWall(o) {
  const { r, h, t = 80, seed = 1, co = 35, nests = 0 } = o;
  return ['abring|' + JSON.stringify([r, h, t, seed, o.ruin || 0, o.gap || 0, co, nests]), shapeF((G) => {
    const S = AB.stone, top = ringTop(o), n = Math.max(8, Math.round((Math.PI * 2 * r) / 70)), da = (Math.PI * 2) / n, L = (Math.PI * r) / n;
    for (let k = 0; ; k++) { const z = k * co; let any = false;
      for (let i = 0; i < n; i++) { const a = (i + (k % 2 ? 0.5 : 0)) * da; if (z >= top(a) || ringGap(o, a, z + co / 2)) continue; any = true; const b = G.n, j = k * 5 + i;
        G.box(0, 0, 0, L - 0.6 + t * 0.05, t / 2 + (k === 0 ? 5 : 0), co / 2 - 0.5, k === 0 ? AB.stoneD : (j * 5) % 23 === 0 ? AB.soot : S[j % 4]); G.place(b, { x: Math.cos(a) * r, y: Math.sin(a) * r, z: z + co / 2, yaw: deg(a) + 90 }); }
      if (!any) break; }
    // the nest-holes: dark squares set into the inner face, rows of them from above head height up
    for (let row = 0; row < nests; row++) { const z = 260 + row * 70; for (let i = 0; i < n; i += 2) { const a = (i + (row % 2)) * da; if (z + 50 > top(a) || ringGap(o, a, z)) continue; const b = G.n; G.box(0, 0, 0, 14, 1, 14, 0x1a1816); G.place(b, { x: Math.cos(a) * (r - t / 2 - 0.6), y: Math.sin(a) * (r - t / 2 - 0.6), z: z + 14, yaw: deg(a) + 90 }); } }
  })];
}
// its bodies: m chords round it, each as high as the wall stands over it, none across the breach: [x, y, len, yaw, h]
export function ringBodies(o, m = 16) {
  const top = ringTop(o), out = [], { r, t = 80, co = 35 } = o;
  for (let i = 0; i < m; i++) { const a0 = (i / m) * Math.PI * 2, a1 = ((i + 1) / m) * Math.PI * 2, am = (a0 + a1) / 2; let hh = 0; for (let k = 0; k <= 4; k++) { const a = a0 + ((a1 - a0) * k) / 4; hh = Math.max(hh, top(a)); }
    if (ringGap(o, am, co / 2) || ringGap(o, a0 + 0.02, co / 2) || ringGap(o, a1 - 0.02, co / 2)) continue;
    out.push([Math.cos(am) * r, Math.sin(am) * r, 2 * r * Math.sin(Math.PI / m) + t * 0.3, deg(am) + 90, hh]); }
  return out;
}

// ---- a clustered pier: an octagonal plinth, a moulded base, a round core with eight shafts round it (four big, four
// slight); whole (cap) it ends in a moulded capital and a square abacus at h, where its arches spring; broken it stops
// short, its shafts at their own heights
export const pierR = (r) => r * 1.36;
export function pier(h = 600, r = 60, cap = true, seed = 1) {
  h = q(h, 10); r = q(r, 2); seed = N(seed);
  return ['abpier2|' + [h, r, cap ? 1 : 0, seed % 4].join('|'), shape((G) => {
    const S = AB.stone, R = rng(seed * 31 + h), c = S[seed % 4], bz = 46, top = cap ? h - 44 : h;
    G.lathe([[r * 1.36, 0], [r * 1.36, 28]], AB.stoneD, 8);
    G.lathe([[r * 1.24, 28], [r * 1.24, 35], [r * 1.1, 41], [r * 1.1, bz]], S[(seed + 1) % 4], 12);
    G.lathe([[r, bz - 2], [r, top]], c, 12);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, big = i % 2 === 0, sr = big ? r * 0.32 : r * 0.2, d = r * (big ? 0.95 : 0.98), t2 = cap ? top : top - R() * 50 - (big ? 0 : 20);
      G.lathe([[sr, bz - 2], [sr, Math.max(bz + 20, t2)]], big ? S[(seed + 2) % 4] : S[(seed + 3) % 4], 8, [Math.cos(a) * d, Math.sin(a) * d, 0]); }
    if (cap) { G.lathe([[r * 1.12, top], [r * 1.4, top + 26], [r * 1.42, top + 26]], S[(seed + 1) % 4], 12); G.box(0, 0, h - 9, r * 1.45, r * 1.45, 9, S[(seed + 2) % 4]); }
  })];
}
// ---- the drums of a fallen pier lying where they rolled, end to end along X: n of them, r round; and its body's length
export const drumsLen = (n, r) => n * r * 1.7;
export function fallenDrums(n = 4, r = 60, seed = 1) {
  r = q(r, 2); seed = N(seed);
  return ['abdrums|' + [n, r, seed % 4].join('|'), shape((G) => {
    const S = AB.stone, R = rng(seed * 17 + n), L = r * 1.7, x0 = -(n * L) / 2;
    for (let i = 0; i < n; i++) { const b = G.n, yw = (i % 2 ? 1 : -1) * (3 + R() * 6);
      G.lathe([[r, 0], [r, L + 4]], S[(i + seed) % 4], 12);
      for (let j = 0; j < 4; j++) { const a = (j / 4) * Math.PI * 2 + Math.PI / 4; G.lathe([[r * 0.3, 0], [r * 0.3, L + 4]], S[(i + seed + 1) % 4], 8, [Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95, 0]); }
      G.place(b, { pitch: 90, yaw: yw, x: x0 + i * L, y: (R() - 0.5) * r * 0.3, z: r }); }
  })];
}
// ---- a heap of stones fallen out of the walls: blocks tumbled together on a low bank of smaller stuff; r its reach
export function rubble(r = 160, seed = 1) {
  seed = N(seed); r = q(r, 20);
  return ['abrubble3|' + [r, seed % 5].join('|'), shapeF((G) => {
    const R = rng(seed * 29 + r), S = AB.stone;
    G.blob(0, 0, -4, r * 0.78, r * 0.68, r * 0.24, (nx, ny, nz) => (nz > 0.3 ? S[1] : AB.stoneD), { nu: 10, nv: 5 });
    for (let i = 0; i < 13; i++) { const a = R() * Math.PI * 2, d = r * Math.sqrt(R()) * 0.66, sz = 13 + R() * 16, ex = Math.cos(a) * d / (r * 0.78), ey = Math.sin(a) * d / (r * 0.68), zs = r * 0.24 * Math.sqrt(Math.max(0, 1 - ex * ex - ey * ey)) - 4, b = G.n;
      G.box(0, 0, 0, sz * 1.5, sz, sz * 0.7, S[i % 4]); G.place(b, { x: Math.cos(a) * d, y: Math.sin(a) * d, z: Math.max(sz * 0.4, zs + sz * 0.15), yaw: R() * 180, pitch: (R() - 0.5) * 24, roll: (R() - 0.5) * 24 }); }
  })];
}
export const rubbleH = (r) => q(r, 20) * 0.32;

// ---- tracery in a pointed window w wide from z0 (sill) to z1 (springing): n lights (2 or 3) between mullions, each
// under its own pointed head, a ring (oculus) above them touching the window's own arch. kind 0 whole; 1 the ring gone;
// 2 broken: only the last mullion and the head of the light beside it stand. th: the wall's thickness (it is set in
// its middle). Drawn in the wall's own frame, the window's middle at s = 0.
const trLayout = (w, z1, n) => { const a = w / 2, m = 22, lw = (w - (n - 1) * m) / n, zs = z1 - 30, L = []; for (let i = 0; i < n; i++) L.push([-a + i * (lw + m), -a + i * (lw + m) + lw]);
  const mull = L.slice(0, -1).map(([, l1]) => l1 + m / 2);
  const P = zs + Math.sqrt((lw + 18) ** 2 - (lw / 2) ** 2) - 16, D = P - z1, ro = n === 3 ? (w * w - a * a - D * D) / (2 * (D + w)) : 0;   // the ring sits down on the middle light's head (two lights: none, Y-tracery)
  return { a, m, lw, zs, L, mull, ro, zc: P + ro }; };
export function tracery(w = 520, z0 = 800, z1 = 1200, th = 120, kind = 0, n = 3) {
  return ['abtrac|' + [w, z0, z1, th, kind, n].join('|'), shape((G) => {
    const S = AB.stone, { m, zs, L, mull, ro, zc } = trLayout(w, z1, n), d = th * 0.22;
    const keepM = mull.map((_, i) => kind !== 2 || i === mull.length - 1), keepA = L.map((_, i) => kind !== 2 || i === L.length - 1);
    mull.forEach((x, i) => { if (keepM[i]) G.box(x, 0, (z0 + zs) / 2, m / 2, d, (zs - z0) / 2, S[i % 4]); });
    L.forEach(([l0, l1], i) => { if (!keepA[i]) return; const sp = l1 - l0, rr = sp + 9;
      for (const sd of [-1, 1]) for (let j = 0; j < 3; j++) { const ang = ((j + 0.5) / 3) * (Math.PI / 3), c = sd > 0 ? l0 : l1, s = c + sd * Math.cos(ang) * rr, z = zs + Math.sin(ang) * rr, b = G.n;
        G.box(0, 0, 0, (rr * Math.PI) / 9 / 2 + 0.6, d, 9, S[(i + j) % 4]); G.place(b, { x: s, z, pitch: 90 - deg(sd > 0 ? ang : Math.PI - ang) }); } });
    if (kind === 0 && ro > 30) { const b = G.n; G.lathe([[ro, -d], [ro, d], [ro - 16, d], [ro - 16, -d], [ro, -d]], S[2], 20, [0, 0, 0], [1, 1], true); G.place(b, { z: zc, roll: 90 }); }
  })];
}
// the tracery's bodies (its mullions; the rest stands in the window's head, out of reach): [s, w, d, z0, h]
export function traceryBodies(w, z0, z1, th, kind = 0, n = 3) { const { m, zs, mull } = trLayout(w, z1, n); return mull.filter((_, i) => kind !== 2 || i === mull.length - 1).map((x) => [x, m, th * 0.44, z0, zs - z0]); }

// ---- a tomb chest in the church's floor, an old monk carved lying on its lid: his head on a cushion, his pointed hood
// past it, his beard down his chest and his hands folded on it, his feet; on some a little dog lies at his feet
export function tombChest(seed = 1) {
  seed = N(seed);
  return ['abtomb2|' + (seed % 4), shape((G) => {
    const S = AB.stone, c = S[seed % 4], e = S[(seed + 2) % 4], f = S[(seed + 3) % 4];
    G.box(0, 0, 4, 120, 56, 4, AB.stoneD); G.box(0, 0, 41, 110, 46, 33, c); G.box(0, 0, 77, 116, 52, 3, S[(seed + 1) % 4]);
    for (let i = -2; i <= 2; i++) for (const sy of [-1, 1]) G.box(i * 40, sy * 46.5, 41, 14, 0.8, 23, dark(c, 0.84));
    for (const sx of [-1, 1]) G.box(sx * 110.5, 0, 41, 0.8, 30, 23, dark(c, 0.84));
    G.box(-88, 0, 86, 20, 30, 6, e);
    G.blob(4, 0, 92, 66, 26, 12, e, { nu: 12, nv: 6 });
    G.blob(-80, 0, 100, 13, 13, 12, f, { nu: 8, nv: 6 });
    G.blob(-60, 0, 101, 17, 14, 7, f, { nu: 8, nv: 5 });
    G.blob(-30, 0, 104, 9, 12, 5, f, { nu: 8, nv: 5 });
    G.tube([[-84, 0, 104], [-100, 0, 107], [-124, 0, 110]], (t) => 15 * (1 - t) + 0.6, e, { S: 8, M: 6 });
    for (const sy of [-1, 1]) G.blob(64, sy * 10, 89, 7, 6, 9, e, { nu: 6, nv: 4 });
    if (seed % 2 === 0) { G.blob(96, 0, 88, 13, 9, 8, S[0], { nu: 8, nv: 5 }); G.blob(103, 7, 96, 6, 6, 6, S[0], { nu: 6, nv: 4 }); }
  })];
}
// ---- a dead tree: a grey trunk and bare limbs, the twigs gone; the Rot's withering. h its height.
export function deadTree(h = 900, seed = 1) {
  seed = N(seed); h = q(h, 50);
  return ['abdead|' + [h, seed % 5].join('|'), shape((G) => {
    const R = rng(seed * 53 + h), tr = h * 0.045, lean = (R() - 0.5) * h * 0.08;
    G.tube([[0, 0, -20], [lean * 0.3, 0, h * 0.3], [lean, lean * 0.4, h * 0.62]], (t) => tr * (1.45 - 0.75 * t), AB.bark, { S: 8, M: 8 });
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + R(), z0 = h * (0.4 + R() * 0.2), L = h * (0.25 + R() * 0.15), up = 0.5 + R() * 0.6, p0 = [lean * (z0 / (h * 0.62)) * 0.9, lean * 0.3, z0], p1 = [p0[0] + Math.cos(a) * L * 0.6, p0[1] + Math.sin(a) * L * 0.6, z0 + L * up * 0.6], p2 = [p0[0] + Math.cos(a + 0.3) * L, p0[1] + Math.sin(a + 0.3) * L, z0 + L * up];
      G.tube([p0, p1, p2], (t) => tr * 0.5 * (1 - t * 0.75) + 0.6, i % 2 ? AB.bark : AB.barkD, { S: 6, M: 6 });
      for (let k = 0; k < 2; k++) { const b2 = a + (k ? 0.7 : -0.7), p3 = [p1[0] + Math.cos(b2) * L * 0.35, p1[1] + Math.sin(b2) * L * 0.35, p1[2] + L * 0.3]; G.tube([p1, [(p1[0] + p3[0]) / 2, (p1[1] + p3[1]) / 2, (p1[2] + p3[2]) / 2 + 6], p3], (t) => tr * 0.22 * (1 - t * 0.8) + 0.4, AB.barkD, { S: 4, M: 4 }); } }
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + R(), L = tr * (1.6 + R()); G.tube([[Math.cos(a) * tr * 0.5, Math.sin(a) * tr * 0.5, h * 0.06], [Math.cos(a) * L * 0.7, Math.sin(a) * L * 0.7, tr * 0.2], [Math.cos(a) * L, Math.sin(a) * L, -tr * 0.4]], (t) => tr * 0.45 * (1 - t * 0.5), AB.barkD, { S: 6, M: 5 }); }
  })];
}
export const deadTrunk = (h) => q(h, 50) * 0.045 * 1.4;
// ---- a tall standing cross in the burial ground: a shaft on stepped plinths, its head ringed
export function stoneCross(h = 420) {
  h = q(h, 20);
  return ['abcross2|' + h, shapeF((G) => {
    const S = AB.stone; G.box(0, 0, 14, 70, 70, 14, AB.stoneD); G.box(0, 0, 40, 50, 50, 12, S[1]); G.box(0, 0, (52 + h) / 2, 14, 18, (h - 52) / 2, S[0]);
    G.box(0, 0, h - 60, 14, 70, 15, S[0]); G.box(0, 0, h + 4, 14, 18, 18, S[2]);
    const b = G.n; G.lathe([[48, -10], [48, 10], [37, 10], [37, -10], [48, -10]], S[3], 16, [0, 0, 0], [1, 1], true); G.place(b, { z: h - 60, pitch: 90 });
  })];
}
// ---- a fishpond's kerb: dressed stones round a long pond w by d, a step up from the grass (the water is the map's)
export function pondKerb(w = 1200, d = 600) {
  w = q(w, 20); d = q(d, 20);
  return ['abpond2|' + [w, d].join('|'), shapeF((G) => {
    const S = AB.stone, hw = w / 2, hd = d / 2, k = 40;
    for (const sy of [-1, 1]) for (let x = -hw; x < hw - 1; x += 80) { const e = Math.min(hw, x + 80); G.box((x + e) / 2, sy * (hd + k / 2), 9, (e - x) / 2 - 0.5, k / 2, 9, pick4(S, Math.round(x / 80) + (sy > 0 ? 1 : 2))); }
    for (const sx of [-1, 1]) for (let y = -hd - k; y < hd + k - 1; y += 80) { const e = Math.min(hd + k, y + 80); G.box(sx * (hw + k / 2), (y + e) / 2, 9, k / 2, (e - y) / 2 - 0.5, 9, pick4(S, Math.round(y / 80) + (sx > 0 ? 3 : 0))); }
  })];
}
// ---- the tower's bell, fallen and lying on its side on its lip and its shoulder, gone green; its clapper inside
export function bell(r = 70) {
  r = q(r, 5);
  return ['abbell2|' + r, shape((G) => {
    const B = AB.bronze, V = AB.verd, P = [[r, 0], [r * 1.02, r * 0.08], [r * 0.86, r * 0.3], [r * 0.7, r * 0.62], [r * 0.62, r * 0.94], [r * 0.6, r * 1.0], [r * 0.3, r * 1.1], [0, r * 1.12]], b = G.n;
    G.lathe(P, (k) => (k < 1 ? V : B), 18, [0, 0, 0], [1, 1], true);
    G.lathe([[0, r * 0.96]].concat(P.slice(0, 6).map(([x, z]) => [x * 0.86, z * 0.96]).reverse()), dark(B, 0.6), 18, [0, 0, 0], [1, 1], true);
    G.lathe([[r * 0.86, 0], [r, 0]], V, 18, [0, 0, 0], [1, 1], true);
    G.box(0, 0, r * 1.12 + 9, r * 0.1, r * 0.28, 10, B);
    G.tube([[0, 0, r * 0.96 - 1], [0, 0, r * 0.4]], r * 0.05, AB.iron, { S: 6, M: 4, caps: 'flat' }); G.blob(0, 0, r * 0.32, r * 0.11, r * 0.11, r * 0.11, AB.iron, { nu: 8, nv: 5 });
    const ph = -Math.atan(0.42 / 0.92); G.place(b, { pitch: 90 - deg(ph), z: -(0.08 * r * Math.sin(ph) - 1.02 * r * Math.cos(ph)) });
  })];
}
// ---- a roof timber the fire brought down: a squared beam charred black and cracked across, embers in some cracks;
// lying along X (tilt 0) or leaning up at tilt degrees from its foot at x = 0. L long, w square.
export function charBeam(L = 600, w = 40, seed = 1, tilt = 0) {
  L = q(L, 20); w = q(w, 2); seed = N(seed); tilt = q(tilt, 1);
  return ['abbeam|' + [L, w, seed % 4, tilt].join('|'), shapeF((G) => {
    const R = rng(seed * 41 + L), h = w * 0.9, x0 = tilt ? 0 : -L / 2, b = G.n;
    G.box(x0 + L / 2, 0, h / 2, L / 2 - 14, w / 2, h / 2, AB.char);
    for (const sd of [-1, 1]) { const ex = x0 + (sd < 0 ? 0 : L), lo = R() * 0.4; G.box(ex - sd * 14 * (0.5 + lo), 0, h * (0.5 - lo * 0.4), 14 * (0.5 + lo), w * 0.42, h * (0.5 - lo * 0.4), AB.charL); }
    for (let x = x0 + 30; x < x0 + L - 30; x += 26 + R() * 22) { const ember = R() < 0.16; G.box(x, 0, h + 0.4, 2.2, w / 2 - 2, 0.8, ember ? AB.ember : AB.charL); if (R() < 0.5) G.box(x, w / 2 + 0.4, h * 0.5, 2, 0.8, h * 0.4, ember ? AB.ember : AB.charL); }
    if (tilt) G.place(b, { pitch: -tilt });
  })];
}
// ---- the cloister's well: a round head of stone, black water low in it, the charred posts of its windlass on the rim
// and the roller between them
export function well(r = 70) {
  r = q(r, 5);
  return ['abwell|' + r, shapeF((G) => {
    const S = AB.stone, n = 14, h = 76, t = 26;
    for (let k = 0; k < 2; k++) for (let i = 0; i < n; i++) { const a = ((i + (k ? 0.5 : 0)) / n) * Math.PI * 2, b = G.n; G.box(0, 0, 0, (Math.PI * (r + t / 2)) / n - 0.5, t / 2, h / 4 - 0.5, k === 0 ? AB.stoneD : S[i % 4]); G.place(b, { x: Math.cos(a) * (r + t / 2), y: Math.sin(a) * (r + t / 2), z: (k * h) / 2 + h / 4, yaw: deg(a) + 90 }); }
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, b = G.n; G.box(0, 0, 0, (Math.PI * (r + t / 2)) / n + 0.5, t / 2 + 4, 5, S[(i + 2) % 4]); G.place(b, { x: Math.cos(a) * (r + t / 2), y: Math.sin(a) * (r + t / 2), z: h + 5, yaw: deg(a) + 90 }); }
    G.lathe([[r + 2, 20], [0, 20]], 0x14161a, 14);
    for (const sy of [-1, 1]) G.box(0, sy * (r + t / 2), h + 10 + 70, 8, 8, 70, AB.char);
    const b = G.n; G.lathe([[9, -(r + t / 2) - 8], [9, r + t / 2 + 8]], AB.charL, 8); G.place(b, { z: h + 10 + 118, roll: 90 });
  })];
}
// ---- a raised bed in the monks' physic garden: a kerb of small stones, dark soil, the herbs in it dead on their stalks
export function herbBed(w = 320, d = 180, seed = 1) {
  w = q(w, 20); d = q(d, 20); seed = N(seed);
  return ['abherb|' + [w, d, seed % 4].join('|'), shape((G) => {
    const S = AB.stone, R = rng(seed * 13 + w), kh = 36, kt = 22;
    for (const sy of [-1, 1]) for (let x = -w / 2; x < w / 2 - 1; x += 46) { const e = Math.min(w / 2, x + 46); G.box((x + e) / 2, sy * (d / 2 - kt / 2), kh / 2, (e - x) / 2 - 0.6, kt / 2, kh / 2, pick4(S, Math.round(x / 46) + sy)); }
    for (const sx of [-1, 1]) for (let y = -d / 2 + kt; y < d / 2 - kt - 1; y += 46) { const e = Math.min(d / 2 - kt, y + 46); G.box(sx * (w / 2 - kt / 2), (y + e) / 2, kh / 2, kt / 2, (e - y) / 2 - 0.6, kh / 2, pick4(S, Math.round(y / 46) + sx + 2)); }
    G.box(0, 0, kh / 2 - 3, w / 2 - kt, d / 2 - kt, kh / 2 - 3, AB.soil);
    for (let x = -w / 2 + kt + 24; x < w / 2 - kt - 10; x += 44) for (let y = -d / 2 + kt + 24; y < d / 2 - kt - 10; y += 46) { if (R() < 0.18) continue; const cx = x + (R() - 0.5) * 12, cy = y + (R() - 0.5) * 12, hh = 26 + R() * 34, c = AB.herb[Math.floor(R() * 3)];
      for (let s = 0; s < 6; s++) { const a = (s / 6) * Math.PI * 2 + R(), lean = 0.2 + R() * 0.35, tip = [cx + Math.cos(a) * hh * lean, cy + Math.sin(a) * hh * lean, kh - 4 + hh];
        G.tube([[cx, cy, kh - 8], [cx + Math.cos(a) * hh * lean * 0.4, cy + Math.sin(a) * hh * lean * 0.4, kh - 4 + hh * 0.55], tip], (t) => 1.6 * (1 - t * 0.6) + 0.3, c, { S: 4, M: 4 });
        if (s % 2 === 0) G.blob(tip[0], tip[1], tip[2], 3.2, 3.2, 4, dark(c, 0.8), { nu: 5, nv: 3 }); } }
  })];
}
// ---- a monk's grave: a weathered wooden cross at the head of a low mound (lean: degrees it has gone over); burnt ones
// charred black
export function graveCross(h = 130, seed = 1, lean = 0) {
  h = q(h, 10); seed = N(seed); lean = q(lean, 2);
  return ['abgrave2|' + [h, seed % 4, lean].join('|'), shape((G) => {
    const burnt = seed % 4 === 3, c = burnt ? AB.char : seed % 2 ? AB.wood : AB.woodD;
    G.blob(14, 0, -12, 82, 30, 26, seed % 2 ? 0x5a5040 : 0x625846, { nu: 12, nv: 6 });
    const b = G.n; G.box(0, 0, (h - 16) / 2, 6, 5, (h + 16) / 2, c); G.box(0, 0, h * 0.72, 4.5, 30, 5, c);
    if (!burnt) G.box(0, 0, h * 0.72, 5.2, 8, 6, dark(c, 0.8));
    G.place(b, { x: -62, z: -8, pitch: lean * 0.6, roll: lean });
  })];
}
// ---- the high altar: a stone table on two steps, a broken candlestick fallen on it
export function highAltar() {
  return ['abaltar2', shapeF((G) => {
    const S = AB.stone;
    G.box(0, 0, 10, 160, 120, 10, AB.stoneD); G.box(-10, 0, 30, 130, 96, 10, S[1]);
    G.box(-20, 0, 72, 46, 86, 32, S[0]); G.box(-20, 0, 109, 54, 100, 5, S[2]);
    const b = G.n; G.lathe([[5, 0], [4, 3], [2.4, 26], [5.5, 29], [6.5, 32]], 0x6a5a3a, 8); G.place(b, { x: -20, y: 30, z: 120.2, pitch: 90, yaw: 30 });
  })];
}
// ---- the statue of the abbey's founder: an old gnome in his habit on a plinth, broad in the shoulder, his long beard
// down his chest and his big nose, a book held to him in one hand and his staff in the other; whole (kind 0) with his
// pointed hood, or the hood broken off at its brim and lying at the plinth's foot (kind 1)
export function founder(kind = 0) {
  return ['abfounder2|' + kind, shape((G) => {
    const S = AB.stone, s0 = S[0], s1 = S[1], s2 = S[2], s3 = S[3], P = 110;
    G.box(0, 0, 10, 72, 72, 10, AB.stoneD); G.box(0, 0, 60, 58, 58, 40, s1); G.box(0, 0, 104, 66, 66, 6, AB.stoneD);
    G.lathe([[54, P], [52, P + 10], [47, P + 60], [41, P + 108], [35, P + 140], [30, P + 152]], s2, 16);
    G.blob(0, 0, P + 148, 32, 38, 15, s2, { nu: 14, nv: 8 });
    for (const sd of [-1, 1]) G.tube([[0, sd * 31, P + 148], [10, sd * 36, P + 124], [26, sd * (sd < 0 ? 14 : 34), P + (sd < 0 ? 118 : 122)]], (t) => 11 - t * 3, s2, { S: 8, M: 8 });
    G.box(31, -10, P + 116, 6, 17, 13, AB.stoneD);
    G.blob(4, 0, P + 176, 20, 19, 21, s0, { nu: 12, nv: 8 }); G.blob(23, 0, P + 174, 8, 7, 8, s0, { nu: 8, nv: 5 });
    G.tube([[16, 0, P + 168], [24, 0, P + 148], [27, 0, P + 126]], (t) => 15 * (1 - t) + 4, s3, { S: 10, M: 8 });
    G.tube([[22, 36, P + 2], [22, 37, P + 120], [22, 38, P + 238]], 4.5, AB.woodD, { S: 6, M: 6 });
    if (kind === 0) G.lathe([[23, 0], [15, 30], [6, 58], [0, 74]], s2, 12, [2, 0, P + 190]);
    else { G.lathe([[23, 0], [21, 5], [16, 9]], s2, 12, [2, 0, P + 190]); const b = G.n; G.lathe([[23, 0], [15, 30], [6, 58], [0, 74]], s2, 12); G.place(b, { x: 96, y: -40, z: 22, pitch: 90 + 17, yaw: 40 }); }
  })];
}
// ---- the gate's portcullis, jammed half up: an iron grid w wide (its side bars in the jambs' grooves), h of it showing,
// its points along the foot
export function portcullis(w = 440, h = 420) {
  w = q(w, 10); h = q(h, 10);
  return ['abportc|' + [w, h].join('|'), shapeF((G) => {
    const C = [AB.iron, AB.rust];
    for (let x = -w / 2 + 6; x <= w / 2 - 5; x += 48) { G.box(x, 0, h / 2 + 8, 5, 5, h / 2 - 8, C[Math.round(x / 48) & 1]); const b = G.n; G.lathe([[6, 0], [0, 16]], AB.rust, 4); G.place(b, { x, z: 16, pitch: 180 }); }
    for (let z = 30; z < h; z += 64) G.box(0, 0, z, w / 2, 6, 5, AB.iron);
  })];
}
// ---- a floor of flagstones laid in rows (top faces only, at z), some lifted and gone so the earth shows; w by d. gone:
// how many are missing (0..1); soot: blackened toward its +X end
export function flags(w = 1200, d = 800, seed = 1, gone = 0.1, soot = 0, z = 2.2) {
  w = q(w, 10); d = q(d, 10); seed = N(seed);
  return ['abflags|' + [w, d, seed % 9, q(gone, 0.05), q(soot, 0.1), z].join('|'), () => {
    const pos = [], col = [], idx = [], C = new THREE.Color(), R = rng(seed * 7 + w + d), S = AB.stone.map((c) => dark(c, 0.92));
    const quad = (x0, y0, x1, y1, c) => { const k = pos.length / 3; pos.push(x0, y0, z, x1, y0, z, x1, y1, z, x0, y1, z); C.setHex(c, THREE.NoColorSpace); for (let i = 0; i < 4; i++) col.push(C.r, C.g, C.b); idx.push(k, k + 1, k + 2, k, k + 2, k + 3); };
    for (let y = -d / 2; y < d / 2 - 1;) { const rh = Math.min(d / 2 - y, 90 + Math.floor(R() * 3) * 20); let x = -w / 2;
      while (x < w / 2 - 1) { const L = Math.min(w / 2 - x, 80 + Math.floor(R() * 5) * 20); if (R() > gone) { const u = (x + w / 2) / w, sootK = soot * Math.max(0, u * 1.4 - 0.3); quad(x + 2, y + 2, x + L - 2, y + rh - 2, R() < sootK ? AB.soot : S[Math.floor(R() * 4)]); } x += L; }
      y += rh; }
    return { pos, col, idx }; }];
}
// ---- a sundial on a short column in the garden: its plate and its gnomon
export function sundial() {
  return ['absundial', shapeF((G) => {
    const S = AB.stone; G.box(0, 0, 8, 34, 34, 8, AB.stoneD); G.lathe([[16, 16], [13, 30], [12, 94], [17, 100], [17, 106]], S[1], 10);
    G.box(0, 0, 108, 26, 26, 2, 0x8a7a50); const b = G.n; G.box(0, 0, 0, 14, 1.2, 8, 0x6a5a3a); G.place(b, { x: 2, z: 117, pitch: -30 });
  })];
}
// ---- a low clump of dry dead grass, under shin height
export function deadTuft(s = 1, seed = 1) {
  s = q(s, 0.1); seed = N(seed);
  return ['abtuft|' + [s, seed % 4].join('|'), shape((G) => {
    const R = rng(seed * 7 + 3), C = [0x8a7e62, 0x7a7058, 0x968a6c, 0x6e6450];
    for (let i = 0; i < 9; i++) { const a = R() * Math.PI * 2, L = (22 + R() * 12) * s, lean = 0.25 + R() * 0.4, c = C[i % 4];
      G.tube([[Math.cos(a) * 3, Math.sin(a) * 3, -2], [Math.cos(a) * L * lean * 0.5, Math.sin(a) * L * lean * 0.5, L * 0.6], [Math.cos(a) * L * lean, Math.sin(a) * L * lean, L * 0.95]], (t) => 2.2 * (1 - t * 0.85) + 0.2, c, { S: 3, M: 3 }); }
  })];
}
// ---- a stone bench along the foot of a wall (the chapter house's seats): blocks len long, 50 deep, 40 high
export function ledge(len = 600) {
  len = q(len, 10);
  return ['abledge|' + len, shapeF((G) => { const S = AB.stone; for (let x = -len / 2, i = 0; x < len / 2 - 1; x += 70, i++) { const e = Math.min(len / 2, x + 70); G.box((x + e) / 2, 0, 20, (e - x) / 2 - 0.6, 25, 20, S[i % 4]); } })];
}
// ---- an abbot's grave slab let into the floor, a cross cut in relief along it
export function graveSlab(seed = 1) {
  seed = N(seed);
  return ['abslab|' + (seed % 3), shapeF((G) => { const S = AB.stone, c = S[(seed + 1) % 4]; G.box(0, 0, 1.5, 88, 36, 1.5, c); G.box(4, 0, 3.6, 62, 4, 0.6, dark(c, 0.8)); G.box(-36, 0, 3.6, 4, 20, 0.6, dark(c, 0.8)); })];
}
// ---- an infirmary bed burnt to its frame: charred posts and rails, a few slats left across it (under shin height)
export function cot(seed = 1) {
  seed = N(seed);
  return ['abcot|' + (seed % 3), shapeF((G) => { const R = rng(seed * 11 + 5);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.box(sx * 92, sy * 40, 17, 5, 5, 17, AB.char);
    for (const sy of [-1, 1]) G.box(0, sy * 40, 24, 92, 4, 5, AB.charL);
    for (const sx of [-1, 1]) G.box(sx * 92, 0, 24, 4, 40, 5, AB.charL);
    for (let x = -76; x <= 76; x += 19) if (R() > 0.45) G.box(x, 0, 30.5, 6, 40, 1.5, R() < 0.2 ? AB.ember : AB.char); })];
}
