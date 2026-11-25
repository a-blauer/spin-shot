// The Descent: twenty rooms, one after another, each its own arena. Nothing here is a town to hold: you clear the
// room you are in, take what it pays, and pick the next door by what is behind it. Every fifth room is a boss's.
// All twenty are built once, far apart on one grid, and the run moves the players between them.
import { V, V2, R } from './mapkit.js';
import { craftRoom, craftBoss, ROOM_DIMS, BOSS_DIMS, EXTRA } from './descent_rooms.js';
import * as SH from './descent_shapes.js';

// each theme: floor, inlay, wall, trim, glow, lamp colour, fog, shadow tint
export const THEMES = [
  { name: 'Ossuary', title: 'The Ossuary', floor: 0x1a2226, floor2: 0x243038, wall: 0x2e3a40, trim: 0x8a8468, glow: 0x3ad8b8, lamp: [0.35, 1.0, 0.85], fog: 0x0e2a28, sh: [0.4, 0.58, 0.56] },
  { name: 'Cinder Works', floor: 0x241a16, floor2: 0x33221a, wall: 0x3c2a22, trim: 0x6a6e76, glow: 0xff7a2a, lamp: [1.0, 0.55, 0.2], fog: 0x3a1c10, sh: [0.66, 0.48, 0.42] },
  { name: 'Rime Vault', floor: 0x1c2630, floor2: 0x2a3a48, wall: 0x3a4c5c, trim: 0xc9d6e0, glow: 0x7ad0ff, lamp: [0.5, 0.8, 1.0], fog: 0x18303e, sh: [0.46, 0.6, 0.8] },
  { name: 'Mire Cellar', floor: 0x18201a, floor2: 0x243024, wall: 0x2c3a2c, trim: 0x6a5a3a, glow: 0x8aff5a, lamp: [0.6, 1.0, 0.4], fog: 0x1a2c16, sh: [0.48, 0.62, 0.44] },
  { name: 'Deep Station', floor: 0x2c2823, floor2: 0x3a342c, wall: 0x443a30, trim: 0x5a5e66, glow: 0xffe6a0, lamp: [1.0, 0.86, 0.6], fog: 0x241e16, sh: [0.62, 0.56, 0.48] },
  { name: 'Drowned Hall', floor: 0x122024, floor2: 0x1a3038, wall: 0x22404a, trim: 0xb8923a, glow: 0x3aa8ff, lamp: [0.3, 0.7, 1.0], fog: 0x0c2434, sh: [0.38, 0.54, 0.74] },
  { name: 'The Hive', title: 'The Hive', floor: 0x221c10, floor2: 0x332a14, wall: 0x40341a, trim: 0x8a6a2a, glow: 0xffb020, lamp: [1.0, 0.75, 0.2], fog: 0x30260c, sh: [0.64, 0.56, 0.36] },
  { name: 'Null Chamber', floor: 0x18141f, floor2: 0x261e33, wall: 0x30263f, trim: 0x8a7ab8, glow: 0xc58cff, lamp: [0.75, 0.5, 1.0], fog: 0x1e1430, sh: [0.54, 0.46, 0.76] },
];
for (const r of EXTRA) THEMES.push(r.theme);
// the air of each room: which bed of room tone plays there
const BEDS = { S_AmbFire: ['Cinder Works', 'Magma Chamber', 'Feast Hall'], S_AmbWater: ['Mire Cellar', 'Drowned Hall', 'Sunken Library', 'Sewer Junction', 'The Bathhouse', 'The Cistern', 'Glasshouse'],
  S_AmbMachine: ['Clockwork Hall', 'Pump Station', 'Meat Locker', 'The Warehouse', 'The Scrapyard', 'Apothecary', 'The Distillery', 'Deep Station'], S_AmbCave: ['Crystal Cavern', 'Fungal Grotto', 'Salt Mine', 'Webbed Den', 'The Hive'],
  S_AmbWind: ['Rime Vault', 'Null Chamber'] };
export function bedOf(arena) { if (arena === N_ROOMS + 1) return 'S_AmbWind'; const T = THEMES[arena]; if (!T) return 'S_AmbStone'; for (const k of Object.keys(BEDS)) if (BEDS[k].includes(T.name)) return k; return 'S_AmbStone'; }
const BOSS_NAMES = ['The Seal', 'The Bottom'];
const up = (h, k) => { const r = Math.min(255, Math.round(((h >> 16) & 255) * k)), g = Math.min(255, Math.round(((h >> 8) & 255) * k)), b = Math.min(255, Math.round((h & 255) * k)); return (r << 16) | (g << 8) | b; };
for (const T of THEMES) { T.floor = up(T.floor, 1.35); T.floor2 = up(T.floor2, 1.5); T.wall = up(T.wall, 1.3); T.roof = up(T.wall, 0.45); }
const SP = 13200, COLS = 7;
export const N_ROOMS = ROOM_DIMS.length;
// filled in as the arenas are built: { c: [x, y], hx, hy, H, zone, theme, boss, plinths }
export const ARENAS = [];
// Where things stand in a room, given which end you came in by (s = 1: in at the south, out at the north; -1 the other way).
export function spots(A, s) {
  const [cx, cy] = A.c, hy = A.hy, hx = A.hx;
  return { spawn: [cx, cy - s * (hy - 320)], yaw: s > 0 ? Math.PI : 0, exit: [cx, cy + s * (hy - 110)], textYaw: s > 0 ? -90 : 90,
    box: [cx + 2300, cy + s * (hy - 170)], bench: [cx - 900, cy + s * (hy - 12)], benchYaw: s > 0 ? -90 : 90, chest: [cx + 760, cy + s * (hy - 190)], chestYaw: s > 0 ? -90 : 90,
    ammo: [cx + 700, cy - s * (hy - 110)], ammoYaw: s > 0 ? 90 : -90, guns: [[cx - hx + 8, cy - s * 500, 0], [cx + hx - 8, cy + s * 500, 180]] };
}

export function buildDescent(M) {
  const { Box, BoxRot, Glow, Cyl, Oct, Ball, ConeShape, Pyramid, Ring, Floor, Lamp, SpawnAt, AddZone, GM } = M;
  const rowsN = Math.ceil((N_ROOMS + 2) / COLS);
  GM.navInit(-6400, -6400, (COLS - 1) * SP + 6400, (rowsN - 1) * SP + 6400, 100);
  const brazier = (x, y, T, h = 150) => { Cyl(V(x, y, h / 2), 70, h, T.trim, true, true); Cyl(V(x, y, h + 8), 110, 16, T.wall, false, false); Glow(V(x, y, h + 34), V(60, 60, 44), T.glow, 2); Lamp(V(x, y, h + 90), { r: T.lamp[0], g: T.lamp[1], b: T.lamp[2] }, 2.2, 1500, false); };
  // ---- what makes each room its own place. Almost none of it collides: it is on the walls, hung from the roof, laid on
  // the floor or heaped in the corners, clear of the doors, the wall guns and the bench end of the room.
  let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }, rr = (a, b) => a + rnd() * (b - a);
    const dress = (th, hx, hy, H, T, boss, C) => {
    const k = hx / 3400, flat = R(90, 0, 0), ys = [0];
    for (let y = 1150; y < hy - 420; y += 560) ys.push(y, -y);   // bays along the side walls, clear of the two wall guns
    const clear = (x, y, pad = 160) => !(C.avoid && C.avoid(x, y)) && !C.tall.some((t) => Math.hypot(x - t[0], y - t[1]) < t[2] + pad);
    const corners = (fn) => { if (C.noCorners) return; for (const sx of [-1, 1]) for (const sy of [-1, 1]) fn(sx * (hx - 520), sy * (hy - 620), sx, sy); };
    const hang = (x, y, len, col, d = 10) => Cyl(V(x, y, H - len / 2), d, len, col, false, false), drop = (a, b) => Math.min(rr(a, b), H * 0.42);
    const roofSpots = (n, fn) => { n = Math.round(n * (hx * hy) / (3400 * 3000)); for (let i = 0; i < n; i++) { const x = rr(-hx + 500, hx - 500), y = rr(-hy + 700, hy - 700); if (clear(x, y)) fn(x, y); } };
    if ([1, 2, 6, 7].includes(th)) corners((x, y) => M.Solid(V(x, y, [140, 260, 110, 300][[1, 2, 6, 7].indexOf(th)]), V(th === 7 ? 300 : 460, th === 7 ? 300 : 460, [280, 520, 220, 600][[1, 2, 6, 7].indexOf(th)]), true));
        if (th >= 8) { dressWall(EXTRA[th - 8].wall || {}, { hx, hy, H, T, ys, corners, roofSpots, hang, drop }); return; }
    switch (th) {
      case 0: {   // OSSUARY: walls of skulls, bone heaps, coffins, cages on chains, candles
        const bone = 0xd8cfb8, dark = 0x0e1214;
        for (const sx of [-1, 1]) for (const y of ys) { Box(V(sx * (hx - 3), y, 400), V(6, 330, 520), dark, false, false); for (let r = 0; r < 3; r++) for (let c = -1; c <= 1; c++) { Ball(V(sx * (hx - 24), y + c * 100, 230 + r * 160), V(64, 60, 70), bone); Glow(V(sx * (hx - 50), y + c * 100 - 12, 236 + r * 160), V(6, 10, 10), T.glow, 2); Glow(V(sx * (hx - 50), y + c * 100 + 12, 236 + r * 160), V(6, 10, 10), T.glow, 2); } Box(V(sx * (hx - 10), y, 132), V(20, 360, 16), T.trim, false, false); Box(V(sx * (hx - 10), y, 668), V(20, 360, 16), T.trim, false, false); }
        corners((x, y) => { for (let i = 0; i < 16; i++) { const a = rnd() * 6.28, r = rnd() * 260; if (rnd() < 0.4) Ball(V(x + Math.cos(a) * r, y + Math.sin(a) * r, 26 + rnd() * 60), V(60, 56, 64), bone); else BoxRot(V(x + Math.cos(a) * r, y + Math.sin(a) * r, 14 + rnd() * 50), V(rr(90, 170), 16, 16), bone, R(rr(-20, 20), rr(0, 180), 0), false); } });
        for (const sx of [-1, 1]) for (const y of [ys[1], ys[7]]) { Box(V(sx * (hx - 190), y, 60), V(230, 520, 120), T.wall, true, true); Box(V(sx * (hx - 190), y, 130), V(260, 550, 24), T.trim, false, false); Box(V(sx * (hx - 190), y, 146), V(60, 340, 10), bone, false, false); Box(V(sx * (hx - 190), y + 80, 146), V(180, 50, 10), bone, false, false); }
        roofSpots(boss ? 14 : 8, (x, y) => { const L = rr(180, 420); hang(x, y, L, 0x2a2e30); Box(V(x, y, H - L - 70), V(110, 110, 140), 0x1a1e20, false, false); Ball(V(x, y, H - L - 80), V(56, 52, 60), bone); });
        for (const sx of [-1, 1]) for (const y of ys) for (const d of [-200, 200]) { Cyl(V(sx * (hx - 60), y + d, 20), 16, 40, bone, false, false); Glow(V(sx * (hx - 60), y + d, 50), V(12, 12, 22), 0xffc86a, 3); }
        
        break; }
      case 1: {   // CINDER WORKS: pipes, furnace mouths, slag channels, chimneys, coal
        const iron = 0x3a3e46, hot = 0xff6a1a;
        for (const sx of [-1, 1]) { for (const z of [260, 720]) { Box(V(sx * (hx - 50), 0, z), V(70, hy * 2 - 300, 70), iron, false, false); for (let y = -hy + 500; y < hy; y += 700) Box(V(sx * (hx - 50), y, z), V(96, 40, 96), T.trim, false, false); } for (const y of ys) { Box(V(sx * (hx - 6), y, 240), V(12, 300, 360), 0x120a08, false, false); Glow(V(sx * (hx - 14), y, 210), V(8, 220, 240), hot, 0); for (const d of [-90, 0, 90]) Box(V(sx * (hx - 22), y + d, 240), V(10, 18, 360), iron, false, false); Box(V(sx * (hx - 30), y, 440), V(60, 340, 40), iron, false, false); } Glow(V(sx * (hx - 760), 0, 3), V(90, hy * 2 - 1500, 4), hot, 0); Box(V(sx * (hx - 815), 0, 5), V(20, hy * 2 - 1500, 10), iron, false, false); Box(V(sx * (hx - 705), 0, 5), V(20, hy * 2 - 1500, 10), iron, false, false); }
        roofSpots(8, (x, y) => { Cyl(V(x, y, H - 160), 220, 320, iron, false, false); Cyl(V(x, y, H - 330), 260, 30, T.trim, false, false); Glow(V(x, y, H - 348), V(180, 180, 6), hot, 1); });
        corners((x, y) => { for (let i = 0; i < 5; i++) { const px = x + rr(-200, 200), py = y + rr(-200, 200), z = rr(120, 260); Pyramid(V(px, py, z / 2), V(z * 1.6, z * 1.6, z), 0x15151a); Glow(V(px + rr(-30, 30), py + rr(-30, 30), z * 0.45), V(18, 18, 10), hot, 2); } });
        for (let i = 0; i < 6; i++) { const y = -hy + 900 + i * ((hy * 2 - 1800) / 5); Box(V(0, y, H - 200), V(hx * 2 - 400, 40, 40), iron, false, false); for (const x of [-2200, -700, 900, 2300]) { hang(x * k, y, 300, iron, 8); Box(V(x * k, y, H - 520), V(90, 90, 60), iron, false, false); Glow(V(x * k, y, H - 556), V(60, 60, 10), hot, 0); } }
        break; }
      case 2: {   // RIME VAULT: icicles, drifts, ice spires, frozen lamps
        const ice = 0xbfe6ff, snow = 0xe8f2f8, deep = 0x5aa0d0;
        roofSpots(46, (x, y) => { const L = rr(120, 460); ConeShape(V(x, y, H - L / 2), V(rr(40, 90), rr(40, 90), L), rnd() < 0.3 ? deep : ice, false, R(180, 0, 0)); });
        for (const sx of [-1, 1]) { for (let y = -hy + 300; y < hy - 200; y += 380) Ball(V(sx * (hx - 60), y + rr(-80, 80), 10), V(rr(300, 520), rr(420, 640), rr(120, 260)), snow); for (const y of ys) { for (let c = 0; c < 4; c++) { const h = rr(260, 620); Pyramid(V(sx * (hx - rr(60, 220)), y + rr(-160, 160), h / 2), V(rr(70, 130), rr(70, 130), h), c % 2 ? ice : deep, R(rr(-8, 8), rr(0, 90), rr(-8, 8))); } Glow(V(sx * (hx - 8), y, 520), V(6, 120, 220), 0xdff6ff, 0); } }
        corners((x, y) => { for (let i = 0; i < 6; i++) { const h = rr(300, 760); Pyramid(V(x + rr(-240, 240), y + rr(-240, 240), h / 2), V(rr(110, 200), rr(110, 200), h), i % 2 ? ice : deep, R(rr(-10, 10), rr(0, 90), rr(-10, 10))); } Ball(V(x, y, 0), V(760, 760, 200), snow); });
        for (let i = 0; i < 26; i++) { const x = rr(-hx + 300, hx - 300), y = rr(-hy + 600, hy - 600), w = rr(160, 420); Floor(V2(x - w, y - w * 0.6), V2(x + w, y + w * 0.6), 2.4, i % 3 ? 0x9fc4dc : snow); }
        break; }
      case 3: {   // MIRE CELLAR: hanging roots, glowing fungus, pools, barrels, moss
        const root = 0x3a2a1c, moss = 0x3f6a2c, cap = 0x8a3a2a, slime = 0x7aff5a;
        roofSpots(60, (x, y) => { const L = drop(140, 620); hang(x, y, L, root, rr(8, 22)); if (rnd() < 0.45) Glow(V(x, y, H - L - 12), V(26, 26, 26), slime, 2); });
        for (let i = 0; i < 16; i++) { const x = rr(-hx + 500, hx - 500), y = rr(-hy + 800, hy - 800), d = rr(260, 620); Cyl(V(x, y, 1.5), d, 3, 0x1e4a1e, false, false); Glow(V(x, y, 3.5), V(d * 0.18, d * 0.14, 2), slime, 1); }
        for (let i = 0; i < 34; i++) { const x = rr(-hx + 200, hx - 200), y = rr(-hy + 500, hy - 500), w = rr(140, 380); Floor(V2(x - w, y - w * 0.7), V2(x + w, y + w * 0.7), 2.2, moss); }
        for (const sx of [-1, 1]) for (const y of ys) { for (let c = 0; c < 5; c++) { const px = sx * (hx - rr(50, 240)), py = y + rr(-190, 190), h = rr(60, 240), w = h * rr(0.9, 1.6); Cyl(V(px, py, h / 2), w * 0.22, h, 0xd8cfa8, false, false); ConeShape(V(px, py, h + w * 0.22), V(w, w, w * 0.5), c % 2 ? cap : 0x6a7a2a); Glow(V(px, py, h - 4), V(w * 0.8, w * 0.8, 4), slime, 1); } Box(V(sx * (hx - 3), y, 380), V(6, 260, 560), moss, false, false); for (let v = 0; v < 4; v++) Box(V(sx * (hx - 8), y + rr(-200, 200), H - rr(200, 500)), V(10, 14, rr(300, 800)), root, false, false); }
        corners((x, y) => { for (let i = 0; i < 4; i++) { const bx = x + rr(-220, 220), by = y + rr(-220, 220); Cyl(V(bx, by, 80), 120, 160, 0x5a3e26, true, true); Cyl(V(bx, by, 40), 126, 12, 0x2a2420, false, false); Cyl(V(bx, by, 120), 126, 12, 0x2a2420, false, false); } });
        break; }
      case 4: {   // DEEP STATION: timber cribbing up the walls, gas lamps on brackets, the line's boards
        const timber = 0x4a3626, tdark = 0x2e2218, iron = 0x3a3e46;
        for (const sx of [-1, 1]) {
          for (const z of [300, 760]) Box(V(sx * (hx - 8), 0, z), V(16, hy * 2 - 200, 50), timber, false, false);
          for (let y = -hy + 280; y < hy - 200; y += 560) Box(V(sx * (hx - 10), y, (H - 180) / 2), V(20, 60, H - 180), tdark, false, false);
          for (const y of ys) {
            Box(V(sx * (hx - 40), y, 520), V(80, 16, 16), iron, false, false); Box(V(sx * (hx - 76), y, 500), V(34, 34, 50), iron, false, false); Glow(V(sx * (hx - 76), y, 500), V(22, 22, 34), 0xffe6a0, 0);
            if (Math.abs(y) > 1000 && Math.round(y / 560) % 2) { Box(V(sx * (hx - 6), y + 280, 400), V(12, 300, 180), 0xd8c8a0, false, false); Box(V(sx * (hx - 5), y + 280, 400), V(12, 330, 210), tdark, false, false); for (let q = 0; q < 4; q++) Box(V(sx * (hx - 13), y + 280, 340 + q * 38), V(4, 240 - q * 30, 10), tdark, false, false); }
          }
        }
        corners((x, y) => { for (const [dx, dy, sz] of [[-80, -60, 120], [70, 40, 110], [-30, 90, 100]]) { Box(V(x + dx, y + dy, sz / 2), V(sz, sz, sz), 0x6a4e30, true, true); Box(V(x + dx, y + dy, sz - 6), V(sz + 6, sz + 6, 12), tdark, false, false); Box(V(x + dx, y + dy, 6), V(sz + 6, sz + 6, 12), tdark, false, false); } });
        break; }
      case 5: {   // DROWNED HALL: weed, coral, barnacles, chains and hooks, portholes, standing water
        const weed = 0x2a6a4a, coral = [0xd86a7a, 0xe8a04a, 0x9a6ad8], brass = 0xb8923a;
        for (let i = 0; i < 22; i++) { const x = rr(-hx + 400, hx - 400), y = rr(-hy + 700, hy - 700), d = rr(300, 900); Cyl(V(x, y, 1.5), d, 3, 0x163e5a, false, false); Glow(V(x, y, 3.5), V(d * 0.2, d * 0.12, 2), 0x3aa8ff, 1); }
        for (const sx of [-1, 1]) for (const y of ys) { for (let c = 0; c < 6; c++) { const h = rr(220, 640); BoxRot(V(sx * (hx - rr(40, 300)), y + rr(-200, 200), h / 2), V(rr(16, 34), 8, h), c % 2 ? weed : 0x3a8a5a, R(rr(-12, 12), rr(0, 180), rr(-12, 12)), false); } for (let c = 0; c < 4; c++) { const px = sx * (hx - rr(60, 260)), py = y + rr(-180, 180), h = rr(80, 220); Pyramid(V(px, py, h / 2), V(h * 0.7, h * 0.7, h), coral[c % 3], R(rr(-14, 14), rr(0, 90), rr(-14, 14))); Ball(V(px + 40, py + 30, 30), V(70, 70, 60), coral[(c + 1) % 3]); } Cyl(V(sx * (hx - 8), y, 520), 200, 16, brass, false, false, flat); Glow(V(sx * (hx - 18), y, 520), V(8, 140, 140), 0x7ad0ff, 0); for (let b = 0; b < 7; b++) Ball(V(sx * (hx - 8), y + rr(-220, 220), rr(120, 760)), V(26, rr(40, 80), rr(40, 80)), 0xb8b8a8); }
        roofSpots(16, (x, y) => { const L = rr(260, 600); hang(x, y, L, 0x3a3e46, 12); Box(V(x, y, H - L - 20), V(60, 14, 50), brass, false, false); Box(V(x + 22, y, H - L - 50), V(14, 14, 50), brass, false, false); });
        corners((x, y) => { for (let i = 0; i < 3; i++) Box(V(x + rr(-220, 220), y + rr(-220, 220), 80 + i * 20), V(170, 170, 160), 0x5a4630, true, true, rr(0, 45)); Cyl(V(x, y, 60), 130, 120, 0x4a3a2a, false, false); });
        for (let i = 0; i < 5; i++) { const y = -hy + 800 + i * ((hy * 2 - 1600) / 4); for (const sx of [-1, 1]) { BoxRot(V(sx * (hx - 260), y, H - 330), V(60, 60, 760), 0x3a2c20, R(0, 0, sx * 38), false); } Box(V(0, y, H - 60), V(hx * 2 - 900, 70, 70), 0x3a2c20, false, false); }
        break; }
      case 6: {   // THE HIVE: comb on every wall, wax hanging from the roof, honey on the floor, brood in the corners
        const wax = 0xd8a030, dark = 0x5a3a10, honey = 0xffb020;
        for (const sx of [-1, 1]) for (let y = -hy + 260, c = 0; y < hy - 200; y += 240, c++) { if (Math.abs(Math.abs(y) - 500) < 330) continue; for (let r = 0; r < 4; r++) { const z = 190 + r * 205 + (c % 2 ? 100 : 0), lit = rnd() < 0.3; Cyl(V(sx * (hx - 10), y, z), 220, 20, dark, false, false, flat); (lit ? Glow : Cyl)(V(sx * (hx - 22), y, z), lit ? V(8, 160, 160) : 170, lit ? honey : 8, lit ? 0 : wax, false, false, flat); } }
        roofSpots(40, (x, y) => { const L = rr(100, 520), w = rr(50, 130); ConeShape(V(x, y, H - L / 2), V(w, w, L), wax, false, R(180, 0, 0)); if (rnd() < 0.35) Glow(V(x, y, H - L - 14), V(30, 30, 40), honey, 2); });
        for (let i = 0; i < 20; i++) { const x = rr(-hx + 400, hx - 400), y = rr(-hy + 700, hy - 700), d = rr(240, 700); Cyl(V(x, y, 1.5), d, 3, 0x9a6410, false, false); Glow(V(x, y, 3.5), V(d * 0.2, d * 0.16, 2), honey, 1); }
        for (let i = 0; i < 60; i++) { const x = rr(-hx + 200, hx - 200), y = rr(-hy + 500, hy - 500); Oct(V(x, y, 1.5), V(230, 230, 3), i % 3 ? dark : wax, false, false); }
        corners((x, y) => { for (let i = 0; i < 9; i++) { const s = rr(120, 260); Ball(V(x + rr(-260, 260), y + rr(-260, 260), s * 0.4), V(s, s, s * 1.25), 0xe8dcb8); } for (let i = 0; i < 4; i++) Glow(V(x + rr(-200, 200), y + rr(-200, 200), rr(60, 160)), V(40, 40, 50), honey, 2); });
        break; }
      default: {   // NULL CHAMBER: monoliths, drifting blocks, rings of script in the floor, stars in the roof
        const voidc = 0x0c0a14, pur = T.glow;
        for (const sx of [-1, 1]) for (const y of ys) { const h = rr(520, H - 120); Box(V(sx * (hx - 90), y, h / 2), V(120, 200, h), voidc, false, false); Glow(V(sx * (hx - 156), y, h * 0.55), V(6, 26, h * 0.7), pur, 0); for (let g = 0; g < 5; g++) Glow(V(sx * (hx - 156), y + rr(-70, 70), rr(80, h - 80)), V(6, rr(30, 70), 14), 0xffffff, 0); }
        
        for (let i = 0; i < 40; i++) { const a = rnd() * 6.283, r = rr(500, 2500) * k; Glow(V(Math.cos(a) * r, Math.sin(a) * r, 3), V(rr(40, 120), 14, 2), i % 4 ? pur : 0xffffff, 0, R(0, rr(0, 180), 0)); }
        roofSpots(boss ? 120 : 70, (x, y) => Glow(V(x, y, H - 8), V(rr(8, 22), rr(8, 22), 6), rnd() < 0.3 ? pur : 0xffffff, 2));
        corners((x, y) => { const h = rr(500, 800); Pyramid(V(x, y, h / 2), V(300, 300, h), voidc); Glow(V(x, y, h + 30), V(50, 50, 50), pur, 2); Glow(V(x, y, 2.6), V(420, 420, 2), pur, 0); });
        break; }
    }
  };
  // The later rooms dress their walls from a small set of motifs, each in the room's own colours:
  //   panel: what stands in each bay of the side walls    hang: what comes down from the roof    corner: what is heaped there
  const dressWall = (W, D) => {
    const { hx, hy, H, T, ys, corners, roofSpots, hang, drop } = D, c1 = W.c1 || T.trim, c2 = W.c2 || T.floor2, gl = W.glow || T.glow, top = Math.min(H - 220, 760), dk = 0x0c0e10, FL = R(90, 0, 0);
    const cave = W.panel === 'none';
    for (const sx of [-1, 1]) {
      const X = (d) => sx * (hx - d), B = (d, y, z, w, h, col, t = d * 2) => Box(V(X(d), y, z), V(t, w, h), col, false, false);
      if (W.rail !== false) for (const z of [W.railZ || 200, top + 40]) Box(V(X(6), 0, z), V(12, hy * 2 - 200, 30), c1, false, false);
      // between the bays: a pilaster with a cap and a sconce (rooms cut from the rock get buttresses of it instead)
      const mids = []; for (let y = 870; y < hy - 300; y += 560) mids.push(y, -y);
      for (const y of mids) {
        if (cave) { const h = rr(260, 560), w = rr(260, 420); Oct(V(X(40), y, h / 2), V(150, w, h), c2, false, false); Oct(V(X(30), y + rr(-120, 120), h * 0.3), V(190, w * 0.7, h * 0.6), c1, false, false); ConeShape(V(X(70), y + rr(-160, 160), rr(80, 150)), V(90, 90, rr(180, 320)), c2); if (rnd() < 0.5) Glow(V(X(96), y, rr(120, 300)), V(16, 16, 22), gl, 2); continue; }
        B(9, y, (top + 80) / 2, 70, top + 80, T.floor2); B(13, y, 50, 96, 100, c1); B(13, y, top + 96, 96, 34, c1); B(20, y, top + 60, 40, 16, c1, 40); B(26, y, 470, 20, 40, 0x2a2e30, 52); Glow(V(X(50), y, 500), V(22, 22, 34), gl, 2);
      }
      // a line of dentils under the upper rail
      if (!cave) for (let y = -hy + 160; y < hy - 100; y += 140) B(8, y, top + 10, 60, 22, c1);
      for (const y of ys) switch (W.panel) {
        case 'niche': B(4, y, top / 2 + 60, 300, top - 60, dk, 8); B(10, y, 90, 350, 24, c1); B(10, y, top + 6, 350, 24, c1); for (const d of [-162, 162]) B(10, y + d, top / 2 + 48, 26, top - 60, c1); Pyramid(V(X(10), y, top + 60), V(20, 350, 90), c1);
          B(30, y, 122, 110, 40, c2, 60); Cyl(V(X(34), y, 190), 60, 100, c2, false, false); Ball(V(X(34), y, 250), V(84, 84, 70), c2); Cyl(V(X(34), y, 292), 40, 22, c1, false, false); for (const d of [-110, 110]) { Cyl(V(X(30), y + d, 120), 12, 40, 0xe8dcc0, false, false); Glow(V(X(30), y + d, 150), V(10, 10, 20), 0xffc86a, 3); } Glow(V(X(8), y, top - 110), V(4, 120, 120), gl, 1, FL); break;
        case 'window': B(5, y, top / 2 + 100, 270, top - 20, c1, 10); Glow(V(X(11), y, top / 2 + 90), V(4, 210, top - 110), gl, 0); Glow(V(X(11), y, top + 30), V(4, 210, 210), gl, 1, FL); for (const d of [-52, 52]) B(15, y + d, top / 2 + 100, 10, top - 100, c1, 8); for (const f of [0.3, 0.62]) B(15, y, 150 + (top - 100) * f, 210, 10, c1, 8); B(18, y, 132, 300, 22, c1, 36); B(12, y, 70, 240, 100, T.floor2, 20);
          Floor(V2(Math.min(X(60), X(520)), y - 100), V2(Math.max(X(60), X(520)), y + 100), 2.1, T.floor2); break;
        case 'pipes': for (const d of [-90, 0, 90]) { Cyl(V(X(26), y + d, H / 2), 34, H - 40, d ? c2 : c1, false, false); for (const z of [150, 420, top + 60]) Cyl(V(X(26), y + d, z), 52, 18, 0x2a2e30, false, false); } for (const z of [260, top]) B(26, y, z, 270, 26, c1, 52); Cyl(V(X(64), y, 330), 76, 14, 0xa02a22, false, false, FL); Cyl(V(X(66), y, 330), 20, 22, 0x2a2e30, false, false, FL);
          Cyl(V(X(60), y - 90, 560), 70, 12, 0x2a2e30, false, false, FL); Cyl(V(X(66), y - 90, 560), 56, 6, 0xe8e0d0, false, false, FL); B(70, y - 90, 572, 4, 26, 0xa02a22, 4); Glow(V(X(62), y + 90, 560), V(8, 26, 26), gl, 2); break;
        case 'banner': { const [k, b] = SH.banner(200, top - 200, c2, c1, { foot: 'tails', tip: 60, emblem: c1, finial: c1 }); M.Shape(k, b, V(X(24), y, top + 30), R(0, 90, 0)); break; }
        case 'shelf': for (let z = 150; z < top; z += 150) { B(36, y, z, 300, 12, c1, 70); for (let q = -2; q <= 2; q++) { const hh = 44 + ((q * q + z / 150) % 3) * 14, col = [c2, gl, 0x5a4630, c2, 0x3a3e46][(q + 2 + z / 150) % 5]; if ((q + z / 150) % 3 === 0) { Cyl(V(X(36), y + q * 56, z + 6 + hh / 2), 34, hh, col, false, false); Ball(V(X(36), y + q * 56, z + 10 + hh), V(26, 26, 20), c1); } else Box(V(X(36), y + q * 56, z + 6 + hh / 2), V(40, 36, hh), col, false, false); } } for (const d of [-156, 156]) B(36, y + d, top / 2 + 40, 12, top, c1, 70); B(36, y, top + 46, 330, 14, c1, 76); B(36, y, 60, 324, 120, c1, 70); for (const d of [-80, 80]) Ball(V(X(74), y + d, 76), V(14, 22, 14), 0xb8923a); break;
        case 'bars': B(4, y, top / 2 + 60, 300, top - 60, 0x08090a, 8); for (let d = -120; d <= 120; d += 40) Cyl(V(X(14), y + d, top / 2 + 60), 12, top - 60, c1, false, false); for (const z of [90, top / 2 + 60, top + 20]) B(14, y, z, 320, 20, c1, 16); B(16, y, top + 70, 110, 44, c2, 8); B(18, y, top + 70, 60, 8, c1, 6); B(22, y - 130, top / 2 + 40, 40, 60, 0x2a2e30, 14); break;
        case 'planks': for (let d = -140; d <= 140; d += 70) B(5, y + d, top / 2 + 60, 60, top - 20, d % 140 ? c2 : c1, 10); B(10, y, top + 40, 330, 26, c1, 12); BoxRot(V(X(12), y, top / 2 + 60), V(10, 26, Math.hypot(280, top - 60)), c1, R(0, 0, Math.atan2(280, top - 60) * 57.3), false); B(40, y, 440, 14, 14, 0x3a3e46, 80); B(76, y, 420, 26, 36, 0x3a3e46, 26); Glow(V(X(76), y, 420), V(20, 20, 28), gl, 0);
          B(14, y - 100, 250, 8, 170, 0x5a3e26, 8); B(16, y - 100, 150, 50, 60, 0x8a8e96, 6); for (let q = 0; q < 3; q++) Cyl(V(X(20), y + 80, 250 + q * 16), 90 - q * 8, 12, 0x3a2c20, false, false, FL); break;
        case 'arch': for (const d of [-150, 150]) { B(14, y + d, top / 2 + 20, 50, top + 40, c1, 28); B(18, y + d, 60, 70, 120, T.floor2, 36); B(18, y + d, top + 20, 70, 30, T.floor2, 36); } B(14, y, top + 60, 350, 44, c1, 28); B(20, y, top + 66, 70, 70, T.floor2, 40); B(4, y, top / 2 + 20, 250, top + 40, c2, 8); B(8, y, top / 2 - 40, 190, top - 120, dk, 6); Glow(V(X(10), y, top - 60), V(4, 90, 90), gl, 1, FL); B(16, y, 40, 250, 80, T.floor2, 30); break;
        case 'none': break;
        default: B(8, y, top / 2 + 40, 56, top + 80, c1);
      }
    }
    switch (W.hang) {
      case 'lamp': roofSpots(W.n || 10, (x, y) => { const Lh = drop(160, 360); hang(x, y, Lh, 0x2a2e30, 8); Cyl(V(x, y, H - Lh - 8), 120, 14, 0x2a2e30, false, false); Box(V(x, y, H - Lh - 40), V(50, 50, 50), 0x2a2e30, false, false); Glow(V(x, y, H - Lh - 44), V(34, 34, 40), gl, 0); }); break;
      case 'chain': roofSpots(W.n || 12, (x, y) => { const Lh = drop(200, 520), [k, b] = SH.chain(Lh - 14, 0x3a3e46); M.Shape(k, b, V(x, y, H - 10), R(0, rr(0, 90), 0)); Box(V(x, y, H - Lh - 24), V(46, 14, 48), c1, false, false); Box(V(x + 18, y, H - Lh - 56), V(12, 14, 40), c1, false, false); }); break;
      case 'spike': roofSpots(W.n || 40, (x, y) => { const Lh = drop(120, 460); ConeShape(V(x, y, H - Lh / 2), V(rr(40, 100), rr(40, 100), Lh), rnd() < 0.3 ? c1 : c2, false, R(180, 0, 0)); }); break;
      case 'vine': roofSpots(W.n || 46, (x, y) => { const Lh = drop(140, 600), sd = Math.round(rnd() * 5), base = Lh < 300 ? 240 : 480, [k, b] = SH.vine(base, c2, W.leaf || 0x3e5a2e, sd % 3); M.Shape(k, b, V(x, y, H), R(0, rr(0, 360), 0), 0xffffff, V(1, 1, Lh / base)); /* two lengths, stretched to fit */ if (rnd() < 0.4) Glow(V(x, y, H - Lh - 12), V(24, 24, 24), gl, 2); }); break;
      case 'cloth': roofSpots(W.n || 12, (x, y) => { const Lh = drop(200, 420), a = rnd() < 0.5, col = rnd() < 0.5 ? c1 : c2, [k, b] = SH.banner(220, Lh, col, col === c1 ? c2 : c1, { tip: 72 }); M.Shape(k, b, V(x, y, H - 10), R(0, a ? 0 : 90, 0)); }); break;
      case 'star': roofSpots(W.n || 70, (x, y) => Glow(V(x, y, H - 8), V(rr(8, 22), rr(8, 22), 6), rnd() < 0.3 ? gl : 0xffffff, 2)); break;
      default:
    }
    switch (W.corner) {
      case 'crates': corners((x, y) => { for (const [dx, dy, sz] of [[-80, -60, 120], [70, 40, 110], [-30, 90, 100]]) { Box(V(x + dx, y + dy, sz / 2), V(sz, sz, sz), 0x6a4e30, true, true); Box(V(x + dx, y + dy, sz - 6), V(sz + 6, sz + 6, 12), 0x2a2420, false, false); Box(V(x + dx, y + dy, 6), V(sz + 6, sz + 6, 12), 0x2a2420, false, false); Box(V(x + dx, y + dy, sz / 2), V(sz + 4, 14, sz - 28), 0x2a2420, false, false); } Box(V(x - 50, y - 20, 120 + 45), V(90, 90, 90), 0x5a4630, false, false, 20); });break;
      case 'rubble': corners((x, y) => { M.Solid(V(x, y, 90), V(380, 380, 180), true); for (let q = 0; q < 9; q++) { const s = rr(110, 240), a = q * 0.7, r = rr(0, 170); Box(V(x + Math.cos(a) * r, y + Math.sin(a) * r, s * 0.32 + (q > 5 ? 60 : 0)), V(s, s * 0.8, s * 0.64), q % 3 ? c2 : T.wall, false, false, q * 31); } });break;
      case 'barrels': corners((x, y) => { for (const [dx, dy] of [[-90, -40], [60, -70], [10, 80]]) { M.Solid(V(x + dx, y + dy, 55), V(82, 82, 110), true); const [k, b] = SH.barrel(0x5a3e26, 0x2a2420); M.Shape(k, b, V(x + dx, y + dy, 0), R(0, dx * 3, 0)); } }); break;
      default:
    }
  };
  const one = (i, cx, cy, boss) => {
    const T = THEMES[boss ? [0, 7][i - N_ROOMS] : i], kind = boss ? -1 : i;
    M.world.chunk = i; M.world.recordProps = true;
    const [hx, hy, H] = boss ? BOSS_DIMS : ROOM_DIMS[i], bs = hx / 4000;
    const zone = AddZone(boss ? BOSS_NAMES[i - N_ROOMS] : T.title || T.name, V2(cx - hx, cy - hy), V2(cx + hx, cy + hy));
    GM.zones[zone].group = zone;
    const A = { c: [cx, cy], hx, hy, H, zone, theme: THEMES.indexOf(T), boss, plinths: [] };
    const L = { r: T.lamp[0], g: T.lamp[1], b: T.lamp[2] };
    M.at({ x: cx, y: cy, z: 0, rot: 0 }, () => {
      // ---- the shell: a floor, four dead-flat walls you can run along, and a roof
      Box(V(0, 0, -60), V(hx * 2 + 400, hy * 2 + 400, 120), T.floor, true, false);
      Box(V(0, 0, H + 60), V(hx * 2 + 400, hy * 2 + 400, 120), T.roof, true, false);
      for (const s of [-1, 1]) { Box(V(0, s * (hy + 100), H / 2), V(hx * 2 + 400, 200, H), T.wall, true, true); Box(V(s * (hx + 100), 0, H / 2), V(200, hy * 2 + 400, H), T.wall, true, true); }
      // laid stone: a grid of joints, a border, a runner from door to door
      if (false) {
      for (let x = -hx + 800; x < hx; x += 800) Floor(V2(x - 5, -hy), V2(x + 5, hy), 1.2, T.floor2);
      for (let y = -hy + 800; y < hy; y += 800) Floor(V2(-hx, y - 5), V2(hx, y + 5), 1.2, T.floor2);
      Floor(V2(-260, -hy), V2(260, hy), 1.6, T.floor2); Floor(V2(-230, -hy), V2(230, hy), 2, T.floor);
      }
      for (const s of [-1, 1]) { Floor(V2(-hx, s * (hy - 90) - 90), V2(hx, s * (hy - 90) + 90), 1.8, T.floor2); Floor(V2(s * (hx - 90) - 90, -hy), V2(s * (hx - 90) + 90, hy), 1.8, T.floor2); }
      // the walls are dressed flush (nothing here collides, so nothing catches a wall-run): a skirting, a band of light, a dark frieze under the roof
      for (const s of [-1, 1]) {
        Box(V(0, s * (hy - 2), 40), V(hx * 2, 4, 80), T.trim, false, false); Box(V(s * (hx - 2), 0, 40), V(4, hy * 2, 80), T.trim, false, false);
        Glow(V(0, s * (hy - 2), H * 0.56), V(hx * 2, 4, 14), T.glow, 0); Glow(V(s * (hx - 2), 0, H * 0.56), V(4, hy * 2, 14), T.glow, 0);
        Box(V(0, s * (hy - 2), H - 90), V(hx * 2, 4, 180), T.roof, false, false); Box(V(s * (hx - 2), 0, H - 90), V(4, hy * 2, 180), T.roof, false, false);
        for (let x = -hx + 400; x < hx; x += 800) Box(V(x, s * (hy - 1.5), H * 0.5), V(26, 3, H - 180), T.floor2, false, false);
        for (let y = -hy + 400; y < hy; y += 800) Box(V(s * (hx - 1.5), y, H * 0.5), V(3, 26, H - 180), T.floor2, false, false);
      }
      // the roof: beams across it and lamps hung from them
      for (let y = -hy + 600; y < hy; y += 1200) Box(V(0, y, H - 40), V(hx * 2, 90, 80), T.floor2, false, false);
      const lx = [-hx * 0.6, 0, hx * 0.6], ly = [-hy * 0.6, 0, hy * 0.6];
      for (const x of lx) for (const y of ly) { Box(V(x, y, H - 130), V(14, 14, 180), T.roof, false, false); Glow(V(x, y, H - 240), V(120, 120, 40), T.glow, 0); Lamp(V(x, y, H - Math.min(320, H * 0.3)), L, 2.8, 3600, false); }
      // a doorway at each end: you come in by one and leave by the other
      for (const s of [-1, 1]) {
        for (const e of [-1, 1]) Box(V(e * 230, s * (hy - 30), 250), V(90, 60, 500), T.trim, false, false);
        Box(V(0, s * (hy - 30), 540), V(600, 60, 90), T.trim, false, false); Box(V(0, s * (hy - 3), 245), V(370, 6, 490), 0x050608, false, false);
        Glow(V(0, s * (hy - 34), 596), V(520, 8, 8), T.glow, 0);
      }
      const pillar = (x, y, d = 300, h = H) => { Cyl(V(x, y, h / 2), d, h, T.wall, true, true); Cyl(V(x, y, 35), d + 70, 70, T.trim, false, false); Cyl(V(x, y, h - 35), d + 70, 70, T.trim, false, false); Glow(V(x, y, h * 0.56), V(d + 6, d + 6, 12), T.glow, 1); };
      const block = (x, y, w, d, h, glow = true) => { Box(V(x, y, h / 2), V(w, d, h), T.wall, true, true); Box(V(x, y, 30), V(w + 30, d + 30, 60), T.trim, false, false); if (glow) Glow(V(x, y, Math.min(h, H) * 0.56), V(w + 6, d + 6, 12), T.glow, 0); if (h < H) Box(V(x, y, h + 6), V(w + 30, d + 30, 12), T.trim, false, false); };
      const lowWall = (x, y, len, alongX, h = 180) => { Box(V(x, y, h / 2), alongX ? V(len, 90, h) : V(90, len, h), T.wall, true, true); Box(V(x, y, h + 5), alongX ? V(len + 20, 110, 10) : V(110, len + 20, 10), T.trim, false, false); };
      // broad steps anything can walk up: three risers of forty
      const terrace = (x, y, w, d, n = 3) => { for (let k = 0; k < n; k++) Box(V(x, y, 20 + k * 40), V(w - k * 360, d - k * 360, 40), k % 2 ? T.trim : T.floor2, true, false); };
      let C;
      if (boss) {
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) { pillar(sx * 2700 * bs, sy * 2700 * bs, 520); Box(V(sx * 1500 * bs, sy * 1500 * bs, 45), V(800, 800, 90), T.trim, true, false); Glow(V(sx * 1500 * bs, sy * 1500 * bs, 92), V(700, 700, 3), T.glow, 0); A.plinths.push([cx + sx * 1500 * bs, cy + sy * 1500 * bs]); }
        for (const s of [-1, 1]) { brazier(s * 3300 * bs, 0, T, 240); brazier(s * 1300 * bs, s * 3300 * bs, T, 240); brazier(-s * 1300 * bs, s * 3300 * bs, T, 240); }
        C = craftBoss(i - N_ROOMS, { M, T, hx, hy, H, rnd, rr });
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) C.tall.push([sx * 2700 * bs, sy * 2700 * bs, 500]);
      } else C = craftRoom(kind, { M, T, hx, hy, H, rnd, rr });
      if (!C.noCorners) for (const sx of [-1, 1]) for (const sy of [-1, 1]) brazier(sx * (hx - 260), sy * (hy - 260), T);
      dress(T.name === 'Ossuary' ? 0 : THEMES.indexOf(T), hx, hy, H, T, boss, C);
      A.solidified = M.world.solidify(i); (M.world.roomNames || (M.world.roomNames = []))[i] = T.name;   // what looks solid is solid
      // where they come up: on open ground all over the room, never inside anything, on a platform, or by a doorway
      const free = (x, y) => { const [ix, iy] = GM.cellOf(cx + x, cy + y); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (!GM.navFree(ix + a, iy + b)) return false; return !C.raised.some((r) => x > r[0] - 60 && x < r[2] + 60 && y > r[1] - 60 && y < r[3] + 60); };
      let made = 0;
      const st = boss ? 2000 : 1250;
      for (let x = -hx + 550; x <= hx - 550; x += st) for (let y = -hy + 650; y <= hy - 650; y += st) {
        if (Math.abs(x) < 1300 && Math.abs(y) > hy - 1500) continue;
        if (free(x, y)) { SpawnAt(V(x, y, 0), zone); made++; }
      }
      for (const t of C.tops || []) { SpawnAt(V(t[0], t[1], t[2]), zone); made++; }   // and on top of what is raised
      A.spawns = made;
    });
    ARENAS[i] = A; M.world.chunk = null;
  };
  ARENAS.length = 0;
  for (let i = 0; i < N_ROOMS + 2; i++) one(i, (i % COLS) * SP, Math.floor(i / COLS) * SP, i >= N_ROOMS);
  const S0 = spots(ARENAS[0], 1); M.Spawn(V(S0.spawn[0], S0.spawn[1], 100));
}
