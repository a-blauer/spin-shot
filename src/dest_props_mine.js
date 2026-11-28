// Sculpted pieces for the places Under the Hill (Copperdeep Mine first): rock that holds up the roof, the miners' timber
// and iron, copper and its ore, the smelter's fire. Same rules as dest_props.js: UE frame (X the front, Y right, Z up),
// [key, build] pairs, keys carry every number the shape depends on, things stand on z = 0, every piece whole.
import { shapeB as shape, shapeF, wob } from './propkit.js';
import { dark, mix } from './village_shapes.js';
import { q, rng } from './dest_props.js';

export const MC = {   // the mine's colours
  rock: [0x4e4840, 0x433e37, 0x5a5249, 0x3a352f], rockD: 0x2c2824, rockL: 0x6e665a, floor: 0x4a443c, gravel: 0x5c544a,
  timber: 0x7a5a3a, timberD: 0x5a4028, timberL: 0x8e6c48, iron: 0x2e3034, ironL: 0x5a5e64, rope: 0x9a8a62,
  copper: 0xc0703c, copperD: 0x8a4a28, verd: 0x4aa08a, ore: 0x3a8a6a, oreD: 0x245a46, oreL: 0x7ae0b8, slag: 0x2a2630, slagL: 0x564c66,
  stone: [0x8a8274, 0x7e766a, 0x948c7e], fire: 0xffa040, glass: 0xffd27a, coal: 0x1e1c1e,
};
export const MGAUGE = 64;
const MCOL = MC;
const N = (s) => Math.abs(Math.round(s)) || 0;

// ---- a pillar of the hill's own rock, left standing to hold the roof: rough all over, flared at its foot and where it
// meets the roof, scree at its foot. h: floor to roof (it runs 60 past both).
export function cavePillar(r = 300, h = 2000, seed = 1, pal = null) {   // pal: another rock ({ rock: [4], rockD, rockL })
  seed = N(seed); r = q(r, 20); h = q(h, 50); const MC = pal || MCOL;
  return ['mpillar2|' + [r, h, seed % 4].join('|') + (pal ? '|' + pal.rockD : ''), shapeF((G) => {
    const R = rng(seed * 37 + r), ph = [R() * 6, R() * 6, R() * 6, R() * 6], nV = Math.max(10, Math.round(h / 120));
    const prof = (z) => (z < 140 ? 1 + 0.3 * (1 - z / 140) ** 2 : z > h - 520 ? 0.94 + 0.6 * ((z - h + 520) / 520) ** 2 : 0.94 + 0.04 * Math.sin(z * 0.004 + ph[3]));
    G.surf((u, v) => { const a = u * Math.PI * 2, z = -40 + v * (h + 100), led = Math.max(0, Math.sin(v * 9 + ph[2])) ** 6 * 0.08, k = prof(Math.max(0, z)) * (1 + led + 0.12 * Math.sin(a * 3 + ph[0] + v * 4) + 0.07 * Math.sin(a * 5 + ph[1] - v * 9)); return [Math.cos(a) * r * k, Math.sin(a) * r * k, z]; }, 0, 1, 9, 0, 1, Math.max(6, Math.round(h / 260)),
      (u, v) => { const n = Math.sin(u * 41 + v * 23 + ph[3]) + Math.sin(u * 13 - v * 37 + ph[0]); return v < 0.05 ? MC.rockD : n > 1.15 ? MC.rockL : n < -1.2 ? MC.rock[3] : MC.rock[(Math.floor(u * 8) + Math.floor(v * 12)) % 3]; }, true);
  })];
}
// ---- a narrow-gauge tramway for the ore tubs: timber sleepers on a strip of grit, light rails. Along X.
export function mineTrack(len = 800, seed = 1) {
  seed = N(seed); len = q(len, 20);
  return ['mtrack|' + [len, seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 5 + len), hl = len / 2, hw = MGAUGE / 2;
    G.box(0, 0, 0.8, hl, hw + 38, 0.8, MC.gravel);
    for (let x = -hl + 20; x < hl - 8; x += 40) G.box(x + (R() - 0.5) * 5, (R() - 0.5) * 6, 2.6, 7, hw + 22, 1.8, R() > 0.35 ? MC.timberD : dark(MC.timberD, 0.8));
    for (const s of [-1, 1]) { G.box(0, s * hw, 4.9, hl, 2.4, 0.5, MC.iron); G.box(0, s * hw, 6.6, hl, 1.2, 1.3, MC.ironL); G.box(0, s * hw, 8.2, hl, 2, 0.4, mix(MC.ironL, 0xffffff, 0.2)); }
  })];
}
export const MRAIL = 8.6;   // what runs on the tramway stands at this height
// ---- an ore tub: a riveted iron box wider at the top, on four small wheels (their tread at z = 0: stand it on MRAIL),
// coupling hooks at each end; load 0 empty, 1 heaped with ore (copper-green through it), 2 heaped with rock
export function oreTub(load = 1, seed = 1) {
  seed = N(seed);
  return ['mtub|' + [load, seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 13 + load), body = [0x4a3a30, 0x3e3a36, 0x54402e][seed % 3], z0 = 26, z1 = 92, hb = 56, ht = 64, wb = 34, wt = 44;
    for (const x of [-38, 38]) { for (const s of [-1, 1]) { const b = G.n; G.lathe([[0, -3], [15, -3], [16, -1], [16, 1], [15, 3], [0, 3]], MC.iron, 10, [0, 0, 0]); G.place(b, { x, y: s * (MGAUGE / 2 + 2), z: 16, roll: 90 }); } G.tube([[x, -MGAUGE / 2 - 6, 16], [x, MGAUGE / 2 + 6, 16]], 2.6, MC.ironL, { S: 6, M: 2 }); }
    for (const s of [-1, 1]) G.box(0, s * 24, 21, 50, 3, 5, MC.iron);
    for (const sx of [-1, 1]) G.surf((u, v) => { const z = z0 + v * (z1 - z0); return [sx * (hb + (ht - hb) * v), (u - 0.5) * 2 * (wb + (wt - wb) * v), z]; }, 0, 1, 2, 0, 1, 2, dark(body, 0.9));
    for (const sy of [-1, 1]) G.surf((u, v) => { const z = z0 + v * (z1 - z0); return [(u - 0.5) * 2 * (hb + (ht - hb) * v), sy * (wb + (wt - wb) * v), z]; }, 0, 1, 2, 0, 1, 2, body);
    G.box(0, 0, z0 + 1.5, hb, wb, 1.5, dark(body, 0.8));
    for (const sy of [-1, 1]) for (let i = -2; i <= 2; i++) G.box(i * 24, sy * (wb + (wt - wb) * 0.5 + 0.6), (z0 + z1) / 2, 1.5, 0.8, (z1 - z0) / 2 - 2, dark(body, 0.75));
    for (const sx of [-1, 1]) G.box(sx * (ht + 2), 0, z1 - 2, 2.5, wt + 3, 2.5, MC.iron);
    for (const sx of [-1, 1]) { G.box(sx * (hb + 6), 0, 34, 8, 4, 4, MC.iron); G.tube([[sx * (hb + 12), 0, 34], [sx * (hb + 18), 0, 30]], 2, MC.iron, { S: 5, M: 2 }); }
    if (load) G.blob(0, 0, z1 - 6, ht - 8, wt - 6, 22, (nx, ny, nz) => { const n = wob(nx * 9 + seed, ny * 9 - nz * 5); return load === 1 && n > 0.45 ? MC.ore : n > 0.7 ? MC.rockL : MC.rock[Math.floor((n + 1) * 2) % 3]; }, { nu: 12, nv: 6, warp: (x, y, z) => [x, y, Math.max(z, -6)] });
  })];
}
// ---- an adit: a timbered tunnel mouth driven into an outcrop of rock. The rock (w wide, d deep, h tall), the dark
// of the tunnel going in, the timber set (two legs, the cap, lagging boards over it), the tramway running in.
// Its face is at x = d/2 (+X); the back of the rock at x = -d/2.
export function adit(w = 900, d = 600, h = 760, seed = 1, ow = 150, oh = 250) {
  seed = N(seed); w = q(w, 20); d = q(d, 20); h = q(h, 20); ow = q(ow, 10); oh = q(oh, 10);
  return ['madit2|' + [w, d, h, seed % 3, ow, oh].join('|'), shapeF((G) => {
    const R = rng(seed * 23 + w), hw = w / 2, hd = d / 2;
    G.blob(-hd * 0.06, 0, h * 0.34, hd, hw, h * 0.7, (nx, ny, nz) => { const n = Math.sin(nx * 7 + ny * 5 + seed) + Math.sin(ny * 11 - nz * 7) + Math.sin(nz * 23 + ny * 3); return n > 1.5 ? MC.rockL : n < -1.6 ? MC.rockD : MC.rock[Math.floor((n + 3) * 1.4) % 4]; }, { e: 5, nu: 14, nv: 9, warp: (x, y, z) => [x + Math.sin(y * 0.02 + z * 0.015 + seed) * 18 + Math.sin(y * 0.007 - z * 0.004) * 30 + Math.sin(y * 0.053 + z * 0.041) * 14 + Math.sin(z * 0.012 + y * 0.002) * 36, y + Math.sin(z * 0.021 + x * 0.03) * 16, Math.max(z, -h * 0.34 - 20)] });   // (warp works in the blob's own frame: its foot is at -h * 0.34)
    const xF = hd - hd * 0.06 + 4;
    G.box(xF - 64, 0, oh / 2 + 4, 76, ow + 14, oh / 2 + 8, MC.rockD); G.box(xF + 14, 0, oh / 2, 2, ow - 2, oh / 2 - 2, 0x0c0a08);   // the surround runs back into the rock however its face lies
    for (const s of [-1, 1]) { G.box(xF + 12, s * (ow + 6), oh / 2 + 4, 12, 12, oh / 2 + 4, MC.timber); G.box(xF + 12, s * (ow + 6), 6, 16, 16, 6, MC.timberD); }
    G.box(xF + 12, 0, oh + 18, 14, ow + 30, 12, MC.timber); for (let y = -ow; y <= ow; y += 26) G.box(xF - 4, y, oh + 34, 22, 11, 4, Math.round(y / 26) % 2 ? MC.timberD : MC.timber);
    for (const s of [-1, 1]) G.box(xF + 12, s * (ow + 6), oh * 0.62, 13, 13, 3, MC.timberD);
    G.box(xF + 14, 0, oh + 40, 2, 40, 12, MC.timberL);
  })];
}
// ---- the lift's headframe: four timber legs leaning in to a head at LIFT.top, braced at every stage and crossed on three
// faces, the sheave wheel on its bearers at the head, the guides down the middle, the cage at the bottom with its gate
// open, the rope from the cage's crosshead up over the sheave and on up the shaft. The open face (the cage's gate) +X.
export const LIFT = { top: 1460, base: 230, head: 150 };
export function liftHead() {
  return ['mlift', shape((G) => {
    const { top, base, head } = LIFT, at = (k, t) => base + (head - base) * t, stages = 5;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.tube([[sx * base, sy * base, -10], [sx * head, sy * head, top + 10]], 13, MC.timber, { S: 6, M: 4 });
    for (let i = 1; i <= stages; i++) { const t = i / (stages + 0.4), z = t * top, e = at(0, t); for (const s of [-1, 1]) { G.box(0, s * e, z, e + 10, 9, 9, MC.timberD); G.box(s * e, 0, z, 9, e + 10, 9, MC.timberD); } }
    for (let i = 0; i < stages; i++) { const t0 = i / (stages + 0.4), t1 = (i + 1) / (stages + 0.4), z0 = t0 * top, z1 = t1 * top, e0 = at(0, t0), e1 = at(0, t1);
      for (const s of [-1, 1]) { G.tube([[-e0, s * e0, z0], [e1, s * e1, z1]], 4, MC.timberD, { S: 5, M: 3 }); G.tube([[e0, s * e0, z0], [-e1, s * e1, z1]], 4, MC.timberD, { S: 5, M: 3 }); }
      G.tube([[-e0, -e0, z0], [-e1, e1, z1]], 4, MC.timberD, { S: 5, M: 3 }); G.tube([[-e0, e0, z0], [-e1, -e1, z1]], 4, MC.timberD, { S: 5, M: 3 }); }
    G.box(0, 0, top + 18, head + 30, head + 30, 8, MC.timberD);
    for (const s of [-1, 1]) G.box(0, s * 40, top + 60, head, 10, 34, MC.timber);
    { const b = G.n; G.lathe([[100, -6], [112, -6], [112, 6], [100, 6], [100, -6]], MC.iron, 24, [0, 0, 0], [1, 1], true); G.place(b, { z: top + 160, roll: 90 }); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI; G.tube([[Math.cos(a) * 102, 0, top + 160 + Math.sin(a) * 102], [-Math.cos(a) * 102, 0, top + 160 - Math.sin(a) * 102]], 3, MC.iron, { S: 5, M: 2 }); } G.tube([[0, -44, top + 160], [0, 44, top + 160]], 8, MC.ironL, { S: 8, M: 2 }); for (const s of [-1, 1]) G.box(0, s * 40, top + 120, 14, 8, 40, MC.timberD); }
    for (const s of [-1, 1]) G.box(0, s * 92, top / 2, 6, 6, top / 2, MC.timberL);
    for (const s of [-1, 1]) for (let i = 1; i < 6; i++) G.box(0, s * (92 - 8), (i / 6) * top, 4, 10, 4, MC.timberD);
    { const z0 = 6, z1 = 236, hw = 80; G.box(0, 0, 3, hw + 4, hw + 4, 3, MC.iron); G.box(0, 0, z1, hw + 4, hw + 4, 4, MC.iron);
      for (const [sx, sy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) G.box(sx * hw, sy * hw, (z0 + z1) / 2, 3, 3, (z1 - z0) / 2, MC.iron);
      for (const s of [-1, 1]) { for (let x = -hw + 16; x < hw; x += 16) G.box(x, s * hw, (z0 + z1) / 2, 0.8, 0.8, (z1 - z0) / 2, MC.iron); for (const z of [60, 130, 200]) G.box(0, s * hw, z, hw, 1, 1, MC.iron); }
      for (let y = -hw + 16; y < hw; y += 16) G.box(-hw, y, (z0 + z1) / 2, 0.8, 0.8, (z1 - z0) / 2, MC.iron); for (const z of [60, 130, 200]) G.box(-hw, 0, z, 1, hw, 1, MC.iron);
      for (const s of [-1, 1]) { const y0 = s * (hw - 2); for (let k = 0; k < 6; k++) G.box(hw + 10 + k * 16, y0, (z0 + z1) / 2 - 20, 0.8, 0.8, (z1 - z0) / 2 - 26, MC.iron); G.box(hw + 46, y0, 40, 46, 1, 1, MC.iron); G.box(hw + 46, y0, 190, 46, 1, 1, MC.iron); }
      G.box(0, 0, z1 + 24, 30, 10, 20, MC.iron); G.tube([[0, 0, z1 + 44], [0, 0, top + 160 - 104]], 2.2, MC.ironL, { S: 4, M: 6 });
      G.tube([[106, 0, top + 160], [106, 0, top + 1400]], 2.2, MC.ironL, { S: 4, M: 6 }); }
  })];
}
// ---- the smelter: a furnace of dressed stone in courses (wide at the foot, stepped in), its arched mouth at the front
// (+X) with the fire in it, a brick chimney to chimH, leather bellows behind on their frame, the tapping spout and a
// stone channel to the moulds. (The builder lights the mouth and the channel.)
export function furnace(chimH = 1600) {
  chimH = q(chimH, 50);
  return ['mfurnace|' + chimH, shape((G) => {
    const course = 34, H = 560;
    for (let z = 0, k = 0; z < H; z += course, k++) { const t = z / H, hw = 270 - 90 * t, st = MC.stone; for (let y = -hw; y < hw - 1; y += 68) for (const sx of [-1, 1]) G.box(sx * (hw - 18), y + 34 + (k % 2 ? 0 : -17), z + course / 2, 18, 33, course / 2 - 1, st[(((k + Math.round(y / 68)) % 3) + 3) % 3]);
      for (let x = -hw + 36; x < hw - 36; x += 68) for (const sy of [-1, 1]) G.box(x + 34 + (k % 2 ? -17 : 0), sy * (hw - 18), z + course / 2, 33, 18, course / 2 - 1, st[(((k + Math.round(x / 68) + 1) % 3) + 3) % 3]);
      G.box(0, 0, z + course / 2, hw - 30, hw - 30, course / 2, 0x3a3430); }
    G.box(0, 0, H + 8, 190, 190, 8, MC.stone[0]);
    // the mouth: a surround of stone built out from the battered face, the dark of the hearth, the fire in it, an arch
    const mw = 70, mh = 150, xM = 278;
    G.box(xM - 26, 0, 124, 26, mw + 40, 124, MC.stone[1]);
    G.box(xM + 1, 0, mh / 2 + 10, 1, mw, mh / 2, 0x1a0e08); G.box(xM + 2.6, 0, mh / 2 + 4, 0.6, mw - 12, mh / 2 - 14, 0xff8a30); G.box(xM + 3.4, 0, 34, 0.4, mw - 20, 18, 0xffd080);
    G.surf((u, v) => { const a = Math.PI * u, r = mw + 6 + v * 26; return [xM + 1.5, Math.cos(a) * r, mh + 10 + Math.sin(a) * r * 0.62]; }, 0, 1, 12, 0, 1, 1, MC.stone[2]);
    for (const s of [-1, 1]) G.box(xM + 1.5, s * (mw + 19), (mh + 10) / 2, 1.5, 13, (mh + 10) / 2, MC.stone[2]);
    G.lathe([[120, H + 16], [104, H + 120], [92, chimH * 0.6], [86, chimH], [96, chimH + 10], [96, chimH + 40], [0, chimH + 40]], (k) => (k > 3 ? MC.stone[0] : [0x7a3c2c, 0x6a3426, 0x84442e][k % 3]), 14);
    // the bellows: two leather bags on a timber frame behind, their nozzles into the back of the furnace, a lever over them
    for (const s of [-1, 1]) { const y = s * 70; G.surf((u, v) => { const x = -300 - u * 180, open = Math.sin(u * Math.PI) * 26 + 6; return [x, y + (v - 0.5) * 90, 150 + (v < 0.5 ? -1 : 1) * open * (1 - u * 0.4)]; }, 0, 1, 6, 0, 1, 1, 0x5a3a26);
      for (const z of [118, 182]) G.box(-390, y, z, 92, 46, 4, MC.timberD); G.tube([[-300, y, 150], [-246, y, 150]], 7, MC.iron, { S: 8, M: 2 }); }
    for (const [x, y] of [[-480, -130], [-480, 130], [-300, -130], [-300, 130]]) G.box(x, y, 60, 8, 8, 60, MC.timber); G.box(-390, 0, 112, 100, 136, 6, MC.timber);
    G.tube([[-480, 0, 210], [-300, 0, 260]], 5, MC.timberD, { S: 6, M: 2 }); G.box(-390, 0, 184, 6, 6, 66, MC.timberD);
    // the spout and the channel down to the moulds
    G.box(70, 270 - 18 + 26, 70, 30, 26, 12, MC.stone[1]); G.box(70, 360, 28, 34, 90, 28, MC.stone[2]); G.box(70, 360, 57, 22, 90, 2, 0xff9a3a);
    for (let i = 0; i < 4; i++) { const y = 470 + i * 60; G.box(70, y, 14, 40, 26, 14, MC.stone[i % 3]); G.box(70, y, 29, 28, 16, 1.5, i < 2 ? 0xffa850 : MC.copper); }
  })];
}
// ---- a heap of slag from the smelter: black glassy lumps, a sheen of purple in it
export function slagHeap(r = 160, seed = 1) {
  seed = N(seed); r = q(r, 10);
  return ['mslag2|' + [r, seed % 3].join('|'), shapeF((G) => {
    G.blob(0, 0, 0, r, r * 0.85, r * 0.45, (nx, ny, nz) => { const n = Math.sin(nx * 17 + ny * 11 + seed) + Math.sin(nx * 5 - ny * 19); return n > 1.2 ? MC.slagL : n > 0.3 ? 0x34303c : MC.slag; }, { nu: 14, nv: 6, warp: (x, y, z) => [x, y, Math.max(z, -3)] });
    const R = rng(seed * 7 + r); for (let i = 0; i < 6; i++) { const a = R() * Math.PI * 2, d = r * (0.9 + R() * 0.3), s = 10 + R() * 12; G.blob(Math.cos(a) * d, Math.sin(a) * d, s * 0.4, s, s * 0.8, s * 0.6, i % 2 ? MC.slag : MC.slagL, { nu: 6, nv: 4 }); }
  })];
}
// ---- copper ingots stacked crosswise on a pallet
export function ingotStack(layers = 4, seed = 1) {
  seed = N(seed);
  return ['mingots|' + [layers, seed % 2].join('|'), shape((G) => {
    G.box(0, 0, 5, 64, 64, 5, MC.timberD); for (const y of [-44, 0, 44]) G.box(0, y, 12, 64, 8, 2, MC.timber);
    for (let k = 0; k < layers; k++) { const z = 14 + k * 13 + 6.5; for (let i = -2; i <= 2; i++) { const c = (i + k + seed) % 3 === 0 ? MC.copperD : MC.copper; if (k % 2) G.box(i * 25, 0, z, 10, 58, 6, c); else G.box(0, i * 25, z, 58, 10, 6, c); } }
  })];
}
// ---- the stamp mill that crushed the ore: a timber frame, five iron stamps standing in the mortar box, the camshaft over
// them with its flywheel, the hopper of ore behind feeding the box. Along Y; the stamps face +X.
export function stampMill() {
  return ['mstamp', shape((G) => {
    const H = 520;
    for (const x of [-60, 60]) for (const y of [-200, 200]) { G.box(x, y, H / 2, 12, 12, H / 2, MC.timber); G.box(x, y, 6, 18, 18, 6, MC.stone[0]); }
    for (const x of [-60, 60]) { G.box(x, 0, H - 10, 12, 214, 10, MC.timberD); G.box(x, 0, 170, 12, 214, 9, MC.timberD); }
    for (const y of [-200, 200]) G.box(0, y, H - 10, 72, 12, 10, MC.timberD);
    G.box(40, 0, 50, 52, 170, 50, MC.iron); G.box(40, 0, 101, 50, 166, 1, 0x3a3634);
    for (let i = 0; i < 5; i++) { const y = -128 + i * 64; G.tube([[40, y, 96], [40, y, H - 30]], 6, MC.ironL, { S: 8, M: 3 }); G.box(40, y, 120, 20, 20, 24, MC.iron); G.box(40, y, 300 + (i % 2) * 30, 14, 14, 8, MC.iron); }
    G.tube([[60, -240, 440], [60, 262, 440]], 9, MC.iron, { S: 10, M: 3 }); for (let i = 0; i < 5; i++) G.box(48, -128 + i * 64, 440 + (i % 2 ? 12 : -12), 14, 4, 14, MC.iron);
    { const b = G.n; G.lathe([[110, -8], [128, -8], [128, 8], [110, 8], [110, -8]], MC.iron, 24, [0, 0, 0], [1, 1], true); G.place(b, { x: 60, y: 250, z: 440, roll: 90 }); for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI; G.tube([[60 + Math.cos(a) * 112, 250, 440 + Math.sin(a) * 112], [60 - Math.cos(a) * 112, 250, 440 - Math.sin(a) * 112]], 4, MC.iron, { S: 5, M: 2 }); } }
    G.surf((u, v) => [-140 - v * 80 + 40, (u - 0.5) * 300, 200 + v * 140], 0, 1, 2, 0, 1, 1, MC.timberD); for (const s of [-1, 1]) G.surf((u, v) => [-100 - u * 80, s * 150, 200 + u * 140 * v + (1 - v) * 0], 0, 1, 2, 0, 1, 1, MC.timber);
    G.blob(-150, 0, 330, 60, 130, 26, (nx, ny) => (Math.sin(nx * 9 + ny * 7) > 0.4 ? MC.ore : MC.rock[1]), { nu: 10, nv: 4 });
    for (const y of [-150, 150]) G.box(-190, y, 165, 8, 8, 165, MC.timber);
  })];
}
// ---- a timber scaffold against a working face: two rows of poles w long, ledgers and planks at each lift, braces, a
// ladder up each lift at the +Y end. Depth along X (the face side at -X), length along Y.
export function scaffold(w = 1200, h = 900, seed = 1) {
  seed = N(seed); w = q(w, 50); h = q(h, 50);
  return ['mscaffold|' + [w, h, seed % 2].join('|'), shape((G) => {
    const hw = w / 2, lifts = Math.max(2, Math.round(h / 300)), lh = h / lifts, nP = Math.max(2, Math.round(w / 300));
    for (let i = 0; i <= nP; i++) { const y = -hw + (w * i) / nP; for (const x of [-60, 60]) G.tube([[x, y, -6], [x, y, h + 80]], 6, MC.timberL, { S: 6, M: 3 }); }
    for (let k = 1; k <= lifts; k++) { const z = k * lh; for (const x of [-60, 60]) G.box(x, 0, z - 8, 7, hw + 10, 6, MC.timberD); for (let i = 0; i <= nP; i++) G.box(0, -hw + (w * i) / nP, z - 8, 70, 7, 6, MC.timberD);
      for (let y = -hw + 18; y < hw - 6; y += 34) G.box(0, y + 6, z, 66, 16, 2.5, Math.round(y / 34) % 2 ? MC.timber : MC.timberL); }
    for (let i = 0; i < nP; i++) { const y0 = -hw + (w * i) / nP, y1 = -hw + (w * (i + 1)) / nP; G.tube([[60, y0, 10], [60, y1, lh - 14]], 3, MC.timberD, { S: 5, M: 2 }); }
    for (let k = 0; k < lifts; k++) { const y = hw - 50, z0 = k * lh; for (const e of [-1, 1]) G.tube([[90 + e * 0, y + e * 20, z0], [90, y + e * 20, z0 + lh + 40]], 3, MC.timber, { S: 5, M: 2 }); for (let z = z0 + 28; z < z0 + lh + 30; z += 30) G.box(90, y, z, 2, 20, 2, MC.timberD); G.box(75, y, z0 + lh - 6, 15, 22, 2, MC.timberD); }
  })];
}
// ---- a cluster of copper ore crystals (malachite and azurite) out of a lump of rock; the builder makes them glow
export function oreCluster(r = 60, seed = 1) {
  seed = N(seed); r = q(r, 5);
  return ['mcryst2|' + [r, seed % 4].join('|'), shapeF((G) => {
    const R = rng(seed * 19 + r);
    G.blob(0, 0, r * 0.15, r * 0.9, r * 0.8, r * 0.45, MC.rock[seed % 3], { nu: 10, nv: 5 });
    for (let i = 0; i < 6; i++) { const a = R() * Math.PI * 2, d = r * R() * 0.45, L = r * (0.8 + R() * 0.9), tilt = 0.25 + R() * 0.45, tx = Math.cos(a) * tilt, ty = Math.sin(a) * tilt, w = r * (0.13 + R() * 0.08), c = [MC.ore, MC.oreL, 0x3a7aa8, MC.verd][(i + seed) % 4];
      G.tube([[Math.cos(a) * d, Math.sin(a) * d, r * 0.2], [Math.cos(a) * d + tx * L * 0.85, Math.sin(a) * d + ty * L * 0.85, r * 0.2 + L * 0.85]], (t) => (t < 0.8 ? w : w * (1 - (t - 0.8) / 0.2) + 0.3), c, { S: 6, M: 5, caps: false }); }
  })];
}
// ---- a miners' hut of planks: a pitched roof of boards, a door at the front (+X), a lit window in the +Y side, a
// stovepipe; w deep (X), d long (Y)
export function minersHut(w = 320, d = 420, seed = 1) {
  seed = N(seed); w = q(w, 20); d = q(d, 20);
  return ['mhut|' + [w, d, seed % 2].join('|'), shape((G) => {
    const hw = w / 2, hd = d / 2, H = 220, ridge = H + hw * 0.6, wood = seed % 2 ? 0x6e5a42 : 0x66543e, woodL = mix(wood, 0xffffff, 0.1);
    G.box(0, 0, 5, hw + 8, hd + 8, 5, MC.stone[1]);
    for (const sx of [-1, 1]) for (let y = -hd; y < hd - 1; y += 20) G.box(sx * (hw - 3), y + 10, 10 + (H - 10) / 2, 3, 9.6, (H - 10) / 2, Math.round(y / 20) % 2 ? wood : woodL);
    for (const sy of [-1, 1]) for (let x = -hw; x < hw - 1; x += 20) { const top = H + (hw - Math.abs(x + 10)) * 0.6; G.box(x + 10, sy * (hd - 3), 10 + (top - 10) / 2, 9.6, 3, (top - 10) / 2, Math.round(x / 20) % 2 ? wood : woodL); }
    G.box(0, 0, 120, hw - 6, hd - 6, 110, 0x1c1610);
    for (const sx of [-1, 1]) G.surf((u, v) => [sx * (hw + 26) * (1 - v), -hd - 24 + u * (d + 48), H - 26 * 0.6 + (ridge - H + 26 * 0.6) * v + 2], 0, 1, Math.max(4, Math.round(d / 40)), 0, 1, 6, (u, v) => (Math.floor(u * d / 40) % 2 ? 0x4a3c2e : 0x544434));
    G.box(0, 0, ridge + 4, 8, hd + 26, 5, MC.timberD);
    { const x = hw + 1.5; for (let k = -2; k < 2; k++) G.box(x, k * 18 + 9, 100, 1.5, 8.5, 92, k % 2 ? 0x5a4432 : 0x624a36); for (const z of [40, 160]) G.box(x + 2, 0, z, 1, 34, 5, 0x4a3828); G.box(x + 3, -26, 104, 1.5, 3, 6, MC.iron); }
    { const y = hd + 1.2; G.box(-20, y, 140, 30, 0.8, 24, MC.glass); for (const e of [-1, 1]) { G.box(-20, y + 1, 140 + e * 25.5, 33, 1, 2.5, MC.timberD); G.box(-20 + e * 31.5, y + 1, 140, 2.5, 1, 24, MC.timberD); } G.box(-20, y + 1, 140, 1.2, 1, 24, MC.timberD); }
    G.tube([[-hw * 0.4, hd * 0.4, ridge - 30], [-hw * 0.4, hd * 0.4, ridge + 90]], 6, MC.iron, { S: 8, M: 2 }); G.lathe([[0, 0], [12, 0], [14, 6], [0, 16]], MC.iron, 8, [-hw * 0.4, hd * 0.4, ridge + 92]);
  })];
}
// ---- a line of lanterns hung between two posts: the posts (timber), a rope sagging between them, four lanterns on it.
// The builder lights each lantern at LAMPLINE(len) positions.
export const lampLinePts = (len) => [1, 2, 3, 4].map((i) => { const t = i / 5, y = -len / 2 + len * t; return [0, y, 300 - 50 * Math.sin(t * Math.PI) - 30]; });
export function lampLine(len = 900) {
  len = q(len, 50);
  return ['mlamps|' + len, shape((G) => {
    for (const s of [-1, 1]) { G.box(0, s * len / 2, 160, 7, 7, 160, MC.timber); G.box(0, s * len / 2, 4, 14, 14, 4, MC.stone[0]); G.tube([[0, s * len / 2, 300], [0, s * (len / 2 + 60), 0]], 1.6, MC.rope, { S: 4, M: 3 }); }
    const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push([0, -len / 2 + len * t, 300 - 50 * Math.sin(t * Math.PI)]); } G.tube(pts, 1.6, MC.rope, { S: 4, M: 24 });
    for (const [x, y, z] of lampLinePts(len)) { G.tube([[x, y, z + 30], [x, y, z + 14]], 1, MC.iron, { S: 4, M: 2 }); G.box(x, y, z, 9, 9, 14, MC.glass); for (const [dx, dy] of [[-9, -9], [-9, 9], [9, -9], [9, 9]]) G.box(x + dx, y + dy, z, 1.2, 1.2, 14, MC.iron); G.box(x, y, z + 15, 11, 11, 2, MC.iron); G.box(x, y, z - 15, 10, 10, 2, MC.iron); }
  })];
}
// ---- the miners' tools in their rack: a timber rack against which three picks and two shovels lean, a bucket at its foot
export function toolRack() {
  return ['mtools', shape((G) => {
    for (const y of [-80, 80]) { G.box(0, y, 70, 6, 6, 70, MC.timber); G.box(0, y, 4, 12, 12, 4, MC.timberD); } G.box(0, 0, 130, 6, 92, 5, MC.timberD); G.box(0, 0, 40, 6, 92, 4, MC.timberD);
    for (const [y, kind] of [[-60, 0], [-30, 0], [0, 1], [30, 0], [60, 1]]) { const top = [8, y, 136], foot = [40, y * 1.05, 2]; G.tube([foot, top], 2.6, MC.timberL, { S: 5, M: 3 });
      if (kind === 0) { G.tube([[8, y - 26, 140], [8, y + 26, 140]], 3, MC.iron, { S: 5, M: 3 }); } else { G.box(42, y * 1.05, 14, 2, 11, 14, MC.ironL); } }
    G.lathe([[14, 0], [17, 30], [0, 30.5]], MC.iron, 10, [34, -110, 0]); G.lathe([[0, 26], [15, 26]], 0x2a2420, 10, [34, -110, 0]);
  })];
}
// ---- a hand winch on its frame at a working face: two A-frames, the drum with rope wound on it, a crank each side
export function handWinch() {
  return ['mwinch', shape((G) => {
    for (const y of [-70, 70]) { G.tube([[-50, y, 0], [0, y, 120]], 5, MC.timber, { S: 6, M: 2 }); G.tube([[50, y, 0], [0, y, 120]], 5, MC.timber, { S: 6, M: 2 }); G.box(0, y, 50, 40, 5, 4, MC.timberD); }
    G.tube([[0, -82, 116], [0, 82, 116]], 3.5, MC.iron, { S: 6, M: 2 }); G.tube([[0, -56, 116], [0, 56, 116]], 18, MC.timberD, { S: 10, M: 2 }); G.tube([[0, -54, 116], [0, 54, 116]], 20, MC.rope, { S: 10, M: 2 });
    for (const s of [-1, 1]) { G.tube([[0, s * 82, 116], [0, s * 82, 86]], 2.5, MC.iron, { S: 5, M: 2 }); G.tube([[0, s * 82, 86], [0, s * 96, 86]], 2.5, MC.timberD, { S: 5, M: 2 }); }
    G.tube([[0, 20, 96], [80, 30, 2]], 1.6, MC.rope, { S: 4, M: 3 });
  })];
}
