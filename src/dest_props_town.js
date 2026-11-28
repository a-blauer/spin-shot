// Sculpted pieces for the Works' towns (Market Town first): terraced houses and shops along the streets, the market's
// stalls and its hall, the town hall and its clock, the bandstand, the gas lamps, the gasworks' holder, the church.
// Same rules as dest_props.js: UE frame (X the front, Y right, Z up, cm), [key, build] pairs, keys carry every number
// the shape depends on, things stand on z = 0, every piece whole: nothing hangs in the air or stops short of its hold.
import { shapeB as shape, wob } from './propkit.js';
import { dark, mix } from './village_shapes.js';
import { q, rng } from './dest_props.js';
import { KC } from './dest_props_works.js';

export const TC = {   // the town's colours (the Works' brick, slate and iron, and the paint of a market town)
  render: [0xe2d6bc, 0xe6d49c, 0xbcc8c8, 0xe0bcac, 0xbcc8a8, 0xd8ccd4], plaster: 0xe4dac4, frame: 0x3a2e26,
  stone: [0xa8a290, 0x9a9484, 0xb4ae9c], stoneD: 0x7a7468, slate: KC.slate, tile: [0x9a4a32, 0x8a4230, 0xa65438],
  timber: 0x7a5a3a, timberD: 0x4a3a2c, glass: 0x34424c, glow: 0xffd88a, door: [0x2e5a42, 0x6a2a24, 0x2a3a5a, 0x2a2a2a, 0x5a2a3a],
  fascia: [0x2e5a42, 0x6a2a24, 0x2a3a5a, 0x262628, 0x4a3a2a], gold: 0xd8b04a,
  iron: 0x2a2c30, ironL: 0x4a4e54, brass: 0xc8a04a, white: 0xece6d8, red: 0xb42a22, canvas: [0xc83a32, 0x3a6aa8, 0x3a8a4a, 0xd8a03a], canvasW: 0xece4d0,
};
const N = (s) => Math.abs(Math.round(s)) || 0;
const deg = (r) => (r * 180) / Math.PI;
// striped canvas: f(u, v) -> [x, y, z] over u, v in [0, 1], n stripes across u, each its own flat colour (stripes that
// shared their edges would blend into a gradient); sub, nv: the segments within a stripe
function stripes(G, f, n, a, b, sub = 1, nv = 1) { for (let i = 0; i < n; i++) G.surf((u, v) => f((i + u) / n, v), 0, 1, sub, 0, 1, nv, i % 2 ? a : b); }

// ---- a sash window on a wall that faces +X at x (w wide, h tall, its foot at z, centred on y): the frame, the glass,
// its bars, the sill under it and the lintel over it (with a keystone if asked). lit: a lamp on inside.
function win(G, x, y, z, w, h, o = {}) {
  const hw = w / 2, hh = h / 2, zc = z + hh, trim = o.trim || TC.white;
  G.box(x + 1.5, y, zc, 1.5, hw + 5, hh + 5, TC.white);
  G.box(x + 3.2, y, zc, 0.6, hw, hh, o.lit ? mix(TC.glass, TC.glow, 0.6) : TC.glass);
  G.box(x + 4, y, zc, 0.8, 1.6, hh, TC.white); G.box(x + 4, y, zc, 0.8, hw, 1.8, TC.white);
  G.box(x + 4.5, y, z - 4, 4.5, hw + 9, 3, o.sill || TC.stone[1]);
  if (o.lintel !== false) { G.box(x + 2.5, y, z + h + 12, 2.5, hw + 10, 7, trim); if (o.key) G.box(x + 4, y, z + h + 12, 2.5, 7, 9, trim); }
}

// ---- a town house or shop in a terrace: its front (+X) on the street, w wide (along Y), d deep; a ground storey of
// 280, then 230 for each above; by seed brick, rendered and painted, or timber framed; its roof's eaves to the street or
// its gable; a chimney stack; front 0 a house (door, windows), 1 a shop (its window and fascia, an awning on some, a
// hanging sign on some). Nothing passes its party walls (y = ±w/2), so a row of them closes up without a seam.
// HS(): its heights and its roof, for the bodies.
export const HOUSE = { g: 280, up: 230, pitch: 0.72, ov: 24 };
export const HS = (storeys, w, d, seed) => { const eave = HOUSE.g + HOUSE.up * (storeys - 1), gable = N(seed) % 3 === 0, span = gable ? w / 2 : d / 2; return { eave, gable, span, ridge: eave + span * HOUSE.pitch }; };
// one slope of a roof in courses: its eave edge at `e0` out along the slope's own axis (+X, or +Y if alongY) on side
// `out`, z0 its height there, rising `rise` over `run` to the ridge; L2 long across (centred on c); th thick
function roofSlope(G, out, e0, z0, rise, run, L2, c, cols, n, seed, alongY = false) {
  const a = Math.atan2(rise, run), L = Math.hypot(rise, run), cl = L / n, th = 5;
  for (let k = 0; k < n; k++) { const s = (k + 0.5) * cl, u = out * (e0 - Math.cos(a) * s), z = z0 + Math.sin(a) * s + th / 2 + (k % 2) * 0.7, b = G.n;
    G.box(0, 0, 0, cl / 2 + 1.5, L2 / 2, th / 2, cols[(k * 7 + seed) % cols.length]);
    G.place(b, alongY ? { x: c, y: u, z, yaw: out > 0 ? 90 : -90, pitch: deg(a) } : { x: u, y: c, z, yaw: out > 0 ? 0 : 180, pitch: deg(a) }); }
}
// a hanging sign over a shop's door: an iron bracket out from the wall (+X, at x) and the trade's sign hung from it
function hangSign(G, x, y, z, kind) {
  G.box(x + 3, y, z, 3, 8, 26, TC.iron); G.tube([[x + 4, y, z + 20], [x + 92, y, z + 20]], 2.2, TC.iron, { S: 5 }); G.tube([[x + 4, y, z - 16], [x + 30, y, z + 8], [x + 60, y, z + 18]], 1.6, TC.iron, { S: 4 });
  const cx = x + 58, top = z + 20;
  if (kind === 0) {   // the locksmith's key, gilded
    for (const dx of [-24, 22]) G.tube([[cx + dx, y, top], [cx + dx, y, top - 26]], 1.2, TC.iron, { S: 4 });
    const ring = []; for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI * 2; ring.push([cx - 24 + Math.cos(a) * 12, y, top - 38 + Math.sin(a) * 12]); } G.tube(ring, 3, TC.gold, { S: 6, caps: false });
    G.tube([[cx - 12, y, top - 38], [cx + 30, y, top - 38]], 3.4, TC.gold, { S: 6 }); G.box(cx + 22, y, top - 30, 2, 2, 5, TC.gold); G.box(cx + 22, y, top - 44, 6, 2, 6, TC.gold); G.box(cx + 30, y, top - 46, 3, 2, 8, TC.gold);
  } else if (kind === 1) {   // the cobbler's boot
    for (const dx of [-18, 18]) G.tube([[cx + dx, y, top], [cx + dx, y, top - 24]], 1.2, TC.iron, { S: 4 });
    G.box(cx, y, top - 26, 22, 10, 2, 0x4a3a30); G.blob(cx - 10, y, top - 52, 13, 9, 25, 0x2a221e, { e: 3, nu: 10, nv: 6 }); G.blob(cx + 6, y, top - 72, 24, 9, 9, 0x2a221e, { e: 3, nu: 10, nv: 6 });
  } else if (kind === 2) {   // the baker's loaf on its board
    for (const dx of [-22, 22]) G.tube([[cx + dx, y, top], [cx + dx, y, top - 26]], 1.2, TC.iron, { S: 4 });
    G.box(cx, y, top - 28, 28, 3, 3, TC.timber); G.blob(cx, y, top - 43, 26, 9, 13, 0xc8904a, { nu: 12, nv: 6 }); for (const dx of [-12, 0, 12]) G.box(cx + dx, y, top - 31, 2.5, 9.4, 1, 0xe8c890);
  } else {   // the ironmonger's kettle
    for (const dx of [-14, 14]) G.tube([[cx + dx, y, top], [cx + dx, y, top - 37]], 1.2, TC.iron, { S: 4 });
    G.tube([[cx - 14, y, top - 24], [cx, y, top - 18], [cx + 14, y, top - 24]], 1.4, TC.iron, { S: 4 }); G.lathe([[0, top - 68], [16, top - 66], [20, top - 52], [16, top - 38], [8, top - 34], [8, top - 30], [0, top - 28]], 0x3a3634, 10, [cx, y, 0]);
    G.tube([[cx + 14, y, top - 58], [cx + 26, y, top - 50], [cx + 32, y, top - 40]], 2.4, 0x3a3634, { S: 5 });
  }
}
export function townHouse(w = 520, d = 640, storeys = 2, seed = 1, front = 0, ends = 0) {
  seed = N(seed); w = q(w, 20); d = q(d, 20);
  return ['tchouse4|' + [w, d, storeys, seed % 960, front, ends].join('|'), shape((G) => {
    const hw = w / 2, hd = d / 2, { eave, gable, ridge } = HS(storeys, w, d, seed), kind = seed % 4, brick = kind < 2;
    const wallC = brick ? KC.brick[(seed >> 2) % 4] : kind === 2 ? TC.render[(seed >> 2) % TC.render.length] : TC.plaster, trim = brick ? KC.trim : TC.white;
    const roofC = (seed >> 3) % 3 ? TC.slate : TC.tile, door = TC.door[(seed >> 1) % TC.door.length], ov = HOUSE.ov, lit = (k) => (seed * 7 + k * 3) % 5 === 0;
    // the walls, the plinth, a string course at each floor (front and back)
    G.box(0, 0, eave / 2, hd, hw, eave / 2, wallC); G.box(0, 0, 12, hd + 3, hw, 12, TC.stoneD);
    for (let k = 1; k < storeys; k++) { const z = HOUSE.g + HOUSE.up * (k - 1); for (const sx of [-1, 1]) G.box(sx * (hd + 1.5), 0, z, 1.5, hw, 5, kind === 3 ? TC.frame : trim); }
    for (const sx of [-1, 1]) G.box(sx * (hd + 2), 0, eave - 7, 2, hw, 7, kind === 3 ? TC.frame : trim);
    // a timber frame: posts at the corners and the middle, a rail at sill height, braces in the upper storeys
    if (kind === 3) for (const sx of [-1, 1]) { const x = sx * (hd + 1.5);
      for (let k = 0; k < storeys; k++) { const z0 = k ? HOUSE.g + HOUSE.up * (k - 1) : 24, z1 = HOUSE.g + HOUSE.up * k; for (const y of [-hw + 7, 0, hw - 7]) G.box(x, y, (z0 + z1) / 2, 1.5, 6, (z1 - z0) / 2, TC.frame);
        if (k) { G.box(x, 0, z0 + 46, 1.5, hw, 4, TC.frame); for (const s of [-1, 1]) { const b = G.n, a = Math.atan2(hw * 0.3, z1 - z0 - 56), L = Math.hypot(hw * 0.3, z1 - z0 - 56); G.box(0, 0, 0, 1.5, 4, L / 2, TC.frame); G.place(b, { x, y: s * (hw - 13 - hw * 0.15), z: (z0 + z1 + 50) / 2, roll: -s * deg(a) }); } } } }
    // the upper floors' windows, front and back
    for (let k = 1; k < storeys; k++) { const z = HOUSE.g + HOUSE.up * (k - 1) + 50, n = w >= 500 ? 2 : 1;
      for (let i = 0; i < n; i++) { const y = n === 1 ? 0 : (i - 0.5) * w * 0.5; win(G, hd, y, z, 74, 124, { lit: lit(k * 2 + i), trim, key: brick, lintel: kind !== 3 }); const b = G.n; win(G, 0, 0, z, 64, 110, { trim, lintel: kind !== 3 }); G.place(b, { x: -hd, y: -y, yaw: 180 }); } }
    // the ground floor
    if (front === 1) {
      const fas = TC.fascia[(seed >> 2) % TC.fascia.length], dy = (seed % 2 ? 1 : -1) * (hw - 56), s0 = dy > 0 ? -hw + 22 : dy + 44, s1 = dy > 0 ? dy - 44 : hw - 22, sm = (s0 + s1) / 2, sh = (s1 - s0) / 2;
      for (const y of [-hw + 10, hw - 10]) G.box(hd + 4, y, 130, 4, 10, 130, fas);
      G.box(hd + 6, 0, 248, 6, hw, 22, fas); G.box(hd + 9, 0, 274, 9, hw, 5, dark(fas, 0.8)); G.box(hd + 12.2, 0, 248, 0.6, hw - 24, 1.6, TC.gold);
      G.box(hd + 3, sm, 40, 3, sh, 16, fas); G.box(hd + 2, sm, 140, 2, sh, 84, mix(TC.glass, TC.glow, lit(9) ? 0.55 : 0.3)); G.box(hd + 4, sm, 58, 4, sh + 2, 3, TC.white); G.box(hd + 4, sm, 224, 4, sh + 2, 3, TC.white);
      for (let i = 1; i < 3; i++) G.box(hd + 4, s0 + (i * (s1 - s0)) / 3, 140, 1.6, 1.6, 84, TC.white);
      G.box(hd - 10, dy, 105, 2, 34, 105, door); G.box(hd - 8, dy + 22, 100, 1.5, 3, 3, TC.brass); G.box(hd - 4, dy, 218, 6, 38, 8, fas); for (const s of [-1, 1]) G.box(hd - 3, dy + s * 38, 112, 7, 3, 112, fas); G.box(hd - 1, dy, 4, 12, 36, 4, TC.stone[0]);
      if ((seed >> 1) % 2 === 0) {   // the awning: striped canvas out from under the fascia on two iron arms, its valance scalloped
        const aw = 110, ac = TC.canvas[(seed >> 3) % 4], az = 232, alo = 198, nS = Math.max(4, Math.round((w - 40) / 22));
        stripes(G, (u, v) => [hd + 12 + v * aw, -hw + 20 + u * (w - 40), az - v * (az - alo)], nS, ac, TC.canvasW);
        stripes(G, (u, v) => [hd + 12 + aw, -hw + 20 + u * (w - 40), alo - v * (12 + 5 * Math.abs(Math.sin(u * Math.PI * nS)))], nS, ac, TC.canvasW, 2);
        for (const sy of [-1, 1]) G.tube([[hd + 10, sy * (hw - 24), az + 10], [hd + 12 + aw, sy * (hw - 24), alo]], 1.5, TC.iron, { S: 4 });
      }
      if ((seed >> 2) % 3 === 1) hangSign(G, hd, dy, HOUSE.g + 70, (seed >> 4) % 4);
    } else {
      const dy = w >= 440 ? (seed % 2 ? 1 : -1) * w * 0.25 : 0;
      G.box(hd + 2, dy, 105, 2.5, 35, 105, door); G.box(hd + 4, dy, 105, 1, 25, 95, dark(door, 0.85)); G.box(hd + 4.6, dy + 23, 100, 1.5, 3, 3, TC.brass);
      G.box(hd + 2, dy, 222, 2.5, 42, 6, TC.white); G.surf((u, v) => { const a = Math.PI * u, r = 30 * (1 - v); return [hd + 3.2, dy + Math.cos(a) * r, 228 + Math.sin(a) * r]; }, 0, 1, 8, 0, 1, 1, mix(TC.glass, TC.glow, 0.35)); G.surf((u, v) => { const a = Math.PI * u, r = 30 + v * 7; return [hd + 3, dy + Math.cos(a) * r, 228 + Math.sin(a) * r]; }, 0, 1, 8, 0, 1, 1, TC.white);
      G.box(hd + 8, dy, 6, 8, 43, 6, TC.stone[0]); if (w >= 440) win(G, hd, -dy, 80, 84, 136, { lit: lit(7), trim, key: brick, lintel: kind !== 3 });
    }
    G.box(-hd - 2, (seed % 2 ? -1 : 1) * hw * 0.35, 100, 2.5, 32, 100, TC.door[(seed + 2) % TC.door.length]); { const b = G.n; win(G, 0, 0, 90, 64, 110, { trim, lintel: kind !== 3 }); G.place(b, { x: -hd, y: (seed % 2 ? 1 : -1) * hw * 0.3, yaw: 180 }); }
    // the end of a row (ends: 1 the +Y side shows, 2 the -Y side): windows in the side wall, the front corner quoined
    for (const sy of [1, -1]) { if (!(ends & (sy > 0 ? 1 : 2))) continue;
      for (let k = 0; k < storeys; k++) { const z = k ? HOUSE.g + HOUSE.up * (k - 1) + 50 : 90; for (const lx of d >= 600 ? [-d * 0.22, d * 0.22] : [0]) { const b = G.n; win(G, 0, 0, z, 64, 110, { trim, key: brick, lintel: kind !== 3 }); G.place(b, { x: lx, y: sy * hw, yaw: sy > 0 ? 90 : -90 }); } }
      if (brick) for (let z = 30, k = 0; z < eave - 30; z += 40, k++) { const L1 = k % 2 ? 26 : 44, L2 = 70 - L1; G.box(hd + 1, sy * (hw - L1 / 2), z, 1.5, L1 / 2, 18, trim); G.box(hd - L2 / 2, sy * (hw + 1), z, L2 / 2, 1.5, 18, trim); } }
    // the roof, its ridge, the gables filled, gutters, and a chimney stack on the ridge with its pots
    if (gable) {
      const rows = Math.max(6, Math.round(hw / 44));
      for (const s of [-1, 1]) roofSlope(G, s, hw, eave, ridge - eave, hw, d + 40, 0, roofC, rows, seed, true);
      for (const sx of [-1, 1]) { G.surf((u, v) => [sx * hd, (u - 0.5) * 2 * hw * (1 - v), eave + (ridge - eave) * v], 0, 1, 1, 0, 1, 1, wallC); for (const s of [-1, 1]) { const b = G.n, a = Math.atan2(ridge - eave, hw), L = Math.hypot(hw, ridge - eave); G.box(0, 0, 0, 3, L / 2, 8, TC.white); G.place(b, { x: sx * (hd + 20), y: (s * hw) / 2, z: (eave + ridge) / 2 + 2, roll: -s * deg(a) }); } }
      { const b = G.n; G.lathe([[0, 0], [17, 0], [17, 3], [0, 3]], TC.white, 12); G.lathe([[0, 3], [12, 3], [12, 3.6], [0, 3.6]], mix(TC.glass, TC.glow, 0.2), 12); G.place(b, { x: hd, z: eave + (ridge - eave) * 0.36, pitch: 90 }); }
      G.box(0, 0, ridge + 6, hd + 22, 7, 6, roofC[0]);
      { const cx = -hd + 70, top = ridge + 110; G.box(cx, 0, (eave + top) / 2 - 10, 36, 30, (top - eave) / 2 + 10, brick ? wallC : KC.brick[1]); G.box(cx, 0, top + 5, 42, 36, 5, TC.stoneD); for (const dy of [-14, 14]) G.lathe([[9, top + 10], [8, top + 36], [10, top + 40], [0, top + 40]], 0x9a5a3a, 8, [cx, dy, 0]); }
    } else {
      const rows = Math.max(6, Math.round((hd + ov) / 44));
      for (const s of [-1, 1]) { roofSlope(G, s, hd + ov, eave - ov * HOUSE.pitch, ridge - eave + ov * HOUSE.pitch, hd + ov, w, 0, roofC, rows, seed); G.box(s * (hd + ov), 0, eave - ov * HOUSE.pitch - 4, 5, hw, 5, TC.iron); }
      for (const sy of [-1, 1]) G.surf((u, v) => [(u - 0.5) * 2 * hd * (1 - v), sy * hw, eave + (ridge - eave) * v], 0, 1, 1, 0, 1, 1, wallC);
      G.box(0, 0, ridge + 6, 7, hw, 6, roofC[0]);
      { const cy = (seed % 2 ? 1 : -1) * (hw - 46), top = ridge + 100; G.box(0, cy, (eave + top) / 2 - 10, 30, 38, (top - eave) / 2 + 10, brick ? wallC : KC.brick[1]); G.box(0, cy, top + 5, 36, 44, 5, TC.stoneD); for (const dy of [-16, 16]) G.lathe([[9, top + 10], [8, top + 36], [10, top + 40], [0, top + 40]], 0x9a5a3a, 8, [0, cy + dy, 0]); }
    }
  })];
}

// ---- a market stall: a trestle table under a striped canopy on four poles (higher at the back), its valance scalloped,
// the day's goods on it: 0 fruit and greens, 1 bread, 2 cheeses, 3 pots, 4 cloth. Its front (+X) to the buyers.
export function marketStall(w = 300, seed = 1, goods = 0) {
  seed = N(seed); w = q(w, 20);
  return ['tcstall3|' + [w, seed % 4, goods].join('|'), shape((G) => {
    const R = rng(seed * 17 + goods), hw = w / 2, c = TC.canvas[seed % 4], T = TC.timber, nS = Math.round(w / 25);
    G.box(0, 0, 84, 50, hw, 3, T); for (const sy of [-1, 1]) { G.tube([[-40, sy * (hw - 20), -6], [0, sy * (hw - 20), 81]], 3, T, { S: 5 }); G.tube([[40, sy * (hw - 20), -6], [0, sy * (hw - 20), 81]], 3, T, { S: 5 }); }
    for (const [x, h] of [[56, 220], [-56, 262]]) for (const sy of [-1, 1]) G.tube([[x, sy * hw, -6], [x, sy * hw, h + 4]], 3, TC.timberD, { S: 6 });
    const ov = 16;
    stripes(G, (u, v) => [-56 - ov + v * (112 + ov * 2), -hw - ov + u * (w + ov * 2), 266 - v * 50], nS, c, TC.canvasW);
    stripes(G, (u, v) => [56 + ov, -hw - ov + u * (w + ov * 2), 216 - v * (14 + Math.abs(Math.sin(u * Math.PI * nS)) * 12)], nS, c, TC.canvasW, 2);
    const top = 87;
    if (goods === 0) for (let i = 0; i < Math.floor(w / 70); i++) { const y = -hw + 40 + i * 70, cc = [0xc8342a, 0x8ac040, 0xe8a030, 0x6a3a8a, 0xd8c040][i % 5]; G.box(10, y, top + 10, 30, 28, 10, 0xb08a5a); for (let k = 0; k < 7; k++) G.blob(10 + (R() - 0.5) * 40, y + (R() - 0.5) * 36, top + 22 + R() * 4, 7, 7, 6, cc, { nu: 5, nv: 3 }); }
    if (goods === 1) for (let i = 0; i < Math.floor(w / 26); i++) { const y = -hw + 20 + i * 26, x = (i % 2) * 24 - 12; G.blob(x, y, top + 9, 18, 10, 9, i % 3 ? 0xc8904a : 0xa8683a, { nu: 8, nv: 4 }); }
    if (goods === 2) for (let i = 0; i < Math.floor(w / 50); i++) { const y = -hw + 30 + i * 50; G.lathe([[0, top], [22, top], [23, top + 9], [22, top + 16], [0, top + 16]], (k) => (k === 1 || k === 2 ? 0xd8a840 : 0xe8c868), 12, [0, y, 0]); if (i % 2) G.lathe([[0, top + 16], [16, top + 16], [16, top + 28], [0, top + 28]], 0xe8d888, 10, [0, y, 0]); }
    if (goods === 3) for (let i = 0; i < Math.floor(w / 44); i++) { const y = -hw + 26 + i * 44, s = 0.8 + (i % 3) * 0.2; G.lathe([[0, top], [12 * s, top], [18 * s, top + 14 * s], [14 * s, top + 28 * s], [10 * s, top + 30 * s], [9 * s, top + 26 * s], [0, top + 26 * s]], [0xa8603a, 0x8a5a7a, 0x6a8a9a][i % 3], 10, [0, y, 0]); }
    if (goods === 4) for (let i = 0; i < Math.floor(w / 34); i++) { const y = -hw + 22 + i * 34, b = G.n; G.tube([[-40, 0, 0], [40, 0, 0]], 12, TC.canvas[(i + seed) % 4], { S: 10 }); G.place(b, { x: 0, y, z: top + 12 }); }
    G.lathe([[0, 0], [18, 0], [22, 26], [20, 26], [16, 3]], 0xb08a5a, 10, [72, -hw + 30, 0]);
  })];
}
// ---- a stall the growth knocked over: the table top fallen across a trestle, both trestles down, the canopy torn off its
// poles and lying in folds, the goods spilled over the setts. All of it low enough to step over.
export function stallWreck(w = 300, seed = 1) {
  seed = N(seed); w = q(w, 20);
  return ['tcwreck4|' + [w, seed % 4].join('|'), shape((G) => {
    const R = rng(seed * 31 + 5), hw = w / 2, c = TC.canvas[seed % 4], T = TC.timber, nS = Math.round(w / 25);
    { const b = G.n; G.box(0, 0, 0, 50, hw, 3, T); G.place(b, { x: 40, z: 21, pitch: -22 }); }   // the top fallen across its own trestle, its high edge under a step
    for (const sy of [-1, 1]) { const b = G.n; G.tube([[-44, 0, 0], [0, 0, 86], [44, 0, 0]], 3, T, { S: 5 }); G.place(b, { x: -40, y: sy * (hw - 30), z: 3, roll: 90 }); }
    G.tube([[-110, -hw + 10, 3], [80, -hw + 60, 3]], 3, TC.timberD, { S: 6 }); G.tube([[-90, hw - 20, 3], [120, hw + 10, 3]], 3, TC.timberD, { S: 6 });
    stripes(G, (u, v) => { const x = -100 + v * 160, y = -hw + u * w; return [x, y, 4 + Math.max(0, 22 * Math.sin(u * Math.PI * 2.3 + seed) * Math.sin(v * Math.PI)) + (wob(u * 3, v * 3) + 1) * 3]; }, nS, c, TC.canvasW, 1, 6);
    for (let k = 0; k < 16; k++) G.blob(110 + R() * 90, (R() - 0.5) * w, 6, 7, 7, 6, [0xc8342a, 0x8ac040, 0xe8a030][k % 3], { nu: 5, nv: 3 });
    { const b = G.n; G.box(0, 0, 0, 30, 28, 10, 0xb08a5a); G.place(b, { x: 150, y: hw * 0.45, z: 10, yaw: 30 }); }
  })];
}

// ---- the market hall: an upper hall of timber frame and render on stone piers, the market under it open on every
// side, a hipped roof of tiles, a cupola with its bell on the ridge. MH: its sizes; its piers' places: hallPiers().
export const MH = { w: 1100, d: 600, z0: 340, eave: 600, ridge: 800 };
export const hallPiers = () => { const out = []; for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) out.push([sx * (MH.d / 2 - 30), -MH.w / 2 + 30 + i * ((MH.w - 60) / 3)]); return out; };
export function marketHall() {
  return ['tchall2', shape((G) => {
    const { w, d, z0, eave, ridge } = MH, hw = w / 2, hd = d / 2, S = TC.stone;
    for (const [x, y] of hallPiers()) { G.box(x, y, 8, 40, 40, 8, TC.stoneD); for (let z = 16, k = 0; z < z0 - 20; z += 28, k++) G.box(x, y, z + 14, 30, 30, 13.6, S[k % 3]); G.box(x, y, z0 - 10, 38, 38, 10, TC.stoneD); }
    for (const sx of [-1, 1]) G.box(sx * (hd - 30), 0, z0 + 10, 30, hw, 12, TC.timberD);
    for (const y of [-hw + 30, -hw + 30 + (w - 60) / 3, hw - 30 - (w - 60) / 3, hw - 30]) G.box(0, y, z0 + 10, hd, 26, 12, TC.timberD);
    G.box(0, 0, z0 + 26, hd + 10, hw + 10, 6, TC.timber);
    G.box(0, 0, (z0 + 32 + eave) / 2, hd, hw, (eave - z0 - 32) / 2, TC.render[0]);
    for (const sx of [-1, 1]) { for (let y = -hw; y <= hw + 1; y += w / 8) G.box(sx * (hd + 2), Math.max(-hw + 6, Math.min(hw - 6, y)), (z0 + 32 + eave) / 2, 3, 6, (eave - z0 - 32) / 2, TC.frame); G.box(sx * (hd + 2), 0, eave - 6, 3, hw + 2, 6, TC.frame); G.box(sx * (hd + 2), 0, z0 + 38, 3, hw + 2, 6, TC.frame);
      for (let i = 0; i < 4; i++) { const b = G.n; win(G, 0, 0, z0 + 90, 70, 110, { lit: i % 2 === 0, lintel: false }); G.place(b, { x: sx * (hd + 3), y: -hw + w / 8 + i * (w / 4), yaw: sx > 0 ? 0 : 180 }); } }
    for (const sy of [-1, 1]) for (let x = -hd; x <= hd + 1; x += d / 4) G.box(Math.max(-hd + 6, Math.min(hd - 6, x)), sy * (hw + 2), (z0 + 32 + eave) / 2, 6, 3, (eave - z0 - 32) / 2, TC.frame);
    // the hipped roof: four faces up to a short ridge along Y, an underside
    const ov = 40, rl = hw - hd;
    for (const sx of [-1, 1]) G.surf((u, v) => { const y = (u - 0.5) * 2 * ((hw + ov) * (1 - v) + rl * v), x = sx * (hd + ov) * (1 - v); return [x, y, eave - 10 + (ridge - eave + 10) * v]; }, 0, 1, 1, 0, 1, 8, (u, v) => TC.tile[Math.floor(v * 8 - 1e-6) % 3]);
    for (const sy of [-1, 1]) G.surf((u, v) => { const x = (u - 0.5) * 2 * (hd + ov) * (1 - v), y = sy * ((hw + ov) * (1 - v) + rl * v); return [x, y, eave - 10 + (ridge - eave + 10) * v]; }, 0, 1, 1, 0, 1, 8, (u, v) => TC.tile[Math.floor(v * 8 - 1e-6) % 3]);
    G.surf((u, v) => [(u - 0.5) * 2 * (hd + ov), (v - 0.5) * 2 * (hw + ov), eave - 12], 0, 1, 1, 0, 1, 1, TC.timberD);
    G.box(0, 0, ridge + 4, 10, rl + 8, 8, 0x6e3424);
    // the cupola on the ridge: a little open lantern, its bell, a lead cap, the vane
    G.box(0, 0, ridge + 16, 70, 70, 8, TC.timberD); for (const [x, y] of [[-56, -56], [56, -56], [-56, 56], [56, 56]]) G.box(x, y, ridge + 80, 8, 8, 60, TC.white);
    G.lathe([[3, ridge + 132], [14, ridge + 110], [20, ridge + 86], [0, ridge + 86]], TC.brass, 12); G.box(0, 0, ridge + 137, 4, 4, 7, TC.iron);
    G.box(0, 0, ridge + 144, 72, 72, 4, TC.white); G.lathe([[74, ridge + 148], [0, ridge + 220]], TC.slate[0], 8); G.tube([[0, 0, ridge + 216], [0, 0, ridge + 280]], 2, TC.iron, { S: 5 });
    G.box(0, 0, ridge + 270, 2, 22, 8, TC.iron); G.box(0, 14, ridge + 274, 1.5, 10, 3, TC.iron);
  })];
}

// ---- the town hall: a stone block of two storeys, its portico of four columns on a podium with steps (+X), the
// pediment over it, rows of tall windows, a hipped slate roof, and the clock tower rising from the middle of the ridge:
// the clock on all four faces, the open belfry, a copper dome and the vane. TH: its sizes, for its bodies.
export const TH = { w: 1500, d: 900, eave: 720, ridge: 960, pod: 45, port: 260, tw: 320, ttop: 2060, col: [-240, -80, 80, 240], colX: 200, colR: 30 };
export function townHall() {
  return ['tctownhall2', shape((G) => {
    const { w, d, eave, ridge, pod, port, tw, ttop } = TH, hw = w / 2, hd = d / 2, S = TC.stone;
    for (let z = 0, k = 0; z < eave; z += 40, k++) G.box(0, 0, z + 20, hd, hw, 20, S[k % 3]);
    G.box(0, 0, eave + 12, hd + 16, hw + 16, 12, TC.stoneD); G.box(0, 0, 360, hd + 6, hw + 6, 8, TC.stoneD); G.box(0, 0, 14, hd + 8, hw + 8, 14, TC.stoneD);
    for (const sx of [-1, 1]) for (let i = 0; i < 7; i++) { const y = -hw + 100 + i * ((w - 200) / 6); if (sx > 0 && Math.abs(y) < port / 2 + 220) continue; for (const z of [90, 440]) { const b = G.n; win(G, 0, 0, z, 90, 200, { lit: (i + (z > 300 ? 1 : 0)) % 3 === 0, trim: TC.stone[2], key: true }); G.place(b, { x: sx * hd, y, yaw: sx > 0 ? 0 : 180 }); } }
    for (const sy of [-1, 1]) for (let i = 0; i < 3; i++) for (const z of [90, 440]) { const b = G.n; win(G, 0, 0, z, 90, 200, { trim: TC.stone[2], key: true }); G.place(b, { x: -hd + 150 + i * ((d - 300) / 2), y: sy * hw, yaw: sy > 0 ? 90 : -90 }); }
    // the portico: steps up to the podium, four columns, entablature and pediment, the great door behind under its arch
    const px = hd + port / 2, cx = hd + TH.colX;
    for (let k = 0; k < 3; k++) G.box(hd + port + 30 - k * 30, 0, (k + 1) * 7.5, 30, 340, (k + 1) * 7.5, S[k]);
    G.box(px, 0, pod / 2, port / 2, 340, pod / 2, S[1]);
    for (const y of TH.col) { G.lathe([[TH.colR, pod], [26, pod + 10], [24, pod + 400], [30, pod + 420], [32, pod + 432], [0, pod + 432]], (k) => (k === 0 || k >= 3 ? TC.stoneD : TC.white), 14, [cx, y, 0]); G.box(cx, y, pod + 6, 34, 34, 6, TC.stoneD); }
    G.box(hd + port / 2 + 40, 0, pod + 470, port / 2 + 40, 330, 38, S[2]); G.box(hd + port / 2 + 42, 0, pod + 512, port / 2 + 44, 334, 6, TC.stoneD);
    G.surf((u, v) => [hd + port + 82, (u - 0.5) * 2 * 334 * (1 - v), pod + 518 + v * 140], 0, 1, 1, 0, 1, 1, S[0]);
    for (const sy of [-1, 1]) G.surf((u, v) => [hd + u * (port + 86), sy * 338 * (1 - v), pod + 518 + v * 140 + 4], 0, 1, 4, 0, 1, 1, TC.slate[1]);
    G.box(hd + 3, 0, pod + 160, 4, 90, 160, TC.door[0]); G.box(hd + 5, 0, pod + 160, 2, 3, 150, TC.timberD); G.surf((u, v) => { const a = Math.PI * u, r = 90 + v * 14; return [hd + 4, Math.cos(a) * r, pod + 320 + Math.sin(a) * r]; }, 0, 1, 10, 0, 1, 1, TC.stoneD);
    G.surf((u, v) => { const a = Math.PI * u, r = 88 * (1 - v); return [hd + 3.5, Math.cos(a) * r, pod + 320 + Math.sin(a) * r]; }, 0, 1, 10, 0, 1, 1, mix(TC.glass, TC.glow, 0.3));
    // the hipped roof
    const ov = 30, rl = hw - hd;
    for (const sx of [-1, 1]) G.surf((u, v) => { const y = (u - 0.5) * 2 * ((hw + ov) * (1 - v) + rl * v), x = sx * (hd + ov) * (1 - v); return [x, y, eave + 24 + (ridge - eave - 24) * v]; }, 0, 1, 1, 0, 1, 9, (u, v) => TC.slate[Math.floor(v * 9 - 1e-6) % 3]);
    for (const sy of [-1, 1]) G.surf((u, v) => { const x = (u - 0.5) * 2 * (hd + ov) * (1 - v), y = sy * ((hw + ov) * (1 - v) + rl * v); return [x, y, eave + 24 + (ridge - eave - 24) * v]; }, 0, 1, 1, 0, 1, 9, (u, v) => TC.slate[Math.floor(v * 9 - 1e-6) % 3]);
    G.box(0, 0, ridge + 6, 10, rl + 10, 8, TC.slate[0]);
    // the clock tower: up out of the roof's middle
    const th = tw / 2, cz = ridge + 360;
    for (let z = eave, k = 0; z < cz + 160; z += 40, k++) G.box(0, 0, z + 20, th, th, 20, S[k % 3]);
    for (const [sx, sy, yaw] of [[1, 0, 0], [-1, 0, 180], [0, 1, 90], [0, -1, -90]]) { const b = G.n;
      G.lathe([[0, -2], [110, -2], [110, 6], [0, 6]], TC.stoneD, 24); G.lathe([[0, 6], [100, 6], [100, 8], [0, 8]], TC.white, 24);
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, c = G.n; G.box(0, 0, 0, 2, 2, 8, TC.iron); G.place(c, { x: Math.cos(a) * 88, y: Math.sin(a) * 88, z: 10, yaw: deg(a) }); }
      { const c = G.n; G.box(30, 0, 12, 30, 4, 2, TC.iron); G.place(c, { yaw: 120 }); } { const c = G.n; G.box(44, 0, 13, 44, 3, 2, TC.iron); G.place(c, { yaw: 300 }); }
      G.place(b, { pitch: 90, yaw, x: sx * (th + 2), y: sy * (th + 2), z: cz }); }
    // the belfry: four corner piers, arches open between them, the bell inside, then the dome
    const bz = cz + 160; for (const [x, y] of [[-th + 30, -th + 30], [th - 30, -th + 30], [-th + 30, th - 30], [th - 30, th - 30]]) G.box(x, y, bz + 110, 30, 30, 110, S[2]);
    for (const sy of [-1, 1]) { G.box(0, sy * (th - 30), bz + 236, th, 30, 16, S[1]); G.box(sy * (th - 30), 0, bz + 236, 30, th, 16, S[1]); }
    G.box(0, 0, bz + 4, th, th, 4, S[0]); G.lathe([[4, bz + 200], [26, bz + 180], [36, bz + 120], [44, bz + 100], [0, bz + 100]], TC.brass, 14); G.box(0, 0, bz + 214, 6, th - 2, 6, TC.timberD); G.box(0, 0, bz + 205, 4, 4, 6, TC.iron);
    G.box(0, 0, bz + 256, th + 10, th + 10, 6, TC.stoneD);
    G.lathe([[th - 10, bz + 262], [th - 14, bz + 300], [th * 0.8, bz + 360], [th * 0.5, bz + 410], [16, bz + 440], [0, bz + 446]], 0x5a8a7a, 16);
    G.tube([[0, 0, bz + 440], [0, 0, ttop]], 3, TC.iron, { S: 6 }); G.box(0, 0, ttop - 20, 3, 40, 10, TC.brass); G.blob(0, 0, ttop - 60, 10, 10, 10, TC.brass, { nu: 8, nv: 6 });
  })];
}

// ---- the bandstand: an octagonal deck low enough to step onto from any side, eight iron posts at its corners with lace
// between their heads, and a roof like a tent of slates with a finial (no rail: nothing to pin a creature against). BS: its
// radius and deck; its posts stand at the octagon's corners (k · 45°).
export const BS = { r: 300, deck: 14, top: 300 };
export function bandstand() {
  return ['tcband3', shape((G) => {
    const { r, deck, top } = BS, P = (i, rr = r) => [Math.cos((i / 8) * Math.PI * 2) * rr, Math.sin((i / 8) * Math.PI * 2) * rr];
    G.lathe([[r + 26, -4], [r + 26, deck - 4], [r + 20, deck], [0, deck]], TC.stone[1], 8);
    for (let i = 0; i < 8; i++) { const [x, y] = P(i), [x2, y2] = P(i + 1); G.lathe([[8, deck], [6, deck + 20], [4.5, top - 10], [8, top]], TC.iron, 8, [x, y, 0]);
      G.tube([[x, y, top - 4], [(x + x2) / 2, (y + y2) / 2, top - 30], [x2, y2, top - 4]], 1.8, TC.iron, { S: 4 });
    }
    G.lathe([[r + 44, top], [r + 34, top + 10], [0, top + 150]], (k) => (k ? TC.slate[1] : TC.white), 8);
    G.lathe([[r + 44, top - 2], [r + 44, top + 1], [0, top + 1]], TC.white, 8);
    G.tube([[0, 0, top + 146], [0, 0, top + 200]], 2.5, TC.iron, { S: 5 }); G.blob(0, 0, top + 204, 6, 6, 6, TC.brass, { nu: 6, nv: 4 });
  })];
}

// ---- a gas lamp: an iron post fluted at its foot, the ladder bar, the lantern on top with its cap
export function gasLamp() {
  return ['tclamp', shape((G) => {
    G.lathe([[16, 0], [16, 24], [10, 34], [7, 60], [5, 250], [7, 262], [0, 262]], TC.iron, 8);
    G.box(0, 0, 230, 30, 2, 2, TC.iron);
    G.lathe([[8, 262], [14, 270], [16, 300], [12, 312], [0, 312]], (k) => (k === 1 || k === 2 ? TC.glow : TC.iron), 6);
    G.lathe([[18, 312], [4, 330], [2, 340], [0, 340]], TC.iron, 6);
  })];
}
// ---- a pillar box: red, its cap, its slot
export function pillarBox() {
  return ['tcpbox', shape((G) => {
    G.lathe([[24, 0], [24, 8], [20, 12], [20, 120], [24, 126], [24, 132], [12, 146], [0, 150]], (k) => (k < 1 ? TC.iron : TC.red), 14);
    G.box(21, 0, 106, 2, 12, 2.5, 0x1a1a1a); G.box(21, 0, 60, 1.5, 10, 14, TC.white);
  })];
}
// ---- a park bench: iron ends, slats for the seat and back
export function parkBench(len = 200) {
  len = q(len, 20);
  return ['tcbench|' + len, shape((G) => {
    for (const sy of [-1, 1]) { const y = sy * (len / 2 - 10); G.tube([[-26, y, 0], [-20, y, 44], [-30, y, 96]], 3, TC.iron, { S: 5 }); G.tube([[24, y, 0], [20, y, 44]], 3, TC.iron, { S: 5 }); G.tube([[-20, y, 44], [22, y, 44]], 3, TC.iron, { S: 5 }); }
    for (let k = 0; k < 4; k++) G.box(-18 + k * 12, 0, 46, 5, len / 2, 2, TC.timber);
    for (let k = 0; k < 3; k++) G.box(-24 - k * 1.6, 0, 60 + k * 13, 2, len / 2, 5, TC.timber);
  })];
}
// ---- a town's name on a board between two iron posts, its frame (the words are the map's own sign)
export function townBoard(w = 300) {
  w = q(w, 20);
  return ['tcboard|' + w, shape((G) => {
    for (const s of [-1, 1]) G.lathe([[7, 0], [6, 10], [4, 250], [7, 256], [0, 262]], TC.iron, 8, [0, s * (w / 2 + 6), 0]);
    G.box(0, 0, 196, 3, w / 2 + 6, 42, TC.iron); G.box(0, 0, 196, 3.5, w / 2, 36, TC.white);
  })];
}

// ---- the gasworks' holder: twelve iron columns in a ring with their lattice girders at three levels, the gas bell
// standing in its tank, the tank's brick wall. GH: its radius and height.
export const GH = { r: 560, h: 980, tank: 140, bell: 500, bellH: 640 };
export function gasholder() {
  return ['tcgas2', shape((G) => {
    const { r, h, tank, bell, bellH } = GH;
    G.lathe([[bell + 40, -4], [bell + 40, tank], [bell + 26, tank], [bell + 26, tank - 6], [0, tank - 6]], (k) => (k ? TC.stoneD : KC.brick[0]), 32);
    G.lathe([[bell, tank - 10], [bell, bellH], [bell - 40, bellH + 36], [0, bellH + 50]], (k) => (k === 0 ? 0x5a6a5a : 0x4e5c4e), 32);
    for (let z = tank + 60; z < bellH; z += 120) G.lathe([[bell + 1.5, z - 3], [bell + 1.5, z + 3]], 0x3e4a3e, 32, [0, 0, 0], [1, 1], true);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, x = Math.cos(a) * r, y = Math.sin(a) * r; G.lathe([[28, -4], [28, 30], [17, 40], [15, h], [21, h + 10], [0, h + 14]], TC.ironL, 8, [x, y, 0]);
      const a2 = ((i + 1) / 12) * Math.PI * 2, x2 = Math.cos(a2) * r, y2 = Math.sin(a2) * r;
      for (const z of [h * 0.36, h * 0.68, h - 12]) G.tube([[x, y, z], [x2, y2, z]], 5, TC.iron, { S: 4 });
      for (const [z0, z1] of [[h * 0.36, h * 0.68], [h * 0.68, h - 12]]) { G.tube([[x, y, z0], [x2, y2, z1]], 2.4, TC.iron, { S: 3 }); G.tube([[x2, y2, z0], [x, y, z1]], 2.4, TC.iron, { S: 3 }); } }
  })];
}

// ---- the church: a nave of grey stone with its slate roof, lancet windows down its sides, the porch on the south
// (-Y) side, the tower at the west end (-X) with its spire and weathercock. CHU: its sizes, for bodies.
export const CHU = { L: 1000, W: 480, eave: 420, ridge: 680, tw: 300, tz: 900, spire: 1700, porch: [100, -330, 110, 90] };
export function church() {
  return ['tcchurch2', shape((G) => {
    const { L, W, eave, ridge, tw, tz, spire } = CHU, hl = L / 2, hw = W / 2, S = TC.stone, tx = -hl - tw / 2 + 10, [pxc, pyc, phx, phy] = CHU.porch;
    for (let z = 0, k = 0; z < eave; z += 35, k++) G.box(0, 0, z + 17.5, hl, hw, 17.5, S[k % 3]);
    for (const sy of [-1, 1]) G.surf((u, v) => [-hl + 10 + u * (L + 10), sy * (hw + 30) * (1 - v), eave - 20 + (ridge - eave + 20) * v], 0, 1, 1, 0, 1, 8, (u, v) => TC.slate[Math.floor(v * 8 - 1e-6) % 3]);
    G.surf((u, v) => [hl, (u - 0.5) * 2 * hw * (1 - v), eave + (ridge - eave) * v], 0, 1, 1, 0, 1, 1, S[0]);
    G.box(10, 0, ridge + 4, hl, 8, 6, TC.slate[0]);
    for (const sy of [-1, 1]) for (let i = 0; i < 4; i++) { const x = -hl + 160 + i * ((L - 260) / 3); if (sy < 0 && Math.abs(x - pxc) < phx + 30) continue; G.box(x, sy * (hw + 2), 230, 22, 2, 90, 0x2a3448); G.surf((u, v) => { const a = Math.PI * u; return [x + Math.cos(a) * 22, sy * (hw + 2.5), 320 + Math.sin(a) * 30 * (1 - v)]; }, 0, 1, 6, 0, 1, 1, 0x2a3448); G.box(x, sy * (hw + 4), 136, 28, 5, 4, S[1]); }
    G.box(hl + 2, 0, 300, 2, 50, 130, 0x2a3448); G.surf((u, v) => { const a = Math.PI * u; return [hl + 2.5, Math.cos(a) * 50, 430 + Math.sin(a) * 60 * (1 - v)]; }, 0, 1, 8, 0, 1, 1, 0x2a3448);
    // the porch on the south side, its door
    G.box(pxc, pyc, 130, phx, phy, 130, S[1]); for (const sx of [-1, 1]) G.surf((u, v) => [pxc + sx * (phx + 20) * (1 - v), pyc - phy - 20 + u * (phy * 2 + 20), 260 + 90 * v], 0, 1, 1, 0, 1, 1, TC.slate[1]); G.surf((u, v) => [pxc + (u - 0.5) * 2 * phx * (1 - v), pyc - phy, 260 + 90 * v], 0, 1, 1, 0, 1, 1, S[0]);
    G.box(pxc, pyc - phy - 2, 110, 50, 2.5, 110, TC.door[4]); G.surf((u, v) => { const a = Math.PI * u, r = 50 + v * 10; return [pxc + Math.cos(a) * r, pyc - phy - 2.5, 220 + Math.sin(a) * r * 0.5]; }, 0, 1, 8, 0, 1, 1, TC.stoneD);
    // the tower, its belfry openings, the spire
    for (let z = 0, k = 0; z < tz; z += 40, k++) G.box(tx, 0, z + 20, tw / 2, tw / 2, 20, S[(k + 1) % 3]);
    for (const [sx, sy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) G.box(tx + sx * (tw / 2 + 1), sy * (tw / 2 + 1), tz - 120, sx ? 2 : 30, sy ? 2 : 30, 70, 0x1a1a1a);
    G.box(tx, 0, tz + 10, tw / 2 + 12, tw / 2 + 12, 10, TC.stoneD);
    G.lathe([[tw / 2 - 6, tz + 20], [0, spire]], TC.slate[0], 8, [tx, 0, 0]);
    G.tube([[tx, 0, spire - 10], [tx, 0, spire + 80]], 2.5, TC.iron, { S: 5 }); G.box(tx, 0, spire + 66, 2, 26, 12, TC.brass); G.box(tx + 4, 12, spire + 74, 4, 6, 6, TC.brass);
    G.box(tx - tw / 2 - 2, 0, 110, 2, 46, 110, TC.door[3]);
  })];
}
// ---- a headstone in the churchyard, leaning a little: a slab with a rounded head, or a cross, on its foot
export function headstone(seed = 1) {
  seed = N(seed);
  return ['tcstone2|' + (seed % 4), shape((G) => {
    const S = TC.stone[seed % 3], b = G.n;
    if (seed % 4 === 3) { G.box(0, 0, 56, 7, 7, 56, S); G.box(0, 0, 84, 7, 28, 7, S); }
    else { G.box(0, 0, 45, 7, 30, 45, S); G.surf((u, v) => { const a = Math.PI * u; return [7, Math.cos(a) * 30 * v, 90 + Math.sin(a) * 18 * v]; }, 0, 1, 8, 0, 1, 1, S); G.surf((u, v) => { const a = Math.PI * u; return [-7, Math.cos(a) * 30 * v, 90 + Math.sin(a) * 18 * v]; }, 0, 1, 8, 0, 1, 1, S); G.surf((u, v) => { const a = Math.PI * u; return [-7 + v * 14, Math.cos(a) * 30, 90 + Math.sin(a) * 18]; }, 0, 1, 8, 0, 1, 1, S); }
    G.place(b, { pitch: (seed % 3) * 3 - 3, roll: (seed % 2) * 4 - 2, z: -2 });
    G.box(0, 0, 3, 12, 36, 3, TC.stoneD);
  })];
}
// ---- the coal heap by the retort house: a low mound of coal, lumpy, its foot just under the ground
export function coalHeap(r = 300, h = 150, seed = 1) {
  seed = N(seed); r = q(r, 20); h = q(h, 10);
  return ['tccoal|' + [r, h, seed % 3].join('|'), shape((G) => {
    G.blob(0, 0, -6, r, r * 0.9, h + 6, (nx, ny, nz) => (wob(nx * 6 + seed, ny * 6 + nz * 4) > 0.4 ? KC.coalL : KC.coal), { nu: 16, nv: 8, warp: (x, y, z, nx, ny, nz) => { const k = 1 + wob(nx * 4 + seed, ny * 4) * 0.1; return [x * k, y * k, Math.max(z, -4)]; } });
  })];
}
// ---- the retort house's chimney: a square brick stack tapering as it rises, a stone band and a corbelled cap, the top
// sooted black
export function stack(h = 1600, b = 90) {
  h = q(h, 100); b = q(b, 10);
  return ['tcstack|' + [h, b].join('|'), shape((G) => {
    const n = Math.round(h / 50); G.box(0, 0, 30, b + 16, b + 16, 30, TC.stoneD);
    for (let k = 0; k < n; k++) { const z = 60 + k * ((h - 60) / n), t = k / n, r = b * (1 - 0.3 * t), c = t > 0.93 ? 0x2a2420 : KC.brick[k % 4]; G.box(0, 0, z + (h - 60) / n / 2, r, r, (h - 60) / n / 2 + 0.5, c); }
    const rt = b * 0.7; G.box(0, 0, h * 0.55, b * 0.85 + 4, b * 0.85 + 4, 10, TC.stone[0]); G.box(0, 0, h + 8, rt + 10, rt + 10, 8, TC.stoneD); G.box(0, 0, h + 22, rt + 4, rt + 4, 6, 0x2a2420);
  })];
}

// ---- the cattle market's pens: a run of painted rails along X, square posts every bay, four rails, 100 high
export function penRail(len = 320, h = 100, skip = 0) {   // skip: 1 no post at the -X end, 2 none at the +X end (another run's post stands there)
  len = q(len, 20); h = q(h, 10);
  return ['tcpen|' + [len, h, skip].join('|'), shape((G) => {
    const n = Math.max(1, Math.round(len / 160)), bay = len / n, c = 0xd8d2c2, cd = 0xa8a294;
    for (let i = 0; i <= n; i++) { if ((i === 0 && skip & 1) || (i === n && skip & 2)) continue; const x = -len / 2 + i * bay; G.box(x, 0, h / 2 + 4, 5, 5, h / 2 + 4, cd); G.box(x, 0, h + 9, 6.5, 6.5, 1.5, cd); }
    for (const z of [h * 0.28, h * 0.52, h * 0.76, h]) G.box(0, 0, z, len / 2, 2.2, 4.5, c);
  })];
}
// ---- a raised bed's planting (set on its soil): low leafy mounds in a row and flowers standing out of them, two
// colours; a tenth of the faces of the village's flower clumps
export function bedPlants(w = 340, d = 110, col = 0xe86a8a, col2 = 0xf2d04a, seed = 1) {
  seed = N(seed); w = q(w, 20); d = q(d, 10);
  return ['tcbedp|' + [w, d, col, col2, seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 19 + w), n = Math.max(2, Math.round(w / 60));
    for (let i = 0; i < n; i++) { const x = -w / 2 + (i + 0.5) * (w / n), r = Math.min(w / n, d) * 0.5; G.blob(x, (R() - 0.5) * 10, 2, r, d * 0.42, r * 0.7, i % 2 ? 0x4e7e34 : 0x5a8a3a, { nu: 8, nv: 4 });
      for (let k = 0; k < 4; k++) { const a = R() * 6.28, dd = R() * r * 0.7, x2 = x + Math.cos(a) * dd, y2 = Math.sin(a) * Math.min(dd, d * 0.32), z2 = 2 + r * 0.7 * Math.sqrt(Math.max(0, 1 - (dd / r) ** 2)) + 3; G.blob(x2, y2, z2, 5, 5, 3.5, R() < 0.6 ? col : col2, { nu: 5, nv: 3 }); } }
  })];
}
