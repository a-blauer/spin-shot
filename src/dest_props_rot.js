// Sculpted pieces for the places in The Rot (Sporefall Wood first): dead pines gone silver or burnt black, the Char's
// great caps and puffballs, the fire crews' pump, beaters and buckets, their watch tower. Same rules as dest_props.js:
// UE frame (X the front, Y right, Z up, cm), [key, build] pairs, keys carry every number the shape depends on, things
// stand on z = 0, and every piece is whole: nothing hangs in the air or stops short of what holds it.
import { shapeB as shape, wob } from './propkit.js';
import { dark, mix } from './village_shapes.js';
import { q, rng } from './dest_props.js';

export const RC = {   // the Rot's colours
  bark: [0x6a625a, 0x5e5650, 0x736a60], barkD: 0x3e3832, barkL: 0x9c9488, wood: 0xb4a890, woodD: 0x8a7e6a,
  char: 0x1e1a18, charL: 0x34302c, ember: 0xd0521e, ash: 0x7a746c, ashL: 0x9a948a,
  needle: [0x7a4e2c, 0x6a4428, 0x845a34], earth: 0x4e463c, earthD: 0x3a332c,
  cap: 0x2a2326, capD: 0x1a1416, capL: 0x4a3e3a, flesh: 0x8e7e76, fleshD: 0x6a5e58, gill: 0x9a8a80, puff: 0xd0c6be, puffD: 0x6a5e58,
  timber: 0x6e5a44, timberD: 0x54442f, timberL: 0x857058, iron: 0x34363a, canvas: 0xa89c80, rope: 0x9a8a68,
  stone: [0x7e7a72, 0x74706a, 0x8a857c], red: 0xa8342a, white: 0xd8d0c0, shingle: [0x4a3e34, 0x544638, 0x3e342c],
};
const N = (s) => Math.abs(Math.round(s)) || 0;
const deg = (r) => (r * 180) / Math.PI;
// a shelf of the Char's bracket fungus, its back in what it grows on: built at the origin facing +X, then put in place
function bracket(G, s, at) {
  const b = G.n;
  G.blob(0, 0, 0, s, s * 1.25, 8 + s * 0.14, (nx, ny, nz) => (nz < -0.3 ? RC.gill : Math.hypot(nx, ny) > 0.9 ? RC.capL : RC.cap), { nu: 10, nv: 5, warp: (x, y, z, nx, ny, nz) => [x, y, nz > 0 ? z * (1 - 0.35 * Math.max(0, nx)) : z * 0.6] });
  G.place(b, at);
}

// ---- a dead pine: tall and straight, its bark gone silver-grey and peeling to pale wood in strips, the dead branches
// short and stiff all the way up (broken off short low down), a few with the last rusty needles still on them; one in
// three snapped off high up, its break all splinters; brackets of the Char's shelf fungus on some, over a gnome's head.
// burnt: charred black from the foot up to a ragged line (the firebreak's). The trunk is all that stands in your way.
export function deadPine(h = 2000, seed = 1, burnt = 0) {
  seed = N(seed); h = q(h, 100);
  return ['rpine4|' + [h, seed % 6, burnt ? 1 : 0].join('|'), shape((G) => {
    const R = rng(seed * 131 + h), tr = h * 0.028, snapped = seed % 3 === 2, top = snapped ? h * (0.7 + (seed % 2) * 0.08) : h;
    const lx = (R() - 0.5) * tr * 1.4, ly = (R() - 0.5) * tr * 1.4, at = (z) => { const t = Math.max(0, Math.min(1, z / top)); return [lx * t, ly * t]; };
    const rad = (z) => tr * (1.25 - (snapped ? 0.5 : 0.9) * (Math.max(0, z) / top));
    const charTo = burnt ? h * (0.26 + R() * 0.1) : -1e9, base = RC.bark[seed % 3];
    const bc = (z, a) => { if (z < charTo + Math.sin(a * 3 + seed) * h * 0.04) return Math.sin(a * 9 + z * 0.06) > 0.45 ? RC.charL : RC.char;
      return Math.sin(a * 5 + Math.sin(z * 0.008 + seed) * 0.9 + seed) > 0.6 ? RC.barkD : Math.sin(a * 2 + z * 0.003 + seed * 2) > 0.88 ? RC.barkL : base; };
    G.tube([[0, 0, -30], [lx * 0.3, ly * 0.3, top * 0.3], [lx * 0.66, ly * 0.66, top * 0.66], [lx, ly, top]], (t) => rad(t * top), (t, a) => bc(t * top, a), { S: 10, M: 10 });
    // the foot: roots flaring out and down into the needles
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + R() * 0.6, L = tr * (2 + R() * 0.5);
      G.tube([[Math.cos(a) * tr * 0.5, Math.sin(a) * tr * 0.5, tr * 1.6], [Math.cos(a) * L * 0.6, Math.sin(a) * L * 0.6, tr * 0.22], [Math.cos(a) * L, Math.sin(a) * L, -tr * 0.4]], (t) => tr * 0.42 * (1 - t * 0.5), (t, a2) => bc(0, a2), { S: 6, M: 4, flat: () => [1, 0.75] }); }
    // the branches: a spiral of dead spars up the trunk, longest low, drooping there and lifting near the top, twigs off
    // the long ones; broken off short below a quarter of the way up and here and there above
    const n = 18 + (seed % 5), spars = [];
    for (let i = 0; i < n; i++) {
      const f = i / n, z = top * (0.22 + 0.72 * f) + (R() - 0.5) * 50; if (z > top - tr * 0.8) continue;
      const a = i * 2.39996 + R() * 0.5, [cx, cy] = at(z), broken = f < 0.22 || R() < 0.22, L = h * (0.2 - 0.12 * f) * (broken ? 0.25 + R() * 0.15 : 0.75 + R() * 0.4), r0 = Math.max(3.5, rad(z) * 0.3 * (1 - f * 0.35));
      const tz = z + L * (-0.32 + 0.48 * f), tip = [cx + Math.cos(a) * L, cy + Math.sin(a) * L, tz], mid = [cx + Math.cos(a) * L * 0.5, cy + Math.sin(a) * L * 0.5, z + (tz - z) * 0.38];
      G.tube([[cx, cy, z], mid, tip], (t) => r0 * (1 - t * (broken ? 0.3 : 0.78)), (t, a2) => bc(z, a2 + 1), { S: 4, M: broken ? 1 : 3 });
      if (broken) continue;
      for (const [u, sd] of [[0.42, 1], [0.7, -1]]) { if (L < h * 0.06) break; const p = [cx + Math.cos(a) * L * u, cy + Math.sin(a) * L * u, z + (tz - z) * u * 0.9], a2 = a + sd * (0.7 + R() * 0.3), L2 = L * (0.42 - u * 0.2);
        G.tube([p, [p[0] + Math.cos(a2) * L2, p[1] + Math.sin(a2) * L2, p[2] + L2 * (0.1 + R() * 0.25)]], (t) => r0 * 0.42 * (1 - t * 0.7), (t, a3) => bc(z, a3), { S: 3, M: 1 }); }
      spars.push({ a, z, L, tz, cx, cy, f });
    }
    // old man's beard: pale strands of lichen hanging from the lower spars of the unburnt
    if (!burnt) spars.filter((p) => p.f < 0.55).slice(0, 3 + (seed % 3)).forEach(({ a, z, L, tz, cx, cy }, k) => { const u = 0.45 + (k % 3) * 0.17, x = cx + Math.cos(a) * L * u, y = cy + Math.sin(a) * L * u, zz = z + (tz - z) * u, hl = 40 + ((seed + k) % 4) * 16;
      G.tube([[x, y, zz + 2], [x + 3, y - 2, zz - hl * 0.5], [x + 1, y + 2, zz - hl]], (t) => 3.4 * (1 - t * 0.6), 0x8e9280, { S: 3, M: 2 }); });
    // the break of a snapped one: pale wood across it and splinters standing up round its edge
    if (snapped) { const [cx, cy] = at(top), r = rad(top);
      G.lathe([[r * 0.98, top - 1], [r * 0.6, top + 3], [0, top + 4]], RC.woodD, 10, [cx, cy, 0]);
      for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + R() * 0.4, d = r * (0.5 + R() * 0.3), hg = r * (0.6 + R() * 2.2);
        G.tube([[cx + Math.cos(a) * d, cy + Math.sin(a) * d, top - r * 0.4], [cx + Math.cos(a) * d * 0.9, cy + Math.sin(a) * d * 0.9, top + hg]], (t) => r * 0.3 * (1 - t * 0.85), (t) => (t > 0.3 ? RC.wood : RC.woodD), { S: 4, M: 2 }); } }
    // the Char's brackets, a stack of them up one side, all over a gnome's head
    if (seed % 3 === 0 || burnt) { const k = 3 + (seed % 2), a = R() * Math.PI * 2; for (let i = 0; i < k; i++) { const z = 210 + i * 62 + R() * 24, aa = a + (R() - 0.5) * 0.7, r = rad(z), [cx, cy] = at(z), s = r * (0.55 + R() * 0.2) + 14;
      bracket(G, s, { x: cx + Math.cos(aa) * (r * 0.7 + s * 0.35), y: cy + Math.sin(aa) * (r * 0.7 + s * 0.35), z, yaw: deg(aa) }); } }
  })];
}
// how wide a dead pine's trunk is at its foot, for its body
export const pineTrunk = (h) => q(h, 100) * 0.028 * 1.25;

// ---- the great dead pine the Char came up under: vast, silver-grey, snapped off two-thirds of the way up, its foot split
// open into a hollow (facing +X) black inside where the growth heaves out; roots like walls; brackets the size of tables
export function greatPine(h = 3400) {
  h = q(h, 100);
  return ['rgreatpine|' + h, shape((G) => {
    const R = rng(h * 3 + 7), tr = 150, top = h * 0.7, rad = (z) => tr * (1.3 - 0.5 * (Math.max(0, z) / top));
    const bc = (z, a) => (z < 260 + Math.sin(a * 4) * 50 ? (Math.sin(a * 9 + z * 0.05) > 0.4 ? RC.charL : RC.char) : Math.sin(a * 6 + Math.sin(z * 0.006) * 1.2) > 0.55 ? RC.barkD : Math.sin(a * 2 + z * 0.002) > 0.86 ? RC.barkL : RC.bark[1]);
    G.tube([[0, 0, -40], [8, -10, top * 0.35], [-10, 12, top * 0.7], [0, 20, top]], (t) => rad(t * top), (t, a) => bc(t * top, a), { S: 20, M: 18 });
    // the hollow: a tall dark split in the +X face, a thick lip of bark round it
    const hz = 420, hr = rad(100) * 0.96;
    G.blob(hr - tr * 0.2, 0, hz * 0.5 + 4, tr * 0.24, tr * 0.5, hz * 0.5, 0x120e0c, { nu: 12, nv: 8 });
    { const lip = []; for (let i = 0; i <= 16; i++) { const t = -0.1 + (i / 16) * (Math.PI + 0.2), y = Math.cos(t) * tr * 0.54, z = Math.max(0, hz * 0.5 + 4 + Math.sin(t) * hz * 0.56); lip.push([hr - tr * 0.06, y, z]); } lip[0][2] = -6; lip[16][2] = -6;
      G.tube(lip, (t) => tr * (0.14 - 0.03 * Math.abs(t - 0.5)), (t, a) => bc(120, a + t * 5), { S: 8 }); }
    // roots like walls, running out and down
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.39 + R() * 0.2, L = tr * (2.2 + R() * 0.5);
      G.tube([[Math.cos(a) * tr * 0.5, Math.sin(a) * tr * 0.5, 200], [Math.cos(a) * L * 0.55, Math.sin(a) * L * 0.55, tr * 0.4], [Math.cos(a) * L, Math.sin(a) * L, -tr * 0.4]], (t) => tr * 0.5 * (1 - t * 0.45), (t, a2) => bc(30, a2), { S: 8, M: 8, flat: () => [1, 0.7] }); }
    // the break, high up: pale wood and long splinters
    { const r = rad(top), cx = 0, cy = 20; G.lathe([[r * 0.98, top - 1], [r * 0.5, top + 6], [0, top + 8]], RC.woodD, 14, [cx, cy, 0]);
      for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 2 + R() * 0.3, d = r * (0.55 + R() * 0.3), hg = r * (0.8 + R() * 2.6);
        G.tube([[cx + Math.cos(a) * d, cy + Math.sin(a) * d, top - r * 0.4], [cx + Math.cos(a) * d * 0.88, cy + Math.sin(a) * d * 0.88, top + hg]], (t) => r * 0.24 * (1 - t * 0.85), (t) => (t > 0.25 ? RC.wood : RC.woodD), { S: 5, M: 2 }); } }
    // the great spars that are left, dead and stiff
    for (let i = 0; i < 9; i++) { const f = i / 9, z = top * (0.4 + 0.52 * f), a = i * 2.39996 + 0.6, r = rad(z), L = tr * (3.6 - 2 * f) * (i % 3 === 1 ? 0.4 : 1), cy = 20 * (z / top), tip = [Math.cos(a) * (r + L), cy + Math.sin(a) * (r + L), z + L * (0.1 + 0.3 * f)];
      G.tube([[0, cy, z], [Math.cos(a) * (r + L * 0.5), cy + Math.sin(a) * (r + L * 0.5), z + (tip[2] - z) * 0.4], tip], (t) => r * 0.3 * (1 - t * (i % 3 === 1 ? 0.3 : 0.7)), (t, a2) => bc(z, a2), { S: 7, M: 6 }); }
    // brackets in tiers up the -X side, the biggest low (over a gnome's head)
    for (let i = 0; i < 7; i++) { const z = 320 + i * 120 + R() * 40, a = Math.PI + (R() - 0.5) * 1.6, r = rad(z), s = 60 + (7 - i) * 9;
      bracket(G, s, { x: Math.cos(a) * r * 0.86, y: Math.sin(a) * r * 0.86 + 20 * (z / top), z, yaw: deg(a) }); }
  })];
}
export const GREAT_TR = 150 * 1.3;   // the great pine's trunk radius at its foot

// ---- a dead pine down across the floor, along X from -L/2 to +L/2: the trunk lying bedded in the needles, the shallow
// root plate stood on edge at the -X end with the earth still in it, the top end snapped and splintered, short stubs of
// branch standing up along it, the Char's brackets on its flanks. Its bodies: fallenPineBodies.
export function fallenPine(L = 2200, tr = 70, seed = 1) {
  seed = N(seed); L = q(L, 100); tr = q(tr);
  return ['rfallen|' + [L, tr, seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 71 + L), base = RC.bark[seed % 3], rad = (t) => tr * (1.1 - 0.45 * t), zc = (t) => rad(t) * 0.85;
    const bc = (t, a) => (Math.sin(a * 5 + t * 30 + seed) > 0.6 ? RC.barkD : Math.sin(a * 2 + t * 9) > 0.85 ? RC.barkL : Math.sin(a) > 0.75 && Math.sin(t * 23) > 0.2 ? RC.ashL : base);
    G.tube([[-L / 2, 0, zc(0)], [-L * 0.15, 8, zc(0.35)], [L * 0.2, -6, zc(0.7)], [L / 2, 0, zc(1)]], rad, bc, { S: 12 });
    // the root plate: a ragged disc of earth on edge, roots out of it every way
    const px = -L / 2 - tr * 0.15, pr = tr * 2.6, pz = pr * 0.8;
    G.blob(px, 0, pz, tr * 0.42, pr, pr * 0.82, (nx, ny, nz) => (nx < -0.3 ? (wob(ny * 6, nz * 6) > 0.3 ? RC.earthD : RC.earth) : nz > 0.7 ? RC.needle[1] : RC.earth), { nu: 14, nv: 10, warp: (x, y, z, nx, ny, nz) => { const w = 1 + wob(ny * 4 + seed, nz * 4) * 0.12; return [x, y * w, z * w]; } });
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + R() * 0.4, r = pr * (0.7 + R() * 0.22), ry = Math.cos(a) * r, rz = pz + Math.sin(a) * r * 0.82; if (rz < 16) continue;
      G.tube([[px + tr * 0.1, ry * 0.6, pz + (rz - pz) * 0.6], [px - tr * 0.3, ry, rz], [px - tr * 0.8 - R() * tr * 0.5, ry * 1.15, Math.max(10, rz + (R() - 0.6) * tr)]], (t) => tr * 0.16 * (1 - t * 0.7), RC.barkD, { S: 5 }); }
    // the snapped top end: pale wood and splinters out along it
    { const r = rad(1), ex = L / 2, ez = zc(1); G.blob(ex + 2, 0, ez, 3, r * 0.95, r * 0.95, RC.woodD, { nu: 10, nv: 6 });
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + R() * 0.5, d = r * (0.45 + R() * 0.3), y = Math.cos(a) * d, z = ez + Math.sin(a) * d, len = r * (0.5 + R() * 1.4); if (z < 8) continue;
        G.tube([[ex - r * 0.3, y, z], [ex + len, y * 1.05, Math.max(6, z + (R() - 0.5) * r * 0.3)]], (t) => r * 0.26 * (1 - t * 0.85), RC.wood, { S: 4, M: 2 }); } }
    // stubs of branch standing up out of the top, short and broken
    for (let i = 0; i < 6; i++) { const t = 0.15 + i * 0.13 + R() * 0.04, x = -L / 2 + L * t, r = rad(t), z = zc(t), a = (R() - 0.5) * 1.4, dy = Math.sin(a), dz = Math.cos(a), len = r * (0.35 + R() * 0.3);
      G.tube([[x, dy * r * 0.5, z + dz * r * 0.5], [x + (R() - 0.5) * r * 0.5, dy * (r + len), z + dz * (r + len)]], (tt) => r * 0.17 * (1 - tt * 0.4), RC.barkD, { S: 5, M: 2 }); }
    // the Char's brackets along its flanks, high on the round of it
    for (let i = 0; i < 4; i++) { const t = 0.2 + i * 0.17, x = -L / 2 + L * t, r = rad(t), z = zc(t), side = i % 2 ? 1 : -1, s = r * 0.42 + 6;
      bracket(G, s, { x, y: side * r * 0.62, z: z + r * 0.55, yaw: side * 90 }); }
  })];
}
// its bodies (yaw: as it is placed, 0 along X)
export function fallenPineBodies(K, x, y, L, tr, yaw = 0) {
  L = q(L, 100); tr = q(tr); const c = Math.cos((yaw * Math.PI) / 180), s = Math.sin((yaw * Math.PI) / 180), at = (u) => [x + u * c, y + u * s];
  const [bx, by] = at(40); K.body(bx, by, L + 40, tr * 2.4, tr * 2.1, yaw);
  const pr = tr * 2.6, [px, py] = at(-L / 2 - tr * 0.65); K.body(px, py, tr * 2.6, pr * 2.1, pr * 1.6, yaw);
}

// ---- what the fire left of a pine: a black snag snapped off at a gnome's height or a few, its top split to points,
// stubs of burnt branch, the bark cracked in squares, embers still glowing in the cracks at its foot
export function burntSnag(h = 400, seed = 1) {
  seed = N(seed); h = q(h, 50);
  return ['rsnag3|' + [h, seed % 4].join('|'), shape((G) => {
    const R = rng(seed * 61 + h), r0 = 44 + (seed % 3) * 6, rad = (t) => r0 * (1.15 - 0.2 * t);
    const cc = (t, a) => (Math.sin(a * 10 + Math.floor(t * h / 30) * 1.7) > 0.5 ? RC.charL : RC.char);
    G.tube([[0, 0, -20], [3, -2, h * 0.5], [0, 2, h]], rad, cc, { S: 10, M: Math.max(4, Math.round(h / 40)) });
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + R() * 0.7, L = r0 * (1.55 + R() * 0.3);
      G.tube([[Math.cos(a) * r0 * 0.5, Math.sin(a) * r0 * 0.5, Math.min(h * 0.25, 34)], [Math.cos(a) * L * 0.62, Math.sin(a) * L * 0.62, r0 * 0.2], [Math.cos(a) * L, Math.sin(a) * L, -r0 * 0.35]], (t) => r0 * 0.42 * (1 - t * 0.5), cc, { S: 6, M: 5, flat: () => [1, 0.7] }); }
    // the jagged top: black points round the break
    const rt = rad(1), tall = h >= 250 ? 1 : 0.4; G.lathe([[rt * 0.98, h - 1], [rt * 0.4, h + 3], [0, h + 4]], RC.charL, 10);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + R() * 0.5, d = rt * (0.45 + R() * 0.25), hg = rt * (0.3 + R() * 1.4) * tall;
      G.tube([[Math.cos(a) * d, 2 + Math.sin(a) * d, h - rt * 0.3], [Math.cos(a) * d * 0.85, 2 + Math.sin(a) * d * 0.85, h + hg]], (t) => rt * 0.34 * (1 - t * 0.85), (t) => (t > 0.5 ? RC.charL : RC.char), { S: 4, M: 2 }); }
    // burnt stubs of branch on the taller ones
    if (h >= 250) for (let i = 0; i < 3; i++) { const z = h * (0.45 + i * 0.17), a = i * 2.2 + seed, L = r0 * (0.6 + R() * 0.5), r = rad(z / h);
      G.tube([[0, 0, z], [Math.cos(a) * (r + L), Math.sin(a) * (r + L), z + L * 0.2]], (t) => r * 0.26 * (1 - t * 0.5), RC.char, { S: 5, M: 2 }); }
    // embers in the cracks low down: they glow in the dark of it
    if (seed % 2 === 0) for (let i = 0; i < 2; i++) { const a = R() * Math.PI * 2 + i * 2.6, z = 10 + R() * Math.min(40, h * 0.3), r = rad(z / h), b = G.n;
      G.blob(0, 0, 0, 2.5, 2.2, 9 + R() * 8, i % 2 ? RC.ember : mix(RC.ember, 0xffb060, 0.3), { nu: 6, nv: 4 }); G.place(b, { x: Math.cos(a) * (r - 1), y: Math.sin(a) * (r - 1), z, yaw: deg(a) }); }
  })];
}
export const snagR = (seed) => (44 + (N(seed) % 3) * 6) * 1.15;

// ---- one of the Char's great caps, grown as tall as the pines: a thick ash-grey stalk out of a bulb in the ground, the
// torn skirt of its ring under the cap, the cap a broad dome black as soot, cracked through to the ember-red under it,
// the gills beneath pale grey and close; small caps at its foot. The cap is well over a gnome's head: the stalk and its
// bulb are all that stand in your way. h: the ground to the cap's underside; w: the cap's radius.
export function giantCap(h = 800, w = 420, seed = 1) {
  seed = N(seed); h = q(h, 50); w = q(w, 20);
  return ['rgcap|' + [h, w, seed % 4].join('|'), shape((G) => {
    const R = rng(seed * 89 + h + w), sr = w * 0.15, lean = (R() - 0.5) * 0.1, la = R() * Math.PI * 2, tx = Math.cos(la) * lean * h, ty = Math.sin(la) * lean * h;
    const sc = (t, a) => (Math.sin(a * 7 + t * 4 + seed) > 0.72 ? RC.fleshD : Math.sin(a * 3 - t * 9) > 0.92 ? RC.gill : RC.flesh);
    // the bulb it rises out of, half in the ground
    G.blob(0, 0, sr * 0.45, sr * 1.7, sr * 1.7, sr * 0.95, (nx, ny, nz) => (nz > 0.55 || wob(nx * 5 + seed, ny * 5) > 0.5 ? RC.fleshD : RC.flesh), { nu: 14, nv: 7, warp: (x, y, z, nx, ny) => { const k = 1 + wob(nx * 3 + seed, ny * 3) * 0.12; return [x * k, y * k, Math.max(z, -sr * 0.45 - 4)]; } });
    // the stalk, flaring a little where it meets the cap
    G.tube([[0, 0, sr * 0.6], [tx * 0.35, ty * 0.35, h * 0.35], [tx * 0.75, ty * 0.75, h * 0.72], [tx, ty, h + 10]], (t) => sr * (1.12 - 0.22 * t + 0.12 * (Math.max(0, t - 0.85) / 0.15)), sc, { S: 14, M: 12 });
    // the ring: a skirt hanging round the stalk under the cap
    { const zr = h * 0.8, r0 = sr * 0.92; G.lathe([[r0, zr + 8], [r0 * 1.55, zr - 10], [r0 * 1.7, zr - 40], [r0 * 1.62, zr - 46], [r0 * 1.45, zr - 18], [r0 * 0.95, zr - 2]], (k) => (k < 2 ? RC.gill : k < 4 ? RC.fleshD : RC.gill), 14, [tx * 0.8, ty * 0.8, 0]); }
    // the cap: a dome, its underside flat over the gills; cracked through to the glow, scaled paler here and there
    G.blob(tx, ty, h + 6, w, w, w * 0.55, (nx, ny, nz) => { if (nz < -0.05) return RC.gill; const a = Math.atan2(ny, nx), r = Math.hypot(nx, ny);
      if (r > 0.3 && Math.abs(Math.sin(a * 6 + Math.sin(r * 9 + seed) * 0.7 + seed)) < 0.07) return RC.ember; return wob(nx * 6 + seed, ny * 6) > 0.62 ? RC.capL : nz > 0.85 ? RC.capD : RC.cap; },
    { nu: 30, nv: 12, warp: (x, y, z, nx, ny) => { const k = 1 + wob(nx * 2.5 + seed, ny * 2.5) * 0.06; return [x * k, y * k, z < 0 ? -2 : z]; } });
    // the gills: close ridges hanging under it, out from the stalk to near the rim
    for (let i = 0; i < 30; i++) { const a = (i / 30) * Math.PI * 2, r0 = sr * 1.02, r1 = w * 0.92, b = G.n;
      G.box((r0 + r1) / 2, 0, -5, (r1 - r0) / 2, 1.6, 5, i % 2 ? RC.gill : dark(RC.gill, 0.85)); G.place(b, { x: tx, y: ty, z: h + 4, yaw: deg(a) }); }
    // small caps at its foot
    for (let i = 0; i < 4 + (seed % 3); i++) { const a = R() * Math.PI * 2, d = sr * (1.6 + R() * 0.9), hh = sr * (0.35 + R() * 0.5), ww = hh * (0.7 + R() * 0.4), x = Math.cos(a) * d, y = Math.sin(a) * d;
      G.lathe([[ww * 0.2, -4], [ww * 0.16, hh * 0.5], [ww * 0.14, hh]], RC.flesh, 8, [x, y, 0]);
      G.lathe([[ww * 0.5, hh - 2], [ww * 0.54, hh + 2], [ww * 0.44, hh + ww * 0.28], [ww * 0.2, hh + ww * 0.42], [0, hh + ww * 0.46]], (k) => (k < 1 ? RC.gill : k < 3 ? RC.cap : RC.capD), 12, [x, y, 0]); }
  })];
}
export const capStalk = (w) => q(w, 20) * 0.15;   // its stalk's radius (the bulb is 1.7 of it)

// ---- a clutch of the Char's puffballs in the litter: grey-white balls, mottled, the biggest burst open at the top and
// dark with spores inside, the torn skin standing round the hole
export function puffballs(r = 60, seed = 1) {
  seed = N(seed); r = q(r, 5);
  return ['rpuff|' + [r, seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 37 + r), n = 3 + (seed % 3);
    for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, d = i ? r * (0.9 + R() * 0.5) : 0, s = r * (i ? 0.35 + R() * 0.3 : 0.8), x = Math.cos(a) * d, y = Math.sin(a) * d, burst = i === 0, zc = s * 0.72;
      G.blob(x, y, zc, s, s, s * 0.8, (nx, ny, nz) => (burst && nz > 0.72 ? RC.capD : nz > 0.2 && wob(nx * 7 + i, ny * 7) > 0.55 ? RC.puffD : nz < -0.3 ? RC.fleshD : RC.puff), { nu: 14, nv: 9, warp: (px, py, pz, nx, ny, nz) => [px, py, Math.max(pz, -zc - 2) - (burst && nz > 0.8 ? s * 0.3 * ((nz - 0.8) / 0.2) : 0)] });
      if (burst) for (let k = 0; k < 7; k++) { const b = (k / 7) * Math.PI * 2 + i, rr = s * 0.52, c = Math.cos(b), sn = Math.sin(b);
        G.tube([[x + c * rr, y + sn * rr, zc + s * 0.6], [x + c * s * 0.66, y + sn * s * 0.66, zc + s * 0.72], [x + c * s * 0.8, y + sn * s * 0.8, zc + s * 0.64]], (t) => s * 0.11 * (1 - t * 0.6), RC.puff, { S: 6, M: 4, flat: () => [0.35, 1] }); }
    }
  })];
}

// ---- the fire-watch tower: four timber legs leaning in on stone footings, girts and cross-braces from well over a
// gnome's head up (you walk in under it), a ladder up the +X face through a hatch in the deck, a walkway round a little
// cabin with windows all round, a pyramid roof of shingles, the crews' pennant on a pole; the alarm bell under the eave
// by the door. FT: its sizes.
export const FT = { D: 1100, s0: 170, s1: 125, cab: 100, E: 200, eave: 1350, apex: 1500 };
export function fireTower() {
  return ['rtower2', shape((G) => {
    const { D, s0, s1, cab, E, eave, apex } = FT, sAt = (z) => s0 + (s1 - s0) * (z / D), T = RC.timber, TD = RC.timberD, TL = RC.timberL;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.box(sx * s0, sy * s0, 10, 26, 26, 14, RC.stone[(sx + sy + 2) % 3]);
    // the legs: from their footings up to the deck's underside, leaning in
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const dx = (s1 - s0) * sx, dy = (s1 - s0) * sy, dz = D - 24, L = Math.hypot(dx, dy, dz), b = G.n;
      G.box(0, 0, L / 2, 9, 9, L / 2, T); G.place(b, { x: sx * s0, y: sy * s0, z: 24, pitch: deg(Math.atan2(dx, dz)), roll: deg(-Math.asin(dy / L)) }); }
    // girts round all four faces, on the legs' lines; cross-braces between them
    const levels = [380, 740, D - 9];
    for (const z of levels) { const s = sAt(z); for (const sd of [-1, 1]) { G.box(0, sd * s, z, s + 9, 7, 9, TD); G.box(sd * s, 0, z, 7, s + 9, 9, TD); } }
    for (let k = 0; k < levels.length - 1; k++) { const z1 = levels[k] + 9, z2 = levels[k + 1] - 9, a = sAt(z1), b = sAt(z2);
      for (const sd of [-1, 1]) for (const dir of [-1, 1]) { G.tube([[-a * dir, sd * a, z1], [b * dir, sd * b, z2]], 5, T, { S: 4 }); G.tube([[sd * a, -a * dir, z1], [sd * b, b * dir, z2]], 5, T, { S: 4 }); } }
    // the deck: joists out past the legs, planks across them with the hatch left open over the ladder, a rail round
    for (const x of [-s1, -s1 / 3, s1 / 3, s1]) G.box(x, 0, D - 9, 6, E, 9, TD);
    for (const y of [-E + 6, E - 6]) G.box(0, y, D - 9, E, 6, 9, TD);
    const hatch = [s1 - 4, s1 + 40, 36];   // x from, x to, half width in y
    for (let y = -E + 10; y < E; y += 20) { const pc = Math.round(y / 20) % 3 === 0 ? TL : T;
      if (Math.abs(y) < hatch[2]) { G.box((-E + hatch[0]) / 2, y, D + 5, (hatch[0] + E) / 2, 9.4, 5, pc); G.box((hatch[1] + E) / 2, y, D + 5, (E - hatch[1]) / 2, 9.4, 5, pc); }
      else G.box(0, y, D + 5, E, 9.4, 5, pc); }
    for (const [x, y] of [[-E + 4, -E + 4], [-E + 4, E - 4], [E - 4, -E + 4], [E - 4, E - 4], [-E + 4, 0], [E - 4, 0], [0, -E + 4], [0, E - 4]]) G.box(x, y, D + 60, 4, 4, 50, T);
    for (const zr of [D + 108, D + 60]) for (const sd of [-1, 1]) { G.box(sd * (E - 4), 0, zr, 3, E, 3, TL); G.box(0, sd * (E - 4), zr, E, 3, 3, TL); }
    // the ladder: up the +X face from the ground, through the hatch, its rails running on up as handholds
    { const lx = (z) => sAt(z) + 10, top = D + 90; for (const sy of [-1, 1]) G.tube([[lx(0), sy * 22, -10], [lx(D), sy * 22, D], [lx(D) + 2, sy * 22, top]], 3.5, TL, { S: 5 });
      for (let z = 30; z < D - 10; z += 32) G.box(lx(z), 0, z, 2.5, 22, 2.5, T); }
    // the cabin: boards to the sill, the window band open but for its posts, boards above, a door on +X
    const z0 = D + 10, sill = D + 110, lint = D + 200;
    for (const sd of [-1, 1]) { G.box(sd * cab, 0, (z0 + sill) / 2, 5, cab, (sill - z0) / 2, T); G.box(0, sd * cab, (z0 + sill) / 2, cab, 5, (sill - z0) / 2, T);
      G.box(sd * cab, 0, (lint + eave) / 2, 5, cab, (eave - lint) / 2, T); G.box(0, sd * cab, (lint + eave) / 2, cab, 5, (eave - lint) / 2, T);
      for (const u of [-cab, 0, cab]) { G.box(sd * cab, u, (sill + lint) / 2, 6, 6, (lint - sill) / 2, TD); G.box(u, sd * cab, (sill + lint) / 2, 6, 6, (lint - sill) / 2, TD); }
      G.box(sd * (cab + 4), 0, sill + 3, 6, cab, 3, TL); G.box(0, sd * (cab + 4), sill + 3, cab, 6, 3, TL); }
    G.box(cab + 6, 30, (z0 + lint) / 2, 2, 34, (lint - z0) / 2, TD);   // the door, shut, at the +X wall's +Y side
    G.box(cab + 9, 52, D + 100, 3, 3, 3, RC.iron);
    G.box(0, 0, D + 80, 40, 40, 4, TL); G.box(0, 0, D + 44, 4, 4, 34, TD);   // the table in the middle
    // the roof: four shingled faces up to the peak, overhanging the walls
    { const ov = cab + 34, rows = 7, zo = eave - ((apex - eave) * (ov - cab - 5)) / (cab + 5);   // the faces run down through the walls' tops to the overhang
      for (let k = 0; k < 4; k++) { const b = G.n;
        G.surf((u, v) => { const x = ov * (1 - v), w2 = ov * (1 - v), lift = ((v * rows) % 1) * 3; return [x + lift * 0.6, (u - 0.5) * 2 * w2, zo + (apex - zo) * v + lift]; }, 0, 1, 1, 0, 1, rows * 2, (u, v) => RC.shingle[Math.floor(v * rows) % 3]);
        G.surf((u, v) => { const x = ov * (1 - v) - 3, w2 = (ov - 3) * (1 - v); return [x, (0.5 - u) * 2 * w2, zo - 3 + (apex - zo) * v]; }, 0, 1, 1, 0, 1, 2, TD);
        G.place(b, { yaw: k * 90 }); }
      G.lathe([[10, apex - 6], [8, apex + 10], [0, apex + 14]], TD, 8);
      G.tube([[0, 0, apex - 20], [0, 0, apex + 190]], 3, TD, { S: 6 });
      G.surf((u, v) => [Math.sin(v * 5) * 6 * v, 2 + v * 90, apex + 150 + u * 36 * (1 - v)], 0, 1, 2, 0, 1, 6, (u, v) => (v > 0.7 ? dark(RC.red, 0.8) : RC.red)); }
    // the bell under the eave by the door, on its bracket, its rope down to a cleat on the door post
    { const bx = cab + 34, by = -50, bz = eave - 70; G.box(cab + 18, by, eave - 30, 18, 4, 4, RC.iron); G.box(bx, by, eave - 44, 2, 2, 12, RC.iron);
      G.lathe([[3, -2], [11, 2], [14, 18], [17, 26], [0, 27]].map(([r, z]) => [r, bz + 30 - z]), 0x8a7a4a, 12, [bx, by, 0]);
      G.tube([[bx, by, bz + 10], [bx - 2, by + 4, sill + 40], [cab + 5.5, by + 6, sill + 10]], 1.2, RC.rope, { S: 4 }); G.box(cab + 6, by + 6, sill + 10, 2, 6, 2, RC.iron); }
  })];
}

// ---- the fire crews' pump: a barrel of water lying on a two-wheeled cart, the shafts down on the ground in front, the
// see-saw pump on top, the hose run out from its spout across the ground. Along X, the shafts toward +X.
export function pumpCart() {
  return ['rpump', shape((G) => {
    const T = RC.timber, TD = RC.timberD, wr = 62, fz = wr + 11, side = 72;
    for (const sy of [-1, 1]) { const b = G.n;
      G.lathe([[wr, -4], [wr, 4], [wr - 8, 4], [wr - 8, -4], [wr, -4]], TD, 18, [0, 0, 0], [1, 1], true);
      G.lathe([[10, -12], [10, 12]], RC.iron, 10);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, c = G.n; G.box((wr - 4 + 10) / 2, 0, 0, (wr - 4 - 10) / 2, 2.5, 3, T); G.place(c, { yaw: deg(a) }); }
      G.lathe([[wr + 1.5, -4.5], [wr + 1.5, 4.5]], RC.iron, 18, [0, 0, 0], [1, 1], true);
      G.place(b, { roll: 90, y: sy * side, z: wr }); }
    G.box(0, 0, wr, 4, side + 14, 4, RC.iron);
    for (const sy of [-1, 1]) G.box(5, sy * 50, fz, 155, 6, 8, TD);
    for (const x of [-140, 0, 140]) G.box(x, 0, fz + 2, 6, 56, 6, TD);
    for (const sy of [-1, 1]) G.tube([[150, sy * 50, fz], [300, sy * 44, 40], [440, sy * 40, 5]], 4.5, T, { S: 6 });
    G.box(330, 0, 32, 3, 44, 3, T);
    // the barrel: staves bulging, iron hoops, lying along X on two chocks
    { const b = G.n; G.tube([[0, 0, -115], [0, 0, 115]], (t) => 58 * (0.9 + 0.1 * Math.sin(Math.PI * t)), (t, a) => (Math.floor((a / (Math.PI * 2)) * 18) % 2 ? T : RC.timberL), { S: 18, M: 8 });
      for (const z of [-95, -40, 40, 95]) G.lathe([[58 * (0.9 + 0.1 * Math.sin(Math.PI * ((z + 115) / 230))) + 1.6, z - 3], [58 * (0.9 + 0.1 * Math.sin(Math.PI * ((z + 115) / 230))) + 1.6, z + 3]], RC.iron, 18, [0, 0, 0], [1, 1], true);
      G.place(b, { pitch: 90, x: -5, z: fz + 8 + 58 }); }
    for (const x of [-75, 65]) G.box(x, 0, fz + 13, 8, 46, 5, TD);
    // the pump: an iron barrel up through the top, the handle across it on its pivot, the spout to the hose
    const bz = fz + 8 + 58, pz = bz + 58;
    G.tube([[20, 0, bz + 40], [20, 0, pz + 74]], 9, RC.iron, { S: 10 }); G.lathe([[12, pz + 74], [12, pz + 80], [0, pz + 80]], RC.iron, 10, [20, 0, 0]);
    G.box(20, 0, pz + 86, 4, 4, 8, RC.iron);
    { const b = G.n; G.box(0, 0, 0, 5, 115, 4, T); for (const sy of [-1, 1]) G.tube([[-14, sy * 112, 0], [14, sy * 112, 0]], 3, TD, { S: 6 }); G.place(b, { x: 20, z: pz + 96, roll: 12 }); }
    G.tube([[20, 0, pz + 20], [20, 22, pz + 20]], 4.5, RC.iron, { S: 8 });
    G.tube([[20, 22, pz + 20], [22, 70, pz - 6], [32, 98, bz - 30], [42, 108, 40], [110, 150, 7], [260, 170, 7], [400, 132, 7]], 6, 0x3a2e24, { S: 7 });
  })];
}

// ---- a bucket, its handle up
export function bucket(seed = 1) {
  seed = N(seed);
  return ['rbucket|' + (seed % 2), shape((G) => {
    G.lathe([[0, 0], [13, 0], [16, 30], [15, 30], [12, 2]], seed % 2 ? 0x5a4a3a : RC.iron, 12);
    for (const z of [6, 24]) G.lathe([[13.6 + (z / 30) * 3, z - 1.5], [13.6 + (z / 30) * 3, z + 1.5]], RC.iron, 12, [0, 0, 0], [1, 1], true);
    G.tube([[0, -15.5, 28], [0, -14, 44], [0, 0, 52], [0, 14, 44], [0, 15.5, 28]], 1.2, RC.iron, { S: 4 });
  })];
}

// ---- the beaters' rack: two posts and a rail, five fire beaters leaning on it flap-up, two buckets hung from its ends
export function beaterRack() {
  return ['rbeaters2', shape((G) => {
    const T = RC.timber, TD = RC.timberD;
    for (const sy of [-1, 1]) G.box(0, sy * 118, 85, 5, 5, 105, TD);
    G.box(0, 0, 172, 5, 124, 5, T);
    for (const y of [-60, -30, 0, 30, 60]) { const p0 = [55, y, -6], p1 = [-14, y, 210];
      G.tube([p0, p1], 3, RC.timberL, { S: 5 });
      const b = G.n; G.box(0, 0, 0, 1.6, 10, 20, 0x2e2a26); G.place(b, { x: p1[0] - 2, y, z: p1[2] + 10, pitch: -deg(Math.atan2(p0[0] - p1[0], p1[2] - p0[2])) }); }
    for (const sy of [-1, 1]) { const y = sy * 92, bz = 126;
      G.lathe([[0, bz], [13, bz], [16, bz + 30], [15, bz + 30], [12, bz + 2]], RC.iron, 12, [0, y, 0]);
      G.tube([[-15.5, y, bz + 28], [-9, y, 168], [-6, y, 177], [0, y, 178], [6, y, 177], [9, y, 168], [15.5, y, bz + 28]], 1.2, RC.iron, { S: 4 }); }
  })];
}

// ---- the road's barrier, raised: the pivot post with the striped pole stood up on it and its stone counterweight, the
// post the pole rests in when it is down across the road (w wide)
export function roadBarrier(w = 440) {
  w = q(w, 20);
  return ['rbarrier|' + w, shape((G) => {
    G.box(0, 0, 60, 12, 12, 66, RC.timberD); G.box(0, 0, 4, 24, 24, 6, RC.stone[0]);
    const a = (78 * Math.PI) / 180, dy = Math.cos(a), dz = Math.sin(a), pz = 112, len = w + 40;
    G.tube([[0, -dy * 70, pz - dz * 70], [0, dy * len, pz + dz * len]], 6, (t) => (Math.floor(t * 12) % 2 ? RC.white : RC.red), { S: 8, M: 24 });
    { const b = G.n; G.box(0, 0, 0, 16, 22, 16, RC.stone[2]); G.place(b, { y: -dy * 78, z: pz - dz * 78, roll: -deg(Math.PI / 2 - a) }); }
    G.box(0, 0, pz, 14, 4, 4, RC.iron);
    G.box(0, w, 46, 8, 8, 50, RC.timberD); for (const sx of [-1, 1]) G.box(sx * 9, w, 100, 3, 6, 10, RC.timberD);
  })];
}

// ---- a warning board: a plank board on two posts under a little roof of boards (the words go on it from the map)
export function warnBoard(w = 240) {
  w = q(w, 20);
  return ['rwarn|' + w, shape((G) => {
    for (const sy of [-1, 1]) G.box(0, sy * (w / 2 + 6), 140, 6, 6, 150, RC.timberD);
    for (let z = 140; z < 250; z += 22) G.box(0, 0, z + 11, 4, w / 2 + 2, 10.4, Math.round(z / 22) % 2 ? RC.timber : RC.timberL);
    for (const sd of [-1, 1]) { const b = G.n; G.box(0, 0, 0, 26, w / 2 + 24, 2.5, RC.timberD); G.place(b, { x: sd * 20, z: 286, pitch: sd * 30 }); }
    G.box(0, 0, 290, 6, w / 2 + 8, 6, RC.timberD);
  })];
}

// ---- dead bracken: brown fronds slumped out from the crown, a couple broken over
export function bracken(s = 1, seed = 1) {
  seed = N(seed);
  return ['rbracken2|' + [Math.round(s * 10), seed % 4].join('|'), shape((G) => {
    const R = rng(seed * 29 + Math.round(s * 10)), n = 5 + (seed % 3), C = [0x6a4a30, 0x7e5a38, 0x5a3e28];
    G.blob(0, 0, 4, 9 * s, 9 * s, 6 * s, 0x3e2e20, { nu: 5, nv: 3 });
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + R() * 0.5, L = s * (64 + R() * 34), up = 0.45 + R() * 0.3, wd = s * (9 + R() * 4), col = C[i % 3], broken = i % 4 === 3;
      G.surf((u, v) => { const t = v, ca = Math.cos(a), sa = Math.sin(a), r = L * t * (broken ? 0.6 : 1), z = Math.max(1.5, L * (up * t - (up + (broken ? 0.9 : 0.35)) * t * t * 0.95) + 6), w = wd * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (u - 0.5) * 2; return [ca * r - sa * w, sa * r + ca * w, z + Math.abs(u - 0.5) * wd * 0.3]; }, 0, 1, 2, 0, 1, 5, (u, v) => (v > 0.7 ? dark(col, 0.85) : col));
    }
  })];
}

// ---- dead reeds at the pond's edge: grey-brown stalks, some broken over, a few old seed heads
export function deadReeds(h = 120, seed = 1) {
  seed = N(seed); h = q(h, 10);
  return ['rreeds|' + [h, seed % 4].join('|'), shape((G) => {
    const R = rng(seed * 19 + h);
    for (let i = 0; i < 12; i++) {
      const a = R() * Math.PI * 2, lean = 0.1 + R() * 0.3, L = h * (0.55 + R() * 0.5), w0 = 2.4 + R() * 1.4, col = i % 3 ? 0x7a6a50 : 0x8a7a5a, tip = 0x9a8a6a, ox = Math.cos(a) * R() * 14, oy = Math.sin(a) * R() * 14, kink = i % 5 === 2;
      G.surf((u, v) => { const t = v, b = lean * t * t * L + (kink && t > 0.55 ? (t - 0.55) * L * 1.1 : 0), w = w0 * (1 - t * 0.9), s = (u - 0.5) * 2, z = kink && t > 0.55 ? L * 0.55 - (t - 0.55) * L * 0.25 : L * t; return [ox + Math.cos(a) * b - Math.sin(a) * w * s, oy + Math.sin(a) * b + Math.cos(a) * w * s, z]; }, 0, 1, 1, 0, 1, 5, (u, v) => (v > 0.75 ? tip : col));
    }
    for (let i = 0; i < 3; i++) { const a = R() * 6.28, L = h * (0.9 + R() * 0.3), ox = Math.cos(a) * 8, oy = Math.sin(a) * 8, tx = ox + Math.cos(a) * L * 0.08, ty = oy + Math.sin(a) * L * 0.08;
      G.tube([[ox, oy, 0], [tx, ty, L]], 1.3, 0x7a6a4a, { S: 4 }); G.blob(tx, ty, L - 12, 4.2, 4.2, 13, 0x3a2a1e, { nu: 8, nv: 6 }); }
  })];
}

// ---- a little jetty out into the pond: planks on bearers (low enough to step onto), posts at its far end
export const JT = { deck: 16 };
export function jetty(L = 420, W = 150) {
  L = q(L, 20); W = q(W, 10);
  return ['rjetty|' + [L, W].join('|'), shape((G) => {
    for (const sy of [-1, 1]) G.box(L / 2, sy * (W / 2 - 14), 5, L / 2, 6, 5, RC.timberD);
    for (let x = 12; x < L; x += 24) G.box(x, 0, 13, 11, W / 2, 3, Math.round(x / 24) % 4 ? RC.timber : RC.timberL);
    for (const sy of [-1, 1]) { G.tube([[L - 10, sy * (W / 2 + 6), -10], [L - 10, sy * (W / 2 + 6), 70]], 8, RC.timberD, { S: 8 }); G.tube([[L / 2, sy * (W / 2 + 6), -10], [L / 2, sy * (W / 2 + 6), 34]], 7, RC.timberD, { S: 8 }); }
  })];
}

// ---- a dead pine for the distance: a bare trunk and a few stiff spars; a tenth of a near one's faces
export function farPine(h = 2200, seed = 1) {
  seed = N(seed); h = q(h, 200);
  return ['rfarpine|' + [h, seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 53 + h), tr = h * 0.022, top = seed % 3 === 2 ? h * 0.75 : h;
    G.lathe([[tr * 1.4, -10], [tr, h * 0.15], [tr * 0.3, top]], RC.bark[seed % 3], 6);
    for (let i = 0; i < 6; i++) { const z = top * (0.35 + i * 0.1), a = i * 2.4 + R(), L = h * (0.13 - i * 0.015); G.tube([[0, 0, z], [Math.cos(a) * L, Math.sin(a) * L, z - L * 0.15]], tr * 0.25, RC.barkD, { S: 3, M: 2 }); }
  })];
}

// ---- a hill for the skyline, grey-brown and bare
export function bareHill(rx, ry, h, col = 0x4e483e) {
  rx = q(rx, 100); ry = q(ry, 100); h = q(h, 50);
  return ['rhill|' + [rx, ry, h, col].join('|'), shape((G) => {
    G.blob(0, 0, 0, rx, ry, h, (x, y, z) => (z < 0 ? dark(col, 0.7) : mix(col, 0x6a6258, 0.25 + 0.3 * wob(x * 3, y * 3))), { e: 2.2, nu: 28, nv: 12 });
  })];
}
