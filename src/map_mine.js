// BLACKWATER MINE. The second map: a silver mine with the night shift still in it.
// Five districts round the lift: a long landing hall (start), timbered room-and-pillar galleries to the west (tight),
// a flooded cavern across the north (open), a ring of tunnels round a crystal geode to the east, and the works -
// boilers, crusher and rail yard - across the south. Tunnels are five metres wide or more so the big things fit.
import { V, V2, R, LC, FMath } from './mapkit.js';

const ROCK = [0x4b4641, 0x3b3634, 0x5b534b], TEAL = [0x36484e, 0x2c3e43, 0x435b60], VIOLET = [0x4b4158, 0x393146, 0x5d506d], RUST = [0x534339, 0x423428, 0x655346];
const TIMBER = 0x6a4a2e, TIMBER_D = 0x4a3220, IRON = 0x33363c, STEEL = 0x5a5e66, BRICK = 0x6a3a2a, LAMP = 0xFFB45A;
const rr = (a, b) => FMath.FRandRange(a, b), ri = (a, b) => FMath.RandRange(a, b);

export function buildMine(M) {
  const { Box, BoxRot, Glow, Cyl, Ball, ConeShape, Ramp, Floor, Wall, Lamp, Sign, Barrel, Crate, Station, WallBuy, Door, SpawnAt, Pyramid, Oct, Ring, AddZone, GM } = M;
  GM.navInit(-7800, -8800, 7800, 8800, 100);
  const H = 1200;   // every wall goes to the roof; each district hangs its own ceiling lower down

  // ------------------------------------------------------------------ shared pieces
  // where the rock facing must leave the wall bare: doorways, and anything hung on a wall
  const DOORS = [[-1500, 0, false], [1500, 0, false], [0, 3500, true], [0, -3500, true], [-4500, 3500, true], [4500, 3500, true], [-4500, -3500, true], [4500, -3500, true]];
  const CLEAR = DOORS.map(([x, y]) => [x, y, 400]).concat([[-1440, -900], [1440, 1600], [-1440, 1500], [1440, -1500], [-3675, -300], [-5325, -1250], [-2600, 3560], [6400, 5500], [6400, 0], [4650, 1400], [-2600, -7400], [6400, -5300]].map(([x, y]) => [x, y, 240]));
  // a face of rough rock: slabs of uneven depth and height standing off a flat wall, so no wall reads as a box
  const face = (x0, y0, x1, y1, nx, ny, h, cols) => {
    const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(len / 240)), alongX = Math.abs(x1 - x0) > Math.abs(y1 - y0);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5 + rr(-0.25, 0.25)) / n, w = len / n * rr(0.75, 1.2), d = rr(26, 64), hh = h * [1, 0.72, 0.5, 0.86][(i + ri(0, 1)) % 4] * rr(0.85, 1);
      const x = x0 + (x1 - x0) * t + nx * d * 0.5, y = y0 + (y1 - y0) * t + ny * d * 0.5;
      if (CLEAR.some(([cx, cy, r]) => Math.hypot(cx - x, cy - y) < r)) continue;
      Box(V(x, y, hh * 0.5), alongX ? V(w, d, hh) : V(d, w, hh), cols[(i + ri(0, 2)) % 3], true, false, rr(-5, 5));
      if (i % 3 === 0) Pyramid(V(x + nx * (d * 0.5 + 30), y + ny * (d * 0.5 + 30), 28), V(rr(70, 120), rr(70, 120), 56), cols[(i + 1) % 3], R(0, rr(0, 90), 0));   // scree at its foot
    }
  };
  // a solid mass of rock from floor to roof (a pillar left standing between tunnels)
  const mass = (x0, y0, x1, y1, h, cols) => {
    Box(V((x0 + x1) / 2, (y0 + y1) / 2, h / 2), V(x1 - x0, y1 - y0, h), cols[0], true, true);
    face(x0, y0, x1, y0, 0, -1, h, cols); face(x0, y1, x1, y1, 0, 1, h, cols); face(x0, y0, x0, y1, -1, 0, h, cols); face(x1, y0, x1, y1, 1, 0, h, cols);
  };
  const lantern = (x, y, z, col = LAMP, rad = 900) => {
    Box(V(x, y, z + 26), V(4, 4, 40), IRON, false, false); Box(V(x, y, z), V(22, 22, 8), IRON, false, false); Box(V(x, y, z - 34), V(22, 22, 6), IRON, false, false);
    Glow(V(x, y, z - 16), V(16, 16, 28), col); Lamp(V(x, y, z - 16), LC(((col >> 16) & 255) / 255, ((col >> 8) & 255) / 255, (col & 255) / 255), 10, rad, false);
  };
  // a timber set: two posts and a cap across a tunnel, with wedges, and a lamp hung from one in three
  const timber = (x, y, span, alongX, h = 520, lamp = false) => {
    const a = alongX ? [1, 0] : [0, 1], hw = span / 2 - 24;
    for (const s of [-1, 1]) {
      Box(V(x + a[0] * s * hw, y + a[1] * s * hw, h / 2), V(34, 34, h), TIMBER, true, false);
      BoxRot(V(x + a[0] * s * (hw - 60), y + a[1] * s * (hw - 60), h - 70), alongX ? V(170, 22, 22) : V(22, 170, 22), TIMBER_D, alongX ? R(s * 45, 0, 0) : R(0, 0, -s * 45), false);
    }
    Box(V(x, y, h + 18), alongX ? V(span + 30, 40, 36) : V(40, span + 30, 36), TIMBER_D, false, false);
    if (lamp) lantern(x, y, h - 40);
  };
  const rails = (x0, y0, x1, y1) => {
    const alongX = Math.abs(x1 - x0) > Math.abs(y1 - y0), len = Math.hypot(x1 - x0, y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    for (const s of [-1, 1]) Box(V(cx + (alongX ? 0 : s * 70), cy + (alongX ? s * 70 : 0), 9), alongX ? V(len, 8, 8) : V(8, len, 8), STEEL, false, false);
    for (let d = 40; d < len; d += 90) { const t = d / len; Box(V(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 4), alongX ? V(26, 210, 7) : V(210, 26, 7), 0x3a2a1c, false, false); }
  };
  const cart = (x, y, yaw, load) => {
    const L = (dx, dy, z) => M.L(V(x, y, 0), yaw, dx, dy, z);
    Box(L(0, 0, 62), V(190, 120, 16), IRON, true, true, yaw);
    for (const s of [-1, 1]) { Box(L(0, s * 58, 104), V(190, 10, 84), 0x4a3a30, true, false, yaw); Box(L(s * 92, 0, 104), V(10, 120, 84), 0x4a3a30, true, false, yaw); Box(L(0, s * 62, 146), V(200, 8, 8), IRON, false, false, yaw); }
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) Cyl(L(sx * 60, sy * 70, 30), 56, 14, STEEL, false, false, R(0, yaw, 90));
    if (load === 1) for (let i = 0; i < 5; i++) Pyramid(L(rr(-60, 60), rr(-30, 30), 160 + rr(0, 20)), V(rr(50, 80), rr(50, 80), rr(40, 70)), ROCK[i % 3], R(0, rr(0, 90), 0));
    if (load === 2) for (let i = 0; i < 4; i++) Glow(L(rr(-55, 55), rr(-28, 28), 170 + rr(0, 20)), V(rr(24, 40), rr(24, 40), rr(60, 110)), i % 2 ? 0x1c8ccc : 0x6a38d8, 6, R(rr(-18, 18), rr(0, 90), rr(-18, 18)));
  };
  // a cluster of crystals: a few tall glowing spikes on a dark root
  const crystals = (x, y, s, cols, solid = true) => {
    Oct(V(x, y, 26 * s), V(150 * s, 150 * s, 52 * s), 0x2a2434, solid, solid);
    const n = 5 + ri(0, 2);
    for (let i = 0; i < n; i++) {
      const a = i / n * 6.283 + rr(-0.3, 0.3), r = i === 0 ? 0 : rr(30, 62) * s, h = (i === 0 ? rr(300, 380) : rr(120, 250)) * s, w = (i === 0 ? 62 : rr(30, 48)) * s;
      Glow(V(x + Math.cos(a) * r, y + Math.sin(a) * r, 40 * s + h * 0.42), V(w, w, h), cols[i % cols.length], 6, R(i === 0 ? 0 : Math.cos(a) * 20, 0, i === 0 ? 0 : Math.sin(a) * 20));
    }
    Lamp(V(x, y, 160 * s), LC(((cols[0] >> 16) & 255) / 255, ((cols[0] >> 8) & 255) / 255, (cols[0] & 255) / 255), 10, 760 * s, false);
  };
  const stalagmite = (x, y, h, col, solid = true) => { ConeShape(V(x, y, h / 2), V(h * 0.42, h * 0.42, h), col, false); if (solid) Cyl(V(x, y, h * 0.3), h * 0.26, h * 0.6, col, true, true); Cyl(V(x, y, 8), h * 0.5, 16, col, false, false); };
  const stalactites = (x0, y0, x1, y1, z, n, col) => { for (let i = 0; i < n; i++) { const l = rr(90, 300); ConeShape(V(rr(x0, x1), rr(y0, y1), z - l / 2), V(l * 0.3, l * 0.3, l), col, false, R(180, 0, 0)); } };
  const ceiling = (x0, y0, x1, y1, z, col) => Box(V((x0 + x1) / 2, (y0 + y1) / 2, z + 40), V(x1 - x0, y1 - y0, 80), col, false, false);
  const fungus = (x, y, col = 0x1fa878) => { for (let i = 0; i < 5; i++) { const px = x + rr(-60, 60), py = y + rr(-60, 60), h = rr(18, 46); Box(V(px, py, h / 2), V(5, 5, h), 0xd8e8dc, false, false); Glow(V(px, py, h + 6), V(rr(22, 40), rr(22, 40), 12), col, 3); } Lamp(V(x, y, 30), LC(((col >> 16) & 255) / 255, ((col >> 8) & 255) / 255, (col & 255) / 255), 6, 420, false); };
  const heap = (x, y, s, cols) => { for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283, r = i === 0 ? 0 : rr(60, 120) * s; Pyramid(V(x + Math.cos(a) * r, y + Math.sin(a) * r, (i === 0 ? 90 : rr(36, 60)) * s), V((i === 0 ? 260 : rr(120, 190)) * s, (i === 0 ? 260 : rr(120, 190)) * s, (i === 0 ? 180 : rr(72, 120)) * s), cols[i % 3], R(0, rr(0, 90), 0), false); } Cyl(V(x, y, 45 * s), 190 * s, 90 * s, cols[1], true, true); };

  // ------------------------------------------------------------------ zones
  const Z0 = AddZone('The Lift Landing', V2(-1500, -3500), V2(1500, 3500));
  const Z1 = AddZone('The Galleries', V2(-6500, -3500), V2(-1500, 3500));
  const Z2 = AddZone('The Drowned Cavern', V2(-6500, 3500), V2(6500, 7500));
  const Z3 = AddZone('The Crystal Seam', V2(1500, -3500), V2(6500, 3500));
  const Z4 = AddZone('The Works', V2(-6500, -7500), V2(6500, -3500));
  M.Districts([['The Lift Landing', [Z0]], ['The Galleries', [Z1]], ['The Drowned Cavern', [Z2]], ['The Crystal Seam', [Z3]], ['The Works', [Z4]]]);

  // ------------------------------------------------------------------ ground, bounds, roofs
  Box(V(0, 0, -50), V(15600, 17600, 100), 0x4a433e, true, false);
  Floor(V2(-1500, -3500), V2(1500, 3500), 1, 0x4a433e);
  Floor(V2(-6500, -3500), V2(-1500, 3500), 1, 0x3d3734);
  Floor(V2(-6500, 3500), V2(6500, 7500), 1, 0x313e3d);
  Floor(V2(1500, -3500), V2(6500, 3500), 1, 0x3b3646);
  Floor(V2(-6500, -7500), V2(6500, -3500), 1, 0x473b34);
  const cap = 0x24201e;
  Wall(V2(-6500, -7500), V2(-6500, 7500), H, 200, ROCK[1], [], true, cap); Wall(V2(6500, -7500), V2(6500, 7500), H, 200, ROCK[1], [], true, cap);
  Wall(V2(-6500, -7500), V2(6500, -7500), H, 200, ROCK[1], [], true, cap); Wall(V2(-6500, 7500), V2(6500, 7500), H, 200, ROCK[1], [], true, cap);
  Wall(V2(-1500, -3500), V2(-1500, 3500), H, 120, ROCK[0], [V2(3300, 3700)], true, cap, TIMBER_D);
  Wall(V2(1500, -3500), V2(1500, 3500), H, 120, ROCK[0], [V2(3300, 3700)], true, cap, TIMBER_D);
  Wall(V2(-6500, 3500), V2(6500, 3500), H, 120, ROCK[0], [V2(1800, 2200), V2(6300, 6700), V2(10800, 11200)], true, cap, TIMBER_D);
  Wall(V2(-6500, -3500), V2(6500, -3500), H, 120, ROCK[0], [V2(1800, 2200), V2(6300, 6700), V2(10800, 11200)], true, cap, TIMBER_D);
  ceiling(-1600, -3600, 1600, 3600, 900, 0x1c1917); ceiling(-6600, -3600, -1400, 3600, 760, 0x191715);
  ceiling(-6600, 3400, 6600, 7600, 1180, 0x131a1c); ceiling(1400, -3600, 6600, 3600, 1100, 0x17141d); ceiling(-6600, -7600, 6600, -3400, 900, 0x1c1613);
  // the outer walls, faced in rough rock (inside faces only)
  face(-6400, -7400, -6400, -3560, 1, 0, 900, RUST); face(-6400, -3440, -6400, 3440, 1, 0, 700, ROCK); face(-6400, 3560, -6400, 7400, 1, 0, 1100, TEAL);
  face(6400, -7400, 6400, -3560, -1, 0, 900, RUST); face(6400, -3440, 6400, 3440, -1, 0, 1100, VIOLET); face(6400, 3560, 6400, 7400, -1, 0, 1100, TEAL);
  face(-6400, -7400, 6400, -7400, 0, 1, 900, RUST); face(-6400, 7400, 6400, 7400, 0, -1, 1100, TEAL);
  // every doorway is a heavy timber set
  for (const [x, y, ax] of DOORS) {
    for (const s of [-1, 1]) Box(V(x + (ax ? s * 232 : 0), y + (ax ? 0 : s * 232), 280), ax ? V(56, 170, 560) : V(170, 56, 560), TIMBER, true, false);
    Box(V(x, y, 590), ax ? V(560, 180, 60) : V(180, 560, 60), TIMBER_D, true, false);
    Box(V(x, y, 912), ax ? V(400, 120, 584) : V(120, 400, 584), ROCK[0], true, false);   // rock over the lintel, up to the roof
  }
  face(-6400, 3560, 6400, 3560, 0, 1, 1100, TEAL); face(-1440, 3440, 1440, 3440, 0, -1, 900, ROCK); face(-1440, -3440, 1440, -3440, 0, 1, 900, ROCK);
  const wallbuy = (name, x, y, yaw) => { const n = [Math.cos(yaw * Math.PI / 180), Math.sin(yaw * Math.PI / 180)]; Box(V(x - n[0] * 4, y - n[1] * 4, 150), Math.abs(n[0]) > 0.5 ? V(12, 300, 230) : V(300, 12, 230), TIMBER_D, false, false); WallBuy(name, V(x, y, 0), yaw); };

  // ------------------------------------------------------------------ 0. THE LIFT LANDING
  {
    // the shaft: a timber headframe round the cage, its cable going up into the dark
    for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { Box(V(sx * 230, sy * 230, 450), V(44, 44, 900), TIMBER, true, true); BoxRot(V(sx * 230, sy * 120, 640), V(26, 300, 26), TIMBER_D, R(0, 0, sy * 38), false); BoxRot(V(sx * 120, sy * 230, 420), V(300, 26, 26), TIMBER_D, R(sx * 38, 0, 0), false); }
    for (const z of [300, 560, 820]) { for (const s of [-1, 1]) { Box(V(0, s * 230, z), V(500, 30, 30), TIMBER_D, false, false); Box(V(s * 230, 0, z), V(30, 500, 30), TIMBER_D, false, false); } }
    Box(V(0, 0, 14), V(420, 420, 28), 0x23201e, true, false); Box(V(0, 0, 30), V(340, 340, 6), IRON, false, false);                        // the collar of the shaft and the cage floor
    for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) Box(V(sx * 150, sy * 150, 190), V(14, 14, 320), IRON, true, false);
    Box(V(0, 0, 352), V(330, 330, 12), IRON, true, false); for (const s of [-1, 1]) { Box(V(s * 150, 0, 120), V(8, 300, 8), STEEL, false, false); Box(V(s * 150, 0, 220), V(8, 300, 8), STEEL, false, false); Box(V(0, 150, 120 + (s + 1) * 50), V(300, 8, 8), STEEL, false, false); }
    Box(V(0, 0, 640), V(10, 10, 560), 0x1e1e22, false, false); Ring(V(0, 0, 860), V(230, 30, 230), IRON, R(0, 90, 0)); Box(V(0, 0, 860), V(30, 300, 30), TIMBER_D, false, false);
    lantern(0, 0, 330, 0xFFD27A, 1100); Glow(V(0, -168, 300), V(120, 6, 40), 0xFFB45A);
    Box(V(0, -236, 680), V(620, 12, 170), TIMBER_D, false, false); Sign(V(0, -244, 705), -90, 'BLACKWATER MINING CO.', { r: 0.92, g: 0.82, b: 0.6 }, 50); Sign(V(0, -244, 640), -90, 'LEVEL 9  -  NIGHT SHIFT', { r: 0.9, g: 0.55, b: 0.3 }, 32);
    // four pillars left standing make the hall a loop at each end
    mass(-1050, 1650, -550, 2250, 900, ROCK); mass(550, 1650, 1050, 2250, 900, ROCK); mass(-1050, -2250, -550, -1650, 900, ROCK); mass(550, -2250, 1050, -1650, 900, ROCK);
    face(-1440, -3440, -1440, -260, 1, 0, 900, ROCK); face(-1440, 260, -1440, 3440, 1, 0, 900, ROCK); face(1440, -3440, 1440, -260, -1, 0, 900, ROCK); face(1440, 260, 1440, 3440, -1, 0, 900, ROCK);
    // the haulage way: rails from the works in the south, past the shaft, north to the cavern
    rails(0, -3440, 0, -300); rails(0, 300, 0, 3440); cart(0, 2750, 90, 1); cart(0, 2520, 90, 1); cart(0, -2700, 90, 2);
    for (const y of [-3000, -2400, -1300, 1300, 2400, 3000]) timber(0, y, 620, true, 540, y === -2400 || y === 2400 || Math.abs(y) === 1300);
    for (const [x, y] of [[-1380, -900], [1380, 900], [-1380, 1100], [1380, -1100], [-1380, 2900], [1380, -2900]]) lantern(x - Math.sign(x) * 40, y, 420);
    // the lamp room: benches, lockers and whatever they left on them
    for (let i = 0; i < 4; i++) { Box(V(-1330, -620 + i * 96, 110), V(70, 86, 220), 0x4a5a5e, true, true); Box(V(-1292, -620 + i * 96, 150), V(6, 60, 90), 0x2e3a3e, false, false); }
    Box(V(1260, 560, 46), V(150, 420, 14), TIMBER, true, true); for (const s of [-1, 1]) Box(V(1260, 560 + s * 180, 20), V(120, 20, 40), TIMBER_D, false, false);
    for (let i = 0; i < 3; i++) { Box(V(1250, 440 + i * 110, 62), V(26, 26, 18), IRON, false, false); Glow(V(1250, 440 + i * 110, 78), V(12, 12, 16), LAMP); }
    Crate(V(-1250, 700, 0), 110); Crate(V(-1240, 840, 0), 90); Barrel(V(-1260, 560, 0), 0x5a4a3a); Barrel(V(1250, -560, 0), 0x6a3a2a); Crate(V(1240, -720, 0), 120);
    Sign(V(-1436, -900, 420), 0, 'LAMP ROOM', { r: 0.9, g: 0.8, b: 0.55 }, 40); Sign(V(1436, 1600, 430), 180, 'NO NAKED FLAME', { r: 0.9, g: 0.35, b: 0.25 }, 40);
    Station('HighRoller', V(-640, -420, 0), 0, 2500, -1, 'Workbench');
    Station('AmmoCrate', V(640, -420, 0), 180, 250, -1, 'Ammo');
    wallbuy('Saloon Six', -1436, 1500, 0); wallbuy("Hornet's Nest", 1436, -1500, 180);
    for (const [x, y] of [[-1150, 3150], [1150, 3150], [-1150, -3150], [1150, -3150], [-1200, 900], [1200, -900]]) SpawnAt(V(x, y, 0), Z0);
    M.Spawn(V(0, -900, 100));
    M.Decor(V2(-1400, -3400), V2(1400, 3400), 46, ['D_Crack', 'D_Grime', 'D_Grime', 'P_Bones', 'D_Crack']);
  }

  // ------------------------------------------------------------------ 1. THE GALLERIES (room and pillar, close timbered tunnels)
  {
    const XS = [[-5850, -4800], [-4200, -3150], [-2550, -2100]], YS = [[-2900, -1800], [-1250, -300], [300, 1250], [1800, 2900]];
    const open = new Set(['1,2', '0,0']);   // two pillars were robbed out: the stable, and the powder store
    XS.forEach(([x0, x1], i) => YS.forEach(([y0, y1], j) => { if (!open.has(i + ',' + j)) mass(x0, y0, x1, y1, 700, ROCK); }));
    face(-1560, -3440, -1560, -260, -1, 0, 700, ROCK); face(-1560, 260, -1560, 3440, -1, 0, 700, ROCK); face(-6400, -3440, -1560, -3440, 0, 1, 700, ROCK); face(-6400, 3440, -1560, 3440, 0, -1, 700, ROCK);
    // timber sets at every crossing, lamps at some
    const TX = [-6125, -4500, -2850, -1830], TY = [-3170, -1525, 0, 1525, 3170];
    TX.forEach((x, i) => TY.forEach((y, j) => { if ((i + j) % 2 === 0) timber(x, y + (j === 4 ? -330 : 330), 540, true, 520, (i * 3 + j) % 3 === 0); else timber(x + (i === 3 ? -330 : 330), y, 540, false, 520, (i + j * 2) % 4 === 1); }));
    rails(-6300, 0, -1560, 0); cart(-3600, 0, 0, 1); cart(-5400, 0, 0, 0);
    // the stable: stalls, a trough, hay
    { const cx = -3675, cy = 775;
      for (const s of [-1, 1]) { Box(V(cx + s * 260, cy + 330, 70), V(14, 280, 140), TIMBER, true, true); Box(V(cx + s * 260, cy + 330, 150), V(20, 290, 14), TIMBER_D, false, false); }
      Box(V(cx, cy + 440, 170), V(540, 30, 340), TIMBER_D, true, true); Box(V(cx, cy - 360, 36), V(360, 90, 72), 0x4a3a30, true, true); Floor(V2(cx - 170, cy - 395), V2(cx + 170, cy - 325), 73, 0x1f4a52);
      for (const [dx, dy] of [[-360, 60], [-300, -120], [340, -60]]) { Box(V(cx + dx, cy + dy, 40), V(130, 90, 80), 0xb89a4a, true, true, rr(0, 40)); Box(V(cx + dx, cy + dy, 40), V(134, 8, 84), 0x7a6430, false, false, rr(0, 40)); }
      for (const [dx, dy] of [[-420, -420], [420, 420]]) Box(V(cx + dx, cy + dy, 350), V(40, 40, 700), TIMBER, true, true);
      lantern(cx, cy, 480, LAMP, 1100); Sign(V(cx, cy + 422, 280), -90, 'STABLE', { r: 0.9, g: 0.8, b: 0.55 }, 44);
      wallbuy('Homesteader', -3675, -296, 90); }
    // the powder store: kegs, crates, a warning nobody read
    { const cx = -5325, cy = -2350;
      for (const [dx, dy] of [[-330, -330], [-200, -360], [-340, -180], [300, 320], [180, 350]]) Barrel(V(cx + dx, cy + dy, 0), 0x3a2a22);
      Crate(V(cx + 320, cy - 300, 0), 130); Crate(V(cx + 330, cy - 150, 0), 100); Crate(V(cx + 320, cy - 300, 130), 90); Crate(V(cx - 300, cy + 300, 0), 120);
      for (const [dx, dy] of [[-440, 440], [440, -440]]) Box(V(cx + dx, cy + dy, 350), V(40, 40, 700), TIMBER, true, true);
      Box(V(cx, cy, 50), V(160, 110, 100), 0x6a2a22, true, true); Sign(V(cx, cy - 58, 60), -90, 'DYNAMITE', { r: 0.95, g: 0.85, b: 0.6 }, 26);
      lantern(cx, cy, 500, 0xFF7A4A, 1000);
      for (const s of [-1, 1]) Box(V(cx + s * 140, cy + 430, 170), V(20, 20, 340), TIMBER, true, false); Box(V(cx, cy + 430, 290), V(320, 14, 110), TIMBER_D, false, false); Sign(V(cx, cy + 420, 290), -90, 'POWDER', { r: 0.9, g: 0.35, b: 0.25 }, 48);
      wallbuy('Dynamite Dan', -5325, -1254, -90); }
    // a fall of rock half-blocks the far north-west corner; picks and a barrow left where they dropped
    heap(-6230, 2420, 1.0, ROCK); heap(-6050, -1500, 0.8, ROCK);
    for (const [x, y, yaw] of [[-4520, 1720, 20], [-2840, -1560, -30], [-6120, 900, 70]]) { BoxRot(V(x, y, 46), V(8, 8, 110), TIMBER, R(0, yaw, 62), false); BoxRot(V(x + 30, y, 90), V(70, 8, 10), STEEL, R(0, yaw, 10), false); }
    fungus(-6300, -3300); fungus(-2200, 3300, 0x1c8ccc); fungus(-4900, -300);
    for (const [x, y] of [[-6150, 3200], [-6150, -3200], [-6150, 150], [-4500, 1600], [-4500, -1600], [-2850, 3200], [-2850, -3200]]) SpawnAt(V(x, y, 0), Z1);
    M.Decor(V2(-6400, -3400), V2(-1600, 3400), 70, ['D_Crack', 'D_Grime', 'P_Bones', 'D_Grime', 'Blood']);
  }

  // ------------------------------------------------------------------ 2. THE DROWNED CAVERN (open: black water, islands, a pump barge, a rock shelf)
  {
    // the water lies in three sheets with dry ground between; it is ankle deep and glows where the algae has taken
    for (const [x0, y0, x1, y1] of [[-5600, 4700, -1700, 6700], [-900, 4500, 2300, 6500], [3100, 4900, 5900, 6900]]) {
      Floor(V2(x0, y0), V2(x1, y1), 2, 0x0f2e36); Floor(V2(x0 + 180, y0 + 160), V2(x1 - 220, y1 - 140), 3, 0x123a44);
      for (let i = 0; i < 9; i++) Glow(V(rr(x0 + 200, x1 - 200), rr(y0 + 200, y1 - 200), 3.5), V(rr(160, 420), rr(120, 300), 1), i % 3 ? 0x1c5a66 : 0x2a8a80, 1);
    }
    // columns where roof met floor, and a forest of smaller teeth
    for (const [x, y, d] of [[-4700, 5600, 420], [-2500, 6300, 340], [-1300, 4700, 300], [1500, 6900, 380], [2700, 5200, 460], [4800, 6100, 360], [5600, 4500, 300], [-5700, 4300, 280]]) {
      Oct(V(x, y, 590), V(d, d, 1180), TEAL[0], true, true); Oct(V(x, y, 80), V(d * 1.5, d * 1.5, 160), TEAL[1], true, false); Oct(V(x, y, 1090), V(d * 1.6, d * 1.6, 180), TEAL[1], false, false); Oct(V(x, y, 300), V(d * 1.18, d * 1.18, 90), TEAL[2], false, false);
    }
    for (const [x, y, h] of [[-3600, 4300, 260], [-3300, 4480, 170], [-800, 6900, 300], [-560, 7080, 190], [800, 4200, 240], [3700, 4300, 280], [3950, 4420, 160], [-5900, 6600, 240], [5900, 7000, 220], [2100, 7100, 200], [-2000, 4200, 150]]) stalagmite(x, y, h, TEAL[(h | 0) % 3]);
    stalactites(-6300, 3700, 6300, 7300, 1180, 70, TEAL[1]);
    // the pump barge, aground in the middle sheet: a deck to fight from, two planks up
    { const cx = 700, cy = 5500;
      Box(V(cx, cy, 55), V(1000, 360, 110), 0x4a3a2c, true, true); Box(V(cx, cy, 114), V(1010, 370, 10), TIMBER, false, false);
      BoxRot(V(cx + 590, cy, 60), V(260, 260, 110), 0x4a3a2c, R(0, 45, 0), true); BoxRot(V(cx - 560, cy, 60), V(180, 300, 110), 0x3e3026, R(0, 0, 0), true);
      for (const s of [-1, 1]) { Box(V(cx, cy + s * 176, 150), V(980, 10, 10), TIMBER_D, false, false); for (let i = -4; i <= 4; i++) Box(V(cx + i * 115, cy + s * 176, 132), V(10, 10, 46), TIMBER_D, false, false); }
      Cyl(V(cx - 250, cy, 200), 150, 170, 0x5a4a3a, true, false); Cyl(V(cx - 250, cy, 300), 60, 220, IRON, true, false); Cyl(V(cx - 250, cy, 420), 90, 26, IRON, false, false);            // the boiler and its stack
      Ring(V(cx - 60, cy, 220), V(210, 26, 210), IRON, R(0, 0, 0)); Box(V(cx - 60, cy, 220), V(200, 14, 14), IRON, false, false); Box(V(cx - 60, cy, 220), V(14, 14, 200), IRON, false, false); // the flywheel
      Box(V(cx + 200, cy, 250), V(26, 26, 280), TIMBER, true, false); BoxRot(V(cx + 330, cy, 400), V(320, 20, 20), TIMBER_D, R(18, 0, 0), false); Box(V(cx + 470, cy, 330), V(4, 4, 200), 0x1e1e22, false, false); Cyl(V(cx + 470, cy, 210), 60, 70, IRON, false, false);
      Ramp(V(cx - 100, cy - 520, 0), V(cx - 100, cy - 180, 112), 200, TIMBER); Ramp(V(cx + 300, cy + 520, 0), V(cx + 300, cy + 180, 112), 200, TIMBER);
      lantern(cx + 60, cy, 330, 0x8AD8FF, 1300); }
    // the shelf along the back wall: dry, high, and the only way to the reliquary
    Box(V(0, 7170, 140), V(5000, 460, 280), TEAL[0], true, true); face(-2500, 6940, 2500, 6940, 0, -1, 280, TEAL);
    Ramp(V(-3300, 7180, 0), V(-2500, 7180, 280), 320, TIMBER); Ramp(V(3300, 7180, 0), V(2500, 7180, 280), 320, TIMBER);
    for (let x = -2400; x <= 2400; x += 400) { Box(V(x, 6952, 330), V(16, 16, 100), TIMBER, false, false); if (x < 2400) Box(V(x + 200, 6952, 372), V(400, 10, 10), TIMBER_D, false, false); }
    for (const x of [-1800, -600, 600, 1800]) lantern(x, 7300, 560, 0x8AD8FF, 1000);
    for (const [x, y] of [[-5200, 7200], [-3900, 3800], [5200, 3900], [4300, 7200], [-1500, 6800], [2600, 4000]]) fungus(x, y, (x | 0) % 2 ? 0x1fa878 : 0x1c8ccc);
    // a wrecked skiff, drums, the pipe the pump never finished laying
    BoxRot(V(-3300, 5700, 40), V(420, 150, 70), 0x5a4632, R(0, 28, 12), true); GM.NavBlockBox({ min: V(-3500, 5580, 0), max: V(-3100, 5820, 150) }, 1); BoxRot(V(-3300, 5700, 82), V(430, 160, 8), TIMBER_D, R(0, 28, 12), false);
    for (let i = 0; i < 7; i++) Cyl(V(1500 + i * 330, 4250, 60), 110, 320, 0x4a4e54, i % 3 === 0, false, R(90, 0, 0));
    Barrel(V(4100, 4250, 0), 0x3a4a4e); Barrel(V(4230, 4320, 0), 0x3a4a4e); Crate(V(-5300, 3800, 0), 130); Crate(V(-5450, 3840, 0), 100);
    wallbuy('Iron Mule', -2600, 3564, 90); wallbuy('Frostbite Beam', 6396, 5500, 180);
    for (const [x, y] of [[-6000, 7000], [-4000, 7200], [4000, 7250], [6000, 7000], [-6000, 3950], [6000, 3950], [-2300, 3950], [2300, 3950], [0, 6500]]) SpawnAt(V(x, y, 0), Z2);
    M.Decor(V2(-6400, 3600), V2(6400, 7400), 80, ['D_Crack', 'D_Grime', 'P_Bones', 'D_Grime']);
  }

  // ------------------------------------------------------------------ 3. THE CRYSTAL SEAM (a ring of tunnels round a geode)
  {
    const CR = [0x6a38d8, 0x1c8ccc, 0xa83cc8];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {   // four L-shaped masses: the ring outside them, the chamber inside
      const xa = sx < 0 ? [2100, 3000] : [5000, 5900], xb = sx < 0 ? [3000, 3700] : [4300, 5000], ya = sy < 0 ? [-2900, -300] : [300, 2900], yb = sy < 0 ? [-2900, -1400] : [1400, 2900];
      mass(xa[0], ya[0], xa[1], ya[1], 1100, VIOLET); mass(xb[0], yb[0], xb[1], yb[1], 1100, VIOLET);
    }
    face(1560, -3440, 1560, -260, 1, 0, 1100, VIOLET); face(1560, 260, 1560, 3440, 1, 0, 1100, VIOLET); face(1560, -3440, 6400, -3440, 0, 1, 1100, VIOLET); face(1560, 3440, 6400, 3440, 0, -1, 1100, VIOLET);
    // the geode: one great cluster in the middle of the chamber, lesser ones round the walls, veins in the floor
    Oct(V(4000, 0, 50), V(620, 620, 100), 0x2a2434, true, true); Oct(V(4000, 0, 120), V(420, 420, 60), 0x342c40, true, false);
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283, r = i === 0 ? 0 : rr(70, 180), h = i === 0 ? 760 : rr(280, 560), w = i === 0 ? 130 : rr(56, 96); Glow(V(4000 + Math.cos(a) * r, Math.sin(a) * r, 140 + h * 0.42), V(w, w, h), CR[i % 3], 6, R(i === 0 ? 0 : Math.cos(a) * 16, 0, i === 0 ? 0 : Math.sin(a) * 16)); }
    Lamp(V(4000, 0, 420), LC(0.6, 0.45, 1), 14, 2400, false);
    for (const [x, y, s] of [[3150, -1250, 1.1], [4850, 1250, 1.2], [3150, 1250, 0.9], [4850, -1250, 1.0], [3120, 620, 0.7], [4880, -640, 0.7]]) crystals(x, y, s, CR);
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 + 0.2; Glow(V(4000 + Math.cos(a) * rr(420, 900), Math.sin(a) * rr(420, 1200), 2.5), V(rr(160, 360), 10, 1), CR[i % 3], 0, R(0, a * 57.3, 0)); }
    // crystals crowd the ring tunnels too, small ones, enough to see by
    for (const [x, y, s] of [[1700, -3300, 0.6], [1700, 3300, 0.6], [6300, -3300, 0.7], [6300, 3300, 0.6], [6300, 900, 0.5], [6300, -1500, 0.55], [1700, 1800, 0.5], [1700, -1700, 0.5], [3300, 3300, 0.5], [5200, -3300, 0.5]]) crystals(x, y, s, CR, false);
    stalactites(3000, -1400, 5000, 1400, 1100, 26, VIOLET[2]);
    for (const [x, y, ax] of [[2550, 0, false], [5450, 0, false], [4000, 2150, true], [4000, -2150, true]]) timber(x, y, 600, ax, 540, true);
    // a survey camp in the chamber: a table of samples, an assay scale, tripods
    Box(V(4480, 520, 78), V(260, 120, 10), TIMBER, true, true); for (const [dx, dy] of [[-110, -45], [110, -45], [-110, 45], [110, 45]]) Box(V(4480 + dx, 520 + dy, 38), V(12, 12, 76), TIMBER_D, false, false);
    for (let i = 0; i < 4; i++) Glow(V(4400 + i * 52, 520, 100), V(18, 18, rr(30, 54)), CR[i % 3], 6);
    for (const [x, y] of [[3480, -560], [4560, -420]]) { for (let k = 0; k < 3; k++) { const a = k * 2.094; BoxRot(V(x + Math.cos(a) * 34, y + Math.sin(a) * 34, 90), V(8, 8, 190), TIMBER, R(Math.cos(a) * 20, 0, Math.sin(a) * 20), false); } Box(V(x, y, 186), V(30, 22, 24), IRON, false, false); }
    Crate(V(3260, -300, 0), 110); Crate(V(3280, -160, 0), 90);
    Box(V(2550, 0, 620), V(16, 460, 90), TIMBER_D, false, false); Sign(V(2540, 0, 620), 180, 'THE SEAM', { r: 0.8, g: 0.7, b: 1 }, 50);
    wallbuy('Lawman AR', 6396, 0, 180); wallbuy('Quarter Horse', 4650, 1396, -90);
    for (const [x, y] of [[1840, -3160], [1840, 3160], [6160, -3160], [6160, 3160], [6160, 300], [4000, -1150], [4000, 1150]]) SpawnAt(V(x, y, 0), Z3);
    M.Decor(V2(1600, -3400), V2(6400, 3400), 50, ['D_Crack', 'D_Crack', 'D_Grime', 'P_Bones']);
  }

  // ------------------------------------------------------------------ 4. THE WORKS (boilers, the crusher, the rail yard)
  {
    face(-6400, -3560, 6400, -3560, 0, -1, 900, RUST);
    // the boiler house: brick, two boilers out front with their fire doors open, a stack through the roof
    { const cx = -4300, cy = -6650;
      Box(V(cx, cy, 300), V(1500, 900, 600), BRICK, true, true); Box(V(cx, cy, 615), V(1540, 940, 30), 0x3a2a22, true, false);
      for (let i = 0; i < 6; i++) Box(V(cx - 620 + i * 250, cy + 452, 300), V(30, 8, 600), 0x54301f, false, false);
      Cyl(V(cx + 500, cy - 150, 450), 260, 900, BRICK, true, false); Cyl(V(cx + 500, cy - 150, 880), 290, 40, 0x3a2a22, false, false);
      for (const s of [-1, 1]) { const bx = cx + s * 330;
        Cyl(V(bx, cy + 900, 190), 300, 760, 0x4a4e54, true, true, R(0, 0, 90)); for (const k of [-300, 0, 300]) Cyl(V(bx, cy + 900 + k, 190), 312, 16, IRON, false, false, R(0, 0, 90));
        Box(V(bx, cy + 900, 30), V(240, 700, 60), BRICK, true, false); Glow(V(bx, cy + 1284, 150), V(120, 6, 110), 0xFF6A2A); Box(V(bx - 74, cy + 1290, 150), V(10, 10, 130), IRON, false, false);
        Cyl(V(bx, cy + 700, 420), 60, 180, IRON, false, false); Cyl(V(bx, cy + 560, 500), 50, 760, 0x4a4e54, false, false, R(0, 0, 90));
        Lamp(V(bx, cy + 1380, 150), LC(1, 0.45, 0.2), 12, 1100, false); }
      Sign(V(cx, cy + 456, 500), 90, 'BOILER HOUSE', { r: 0.92, g: 0.82, b: 0.6 }, 56); }
    // the crusher: a hopper on a timber frame, the stamps under it, and a loading stage you can get up on
    { const cx = 300, cy = -6500;
      Box(V(cx, cy, 150), V(900, 620, 300), 0x4a3c30, true, true); Box(V(cx, cy, 306), V(920, 640, 12), TIMBER, false, false);                   // the stage
      Ramp(V(cx - 1150, cy, 0), V(cx - 450, cy, 300), 300, TIMBER);
      for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) Box(V(cx + 150 + sx * 230, cy + sy * 200, 560), V(40, 40, 520), TIMBER, true, false);
      Pyramid(V(cx + 150, cy, 660), V(560, 480, 300), 0x4a4e54, R(180, 0, 0), false); Box(V(cx + 150, cy, 820), V(580, 500, 24), IRON, false, false);
      for (let i = -1; i <= 1; i++) { Box(V(cx + 150 + i * 120, cy, 430), V(60, 60, 200), STEEL, true, false); Box(V(cx + 150 + i * 120, cy, 330), V(90, 90, 40), IRON, false, false); }
      for (const s of [-1, 1]) { Box(V(cx, cy + s * 312, 360), V(900, 10, 10), TIMBER_D, false, false); for (let i = -3; i <= 3; i++) Box(V(cx + i * 140, cy + s * 312, 334), V(10, 10, 56), TIMBER_D, false, false); }
      heap(cx + 760, cy + 60, 1.1, RUST); heap(cx + 900, cy - 420, 0.8, ROCK);
      lantern(cx - 200, cy, 620, LAMP, 1300); Sign(V(cx + 150, cy + 252, 760), 90, 'No. 2 CRUSHER', { r: 0.92, g: 0.82, b: 0.6 }, 44); }
    // the winding engine against the east wall: a drum, a flywheel twice your height, its housing
    { const cx = 5300, cy = -6700;
      Box(V(cx, cy, 40), V(1300, 800, 80), BRICK, true, true);
      Cyl(V(cx - 250, cy, 360), 520, 380, 0x5a4a3a, true, false, R(0, 0, 90)); for (const k of [-190, 190]) Cyl(V(cx - 250, cy + k, 360), 600, 20, IRON, false, false, R(0, 0, 90));
      Ring(V(cx + 330, cy, 430), V(700, 40, 700), IRON, R(0, 0, 0)); for (let k = 0; k < 4; k++) BoxRot(V(cx + 330, cy, 430), V(640, 18, 18), STEEL, R(k * 45, 0, 0), false); Cyl(V(cx + 330, cy, 430), 90, 120, STEEL, false, false, R(0, 0, 90));
      for (const s of [-1, 1]) { Box(V(cx + 330, cy + s * 90, 260), V(120, 40, 360), 0x4a3c30, true, false); Box(V(cx - 250, cy + s * 260, 240), V(140, 40, 320), 0x4a3c30, true, false); }
      Box(V(cx - 250, cy + 420, 620), V(8, 8, 520), 0x1e1e22, false, false); lantern(cx, cy + 300, 640, LAMP, 1300); }
    // four pillars carry the roof; the yard between them is open
    mass(-2500, -5650, -2000, -5150, 900, RUST); mass(2000, -5650, 2500, -5150, 900, RUST); mass(-800, -4500, -300, -4000, 900, RUST); mass(4000, -5200, 4500, -4700, 900, RUST);
    // the rail yard: a through line, a siding, trucks standing and one on its side
    rails(-6300, -4300, -900, -4300); rails(-200, -4300, 3900, -4300); rails(4600, -4300, 6300, -4300); rails(0, -4200, 0, -3560); rails(-5200, -5300, -2600, -5300);
    cart(-5200, -4300, 0, 1); cart(-4960, -4300, 0, 1); cart(-4720, -4300, 0, 2); cart(1700, -4300, 0, 0); cart(-3600, -5300, 0, 1);
    BoxRot(V(3200, -4700, 60), V(190, 120, 100), 0x4a3a30, R(0, 30, 80), true); GM.NavBlockBox({ min: V(3110, -4780, 0), max: V(3290, -4620, 150) }, 1); heap(3340, -4860, 0.6, RUST);
    // timber stacks, drums, crates: cover, and something to climb
    for (const [x, y, yaw] of [[-1500, -6900, 0], [-1500, -6500, 0], [2950, -7000, 90], [1500, -5600, 20]]) { for (let k = 0; k < 3; k++) for (let j = 0; j < 3 - k; j++) Cyl(V(x + (yaw ? 0 : (j - (2 - k) / 2) * 62), y + (yaw ? (j - (2 - k) / 2) * 62 : 0), 30 + k * 54), 60, 520, k % 2 ? TIMBER : TIMBER_D, k === 0, false, yaw ? R(90, 0, 0) : R(0, 0, 90)); M.Blocker(V(x, y, 80), yaw ? V(520, 190, 160) : V(190, 520, 160)); GM.NavBlockBox({ min: V(x - (yaw ? 260 : 95), y - (yaw ? 95 : 260), 0), max: V(x + (yaw ? 260 : 95), y + (yaw ? 95 : 260), 160) }, 1); }
    Crate(V(-3000, -7150, 0), 140); Crate(V(-2850, -7180, 0), 110); Crate(V(-3000, -7150, 140), 100); Crate(V(3500, -6300, 0), 130); Crate(V(3660, -6360, 0), 100); Crate(V(5600, -4000, 0), 120);
    for (const [x, y] of [[-6200, -5600], [-6100, -5740], [-6240, -5860], [1300, -3800], [1420, -3760], [-5600, -3800]]) Barrel(V(x, y, 0), (x | 0) % 2 ? 0x5a4a3a : 0x6a3a2a);
    // a water tank on legs, and pipes along the back wall
    { const x = -1100, y = -7000; for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) Box(V(x + sx * 110, y + sy * 110, 190), V(26, 26, 380), TIMBER, true, false); Cyl(V(x, y, 500), 360, 260, 0x5a4a3a, true, false); for (const z of [400, 500, 600]) Cyl(V(x, y, z), 372, 12, IRON, false, false); M.Blocker(V(x, y, 190), V(260, 260, 380)); GM.NavBlockBox({ min: V(x - 130, y - 130, 0), max: V(x + 130, y + 130, 300) }, 1); }
    for (const z of [520, 640]) Cyl(V(0, -7350, z), 50, 12600, 0x4a4e54, false, false, R(90, 0, 0));
    for (let x = -6000; x <= 6000; x += 1500) Box(V(x, -7360, 580), V(30, 60, 200), IRON, false, false);
    for (const [x, y] of [[-3000, -4900], [1000, -4900], [-1000, -5800], [3200, -5800], [5300, -4500], [-5600, -5000]]) lantern(x, y, 700, LAMP, 1200);
    for (const [x, y, ax] of [[-4500, -3900, true], [4500, -3900, true], [0, -3900, true]]) timber(x, y, 600, ax, 540, false);
    Station('AmmoCrate', V(1500, -7200, 0), 90, 2000, -1, 'Ammo');
    wallbuy('Sawbuck', -2600, -7396, 90); wallbuy('Back-Alley', 6396, -5300, 180);
    for (const [x, y] of [[-6100, -7100], [-6100, -4000], [6100, -7150], [6100, -3950], [-2200, -7150], [2300, -7150], [900, -5300], [-3300, -3950], [3300, -3950]]) SpawnAt(V(x, y, 0), Z4);
    M.Decor(V2(-6400, -7400), V2(6400, -3600), 90, ['D_Crack', 'D_Grime', 'D_Grime', 'P_Bones', 'Blood']);
  }

  // ------------------------------------------------------------------ doors
  Door(V(-1500, 0, 0), 0, 1500, Z0, Z1); Door(V(1500, 0, 0), 0, 1500, Z0, Z3);
  Door(V(0, 3500, 0), 90, 2500, Z0, Z2); Door(V(0, -3500, 0), 90, 2500, Z0, Z4);
  Door(V(-4500, 3500, 0), 90, 3000, Z1, Z2); Door(V(-4500, -3500, 0), 90, 3500, Z1, Z4);
  Door(V(4500, 3500, 0), 90, 3500, Z3, Z2); Door(V(4500, -3500, 0), 90, 4000, Z3, Z4);
}

export const MINE_LOOT = { chests: { 0: [0], 1: [0, 1], 2: [1, 2], 3: [1, 2], 4: [0, 1] }, relics: [[0, 7240, 282, -90], [20, -6700, 310, 90]], box: [420, 760, 180, 0], boxZones: [1, 2, 3, 4] };
