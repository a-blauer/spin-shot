// The Descent: twenty rooms, one after another, each its own arena. Nothing here is a town to hold: you clear the
// room you are in, take what it pays, and pick the next door by what is behind it. Every fifth room is a boss's.
// All twenty are built once, far apart on one grid, and the run moves the players between them.
import { V, V2, R } from './mapkit.js';

// each theme: floor, inlay, wall, trim, glow, lamp colour, fog, shadow tint
export const THEMES = [
  { name: 'Ossuary', floor: 0x1a2226, floor2: 0x243038, wall: 0x2e3a40, trim: 0x8a8468, glow: 0x3ad8b8, lamp: [0.35, 1.0, 0.85], fog: 0x0e2a28, sh: [0.4, 0.58, 0.56] },
  { name: 'Cinder Works', floor: 0x241a16, floor2: 0x33221a, wall: 0x3c2a22, trim: 0x6a6e76, glow: 0xff7a2a, lamp: [1.0, 0.55, 0.2], fog: 0x3a1c10, sh: [0.66, 0.48, 0.42] },
  { name: 'Rime Vault', floor: 0x1c2630, floor2: 0x2a3a48, wall: 0x3a4c5c, trim: 0xc9d6e0, glow: 0x7ad0ff, lamp: [0.5, 0.8, 1.0], fog: 0x18303e, sh: [0.46, 0.6, 0.8] },
  { name: 'Mire Cellar', floor: 0x18201a, floor2: 0x243024, wall: 0x2c3a2c, trim: 0x6a5a3a, glow: 0x8aff5a, lamp: [0.6, 1.0, 0.4], fog: 0x1a2c16, sh: [0.48, 0.62, 0.44] },
  { name: 'Gilded Ring', floor: 0x24141a, floor2: 0x3a1c24, wall: 0x4a2028, trim: 0xc8a03a, glow: 0xffcd5a, lamp: [1.0, 0.8, 0.4], fog: 0x321420, sh: [0.66, 0.46, 0.5] },
  { name: 'Drowned Hall', floor: 0x122024, floor2: 0x1a3038, wall: 0x22404a, trim: 0xb8923a, glow: 0x3aa8ff, lamp: [0.3, 0.7, 1.0], fog: 0x0c2434, sh: [0.38, 0.54, 0.74] },
  { name: 'The Hive', floor: 0x221c10, floor2: 0x332a14, wall: 0x40341a, trim: 0x8a6a2a, glow: 0xffb020, lamp: [1.0, 0.75, 0.2], fog: 0x30260c, sh: [0.64, 0.56, 0.36] },
  { name: 'Null Chamber', floor: 0x18141f, floor2: 0x261e33, wall: 0x30263f, trim: 0x8a7ab8, glow: 0xc58cff, lamp: [0.75, 0.5, 1.0], fog: 0x1e1430, sh: [0.54, 0.46, 0.76] },
];
const NAMES = ['The Ossuary', 'Cinder Works', 'Rime Vault', 'Mire Cellar', 'The Gilded Ring', 'Drowned Hall', 'The Hive', 'Null Chamber'];
const BOSS_NAMES = ['The Seal', 'The Bottom'];
const up = (h, k) => { const r = Math.min(255, Math.round(((h >> 16) & 255) * k)), g = Math.min(255, Math.round(((h >> 8) & 255) * k)), b = Math.min(255, Math.round((h & 255) * k)); return (r << 16) | (g << 8) | b; };
for (const T of THEMES) { T.floor = up(T.floor, 1.35); T.floor2 = up(T.floor2, 1.5); T.wall = up(T.wall, 1.3); T.roof = up(T.wall, 0.45); }
const SP = 9600;
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
  GM.navInit(-24200, -9800, 24200, 9800, 100);
  const brazier = (x, y, T, h = 150) => { Cyl(V(x, y, h / 2), 70, h, T.trim, true, true); Cyl(V(x, y, h + 8), 110, 16, T.wall, false, false); Glow(V(x, y, h + 34), V(60, 60, 44), T.glow, 2); Lamp(V(x, y, h + 90), { r: T.lamp[0], g: T.lamp[1], b: T.lamp[2] }, 2.2, 1500, false); };
  // ---- what makes each room its own place. Almost none of it collides: it is on the walls, hung from the roof, laid on
  // the floor or heaped in the corners, clear of the doors, the wall guns and the bench end of the room.
  let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }, rr = (a, b) => a + rnd() * (b - a);
  const WALL_Y = [-2500, -2050, -1600, -1150, 0, 1150, 1600, 2050, 2500];
  const dress = (th, hx, hy, H, T, boss) => {
    const k = hx / 3400, ys = WALL_Y.map((y) => y * (hy / 3000)), flat = R(90, 0, 0);
    const corners = (fn) => { for (const sx of [-1, 1]) for (const sy of [-1, 1]) fn(sx * (hx - 520), sy * (hy - 620), sx, sy); };
    const hang = (x, y, len, col, d = 10) => Cyl(V(x, y, H - len / 2), d, len, col, false, false);
    const roofSpots = (n, fn) => { for (let i = 0; i < n; i++) fn(rr(-hx + 500, hx - 500), rr(-hy + 700, hy - 700)); };
    switch (th) {
      case 0: {   // OSSUARY: walls of skulls, bone heaps, coffins, cages on chains, candles
        const bone = 0xd8cfb8, dark = 0x0e1214;
        for (const sx of [-1, 1]) for (const y of ys) { Box(V(sx * (hx - 3), y, 400), V(6, 330, 520), dark, false, false); for (let r = 0; r < 3; r++) for (let c = -1; c <= 1; c++) { Ball(V(sx * (hx - 24), y + c * 100, 230 + r * 160), V(64, 60, 70), bone); Glow(V(sx * (hx - 50), y + c * 100 - 12, 236 + r * 160), V(6, 10, 10), T.glow, 2); Glow(V(sx * (hx - 50), y + c * 100 + 12, 236 + r * 160), V(6, 10, 10), T.glow, 2); } Box(V(sx * (hx - 10), y, 132), V(20, 360, 16), T.trim, false, false); Box(V(sx * (hx - 10), y, 668), V(20, 360, 16), T.trim, false, false); }
        corners((x, y) => { for (let i = 0; i < 16; i++) { const a = rnd() * 6.28, r = rnd() * 260; if (rnd() < 0.4) Ball(V(x + Math.cos(a) * r, y + Math.sin(a) * r, 26 + rnd() * 60), V(60, 56, 64), bone); else BoxRot(V(x + Math.cos(a) * r, y + Math.sin(a) * r, 14 + rnd() * 50), V(rr(90, 170), 16, 16), bone, R(rr(-20, 20), rr(0, 180), 0), false); } });
        for (const sx of [-1, 1]) for (const y of [ys[1], ys[7]]) { Box(V(sx * (hx - 190), y, 60), V(230, 520, 120), T.wall, false, false); Box(V(sx * (hx - 190), y, 130), V(260, 550, 24), T.trim, false, false); Box(V(sx * (hx - 190), y, 146), V(60, 340, 10), bone, false, false); Box(V(sx * (hx - 190), y + 80, 146), V(180, 50, 10), bone, false, false); }
        roofSpots(boss ? 14 : 8, (x, y) => { const L = rr(180, 420); hang(x, y, L, 0x2a2e30); Box(V(x, y, H - L - 70), V(110, 110, 140), 0x1a1e20, false, false); Ball(V(x, y, H - L - 80), V(56, 52, 60), bone); });
        for (const sx of [-1, 1]) for (const y of ys) for (const d of [-200, 200]) { Cyl(V(sx * (hx - 60), y + d, 20), 16, 40, bone, false, false); Glow(V(sx * (hx - 60), y + d, 50), V(12, 12, 22), 0xffc86a, 3); }
        Glow(V(0, 0, 4), V(1500 * k, 1500 * k, 2), T.glow, 8); Glow(V(0, 0, 4), V(900 * k, 900 * k, 2), T.glow, 8);
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
        roofSpots(60, (x, y) => { const L = rr(140, 620); hang(x, y, L, root, rr(8, 22)); if (rnd() < 0.45) Glow(V(x, y, H - L - 12), V(26, 26, 26), slime, 2); });
        for (let i = 0; i < 16; i++) { const x = rr(-hx + 500, hx - 500), y = rr(-hy + 800, hy - 800), d = rr(260, 620); Cyl(V(x, y, 1.5), d, 3, 0x1e4a1e, false, false); Glow(V(x, y, 3.5), V(d * 0.18, d * 0.14, 2), slime, 1); }
        for (let i = 0; i < 34; i++) { const x = rr(-hx + 200, hx - 200), y = rr(-hy + 500, hy - 500), w = rr(140, 380); Floor(V2(x - w, y - w * 0.7), V2(x + w, y + w * 0.7), 2.2, moss); }
        for (const sx of [-1, 1]) for (const y of ys) { for (let c = 0; c < 5; c++) { const px = sx * (hx - rr(50, 240)), py = y + rr(-190, 190), h = rr(60, 240), w = h * rr(0.9, 1.6); Cyl(V(px, py, h / 2), w * 0.22, h, 0xd8cfa8, false, false); ConeShape(V(px, py, h + w * 0.22), V(w, w, w * 0.5), c % 2 ? cap : 0x6a7a2a); Glow(V(px, py, h - 4), V(w * 0.8, w * 0.8, 4), slime, 1); } Box(V(sx * (hx - 3), y, 380), V(6, 260, 560), moss, false, false); for (let v = 0; v < 4; v++) Box(V(sx * (hx - 8), y + rr(-200, 200), H - rr(200, 500)), V(10, 14, rr(300, 800)), root, false, false); }
        corners((x, y) => { for (let i = 0; i < 4; i++) { const bx = x + rr(-220, 220), by = y + rr(-220, 220); Cyl(V(bx, by, 80), 120, 160, 0x5a3e26, true, true); Cyl(V(bx, by, 40), 126, 12, 0x2a2420, false, false); Cyl(V(bx, by, 120), 126, 12, 0x2a2420, false, false); } });
        break; }
      case 4: {   // THE GILDED RING: bunting, card panels, slot machines, a chandelier, a wheel laid in the floor
        const gold = 0xc8a03a, red = 0xa8201c, black = 0x16121a, cream = 0xf0e6c8;
        for (const sx of [-1, 1]) { for (let y = -hy + 120, i = 0; y < hy; y += 150, i++) Pyramid(V(sx * (hx - 16), y, 800), V(26, 110, 130), [red, gold, cream, 0x2a6a8a][i % 4], R(180, 0, 0)); Box(V(sx * (hx - 10), 0, 872), V(8, hy * 2, 8), gold, false, false); for (const y of ys) { const c = Math.round(y) % 2 ? red : black; Box(V(sx * (hx - 5), y, 400), V(10, 300, 430), gold, false, false); Box(V(sx * (hx - 9), y, 400), V(10, 260, 390), c, false, false); Box(V(sx * (hx - 13), y, 400), V(8, 90, 90), cream, false, false, 45); Glow(V(sx * (hx - 12), y, 640), V(6, 240, 10), 0xffcd5a, 0); } for (const y of [ys[1], ys[2], ys[6], ys[7]]) { Box(V(sx * (hx - 110), y, 150), V(150, 170, 300), red, false, false); Box(V(sx * (hx - 110), y, 310), V(170, 190, 26), gold, false, false); Glow(V(sx * (hx - 190), y, 200), V(6, 120, 100), 0x7af0ff, 0); Ball(V(sx * (hx - 110), y - 110, 220), V(34, 34, 34), gold); Glow(V(sx * (hx - 110), y, 340), V(100, 120, 20), 0xffcd5a, 0); } }
        Cyl(V(0, 0, H - 150), 16, 300, gold, false, false); for (const [r, n, z] of [[520, 14, H - 330], [320, 9, H - 250]]) { Glow(V(0, 0, z), V(r * 2, r * 2, 10), gold, 8); for (let i = 0; i < n; i++) { const a = i / n * 6.283; Glow(V(Math.cos(a) * r, Math.sin(a) * r, z + 26), V(36, 36, 46), 0xfff0b0, 2); } }
        for (let i = 0; i < 24; i++) { const a = (i + 0.5) / 24 * 6.283, r = 1050; BoxRot(V(Math.cos(a) * r, Math.sin(a) * r, 2.6), V(520, 250, 3), i % 2 ? red : black, R(0, a * 57.3, 0), false); } Glow(V(0, 0, 4), V(2700, 2700, 3), gold, 8); Glow(V(0, 0, 4), V(1560, 1560, 3), gold, 8);
        corners((x, y, sx) => { for (let i = 0; i < 3; i++) { Cyl(V(x + i * 190 * -sx, y, 60), 22, 120, gold, false, false); Ball(V(x + i * 190 * -sx, y, 128), V(40, 40, 40), gold); if (i) Box(V(x + (i - 0.5) * 190 * -sx, y, 100), V(190, 12, 12), red, false, false); } });
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
        const nB = boss ? 40 : 26; for (let i = 0; i < nB; i++) { const x = rr(-hx + 400, hx - 400), y = rr(-hy + 600, hy - 600), z = rr(H * 0.45, H - 140), sz = rr(60, 200); BoxRot(V(x, y, z), V(sz, sz, sz), voidc, R(rr(0, 90), rr(0, 90), rr(0, 90)), false); Glow(V(x, y, z), V(sz * 0.36, sz * 0.36, sz * 0.36), pur, 2); }
        for (const d of [700, 1300, 1900, 2500]) Glow(V(0, 0, 3), V(d * k, d * k, 2), pur, 8);
        for (let i = 0; i < 40; i++) { const a = rnd() * 6.283, r = rr(500, 2500) * k; Glow(V(Math.cos(a) * r, Math.sin(a) * r, 3), V(rr(40, 120), 14, 2), i % 4 ? pur : 0xffffff, 0, R(0, rr(0, 180), 0)); }
        roofSpots(boss ? 120 : 70, (x, y) => Glow(V(x, y, H - 8), V(rr(8, 22), rr(8, 22), 6), rnd() < 0.3 ? pur : 0xffffff, 2));
        corners((x, y) => { const h = rr(500, 800); Pyramid(V(x, y, h / 2), V(300, 300, h), voidc); Glow(V(x, y, h + 30), V(50, 50, 50), pur, 2); Glow(V(x, y, 3), V(520, 520, 2), pur, 8); });
        break; }
    }
  };
  const one = (i, cx, cy, boss) => {
    const T = THEMES[boss ? [0, 7][i - 8] : i], kind = boss ? -1 : i;
    const hx = boss ? 4000 : 3400, hy = boss ? 4000 : 3000, H = boss ? 2000 : 1000;
    const zone = AddZone(boss ? BOSS_NAMES[i - 8] : NAMES[i], V2(cx - hx, cy - hy), V2(cx + hx, cy + hy));
    GM.zones[zone].group = zone;
    const A = { c: [cx, cy], hx, hy, H, zone, theme: THEMES.indexOf(T), boss, plinths: [] };
    const L = { r: T.lamp[0], g: T.lamp[1], b: T.lamp[2] };
    M.at({ x: cx, y: cy, z: 0, rot: 0 }, () => {
      // ---- the shell: a floor, four dead-flat walls you can run along, and a roof
      Box(V(0, 0, -60), V(hx * 2 + 400, hy * 2 + 400, 120), T.floor, true, false);
      Box(V(0, 0, H + 60), V(hx * 2 + 400, hy * 2 + 400, 120), T.roof, true, false);
      for (const s of [-1, 1]) { Box(V(0, s * (hy + 100), H / 2), V(hx * 2 + 400, 200, H), T.wall, true, true); Box(V(s * (hx + 100), 0, H / 2), V(200, hy * 2 + 400, H), T.wall, true, true); }
      // laid stone: a grid of joints, a border, a runner from door to door
      for (let x = -hx + 800; x < hx; x += 800) Floor(V2(x - 5, -hy), V2(x + 5, hy), 1.2, T.floor2);
      for (let y = -hy + 800; y < hy; y += 800) Floor(V2(-hx, y - 5), V2(hx, y + 5), 1.2, T.floor2);
      Floor(V2(-260, -hy), V2(260, hy), 1.6, T.floor2); Floor(V2(-230, -hy), V2(230, hy), 2, T.floor);
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
      const lx = boss ? [-2400, 0, 2400] : [-2000, 0, 2000], ly = boss ? [-2400, 0, 2400] : [-1800, 0, 1800];
      for (const x of lx) for (const y of ly) { Box(V(x, y, H - 130), V(14, 14, 180), T.roof, false, false); Glow(V(x, y, H - 240), V(120, 120, 40), T.glow, 0); Lamp(V(x, y, H - 320), L, 2.6, 2600, false); }
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) brazier(sx * (hx - 260), sy * (hy - 260), T);
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
      if (boss) {
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) { pillar(sx * 2700, sy * 2700, 440); Box(V(sx * 1500, sy * 1500, 45), V(640, 640, 90), T.trim, true, false); Glow(V(sx * 1500, sy * 1500, 92), V(560, 560, 3), T.glow, 0); A.plinths.push([cx + sx * 1500, cy + sy * 1500]); }
        for (const s of [-1, 1]) { brazier(s * 3300, 0, T, 240); brazier(s * 1300, s * 3300, T, 240); brazier(-s * 1300, s * 3300, T, 240); }
        Glow(V(0, 0, 3), V(1300, 1300, 2), T.glow, 8); Glow(V(0, 0, 3), V(700, 700, 2), T.glow, 8);
      } else switch (kind) {
        case 0:   // The Colonnade: three lanes between two rows of columns, a stepped gallery along each side wall
          for (const sx of [-1, 1]) { for (let y = -1800; y <= 1800; y += 1200) pillar(sx * 1250, y, 320); for (let k = 0; k < 3; k++) Box(V(sx * (hx - 300 + k * 90), 0, 20 + k * 40), V(600 - k * 180, hy * 2 - 1600, 40), k % 2 ? T.trim : T.floor2, true, false); }
          break;
        case 1:   // Four Corners: four blocks, the streets between them and the road around
          for (const sx of [-1, 1]) for (const sy of [-1, 1]) { block(sx * 1550, sy * 1300, 1300, 1100, H); brazier(sx * 520, sy * 420, T, 120); }
          break;
        case 2:   // The Ziggurat: high ground in the middle that anything can climb
          terrace(0, 0, 2600, 2600, 3); for (const sx of [-1, 1]) for (const sy of [-1, 1]) { pillar(sx * 760, sy * 760, 200, 520); lowWall(sx * 2400, sy * 1900, 900, sx * sy > 0); }
          Glow(V(0, 0, 122), V(700, 700, 3), T.glow, 8);
          break;
        case 3:   // The Breakwater: staggered waist-high walls; you go over, they go round
          for (let r = 0; r < 5; r++) { const y = -1800 + r * 900; for (const x of (r % 2 ? [-1100, 1100] : [-2200, 0, 2200])) lowWall(x, y, 1200, true); }
          for (const s of [-1, 1]) pillar(s * 3000, 0, 260);
          break;
        case 4:   // Twin Drums: two great drums to run rings round, a figure of eight between them
          for (const s of [-1, 1]) { Oct(V(s * 1550, 0, H / 2), V(1500, 1500, H), T.wall, true, true); Oct(V(s * 1550, 0, 35), V(1580, 1580, 70), T.trim, false, false); Glow(V(s * 1550, 0, H * 0.56), V(1510, 1510, 12), T.glow, 7); pillar(0, s * 1700, 260); lowWall(s * 1550, s * 2200, 1000, true); lowWall(s * 1550, -s * 2200, 1000, true); }
          break;
        case 5:   // The Foundry: machines in two rows and the furnace in the middle
          for (const sx of [-1, 1]) for (const sy of [-1, 1]) { block(sx * 1700, sy * 1350, 800, 1500, 440); Glow(V(sx * 1700, sy * 1350, 448), V(500, 1100, 6), T.glow, 0); Cyl(V(sx * 1700, sy * 1350, 440 + (H - 440) / 2), 160, H - 440, T.floor2, false, false); }
          block(0, 0, 900, 900, 300); Glow(V(0, 0, 308), V(620, 620, 6), T.glow, 0); for (const s of [-1, 1]) Box(V(s * 2900, 0, H - 260), V(120, hy * 2, 120), T.trim, false, false);
          break;
        case 6:   // The Hypostyle: a forest of columns
          for (let x = -2400; x <= 2400; x += 1200) for (let y = -2100; y <= 2100; y += 1400) { if (x === 0 && Math.abs(y) > 1500) continue; pillar(x + ((y / 1400) % 2 ? 300 : 0), y, 210); }
          break;
        default:   // The Ring: a broken circle of wall round a raised middle
          for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * Math.PI * 2, x = Math.cos(a) * 1900, y = Math.sin(a) * 1700; Box(V(x, y, 210), V(1000, 110, 420), T.wall, true, true, 90 + a * 180 / Math.PI); }
          terrace(0, 0, 1500, 1500, 2); brazier(0, 0, T, 200);
          break;
      }
      dress(T.name === 'Ossuary' ? 0 : THEMES.indexOf(T), hx, hy, H, T, boss);
      // where they come up: all over the room, never on top of a doorway
      const n = boss ? 14 : 16;
      for (let k = 0; k < n; k++) { const a = (k + 0.5) / n * Math.PI * 2, r = k % 2 ? 0.86 : 0.55, x = Math.cos(a) * (hx - 300) * r, y = Math.sin(a) * (hy - 700) * r; SpawnAt(V(x, y, 0), zone); }
    });
    ARENAS[i] = A;
  };
  ARENAS.length = 0;
  for (let i = 0; i < 8; i++) one(i, ((i % 4) - 2) * SP, (i < 4 ? -0.5 : 0.5) * SP, false);
  for (let i = 8; i < 10; i++) one(i, 2 * SP, (i === 8 ? -0.5 : 0.5) * SP, true);
  const S0 = spots(ARENAS[0], 1); M.Spawn(V(S0.spawn[0], S0.spawn[1], 100));
}
