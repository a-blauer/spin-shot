// Thimblewick: the gnome village every run starts from, a small hollow among the roots of a few enormous old trees.
// Built into the Descent's map as one more chunk, far from the rooms, so a run starts by walking through the Way Down and
// ends by coming home, with no loading between. Local frame: +Y is north. The road comes in from the south over a humped
// bridge and under an arching root, through the cobbled square (the well in its middle, the challenge board to the
// south-east), and on north to the Way Down, an arch in the roots of the oldest tree. Bramble & Bolt (clothes) is on the
// square's west side, Flintwhistle's gunsmithy south-west of it, your own cottage and its dressing porch north-west, and the
// Lucky Toadstool, the casino under a giant mushroom, to the east. Lanterns hang on long ropes from the giants' limbs.
// Stations and people are added at run time (village.js) from VSPOTS.
import * as THREE from 'three';
import { V, R } from './mapkit.js';
import { shroomHouse, thatchCottage, tree, bush, flower, fence, lanternPost, well, rock, hill, cabbage, pumpkin, noticeBoard, mirror, toadstoolCap, rootPillar, slotMachine, rouletteTable, cardTable, diceTable, hatStand, grassTuft, toadstoolCluster, fern, mossLog, stemR, giantTree, giantLimbs, rootArch, wardrobeFine, dressScreen, VC, dark, mix } from './village_shapes.js';
import { awning, barrel, bunting, hay, rug } from './descent_shapes.js';

export const VSIZE = 3000;   // the walkable square, half its side
const STREAM_Y = -1850, CASINO = [2150, 350], GATE = [0, 2600];
// the old giants: [x, y, height, trunk radius, seed, an angle their roots keep off (or null)]
const GIANTS = [[0, 3700, 6400, 680, 1, -Math.PI / 2], [-2550, 2350, 5200, 520, 2, null], [2750, 2650, 5600, 540, 3, Math.PI * 1.1], [-2850, -1000, 4800, 470, 4, 0], [3050, -2250, 5000, 430, 5, Math.PI * 0.75], [-1950, -2750, 4400, 420, 6, Math.PI * 0.3], [1500, -3200, 4600, 430, 7, Math.PI / 2]];
// where the village's stations and people stand (local frame; yaw in radians as the player's: Math.PI faces +Y)
export const VSPOTS = {
  spawn: [0, -2700, Math.PI],
  shop: { at: [-880, 450], npc: [-1230, 450, -Math.PI / 2], yaw: 0 },
  gunshop: { at: [-860, -800], npc: [-1220, -800, -Math.PI / 2], yaw: 0 },
  wardrobe: { at: [-1180, 1240], mirror: [-1180, 1760], yaw: 0 },
  board: { at: [740, -660], npc: [800, -260, Math.PI / 2], yaw: 180 },
  gate: { at: [GATE[0], GATE[1] - 100], npc: [520, GATE[1] - 400, 0.3] },
  casino: {
    c: CASINO,
    // at: where you stand to play; table: where the table stands (and how it is turned); npc: the dealer, facing you
    roulette: { at: [CASINO[0] - 380, CASINO[1] - 470], table: [CASINO[0] - 380, CASINO[1] - 620, 0], npc: [CASINO[0] - 380, CASINO[1] - 760, Math.PI] },
    blackjack: { at: [CASINO[0] - 380, CASINO[1] + 440], table: [CASINO[0] - 380, CASINO[1] + 590, 0], npc: [CASINO[0] - 380, CASINO[1] + 730, 0] },
    dice: { at: [CASINO[0] + 420, CASINO[1] - 480], table: [CASINO[0] + 420, CASINO[1] - 620, 0], npc: [CASINO[0] + 420, CASINO[1] - 740, Math.PI] },
    slots: [[CASINO[0] + 620, CASINO[1] + 160], [CASINO[0] + 620, CASINO[1] + 380], [CASINO[0] + 620, CASINO[1] + 600]],
    T: 0.7, SL: 0.66, slotOut: 62,   // the tables and machines are built at gnome height: scaled by T and SL; a machine stands slotOut beyond where you play it
  },
  folk: [[-420, -560, 0.6], [650, -1150, -2.2], [1150, -1400, 0.9], [-1500, 2050, 1.2], [1050, 1300, -1], [-300, 1950, 2.6]],
  fire: [980, -1280],
  signs: [],   // painted signs: { kind, o, at: [x, y, z], face: [x, y], h, glow } (filled in as the village is built; hung by village.js)
  smoke: [],   // chimney tops, for the smoke
};

export function buildVillage(M, cx, cy) {
  const { Box, Cyl, Glow, Lamp, Ball, Shape, Solid, Blocker, Ramp, Oct } = M;
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }, rr = (a, b) => a + rnd() * (b - a);
  const S = (pair, x, y, z = 0, yaw = 0, s = 1) => Shape(pair[0], pair[1], V(x, y, z), R(0, yaw, 0), 0xffffff, s);
  const lit = (x, y, z, c = { r: 1, g: 0.78, b: 0.45 }, r = 900) => { Glow(V(x, y, z), V(22, 22, 26), 0xffd27a, 2); Lamp(V(x, y, z + 10), c, 2.2, r, false); };
  // a lantern on a rope: an iron cap, a warm glass, a little cage; every other one throws light
  let lampN = 0;
  const hang = (x, y, top, z, col = 0xffc870) => {
    Box(V(x, y, (top + z + 30) / 2), V(2.4, 2.4, top - z - 30), 0x2a2018, false, false);
    Cyl(V(x, y, z + 26), 26, 8, VC.iron, false, false); Glow(V(x, y, z), V(24, 24, 34), col, 2); Cyl(V(x, y, z - 22), 20, 6, VC.iron, false, false);
    for (const [u, v] of [[-11, -11], [11, -11], [-11, 11], [11, 11]]) Box(V(x + u, y + v, z + 2), V(1.6, 1.6, 44), VC.iron, false, false);
    if (lampN++ % 2 === 0) Lamp(V(x, y, z - 10), { r: 1, g: 0.72, b: 0.42 }, 1.9, 800, false);
  };
  const avoid = [];   // circles kept clear of scatter: [x, y, r]
  const clear = (x, y, pad = 0) => Math.abs(x) < VSIZE + 1400 && Math.abs(y) < VSIZE + 1400 && !avoid.some(([ax, ay, r]) => Math.hypot(x - ax, y - ay) < r + pad);
  VSPOTS.signs.length = 0; VSPOTS.smoke.length = 0;   // a rebuilt village starts its lists again
  M.at({ x: cx, y: cy, z: 0, rot: 0 }, () => {
    // ---- the ground: deep moss, darker under the giants, leaf litter, bare earth between the roots
    Box(V(0, 0, -60), V(30000, 30000, 120), 0x4c7030, true, false);
    for (let i = 0; i < 110; i++) { const x = rr(-6000, 6000), y = rr(-6000, 6000), d = rr(400, 1400); Cyl(V(x, y, 0.3 + i * 0.012), d, 1, [0x527a34, 0x5e8a3a, 0x466a2c, 0x6a7a40, 0x5a6638, 0x4e7432][i % 6], false, false); }
    // ---- the paths: one ribbon of soft dirt each, wavering, two tones blotched through it, edged with pebbles
    let pathN = 0;   // each path a hair above the last, so where two meet they do not fight
    const path = (pts, w, col = 0x8c6c48) => {
      const pz = 7 + (pathN++) * 0.25;
      const segs = []; for (let k = 0; k < pts.length - 1; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / 60)); for (let i = 0; i < n; i++) segs.push([x0 + (x1 - x0) * (i / n), y0 + (y1 - y0) * (i / n), -(y1 - y0) / L, (x1 - x0) / L]); }
      { const [x1, y1] = pts[pts.length - 1], q = segs[segs.length - 1]; segs.push([x1, y1, q[2], q[3]]); }
      const x0 = segs[0][0], y0 = segs[0][1], key = 'vpath|' + pts.flat().map(Math.round).join(',') + '|' + w + '|' + col, dk = dark(col, 0.86), lt = mix(col, 0x6a8a3a, 0.3);
      Shape(key, () => { const pos = [], cl = [], idx = [], C = new THREE.Color(); const N = segs.length;
        for (let i = 0; i < N; i++) { const [x, y, nx, ny] = segs[i], hw = w * 0.5 * (0.9 + 0.12 * Math.sin(i * 0.7) + 0.06 * Math.sin(i * 2.3)); for (let j = 0; j <= 4; j++) { const e = (j / 4 - 0.5) * 2 * hw, px = x + nx * e - x0, py = y + ny * e - y0, n = Math.sin(px * 0.011 + py * 0.007) + Math.sin(px * 0.023 - py * 0.017); pos.push(px, py, 0); C.setHex(n > 0.9 ? lt : n < -0.8 ? dk : col, THREE.NoColorSpace); cl.push(C.r, C.g, C.b); } }
        for (let i = 0; i < N - 1; i++) for (let j = 0; j < 4; j++) { const a = i * 5 + j, b2 = a + 1, c = a + 5, d = c + 1; idx.push(a, c, b2, b2, c, d); }
        return { pos, col: cl, idx }; }, V(x0, y0, pz), R(0, 0, 0));
      for (let i = 0; i < segs.length; i += 2) { const [x, y, nx, ny] = segs[i]; for (const sd of [-1, 1]) { const e = sd * (w / 2 + rr(-10, 10)); Oct(V(x + nx * e, y + ny * e, 9 + rr(0, 2)), V(rr(24, 44), rr(20, 36), 10), mix(VC.stone, VC.moss, rnd() * 0.5), false, false, R(0, rr(0, 90), 0)); } }
    };
    path([[0, -3400], [0, STREAM_Y - 500], [0, -760]], 380);
    path([[0, 760], [0, GATE[1] - 300]], 380);
    path([[-720, 450], [-1000, 450]], 320); path([[-520, -520], [-960, -800]], 300); path([[-520, 520], [-1000, 1300]], 280);
    path([[720, 320], [CASINO[0] - 1220, CASINO[1]]], 360);
    path([[380, -640], [900, -1180]], 240); path([[440, 600], [1150, 1550]], 240);
    // ---- the square: cobbles in rings round the well, mossed between
    avoid.push([0, 0, 820]);
    Cyl(V(0, 0, 2), 1500, 2, 0x6a6a5a, false, false);
    for (let r = 120; r < 700; r += 56) { const n = Math.round((2 * Math.PI * r) / 58); for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + r, c = mix(0xa49d90, 0x8a8478, (Math.sin(i * 3.1 + r) + 1) / 2); Oct(V(Math.cos(a) * r, Math.sin(a) * r, 4), V(50, 44, 6), (i * 7 + r) % 11 === 0 ? mix(c, VC.moss, 0.55) : c, false, false, R(0, (a * 180) / Math.PI, 0)); } }
    for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; Oct(V(Math.cos(a) * 735, Math.sin(a) * 735, 6), V(110, 70, 12), mix(0x8a8478, VC.moss, (i % 3) * 0.25), false, false, R(0, (a * 180) / Math.PI + 90, 0)); }
    S(well(), 0, 0, 0, 0); Cyl(V(0, 0, 60), 200, 120, 0x000000, false, false); Solid(V(0, 0, 160), V(200, 200, 320), true);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4, x = Math.cos(a) * 660, y = Math.sin(a) * 660; S(lanternPost(320, i), x, y, 0, (a * 180) / Math.PI + 180); Solid(V(x, y, 160), V(24, 24, 320), false); lit(x - Math.cos(a) * 62, y - Math.sin(a) * 62, 262); }
    // paper lanterns strung across the square from post to post, and to the well
    const paper = (x0, y0, z0, x1, y1, z1, sag = 60) => {
      const n = Math.max(4, Math.round(Math.hypot(x1 - x0, y1 - y0) / 110)), cols = [0xff9a5a, 0xffd27a, 0xff6a5a, 0xffe6a0]; let p = null;
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, z = z0 + (z1 - z0) * t - Math.sin(t * Math.PI) * sag;
        if (p) { const L = Math.hypot(x - p[0], y - p[1], z - p[2]), yaw = (Math.atan2(y - p[1], x - p[0]) * 180) / Math.PI, pitch = (Math.atan2(z - p[2], Math.hypot(x - p[0], y - p[1])) * 180) / Math.PI; M.BoxRot(V((x + p[0]) / 2, (y + p[1]) / 2, (z + p[2]) / 2), V(L + 1, 1.6, 1.6), 0x2a2018, R(pitch, yaw, 0), false); }
        if (i > 0 && i < n) { Box(V(x, y, z - 6), V(2, 2, 12), 0x2a2018, false, false); Glow(V(x, y, z - 26), V(26, 26, 32), cols[i % 4], 2); Cyl(V(x, y, z - 9), 16, 4, 0x3a2418, false, false); Cyl(V(x, y, z - 43), 14, 4, 0x3a2418, false, false); }
        p = [x, y, z];
      }
    };
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4, b = a + Math.PI / 2; paper(Math.cos(a) * 660, Math.sin(a) * 660, 300, Math.cos(b) * 660, Math.sin(b) * 660, 300, 90); paper(Math.cos(a) * 660, Math.sin(a) * 660, 300, Math.cos(a) * 60, Math.sin(a) * 60, 360, 70); }
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2, x = Math.cos(a) * 340, y = Math.sin(a) * 340, yaw = (a * 180) / Math.PI + 90; Box(V(x, y, 44), V(220, 56, 10), VC.woodL, true, false, yaw); for (const s of [-1, 1]) Box(V(x + Math.cos(a + Math.PI / 2) * s * 90, y + Math.sin(a + Math.PI / 2) * s * 90, 20), V(14, 50, 40), VC.woodD, false, false, yaw); Box(V(x + Math.cos(a) * 26, y + Math.sin(a) * 26, 76), V(220, 8, 50), VC.woodL, false, false, yaw); for (const s of [-1, 1]) Box(V(x + Math.cos(a) * 26 + Math.cos(a + Math.PI / 2) * s * 100, y + Math.sin(a) * 26 + Math.sin(a + Math.PI / 2) * s * 100, 50), V(10, 10, 52), VC.woodD, false, false, yaw); }
    // a signpost at the south edge of the square
    { const x = 380, y = -860; Cyl(V(x, y, 150), 18, 300, VC.wood, true, false); Ball(V(x, y, 305), V(26, 26, 26), VC.red);
      for (const [z, yaw, t] of [[262, 90, 'The Way Down'], [222, 180, 'Shops'], [182, 0, 'Casino'], [142, 145, 'Home']]) { const a = (yaw * Math.PI) / 180; Box(V(x + Math.cos(a) * 70, y + Math.sin(a) * 70, z), V(150, 6, 32), VC.woodD, false, false, yaw); const n = (a - Math.PI / 2); VSPOTS.signs.push({ kind: 'wood', o: { text: t, w: 560, h: 130, seed: z }, at: [x + Math.cos(a) * 70 + Math.cos(n) * 4, y + Math.sin(a) * 70 + Math.sin(n) * 4, z], face: [Math.cos(n), Math.sin(n)], h: 34 }); } }

    // ---- the old giants, with lanterns on long ropes from their limbs and moss thick round their feet
    for (const [x, y, h, r, sd, away] of GIANTS) {
      S(giantTree(h, r, sd, [0x3e6a2c, 0x46722e, 0x3a6230][sd % 3], away), x, y, 0, 0);
      Solid(V(x, y, h / 2), V(r * 2, r * 2, h), true); Solid(V(x, y, 260), V(r * 2.7, r * 2.7, 520), true);
      avoid.push([x, y, r * 3.1]);
      Cyl(V(x, y, 1.4), r * 5.2, 1, 0x4a7a2c, false, false); Cyl(V(x, y, 1.8), r * 3.6, 1, 0x5a8a34, false, false);
      for (const L of giantLimbs(h, r, sd)) for (const t of [0.55, 0.85]) {
        const px = x + L.tip[0] * t, py = y + L.tip[1] * t, top = L.z0 + (L.tip[2] - L.z0) * t + h * 0.03 - r * 0.15;
        const z = rr(330, 760); if (Math.hypot(px, py) < VSIZE + 600 && !(px > 600 && px < 1200 && Math.abs(py - CASINO[1]) < 450)) hang(px, py, top, z, t > 0.7 ? 0xffb860 : 0xffd27a);   // none in the way of the casino's sign
      }
      // a few toadstools glowing a soft blue-green among the roots
      for (let k = 0; k < 4; k++) { const a = rr(0, 6.28), d = r * rr(1.4, 2.4), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d; const [kk, b] = toadstoolCluster(0.9 + rnd() * 0.6, 0x7ad8c4, 40 + sd * 5 + k); Shape(kk, b, V(px, py, 0), R(0, rr(0, 360), 0)); Glow(V(px, py, 30), V(40, 40, 20), 0x7ae8d0, 1); }
    }
    // roots that have broken the surface and arch over the roads, a lantern under each
    for (const [x, y, yaw, span, hg] of [[0, -1350, 0, 860, 520], [0, 1450, 8, 900, 560]]) {
      S(rootArch(span, hg, 72, Math.round(x + y)), x, y, 0, yaw); const a = (yaw * Math.PI) / 180;
      for (const s of [-1, 1]) Solid(V(x + Math.cos(a) * s * (span / 2 + 20), y + Math.sin(a) * s * (span / 2 + 20), hg / 2), V(150, 150, hg), true, yaw);
      hang(x, y, hg - 70, hg - 190);
    }

    // ---- the stream, across the hollow, with a humped bridge for the road
    { const pts = []; for (let x = -4600; x <= 4600; x += 160) pts.push([x, STREAM_Y + Math.sin(x * 0.0009) * 260 + Math.sin(x * 0.0023) * 90]);
      for (const [x, y] of pts) { Cyl(V(x, y, 1.2), 520, 1, 0x3e7a8a, false, false); Cyl(V(x, y, 2.2), 380, 1, 0x4a8a9a, false, false); }
      for (let i = 0; i < pts.length; i += 2) for (const s of [-1, 1]) { const [x, y] = pts[i]; if (Math.abs(x) < 400) continue; if (rnd() < 0.6) Oct(V(x + rr(-60, 60), y + s * rr(230, 280), 8), V(rr(50, 110), rr(40, 90), rr(14, 30)), mix(VC.stone, VC.moss, 0.3 + rnd() * 0.5), false, false, R(0, rr(0, 90), 0)); if (rnd() < 0.3) for (let k = 0; k < 4; k++) { const px = x + rr(-40, 40), py = y + s * rr(210, 260), h = rr(70, 130); Cyl(V(px, py, h / 2 - 4), 5, h, 0x6a8a3a, false, false); } }
      for (let i = 0; i < 18; i++) { const [x, y] = pts[Math.floor(rnd() * pts.length)]; if (Math.abs(x) > 600) Cyl(V(x + rr(-110, 110), y + rr(-110, 110), 3.2), rr(50, 80), 1.4, 0x5a9a3a, false, false); }
      avoid.push([0, STREAM_Y, 650]);
      const y0 = STREAM_Y - 600, y1 = STREAM_Y - 220, y2 = STREAM_Y + 220, y3 = STREAM_Y + 600, top = 80;
      Ramp(V(0, y0, 0), V(0, y1, top), 440, VC.woodL); Ramp(V(0, y3, 0), V(0, y2, top), 440, VC.woodL); Box(V(0, STREAM_Y, top - 14), V(440, y2 - y1 + 20, 28), VC.woodL, true, false);
      for (let y = y0 + 30; y < y3; y += 44) Box(V(0, y, (y < y1 ? ((y - y0) / (y1 - y0)) * top : y > y2 ? ((y3 - y) / (y3 - y2)) * top : top) + 1), V(450, 8, 4), VC.woodD, false, false);
      for (const sx of [-1, 1]) { for (const y of [y1, y2]) Oct(V(sx * 200, y, 30), V(110, 110, 70), mix(VC.stone, VC.moss, 0.4), true, false); for (let y = y0; y <= y3; y += 160) { const h = (y < y1 ? ((y - y0) / (y1 - y0)) * top : y > y2 ? ((y3 - y) / (y3 - y2)) * top : top); Cyl(V(sx * 224, y, h + 45), 14, 90, VC.woodD, true, false); } Box(V(sx * 224, STREAM_Y, top + 88), V(12, y2 - y1, 10), VC.wood, false, false); }
      for (const [x, y] of [[-300, y0 - 60], [300, y3 + 60]]) { S(lanternPost(300, 2), x, y, 0, x < 0 ? 0 : 180); Solid(V(x, y, 150), V(24, 24, 300), false); lit(x + (x < 0 ? 62 : -62), y, 242); } }

    // ---- Bramble & Bolt: Mossbottom's red-capped cottage on the square's west side, its counter out front. Clothes only now.
    { const [x, y] = [-1640, 450]; S(shroomHouse(500, 310, 0xc8392e, VC.cream, 3), x, y, 0, 0); Solid(V(x, y, 260), V(680, 680, 520), true); avoid.push([x, y, 850]);
      const ct = [-1060, 450]; Box(V(ct[0], ct[1], 42), V(90, 620, 84), VC.woodL, true, true); Box(V(ct[0] + 4, ct[1], 88), V(110, 650, 12), VC.woodD, false, false);
      for (let i = 0; i < 6; i++) Box(V(ct[0] + 46, ct[1] - 270 + i * 108, 42), V(4, 80, 64), dark(VC.woodL, 0.85), false, false);
      { const [k, b] = awning(760, 300, 70, 0xc8392e, 0xf4ecd6, 8); Shape(k, b, V(ct[0] - 110, ct[1], 330), R(0, -90, 0)); }
      for (const s of [-1, 1]) Cyl(V(ct[0] + 40, ct[1] + s * 370, 160), 16, 320, VC.woodD, true, false);
      // on the counter: a brass till, a pile of hats, folded shirts, a lantern; a hat stand and a dress form beside it
      Box(V(ct[0], ct[1] + 220, 116), V(50, 70, 44), VC.brass, false, false); Box(V(ct[0], ct[1] + 220, 144), V(40, 60, 14), dark(VC.brass, 0.7), false, false);
      for (let i = 0; i < 3; i++) Cyl(V(ct[0], ct[1] - 200 + i * 10, 100 + i * 14), 60 - i * 8, 12, [0xc8392e, 0x3a6a8a, 0x5a8a3a][i], false, false);
      for (let i = 0; i < 4; i++) Box(V(ct[0], ct[1] + 20 + (i % 2) * 6, 98 + i * 9), V(60, 70, 8), [0xe8d8b0, 0x8a4a5a, 0x4a6a8a, 0xd8a03a][i], false, false);
      Glow(V(ct[0], ct[1] - 290, 126), V(20, 20, 28), 0xffd27a, 2); Lamp(V(ct[0] + 60, ct[1], 260), { r: 1, g: 0.8, b: 0.5 }, 2, 700, false);
      S(hatStand(), ct[0] + 120, ct[1] + 470, 0, 0); Solid(V(ct[0] + 120, ct[1] + 470, 90), V(60, 60, 180), false);
      { const dx = ct[0] + 120, dy = ct[1] - 470; Cyl(V(dx, dy, 60), 10, 120, VC.woodD, true, false); Cyl(V(dx, dy, 4), 60, 8, VC.woodD, false, false); Ball(V(dx, dy, 170), V(46, 34, 70), 0x8a4a5a); Ball(V(dx, dy, 228), V(18, 18, 14), VC.woodD); }
      VSPOTS.signs.push({ kind: 'wood', o: { text: 'Bramble & Bolt', sub: 'clothes, hats & trinkets', w: 1000, h: 280, leaves: true, seed: 3 }, at: [x + 490, y, 430], face: [1, 0], h: 110 });
      for (const s of [-1, 1]) Box(V(x + 486, y + s * 150, 520), V(3, 3, 70), VC.iron, false, false);
      for (const [dx, dy] of [[160, -500], [230, -450]]) { const [k, b] = barrel(0x7a5232, 0x2a2420); Shape(k, b, V(x + dx, y + dy, 0), R(0, dx, 0)); Solid(V(x + dx, y + dy, 55), V(84, 84, 110), true); } }

    // ---- Flintwhistle's Guns: a stone-and-timber smithy south-west of the square, a forge glowing at its side, the guns
    // racked on the wall behind the counter, a target on a post and powder kegs by the door
    { const [x, y] = [-1560, -800]; S(thatchCottage(600, 480, 300, 0x9a8c78, 6), x, y, 0, 0); Solid(V(x, y, 230), V(640, 520, 460), true); avoid.push([x, y, 820]);
      const ct = [-1040, -800], dark2 = 0x3a2a1e;
      Box(V(ct[0], ct[1], 42), V(90, 600, 84), 0x5a4030, true, true); Box(V(ct[0] + 4, ct[1], 88), V(110, 630, 12), dark2, false, false); for (const s of [-1, 1]) Box(V(ct[0] + 47, ct[1] + s * 250, 42), V(4, 40, 70), VC.iron, false, false);
      { const [k, b] = awning(740, 300, 70, 0x3a4a5a, 0xd8c8a0, 8); Shape(k, b, V(ct[0] - 110, ct[1], 330), R(0, -90, 0)); }
      for (const s of [-1, 1]) Cyl(V(ct[0] + 40, ct[1] + s * 360, 160), 16, 320, dark2, true, false);
      // the rack behind the counter: a board on two posts, six long guns on pegs
      { const rx = ct[0] - 120; Box(V(rx, ct[1], 190), V(14, 520, 190), dark2, false, false); for (const s of [-1, 1]) Box(V(rx, ct[1] + s * 270, 150), V(20, 20, 300), dark2, true, false);
        for (let i = 0; i < 6; i++) { const gy = ct[1] - 210 + i * 84, l = 150 + (i % 3) * 20; Box(V(rx + 12, gy, 160 + l / 2), V(8, 8, l), VC.iron, false, false); Box(V(rx + 12, gy + 4, 140), V(10, 22, 50), [0x7a4a2a, 0x5a3a22, 0x8a5a34][i % 3], false, false); Box(V(rx + 14, gy, 210), V(6, 14, 24), VC.brass, false, false); } }
      // on the counter: a revolver on a cloth, a box of shells, a lantern
      Box(V(ct[0], ct[1] - 100, 95), V(70, 110, 2), 0x2a4a3a, false, false); Box(V(ct[0], ct[1] - 100, 100), V(14, 60, 8), VC.iron, false, false); Box(V(ct[0], ct[1] - 124, 104), V(10, 18, 16), 0x7a4a2a, false, false);
      Box(V(ct[0], ct[1] + 160, 106), V(40, 60, 24), 0x8a2a22, false, false); Glow(V(ct[0], ct[1] + 260, 126), V(20, 20, 28), 0xffd27a, 2); Lamp(V(ct[0] + 60, ct[1], 260), { r: 1, g: 0.78, b: 0.5 }, 2, 700, false);
      // the forge: a stone hearth, coals, a hood and a stack, an anvil on a stump
      { const fx = x + 120, fy = y - 400; Box(V(fx, fy, 50), V(200, 160, 100), 0x6a645a, true, true); Box(V(fx, fy, 101), V(150, 110, 4), 0x2a1a10, false, false); Glow(V(fx, fy, 104), V(130, 90, 6), 0xff6a1a, 2); Glow(V(fx, fy, 116), V(80, 50, 20), 0xffb04a, 2);
        Box(V(fx, fy, 260), V(220, 180, 40), 0x4a4038, false, false); Box(V(fx, fy, 420), V(70, 70, 300), 0x5a5048, true, false); Lamp(V(fx, fy, 160), { r: 1, g: 0.5, b: 0.2 }, 2.4, 800, false); VSPOTS.smoke.push([fx, fy, 600]);
        Cyl(V(fx + 220, fy + 60, 40), 70, 80, 0x6a4a2a, true, false); Box(V(fx + 220, fy + 60, 96), V(90, 34, 32), VC.iron, false, false); Box(V(fx + 262, fy + 60, 104), V(30, 16, 14), VC.iron, false, false); }
      // a target on a post, powder kegs, a crate of shot
      { const tx = ct[0] + 160, ty = ct[1] + 520; Cyl(V(tx, ty, 90), 12, 180, dark2, true, false); for (const [d, c] of [[110, 0xf2e4c6], [80, 0xc8392e], [50, 0xf2e4c6], [22, 0xc8392e]]) Cyl(V(tx + 8 - d * 0.01, ty, 200), d, 4 + (110 - d) * 0.02, c, false, false, R(0, 90, 90)); }
      for (const [dx, dy] of [[480, -320], [520, -230], [470, 330]]) { const [k, b] = barrel(0x5a3a22, 0x1a1410); Shape(k, b, V(x + dx, y + dy, 0), R(0, dx, 0)); Solid(V(x + dx, y + dy, 55), V(84, 84, 110), true); Box(V(x + dx, y + dy, 112), V(30, 30, 4), 0xc8392e, false, false); }
      VSPOTS.signs.push({ kind: 'wood', o: { text: 'Flintwhistle’s Guns', sub: 'rifles · scatterguns · oddities', w: 1100, h: 280, seed: 12 }, at: [x + 316, y, 400], face: [1, 0], h: 104 });
      for (const s of [-1, 1]) Box(V(x + 312, y + s * 160, 480), V(3, 3, 60), VC.iron, false, false); }

    // ---- home: your thatched cottage in the roots of the north-west giant, and on its east side the dressing porch: a
    // deck under a pergola of climbing roses, the painted wardrobe, a folding screen, the long mirror, a rug, hats on a
    // stand, a dresser with two lamps, pots of flowers, and paper lanterns overhead
    { const [x, y] = [-1820, 1480]; S(thatchCottage(700, 560, 320, VC.cream, 2), x, y, 0, 0); Solid(V(x, y, 250), V(740, 600, 500), true); avoid.push([x, y, 900]);
      for (const s of [-1, 1]) Glow(V(x + 362, y + s * 168, 182), V(6, 80, 66), 0xffd27a, 0);
      const dx = -1210, dy = 1500, DW = 400, DD = 860;
      Box(V(dx, dy, 12), V(DW, DD, 24), VC.woodL, true, false); for (let i = 0; i < 9; i++) Box(V(dx + (i - 4) * 44, dy, 25), V(4, DD, 2), VC.woodD, false, false);
      Box(V(dx + DW / 2 + 6, dy, 14), V(14, DD + 12, 28), VC.woodD, false, false);
      // the pergola: four posts, two beams, slats across, roses climbing the front posts
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) Cyl(V(dx + sx * (DW / 2 - 20), dy + sy * (DD / 2 - 20), 170), 18, 340, VC.woodD, true, false);
      for (const sx of [-1, 1]) Box(V(dx + sx * (DW / 2 - 20), dy, 346), V(20, DD + 60, 22), VC.woodD, false, false);
      for (let i = 0; i < 9; i++) Box(V(dx, dy - DD / 2 + 30 + i * ((DD - 60) / 8), 362), V(DW + 60, 12, 12), VC.wood, false, false);
      for (const sy of [-1, 1]) for (let k = 0; k < 7; k++) { const z = 40 + k * 44, px = dx + DW / 2 - 20 + Math.sin(k * 1.7) * 14, py = dy + sy * (DD / 2 - 20) + Math.cos(k * 1.3) * 14; Ball(V(px, py, z), V(30, 30, 26), k % 2 ? VC.leaf2 : VC.leaf); if (k % 2 === 0) Ball(V(px + 12, py, z + 8), V(12, 12, 12), [0xf08aa8, 0xc8392e, 0xf6f0e0][k % 3]); }
      for (let i = 0; i < 8; i++) { const py = dy - DD / 2 + 60 + i * ((DD - 120) / 7); Ball(V(dx + (i % 2 ? 60 : -40), py, 372), V(50, 40, 18), i % 2 ? VC.leaf : VC.leaf2); if (i % 3 === 0) Ball(V(dx + (i % 2 ? 70 : -30), py + 10, 382), V(12, 12, 10), 0xf08aa8); }
      paper(dx - DW / 2 + 20, dy - DD / 2 + 20, 340, dx + DW / 2 - 20, dy + DD / 2 - 20, 340, 50); paper(dx + DW / 2 - 20, dy - DD / 2 + 20, 340, dx - DW / 2 + 20, dy + DD / 2 - 20, 340, 50);
      // a round rug in the middle, the wardrobe and the mirror facing out, the screen between them
      Cyl(V(dx, dy, 25.4), 300, 1, 0x8a3a4a, false, false); Cyl(V(dx, dy, 25.8), 250, 1, 0xd8b878, false, false); Cyl(V(dx, dy, 26.2), 190, 1, 0x6a2a3a, false, false);
      S(wardrobeFine(), dx - 130, dy - 260, 24, 0); Solid(V(dx - 130, dy - 260, 160), V(100, 190, 320), true);
      S(mirror(), dx - 110, dy + 260, 24, 0); Solid(V(dx - 115, dy + 260, 120), V(30, 120, 240), false);
      S(dressScreen(), dx - 150, dy, 24, 0); Solid(V(dx - 150, dy, 120), V(60, 200, 240), false);
      S(hatStand(), dx + 120, dy + 380, 24, 0); Solid(V(dx + 120, dy + 380, 110), V(60, 60, 180), false);
      // the dresser: a low chest with two lamps and a jewellery box; a stool before it
      { const sx = dx + 110, sy = dy - 380; Box(V(sx, sy, 70), V(80, 160, 92), 0x6a4428, true, true); for (const z of [52, 88]) Box(V(sx + 41, sy, z), V(3, 140, 28), 0x7a5232, false, false); for (const z of [52, 88]) Ball(V(sx + 43, sy, z), V(6, 6, 6), VC.brass);
        for (const s of [-1, 1]) { Cyl(V(sx, sy + s * 56, 124), 14, 24, VC.brass, false, false); Glow(V(sx, sy + s * 56, 152), V(30, 30, 30), 0xffd8a0, 2); }
        Box(V(sx, sy, 124), V(30, 40, 18), 0x8a2a3a, false, false); Lamp(V(sx, sy, 200), { r: 1, g: 0.8, b: 0.55 }, 2, 600, false); }
      Cyl(V(dx + 30, dy - 250, 50), 50, 10, 0x8a3a4a, false, false); for (const [u, v] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) Cyl(V(dx + 30 + u, dy - 250 + v, 24), 5, 48, VC.woodD, false, false);
      for (const [px, py, c] of [[dx + DW / 2 + 40, dy - 300, 0xf08aa8], [dx + DW / 2 + 40, dy + 300, 0xf6d04a], [dx + DW / 2 + 40, dy, 0xa070d0]]) { Cyl(V(px, py, 22), 50, 44, 0xb8643a, true, false); Cyl(V(px, py, 45), 56, 5, 0x8a4a2a, false, false); S(bush(36, VC.leaf2, c, Math.round(py)), px, py, 40, 0); }
      VSPOTS.signs.push({ kind: 'wood', o: { text: 'Dressing Porch', w: 700, h: 170, leaves: true, seed: 9 }, at: [dx + DW / 2 - 10, dy, 300], face: [1, 0], h: 56 });
      // the garden: rows of cabbages and pumpkins north of the cottage, a fence round it
      Box(V(-1800, 2150, 2), V(800, 420, 3), 0x4a3424, false, false);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) { const px = -2120 + c * 150, py = 2030 + r * 120; if (r === 1) S(pumpkin(rr(32, 46)), px, py, 0, rr(0, 360)); else S(cabbage(rr(22, 30)), px, py, 0, rr(0, 360)); }
      for (const [fx, fy, yaw, len] of [[-1800, 1920, 0, 840], [-1800, 2380, 0, 840], [-1380, 2150, 90, 460]]) { S(fence(len), fx, fy, 0, yaw); Solid(V(fx, fy, 45), yaw ? V(12, len, 90) : V(len, 12, 90), false); }
      avoid.push([-1800, 2150, 520]); }

    // ---- the challenge board, south-east of the square, under its own little roof
    { const [x, y] = [800, -660]; S(noticeBoard(320), x, y, 0, 180); Solid(V(x, y, 170), V(40, 360, 340), true); avoid.push([x, y, 400]);
      VSPOTS.signs.push({ kind: 'wood', o: { text: 'Challenge Board', sub: 'contracts posted daily', w: 1000, h: 250, seed: 5 }, at: [x - 44, y, 400], face: [-1, 0], h: 84 }); lit(x - 40, y + 175, 300); }

    // ---- the Lucky Toadstool: a giant cap on twisted roots, a wooden floor, lamps under the gills, the tables
    { const [x, y] = CASINO, Rr = 1150; avoid.push([x, y, Rr + 260]);
      S(toadstoolCap(Rr, 560, 0xb82a2a), x, y, 620, 0);
      Cyl(V(x, y, 9), Rr * 2 - 100, 18, 0x7a4a2a, true, false); Cyl(V(x, y, 19), Rr * 2 - 160, 2, 0x8a5a34, false, false);
      for (let r = 300; r < Rr - 80; r += 130) Cyl(V(x, y, 20 + (r % 3) * 0.1), r * 2, 1, r % 260 ? 0x7a4a2a : 0x6a3e24, false, false);
      Cyl(V(x, y, 21), 1300, 1, 0x7a1a1a, false, false); Cyl(V(x, y, 21.4), 1200, 1, 0x9a2a22, false, false);
      for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + 0.45, px = x + Math.cos(a) * (Rr - 230), py = y + Math.sin(a) * (Rr - 230); if (Math.cos(a) < -0.8) continue; S(rootPillar(620, i), px, py, 18, (a * 180) / Math.PI); Solid(V(px, py, 320), V(110, 110, 640), true); }
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, r = i % 3 ? 760 : 400, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; Box(V(px, py, 560), V(3, 3, 80), VC.iron, false, false); Glow(V(px, py, 505), V(34, 34, 42), i % 2 ? 0xffc46a : 0xff8a5a, 2); Lamp(V(px, py, 500), { r: 1, g: 0.7, b: 0.45 }, 2, 900, false); }
      for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; Glow(V(x + Math.cos(a) * (Rr + 6), y + Math.sin(a) * (Rr + 6), 572), V(12, 12, 12), i % 2 ? 0xfff0a0 : 0xff6a4a, 2); }
      const ex = x - Rr - 60; for (const s of [-1, 1]) { Cyl(V(ex, y + s * 330, 200), 50, 400, VC.woodD, true, false); Glow(V(ex, y + s * 330, 420), V(40, 40, 40), 0xffd27a, 2); }
      VSPOTS.signs.push({ kind: 'marquee', o: {}, at: [ex - 14, y, 540], face: [-1, 0], h: 330, glow: 1 });
      Box(V(ex + 260, y, 23), V(560, 220, 1), 0x9a2a22, false, false);
      const C = VSPOTS.casino;
      { const [tx, ty] = C.roulette.table; S(rouletteTable(false), tx, ty, 18, 0, C.T); Solid(V(tx, ty, 50), V(220, 140, 90), true); }
      { const [tx, ty] = C.blackjack.table; S(cardTable(true, false), tx, ty, 18, -90, C.T); Solid(V(tx, ty, 45), V(180, 180, 80), true); }
      { const [tx, ty] = C.dice.table; S(diceTable(false), tx, ty, 18, 0, C.T); Solid(V(tx, ty, 50), V(210, 110, 90), true); }
      C.slots.forEach(([sx, sy], i) => { S(slotMachine([0xb8282a, 0x2a6aa8, 0x3a8a4a][i]), sx + C.slotOut, sy, 18, 180, C.SL); Solid(V(sx + C.slotOut, sy, 90), V(56, 60, 160), true); });
      for (const T of [C.roulette, C.blackjack, C.dice]) for (const s of [-1, 1]) { const sx = T.at[0] + s * 110, sy = T.at[1]; Cyl(V(sx, sy, 44), 40, 7, 0x9a2a22, false, false); Cyl(V(sx, sy, 30), 9, 28, VC.brass, false, false); Cyl(V(sx, sy, 20), 32, 4, VC.brass, false, false); }
      Box(V(x + 960, y - 200, 55), V(100, 500, 110), VC.woodD, true, true); Box(V(x + 960, y - 200, 114), V(120, 520, 10), VC.brass, false, false);
      for (let i = 0; i < 7; i++) Cyl(V(x + 990, y - 400 + i * 60, 140), 16, 40, [0x2a6a3a, 0x8a2a2a, 0xc8a24a, 0x3a4a8a][i % 4], false, false); }

    // ---- the Way Down: the arch set into a knoll of mossy boulders at the foot of the oldest giant
    { const [x, y] = GATE; avoid.push([x, y, 900]);
      const AF = y - 66 + 60, behind = (r) => AF + r * 1.2, side = (r) => 340 + r * 1.2;
      for (let i = 0; i < 7; i++) { const r = rr(560, 760), ax = (i - 3) * 340 + rr(-50, 50), ay = behind(r) + rr(20, 160); S(rock(r, 20 + i), ax, ay, r * 0.18 + (3 - Math.abs(i - 3)) * 70, rr(0, 360)); Solid(V(ax, ay, r * 0.6), V(r * 1.5, r * 1.2, r * 1.2), true); }
      for (const sg of [-1, 1]) for (let k = 0; k < 4; k++) { const r = rr(340, 520) - k * 20, ax = sg * (side(r) + k * 240 + rr(0, 60)), ay = y - 120 + k * 120 + rr(-40, 60); S(rock(r, 3 + k + (sg + 1) * 6), ax, ay, -r * 0.2, rr(0, 360)); Solid(V(ax, ay, r * 0.35), V(r * 1.5, r * 1.2, r * 1.0), true, rr(0, 90)); }
      for (const sg of [-1, 1]) { S(bush(150, VC.leaf, 0, 40 + sg), x + sg * 380, y - 40, 0, 0); S(bush(120, VC.leaf2, 0xf08aa8, 50 + sg), x + sg * 470, y - 170, 0, 0); Solid(V(x + sg * 380, y - 40, 70), V(220, 220, 140), false); Solid(V(x + sg * 470, y - 170, 60), V(180, 180, 120), false); }
      Solid(V(x, y + 190, 430), V(680, 200, 860), true);
      Blocker(V(0, y + 260, 1500), V(VSIZE * 2 + 1200, 160, 3000));
      VSPOTS.signs.push({ kind: 'stone', o: { text: 'The Way Down', sub: 'twenty rooms, straight down' }, at: [x, y - 112, 870], face: [0, -1], h: 190 });
      for (let k = 0; k < 9; k++) Box(V(x, y - 80 - k * 40, 2 + k * 0.01), V(700 - k * 20, 40, 2), mix(VC.stone, VC.stoneD, (k % 2) * 0.4), false, false);
      for (const s of [-1, 1]) { S(lanternPost(360, s + 2), x + s * 640, y - 300, 0, s < 0 ? 0 : 180); Solid(V(x + s * 640, y - 300, 180), V(24, 24, 360), false); lit(x + s * 640 + (s < 0 ? 62 : -62), y - 300, 302, { r: 1, g: 0.8, b: 0.4 }, 1100); }
      for (let i = 0; i < 10; i++) { const [k, b] = flower(rr(40, 70), [0xf08aa8, 0xf6d04a, 0xffffff, 0xa070d0][i % 4], 0xf6c43a, i); Shape(k, b, V(x + (i < 5 ? -1 : 1) * rr(450, 560), y - 140 + rr(-60, 60), 0), R(0, rr(0, 360), 0)); } }

    // ---- other cottages, a treehouse up the north-east giant, the pond
    const houses = [[2250, -1250, 380, 250, 0x3a6a9a, 150], [2350, 1550, 440, 280, 0xd8a030, 200], [-2450, -150, 400, 260, 0x8a4aa0, 20], [-760, -2450, 340, 230, 0xc8392e, 60], [1000, -2450, 380, 250, 0x5a8a3a, 120]];
    houses.forEach(([x, y, h, r, cap, yaw], i) => { S(shroomHouse(h, r, cap, i % 2 ? VC.cream2 : VC.cream, 10 + i), x, y, 0, yaw); Solid(V(x, y, h / 2), V(r * 2.2, r * 2.2, h), true); avoid.push([x, y, r * 2.4]); });
    { const [gx, gy, , gr] = GIANTS[2], z = 900, R0 = gr * 1.25, R1 = gr * 2.0;
      for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; Box(V(gx + Math.cos(a) * (R0 + R1) / 2, gy + Math.sin(a) * (R0 + R1) / 2, z), V(R1 - R0, ((R0 + R1) * Math.PI) / 24 + 6, 16), i % 2 ? VC.woodL : VC.wood, false, false, (a * 180) / Math.PI); if (i % 2 === 0) { Cyl(V(gx + Math.cos(a) * R1, gy + Math.sin(a) * R1, z + 50), 8, 100, VC.woodD, false, false); } if (i % 4 === 0) strut(gx + Math.cos(a) * (R1 - 30), gy + Math.sin(a) * (R1 - 30), z - 220, 440); }
      for (let i = 0; i < 24; i++) { const a = ((i + 0.5) / 24) * Math.PI * 2; Box(V(gx + Math.cos(a) * R1, gy + Math.sin(a) * R1, z + 92), V(8, ((R1) * Math.PI) / 12, 8), VC.woodD, false, false, (a * 180) / Math.PI + 90); }
      { const a = Math.PI * 1.2, hx2 = gx + Math.cos(a) * (R0 + R1) / 2, hy2 = gy + Math.sin(a) * (R0 + R1) / 2; S(shroomHouse(260, 150, 0x6a8a3a, VC.cream2, 31), hx2, hy2, z + 8, 200); }
      { const a = Math.PI * 1.05, lx = gx + Math.cos(a) * (R1 + 10), ly = gy + Math.sin(a) * (R1 + 10); for (const s of [-1, 1]) Cyl(V(lx - Math.sin(a) * s * 26, ly + Math.cos(a) * s * 26, z / 2), 5, z, 0xc8a878, false, false); for (let k = 1; k < 12; k++) Box(V(lx, ly, k * (z / 12)), V(8, 60, 5), VC.woodD, false, false, (a * 180) / Math.PI + 90); }
      for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; hang(gx + Math.cos(a) * (R1 - 20), gy + Math.sin(a) * (R1 - 20), z - 10, z - 120); } }
    { const [x, y] = [1150, 1800], r = 400; avoid.push([x, y, r + 150]);
      Cyl(V(x, y, 1.1), r * 2 + 80, 1, 0x6a5a3a, false, false); Cyl(V(x, y, 2.2), r * 2, 1, 0x3a6e7a, false, false); Cyl(V(x, y, 2.6), r * 1.5, 1, 0x447e8a, false, false);
      for (let i = 0; i < 7; i++) { const a = rnd() * 6.28, d = rnd() * r * 0.8; Cyl(V(x + Math.cos(a) * d, y + Math.sin(a) * d, 3.4), rr(60, 100), 1.4, 0x5a9a3a, false, false); if (i % 3 === 0) Ball(V(x + Math.cos(a) * d + 10, y + Math.sin(a) * d, 10), V(18, 18, 14), 0xf08aa8); }
      for (let i = 0; i < 22; i++) { const a = rnd() * 6.28, d = r + rr(-30, 30); const h = rr(80, 150); Cyl(V(x + Math.cos(a) * d, y + Math.sin(a) * d, h / 2 - 4), 6, h, 0x6a8a3a, false, false); if (i % 4 === 0) { rr(0, 1); Box(V(x + Math.cos(a) * d, y + Math.sin(a) * d, h - 12), V(10, 10, 30), 0x6a4a2a, false, false); } }
      for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.28 + 0.2; { const rs = rr(40, 80), px = x + Math.cos(a) * (r + 40), py = y + Math.sin(a) * (r + 40); S(rock(rs, 40 + i), px, py, 0, rr(0, 360)); Solid(V(px, py, rs * 0.3), V(rs * 1.5, rs * 1.3, rs * 0.6), false); } }
      Box(V(x + r - 120, y - 80, 30), V(360, 160, 10), VC.woodL, true, false); for (const s of [-1, 1]) Cyl(V(x + r - 260, y - 80 + s * 70, 20), 12, 60, VC.woodD, false, false);
      Ball(V(x - 200, y + 160, 22), V(80, 70, 40), VC.stone); Ball(V(x - 200, y + 160, 58), V(44, 38, 30), 0x5a9a3a); for (const s of [-1, 1]) Ball(V(x - 186, y + 160 + s * 12, 74), V(12, 12, 12), 0xf4ecd6); }

    // ---- lantern posts along the roads
    for (const [x, y, side] of [[-300, -1150, -1], [300, -2550, 1], [-300, -3100, -1], [300, 1150, 1], [-300, 2000, -1]]) { S(lanternPost(300, Math.abs(y) % 4), x, y, 0, side < 0 ? 0 : 180); Solid(V(x, y, 150), V(24, 24, 300), false); lit(x + (side < 0 ? 62 : -62), y, 242); }
    // the cosy things: lit windows, smoke from the chimneys, pots by the doors
    const shroomExtras = (x, y, h, r, yaw) => {
      const ya = (yaw * Math.PI) / 180;
      const CR = r * 2.15, CH = r * 1.35, cx2 = -CR * 0.35, cy2 = CR * 0.25; VSPOTS.smoke.push([x + cx2 * Math.cos(ya) - cy2 * Math.sin(ya), y + cx2 * Math.sin(ya) + cy2 * Math.cos(ya), h - 20 + CH * 0.72 + 146]);
      const fx = stemR(h, r, 40) + 70; for (const sd of [-1, 1]) { const px = x + Math.cos(ya) * fx - Math.sin(ya) * sd * 100, py = y + Math.sin(ya) * fx + Math.cos(ya) * sd * 100; Cyl(V(px, py, 18), 42, 36, 0xb8643a, false, false); Cyl(V(px, py, 37), 48, 5, 0x8a4a2a, false, false); S(bush(30, VC.leaf2, sd > 0 ? 0xf6d04a : 0xf08aa8, 70 + sd + Math.round(x) % 5), px, py, 30, 0); }
    };
    shroomExtras(-1640, 450, 500, 310, 0);
    houses.forEach(([x, y, h, r, , yaw]) => shroomExtras(x, y, h, r, yaw));
    for (const [x, y, w, d, h, yaw] of [[-1820, 1480, 700, 560, 320, 0], [-1560, -800, 600, 480, 300, 0]]) {
      const ya = (yaw * Math.PI) / 180, fx = w / 2 + 9; for (const sd of [-1, 1]) { const ly = sd * d * 0.3; Glow(V(x + Math.cos(ya) * fx - Math.sin(ya) * ly, y + Math.sin(ya) * fx + Math.cos(ya) * ly, h * 0.55), V(3, 80, 68), 0xffc870, 0, R(0, yaw, 0)); }
      const cx2 = -w * 0.25, cy2 = -d * 0.2; VSPOTS.smoke.push([x + cx2 * Math.cos(ya) - cy2 * Math.sin(ya), y + cx2 * Math.sin(ya) + cy2 * Math.cos(ya), h - 60 + h * 1.05 + 150]);
    }
    // paper lanterns between the houses and along the road
    paper(-300, -1150, 290, 300, -2550, 290, 80); paper(300, 1150, 290, -300, 2000, 290, 80);
    paper(-1060 + 40, 450 - 370, 320, -1040 + 40, -800 + 360, 320, 70);
    { const ex = CASINO[0] - 1210; paper(ex, CASINO[1] - 330, 400, 720, 120, 320, 60); paper(ex, CASINO[1] + 330, 400, 720, 520, 320, 60); }
    // the campfire: a ring of stones, a teepee of logs, embers, three log seats and a pot on a tripod
    { const [x, y] = VSPOTS.fire; avoid.push([x, y, 480]);
      Cyl(V(x, y, 1.8), 220, 1, 0x4a3a2a, false, false); Cyl(V(x, y, 2.4), 120, 1, 0x2a1a10, false, false);
      for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 2; Oct(V(x + Math.cos(a) * 74, y + Math.sin(a) * 74, 12), V(40, 34, 26), mix(VC.stone, VC.stoneD, (i % 3) / 2), false, false, R(0, (a * 180) / Math.PI, 0)); }
      for (let k = 0; k < 5; k++) { const a = (k / 5) * 360; M.Cyl(V(x + Math.cos((a * Math.PI) / 180) * 18, y + Math.sin((a * Math.PI) / 180) * 18, 30), 14, 80, k % 2 ? VC.woodD : VC.wood, false, false, R(-62, a + 180, 0)); }
      Glow(V(x, y, 14), V(60, 60, 20), 0xff6a1a, 2); Glow(V(x, y, 26), V(30, 30, 30), 0xffc04a, 2);
      Lamp(V(x, y, 90), { r: 1, g: 0.55, b: 0.25 }, 2.6, 1400, false);
      for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.5, bx = x + Math.cos(a) * 250, by = y + Math.sin(a) * 250, yaw = (a * 180) / Math.PI + 90; M.Cyl(V(bx, by, 24), 46, 190, VC.wood, false, false, R(90, yaw, 0)); Solid(V(bx, by, 22), V(60, 60, 44), true, yaw); for (const e of [-1, 1]) Cyl(V(bx + Math.cos(a + Math.PI / 2) * e * 95, by + Math.sin(a + Math.PI / 2) * e * 95, 24), 40, 3, 0xd8b07a, false, false); }
      for (let k = 0; k < 3; k++) { const a = (k / 3) * 360 + 30; M.Cyl(V(x + Math.cos((a * Math.PI) / 180) * 40, y + Math.sin((a * Math.PI) / 180) * 40, 70), 5, 150, VC.iron, false, false, R(-15, a + 180, 0)); }
      Ball(V(x, y, 100), V(46, 46, 40), 0x2a2a2e); Box(V(x, y, 140), V(2, 2, 40), VC.iron, false, false); }
    // lantern stakes along the road
    for (const sd of [-1, 1]) for (const y of [-900, -1500, -2300, -2900, 900, 1350, 1750, 2150]) { const x = sd * 240 + rr(-10, 10); Cyl(V(x, y, 30), 6, 60, VC.woodD, false, false); Glow(V(x, y, 68), V(15, 15, 19), 0xffcf7a, 2); Box(V(x, y, 80), V(18, 18, 4), VC.iron, false, false); for (const [u, v] of [[-7, -7], [7, -7], [-7, 7], [7, 7]]) Box(V(x + u, y + v, 69), V(2, 2, 20), VC.iron, false, false); if (sd > 0) Lamp(V(x, y, 90), { r: 1, g: 0.72, b: 0.42 }, 1.5, 700, false); }
    // ---- scatter: mossy logs, ferns, toadstools, bushes, a few smaller trees, kept off the paths and the buildings
    const onPath = (x, y) => (Math.abs(x) < 340 && y > -3500 && y < GATE[1]) || Math.hypot(x, y) < 820;
    const place = (n, pad, fn) => { for (let i = 0, t = 0; i < n && t < n * 30; t++) { const x = rr(-VSIZE - 900, VSIZE + 900), y = rr(-VSIZE - 900, VSIZE + 900); if (onPath(x, y) || !clear(x, y, pad)) continue; fn(x, y, i); avoid.push([x, y, pad * 0.6]); i++; } };
    // the wood round the hollow: more giants' trunks and firs, fading into the haze
    for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2 + rr(-0.03, 0.03), d = rr(3700, 5200), ca = Math.cos(a), sa = Math.sin(a), k = Math.max(Math.abs(ca), Math.abs(sa)), x = (ca / k) * d, y = (sa / k) * d;
      if (i % 4 === 0) S(giantTree(rr(4200, 5600), rr(380, 520), 10 + (i % 7), 0x3a6230), x, y, 0, rr(0, 360)); else { const fir = rnd() < 0.45, h = fir ? rr(1300, 1900) : rr(1100, 1600); S(tree(h, [VC.leaf3, 0x3e6a2c, VC.leaf][i % 3], i, fir ? 1 : 0), x, y, 0, rr(0, 360)); } }
    place(10, 380, (x, y, i) => { const fir = i % 4 === 0, h = fir ? rr(800, 1100) : rr(650, 950); S(tree(h, [VC.leaf3, VC.leaf, 0x3e6a2c][i % 3], 200 + i, fir ? 1 : 0), x, y, 0, rr(0, 360)); Solid(V(x, y, 300), V(h * 0.1, h * 0.1, 600), true); });
    place(16, 200, (x, y, i) => { const L = rr(200, 340), [k, b] = mossLog(L, i); Shape(k, b, V(x, y, 0), R(0, rr(0, 360), 0)); Solid(V(x, y, 30), V(L * 0.8, 60, 60), true); });
    place(16, 230, (x, y, i) => { const r = rr(80, 190); S(rock(r, 60 + i), x, y, -r * 0.15, rr(0, 360)); Solid(V(x, y, r * 0.32), V(r * 1.5, r * 1.25, r * 0.75), r > 110); });
    place(46, 150, (x, y, i) => { const bs = rr(70, 140); S(bush(bs, [VC.leaf3, VC.leaf, 0x4e7a32][i % 3], i % 3 === 0 ? [0xd8302a, 0xf08aa8, 0xf6f0e0][(i / 3) % 3 | 0] : 0, i), x, y, 0, rr(0, 360)); if (bs >= 90) Solid(V(x, y, bs * 0.45), V(bs * 1.5, bs * 1.5, bs * 0.9), false); });
    place(10, 240, (x, y, i) => { const h = rr(180, 320); S(flower(h, [0xf08aa8, 0xf6d04a, 0x6a9ae0, 0xa070d0, 0xffffff][i % 5], 0xf6c43a, i, 5 + (i % 3)), x, y, 0, rr(0, 360)); Solid(V(x, y, h / 2), V(20, 20, h), false); });
    place(120, 40, (x, y, i) => { const [k, b] = flower(rr(26, 50), [0xf08aa8, 0xf6d04a, 0x6a9ae0, 0xa070d0, 0xffffff, 0xff8a4a][i % 6], [0xf6c43a, 0x5a3a22][i % 2], i, 5 + (i % 2)); Shape(k, b, V(x, y, 0), R(0, rr(0, 360), 0)); });
    place(200, 45, (x, y, i) => { const [k, b] = fern(rr(60, 110), i); Shape(k, b, V(x, y, 0), R(0, rr(0, 360), 0)); });
    place(110, 55, (x, y, i) => { const glow = i % 5 === 0, [k, b] = toadstoolCluster(0.8 + rnd() * 0.8, glow ? 0x7ad8c4 : [0xc8392e, 0xd88a3a, 0xc8392e, 0x8a5a3a][i % 4], i); Shape(k, b, V(x, y, 0), R(0, rr(0, 360), 0)); if (glow) Glow(V(x, y, 26), V(36, 36, 18), 0x7ae8d0, 1); });
    for (let i = 0; i < 40; i++) { const x = rr(-VSIZE, VSIZE), y = rr(-VSIZE, VSIZE); if (onPath(x, y) || !clear(x, y, 30)) continue; Cyl(V(x, y, 2.6 + i * 0.01), rr(140, 320), 1, [0x5e9a3a, 0x6aa842, 0x4e8a32][i % 3], false, false); }   // cushions of bright moss
    for (let y = -3300; y < GATE[1] - 300; y += 70) for (const sd of [-1, 1]) { if (Math.abs(y) < 880) continue; const x = sd * rr(280, 460); if (!clear(x, y, 10)) continue; const r = rnd();
      if (r < 0.5) { const [k, b] = grassTuft(rr(30, 60), Math.round(y)); Shape(k, b, V(x, y, 0), R(0, rr(0, 360), 0)); } else if (r < 0.85) { const [k, b] = fern(rr(45, 85), Math.round(y)); Shape(k, b, V(x, y, 0), R(0, rr(0, 360), 0)); } else { const [k, b] = flower(rr(26, 44), [0xf08aa8, 0xf6d04a, 0xffffff, 0xa070d0][Math.round(y / 70) & 3], 0xf6c43a, Math.round(y), 5); Shape(k, b, V(x, y, 0), R(0, rr(0, 360), 0)); } }
    for (let i = 0, t = 0; i < 700 && t < 6000; t++) { const x = rr(-VSIZE - 600, VSIZE + 600), y = rr(-VSIZE - 600, VSIZE + 600); if (onPath(x, y) || !clear(x, y, 10)) continue; const [k, b] = grassTuft(rr(28, 55), i); Shape(k, b, V(x, y, 0), R(0, rr(0, 360), 0)); i++; }
    // ---- the far hills, a blue haze of ridges
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + rr(-0.1, 0.1), d = rr(10000, 13000); S(hill(rr(4000, 7000), rr(2500, 4000), rr(1600, 3200), [0x5a8a3e, 0x669644, 0x527a38][i % 3]), Math.cos(a) * d, Math.sin(a) * d, -400, (a * 180) / Math.PI); }
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.3, d = rr(18000, 23000); S(hill(rr(7000, 10000), rr(3000, 5000), rr(3500, 6000), 0x6a8a98), Math.cos(a) * d, Math.sin(a) * d, -800, (a * 180) / Math.PI); }
    // ---- the edge: nobody walks out of the hollow
    for (const s of [-1, 1]) { Blocker(V(s * (VSIZE + 400), 0, 1500), V(200, VSIZE * 2 + 1200, 3000)); Blocker(V(0, s * (VSIZE + 400), 1500), V(VSIZE * 2 + 1200, 200, 3000)); }
  });
  // a post under the treehouse's deck
  function strut(x, y, z, h) { M.Cyl(V(x, y, z), 12, h, VC.woodD, false, false); }
}
