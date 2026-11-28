// Bogwater Fen, in the Wildwood: the wet country past the old woods, all reed and black water and mist, where the eel
// men and the peat cutters work. The old causeway comes in from the south past the fen's board and runs north across
// two dykes on plank bridges: the eel-catcher's hut stands on its stilts by the West Mere (west), the windpump on the
// south dyke (east) with the peat cuttings beyond it, the duck decoy's pond and its netted pipe in the north-west, and
// the Big Mere in the north-east with the drowned chapel on its island. The Blight (Mirecap) came up through the
// chapel's flooded floor; its wisps drift over the water. The way on is the staithe at the causeway's north end.
//
// Local frame (dest.js): +Y north, +X east, z up; the ground is flat at z = 0. Playable: x in [-5600, 5600],
// y in [-6000, 6000]. All the water is shallow: anything can wade it anywhere.
import * as THREE from 'three';
import { V, R } from './mapkit.js';
import { destKit } from './dest_kit.js';
import { blightMass, farTree } from './dest_props.js';
import { footbridge, FB, flagFloor, leanTo, logSeat, campfire } from './dest_props_wood.js';
import { rock, grassTuft, hill, toadstoolCluster } from './village_shapes.js';
import { lilies, choppingBlock } from './village_props.js';
import { warnBoard, jetty, JT, deadReeds } from './dest_props_rot.js';
import { FN, alder, alderTrunk, fenReeds, pollardWillow, windpump, WP, stiltHut, SH2, punt, eelTrap, netRack, peatStack, peatBarrow, decoyPipe, decoyHoops, reedScreen, chapelRuin, chapelWalls, CH } from './dest_props_fen.js';

export const FW = {
  hut: [-3300, -1650], westMere: [-3300, -550], pump: [3500, -2180], peat: [3200, -4400], decoy: [-3800, 2700],
  bigMere: [2500, 3300], chapel: [2550, 3350], staithe: [0, 5000], staitheR: 900, arena: [-1100, -350],
};
const CAUSEWAY = [[0, -6100], [0, -5000], [200, -4000], [-100, -3000], [100, -2500], [150, -2000], [0, -1000], [-200, 0], [100, 1000], [0, 1400], [-100, 2000], [-150, 3000], [-50, 4100]];
const CAUSE_N = [[0, 5900], [0, 6100]];
// the dykes: their middles along x, and their width
const DYKE_A = (x) => -2500 + 90 * Math.sin(x * 0.0012 + 0.5) + 40 * Math.sin(x * 0.004);
const DYKE_B = (x) => 1400 + 110 * Math.sin(x * 0.001 + 2) + 40 * Math.sin(x * 0.0037 + 1);
const DW = 300;
const MERES = [{ c: FW.westMere, rx: 1150, ry: 800, k: 1 }, { c: FW.bigMere, rx: 1750, ry: 1200, k: 2 }, { c: FW.decoy, rx: 800, ry: 600, k: 3 }];
const meK = (a, k) => 1 + 0.11 * Math.sin(a * 3 + k) + 0.06 * Math.sin(a * 5 + 2 * k);
const inMere = (x, y, m = 0) => MERES.some(({ c, rx, ry, k }) => { const dx = x - c[0], dy = y - c[1], a = Math.atan2(dy / ry, dx / rx), f = meK(a, k); return Math.hypot(dx / (rx * f + m), dy / (ry * f + m)) < 1; });
const ISLE = { c: FW.chapel, r: 720 };
const inDyke = (x, y, m = 0) => Math.abs(y - DYKE_A(x)) < DW / 2 + m || Math.abs(y - DYKE_B(x)) < DW / 2 + m;
const PEAT_PITS = [[2500, -4000, 700, 260], [3500, -4100, 600, 240], [2700, -4750, 640, 220], [3800, -4800, 520, 240]];
const inPit = (x, y, m = 0) => PEAT_PITS.some(([px, py, w, d]) => Math.abs(x - px) < w / 2 + m && Math.abs(y - py) < d / 2 + m);

export function buildFen(M, O) {
  const { hx, hy } = O;
  const K = destKit(M, 29, O, { exactNav: true }), { S, body, round, trunk, lit, patch, path, rnd, rr, lineDist } = K;
  const pick = (L) => L[Math.floor(rnd() * L.length)];
  const SOL = (x, y, w, d, h, yaw = 0, nav = true) => body(x, y, w, d, h, yaw, 0, nav);
  const offs = (x, y, yaw, lx, ly) => { const c = Math.cos((yaw * Math.PI) / 180), s = Math.sin((yaw * Math.PI) / 180); return [x + lx * c - ly * s, y + lx * s + ly * c]; };
  const MIRE = { r: 0.45, g: 1, b: 0.82 }, MIRE_GLOW = 0x6effd2;
  const col = (h) => { const C = new THREE.Color(); C.setHex(h, THREE.NoColorSpace); return [C.r, C.g, C.b]; };

  // ---- the ground: wet grass and sedge, mud at the water's edges
  K.Box(V(0, 0, -60), V(hx * 2 + 24000, hy * 2 + 24000, 120), 0x4a6236, true, false);
  for (let i = 0; i < 40; i++) { const x = rr(-hx + 300, hx - 300), y = rr(-hy + 300, hy - 300); if (inMere(x, y, 200)) continue; patch(x, y, rr(500, 1100), pick([0x52703a, 0x4e6834, 0x5a7440, 0x56663a])); }
  for (const { c, rx, ry } of MERES) patch(c[0], c[1], Math.max(rx, ry) * 2.5, 0x4a5a34);

  // ---- the water: the meres (the Big Mere round its island), the two dykes right across, the peat pits; dark and
  // still, scummed green in drifts; a muddy bed under each, a hair lower
  const disc = (key, { c, rx, ry, k }, kOut, z, colf, hole = null) => M.Shape(key, () => { const pos = [], cl = [], idx = [], nA = 64, nR = 7;
    const ring = (s) => { const P = []; for (let i = 0; i < nA; i++) { const a = (i / nA) * Math.PI * 2, f = meK(a, k); P.push([Math.cos(a) * rx * f * s, Math.sin(a) * ry * f * s]); } return P; };
    pos.push(0, 0, z); cl.push(...col(colf(0, 0, 0)));
    for (let r = 1; r <= nR; r++) { const P = ring((kOut * r) / nR); for (const [x, y] of P) { pos.push(x, y, z); cl.push(...col(colf(x, y, r))); } }
    for (let i = 0; i < nA; i++) idx.push(0, 1 + i, 1 + ((i + 1) % nA));
    for (let r = 1; r < nR; r++) for (let i = 0; i < nA; i++) { const a = 1 + (r - 1) * nA + i, b = 1 + (r - 1) * nA + ((i + 1) % nA), cc = a + nA, d = b + nA; idx.push(a, cc, b, b, cc, d); }
    void hole; return { pos, col: cl, idx }; }, V(c[0], c[1], 0), R(0, 0, 0));
  const scum = (x, y, r) => { const n = Math.sin(x * 0.006 + y * 0.004) + Math.sin(x * 0.011 - y * 0.009 + 1.3); return r === 7 ? 0x3e4a38 : n > 1.2 ? 0x5a6e44 : n > 0.85 ? 0x44563a : r < 3 ? 0x1e2a26 : 0x263430; };
  for (const m of MERES) { disc('fnbed' + m.k, m, 1.07, 0.9, () => 0x2e2a22); disc('fnmere' + m.k, m, 1, 1.6, scum); }
  // the island in the Big Mere: dry ground standing out of the water, reeds round it
  M.Shape('fnisle', () => { const pos = [], cl = [], idx = [], nA = 48; pos.push(0, 0, 2.1); cl.push(...col(0x56703a));
    for (const s of [0.8, 1]) for (let i = 0; i < nA; i++) { const a = (i / nA) * Math.PI * 2, r = ISLE.r * s * (1 + 0.08 * Math.sin(a * 4 + 1)); pos.push(Math.cos(a) * r, Math.sin(a) * r, 2.1); cl.push(...col(s < 1 ? 0x56703a : 0x4a4a30)); }
    for (let i = 0; i < nA; i++) { idx.push(0, 1 + i, 1 + ((i + 1) % nA)); const a = 1 + i, b = 1 + ((i + 1) % nA), c2 = a + nA, d = b + nA; idx.push(a, c2, b, b, c2, d); }
    return { pos, col: cl, idx }; }, V(ISLE.c[0], ISLE.c[1], 0), R(0, 0, 0));
  const ribbon = (key, fy, w, z, colf) => M.Shape(key, () => { const pos = [], cl = [], idx = [], pts = []; for (let x = -6100; x <= 6100; x += 80) pts.push([x, fy(x)]);
    for (let i = 0; i < pts.length; i++) { const [x, y] = pts[i]; for (let j = 0; j <= 4; j++) { const e = (j / 4 - 0.5) * w * (1 + 0.08 * Math.sin(i * 0.7 + j)); pos.push(x, y + e, z); cl.push(...col(colf(i, j))); } }
    for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < 4; j++) { const a = i * 5 + j, b = a + 1, c2 = a + 5, d = c2 + 1; idx.push(a, c2, b, b, c2, d); }
    return { pos, col: cl, idx }; }, V(0, 0, 0), R(0, 0, 0));
  for (const [k, fy] of [['a', DYKE_A], ['b', DYKE_B]]) { ribbon('fndykebed' + k, fy, DW + 140, 0.9, (i, j) => (j === 0 || j === 4 ? 0x4a4432 : 0x2e2a22)); ribbon('fndyke' + k, fy, DW, 1.6, (i, j) => (j === 2 ? 0x1e2a26 : Math.sin(i * 0.9 + j) > 0.7 ? 0x44563a : 0x263430)); }
  M.Shape('fnpits', () => { const pos = [], cl = [], idx = []; for (const [px, py, w, d] of PEAT_PITS) { for (const [ex, z, c] of [[22, 0.9, 0x3a2a1e], [0, 1.6, 0x1c2220]]) { const b = pos.length / 3, hw = w / 2 + ex, hd = d / 2 + ex; for (const [x, y] of [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]]) { pos.push(px + x, py + y, z); cl.push(...col(c)); } idx.push(b, b + 1, b + 2, b, b + 2, b + 3); } } return { pos, col: cl, idx }; }, V(0, 0, 0), R(0, 0, 0));

  // ---- the causeway: gravel, stakes along its edges
  path(CAUSEWAY, 340, 0x7a705a, 0x8a8478); path(CAUSE_N, 340, 0x7a705a, 0x8a8478);
  const P_HUT = [[-200, 0], [-1500, -900], [FW.hut[0] + 650, FW.hut[1] + 60]];
  const P_PUMP = [[150, -2000], [1500, -2000], [FW.pump[0] - 420, FW.pump[1] + 200]];
  const P_PEAT = [[200, -4000], [1300, -4300], [FW.peat[0] - 900, FW.peat[1] + 100]];
  const P_DECOY = [[-100, 2000], [-1500, 2250], [FW.decoy[0] + 900, FW.decoy[1] - 250]];
  const P_CHAP = [[-150, 3000], [800, 3150], [FW.chapel[0] - CH.L / 2 - 120, FW.chapel[1]]];
  const PATHS = [P_HUT, P_PUMP, P_PEAT, P_DECOY, P_CHAP];
  for (const P of PATHS) path(P, 220, 0x6e6450, 0x8a8478);
  // stakes along the causeway's edges (not on the bridges)
  { const seg = []; for (let k = 0; k < CAUSEWAY.length - 1; k++) { const [x0, y0] = CAUSEWAY[k], [x1, y1] = CAUSEWAY[k + 1], L = Math.hypot(x1 - x0, y1 - y0); for (let s = 0; s < L; s += 340) seg.push([x0 + ((x1 - x0) * s) / L, y0 + ((y1 - y0) * s) / L, -(y1 - y0) / L, (x1 - x0) / L]); }
    for (const [x, y, nx, ny] of seg) for (const sd of [-1, 1]) { const sx = x + nx * sd * 200, sy = y + ny * sd * 200; if (inDyke(sx, sy, 200) || Math.abs(sy) > hy - 300 || inMere(sx, sy, 60)) continue; S(stake(), sx, sy, 0, rr(0, 360)); round(sx, sy, 8, 64, 0, false); } }
  function stake() { return ['fnstake', () => { const pos = [], cl = [], idx = []; const c = col(FN.timberD), r = 5.5, h = 62; for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; pos.push(Math.cos(a) * r, Math.sin(a) * r, -10, Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, h); cl.push(...c, ...c); } pos.push(0, 0, h + 4); cl.push(...c);
    for (let i = 0; i < 6; i++) { const a = i * 2, b = ((i + 1) % 6) * 2; idx.push(a, b, a + 1, b, b + 1, a + 1, a + 1, b + 1, 12); } return { pos, col: cl, idx }; }]; }

  // ---- the plank bridges where the causeway crosses the dykes: their decks walked on, their rails stop you
  for (const fy of [DYKE_A, DYKE_B]) { const bx = fy === DYKE_A ? 100 : 0, by = fy(bx), L = 640, W = 260, yaw = 90;
    S(footbridge(L, W), bx, by, 0, yaw); body(bx, by, L, W, FB.deck, yaw, 0, false); for (const s of [-1, 1]) { const [rx, ry] = offs(bx, by, yaw, 0, s * (W / 2 - 4)); body(rx, ry, L - 40, 16, FB.deck + 100, yaw, 0, false); } }

  // ---- the way in: the fen's board by the causeway, a heap of stones
  { S(warnBoard(260), 520, -5400, 0, -90); for (const s of [-1, 1]) round(520 + s * 136, -5400, 8, 300); SOL(520, -5400, 272, 10, 120, 0, false);
    M.Sign(V(520, -5406, 196), -90, 'BOGWATER FEN', { r: 0.92, g: 0.88, b: 0.76 }, 28);
    for (const [x, y, r] of [[-620, -5700, 140], [-820, -5460, 100], [700, -5760, 120]]) { S(rock(r, Math.round(Math.abs(x)) % 3 + 1, true), x, y, 0, rr(0, 360)); round(x, y, r * 0.92, r * 0.9); } }

  // ---- the eel-catcher's hut on its stilts at the West Mere's edge, his jetty out into it with the punts moored, his
  // traps and nets, his fire
  { const [x, y] = FW.hut, yaw = 0; S(stiltHut(), x, y, 0, yaw);
    for (const sx of [-1, 1]) for (const yy of [-SH2.d / 2 + 10, 0, SH2.d / 2 - 10]) round(x + sx * (SH2.w / 2 - 10), y + yy, 12, SH2.deck);
    SOL(x + SH2.w / 2 + 108, y, 70, 70, 300, 0, false);
    const jx = x - 260, jy = y + SH2.d / 2 + 20; S(jetty(520, 150), jx, jy, 0, 90); body(jx, jy + 260, 150, 520, JT.deck, 0, 0, false); for (const sy of [-1, 1]) { round(jx + sy * 81, jy + 510, 8, 70, 0, false); round(jx + sy * 81, jy + 260, 7, 34, 0, false); }
    for (const [dx, dy, yw, sd] of [[-180, 380, 92, 1], [190, 320, 84, 2]]) { S(punt(420, sd), jx + dx, jy + dy, 0, yw); SOL(jx + dx, jy + dy, 110, 420, 24, yw, false); }
    for (const [dx, dy, yw] of [[420, -120, 20], [470, -30, 60], [380, 60, 10]]) { S(eelTrap(Math.round(dx)), x + dx + 220, y + dy - 320, 0, yw); round(x + dx + 220, y + dy - 320, 30, 52, 0, false); }
    S(netRack(380), x - 520, y - 560, 0, 0); SOL(x - 520, y - 560, 40, 420, 200);
    { const fx = x + 600, fy = y - 620; S(campfire(), fx, fy, 0, 0); round(fx, fy, 92, 180); lit(fx, fy, 40, { r: 1, g: 0.55, b: 0.25 }, 700, 0xff8a3a); S(logSeat(200), fx + 230, fy + 60, 0, 70); SOL(fx + 230, fy + 60, 40, 210, 50, 70); }
    S(choppingBlock(), x + 360, y - 900, 0, 0); round(x + 360, y - 900, 40, 60); }

  // ---- the windpump on the south dyke, its scoop wheel to the water
  { const [x, y] = FW.pump, yaw = -90; S(windpump(), x, y, 0, yaw); round(x, y, WP.r0 + 30, 300); { const [sx, sy] = offs(x, y, yaw, WP.r0 + 97, 0); SOL(sx, sy, 190, 70, 200, yaw); } }

  // ---- the peat cuttings, south-east: the pits black with water, stacks of cut peats drying, the barrow, the cutters'
  // lean-to and their spades
  { const [x, y] = FW.peat;
    for (const [dx, dy, n, sd] of [[-1300, 600, 6, 1], [-1100, 300, 5, 2], [100, 650, 6, 3], [1200, 400, 4, 1], [-200, -900, 6, 2], [900, -900, 5, 3], [1300, -400, 6, 1]]) { const px = x + dx, py = y + dy; if (inPit(px, py, 120)) continue; S(peatStack(n, sd), px, py, 0, rr(-15, 15)); SOL(px, py, 136, 136, 8 + n * 15, 0); }
    S(peatBarrow(), x - 200, y + 50, 0, 30); SOL(x - 200, y + 50, 240, 90, 80, 30);
    S(leanTo(380), x + 600, y + 900, 0, 200); { const [cx2, cy2] = offs(x + 600, y + 900, 200, -70, 0); SOL(cx2, cy2, 280, 420, 230, 200); } }

  // ---- the duck decoy, north-west: its pond, the netted pipe curving away from its north-east, the reed screens
  { const [x, y] = FW.decoy, px = x + 560, py = y + 420, yaw = 40; S(decoyPipe(1400), px, py, 0, yaw);
    for (const [hx2, hy2, a, r] of decoyHoops(1400)) { const [wx, wy] = offs(px, py, yaw, hx2, hy2); body(wx, wy, 16, r * 2 + 12, r * 0.85, yaw + (a * 180) / Math.PI, 0, true); }
    // the pipe itself is shut on the walking grid (between its hoops there is nowhere to go)
    { const H = decoyHoops(1400).map(([hx2, hy2, a, r]) => [...offs(px, py, yaw, hx2, hy2), r]);
      for (let gx = -4600; gx <= -1800; gx += 100) for (let gy = 2600; gy <= 4600; gy += 100) { const [ix, iy] = O.GM.cellOf(O.cx + gx, O.cy + gy), [wx, wy] = O.GM.cellCenter(ix, iy), lx = wx - O.cx, ly = wy - O.cy;
        for (let i = 0; i < H.length - 1; i++) { const [x0, y0, r0] = H[i], [x1, y1, r1] = H[i + 1], dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy, t = Math.max(0, Math.min(1, ((lx - x0) * dx + (ly - y0) * dy) / L2)), d = Math.hypot(lx - x0 - dx * t, ly - y0 - dy * t);
          if (d < r0 + (r1 - r0) * t + 34) { O.GM.NavBlockBox({ min: V(lx - 40, ly - 40, 0), max: V(lx + 40, ly + 40, 100) }, 1); break; } } } }
    // the pipe's channel of water under its hoops
    M.Shape('fnpipe', () => { const H = decoyHoops(1400), pos = [], cl = [], idx = []; H.forEach(([hx2, hy2, a, r]) => { const nx = -Math.sin(a), ny = Math.cos(a); for (const e of [-1, 1]) { const [wx, wy] = offs(0, 0, yaw, hx2 + nx * r * 0.9 * e, hy2 + ny * r * 0.9 * e); pos.push(wx, wy, 1.6); cl.push(...col(0x263430)); } });
      for (let i = 0; i < H.length - 1; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } return { pos, col: cl, idx }; }, V(px, py, 0), R(0, 0, 0));
    for (const [u, sd] of [[0.3, 1], [0.6, 1], [0.45, -1]]) { const H = decoyHoops(1400), i = Math.round(u * 10), [hx2, hy2, a, r] = H[i], nx = -Math.sin(a), ny = Math.cos(a), [wx, wy] = offs(px, py, yaw, hx2 + nx * (r + 220) * sd, hy2 + ny * (r + 220) * sd), yw = yaw + (a * 180) / Math.PI + 90;
      S(reedScreen(300, 180), wx, wy, 0, yw); body(wx, wy, 14, 300, 186, yw); } }   // screens alongside the pipe, well clear of its hoops

  // ---- the drowned chapel on its island in the Big Mere, and the Blight come up through its floor; its threads out
  // over the water and the island; its wisps
  const blightAt = [];
  { const [x, y] = FW.chapel; S(chapelRuin(), x, y, 0, 0); for (const [cx2, cy2, w, d, h] of chapelWalls()) body(x + cx2, y + cy2, w, d, h);
    S(blightMass(300, 3, 'mire'), x + 250, y, 0, 30); round(x + 250, y, 300 * 0.62, 300 * 0.55); blightAt.push([x + 250, y, 300]); lit(x + 230, y + 40, 120, MIRE, 1000, MIRE_GLOW);
    for (const [dx, dy, r, sd] of [[-200, -560, 220, 1], [520, 480, 200, 4]]) { S(blightMass(r, sd, 'mire'), x + dx, y + dy, 0, rr(0, 360)); round(x + dx, y + dy, r * 0.62, r * 0.55); blightAt.push([x + dx, y + dy, r]); lit(x + dx, y + dy, 80, MIRE, 600, MIRE_GLOW); }
    const veins = []; for (const [ex, ey] of [[1100, 2400], [900, 4200], [3900, 4300], [4000, 2500], [2300, 2100], [1700, 3500]]) { const pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push([x + (ex - x) * t + Math.sin(t * 7 + ex) * 110 * t, y + (ey - y) * t + Math.cos(t * 5 + ey) * 110 * t]); } veins.push(pts); }
    M.Shape('fnveins', () => { const pos = [], cl = [], idx = []; for (const pts of veins) { const n = pts.length; for (let j = 0; j < n - 1; j++) { const [x0, y0] = pts[j], [x1, y1] = pts[j + 1], L = Math.hypot(x1 - x0, y1 - y0), m = Math.max(2, Math.round(L / 40)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
      for (let i = 0; i <= m; i++) { const t = i / m, wv = Math.sin((x0 + i * 40) * 0.011 + j) * 40 + Math.sin((y0 + i * 40) * 0.023) * 16, px2 = x0 + (x1 - x0) * t + nx * wv, py2 = y0 + (y1 - y0) * t + ny * wv, w = 9 * (1 - ((j + t) / n) * 0.7); for (const e of [-1, 1]) { pos.push(px2 + nx * w * e, py2 + ny * w * e, 2.45); cl.push(0.72, 0.9, 0.78); } }
      const b = pos.length / 3 - (m + 1) * 2; for (let i = 0; i < m; i++) { const a = b + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } } } return { pos, col: cl, idx }; }, V(0, 0, 0), R(0, 0, 0));
    for (const pts of veins) for (let j = 2; j < pts.length; j += 2) { const [vx, vy] = pts[j]; if (blightAt.some(([bx, by, br]) => Math.hypot(vx - bx, vy - by) < br + 120)) continue; const ts = pick([0.8, 1, 1.2]), tx = vx + rr(-60, 60), ty = vy + rr(-60, 60); S(toadstoolCluster(ts, 0x3e6c4c, pick([1, 2, 3])), tx, ty, 0, rr(0, 360)); round(tx, ty, 22 * ts, 40 * ts, 0, false); } }

  // ---- the way on: the staithe, an old stone landing where the causeway meets the north channel; mooring posts, a
  // punt drawn up, barrels for the eels
  { const [x, y] = FW.staithe; S(flagFloor(FW.staitheR, 4, 0x3a4630, true, [0x8a8a80, 0x7e7e74, 0x969488, 0x74746a]), x, y, 0.4, 0);
    for (const [dx, dy] of [[1020, -300], [1020, 200], [-1020, 300]]) { S(['fnmoor', () => { const pos = [], cl = [], idx = [], c = col(FN.timberD), r = 13, h = 110; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; pos.push(Math.cos(a) * r, Math.sin(a) * r, -10, Math.cos(a) * r, Math.sin(a) * r, h); cl.push(...c, ...c); } pos.push(0, 0, h + 3); cl.push(...c); for (let i = 0; i < 8; i++) { const a = i * 2, b = ((i + 1) % 8) * 2; idx.push(a, b, a + 1, b, b + 1, a + 1, a + 1, b + 1, 16); } return { pos, col: cl, idx }; }], x + dx, y + dy, 0, 0); round(x + dx, y + dy, 14, 110); }
    S(punt(400, 2), x + 1150, y - 50, 0, 95); SOL(x + 1150, y - 50, 110, 400, 24, 95, false); }

  // ---- the boss's ground: the open fen west of the causeway between the dykes (nothing tall in it)
  const clear = [[0, -5300, 900, 700], [FW.hut[0] + 200, FW.hut[1] - 300, 1100, 1000], [FW.pump[0], FW.pump[1], 700, 600], [FW.peat[0], FW.peat[1], 1700, 1200], [FW.arena[0], FW.arena[1], 1300, 1200],
    [FW.decoy[0] + 600, FW.decoy[1] + 400, 1500, 1100], [FW.staithe[0], FW.staithe[1], 1300, 1100]];
  const freeAt = (x, y, m) => !clear.some(([cx, cy, ax, ay]) => Math.hypot((x - cx) / (ax + m), (y - cy) / (ay + m)) < 1) && lineDist(x, y, CAUSEWAY) > 360 + m && PATHS.every((P) => lineDist(x, y, P) > 250 + m) && !inMere(x, y, 160 + m) && !inDyke(x, y, 120 + m) && !inPit(x, y, 100 + m) && !blightAt.some(([bx, by, br]) => Math.hypot(x - bx, y - by) < br * 0.62 + 200 + m);
  // ---- pollard willows along the dykes' banks, alder carr thick round the edge and in clumps
  const plants = [];
  for (const fy of [DYKE_A, DYKE_B]) for (let x = -hx + 400; x < hx - 300; x += 520) for (const sd of [-1, 1]) { const wx = x + rr(-60, 60), wy = fy(wx) + sd * (DW / 2 + 170 + rr(-30, 40)), h = pick([280, 300, 340]), sdd = Math.abs(Math.round(wx)) % 7;
    if (Math.abs(wx) < 600 || !freeAt(wx, wy, -150) || Math.abs(wy) > hy - 300) continue; plants.push({ x: wx, y: wy, half: 54, circle: true, place: () => { S(pollardWillow(h, sdd), wx, wy, 0, rr(0, 360)); trunk(wx, wy, 54, h); } }); }
  for (let gx = -hx + 260; gx < hx - 200; gx += 620) for (let gy = -hy + 260; gy < hy - 200; gy += 620) {
    const x = gx + rr(-180, 180), y = gy + rr(-180, 180), edge = Math.min(hx - Math.abs(x), hy - Math.abs(y)) < 700, h = pick([900, 1100, 1300]), sd = pick([1, 2, 3]);
    if (!edge && rnd() > 0.05) continue; if (edge && rnd() > 0.7) continue; if (!freeAt(x, y, 80) || Math.abs(x) > hx - 150 || Math.abs(y) > hy - 150) continue;
    plants.push({ x, y, half: alderTrunk(h), circle: true, place: () => { S(alder(h, sd), x, y, 0, rr(0, 360)); trunk(x, y, alderTrunk(h), h * 0.45); } }); }
  for (const p of K.plan(plants, [0, -5300])) p.place();

  // ---- the reed beds: thick round the meres and along the dykes, thinner out on the fen; lilies on the open water;
  // sedge everywhere; a few old stones
  { const nav = O.GM, [cx, cy] = [O.cx, O.cy], ok = (x, y) => { const [ix, iy] = nav.cellOf(cx + x, cy + y); return nav.navFree(ix, iy) && K.clear(x, y, 50); };
    const offRoute = (x, y) => lineDist(x, y, CAUSEWAY) > 240 && PATHS.every((P) => lineDist(x, y, P) > 150) && Math.hypot(x - FW.staithe[0], y - FW.staithe[1]) > FW.staitheR + 80 && Math.hypot(x, y + 5300) > 700;
    let n = 0; for (let k = 0; k < 6000 && n < 520; k++) { const x = rr(-hx + 150, hx - 150), y = rr(-hy + 150, hy - 150), margin = inMere(x, y, 140) && !inMere(x, y, -220) || inDyke(x, y, 90) && !inDyke(x, y, -40) || Math.hypot(x - ISLE.c[0], y - ISLE.c[1]) > ISLE.r * 0.82 && Math.hypot(x - ISLE.c[0], y - ISLE.c[1]) < ISLE.r * 1.02;
      if (!margin && rnd() > 0.12) continue; if (!ok(x, y) || !offRoute(x, y) || Math.hypot(x - FW.chapel[0], y - FW.chapel[1]) < 560) continue;
      if (rnd() < 0.75) S(fenReeds(pick([120, 150, 180]), pick([1, 2, 3, 4])), x, y, 0, rr(0, 360)); else S(deadReeds(pick([110, 140]), pick([1, 2, 3])), x, y, 0, rr(0, 360)); n++; }
    let l = 0; for (let k = 0; k < 1500 && l < 40; k++) { const x = rr(-hx, hx), y = rr(-hy, hy); if (!inMere(x, y, -260) || Math.hypot(x - ISLE.c[0], y - ISLE.c[1]) < ISLE.r + 200 || !ok(x, y)) continue; S(lilies(pick([90, 120]), pick([1, 2, 3])), x, y, 1.7, rr(0, 360)); l++; }
    let t = 0; for (let k = 0; k < 2600 && t < 380; k++) { const x = rr(-hx + 200, hx - 200), y = rr(-hy + 200, hy - 200); if (inMere(x, y, 40) || inDyke(x, y, 40) || inPit(x, y, 40) || !ok(x, y) || !offRoute(x, y)) continue; S(grassTuft(pick([38, 48, 56]), pick([1, 2, 3])), x, y, 0, rr(0, 360)); t++; }
    for (let i = 0; i < 14; i++) { const x = rr(-hx + 500, hx - 500), y = rr(-hy + 500, hy - 500); if (!freeAt(x, y, 100) || !K.clear(x, y, 160)) continue; const r = pick([70, 100, 130]); S(rock(r, i % 3 + 1, true), x, y, 0, rr(0, 360)); round(x, y, r * 0.92, r * 0.9); } }

  // ---- beyond the edge (out of reach): the Wildwood round the fen, darker; low hills
  for (let i = 0; i < 140; i++) { const side = i % 4, u = rr(-1, 1), d = rr(300, 3600), x = side < 2 ? (side ? 1 : -1) * (hx + d) : u * (hx + 3000), y = side < 2 ? u * (hy + 3000) : (side === 2 ? 1 : -1) * (hy + d); if (Math.abs(x) < 400 && Math.abs(y) > hy) continue;
    S(farTree(pick([1200, 1400, 1800]), 0, pick([0x2a4822, 0x30502a, 0x264020]), pick([1, 2])), x, y, 0, rr(0, 360)); }
  path([[0, -6100], [0, -9000], [-200, -12000]], 340, 0x7a705a); path([[0, 6100], [80, 8600], [-160, 11000]], 340, 0x7a705a);
  for (const [x, y, rx, ry, h] of [[-13000, 0, 5000, 9000, 1800], [13500, 1500, 5500, 9000, 2000], [0, 14500, 9000, 4000, 2200], [-9000, -14000, 6000, 4000, 1600], [9000, -13500, 6000, 4000, 1800]]) S(hill(rx, ry, h, 0x3e5a2c), x, y, -40, 0);

  // where the Mirecap's pools come up: on the fen between the dykes, by the hut, by the peat, by the decoy, on the
  // island's shore
  const settle = ([x, y]) => { for (let r = 0; r <= 1600; r += 100) { const n = Math.max(1, Math.round(r / 50)); for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (Math.abs(px) < hx - 500 && Math.abs(py) < hy - 500 && K.clear(px, py, 430) && !inMere(px, py, 300) && !inDyke(px, py, 300) && Math.hypot(px - FW.staithe[0], py - FW.staithe[1]) > FW.staitheR + 400) return [Math.round(px), Math.round(py)]; } } return [x, y]; };
  const beds = [[-1500, -900], [1600, -800], [-2400, -2900], [1800, -3400], [-1900, 3600], [900, 2300]].map(settle);
  return {
    spots: { spawn: [0, -5300], yaw: Math.PI, exit: [0, 5650], textYaw: -90, ammo: [650, -5300], ammoYaw: 90,
      bench: [-660, 5230], benchYaw: 0, box: [660, 5000], chest: [660, 5000], chestYaw: 180, press: [-660, 4730], pressYaw: 0 },
    keep: [[FW.staithe[0], FW.staithe[1], 900]],
    beds, bossAt: FW.arena,
  };
}

// ---- the air over the fen: will-o'-the-wisps drifting low over the water, the Mirecap's glow
export function fenAir(g, dt, A) {
  const c = g.camera.position, [cx, cy] = A.c; if (Math.abs(c.x - cx) > A.hx + 600 || Math.abs(c.z - cy) > A.hy + 600) return;
  const st = (fenAir.st ||= { w: 0 });
  st.w += dt * 3; while (st.w > 1) { st.w -= 1; const M0 = MERES[Math.floor(Math.random() * MERES.length)], a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * 0.8, x = cx + M0.c[0] + Math.cos(a) * M0.rx * r, z = cy + M0.c[1] + Math.sin(a) * M0.ry * r;
    if (Math.hypot(c.x - x, c.z - z) > 4000) continue;
    g.fx.add({ pos: new THREE.Vector3(x, 40 + Math.random() * 120, z), vel: new THREE.Vector3((Math.random() - 0.5) * 50, (Math.random() - 0.3) * 18, (Math.random() - 0.5) * 50), drag: 0.1, life: 6, size0: 14, size1: 10, c0: [0.5, 1, 0.85, 1], c1: [0.4, 1, 0.8, 0], fadeIn: 1.2, fadeOut: 2, tex: 'FX_Disc', kind: 'fx', glow: 1 }); }
}
