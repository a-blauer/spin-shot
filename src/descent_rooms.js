// The Descent's eight rooms, each laid out by hand. Every room is one idea carried through its floor, its centrepiece
// and the things you fight around: a bone nave, a foundry floor, a frozen vault, a flooded wine cellar, a gaming hall,
// a wreck on the sea bed, a hive and a chamber that is coming apart.
// What is solid here is what you fight around (and the nav grid knows about it). Everything else is for the eye.
// The four outer walls are never touched by anything solid, so a wall-run never snags.
import { V, V2, R } from './mapkit.js';

export function craftRoom(kind, K) {
  const { M, T, hx, hy, H, rnd, rr, pillarBase } = K;
  const { Box, BoxRot, Glow, Cyl, Oct, Ball, ConeShape, Pyramid, Ring, Floor, Lamp, Wedge } = M;
  const L = (x, y, z, c, r = 1300, k = 2.2) => Lamp(V(x, y, z), { r: c[0], g: c[1], b: c[2] }, k, r, false);
  const AX = R(90, 0, 0), AY = R(0, 0, 90);   // a cylinder laid along X, along Y
  const hit = (x, y, w, d, h, nav = true, z = 0) => M.Solid(V(x, y, z + h / 2), V(w, d, h), nav);   // the unseen body of something drawn from loose parts
  const solid = (x, y, w, d, h, col, yaw = 0) => Box(V(x, y, h / 2), V(w, d, h), col, true, true, yaw);
  const deco = (x, y, z, w, d, h, col, yaw = 0) => Box(V(x, y, z), V(w, d, h), col, false, false, yaw);
  // a floor of laid slabs: two tones, a few picked out darker, on a grid of `s`
  const slabs = (s, a, b, c, skip = () => false) => {
    for (let x = -hx; x < hx - 1; x += s) for (let y = -hy; y < hy - 1; y += s) {
      if (skip(x + s / 2, y + s / 2)) continue;
      const r = rnd(); Floor(V2(x + 6, y + 6), V2(x + s - 6, y + s - 6), 1.4, r < 0.12 ? c : (Math.round(x / s) + Math.round(y / s)) % 2 ? a : b);
    }
  };
  const candle = (x, y, z, h = 40) => { Cyl(V(x, y, z + h / 2), 14, h, 0xe8dcc0, false, false); Glow(V(x, y, z + h + 12), V(12, 12, 24), 0xffc86a, 3); };
  const chain = (x, y, z0, z1, col = 0x2a2e30) => { for (let z = z0; z < z1; z += 46) deco(x, y, z, 12, 12, 30, col, (z / 46 | 0) % 2 ? 45 : 0); };
  const skull = (x, y, z, s, yaw = 0, eye = T.glow) => {   // a carved skull, facing +Y before the turn
    const c = Math.cos(yaw * Math.PI / 180), n = Math.sin(yaw * Math.PI / 180), at = (fx, fy, fz) => V(x + (fx * c - fy * n) * s, y + (fx * n + fy * c) * s, z + fz * s);
    Ball(at(0, 0, 0.55), V(s, s * 1.05, s * 0.95), 0xd8cfb8); Box(at(0, 0.12, 0.08), V(s * 0.62, s * 0.6, s * 0.36), 0xc8bea4, false, false, yaw);
    for (const e of [-1, 1]) { Ball(at(e * 0.2, 0.43, 0.52), V(s * 0.24, s * 0.16, s * 0.26), 0x0e0c0c); Glow(at(e * 0.2, 0.47, 0.52), V(s * 0.08, s * 0.08, s * 0.08), eye, 2); }
    Pyramid(at(0, 0.5, 0.3), V(s * 0.12, s * 0.1, s * 0.16), 0x0e0c0c);
    for (let k = -2; k <= 2; k++) Box(at(k * 0.11, 0.42, -0.06), V(s * 0.08, s * 0.05, s * 0.14), 0xefe8d4, false, false, yaw);
  };

  switch (kind) {
    // ------------------------------------------------------------------------------------------------ THE OSSUARY
    case 0: {
      const bone = 0xd8cfb8, stone = T.wall, dark = 0x12181a;
      slabs(400, T.floor, T.floor2, 0x141a1e, (x, y) => Math.abs(x) < 300);
      // the nave: a runner of pale stone down the middle, edged in bone, with a line of grave slabs set into it
      Floor(V2(-300, -hy), V2(300, hy), 1.6, 0x39464c); for (const s of [-1, 1]) Floor(V2(s * 300 - 14, -hy), V2(s * 300 + 14, hy), 2.2, bone);
      for (let y = -2400; y <= 2400; y += 800) { if (Math.abs(y) < 500) continue; Floor(V2(-150, y - 250), V2(150, y + 250), 2.4, 0x232c30); Floor(V2(-110, y - 200), V2(110, y + 200), 2.8, 0x2c383e); Floor(V2(-12, y - 120), V2(12, y + 150), 3.2, bone); Floor(V2(-70, y + 50), V2(70, y + 74), 3.2, bone); }
      // two arcades: clustered columns, and a pointed arch sprung from each to the next and across the nave
      const cols = [-2100, -700, 700, 2100];
      for (const sx of [-1, 1]) for (const y of cols) {
        const x = sx * 1250;
        Cyl(V(x, y, H / 2), 260, H, stone, true, true); Oct(V(x, y, 50), V(420, 420, 100), T.trim, false, false); Oct(V(x, y, 120), V(340, 340, 40), stone, false, false);
        for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; Cyl(V(x + Math.cos(a) * 150, y + Math.sin(a) * 150, 140 + 280), 70, 560, 0x3c4a50, false, false); }
        Oct(V(x, y, 720), V(400, 400, 60), T.trim, false, false); Glow(V(x, y, 690), V(300, 300, 8), T.glow, 7);
        for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; skull(x + Math.cos(a) * 150, y + Math.sin(a) * 150, 250, 90, -90 + a * 180 / Math.PI); }
        // across the nave to its twin (one side builds both halves)
        if (sx > 0) for (const e of [-1, 1]) BoxRot(V(e * 640, y, 860), V(1340, 70, 60), 0x3c4a50, R(0, 0, e * -13), false);
      }
      for (const sx of [-1, 1]) for (let k = 0; k < cols.length - 1; k++) { const y0 = cols[k], y1 = cols[k + 1], m = (y0 + y1) / 2; for (const e of [-1, 1]) BoxRot(V(sx * 1250, m + e * 350, 850), V(70, 760, 60), 0x3c4a50, R(0, 0, 0), false); Glow(V(sx * 1250, m, 930), V(40, 40, 60), T.glow, 2); chain(sx * 1250, m, 700, 1000); deco(sx * 1250, m, 640, 150, 150, 120, 0x1a1e20); skull(sx * 1250, m, 590, 80, sx > 0 ? 90 : -90); }
      // the dais: three shallow steps, a sarcophagus with its lid pushed aside, four candle stands, and something in it that is not dead enough
      for (let k = 0; k < 2; k++) Box(V(0, 0, 20 + k * 40), V(1500 - k * 300, 1100 - k * 300, 40), k ? T.trim : T.floor2, true, false);
      solid(0, 0, 300, 620, 190, 0x39464c); Box(V(0, 0, 80 + 95), V(340, 660, 30), T.trim, false, false); Box(V(0, 0, 80 + 20), V(340, 660, 40), T.trim, false, false);
      BoxRot(V(150, 40, 80 + 215), V(320, 640, 36), 0x4a5a60, R(0, 14, -16), false); Glow(V(-30, 0, 80 + 196), V(200, 500, 6), T.glow, 0); L(0, 0, 420, T.lamp, 1500, 2.6);
      for (const k of [-1, 0, 1]) Box(V(-152, k * 190, 80 + 110), V(8, 120, 110), bone, false, false);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const x = sx * 480, y = sy * 400; hit(x, y, 70, 70, 210, false, 80); Cyl(V(x, y, 80 + 90), 26, 180, 0x2a2e30, false, false); Cyl(V(x, y, 80 + 186), 90, 12, 0x2a2e30, false, false); for (let k = 0; k < 3; k++) candle(x + Math.cos(k * 2.1) * 28, y + Math.sin(k * 2.1) * 28, 80 + 192, 30 + k * 12); }
      // the galleries along each side wall: steps up to a row of standing coffins, some of them open
      for (const sx of [-1, 1]) {
        for (let k = 0; k < 3; k++) Box(V(sx * (hx - 300 + k * 90), 0, 20 + k * 40), V(600 - k * 180, hy * 2 - 1600, 40), k % 2 ? T.trim : T.floor2, true, false);
        for (let y = -1950, i = 0; y <= 1950; y += 325, i++) {
          if (Math.abs(Math.abs(y) - 500) < 250) continue;
          const x = sx * (hx - 46), open = i % 3 === 1;
          BoxRot(V(x, y, 120 + 230), V(70, 200, 460), 0x2a1e18, R(0, 0, 0), false); deco(x - sx * 36, y, 120 + 230, 6, 170, 420, open ? 0x0a0808 : 0x3a2a20);
          if (open) { Ball(V(x - sx * 40, y, 120 + 380), V(60, 60, 66), bone); deco(x - sx * 40, y, 120 + 250, 30, 100, 190, 0x8a8468); Glow(V(x - sx * 64, y - 12, 120 + 386), V(8, 8, 8), T.glow, 2); Glow(V(x - sx * 64, y + 12, 120 + 386), V(8, 8, 8), T.glow, 2); }
          else { deco(x - sx * 42, y, 120 + 300, 4, 20, 200, T.trim); deco(x - sx * 42, y, 120 + 340, 4, 90, 20, T.trim); }
          candle(x - sx * 110, y + 150, 120, 26);
        }
      }
      // heaps of the dead at the feet of the end walls, and the great skull over each door
      for (const sy of [-1, 1]) { skull(0, sy * (hy - 20), 640, 300, sy > 0 ? 180 : 0); for (const e of [-1, 1]) { for (let i = 0; i < 26; i++) { const x = e * rr(700, 2500), y = sy * (hy - rr(40, 300)); if (Math.abs(x + 900) < 400 || Math.abs(x - 1300) < 800 || Math.abs(x - 700) < 250) continue; if (rnd() < 0.45) Ball(V(x, y, rr(20, 90)), V(58, 56, 62), bone); else BoxRot(V(x, y, rr(14, 60)), V(rr(90, 170), 14, 14), bone, R(rr(-20, 20), rr(0, 180), 0), false); } } }
      break;
    }
    // ------------------------------------------------------------------------------------------------ CINDER WORKS
    case 1: {
      const iron = 0x3a3e46, rust = 0x6a3a22, hot = 0xff6a1a, white = 0xffd27a, soot = 0x14100e, brick = 0x4a2a20;
      slabs(425, T.floor, 0x2c1e18, 0x1a1210, (x, y) => (Math.abs(x) < 140 || Math.abs(y) < 140) && Math.abs(x) < 2600 && Math.abs(y) < 2400);
      // channels of slag cut into the floor: from the crucible out to each wall, with gratings to cross on
      const chan = (x0, y0, x1, y1) => { const ax = x0 === x1; Floor(V2(Math.min(x0, x1) - (ax ? 120 : 0), Math.min(y0, y1) - (ax ? 0 : 120)), V2(Math.max(x0, x1) + (ax ? 120 : 0), Math.max(y0, y1) + (ax ? 0 : 120)), 1.8, soot);
        Glow(V((x0 + x1) / 2, (y0 + y1) / 2, 2.6), ax ? V(130, Math.abs(y1 - y0), 2) : V(Math.abs(x1 - x0), 130, 2), hot, 0); Glow(V((x0 + x1) / 2, (y0 + y1) / 2, 3.4), ax ? V(46, Math.abs(y1 - y0), 2) : V(Math.abs(x1 - x0), 46, 2), white, 0); };
      chan(0, 520, 0, 2300); chan(0, -520, 0, -2300); chan(520, 0, 2600, 0); chan(-520, 0, -2600, 0);
      for (const [x, y, ax] of [[0, 1300, 0], [0, -1300, 0], [1500, 0, 1], [-1500, 0, 1], [0, 2000, 0], [0, -2000, 0]]) { for (let k = -3; k <= 3; k++) Box(V(x + (ax ? k * 50 : 0), y + (ax ? 0 : k * 50), 5), ax ? V(22, 300, 10) : V(300, 22, 10), iron, false, false); for (const e of [-1, 1]) Box(V(x + (ax ? 0 : e * 140), y + (ax ? e * 140 : 0), 6), ax ? V(360, 24, 12) : V(24, 360, 12), 0x55585f, false, false); }
      for (const [x, y] of [[0, 2300], [0, -2300], [2600, 0], [-2600, 0]]) { Cyl(V(x, y, 3), 420, 6, soot, false, false); Glow(V(x, y, 5), V(330, 330, 3), hot, 1); Glow(V(x, y, 6.5), V(170, 170, 3), white, 1); L(x, y, 260, [1, 0.5, 0.15], 1100, 2); }
      // the crucible: a brick hearth, an iron pot of bright metal, and a ladle hanging over it from the gantry
      Oct(V(0, 0, 70), V(1100, 1100, 140), brick, true, true); Oct(V(0, 0, 146), V(1160, 1160, 16), iron, false, false);
      Cyl(V(0, 0, 140 + 150), 760, 300, iron, true, true); Cyl(V(0, 0, 140 + 290), 820, 40, 0x55585f, false, false); for (let k = 0; k < 3; k++) Cyl(V(0, 0, 140 + 60 + k * 90), 780, 22, rust, false, false);
      Glow(V(0, 0, 140 + 304), V(700, 700, 8), hot, 1); Glow(V(0, 0, 140 + 310), V(460, 460, 8), white, 1); L(0, 0, 600, [1, 0.55, 0.2], 2000, 3);
      for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; Glow(V(Math.cos(a) * 390, Math.sin(a) * 390, 140 + 160), V(14, 14, 14), hot, 2); }
      Box(V(0, 0, H - 120), V(hx * 2, 160, 120), iron, false, false); for (let x = -hx + 300; x < hx; x += 600) deco(x, 0, H - 120, 40, 200, 150, rust);
      deco(0, 0, H - 210, 300, 240, 70, 0x55585f); chain(-90, 0, 760, H - 230, 0x55585f); chain(90, 0, 760, H - 230, 0x55585f);
      Cyl(V(0, 0, 660), 330, 220, iron, false, false); Cyl(V(0, 0, 764), 360, 26, rust, false, false); Glow(V(0, 0, 772), V(280, 280, 6), white, 1); Glow(V(60, 0, 610), V(26, 26, 130), white, 1); Glow(V(60, 0, 500), V(18, 18, 100), hot, 1);
      // four furnaces: brick stacks with an arched mouth on each open face, banded in iron, a flue up into the roof
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        const x = sx * 1650, y = sy * 1350, w = 1150, d = 950;
        solid(x, y, w, d, H, brick); Box(V(x, y, 40), V(w + 50, d + 50, 80), iron, false, false);
        for (const z of [330, 620, 900]) Box(V(x, y, z), V(w + 16, d + 16, 26), iron, false, false);
        for (let z = 120; z < H - 60; z += 70) for (let k = 0; k < 4; k++) { const e = (k < 2 ? -1 : 1), on = k % 2; deco(x + (on ? e * (w / 2 + 1) : rr(-w / 2 + 80, w / 2 - 80)), y + (on ? rr(-d / 2 + 80, d / 2 - 80) : e * (d / 2 + 1)), z, on ? 3 : rr(90, 150), on ? rr(90, 150) : 3, 26, rnd() < 0.5 ? 0x5a3428 : 0x3c2019); }
        // mouths face the middle of the room and the two side streets
        for (const [fx, fy] of [[-sx, 0], [0, -sy], [sx, 0]]) {
          const mx = x + fx * (w / 2 + 2), my = y + fy * (d / 2 + 2), ax = fx !== 0, mw = 420;
          deco(mx, my, 150, ax ? 6 : mw + 90, ax ? mw + 90 : 6, 300, iron); Cyl(V(mx, my, 300), mw + 90, 6, iron, false, false, ax ? AX : AY);
          Glow(V(mx + fx * 3, my + fy * 3, 140), ax ? V(4, mw, 260) : V(mw, 4, 260), hot, 0); Glow(V(mx + fx * 3, my + fy * 3, 270), V(ax ? 4 : mw, ax ? mw : 4, ax ? mw : mw), hot, 1, ax ? AX : AY);
          Glow(V(mx + fx * 5, my + fy * 5, 110), ax ? V(4, mw * 0.55, 150) : V(mw * 0.55, 4, 150), white, 0);
          for (let k = -2; k <= 2; k++) deco(mx + fx * 8 + (ax ? 0 : k * 90), my + fy * 8 + (ax ? k * 90 : 0), 150, 14, 14, 300, soot);
          L(mx + fx * 260, my + fy * 260, 200, [1, 0.5, 0.15], 900, 2);
          // a gauge and a wheel valve beside it
          const gx = mx + (ax ? fx * 4 : 330), gy = my + (ax ? 330 : fy * 4); Cyl(V(gx, gy, 430), 110, 10, 0xd8d2c0, false, false, ax ? AX : AY); Cyl(V(gx + fx * 4, gy + fy * 4, 430), 126, 6, 0x8a6a2a, false, false, ax ? AX : AY); deco(gx + fx * 8, gy + fy * 8, 448, ax ? 4 : 8, ax ? 8 : 4, 44, 0xc8211b);
        }
        Cyl(V(x + sx * 300, y, H - 150), 300, 300, iron, false, false);
      }
      // rails along both side walls with ore tubs standing on them
      for (const sx of [-1, 1]) { const x = sx * 2900; for (const e of [-1, 1]) Box(V(x + e * 70, 0, 6), V(16, hy * 2 - 500, 12), 0x8a8f99, false, false); for (let y = -hy + 300; y < hy - 250; y += 140) Box(V(x, y, 3), V(220, 46, 6), 0x3a2a1c, false, false);
        for (const y of [-1900, 1500 * sx, 2200]) { if (Math.abs(Math.abs(y) - 500) < 300) continue; solid(x, y, 240, 360, 150, iron); deco(x, y, 156, 250, 370, 12, rust); for (let k = 0; k < 5; k++) Pyramid(V(x + rr(-70, 70), y + rr(-120, 120), 180), V(90, 90, 70), k % 2 ? 0x15151a : 0x2a1a14); Glow(V(x + rr(-50, 50), y + rr(-80, 80), 196), V(26, 26, 16), hot, 2); for (const e of [-1, 1]) for (const f of [-1, 1]) Cyl(V(x + e * 70, y + f * 110, 30), 60, 20, 0x15151a, false, false, AX); } }
      // great gears turning nowhere on the end walls
      for (const sy of [-1, 1]) for (const [gx, gd, gz] of [[-2300, 760, 560], [-1640, 500, 760], [2100, 900, 600]]) { if (Math.abs(gx + 900) < 500 && sy > 0) continue; const y = sy * (hy - 14); Cyl(V(gx, y, gz), gd, 20, iron, false, false, AY); Cyl(V(gx, y - sy * 8, gz), gd * 0.72, 20, rust, false, false, AY); Cyl(V(gx, y - sy * 16, gz), gd * 0.2, 26, 0x8a8f99, false, false, AY); const n = Math.round(gd / 60); for (let k = 0; k < n; k++) { const a = k / n * 6.283; BoxRot(V(gx + Math.cos(a) * gd * 0.52, y, gz + Math.sin(a) * gd * 0.52), V(gd * 0.1, 22, gd * 0.09), iron, R(-a * 57.3, 0, 0), false); } }
      break;
    }
    // ------------------------------------------------------------------------------------------------ RIME VAULT
    case 2: {
      const ice = 0xbfe6ff, pale = 0xdff2ff, deep = 0x4a90c4, snow = 0xeef4f8, steel = 0x5a6a78, navy = 0x18222c;
      // the floor is a frozen lake under drifted snow: plates of ice with dark cracks, and a ring of old vault flagstones round the dais
      slabs(500, 0x30404e, 0x384a5a, 0x283440, (x, y) => Math.hypot(x, y) > 1750 && Math.hypot(x, y) < 3200 && Math.abs(x) < 2700);
      for (let i = 0; i < 34; i++) { const a = rnd() * 6.283, r = rr(1800, 3000), x = Math.cos(a) * r * 0.95, y = Math.sin(a) * r * 0.82, w = rr(200, 520); Floor(V2(x - w, y - w * 0.7), V2(x + w, y + w * 0.7), 1.6 + (i % 5) * 0.1, i % 3 ? 0x8fb8d4 : 0xa8cce2); }
      for (let i = 0; i < 40; i++) { const a = rnd() * 6.283, r = rr(1700, 3000), x = Math.cos(a) * r * 0.95, y = Math.sin(a) * r * 0.82; BoxRot(V(x, y, 2.6), V(rr(160, 520), 7, 2), navy, R(0, rr(0, 180), 0), false); if (i % 2) BoxRot(V(x + 40, y + 30, 2.6), V(rr(80, 220), 5, 2), navy, R(0, rr(0, 180), 0), false); }
      // the dais: three steps of rimed stone, and the thing the vault was built to keep: a figure frozen in a spire of ice
      for (let k = 0; k < 3; k++) { Box(V(0, 0, 20 + k * 40), V(2600 - k * 360, 2600 - k * 360, 40), k % 2 ? 0x8fa6b8 : 0x5a6e80, true, false); for (const e of [-1, 1]) { Box(V(0, e * (1300 - k * 180 - 14), 42 + k * 40), V(2600 - k * 360, 28, 6), snow, false, false); Box(V(e * (1300 - k * 180 - 14), 0, 42 + k * 40), V(28, 2600 - k * 360, 6), snow, false, false); } }
      Cyl(V(0, 0, 120 + 300), 380, 600, deep, true, true);
      BoxRot(V(0, 0, 120 + 420), V(430, 430, 840), ice, R(0, 22, 4), false); BoxRot(V(40, -30, 120 + 330), V(360, 500, 640), pale, R(5, 58, -4), false); Pyramid(V(0, 0, 120 + 950), V(340, 340, 300), ice);
      for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283 + 0.3, r = rr(280, 430), h = rr(260, 620); Pyramid(V(Math.cos(a) * r, Math.sin(a) * r, 120 + h / 2), V(rr(130, 220), rr(130, 220), h), k % 3 ? ice : deep, R(Math.sin(a) * 14, rr(0, 90), -Math.cos(a) * 14)); }
      // the figure, dark inside the ice, seen from either door
      for (const e of [-1, 1]) { deco(0, e * 222, 120 + 330, 150, 6, 330, navy); Ball(V(0, e * 222, 120 + 540), V(110, 10, 120), navy); deco(0, e * 222, 120 + 400, 300, 6, 60, navy); Glow(V(-26, e * 228, 120 + 548), V(14, 4, 10), T.glow, 0); Glow(V(26, e * 228, 120 + 548), V(14, 4, 10), T.glow, 0); }
      Glow(V(0, 0, 124), V(1300, 1300, 3), T.glow, 8); L(0, 0, 700, T.lamp, 2200, 3); for (const e of [-1, 1]) L(e * 700, e * 700, 300, T.lamp, 1000, 2);
      // four broken columns on the dais corners, sheathed in ice, their tops fallen
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const x = sx * 800, y = sy * 800, h = sx * sy > 0 ? 520 : 360; Cyl(V(x, y, 120 + h / 2), 200, h, 0x6a7e90, true, true); Oct(V(x, y, 120 + 30), V(290, 290, 60), 0x8fa6b8, false, false); Box(V(x, y, 120 + h + 20), V(240, 240, 40), ice, false, false); for (let k = 0; k < 5; k++) { const a = k * 1.3; ConeShape(V(x + Math.cos(a) * 96, y + Math.sin(a) * 96, 120 + h - 70 - k * 12), V(40, 40, 150), pale, false, R(180, 0, 0)); }
        hit(x + sx * 420, y + sy * 260, 300, 300, 150, true, 100); BoxRot(V(x + sx * 420, y + sy * 260, 120 + 60), V(190, 190, 330), 0x6a7e90, R(sy * 70, 40 * sx, 0), false); Ball(V(x + sx * 420, y + sy * 260, 110), V(420, 380, 110), snow); }
      // barricades: blocks of sawn ice stacked like a wall, capped with snow, where the low walls stood
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const x = sx * 2400, y = sy * 1900, alongX = sx * sy > 0, len = 900;
        Box(V(x, y, 90), alongX ? V(len, 110, 180) : V(110, len, 180), deep, true, true);
        for (let k = 0; k < 6; k++) { const o = (k - 2.5) * (len / 6); for (let r = 0; r < 2; r++) Box(V(x + (alongX ? o + r * 40 : 0), y + (alongX ? 0 : o + r * 40), 45 + r * 90), alongX ? V(len / 6 - 10, 122, 84) : V(122, len / 6 - 10, 84), (k + r) % 2 ? ice : pale, false, false); }
        Box(V(x, y, 188), alongX ? V(len + 20, 136, 16) : V(136, len + 20, 16), snow, false, false); for (let k = 0; k < 7; k++) { const o = rr(-len / 2, len / 2); ConeShape(V(x + (alongX ? o : 62), y + (alongX ? 62 : o), 120), V(26, 26, 110), pale, false, R(180, 0, 0)); } }
      // the frozen: a rank of the vault's guards along each side wall, each in a block of ice, weapons still raised
      for (const sx of [-1, 1]) for (const y of [-2300, -1500, 1500, 2300]) { const x = sx * (hx - 330);
        solid(x, y, 250, 250, 460, 0x7fb4d8); Box(V(x, y, 468), V(280, 280, 18), snow, false, false); Ball(V(x, y, 10), V(520, 520, 90), snow);
        for (const [fx, fy] of [[-sx, 0], [0, 1], [0, -1]]) { const px = x + fx * 127, py = y + fy * 127, ax = fx !== 0; deco(px, py, 200, ax ? 4 : 90, ax ? 90 : 4, 250, navy); Ball(V(px, py, 365), ax ? V(6, 74, 80) : V(74, 6, 80), navy); deco(px + (ax ? 0 : 70), py + (ax ? 70 : 0), 300, ax ? 4 : 16, ax ? 16 : 4, 330, 0x2a3a48); } }
      // a hard frost of icicles over the whole roof, thickest over the dais
      for (let i = 0; i < 70; i++) { const a = rnd() * 6.283, r = Math.pow(rnd(), 0.7) * 3200, Lg = rr(140, 520) * (r < 1200 ? 1.5 : 1); ConeShape(V(Math.cos(a) * r, Math.sin(a) * r * 0.85, H - Lg / 2), V(rr(40, 100), rr(40, 100), Lg), rnd() < 0.3 ? deep : ice, false, R(180, 0, 0)); }
      // drifts against the side walls, and lanterns frozen where they were dropped
      for (const sx of [-1, 1]) for (let y = -hy + 300; y < hy - 200; y += 420) { if (Math.abs(Math.abs(y) - 500) < 300) continue; Ball(V(sx * (hx - 40), y + rr(-80, 80), 10), V(rr(300, 560), rr(420, 640), rr(120, 300)), snow); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + 0.4, x = Math.cos(a) * 2300, y = Math.sin(a) * 2000; hit(x, y, 50, 50, 80, false); deco(x, y, 26, 44, 44, 52, steel); Glow(V(x, y, 28), V(30, 30, 34), 0xffc86a, 0); Pyramid(V(x, y, 66), V(54, 54, 28), steel); L(x, y, 120, [1, 0.75, 0.4], 600, 1.6); }
      break;
    }
    // ------------------------------------------------------------------------------------------------ MIRE CELLAR
    case 3: {
      const oak = 0x5a3e26, oakD = 0x3a2818, hoop = 0x2a2420, moss = 0x3f6a2c, mossL = 0x5a8a34, slime = 0x7aff5a, water = 0x163e2a, cap = 0x8a3a2a, stem = 0xd8cfa8, plank = 0x6a4a2e;
      // a cellar floor of old brick, drowned at the edges: green water, moss creeping in, duckboards laid from door to door
      slabs(340, 0x2a3226, 0x323c2c, 0x1c241a, (x, y) => Math.abs(x) < 190);
      for (let i = 0; i < 20; i++) { const x = rr(-hx + 400, hx - 400), y = rr(-hy + 500, hy - 500); if (Math.abs(x) < 500) continue; const d = rr(360, 900); Cyl(V(x, y, 1.6), d, 3.2, water, false, false); Cyl(V(x + rr(-60, 60), y + rr(-60, 60), 2), d * 0.6, 4, 0x1e5a34, false, false); Glow(V(x + rr(-90, 90), y + rr(-90, 90), 4.4), V(d * 0.14, d * 0.1, 2), slime, 1); for (let k = 0; k < 3; k++) { const a = rnd() * 6.283; Cyl(V(x + Math.cos(a) * d * 0.3, y + Math.sin(a) * d * 0.3, 4.6), rr(50, 90), 2, mossL, false, false); } }
      for (let i = 0; i < 44; i++) { const x = rr(-hx + 200, hx - 200), y = rr(-hy + 300, hy - 300), w = rr(120, 340); Floor(V2(x - w, y - w * 0.7), V2(x + w, y + w * 0.7), 2.4, i % 3 ? moss : 0x345a26); }
      for (let y = -hy + 60; y < hy - 60; y += 96) { const o = rr(-18, 18); Box(V(o, y, 7), V(360 + rr(-20, 20), 84, 14), (y / 96 | 0) % 3 ? plank : 0x5a3c24, false, false); } for (const e of [-1, 1]) Box(V(e * 150, 0, 3), V(30, hy * 2 - 100, 6), oakD, false, false);
      // racks of tuns: where the waist-high walls stood there are now barrels lying on trestles, three to a rack, one tapped and leaking
      const rack = (x, y) => {
        Box(V(x, y, 90), V(1200, 110, 180), oakD, true, true);
        for (const e of [-1, 0, 1]) { const bx = x + e * 400;
          Cyl(V(bx, y, 150), 250, 360, oak, false, false, AX); for (const o of [-140, -50, 50, 140]) Cyl(V(bx + o, y, 150), 258 - Math.abs(o) * 0.12, 16, hoop, false, false, AX);
          for (const f of [-1, 1]) { Cyl(V(bx, y + f * 0, 150), 10, 10, hoop, false, false); deco(bx + f * 186, y, 150, 6, 150, 150, 0x7a5636); deco(bx + f * 190, y, 150, 4, 30, 30, hoop); }
          for (const o of [-150, 150]) { deco(bx + o, y, 20, 40, 300, 40, oakD); BoxRot(V(bx + o, y - 96, 34), V(34, 30, 76), oakD, R(0, 0, 24), false); BoxRot(V(bx + o, y + 96, 34), V(34, 30, 76), oakD, R(0, 0, -24), false); } }
        const lx = x + 400 + 196; Cyl(V(lx + 14, y, 70), 16, 30, 0xb8923a, false, false, AX); Glow(V(lx + 26, y, 34), V(8, 8, 60), slime, 1); Cyl(V(lx + 30, y, 2.5), 230, 5, 0x1e5a34, false, false); Glow(V(lx + 30, y, 5.5), V(120, 120, 2), slime, 1);
      };
      for (let r = 0; r < 5; r++) { const y = -1800 + r * 900; for (const x of (r % 2 ? [-1100, 1100] : [-2200, 2200])) rack(x, y); }
      // down the middle, between the duckboards' ends: three great vats on stone rings, their staves burst and something growing out
      for (const y of [-1800, 0, 1800]) { Oct(V(0, y, 14), V(700, 700, 28), 0x4a5240, false, false); solid(0, y, 90, 1200, 180, oakD);
        for (let k = -4; k <= 4; k++) Box(V(0, y + k * 130, 96), V(104, 118, 172), k % 2 ? oak : 0x6a4a2e, false, false); Box(V(0, y, 60), V(112, 1210, 14), hoop, false, false); Box(V(0, y, 140), V(112, 1210, 14), hoop, false, false);
        for (let k = 0; k < 7; k++) { const py = y + rr(-520, 520), h = rr(40, 150), w = h * rr(1.0, 1.7); Cyl(V(rr(-20, 20), py, 180 + h / 2), w * 0.2, h, stem, false, false); ConeShape(V(0, py, 180 + h + w * 0.2), V(w, w, w * 0.5), k % 2 ? cap : 0x6a7a2a); Glow(V(0, py, 180 + h - 2), V(w * 0.5, w * 0.5, 5), slime, 1); }
        L(0, y, 420, T.lamp, 1100, 2); }
      // two giants at the side walls: mushrooms as thick as columns, gills glowing, caps up under the roof
      for (const s of [-1, 1]) { const x = s * 3000; Cyl(V(x, 0, 340), 240, 680, stem, true, true); Cyl(V(x, 0, 20), 340, 40, 0xc0b690, false, false); Cyl(V(x, 0, 560), 300, 20, 0xe8dfc0, false, false);
        ConeShape(V(x, 0, 760), V(1100, 1100, 300), cap); Glow(V(x, 0, 618), V(880, 880, 10), slime, 1); Cyl(V(x, 0, 606), 1040, 14, 0x5a2218, false, false); for (let k = 0; k < 9; k++) { const a = k * 0.7; Ball(V(x + Math.cos(a) * rr(150, 420), Math.sin(a) * rr(150, 420), 830 - rr(0, 60)), V(110, 110, 50), 0xe8dfc0); }
        L(x - s * 300, 0, 380, T.lamp, 1400, 2.4);
        for (let k = 0; k < 8; k++) { const a = rnd() * 6.283, r = rr(300, 620), h = rr(60, 220), w = h * rr(0.9, 1.5); Cyl(V(x + Math.cos(a) * r * 0.5 - s * 60, Math.sin(a) * r, h / 2), w * 0.2, h, stem, false, false); ConeShape(V(x + Math.cos(a) * r * 0.5 - s * 60, Math.sin(a) * r, h + w * 0.2), V(w, w, w * 0.5), k % 2 ? cap : 0x6a7a2a); } }
      // roots through the roof: thick ones down the side walls, a mat of thin ones overhead, lanterns hung among them
      for (let i = 0; i < 64; i++) { const x = rr(-hx + 300, hx - 300), y = rr(-hy + 300, hy - 300), Lg = rr(120, 560); Cyl(V(x, y, H - Lg / 2), rr(8, 24), Lg, 0x3a2a1c, false, false); if (i % 3 === 0) Glow(V(x, y, H - Lg - 12), V(24, 24, 24), slime, 2); }
      for (const sx of [-1, 1]) for (let y = -hy + 250; y < hy - 200; y += 300) { if (Math.abs(Math.abs(y) - 500) < 280) continue; const w = rr(40, 110); BoxRot(V(sx * (hx - w * 0.4), y + rr(-60, 60), H / 2), V(w, w * 1.2, H), 0x3a2a1c, R(0, rr(0, 30), rr(-4, 4)), false); if (rnd() < 0.6) BoxRot(V(sx * (hx - 60), y + 70, rr(200, 600)), V(40, 300, 40), 0x3a2a1c, R(rr(20, 50), 0, 0), false); }
      for (const y of [-2250, -1350, -450, 450, 1350, 2250]) { Box(V(0, y, H - 200), V(hx * 2 - 800, 8, 8), 0x2a2420, false, false); for (let x = -2400; x <= 2400; x += 800) { deco(x, y, H - 250, 6, 6, 100, 0x2a2420); deco(x, y, H - 320, 50, 50, 60, 0x2a2420); Glow(V(x, y, H - 320), V(34, 34, 44), 0xffc86a, 0); } }
      break;
    }
    // ------------------------------------------------------------------------------------------------ THE GILDED RING
    case 4: {
      const gold = 0xc8a03a, red = 0xa8201c, wine = 0x5a1420, black = 0x16121a, cream = 0xf0e6c8, felt = 0x1f6a3c, bulb = 0xfff0b0;
      // a carpet of diamonds, and in the middle the wheel: twenty-four pockets inlaid in the floor round a gold boss
      for (let x = -hx; x < hx; x += 400) for (let y = -hy; y < hy; y += 400) { if (Math.hypot(x + 200, y + 200) < 1500) continue; Floor(V2(x + 4, y + 4), V2(x + 396, y + 396), 1.4, (Math.round(x / 400) + Math.round(y / 400)) % 2 ? 0x4a1620 : 0x3a1018); BoxRot(V(x + 200, y + 200, 2), V(150, 150, 2), gold, R(0, 45, 0), false); BoxRot(V(x + 200, y + 200, 2.6), V(110, 110, 2), (Math.round(x / 400) + Math.round(y / 400)) % 2 ? 0x3a1018 : 0x4a1620, R(0, 45, 0), false); }
      Cyl(V(0, 0, 1.5), 2960, 3, black, false, false); Glow(V(0, 0, 3), V(2900, 2900, 3), gold, 8);
      for (let i = 0; i < 24; i++) { const a = (i + 0.5) / 24 * 6.283, r = 1090; BoxRot(V(Math.cos(a) * r, Math.sin(a) * r, 3.4), V(600, 262, 3), i === 0 ? 0x1f6a3c : i % 2 ? red : 0x1e1a22, R(0, a * 57.3, 0), false); BoxRot(V(Math.cos(a) * 1300, Math.sin(a) * 1300, 5), V(90, 50, 3), cream, R(0, a * 57.3, 0), false); }
      Glow(V(0, 0, 4), V(1580, 1580, 3), gold, 8); Cyl(V(0, 0, 3), 1500, 6, 0x2a1016, false, false);
      Cyl(V(0, 0, 40), 420, 80, gold, true, true); Cyl(V(0, 0, 100), 260, 60, 0xe8c460, false, false); for (let k = 0; k < 4; k++) { BoxRot(V(0, 0, 150), V(760, 40, 30), gold, R(0, k * 45, 0), false); Ball(V(Math.cos(k * 0.785) * 380, Math.sin(k * 0.785) * 380, 150), V(70, 70, 70), gold); Ball(V(-Math.cos(k * 0.785) * 380, -Math.sin(k * 0.785) * 380, 150), V(70, 70, 70), gold); }
      Ball(V(0, 0, 210), V(150, 150, 150), 0xe8c460); L(0, 0, 500, T.lamp, 2000, 2.8);
      // the two drums are the house's great tables turned on end: striped panels, a cornice of bulbs, a marquee on every face
      for (const s of [-1, 1]) { const x = s * 1550;
        Oct(V(x, 0, H / 2), V(1500, 1500, H), wine, true, true); Oct(V(x, 0, 40), V(1600, 1600, 80), gold, false, false); Oct(V(x, 0, 96), V(1540, 1540, 30), black, false, false); Oct(V(x, 0, H - 150), V(1600, 1600, 60), gold, false, false); Oct(V(x, 0, H - 60), V(1560, 1560, 120), black, false, false);
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, cx = x + Math.cos(a) * 752, cy = Math.sin(a) * 752, yaw = a * 57.3;
          for (let j = -2; j <= 2; j++) BoxRot(V(cx - Math.sin(a) * j * 116, cy + Math.cos(a) * j * 116, 440), V(6, 100, 640), j % 2 ? cream : red, R(0, yaw, 0), false);
          BoxRot(V(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, 800), V(10, 520, 110), black, R(0, yaw, 0), false); BoxRot(V(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12, 800), V(6, 470, 20), gold, R(0, yaw, 0), false);
          for (let j = -3; j <= 3; j++) Glow(V(cx + Math.cos(a) * 16 - Math.sin(a) * j * 78, cy + Math.sin(a) * 16 + Math.cos(a) * j * 78, 840 + ((j + k) % 2 ? 0 : -76)), V(22, 22, 22), bulb, 2);
          // a suit on every other face
          const sc = k % 2 ? red : black, px = cx + Math.cos(a) * 8, py = cy + Math.sin(a) * 8; BoxRot(V(px, py, 450), V(8, 150, 150), cream, R(0, yaw, 45), false); BoxRot(V(px + Math.cos(a) * 4, py + Math.sin(a) * 4, 450), V(8, 96, 96), sc, R(0, yaw, 45), false); }
        for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; Glow(V(x + Math.cos(a) * 810, Math.sin(a) * 810, H - 190), V(30, 30, 30), bulb, 2); }
        L(x, s * 1150, 500, T.lamp, 1200, 2); L(x, -s * 1150, 500, T.lamp, 1200, 2); }
      // gaming tables where the low walls stood: felt, a gold rail, chips in stacks, a hand left face up
      const table = (x, y) => { Box(V(x, y, 90), V(1000, 110, 180), black, true, true); Box(V(x, y, 50), V(900, 60, 100), wine, false, false);
        Box(V(x, y, 170), V(1060, 300, 26), 0x3a2414, false, false); Box(V(x, y, 185), V(1000, 240, 6), felt, false, false); for (const e of [-1, 1]) { Box(V(x, y + e * 140, 190), V(1060, 22, 16), gold, false, false); Box(V(x + e * 520, y, 190), V(22, 300, 16), gold, false, false); }
        for (let k = 0; k < 6; k++) { const cx = x + rr(-430, 430), cy = y + rr(-80, 80), n = 2 + (rnd() * 5 | 0); for (let j = 0; j < n; j++) Cyl(V(cx, cy, 190 + j * 7), 34, 6, [red, cream, 0x2a6a8a, black, gold][(k + j) % 5], false, false); }
        for (let k = 0; k < 4; k++) { BoxRot(V(x - 120 + k * 66, y + 20, 189.5), V(56, 80, 1.5), cream, R(0, -12 + k * 8, 0), false); BoxRot(V(x - 120 + k * 66, y + 20, 190.6), V(18, 18, 1), k % 2 ? red : black, R(0, 45, 0), false); }
        deco(x + 380, y - 60, 215, 14, 14, 50, gold); Glow(V(x + 380, y - 60, 256), V(60, 60, 34), 0x7ad0a0, 3); };
      for (const s of [-1, 1]) { table(s * 1550, s * 2200); table(s * 1550, -s * 2200); }
      // a prize wheel on a post at each end of the eight
      for (const s of [-1, 1]) { const y = s * 1700; Cyl(V(0, y, H / 2), 200, H, black, true, true); Cyl(V(0, y, 40), 320, 80, gold, false, false); Cyl(V(0, y, 110), 240, 60, wine, false, false);
        for (const f of [-1, 1]) { const wy = y + f * 112; Cyl(V(0, wy, 560), 640, 16, gold, false, false, AY); Cyl(V(0, wy + f * 6, 560), 590, 16, cream, false, false, AY);
          for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; BoxRot(V(Math.cos(a) * 190, wy + f * 16, 560 + Math.sin(a) * 190), V(170, 4, 96), [red, black, 0x2a6a8a, gold][k % 4], R(-a * 57.3, 0, 0), false); Glow(V(Math.cos(a) * 304, wy + f * 18, 560 + Math.sin(a) * 304), V(20, 20, 20), bulb, 2); }
          Cyl(V(0, wy + f * 22, 560), 110, 14, gold, false, false, AY); Pyramid(V(0, wy + f * 18, 890), V(60, 16, 90), red, R(180, 0, 0)); } }
      // the big top: a canopy of swags from the middle of the roof out to the walls, and the chandelier under it
      Cyl(V(0, 0, H - 100), 30, 200, gold, false, false); for (const [r, n, z] of [[560, 16, H - 300], [340, 10, H - 220]]) { Cyl(V(0, 0, z), r * 2, 14, gold, false, false); Cyl(V(0, 0, z + 1), r * 2 - 60, 16, T.roof, false, false); for (let i = 0; i < n; i++) { const a = i / n * 6.283; Glow(V(Math.cos(a) * r, Math.sin(a) * r, z + 30), V(34, 34, 46), bulb, 2); deco(Math.cos(a) * r, Math.sin(a) * r, z - 30, 8, 8, 50, 0xcfe8ff); } }
      // roped walks down both side walls, with a line of one-armed bandits behind the rope
      for (const sx of [-1, 1]) { for (let y = -2600; y <= 2600; y += 400) { const gap = y + 200 > -900 && y + 200 < 900 && Math.abs(Math.abs(y + 200) - 500) < 350; hit(sx * (hx - 430), y, 40, 40, 140, false); Cyl(V(sx * (hx - 430), y, 60), 26, 120, gold, false, false); Ball(V(sx * (hx - 430), y, 128), V(44, 44, 44), gold); Cyl(V(sx * (hx - 430), y, 6), 80, 12, gold, false, false); if (y < 2600 && !gap) { Box(V(sx * (hx - 430), y + 200, 98), V(10, 400, 12), red, false, false); hit(sx * (hx - 430), y + 200, 14, 400, 110, true); } }
        for (let y = -2400; y <= 2400; y += 300) { if (Math.abs(Math.abs(y) - 500) < 300) continue; const x = sx * (hx - 90); deco(x, y, 150, 150, 170, 300, (y / 300 | 0) % 2 ? red : 0x2a6a8a); deco(x, y, 310, 160, 180, 26, gold); deco(x - sx * 78, y, 210, 6, 130, 80, cream); for (const k of [-1, 0, 1]) deco(x - sx * 82, y + k * 40, 210, 4, 30, 50, [red, gold, black][(k + 1 + (y / 300 | 0) + 30) % 3]); Glow(V(x - sx * 78, y, 290), V(6, 130, 20), bulb, 0); deco(x - sx * 40, y + 96, 220, 10, 10, 120, 0x8a8f99); Ball(V(x - sx * 40, y + 96, 290), V(34, 34, 34), red); deco(x - sx * 82, y, 110, 6, 110, 26, black); } }
      break;
    }
    // ------------------------------------------------------------------------------------------------ DROWNED HALL
    case 5: {
      const hull = 0x3a2c20, hullD = 0x241a12, brass = 0xb8923a, verd = 0x3a8a7a, weed = 0x2a6a4a, sand = 0x5a6a5a, coral = [0xd86a7a, 0xe8a04a, 0x9a6ad8], sea = 0x163e5a, gold = 0xe8c040;
      // the sea bed: silt and broken marble, standing water in the hollows, ripples of light across all of it
      slabs(450, 0x1c343c, 0x234048, 0x142a32, (x, y) => rnd() < 0.18);
      for (let i = 0; i < 26; i++) { const x = rr(-hx + 400, hx - 400), y = rr(-hy + 500, hy - 500), d = rr(400, 1100); Cyl(V(x, y, 1.6), d, 3.2, sea, false, false); Cyl(V(x + rr(-80, 80), y + rr(-80, 80), 2.2), d * 0.55, 4, 0x1c5274, false, false); }
      for (let i = 0; i < 70; i++) { const x = rr(-hx + 200, hx - 200), y = rr(-hy + 300, hy - 300); Glow(V(x, y, 5), V(rr(160, 420), 9, 2), 0x6ac8ff, 0, R(0, rr(-30, 30) + (i % 2 ? 90 : 0), 0)); }
      for (let i = 0; i < 30; i++) { const x = rr(-hx + 200, hx - 200), y = rr(-hy + 300, hy - 300), w = rr(140, 360); Floor(V2(x - w, y - w * 0.7), V2(x + w, y + w * 0.7), 2.6, sand); }
      // a ship went down here: her hull lies in four pieces, ribs standing, deck planks sprung, cargo spilled between
      const piece = (x, y, sx, sy) => { const w = 800, d = 1500, h = 440;
        solid(x, y, w, d, h, hull); Box(V(x, y, h + 8), V(w + 40, d + 40, 16), hullD, false, false);
        for (let z = 60; z < h; z += 80) for (const e of [-1, 1]) { deco(x + e * (w / 2 + 2), y, z, 4, d, 10, hullD); deco(x, y + e * (d / 2 + 2), z, w, 4, 10, hullD); }
        for (let k = -3; k <= 3; k++) { const ry = y + k * 220; for (const e of [-1, 1]) { BoxRot(V(x + e * (w / 2 + 110), ry, h + 240), V(50, 60, 560), hullD, R(0, 0, e * 22), false); BoxRot(V(x + e * (w / 2 + 40), ry, h + 20), V(50, 60, 120), hullD, R(0, 0, e * 8), false); } if (k % 2 === 0) Box(V(x, ry, h + 40), V(w + 200, 40, 34), hull, false, false); }
        for (let k = 0; k < 9; k++) BoxRot(V(x + rr(-w / 2 + 60, w / 2 - 60), y + rr(-d / 2 + 100, d / 2 - 100), h + 24 + rr(0, 20)), V(rr(200, 420), 60, 12), k % 2 ? 0x5a4630 : 0x4a3a28, R(rr(-8, 8), rr(-30, 30), rr(-6, 6)), false);
        for (const [fx, fy] of [[-sx, 0], [0, -sy]]) { const ax = fx !== 0, px = x + fx * (w / 2 + 3), py = y + fy * (d / 2 + 3); for (const o of [-1, 1]) { const qx = px + (ax ? 0 : o * 220), qy = py + (ax ? o * 400 : 0); Cyl(V(qx, qy, 250), 150, 8, brass, false, false, ax ? AX : AY); Glow(V(qx + fx * 5, qy + fy * 5, 250), V(ax ? 4 : 100, ax ? 100 : 4, 100), 0x3aa8ff, 1, ax ? AX : AY); }
          for (let k = 0; k < 8; k++) Ball(V(px + (ax ? 0 : rr(-w / 2, w / 2)), py + (ax ? rr(-d / 2, d / 2) : 0), rr(20, h)), V(rr(30, 60), rr(30, 60), rr(22, 40)), 0xc8cfc0); }
        for (let k = 0; k < 6; k++) { const h2 = rr(260, 620); BoxRot(V(x + sx * (w / 2 + rr(20, 120)), y + rr(-d / 2, d / 2), h2 / 2), V(rr(18, 34), 8, h2), k % 2 ? weed : 0x3a8a5a, R(rr(-12, 12), rr(0, 180), rr(-12, 12)), false); }
        // cargo spilled toward the middle: crates, an amphora or two, and what they were carrying
        for (let k = 0; k < 4; k++) { const cx = x - sx * (w / 2 + rr(120, 300)), cy = y + rr(-d / 2 + 100, d / 2 - 100), s = rr(110, 170); hit(cx, cy, s, s, s - 10, true); BoxRot(V(cx, cy, s / 2 - 10), V(s, s, s), 0x5a4630, R(rr(-10, 10), rr(0, 90), rr(-10, 10)), false); BoxRot(V(cx, cy, s / 2 - 10), V(s + 6, 16, s + 6), hullD, R(rr(-10, 10), rr(0, 90), 0), false); }
        for (let k = 0; k < 14; k++) Glow(V(x - sx * (w / 2 + rr(60, 420)), y + rr(-d / 2, d / 2), 6), V(24, 24, 5), gold, 1);
        L(x - sx * 600, y, 260, T.lamp, 1100, 2); };
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) piece(sx * 1700, sy * 1350, sx, sy);
      // her mast came down across two of the pieces and up into the roof, the yard and a rag of sail still on it
      solid(0, 1650, 2300, 120, 120, hullD); for (const x of [-900, -300, 300, 900]) Box(V(x, 1650, 60), V(40, 136, 136), 0x4a4e56, false, false); solid(-600, 1650, 70, 900, 70, hullD); Box(V(-600, 1650, 78), V(60, 860, 6), 0x8a8468, false, false);   // her mast lies where it fell, the yard still lashed across it
      // amidships: the anchor, standing on its crown on a slab of fallen marble, chain run up into the dark
      solid(0, 0, 900, 900, 300, 0x5a6e74); Box(V(0, 0, 306), V(960, 960, 14), 0x8fa6a8, false, false); for (let k = 0; k < 4; k++) deco((k < 2 ? -1 : 1) * 452, 0, 150, 4, 600, 14, 0x3a4a50, 0); Glow(V(0, 0, 314), V(620, 620, 4), T.glow, 8);
      Cyl(V(0, 0, 300 + 330), 70, 660, 0x4a4e56, false, false); Box(V(0, 0, 300 + 620), V(420, 60, 60), 0x4a4e56, false, false); Ring(V(0, 0, 300 + 730), V(190, 190, 190), brass, AY);
      Box(V(0, 0, 300 + 50), V(640, 80, 80), 0x4a4e56, false, false); for (const e of [-1, 1]) { Box(V(e * 290, 0, 300 + 150), V(80, 80, 160), 0x4a4e56, false, false); Pyramid(V(e * 290, 0, 300 + 290), V(170, 90, 120), 0x4a4e56); }
      chain(0, 0, 300 + 830, H, 0x4a4e56); for (let k = 0; k < 10; k++) Ball(V(rr(-60, 60), rr(-50, 50), 300 + rr(60, 560)), V(rr(40, 70), rr(40, 70), rr(26, 44)), 0xc8cfc0); L(0, 0, 720, T.lamp, 1800, 2.8);
      // marble from the hall that was here before the sea: drums of fallen column, a headless statue at each end wall
      for (let k = 1; k < 10; k += 2) { const a = k / 10 * 6.283 + 0.2, r = 2500, x = Math.cos(a) * r * 1.1, y = Math.sin(a) * r * (k % 2 ? 1.0 : 3.2); if (Math.abs(x) < 400 && Math.abs(y) > 2400) continue; hit(x, y, 280, 280, 200, true); Cyl(V(x, y, 90), 240, 300, 0x9fb4b4, false, false, R(0, rr(0, 180), 90)); for (let j = -1; j <= 1; j++) Cyl(V(x, y, 90), 250, 14, 0x7f9698, false, false, R(0, 0, 90)); Ball(V(x, y + 80, 40), V(260, 200, 90), verd); }
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const x = sx * 3000, y = sy * 2500; Box(V(x, y, 80), V(300, 300, 160), 0x9fb4b4, true, true); deco(x, y, 330, 150, 110, 340, 0x9fb4b4); deco(x, y, 510, 210, 120, 80, 0x9fb4b4); BoxRot(V(x - sx * 120, y, 420), V(60, 60, 260), 0x9fb4b4, R(0, 0, sx * 40), false); Ball(V(x, y, 170), V(330, 330, 60), verd);
        for (let k = 0; k < 5; k++) { const h = rr(80, 260); Pyramid(V(x + rr(-260, 260), y + rr(-260, 260), h / 2), V(h * 0.7, h * 0.7, h), coral[k % 3], R(rr(-14, 14), rr(0, 90), rr(-14, 14))); } }
      // weed along the walls and chains with hooks from the roof beams
      for (const sx of [-1, 1]) for (let y = -hy + 240; y < hy - 200; y += 260) { if (Math.abs(Math.abs(y) - 500) < 280) continue; for (let c = 0; c < 3; c++) { const h = rr(260, 700); BoxRot(V(sx * (hx - rr(30, 200)), y + rr(-100, 100), h / 2), V(rr(16, 34), 8, h), c % 2 ? weed : 0x3a8a5a, R(rr(-12, 12), rr(0, 180), rr(-12, 12)), false); } }
      for (let i = 0; i < 14; i++) { const x = rr(-hx + 500, hx - 500), y = rr(-hy + 500, hy - 500), Lg = rr(240, 520); chain(x, y, H - Lg, H, 0x3a3e46); deco(x, y, H - Lg - 30, 50, 12, 60, brass); deco(x + 20, y, H - Lg - 64, 12, 12, 40, brass); }
      break;
    }
    // ------------------------------------------------------------------------------------------------ THE HIVE
    case 6: {
      const wax = 0xd8a030, waxL = 0xf0c860, dark = 0x5a3a10, honey = 0xffb020, brood = 0xe8dcb8, chitin = 0x2a1c0c;
      // the floor is comb: six-sided cells laid edge to edge, some capped, some dark and open, honey standing in a few
      { const s = 330, hh = s * 0.87; let row = 0; for (let y = -hy + 100; y < hy - 60; y += hh, row++) for (let x = -hx + 120 + (row % 2 ? s / 2 : 0); x < hx - 100; x += s) { const r = rnd(); Oct(V(x, y, 1.4), V(s - 26, s - 26, 2.8), r < 0.14 ? 0x2a1c0c : r < 0.5 ? 0x6a4a16 : 0x7a5618, false, false, R(0, 22.5, 0)); if (r > 0.9) Glow(V(x, y, 3.4), V(s - 120, s - 120, 2), honey, 7); else if (r < 0.14) Oct(V(x, y, 3), V(s - 110, s - 110, 2), 0x120a04, false, false, R(0, 22.5, 0)); } }
      // the columns are comb too: stacked drums of cells with wax run down them, a ring of lit cells at eye height
      const col = (x, y) => { Oct(V(x, y, H / 2), V(230, 230, H), dark, true, true, R(0, 22.5, 0)); for (let z = 70, k = 0; z < H; z += 150, k++) { Oct(V(x, y, z), V(300 - (k % 2) * 30, 300 - (k % 2) * 30, 110), k % 2 ? wax : 0xb88420, false, false, R(0, 22.5 + k * 11, 0)); }
        for (let k = 0; k < 8; k++) { const a = k * 0.785 + 0.39; Glow(V(x + Math.cos(a) * 146, y + Math.sin(a) * 146, 220), V(46, 46, 60), k % 3 ? honey : waxL, 7, R(0, a * 57.3, 0)); }
        for (let k = 0; k < 3; k++) { const a = rnd() * 6.283, Lg = rr(200, 520); Cyl(V(x + Math.cos(a) * 150, y + Math.sin(a) * 150, H - Lg / 2), 40, Lg, waxL, false, false); Ball(V(x + Math.cos(a) * 150, y + Math.sin(a) * 150, H - Lg), V(60, 60, 80), waxL); } Cyl(V(x, y, 2.4), 520, 5, 0x9a6410, false, false); };
      const spots = []; for (let x = -2400; x <= 2400; x += 1200) for (let y = -2100; y <= 2100; y += 1400) { if (x === 0 && Math.abs(y) > 1500) continue; if (x === 0 && y === 0) continue; const px = x + ((y / 1400) % 2 ? 300 : 0); col(px, y); spots.push([px, y]); }
      // bridges of wax between neighbours, high up
      for (let i = 0; i < spots.length; i++) for (let j = i + 1; j < spots.length; j++) { const [ax, ay] = spots[i], [bx, by] = spots[j], d = Math.hypot(bx - ax, by - ay); if (d > 1450 || (i + j) % 3 === 0) continue; const yaw = Math.atan2(by - ay, bx - ax) * 57.3; BoxRot(V((ax + bx) / 2, (ay + by) / 2, 800), V(d, 70, 50), wax, R(0, yaw, 0), false); for (let k = 1; k < 4; k++) { const t = k / 4, Lg = rr(60, 220); ConeShape(V(ax + (bx - ax) * t, ay + (by - ay) * t, 776 - Lg / 2), V(50, 50, Lg), waxL, false, R(180, 0, 0)); } }
      // the royal cell: a six-sided dais in the middle, a pool of honey on it, fed by a slow fall from the brood sac in the roof
      Oct(V(0, 0, 20), V(1500, 1500, 40), 0x7a5618, true, false, R(0, 22.5, 0)); Oct(V(0, 0, 60), V(1150, 1150, 40), wax, true, false, R(0, 22.5, 0)); Oct(V(0, 0, 84), V(820, 820, 10), dark, false, false, R(0, 22.5, 0)); Glow(V(0, 0, 90), V(700, 700, 6), honey, 7, R(0, 22.5, 0)); Glow(V(0, 0, 94), V(360, 360, 6), waxL, 7, R(0, 22.5, 0));
      Glow(V(0, 0, 90 + (H - 520) / 2), V(40, 40, H - 520), honey, 1); Glow(V(0, 0, 130), V(130, 130, 60), waxL, 2); L(0, 0, 400, T.lamp, 2000, 3);
      Ball(V(0, 0, H - 250), V(900, 900, 620), brood); Ball(V(0, 0, H - 300), V(760, 760, 560), 0xf4ecd0); for (let k = 0; k < 14; k++) { const a = k * 0.9, r = rr(260, 520); Ball(V(Math.cos(a) * r, Math.sin(a) * r, H - rr(120, 420)), V(rr(200, 340), rr(200, 340), rr(240, 400)), k % 3 ? brood : 0xd8c890); if (k % 2) Glow(V(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, H - rr(300, 520)), V(46, 46, 60), honey, 2); }
      for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; BoxRot(V(Math.cos(a) * 520, Math.sin(a) * 520, H - 120), V(700, 46, 46), chitin, R(0, a * 57.3, -28), false); }
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 + 0.52, x = Math.cos(a) * 470, y = Math.sin(a) * 470; hit(x, y, 120, 120, 200, false, 80); Ball(V(x, y, 80 + 70), V(150, 150, 210), brood); Glow(V(x, y, 80 + 60), V(60, 60, 80), honey, 2); }
      // brood chambers against the side walls: clutches of eggs in broken cells, something moving in the lit ones
      for (const sx of [-1, 1]) for (const y of [-2350, -1400, 1400, 2350]) { const x = sx * (hx - 520); hit(x, y, 420, 500, 170, true); for (let k = 0; k < 7; k++) { const s = rr(130, 250), ox = rr(-190, 190), oy = rr(-230, 230); Ball(V(x + ox, y + oy, s * 0.42), V(s, s, s * 1.3), k % 3 ? brood : 0xd8c890); if (k % 3 === 0) { Glow(V(x + ox, y + oy, s * 0.5), V(s * 0.4, s * 0.4, s * 0.6), honey, 2); } } Cyl(V(x, y, 2.6), 760, 5, 0x9a6410, false, false); L(x - sx * 200, y, 240, T.lamp, 900, 1.8); }
      // wax hanging from the whole roof
      for (let i = 0; i < 46; i++) { const x = rr(-hx + 300, hx - 300), y = rr(-hy + 300, hy - 300); if (Math.hypot(x, y) < 800) continue; const Lg = rr(100, 460), w = rr(50, 130); ConeShape(V(x, y, H - Lg / 2), V(w, w, Lg), i % 3 ? wax : waxL, false, R(180, 0, 0)); if (i % 4 === 0) Glow(V(x, y, H - Lg - 14), V(28, 28, 38), honey, 2); }
      break;
    }
    // ------------------------------------------------------------------------------------------------ NULL CHAMBER
    default: {
      const voidc = 0x0c0a14, slab = 0x1a1626, pur = T.glow, white = 0xf0e8ff, lilac = 0x8a7ab8;
      // a floor of black glass ruled like an instrument: rings, spokes, and a script that runs round each ring
      slabs(600, 0x1c1828, 0x211c30, 0x14101e, (x, y) => Math.hypot(x, y) < 2750);
      Cyl(V(0, 0, 1.2), 5500, 2.4, 0x100c1a, false, false); for (const d of [900, 1500, 2100, 2700]) { Glow(V(0, 0, 3), V(d * 2, d * 2, 2), pur, 8); const n = Math.round(d / 26); for (let k = 0; k < n; k++) { if (rnd() < 0.35) continue; const a = k / n * 6.283; Glow(V(Math.cos(a) * (d + 70), Math.sin(a) * (d + 70), 3), V(rr(20, 70), 12, 2), k % 5 ? lilac : white, 0, R(0, a * 57.3 + 90, 0)); } }
      for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; Glow(V(Math.cos(a) * 1800, Math.sin(a) * 1800, 3), V(1800, 8, 2), pur, 0, R(0, a * 57.3, 0)); Glow(V(Math.cos(a) * 2700, Math.sin(a) * 2700, 3.4), V(70, 70, 2), white, 7, R(0, a * 57.3, 0)); }
      // the ring of standing slabs
      for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * Math.PI * 2, x = Math.cos(a) * 1900, y = Math.sin(a) * 1700, yaw = 90 + a * 180 / Math.PI;
        Box(V(x, y, 210), V(1000, 110, 420), slab, true, true, yaw); Box(V(x, y, 12), V(1060, 170, 24), voidc, false, false, yaw);
        const c = Math.cos(yaw * Math.PI / 180), s = Math.sin(yaw * Math.PI / 180);
        for (const f of [-1, 1]) { for (let j = -3; j <= 3; j++) { const h = rr(60, 300); Glow(V(x + c * j * 130 - s * f * 57, y + s * j * 130 + c * f * 57, rr(120, 300)), V(10, 4, h), j % 3 ? pur : white, 0, R(0, yaw, 0)); if (rnd() < 0.6) Glow(V(x + c * (j * 130 + 30) - s * f * 57, y + s * (j * 130 + 30) + c * f * 57, rr(100, 340)), V(46, 4, 10), pur, 0, R(0, yaw, 0)); } }
        L(x * 0.8, y * 0.8, 300, T.lamp, 900, 1.8); }
      // the middle: two steps up to nothing, and over it the stone that is doing this, turning in its rings, a line of light through it from floor to roof
      for (let k = 0; k < 2; k++) Box(V(0, 0, 20 + k * 40), V(1500 - k * 360, 1500 - k * 360, 40), k ? 0x2a2440 : slab, true, false); Glow(V(0, 0, 82), V(1000, 1000, 3), pur, 8); Glow(V(0, 0, 82), V(560, 560, 3), white, 8);
      Cyl(V(0, 0, 80 + 90), 180, 180, voidc, true, true); Cyl(V(0, 0, 80 + 186), 240, 12, lilac, false, false);
      Pyramid(V(0, 0, 640), V(330, 330, 420), voidc); Pyramid(V(0, 0, 250 + 80), V(330, 330, 260), voidc, R(180, 0, 0)); Glow(V(0, 0, 432), V(336, 336, 10), pur, 0, R(0, 0, 0)); Glow(V(0, 0, 432), V(120, 120, 120), white, 2);
      Glow(V(0, 0, H / 2), V(16, 16, H), white, 1); Glow(V(0, 0, H / 2), V(60, 60, H), pur, 1);
      Ring(V(0, 0, 440), V(820, 820, 820), lilac, R(22, 0, 12)); Ring(V(0, 0, 440), V(660, 660, 660), pur, R(-58, 30, 0)); Ring(V(0, 0, 440), V(1000, 1000, 1000), 0x4a3e6a, R(80, 60, 0));
      L(0, 0, 500, T.lamp, 2200, 3);
      // the side walls have opened: a great eye of rings in each, looking in
      for (const sx of [-1, 1]) { const x = sx * (hx - 6); Cyl(V(x, 0, 520), 1500, 6, voidc, false, false, AX); [[1440, pur], [1300, voidc], [1120, lilac], [980, voidc], [760, pur], [640, voidc], [420, white]].forEach(([d, c], n) => (c === voidc ? Cyl(V(x - sx * (4 + n * 5), 0, 520), d, 3, c, false, false, AX) : Glow(V(x - sx * (4 + n * 5), 0, 520), V(d, d, 3), c, 1, AX)));  Glow(V(x - sx * 40, 0, 520), V(4, 70, 240), white, 0);
        for (let k = 0; k < 24; k++) { const a = k / 24 * 6.283; BoxRot(V(x - sx * 5, Math.cos(a) * 880, 520 + Math.sin(a) * 880), V(4, 120, 12), k % 2 ? pur : lilac, R(0, 0, a * 57.3 * 0), false); } }
      // stars in the roof and pieces of the room going up to join them
      for (let i = 0; i < 90; i++) Glow(V(rr(-hx + 100, hx - 100), rr(-hy + 100, hy - 100), H - 8), V(rr(8, 22), rr(8, 22), 6), rnd() < 0.3 ? pur : white, 2);
      break;
    }
  }
}

// The two boss rooms: The Seal (a lid chained down over something) and The Bottom (where the floor gives out).
export function craftBoss(which, K) {
  const { M, T, hx, hy, H, rnd, rr } = K;
  const { Box, BoxRot, Glow, Cyl, Oct, Ball, Pyramid, Ring, Floor, Lamp } = M;
  const L = (x, y, z, c, r = 1300, k = 2.2) => Lamp(V(x, y, z), { r: c[0], g: c[1], b: c[2] }, k, r, false);
  for (let x = -hx; x < hx - 1; x += 500) for (let y = -hy; y < hy - 1; y += 500) { if (Math.hypot(x + 250, y + 250) < 2300) continue; Floor(V2(x + 6, y + 6), V2(x + 494, y + 494), 1.4, rnd() < 0.12 ? 0x10141a : (Math.round(x / 500) + Math.round(y / 500)) % 2 ? T.floor : T.floor2); }
  if (which === 0) {
    const iron = 0x2a2e30, bone = 0xd8cfb8;
    // the seal itself: a lid of dark stone the width of the room's middle, ringed and lettered, bolted at eight points
    Cyl(V(0, 0, 1.6), 4500, 3.2, 0x161c20, false, false);
    for (const d of [3600, 2200]) Glow(V(0, 0, 3.6), V(d, d, 2), T.glow, 8);
    for (let k = 0; k < 48; k++) { if (k % 6 === 0) continue; const a = k / 48 * 6.283; Glow(V(Math.cos(a) * 2000, Math.sin(a) * 2000, 4), V(rr(120, 220), 26, 2), k % 4 ? T.glow : 0xffffff, 0, R(0, a * 57.3 + 90, 0)); if (k % 2) Glow(V(Math.cos(a) * 1880, Math.sin(a) * 1880, 4), V(26, 90, 2), T.glow, 0, R(0, a * 57.3 + 90, 0)); }
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283 + 0.39, x = Math.cos(a) * 2000, y = Math.sin(a) * 2000; Oct(V(x, y, 14), V(300, 300, 28), iron, false, false); Cyl(V(x, y, 40), 120, 30, 0x55585f, false, false); Glow(V(x, y, 58), V(60, 60, 8), T.glow, 1); L(x, y, 200, T.lamp, 800, 1.6);
}
    Glow(V(0, 0, 4.4), V(700, 700, 2), 0xffffff, 8); L(0, 0, 600, T.lamp, 2600, 3);
    // the dead of the upper rooms were stacked against these walls when the seal was set
    for (const sx of [-1, 1]) for (let y = -hy + 400; y < hy - 300; y += 520) { if (Math.abs(Math.abs(y) - 500) < 300) continue; const x = sx * (hx - 60); Box(V(x, y, 500), V(90, 420, 1000), 0x12181a, false, false); for (let r = 0; r < 6; r++) for (let c = -1; c <= 1; c++) { Ball(V(x - sx * 46, y + c * 130, 130 + r * 150), V(84, 78, 90), bone); Glow(V(x - sx * 84, y + c * 130 - 16, 140 + r * 150), V(8, 12, 12), T.glow, 2); Glow(V(x - sx * 84, y + c * 130 + 16, 140 + r * 150), V(8, 12, 12), T.glow, 2); } }
  } else {
    const voidc = 0x0c0a14, pur = T.glow, white = 0xf0e8ff;
    // the bottom: the floor ends in a ring of broken paving round a well of light, and the room above is falling into it very slowly
    Cyl(V(0, 0, 1.6), 4500, 3.2, 0x0a0812, false, false); for (const d of [3300, 1300]) Glow(V(0, 0, 3.6), V(d, d, 2), pur, 8);
    Glow(V(0, 0, 4), V(900, 900, 2), white, 1); Glow(V(0, 0, H / 2), V(120, 120, H), pur, 1); Glow(V(0, 0, H / 2), V(30, 30, H), white, 1); L(0, 0, 700, T.lamp, 2800, 3);
    for (let k = 0; k < 32; k++) { const a = k / 32 * 6.283; Glow(V(Math.cos(a) * 2200, Math.sin(a) * 2200, 4), V(2200, 8, 2), pur, 0, R(0, a * 57.3, 0)); }
    for (const sx of [-1, 1]) { const x = sx * (hx - 6); [[2400, pur], [2200, voidc], [1800, 0x8a7ab8], [1600, voidc], [1100, pur], [900, voidc], [560, white]].forEach(([d, c], n) => (c === voidc ? Cyl(V(x - sx * (4 + n * 5), 0, 1000), d, 3, c, false, false, R(90, 0, 0)) : Glow(V(x - sx * (4 + n * 5), 0, 1000), V(d, d, 3), c, 1, R(90, 0, 0)))); Glow(V(x - sx * 40, 0, 1000), V(4, 110, 420), white, 0); }
  }
}
