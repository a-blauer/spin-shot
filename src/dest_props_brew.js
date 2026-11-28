// Sculpted pieces for the Brewery, in the Works: the tower brewhouse, the coppers and their open shed, the fermenting
// tuns (one burst) and the arcaded shed they stand in, the maltings' kiln, the hop garden's oast, rows of hops, the
// canal barge and its lock gates, the steam dray, the overhead mains on their trestles, the cooper's lean-to and his
// fire, a pile of barrels, the inn's sign. Same rules as dest_props.js: UE frame (X the front, Y right, Z up), [key,
// build] pairs, keys carry every number the shape depends on, things stand on z = 0, every piece whole. A piece with a
// glowing part returns { main, glow }: draw both at the same place.
import { shapeB as shape } from './propkit.js';
import { dark, mix } from './village_shapes.js';
import { q, rng } from './dest_props.js';
import { KC, brickRun } from './dest_props_works.js';

export const BW = {
  copper: 0xc8763e, copperL: 0xe09656, copperD: 0x94502a, verd: 0x5a9a80, oak: [0x7a5a3c, 0x6e5034, 0x86643f], oakD: 0x4e3826,
  hop: [0x4e7e30, 0x5a8a36, 0x466e2a], cone: 0xb8d07a, pole: 0x6a5238, earth: 0x5a4a36, white: 0xece6d8, tile: [0x8a4a32, 0x7e4230, 0x96543a],
  paint: 0x2e5a42, paintR: 0x9a3428, foam: 0xd8c8a0,
};
const N = (s) => Math.abs(Math.round(s)) || 0;
const deg = (r) => (r * 180) / Math.PI;
const pick = (a, i) => a[((i % a.length) + a.length) % a.length];
const pair = (key, draw) => ({ main: [key, shape((G) => draw(G, null))], glow: [key + '|glow', shape((P) => draw(null, P))] });

// ---- a round-headed window drawn on a wall's face: dark glass, cream bars, a brick arch ring, a stone sill. P(u, d, z)
// maps along-the-face u, out-from-the-face d and height z to the piece's frame; the face's own axis says which way a box
// is thin (ax 'x': the face is a plane of constant x)
const winOn = (G, P, ax, u, z0, w, h) => {
  const bx = (uu, d, z, hu, hd, hz, c) => { const [x, y, zz] = P(uu, d, z); if (ax === 'x') G.box(x, y, zz, hd, hu, hz, c); else G.box(x, y, zz, hu, hd, hz, c); };
  const r = w / 2, zt = z0 + h;
  bx(u, 1.5, z0 + h / 2, r, 1.5, h / 2, KC.glass);
  { const ring = []; for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI; ring.push(P(u + Math.cos(a) * r, 1.5, zt + Math.sin(a) * r)); } G.fan(...P(u, 1.5, zt), ring, KC.glass); }
  bx(u, 3.2, z0 + h / 2 + r / 2, 1.6, 1.4, h / 2 + r / 2, KC.cream); for (const f of [0.33, 0.66]) bx(u, 3.2, z0 + h * f, r, 1.4, 1.6, KC.cream); bx(u, 3.2, zt, r, 1.4, 1.6, KC.cream);
  for (const s of [-1, 1]) bx(u + s * (r + 3), 3, z0 + h / 2, 3, 3, h / 2, KC.cream);
  G.surf((a, v) => { const t = Math.PI * a, rr = r + 2 + v * 14; return P(u + Math.cos(t) * rr, 4, zt + Math.sin(t) * rr); }, 0, 1, 8, 0, 1, 1, KC.brick[2]);
  G.surf((a, v) => { const t = Math.PI * a, rr = r + 2 + 14; return P(u + Math.cos(t) * rr, 4 * v, zt + Math.sin(t) * rr); }, 0, 1, 8, 0, 1, 1, KC.brick[2]);
  bx(u, 6, z0 - 6, r + 12, 6, 5, KC.trim);
};

// ---- the brewhouse: a tower brewery of five storeys in brick, its front (+X) and back five bays, its ends four, each
// bay between brick pilasters, a round-headed window to every bay and floor, stone string courses at the floors, a
// corbelled cornice; the cart door in the middle of the front; the lucam at the top of the front with its doors, the
// hoist beam out of it and the chain down with a sack on the hook; a slate roof with brick gables, the louvred
// ventilator along its ridge with a vane on top, iron gutters and downpipes
export const BRW = { W: 700, D: 900, H: 1440, g: 440, fl: 250, pitch: 0.8, over: 40 };
BRW.ridge = BRW.H + (BRW.W / 2) * BRW.pitch;
export function brewhouse(seed = 1) {
  seed = N(seed);
  return ['bwhouse2|' + (seed % 2), shape((G) => {
    const { W, D, H, g, fl, pitch, over, ridge } = BRW, hw = W / 2, hd = D / 2, t = 30;
    for (const sx of [-1, 1]) brickRun(G, -hd, hd, sx * (hw - t / 2), 0, H, t, seed + (sx > 0 ? 1 : 2), true, true);
    for (const sy of [-1, 1]) brickRun(G, -hw + t, hw - t, sy * (hd - t / 2), 0, H, t, seed + (sy > 0 ? 3 : 4), false, true);
    // the faces: P maps (u along, d out, z) for each; front +X, back -X, ends +Y / -Y
    const F = [{ ax: 'x', P: (u, d, z) => [hw + d, u, z], L: D, n: 5 }, { ax: 'x', P: (u, d, z) => [-hw - d, -u, z], L: D, n: 5 }, { ax: 'y', P: (u, d, z) => [-u, hd + d, z], L: W, n: 4 }, { ax: 'y', P: (u, d, z) => [u, -hd - d, z], L: W, n: 4 }];
    F.forEach(({ ax, P, L, n }, fi) => {
      const bx = (u, d, z, hu, hdd, hz, c) => { const [x, y, zz] = P(u, d, z); if (ax === 'x') G.box(x, y, zz, hdd, hu, hz, c); else G.box(x, y, zz, hu, hdd, hz, c); };
      for (let i = 0; i <= n; i++) { const u = -L / 2 + (L * i) / n + (i === 0 ? 22 : i === n ? -22 : 0); bx(u, 7, H / 2 - 20, 22, 7, H / 2 - 20, KC.brick[3]); }
      for (const z of [g, g + fl, g + fl * 2, g + fl * 3]) bx(0, 5, z, L / 2 + 10, 5, 6, KC.trim);
      bx(0, 4, H - 34, L / 2 + 8, 4, 5, KC.brick[1]); bx(0, 9, H - 22, L / 2 + 14, 9, 6, KC.brick[2]); bx(0, 15, H - 8, L / 2 + 20, 15, 8, KC.trim);
      for (let i = 0; i < n; i++) { const u = -L / 2 + (L * (i + 0.5)) / n;
        if (!(fi === 0 && i === 2)) winOn(G, P, ax, u, 90, 100, 220);
        for (let f = 0; f < 4; f++) { if (fi === 0 && i === 2 && f === 3) continue; winOn(G, P, ax, u, g + f * fl + 40, 90, f < 3 ? 130 : 100); } }
    });
    // the cart door: two planked leaves in a stone-ringed arch, iron straps
    { const P = F[0].P, bx = (u, d, z, hu, hdd, hz, c) => { const [x, y, zz] = P(u, d, z); G.box(x, y, zz, hdd, hu, hz, c); };
      for (const s of [-1, 1]) { bx(s * 60, 2, 130, 58, 2, 130, KC.green); for (let k = 0; k < 5; k++) bx(s * (14 + k * 22), 4.5, 130, 1, 0.8, 124, dark(KC.green, 0.8)); for (const z of [50, 210]) bx(s * 60, 5, z, 54, 1, 4, KC.iron); }
      { const ring = []; for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI; ring.push(P(Math.cos(a) * 120, 2, 260 + Math.sin(a) * 120)); } G.fan(...P(0, 2, 260), ring, KC.green); }
      G.surf((a, v) => { const tt = Math.PI * a, rr = 122 + v * 22; return P(Math.cos(tt) * rr, 5, 260 + Math.sin(tt) * rr); }, 0, 1, 10, 0, 1, 1, KC.trim);
      for (const s of [-1, 1]) bx(s * 133, 4, 130, 11, 4, 130, KC.trim); bx(0, 6, 4, 150, 6, 4, KC.trimD); }
    // the lucam: a boarded box out of the top floor, its doors, its own gable roof running back into the main roof
    { const x0 = hw, x1 = hw + 120, z0 = H - 240, z1 = H + 30, w = 110, rz = z1 + 108;
      G.box((x0 + x1) / 2 - 10, 0, (z0 + z1) / 2, (x1 - x0) / 2 + 10, w, (z1 - z0) / 2, KC.woodD);
      for (const s of [-1, 1]) G.box(x1 + 2, s * 42, z0 + 112, 2, 40, 104, KC.green); G.box(x1 + 3, 0, z0 + 8, 3, w, 6, KC.woodD); G.box(x1 + 3, 0, z1 - 4, 3, w, 6, KC.woodD);
      for (const s of [-1, 1]) G.surf((u, v) => { const x = (x0 - 160) + (x1 + 22 - (x0 - 160)) * u, y = s * (w + 18) * (1 - v), z = z1 + (rz - z1) * v; return [x, y, z + 3]; }, 0, 1, 6, 0, 1, 3, (u, v) => KC.slate[Math.floor(v * 3 + u * 2) % 3]);
      { const tri = []; for (let i = 0; i <= 6; i++) { const y = -w - 18 + ((2 * w + 36) * i) / 6; tri.push([x1 + 22, y, z1 + (rz - z1) * (1 - Math.abs(y) / (w + 18))]); } G.fan(x1 + 21, 0, z1, tri, KC.woodD); }
      G.box(x1 + 20, 0, rz - 6, (x1 - x0 + 200) / 2, 6, 5, 0x6a6a70);
      // the hoist beam, its pulley, the chain down, a sack on the hook
      G.box(x1 + 60, 0, z1 + 40, 92, 10, 10, KC.woodD);
      { const b = G.n; G.lathe([[0, -4], [20, -4], [20, 4], [0, 4]], KC.iron, 10); G.place(b, { x: x1 + 138, y: 0, z: z1 + 18, roll: 90 }); }
      G.tube([[x1 + 158, 0, z1 + 18], [x1 + 158, 0, 690]], 2, KC.iron, { S: 4, M: 4 }); G.tube([[x1 + 158, 0, 694], [x1 + 158, 0, 676], [x1 + 166, 0, 668]], 2.5, KC.iron, { S: 4, M: 4 });
      G.blob(x1 + 160, 0, 636, 26, 22, 36, 0xd8c8a0, { nu: 10, nv: 6 }); }
    // the roof: slate courses both slopes from the eaves to the ridge, the gables in brick with stone copings
    const rows = 16;
    for (const sx of [-1, 1]) {
      const xa = sx * (hw + over), za = H - over * pitch, nz = Math.cos(Math.atan(pitch)), nx = sx * Math.sin(Math.atan(pitch));
      G.surf((u, v) => { const x = xa * (1 - v), z = za + (ridge - za) * v, lift = ((v * rows) % 1) * 3; return [x + nx * lift, -hd - over + u * (D + over * 2), z + nz * lift + 3]; }, 0, 1, 12, 0, 1, rows * 2, (u, v) => KC.slate[(Math.floor(v * rows) * 7 + Math.floor(u * 9)) % 3]);
      G.box(xa, 0, za - 4, 7, hd + over, 7, KC.iron);
      for (const sy of [-1, 1]) G.tube([[xa, sy * (hd + over - 12), za - 4], [sx * (hw + 10), sy * (hd - 12), za - 30], [sx * (hw + 10), sy * (hd - 12), 12]], 5, KC.iron, { S: 6, M: 10 });
    }
    for (const sy of [-1, 1]) { const gab = (x) => H + (hw - Math.abs(x)) * pitch; for (let x = -hw; x < hw - 1; x += 35) { const top = gab(x + 17.5 > 0 ? x + 35 : x); G.box(x + 17.5, sy * (hd - t / 2), (H + top) / 2, 17.5, t / 2, (top - H) / 2 + 0.5, KC.brick[(Math.round(x / 35) + 8) % 4]); }
      for (const sx of [-1, 1]) { const b = G.n, L = Math.hypot(hw + 12, (hw + 12) * pitch); G.box(L / 2, 0, 0, L / 2 + 6, t / 2 + 6, 7, KC.trim); G.place(b, { x: sx * (hw + 12), y: sy * (hd - t / 2), z: H - 12 * pitch + 10, yaw: sx > 0 ? 180 : 0, pitch: -deg(Math.atan(pitch)) }); } }
    G.box(0, 0, ridge + 6, 10, hd + over + 2, 7, 0x6a6a70);
    // the louvred ventilator on the ridge: posts, slats leaning out, boarded ends, its own little roof, a vane
    { const z0 = ridge - 8, z1 = ridge + 150, hl = 170, hwv = 70;
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.box(sx * hwv, sy * hl, (z0 + z1) / 2, 6, 6, (z1 - z0) / 2, KC.cream);
      for (const sx of [-1, 1]) for (let z = z0 + 20; z < z1 - 8; z += 22) { const b = G.n; G.box(0, 0, 0, 2, hl - 4, 10, KC.cream); G.place(b, { x: sx * (hwv - 2), z, roll: 0, pitch: sx * 35 }); }
      for (const sy of [-1, 1]) G.box(0, sy * hl, (z0 + z1) / 2, hwv, 3, (z1 - z0) / 2, KC.cream);
      G.box(0, 0, z0 + 4, hwv, hl, 4, KC.slate[0]); for (const sx of [-1, 1]) { const zb = ridge - hwv * pitch + 1; G.box(sx * hwv, 0, (zb + z0) / 2, 3, hl, (z0 - zb) / 2 + 1, KC.slate[2]); }
      G.box(0, 0, z1 + 1.5, hwv + 6, hl + 6, 1.5, KC.cream);
      for (const sx of [-1, 1]) G.surf((u, v) => [sx * (hwv + 22) * (1 - v), -hl - 18 + u * (hl * 2 + 36), z1 - 6 + v * 50], 0, 1, 4, 0, 1, 2, KC.slate[1]);
      for (const sy of [-1, 1]) G.fan(0, sy * (hl + 6), z1 - 6, [[-hwv - 22, sy * (hl + 6), z1 - 6], [0, sy * (hl + 6), z1 + 44], [hwv + 22, sy * (hl + 6), z1 - 6]], KC.cream);
      G.box(0, 0, z1 + 46, 5, hl + 20, 4, 0x6a6a70);
      G.tube([[0, 0, z1 + 42], [0, 0, z1 + 170]], 2.2, KC.iron, { S: 5, M: 3 }); G.box(0, 0, z1 + 150, 46, 1.5, 7, KC.iron); G.box(42, 0, z1 + 150, 8, 1.5, 12, KC.iron); G.blob(0, 0, z1 + 172, 6, 6, 6, KC.brass, { nu: 8, nv: 5 });
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) G.box(dx * 16, dy * 16, z1 + 126, dx ? 14 : 1, dy ? 14 : 1, 1, KC.iron); }
  })];
}

// ---- a copper: the vessel the wort is boiled in, set in brick over its fire: a square plinth with a stone top, the
// firebox door and the ash pit at its front (+X); the copper's body bellied and riveted in bands, its domed lid with a
// manhole, the vapour pipe up from the dome (to flueTop), the run-off pipe out of its side (+Y) with its valve, a gauge
export const CK = { r: 170, base: 120, h: 300 };
export function copperKettle(flueTop = 900, seed = 1) {
  flueTop = q(flueTop, 20); seed = N(seed);
  return ['bwcopper|' + [flueTop, seed % 2].join('|'), shape((G) => {
    const { r, base, h } = CK, s = r + 40, top = base + h + 96;
    for (const sy of [-1, 1]) brickRun(G, -s, s, sy * (s - 15), 0, base, 30, seed + sy, false, true);
    for (const sx of [-1, 1]) brickRun(G, -s + 30, s - 30, sx * (s - 15), 0, base, 30, seed + 3 + sx, true, true);
    G.box(0, 0, base + 5, s + 8, s + 8, 6, KC.trim);
    G.box(s + 1, 0, 64, 2, 46, 34, 0x1a1614); G.box(s + 3, 0, 64, 2, 40, 30, KC.iron); G.box(s + 6, 18, 64, 2, 4, 3, KC.brass); G.box(s + 1, 0, 14, 2, 36, 10, 0x1a1614);
    const prof = [[r * 0.72, base + 8], [r * 0.95, base + 34], [r, base + 76], [r, base + h - 40], [r * 0.95, base + h - 8], [r * 0.84, base + h + 30], [r * 0.6, base + h + 70], [r * 0.26, base + h + 92], [0, top]];
    const L = (v) => { const p = v * (prof.length - 1), i = Math.min(prof.length - 2, Math.floor(p)), f = p - i; return [prof[i][0] + (prof[i + 1][0] - prof[i][0]) * f, prof[i][1] + (prof[i + 1][1] - prof[i][1]) * f]; };
    G.surf((u, v) => { const [pr, pz] = L(v), a = u * Math.PI * 2; return [Math.cos(a) * pr, Math.sin(a) * pr, pz]; }, 0, 1, 24, 0, 1, 16, (u, v) => { const k = Math.max(0, Math.sin(u * Math.PI * 10 + 1.3) - 0.6) * 2.4 * (v < 0.35 ? 1 - v * 2.2 : 0.2); return mix(v > 0.62 ? BW.copperL : BW.copper, BW.verd, Math.min(0.45, k)); }, true);
    G.lathe([[0, base + 8], [r * 0.72, base + 8]], BW.copperD, 24);
    for (const z of [base + 76, base + 160, base + h - 40]) G.lathe([[r + 2.5, z - 3], [r + 2.5, z + 3]], BW.copperD, 24);
    G.lathe([[0, top - 2], [34, top - 2], [34, top + 12], [30, top + 14], [0, top + 14]], BW.copperD, 16);
    G.tube([[0, 0, top + 10], [0, 0, flueTop]], 18, (t) => (t > 0.96 ? KC.iron : BW.copperD), { S: 10, M: 6 }); G.lathe([[24, flueTop - 4], [24, flueTop + 8], [0, flueTop + 8]], KC.iron, 10);
    G.tube([[0, r - 10, base + 60], [0, r + 60, base + 60], [0, r + 120, base + 60]], 12, BW.copperD, { S: 8, M: 4 }); G.lathe([[0, -3], [22, -3], [22, 3], [0, 3]], KC.brass, 10, [0, r + 80, base + 60]);
    { const b = G.n; G.lathe([[16, -2], [18, 0], [16, 2]], KC.iron, 12); G.box(0, 0, 0, 17, 1.2, 1.2, KC.iron); G.box(0, 0, 0, 1.2, 17, 1.2, KC.iron); G.place(b, { x: 0, y: r + 80, z: base + 92 }); } G.tube([[0, r + 80, base + 72], [0, r + 80, base + 90]], 2, KC.iron, { S: 4, M: 2 });
    { const b = G.n; G.lathe([[0, -4], [18, -4], [18, 4], [0, 4]], KC.brass, 12); G.lathe([[0, 4], [14, 4], [14, 5], [0, 5]], KC.cream, 12); G.place(b, { x: r + 3, y: 0, z: base + 200, pitch: 90 }); }
  })];
}
// ---- the copper house: open on every side, cast-iron columns, iron beams and trusses, a slate roof with a ridge
// vent. len along X, d deep; the coppers stand under it, their vapour pipes up through it
export const CS = { e: 600, pitch: 0.45 };
export function copperShed(len = 1000, d = 700) {
  len = q(len, 20); d = q(d, 20);
  return ['bwcshed|' + [len, d].join('|'), shape((G) => {
    const { e, pitch } = CS, hl = len / 2, hd = d / 2, n = Math.max(1, Math.round(len / 330)), tz = e + 28, rz = tz + hd * pitch;
    const xs = []; for (let i = 0; i <= n; i++) xs.push(-hl + (len * i) / n);
    for (const x of xs) for (const sy of [-1, 1]) { G.lathe([[17, 0], [17, 14], [10, 22], [9, 26], [8, e - 30], [12, e - 22], [17, e - 8], [17, e]], (k) => (k < 2 || k > 5 ? KC.ironL : KC.iron), 10, [x, sy * hd, 0]); G.box(x, sy * hd, 4, 22, 22, 4, KC.trimD); }
    for (const sy of [-1, 1]) G.box(0, sy * hd, e + 14, hl + 18, 9, 14, KC.iron);
    for (const x of xs) { G.box(x, 0, e + 14, 9, hd + 9, 14, KC.iron);
      for (const sy of [-1, 1]) { const b = G.n, L = Math.hypot(hd, rz - tz); G.box(0, 0, 0, L / 2, 4, 6, KC.iron); G.place(b, { x, y: sy * hd / 2, z: (tz + rz) / 2 + 2, roll: -sy * deg(Math.atan2(rz - tz, hd)) }); }
      G.box(x, 0, (tz + rz) / 2, 4, 4, (rz - tz) / 2, KC.iron); for (const sy of [-1, 1]) G.tube([[x, 0, tz + 4], [x, sy * hd * 0.5, (tz + rz) / 2 + 2]], 2.5, KC.iron, { S: 4, M: 2 }); }
    for (const sy of [-1, 1]) { G.surf((u, v) => [-hl - 34 + u * (len + 68), sy * (hd + 40) * (1 - v), tz - 40 * pitch + (rz - tz + 40 * pitch) * v + 6], 0, 1, Math.round(len / 60), 0, 1, 10, (u, v) => KC.slate[(Math.floor(v * 10) * 3 + Math.floor(u * 11)) % 3]); G.box(0, sy * (hd + 40), tz - 40 * pitch + 6, hl + 34, 6, 6, KC.iron); }
    for (const sy of [-1, 1]) G.box(0, sy * 40, rz - 2, hl + 34, 2, 12, 0x4a4e54); G.box(0, 0, rz + 14, hl + 34, 46, 4, 0x4a4e54); for (const sy of [-1, 1]) for (let x = -hl; x <= hl; x += len / Math.max(1, Math.round(len / 120))) G.box(x, sy * 40, rz + 26, 3, 2, 12, KC.iron); G.box(0, 0, rz + 40, hl + 40, 52, 3, 0x4a4e54);
  })];
}
export const copperShedHangs = (len, d) => { const out = [], n = Math.max(1, Math.round(len / 330)); for (let i = 0; i <= n; i++) { const x = -len / 2 + (len * i) / n; for (const y of [-d / 4, d / 4]) out.push([x, y, CS.e]); } return out; };

// ---- a fermenting tun: a great upright cask of oak staves, iron hoops, the brew standing in it under a head of foam,
// a ladder up its side (+X). Burst: the staves on its -X side blown out and split, the hoops broken there, nothing in it
export const TUN = { r: 165, h: 360 };
export function tun(seed = 1, burst = false) {
  seed = N(seed);
  return ['bwtun2|' + [seed % 3, burst ? 1 : 0].join('|'), shape((G) => {
    const { r, h } = TUN, n = 26, R = rng(seed * 41 + 7), rad = (v) => r * (1 + 0.04 * Math.sin(v * Math.PI));
    const gone = (i) => burst && i >= 10 && i <= 15;
    for (let i = 0; i < n; i++) { if (gone(i)) continue; G.surf((u, v) => { const a = u * Math.PI * 2, rr = rad(v); return [Math.cos(a) * rr, Math.sin(a) * rr, v * h]; }, i / n, (i + 1) / n - 0.002, 1, 0, 1, 6, pick(BW.oak, i * 7 + seed)); }
    const arc = (z, rr, w2) => { const pts = []; for (let i = 0; i <= n; i++) { if (burst && i >= 10 && i <= 16) { if (pts.length) { G.tube(pts.slice(), w2, KC.iron, { S: 4, caps: 'flat' }); pts.length = 0; } continue; } const a = (i / n) * Math.PI * 2; pts.push([Math.cos(a) * rr, Math.sin(a) * rr, z]); } if (pts.length > 1) G.tube(pts, w2, KC.iron, { S: 4, caps: 'flat' }); };
    for (const z of [28, 112, 248, 332]) { const rr = rad(z / h) + 2.5; if (burst) arc(z, rr, 3.5); else G.lathe([[rr, z - 5], [rr, z + 5]], KC.iron, n, [0, 0, 0], [1, 1], true); }
    if (!burst) { G.lathe([[0, h - 40], [rad((h - 40) / h) - 0.5, h - 40]], BW.foam, n); G.lathe([[r - 8, h - 2], [r + 3, h - 2], [r + 3, h + 3], [r - 8, h + 3], [r - 8, h - 2]], BW.oakD, n, [0, 0, 0], [1, 1], true); }
    else { G.lathe([[0, 1], [r - 0.5, 1]], 0x3a2a1e, n);
      for (let k = 0; k < 6; k++) { const i = 10 + k, a = ((i + 0.5) / n) * Math.PI * 2, lean = 20 + R() * 40, L = h * (0.35 + R() * 0.4), b = G.n; G.box(0, 0, L / 2, 4, r * 0.12, L / 2, pick(BW.oak, i)); G.place(b, { x: Math.cos(a) * (r + 2), y: Math.sin(a) * (r + 2), yaw: deg(a), pitch: lean }); }
      for (let k = 0; k < 3; k++) { const a = ((11 + k * 2) / n) * Math.PI * 2 + 0.1, d = r + 80 + R() * 90, b = G.n; G.box(0, 0, 4, h * 0.3, r * 0.12, 4, pick(BW.oak, k + 3)); G.place(b, { x: Math.cos(a) * d, y: Math.sin(a) * d, yaw: deg(a) + 70 + R() * 40 }); } }
    for (const s of [-1, 1]) G.tube([[r + 96, s * 24, -4], [r + 2, s * 24, h + 20]], 3.5, BW.oakD, { S: 5, M: 3 });
    for (let k = 1; k < 13; k++) { const t = k / 13, x = r + 96 - 94 * t, z = -4 + (h + 24) * t; G.box(x, 0, z, 2.5, 24, 2.5, BW.oakD); }
  })];
}
// ---- the fermenting shed: an arcade of brick piers and round arches along its front (-Y), solid brick behind and at
// the ends, a slate roof; len along X, d deep. The tuns stand in a row inside it
export const TS = { e: 560, spring: 300, bay: 300, pitch: 0.5 };
export function tunShed(len = 1500, d = 640, seed = 1) {
  len = q(len, 20); d = q(d, 20); seed = N(seed);
  return ['bwtshed2|' + [len, d, seed % 2].join('|'), shape((G) => {
    const { e, spring, bay, pitch } = TS, hl = len / 2, hd = d / 2, t = 34, n = Math.round(len / bay), b0 = len / n, ar = (b0 - 70) / 2, ridge = e + hd * pitch;
    brickRun(G, -hl, hl, hd - t / 2, 0, e, t, seed + 1, false, true);
    for (const sx of [-1, 1]) brickRun(G, -hd, hd, sx * (hl - t / 2), 0, e, t, seed + 2 + sx, true, true);
    for (let i = 0; i <= n; i++) { const x = -hl + b0 * i, w = i === 0 || i === n ? 50 : 35; brickRun(G, x - w + (i === 0 ? w : 0), x + w - (i === n ? w : 0), -hd + t / 2, 0, spring + 6, t, seed + 5 + i, false, true); G.box(x, -hd - 1, spring + 3, 42, t / 2 + 3, 5, KC.trim); }
    for (let i = 0; i < n; i++) { const xc = -hl + b0 * (i + 0.5);
      for (const yy of [-hd - 1, -hd + t + 1]) G.surf((a, v) => { const tt = Math.PI * a, rr = ar + v * 18; return [xc + Math.cos(tt) * rr, yy, spring + Math.sin(tt) * rr]; }, 0, 1, 10, 0, 1, 1, KC.brick[2]);
      G.surf((a, v) => { const tt = Math.PI * a; return [xc + Math.cos(tt) * ar, -hd - 1 + v * (t + 2), spring + Math.sin(tt) * ar]; }, 0, 1, 10, 0, 1, 1, KC.brick[1]);
      for (let x = xc - b0 / 2; x < xc + b0 / 2 - 1; x += 30) { const xm = x + 15, dx = Math.abs(xm - xc), z0 = dx < ar ? spring + Math.sqrt(ar * ar - dx * dx) : spring; G.box(xm, -hd + t / 2, (z0 + e) / 2, 15, t / 2, (e - z0) / 2 + 0.5, KC.brick[(i + Math.round(x / 30)) % 4]); } }
    G.box(0, -hd + t / 2, e - 10, hl, t / 2 + 4, 10, KC.trim);
    for (const sy of [-1, 1]) G.surf((u, v) => { const y = sy * (hd + 40) * (1 - v); return [-hl - 30 + u * (len + 60), y, e + (hd - Math.abs(y)) * pitch + 2]; }, 0, 1, Math.round(len / 70), 0, 1, 10, (u, v) => KC.slate[(Math.floor(v * 10) * 5 + Math.floor(u * 13)) % 3]);
    for (const sx of [-1, 1]) { for (let z = e, k = 0; ; z += 20, k++) { const half = hd - (z + 20 - e) / pitch; if (half < 10) break; G.box(sx * (hl - t / 2), 0, z + 10, t / 2, half, 10, KC.brick[(k + 5) % 4]); }
      for (const sy of [-1, 1]) { const b = G.n, L = Math.hypot(hd + 40, (hd + 40) * pitch); G.box(0, L / 2, 0, 4, L / 2 + 4, 10, KC.woodD); G.place(b, { x: sx * (hl + 30), y: sy * (hd + 40), z: e - 40 * pitch - 4, yaw: sy > 0 ? 180 : 0, roll: deg(Math.atan(pitch)) }); } }
    G.box(0, 0, ridge + 6, hl + 32, 9, 6, 0x6a6a70); for (const sy of [-1, 1]) G.box(0, sy * (hd + 40), e - 40 * pitch - 2, hl + 30, 6, 6, KC.iron);
    G.box(0, 0, 2, hl - t, hd - t, 2, 0x5a544a);
  })];
}

// ---- a malt kiln: a square brick tower, its door and a little window, a steep pyramid of slates up to the louvred
// cowl that lets the kiln's heat out, a finial on that
export const KILN = { s: 520, e: 500, zt: 860 };
export function maltKiln(seed = 1) {
  seed = N(seed);
  return ['bwkiln2|' + (seed % 2), shape((G) => {
    const { s, e, zt } = KILN, h = s / 2, t = 34, ov = 34, c = 62, ct = c + 6, slope = (zt - e) / (h - ct), ze = e - ov * slope;
    for (const sy of [-1, 1]) brickRun(G, -h, h, sy * (h - t / 2), 0, e, t, seed + sy, false, true);
    for (const sx of [-1, 1]) brickRun(G, -h + t, h - t, sx * (h - t / 2), 0, e, t, seed + 4 + sx, true, true);
    G.box(0, 0, e - 6, h + 8, h + 8, 6, KC.trim);
    G.box(h + 1, 0, 110, 2, 56, 110, KC.green); G.box(h + 3, 0, 110, 1, 1.5, 104, dark(KC.green, 0.8)); G.box(h + 2, 0, 226, 4, 66, 6, KC.trim); G.box(h + 1, 0, 360, 2, 36, 44, KC.glass); G.box(h + 3, 0, 314, 5, 44, 4, KC.trim);
    // the roof: four faces from the eaves (out past the walls, through the walls' top edges) up to the cowl's square
    const faces = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    for (const [fx, fy] of faces) { const edge = (u, k) => { const w = -k + u * 2 * k; return fx ? [fx * k, fx * w] : [-fy * w, fy * k]; };
      G.surf((u, v) => { const [x0, y0] = edge(u, h + ov), [x1, y1] = edge(u, ct); return [x0 + (x1 - x0) * v, y0 + (y1 - y0) * v, ze + (zt - ze) * v + 2]; }, 0, 1, 6, 0, 1, 12, (u, v) => KC.slate[(Math.floor(v * 12) * 2 + Math.floor(u * 5)) % 3]); }
    for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) G.tube([[sx * (h + ov), sy * (h + ov), ze + 4], [sx * ct, sy * ct, zt + 4]], 5, 0x6a6a70, { S: 5, M: 3 });
    // the cowl: a louvred box on the roof's top, a little pyramid cap, a finial
    { const z0 = zt, z1 = zt + 110;
      G.box(0, 0, z0 + 3, ct, ct, 4, BW.white);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.box(sx * c, sy * c, (z0 + z1) / 2, 5, 5, (z1 - z0) / 2, BW.white);
      for (const [fx, fy] of faces) for (let z = z0 + 18; z < z1 - 6; z += 18) { const b = G.n; G.box(0, 0, 0, 2, c - 3, 8, BW.white); G.place(b, { x: fx * (c - 1), y: fy * (c - 1), z, yaw: fy ? 90 : 0, pitch: (fx || fy) * 35 }); }
      G.box(0, 0, z1 + 1, c + 16, c + 16, 2, KC.slate[2]);
      for (const [fx, fy] of faces) G.fan(0, 0, z1 + 60, [[fx ? fx * (c + 16) : -(c + 16), fy ? fy * (c + 16) : (c + 16), z1 + 2], [fx ? fx * (c + 16) : (c + 16), fy ? fy * (c + 16) : -(c + 16), z1 + 2]], KC.slate[1]);
      G.tube([[0, 0, z1 + 56], [0, 0, z1 + 160]], 2.5, KC.iron, { S: 5, M: 3 }); G.blob(0, 0, z1 + 162, 7, 7, 7, KC.brass, { nu: 8, nv: 5 }); }
  })];
}
// ---- the oast: a round brick kiln for the hops, a cone of tiles, the white cowl turning on its top with its vane (the
// fly) to keep its mouth out of the wind; a door at its foot
export const OAST = { r: 230, e: 440, top: 1000 };
export function oast(seed = 1) {
  seed = N(seed);
  return ['bwoast2|' + (seed % 2), shape((G) => {
    const { r, e, top } = OAST, zc = top - 140;
    const wall = []; for (let z = 0; z <= e; z += 20) wall.push([r, z]); G.lathe(wall, (k) => KC.brick[(k * 3 + seed) % 4], 24);
    G.lathe([[r + 8, e - 10], [r + 8, e], [r - 4, e]], KC.trim, 24);
    const sl = (zc - e) / (r - 40), cone = []; for (let k = 0; k <= 16; k++) { const rr = (r + 34) * (1 - k / 16) + 40 * (k / 16); cone.push([rr, e + (r - rr) * sl + 1]); } G.lathe(cone, (k) => pick(BW.tile, k + seed), 24, [0, 0, 0], [1, 1], true);
    G.lathe([[40, zc], [40, zc + 12], [0, zc + 12]], BW.white, 16);
    G.lathe([[48, zc + 10], [48, zc + 110], [0, zc + 110]], BW.white, 16);
    G.blob(0, 0, zc + 110, 50, 50, 46, BW.white, { nu: 12, nv: 6, warp: (x, y, z) => [x, y, Math.max(0, z)] });
    G.box(48, 0, zc + 70, 3, 26, 36, 0x2a2420);
    G.box(-50, 0, zc + 110, 70, 2, 36, BW.white); G.box(-112, 0, zc + 110, 10, 3, 40, BW.white);
    G.tube([[0, 0, zc + 150], [0, 0, top + 60]], 2.5, KC.iron, { S: 5, M: 3 }); G.box(0, 0, top + 40, 26, 1.2, 5, KC.iron);
    G.box(r - 2, 0, 110, 4, 52, 110, KC.green); G.box(r + 1, 0, 226, 6, 60, 6, KC.trim);
  })];
}
// ---- a row of hops: poles every so far along X with the wire from top to top, the strings in a V from every hill up
// to the wire, the bines climbing them in leaf, the cones hanging pale near the top, raking props at the ends
export function hopRow(len = 1500, seed = 1) {
  len = q(len, 100); seed = N(seed);
  return ['bwhops4|' + [len, seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 59 + len), hl = len / 2, H = 520, n = Math.round(len / 300), wz = H - 12;
    for (let i = 0; i <= n; i++) { const x = -hl + (len * i) / n; G.tube([[x, 0, -10], [x, 0, H]], 7, BW.pole, { S: 6, M: 2 }); }
    G.tube([[-hl, 0, wz], [hl, 0, wz]], 1.4, KC.iron, { S: 4, M: 20, caps: false });
    for (const s of [-1, 1]) G.tube([[s * (hl - 150), 0, -10], [s * hl, 0, H * 0.7]], 5, BW.pole, { S: 5, M: 2 });
    for (let x = -hl + 75; x < hl - 70; x += 150) {
      G.blob(x, 0, 0, 30, 22, 12, BW.earth, { nu: 8, nv: 4 });
      for (const s of [-1, 1]) { const tx = x + s * 70, pts = [[x, 0, 4], [x + (tx - x) * 0.33, 0, wz * 0.33], [x + (tx - x) * 0.66, 0, wz * 0.66], [tx, 0, wz]];
        G.tube(pts, (t) => 3 + Math.sin(t * 9) * 0.8, (t) => pick(BW.hop, Math.floor(t * 5) + (s > 0 ? 1 : 0)), { S: 5, M: 10 });
        for (let k = 0; k < 3; k++) { const t = 0.28 + k * 0.24, px = x + (tx - x) * t, pz = 4 + (wz - 4) * t; G.blob(px, (k % 2 ? 1 : -1) * 5, pz, 18, 6, 15, pick(BW.hop, k + seed), { nu: 6, nv: 4 }); }
        for (let k = 0; k < 2; k++) { const t = 0.84 + k * 0.08, px = x + (tx - x) * t, pz = 4 + (wz - 4) * t; G.blob(px, (k % 2 ? 1 : -1) * 5, pz, 6, 6, 9, BW.cone, { nu: 6, nv: 4 }); } } }
  })];
}

// ---- a canal barge, its bow +X: a black hull with a red top strake, rubbing strakes, the hold amidships full of barrels
// lying across it, the cabin aft painted green and red with its windows and chimney, the tiller over its roof
export const BG = { len: 900, w: 200, h: 84 };
export function barge(seed = 1) {
  seed = N(seed);
  return ['bwbarge2|' + (seed % 2), shape((G) => {
    const { len, w, h } = BG, hl = len / 2, hw = w / 2, z0 = -24;
    const half = (u) => (u > 0.82 ? hw * Math.pow(Math.max(0, Math.cos(Math.min(1, (u - 0.82) / 0.18) * Math.PI / 2)), 0.7) : u < 0.05 ? hw * (0.86 + 0.14 * u / 0.05) : hw);
    const bot = (u) => (u > 0.86 ? z0 + (h * 0.6 - z0) * Math.pow((u - 0.86) / 0.14, 1.6) : z0);
    G.surf((u, v) => { const x = -hl + u * len, wd = Math.max(0.5, half(u)), b = bot(u); let y, z; if (v < 1 / 3) { y = -wd; z = h + (b - h) * (v * 3); } else if (v < 2 / 3) { y = -wd + 2 * wd * ((v - 1 / 3) * 3); z = b; } else { y = wd; z = b + (h - b) * ((v - 2 / 3) * 3); } return [x, y, z]; }, 0, 1, 40, 0, 1, 12, (u, v) => { const zz = v < 1 / 3 ? h + (z0 - h) * v * 3 : v > 2 / 3 ? z0 + (h - z0) * (v - 2 / 3) * 3 : z0; return zz > h - 22 ? BW.paintR : 0x1e2224; });
    for (const s of [-1, 1]) { const pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([-hl + u * len, s * (half(u) + 2), h]); } G.tube(pts, 4, BW.oakD, { S: 5, M: 40 }); const p2 = pts.map(([x, y]) => [x, y * 1.01 + s * 1, h - 34]); G.tube(p2, 3, 0x2a2a2a, { S: 4, M: 40 }); }
    { const ring = []; for (let i = 0; i <= 12; i++) { const v = i / 12, wd = half(0), b = bot(0); let y, z; if (v < 1 / 3) { y = -wd; z = h + (b - h) * (v * 3); } else if (v < 2 / 3) { y = -wd + 2 * wd * ((v - 1 / 3) * 3); z = b; } else { y = wd; z = b + (h - b) * ((v - 2 / 3) * 3); } ring.push([-hl, y, z]); } G.fan(-hl, 0, h, ring, 0x1e2224); }
    G.tube([[hl - 4, 0, h * 0.6], [hl + 6, 0, h + 10]], 6, BW.oakD, { S: 6, M: 3 });
    G.box(-hl * 0.02, 0, 20, hl * 0.56, hw - 6, 3, 0x3a2e24);
    for (const x of [-hl * 0.58 + 2, hl * 0.54]) G.box(x, 0, h / 2 + 6, 4, hw - 5, h / 2 - 2, BW.oakD);
    const brl = (x, y, z) => { const b = G.n, c = pick(BW.oak, Math.round(x + y)); G.lathe([[26, -42], [31, -22], [32, 0], [31, 22], [26, 42]], (k) => (k % 2 ? c : dark(c, 0.88)), 12); for (const zz of [-34, -12, 12, 34]) G.lathe([[Math.abs(zz) > 20 ? 29.5 : 32.5, zz - 3], [Math.abs(zz) > 20 ? 29.5 : 32.5, zz + 3]], KC.iron, 12); G.lathe([[0, 40], [26, 40]], dark(c, 0.8), 12); G.lathe([[0, -40], [26, -40]], dark(c, 0.8), 12); G.place(b, { x, y, z, roll: 90 }); };
    for (let x = -hl * 0.5; x <= hl * 0.46; x += 66) { brl(x, -44, 56); brl(x, 44, 56); }
    for (let x = -hl * 0.5 + 33; x <= hl * 0.46 - 30; x += 66) brl(x, 0, 102);
    { const x0 = -hl + 40, x1 = -hl * 0.58, ch = h + 100, cw = hw - 6; G.box((x0 + x1) / 2, 0, (h + ch) / 2, (x1 - x0) / 2, cw, (ch - h) / 2, BW.paint);
      for (const s of [-1, 1]) { G.box((x0 + x1) / 2, s * (cw + 1), h + 14, (x1 - x0) / 2, 1.5, 8, BW.paintR); for (const dx of [-0.25, 0.25]) G.box((x0 + x1) / 2 + dx * (x1 - x0), s * (cw + 1.5), h + 56, 16, 1.5, 16, KC.glass); }
      G.surf((u, v) => [x0 - 6 + u * (x1 - x0 + 12), -cw - 8 + v * (2 * cw + 16), ch + 1.5 + Math.sin(v * Math.PI) * 8], 0, 1, 2, 0, 1, 6, 0x3a3a3a);
      G.box(x0 - 4, 0, (h + ch) / 2, 4, cw, (ch - h) / 2, BW.paint);
      G.tube([[x1 - 40, 30, ch + 6], [x1 - 40, 30, ch + 70]], 6, KC.iron, { S: 8, M: 2 }); G.lathe([[7, ch + 40], [7, ch + 46]], KC.brass, 8, [x1 - 40, 30, 0]);
      G.tube([[-hl - 6, 0, h - 10], [-hl - 10, 0, ch + 30], [x0 + 30, 0, ch + 46], [x0 + 70, 0, ch + 44]], 4, BW.oakD, { S: 5, M: 10 }); G.box(-hl - 10, 0, h / 2 - 10, 10, 3, h / 2 + 4, 0x1e2224); }
    G.blob(hl + 4, 0, h * 0.7, 10, 16, 14, 0x9a8058, { nu: 8, nv: 5 });
  })];
}
// ---- a pair of lock gates across a canal w wide, mitred against the flow (pointing +X): planked leaves on heel and mitre
// posts, the walk-board along their tops with a handrail, the paddle gear, the balance beams out over the banks (-X)
export const LG = { h: 150 };
export function lockGates(w = 440) {
  w = q(w, 20);
  return ['bwlock|' + w, shape((G) => {
    const { h } = LG, a = (18 * Math.PI) / 180, hw = w / 2, L = hw / Math.cos(a);
    for (const s of [-1, 1]) { const b = G.n, ang = s * (90 - 18);
      G.box(L / 2, 0, (h - 40) / 2, L / 2, 11, (h + 40) / 2, BW.oak[1]);
      for (let k = 0; k < 6; k++) G.box(L / 2, -12, -40 + (k + 0.5) * ((h + 40) / 6), L / 2 - 6, 1.5, 2, BW.oakD);
      G.lathe([[14, -40], [14, h + 6]], BW.oakD, 8); G.lathe([[12, -40], [12, h + 4]], BW.oakD, 8, [L, 0, 0]);
      G.box(L / 2, 0, h + 3, L / 2 + 10, 13, 4, BW.oakD);
      G.box(L / 2, -26 * s, h - 2, L / 2, 14, 2.5, BW.oak[2]); for (let k = 0; k < 4; k++) G.box(k * (L / 3), -26 * s, h - 12, 3, 12, 8, KC.iron);
      for (let k = 0; k <= 3; k++) G.box(k * (L / 3), -38 * s, h + 40, 2.5, 2.5, 40, KC.iron); G.box(L / 2, -38 * s, h + 80, L / 2, 2.5, 2.5, KC.iron);
      G.box(L * 0.45, 0, h + 30, 9, 9, 26, KC.iron); G.tube([[L * 0.45, 0, h + 52], [L * 0.45, -18 * s, h + 52]], 2, KC.iron, { S: 4, M: 2 }); G.box(L * 0.45, -20 * s, h + 52, 2, 2, 10, KC.iron);
      G.place(b, { x: 0, y: s * hw, yaw: -ang + (s > 0 ? 0 : 0) });
      G.tube([[0, s * hw, h + 20], [-150, s * (hw + 60), h + 22], [-320, s * (hw + 120), h + 18]], 13, BW.oakD, { S: 6, M: 6 }); G.box(-320, s * (hw + 120), h + 18, 14, 14, 14, BW.oakD); }
  })];
}

// ---- a steam dray, its front +X: the cab with the upright boiler in it and the chimney up through its roof, the bed
// behind loaded with standing barrels, iron wheels (the back pair the bigger) on the chassis, a chain to the back axle
export function steamDray(seed = 1) {
  seed = N(seed);
  return ['bwdray|' + (seed % 2), shape((G) => {
    const wheel = (x, y, r, w) => { const b = G.n; G.lathe([[r, -w], [r, w], [r - 9, w], [r - 9, -w], [r, -w]], KC.iron, 16, [0, 0, 0], [1, 1], true); G.lathe([[0, -w - 4], [14, -w - 4], [14, w + 4], [0, w + 4]], KC.brass, 10);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, b2 = G.n; G.box((r - 9) / 2 + 6, 0, 0, (r - 9) / 2 - 4, 3, 2.5, BW.paintR); G.place(b2, { yaw: deg(a) }); } G.place(b, { x, y, z: r, roll: 90 }); };
    for (const s of [-1, 1]) { wheel(200, s * 96, 46, 10); wheel(-180, s * 104, 58, 12); }
    for (const s of [-1, 1]) { G.box(20, s * 78, 84, 300, 8, 12, KC.iron); G.box(200, s * 78, 62, 36, 7, 11, KC.iron); G.box(-180, s * 78, 66, 40, 7, 8, KC.iron); } G.box(200, 0, 46, 6, 96, 5, KC.iron); G.box(-180, 0, 58, 6, 104, 5, KC.iron);
    G.box(-100, 0, 100, 200, 104, 6, BW.oakD); for (const s of [-1, 1]) { G.box(-100, s * 104, 122, 200, 3, 18, BW.paint); for (const x of [-290, -190, -90, 10, 96]) G.box(x, s * 104, 126, 4, 4, 22, BW.oakD); } G.box(-298, 0, 122, 3, 104, 18, BW.paint);
    for (const x of [-240, -150, -60]) for (const y of [-52, 52]) { const c = pick(BW.oak, Math.round(x + y)); G.lathe([[28, 106], [33, 128], [34, 152], [33, 176], [28, 198]], (k) => (k % 2 ? c : dark(c, 0.88)), 12, [x, y, 0]); for (const z of [116, 136, 168, 188]) G.lathe([[z === 136 || z === 168 ? 34.6 : 31.5, z - 3], [z === 136 || z === 168 ? 34.6 : 31.5, z + 3]], KC.iron, 12, [x, y, 0]); G.lathe([[0, 194], [28, 194]], dark(c, 0.8), 12, [x, y, 0]); }
    G.box(200, 0, 100, 100, 100, 6, KC.iron); G.box(296, 0, 160, 6, 100, 56, BW.paint); G.box(250, 0, 140, 40, 70, 34, 0x24201e);
    G.lathe([[38, 104], [38, 300], [30, 316], [12, 322]], (k) => (k === 1 ? KC.iron : 0x3a3e44), 16, [180, 0, 0]); for (const z of [150, 220, 290]) G.lathe([[39.5, z - 3], [39.5, z + 3]], KC.brass, 16, [180, 0, 0]);
    G.tube([[180, 0, 318], [180, 0, 450]], 9, KC.iron, { S: 8, M: 3 }); G.lathe([[9, 438], [15, 452], [15, 458], [9, 458]], KC.iron, 8, [180, 0, 0]);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.tube([[200 + sx * 92, sy * 94, 104], [200 + sx * 92, sy * 94, 340]], 3, KC.iron, { S: 4, M: 2 });
    G.box(200, 0, 344, 104, 106, 4, BW.paint); G.box(200, 0, 349, 96, 98, 1.5, 0x3a3a3a);
    G.tube([[140, -50, 104], [150, -50, 190]], 3, KC.iron, { S: 4, M: 2 }); G.lathe([[16, -1.5], [18, 0], [16, 1.5]], KC.iron, 12, [150, -50, 192]); G.box(150, -50, 192, 17, 1.2, 1.2, KC.iron); G.box(150, -50, 192, 1.2, 17, 1.2, KC.iron); G.box(130, 40, 140, 22, 30, 4, BW.oakD); G.box(130, 40, 121, 18, 26, 17, BW.oakD);
    { const b = G.n; G.lathe([[24, -40], [24, 40]], 0x3a3e44, 12); G.place(b, { x: 40, y: 0, z: 70, pitch: 90 }); }
    { const loop = []; for (let k = 0; k <= 24; k++) { const a = (k / 24) * Math.PI * 2; loop.push([k < 12 ? 80 - 260 * (k / 12) : -180 + 260 * ((k - 12) / 12), 88, 58 + Math.sin(a) * 16]); } G.tube(loop, 2.5, KC.iron, { S: 4, M: 40 }); }
    G.box(-180, 88, 58, 6, 2, 22, KC.iron); G.box(80, 44, 58, 6, 46, 6, KC.iron);
  })];
}

// ---- the overhead mains: two pipes (copper and iron) along X at height h on iron trestles every span; flanged joints;
// at the +X end they turn down into the wort pump (an upright cylinder, a flywheel); the -X end runs on into a wall
export function pipeRun(L = 2000, h = 420, span = 500) {
  L = q(L, 50); h = q(h, 10); span = q(span, 50);
  return ['bwpipes|' + [L, h, span].join('|'), shape((G) => {
    const hl = L / 2, n = Math.max(1, Math.round(L / span)), sp = L / n;
    for (let i = 1; i < n; i++) { const x = -hl + sp * i;
      for (const s of [-1, 1]) { G.box(x, s * 70, h / 2 - 8, 6, 6, h / 2 - 8, KC.iron); G.box(x, s * 70, 6, 18, 18, 6, KC.trimD); }
      G.box(x, 0, h - 8, 8, 86, 8, KC.iron); for (const y of [-30, 30]) G.box(x, y, h + 2, 10, 16, 2, KC.iron);
      for (const [z0, z1] of [[16, h * 0.5], [h * 0.5, h - 18]]) { G.tube([[x, -70, z0], [x, 70, z1]], 2, KC.iron, { S: 4, M: 2 }); G.tube([[x, 70, z0], [x, -70, z1]], 2, KC.iron, { S: 4, M: 2 }); } }
    const pipe = (y, r, c, z) => { G.tube([[-hl, y, z], [hl - 60, y, z]], r, c, { S: 10, M: Math.round(L / 60), caps: 'flat' });
      for (let x = -hl + 120; x < hl - 80; x += 250) { const b = G.n; G.lathe([[0, -3], [r + 4, -3], [r + 4, 3], [0, 3]], dark(c, 0.8), 10); G.place(b, { x, y, z, pitch: 90 }); }
      G.tube([[hl - 70, y, z], [hl - 30, y, z], [hl - 12, y, z - 18], [hl - 12, y, z - 60]], r, c, { S: 10, M: 8 }); G.tube([[hl - 12, y, z - 60], [hl - 12, y, 150]], r, c, { S: 10, M: 4, caps: 'flat' }); };
    pipe(-30, 13, BW.copper, h + 13); pipe(30, 10, KC.ironL, h + 10);
    G.lathe([[60, 0], [60, 12], [44, 12], [44, 150], [50, 156], [50, 190], [0, 196]], (k) => (k < 2 ? KC.trimD : k < 5 ? KC.iron : KC.ironL), 14, [hl - 12, 0, 0]);
    { const b = G.n; G.lathe([[56, -5], [56, 5], [46, 5], [46, -5], [56, -5]], KC.iron, 16, [0, 0, 0], [1, 1], true); G.lathe([[0, -8], [10, -8], [10, 8], [0, 8]], KC.brass, 8); for (let k = 0; k < 6; k++) { const b2 = G.n; G.box(26, 0, 0, 20, 2.5, 2, KC.iron); G.place(b2, { yaw: k * 60 }); } G.place(b, { x: hl - 12, y: 84, z: 110, roll: 90 }); }
    G.box(hl - 12, 60, 110, 8, 26, 6, KC.iron);
  })];
}
export const pipeHangs = (L, h, span) => { const out = [], n = Math.max(1, Math.round(L / span)), sp = L / n; for (let i = 0; i < n; i++) { const x = -L / 2 + sp * (i + 0.5); if (x > L / 2 - 200) continue; out.push([x, -30, h]); } return out; };

// ---- the cooper's lean-to: a brick back wall (+Y) and ends, open at the front (-Y) on timber posts under a beam, a
// slate roof falling to the front. len along X, d deep
export const WS = { e: 360, pitch: 0.42 };
export function workShed(len = 1200, d = 560, seed = 1) {
  len = q(len, 20); d = q(d, 20); seed = N(seed);
  return ['bwlean3|' + [len, d, seed % 2].join('|'), shape((G) => {
    const { e, pitch } = WS, hl = len / 2, hd = d / 2, t = 30, ov = 40, rl = (y) => e + 22 + (y + hd) * pitch;   // the roof's underside
    brickRun(G, -hl, hl, hd - t / 2, 0, rl(hd), t, seed, false, true);
    for (const sx of [-1, 1]) { brickRun(G, -hd, hd - t, sx * (hl - t / 2), 0, e, t, seed + 2 + sx, true, true);
      for (let z = e, k = 0; z < rl(hd - t) - 1; z += 20, k++) { const y0 = Math.max(-hd, (z + 20 - e - 22) / pitch - hd); if (y0 > hd - t - 4) break; G.box(sx * (hl - t / 2), (y0 + hd - t) / 2, z + 10, t / 2, (hd - t - y0) / 2, 10, KC.brick[(k + 2) % 4]); }
      { const b = G.n, L = (d + 40) / Math.cos(Math.atan(pitch)); G.box(0, L / 2, 0, 4, L / 2, 11, KC.woodD); G.place(b, { x: sx * (hl + 26), y: -hd - 40, z: rl(-hd - 40) - 6, roll: deg(Math.atan(pitch)) }); } }
    const n = Math.max(2, Math.round(len / 300)); for (let i = 0; i <= n; i++) { const x = -hl + 30 + ((len - 60) * i) / n; G.box(x, -hd + 12, e / 2, 11, 11, e / 2, BW.oakD); G.box(x, -hd + 12, 5, 16, 16, 5, KC.trimD); }
    G.box(0, -hd + 12, e + 10, hl, 13, 12, BW.oakD);
    const ang = deg(Math.atan(pitch)), Lr = (d + ov) / Math.cos(Math.atan(pitch));
    for (let i = 0; i <= n; i++) { const x = -hl + 30 + ((len - 60) * i) / n, yc = (-hd - ov + hd) / 2, b = G.n; G.box(0, 0, 0, 6, Lr / 2, 8, BW.oakD); G.place(b, { x, y: yc, z: rl(yc) - 8 / Math.cos(Math.atan(pitch)), roll: ang }); }
    G.surf((u, v) => { const y = -hd - ov + v * (d + ov); return [-hl - 24 + u * (len + 48), y, rl(y) + 0.5]; }, 0, 1, Math.round(len / 70), 0, 1, 10, (u, v) => KC.slate[(Math.floor(v * 10) * 3 + Math.floor(u * 9)) % 3]);
    G.box(0, -hd - ov, rl(-hd - ov) - 4, hl + 24, 5, 6, KC.iron);
    G.box(0, 0, 2, hl - t, hd - 4, 2, 0x5a4e40);
  })];
}
// ---- the cooper's fire: an iron basket on three legs, glowing coals in it
export function firePot() {
  return pair('bwfire', (G, P) => {
    if (G) { for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; G.tube([[Math.cos(a) * 30, Math.sin(a) * 30, 40], [Math.cos(a) * 44, Math.sin(a) * 44, -2]], 3, KC.iron, { S: 4, M: 2 }); }
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; G.tube([[Math.cos(a) * 26, Math.sin(a) * 26, 36], [Math.cos(a) * 40, Math.sin(a) * 40, 86]], 1.8, KC.iron, { S: 4, M: 2 }); }
      for (const [z, r] of [[36, 26], [62, 33], [86, 40]]) G.lathe([[r + 2, z - 2], [r + 2, z + 2], [r - 1, z + 2], [r - 1, z - 2], [r + 2, z - 2]], KC.iron, 12, [0, 0, 0], [1, 1], true);
      G.lathe([[0, 36], [26, 36]], KC.iron, 12); }
    if (P) P.blob(0, 0, 52, 30, 30, 18, 0xff8a3a, { nu: 10, nv: 5, warp: (x, y, z) => [x, y, z + Math.sin(x * 0.3) * Math.cos(y * 0.3) * 4] });
  });
}
// ---- barrels lying in a pile, their heads to ±Y: n along the bottom, one fewer each row up, chocks at the ends
export function barrelPile(n = 4, seed = 1) {
  seed = N(seed);
  return ['bwpile|' + [n, seed % 3].join('|'), shape((G) => {
    const brl = (x, z, k) => { const b = G.n, c = pick(BW.oak, k + seed); G.lathe([[26, -42], [31, -22], [32, 0], [31, 22], [26, 42]], (j) => (j % 2 ? c : dark(c, 0.88)), 12); for (const zz of [-34, -12, 12, 34]) G.lathe([[Math.abs(zz) > 20 ? 29.5 : 32.5, zz - 3], [Math.abs(zz) > 20 ? 29.5 : 32.5, zz + 3]], KC.iron, 12); G.lathe([[0, 40], [26, 40]], dark(c, 0.8), 12); G.lathe([[0, -40], [26, -40]], dark(c, 0.8), 12); G.place(b, { x, y: 0, z, roll: 90 }); };
    for (let row = 0; row < n; row++) for (let i = 0; i < n - row; i++) brl(-(n - row - 1) * 32 + i * 64, 32 + row * 55, row * 5 + i);
    for (const s of [-1, 1]) G.box(s * (n * 32 + 6), 0, 9, 8, 30, 9, BW.oakD);
  })];
}
// ---- an inn's sign: an iron bracket out from the wall (+X) and a board hung from it on two chains (the map writes its
// name on both faces)
export function innSign() {
  return ['bwinnsign', shape((G) => {
    G.box(3, 0, 300, 3, 10, 34, KC.iron); G.tube([[4, 0, 328], [126, 0, 328]], 2.6, KC.iron, { S: 5, M: 4 }); G.tube([[4, 0, 284], [50, 0, 312], [100, 0, 326]], 1.8, KC.iron, { S: 4, M: 6 });
    for (const x of [38, 102]) G.tube([[x, 0, 330], [x, 0, 300]], 1.2, KC.iron, { S: 4, M: 2 });
    G.box(70, 0, 262, 46, 3, 38, BW.paint); G.box(70, 0, 262, 49, 2.4, 41, KC.brass);
  })];
}
// ---- an iron mooring bollard
export function bollard() {
  return ['bwbollard', shape((G) => { G.lathe([[16, 0], [16, 6], [12, 10], [10, 34], [14, 40], [14, 46], [0, 50]], KC.iron, 10); })];
}
