// Glimmer Caves, Under the Hill: the caves the gnomes come to see by lantern light, where crystals grow out of the rock
// and glow-worms light the roof like stars. You come down the rope ladder under the Sunhole, the one place the day
// gets in, by the guide's hut; the show path runs north between two walls of rock into the Glimmer Hall, the great
// dome where the biggest crystals stand. West of it the Crystal Gallery, a long hall thick with crystal and stalagmite;
// east the Mirror Lake, black and still under the cascade, a boardwalk across its shallows. North past the hall the
// gem-gatherers camp in the north-east chamber; the north-west chamber is where the Blight (Nightshade) came up
// through the rock, and the crystals round it have gone dark. The way on is the Deep Way, a tunnel north.
//
// Local frame (dest.js): +Y north, +X east, z up; the floor flat at z = 0. Under a roof: ceilZ(x, y) is its height.
import * as THREE from 'three';
import { V, R } from './mapkit.js';
import { destKit } from './dest_kit.js';
import { blightMass } from './dest_props.js';
import { logSeat, campfire, tent, flagFloor, fern } from './dest_props_wood.js';
import { rock, lanternPost, grassTuft } from './village_shapes.js';
import { crate, sack, rowboat } from './village_props.js';
import { barrel } from './dest_props_works.js';
import { adit, minersHut, lampLine, lampLinePts, toolRack } from './dest_props_mine.js';
import { GC, CRB, crystal, hangCrystal, stalagmite, stalactite, caveColumn, cascade, gemTable, crystalCrate, boardwalk } from './dest_props_cave.js';
import { townBoard } from './dest_props_town.js';
import { shapeB as shape, facet } from './propkit.js';

export const GL = { sun: [-300, -4800], spawn: [-300, -4450], hall: [0, -200], lake: [4150, -500], gallery: [-4150, -400], shade: [-3100, 4550], camp: [3000, 4450], exit: [300, 5280], floor: [300, 4700], floorR: 800 };
// the rock left standing between the chambers: [x, y, rx, ry, turn (degrees), seed]
const MASSES = [[-2500, -3450, 1500, 420, 0, 1], [2700, -3350, 1400, 400, 6, 2], [-3000, -300, 380, 1500, 0, 3], [3000, -200, 400, 1400, -4, 4], [-2500, 2900, 1500, 420, 3, 5], [2800, 3000, 1400, 400, -5, 6]];
const massR = (Mm, th) => { const [, , rx, ry, , sd] = Mm, c = Math.cos(th), s = Math.sin(th); return (1 / Math.sqrt((c / rx) ** 2 + (s / ry) ** 2)) * (1 + 0.1 * Math.sin(th * 3 + sd) + 0.06 * Math.sin(th * 5 + sd * 2.3) + 0.03 * Math.sin(th * 11 + sd)); };
const massPt = (Mm, th, k = 1) => { const [x, y, , , rot] = Mm, r = massR(Mm, th) * k, a = (rot * Math.PI) / 180, lx = Math.cos(th) * r, ly = Math.sin(th) * r; return [x + lx * Math.cos(a) - ly * Math.sin(a), y + lx * Math.sin(a) + ly * Math.cos(a)]; };
const inMass = (Mm, x, y, k = 1) => { const [cx, cy, , , rot] = Mm, a = (-rot * Math.PI) / 180, dx = x - cx, dy = y - cy, lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a); return Math.hypot(lx, ly) < massR(Mm, Math.atan2(ly, lx)) * k; };

export function buildCaves(M, O) {
  const { hx, hy } = O;
  const K = destKit(M, 53, O, { exactNav: true }), { S, body, round, trunk, patch, rnd, rr, Box, lineDist } = K;
  const pick = (L) => L[Math.floor(rnd() * L.length)];
  const lit = (x, y, z, c = { r: 1, g: 0.8, b: 0.5 }, r = 700, g = 0xffd27a) => K.lit(x, y, z, c, r, g);
  const VIO = { r: 0.75, g: 0.55, b: 1 }, CYA = { r: 0.45, g: 0.85, b: 1 };

  // ---- the roof: rock overhead the whole way, a dome over the hall, lower toward the walls; open to the sky at the
  // Sunhole. Stalactites hang from it; glow-worms light it.
  const ceilZ = (x, y) => {
    const ex = Math.max(Math.abs(x) / hx, Math.abs(y) / hy), e = Math.min(1, Math.max(0, (ex - 0.55) / 0.45)), dome = Math.exp(-((x / 2700) ** 2 + ((y + 200) / 2700) ** 2));
    let z = 1950 + 950 * dome - 420 * e * e + 110 * Math.sin(x * 0.0021 + y * 0.0013) + 80 * Math.sin(x * 0.0047 - y * 0.0039 + 1.3) + 50 * Math.sin(x * 0.011 + y * 0.009 + 0.4);
    const ds = Math.hypot(x - GL.sun[0], y - GL.sun[1]); if (ds < 560) z += (4400 - z) * Math.pow(1 - ds / 560, 1.4);
    return z;
  };
  // the Sunhole's throat: rock rising from the roof to a ragged rim open to the sky
  M.Shape('gsun|' + hx, () => { const pos = [], cl = [], idx = [], C = new THREE.Color(), NA = 32, NR = 9, [sx, sy] = GL.sun;
    for (let j = 0; j <= NR; j++) for (let i = 0; i <= NA; i++) { const a = ((i % NA) / NA) * Math.PI * 2, t = j / NR, rr2 = (960 - 640 * t) * (1 + (j === NR ? 0.12 * Math.sin(a * 5 + 1) + 0.07 * Math.sin(a * 11) : 0.05 * Math.sin(a * 4 + j))), x = sx + Math.cos(a) * rr2, y = sy + Math.sin(a) * rr2, n = Math.sin(a * 7 + j * 1.3) + Math.sin(a * 3 - j);
      pos.push(x, y, ceilZ(x, y) - 14); C.setHex(j === NR ? 0x8a8c80 : n > 1.1 ? GC.rockL : n < -1.1 ? GC.rockD : GC.rock[(i + j) % 4], THREE.NoColorSpace); cl.push(C.r, C.g, C.b); }
    for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    return facet({ pos, col: cl, idx }); }, V(0, 0, 0), R(0, 0, 0));

  // ---- the floor: rock, damp, gravel in the hollows; wet near the lake
  Box(V(0, 0, -60), V(hx * 2 + 4000, hy * 2 + 4000, 120), GC.floor, true, false);
  for (let i = 0; i < 44; i++) patch(rr(-hx + 300, hx - 300), rr(-hy + 300, hy - 300), rr(300, 900), pick([0x34323e, 0x403d4a, 0x2e2c38, 0x45424f]));

  // ---- the walls: the hill's rock all round, in bays and buttresses, floor to roof
  { const n = 5, A = hx - 140, B = hy - 140, N = 240, P = [];
    for (let i = 0; i < N; i++) { const t = (i / N) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t); P.push([A * Math.sign(c) * Math.abs(c) ** (2 / n), B * Math.sign(s) * Math.abs(s) ** (2 / n)]); }
    const NRM = P.map((p, i) => { const a = P[(i + N - 1) % N], b = P[(i + 1) % N], tx = b[0] - a[0], ty = b[1] - a[1], L = Math.hypot(tx, ty); return [ty / L, -tx / L]; });
    const din = (i, v) => Math.max(0, 120 + 130 * Math.sin(i * 0.127 + 0.5) + 70 * Math.sin(i * 0.353 + 2) + 30 * Math.sin(i * 1.4 + v * 4.1) + 20 * Math.sin(i * 3.1 - v * 6.3) + 12 * Math.sin(i * 5.3 + v * 11) + ((i * 7 + Math.round(v * 14) * 3) % 5 - 2) * 6);
    const nv = 14; M.Shape('gwall2|' + hx + '|' + hy, () => { const pos = [], cl = [], idx = [], C = new THREE.Color();
      for (let i = 0; i <= N; i++) { const k = i % N, [bx, by] = P[k], [nx2, ny2] = NRM[k], top = ceilZ(bx, by) + 160;
        for (let j = 0; j <= nv; j++) { const v = j / nv, d = din(k, v), z = -40 + v * (top + 40), x = bx - nx2 * d, y = by - ny2 * d, nn = Math.sin(k * 0.71 + j * 1.9) + Math.sin(k * 0.23 - j * 0.7);
          pos.push(x, y, z); C.setHex(j === 0 ? GC.rockD : nn > 1.1 ? GC.rockL : nn < -1.1 ? GC.rockD : GC.rock[(k + j) % 4], THREE.NoColorSpace); cl.push(C.r, C.g, C.b); } }
      for (let i = 0; i < N; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + 1, c = a + nv + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      return facet({ pos, col: cl, idx }); }, V(0, 0, 0), R(0, 0, 0));
    for (let gx = -hx + 50; gx < hx; gx += 100) for (let gy = -hy + 50; gy < hy; gy += 100) if (Math.abs(gx / (A - 40)) ** n + Math.abs(gy / (B - 40)) ** n > 1) O.GM.NavBlockBox({ min: V(gx - 50, gy - 50, 0), max: V(gx + 50, gy + 50, 100) }, 1);
    for (let i = 0; i < N; i += 2) { const a = P[i], b = P[(i + 2) % N], [nx2, ny2] = NRM[(i + 1) % N]; let dm = 0; for (let k = i; k <= i + 2; k++) for (const v of [0, 1 / nv, 2 / nv]) dm = Math.max(dm, din(k % N, v)); const L = Math.hypot(b[0] - a[0], b[1] - a[1]) + 30, T = 500 + dm, mx = (a[0] + b[0]) / 2 + nx2 * (T / 2 - dm), my = (a[1] + b[1]) / 2 + ny2 * (T / 2 - dm);
      body(mx, my, L, T, 2400, (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI); } }

  // ---- the rock between the chambers: great masses floor to roof, rough, flaring where they meet the roof; each solid,
  // its every face where the rock comes furthest out at walking height
  const NU = 64, NV = 16;
  for (const Mm of MASSES) { const sd = Mm[5]; let top = 0; for (let i = 0; i < NU; i++) { const [px, py] = massPt(Mm, (i / NU) * Math.PI * 2, 1.5); top = Math.max(top, ceilZ(px, py)); } top += 140;
    const zj = (j) => -40 + (j / NV) * (top + 40), prof = (z) => 1 + 0.05 * Math.max(0, 1 - z / 120) + 0.03 * Math.sin(z * 0.004 + sd) + (z > top - 700 ? 0.5 * ((z - top + 700) / 700) ** 2 : 0), kk = (i, j) => prof(Math.max(0, zj(j))) * (1 + 0.035 * Math.sin((i % NU) * 1.1 + j * 2.3 + sd) + 0.025 * Math.sin((i % NU) * 2.9 - j * 3.1 + sd) + 0.015 * Math.sin((i % NU) * 6.7 + j * 5.7));
    M.Shape('gmass2|' + sd + '|' + Math.round(top), () => { const pos = [], cl = [], idx = [], C = new THREE.Color();
      for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) { const [x, y] = massPt(Mm, ((i % NU) / NU) * Math.PI * 2, kk(i, j)), nn = Math.sin(i * 0.9 + j * 1.7 + sd) + Math.sin(i * 0.31 - j * 0.6); pos.push(x, y, zj(j)); C.setHex(j === 0 ? GC.rockD : nn > 1.1 ? GC.rockL : nn < -1.1 ? GC.rockD : GC.rock[(i + j + sd) % 4], THREE.NoColorSpace); cl.push(C.r, C.g, C.b); }
      for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + 1, c = a + NV + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      return facet({ pos, col: cl, idx }); }, V(0, 0, 0), R(0, 0, 0));
    for (let i = 0; i < NU; i++) { const k = Math.max(kk(i, 0), kk(i, 1), kk(i, 2), kk(i + 1, 0), kk(i + 1, 1), kk(i + 1, 2)) + 0.004, a = massPt(Mm, (i / NU) * Math.PI * 2, k), b = massPt(Mm, ((i + 1) / NU) * Math.PI * 2, k), L = Math.hypot(b[0] - a[0], b[1] - a[1]), T = 300, nx2 = (b[1] - a[1]) / L, ny2 = -(b[0] - a[0]) / L;
      const s = (a[0] + b[0]) / 2 - Mm[0], t = (a[1] + b[1]) / 2 - Mm[1], inw = s * nx2 + t * ny2 > 0 ? -1 : 1;   // the side toward the mass's middle
      body((a[0] + b[0]) / 2 + nx2 * inw * (T / 2), (a[1] + b[1]) / 2 + ny2 * inw * (T / 2), L + 24, T, 2400, (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI, 0, false); }
    { const [cx, cy, rx, ry] = Mm, Rr = Math.max(rx, ry) * 1.35; for (let gx = cx - Rr; gx <= cx + Rr; gx += 50) for (let gy = cy - Rr; gy <= cy + Rr; gy += 50) { const [ix, iy] = O.GM.cellOf(O.cx + gx, O.cy + gy), [wx, wy] = O.GM.cellCenter(ix, iy), lx = wx - O.cx, ly = wy - O.cy; if (inMass(Mm, lx, ly, 1.12) || inMass(Mm, lx, ly, 1) ) O.GM.NavBlockBox({ min: V(lx - 10, ly - 10, 0), max: V(lx + 10, ly + 10, 100) }, 1); } } }
  const inRock = (x, y, m = 0) => MASSES.some((Mm) => inMass(Mm, x, y, 1.12 + m / Math.max(Mm[2], Mm[3])));
  const n5 = 5, wallIn = (x, y, m) => Math.abs(x / (hx - 140 - 380 - m)) ** n5 + Math.abs(y / (hy - 140 - 380 - m)) ** n5 < 1;
  const open = (x, y, m = 60) => wallIn(x, y, m) && !inRock(x, y, m) && K.clear(x, y, m);

  // the roof itself (open at the Sunhole), and the glow-worms on it: points of light laid on its own faces, just under
  // them, over the hall and the lake, so each one is on the rock and not hung below it
  M.Shape('gceil5|' + hx + '|' + hy, () => { const pos = [], cl = [], idx = [], C = new THREE.Color(), st = 220, x0 = -hx - 600, y0 = -hy - 600, nx = Math.ceil((2 * hx + 1200) / st), ny = Math.ceil((2 * hy + 1200) / st);
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const x = x0 + i * st + ((j * 7 + i * 13) % 5 - 2) * 22, y = y0 + j * st + ((i * 11 + j * 3) % 5 - 2) * 22, z = ceilZ(x, y) + ((i * 17 + j * 29) % 7 - 3) * 18, n = Math.sin(x * 0.013 + y * 0.007) + Math.sin(x * 0.005 - y * 0.017);
      pos.push(x, y, z); C.setHex(n > 1.2 ? GC.rockL : n < -1.2 ? GC.rockD : GC.rock[(i + j * 3) % 4], THREE.NoColorSpace); cl.push(C.r, C.g, C.b); }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1, mx = (pos[a * 3] + pos[d * 3]) / 2, my = (pos[a * 3 + 1] + pos[d * 3 + 1]) / 2; if (Math.hypot(mx - GL.sun[0], my - GL.sun[1]) < 640) continue; idx.push(a, b, c, b, d, c); }
    const T = idx.length / 3, P = (k) => [pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]]; let sd = 7; const r = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    for (let w = 0, n = 0; w < 9000 && n < 2400; w++) { const t = Math.floor(r() * T), A = P(idx[t * 3]), B = P(idx[t * 3 + 1]), Cc = P(idx[t * 3 + 2]); let u = r(), v = r(); if (u + v > 1) { u = 1 - u; v = 1 - v; } u = 1 / 3 + (u - 1 / 3) * 0.6; v = 1 / 3 + (v - 1 / 3) * 0.6;   // well inside its face
      const x = A[0] + (B[0] - A[0]) * u + (Cc[0] - A[0]) * v, y = A[1] + (B[1] - A[1]) * u + (Cc[1] - A[1]) * v, z = A[2] + (B[2] - A[2]) * u + (Cc[2] - A[2]) * v;
      const inHall = Math.hypot(x - GL.hall[0], y - GL.hall[1]) < 2800, inLake = x > 3300 && Math.abs(y - GL.lake[1]) < 2600; if (!(inHall || inLake) || !wallIn(x, y, 0) || inRock(x, y, 0) || Math.hypot(x - GL.sun[0], y - GL.sun[1]) < 900) continue;
      const e1 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], e2 = [Cc[0] - A[0], Cc[1] - A[1], Cc[2] - A[2]]; let nn = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]; const L = Math.hypot(...nn); nn = nn.map((q) => q / L); if (nn[2] > 0) nn = nn.map((q) => -q);
      const L1 = Math.hypot(...e1), t1 = e1.map((q) => q / L1), t2 = [nn[1] * t1[2] - nn[2] * t1[1], nn[2] * t1[0] - nn[0] * t1[2], nn[0] * t1[1] - nn[1] * t1[0]], sz = 9 + r() * 6, cx0 = x + nn[0] * 1.5, cy0 = y + nn[1] * 1.5, cz0 = z + nn[2] * 1.5, k = pos.length / 3;
      for (const [a1, a2] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) pos.push(cx0 + (t1[0] * a1 + t2[0] * a2) * sz, cy0 + (t1[1] * a1 + t2[1] * a2) * sz, cz0 + (t1[2] * a1 + t2[2] * a2) * sz);
      C.setHex(r() < 0.8 ? 0xb8f6ff : 0xf0fcff, THREE.NoColorSpace); for (let q = 0; q < 4; q++) cl.push(C.r, C.g, C.b); idx.push(k, k + 2, k + 1, k, k + 1, k + 3); n++; }
    return facet({ pos, col: cl, idx }); }, V(0, 0, 0), R(0, 0, 0));
  // stalactites over the open floor
  for (let i = 0, n = 0; i < 400 && n < 90; i++) { const x = rr(-hx + 600, hx - 600), y = rr(-hy + 600, hy - 600); if (!wallIn(x, y, 200) || inRock(x, y, 200) || Math.hypot(x - GL.sun[0], y - GL.sun[1]) < 900) continue; S(stalactite(pick([140, 200, 280, 360]), i % 4), x, y, ceilZ(x, y) - 8, rr(0, 360)); n++; }

  // ---- the Sunhole and the way in: the rope ladder down from the log wedged across the hole, the day's light on the
  // floor under it, ferns where it falls; the guide's hut, the caves' board, a bench, the lanterns of the show path
  { const [x, y] = GL.sun; patch(x, y, 900, 0x5a5a5e); patch(x, y, 560, 0x6e6e70);
    const logZ = Math.round(Math.min(ceilZ(x, y + 400), ceilZ(x, y - 400)) - 30);   // wedged across the hole: both its ends run into the rock
    S(['gsunlog|' + logZ, shape((G) => { G.tube([[0, -470, 0], [0, 470, 0]], 26, GC.timberD, { S: 8 }); for (const s of [-1, 1]) G.tube([[0, s * 100, -2], [0, s * 100, -logZ + 10]], 3, 0x9a8a62, { S: 5, caps: false }); for (let z = -logZ + 40; z < -40; z += 64) G.box(0, 0, z, 4, 104, 3, GC.timber); })], x, y, logZ, 0);
    body(x, y, 30, 230, 400, 0, 0, false);
    M.Lamp(V(x, y, 2500), { r: 0.85, g: 0.92, b: 1 }, 2.2, 1900, false); M.Lamp(V(x, y, 400), { r: 0.8, g: 0.88, b: 1 }, 2.2, 1000, false);
    for (let i = 0; i < 14; i++) { const a = rr(0, Math.PI * 2), d = rr(160, 420), fx = x + Math.cos(a) * d, fy = y + Math.sin(a) * d; if (!K.clear(fx, fy, 40) || Math.abs(fx - x) < 140 && Math.abs(fy - y - 120) < 160) continue; if (i % 3) S(fern(pick([0.8, 1, 1.2]), i), fx, fy, 0, rr(0, 360)); else S(grassTuft(pick([34, 42]), i % 3 + 1), fx, fy, 0, rr(0, 360)); } }
  S(minersHut(320, 420, 2), -1650, -4850, 0, 0); body(-1650, -4850, 340, 440, 300); lit(-1650 + 180, -4850 - 140, 230);
  { S(townBoard(300), 900, -4300, 0, -90); for (const s of [-1, 1]) round(900 + s * 156, -4300, 8, 262); body(900, -4300, 320, 10, 90, 0, 150, false); M.Sign(V(900, -4305, 196), -90, 'GLIMMER CAVES', { r: 0.16, g: 0.16, b: 0.2 }, 26); }
  S(logSeat(220), 900, -5000, 0, 0); body(900, -5000, 60, 230, 52);
  for (const [x, y] of [[-560, -5120], [-500, -5180], [-580, -5240]]) S(sack(28, 0x8a7a5a), x, y, -3, rr(0, 360)); body(-550, -5180, 140, 200, 56);
  const SHOW = [[200, -4300], [150, -3400], [-100, -2400], [-200, -1200]];
  for (const [i, [x, y]] of SHOW.entries()) { const s = i % 2 ? -1 : 1, lx = x + s * 420; S(lanternPost(300, i), lx, y, 0, s > 0 ? 180 : 0); round(lx, y, 12, 300, 0, false); lit(lx - s * 62, y, 242, undefined, 520); }

  // ---- the Glimmer Hall's roof: crystals hung from it, columns where it came down to meet the floor
  for (let i = 0, n = 0; i < 200 && n < 16; i++) { const x = rr(-2400, 2400), y = rr(-2700, 2100), len = pick([200, 280, 360]); if (!wallIn(x, y, 300) || inRock(x, y, 300)) continue; S(hangCrystal(len, i, i % 2), x, y, ceilZ(x, y) - 10, rr(0, 360)); n++; }
  for (const [x, y, r] of [[-1200, -2300, 110], [1300, 300, 90], [-1000, 600, 100]]) { const h = ceilZ(x, y); if (!open(x, y, r * 2.4)) continue; S(caveColumn(h, r, Math.round(x)), x, y, 0, rr(0, 360)); round(x, y, r * 2.2, h); }

  // ---- the Mirror Lake, east: black water in its hollow, the cascade off the rock into it, the boardwalk across its
  // shallows, a boat drawn up at its north end
  { const [lx, ly] = GL.lake, rx = 820, ry = 1900; M.Shape('glake', () => { const pos = [], cl = [], idx = [], C = new THREE.Color(), n = 48;
      pos.push(0, 0, 1.4); C.setHex(GC.water, THREE.NoColorSpace); cl.push(C.r, C.g, C.b);
      for (let ring = 1; ring <= 4; ring++) for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, w = 1 + 0.1 * Math.sin(a * 3 + 0.7) + 0.06 * Math.sin(a * 7), k = ring / 4; pos.push(Math.cos(a) * rx * w * k, Math.sin(a) * ry * w * k, 1.4); C.setHex(ring === 4 ? 0x3a5266 : ring === 3 ? GC.waterL : GC.water, THREE.NoColorSpace); cl.push(C.r, C.g, C.b); }
      for (let i = 0; i < n; i++) idx.push(0, 1 + i, 1 + ((i + 1) % n)); for (let ring = 1; ring < 4; ring++) for (let i = 0; i < n; i++) { const a = 1 + (ring - 1) * n + i, b = 1 + (ring - 1) * n + ((i + 1) % n), c = a + n, d = b + n; idx.push(a, c, b, b, c, d); }
      return { pos, col: cl, idx }; }, V(lx, ly, 1.2), R(0, 0, 0));
    { const [fx, fy] = massPt(MASSES[3], 0, 1.08), ch = Math.min(1100, ceilZ(fx, fy) - 300); S(cascade(ch, 300), fx - 6, fy, 0, 0); body(fx + 56, fy, 130, 400, ch, 0, 0, false); }
    S(boardwalk(1400, 220), lx - 220, ly - 400, 0, 90); body(lx - 220, ly - 400, 230, 1400, 16, 0, 0, false);
    S(rowboat(300, 0x5a4030, 3), lx + 100, ly + 2050, 0, 10); body(lx + 100, ly + 2050, 300, 120, 70, 10);
    M.Lamp(V(lx - 500, ly - 400, 300), CYA, 2.2, 1300, false); }

  // ---- the gem-gatherers' camp in the north-east chamber: tents, the fire, the sorting table, crates of crystals packed
  // for the road, their tools, a lamp line
  { const [cx, cy] = GL.camp; S(campfire(), cx, cy, 0, 0); round(cx, cy, 92, 180); lit(cx, cy, 40, { r: 1, g: 0.58, b: 0.26 }, 900, 0xff8a3a);
    for (const [dx, dy, yaw] of [[-640, 330, 20], [560, 380, -30], [-60, 700, 90]]) { const x = cx + dx, y = cy + dy; S(tent(330, 280, 230), x, y, 0, yaw); body(x, y, 340, 290, 240, yaw); }
    for (const [dx, dy, yaw] of [[0, -260, 0], [-250, 40, 90], [250, 60, 90]]) { S(logSeat(200), cx + dx, cy + dy, 0, yaw); body(cx + dx, cy + dy, yaw ? 210 : 60, yaw ? 60 : 210, 52); }
    S(gemTable(260), cx + 700, cy - 350, 0, 180); body(cx + 700, cy - 350, 100, 270, 100, 180);
    for (const [dx, dy, hue] of [[950, -100, 0], [1030, -40, 1], [960, 40, 0], [1040, 110, 1]]) S(crystalCrate(Math.abs(dx + dy), hue), cx + dx, cy + dy, 0, rr(-10, 10)); body(cx + 995, cy + 5, 200, 300, 84);
    S(toolRack(), cx - 900, cy - 300, 0, 0); body(cx - 880, cy - 300, 70, 240, 150);
    for (const [x, y] of [[cx - 1000, cy + 300], [cx - 930, cy + 360]]) S(barrel(Math.abs(Math.round(x + y))), x, y, 0, 0); body(cx - 965, cy + 330, 170, 160, 92);
    S(lampLine(900), cx + 900, cy - 450, 0, 0); for (const [lx, ly, lz] of lampLinePts(900)) lit(cx + 900 + lx, cy - 450 + ly, lz, undefined, 500); body(cx + 900, cy - 450 - 450, 30, 30, 320); body(cx + 900, cy - 450 + 450, 30, 30, 320); }

  // ---- the Blight: Nightshade, up through the rock in the north-west chamber, its growth across the floor (the crystals
  // round it gone dark, below), a mass of it come out into the hall
  const blightAt = [];
  { const [sx, sy] = GL.shade; for (const [x, y, r, sd] of [[sx, sy, 480, 3], [sx + 1100, sy - 500, 240, 4], [sx - 900, sy - 700, 260, 5], [-900, -900, 220, 6]]) { if (!open(x, y, r * 0.7)) continue; S(blightMass(r, sd, 'shade'), x, y, 0, rr(0, 360)); trunk(x, y, r * 0.62, r * 0.55); blightAt.push([x, y, r]); lit(x, y, r * 0.5 + 10, { r: 0.85, g: 0.5, b: 1 }, 900, 0xc078ff); }
    for (const [x, y, r] of blightAt) for (let k = 0; k < 5; k++) { const a = rr(0, Math.PI * 2), d = rr(r * 0.8, r * 2.2); patch(x + Math.cos(a) * d, y + Math.sin(a) * d, rr(200, 460), pick([0x3a2a44, 0x46324e, 0x2e2238])); } }

  // ---- the way on: the Deep Way, a tunnel north out of the caves, shored with timber; the stations come up on the
  // flags before it
  { const [x, y] = GL.exit, h = ceilZ(x, y + 330) + 200; S(adit(1700, 700, h, 7, 300, 480), x, y + 330, 0, -90); body(x, y + 360, 1700, 640, h); for (const s of [-1, 1]) lit(x + s * 380, y + 40, 420, undefined, 700); }
  { const [x, y] = GL.floor; S(flagFloor(GL.floorR, 2, 0x2a2834, false, [0x6e6a7a, 0x625e6e, 0x787484, 0x5e5a68]), x, y, 0.4, 0); }

  // ---- the crystals and the stalagmites: the biggest crystals round the hall's floor (its middle left clear), thick in
  // the Crystal Gallery, dark round the Blight, a few about the camp; stalagmites through the gallery, out of the lake's
  // shallows and over the rest of the floor. Gathered first, then laid out so that none of them shuts off a corner of
  // open floor (the walking grid must reach everywhere).
  const crystals = [], scatter = [], items = [];
  // the ways between the chambers stay clear, wide enough for the broadest boss: nothing scattered within 300 of them
  const LANES = [[GL.spawn, [150, -3400], GL.hall, [200, 2000], GL.floor], [GL.hall, [-2200, -2300], [-3800, -2500], [-4150, -2400], [-4300, -4300]], [GL.hall, [-2000, 1900], [-3700, 2000], [-4150, 1500]], [[-4150, -2600], [-4150, 1800]],
    [GL.hall, [2000, -2200], [3800, -2600], [4300, -2600], [4300, -4300]], [GL.hall, [2000, 1900], [3800, 2100], [4200, 1700]], [[4500, -2400], [4500, 1800]], [GL.floor, [-2000, 4200], [-4200, 4400]], [GL.floor, [2400, 4200], [4400, 4300]],
    [GL.spawn, [-1300, -4600], [-4300, -4600]], [GL.spawn, [2000, -4600], [4300, -4600]]];
  const inLane = (x, y, r) => LANES.some((P) => lineDist(x, y, P) < r + 300);
  const freeAt = (x, y, r) => wallIn(x, y, r) && !inRock(x, y, r + 90) && !inLane(x, y, r) && K.clear(x, y, r + 150) && !scatter.some(([sx, sy, sr]) => Math.hypot(x - sx, y - sy) < r + sr + 150) && !blightAt.some(([bx, by, br]) => Math.hypot(x - bx, y - by) < br * 0.75 + r + 150);   // a gap a brute can pass, or none
  const putCrystal = (x, y, h, hue, glow = true) => { const r = CRB(h); if (!freeAt(x, y, r)) return false; scatter.push([x, y, r]); const yaw = rr(0, 360), sd = scatter.length;
    items.push({ x, y, half: r, circle: true, place: () => { S(crystal(h, sd, hue), x, y, 0, yaw); round(x, y, r, Math.min(h, 400)); if (h > 260) body(x, y, h * 0.5, h * 0.5, h * 0.7, 0, Math.min(h, 400), false); crystals.push([x, y, h, hue]); if (glow && h >= 360) lit(x, y, h * 0.55, hue === 1 ? CYA : hue === 2 ? { r: 0.7, g: 0.4, b: 0.9 } : VIO, 900, hue === 1 ? 0x9aeaff : 0xc8a8ff); } }); return true; };
  const putMite = (x, y, h) => { const r = h * 0.24; if (!freeAt(x, y, r)) return false; scatter.push([x, y, r]); const yaw = rr(0, 360), sd = scatter.length; items.push({ x, y, half: r, circle: true, place: () => { S(stalagmite(h, sd), x, y, 0, yaw); round(x, y, r, h); } }); return true; };
  for (const [x, y, h, hue] of [[-1700, -1500, 900, 0], [1600, -1600, 760, 1], [-1900, 900, 820, 1], [1800, 1100, 980, 0], [-700, 1900, 600, 0], [900, -2500, 560, 0], [-2100, -300, 520, 1], [2200, -200, 640, 0], [0, 1700, 460, 1]]) putCrystal(x, y, h, hue);
  for (let i = 0, n = 0; i < 500 && n < 44; i++) { const a = rr(0, Math.PI * 2), d = rr(1200, 2600), x = Math.cos(a) * d, y = -200 + Math.sin(a) * d; if (putCrystal(x, y, pick([180, 240, 300, 360]), i % 2, false)) n++; }
  { const [gx, gy] = GL.gallery; for (let i = 0, n = 0; i < 800 && n < 48; i++) { const x = gx + rr(-850, 850), y = gy + rr(-2700, 2700); if (putCrystal(x, y, pick([200, 260, 340, 420, 520, 640]), i % 3 === 0 ? 1 : 0)) n++; }
    for (let i = 0, n = 0; i < 600 && n < 36; i++) if (putMite(gx + rr(-900, 900), gy + rr(-2700, 2700), pick([220, 320, 420, 560, 700]))) n++; }
  for (let i = 0, n = 0; i < 200 && n < 8; i++) { const x = GL.camp[0] + rr(-1800, 1800), y = GL.camp[1] + rr(-900, 900); if (Math.hypot(x - GL.camp[0], y - GL.camp[1]) < 1300) continue; if (putCrystal(x, y, pick([200, 260, 340]), 1)) n++; }
  { const [sx, sy] = GL.shade; for (let i = 0, n = 0; i < 300 && n < 16; i++) { const x = sx + rr(-1800, 1800), y = sy + rr(-900, 900); if (putCrystal(x, y, pick([200, 280, 380, 480]), 2, false)) n++; } }
  { const [lx, ly] = GL.lake; for (const [dx, dy, h] of [[-300, -900, 300], [250, 700, 420], [-150, 1300, 260], [380, -300, 200]]) putMite(lx + dx, ly + dy, h); }
  for (let i = 0, n = 0; i < 600 && n < 34; i++) { const x = rr(-hx + 500, hx - 500), y = rr(-hy + 500, hy - 500); if (Math.hypot(x - GL.hall[0], y - GL.hall[1]) < 1100 || Math.hypot(x - GL.floor[0], y - GL.floor[1]) < GL.floorR + 400 || Math.hypot(x - GL.spawn[0], y - GL.spawn[1]) < 1200 || lineDist(x, y, SHOW) < 400) continue; if (putMite(x, y, pick([160, 220, 300, 420]))) n++; }
  for (const it of K.plan(items, GL.spawn)) it.place();

  // ---- loose rock about the floor, lamps on posts round the foot of the walls
  for (let i = 0, n = 0; i < 500 && n < 60; i++) { const x = rr(-hx + 300, hx - 300), y = rr(-hy + 300, hy - 300), r = pick([16, 22, 30, 40]); if (!open(x, y, r + 50) || Math.hypot(x - GL.hall[0], y - GL.hall[1]) < 1000 || lineDist(x, y, SHOW) < 300) continue; S(rock(r, pick([1, 2, 3]), false), x, y, -r * 0.3, rr(0, 360)); if (r >= 30) round(x, y, r * 0.9, r * 0.8); n++; }
  { const A = hx - 140, B = hy - 140; for (let i = 0; i < 30; i++) { const t = ((i + 0.5) / 30) * Math.PI * 2, c = Math.cos(t), s2 = Math.sin(t), bx = A * Math.sign(c) * Math.abs(c) ** (2 / n5), by = B * Math.sign(s2) * Math.abs(s2) ** (2 / n5), L = Math.hypot(bx, by); let x = bx * (1 - 520 / L), y = by * (1 - 520 / L);
      if (Math.hypot(x - GL.exit[0], y - GL.exit[1]) < 1100 || !open(x, y, 70)) continue; const yaw = (Math.atan2(-by, -bx) * 180) / Math.PI; S(lanternPost(300, i % 4), x, y, 0, yaw + 180); round(x, y, 12, 300, 0, false); lit(x + Math.cos(((yaw) * Math.PI) / 180) * 62, y + Math.sin(((yaw) * Math.PI) / 180) * 62, 242, undefined, 520); } }

  // puddles where the roof drips, shards of crystal broken off and lying about
  for (let i = 0, n = 0; i < 300 && n < 26; i++) { const x = rr(-hx + 500, hx - 500), y = rr(-hy + 500, hy - 500); if (!open(x, y, 200)) continue; K.blot(x, y, rr(120, 320), rr(80, 200), pick([0x262c3a, 0x2a3242, 0x22283a]), rr(0, 180)); n++; }
  for (let i = 0, n = 0; i < 500 && n < 50; i++) { const x = rr(-hx + 400, hx - 400), y = rr(-hy + 400, hy - 400); if (!open(x, y, 60) || lineDist(x, y, SHOW) < 200) continue; const h = pick([60, 80, 100]); S(crystal(h, i, i % 3 === 0 ? 1 : 0), x, y, 0, rr(0, 360)); round(x, y, Math.min(CRB(h), h * 0.5), h + 10, 0, false); n++; }

  // where the Nightshade's pools come up: in the hall, the gallery, by the lake
  const settle = ([x, y]) => { for (let r = 0; r <= 1600; r += 100) { const n = Math.max(1, Math.round(r / 50)); for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (open(px, py, 430) && Math.hypot(px - GL.floor[0], py - GL.floor[1]) > 1300 && Math.hypot(px - GL.spawn[0], py - GL.spawn[1]) > 1300) return [Math.round(px), Math.round(py)]; } } return [x, y]; };
  const beds = [[-1000, -1000], [1100, 800], [-4100, 600], [4000, 1400], [-1500, 4200], [2000, 4300]].map(settle);
  return {
    spots: { spawn: GL.spawn, yaw: Math.PI, exit: GL.exit, textYaw: -90, ammo: [GL.spawn[0] + 650, GL.spawn[1] - 150], ammoYaw: 90,
      bench: [GL.floor[0] - 540, GL.floor[1] + 60], benchYaw: 0, box: [GL.floor[0] + 640, GL.floor[1] - 180], chest: [GL.floor[0] + 640, GL.floor[1] - 180], chestYaw: 180, press: [GL.floor[0] - 540, GL.floor[1] - 440], pressYaw: 0 },
    keep: [[GL.floor[0], GL.floor[1], GL.floorR]], bossAt: GL.hall, hangs: null, beds,
  };
}

// ---- the air in the caves: motes of light drifting, drips off the roof, dust turning in the Sunhole's light
export function cavesAir(g, dt, A) {
  const c = g.camera.position, [cx, cy] = A.c; if (Math.abs(c.x - cx) > A.hx + 600 || Math.abs(c.z - cy) > A.hy + 600) return;
  const st = (cavesAir.st ||= { a: 0, d: 0, s: 0 });
  st.a += dt * 20; while (st.a > 1) { st.a -= 1; const a = Math.random() * 6.28, r = 200 + Math.pow(Math.random(), 1.5) * 1800, cyan = Math.random() < 0.5;
    g.fx.add({ pos: new THREE.Vector3(c.x + Math.cos(a) * r, 60 + Math.random() * 900, c.z + Math.sin(a) * r), vel: new THREE.Vector3((Math.random() - 0.5) * 30, (Math.random() - 0.3) * 20, (Math.random() - 0.5) * 30), life: 7, size0: 5, size1: 5, c0: cyan ? [0.6, 0.95, 1, 0.9] : [0.85, 0.7, 1, 0.9], fadeIn: 1.2, fadeOut: 1.5, tex: 'FX_Disc', kind: 'fx', glow: 0.9 }); }
  st.d += dt * 6; while (st.d > 1) { st.d -= 1; const a = Math.random() * 6.28, r = 150 + Math.random() * 1200;
    g.fx.add({ pos: new THREE.Vector3(c.x + Math.cos(a) * r, 1300 + Math.random() * 300, c.z + Math.sin(a) * r), vel: new THREE.Vector3(0, -900, 0), gravity: 0, life: 1.5, size0: 3, size1: 3, c0: [0.7, 0.82, 0.95, 0.8], fadeIn: 0.1, fadeOut: 0.2, tex: 'FX_Disc', kind: 'fx', glow: 0.2 }); }
  const sx = cx + GL.sun[0], sz = cy + GL.sun[1]; if (Math.hypot(c.x - sx, c.z - sz) < 3000) { st.s += dt * 10; while (st.s > 1) { st.s -= 1; const a = Math.random() * 6.28, r = Math.random() * 380;
    g.fx.add({ pos: new THREE.Vector3(sx + Math.cos(a) * r, 100 + Math.random() * 1800, sz + 100 + Math.sin(a) * r), vel: new THREE.Vector3((Math.random() - 0.5) * 16, -10 + Math.random() * 14, (Math.random() - 0.5) * 16), life: 8, size0: 4, size1: 4, c0: [1, 0.98, 0.9, 0.8], fadeIn: 1.5, fadeOut: 1.5, tex: 'FX_Disc', kind: 'fx', glow: 0.5 }); } }
}
