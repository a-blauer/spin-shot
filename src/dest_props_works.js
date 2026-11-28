// Sculpted pieces for the Works' places (Cogsworth Depot first): brick and slate, iron and brass, the railway's gear.
// Same rules as dest_props.js: UE frame (X the front, Y right, Z up, cm), [key, build] pairs, keys carry every number
// the shape depends on, things stand on z = 0, every piece whole (nothing hangs in the air or stops short).
import { shapeB as shape, wob } from './propkit.js';
import { dark, mix } from './village_shapes.js';
import { q, rng } from './dest_props.js';

export const KC = {   // the Works' colours
  brick: [0x9a4a36, 0x8a4230, 0xa65440, 0x7e3c2c], mortar: 0x5e5048, trim: 0xc8bca4, trimD: 0xa89c86,
  slate: [0x4a525c, 0x545c66, 0x3e464e], iron: 0x2e3034, ironL: 0x5a5e64, brass: 0xc8963c, green: 0x2e5a42, greenL: 0x3e7254,
  cream: 0xe8dcc0, red: 0x9a3428, coal: 0x1e1c1e, coalL: 0x34302e, ballast: 0x6a645a, sleeper: 0x4e3e30, rail: 0x8a8a90,
  glass: 0x26323c, wood: 0x7a5c3e, woodD: 0x5a4430, rust: 0x8a4a2a,
};

// ---- brick in courses: a box of wall from (x0..x1 along X) at y, z0..z1, t thick, the courses in shades, a mortar core
// between; joints shown by the courses alone. Used by every brick piece here.
export const brickRun = (G, x0, x1, y, z0, z1, t, seed = 1, alongY = false, coarse = false) => {
  const R = rng(seed * 13 + 7), L = Math.abs(x1 - x0), cx = (x0 + x1) / 2, course = coarse ? 20 : 17, blen = coarse ? 150 : 34;
  const bx = (x, yy, z, hx, hy, hz, c) => (alongY ? G.box(yy, x, z, hy, hx, hz, c) : G.box(x, yy, z, hx, hy, hz, c));
  bx(cx, y, (z0 + z1) / 2, L / 2 - 0.5, t / 2 - 1.2, (z1 - z0) / 2, KC.mortar);
  for (let z = z0, k = 0; z < z1 - 2; z += course, k++) { const h = Math.min(course, z1 - z) / 2 - 0.6; let x = Math.min(x0, x1) + (k % 2 ? 0 : blen / 2) - blen / 2; while (x < Math.max(x0, x1) - 1) { const w = Math.min(blen - 2 + R() * 4, Math.max(x0, x1) - x); if (x + w > Math.min(x0, x1) + 1) { const a = Math.max(x, Math.min(x0, x1)); bx((a + x + w) / 2, y, z + h + 0.6, (x + w - a) / 2 - 0.6, t / 2, h, KC.brick[Math.floor(R() * 4)]); } x += w; } }
};

// ---- a brick building with a slate gable roof (ridge along Y): W deep (X), D long (Y), walls H high. opts: doors
// [{ y, w, h, side: 1 | -1 (front/back) }], windows per side { front: [y...], back: [...], ends: [x...] } at z wz,
// chimneys [y...], arched (round-headed openings). Front is +X. The openings are dark (closed buildings).
export function brickHouse(W = 700, D = 1000, H = 420, opts = {}, seed = 1) {
  const key = 'dbrickhouse|' + [W, D, H, seed % 4, JSON.stringify(opts)].join('|');
  return [key, shape((G) => {
    const hw = W / 2, hd = D / 2, t = 24, pitch = opts.pitch || 0.62, ridge = H + hw * pitch, over = 30;
    const doors = opts.doors || [], win = opts.windows || {}, wz = opts.wz || 170, wh = opts.wh || 120, ww = opts.ww || 80;
    // walls, courses round all four sides, cut for the openings
    const cut = (side, pos) => doors.filter((d) => (d.side || 1) === side).map((d) => [d.y - d.w / 2, d.y + d.w / 2, 0, d.h]).concat((side === 1 ? win.front : side === -1 ? win.back : []) ? (side === 1 ? win.front || [] : win.back || []).map((y) => [y - ww / 2, y + ww / 2, wz - wh / 2, wz + wh / 2]) : []);
    const wall = (sx) => { const holes = cut(sx, 0); let z = 0; const bands = [0]; for (const [, , a, b] of holes) bands.push(a, b); bands.push(H); const zs = [...new Set(bands)].sort((a, b) => a - b);
      for (let i = 0; i < zs.length - 1; i++) { const z0 = zs[i], z1 = zs[i + 1], mid = (z0 + z1) / 2, hs = holes.filter(([, , a, b]) => mid > a && mid < b).sort((a, b) => a[0] - b[0]); let y = -hd; for (const [a, b] of hs) { if (a > y + 2) brickRun(G, y, a, sx * hw, z0, z1, t, seed + i + sx * 3, true); y = b; } if (hd > y + 2) brickRun(G, y, hd, sx * hw, z0, z1, t, seed + i + sx * 5, true); } void z; };
    wall(1); wall(-1);
    for (const sy of [-1, 1]) { brickRun(G, -hw - t / 2, hw + t / 2, sy * hd, 0, H, t, seed + 11 + sy); const gab = (x) => H + (hw - Math.abs(x)) * pitch; for (let x = -hw; x < hw; x += 30) { const top = gab(x + 15 > 0 ? x + 30 : x); G.box(x + 15, sy * hd, (H + top) / 2, 15, t / 2, Math.max(1, (top - H) / 2), KC.brick[(Math.round(x / 30) + 4) & 3]); } }
    G.box(0, 0, H / 2, hw - t / 2, hd - t / 2, H / 2, 0x1e1a18);   // the dark inside
    // stone plinth, string course at the eaves, quoins at the corners
    G.box(0, 0, 10, hw + 4, hd + 4, 10, KC.trimD); G.box(0, 0, H - 6, hw + 5, hd + 5, 6, KC.trim);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (let z = 20; z < H - 20; z += 60) G.box(sx * (hw - 4), sy * (hd - 4), z + 14, 18, 18, 14, z % 120 ? KC.trim : KC.trimD);
    // openings: doors (planked, a step) and windows (frames, sills, lintels, glazing bars)
    for (const d of doors) { const sx = d.side || 1, x = sx * (hw - 2); G.box(x, d.y, d.h / 2, 3, d.w / 2, d.h / 2, d.color || KC.green); for (let k = -d.w / 2 + 12; k < d.w / 2; k += 24) G.box(x + sx * 3, d.y + k, d.h / 2, 0.8, 1, d.h / 2 - 6, dark(d.color || KC.green, 0.8)); G.box(x + sx * 4, d.y, d.h + 8, 5, d.w / 2 + 12, 8, KC.trim); G.box(x + sx * 12, d.y, 4, 12, d.w / 2 + 10, 4, KC.trimD); if (d.arch) G.box(x + sx * 4, d.y, d.h + 22, 4, d.w / 2 + 4, 10, KC.trim); }
    const window = (x, y, z, sx, alongX) => { const b = G.n; G.box(0, 0, 0, 2, ww / 2, wh / 2, KC.glass); G.box(2.5, 0, 0, 1.2, 1.5, wh / 2, KC.cream); G.box(2.5, 0, wh / 6, 1.2, ww / 2, 1.5, KC.cream); G.box(2.5, 0, -wh / 6, 1.2, ww / 2, 1.5, KC.cream); for (const s of [-1, 1]) { G.box(2.5, s * (ww / 2 + 2), 0, 2, 3, wh / 2 + 3, KC.cream); G.box(2.5, 0, s * (wh / 2 + 2), 2, ww / 2 + 3, 3, KC.cream); } G.box(6, 0, -wh / 2 - 6, 6, ww / 2 + 8, 4, KC.trim); G.box(4, 0, wh / 2 + 8, 4, ww / 2 + 10, 7, KC.trim); G.place(b, { x, y, z, yaw: alongX ? (sx > 0 ? 90 : -90) : sx > 0 ? 0 : 180 }); };
    for (const y of win.front || []) window(hw - 1, y, wz, 1, false);
    for (const y of win.back || []) window(-hw + 1, y, wz, -1, false);
    for (const x of win.ends || []) for (const sy of [-1, 1]) window(x, sy * (hd - 1), wz, sy, true);
    // the roof: slates in courses on both slopes, a ridge, bargeboards, iron gutters
    const rows = Math.max(6, Math.round((hw * 1.18) / 34));
    for (const sx of [-1, 1]) {
      const xa = sx * (hw + over), za = H - over * pitch, nz = Math.cos(Math.atan(pitch)), nx = sx * Math.sin(Math.atan(pitch));
      G.surf((u, v) => { const x = xa * (1 - v), z = za + (ridge - za) * v, lift = ((v * rows) % 1) * 3; return [x + nx * lift, -hd - over + u * (D + over * 2), z + nz * lift + 3]; }, 0, 1, Math.max(8, Math.round(D / 60)), 0, 1, rows * 2, (u, v) => KC.slate[(Math.floor(v * rows) + Math.floor(u * D / 40) * 5 + seed) % 3]);
      G.surf((u, v) => { const x = xa * (1 - v), z = za + (ridge - za) * v; return [x - nx * 5, -hd - over + u * (D + over * 2), z - nz * 5]; }, 0, 1, 2, 0, 1, 2, 0x2a2624);
      G.box(xa, 0, za - 6, 6, hd + over, 6, KC.iron);
    }
    G.box(0, 0, ridge + 6, 9, hd + over + 2, 6, 0x6a6a70);
    for (const sy of [-1, 1]) for (const sx of [-1, 1]) { const b = G.n, L = Math.hypot(hw + over, ridge - H + over * pitch); G.box(L / 2, 0, 0, L / 2, 3, 9, KC.green); G.place(b, { x: sx * (hw + over), y: sy * (hd + over - 2), z: H - over * pitch - 4, yaw: sx > 0 ? 180 : 0, pitch: -Math.atan(pitch) * 57.3 }); }
    for (const y of opts.chimneys || []) { const x = hw * 0.35, top = ridge + 120; G.box(x, y, (H + top) / 2, 34, 44, (top - H) / 2, KC.brick[1]); G.box(x, y, top + 4, 40, 50, 6, KC.trim); for (const s of [-1, 1]) G.lathe([[0, top + 8], [10, top + 8], [10, top + 40], [12, top + 44], [0, top + 44]], 0x9a5a3a, 10, [x, y + s * 18, 0]); }
  })];
}

// ---- a house far off (beyond the walls, out of reach): brick walls without bricks, a slate roof, a chimney
export function farHouse(W = 700, D = 1000, H = 460, seed = 1) {
  W = q(W, 50); D = q(D, 50); H = q(H, 20);
  return ['dfarhouse|' + [W, D, H, seed % 3].join('|'), shape((G) => {
    const hw = W / 2, hd = D / 2, ridge = H + hw * 0.62;
    G.box(0, 0, H / 2, hw, hd, H / 2, KC.brick[seed % 4]); G.box(0, 0, H - 6, hw + 4, hd + 4, 6, KC.trim);
    for (const sy of [-1, 1]) G.surf((u, v) => { const x = (u - 0.5) * 2 * hw * (1 - v); return [x, sy * hd, H + (ridge - H) * v]; }, 0, 1, 1, 0, 1, 1, KC.brick[(seed + 1) % 4]);
    for (const sx of [-1, 1]) G.surf((u, v) => [sx * (hw + 30) * (1 - v), -hd - 30 + u * (D + 60), H - 18 + (ridge - H + 18) * v], 0, 1, 1, 0, 1, 1, KC.slate[seed % 3]);
    for (let y = -hd + 120; y < hd - 60; y += 220) for (const sx of [-1, 1]) G.box(sx * (hw + 1), y, H * 0.55, 1, 34, 50, KC.glass);
    G.box(hw * 0.3, hd * 0.4, ridge + 40, 30, 40, 80, KC.brick[2]);
  })];
}

// ---- a run of track along X: rails on sleepers on a ballast bed, len long. Gauge 110 (gnome gauge).
export const GAUGE = 110;
export function track(len = 1000, seed = 1) {
  len = q(len, 20);
  return ['dtrack|' + [len, seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 7 + len), hl = len / 2;
    G.box(0, 0, 1, hl, GAUGE / 2 + 60, 1.2, KC.ballast);
    for (let x = -hl + 24; x < hl - 10; x += 48) G.box(x + (R() - 0.5) * 4, 0, 3, 9, GAUGE / 2 + 30, 2.6, R() > 0.3 ? KC.sleeper : dark(KC.sleeper, 0.8));
    for (const s of [-1, 1]) { G.box(0, s * GAUGE / 2, 6.5, hl, 3.5, 1.4, KC.rail); G.box(0, s * GAUGE / 2, 7.6, hl, 2.2, 0.8, mix(KC.rail, 0xffffff, 0.3)); G.box(0, s * GAUGE / 2, 4.8, hl, 4.5, 0.6, KC.iron); }
  })];
}
// ---- a buffer stop at the end of a siding: a timber beam on iron legs, two sprung buffers
export function bufferStop() {
  return ['dbufferstop', shape((G) => {
    for (const s of [-1, 1]) { G.box(0, s * GAUGE / 2, 30, 8, 5, 30, KC.iron); G.tube([[-6, s * GAUGE / 2, 58], [-70, s * GAUGE / 2, 2]], 4, KC.iron, { S: 6, M: 3 }); }
    G.box(4, 0, 56, 10, GAUGE / 2 + 30, 12, KC.red); for (let y = -GAUGE / 2 - 20; y < GAUGE / 2 + 21; y += 20) G.box(15, y, 56, 1, 8, 12, y % 40 ? KC.cream : KC.red);
    for (const s of [-1, 1]) { G.tube([[14, s * 45, 56], [34, s * 45, 56]], 6, KC.ironL, { S: 8, M: 2 }); G.lathe([[0, 0], [11, 0], [11, 4], [0, 4]], KC.iron, 12, [36, s * 45, 52]); }
  })];
}

// ---- the depot's engine: a little tank engine, deep green, brass and red: the boiler with its smokebox and chimney
// forward (+X), the dome and safety valves, the cab behind with its roof, coal in the bunker, three pairs of red
// drivers with their rods, buffers and lamps. Stands on the rails (gauge GAUGE). About 760 long.
export function locomotive(seed = 1) {
  return ['dloco|' + (seed % 2), shape((G) => {
    const body = seed % 2 ? 0x6a2a24 : KC.green, bodyL = mix(body, 0xffffff, 0.12), wheel = 0x8a2a22, zA = 52;
    // frames, footplate, valances
    G.box(0, 0, zA + 30, 370, 56, 18, KC.iron); G.box(0, 0, zA + 52, 380, 92, 4, body); for (const s of [-1, 1]) G.box(0, s * 92, zA + 44, 380, 2, 10, KC.brass);
    // the wheels: three pairs of drivers, splashers over them, coupling rods
    for (const x of [-170, 0, 170]) for (const s of [-1, 1]) { const wb = G.n; G.lathe([[0, -7], [56, -7], [58, -3], [58, 3], [56, 7], [0, 7]], wheel, 16, [0, 0, 0]); G.place(wb, { x, y: s * (GAUGE / 2 + 8), z: 58, roll: 90 }); G.box(x, s * (GAUGE / 2 + 17), 58, 6, 2, 6, KC.brass); G.surf((u, v) => { const a = Math.PI * u; return [x + Math.cos(a) * 64, s * (GAUGE / 2 + 8 + (v - 0.5) * 22), 58 + Math.sin(a) * 64]; }, 0, 1, 10, 0, 1, 1, body); }
    for (const s of [-1, 1]) G.box(0, s * (GAUGE / 2 + 22), 48, 180, 2, 5, KC.ironL);
    // the boiler, smokebox and chimney, dome, safety valves, whistle
    G.tube([[-120, 0, zA + 140], [250, 0, zA + 140]], 78, (t, a) => (Math.floor(t * 6) % 2 && Math.abs(Math.sin(a)) > 0.98 ? KC.brass : body), { S: 18, M: 6, caps: false });
    for (const x of [-60, 40, 140]) G.tube([[x - 3, 0, zA + 140], [x + 3, 0, zA + 140]], 80, KC.brass, { S: 18, M: 1, caps: false });
    G.tube([[250, 0, zA + 140], [340, 0, zA + 140]], 84, KC.iron, { S: 18, M: 2, caps: false }); { const b = G.n; G.lathe([[0, 0], [84, 0], [84, 4], [70, 8], [0, 10]], 0x26282c, 18, [0, 0, 0]); G.place(b, { x: 340, z: zA + 140, pitch: 90 }); } G.box(352, 0, zA + 140, 2, 6, 30, KC.brass);
    G.lathe([[30, 0], [26, 40], [24, 90], [34, 120], [36, 130], [24, 130], [0, 128]], KC.iron, 14, [300, 0, zA + 210]);
    G.lathe([[34, 0], [30, 30], [22, 52], [8, 62], [0, 64]], KC.brass, 14, [50, 0, zA + 208]);
    for (const s of [-1, 1]) G.lathe([[7, 0], [7, 28], [9, 30], [0, 32]], KC.brass, 8, [-90, s * 12, zA + 214]);
    G.tube([[-40, 0, zA + 214], [-40, 0, zA + 250]], 3, KC.brass, { S: 6, M: 2 }); G.lathe([[6, 0], [6, 14], [0, 16]], KC.brass, 8, [-40, 0, zA + 250]);
    // side tanks along the boiler, the cab behind, its roof, windows; the coal bunker at the back
    for (const s of [-1, 1]) { G.box(80, s * 70, zA + 120, 150, 24, 64, body); G.box(80, s * 95, zA + 120, 150, 1, 58, bodyL); G.box(80, s * 70, zA + 186, 152, 26, 3, KC.brass); }
    G.box(-205, 0, zA + 190, 80, 96, 136, body);
    for (const s of [-1, 1]) G.box(-160, s * 97, zA + 230, 26, 2, 34, KC.glass);
    G.box(-125, 0, zA + 250, 2, 60, 30, KC.glass);
    G.surf((u, v) => { const y = (u - 0.5) * 208; return [-290 + v * 180, y, zA + 330 + 18 * (1 - (y / 104) ** 2)]; }, 0, 1, 8, 0, 1, 3, 0x2a2a2e);
    G.box(-330, 0, zA + 150, 40, 90, 96, body); G.blob(-330, 0, zA + 248, 36, 80, 18, KC.coal, { nu: 10, nv: 5 });
    // buffers and beams front and back, lamps, a brass number plate, the couplings
    for (const sx of [-1, 1]) { G.box(sx * 380, 0, zA + 38, 6, 96, 18, KC.red); for (const s of [-1, 1]) { G.tube([[sx * 386, s * 60, zA + 38], [sx * 410, s * 60, zA + 38]], 6, KC.ironL, { S: 8, M: 2 }); G.lathe([[0, 0], [11, 0], [11, 4], [0, 4]], KC.iron, 12, [sx * 412, s * 60, zA + 34]); } G.tube([[sx * 386, 0, zA + 36], [sx * 400, 0, zA + 30]], 3, KC.iron, { S: 5, M: 2 }); }
    for (const s of [-1, 1]) { G.box(372, s * 50, zA + 72, 8, 10, 12, KC.iron); G.box(380, s * 50, zA + 72, 1.5, 7, 9, 0xfff0c0); }
    G.box(-125.5, 0, zA + 300, 1.5, 30, 10, KC.brass);
  })];
}
export const LOCO_LEN = 830;

// ---- wagons on the rails (about 520 long): 0 a coal wagon heaped with coal; 1 a flat wagon with crates roped down;
// 2 a closed van, its door slid open
export function wagon(kind = 0, seed = 1) {
  return ['dwagon|' + [kind, seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 31 + kind), col = [0x5a3e2e, 0x6a4a34, 0x5e4a3e][seed % 3], z0 = 40;
    G.box(0, 0, z0 + 14, 250, 70, 10, KC.iron);
    for (const x of [-150, 150]) for (const s of [-1, 1]) { const wb = G.n; G.lathe([[0, -6], [36, -6], [38, -2], [38, 2], [36, 6], [0, 6]], KC.iron, 14, [0, 0, 0]); G.place(wb, { x, y: s * (GAUGE / 2 + 6), z: 38, roll: 90 }); G.box(x, s * (GAUGE / 2 + 20), 46, 30, 4, 14, KC.ironL); }
    for (const sx of [-1, 1]) { G.box(sx * 252, 0, z0 + 14, 4, 80, 10, KC.red); for (const s of [-1, 1]) G.tube([[sx * 256, s * 50, z0 + 14], [sx * 276, s * 50, z0 + 14]], 5, KC.ironL, { S: 8, M: 2 }); }
    if (kind === 0) { G.box(0, 0, z0 + 70, 240, 86, 48, col); for (let x = -220; x <= 220; x += 55) for (const s of [-1, 1]) G.box(x, s * 87, z0 + 70, 3, 2, 48, KC.iron); G.blob(0, 0, z0 + 112, 230, 78, 26, (nx, ny, nz) => (wob(nx * 9 + seed, ny * 9) > 0.4 ? KC.coalL : KC.coal), { nu: 16, nv: 6 }); }
    if (kind === 1) { G.box(0, 0, z0 + 28, 250, 86, 4, col); for (const [x, y, w] of [[-140, -30, 50], [-140, 34, 44], [-40, 0, 60], [80, -28, 46], [80, 30, 46], [170, 0, 54], [-40, 0, 60 * 3]]) { if (w > 100) continue; G.box(x, y, z0 + 32 + w, w, w * 0.9, w, R() > 0.5 ? KC.wood : mix(KC.wood, 0xffffff, 0.15)); for (const s of [-1, 1]) G.box(x, y + s * w * 0.9, z0 + 32 + w, w - 2, 0.6, 3, KC.woodD); } for (const x of [-140, 80]) G.box(x, 0, z0 + 130, 1.5, 88, 1.5, 0xb09a6c); }
    if (kind === 2) { G.box(0, 0, z0 + 120, 246, 86, 100, col); G.surf((u, v) => { const y = (u - 0.5) * 184; return [-252 + v * 504, y, z0 + 220 + 14 * (1 - (y / 92) ** 2)]; }, 0, 1, 8, 0, 1, 2, 0x3a3a3e); for (let x = -230; x <= 230; x += 46) for (const s of [-1, 1]) G.box(x, s * 87, z0 + 120, 3, 1.5, 98, dark(col, 0.8)); for (const s of [-1, 1]) { G.box(40, s * 88.5, z0 + 120, 70, 1.5, 96, 0x18140f); G.box(150, s * 90, z0 + 120, 70, 2, 98, col); G.box(150, s * 92, z0 + 222, 76, 2, 3, KC.iron); } }
  })];
}

// ---- a water tower: a tank of staves in iron hoops on a brick stand, a lid, the leather spout swung out with its chain
export function waterTower() {
  return ['dwatertower', shape((G) => {
    const st = 420, r = 170;
    brickRun(G, -150, 150, -150, 0, st, 40, 3); brickRun(G, -150, 150, 150, 0, st, 40, 4); brickRun(G, -150, 150, -150, 0, st, 40, 5, true); brickRun(G, -150, 150, 150, 0, st, 40, 6, true);
    G.box(0, 0, st / 2, 130, 130, st / 2, 0x1e1a18); G.box(0, 0, st + 8, 175, 175, 8, KC.trim); G.box(151, 0, 120, 3, 40, 70, KC.green);
    for (let i = 0; i < 30; i++) { const a = (i / 30) * Math.PI * 2, b = G.n; G.box(r, 0, 0, 7, (Math.PI * r) / 30 + 0.8, 130, [0x7a5a3c, 0x6e5034, 0x86643f][i % 3]); G.place(b, { z: st + 16 + 130, yaw: (a * 180) / Math.PI }); }
    G.lathe([[r - 8, st + 16], [r - 8, st + 270]], 0x2a2018, 30);
    for (const z of [st + 50, st + 140, st + 230]) G.lathe([[r + 6, z - 5], [r + 9, z - 3], [r + 9, z + 3], [r + 6, z + 5]], KC.iron, 30);
    G.lathe([[r + 12, st + 276], [r + 12, st + 282], [r * 0.5, st + 330], [0, st + 344]], (k) => (k < 1 ? KC.iron : 0x4a4a50), 24);
    G.tube([[r, 0, st + 60], [r + 70, 0, st + 64], [r + 160, 0, st + 40], [r + 190, 0, st - 30]], 13, 0x3a2a20, { S: 8, M: 10 });
    G.tube([[r + 2, 0, st + 266], [r + 120, 0, st + 200], [r + 168, 0, st + 70]], 1.5, KC.iron, { S: 4, M: 8 });
  })];
}

// ---- the gantry crane over the yard: two A-frame legs (iron, riveted), the girder across the top, the trolley with its
// winding drum, the chain and hook. Span along Y (spanY between the legs), height Hh. Its girder carries the rust's sacs.
export function gantry(spanY = 1400, Hh = 720) {
  spanY = q(spanY, 20);
  return ['dgantry|' + [spanY, Hh].join('|'), shape((G) => {
    const hs = spanY / 2;
    for (const s of [-1, 1]) { const y = s * hs; for (const sx of [-1, 1]) G.tube([[sx * 220, y, -10], [sx * 30, y, Hh - 20]], 13, KC.iron, { S: 6, M: 6 }); G.box(0, y, Hh * 0.45, 160, 6, 6, KC.ironL); G.box(0, y, 14, 240, 16, 14, KC.iron); for (const sx of [-1, 1]) G.tube([[sx * 190, y, 60], [0, y, Hh * 0.45]], 5, KC.ironL, { S: 5, M: 4 }); }
    G.box(0, 0, Hh + 20, 24, hs + 60, 40, 0x7a3a24); G.box(0, 0, Hh - 22, 30, hs + 64, 4, KC.iron); G.box(0, 0, Hh + 62, 30, hs + 64, 4, KC.iron);
    for (let y = -hs; y <= hs; y += 70) for (const sx of [-1, 1]) G.box(sx * 25, y, Hh + 20, 1.5, 3, 3, KC.ironL);
    G.box(0, 120, Hh - 40, 40, 50, 16, KC.iron); G.tube([[0, 90, Hh - 40], [0, 150, Hh - 40]], 18, KC.ironL, { S: 10, M: 3 });
    G.tube([[0, 120, Hh - 58], [0, 120, Hh - 360]], 2.5, KC.ironL, { S: 4, M: 8, caps: false }); G.tube([[0, 120, Hh - 360], [0, 110, Hh - 390], [0, 128, Hh - 410], [0, 134, Hh - 392]], 4.5, KC.iron, { S: 6, M: 6 });
  })];
}
export const gantryHangs = (spanY, Hh) => { const out = []; for (let y = -spanY / 2 + 120; y < spanY / 2 - 60; y += 260) out.push([0, y + (y > 60 && y < 180 ? 70 : 0), Hh - 22]); return out; };

// ---- the station's platform canopy: iron columns with brackets, a ridged roof of corrugated sheets, a valance of
// boards along its edges. Along Y (len), W deep (X), eave at E.
export function canopy(len = 1600, W = 420, E = 330) {
  len = q(len, 20);
  return ['dcanopy|' + [len, W, E].join('|'), shape((G) => {
    const hl = len / 2, hw = W / 2;
    for (let y = -hl + 100; y <= hl - 99; y += (len - 200) / Math.max(1, Math.round((len - 200) / 400))) { G.tube([[0, y, -6], [0, y, E + 30]], 9, KC.green, { S: 8, M: 4 }); G.lathe([[16, 0], [14, 10], [10, 16], [0, 16]], KC.green, 8, [0, y, -4]); for (const s of [-1, 1]) G.tube([[0, y, E - 60], [s * 70, y, E + 10], [s * 160, y, E + 26]], 3.4, KC.green, { S: 5, M: 6 }); }
    G.box(0, 0, E + 30, 7, hl, 7, KC.green);
    for (const s of [-1, 1]) { G.surf((u, v) => [s * (hw + 20) * v, -hl - 20 + u * (len + 40), E + 52 - 30 * v + Math.sin(u * len / 14) * 2], 0, 1, Math.round(len / 28), 0, 1, 2, (u) => (Math.floor(u * len / 28) % 2 ? 0x6a7076 : 0x5e646a)); G.surf((u, v) => [s * (hw + 20) * v, -hl - 20 + u * (len + 40), E + 48 - 30 * v], 0, 1, 2, 0, 1, 2, 0x3a3e42); for (let y = -hl - 20; y < hl + 20; y += 16) G.box(s * (hw + 21), y + 8, E + 6, 1.5, 7, 16, Math.round(y / 16) % 2 ? KC.cream : KC.greenL); G.box(s * (hw + 20), 0, E + 22, 3, hl + 20, 3, KC.green); }
  })];
}
export const canopyHangs = (len, W, E) => { const out = []; for (let y = -len / 2 + 160; y < len / 2 - 100; y += 330) out.push([W * 0.28, y, E + 34], [-W * 0.28, y + 160, E + 34]); return out.filter(([, y]) => Math.abs(y) < len / 2 - 60); };

// ---- a signal box: a brick ground floor, a timber upper floor glazed all round, a slate roof, a stair up the side (+Y)
export function signalBox() {
  return ['dsignalbox', shape((G) => {
    const W = 320, D = 420, hw = W / 2, hd = D / 2, F = 230, U = 220;
    brickRun(G, -hd, hd, hw, 0, F, 24, 2, true); brickRun(G, -hd, hd, -hw, 0, F, 24, 3, true); brickRun(G, -hw - 12, hw + 12, hd, 0, F, 24, 4); brickRun(G, -hw - 12, hw + 12, -hd, 0, F, 24, 5);
    G.box(0, 0, F / 2, hw - 10, hd - 10, F / 2, 0x1e1a18); G.box(0, 0, F + 6, hw + 14, hd + 14, 6, KC.trim);
    for (const [sx, alongY] of [[1, true], [-1, true]]) { void alongY; G.box(sx * hw, 0, F + 12 + U / 2, 3, hd, U / 2, KC.greenL); for (let y = -hd + 40; y < hd - 30; y += 70) { G.box(sx * (hw + 2), y + 20, F + 120, 2, 28, 50, KC.glass); G.box(sx * (hw + 3), y + 20, F + 120, 1.5, 30, 2, KC.cream); } }
    for (const sy of [-1, 1]) { G.box(0, sy * hd, F + 12 + U / 2, hw, 3, U / 2, KC.greenL); G.box(0, sy * (hd + 2), F + 120, hw - 40, 2, 50, KC.glass); }
    G.box(0, 0, F + 12 + U / 2, hw - 4, hd - 4, U / 2, 0x1e1a18);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.box(sx * hw, sy * hd, F + 12 + U / 2, 6, 6, U / 2, KC.green);
    const top = F + 12 + U, ridge = top + 120;
    for (const sx of [-1, 1]) { G.surf((u, v) => [sx * (hw + 30) * (1 - v), -hd - 30 + u * (D + 60), top - 20 + (ridge - top + 20) * v + 3], 0, 1, 8, 0, 1, 6, (u, v) => KC.slate[(Math.floor(v * 6) + Math.floor(u * 10)) % 3]); G.surf((u, v) => [sx * (hw + 30) * (1 - v), -hd - 30 + u * (D + 60), top - 24 + (ridge - top + 20) * v], 0, 1, 2, 0, 1, 2, 0x2a2624); }
    for (const sy of [-1, 1]) { const gab = (x) => top + (hw + 30 - Math.abs(x)) / (hw + 30) * 120; for (let x = -hw; x < hw; x += 20) { const g = gab(x + 10 > 0 ? x + 20 : x) - 8; G.box(x + 10, sy * hd, (top + g) / 2, 10, 3, Math.max(1, (g - top) / 2), KC.greenL); } }
    G.box(0, 0, ridge + 4, 6, hd + 32, 5, 0x6a6a70);
    // the stair up the +Y end to a landing and the door
    for (let i = 0; i < 11; i++) { const z = 10 + i * 21, y = hd + 60 + (10 - i) * 26; G.box(-hw + 60, y, z, 50, 13, 3, KC.woodD); }
    for (const x of [-hw + 10, -hw + 110]) G.tube([[x, hd + 330, 0], [x, hd + 60, F + 10]], 4, KC.woodD, { S: 5, M: 4 });
    G.box(-hw + 60, hd + 40, F + 8, 50, 40, 4, KC.woodD); G.box(-hw + 60, hd + 2, F + 100, 34, 2, 86, KC.green);
  })];
}

// ---- a barrel: oak staves, iron hoops, a head
export function barrel(seed = 1) {
  return ['dbarrel|' + (seed % 3), shape((G) => {
    const c = [0x7a5a3c, 0x6e5034, 0x86643f][seed % 3];
    G.lathe([[28, 0], [33, 22], [34, 46], [33, 70], [28, 92]], (k) => (k % 2 ? c : dark(c, 0.88)), 14);
    for (const z of [10, 30, 62, 82]) G.lathe([[33.5 + (z === 30 || z === 62 ? 1 : -2.5), z - 3], [34 + (z === 30 || z === 62 ? 1 : -2.5), z + 3]], KC.iron, 14);
    G.lathe([[0, 88], [28, 88]], dark(c, 0.8), 14);
  })];
}

// ---- the depot's gate: two brick piers with stone caps and lamps, an iron arch between them for the name, the iron
// gates swung back against the walls. Span along Y (w between the piers).
export function depotGate(w = 700) {
  w = q(w, 20);
  return ['ddepotgate|' + w, shape((G) => {
    const hw = w / 2;
    for (const s of [-1, 1]) { const y = s * (hw + 40); brickRun(G, -40, 40, y - 40, 0, 360, 10, 7 + s); brickRun(G, -40, 40, y + 40, 0, 360, 10, 9 + s); brickRun(G, -40, 40, y, 0, 360, 80, 11 + s, false); G.box(0, y, 368, 50, 50, 8, KC.trim); G.lathe([[30, 376], [34, 384], [20, 396], [0, 400]], KC.trim, 10, [0, y, 0]); }
    G.surf((u, v) => { const y = (u - 0.5) * 2 * hw, z = 380 + Math.sqrt(Math.max(0, 1 - (y / hw) ** 2)) * 70 + v * 8; return [0, y, z]; }, 0, 1, 24, 0, 1, 1, KC.iron);
    G.surf((u, v) => { const y = (u - 0.5) * 2 * hw, z = 340 + Math.sqrt(Math.max(0, 1 - (y / hw) ** 2)) * 70 + v * 6; return [0, y, z]; }, 0, 1, 24, 0, 1, 1, KC.iron);
    for (let y = -hw + 30; y < hw; y += 40) { const z0 = 340 + Math.sqrt(Math.max(0, 1 - (y / hw) ** 2)) * 70, z1 = 380 + Math.sqrt(Math.max(0, 1 - (y / hw) ** 2)) * 70; G.box(0, y, (z0 + z1) / 2 + 3, 1.5, 1.5, (z1 - z0) / 2, KC.iron); }
    G.box(0, 0, 430, 3, hw * 0.62, 26, 0x2a2a30);
    for (const s of [-1, 1]) { const y0 = s * (hw + 40 - 40); for (let k = 0; k < 9; k++) { const x = -40 - k * 30; G.box(x, y0 + s * (-2), 150, 2, 2, 150, KC.iron); } G.box(-160, y0, 290, 130, 3, 3, KC.iron); G.box(-160, y0, 30, 130, 3, 3, KC.iron); G.box(-160, y0, 160, 130, 3, 3, KC.iron); }
  })];
}

// ---- an iron footbridge over the lines: a stair tower each end (brick piers, iron stairs in two flights), the lattice
// span between them up high (walk under it, not on it). Span along Y: the towers' middles spanY apart.
export function footbridge2(spanY = 900) {
  spanY = q(spanY, 20);
  return ['dfootbridge2|' + spanY, shape((G) => {
    const hs = spanY / 2, D = 420;
    for (const s of [-1, 1]) { const y = s * hs;
      for (const [dx, dy] of [[-70, -60], [70, -60], [-70, 60], [70, 60]]) G.box(dx, y + dy, D / 2, 9, 9, D / 2, KC.iron);
      G.box(0, y, D, 90, 80, 6, KC.iron); for (const sx of [-1, 1]) G.box(sx * 88, y, D + 50, 2, 80, 50, KC.green);
      for (let i = 0; i < 12; i++) { const z = 14 + i * 33, x = -60 + i * 24 - 150; G.box(x, y + s * 60, z, 12, 42, 3, KC.iron); }
      G.tube([[-210, y + s * 60, 0], [-70, y + s * 60, D]], 4, KC.iron, { S: 5, M: 4 }); G.tube([[-210, y + s * 60, 60], [-70, y + s * 60, D + 70]], 2.5, KC.green, { S: 5, M: 4 });
    }
    for (const sx of [-1, 1]) { G.box(sx * 60, 0, D + 4, 4, hs + 80, 6, KC.iron); G.box(sx * 60, 0, D + 110, 4, hs + 80, 4, KC.green); for (let y = -hs + 20; y < hs; y += 40) { G.tube([[sx * 60, y, D + 8], [sx * 60, y + 40, D + 106]], 1.6, KC.green, { S: 4, M: 2 }); G.tube([[sx * 60, y + 40, D + 8], [sx * 60, y, D + 106]], 1.6, KC.green, { S: 4, M: 2 }); } }
    G.box(0, 0, D + 2, 58, hs + 80, 3, KC.woodD);
    G.surf((u, v) => [(u - 0.5) * 150, -hs - 90 + v * (spanY + 180), D + 150 + Math.sin(u * Math.PI) * 30], 0, 1, 6, 0, 1, 8, 0x5e646a);
    for (const sx of [-1, 1]) for (let y = -hs - 80; y <= hs + 80; y += (spanY + 160) / 6) G.box(sx * 62, y, D + 130, 2, 2, 22, KC.green);
  })];
}
// ---- a hand crane on the goods platform: a timber post, the jib on its stay, a winding drum and the hook
export function handCrane() {
  return ['dhandcrane', shape((G) => {
    G.box(0, 0, 20, 40, 40, 20, KC.trimD); G.box(0, 0, 220, 14, 14, 200, KC.woodD);
    G.tube([[0, 0, 360], [260, 0, 380]], 8, KC.woodD, { S: 6, M: 4 }); G.tube([[0, 0, 150], [240, 0, 372]], 5, KC.iron, { S: 5, M: 4 });
    G.tube([[18, -16, 120], [18, 16, 120]], 14, KC.ironL, { S: 10, M: 2 }); G.tube([[18, 26, 120], [30, 26, 100]], 2.4, KC.iron, { S: 5, M: 2 });
    G.tube([[258, 0, 374], [258, 0, 230]], 1.4, KC.iron, { S: 4, M: 4, caps: false }); G.tube([[258, 0, 230], [252, 0, 214], [262, 0, 204], [266, 0, 214]], 3, KC.iron, { S: 5, M: 4 });
  })];
}
// ---- a stack of sawn timber on bearers, a sheet of tarpaulin half over it
export function timberStack(len = 400) {
  len = q(len, 20);
  return ['dtimber|' + len, shape((G) => {
    for (const y of [-len * 0.35, 0, len * 0.35]) G.box(y, 0, 6, 8, 70, 6, KC.woodD);
    for (let r = 0; r < 5; r++) for (let i = 0; i < 6; i++) G.box(0, -55 + i * 22, 16 + r * 11, len / 2, 10, 5, r % 2 ? 0xb08a5a : 0xa07a4e);
    G.surf((u, v) => [-len / 2 + u * len * 0.55, -70 + v * 140, 72 + Math.sin(v * Math.PI) * 6 - (v < 0.05 || v > 0.95 ? 30 : 0)], 0, 1, 4, 0, 1, 6, 0x5a6a4a);
  })];
}
