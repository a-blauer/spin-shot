// Rooms 33 to 40 of the Descent: a spiders' den, a scrapyard, a stable, a hall of statues, a cistern, a tomb under
// the sand, a distillery and a toymaker's workshop. Built to the rules at the top of descent_rooms.js.
import { V, V2, R } from './mapkit.js';

const TH = (name, floor, floor2, wall, trim, glow, lamp, fog, sh, title) => ({ name, title, floor, floor2, wall, trim, glow, lamp, fog, sh });
const mk = (theme, dims, wall, fn) => ({ theme, dims, wall, build: (K, Q, P) => fn({ ...K, ...K.M, ...Q, P }) });

export const ROOMS_D = [
  // ------------------------------------------------------------------------------------------------ WEBBED DEN
  // Something spun this room shut. Web hangs in sheets between leaning posts and makes walls you can see through;
  // cocoons hang from the roof and lie in heaps, and the nest is a mound in the middle with eggs in it.
  mk(TH('Webbed Den', 0x1c1a1e, 0x28242a, 0x2e2a30, 0x6a6470, 0xe0d8ff, [0.85, 0.82, 1], 0x18161c, [0.54, 0.52, 0.6]), [4600, 4600, 1300], { panel: 'none', hang: 'vine', corner: 'rubble', c1: 0xc8c4d0, c2: 0xa8a4b0, glow: 0xe0d8ff, n: 40, rail: false },
    ({ hx, hy, H, T, Box, BoxRot, Cyl, Oct, Glow, Ball, platOct, tile, solid, deco, hit, tall, L, P }) => {
      const silk = 0xd8d4e0, grey = 0xa8a4b0, wood = 0x3a2c24, egg = 0xe8e0c8;
      for (let i = 0; i < 80; i++) { const x = ((i * 859) % (hx * 2 - 300)) - hx + 150, y = ((i * 523) % (hy * 2 - 300)) - hy + 150, w = 200 + (i % 5) * 90; Oct(V(x, y, 1.2 + (i % 3) * 0.5), V(w * 2, w * 1.5, 2), i % 3 ? T.floor2 : 0x141216, false, false); }
      // the nest
      platOct(0, 0, 1200, 120, 0x4a4650, 0x2e2a30);
      Ball(V(0, 0, 120), V(760, 760, 360), grey); hit(0, 0, 120, 480, 480, 150, false); for (let q = 0; q < 9; q++) { const a = q * 0.7, r = 180 + (q % 3) * 110; Ball(V(Math.cos(a) * r, Math.sin(a) * r, 120 + 150 + (q % 2) * 30), V(110, 110, 140), egg); Glow(V(Math.cos(a) * r, Math.sin(a) * r, 120 + 150), V(40, 40, 50), 0xb8ff8a, 2); } L(0, 0, 620, T.lamp, 2600, 3); tall(0, 0, 600);
      // a sheet of web between two posts: you cannot walk through it, and it does not stop the eye
      const web = (x, y, len, along) => {
        for (const e of [-1, 1]) { const px = x + (along ? e * len / 2 : 0), py = y + (along ? 0 : e * len / 2); BoxRot(V(px, py, 300), V(50, 50, 620), wood, R(along ? 0 : e * 5, 0, along ? e * 5 : 0), false); hit(px, py, 0, 70, 70, 560, true); }
        for (const z of [90, 210, 330, 450]) Box(V(x, y, z), along ? V(len, 6, 8) : V(6, len, 8), silk, false, false);
        for (let p = -len / 2 + 60; p < len / 2; p += 110) Box(V(x + (along ? p : 0), y + (along ? 0 : p), 280), along ? V(6, 6, 440) : V(6, 6, 440), silk, false, false);
        for (const e of [-1, 1]) BoxRot(V(x + (along ? e * len / 4 : 0), y + (along ? 0 : e * len / 4), 280), along ? V(len / 2, 5, 6) : V(5, len / 2, 6), silk, along ? R(0, 0, e * 40) : R(e * 40, 0, 0), false);
        hit(x, y, 0, along ? len - 60 : 30, along ? 30 : len - 60, 480, true);
      };
      for (const s of [-1, 1]) { web(s * 1900, s * 800, 1300, false); web(s * 800, -s * 1900, 1300, true); web(s * 2900, -s * 2200, 1100, true); web(-s * 2200, -s * 2900, 1100, false); web(s * 3500, s * 2600, 900, false); web(s * 900, s * 3300, 900, true); }
      // cocoons: hung, and heaped
      const cocoon = (x, y, z, s = 1) => { Ball(V(x, y, z), V(110 * s, 110 * s, 240 * s), silk); Ball(V(x, y, z + 20 * s), V(116 * s, 116 * s, 60 * s), grey); };
      for (const [x, y, z] of [[1200, 1300, 520], [-1200, -1300, 560], [2500, 300, 600], [-2500, -300, 520], [300, 2500, 640], [-300, -2500, 560], [3300, -900, 600], [-3300, 900, 620], [1900, 3500, 560], [-1900, -3500, 600]]) { Cyl(V(x, y, z + 120 + (H - z - 120) / 2), 8, H - z - 120, silk, false, false); cocoon(x, y, z); tall(x, y, 240); }
      for (const [x, y] of [[2700, 1500], [-2700, -1500], [-1500, 2600], [1500, -2600], [3700, -3300], [-3700, 3300]]) { hit(x, y, 0, 300, 260, 130, true); cocoon(x - 70, y, 70, 0.9); cocoon(x + 80, y + 40, 60, 0.8); Ball(V(x, y - 60, 40), V(240, 110, 110), silk); Ball(V(x, y, 0), V(520, 460, 60), grey); }
      // what was here before: a cart, crates, a lamp still burning
      for (const s of [-1, 1]) { P.wagon(s * 3600, s * 500, false, wood); Ball(V(s * 3600, s * 500, 100), V(200, 320, 120), silk); P.lampPost(-s * 1300, s * 3600, 260, T.lamp, 0x2a2e30); P.lampPost(s * 3900, -s * 1500, 260, T.lamp, 0x2a2e30); }
    }),

  // ------------------------------------------------------------------------------------------------ THE SCRAPYARD
  // Heaps. Stacked hulks make canyon walls, a crusher squats in the middle, and a magnet hangs over the lot. Nothing
  // is square to anything else; the lanes wind, and there is always another heap to get behind.
  mk(TH('The Scrapyard', 0x24221e, 0x302c26, 0x3a3630, 0x8a6a3a, 0xffb040, [1, 0.8, 0.5], 0x1e1a14, [0.6, 0.56, 0.48]), [5000, 4600, 1400], { panel: 'planks', hang: 'chain', corner: 'rubble', c1: 0x6a5a4a, c2: 0x5a4a3a, n: 10 },
    ({ hx, hy, H, T, Box, BoxRot, Cyl, Oct, Glow, slabs, tile, plat, solid, deco, hit, tall, L, barrel, AX, AY, P }) => {
      const rust = 0x8a4a2a, iron = 0x3a3e46, yel = 0xc8a03a, body = [0x7a3a2a, 0x3a5a6a, 0x5a6a3a, 0x8a7a4a, 0x4a4e56];
      for (let i = 0; i < 70; i++) { const x = ((i * 823) % (hx * 2 - 300)) - hx + 150, y = ((i * 467) % (hy * 2 - 300)) - hy + 150, w = 220 + (i % 5) * 100; tile(x - w, y - w * 0.7, x + w, y + w * 0.7, 1.6, i % 3 ? T.floor2 : 0x1a1612); }
      // a hulk: a boxy body with a cab, no wheels; stacked up to three high, each skewed on the last
      let hi = 0; const hulk = (x, y, z, yaw) => { const c = body[(hi++) % 5]; Box(V(x, y, z + 55), V(380, 170, 110), c, true, z === 0, yaw); Box(V(x, y, z + 138), V(190, 150, 56), c, false, false, yaw); Box(V(x, y, z + 140), V(196, 130, 40), 0x1a1e22, false, false, yaw); Box(V(x, y, z + 8), V(390, 180, 16), iron, false, false, yaw); };
      const stackOf = (x, y, n, yaw) => { for (let k = 0; k < n; k++) hulk(x + (k % 2) * 30, y - (k % 2) * 20, k * 166, yaw + k * 9); if (n > 2) tall(x, y, 320); };
      for (const s of [-1, 1]) { stackOf(s * 1900, s * 600, 3, 80); stackOf(s * 1900, s * 1050, 2, 95); stackOf(s * 1900, s * 1500, 3, 86); stackOf(-s * 800, s * 2300, 2, 10); stackOf(-s * 1350, s * 2350, 3, -6); stackOf(s * 3300, -s * 1700, 3, 20); stackOf(s * 3800, -s * 1500, 2, 35); stackOf(s * 3400, s * 2900, 2, 70); stackOf(-s * 3500, s * 600, 1, 50); stackOf(s * 600, s * 3500, 1, -20); }
      // the crusher
      plat(0, 0, 900, 700, 40, 0x4a4e56, iron);
      for (const e of [-1, 1]) { solid(e * 400, 0, 40, 100, 660, 520, yel, false); for (let z = 100; z < 520; z += 120) deco(e * 400, 0, 40 + z, 110, 670, 16, iron); }
      solid(0, 0, 40, 700, 560, 60, iron, false); Box(V(0, 0, 40 + 470), V(720, 600, 110), iron, false, false); for (const e of [-1, 1]) Cyl(V(e * 200, 0, 40 + 320), 90, 240, 0x8a8e96, false, false); Box(V(0, 0, 40 + 96), V(520, 360, 70), body[0], false, false);
      hit(0, 0, 40, 720, 560, 100, true); Glow(V(0, -334, 40 + 300), V(60, 4, 60), 0xff3a2a, 0); L(0, 0, 760, T.lamp, 2600, 3); tall(0, 0, 720);
      // the magnet
      P.hung(900, -1500, 640, (z) => { Cyl(V(900, -1500, z - 40), 360, 80, iron, false, false); Cyl(V(900, -1500, z - 90), 300, 30, 0x8a8e96, false, false); Box(V(900, -1500, z - 140), V(180, 120, 70), body[1], false, false, 25); });
      // loose heaps, tyres, drums, an engine on a stand
      for (const s of [-1, 1]) { P.junk(s * 700, s * 1400, 360); P.junk(-s * 2800, s * 2200, 420); P.junk(s * 4200, s * 400, 340); P.junk(-s * 400, s * 3900, 300);
        for (let k = 0; k < 4; k++) Cyl(V(-s * 2600, -s * 600, 22 + k * 44), 150, 44, 0x17181c, k === 0, false); hit(-s * 2600, -s * 600, 0, 150, 150, 176, true);
        barrel(s * 2700, s * 3900, 0, rust); barrel(s * 2810, s * 3860, 0, 0x3a5a6a); solid(-s * 3900, -s * 3000, 0, 120, 120, 80, iron); Box(V(-s * 3900, -s * 3000, 130), V(150, 100, 100), 0x4a4e56, false, false); Cyl(V(-s * 3900, -s * 3000, 190), 30, 40, iron, false, false); P.fence(s * 2500, -s * 3600, 1300, true, iron, 110); }
    }),

  // ------------------------------------------------------------------------------------------------ THE STABLES
  // A long barn. Stalls down both sides with half-doors, the hayloft's posts down the middle, a smithy at one end and
  // the tack room at the other. Wagons and bales in the aisle are what you fight round.
  mk(TH('The Stables', 0x2a2218, 0x362c20, 0x44341f, 0x6a5a3a, 0xffc070, [1, 0.82, 0.55], 0x241c12, [0.64, 0.56, 0.44]), [3800, 5400, 1300], { panel: 'planks', hang: 'lamp', corner: 'none', c1: 0x5a3e26, c2: 0x4a3220, glow: 0xffc070, n: 6 },
    ({ out: Q_out, hx, hy, H, T, Box, BoxRot, Cyl, Oct, Glow, Ball, slabs, tile, plat, solid, deco, hit, tall, L, barrel, crate, AX, AY, P }) => {
      const wood = 0x5a3e26, dark = 0x3a2c20, straw = 0xb89a3a, iron = 0x3a3e46;
      slabs(450, T.floor, T.floor2, 0x1a140e, (x) => Math.abs(x) > 2300);
      for (const sx of [-1, 1]) tile(sx * 3050 - 750, -hy + 420, sx * 3050 + 750, hy - 420, 1.6, 0x6a5a2e);
      // stalls: partitions out from the wall, a half-door on each (every third stands open)
      const sy = []; for (let y = -4200; y <= 4200; y += 700) if (Math.abs(Math.abs(y) - 700) > 100) sy.push(y);
      for (const e of [-1, 1]) Q_out.raised.push(e > 0 ? [2280, -hy, hx, hy] : [-hx, -hy, -2280, hy]);   // nothing comes up inside a stall
      for (const sx of [-1, 1]) {
        for (let y = -4550; y <= 4550; y += 700) { solid(sx * 3050, y, 0, 1400, 50, 230, wood); deco(sx * 3050, y, 230, 1410, 60, 12, dark); solid(sx * 2350, y, 0, 70, 70, 620, dark, false); }
        Box(V(sx * 2350, 0, 640), V(90, 9200, 60), dark, false, false);
        sy.forEach((y, i) => {
          const open = i % 3 === 1; if (!open) { solid(sx * 2350, y, 0, 40, 620, 130, wood, false); deco(sx * 2350, y, 60, 46, 560, 10, dark); deco(sx * 2350, y, 130, 50, 630, 10, dark); hit(sx * 2350, y, 0, 40, 620, 130, true); } else { Box(V(sx * 2350 - sx * 160, y - 300, 65), V(320, 40, 130), wood, true, false); }
          tile(sx * 3300 - 300, y - 250, sx * 3300 + 300, y + 250, 2.6, straw); solid(sx * 3650, y + 180, 0, 110, 240, 70, dark, false); deco(sx * 3650, y + 180, 60, 90, 220, 14, straw); Cyl(V(sx * 3600, y - 240, 30), 70, 60, dark, true, false);
        });
      }
      // posts down the middle, the loft's edge above
      for (const y of [-4000, -2400, -800, 800, 2400, 4000]) { for (const e of [-1, 1]) { P.column(e * 900, y, 150, wood, dark, 'square'); BoxRot(V(e * 900 + e * 130, y, H - 330), V(360, 40, 40), dark, R(0, 0, e * -45), false); } Box(V(0, y, H - 170), V(4700, 80, 80), dark, false, false); }
      for (const e of [-1, 1]) Box(V(e * 900, 0, H - 100), V(80, 9300, 80), dark, false, false);
      // the aisle: wagons, bales, a trough, a mounting block
      P.wagon(-250, 1700, false, wood); P.hay(-250, 1700, false, 72); P.wagon(300, -1900, false, wood);
      for (const [x, y, n] of [[400, 300, 3], [-450, -500, 2], [300, 3300, 3], [-300, -3400, 2], [-1500, 2600, 2], [1500, -2600, 3]]) { P.hay(x, y, true); P.hay(x + 150, y + 10, true); if (n > 2) P.hay(x + 70, y, true, 80); P.hay(x + 40, y + 110, false); }
      for (const s of [-1, 1]) { solid(s * 1500, s * 900, 0, 130, 420, 60, dark); Glow(V(s * 1500, s * 900, 58), V(90, 380, 6), 0x3aa8ff, 0); barrel(-s * 1550, s * 400); P.rack(s * 1550, -s * 3900, true, dark);
        // the smithy end and the tack end
        const y = s * 4500; if (s > 0) { solid(-1900, y, 0, 240, 200, 110, 0x4a2c22); Glow(V(-1900, y, 108), V(180, 140, 8), 0xff6a1a, 0); solid(-1500, y, 0, 60, 60, 50, wood, false); deco(-1500, y, 50, 60, 130, 40, 0x17181c); L(-1900, y, 300, [1, 0.5, 0.15], 1200, 2); }
        else { P.fence(-1900, y + 140, 700, true, dark, 120); for (let q = -2; q <= 2; q++) { Box(V(-1900 + q * 130, y + 140, 150), V(90, 60, 50), 0x5a3220, false, false); Box(V(-1900 + q * 130, y + 140, 100), V(14, 60, 60), 0x2a2018, false, false); } crate(-1400, y + 60, 0, 100); } }
      for (const y of [-3200, -1600, 0, 1600, 3200]) L(0, y, 620, T.lamp, 2000, 2.2);
    }),

  // ------------------------------------------------------------------------------------------------ HALL OF STATUES
  // A sculpture court. The colossus kneels at the middle with the room's light in its hands; smaller figures stand in
  // ranks on their plinths like a crowd turned to stone, and half-cut blocks wait where the carvers left them.
  mk(TH('Hall of Statues', 0x26282a, 0x34383a, 0x40464a, 0xc8c4b8, 0xa0e0ff, [0.78, 0.9, 1], 0x1a1e22, [0.54, 0.58, 0.62]), [4600, 4600, 1700], { panel: 'niche', hang: 'lamp', corner: 'rubble', c1: 0xc8c4b8, c2: 0x8a8a84, n: 6 },
    ({ hx, hy, H, T, Box, BoxRot, Cyl, Oct, Glow, Ball, slabs, tile, plat, platOct, solid, deco, hit, tall, L, ring, AX, AY, P }) => {
      const stone = 0xa8a49a, pale = 0xc8c4b8, dark = 0x5a5e5a, wood = 0x5a3e26;
      slabs(480, T.floor, T.floor2, 0x15181a, (x, y) => Math.hypot(x, y) < 1700);
      Cyl(V(0, 0, 1.4), 3300, 2.4, 0x1e2224, false, false); ring(0, 0, 2.8, 3200, 30, pale, 0x1e2224);
      // the colossus: kneeling, built of blocks, holding a bowl of light
      platOct(0, 0, 900, 80, dark, 0x34383a);
      solid(0, 0, 80, 420, 320, 300, stone, false); deco(-130, -40, 380, 160, 200, 300, stone); deco(130, 120, 380, 160, 360, 140, stone); deco(0, 0, 380 + 300, 380, 240, 380, stone); Ball(V(0, 30, 80 + 1150), V(220, 230, 260), stone);
      for (const e of [-1, 1]) { BoxRot(V(e * 240, 130, 80 + 800), V(110, 110, 380), stone, R(-60, 0, e * 10), false); } Cyl(V(0, 330, 80 + 760), 320, 60, pale, false, false); Glow(V(0, 330, 80 + 800), V(240, 240, 30), T.glow, 1); L(0, 330, 1000, T.lamp, 3000, 3.2); hit(0, 60, 380, 380, 300, 700, false); tall(0, 100, 760);
      // the crowd: ranks of figures, each on a plinth, facing the middle; poses and sizes by turn
      let n = 0; for (const [r, k] of [[1500, 8], [2500, 12]]) for (let q = 0; q < k; q++) { const a = (q + (r > 2000 ? 0.5 : 0)) / k * 6.283, x = Math.cos(a) * r, y = Math.sin(a) * r; if (Math.abs(x) < 420 && Math.abs(y) > 1000) continue; P.statue(x, y, 240 + (n % 3) * 40, n % 4 ? pale : stone, dark, n % 2); n++; }
      // the carvers' corner pieces: blocks half cut, a head on its side, scaffolding round an unfinished giant
      for (const s of [-1, 1]) {
        const x = s * 3500, y = s * 3300; solid(x, y, 0, 360, 360, 700, stone); deco(x, y, 700, 300, 300, 200, stone); Ball(V(x, y, 1000), V(260, 260, 280), stone); tall(x, y, 520);
        for (const e of [-1, 1]) for (const f of [-1, 1]) deco(x + e * 300, y + f * 300, 0, 24, 24, 900, wood); for (const z of [300, 600, 900]) { deco(x, y - 300, z, 640, 60, 12, wood); deco(x, y + 300, z, 640, 60, 12, wood); } hit(x, y, 0, 620, 620, 200, true);
        Ball(V(-s * 3600, s * 3000, 110), V(300, 260, 240), pale); hit(-s * 3600, s * 3000, 0, 260, 220, 200, true); for (const e of [-1, 1]) Ball(V(-s * 3600 + e * 60, s * 3000 - s * 120, 130), V(50, 30, 40), 0x2a2e30);
        for (const [dx, dy, sz] of [[0, 0, 240], [300, 60, 180], [120, 280, 200]]) { solid(s * 3400 + dx - 150, -s * 3000 + dy - 100, 0, sz, sz, sz * 0.8, (dx % 7) ? stone : pale); }
        P.table(s * 2000, -s * 3600, true, 300, wood); for (let q = -1; q <= 1; q++) deco(s * 2000 + q * 80, -s * 3600, 78, 14, 60, 10, 0x8a8e96);
        P.column(s * 3900, 0, 280, pale, dark, 'round');
      }
    }),

  // ------------------------------------------------------------------------------------------------ THE CISTERN
  // A forest of columns standing in water. The whole floor is ankle deep but for a raised causeway from door to door
  // and across; the columns are close and regular, so you fight in glimpses down the rows.
  mk(TH('The Cistern', 0x16222a, 0x1e2e38, 0x2a3a44, 0x8a9a9a, 0x5ac8ff, [0.5, 0.85, 1], 0x0e1e2a, [0.42, 0.56, 0.68]), [4400, 5000, 1400], { panel: 'arch', hang: 'none', corner: 'none', c1: 0x5a6a6e, c2: 0x101c22 },
    ({ hx, hy, H, T, Box, Cyl, Oct, Glow, Ball, tile, plat, solid, deco, hit, tall, L, barrel, crate, AX, AY, P, BoxRot }) => {
      const stone = 0x6a7a7e, water = 0x12303e, pale = 0x9aaaae, moss = 0x3a6a4a;
      tile(-hx, -hy, hx, hy, 1.6, water);
      for (let i = 0; i < 60; i++) { const x = ((i * 787) % (hx * 2 - 400)) - hx + 200, y = ((i * 449) % (hy * 2 - 400)) - hy + 200; Glow(V(x, y, 3.2), V(140 + (i % 4) * 60, 8, 2), 0x5ac8ff, 0, R(0, (i * 37) % 180, 0)); }
      // the causeway: a cross of raised stone, one step up
      Box(V(0, 0, 20), V(700, hy * 2 - 500, 40), stone, true, false); Box(V(0, 0, 20), V(hx * 2 - 500, 700, 40), stone, true, false); for (const s of [-1, 1]) { tile(s * 330 - 12, -hy + 300, s * 330 + 12, hy - 300, 41.4, pale); tile(-hx + 300, s * 330 - 12, hx - 300, s * 330 + 12, 41.4, pale); }
      // the columns: a grid, alternate ones with a carved base (a great head, on its side, as these places have)
      const xs = [-3500, -2500, -1500, 1500, 2500, 3500], ys = [-4000, -3000, -2000, -1000, 1000, 2000, 3000, 4000];
      for (const x of xs) for (const y of ys) { const odd = (Math.round(x / 1000) + Math.round(y / 1000)) % 2; P.column(x, y, 300, odd ? stone : 0x5a6a6e, pale, 'round'); Cyl(V(x, y, 120), 320, 60, moss, false, false); if ((x * 3 + y) % 4000 === 500) { Box(V(x, y, 75), V(480, 480, 150), pale, true, true); for (const e of [-1, 1]) Ball(V(x + e * 110, y - 246, 90), V(70, 20, 50), 0x2a3a44); } }
      for (const x of xs) Box(V(x, 0, H - 60), V(180, hy * 2 - 60, 120), 0x1e2a32, false, false);
      // the well-head at the crossing, lit from inside
      Oct(V(0, 0, 40 + 60), V(520, 520, 120), stone, true, true); Oct(V(0, 0, 40 + 126), V(560, 560, 12), pale, false, false); Glow(V(0, 0, 40 + 112), V(400, 400, 8), T.glow, 1); L(0, 0, 420, T.lamp, 2600, 3);
      P.hung(0, 0, 700, (z) => { Cyl(V(0, 0, z - 30), 160, 60, 0x3a3e46, false, false); Cyl(V(0, 0, z - 220), 8, 320, 0x3a3e46, false, false); Cyl(V(0, 0, z - 400), 90, 80, 0x5a3e26, false, false); });
      // things on the causeway and floating off it: a punt, crates, lamps on poles
      for (const s of [-1, 1]) {
        const bx = s * 2000, by = s * 1500; solid(bx, by, 6, 180, 520, 50, 0x5a3e26); deco(bx, by, 56, 150, 480, 6, 0x3a2c20); for (const e of [-1, 1]) deco(bx + e * 90, by, 30, 14, 540, 50, 0x3a2c20); BoxRot(V(bx + 60, by + 80, 110), V(10, 10, 420), 0x3a2c20, R(70, 0, 8), false);
        crate(s * 240, s * 2500, 40, 100, 0x6a4e30, 0x2a2420, false); crate(-s * 230, -s * 1400, 40, 110, 0x5a4630, 0x2a2420, false); barrel(s * 1900, -s * 220, 40); barrel(-s * 3000, s * 230, 40);
        for (const e of [-1, 1]) { P.lampPost(e * 300, s * 3500, 260, T.lamp, 0x3a3e46, 40); P.lampPost(s * 3000, e * 300, 260, T.lamp, 0x3a3e46, 40); L(e * 2500, s * 2500, 500, T.lamp, 1700, 1.8); }
      }
    }),

  // ------------------------------------------------------------------------------------------------ SAND TOMB
  // A king's burying place, half filled with sand. A stepped pyramid at the middle with the sarcophagus on top, four
  // obelisks at its corners, seated guardians along the walls, and drifts of sand you fight across.
  mk(TH('Sand Tomb', 0x3a3020, 0x4a3e28, 0x5a4a2e, 0xd8b04a, 0x5ae0d0, [1, 0.88, 0.6], 0x2e2414, [0.68, 0.6, 0.46]), [4800, 4800, 1700], { panel: 'niche', hang: 'none', corner: 'rubble', c1: 0xc8a86a, c2: 0x8a6a3a, glow: 0x5ae0d0 },
    ({ hx, hy, H, T, Box, Cyl, Oct, Glow, Ball, Pyramid, slabs, tile, plat, solid, deco, hit, tall, L, AX, AY, P }) => {
      const sandst = 0xc8a86a, gold = 0xd8b04a, lapis = 0x2a5a9a, sand = 0xd8c08a, dark = 0x6a5430;
      slabs(520, T.floor, T.floor2, 0x2a2214, (x, y) => Math.abs(x) < 1400 && Math.abs(y) < 1400);
      // the pyramid: five steps (each a riser of forty), then the bier
      plat(0, 0, 900, 900, 200, sandst, 0xa88a52);
      solid(0, 0, 200, 300, 140, 90, lapis, false); deco(0, 0, 290, 320, 160, 30, gold); Ball(V(-110, 0, 330), V(70, 90, 70), gold); deco(40, 0, 320, 200, 100, 26, gold); for (const e of [-1, 1]) deco(0, e * 70, 200, 320, 8, 90, gold);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { solid(sx * 380, sy * 380, 200, 50, 50, 150, dark, false); Cyl(V(sx * 380, sy * 380, 356), 100, 12, dark, false, false); Glow(V(sx * 380, sy * 380, 384), V(60, 60, 46), 0xff9a4a, 3); }
      L(0, 0, 700, T.lamp, 3000, 3.2); tall(0, 0, 400);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) P.obelisk(sx * 1700, sy * 1700, 1000, sandst, T.glow, 190);
      // seated guardians in two ranks
      const guard = (x, y, face) => { solid(x, y, 0, 300, 360, 200, sandst); deco(x, y - face * 60, 200, 240, 200, 260, sandst); deco(x, y + face * 70, 200, 220, 180, 90, sandst); Ball(V(x, y - face * 60, 540), V(150, 150, 170), sandst); deco(x, y - face * 60, 610, 190, 170, 50, lapis); for (const e of [-1, 1]) deco(x + e * 90, y - face * 60, 480, 30, 150, 160, gold); hit(x, y - face * 60, 200, 240, 200, 400, false); tall(x, y, 360); };
      for (const s of [-1, 1]) for (const x of [-3300, -1100, 1100, 3300]) guard(x, s * 3300, s);
      for (const s of [-1, 1]) { P.column(s * 3600, s * 1100, 320, sandst, gold, 'round'); P.column(s * 3600, -s * 1100, 320, sandst, gold, 'round'); }
      // sand: drifts against things (soft mounds), and the grave goods half buried in them
      const drift = (x, y, w, d, h) => { Ball(V(x, y, 0), V(w, d, h * 2), sand); hit(x, y, 0, w * 0.55, d * 0.55, h * 0.5, true); };
      for (const s of [-1, 1]) { drift(s * 2500, s * 500, 900, 700, 150); drift(-s * 600, s * 2500, 800, 900, 140); drift(s * 4000, -s * 2600, 900, 900, 220); drift(-s * 2400, -s * 2200, 700, 700, 120);
        for (const [x, y] of [[s * 2200, -s * 1500], [-s * 1500, s * 2000]]) { Cyl(V(x, y, 70), 110, 140, 0xa8502a, true, true); Ball(V(x, y, 150), V(140, 140, 80), 0xa8502a); Cyl(V(x, y, 196), 70, 20, 0xa8502a, false, false); deco(x, y, 60, 116, 116, 14, lapis); }
        solid(s * 2700, s * 2300, 0, 150, 100, 80, dark); deco(s * 2700, s * 2300, 80, 156, 106, 26, gold); Glow(V(s * 2700, s * 2300 - s * 54, 60), V(30, 4, 20), T.glow, 0);
        // a boat for the dead, on its cradle
        const bx = -s * 3000, by = s * 600; for (const e of [-1, 1]) deco(bx, by + e * 160, 0, 140, 30, 60, dark); solid(bx, by, 60, 150, 560, 60, 0x7a5a2a); Pyramid(V(bx, by + 330, 110), V(120, 140, 160), 0x7a5a2a); Pyramid(V(bx, by - 330, 110), V(120, 140, 160), 0x7a5a2a); deco(bx, by, 120, 20, 20, 200, dark); hit(bx, by, 0, 150, 640, 130, true); }
    }),

  // ------------------------------------------------------------------------------------------------ THE DISTILLERY
  // Copper and oak. Three pot stills in a line down the middle, each with its swan neck over to a worm tub; walls of
  // casks on their sides make the lanes, and the spirit safe gleams at the crossing.
  mk(TH('The Distillery', 0x24201a, 0x302a22, 0x3c3226, 0xc87a3a, 0xffa84a, [1, 0.78, 0.5], 0x221a12, [0.62, 0.54, 0.46]), [4800, 4200, 1400], { panel: 'pipes', hang: 'lamp', corner: 'barrels', c1: 0xc87a3a, c2: 0x8a4a2a, n: 8 },
    ({ hx, hy, H, T, Box, Cyl, Oct, Glow, Ball, ConeShape, slabs, tile, platOct, solid, deco, hit, tall, L, barrel, crate, AX, AY, P }) => {
      const copper = 0xc87a3a, oak = 0x5a3e26, hoop = 0x2a2420, brick = 0x5a3a2c, brass = 0xb8923a;
      slabs(480, T.floor, T.floor2, 0x15110c);
      // the stills
      for (const x of [-2000, 0, 2000]) {
        Oct(V(x, 0, 60), V(820, 820, 120), brick, true, true); Glow(V(x, -414, 60), V(160, 6, 70), 0xff6a1a, 0);
        Cyl(V(x, 0, 120 + 130), 560, 260, copper, true, false); Ball(V(x, 0, 120 + 260), V(560, 560, 420), copper); ConeShape(V(x, 0, 120 + 560), V(260, 260, 360), copper); Cyl(V(x, 0, 120 + 760), 90, 120, copper, false, false);
        Cyl(V(x, 330, 120 + 800), 80, 660, copper, false, false, AY); Cyl(V(x, 660, 120 + 560), 70, 480, copper, false, false);
        Cyl(V(x, 760, 160), 420, 320, oak, true, true); for (const z of [60, 260]) Cyl(V(x, 760, z), 436, 14, hoop, false, false); Glow(V(x, 760, 322), V(360, 360, 6), 0x3aa8ff, 0);
        for (const f of [0.3, 0.7]) Cyl(V(x, 0, 120 + 260 * f * 2), 580, 12, brass, false, false); L(x, -300, 600, T.lamp, 2000, 2.6); tall(x, 200, 800);
      }
      // the spirit safe: brass and glass on a stand
      solid(1000, -900, 0, 300, 140, 90, oak); Box(V(1000, -900, 150), V(280, 120, 120), brass, false, false); Glow(V(1000, -900, 150), V(240, 124, 80), 0xffe6a0, 0); Box(V(1000, -900, 216), V(300, 140, 12), brass, false, false); hit(1000, -900, 90, 280, 120, 130, false);
      // walls of casks: on their sides, two high, in cradles
      const casks = (x, y, n, along) => { for (let k = 0; k < n; k++) for (let lv = 0; lv < 2; lv++) { if (lv && k === n - 1) continue; const p = (k - (n - 1) / 2) * 190 + lv * 95, cx = x + (along ? p : 0), cy = y + (along ? 0 : p), z = 90 + lv * 160; Cyl(V(cx, cy, z), 176, 240, oak, false, false, along ? AY : AX); for (const g of [-80, 80]) Cyl(V(cx + (along ? 0 : g), cy + (along ? g : 0), z), 186, 10, hoop, false, false, along ? AY : AX); } const len = n * 190; hit(x, y, 0, along ? len : 240, along ? 240 : len, 330, true); deco(x, y, 0, along ? len : 200, along ? 200 : len, 14, hoop); };
      for (const s of [-1, 1]) { casks(s * 3400, s * 1700, 6, false); casks(s * 3400, -s * 1500, 5, false); casks(s * 1000, s * 2600, 6, true); casks(-s * 1200, s * 2600 + s * 500, 5, true); casks(s * 3000, s * 3300, 4, true); casks(-s * 3200, s * 3300, 4, true); }
      // sacks of grain, a mash paddle rack, bottles in crates
      for (const s of [-1, 1]) { for (const [dx, dy, a] of [[0, 0, 0], [110, 20, 30], [50, 100, -20], [60, 40, 10]]) Box(V(s * 4200 + dx - 60, -s * 300 + dy, 30 + (a === 10 ? 56 : 0)), V(150, 90, 56), 0xa89a6a, a !== 10, false, a); hit(s * 4200, -s * 300, 0, 260, 200, 60, true);
        crate(s * 2200, -s * 3300, 0, 110); crate(s * 2330, -s * 3340, 0, 90); for (let q = 0; q < 4; q++) Cyl(V(s * 2200 - 30 + (q % 2) * 50, -s * 3300 - 20 + (q > 1 ? 44 : 0), 124), 18, 30, 0x2a5a3a, false, false); P.rack(-s * 4200, s * 2600, false, oak); P.table(-s * 2600, -s * 3400, true, 300, oak); }
    }),

  // ------------------------------------------------------------------------------------------------ TOY WORKSHOP
  // A toymaker's shop, at a toymaker's scale gone wrong: the blocks are waist high and the jack-in-the-box is a tower.
  // A toy railway loops the room, the dolls' house fills the middle, and tin soldiers stand in files to hide behind.
  mk(TH('Toy Workshop', 0x2a2420, 0x362e28, 0x40362e, 0xd8b04a, 0xff9ad0, [1, 0.85, 0.8], 0x221a18, [0.64, 0.56, 0.54]), [4600, 4600, 1500], { panel: 'shelf', hang: 'cloth', corner: 'crates', c1: 0x5a3e26, c2: 0xc8402a, glow: 0x3a8ad0, n: 14 },
    ({ hx, hy, H, T, Box, BoxRot, Cyl, Oct, Glow, Ball, ConeShape, Pyramid, slabs, tile, plat, solid, deco, hit, tall, L, AX, AY, P }) => {
      const red = 0xc8402a, blue = 0x3a7ac8, yel = 0xe8c040, green = 0x4a9a4a, wood = 0x8a6a3a, white = 0xe8e0d0, cols = [red, blue, yel, green];
      slabs(480, T.floor, T.floor2, 0x1a1512);
      // the dolls' house: open-fronted, two floors you can see into, a pitched roof
      plat(0, 0, 1500, 900, 40, wood, 0x5a4a2a);
      for (const e of [-1, 1]) solid(e * 700, 0, 40, 60, 800, 620, white, false); solid(0, 380, 40, 1400, 50, 620, white, false); deco(0, 0, 40 + 300, 1400, 800, 26, wood); deco(0, 0, 40 + 620, 1500, 900, 30, red);
      for (const e of [-1, 1]) BoxRot(V(0, e * 230, 40 + 790), V(1500, 560, 30), red, R(e * -35, 0, 0), false); for (const x of [-350, 350]) { deco(x, 404, 40 + 120, 150, 8, 150, blue); deco(x, 404, 40 + 420, 150, 8, 150, blue); }
      P.table(-350, 0, true, 200, wood, 40); P.bed(350, 100, true, 0xd87a9a, 40 + 326); hit(0, 380, 40, 1400, 60, 620, true); L(0, -100, 560, T.lamp, 2400, 3); tall(0, 0, 1000);
      // the railway: a loop of track round the house, and the train stopped on it
      for (let q = 0; q < 40; q++) { const a = q / 40 * 6.283, r = 2100; Box(V(Math.cos(a) * r, Math.sin(a) * r * 0.86, 3), V(260, 40, 6), wood, false, false, a * 57.3); } for (const dr of [-80, 80]) for (let q = 0; q < 40; q++) { const a = q / 40 * 6.283, r = 2100 + dr; Box(V(Math.cos(a) * r, Math.sin(a) * r * 0.86, 8), V(16, 340 + dr * 0.1, 6), 0x8a8e96, false, false, a * 57.3); }
      const car = (x, y, c, eng) => { solid(x, y, 30, 180, 320, 110, c, false); for (const a of [-1, 1]) for (const e of [-1, 1]) Cyl(V(x + e * 96, y + a * 100, 40), 80, 16, 0x2a2420, false, false, AX); if (eng) { Cyl(V(x, y + 60, 190), 130, 200, 0x2a2420, false, false, AY); Cyl(V(x, y + 120, 290), 50, 80, 0x2a2420, false, false); deco(x, y - 100, 140, 180, 120, 130, c); } else deco(x, y, 140, 150, 280, 50, yel); hit(x, y, 0, 190, 320, eng ? 270 : 180, true); };
      car(2100, 300, red, true); car(2100, -80, blue, false); car(2080, -440, green, false);
      // building blocks, waist high, some stacked; a ball; a top
      for (const [x, y, n, c] of [[-1500, 1700, 3, 0], [1500, -1700, 3, 1], [-2900, -500, 2, 2], [2900, 1500, 2, 3], [-700, -2900, 3, 1], [700, 2900, 2, 0], [-3600, 2600, 3, 3], [3600, -2600, 3, 2]]) { for (let k = 0; k < n; k++) { const bx = x + (k % 2) * 130 - (k > 1 ? 60 : 0), by = y + (k === 1 ? 20 : 0), z = k > 1 ? 120 : 0; solid(bx, by, z, 120, 120, 120, cols[(c + k) % 4], z === 0); deco(bx, by - 61, z + 30, 60, 4, 60, white); } }
      for (const s of [-1, 1]) { Ball(V(s * 1300, s * 3300, 110), V(220, 220, 220), cols[s > 0 ? 0 : 1]); deco(s * 1300, s * 3300, 100, 224, 224, 24, white); hit(s * 1300, s * 3300, 0, 180, 180, 210, true); ConeShape(V(-s * 3300, s * 1100, 90), V(240, 240, 180), yel, false, R(180, 0, 0)); Cyl(V(-s * 3300, s * 1100, 190), 240, 30, red, false, false); Cyl(V(-s * 3300, s * 1100, 250), 30, 110, wood, false, false); hit(-s * 3300, s * 1100, 0, 190, 190, 200, true); }
      // tin soldiers in files, and the jack-in-the-box in two corners
      const soldier = (x, y) => { solid(x, y, 0, 80, 60, 14, green, false); deco(x - 18, y, 14, 26, 30, 90, blue); deco(x + 18, y, 14, 26, 30, 90, blue); deco(x, y, 104, 76, 40, 70, red); Ball(V(x, y, 196), V(44, 44, 48), 0xe8b08a); deco(x, y, 216, 48, 48, 50, 0x1a1a1a); deco(x + 46, y, 110, 8, 8, 170, 0x8a8e96); hit(x, y, 0, 80, 50, 240, false); };
      for (const s of [-1, 1]) { for (let q = -2; q <= 2; q++) { soldier(s * 600 + q * 150, -s * 1650); soldier(-s * 3000 + q * 150, s * 3600); } hit(s * 600, -s * 1650, 0, 700, 60, 110, true); hit(-s * 3000, s * 3600, 0, 700, 60, 110, true);
        const jx = s * 3700, jy = s * 3500; solid(jx, jy, 0, 300, 300, 300, cols[s > 0 ? 1 : 3]); for (const e of [-1, 1]) deco(jx + e * 151, jy, 60, 4, 180, 180, yel); BoxRot(V(jx, jy + 170, 420), V(300, 300, 16), red, R(-50, 0, 0), false); for (let k = 0; k < 6; k++) Cyl(V(jx, jy, 320 + k * 44), 110 - (k % 2) * 30, 14, 0x8a8e96, false, false); Ball(V(jx, jy, 640), V(170, 170, 180), white); ConeShape(V(jx, jy, 790), V(150, 150, 180), red); Ball(V(jx, jy - 80, 640), V(40, 30, 40), red); tall(jx, jy, 420);
        P.table(-s * 3700, -s * 300, false, 380, wood); for (let q = -1; q <= 1; q++) Box(V(-s * 3700, -s * 300 + q * 100, 92), V(44, 44, 28), cols[q + 1], false, false, q * 20); }
    }),
];
