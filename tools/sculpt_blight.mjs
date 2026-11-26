// Bakes the Blight's creatures (tools/blight/creatures.mjs) into public/blight.json.
//   node tools/sculpt_blight.mjs            every creature
//   node tools/sculpt_blight.mjs Rotcap ... just those (the rest are kept from the last bake)
// Per part: its role, its pivot, where its box sits off the pivot (off), its size, and the mesh in the part's own frame
// (positions relative to pivot + off): Int16 positions (1/16 cm), Int8 normals, rgb, strain weights and AO as bytes.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { deflateRawSync } from 'node:zlib';
import { mesh } from './blight/kit.mjs';
import { CREATURES as OLD } from './blight/creatures.mjs';
import * as CHUNKY from './blight/chunky.mjs';
// the chunky redraws (blight/chunky.mjs) replace the first sculpts creature by creature; OLD=1 bakes the first ones
const CREATURES = process.env.OLD ? OLD : { ...OLD, ...Object.fromEntries(Object.entries(CHUNKY).filter(([, v]) => v && v.parts)) };
import { decimate } from './blight/decimate.mjs';
const BUDGET = { Head: +(process.env.HB || 6500), Body: 4500, ArmFront: 1500, ArmBack: 1500, LegFront: 1400, LegBack: 1400, Tail: 1200, WingFront: 900, WingBack: 900 };

const DIR = process.env.OUTDIR ? new URL('file://' + process.env.OUTDIR.replace(/\/?$/, '/')) : new URL('../public/', import.meta.url);
const OUT = new URL('blight.json', DIR);
// A stylised bake for comparison (env): LP scales every budget down (a low-poly look, broad flat faces); SP smooths the
// paint over the surface that many times first, so speckle and mottling merge into broad areas of one tone (the glow is
// left as it is).
const LP = +(process.env.LP || 1), SP = +(process.env.SP || 0);
function smoothPaint(M, n) {
  const N = M.pos.length / 3, nb = Array.from({ length: N }, () => []);
  for (let i = 0; i < M.idx.length; i += 3) for (let a = 0; a < 3; a++) { const u = M.idx[i + a], v = M.idx[i + (a + 1) % 3]; nb[u].push(v); nb[v].push(u); }
  for (let it = 0; it < n; it++) { const rgb = Float32Array.from(M.rgb), w = Float32Array.from(M.w);
    for (let v = 0; v < N; v++) { const L = nb[v]; if (!L.length) continue; const acc = [0, 0, 0, 0, 0];
      for (const u of L) { for (let a = 0; a < 3; a++) acc[a] += rgb[u * 3 + a]; acc[3] += w[u * 3]; acc[4] += w[u * 3 + 1]; }
      for (let a = 0; a < 3; a++) M.rgb[v * 3 + a] = Math.round(rgb[v * 3 + a] * 0.4 + acc[a] / L.length * 0.6);
      M.w[v * 3] = Math.round(w[v * 3] * 0.4 + acc[3] / L.length * 0.6); M.w[v * 3 + 1] = Math.round(w[v * 3 + 1] * 0.4 + acc[4] / L.length * 0.6); } }
}
const old = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { v: 1, creatures: {} };
const want = process.argv.slice(2), names = want.length ? want : Object.keys(CREATURES);
const Q = 16;
for (const name of names) {
  const K = CREATURES[name]; if (!K) { console.log('no creature', name); continue; }
  const t0 = Date.now(), parts = [];
  for (const pt of K.parts) {
    const M0 = mesh(pt.f, pt.lo, pt.hi, pt.h * (pt.role === 'Head' ? Math.sqrt(+(process.env.HS || 1)) : +(process.env.HS || 1)), pt.ao || 1); if (SP) smoothPaint(M0, SP); const M = decimate(M0, Math.round((pt.tris || BUDGET[pt.role] || 1500) * (K.budget || 1) * +(process.env.BS || 0.8) * LP), LP < 1 ? { border: 200 } : undefined);
    if (M0.clipped) { const P0 = M0.pos, lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (let q = 0; q < P0.length; q++) { lo[q % 3] = Math.min(lo[q % 3], P0[q]); hi[q % 3] = Math.max(hi[q % 3], P0[q]); } console.log(`  ! ${name}.${pt.role} touches its box (${M0.clipped} cells): mesh ${lo.map(Math.round)} .. ${hi.map(Math.round)}`); }
    const N = M.pos.length / 3; let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (let q = 0; q < N; q++) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], M.pos[q * 3 + a]); mx[a] = Math.max(mx[a], M.pos[q * 3 + a]); }
    // renumber the vertices in the order the triangles first use them (neighbours end up near each other), so the deltas
    // below are small and the bytes pack down
    { const map = new Int32Array(N).fill(-1), ord = []; for (const v of M.idx) if (map[v] < 0) { map[v] = ord.length; ord.push(v); }
      const re = (A, k) => { const B = new A.constructor(ord.length * k); ord.forEach((v, i) => { for (let a = 0; a < k; a++) B[i * k + a] = A[v * k + a]; }); return B; };
      M.pos = re(M.pos, 3); M.nor = re(M.nor, 3); M.rgb = re(M.rgb, 3); M.w = re(M.w, 3); M.ao = re(M.ao, 1); M.idx = M.idx.map((v) => map[v]); }
    const pv = pt.pivot, off = [(mn[0] + mx[0]) / 2 - pv[0], (mn[1] + mx[1]) / 2 - pv[1]];
    const pos = new Int16Array(N * 3);
    for (let q = 0; q < N; q++) { pos[q * 3] = Math.round((M.pos[q * 3] - pv[0] - off[0]) * Q); pos[q * 3 + 1] = Math.round((M.pos[q * 3 + 1] - pv[1] - off[1]) * Q); pos[q * 3 + 2] = Math.round((M.pos[q * 3 + 2] - (pv[2] || 0)) * Q); }
    // positions and indices as differences from the one before (wrapping), which deflate packs far better
    for (let q = N - 1; q > 0; q--) for (let a = 0; a < 3; a++) pos[q * 3 + a] = pos[q * 3 + a] - pos[(q - 1) * 3 + a];
    // indices as how far back from the next new vertex they reach (a new vertex is 0): small numbers, mostly repeats
    const idx = N < 65536 ? new Uint16Array(M.idx.length) : new Uint32Array(M.idx.length); { let hw = 0; for (let i = 0; i < M.idx.length; i++) { const v = M.idx[i]; if (v === hw) { idx[i] = 0; hw++; } else idx[i] = hw - v; } }
    // normals folded onto an octahedron: two bytes instead of three
    const oct = new Int8Array(N * 2); for (let q = 0; q < N; q++) { let x = M.nor[q * 3] / 127, y = M.nor[q * 3 + 1] / 127, z = M.nor[q * 3 + 2] / 127; const l = Math.abs(x) + Math.abs(y) + Math.abs(z) || 1; x /= l; y /= l; z /= l; if (z < 0) { const ox = x; x = (1 - Math.abs(y)) * Math.sign(ox || 1); y = (1 - Math.abs(ox)) * Math.sign(y || 1); } oct[q * 2] = Math.round(x * 127); oct[q * 2 + 1] = Math.round(y * 127); }
    const pad = (b) => { const r = b.length % 4; return r ? Buffer.concat([b, Buffer.alloc(4 - r)]) : b; };
    const bufs = [Buffer.from(pos.buffer), Buffer.from(oct.buffer), Buffer.from(M.rgb.buffer), Buffer.from(M.w.buffer), Buffer.from(M.ao.buffer), Buffer.from(idx.buffer)].map(pad);
    // eyes drawn by the game as their own meshes (blight/chunky.mjs E()): kept in the part's frame like its vertices
    const eyes = pt.eyes ? pt.eyes.map((e) => ({ at: [+(e.at[0] - pv[0] - off[0]).toFixed(2), +(e.at[1] - pv[1] - off[1]).toFixed(2), +(e.at[2] - (pv[2] || 0)).toFixed(2)], r: e.r, out: e.out, s: e.s || 1 })) : undefined;
    const loc = (v) => [+(v[0] - pv[0] - off[0]).toFixed(2), +(v[1] - pv[1] - off[1]).toFixed(2), +(v[2] - (pv[2] || 0)).toFixed(2)];
    const teeth = pt.teeth ? pt.teeth.map((t) => ({ a: loc(t.a), b: loc(t.b), r: +t.r.toFixed(2) })) : undefined;
    parts.push({ eyes, teeth, role: pt.role, pivot: [pv[0], pv[1], pv[2] || 0], off: off.map((x) => +x.toFixed(2)), size: [+(mx[0] - mn[0]).toFixed(1), +(mx[1] - mn[1]).toFixed(1)], top: +mx[1].toFixed(1), v: N, i: M.idx.length, i32: N >= 65536, z: 3, b64: deflateRawSync(Buffer.concat(bufs), { level: 9 }).toString('base64') });
    console.log(`  ${name}.${pt.role}: ${M0.tris} -> ${M.tris} tris`);
  }
  const rec = { height: K.height, beast: !!K.beast, scale: K.scale || 1, parts };
  // bosses ship in a file each (fetched when a run starts); the common roster in one file loaded up front
  if (name.startsWith('B_')) { writeFileSync(new URL(`bl_${name}.json`, DIR), JSON.stringify({ v: 1, creatures: { [name]: rec } })); delete old.creatures[name]; }
  else old.creatures[name] = rec;
  console.log(name, 'baked in', ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
writeFileSync(OUT, JSON.stringify(old));
console.log('wrote', OUT.pathname, (readFileSync(OUT).length / 1024).toFixed(0) + ' KB');
