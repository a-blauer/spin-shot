// The Crossroads Inn's pieces: the coaching inn (the Four Ways) with its taproom and the furniture in it, the stable
// block, the coach house and the coach, the beer garden's tables and the skittle alley, the tollhouse, the farrier's
// tyring platform and cart wheels, luggage, the milestone and the four-armed finger post, the mounting block, the
// cellar flaps, a hurdle.
//
// Each piece's own frame: z up from the ground at 0; its front at -Y unless it says otherwise.
import { shapeB as shape, wob } from './propkit.js';
import { mix } from './village_shapes.js';
import { q, rng } from './dest_props.js';
import { MB, courses, coursesY, tileRoof } from './dest_props_mill.js';

export const IC = {   // the inn's colours: the Vale's warm stone and red tiles (Millbrook's), dark oak, lime, its green paint
  oak: 0x4e3826, oakD: 0x3a2a1c, oakL: 0x6e5034, lime: 0xeee4cc, limeD: 0xdcd0b4,
  paint: 0x2e5a44, paintD: 0x224434, gold: 0xc8a24a, glass: 0x56687a, glassL: 0x74889a, lead: 0x34383e,
  iron: 0x34343a, flag: [0x9a9282, 0x8e8676, 0xa69e8c, 0x867e70], soot: 0x2a2420, fire: 0xff8a3a, ember: 0xffc060,
  brass: 0xc8a050, pewter: 0x9aa0a4, bottle: [0x3e6a3a, 0x6a3a2a, 0x2e4a5e, 0x8a7a3a], cloth: 0x8a3a2e, chalk: 0x2a2e2c,
  coach: 0x2e4e3a, coachD: 0x1e3428, line: 0xd8c890, wheel: 0xa83a2a, leather: 0x4a3426, black: 0x1e1e22,
  flower: [0xd84a5a, 0xf0c040, 0xe8e0f0, 0x9a5ac8], leaf: 0x4e7a34, straw: 0xd8b062, hazel: 0x8a6a42,
};
const N = (s) => Math.abs(Math.round(s)) || 0;
const pick = (a, i) => a[((i % a.length) + a.length) % a.length];
const deg = (r) => (r * 180) / Math.PI;

// ---- shared bits: a leaded casement (its frame in the XZ plane facing -Y, w by h, its sill at z 0), a plank door
// leaf (w by h, hinged on its -X edge, facing -Y), a flower box, a lantern on an iron bracket
const casement = (G, w, h, cols = 2) => {
  const o = IC.oak;
  G.box(0, 0, -5, w / 2 + 12, 9, 5, o); G.box(0, 0, h + 5, w / 2 + 6, 6, 5, o);   // sill (standing out), head
  for (const sx of [-1, 1]) G.box(sx * (w / 2 + 3), 0, h / 2, 4, 6, h / 2, o);
  for (let c = 1; c < cols; c++) G.box(-w / 2 + (w * c) / cols, 0, h / 2, 3.5, 5.5, h / 2, o);
  G.box(0, 0, h * 0.68, w / 2, 5, 3, o);
  G.box(0, 1.5, h / 2, w / 2, 1, h / 2, (nx, ny) => (ny < 0 ? IC.glass : IC.glassL));
  for (let x = -w / 2 + 22; x < w / 2 - 6; x += 22) G.box(x, -0.4, h / 2, 0.7, 0.6, h / 2, IC.lead);
  for (let z = 24; z < h - 6; z += 26) G.box(0, -0.4, z, w / 2, 0.6, 0.7, IC.lead);
};
const leaf = (G, w, h, col = IC.paint) => {
  for (let i = 0, n = Math.max(2, Math.round(w / 26)); i < n; i++) G.box(-w / 2 + (w * (i + 0.5)) / n, 0, h / 2, w / n / 2 - 0.6, 3, h / 2, i % 2 ? col : mix(col, 0x000000, 0.12));
  for (const z of [h * 0.18, h * 0.82]) G.box(0, -3.5, z, w / 2 - 4, 1.5, 7, mix(col, 0x000000, 0.25));
  G.lathe([[5, -2], [5, 2], [3, 2], [3, -2], [5, -2]], IC.iron, 8, [0, 0, 0], [1, 1], true);
};
const flowerBox = (G, x, y, z, w, R) => {
  G.box(x, y, z + 9, w / 2, 11, 9, IC.paint);
  for (let i = 0, n = Math.round(w / 18); i < n; i++) { const fx = x - w / 2 + 9 + (i * (w - 18)) / Math.max(1, n - 1); G.blob(fx, y, z + 20, 11, 10, 9, IC.leaf, { nu: 6, nv: 4 }); if (R() < 0.7) G.blob(fx + (R() - 0.5) * 8, y - 4, z + 28, 5, 5, 4, pick(IC.flower, i), { nu: 5, nv: 3 }); }
};
const lantern = (G, x, y, z, out) => {   // its bracket from the wall at (x, y) out along -Y by `out`, the lamp hanging at z
  G.tube([[x, y, z + 70], [x, y - out * 0.6, z + 72], [x, y - out, z + 60]], 2.4, IC.iron, { S: 5 }); G.tube([[x, y, z + 30], [x, y - out * 0.55, z + 70]], 2, IC.iron, { S: 5 });
  G.box(x, y, z + 50, 6, 4, 26, IC.iron); G.box(x, y - out, z + 56, 2, 2, 6, IC.iron);
  G.lathe([[0, 30], [14, 32], [14, 34], [9, 46], [3, 50]], IC.iron, 4, [x, y - out, z]); G.lathe([[11, 0], [11, 4], [13, 4], [13, 30], [0, 30]], (k) => (k === 3 ? IC.ember : IC.iron), 4, [x, y - out, z]);
};

// ---- the coaching inn, the Four Ways: a stone ground floor, a timber-framed upper floor jettied over the front, a
// roof of red tiles with the chimneys of its three hearths; the carriage way through its middle under a great oak beam;
// the taproom (+X) behind its open double doors, its bay window and its back door to the yard, its door off the
// carriage way; the parlour end (-X) shut. Its front is -Y, 2600 along X, 760 deep. IN: the measures the map needs
// (the openings, the taproom's floor, where the lamps hang and the name board is).
export const IN = { L: 2600, D: 760, t: 40, g: 420, e: 780, r: 1240, jet: 30, pass: 240, passH: 380, tap: [280, 1260],
  door: [480, 720, 300], bay: [840, 1180, 70, 330, 90], back: [380, 600, 290], side: [120, 300, 280], fire: [1140, 1260, -200, 200],
  stack: [150, 210], lamps: [[300, -420, 285], [-300, -420, 285], [0, 0, 315], [340, 420, 265], [1200, 0, 50]], board: [0, -418, 520] };
export function inn(seed = 1) {
  seed = N(seed);
  return ['ininn|' + (seed % 2), shape((G) => {
    const { L, D, t, g, e, r, jet, pass, passH, door, bay, back, side } = IN, hl = L / 2, hd = D / 2, R = rng(seed * 97 + 5), o = IC.oak, St = MB.stone;
    // ---- the ground floor's walls: coursed stone; the carriage way, the doors, the windows left open in them
    const winsF = [[-1160, -960], [-620, -440]], winsB = [[-1120, -940], [-620, -440], [880, 1100]];
    courses(G, -hl, hl, -hd + t / 2, t, 0, g, [[-pass, pass, 0, passH], [door[0], door[1], 0, door[2]], [bay[0], bay[1], bay[2], bay[3]], ...winsF.map(([a, b]) => [a, b, 110, 330]), [-860, -720, 0, 270]], 36, 72, St, seed);
    courses(G, -hl, hl, hd - t / 2, t, 0, g, [[-pass, pass, 0, passH], [back[0], back[1], 0, back[2]], ...winsB.map(([a, b]) => [a, b, 110, 330])], 36, 72, St, seed + 1);
    coursesY(G, -hd + t, hd - t, -hl + t / 2, t, 0, g, [[-110, 110, 110, 330]], 36, 72, St, seed + 2);
    coursesY(G, -hd + t, hd - t, hl - t / 2, t, 0, g, [[250, 330, 150, 310], [-330, -250, 150, 310]], 36, 72, St, seed + 3);
    coursesY(G, -hd + t, hd - t, -pass - t / 2, t, 0, g, [], 36, 72, St, seed + 4);
    coursesY(G, -hd + t, hd - t, pass + t / 2, t, 0, g, [[side[0], side[1], 0, side[2]]], 36, 72, St, seed + 5);
    // quoins up the corners and the carriage way's jambs, a plinth course
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (let k = 0, z = 0; z < g - 4; k++, z += 36) { const a = k % 2 ? 46 : 26, b = k % 2 ? 26 : 46; G.box(sx * (hl - a + 2), sy * (hd - b + 2), z + 18, a, b, 17.5, St[(k + 2) % 4]); }
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (let k = 0, z = 0; z < passH - 4; k++, z += 36) G.box(sx * (pass + 22), sy * (hd - (k % 2 ? 24 : 34)), z + 18, 23, k % 2 ? 26 : 36, 17.5, St[(k + 1) % 4]);
    for (const sy of [-1, 1]) for (const [a, b] of [[-hl, -pass], [pass, hl]]) G.box((a + b) / 2, sy * (hd + 3), 14, (b - a) / 2 + 6, 6, 14, MB.stoneD);
    // ---- the carriage way: the great beam over each end on its curved braces, the boards and joists over it, a lamp
    for (const sy of [-1, 1]) { const yb = sy * (hd - 14) + (sy < 0 ? -jet / 2 : 0);
      G.box(0, yb, passH + 30, pass + 40, 18 + (sy < 0 ? jet / 2 : 0), 30, IC.oakD);
      for (const sx of [-1, 1]) G.tube([[sx * (pass - 4), yb, passH - 110], [sx * (pass - 30), yb, passH - 40], [sx * (pass - 110), yb, passH - 2]], 8, IC.oakD, { S: 6 }); }
    // ---- the taproom: its flagstone floor, its ceiling of boards on beams, the inglenook in its gable wall
    const [tx0, tx1] = IN.tap, ty = hd - t;
    for (let x = tx0, i = 0; x < tx1 - 1; x += 122, i++) for (let y = -ty, j = 0; y < ty - 1; y += 113, j++) { const x1 = Math.min(tx1, x + 122), y1 = Math.min(ty, y + 113); G.box((x + x1) / 2, (y + y1) / 2, 1, (x1 - x) / 2 - 1.2, (y1 - y) / 2 - 1.2, 1, pick(IC.flag, i * 3 + j * 5)); }
    G.box((tx0 + tx1) / 2, 0, 0.2, (tx1 - tx0) / 2, ty, 0.2, 0x3a362e);
    { const [fx0, fx1, fy0, fy1] = IN.fire, fz = 200;
      for (const sy of [-1, 1]) { const b = G.n; courses(G, fx0, fx1, 0, 50, 0, fz, [], 34, 60, St, seed + 6 + sy); G.map(b, ([x, y, z]) => [x, sy * (fy1 - 25) + y, z]); }
      { const b = G.n; courses(G, fy0, fy1, 0, fx1 - fx0, fz + 40, g - 4, [], 34, 68, St, seed + 8); G.map(b, ([x, y, z]) => [(fx0 + fx1) / 2 - y, x, z]); }
      G.box((fx0 + fx1) / 2 - 4, 0, fz + 20, (fx1 - fx0) / 2 + 6, fy1 + 6, 20, IC.oakD);
      for (let i = 0; i < 7; i++) G.box(fx0 - 11, -fy1 + 40 + i * 53, fz + 24, 1.2, 9, 10, IC.brass);
      G.box((fx0 + fx1) / 2, 0, 3, (fx1 - fx0) / 2, fy1 - 50, 3, IC.soot); G.box(fx1 - 6, 0, fz / 2, 4, fy1 - 50, fz / 2, IC.soot);
      for (const sy of [-1, 1]) G.tube([[fx0 + 30, sy * 60, 3], [fx0 + 30, sy * 60, 40], [fx1 - 30, sy * 60, 24]], 3.5, IC.iron, { S: 5 });
      for (const [a, b2] of [[-70, 60], [-40, 75], [20, 70]]) G.tube([[fx0 + 34, a, 22 + (b2 % 3) * 4], [fx1 - 36, a + 50, 30]], 10, mix(IC.oakD, 0x000000, 0.2), { S: 6 });
      G.blob((fx0 + fx1) / 2, 0, 32, 46, 74, 18, IC.fire, { nu: 10, nv: 4 }); G.blob((fx0 + fx1) / 2, 0, 46, 24, 40, 18, IC.ember, { nu: 8, nv: 4 }); }
    // the dart board and the slate on the back wall; pictures in their frames; tankards hung along the beam over the bar
    { const b = G.n; G.lathe([[0, 0], [26, 0], [26, 4], [0, 4]], (k) => (k === 1 ? 0x1e1c1a : 0xc8b890), 16, [0, 0, 0]); G.place(b, { x: 820, y: ty, z: 190, roll: 90 }); }
    G.box(700, ty - 3, 190, 70, 2, 50, IC.chalk); G.box(700, ty - 1.5, 190, 74, 2, 54, IC.oak);
    for (const [x, z, c] of [[380, 250, 0x7a8a5a]]) { G.box(x, -ty + 1.5, z, 50, 2, 36, IC.oakD); G.box(x, -ty + 3.5, z, 42, 1, 28, c); }
    // ---- doors: the taproom's front doors and its back doors swung open square to the wall; the parlour's shut;
    // the door off the carriage way stands empty (its frame)
    for (const [x0, x1, h, sy] of [[door[0], door[1], door[2], -1], [back[0], back[1], back[2], 1]]) { const lw = (x1 - x0) / 2;
      G.box((x0 + x1) / 2, sy * (hd + 2), h + 8, lw + 14, 6, 8, IC.oakD); for (const x of [x0, x1]) G.box(x, sy * (hd - t / 2), h / 2, 7, t / 2 + 2, h / 2 + 2, IC.oakD);
      for (const [x, s] of [[x0, -1], [x1, 1]]) { const b = G.n; leaf(G, lw - 4, h - 6); G.place(b, { x: x - s * 2, y: sy * (hd + lw / 2 + 2), z: 3, yaw: 90 }); } }
    { const b = G.n; leaf(G, 140, 262, IC.paintD); G.place(b, { x: -790, y: -hd + t / 2, z: 4 }); }
    for (const y of [side[0], side[1]]) G.box(pass + t / 2, y, side[2] / 2, t / 2 + 2, 7, side[2] / 2 + 2, IC.oakD); G.box(pass + t / 2, (side[0] + side[1]) / 2, side[2] + 8, t / 2 + 2, (side[1] - side[0]) / 2 + 14, 8, IC.oakD);
    // ---- windows: the ground floor's in their stone reveals; the bay on the taproom's front on its stone base
    for (const [a, b2] of winsF) { const m = G.n; casement(G, b2 - a - 8, 210); G.place(m, { x: (a + b2) / 2, y: -hd + 10, z: 116 }); flowerBox(G, (a + b2) / 2, -hd - 10, 92, b2 - a, R); }
    for (const [a, b2] of winsB) { const m = G.n; casement(G, b2 - a - 8, 210); G.place(m, { x: (a + b2) / 2, y: hd - 10, z: 116, yaw: 180 }); }
    { const m = G.n; casement(G, 200, 170); G.place(m, { x: -hl + 10, y: 0, z: 140, yaw: -90 }); }
    for (const y of [-290, 290]) { const m = G.n; casement(G, 60, 150, 1); G.place(m, { x: hl - 10, y, z: 156, yaw: 90 }); }
    { const [x0, x1, z0, z1, dp] = bay, mx = (x0 + x1) / 2, hw = (x1 - x0) / 2, y0 = -hd - dp;
      { const b = G.n; courses(G, x0, x1, 0, dp, 0, z0, [], 35, 60, St, seed + 9); G.map(b, ([x, y, z]) => [x, -hd - dp / 2 + y, z]); }
      G.box(mx, y0 + dp / 2, z0 + 3, hw + 8, dp / 2 + 8, 4, MB.stoneD);
      { const m = G.n; casement(G, x1 - x0 - 30, z1 - z0 - 14, 4); G.place(m, { x: mx, y: y0 + 4, z: z0 + 8 }); }
      for (const sx of [-1, 1]) { const m = G.n; casement(G, dp - 24, z1 - z0 - 14, 1); G.place(m, { x: mx + sx * (hw - 4), y: y0 + dp / 2, z: z0 + 8, yaw: sx * 90 }); }
      G.box(mx, -hd - dp / 2, z1 + 8, hw + 4, dp / 2 + 4, 8, IC.oakD);
      { const a = Math.atan2(40, dp + 24), b = G.n; G.box(0, 0, 0, hw + 14, (dp + 24) / 2 / Math.cos(a), 4, 0x6e7276); G.place(b, { x: mx, y: -hd - (dp + 24) / 2 + 2, z: z1 + 38, roll: deg(a) }); }
      G.box(mx, -hd - 3, z1 + 52, hw + 14, 3, 16, 0x5e6266); G.box(mx, -hd - dp / 2, z0 + 12, hw - 4, dp / 2 - 4, 2, IC.oak); }
    for (let x = -hl + 60; x <= hl - 59; x += 200) if (Math.abs(x) > pass + 60) G.tube([[x, -hd + 2, g - 60], [x, -hd - jet + 6, g - 10]], 7, IC.oakD, { S: 5 });
    // ---- the taproom's great chimney stack up the outside of its gable (+X), its pots
    { const [sx0, sw] = IN.stack, x0 = hl, x1 = hl + sx0;
      for (let k = 0, z = 0; z < r + 150; k++, z += 40) { const top = z + 40, narrow = z > e + 80, w = narrow ? sw * 0.6 : sw, xa = narrow ? x0 + 20 : x0, xb = narrow ? x1 - 30 : x1;
        for (let j = 0, y = -w - (k % 2 ? 35 : 0); y < w - 1; j++, y += 70) { const ya = Math.max(-w, y), yb = Math.min(w, y + 70); if (yb - ya < 6) continue; G.box((xa + xb) / 2, (ya + yb) / 2, z + 20, (xb - xa) / 2, (yb - ya) / 2 - 0.6, 19.5, St[(k + j) % 4]); } }
      for (const z of [e + 60]) G.box(x0 + sx0 / 2 - 5, 0, z + 20, sx0 / 2 + 4, sw + 4, 6, MB.stoneD);
      for (const y of [-40, 40]) G.lathe([[16, 0], [14, 40], [18, 44], [18, 50], [12, 52]], MB.brick[1], 10, [x0 + sx0 / 2 - 5, y, r + 150]); }
    // ---- lamps: on brackets by the carriage way's mouth and the taproom's door; one hung in the carriage way
    for (const [x, , z] of IN.lamps.slice(0, 2)) lantern(G, x, -hd - 2, z - 15, 38);
    lantern(G, IN.lamps[3][0], hd + 2, IN.lamps[3][2] - 15, -38);
  })];
}

// ---- the inn's upper floor and roof (and the ceilings of the taproom and the carriage way, the tankards hung from
// the taproom's beam), apart so a view from above can take them off and look in
export function innTop(seed = 1) {
  seed = N(seed);
  return ['inroof|' + (seed % 2), shape((G) => {
    const { L, D, t, g, e, r, jet, pass } = IN, hl = L / 2, hd = D / 2, R = rng(seed * 97 + 11), o = IC.oak, [tx0, tx1] = IN.tap, ty = hd - t;
    G.box(0, 0, g - 2, pass, hd, 2, MB.boardD);
    for (let y = -hd + 60; y < hd - 30; y += 90) G.box(0, y, g - 12, pass, 8, 10, IC.oak);
    G.box(0, 0, g - 40, 2, 2, 36, IC.iron);
    G.lathe([[0, 30], [14, 32], [14, 34], [9, 46], [3, 50]], IC.iron, 4, [0, 0, 300]); G.lathe([[11, 0], [11, 4], [13, 4], [13, 30], [0, 30]], (k) => (k === 3 ? IC.ember : IC.iron), 4, [0, 0, 300]);
    G.box((tx0 + tx1) / 2, 0, g - 2, (tx1 - tx0) / 2, ty, 2, MB.boardD);
    for (let x = tx0 + 120; x < tx1 - 60; x += 180) G.box(x, 0, g - 15, 11, ty, 13, IC.oak);
    G.box((tx0 + tx1) / 2, 0, g - 34, (tx1 - tx0) / 2, 14, 16, IC.oakD);
    for (let i = 0; i < 6; i++) { const x = tx0 + 120, y = -200 + i * 46; G.tube([[x, y, g - 26], [x, y, g - 52]], 0.8, IC.iron, { S: 3 }); G.lathe([[7, 0], [7.5, 18], [6, 20], [0, 20]], IC.pewter, 8, [x, y, g - 70]); G.tube([[x + 6, y, g - 56], [x + 13, y, g - 60], [x + 6, y, g - 66]], 1.4, IC.pewter, { S: 3 }); }
    // ---- the upper floor: a sill beam standing out over the front on brackets; lime between close-set oak studs, a
    // rail at the window sills; its windows, flower boxes under the front ones; the name board over the carriage way
    const yf = -hd - jet, ux = 0;
    G.box(0, -jet / 2, g + 10, hl + 6, hd + jet / 2 + 6, 10, IC.oakD);
    const face = (along, at, ax, wins) => {   // one face of the upper floor: the infill and its frame; at(t, z) -> [x, y] on the face
      const n = Math.round(along / 90);
      for (let i = 0; i <= n; i++) { const t2 = (along * i) / n, [x, y] = at(t2); G.box(x, y, (g + e) / 2 + 10, ax ? 5 : 4, ax ? 4 : 5, (e - g) / 2 - 10, o); }
      for (const z of [g + 92, e - 6]) { const [x, y] = at(along / 2); G.box(x, y, z, ax ? along / 2 : 4.5, ax ? 4.5 : along / 2, 6, o); }
      for (const [a, b2] of wins) { const [x, y] = at((a + b2) / 2), m = G.n; casement(G, b2 - a, 150); G.place(m, { x, y, z: g + 96, yaw: ax ? (y < 0 ? 0 : 180) : x < 0 ? -90 : 90 }); }
    };
    G.box(0, yf + 3, (g + e) / 2 + 10, hl, 3, (e - g) / 2 - 10, (nx, ny, nz) => mix(IC.lime, IC.limeD, 0.5 + 0.5 * wob(nx + seed, nz)));
    G.box(0, hd - 3, (g + e) / 2 + 10, hl, 3, (e - g) / 2 - 10, IC.lime);
    for (const sx of [-1, 1]) G.box(sx * (hl - 3), -jet / 2, (g + e) / 2 + 10, 3, hd + jet / 2, (e - g) / 2 - 10, IC.limeD);
    const upF = [[-1160, -940], [-760, -540], [540, 760], [940, 1160]];
    face(L, (t2) => [-hl + t2, yf - 1], true, upF.map(([a, b2]) => [a + hl, b2 + hl]));
    face(L, (t2) => [-hl + t2, hd + 1], true, [[-1160, -940], [-620, -400], [400, 620], [940, 1160]].map(([a, b2]) => [a + hl, b2 + hl]));
    for (const sx of [-1, 1]) face(D + jet, (t2) => [sx * (hl + 1), yf + t2], false, [[(D + jet) / 2 - 90, (D + jet) / 2 + 90]]);
    for (const [a, b2] of upF) flowerBox(G, (a + b2) / 2, yf - 10, g + 72, b2 - a, R);
    G.box(0, yf - 6, IN.board[2], 330, 3, 46, IC.paint); G.box(0, yf - 4.5, IN.board[2], 338, 2, 54, IC.gold);
    // ---- the roof: red tiles, gabled at both ends, the gables framed in oak with lime between; the ridge tiles
    const yc = -jet / 2, hw = hd + jet / 2, s2 = (r - e) / hw, ov = 50;
    { const b = G.n; tileRoof(G, hl + 40, hw + ov, e - s2 * ov, r, seed); G.place(b, { y: yc }); }
    for (const sx of [-1, 1]) { const x = sx * (hl - 2), b = G.n;
      const P = [[yc - hw, e], [yc + hw, e], [yc, r - 6]]; for (const dx of [-3, 3]) for (const [y, z] of P) G.v(x + dx, y, z, IC.lime);
      G.idx.push(b, b + 1, b + 2, b + 3, b + 5, b + 4);
      G.box(x, yc, r * 0.5 + e * 0.5 - 40, 4, 6, (r - e) / 2 - 30, o); G.box(x, yc, e + (r - e) * 0.45, 4, hw * 0.55, 5, o);
      for (const sd of [-1, 1]) G.tube([[x + sx * 4, yc + sd * (hw + ov), e - s2 * ov - 4], [x + sx * 4, yc, r + 2]], 5, IC.oakD, { S: 4 });
      { const m = G.n; casement(G, 110, 110); G.place(m, { x: x + sx * 4, y: yc, z: e + 40, yaw: sx * 90 }); } }
    // the parlour's and the kitchen's brick stacks through the ridge, their pots
    for (const x of [-hl + 140, -400]) { for (let k = 0, z = r - 220; z < r + 170; k++, z += 34) for (let j = 0; j < 2; j++) G.box(x + (j - 0.5) * 60, yc, z + 17, 29.4, 46, 16.6, pick(MB.brick, k + j));
      G.box(x, yc, r + 172, 66, 52, 6, MB.stoneD); for (const dx of [-28, 28]) G.lathe([[14, 0], [12, 36], [15, 40], [15, 46], [10, 48]], MB.brick[2], 10, [x + dx, yc, r + 178]); }
  })];
}

// ---- the taproom's furniture. The bar: a panelled oak counter along X (its front -Y) with a brass foot rail, the beer
// engine's three handles and tankards on its top; behind it the back bar: shelves of bottles and jugs over three casks
// on their stillage. BAR.d its whole depth (the back bar's back at +BAR.d/2 goes against the wall)
export const BAR = { d: 200, h: 112 };
export function barCounter(len = 520, seed = 1) {
  len = q(len, 20); seed = N(seed);
  return ['inbar|' + [len, seed % 2].join('|'), shape((G) => {
    const R = rng(seed * 31 + len), hl = len / 2, hd = BAR.d / 2, h = BAR.h, o = IC.oak, cy = -hd + 35;
    G.box(0, cy, h / 2 - 1, hl, 33, h / 2 - 1, IC.oakD);
    for (let x = -hl + 50, i = 0; x < hl - 20; x += 100, i++) { G.box(x, cy - 33.5, h / 2, 40, 1, h / 2 - 18, o); G.box(x, cy - 34.5, h / 2, 34, 1, h / 2 - 24, IC.oakL); }
    G.box(0, cy, h + 2, hl + 8, 40, 4, IC.oakL);
    G.tube([[-hl + 10, cy - 52, 24], [hl - 10, cy - 52, 24]], 3, IC.brass, { S: 6 }); for (const x of [-hl + 30, 0, hl - 30]) G.tube([[x, cy - 52, 24], [x, cy - 34, 30]], 2, IC.brass, { S: 4 });
    for (let i = 0; i < 3; i++) { const x = -40 + i * 40; G.box(x, cy + 14, h + 10, 9, 9, 6, IC.oakD); G.lathe([[3, 0], [3, 40], [6, 46], [7, 62], [4, 70], [0, 72]], (k) => (k > 2 ? 0xe8e0d0 : IC.brass), 8, [x, cy + 14, h + 14]); }
    for (const [x, y] of [[-hl + 60, cy - 10], [-hl + 90, cy + 8], [hl - 70, cy], [100, cy - 14]]) { G.lathe([[7, 0], [7.5, 18], [6, 20], [0, 20]], IC.pewter, 8, [x, y, h + 6]); G.tube([[x + 6, y, h + 21], [x + 13, y, h + 17], [x + 6, y, h + 11]], 1.4, IC.pewter, { S: 3 }); }
    // the back bar
    const by = hd - 25;
    G.box(0, by + 10, 115, hl, 15, 115, IC.oakD);
    for (const z of [116, 160, 204]) { G.box(0, by - 8, z, hl - 10, 16, 3, IC.oakL); for (let x = -hl + 24; x < hl - 20; x += 22 + R() * 10) { const c = pick(IC.bottle, Math.round(x)); if (R() < 0.25) G.lathe([[8, 0], [9, 10], [7, 18], [3, 21], [4, 24], [0, 24]], 0xd8ccb0, 8, [x, by - 8, z + 3]); else G.lathe([[5, 0], [5, 18], [2, 24], [2, 30], [0, 30]], c, 6, [x, by - 8, z + 3]); } }
    G.box(0, by - 12, 104, hl - 10, 20, 3, IC.oak);
    for (let i = 0; i < 3; i++) { const x = -hl + 70 + i * ((len - 140) / 2); G.box(x, by - 10, 18, 30, 18, 3, IC.oakD); for (const sx of [-1, 1]) G.box(x + sx * 24, by - 10, 9, 4, 18, 9, IC.oakD);
      const b = G.n; G.lathe([[0, -32], [26, -32], [30, -16], [31, 0], [30, 16], [26, 32], [0, 32]], (k) => (k === 2 || k === 4 ? IC.iron : 0x8a6a42), 12); G.place(b, { x, y: by - 10, z: 52, roll: 90 }); G.box(x, by - 43, 52, 3, 2, 3, IC.brass); }
  })];
}
// a settle: a high-backed oak bench, arms at its ends; its seat faces -Y
export function settle(len = 220) {
  len = q(len, 20);
  return ['insettle|' + len, shape((G) => {
    const hl = len / 2, o = IC.oakD;
    G.box(0, 0, 44, hl, 24, 3, IC.oak); G.box(0, -20, 22, hl - 4, 3, 20, o); G.box(0, 22, 92, hl, 4, 90, o);
    for (let x = -hl + 40; x < hl - 20; x += 60) G.box(x, 18, 100, 2, 1, 70, IC.oak);
    for (const sx of [-1, 1]) { G.box(sx * (hl - 4), 0, 64, 4, 26, 64, o); G.box(sx * (hl - 4), -6, 128, 5, 22, 3, IC.oak); }
  })];
}
// a taproom table: kind 0 round on its pedestal with three stools round it; kind 1 a long one with a bench each side.
// On it tankards, a candle in its stick, a plate. TB.r how far it reaches (its body)
export const TB = { r: 105, long: [240, 210] };
export function pubTable(kind = 0, seed = 1) {
  seed = N(seed);
  return ['intable|' + [kind, seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 17 + kind), o = IC.oak;
    if (kind === 0) { G.lathe([[46, 70], [48, 72], [48, 76], [0, 76]], IC.oakL, 16); G.lathe([[30, 0], [30, 4], [8, 8], [7, 64], [12, 70], [0, 70]], IC.oakD, 10);
      for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.4 + R() * 0.3, x = Math.cos(a) * 80, y = Math.sin(a) * 80; G.lathe([[18, 40], [18, 44], [0, 44]], IC.oakL, 10, [x, y, 0]); for (let j = 0; j < 3; j++) { const b2 = a + (j / 3) * Math.PI * 2; G.tube([[x + Math.cos(b2) * 16, y + Math.sin(b2) * 16, 0], [x + Math.cos(b2) * 11, y + Math.sin(b2) * 11, 41]], 2.4, o, { S: 4 }); } } }
    else { const [L, W] = [TB.long[0], 90]; G.box(0, 0, 73, L / 2, W / 2, 3, IC.oakL); for (const sx of [-1, 1]) { G.box(sx * (L / 2 - 26), 0, 36, 5, W / 2 - 10, 34, o); G.box(sx * (L / 2 - 26), 0, 6, 5, W / 2 - 6, 6, o); } G.box(0, 0, 20, L / 2 - 26, 4, 4, o);
      for (const sy of [-1, 1]) { G.box(0, sy * 78, 42, L / 2 - 10, 14, 2.5, IC.oakL); for (const sx of [-1, 1]) G.box(sx * (L / 2 - 30), sy * 78, 20, 4, 12, 20, o); } }
    const top = kind === 0 ? 76 : 76;
    for (let i = 0; i < 2 + (seed % 2); i++) { const a = R() * 6.28, d = R() * (kind ? 60 : 26), x = Math.cos(a) * d * (kind ? 1.6 : 1), y = Math.sin(a) * d * 0.5; G.lathe([[7, 0], [7.5, 18], [6, 20], [0, 20]], IC.pewter, 8, [x, y, top]); G.tube([[x + 6, y, top + 15], [x + 13, y, top + 11], [x + 6, y, top + 5]], 1.4, IC.pewter, { S: 3 }); }
    G.lathe([[9, 0], [9, 2], [3, 4], [2.5, 8], [5, 9], [3, 10], [3, 28], [0, 30]], (k) => (k > 5 ? 0xf0e8d8 : IC.brass), 8, [kind ? -50 : 10, kind ? 10 : -16, top]);
    G.lathe([[16, 0], [18, 2], [17, 3], [0, 3]], 0xe8e0cc, 12, [kind ? 50 : -14, kind ? -12 : 14, top]);
  })];
}
// ---- a beer-garden table: the top and its two benches on one frame of crossed legs
export function picnicTable(seed = 1) {
  seed = N(seed);
  return ['inpicnic|' + (seed % 2), shape((G) => {
    const L = 200, o = seed % 2 ? 0x8a6a46 : 0x7a5c3c, oD = 0x5e4630;
    for (let i = 0; i < 4; i++) G.box(0, -33 + i * 22, 74, L / 2, 10, 2.5, i % 2 ? o : mix(o, 0xffffff, 0.06));
    for (const sy of [-1, 1]) for (let i = 0; i < 2; i++) G.box(0, sy * (84 + i * 20 - 10), 44, L / 2 - 6, 9, 2.5, o);
    for (const sx of [-1, 1]) { const x = sx * (L / 2 - 30); for (const sy of [-1, 1]) G.tube([[x, sy * 70, 0], [x, sy * 22, 71]], 4, oD, { S: 4 }); G.box(x, 0, 40, 4, 104, 3.5, oD); G.box(x, 0, 70, 4, 40, 3, oD); }
    G.tube([[-L / 2 + 30, 0, 40], [0, 0, 71]], 3, oD, { S: 4 }); G.tube([[L / 2 - 30, 0, 40], [0, 0, 71]], 3, oD, { S: 4 });
  })];
}
// ---- a ring bench round a tree: eight seat boards in an octagon on their legs, r the trunk's side of it
export function ringBench(r = 90) {
  r = q(r, 10);
  return ['inring|' + r, shape((G) => {
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, b = G.n, w = 2 * (r + 22) * Math.tan(Math.PI / 8);
      for (let j = 0; j < 3; j++) G.box(0, r + 8 + j * 14, 44, w / 2 + j * 5.5, 6, 2.5, j % 2 ? 0x8a6a46 : 0x7e6040);
      for (const sx of [-1, 1]) G.box(sx * w * 0.34, r + 22, 21, 3.5, 16, 21, 0x5e4630);
      G.place(b, { yaw: deg(a) - 90 }); }
  })];
}

// ---- the inn's sign on its post by the road: an oak post on a stone foot, an iron arm scrolled out along +X, the board
// hung from it on two rings, painted the inn's green in a gold frame with its four roads crossing; its faces are ±Y
// (the name goes on both). SIGN: the board's middle (x, z) and its size
export const SIGN = { x: 150, z: 268, w: 210, h: 140, post: 430 };
export function innSign() {
  return ['insign', shape((G) => {
    const { x: bx, z: bz, w, h, post } = SIGN;
    G.blob(0, 0, 18, 40, 40, 18, MB.stoneD, { e: 6, nu: 8, nv: 4 }); G.box(0, 0, post / 2, 10, 10, post / 2, IC.oakD); G.lathe([[14, post], [12, post + 10], [4, post + 22], [0, post + 26]], IC.oakD, 8);
    G.tube([[8, 0, post - 30], [bx + w / 2 + 14, 0, post - 30]], 3.5, IC.iron, { S: 6 }); G.tube([[8, 0, post - 110], [60, 0, post - 80], [110, 0, post - 46], [140, 0, post - 32]], 2.6, IC.iron, { S: 5 });
    G.blob(bx + w / 2 + 18, 0, post - 30, 6, 6, 6, IC.iron, { nu: 6, nv: 4 });
    for (const s of [-1, 1]) { const x = bx + s * (w / 2 - 24); G.tube([[x, 0, post - 33], [x, 0, bz + h / 2 + 2]], 1.6, IC.iron, { S: 4 }); }
    G.box(bx, 0, bz, w / 2, 3, h / 2, IC.paint); G.box(bx, 0, bz, w / 2 + 5, 2.4, h / 2 + 5, IC.gold);
    // the four roads: a gold ring at the middle, an arrow out of it each way
    for (const s of [-1, 1]) { const y = s * 3.4, cz = bz - 18, k0 = G.n; G.lathe([[16, -0.6], [16, 0.6], [12, 0.6], [12, -0.6], [16, -0.6]], IC.gold, 16, [0, 0, 0], [1, 1], true); G.place(k0, { x: bx, y, z: cz, roll: 90 });
      for (const a of [0, 90, 180, 270]) { const b = G.n; G.box(25, 0, 0, 9.5, 0.6, 2.5, IC.gold); const k = G.n; for (const yy of [-0.6, 0.6]) for (const [x, z] of [[34, 8], [46, 0], [34, -8]]) G.v(x, yy, z, IC.gold); G.idx.push(k, k + 1, k + 2, k + 3, k + 5, k + 4); G.place(b, { x: bx, y, z: cz, pitch: a }); } }
  })];
}
// ---- the stable block: brick with stone dressings, a stall's split door in every bay (the lower leaf shut, the upper
// swung back), a hay-loft door under a gablet in the middle with its hoist beam; red tiles, a cupola with a vane.
// n stalls along X, its front -Y. ST: the measures
export const ST = { stall: 300, d: 440, e: 300, r: 560 };
export function stableBlock(n = 6, seed = 1) {
  n = Math.max(2, Math.round(n)); seed = N(seed);
  return ['instable|' + [n, seed % 2].join('|'), shape((G) => {
    const { stall, d, e, r } = ST, L = n * stall + 60, hl = L / 2, hd = d / 2, R = rng(seed * 7 + n), Bk = MB.brick, o = IC.oak;
    const doors = []; for (let i = 0; i < n; i++) doors.push(-hl + 30 + stall * (i + 0.5));
    courses(G, -hl, hl, -hd + 15, 30, 0, e, doors.map((x) => [x - 60, x + 60, 0, 220]), 22, 46, Bk, seed);
    courses(G, -hl, hl, hd - 15, 30, 0, e, [], 22, 46, Bk, seed + 1);
    for (const sx of [-1, 1]) coursesY(G, -hd + 30, hd - 30, sx * (hl - 15), 30, 0, e, [], 22, 46, Bk, seed + 2);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (let k = 0, z = 0; z < e - 4; k++, z += 44) G.box(sx * (hl - (k % 2 ? 22 : 36) + 2), sy * (hd - (k % 2 ? 36 : 22) + 2), z + 22, k % 2 ? 22 : 36, k % 2 ? 36 : 22, 21.5, MB.stone[k % 4]);
    G.box(0, 0, e + 4, hl + 6, hd + 6, 6, MB.stoneD);
    for (const [i, x] of doors.entries()) {
      G.box(x, -hd - 1, 226, 70, 4, 8, MB.stone[1]); for (const s of [-1, 1]) G.box(x + s * 64, -hd + 15, 110, 5, 16, 110, IC.oakD);
      G.box(x, -hd + 26, 110, 60, 3, 110, 0x1a1612);
      { const b = G.n; leaf(G, 118, 120, i % 2 ? IC.paint : IC.paintD); G.place(b, { x, y: -hd + 8, z: 2 }); }
      { const b = G.n; leaf(G, 118, 92, IC.paint); G.place(b, { x: x - 122, y: -hd - 4, z: 124 }); }
      G.box(x, -hd - 6, 124, 60, 6, 3, IC.oakD); for (const z of [140, 200]) G.box(x - 62, -hd - 3, z, 4, 3, 6, IC.iron);
      { const m = G.n; G.lathe([[5, -1], [5, 1], [3.5, 1], [3.5, -1], [5, -1]], IC.iron, 8, [0, 0, 0], [1, 1], true); G.place(m, { x: x + 40, y: -hd + 4.5, z: 90, roll: 90 }); } }
    // the roof, the gablet over the loft door with its hoist, the cupola and its vane
    { const s2 = (r - e) / hd, b = G.n; tileRoof(G, hl + 30, hd + 40, e - s2 * 40, r, seed); }
    { const gx = 0, gw = 120, ze = e + 10, zr = e + 150, b = G.n;
      G.box(gx, -hd + 6, e + 30, gw, 14, 30, Bk[0]); { const k = G.n, P = [[-gw, e + 60], [gw, e + 60], [gw, ze + 60], [0, zr], [-gw, ze + 60]]; for (const yy of [-hd - 8, -hd + 20]) for (const [x, z] of P) G.v(gx + x, yy, z, Bk[0]); G.idx.push(k, k + 1, k + 2, k, k + 2, k + 4, k + 2, k + 3, k + 4, k + 5, k + 7, k + 6, k + 5, k + 9, k + 7, k + 7, k + 9, k + 8); } G.box(gx, -hd - 2, e + 70, 46, 4, 56, IC.oakD); { const m = G.n; leaf(G, 84, 104, IC.paint); G.place(m, { x: gx - 44, y: -hd - 46, z: e + 18, yaw: 90 }); }
      for (const s of [-1, 1]) { const m = G.n; G.box(0, 0, 0, gw / Math.cos(Math.atan2(zr - ze - 60, gw)) / 2 + 12, 60, 4, pick(MB.tile, 1)); G.place(m, { x: gx + s * gw / 2, y: -hd + 20, z: (ze + 60 + zr) / 2 + 4, pitch: -s * deg(Math.atan2(zr - ze - 60, gw)) }); }
      G.tube([[gx, -hd + 10, zr - 20], [gx, -hd - 120, zr - 20]], 6, IC.oakD, { S: 5 }); G.tube([[gx, -hd - 110, zr - 26], [gx, -hd - 110, zr - 150]], 1.2, IC.iron, { S: 3 }); G.blob(gx, -hd - 110, zr - 152, 4, 4, 3, IC.iron, { nu: 6, nv: 3 }); }
    { const cz = r - 10; G.box(0, 0, cz + 50, 50, 50, 50, IC.lime); for (const [x, y] of [[0, -51], [0, 51], [-51, 0], [51, 0]]) for (let k = 0; k < 4; k++) G.box(x + (y ? (k - 1.5) * 18 : 0), y + (x ? (k - 1.5) * 18 : 0), cz + 52, y ? 6 : 1.5, x ? 6 : 1.5, 30, IC.oakD);
      { const b = G.n; G.lathe([[90, 0], [90, 6], [0, 70]], (k) => pick(MB.tile, k), 4, [0, 0, 0], [1, 1]); G.place(b, { yaw: 45, z: cz + 100 }); } G.tube([[0, 0, cz + 160], [0, 0, cz + 230]], 2, IC.iron, { S: 4 });
      G.box(0, 0, cz + 196, 26, 1.2, 1.2, IC.iron); G.box(0, 0, cz + 196, 1.2, 26, 1.2, IC.iron);
      const b = G.n; G.box(0, 0, 0, 34, 1, 12, IC.black); G.blob(20, 0, 8, 10, 1.5, 9, IC.black, { nu: 6, nv: 4 }); G.box(-30, 0, 4, 8, 1, 14, IC.black); G.place(b, { z: cz + 222, yaw: 30 }); }
  })];
}
// ---- the coach house: open-fronted bays under a tiled roof, oak posts on stone feet with curved braces to the beam,
// a brick back and ends; its front -Y. CH: the measures
export const CH = { bay: 440, d: 620, e: 400, r: 660 };
export function coachHouse(n = 2, seed = 1) {
  n = Math.max(1, Math.round(n)); seed = N(seed);
  return ['incoach|' + [n, seed % 2].join('|'), shape((G) => {
    const { bay, d, e, r } = CH, L = n * bay + 60, hl = L / 2, hd = d / 2, Bk = MB.brick;
    courses(G, -hl, hl, hd - 15, 30, 0, e, [], 22, 46, Bk, seed);
    for (const sx of [-1, 1]) coursesY(G, -hd + 10, hd - 30, sx * (hl - 15), 30, 0, e, [], 22, 46, Bk, seed + 1);
    for (let i = 0; i <= n; i++) { const x = -hl + 30 + i * bay; G.box(x, -hd + 14, 12, 22, 22, 12, MB.stone[i % 4]); G.box(x, -hd + 14, (e + 24) / 2, 14, 14, (e - 24) / 2, IC.oakD);
      for (const s of [-1, 1]) if ((s < 0 && i > 0) || (s > 0 && i < n)) G.tube([[x, -hd + 14, e - 120], [x + s * 40, -hd + 14, e - 40], [x + s * 110, -hd + 14, e - 18]], 7, IC.oakD, { S: 5 }); }
    G.box(0, -hd + 14, e - 4, hl, 16, 16, IC.oakD);
    for (let x = -hl + 60; x < hl - 30; x += 80) G.box(x, 0, e + 4, 6, hd, 6, IC.oak);
    { const s2 = (r - e) / hd; tileRoof(G, hl + 30, hd + 40, e - s2 * 40, r, seed); }
    for (const sx of [-1, 1]) { const b = G.n, P = [[-hd, e], [hd, e], [0, r - 4]]; for (const dx of [-15, 15]) for (const [y, z] of P) G.v(sx * (hl - 15) + dx, y, z, Bk[1]); G.idx.push(b, b + 1, b + 2, b + 3, b + 5, b + 4, b, b + 3, b + 4, b, b + 4, b + 1, b + 1, b + 4, b + 5, b + 1, b + 5, b + 2, b + 2, b + 5, b + 3, b + 2, b + 3, b); }
    G.box(0, 0, 1, hl - 30, hd - 30, 1, 0x6a5e4e);
    for (let i = 0; i < 6; i++) { const b = G.n; G.lathe([[8, 0], [8, 4], [0, 4]], IC.iron, 6); G.place(b, { x: -hl + 90 + i * 60, y: hd - 30, z: 200, roll: 90 }); G.tube([[-hl + 90 + i * 60, hd - 30, 204], [-hl + 90 + i * 60, hd - 40, 190], [-hl + 90 + i * 60, hd - 42, 150]], 2.2, IC.leather, { S: 4 }); }
  })];
}
// ---- the stagecoach: its body slung on leaf springs between the wheels (big behind, small before), the doors with
// their windows, the black upper panels, the roof rail, the driver's box on its boot at the front (+X), the rear boot,
// the lamps, the pole run out forward and down to the ground. Green, lined in cream, red wheels. wreck 1: rolled
// onto its side (its -Y side down) with those wheels broken off, nothing on the roof, the pole gone. CO: the measures
export const CO = { L: 330, W: 156, rr: 84, fr: 62, track: 108, rx: -112, fx: 122, z0: 118, z1: 272, wreck: [380, 250, 190] };
const coachWheel = (G, r, spokes = 12, col = IC.wheel) => {   // a wheel in the XZ plane round the origin, its axis along Y
  const b = G.n; G.lathe([[r, -5], [r, 5], [r - 9, 5], [r - 9, -5], [r, -5]], IC.black, 24, [0, 0, 0], [1, 1], true); G.lathe([[r - 9, -4], [r - 9, 4], [r - 15, 4], [r - 15, -4], [r - 9, -4]], col, 24, [0, 0, 0], [1, 1], true);
  G.lathe([[12, -14], [14, -6], [14, 6], [12, 14], [6, 16], [0, 16]], col, 10, [0, 0, 0]);
  for (let i = 0; i < spokes; i++) { const a = (i / spokes) * Math.PI * 2; G.tube([[Math.cos(a) * 12, Math.sin(a) * 12, 0], [Math.cos(a) * (r - 13), Math.sin(a) * (r - 13), 0]], 2.6, col, { S: 4, caps: 'flat' }); }
  G.place(b, { roll: 90 });
};
export function stagecoach(wreck = 0, seed = 1) {
  wreck = wreck ? 1 : 0; seed = N(seed);
  return ['incoach2|' + [wreck, seed % 2].join('|'), shape((G) => {
    const { W, rr, fr, track, rx, fx, z0, z1 } = CO, hw = W / 2, R = rng(seed * 41 + wreck), C = IC.coach, Cd = IC.coachD, Ln = IC.line, Bl = IC.black;
    // wheels and axles, springs, the perch
    for (const [x, r] of [[rx, rr], [fx, fr]]) { if (wreck) G.box(x, (hw - 4 - track - 8) / 2, r, 6, (hw - 4 + track + 8) / 2, 6, Bl); else G.box(x, 0, r, 6, track + 8, 6, Bl);
      for (const s of [-1, 1]) { if (wreck && s > 0) continue; const b = G.n; coachWheel(G, r); G.place(b, { x, y: s * track, z: r }); }
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const b = G.n; G.tube([[-46 + k * 6, 0, 0], [0, 0, -9 + k * 3.5], [46 - k * 6, 0, 0]], 2.2, Bl, { S: 4 }); G.place(b, { x, y: s * (hw - 20), z: r + 16 + k * 3 }); }
      for (const s of [-1, 1]) { G.box(x, s * (hw - 20), (r + 20 + z0 + 10) / 2, 4, 4, (z0 + 10 - r - 20) / 2 + 2, Bl); G.tube([[x, s * (hw - 20), z0 + 8], [Math.sign(x) * 88, s * (hw - 20), z0 + 8]], 3, IC.leather, { S: 4 }); } }
    G.box((rx + fx) / 2, 0, (rr + fr) / 2 + 6, (fx - rx) / 2, 7, 7, Cd);
    // the body: a box rounded under, its doors, windows, the line round its waist
    G.blob(0, 0, (z0 + 170) / 2, 104, hw, (170 - z0) / 2 + 6, C, { e: 5, nu: 16, nv: 6 });
    G.box(0, 0, (170 + z1) / 2, 100, hw, (z1 - 170) / 2, (nx, ny, nz) => (nz > 0.5 ? Bl : Bl));
    G.box(0, 0, 172, 102, hw + 1, 3, Ln);
    for (const s of [-1, 1]) { const y = s * (hw + 1.2);
      G.box(0, y, 140, 34, 0.6, 30, Cd); G.box(0, y, 140, 30, 0.8, 26, C); G.box(0, y, 216, 26, 0.8, 34, IC.glass); G.box(0, y, 216, 29, 0.6, 37, Cd);
      for (const x of [-72, 72]) { G.box(x, y, 222, 20, 0.8, 28, IC.glass); G.box(x, y, 222, 23, 0.6, 31, Cd); }
      G.box(22, y + s * 0.6, 178, 6, 1, 2, IC.brass); }
    for (const sx of [-1, 1]) { G.box(sx * 101, 0, 222, 0.8, 44, 26, IC.glass); G.box(sx * 100.6, 0, 222, 0.6, 48, 30, Cd); }
    // the roof and its rail; the luggage on it
    G.blob(0, 0, z1 + 2, 106, hw + 4, 9, Bl, { e: 8, nu: 12, nv: 4 });
    for (const s of [-1, 1]) { G.tube([[-96, s * (hw - 4), z1 + 26], [96, s * (hw - 4), z1 + 26]], 1.6, IC.brass, { S: 4 }); for (let x = -90; x <= 90; x += 45) G.tube([[x, s * (hw - 4), z1 + 8], [x, s * (hw - 4), z1 + 26]], 1.4, IC.brass, { S: 3 }); }
    if (!wreck) for (const [x, y, w, d, h, c] of [[-50, -20, 70, 46, 34, 0x6a3a2a], [30, 10, 60, 50, 28, 0x3e4a5a], [-48, 28, 46, 30, 22, 0x8a6a3a]]) { G.box(x, y, z1 + 10 + h / 2, w / 2, d / 2, h / 2, c); G.box(x, y, z1 + 10 + h / 2, 3, d / 2 + 1, h / 2 + 1, IC.leather); }
    // the driver's box: its boot, the seat with its cushion and back, the footboard; the rear boot; the lamps
    G.box(118, 0, 196, 22, hw - 10, 40, C); G.box(118, 0, 238, 24, hw - 6, 3, Ln);
    G.box(122, 0, 246, 20, hw - 14, 6, IC.cloth); G.box(102, 0, 268, 3, hw - 14, 20, Cd);
    { const b = G.n; G.box(0, 0, 0, 30, hw - 14, 2.5, Cd); G.place(b, { x: 164, z: 198, pitch: -24 }); } G.box(146, 0, 218, 8, hw - 16, 4, Cd);
    for (const s of [-1, 1]) G.tube([[140, s * (hw - 14), 234], [180, s * (hw - 14), 196], [190, s * (hw - 14), 186]], 2, Bl, { S: 4 });
    G.box(-122, 0, 194, 22, hw - 12, 36, C); G.box(-122, 0, 232, 24, hw - 8, 3, Ln);
    for (const s of [-1, 1]) { if (wreck && s > 0) continue; G.tube([[96, s * (hw - 2), 236], [112, s * (hw + 8), 240]], 1.6, Bl, { S: 4 }); G.lathe([[0, 0], [6, 2], [7, 18], [5, 22], [0, 26]], (k) => (k === 2 ? IC.ember : Bl), 6, [116, s * (hw + 10), 228]); }
    if (!wreck) { G.tube([[fx + 8, 0, fr - 4], [fx + 140, 0, 34], [fx + 260, 0, 6]], 4.5, IC.oakD, { S: 5 }); G.box(fx + 6, 0, fr + 6, 5, 70, 4, IC.oakD); for (const s of [-1, 1]) G.tube([[fx + 6, s * 66, fr + 6], [fx + 40, s * 70, fr - 10]], 2.4, IC.oakD, { S: 4 }); }
    if (wreck) G.place(0, { roll: -90, z: hw + 2 });
  })];
}
// ---- luggage: kind 0 a travelling trunk (a domed lid, leather straps, brass corners and lock, handles at its ends),
// 1 a hat box, 2 a carpet bag
export function luggage(kind = 0, seed = 1) {
  seed = N(seed);
  return ['inbag|' + [kind, seed % 3].join('|'), shape((G) => {
    const c = [0x6a3a2a, 0x3e4a5a, 0x5a5a3a][seed % 3];
    if (kind === 0) { G.box(0, 0, 18, 40, 24, 18, c); G.blob(0, 0, 36, 40, 24, 10, c, { e: 6, nu: 12, nv: 4, warp: (x, y, z) => [x, y, Math.max(0, z)] });
      for (const x of [-22, 22]) { G.box(x, 0, 20, 4, 24.6, 20.6, IC.leather); G.blob(x, 0, 36, 4.2, 24.8, 10.4, IC.leather, { e: 6, nu: 8, nv: 4, warp: (px, py, pz) => [px, py, Math.max(0, pz)] }); }
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) G.box(sx * 38, sy * 22.5, 18, 3, 2.5, 18, IC.brass);
      G.box(0, -24.6, 34, 5, 1, 5, IC.brass); for (const sx of [-1, 1]) G.tube([[sx * 40.5, -8, 26], [sx * 44, 0, 28], [sx * 40.5, 8, 26]], 1.6, IC.leather, { S: 4 }); }
    else if (kind === 1) { G.lathe([[20, 0], [20, 28], [0, 28]], 0xd8c8a8, 14); G.lathe([[21.5, 24], [21.5, 32], [0, 32]], 0x8a5a7a, 14); G.tube([[-14, 0, 32], [0, 0, 42], [14, 0, 32]], 1.4, IC.leather, { S: 4 }); }
    else { G.blob(0, 0, 18, 30, 15, 18, (nx, ny, nz) => (Math.abs(ny) > 0.6 ? 0x7a2e2a : 0x8a5a3a), { nu: 12, nv: 6, warp: (x, y, z) => [x, y * (1 - 0.3 * Math.max(0, z / 18)), Math.max(-18, z)] }); G.box(0, 0, 34, 24, 4, 2, IC.brass); G.tube([[-12, 0, 35], [0, 0, 48], [12, 0, 35]], 1.8, IC.leather, { S: 4 }); }
  })];
}
// ---- a cart wheel: rim, spokes, hub in the XZ plane, its axis along Y; lean (degrees) tips it back toward +Y (90: lying
// flat), its rim kept on the ground
export function cartWheel(r = 70, lean = 0, seed = 1) {
  r = q(r, 5); lean = Math.round(lean);
  return ['inwheel|' + [r, lean].join('|'), shape((G) => {
    const b = G.n; coachWheel(G, r, 10, 0x7a5a3a);
    const a = (lean * Math.PI) / 180, lift = Math.max(5 * Math.sin(a) + r * Math.cos(a), 16 * Math.sin(a) + 14 * Math.cos(a)); G.place(b, { z: lift, roll: -lean });
  })];
}
// ---- the wheelwright's tyring platform: a round iron plate set flush in a ring of stone, the hole at its middle; the
// fire-ring beside where the tyres are heated (cold ash); a wheel on the plate with its new iron tyre
export function tyringPlatform() {
  return ['intyre', shape((G) => {
    G.lathe([[150, 0], [150, 5], [118, 5], [118, 0]], (k) => pick(MB.stone, k), 24, [0, 0, 0], [1, 1], true);
    G.lathe([[118, 0], [118, 6], [16, 6], [16, 0]], IC.iron, 24, [0, 0, 0], [1, 1], true); G.lathe([[16, 0], [16, 2], [0, 2]], 0x14120f, 10);
    G.lathe([[260, 0], [260, 4], [180, 4], [180, 0]], 0x8a8478, 20, [330, 0, 0], [1, 1], true); G.lathe([[180, 0], [180, 3], [0, 3]], 0x4e4a44, 20, [330, 0, 0]);
    for (let i = 0; i < 6; i++) { const a = i * 1.1; G.tube([[330 + Math.cos(a) * 60, Math.sin(a) * 60, 4], [330 + Math.cos(a + 0.4) * 130, Math.sin(a + 0.4) * 130, 6]], 5, 0x2a2420, { S: 4 }); }
    { const b = G.n; coachWheel(G, 70, 10, 0x7a5a3a); G.place(b, { roll: 90, z: 11 }); }
  })];
}
// ---- the milestone: a stone with a rounded head, its face (-Y) cut and lettered (the map writes it)
export function milestone() {
  return ['inmile', shape((G) => {
    G.box(0, 0, 4, 40, 26, 4, MB.stoneD); G.box(0, 0, 47, 32, 18, 40, (nx, ny, nz) => (ny < -0.5 ? 0xd8d2c4 : MB.stone[0]));
    { const n = 12, k = G.n; for (let i = 0; i <= n; i++) { const a = (Math.PI * i) / n, x = 32 * Math.cos(a), z = 87 + 30 * Math.sin(a); G.v(x, -18, z, 0xd8d2c4); G.v(x, 18, z, MB.stone[0]); G.v(x, -18, z, MB.stone[1]); G.v(x, 18, z, MB.stone[1]); }
      const c0 = G.n; G.v(0, -18, 87, 0xd8d2c4); G.v(0, 18, 87, MB.stone[0]);
      for (let i = 0; i < n; i++) { const a = k + i * 4, b = a + 4; G.idx.push(c0, b, a, c0 + 1, a + 1, b + 1, a + 2, b + 2, b + 3, a + 2, b + 3, a + 3); } }
    G.box(0, -18.4, 62, 26, 0.6, 22, 0xe6e0d2);
  })];
}
// ---- the finger post at the crossroads: a white post, four arms (one to each road) at four heights, pointed, each
// lettered both sides (the map writes them); a ball on top. FP: the arms' [yaw, z] and their reach
export const FP = { arms: [[0, 300], [90, 278], [180, 256], [270, 234]], reach: 132, post: 330 };
export function fingerpost4() {
  return ['infinger', shape((G) => {
    G.box(0, 0, 3, 18, 18, 3, MB.stoneD); G.box(0, 0, FP.post / 2, 7, 7, FP.post / 2, 0xe8e4da); G.lathe([[9, FP.post], [9, FP.post + 3], [3, FP.post + 6], [8, FP.post + 12], [0, FP.post + 22]], 0x2a2a2e, 8);
    for (const [a, z] of FP.arms) { const b = G.n, L = FP.reach; G.box(L / 2 + 2, 0, 0, L / 2 - 6, 2.4, 11, 0xe8e4da); G.box(L / 2 + 2, 0, 0, L / 2 - 4, 1.8, 12.5, 0x2a2a2e);
      const k = G.n; for (const y of [-2.4, 2.4]) for (const [x, zz] of [[L - 4, 11], [L + 12, 0], [L - 4, -11]]) G.v(x, y, zz, 0xe8e4da); G.idx.push(k, k + 1, k + 2, k + 3, k + 5, k + 4, k, k + 3, k + 4, k, k + 4, k + 1, k + 1, k + 4, k + 5, k + 1, k + 5, k + 2);
      G.place(b, { yaw: a, z }); }
  })];
}
// ---- the mounting block: three stone steps up beside the road, worn in the middle; its steps rise toward +Y
export function mountingBlock() {
  return ['inmount', shape((G) => {
    for (let i = 0; i < 3; i++) { const z = 15 + i * 30, y = -40 + i * 40; G.box(0, (y + 60) / 2, z, 55 - i, (60 - y) / 2, 15, pick(MB.stone, i)); G.box(0, y + 2, z + 14.6, 40, 8, 0.6, 0xb8b0a0); }
  })];
}
// ---- the cellar flaps in the yard, burst: a stone frame, two oak flaps (one flung back past upright on its hinges,
// one split and hanging down into the dark), the drop below
export function cellarFlaps() {
  return ['inflaps', shape((G) => {
    for (const [x, y, w, d] of [[0, -82, 116, 12], [0, 82, 116, 12], [-104, 0, 12, 70], [104, 0, 12, 70]]) G.box(x, y, 3, w, d, 3, pick(MB.stone, x + y));
    G.box(0, 0, 0.6, 92, 70, 0.6, 0x0e0c0a);
    const flap = (x0, x1, col) => { for (let i = 0; i < 5; i++) G.box((x0 + x1) / 2, -56 + i * 28, 0, (x1 - x0) / 2 - 1, 13.4, 2.5, i % 2 ? col : mix(col, 0x000000, 0.12)); for (const xx of [x0 + 16, x1 - 16]) G.box(xx, 0, -4, 6, 64, 2, mix(col, 0x000000, 0.25)); };
    { const b = G.n; flap(0, 90, IC.oak); G.place(b, { pitch: -104 }); G.place(b, { x: -92, z: 6 }); }
    { const b = G.n; flap(-90, 0, IC.oakD); G.place(b, { pitch: -62 }); G.place(b, { x: 92, z: 6 }); }
    G.tube([[-92, -60, 6], [-92, 60, 6]], 2, IC.iron, { S: 4 }); G.tube([[92, -60, 6], [92, 60, 6]], 2, IC.iron, { S: 4 });
  })];
}
// ---- a hurdle: hazel woven between upright sails, len along X, 120 high, its sails pointed into the ground
export function hurdle(len = 240, seed = 1) {
  len = q(len, 20); seed = N(seed);
  return ['inhurdle|' + [len, seed % 2].join('|'), shape((G) => {
    const n = Math.max(4, Math.round(len / 28)), hl = len / 2, H = 120;
    for (let i = 0; i <= n; i++) { const x = -hl + (len * i) / n; G.tube([[x, 0, -6], [x, 0, H + 6]], 2.6, mix(IC.hazel, 0x000000, 0.15), { S: 4 }); }
    for (let k = 0; k < 11; k++) { const z = 10 + k * 10, P = []; for (let i = 0; i <= n * 2; i++) { const x = -hl + (len * i) / (n * 2); P.push([x, (i + k) % 2 ? 3.2 : -3.2, z]); } G.tube(P, 2.2, k % 3 ? IC.hazel : mix(IC.hazel, 0xffffff, 0.1), { S: 4, M: n * 4 }); }
  })];
}
// ---- a bale of straw tied with twine; a muck heap from the stables, straw through it
export function bale(seed = 1) {
  seed = N(seed);
  return ['inbale|' + (seed % 2), shape((G) => {
    G.blob(0, 0, 22, 46, 26, 22, (nx, ny, nz) => (nz > 0.3 ? IC.straw : MB.strawD), { e: 6, nu: 10, nv: 5, warp: (x, y, z) => [x, y, Math.max(-22, z)] });
    for (const x of [-20, 20]) G.box(x, 0, 22, 1, 26.6, 22.6, 0x8a6a3a);
    for (let i = 0; i < 6; i++) G.tube([[-30 + i * 12, -20, 38], [-26 + i * 12, -28, 46]], 1, IC.straw, { S: 3 });
  })];
}
export function muckHeap(r = 130, seed = 1) {
  r = q(r, 10); seed = N(seed);
  return ['inmuck|' + [r, seed % 2].join('|'), shape((G) => {
    const R = rng(seed * 5 + r);
    G.blob(0, 0, 0, r, r * 0.8, r * 0.45, (nx, ny, nz) => (wob(nx * 3 + seed, ny * 3) > 0.3 ? 0x5a4630 : 0x4a3a28), { nu: 14, nv: 7, warp: (x, y, z) => [x * (1 + 0.1 * wob(y * 0.03, z * 0.04)), y, Math.max(0, z)] });
    for (let i = 0; i < 14; i++) { const a = R() * 6.28, d = R() * r * 0.7, x = Math.cos(a) * d, y = Math.sin(a) * d * 0.8, z = r * 0.45 * Math.sqrt(Math.max(0, 1 - (d / r) ** 2)) - 4; G.tube([[x, y, z], [x + (R() - 0.5) * 30, y + (R() - 0.5) * 30, z + 6 + R() * 6]], 1.2, IC.straw, { S: 3 }); }
  })];
}
// ---- the skittle alley: a long open-sided shed on oak posts, red tiles; the alley's boards down its middle, the nine
// pins in their diamond on the frame at the far end (+X) with the backboard behind, the balls in their rack at the
// near end, the score on a slate. SK: its width, its eaves and ridge
export const SK = { w: 280, e: 230, r: 340 };
export function skittleAlley(len = 1600) {
  len = q(len, 100);
  return ['inskittle|' + len, shape((G) => {
    const { w, e, r } = SK, hl = len / 2, hw = w / 2, n = Math.round(len / 320);
    for (let i = 0; i <= n; i++) { const x = -hl + (len * i) / n; for (const sy of [-1, 1]) { G.box(x, sy * (hw - 10), 8, 14, 14, 8, MB.stoneD); G.box(x, sy * (hw - 10), (e + 16) / 2, 9, 9, (e - 16) / 2, IC.oakD); } }
    for (const sy of [-1, 1]) G.box(0, sy * (hw - 10), e + 4, hl + 12, 10, 8, IC.oakD);
    for (let i = 0; i <= n * 2; i++) G.box(-hl + (len * i) / (n * 2), 0, e + 14, 5, hw, 5, IC.oak);
    { const s2 = (r - e) / hw; tileRoof(G, hl + 30, hw + 30, e - s2 * 30, r); }
    G.box(0, 0, 3, hl - 20, 50, 3, 0x8a6a46); for (let x = -hl + 40; x < hl - 20; x += 40) G.box(x, 0, 6.1, 0.5, 50, 0.2, 0x5e4630);
    for (const sy of [-1, 1]) G.box(0, sy * 54, 8, hl - 20, 4, 8, IC.oakD);
    const fx = hl - 120; G.box(fx, 0, 4, 70, 70, 4, IC.oakL);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const x = fx + (i + j) * 30, y = (i - j) * 30; G.lathe([[0, 0], [6, 0], [7, 6], [9, 16], [6, 26], [4, 30], [5, 33], [0, 36]], 0xd8c8a0, 8, [x, y, 8]); }
    G.box(hl - 16, 0, 60, 6, hw - 20, 60, IC.oakD); { const b = G.n; G.box(0, 0, 0, 3, hw - 26, 50, IC.oak); G.place(b, { x: hl - 34, z: 58, pitch: -18 }); }
    G.box(-hl + 40, 80, 30, 30, 20, 3, IC.oakD); for (const sx of [-1, 1]) G.box(-hl + 40 + sx * 26, 80, 14, 3, 18, 14, IC.oakD);
    for (const dx of [-16, 0, 16]) G.blob(-hl + 40 + dx, 80, 41, 8, 8, 8, 0x5a3a24, { nu: 8, nv: 6 });
    G.box(-hl + len / n, hw - 22, 150, 40, 3, 30, IC.chalk); G.box(-hl + len / n, hw - 20, 150, 44, 2, 34, IC.oak);
  })];
}
// ---- the tollhouse: a little stone house whose front (-Y) is three-sided, a window in each side so the keeper sees
// both ways along the road and the door in the middle; slate roof, a chimney; the board of tolls over the door (the
// map writes it). TH: the measures
export const TH = { w: 460, d: 340, bay: 140, e: 300, r: 520, board: [0, -170, 330] };
export function tollhouse(seed = 1) {
  seed = N(seed);
  return ['intoll|' + (seed % 2), shape((G) => {
    const { w, d, bay, e, r } = TH, hw = w / 2, St = MB.stone, sl = [0x5a6068, 0x4e545c, 0x646a72];
    // the back part: a box of coursed stone, d deep behind the line y = 0; the front: three faces
    courses(G, -hw, hw, d - 20, 40, 0, e, [[-80, 80, 110, 260]], 34, 70, St, seed);
    for (const sx of [-1, 1]) coursesY(G, 0, d - 40, sx * (hw - 20), 40, 0, e, [[100, 240, 110, 250]], 34, 70, St, seed + 1);
    const fw = w - 2 * bay, P = [[-hw, 0], [-fw / 2, -bay], [fw / 2, -bay], [hw, 0]];
    for (let i = 0; i < 3; i++) { const [x0, y0] = P[i], [x1, y1] = P[i + 1], L = Math.hypot(x1 - x0, y1 - y0), yw = deg(Math.atan2(y1 - y0, x1 - x0)), b = G.n;
      courses(G, -L / 2, L / 2, 0, 40, 0, e, i === 1 ? [[-60, 60, 0, 240]] : [[-50, 50, 110, 250]], 34, 70, St, seed + 2 + i);
      G.place(b, { x: (x0 + x1) / 2, y: (y0 + y1) / 2 + (i === 1 ? 20 : 14), yaw: yw });
      const m = G.n; if (i === 1) { leaf(G, 120, 236, IC.paintD); G.place(m, { x: (x0 + x1) / 2, y: -bay + 20, z: 2 }); } else { casement(G, 92, 132, 2); G.place(m, { x: (x0 + x1) / 2 + (i === 0 ? 8 : -8), y: (y0 + y1) / 2 + 2, z: 114, yaw: yw }); } }
    for (const [x, y, yw] of [[0, d - 6, 180]]) { const m = G.n; casement(G, 152, 142, 2); G.place(m, { x, y, z: 114, yaw: yw }); }
    for (const sx of [-1, 1]) { const m = G.n; casement(G, 132, 132, 2); G.place(m, { x: sx * (hw - 8), y: 170, z: 114, yaw: sx * 90 }); }
    G.box(0, d / 2 - 20, e + 6, hw + 10, d / 2 + 20, 6, MB.stoneD);
    { const b = G.n; G.box(0, 0, e + 6, fw / 2 + 4, bay / 2 + 6, 6, MB.stoneD); G.place(b, { y: -bay / 2 }); }
    { const s2 = (r - e) / (d / 2), b = G.n; tileRoof(G, hw + 30, d / 2 + 40, e - s2 * 40, r, seed, sl); G.place(b, { y: d / 2 - 20 }); }
    for (const sx of [-1, 1]) { const b = G.n, Q = [[-20, e], [d - 20, e], [d / 2 - 20, r - 4]]; for (const dx of [-20, 20]) for (const [y, z] of Q) G.v(sx * (hw - 20) + dx, y, z, St[1]); G.idx.push(b, b + 1, b + 2, b + 3, b + 5, b + 4, b, b + 3, b + 4, b, b + 4, b + 1, b + 1, b + 4, b + 5, b + 1, b + 5, b + 2, b + 2, b + 5, b + 3, b + 2, b + 3, b); }
    { const k = G.n, ze = e + 12, top = [[-hw - 20, -10, e + 40], [hw + 20, -10, e + 40]], low = [[-hw - 26, 0, ze], [-fw / 2 - 12, -bay - 12, ze], [fw / 2 + 12, -bay - 12, ze], [hw + 26, 0, ze]];
      for (const [x, y, z] of low) G.v(x, y, z, sl[1]); for (const [x, y, z] of top) G.v(x, y, z, sl[0]); G.v(0, -10, e + 120, sl[2]);
      G.idx.push(k, k + 1, k + 4, k + 1, k + 6, k + 4, k + 1, k + 2, k + 6, k + 2, k + 5, k + 6, k + 2, k + 3, k + 5); }
    for (let k = 0, z = e - 20; z < r + 140; k++, z += 34) G.box(-hw + 90, d - 60, z + 17, 40, 40, 16.6, pick(St, k)); G.box(-hw + 90, d - 60, r + 160, 46, 46, 5, MB.stoneD);
    G.lathe([[13, 0], [12, 34], [15, 38], [15, 44], [10, 46]], MB.brick[1], 10, [-hw + 90, d - 60, r + 165]);
    G.box(TH.board[0], -bay - 2, TH.board[2], 80, 2, 34, 0xeae6dc); G.box(TH.board[0], -bay - 1, TH.board[2], 84, 1.5, 38, 0x2a2a2e);
  })];
}
