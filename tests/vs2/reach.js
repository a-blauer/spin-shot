// Can a gnome walk from the spawn to every station? A 40-unit grid over the village: a cell is blocked by any collision
// box that fills the body slab (top above 85: steps, ramps, decks and benches can be walked onto; nothing starting
// above 130 matters), grown by the player's radius; rotated Solids are tested in their own frame. Flood from the spawn.
(() => {
  const g = __dmh, W = g.world, V = g.villageRT, cx = V.A.c[0], cz = V.A.c[1], CELL = 40, H = 3450, N = Math.round((2 * H) / CELL), PR = 19;
  const T = window.__THREE, inv = new T.Matrix4(), p = new T.Vector3();
  const cols = (W.scanCol || []).filter((c) => c.b.max.x > cx - H - 200 && c.b.min.x < cx + H + 200 && c.b.max.z > cz - H - 200 && c.b.min.z < cz + H + 200 && c.b.max.y > 85 && c.b.min.y < 130);
  const blk = new Uint8Array(N * N);
  for (const c of cols) {
    const b = c.b, i0 = Math.max(0, Math.floor((b.min.x - PR - cx + H) / CELL)), i1 = Math.min(N - 1, Math.floor((b.max.x + PR - cx + H) / CELL)), j0 = Math.max(0, Math.floor((b.min.z - PR - cz + H) / CELL)), j1 = Math.min(N - 1, Math.floor((b.max.z + PR - cz + H) / CELL));
    let M = null, sc = null; if (c.m) { M = new T.Matrix4().fromArray(c.m); const e = M.elements; sc = [Math.hypot(e[0], e[1], e[2]), Math.hypot(e[4], e[5], e[6]), Math.hypot(e[8], e[9], e[10])]; inv.copy(M).invert(); }
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      if (M) { p.set(cx - H + (i + 0.5) * CELL, (b.min.y + b.max.y) / 2, cz - H + (j + 0.5) * CELL).applyMatrix4(inv); if (Math.abs(p.x) > 0.5 + PR / sc[0] || Math.abs(p.z) > 0.5 + PR / sc[2]) continue; }
      blk[i * N + j] = 1;
    }
  }
  const cell = (x, z) => [Math.floor((x - cx + H) / CELL), Math.floor((z - cz + H) / CELL)];
  const [si, sj] = cell(g.player.pos.x, g.player.pos.z), seen = new Uint8Array(N * N), q = [[si, sj]]; seen[si * N + sj] = 1;
  while (q.length) { const [i, j] = q.pop(); for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= N || b >= N) continue; const k = a * N + b; if (seen[k] || blk[k]) continue; seen[k] = 1; q.push([a, b]); } }
  const out = [];
  for (const I of V.uses) { const [i, j] = cell(I.pos.x, I.pos.z); let ok = false; for (let a = -2; a <= 2 && !ok; a++) for (let b = -2; b <= 2 && !ok; b++) { const ii = i + a, jj = j + b; if (ii >= 0 && jj >= 0 && ii < N && jj < N && seen[ii * N + jj]) ok = true; } out.push([I.village, Math.round(I.pos.x - cx), Math.round(I.pos.z - cz), ok ? 1 : 0]); }
  let rows = ''; for (let j = N - 1; j >= 0; j--) { let r = ''; for (let i = 0; i < N; i++) { const k = i * N + j; r += blk[k] ? '#' : seen[k] ? '.' : ' '; } rows += r + '\n'; }
  return JSON.stringify({ N, stations: out, reach: seen.reduce((a, v) => a + v, 0), map: rows });
})()
