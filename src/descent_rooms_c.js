// Rooms 25 to 32 of the Descent: an apothecary, an armoury, a magma chamber, a warehouse, a throne room, a
// bathhouse, a feast hall and a salt mine. Built to the rules at the top of descent_rooms.js.
import { V, V2, R } from './mapkit.js';

const TH = (name, floor, floor2, wall, trim, glow, lamp, fog, sh, title) => ({ name, title, floor, floor2, wall, trim, glow, lamp, fog, sh });
const mk = (theme, dims, wall, fn) => ({ theme, dims, wall, build: (K, Q, P) => fn({ ...K, ...K.M, ...Q, P }) });

export const ROOMS_C = [
  // ------------------------------------------------------------------------------------------------ APOTHECARY
  // A laboratory of glass. Tall vats of something stand in two rows down the room and light it in their own colours;
  // benches of retorts run between them, and the still in the middle feeds them all through pipes overhead.
  mk(TH('Apothecary', 0x1e2226, 0x2a3036, 0x303840, 0x8a7a4a, 0x7affb0, [0.6, 1, 0.75], 0x14201c, [0.5, 0.6, 0.56]), [4000, 5000, 1300], { panel: 'shelf', hang: 'none', corner: 'crates', c1: 0x4a3626, c2: 0x3a8a6a, glow: 0x7affb0 },
    ({ hx, hy, H, T, Box, Cyl, Oct, Glow, Ball, ConeShape, slabs, tile, platOct, solid, deco, hit, tall, L, crate, AX, AY, P }) => {
      const brass = 0xb8923a, iron = 0x3a3e46, wood = 0x4a3626, liq = [0x7affb0, 0xff7ad0, 0x7ad0ff, 0xffd86a];
      slabs(450, T.floor, T.floor2, 0x101416);
      // the still
      platOct(0, 0, 900, 80, 0x4a4e56, iron);
      Cyl(V(0, 0, 80 + 160), 420, 320, brass, true, false); Ball(V(0, 0, 80 + 330), V(420, 420, 300), brass); ConeShape(V(0, 0, 80 + 560), V(200, 200, 260), brass); Cyl(V(0, 0, 80 + 700 + (H - 780) / 2), 50, H - 780, brass, false, false);
      Cyl(V(0, 0, 80 + 30), 470, 50, iron, false, false); Glow(V(0, -214, 80 + 120), V(120, 6, 90), 0xff7a2a, 0); L(0, 0, 760, T.lamp, 2400, 3); tall(0, 0, 520);
      // vats: two rows of five, colours by turn, each piped to the main under the roof
      for (const sx of [-1, 1]) { Cyl(V(sx * 1900, 0, H - 200), 70, hy * 2 - 1600, brass, false, false, AY); Cyl(V(sx * 950, 0, H - 200), 50, 1900, brass, false, false, AX);
        [-3400, -1700, 0, 1700, 3400].forEach((y, i) => { P.vat(sx * 1900, y, 380, 520, liq[(i + (sx > 0 ? 0 : 2)) % 4]); Cyl(V(sx * 1900, y, 660 + (H - 860) / 2), 30, H - 860, brass, false, false); for (let b = 0; b < 4; b++) Glow(V(sx * 1900 + (b % 2 ? 60 : -50), y + (b > 1 ? 50 : -60), 140 + b * 110), V(22, 22, 22), 0xffffff, 2); }); }
      // benches of glassware
      const glass = (x, y, z, i) => { const c = liq[i % 4]; if (i % 3 === 0) { Ball(V(x, y, z + 20), V(40, 40, 40), c); Cyl(V(x, y, z + 50), 10, 30, 0xc8d8d8, false, false); } else if (i % 3 === 1) { ConeShape(V(x, y, z + 26), V(40, 40, 52), c); Cyl(V(x, y, z + 58), 8, 14, 0xc8d8d8, false, false); } else { Cyl(V(x, y, z + 30), 18, 60, c, false, false); } };
      for (const s of [-1, 1]) for (const y of [-2550, -850, 850, 2550]) { P.table(s * 900, y, false, 520, wood); for (let q = 0; q < 5; q++) glass(s * 900 + ((q * 37) % 40) - 20, y - 200 + q * 100, 78, q + (y > 0 ? 1 : 0)); Cyl(V(s * 900, y, 96), 60, 8, iron, false, false); Glow(V(s * 900, y, 104), V(20, 20, 16), 0x5a9aff, 3); }
      // the dispensary counters across each end, herb racks, carboys
      for (const s of [-1, 1]) {
        solid(-600, s * 3900, 0, 900, 110, 96, wood); deco(-600, s * 3900, 96, 930, 140, 10, 0x2c2018); for (let q = 0; q < 6; q++) glass(-950 + q * 140, s * 3900, 106, q);
        for (const e of [-1, 1]) { P.shelf(e * 3200, s * 4000, true, 700, 280, wood, liq); Ball(V(e * 2700, s * 2550, 60), V(120, 120, 120), 0x3a8a6a); Cyl(V(e * 2700, s * 2550, 130), 40, 40, 0x3a8a6a, false, false); hit(e * 2700, s * 2550, 0, 110, 110, 140, false); crate(e * 2850, s * 2450, 0, 90); }
      }
    }),

  // ------------------------------------------------------------------------------------------------ THE ARMOURY
  // A drill hall. Racks of pikes and muskets stand in files, suits of plate line the piers, and the practice ground
  // in the middle is railed off with butts and straw men. Good cover everywhere, none of it tall.
  mk(TH('The Armoury', 0x24221e, 0x302c26, 0x3a342c, 0x8a8e96, 0xff6a3a, [1, 0.7, 0.45], 0x201a14, [0.6, 0.54, 0.46]), [4600, 4400, 1300], { panel: 'banner', hang: 'chain', corner: 'crates', c1: 0x8a8e96, c2: 0x7a1c1c, n: 8 },
    ({ hx, hy, H, T, Box, BoxRot, Cyl, Oct, Glow, Ball, slabs, tile, plat, solid, deco, hit, tall, L, crate, barrel, AX, AY, P }) => {
      const steel = 0x8a8e96, wood = 0x5a3e26, red = 0x7a1c1c, straw = 0xb89a3a;
      slabs(480, T.floor, T.floor2, 0x15120e, (x, y) => Math.abs(x) < 1300 && Math.abs(y) < 1100);
      tile(-1300, -1100, 1300, 1100, 1.6, 0x6a5a3a); for (const s of [-1, 1]) { P.fence(0, s * 1150, 1800, true, wood); P.fence(s * 1350, 0, 1400, false, wood); }
      // straw men and butts on the practice ground
      const dummy = (x, y) => { solid(x, y, 0, 30, 30, 150, wood, false); deco(x, y, 110, 130, 20, 16, wood); Box(V(x, y, 110), V(70, 50, 90), straw, false, false); Ball(V(x, y, 186), V(50, 50, 54), straw); solid(x, y, 0, 90, 90, 12, wood, false); };
      const butt = (x, y) => { solid(x, y, 0, 60, 200, 30, wood, false); Cyl(V(x, y, 130), 200, 50, straw, true, false, AX); for (const [d, c] of [[160, 0xe8dcc0], [110, red], [50, 0xd8b04a]]) Cyl(V(x, y, 130), d, 54 + (200 - d) * 0.02, c, false, false, AX); };
      dummy(-500, 400); dummy(500, -400); dummy(-600, -500); dummy(650, 520); butt(-1100, 0); butt(1100, 0); L(0, 0, 700, T.lamp, 2400, 2.6);
      // files of racks
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { for (const x of [2100, 2700, 3300]) for (const y of [900, 1900]) P.rack(sx * x, sy * y, false); for (const x of [700, 1500]) P.rack(sx * x, sy * 2600, true); }
      // piers with a suit of plate at the foot of each, and the colours hung between
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { P.column(sx * 1750, sy * 1750, 260, T.wall, steel, 'square'); P.armor(sx * 1750 - sx * 220, sy * 1750, steel); P.armor(sx * 1750, sy * 1750 - sy * 220, 0x6a6e76); P.column(sx * 3900, sy * 3000, 220, T.wall, steel, 'square'); }
      for (const s of [-1, 1]) P.hung(0, s * 1750, 900, (z) => { Box(V(0, s * 1750, z - 6), V(700, 12, 12), wood, false, false); Box(V(0, s * 1750, z - 200), V(600, 6, 380), red, false, false); Box(V(0, s * 1750, z - 200), V(200, 10, 200), 0xd8b04a, false, false, 45); });
      // the forge corner and the powder corner
      for (const s of [-1, 1]) {
        solid(s * 3700, s * 300, 0, 300, 220, 110, 0x4a2c22); Glow(V(s * 3700, s * 300, 108), V(240, 160, 8), 0xff6a1a, 0); solid(s * 3300, s * 300, 0, 60, 60, 50, wood, false); deco(s * 3300, s * 300, 50, 60, 130, 40, 0x17181c); L(s * 3700, s * 300, 300, [1, 0.5, 0.15], 1200, 2);
        barrel(-s * 3700, s * 400); barrel(-s * 3590, s * 340); crate(-s * 3650, s * 560, 0, 110); for (const e of [-1, 1]) { crate(e * 2600, s * 3500, 0, 110); P.table(e * 900, s * 3550, true, 300, wood); for (let q = -1; q <= 1; q++) Ball(V(e * 900 + q * 80, s * 3550, 96), V(44, 44, 40), steel); }
      }
    }),

  // ------------------------------------------------------------------------------------------------ MAGMA CHAMBER
  // The floor is a crust over fire. Channels of it cut the room into islands joined by slabs of basalt; the basalt
  // stands in columns where it cooled, and a forge-altar sits on the biggest island. The glow is all from below.
  mk(TH('Magma Chamber', 0x1a1414, 0x241a18, 0x2a1e1c, 0x5a4a44, 0xff5a1a, [1, 0.5, 0.2], 0x2a0e08, [0.66, 0.42, 0.36]), [4800, 4400, 1500], { panel: 'none', hang: 'spike', corner: 'rubble', c1: 0x1a1414, c2: 0x3a2a26, n: 30, rail: false },
    ({ hx, hy, H, T, Box, Cyl, Oct, Glow, Ball, Pyramid, tile, plat, platOct, solid, deco, hit, tall, L, lowWall, chain, P }) => {
      const basalt = 0x2a2426, dark = 0x141012, hot = 0xff5a1a, yel = 0xffb040;
      for (let i = 0; i < 90; i++) { const x = ((i * 811) % (hx * 2 - 300)) - hx + 150, y = ((i * 577) % (hy * 2 - 300)) - hy + 150, w = 220 + (i % 5) * 90; Oct(V(x, y, 1.2 + (i % 3) * 0.5), V(w * 2, w * 1.6, 2), i % 3 ? T.floor2 : dark, false, false); }
      // rivers of it: glowing sheets in shallow beds, kerbed so nothing walks in; slabs bridge them
      const river = (x0, y0, x1, y1) => { tile(x0, y0, x1, y1, 3.2, 0x6a1a08); Glow(V((x0 + x1) / 2, (y0 + y1) / 2, 5), V((x1 - x0) * 0.7, (y1 - y0) * 0.7, 2), hot, 0); Glow(V((x0 + x1) / 2, (y0 + y1) / 2, 6.6), V((x1 - x0) * 0.3, (y1 - y0) * 0.3, 2), yel, 0); hit((x0 + x1) / 2, (y0 + y1) / 2, 0, x1 - x0, y1 - y0, 70, true); for (let k = 0; k < 6; k++) { const px = x0 + ((k * 37 + 11) % 100) / 100 * (x1 - x0), py = y0 + ((k * 61 + 7) % 100) / 100 * (y1 - y0); Oct(V(px, py, 5), V(120, 100, 8), dark, false, false); } };
      for (const s of [-1, 1]) { river(s * 1300 - 220, -2900, s * 1300 + 220, -700); river(s * 1300 - 220, 700, s * 1300 + 220, 2900); river(-3400, s * 1700 - 200, -1900, s * 1700 + 200); river(1900, s * 1700 - 200, 3400, s * 1700 + 200); L(s * 1300, s * 1800, 300, T.lamp, 1800, 2.2); L(s * 1300, -s * 1800, 300, T.lamp, 1800, 2.2); L(s * 2650, s * 1700, 300, T.lamp, 1600, 2); L(-s * 2650, s * 1700, 300, T.lamp, 1600, 2); }
      // the forge-altar
      platOct(0, 0, 1300, 120, basalt, dark);
      solid(0, 0, 120, 360, 240, 110, 0x3a2e2c, false); deco(0, 0, 230, 400, 280, 16, T.trim); Glow(V(0, 0, 248), V(300, 180, 8), hot, 0); for (const e of [-1, 1]) { solid(e * 420, 0, 120, 90, 90, 420, basalt, false); Pyramid(V(e * 420, 0, 120 + 480), V(90, 90, 120), basalt); Glow(V(e * 420 - e * 47, 0, 120 + 250), V(4, 30, 260), hot, 0); }
      L(0, 0, 700, T.lamp, 2800, 3); tall(0, 0, 620);
      // basalt columns: six-sided, in clumps of different heights
      const clump = (x, y, n, h) => { for (let q = 0; q < n; q++) { const a = q * 2.4 + x, r = q ? 150 + (q % 2) * 60 : 0, hh = h * (1 - q * 0.13); Oct(V(x + Math.cos(a) * r, y + Math.sin(a) * r, hh / 2), V(230, 230, hh), q % 2 ? basalt : 0x342c2e, true, q === 0); } hit(x, y, 0, 420, 420, 200, true); tall(x, y, 420); };
      for (const [x, y, n, h] of [[2500, 300, 5, 900], [-2500, -300, 5, 900], [300, 2500, 4, 700], [-300, -2500, 4, 700], [3600, 2900, 6, 1100], [-3600, -2900, 6, 1100], [-3500, 2800, 4, 620], [3500, -2800, 4, 620], [2600, -900, 3, 420], [-2600, 900, 3, 420]]) clump(x, y, n, h);
      for (const s of [-1, 1]) { lowWall(s * 400, s * 1500, 600, true, basalt, T.trim, 110, 130); lowWall(s * 3900, s * 500, 600, false, basalt, T.trim, 110, 130); lowWall(-s * 2300, s * 3300, 600, true, basalt, T.trim, 110, 130); }
      // falls of it down the side walls into troughs, the crust it leaves, and stalagmites grown up round the islands
      for (const sx of [-1, 1]) for (const y of [-3000, -1000, 1000, 3000]) { const x = sx * (hx - 5); Glow(V(x, y, 520), V(8, 150, 1040), hot, 0); Glow(V(x - sx * 3, y, 520), V(8, 60, 1040), yel, 0); Box(V(x - sx * 8, y - 110, 520), V(16, 60, 1040), dark, false, false); Box(V(x - sx * 8, y + 110, 520), V(16, 60, 1040), dark, false, false); Oct(V(sx * (hx - 140), y, 30), V(360, 420, 60), basalt, false, false); Glow(V(sx * (hx - 140), y, 62), V(250, 300, 4), hot, 7); }
      for (let i = 0; i < 46; i++) { const a = i * 2.399, r = 900 + (i * 173) % 3200, x = Math.cos(a) * r * 1.05, y = Math.sin(a) * r * 0.95; if (Math.abs(x) > hx - 500 || Math.abs(y) > hy - 800 || (Math.abs(x) < 1500 && Math.abs(y) > hy - 1500)) continue; const h = 90 + (i % 5) * 50; Pyramid(V(x, y, h / 2), V(h * 0.5, h * 0.5, h), i % 3 ? basalt : 0x342c2e); if (i % 4 === 0) { Pyramid(V(x + 60, y + 30, h * 0.3), V(h * 0.34, h * 0.34, h * 0.6), dark); Glow(V(x + 20, y - 40, 3.4), V(120, 14, 2), hot, 0, R(0, i * 40, 0)); } }
      for (let i = 0; i < 30; i++) { const x = ((i * 911) % (hx * 2 - 800)) - hx + 400, y = ((i * 677) % (hy * 2 - 1400)) - hy + 700; Oct(V(x, y, 2.6), V(150, 150, 3), i % 2 ? 0x0e0a0a : 0x3a2a26, false, false); if (i % 3 === 0) Glow(V(x, y, 5), V(40, 40, 2), yel, 7); }
      // embers adrift over the rivers, and blocks of cooled stone along their banks
      for (const s of [-1, 1]) for (const [cx0, cy0, along] of [[s * 1300, -1800, false], [s * 1300, 1800, false], [-2650, s * 1700, true], [2650, s * 1700, true]]) for (let q = 0; q < 9; q++) { const t = (q - 4) * (along ? 170 : 250), e = q % 2 ? 1 : -1; const bx = cx0 + (along ? t : e * 300), by = cy0 + (along ? e * 280 : t), sz = 70 + (q % 3) * 30; Box(V(bx, by, sz * 0.3), V(sz, sz * 0.8, sz * 0.6), q % 3 ? basalt : dark, false, false, q * 29); if (q % 2 === 0) Glow(V(bx, by, sz * 0.6 + 0.8), V(sz * 0.45, sz * 0.3, 2), q % 4 ? yel : hot, 1, R(0, q * 29, 0)); }   // still hot in the middle
      // cauldrons of the stuff hung over the altar's approaches
      for (const s of [-1, 1]) P.hung(s * 900, -s * 900, 620, (z) => { Cyl(V(s * 900, -s * 900, z - 70), 220, 140, dark, false, false); Cyl(V(s * 900, -s * 900, z - 4), 250, 14, basalt, false, false); Glow(V(s * 900, -s * 900, z + 4), V(190, 190, 6), hot, 1); });
      // vents: cracks that breathe light
      for (const [x, y, a] of [[700, -1500, 20], [-700, 1500, 20], [2200, 2400, -40], [-2200, -2400, -40], [3900, -1200, 70], [-3900, 1200, 70]]) { Glow(V(x, y, 3.4), V(520, 26, 2), hot, 0, R(0, a, 0)); Glow(V(x + 60, y + 40, 3.4), V(260, 16, 2), yel, 0, R(0, a + 35, 0)); }
    }),

  // ------------------------------------------------------------------------------------------------ THE WAREHOUSE
  // Steel boxes stacked two high in blocks, with streets between wide enough to drive down. Long straight sight lines
  // along the streets and none across them; a loading dock and its crane at the middle.
  mk(TH('The Warehouse', 0x202428, 0x2a3036, 0x363c44, 0xc8a03a, 0xffe6a0, [1, 0.92, 0.7], 0x161a1e, [0.56, 0.58, 0.6]), [5200, 4200, 1400], { panel: 'planks', hang: 'lamp', corner: 'crates', c1: 0x5a6068, c2: 0x464c54, n: 9 },
    ({ hx, hy, H, T, Box, Cyl, Oct, Glow, slabs, tile, plat, solid, deco, hit, tall, L, crate, barrel, AX, AY, P }) => {
      const cols = [0x8a3a2a, 0x2a5a7a, 0x3a6a4a, 0xa87a2a, 0x5a5e66], yel = 0xc8a03a, iron = 0x2a2e34;
      slabs(520, T.floor, T.floor2, 0x12151a);
      for (const s of [-1, 1]) { tile(s * 900 - 14, -hy + 500, s * 900 + 14, hy - 500, 2.4, yel); tile(-hx + 500, s * 1200 - 14, hx - 500, s * 1200 + 14, 2.4, yel); }
      // blocks of containers: (x, y, along, how many high)
      let ci = 0; const stack = (x, y, along, n) => { for (let k = 0; k < n; k++) P.container(x, y, along, cols[(ci++) % 5], k * 250); };
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        stack(sx * 2000, sy * 2300, true, 2); stack(sx * 2000, sy * 2580, true, 1); stack(sx * 3600, sy * 2300, true, 1); stack(sx * 3600, sy * 2580, true, 2);
        stack(sx * 1800, sy * 500, false, 2); stack(sx * 2080, sy * 500, false, 1); stack(sx * 3500, sy * 520, true, 2); stack(sx * 4300, sy * 1300, false, 1);
      }
      // the dock: a platform, a gantry crane over it with its hook hanging, pallets
      plat(0, 0, 1300, 1700, 80, 0x4a5056, iron, [[0, 500], [0, -500]]);
      for (const sy of [-1, 1]) { for (const sx of [-1, 1]) solid(sx * 600, sy * 800, 80, 70, 70, 900, yel, false); Box(V(0, sy * 800, 1010), V(1340, 80, 80), yel, false, false); }
      Box(V(0, 0, 1040), V(160, 1700, 70), iron, false, false); Box(V(0, 200, 990), V(220, 220, 100), yel, false, false); for (let z = 620; z < 940; z += 44) Box(V(0, 200, z), V(10, 10, 48), iron, false, false); Box(V(0, 200, 580), V(70, 16, 70), iron, false, false);
      crate(-300, -300, 80, 110, 0x6a4e30, 0x2a2420, false); crate(-190, -330, 80, 100, 0x5a4630, 0x2a2420, false); crate(-250, -310, 190, 90, 0x6a4e30, 0x2a2420, false); barrel(1050, 620); barrel(1160, 570); L(0, 0, 720, T.lamp, 2600, 3); tall(0, 0, 900);
      // a fork truck in a street on each side, pallets, drums
      for (const s of [-1, 1]) {
        const fx = s * 900, fy = s * 3200; solid(fx, fy, 30, 150, 230, 120, yel, false); deco(fx, fy + 30, 150, 140, 120, 150, iron); for (const e of [-1, 1]) { Cyl(V(fx + e * 80, fy + 70, 34), 68, 30, iron, false, false, AX); Cyl(V(fx + e * 80, fy - 80, 34), 68, 30, iron, false, false, AX); deco(fx + e * 40, fy - 190, 16, 14, 180, 10, iron); deco(fx + e * 50, fy - 110, 16, 12, 12, 260, iron); } hit(fx, fy, 0, 170, 260, 300, true);
        for (const e of [-1, 1]) { solid(e * 2800, s * 3550, 0, 200, 160, 16, 0x5a3e26, false); crate(e * 2800 - 45, s * 3550, 16, 90, 0x6a4e30, 0x2a2420, false); crate(e * 2800 + 50, s * 3550, 16, 90, 0x5a4630, 0x2a2420, false); hit(e * 2800, s * 3550, 0, 200, 160, 106, true); barrel(e * 4500, s * 3300); barrel(e * 4390, s * 3360); }
      }
    }),

  // ------------------------------------------------------------------------------------------------ THRONE ROOM
  // A hall of state. A carpet runs door to door past a dais at the middle where the throne stands; a colonnade down
  // each side, the banners of dead houses between the columns, and the long tables of the court pushed back.
  mk(TH('Throne Room', 0x221c26, 0x2e2634, 0x3a3044, 0xd8b04a, 0xc89aff, [0.85, 0.7, 1], 0x1a1424, [0.56, 0.48, 0.66]), [3800, 5400, 1700], { panel: 'window', hang: 'lamp', corner: 'none', c1: 0xd8b04a, glow: 0xc89aff, n: 6 },
    ({ hx, hy, H, T, Box, Cyl, Oct, Glow, Ball, slabs, tile, plat, solid, deco, hit, tall, L, candle, AX, AY, P }) => {
      const gold = 0xd8b04a, purple = 0x4a2a6a, marble = 0xc8c0d0, dark = 0x1a1424, hues = [0x7a1c22, 0x1c3a6a, 0x2a5a3a, 0x6a4a1a];
      slabs(450, marble, 0x8a8494, dark, (x) => Math.abs(x) < 330);
      P.rug(0, 0, 620, hy * 2 - 900, purple, gold);
      plat(0, 0, 1500, 1100, 120, marble, 0x8a8494);
      // two thrones back to back, a canopy over them on four posts
      P.throne(0, 150, 1, purple, gold, 120); P.throne(0, -150, -1, purple, gold, 120);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { solid(sx * 420, sy * 420, 120, 50, 50, 560, gold, false); Ball(V(sx * 420, sy * 420, 120 + 590), V(70, 70, 70), gold); }
      Box(V(0, 0, 120 + 575), V(960, 960, 30), purple, false, false); Box(V(0, 0, 120 + 540), V(900, 900, 50), gold, false, false); for (const e of [-1, 1]) Box(V(0, e * 454, 120 + 470), V(900, 8, 120), purple, false, false);
      L(0, 0, 560, T.lamp, 2600, 3); tall(0, 0, 760);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const x = sx * 600, y = sy * 420; solid(x, y, 120, 50, 50, 160, 0x2a2e30, false); Cyl(V(x, y, 284), 110, 10, 0x2a2e30, false, false); Glow(V(x, y, 310), V(60, 60, 50), 0xff9a4a, 3); }
      // the colonnade, with a banner between each pair and a guard's plate at every second column
      const ys = [-4200, -3000, -1800, 1800, 3000, 4200];
      for (const sx of [-1, 1]) { ys.forEach((y, i) => { P.column(sx * 1700, y, 280, marble, gold, 'round'); if (i % 2 === 0) P.armor(sx * 1700 - sx * 240, y, 0x8a8e96); }); for (let i = 0; i < ys.length - 1; i++) { if (i === 2) continue; const y = (ys[i] + ys[i + 1]) / 2; P.banner(sx * 1700, y, 1100, 420, 700, hues[(i + (sx > 0 ? 0 : 2)) % 4], false); Box(V(sx * 1700, y, 1100 + 12), V(16, ys[i + 1] - ys[i], 16), gold, false, false); } }   // each hung from a bar from column to column
      // the court's tables, pushed to the walls, and its chests
      for (const s of [-1, 1]) for (const e of [-1, 1]) { P.mess(e * 2750, s * 2400, false, 700, 0x4a3626); for (let q = -2; q <= 2; q++) { Cyl(V(e * 2750, s * 2400 + q * 120, 86), 30, 16, gold, false, false); } P.mess(e * 2750, s * 3900, false, 500, 0x4a3626);
        solid(e * 2800, s * 1000, 0, 130, 90, 70, 0x5a3e26); deco(e * 2800, s * 1000, 70, 134, 94, 24, gold); P.statue(e * 950, s * 1500, 280, marble, 0x8a8494, 1); }
    }),

  // ------------------------------------------------------------------------------------------------ THE BATHHOUSE
  // Marble and steam. One great pool at the middle, knee deep, with a fountain island; two plunge pools at each end;
  // colonnades round all of them and screens of latticed stone between. You wade or you go round.
  mk(TH('The Bathhouse', 0x2a3234, 0x384448, 0x40504e, 0xd8d0b8, 0x7ae0d8, [0.7, 0.95, 0.92], 0x203432, [0.52, 0.64, 0.62]), [4600, 4800, 1300], { panel: 'arch', hang: 'lamp', corner: 'none', c1: 0xd8d0b8, c2: 0x2a6a70, n: 8 },
    ({ hx, hy, H, T, Box, Cyl, Oct, Glow, Ball, slabs, tile, plat, solid, deco, hit, tall, L, lowWall, AX, AY, P, group }) => {
      const marble = 0xd8d0b8, teal = 0x2a7a80, tile1 = 0x3a8a90, gold = 0xc8a03a;
      slabs(440, T.floor, T.floor2, 0x1a2426, (x, y) => (Math.abs(x) < 1650 && Math.abs(y) < 1350) || (Math.abs(x) < 2500 && Math.abs(Math.abs(y) - 3100) < 800 && Math.abs(x) > 700));
      P.pool(-1600, -1300, 1600, 1300, teal, marble, 0x7ae0d8);
      for (let x = -1400; x <= 1400; x += 400) for (let y = -1100; y <= 1100; y += 400) if ((x + y) % 800 === 0) tile(x - 90, y - 90, x + 90, y + 90, 3.4, tile1);
      P.fountain(0, 0, 620, marble, 0x7ae0d8, T.lamp);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { P.pool(sx * 1600 - 800, sy * 3100 - 600, sx * 1600 + 800, sy * 3100 + 600, 0x2a6a8a, marble, 0x8ad0ff); P.column(sx * 2100, sy * 1800, 240, marble, gold, 'round'); P.column(sx * 2900, sy * 600, 240, marble, gold, 'round'); P.column(sx * 2900, sy * 3100, 240, marble, gold, 'round'); }
      // latticed screens between the halls
      const screen = (x, y, len, along) => group(() => { const w = along ? len : 40, d = along ? 40 : len; solid(x, y, 0, w, d, 30, marble); deco(x, y, 250, w, d, 30, marble); for (let p = -len / 2 + 20; p <= len / 2; p += 60) deco(x + (along ? p : 0), y + (along ? 0 : p), 30, 14, 14, 220, marble); for (const z of [100, 180]) deco(x, y, z, along ? len : 10, along ? 10 : len, 10, gold); hit(x, y, 0, w, d, 280, true); });
      for (const s of [-1, 1]) { screen(s * 1100, s * 2050, 1500, true); screen(-s * 2300, s * 2050, 900, true); screen(s * 3600, -s * 1400, 1100, false); }
      // benches, towels, urns, braziers of hot stones
      for (const s of [-1, 1]) {
        for (const e of [-1, 1]) { P.bench(e * 2150, s * 500, false, 420, marble); Box(V(e * 2150, s * 500, 50), V(36, 100, 12), 0xe8e0d0, false, false); Cyl(V(e * 3900, s * 2400, 80), 130, 160, 0xa8502a, true, true); Cyl(V(e * 3900, s * 2400, 166), 150, 14, 0xa8502a, false, false); Ball(V(e * 3900, s * 2400, 60), V(170, 170, 110), 0xa8502a); }
        solid(s * 3800, s * 300, 0, 200, 200, 70, 0x3a3e46); Glow(V(s * 3800, s * 300, 76), V(150, 150, 10), 0xff6a2a, 0); for (let q = 0; q < 5; q++) Ball(V(s * 3800 + Math.cos(q * 1.3) * 50, s * 300 + Math.sin(q * 1.3) * 50, 86), V(60, 60, 44), 0x2a2420); L(s * 3800, s * 300, 300, [1, 0.6, 0.3], 1200, 1.8);
        P.statue(-s * 3700, s * 4000, 280, marble, 0x8a8478, 1); L(s * 1600, s * 3100, 500, T.lamp, 1800, 2.2); L(-s * 1600, s * 3100, 500, T.lamp, 1800, 2.2);
      }
    }),

  // ------------------------------------------------------------------------------------------------ FEAST HALL
  // A mead hall after the feast. The fire pit runs down the middle, long tables either side of it with their benches,
  // the high table across one end, hogsheads stacked across the other, and shields along the rafters.
  mk(TH('Feast Hall', 0x241c16, 0x30261c, 0x3e2e20, 0x8a6a3a, 0xff9a3a, [1, 0.72, 0.4], 0x24160e, [0.64, 0.52, 0.42]), [4000, 5200, 1500], { panel: 'planks', hang: 'chain', corner: 'barrels', c1: 0x5a3e26, c2: 0x4a3220, glow: 0xff9a3a, n: 6 },
    ({ hx, hy, H, T, Box, BoxRot, Cyl, Oct, Glow, Ball, ConeShape, slabs, tile, plat, solid, deco, hit, tall, L, barrel, candle, AX, AY, P }) => {
      const oak = 0x5a3e26, dark = 0x2c2018, stone = 0x5a544a, ember = 0xff6a1a, hide = 0x7a5a3a;
      slabs(480, T.floor, T.floor2, 0x15100c);
      // the fire pit: a long stone trough of embers with a spit across it
      for (const s of [-1, 1]) { const y = s * 1400; solid(0, y, 0, 440, 1700, 60, stone); deco(0, y, 54, 340, 1600, 10, 0x1a1210); Glow(V(0, y, 60), V(300, 1500, 4), 0xc8400e, 0); for (let q = -6; q <= 6; q++) { const lx = ((q * 53) % 90), ly = y + q * 112; Cyl(V(lx, ly, 74), 44, 260, q % 2 ? 0x2a1a12 : 0x1a1210, false, false, R(90, q * 37, 0)); Glow(V(lx + 30, ly + 20, 66), V(70, 50, 6), 0xffb030, 0); if (q % 2 === 0) { ConeShape(V(lx - 20, ly + 40, 130), V(70, 70, 130), 0xff7a1a); ConeShape(V(lx - 20, ly + 40, 116), V(40, 40, 90), 0xffd060); } }
        for (const e of [-1, 1]) solid(e * 260, y, 0, 26, 26, 200, dark, false); Cyl(V(0, y, 190), 16, 620, dark, false, false, AX); Box(V(0, y, 190), V(300, 110, 90), 0x8a4a2a, false, false); L(0, y, 360, T.lamp, 2400, 3); }
      // long tables, laid
      for (const sx of [-1, 1]) for (const y of [-3000, -1400, 1400, 3000]) { P.mess(sx * 1300, y, false, 1100, oak); for (let q = -4; q <= 4; q++) { if (q % 2) Cyl(V(sx * 1300 + (q % 3) * 14, y + q * 110, 82), 36, 8, 0xc8c0a8, false, false); else { Cyl(V(sx * 1300, y + q * 110, 92), 22, 28, 0x8a6a3a, false, false); } } candle(sx * 1300, y, 78, 24); }
      // posts with shields, rafters with more
      for (const sx of [-1, 1]) for (const y of [-3800, -2200, -600, 600, 2200, 3800]) { P.column(sx * 2200, y, 180, oak, dark, 'square'); Cyl(V(sx * 2200 - sx * 96, y, 430), 150, 14, [0x7a1c22, 0x1c3a6a, 0x2a5a3a][Math.abs(y / 800 | 0) % 3], false, false, AX); Cyl(V(sx * 2200 - sx * 106, y, 430), 40, 14, 0x8a8e96, false, false, AX); }
      for (const y of [-3800, -2200, -600, 600, 2200, 3800]) { Box(V(0, y, H - 260), V(4500, 70, 70), dark, false, false); for (const e of [-1, 1]) BoxRot(V(e * 1150, y, H - 130), V(2400, 60, 60), dark, R(0, 0, e * -6), false); }
      // the high table, on a step, with the lord's chair; hogsheads at the other end
      plat(-1700, 4300, 1700, 500, 40, oak, dark); P.table(-1700, 4300, true, 1300, oak, 40); P.throne(-1700, 4470, -1, hide, 0x8a6a3a, 40);
      for (const x of [-2600, -2000, -1400, -800]) { Cyl(V(x, -4350, 180), 340, 400, oak, true, true, AY); for (const g of [-140, 140]) Cyl(V(x, -4350 + g, 180), 356, 12, dark, false, false, AY); deco(x, -4350, 0, 300, 360, 20, dark); Cyl(V(x, -4140, 90), 14, 30, 0x8a6a3a, false, false, AY); }
      // hides on the floor, dogs' bones, a harp
      for (const s of [-1, 1]) { tile(s * 3000 - 260, s * 600 - 180, s * 3000 + 260, s * 600 + 180, 2.6, hide); tile(-s * 3000 - 200, s * 3300 - 260, -s * 3000 + 200, s * 3300 + 260, 2.6, 0x5a4a3a); barrel(s * 3300, -s * 1800); barrel(s * 3190, -s * 1740); P.rack(s * 3400, s * 2400, false, dark); }
    }),

  // ------------------------------------------------------------------------------------------------ SALT MINE
  // White galleries. The salt was cut out and great square pillars of it left to hold the roof, in a grid; between
  // them the miners' tubs stand on their rails, the cut blocks are stacked, and a chapel has been carved from one pillar.
  mk(TH('Salt Mine', 0x3a3c40, 0x4a4c50, 0x5a5c62, 0xc8ccd0, 0xfff0d0, [1, 0.95, 0.85], 0x2a2c30, [0.6, 0.62, 0.66]), [4800, 4800, 1000], { panel: 'none', hang: 'lamp', corner: 'rubble', c1: 0xd8dce0, c2: 0xb8bcc4, n: 8, rail: false },
    ({ hx, hy, H, T, Box, BoxRot, Cyl, Oct, Glow, Ball, Pyramid, slabs, tile, solid, deco, hit, tall, L, crate, candle, AX, AY, P }) => {
      const salt = 0xd8dce0, grey = 0xa8acb4, pink = 0xe0c0c0, wood = 0x5a3e26, iron = 0x3a3e46;
      slabs(480, T.floor, T.floor2, 0x2a2c30);
      // the pillars: a grid of nine, the middle one carved into a chapel
      for (const gx of [-2600, 0, 2600]) for (const gy of [-2600, 0, 2600]) {
        if (!gx && !gy) continue;
        const pc = (gx + gy) % 5200 ? salt : pink;
        solid(gx, gy, 0, 900, 900, H, pc); deco(gx, gy, 0, 980, 980, 60, grey); deco(gx, gy, 60, 940, 940, 30, salt); deco(gx, gy, H - 90, 980, 980, 90, grey); tall(gx, gy, 760);
        // the marks of the cutting: courses every arm's length, a darker seam, and on each face a lamp niche with a shelf
        for (let z = 200; z < H - 120; z += 150) deco(gx, gy, z, 908, 908, 8, grey); deco(gx, gy, 520, 914, 914, 40, pc === salt ? pink : salt);
        for (const e of [-1, 1]) for (const ax of [0, 1]) { const fx = gx + (ax ? 0 : e * 452), fy = gy + (ax ? e * 452 : 0); Box(V(fx, fy, 330), ax ? V(170, 10, 240) : V(10, 170, 240), 0x3a3c40, false, false); Box(V(fx + (ax ? 0 : e * 6), fy + (ax ? e * 6 : 0), 216), ax ? V(210, 30, 14) : V(30, 210, 14), grey, false, false); Box(V(fx + (ax ? 0 : e * 8), fy + (ax ? e * 8 : 0), 250), V(30, 30, 50), iron, false, false); Glow(V(fx + (ax ? 0 : e * 8), fy + (ax ? e * 8 : 0), 256), V(20, 20, 30), T.glow, 0); Pyramid(V(fx, fy, 480), ax ? V(170, 10, 60) : V(10, 170, 60), 0x3a3c40); }
        // crystal grown out of the foot of it
        for (let q = 0; q < 3; q++) { const a = q * 2.1 + gx * 0.001, r = 560; Pyramid(V(gx + Math.cos(a) * r, gy + Math.sin(a) * r, 60), V(70, 70, 150 + q * 30), q % 2 ? salt : pink, R(Math.cos(a) * 20, q * 40, -Math.sin(a) * 20)); }
      }
      // the chapel: four corner piers of the middle pillar left standing, an altar and a saint between them
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { solid(sx * 360, sy * 360, 0, 180, 180, H, salt); deco(sx * 360, sy * 360, 0, 230, 230, 50, grey); }
      solid(0, 0, 0, 240, 110, 96, pink); deco(0, 0, 96, 270, 140, 12, salt); for (const e of [-1, 1]) candle(e * 90, 0, 108, 30); Ball(V(0, 0, 150), V(50, 50, 60), salt); deco(0, 0, 108, 40, 30, 30, salt); L(0, 0, 420, T.lamp, 1800, 2.8); tall(0, 0, 620);
      // timber sets where the roof was bad: two legs and a cap, across each gallery
      for (const g of [-1300, 1300]) for (const y of [-3900, -1300, 1300, 3900]) { for (const e of [-1, 1]) { solid(g + e * 800, y, 0, 60, 60, H - 60, wood, false); Box(V(g + e * 800, y, 20), V(100, 100, 40), 0x3a2c20, false, false); } Box(V(g, y, H - 40), V(1760, 80, 80), wood, false, false); for (const e of [-1, 1]) BoxRot(V(g + e * 660, y, H - 190), V(340, 40, 40), 0x3a2c20, R(0, 0, e * -45), false); }
      // rails down two galleries, tubs on them
      for (const s of [-1, 1]) { const x = s * 1300; for (const e of [-1, 1]) deco(x + e * 70, 0, 2, 12, hy * 2 - 1200, 9, 0x8a8e96); for (let y = -hy + 660; y < hy - 600; y += 170) tile(x - 130, y - 24, x + 130, y + 24, 2.2, wood);
        for (const ty of [s * 1300, -s * 1300, s * 3900]) { solid(x, ty, 30, 170, 230, 100, 0x4a3a2c); deco(x, ty, 130, 184, 244, 10, iron); for (const a of [-1, 1]) for (const e of [-1, 1]) Cyl(V(x + e * 70, ty + a * 70, 24), 46, 14, iron, false, false, AX); Ball(V(x, ty, 132), V(150, 200, 70), salt); } }
      // cut blocks, stacked like a quarry's; picks and lamps
      const blocks = (x, y) => { for (const [dx, dy, sz] of [[-100, -50, 180], [100, -30, 160], [0, 140, 150]]) { solid(x + dx, y + dy, 0, sz, sz, sz * 0.75, (dx + x) % 3 ? salt : pink); } solid(x - 20, y - 40, 135, 140, 140, 110, grey, false); };
      for (const s of [-1, 1]) { blocks(s * 1300, s * 3900 - s * 2600); blocks(-s * 1300, 0); blocks(s * 3900, s * 1300); blocks(-s * 3900, s * 1300 + s * 2600); blocks(-s * 700, s * 3950);
        for (const e of [-1, 1]) { P.lampPost(e * 1300 + 300, s * 2600 - e * 300, 240, T.lamp, iron); crate(e * 3900, s * 3950, 0, 100); }
        P.wagon(s * 3900, -s * 1300, false, wood); }
    }),
];
