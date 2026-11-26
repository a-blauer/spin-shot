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
    const M0 = mesh(pt.f, pt.lo, pt.hi, pt.h, pt.ao || 1), M = decimate(M0, Math.round((pt.tris || BUDGET[pt.role] || 1500) * (K.budget || 1)));
    if (M0.clipped) { const P0 = M0.pos, lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (let q = 0; q < P0.length; q++) { lo[q % 3] = Math.min(lo[q % 3], P0[q]); hi[q % 3] = Math.max(hi[q % 3], P0[q]); } console.log(`  ! ${name}.${pt.role} touches its box (${M0.clipped} cells): mesh ${lo.map(Math.round)} .. ${hi.map(Math.round)}`); }
    const N = M.pos.length / 3; let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (let q = 0; q < N; q++) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], M.pos[q * 3 + a]); mx[a] = Math.max(mx[a], M.pos[q * 3 + a]); }
    const pv = pt.pivot, off = [(mn[0] + mx[0]) / 2 - pv[0], (mn[1] + mx[1]) / 2 - pv[1]];
    const pos = new Int16Array(N * 3);
    for (let q = 0; q < N; q++) { pos[q * 3] = Math.round((M.pos[q * 3] - pv[0] - off[0]) * Q); pos[q * 3 + 1] = Math.round((M.pos[q * 3 + 1] - pv[1] - off[1]) * Q); pos[q * 3 + 2] = Math.round((M.pos[q * 3 + 2] - (pv[2] || 0)) * Q); }
    const idx = N < 65536 ? new Uint16Array(M.idx) : new Uint32Array(M.idx);
    const pad = (b) => { const r = b.length % 4; return r ? Buffer.concat([b, Buffer.alloc(4 - r)]) : b; };
    const bufs = [Buffer.from(pos.buffer), Buffer.from(M.nor.buffer), Buffer.from(M.rgb.buffer), Buffer.from(M.w.buffer), Buffer.from(M.ao.buffer), Buffer.from(idx.buffer)].map(pad);
    parts.push({ role: pt.role, pivot: [pv[0], pv[1], pv[2] || 0], off: off.map((x) => +x.toFixed(2)), size: [+(mx[0] - mn[0]).toFixed(1), +(mx[1] - mn[1]).toFixed(1)], top: +mx[1].toFixed(1), v: N, i: M.idx.length, i32: N >= 65536, z: 1, b64: deflateRawSync(Buffer.concat(bufs), { level: 9 }).toString('base64') });
    console.log(`  ${name}.${pt.role}: ${M0.tris} -> ${M.tris} tris`);
  }
  old.creatures[name] = { height: K.height, beast: !!K.beast, scale: K.scale || 1, parts };
  console.log(name, 'baked in', ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
writeFileSync(OUT, JSON.stringify(old));
console.log('wrote', OUT.pathname, (readFileSync(OUT).length / 1024).toFixed(0) + ' KB');
