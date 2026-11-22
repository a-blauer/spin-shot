// GALLOWS WHARF. The sixth map: a harbour town in the rain, named for what stands on its quay.
// Six districts: the customs quay and its gallows (start, open), fishmarket row (stall alleys, tight), warehouse row
// (brick canyons, tight), the shipyard (open, with a hull on the stocks to climb), the long pier and the whaler moored
// to it (narrow planking and ship's decks over black water) and lighthouse point (open rock).
import * as THREE from 'three';
import { V, V2, R, LC, FMath } from './mapkit.js';
import { mapKit, rgb } from './mapx.js';

const COBBLE = 0x3e444c, BRICK = 0x5a3a30, BRICK_D = 0x3e2a26, STONE = 0x6a6e76, PLANK = 0x5a4a3c, PLANK_D = 0x3a2e26, IRON = 0x23262c, SEA = 0x0c1820, FOAM = 0x1c3a44, GAS = 0xc8b85a, ROPE = 0x8a7648;
const rr = (a, b) => FMath.FRandRange(a, b);

export function buildWharf(M) {
  const { Box, BoxRot, BoxYaw, Glow, Cyl, Ball, ConeShape, Ramp, Floor, Wall, Lamp, Sign, Barrel, Crate, Station, WallBuy, Door, SpawnAt, Pyramid, Oct, Ring, AddZone, StreetLamp, DeadTree, GM } = M;
  const K = mapKit(M);
  GM.navInit(-8000, -6000, 8000, 6000, 100);
  const wallbuy = (name, x, y, yaw) => { const n = [Math.cos(yaw * Math.PI / 180), Math.sin(yaw * Math.PI / 180)]; Box(V(x - n[0] * 4, y - n[1] * 4, 150), Math.abs(n[0]) > 0.5 ? V(12, 300, 230) : V(300, 12, 230), PLANK_D, false, false); WallBuy(name, V(x, y, 0), yaw); };
  const sea = (x0, y0, x1, y1, n) => { Floor(V2(x0, y0), V2(x1, y1), 2, SEA); for (let i = 0; i < n; i++) Glow(V(rr(x0 + 200, x1 - 200), rr(y0 + 150, y1 - 150), 3.2), V(rr(300, 900), rr(14, 30), 1), FOAM, 0); GM.NavBlockBox({ min: V(x0 + 40, y0 + 40, 0), max: V(x1 - 40, y1 - 40, 150) }, 1); };
  // an edge nothing walks off: posts and a chain to look at, a blocker to lean on
  const edge = (x0, y0, x1, y1) => { const len = Math.hypot(x1 - x0, y1 - y0), ax = Math.abs(x1 - x0) > 1, n = Math.max(1, Math.round(len / 300)); M.Blocker(V((x0 + x1) / 2, (y0 + y1) / 2, 1000), ax ? V(len, 40, 2000) : V(40, len, 2000)); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; Cyl(V(x, y, 45), 40, 90, IRON, false, false); Cyl(V(x, y, 94), 52, 10, IRON, false, false); if (i < n) Box(V(x + (x1 - x0) / n / 2, y + (y1 - y0) / n / 2, 70), ax ? V(len / n, 5, 5) : V(5, len / n, 5), 0x4a4e54, false, false); } };
  const warehouse = (x0, y0, x1, y1, name, face) => {   // brick, gabled, a hoist beam and loading doors on the `face` side (+1 north, -1 south)
    K.cabin(x0, y0, x1, y1, 620, BRICK, 0x2a2a30, { door: face > 0 ? 90 : -90, glow: GAS, chimney: false, rise: 300, doorCol: 0x1c1614 });
    const fy = face > 0 ? y1 : y0, cx = (x0 + x1) / 2;
    for (const dx of [-0.3, 0.3]) { Box(V(cx + (x1 - x0) * dx, fy + face * 4, 200), V(300, 8, 400), 0x2a1e18, false, false); Box(V(cx + (x1 - x0) * dx, fy + face * 8, 408), V(340, 10, 20), STONE, false, false); }
    Box(V(cx, fy + face * 120, 700), V(30, 260, 30), PLANK_D, false, false); Box(V(cx, fy + face * 230, 560), V(5, 5, 260), ROPE, false, false); Cyl(V(cx, fy + face * 230, 420), 50, 40, IRON, false, false);
    Sign(V(cx, fy + face * 12, 520), face > 0 ? 90 : -90, name, { r: 0.85, g: 0.8, b: 0.7 }, 46);
    for (let x = x0 + 200; x < x1; x += 400) for (const s of [-1, 1]) if (s !== face) Box(V(x, (s > 0 ? y1 : y0) + s * 4, 430), V(120, 8, 110), 0x1c2228, false, false);
  };
  const stall = (x, y, yaw, col) => {   // a fishmonger's stall: trestle, crates of the catch, a canvas tilt
    const L = (dx, dy, z) => M.L(V(x, y, 0), yaw, dx, dy, z);
    Box(L(0, 0, 86), V(260, 560, 12), PLANK, true, false, yaw); for (const s of [-1, 1]) Box(L(0, s * 250, 42), V(220, 16, 84), PLANK_D, false, false, yaw);
    for (const s of [-1, 1]) for (const t of [-1, 1]) Box(L(s * 120, t * 270, 170), V(14, 14, 340), PLANK_D, true, false, yaw);
    BoxRot(L(0, 0, 350), V(320, 600, 10), col, R(-8, yaw, 0), false);
    for (let i = -2; i <= 2; i++) { Box(L(20, i * 100, 110), V(160, 80, 36), 0x4a3a2c, false, false, yaw); for (let j = 0; j < 3; j++) Box(L(-20 + j * 36, i * 100, 132), V(26, 64, 8), [0x8a9aa0, 0xa8b4b8, 0x6a7a80][(i + j + 4) % 3], false, false, yaw); }
    K.solid(x, y, yaw, 280, 580, 150);
  };

  // ------------------------------------------------------------------ zones
  const Z0 = AddZone('The Customs Quay', V2(-2000, -1500), V2(2000, 1500));
  const Z1 = AddZone('Fishmarket Row', V2(-7000, -1500), V2(-2000, 1500));
  const Z2 = AddZone('Warehouse Row', V2(-7000, -5000), V2(0, -1500));
  const Z3 = AddZone('The Shipyard', V2(0, -5000), V2(7000, -1500));
  const Z4 = AddZone('The Long Pier', V2(-2000, 1500), V2(2000, 5000));
  const Z5 = AddZone('Lighthouse Point', V2(2000, -1500), V2(7000, 5000));
  M.Districts([['The Customs Quay', [Z0]], ['Fishmarket Row', [Z1]], ['Warehouse Row', [Z2]], ['The Shipyard', [Z3]], ['The Long Pier', [Z4]], ['Lighthouse Point', [Z5]]]);

  // ------------------------------------------------------------------ ground, the town behind, the water in front
  Box(V(0, 0, -50), V(16000, 12000, 100), COBBLE, true, false);
  Floor(V2(0, -5000), V2(7000, -1500), 1, 0x4a443c);
  // The town climbs away from the water: the quay, the pier and the shipyard at sea level, the fishmarket and the point
  // one flight up, the warehouses at the top. The low ground is the sea's twice a round.
  [[Z1, 260], [Z2, 520], [Z5, 260]].forEach(([z, h]) => { GM.zones[z].z = h; });
  M.at({ z: 260 }, () => { Box(V(-4500, 0, -330), V(5000, 3000, 660), 0x3a3c44, true, false); Floor(V2(-7000, -1500), V2(-2000, 1500), 1, 0x444850); Box(V(4500, 1750, -330), V(5000, 6500, 660), 0x33373c, true, false); Floor(V2(2000, -1500), V2(7000, 5000), 1, 0x3a3e40); });
  M.at({ z: 520 }, () => { Box(V(-3500, -3250, -460), V(7000, 3500, 920), 0x3a3c44, true, false); Floor(V2(-7000, -5000), V2(0, -1500), 1, COBBLE); });
  M.at({ z: 520 }, () => { Wall(V2(-7000, -5000), V2(-7000, -1500), 900, 200, BRICK_D, [], true, 0x2a2a30); Wall(V2(-7000, -5000), V2(0, -5000), 900, 200, BRICK_D, [], true, 0x2a2a30); });
  M.at({ z: 260 }, () => Wall(V2(-7000, -1500), V2(-7000, 1500), 900, 200, BRICK_D, [], true, 0x2a2a30));
  for (const [a, b, h] of [[V2(-7000, -5000), V2(-7000, 5000), 950], [V2(-7000, -5000), V2(7000, -5000), 950], [V2(7000, -5000), V2(7000, 5000), 950], [V2(-7000, 5000), V2(7000, 5000), 260]]) Wall(a, b, h, 200, h > 500 ? BRICK_D : STONE, [], true, h > 500 ? 0x2a2a30 : 0x4a4e54);
  K.cliffs(7080, -1500, 7080, 5000, 965, [0x3a3e44, 0x2e3238, 0x464a52], 0, 520);
  // roofs and chimneys of the town over the south and west walls, a few windows lit
  for (let t = -6700; t <= 6700; t += 640) { const h = 200 + ((t / 640) & 3) * 90; Box(V(t, -5120, 950 + h / 2), V(560, 300, h), [BRICK, BRICK_D, 0x4a4a52][(t / 640 + 20) % 3 | 0], false, false); Pyramid(V(t, -5120, 950 + h + 90), V(600, 320, 180), 0x2a2a30); Box(V(t + 150, -5120, 950 + h + 150), V(60, 60, 200), BRICK_D, false, false); if ((t / 640) & 1) Glow(V(t - 100, -4966, 950 + h * 0.5), V(70, 6, 90), GAS); }
  for (let t = -4700; t <= 1200; t += 640) { const h = 200 + ((t / 640) & 3) * 90; Box(V(-7120, t, 950 + h / 2), V(300, 560, h), [BRICK, BRICK_D, 0x4a4a52][(t / 640 + 20) % 3 | 0], false, false); Pyramid(V(-7120, t, 950 + h + 90), V(320, 600, 180), 0x2a2a30); if ((t / 640) & 1) Glow(V(-6966, t - 100, 950 + h * 0.5), V(6, 70, 90), GAS); }
  const brick = (a, b, gaps) => Wall(a, b, 520, 70, BRICK, gaps.map((g) => V2(g - 200, g + 200)), true, STONE, IRON);
  const brickH = (a, b, h, gaps) => Wall(a, b, h, 70, BRICK, gaps.map((g) => V2(g - 200, g + 200)), true, STONE, IRON);
  brickH(V2(-2000, -1500), V2(-2000, 1500), 780, [1500]); brickH(V2(2000, -1500), V2(2000, 5000), 780, [1500, 3330]);
  M.at({ z: 260 }, () => brickH(V2(-7000, -1500), V2(-2000, -1500), 780, [2500]));
  brickH(V2(-2000, -1500), V2(0, -1500), 1040, [1000]); brick(V2(0, -1500), V2(2000, -1500), [1000]); brickH(V2(2000, -1500), V2(7000, -1500), 780, [2500]);
  brick(V2(-2000, 1500), V2(2000, 1500), [2000]); brickH(V2(0, -5000), V2(0, -1500), 1040, [1750]);
  // the ways up: a cobbled ramp through each gate, built against the higher ground
  K.slope(-2000, 0, false, 1, 260, 0, 740, 400, COBBLE, 0x3a3c44); K.slope(2000, 0, false, -1, 260, 0, 740, 400, COBBLE, 0x33373c); K.slope(2000, 1830, false, -1, 260, 0, 740, 400, COBBLE, 0x33373c);
  K.slope(-4500, -1500, true, 1, 520, 260, 740, 400, COBBLE, 0x3a3c44); K.slope(4500, -1500, true, -1, 260, 0, 740, 400, COBBLE, 0x33373c);
  // and two quick ways down from Warehouse Row that nothing can follow you up: over the wall onto the quay, or into the shipyard
  for (const [x, y, ax] of [[-1000, -1500, true], [0, -3250, false]]) { Box(V(x, y, 260), ax ? V(400, 70, 520) : V(70, 400, 520), BRICK, true, false); Box(V(x, y, 1010), ax ? V(520, 90, 90) : V(90, 520, 90), IRON, false, false); }   // bricked up below the opening, a lifting beam over it
  M.at({ z: 520 }, () => {
    for (const [x, y, ax] of [[-1000, -1500, true], [0, -3250, false]]) {
      for (const s of [-1, 1]) Box(V(x + (ax ? s * 222 : 0), y + (ax ? 0 : s * 222), 60), V(44, 44, 120), IRON, true, false);
      Box(V(x, y, 14), ax ? V(400, 130, 28) : V(130, 400, 28), PLANK_D, true, false); Sign(V(x + (ax ? 0 : -48), y + (ax ? -48 : 0), 490), ax ? -90 : 180, 'WAY DOWN', { r: 0.9, g: 0.8, b: 0.5 }, 34);
      M.world.ZoneCeiling(V2(x, y), 400, 70, 0, ax ? V(1, 0, 0) : V(0, 1, 0)); GM.NavBlockBox({ min: V(x - (ax ? 240 : 100), y - (ax ? 100 : 240), 0), max: V(x + (ax ? 240 : 100), y + (ax ? 100 : 240), 100) }, 1);
    }
  });
  const DOORS = [[-2000, 0, 0, 1500, Z0, Z1, 260], [2000, 0, 0, 2500, Z0, Z5, 260], [1000, -1500, 90, 1500, Z0, Z3, 0], [0, 1500, 90, 1500, Z0, Z4, 0], [-4500, -1500, 90, 3000, Z1, Z2, 520], [4500, -1500, 90, 3500, Z3, Z5, 260], [2000, 1830, 0, 3500, Z4, Z5, 260]];
  for (const [x, y, yaw, , , , up] of DOORS) { const ax = yaw === 90; for (const s of [-1, 1]) { const px = x + (ax ? s * 240 : 0), py = y + (ax ? 0 : s * 240), z = up; Box(V(px, py, 300 + up / 2), V(90, 90, 600 + up), STONE, true, false); Pyramid(V(px, py, 640 + z), V(110, 110, 80), 0x4a4e54); Glow(V(px, py, 560 + z), V(30, 30, 40), GAS, 2); Lamp(V(px, py, 560 + z), LC(0.9, 0.85, 0.5), 8, 700, false); } }
  // the basin west of the pier: black water, boats at their moorings, the far mole
  sea(-7000, 1500, -2000, 5000, 26); sea(-2000, 2100, -400, 5000, 10); sea(400, 2100, 2000, 5000, 10); sea(-400, 4600, 400, 5000, 2);
  for (const [x, y] of [[-5400, 2350], [-3000, 2350], [-1250, 3700], [1250, 3700]]) { Cyl(V(x, y, 80), 18, 180, PLANK_D, false, false); Box(V(x, y, 150), V(70, 8, 8), PLANK_D, false, false); }   // stakes the wreckers hang their lanterns on
  M.at({ z: 260 }, () => edge(-6960, 1500, -2040, 1500));
  for (const [x, y, yaw, c] of [[-5600, 2600, 20, 0x3a4a5a], [-3900, 3400, -30, 0x5a3a30], [-6200, 4000, 70, 0x4a4a3a], [-2900, 2400, 8, 0x3a3a40]]) { const P = (dx, dy, z) => M.L(V(x, y, 0), yaw, dx, dy, z); BoxYaw(P(0, 0, 50), V(620, 200, 100), c, yaw, false); BoxYaw(P(350, 0, 60), V(160, 140, 110), c, yaw + 45, false); BoxYaw(P(-120, 0, 140), V(180, 150, 100), 0x8a8474, yaw, false); Cyl(P(60, 0, 420), 16, 640, PLANK_D, false, false); BoxYaw(P(60, 0, 520), V(8, 320, 8), PLANK_D, yaw, false); Glow(P(-120, 80, 150), V(40, 6, 40), GAS); }
  for (const [x, y] of [[-4800, 4300], [-3200, 2800], [1500, 4400], [-1300, 4700]]) { Cyl(V(x, y, 30), 70, 60, 0x7a2a26, false, false); ConeShape(V(x, y, 100), V(60, 60, 90), 0x7a2a26, false); Glow(V(x, y, 160), V(16, 16, 20), 0xb8322a, 2); }

  // ------------------------------------------------------------------ 0. THE CUSTOMS QUAY
  {
    // the gallows: a platform, a stair, a beam with three ropes on it
    { const x = -800, y = 350; Box(V(x, y, 70), V(520, 420, 140), PLANK, true, true); for (let i = -2; i <= 2; i++) Box(V(x + i * 104, y, 142), V(4, 420, 4), PLANK_D, false, false);
      Ramp(V(x + 260 + 300, y - 110, 0), V(x + 260, y - 110, 140), 200, PLANK_D);
      for (const s of [-1, 1]) { Box(V(x + s * 220, y + 150, 440), V(34, 34, 600), PLANK_D, true, false); BoxRot(V(x + s * 160, y + 150, 660), V(180, 22, 22), PLANK_D, R(-s * 45, 0, 0), false); }
      Box(V(x, y + 150, 750), V(520, 36, 36), PLANK_D, false, false);
      for (const dx of [-130, 0, 130]) { Box(V(x + dx, y + 150, 640), V(5, 5, 190), ROPE, false, false); Ring(V(x + dx, y + 150, 510), V(60, 8, 80), ROPE, R(0, 90, 0)); }
      Floor(V2(x - 60, y + 90), V2(x + 60, y + 210), 141, 0x1c1614); K.lantern(x - 220, y - 150, 330, GAS, 900); Sign(V(x, y - 212, 90), -90, 'BY ORDER OF THE HARBOUR BOARD', { r: 0.85, g: 0.8, b: 0.7 }, 20); }
    // the customs house on the landward side, between the two gates
    K.cabin(-620, -1440, 620, -920, 520, 0x8a8478, 0x2a2a30, { door: 90, glow: GAS, chimney: true, rise: 240, stone: BRICK_D, doorCol: 0x1c2a44 });
    for (const sx of [-1, 1]) for (const dx of [150, 440]) { Cyl(V(sx * dx, -900, 240), 44, 480, 0xa8a294, true, false); Box(V(sx * dx, -900, 20), V(70, 70, 40), STONE, false, false); }
    Box(V(0, -890, 500), V(1000, 90, 50), 0xa8a294, false, false); Pyramid(V(0, -890, 590), V(1000, 90, 130), 0x8a8478); Sign(V(0, -842, 500), 90, 'H.M. CUSTOMS', { r: 0.2, g: 0.18, b: 0.16 }, 40);
    Cyl(V(0, -914, 640), 90, 10, 0xe8e2d0, false, false, R(0, 0, 90)); Box(V(0, -906, 656), V(4, 4, 34), IRON, false, false);
    // the crane on the sea wall, a bale still on the hook
    { const x = 1100, y = 1100; Cyl(V(x, y, 60), 300, 120, STONE, true, true); Cyl(V(x, y, 300), 90, 360, IRON, true, false); BoxRot(V(x - 160, y + 60, 620), V(760, 30, 30), IRON, R(34, 160, 0), false); Box(V(x + 110, y - 40, 420), V(200, 160, 160), 0x5a2a26, true, false); Ring(V(x + 110, y - 126, 430), V(150, 14, 150), IRON, R(0, 0, 0));
      Box(V(x - 440, y + 160, 600), V(5, 5, 460), ROPE, false, false); Box(V(x - 440, y + 160, 330), V(160, 130, 110), 0xb8a888, false, false); Box(V(x - 440, y + 160, 330), V(166, 14, 116), ROPE, false, false); }
    for (const [x, y] of [[-1700, 1300], [-1100, 1350], [600, 1350], [1750, 700]]) { Cyl(V(x, y, 45), 60, 90, IRON, true, false); Cyl(V(x, y, 94), 80, 12, IRON, false, false); }
    for (const [x, y] of [[-300, 1250], [1500, -300]]) { for (let k = 0; k < 4; k++) Ring(V(x, y, 10 + k * 14), V(150 - k * 10, 14, 150 - k * 10), ROPE, R(0, 0, 90)); }
    for (const [x, y] of [[-1500, -500], [1400, 500], [-1300, 1000], [300, 500], [1500, -1100]]) StreetLamp(V(x, y, 0), x < 0 ? 0 : 180);
    Crate(V(1600, 1200, 0), 140); Crate(V(1760, 1260, 0), 110); Crate(V(1600, 1200, 140), 100); Barrel(V(-1750, -1200, 0), 0x4a3a30); Barrel(V(-1640, -1280, 0), 0x3a4a5a); Barrel(V(-1760, -1060, 0), 0x4a3a30); Crate(V(1700, -700, 0), 120);
    { const x = 500, y = -200; Box(V(x, y, 60), V(300, 150, 14), PLANK, true, true, 20); for (const s of [-1, 1]) Ring(M.L(V(x, y, 0), 20, -60, s * 84, 60), V(120, 10, 120), PLANK_D, R(0, 20, 0)); Box(M.L(V(x, y, 0), 20, 0, 0, 100), V(200, 110, 70), 0x8a9aa0, false, false, 20); }
    Station('HighRoller', V(-330, -830, 0), 90, 2500, -1, 'Workbench'); Station('AmmoCrate', V(330, -830, 0), 90, 250, -1, 'Ammo');
    wallbuy('Saloon Six', -1960, -900, 0); wallbuy("Hornet's Nest", 1960, 900, 180);
    for (const [x, y] of [[-1800, 1300], [1800, 1300], [-1800, -1300], [1800, -1300], [1500, 300], [-1500, -200]]) SpawnAt(V(x, y, 0), Z0);
    M.Spawn(V(0, -250, 100));
    M.Decor(V2(-1900, -800), V2(1900, 1400), 50, ['D_Grime', 'D_Crack', 'D_Grime', 'Blood', 'P_Bones']);
  }

  // ------------------------------------------------------------------ 1. FISHMARKET ROW (two long ranks of stalls, alleys through them)
  M.at({ z: 260 }, () => {
    const COL = [0x8a8468, 0x5a2a26, 0x3a4a5a, 0x6a6a52];
    for (const y0 of [-650, 650]) for (let i = 0; i < 4; i++) { const x = -6100 + i * 1100; if (i === 2 && y0 < 0) continue; stall(x, y0 + 150, 90, COL[(i + (y0 > 0)) % 4]); stall(x, y0 - 150, -90, COL[(i + 2 + (y0 > 0)) % 4]); }
    // the smoke house stands in the south rank, still going
    K.cabin(-4200, -930, -3600, -370, 300, 0x4a4038, 0x2a2a30, { door: 90, glow: 0xb85a2a, rise: 150 }); Sign(V(-3900, -364, 250), 90, 'SMOKE HOUSE', { r: 0.85, g: 0.8, b: 0.7 }, 30);
    // racks of split cod along the water, lobster pots, casks of brine
    for (const x of [-6200, -5000, -3800, -2700]) { for (const s of [-1, 1]) Box(V(x + s * 260, 1410, 120), V(12, 12, 240), PLANK_D, false, false); Box(V(x, 1410, 236), V(540, 8, 8), PLANK_D, false, false); for (let i = 0; i < 10; i++) Box(V(x - 230 + i * 51, 1410, 180), V(22, 5, 90), i % 3 ? 0xa8a898 : 0x8a8a7a, false, false); }
    for (const [x, y] of [[-6750, 500], [-2300, -500]]) { for (let k = 0; k < 3; k++) for (let j = 0; j < 3 - k; j++) { Cyl(V(x, y + (j - (2 - k) / 2) * 90, 36 + k * 66), 84, 110, 0x6a5a40, k === 0, false, R(90, 0, 0)); } GM.NavBlockBox({ min: V(x - 60, y - 140, 0), max: V(x + 60, y + 140, 150) }, 1); }
    for (const [x, y] of [[-2350, 700], [-6750, -700]]) { Barrel(V(x, y, 0), 0x3a4a5a); Barrel(V(x + 20, y + 120, 0), 0x4a3a30); Crate(V(x - 10, y - 130, 0), 90); }
    for (const [x, y] of [[-5550, 0], [-4450, 0], [-3350, 0], [-5550, 1190], [-3350, 1190], [-5550, -1190], [-2350, -1190]]) K.post(x, y, 380, GAS, IRON, 900);
    wallbuy('Sawbuck', -6896, 1100, 0); wallbuy('Copperhead', -2040, -1000, 180);
    for (const [x, y] of [[-6800, 1200], [-6800, -1250], [-2350, 1200], [-2350, -1300], [-4450, 1150], [-5550, -1250], [-3350, -1250], [-6700, 0]]) SpawnAt(V(x, y, 0), Z1);
    M.Decor(V2(-6900, -1400), V2(-2100, 1400), 80, ['D_Grime', 'Blood', 'D_Grime', 'P_Bones', 'D_Crack']);
  });

  // ------------------------------------------------------------------ 2. WAREHOUSE ROW (three sheds, the streets between them like canyons)
  M.at({ z: 520 }, () => {
    warehouse(-6600, -4600, -5000, -2400, 'TEA & INDIGO', 1); warehouse(-4400, -4600, -2800, -2400, 'BONDED STORE No. 4', 1); warehouse(-2200, -4600, -600, -2400, 'OIL & BONE', 1);
    // what was landed and never taken in: bales, casks, a dray
    for (const [x, y, n] of [[-6800, -3000, 3], [-6800, -4000, 2], [-4700, -3900, 2], [-2500, -3000, 3], [-300, -4500, 3], [-300, -2200, 2]]) for (let k = 0; k < n; k++) Crate(V(x + (k % 2) * 30, y + k * 150, 0), 140 - k * 14);
    for (const [x, y] of [[-4700, -2800], [-4640, -2940], [-2500, -4100], [-2440, -3960], [-5600, -1800], [-3900, -4850]]) Barrel(V(x, y, 0), (x | 0) % 2 ? 0x4a3a30 : 0x3a4a5a);
    for (const [x, y] of [[-6000, -1950], [-3300, -1950], [-1500, -2050]]) { Box(V(x, y, 70), V(180, 130, 140), 0xb8a888, true, true, rr(-10, 10)); Box(V(x, y, 70), V(186, 14, 146), ROPE, false, false); Box(V(x + 200, y + 20, 70), V(180, 130, 140), 0xa89878, true, true, rr(-10, 10)); }
    { const x = -5000, y = -4780; Box(V(x, y, 80), V(420, 200, 20), PLANK, true, true); for (const sx of [-1, 1]) for (const sy of [-1, 1]) Ring(V(x + sx * 140, y + sy * 110, 70), V(140, 12, 140), PLANK_D, R(0, 0, 0)); for (let k = 0; k < 3; k++) Cyl(V(x - 110 + k * 110, y, 150), 100, 130, 0x4a3a30, false, false, R(0, 0, 90)); Box(V(x + 300, y, 90), V(200, 10, 10), PLANK_D, false, false); }
    for (const [x, y] of [[-4700, -4400], [-4700, -2000], [-2500, -4400], [-2500, -2000], [-6800, -1800], [-300, -3300], [-300, -1800]]) K.post(x, y, 420, GAS, IRON, 900);
    Station('AmmoCrate', V(-6850, -4820, 0), 0, 2000, -1, 'Ammo');
    wallbuy('Iron Mule', -4700, -4896, 90); wallbuy('Dynamite Dan', -36, -4200, 180); wallbuy('Homesteader', -2500, -1540, -90);
    for (const [x, y] of [[-6820, -2100], [-6820, -4800], [-4700, -4800], [-2500, -4800], [-300, -4820], [-300, -2000], [-3700, -2200], [-5300, -1800]]) SpawnAt(V(x, y, 0), Z2);
    M.Decor(V2(-6900, -4900), V2(-100, -1600), 70, ['D_Grime', 'D_Crack', 'D_Grime', 'P_Bones', 'Blood']);
  });

  // ------------------------------------------------------------------ 3. THE SHIPYARD (a hull on the stocks, staging round it, timber everywhere)
  {
    // the hull: keel, frames, half her planking on; staging down both sides with a ramp at each end
    const hx = 3600, hy = -3300;
    Box(V(hx, hy, 60), V(2800, 60, 120), PLANK_D, true, true); for (let i = -6; i <= 6; i++) Box(V(hx + i * 210, hy, 40), V(60, 500, 80), PLANK_D, i % 2 === 0, false);
    for (let i = -6; i <= 6; i++) { const x = hx + i * 210, w = 300 * Math.sqrt(Math.max(0.12, 1 - (i / 7) ** 2)), h = 520 - Math.abs(i) * 12; for (const s of [-1, 1]) { BoxRot(V(x, hy + s * w * 0.5, 150), V(30, 30, 250), 0x8a7450, R(0, 0, -s * 52), false); BoxRot(V(x, hy + s * (w * 0.95), h * 0.56), V(30, 30, h * 0.72), 0x8a7450, R(0, 0, -s * 8), i % 3 === 0); } }
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) Box(V(hx - 200 + k * 60, hy + s * (290 - k * 4), 150 + k * 80), V(1700 - k * 200, 14, 70), PLANK, false, false);
    BoxRot(V(hx + 1480, hy, 300), V(60, 60, 620), PLANK_D, R(-20, 0, 0), true); BoxRot(V(hx - 1440, hy, 280), V(60, 60, 560), PLANK_D, R(14, 0, 0), true);
    M.Blocker(V(hx, hy, 250), V(2700, 560, 500)); GM.NavBlockBox({ min: V(hx - 1400, hy - 300, 0), max: V(hx + 1400, hy + 300, 150) }, 1);
    for (const s of [-1, 1]) { const y = hy + s * 560; Box(V(hx, y, 150), V(2400, 260, 300), 0x4a3e32, true, true); Box(V(hx, y, 306), V(2420, 280, 12), PLANK, false, false); for (let x = hx - 1150; x <= hx + 1150; x += 230) { Box(V(x, y + s * 136, 360), V(12, 12, 100), PLANK_D, false, false); if (x < hx + 1150) Box(V(x + 115, y + s * 136, 404), V(230, 8, 8), PLANK_D, false, false); }
      Ramp(V(hx - s * 1900, y, 0), V(hx - s * 1200, y, 300), 240, PLANK_D); K.lantern(hx + s * 600, y, 600, GAS, 1200); }
    // the sawpit, the steam box, the mast pond, the tar
    Floor(V2(1000, -4700), V2(1900, -4400), 2.5, 0x0e0c0a); Box(V(1450, -4550, 120), V(1100, 60, 60), 0x8a7450, true, true); for (const s of [-1, 1]) Box(V(1450 + s * 500, -4550, 60), V(40, 360, 120), PLANK_D, true, false); BoxRot(V(1450, -4550, 230), V(8, 30, 320), 0x8a8f99, R(0, 0, 10), false);
    Cyl(V(5900, -2100, 110), 220, 1400, 0x4a3a30, true, false, R(90, 0, 0)); K.solid(5900, -2100, 0, 1400, 220, 150); Cyl(V(6680, -2100, 150), 160, 300, IRON, true, true); Glow(V(6680, -2190, 80), V(90, 8, 70), 0xb8421a); Lamp(V(6680, -2300, 100), LC(1, 0.5, 0.2), 10, 900, false);
    for (const [x, y] of [[600, -2300], [900, -2100]]) { Cyl(V(x, y, 70), 200, 140, IRON, true, true); Cyl(V(x, y, 142), 170, 6, 0x0e0c0a, false, false); Glow(V(x, y - 104, 40), V(80, 8, 40), 0xb8421a); }
    for (const [x, y, yaw, n] of [[5800, -4500, 0, 4], [1200, -3300, 90, 3], [6400, -3400, 90, 4], [2500, -1900, 0, 3]]) { for (let k = 0; k < n; k++) for (let j = 0; j < 4 - (k % 2); j++) Box(V(x + (yaw ? 0 : 0), y, 0).add(M.L(V(0, 0, 0), yaw, 0, (j - 1.5 + (k % 2) * 0.5) * 70, 20 + k * 40)), V(900, 60, 36), k % 2 ? 0x8a7450 : 0x7a6644, k === 0, false, yaw); M.BlockerYaw(V(x, y, n * 20), V(900, 280, n * 40), yaw); K.solid(x, y, yaw, 900, 280, 150); }
    // the mould loft, anchors, a chain locker turned out on the ground
    K.cabin(300, -4900, 900, -3700, 420, 0x4a4038, 0x2a2a30, { door: 0, glow: GAS, rise: 200, chimney: false }); Sign(V(906, -4300, 330), 0, 'MOULD LOFT', { r: 0.85, g: 0.8, b: 0.7 }, 36);
    for (const [x, y, yaw] of [[4700, -1900, 30], [2000, -4850, 80]]) { BoxRot(V(x, y, 30), V(26, 26, 300), IRON, R(84, yaw, 0), false); Ring(V(x, y, 20), V(220, 20, 220), IRON, R(0, yaw, 90)); for (let k = 0; k < 9; k++) Ring(V(x + 160 + k * 34, y + Math.sin(k) * 40, 14), V(44, 10, 30), 0x4a4e54, R(0, k * 40, 90)); }
    for (const [x, y] of [[300, -1800], [3600, -1800], [3600, -4800], [6700, -4800], [2200, -3000], [5200, -2700]]) K.post(x, y, 420, GAS, IRON, 1000);
    wallbuy('Lawman AR', 6896, -3300, 180); wallbuy('Back-Alley', 3000, -4896, 90);
    for (const [x, y] of [[6750, -4800], [6750, -1800], [1200, -1800], [1100, -4850], [3600, -4850], [5600, -1800], [300, -3000]]) SpawnAt(V(x, y, 0), Z3);
    M.Decor(V2(100, -4900), V2(6900, -1600), 70, ['D_Grime', 'D_Crack', 'P_Bones', 'D_Grime']);
  }

  // ------------------------------------------------------------------ 4. THE LONG PIER (the apron along the sea wall, the pier, the Providence alongside)
  {
    Floor(V2(-2000, 1535), V2(2000, 2100), 2, 0x4a4e56); Floor(V2(-400, 2100), V2(400, 4600), 3, PLANK); for (let y = 2160; y < 4600; y += 120) Floor(V2(-400, y), V2(400, y + 5), 3.6, PLANK_D);
    edge(-1960, 2100, -400, 2100); edge(400, 2100, 1960, 2100); edge(-400, 2100, -400, 2800); edge(-400, 3000, -400, 4600); edge(-400, 4600, 400, 4600); edge(400, 2100, 400, 2900); edge(400, 3100, 400, 3900); edge(400, 4100, 400, 4600);
    for (let y = 2300; y <= 4500; y += 440) for (const s of [-1, 1]) Cyl(V(s * 430, y, -20), 70, 260, PLANK_D, false, false);
    // the Providence: a whaler, down by the head, her try-works still alight
    const sx = 980, sy = 3350, HULL = 0x2a2420, DECK = 0x6a5a44;
    Box(V(sx, sy, 75), V(700, 2100, 150), HULL, true, true); Box(V(sx, sy, 153), V(680, 2080, 8), DECK, false, false); BoxRot(V(sx, sy + 1050, 75), V(495, 495, 150), HULL, R(0, 45, 0), true); BoxRot(V(sx, sy + 1050, 153), V(480, 480, 8), DECK, R(0, 45, 0), false);
    Box(V(sx, sy - 800, 235), V(700, 500, 170), HULL, true, false); Box(V(sx, sy - 800, 324), V(700, 500, 10), DECK, false, false); Ramp(V(sx - 200, sy - 240, 154), V(sx - 200, sy - 550, 322), 200, PLANK_D);   // the quarterdeck
    Box(V(sx + 345, sy, 200), V(12, 2100, 90), HULL, true, false); for (const [yc, len] of [[2595, 590], [3500, 780], [4255, 290]]) Box(V(sx - 345, yc, 200), V(12, len, 90), HULL, true, false);   // bulwarks, open at the two gangways
    Ramp(V(420, 3000, 0), V(640, 3000, 152), 190, PLANK_D); Ramp(V(420, 4000, 0), V(640, 4000, 152), 190, PLANK_D);
    for (const [my, h] of [[sy + 500, 1700], [sy - 300, 1900]]) { Cyl(V(sx, my, h / 2 + 150), 60, h, PLANK_D, true, false); for (const z of [0.5, 0.78]) { Box(V(sx, my, 150 + h * z), V(900 - z * 300, 20, 20), PLANK_D, false, false); Box(V(sx, my, 150 + h * z - 50), V(820 - z * 300, 40, 80), 0xbcb49a, false, false); } Box(V(sx, my, 150 + h * 0.95), V(140, 140, 14), PLANK_D, false, false);
      for (const s of [-1, 1]) BoxRot(V(sx + s * 175, my, 150 + h * 0.39), V(5, 5, h * 0.82), ROPE, R(0, 0, -s * 24.5), false); }
    BoxRot(V(sx, sy + 1500, 330), V(30, 760, 30), PLANK_D, R(0, 0, -20), false);                                                              // the bowsprit
    { const y = sy + 150; Box(V(sx, y, 215), V(300, 240, 130), BRICK, true, false); for (const s of [-1, 1]) { Cyl(V(sx + s * 70, y, 290), 110, 30, IRON, false, false); Glow(V(sx + s * 70, y - 122, 200), V(70, 6, 50), 0xb8421a); } Box(V(sx, y + 90, 360), V(60, 60, 200), BRICK_D, false, false); Lamp(V(sx, y - 200, 220), LC(1, 0.5, 0.2), 12, 1100, false); }
    Box(V(sx, sy + 800, 172), V(260, 260, 36), PLANK_D, true, false); for (let i = -2; i <= 2; i++) Box(V(sx + i * 50, sy + 800, 192), V(8, 240, 6), IRON, false, false);
    Ring(V(sx, sy - 620, 420), V(130, 12, 130), PLANK_D, R(0, 0, 0)); Box(V(sx, sy - 620, 370), V(20, 20, 100), PLANK_D, false, false); for (let k = 0; k < 4; k++) BoxRot(V(sx, sy - 620, 420), V(150, 8, 8), PLANK_D, R(k * 45, 0, 0), false);
    for (const s of [-1, 1]) { BoxRot(V(sx + s * 380, sy - 150, 280), V(520, 150, 80), 0xcfc8b4, R(0, 90, 0), false); for (const dy of [-200, 200]) { Box(V(sx + s * 350, sy - 150 + dy, 290), V(14, 14, 200), IRON, false, false); } }
    for (let i = 0; i < 5; i++) BoxRot(V(sx - 320, sy + 300 + i * 26, 250), V(6, 6, 300), 0x8a8f99, R(0, 0, 12), false);
    Sign(V(sx, sy - 1056, 240), -90, 'PROVIDENCE', { r: 0.85, g: 0.78, b: 0.5 }, 56); Sign(V(sx, sy - 1056, 180), -90, 'OF GALLOWS WHARF', { r: 0.7, g: 0.66, b: 0.5 }, 22);
    K.lantern(sx, sy - 960, 520, GAS, 1000); K.lantern(sx - 250, sy + 900, 330, GAS, 900);
    // a smack on the other side of the pier, low in the water
    { const x = -860, y = 2900; Box(V(x, y, 55), V(480, 1100, 110), 0x3a4a5a, true, true); Box(V(x, y, 113), V(460, 1080, 6), DECK, false, false); BoxRot(V(x, y + 550, 55), V(340, 340, 110), 0x3a4a5a, R(0, 45, 0), true); Box(V(x, y - 300, 180), V(260, 300, 140), 0x8a8474, true, false); Glow(V(x + 132, y - 300, 190), V(5, 120, 60), GAS);
      Cyl(V(x, y + 150, 600), 40, 980, PLANK_D, true, false); BoxRot(V(x, y - 60, 480), V(20, 560, 20), PLANK_D, R(0, 0, 14), false); for (let i = 0; i < 4; i++) Box(V(x - 150 + i * 100, y + 380, 136), V(80, 80, 44), 0x4a3a2c, false, false);
      Ramp(V(-420, 2900, 0), V(-620, 2900, 112), 190, PLANK_D); }
    // on the pier itself
    for (const [x, y] of [[-335, 2300], [335, 3400], [-335, 4300]]) { Barrel(V(x, y, 0), 0x4a3a30); } Crate(V(320, 2250, 0), 110); Crate(V(-315, 3500, 0), 120); for (let k = 0; k < 3; k++) Ring(V(200, 4350, 10 + k * 14), V(140 - k * 10, 14, 140 - k * 10), ROPE, R(0, 0, 90));
    for (const [x, y] of [[-400, 2500], [392, 3500], [-400, 3900], [392, 4400]]) K.post(x, y, 380, GAS, IRON, 900);
    for (const [x, y] of [[-1600, 1575], [1500, 1575]]) StreetLamp(V(x, y, 0), 90);
    Crate(V(-1300, 1615, 0), 130); Crate(V(-1430, 1600, 0), 100); Barrel(V(1300, 1590, 0), 0x3a4a5a); Barrel(V(1385, 1590, 0), 0x4a3a30);
    wallbuy('Frostbite Beam', -1000, 1540, 90); wallbuy('Quarter Horse', 1000, 1540, 90);
    for (const [x, y] of [[-1800, 1820], [1300, 1850], [-200, 4450], [200, 3600], [-900, 1820], [0, 2600]]) SpawnAt(V(x, y, 0), Z4);
  }

  // ------------------------------------------------------------------ 5. LIGHTHOUSE POINT (bare rock, the light, the keeper's house, what the sea threw up)
  M.at({ z: 260 }, () => {
    // the light: a tapering tower in bands, a gallery, the lantern turning nothing now
    { const x = 5600, y = 3800; Oct(V(x, y, 40), V(900, 900, 80), 0x4a4e54, true, true); for (let k = 0; k < 6; k++) Cyl(V(x, y, 80 + k * 240 + 120), 560 - k * 44, 240, k % 2 ? 0x8a2a26 : 0xcfc8b4, k < 2, k === 0);
      Cyl(V(x, y, 1540), 520, 30, IRON, false, false); for (let k = 0; k < 12; k++) Box(V(x + Math.cos(k * 0.5236) * 250, y + Math.sin(k * 0.5236) * 250, 1600), V(8, 8, 110), IRON, false, false); Cyl(V(x, y, 1650), 510, 10, IRON, false, false);
      Glow(V(x, y, 1680), V(220, 220, 240), 0xc8a83a, 7); Cyl(V(x, y, 1810), 300, 30, IRON, false, false); ConeShape(V(x, y, 1900), V(300, 300, 160), 0x2a2a30, false); Ball(V(x, y, 2000), V(50, 50, 50), 0xb8923a);
      BoxRot(V(x - 1300, y - 900, 1640), V(3200, 120, 60), 0x6a5a22, R(-4, 215, 0), false); Glow(V(x - 1000, y - 700, 1650), V(2400, 60, 30), 0x5a4a1a, 0, R(-4, 215, 0)); Lamp(V(x, y - 300, 300), LC(1, 0.9, 0.5), 14, 2000, false);
      Box(V(x, y - 284, 200), V(110, 10, 220), 0x1c2a44, false, false); for (const z of [600, 1000]) Glow(V(x, y - 240 + (z > 800 ? 40 : 0), z), V(50, 6, 80), GAS); }
    K.cabin(4300, 3900, 5000, 4500, 300, 0xcfc8b4, 0x2a2a30, { door: -90, glow: GAS, rise: 170 });
    for (const [x, y] of [[4200, 3700], [4500, 3700], [4800, 3700]]) { Box(V(x, y, 60), V(10, 10, 120), PLANK_D, false, false); Box(V(x, y, 100), V(50, 10, 10), PLANK_D, false, false); }   // three crosses, facing the sea
    // boulders, a sea stack with a plank up to it, tide pools
    for (const [x, y, s] of [[3200, 1200, 1.2], [5200, 600, 1.4], [6300, 2000, 1.0], [3000, 3600, 1.1], [4300, -300, 0.9], [6500, -700, 1.3], [2600, 4500, 0.8], [3900, 2400, 0.7]]) { Oct(V(x, y, 120 * s), V(380 * s, 330 * s, 240 * s), [0x3a3e44, 0x2e3238, 0x464a52][(x | 0) % 3], true, true, R(0, rr(0, 45), 0)); Box(V(x + 70 * s, y - 40 * s, 200 * s), V(220 * s, 200 * s, 120 * s), 0x2e3238, true, false, rr(0, 45)); }
    { const x = 6300, y = 3000; Oct(V(x, y, 170), V(620, 560, 340), 0x2e3238, true, true); Box(V(x, y, 346), V(440, 400, 12), 0x3a3e44, false, false); Ramp(V(x - 1200, y, 0), V(x - 300, y, 340), 220, PLANK_D); K.lantern(x + 150, y + 150, 620, 0xb8322a, 900); Box(V(x + 150, y + 150, 480), V(14, 14, 280), IRON, false, false); }
    for (const [x, y, w, d] of [[3600, 600, 500, 340], [5800, 1300, 420, 300], [2700, 2600, 380, 460], [4800, 2900, 460, 320]]) { Floor(V2(x - w / 2, y - d / 2), V2(x + w / 2, y + d / 2), 2, 0x12242c); Glow(V(x, y, 3.2), V(w * 0.5, d * 0.4, 1), 0x1c4a44, 1); }
    // a boat that did not make the gap, and the ribs of an older one
    BoxRot(V(3400, 4400, 120), V(700, 240, 200), 0x3a3a40, R(14, 30, 40), true); K.solid(3400, 4400, 30, 700, 300, 150); BoxRot(V(3700, 4300, 300), V(20, 20, 520), PLANK_D, R(30, 30, 20), false);
    for (let i = 0; i < 6; i++) { const x = 5300 + i * 150; for (const s of [-1, 1]) BoxRot(V(x, -900 + s * 130, 150), V(24, 24, 320 - Math.abs(i - 2.5) * 30), 0x5a4a3c, R(0, 0, -s * 24), i % 2 === 0); Box(V(x, -900, 16), V(60, 300, 32), 0x4a3a2c, false, false); } Box(V(5680, -900, 30), V(1000, 40, 60), 0x4a3a2c, true, true);
    // the fog signal: a horn on a hut
    K.cabin(2300, -1300, 2800, -900, 260, BRICK, 0x2a2a30, { door: 90, glow: GAS, chimney: false, rise: 110 }); ConeShape(V(2550, -1100, 470), V(180, 180, 300), 0xb8923a, false, R(70, 60, 0));
    for (const [x, y] of [[2500, 500], [3800, 1700], [5000, 1900], [3200, 3000], [6200, 500], [4600, -1000]]) K.post(x, y, 420, GAS, IRON, 1100);
    wallbuy('Lawman AR', 6896, 1000, 180); wallbuy('Iron Mule', 2040, 2600, 0);
    for (const [x, y] of [[6700, -1250], [6700, 4700], [2300, 4750], [6750, 1500], [2350, 900], [4000, 4750], [3300, -1250], [5200, -300]]) SpawnAt(V(x, y, 0), Z5);
    M.Decor(V2(2100, -1400), V2(6900, 4900), 80, ['D_Crack', 'P_Bones', 'D_Grime', 'D_Crack', 'P_Bones']);
  });

  for (const [x, y, yaw, cost, a, b, up] of DOORS) M.at({ z: up }, () => Door(V(x, y, 0), yaw, cost, a, b));
}

export const WHARF_LOOT = { chests: { 0: [0], 1: [0, 1], 2: [1, 1], 3: [1, 2], 4: [1], 5: [1, 2] }, relics: [[980, 2460, 332, 90], [6300, 3000, 356 + 260, 180]], box: [-1500, 300, 0, 0], boxZones: [1, 2, 3, 5] };

// rain, steadily
let acc = 0;
export function wharfAmbient(g, dt) {
  acc += dt * 150; const c = g.camera.position;
  while (acc > 1) { acc -= 1; g.fx.add({ pos: new THREE.Vector3(c.x + (Math.random() - 0.5) * 3000, c.y + 300 + Math.random() * 700, c.z + (Math.random() - 0.5) * 3000), vel: new THREE.Vector3(-120, -1500, 80), life: 0.75, size0: 3, size1: 3, stretch: 12, c0: [0.72, 0.8, 0.9, 0.55], fadeIn: 0.05, fadeOut: 0.1, tex: 'FX_Disc', kind: 'fx' }); }
}

// The tide: every so often the sea comes in over the quay, the pier and the shipyard, knee deep and rising to the waist.
// Wading is slow. The fishmarket, the point and Warehouse Row stay dry.
export const WHARF_MECH = { wet: true, tide: { rect: [-7000, -5000, 7000, 5000], low: -45, high: 72, out: 70, in: 38, turn: 14, first: 55, color: 0x1c3a4a } };
export const WHARF_QUEST = { name: 'SPRING THE TRAP', after: 'The trap is sprung', gate: [200, -700, 0], steps: [
  { type: 'collect', text: 'Find three harbour keys on the low ground (the tide covers them)', item: 'Key', n: 3, color: 0xc8a83a, done: 'THE KEYS ARE FOUND',
    spots: [[-1600, 1100, 0], [1500, -1100, 0], [600, 4500, 0], [-900, 3000, 0], [1500, -4400, 0], [5600, -2400, 0], [3400, -4500, 0]] },
  { type: 'souls', text: 'Fill the three gibbet lanterns in the upper town', need: 10, r: 750, color: 0xc8a83a, done: 'THE GIBBETS ARE LIT',
    at: [[-4500, 300, 260], [-4500, -2200, 520], [4300, 1200, 260]] },
  { type: 'shoot', text: 'Shoot out the four wreckers\' lanterns on the water', r: 60, color: 0xb8322a, done: 'THE LIGHTS ARE OUT',
    at: [[-5400, 2350, 190], [-3000, 2350, 190], [-1250, 3700, 190], [1250, 3700, 190]] },
  { type: 'hold', text: 'Stand under the gallows until the trap opens', at: [-800, 850, 0], r: 560, time: 45, color: 0xc8a83a, done: 'THE TRAP IS SPRUNG' },
] };
