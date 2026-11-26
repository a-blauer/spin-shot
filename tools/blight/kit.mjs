// The Blight's sculpting kit (offline). The same idea as src/sdf.js -- shapes melted together as a signed distance
// field and meshed with surface nets -- but every point carries a six-number paint instead of a colour:
//   [r, g, b,  cap, flesh, glow]
// r g b is a fixed colour (bark, bone, a beetle's shell); cap, flesh and glow are how much of the STRAIN's three colours
// show there. A strain is three colours, so one sculpt is every strain: the game mixes the paint per creature. Blends
// between paints are linear, so a cap melting into a root fades properly from the strain's colour into brown.
// Ambient occlusion is kept apart (not multiplied in) so the game can light the strain colours itself.

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
// paints
export const C = (h, k = 1) => [((h >> 16) & 255) / 255 * k, ((h >> 8) & 255) / 255 * k, (h & 255) / 255 * k, 0, 0, 0];
export const CAP = (k = 1, add = 0x000000) => { const c = C(add); c[3] = k; return c; };
export const FLESH = (k = 1, add = 0x000000) => { const c = C(add); c[4] = k; return c; };
export const GLOW = (k = 1) => [0, 0, 0, 0, 0, k];
export const mixP = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);

let D, Cc, want = false;
export const wants = () => want;
export const getD = () => D;
export const setD = (d) => { D = d; };
export const getP = () => Cc;
export const setP = (c) => { Cc = c.slice(); };
export const reset = () => { D = 1e9; Cc = [0, 0, 0, 0, 0, 0]; };
// melt d (in paint c) into what is there, with a blend radius k
export function U(d, c, k = 10) {
  if (D === 1e9) { D = d; if (want) Cc = c.slice(); return; }
  const h = clamp(0.5 + 0.5 * (d - D) / k, 0, 1);
  if (want) for (let i = 0; i < 6; i++) Cc[i] = c[i] + (Cc[i] - c[i]) * h;
  D = d + (D - d) * h - k * h * (1 - h);
}
// hard union: whichever is nearer
export function H(d, c) { if (d < D) { D = d; if (want) Cc = c.slice(); } }
// carve d away softly; c paints the cut
export function S(d, k = 6, c = null) { const h = clamp(0.5 - 0.5 * (D + d) / k, 0, 1); const nd = D + (-d - D) * h + k * h * (1 - h); if (want && c && nd > D + 0.3) Cc = c.slice(); D = nd; }
// paint without changing the shape: inside d (with a soft edge e) the paint becomes c
export function P(d, c, e = 2) { if (!want) return; const t = clamp(0.5 - d / (2 * e), 0, 1); if (t > 0) for (let i = 0; i < 6; i++) Cc[i] += (c[i] - Cc[i]) * t; }
// push the surface in or out (bumps, fibres, pits)
export const bump = (a) => { D += a; };

export const len = (x, y, z) => Math.sqrt(x * x + y * y + z * z);
export const sph = (p, c, r) => len(p[0] - c[0], p[1] - c[1], p[2] - c[2]) - r;
export const ell = (p, c, r) => { const x = (p[0] - c[0]) / r[0], y = (p[1] - c[1]) / r[1], z = (p[2] - c[2]) / r[2], k0 = len(x, y, z), k1 = len(x / r[0], y / r[1], z / r[2]); return k1 < 1e-9 ? -Math.min(r[0], r[1], r[2]) : (k0 * (k0 - 1)) / k1; };
// a capsule from a to b whose radius runs from ra to rb
export function cap(p, a, b, ra, rb = ra) {
  const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2], px = p[0] - a[0], py = p[1] - a[1], pz = p[2] - a[2];
  const t = clamp((px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz || 1), 0, 1);
  return len(px - bx * t, py - by * t, pz - bz * t) - (ra + (rb - ra) * t);
}
// where along a-b the point projects (0..1), for paint that runs along a limb
export function along(p, a, b) { const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2]; return clamp(((p[0] - a[0]) * bx + (p[1] - a[1]) * by + (p[2] - a[2]) * bz) / (bx * bx + by * by + bz * bz || 1), 0, 1); }
// a smooth chain of capsules through points, radius r0 -> r1
export function chain(p, pts, r0, r1, c, k = 4) { for (let i = 0; i < pts.length - 1; i++) { const t0 = i / (pts.length - 1), t1 = (i + 1) / (pts.length - 1); U(cap(p, pts[i], pts[i + 1], r0 + (r1 - r0) * t0, r0 + (r1 - r0) * t1), c, k); } }
export function chainD(p, pts, r0, r1) { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) { const t0 = i / (pts.length - 1), t1 = (i + 1) / (pts.length - 1); d = Math.min(d, cap(p, pts[i], pts[i + 1], r0 + (r1 - r0) * t0, r0 + (r1 - r0) * t1)); } return d; }
// a torus round the y axis at c (major R, minor r)
export const torus = (p, c, R, r) => len(len(p[0] - c[0], 0, p[2] - c[2]) - R, p[1] - c[1], 0) - r;
// a vertical cylinder with rounded edges, centre c, radius r, half height h
export function cyl(p, c, r, h, rr = 2) { const dx = len(p[0] - c[0], 0, p[2] - c[2]) - r + rr, dy = Math.abs(p[1] - c[1]) - h + rr; return Math.min(Math.max(dx, dy), 0) + len(Math.max(dx, 0), Math.max(dy, 0), 0) - rr; }
// a rounded box
export function box(p, c, b, r = 2) { const q = [Math.abs(p[0] - c[0]) - b[0] + r, Math.abs(p[1] - c[1]) - b[1] + r, Math.abs(p[2] - c[2]) - b[2] + r]; return len(Math.max(q[0], 0), Math.max(q[1], 0), Math.max(q[2], 0)) + Math.min(Math.max(q[0], q[1], q[2]), 0) - r; }
// half spaces
export const above = (p, y) => y - p[1];   // < 0 above y
export const below = (p, y) => p[1] - y;   // < 0 below y
// rotate a point about an axis through c (for limbs and shelves that lean)
export function rotY(p, c, a) { const s = Math.sin(a), co = Math.cos(a), x = p[0] - c[0], z = p[2] - c[2]; return [c[0] + x * co - z * s, p[1], c[2] + x * s + z * co]; }
export function rotX(p, c, a) { const s = Math.sin(a), co = Math.cos(a), y = p[1] - c[1], z = p[2] - c[2]; return [p[0], c[1] + y * co - z * s, c[2] + y * s + z * co]; }
export function rotZ(p, c, a) { const s = Math.sin(a), co = Math.cos(a), x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * co - y * s, c[1] + x * s + y * co, p[2]]; }

// noise
export const hash = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
export function noise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi, s = (t) => t * t * (3 - 2 * t), u = s(xf), v = s(yf), w = s(zf);
  const L = (a, b, t) => a + (b - a) * t, n = (i, j, k) => hash(xi + i, yi + j, zi + k);
  return L(L(L(n(0, 0, 0), n(1, 0, 0), u), L(n(0, 1, 0), n(1, 1, 0), u), v), L(L(n(0, 0, 1), n(1, 0, 1), u), L(n(0, 1, 1), n(1, 1, 1), u), v), w) * 2 - 1;
}
export const fbm = (x, y, z) => noise(x, y, z) * 0.6 + noise(x * 2.1, y * 2.1, z * 2.1) * 0.28 + noise(x * 4.3, y * 4.3, z * 4.3) * 0.12;
// cellular: distance to the nearest of a jittered grid of points (for pits, warts, honeycomb)
export function cells(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z); let d1 = 9, d2 = 9;
  for (let k = -1; k <= 1; k++) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = xi + i + hash(xi + i, yi + j, zi + k), cy = yi + j + hash(xi + i + 31, yi + j, zi + k), cz = zi + k + hash(xi + i, yi + j + 57, zi + k), d = len(x - cx, y - cy, z - cz);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return [d1, d2];
}

// ---------------------------------------------------------------- surface nets
// f(p) sets the field (reset() then shape calls) and returns getD(). Returns arrays ready to ship.
export function mesh(f0, lo, hi, h, aoS = 1) {
  // anything cut off by the box is closed with a flat face just inside it (a limb's top hidden in the body stays a solid)
  const f = (p) => { const d = f0(p), e = h * 0.75, b = Math.max(lo[0] + e - p[0], p[0] - hi[0] + e, lo[1] + e - p[1], p[1] - hi[1] + e, lo[2] + e - p[2], p[2] - hi[2] + e); return b > d ? b : d; };
  const nx = Math.ceil((hi[0] - lo[0]) / h) + 1, ny = Math.ceil((hi[1] - lo[1]) / h) + 1, nz = Math.ceil((hi[2] - lo[2]) / h) + 1;
  const F = new Float32Array(nx * ny * nz), I = (i, j, k) => i + nx * (j + ny * k), Pp = [0, 0, 0];
  want = false;
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { Pp[0] = lo[0] + i * h; Pp[1] = lo[1] + j * h; Pp[2] = lo[2] + k * h; F[I(i, j, k)] = f(Pp); }
  // anything touching the box edge is clipped: say so, it means the box is too small (it is closed off all the same)
  const F0 = (i, j, k) => f0([lo[0] + i * h, lo[1] + j * h, lo[2] + k * h]); let clipped = 0; for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (const i of [0, nx - 1]) if (F0(i, j, k) < 0) clipped++;
  for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) for (const j of [0, ny - 1]) if (F0(i, j, k) < 0) clipped++;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) for (const k of [0, nz - 1]) if (F0(i, j, k) < 0) clipped++;
  const vid = new Int32Array(nx * ny * nz).fill(-1), pos = [];
  const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]], co = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const v = co.map(([a, b, c]) => F[I(i + a, j + b, k + c)]); let inn = 0; for (const x of v) if (x < 0) inn++; if (inn === 0 || inn === 8) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of E) { if ((v[a] < 0) === (v[b] < 0)) continue; const t = v[a] / (v[a] - v[b]); sx += co[a][0] + (co[b][0] - co[a][0]) * t; sy += co[a][1] + (co[b][1] - co[a][1]) * t; sz += co[a][2] + (co[b][2] - co[a][2]) * t; n++; }
    vid[I(i, j, k)] = pos.length / 3; pos.push(lo[0] + (i + sx / n) * h, lo[1] + (j + sy / n) * h, lo[2] + (k + sz / n) * h);
  }
  const idx = [], quad = (a, b, c, d, flip) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (flip) idx.push(a, d, c, a, c, b); else idx.push(a, b, c, a, c, d); };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const s = F[I(i, j, k)] < 0;
    if (s !== (F[I(i + 1, j, k)] < 0)) quad(vid[I(i, j - 1, k - 1)], vid[I(i, j, k - 1)], vid[I(i, j, k)], vid[I(i, j - 1, k)], s);
    if (s !== (F[I(i, j + 1, k)] < 0)) quad(vid[I(i - 1, j, k - 1)], vid[I(i - 1, j, k)], vid[I(i, j, k)], vid[I(i, j, k - 1)], s);
    if (s !== (F[I(i, j, k + 1)] < 0)) quad(vid[I(i - 1, j - 1, k)], vid[I(i, j - 1, k)], vid[I(i, j, k)], vid[I(i - 1, j, k)], s);
  }
  // one pass of smoothing pulls the surface-nets stairs flat without losing the forms
  const N = pos.length / 3, nb = Array.from({ length: N }, () => []);
  for (let t = 0; t < idx.length; t += 3) for (let e = 0; e < 3; e++) { const a = idx[t + e], b = idx[t + (e + 1) % 3]; nb[a].push(b); nb[b].push(a); }
  const sm = pos.slice();
  for (let q = 0; q < N; q++) { if (!nb[q].length) continue; let x = 0, y = 0, z = 0; for (const o of nb[q]) { x += pos[o * 3]; y += pos[o * 3 + 1]; z += pos[o * 3 + 2]; } const n = nb[q].length; sm[q * 3] = pos[q * 3] * 0.5 + x / n * 0.5; sm[q * 3 + 1] = pos[q * 3 + 1] * 0.5 + y / n * 0.5; sm[q * 3 + 2] = pos[q * 3 + 2] * 0.5 + z / n * 0.5; }
  // and back onto the true surface along the gradient (keeps edges and ridges crisp)
  const g = (x, y, z) => { want = false; const e = h * 0.35; const gx = f([x + e, y, z]) - f([x - e, y, z]), gy = f([x, y + e, z]) - f([x, y - e, z]), gz = f([x, y, z + e]) - f([x, y, z - e]); const l = len(gx, gy, gz) || 1; return [gx / l, gy / l, gz / l]; };
  for (let q = 0; q < N; q++) { let x = sm[q * 3], y = sm[q * 3 + 1], z = sm[q * 3 + 2]; for (let it = 0; it < 2; it++) { want = false; const d = f([x, y, z]); const n = g(x, y, z); x -= n[0] * d; y -= n[1] * d; z -= n[2] * d; } pos[q * 3] = x; pos[q * 3 + 1] = y; pos[q * 3 + 2] = z; }
  // normals from the field, paint from the material, occlusion from how buried the point is
  const nor = new Int8Array(N * 3), rgb = new Uint8Array(N * 3), w = new Uint8Array(N * 3), ao = new Uint8Array(N);
  for (let q = 0; q < N; q++) {
    const x = pos[q * 3], y = pos[q * 3 + 1], z = pos[q * 3 + 2], n = g(x, y, z);
    let occ = 0; for (const [t0, wt] of [[4, 0.4], [10, 0.3], [22, 0.22], [45, 0.14], [90, 0.08]]) { const t = t0 * aoS; want = false; occ += Math.max(0, (t - f([x + n[0] * t, y + n[1] * t, z + n[2] * t])) / t) * wt; }
    ao[q] = Math.round(clamp(1 - occ * 1.15, 0.22, 1) * 255);
    want = true; f([x, y, z]); const c = Cc;
    for (let a = 0; a < 3; a++) { nor[q * 3 + a] = Math.round(n[a] * 127); rgb[q * 3 + a] = Math.round(clamp(c[a], 0, 1) * 255); w[q * 3 + a] = Math.round(clamp(c[3 + a], 0, 1) * 255); }
  }
  want = false;
  for (let t = 0; t < idx.length; t += 3) {
    const [a, b, c] = [idx[t], idx[t + 1], idx[t + 2]];
    const u = [pos[b * 3] - pos[a * 3], pos[b * 3 + 1] - pos[a * 3 + 1], pos[b * 3 + 2] - pos[a * 3 + 2]], v = [pos[c * 3] - pos[a * 3], pos[c * 3 + 1] - pos[a * 3 + 1], pos[c * 3 + 2] - pos[a * 3 + 2]];
    const nn = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], m = [nor[a * 3] + nor[b * 3] + nor[c * 3], nor[a * 3 + 1] + nor[b * 3 + 1] + nor[c * 3 + 1], nor[a * 3 + 2] + nor[b * 3 + 2] + nor[c * 3 + 2]];
    if (nn[0] * m[0] + nn[1] * m[1] + nn[2] * m[2] < 0) { idx[t + 1] = c; idx[t + 2] = b; }
  }
  return { pos: new Float32Array(pos), nor, rgb, w, ao, idx, clipped, tris: idx.length / 3 };
}
