// Rooms 17 to 24 of the Descent: a mushroom wood, a sewer crossing, a powder store, a bank vault, an opera house,
// a cell block, a glasshouse and an observatory. Built to the rules at the top of descent_rooms.js.
import { V, V2, R } from './mapkit.js';
import * as SH from './descent_shapes.js';

const TH = (name, floor, floor2, wall, trim, glow, lamp, fog, sh, title) => ({ name, title, floor, floor2, wall, trim, glow, lamp, fog, sh });
const mk = (theme, dims, wall, fn) => ({ theme, dims, wall, build: (K, Q, P) => fn({ ...K, ...K.M, ...Q, P }) });

export const ROOMS_B = [
  // ------------------------------------------------------------------------------------------------ FUNGAL GROTTO
  // A wood of mushrooms taller than a house, their caps a second roof. The trunks are the cover; the big one stands on
  // a mound in the middle, and rings of small ones mark the clearings.
  mk(TH('Fungal Grotto', 0x1a1e24, 0x22303a, 0x26303a, 0x5a6a5a, 0x5affd8, [0.4, 1, 0.9], 0x0e2026, [0.42, 0.6, 0.62]), [4800, 4600, 1500], { panel: 'none', hang: 'vine', corner: 'rubble', c1: 0x3a4a44, c2: 0x2a3a34, n: 30, rail: false },
    ({ hx, hy, H, T, Box, BoxRot, Cyl, Oct, Glow, Ball, ConeShape, platOct, tile, hit, tall, L, lowWall, P }) => {
      const caps = [0x8a3a6a, 0x3a6a8a, 0xc87a3a, 0x6a4a9a], gl = [0x5affd8, 0xff8ad0, 0xffd86a, 0x8ab0ff], loam = 0x1c2a22;
      for (let i = 0; i < 100; i++) { const x = ((i * 877) % (hx * 2 - 300)) - hx + 150, y = ((i * 541) % (hy * 2 - 300)) - hy + 150, w = 200 + (i % 6) * 80; Oct(V(x, y, 1.2 + (i % 3) * 0.5), V(w * 2, w * 1.5, 2), i % 3 ? T.floor2 : loam, false, false); }
      platOct(0, 0, 1000, 80, 0x2a3a34, loam); P.mushroom(0, 0, 900, caps[0], gl[0]); L(0, 0, 700, T.lamp, 2800, 3);
      for (let q = 0; q < 7; q++) { const a = q / 7 * 6.283; P.mushroom(Math.cos(a) * 420, Math.sin(a) * 420, 110 + (q % 3) * 40, caps[(q + 1) % 4], gl[(q + 1) % 4]); }
      const BIG = [[1700, 900, 760, 1], [-1700, -900, 760, 2], [-1500, 1500, 620, 3], [1500, -1500, 620, 0], [3000, 2200, 820, 2], [-3000, -2200, 820, 1], [-3100, 1900, 680, 0], [3100, -1900, 680, 3], [500, 2900, 700, 1], [-500, -2900, 700, 2], [3600, 200, 600, 0], [-3600, -200, 600, 3], [1800, 3500, 560, 3], [-1800, -3500, 560, 0]];
      for (const [x, y, h, c] of BIG) { P.mushroom(x, y, h, caps[c], gl[c]); L(x, y, h * 0.7, [((gl[c] >> 16) & 255) / 255, ((gl[c] >> 8) & 255) / 255, (gl[c] & 255) / 255], 1100, 1.5); }
      // fairy rings in the clearings, and a pool in each
      for (const [x, y, c] of [[2300, -500, 0], [-2300, 500, 1], [-700, 2100, 2], [700, -2100, 3], [3700, 3300, 1], [-3700, -3300, 2]]) { Cyl(V(x, y, 2), 520, 3, 0x12303a, false, false); Glow(V(x, y, 4.2), V(260, 220, 2), gl[c], 1); for (let q = 0; q < 9; q++) { const a = q / 9 * 6.283; P.mushroom(x + Math.cos(a) * 400, y + Math.sin(a) * 400, 70 + (q % 3) * 30, caps[(c + q) % 4], q % 2 ? gl[c] : 0); } }
      // undergrowth: clumps of little ones, ferns, moss on the walls, spores in the air under the big caps
      for (let i = 0; i < 56; i++) { const a = i * 2.399, r = 800 + (i * 193) % 3600, x = Math.cos(a) * r, y = Math.sin(a) * r; if (Math.abs(x) > hx - 400 || Math.abs(y) > hy - 800 || (Math.abs(x) < 1500 && Math.abs(y) > hy - 1500)) continue;
        if (i % 3) for (let q = 0; q < 3; q++) { const h = 30 + ((i + q) % 4) * 14, w = h * 1.1, mx = x + q * 40 - 40, my = y + (q % 2) * 46; Cyl(V(mx, my, h / 2), h * 0.2, h, 0xd8cfa8, false, false); ConeShape(V(mx, my, h + w * 0.2), V(w, w, w * 0.44), caps[(i + q) % 4]); }
        else for (let q = 0; q < 5; q++) { const b = q * 1.257 + i; BoxRot(V(x + Math.cos(b) * 50, y + Math.sin(b) * 50, 9), V(120, 26, 5), [0x2a6a4a, 0x3a8a5a][q % 2], R(0, b * 57.3, -32), false); } }
      for (const sx of [-1, 1]) for (let y = -hy + 500; y < hy - 300; y += 420) { if (Math.abs(Math.abs(y) - 500) < 280) continue; const c = Math.abs(Math.round(y / 420)) % 4; Box(V(sx * (hx - 4), y, 300), V(8, 300, 520), 0x2a4a34, false, false); for (let q = 0; q < 3; q++) { const z = 180 + q * 170, w = 150 - q * 26; Cyl(V(sx * (hx - w * 0.3), y + (q - 1) * 70, z), w, 16, caps[(c + q) % 4], false, false); Glow(V(sx * (hx - w * 0.3), y + (q - 1) * 70, z - 10), V(w * 0.7, w * 0.7, 4), gl[(c + q) % 4], 1); } }
      // fallen caps and logs to fight over
      for (const s of [-1, 1]) { Cyl(V(s * 900, s * 1500, 70), 150, 800, 0x3a2c20, false, false, R(90, 30, 0)); hit(s * 900, s * 1500, 0, 620, 420, 130, true); Ball(V(s * 2500, s * 1300, 0), V(520, 520, 260), caps[1]); hit(s * 2500, s * 1300, 0, 360, 360, 120, true); lowWall(-s * 400, s * 3700, 700, true, 0x2a3a34, 0x5a6a5a, 110, 130); lowWall(s * 4000, -s * 1100, 700, false, 0x2a3a34, 0x5a6a5a, 110, 130); }
    }),

  // ------------------------------------------------------------------------------------------------ SEWER JUNCTION
  // Four channels meet at a round sump. The channels are shallow water with a kerb; the four quarters between them are
  // raised walkways with the works on them, and footbridges cross the channels. You are always choosing a quarter.
  mk(TH('Sewer Junction', 0x2a322c, 0x46503e, 0x3c463a, 0x8a8a5a, 0xb8ff5a, [0.75, 1, 0.45], 0x1a2414, [0.5, 0.58, 0.42]), [4600, 4600, 1100], { panel: 'arch', hang: 'chain', corner: 'barrels', c1: 0x4a4e3e, c2: 0x0c100c, n: 8 },
    ({ hx, hy, H, T, Box, Cyl, Oct, Glow, tile, plat, solid, deco, hit, tall, L, barrel, crate, lowWall, AX, AY, P }) => {
      const brick = 0x6a5a40, water = 0x1e4a30, slime = 0xb8ff5a, iron = 0x3a3e36;
      tile(-hx, -hy, hx, hy, 1.4, 0x161c16); tile(-420, -hy, 420, hy, 2.4, water); tile(-hx, -420, hx, 420, 2.4, water);
      for (const s of [-1, 1]) { tile(s * 420 - 30, -hy, s * 420 + 30, hy, 3.4, T.trim); tile(-hx, s * 420 - 30, hx, s * 420 + 30, 3.4, T.trim); }
      for (let i = 0; i < 14; i++) { Glow(V(((i * 37) % 700) - 350, -hy + 400 + i * 620, 2.7), V(70, 22, 0.4), 0x5aa84a, 0); Glow(V(-hx + 400 + i * 620, ((i * 53) % 700) - 350, 2.7), V(22, 70, 0.4), 0x5aa84a, 0); }
      // the four quarters
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        const cx = sx * 2500, cy = sy * 2500;
        plat(cx, cy, 3400, 3400, 80, T.floor2, brick, [[0, sy * 700], [sx * 300, sy * 300], [-sx * 800, sy * 600], [sx * 600, -sy * 800]]);
        P.column(sx * 1300, sy * 1300, 300, T.wall, T.trim, 'round');
        // an outfall in the outer corner: a great pipe mouth with a grille, dribbling
        Cyl(V(sx * 3600, sy * 3600, 80 + 190), 380, 320, iron, true, false, R(90, sx * sy > 0 ? 45 : -45, 0)); Glow(V(sx * 3470, sy * 3470, 80 + 100), V(60, 60, 150), slime, 1); tall(sx * 3600, sy * 3600, 420);
        // the works: a sluice wheel, a tool crib, drums
        const wx = sx * 2700, wy = sy * 1500; solid(wx, wy, 80, 60, 60, 120, iron, false); Cyl(V(wx, wy, 80 + 150), 150, 12, 0xa02a22, false, false, AY); Cyl(V(wx, wy, 80 + 150), 30, 30, iron, false, false, AY);
        crate(sx * 1500, sy * 3000, 80, 110, 0x5a4a30, 0x2a2420, false); barrel(sx * 1650, sy * 3050, 80); barrel(sx * 3000, sy * 2300, 80); lowWall(sx * 2300, sy * 2500, 600, sx * sy > 0, brick, T.trim, 190, 70);
        L(cx, cy, 520, T.lamp, 2000, 2.4);
      }
      // footbridges over each channel, railed
      for (const s of [-1, 1]) for (const [x, y, along] of [[s * 2600, 0, false], [0, s * 2600, true]]) {
        Box(V(x, y, 95), along ? V(1700, 300, 30) : V(300, 1700, 30), 0x5a4a30, true, false);
        for (const e of [-1, 1]) { Box(V(x + (along ? 0 : e * 140), y + (along ? e * 140 : 0), 160), along ? V(1700, 10, 10) : V(10, 1700, 10), iron, false, false); for (const q of [-1, 0, 1]) Box(V(x + (along ? q * 800 : e * 140), y + (along ? e * 140 : q * 800), 135), V(12, 12, 60), iron, false, false); }
      }
      // the sump: a round grating over the meeting of the waters, with the winch above it
      Cyl(V(0, 0, 3.2), 1100, 3, 0x0a0e0a, false, false); for (let q = -4; q <= 4; q++) { tile(q * 110 - 14, -520, q * 110 + 14, 520, 5, iron); tile(-520, q * 110 - 14, 520, q * 110 + 14, 5.4, iron); } Glow(V(0, 0, 4.2), V(700, 700, 1.2), slime, 7);
      P.hung(0, 0, 620, (z) => { Cyl(V(0, 0, z - 40), 200, 80, iron, false, false); Cyl(V(0, 0, z - 180), 8, 200, iron, false, false); Box(V(0, 0, z - 300), V(60, 14, 60), iron, false, false); }); L(0, 0, 480, T.lamp, 2200, 2.6);
    }),

  // ------------------------------------------------------------------------------------------------ POWDER MAGAZINE
  // Low brick vaults, blast walls set zig-zag so that nothing has a straight run from one end to the other, and kegs
  // and shot stacked in the bays. The gun on its carriage in the middle is the one piece of open ground.
  mk(TH('Powder Magazine', 0x241e1a, 0x302822, 0x3e2e26, 0x6a5a4a, 0xffb04a, [1, 0.75, 0.4], 0x221812, [0.62, 0.52, 0.44]), [3800, 5200, 800], { panel: 'niche', hang: 'lamp', corner: 'barrels', c1: 0x5a4a3a, c2: 0x3a2a20, n: 6 },
    ({ hx, hy, H, T, Box, Cyl, Oct, Glow, Ball, slabs, tile, solid, deco, hit, tall, L, barrel, crate, AX, AY, P }) => {
      const brick = 0x5a3a2c, cap = 0x7a6a5a, iron = 0x2a2c30, wood = 0x5a3e26;
      slabs(450, T.floor, T.floor2, 0x15100e);
      // blast walls: each reaches from one side wall's bay two thirds across, alternately
      const ys = [-3600, -2200, -800, 800, 2200, 3600];
      ys.forEach((y, i) => { const s = i % 2 ? 1 : -1, x = s * (hx - 250 - 1400); solid(x, y, 0, 2800, 160, H, brick); deco(x, y, 0, 2830, 200, 50, cap); deco(x, y, H - 60, 2830, 200, 60, cap); for (let q = -2; q <= 2; q++) Glow(V(x + q * 520, y, 300), V(60, 166, 8), T.glow, 0); tall(x, y, 1500); });
      for (const y of ys) Box(V(0, y, H - 30), V(hx * 2 - 40, 220, 60), 0x2c201a, false, false);
      // the gun
      const gy = 0; solid(0, gy, 0, 150, 320, 50, wood, false); for (const e of [-1, 1]) { Cyl(V(e * 100, gy - 60, 80), 160, 20, wood, false, false, AX); Cyl(V(e * 100, gy - 60, 80), 40, 28, iron, false, false, AX); deco(e * 52, gy + 40, 50, 20, 260, 60, wood); }
      Cyl(V(0, gy + 40, 130), 90, 420, iron, false, false, AY); Cyl(V(0, gy - 150, 130), 110, 60, iron, false, false, AY); Ball(V(0, gy - 190, 130), V(60, 60, 60), iron); hit(0, gy, 0, 240, 440, 180, true); L(0, gy, 420, T.lamp, 1700, 2.6);
      // shot in a pyramid, and powder kegs, in every bay
      const shot = (x, y) => { solid(x, y, 0, 220, 220, 14, wood, false); for (let l = 0; l < 3; l++) for (let a = 0; a < 3 - l; a++) for (let b = 0; b < 3 - l; b++) Ball(V(x + (a - (2 - l) / 2) * 64, y + (b - (2 - l) / 2) * 64, 44 + l * 50), V(62, 62, 62), iron); hit(x, y, 0, 200, 200, 150, true); };
      ys.forEach((y, i) => { const s = i % 2 ? 1 : -1; shot(-s * 2400, y + 500); barrel(-s * 2900, y - 480); barrel(-s * 2780, y - 420); barrel(-s * 2850, y - 560); crate(s * 1600, y + 420, 0, 110); crate(s * 1720, y + 400, 0, 90); barrel(s * 600, y - 430); P.rack(s * 2600, y - 420, true); });
      // a powder cart at each end, and the match tubs
      for (const s of [-1, 1]) { P.wagon(s * 1300, s * 4400, true, wood); barrel(s * 1300, s * 4400, 72); Cyl(V(-s * 2000, s * 4500, 30), 140, 60, wood, true, false); Glow(V(-s * 2000, s * 4500, 58), V(100, 100, 4), 0x3aa8ff, 0); }
    }),

  // ------------------------------------------------------------------------------------------------ THE VAULT
  // A bank's strongroom. The round door stands open at each end; inside, ranks of deposit boxes make a grid of short
  // lanes, the counting tables are in the middle under a cage of bars, and the bullion is on pallets.
  mk(TH('The Vault', 0x20242a, 0x2a3038, 0x3a4048, 0x9a9ea6, 0xffd86a, [1, 0.9, 0.6], 0x161a20, [0.54, 0.58, 0.64]), [4400, 4400, 1100], { panel: 'bars', hang: 'lamp', corner: 'crates', c1: 0x8a8e96, c2: 0x5a5e66, n: 8 },
    ({ hx, hy, H, T, Box, Cyl, Oct, Glow, slabs, tile, plat, solid, deco, hit, tall, L, crate, AX, AY, P, group }) => {
      const steel = 0x8a8e96, dark = 0x2a2e34, gold = 0xd8b04a, green = 0x2a5a3a;
      slabs(440, T.floor, T.floor2, 0x12151a);
      // deposit boxes: steel cabinets as tall as a man can reach, faces lined with little doors
      const boxes = (x, y, along) => group(() => { const w = along ? 900 : 200, d = along ? 200 : 900; solid(x, y, 0, w, d, 260, dark); deco(x, y, 260, w + 20, d + 20, 14, steel); for (const e of [-1, 1]) for (let r = 0; r < 4; r++) for (let c = -4; c <= 4; c++) { const p = c * 96; Box(V(x + (along ? p : e * 101), y + (along ? e * 101 : p), 40 + r * 58), along ? V(84, 4, 48) : V(4, 84, 48), (r + c) % 5 ? steel : 0x6a6e76, false, false); } });
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { boxes(sx * 1900, sy * 1500, false); boxes(sx * 3000, sy * 1500, false); boxes(sx * 1900, sy * 3000, true); boxes(sx * 3100, sy * 3000, true); }
      // the counting cage: bars on three sides of a square, tables inside
      plat(0, 0, 1400, 1400, 40, 0x3a3e46, dark);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) P.column(sx * 700, sy * 700, 110, dark, steel, 'square');
      for (const s of [-1, 1]) { for (let p = -560; p <= 560; p += 80) Cyl(V(s * 700, p, 40 + 150), 14, 300, steel, false, false); deco(s * 700, 0, 40 + 290, 20, 1300, 20, steel); hit(s * 700, 0, 40, 30, 1180, 300, true); }
      P.table(-200, 0, false, 320, 0x4a3626, 40); P.table(250, 0, false, 320, 0x4a3626, 40); for (const [x, y] of [[-200, -80], [250, 60], [-200, 90]]) { for (let q = 0; q < 3; q++) Box(V(x, y + q * 2, 40 + 82 + q * 9), V(54, 26, 8), gold, false, false, q * 9); } Box(V(250, -90, 40 + 88), V(70, 40, 20), green, false, false);
      L(0, 0, 560, T.lamp, 2400, 3); tall(0, 0, 400);
      // bullion on pallets, sacks, a strongbox trolley
      const pallet = (x, y) => { solid(x, y, 0, 220, 180, 16, 0x5a3e26, false); for (let l = 0; l < 3; l++) for (let a = 0; a < 3 - l; a++) Box(V(x + (a - (2 - l) / 2) * 66, y, 29 + l * 26), V(58, 150, 26), gold, false, false); hit(x, y, 0, 210, 170, 100, true); Glow(V(x, y, 3), V(260, 220, 2), gold, 7); };
      for (const s of [-1, 1]) { pallet(s * 800, s * 2300); pallet(-s * 800, s * 2300); pallet(s * 3500, 0); crate(s * 2500, 0, 0, 110, 0x4a4e56, 0x2a2e34); for (const e of [-1, 1]) { Box(V(s * 1200 + e * 50, -s * 1500, 30), V(90, 70, 60), 0xa89a6a, true, false, e * 20); } }
      // the round doors, stood open beside each doorway
      for (const s of [-1, 1]) { const x = 900, y = s * (hy - 700); Cyl(V(x, y, 310), 620, 90, steel, true, true, AX); Cyl(V(x - 50, y, 310), 440, 30, dark, false, false, AX); Cyl(V(x - 70, y, 310), 200, 30, gold, false, false, AX); for (let q = 0; q < 4; q++) Box(V(x - 80, y, 310), V(14, 300, 20), steel, false, false, 0); Cyl(V(x - 80, y, 310), 16, 300, steel, false, false); tall(x, y, 500); }
    }),

  // ------------------------------------------------------------------------------------------------ OPERA HOUSE
  // You fight across the stalls toward a stage. The stage is a platform at the middle with its proscenium over it, the
  // stalls slope away in rows either side, and the orchestra's chairs and stands are scattered below the footlights.
  mk(TH('Opera House', 0x2a1a1e, 0x3a2228, 0x4a2a30, 0xd8b04a, 0xffc86a, [1, 0.8, 0.5], 0x26141a, [0.66, 0.48, 0.5]), [4200, 5200, 1700], { panel: 'banner', hang: 'lamp', corner: 'crates', c1: 0xd8b04a, c2: 0x7a1c22, n: 5 },
    ({ M, hx, hy, H, T, Box, Cyl, Oct, Glow, Ball, slabs, tile, plat, solid, deco, hit, tall, L, AX, AY, P, group }) => {
      const red = 0x8a1c22, gold = 0xd8b04a, board = 0x6a4a2a, velvet = 0x5a1418;
      slabs(480, T.floor, T.floor2, 0x180e10, (x) => Math.abs(x) < 280);
      P.rug(0, 0, 520, hy * 2 - 900, red, gold);
      // the stage, across the room, with wings left open at each side
      const stage = group(() => plat(0, 0, 4200, 1300, 120, board, 0x3a2a1a, [[-1200, 0], [1200, 0]]));
      for (const sx of [-1, 1]) { P.column(sx * 2300, 0, 300, 0xe8dcc0, gold, 'square'); deco(sx * 2300, 0, 300, 320, 320, 30, gold); for (const sy of [-1, 1]) { deco(sx * 2000, sy * 560, 120 + 900, 14, 40, H - 1020, velvet); { const [k, b] = SH.curtain(520, H - 20 - 124, red, sx, 0.6); M.Shape(k, b, V(sx * 1750, sy * 560, H - 20), R(0, sy > 0 ? 0 : 180, 0)); } } }
      for (const sy of [-1, 1]) { { const [k, b] = SH.valance(4200, 420, red, gold); M.Shape(k, b, V(0, sy * 560, H - 20), R(0, sy > 0 ? 0 : 180, 0)); } if (stage) for (let x = -1900; x <= 1900; x += 380) Glow(V(x, sy * 625, 120 + 13), V(60, 30, 26), 0xfff0c0, 0); }   // footlights, if the stage is there to hold them
      // on the stage: a painted flat, a prop throne, the prompter's box
      solid(-900, 0, 120, 700, 40, 520, 0x3a5a6a, false); deco(-900, 0, 120, 720, 60, 30, board); for (let q = -2; q <= 2; q++) Box(V(-900 + q * 130, 0, 120 + 420), V(100, 46, 160 + (q * q % 3) * 40), 0x2a4a3a, false, false); tall(-900, 0, 500);
      P.throne(700, 0, 1, red, gold, 120); L(0, 0, 900, T.lamp, 3000, 3);
      // the stalls: rows of seats facing the stage from both ends
      for (const s of [-1, 1]) for (let i = 0; i < 7; i++) for (const e of [-1, 1]) P.pew(e * 1250, s * (1900 + i * 400), 1500, -s, velvet);
      // the pit below the footlights: chairs, stands, a harp, a drum
      for (const s of [-1, 1]) {
        for (const x of [-1500, -900, -300, 300, 900, 1500]) { solid(x, s * 1100, 0, 44, 44, 46, 0x3a2a1a, false); deco(x, s * 1100 + s * 20, 46, 44, 6, 50, 0x3a2a1a); deco(x + 50, s * 1040, 0, 6, 6, 120, 0x2a2e30); deco(x + 50, s * 1040, 110, 50, 4, 36, 0x2a2e30); }
        Cyl(V(s * 1900, s * 1150, 50), 130, 100, gold, true, false); Cyl(V(s * 1900, s * 1150, 102), 126, 6, 0xe8dcc0, false, false);
        // boxes on the side walls' line: a low front to duck behind
        for (const e of [-1, 1]) { solid(e * 3300, s * 2800, 0, 700, 90, 120, 0xe8dcc0); deco(e * 3300, s * 2800, 120, 720, 110, 14, gold); deco(e * 3300, s * 2800 + s * 46, 20, 660, 4, 80, red); }
      }
      // the chandelier over each half of the house
      for (const s of [-1, 1]) P.hung(0, s * 3000, 900, (z) => { Oct(V(0, s * 3000, z - 30), V(560, 560, 30), gold, false, false); Oct(V(0, s * 3000, z - 58), V(360, 360, 30), gold, false, false); for (let q = 0; q < 10; q++) { const a = q / 10 * 6.283; Glow(V(Math.cos(a) * 250, s * 3000 + Math.sin(a) * 250, z + 6), V(26, 26, 40), 0xfff0c0, 2); } L(0, s * 3000, z - 160, T.lamp, 2400, 2.4); });
    }),

  // ------------------------------------------------------------------------------------------------ CELL BLOCK
  // A prison wing. The cells run down both sides behind bars (some doors stand open: you can fight in and out of them),
  // the guards' cage stands in the middle of the hall, and the mess tables are bolted down either side of it.
  mk(TH('Cell Block', 0x22262a, 0x2c3238, 0x3a4046, 0x6a7078, 0xffe6a0, [1, 0.92, 0.7], 0x161a1e, [0.56, 0.58, 0.6]), [4000, 5400, 1200], { panel: 'none', hang: 'lamp', corner: 'none', c1: 0x5a6068, n: 8 },
    ({ out: Q_out, hx, hy, H, T, Box, Cyl, Oct, Glow, slabs, tile, plat, solid, deco, hit, tall, L, AX, AY, P, group }) => {
      const conc = 0x4a5056, iron = 0x2a2e34, steel = 0x6a7078, paint = 0xc8a03a;
      slabs(450, T.floor, T.floor2, 0x14171a);
      for (const s of [-1, 1]) tile(s * 2250 - 14, -hy + 500, s * 2250 + 14, hy - 500, 2.4, paint);
      // cells: partition walls out from each side wall (stopping short of it), a barred front with a doorway
      const cy = []; for (let y = -4200; y <= 4200; y += 700) if (Math.abs(Math.abs(y) - 500) > 300) cy.push(y);
      for (const e of [-1, 1]) Q_out.raised.push(e > 0 ? [2440, -hy, hx, hy] : [-hx, -hy, -2440, hy]);   // nothing comes up inside a cell
      for (const sx of [-1, 1]) {
        for (let y = -4550; y <= 4550; y += 700) { if (Math.abs(Math.abs(y) - 350) < 200 && false) continue; solid(sx * 3150, y, 0, 1300, 60, 460, conc); }
        solid(sx * 3150, 0, 460, 1300, 9160, 30, conc, false);   // the cells' roof slab: a gallery nobody walks
        cy.forEach((y, i) => {
          const open = i % 3 === 1;
          for (let p = -300; p <= 300; p += 60) { if (open && Math.abs(p) < 110) continue; Cyl(V(sx * 2500, y + p, 230), 12, 460, iron, false, false); }
          group(() => { deco(sx * 2500, y, 440, 20, 640, 20, iron); Box(V(sx * 2495, y, 420), V(10, 110, 60), paint, false, false); Box(V(sx * 2486, y, 420), V(8, 70 - (i % 3) * 14, 30), iron, false, false); }); deco(sx * 2500, y, 0, 20, 640, 16, iron);   // the number plate goes with the rail it is fixed to
          if (open) { for (const e of [-1, 1]) hit(sx * 2500, y + e * 215, 0, 24, 210, 460, true); for (let p = -90; p <= 90; p += 60) Cyl(V(sx * 2500 - sx * 110, y - 210 + (p + 90) * 0.1, 230), 12, 440, iron, false, false); }
          else hit(sx * 2500, y, 0, 24, 640, 460, true);
          P.bed(sx * 3500, y - 200, true, 0x5a5e56); Cyl(V(sx * 3650, y + 220, 24), 44, 48, 0xc8ccd0, false, false);
          Glow(V(sx * (hx - 6), y, 380), V(4, 120, 40), T.glow, 0);
        });
      }
      // the guards' cage
      plat(0, 0, 700, 900, 80, conc, 0x34383e);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) solid(sx * 330, sy * 430, 80, 40, 40, 300, iron, false);
      for (const s of [-1, 1]) { for (let p = -360; p <= 360; p += 60) Cyl(V(s * 330, p, 80 + 190), 12, 220, iron, false, false); hit(s * 330, 0, 80, 20, 820, 110, false); deco(s * 330, 0, 80, 30, 860, 110, steel); }
      deco(0, 0, 380, 760, 960, 24, iron); P.table(0, 0, true, 240, 0x4a3626, 80); Glow(V(0, 0, 80 + 84), V(60, 40, 10), 0x3aff7a, 0); L(0, 0, 330, T.lamp, 1800, 2.6); tall(0, 0, 560);
      // a bridge between the two galleries, over the cage, railed; lamps under it
      Box(V(0, 0, 475), V(4840, 260, 20), conc, false, false); for (const e of [-1, 1]) { Box(V(0, e * 124, 540), V(4840, 10, 10), iron, false, false); for (let x = -2400; x <= 2400; x += 300) Box(V(x, e * 124, 512), V(10, 10, 60), iron, false, false); for (const x of [-1500, 1500]) Box(V(x, e * 100, 475 + (H - 475) / 2), V(14, 14, H - 475), iron, false, false); } for (const x of [-1500, 1500]) { Box(V(x, 0, 450), V(60, 60, 30), iron, false, false); Glow(V(x, 0, 432), V(44, 44, 8), T.glow, 0); }
      // every cell has its number, painted over the door, and the block's stripe runs the length of the hall
      for (const sx of [-1, 1]) {  tile(sx * 1700 - 40, -hy + 500, sx * 1700 + 40, hy - 500, 2.4, 0x8a2a22); }
      // riot barricades: mess tables thrown on their sides, across the hall from each door
      for (const s of [-1, 1]) for (const e of [-1, 1]) { const x = e * 500, y = s * 4300; Box(V(x, y, 48), V(420, 12, 92), steel, true, true, e * s * 12); Box(V(x, y + s * 30, 4), V(380, 40, 8), steel, false, false, e * s * 12); for (const q of [-1, 1]) Box(V(x + q * 180, y + s * 26, 30), V(10, 52, 44), 0x3a2c20, false, false, e * s * 12); }
      // the yard phone, the bins, a notice board on the cage
      for (const s of [-1, 1]) { solid(s * 2200, s * 600, 0, 60, 140, 200, 0x34383e, false); Box(V(s * 2200 - s * 34, s * 600, 150), V(8, 60, 70), 0x1a1c1e, false, false); Glow(V(s * 2200 - s * 39, s * 600, 170), V(4, 30, 16), 0x3aff7a, 0); Cyl(V(-s * 2150, s * 900, 45), 80, 90, 0x3a5a3a, true, false); Cyl(V(-s * 2150, s * 900, 92), 86, 8, iron, false, false); Box(V(s * 338, 0, 80 + 190), V(6, 300, 150), 0x7a5a36, false, false); for (let q = -1; q <= 1; q++) Box(V(s * 343, q * 90, 80 + 190 + q * 16), V(4, 60, 80), 0xe8e0d0, false, false); }
      // mess tables, bolted in rows
      for (const s of [-1, 1]) for (const y of [1700, 2600, 3500]) for (const e of [-1, 1]) P.mess(e * 950, s * y, true, 420, steel);
      // overhead walkway rails and lamps
      for (const s of [-1, 1]) group(() => { Box(V(s * 2420, 0, 540), V(10, 9100, 10), iron, false, false); for (let y = -4400; y <= 4400; y += 400) Box(V(s * 2420, y, 515), V(10, 10, 60), iron, false, false); });
      for (const y of [-3200, -1500, 1500, 3200]) L(0, y, 620, T.lamp, 2200, 2.2);
    }),

  // ------------------------------------------------------------------------------------------------ GLASSHOUSE
  // A palm house gone wild. Raised beds of soil in a formal plan, a fountain at the crossing, iron columns holding up
  // ribs of glass. The beds are knee high: they slow you more than they hide you, and the big planters are the cover.
  mk(TH('Glasshouse', 0x1e2a22, 0x2a3a2e, 0x2a4038, 0xc8d8cc, 0x9affc8, [0.75, 1, 0.85], 0x16281e, [0.48, 0.64, 0.56]), [4600, 4800, 1600], { panel: 'window', hang: 'vine', corner: 'crates', c1: 0xc8d8cc, c2: 0x2a6a3a, glow: 0xbfffe0, n: 30 },
    ({ hx, hy, H, T, Box, BoxRot, Cyl, Oct, Glow, Ball, ConeShape, slabs, tile, solid, deco, hit, tall, L, crate, AX, AY, P }) => {
      const soil = 0x2a1e16, kerb = 0x8a8e86, leaf = [0x2a6a3a, 0x3a8a4a, 0x1e5a3a], bloom = [0xff6a8a, 0xffd86a, 0xb07aff, 0xff9a4a], white = 0xc8d8cc;
      slabs(480, T.floor, T.floor2, 0x121a14);
      tile(-300, -hy, 300, hy, 2.2, 0x6a6e66); tile(-hx, -300, hx, 300, 2.2, 0x6a6e66);
      P.fountain(0, 0, 900, 0x8a8e86, 0x3ac8d8, T.lamp);
      const plant = (x, y, z, h, c) => { for (let q = 0; q < 5; q++) { const a = q * 1.257 + x; BoxRot(V(x + Math.cos(a) * h * 0.2, y + Math.sin(a) * h * 0.2, z + h * 0.42), V(h * 0.16, 6, h), leaf[(q + c) % 3], R(Math.cos(a) * 26, a * 57.3, -Math.sin(a) * 26), false); } Ball(V(x, y, z + h * 0.8), V(h * 0.24, h * 0.24, h * 0.2), bloom[c % 4]); };
      const bed = (x, y, w, d, c) => { solid(x, y, 0, w, d, 50, kerb); deco(x, y, 46, w - 30, d - 30, 8, soil); for (let px = -w / 2 + 110; px < w / 2 - 60; px += 190) for (let py = -d / 2 + 110; py < d / 2 - 60; py += 190) plant(x + px, y + py, 54, 110 + ((px + py + c * 70) % 3 + 3) % 3 * 30, c + Math.round((px + py) / 190)); };
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { bed(sx * 1500, sy * 1500, 1300, 1300, sx + sy + 2); bed(sx * 3300, sy * 1400, 1100, 1500, sx + 3); bed(sx * 1500, sy * 3500, 1700, 1000, sy + 4); }
      // palms in great tubs: the real cover
      const palm = (x, y, h) => { Oct(V(x, y, 70), V(330, 330, 140), 0x7a4a2a, true, true); Oct(V(x, y, 144), V(360, 360, 14), kerb, false, false); Cyl(V(x, y, 140 + h / 2), 60, h, 0x5a4a2a, false, false); for (let q = 0; q < 7; q++) { const a = q / 7 * 6.283; BoxRot(V(x + Math.cos(a) * 190, y + Math.sin(a) * 190, 140 + h - 40), V(420, 60, 10), leaf[q % 3], R(0, a * 57.3, -24), false); } tall(x, y, 480); };
      for (const s of [-1, 1]) { palm(s * 700, s * 700, 560); palm(-s * 700, s * 700, 480); palm(s * 2400, 0, 620); palm(0, s * 2500, 620); palm(s * 3700, s * 3400, 520); palm(-s * 3700, s * 3400, 560); }
      // iron columns and the ribs they carry
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { P.column(sx * 2400, sy * 2500, 110, white, white, 'round'); BoxRot(V(sx * 1200, sy * 2500, H - 170), V(2500, 30, 30), white, R(0, 0, sx * -8), false); BoxRot(V(sx * 2400, sy * 1250, H - 170), V(30, 2600, 30), white, R(sy * 8, 0, 0), false); }
      // potting benches and a barrow
      for (const s of [-1, 1]) { P.table(s * 3900, -s * 300, false, 300, 0x5a3e26); for (let q = -1; q <= 1; q++) { Cyl(V(s * 3900, -s * 300 + q * 80, 96), 40, 36, 0xa8502a, false, false); } P.wagon(-s * 500, s * 3900, true, 0x5a3e26); crate(s * 400, s * 4100, 0, 90); L(s * 2400, s * 2500, 700, T.lamp, 2200, 2.2); L(-s * 2400, s * 2500, 700, T.lamp, 2200, 2.2); }
    }),

  // ------------------------------------------------------------------------------------------------ OBSERVATORY
  // Round, under a dome. The great telescope stands on a stepped pier in the middle; a ring of the planets hangs
  // round it, the star charts are laid in the floor, and the brass instruments stand at the compass points.
  mk(TH('Observatory', 0x161a2a, 0x1e2438, 0x262c44, 0xb8923a, 0x8ab0ff, [0.6, 0.72, 1], 0x10142a, [0.46, 0.5, 0.72]), [4600, 4600, 1900], { panel: 'niche', hang: 'star', corner: 'crates', c1: 0xb8923a, c2: 0x2a3050, n: 110 },
    ({ hx, hy, H, T, Box, BoxRot, Cyl, Oct, Glow, Ball, slabs, tile, platOct, solid, deco, hit, tall, L, ring, crate, AX, AY, P }) => {
      const brass = 0xb8923a, dark = 0x12162a, wood = 0x4a3626, ink = 0x0e1224;
      slabs(520, T.floor, T.floor2, 0x0c1020, (x, y) => Math.hypot(x, y) < 3300);
      Cyl(V(0, 0, 1.4), 6500, 2.4, ink, false, false); ring(0, 0, 2.8, 6300, 30, brass, ink); ring(0, 0, 4.4, 4400, 20, brass, ink); ring(0, 0, 6, 2700, 16, brass, ink);
      for (let q = 0; q < 12; q++) { const a = q / 12 * 6.283; Glow(V(Math.cos(a) * 2700, Math.sin(a) * 2700, 8.6), V(260, 14, 1.4), 0xfff0c0, 0, R(0, a * 57.3, 0)); for (let k = 0; k < 4; k++) { const r = 700 + ((q * 7 + k * 5) % 9) * 250, b = a + k * 0.13; Glow(V(Math.cos(b) * r, Math.sin(b) * r, 8.6), V(22, 22, 1.4), k % 2 ? 0xffffff : T.glow, 2); } }
      // the telescope
      platOct(0, 0, 1100, 160, 0x3a4060, dark);
      solid(0, 0, 160, 360, 360, 300, dark, false); deco(0, 0, 160, 420, 420, 40, brass); P.gear(0, 190, 160 + 330, 420, brass, true, 30);
      Cyl(V(0, 0, 160 + 620), 240, 1300, 0xe8dcc0, false, false, R(40, 0, 90)); Cyl(V(0, 500, 160 + 1040), 280, 80, brass, false, false, R(40, 0, 90)); Cyl(V(0, -500, 160 + 200), 150, 80, brass, false, false, R(40, 0, 90)); Cyl(V(0, 0, 160 + 620), 260, 60, brass, false, false, R(40, 0, 90));
      hit(0, 0, 160, 300, 300, 520, false); L(0, 0, 700, T.lamp, 3000, 3); tall(0, 0, 900);
      // the orrery: planets hung on rods at different heights round the pier
      [[1500, 0.3, 150, 0xc87a3a], [1900, 1.4, 240, 0xd8c08a], [1700, 2.6, 130, 0x5a8ad0], [2100, 3.7, 300, 0xc8a070], [1600, 4.8, 110, 0xa04a3a], [2000, 5.9, 200, 0x8ac0d0]].forEach(([r, a, d, c], i) => { const x = Math.cos(a) * r, y = Math.sin(a) * r, z = 700 + (i % 3) * 160; Cyl(V(x, y, z + (H - z) / 2), 8, H - z, brass, false, false); Ball(V(x, y, z), V(d, d, d), c); if (i === 3) Cyl(V(x, y, z), d * 1.7, 6, 0xd8c08a, false, false); tall(x, y, d / 2 + 120); });
      // instruments at the compass points: armillary, chart tables, a transit
      for (const s of [-1, 1]) {
        const ax = s * 3000, ay = 0; solid(ax, ay, 0, 160, 160, 110, wood); for (let q = 0; q < 3; q++) Cyl(V(ax, ay, 260), 280, 10, brass, false, false, R(q * 60, q * 40, 90)); Ball(V(ax, ay, 260), V(60, 60, 60), 0x5a8ad0); hit(ax, ay, 110, 220, 220, 300, false);
        P.table(0, s * 3000, true, 420, wood); Box(V(0, s * 3000, 80), V(300, 70, 3), 0xe8dcc0, false, false); Cyl(V(160, s * 3000, 94), 10, 30, brass, false, false);
        for (const e of [-1, 1]) { P.shelf(s * 2300, e * 2300, s * e > 0, 600, 260, wood); P.lampPost(s * 1500, e * 1500, 300, T.lamp, dark); crate(s * 3500, e * 3300, 0, 100); }
      }
    }),
];
