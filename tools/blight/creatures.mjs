// The Blight, creature by creature. Each is a set of parts on pivots (the rig the game animates): Body, Head, ArmFront,
// ArmBack, LegFront, LegBack, Tail, WingFront, WingBack. Everything is sculpted in the creature's own frame: feet at
// y = 0, facing +z, x to its left. A part's field is written in that frame too; the baker cuts it out round its pivot.
// Front/Back on limbs means the two sides (the walk swings them in opposite phase), not near and far.
import { C, CAP, FLESH, GLOW, mixP, reset, U, H, S, P, bump, getD, sph, ell, cap, chain, chainD, torus, cyl, box, rotX, rotY, rotZ, along, fbm, noise, cells, len, clamp } from './kit.mjs';

// shared paints
const ROOT = C(0x5e4a36), ROOT2 = C(0x463626), ROOTD = C(0x2e2218), MYC = C(0xe4dccb), MYC2 = C(0xc9bfa9), DARK = C(0x120c08), GUM = C(0x3a1e1a), TOOTH = C(0xd8ccae);
const smooth = (a, b, t) => { t = clamp((t - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- shared anatomy
// A mushroom cap: a dome over (cx, cy, cz) of radius r and height h, its brim drooping by `droop`, wavy by `wave`,
// gills underneath (radial ridges into the stalk), warts on top. Returns nothing: melts into the current field.
function capDome(p, o) {
  const { c, r, h, droop = 6, wave = 2, waves = 5, gills = 26, warts = 0, wartR = 4, seed = 1, under = 0.55, lop = 0, gillIn = r * 0.42, thick = 0.5, tilt = 0 } = o;
  // bend space so the brim sags, wave it, lop it to one side
  const dx = p[0] - c[0], dz = p[2] - c[2], rr = len(dx, 0, dz), a = Math.atan2(dz, dx);
  const k = 1 + Math.sin(a * waves + seed) * wave / r + Math.sin(a + seed * 3) * lop / r, t = rr / (r * k);
  const q = [c[0] + dx / k, p[1] + droop * t * t - tilt * dx / r, c[2] + dz / k];
  const top = ell(q, c, [r, h, r]);
  // the underside: a broad shallow hollow up into the cap, leaving a brim of `thick` x h at the edge
  const und = ell(q, [c[0], c[1] - h * under, c[2]], [r * 1.02, h * (under + 0.04 - thick * 0.1), r * 1.02]);
  U(Math.max(top, -und), CAP(1), 3);
  // gills: grooves under the brim, radial
  if (gills && rr > gillIn && und > -6 && und < 3) { const g = Math.abs(Math.sin(a * gills * 0.5)); if (g < 0.32) bump(1.2 * smooth(gillIn, gillIn + 6, rr) * smooth(r * k, r * k - 3, rr)); }
  const onCap = Math.max(top, -und) < 2.5;   // paint only the cap itself, not what it sits on
  if (gills && onCap) P(und + 2.4, FLESH(0.8), 1.2);   // the underside is the gill colour
  // a darker band at the brim, mottling on top
  if (onCap) { P(r * 0.85 - rr / k, CAP(0.74), r * 0.06); P(-fbm(p[0] * 0.07 + seed, p[1] * 0.07, p[2] * 0.07) - 0.28, CAP(0.84), 0.12); }
  if (warts) for (let i = 0; i < warts; i++) {
    const ang = i * 2.399 + seed, tt = Math.sqrt((i + 0.5) / warts) * 0.84, kk = 1 + Math.sin(ang * waves + seed) * wave / r + Math.sin(ang + seed * 3) * lop / r, rad = tt * r * kk;
    const wx = c[0] + Math.cos(ang) * rad, wz = c[2] + Math.sin(ang) * rad, wy = c[1] + h * Math.sqrt(Math.max(0, 1 - tt * tt)) - droop * tt * tt - tilt * (wx - c[0]) / r, s = wartR * (0.7 + hashI(i, seed) * 0.6);
    if (i % 4 === 1) pore(p, [wx, wy, wz], s * 0.95, [(wx - c[0]) / r * 0.6, 0.8, (wz - c[2]) / r * 0.6]);
    else U(ell(p, [wx, wy, wz], [s, s * 0.6, s]), mixP(CAP(0.55), C(0x1a120a), 0.35), 1.6);
  }
  // bites out of the brim
  for (let i = 0; i < (o.bites || 0); i++) { const ang = seed * 1.7 + i * 2.2; S(sph(p, [c[0] + Math.cos(ang) * r * 1.02, c[1] - droop + 2, c[2] + Math.sin(ang) * r * 1.02], r * 0.13), 2, CAP(0.7)); }
}
const hashI = (i, s) => { let h = (i * 374761393 + s * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
// fibres down a stalk: vertical grooves (a = angle round it), and pale flecks
function fibres(p, c, n = 14, k = 0.7) { const a = Math.atan2(p[2] - c[2], p[0] - c[0]); bump(Math.sin(a * n + p[1] * 0.05) * k); }
// a glowing eye in a socket: the socket carved into the surface, the eye set in it
function eye(p, at, r, look = [0, 0, 1]) {
  S(sph(p, at, r * 1.55), 1.2, DARK);
  U(sph(p, [at[0] - look[0] * r * 0.25, at[1] - look[1] * r * 0.25, at[2] - look[2] * r * 0.25], r), GLOW(1), 0.6);
}
// a little mushroom growing out of the body: a stalk along dir from base, a domed cap on top (the colony motif)
function sprout(p, base, dir, L, cr, glowTip = false) {
  const l = len(...dir), d = [dir[0] / l, dir[1] / l, dir[2] / l], top = [base[0] + d[0] * L, base[1] + d[1] * L, base[2] + d[2] * L];
  U(cap(p, base, top, cr * 0.32, cr * 0.26), FLESH(0.95), cr * 0.25);
  // the cap: a squashed sphere tipped along dir, its underside cut flat-ish
  const q = [p[0] - top[0], p[1] - top[1], p[2] - top[2]], h = q[0] * d[0] + q[1] * d[1] + q[2] * d[2], r2 = len(q[0] - d[0] * h, q[1] - d[1] * h, q[2] - d[2] * h);
  const dome = len(r2 / cr, Math.max(h, 0) / (cr * 0.62), 0) * cr - cr, flat = -h - cr * 0.12;
  U(Math.max(Math.min(dome, len(r2 / cr, h / (cr * 0.62), 0) * cr - cr), flat), CAP(1), 0.6);
  if (glowTip) P(sph(p, [top[0] + d[0] * cr * 0.55, top[1] + d[1] * cr * 0.55, top[2] + d[2] * cr * 0.55], cr * 0.35), GLOW(0.9), cr * 0.12);
}
// a pore: a small crater on a surface with a glowing throat (the Blight's tell: spores lit from inside)
function pore(p, at, r, n = [0, 1, 0]) {
  U(sph(p, at, r * 1.25), CAP(0.62), r * 0.6);   // the raised lip
  S(sph(p, [at[0] + n[0] * r * 0.55, at[1] + n[1] * r * 0.55, at[2] + n[2] * r * 0.55], r * 0.72), r * 0.3, GLOW(1));
}
// mold creeping over a stalk: sparse, soft, darker patches (low on the body more than high)
function mold(p, lowY, highY, k = 0.45) { P(k - fbm(p[0] * 0.09 + 7, p[1] * 0.09, p[2] * 0.09) - smooth(highY, lowY, p[1]) * 0.22, mixP(FLESH(0.62), C(0x2a2216), 0.35), 0.2); }
// a root-finger: a tapering, slightly knuckled chain from a to the tip
function rootFinger(p, pts, r0, paint = ROOT) { chain(p, pts, r0, r0 * 0.18, paint, 1.5); }
// a cluster of rootlets / hyphae trailing from a point (thin, wandering)
function rootlets(p, at, dir, n, L, r, seed, paint = ROOT2) {
  for (let i = 0; i < n; i++) {
    const a = i * 2.39 + seed, sp = 0.55, dx = dir[0] + Math.cos(a) * sp, dy = dir[1] - 0.25, dz = dir[2] + Math.sin(a) * sp, l = L * (0.6 + hashI(i, seed) * 0.6);
    const m = [at[0] + dx * l * 0.5 + Math.sin(a * 3) * 2, at[1] + dy * l * 0.5, at[2] + dz * l * 0.5 + Math.cos(a * 2) * 2];
    chain(p, [at, m, [at[0] + dx * l, at[1] + dy * l, at[2] + dz * l]], r, r * 0.25, paint, 1);
  }
}

// ---------------------------------------------------------------- ROTCAP (Walker)
// The common rank and file: a stout toadstool that got up and walked. A broad, warty cap slumped over its face, two
// green coals for eyes and a gill-lined slot of a mouth under the brim; a fibrous stalk of a body with a ragged ring
// hanging off it like a torn skirt; arms of twisted root ending in long root-fingers; two root legs, splayed at the foot.
// About 200 high.
const RC = { hipY: 64, neck: [0, 134, 6], sh: 25 };
export const Rotcap = {
  height: 200,
  parts: [
    { role: 'LegBack', pivot: [-17, RC.hipY, 0], lo: [-48, -4, -34], hi: [10, 80, 40], h: 1.6, f: (p) => rotcapLeg(p, -1) },
    { role: 'LegFront', pivot: [17, RC.hipY, 0], lo: [-10, -4, -34], hi: [48, 80, 40], h: 1.6, f: (p) => rotcapLeg(p, 1) },
    { role: 'Body', pivot: [0, RC.hipY, 0], lo: [-46, 40, -40], hi: [46, 162, 46], h: 1.5, f: rotcapBody },
    { role: 'ArmBack', pivot: [-RC.sh, 122, 4], lo: [-62, 20, -30], hi: [-8, 132, 48], h: 1.5, f: (p) => rotcapArm(p, -1) },
    { role: 'ArmFront', pivot: [RC.sh, 122, 4], lo: [8, 20, -30], hi: [62, 132, 48], h: 1.5, f: (p) => rotcapArm(p, 1) },
    { role: 'Head', pivot: RC.neck, lo: [-72, 116, -66], hi: [72, 206, 80], h: 1.7, f: rotcapHead },
  ],
};
function rotcapLeg(p, s) {
  reset();
  const hip = [s * 17, RC.hipY + 4, 0], knee = [s * 21, 36, 5], ank = [s * 19, 9, 1];
  U(cap(p, hip, knee, 12, 10), FLESH(0.55, 0x2a2016), 4); U(cap(p, knee, ank, 10, 11), ROOT, 4);
  fibres(p, knee, 9, 0.5);
  // the foot: a flare of root, three toes forward and out, one back, rootlets into the ground
  U(ell(p, [ank[0], 7, ank[2] + 3], [15, 8, 17]), ROOT2, 5);
  for (const [ax, az, l] of [[-0.35, 1, 20], [0.05, 1, 23], [0.45, 0.9, 19], [0.1, -1, 13]]) {
    const dx = ax * s, tip = [ank[0] + dx * l, 1.5, ank[2] + az * l];
    rootFinger(p, [[ank[0], 6, ank[2] + az * 4], [ank[0] + dx * l * 0.55, 4, ank[2] + az * l * 0.6], tip], 5.2, ROOT2);
  }
  S(cap(p, [-80, -20, 0], [80, -20, 0], 20.5), 1);   // flat underneath: it stands on the floor
  P(p[1] - 14, ROOTD, 6);   // darker where it meets the ground
  return getD();
}
function rotcapBody(p) {
  reset();
  // the stalk: a swollen base round the hips narrowing up to the neck, hunched a little forward
  const lean = (p[1] - 60) * 0.1;
  const q = [p[0], p[1], p[2] - lean];
  U(ell(q, [0, 72, 0], [25, 17, 23]), FLESH(1), 8);                       // the bulb at the base
  U(cap(q, [0, 78, 0], [0, 140, 0], 22, 17), FLESH(1), 10);              // the stalk
  fibres(q, [0, 0, 0], 16, 0.65);
  // the ring: a ragged skirt hanging off the stalk at the chest, torn in places
  { const a = Math.atan2(q[2], q[0]), rr = len(q[0], 0, q[2]), tear = Math.max(0, Math.sin(a * 3 + 1)) * 9 + Math.sin(a * 11) * 2.2;
    const y0 = 112, hang = (rr - 20) * 0.75;
    const skirt = Math.max(Math.abs(q[1] - (y0 - hang)) - 2.4, rr - (34 - tear * 0.5), 19 - rr);
    U(skirt, FLESH(0.88, 0x0e0a06), 2.5); }
  // shoulders: knots of root where the arms come out
  for (const s of [-1, 1]) U(ell(q, [s * 22, 122, 3], [9, 8, 9]), ROOT, 6);
  // mycelium threads wound round the stalk
  for (let i = 0; i < 3; i++) { const y = 88 + i * 9, ph = i * 2.1; const pts = []; for (let k = 0; k <= 8; k++) { const a = ph + k * 0.5; pts.push([Math.cos(a) * (25 - (y - 80) * 0.11), y + k * 1.4, Math.sin(a) * (25 - (y - 80) * 0.11)]); } chain(q, pts, 1.3, 1.1, MYC2, 0.8); }
  // a colony of little mushrooms on one shoulder and down the back
  sprout(q, [15, 128, -8], [0.5, 1, -0.35], 12, 7.5, true); sprout(q, [21, 125, -2], [0.9, 0.7, 0], 8, 5); sprout(q, [9, 131, -13], [0.2, 1, -0.6], 8, 4.6);
  sprout(q, [-7, 112, -19], [-0.25, 0.6, -1], 10, 6, true); sprout(q, [3, 100, -21], [0.3, 0.5, -1], 7, 4.4); sprout(q, [-12, 98, -18], [-0.6, 0.3, -1], 6, 3.8);
  // mold creeping up from the base: darker patches
  mold(p, 72, 118);
  return getD();
}
function rotcapArm(p, s) {
  reset();
  const sh = [s * 25, 122, 4], el = [s * 33, 92, 10], wr = [s * 33, 64, 18];
  // two twisted strands make each bone
  for (const tw of [0, 1]) { const o = tw ? 2.4 : -2.4; chain(p, [sh, [el[0] + o * s, el[1] + 6, el[2] + o], el], 6.2 - tw, 5.2, tw ? ROOT : ROOT2, 3); chain(p, [el, [wr[0] - o * s, wr[1] + 10, wr[2] - o], wr], 5 - tw * 0.6, 4.2, tw ? ROOT : ROOT2, 3); }
  U(sph(p, el, 6.5), ROOT, 3);
  U(ell(p, [wr[0], wr[1] - 2, wr[2] + 1], [7.5, 6, 7]), ROOT2, 3);   // the knot of a hand
  // four long root-fingers, curled a little in, and a thumb
  for (let i = 0; i < 4; i++) { const sp = (i - 1.5) * 0.32, b = [wr[0] + s * sp * 6, wr[1] - 4, wr[2] + 3]; rootFinger(p, [b, [b[0] + s * sp * 9, wr[1] - 16, wr[2] + 9], [b[0] + s * sp * 12, wr[1] - 30, wr[2] + 12 + i % 2 * 2], [b[0] + s * sp * 10, wr[1] - 38, wr[2] + 18]], 2.7, ROOT2); }
  rootFinger(p, [[wr[0] - s * 4, wr[1] - 2, wr[2] + 5], [wr[0] - s * 8, wr[1] - 12, wr[2] + 14], [wr[0] - s * 7, wr[1] - 20, wr[2] + 21]], 2.4, ROOT2);
  P(sph(p, sh, 12), FLESH(0.6, 0x221810), 6);   // stalk-coloured where it comes out of the body
  return getD();
}
function rotcapHead(p) {
  reset();
  // the neck and face: the top of the stalk, swelling under the cap
  U(cap(p, [0, 124, 4], [0, 158, 8], 17, 20), FLESH(1), 6);
  fibres(p, [0, 0, 6], 16, 0.45);
  // the cap: broad, slumped, lopsided, warty
  capDome(p, { c: [0, 163, 7], r: 50, h: 27, droop: 9, wave: 2.2, waves: 6, gills: 34, warts: 22, wartR: 4.6, seed: 2, lop: 3, gillIn: 22, under: 0.42, tilt: 3, bites: 2 });
  U(ell(p, [0, 186, 7], [16, 6, 16]), CAP(0.9), 8);   // the umbo, a knob in the middle of the cap
  // the face under the brim: two eyes, a brow ridge, the mouth
  for (const s of [-1, 1]) eye(p, [s * 8.5, 144, 24.5], 2.8);
  U(ell(p, [0, 147.5, 23], [16, 3.2, 4.5]), FLESH(0.9), 3);   // brow
  S(p[1] - 119, 1.5);   // the neck ends inside the body
  S(ell(p, [0, 133, 22], [12.5, 5, 9]), 1.5, GUM);   // the mouth, a ragged slot
  for (let i = -4; i <= 4; i++) { const x = i * 2.7, l = 3.2 + (i & 1) * 1.6; U(cap(p, [x, 137.2, 20.5], [x, 137.2 - l, 21.8], 1.05, 0.3), TOOTH, 0.4); }   // gill-teeth along the top
  for (let i = -3; i <= 3; i++) { const x = i * 3.1 + 1, l = 2.4 + ((i + 1) & 1) * 1.4; U(cap(p, [x, 129, 20.5], [x, 129 + l, 21.6], 0.95, 0.3), TOOTH, 0.4); }   // and along the bottom
  return getD();
}



// shared limbs ------------------------------------------------------------
// a root leg from hip through knee to ankle, a splayed root foot (toes as [side, fwd, length]), flat underneath
function rootLeg(p, hip, knee, ank, r0, r1, toes, s, paint = ROOT, foot = ROOT2) {
  U(cap(p, hip, knee, r0, r0 * 0.85), FLESH(0.55, 0x2a2016), r0 * 0.4); U(cap(p, knee, ank, r0 * 0.85, r1), paint, r0 * 0.35);
  fibres(p, knee, 9, 0.45);
  U(ell(p, [ank[0], ank[1] - 1, ank[2] + 2], [r1 * 1.3, r1 * 0.8, r1 * 1.5]), foot, r1 * 0.5);
  for (const [ax, az, l] of toes) { const dx = ax * s, tip = [ank[0] + dx * l, 1.4, ank[2] + az * l]; rootFinger(p, [[ank[0], ank[1] - 2, ank[2] + az * 3], [ank[0] + dx * l * 0.55, Math.max(3, ank[1] * 0.4), ank[2] + az * l * 0.6], tip], r1 * 0.5, foot); }
  S(p[1] + 0.5, 1);   // flat on the floor
  P(p[1] - 12, ROOTD, 6);
}
// a thin root arm with a claw of n long fingers
function rootArm(p, sh, el, wr, r, n, L, s, curl = 1) {
  chain(p, [sh, [(sh[0] + el[0]) / 2 + s * 1.5, (sh[1] + el[1]) / 2, (sh[2] + el[2]) / 2], el], r, r * 0.8, ROOT, r * 0.4);
  chain(p, [el, [(el[0] + wr[0]) / 2, (el[1] + wr[1]) / 2, (el[2] + wr[2]) / 2 + 1], wr], r * 0.8, r * 0.7, ROOT2, r * 0.4);
  U(sph(p, el, r * 1.05), ROOT, r * 0.5); U(ell(p, wr, [r * 1.1, r * 0.95, r * 1.1]), ROOT2, r * 0.5);
  for (let i = 0; i < n; i++) { const sp = (i - (n - 1) / 2) * 0.42; rootFinger(p, [[wr[0] + s * sp * 3, wr[1] - 2, wr[2] + 2], [wr[0] + s * sp * 7, wr[1] - L * 0.45, wr[2] + 4 * curl], [wr[0] + s * sp * 9, wr[1] - L * 0.85, wr[2] + 7 * curl], [wr[0] + s * sp * 8, wr[1] - L, wr[2] + 12 * curl]], r * 0.42, ROOT2); }
  P(sph(p, sh, r * 2), FLESH(0.6, 0x221810), r);
}

// ---------------------------------------------------------------- SPORELING (Runner)
// A lanky thing that runs bent double: a thin stalk of a spine, a round puffball head split by a wide jagged grin, a
// cluster of lit pores for eyes, stilt legs and long dragging arms. About 185 high before scale.
export const Sporeling = {
  height: 185,
  parts: [
    { role: 'LegBack', pivot: [-13, 88, -4], lo: [-40, -4, -40], hi: [6, 100, 40], h: 1.4, f: (p) => { reset(); rootLeg(p, [-13, 92, -4], [-16, 50, 12], [-13, 13, -6], 7, 5, [[-0.3, 1, 18], [0.1, 1, 21], [0.4, 0.8, 16], [0, -1, 10]], -1); return getD(); } },
    { role: 'LegFront', pivot: [13, 88, -4], lo: [-6, -4, -40], hi: [40, 100, 40], h: 1.4, f: (p) => { reset(); rootLeg(p, [13, 92, -4], [16, 50, 12], [13, 13, -6], 7, 5, [[-0.3, 1, 18], [0.1, 1, 21], [0.4, 0.8, 16], [0, -1, 10]], 1); return getD(); } },
    { role: 'Body', pivot: [0, 88, -4], lo: [-36, 66, -42], hi: [36, 166, 44], h: 1.4, f: sporelingBody },
    { role: 'ArmBack', pivot: [-14, 141, 10], lo: [-48, 24, -16], hi: [-2, 150, 56], h: 1.3, f: (p) => { reset(); rootArm(p, [-14, 141, 10], [-22, 106, 22], [-24, 74, 32], 5, 3, 26, -1); return getD(); } },
    { role: 'ArmFront', pivot: [14, 141, 10], lo: [2, 24, -16], hi: [48, 150, 56], h: 1.3, f: (p) => { reset(); rootArm(p, [14, 141, 10], [22, 106, 22], [24, 74, 32], 5, 3, 26, 1); return getD(); } },
    { role: 'Head', pivot: [0, 150, 18], lo: [-34, 136, -10], hi: [34, 200, 58], h: 1.3, f: sporelingHead },
  ],
};
function sporelingBody(p) {
  reset();
  // the spine bends forward: a chain from the pelvis to the neck
  const sp = [[0, 84, -6], [0, 104, -8], [0, 124, -2], [0, 142, 8], [0, 154, 18]];
  U(ell(p, [0, 88, -4], [17, 12, 15]), FLESH(1), 6);
  chain(p, sp, 13, 9, FLESH(1), 6); fibres(p, [0, 0, 0], 12, 0.5);
  // ribs of fibre bundles round the chest, and a ragged shred of ring
  for (let i = 0; i < 4; i++) { const y = 112 + i * 7, z = -4 + i * 3.5; for (const s of [-1, 1]) chain(p, [[0, y + 2, z - 10], [s * 11, y, z - 2], [s * 10, y - 3, z + 8]], 1.6, 1.2, FLESH(0.85), 1.2); }
  for (const s of [-1, 1]) U(ell(p, [s * 12, 140, 9], [6, 5, 6]), ROOT, 4);
  sprout(p, [-4, 132, -10], [-0.3, 0.8, -1], 9, 5.5, true); sprout(p, [5, 120, -14], [0.5, 0.6, -1], 7, 4.4); sprout(p, [0, 104, -18], [0, 0.4, -1], 6, 3.8, true);
  mold(p, 96, 150);
  return getD();
}
function sporelingHead(p) {
  reset();
  const c = [0, 170, 28];
  U(cap(p, [0, 148, 16], [0, 160, 24], 9, 11), FLESH(1), 4);
  // the puffball: a little pear-shaped, its skin scaled with small warts
  U(ell(p, c, [23, 22, 22]), CAP(1), 4); U(ell(p, [0, 160, 28], [20, 12, 19]), CAP(0.92), 6);
  { const [d1] = cells(p[0] * 0.28, p[1] * 0.28, p[2] * 0.28); bump(-Math.max(0, 0.35 - d1) * 2.2); P(d1 - 0.22, mixP(FLESH(0.9), CAP(0.3), 0.3), 0.06); }
  // the grin: a wide crescent cut across the lower front, ragged teeth top and bottom
  const m = [0, 164, 47];
  S(Math.max(ell(p, m, [17, 7.5, 12]), -ell(p, [0, 172, 49], [19, 9, 14])), 1.6, GUM);
  for (let i = -5; i <= 5; i++) { const x = i * 2.9, a = Math.abs(i) / 6, yT = 166.5 - a * a * 4, yB = 159 + a * a * 2.5; U(cap(p, [x, yT + 1.5, 46 - a * 4], [x, yT - 3 - (i & 1) * 1.6, 47 - a * 4], 1.1, 0.3), TOOTH, 0.4); U(cap(p, [x + 1.4, yB - 1.5, 45.5 - a * 4], [x + 1.4, yB + 2.4 + (i & 1), 46.5 - a * 4], 1, 0.3), TOOTH, 0.4); }
  // eyes: a cluster of lit pores, high and to one side
  pore(p, [-7, 182, 44], 3.2, [0, 0.4, 1]); pore(p, [3, 186, 42], 2.6, [0.1, 0.5, 1]); pore(p, [-1, 178, 47], 2.2, [0, 0.2, 1]); pore(p, [9, 179, 44], 1.8, [0.3, 0.3, 1]);
  pore(p, [10, 190, 26], 2.2, [0.3, 1, 0]); pore(p, [-14, 186, 18], 2, [-0.6, 0.7, -0.2]); pore(p, [4, 192, 12], 2.4, [0, 1, -0.4]);
  return getD();
}

// ---------------------------------------------------------------- CREEPER (Crawler)
// Mycelium that learned to walk: a lumpy dome crowded with little mushrooms, six jointed root legs spread wide, and at the
// front a knot of four lit eyes over a pair of hooked root fangs. Low and wide: 90 high, 180 across before scale.
const CR_LEGS = [[1, 22, 1], [1, 0, -1], [1, -20, 1], [-1, 22, -1], [-1, 0, 1], [-1, -20, -1]];   // side, z, phase (+1 = LegFront)
export const Creeper = {
  height: 90,
  parts: [
    ...CR_LEGS.map(([s, z, ph]) => ({ role: ph > 0 ? 'LegFront' : 'LegBack', pivot: [s * 24, 50, z], lo: s > 0 ? [10, -4, z - 40] : [-110, -4, z - 40], hi: s > 0 ? [110, 96, z + 40] : [-10, 96, z + 40], h: 1.3, f: (p) => creeperLeg(p, s, z) })),
    { role: 'Body', pivot: [0, 50, 0], lo: [-48, 12, -54], hi: [48, 100, 50], h: 1.4, f: creeperBody },
    { role: 'Head', pivot: [0, 48, 30], lo: [-26, 22, 18], hi: [26, 70, 70], h: 1.1, f: creeperHead, tris: 3000 },
  ],
};
function creeperLeg(p, s, z) {
  reset();
  const fz = z * 1.5 + (z === 0 ? 0 : Math.sign(z) * 12), hip = [s * 24, 50, z], knee = [s * 58, 80, z + (fz - z) * 0.5], ank = [s * 84, 30, fz], tip = [s * 94, 1.5, fz + Math.sign(z || 1) * 2];
  U(sph(p, hip, 6.5), ROOT, 3);
  chain(p, [hip, [s * 42, 72, z + (fz - z) * 0.3], knee], 5.4, 4.4, ROOT, 2); U(sph(p, knee, 5), ROOT2, 2);
  chain(p, [knee, [s * 76, 58, (knee[2] + ank[2]) / 2], ank], 4.4, 3.4, ROOT2, 2); chain(p, [ank, tip], 3.2, 0.8, ROOT2, 1.5);
  fibres(p, knee, 7, 0.4);
  // a few hyphae trail off the knee
  chain(p, [knee, [knee[0] + s * 4, knee[1] - 12, knee[2] + 3], [knee[0] + s * 2, knee[1] - 22, knee[2] + 6]], 0.9, 0.4, MYC2, 0.6);
  S(p[1] + 0.5, 1);
  P(sph(p, hip, 14), FLESH(0.6, 0x221810), 6);
  return getD();
}
function creeperBody(p) {
  reset();
  U(ell(p, [0, 52, -4], [34, 22, 40]), FLESH(1), 8);
  U(ell(p, [0, 62, -8], [26, 16, 30]), CAP(1), 10);   // the colony's cap-skin over the back
  { const [d1] = cells(p[0] * 0.18, p[1] * 0.18, p[2] * 0.18); bump(-Math.max(0, 0.3 - d1) * 2); }
  // a crowd of little mushrooms, some lit
  const sprouts = [[0, 74, -6, 0, 1, 0, 12, 8, 1], [-14, 70, 6, -0.4, 1, 0.3, 9, 6, 0], [13, 71, 2, 0.4, 1, 0.2, 10, 6.5, 1], [-8, 70, -22, -0.2, 1, -0.5, 8, 5.4, 0], [10, 68, -24, 0.3, 1, -0.6, 9, 5.8, 1], [20, 64, -12, 0.8, 0.8, -0.2, 7, 4.6, 0], [-20, 63, -10, -0.8, 0.8, -0.1, 7, 4.8, 1], [4, 70, 14, 0.1, 1, 0.6, 7, 4.4, 0]];
  for (const [x, y, z, dx, dy, dz, L, r, g] of sprouts) sprout(p, [x, y, z], [dx, dy, dz], L, r, !!g);
  // hyphae hanging underneath, the belly darker
  for (let i = 0; i < 7; i++) { const x = (i - 3) * 9, z = ((i * 37) % 30) - 15; chain(p, [[x, 34, z], [x + 2, 26, z + 3], [x - 1, 19, z + 5]], 1.2, 0.5, MYC2, 0.8); }
  P(p[1] - 40, mixP(FLESH(0.7), C(0x1a140c), 0.3), 5);
  return getD();
}
function creeperHead(p) {
  reset();
  U(ell(p, [0, 47, 42], [15, 12, 13]), FLESH(0.95), 5);
  U(ell(p, [0, 54, 40], [13, 7, 11]), CAP(0.9), 4);
  // four eyes in a curve, the middle two bigger
  for (const [x, y, r] of [[-9, 51, 2.1], [-3.4, 53, 2.7], [3.4, 53, 2.7], [9, 51, 2.1]]) eye(p, [x, y, 53.5 - Math.abs(x) * 0.35], r);
  // the fangs: two hooked root chelicerae, and a mouth between
  for (const s of [-1, 1]) chain(p, [[s * 6, 41, 50], [s * 8, 34, 56], [s * 5, 27, 58], [s * 2, 25, 55]], 3, 0.7, ROOT2, 1.2);
  S(ell(p, [0, 41, 54], [5, 3, 4]), 1, GUM);
  return getD();
}

// ---------------------------------------------------------------- PUFFBALL (Bloater)
// A puffball the size of a cart, waddling on two stumps: the skin cracked over a lit, swelling inside, warts everywhere,
// a gaping mouth low on the front and two eyes above it, stub arms, and a crown on top with the pore it bursts through.
export const Puffball = {
  height: 215,
  parts: [
    { role: 'LegBack', pivot: [-30, 52, 0], lo: [-66, -4, -40], hi: [0, 84, 44], h: 1.8, f: (p) => { reset(); rootLeg(p, [-30, 56, 0], [-34, 30, 6], [-32, 12, 4], 16, 14, [[-0.4, 1, 20], [0.1, 1, 24], [0.5, 0.8, 20], [0, -1, 14]], -1, ROOT, ROOT2); return getD(); } },
    { role: 'LegFront', pivot: [30, 52, 0], lo: [0, -4, -40], hi: [66, 84, 44], h: 1.8, f: (p) => { reset(); rootLeg(p, [30, 56, 0], [34, 30, 6], [32, 12, 4], 16, 14, [[-0.4, 1, 20], [0.1, 1, 24], [0.5, 0.8, 20], [0, -1, 14]], 1, ROOT, ROOT2); return getD(); } },
    { role: 'Body', pivot: [0, 56, 0], lo: [-84, 34, -84], hi: [84, 196, 90], h: 2.0, f: puffballBody, tris: 9000 },
    { role: 'ArmBack', pivot: [-66, 120, 18], lo: [-100, 60, -10], hi: [-50, 130, 60], h: 1.4, f: (p) => { reset(); rootArm(p, [-62, 120, 18], [-76, 102, 30], [-78, 86, 40], 7.5, 3, 18, -1, 0.6); return getD(); } },
    { role: 'ArmFront', pivot: [66, 120, 18], lo: [50, 60, -10], hi: [100, 130, 60], h: 1.4, f: (p) => { reset(); rootArm(p, [62, 120, 18], [76, 102, 30], [78, 86, 40], 7.5, 3, 18, 1, 0.6); return getD(); } },
    { role: 'Head', pivot: [0, 176, 0], lo: [-46, 164, -46], hi: [46, 224, 46], h: 1.4, f: puffballHead },
  ],
};
const PB = [0, 118, 0];
function puffballBody(p) {
  reset();
  U(ell(p, PB, [74, 68, 72]), FLESH(1), 4);
  U(ell(p, [0, 66, 0], [44, 24, 42]), FLESH(0.85), 16);   // the base it sits on
  P(118 - p[1] + fbm(p[0] * 0.03, p[1] * 0.03, p[2] * 0.03) * 22, CAP(1), 10);   // the strain's colour over the top, fading down the sides
  // warts all over, bigger toward the top: raised in the cap colour
  { const [d1] = cells(p[0] * 0.075, p[1] * 0.075, p[2] * 0.075); bump(-Math.max(0, 0.3 - d1) * 3.2 * smooth(60, 140, p[1])); }
  // cracks: deep fissures with the lit inside showing
  const crack = (a0, a1, y0, y1, w) => { const n = 9; let d = 1e9; for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, A = (u) => a0 + (a1 - a0) * u + Math.sin(u * 13 + a0) * 0.07, Y = (u) => y0 + (y1 - y0) * u + Math.sin(u * 9) * 4;
      const P0 = [Math.sin(A(t0)) * 76, Y(t0), Math.cos(A(t0)) * 74], P1 = [Math.sin(A(t1)) * 76, Y(t1), Math.cos(A(t1)) * 74]; d = Math.min(d, cap(p, P0, P1, w * (1 - Math.abs(t0 - 0.5)))); } return d; };
  for (const [a0, a1, y0, y1, w] of [[-0.9, -0.2, 150, 96, 4.5], [0.6, 1.5, 160, 120, 4], [2.2, 3.0, 100, 150, 5], [3.6, 4.6, 140, 90, 4.5], [-1.9, -1.3, 120, 170, 3.5]]) S(crack(a0, a1, y0, y1, w), 2, GLOW(1));
  // the face: two eyes, a gaping mouth with a lit throat, lips of puckered skin
  for (const s of [-1, 1]) eye(p, [s * 15, 134, 67.5], 3.4);
  U(ell(p, [0, 104, 64], [26, 15, 14]), mixP(CAP(0.8), FLESH(0.2), 0.3), 5);
  S(ell(p, [0, 104, 72], [19, 10, 16]), 2, GUM); S(ell(p, [0, 104, 64], [12, 6, 10]), 2, GLOW(0.85));
  for (let i = -4; i <= 4; i++) { const x = i * 4.3, a = Math.abs(i) / 5; U(cap(p, [x, 113 - a * a * 4, 76 - a * 5], [x, 108 - a * a * 4 - (i & 1) * 2, 78 - a * 5], 1.6, 0.4), TOOTH, 0.5); }
  return getD();
}
function puffballHead(p) {
  reset();
  // a crumpled crown of skin round the pore it bursts through, lit inside
  U(ell(p, [0, 180, 0], [38, 16, 36]), CAP(0.95), 6);
  for (let i = 0; i < 7; i++) { const a = i * 0.9, r = 26; U(cap(p, [Math.cos(a) * 18, 184, Math.sin(a) * 18], [Math.cos(a) * r, 199 + (i % 3) * 3, Math.sin(a) * r], 7, 2.5), CAP(0.85), 5); }
  S(cap(p, [0, 186, 0], [0, 210, 0], 11, 15), 3, GLOW(1));
  S(p[1] - 166, 2);
  return getD();
}

// ---------------------------------------------------------------- INKCAP (Spitter)
// A shaggy ink cap stood up: a tall bell of a head covered in curling scales, its rim dissolving into black ink that
// drips; under the rim, two eyes and a round puckered mouth it spits through. A slim pale stalk, thin arms.
export const Inkcap = {
  height: 214,
  parts: [
    { role: 'LegBack', pivot: [-13, 70, 0], lo: [-40, -4, -36], hi: [6, 90, 40], h: 1.4, f: (p) => { reset(); rootLeg(p, [-13, 74, 0], [-15, 38, 6], [-13, 11, 1], 8.5, 7, [[-0.35, 1, 17], [0.05, 1, 20], [0.45, 0.9, 16], [0.1, -1, 11]], -1); return getD(); } },
    { role: 'LegFront', pivot: [13, 70, 0], lo: [-6, -4, -36], hi: [40, 90, 40], h: 1.4, f: (p) => { reset(); rootLeg(p, [13, 74, 0], [15, 38, 6], [13, 11, 1], 8.5, 7, [[-0.35, 1, 17], [0.05, 1, 20], [0.45, 0.9, 16], [0.1, -1, 11]], 1); return getD(); } },
    { role: 'Body', pivot: [0, 70, 0], lo: [-34, 52, -34], hi: [34, 156, 36], h: 1.4, f: inkcapBody },
    { role: 'ArmBack', pivot: [-15, 120, 3], lo: [-46, 40, -20], hi: [-2, 130, 40], h: 1.3, f: (p) => { reset(); rootArm(p, [-15, 120, 3], [-23, 95, 8], [-24, 72, 15], 4.6, 3, 20, -1); return getD(); } },
    { role: 'ArmFront', pivot: [15, 120, 3], lo: [2, 40, -20], hi: [46, 130, 40], h: 1.3, f: (p) => { reset(); rootArm(p, [15, 120, 3], [23, 95, 8], [24, 72, 15], 4.6, 3, 20, 1); return getD(); } },
    { role: 'Head', pivot: [0, 128, 3], lo: [-36, 104, -36], hi: [36, 222, 38], h: 1.4, f: inkcapHead },
  ],
};
function inkcapBody(p) {
  reset();
  U(ell(p, [0, 74, 0], [17, 12, 16]), FLESH(1), 5);
  U(cap(p, [0, 74, 0], [0, 136, 3], 14.5, 11), FLESH(1), 6); fibres(p, [0, 0, 0], 14, 0.4);
  // a loose ring slipped down the stalk
  { const rr = len(p[0], 0, p[2] - 1.5), y0 = 104 - (rr - 12) * 0.5; U(Math.max(Math.abs(p[1] - y0) - 1.6, rr - (21 + Math.sin(Math.atan2(p[2], p[0]) * 7) * 1.5), 11 - rr), FLESH(0.85), 1.5); }
  for (const s of [-1, 1]) U(ell(p, [s * 13, 119, 3], [5.5, 4.5, 5.5]), ROOT, 3);
  sprout(p, [-8, 96, -10], [-0.5, 0.4, -1], 7, 4.4, true); sprout(p, [6, 90, -12], [0.5, 0.3, -1], 5, 3.4);
  mold(p, 80, 130);
  return getD();
}
const INK = C(0x0e0b10), INK2 = C(0x2a2430);
function inkcapHead(p) {
  reset();
  // the stalk's top and a face under the rim
  U(cap(p, [0, 122, 3], [0, 170, 3], 10.5, 9), FLESH(1), 4);
  for (const s of [-1, 1]) eye(p, [s * 5.8, 132.5, 11.4], 2.3);
  U(ell(p, [0, 125, 10.3], [5.5, 4.6, 3.2]), FLESH(0.85), 2); S(ell(p, [0, 125, 13], [3.2, 2.7, 4]), 1, GUM);   // the round puckered mouth
  // the bell: a tall rounded cone, hollow underneath, flaring a little at the rim
  const flare = smooth(150, 141, p[1]) * 3;
  const bell = cap(p, [0, 150, 2], [0, 204, 2], 23 + flare, 15), hollow = cap(p, [0, 120, 2], [0, 176, 2], 19.5 + flare, 11);
  U(Math.max(bell, -hollow, 141 - p[1]), CAP(1), 3);
  // shaggy scales: rows of flakes lifting off and curling down
  { const a = Math.atan2(p[2] - 2, p[0]), row = (p[1] - 141) / 11, fr = row - Math.floor(row), col = a * 6.5 + Math.floor(row) * 1.9, fc = col - Math.floor(col);
    if (p[1] > 146 && p[1] < 214) bump(-smooth(0.42, 0.08, Math.abs(fc - 0.5)) * smooth(0.15, 0.9, fr) * 1.4); }
  if (p[1] > 141) P(-fbm(p[0] * 0.1, p[1] * 0.1, p[2] * 0.1) - 0.3, CAP(0.82), 0.1);
  P(smooth(160, 172, p[1]) * 2 - 1, mixP(INK2, CAP(0.45), 0.4), 0.4);   // darkening toward the rim
  P(p[1] - 152, INK, 4);
  // the ink: drips hanging off the rim
  for (let i = 0; i < 13; i++) { const ang = i * 0.483 + 0.3, r = 24.5 - (i % 3) * 0.8, L = (Math.sin(ang) > 0.45 ? 2.5 : 7) + (i * 7) % (Math.sin(ang) > 0.45 ? 3 : 12), x = Math.cos(ang) * r, z = 2 + Math.sin(ang) * r; U(cap(p, [x, 143, z], [x * 1.03, 142 - L, z * 1.03], 2.1, 1.3), INK, 1.5); U(sph(p, [x * 1.03, 141 - L, z * 1.03], 2.5), INK, 1.2); }
  S(p[1] - 110, 1);
  return getD();
}



// ---------------------------------------------------------------- BLIGHT RAT (Leaper)
// A sewer rat the mold got into: hunched, patchy, ribs showing through the fur, three long pale stalks bursting out of its
// back with lit tips, one eye gone to a knot of little caps. Four-footed (beast rig). About 110 high before scale.
const FUR = C(0x6a5c4c), FUR2 = C(0x4a3e32), FURD = C(0x2e261e), PINK = C(0xb48a7a), CLAW = C(0x2a2018);
export const BlightRat = {
  height: 100, beast: true,
  parts: [
    { role: 'LegBack', pivot: [-13, 36, -26], lo: [-34, -4, -56], hi: [4, 56, 0], h: 1.2, f: (p) => ratHind(p, -1) },
    { role: 'LegFront', pivot: [13, 36, -26], lo: [-4, -4, -56], hi: [34, 56, 0], h: 1.2, f: (p) => ratHind(p, 1) },
    { role: 'Body', pivot: [0, 38, 0], lo: [-34, 6, -62], hi: [34, 122, 42], h: 1.3, f: ratBody },
    { role: 'Tail', pivot: [0, 34, -42], lo: [-24, -4, -140], hi: [24, 48, -30], h: 1.1, f: ratTail, tris: 900 },
    { role: 'ArmBack', pivot: [-11, 34, 26], lo: [-28, -4, 6], hi: [4, 48, 48], h: 1.1, f: (p) => ratFore(p, -1) },
    { role: 'ArmFront', pivot: [11, 34, 26], lo: [-4, -4, 6], hi: [28, 48, 48], h: 1.1, f: (p) => ratFore(p, 1) },
    { role: 'Head', pivot: [0, 46, 32], lo: [-30, 22, 18], hi: [30, 74, 92], h: 1.1, f: ratHead },
  ],
};
function fur(p, k = 0.5) { bump(fbm(p[0] * 0.35, p[1] * 0.35, p[2] * 0.35) * k); }
function ratBody(p0) {
  const p = [p0[0], p0[1] + 12, p0[2]]; reset();
  U(ell(p, [0, 50, -6], [20, 19, 36]), FUR, 8); U(ell(p, [0, 60, -14], [17, 14, 26]), FUR2, 10);   // the body, the hunch
  U(ell(p, [0, 54, 20], [15, 15, 16]), FUR, 8);   // chest and shoulders
  U(ell(p, [0, 48, -30], [17, 17, 16]), FUR, 8);  // the haunches
  fur(p, 0.6);
  // ribs showing through a bald patch on the flank
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) U(cap(p, [s * 17, 58, 6 - i * 7], [s * 19.5, 44, 4 - i * 7], 1.7, 1.2), PINK, 1.6);
  P(ell(p, [17, 50, -4], [6, 12, 18]), PINK, 3); P(ell(p, [-17, 50, -4], [6, 12, 18]), PINK, 3);
  P(p[1] - 44, mixP(FUR, PINK, 0.4), 5);   // the belly paler
  // mold creeping over the back from where the stalks come out
  P(ell(p, [0, 68, -12], [16, 10, 22]) + fbm(p[0] * 0.15, p[1] * 0.15, p[2] * 0.15) * 6, mixP(CAP(0.8), FUR2, 0.2), 3);
  // the stalks: cordyceps bursting from the back, long and curving, each with a lit tip
  for (const [b, d, L, r] of [[[3, 70, -4], [0.25, 1, 0.15], 44, 2.6], [[-4, 70, -14], [-0.35, 1, -0.2], 52, 2.8], [[2, 66, -26], [0.2, 0.9, -0.55], 36, 2.3]]) {
    const pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push([b[0] + d[0] * L * t + Math.sin(t * 3) * 3, b[1] + d[1] * L * t, b[2] + d[2] * L * t + Math.sin(t * 2.4) * 2]); }
    chain(p, pts, r, r * 0.55, FLESH(0.95), 1.5);
    const tip = pts[6]; U(ell(p, [tip[0], tip[1] + 2.5, tip[2]], [r * 1.9, r * 2.6, r * 1.9]), CAP(1), 1); P(sph(p, [tip[0], tip[1] + 5, tip[2]], r * 1.5), GLOW(1), r * 0.4);
  }
  for (const [x, y, z, r] of [[6, 66, 6, 3.2], [-8, 64, -24, 2.8], [9, 62, -20, 2.4]]) sprout(p, [x, y, z], [x * 0.05, 1, 0.1], r * 1.3, r, false);
  return getD();
}
function ratHead(p0) {
  const p = [p0[0], p0[1] + 12, p0[2]]; reset();
  U(ell(p, [0, 59, 38], [13, 12, 14]), FUR, 5);
  U(cap(p, [0, 56, 42], [0, 50, 72], 10.5, 3.6), FUR, 5);   // the snout
  U(sph(p, [0, 50, 74], 3.2), PINK, 1.5);   // the nose
  fur(p, 0.35);
  // ears: round, thin, pink inside
  for (const s of [-1, 1]) { U(Math.max(ell(p, [s * 11, 71, 34], [7, 8, 2.4]), 0), FUR2, 2); U(ell(p, [s * 11, 71, 35.2], [5.2, 6, 1.3]), PINK, 1); }
  // incisors
  for (const s of [-1, 1]) U(cap(p, [s * 1.4, 48, 70], [s * 1.4, 42, 71.5], 1.4, 1.0), C(0xd8c070), 0.6);
  S(ell(p, [0, 46.5, 64], [5, 2, 8]), 1, GUM);
  // one eye lit; the other gone under a knot of little caps
  eye(p, [7.2, 61, 52], 2.3, [0.5, 0, 0.8]);
  sprout(p, [-7.5, 61, 50], [-0.8, 0.4, 0.5], 3, 3, true); sprout(p, [-6, 64, 47], [-0.5, 1, 0.2], 4, 2.6); sprout(p, [-9, 58, 46], [-1, 0, 0.2], 3, 2.2);
  P(ell(p, [-8, 61, 49], [5, 5, 5]), mixP(CAP(0.8), FUR2, 0.2), 2);
  S(p[2] - 22, 1, FUR);
  return getD();
}
function ratFore(p, s) {
  reset();
  U(ell(p, [s * 12, 33, 26], [6.5, 9, 7.5]), FUR, 4);
  chain(p, [[s * 12, 31, 26], [s * 13, 16, 31], [s * 13, 5, 30]], 4.6, 3.2, FUR2, 2);
  U(ell(p, [s * 13, 3, 33], [4.2, 2.6, 5]), PINK, 1.5);
  for (let i = -1; i <= 1; i++) chain(p, [[s * 13 + i * 2, 3, 36], [s * 13 + i * 2.6, 1.2, 39.5]], 1, 0.5, CLAW, 0.5);
  S(p[1] + 0.5, 1);
  return getD();
}
function ratHind(p, s) {
  reset();
  U(ell(p, [s * 14, 34, -26], [9, 13, 14]), FUR, 5);   // the haunch
  chain(p, [[s * 15, 28, -22], [s * 16, 15, -32], [s * 15, 6, -21]], 5.4, 3.6, FUR2, 2);
  U(ell(p, [s * 15, 3, -16], [4.6, 2.8, 9]), PINK, 1.5);
  for (let i = -1; i <= 1; i++) chain(p, [[s * 15 + i * 2.2, 3, -9], [s * 15 + i * 2.8, 1.2, -5]], 1, 0.5, CLAW, 0.5);
  S(p[1] + 0.5, 1);
  return getD();
}
function ratTail(p) {
  reset();
  // droops to the floor and trails along it in a lazy S
  const pts = []; for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push([Math.sin(t * 5.5) * 12 * t, Math.max(3.2 - t * 2.4, 32 - t * 70), -40 - t * 86]); }
  chain(p, pts, 4.2, 0.9, PINK, 1.2);
  { const t = along(p, [0, 32, -40], [0, 2, -126]); bump(Math.abs(Math.sin(t * 60)) < 0.25 ? 0.25 : 0); }
  P(sph(p, pts[3], 6), mixP(CAP(0.8), PINK, 0.3), 3);   // a patch of mold on it
  return getD();
}

// ---------------------------------------------------------------- DRIFTER (Flyer)
// A spore pod that floats: a bulging cap of a balloon with a ring of lit pores round its equator, frilled gills flaring
// underneath like a skirt, two lobed fins at its sides that ripple, and a lamprey mouth on a short stalk below, ringed with
// teeth. A trail of glowing hyphae hangs from it. About 110 high before scale; it hangs in the air, not on its feet.
export const Drifter = {
  height: 110,
  parts: [
    { role: 'Tail', pivot: [0, 40, 0], lo: [-26, -6, -26], hi: [26, 46, 26], h: 1.1, f: drifterTail, tris: 1500 },
    { role: 'Body', pivot: [0, 62, 0], lo: [-44, 36, -44], hi: [44, 112, 44], h: 1.4, f: drifterBody },
    { role: 'Head', pivot: [0, 50, 0], lo: [-24, 26, -24], hi: [24, 60, 30], h: 1.0, f: drifterHead, tris: 3000 },
  ],
};
function drifterBody(p) {
  reset();
  U(ell(p, [0, 80, 0], [33, 27, 33]), CAP(1), 4);
  U(ell(p, [0, 102, 0], [14, 9, 14]), CAP(0.85), 8);   // a knob on top
  { const [d1] = cells(p[0] * 0.14, p[1] * 0.14, p[2] * 0.14); bump(-Math.max(0, 0.28 - d1) * 1.6); }
  P(-fbm(p[0] * 0.08, p[1] * 0.08, p[2] * 0.08) - 0.25, CAP(0.8), 0.12);
  // pores round the bulge
  for (let i = 0; i < 9; i++) { const a = i * 0.698 + 0.2, y = 80 + Math.sin(i * 2.1) * 3; pore(p, [Math.cos(a) * 32.4, y, Math.sin(a) * 32.4], 2.6, [Math.cos(a), 0, Math.sin(a)]); }
  for (const s of [-1, 1]) eye(p, [s * 9, 76, 31], 3.2);
  // the skirt of gills: a frilled, scalloped ring flaring down and out under the pod
  { const rr = len(p[0], 0, p[2]), a = Math.atan2(p[2], p[0]), frill = Math.sin(a * 14) * 2.4, y0 = 62 - (rr - 20) * 0.55 + frill;
    U(Math.max(Math.abs(p[1] - y0) - 1.7, rr - (40 + Math.sin(a * 7) * 2.5), 18 - rr), FLESH(0.9), 2); }
  U(ell(p, [0, 62, 0], [24, 9, 24]), FLESH(0.85), 6);
  { const rr = len(p[0], 0, p[2]), a = Math.atan2(p[2], p[0]); if (p[1] < 70 && rr > 10) { const g = Math.abs(Math.sin(a * 20)); if (g < 0.3) bump(0.9); } }
  S(p[1] - 52, 1);
  return getD();
}
function drifterFin(p, s) {
  reset();
  // a lobed, rippled fin: thin, with ribs, lit at the edge
  const q = [p[0] - s * 30, p[1] - 78, p[2]], u = Math.abs(q[0]), ripple = Math.sin(q[2] * 0.25 + u * 0.12) * 2.2;
  const lobe = ell([u, q[1] - ripple, q[2]], [14, 0, 0], [17, 11, 15]);
  U(Math.max(lobe, Math.abs(q[1] - ripple - (u * 0.18)) - 1.6), mixP(CAP(0.85), FLESH(0.3), 0.3), 1.5);
  for (let i = -2; i <= 2; i++) U(cap(p, [s * 32, 78 + 0.2, i * 2], [s * 44, 78 + 2.4 + Math.abs(i), i * 5.5], 1.1, 0.5), FLESH(0.8), 1);
  for (const tz of [-8, 0, 8]) P(sph(p, [s * (30 + 30 - Math.abs(tz) * 0.5), 78 + 4 + Math.abs(tz) * 0.2, tz], 2.6), GLOW(1), 0.8);
  return getD();
}
function drifterHead(p) {
  reset();
  // a short stalk hanging under the pod, ending in a round, toothed mouth with a lit throat
  U(cap(p, [0, 56, 0], [0, 40, 3], 8.5, 10.5), FLESH(1), 3);
  U(ell(p, [0, 36, 4], [12, 8, 12]), FLESH(0.9), 3);
  S(ell(p, [0, 31, 5], [7.5, 6, 7.5]), 1.5, GUM); S(ell(p, [0, 34, 5], [4, 6, 4]), 1, GLOW(1));
  for (let i = 0; i < 10; i++) { const a = i * 0.628, x = Math.cos(a) * 7.5, z = 5 + Math.sin(a) * 7.5; U(cap(p, [x, 30.5, z], [x * 0.65, 32.5, 5 + (z - 5) * 0.65], 1.2, 0.3), TOOTH, 0.4); }
  return getD();
}
function drifterTail(p) {
  reset();
  for (let i = 0; i < 6; i++) { const a = i * 1.047 + 0.4, r = 9 + (i % 2) * 5, L = 26 + (i * 11) % 16; const b = [Math.cos(a) * r, 44, Math.sin(a) * r];
    const pts = []; for (let k = 0; k <= 5; k++) { const t = k / 5; pts.push([b[0] * (1 - t * 0.3) + Math.sin(t * 5 + i) * 2.5, b[1] - t * L, b[2] * (1 - t * 0.3) + Math.cos(t * 4 + i) * 2.5]); }
    chain(p, pts, 1.6, 0.7, MYC2, 1); U(sph(p, pts[5], 1.6), GLOW(1), 0.6); }
  return getD();
}

// ---------------------------------------------------------------- BRACKETBACK (Brute)
// A rotten stump that stood up: a great hunched barrel of bark, shelves of bracket fungus stacked up its back and over its
// shoulders in rings of the strain's colours, arms like fallen logs dragging knotted fists, a small sunk head with two lit
// holes for eyes under a shelf of a brow, and short stumps for legs. 240 high before scale (about 380 in the game).
const BARK = C(0x4e3e2e), BARK2 = C(0x3a2e22), BARKD = C(0x221a12), MOSS = C(0x4e5e2c), WOOD = C(0x8a6e4e);
export const Bracketback = {
  height: 240, budget: 1.5,
  parts: [
    { role: 'LegBack', pivot: [-26, 92, -8], lo: [-66, -4, -50], hi: [4, 110, 46], h: 2.0, f: (p) => bbLeg(p, -1) },
    { role: 'LegFront', pivot: [26, 92, -8], lo: [-4, -4, -50], hi: [66, 110, 46], h: 2.0, f: (p) => bbLeg(p, 1) },
    { role: 'Body', pivot: [0, 92, 0], lo: [-90, 66, -84], hi: [90, 236, 72], h: 2.2, f: bbBody },
    { role: 'ArmBack', pivot: [-58, 176, 8], lo: [-112, 2, -36], hi: [-30, 222, 80], h: 1.8, f: (p) => bbArm(p, -1) },
    { role: 'ArmFront', pivot: [58, 176, 8], lo: [30, 2, -36], hi: [112, 222, 80], h: 1.8, f: (p) => bbArm(p, 1) },
    { role: 'Head', pivot: [0, 176, 30], lo: [-40, 146, 8], hi: [40, 214, 76], h: 1.4, f: bbHead },
  ],
};
// a bracket shelf: a half-disc sticking out of the surface along `out`, ringed in bands, pored underneath
function shelf(p, at, out, R, th, tiltUp = 0.15) {
  const l = len(out[0], 0, out[2]) || 1, ox = out[0] / l, oz = out[2] / l;
  const q = [p[0] - at[0], p[1] - at[1], p[2] - at[2]], f = q[0] * ox + q[2] * oz, side = -q[0] * oz + q[2] * ox, y = q[1] - f * tiltUp;
  const d = Math.max(ell([f, y, side], [R * 0.35, 0, 0], [R, th, R * 1.1]), -f - 1);
  U(d, CAP(1), 2);
  if (d < 3) { const rr = len(f - 0, 0, side), band = Math.sin(rr * 0.55); P(-band - 0.2, CAP(0.72), 0.25); P(-y - th * 0.35, FLESH(0.9), 1.5); if (y > th * 0.2) bump(Math.abs(Math.sin(rr * 0.55)) < 0.2 ? 0.5 : 0); }
}
function bark(p, k = 1.2) { const a = Math.atan2(p[2], p[0]); bump((Math.abs(Math.sin(a * 11 + fbm(p[0] * 0.02, p[1] * 0.02, p[2] * 0.02) * 4 + p[1] * 0.01)) < 0.16 ? 1 : 0) * k + fbm(p[0] * 0.1, p[1] * 0.1, p[2] * 0.1) * 0.6); }
function bbBody(p) {
  reset();
  U(ell(p, [0, 150, -8], [52, 62, 42]), BARK, 12);   // the barrel of the trunk, leaning forward
  U(ell(p, [0, 182, 4], [64, 30, 40]), BARK, 16);    // the shoulders
  U(ell(p, [0, 106, -6], [42, 26, 34]), BARK2, 12);  // the hips
  bark(p, 1.6);
  // the trunk's rotten heart, split open down the front
  S(cap(p, [4, 120, 34], [-2, 165, 38], 6, 3), 3, BARKD); P(cap(p, [4, 120, 34], [-2, 165, 38], 10, 7), mixP(WOOD, CAP(0.3), 0.2), 3);
  // moss on the shoulders
  P(fbm(p[0] * 0.05, p[1] * 0.05, p[2] * 0.05) * 30 + (196 - p[1]) * 0.6 - 4, MOSS, 6);
  // shelves stacked up the back and over the shoulders
  for (const [x, y, z, ox, oz, R, th] of [[0, 196, -36, 0, -1, 30, 6], [-26, 176, -38, -0.5, -1, 26, 5.5], [24, 170, -38, 0.6, -1, 28, 5.5], [-10, 150, -44, -0.2, -1, 24, 5], [16, 132, -40, 0.4, -1, 22, 4.6], [-46, 206, -6, -1, -0.3, 22, 5], [46, 210, -2, 1, -0.2, 24, 5], [-30, 120, -34, -0.7, -0.8, 18, 4], [0, 222, -14, 0, -1, 20, 4.4]])
    shelf(p, [x, y, z], [ox, 0, oz], R, th);
  for (const [x, y, z] of [[-14, 214, -26], [30, 196, -34], [-36, 162, -40], [8, 166, -46]]) sprout(p, [x, y, z], [x * 0.01, 0.8, -0.6], 9, 5.5, true);
  return getD();
}
function bbHead(p) {
  reset();
  U(ell(p, [0, 176, 44], [22, 20, 20]), BARK, 8); bark(p, 0.8);
  // the brow: a shelf over the eyes; eyes deep in hollows; a split of a mouth with splinter teeth
  shelf(p, [0, 190, 52], [0, 0, 1], 18, 4.2, 0.05);
  for (const s of [-1, 1]) { S(sph(p, [s * 8, 180, 60], 5.5), 2, BARKD); U(sph(p, [s * 8, 180, 58], 3.2), GLOW(1), 0.6); }
  S(ell(p, [0, 165, 60], [12, 4, 8]), 2, GUM);
  for (let i = -3; i <= 3; i++) { U(cap(p, [i * 3.4, 168.5, 59], [i * 3.4 + 0.5, 163.5 - (i & 1) * 1.5, 60], 1.3, 0.3), WOOD, 0.4); }
  S(p[2] - 26, 2);
  return getD();
}
function bbArm(p, s) {
  reset();
  const sh = [s * 60, 178, 6], el = [s * 76, 112, 22], wr = [s * 74, 50, 34];
  U(sph(p, sh, 20), BARK, 8);
  U(cap(p, sh, el, 18, 16), BARK, 8); U(cap(p, el, wr, 17, 19), BARK2, 8); bark(p, 1.0);
  // the fist: a burl of root and wood, knuckled
  U(ell(p, [wr[0], 32, wr[2] + 4], [22, 20, 22]), BARK2, 8);
  for (let i = 0; i < 4; i++) { const x = wr[0] + s * (i - 1.5) * 7.5; U(sph(p, [x, 20, wr[2] + 20], 7.5), BARK, 4); }
  rootlets(p, [wr[0], 18, wr[2] + 8], [s * 0.3, -0.5, 0.6], 4, 16, 2.2, s > 0 ? 3 : 7, ROOT2);
  shelf(p, [s * 66, 196, -6], [s, 0, -0.4], 18, 4.4);   // a shelf on the shoulder
  P(fbm(p[0] * 0.05, p[1] * 0.05, p[2] * 0.05) * 30 + (190 - p[1]) * 0.5 - 6, MOSS, 6);
  S(p[1] - 6, 2);
  return getD();
}
function bbLeg(p, s) {
  reset();
  U(cap(p, [s * 26, 100, -8], [s * 30, 30, 0], 24, 22), BARK2, 8); bark(p, 1.0);
  U(ell(p, [s * 30, 14, 6], [28, 16, 30]), BARK, 10);
  for (const [ax, az, l] of [[-0.6, 1, 26], [0.1, 1, 30], [0.7, 0.7, 24], [0.2, -1, 18]]) { const dx = ax * s; rootFinger(p, [[s * 30, 12, 6 + az * 10], [s * 30 + dx * l * 0.6, 6, 6 + az * l * 0.7], [s * 30 + dx * l, 1.4, 6 + az * l]], 7, ROOT2); }
  S(p[1] + 0.5, 1); P(p[1] - 16, ROOTD, 8);
  return getD();
}

// ---------------------------------------------------------------- SHRIEKER (Screamer)
// A tall funnel of a mushroom whose cap opens upward like a horn: the throat inside lit and ribbed with gills, the rim
// frilled and torn. It screams through it and the others come. Thin tendril arms, a stalk rooted in a splayed base, two
// small eyes on the stalk under the funnel. About 220 high.
export const Shrieker = {
  height: 220,
  parts: [
    { role: 'LegBack', pivot: [-16, 48, 0], lo: [-56, -4, -44], hi: [4, 60, 44], h: 1.5, f: (p) => { reset(); rootLeg(p, [-16, 52, 0], [-22, 28, 4], [-24, 9, 0], 11, 8, [[-0.6, 0.8, 22], [-0.1, 1, 22], [0.5, 0.9, 18], [-0.3, -1, 18]], -1); return getD(); } },
    { role: 'LegFront', pivot: [16, 48, 0], lo: [-4, -4, -44], hi: [56, 60, 44], h: 1.5, f: (p) => { reset(); rootLeg(p, [16, 52, 0], [22, 28, 4], [24, 9, 0], 11, 8, [[-0.6, 0.8, 22], [-0.1, 1, 22], [0.5, 0.9, 18], [-0.3, -1, 18]], 1); return getD(); } },
    { role: 'Body', pivot: [0, 50, 0], lo: [-36, 34, -36], hi: [36, 166, 40], h: 1.4, f: shriekerBody },
    { role: 'ArmBack', pivot: [-15, 130, 2], lo: [-64, 40, -30], hi: [-4, 140, 50], h: 1.2, f: (p) => shriekerArm(p, -1), tris: 1200 },
    { role: 'ArmFront', pivot: [15, 130, 2], lo: [4, 40, -30], hi: [64, 140, 50], h: 1.2, f: (p) => shriekerArm(p, 1), tris: 1200 },
    { role: 'Head', pivot: [0, 150, 4], lo: [-60, 128, -40], hi: [60, 242, 76], h: 1.5, f: shriekerHead, tris: 8000 },
  ],
};
function shriekerBody(p) {
  reset();
  U(ell(p, [0, 56, 0], [22, 14, 20]), FLESH(0.95), 6);
  U(cap(p, [0, 56, 0], [0, 162, 4], 15, 11), FLESH(1), 6); fibres(p, [0, 0, 0], 16, 0.5);
  { const rr = len(p[0], 0, p[2] - 2), y0 = 112 - (rr - 12) * 0.6; U(Math.max(Math.abs(p[1] - y0) - 1.7, rr - (24 + Math.sin(Math.atan2(p[2], p[0]) * 5) * 3), 11 - rr), FLESH(0.85), 1.5); }
  for (const s of [-1, 1]) U(ell(p, [s * 12, 129, 2], [5, 4.5, 5]), ROOT, 3);
  for (const s of [-1, 1]) eye(p, [s * 5, 146, 11.6], 2.4);   // two small eyes on the stalk under the funnel
  sprout(p, [8, 84, -12], [0.5, 0.4, -1], 7, 4.4, true); sprout(p, [-6, 96, -12], [-0.5, 0.5, -1], 6, 3.6);
  mold(p, 70, 150);
  return getD();
}
function shriekerHead(p) {
  reset();
  U(cap(p, [0, 140, 4], [0, 166, 6], 10.5, 13), FLESH(1), 4);
  // the funnel, tipped forward: a cone opening up, its wall thin, its rim frilled
  const q = rotX(p, [0, 160, 4], -0.42), dy = q[1] - 160, rr = len(q[0], 0, q[2] - 4), a = Math.atan2(q[2] - 4, q[0]);
  const R0 = (y) => 9 + y * 0.56 + Math.max(0, y - 40) * 0.22, R = R0(dy), frill = Math.sin(a * 9) * 2.6 + Math.sin(a * 23) * 0.9;
  const wall = Math.max(Math.abs(rr - R) - 2.4, -dy - 1, dy - (54 + frill));
  U(wall, CAP(1), 2);
  // gills down the inside, lit deep in the throat
  if (rr < R && dy > 0) { const g = Math.abs(Math.sin(a * 16)); if (g < 0.35) bump(0.9 * smooth(R - 3, R, rr)); }
  P(rr - R + 0.5 + Math.max(0, 30 - dy) * -0.2, FLESH(0.75), 1.4);
  P(Math.max(dy - 24, rr - R + 1.2), GLOW(1), 4);
  for (let i = 0; i < 12; i++) { const ta = i * 0.5236, x = Math.cos(ta) * (R0(26) - 2.5), z = 4 + Math.sin(ta) * (R0(26) - 2.5), b = rotX([x, 160 + 26, z], [0, 160, 4], 0.42), t2 = rotX([x * 0.72, 160 + 23, 4 + (z - 4) * 0.72], [0, 160, 4], 0.42); U(cap(p, b, t2, 1.6, 0.35), TOOTH, 0.5); }
  P(-(dy - 46), CAP(0.7), 4);
  // tears in the rim
  for (const ta of [0.9, 2.6, 4.4]) S(sph(q, [Math.cos(ta) * (R0(52) + 1), 160 + 53, 4 + Math.sin(ta) * (R0(52) + 1)], 6.5), 2, CAP(0.7));
  return getD();
}
function shriekerArm(p, s) {
  reset();
  // a long tendril, wavy, ending in a tuft of hyphae
  const pts = []; for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push([s * (15 + t * 22 + Math.sin(t * 6) * 4), 130 - t * 72, 2 + t * 20 + Math.cos(t * 5) * 4]); }
  chain(p, pts, 4.2, 2.2, ROOT, 2);
  const e = pts[8]; for (let i = 0; i < 5; i++) { const a = i * 1.25; chain(p, [e, [e[0] + Math.cos(a) * 5, e[1] - 10, e[2] + Math.sin(a) * 5 + 3], [e[0] + Math.cos(a) * 7, e[1] - 18, e[2] + Math.sin(a) * 7 + 5]], 1.2, 0.4, MYC2, 0.6); }
  P(sph(p, pts[0], 9), FLESH(0.6, 0x221810), 5);
  return getD();
}



// ---------------------------------------------------------------- SHELFSHIELD (Shield)
// A Rotcap that grew a shield: the same stalk and roots, but its cap has spread into a fan of stacked shelves, and one
// arm has fused into a great round bracket held in front of it, banded and thick as a door. ~215 high before scale.
export const Shelfshield = {
  height: 215,
  parts: [
    { role: 'LegBack', pivot: [-17, RC.hipY, 0], lo: [-48, -4, -34], hi: [10, 80, 40], h: 1.6, f: (p) => rotcapLeg(p, -1) },
    { role: 'LegFront', pivot: [17, RC.hipY, 0], lo: [-10, -4, -34], hi: [48, 80, 40], h: 1.6, f: (p) => rotcapLeg(p, 1) },
    { role: 'Body', pivot: [0, RC.hipY, 0], lo: [-46, 40, -40], hi: [46, 162, 46], h: 1.5, f: rotcapBody },
    { role: 'ArmBack', pivot: [-RC.sh, 122, 4], lo: [-62, 20, -30], hi: [-8, 132, 48], h: 1.5, f: (p) => rotcapArm(p, -1) },
    { role: 'ArmFront', pivot: [RC.sh, 122, 4], lo: [-34, 30, -10], hi: [66, 150, 70], h: 1.5, f: shieldArm, tris: 5000 },
    { role: 'Head', pivot: RC.neck, lo: [-60, 116, -50], hi: [60, 220, 60], h: 1.6, f: shelfHead },
  ],
};
function shieldArm(p) {
  reset();
  const sh = [25, 122, 4], el = [36, 98, 22];
  chain(p, [sh, [33, 110, 12], el], 6.5, 6, ROOT, 3); U(sph(p, el, 7), ROOT, 3);
  chain(p, [el, [30, 90, 36], [22, 88, 44]], 6, 6.5, ROOT2, 3);
  // the shield: a thick, round-topped bracket standing in front, its face banded in rings round where the arm grows in
  const q = [p[0] - 14, p[1] - 92, p[2] - 50], d = Math.max(ell(q, [0, 0, 0], [33, 46, 7]), -q[1] - 40);
  U(d, CAP(1), 3);
  { const rr = len(q[0], q[1] + 30, 0); P(-Math.sin(rr * 0.36) - 0.25, CAP(0.74), 0.35); P(rr - 8, mixP(CAP(0.55), C(0x1a120a), 0.3), 3); P(q[2] + 3, FLESH(0.85), 2); }
  // a lip of pored flesh round the rim, and a few small brackets growing off its edge
  P(0.9 - len(q[0] / 33, Math.max(q[1], -40) / 46, 0), FLESH(0.9), 0.03);
  for (const [x, y, ox] of [[-30, 106, -1], [32, 82, 1], [-24, 66, -1]]) shelf(p, [14 + x * 0.95, y, 50], [ox, 0, -0.2], 11, 3, 0.1);
  P(sph(p, sh, 12), FLESH(0.6, 0x221810), 6);
  return getD();
}
function shelfHead(p) {
  reset();
  U(cap(p, [0, 124, 4], [0, 160, 6], 17, 18), FLESH(1), 6); fibres(p, [0, 0, 6], 16, 0.45);
  // a fan of shelves instead of a cap: stacked, overlapping, the top one widest
  for (const [y, R, th, z, x, tl] of [[174, 46, 7, 2, -3, 0.08], [162, 36, 6, -6, 6, -0.1], [188, 29, 6, 4, 4, 0.14], [153, 28, 5, -10, -8, 0.05]]) {
    const q = rotZ([p[0] - x, p[1] - y, p[2] - z], [0, 0, 0], tl), rr = len(q[0], 0, q[2]), a = Math.atan2(q[2], q[0]), edge = R * (1 + Math.sin(a * 5 + y) * 0.06), droop = (rr / R) * (rr / R) * 6;
    const d = ell([q[0], q[1] + droop, q[2]], [0, 0, 0], [edge, th, edge * 0.95]);
    U(d, CAP(1), 3);
    if (d < 3) { P(-Math.sin(rr * 0.5 + y) - 0.2, CAP(0.74), 0.25); P(q[1] + droop + th * 0.3, FLESH(0.85), 1.5); }
  }
  for (const s of [-1, 1]) eye(p, [s * 8.5, 144, 21], 2.8);
  U(ell(p, [0, 148, 20], [15, 3, 4.5]), FLESH(0.9), 3);
  S(ell(p, [0, 133, 21], [11, 4.6, 8]), 1.5, GUM);
  for (let i = -4; i <= 4; i++) { const x = i * 2.5, l = 3 + (i & 1) * 1.5; U(cap(p, [x, 137, 19.8], [x, 137 - l, 21], 1, 0.3), TOOTH, 0.4); }
  S(p[1] - 119, 1.5);
  return getD();
}

// ---------------------------------------------------------------- SPORECALLER (Priest)
// Tall and solemn: a veiled lady. A pitted, honeycombed cone of a head like a mitre, a long lace veil of net hanging from
// under it to the floor, and in one hand a censer on a chain, a lit pod swinging with spores. It calls the others on.
export const Sporecaller = {
  height: 235,
  parts: [
    { role: 'LegBack', pivot: [-12, 60, 0], lo: [-36, -4, -30], hi: [6, 70, 36], h: 1.4, f: (p) => { reset(); rootLeg(p, [-12, 64, 0], [-14, 34, 5], [-12, 10, 1], 8, 6.5, [[-0.35, 1, 15], [0.05, 1, 18], [0.45, 0.9, 14]], -1); return getD(); } },
    { role: 'LegFront', pivot: [12, 60, 0], lo: [-6, -4, -30], hi: [36, 70, 36], h: 1.4, f: (p) => { reset(); rootLeg(p, [12, 64, 0], [14, 34, 5], [12, 10, 1], 8, 6.5, [[-0.35, 1, 15], [0.05, 1, 18], [0.45, 0.9, 14]], 1); return getD(); } },
    { role: 'Body', pivot: [0, 60, 0], lo: [-52, 16, -52], hi: [52, 182, 52], h: 1.7, f: callerBody, tris: 9000, ao: 0.5 },
    { role: 'ArmBack', pivot: [-16, 160, 2], lo: [-50, 70, -24], hi: [-2, 168, 44], h: 1.3, f: (p) => { reset(); rootArm(p, [-16, 160, 2], [-24, 132, 8], [-25, 106, 16], 5, 4, 20, -1); return getD(); } },
    { role: 'ArmFront', pivot: [16, 160, 2], lo: [2, 20, -24], hi: [56, 168, 60], h: 1.3, f: callerArm, tris: 3200 },
    { role: 'Head', pivot: [0, 168, 3], lo: [-34, 150, -34], hi: [34, 246, 38], h: 1.3, f: callerHead, tris: 7000 },
  ],
};
function callerBody(p) {
  reset();
  U(cap(p, [0, 58, 0], [0, 176, 3], 13, 10.5), FLESH(1), 6); fibres(p, [0, 0, 0], 14, 0.4);
  for (const s of [-1, 1]) U(ell(p, [s * 13, 158, 2], [5.5, 4.6, 5.5]), ROOT, 3);
  // the veil: a lace skirt from the shoulders to the floor, flaring, its net of holes
  const rr = len(p[0], 0, p[2] - 2), a = Math.atan2(p[2] - 2, p[0]), t = clamp((170 - p[1]) / 150, 0, 1), R = 15 + t * 30 + Math.sin(a * 8 + t * 3) * 3 * t;
  let veil = Math.max(Math.abs(rr - R) - 2.2, p[1] - 170, 22 - p[1] + Math.sin(a * 6) * 4);
  U(veil, FLESH(1), 1.2);
  // a diamond lace: raised bars, the spaces between sunk and dark (a solid veil that reads as net)
  { const u = a * R, v = p[1], net = Math.min(Math.abs(Math.sin((u + v) * 0.3)), Math.abs(Math.sin((u - v) * 0.3))); if (Math.abs(rr - R) < 4 && p[1] < 168) { bump(smooth(0.2, 0.5, net) * 0.9); P(0.42 - net, mixP(FLESH(0.8), C(0x1c1410), 0.25), 0.3); } }
  P(-(p[1] - 30) * 0.1 - 1, mixP(FLESH(0.6), CAP(0.3), 0.3), 1.5);   // dirtied at the hem
  return getD();
}
function callerHead(p) {
  reset();
  U(cap(p, [0, 160, 3], [0, 186, 3], 10, 11), FLESH(1), 4);
  // the face, just under the cone
  for (const s of [-1, 1]) eye(p, [s * 4.6, 178, 11.3], 1.9);
  S(ell(p, [0, 171.5, 11], [3.6, 1.8, 3]), 1, GUM);
  // the morel: a tall pitted cone, the ridges between the pits in the cap colour, the pits darker
  const q = [p[0], p[1] - 184, p[2] - 3], k = Math.max(0, q[1]) / 58, r = 21 * (1 - k * 0.78) + 2;
  let d = Math.max(len(q[0], 0, q[2]) - r, -q[1], q[1] - 58);
  d = Math.min(d, sph(p, [0, 184 + 58, 3], 4));
  // pits between ridges, like a morel: the ridges in the cap colour, the pits sunk and dark
  let pit = 0; { const a = Math.atan2(q[2], q[0]), [d1, d2] = cells(a * 2.6 + 9, q[1] * 0.12, 0.5); pit = smooth(0.06, 0.2, d2 - d1); if (q[1] > 1 && q[1] < 57) d += pit * 3.2 * smooth(0, 6, q[1]); }
  U(d, CAP(1), 2);
  if (q[1] > 1) P(0.5 - pit, mixP(CAP(0.42), C(0x140c08), 0.45), 0.15);
  S(p[1] - 150, 1);
  return getD();
}
function callerArm(p) {
  reset();
  rootArm(p, [16, 160, 2], [26, 134, 14], [28, 112, 28], 5, 3, 12, 1, 0.5);
  // the censer: a chain from the hand down to a lit pod with slits, a little cap on top
  const top = [30, 104, 32], pod = [32, 58, 34];
  for (let i = 0; i < 9; i++) { const y = top[1] - i * 5.2; U(torus(rotX(p, [top[0], y, top[2]], (i & 1) * 1.57), [top[0], y, top[2]], 2.1, 0.7), C(0x3a3a34), 0.3); }
  U(ell(p, pod, [9, 11, 9]), C(0x5a4a2a), 2); U(ell(p, [pod[0], pod[1] + 9, pod[2]], [7.5, 3.5, 7.5]), CAP(1), 1.5);
  for (let i = 0; i < 6; i++) { const a = i * 1.047; S(cap(p, [pod[0] + Math.cos(a) * 9, pod[1] - 5, pod[2] + Math.sin(a) * 9], [pod[0] + Math.cos(a) * 9, pod[1] + 5, pod[2] + Math.sin(a) * 9], 1.6), 1, GLOW(1)); }
  P(ell(p, pod, [6, 8, 6]) + 1, GLOW(1), 1);
  return getD();
}

// ---------------------------------------------------------------- GOLDEN TRUFFLE (Gilded)
// The one worth chasing: a plump, knobbled truffle gone gold, with a wide greedy grin, two little lit eyes, short legs that
// run very fast, stubby arms, and a sprig of caps on top. Gold whatever the strain (only its eyes take the strain's light).
const GOLD = C(0xeab838), GOLD2 = C(0xc08a26), GOLDD = C(0x6e4a14), GOLDL = C(0xffe08a);
export const GoldenTruffle = {
  height: 160,
  parts: [
    { role: 'LegBack', pivot: [-18, 46, 0], lo: [-44, -4, -30], hi: [0, 60, 36], h: 1.3, f: (p) => { reset(); rootLeg(p, [-18, 50, 0], [-20, 28, 6], [-18, 9, 2], 9, 7, [[-0.4, 1, 14], [0.1, 1, 16], [0.5, 0.8, 13]], -1, GOLD2, GOLD2); return getD(); } },
    { role: 'LegFront', pivot: [18, 46, 0], lo: [0, -4, -30], hi: [44, 60, 36], h: 1.3, f: (p) => { reset(); rootLeg(p, [18, 50, 0], [20, 28, 6], [18, 9, 2], 9, 7, [[-0.4, 1, 14], [0.1, 1, 16], [0.5, 0.8, 13]], 1, GOLD2, GOLD2); return getD(); } },
    { role: 'Body', pivot: [0, 48, 0], lo: [-60, 30, -58], hi: [60, 150, 62], h: 1.5, f: truffleBody, tris: 8000 },
    { role: 'ArmBack', pivot: [-44, 98, 12], lo: [-74, 50, -10], hi: [-30, 106, 46], h: 1.2, f: (p) => { reset(); rootArm(p, [-44, 98, 12], [-54, 84, 22], [-56, 72, 30], 5.5, 3, 12, -1, 0.5); return getD(); } },
    { role: 'ArmFront', pivot: [44, 98, 12], lo: [30, 50, -10], hi: [74, 106, 46], h: 1.2, f: (p) => { reset(); rootArm(p, [44, 98, 12], [54, 84, 22], [56, 72, 30], 5.5, 3, 12, 1, 0.5); return getD(); } },
    { role: 'Head', pivot: [0, 136, 0], lo: [-30, 126, -30], hi: [30, 176, 30], h: 1.1, f: truffleHead, tris: 2400 },
  ],
};
function truffleBody(p) {
  reset();
  U(ell(p, [0, 92, 0], [50, 48, 48]), GOLD, 4);
  // knobbled all over: each cell a raised wart, the cracks between dark
  { const [d1, d2] = cells(p[0] * 0.055, p[1] * 0.055, p[2] * 0.055); bump(-smooth(0.0, 0.45, d2 - d1) * 4.2); P(0.07 - (d2 - d1), mixP(GOLD2, GOLDD, 0.4), 0.06); P(0.42 - (d2 - d1) - (p[1] - 100) * 0.012, GOLDL, 0.18); }
  // the grin and the eyes
  S(Math.max(ell(p, [0, 84, 46], [24, 9, 12]), -ell(p, [0, 92, 48], [26, 10, 14])), 2, GUM);
  for (let i = -6; i <= 6; i++) { const x = i * 3.4, a = Math.abs(i) / 7; U(cap(p, [x, 90 - a * a * 6, 46.5 - a * 7], [x, 85.5 - a * a * 6, 49 - a * 7], 1.7, 0.6), C(0xfff2c8), 0.5); U(cap(p, [x + 1.7, 77 - a * a * 2, 45 - a * 7], [x + 1.7, 81 - a * a * 2, 47.5 - a * 7], 1.5, 0.5), C(0xfff2c8), 0.5); }
  for (const s of [-1, 1]) eye(p, [s * 12, 106, 44.5], 3.4);
  return getD();
}
function truffleHead(p) {
  reset();
  U(ell(p, [0, 134, 0], [20, 10, 20]), GOLD2, 6);
  sprout(p, [0, 140, 0], [0, 1, 0.1], 12, 7, true); sprout(p, [-8, 138, 4], [-0.5, 1, 0.3], 8, 5); sprout(p, [8, 138, -4], [0.5, 1, -0.3], 9, 5.5, true);
  S(p[1] - 128, 1);
  return getD();
}

// ---------------------------------------------------------------- ROOTWORM (Burrower)
// A rhizomorph as thick as a barrel that comes up through the floor: ringed segments furred with root hairs, curving up and
// over, and at its end a round mouth like a lamprey's, rings of rootlet teeth round a lit gullet, a ruff of little caps
// behind it. Only the front of it is ever above ground. ~120 high.
export const Rootworm = {
  height: 120,
  parts: [
    { role: 'Body', pivot: [0, 0, 0], lo: [-56, -6, -64], hi: [56, 100, 60], h: 1.7, f: wormBody, tris: 7000 },
    { role: 'Head', pivot: [0, 88, 26], lo: [-40, 60, 0], hi: [40, 130, 80], h: 1.4, f: wormHead, tris: 7000 },
  ],
};
const WPTS = [[0, -6, -30], [0, 24, -24], [0, 56, -10], [0, 80, 8], [0, 92, 28]];
function wormBody(p) {
  reset();
  chainSeg(p, WPTS.slice(0, 5), 24, 20);
  // the broken floor round where it came up: a ring of upturned earth and stones
  { const rr = len(p[0], 0, p[2] + 28); U(Math.max(Math.abs(p[1] - 4 + (rr - 34) * 0.15) - 4 - Math.sin(Math.atan2(p[2] + 28, p[0]) * 7) * 2, rr - 52, 26 - rr), C(0x3a2c1e), 4); }
  for (let i = 0; i < 7; i++) { const a = i * 0.9 + 0.3, r = 40 + (i % 3) * 5; U(box(rotY(p, [Math.cos(a) * r, 6, -28 + Math.sin(a) * r], a), [Math.cos(a) * r, 6, -28 + Math.sin(a) * r], [6 + i % 3, 4 + i % 2 * 2, 5], 2), C(0x4a4a44), 1.5); }
  S(p[1] + 2, 1);
  return getD();
}
// ringed segments along a chain: each ring a slight bulge, root hairs between
function chainSeg(p, pts, r0, r1) {
  chain(p, pts, r0, r1, CAP(0.85), 6);
  let best = 1e9, t = 0; for (let i = 0; i < pts.length - 1; i++) { const d = cap(p, pts[i], pts[i + 1], 1); if (d < best) { best = d; t = (i + along(p, pts[i], pts[i + 1])) / (pts.length - 1); } }
  bump(-Math.max(0, Math.cos(t * 50)) * 1.8);
  P(0.2 - Math.cos(t * 50), mixP(CAP(0.9), FLESH(0.15), 0.2), 0.35); P(Math.cos(t * 50) - 0.75, mixP(CAP(0.55), C(0x1a120a), 0.3), 0.2);
  P(0.3 - fbm(p[0] * 0.1, p[1] * 0.1, p[2] * 0.1), mixP(FLESH(0.6), C(0x2a2216), 0.4), 0.2);
  { const [d1] = cells(p[0] * 0.3, p[1] * 0.3, p[2] * 0.3); if (d1 < 0.08 && Math.cos(t * 50) < 0) bump(-1.2); }   // root hairs as stubble
}
function wormHead(p) {
  reset();
  chainSeg(p, [[0, 80, 8], [0, 92, 28], [0, 96, 44]], 20, 22);
  // the mouth: a round open end facing forward and a little down, rings of teeth, a lit throat
  const m = [0, 95, 58];
  U(torus(rotX(p, m, 1.35), m, 18, 5.5), CAP(0.9), 4);
  S(cap(p, [0, 96, 40], [0, 93, 70], 15, 16), 3, GUM);
  P(sph(p, [0, 96, 40], 12), GLOW(1), 4);
  for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 14; i++) { const a = i * 0.4488 + ring * 0.22, r = 14.5 - ring * 4, z = 56 - ring * 6; const b = [Math.cos(a) * r, 95 + Math.sin(a) * r, z], tip = [Math.cos(a) * r * 0.62, 95 + Math.sin(a) * r * 0.62, z - 5]; U(cap(p, b, tip, 1.6, 0.35), TOOTH, 0.4); }
  // a ruff of little caps behind the mouth, some lit
  for (let i = 0; i < 9; i++) { const a = i * 0.698, b = [Math.cos(a) * 21, 94 + Math.sin(a) * 21, 42]; sprout(p, b, [Math.cos(a), Math.sin(a), -0.6], 6, 4.2, i % 3 === 0); }
  S(p[2] - 6, 2);
  return getD();
}

// ---------------------------------------------------------------- SPORE POD (Totem)
// A clutch of fruiting pods on a mat of mycelium, swelling and splitting along lit seams; sporelings come out of it.
export const SporePod = {
  height: 64,
  parts: [
    { role: 'Body', pivot: [0, 0, 0], lo: [-56, -4, -56], hi: [56, 70, 56], h: 1.4, f: podBody, tris: 8000 },
    { role: 'Head', pivot: [0, 30, 0], lo: [-24, 24, -24], hi: [24, 82, 24], h: 1.1, f: podHead, tris: 3000 },
  ],
};
function pod(p, c, r, h, seed) {
  const e = ell(p, c, [r, h, r]);
  U(e, CAP(1), 4);
  if (e < 3) P(-fbm(p[0] * 0.1, p[1] * 0.1, p[2] * 0.1) - 0.3, CAP(0.78), 0.12);
  // seams splitting from the top down the sides, lit inside: grooves only a few deep, not cuts through
  const a = Math.atan2(p[2] - c[2], p[0] - c[0]), rr = len(p[0] - c[0], 0, p[2] - c[2]);
  for (let i = 0; i < 3; i++) { const sa = seed + i * 2.09, d = Math.abs(Math.sin((a - sa) * 0.5)) * rr * 2 - 1.3; if (p[1] > c[1] - h * 0.35) S(Math.max(d, -ell(p, c, [r - 3, h - 3, r - 3])), 1, GLOW(1)); }
}
function podBody(p) {
  reset();
  // the mat: a low, lumpy disc of mycelium with threads running out
  U(ell(p, [0, 2, 0], [46, 8, 44]), MYC2, 6); bump(fbm(p[0] * 0.2, p[1] * 0.2, p[2] * 0.2) * 1.2);
  for (let i = 0; i < 8; i++) { const a = i * 0.785 + 0.2; chain(p, [[Math.cos(a) * 30, 3, Math.sin(a) * 30], [Math.cos(a + 0.2) * 44, 2, Math.sin(a + 0.2) * 44], [Math.cos(a) * 54, 1, Math.sin(a) * 54]], 2, 0.8, MYC, 1.5); }
  pod(p, [-18, 20, 8], 15, 18, 0.4); pod(p, [16, 16, -10], 13, 15, 1.7); pod(p, [14, 13, 18], 10, 11, 2.9); pod(p, [-12, 12, -18], 9, 10, 4.2);
  S(p[1] + 1.5, 1);
  return getD();
}
function podHead(p) {
  reset();
  pod(p, [0, 46, 0], 16, 24, 0.9);
  U(cap(p, [0, 28, 0], [0, 36, 0], 10, 12), MYC2, 4);
  S(p[1] - 27, 1);
  return getD();
}

// ---------------------------------------------------------------- GRASPING MYCEL (Totem)
// A braid of mycelium thick as a man rising out of a mat, swaying, hooked at the top into a claw of hyphae, little caps
// growing up its length and a few lit pores along it. ~140 high before scale.
export const GraspingMycel = {
  height: 140,
  parts: [
    { role: 'Body', pivot: [0, 0, 0], lo: [-56, -4, -56], hi: [56, 84, 56], h: 1.5, f: mycelBody, tris: 7000 },
    { role: 'Head', pivot: [0, 70, 0], lo: [-40, 62, -36], hi: [40, 160, 50], h: 1.3, f: mycelHead, tris: 7000 },
  ],
};
function braid(p, pts, r) {
  for (let s = 0; s < 3; s++) { const ph = s * 2.094, q = pts.map((c, i) => [c[0] + Math.cos(ph + i * 1.3) * r * 0.55, c[1], c[2] + Math.sin(ph + i * 1.3) * r * 0.55]); chain(p, q, r * 0.6, r * 0.42, [CAP(0.85), FLESH(0.9), MYC2][s], r * 0.25); }
}
function mycelBody(p) {
  reset();
  U(ell(p, [0, 2, 0], [44, 8, 42]), MYC2, 6); bump(fbm(p[0] * 0.2, p[1] * 0.2, p[2] * 0.2) * 1.2);
  for (let i = 0; i < 9; i++) { const a = i * 0.7; chain(p, [[Math.cos(a) * 20, 3, Math.sin(a) * 20], [Math.cos(a + 0.3) * 40, 2, Math.sin(a + 0.3) * 40], [Math.cos(a) * 54, 1, Math.sin(a) * 54]], 2.4, 0.9, MYC, 1.5); }
  braid(p, [[0, 0, 0], [3, 20, 2], [2, 42, -2], [-2, 62, 0], [0, 80, 2]], 17);
  sprout(p, [15, 30, 6], [1, 0.5, 0.4], 6, 4.6); sprout(p, [-15, 48, -4], [-1, 0.6, -0.2], 7, 5, true); sprout(p, [6, 64, -15], [0.5, 0.4, -1], 5, 3.6); sprout(p, [-8, 18, 14], [-0.5, 0.3, 1], 5, 3.4, true);
  pore(p, [-10, 24, 11], 2.6, [-0.6, 0, 0.8]); pore(p, [13, 56, 6], 2.4, [0.9, 0, 0.4]);
  S(p[1] + 1.5, 1);
  return getD();
}
function mycelHead(p) {
  reset();
  // it rises, leans forward and hooks over at the top like a crook
  const pts = [[0, 66, 0], [2, 86, 4], [4, 104, 10], [3, 120, 20], [-1, 130, 34], [-4, 130, 48], [-5, 120, 56]];
  braid(p, pts, 15);
  const tip = [-5, 116, 57];
  for (let i = 0; i < 6; i++) { const a = i * 1.047 + 0.3; chain(p, [tip, [tip[0] + Math.cos(a) * 8, tip[1] - 6 + Math.sin(a) * 4, tip[2] + 6], [tip[0] + Math.cos(a) * 12, tip[1] - 16 + Math.sin(a) * 4, tip[2] + 6], [tip[0] + Math.cos(a) * 10, tip[1] - 25, tip[2] + 1]], 2.2, 0.5, ROOT2, 1); }
  pore(p, [13, 102, 14], 2.6, [0.9, 0.1, 0.3]); pore(p, [-14, 92, 4], 2.2, [-0.9, 0, 0.3]); pore(p, [1, 140, 34], 2.4, [0, 1, 0]); pore(p, [9, 126, 48], 2.2, [0.8, 0.4, 0.4]);
  sprout(p, [-13, 114, 14], [-1, 0.5, 0], 6, 4.2); sprout(p, [14, 84, 4], [1, 0.4, -0.3], 6, 4.4, true); sprout(p, [-3, 136, 26], [-0.3, 1, -0.3], 5, 3.6, true);
  S(p[1] - 64, 1);
  return getD();
}

export const CREATURES = { Rotcap, Sporeling, Creeper, Puffball, Inkcap, BlightRat, Drifter, Bracketback, Shrieker, Shelfshield, Sporecaller, GoldenTruffle, Rootworm, SporePod, GraspingMycel };
