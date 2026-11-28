// Cider Orchard, in the Vale: the cider makers' orchard on the valley side below Thimblewick, late in the summer with
// the crop on the trees. The lane comes in at the south gate in the hedge; the keeper's thatched cottage and his
// beehives are by it (west). The track runs up the middle between the plots of trees in their rows: the dovecote stands
// in the west, the cider yard in the east (the twin-screw press under its open shed, the horse mill, the barrel store,
// the cooper's corner, the pomace heap); the old orchard in the north-west, where the wassail tree stands hung with its
// ribbons and lanterns. The Blight came up under the wassail tree, the oldest in the orchard: its roots heave with red
// caps and the rot is spreading down the rows. The way on is the north gate, past the sorting yard where the stations
// come up.
//
// Local frame (dest.js): +Y north, +X east, z up; the ground is flat at z = 0. Playable: x in [-5400, 5400],
// y in [-5800, 5800].
import * as THREE from 'three';
import { V, R } from './mapkit.js';
import { destKit } from './dest_kit.js';
import { blightMass, hedgeLump, gatePost, gateLeaf, farmSign, hiveBench, ladder, basket, raisedBed, farTree, wheelbarrow } from './dest_props.js';
import { thatchCottage, wellFine, rock, grassTuft, toadstoolCluster, hill } from './village_shapes.js';
import { washLine, flowerClump, choppingBlock } from './village_props.js';
import { VA, orchardCart, orchardTree, orchardTrunk, windfalls, appleCrate, AC, barrel, barrelRack, ciderPress, pressShed, SH, horseMill, HM, staveStack, barrelRaising, dovecote, DV, wassailTree, wassailLamps, WASSAIL_TR, pomaceHeap } from './dest_props_vale.js';

export const VO = {
  gateS: [0, -5600], cottage: [-3800, -4300], hives: [-1700, -5250], dove: [-3500, -700],
  shed: [1700, -1400], mill: [3500, -2200], store: [4000, -500], coop: [2000, 400], pomace: [2700, -3100],
  wassail: [-2400, 3800], floor: [0, 4850], gateN: [0, 5600],
};
const TRACK = [[0, -5900], [0, -5000], [140, -4000], [0, -3000], [-140, -2000], [0, -1000], [120, 0], [0, 1000], [-160, 2000], [0, 3000], [0, 4380]];
const TRACK_N = [[0, 5330], [0, 5900]];

export function buildOrchard(M, O) {
  const { hx, hy } = O;
  const K = destKit(M, 17, O, { exactNav: true }), { S, body, round, trunk, lit, patch, path, rnd, rr, lineDist } = K;
  const pick = (L) => L[Math.floor(rnd() * L.length)];
  const SOL = (x, y, w, d, h, yaw = 0, nav = true) => body(x, y, w, d, h, yaw, 0, nav);
  const TOAD = { r: 0.8, g: 1, b: 0.35 }, TOAD_GLOW = 0xc4ff58;

  // ---- the ground: meadow grass, the plots a little darker and longer, worn to earth in the cider yard
  K.Box(V(0, 0, -60), V(hx * 2 + 24000, hy * 2 + 24000, 120), 0x5c8838, true, false);
  for (const [x, y, d, c] of [[-2900, -2700, 3400, 0x56823a], [-2900, 1400, 3400, 0x56823a], [2900, -4200, 3200, 0x5a8638], [2900, 2800, 3600, 0x54803a], [-2900, 4000, 3000, 0x52783a]]) patch(x, y, d, c);
  for (let i = 0; i < 30; i++) { const x = rr(-hx + 400, hx - 400), y = rr(-hy + 400, hy - 400); patch(x, y, rr(500, 1000), pick([0x5e8c3c, 0x649040, 0x588436])); }
  { const [x, y] = VO.shed; patch(x + 800, y + 200, 3600, 0x8a7656); patch(x + 900, y + 300, 2800, 0x947e5c); patch(VO.pomace[0], VO.pomace[1], 900, 0x6e5440); }
  patch(VO.cottage[0] + 300, VO.cottage[1], 1600, 0x7a8a48); patch(VO.dove[0], VO.dove[1], 1300, 0x8a8268); patch(VO.wassail[0], VO.wassail[1], 2200, 0x527a36);

  // ---- the track and the paths off it
  path(TRACK, 360, 0x8c7652); path(TRACK_N, 360, 0x8c7652);
  const P_COT = [[0, -4980], [-1500, -4760], [VO.cottage[0] + 520, VO.cottage[1] + 40]];
  const P_YARD = [[120, 0], [700, -500], [VO.shed[0] - 520, VO.shed[1] + 100]];
  const P_DOVE = [[-140, -2000], [-1500, -1250], [VO.dove[0] + 420, VO.dove[1]]];
  const P_WAS = [[-160, 2000], [-1200, 2700], [VO.wassail[0] + 650, VO.wassail[1] - 380]];
  const PATHS = [P_COT, P_YARD, P_DOVE, P_WAS];
  for (const P of PATHS) path(P, 230, 0x8a7a56);

  // ---- the hedge all round (gaps for the gates), every lump of it solid
  const hedge = [];
  { const step = 330; for (const sd of [-1, 1]) { for (let x = -hx + 160; x <= hx - 160; x += step) { if (Math.abs(x) < 420) continue; hedge.push([x, sd * (hy - 150)]); } for (let y = -hy + 480; y <= hy - 480; y += step) hedge.push([sd * (hx - 150), y]); }
    hedge.forEach(([x, y], i) => { const r = pick([180, 200, 220]); S(hedgeLump(r, pick([0x4e7a30, 0x46722c, 0x527e34]), i % 7 === 0 ? 0xe8e0d0 : 0, i % 3 + 1), x, y, 0, rr(0, 360)); trunk(x, y, r * 1.08, r * 1.25); });
    // the strip between the hedge and the edge is the hedge's: shut on the walking grid, so no corner of it is a pocket
    for (const sd of [-1, 1]) { O.GM.NavBlockBox({ min: V(-hx, sd < 0 ? -hy : hy - 160, 0), max: V(hx, sd < 0 ? -hy + 160 : hy, 100) }, 1); O.GM.NavBlockBox({ min: V(sd < 0 ? -hx : hx - 160, -hy, 0), max: V(sd < 0 ? -hx + 160 : hx, hy, 100) }, 1); }
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) O.GM.NavBlockBox({ min: V(sx < 0 ? -hx : hx - 460, sy < 0 ? -hy : hy - 460, 0), max: V(sx < 0 ? -hx + 460 : hx, sy < 0 ? -hy + 460 : hy, 100) }, 1); }

  // ---- the gates: oak posts, the five-bar leaves swung open, the orchard's sign at the lane
  for (const [gy, dir] of [[VO.gateS[1], 1], [VO.gateN[1], -1]]) { const half = 300;
    for (const s of [-1, 1]) { S(gatePost(170), s * half, gy, 0, 0); body(s * half, gy, 30, 30, 176); }
    for (const s of [-1, 1]) { const x = s * (half - 16), w = half - 30; S(gateLeaf(w, 130), x, gy + dir * 14, -3, dir > 0 ? 0 : 180); body(x, gy + dir * (14 + w / 2), 14, w, 140); } }
  { const gy = VO.gateS[1]; S(farmSign(240), 600, gy + 70, 0, 0); body(600, gy + 70, 24, 24, 310); M.Sign(V(600 - 6, gy + 70 + 130, 196), 180, 'CIDER ORCHARD', { r: 0.95, g: 0.9, b: 0.78 }, 32); }

  // ---- the keeper's cottage by the gate: thatched, its door to the east; its well, garden, washing, a bench
  { const [x, y] = VO.cottage; S(thatchCottage(560, 440, 300, 0xd8ccb0, 3), x, y, 0, 0); SOL(x, y, 600, 480, 460);
    S(wellFine(), x + 260, y - 700, 0, 0); SOL(x + 260, y - 700, 236, 236, 120); for (const sy of [-1, 1]) SOL(x + 260, y - 700 + sy * 88, 20, 20, 300, 0, false);
    for (const [dy, c] of [[520, 0xe86a8a], [780, 0xf2d04a]]) { S(raisedBed(380, 130), x - 60, y + dy, 0, 0); SOL(x - 60, y + dy, 380, 130, 44); for (let k = 0; k < 4; k++) S(flowerClump(34, c, 0xffffff, k + 1), x - 200 + k * 90, y + dy + rr(-10, 10), 36, rr(0, 360)); }
    S(washLine(460, 2), x - 300, y - 620, 0, 0); for (const s of [-1, 1]) round(x - 300 + s * 230, y - 620, 14, 220, 0, false);
    S(choppingBlock(), x + 520, y + 380, 0, 0); round(x + 520, y + 380, 40, 60);
    S(basket(30, VA.apple[0]), x + 360, y - 260, 0, 0); SOL(x + 360, y - 260, 64, 64, 50, 0, false); }
  // ---- the hives along the south hedge, facing the sun
  { const [x, y] = VO.hives; for (const dx of [0, 520, 1040]) { S(hiveBench(3), x + dx, y, 0, 90); SOL(x + dx, y, 330, 90, 132); } }

  // ---- the dovecote in the west, in its own square of gravel
  { const [x, y] = VO.dove; S(dovecote(), x, y, 0, 0); round(x, y, DV.r + 14, DV.wall); }

  // ---- the cider yard: the press under its open shed, crates of apples waiting by it, the horse mill, the barrel store,
  // the cooper's corner, the pomace heap behind
  { const [x, y] = VO.shed; S(pressShed(760, 860, false), x, y, 0, 0);
    for (const sx of [-1, 1]) for (const yy of [-430, 0, 430]) { round(x + sx * 380, y + yy, 22, 14); round(x + sx * 380, y + yy, 12, SH.eave); }
    S(ciderPress(), x, y, 0, 0); SOL(x + 45, y, 390, 340, 490);
    for (const [dx, dy, k] of [[-560, -300, 0], [-560, -220, 1], [-560, -300, 2], [-640, 300, 0], [-560, 360, 1]]) { const z = k === 2 ? AC.h : 0; S(appleCrate(dx + dy + k + 999, (k % 2) + 1), x + dx, y + dy, z, 0); }
    SOL(x - 560, y - 260, 80, 140, AC.h * 2); SOL(x - 600, y + 330, 160, 120, AC.h);
    for (const [dx, dy, sd] of [[520, -260, 1], [600, -180, 2], [540, -100, 3]]) { S(barrel(sd), x + dx, y + dy, 0, rr(0, 360)); round(x + dx, y + dy, 38, 96); }
    S(orchardCart(1), x - 300, y + 900, 0, 100); SOL(x - 300, y + 900, 240, 170, 130, 100); }
  { const [x, y] = VO.mill; S(horseMill(), x, y, 0, 200); round(x, y, HM.R + 6, HM.wall);
    { const c = Math.cos((200 * Math.PI) / 180), s = Math.sin((200 * Math.PI) / 180), u = (HM.R + HM.sweep) / 2 + 20; body(x + c * u, y + s * u, HM.sweep - HM.R + 40, 24, 40, 200, 110); body(x + c * HM.sweep, y + s * HM.sweep, 16, 100, 40, 200, 110); } }
  { const [x, y] = VO.store; S(pressShed(560, 1000), x, y, 0, 0);
    for (const sx of [-1, 1]) for (const yy of [-500, 0, 500]) { round(x + sx * 280, y + yy, 22, 14); round(x + sx * 280, y + yy, 12, SH.eave); }
    for (const dx of [-110, 110]) { S(barrelRack(4), x + dx, y, 0, 0); SOL(x + dx, y, 110, 360, 160); } }
  { const [x, y] = VO.coop; for (const [dx, dy] of [[-300, 120], [-120, 160]]) { S(staveStack(10), x + dx, y + dy, 0, 12); SOL(x + dx, y + dy, 112, 112, 76, 12); }
    S(barrelRaising(), x + 220, y - 120, 0, 0); round(x + 220, y - 120, 50, 100); lit(x + 220, y - 120, 40, { r: 1, g: 0.6, b: 0.28 }, 520, 0xff9a3a);
    for (const [dx, dy, sd] of [[380, 220, 1], [470, 160, 2], [420, 300, 3], [-420, -260, 2]]) { S(barrel(sd), x + dx, y + dy, 0, rr(0, 360)); round(x + dx, y + dy, 38, 96); }
    S(choppingBlock(), x - 60, y - 280, 0, 0); round(x - 60, y - 280, 40, 60); }
  { const [x, y] = VO.pomace; S(pomaceHeap(220, 1), x, y, 0, 30); round(x, y, 200, 90); S(wheelbarrow(1), x + 380, y + 120, 0, 160); SOL(x + 380, y + 120, 170, 80, 70, 160); }

  // ---- the wassail tree, oldest in the orchard, its lanterns lit; the Blight heaving out from under its roots, red caps
  // all round, pale threads of it running off down the rows
  const blightAt = [];
  { const [x, y] = VO.wassail; S(wassailTree(980), x, y, 0, 0); trunk(x, y, WASSAIL_TR, 420);
    for (const [lx, ly, lz] of wassailLamps(980)) lit(x + lx, y + ly, lz, { r: 1, g: 0.8, b: 0.45 }, 520, 0xffd27a);
    const mx = x + 380, my = y - 300; S(blightMass(480, 2, 'toad'), mx, my, 0, 20); round(mx, my, 480 * 0.62, 480 * 0.55); blightAt.push([mx, my, 480]); lit(mx + 80, my - 40, 120, TOAD, 900, TOAD_GLOW); }
  for (const [x, y, r, sd] of [[-2600, 1500, 260, 2], [-3900, 3000, 220, 3]]) { S(blightMass(r, sd, 'toad'), x, y, 0, rr(0, 360)); round(x, y, r * 0.62, r * 0.55); blightAt.push([x, y, r]); lit(x, y, 90, TOAD, 600, TOAD_GLOW); }
  { const [hx0, hy0] = blightAt[0], veins = [];
    for (const [ex, ey] of [[-900, 2600], [-1100, 4400], [-3600, 4600], [-3800, 2700], [-2700, 1600], [-1600, 3200]]) { const pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push([hx0 + (ex - hx0) * t + Math.sin(t * 7 + ex) * 110 * t, hy0 + (ey - hy0) * t + Math.cos(t * 5 + ey) * 110 * t]); } veins.push(pts); }
    M.Shape('voveins', () => { const pos = [], col = [], idx = []; for (const pts of veins) { const n = pts.length; for (let j = 0; j < n - 1; j++) { const [x0, y0] = pts[j], [x1, y1] = pts[j + 1], L = Math.hypot(x1 - x0, y1 - y0), m = Math.max(2, Math.round(L / 40)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
      for (let i = 0; i <= m; i++) { const t = i / m, wv = Math.sin((x0 + i * 40) * 0.011 + j) * 40 + Math.sin((y0 + i * 40) * 0.023) * 16, px = x0 + (x1 - x0) * t + nx * wv, py = y0 + (y1 - y0) * t + ny * wv, w = 9 * (1 - ((j + t) / n) * 0.7); for (const e of [-1, 1]) { pos.push(px + nx * w * e, py + ny * w * e, 2.45); col.push(0.88, 0.84, 0.72); } }
      const b = pos.length / 3 - (m + 1) * 2; for (let i = 0; i < m; i++) { const a = b + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } } } return { pos, col, idx }; }, V(0, 0, 0), R(0, 0, 0));
    for (const pts of veins) for (let j = 2; j < pts.length; j += 2) { const [vx, vy] = pts[j]; if (blightAt.some(([bx, by, br]) => Math.hypot(vx - bx, vy - by) < br + 120) || lineDist(vx, vy, TRACK) < 260 || PATHS.some((P) => lineDist(vx, vy, P) < 180)) continue; const ts = pick([0.8, 1, 1.2]), tx = vx + rr(-60, 60), ty = vy + rr(-60, 60); S(toadstoolCluster(ts, 0xc8392e, pick([1, 2, 3])), tx, ty, 0, rr(0, 360)); round(tx, ty, 22 * ts, 40 * ts, 0, false); } }

  // ---- the way on: the sorting yard of setts by the north gate, crates of apples stacked along it, a cart of barrels
  { K.settRoad([[0, 4380], [0, 5330]], 1800, 2.6);
    for (const [x, y, n] of [[-1060, 4500, 2], [-1060, 4600, 1], [-1060, 4900, 2], [1060, 4450, 2], [1060, 4800, 1], [1060, 5150, 2]]) { for (let k = 0; k < n; k++) S(appleCrate(Math.round(x + y) + k, 1 + ((k + Math.round(y / 100)) % 2)), x, y, k * AC.h, 90); SOL(x, y, AC.d + 10, AC.w + 10, AC.h * n); }
    S(orchardCart(2), 1150, 5420, 0, 80); SOL(1150, 5420, 240, 170, 150, 80); }

  // ---- the plots: apple trees in their rows, the crop on them, windfalls under some, ladders against a few, baskets
  const clear = [[0, -5300, 900, 700], [VO.cottage[0] + 100, VO.cottage[1], 1300, 1100], [VO.hives[0] + 520, VO.hives[1], 1000, 450], [VO.dove[0], VO.dove[1], 750, 750],
    [2900, -1200, 2300, 2000], [VO.pomace[0], VO.pomace[1], 700, 600], [VO.wassail[0] + 150, VO.wassail[1] - 100, 1000, 950], [0, 4850, 1400, 900]];
  const freeAt = (x, y, m) => !clear.some(([cx, cy, ax, ay]) => Math.hypot((x - cx) / (ax + m), (y - cy) / (ay + m)) < 1) && lineDist(x, y, TRACK) > 420 + m && PATHS.every((P) => lineDist(x, y, P) > 280 + m) && !blightAt.some(([bx, by, br]) => Math.hypot(x - bx, y - by) < br * 0.62 + 160 + m);
  const trees = [];
  for (const [x0, x1, y0, y1, old] of [[-5000, -700, -3700, -1700, 0], [-5000, -700, 200, 2400, 0], [700, 5000, -5050, -3300, 0], [700, 5000, 1300, 4400, 0], [-5000, -800, 2700, 5200, 1]]) {
    const dx = old ? 640 : 540, dy = old ? 680 : 620;
    for (let y = y0, row = 0; y <= y1; y += dy, row++) for (let x = x0 + (row % 2 ? dx / 2 : 0); x <= x1; x += dx) {
      const tx = x + (old ? rr(-140, 140) : rr(-30, 30)), ty = y + (old ? rr(-140, 140) : rr(-30, 30)), h = old ? pick([640, 700, 760]) : pick([520, 560, 600]);
      if (Math.abs(tx) > hx - 420 || Math.abs(ty) > hy - 420 || !freeAt(tx, ty, 0)) continue;
      trees.push({ x: tx, y: ty, h, half: orchardTrunk(h), circle: true, place: () => { S(orchardTree(h, Math.abs(Math.round(tx + ty)), old ? 2 : 1 + (Math.abs(Math.round(tx / 7 + ty / 3)) % 5 === 0 ? 1 : 0)), tx, ty, 0, rr(0, 360)); trunk(tx, ty, orchardTrunk(h), h * 0.32); body(tx, ty, h * 0.9, h * 0.9, h * 0.5, 0, h * 0.5, false); } }); } }
  const kept = K.plan(trees, [0, -5300]); for (const t of kept) t.place();
  kept.forEach((t, i) => { if (i % 3 === 0) S(windfalls(140, i, i % 9 === 0 ? 2 : 1), t.x + rr(-60, 60), t.y + rr(-60, 60), 0, rr(0, 360)); });
  { let L = 0, B = 0; for (const [i, t] of kept.entries()) { if (i % 11 === 4 && L < 6) { const a = rr(0, Math.PI * 2), lx = t.x + Math.cos(a) * 150, ly = t.y + Math.sin(a) * 150; if (K.clear(lx, ly, 70) && freeAt(lx, ly, -120)) { S(ladder(320, 100), lx, ly, 0, (a * 180) / Math.PI); body(t.x + Math.cos(a) * 100, t.y + Math.sin(a) * 100, 110, 60, 300, (a * 180) / Math.PI, 0, false); L++; } }
    if (i % 13 === 7 && B < 8) { const a = rr(0, Math.PI * 2), bx = t.x + Math.cos(a) * 200, by = t.y + Math.sin(a) * 200; if (K.clear(bx, by, 50) && freeAt(bx, by, -150)) { S(basket(30, i % 2 ? VA.apple[0] : VA.appleG[0]), bx, by, 0, 0); SOL(bx, by, 64, 64, 50, 0, false); B++; } } } }
  // the Blight's caps at the feet of the old trees nearest the heart
  for (const t of kept) { if (Math.hypot(t.x - VO.wassail[0], t.y - VO.wassail[1]) > 1900 || rnd() < 0.4) continue; const a = rr(0, Math.PI * 2), tx = t.x + Math.cos(a) * 90, ty = t.y + Math.sin(a) * 90; S(toadstoolCluster(pick([0.8, 1]), 0xc8392e, pick([2, 3, 4])), tx, ty, 0, rr(0, 360)); round(tx, ty, 20, 36, 0, false); }

  // ---- the meadow: tufts of longer grass, wildflowers here and there, a few stones
  { const nav = O.GM, [cx, cy] = [O.cx, O.cy], ok = (x, y) => { const [ix, iy] = nav.cellOf(cx + x, cy + y); return nav.navFree(ix, iy) && K.clear(x, y, 50); };
    let n = 0; for (let k = 0; k < 2600 && n < 420; k++) { const x = rr(-hx + 200, hx - 200), y = rr(-hy + 200, hy - 200); if (!ok(x, y) || lineDist(x, y, TRACK) < 240 || PATHS.some((P) => lineDist(x, y, P) < 150) || Math.abs(x) < 1000 && y > 4300 && y < 5400) continue; S(grassTuft(pick([34, 42, 50]), pick([1, 2, 3])), x, y, 0, rr(0, 360)); n++; }
    let f = 0; for (let k = 0; k < 800 && f < 14; k++) { const x = rr(-hx + 300, hx - 300), y = rr(-hy + 300, hy - 300); if (!ok(x, y) || lineDist(x, y, TRACK) < 260 || Math.abs(x) < 1000 && y > 4300) continue; S(flowerClump(pick([28, 36]), pick([0xf2d04a, 0xe8e0f8, 0x9a7ae8, 0xe86a6a]), 0xffffff, pick([1, 2])), x, y, 0, rr(0, 360)); f++; } }

  // ---- beyond the hedge (out of reach): the lane between hedgerows, other orchards and fields, the valley's hills
  for (let i = 0; i < 120; i++) { const side = i % 4, u = rr(-1, 1), d = rr(400, 3600), x = side < 2 ? (side ? 1 : -1) * (hx + d) : u * (hx + 3000), y = side < 2 ? u * (hy + 3000) : (side === 2 ? 1 : -1) * (hy + d); if (Math.abs(x) < 500 && Math.abs(y) > hy) continue;
    S(farTree(pick([700, 900, 1100]), 0, pick([0x4e7e32, 0x5a8a3a, 0x46722e]), pick([1, 2])), x, y, 0, rr(0, 360)); }
  path([[0, -5900], [0, -9000], [-300, -12000]], 360, 0x8c7652); path([[0, 5900], [100, 8600], [-200, 11000]], 360, 0x8c7652);
  for (const [x, y, rx, ry, h] of [[-13000, 0, 5000, 9000, 2200], [13500, 1500, 5500, 9000, 2400], [0, 14500, 9000, 4000, 2600], [-9000, -14000, 6000, 4000, 1800], [9000, -13500, 6000, 4000, 2000]]) S(hill(rx, ry, h), x, y, -40, 0);

  // where the Toadstool's pools come up: in the rows near the old orchard, in the yard, by the cottage
  const settle = ([x, y]) => { for (let r = 0; r <= 1600; r += 100) { const n = Math.max(1, Math.round(r / 50)); for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (Math.abs(px) < hx - 500 && Math.abs(py) < hy - 500 && K.clear(px, py, 430) && Math.hypot(px - VO.floor[0], py - VO.floor[1]) > 1300) return [Math.round(px), Math.round(py)]; } } return [x, y]; };
  const beds = [[-1600, 2600], [-3200, 1800], [2600, 800], [1400, -3000], [-2200, -2300], [2800, 3000]].map(settle);
  return {
    spots: { spawn: [0, -5150], yaw: Math.PI, exit: [0, 5470], textYaw: -90, ammo: [650, -5150], ammoYaw: 90,
      bench: [-600, 5050], benchYaw: 0, box: [600, 4850], chest: [600, 4850], chestYaw: 180, press: [-600, 4600], pressYaw: 0 },
    keep: [[VO.floor[0], VO.floor[1], 950]],
    beds, bossAt: null,
  };
}

// ---- the air in the orchard: bees about the hives, wasps over the pomace heap and round the press
export function orchardAir(g, dt, A) {
  const c = g.camera.position, [cx, cy] = A.c; if (Math.abs(c.x - cx) > A.hx + 600 || Math.abs(c.z - cy) > A.hy + 600) return;
  const st = (orchardAir.st ||= { b: 0 });
  st.b += dt * 16; while (st.b > 1) { st.b -= 1; const spots = [[VO.hives[0] + 520, VO.hives[1] + 200, 700], [VO.pomace[0], VO.pomace[1], 350], [VO.shed[0] - 500, VO.shed[1], 300]], [sx, sy, r] = spots[Math.floor(Math.random() * spots.length)], x = cx + sx, z = cy + sy;
    if (Math.hypot(c.x - x, c.z - z) > 3000) continue; const a = Math.random() * 6.28, d = Math.random() * r;
    g.fx.add({ pos: new THREE.Vector3(x + Math.cos(a) * d, 40 + Math.random() * 160, z + Math.sin(a) * d), vel: new THREE.Vector3((Math.random() - 0.5) * 220, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 220), drag: 0.6, life: 2.4, size0: 4, size1: 4, c0: [0.3, 0.24, 0.08, 1], fadeIn: 0.3, fadeOut: 0.5, tex: 'FX_Disc', kind: 'fx', glow: 0 }); }
}
