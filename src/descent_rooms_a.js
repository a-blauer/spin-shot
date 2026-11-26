// Rooms 9 to 16 of the Descent: a clock's insides, a drowned library, a chapel of ash, a cold store, an orchard of
// graves, a circus ring, a pump hall and a cave of crystal. Built to the rules at the top of descent_rooms.js.
import { V, V2, R } from './mapkit.js';
import * as SH from './descent_shapes.js';

const TH = (name, floor, floor2, wall, trim, glow, lamp, fog, sh, title) => ({ name, title, floor, floor2, wall, trim, glow, lamp, fog, sh });
const mk = (theme, dims, wall, fn) => ({ theme, dims, wall, build: (K, Q, P) => fn({ ...K, ...K.M, ...Q, P }) });

export const ROOMS_A = [
  // ------------------------------------------------------------------------------------------------ CLOCKWORK HALL
  // The works of a clock the size of a building. The going train stands on a plinth in the middle; four escapement
  // towers make the corners of a square round it, and the benches where it was mended are the cover between.
  mk(TH('Clockwork Hall', 0x1c2224, 0x283034, 0x2e3838, 0xb8923a, 0x5ae0c8, [0.5, 1, 0.9], 0x12201e, [0.5, 0.6, 0.56]), [4800, 4400, 1500], { panel: 'pipes', hang: 'chain', corner: 'crates', c1: 0xb8923a, c2: 0x5a4a2a, n: 10 },
    ({ hx, hy, H, T, Box, Cyl, Oct, Glow, Ball, slabs, tile, platOct, solid, deco, hit, tall, L, lowWall, crate, chain, AX, AY, P }) => {
      const brass = 0xb8923a, dark = 0x1a1c1e, steel = 0x6a6e76, bronze = 0x7a5a2a;
      slabs(520, T.floor, T.floor2, 0x101416);
      for (const s of [-1, 1]) { tile(s * 2400 - 60, -2000, s * 2400 + 60, 2000, 2.2, bronze); tile(-2400, s * 2000 - 60, 2400, s * 2000 + 60, 2.2, bronze); }
      platOct(0, 0, 1500, 80, steel, dark);
      // the going train: three wheels on an iron frame
      for (const e of [-1, 1]) { solid(e * 560, 0, 80, 70, 150, 700, dark, false); deco(e * 560, 0, 80, 120, 200, 40, brass); }
      deco(0, 0, 760, 1200, 110, 50, dark); P.gear(-200, 0, 80 + 400, 700, brass); P.gear(250, 44, 80 + 250, 440, bronze); P.gear(330, -44, 80 + 560, 300, steel); Cyl(V(0, 0, 480), 30, 1100, steel, false, false, AX);
      hit(0, 0, 80, 1000, 120, 700, true); L(0, 0, 900, T.lamp, 2600, 3); tall(0, 0, 760);
      chain(-200, 0, 830, H); Cyl(V(-200, 0, 815), 120, 30, brass, false, false);
      // four escapement towers, a wheel on each face that looks at the middle and a pendulum inside the frame
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        const x = sx * 2400, y = sy * 2000;
        P.column(x, y, 340, T.wall, brass, 'square'); P.gear(x - sx * 190, y, 620, 420, brass, false); P.gear(x, y - sy * 190, 400, 320, bronze, true); Glow(V(x, y, 900), V(352, 352, 12), T.glow, 0);
      }
      // menders' benches, parts boxes, and a brass rail to duck behind on each approach
      for (const s of [-1, 1]) {
        P.table(s * 1300, s * 1100, true, 280); crate(s * 1500, s * 1210, 0, 90); P.table(-s * 1300, s * 1100, false, 280); P.gear(-s * 1300, s * 1100, 78 + 70, 130, brass, true, 14);
        lowWall(0, s * 2900, 760, true, dark, brass, 110, 60); lowWall(s * 3500, 0, 760, false, dark, brass, 110, 60);
        P.hung(s * 1200, -s * 3000, 560, (z) => { Cyl(V(s * 1200, -s * 3000, z - 70), 220, 30, brass, false, false, AY); Cyl(V(s * 1200, -s * 3000, z - 70), 60, 40, dark, false, false, AY); });
        for (const e of [-1, 1]) { crate(s * 3600 + e * 70, s * 2500, 0, 110); P.lampPost(s * 1100, e * 2000, 300, T.lamp, dark); }
      }
    }),

  // ------------------------------------------------------------------------------------------------ SUNKEN LIBRARY
  // Stacks either side of a reading aisle, with cross-aisles cut through them: long lanes to fight down and short ones
  // to slip through. The catalogue desk is the middle; the floor is ankle deep in places.
  mk(TH('Sunken Library', 0x1a2026, 0x232c34, 0x2c2a26, 0x7a5a36, 0x6ac8ff, [0.6, 0.85, 1], 0x10202a, [0.46, 0.56, 0.68]), [4400, 5000, 1300], { panel: 'shelf', hang: 'lamp', corner: 'crates', c1: 0x4a3626, c2: 0x7a2a22, n: 9 },
    ({ hx, hy, H, T, Box, Cyl, Oct, Glow, Ball, slabs, tile, solid, deco, hit, tall, L, candle, P }) => {
      const oak = 0x4a3626, water = 0x16384a;
      slabs(480, T.floor, T.floor2, 0x0e1418, (x) => Math.abs(x) < 700);
      P.rug(0, 0, 1400, hy * 2 - 1200, 0x5a2420, 0x8a6a2a);
      // the stacks: three ranks each side, broken by cross-aisles at the middle and the thirds
      for (const sx of [-1, 1]) for (const x of [1500, 2350, 3200]) for (const y of [-3350, -1650, 1650, 3350]) P.shelf(sx * x, y, false, 1250, 300);
      // the catalogue desk: an eight-sided counter with a lamp, and the globe beside it
      Oct(V(0, 0, 50), V(560, 560, 100), oak, true, true); Oct(V(0, 0, 104), V(600, 600, 10), T.trim, false, false); Oct(V(0, 0, 60), V(360, 360, 110), 0x2c2018, false, false);
      Cyl(V(0, 0, 150), 20, 80, 0x3a3e46, false, false); Ball(V(0, 0, 210), V(70, 70, 60), 0x2a6a4a); Glow(V(0, 0, 196), V(52, 52, 20), 0xfff0c0, 1); L(0, 0, 300, [1, 0.9, 0.6], 1700, 2.6); tall(0, 0, 360);
      // reading tables down the aisle, a green-shaded lamp on each
      for (const y of [-3000, -1500, 1500, 3000]) for (const s of [-1, 1]) {
        P.mess(s * 420, y, false, 300, oak); Cyl(V(s * 420, y, 86), 10, 34, 0x8a6a2a, false, false); Ball(V(s * 420, y, 108), V(46, 46, 22), 0x2a6a4a); Glow(V(s * 420, y, 98), V(30, 30, 6), 0xfff0c0, 1);
      }
      // what has floated off the shelves, and the water it floated on
      for (const [x, y, w, d] of [[-900, -700, 500, 800], [900, 800, 500, 900], [-1900, 0, 600, 700], [1950, 0, 600, 700], [2780, 2500, 500, 900], [-2780, -2500, 500, 900]]) { tile(x - w / 2, y - d / 2, x + w / 2, y + d / 2, 2.4, water); Glow(V(x, y, 3.8), V(w * 0.4, d * 0.3, 2), 0x6ac8ff, 0); }
      for (const [x, y] of [[1050, -2300], [-1050, 2300], [1900, 600], [-1900, -600], [2800, -900], [-2800, 900]]) { hit(x, y, 0, 150, 130, 70, true); for (let i = 0; i < 5; i++) Box(V(x + (i % 3) * 36 - 36, y + (i % 2) * 44 - 22, 8 + i * 13), V(70, 96, 14), [0x7a2a22, 0x2a4a6a, 0x3a5a2a, 0x8a6a2a, 0x4a2a5a][i], false, false, i * 23); }
      // a rolling ladder left against a stack on each side
      for (const s of [-1, 1]) { const x = s * 1500 - s * 70, y = s * 1650 - 300; for (const e of [-1, 1]) Box(V(x - s * 40, y + e * 26, 160), V(10, 10, 330), oak, false, false); for (let z = 40; z < 320; z += 46) Box(V(x - s * 40, y, z), V(10, 52, 8), oak, false, false); hit(x - s * 40, y, 0, 30, 70, 320, false); }
    }),

  // ------------------------------------------------------------------------------------------------ ASH CHAPEL
  // A chapel in the round: the altar is at the crossing and the pews face it from both ends, so whichever door you
  // come in by you walk up an aisle toward it. Slim piers down the sides, a shrine behind each pair.
  mk(TH('Ash Chapel', 0x222020, 0x302c2a, 0x34302e, 0x8a8478, 0xff9a4a, [1, 0.7, 0.4], 0x241a16, [0.6, 0.52, 0.48]), [3600, 5200, 1600], { panel: 'window', hang: 'lamp', corner: 'rubble', c1: 0x4a4440, c2: 0x5a5450, glow: 0xff7a3a, n: 6 },
    ({ hx, hy, H, T, Box, Cyl, Oct, Glow, Ball, slabs, tile, plat, solid, deco, hit, tall, L, candle, chain, P }) => {
      const stone = 0x4a4642, ash = 0x6a6660, ember = 0xff6a2a, wood = 0x3a2a22;
      slabs(450, T.floor, T.floor2, 0x141212, (x) => Math.abs(x) < 300);
      P.rug(0, 0, 560, hy * 2 - 1000, 0x5a1c18, 0x8a6a2a);
      plat(0, 0, 1000, 700, 80, stone, T.floor2);
      solid(0, 0, 80, 280, 120, 100, 0x5a5650, false); deco(0, 0, 180, 310, 150, 14, T.trim); deco(0, 0, 80, 300, 140, 16, T.trim); for (const e of [-1, 1]) candle(e * 110, 0, 194, 34); Ball(V(0, 0, 214), V(60, 60, 40), 0x8a6a2a); Glow(V(0, 0, 232), V(36, 36, 16), ember, 1);
      P.hung(0, 0, 640, (z) => { Oct(V(0, 0, z - 40), V(150, 150, 110), 0x8a6a2a, false, false); Glow(V(0, 0, z - 40), V(90, 90, 60), ember, 2); }); L(0, 0, 520, T.lamp, 2400, 3);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const x = sx * 420, y = sy * 270; solid(x, y, 80, 40, 40, 150, 0x2a2e30, false); for (let q = 0; q < 3; q++) candle(x + Math.cos(q * 2.1) * 12, y + Math.sin(q * 2.1) * 12, 230, 18 + q * 8); }
      // pews: seven rows a side in each half, all looking at the altar
      for (const s of [-1, 1]) for (let i = 0; i < 7; i++) for (const e of [-1, 1]) P.pew(e * 760, s * (1150 + i * 420), 760, -s, wood);
      // piers, and a shrine in the bay behind every other one
      for (const sx of [-1, 1]) for (const y of [-3900, -2600, -1300, 0, 1300, 2600, 3900]) {
        P.column(sx * 1900, y, 220, T.wall, T.trim, 'square');
        if (Math.abs(y) === 2600 || y === 0) { P.statue(sx * 2750, y, 250, 0x8a8478, stone, y === 0 ? 1 : 0); for (const e of [-1, 1]) candle(sx * 2750 + e * 90, y - 80, 0, 30); }
        else if (Math.abs(y) === 1300) { Ball(V(sx * 2750, y, 0), V(520, 420, 150), ash); hit(sx * 2750, y, 0, 300, 240, 60, true); Glow(V(sx * 2750 + 60, y - 30, 66), V(16, 16, 10), ember, 2); Glow(V(sx * 2750 - 80, y + 50, 50), V(12, 12, 8), ember, 2); }
      }
    }),

  // ------------------------------------------------------------------------------------------------ MEAT LOCKER
  // Low, white and cold. Sides of meat hang in rows from the rails and close the room into lanes you can see through
  // but not shoot through cleanly; the cutting floor in the middle is the only open ground.
  mk(TH('Meat Locker', 0x26303a, 0x34404a, 0x46525c, 0x9aa6b0, 0xbfe6ff, [0.8, 0.92, 1], 0x1c2a34, [0.56, 0.64, 0.74]), [5000, 3600, 900], { panel: 'planks', hang: 'none', corner: 'crates', c1: 0x9aa6b0, c2: 0x6a7680, glow: 0xdff6ff },
    ({ hx, hy, H, T, Box, Cyl, Oct, Glow, Ball, slabs, tile, solid, deco, hit, tall, L, crate, AX, AY, P }) => {
      const steel = 0x8a96a0, dark = 0x2a3038, meat = 0x8a2a26, fat = 0xe0d0c0, ice = 0xbfe6ff;
      slabs(400, T.floor, T.floor2, 0x1a2228);
      for (const y of [-2400, -1200, 1200, 2400]) {
        // the rail, hung from the roof on straps, and what hangs from it
        Box(V(0, y, 640), V(hx * 2 - 900, 24, 30), steel, false, false); for (let x = -hx + 700; x < hx - 600; x += 900) Box(V(x, y, 640 + (H - 640) / 2), V(14, 14, H - 640), dark, false, false);
        for (let x = -hx + 800, i = 0; x < hx - 700; x += 330, i++) {
          if (Math.abs(x) < 520 || i % 5 === 3) continue;   // the door aisle, and a gap every so often to cut through
          Cyl(V(x, y, 600), 8, 60, steel, false, false); solid(x, y, 250, 86, 50, 320, meat, false); deco(x, y, 250, 60, 54, 300, fat); deco(x, y + 20, 520, 40, 12, 50, fat); deco(x, y, 200, 50, 40, 50, meat);
        }
      }
      // drains down each lane, and what runs to them
      for (const y of [-1800, -600, 600, 1800]) { tile(-hx + 700, y - 26, hx - 700, y + 26, 2.2, dark); for (let x = -hx + 900; x < hx - 800; x += 600) { tile(x - 60, y - 60, x + 60, y + 60, 2.8, 0x14181c); for (const q of [-30, 0, 30]) tile(x - 50, y + q - 5, x + 50, y + q + 5, 3.4, steel); if ((x / 600 | 0) % 3 === 0) tile(x + 80, y - 14, x + 420, y + 14, 3, 0x5a1a18); } }
      // the island in the middle: a long block on a kerb, a rack of hooks and knives over it
      solid(0, 0, 0, 300, 900, 20, 0x5a6670, false); solid(0, 0, 20, 220, 800, 70, 0x7a5a3a); deco(0, 0, 90, 236, 816, 10, 0x5a3e26); for (const y of [-300, 0, 300]) { deco(40, y, 100, 90, 60, 30, meat); deco(-50, y + 90, 100, 14, 120, 6, steel); }
      for (const e of [-1, 1]) Box(V(0, e * 380, 520 + (H - 520) / 2), V(14, 14, H - 520), dark, false, false); Box(V(0, 0, 520), V(40, 800, 20), steel, false, false); for (let y = -330; y <= 330; y += 110) { Cyl(V(0, y, 480), 6, 70, steel, false, false); Box(V(0, y, 436), V(26, 8, 20), steel, false, false); }
      hit(0, 0, 0, 220, 800, 90, true); L(0, 0, 440, T.lamp, 2200, 3);
      // strip curtains at the ends of the door aisle
      for (const s of [-1, 1]) { Box(V(0, s * 2950, 600), V(1000, 20, 30), steel, false, false); for (let x = -470; x <= 470; x += 78) { if (Math.abs(x) < 160) continue; Box(V(x, s * 2950, 320), V(66, 6, 540), (x / 78 | 0) % 2 ? 0x9ab6c8 : 0x7a96a8, false, false); } }
      // the cutting floor: blocks, a band saw, tubs
      for (const s of [-1, 1]) {
        solid(s * 700, 0, 0, 120, 120, 84, 0x7a5a3a); deco(s * 700, 0, 84, 40, 12, 26, steel); P.table(s * 1500, s * 300, true, 300, steel);
        solid(s * 2500, -s * 200, 0, 170, 130, 150, dark); deco(s * 2500, -s * 200, 150, 30, 120, 190, steel); Cyl(V(s * 2500, -s * 200, 250), 110, 14, steel, false, false, AX);
        for (const e of [-1, 1]) { Cyl(V(s * 1150 + e * 90, -s * 420, 36), 110, 72, dark, true, false); Cyl(V(s * 1150 + e * 90, -s * 420, 70), 96, 6, meat, false, false); }
        // freezer cabinets back to back down the far lanes, and ice stacked by them
        for (const e of [-1, 1]) { solid(s * 3600, e * 1800, 0, 520, 180, 220, 0x5a6670); deco(s * 3600, e * 1800 - e * 92, 30, 480, 6, 170, dark); Glow(V(s * 3600, e * 1800 - e * 96, 190), V(440, 4, 10), ice, 0); }
        for (const [dx, dy, sz] of [[0, 0, 130], [140, 30, 110], [60, 130, 100]]) { solid(s * 3900 + dx - 60, -s * 300 + dy, 0, sz, sz, sz * 0.8, ice); }
        crate(s * 2000, s * 3000, 0, 110); crate(s * 2120, s * 3040, 0, 90);
        L(s * 1400, 0, 560, T.lamp, 2000, 2.6); L(s * 3600, 0, 560, T.lamp, 1800, 2.2);
      }
      for (let x = -3000; x <= 3000; x += 1500) tile(x - 40, -hy + 600, x + 40, hy - 600, 2.2, dark);
    }),

  // ------------------------------------------------------------------------------------------------ BONE ORCHARD
  // A burying ground that was roofed over and forgotten. Dead trees, plots railed off with iron, a mausoleum in the
  // middle. Open ground with thin cover: you fight from trunk to trunk and over the rails.
  mk(TH('Bone Orchard', 0x1a1f1a, 0x242a22, 0x2a2e2c, 0x6a6e70, 0x9ad8a0, [0.6, 0.9, 0.7], 0x121a16, [0.46, 0.56, 0.5]), [5000, 4800, 1500], { panel: 'arch', hang: 'vine', corner: 'rubble', c1: 0x4a4e50, c2: 0x1a1e1c, n: 26 },
    ({ hx, hy, H, T, Box, BoxRot, Cyl, Oct, Glow, Ball, Pyramid, slabs, tile, plat, solid, deco, hit, tall, L, candle, P }) => {
      const stone = 0x5a5e60, earth = 0x2a241c, path = 0x3a3a34;
      for (let i = 0; i < 90; i++) { const x = ((i * 733) % (hx * 2 - 400)) - hx + 200, y = ((i * 419) % (hy * 2 - 400)) - hy + 200, w = 240 + (i % 5) * 90; tile(x - w, y - w * 0.7, x + w, y + w * 0.7, 1.6, i % 3 ? T.floor2 : earth); }
      tile(-240, -hy, 240, hy, 2.4, path); tile(-hx + 300, -200, hx - 300, 200, 2.4, path);
      // the mausoleum
      plat(0, 0, 900, 1100, 40, stone, T.floor2);
      solid(0, 0, 40, 620, 800, 380, 0x4a4e50); deco(0, 0, 420, 700, 880, 40, stone); Pyramid(V(0, 0, 460 + 110), V(700, 880, 220), 0x3a3e40);
      for (const e of [-1, 1]) { for (const c of [-1, 1]) Cyl(V(c * 250, e * 430, 40 + 190), 70, 380, stone, false, false); deco(0, e * 402, 40, 200, 8, 300, 0x0c0e10); Glow(V(0, e * 408, 300), V(120, 4, 30), T.glow, 0); }
      // its doors: bronze, ajar, a lintel with a name plate and an urn each side; a mourning figure on the ridge
      for (const e of [-1, 1]) { deco(0, e * 400, 40, 260, 20, 330, stone); deco(-60, e * 414, 46, 96, 10, 290, 0x4a5a4a); Box(V(86, e * 440, 40 + 150), V(96, 10, 290), 0x4a5a4a, false, false, e * 50); deco(0, e * 414, 350, 300, 30, 40, 0x7a7e80); deco(0, e * 432, 356, 180, 6, 24, 0xc8c4b0);
        for (const c of [-1, 1]) { Cyl(V(c * 380, e * 500, 40 + 50), 60, 100, stone, false, false); Ball(V(c * 380, e * 500, 40 + 130), V(90, 90, 80), 0x7a7e80); Cyl(V(c * 380, e * 500, 40 + 176), 50, 14, stone, false, false); }
        deco(0, e * 425, 420, 720, 40, 60, 0x7a7e80); }
      for (const z of [130, 260]) deco(0, 0, 40 + z, 632, 812, 12, 0x3a3e40);
      Box(V(0, 0, 690), V(60, 60, 30), stone, false, false); Box(V(0, 0, 760), V(40, 30, 110), 0x8a8e90, false, false); Ball(V(0, 0, 840), V(40, 40, 44), 0x8a8e90); for (const e of [-1, 1]) BoxRot(V(e * 50, 0, 760), V(14, 60, 130), 0x8a8e90, R(0, 0, e * 30), false);
      L(0, 0, 900, T.lamp, 2600, 2.6); tall(0, 0, 760);
      // lanterns on shepherd's crooks down the paths
      for (const s of [-1, 1]) for (const d of [1100, 2300, 3500]) { for (const [x, y] of [[s * 300, d], [s * 300, -d], [d, s * 260], [-d, s * 260]]) { if (Math.abs(x) > hx - 600 || Math.abs(y) > hy - 700) continue; Box(V(x, y, 100), V(10, 10, 200), 0x2a2e30, false, false); Box(V(x + 20, y, 200), V(50, 8, 8), 0x2a2e30, false, false); Box(V(x + 40, y, 170), V(24, 24, 36), 0x2a2e30, false, false); Glow(V(x + 40, y, 170), V(16, 16, 24), T.glow, 0); } }
      // plots: a rail round three sides, graves in two ranks, a tree at the back
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const [px, py] of [[1700, 1500], [3300, 1500], [1700, 3300], [3300, 3300]]) {
        const x = sx * px, y = sy * py;
        P.fence(x, y + sy * 480, 1000, true, 0x2a2e30); P.fence(x + sx * 500, y, 960, false, 0x2a2e30);
        for (const gx of [-300, 0, 300]) for (const gy of [-250, 150]) { if ((gx + gy + px) % 3 === 0) { Box(V(x + gx, y + gy, 70), V(18, 14, 140), 0x7a7e80, false, false); Box(V(x + gx, y + gy, 100), V(80, 14, 18), 0x7a7e80, false, false); hit(x + gx, y + gy, 0, 80, 24, 130, false); tile(x + gx - 40, y + gy + 14, x + gx + 40, y + gy + 210, 2.6, 0x2a241c); } else P.grave(x + gx, y + gy, (gx + gy) % 200 ? stone : 0x7a7e80, ((gx * 7 + gy) % 13) - 6); }
        if ((px + py) % 3200 === 0) P.deadTree(x - sx * 330, y + sy * 330, 620 + (px % 500)); else P.lampPost(x - sx * 420, y - sy * 380, 280, T.lamp, 0x2a2e30);
      }
      for (const s of [-1, 1]) { P.deadTree(s * 900, s * 2400, 700); P.deadTree(-s * 900, s * 2400, 560); P.deadTree(s * 2500, -s * 300, 640); P.wagon(s * 800, -s * 1250, true, 0x3a2c20); }
      // an open grave by each path, and the spoil from it
      for (const s of [-1, 1]) { tile(s * 520, s * 3000 - 120, s * 520 + 110, s * 3000 + 120, 2.8, 0x060606); Ball(V(s * 760, s * 3000, 0), V(260, 300, 120), earth); hit(s * 760, s * 3000, 0, 180, 200, 50, true); Box(V(s * 700, s * 3000 + 150, 60), V(10, 10, 130), 0x5a3e26, false, false, 0); }
    }),

  // ------------------------------------------------------------------------------------------------ THE BIG TOP
  // The ring is one step up and thirty paces across, with the king pole in the middle; banked seats look down on it
  // from two sides, and the beasts' wagons and the props stand in the wings.
  mk(TH('The Big Top', 0x2a1e1a, 0x3a2a22, 0x4a2422, 0xd8b04a, 0xffd86a, [1, 0.85, 0.5], 0x2a1612, [0.66, 0.5, 0.44]), [4600, 4600, 1700], { panel: 'banner', hang: 'none', corner: 'crates', c1: 0xd8b04a, c2: 0xa8281e, n: 14 },
    ({ M, hx, hy, H, T, Box, Cyl, Oct, Glow, Ball, ConeShape, slabs, tile, plat, solid, deco, hit, tall, L, crate, barrel, AX, AY, P }) => {
      const red = 0xa8281e, cream = 0xe8dcc0, gold = 0xd8b04a, saw = 0xa8925a, wood = 0x5a3e26;
      slabs(520, T.floor, T.floor2, 0x1a1210);
      Oct(V(0, 0, 22), V(2600, 2600, 44), red, true, false); Oct(V(0, 0, 23), V(2440, 2440, 44), saw, false, false); for (let q = 0; q < 8; q++) { const a = q / 8 * 6.283 + 0.39; Glow(V(Math.cos(a) * 1240, Math.sin(a) * 1240, 46), V(180, 24, 3), gold, 0, R(0, a * 57.3 + 90, 0)); }
      P.column(0, 0, 130, cream, gold, 'round'); for (let z = 150; z < H - 100; z += 300) Cyl(V(0, 0, z), 136, 60, red, false, false); L(0, 0, 700, T.lamp, 3000, 3);
      // the canvas: striped from the king pole out to the eaves, and pennants strung from the pole to the four quarter poles
      { const [k, b] = SH.canopy(90, 4300, 560, red, cream, 24); M.Shape(k, b, V(0, 0, H - 30), R(0, 7.5, 0)); }
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const [k, b] = SH.bunting([sx * 1700, sy * 1700, 0], 150, [red, gold, cream, 0x2a6a8a]); M.Shape(k, b, V(sx * 50, sy * 50, 1060), R(0, 0, 0)); }
      for (const [ax, ay, bx, by] of [[1, 1, 1, -1], [1, -1, -1, -1], [-1, -1, -1, 1], [-1, 1, 1, 1]]) { const [k, b] = SH.bunting([(bx - ax) * 1750, (by - ay) * 1750, 0], 180, [gold, red, 0x2a6a8a, cream]); M.Shape(k, b, V(ax * 1750, ay * 1750, 980), R(0, 0, 0)); }
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { P.column(sx * 1750, sy * 1750, 90, cream, gold, 'round'); for (let z = 200; z < H - 100; z += 400) Cyl(V(sx * 1750, sy * 1750, z), 96, 50, red, false, false); }
      // banked seats: four tiers, on the two sides away from the doors
      for (const s of [-1, 1]) { plat(s * 3350, 0, 500, 2600, 160, wood, 0x3a2c20); for (let y = -1100; y <= 1100; y += 440) P.bench(s * 3400, y, false, 360, 0x6a4e30, 160); }
      // in the ring: tubs, a hoop, the cannon
      for (const [x, y, c] of [[-500, 300, red], [420, 520, 0x2a6a8a], [600, -400, gold], [-450, -520, cream]]) { Cyl(V(x, y, 44 + 45), 120, 90, c, true, false); Cyl(V(x, y, 44 + 92), 140, 8, cream, false, false); for (let q = 0; q < 6; q++) Box(V(x + Math.cos(q * 1.047) * 61, y + Math.sin(q * 1.047) * 61, 44 + 45), V(6, 30, 70), gold, false, false, q * 60 + 90); }
      solid(-900, -850, 44, 150, 320, 80, wood, false); Cyl(V(-900, -800, 44 + 150), 120, 380, 0x2a2e30, false, false, R(0, 0, 62)); for (const e of [-1, 1]) Cyl(V(-900 + e * 84, -870, 44 + 60), 120, 14, red, false, false, AX); hit(-900, -800, 44, 160, 380, 250, false);
      // the wings: beast wagons (barred), props, a ticket wagon
      for (const s of [-1, 1]) {
        const wx = s * 1200, wy = s * 3300; { const [k, b] = SH.beastWagon(wood, red, gold, 0x2a2e30); M.Shape(k, b, V(wx, wy, 0), R(0, s > 0 ? 0 : 180, 0)); } hit(wx, wy, 0, 540, 250, 360, true);
        P.stall(-s * 1500, s * 3200, true, red, cream); crate(s * 2600, s * 2700, 0, 110, red, gold); crate(s * 2700, s * 2600, 0, 90, 0x2a6a8a, gold); barrel(s * 2500, s * 2580); Ball(V(s * 2400, s * 2760, 44), V(88, 88, 88), [red, 0x2a6a8a][s > 0 ? 0 : 1]); hit(s * 2400, s * 2760, 0, 80, 80, 86, false);
        P.hung(s * 700, -s * 700, 900, (z) => { Cyl(V(s * 700, -s * 700, z - 8), 12, 260, wood, false, false, AX); });
      }
    }),

  // ------------------------------------------------------------------------------------------------ PUMP STATION
  // Wide, loud and wet. Four tanks stand in the middle with the pump engines between them; mains run across the floor
  // as cover and across the roof for the look of it, and a console desk faces each door.
  mk(TH('Pump Station', 0x1c2422, 0x28322e, 0x30403a, 0x6a7a72, 0x5aff9a, [0.5, 1, 0.7], 0x12221c, [0.46, 0.6, 0.54]), [5200, 3800, 1200], { panel: 'pipes', hang: 'lamp', corner: 'barrels', c1: 0x4a6a5a, c2: 0x8a4a2a, n: 8 },
    ({ hx, hy, H, T, Box, Cyl, Oct, Glow, Ball, slabs, tile, plat, solid, deco, hit, tall, L, barrel, crate, AX, AY, P }) => {
      const green = 0x3a6a5a, rust = 0x8a4a2a, dark = 0x1c2220, steel = 0x6a7a72, red = 0xa02a22;
      slabs(520, T.floor, T.floor2, 0x0e1412);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { P.tank(sx * 1500, sy * 1150, 760, 820, green, dark); Glow(V(sx * 1500, sy * 1150 - sy * 384, 420), V(60, 6, 300), T.glow, 0); for (let z = 150; z < 800; z += 110) Box(V(sx * 1500 + sx * 386, sy * 1150, z), V(14, 70, 10), steel, false, false); Cyl(V(sx * 1500, sy * 1150, 820 + (H - 820) / 2), 150, H - 820, rust, false, false); }
      // pump engines between the tanks, each with its flywheel
      for (const sx of [-1, 1]) { solid(sx * 1500, 0, 0, 520, 300, 230, dark); deco(sx * 1500, 0, 230, 400, 200, 60, steel); P.gear(sx * 1500, 180, 260, 360, rust, true, 30); Cyl(V(sx * 1500, 0, 330), 90, 120, steel, false, false); Glow(V(sx * 1500 - sx * 262, 0, 150), V(6, 120, 60), T.glow, 0); L(sx * 1500, 0, 500, T.lamp, 1800, 2.4); }
      // mains across the floor: waist high, each with a stile over it at the middle
      const main = (x, y, len, along, col) => { Cyl(V(x, y, 62), 110, len, col, false, false, along ? AX : AY); for (let p = -len / 2 + 60; p <= len / 2; p += (len - 120) / 3) { Cyl(V(x + (along ? p : 0), y + (along ? 0 : p), 62), 140, 22, dark, false, false, along ? AX : AY); deco(x + (along ? p : 0), y + (along ? 0 : p), 0, along ? 30 : 90, along ? 90 : 30, 20, dark); } hit(x, y, 0, along ? len : 110, along ? 110 : len, 118, true); };
      for (const s of [-1, 1]) { main(s * 3500, s * 1500, 1700, false, rust); main(-s * 3500, s * 1900, 1100, false, green); main(s * 600, s * 2500, 1500, true, green); main(0, s * 400, 900, true, rust); }
      // valve stands and console desks
      for (const s of [-1, 1]) {
        for (const e of [-1, 1]) { const x = s * 3500 + e * 240, y = s * 500; solid(x, y, 0, 30, 30, 110, steel, false); Cyl(V(x, y, 124), 90, 12, red, false, false); Cyl(V(x, y, 124), 24, 20, dark, false, false); }
        const cy = s * 3000; solid(-s * 1600, cy, 0, 420, 120, 96, dark); Box(V(-s * 1600, cy - s * 30, 126), V(400, 60, 60), steel, false, false); for (let q = -2; q <= 2; q++) Glow(V(-s * 1600 + q * 70, cy - s * 62, 130), V(40, 4, 30), [T.glow, 0xffcd5a, red][Math.abs(q) % 3], 0);
        barrel(s * 2700, -s * 2800); barrel(s * 2810, -s * 2760); crate(s * 4300, s * 2900, 0, 110);
      }
      // mains under the roof
      for (const y of [-2400, 0, 2400]) { Cyl(V(0, y, H - 190), 130, hx * 2 - 300, y ? green : rust, false, false, AX); for (let x = -hx + 600; x < hx; x += 1300) Box(V(x, y, H - 95), V(20, 20, 190), dark, false, false); }
      tile(-260, -hy + 500, 260, hy - 500, 2.4, 0x101816); for (let y = -hy + 560; y < hy - 500; y += 80) tile(-250, y, 250, y + 8, 3.2, steel);
    }),

  // ------------------------------------------------------------------------------------------------ CRYSTAL CAVERN
  // No straight line in it. Clusters of crystal stand like trees in a wood, the great one on a rise in the middle; the
  // rock has been left in stumps and ridges. You never see far, and the light comes up from the floor.
  mk(TH('Crystal Cavern', 0x1c1826, 0x282236, 0x2a2440, 0x6a5a8a, 0xd08cff, [0.8, 0.6, 1], 0x1a1230, [0.52, 0.46, 0.7]), [4800, 4800, 1500], { panel: 'none', hang: 'spike', corner: 'rubble', c1: 0x8a6ad0, c2: 0x3a3050, n: 36, rail: false },
    ({ hx, hy, H, T, Box, Cyl, Oct, Glow, Ball, Pyramid, tile, platOct, solid, deco, hit, tall, L, lowWall, P }) => {
      const vio = [0xb07aff, 0x7ad0ff, 0xff8ad0], cyan = [0x7ad0ff, 0x8affd8, 0xb07aff], rose = [0xff8ad0, 0xffc08a, 0xb07aff], rock = 0x3a3250, rock2 = 0x2a2440;
      for (let i = 0; i < 110; i++) { const x = ((i * 947) % (hx * 2 - 300)) - hx + 150, y = ((i * 613) % (hy * 2 - 300)) - hy + 150, w = 220 + (i % 6) * 80; Oct(V(x, y, 1.2 + (i % 3) * 0.5), V(w * 2, w * 1.6, 2), i % 4 ? T.floor2 : rock2, false, false); }
      platOct(0, 0, 1100, 120, rock, rock2);
      P.crystal(0, 0, 980, vio, 0xd08cff); for (let q = 0; q < 5; q++) { const a = q * 1.257 + 0.3; Pyramid(V(Math.cos(a) * 400, Math.sin(a) * 400, 120 + 130), V(110, 110, 260), vio[q % 3], R(Math.cos(a) * 18, q * 30, -Math.sin(a) * 18)); } L(0, 0, 800, T.lamp, 3000, 3);
      // the wood of crystal: placed by hand in three rough rings, big ones where the lines of sight would run
      const C = [[1500, 600, 520, vio], [-1500, -600, 520, cyan], [700, 1700, 380, rose], [-700, -1700, 380, vio], [-1400, 1300, 460, cyan], [1400, -1300, 460, rose], [2700, 300, 640, cyan], [-2700, -300, 640, rose], [2300, 2200, 500, vio], [-2300, -2200, 500, cyan],
        [-2400, 2100, 420, rose], [2400, -2100, 420, vio], [600, 3200, 440, cyan], [-600, -3200, 440, rose], [3700, 1700, 380, rose], [-3700, -1700, 380, vio], [3600, -1500, 520, cyan], [-3600, 1500, 520, rose], [1600, 3500, 300, vio], [-1600, -3500, 300, cyan], [-3300, 3300, 460, vio], [3300, -3300, 460, cyan]];
      for (const [x, y, h, cols] of C) P.crystal(x, y, h, cols, cols[0]);
      // stumps of the living rock, and ridges of it to get behind
      for (const [x, y, d, h] of [[2000, 1000, 520, 760], [-2000, -1000, 520, 760], [-900, 2500, 440, 520], [900, -2500, 440, 520], [3400, 2900, 480, 900], [-3400, -2900, 480, 900]]) { Oct(V(x, y, h / 2), V(d, d * 0.9, h), rock, true, true); Oct(V(x, y, 40), V(d + 160, d + 140, 80), rock2, false, false); Pyramid(V(x, y, h + 90), V(d * 0.8, d * 0.7, 180), rock); tall(x, y, d / 2 + 200); }
      for (const s of [-1, 1]) { lowWall(s * 300, s * 2300, 700, true, rock, rock2, 120, 140); lowWall(s * 3000, -s * 900, 700, false, rock, rock2, 120, 140); lowWall(-s * 1900, s * 300, 600, false, rock, rock2, 120, 140); }
      // shards everywhere underfoot, veins of it in the walls, and what the last people to dig here left behind
      for (let i = 0; i < 60; i++) { const a = i * 2.399, r = 700 + (i * 197) % 3700, x = Math.cos(a) * r, y = Math.sin(a) * r; if (Math.abs(x) > hx - 400 || Math.abs(y) > hy - 800 || (Math.abs(x) < 1500 && Math.abs(y) > hy - 1500)) continue; const c = [vio, cyan, rose][i % 3]; for (let q = 0; q < 3; q++) { const h = 50 + ((i + q) % 4) * 26; Pyramid(V(x + q * 34 - 30, y + (q % 2) * 40, h * 0.45), V(h * 0.34, h * 0.34, h), c[q], R((q - 1) * 16, i * 23, (q - 1) * -10)); } if (i % 5 === 0) Glow(V(x, y, 3), V(120, 120, 2), c[0], 7); }
      for (const sx of [-1, 1]) for (let y = -hy + 500; y < hy - 300; y += 380) { if (Math.abs(Math.abs(y) - 500) < 260) continue; const z = 200 + ((y * 7 + 9999) % 600), c = [0xb07aff, 0x7ad0ff, 0xff8ad0][Math.abs(Math.round(y / 380)) % 3]; Glow(V(sx * (hx - 4), y, z), V(6, 240, 16), c, 0, R(0, 0, ((y / 380) % 2 ? 24 : -18))); Glow(V(sx * (hx - 4), y + 90, z + 130), V(6, 120, 10), c, 0, R(0, 0, -30)); Pyramid(V(sx * (hx - 30), y - 60, z - 60), V(60, 60, 130), c, R(0, 0, sx * 70)); }
      for (const s of [-1, 1]) { const x = s * 1100, y = -s * 3600; solid(x, y, 30, 170, 230, 100, 0x4a3a2c); for (const a of [-1, 1]) for (const e of [-1, 1]) Cyl(V(x + e * 70, y + a * 70, 24), 46, 14, 0x3a3e46, false, false, R(90, 0, 0)); for (let q = 0; q < 4; q++) Pyramid(V(x + (q % 2) * 60 - 30, y + (q > 1 ? 50 : -50), 160), V(50, 50, 90), vio[q % 3], R(q * 9, q * 30, 0)); for (const e of [-1, 1]) { Box(V(x + e * 70, y, 2.6), V(12, 900, 6), 0x8a8e96, false, false); }
        for (let t = -400; t <= 400; t += 160) Box(V(x, y + t, 2), V(240, 44, 4), 0x3a2c20, false, false); Box(V(x + 260, y + 120, 60), V(10, 10, 120), 0x5a3e26, false, false, 0); Box(V(x + 260, y + 120, 124), V(90, 12, 14), 0x8a8e96, false, false); P.lampPost(x - 300, y - 200, 220, T.lamp, 0x2a2e30); }
      // pools of light in the low places
      for (const [x, y, d] of [[900, -700, 500], [-900, 700, 500], [2900, 1300, 420], [-2900, -1300, 420], [-1500, 3200, 460], [1500, -3200, 460], [3900, -400, 380], [-3900, 400, 380]]) { Cyl(V(x, y, 2.2), d, 3, 0x241a40, false, false); Glow(V(x, y, 4.4), V(d * 0.55, d * 0.55, 2), T.glow, 1); }
    }),
];
