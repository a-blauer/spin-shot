// Signed-distance sculpting at run time: melt rounded shapes together (U), lay hard plates on them (H), carve (S), and
// mesh the result with surface nets, colour from the nearest material and ambient occlusion baked into the vertex
// colours. The same kit tools/sculpt_king.mjs uses offline; small creatures are sculpted here when first needed.
export const C = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
let D, Cc, want = false;
export const wants = () => want;
export const setCol = (c) => { Cc = c; };
export const getCol = () => Cc;
export const getD = () => D;
export const reset = () => { D = 1e9; Cc = [0, 0, 0]; };
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
// melt d (in colour c) into what is there, with a blend radius k
export function U(d, c, k = 40) {
  if (D === 1e9) { D = d; if (want) Cc = c.slice(); return; }
  const h = clamp(0.5 + 0.5 * (d - D) / k, 0, 1);
  if (want) { Cc = [c[0] + (Cc[0] - c[0]) * h, c[1] + (Cc[1] - c[1]) * h, c[2] + (Cc[2] - c[2]) * h]; }
  D = d + (D - d) * h - k * h * (1 - h);
}
// a hard union: whichever is nearer (armour plates sit on the body with a crisp edge)
export function H(d, c) { if (d < D) { D = d; if (want) Cc = c.slice(); } }
// carve d away, softly
export function S(d, k = 30, c = null) { const h = clamp(0.5 - 0.5 * (D + d) / k, 0, 1); const nd = D + (-d - D) * h + k * h * (1 - h); if (want && c && nd > D + 0.5) Cc = c.slice(); D = nd; }
export const len = (x, y, z) => Math.sqrt(x * x + y * y + z * z);
export const sph = (p, c, r) => len(p[0] - c[0], p[1] - c[1], p[2] - c[2]) - r;
export const ell = (p, c, r) => { const x = (p[0] - c[0]) / r[0], y = (p[1] - c[1]) / r[1], z = (p[2] - c[2]) / r[2], k0 = len(x, y, z), k1 = len(x / r[0], y / r[1], z / r[2]); return k1 < 1e-9 ? -Math.min(...r) : (k0 * (k0 - 1)) / k1; };
// a capsule from a to b whose radius runs from ra to rb (a rounded cone, near enough)
export function cap(p, a, b, ra, rb = ra) {
  const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2], px = p[0] - a[0], py = p[1] - a[1], pz = p[2] - a[2];
  const t = clamp((px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz), 0, 1);
  return len(px - bx * t, py - by * t, pz - bz * t) - (ra + (rb - ra) * t);
}
export const chain = (p, pts, r0, r1, c, k) => { for (let i = 0; i < pts.length - 1; i++) { const t0 = i / (pts.length - 1), t1 = (i + 1) / (pts.length - 1); U(cap(p, pts[i], pts[i + 1], r0 + (r1 - r0) * t0, r0 + (r1 - r0) * t1), c, k); } };
export function torus(p, c, R, r, tilt = 0) { let x = p[0] - c[0], y = p[1] - c[1], z = p[2] - c[2]; const ct = Math.cos(tilt), st = Math.sin(tilt), y2 = y * ct - z * st, z2 = y * st + z * ct; return len(len(x, z2, 0) - R, y2, 0) - r; }
// value noise, for stone that is not quite smooth and veins that wander
export const hash = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
export function noise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi, s = (t) => t * t * (3 - 2 * t), u = s(xf), v = s(yf), w = s(zf);
  const L = (a, b, t) => a + (b - a) * t, n = (i, j, k) => hash(xi + i, yi + j, zi + k);
  return L(L(L(n(0, 0, 0), n(1, 0, 0), u), L(n(0, 1, 0), n(1, 1, 0), u), v), L(L(n(0, 0, 1), n(1, 0, 1), u), L(n(0, 1, 1), n(1, 1, 1), u), v), w) * 2 - 1;
}
export const fbm = (x, y, z) => noise(x, y, z) * 0.6 + noise(x * 2.1, y * 2.1, z * 2.1) * 0.28 + noise(x * 4.3, y * 4.3, z * 4.3) * 0.12;

// ---------------------------------------------------------------- surface nets
export function mesh(f, lo, hi, h, aoS = 1) {
  const nx = Math.ceil((hi[0] - lo[0]) / h) + 1, ny = Math.ceil((hi[1] - lo[1]) / h) + 1, nz = Math.ceil((hi[2] - lo[2]) / h) + 1;
  const F = new Float32Array(nx * ny * nz), I = (i, j, k) => i + nx * (j + ny * k), P = [0, 0, 0];
  want = false;
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { P[0] = lo[0] + i * h; P[1] = lo[1] + j * h; P[2] = lo[2] + k * h; F[I(i, j, k)] = f(P); }
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
  // normals from the field, colours from the material, and the occlusion baked in
  const N = pos.length / 3, nor = new Int8Array(N * 3), col = new Uint8Array(N * 3), e = h * 0.5;
  for (let q = 0; q < N; q++) {
    const x = pos[q * 3], y = pos[q * 3 + 1], z = pos[q * 3 + 2];
    want = false; let gx = f([x + e, y, z]) - f([x - e, y, z]), gy = f([x, y + e, z]) - f([x, y - e, z]), gz = f([x, y, z + e]) - f([x, y, z - e]); const gl = len(gx, gy, gz) || 1; gx /= gl; gy /= gl; gz /= gl;
    let occ = 0; for (const [t0, w] of [[25, 0.5], [60, 0.3], [130, 0.2], [260, 0.12], [480, 0.08]]) { const t = t0 * aoS; occ += Math.max(0, (t - f([x + gx * t, y + gy * t, z + gz * t])) / t) * w; }
    const ao = clamp(1 - occ * 1.1, 0.28, 1) * (0.92 + 0.08 * gy);
    want = true; f([x, y, z]); const c = Cc;
    nor[q * 3] = Math.round(gx * 127); nor[q * 3 + 1] = Math.round(gy * 127); nor[q * 3 + 2] = Math.round(gz * 127);
    const glow = (c[2] > 0.95 && c[0] > 0.65) || (c[0] > 0.95 && c[1] < 0.5 && c[2] < 0.2) ? 1 : 0;   // violet veins and red-hot eyes are not shaded
    for (let a = 0; a < 3; a++) col[q * 3 + a] = Math.round(clamp(c[a] * (glow ? 1 : ao), 0, 1) * 255);
  }
  // make sure every face looks out (one check per triangle against the field's normal)
  for (let t = 0; t < idx.length; t += 3) {
    const [a, b, c] = [idx[t], idx[t + 1], idx[t + 2]], A = pos.slice(a * 3, a * 3 + 3), B = pos.slice(b * 3, b * 3 + 3), Cp = pos.slice(c * 3, c * 3 + 3);
    const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], v = [Cp[0] - A[0], Cp[1] - A[1], Cp[2] - A[2]], n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const m = [nor[a * 3] + nor[b * 3] + nor[c * 3], nor[a * 3 + 1] + nor[b * 3 + 1] + nor[c * 3 + 1], nor[a * 3 + 2] + nor[b * 3 + 2] + nor[c * 3 + 2]];
    if (n[0] * m[0] + n[1] * m[1] + n[2] * m[2] < 0) { idx[t + 1] = c; idx[t + 2] = b; }
  }
  return { pos: new Float32Array(pos), nor, col, idx: N < 65536 ? new Uint16Array(idx) : new Uint32Array(idx) };
}

