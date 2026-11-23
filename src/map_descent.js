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
const NAMES = ['The Ossuary', 'Cinder Works', 'Rime Vault', 'Mire Cellar', 'The Gilded Ring', 'Drowned Hall', 'The Hive', 'Null Chamber',
  'Bone Gallery', 'The Slag Pit', 'Glacier Lock', 'Rot Garden', 'The Counting Room', 'Brine Cistern', 'Wax Cells', 'The Blind Stair'];
const BOSS_NAMES = ['The First Seal', 'The Second Seal', 'The Third Seal', 'The Bottom'];
const up = (h, k) => { const r = Math.min(255, Math.round(((h >> 16) & 255) * k)), g = Math.min(255, Math.round(((h >> 8) & 255) * k)), b = Math.min(255, Math.round((h & 255) * k)); return (r << 16) | (g << 8) | b; };
for (const T of THEMES) { T.floor = up(T.floor, 1.35); T.floor2 = up(T.floor2, 1.5); T.wall = up(T.wall, 1.3); }
const SP = 6400;
// filled in as the arenas are built: { c: [x, y], hx, hy, reward: [x, y], gates: [[x, y], ...], spawn: [x, y], zone, theme, boss, plinths }
export const ARENAS = [];

export function buildDescent(M) {
  const { Box, Glow, Cyl, Oct, Floor, Lamp, SpawnAt, AddZone, GM } = M;
  GM.navInit(-16000, -12800, 16000, 12800, 100);
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const brazier = (x, y, T, h = 150) => { Cyl(V(x, y, h / 2), 70, h, T.trim, true, true); Cyl(V(x, y, h + 8), 110, 16, T.wall, false, false); Glow(V(x, y, h + 34), V(60, 60, 44), T.glow, 2); Lamp(V(x, y, h + 90), { r: T.lamp[0], g: T.lamp[1], b: T.lamp[2] }, 2.2, 1500, false); };
  const one = (i, cx, cy, boss) => {
    const T = THEMES[boss ? [1, 5, 7, 0][i - 16] : i % 8], kind = boss ? -1 : (i * 3 + (i >> 3)) % 8;
    const hx = boss ? 2800 : [1800, 2200, 1700, 2000][i % 4], hy = boss ? 2800 : [1700, 1500, 2000, 1800][(i + (i >> 2)) % 4], H = boss ? 1500 : 720;
    const zone = AddZone(boss ? BOSS_NAMES[i - 16] : NAMES[i], V2(cx - hx, cy - hy), V2(cx + hx, cy + hy));
    GM.zones[zone].group = zone;
    const A = { c: [cx, cy], hx, hy, zone, theme: THEMES.indexOf(T), boss, gates: [], plinths: [], reward: [cx, cy], spawn: [cx, cy - hy + 260] };
    M.at({ x: cx, y: cy, z: 0, rot: 0 }, () => {
      Box(V(0, 0, -60), V(hx * 2 + 400, hy * 2 + 400, 120), T.floor, true, false);
      // inlay: a border and a few slabs, so the floor reads as laid stone and gives the eye something to measure speed by
      for (const s of [-1, 1]) { Floor(V2(-hx + 120, s * (hy - 160) - 20), V2(hx - 120, s * (hy - 160) + 20), 2, T.floor2); Floor(V2(s * (hx - 160) - 20, -hy + 120), V2(s * (hx - 160) + 20, hy - 120), 2, T.floor2); }
      for (let k = 0; k < (boss ? 26 : 12); k++) { const w = 160 + rnd() * 260, x = (rnd() * 2 - 1) * (hx - 400), y = (rnd() * 2 - 1) * (hy - 400); Floor(V2(x - w, y - w * 0.7), V2(x + w, y + w * 0.7), 1.2 + rnd(), T.floor2); }
      for (const s of [-1, 1]) {
        Box(V(0, s * (hy + 60), H / 2), V(hx * 2 + 240, 120, H), T.wall, true, true); Box(V(s * (hx + 60), 0, H / 2), V(120, hy * 2 + 240, H), T.wall, true, true);
        Box(V(0, s * (hy - 6), 30), V(hx * 2, 12, 60), T.trim, false, false); Box(V(s * (hx - 6), 0, 30), V(12, hy * 2, 60), T.trim, false, false);
        Glow(V(0, s * (hy - 10), H - 60), V(hx * 2, 6, 10), T.glow, 0); Glow(V(s * (hx - 10), 0, H - 60), V(6, hy * 2, 10), T.glow, 0);
        for (let x = -hx + 300; x < hx; x += 600) Box(V(x, s * (hy - 20), H / 2), V(90, 40, H), T.floor2, false, false);
        for (let y = -hy + 300; y < hy; y += 600) Box(V(s * (hx - 20), y, H / 2), V(40, 90, H), T.floor2, false, false);
      }
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) brazier(sx * (hx - 200), sy * (hy - 200), T);
      for (const s of [-1, 1]) for (const t of [-0.45, 0.45]) { Glow(V(s * (hx - 30), t * hy, 330), V(16, 60, 90), T.glow, 0); Glow(V(t * hx, s * (hy - 30), 330), V(60, 16, 90), T.glow, 0); }
      Lamp(V(0, 0, 520), { r: T.lamp[0], g: T.lamp[1], b: T.lamp[2] }, 2.4, boss ? 3200 : 2200, false);
      // the three doorways in the far wall: dressed stone now, lit when the room is clear
      for (const gx of [-800, 0, 800]) {
        for (const s of [-1, 1]) Box(V(gx + s * 190, hy - 30, 210), V(70, 70, 420), T.trim, false, false);
        Box(V(gx, hy - 30, 450), V(480, 80, 70), T.trim, false, false); Box(V(gx, hy - 4, 205), V(310, 10, 410), 0x050608, false, false);
        A.gates.push([cx + gx, cy + hy - 110]);
      }
      // where you come in: a dead doorway behind you
      for (const s of [-1, 1]) Box(V(s * 190, -hy + 30, 210), V(70, 70, 420), T.floor2, false, false);
      Box(V(0, -hy + 30, 450), V(480, 80, 70), T.floor2, false, false); Box(V(0, -hy + 4, 205), V(310, 10, 410), 0x050608, false, false);
      const pillar = (x, y, d = 240, h = H) => { Cyl(V(x, y, h / 2), d, h, T.wall, true, true); Cyl(V(x, y, 30), d + 50, 60, T.trim, false, false); Glow(V(x, y, h * 0.55), V(d + 6, d + 6, 8), T.glow, 1); };
      const crate = (x, y, s = 190, n = 1) => { for (let k = 0; k < n; k++) Box(V(x + (k ? (rnd() - 0.5) * 40 : 0), y, s / 2 + k * s), V(s, s, s), k ? T.floor2 : T.trim, true, k === 0, rnd() * 30); };
      const lowWall = (x, y, len, alongX, h = 170) => Box(V(x, y, h / 2), alongX ? V(len, 70, h) : V(70, len, h), T.wall, true, true);
      if (boss) {
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) { pillar(sx * 1900, sy * 1900, 340); Box(V(sx * 1150, sy * 1150, 45), V(520, 520, 90), T.trim, true, false); Glow(V(sx * 1150, sy * 1150, 92), V(440, 440, 3), T.glow, 0); A.plinths.push([cx + sx * 1150, cy + sy * 1150]); }
        for (const s of [-1, 1]) { brazier(s * 2400, 0, T, 220); brazier(0, s * 2400 - (s > 0 ? 500 : -500), T, 220); }
        Glow(V(0, 0, 3), V(900, 900, 2), T.glow, 8);   // the seal in the middle of the floor
      } else switch (kind) {
        case 0: for (const sx of [-1, 1]) for (const sy of [-1, 1]) pillar(sx * hx * 0.45, sy * hy * 0.45); break;
        case 1: for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + 0.3; crate(Math.cos(a) * hx * 0.5, Math.sin(a) * hy * 0.5, 190, 1 + (k % 3 === 0 ? 1 : 0)); crate(Math.cos(a) * hx * 0.5 + 200, Math.sin(a) * hy * 0.5 + 30, 150); } break;
        case 2: for (const s of [-1, 1]) { lowWall(s * hx * 0.42, 0, hx * 0.5, true); lowWall(0, s * hy * 0.5, hy * 0.42, false); } A.reward = [cx, cy]; break;
        case 3: Box(V(0, 0, 20), V(1100, 1100, 40), T.floor2, true, false); Box(V(0, 0, 60), V(820, 820, 40), T.trim, true, false); Box(V(0, 0, 100), V(540, 540, 40), T.floor2, true, false); for (const sx of [-1, 1]) for (const sy of [-1, 1]) pillar(sx * 760, sy * 760, 150, 420); A.reward = [cx, cy - hy * 0.5]; break;
        case 4: Oct(V(0, 0, 260), V(900, 900, 520), T.wall, true, true); Glow(V(0, 0, 524), V(700, 700, 4), T.glow, 8); for (const sx of [-1, 1]) for (const sy of [-1, 1]) pillar(sx * hx * 0.6, sy * hy * 0.6, 170); A.reward = [cx, cy - hy * 0.55]; break;
        case 5: for (const x of [-0.5, 0, 0.5]) for (const s of [-1, 1]) lowWall(x * hx, s * hy * 0.38, hy * 0.42, false, 230); A.reward = [cx + hx * 0.25, cy]; break;
        case 6: for (let k = 0; k < 9; k++) { const x = (rnd() * 2 - 1) * hx * 0.62, y = (rnd() * 2 - 1) * hy * 0.5; if (Math.hypot(x, y) < 420) continue; lowWall(x, y, 260 + rnd() * 380, rnd() < 0.5, 150 + rnd() * 260); } break;
        default: for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; brazier(Math.cos(a) * hx * 0.5, Math.sin(a) * hy * 0.5, T, 120); } break;
      }
      // where they come up: round the walls, never by the way in
      const n = boss ? 12 : 10;
      for (let k = 0; k < n; k++) { const a = (k + 0.5) / n * Math.PI * 1.5 - Math.PI * 0.25, x = Math.cos(a) * (hx - 330), y = Math.sin(a) * (hy - 330) + (boss ? 0 : 120); SpawnAt(V(Math.max(-hx + 260, Math.min(hx - 260, x)), Math.max(-hy + 700, Math.min(hy - 300, y)), 0), zone); }
    });
    ARENAS[i] = A;
  };
  ARENAS.length = 0;
  for (let i = 0; i < 16; i++) one(i, ((i % 4) - 2) * SP, (Math.floor(i / 4) - 1.5) * SP, false);
  for (let i = 16; i < 20; i++) one(i, 2 * SP, (i - 16 - 1.5) * SP, true);
  M.Spawn(V(ARENAS[0].spawn[0], ARENAS[0].spawn[1], 100));
}
