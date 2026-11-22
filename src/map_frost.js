// FROSTBITE JUNCTION. The third map: a mountain rail depot the snow closed over.
// Six districts along the line: the station (start), a freight yard of boxcar alleys (tight), the roundhouse and its
// turntable court, a frozen lake (open), a row of crew cabins (tight), and Timberline Pass out east (wide open, with a
// snow shed down the middle of it). It is always snowing.
import * as THREE from 'three';
import { V, V2, R, LC, FMath } from './mapkit.js';
import { mapKit, rgb } from './mapx.js';

const SNOW = 0xdfe8ee, SNOW_D = 0xb8c6d2, ICE = 0x9fc8de, SLATE = [0x5a6474, 0x4a5262, 0x6a7686], TIMBER = 0x5a4030, TIMBER_D = 0x3e2c22, RED = 0x7a2e28, LAMP = 0xFFB45A;
const rr = (a, b) => FMath.FRandRange(a, b);

export function buildFrost(M) {
  const { Box, BoxRot, Glow, Cyl, Ball, ConeShape, Ramp, Floor, Wall, Lamp, Sign, Barrel, Crate, Station, WallBuy, Door, SpawnAt, Pyramid, Oct, Ring, AddZone, DeadTree, StreetLamp, GM } = M;
  const K = mapKit(M);
  GM.navInit(-9600, -5500, 13100, 5500, 100);
  const drift = (x, y, w = 420, d = 300, h = 110) => K.mound(x, y, w, d, h, SNOW);
  const wallbuy = (name, x, y, yaw) => { const n = [Math.cos(yaw * Math.PI / 180), Math.sin(yaw * Math.PI / 180)]; Box(V(x - n[0] * 4, y - n[1] * 4, 150), Math.abs(n[0]) > 0.5 ? V(12, 300, 230) : V(300, 12, 230), TIMBER_D, false, false); { const t = [-n[1], n[0]]; for (const s of [-1, 1]) Box(V(x - n[0] * 16 + t[0] * s * 158, y - n[1] * 16 + t[1] * s * 158, 170), V(18, 18, 340), TIMBER_D, false, false); Box(V(x - n[0] * 16, y - n[1] * 16, 284), Math.abs(n[0]) > 0.5 ? V(22, 350, 16) : V(350, 22, 16), TIMBER_D, false, false); } WallBuy(name, V(x, y, 0), yaw); };

  // ------------------------------------------------------------------ zones
  // The junction is strung along the main line. The line itself is the way through: a long open cutting, west tunnel to
  // east tunnel, with the station, the roundhouse and the bunkhouses standing open along its north side, the lake and
  // the freight yard behind a fence to the south, and the pass at the far end. Something still runs on it.
  const Z0 = AddZone('Frostbite Station', V2(-9000, -400), V2(-5000, 3400));
  const Z1 = AddZone('The Freight Yard', V2(-5000, -4900), V2(-500, -400));
  const Z2 = AddZone('The Roundhouse', V2(-5000, -400), V2(-500, 4900));
  const Z3 = AddZone('Timberline Pass', V2(3500, -1000), V2(12500, 4500));
  const Z4 = AddZone('The Frozen Lake', V2(-9000, -3400), V2(-5000, -400));
  const Z5 = AddZone('Bunkhouse Row', V2(-500, -400), V2(3500, 3400));
  M.Districts([['Frostbite Station', [Z0]], ['The Freight Yard', [Z1]], ['The Roundhouse', [Z2]], ['Timberline Pass', [Z3]], ['The Frozen Lake', [Z4]], ['Bunkhouse Row', [Z5]]]);

  // ------------------------------------------------------------------ ground and bounds
  Box(V(1750, 0, -50), V(22500, 10800, 100), SNOW, true, false);
  M.at({ x: -2000, y: 1100 }, () => { Floor(V2(-7000, -4500), V2(-3000, -1500), 1, 0xcfdde6); Floor(V2(-6700, -4250), V2(-3300, -1800), 2, ICE); Floor(V2(-6300, -3900), V2(-3800, -2200), 3, 0xa9d2e6); });
  Floor(V2(-5000, -4900), V2(-500, -400), 1, 0x9aa4ae); Floor(V2(-5000, 400), V2(-500, 4900), 1, 0xa2a8b0);
  M.at({ x: -2000, y: 1900 }, () => Floor(V2(-7000, -620), V2(-3000, 20), 2, 0x8a929c));            // ballast under the station road
  Floor(V2(-9000, -330), V2(3500, 330), 2, 0x7c848e);                                               // and under the main line
  // the mountain: slate walls with snow on every ledge, and solid rock wherever the junction does not reach
  const X0 = -9000, X1 = 12500, Y0 = -4900, Y1 = 4900;
  for (const [a, b] of [[V2(X0, Y0), V2(X0, Y1)], [V2(X1, Y0), V2(X1, Y1)], [V2(X0, Y0), V2(X1, Y0)], [V2(X0, Y1), V2(X1, Y1)]]) Wall(a, b, 950, 200, SLATE[0], [], true, SNOW);
  // (each face stands exactly where the old wall or fence of that district stood, so whatever hangs on it still hangs on it)
  for (const [x0, y0, x1, y1] of [[-9000, 3370, -4970, 4900], [-530, 3300, 3600, 4900], [3500, 4400, 12500, 4900], [-9000, -4900, -4970, -3300], [-530, -4900, 3500, -400], [3500, -4900, 12500, -970], [3500, -1000, 3600, -400]]) {
    Box(V((x0 + x1) / 2, (y0 + y1) / 2, 475), V(x1 - x0, y1 - y0, 950), SLATE[0], true, true); Box(V((x0 + x1) / 2, (y0 + y1) / 2, 962), V(x1 - x0 + 30, y1 - y0 + 30, 24), SNOW, false, false);
    if (x1 - x0 > 600) { const n = y0 < 0 ? y1 : y0, s = y0 < 0 ? 1 : -1; K.cliffs(x0 + 200, n - s * 160, x1 - 200, n - s * 160, 965, SLATE, SNOW); }
  }
  K.cliffs(X0 - 60, Y0, X0 - 60, Y1, 965, SLATE, SNOW); K.cliffs(X1 + 60, Y0, X1 + 60, Y1, 965, SLATE, SNOW);
  // palisades between the districts: snow along the top rail, a gate in each
  const fence = (a, b, gaps, thick = 60) => Wall(a, b, 520, thick, TIMBER, gaps.map((g) => V2(g - 200, g + 200)), true, SNOW, TIMBER_D);
  // (the two stockades at the ends of Bunkhouse Row are thicker on one side: a mountain wall stood there before)
  const FENCES = [[-5000, -3400, -5000, 3400, [1500, 3400, 5300]], [-465, -400, -465, 3400, [400, 2100], 130], [3535, -400, 3535, 3400, [400, 2300], 130], [-9000, -400, -530, -400, [2000, 6250]]];
  for (const [x0, y0, x1, y1, gaps, th] of FENCES) fence(V2(x0, y0), V2(x1, y1), gaps, th);
  // [x, y, yaw, price, zone, zone]: three crossing gates on the line itself, and a side gate into each yard
  const DOORS = [[-5000, 0, 0, 1500, Z0, Z2], [-5000, 1900, 0, 1500, Z0, Z2], [-7000, -400, 90, 1500, Z0, Z4], [-5000, -1900, 0, 2500, Z4, Z1], [-2750, -400, 90, 2500, Z2, Z1],
    [-500, 0, 0, 3000, Z2, Z5], [-500, 1700, 0, 3000, Z2, Z5], [3500, 0, 0, 4000, Z5, Z3], [3500, 1900, 0, 4000, Z5, Z3]];
  for (const [x, y, yaw] of DOORS) { const ax = yaw === 90; for (const s of [-1, 1]) { Box(V(x + (ax ? s * 226 : 0), y + (ax ? 0 : s * 226), 290), ax ? V(44, 110, 580) : V(110, 44, 580), TIMBER_D, true, false); Box(V(x + (ax ? s * 226 : 0), y + (ax ? 0 : s * 226), 590), V(70, 70, 20), SNOW, false, false); } K.lantern(x + (ax ? 150 : 60), y + (ax ? 60 : 150), 470, LAMP, 800); }
  for (const [x0, y0, x1, y1] of FENCES) {
    const len = Math.hypot(x1 - x0, y1 - y0), n = Math.round(len / 300);
    for (let i = 1; i < n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; if (DOORS.some(([dx, dy]) => Math.hypot(dx - x, dy - y) < 330)) continue; Box(V(x, y, 280), x0 === x1 && Math.abs(x0 % 100) === 35 ? V(150, 84, 560) : x0 === x1 && Math.abs(x0 % 100) === 65 ? V(150, 84, 560) : V(84, 84, 560), TIMBER_D, false, false); Box(V(x, y, 566), V(92, 92, 16), SNOW, false, false); }
  }
  // ------------------------------------------------------------------ THE MAIN LINE
  {
    K.rails(-8880, 0, 3500, 0);
    for (const [x, s] of [[X0 + 110, 1], [X1 - 110, -1]]) { Box(V(x, 0, 300), V(40, 620, 600), 0x06080c, false, false); for (const t of [-1, 1]) Box(V(x + s * 10, t * 340, 320), V(80, 80, 640), SLATE[1], true, false); Box(V(x + s * 10, 0, 670), V(80, 780, 90), SLATE[1], true, false); Box(V(x + s * 10, 0, 722), V(90, 800, 16), SNOW, false, false); Glow(V(x + s * 30, 0, 560), V(10, 60, 60), 0x9fe0ff); }
    // signals and lamps down both sides, a platelayers' hut, snow thrown clear of the rails
    for (let x = -8200; x < 3400; x += 1300) { if (DOORS.some(([dx, dy]) => dy === 0 && Math.abs(dx - x) < 420)) continue; K.post(x, -350, 400, 0x8AD8FF, TIMBER_D, 900); if ((x / 1300 | 0) % 2) K.post(x + 650, 350, 400, LAMP, TIMBER_D, 900); }
    for (let x = -8600; x < 3400; x += 700) { if (DOORS.some(([dx, dy]) => Math.abs(dx - x) < 500 && Math.abs(dy) < 600)) continue; drift(x + rr(-150, 150), -320, rr(380, 620), 150, rr(60, 110)); }
    for (const x of [-6200, -3600, -1900, 900, 2600]) { Box(V(x, 300, 70), V(26, 26, 140), 0x33363c, false, false); Box(V(x, 300, 150), V(70, 12, 40), 0xf2f4f6, false, false); Sign(V(x, 292, 150), -90, String(Math.round((x + 9000) / 100)), { r: 0.1, g: 0.1, b: 0.12 }, 24); }
    for (const [x, y] of [[-7600, -372], [-4400, 372], [-1500, -372], [2200, 372]]) { Box(V(x, y, 250), V(20, 20, 500), 0x33363c, true, false); Box(V(x, y, 470), V(60, 30, 110), 0x18181c, false, false); Box(V(x + 60, y, 430), V(110, 8, 30), 0xc8322a, false, false); Box(V(x, y, 532), V(70, 40, 12), SNOW, false, false); }
    K.cabin(1100, -390, 1700, -60, 230, RED, 0x2e2a30, { door: 90, snow: SNOW, glow: LAMP, chimney: false, rise: 110 }); GM.NavBlockBox({ min: V(1100, -400, 0), max: V(1700, -60, 300) }, 1);
    Sign(V(-8700, -364, 420), 90, 'MAIN LINE  -  KEEP CLEAR', { r: 0.95, g: 0.9, b: 0.8 }, 40); Sign(V(150, -396, 420), 90, 'MAIN LINE  -  KEEP CLEAR', { r: 0.95, g: 0.9, b: 0.8 }, 40);
    for (const [x, y] of [[-8300, 250], [-6000, -250], [-4200, 260], [-2400, -260], [-1000, 250], [600, 260], [2900, -260]]) SpawnAt(V(x, y, 0), x < -5000 ? Z0 : x < -500 ? Z2 : Z5);
  }
  // ------------------------------------------------------------------ 0. FROSTBITE STATION
  M.at({ x: -2000, y: 1900 }, () => {
    // the main line comes out of a tunnel in the west wall and dies at a buffer stop by the yard gate
    Box(V(-6890, -300, 260), V(40, 520, 520), 0x0c0e12, false, false); for (const s of [-1, 1]) Box(V(-6880, -300 + s * 290, 280), V(70, 70, 560), SLATE[1], true, false); Box(V(-6880, -300, 580), V(70, 660, 80), SLATE[1], true, false); Box(V(-6880, -300, 626), V(80, 680, 16), SNOW, false, false);
    K.rails(-6860, -300, -3200, -300); Box(V(-3170, -300, 60), V(40, 240, 120), RED, true, true); Box(V(-3170, -300, 130), V(46, 250, 20), SNOW, false, false);
    // the last train in: engine dead on the stop, two coaches behind it, lamps still lit in a few windows
    K.loco(-4000, -300, 0, 0x23262c, SNOW, true); K.car(-5330, -300, 0, 860, 0x4a2e2a, 'coach', SNOW); K.car(-6260, -300, 0, 860, 0x4a2e2a, 'coach', SNOW);
    // the station house: red weatherboard, a clock over the door, a canopy down to the platform edge
    Floor(V2(-6400, 20), V2(-3700, 620), 3, 0x6a5a4a); for (let x = -6400; x < -3700; x += 120) Floor(V2(x, 20), V2(x + 4, 620), 4, 0x4a3e34);
    K.cabin(-6000, 620, -4200, 1250, 380, RED, 0x2e2a30, { door: -90, snow: SNOW, logs: 0x5e231f, glow: LAMP, rise: 190 });
    for (let x = -5900; x <= -4300; x += 400) { Box(V(x, 180, 190), V(22, 22, 380), TIMBER_D, true, false); BoxRot(V(x, 250, 340), V(14, 160, 14), TIMBER_D, R(0, 0, 40), false); }
    Box(V(-5100, 380, 392), V(1860, 520, 16), 0x2e2a30, false, false); Box(V(-5100, 380, 406), V(1800, 470, 14), SNOW, false, false); Box(V(-5100, 126, 360), V(1860, 12, 60), 0x4a1f1c, false, false);
    Sign(V(-5100, 118, 360), -90, 'FROSTBITE JUNCTION', { r: 0.95, g: 0.9, b: 0.8 }, 50); Sign(V(-5100, 118, 318), -90, 'ELEV. 9,412 FT', { r: 0.8, g: 0.75, b: 0.65 }, 22);
    Cyl(V(-5100, 612, 330), 90, 10, 0xe8e2d0, false, false, R(0, 0, 90)); Box(V(-5100, 606, 346), V(4, 4, 34), 0x1c1a1c, false, false); Box(V(-5086, 606, 330), V(30, 4, 4), 0x1c1a1c, false, false);   // stopped at ten past four
    for (const x of [-5800, -4500]) { Box(V(x, 560, 44), V(260, 60, 10), TIMBER, true, true); Box(V(x, 590, 84), V(260, 10, 70), TIMBER, false, false); for (const s of [-1, 1]) Box(V(x + s * 110, 560, 20), V(12, 50, 40), TIMBER_D, false, false); }
    { const x = -4000, y = 420; Box(V(x, y, 46), V(220, 110, 12), TIMBER, true, true); for (const sx of [-1, 1]) Cyl(V(x + sx * 80, y + 60, 28), 56, 10, 0x23262c, false, false, R(0, 0, 90)); Box(V(x - 20, y, 90), V(110, 80, 70), 0x5a3a2a, false, false); Box(V(x + 60, y, 76), V(70, 60, 44), 0x3a4a5a, false, false); Box(V(x - 10, y, 140), V(70, 50, 34), 0x6a5a3a, false, false); }
    // the yard side: water tower, coal stage, the starter signal
    { const x = -6300, y = -1050; for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { Box(V(x + sx * 130, y + sy * 130, 220), V(30, 30, 440), TIMBER_D, true, false); } for (const s of [-1, 1]) { BoxRot(V(x, y + s * 130, 220), V(360, 16, 16), TIMBER_D, R(s * 50, 0, 0), false); BoxRot(V(x + s * 130, y, 220), V(16, 360, 16), TIMBER_D, R(0, 0, s * 50), false); }
      Cyl(V(x, y, 580), 420, 300, 0x6a4a36, true, false); for (const z of [470, 580, 690]) Cyl(V(x, y, z), 432, 12, 0x33363c, false, false); ConeShape(V(x, y, 790), V(460, 460, 120), 0x2e2a30, false); ConeShape(V(x, y, 820), V(330, 330, 90), SNOW, false);
      BoxRot(V(x + 250, y, 420), V(240, 16, 16), 0x33363c, R(-30, 0, 0), false); M.Blocker(V(x, y, 220), V(300, 300, 440)); GM.NavBlockBox({ min: V(x - 150, y - 150, 0), max: V(x + 150, y + 150, 300) }, 1); }
    { const x = -4300, y = -1100; Box(V(x, y, 80), V(700, 300, 160), TIMBER, true, true); for (let i = 0; i < 7; i++) Pyramid(V(x + rr(-280, 280), y + rr(-100, 100), 180 + rr(0, 30)), V(rr(140, 220), rr(140, 220), rr(60, 110)), 0x101014, R(0, rr(0, 90), 0)); Box(V(x, y + 154, 100), V(700, 8, 200), TIMBER_D, false, false); Box(V(x - 200, y - 90, 174), V(260, 110, 12), SNOW, false, false); }
    for (const [x, y] of [[-5600, -700], [-3500, 250]]) { Box(V(x, y, 300), V(20, 20, 600), 0x33363c, true, false); Box(V(x + 70, y, 560), V(160, 8, 36), 0xc8322a, false, false); Box(V(x + 136, y, 560), V(28, 9, 36), 0xf2f4f6, false, false); Glow(V(x, y - 14, 500), V(26, 8, 26), 0xFF3A2A); Lamp(V(x, y - 40, 500), LC(1, 0.25, 0.2), 8, 600, false); Box(V(x, y, 606), V(30, 30, 12), SNOW, false, false); }
    for (const [x, y] of [[-6600, 400], [-3350, 900], [-5000, -1150], [-3500, -1000], [-6700, -200]]) StreetLamp(V(x, y, 0), x < -5000 ? 0 : 180);
    for (const [x, y, w, d] of [[-6700, 1250, 500, 360], [-3400, 1300, 460, 300], [-6750, -700, 380, 520], [-5300, -1380, 700, 220], [-3900, -720, 300, 260]]) drift(x, y, w, d);
    Crate(V(-6250, 560, 0), 110); Crate(V(-6240, 430, 0), 90); Barrel(V(-3850, 1150, 0), 0x4a3a30); Barrel(V(-3960, 1180, 0), 0x3a4a5a);
    Station('HighRoller', V(-5400, 560, 0), -90, 2500, -1, 'Workbench'); Station('AmmoCrate', V(-4800, 560, 0), -90, 250, -1, 'Ammo');
    wallbuy('Saloon Six', -6400, 1436, -90); wallbuy("Hornet's Nest", -4000, -1436, 90);
    for (const [x, y] of [[-6700, -1250], [-6700, 1200], [-3450, -1250], [-3350, 1250], [-4050, 1320], [-6050, -1300]]) SpawnAt(V(x, y, 0), Z0);
    M.Spawn(V(-5100, -950, 100));
  });

  // ------------------------------------------------------------------ 1. THE FREIGHT YARD (four sidings, alleys between the cars)
  M.at({ x: -2000, y: -400 }, () => {
    const TX = [-2200, -1150, -100, 950], SLOT = [-3950, -3000, -1450];
    const PLAN = [['box', 'box', 'box'], ['tank', null, 'box'], [null, 'box', 'flat'], ['box', 'caboose', null]];
    const COL = [0x6a3a2a, 0x4a5a4a, 0x5a4a3a, 0x7a2e28, 0x3a4a5a];
    TX.forEach((x, i) => { K.rails(x, -4440, x, -900); Box(V(x, -870, 50), V(240, 40, 100), RED, true, true);
      SLOT.forEach((y, j) => { const k = PLAN[i][j]; if (k) K.car(x, y, 90, 880, k === 'tank' ? 0x33363c : COL[(i * 3 + j) % 5], k, SNOW); }); });
    // the gantry over the cross lane: two legs, a girder, a hook that has not moved since the snow came
    for (const x of [-2700, 1380]) { Box(V(x, -2250, 330), V(40, 40, 660), 0x33363c, true, false); BoxRot(V(x, -2250, 200), V(16, 260, 16), 0x33363c, R(0, 0, 50), false); }
    Box(V(-660, -2250, 670), V(4160, 50, 50), 0x33363c, false, false); Box(V(-660, -2250, 700), V(4100, 40, 12), SNOW, false, false); Box(V(300, -2250, 520), V(6, 6, 280), 0x18181c, false, false); Cyl(V(300, -2250, 370), 70, 50, 0x33363c, false, false);
    // the empty slots are loading ground: crates, drums, a way up onto the car roofs
    Crate(V(950, -1500, 0), 150); Crate(V(1090, -1380, 0), 120); Crate(V(960, -1320, 0), 100); Crate(V(950, -1500, 150), 110); Barrel(V(780, -1650, 0), 0x3a4a5a); Barrel(V(800, -1220, 0), 0x6a3a2a);
    Crate(V(-1150, -3120, 0), 150); Crate(V(-1150, -2950, 0), 130); Crate(V(-1150, -3120, 150), 120); Crate(V(-1010, -2800, 0), 100);
    Crate(V(-100, -3800, 0), 140); Crate(V(-100, -3960, 0), 110); Crate(V(-100, -3800, 140), 100); Barrel(V(-260, -4150, 0), 0x4a3a30); Barrel(V(60, -4200, 0), 0x3a4a5a);
    // steps of crates onto the roof of the boxcar that holds the reliquary
    Crate(V(-820, -1450, 0), 150); Crate(V(-820, -1290, 0), 150); Crate(V(-820, -1290, 150), 150); Box(V(-900, -1290, 316), V(170, 150, 16), TIMBER, true, false);
    for (const [x, y] of [[-1675, -500], [425, -500], [-625, -2250], [-2600, -3500], [1250, -3400], [-1675, -3500], [425, -1450]]) K.post(x, y, 380, LAMP, TIMBER_D, 900);
    for (const [x, y, w, d] of [[-2700, -4300, 500, 300], [1300, -4350, 360, 240], [-1700, -700, 420, 260], [400, -2250, 380, 300], [-2750, -1200, 300, 500]]) drift(x, y, w, d);
    Sign(V(-2966, -2300, 380), 0, 'YARD LIMIT', { r: 0.95, g: 0.9, b: 0.8 }, 44);
    wallbuy('Iron Mule', -2000, -36, -90); wallbuy('Dynamite Dan', 1466, -900, 180); wallbuy('Sawbuck', -1675, -4396, 90);
    for (const [x, y] of [[-1675, -4250], [425, -4250], [1280, -3000], [-2750, -2000], [-625, -1900], [1250, -350], [-2700, -350]]) SpawnAt(V(x, y, 0), Z1);
    M.Decor(V2(-2900, -4400), V2(1400, -100), 40, ['D_Grime', 'D_Crack', 'P_Bones', 'Blood']);
  });

  // ------------------------------------------------------------------ 2. THE ROUNDHOUSE (turntable court, engine stalls along the back)
  M.at({ x: -2000, y: 400 }, () => {
    // the turntable: a ring of stone, a pit of black ice, a girder bridge with an engine stood on it
    Cyl(V(-900, 1900, 3), 1500, 6, 0x5a6068, false, false); Cyl(V(-900, 1900, 5), 1380, 6, 0x1e2630, false, false); Cyl(V(-900, 1900, 6.5), 1300, 2, 0x2a3a4a, false, false);
    for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; Box(V(-900 + Math.cos(a) * 720, 1900 + Math.sin(a) * 720, 14), V(120, 60, 20), 0x6a7078, false, false, k * 22.5 + 90); }
    Box(V(-900, 1900, 20), V(1400, 260, 24), 0x33363c, false, false); K.rails(-1590, 1900, -210, 1900); for (const s of [-1, 1]) Box(V(-900, 1900 + s * 136, 70), V(1400, 10, 10), 0x5a5e66, false, false);
    K.loco(-760, 1900, 0, 0x2a3a34, SNOW, false);
    // the shed: six walls, five stalls, two with engines in them
    const SX = [-2700, -1960, -1220, -480, 260, 1000];
    for (const x of SX) { Box(V(x, 3900, 290), V(60, 1000, 580), 0x6a4a3a, true, true); Box(V(x, 3400, 586), V(70, 20, 12), SNOW, false, false); }
    Box(V(-850, 4420, 290), V(3760, 60, 580), 0x6a4a3a, true, true);
    Box(V(-850, 3900, 620), V(3800, 1080, 30), 0x2e2a30, false, false); Box(V(-850, 3900, 642), V(3740, 1020, 16), SNOW, false, false);
    for (let i = 0; i < 5; i++) { const cx = (SX[i] + SX[i + 1]) / 2; Box(V(cx, 3400, 560), V(680, 40, 60), 0x4a3226, false, false); K.rails(cx, 2700, cx, 4380); Sign(V(cx, 3376, 560), -90, 'No. ' + (i + 1), { r: 0.95, g: 0.9, b: 0.8 }, 30); K.lantern(cx, 3600, 560, LAMP, 900); }
    K.loco((SX[1] + SX[2]) / 2, 3900, 90, 0x23262c, 0, false); K.loco((SX[4] + SX[5]) / 2, 3820, -90, 0x3a2a2a, 0, true);
    // stall 1: wheel sets and a work bench. stall 3: an inspection pit boarded over. stall 4: drums and a lathe.
    { const cx = (SX[0] + SX[1]) / 2; for (let i = 0; i < 3; i++) { for (const s of [-1, 1]) Ring(V(cx - 150 + i * 150, 4200 + s * 0, 70), V(140, 16, 140), 0x5a5e66, R(0, 90, 0)); Box(V(cx - 150 + i * 150, 4200, 70), V(14, 150, 14), 0x33363c, false, false); } Box(V(cx + 200, 3800, 86), V(120, 400, 12), TIMBER, true, true); for (const s of [-1, 1]) Box(V(cx + 200, 3800 + s * 180, 40), V(100, 16, 80), TIMBER_D, false, false); Glow(V(cx + 200, 3700, 110), V(14, 14, 26), LAMP); }
    { const cx = (SX[2] + SX[3]) / 2; Floor(V2(cx - 90, 3500), V2(cx + 90, 4300), 3, 0x1c1a1c); for (let y = 3540; y < 4300; y += 160) Box(V(cx, y, 6), V(200, 90, 8), TIMBER, false, false); Barrel(V(cx - 240, 4300, 0), 0x3a4a5a); Barrel(V(cx + 250, 4320, 0), 0x6a3a2a); }
    { const cx = (SX[3] + SX[4]) / 2; Box(V(cx - 180, 4240, 60), V(260, 150, 120), 0x3a3e46, true, true); Cyl(V(cx - 180, 4240, 150), 80, 200, 0x5a5e66, false, false, R(90, 0, 0)); Crate(V(cx + 200, 4280, 0), 130); Crate(V(cx + 210, 4130, 0), 100); }
    // out in the court: the coal stage, the water crane, a stack of rails, sand
    { const x = 900, y = 800; Box(V(x, y, 130), V(800, 500, 260), TIMBER, true, true); Ramp(V(x - 1100, y, 0), V(x - 400, y, 260), 300, TIMBER_D); for (let i = 0; i < 9; i++) Pyramid(V(x + rr(-320, 320), y + rr(-180, 180), 290 + rr(0, 30)), V(rr(160, 240), rr(160, 240), rr(70, 120)), 0x101014, R(0, rr(0, 90), 0)); for (const s of [-1, 1]) Box(V(x, y + s * 252, 300), V(800, 10, 90), TIMBER_D, false, false); }
    { const x = -2500, y = 2600; Cyl(V(x, y, 200), 50, 400, 0x33363c, true, true); Box(V(x + 110, y, 390), V(240, 30, 30), 0x33363c, false, false); Box(V(x + 220, y, 330), V(24, 24, 110), 0x4a3a30, false, false); Cyl(V(x, y, 410), 80, 20, SNOW, false, false); }
    for (let k = 0; k < 4; k++) for (let j = 0; j < 4 - k; j++) Box(V(-2450, 700 + (j - (3 - k) / 2) * 34, 14 + k * 26), V(900, 22, 22), 0x5a5e66, k === 0, false);
    M.Blocker(V(-2450, 700, 50), V(900, 150, 100)); GM.NavBlockBox({ min: V(-2900, 620, 0), max: V(-2000, 780, 100) }, 1);
    for (const [x, y] of [[-200, 600], [-1700, 700], [300, 2700], [-2300, 1500], [600, 1700]]) K.post(x, y, 400, LAMP, TIMBER_D, 1000);
    for (const [x, y, w, d] of [[1250, 2900, 380, 600], [-2700, 3200, 400, 260], [1200, 250, 440, 280], [-1300, 3250, 500, 220], [200, 3250, 520, 200]]) drift(x, y, w, d);
    Sign(V(-850, 3376, 660), -90, 'N. & F. R.R.  ENGINE SHED', { r: 0.95, g: 0.9, b: 0.8 }, 56);
    Station('AmmoCrate', V(1380, 3300, 0), 180, 2000, -1, 'Ammo');
    wallbuy('Homesteader', -2964, 2000, 0); wallbuy('Lawman AR', 1466, 880, 180);
    for (const [x, y] of [[-2650, 1750], [1150, 2600], [-1900, 300], [300, 300], [-600, 3050], [1250, 3900], [-2330, 3050]]) SpawnAt(V(x, y, 0), Z2);
    M.Decor(V2(-2900, 100), V2(1400, 3300), 36, ['D_Grime', 'D_Crack', 'P_Bones', 'D_Grime']);
  });

  // ------------------------------------------------------------------ 3. TIMBERLINE PASS (wide open: pines, boulders, a snow shed, a wreck)
  M.at({ rot: 90, x: 8000, y: -2500 }, () => {
    // the snow shed: a timber tunnel over the old line, the one covered way across the pass
    K.rails(2500, -4440, 2500, 4440);
    for (const s of [-1, 1]) { Box(V(2500 + s * 380, 0, 230), V(50, 2600, 460), TIMBER, true, true); for (let y = -1200; y <= 1200; y += 300) { Box(V(2500 + s * 350, y, 240), V(40, 40, 480), TIMBER_D, false, false); BoxRot(V(2500 + s * 440, y, 170), V(180, 30, 30), TIMBER_D, R(s * 55, 0, 0), false); } }
    BoxRot(V(2330, 0, 530), V(420, 2660, 20), TIMBER_D, R(18, 0, 0), false); BoxRot(V(2670, 0, 530), V(420, 2660, 20), TIMBER_D, R(-18, 0, 0), false); BoxRot(V(2330, 0, 548), V(380, 2600, 20), SNOW, R(18, 0, 0), false); BoxRot(V(2670, 0, 548), V(380, 2600, 20), SNOW, R(-18, 0, 0), false);
    for (const y of [-900, 0, 900]) K.lantern(2500, y, 440, LAMP, 900);
    drift(2040, -600, 300, 900, 260); drift(2960, 500, 300, 1100, 300);
    // what the avalanche did to the eastbound: the engine on its side, cars thrown across the slope
    BoxRot(V(5000, 600, 140), V(900, 280, 300), 0x23262c, R(0, 24, 78), true); Cyl(V(5120, 650, 210), 250, 560, 0x2a2e36, true, false, R(86, 24, 0)); Cyl(V(4750, 470, 300), 80, 140, 0x18181c, false, false, R(60, 24, 0));
    BoxRot(V(5750, -200, 190), V(860, 320, 340), 0x6a3a2a, R(8, -38, 14), true); BoxRot(V(5750, -200, 380), V(820, 300, 16), SNOW, R(8, -38, 14), false);
    BoxRot(V(4300, 1500, 150), V(860, 320, 340), 0x4a5a4a, R(-6, 70, 64), true);
    M.Blocker(V(5000, 600, 200), V(900, 500, 400)); GM.NavBlockBox({ min: V(4550, 350, 0), max: V(5450, 850, 300) }, 1); GM.NavBlockBox({ min: V(5350, -550, 0), max: V(6150, 150, 300) }, 1); GM.NavBlockBox({ min: V(4100, 1050, 0), max: V(4500, 1950, 300) }, 1);
    for (const [x, y, s] of [[5600, 1100, 1.3], [6200, 500, 1.0], [5200, 1500, 0.8], [6400, 1300, 1.5], [4700, 1100, 0.7]]) { Ball(V(x, y, 60 * s), V(520 * s, 440 * s, 300 * s), SNOW, false); if (s > 0.9) { Oct(V(x, y, 50 * s), V(260 * s, 260 * s, 100 * s), SNOW_D, true, true); } }
    for (const [x, y, yaw] of [[5900, 1500, 30], [4900, 1750, -50], [6300, 900, 80]]) { BoxRot(V(x, y, 60), V(520, 40, 40), 0x3a2a20, R(10, yaw, 0), false); ConeShape(V(x + Math.cos(yaw * 0.01745) * 200, y + Math.sin(yaw * 0.01745) * 200, 80), V(160, 160, 300), 0x1c382e, false, R(80, yaw, 0)); }
    // the fire tower: four legs, a cab, a stair, and the only long view on the map
    { const x = 5600, y = -3000; Box(V(x, y, 210), V(420, 420, 420), TIMBER_D, true, true); for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) Box(V(x + sx * 196, y + sy * 196, 300), V(34, 34, 600), TIMBER, false, false);
      Box(V(x, y, 428), V(560, 560, 16), TIMBER, true, false); for (const s of [-1, 1]) { Box(V(x, y + s * 272, 480), V(560, 10, 90), TIMBER_D, false, false); Box(V(x + s * 272, y, 480), V(10, 560, 90), TIMBER_D, false, false); }
      Box(V(x, y, 640), V(600, 600, 16), 0x2e2a30, false, false); Box(V(x, y, 656), V(560, 560, 14), SNOW, false, false);
      Ramp(V(x - 1200, y + 150, 0), V(x - 280, y + 150, 428), 240, TIMBER); K.lantern(x, y, 620, LAMP, 1200); }
    // a trapper's cabin under the north wall, smoke still going
    K.cabin(5300, 3500, 6100, 4100, 300, TIMBER, 0x2e2a30, { door: -90, snow: SNOW, logs: TIMBER_D, glow: LAMP });
    for (let i = 0; i < 4; i++) Box(V(6260, 3600 + i * 60, 30 + (i % 2) * 20), V(60, 200, 50), 0x6a4a2e, false, false); Crate(V(5150, 3700, 0), 110);
    Box(V(5000, 3400, 110), V(14, 14, 220), TIMBER_D, true, false); Box(V(5400, 3400, 110), V(14, 14, 220), TIMBER_D, true, false); Box(V(5200, 3400, 214), V(420, 10, 10), TIMBER_D, false, false); for (let i = 0; i < 5; i++) Box(V(5040 + i * 80, 3400, 150), V(40, 6, 120), [0x8a6a4a, 0xb8a888, 0x6a5a4a][i % 3], false, false);   // pelts on a rack
    // pines in stands, boulders shouldering out of the snow
    for (const [x, y, n, r] of [[3700, -3300, 7, 520], [6200, -1500, 6, 460], [3600, 3300, 7, 520], [4400, -900, 4, 360], [6400, 2700, 5, 400], [3300, 1700, 4, 320], [2000, -3600, 3, 240], [2000, 3500, 3, 260]]) for (let i = 0; i < n; i++) { const a = i / n * 6.283 + rr(-0.4, 0.4), d = i === 0 ? 0 : rr(0.45, 1) * r; K.pine(x + Math.cos(a) * d, y + Math.sin(a) * d, rr(520, 880), SNOW); }
    for (const [x, y, s] of [[4300, -2300, 1.2], [3300, -600, 0.9], [6000, -500, 0.0], [3900, 2400, 1.0], [6500, -3900, 1.3], [3000, 3900, 0.8], [4600, 3900, 1.1], [3000, -2200, 0.7]]) if (s) { Oct(V(x, y, 110 * s), V(340 * s, 300 * s, 220 * s), SLATE[(x | 0) % 3], true, true, R(0, rr(0, 45), 0)); Box(V(x + 60 * s, y - 30 * s, 190 * s), V(200 * s, 180 * s, 110 * s), SLATE[1], true, false, rr(0, 45)); Ball(V(x, y, 236 * s), V(300 * s, 260 * s, 60 * s), SNOW); }
    for (const [x, y] of [[1900, -1700], [1900, 1700], [3700, -1500], [3700, 600], [5400, -1700], [4600, 2800]]) K.post(x, y, 420, 0x8AD8FF, TIMBER_D, 1000);
    for (let i = 0; i < 16; i++) drift(rr(1800, 6700), rr(-4200, 4200), rr(300, 700), rr(240, 520), rr(80, 160));
    Sign(V(1536, 0, 420), 0, 'TIMBERLINE PASS', { r: 0.95, g: 0.9, b: 0.8 }, 48);
    wallbuy('Frostbite Beam', 6896, -200, 180); wallbuy('Quarter Horse', 1536, 1000, 0); wallbuy('Back-Alley', 3600, -4396, 90);
    for (const [x, y] of [[6600, -4100], [6600, 4150], [6650, -900], [4300, -4200], [4200, 4200], [1900, -4200], [1900, 4200], [3400, 0], [6650, 2000]]) SpawnAt(V(x, y, 0), Z3);
  });

  // ------------------------------------------------------------------ 4. THE FROZEN LAKE (open ice, fishing shacks, an engine that went through)
  M.at({ x: -2000, y: 1100 }, () => {
    // cracks run out from where she went in
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283 + rr(-0.2, 0.2), l = rr(500, 1300); Box(V(-5200 + Math.cos(a) * l / 2, -3200 + Math.sin(a) * l / 2, 3.6), V(l, rr(6, 14), 1), 0x5a8aa6, false, false, a * 57.3); }
    Cyl(V(-5200, -3200, 3.4), 760, 1, 0x16222e, false, false);
    BoxRot(V(-5200, -3200, 150), V(880, 280, 300), 0x23262c, R(28, 20, 8), true); Cyl(V(-5080, -3160, 300), 250, 560, 0x2a2e36, true, false, R(62, 20, 0)); Cyl(V(-4900, -3090, 520), 80, 150, 0x18181c, false, false, R(-28, 20, 0)); BoxRot(V(-5440, -3290, 60), V(280, 300, 300), 0x2a2e36, R(28, 20, 8), true);
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; BoxRot(V(-5200 + Math.cos(a) * rr(420, 620), -3200 + Math.sin(a) * rr(360, 520), 30), V(rr(180, 320), rr(140, 240), 26), 0xcfe6f2, R(rr(-22, 22), rr(0, 180), rr(-22, 22)), false); }
    M.Blocker(V(-5200, -3200, 200), V(900, 500, 400)); GM.NavBlockBox({ min: V(-5650, -3450, 0), max: V(-4750, -2950, 300) }, 1);
    // the shacks, each over its hole
    for (const [x, y, c, d] of [[-6200, -2300, 0x5a4a6a, 0], [-3900, -2500, 0x6a3a2a, 180], [-4100, -4000, 0x3a5a4a, 90], [-6300, -3900, 0x6a5a3a, 0]]) {
      K.cabin(x - 170, y - 150, x + 170, y + 150, 230, c, 0x2e2a30, { door: d, snow: SNOW, chimney: d !== 90, glow: LAMP, rise: 90 });
      const n = [Math.round(Math.cos(d * 0.01745)), Math.round(Math.sin(d * 0.01745))]; Cyl(V(x + n[0] * 360, y + n[1] * 360, 3.6), 110, 1, 0x101a24, false, false); BoxRot(V(x + n[0] * 360 + 60, y + n[1] * 360, 60), V(8, 8, 130), TIMBER_D, R(0, 0, 20), false);
    }
    // sledges, a rack of fish, a fire long out
    for (const [x, y, yaw] of [[-4700, -2100, 20], [-6000, -3100, -40]]) { for (const s of [-1, 1]) Box(M.L(V(x, y, 0), yaw, 0, s * 50, 14), V(300, 10, 10), TIMBER_D, false, false, yaw); Box(M.L(V(x, y, 0), yaw, 0, 0, 30), V(240, 110, 12), TIMBER, true, false, yaw); Crate(M.L(V(x, y, 0), yaw, -20, 0, 36), 80); }
    for (const s of [-1, 1]) Box(V(-5300 + s * 180, -1950, 100), V(12, 12, 200), TIMBER_D, true, false); Box(V(-5300, -1950, 196), V(380, 8, 8), TIMBER_D, false, false); for (let i = 0; i < 6; i++) Box(V(-5450 + i * 60, -1950, 150), V(16, 5, 80), 0x8a9aa8, false, false);
    // a spit of rock with one dead tree and a cairn
    Oct(V(-3600, -3300, 40), V(520, 420, 80), SLATE[1], true, true); Ball(V(-3600, -3300, 86), V(460, 360, 50), SNOW); DeadTree(V(-3650, -3350, 80), 460); for (let k = 0; k < 4; k++) Cyl(V(-3480, -3200, 96 + k * 26), 90 - k * 14, 24, SLATE[k % 3], false, false);
    for (const [x, y, w, d] of [[-6800, -3000, 300, 1400], [-5000, -4400, 1800, 240], [-3200, -3600, 260, 900], [-6400, -1700, 900, 260], [-3700, -1700, 700, 240]]) drift(x, y, w, d, 130);
    for (const [x, y] of [[-6600, -1900], [-3400, -2000], [-5000, -4300], [-6700, -4300]]) K.post(x, y, 380, 0x8AD8FF, TIMBER_D, 1000);
    wallbuy('Copperhead', -6896, -3000, 0);
    for (const [x, y] of [[-6700, -4250], [-3350, -4250], [-6750, -2000], [-3400, -2150], [-4600, -4300], [-6000, -1750]]) SpawnAt(V(x, y, 0), Z4);
  });

  // ------------------------------------------------------------------ 5. BUNKHOUSE ROW (crew cabins: a street, alleys, washing left out to freeze)
  M.at({ x: 6500, y: -1100 }, () => {
    const CX = [[-6650, -5900], [-5400, -4700], [-4200, -3500]];
    CX.forEach(([x0, x1], i) => {
      K.cabin(x0, 3650, x1, 4250, 300, TIMBER, 0x2e2a30, { door: -90, snow: SNOW, logs: TIMBER_D, glow: LAMP, dark: i === 1 });
      K.cabin(x0, 1900, x1, 2500, 300, i === 1 ? 0x6a3a2a : TIMBER, 0x2e2a30, { door: 90, snow: SNOW, logs: TIMBER_D, glow: LAMP, dark: i === 2 });
      for (const y of [3640, 2510]) { Box(V((x0 + x1) / 2, y + (y > 3000 ? -40 : 40), 12), V(220, 80, 24), TIMBER_D, true, false); }
    });
    // down the middle of the street: woodpiles, the wash line, the cookhouse bell
    for (const [x, n] of [[-6300, 5], [-4000, 4]]) { for (let k = 0; k < 3; k++) for (let j = 0; j < n - k; j++) Cyl(V(x + (j - (n - 1 - k) / 2) * 62, 3075, 30 + k * 54), 60, 300, k % 2 ? 0x6a4a2e : 0x5a3e28, false, false, R(0, 0, 90)); Box(V(x, 3075, 190), V(n * 62 + 30, 320, 12), SNOW, false, false); M.Blocker(V(x, 3075, 90), V(n * 62, 300, 180)); GM.NavBlockBox({ min: V(x - n * 31, 2925, 0), max: V(x + n * 31, 3225, 180) }, 1); }
    for (const x of [-5500, -4700]) Box(V(x, 3075, 130), V(14, 14, 260), TIMBER_D, true, false); Box(V(-5100, 3075, 250), V(800, 4, 4), 0x1c1a1c, false, false);
    for (let i = 0; i < 6; i++) Box(V(-5420 + i * 128, 3075, 200), V(90, 4, 90 + (i % 3) * 20), [0xc8322a, 0xdfe8ee, 0x3a4a6a, 0xb8a888][i % 4], false, false);
    { const x = -5150, y = 2700; Box(V(x, y, 160), V(16, 16, 320), TIMBER_D, true, false); Box(V(x + 40, y, 316), V(100, 10, 10), TIMBER_D, false, false); ConeShape(V(x + 80, y, 270), V(60, 60, 60), 0xb9974a, false); }
    // an outhouse at the end of each alley, a sled, a chopping block
    for (const [x, y] of [[-5650, 4330], [-4450, 1640]]) { Box(V(x, y, 130), V(140, 140, 260), 0x4a3a30, true, true); BoxRot(V(x, y, 280), V(170, 170, 12), 0x2e2a30, R(10, 0, 0), false); Box(V(x, y, 296), V(150, 150, 12), SNOW, false, false); }
    Cyl(V(-6800, 3075, 30), 90, 60, 0x5a3e28, true, true); BoxRot(V(-6790, 3075, 90), V(8, 8, 90), TIMBER, R(0, 0, 30), false); Barrel(V(-3300, 3300, 0), 0x4a3a30);
    for (const [x, y] of [[-5650, 3075], [-4450, 3075], [-6800, 2700], [-3300, 2700], [-5650, 1750], [-4450, 4350]]) K.post(x, y, 360, LAMP, TIMBER_D, 800);
    for (const [x, y, w, d] of [[-6850, 4200, 260, 400], [-3250, 4250, 300, 380], [-6850, 1800, 240, 360], [-5650, 3800, 300, 420], [-4450, 2200, 300, 420], [-3250, 1800, 260, 300]]) drift(x, y, w, d);
    Sign(V(-5050, 2516, 250), 90, 'COOKHOUSE', { r: 0.95, g: 0.9, b: 0.8 }, 36);
    wallbuy('Back-Alley', -6896, 3075, 0);
    for (const [x, y] of [[-6820, 3400], [-3250, 2250], [-6820, 1700], [-5650, 4050], [-4450, 2050], [-3300, 4300]]) SpawnAt(V(x, y, 0), Z5);
  });

  for (const [x, y, yaw, cost, a, b] of DOORS) Door(V(x, y, 0), yaw, cost, a, b);
}

export const FROST_LOOT = { chests: { 0: [0], 1: [0, 1], 2: [1], 3: [1, 2, 2], 4: [1], 5: [0, 1] }, relics: [[11000, 3100, 438, 270], [-3150, -1850, 478, 0]], box: [-6150, 2780, -90, 0], avoid: (x, y) => Math.abs(y) < 320, boxZones: [1, 2, 3, 4, 5] };

// snow, always: a slow fall across whatever you are looking at
let acc = 0;
export function frostAmbient(g, dt) {
  acc += dt * 70; const c = g.camera.position;
  while (acc > 1) { acc -= 1; g.fx.add({ pos: new THREE.Vector3(c.x + (Math.random() - 0.5) * 3600, c.y + 100 + Math.random() * 900, c.z + (Math.random() - 0.5) * 3600), vel: new THREE.Vector3(-70 + Math.random() * 40, -170 - Math.random() * 90, 30), life: 3.6, size0: 7, size1: 7, c0: [1, 1, 1, 0.85], fadeIn: 0.2, fadeOut: 0.5, tex: 'FX_Disc', kind: 'fx' }); }
}

// The night train: nothing is on the line and it comes through anyway, a few times a round. It does not stop for gates,
// and anything standing between the rails when it passes goes with it. The dead do not know to get out of the way.
export const FROST_MECH = { train: { y: 0, x0: -9000, x1: 12500, half: 200, speed: 3400, every: 70, first: 50, cars: 4, damage: 70 } };
export const FROST_QUEST = { name: 'CALL THE LAST TRAIN', after: 'The last train is in', gate: [5000, 950, 0], steps: [
  { type: 'shoot', text: 'Shoot out the five red signals along the main line', r: 46, color: 0xff3a2a, done: 'THE LINE IS CLEAR',
    at: [[-7600, -372, 470], [-4400, 372, 470], [-1500, -372, 470], [2200, 372, 470], [6400, -372, 470]] },
  { type: 'collect', text: 'Bring three sacks of coal for the engine', item: 'Coal', n: 3, color: 0xff8a3a, done: 'THE FIRE IS LAID',
    spots: [[-7400, -2900, 0], [-8300, -1000, 0], [-3800, -4300, 0], [-1300, -2600, 0], [-900, 4300, 0], [-4500, 3300, 0], [2700, 2900, 0]] },
  { type: 'order', text: 'Throw the three point levers in order (count the lamps)', prompt: 'Throw the lever', color: 0x8AD8FF, done: 'THE ROAD IS SET', wrong: 'The points clatter back. Start again.',
    at: [[-6600, 330, 0, -90], [-2900, 330, 0, -90], [1900, 330, 0, -90]] },
  { type: 'hold', text: 'Hold the crossing in the pass until the train comes in', at: [5000, 0, 0], r: 650, time: 45, color: 0x8AD8FF, done: 'THE LAST TRAIN IS IN' },
] };
