// The Hollow King, sculpted the way a character artist would block one out in ZBrush or Medium: as a signed distance
// field (spheres, capsules, ellipsoids and cones melted together with smooth unions, carved with smooth subtractions,
// the stone given a little noise), then meshed with surface nets into watertight, organic shells. Every vertex gets its
// colour from the material nearest it, with ambient occlusion baked in (how buried the point is), so the folds, the
// eye pits and the gaps between the ribs read dark from across the island without any lights.
// Design (raid-boss rules): the silhouette carries it (a spiked crown with antlers, a fan of spikes behind the head,
// shoulders like towers, a gaunt waist), triangles mean danger, and the weak point (the heart) is framed by the open
// ribcage so you can read it from anywhere. Run: node tools/sculpt_king.mjs  ->  public/king.json
import { writeFileSync } from 'node:fs';

// ---------------------------------------------------------------- the field
const C = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
// The Mother Mold (was the Hollow King): the same giant, but grown rather than built. Bone is pale stalk-flesh, the
// armour is bracket fungus in the first strain's red with cream bands, the antlers are branching roots, the veins glow the
// Blight's green, and a great warted cap spreads over the skull.
const BONE = C(0xe2d6bc), BONE2 = C(0xc6b696), BONED = C(0x8c7c64), ARM = C(0x8a2e1c), ARM2 = C(0x6a2416), GOLD = C(0xe2d2aa), GOLDD = C(0xb0a07e), FLESH = C(0x2c2418), VOID = C(0x0a0806), VEIN = C(0xc4ff58), HORN = C(0x5e4a36), CAPR = C(0xa4432a), CAPD = C(0x6a2416), WART = C(0xe8dcc4);
let D, Cc, want = false;
const reset = () => { D = 1e9; Cc = [0, 0, 0]; };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
// melt d (in colour c) into what is there, with a blend radius k
function U(d, c, k = 40) {
  if (D === 1e9) { D = d; if (want) Cc = c.slice(); return; }
  const h = clamp(0.5 + 0.5 * (d - D) / k, 0, 1);
  if (want) { Cc = [c[0] + (Cc[0] - c[0]) * h, c[1] + (Cc[1] - c[1]) * h, c[2] + (Cc[2] - c[2]) * h]; }
  D = d + (D - d) * h - k * h * (1 - h);
}
// a hard union: whichever is nearer (armour plates sit on the body with a crisp edge)
function H(d, c) { if (d < D) { D = d; if (want) Cc = c.slice(); } }
// carve d away, softly
function S(d, k = 30, c = null) { const h = clamp(0.5 - 0.5 * (D + d) / k, 0, 1); const nd = D + (-d - D) * h + k * h * (1 - h); if (want && c && nd > D + 0.5) Cc = c.slice(); D = nd; }
const len = (x, y, z) => Math.sqrt(x * x + y * y + z * z);
const sph = (p, c, r) => len(p[0] - c[0], p[1] - c[1], p[2] - c[2]) - r;
const ell = (p, c, r) => { const x = (p[0] - c[0]) / r[0], y = (p[1] - c[1]) / r[1], z = (p[2] - c[2]) / r[2], k0 = len(x, y, z), k1 = len(x / r[0], y / r[1], z / r[2]); return k1 < 1e-9 ? -Math.min(...r) : (k0 * (k0 - 1)) / k1; };
// a capsule from a to b whose radius runs from ra to rb (a rounded cone, near enough)
function cap(p, a, b, ra, rb = ra) {
  const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2], px = p[0] - a[0], py = p[1] - a[1], pz = p[2] - a[2];
  const t = clamp((px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz), 0, 1);
  return len(px - bx * t, py - by * t, pz - bz * t) - (ra + (rb - ra) * t);
}
const chain = (p, pts, r0, r1, c, k) => { for (let i = 0; i < pts.length - 1; i++) { const t0 = i / (pts.length - 1), t1 = (i + 1) / (pts.length - 1); U(cap(p, pts[i], pts[i + 1], r0 + (r1 - r0) * t0, r0 + (r1 - r0) * t1), c, k); } };
function torus(p, c, R, r, tilt = 0) { let x = p[0] - c[0], y = p[1] - c[1], z = p[2] - c[2]; const ct = Math.cos(tilt), st = Math.sin(tilt), y2 = y * ct - z * st, z2 = y * st + z * ct; return len(len(x, z2, 0) - R, y2, 0) - r; }
// value noise, for stone that is not quite smooth and veins that wander
const hash = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
function noise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi, s = (t) => t * t * (3 - 2 * t), u = s(xf), v = s(yf), w = s(zf);
  const L = (a, b, t) => a + (b - a) * t, n = (i, j, k) => hash(xi + i, yi + j, zi + k);
  return L(L(L(n(0, 0, 0), n(1, 0, 0), u), L(n(0, 1, 0), n(1, 1, 0), u), v), L(L(n(0, 0, 1), n(1, 0, 1), u), L(n(0, 1, 1), n(1, 1, 1), u), v), w) * 2 - 1;
}
const fbm = (x, y, z) => noise(x, y, z) * 0.6 + noise(x * 2.1, y * 2.1, z * 2.1) * 0.28 + noise(x * 4.3, y * 4.3, z * 4.3) * 0.12;

// ---------------------------------------------------------------- the parts (three.js frame: y up, z toward the island)
// the torso, its origin at the waist
function torso(p) {
  reset();
  // the spine: a column of vertebrae, each with its spur to the back, curving up from the dark to the neck
  const sp = (t) => [0, -700 + t * 2700, -300 + Math.sin(t * 3.0) * 70];
  for (let i = 0; i <= 16; i++) { const t = i / 16, c = sp(t); U(sph(p, c, 105 - t * 25), BONE2, 45); U(cap(p, c, [0, c[1] - 30, c[2] - 210 + t * 40], 40, 14), BONE2, 30); }
  U(cap(p, sp(0), sp(1), 62), BONED, 60);
  // the pelvis, flared, sinking into the abyss; the sinew of the waist, thin and dark
  for (const e of [-1, 1]) U(ell(p, [e * 340, -420, -120], [330, 230, 210]), BONE2, 90);
  U(cap(p, [0, -500, -180], [0, 700, -140], 200, 150), FLESH, 120);
  // the ribcage: seven pairs from the spine round the flanks to the front, stopping short of each other so the chest is
  // open on the cavity where the heart hangs
  for (let k = 0; k < 7; k++) {
    const y = 820 + k * 150, w = 560 - Math.abs(k - 3) * 38, f = 300 - Math.abs(k - 3.5) * 14, r = 44 - k * 1.5;
    for (const e of [-1, 1]) chain(p, [[e * 70, y + 40, -300], [e * (w * 0.8), y + 10, -220], [e * w, y - 50, 20], [e * (w * 0.78), y - 120, f * 0.8], [e * (230 + k * 6), y - 170, f]], r + 6, r - 6, BONE, 22);
  }
  U(ell(p, [0, 1280, -40], [440, 560, 300]), VOID, 90);                         // the dark inside it
  U(ell(p, [0, 1520, -200], [520, 480, 230]), FLESH, 140);                       // the back of the chest
  // collarbones, then shoulders under armour like towers, ringed in gold, with a fan of bone spikes
  for (const e of [-1, 1]) {
    chain(p, [[0, 1930, 250], [e * 450, 2000, 140], [e * 900, 1990, -20]], 64, 72, BONE, 40);
    U(sph(p, [e * 1000, 1920, -60], 250), BONE2, 60);                                       // the joint under it all
    const pc = [e * 1060, 2060, -60];
    H(ell(p, [pc[0], pc[1] + 40, pc[2]], [440, 380, 420]), ARM); H(ell(p, [pc[0], pc[1] - 150, pc[2]], [480, 170, 460]), ARM2); H(torus(p, [pc[0], pc[1] - 170, pc[2]], 430, 32), GOLD);
    H(ell(p, [pc[0], pc[1] - 300, pc[2]], [420, 120, 400]), ARM); H(torus(p, [pc[0], pc[1] - 320, pc[2]], 380, 26), GOLDD);
    for (let s = 0; s < 4; s++) { const a = 0.15 + s * 0.38, root = [pc[0] + e * Math.cos(a) * 260, pc[1] + 180, pc[2] - 120 + s * 50], tip = [pc[0] + e * (Math.cos(a) * 640 + 120), pc[1] + 520 + Math.sin(a) * 380 - s * 60, pc[2] - 280 + s * 60]; U(cap(p, root, tip, 70, 4), BONE, 30); }
  }
  // the collar behind the head: seven spikes in a fan, the middle tallest, like the back of a throne
  for (let s = -3; s <= 3; s++) { const a = s * 0.28, root = [Math.sin(a) * 360, 2050, -330], tip = [Math.sin(a) * 900, 2050 + (980 - Math.abs(s) * 150), -620 - Math.abs(s) * 30]; U(cap(p, root, tip, 80 - Math.abs(s) * 6, 6), s % 2 ? BONE2 : BONE, 35); }
  H(cap(p, [-520, 2050, -300], [520, 2050, -300], 110), ARM); H(torus(p, [0, 2120, -300], 420, 22, Math.PI / 2 - 0.2), GOLD);
  // the neck: vertebrae up to the skull
  for (let i = 0; i < 5; i++) U(sph(p, [0, 1980 + i * 70, -230 + i * 40], 92 - i * 6), BONE2, 40);
  // stone grain and a few veins of the light that keeps it alive
  if (want) { const n = fbm(p[0] * 0.006, p[1] * 0.006, p[2] * 0.006); const v = Math.abs(fbm(p[0] * 0.003 + 7, p[1] * 0.003, p[2] * 0.003)); Cc = Cc.map((x) => clamp(x * (1 + n * 0.12), 0, 1)); if (Cc[1] < 0.12 && Cc[0] < 0.2 && Cc[2] > 0.12 && v < 0.035) Cc = VEIN; }
  D += fbm(p[0] * 0.01, p[1] * 0.01, p[2] * 0.01) * 6;
  return D;
}
// the head: origin at the top of the neck, face toward +z
function head(p) {
  reset();
  U(ell(p, [0, 380, -60], [300, 330, 370]), BONE, 80);                                 // the cranium, long at the back
  U(ell(p, [0, 230, 230], [190, 140, 170]), BONE, 70);                                  // the face
  for (const e of [-1, 1]) { U(ell(p, [e * 175, 255, 210], [110, 70, 95]), BONE, 50); U(cap(p, [e * 40, 440, 300], [e * 230, 420, 220], 62, 48), BONE2, 40); }   // cheekbones, brow
  for (const e of [-1, 1]) S(sph(p, [e * 112, 340, 312], 88), 40, VOID);                // eye pits
  S(ell(p, [0, 255, 385], [38, 62, 50]), 20, VOID);                                     // the nose
  // the jaw, hung a little open, and teeth
  for (const e of [-1, 1]) chain(p, [[e * 215, 250, 40], [e * 200, 90, 140], [e * 120, 30, 280], [0, 25, 330]], 52, 46, BONE2, 35);
  for (let i = -3; i <= 3; i++) { U(cap(p, [i * 46, 170, 360 - Math.abs(i) * 18], [i * 46, 115, 365 - Math.abs(i) * 18], 18, 3), BONE, 8); U(cap(p, [i * 42, 50, 330 - Math.abs(i) * 18], [i * 42, 100, 335 - Math.abs(i) * 18], 16, 3), BONE, 8); }
  // the crown: a heavy circlet and nine spires, the middle one tallest; antlers sweeping back from the temples
  H(torus(p, [0, 600, -40], 320, 42, 0.12), GOLD); H(torus(p, [0, 660, -30], 300, 24, 0.12), GOLDD);
  for (let s = -4; s <= 4; s++) { const a = s * 0.36, x = Math.sin(a) * 320, z = -40 + Math.cos(a) * 320, hgt = [900, 420, 620, 360, 300][Math.abs(s)], b = [x, 640, z]; U(cap(p, b, [x * 1.12, 640 + hgt, z * 1.05 - 40], 46, 4), GOLD, 20); }
  for (const e of [-1, 1]) {
    const pts = [[e * 270, 520, -40], [e * 520, 760, -260], [e * 690, 1180, -480], [e * 640, 1640, -520], [e * 720, 1900, -380]];
    chain(p, pts, 70, 18, HORN, 40);
    for (const [i, up, out] of [[1, 340, 220], [2, 300, 300], [3, 260, 160]]) U(cap(p, pts[i], [pts[i][0] + e * out, pts[i][1] + up, pts[i][2] + 120], 36, 4), HORN, 30);
  }
  // the Mother's cap: a broad warted dome over the crown, its gills dark underneath, a ring of smaller caps round its rim
  { const c = [0, 960, -60], dx = p[0] - c[0], dz = p[2] - c[2], rr = Math.sqrt(dx * dx + dz * dz), t = rr / 820, q = [p[0], p[1] + 160 * t * t, p[2]];
    const top = ell(q, c, [820, 360, 820]), und = ell(q, [c[0], c[1] - 170, c[2]], [830, 300, 830]), d = Math.max(top, -und);
    U(d, CAPR, 30);
    if (want && d < 20) { if (und < 25) Cc = CAPD.slice(); else if (fbm(p[0] * 0.004, 0, p[2] * 0.004) > 0.1) Cc = Cc.map((x, i) => x * 0.85 + CAPD[i] * 0.15); }
    for (let i = 0; i < 26; i++) { const a = i * 2.399, r = Math.sqrt((i + 0.5) / 26) * 700, wx = c[0] + Math.cos(a) * r, wz = c[2] + Math.sin(a) * r, tt = r / 820, wy = c[1] + 360 * Math.sqrt(Math.max(0, 1 - tt * tt)) - 160 * tt * tt; U(ell(p, [wx, wy, wz], [60, 30, 60]), i % 5 === 2 ? VEIN : WART, 20); }
    for (let i = 0; i < 9; i++) { const a = i * 0.698 + 0.2, b = [Math.cos(a) * 760, 820, -60 + Math.sin(a) * 760]; U(cap(p, b, [b[0] * 1.06, 960, b[2] * 1.06], 50, 40), BONE, 20); U(Math.max(ell(p, [b[0] * 1.06, 970, b[2] * 1.06], [150, 70, 150]), 940 - p[1]), CAPR, 20); } }
  if (want) { const n = fbm(p[0] * 0.012, p[1] * 0.012, p[2] * 0.012); Cc = Cc.map((x) => clamp(x * (1 + n * 0.1), 0, 1)); }
  return D;
}
// an upper arm: built along +y from the shoulder (0) to the elbow (L)
const UL = 3400, FL = 3200;
function upper(p) {
  reset();
  U(cap(p, [0, 0, 0], [0, UL, 0], 320, 230), BONE2, 70);
  U(ell(p, [0, UL * 0.35, -30], [400, 1000, 380]), FLESH, 180);                          // what is left of the muscle
  for (let k = 0; k < 4; k++) { const y = UL * (0.18 + k * 0.17); H(cap(p, [0, y, 0], [0, y + 260, 0], 400 - k * 28, 380 - k * 28), k % 2 ? ARM2 : ARM); H(torus(p, [0, y + 260, 0], 385 - k * 28, 24, Math.PI / 2), GOLD); }
  U(sph(p, [0, UL, 0], 300), BONE, 60);                                                  // the elbow
  for (const e of [-1, 1]) U(cap(p, [e * 90, UL - 60, -150], [e * 140, UL + 260, -420], 60, 4), BONE, 25);   // elbow spurs
  if (want) { const n = fbm(p[0] * 0.008, p[1] * 0.008, p[2] * 0.008); Cc = Cc.map((x) => clamp(x * (1 + n * 0.12), 0, 1)); }
  return D;
}
// a forearm: two bones and their sinew from the elbow (0) to the wrist (L), a gauntlet cuff at the wrist
function fore(p) {
  reset();
  U(cap(p, [-110, 0, 0], [-140, FL, 20], 200, 150), BONE2, 60); U(cap(p, [120, 0, 0], [140, FL, -20], 180, 140), BONE2, 60);
  U(cap(p, [0, 200, -60], [0, FL * 0.7, -40], 240, 130), FLESH, 140);
  H(cap(p, [0, FL * 0.62, 0], [0, FL * 0.95, 0], 320, 380), ARM); H(torus(p, [0, FL * 0.95, 0], 380, 30, Math.PI / 2), GOLD); H(torus(p, [0, FL * 0.68, 0], 325, 20, Math.PI / 2), GOLDD);
  for (let s = 0; s < 3; s++) { const a = -0.8 + s * 0.8; U(cap(p, [Math.sin(a) * 320, FL * 0.8, -Math.cos(a) * 320], [Math.sin(a) * 680, FL * 0.66, -Math.cos(a) * 680], 70, 4), BONE, 20); }
  if (want) { const n = fbm(p[0] * 0.008, p[1] * 0.008, p[2] * 0.008); Cc = Cc.map((x) => clamp(x * (1 + n * 0.12), 0, 1)); }
  return D;
}
// a hand: the wrist at 0, fingers reaching along +y; long, jointed, clawed. The palm faces +z.
function hand(p) {
  reset();
  U(ell(p, [0, 380, 0], [330, 420, 150]), BONE2, 80);
  U(sph(p, [0, 30, 0], 200), BONE2, 60);
  const F = [[-270, 1.0], [-95, 1.12], [85, 1.08], [255, 0.92]];
  for (const [x, s] of F) {
    const a = [x * 1.05, 760, 20], b = [x * 1.15, 760 + 420 * s, 120], c = [x * 1.2, 760 + 760 * s, 300], d = [x * 1.22, 760 + 980 * s, 520], tip = [x * 1.2, 760 + 1060 * s, 760];
    U(sph(p, a, 90), BONE, 30); U(cap(p, a, b, 74, 62), BONE2, 30); U(sph(p, b, 70), BONE, 25); U(cap(p, b, c, 62, 52), BONE2, 25); U(sph(p, c, 58), BONE, 20); U(cap(p, c, d, 52, 40), BONE2, 20);
    U(cap(p, d, tip, 44, 3), VOID, 12);                                                    // a black claw
  }
  const t0 = [330, 240, 80], t1 = [560, 560, 260], t2 = [640, 820, 480]; U(cap(p, t0, t1, 90, 70), BONE2, 40); U(cap(p, t1, t2, 70, 48), BONE2, 25); U(cap(p, t2, [660, 900, 700], 44, 3), VOID, 12);
  H(cap(p, [0, -120, 0], [0, 140, 0], 280, 300), ARM); H(torus(p, [0, 0, 0], 300, 24, Math.PI / 2), GOLD);
  if (want) { const n = fbm(p[0] * 0.01, p[1] * 0.01, p[2] * 0.01); Cc = Cc.map((x) => clamp(x * (1 + n * 0.1), 0, 1)); }
  return D;
}

// ---------------------------------------------------------------- surface nets
function mesh(f, lo, hi, h) {
  const nx = Math.ceil((hi[0] - lo[0]) / h) + 1, ny = Math.ceil((hi[1] - lo[1]) / h) + 1, nz = Math.ceil((hi[2] - lo[2]) / h) + 1;
  const F = new Float32Array(nx * ny * nz), I = (i, j, k) => i + nx * (j + ny * k), P = [0, 0, 0];
  want = false;
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { P[0] = lo[0] + i * h; P[1] = lo[1] + j * h; P[2] = lo[2] + k * h; F[I(i, j, k)] = f(P); }
  const vid = new Int32Array(nx * ny * nz).fill(-1), pos = [];
  const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]], co = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const v = co.map(([a, b, c]) => F[I(i + a, j + b, k + c)]); let inn = 0; for (const x of v) if (x < 0) inn++; if (inn === 0 || inn === 8) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of E) { if ((v[a] < 0) === (v[b] < 0)) continue; const t = v[a] / (v[a] - v[b]); sx += co[a][0] + (co[b][0] - co[a][0]) * t; sy += co[a][1] + (co[b][1] - co[a][1]) * t; sz += co[a][2] + (co[b][2] - co[a][2]) * t; n++; }
    vid[I(i, j, k)] = pos.length / 3; pos.push(lo[0] + (i + sx / n) * h, lo[1] + (j + sy / n) * h, lo[2] + (k + sz / n) * h);
  }
  const idx = [], quad = (a, b, c, d, flip) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (flip) idx.push(a, d, c, a, c, b); else idx.push(a, b, c, a, c, d); };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const s = F[I(i, j, k)] < 0;
    if (s !== (F[I(i + 1, j, k)] < 0)) quad(vid[I(i, j - 1, k - 1)], vid[I(i, j, k - 1)], vid[I(i, j, k)], vid[I(i, j - 1, k)], s);
    if (s !== (F[I(i, j + 1, k)] < 0)) quad(vid[I(i - 1, j, k - 1)], vid[I(i - 1, j, k)], vid[I(i, j, k)], vid[I(i, j, k - 1)], s);
    if (s !== (F[I(i, j, k + 1)] < 0)) quad(vid[I(i - 1, j - 1, k)], vid[I(i, j - 1, k)], vid[I(i, j, k)], vid[I(i - 1, j, k)], s);
  }
  // normals from the field, colours from the material, and the occlusion baked in
  const N = pos.length / 3, nor = new Int8Array(N * 3), col = new Uint8Array(N * 3), e = h * 0.5;
  for (let q = 0; q < N; q++) {
    const x = pos[q * 3], y = pos[q * 3 + 1], z = pos[q * 3 + 2];
    want = false; let gx = f([x + e, y, z]) - f([x - e, y, z]), gy = f([x, y + e, z]) - f([x, y - e, z]), gz = f([x, y, z + e]) - f([x, y, z - e]); const gl = len(gx, gy, gz) || 1; gx /= gl; gy /= gl; gz /= gl;
    let occ = 0; for (const [t, w] of [[25, 0.5], [60, 0.3], [130, 0.2], [260, 0.12], [480, 0.08]]) occ += Math.max(0, (t - f([x + gx * t, y + gy * t, z + gz * t])) / t) * w;
    const ao = clamp(1 - occ * 1.1, 0.28, 1) * (0.92 + 0.08 * gy);
    want = true; f([x, y, z]); const c = Cc;
    nor[q * 3] = Math.round(gx * 127); nor[q * 3 + 1] = Math.round(gy * 127); nor[q * 3 + 2] = Math.round(gz * 127);
    const glow = c === VEIN || (c[2] > 0.95 && c[0] > 0.65) || (c[1] > 0.95 && c[0] < 0.85 && c[2] < 0.45) ? 1 : 0;
    for (let a = 0; a < 3; a++) col[q * 3 + a] = Math.round(clamp(c[a] * (glow ? 1 : ao), 0, 1) * 255);
  }
  // make sure every face looks out (one check per triangle against the field's normal)
  for (let t = 0; t < idx.length; t += 3) {
    const [a, b, c] = [idx[t], idx[t + 1], idx[t + 2]], A = pos.slice(a * 3, a * 3 + 3), B = pos.slice(b * 3, b * 3 + 3), Cp = pos.slice(c * 3, c * 3 + 3);
    const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], v = [Cp[0] - A[0], Cp[1] - A[1], Cp[2] - A[2]], n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const m = [nor[a * 3] + nor[b * 3] + nor[c * 3], nor[a * 3 + 1] + nor[b * 3 + 1] + nor[c * 3 + 1], nor[a * 3 + 2] + nor[b * 3 + 2] + nor[c * 3 + 2]];
    if (n[0] * m[0] + n[1] * m[1] + n[2] * m[2] < 0) { idx[t + 1] = c; idx[t + 2] = b; }
  }
  return { pos: new Float32Array(pos), nor, col, idx: N < 65536 ? new Uint16Array(idx) : new Uint32Array(idx) };
}

const parts = [
  ['torso', torso, [-1700, -900, -1000], [1700, 3250, 800], 22],
  ['head', head, [-1000, -50, -1000], [1000, 2050, 900], 16],
  ['upper', upper, [-760, -400, -760], [760, UL + 560, 760], 26],
  ['fore', fore, [-800, -260, -800], [800, FL + 300, 800], 24],
  ['hand', hand, [-500, -200, -260], [800, 1950, 900], 16],
];
const out = [], meta = [];
let off = 0;
for (const [name, f, lo, hi, h] of parts) {
  const t0 = Date.now(), M = mesh(f, lo, hi, h);
  const bufs = [M.pos, M.nor, M.col, M.idx], m = { name, v: M.pos.length / 3, i: M.idx.length, i32: M.idx instanceof Uint32Array, off: [] };
  for (const b of bufs) { const pad = (4 - (off % 4)) % 4; if (pad) { out.push(new Uint8Array(pad)); off += pad; } m.off.push(off); out.push(new Uint8Array(b.buffer, b.byteOffset, b.byteLength)); off += b.byteLength; }
  meta.push(m); console.log(name, m.v, 'verts', m.i / 3, 'tris', Date.now() - t0, 'ms');
}
const js = Buffer.from(JSON.stringify({ UL, FL, parts: meta })), head4 = Buffer.alloc(4); head4.writeUInt32LE(js.length);
const pad = (4 - ((4 + js.length) % 4)) % 4;
// shipped as JSON holding the bytes in base64 (a type every host will serve)
const all = Buffer.concat([head4, js, Buffer.alloc(pad), ...out.map((u) => Buffer.from(u.buffer, u.byteOffset, u.byteLength))]);
writeFileSync(new URL('../public/king.json', import.meta.url), JSON.stringify({ v: 1, b64: all.toString('base64') }));
console.log('wrote public/king.json', off + 4 + js.length + pad, 'bytes');
