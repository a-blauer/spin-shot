// The Descent's eight rooms and two boss floors, each laid out by hand and each a different shape: a long bone nave,
// a wide foundry floor, a round frozen lake, a low wine cellar, a rail station under the ground, a wreck on the sea
// bed, a hive, and a chamber that is coming apart.
// Rules every room keeps:
//  - what you fight around is solid and on the nav grid; anything raised is stepped on every side (risers of forty),
//    so whatever can walk can climb it and nothing is left staring at a ledge;
//  - things a person uses are a person's size (a table is waist high, a crate is a crate); only the building is big;
//  - nothing solid touches the four outer walls, so a wall-run never snags; the strip inside each end wall and the
//    two wall-gun spots on the side walls are left clear for the room's stations;
//  - each room hands back where it is tall (so nothing is hung from the roof into it) and where it is raised
//    (so nothing comes up out of the ground inside a platform).
import { V, V2, R } from './mapkit.js';
import { props } from './descent_props.js';
import * as SH from './descent_shapes.js';
import { ROOMS_A } from './descent_rooms_a.js';
import { ROOMS_B } from './descent_rooms_b.js';
import { ROOMS_C } from './descent_rooms_c.js';
import { ROOMS_D } from './descent_rooms_d.js';

// every room after the first eight: { theme: {...}, dims: [hx, hy, H], wall: {...}, build(K, Q, P) }
export const EXTRA = [...ROOMS_A, ...ROOMS_B, ...ROOMS_C, ...ROOMS_D];

// what each room is: half-width, half-length, height
export const ROOM_DIMS = [
  [3400, 5400, 1500],   // 0 Ossuary: a nave, long and tall
  [5200, 3600, 1300],   // 1 Cinder Works: wide
  [4600, 4600, 1400],   // 2 Rime Vault: round the lake
  [5000, 3900, 760],    // 3 Mire Cellar: broad and low
  [3600, 5600, 1200],   // 4 Deep Station: a tunnel
  [5000, 4200, 1500],   // 5 Drowned Hall
  [4600, 4600, 1300],   // 6 The Hive
  [5000, 4400, 1700],   // 7 Null Chamber
  ...EXTRA.map((r) => r.dims),
];
export const BOSS_DIMS = [6000, 6000, 2000];

// blend two colours: k of the way from a to b (b = 0 darkens, 0xffffff lightens)
const mix = (a, b, k) => { const f = (sh) => Math.round(((a >> sh) & 255) * (1 - k) + ((b >> sh) & 255) * k); return (f(16) << 16) | (f(8) << 8) | f(0); };
function kit(K) {
  const { M, T, hx, hy, H, rnd, rr } = K;
  const { Box, BoxRot, Glow, Cyl, Oct, Ball, ConeShape, Pyramid, Floor, Lamp } = M;
  const out = { tall: [], raised: [], tops: [], avoid: null, noCorners: false };
  const AX = R(90, 0, 0), AY = R(0, 0, 90);   // a cylinder laid along X, along Y
  const k = {
    out, AX, AY,
    L: (x, y, z, c, r = 1300, i = 2.2) => Lamp(V(x, y, z), { r: c[0], g: c[1], b: c[2] }, i, r, false),
    // everything below takes the height of its underside, not its middle
    hit: (x, y, z, w, d, h, nav = true) => M.Solid(V(x, y, z + h / 2), V(w, d, h), nav),
    solid: (x, y, z, w, d, h, col, nav = true) => Box(V(x, y, z + h / 2), V(w, d, h), col, true, nav),
    deco: (x, y, z, w, d, h, col, yaw = 0) => Box(V(x, y, z + h / 2), V(w, d, h), col, false, false, yaw),
    tile: (x0, y0, x1, y1, z, col) => Floor(V2(x0, y0), V2(x1, y1), z, col),
    tall: (x, y, r) => out.tall.push([x, y, r]),
    // a thin ring of light laid in the floor: a lit disc with the floor's own colour put back over all but its rim
    ring: (x, y, z, d, w, col, fill) => { Glow(V(x, y, z), V(d, d, 1.2), col, 1); Cyl(V(x, y, z + 1.4), d - w * 2, 1.2, fill, false, false); },
    // a floor of laid slabs: two tones, a few picked out darker, on a grid of `s`
    slabs: (s, a, b, c, skip = () => false) => {
      for (let x = -hx; x < hx - 1; x += s) for (let y = -hy; y < hy - 1; y += s) {
        if (skip(x + s / 2, y + s / 2)) continue;
        // the two tones closer together than they were (a floor, not a chess board), every slab a shade of its own,
        // and the joints between them dark and fine
        const k = (Math.round(x / s) + Math.round(y / s)) % 2 ? 0.32 : 0.68, j = 0.92 + rnd() * 0.14, t = rnd() < 0.07 ? c : mix(mix(a, b, k), 0, 1 - j);
        Floor(V2(x + 4, y + 4), V2(Math.min(hx, x + s) - 4, Math.min(hy, y + s) - 4), 1.4, t);
        if (s >= 400 && rnd() < 0.5) { const h = s / 2; for (const [u, v] of [[0, 0], [h, h]]) Floor(V2(x + u + 6, y + v + 6), V2(Math.min(hx, x + u + h) - 6, Math.min(hy, y + v + h) - 6), 1.8, mix(t, 0, 0.06)); }   // some laid as four smaller stones
      }
    },
    // a raised floor, stepped on all four sides: `h` in risers of forty, each tread seventy deep; the top is w by d
    plat: (x, y, w, d, h, top, side, spots = []) => {
      for (const [dx, dy] of spots) out.tops.push([x + dx, y + dy, h]);
      const n = Math.round(h / 40);
      for (let i = 0; i < n; i++) { const g = (n - 1 - i) * 140; Box(V(x, y, 20 + i * 40), V(w + g, d + g, 40), i === n - 1 ? top : side, true, false); }
      out.raised.push([x - w / 2 - n * 70, y - d / 2 - n * 70, x + w / 2 + n * 70, y + d / 2 + n * 70]);
    },
    // the same, eight-sided
    platOct: (x, y, d, h, top, side) => {
      const n = Math.round(h / 40);
      for (let i = 0; i < n; i++) { const g = (n - 1 - i) * 170; Oct(V(x, y, 20 + i * 40), V(d + g, d + g, 40), i === n - 1 ? top : side, true, false); }
      const r = d / 2 + n * 85; out.raised.push([x - r, y - r, x + r, y + r]);
    },
    // a wall to crouch behind and shoot over
    lowWall: (x, y, len, alongX, col, cap, h = 110, th = 70) => {
      Box(V(x, y, h / 2), alongX ? V(len, th, h) : V(th, len, h), col, true, true);
      Box(V(x, y, h + 6), alongX ? V(len + 16, th + 16, 12) : V(th + 16, len + 16, 12), cap, false, false);
    },
    crate: (x, y, z = 0, s = 110, col = 0x6a4e30, band = 0x2a2420, nav = true) => {
      Box(V(x, y, z + s / 2), V(s, s, s), col, true, nav);
      for (const e of [-1, 1]) { Box(V(x, y, z + s / 2 + e * (s / 2 - 8)), V(s + 6, s + 6, 12), band, false, false); }
      Box(V(x, y, z + s / 2), V(s + 4, 14, s - 28), band, false, false); Box(V(x, y, z + s / 2), V(14, s + 4, s - 28), band, false, false);
    },
    barrel: (x, y, z = 0, col = 0x5a3e26, hoop = 0x2a2420) => { M.Solid(V(x, y, z + 55), V(80, 80, 110), false); const [key, b] = SH.barrel(col, hoop); M.Shape(key, b, V(x, y, z), R(0, (x * 3 + y) % 360, 0)); },
    candle: (x, y, z, h = 30) => { Cyl(V(x, y, z + h / 2), 10, h, 0xe8dcc0, false, false); Glow(V(x, y, z + h + 9), V(9, 9, 18), 0xffc86a, 3); },
    chain: (x, y, z0, z1, col = 0x2a2e30) => { const [key, b] = SH.chain(z1 - z0 - 10, col); M.Shape(key, b, V(x, y, z1), R(0, (x + y) % 90, 0)); },
    skull: (x, y, z, s, yaw = 0, eye = T.glow) => {   // a carved skull, facing +Y before the turn
      const c = Math.cos(yaw * Math.PI / 180), n = Math.sin(yaw * Math.PI / 180), at = (fx, fy, fz) => V(x + (fx * c - fy * n) * s, y + (fx * n + fy * c) * s, z + fz * s);
      Ball(at(0, 0, 0.55), V(s, s * 1.05, s * 0.95), 0xd8cfb8); Box(at(0, 0.12, 0.08), V(s * 0.62, s * 0.6, s * 0.36), 0xc8bea4, false, false, yaw);
      for (const e of [-1, 1]) { Ball(at(e * 0.2, 0.43, 0.52), V(s * 0.24, s * 0.16, s * 0.26), 0x0e0c0c); Glow(at(e * 0.2, 0.47, 0.52), V(s * 0.08, s * 0.08, s * 0.08), eye, 2); }
      Pyramid(at(0, 0.5, 0.3), V(s * 0.12, s * 0.1, s * 0.16), 0x0e0c0c);
    },
  };
  return k;
}

export function craftRoom(kind, K) {
  const { M, T, hx, hy, H, rnd, rr } = K;
  const { Box, BoxRot, Glow, Cyl, Oct, Ball, ConeShape, Pyramid, Floor, Lamp } = M;
  const Q = kit(K), { out, AX, AY, L, hit, solid, deco, tile, tall, slabs, plat, platOct, lowWall, crate, barrel, candle, chain, skull, ring } = Q;
  if (kind >= 8) { EXTRA[kind - 8].build(K, Q, props(K, Q)); return out; }

  switch (kind) {
    // ------------------------------------------------------------------------------------------------ THE OSSUARY
    // A nave: fourteen great columns in two rows, a tomb on a dais at the crossing, and the dead laid out in the aisles.
    // Long sight lines down the middle; the columns and the tombs are what you break them with.
    case 0: {
      const bone = 0xd8cfb8, rib = 0x3c4a50, stone = 0x39464c;
      slabs(450, T.floor, T.floor2, 0x141a1e, (x) => Math.abs(x) < 360);
      tile(-360, -hy, 360, hy, 1.6, stone); for (const s of [-1, 1]) tile(s * 360 - 12, -hy, s * 360 + 12, hy, 2.2, bone);
      for (let y = -4550; y <= 4550; y += 700) { if (Math.abs(y) < 900) continue; tile(-130, y - 210, 130, y + 210, 2.4, 0x232c30); tile(-10, y - 110, 10, y + 130, 3, bone); tile(-60, y + 40, 60, y + 60, 3, bone); }
      const rows = [-4200, -2800, -1400, 0, 1400, 2800, 4200];
      for (const y of rows) {
        for (const sx of [-1, 1]) {
          const x = sx * 1500;
          Cyl(V(x, y, H / 2), 300, H, T.wall, true, true); Oct(V(x, y, 45), V(460, 460, 90), T.trim, false, false); Oct(V(x, y, 110), V(380, 380, 40), stone, false, false);
          Oct(V(x, y, 1090), V(440, 440, 60), T.trim, false, false); Glow(V(x, y, 1052), V(330, 330, 8), T.glow, 7);
          for (let q = 0; q < 4; q++) { const a = q * Math.PI / 2; skull(x + Math.cos(a) * 168, y + Math.sin(a) * 168, 250, 84, -90 + a * 180 / Math.PI); }
          tall(x, y, 420);
          // a rib from the head of each column up to the ridge
          BoxRot(V(sx * 750, y, 1290), V(1540, 60, 60), rib, R(0, 0, sx * -11.5), false);
        }
        Oct(V(0, y, 1400), V(130, 130, 90), T.trim, false, false); Glow(V(0, y, 1345), V(60, 60, 24), T.glow, 2);
      }
      for (const sx of [-1, 1]) for (let i = 0; i < rows.length - 1; i++) Box(V(sx * 1500, (rows[i] + rows[i + 1]) / 2, 1150), V(60, 1100, 60), rib, false, false);
      out.avoid = (x, y) => Math.abs(Math.abs(x) - 1500) < 160 || rows.some((r) => Math.abs(y - r) < 170);
      // the crossing: a dais of two steps, a stone tomb with its lid pushed aside, a candle stand at each corner
      plat(0, 0, 900, 700, 80, T.trim, T.floor2);
      solid(0, 0, 80, 130, 300, 100, stone, false); deco(0, 0, 80, 150, 320, 16, T.trim); deco(0, 0, 164, 150, 320, 16, T.trim);
      BoxRot(V(52, 14, 196), V(140, 310, 22), 0x4a5a60, R(0, 12, -12), false); Glow(V(-12, 0, 181), V(84, 250, 6), T.glow, 0); L(0, 0, 380, T.lamp, 1500, 2.4);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const x = sx * 380, y = sy * 280; hit(x, y, 80, 44, 44, 130, false); Cyl(V(x, y, 140), 16, 120, 0x2a2e30, false, false); Cyl(V(x, y, 203), 56, 8, 0x2a2e30, false, false); for (let q = 0; q < 3; q++) candle(x + Math.cos(q * 2.1) * 17, y + Math.sin(q * 2.1) * 17, 207, 20 + q * 9); }
      // the aisles: stone tombs in pairs (each a man long), and a low charnel wall between the bays
      for (const sx of [-1, 1]) for (const y of [-3500, -2100, 2100, 3500]) {
        for (const e of [-1, 1]) {
          const x = sx * 2450 + e * 190;
          solid(x, y, 0, 110, 250, 80, stone); deco(x, y, 80, 126, 266, 14, T.trim); deco(x, y, 94, 14, 150, 5, bone); deco(x, y + 34, 94, 60, 14, 5, bone);
        }
        candle(sx * 2450, y - 150, 0, 34); candle(sx * 2450, y + 150, 0, 26);
      }
      for (const sx of [-1, 1]) for (const y of [-2800, -700, 700, 2800]) {
        const x = sx * 2300;
        lowWall(x, y, 620, false, 0x2c383e, bone, 110, 90);
        for (let q = -2; q <= 2; q++) skull(x - sx * 44, y + q * 120, 22, 76, sx > 0 ? 90 : -90);
      }
      // bone chandeliers down the nave, hung well clear of heads
      for (const y of [-3500, -2100, 2100, 3500]) { chain(0, y, 960, H); Oct(V(0, y, 940), V(420, 420, 22), bone, false, false); for (let q = 0; q < 8; q++) { const a = q / 8 * 6.283; candle(Math.cos(a) * 180, y + Math.sin(a) * 180, 951, 26); } L(0, y, 880, [1, 0.8, 0.5], 1500, 1.6); tall(0, y, 300); }
      break;
    }
    // ------------------------------------------------------------------------------------------------ CINDER WORKS
    // A foundry floor, wider than it is deep: the crucible on its stepped plinth in the middle, four furnaces making
    // streets between them, and the casting floor's clutter (ingots, coal, quench troughs) for cover in the outer lanes.
    case 1: {
      const iron = 0x3a3e46, dark = 0x17181c, brick = 0x4a2c22, hot = 0xff6a1a, steel = 0x6a6e76;
      slabs(520, T.floor, T.floor2, 0x15110f);
      // slag runs in the floor, from each furnace to the crucible
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        tile(sx * 760 - 130, sy * 1500 - 130, sx * 760 + 130, sy * 1500 + 130, 2, dark); tile(Math.min(sx * 760, sx * 2050), sy * 1500 - 130, Math.max(sx * 760, sx * 2050), sy * 1500 + 130, 2, dark); tile(sx * 760 - 130, Math.min(sy * 1000, sy * 1500), sx * 760 + 130, Math.max(sy * 1000, sy * 1500), 2, dark);
        Glow(V(sx * 1405, sy * 1500, 3.4), V(1290, 130, 2), hot, 0); Glow(V(sx * 760, sy * 1250, 3.4), V(130, 630, 2), hot, 0);
      }
      // the crucible
      platOct(0, 0, 1500, 120, steel, iron);
      for (let q = 0; q < 8; q++) { const a = q / 8 * 6.283 + 0.39; Glow(V(Math.cos(a) * 690, Math.sin(a) * 690, 122), V(150, 26, 2), 0xffc040, 0, R(0, a * 57.3 + 90, 0)); }
      Cyl(V(0, 0, 120 + 150), 560, 300, dark, true, true); Cyl(V(0, 0, 120 + 20), 620, 40, iron, false, false); Cyl(V(0, 0, 120 + 290), 620, 30, iron, false, false); Cyl(V(0, 0, 120 + 150), 590, 26, steel, false, false);
      Glow(V(0, 0, 120 + 302), V(500, 500, 6), hot, 1); L(0, 0, 620, [1, 0.5, 0.15], 2400, 3);
      chain(0, 0, 760, H); Cyl(V(0, 0, 690), 220, 150, iron, false, false); Cyl(V(0, 0, 772), 250, 16, steel, false, false); Glow(V(0, 0, 612), V(150, 150, 8), hot, 1); Glow(V(0, 0, 520), V(22, 22, 180), hot, 1); tall(0, 0, 500);
      // four furnaces: brick, banded in iron, a mouth toward the middle, a stack through the roof
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        const x = sx * 2700, y = sy * 1500;
        solid(x, y, 0, 1200, 820, 640, brick); deco(x, y, 0, 1240, 860, 60, iron); deco(x, y, 290, 1224, 844, 34, iron); deco(x, y, 640, 1260, 880, 40, iron);
        Cyl(V(x, y, 680 + (H - 680) / 2), 380, H - 680, dark, false, false); Cyl(V(x, y, 700), 440, 40, iron, false, false); Cyl(V(x, y, H - 60), 440, 30, iron, false, false);
        const mx = x - sx * 604;   // the mouth, on the side facing the crucible
        deco(mx, y, 70, 14, 380, 300, 0x0a0606); Glow(V(mx - sx * 6, y, 200), V(6, 300, 220), hot, 0); for (const e of [-1, 0, 1]) deco(mx - sx * 10, y + e * 110, 70, 10, 18, 300, iron);
        deco(mx - sx * 8, y, 372, 30, 430, 34, iron); L(mx - sx * 260, y, 260, [1, 0.5, 0.15], 1300, 2);
        tall(x, y, 760);
      }
      // the casting floor
      const ingots = (x, y, along) => { solid(x, y, 0, along ? 230 : 150, along ? 150 : 230, 16, 0x5a4630, false); for (let r = 0; r < 3; r++) for (let c = -1; c <= 1; c++) deco(x + (along ? c * 70 : 0), y + (along ? 0 : c * 70), 16 + r * 24, along ? 60 : 130 - r * 10, along ? 130 - r * 10 : 60, 22, r === 2 && c === 0 ? 0xb8923a : steel); hit(x, y, 16, along ? 220 : 140, along ? 140 : 220, 72, true); };
      const coal = (x, y) => { solid(x, y, 0, 300, 220, 100, 0x2a2420); deco(x, y, 100, 312, 232, 10, iron); Ball(V(x, y, 100), V(270, 190, 90), 0x101014); Glow(V(x + 40, y - 20, 132), V(14, 14, 8), hot, 2); };
      const trough = (x, y, along) => { solid(x, y, 0, along ? 420 : 130, along ? 130 : 420, 80, iron); Glow(V(x, y, 78), along ? V(380, 90, 6) : V(90, 380, 6), 0x3aa8ff, 0); };
      const anvil = (x, y) => { solid(x, y, 0, 70, 70, 50, 0x3a2c20, false); deco(x, y, 50, 46, 110, 14, dark); deco(x, y, 64, 62, 150, 26, dark); };
      for (const sx of [-1, 1]) {
        coal(sx * 4350, sx * 1500); coal(sx * 4350, -sx * 2700); trough(sx * 4300, -sx * 1500, false); ingots(sx * 4300, sx * 2700, true); ingots(sx * 3900, sx * 2700, true);
        for (const sy of [-1, 1]) { ingots(sx * 1500, sy * 2750, false); trough(sx * 2700, sy * 2750, true); anvil(sx * 1150, sy * 380); crate(sx * 3700, sy * 480, 0, 110); }
        lowWall(sx * 1700, 0, 700, false, iron, steel, 110, 60);
      }
      for (const sy of [-1, 1]) { lowWall(0, sy * 2200, 760, true, iron, steel, 110, 60); barrel(-470, sy * 2200); barrel(470, sy * 2200); }
      break;
    }
    // ------------------------------------------------------------------------------------------------ RIME VAULT
    // Round: a frozen lake with a ring of eight ice columns, a cairn of spires on an island in the middle, and blocks
    // of cut ice stacked where the ring opens. You circle here; the columns keep cutting the line between you and them.
    case 2: {
      const ice = 0xbfe6ff, deep = 0x5aa0d0, snow = 0xe8f2f8, blue = 0x9fc4dc;
      slabs(520, T.floor, T.floor2, 0x16202a, (x, y) => Math.hypot(x, y) < 2950);
      Cyl(V(0, 0, 1.2), 5900, 2, 0x35566c, false, false); ring(0, 0, 2, 5680, 40, ice, 0x6f9db8); ring(0, 0, 5, 3300, 26, ice, 0x6f9db8);
      for (let i = 0; i < 26; i++) { const a = rnd() * 6.283, r = rr(500, 2500); Glow(V(Math.cos(a) * r, Math.sin(a) * r, 8), V(rr(260, 700), 7, 1.4), 0xe8f8ff, 0, R(0, rr(0, 180), 0)); }
      for (let q = 0; q < 8; q++) {
        const a = (q + 0.5) / 8 * 6.283, x = Math.cos(a) * 2500, y = Math.sin(a) * 2500;
        Oct(V(x, y, H / 2), V(420, 420, H), q % 2 ? ice : deep, true, true); Oct(V(x, y, 60), V(620, 620, 120), deep, false, false); Ball(V(x, y, 0), V(900, 900, 150), snow);
        Glow(V(x, y, H * 0.5), V(440, 440, 10), 0xdff6ff, 7); for (let c = 0; c < 4; c++) { const b = a + c * 1.571 + 0.6; ConeShape(V(x + Math.cos(b) * 250, y + Math.sin(b) * 250, 90), V(90, 90, 180), ice); }
        tall(x, y, 520);
      }
      // the island
      platOct(0, 0, 900, 80, snow, blue);
      Pyramid(V(0, 0, 80 + 380), V(300, 300, 760), ice); hit(0, 0, 80, 220, 220, 420, false); Glow(V(0, 0, 80 + 250), V(60, 60, 380), 0xdff6ff, 1); L(0, 0, 560, [0.6, 0.85, 1], 2400, 2.8); tall(0, 0, 420);
      for (let c = 0; c < 5; c++) { const a = c / 5 * 6.283 + 0.4, h = 200 + c * 50; Pyramid(V(Math.cos(a) * 280, Math.sin(a) * 280, 80 + h / 2), V(120, 120, h), c % 2 ? deep : ice, R(0, c * 31, 0)); }
      // cut ice, stacked like a quarry's
      const blocks = (x, y) => { for (const [dx, dy, s] of [[-110, -60, 200], [110, -40, 180], [0, 150, 160]]) { solid(x + dx, y + dy, 0, s, s, s * 0.8, deep); deco(x + dx, y + dy, s * 0.8, s + 10, s + 10, 10, snow); } solid(x - 30, y - 50, 160, 150, 150, 120, ice, false); deco(x - 30, y - 50, 280, 160, 160, 10, snow); };
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { blocks(sx * 3450, sy * 1750); blocks(sx * 1750, sy * 3450); }
      // low walls of packed snow on the lake, facing each door and each side
      for (const s of [-1, 1]) { lowWall(0, s * 1450, 760, true, blue, snow, 110, 110); lowWall(s * 1450, 0, 760, false, blue, snow, 110, 110); }
      // a sledge and its load, frozen where it was left
      for (const s of [-1, 1]) { const x = s * 3700, y = -s * 250; for (const e of [-1, 1]) deco(x + e * 60, y, 0, 14, 330, 16, 0x3a2c20); solid(x, y, 16, 150, 290, 14, 0x5a4630, false); crate(x, y - 70, 30, 100, 0x6a4e30, 0x2a2420, false); crate(x, y + 60, 30, 90, 0x5a4630, 0x2a2420, false); hit(x, y, 0, 150, 300, 130, true); Ball(V(x, y - 70, 132), V(120, 120, 50), snow); }
      break;
    }
    // ------------------------------------------------------------------------------------------------ MIRE CELLAR
    // Broad and low: a wine cellar gone to swamp. Brick piers in a grid hold the vault up, great tuns lie in racks
    // between them and make lanes, and a well stands in the middle. Close quarters and short lines of sight.
    case 3: {
      const brick = 0x4a3a2c, oak = 0x5a3e26, hoop = 0x2a2420, moss = 0x3f6a2c, slime = 0x7aff5a;
      slabs(450, T.floor, T.floor2, 0x10160f);
      const px = [-3600, -1200, 1200, 3600], py = [-1950, 0, 1950];
      for (const x of px) for (const y of py) {
        solid(x, y, 0, 300, 300, H, brick); deco(x, y, 0, 360, 360, 70, T.trim); deco(x, y, H - 110, 380, 380, 110, T.trim); deco(x, y, 70, 320, 320, 26, moss);
        Glow(V(x, y, 330), V(312, 312, 10), T.glow, 0); tall(x, y, 330);
      }
      // the ribs of the vault, pier to pier
      for (const y of py) Box(V(0, y, H - 45), V(hx * 2 - 40, 150, 90), 0x2c241c, false, false);
      for (const x of px) Box(V(x, 0, H - 40), V(150, hy * 2 - 40, 80), 0x2c241c, false, false);
      // a rack of two tuns: each as tall as a man is, lying on a cradle
      const tuns = (x, y) => {
        for (const e of [-1, 1]) {
          const tx = x + e * 215;
          Cyl(V(tx, y, 225), 380, 560, oak, false, false, AY); Cyl(V(tx, y, 225), 400, 200, oak, false, false, AY); for (const g of [-200, -100, 100, 200]) Cyl(V(tx, y + g, 225), 404 - Math.abs(g) * 0.08, 12, hoop, false, false, AY);
          for (const g of [-1, 1]) { Cyl(V(tx, y + g * 282, 225), 340, 6, 0x6a4e30, false, false, AY); deco(tx, y + g * 180, 0, 300, 50, 60, 0x3a2c20); }
          Cyl(V(tx, y - 292, 120), 16, 30, 0xb8923a, false, false, AY);
        }
        hit(x, y, 0, 820, 580, 420, true); out.tall.push([x, y, 520]);
      };
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { tuns(sx * 2400, sy * 975); tuns(sx * 2400, sy * 2925); }
      for (const sy of [-1, 1]) tuns(0, sy * 1000);
      out.avoid = (x, y) => px.some((p) => Math.abs(x - p) < 140) || py.some((p) => Math.abs(y - p) < 140);
      // the well
      Cyl(V(0, 0, 50), 420, 100, 0x55584f, true, true); Cyl(V(0, 0, 104), 440, 12, T.trim, false, false); Glow(V(0, 0, 96), V(330, 330, 6), slime, 1); L(0, 0, 300, T.lamp, 1500, 2.4);
      for (const e of [-1, 1]) deco(e * 236, 0, 0, 30, 30, 300, 0x3a2c20); deco(0, 0, 300, 520, 34, 30, 0x3a2c20); Cyl(V(0, 0, 268), 46, 300, oak, false, false, AX); chain(0, 0, 130, 250); Cyl(V(0, 0, 118), 60, 50, oak, false, false); tall(0, 0, 420);
      // tasting tables (waist high) with a bench each side, bottles left where they stood
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        const x = sx * 2400, y = sy * 1950;
        solid(x, y, 68, 90, 300, 10, oak, false); for (const e of [-1, 1]) { deco(x, y + e * 120, 0, 70, 12, 68, 0x3a2c20); solid(x + e * 100, y, 38, 34, 280, 8, oak, false); deco(x + e * 100, y - 110, 0, 30, 12, 38, 0x3a2c20); deco(x + e * 100, y + 110, 0, 30, 12, 38, 0x3a2c20); }
        hit(x, y, 0, 240, 300, 78, true);
        for (let q = 0; q < 4; q++) { const by = y - 105 + q * 70; Cyl(V(x + (q % 2 ? 18 : -14), by, 88), 9, 20, q % 2 ? 0x2a5a3a : 0x4a2a1a, false, false); Cyl(V(x + (q % 2 ? 18 : -14), by, 102), 4, 10, 0x1a1a1a, false, false); } candle(x, y, 78, 16);
      }
      // what came down and was never taken up again
      for (const sx of [-1, 1]) {
        barrel(sx * 4350, sx * 2900); barrel(sx * 4250, sx * 3010); barrel(sx * 4380, sx * 3030); crate(sx * 4300, -sx * 2900, 0, 110); crate(sx * 4300, -sx * 2900, 110, 90, 0x5a4630, hoop, false); crate(sx * 4180, -sx * 2990, 0, 100);
        for (const sy of [-1, 1]) { barrel(sx * 620, sy * 2600); barrel(sx * 4300, sy * 1050); }
      }
      // the floor is half under water: dark pools with a glint, laid between the lanes
      for (const [x, y, w, d] of [[-1200, 975, 700, 500], [1200, -975, 700, 500], [-3600, -975, 600, 700], [3600, 975, 600, 700], [-1200, -2925, 800, 500], [1200, 2925, 800, 500], [0, 2500, 500, 400], [0, -2500, 500, 400]]) { tile(x - w / 2, y - d / 2, x + w / 2, y + d / 2, 2.2, 0x15301a); Glow(V(x, y, 3.6), V(w * 0.5, d * 0.4, 2), slime, 0); }
      break;
    }
    default: return craftRoomB(kind, K, Q);
  }
  return out;
}

function craftRoomB(kind, K, Q) {
  const { M, T, hx, hy, H, rnd, rr } = K;
  const { Box, BoxRot, Glow, Cyl, Oct, Ball, ConeShape, Pyramid, Floor, Lamp } = M;
  const { out, AX, AY, L, hit, solid, deco, tile, tall, slabs, plat, platOct, lowWall, crate, barrel, candle, chain, skull, ring } = Q;
  switch (kind) {
    // ------------------------------------------------------------------------------------------------ DEEP STATION
    // A station on the line that runs under everything. You come in along the track bed, out of the tunnel mouth, and
    // the fight is up and down between the bed and four raised platforms: posts, benches, a ticket office, freight.
    case 4: {
      const timber = 0x4a3626, tdark = 0x2e2218, iron = 0x3a3e46, gravel = 0x2a2622, flag = 0x6e6454, lampc = [1, 0.85, 0.55];
      slabs(520, T.floor, T.floor2, 0x15120f, (x) => Math.abs(x) < 510);
      tile(-510, -hy, 510, hy, 1.4, gravel);
      for (let y = -hy + 90; y < hy; y += 180) tile(-230, y - 28, 230, y + 28, 2.4, tdark);
      for (const e of [-1, 1]) { deco(e * 120, 0, 3, 14, hy * 2, 11, 0x8a8e96); deco(e * 120, 0, 2, 30, hy * 2, 3, iron); }
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        const cx = sx * 1775, cy = sy * 2500, z = 120;
        plat(cx, cy, 2250, 3900, z, flag, 0x3a332c, [[0, 1100], [0, -1100], [500, 550], [-500, -550]]);
        tile(sx * 650, cy - 1950, sx * 700, cy + 1950, z + 1.4, 0xd8c060);   // the painted line at the platform's edge
        // posts and the beams they carry
        for (const py of [-1500, 0, 1500]) {
          const y = cy + py;
          for (const px of [900, 2650]) { const x = sx * px; solid(x, y, z, 90, 90, H - z, timber, false); deco(x, y, z, 130, 130, 30, tdark); for (const e of [-1, 1]) BoxRot(V(x + e * 110, y, H - 250), V(300, 50, 50), tdark, R(0, 0, e * -45), false); }
          Box(V(cx, y, H - 150), V(2000, 70, 70), timber, false, false);
          chain(cx, y, 470, H - 185); deco(cx, y, 420, 44, 44, 56, iron); Glow(V(cx, y, 448), V(30, 30, 40), 0xffe6a0, 0); L(cx, y, 400, lampc, 1700, 2.4);
        }
        for (const px of [900, 2650]) Box(V(sx * px, cy, H - 80), V(70, 3200, 70), timber, false, false);
        // benches, their backs to the wall side
        for (const by of [-750, 750]) { const x = sx * 2380, y = cy + by; solid(x, y, z + 38, 50, 220, 8, timber, false); for (const e of [-1, 1]) deco(x, y + e * 90, z, 44, 10, 38, iron); deco(x + sx * 24, y, z + 46, 8, 220, 46, timber); hit(x, y, z, 60, 220, 92, false); }
        // a signal at the track side
        { const x = sx * 720, y = cy - sy * 1700; solid(x, y, z, 26, 26, 300, iron, false); deco(x, y, z + 300, 56, 34, 96, tdark); Glow(V(x, y - sy * 19, z + 372), V(26, 6, 26), 0xff3a2a, 0); Glow(V(x, y - sy * 19, z + 328), V(26, 6, 26), 0x3aff7a, 0); }
        if (sx * sy > 0) {   // the ticket office
          solid(cx, cy, z, 420, 360, 280, timber, false); deco(cx, cy, z, 440, 380, 40, tdark); deco(cx, cy, z + 280, 520, 460, 24, tdark); deco(cx, cy, z + 304, 380, 320, 20, tdark);
          Glow(V(cx - sx * 212, cy, z + 170), V(6, 220, 90), 0xffe6a0, 0); deco(cx - sx * 214, cy, z + 110, 30, 260, 12, tdark); for (const e of [-1, 0, 1]) deco(cx - sx * 214, cy + e * 74, z + 122, 6, 6, 138, iron);
          deco(cx - sx * 216, cy, z + 236, 8, 200, 34, 0xd8c8a0);
        } else {   // freight left on the platform
          crate(cx - 70, cy - 60, z, 110, 0x6a4e30, 0x2a2420, false); crate(cx + 60, cy + 50, z, 100, 0x5a4630, 0x2a2420, false); crate(cx - 20, cy - 10, z + 110, 90, 0x6a4e30, 0x2a2420, false);
          barrel(cx + 190, cy - 120, z); barrel(cx - 200, cy + 130, z); barrel(cx - 110, cy + 190, z);
          // a hand truck stood on end
          deco(cx + 330, cy + 180, z, 60, 12, 130, iron); deco(cx + 330, cy + 196, z, 60, 44, 8, iron); for (const e of [-1, 1]) Cyl(V(cx + 330 + e * 36, cy + 200, z + 16), 32, 10, tdark, false, false, AX);
        }
      }
      // two short trains of ore carts stand on the line
      const cart = (y) => {
        hit(0, y, 0, 250, 210, 150, true);
        for (const ex of [-1, 1]) for (const ey of [-1, 1]) Cyl(V(ex * 120, y + ey * 70, 26), 50, 16, iron, false, false, AX);
        for (const ey of [-1, 1]) Cyl(V(0, y + ey * 70, 26), 16, 240, iron, false, false, AX);
        deco(0, y, 34, 210, 190, 14, iron); deco(0, y, 48, 236, 200, 86, 0x4a3a2c); deco(0, y, 126, 250, 214, 10, iron); for (const e of [-1, 1]) deco(e * 121, y, 48, 6, 204, 78, iron);
        Ball(V(0, y, 136), V(210, 176, 60), 0x241e1c); Glow(V(20, y - 30, 160), V(10, 10, 8), T.glow, 2); Glow(V(-24, y + 44, 156), V(8, 8, 8), T.glow, 2);
      };
      for (const s of [-1, 1]) for (const q of [-1, 0, 1]) { cart(s * 1900 + q * 250); if (q < 1) deco(0, s * 1900 + q * 250 + 125, 40, 10, 44, 10, iron); }
      // the tunnel mouth at each end: a timber set round the door
      for (const s of [-1, 1]) { for (const e of [-1, 1]) { deco(e * 560, s * (hy - 40), 0, 90, 80, 820, timber); BoxRot(V(e * 440, s * (hy - 40), 730), V(330, 60, 60), tdark, R(0, 0, e * -45), false); } deco(0, s * (hy - 40), 820, 1300, 80, 100, timber); deco(0, s * (hy - 44), 838, 300, 8, 64, 0xd8c8a0); }
      // the station clock over the crossing
      chain(0, 0, 800, H); Cyl(V(0, 0, 700), 200, 56, iron, false, false, AY); for (const e of [-1, 1]) { Glow(V(0, e * 30, 700), V(164, 164, 4), 0xfff0c8, 1, AY); deco(0, e * 33, 696, 8, 2, 60, 0x101010); deco(18, e * 33, 696, 44, 2, 8, 0x101010); } L(0, 0, 560, lampc, 1800, 2);
      out.avoid = () => true;
      break;
    }
    // ------------------------------------------------------------------------------------------------ DROWNED HALL
    // A ship on the sea bed, lying across the room and broken in two. The way from door to door runs through the break;
    // each half is a hold you can fight in and out of (the open end, and a hole stove in its side), with reef and
    // rock outside.
    case 5: {
      const plank = 0x5a4630, pdark = 0x3a2c20, brass = 0xb8923a, sand = 0x5e5a44, weed = 0x2a6a4a, coral = [0xd86a7a, 0xe8a04a, 0x9a6ad8], rock = 0x34424a;
      const wh = 420, th = 90;
      slabs(520, T.floor, T.floor2, 0x0c181c, (x, y) => Math.abs(y) < 655 && Math.abs(x) > 700 && Math.abs(x) < 3400);
      for (let i = 0; i < 22; i++) { const x = rr(-hx + 400, hx - 400), y = rr(-hy + 500, hy - 500), w = rr(260, 620); if (Math.abs(y) < 900 && Math.abs(x) < 3700) continue; tile(x - w, y - w * 0.6, x + w, y + w * 0.6, 2.2, sand); }
      const side = (x, y, len, h = wh) => {
        solid(x, y, 0, len, th, h, plank); for (const z of [90, 210, 330]) if (z < h - 40) deco(x, y, z, len + 2, th + 10, 16, pdark); deco(x, y, h, len + 12, th + 34, 20, pdark);
        for (let rx = x - len / 2 + 100; rx < x + len / 2; rx += 400) deco(rx, y - Math.sign(y) * (th / 2 + 18), 0, 44, 36, h - 10, pdark);
      };
      for (const sx of [-1, 1]) {
        for (let px = 760; px < 3400; px += 150) tile(sx * px, -655, sx * (px + 136), 655, 2, (px / 150 | 0) % 2 ? plank : 0x4e3c2a);
        side(sx * 1700, -sx * 700, 2000);                                   // the whole side
        side(sx * 1100, sx * 700, 800); side(sx * 2400, sx * 700, 600);     // the side with a hole stove in it
        for (const e of [-1, 1]) deco(sx * (1500 + (e > 0 ? 600 : 0)) - e * 14, sx * 700, 0, 30, th + 16, wh - 60, 0x2a2018);   // splintered ends at the hole
        L(sx * 1700, 0, 520, [0.5, 0.8, 1], 1900, 2.2);
      }
      // the bow (east): the sides run in to the stem, and the forecastle deck fills it
      for (const e of [-1, 1]) { Box(V(3100, e * 400, wh / 2), V(1010, th, wh), plank, true, true, e * -36.87); Box(V(3100, e * 400, wh + 10), V(1020, th + 34, 20), pdark, false, false, e * -36.87); }
      solid(3530, 0, 0, 130, 230, wh + 140, pdark); Pyramid(V(3530, 0, wh + 200), V(130, 230, 120), pdark);
      solid(2830, 0, 0, 260, 900, 200, plank); solid(3090, 0, 0, 260, 500, 200, plank); solid(3330, 0, 0, 220, 170, 200, plank); deco(2830, 0, 200, 250, 880, 8, 0x4e3c2a);
      Cyl(V(2830, 0, 250), 110, 100, pdark, true, false); Cyl(V(2830, 0, 304), 150, 12, brass, false, false); for (let q = 0; q < 3; q++) Cyl(V(2830, 0, 270), 14, 250, pdark, false, false, R(90, q * 60, 0));
      // the stern (west): higher sides, the transom, and a quarterdeck up three steps
      for (const e of [-1, 1]) side(-3100, e * 700, 800, 520);
      solid(-3455, 0, 0, 90, 1490, 520, plank); deco(-3455, 0, 520, 124, 1500, 20, pdark); for (const e of [-1, 0, 1]) { deco(-3404, e * 380, 250, 12, 200, 150, 0x101820); Glow(V(-3398, e * 380, 325), V(6, 150, 100), 0x3aa8ff, 0); }
      for (let i = 0; i < 3; i++) Box(V(-3410 + (650 - i * 70) / 2, 0, 20 + i * 40), V(650 - i * 70, 1310, 40), i === 2 ? 0x4e3c2a : plank, true, false);
      out.raised.push([-3500, -700, -2700, 700]);
      solid(-3230, 0, 120, 30, 30, 96, pdark, false); Cyl(V(-3206, 0, 232), 150, 12, pdark, false, false, AX); Cyl(V(-3206, 0, 232), 40, 20, brass, false, false, AX); for (let q = 0; q < 4; q++) Cyl(V(-3206, 0, 232), 10, 190, pdark, false, false, R(0, 0, q * 45));
      // the mast still standing in the after half, its yard and a rag of sail; the stump and the fallen top in the fore half
      Cyl(V(-1800, 0, 650), 120, 1300, pdark, true, false); Cyl(V(-1800, 0, 30), 190, 60, plank, false, false); Cyl(V(-1800, 0, 900), 50, 1000, pdark, false, false, AY); Box(V(-1788, 0, 650), V(8, 860, 470), 0xa8a088, false, false); Cyl(V(-1800, 0, 1130), 200, 14, pdark, false, false); tall(-1800, 0, 700);
      Cyl(V(1700, 0, 130), 130, 260, pdark, true, false); Pyramid(V(1700, 0, 300), V(110, 110, 90), 0x2a2018); Cyl(V(2150, -330, 58), 110, 720, pdark, false, false, AX); hit(2150, -330, 0, 720, 110, 112, true);
      // what she was carrying
      crate(-1150, -360, 0, 110); crate(-1040, -470, 0, 100); crate(-1110, -400, 110, 90, 0x5a4630, 0x2a2420, false); barrel(-2400, 420); barrel(-2290, 470); barrel(-2360, 320);
      for (const [x, y] of [[1250, 420], [2300, 380]]) { solid(x, y, 0, 120, 76, 58, pdark, false); deco(x, y, 58, 124, 80, 22, plank); deco(x, y, 0, 128, 12, 80, brass); Glow(V(x, y - 40, 50), V(22, 6, 16), 0xffcd5a, 0); }
      crate(1150, -420, 0, 110); barrel(1010, -480);
      // outside her: rock, and reef grown over what fell off
      const boulder = (x, y, d) => { Oct(V(x, y, d * 0.24), V(d, d, d * 0.48), rock, true, true); Ball(V(x, y, d * 0.44), V(d * 0.86, d * 0.86, d * 0.34), 0x3e4e58); for (let q = 0; q < 3; q++) { const a = q * 2.1 + x; BoxRot(V(x + Math.cos(a) * d * 0.5, y + Math.sin(a) * d * 0.5, 90), V(18, 8, 180), q % 2 ? weed : 0x3a8a5a, R(rr(-10, 10), rr(0, 180), rr(-10, 10)), false); } };
      const reef = (x, y) => { hit(x, y, 0, 340, 340, 170, true); Ball(V(x, y, 0), V(460, 460, 240), rock); for (let q = 0; q < 6; q++) { const a = q * 1.05, r = 60 + (q % 3) * 45, h = 150 + (q % 4) * 45; Pyramid(V(x + Math.cos(a) * r, y + Math.sin(a) * r, 80 + h / 2), V(h * 0.5, h * 0.5, h), coral[q % 3], R(0, q * 40, 0)); } for (let q = 0; q < 4; q++) Ball(V(x + Math.cos(q * 1.6 + 0.5) * 150, y + Math.sin(q * 1.6 + 0.5) * 150, 70), V(80, 80, 70), coral[(q + 1) % 3]); };
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { boulder(sx * 950, sy * 2450, 520); reef(sx * 2700, sy * 2300); reef(sx * 4150, sy * 1500); }
      for (const s of [-1, 1]) { boulder(s * 4100, -s * 3000, 420); lowWall(s * 250, s * 1500, 620, true, rock, 0x3e4e58, 110, 120); }
      break;
    }
    // ------------------------------------------------------------------------------------------------ THE HIVE
    // No corners: great columns of comb round the room off. A brood mound in the middle with the royal cell on top,
    // six pillars of comb in a ring round it, ridges of wax to duck behind and clutches of eggs in the gaps.
    case 6: {
      const wax = 0xd8a030, dark = 0x5a3a10, honey = 0xffb020, comb = 0x8a5a14, pale = 0xe8dcb8;
      for (let r = 0, y = -hy + 250; y < hy; y += 450, r++) for (let x = -hx + 260 + (r % 2 ? 260 : 0); x < hx; x += 520) Oct(V(x, y, 1.2), V(500, 500, 2.4), (r + Math.round(x / 520)) % 3 ? T.floor : T.floor2, false, false);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const [a, b, d] of [[400, 400, 1040], [1260, 340, 760], [340, 1260, 760]]) {
        const x = sx * (hx - a), y = sy * (hy - b);
        Oct(V(x, y, H / 2), V(d, d, H), d > 900 ? comb : dark, true, true); Oct(V(x, y, 40), V(d + 120, d + 120, 80), dark, false, false);
        for (const z of [300, 620, 940]) { const n = Math.hypot(x, y), ux = -x / n, uy = -y / n; Ball(V(x + ux * d * 0.44, y + uy * d * 0.44, z), V(150, 150, 170), 0x3a2408); Glow(V(x + ux * (d * 0.44 + 30), y + uy * (d * 0.44 + 30), z), V(90, 90, 110), honey, 2); }
        tall(x, y, d * 0.6 + 100);
      }
      out.noCorners = true;
      platOct(0, 0, 1300, 160, wax, comb);
      Ball(V(0, 0, 160 + 210), V(340, 340, 460), 0xe8b040); Glow(V(0, 0, 160 + 220), V(190, 190, 280), honey, 2); hit(0, 0, 160, 250, 250, 400, false); Oct(V(0, 0, 176), V(460, 460, 32), dark, false, false); L(0, 0, 760, [1, 0.75, 0.2], 2600, 3); tall(0, 0, 500);
      for (let q = 0; q < 6; q++) { const a = q / 6 * 6.283 + 0.52, x = Math.cos(a) * 420, y = Math.sin(a) * 420; Ball(V(x, y, 160 + 62), V(120, 120, 150), pale); Glow(V(x, y, 160 + 60), V(50, 50, 70), honey, 2); hit(x, y, 160, 100, 100, 130, false); }
      for (let q = 0; q < 6; q++) {
        const a = q / 6 * 6.283, x = Math.cos(a) * 2400, y = Math.sin(a) * 2400;
        Oct(V(x, y, H / 2), V(480, 480, H), comb, true, true); Oct(V(x, y, 50), V(660, 660, 100), dark, false, false); Oct(V(x, y, H - 50), V(660, 660, 100), dark, false, false);
        for (const z of [330, 640, 950]) Glow(V(x, y, z), V(500, 500, 16), honey, 7);
        tall(x, y, 560);
      }
      for (const s of [-1, 1]) { lowWall(0, s * 3350, 760, true, comb, wax, 110, 120); lowWall(s * 3400, 0, 760, false, comb, wax, 110, 120); for (const e of [-1, 1]) lowWall(s * 2500, e * 2550, 600, s * e > 0, comb, wax, 110, 120); }
      const clutch = (x, y) => { hit(x, y, 0, 260, 240, 130, true); for (const [dx, dy, sz] of [[-60, -30, 150], [70, -20, 130], [0, 70, 140]]) { Ball(V(x + dx, y + dy, sz * 0.45), V(sz, sz, sz * 1.2), pale); Glow(V(x + dx, y + dy, sz * 0.5), V(sz * 0.4, sz * 0.4, sz * 0.5), honey, 2); } Cyl(V(x, y, 2), 380, 4, 0x9a6410, false, false); };
      for (const s of [-1, 1]) { clutch(s * 1650, s * 350); clutch(s * 700, -s * 1500); clutch(-s * 1250, s * 1150); clutch(s * 3650, s * 1500); clutch(s * 1500, -s * 3500); }
      break;
    }
    // ------------------------------------------------------------------------------------------------ NULL CHAMBER
    // The room is coming apart. A hole of stars in the middle with something hanging over it, four plates of the floor
    // heaved up to different heights, and black monoliths standing where the lines cross.
    default: {
      const voidc = 0x0c0a14, pur = T.glow, white = 0xf0e8ff, slab = 0x2a2238;
      slabs(550, T.floor, T.floor2, 0x0a0812, (x, y) => Math.hypot(x, y) < 1420);
      ring(0, 0, 1.6, 2780, 40, pur, 0x05040a); ring(0, 0, 4.6, 1500, 16, white, 0x05040a);
      for (let i = 0; i < 46; i++) { const a = rnd() * 6.283, r = rr(80, 1200); Glow(V(Math.cos(a) * r, Math.sin(a) * r, 7.6), V(rr(8, 20), rr(8, 20), 2), i % 3 ? white : pur, 2); }
      Pyramid(V(0, 0, 1000), V(400, 400, 560), voidc); Pyramid(V(0, 0, 560), V(400, 400, 320), voidc, R(180, 0, 0)); Glow(V(0, 0, 720), V(470, 470, 12), pur, 7); Glow(V(0, 0, 200), V(12, 12, 400), white, 1); L(0, 0, 620, T.lamp, 2800, 3); tall(0, 0, 700);
      for (let q = 0; q < 6; q++) { const a = q / 6 * 6.283, z = 640 + (q % 3) * 90; Oct(V(Math.cos(a) * 560, Math.sin(a) * 560, z), V(70, 70, 110), slab, false, false); Glow(V(Math.cos(a) * 560, Math.sin(a) * 560, z - 70), V(30, 30, 8), pur, 2); }
      for (const [x, y, h] of [[2300, 1800, 160], [-2300, -1800, 160], [-2300, 1800, 80], [2300, -1800, 80]]) {
        plat(x, y, 1300, 1100, h, slab, 0x1a1626, [[0, 0]]);
        for (const e of [-1, 1]) { Glow(V(x, y + e * 540, h + 1.6), V(1280, 12, 2), pur, 0); Glow(V(x + e * 640, y, h + 1.6), V(12, 1080, 2), pur, 0); }
        const mx = x + Math.sign(x) * 440, my = y + Math.sign(y) * 340, mh = h > 100 ? 760 : 1000;
        solid(mx, my, h, 180, 180, mh, voidc, false); deco(mx, my, h, 230, 230, 30, slab); Glow(V(mx - Math.sign(x) * 92, my, h + mh * 0.5), V(6, 30, mh * 0.7), pur, 0); Glow(V(mx, my - Math.sign(y) * 92, h + mh * 0.5), V(30, 6, mh * 0.7), pur, 0); tall(mx, my, 320);
        L(x, y, h + 420, T.lamp, 1500, 1.6);
      }
      for (const [x, y] of [[3900, 0], [-3900, 0], [760, 3000], [-760, 3000], [760, -3000], [-760, -3000]]) {
        solid(x, y, 0, 220, 220, 900, voidc); deco(x, y, 0, 290, 290, 40, slab); const ux = x > 1000 ? -1 : x < -1000 ? 1 : 0, uy = ux ? 0 : -Math.sign(y);
        Glow(V(x + ux * 112, y + uy * 112, 470), ux ? V(6, 34, 640) : V(34, 6, 640), pur, 0); for (let g = 0; g < 4; g++) Glow(V(x + ux * 113, y + uy * 113, 160 + g * 180), ux ? V(6, 90, 14) : V(90, 6, 14), white, 0); tall(x, y, 340);
      }
      // paving thrown up out of the floor: cover, each piece knee to waist high
      for (const [x, y, s, yaw] of [[1450, 520, 210, 18], [-1450, -520, 210, 18], [1500, -700, 180, -24], [-1500, 700, 180, -24], [0, 1900, 220, 40], [0, -1900, 220, 40], [3450, 1500, 200, 12], [-3450, -1500, 200, 12], [3400, -2600, 190, -30], [-3400, 2600, 190, -30]]) {
        Box(V(x, y, s * 0.3), V(s, s, s * 0.6), slab, true, true, yaw); Box(V(x, y, s * 0.6 + 3), V(s - 30, s - 30, 6), 0x1a1626, false, false, yaw); Glow(V(x, y, 2.4), V(s + 50, s + 50, 2), pur, 0, R(0, yaw, 0));
      }
      // pieces that have already let go, hanging high in the air over nothing, each lit from below
      for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + 0.2, r = 1700 + (i % 4) * 620, x = Math.cos(a) * r * 1.05, y = Math.sin(a) * r * 0.9, z = 950 + (i % 5) * 120, s = 90 + (i % 3) * 50; if (out.tall.some((t) => Math.hypot(x - t[0], y - t[1]) < t[2] + 200)) continue; Box(V(x, y, z), V(s, s, s), slab, false, false, i * 23); Glow(V(x, y, z - s * 0.7), V(s * 0.6, s * 0.6, 6), pur, 2); tall(x, y, 260); }
      out.avoid = (x, y) => Math.hypot(x, y) < 900;
      break;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------- THE BOSS FLOORS
// Open ground on purpose: a boss needs room, and so do you. Four pillars to put between you and it, four raised slabs,
// and a floor that says what the place is.
export function craftBoss(which, K) {
  const { M, T, hx, hy, H, rnd, rr } = K;
  const { Box, Glow, Cyl, Oct, Ball, Floor, Lamp } = M;
  const Q = kit(K), { out, L, ring } = Q, s = hx / 4000;
  for (let x = -hx; x < hx - 1; x += 600) for (let y = -hy; y < hy - 1; y += 600) { if (Math.hypot(x + 300, y + 300) < 2300 * s) continue; Floor(V2(x + 6, y + 6), V2(x + 594, y + 594), 1.4, rnd() < 0.12 ? 0x10141a : (Math.round(x / 600) + Math.round(y / 600)) % 2 ? T.floor : T.floor2); }
  if (which === 0) {
    const iron = 0x2a2e30, bone = 0xd8cfb8;
    // the seal: a lid of dark stone the width of the room's middle, ringed and lettered, bolted at eight points
    Cyl(V(0, 0, 1.6), 4500 * s, 2, 0x161c20, false, false);
    ring(0, 0, 2.8, 3600 * s, 30, T.glow, 0x161c20); ring(0, 0, 5.8, 2200 * s, 24, T.glow, 0x161c20);
    for (let q = 0; q < 64; q++) { if (q % 8 === 0) continue; const a = q / 64 * 6.283, r = 2000 * s; Glow(V(Math.cos(a) * r, Math.sin(a) * r, 9), V(rr(120, 220), 26, 2), q % 4 ? T.glow : 0xffffff, 0, R(0, a * 57.3 + 90, 0)); }
    for (let q = 0; q < 8; q++) { const a = q / 8 * 6.283 + 0.39, x = Math.cos(a) * 2000 * s, y = Math.sin(a) * 2000 * s; Oct(V(x, y, 14), V(300, 300, 28), iron, false, false); Cyl(V(x, y, 40), 120, 30, 0x55585f, false, false); Glow(V(x, y, 58), V(60, 60, 8), T.glow, 1); if (q % 2) L(x, y, 220, T.lamp, 1000, 1.6); }
    ring(0, 0, 8.8, 900, 16, 0xffffff, 0x161c20); L(0, 0, 700, T.lamp, 3200, 3);
    // the dead of the upper rooms were stacked against these walls when the seal was set
    for (const sx of [-1, 1]) for (let y = -hy + 420; y < hy - 300; y += 560) {
      if (Math.abs(Math.abs(y) - 500) < 330) continue;
      const x = sx * (hx - 5);
      Box(V(x, y, 520), V(10, 440, 960), 0x12181a, false, false);
      for (let r = 0; r < 6; r++) for (let c = -1; c <= 1; c++) { Ball(V(x - sx * 22, y + c * 136, 130 + r * 150), V(80, 110, 120), bone); Glow(V(x - sx * 54, y + c * 136, 136 + r * 150), V(6, 44, 14), T.glow, 0); }
    }
  } else {
    const voidc = 0x0c0a14, pur = T.glow, white = 0xf0e8ff;
    // the bottom: a ring of broken paving round a well of light, and the room above falling into it very slowly
    Cyl(V(0, 0, 1.6), 4500 * s, 2, 0x0a0812, false, false); ring(0, 0, 2.8, 3300 * s, 30, pur, 0x0a0812); ring(0, 0, 5.8, 1300 * s, 20, pur, 0x0a0812);
    Glow(V(0, 0, 8.6), V(1100, 1100, 2), white, 1); Glow(V(0, 0, H / 2), V(120, 120, H), pur, 1); Glow(V(0, 0, H / 2), V(30, 30, H), white, 1); L(0, 0, 700, T.lamp, 3400, 3);
    for (let q = 0; q < 32; q++) { const a = q / 32 * 6.283; Glow(V(Math.cos(a) * 2200 * s, Math.sin(a) * 2200 * s, 9), V(2200 * s, 8, 2), pur, 0, R(0, a * 57.3, 0)); }
    for (const sx of [-1, 1]) { const x = sx * (hx - 6); [[2400, pur], [2200, voidc], [1800, 0x8a7ab8], [1600, voidc], [1100, pur], [900, voidc], [560, white]].forEach(([d, c], n) => (c === voidc ? Cyl(V(x - sx * (4 + n * 5), 0, 1000), d, 3, c, false, false, R(90, 0, 0)) : Glow(V(x - sx * (4 + n * 5), 0, 1000), V(d, d, 3), c, 1, R(90, 0, 0)))); }
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ THE HOLLOW KING'S DEEP
// The last room is not a room. A causeway runs out from the door to an island of carved stone hanging over a violet
// dark, and out in the dark the King rises (raid.js draws and moves it). On the island: a sigil worked into the floor,
// three pyres on stepped daises joined to it by lines of light, broken columns and fallen drums to hide behind, and a
// balustrade round the lip (solid: you go over it only by jumping, and the deep throws you back if you do). Far off in
// the dark stand the ruins of whatever stood here before.
import { RAID } from './raid.js';
export const RAID_DIMS = [6000, 6000, 7000];
export function craftRaid(K) {
  const { M, T, hx, hy, H, rnd, rr } = K;
  const { Box, Glow, Cyl, Oct, Ball, Floor, Pyramid } = M;
  const Q = kit(K), { out, L, ring, hit, lowWall } = Q;
  const [ix, iy] = RAID.isle, R0 = RAID.R, stone = 0x2c2a34, stone2 = 0x3a3644, dk = 0x141218, glow = 0xa070ff, gold = 0xb8923a, bone = 0xd6ccb4;
  out.noCorners = true;
  Floor(V2(-hx, -hy), V2(hx, hy), 1.0, 0x07050b);                                                     // the dark below
  // the island: a disc of stone, a bright lip, rings and spokes worked into it, the sigil in the middle
  Cyl(V(ix, iy, 1.6), R0 * 2, 2, stone, false, false); ring(ix, iy, 2.8, R0 * 2 - 40, 50, glow, stone);
  for (const [r, w] of [[2900, 30], [2050, 24], [1300, 34], [620, 20]]) ring(ix, iy, 3.2 + r / 1e4, r * 2, w, r === 1300 ? glow : stone2, stone);
  for (let k = 0; k < 36; k++) { const a = (k / 36) * Math.PI * 2, r = k % 3 ? 2470 : 1680, len = k % 3 ? 840 : 760; Box(V(ix + Math.cos(a) * r, iy + Math.sin(a) * r, 3.6), V(len, 16, 2), dk, false, false, (a * 180) / Math.PI); }
  for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; Glow(V(ix + Math.cos(a) * 1000, iy + Math.sin(a) * 1000, 4.4), V(rr(120, 220), 22, 2), k % 3 ? glow : 0xffffff, 0, R(0, (a * 180) / Math.PI + 90, 0)); }
  ring(ix, iy, 5, 360, 30, 0xffffff, stone); Glow(V(ix, iy, 5.2), V(120, 120, 2), glow, 1);
  // lines of light from the sigil out to each pyre
  for (const [x, y] of RAID.pyres) { const dx = x - ix, dy = y - iy, d = Math.hypot(dx, dy), a = (Math.atan2(dy, dx) * 180) / Math.PI; Glow(V(ix + dx * 0.52, iy + dy * 0.52, 4.8), V(d - 1200, 18, 2), 0xffb070, 0, R(0, a, 0)); }
  // the causeway in from the door, kerbed, with a lamp each side at the island end
  const cy0 = iy + R0 - 700; Box(V(0, (cy0 + hy) / 2, 1.8), V(RAID.cause * 2, hy - cy0, 3.6), stone2, false, false);
  for (let y = cy0 + 200; y < hy; y += 280) Box(V(0, y, 4), V(RAID.cause * 2 - 120, 14, 2), dk, false, false);
  for (const e of [-1, 1]) { const x = e * (RAID.cause - 30);
    Box(V(x, (cy0 + hy) / 2, 60), V(50, hy - cy0, 120), stone2, false, false); Box(V(x, (cy0 + hy) / 2, 126), V(80, hy - cy0, 14), gold, false, false);
    M.Solid(V(x, (cy0 + hy) / 2, 700), V(60, hy - cy0, 1400), true);
    for (let y = cy0 + 150; y < hy - 100; y += 380) { Cyl(V(x, y, 80), 70, 160, stone, false, false); Ball(V(x, y, 180), V(60, 60, 60), gold); }
    Cyl(V(x, iy + R0 - 260, 260), 60, 520, dk, false, false); Glow(V(x, iy + R0 - 260, 560), V(46, 46, 60), 0xffc070, 2); L(x, iy + R0 - 260, 600, [1, 0.75, 0.45], 1200, 1.4);
  }
  // the balustrade round the lip: posts, a rail, a cap; a few spans broken (it is still a wall where they are gone)
  const N = 72;
  for (let k = 0; k < N; k++) {
    const a0 = (k / N) * Math.PI * 2, a1 = ((k + 1) / N) * Math.PI * 2, am = (a0 + a1) / 2, r = R0 - 40;
    const x0 = ix + Math.cos(a0) * r, y0 = iy + Math.sin(a0) * r, xm = ix + Math.cos(am) * r, ym = iy + Math.sin(am) * r, len = 2 * r * Math.sin(Math.PI / N) + 4;
    if (Math.abs(xm) < RAID.cause + 40 && ym > iy) continue;   // the causeway comes in here
    Cyl(V(x0, y0, 70), 64, 140, stone2, false, false); Ball(V(x0, y0, 150), V(56, 56, 40), stone2);
    if (k % 11 !== 5) { Box(V(xm, ym, 118), V(len, 46, 22), stone2, false, false, (am * 180) / Math.PI + 90); for (let b = -1; b <= 1; b++) Cyl(V(xm + Math.cos(am + Math.PI / 2) * b * len * 0.3, ym + Math.sin(am + Math.PI / 2) * b * len * 0.3, 55), 26, 110, stone, false, false); }
    else Box(V(xm, ym, 20), V(len * 0.6, 40, 30), stone2, false, false, (am * 180) / Math.PI + 70);   // a broken span: the rail fallen in pieces
    M.Solid(V(xm, ym, 75), V(len + 10, 60, 150), true, (am * 180) / Math.PI + 90);
  }
  // the three pyres: two stepped daises each, a pedestal and a bowl of iron, four candles round the step
  for (const [x, y] of RAID.pyres) {
    Oct(V(x, y, 20), V(600, 600, 40), stone2, true, false); Oct(V(x, y, 60), V(440, 440, 40), stone, true, false); out.tops.push([x + 250, y, 80]);
    Cyl(V(x, y, 120), 130, 80, dk, true, false); Cyl(V(x, y, 166), 280, 26, 0x2a2e30, false, false); Cyl(V(x, y, 182), 300, 10, gold, false, false); Cyl(V(x, y, 178), 220, 12, 0x0e0c10, false, false);
    for (let q = 0; q < 4; q++) { const a = q * 1.571 + 0.785; Q.candle(x + Math.cos(a) * 250, y + Math.sin(a) * 250, 80, 26 + q * 6); }
    hit(x, y, 80, 160, 160, 120, false); L(x, y, 420, [1, 0.62, 0.3], 1600, 2.4);
  }
  // cover: broken columns standing, drums fallen, low ruined walls
  for (let k = 0; k < 6; k++) {
    const a = -Math.PI / 2 + (k - 2.5) * 0.72, r = k % 2 ? 2600 : 2900, x = ix + Math.cos(a) * r, y = iy + Math.sin(a) * r, h = 380 + ((k * 211) % 5) * 160;
    if (Math.min(...RAID.pyres.map(([px, py]) => Math.hypot(px - x, py - y))) < 700) continue;
    Oct(V(x, y, 40), V(380, 380, 80), stone2, true, true); Cyl(V(x, y, 80 + h / 2), 240, h, stone, true, true); Oct(V(x, y, 80 + h), V(300, 300, 50), stone2, false, false);
    for (let q = 0; q < 3; q++) { const ab = a + 0.6 + q * 0.4, d = 300 + q * 220; Cyl(V(x + Math.cos(ab) * d, y + Math.sin(ab) * d, 110), 220, 200, stone, true, true, R(90, (ab * 180) / Math.PI, 0)); }
    if (h > 500) out.tall.push([x, y, 240]);
  }
  for (const [x, y, len, along] of [[-1100, 2400, 700, true], [1150, 2300, 700, true], [-2300, 2300, 600, false], [2300, 2200, 600, false], [0, 1000, 900, true], [-900, -500, 500, false], [900, -500, 500, false]]) {
    lowWall(x, y, len, along, stone2, gold, 130, 80); for (let q = 0; q < 3; q++) Box(V(x + (along ? (q - 1) * len * 0.45 : 70), y + (along ? 70 : (q - 1) * len * 0.45), 20), V(90, 70, 40), stone, false, false, q * 31);
  }
  // in the dark: the ruins of older things, standing and fallen, and rocks hung in the air
  for (const [x, y, w, h, yaw] of [[-4600, -2600, 700, 3800, 8], [4700, -1800, 600, 3200, -6], [-4400, 3400, 800, 2600, 12], [4500, 4000, 500, 3600, -4], [-2600, -5300, 900, 4200, 0], [2900, -5400, 900, 3900, 0]]) {
    Box(V(x, y, h / 2), V(w, w, h), dk, false, false, yaw); Box(V(x, y, h + 60), V(w + 160, w + 160, 120), stone, false, false, yaw);
    for (let z = 500; z < h; z += 700) Box(V(x, y, z), V(w + 40, w + 40, 40), stone2, false, false, yaw);
  }
  Box(V(0, -5700, 3600), V(6200, 600, 500), dk, false, false); for (const e of [-1, 1]) Box(V(e * 2800, -5700, 1800), V(700, 700, 3600), dk, false, false);   // an arch the King once came through
  for (let k = 0; k < 18; k++) { const a = rnd() * Math.PI * 2, r = R0 + 900 + rnd() * 1800, x = ix + Math.cos(a) * r, y = iy + Math.sin(a) * r; if (Math.abs(x) > hx - 300 || Math.abs(y) > hy - 300 || (Math.abs(x) < RAID.cause + 200 && y > iy)) continue; const s = rr(160, 520); Oct(V(x, y, rr(600, 2600)), V(s, s * 0.9, s * 0.7), k % 3 ? dk : stone, false, false, R(rr(0, 40), rr(0, 360), rr(0, 40))); }
  // the light: cold from far above onto the King, warm on the island
  L(0, -3600, 3400, [0.7, 0.6, 1], 7000, 3.6); L(0, -2400, 1800, [0.6, 0.5, 1], 4000, 2.4); L(0, -3000, 600, [0.5, 0.35, 1], 3500, 2.2); L(ix, iy, 1400, [0.7, 0.65, 0.95], 3200, 1.6);
  return out;
}
