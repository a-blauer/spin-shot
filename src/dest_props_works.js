// Sculpted pieces for the Works' places (Cogsworth Depot first): brick and slate, iron and brass, the railway's gear.
// Same rules as dest_props.js: UE frame (X the front, Y right, Z up, cm), [key, build] pairs, keys carry every number
// the shape depends on, things stand on z = 0, every piece whole (nothing hangs in the air or stops short).
import { shapeB as shape, wob } from './propkit.js';
import { dark, mix } from './village_shapes.js';
import { q, rng } from './dest_props.js';

export const KC = {   // the Works' colours
  brick: [0x9a4a36, 0x8a4230, 0xa65440, 0x7e3c2c], mortar: 0x5e5048, trim: 0xc8bca4, trimD: 0xa89c86,
  slate: [0x4a525c, 0x545c66, 0x3e464e], iron: 0x2e3034, ironL: 0x5a5e64, brass: 0xc8963c, green: 0x2e5a42, greenL: 0x3e7254,
  cream: 0xe8dcc0, red: 0x9a3428, coal: 0x1e1c1e, coalL: 0x34302e, ballast: 0x8a8782, ballastL: 0x9e9b94, ballastD: 0x6e6b66, ballastO: 0x57534e, sleeper: 0x4e3e30, rail: 0x8a8a90,
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
  seed = Math.abs(Math.round(seed)) || 0;   // a negative or fractional seed would pick no colour (black)
  const key = 'dbrickhouse|' + [W, D, H, seed % 4, JSON.stringify(opts)].join('|');
  return [key, shape((G) => {
    const hw = W / 2, hd = D / 2, t = 24, pitch = opts.pitch || 0.62, ridge = H + hw * pitch, over = 30;
    const doors = opts.doors || [], win = opts.windows || {}, wz = opts.wz || 170, wh = opts.wh || 120, ww = opts.ww || 80;
    // walls, courses round all four sides, cut for the openings
    const cut = (side, pos) => doors.filter((d) => (d.side || 1) === side).map((d) => [d.y - d.w / 2, d.y + d.w / 2, 0, d.h]).concat((side === 1 ? win.front : side === -1 ? win.back : []) ? (side === 1 ? win.front || [] : win.back || []).map((y) => [y - ww / 2, y + ww / 2, wz - wh / 2, wz + wh / 2]) : []);
    const wall = (sx) => { const holes = cut(sx, 0); let z = 0; const bands = [0]; for (const [, , a, b] of holes) bands.push(a, b); bands.push(H); const zs = [...new Set(bands)].sort((a, b) => a - b);
      for (let i = 0; i < zs.length - 1; i++) { const z0 = zs[i], z1 = zs[i + 1], mid = (z0 + z1) / 2, hs = holes.filter(([, , a, b]) => mid > a && mid < b).sort((a, b) => a[0] - b[0]); let y = -hd; for (const [a, b] of hs) { if (a > y + 2) brickRun(G, y, a, sx * hw, z0, z1, t, seed + i + sx * 3, true, !!opts.coarse); y = b; } if (hd > y + 2) brickRun(G, y, hd, sx * hw, z0, z1, t, seed + i + sx * 5, true, !!opts.coarse); } void z; };
    wall(1); wall(-1);
    for (const sy of [-1, 1]) { brickRun(G, -hw - t / 2, hw + t / 2, sy * hd, 0, H, t, seed + 11 + sy, false, !!opts.coarse); const gab = (x) => H + (hw - Math.abs(x)) * pitch; for (let x = -hw; x < hw; x += 30) { const top = gab(x + 15 > 0 ? x + 30 : x); G.box(x + 15, sy * hd, (H + top) / 2, 15, t / 2, Math.max(1, (top - H) / 2), KC.brick[(Math.round(x / 30) + 4) & 3]); } }
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
  seed = Math.abs(Math.round(seed)) || 0;   // a negative or fractional seed would pick no colour (black)
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

// ---- a run of track along X: a bed of grey ballast (its top mottled, oily down the middle, its shoulders sloped to
// the ground), sleepers bedded in it, rails on their base plates. Gauge 110 (gnome gauge). Rails' top at RAIL_TOP:
// anything that runs on them stands at z = RAIL_TOP. Low enough (10) to walk over.
export const GAUGE = 110, RAIL_TOP = 10.4;
export function track(len = 1000, seed = 1) {
  seed = Math.abs(Math.round(seed)) || 0;   // a negative or fractional seed would pick no colour (black)
  len = q(len, 20);
  return ['dtrack2|' + [len, seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 7 + len), hl = len / 2, hw = GAUGE / 2, bw = hw + 72, nu = Math.max(2, Math.round(len / 50));
    G.surf((u, v) => [-hl + u * len, (v - 0.5) * 2 * bw, 3.5], 0, 1, nu, 0, 1, 8, (u, v) => { const n = Math.sin(u * len * 0.071 + v * 9.3 + seed) + Math.sin(u * len * 0.023 - v * 5.1 + seed * 2); return Math.abs(v - 0.5) < 0.22 ? (n > 0.5 ? KC.ballastO : mix(KC.ballastO, KC.ballast, 0.45)) : n > 0.9 ? KC.ballastL : n < -1 ? KC.ballastD : KC.ballast; });
    for (const s of [-1, 1]) G.surf((u, v) => [-hl + u * len, s * (bw + v * 26), 3.5 * (1 - v)], 0, 1, Math.max(1, Math.round(nu / 4)), 0, 1, 1, KC.ballastD);
    for (const sx of [-1, 1]) G.surf((u, v) => [sx * hl, (u - 0.5) * 2 * bw, 3.5 * v], 0, 1, 2, 0, 1, 1, KC.ballastD);
    for (let x = -hl + 24; x < hl - 10; x += 48) G.box(x + (R() - 0.5) * 4, 0, 4.2, 9, hw + 30, 1.8, R() > 0.3 ? KC.sleeper : dark(KC.sleeper, 0.8));
    for (const s of [-1, 1]) { G.box(0, s * hw, 6.4, hl, 4.5, 0.4, KC.iron); G.box(0, s * hw, 8.1, hl, 1.8, 1.3, KC.rail); G.box(0, s * hw, 9.9, hl, 3.2, 0.5, mix(KC.rail, 0xffffff, 0.3)); }
  })];
}
// ---- a buffer stop at the end of a siding: a timber beam on iron legs, two sprung buffers
export function bufferStop() {
  return ['dbufferstop2', shape((G) => {
    const zb = 54 + RAIL_TOP;
    for (const s of [-1, 1]) { G.box(0, s * GAUGE / 2, (RAIL_TOP + zb + 12) / 2, 8, 5, (zb + 12 - RAIL_TOP) / 2, KC.iron); G.tube([[-6, s * GAUGE / 2, zb + 2], [-80, s * GAUGE / 2, 3]], 4, KC.iron, { S: 6, M: 3 }); G.box(-80, s * GAUGE / 2, 3, 10, 8, 3, KC.iron); }
    G.box(4, 0, zb, 10, GAUGE / 2 + 30, 12, KC.red); for (let y = -GAUGE / 2 - 20; y < GAUGE / 2 + 21; y += 20) G.box(15, y, zb, 1, 8, 12, y % 40 ? KC.cream : KC.red);
    for (const s of [-1, 1]) { G.tube([[14, s * 45, zb], [34, s * 45, zb]], 6, KC.ironL, { S: 8, M: 2 }); const b = G.n; G.lathe([[0, 0], [12, 0], [12, 4], [0, 4]], KC.iron, 12, [0, 0, 0]); G.place(b, { x: 34, y: s * 45, z: zb, pitch: 90 }); }
  })];
}

// ---- the depot's engine: a little tank engine, deep green, brass and red: the boiler with its smokebox and chimney
// forward (+X), the dome and safety valves, the cab behind with its roof, coal in the bunker, three pairs of red
// drivers with their rods, buffers and lamps. Stands on the rails (gauge GAUGE). About 760 long.
export function locomotive(seed = 1) {
  seed = Math.abs(Math.round(seed)) || 0;   // a negative or fractional seed would pick no colour (black)
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
    G.surf((u, v) => { const y = (u - 0.5) * 208; return [-290 + v * 180, y, zA + 325 + 18 * (1 - (y / 104) ** 2)]; }, 0, 1, 8, 0, 1, 3, 0x2a2a2e);
    G.box(-330, 0, zA + 150, 40, 90, 96, body); G.blob(-330, 0, zA + 248, 36, 80, 18, KC.coal, { nu: 10, nv: 5 });
    // buffers and beams front and back, lamps, a brass number plate, the couplings
    for (const sx of [-1, 1]) { G.box(sx * 380, 0, zA + 38, 6, 96, 18, KC.red); for (const s of [-1, 1]) { G.tube([[sx * 386, s * 60, zA + 38], [sx * 410, s * 60, zA + 38]], 6, KC.ironL, { S: 8, M: 2 }); const b = G.n; G.lathe([[0, 0], [12, 0], [12, 4], [0, 4]], KC.iron, 12, [0, 0, 0]); G.place(b, { x: sx * 410, y: s * 60, z: zA + 38, pitch: sx * 90 }); } G.tube([[sx * 386, 0, zA + 36], [sx * 400, 0, zA + 30]], 3, KC.iron, { S: 5, M: 2 }); }
    for (const s of [-1, 1]) { G.box(372, s * 50, zA + 67, 8, 10, 12, KC.iron); G.box(380, s * 50, zA + 67, 1.5, 7, 9, 0xfff0c0); }
    G.box(-125.5, 0, zA + 300, 1.5, 30, 10, KC.brass);
  })];
}
export const LOCO_LEN = 830;

// ---- wagons on the rails (about 520 long): 0 a coal wagon heaped with coal; 1 a flat wagon with crates roped down;
// 2 a closed van, its door slid open
export function wagon(kind = 0, seed = 1) {
  seed = Math.abs(Math.round(seed)) || 0;   // a negative or fractional seed would pick no colour (black)
  return ['dwagon|' + [kind, seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 31 + kind), col = [0x5a3e2e, 0x6a4a34, 0x5e4a3e][seed % 3], z0 = 40;
    G.box(0, 0, z0 + 14, 250, 70, 10, KC.iron);
    for (const x of [-150, 150]) for (const s of [-1, 1]) { const wb = G.n; G.lathe([[0, -6], [36, -6], [38, -2], [38, 2], [36, 6], [0, 6]], KC.iron, 14, [0, 0, 0]); G.place(wb, { x, y: s * (GAUGE / 2 + 6), z: 38, roll: 90 }); G.box(x, s * (GAUGE / 2 + 20), 46, 30, 4, 14, KC.ironL); }
    for (const sx of [-1, 1]) { G.box(sx * 252, 0, z0 + 14, 4, 80, 10, KC.red); for (const s of [-1, 1]) { G.tube([[sx * 256, s * 50, z0 + 14], [sx * 276, s * 50, z0 + 14]], 5, KC.ironL, { S: 8, M: 2 }); const b = G.n; G.lathe([[0, 0], [10, 0], [10, 3], [0, 3]], KC.iron, 12, [0, 0, 0]); G.place(b, { x: sx * 276, y: s * 50, z: z0 + 14, pitch: sx * 90 }); } }
    if (kind === 0) { G.box(0, 0, z0 + 70, 240, 86, 48, col); for (let x = -220; x <= 220; x += 55) for (const s of [-1, 1]) G.box(x, s * 87, z0 + 70, 3, 2, 48, KC.iron); G.blob(0, 0, z0 + 112, 230, 78, 26, (nx, ny, nz) => (wob(nx * 9 + seed, ny * 9) > 0.4 ? KC.coalL : KC.coal), { nu: 16, nv: 6 }); }
    if (kind === 1) { G.box(0, 0, z0 + 28, 250, 86, 4, col); for (const [x, y, w] of [[-140, -30, 50], [-140, 34, 44], [-40, 0, 60], [80, -28, 46], [80, 30, 46], [170, 0, 54], [-40, 0, 60 * 3]]) { if (w > 100) continue; G.box(x, y, z0 + 32 + w, w, w * 0.9, w, R() > 0.5 ? KC.wood : mix(KC.wood, 0xffffff, 0.15)); for (const s of [-1, 1]) G.box(x, y + s * w * 0.9, z0 + 32 + w, w - 2, 0.6, 3, KC.woodD); } for (const [x, y, w] of [[-140, -30, 50], [-140, 34, 44], [80, -28, 46], [80, 30, 46]]) { const top = z0 + 32 + 2 * w, hy = w * 0.9 + 1.2; G.box(x, y, top + 0.9, 1.5, hy + 1.5, 1.2, 0xb09a6c); for (const s of [-1, 1]) G.box(x, y + s * hy, (z0 + 32 + top) / 2 + 0.5, 1.5, 1.2, (top - z0 - 32) / 2 + 1, 0xb09a6c); } }
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
  seed = Math.abs(Math.round(seed)) || 0;   // a negative or fractional seed would pick no colour (black)
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

// ---- an iron footbridge over the lines, closed: a stair tower each end (four iron posts, braced, a landing on top), a
// straight stair down from each landing (open treads between two stringers, a post under its middle, balusters and a
// handrail), the span between the landings (two lattice girders, a plank deck) and a curved roof over all of it on the
// girders and the towers' posts. The stairs are boarded across at the foot. Span along Y (the towers' middles spanY
// apart); each stair runs down toward +X from the landing's edge (x = FB2.land) to x = FB2.foot.
// Collision (the depot): each tower a box; each stair one steep slab (60 degrees: too steep to walk up).
export const FB2 = { D: 420, land: 90, foot: 330, sw: 52 };
export function footbridge2(spanY = 900) {
  spanY = q(spanY, 20);
  return ['dfootbridge3|' + spanY, shape((G) => {
    const hs = spanY / 2, { D, land, foot, sw } = FB2, n = 12, rise = D / n, tread = (foot - land) / n, rail = 96, RZ = D + 160;
    const xs0 = foot + 6, xs1 = land - 4, strZ = (x) => (D + 2) * (xs0 - x) / (xs0 - xs1);   // the stringer's height at x
    const roofZ = (x) => D + 156 + Math.sin(((x / 156) + 0.5) * Math.PI) * 26;
    for (const s of [-1, 1]) { const y = s * hs, yi = y - s * 80, yo = y + s * 80;   // inner edge (to the span) and outer edge
      // the tower: four posts up to the roof, stone pads, ring beams, X braces on three faces (the stair side is open)
      for (const [dx, dy] of [[-70, -60], [70, -60], [-70, 60], [70, 60]]) { const top = roofZ(dx) + 2; G.box(dx, y + dy, top / 2, 7, 7, top / 2, KC.iron); G.box(dx, y + dy, 6, 14, 14, 6, KC.trimD); }
      for (const z of [D * 0.5, D - 12]) { for (const dy of [-60, 60]) G.box(0, y + dy, z, 70, 4, 5, KC.iron); for (const dx of [-70, 70]) G.box(dx, y, z, 4, 60, 5, KC.iron); }
      for (const [z0, z1] of [[14, D * 0.5], [D * 0.5, D - 12]]) { for (const dy of [-60, 60]) { G.tube([[-70, y + dy, z0], [70, y + dy, z1]], 2.2, KC.iron, { S: 4, M: 2 }); G.tube([[70, y + dy, z0], [-70, y + dy, z1]], 2.2, KC.iron, { S: 4, M: 2 }); } G.tube([[-70, y - 60, z0], [-70, y + 60, z1]], 2.2, KC.iron, { S: 4, M: 2 }); G.tube([[-70, y + 60, z0], [-70, y - 60, z1]], 2.2, KC.iron, { S: 4, M: 2 }); }
      // the landing: planks on an iron frame; rails round it but where the span and the stair come in
      G.box(0, y, D - 3, land, 80, 3, KC.wood); G.box(0, y, D - 8, land, 80, 2, KC.iron);
      const railRun = (x0, y0, x1, y1) => { G.tube([[x0, y0, D + rail], [x1, y1, D + rail]], 2.4, KC.green, { S: 5, M: 2 }); const L = Math.hypot(x1 - x0, y1 - y0), m = Math.max(1, Math.round(L / 22)); for (let i = 0; i <= m; i++) { const t = i / m; G.box(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, D + rail / 2, 1.2, 1.2, rail / 2, KC.green); } };
      railRun(-land + 2, yo - s * 2, land - 2, yo - s * 2);
      railRun(-land + 2, y - 78, -land + 2, y + 78);
      for (const e of [-1, 1]) railRun(land - 2, y + e * (sw + 4), land - 2, y + e * 78);
      for (const e of [-1, 1]) railRun(e * 66, yi + s * 2, e * (land - 2), yi + s * 2);
      // the stair: treads between the stringers, a post under its middle, balusters, the handrail, boards at the foot
      for (let k = 1; k < n; k++) { const z = k * rise, x = foot - k * tread + tread / 2; G.box(x, y, z - 2.5, tread / 2 + 2, sw - 1, 2.5, KC.woodD); }
      for (const e of [-1, 1]) { const yy = y + e * sw, xm = (foot + land) / 2;
        G.tube([[xs0, yy, 0], [xs1, yy, D + 2]], 4.5, KC.iron, { S: 6, M: 4 });
        G.tube([[xs0, yy, rail], [xs1, yy, D + 2 + rail]], 2.4, KC.green, { S: 5, M: 4 });
        for (let x = xs0 - 18; x > xs1 + 8; x -= 26) G.tube([[x, yy, strZ(x) + 3], [x, yy, strZ(x) + rail - 1]], 1.2, KC.green, { S: 4, M: 2 });
        G.tube([[xm, yy, 0], [xm, yy, strZ(xm)]], 4, KC.iron, { S: 6, M: 3 }); G.box(xm, yy, 5, 10, 10, 5, KC.trimD);
      }
      for (const e of [-1, 1]) G.box(xs0 + 7, y + e * (sw - 6), 55, 2, 4, 52, KC.woodD);
      for (const e of [-1, 1]) for (let x = land + 4; x < xs0 - 6; x += 18) { const h = strZ(x + 18) - 2; if (h < 8) continue; G.box(x + 9, y + e * (sw + 5), h / 2, 8.6, 1.6, h / 2, Math.round(x / 18) % 2 ? KC.woodD : mix(KC.woodD, 0x000000, 0.12)); }
      for (const z of [26, 58, 90]) G.box(xs0 + 10, y, z, 3, sw + 6, 9, mix(KC.wood, 0x000000, z === 58 ? 0.15 : 0));
    }
    // the span: two lattice girders between the landings, a plank deck, posts up to the roof
    const ya = -hs + 80, yb = hs - 80, len = yb - ya;
    for (const sx of [-1, 1]) { const x = sx * 62;
      G.box(x, 0, D + 6, 4, len / 2, 6, KC.iron); G.box(x, 0, D + 112, 4, len / 2, 4, KC.green);
      const nb = Math.max(4, Math.round(len / 50)); for (let i = 0; i < nb; i++) { const y0 = ya + len * (i / nb), y1 = ya + len * ((i + 1) / nb); G.tube([[x, y0, D + 12], [x, y1, D + 108]], 1.6, KC.green, { S: 4, M: 2 }); G.tube([[x, y1, D + 12], [x, y0, D + 108]], 1.6, KC.green, { S: 4, M: 2 }); }
      for (let i = 0; i <= 5; i++) { const y = ya + len * (i / 5); G.box(x, y, D + 60, 4, 4, 52, KC.iron); const t = roofZ(x); G.box(x, y, (D + 116 + t) / 2, 2.5, 2.5, (t - D - 116) / 2 + 1, KC.green); }
    }
    G.box(0, 0, D + 3, 58, len / 2, 3, KC.wood); for (let y = ya + 20; y < yb; y += 40) G.box(0, y, D + 6.2, 58, 0.8, 0.4, KC.woodD);
    G.surf((u, v) => [(u - 0.5) * 156, -hs - 92 + v * (spanY + 184), roofZ((u - 0.5) * 156)], 0, 1, 8, 0, 1, Math.max(6, Math.round(spanY / 80)), (u) => (Math.round(u * 8) % 2 ? 0x5e646a : 0x545a60));
    for (const sy of [-1, 1]) G.surf((u, v) => [(u - 0.5) * 156, sy * (hs + 92), D + 156 + (roofZ((u - 0.5) * 156) - D - 156) * v], 0, 1, 8, 0, 1, 1, 0x4a5056);
    for (const sy of [-1, 1]) G.box(0, sy * (hs + 70), D + 154, 78, 3, 3, KC.iron);
  })];
}
// ---- a hand crane on the goods platform: a timber post, the jib on its stay, a winding drum and the hook
export function handCrane() {
  return ['dhandcrane', shape((G) => {
    G.box(0, 0, 20, 40, 40, 20, KC.trimD); G.box(0, 0, 220, 14, 14, 200, KC.woodD);
    G.tube([[0, 0, 360], [260, 0, 380]], 8, KC.woodD, { S: 6, M: 4 }); G.tube([[0, 0, 150], [240, 0, 372]], 5, KC.iron, { S: 5, M: 4 });
    G.tube([[18, -16, 120], [18, 16, 120]], 14, KC.ironL, { S: 10, M: 2 }); G.tube([[18, 10, 120], [18, 30, 120]], 2.6, KC.iron, { S: 6, M: 2 }); G.tube([[18, 30, 120], [30, 30, 102]], 2.2, KC.iron, { S: 5, M: 2 }); G.tube([[30, 30, 102], [30, 42, 102]], 2.2, KC.woodD, { S: 5, M: 2 });
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

// ---- an old carriage body, its wheels long gone, set down on piles of sleepers as the gangers' mess room: panelled
// sides (crimson below the waist, cream above), five compartment doors a side with droplights, windows between, a
// curved roof with its lamp tops and a stovepipe through it, timber steps up to the second door on the +Y side.
// Along X; its floor at COACH.floor.
export const COACH = { len: 760, w: 196, floor: 58, eave: 280, stepX: -150 };
export function coachBody(seed = 1) {
  seed = Math.abs(Math.round(seed)) || 0;
  return ['dcoach|' + (seed % 2), shape((G) => {
    const { len, w, floor, eave } = COACH, hl = len / 2, hw = w / 2, low = seed % 2 ? 0x5a2a26 : 0x6e3028, up = 0xd8c8a2, waist = floor + 118, lining = 0xc8a050;
    // four piles of sleepers, crossed, three high
    for (const x of [-hl + 90, -hl + 290, hl - 290, hl - 90]) for (let k = 0; k < 3; k++) { const c = k === 1 ? KC.sleeper : dark(KC.sleeper, 0.85); if (k % 2 === 0) for (const dx of [-26, 26]) G.box(x + dx, 0, 9 + k * 18, 12, hw + 4, 9, c); else for (const dy of [-(hw - 34), hw - 34]) G.box(x, dy, 9 + k * 18, 44, 12, 9, c); }
    // underframe and floor; the body in two colours with a black waist line and a gold line under the eaves
    for (const s of [-1, 1]) G.box(0, s * (hw - 6), floor + 2, hl - 10, 6, 8, KC.iron);
    G.box(0, 0, floor + 8, hl, hw, 4, 0x3a2e26);
    G.box(0, 0, (floor + 12 + waist) / 2, hl, hw, (waist - floor - 12) / 2, low); G.box(0, 0, (waist + eave) / 2, hl, hw, (eave - waist) / 2, up);
    G.box(0, 0, waist, hl + 0.6, hw + 0.6, 2.4, 0x1e1a18); G.box(0, 0, eave - 8, hl + 0.6, hw + 0.6, 1.2, lining);
    // the sides: doors with droplights and handles, pairs of windows between, mouldings
    const dw = 64, nD = 5, pitch = (len - 120) / nD;
    const pane = (x, y, s, z, hx, hz, fr) => { G.box(x, y + s * 1.2, z, hx, 0.8, hz, KC.glass); for (const e of [-1, 1]) { G.box(x, y + s * 2.2, z + e * (hz + 1.5), hx + 3, 0.6, 1.5, fr); G.box(x + e * (hx + 1.5), y + s * 2.2, z, 1.5, 0.6, hz, fr); } };
    for (const s of [-1, 1]) { const y = s * (hw + 0.8);
      for (let i = 0; i < nD; i++) { const xd = -hl + 60 + pitch * (i + 0.5);
        G.box(xd, y, (floor + 14 + eave - 16) / 2, dw / 2 + 3, 0.8, (eave - floor - 30) / 2 + 3, 0x1e1a18);
        G.box(xd, y + s * 0.6, (floor + 16 + waist) / 2, dw / 2, 0.8, (waist - floor - 16) / 2 - 1, low); G.box(xd, y + s * 0.6, (waist + eave - 18) / 2, dw / 2, 0.8, (eave - 18 - waist) / 2 - 1, up);
        pane(xd, y, s, waist + 70, dw / 2 - 10, 42, dark(up, 0.7));
        G.box(xd + dw / 2 - 12, y + s * 2.6, waist - 10, 6, 1.6, 2, KC.brass); for (const e of [-1, 1]) G.box(xd + e * (dw / 2 + 10), y + s * 2, waist - 30, 1.4, 1.4, 34, KC.brass);
        if (i < nD - 1) for (const e of [-1, 1]) pane(xd + pitch / 2 + e * 26, y, s, waist + 66, 18, 38, dark(up, 0.75)); }
      for (const z of [floor + 40, waist - 30]) G.box(0, y + s * 0.5, z, hl - 6, 0.6, 1.2, dark(low, 0.75)); }
    // the ends: panelled, a lamp iron each, a window at the mess-room end
    for (const sx of [-1, 1]) { const x = sx * (hl + 0.8); G.box(x, 0, (floor + 30 + waist) / 2, 0.8, hw - 20, (waist - floor - 30) / 2, dark(low, 0.85)); G.box(x + sx * 1.2, 0, eave - 30, 2, 8, 14, KC.iron); }
    G.box(hl + 1.2, 30, waist + 60, 0.8, 30, 34, KC.glass); for (const e of [-1, 1]) { G.box(hl + 2.2, 30, waist + 60 + e * 35.5, 0.6, 33, 1.5, dark(up, 0.75)); G.box(hl + 2.2, 30 + e * 31.5, waist + 60, 0.6, 1.5, 34, dark(up, 0.75)); }
    // the roof: a gentle curve, rain strips, four lamp tops along the middle, the stovepipe and its cowl
    G.surf((u, v) => { const y = (v - 0.5) * (w + 12); return [-hl - 6 + u * (len + 12), y, eave + 34 * (1 - (y / (hw + 6)) ** 2)]; }, 0, 1, 10, 0, 1, 8, 0x6a6a6e);
    for (const s of [-1, 1]) G.box(0, s * (hw - 14), eave + 34 * (1 - ((hw - 14) / (hw + 6)) ** 2) + 1, hl, 1.2, 1.2, 0x4a4a4e);
    for (let i = 0; i < 4; i++) { const x = -hl + 140 + i * ((len - 280) / 3); G.lathe([[12, 0], [12, 6], [9, 12], [0, 14]], 0x4a4a4e, 10, [x, 0, eave + 32]); }
    G.tube([[hl - 90, 40, eave + 26], [hl - 90, 40, eave + 120]], 6, KC.iron, { S: 8, M: 3 }); G.lathe([[0, 0], [14, 0], [16, 6], [0, 18]], KC.iron, 8, [hl - 90, 40, eave + 122]); G.box(hl - 90, 40, eave + 121, 7, 7, 1, KC.iron);
    // timber steps up to the second door on the +Y side: three treads on two stringers
    { const xd = COACH.stepX; for (const e of [-1, 1]) G.box(xd + e * 34, hw + 34, floor / 2, 3, 30, floor / 2, KC.woodD); for (let k = 0; k < 3; k++) G.box(xd, hw + 54 - k * 18, 10 + k * 16, 34, 10, 3, KC.wood); }
  })];
}
// ---- spare rails on timber trestles: three trestles, four rails across them, spacers, three more rails on top
export function railRack(len = 640) {
  len = q(len, 20);
  return ['drailrack|' + len, shape((G) => {
    const hl = len / 2, xs = [-len * 0.36, 0, len * 0.36];
    const rail = (y, z) => { G.box(0, y, z + 0.8, hl, 6, 0.8, KC.iron); G.box(0, y, z + 5, hl, 2, 3.5, KC.rail); G.box(0, y, z + 9.6, hl, 3.6, 1.2, mix(KC.rail, 0xffffff, 0.25)); };
    for (const x of xs) { for (const e of [-1, 1]) { G.tube([[x - 34, e * 82, 0], [x - 4, e * 74, 60]], 4, KC.woodD, { S: 5, M: 2 }); G.tube([[x + 34, e * 82, 0], [x + 4, e * 74, 60]], 4, KC.woodD, { S: 5, M: 2 }); } G.box(x, 0, 64, 9, 96, 6, KC.wood); }
    for (const y of [-66, -22, 22, 66]) rail(y, 70);
    for (const x of xs) G.box(x, 0, 82.8, 7, 92, 2.5, KC.woodD);
    for (const y of [-44, 0, 44]) rail(y, 85);
  })];
}
// ---- the platelayers' trolley: an iron frame, a plank deck, four small wheels (their tread at z = 0: stand it on
// RAIL_TOP), a push handle at each end, a toolbox and a coiled rope on the deck. Along X.
export function handTrolley() {
  return ['dtrolley', shape((G) => {
    for (const x of [-62, 62]) { for (const s of [-1, 1]) { const b = G.n; G.lathe([[0, -3], [20, -3], [22, -1], [22, 1], [20, 3], [0, 3]], KC.iron, 12, [0, 0, 0]); G.place(b, { x, y: s * (GAUGE / 2 + 3), z: 22, roll: 90 }); } G.tube([[x, -GAUGE / 2 - 8, 22], [x, GAUGE / 2 + 8, 22]], 3, KC.ironL, { S: 6, M: 2 }); }
    for (const s of [-1, 1]) G.box(0, s * (GAUGE / 2 - 10), 28, 96, 4, 5, KC.iron);
    for (let i = 0; i < 6; i++) G.box(0, -66 + i * 26.4, 37, 104, 12.6, 3.4, i % 2 ? KC.wood : mix(KC.wood, 0x000000, 0.12));
    for (const sx of [-1, 1]) { for (const s of [-1, 1]) G.tube([[sx * 98, s * 50, 38], [sx * 128, s * 50, 104]], 2.6, KC.iron, { S: 5, M: 2 }); G.tube([[sx * 128, -54, 104], [sx * 128, 54, 104]], 3, KC.woodD, { S: 6, M: 2 }); }
    G.box(-30, -20, 54, 34, 20, 14, 0x4a5a3e); G.box(-30, -20, 69, 35, 21, 1.5, dark(0x4a5a3e, 0.8)); G.box(-30, -20, 72, 12, 2, 2, KC.iron);
    G.lathe([[12, 40.4], [22, 40.4], [24, 44], [22, 48], [12, 48], [10, 44], [12, 40.4]], 0x9a8a62, 12, [44, 30, 0], [1, 1], true);
  })];
}
// ---- a boiler out of an engine on two timber trestles: the barrel with its bands, the smokebox with its door hung open
// on its hinges, the firebox end square; tubes drawn from it laid on the ground alongside. Along X, smokebox at +X.
export function boilerTrestles() {
  return ['dboiler', shape((G) => {
    const zc = 132 + 70;
    for (const x of [-120, 120]) { for (const e of [-1, 1]) { G.tube([[x - 44, e * 66, 0], [x - 4, e * 58, 128]], 5, KC.woodD, { S: 6, M: 3 }); G.tube([[x + 44, e * 66, 0], [x + 4, e * 58, 128]], 5, KC.woodD, { S: 6, M: 3 }); } G.box(x, 0, 124, 10, 78, 8, KC.wood); G.box(x, 0, 135, 14, 46, 4, KC.woodD); }
    G.tube([[-220, 0, zc], [200, 0, zc]], 70, (t, a) => (Math.floor(t * 5) % 2 ? 0x2e4a3a : 0x34503e), { S: 18, M: 5, caps: false });
    for (const x of [-140, -20, 100]) G.tube([[x - 3, 0, zc], [x + 3, 0, zc]], 72, KC.brass, { S: 18, M: 1, caps: false });
    G.tube([[196, 0, zc], [266, 0, zc]], 76, KC.iron, { S: 18, M: 2 });
    { const b = G.n; G.lathe([[0, 0], [70, 0], [70, 3], [0, 3]], 0x26282c, 18, [0, 0, 0]); G.place(b, { x: 265, z: zc, pitch: 90 }); }
    { const b = G.n; G.lathe([[0, 0], [72, 0], [72, 4], [62, 8], [0, 10]], 0x2a2c30, 18, [0, 0, 0]); G.place(b, { x: 266, y: 76 + 4, z: zc, roll: -90 }); G.place(b, { x: 72, z: 0 }); }
    G.box(268, 79, zc, 4, 6, 34, KC.iron);
    G.box(-262, 0, zc - 6, 42, 66, 76, 0x2e4a3a); G.box(-262, 0, zc + 70, 43, 67, 2, KC.brass);
    G.lathe([[30, 0], [26, 18], [18, 30], [0, 34]], KC.brass, 12, [-60, 0, zc + 66]);
    for (let i = 0; i < 7; i++) G.tube([[-200, 120 + i * 9, 3.4], [190, 120 + i * 9 + (i % 3) * 2, 3.4]], 3.4, 0x6a6e72, { S: 6, M: 2 });
  })];
}
// ---- a water crane: a fluted iron column on a stone plinth, the swivel head, the arm with the leather bag hanging from
// its end, the handwheel, and a fire devil (a brazier on legs) at its foot to keep it from freezing. Arm toward +X.
export function waterCrane() {
  return ['dwatercrane', shape((G) => {
    G.box(0, 0, 14, 36, 36, 14, KC.trimD); G.lathe([[26, 28], [24, 44], [17, 62], [15, 320], [18, 330], [18, 342], [0, 344]], KC.iron, 14);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; G.box(Math.cos(a) * 15.5, Math.sin(a) * 15.5, 190, 1.4, 1.4, 128, KC.ironL); }
    G.box(0, 0, 352, 22, 22, 10, KC.iron); G.tube([[0, 0, 356], [250, 0, 356]], 9, KC.iron, { S: 10, M: 4 }); G.tube([[250, 0, 356], [262, 0, 340]], 9, KC.iron, { S: 10, M: 2 });
    G.tube([[0, 0, 404], [230, 0, 366]], 2, KC.iron, { S: 4, M: 3 }); G.tube([[0, 0, 344], [0, 0, 406]], 4, KC.iron, { S: 6, M: 2 });
    G.tube([[262, 0, 340], [264, 4, 300], [266, 14, 230], [262, 22, 160], [254, 24, 120]], 11, 0x3a2a20, { S: 10, M: 10 });
    { const b = G.n; G.lathe([[22, -2], [24, -2], [24, 2], [22, 2], [22, -2]], KC.red, 14, [0, 0, 0], [1, 1], true); G.place(b, { y: 32, z: 220, roll: 90 }); G.tube([[0, 16, 220], [0, 32, 220]], 3, KC.iron, { S: 5, M: 2 }); for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI; G.tube([[Math.cos(a) * 22, 32, 220 + Math.sin(a) * 22], [-Math.cos(a) * 22, 32, 220 - Math.sin(a) * 22]], 1.4, KC.red, { S: 4, M: 2 }); } }
    const bx = 80, by = -80; for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; G.tube([[bx + Math.cos(a) * 22, by + Math.sin(a) * 22, 0], [bx + Math.cos(a) * 16, by + Math.sin(a) * 16, 40]], 2, KC.iron, { S: 4, M: 2 }); }
    G.lathe([[14, 36], [22, 40], [24, 70], [22, 72], [20, 42], [0, 42]], KC.iron, 10, [bx, by, 0]); G.blob(bx, by, 66, 19, 19, 10, (nx, ny) => (Math.sin(nx * 9 + ny * 7) > 0.3 ? 0xff8a2a : 0x3a2018), { nu: 8, nv: 4 });
  })];
}
// ---- a coal merchant's bay: brick walls on three sides (the back, and two cheeks stepping down toward the open front at
// +X), stone copings, heaped with coal that spills out at the mouth
export function coalBay(w = 520, d = 420, h = 190, seed = 1) {
  seed = Math.abs(Math.round(seed)) || 0; w = q(w, 20); d = q(d, 20); h = q(h, 10);
  return ['dcoalbay|' + [w, d, h, seed % 3].join('|'), shape((G) => {
    const hd = d / 2, hw = w / 2, t = 34;
    brickRun(G, -hw - t / 2, hw + t / 2, -hd, 0, h, t, seed + 1, true); G.box(-hd, 0, h + 5, t / 2 + 3, hw + t / 2 + 3, 5, KC.trim);
    for (const s of [-1, 1]) { const y = s * hw; brickRun(G, -hd + t / 2, 0, y, 0, h, t, seed + 3 + s); brickRun(G, 0, hd, y, 0, h * 0.62, t, seed + 5 + s); G.box(-hd / 2 + t / 4, y, h + 5, hd / 2 - t / 4 + 3, t / 2 + 3, 5, KC.trim); G.box(hd / 2, y, h * 0.62 + 5, hd / 2 + 3, t / 2 + 3, 5, KC.trim); G.box(0, y, (h * 0.62 + h) / 2, 3, t / 2 + 2, (h - h * 0.62) / 2, KC.trimD); }
    G.blob(-hd * 0.12, 0, 0, hd * 0.95, hw * 0.86, h * 0.78, (nx, ny, nz) => (Math.sin(nx * 21 + ny * 17 + seed) > 0.55 ? KC.coalL : KC.coal), { nu: 16, nv: 7, warp: (x, y, z) => [x, y, Math.max(z, -3)] });
    for (let i = 0; i < 7; i++) G.blob(hd + 10 + (i % 3) * 22 - 30, -hw * 0.5 + i * (hw / 6), 4, 14 + (i % 2) * 6, 12, 8, KC.coal, { nu: 6, nv: 3 });
  })];
}
// ---- a weighbridge plate: a chequered iron plate in a stone frame, flush with the ground (no higher than 3)
export function weighPlate(w = 440, d = 240) {
  w = q(w, 20); d = q(d, 20);
  return ['dweigh|' + [w, d].join('|'), shape((G) => {
    G.box(0, 0, 1.4, w / 2 + 20, d / 2 + 20, 1.4, KC.trimD); G.box(0, 0, 2.4, w / 2, d / 2, 0.6, KC.iron);
    for (let x = -w / 2 + 16; x < w / 2 - 8; x += 26) for (let y = -d / 2 + 16; y < d / 2 - 8; y += 26) G.box(x + ((y / 26) % 2 ? 13 : 0) * 0, y, 3.1, 6, 2, 0.3, KC.ironL);
  })];
}
// ---- a bale of hay, two strings round it
export function hayBale(seed = 1) {
  seed = Math.abs(Math.round(seed)) || 0;
  return ['dbale|' + (seed % 2), shape((G) => {
    const c = seed % 2 ? 0xd8b86a : 0xc8a85a; G.box(0, 0, 21, 46, 28, 21, c); for (const x of [-20, 20]) G.box(x, 0, 21, 1, 28.6, 21.6, 0x8a6a3a);
    for (const s of [-1, 1]) G.box(s * 46.4, 0, 21, 0.4, 26, 19, dark(c, 0.86));
  })];
}
// ---- a heap of ash and clinker by the engine shed
export function ashHeap(r = 160, seed = 1) {
  seed = Math.abs(Math.round(seed)) || 0; r = q(r, 10);
  return ['dashheap|' + [r, seed % 2].join('|'), shape((G) => {
    G.blob(0, 0, 0, r, r * 0.8, r * 0.42, (nx, ny, nz) => { const n = Math.sin(nx * 19 + ny * 13 + seed) + Math.sin(nx * 7 - ny * 23); return n > 1.1 ? 0x2e2c2a : n > 0.2 ? 0x8a8680 : 0x9e9a94; }, { nu: 14, nv: 6, warp: (x, y, z) => [x, y, Math.max(z, -3)] });
  })];
}
// ---- runner beans on a wigwam of canes: six canes from a ring, tied at the top, leaves up them, red flowers
export function beanWigwam(seed = 1) {
  seed = Math.abs(Math.round(seed)) || 0;
  return ['dbeans|' + (seed % 2), shape((G) => {
    const R = rng(seed * 11 + 5), top = [0, 0, 196];
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.3, b = [Math.cos(a) * 44, Math.sin(a) * 44, 0]; G.tube([[b[0], b[1], -4], [top[0] + Math.cos(a) * 3, top[1] + Math.sin(a) * 3, top[2] + 10]], 1.6, 0xb89a62, { S: 4, M: 2 });
      for (let k = 0; k < 7; k++) { const t = 0.12 + k * 0.12, x = b[0] * (1 - t), y = b[1] * (1 - t), z = 196 * t; G.blob(x + Math.cos(a) * 4, y + Math.sin(a) * 4, z, 9 + R() * 3, 9 + R() * 3, 6, R() > 0.5 ? 0x5a8a3a : 0x4a7a32, { nu: 6, nv: 3 }); if (R() > 0.55) G.blob(x + Math.cos(a) * 8, y + Math.sin(a) * 8, z + 6, 3, 3, 3, 0xd84a32, { nu: 5, nv: 3 }); } }
    G.tube([[-5, 0, 198], [5, 0, 198]], 4, 0x8a7a5a, { S: 5, M: 2 });
  })];
}
// ---- a garden shed of boards: plank walls on a stone base, a felt roof pitched one way (high at the front), a ledged
// door in the front (+X) and a window in the +Y side. w deep (X), d long (Y).
export function gardenShed(w = 220, d = 300) {
  w = q(w, 20); d = q(d, 20);
  return ['dgshed|' + [w, d].join('|'), shape((G) => {
    const hw = w / 2, hd = d / 2, hF = 230, hB = 196, t = 5, wood = 0x6a5a44, woodL = 0x7a6a50, H = (x) => hB + (hF - hB) * ((x + hw) / w);
    G.box(0, 0, 4, hw + 6, hd + 6, 4, KC.trimD);
    for (const sx of [-1, 1]) { const x = sx * (hw - t / 2), h = H(x); for (let y = -hd; y < hd - 1; y += 20) G.box(x, y + 10, 8 + (h - 8) / 2, t / 2, 9.6, (h - 8) / 2, Math.round(y / 20) % 2 ? wood : woodL); }
    for (const sy of [-1, 1]) for (let x = -hw; x < hw - 1; x += 20) { const h = H(x + 10); G.box(x + 10, sy * (hd - t / 2), 8 + (h - 8) / 2, 9.6, t / 2, (h - 8) / 2, Math.round(x / 20) % 2 ? wood : woodL); }
    G.box(0, 0, 100, hw - t, hd - t, 92, 0x221c16);
    G.surf((u, v) => { const x = -hw - 22 + v * (w + 44), y = -hd - 20 + u * (d + 40); return [x, y, H(Math.max(-hw, Math.min(hw, x))) + 4 + (x < -hw ? (x + hw) * ((hF - hB) / w) : x > hw ? (x - hw) * ((hF - hB) / w) : 0)]; }, 0, 1, 4, 0, 1, 4, 0x3a3a3e);
    for (let y = -hd + 10; y < hd; y += 60) G.surf((u, v) => { const x = -hw - 22 + v * (w + 44); return [x, y + (u - 0.5) * 3, H(Math.max(-hw, Math.min(hw, x))) + 6 + (x < -hw ? (x + hw) * ((hF - hB) / w) : x > hw ? (x - hw) * ((hF - hB) / w) : 0)]; }, 0, 1, 1, 0, 1, 2, 0x2a2a2e);
    { const x = hw + 1.5; for (let k = -2; k < 2; k++) G.box(x, k * 17 + 8.5, 98, 1.5, 8, 90, k % 2 ? 0x4a5e44 : 0x52664a); for (const z of [40, 150]) G.box(x + 2, 0, z, 1, 32, 5, 0x3e5038); G.box(x + 3, -24, 100, 1.5, 3, 6, KC.iron); }
    { const y = hd + 1.2; G.box(-10, y, 140, 34, 0.8, 26, KC.glass); for (const e of [-1, 1]) { G.box(-10, y + 1, 140 + e * 27.5, 37, 1, 2.5, 0xd8d0b8); G.box(-10 + e * 35.5, y + 1, 140, 2.5, 1, 26, 0xd8d0b8); } G.box(-10, y + 1, 140, 1.2, 1, 26, 0xd8d0b8); G.box(-10, y + 3, 110, 40, 4, 2.5, 0xd8d0b8); }
  })];
}
