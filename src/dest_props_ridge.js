// Ranger's Ridge's pieces: the rangers' watch tower and their hut, the hounds' kennels, the alarm bell, the hoist at the
// cliff's edge, the warning beacon burning on its pillar, the toposcope and the telescope at the viewpoint, the weather
// post; granite tors, wind-bent pines, cairns, heather and cotton grass, peat hags and bog pools; the spring's head; the
// cliff faces; the rope fence; the old ring's wall; the trail's sign.
//
// Same rules as dest_props.js: UE frame (z up), [key, build] pairs whose keys carry every number the shape depends on,
// each piece standing on z = 0 and whole. Its front is -Y unless it says otherwise. A piece with a burning part returns
// { main, glow }: draw both at the same place.
import { shapeB as shape, shapeF, wob } from './propkit.js';
import { q, rng } from './dest_props.js';
import { courses, coursesY } from './dest_props_mill.js';
import { dark } from './village_shapes.js';

export const RG = {   // the ridge's colours: granite and its lichens, moor grass, heather, peat, pine, the rangers' green
  granite: [0x9a968c, 0x8e8a80, 0xa6a296, 0x86827a], graniteD: 0x6e6a62, lichen: [0xc8c070, 0xd8d4c4, 0x9aa060],
  grass: [0x7a8a50, 0x6e7e48, 0x86945a], heather: [0x6e4a62, 0x7a5470, 0x5e4258, 0x8a6a5a], peat: 0x3e3026, peatD: 0x2a201a,
  bark: 0x8a5a3a, barkD: 0x5a3e2a, barkL: 0xb07048, needle: [0x2e4a2c, 0x34522e, 0x283e26], turf: 0x5e7a3a, turfD: 0x4a6230,
  timber: 0x7a5e40, timberD: 0x5a4430, timberL: 0x947454, iron: 0x34363a, brass: 0xc8a050, rope: 0xa8946a, bronze: 0x8a6a3a,
  slate: [0x4e5660, 0x46505a, 0x56606a], green: 0x3e5a3a, greenD: 0x2e4430, cream: 0xe0d6c0,
  fire: 0xff8a2a, fireL: 0xffd060, water: 0x3e5a62, waterD: 0x2e4450, cotton: 0xf2f0e8, moss: [0x8a8a40, 0x9a7a3a, 0x6e7a3a],
};
const N = (s) => Math.abs(Math.round(s)) || 0;
const pick = (a, i) => a[((i % a.length) + a.length) % a.length];
const deg = (r) => (r * 180) / Math.PI;
const G4 = RG.granite;
const pair = (key, draw) => ({ main: [key, shape((G) => draw(G, null))], glow: [key + '|glow', shape((P) => draw(null, P))] });

// a curved block of stone round the Z axis: angles b0..b1, radii q0..q1, heights z0..z1 (all six faces)
const arcBlock = (G, b0, b1, q0, q1, z0, z1, c) => {
  const k = G.n, m = Math.max(1, Math.ceil(((b1 - b0) * q1) / 40));
  for (let i = 0; i <= m; i++) { const a = b0 + ((b1 - b0) * i) / m, ca = Math.cos(a), sa = Math.sin(a); for (const [qq, zz] of [[q0, z0], [q1, z0], [q1, z1], [q0, z1]]) G.v(ca * qq, sa * qq, zz, c); }
  for (let i = 0; i < m; i++) { const A = k + i * 4, B = A + 4; for (let f = 0; f < 4; f++) { const f1 = (f + 1) % 4; G.idx.push(A + f, B + f, B + f1, A + f, B + f1, A + f1); } }
  const E = k + m * 4; G.idx.push(k, k + 1, k + 2, k, k + 2, k + 3, E, E + 2, E + 1, E, E + 3, E + 2);
};

// ---- the watch tower: a round tower of granite blocks, its door at the foot (-Y), slits up it, a timber gallery round
// its top on stone corbels with doors out onto it east and west (+X, -X), a slated cone of a roof over the gallery, the
// rangers' flag on its point (flying to -Y). WTW: its radius, wall top, gallery deck, roof point
export const WTW = { r: 250, e: 960, gal: 760, top: 1400 };
export function watchTower(seed = 1) {
  seed = N(seed);
  return ['rgtower4|' + (seed % 2), shapeF((G) => {
    const { r, e, gal, top } = WTW, R = rng(seed * 13 + 3), n = 28, ch = 40;
    // the openings: [angle, half-width, from z, to z]
    const holes = [[-Math.PI / 2, 52, 0, 200], [0, 44, gal, gal + 160], [Math.PI, 44, gal, gal + 160]];
    for (let k = 0, z = 0; z < e - 1; k++, z += ch) { const off = k % 2 ? Math.PI / n : 0;
      for (let i = 0; i < n; i++) { let a0 = off + (i / n) * Math.PI * 2 + 0.012, a1 = off + ((i + 1) / n) * Math.PI * 2 - 0.012; const c = pick(G4, i * 3 + k * 7 + (R() < 0.2 ? 1 : 0)), z1 = Math.min(e, z + ch) - 0.6;
        let skip = false;
        for (const [ha, hw, hz0, hz1] of holes) { if (z < hz0 || z >= hz1) continue; const d0 = ha - hw / r, d1 = ha + hw / r; let b0 = a0; while (b0 < d0 - Math.PI) b0 += Math.PI * 2; while (b0 > d0 + Math.PI) b0 -= Math.PI * 2; const b1 = b0 + (a1 - a0);
          if (b0 >= d0 && b1 <= d1) skip = true; else if (b0 < d0 && b1 > d0) a1 = a0 + (d0 - b0) - 0.004; else if (b0 < d1 && b1 > d1) a0 = a0 + (d1 - b0) + 0.004; }
        if (skip || a1 - a0 < 0.02) continue;
        arcBlock(G, a0, a1, r - ch, r + (R() - 0.5) * 3, z, z1, c); } }
    // the coping round its top
    G.lathe([[r + 2, e - 1], [r + 12, e + 6], [r + 12, e + 16], [0, e + 16]], G4[1], n);
    // the door, set back in its opening, a lintel stone over it, a step before it
    { const a = -Math.PI / 2, b = G.n; G.box(-22, 0, 100, 3, 54, 100, RG.timberD); for (let i = 0; i < 4; i++) G.box(-19, -39 + i * 26, 100, 1, 11, 96, i % 2 ? RG.green : RG.greenD);
      G.box(-17, 30, 104, 2, 4, 4, RG.iron); G.box(2, 0, 220, 4, 72, 20, G4[3]); G.box(26, 0, 6, 24, 66, 6, G4[2]); G.place(b, { x: Math.cos(a) * r, y: Math.sin(a) * r, z: 0, yaw: deg(a) }); }
    // the gallery doors: dark doorways
    for (const a of [0, Math.PI]) { const b = G.n; G.box(-30, 0, gal + 80, 3, 46, 80, 0x1c1a18); G.place(b, { x: Math.cos(a) * r, y: Math.sin(a) * r, yaw: deg(a) }); }
    // slits up it (dark, set in)
    for (const [a, z] of [[0.7, 260], [2.3, 330], [3.7, 470], [5.2, 520], [1.5, 600], [4.4, 640], [2.9, 210], [6.0, 380]]) { const b = G.n; G.box(-6, 0, 0, 8, 8, 34, 0x1a1816); G.box(1, 0, 38, 2, 14, 4, G4[2]); G.place(b, { x: Math.cos(a) * r, y: Math.sin(a) * r, z, yaw: deg(a) }); }
    // the gallery: corbels, the deck, its rail
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + Math.PI / 16, b = G.n; G.box(r + 18, 0, gal - 40, 36, 13, 30, G4[(i + 1) % 4]); G.box(r + 2, 0, gal - 86, 18, 11, 17, G4[i % 4]); G.place(b, { yaw: deg(a) }); }
    G.lathe([[r - 6, gal - 10], [r + 72, gal - 10], [r + 72, gal], [r - 6, gal], [r - 6, gal - 10]], RG.timberL, 40, [0, 0, 0], [1, 1], true);
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2 + 0.07; G.tube([[Math.cos(a) * (r + 64), Math.sin(a) * (r + 64), gal - 2], [Math.cos(a) * (r + 64), Math.sin(a) * (r + 64), gal + 96]], 3.2, RG.timberD, { S: 5 }); }
    for (const z of [gal + 46, gal + 92]) G.lathe([[r + 61, z - 2.5], [r + 67, z - 2.5], [r + 67, z + 2.5], [r + 61, z + 2.5], [r + 61, z - 2.5]], RG.timber, 40, [0, 0, 0], [1, 1], true);
    // the roof: a soffit under its eave, slates in rings up a cone; the flag on its point
    G.lathe([[r - 2, e + 12], [r + 94, e + 12], [r + 94, e + 18], [r - 2, e + 18], [r - 2, e + 12]], RG.timberD, n, [0, 0, 0], [1, 1], true);
    for (let k = 0; k < 8; k++) { const t0 = k / 8, t1 = (k + 1) / 8, R0 = (r + 96) * (1 - t0), R1 = (r + 96) * (1 - t1), z0 = e + 14 + (top - e - 14) * t0, z1 = e + 14 + (top - e - 14) * t1; G.lathe([[R0, z0], [R1, z1 + 8], [Math.max(0, R1 - 4), z1 + 8]], pick(RG.slate, k), n); }
    G.tube([[0, 0, top - 10], [0, 0, top + 230]], 3, RG.iron, { S: 5 }); G.blob(0, 0, top + 232, 6, 6, 6, RG.brass, { nu: 6, nv: 4 });
    { const P = [[0, -3, top + 222], [6, -60, top + 214], [-4, -120, top + 206], [4, -174, top + 196]]; const k = G.n; for (const [x, y, z] of P) { G.v(x, y, z, RG.green); G.v(x, y, z - 70 + (-y / 174) * 50, RG.green); }
      for (let i = 0; i < P.length - 1; i++) { const a = k + i * 2; G.idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
  })];
}
// ---- the rangers' hut: drystone walls, a turf roof gabled at the ends with its ridge along X, a stone chimney on the
// -X gable, a plank door (+ a little porch roof over it) and two small windows in the front (-Y), a bench by the door
export const RH = { w: 760, d: 500, e: 250, r: 470 };
export function rangerHut(seed = 1) {
  seed = N(seed);
  return ['rghut5|' + (seed % 2), shape((G) => {
    const { w, d, e, r } = RH, hw = w / 2, hd = d / 2, St = G4, t = 70;
    courses(G, -hw, hw, -hd + t / 2, t, 0, e, [[-60, 60, 0, 200], [-280, -180, 100, 190], [180, 280, 100, 190]], 34, 64, St, seed);
    courses(G, -hw, hw, hd - t / 2, t, 0, e, [[-50, 50, 100, 180]], 34, 64, St, seed + 1);
    for (const sx of [-1, 1]) coursesY(G, -hd + t, hd - t, sx * (hw - t / 2), t, 0, e, [], 34, 64, St, seed + 2 + sx);
    // the gables in stone up to the ridge
    for (const sx of [-1, 1]) for (let k = 0, z = e; z < r - 10; k++, z += 34) { const f = (z + 17 - e) / (r - e), half = (hd + 30) * (1 - f); if (half < 20) break; G.box(sx * (hw - t / 2), 0, z + 17, t / 2, half, 16.6, pick(St, k + sx)); }
    // the turf roof: a thick sod on each slope, grass on top, the edge of the sod showing
    for (const sd of [-1, 1]) { const run = hd + 60, rise = r - e + 20, L = Math.hypot(run, rise), a = Math.atan2(rise, run), b = G.n;
      for (let i = 0; i < 8; i++) G.box(-hw - 50 + ((i + 0.5) * (w + 100)) / 8, 0, 0, (w + 100) / 16, L / 2, 18, (nx, ny, nz) => (nz > 0.5 ? RG.turf : RG.peat)); G.place(b, { y: sd * (run / 2 - 4), z: e + rise / 2 - 6, roll: -sd * deg(a) });   // in eight, so no face is too big for the scans
      const Rr = rng(seed * 5 + sd + 9); for (let i = 0; i < 22; i++) { const x = (Rr() - 0.5) * (w + 40), v = (Rr() - 0.5) * (L - 60), m = G.n; G.blob(x, v, 15, 30 + Rr() * 40, 26 + Rr() * 34, 8 + Rr() * 5, pick([RG.turf, RG.turfD, 0x6e8a44, 0x667e3e], i + sd), { nu: 7, nv: 3, warp: (xx, yy, zz) => [xx, yy, Math.max(0, zz)] }); G.place(m, { y: sd * (run / 2 - 4), z: e + rise / 2 - 6, roll: -sd * deg(a) }); } }
    G.box(0, 0, r + 14, hw + 50, 16, 8, RG.turfD);
    // the chimney on the -X gable
    for (let k = 0, z = 0; z < r + 130; k++, z += 34) G.box(-hw - 30, 0, z + 17, 40, 56, 16.6, pick(St, k + 2)); G.box(-hw - 30, 0, r + 150, 48, 62, 6, RG.graniteD);
    // the door and its porch; the windows; the bench
    { G.box(0, -hd + 30, 100, 56, 4, 100, RG.timberD); for (let i = 0; i < 5; i++) G.box(-48 + i * 24, -hd + 26, 100, 11, 2, 98, i % 2 ? RG.green : RG.greenD); const m = G.n; G.lathe([[5, -1], [5, 1], [3.5, 1], [3.5, -1], [5, -1]], RG.iron, 8, [0, 0, 0], [1, 1], true); G.place(m, { x: 34, y: -hd + 24, z: 104, roll: 90 }); }
    { const b = G.n; G.box(0, 0, 0, 90, 60, 4, RG.timberL); G.place(b, { y: -hd - 50, z: 232, roll: 14 }); for (const sx of [-1, 1]) G.tube([[sx * 80, -hd - 100, 0], [sx * 80, -hd - 100, 220]], 4, RG.timberD, { S: 5 }); G.tube([[-80, -hd - 100, 220], [80, -hd - 100, 220]], 4, RG.timberD, { S: 5 }); for (const sx of [-1, 1]) G.tube([[sx * 80, -hd - 100, 220], [sx * 80, -hd + 2, 232]], 3, RG.timberD, { S: 4 }); }
    for (const x of [-230, 230]) { G.box(x, -hd + 30, 145, 46, 4, 42, RG.timberD); G.box(x, -hd + 28, 145, 40, 2, 36, 0x4a5a66); G.box(x, -hd + 27, 145, 2, 1, 36, RG.timberD); G.box(x, -hd + 2, 98, 56, 10, 4, G4[3]); }
    G.box(-140, -hd - 34, 42, 70, 18, 3, RG.timberL); for (const sx of [-1, 1]) G.box(-140 + sx * 58, -hd - 34, 20, 4, 14, 20, RG.timberD);
  })];
}
// ---- the hounds' kennels: four little houses in a row under one roof, an arched door in each, a fenced run before
// them (posts and rails, the gate swung open), the water trough. Its front -Y
export const KN = { n: 4, w: 160, d: 150, e: 120, run: 360 };
export function kennels() {
  return ['rgkennel4', shape((G) => {
    const { n, w, d, e, run } = KN, L = n * w, hl = L / 2, hd = d / 2, T = RG.timber;
    G.box(0, 0, 4, hl + 6, hd + 6, 4, G4[3]);
    G.box(0, hd - 4, e / 2 + 8, hl, 4, e / 2, RG.timberD);
    for (let x = -hl + 13, i = 0; x < hl - 6; x += 26, i++) G.box(x, hd + 0.5, e / 2 + 8, 11.4, 1, e / 2 - 1, i % 2 ? T : RG.timberL);   // the back's planks
    for (let i = 0; i <= n; i++) G.box(-hl + i * w, 0, e / 2 + 8, 4, hd, e / 2, RG.timberD);
    for (let i = 0; i < n; i++) { const x = -hl + w * (i + 0.5); for (let j = 0; j < 6; j++) { const xx = x - w / 2 + 4 + ((j + 0.5) * (w - 8)) / 6; if (Math.abs(xx - x) < 34) continue; G.box(xx, -hd + 3, e / 2 + 8, (w - 8) / 12 - 0.6, 3, e / 2, j % 2 ? T : RG.timberL); }
      G.box(x, -hd + 3, e - 14, 34, 3, 22, T); G.box(x, -hd + 5, 46, 30, 1, 38, 0x14120f); }
    const zw = e + 8, zc = (y) => zw + 4 / Math.cos(0.5) + (hd - y) * Math.tan(0.5);   // the roof's middle line, its underside on the walls' tops
    for (const sd of [-1, 1]) { const b = G.n; G.box(0, 0, 0, hl + 20, (hd + 30) / Math.cos(0.5) / 2, 4, pick(RG.slate, sd + 1)); G.place(b, { y: sd * (hd + 30) / 2, z: zc((hd + 30) / 2), roll: -sd * deg(0.5) }); }
    G.box(0, 0, zc(0) + 5, hl + 22, 8, 5, RG.slate[0]);
    for (const sx of [-1, 1]) { const k = G.n; for (const [y, z] of [[-hd, zw], [hd, zw], [0, zc(0) - 4]]) G.v(sx * hl, y, z, RG.timberD); G.idx.push(k, k + 1, k + 2); }
    // the run: posts round it, two rails, the gate swung open
    const ry = -hd - run, posts = [[-hl, -hd], [-hl, ry], [hl, ry], [hl, -hd]];
    for (let i = 0; i < 3; i++) { const [x0, y0] = posts[i], [x1, y1] = posts[i + 1], Lr = Math.hypot(x1 - x0, y1 - y0), m = Math.max(1, Math.round(Lr / 120));
      for (let k = 0; k <= m; k++) { if (i === 1 && k > 0 && k < m && Math.abs(x0 + ((x1 - x0) * k) / m) < 70) continue; const x = x0 + ((x1 - x0) * k) / m, y = y0 + ((y1 - y0) * k) / m; G.box(x, y, 50, 4, 4, 50, RG.timberD); }
      for (const z of [40, 84]) { if (i === 1) { G.box((x0 - 60) / 2, y0, z, (-60 - x0) / 2, 2.5, 3, T); G.box((x1 + 60) / 2, y0, z, (x1 - 60) / 2, 2.5, 3, T); } else G.box((x0 + x1) / 2, (y0 + y1) / 2, z, Math.abs(x1 - x0) / 2 + 2, Math.abs(y1 - y0) / 2 + 2, 3, T); } }
    for (const sx of [-1, 1]) G.box(sx * 60, ry, 50, 4, 4, 50, RG.timberD);
    { const b = G.n; for (const z of [30, 66, 96]) G.box(56, 0, z, 56, 2, 3, T); for (const x of [6, 110]) G.box(x, 0, 52, 3, 3, 48, RG.timberD); G.place(b, { x: 62, y: ry, yaw: -70 }); }
    G.box(hl - 60, ry + 60, 16, 44, 16, 16, G4[2]); G.box(hl - 60, ry + 60, 30, 38, 11, 2, RG.water);
  })];
}
// ---- the alarm bell: a timber frame (two posts, a beam, a little roof), the bronze bell hung from the beam, its rope
// down to a cleat on the frame. Along Y
export function alarmBell() {
  return ['rgbell', shape((G) => {
    for (const sy of [-1, 1]) { G.box(0, sy * 70, 145, 7, 7, 145, RG.timberD); G.tube([[0, sy * 70, 214], [0, sy * 36, 276]], 3.5, RG.timberD, { S: 5 }); G.blob(0, sy * 70, 4, 16, 16, 6, G4[1], { e: 4, nu: 8, nv: 3 }); }
    G.box(0, 0, 282, 10, 86, 8, RG.timberD);
    for (const sd of [-1, 1]) { const b = G.n; G.box(0, 0, 0, 30, 100, 2.5, RG.slate[1]); G.place(b, { x: sd * 24, z: 284, pitch: sd * 32 }); }
    G.lathe([[3, 274], [9, 272], [12, 262], [14, 246], [18, 232], [24, 222], [26, 218], [0, 218]], RG.bronze, 14);
    G.tube([[0, 0, 274], [0, 0, 222]], 1.6, RG.iron, { S: 4 }); G.blob(0, 0, 220, 4, 4, 4, RG.iron, { nu: 5, nv: 4 });
    G.tube([[0, 0, 244], [0, -26, 230], [0, -58, 120]], 1.3, RG.rope, { S: 4 }); G.box(0, -60, 118, 3, 3, 6, RG.timberL);
  })];
}
// ---- the hoist at the cliff's edge: a platform of planks out to the lip, a timber derrick over it with its jib out
// over the drop (+X), the pulley at its head, the rope from the winch's drum over it and down the cliff face, a crate
// on the rope below the lip; the winch on its frame with its crank. HS: the platform's size; the jib's reach
export const HS = { w: 420, d: 360, jib: 330, drop: 1500 };
export function hoist() {
  return ['rghoist2', shape((G) => {
    const { w, d, jib, drop } = HS, hw = w / 2, hd = d / 2, T = RG.timber, TD = RG.timberD;
    for (let i = 0; i < 9; i++) G.box(-hw + ((i + 0.5) * w) / 9, 0, 6, w / 18 - 0.8, hd, 4, i % 2 ? RG.timberL : T); for (const y of [-hd + 20, hd - 20]) G.box(0, y, 1, hw, 10, 1, TD);
    // the derrick: two legs from the platform's inner edge leaning out, a back stay, the jib out over the drop
    const top = [hw + 40, 0, 620];
    for (const sy of [-1, 1]) G.tube([[-hw + 60, sy * (hd - 30), 10], [top[0] - 20, sy * 30, top[2] - 6]], 9, TD, { S: 6 });
    G.tube([[-hw - 40, 0, 4], [-hw + 40, 0, 120], [top[0] - 20, 0, top[2] + 4]], 6, TD, { S: 5 });
    G.box(top[0] - 20, 0, top[2], 14, 40, 10, TD); G.tube([[top[0] - 30, 0, top[2] + 6], [hw + jib, 0, top[2] + 50]], 7, TD, { S: 5 });
    { const b = G.n; G.lathe([[18, -6], [18, 6], [8, 6], [8, -6], [18, -6]], RG.iron, 14, [0, 0, 0], [1, 1], true); G.place(b, { x: hw + jib, y: 0, z: top[2] + 30, roll: 90 }); }
    // the winch: an A-frame each side, the drum, the crank; the rope from the drum up over the pulley and down
    for (const sy of [-1, 1]) G.tube([[-hw + 80, sy * 70, 10], [-hw + 120, sy * 70, 130], [-hw + 160, sy * 70, 10]], 5, TD, { S: 5 });
    { const b = G.n; G.lathe([[0, -66], [26, -66], [26, -60], [20, -56], [20, 56], [26, 60], [26, 66], [0, 66]], (k) => (k > 2 && k < 5 ? RG.rope : T), 12); G.place(b, { x: -hw + 120, y: 0, z: 124, roll: 90 }); }
    G.tube([[-hw + 120, -76, 124], [-hw + 120, -90, 124], [-hw + 120, -90, 154], [-hw + 140, -96, 160]], 2.4, RG.iron, { S: 4 });
    G.tube([[-hw + 130, 0, 146], [hw + jib - 18, 0, top[2] + 30]], 1.6, RG.rope, { S: 4 }); G.tube([[hw + jib + 18, 0, top[2] + 30], [hw + jib + 18, 0, -drop * 0.3]], 1.6, RG.rope, { S: 4 });
    { const cz = -drop * 0.3 - 70; G.box(hw + jib + 18, 0, cz, 34, 30, 30, RG.timberL); G.box(hw + jib + 18, 0, cz, 35, 31, 3, TD); for (const sx of [-1, 1]) G.tube([[hw + jib + 18, 0, cz + 70], [hw + jib + 18 + sx * 30, 0, cz + 30]], 1.2, RG.rope, { S: 3 }); G.tube([[hw + jib + 18, 0, cz + 70], [hw + jib + 18, 0, cz + 30]], 1.2, RG.rope, { S: 3 }); }
    for (const [x, y, s, z] of [[-hw + 40, hd - 60, 32, 10], [-hw + 104, hd - 56, 26, 10], [-hw + 44, hd - 58, 22, 74]]) G.box(x, y, z + s, s, s, s, s > 30 ? RG.timberL : T);
  })];
}
// ---- the warning beacon on its pillar: a column of granite on two steps, the iron fire basket at its head burning
// (the rangers lit it when the Blight came), the ladder they lit it from thrown down in the heather (+X). BC: the
// column's radius and height
export const BC = { r: 96, h: 330 };
export function beacon() {
  return pair('rgbeacon4', (G, P) => {
    const { r, h } = BC, bz = h + 22;
    if (G) {
      G.lathe([[r + 70, 0], [r + 70, 26], [r + 30, 26], [r + 30, 50], [r, 50], [r, h], [r + 20, h + 6], [r + 20, h + 22], [0, h + 22]], (k) => (k < 2 ? G4[3] : k < 4 ? G4[1] : k < 6 ? G4[0] : G4[2]), 16);
      for (let z = 90; z < h - 20; z += 40) G.lathe([[r + 0.8, z], [r + 0.8, z + 1.5]], 0x6a665e, 16, [0, 0, 0], [1, 1], true);
      G.lathe([[16, 0], [12, 24], [12, 30], [0, 30]], RG.iron, 8, [0, 0, bz]);
      for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; G.tube([[Math.cos(a) * 9, Math.sin(a) * 9, bz + 27], [Math.cos(a) * 65, Math.sin(a) * 65, bz + 31]], 2.6, RG.iron, { S: 4 }); }
      G.lathe([[64, 0], [67, 0], [67, 6], [64, 6], [64, 0]], RG.iron, 16, [0, 0, bz + 28], [1, 1], true); G.lathe([[80, 0], [83, 0], [83, 6], [80, 6], [80, 0]], RG.iron, 16, [0, 0, bz + 100], [1, 1], true);
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; G.tube([[Math.cos(a) * 65.5, Math.sin(a) * 65.5, bz + 30], [Math.cos(a) * 81.5, Math.sin(a) * 81.5, bz + 103]], 2.6, RG.iron, { S: 4 }); }
      G.blob(0, 0, bz + 40, 62, 62, 14, 0x3a2a1e, { nu: 10, nv: 4 });
      // the ladder in the heather
      for (const sy of [-1, 1]) G.tube([[r + 62, sy * 26, 3.5], [r + 412, sy * 26 + 40, 3.5]], 3.2, RG.timberD, { S: 5 });
      for (let k = 1; k < 10; k++) { const t = k / 10; G.box(r + 62 + 350 * t, 40 * t, 4, 2.4, 28, 2.4, RG.timber); }
    }
    if (P) {
      P.blob(0, 0, bz + 64, 56, 56, 28, RG.fire, { nu: 12, nv: 6 });
      for (let i = 0; i < 7; i++) { const a = i * 0.9, d = i % 2 ? 26 : 8, s = i % 3; P.blob(Math.cos(a) * d, Math.sin(a) * d, bz + 88 + s * 18, 20 - s * 4, 20 - s * 4, 40 - s * 6, i % 2 ? RG.fireL : RG.fire, { nu: 8, nv: 5, warp: (x, y, z) => [x * (1 - Math.max(0, z / 60)), y * (1 - Math.max(0, z / 60)), z] }); }
    }
  });
}
// ---- the toposcope at the viewpoint: a round stone pedestal, the brass plate on it with its rays to what you can see
// and the arrow to the north; the telescope on its tripod
export function toposcope() {
  return ['rgtopo', shape((G) => {
    G.lathe([[70, 0], [70, 12], [52, 16], [46, 22], [46, 96], [58, 100], [58, 110], [0, 110]], (k) => (k < 2 ? G4[3] : G4[k % 4]), 16);
    G.lathe([[56, 110], [56, 113], [0, 115]], RG.brass, 24);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, b = G.n; G.box(26, 0, 0, 24, 0.8, 0.4, 0x5a4422); G.place(b, { yaw: deg(a), z: 114.2 }); }
    { const k = G.n; for (const [x, y] of [[0, 46], [-6, 32], [6, 32]]) G.v(x, y, 114.8, 0x8a2a1e); G.idx.push(k, k + 1, k + 2); G.lathe([[8, 114], [8, 115], [0, 116]], 0x5a4422, 12); }
  })];
}
export function telescope() {
  return ['rgscope', shape((G) => {
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5; G.tube([[0, 0, 130], [Math.cos(a) * 52, Math.sin(a) * 52, 0]], 2.4, RG.timberD, { S: 4 }); }
    G.lathe([[10, 126], [8, 134], [0, 136]], RG.brass, 8);
    { const b = G.n; G.lathe([[0, -70], [7, -70], [7, -40], [8, -38], [8, 10], [10, 12], [10, 60], [12, 62], [12, 70], [0, 70]], (k) => (k === 4 || k === 7 ? RG.brass : 0x3a3530), 12); G.place(b, { z: 144, pitch: 78 }); }
    G.box(0, 0, 138, 4, 4, 6, RG.brass);
  })];
}
// ---- the weather post: a pole with the vane on its top (the arrow and its letters' arms), a rain gauge on a stake (+X)
export function weatherPost() {
  return ['rgweather2', shape((G) => {
    G.blob(0, 0, 8, 22, 22, 8, G4[1], { e: 5, nu: 8, nv: 4 }); G.tube([[0, 0, 0], [0, 0, 330]], 4, RG.timberD, { S: 6 });
    G.box(0, 0, 300, 30, 1.6, 1.6, RG.iron); G.box(0, 0, 300, 1.6, 30, 1.6, RG.iron); G.lathe([[4, 304], [4, 320], [0, 322]], RG.iron, 6);
    { const k = G.n; for (const [x, z] of [[-46, 340], [-30, 352], [-30, 328]]) G.v(x, 0, z, RG.iron); G.idx.push(k, k + 1, k + 2); G.box(0, 0, 340, 46, 1.2, 1.2, RG.iron); G.box(40, 0, 340, 10, 0.8, 9, RG.iron); G.tube([[0, 0, 320], [0, 0, 341]], 1.2, RG.iron, { S: 4 }); }
    G.tube([[60, 0, 0], [60, 0, 70]], 2, RG.timberD, { S: 4 }); G.lathe([[8, 70], [8, 96], [10, 100], [0, 100]], 0xb07840, 10, [60, 0, 0]);
  })];
}
// ---- a granite tor: rounded slabs stacked in layers, each a little off the one under it, the joints dark, lichen on
// the tops. torParts: its slabs ({ x, y, z0, z1, bw, bd }: where each stands and its half sizes), for its bodies
export function torParts(r = 500, h = 450, seed = 1) {
  r = q(r, 20); h = q(h, 20); seed = N(seed);
  const R = rng(seed * 47 + r + h), layers = 3 + (seed % 2), lh = h / layers, P = [];
  let z = 0, cx = 0, cy = 0, w = r, dp = r * (0.6 + (seed % 3) * 0.12);
  for (let k = 0; k < layers; k++) { const nb = k === layers - 1 ? 2 : 3;
    for (let j = 0; j < nb; j++) { const x = cx + (j - (nb - 1) / 2) * w * 0.62 + (R() - 0.5) * w * 0.12, y = cy + (R() - 0.5) * dp * 0.3, bw = (w / nb) * 1.18, bd = dp * (0.8 + R() * 0.2), bh = lh * (0.55 + R() * 0.1);
      // the bottom layer goes well into the ground, so its slabs meet the turf at nearly their full width
      P.push(k ? { x, y, cz: z + bh, hz: bh + 3, z0: z, z1: z + bh * 2, bw, bd, j, k } : { x, y, cz: bh - 10, hz: bh + 15, z0: 0, z1: bh * 2 + 5, bw, bd, j, k }); }
    z += lh * 1.08; cx += (R() - 0.5) * w * 0.2; cy += (R() - 0.5) * dp * 0.15; w *= 0.78; dp *= 0.86; }
  return P;
}
export function tor(r = 500, h = 450, seed = 1) {
  r = q(r, 20); h = q(h, 20); seed = N(seed);
  return ['rgtor2|' + [r, h, seed].join('|'), shapeF((G) => {
    for (const p of torParts(r, h, seed)) { const { j, k } = p;
      G.blob(p.x, p.y, p.cz, p.bw, p.bd, p.hz, (nx, ny, nz) => (nz > 0.7 && wob(nx * 4 + j + k, ny * 4) > 0.2 ? pick(RG.lichen, j + k) : nz < -0.5 ? RG.graniteD : pick(G4, j + k * 2 + (wob(nx * 3, nz * 3) > 0 ? 1 : 0))),
        { e: 3.4, nu: 12, nv: 6, warp: (x, y, zz) => [x * (1 + 0.06 * wob(y * 0.01 + j, zz * 0.02)), y * (1 + 0.06 * wob(x * 0.01, zz * 0.02 + k)), zz] }); }
  })];
}
// ---- a pine on the ridge, bent by the wind off the west: its trunk leaning and curving east (+X), red-brown bark going
// orange up high, branches swept east and their needles in flat dark clumps, a few dead stubs on the weather side
export const pineR = (h) => q(h, 50) * 0.03;
export function windPine(h = 900, seed = 1) {
  h = q(h, 50); seed = N(seed);
  return ['rgpine3|' + [h, seed % 6].join('|'), shape((G) => {
    const R = rng(seed * 71 + h), tr = pineR(h), lean = 0.08 + (seed % 3) * 0.035;
    const P = (t) => [h * lean * t * t * 1.2, 0, h * t * 0.92];
    const pts = []; for (let i = 0; i <= 10; i++) pts.push(P(i / 10));
    G.tube(pts, (u) => tr * (1.18 - u * 0.78), (u) => (u > 0.55 ? RG.barkL : u > 0.3 ? RG.bark : RG.barkD), { S: 8, M: 16 });
    G.blob(0, 0, 8, tr * 1.7, tr * 1.6, 12, RG.barkD, { nu: 8, nv: 3, warp: (x, y, z) => [x, y, Math.max(0, z)] });
    const nb = 8 + (seed % 3);
    for (let i = 0; i < nb; i++) { const t = 0.44 + (i / nb) * 0.5, [x0, y0, z0] = P(t), a = (R() - 0.5) * 2.6 + (i % 2 ? 0.35 : -0.35), L = h * (0.16 + R() * 0.12) * (1.2 - t * 0.55), ca = Math.cos(a), sa = Math.sin(a), x1 = x0 + ca * L, y1 = y0 + sa * L, z1 = z0 + L * 0.14;
      G.tube([[x0, y0, z0], [x0 + ca * L * 0.5, y0 + sa * L * 0.5, z0 + L * 0.09], [x1, y1, z1]], (u) => tr * 0.32 * (1 - u * 0.6), RG.bark, { S: 5, M: 5 });
      for (let k = 0; k < 3; k++) { const f = 0.42 + k * 0.29, cx = x0 + ca * L * f, cy = y0 + sa * L * f, cz = z0 + L * 0.12 * f + 12; G.blob(cx, cy, cz, L * 0.34 + 26, L * 0.3 + 22, 22 + L * 0.07, pick(RG.needle, i + k), { nu: 8, nv: 4, warp: (x, y, z) => [x * (1 + 0.12 * Math.sin(y * 0.05 + k)), y * (1 + 0.12 * Math.sin(x * 0.05 + i)), z * (z < 0 ? 0.55 : 1.05)] }); } }
    const [tx, ty, tz] = P(1); G.blob(tx + 14, ty, tz + 10, h * 0.13, h * 0.11, 34, RG.needle[0], { nu: 10, nv: 5, warp: (x, y, z) => [x, y, z * (z < 0 ? 0.6 : 1)] }); G.blob(tx - 30, ty + 20, tz - 30, h * 0.09, h * 0.08, 26, RG.needle[1], { nu: 9, nv: 4 });
    for (let i = 0; i < 3; i++) { const t = 0.25 + i * 0.12, [x0, y0, z0] = P(t), a = Math.PI + (R() - 0.5); G.tube([[x0, y0, z0], [x0 + Math.cos(a) * h * 0.05, y0 + Math.sin(a) * h * 0.05, z0 + 6]], tr * 0.14, RG.barkD, { S: 4 }); }
  })];
}
// ---- a cairn: a cone of stones heaped by the trail, a flat one on top. Its foot's radius: h * 0.62
export function cairn(h = 110, seed = 1) {
  h = q(h, 10); seed = N(seed);
  return ['rgcairn|' + [h, seed % 3].join('|'), shapeF((G) => {
    const R = rng(seed * 11 + h), rb = h * 0.62;
    for (let k = 0, z = 0; z < h - 14; k++) { const t = z / h, rr = rb * (1 - t * 0.82), n = Math.max(1, Math.round(rr / 14)), s = 16 - t * 6;
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + k * 0.7 + R() * 0.3, d = n > 1 ? rr - s * 0.6 : 0; G.blob(Math.cos(a) * d, Math.sin(a) * d, z + s * 0.6, s * (1 + R() * 0.3), s * (0.9 + R() * 0.3), s * 0.62, pick(G4, i + k), { e: 3, nu: 6, nv: 4 }); }
      if (n > 1) G.blob(0, 0, z + s * 0.6, rr - s * 0.4, rr - s * 0.4, s * 0.6, pick(G4, k + 2), { e: 3, nu: 8, nv: 4 }); z += s * 1.05; }
    G.blob(0, 0, h - 6, 22, 16, 7, G4[2], { e: 4, nu: 8, nv: 4 });
  })];
}
// ---- heather: a low cushion of it, purple going brown, never above a step; cotton grass: low tufts with white heads
export function heather(r = 60, seed = 1) {
  r = q(r, 10); seed = N(seed);
  return ['rgheather5|' + [r, seed % 6].join('|'), shape((G) => {
    const R = rng(seed * 23 + r), n = 2 + Math.round(r / 30), C = [0x6a4e5e, 0x5e4a56, 0x745a64, 0x6a5a4e, 0x5a5a40];
    for (let i = 0; i < n; i++) { const a = R() * 6.28, d = R() * r * 0.5, s = r * (0.3 + R() * 0.22), hh = 12 + R() * 8, col = C[(i + seed) % C.length];
      G.blob(Math.cos(a) * d, Math.sin(a) * d, 0, s, s * (0.8 + R() * 0.3), hh, (nx, ny, nz) => (nz > 0.55 ? col : C[4]), { nu: 7, nv: 4, warp: (x, y, z) => [x * (1 + 0.15 * Math.sin(y * 0.25 + i)), y * (1 + 0.15 * Math.sin(x * 0.25)), Math.max(0, z) * (1 + 0.3 * Math.sin(x * 0.35 + y * 0.45 + i))] }); }
    // sprigs standing up out of it
    for (let i = 0; i < n + 1; i++) { const a = R() * 6.28, d = R() * r * 0.55, x = Math.cos(a) * d, y = Math.sin(a) * d, hz = 10 + R() * 4; G.blob(x, y, hz - 1, 5 + R() * 3, 5 + R() * 3, hz, C[(i + seed) % 4], { nu: 4, nv: 3 }); }
  })];
}
export function cottonGrass(seed = 1) {
  seed = N(seed);
  return ['rgcotton3|' + (seed % 4), shape((G) => {
    const R = rng(seed * 31 + 7);
    G.blob(0, 0, 0, 16, 14, 5, 0x6e7a44, { nu: 6, nv: 2, warp: (x, y, z) => [x, y, Math.max(0, z)] });
    for (let i = 0; i < 5; i++) { const a = R() * 6.28, d = R() * 10, x = Math.cos(a) * d, y = Math.sin(a) * d, lx = x + Math.cos(a) * 3, ly = y + Math.sin(a) * 3; G.tube([[x, y, 2], [lx, ly, 11]], 0.7, 0x7a8048, { S: 3, M: 2 }); G.blob(lx, ly, 13, 3, 3, 2.6, RG.cotton, { nu: 4, nv: 3 }); }
  })];
}
// ---- a peat hag: a bank of peat the weather has cut out of the mire, dark and crumbling at its sides, heather on its
// top lipping over; w long (X), d deep, h high
export function peatHag(w = 320, d = 170, h = 64, seed = 1) {
  w = q(w, 20); d = q(d, 10); h = q(h, 4); seed = N(seed);
  return ['rghag|' + [w, d, h, seed % 4].join('|'), shapeF((G) => {
    const R = rng(seed * 37 + w + d);
    G.blob(0, 0, h / 2 - 6, w / 2, d / 2, h / 2 + 6, (nx, ny, nz) => (nz > 0.75 ? RG.turfD : wob(nx * 5 + seed, nz * 6) > 0.35 ? RG.peatD : RG.peat), { e: 5, nu: 16, nv: 6, warp: (x, y, z) => [x * (1 + 0.08 * wob(y * 0.02 + seed, z * 0.05)), y * (1 + 0.1 * wob(x * 0.02, z * 0.05 + seed)), z] });
    for (let i = 0; i < 4; i++) G.blob((i - 1.5) * w * 0.22 + (R() - 0.5) * 20, (R() - 0.5) * d * 0.2, h - 2, w * 0.17, d * 0.42, 9, pick(RG.heather, i + seed), { nu: 8, nv: 4, warp: (x, y, z) => [x, y, Math.max(0, z)] });
  })];
}
// ---- a bog pool: dark water in the peat, its rim of wet moss; rx by ry, lying flat
export function bogPool(rx = 200, ry = 140, seed = 1) {
  rx = q(rx, 10); ry = q(ry, 10); seed = N(seed);
  return ['rgpool2|' + [rx, ry, seed % 4].join('|'), shape((G) => {
    const n = 40, K = (a) => 1 + 0.12 * Math.sin(3 * a + seed) + 0.07 * Math.sin(5 * a + seed * 2);
    const ring = (m, z, c) => { const b = G.n; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, k = K(a); G.v(Math.cos(a) * (rx * k + m), Math.sin(a) * (ry * k + m), z, typeof c === 'function' ? c(i) : c); } return b; };
    const R0 = ring(34, 1.9, (i) => pick(RG.moss, i >> 2)), R1 = ring(4, 2.05, RG.peatD), R2 = ring(-22, 2.2, RG.water), c0 = G.v(0, 0, 2.2, RG.waterD);
    for (const [a, b] of [[R0, R1], [R1, R2]]) for (let i = 0; i < n; i++) { const j = (i + 1) % n; G.idx.push(a + i, a + j, b + i, a + j, b + j, b + i); }
    for (let i = 0; i < n; i++) G.idx.push(R2 + i, R2 + ((i + 1) % n), c0);
  })];
}
// ---- the spring's head: the rangers' well-house of dressed granite over the spring, a slab roof on it, the spout out
// of an arched recess in its front (-Y) with the date-stone over it, the trough below and the overflow out into the
// mire (+X). SP: its body
export const SP = { w: 180, d: 100, h: 206 };
export function springHead() {
  return ['rgspring3', shapeF((G) => {
    const R = rng(77), hw = 80, hd = 45;
    // the walls in four courses of blocks, the arched recess in the front
    for (let k = 0; k < 4; k++) { const z0 = k * 37, z1 = z0 + 36.4;
      for (const [sy, len, n] of [[-1, hw * 2, 3], [1, hw * 2, 3]]) for (let i = 0; i < n; i++) { const x0 = -hw + (len / n) * i + (k % 2 ? 20 : 0) * (i ? 1 : 0), x1 = Math.min(hw, -hw + (len / n) * (i + 1) + (k % 2 ? 20 : 0)); if (sy < 0 && k < 3 && x1 > -36 && x0 < 36) { if (x0 < -36) G.box((x0 - 36) / 2, sy * (hd - 9), (z0 + z1) / 2, (-36 - x0) / 2 - 0.6, 9, (z1 - z0) / 2, pick(G4, i + k)); if (x1 > 36) G.box((x1 + 36) / 2, sy * (hd - 9), (z0 + z1) / 2, (x1 - 36) / 2 - 0.6, 9, (z1 - z0) / 2, pick(G4, i + k + 1)); continue; }
        G.box((x0 + x1) / 2, sy * (hd - 9) + (R() - 0.5) * 2, (z0 + z1) / 2, (x1 - x0) / 2 - 0.6, 9, (z1 - z0) / 2, pick(G4, i + k * 2)); }
      for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) G.box(sx * (hw - 9) + (R() - 0.5) * 2, -hd + 18 + ((hd * 2 - 36) / 2) * (i + 0.5) + (k % 2 ? 6 : 0), (z0 + z1) / 2, 9, (hd * 2 - 36) / 4 - 0.6, (z1 - z0) / 2, pick(G4, i + k + 2)); }
    G.box(0, 0, 74, hw - 16, hd - 16, 74, RG.graniteD);   // the inside, behind the recess
    G.box(0, -hd + 18, 60, 36, 2, 60, 0x2a2a28);   // the back of the recess
    G.blob(0, -hd + 9, 116, 42, 12, 18, G4[2], { e: 3, nu: 10, nv: 3 });   // the lintel over it
    G.box(0, -hd - 1, 141, 26, 1.5, 9, G4[0]);   // the date-stone
    // the coping and the roof slabs, the ridge stone
    G.box(0, 0, 151, hw + 8, hd + 8, 3, G4[3]);
    for (const sd of [-1, 1]) { const b = G.n; G.box(0, 0, 0, hw + 14, (hd + 14) / Math.cos(0.6) / 2, 5, pick(G4, sd + 2)); G.place(b, { y: sd * (hd + 14) / 2, z: 154 + Math.tan(0.6) * (hd + 14) / 2, roll: -sd * deg(0.6) }); }
    G.box(0, 0, 154 + Math.tan(0.6) * (hd + 14) + 3, hw + 16, 7, 6, G4[1]);
    for (const sx of [-1, 1]) { const k = G.n; for (const [y, z] of [[-hd - 8, 154], [hd + 8, 154], [0, 154 + Math.tan(0.6) * (hd + 8)]]) G.v(sx * (hw - 1), y, z, G4[2]); G.idx.push(k, k + 1, k + 2); }
    // the spout out of the recess, the water falling into the trough; the overflow into the mire
    G.tube([[0, -hd + 20, 92], [0, -hd - 12, 92], [0, -hd - 18, 86]], 4, 0x6a6e72, { S: 6 });
    G.box(0, -110, 24, 84, 40, 24, G4[1]); G.box(0, -110, 46, 76, 32, 2, RG.water);
    G.tube([[0, -hd - 18, 84], [0, -hd - 20, 47]], 2, 0xa8c0c8, { S: 4 }); G.box(86, -110, 44, 4, 8, 3, G4[3]); G.tube([[88, -110, 44], [100, -110, 30], [104, -110, 3]], 3, 0xa8c0c8, { S: 4 });
  })];
}
// ---- a cliff face along X (its face to -Y), from the ground's edge at z 0 down to -h: buttresses and gullies, its foot
// spreading into scree, the granite grey and stained, turf on its ledges; and the turf of its lip, from the top of the
// face back to y = +120 (over the edge of the ground's slab). The face never comes in past y = -20
export function cliffFace(len = 4000, h = 1800, seed = 1) {
  len = q(len, 200); h = q(h, 100); seed = N(seed);
  return ['rgcliff4|' + [len, h, seed % 3].join('|'), shape((G) => {
    const nu = Math.round(len / 80), nv = Math.round(h / 100), hl = len / 2;
    const off = (x, z) => 95 + 45 * Math.sin(x * 0.006 + seed) + 30 * Math.sin(x * 0.017 + z * 0.004) + 18 * wob(x * 0.01 + seed, z * 0.012) + Math.max(0, -z - h * 0.55) * 0.3;
    G.surf((u, v) => { const x = -hl + u * len, z = -h * v; return [x, -off(x, z) - 20, z]; }, 0, 1, nu, 0, 1, nv, (u, v) => { const x = -hl + u * len, z = -h * v, w = wob(x * 0.02, z * 0.03 + seed); return v > 0.75 ? pick([0x7e7a70, 0x8a867a, 0x74706a], Math.round(u * 91 + v * 13)) : w > 0.55 ? RG.grass[1] : w < -0.5 ? RG.graniteD : pick(G4, Math.round(u * 37 + v * 11)); });
    G.surf((u, v) => { const x = -hl + u * len, y0 = -off(x, 0) - 20; return [x, y0 + v * (120 - y0), 0.6]; }, 0, 1, nu, 0, 1, 1, (u) => pick(RG.grass, Math.round(u * 50)));
  })];
}
// ---- a rope fence along X: posts every so often, two ropes sagging between
export function ropeFence(len = 1200) {
  len = q(len, 100);
  return ['rgrope|' + len, shape((G) => {
    const n = Math.max(2, Math.round(len / 260)), hl = len / 2;
    for (let i = 0; i <= n; i++) { const x = -hl + (len * i) / n; G.box(x, 0, 48, 5, 5, 48, RG.timberD); G.lathe([[6, 96], [6, 98], [0, 102]], RG.timberD, 6, [x, 0, 0]); }
    for (const z of [50, 86]) for (let i = 0; i < n; i++) { const x0 = -hl + (len * i) / n, x1 = -hl + (len * (i + 1)) / n; G.tube([[x0, 0, z], [(x0 + x1) / 2, 0, z - 12], [x1, 0, z]], 1.4, RG.rope, { S: 4 }); }
  })];
}
// ---- the old ring's wall: a drystone wall round a circle of radius r (to its middle), RW.w thick and RW.h high, turf
// along its top, fallen where the gaps are (gaps: [angle in degrees, width]); at each end its courses step down, the
// stones that came off them lying at its foot. ringRuns: the runs of wall between the gaps ([a0, a1], radians)
export const RW = { w: 220, h: 96, ch: 32, step: 48, cap: 14 };
export function ringRuns(r, gaps) {
  const G = gaps.map(([a, gw]) => [(a * Math.PI) / 180, gw / r / 2]).sort((p, s) => p[0] - s[0]), out = [];
  for (let i = 0; i < G.length; i++) { const [ga, gh] = G[i], [na, nh] = G[(i + 1) % G.length]; const a0 = ga + gh, a1 = na - nh + (i === G.length - 1 ? Math.PI * 2 : 0); if (a1 > a0) out.push([a0, a1]); }
  return out;
}
export function ringWall(r = 1300, gaps = [], seed = 1) {
  r = q(r, 10); seed = N(seed);
  return ['rgring2|' + r + '|' + seed + '|' + JSON.stringify(gaps), shapeF((G) => {
    const { w, h, ch, step, cap } = RW, R = rng(seed * 19 + r), ro = r + w / 2, ri = r - w / 2, D = 34, nC = Math.round(h / ch), dA = step / r;
    for (const [a0, a1] of ringRuns(r, gaps)) {
      for (let k = 0; k < nC; k++) { const z0 = k * ch, z1 = z0 + ch - 0.8, b0 = a0 + k * dA, b1 = a1 - k * dA;
        // the faces: stones along the outside and the inside, every other course stepped by half a stone
        for (const [qa, qb, out] of [[ro - D, ro, 1], [ri, ri + D, 0]]) { const n = Math.max(1, Math.round(((b1 - b0) * r) / 58)), sw = (b1 - b0) / n, off = k % 2 ? sw / 2 : 0;
          for (let i = -1; i < n; i++) { const s0 = Math.max(b0, b0 + off + i * sw) + 0.7 / r, s1 = Math.min(b1, b0 + off + (i + 1) * sw) - 0.7 / r; if ((s1 - s0) * r < 10) continue;
            const j = (R() - 0.5) * 5; arcBlock(G, s0, s1, out ? qa : qa - j, out ? qb + j : qb, z0, z1, pick(G4, i * 5 + k * 3 + (R() < 0.15 ? 2 : 0))); } }
        // the rubble between the faces
        arcBlock(G, b0 + 0.5 / r, b1 - 0.5 / r, ri + D - 1, ro - D + 1, z0, z1 - (k === nC - 1 ? 0 : 3), RG.graniteD); }
      // the turf along its top, rounded, running down onto the end steps
      { const c0 = a0 + (nC - 1) * dA, c1 = a1 - (nC - 1) * dA, m = Math.max(2, Math.round(((c1 - c0) * r) / 50));
        G.surf((u, v) => { const a = c0 + (c1 - c0) * u, s = (v - 0.5) * 2, qq = r + s * (w / 2 + 5), ends = Math.min(1, (Math.min(u, 1 - u) * (c1 - c0) * r) / 30), z = h - 0.8 + cap * Math.cos((s * Math.PI) / 2) ** 0.7 * ends; return [Math.cos(a) * qq, Math.sin(a) * qq, z]; }, 0, 1, m, 0, 1, 6, (u, v) => pick(RG.grass, Math.round(u * 60 + v * 3))); }
      // the stones that came off its ends, lying in the gap at its foot (low enough to step over)
      for (const [ea, sg] of [[a0, -1], [a1, 1]]) for (let i = 0; i < 6; i++) { const a = ea + (sg * (14 + R() * 90)) / r, qq = r + (R() - 0.5) * w * 0.8, s = 14 + R() * 10; G.blob(Math.cos(a) * qq, Math.sin(a) * qq, 3, s, s * (0.7 + R() * 0.3), 8, pick(G4, i + 1), { e: 3, nu: 7, nv: 4 }); }
    }
  })];
}
// ---- the trail's sign at the way in: a board on two posts, a little roof over it (the map writes it); along X
export const TS = { w: 260, z: 150 };
export function trailSign() {
  return ['rgsign2', shape((G) => {
    const { w, z } = TS;
    for (const sx of [-1, 1]) G.box(sx * (w / 2 + 6), 0, 110, 6, 6, 110, RG.timberD);
    G.box(0, 0, z, w / 2, 3, 36, RG.timberL); G.box(0, 0, z, w / 2 + 4, 2, 40, RG.timberD);
    G.box(0, 0, 224, w / 2 + 12, 6, 4, RG.timberD);
    for (const sd of [-1, 1]) { const b = G.n; G.box(0, 0, 0, w / 2 + 20, 22, 2.5, RG.slate[1]); G.place(b, { y: sd * 18, z: 216, roll: -sd * 30 }); }
  })];
}
// ---- a tree in the valley far below the crest (seen from above, never close): a fir as two stacked cones, or a
// broadleaf as a lumpy crown on a stub of trunk; few faces
export function valleyTree(h = 1400, kind = 0, leaf = 0x2e4a2a, seed = 1) {
  h = q(h, 200); seed = N(seed);
  return ['rgvtree|' + [h, kind, leaf, seed % 3].join('|'), shape((G) => {
    const tr = h * 0.035, s = 1 + (seed % 3) * 0.08;
    G.lathe([[tr, -10], [tr * 0.7, h * 0.4]], 0x3e2e22, 5);
    if (kind) { G.lathe([[h * 0.25 * s, h * 0.16], [h * 0.12 * s, h * 0.6], [0, h * 0.72]], leaf, 6); G.lathe([[h * 0.16 * s, h * 0.5], [0, h]], dark(leaf, 0.88), 6); }
    else G.blob(0, 0, h * 0.62, h * 0.3 * s, h * 0.28, h * 0.3, (nx, ny, nz) => (nz > 0.3 ? leaf : dark(leaf, 0.82)), { nu: 7, nv: 5 });
  })];
}
// ---- the old hearth at the ring's middle: flat stones set round in the turf, the ash of old fires inside them, a
// flat stone at the middle; nothing above a step
export function hearthStones(r = 110, seed = 1) {
  r = q(r, 10); seed = N(seed);
  return ['rghearth|' + [r, seed % 3].join('|'), shapeF((G) => {
    const R = rng(seed * 7 + r), n = 9;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + R() * 0.2, b = G.n; G.blob(0, 0, 2, 30 + R() * 8, 20 + R() * 6, 6, pick(G4, i), { e: 3, nu: 8, nv: 4 }); G.place(b, { x: Math.cos(a) * r, y: Math.sin(a) * r, yaw: deg(a) + 90 + (R() - 0.5) * 20 }); }
    G.blob(0, 0, 0.8, r - 8, r - 8, 1, 0x4a4238, { nu: 16, nv: 2 });
    G.blob(0, 0, 3, 34, 28, 5, G4[2], { e: 3, nu: 8, nv: 4 });
  })];
}
