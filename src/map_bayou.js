// MOURNING BAYOU. The fourth map: a drowned parish round a black lagoon.
// Six districts in a ring about the water, so there are always two ways on: the steamer landing (start), a shanty town
// of boardwalk lanes (tight), a boneyard of raised tombs (tight), the cypress deep (open, flooded), the gator flats
// (open marsh) and a moonshiners' camp. You can see - and shoot - across the lagoon, but nothing walks on it.
import * as THREE from 'three';
import { V, V2, R, LC, FMath } from './mapkit.js';
import { mapKit, rgb } from './mapx.js';

const MUD = 0x3a3a2a, GRASS = 0x3e4a2c, WATER = 0x14241c, ALGAE = 0x16341f, PLANK = 0x5e5040, PLANK_D = 0x43382c, BARK = 0x4a4234, BARK_D = 0x38322a, LEAF = 0x263a24, MOSS = 0x6a7a5a, LAMP = 0xFFB45A, WISP = 0x5aa02a;
const rr = (a, b) => FMath.FRandRange(a, b);

// the islands (the six districts and the chapel hump), and the planks that join them
const ISLES = [[-2500, -6200, 2500, -1200], [-8400, -6200, -3900, -700], [-8400, 700, -3900, 6200], [-2500, 2200, 2500, 6200], [3900, 700, 8400, 6200], [3900, -6200, 8400, -700], [-700, 0, 700, 1200]];
const SPANS = [[-3900, -4400, -2500, -4000], [2500, -4400, 3900, -4000], [-6350, -700, -5950, 700], [5950, -700, 6350, 700], [-3900, 4000, -2500, 4400], [2500, 4000, 3900, 4400],
  [-200, 1200, 200, 2200], [1900, -1200, 2300, 400], [700, 400, 2300, 800]];
// 0 dry land, 1 shallows you can wade (slowly), 2 deep water: nothing crosses it
export function bayouWater(x, y) {
  if (Math.abs(x) > 9300 || Math.abs(y) > 7100) return 0;
  for (const [x0, y0, x1, y1] of SPANS) if (x >= x0 - 30 && x <= x1 + 30 && y >= y0 - 30 && y <= y1 + 30) return 0;
  for (let i = 0; i < ISLES.length; i++) { const [x0, y0, x1, y1] = ISLES[i]; if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return i === 3 ? 1 : 0; }
  return 2;
}
export function buildBayou(M) {
  const { Box, BoxRot, Glow, Cyl, Ball, ConeShape, Ramp, Floor, Wall, Lamp, Sign, Barrel, Crate, Station, WallBuy, Door, SpawnAt, Pyramid, Oct, Ring, AddZone, DeadTree, Wagon, GM } = M;
  const K = mapKit(M);
  GM.navInit(-9900, -7700, 9900, 7700, 100);
  const wallbuy = (name, x, y, yaw) => { const n = [Math.cos(yaw * Math.PI / 180), Math.sin(yaw * Math.PI / 180)]; Box(V(x - n[0] * 4, y - n[1] * 4, 150), Math.abs(n[0]) > 0.5 ? V(12, 300, 230) : V(300, 12, 230), PLANK_D, false, false); WallBuy(name, V(x, y, 0), yaw); };
  // a bald cypress: a flared, buttressed foot, knees round it, a flat crown hung with moss
  const cypress = (x, y, h, d, solid = true) => {
    Cyl(V(x, y, 40), d * 1.9, 80, BARK_D, solid, solid); Cyl(V(x, y, 120), d * 1.4, 100, BARK, solid, false); Cyl(V(x, y, h / 2), d, h, BARK, solid, false);
    for (let i = 0; i < 5; i++) { const a = i * 1.257 + rr(-0.3, 0.3), r = d * rr(1.3, 2.0); ConeShape(V(x + Math.cos(a) * r, y + Math.sin(a) * r, 30), V(d * 0.3, d * 0.3, rr(50, 110)), BARK_D, false); }
    for (let i = 0; i < 4; i++) { const a = i * 1.571 + rr(-0.4, 0.4), r = i === 0 ? 0 : d * 1.6; Ball(V(x + Math.cos(a) * r, y + Math.sin(a) * r, h + (i === 0 ? d * 0.5 : rr(-80, 40))), V(d * rr(3.4, 4.6), d * rr(3.4, 4.6), d * 1.5), i % 2 ? LEAF : 0x1e3020); }
    for (let i = 0; i < 7; i++) { const a = rr(0, 6.283), r = d * rr(1.0, 2.6), l = rr(140, 420); Box(V(x + Math.cos(a) * r, y + Math.sin(a) * r, h - 60 - l / 2), V(10, 26, l), MOSS, false, false, rr(0, 180)); }
  };
  const water = (x0, y0, x1, y1, n = 6) => { Floor(V2(x0, y0), V2(x1, y1), 2, WATER); for (let i = 0; i < n; i++) Glow(V(rr(x0 + 150, x1 - 150), rr(y0 + 150, y1 - 150), 3.2), V(rr(180, 460), rr(120, 300), 1), i % 3 ? ALGAE : 0x1e4020, 1); for (let i = 0; i < n; i++) { const x = rr(x0 + 100, x1 - 100), y = rr(y0 + 100, y1 - 100); Cyl(V(x, y, 3.6), rr(60, 110), 1, 0x3a5a2a, false, false); } };
  const boardwalk = (x0, y0, x1, y1) => { Floor(V2(x0, y0), V2(x1, y1), 3, PLANK); const ax = x1 - x0 > y1 - y0; for (let t = (ax ? x0 : y0) + 60; t < (ax ? x1 : y1); t += 110) Floor(ax ? V2(t, y0) : V2(x0, t), ax ? V2(t + 5, y1) : V2(x1, t + 5), 3.6, PLANK_D); };
  const wisp = (x, y, z) => { Glow(V(x, y, z), V(26, 26, 30), WISP, 2); Lamp(V(x, y, z), LC(0.6, 1, 0.35), 8, 700, false); };
  const tomb = (x, y, kind, yaw = 0) => {
    const ST = [0x8a8a7a, 0x7a7c70, 0x96947f][kind % 3], w = kind === 1 ? 340 : 300, d = kind === 1 ? 520 : 480, h = kind === 1 ? 330 : kind === 2 ? 150 : 220;
    Box(V(x, y, 14), V(w + 50, d + 50, 28), 0x5e5e52, true, true); Box(V(x, y, h / 2 + 20), V(w, d, h), ST, true, true);
    if (kind === 2) { Box(V(x, y, h + 28), V(w + 30, d + 30, 16), 0x6a6a5e, true, false); Box(V(x, y - d / 2 + 30, h + 96), V(16, 16, 120), ST, false, false); Box(V(x, y - d / 2 + 30, h + 116), V(70, 16, 16), ST, false, false); }
    else { for (const s of [-1, 1]) BoxRot(V(x + s * (w / 4 + 6), y, h + 20 + 44), V(w / 2 + 40, d + 30, 14), 0x6a6a5e, R(-s * 26, 0, 0), true); for (const s of [-1, 1]) Pyramid(V(x, y + s * (d / 2 - 4), h + 54), V(w, 10, 76), ST); }
    if (kind === 1) { Glow(V(x, y - d / 2 - 2, 130), V(90, 5, 190), 0x16301e); Box(V(x, y - d / 2 - 4, 130), V(110, 6, 210), 0x2a2a26, false, false); for (const s of [-1, 1]) Cyl(V(x + s * 130, y - d / 2 - 14, h / 2 + 20), 34, h, 0x9a9886, false, false); }
    Glow(V(x + rr(-90, 90), y - d / 2 - 30, 36), V(8, 8, 18), LAMP); Cyl(V(x, y - d / 2 - 30, 14), 10, 28, 0xe8e2d0, false, false);
    M.SurfaceDecal('D_Grime', V(x, y - d / 2 - 1, h * 0.4), V(0, -1, 0), V2(w * 0.9, h * 0.7), 0, [0, 0, 0, 0.35], 'fx');
  };

  // ------------------------------------------------------------------ zones
  // The parish is six islands in black water. The channels between them are too deep to wade: the only ways across are
  // the plank bridges, one to a channel, and the causeways out to the drowned chapel in the middle of the lagoon.
  const Z0 = AddZone('The Landing', V2(-3200, -7100), V2(3200, 1400));
  const Z1 = AddZone('Shanty Town', V2(-9300, -7100), V2(-3200, 0));
  const Z2 = AddZone('The Boneyard', V2(-9300, 0), V2(-3200, 7100));
  const Z3 = AddZone('Cypress Deep', V2(-3200, 1400), V2(3200, 7100));
  const Z4 = AddZone('Gator Flats', V2(3200, 0), V2(9300, 7100));
  const Z5 = AddZone('The Still', V2(3200, -7100), V2(9300, 0));
  M.Districts([['The Landing', [Z0]], ['Shanty Town', [Z1]], ['The Boneyard', [Z2]], ['Cypress Deep', [Z3]], ['Gator Flats', [Z4]], ['The Still', [Z5]]]);

  // ------------------------------------------------------------------ water, islands, the tree line
  Box(V(0, 0, -50), V(19800, 15400, 100), 0x0e1a16, true, false);
  const TINT = [MUD, MUD, 0x3a4030, 0x2a3626, 0x40442a, 0x443c2a, 0x34382a];
  ISLES.forEach(([x0, y0, x1, y1], i) => {
    Floor(V2(x0, y0), V2(x1, y1), 1, TINT[i]);
    // the bank: a dark rim of mud, reeds standing in it, a few cypress knees
    for (const [ax, ay, bx, by] of [[x0, y0, x1, y0], [x0, y1, x1, y1], [x0, y0, x0, y1], [x1, y0, x1, y1]]) {
      const hz = ay === by, len = hz ? bx - ax : by - ay; Floor(hz ? V2(ax - 60, ay - 70) : V2(ax - 70, ay - 60), hz ? V2(bx + 60, ay + 70) : V2(ax + 70, by + 60), 1.3, 0x2a2a1e);
      for (let t = 90; t < len; t += rr(150, 300)) { const x = hz ? ax + t : ax + rr(-50, 50), y = hz ? ay + rr(-50, 50) : ay + t; if (SPANS.some(([sx0, sy0, sx1, sy1]) => x > sx0 - 150 && x < sx1 + 150 && y > sy0 - 150 && y < sy1 + 150)) continue; for (let k = 0; k < 4; k++) ConeShape(V(x + rr(-60, 60), y + rr(-60, 60), rr(70, 130)), V(14, 14, rr(150, 260)), k % 2 ? 0x4a5a2a : 0x5a6a34, false); if (Math.random() < 0.3) ConeShape(V(x + rr(-40, 40), y + rr(-40, 40), 34), V(40, 40, rr(60, 110)), BARK_D, false); }
    }
  });
  for (let i = 0; i < 150; i++) { const x = rr(-9200, 9200), y = rr(-7000, 7000); if (bayouWater(x, y) !== 2) continue; if (i % 3) Glow(V(x, y, 1.2), V(rr(200, 600), rr(120, 320), 1), i % 2 ? ALGAE : 0x1e4020, 1); else { Cyl(V(x, y, 1.6), rr(60, 120), 1, 0x3a5a2a, false, false); if (i % 5 === 0) Glow(V(x, y, 10), V(18, 18, 14), 0xb8a888, 2); } }
  for (const [a, b] of [[V2(-9300, -7100), V2(-9300, 7100)], [V2(9300, -7100), V2(9300, 7100)], [V2(-9300, -7100), V2(9300, -7100)], [V2(-9300, 7100), V2(9300, 7100)]]) Wall(a, b, 950, 200, 0x1a241c, [], true, 0x24321f);
  for (let t = -9000; t <= 9000; t += 620) { cypress(t + rr(-120, 120), -7040, rr(900, 1150), rr(190, 260), false); cypress(t + rr(-120, 120), 7040, rr(900, 1150), rr(190, 260), false); }
  for (let t = -6600; t <= 6600; t += 620) { cypress(-9240, t + rr(-120, 120), rr(900, 1150), rr(190, 260), false); cypress(9240, t + rr(-120, 120), rr(900, 1150), rr(190, 260), false); }
  K.cliffs(-9400, -7100, -9400, 7100, 900, [0x1a2a1c, 0x16241a, 0x203222], 0, 520); K.cliffs(9400, -7100, 9400, 7100, 900, [0x1a2a1c, 0x16241a, 0x203222], 0, 520); K.cliffs(-9300, -7200, 9300, -7200, 900, [0x1a2a1c, 0x16241a, 0x203222], 0, 520); K.cliffs(-9300, 7200, 9300, 7200, 900, [0x1a2a1c, 0x16241a, 0x203222], 0, 520);
  // nothing walks the bottom: every stretch of open water is closed to the dead as well
  for (let x = -9300; x < 9300; x += 100) for (let y = -7100; y < 7100; y += 100) if (bayouWater(x + 50, y + 50) === 2) GM.NavBlockBox({ min: V(x + 2, y + 2, 0), max: V(x + 98, y + 98, 100) }, 1);
  // bridges and causeways: planks on piles, a rope rail, a lantern at each end
  for (const [x0, y0, x1, y1] of SPANS) {
    boardwalk(x0, y0, x1, y1); const hz = x1 - x0 > y1 - y0, len = hz ? x1 - x0 : y1 - y0;
    for (let t = 0; t <= len; t += len / Math.max(2, Math.round(len / 280))) for (const s of [0, 1]) { const x = hz ? x0 + t : (s ? x1 : x0), y = hz ? (s ? y1 : y0) : y0 + t; Cyl(V(x, y, 30), 30, 160, BARK_D, false, false); }
    // a rope rail on posts each side, left open wherever another walk joins this one. Nothing holds you on: mind the edge.
    for (const s of [0, 1]) {
      const fix = hz ? (s ? y1 : y0) : (s ? x1 : x0); let cuts = [[hz ? x0 : y0, hz ? x1 : y1]];
      for (const O of SPANS) { if (O[0] === x0 && O[1] === y0 && O[2] === x1) continue; const [a0, a1, b0, b1] = hz ? [O[0], O[2], O[1], O[3]] : [O[1], O[3], O[0], O[2]]; if (fix <= b0 - 5 || fix >= b1 + 5) continue; cuts = cuts.flatMap(([p, q]) => (a1 <= p || a0 >= q ? [[p, q]] : [[p, Math.min(q, a0)], [Math.max(p, a1), q]].filter(([u, v]) => v - u > 40))); }
      for (const [p, q] of cuts) Box(hz ? V((p + q) / 2, fix, 96) : V(fix, (p + q) / 2, 96), hz ? V(q - p, 8, 8) : V(8, q - p, 8), 0x7a6a4a, false, false);
    }
    K.lantern(hz ? x0 + 40 : x0 - 20, hz ? y0 - 20 : y0 + 40, 190, LAMP, 700); K.lantern(hz ? x1 - 40 : x1 + 20, hz ? y1 + 20 : y1 - 40, 190, 0x8ad04a, 700);
  }
  const DOORS = [[-3200, -4200, 0, 1500, Z0, Z1], [3200, -4200, 0, 1500, Z0, Z5], [-6150, 0, 90, 2500, Z1, Z2], [6150, 0, 90, 2500, Z5, Z4], [-3200, 4200, 0, 3500, Z2, Z3], [3200, 4200, 0, 3500, Z4, Z3], [0, 1700, 90, 3000, Z0, Z3]];
  for (const [x, y, yaw] of DOORS) { const ax = yaw === 90; for (const s of [-1, 1]) { Cyl(V(x + (ax ? s * 232 : 0), y + (ax ? 0 : s * 232), 300), 70, 600, BARK, true, false); K.lantern(x + (ax ? s * 232 : 90), y + (ax ? 90 : s * 232), 520, s > 0 ? LAMP : 0x8ad04a, 700); } Box(V(x, y, 600), ax ? V(560, 50, 40) : V(50, 560, 40), BARK_D, false, false); for (let i = 0; i < 5; i++) Box(V(x + (ax ? -180 + i * 90 : 0), y + (ax ? 0 : -180 + i * 90), 560 - rr(20, 60)), V(8, 22, rr(60, 150)), MOSS, false, false, ax ? 0 : 90); }
  // an island cannot be reached until its bridge is paid for, whichever way you come at it
  for (const [mx, my, len, dx] of [[-3200, -3550, 7100, 0], [-3200, 700, 1400, 0], [-3200, 4250, 5700, 0], [3200, -3550, 7100, 0], [3200, 700, 1400, 0], [3200, 4250, 5700, 0], [-6250, 0, 6100, 1], [6250, 0, 6100, 1], [0, 1400, 6400, 1]]) M.world.ZoneCeiling(V2(mx, my), len, 60, 0, V(dx, dx ? 0 : 1, 0));
  // the drowned chapel: what is left of it stands on a hump of ground in the middle of the lagoon
  {
    const ST = 0x7a7c70, cx = 0, cy = 600;
    for (const [x, y, w, d, h] of [[-520, 1000, 60, 360, 520], [520, 1000, 60, 360, 300], [0, 1160, 1100, 60, 620], [-520, 300, 60, 300, 180]]) { Box(V(cx + x, y, h / 2), V(w, d, h), ST, true, true); Box(V(cx + x, y, h + 8), V(w + 20, d + 20, 16), 0x4a5a2a, false, false); }
    Box(V(cx, 1130, 520), V(240, 30, 360), 0x16301e, false, false); Glow(V(cx, 1112, 520), V(170, 6, 290), 0x2a6a4a); Box(V(cx, 1100, 300), V(16, 16, 520), 0x5e5e52, false, false); Box(V(cx, 1100, 430), V(200, 16, 16), 0x5e5e52, false, false);
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { Box(V(cx + s * 260, 420 + k * 220, 34), V(300, 60, 12), PLANK_D, true, false); Box(V(cx + s * 260, 444 + k * 220, 60), V(300, 10, 50), PLANK_D, false, false); }
    Box(V(cx, 940, 60), V(260, 120, 120), ST, true, true); Box(V(cx, 940, 126), V(290, 150, 12), 0x8a8a7a, false, false); for (const s of [-1, 1]) { Cyl(V(cx + s * 90, 940, 160), 16, 60, 0xe8e2d0, false, false); Glow(V(cx + s * 90, 940, 200), V(10, 10, 20), LAMP); }
    Lamp(V(cx, 900, 260), LC(1, 0.75, 0.4), 10, 1000, false); cypress(-560, 60, 880, 200, false); cypress(600, 140, 760, 170, false); wisp(-300, 200, 180); wisp(420, 760, 230);
    Sign(V(cx, 1126, 250), -90, 'ST. MOURN', { r: 0.7, g: 0.8, b: 0.7 }, 44);
    for (const [x, y] of [[-560, 520], [560, 480]]) SpawnAt(V(x, y, 0), Z0);
  }
  for (const [x, y, h, d] of [[-1700, -300, 900, 220], [1500, 1700, 1000, 250], [-1500, 1500, 820, 190], [1300, -700, 760, 170]]) cypress(x, y, h, d, false);   // old trees standing out in the lagoon
  wisp(-1300, 500, 150); wisp(1300, 300, 210); wisp(-2000, 1900, 240); wisp(2300, 1500, 160); wisp(-3200, -1800, 200); wisp(3200, 2600, 190); wisp(-6000, 0, 220); wisp(7300, 0, 180);
  // ------------------------------------------------------------------ 0. THE LANDING (the dock, and the Belle Mourn aground against it)
  M.at({ y: -700 }, () => {
    // the steamer: hull, a white cabin deck with her name on the wheel house, twin stacks, the wheel itself astern
    const sy = -950, HULL = 0x3a2e26, WHITE = 0xbcb6a2;
    Box(V(0, sy, 80), V(2600, 600, 160), HULL, true, true); Box(V(0, sy, 163), V(2620, 620, 8), PLANK, false, false); BoxRot(V(1300, sy, 80), V(424, 424, 160), HULL, R(0, 45, 0), true); BoxRot(V(1300, sy, 163), V(430, 430, 8), PLANK, R(0, 45, 0), false);
    Box(V(100, sy, 300), V(1500, 320, 270), WHITE, true, false); Box(V(100, sy, 444), V(1640, 430, 14), 0x2e2a2a, true, false); Box(V(100, sy - 205, 470), V(1640, 8, 50), WHITE, false, false);
    for (let i = 0; i < 8; i++) { const x = -560 + i * 190; Glow(V(x, sy - 162, 320), V(80, 5, 110), i % 3 === 1 ? LAMP : 0x2a2420); Box(V(x, sy - 164, 258), V(100, 6, 8), 0x2e2a2a, false, false); Box(V(x + 95, sy - 205, 304), V(10, 10, 270), 0x8a8474, false, false); }
    Box(V(520, sy, 540), V(280, 250, 170), WHITE, true, false); Box(V(520, sy, 632), V(330, 300, 14), 0x2e2a2a, false, false); Glow(V(520, sy - 127, 560), V(200, 5, 70), LAMP); Glow(V(662, sy, 560), V(5, 180, 70), 0x2a2420);
    for (const s of [-1, 1]) { Cyl(V(-150, sy + s * 90, 760), 100, 620, 0x18181c, true, false); for (const z of [640, 900]) Cyl(V(-150, sy + s * 90, z), 110, 30, 0x7a2a22, false, false); for (let k = 0; k < 8; k++) { const a = k * 0.785; ConeShape(V(-150 + Math.cos(a) * 52, sy + s * 90 + Math.sin(a) * 52, 1100), V(30, 30, 60), 0x18181c, false); } }
    Box(V(-150, sy, 940), V(20, 200, 14), 0x18181c, false, false);
    { const x = -1560; for (const s of [-1, 1]) { Ring(V(x, sy + s * 200, 250), V(640, 34, 640), 0x6a2a22, R(0, 0, 0)); for (let k = 0; k < 4; k++) BoxRot(V(x, sy + s * 200, 250), V(600, 14, 20), 0x6a2a22, R(k * 45, 0, 0), false); } for (let k = 0; k < 8; k++) { const a = k * 0.785; BoxRot(V(x + Math.cos(a) * 280, sy, 250 + Math.sin(a) * 280), V(110, 420, 14), 0x5a4a3a, R(k * 45 + 90, 0, 0), false); } Cyl(V(x, sy, 250), 60, 460, 0x33363c, false, false, R(0, 0, 90)); Box(V(-1280, sy, 330), V(160, 640, 340), WHITE, true, false); M.Blocker(V(x, sy, 300), V(660, 480, 600)); GM.NavBlockBox({ min: V(x - 330, sy - 240, 0), max: V(x + 330, sy + 240, 150) }, 1); }
    Sign(V(-1280, sy - 324, 380), -90, 'BELLE MOURN', { r: 0.2, g: 0.16, b: 0.14 }, 44); Sign(V(0, sy - 304, 100), -90, 'BELLE  MOURN', { r: 0.8, g: 0.74, b: 0.6 }, 40);
    for (let x = -1200; x <= 1200; x += 200) { Box(V(x, sy - 292, 210), V(10, 10, 90), 0x8a8474, false, false); if (x < 1200 && (x < 600 || x >= 800)) Box(V(x + 100, sy - 292, 252), V(200, 8, 8), 0x8a8474, false, false); }
    Ramp(V(700, -1780, 0), V(700, -1250, 160), 220, PLANK); K.lantern(1150, sy - 200, 330, LAMP, 900); K.lantern(-900, sy - 250, 330, LAMP, 900);
    Crate(V(1050, sy + 140, 164), 110); Barrel(V(-1000, sy - 160, 164), 0x5a4a3a); Barrel(V(-1090, sy - 100, 164), 0x4a3a30);
    // the dock: planks over the mud, bollards, cargo that never got loaded
    boardwalk(-1700, -2200, 1700, -1260); for (let x = -1600; x <= 1600; x += 400) { Cyl(V(x, -1300, 40), 44, 80, BARK_D, true, false); Cyl(V(x, -1300, 84), 56, 10, 0x33363c, false, false); }
    for (const [x, y] of [[-1300, -1700], [-1180, -1660], [-1300, -1560]]) { Box(V(x, y, 60), V(150, 110, 120), 0xcfc8b4, true, true, rr(-8, 8)); Box(V(x, y, 60), V(156, 12, 124), 0x6a5a40, false, false, 0); }
    Crate(V(1350, -1650, 0), 140); Crate(V(1500, -1700, 0), 110); Crate(V(1350, -1650, 140), 100); Barrel(V(1150, -1900, 0), 0x5a4a3a); Barrel(V(1260, -1960, 0), 0x6a3a2a); Barrel(V(-900, -2050, 0), 0x4a3a30);
    K.cabin(-2250, -2150, -1850, -1750, 240, 0x5a5244, 0x6a3a26, { door: 0, glow: LAMP, chimney: false, rise: 110 }); Sign(V(-1844, -1950, 300), 0, 'FERRY', { r: 0.9, g: 0.84, b: 0.7 }, 40);
    for (const s of [-1, 1]) Box(V(300 + s * 220, -2120, 110), V(12, 12, 220), PLANK_D, true, false); Box(V(300, -2120, 214), V(460, 8, 8), PLANK_D, false, false); for (let i = 0; i < 9; i++) Box(V(120 + i * 45, -2120, 140 + (i % 2) * 10), V(4, 4, 140), 0x7a7a6a, false, false);
    // the road south, and what is left on it
    Floor(V2(-260, -5400), V2(260, -2200), 1.5, 0x4a4030); Wagon(V(1500, -4300, 0), 30);
    for (const [x, y, h, d] of [[-1800, -3000, 880, 230], [1900, -2900, 940, 250], [-900, -4500, 820, 200], [1100, -5000, 900, 230], [-2000, -5000, 860, 210], [2100, -4400, 800, 190]]) cypress(x, y, h, d);
    for (const [x, y] of [[-300, -2700], [300, -3700], [-300, -4700], [1700, -2300], [-1700, -2350]]) K.post(x, y, 400, LAMP, PLANK_D, 1000);
    water(-2400, -4400, -1300, -3800, 3); water(1300, -3700, 2400, -3100, 3); water(600, -5400, 1700, -4700, 3);
    Station('HighRoller', V(-420, -2080, 0), -90, 2500, -1, 'Workbench'); Station('AmmoCrate', V(-1000, -1420, 0), -90, 250, -1, 'Ammo');
    wallbuy('Saloon Six', -2464, -2500, 0); wallbuy("Hornet's Nest", 2464, -4600, 180);
    for (const [x, y] of [[-2200, -5200], [2200, -5200], [-2250, -1500], [2250, -1650], [0, -5250], [2250, -2500]]) SpawnAt(V(x, y, 0), Z0);
    M.Spawn(V(0, -3200, 100));
    M.Decor(V2(-2400, -5400), V2(2400, -2300), 60, ['P_Grass_0', 'P_Grass_1', 'P_Grass_2', 'P_Bush', 'D_Grime', 'P_Bones']);
  });

  // ------------------------------------------------------------------ 1. SHANTY TOWN (boardwalk lanes between stilt shacks)
  M.at({ x: -1400, y: -700 }, () => {
    const XS = [[-6700, -5900], [-5300, -4500], [-3900, -3100]], YS = [[-5300, -4400], [-3800, -2900], [-2300, -1400]];
    const WALLS = [0x5a5244, 0x4e4a3e, 0x64553f, 0x4a5048], ROOFS = [0x6a3a26, 0x5a5e60, 0x4a3a30];
    water(-6950, -5450, -2550, -50, 0); for (let i = 0; i < 14; i++) Glow(V(rr(-6900, -2600), rr(-5400, -100), 3.2), V(rr(180, 420), rr(120, 300), 1), i % 3 ? ALGAE : 0x1e4020, 1);
    boardwalk(-5900, -5450, -5300, -1400); boardwalk(-4500, -5450, -3900, -1400); boardwalk(-3100, -5450, -2560, -60); boardwalk(-6950, -4400, -3100, -3800); boardwalk(-6950, -2900, -3100, -2300); boardwalk(-6950, -1400, -3100, -60);
    XS.forEach(([x0, x1], i) => YS.forEach(([y0, y1], j) => {
      if (i === 1 && j === 1) return;   // the middle plot is the drying yard
      const door = j === 2 ? 90 : (i + j) % 2 ? 0 : 180, wall = WALLS[(i * 3 + j) % 4];
      K.cabin(x0, y0, x1, y1, 270, wall, ROOFS[(i + j * 2) % 3], { door, glow: LAMP, dark: (i + j) % 3 === 0, chimney: (i + j) % 2 === 0, logs: (wall & 0xfefefe) >> 1, rise: 150 });
      const n = [Math.round(Math.cos(door * 0.01745)), Math.round(Math.sin(door * 0.01745))], fx = n[0] ? (n[0] > 0 ? x1 : x0) : (x0 + x1) / 2, fy = n[1] ? (n[1] > 0 ? y1 : y0) : (y0 + y1) / 2;
      for (const s of [-1, 1]) Box(V(fx + n[0] * 90 + (n[0] ? 0 : s * 240), fy + n[1] * 90 + (n[1] ? 0 : s * 240), 150), V(16, 16, 300), PLANK_D, false, false);
      Box(V(fx + n[0] * 60, fy + n[1] * 60, 296), n[0] ? V(130, 560, 10) : V(560, 130, 10), ROOFS[(i + j * 2) % 3], false, false); K.lantern(fx + n[0] * 90, fy + n[1] * 90, 280, LAMP, 600);
      if ((i + j) % 2) { Barrel(V(fx + n[0] * 60 - n[1] * 300, fy + n[1] * 60 + n[0] * 300, 0), 0x4a3a30); } else Crate(V(fx + n[0] * 70 + n[1] * 300, fy + n[1] * 70 - n[0] * 300, 0), 90);
    }));
    // the drying yard: racks of fish, a great cypress coming up through the boards, a boat on trestles
    boardwalk(-5300, -3800, -4500, -2900); cypress(-4900, -3350, 900, 240);
    for (const y of [-3650, -3050]) { for (const s of [-1, 1]) Box(V(-5000 + s * 220, y, 110), V(12, 12, 220), PLANK_D, true, false); Box(V(-5000, y, 214), V(460, 8, 8), PLANK_D, false, false); for (let i = 0; i < 8; i++) Box(V(-5180 + i * 52, y, 160), V(16, 5, 80), 0x8a9a9a, false, false); }
    // the yard at the north end: the well, a cook fire, a skiff hauled out
    Cyl(V(-5600, -700, 50), 200, 100, 0x6a6a5e, true, true); Cyl(V(-5600, -700, 102), 160, 6, 0x0e1a16, false, false); for (const s of [-1, 1]) Box(V(-5600 + s * 110, -700, 170), V(14, 14, 240), PLANK_D, false, false); Box(V(-5600, -700, 290), V(260, 20, 14), PLANK_D, false, false); Box(V(-5600, -700, 220), V(4, 4, 130), 0x7a6a4a, false, false);
    for (let k = 0; k < 6; k++) { const a = k * 1.047; Box(V(-3900 + Math.cos(a) * 70, -650 + Math.sin(a) * 70, 14), V(90, 22, 22), BARK_D, false, false, k * 60 + 90); } Glow(V(-3900, -650, 30), V(50, 50, 40), 0xFF6A2A, 3); Lamp(V(-3900, -650, 60), LC(1, 0.5, 0.2), 12, 1100, false);
    BoxRot(V(-6500, -700, 70), V(520, 170, 80), 0x5a4632, R(0, 20, 8), true); K.solid(-6500, -700, 20, 520, 170, 150); for (const s of [-1, 1]) Box(V(-6500 + s * 160, -700 + s * 56, 24), V(30, 200, 48), PLANK_D, false, false);
    for (const [x, y] of [[-6820, -5000], [-6820, -3350], [-6820, -1850]]) { Barrel(V(x, y, 0), 0x4a3a30); Crate(V(x - 20, y + 140, 0), 100); }
    for (const [x, y] of [[-5600, -4100], [-4200, -2600], [-2800, -1000], [-4700, -400], [-6800, -2600]]) K.post(x, y, 380, LAMP, PLANK_D, 900);
    wallbuy('Sawbuck', -6896, -4100, 0); wallbuy('Homesteader', -3500, -36, -90);
    for (const [x, y] of [[-6800, -4150], [-5600, -5350], [-4200, -5350], [-2800, -5250], [-6800, -300], [-3300, -300], [-2800, -2000], [-5600, -2600]]) SpawnAt(V(x, y, 0), Z1);
  });

  // ------------------------------------------------------------------ 2. THE BONEYARD (the dead are buried above the water line here)
  M.at({ x: -1400, y: 700 }, () => {
    const CX = [-6300, -5500, -4700, -3900, -3100], RY = [700, 1700, 2700, 3700];
    CX.forEach((x, i) => RY.forEach((y, j) => { if (j === 3 && i < 2) return; if (i === 2 && j === 2) return; tomb(x, y, (i * 2 + j) % 3); }));
    // the oak in the middle, older than the parish
    { const x = -4700, y = 2700; Cyl(V(x, y, 30), 420, 60, BARK_D, true, true); Cyl(V(x, y, 260), 240, 520, BARK, true, false); for (let i = 0; i < 5; i++) { const a = i * 1.257; BoxRot(V(x + Math.cos(a) * 210, y + Math.sin(a) * 210, 620), V(520, 60, 60), BARK, R(26, a * 57.3, 0), false); Ball(V(x + Math.cos(a) * 420, y + Math.sin(a) * 420, 760), V(520, 520, 260), i % 2 ? LEAF : 0x1e3020); for (let k = 0; k < 3; k++) Box(V(x + Math.cos(a) * rr(260, 520), y + Math.sin(a) * rr(260, 520), 560), V(10, 26, rr(180, 360)), MOSS, false, false, rr(0, 180)); } Ball(V(x, y, 860), V(620, 620, 300), LEAF); }
    // the chapel: white boards gone green, a steeple, one window lit from inside by nothing you would want to meet
    K.cabin(-6650, 4350, -5450, 5250, 430, 0xa8a694, 0x2a2a30, { door: -90, glow: 0x2a8a5a, chimney: false, rise: 300, doorCol: 0x2a1e18 });
    Box(V(-6050, 4250, 420), V(300, 220, 840), 0xa8a694, true, true); Pyramid(V(-6050, 4250, 1010), V(340, 260, 340), 0x2a2a30); Box(V(-6050, 4250, 1250), V(14, 14, 160), 0x2a2a30, false, false); Box(V(-6050, 4250, 1280), V(80, 14, 14), 0x2a2a30, false, false);
    Glow(V(-6050, 4138, 600), V(110, 5, 170), 0x2a8a5a); Box(V(-6050, 4137, 110), V(120, 6, 220), 0x2a1e18, false, false); ConeShape(V(-6050, 4180, 760), V(120, 120, 110), 0x8a6a2a, false);
    // an open grave, the spoil beside it, the spade still in
    Floor(V2(-3600, 4500), V2(-3300, 5000), 2.5, 0x0e0e0c); Ball(V(-3100, 4750, 20), V(360, 520, 180), 0x3a3226); BoxRot(V(-3200, 4560, 90), V(8, 8, 190), PLANK_D, R(0, 0, 14), false);
    // iron railings along the lane to the water
    for (let y = 300; y <= 5200; y += 140) { if (Math.abs(y - 3500) < 420) continue; Box(V(-2640, y, 90), V(8, 8, 180), 0x1c1c1c, false, false); ConeShape(V(-2640, y, 190), V(18, 18, 30), 0x1c1c1c, false); } Box(V(-2640, 1700, 150), V(6, 2900, 6), 0x1c1c1c, false, false); Box(V(-2640, 4560, 150), V(6, 1300, 6), 0x1c1c1c, false, false);
    for (const [x, y, h, d] of [[-6700, 1200, 820, 200], [-6750, 3000, 900, 230], [-3500, 5150, 780, 180]]) cypress(x, y, h, d);
    wisp(-5900, 1200, 160); wisp(-4300, 3200, 200); wisp(-3500, 2200, 150); wisp(-5100, 4500, 220);
    for (const [x, y] of [[-5900, 300], [-3500, 300], [-5900, 3200], [-4300, 4300]]) K.post(x, y, 380, 0x8ad04a, 0x2a2a26, 900);
    Sign(V(-6050, 4136, 380), -90, 'ST. MOURN', { r: 0.2, g: 0.2, b: 0.18 }, 34);
    wallbuy('Dynamite Dan', -6896, 2200, 0); wallbuy('Iron Mule', -4300, 5396, -90);
    for (const [x, y] of [[-6800, 300], [-6820, 2200], [-2850, 5200], [-4300, 5200], [-2850, 350], [-6850, 3800], [-5100, 3200]]) SpawnAt(V(x, y, 0), Z2);
    M.Decor(V2(-6900, 100), V2(-2700, 5400), 70, ['P_Grass_0', 'P_Grass_1', 'P_Bones', 'D_Grime', 'P_Bush', 'P_Bones']);
  });

  // ------------------------------------------------------------------ 3. CYPRESS DEEP (open: knee-deep black water under very old trees)
  M.at({ y: 700 }, () => {
    water(-2400, 1600, 2400, 5400, 22);
    for (const [x, y, h, d] of [[-1800, 2400, 1100, 420], [-600, 2100, 1000, 340], [900, 2500, 1150, 460], [1900, 2000, 980, 320], [-1900, 4200, 1050, 380], [-300, 4700, 1100, 440], [1200, 4400, 1000, 360], [2000, 3500, 1080, 400], [200, 3300, 950, 300], [-1100, 3300, 1020, 340]]) cypress(x, y, h, d);
    // a windfall across the middle: over it or round it
    Cyl(V(-200, 3900, 130), 260, 1500, BARK, true, false, R(90, 18, 0)); Cyl(V(-940, 3660, 150), 520, 60, BARK_D, false, false, R(90, 18, 0)); for (let i = 0; i < 6; i++) BoxRot(V(-940, 3660, 150), V(20, 20, rr(400, 700)), BARK_D, R(rr(0, 360), 18, rr(60, 120)), false);
    M.BlockerYaw(V(-200, 3900, 130), V(1500, 260, 260), 18); GM.NavBlockBox({ min: V(-920, 3620, 0), max: V(520, 4180, 150) }, 1);
    // the parish bell, where the flood left it; a pirogue with a hole in her
    ConeShape(V(1500, 3300, 110), V(300, 300, 280), 0x8a6a2a, false, R(28, 40, 0)); Oct(V(1500, 3300, 60), V(240, 240, 120), 0x7a5a22, true, true);
    BoxRot(V(-1500, 5000, 40), V(460, 130, 70), 0x5a4632, R(0, -30, 10), true); BoxRot(V(600, 1900, 40), V(460, 130, 70), 0x4a3a2a, R(0, 70, -8), true); K.solid(-1500, 5000, -30, 460, 130, 150); K.solid(600, 1900, 70, 460, 130, 150);
    for (const [x, y, z] of [[-1300, 2800, 180], [400, 2700, 240], [1500, 3900, 160], [-700, 5100, 220], [2100, 4900, 190], [-2100, 3300, 230], [800, 5100, 170]]) wisp(x, y, z);
    wallbuy('Frostbite Beam', 300, 5396, -90); wallbuy('Back-Alley', -2464, 2300, 0);
    for (const [x, y] of [[-2200, 5200], [2200, 5200], [0, 5250], [-2200, 1900], [2200, 1900], [900, 3500], [-1300, 4500]]) SpawnAt(V(x, y, 0), Z3);
    M.Decor(V2(-2400, 1600), V2(2400, 5400), 40, ['P_Grass_2', 'P_Bones', 'P_Grass_0']);
  });

  // ------------------------------------------------------------------ 4. GATOR FLATS (open marsh: nests, a blind, something very large that died here)
  M.at({ x: 1400, y: 700 }, () => {
    water(2700, 300, 4300, 1900, 5); water(4900, 2300, 6800, 3900, 6); water(2800, 3700, 4200, 5300, 5); water(5200, 400, 6700, 1500, 4);
    for (const [x, y, s] of [[4700, 1300, 1.0], [3300, 2800, 1.2], [5900, 4600, 1.1], [6400, 2000, 0.9]]) {   // nests: a mound of rotting reed, eggs in the top
      Ball(V(x, y, 20 * s), V(520 * s, 460 * s, 240 * s), 0x4a4a2c, false); Oct(V(x, y, 50 * s), V(300 * s, 300 * s, 100 * s), 0x3e3e26, true, true);
      for (let i = 0; i < 6; i++) { const a = i * 1.047; Ball(V(x + Math.cos(a) * 70 * s, y + Math.sin(a) * 60 * s, 118 * s), V(60 * s, 50 * s, 70 * s), i % 3 ? 0xd8d4c0 : 0xb8b49a); }
      for (let i = 0; i < 9; i++) ConeShape(V(x + rr(-260, 260) * s, y + rr(-240, 240) * s, 80), V(14, 14, rr(140, 220)), 0x5a6a3a, false);
    }
    // the ribs: whatever it was, it came out of the lagoon a long time ago
    for (let i = 0; i < 7; i++) { const x = 3600 + i * 190, h = 420 - Math.abs(i - 3) * 50; for (const s of [-1, 1]) { BoxRot(V(x, 4350 + s * 150, h * 0.5), V(40, 40, h), 0xcfc8b0, R(0, 0, -s * 18), i % 2 === 0); BoxRot(V(x, 4350 + s * 60, h * 0.96), V(36, 200, 36), 0xcfc8b0, R(0, 0, s * 20), false); } Box(V(x, 4350, 30), V(110, 90, 60), 0xb8b29a, false, false); }
    Oct(V(3300, 4350, 110), V(360, 300, 220), 0xcfc8b0, true, true); for (const s of [-1, 1]) { Glow(V(3180, 4350 + s * 80, 150), V(8, 60, 60), 0x16160f); ConeShape(V(3160, 4350 + s * 110, 40), V(40, 40, 110), 0xe8e2d0, false, R(180, 0, 0)); }
    // the blind: a platform on stilts in the reeds, a ladder ramp, the long view
    { const x = 5700, y = 3000; Box(V(x, y, 190), V(380, 380, 380), PLANK_D, true, true); for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) Cyl(V(x + sx * 200, y + sy * 200, 260), 30, 520, BARK, false, false);
      Box(V(x, y, 388), V(520, 520, 16), PLANK, true, false); for (const s of [-1, 1]) { Box(V(x, y + s * 252, 440), V(520, 10, 80), PLANK_D, false, false); Box(V(x + 252, y, 440), V(10, 520, 80), PLANK_D, false, false); for (let i = 0; i < 9; i++) ConeShape(V(x - 240 + i * 60, y + s * 262, 470), V(14, 14, rr(120, 190)), 0x5a6a3a, false); }
      BoxRot(V(x, y, 600), V(580, 580, 14), 0x5a5a3a, R(6, 0, 0), false); Ramp(V(x - 1100, y, 0), V(x - 260, y, 388), 240, PLANK); K.lantern(x, y, 570, 0x8ad04a, 1000); }
    // a pier out into the biggest pool, half gone
    boardwalk(5600, 1500, 5900, 2300); for (const y of [1600, 1900, 2200]) for (const s of [-1, 1]) Cyl(V(5750 + s * 170, y, 40), 30, 110, BARK_D, false, false); K.post(5750, 1560, 340, LAMP, PLANK_D, 900);
    BoxRot(V(4300, 700, 34), V(440, 130, 60), 0x5a4632, R(0, 50, 6), true); BoxRot(V(6400, 5000, 34), V(440, 130, 60), 0x4a3a2a, R(0, -20, -6), true); K.solid(4300, 700, 50, 440, 130, 150); K.solid(6400, 5000, -20, 440, 130, 150);
    for (const [x, y, h, d] of [[3000, 2300, 880, 220], [6500, 300, 900, 230], [4600, 5100, 860, 210], [6700, 4300, 820, 200], [2900, 700, 800, 190]]) cypress(x, y, h, d);
    for (const [x, y] of [[4000, 2200], [5200, 500], [4700, 3500], [6500, 3000]]) wisp(x, y, rr(150, 240));
    wallbuy('Lawman AR', 6896, 2500, 180); wallbuy('Copperhead', 3500, 36, 90);
    for (const [x, y] of [[6700, 5200], [6700, 350], [2850, 5200], [4750, 5250], [6750, 2700], [3600, 1000], [2850, 2300]]) SpawnAt(V(x, y, 0), Z4);
    M.Decor(V2(2600, 100), V2(6900, 5400), 150, [['P_Grass_0', 110, 190, 1.1, [0.7, 0.9, 0.5, 1]], ['P_Grass_1', 110, 200, 1.1, [0.7, 0.9, 0.5, 1]], ['P_Grass_2', 90, 170, 1.2, [0.75, 0.9, 0.55, 1]], 'P_Bones', 'P_Bush']);
  });

  // ------------------------------------------------------------------ 5. THE STILL (a moonshiners' camp: copper, barrels, canvas)
  M.at({ x: 1400, y: -700 }, () => {
    // the smokehouse and the store
    K.cabin(5500, -1500, 6600, -700, 320, 0x5a4a3a, 0x3a2e26, { door: -90, glow: LAMP, logs: 0x43382c, rise: 220 }); K.cabin(2900, -5200, 3700, -4500, 280, 0x64553f, 0x6a3a26, { door: 90, glow: LAMP, dark: true, logs: 0x4a3e2e });
    Sign(V(6050, -1506, 380), -90, 'DRY GOODS', { r: 0.9, g: 0.84, b: 0.7 }, 36);
    // three stills under one roof: pot, cap, worm, and the barrel it drips into
    for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) Box(V(4500 + sx * 700, -3000 + sy * 320, 190), V(22, 22, 380), PLANK_D, true, false); BoxRot(V(4500, -3000, 400), V(1560, 800, 14), 0x8a7a5a, R(0, 0, 8), false);
    for (let i = 0; i < 3; i++) { const x = 4000 + i * 500, y = -3000;
      Cyl(V(x, y, 30), 230, 60, 0x5a5a52, true, true); Cyl(V(x, y, 150), 190, 180, 0x9a5a30, true, false); ConeShape(V(x, y, 300), V(190, 190, 130), 0xb86a3a, false); Cyl(V(x, y, 380), 30, 60, 0xb86a3a, false, false);
      BoxRot(V(x + 110, y, 380), V(230, 16, 16), 0xb86a3a, R(-20, 0, 0), false); for (let k = 0; k < 4; k++) Ring(V(x + 220, y, 300 - k * 34), V(110, 14, 110), 0xb86a3a, R(0, 0, 90)); Barrel(V(x + 220, y, 0), 0x5a4a3a); Glow(V(x, y - 100, 40), V(90, 30, 50), 0xFF6A2A, 0); Lamp(V(x, y - 160, 60), LC(1, 0.5, 0.2), 10, 800, false); }
    // barrel ricks, crates of jars, two wagons loaded for a run that never left
    for (const [x, y, yaw] of [[3300, -1200, 0], [3300, -1700, 0], [6300, -4300, 90], [5300, -5100, 90]]) { for (let k = 0; k < 2; k++) for (let j = 0; j < 3 - k; j++) Cyl(V(x + (yaw ? (j - (2 - k) / 2) * 116 : 0), y + (yaw ? 0 : (j - (2 - k) / 2) * 116), 58 + k * 100), 110, 150, k ? 0x5a4a3a : 0x4a3a30, true, false, yaw ? R(0, 0, 90) : R(90, 0, 0)); GM.NavBlockBox({ min: V(x - (yaw ? 190 : 90), y - (yaw ? 90 : 190), 0), max: V(x + (yaw ? 190 : 90), y + (yaw ? 90 : 190), 150) }, 1); }
    Wagon(V(5600, -2700, 0), -20); Wagon(V(3600, -3900, 0), 70);
    Crate(V(6500, -2300, 0), 140); Crate(V(6650, -2360, 0), 110); Crate(V(6500, -2300, 140), 100); Crate(V(4700, -4600, 0), 130); Crate(V(4860, -4660, 0), 100); Crate(V(3000, -2600, 0), 120);
    // tents: canvas over a ridge pole
    for (const [x, y, yaw] of [[5900, -3700, 0], [4300, -1300, 90]]) { for (const s of [-1, 1]) { BoxRot(M.L(V(x, y, 0), yaw, 0, s * 110, 130), V(420, 300, 10), 0x8a7a5a, R(0, yaw, s * 50), false); Box(M.L(V(x, y, 0), yaw, s * 200, 0, 115), V(12, 12, 230), PLANK_D, true, false); } Box(M.L(V(x, y, 0), yaw, 0, 0, 228), V(430, 10, 10), PLANK_D, false, false, yaw); Box(M.L(V(x, y, 0), yaw, 0, 0, 20), V(300, 110, 40), 0x6a5a40, false, false, yaw); }
    // the fire they sat round
    for (let k = 0; k < 7; k++) { const a = k * 0.898; Box(V(5000 + Math.cos(a) * 90, -1900 + Math.sin(a) * 90, 16), V(110, 26, 26), BARK_D, false, false, k * 51 + 90); } Glow(V(5000, -1900, 40), V(60, 60, 60), 0xFF6A2A, 3); Lamp(V(5000, -1900, 70), LC(1, 0.5, 0.2), 14, 1400, false);
    for (const [x, y] of [[4760, -1700], [5220, -1760], [5060, -2140]]) { Cyl(V(x, y, 26), 80, 52, BARK, true, true); }
    for (const [x, y, h, d] of [[2900, -700, 880, 220], [6600, -5100, 900, 230], [4500, -5200, 820, 190], [6700, -300, 840, 200], [2900, -3000, 800, 180]]) cypress(x, y, h, d);
    for (const [x, y] of [[3600, -2300], [5300, -4000], [6300, -2900], [4200, -500], [3200, -4300]]) K.post(x, y, 400, LAMP, PLANK_D, 1000);
    water(5600, -5400, 6500, -4700, 3); water(2600, -2300, 3200, -1900, 2);
    Station('AmmoCrate', V(6850, -2000, 0), 180, 2000, -1, 'Ammo');
    wallbuy('Quarter Horse', 5200, -5396, 90); wallbuy('Copperhead', 2536, -1500, 0);
    for (const [x, y] of [[6700, -5250], [2850, -5300], [6700, -350], [4750, -5250], [2850, -350], [6780, -3300], [4300, -2200]]) SpawnAt(V(x, y, 0), Z5);
    M.Decor(V2(2600, -5400), V2(6900, -100), 60, ['P_Grass_0', 'P_Grass_1', 'P_Bush', 'D_Grime', 'P_Bones', 'P_Grass_2']);
  });

  for (const [x, y, yaw, cost, a, b] of DOORS) Door(V(x, y, 0), yaw, cost, a, b);
}

export const BAYOU_LOOT = { chests: { 0: [0], 1: [0, 1], 2: [1, 1], 3: [1, 2], 4: [1, 2], 5: [0, 1] }, relics: [[1250, -1650, 170, 180], [7100, 3700, 398, 180]], box: [420, -3200, 90, 0], boxZones: [1, 2, 3, 4, 5] };

// fireflies: slow green sparks low over the ground
let acc = 0;
export function bayouAmbient(g, dt) {
  acc += dt * 26; const c = g.camera.position;
  while (acc > 1) { acc -= 1; g.fx.add({ pos: new THREE.Vector3(c.x + (Math.random() - 0.5) * 3200, 30 + Math.random() * 260, c.z + (Math.random() - 0.5) * 3200), vel: new THREE.Vector3((Math.random() - 0.5) * 60, (Math.random() - 0.3) * 40, (Math.random() - 0.5) * 60), life: 3.2, size0: 9, size1: 9, c0: [0.75, 1, 0.3, 1], fadeIn: 0.6, fadeOut: 0.6, tex: 'FX_Disc', kind: 'fx', glow: 1 }); }
}

export const BAYOU_MECH = { wet: true, drown: 25, drownText: 'Something in the deep water dragged you under' };
export const BAYOU_QUEST = { name: 'PART THE WATER', after: 'The water has parted', gate: [0, 1120, 0], steps: [
  { type: 'collect', text: 'Find three grave charms on the islands', item: 'Charm', n: 3, color: 0x8ad04a, done: 'THE CHARMS ARE GATHERED',
    spots: [[-7600, 1500, 0], [-4600, 5400, 0], [-7700, -1500, 0], [-4700, -5500, 0], [7600, -5400, 0], [4700, -1500, 0], [7700, 5300, 0]] },
  { type: 'souls', text: 'Feed the three spirit lanterns', need: 10, r: 750, color: 0x8ad04a, done: 'THE LANTERNS BURN',
    at: [[6200, 3400, 0], [0, 4300, 0], [-6200, -3500, 0]] },
  { type: 'order', text: 'Ring the three bells in order (count the lights)', prompt: 'Ring the bell', color: 0xFFB45A, done: 'THE DEAD ARE LISTENING', wrong: 'The water stays still. Start again.',
    at: [[-6100, 3500, 0, 0], [1700, 5400, 0, -90], [6200, -3400, 0, 180]] },
  { type: 'hold', text: 'Hold the drowned chapel while the water draws back', at: [0, 430, 0], r: 480, time: 45, color: 0x8ad04a, done: 'THE WATER PARTS' },
] };
