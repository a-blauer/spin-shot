// CARNIVAL OF ASH. The fifth map: a travelling show that burned down and went on with the performance.
// Six districts: the front gate (start), a long midway of booths (two lanes), the big top in the middle (a wide round
// arena with bleachers to climb), a hall of mirrors (tight parallel galleries), the menagerie (cage wagons in rows)
// and the fairground at the back under the wheel (open).
import * as THREE from 'three';
import { V, V2, R, LC, FMath } from './mapkit.js';
import { mapKit, rgb } from './mapx.js';

const ASH = 0x4a4440, RED = 0x8a2a26, CREAM = 0xcfc6ac, GOLD = 0xb8923a, WOOD = 0x4a3a30, WOOD_D = 0x2e2420, IRON = 0x23262c, WARM = 0xd89a2a;
const BULB = [0xd89a2a, 0xb8322a, 0x2a8a8a];
const rr = (a, b) => FMath.FRandRange(a, b);

export function buildCarnival(M) {
  const { Box, BoxRot, BoxYaw, Glow, Cyl, Ball, ConeShape, Ramp, Floor, Wall, Lamp, Sign, Barrel, Crate, Station, WallBuy, Door, SpawnAt, Pyramid, Oct, Ring, AddZone, Wagon, GM } = M;
  const K = mapKit(M);
  GM.navInit(-8000, -7000, 8000, 7500, 100);
  const L = (x, y, yaw, dx, dy, z) => M.L(V(x, y, 0), yaw, dx, dy, z);
  const wallbuy = (name, x, y, yaw) => { const n = [Math.cos(yaw * Math.PI / 180), Math.sin(yaw * Math.PI / 180)]; Box(V(x - n[0] * 4, y - n[1] * 4, 150), Math.abs(n[0]) > 0.5 ? V(12, 300, 230) : V(300, 12, 230), WOOD_D, false, false); WallBuy(name, V(x, y, 0), yaw); };
  // a string of coloured bulbs between two points, sagging
  const bulbs = (x0, y0, z0, x1, y1, z1, n = 9) => { const at = (t) => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t - Math.sin(t * Math.PI) * 60];
    for (let i = 0; i <= n; i++) { const [x, y, z] = at(i / n); Glow(V(x, y, z), V(15, 15, 18), BULB[i % 3], 2); }
    for (let i = 0; i < n * 2; i++) { const [ax, ay, az] = at(i / (n * 2)), [bx, by, bz] = at((i + 1) / (n * 2)), h = Math.hypot(bx - ax, by - ay); BoxRot(V((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2 + 9), V(Math.hypot(h, bz - az) + 3, 2, 2), 0x1a1a1a, R(Math.atan2(bz - az, h) * 57.3, Math.atan2(by - ay, bx - ax) * 57.3, 0), false); } Lamp(V((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2 - 80), LC(1, 0.7, 0.4), 8, 800, false); };   // the wire they hang from
  const pole = (x, y, h = 520) => { Cyl(V(x, y, h / 2), 22, h, WOOD_D, true, false); Ball(V(x, y, h + 10), V(34, 34, 34), GOLD); };
  // a midway booth: back and side walls, a counter, a striped awning, a painted board over it
  const booth = (x, y, yaw, name, col = RED, prize = 0) => {
    Box(L(x, y, yaw, -150, 0, 170), V(20, 520, 340), WOOD, true, false, yaw); for (const s of [-1, 1]) Box(L(x, y, yaw, -20, s * 250, 170), V(280, 20, 340), WOOD, true, false, yaw);
    Box(L(x, y, yaw, 110, 0, 52), V(44, 520, 104), col, true, false, yaw); Box(L(x, y, yaw, 110, 0, 108), V(70, 540, 10), WOOD_D, false, false, yaw);
    BoxRot(L(x, y, yaw, 20, 0, 372), V(400, 580, 12), col, R(-10, yaw, 0), false); for (let i = -2; i <= 2; i++) if (i % 2) BoxRot(L(x, y, yaw, 20, i * 116, 379), V(400, 116, 4), CREAM, R(-10, yaw, 0), false);
    for (let i = -4; i <= 4; i++) Box(L(x, y, yaw, 222, i * 60, 300 - (i & 1) * 14), V(6, 60, 40), i % 2 ? CREAM : col, false, false, yaw);
    Box(L(x, y, yaw, 150, 0, 440), V(12, 440, 76), WOOD_D, false, false, yaw); Sign(L(x, y, yaw, 158, 0, 440), yaw, name, { r: 0.92, g: 0.82, b: 0.55 }, name.length > 12 ? 30 : 38);
    for (let i = -2; i <= 2; i++) { Box(L(x, y, yaw, -134, i * 90, 230), V(8, 70, 8), WOOD_D, false, false, yaw); if (prize === 1) Glow(L(x, y, yaw, -130, i * 90, 262), V(24, 30, 44), BULB[(i + 2) % 3]); else if (prize === 2) Cyl(L(x, y, yaw, -130, i * 90, 256), 30, 44, [0xb8322a, 0xcfc6ac, 0x3a5a7a][(i + 2) % 3], false, false); else Ball(L(x, y, yaw, -130, i * 90, 262), V(44, 44, 50), [0xc8b83a, 0x7a2a5a, 0x3a6a9a][(i + 2) % 3]); }
    Glow(L(x, y, yaw, 60, 0, 350), V(14, 14, 20), WARM, 2); Lamp(L(x, y, yaw, 150, 0, 300), LC(1, 0.7, 0.4), 8, 700, false);
    K.solid(x, y, yaw, 320, 540, 150);
  };
  // a cage wagon: bars you can shoot through, whatever was in it still in it
  const cage = (x, y, inside) => {
    Box(V(x, y, 96), V(800, 300, 40), RED, true, false); for (const sx of [-1, 1]) for (const sy of [-1, 1]) { Ring(V(x + sx * 270, y + sy * 156, 76), V(150, 16, 150), GOLD, R(0, 0, 0)); Box(V(x + sx * 270, y + sy * 156, 76), V(140, 6, 10), GOLD, false, false); }
    Box(V(x, y, 372), V(840, 330, 30), RED, true, false); Box(V(x, y, 392), V(700, 200, 20), 0x6a1c1c, false, false); for (let i = -6; i <= 6; i++) Box(V(x + i * 64, y - 168, 346 - (i & 1) * 10), V(64, 6, 30), i % 2 ? GOLD : CREAM, false, false);
    for (const sx of [-1, 1]) { Box(V(x + sx * 390, y, 236), V(20, 300, 240), CREAM, true, false); Box(V(x + sx * 402, y, 236), V(6, 200, 150), GOLD, false, false); }
    for (let i = -5; i <= 5; i++) { if (inside === 3 && Math.abs(i) < 2) { BoxRot(V(x + i * 64, y - 160, 180), V(8, 8, 150), IRON, R(0, 0, 40 * (i || 1)), false); continue; } for (const sy of [-1, 1]) Box(V(x + i * 64, y + sy * 142, 236), V(8, 8, 240), IRON, false, false); }
    Box(V(x, y, 120), V(760, 280, 8), 0x8a7440, false, false);
    if (inside === 1) { for (let i = 0; i < 5; i++) { const h = 150 - Math.abs(i - 2) * 20; BoxRot(V(x - 160 + i * 70, y, 118 + h * 0.47), V(20, 20, h), 0xcfc8b0, R(0, 0, 20), false); } Oct(V(x + 220, y, 170), V(120, 110, 100), 0xcfc8b0, false, false); }
    if (inside === 2) { Ball(V(x, y, 150), V(300, 180, 80), 0x3a2e26); for (let i = 0; i < 4; i++) Box(V(x + rr(-200, 200), y + rr(-60, 60), 130), V(rr(60, 110), 14, 14), 0xcfc8b0, false, false, rr(0, 180)); }
    M.Blocker(V(x, y, 200), V(800, 300, 400)); K.solid(x, y, 0, 800, 300, 150);
  };

  // ------------------------------------------------------------------ zones
  // The show starts where it ended: in the centre ring. Every attraction opens off the big top, the midway and the
  // fairground join them round the outside, and the way out through the front gate is the last thing you reach.
  const Z2 = AddZone('The Big Top', V2(-2500, -500), V2(2500, 4000));
  const Z1 = AddZone('The Midway', V2(-7000, -3000), V2(7000, -500));
  const Z0 = AddZone('The Front Gate', V2(-2500, -6000), V2(2500, -3000));
  const Z3 = AddZone('Hall of Mirrors', V2(-7000, -500), V2(-2500, 4000));
  const Z4 = AddZone('The Menagerie', V2(2500, -500), V2(7000, 4000));
  const Z5 = AddZone('Under the Wheel', V2(-7000, 4000), V2(7000, 6500));
  M.Districts([['The Front Gate', [Z0]], ['The Midway', [Z1]], ['The Big Top', [Z2]], ['Hall of Mirrors', [Z3]], ['The Menagerie', [Z4]], ['Under the Wheel', [Z5]]]);

  // ------------------------------------------------------------------ ground, the fence, the canvas sidewalls
  Box(V(0, 0, -50), V(16000, 14500, 100), ASH, true, false);
  Floor(V2(-7000, -3000), V2(7000, -500), 1, 0x5a5248); Floor(V2(-2500, -6000), V2(2500, -3000), 1, 0x524a42); Floor(V2(2500, -500), V2(7000, 4000), 1, 0x62553a); Floor(V2(-7000, 4000), V2(7000, 6500), 1, 0x3e3c30);
  const FENCE = 0x2a2220;
  for (const [a, b] of [[V2(-7000, -3000), V2(-7000, 6500)], [V2(7000, -3000), V2(7000, 6500)], [V2(-7000, 6500), V2(7000, 6500)], [V2(-7000, -3000), V2(-2500, -3000)], [V2(2500, -3000), V2(7000, -3000)], [V2(-2500, -6000), V2(-2500, -3000)], [V2(2500, -6000), V2(2500, -3000)], [V2(-2500, -6000), V2(2500, -6000)]]) Wall(a, b, 950, 200, FENCE, [], true, 0x1c1614);
  const canvas = (a, b, gaps) => { Wall(a, b, 520, 50, CREAM, gaps.map((g) => V2(g - 200, g + 200)), true, RED, WOOD_D); const len = Math.hypot(b.X - a.X, b.Y - a.Y), ax = Math.abs(b.X - a.X) > 1, n = Math.round(len / 240); for (let i = 0; i < n; i += 2) { const d = (i + 0.5) * 240; if (gaps.some((g) => Math.abs(g - d) < 340)) continue; Box(V(a.X + (ax ? d : 0), a.Y + (ax ? 0 : d), 260), ax ? V(240, 58, 518) : V(58, 240, 518), RED, false, false); } };
  canvas(V2(-2500, -3000), V2(2500, -3000), [2500]); canvas(V2(-7000, -500), V2(7000, -500), [2250, 7000, 11750]); canvas(V2(-7000, 4000), V2(7000, 4000), [2250, 7000, 11750]);
  canvas(V2(-2500, -500), V2(-2500, 4000), [2250]); canvas(V2(2500, -500), V2(2500, 4000), [2250]);
  const DOORS = [[0, -500, 90, 1500, Z2, Z1], [-2500, 1750, 0, 2000, Z2, Z3], [2500, 1750, 0, 2000, Z2, Z4], [0, 4000, 90, 2500, Z2, Z5], [-4750, -500, 90, 3000, Z1, Z3], [4750, -500, 90, 3000, Z1, Z4], [-4750, 4000, 90, 3500, Z3, Z5], [4750, 4000, 90, 3500, Z4, Z5], [0, -3000, 90, 4000, Z1, Z0]];
  for (const [x, y, yaw] of DOORS) { const ax = yaw === 90; for (const s of [-1, 1]) { const px = x + (ax ? s * 236 : 0), py = y + (ax ? 0 : s * 236); Cyl(V(px, py, 320), 60, 640, RED, true, false); for (const z of [120, 300, 480]) Cyl(V(px, py, z), 64, 40, CREAM, false, false); Ball(V(px, py, 660), V(80, 80, 80), GOLD); } bulbs(x - (ax ? 236 : 0), y - (ax ? 0 : 236), 640, x + (ax ? 236 : 0), y + (ax ? 0 : 236), 640, 7); }
  // posters and scorch along the outer fence
  for (let t = -6600; t <= 6600; t += 700) { M.SurfaceDecal('D_Grime', V(t, 6398, 300), V(0, -1, 0), V2(600, 500), 0, [0, 0, 0, 0.5], 'fx'); if (Math.abs(t) > 2700) M.SurfaceDecal('D_Wanted', V(t + 120, -2898, 210), V(0, 1, 0), V2(110, 150), rr(-6, 6)); }

  // ------------------------------------------------------------------ 0. THE FRONT GATE
  {
    // the arch over the way in: two towers, the name in bulbs between them
    for (const s of [-1, 1]) { Box(V(s * 560, -3090, 400), V(240, 160, 800), RED, true, true); for (const z of [150, 400, 650]) Box(V(s * 560, -3090, z), V(246, 166, 90), CREAM, false, false); Pyramid(V(s * 560, -3090, 900), V(300, 220, 200), GOLD); Glow(V(s * 560, -3174, 500), V(60, 6, 110), WARM); }
    Box(V(0, -3090, 760), V(900, 70, 170), 0x6a1c1c, false, false);   // no collision: a boss that lands on the sidewall has to be able to step off it Sign(V(0, -3130, 770), -90, 'CARNIVAL OF ASH', { r: 0.95, g: 0.8, b: 0.4 }, 76); for (let i = 0; i <= 14; i++) Glow(V(-420 + i * 60, -3130, 860), V(16, 10, 18), BULB[i % 3], 2);
    Sign(V(0, -3130, 690), -90, 'ONE NIGHT ONLY  -  EVERY NIGHT', { r: 0.9, g: 0.84, b: 0.7 }, 26);
    // ticket boxes, the rope line, a turnstile nobody will turn
    for (const s of [-1, 1]) { K.cabin(s * 1150 - 170, -3780, s * 1150 + 170, -3440, 250, s > 0 ? RED : CREAM, 0x2e2420, { door: s > 0 ? 180 : 0, glow: WARM, chimney: false, rise: 100 }); Box(V(s * 1150, -3792, 150), V(160, 10, 90), WOOD_D, false, false); Glow(V(s * 1150, -3786, 150), V(120, 6, 60), WARM); Sign(V(s * 1150, -3790, 240), -90, 'TICKETS', { r: 0.2, g: 0.15, b: 0.12 }, 30);
      for (let i = 0; i < 4; i++) { Cyl(V(s * (300 + i * 180), -3950, 50), 16, 100, GOLD, i % 3 === 0, false); if (i < 3) Box(V(s * (390 + i * 180), -3950, 90), V(180, 5, 8), RED, false, false); } }
    for (const s of [-1, 1]) { Box(V(s * 140, -3300, 55), V(50, 50, 110), IRON, true, false); Box(V(s * 80, -3300, 96), V(120, 8, 8), IRON, false, false); }
    // wagons drawn up along the back fence, the calliope among them
    Wagon(V(-1700, -5500, 0), 8); Wagon(V(1800, -5450, 0), 172); Wagon(V(-2100, -4400, 0), 80);
    { const x = 1900, y = -4300; Box(V(x, y, 130), V(520, 260, 180), RED, true, true); Box(V(x, y, 226), V(540, 280, 14), GOLD, false, false); for (let i = 0; i < 9; i++) Cyl(V(x - 200 + i * 50, y, 300 + (4 - Math.abs(i - 4)) * 26), 30, 150 + (4 - Math.abs(i - 4)) * 52, 0xb8923a, false, false); for (const sx of [-1, 1]) for (const sy of [-1, 1]) Ring(V(x + sx * 170, y + sy * 136, 66), V(130, 14, 130), GOLD, R(0, 0, 0)); Sign(V(x, y - 134, 150), -90, 'CALLIOPE', { r: 0.95, g: 0.8, b: 0.4 }, 34); }
    for (const [x, y, t] of [[-2380, -5000, 'SEE THE TWINS'], [-2380, -3900, 'ZORA KNOWS'], [2380, -5200, 'GRIN'], [2380, -3600, 'THE HUMAN CANNONBALL']]) { Box(V(x, y, 300), V(16, 520, 420), 0xbcb49a, false, false); Box(V(x, y, 300), V(22, 540, 30), RED, false, false); Sign(V(x - Math.sign(x) * 12, y, 330), x < 0 ? 0 : 180, t, { r: 0.5, g: 0.12, b: 0.1 }, t.length > 12 ? 30 : 44); }
    for (const [x, y] of [[-700, -5400], [700, -5400], [-900, -4600], [900, -4600], [-400, -3700], [400, -3700]]) pole(x, y);
    bulbs(-700, -5400, 520, -900, -4600, 520); bulbs(-900, -4600, 520, -400, -3700, 520); bulbs(700, -5400, 520, 900, -4600, 520); bulbs(900, -4600, 520, 400, -3700, 520); bulbs(-700, -5400, 520, 700, -5400, 520, 13);
    Crate(V(-1500, -3500, 0), 120); Crate(V(-1640, -3540, 0), 90); Barrel(V(1500, -5000, 0), 0x5a2a26); Barrel(V(1380, -5080, 0), 0x3a3634); Barrel(V(-1200, -5700, 0), 0x3a3634);
    Station('HighRoller', V(-700, -4250, 0), 0, 2500, -1, 'Workbench'); Station('AmmoCrate', V(700, -4250, 0), 180, 250, -1, 'Ammo');
    wallbuy('Saloon Six', -2396, -4450, 0); wallbuy("Hornet's Nest", 2396, -4500, 180);
    for (const [x, y] of [[-2200, -5750], [2200, -5750], [-2200, -3350], [2200, -3350], [-1100, -5800], [1100, -5800]]) SpawnAt(V(x, y, 0), Z0);
    M.Spawn(V(0, -5100, 100));
    M.Decor(V2(-2400, -5900), V2(2400, -3200), 50, ['D_Grime', 'D_Crack', 'D_Grime', 'P_Bones', 'Blood']);
  }

  // ------------------------------------------------------------------ 1. THE MIDWAY (booths down both sides, a row of carts and poles up the middle)
  {
    const S = [[-6400, 'RING TOSS', 2], [-5600, 'DUCK SHOOT', 1], [-4800, 'KNOCK EM DOWN', 0], [-4000, 'GUESS YOUR WEIGHT', 2], [-3200, 'FISH POND', 1], [3200, 'COCONUTS', 0], [4000, 'WHEEL OF FORTUNE', 1], [4800, 'HOOPLA', 2], [5600, 'SHOOTING GALLERY', 1], [6400, 'DARTS', 0]];
    S.forEach(([x, name, p], i) => booth(x, -2760, 90, name, i % 2 ? 0x3a5a7a : RED, p));
    const N = [[-6400, 'COTTON CANDY', 0], [-5650, 'TOFFEE APPLES', 2], [-3850, 'PENNY ARCADE', 1], [-3100, 'LEMONADE', 2], [-1700, 'FREAK SHOW', 0], [-900, 'PALMISTRY', 1], [900, 'HOT PEANUTS', 2], [1700, 'TATTOOS', 0], [3100, 'POPCORN', 2], [3850, 'TEST YOUR NERVE', 1], [5650, 'SOUVENIRS', 0], [6400, 'LOST CHILDREN', 1]];
    N.forEach(([x, name, p], i) => booth(x, -740, -90, name, i % 2 ? RED : 0x7a2a5a, p));
    // the entrances off the midway are painted to be noticed
    Box(V(-4750, -548, 700), V(1000, 24, 360), RED, false, false); for (const s of [-1, 1]) { Glow(V(-4750 + s * 220, -564, 760), V(120, 6, 90), 0x2a8a8a); Ball(V(-4750 + s * 220, -570, 760), V(50, 30, 50), 0x16161a); } Ball(V(-4750, -580, 650), V(110, 80, 110), 0xb8322a); for (let i = -3; i <= 3; i++) Box(V(-4750 + i * 56, -556, 540 - (i & 1) * 16), V(40, 14, 60), 0xe8e2d0, false, false);
    Sign(V(-4750, -566, 870), -90, 'HALL OF MIRRORS', { r: 0.95, g: 0.8, b: 0.4 }, 56);
    Box(V(4750, -548, 700), V(1000, 24, 360), 0x6a5a3a, false, false); Sign(V(4750, -566, 730), -90, 'MENAGERIE', { r: 0.95, g: 0.8, b: 0.4 }, 70); Sign(V(4750, -566, 640), -90, 'BEASTS OF FIVE CONTINENTS', { r: 0.9, g: 0.84, b: 0.7 }, 26);
    Box(V(0, -548, 760), V(1200, 24, 440), RED, false, false); for (let i = -2; i <= 2; i++) if (i % 2) Box(V(i * 240, -552, 760), V(240, 20, 440), CREAM, false, false); Sign(V(0, -570, 780), -90, 'BIG TOP', { r: 0.5, g: 0.1, b: 0.08 }, 110);
    // up the middle: the high striker, carts, a burnt-out wagon, barrels - enough to make two lanes of it
    { const x = -2000, y = -1750; Box(V(x, y, 30), V(200, 200, 60), RED, true, true); Box(V(x, y, 400), V(60, 30, 740), CREAM, true, false); for (let i = 0; i < 8; i++) Box(V(x, y - 17, 110 + i * 80), V(50, 4, 6), WOOD_D, false, false); Cyl(V(x, y, 800), 110, 40, GOLD, false, false, R(0, 0, 90)); Glow(V(x, y - 18, 300), V(30, 6, 30), 0xb8322a); Sign(V(x, y - 104, 40), -90, 'HIGH STRIKER', { r: 0.95, g: 0.8, b: 0.4 }, 20); }
    for (const [x, c] of [[-5200, RED], [1500, 0x3a5a7a], [5200, 0x7a2a5a]]) { const y = -1750; Box(V(x, y, 110), V(260, 160, 130), c, true, true); for (const s of [-1, 1]) Ring(V(x - 90, y + s * 86, 70), V(140, 12, 140), GOLD, R(0, 0, 0)); Box(V(x + 150, y, 60), V(60, 20, 20), WOOD_D, false, false); for (const sx of [-1, 1]) Box(V(x + sx * 110, y, 260), V(12, 12, 180), WOOD_D, false, false); BoxRot(V(x, y, 360), V(320, 220, 10), CREAM, R(0, 0, 8), false); Glow(V(x, y - 82, 140), V(160, 4, 60), WARM); }
    BoxRot(V(-600, -1700, 120), V(520, 240, 200), 0x1c1614, R(0, 20, 12), true); K.solid(-600, -1700, 20, 520, 240, 150); for (let i = 0; i < 4; i++) Glow(V(-600 + rr(-200, 200), -1700 + rr(-100, 100), 20), V(rr(40, 90), rr(30, 60), 8), 0xb8421a, 0);
    Wagon(V(3300, -1800, 0), -12); for (const [x, y] of [[-3600, -1650], [-3480, -1760], [2500, -1900], [6300, -1700], [6420, -1800], [-6500, -1750]]) Barrel(V(x, y, 0), (x | 0) % 2 ? 0x5a2a26 : 0x3a3634);
    for (const [x, y] of [[-4300, -1750], [400, -1650], [4300, -1750]]) { Box(V(x, y, 44), V(240, 60, 10), WOOD, true, true); Box(V(x, y + 26, 84), V(240, 8, 60), WOOD, false, false); for (const s of [-1, 1]) Box(V(x + s * 100, y, 20), V(12, 50, 40), WOOD_D, false, false); }
    for (let x = -6600; x <= 6600; x += 1100) { pole(x, -2350, 560); pole(x + 550, -1150, 560); bulbs(x, -2350, 560, x + 550, -1150, 560, 8); if (x + 1100 <= 6600) bulbs(x + 550, -1150, 560, x + 1100, -2350, 560, 8); }
    wallbuy('Sawbuck', -6896, -1750, 0); wallbuy('Copperhead', 6896, -1750, 180); wallbuy('Back-Alley', -2700, -2896, 90);
    for (const [x, y] of [[-6750, -2300], [6750, -2300], [-6750, -1200], [6750, -1200], [-2800, -1750], [2800, -2300], [-1300, -2700], [1300, -2700]]) SpawnAt(V(x, y, 0), Z1);
    M.Decor(V2(-6900, -2500), V2(6900, -1000), 90, ['D_Grime', 'D_Crack', 'D_Grime', 'Blood', 'P_Bones']);
  }

  // ------------------------------------------------------------------ 2. THE BIG TOP (a round arena under canvas; bleachers to climb)
  {
    const cx = 0, cy = 1750, RT = 1900, QUAD = [45, 135, 225, 315], OPEN = [0, 90, 180, 270];
    const adiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
    Cyl(V(cx, cy, 2), RT * 2, 2, 0x7a6a48, false, false); Cyl(V(cx, cy, 3), 1400, 2, 0x9a8458, false, false);
    // the wall of the tent, four ways through it, and wings of canvas so there is no getting round the back
    for (let i = 0; i < 28; i++) { const a = i / 28 * 360, ar = a * Math.PI / 180; if (OPEN.some((o) => adiff(a, o) < 10.5)) continue; BoxYaw(V(cx + Math.cos(ar) * RT, cy + Math.sin(ar) * RT, 250), V(30, 440, 500), i % 2 ? RED : CREAM, a, true); Cyl(V(cx + Math.cos(ar + 0.112) * RT, cy + Math.sin(ar + 0.112) * RT, 270), 20, 540, WOOD_D, false, false); }
    for (const s of [-1, 1]) { Box(V(s * 320, -330, 250), V(30, 400, 500), RED, true, false); Box(V(s * 320, 3830, 250), V(30, 400, 500), RED, true, false); Box(V(-2190, cy + s * 320, 250), V(660, 30, 500), RED, true, false); Box(V(2190, cy + s * 320, 250), V(660, 30, 500), RED, true, false); }
    // the roof: gores of red and cream up to the bale ring
    for (let i = 0; i < 28; i++) { const a = (i + 0.5) / 28 * 360, ar = a * Math.PI / 180; BoxRot(V(cx + Math.cos(ar) * 1100, cy + Math.sin(ar) * 1100, 880), V(1790, 440, 10), i % 2 ? RED : CREAM, R(25, a + 180, 0), false); }
    Cyl(V(cx, cy, 1290), 640, 60, RED, false, false); ConeShape(V(cx, cy, 1420), V(640, 640, 220), CREAM, false); Cyl(V(cx, cy, 1620), 14, 300, WOOD_D, false, false); Box(V(cx + 70, cy, 1720), V(140, 6, 70), RED, false, false);
    // king poles, the ring kerb, what the last act left in it
    for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { Cyl(V(cx + sx * 760, cy + sy * 760, 640), 56, 1280, RED, true, true); for (const z of [200, 520, 840]) Cyl(V(cx + sx * 760, cy + sy * 760, z), 62, 60, CREAM, false, false); bulbs(cx + sx * 760, cy + sy * 760, 700, cx, cy, 1180, 10); }
    for (let i = 0; i < 32; i++) { const a = i / 32 * 6.283; Box(V(cx + Math.cos(a) * 700, cy + Math.sin(a) * 700, 16), V(40, 140, 32), i % 2 ? RED : CREAM, false, false, i * 11.25); }
    for (const [x, y, c] of [[-260, 1500, RED], [240, 1560, 0x3a5a7a], [0, 2060, 0xc8b83a]]) { Cyl(V(x, y, 45), 150, 90, c, true, true); Cyl(V(x, y, 92), 170, 8, CREAM, false, false); for (let k = 0; k < 6; k++) Box(V(x + Math.cos(k * 1.047) * 76, y + Math.sin(k * 1.047) * 76, 46), V(8, 40, 80), CREAM, false, false, k * 60); }
    { const x = 620, y = 2380; Box(V(x, y, 70), V(300, 200, 60), RED, true, true); for (const s of [-1, 1]) Ring(V(x, y + s * 110, 90), V(190, 16, 190), GOLD, R(0, 0, 0)); Cyl(V(x - 90, y, 250), 150, 560, IRON, true, false, R(52, 200, 0)); Cyl(V(x - 250, y - 60, 460), 164, 30, GOLD, false, false, R(52, 200, 0)); Sign(V(x, y - 104, 70), -90, 'BOOM', { r: 0.95, g: 0.8, b: 0.4 }, 30); }
    for (const [x, y] of [[-500, 2500], [540, 1100]]) { Box(V(x, y, 6), V(300, 300, 12), 0x1c1614, false, false); for (let i = 0; i < 3; i++) Glow(V(x + rr(-100, 100), y + rr(-100, 100), 14), V(rr(40, 80), rr(30, 60), 6), 0xb8421a, 0); }
    for (const s of [-1, 1]) { Box(V(s * 300, cy, 1000), V(6, 6, 460), 0x8a8474, false, false); Box(V(s * 300, cy + 200, 1000), V(6, 6, 460), 0x8a8474, false, false); Box(V(s * 300, cy + 100, 770), V(10, 210, 10), GOLD, false, false); }
    // bleachers in the four quarters, four tiers each: the top row is the best seat and the best shot
    for (const q of QUAD) for (let j = 0; j < 5; j++) { const a = q + (j - 2) * 13.5, ar = a * Math.PI / 180; for (let t = 0; t < 4; t++) { const r = 1400 + t * 112; BoxYaw(V(cx + Math.cos(ar) * r, cy + Math.sin(ar) * r, (t + 1) * 35), V(112, 440 + t * 20, (t + 1) * 70), t % 2 ? WOOD : 0x5a4636, a, true); } }
    // close the ground outside the ring, and under the seats, to anything on foot
    for (let gy = -500; gy < 4000; gy += 100) for (let gx = -2500; gx < 2500; gx += 100) {
      const dx = gx + 50 - cx, dy = gy + 50 - cy, d = Math.hypot(dx, dy), a = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
      const corridor = (Math.abs(dx) < 300 && (gy < 0 || gy >= 3500)) || (Math.abs(dy) < 300 && (gx < -1700 || gx >= 1700));
      if ((d > 1840 && !corridor) || (d > 1330 && d <= 1840 && QUAD.some((q) => adiff(a, q) < 35))) GM.NavBlockBox({ min: V(gx + 45, gy + 45, 0), max: V(gx + 55, gy + 55, 150) }, 1);
    }
    for (const q of QUAD) { const ar = q * Math.PI / 180; K.lantern(cx + Math.cos(ar) * 1250, cy + Math.sin(ar) * 1250, 620, WARM, 1500); }
    Station('AmmoCrate', V(520, 620, 0), 90, 250, -1, 'Ammo'); Station('HighRoller', V(-520, 620, 0), 90, 2500, -1, 'Workbench');
    for (const [x, y] of [[0, 3250], [1300, 1750], [-1300, 1750], [0, 250], [880, 2630], [-880, 870]]) SpawnAt(V(x, y, 0), Z2);
  }

  // ------------------------------------------------------------------ 3. HALL OF MIRRORS (long galleries of glass, a gap here and there)
  {
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) Floor(V2(-7000 + i * 500, -500 + j * 500), V2(-6500 + i * 500, 0 + j * 500), 1.2, (i + j) % 2 ? 0x1c1c22 : 0x8a8a84);
    const MIR = 0x7a8a98, WX = [[-6450, 900, 2600], [-5900, 1700, 3000], [-5025, 600, 2300], [-4475, 1400, 3100], [-3925, 800, 2500], [-3375, 1750, 500]];
    for (const [x, g1, g2] of WX) {
      const cuts = [100, Math.min(g1, g2) - 250, Math.min(g1, g2) + 250, Math.max(g1, g2) - 250, Math.max(g1, g2) + 250, 3400];
      for (let k = 0; k < 6; k += 2) { const y0 = cuts[k], y1 = cuts[k + 1]; if (y1 - y0 < 60) continue; const yc = (y0 + y1) / 2, len = y1 - y0;
        Box(V(x, yc, 210), V(30, len, 420), MIR, true, true); Box(V(x, yc, 430), V(44, len + 10, 20), GOLD, false, false); Box(V(x, yc, 10), V(44, len + 10, 20), GOLD, false, false);
        for (const s of [-1, 1]) { for (let y = y0 + 125; y < y1; y += 250) { Glow(V(x + s * 16, y, 220), V(3, 190, 330), 0x16303a); Box(V(x + s * 17, y + 110, 205), V(4, 10, 410), GOLD, false, false); } }
        for (const y of [y0, y1]) Cyl(V(x, y, 230), 50, 460, RED, true, false); }
    }
    // the trick glass along the outer walls, the bulbs strung gallery to gallery
    for (let y = 300; y <= 3500; y += 800) { Glow(V(-6896, y, 240), V(6, 300, 380), 0x1c4a5a); Box(V(-6892, y, 240), V(8, 330, 410), GOLD, false, false); }
    for (let x = -6500; x <= -3000; x += 700) { Glow(V(x, 3896, 240), V(300, 6, 380), 0x2a2a5a); Box(V(x, 3892, 240), V(330, 8, 410), GOLD, false, false); }
    for (const y of [-200, 3650]) for (let x = -6700; x < -2900; x += 950) bulbs(x, y, 470, x + 950, y, 470, 8);
    for (const [x, y] of [[-6700, 1700], [-5460, 1200], [-4750, 2300], [-4200, 800], [-3650, 3000], [-2950, 2500]]) K.lantern(x, y, 460, 0x2a8a8a, 900);
    // a barrel walk nobody turned off, and a mannequin or two
    Cyl(V(-5460, 2500, 130), 260, 500, 0x7a2a5a, true, false, R(90, 90, 0)); K.solid(-5460, 2500, 90, 500, 260, 150); for (const k of [-180, 0, 180]) Cyl(V(-5460, 2500 + k, 130), 272, 30, CREAM, false, false, R(90, 90, 0));
    for (const [x, y] of [[-6720, 3100], [-2900, 1100]]) { Cyl(V(x, y, 90), 50, 180, 0xbcb49a, true, false); Ball(V(x, y, 220), V(60, 60, 70), 0xbcb49a); Box(V(x, y, 150), V(120, 30, 20), 0xbcb49a, false, false); }
    Sign(V(-4750, 3936, 470), -90, 'THIS WAY OUT', { r: 0.4, g: 0.9, b: 0.9 }, 34);
    wallbuy('Dynamite Dan', -6896, 2100, 0); wallbuy('Homesteader', -2536, 700, 180);
    for (const [x, y] of [[-6720, -220], [-2800, -220], [-6720, 3680], [-2800, 3700], [-5460, 1750], [-4200, 3650], [-3650, 1400]]) SpawnAt(V(x, y, 0), Z3);
  }

  // ------------------------------------------------------------------ 4. THE MENAGERIE (cage wagons in rows, a training ring, the strongman's stage)
  {
    [[3300, 500, 1], [4450, 500, 0], [5600, 500, 3], [3300, 2700, 2], [4450, 2700, 1], [5600, 2700, 0], [3300, 3500, 0], [4450, 3500, 3], [5600, 3500, 2]].forEach(([x, y, k]) => cage(x, y, k));
    // the ring where they worked the cats: a kerb, three tubs, a hoop that still burns
    for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283; Box(V(4450 + Math.cos(a) * 560, 1650 + Math.sin(a) * 560, 22), V(40, 150, 44), i % 2 ? RED : CREAM, false, false, i * 15); }
    Cyl(V(4450, 1650, 2), 1100, 2, 0x8a7440, false, false);
    for (const [x, y, h] of [[4250, 1500, 90], [4650, 1500, 120], [4450, 1900, 150]]) { Cyl(V(x, y, h / 2), 130, h, 0x3a5a7a, true, true); Cyl(V(x, y, h + 2), 150, 8, GOLD, false, false); }
    Box(V(5050, 1650, 150), V(16, 16, 300), IRON, true, false); Ring(V(5050, 1650, 400), V(280, 16, 280), 0xb8421a, R(0, 90, 0)); Glow(V(5050, 1650, 400), V(262, 12, 262), 0x8a2a0a, 8, R(0, 90, 0)); Lamp(V(5050, 1650, 400), LC(1, 0.5, 0.2), 12, 1100, false);
    // the stage: boards, a backdrop with his name on it, the iron he lifted
    { const x = 6350, y = 1650; Box(V(x, y, 55), V(800, 700, 110), WOOD, true, true); Box(V(x + 380, y, 400), V(24, 700, 580), RED, true, false); for (let i = -1; i <= 1; i += 2) Box(V(x + 366, y + i * 230, 400), V(8, 180, 580), CREAM, false, false); Sign(V(x + 360, y, 520), 180, 'GOLIATH', { r: 0.95, g: 0.8, b: 0.4 }, 80); Sign(V(x + 360, y, 430), 180, 'STRONGEST MAN ALIVE', { r: 0.9, g: 0.84, b: 0.7 }, 26);
      Cyl(V(x - 100, y + 150, 150), 14, 420, 0x8a8f99, false, false, R(0, 0, 90)); for (const s of [-1, 1]) Cyl(V(x - 100, y + 150 + s * 200, 150), 90, 40, IRON, true, false, R(0, 0, 90));
      for (const [dx, dy] of [[-200, -200], [-60, -240], [80, -180]]) { Ball(V(x + dx, y + dy, 150), V(70, 70, 70), IRON); Box(V(x + dx, y + dy, 196), V(40, 10, 30), IRON, false, false); }
      for (const s of [-1, 1]) Ramp(V(x - 400 - 260, y + s * 200, 0), V(x - 400, y + s * 200, 110), 200, WOOD_D); K.lantern(x, y, 640, WARM, 1400); }
    // straw, troughs, feed
    for (const [x, y, yaw] of [[2900, 1200, 10], [2940, 1340, -8], [6600, 3000, 30], [3800, 1300, 0], [5900, 1100, 40]]) { Box(V(x, y, 45), V(150, 100, 90), 0xb89a4a, true, true, yaw); Box(V(x, y, 45), V(154, 10, 94), 0x7a6430, false, false, yaw); }
    for (const [x, y] of [[3900, 1050], [5000, 2250]]) { Box(V(x, y, 30), V(300, 90, 60), WOOD, true, true); Floor(V2(x - 130, y - 30), V2(x + 130, y + 30), 61, 0x1c2a2e); }
    Barrel(V(6700, 300, 0), 0x3a3634); Barrel(V(6600, 380, 0), 0x5a2a26); Crate(V(2850, 2200, 0), 120); Crate(V(2860, 2340, 0), 90);
    for (const [x, y] of [[3875, 1000], [5025, 1000], [3875, 3100], [5025, 3100], [6500, 2400], [2900, 300]]) { pole(x, y, 480); } bulbs(3875, 1000, 480, 5025, 1000, 480); bulbs(3875, 3100, 480, 5025, 3100, 480); bulbs(5025, 1000, 480, 6500, 2400, 480, 12);
    wallbuy('Iron Mule', 6896, 3100, 180); wallbuy('Lawman AR', 2536, 800, 0);
    for (const [x, y] of [[6750, -220], [2800, -220], [6750, 3780], [2800, 3780], [6750, 2500], [3875, 2100], [5600, 1100]]) SpawnAt(V(x, y, 0), Z4);
    M.Decor(V2(2600, -400), V2(6900, 3900), 60, ['D_Grime', 'P_Bones', 'P_Bones', 'Blood', 'D_Crack']);
  }

  // ------------------------------------------------------------------ 5. UNDER THE WHEEL (the open fairground: the wheel, the gallopers, the chair ride, the coaster along the back fence)
  {
    // the wheel: thirty metres of it, stopped with a car at the top
    { const x = 0, y = 5650, hz = 1160, r = 950;
      for (const s of [-1, 1]) { Ring(V(x, y + s * 70, hz), V(r * 2, 30, r * 2), RED, R(0, 0, 0)); Ring(V(x, y + s * 70, hz), V(r * 1.3, 20, r * 1.3), CREAM, R(0, 0, 0)); for (let k = 0; k < 8; k++) BoxRot(V(x, y + s * 70, hz), V(r * 2 - 20, 14, 14), 0x9a9488, R(k * 22.5, 0, 0), false);
        for (const sx of [-1, 1]) BoxRot(V(x + sx * 300, y + s * 150, hz / 2), V(40, 40, hz * 1.14), RED, R(-sx * 15, 0, 0), true); }
      Cyl(V(x, y, hz), 120, 260, GOLD, false, false, R(0, 0, 90));
      for (let k = 0; k < 8; k++) { const a = k * 0.785 + 0.39, gx = x + Math.cos(a) * r, gz = hz + Math.sin(a) * r; Box(V(gx, y, gz - 70), V(170, 130, 110), [RED, 0x3a5a7a, 0xc8b83a, 0x7a2a5a][k % 4], false, false); Box(V(gx, y, gz - 4), V(190, 150, 12), CREAM, false, false); Glow(V(gx, y - 66, gz - 60), V(110, 4, 50), k % 3 ? 0x2a2420 : WARM); Glow(V(gx, y, gz + 8), V(14, 14, 16), BULB[k % 3], 2); }
      for (let k = 0; k < 24; k++) { const a = k / 24 * 6.283; Glow(V(x + Math.cos(a) * (r - 4), y - 75, hz + Math.sin(a) * (r - 4)), V(16, 10, 16), BULB[k % 3], 2); }
      Box(V(x, y, 25), V(1500, 520, 50), WOOD, true, true); Box(V(x - 600, y - 300, 120), V(200, 160, 240), RED, true, true); Sign(V(x - 600, y - 382, 180), -90, 'WHEEL', { r: 0.95, g: 0.8, b: 0.4 }, 40); Lamp(V(x, y - 200, 600), LC(1, 0.7, 0.4), 14, 2200, false); }
    // the gallopers: a canopy, a centre drum of mirrors, horses on brass poles
    { const x = -4300, y = 5250; Cyl(V(x, y, 20), 1100, 40, WOOD, true, false); Cyl(V(x, y, 290), 260, 500, RED, true, true); for (let k = 0; k < 8; k++) Glow(V(x + Math.cos(k * 0.785) * 132, y + Math.sin(k * 0.785) * 132, 300), V(8, 70, 300), 0x16303a, 0, R(0, k * 45, 0));
      ConeShape(V(x, y, 690), V(1240, 1240, 300), RED, false); Cyl(V(x, y, 548), 1240, 30, GOLD, false, false); ConeShape(V(x, y, 760), V(700, 700, 200), CREAM, false); Ball(V(x, y, 880), V(70, 70, 70), GOLD);
      for (let k = 0; k < 10; k++) { const a = k * 0.628, hx = x + Math.cos(a) * 430, hy = y + Math.sin(a) * 430, hz = 150 + (k % 2) * 60, yaw = a * 57.3 + 90, c = [0xcfc6ac, 0x1c1614, 0x8a6a4a][k % 3];
        Cyl(V(hx, hy, 290), 12, 500, GOLD, false, false); BoxYaw(V(hx, hy, hz), V(150, 44, 60), c, yaw, false); BoxYaw(M.L(V(hx, hy, 0), yaw, 84, 0, hz + 44), V(40, 30, 80), c, yaw, false); BoxYaw(M.L(V(hx, hy, 0), yaw, 104, 0, hz + 84), V(64, 26, 30), c, yaw, false);
        for (const dx of [-54, 54]) BoxYaw(M.L(V(hx, hy, 0), yaw, dx, 0, hz - 60), V(14, 30, 70), c, yaw, false); BoxYaw(V(hx, hy, hz + 34), V(60, 50, 10), RED, yaw, false); Glow(V(x + Math.cos(a) * 610, y + Math.sin(a) * 610, 540), V(16, 16, 18), BULB[k % 3], 2); }
      GM.NavBlockBox({ min: V(x - 180, y - 180, 0), max: V(x + 180, y + 180, 150) }, 1); Lamp(V(x, y, 420), LC(1, 0.7, 0.4), 14, 1800, false); }
    // the chair-o-plane: a mast, a crown, chairs hanging out on their chains
    { const x = 4300, y = 5250; Cyl(V(x, y, 30), 500, 60, WOOD, true, true); Cyl(V(x, y, 420), 150, 720, 0x3a5a7a, true, false); for (const z of [200, 420, 640]) Cyl(V(x, y, z), 160, 40, CREAM, false, false); Cyl(V(x, y, 800), 1000, 50, RED, false, false); ConeShape(V(x, y, 900), V(700, 700, 180), CREAM, false);
      for (let k = 0; k < 12; k++) { const a = k * 0.5236, ex = x + Math.cos(a) * 480, ey = y + Math.sin(a) * 480; BoxRot(V(ex + Math.cos(a) * 80, ey + Math.sin(a) * 80, 560), V(4, 4, 460), 0x8a8474, R(-20 * Math.cos(a), 0, 20 * Math.sin(a)), false); Box(V(ex + Math.cos(a) * 160, ey + Math.sin(a) * 160, 330), V(60, 60, 50), [RED, 0xc8b83a, 0x3a5a7a][k % 3], false, false, a * 57.3); Glow(V(ex, ey, 770), V(16, 16, 18), BULB[k % 3], 2); }
      Lamp(V(x, y, 500), LC(1, 0.7, 0.4), 14, 1800, false); }
    // the coaster: trestle along the back fence, the track over it, one car stopped on the crest
    const ch = (x) => 380 + Math.sin(x / 900) * 220 + Math.sin(x / 370 + 1) * 70;
    for (let x = -6600; x <= 6600; x += 300) { if (Math.abs(x) < 1500) continue; const h = ch(x); for (const s of [-1, 1]) Box(V(x, 6290 + s * 70, h / 2), V(26, 26, h), CREAM, false, false); Box(V(x, 6290, h * 0.5), V(20, 150, 14), CREAM, false, false); BoxRot(V(x + 150, 6220, h * 0.5), V(Math.hypot(300, h * 0.8) + 6, 12, 12), CREAM, R(Math.atan2(h * 0.8, 300) * 57.3 * ((x / 300) & 1 ? 1 : -1), 0, 0), false);
      if (x + 300 <= 6600 && Math.abs(x + 300) >= 1500) { const h2 = ch(x + 300); BoxRot(V(x + 150, 6290, (h + h2) / 2 + 10), V(Math.hypot(300, h2 - h) + 10, 170, 14), RED, R(Math.atan2(h2 - h, 300) * 57.3, 0, 0), false); } }
    { const x = -4200, h = ch(-4200); Box(V(x, 6290, h + 60), V(260, 150, 80), 0x3a5a7a, false, false); Box(V(x + 110, 6290, h + 110), V(40, 150, 60), 0x3a5a7a, false, false); Glow(V(x + 132, 6290, h + 70), V(6, 60, 30), WARM); }
    M.Blocker(V(-4050, 6290, 350), V(5200, 200, 700)); M.Blocker(V(4050, 6290, 350), V(5200, 200, 700)); GM.NavBlockBox({ min: V(-6700, 6180, 0), max: V(-1400, 6400, 150) }, 1); GM.NavBlockBox({ min: V(1400, 6180, 0), max: V(6700, 6400, 150) }, 1);
    // carts, benches, what burned
    for (const [x, y, c, t] of [[-1900, 4700, RED, 'ICES'], [1900, 4700, 0x3a5a7a, 'FRIED DOUGH'], [-6200, 4500, 0x7a2a5a, 'CANDY'], [6200, 5500, RED, 'SODA']]) { Box(V(x, y, 110), V(260, 160, 130), c, true, true); for (const s of [-1, 1]) Ring(V(x - 90, y + s * 86, 70), V(140, 12, 140), GOLD, R(0, 0, 0)); for (const sx of [-1, 1]) Box(V(x + sx * 110, y, 260), V(12, 12, 180), WOOD_D, false, false); BoxRot(V(x, y, 360), V(320, 220, 10), CREAM, R(0, 0, 8), false); Sign(V(x, y - 84, 120), -90, t, { r: 0.95, g: 0.9, b: 0.8 }, 26); }
    for (const [x, y] of [[-2700, 5600], [2700, 5600], [-5900, 5900], [5900, 4400], [1200, 4500]]) { Box(V(x, y, 6), V(380, 320, 12), 0x1c1614, false, false, rr(0, 60)); for (let i = 0; i < 4; i++) Glow(V(x + rr(-140, 140), y + rr(-120, 120), 14), V(rr(40, 90), rr(30, 60), 6), 0xb8421a, 0); Lamp(V(x, y, 60), LC(1, 0.4, 0.15), 8, 600, false); }
    for (const [x, y] of [[-2900, 4600], [2900, 4600], [-800, 4600]]) { Box(V(x, y, 44), V(240, 60, 10), WOOD, true, true); Box(V(x, y + 26, 84), V(240, 8, 60), WOOD, false, false); }
    for (let x = -6400; x <= 6400; x += 1600) { pole(x, 4500, 560); pole(x + 800, 5900, 560); bulbs(x, 4500, 560, x + 800, 5900, 560, 10); }
    wallbuy('Frostbite Beam', -1100, 6396, -90); wallbuy('Quarter Horse', 1100, 6396, -90);
    for (const [x, y] of [[-6750, 5900], [6750, 5900], [-6750, 4350], [6750, 4350], [-2300, 6000], [2300, 6000], [-2000, 4350], [2000, 4350], [0, 4650]]) SpawnAt(V(x, y, 0), Z5);
    M.Decor(V2(-6900, 4100), V2(6900, 6100), 90, ['D_Grime', 'P_Grass_0', 'D_Crack', 'P_Bones', 'P_Grass_1', 'Blood']);
  }

  for (const [x, y, yaw, cost, a, b] of DOORS) Door(V(x, y, 0), yaw, cost, a, b);
  M.Spawn(V(0, 980, 100));
}

export const CARNIVAL_LOOT = { chests: { 0: [0], 1: [0, 1], 2: [1, 2], 3: [1, 2], 4: [1, 2], 5: [1, 2] }, relics: [[1227, 2977, 282, 225], [6560, 1750, 112, 180]], box: [-900, 2300, 0, 0], boxZones: [1, 2, 3, 4, 5] };

// embers going up, ash coming down
let acc = 0;
export function carnivalAmbient(g, dt) {
  acc += dt * 34; const c = g.camera.position;
  while (acc > 1) { acc -= 1; const ember = Math.random() < 0.45;
    g.fx.add(ember ? { pos: new THREE.Vector3(c.x + (Math.random() - 0.5) * 3200, 10 + Math.random() * 200, c.z + (Math.random() - 0.5) * 3200), vel: new THREE.Vector3((Math.random() - 0.5) * 80, 90 + Math.random() * 90, (Math.random() - 0.5) * 80), life: 3.4, size0: 8, size1: 3, c0: [1, 0.55, 0.15, 1], fadeIn: 0.2, fadeOut: 0.6, tex: 'FX_Disc', kind: 'fx', glow: 1 }
      : { pos: new THREE.Vector3(c.x + (Math.random() - 0.5) * 3400, c.y + 100 + Math.random() * 800, c.z + (Math.random() - 0.5) * 3400), vel: new THREE.Vector3(-40 + Math.random() * 30, -70 - Math.random() * 50, 20), life: 4.5, size0: 6, size1: 6, c0: [0.62, 0.6, 0.58, 0.8], fadeIn: 0.3, fadeOut: 0.6, tex: 'FX_Disc', kind: 'fx' }); }
}

// The magician's cabinets stand in pairs: step into one and you step out of its twin, somewhere else on the ground.
// The dead take the long way round. The wheel still turns for anyone who pays, one lap, out of reach of everything that walks.
export const CARNIVAL_MECH = {
  cabinets: [[[-6300, -1750, 0, 0], [6300, 5250, 0, 180]], [[6300, -1750, 0, 180], [-6300, 5250, 0, 0]], [[1900, -4500, 0, 180], [0, 3150, 0, -90]]],
  cabinetNames: [['the Midway (west end)', 'the far side of the wheel'], ['the Midway (east end)', 'the far side of the wheel'], ['the Front Gate', 'the Big Top']],
  wheel: { c: [0, 5650, 170], r: 950, axis: 0, at: [-600, 5200, 0, -90], bare: true, cost: 500, time: 26 },   // you pay at the booth that is already there
};
export const CARNIVAL_QUEST = { name: 'THE LAST ACT', after: 'The band has struck up', gate: [0, 2620, 0], steps: [
  { type: 'shoot', text: 'Shoot the five balloons over the fairground (the wheel gives a clear shot)', r: 80, color: 0xff4a6a, done: 'FIVE FOR FIVE',
    at: [[-2600, 5300, 1500], [2600, 5300, 1500], [-1400, 4700, 2000], [1400, 4700, 2000], [0, 6100, 2300]] },
  { type: 'collect', text: 'Find three tickets for the last performance', item: 'Ticket', n: 3, color: 0xffd24d, done: 'ADMIT THREE',
    spots: [[-6200, 600, 0], [-3300, 3300, 0], [6200, 500, 0], [3400, 3300, 0], [-5800, -2600, 0], [5800, -900, 0], [-1800, -5300, 0]] },
  { type: 'souls', text: 'Fill the three footlights with an audience', need: 10, r: 750, color: 0xffb22e, done: 'A FULL HOUSE',
    at: [[-4750, 1750, 0], [4750, 1750, 0], [0, -1750, 0]] },
  { type: 'boss', text: 'Take the whistle from the next boss you kill', color: 0xffd24d, done: 'THE WHISTLE IS YOURS' },
  { type: 'hold', text: 'Take your bow in the centre ring', at: [0, 1750, 0], r: 620, time: 45, color: 0xffd24d, done: 'THE BAND STRIKES UP' },
] };
