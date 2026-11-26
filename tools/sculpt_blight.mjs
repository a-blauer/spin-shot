// Bakes the Blight's creatures (tools/blight/creatures.mjs) into public/blight.json.
//   node tools/sculpt_blight.mjs            every creature
//   node tools/sculpt_blight.mjs Rotcap ... just those (the rest are kept from the last bake)
// Per part: its role, its pivot, where its box sits off the pivot (off), its size, and the mesh in the part's own frame
// (positions relative to pivot + off): Int16 positions (1/16 cm), Int8 normals, rgb, strain weights and AO as bytes.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { deflateRawSync } from 'node:zlib';
import { mesh } from './blight/kit.mjs';
import { CREATURES } from './blight/creatures.mjs';
import { decimate } from './blight/decimate.mjs';
const BUDGET = { Head: +(process.env.HB || 6500), Body: 4500, ArmFront: 1500, ArmBack: 1500, LegFront: 1400, LegBack: 1400, Tail: 1200, WingFront: 900, WingBack: 900 };

const OUT = new URL('../public/blight.json', import.meta.url);
const old = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { v: 1, creatures: {} };
const want = process.argv.slice(2), names = want.length ? want : Object.keys(CREATURES);
const Q = 16;
for (const name of names) {
  const K = CREATURES[name]; if (!K) { console.log('no creature', name); continue; }
  const t0 = Date.now(), parts = [];
  for (const pt of K.parts) {
    const M0 = mesh(pt.f, pt.lo, pt.hi, pt.h, pt.ao || 1), M = decimate(M0, Math.round((pt.tris || BUDGET[pt.role] || 1500) * (K.budget || 1) * +(process.env.BS || 0.8)));
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
    parts.push({ role: pt.role, pivot: [pv[0], pv[1], pv[2] || 0], off: off.map((x) => +x.toFixed(2)), size: [+(mx[0] - mn[0]).toFixed(1), +(mx[1] - mn[1]).toFixed(1)], top: +mx[1].toFixed(1), v: N, i: M.idx.length, i32: N >= 65536, z: 3, b64: deflateRawSync(Buffer.concat(bufs), { level: 9 }).toString('base64') });
    console.log(`  ${name}.${pt.role}: ${M0.tris} -> ${M.tris} tris`);
  }
  const rec = { height: K.height, beast: !!K.beast, scale: K.scale || 1, parts };
  // bosses ship in a file each (fetched when a run starts); the common roster in one file loaded up front
  if (name.startsWith('B_')) { writeFileSync(new URL(`../public/bl_${name}.json`, import.meta.url), JSON.stringify({ v: 1, creatures: { [name]: rec } })); delete old.creatures[name]; }
  else old.creatures[name] = rec;
  console.log(name, 'baked in', ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
writeFileSync(OUT, JSON.stringify(old));
console.log('wrote', OUT.pathname, (readFileSync(OUT).length / 1024).toFixed(0) + ' KB');
