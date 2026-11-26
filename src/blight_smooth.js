// Load-time smoothing for the sculpted Blight parts (blight.js decodeFile calls smoothPart on every part).
// The bake is decimated hard to keep the file small, which leaves lumpy faces, ragged silhouettes and hard facets.
// Here, once per part on load:
//   1. vertices that share a position (the bake splits them along paint borders) are welded into groups, so
//      smoothing and normals treat the surface as one piece and no cracks open along the paint;
//   2. Taubin smoothing (a shrink step then an inflate step, repeated) takes the lumps out without thinning the
//      limbs the way plain averaging does; the open rim of a part (where it meets the next) is held still;
//   3. the paint (colour and cap/flesh/glow weights) is blended a little with its neighbours, so colour borders
//      run as curves instead of zig-zagging along the triangles;
//   4. normals are rebuilt from the smoothed faces and shared across each group, so the light rolls round.
// It costs nothing per frame.
export const SMOOTH = { iters: 3, lambda: 0.5, mu: -0.53, paint: 0.2 };

export function smoothPart(P, idx, col, w) {
  const n = P.length / 3, S = SMOOTH;
  // 1. weld by exact position (positions are stored in 1/16 steps, so the key is exact)
  const gid = new Int32Array(n), map = new Map(); let G = 0;
  for (let i = 0; i < n; i++) { const k = ((Math.round(P[i * 3] * 16) + 32768) * 65536 + Math.round(P[i * 3 + 1] * 16) + 32768) * 65536 + Math.round(P[i * 3 + 2] * 16) + 32768; let g = map.get(k); if (g === undefined) { g = G++; map.set(k, g); } gid[i] = g; }
  const gp = new Float64Array(G * 3); for (let i = 0; i < n; i++) { const g = gid[i]; gp[g * 3] = P[i * 3]; gp[g * 3 + 1] = P[i * 3 + 1]; gp[g * 3 + 2] = P[i * 3 + 2]; }
  // edges between groups; an edge used by only one triangle lies on the open rim
  const edges = new Map(), T = idx.length / 3;
  const ek = (a, b) => (a < b ? a * G + b : b * G + a);
  for (let f = 0; f < T; f++) for (let e = 0; e < 3; e++) {
    const a = gid[idx[f * 3 + e]], b = gid[idx[f * 3 + ((e + 1) % 3)]]; if (a === b) continue;
    const k = ek(a, b); edges.set(k, (edges.get(k) || 0) + 1);
  }
  const deg = new Int32Array(G + 1); const pin = new Uint8Array(G);
  for (const [k, c] of edges) { const a = Math.floor(k / G), b = k % G; deg[a]++; deg[b]++; if (c === 1) { pin[a] = 1; pin[b] = 1; } }
  const start = new Int32Array(G + 1); for (let g = 0; g < G; g++) start[g + 1] = start[g] + deg[g];
  const nb = new Int32Array(start[G]), fill = start.slice(0, G);
  for (const k of edges.keys()) { const a = Math.floor(k / G), b = k % G; nb[fill[a]++] = b; nb[fill[b]++] = a; }
  // 2. Taubin
  const tmp = new Float64Array(G * 3);
  const step = (f) => {
    for (let g = 0; g < G; g++) {
      const s = start[g], e = start[g + 1];
      if (pin[g] || e === s) { tmp[g * 3] = gp[g * 3]; tmp[g * 3 + 1] = gp[g * 3 + 1]; tmp[g * 3 + 2] = gp[g * 3 + 2]; continue; }
      let x = 0, y = 0, z = 0; for (let j = s; j < e; j++) { const o = nb[j] * 3; x += gp[o]; y += gp[o + 1]; z += gp[o + 2]; }
      const m = 1 / (e - s);
      tmp[g * 3] = gp[g * 3] + f * (x * m - gp[g * 3]); tmp[g * 3 + 1] = gp[g * 3 + 1] + f * (y * m - gp[g * 3 + 1]); tmp[g * 3 + 2] = gp[g * 3 + 2] + f * (z * m - gp[g * 3 + 2]);
    }
    gp.set(tmp);
  };
  for (let it = 0; it < S.iters; it++) { step(S.lambda); step(S.mu); }
  for (let i = 0; i < n; i++) { const g = gid[i]; P[i * 3] = gp[g * 3]; P[i * 3 + 1] = gp[g * 3 + 1]; P[i * 3 + 2] = gp[g * 3 + 2]; }
  // 3. paint: average each group's paint, then blend every vertex part way toward its neighbours' mean
  if (S.paint > 0) {
    const ch = [[col, 3], [w, 3]];
    for (const [A] of ch) {
      const sum = new Float64Array(G * 3), cnt = new Float64Array(G);
      for (let i = 0; i < n; i++) { const g = gid[i]; sum[g * 3] += A[i * 3]; sum[g * 3 + 1] += A[i * 3 + 1]; sum[g * 3 + 2] += A[i * 3 + 2]; cnt[g]++; }
      const avg = new Float64Array(G * 3); for (let g = 0; g < G; g++) { const c = cnt[g] || 1; avg[g * 3] = sum[g * 3] / c; avg[g * 3 + 1] = sum[g * 3 + 1] / c; avg[g * 3 + 2] = sum[g * 3 + 2] / c; }
      const ring = new Float64Array(G * 3);
      for (let g = 0; g < G; g++) {
        const s = start[g], e = start[g + 1]; if (e === s) { ring[g * 3] = avg[g * 3]; ring[g * 3 + 1] = avg[g * 3 + 1]; ring[g * 3 + 2] = avg[g * 3 + 2]; continue; }
        let x = 0, y = 0, z = 0; for (let j = s; j < e; j++) { const o = nb[j] * 3; x += avg[o]; y += avg[o + 1]; z += avg[o + 2]; }
        const m = 1 / (e - s); ring[g * 3] = x * m; ring[g * 3 + 1] = y * m; ring[g * 3 + 2] = z * m;
      }
      for (let i = 0; i < n; i++) { const o = gid[i] * 3; for (let c = 0; c < 3; c++) A[i * 3 + c] = Math.round(A[i * 3 + c] + (ring[o + c] - A[i * 3 + c]) * S.paint); }
    }
  }
  // 4. normals from the smoothed faces, area weighted, shared by each group
  const gn = new Float64Array(G * 3);
  for (let f = 0; f < T; f++) {
    const a = gid[idx[f * 3]] * 3, b = gid[idx[f * 3 + 1]] * 3, c = gid[idx[f * 3 + 2]] * 3;
    const ux = gp[b] - gp[a], uy = gp[b + 1] - gp[a + 1], uz = gp[b + 2] - gp[a + 2], vx = gp[c] - gp[a], vy = gp[c + 1] - gp[a + 1], vz = gp[c + 2] - gp[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const o of [a, b, c]) { gn[o] += nx; gn[o + 1] += ny; gn[o + 2] += nz; }
  }
  const N = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const o = gid[i] * 3, l = Math.hypot(gn[o], gn[o + 1], gn[o + 2]) || 1; N[i * 3] = gn[o] / l; N[i * 3 + 1] = gn[o + 1] / l; N[i * 3 + 2] = gn[o + 2] / l; }
  return N;
}
