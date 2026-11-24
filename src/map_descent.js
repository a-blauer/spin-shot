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
const NAMES = ['The Colonnade', 'Four Corners', 'The Ziggurat', 'The Breakwater', 'Twin Drums', 'The Foundry', 'The Hypostyle', 'The Ring'];
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
    bench: [cx - 900, cy + s * (hy - 12)], benchYaw: s > 0 ? -90 : 90, chest: [cx + 900, cy + s * (hy - 190)], chestYaw: s > 0 ? -90 : 90,
    ammo: [cx + 700, cy - s * (hy - 110)], ammoYaw: s > 0 ? 90 : -90, guns: [[cx - hx + 8, cy - s * 500, 0], [cx + hx - 8, cy + s * 500, 180]] };
}

export function buildDescent(M) {
  const { Box, Glow, Cyl, Oct, Floor, Lamp, SpawnAt, AddZone, GM } = M;
  GM.navInit(-24200, -9800, 24200, 9800, 100);
  const brazier = (x, y, T, h = 150) => { Cyl(V(x, y, h / 2), 70, h, T.trim, true, true); Cyl(V(x, y, h + 8), 110, 16, T.wall, false, false); Glow(V(x, y, h + 34), V(60, 60, 44), T.glow, 2); Lamp(V(x, y, h + 90), { r: T.lamp[0], g: T.lamp[1], b: T.lamp[2] }, 2.2, 1500, false); };
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
