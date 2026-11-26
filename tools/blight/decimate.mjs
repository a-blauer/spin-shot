// Mesh simplification by quadric error (Garland & Heckbert), the way a sculpt is taken from millions of polygons down to
// a game model: every vertex carries the sum of the squared distances to the planes of the faces round it, and the edge
// that changes the shape least is collapsed first, again and again, until the budget is met. Flat parts lose triangles,
// curved and detailed parts keep them. Collapses go to one of the two ends (a half-edge collapse), so every surviving
// vertex keeps its own paint exactly; an edge whose two ends are painted differently costs more, so the borders between
// paints (an eye, a wart, the gills) stay where they are. A collapse that would fold a triangle over is refused.

class Heap {
  constructor() { this.k = []; this.v = []; }
  push(key, val) { const k = this.k, v = this.v; let i = k.length; k.push(key); v.push(val); while (i > 0) { const p = (i - 1) >> 1; if (k[p] <= key) break; k[i] = k[p]; v[i] = v[p]; i = p; } k[i] = key; v[i] = val; }
  pop() { const k = this.k, v = this.v, top = v[0], lk = k.pop(), lv = v.pop(); const n = k.length; if (n) { let i = 0; for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && k[c + 1] < k[c]) c++; if (k[c] >= lk) break; k[i] = k[c]; v[i] = v[c]; i = c; } k[i] = lk; v[i] = lv; } return top; }
  get size() { return this.k.length; }
}

// M: { pos Float32Array, nor Int8Array, rgb, w Uint8Array, ao Uint8Array, idx Array } -> same shape, fewer triangles
export function decimate(M, targetTris, { paintW = 60, border = 70 } = {}) {
  const BORDER = border;
  const pos = M.pos, N = pos.length / 3, idx = Int32Array.from(M.idx), F = idx.length / 3;
  if (F <= targetTris) return M;
  const Q = new Float64Array(N * 10), faces = Array.from({ length: N }, () => []), alive = new Uint8Array(F).fill(1), gone = new Uint8Array(N), ver = new Int32Array(N);
  const plane = (f) => { const a = idx[f * 3], b = idx[f * 3 + 1], c = idx[f * 3 + 2]; const ux = pos[b * 3] - pos[a * 3], uy = pos[b * 3 + 1] - pos[a * 3 + 1], uz = pos[b * 3 + 2] - pos[a * 3 + 2], vx = pos[c * 3] - pos[a * 3], vy = pos[c * 3 + 1] - pos[a * 3 + 1], vz = pos[c * 3 + 2] - pos[a * 3 + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const area = Math.hypot(nx, ny, nz); if (area < 1e-12) return null; nx /= area; ny /= area; nz /= area; return [nx, ny, nz, -(nx * pos[a * 3] + ny * pos[a * 3 + 1] + nz * pos[a * 3 + 2]), area * 0.5]; };
  for (let f = 0; f < F; f++) {
    for (let e = 0; e < 3; e++) faces[idx[f * 3 + e]].push(f);
    const pl = plane(f); if (!pl) continue; const [a, b, c, d, w] = pl, q = [a * a, a * b, a * c, a * d, b * b, b * c, b * d, c * c, c * d, d * d];
    for (let e = 0; e < 3; e++) { const v = idx[f * 3 + e]; for (let k = 0; k < 10; k++) Q[v * 10 + k] += q[k] * w; }
  }
  const err = (v, x, y, z) => { const q = Q.subarray(v * 10, v * 10 + 10); return q[0] * x * x + 2 * q[1] * x * y + 2 * q[2] * x * z + 2 * q[3] * x + q[4] * y * y + 2 * q[5] * y * z + 2 * q[6] * y + q[7] * z * z + 2 * q[8] * z + q[9]; };
  const paintD = (a, b) => { let d = 0; for (let k = 0; k < 3; k++) d += Math.abs(M.rgb[a * 3 + k] - M.rgb[b * 3 + k]) + Math.abs(M.w[a * 3 + k] - M.w[b * 3 + k]) * 1.5; return d / 255; };
  // cost of moving a onto b
  // paint borders never bleed: an edge across a real change of paint (the glow above all) is kept exactly
  const glowEdge = (a, b) => { if (Math.abs(M.w[a * 3 + 2] - M.w[b * 3 + 2]) > 30) return true; let m = 0; for (let k = 0; k < 3; k++) m = Math.max(m, Math.abs(M.rgb[a * 3 + k] - M.rgb[b * 3 + k]), Math.abs(M.w[a * 3 + k] - M.w[b * 3 + k])); return m > BORDER; };
  const cost = (a, b) => { if (glowEdge(a, b)) return 1e30; const x = pos[b * 3], y = pos[b * 3 + 1], z = pos[b * 3 + 2]; const e = Math.max(0, err(a, x, y, z) + err(b, x, y, z)); const L2 = (pos[a * 3] - x) ** 2 + (pos[a * 3 + 1] - y) ** 2 + (pos[a * 3 + 2] - z) ** 2; return e + paintD(a, b) * paintW * L2 * 0.05 + L2 * 1e-4; };
  const heap = new Heap();
  const neigh = (v) => { const s = new Set(); for (const f of faces[v]) if (alive[f]) for (let e = 0; e < 3; e++) { const u = idx[f * 3 + e]; if (u !== v) s.add(u); } return s; };
  const queue = (v) => { for (const u of neigh(v)) { heap.push(cost(v, u), [v, u, ver[v], ver[u]]); heap.push(cost(u, v), [u, v, ver[u], ver[v]]); } };
  for (let v = 0; v < N; v++) for (const u of neigh(v)) if (u > v) { heap.push(cost(v, u), [v, u, 0, 0]); heap.push(cost(u, v), [u, v, 0, 0]); }
  let tris = F;
  const nrm = (f, sub, by) => { const g = (k) => { const v = idx[f * 3 + k]; return v === sub ? by : v; }; const a = g(0), b = g(1), c = g(2); if (a === b || b === c || a === c) return null;
    const ux = pos[b * 3] - pos[a * 3], uy = pos[b * 3 + 1] - pos[a * 3 + 1], uz = pos[b * 3 + 2] - pos[a * 3 + 2], vx = pos[c * 3] - pos[a * 3], vy = pos[c * 3 + 1] - pos[a * 3 + 1], vz = pos[c * 3 + 2] - pos[a * 3 + 2]; return [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]; };
  while (tris > targetTris && heap.size) {
    const [a, b, va, vb] = heap.pop();
    if (gone[a] || gone[b] || ver[a] !== va || ver[b] !== vb) continue;
    if (glowEdge(a, b)) continue;
    // a vertex on a glow border keeps its place (moving one onto it would drag the border)
    { let onB = false; for (const u of neigh(a)) if (glowEdge(a, u)) { onB = true; break; } if (onB) continue; }
    // the two must still share an edge, and the collapse must not fold any face round a over
    let shared = 0, bad = false;
    const nb = neigh(b);
    for (const f of faces[a]) { if (!alive[f]) continue; const has = idx[f * 3] === b || idx[f * 3 + 1] === b || idx[f * 3 + 2] === b; if (has) { shared++; continue; }
      const n0 = nrm(f, -1, -1), n1 = nrm(f, a, b); if (!n0 || !n1) { bad = true; break; } const l0 = Math.hypot(...n0), l1 = Math.hypot(...n1); if (l1 < 1e-9 || (n0[0] * n1[0] + n0[1] * n1[1] + n0[2] * n1[2]) / (l0 * l1) < 0.35) { bad = true; break; }
      // no slivers: the new triangle's shortest height must stay a fair share of its longest side
      const g = (k) => { const v = idx[f * 3 + k]; return v === a ? b : v; }, A = g(0), B = g(1), Cc = g(2), e = (u, v) => Math.hypot(pos[u * 3] - pos[v * 3], pos[u * 3 + 1] - pos[v * 3 + 1], pos[u * 3 + 2] - pos[v * 3 + 2]), lmax = Math.max(e(A, B), e(B, Cc), e(Cc, A));
      if (l1 / (lmax * lmax) < 0.1) { bad = true; break; } }
    if (bad || shared === 0 || shared > 2) continue;
    // a link condition: a and b may share only the vertices of the faces on their edge (keeps the surface a manifold)
    let common = 0; for (const u of neigh(a)) if (nb.has(u)) common++; if (common > 2) continue;
    for (const f of faces[a]) { if (!alive[f]) continue; const has = idx[f * 3] === b || idx[f * 3 + 1] === b || idx[f * 3 + 2] === b; if (has) { alive[f] = 0; tris--; continue; } for (let e = 0; e < 3; e++) if (idx[f * 3 + e] === a) idx[f * 3 + e] = b; faces[b].push(f); }
    gone[a] = 1; for (let k = 0; k < 10; k++) Q[b * 10 + k] += Q[a * 10 + k];
    faces[b] = faces[b].filter((f) => alive[f]);
    ver[b]++; for (const u of neigh(b)) ver[u]++;
    queue(b);
  }
  // compact
  const map = new Int32Array(N).fill(-1); let n = 0; const keep = [];
  for (let f = 0; f < F; f++) if (alive[f]) for (let e = 0; e < 3; e++) { const v = idx[f * 3 + e]; if (map[v] < 0) { map[v] = n++; keep.push(v); } }
  const out = { pos: new Float32Array(n * 3), nor: new Int8Array(n * 3), rgb: new Uint8Array(n * 3), w: new Uint8Array(n * 3), ao: new Uint8Array(n), idx: [], clipped: M.clipped };
  keep.forEach((v, i) => { for (let k = 0; k < 3; k++) { out.pos[i * 3 + k] = pos[v * 3 + k]; out.nor[i * 3 + k] = M.nor[v * 3 + k]; out.rgb[i * 3 + k] = M.rgb[v * 3 + k]; out.w[i * 3 + k] = M.w[v * 3 + k]; } out.ao[i] = M.ao[v]; });
  for (let f = 0; f < F; f++) if (alive[f]) out.idx.push(map[idx[f * 3]], map[idx[f * 3 + 1]], map[idx[f * 3 + 2]]);
  out.tris = out.idx.length / 3;
  return out;
}
