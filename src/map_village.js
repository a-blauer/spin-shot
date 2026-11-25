// Thimblewick: the gnome village every run starts from. Built into the Descent's map as one more chunk, far from the
// rooms, so a Descent run starts by walking through the Way Down and ends by coming home, with no loading between.
// Local frame: +Y is north. The road comes in from the south over a humped bridge, through the cobbled square (the well
// in its middle, the challenge board on its east side), and on north to the Way Down, an arch in the hill. The shop is on
// the square's west side, your own cottage (and its wardrobe) south-west, and the Lucky Toadstool, the casino under a
// giant mushroom, stands to the east. Stations and people are added at run time (village.js) from VSPOTS.
import { V, R } from './mapkit.js';
import { shroomHouse, thatchCottage, tree, bush, flower, fence, lanternPost, well, windmill, rock, hill, cabbage, pumpkin, noticeBoard, wardrobeCab, mirror, toadstoolCap, rootPillar, slotMachine, rouletteTable, cardTable, diceTable, hatStand, VC, dark, mix } from './village_shapes.js';
import { awning, barrel, bunting, hay, rug } from './descent_shapes.js';

export const VSIZE = 6000;   // the walkable square, half its side
const STREAM_Y = -3300, CASINO = [3600, -300], GATE = [0, 4900];
// where the village's stations and people stand (local frame; yaw in radians as the player's: Math.PI faces +Y)
export const VSPOTS = {
  spawn: [0, -4700, Math.PI],
  shop: { at: [-1880, 700], npc: [-2230, 700, -Math.PI / 2], yaw: 0 },
  wardrobe: { at: [-2140, -1960], mirror: [-2140, -1440], yaw: 0 },
  board: { at: [1260, 600], npc: [1320, 1080, Math.PI / 2], yaw: 180 },
  gate: { at: [GATE[0], GATE[1] - 100], npc: [560, GATE[1] - 420, 0.3] },
  casino: {
    c: CASINO,
    // at: where you stand to play; table: where the table stands (and how it is turned); npc: the dealer, facing you
    roulette: { at: [CASINO[0] - 380, CASINO[1] - 420], table: [CASINO[0] - 380, CASINO[1] - 640, 0], npc: [CASINO[0] - 380, CASINO[1] - 790, Math.PI] },
    blackjack: { at: [CASINO[0] - 380, CASINO[1] + 380], table: [CASINO[0] - 380, CASINO[1] + 600, 0], npc: [CASINO[0] - 380, CASINO[1] + 780, 0] },
    dice: { at: [CASINO[0] + 420, CASINO[1] - 420], table: [CASINO[0] + 420, CASINO[1] - 620, 0], npc: [CASINO[0] + 420, CASINO[1] - 760, Math.PI] },
    slots: [[CASINO[0] + 620, CASINO[1] + 160], [CASINO[0] + 620, CASINO[1] + 380], [CASINO[0] + 620, CASINO[1] + 600]],
  },
  folk: [[-700, -900, 0.6], [900, -1300, -2.4], [-3300, 2600, 1.2], [2200, 2700, -1], [-600, 3300, 2.6]],
};

export function buildVillage(M, cx, cy) {
  const { Box, Cyl, Glow, Lamp, Ball, Shape, Solid, Blocker, Ramp, Sign, Oct } = M;
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }, rr = (a, b) => a + rnd() * (b - a);
  const S = (pair, x, y, z = 0, yaw = 0, s = 1) => Shape(pair[0], pair[1], V(x, y, z), R(0, yaw, 0), 0xffffff, s);
  const lit = (x, y, z, c = { r: 1, g: 0.78, b: 0.45 }, r = 900) => { Glow(V(x, y, z), V(22, 22, 26), 0xffd27a, 2); Lamp(V(x, y, z + 10), c, 2.2, r, false); };
  const avoid = [];   // circles kept clear of scatter: [x, y, r]
  const clear = (x, y, pad = 0) => Math.abs(x) < VSIZE + 2600 && Math.abs(y) < VSIZE + 2600 && !avoid.some(([ax, ay, r]) => Math.hypot(x - ax, y - ay) < r + pad);
  M.at({ x: cx, y: cy, z: 0, rot: 0 }, () => {
    // ---- the ground: grass, with soft patches of other greens and clover, and the far meadow beyond the fence of trees
    Box(V(0, 0, -60), V(40000, 40000, 120), 0x76a646, true, false);
    for (let i = 0; i < 70; i++) { const x = rr(-9000, 9000), y = rr(-9000, 9000), d = rr(600, 1800); Cyl(V(x, y, 0.4 + (i % 7) * 0.12), d, 1, [0x6e9e42, 0x82b450, 0x7aa84a, 0x8ab85a][i % 4], false, false); }
    // ---- the road and the paths: soft dirt laid as overlapping discs, edged with pebbles
    const path = (pts, w, col = 0xb8996a) => {
      for (let k = 0; k < pts.length - 1; k++) {
        const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / 120));
        for (let i = 0; i < n; i++) {
          const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, d = w * (0.92 + 0.16 * Math.sin(i * 1.7 + k));
          Cyl(V(x, y, 1.6 + (i % 3) * 0.05), d, 1, i % 4 ? col : dark(col, 0.94), false, false);
          if (i % 2 === 0) for (const s of [-1, 1]) { const nx = -(y1 - y0) / L, ny = (x1 - x0) / L, e = s * (w / 2 + rr(-10, 10)); Oct(V(x + nx * e, y + ny * e, 4), V(rr(24, 44), rr(20, 36), 10), mix(VC.stone, VC.stoneD, rnd()), false, false, R(0, rr(0, 90), 0)); }
        }
      }
    };
    path([[0, -6500], [0, STREAM_Y - 700], [0, -1500]], 430);
    path([[0, 1500], [0, GATE[1] - 400]], 430);
    path([[-1500, 600], [-1850, 700]], 360); path([[-1200, -1100], [-2000, -1900]], 300);
    path([[1450, -200], [CASINO[0] - 1500, CASINO[1]]], 380);
    path([[600, 1450], [2200, 2600], [3300, 3200]], 260); path([[-600, 1450], [-1500, 2500], [-3100, 3000]], 260);
    path([[600, -1450], [2000, -2200], [2400, -2300]], 240);
    // ---- the square: cobbles in rings round the well
    avoid.push([0, 0, 1650]);
    Cyl(V(0, 0, 2), 3050, 2, 0x8a847a, false, false);
    for (let r = 120; r < 1500; r += 56) { const n = Math.round((2 * Math.PI * r) / 58); for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + r, c = mix(0xa49d90, 0x8a8478, (Math.sin(i * 3.1 + r) + 1) / 2); Oct(V(Math.cos(a) * r, Math.sin(a) * r, 4), V(50, 44, 6), c, false, false, R(0, (a * 180) / Math.PI, 0)); } }
    for (let i = 0; i < 96; i++) { const a = (i / 96) * Math.PI * 2; Oct(V(Math.cos(a) * 1530, Math.sin(a) * 1530, 6), V(110, 70, 12), mix(0x8a8478, 0x6a645a, (i % 3) / 2), false, false, R(0, (a * 180) / Math.PI + 90, 0)); }   // a kerb of long stones round the edge
    S(well(), 0, 0, 0, 0); Cyl(V(0, 0, 60), 200, 120, 0x000000, false, false); Solid(V(0, 0, 160), V(200, 200, 320), true);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4, x = Math.cos(a) * 1420, y = Math.sin(a) * 1420; S(lanternPost(320, i), x, y, 0, (a * 180) / Math.PI + 180); Solid(V(x, y, 160), V(24, 24, 320), false); lit(x - Math.cos(a) * 62, y - Math.sin(a) * 62, 262); }
    // bunting across the square, from lamp to lamp
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4, b = a + Math.PI / 2, x0 = Math.cos(a) * 1420, y0 = Math.sin(a) * 1420, x1 = Math.cos(b) * 1420, y1 = Math.sin(b) * 1420; const [k, bf] = bunting([x1 - x0, y1 - y0, 0], 160, [0xc8392e, 0xf6d04a, 0x3a7ac8, 0xf4ecd6, 0x5a9a3a]); Shape(k, bf, V(x0, y0, 300), R(0, 0, 0)); }
    // benches round the well
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2, x = Math.cos(a) * 520, y = Math.sin(a) * 520, yaw = (a * 180) / Math.PI + 90; Box(V(x, y, 44), V(220, 56, 10), VC.woodL, true, false, yaw); for (const s of [-1, 1]) Box(V(x + Math.cos(a + Math.PI / 2) * s * 90, y + Math.sin(a + Math.PI / 2) * s * 90, 20), V(14, 50, 40), VC.woodD, false, false, yaw); Box(V(x + Math.cos(a) * 26, y + Math.sin(a) * 26, 76), V(220, 8, 50), VC.woodL, false, false, yaw); }
    // a signpost at the south edge of the square
    { const x = 480, y = -1600; Cyl(V(x, y, 150), 18, 300, VC.wood, true, false); Ball(V(x, y, 305), V(26, 26, 26), VC.red);
      for (const [z, yaw, t] of [[260, 90, 'THE WAY DOWN'], [220, 180, 'SHOP'], [180, 0, 'CASINO'], [140, 210, 'HOME']]) { const a = (yaw * Math.PI) / 180; Box(V(x + Math.cos(a) * 70, y + Math.sin(a) * 70, z), V(150, 8, 30), VC.cream2, false, false, yaw); Sign(V(x + Math.cos(a) * 70 - Math.sin(a) * 5, y + Math.sin(a) * 70 + Math.cos(a) * 5, z), yaw - 90, t, { r: 0.35, g: 0.22, b: 0.12 }, 16); } }

    // ---- the stream, across the whole valley, with a humped bridge for the road
    { const pts = []; for (let x = -11000; x <= 11000; x += 160) pts.push([x, STREAM_Y + Math.sin(x * 0.0006) * 380 + Math.sin(x * 0.0017) * 120]);
      for (const [x, y] of pts) { Cyl(V(x, y, 1.2), 560, 1, 0x4a8aa0, false, false); Cyl(V(x, y, 2.2), 420, 1, 0x5a9ab0, false, false); }
      for (let i = 0; i < pts.length; i += 2) for (const s of [-1, 1]) { const [x, y] = pts[i]; if (Math.abs(x) < 400) continue; if (rnd() < 0.55) Oct(V(x + rr(-60, 60), y + s * rr(250, 300), 8), V(rr(50, 110), rr(40, 90), rr(14, 30)), mix(VC.stone, VC.moss, rnd() * 0.4), false, false, R(0, rr(0, 90), 0)); if (rnd() < 0.3) for (let k = 0; k < 4; k++) Cyl(V(x + rr(-40, 40), y + s * rr(220, 280), 50), 5, rr(70, 130), 0x6a8a3a, false, false); }
      for (let i = 0; i < 26; i++) { const [x, y] = pts[Math.floor(rnd() * pts.length)]; if (Math.abs(x) > 600) Cyl(V(x + rr(-120, 120), y + rr(-120, 120), 3.2), rr(50, 80), 1.4, 0x5a9a3a, false, false); }
      avoid.push([0, STREAM_Y, 700]);
      // the bridge: up, a deck, down again; stone footings and a lamp at each end
      const y0 = STREAM_Y - 620, y1 = STREAM_Y - 220, y2 = STREAM_Y + 220, y3 = STREAM_Y + 620, top = 80;
      Ramp(V(0, y0, 0), V(0, y1, top), 440, VC.woodL); Ramp(V(0, y3, 0), V(0, y2, top), 440, VC.woodL); Box(V(0, STREAM_Y, top - 14), V(440, y2 - y1 + 20, 28), VC.woodL, true, false);
      for (let y = y0 + 30; y < y3; y += 44) Box(V(0, y, (y < y1 ? ((y - y0) / (y1 - y0)) * top : y > y2 ? ((y3 - y) / (y3 - y2)) * top : top) + 1), V(450, 8, 4), VC.woodD, false, false);
      for (const sx of [-1, 1]) { for (const y of [y1, y2]) Oct(V(sx * 200, y, 30), V(110, 110, 70), VC.stone, true, false); for (let y = y0; y <= y3; y += 160) { const h = (y < y1 ? ((y - y0) / (y1 - y0)) * top : y > y2 ? ((y3 - y) / (y3 - y2)) * top : top); Cyl(V(sx * 224, y, h + 45), 14, 90, VC.woodD, true, false); } Box(V(sx * 224, STREAM_Y, top + 88), V(12, y2 - y1, 10), VC.wood, false, false); }
      for (const [x, y] of [[-300, y0 - 60], [300, y3 + 60]]) { S(lanternPost(300, 2), x, y, 0, x < 0 ? 0 : 180); Solid(V(x, y, 150), V(24, 24, 300), false); lit(x + (x < 0 ? 62 : -62), y, 242); } }

    // ---- the shop: Bramble & Bolt, a red-capped cottage on the square's west side, its counter out front
    { const [x, y] = [-2700, 700]; S(shroomHouse(520, 330, 0xc8392e, VC.cream, 3), x, y, 0, 0); Solid(V(x, y, 260), V(700, 700, 520), true); avoid.push([x, y, 900]);
      for (const [a, z] of [[50, 218], [-50, 218], [130, 322]]) { const ar = (a * Math.PI) / 180; Glow(V(x + Math.cos(ar) * 352, y + Math.sin(ar) * 352, z), V(10, 50, 50), 0xffd27a, 0, R(0, a, 0)); }
      const ct = [-2060, 700]; Box(V(ct[0], ct[1], 42), V(90, 620, 84), VC.woodL, true, true); Box(V(ct[0] + 4, ct[1], 88), V(110, 650, 12), VC.woodD, false, false);
      for (let i = 0; i < 6; i++) Box(V(ct[0] + 46, ct[1] - 270 + i * 108, 42), V(4, 80, 64), dark(VC.woodL, 0.85), false, false);
      { const [k, b] = awning(760, 300, 70, 0xc8392e, 0xf4ecd6, 8); Shape(k, b, V(ct[0] - 110, ct[1], 330), R(0, -90, 0)); }
      for (const s of [-1, 1]) Cyl(V(ct[0] + 40, ct[1] + s * 370, 160), 16, 320, VC.woodD, true, false);
      // on the counter: a brass till, a pile of hats, a lantern; a hat stand and a rack of guns on either side
      Box(V(ct[0], ct[1] + 220, 116), V(50, 70, 44), VC.brass, false, false); Box(V(ct[0], ct[1] + 220, 144), V(40, 60, 14), dark(VC.brass, 0.7), false, false);
      for (let i = 0; i < 3; i++) Cyl(V(ct[0], ct[1] - 200 + i * 10, 100 + i * 14), 60 - i * 8, 12, [0xc8392e, 0x3a6a8a, 0x5a8a3a][i], false, false);
      Glow(V(ct[0], ct[1] - 290, 126), V(20, 20, 28), 0xffd27a, 2); Lamp(V(ct[0] + 60, ct[1], 260), { r: 1, g: 0.8, b: 0.5 }, 2, 700, false);
      S(hatStand(), ct[0] + 120, ct[1] + 470, 0, 0); Solid(V(ct[0] + 120, ct[1] + 470, 90), V(60, 60, 180), false);
      { const gx = ct[0] + 110, gy = ct[1] - 470; Box(V(gx, gy, 90), V(30, 160, 180), VC.woodD, true, false); for (let i = 0; i < 4; i++) { Box(V(gx + 20, gy - 60 + i * 40, 100), V(8, 10, 130), VC.iron, false, false); Box(V(gx + 22, gy - 60 + i * 40, 60), V(10, 16, 36), VC.wood, false, false); } }
      Box(V(x + 420, y, 470), V(10, 360, 70), VC.woodD, false, false); Sign(V(x + 427, y, 470), 0, 'BRAMBLE & BOLT', { r: 1, g: 0.85, b: 0.5 }, 30);
      for (const [dx, dy] of [[160, -520], [230, -470]]) { const [k, b] = barrel(0x7a5232, 0x2a2420); Shape(k, b, V(x + dx, y + dy, 0), R(0, dx, 0)); Solid(V(x + dx, y + dy, 55), V(84, 84, 110), true); }
      Box(V(x + 200, y + 560, 45), V(90, 90, 90), VC.woodL, true, true); Box(V(x + 210, y + 560, 120), V(70, 70, 60), VC.wood, true, true); }

    // ---- home: your thatched cottage, a porch with the wardrobe and a mirror on it, a washing line, a garden
    { const [x, y] = [-2900, -1700]; S(thatchCottage(720, 560, 330, VC.cream, 2), x, y, 0, 0); Solid(V(x, y, 250), V(760, 600, 500), true); avoid.push([x, y, 950]);
      for (const s of [-1, 1]) Glow(V(x + 372, y + s * 168, 182), V(6, 80, 66), 0xffd27a, 0);
      Box(V(-2280, -1700, 12), V(420, 820, 24), VC.woodL, true, false); for (let i = 0; i < 9; i++) Box(V(-2280 + (i - 4) * 46, -1700, 25), V(4, 820, 2), VC.woodD, false, false);
      for (const s of [-1, 1]) Cyl(V(-2080, -1700 + s * 400, 140), 16, 280, VC.woodD, true, false);
      S(wardrobeCab(), -2180, -1960, 24, 0); Solid(V(-2180, -1960, 150), V(90, 180, 290), true);
      S(mirror(), -2160, -1440, 24, 0); Solid(V(-2165, -1440, 120), V(30, 120, 240), false);
      Box(V(-2020, -1240, 70), V(40, 40, 140), VC.woodD, true, false); Box(V(-2020, -1240, 160), V(60, 36, 40), 0x3a6a8a, false, false); Sign(V(-1988, -1240, 160), 0, 'HOME', { r: 1, g: 0.95, b: 0.8 }, 16);
      Glow(V(-2090, -1260, 250), V(20, 20, 24), 0xffd27a, 2); Lamp(V(-2090, -1260, 260), { r: 1, g: 0.8, b: 0.5 }, 2, 600, false);
      // the washing line, from the cottage corner to a post
      Cyl(V(-3500, -2300, 120), 12, 240, VC.woodD, true, false); Cyl(V(-3500, -1000, 120), 12, 240, VC.woodD, true, false); Box(V(-3500, -1650, 226), V(2, 1300, 2), 0xd8d0c0, false, false);
      for (let i = 0; i < 6; i++) Box(V(-3500, -2150 + i * 200, 190 - (i % 2) * 10), V(4, rr(70, 110), rr(60, 90)), [0xc8392e, 0xf4ecd6, 0x3a7ac8, 0xf6d04a, 0x5a9a3a, 0xa070d0][i], false, false);
      // the garden: rows of cabbages and pumpkins in dark soil, a fence round it
      Box(V(-3400, -3000 + 700, 2), V(900, 500, 3), 0x5a3e2a, false, false);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) { const px = -3780 + c * 150, py = -2460 + r * 140; if (r === 1) S(pumpkin(rr(32, 46)), px, py, 0, rr(0, 360)); else S(cabbage(rr(22, 30)), px, py, 0, rr(0, 360)); }
      for (const [fx, fy, yaw, len] of [[-3400, -2560, 0, 940], [-3400, -2040, 0, 940], [-3870, -2300, 90, 520]]) { S(fence(len), fx, fy, 0, yaw); Solid(V(fx, fy, 45), yaw ? V(12, len, 90) : V(len, 12, 90), false); }
      avoid.push([-3400, -2300, 600]); }

    // ---- the challenge board on the square's east side, under its own little roof
    { const [x, y] = [1300, 600]; S(noticeBoard(320), x, y, 0, 180); Solid(V(x, y, 170), V(40, 360, 340), true); avoid.push([x, y, 400]);
      Sign(V(x - 20, y, 370), 180, 'CHALLENGE BOARD', { r: 1, g: 0.9, b: 0.6 }, 22); lit(x - 70, y + 220, 300); }

    // ---- the Lucky Toadstool: a giant cap on twisted roots, a wooden floor, lamps under the gills, the tables
    { const [x, y] = CASINO, Rr = 1400; avoid.push([x, y, Rr + 300]);
      S(toadstoolCap(Rr, 650, 0xb82a2a), x, y, 620, 0);
      Cyl(V(x, y, 9), Rr * 2 - 100, 18, 0x7a4a2a, true, false); Cyl(V(x, y, 19), Rr * 2 - 160, 2, 0x8a5a34, false, false);
      for (let r = 300; r < Rr - 80; r += 130) Cyl(V(x, y, 20 + (r % 3) * 0.1), r * 2, 1, r % 260 ? 0x7a4a2a : 0x6a3e24, false, false);
      Cyl(V(x, y, 21), 1400, 1, 0x7a1a1a, false, false); Cyl(V(x, y, 21.4), 1300, 1, 0x9a2a22, false, false);
      for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + 0.45, px = x + Math.cos(a) * (Rr - 260), py = y + Math.sin(a) * (Rr - 260); if (Math.cos(a) < -0.8) continue; S(rootPillar(620, i), px, py, 18, (a * 180) / Math.PI); Solid(V(px, py, 320), V(110, 110, 640), true); }
      // lanterns hanging under the cap, and a ring of little bulbs round its rim
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, r = i % 3 ? 900 : 450, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; Box(V(px, py, 560), V(3, 3, 80), VC.iron, false, false); Glow(V(px, py, 505), V(34, 34, 42), i % 2 ? 0xffc46a : 0xff8a5a, 2); Lamp(V(px, py, 500), { r: 1, g: 0.7, b: 0.45 }, 2, 900, false); }
      for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; Glow(V(x + Math.cos(a) * (Rr + 6), y + Math.sin(a) * (Rr + 6), 572), V(12, 12, 12), i % 2 ? 0xfff0a0 : 0xff6a4a, 2); }
      // the entrance arch to the west, with the sign
      const ex = x - Rr - 60; for (const s of [-1, 1]) { Cyl(V(ex, y + s * 330, 200), 50, 400, VC.woodD, true, false); Glow(V(ex, y + s * 330, 420), V(40, 40, 40), 0xffd27a, 2); }
      Box(V(ex, y, 440), V(30, 760, 90), 0x6a1a1a, false, false); Box(V(ex - 2, y, 440), V(34, 780, 10), VC.brass, false, false); Box(V(ex - 2, y, 396), V(34, 780, 6), VC.brass, false, false);
      Sign(V(ex - 18, y, 446), 180, 'THE LUCKY TOADSTOOL', { r: 1, g: 0.86, b: 0.4 }, 34);
      for (let i = 0; i < 12; i++) Glow(V(ex - 18, y - 330 + i * 60, 486), V(10, 10, 10), i % 2 ? 0xfff0a0 : 0xff6a4a, 2);
      Box(V(ex + 260, y, 23), V(560, 220, 1), 0x9a2a22, false, false);
      // the tables and machines, and the stools in front of them
      const C = VSPOTS.casino;
      { const [tx, ty] = C.roulette.table; S(rouletteTable(), tx, ty, 18, 0); Solid(V(tx, ty, 70), V(320, 200, 130), true); }
      { const [tx, ty] = C.blackjack.table; S(cardTable(true), tx, ty, 18, -90); Solid(V(tx, ty, 60), V(260, 260, 110), true); }
      { const [tx, ty] = C.dice.table; S(diceTable(), tx, ty, 18, 0); Solid(V(tx, ty, 70), V(290, 150, 130), true); }
      C.slots.forEach(([sx, sy], i) => { S(slotMachine([0xb8282a, 0x2a6aa8, 0x3a8a4a][i]), sx + 80, sy, 18, 180); Solid(V(sx + 80, sy, 120), V(80, 90, 240), true); Glow(V(sx + 47, sy, 184), V(4, 60, 36), 0xfff0c0, 0); });
      for (const T of [C.roulette, C.blackjack, C.dice]) for (const s of [-1, 1]) { const sx = T.at[0] + s * 110, sy = T.at[1]; Cyl(V(sx, sy, 50), 44, 8, 0x9a2a22, false, false); Cyl(V(sx, sy, 32), 10, 46, VC.brass, false, false); Cyl(V(sx, sy, 20), 36, 4, VC.brass, false, false); }
      // a little bar at the back: a counter, bottles, a stack of chips
      Box(V(x + 1050, y - 200, 55), V(100, 500, 110), VC.woodD, true, true); Box(V(x + 1050, y - 200, 114), V(120, 520, 10), VC.brass, false, false);
      for (let i = 0; i < 7; i++) Cyl(V(x + 1080, y - 400 + i * 60, 140), 16, 40, [0x2a6a3a, 0x8a2a2a, 0xc8a24a, 0x3a4a8a][i % 4], false, false); }

    // ---- the Way Down: a hill of rock at the north end, the arch (village.js lights it) set into it, lamps either side
    { const [x, y] = GATE; avoid.push([x, y, 900]);
      // a knoll of mossy boulders the arch is set into: a ring of them either side, and the big ones behind and above
      for (let i = 0; i < 16; i++) { const side = i < 8 ? -1 : 1, k = i % 8, ax = side * (520 + k * 300 + rr(-60, 60)), ay = y + 200 + k * 70 + rr(0, 160), r = rr(440, 700) - k * 10; S(rock(r, i), ax, ay, -r * 0.2, rr(0, 360)); Solid(V(ax, ay, r * 0.35), V(r * 1.5, r * 1.2, r * 1.0), true, rr(0, 90)); }
      for (let i = 0; i < 7; i++) { const ax = (i - 3) * 330 + rr(-60, 60), ay = y + 640 + rr(0, 260), r = rr(620, 860); S(rock(r, 20 + i), ax, ay, r * 0.15 + (3 - Math.abs(i - 3)) * 60, rr(0, 360)); Solid(V(ax, ay, r * 0.6), V(r * 1.5, r * 1.2, r * 1.2), true); }
      for (const s of [-1, 1]) { S(rock(380, 30 + s), x + s * 420, y + 260, 260, s * 40); S(tree(900, VC.leaf2, 77 + s, 0), x + s * 900, y + 900, 520, 0); }
      Box(V(x, y + 190, 430), V(700, 200, 860), mix(VC.stoneD, 0x5a564e, 0.5), true, true);   // the rock face right behind the arch
      for (let k = 0; k < 9; k++) Box(V(x, y - 80 - k * 40, 2 + k * 0.01), V(700 - k * 20, 40, 2), mix(VC.stone, VC.stoneD, (k % 2) * 0.4), false, false);
      for (const s of [-1, 1]) { S(lanternPost(360, s + 2), x + s * 640, y - 300, 0, s < 0 ? 0 : 180); Solid(V(x + s * 640, y - 300, 180), V(24, 24, 360), false); lit(x + s * 640 + (s < 0 ? 62 : -62), y - 300, 302, { r: 1, g: 0.8, b: 0.4 }, 1100); }
      for (let i = 0; i < 10; i++) { const [k, b] = flower(rr(40, 70), [0xf08aa8, 0xf6d04a, 0xffffff, 0xa070d0][i % 4], 0xf6c43a, i); Shape(k, b, V(x + (i < 5 ? -1 : 1) * rr(450, 560), y - 140 + rr(-60, 60), 0), R(0, rr(0, 360), 0)); } }

    // ---- other cottages, the windmill, the pond
    const houses = [[2500, -2350, 380, 250, 0x3a6a9a, 150], [2600, 2500, 460, 290, 0xd8a030, 200], [-4300, -500, 420, 270, 0x8a4aa0, 20], [-1400, -4500, 360, 240, 0xc8392e, 60], [1800, -4700, 400, 260, 0x5a8a3a, 120]];
    houses.forEach(([x, y, h, r, cap, yaw], i) => { S(shroomHouse(h, r, cap, i % 2 ? VC.cream2 : VC.cream, 10 + i), x, y, 0, yaw); Solid(V(x, y, h / 2), V(r * 2.2, r * 2.2, h), true); avoid.push([x, y, r * 2.4]); const a = (yaw * Math.PI) / 180; Glow(V(x + Math.cos(a + 0.87) * (r * 1.06 + 4), y + Math.sin(a + 0.87) * (r * 1.06 + 4), h * 0.42), V(8, 44, 44), 0xffd27a, 0, R(0, yaw + 50, 0)); });
    { const [x, y] = [-3900, 3300]; S(thatchCottage(640, 520, 300, 0xead8b8, 4), x, y, 0, -20); Solid(V(x, y, 220), V(680, 560, 440), true, -20); avoid.push([x, y, 800]); }
    { const [x, y] = [3900, 3500]; S(windmill(1100), x, y, 0, 200); Solid(V(x, y, 550), V(440, 440, 1100), true); avoid.push([x, y, 600]); }
    { const [x, y] = [-1900, 3000], r = 650; avoid.push([x, y, r + 150]);
      Cyl(V(x, y, 1.1), r * 2 + 80, 1, 0x7a6a4a, false, false); Cyl(V(x, y, 2.2), r * 2, 1, 0x3e7a8a, false, false); Cyl(V(x, y, 2.6), r * 1.5, 1, 0x4a8aa0, false, false);
      for (let i = 0; i < 9; i++) { const a = rnd() * 6.28, d = rnd() * r * 0.8; Cyl(V(x + Math.cos(a) * d, y + Math.sin(a) * d, 3.4), rr(60, 100), 1.4, 0x5a9a3a, false, false); if (i % 3 === 0) Ball(V(x + Math.cos(a) * d + 10, y + Math.sin(a) * d, 10), V(18, 18, 14), 0xf08aa8); }
      for (let i = 0; i < 30; i++) { const a = rnd() * 6.28, d = r + rr(-30, 30); Cyl(V(x + Math.cos(a) * d, y + Math.sin(a) * d, 60), 6, rr(80, 150), 0x6a8a3a, false, false); if (i % 4 === 0) Box(V(x + Math.cos(a) * d, y + Math.sin(a) * d, rr(120, 160)), V(10, 10, 30), 0x6a4a2a, false, false); }
      for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.28 + 0.2; S(rock(rr(40, 80), 40 + i), x + Math.cos(a) * (r + 40), y + Math.sin(a) * (r + 40), 0, rr(0, 360)); }
      // a little dock, and a frog on a stone
      Box(V(x + r - 120, y - 80, 30), V(360, 160, 10), VC.woodL, true, false); for (const s of [-1, 1]) Cyl(V(x + r - 260, y - 80 + s * 70, 20), 12, 60, VC.woodD, false, false);
      Ball(V(x - 200, y + 160, 22), V(80, 70, 40), VC.stone); Ball(V(x - 200, y + 160, 58), V(44, 38, 30), 0x5a9a3a); for (const s of [-1, 1]) Ball(V(x - 186, y + 160 + s * 12, 74), V(12, 12, 12), 0xf4ecd6); }

    // ---- lantern posts along the road north and south
    for (const [x, y, side] of [[-300, -2300, -1], [300, -2300, 1], [-300, 2200, -1], [300, 3200, 1], [-300, 4000, -1], [300, -5600, 1]]) { S(lanternPost(300, Math.abs(y) % 4), x, y, 0, side < 0 ? 0 : 180); Solid(V(x, y, 150), V(24, 24, 300), false); lit(x + (side < 0 ? 62 : -62), y, 242); }
    // fences along the road through the meadow south of the stream
    for (const s of [-1, 1]) for (const y of [-4200, -5100]) { S(fence(700, 0xe8dcc0), s * 620, y, 0, 90); Solid(V(s * 620, y, 45), V(12, 700, 90), false); }

    // ---- scatter: trees, bushes, flowers, rocks, hay, all kept off the paths and the buildings
    const onPath = (x, y) => (Math.abs(x) < 380 && y > -6600 && y < GATE[1]) || Math.hypot(x, y) < 1700;
    const place = (n, pad, fn) => { for (let i = 0, t = 0; i < n && t < n * 30; t++) { const x = rr(-VSIZE - 2400, VSIZE + 2400), y = rr(-VSIZE - 2400, VSIZE + 2400); if (onPath(x, y) || !clear(x, y, pad)) continue; fn(x, y, i); avoid.push([x, y, pad * 0.6]); i++; } };
    // the wood round the village: a ring of big trees and firs beyond the walkable square
    for (let i = 0; i < 120; i++) { const a = (i / 120) * Math.PI * 2 + rr(-0.02, 0.02), d = rr(6300, 8600), ca = Math.cos(a), sa = Math.sin(a), k = Math.max(Math.abs(ca), Math.abs(sa)), x = (ca / k) * d * 0.98, y = (sa / k) * d * 0.98; const fir = rnd() < 0.4, h = fir ? rr(1100, 1700) : rr(900, 1400); S(tree(h, [VC.leaf, VC.leaf2, VC.leaf3][i % 3], i, fir ? 1 : 0), x, y, 0, rr(0, 360)); }
    place(34, 420, (x, y, i) => { const fir = i % 5 === 0, h = fir ? rr(800, 1200) : rr(650, 1050); S(tree(h, [VC.leaf, VC.leaf2, mix(VC.leaf, 0xa8a040, 0.3)][i % 3], 200 + i, fir ? 1 : 0), x, y, 0, rr(0, 360)); Solid(V(x, y, 300), V(h * 0.1, h * 0.1, 600), true); });
    place(70, 160, (x, y, i) => { S(bush(rr(70, 140), [VC.leaf2, VC.leaf, mix(VC.leaf2, 0x9ac050, 0.4)][i % 3], i % 3 === 0 ? [0xd8302a, 0xf08aa8, 0xf6f0e0][i % 3 === 0 ? (i / 3) % 3 | 0 : 0] : 0, i), x, y, 0, rr(0, 360)); });
    place(26, 260, (x, y, i) => { const r = rr(80, 200); S(rock(r, 60 + i), x, y, -r * 0.15, rr(0, 360)); if (r > 120) Solid(V(x, y, r * 0.3), V(r * 1.4, r * 1.1, r * 0.7), true); });
    place(14, 260, (x, y, i) => { const h = rr(180, 320); S(flower(h, [0xf08aa8, 0xf6d04a, 0x6a9ae0, 0xa070d0, 0xffffff][i % 5], 0xf6c43a, i, 5 + (i % 3)), x, y, 0, rr(0, 360)); Solid(V(x, y, h / 2), V(20, 20, h), false); });
    place(240, 40, (x, y, i) => { const [k, b] = flower(rr(26, 50), [0xf08aa8, 0xf6d04a, 0x6a9ae0, 0xa070d0, 0xffffff, 0xff8a4a][i % 6], [0xf6c43a, 0x5a3a22][i % 2], i, 5 + (i % 2)); Shape(k, b, V(x, y, 0), R(0, rr(0, 360), 0)); });
    place(5, 300, (x, y, i) => { const [k, b] = hay(0xd8b060); Shape(k, b, V(x, y, 0), R(0, rr(0, 360), 0)); Solid(V(x, y, 60), V(150, 150, 120), true); });
    // ---- the far hills, and a blue haze of distant ridges
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2 + rr(-0.1, 0.1), d = rr(13000, 17000); S(hill(rr(4000, 7000), rr(2500, 4000), rr(1600, 3200), [0x6e9a44, 0x7aa64c, 0x628c3e][i % 3]), Math.cos(a) * d, Math.sin(a) * d, -400, (a * 180) / Math.PI); }
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.3, d = rr(21000, 26000); S(hill(rr(7000, 10000), rr(3000, 5000), rr(3500, 6000), 0x7a9aa8), Math.cos(a) * d, Math.sin(a) * d, -800, (a * 180) / Math.PI); }
    // ---- the edge: nobody walks out of the valley
    for (const s of [-1, 1]) { Blocker(V(s * (VSIZE + 400), 0, 1500), V(200, VSIZE * 2 + 1200, 3000)); Blocker(V(0, s * (VSIZE + 400), 1500), V(VSIZE * 2 + 1200, 200, 3000)); }
  });
}
