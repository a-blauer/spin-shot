// The Blight, creature by creature. Each is a set of parts on pivots (the rig the game animates): Body, Head, ArmFront,
// ArmBack, LegFront, LegBack, Tail, WingFront, WingBack. Everything is sculpted in the creature's own frame: feet at
// y = 0, facing +z, x to its left. A part's field is written in that frame too; the baker cuts it out round its pivot.
// Front/Back on limbs means the two sides (the walk swings them in opposite phase), not near and far.
import { C, CAP, FLESH, GLOW, mixP, reset, U, H, S, P, bump, getD, setD, sph, ell, cap, chain, chainD, torus, cyl, box, rotX, rotY, rotZ, along, fbm, noise, cells, len, clamp } from './kit.mjs';

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
  // and nothing of the dome below the hollow's middle: a lens of it left under there read as a loose plate round the stem
  U(Math.max(top, -und, (c[1] - h * under) - q[1]), CAP(1), 3);
  // gills: grooves under the brim, radial
  if (gills && rr > gillIn && und > -6 && und < 3) { const g = Math.abs(Math.sin(a * gills * 0.5)); if (g < 0.32) bump(1.2 * smooth(gillIn, gillIn + 6, rr) * smooth(r * k, r * k - 3, rr)); }
  const onCap = Math.max(top, -und, (c[1] - h * under) - q[1]) < 2.5;   // paint only the cap itself, not what it sits on
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
  // the stalk starts well down in whatever it grows from, so a sprout is never left standing off a curved surface
  const root = Math.max(10, cr * 2), b0 = [base[0] - d[0] * root, base[1] - d[1] * root, base[2] - d[2] * root];
  U(cap(p, b0, top, cr * 0.32, cr * 0.26), FLESH(0.95), cr * 0.25);
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
  U(cap(q, [0, 78, 0], [0, 118, 0], 22, 16), FLESH(1), 10);              // the stalk, ending under the head's own neck (taller, it rose up over the mouth)
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
  pore(p, [10, 190, 26], 2.2, [0.3, 1, 0]); pore(p, [-14, 186, 18], 2, [-0.6, 0.7, -0.2]); pore(p, [3, 188, 15], 2.4, [0, 1, -0.6]);
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
  for (const s of [-1, 1]) eye(p, [s * 6.4, 133, 11.2], 3.3, [s * 0.25, -0.1, 1]);   // eyes big enough to read from a gun's length
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
  const d = Math.max(ell([f, y, side], [R * 0.35, 0, 0], [R, th, R * 1.1]), -f - R * 0.45);   // its back half buried in what it grows from
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
  for (const [x, y, z, ox, oz, R, th] of [[0, 196, -36, 0, -1, 30, 6], [-26, 176, -38, -0.5, -1, 26, 5.5], [24, 170, -38, 0.6, -1, 28, 5.5], [-10, 150, -44, -0.2, -1, 24, 5], [16, 132, -40, 0.4, -1, 22, 4.6], [-42, 196, -6, -1, -0.3, 22, 5], [42, 198, -2, 1, -0.2, 24, 5], [-30, 120, -34, -0.7, -0.8, 18, 4], [0, 206, -16, 0, -1, 20, 4.4]])
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
    { role: 'Body', pivot: [0, 60, 0], lo: [-52, 16, -52], hi: [52, 182, 52], h: 1.7, f: callerBody, tris: 14000, ao: 0.5 },
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
  // a cord of twisted mycelium from the fist to the pod, knotted along its length (fine chain links were finer than the sculpt and fell apart)
  U(cap(p, [28, 112, 29], [32, 66, 34], 1.7, 1.7), C(0x4a4436), 0.6);
  for (let i = 0; i < 6; i++) { const t = (i + 0.5) / 6; U(sph(p, [28 + 4 * t, 110 - 42 * t, 29 + 5 * t], 2.6), C(0x3a3a34), 0.8); }
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
    { role: 'Body', pivot: [0, 48, 0], lo: [-60, 30, -58], hi: [60, 150, 62], h: 1.3, f: truffleBody, tris: 13000 },
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
    { role: 'Body', pivot: [0, 0, 0], lo: [-56, -18, -64], hi: [56, 100, 60], h: 1.7, f: wormBody, tris: 10000 },
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
  U(Math.max(len(p[0], 0, p[2] + 28) - 50, p[1] - 2, -p[1] - 14), C(0x2e2418), 3);   // the earth goes on down under the floor, so a lean never lifts the mound off it
  S(p[1] + 14, 1);
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
  for (let i = 0; i < 3; i++) { const sa = seed + i * 2.09, d = Math.abs(Math.sin((a - sa) * 0.5)) * rr * 2 - 1.3; if (p[1] > c[1] - h * 0.35) S(Math.max(d, -ell(p, c, [r - 3, h - 3, r - 3]), e - 1), 1, GLOW(1)); }
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
    { role: 'Body', pivot: [0, 0, 0], lo: [-56, -16, -56], hi: [56, 84, 56], h: 1.5, f: mycelBody, tris: 7000 },
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
  U(ell(p, [0, -6, 0], [42, 9, 40]), MYC2, 6);   // the mat goes on down under the floor
  S(p[1] + 12, 1);
  return getD();
}
function mycelHead(p) {
  reset();
  // it rises, leans forward and hooks over at the top like a crook
  const pts = [[0, 66, 0], [2, 86, 4], [4, 104, 10], [3, 120, 20], [-1, 130, 34], [-4, 130, 48], [-5, 120, 56]];
  braid(p, pts, 15);
  // a knot where it springs from the trunk: the strands of the two halves meet inside it, so no step shows between them
  U(ell(p, [1, 76, 1], [19, 11, 19]), MYC2, 5); { const n = fbm(p[0] * 0.12, p[1] * 0.12, p[2] * 0.12); bump(ell(p, [1, 76, 1], [21, 13, 21]) < 2 ? n * 1.5 : 0); }
  const tip = [-5, 116, 57];
  for (let i = 0; i < 6; i++) { const a = i * 1.047 + 0.3; chain(p, [tip, [tip[0] + Math.cos(a) * 8, tip[1] - 6 + Math.sin(a) * 4, tip[2] + 6], [tip[0] + Math.cos(a) * 12, tip[1] - 16 + Math.sin(a) * 4, tip[2] + 6], [tip[0] + Math.cos(a) * 10, tip[1] - 25, tip[2] + 1]], 2.2, 0.5, ROOT2, 1); }
  pore(p, [13, 102, 14], 2.6, [0.9, 0.1, 0.3]); pore(p, [-14, 92, 4], 2.2, [-0.9, 0, 0.3]); pore(p, [1, 140, 34], 2.4, [0, 1, 0]); pore(p, [9, 126, 48], 2.2, [0.8, 0.4, 0.4]);
  sprout(p, [-13, 114, 14], [-1, 0.5, 0], 6, 4.2); sprout(p, [14, 84, 4], [1, 0.4, -0.3], 6, 4.4, true); sprout(p, [-3, 136, 26], [-0.3, 1, -0.3], 5, 3.6, true);
  S(p[1] - 64, 1);
  return getD();
}



// ================================================================ BOSSES
// Each is the Blight grown huge round one idea. Sculpted around 200 high; the game scales a boss by its own size (to
// about twice that).

// a crown: a ring of caps standing up round a point, the middle ones tallest, some lit
function crown(p, c, R, n, L, cr, seed = 0) {
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + seed, tall = 0.7 + 0.3 * Math.cos(a * 2) + hashI(i, 7) * 0.2; const b = [c[0] + Math.cos(a) * R, c[1], c[2] + Math.sin(a) * R]; sprout(p, b, [Math.cos(a) * 0.35, 1, Math.sin(a) * 0.35], L * tall, cr * (0.8 + 0.3 * tall), i % 2 === 0); }
}

// ---------------------------------------------------------------- THE BROOD MOTHER (eggs)
// A queen that never stops laying: an upright front like a great Rotcap, two pairs of root arms, a crowned cap with a ring
// of eyes, and behind her an enormous pale sac dragging on the floor, knobbed with pods splitting along lit seams.
export const B_BroodMother = {
  height: 205,
  parts: [
    { role: 'LegBack', pivot: [-22, 60, 26], lo: [-60, -4, -14], hi: [10, 80, 70], h: 1.8, f: (p) => { reset(); rootLeg(p, [-22, 64, 26], [-26, 34, 36], [-24, 12, 30], 13, 10, [[-0.4, 1, 20], [0.1, 1, 24], [0.5, 0.8, 20], [0, -1, 14]], -1); return getD(); } },
    { role: 'LegFront', pivot: [22, 60, 26], lo: [-10, -4, -14], hi: [60, 80, 70], h: 1.8, f: (p) => { reset(); rootLeg(p, [22, 64, 26], [26, 34, 36], [24, 12, 30], 13, 10, [[-0.4, 1, 20], [0.1, 1, 24], [0.5, 0.8, 20], [0, -1, 14]], 1); return getD(); } },
    { role: 'Body', pivot: [0, 60, 20], lo: [-96, -4, -200], hi: [96, 176, 76], h: 2.4, f: broodBody, tris: 14000 },
    { role: 'ArmBack', pivot: [-34, 150, 34], lo: [-96, 40, -10], hi: [-14, 162, 96], h: 1.7, f: (p) => { reset(); rootArm(p, [-34, 150, 34], [-56, 118, 50], [-60, 86, 66], 9, 4, 34, -1); return getD(); } },
    { role: 'ArmFront', pivot: [34, 150, 34], lo: [14, 40, -10], hi: [96, 162, 96], h: 1.7, f: (p) => { reset(); rootArm(p, [34, 150, 34], [56, 118, 50], [60, 86, 66], 9, 4, 34, 1); return getD(); } },
    { role: 'ArmBack', pivot: [-28, 118, 40], lo: [-80, 40, 0], hi: [-10, 128, 90], h: 1.5, f: (p) => { reset(); rootArm(p, [-28, 118, 40], [-46, 98, 58], [-46, 74, 72], 6.5, 3, 24, -1); return getD(); } },
    { role: 'ArmFront', pivot: [28, 118, 40], lo: [10, 40, 0], hi: [80, 128, 90], h: 1.5, f: (p) => { reset(); rootArm(p, [28, 118, 40], [46, 98, 58], [46, 74, 72], 6.5, 3, 24, 1); return getD(); } },
    { role: 'Head', pivot: [0, 160, 38], lo: [-74, 142, -34], hi: [74, 236, 110], h: 1.8, f: broodHead, tris: 9000 },
  ],
};
function broodBody(p) {
  reset();
  // the front: a thick stalk of a torso leaning back from the hips
  U(ell(p, [0, 72, 24], [36, 22, 32]), FLESH(1), 10);
  U(cap(p, [0, 74, 24], [0, 162, 38], 34, 24), FLESH(1), 14); fibres(p, [0, 0, 30], 18, 0.8);
  for (const s of [-1, 1]) { U(ell(p, [s * 30, 148, 34], [12, 10, 12]), ROOT, 6); U(ell(p, [s * 26, 118, 40], [9, 8, 9]), ROOT, 5); }
  // a ragged ring
  { const q = [p[0], p[1], p[2] - 32], rr = len(q[0], 0, q[2]), a = Math.atan2(q[2], q[0]), y0 = 136 - (rr - 26) * 0.7, tear = Math.max(0, Math.sin(a * 3 + 2)) * 10;
    U(Math.max(Math.abs(p[1] - y0) - 3, rr - (46 - tear * 0.4), 25 - rr), FLESH(0.85), 3); }
  // the sac: huge, pale, veined, lying on the floor behind her
  const sc = [0, 62, -96], sac = ell(p, sc, [78, 60, 100]);
  U(sac, mixP(FLESH(0.95), C(0xe8dcc8), 0.3), 26);
  U(ell(p, [0, 46, -40], [44, 36, 40]), FLESH(0.95), 20);   // where it joins her
  if (sac < 6) { const n = fbm(p[0] * 0.04, p[1] * 0.04, p[2] * 0.04); P(Math.abs(n) * 40 - 1.4, mixP(CAP(0.7), FLESH(0.3), 0.3), 0.8); }   // veins
  // pods bulging out of the sac, splitting along lit seams
  for (const [x, y, z, r] of [[-40, 98, -80, 16], [30, 104, -110, 18], [0, 112, -60, 14], [-52, 70, -140, 15], [48, 64, -70, 13], [10, 96, -160, 15], [-22, 112, -120, 13], [58, 82, -130, 12]]) {
    const e = ell(p, [x, y, z], [r, r * 1.2, r]); U(e, CAP(1), 5);
    if (e < 3) { const a = Math.atan2(p[2] - z, p[0] - x), rr = len(p[0] - x, 0, p[2] - z); for (let k = 0; k < 2; k++) { const d = Math.abs(Math.sin((a - k * 1.57 - x) * 0.5)) * rr * 2 - 1.6; if (p[1] > y - r * 0.4) S(Math.max(d, -ell(p, [x, y, z], [r - 3, r * 1.2 - 3, r - 3]), e - 1), 1, GLOW(1)); } }
  }
  for (const [x, z] of [[-30, -40], [36, -160], [-60, -110]]) sprout(p, [x, 60 + 60 * Math.sqrt(Math.max(0, 1 - (x / 78) ** 2 - ((z + 96) / 100) ** 2)), z], [x * 0.01, 1, 0], 12, 7, true);   // on the sac's own surface
  S(p[1] + 1, 2);   // flat on the floor
  P(p[1] - 14, mixP(FLESH(0.55), C(0x2a2016), 0.5), 8);
  return getD();
}
function broodHead(p) {
  reset();
  U(cap(p, [0, 148, 36], [0, 186, 42], 23, 26), FLESH(1), 8);
  capDome(p, { c: [0, 194, 44], r: 64, h: 30, droop: 12, wave: 3, waves: 7, gills: 40, warts: 30, wartR: 5.6, seed: 5, lop: 4, gillIn: 28, under: 0.42, tilt: 2, bites: 2 });
  crown(p, [0, 220, 44], 26, 9, 22, 8, 0.3);
  // a ring of eyes under the brim, and a wide mouth of gill-teeth
  for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.32; eye(p, [Math.sin(a) * 25, 178 - Math.abs(i - 2) * 1.5, 42 + Math.cos(a) * 25], 3.6 - Math.abs(i - 2) * 0.4); }
  S(ell(p, [0, 160, 66], [15, 6, 10]), 2, GUM);
  for (let i = -5; i <= 5; i++) { const x = i * 2.8, l = 4 + (i & 1) * 2; U(cap(p, [x, 164.5, 64], [x, 164.5 - l, 66], 1.3, 0.35), TOOTH, 0.5); U(cap(p, [x + 1.4, 155.5, 63.5], [x + 1.4, 155.5 + l * 0.7, 65.5], 1.2, 0.35), TOOTH, 0.5); }
  S(p[1] - 143, 2);
  return getD();
}

// ---------------------------------------------------------------- KING PUFFCAP (split)
// The Puffball grown regal and fit to burst: the same swollen body under a crown of caps; cut it and it comes apart into two
// smaller ones, and those into four.
export const B_KingPuff = {
  height: 230,
  parts: Puffball.parts.filter((pt) => pt.role !== 'Head').concat([{ role: 'Head', pivot: [0, 176, 0], lo: [-60, 162, -60], hi: [60, 250, 60], h: 1.5, f: kingPuffHead, tris: 8000 }]),
};
function kingPuffHead(p) {
  reset();
  U(ell(p, [0, 180, 0], [42, 16, 40]), CAP(0.95), 8);
  crown(p, [0, 188, 0], 30, 11, 26, 8.5, 0.2);
  S(cap(p, [0, 188, 0], [0, 212, 0], 13, 16), 3, GLOW(1));
  S(p[1] - 166, 2);
  return getD();
}

// ---------------------------------------------------------------- THE DRIFT QUEEN (swarm)
// Mother of the Drifters: a vast floating pod crowned with tall caps, its underside a hive of lit buds that drop away as new
// Drifters, a heavy toothed mouth on a stalk and a curtain of long glowing hyphae trailing under her.
export const B_DriftQueen = {
  height: 190,
  parts: [
    { role: 'Tail', pivot: [0, 70, 0], lo: [-50, -6, -50], hi: [50, 76, 50], h: 1.1, f: queenTail, tris: 4500 },
    { role: 'Body', pivot: [0, 110, 0], lo: [-86, 60, -86], hi: [86, 196, 86], h: 2.0, f: queenBody, tris: 14000 },
    { role: 'Head', pivot: [0, 86, 12], lo: [-36, 36, -24], hi: [36, 96, 60], h: 1.4, f: queenHead, tris: 5000 },
  ],
};
function queenBody(p) {
  reset();
  U(ell(p, [0, 132, 0], [62, 46, 62]), CAP(1), 6);
  U(ell(p, [0, 166, 0], [30, 18, 30]), CAP(0.85), 14);
  { const [d1] = cells(p[0] * 0.08, p[1] * 0.08, p[2] * 0.08); bump(-Math.max(0, 0.28 - d1) * 2.4); }
  for (let i = 0; i < 14; i++) { const a = i * 0.4488, y = 130 + Math.sin(i * 2.1) * 6; pore(p, [Math.cos(a) * 61, y, Math.sin(a) * 61], 3.6, [Math.cos(a), 0, Math.sin(a)]); }
  for (const s of [-1, 1]) eye(p, [s * 16, 124, 59], 5);
  crown(p, [0, 176, 0], 22, 8, 26, 8, 0.1);
  // the skirt of gills
  { const rr = len(p[0], 0, p[2]), a = Math.atan2(p[2], p[0]), frill = Math.sin(a * 16) * 4, y0 = 100 - (rr - 34) * 0.5 + frill;
    U(Math.max(Math.abs(p[1] - y0) - 2.6, rr - (76 + Math.sin(a * 7) * 4), 30 - rr), FLESH(0.9), 3); }
  // the hive: a cluster of lit buds hanging under her
  U(ell(p, [0, 96, 0], [42, 16, 42]), FLESH(0.85), 10);
  for (let i = 0; i < 13; i++) { const a = i * 0.483, r = 14 + (i % 3) * 9, b = [Math.cos(a) * r, 84 - (i % 2) * 5, Math.sin(a) * r], e = ell(p, b, [7, 9, 7]); U(e, CAP(0.9), 3); if (e < 2) P(ell(p, [b[0], b[1] - 4, b[2]], [4, 5, 4]), GLOW(1), 1.5); }
  S(p[1] - 64, 2);
  return getD();
}
function queenHead(p) {
  reset();
  U(cap(p, [0, 92, 8], [0, 62, 22], 14, 17), FLESH(1), 4);
  U(ell(p, [0, 54, 26], [20, 13, 20]), FLESH(0.9), 4);
  S(ell(p, [0, 46, 30], [12, 10, 12]), 2, GUM); S(ell(p, [0, 52, 28], [6, 10, 6]), 1, GLOW(1));
  for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 14; i++) { const a = i * 0.4488 + ring * 0.2, r = 12 - ring * 4, x = Math.cos(a) * r, z = 30 + Math.sin(a) * r; U(cap(p, [x, 45 + ring * 3, z], [x * 0.6, 48 + ring * 3, 30 + (z - 30) * 0.6], 2, 0.4), TOOTH, 0.5); }
  S(90 - p[1], 2);
  return getD();
}
function queenTail(p) {
  reset();
  for (let i = 0; i < 12; i++) { const a = i * 0.5236 + 0.3, r = 22 + (i % 3) * 10, L = 40 + (i * 13) % 30; const b = [Math.cos(a) * r, 72, Math.sin(a) * r];
    const pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push([b[0] * (1 - t * 0.25) + Math.sin(t * 5 + i) * 4, b[1] - t * L, b[2] * (1 - t * 0.25) + Math.cos(t * 4 + i) * 4]); }
    chain(p, pts, 2.8, 1.8, MYC2, 1.5); U(sph(p, pts[6], 2.9), GLOW(1), 0.8); }   // no thinner than the sculpt can hold: finer strands broke up and left their beads hanging
  return getD();
}

// ---------------------------------------------------------------- THE LAMPLIGHTER (decoy)
// An anglerfish grown out of a puffball: a dark bulb of a head that is mostly mouth, rows of long needle teeth, two small
// eyes high up, a ragged frill of gills down its back like a fin, and arching over the front on a long stalk the lure, a
// lit pod. In the dark you see three lights; only one has a mouth behind it.
export const B_Lantern = {
  height: 200,
  parts: [
    { role: 'Tail', pivot: [0, 96, -60], lo: [-40, 40, -150], hi: [40, 150, -40], h: 1.4, f: lanternTail, tris: 3000 },
    { role: 'Body', pivot: [0, 100, 0], lo: [-80, 30, -80], hi: [80, 176, 96], h: 1.9, f: lanternBody, tris: 14000 },
    { role: 'Head', pivot: [0, 160, 10], lo: [-26, 150, -10], hi: [26, 236, 130], h: 1.3, f: lanternLure, tris: 3000 },
  ],
};
function lanternBody(p) {
  reset();
  U(ell(p, [0, 104, 0], [60, 58, 66]), CAP(0.7), 6);
  { const [d1] = cells(p[0] * 0.07, p[1] * 0.07, p[2] * 0.07); bump(-Math.max(0, 0.3 - d1) * 3); }
  P(-fbm(p[0] * 0.06, p[1] * 0.06, p[2] * 0.06) - 0.2, mixP(CAP(0.5), C(0x0e0a08), 0.3), 0.15);
  // the mouth: a huge underbite gaping forward
  const m = [0, 88, 48];
  S(ell(p, m, [46, 28, 34]), 4, GUM); S(ell(p, [0, 84, 40], [30, 16, 24]), 3, GLOW(0.5));
  U(ell(p, [0, 64, 46], [48, 14, 30]), CAP(0.65), 8);   // the jaw
  for (let i = -8; i <= 8; i++) { const a = i / 9, x = Math.sin(a * 1.2) * 40, z = 48 + Math.cos(a * 1.2) * 26 - 8, L = 14 + (i & 1) * 8 - Math.abs(i) * 0.6; U(cap(p, [x, 70, z], [x * 0.96, 70 + L, z + 3], 2.2, 0.4), TOOTH, 0.6); U(cap(p, [x * 0.97, 108, z - 2], [x * 0.93, 108 - L * 0.8, z + 2], 2, 0.4), TOOTH, 0.6); }
  for (const s of [-1, 1]) eye(p, [s * 24, 140, 46], 4);
  // the frill down the back, like a fin
  { const q = [p[0], p[1] - 150, p[2] + 10]; U(Math.max(Math.abs(q[0]) - 2.2 - Math.sin(q[2] * 0.3) * 1, ell(q, [0, 0, -30], [8, 24, 50]), -q[1] - 6), FLESH(0.85), 3); }
  for (let i = 0; i < 10; i++) { const a = i * 0.628, y = 104 + Math.sin(i * 1.7) * 20; if (Math.sin(a) < 0.5) pore(p, [Math.cos(a) * 58, y, Math.sin(a) * 60], 3, [Math.cos(a), 0, Math.sin(a)]); }
  return getD();
}
function lanternLure(p) {
  reset();
  // the stalk: up from the brow and arching forward and down
  const pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push([Math.sin(t * 3) * 3, 160 + Math.sin(t * Math.PI * 0.8) * 60, 10 + t * 100]); }
  chain(p, pts, 4, 2.2, FLESH(0.9), 2);
  const L = pts[10]; U(ell(p, [L[0], L[1] - 8, L[2]], [10, 13, 10]), GLOW(1), 2); U(ell(p, [L[0], L[1] + 1, L[2]], [8, 4, 8]), CAP(0.9), 2);
  for (let i = 0; i < 5; i++) { const a = i * 1.257; chain(p, [[L[0], L[1] - 18, L[2]], [L[0] + Math.cos(a) * 5, L[1] - 26, L[2] + Math.sin(a) * 5]], 1, 0.4, MYC2, 0.6); }
  return getD();
}
function lanternTail(p) {
  reset();
  // a ragged tail fin of gill-membrane
  const q = [p[0], p[1] - 96, p[2] + 60], u = -q[2];
  U(Math.max(Math.abs(q[0]) - 2.2, ell(q, [0, 0, -30], [8, 24, 30]), -u - 4), mixP(FLESH(0.8), CAP(0.4), 0.3), 3);
  for (let i = -3; i <= 3; i++) U(cap(p, [0, 96, -62], [0, 96 + i * 7, -96], 1.4, 0.7), CAP(0.8), 1);
  // the tail's root: a fleshy stock from inside the body out into the fin, so the fin grows from the fish
  U(cap(p, [0, 102, -36], [0, 96, -82], 17, 4), CAP(0.66), 6);
  return getD();
}



// ---------------------------------------------------------------- CARAPACE (shell)
// A tortoise that is mostly fungus: a vast domed bracket for a shell, ringed in bands, its underside pored and pale, four
// stumps of legs, and a gnarled snout pushing out from under the front rim with two lit eyes. It spins in the shell, and
// when it ends up on its back it is soft.
export const B_Carapace = {
  height: 170, beast: true,
  parts: [
    { role: 'LegBack', pivot: [-46, 46, -40], lo: [-84, -4, -80], hi: [-14, 70, 0], h: 1.8, f: (p) => carLeg(p, -1, -40) },
    { role: 'LegFront', pivot: [46, 46, -40], lo: [14, -4, -80], hi: [84, 70, 0], h: 1.8, f: (p) => carLeg(p, 1, -40) },
    { role: 'Body', pivot: [0, 50, 0], lo: [-128, 14, -140], hi: [128, 176, 140], h: 2.2, f: carBody, tris: 14000 },
    { role: 'ArmBack', pivot: [-46, 46, 44], lo: [-84, -4, 4], hi: [-14, 70, 90], h: 1.8, f: (p) => carLeg(p, -1, 44) },
    { role: 'ArmFront', pivot: [46, 46, 44], lo: [14, -4, 4], hi: [84, 70, 90], h: 1.8, f: (p) => carLeg(p, 1, 44) },
    { role: 'Head', pivot: [0, 62, 118], lo: [-44, 30, 96], hi: [44, 116, 212], h: 1.4, f: carHead, tris: 7000 },
  ],
};
function carBody(p) {
  reset();
  U(ell(p, [0, 54, 0], [74, 30, 90]), FLESH(0.85), 12);   // the body inside
  // the shell: a broad dome over a thick lip, ringed in bands, the bands darkening to the rim
  const a = Math.atan2(p[2], p[0]), wob = 1 + Math.sin(a * 9) * 0.03 + Math.sin(a * 3 + 1) * 0.025;
  const q = [p[0] / wob, p[1], p[2] / wob], shell = Math.max(ell(q, [0, 58, 0], [106, 92, 122]), 60 - p[1]);
  U(shell, CAP(1), 4);
  U(torus([q[0], q[1], q[2] * 106 / 122], [0, 62, 0], 102, 7), CAP(0.6), 5);   // the lip
  const rr = len(q[0], 0, q[2] * 106 / 122), top = 58 + 92 * Math.sqrt(Math.max(0, 1 - (rr / 106) ** 2));
  if (shell < 5) { const band = Math.sin(rr * 0.2 + fbm(p[0] * 0.03, 0, p[2] * 0.03) * 2); P(-band - 0.15, CAP(0.74), 0.3); P(rr - 84, mixP(CAP(0.55), C(0x1a120a), 0.35), 6); }
  P(p[1] - 64, FLESH(0.85), 3);   // pale beneath
  // things growing on the shell: smaller brackets, a few mushrooms, lit pores
  for (const [x, z, ox, oz] of [[-80, -40, -1, -0.4], [78, 36, 1, 0.3], [-26, 100, -0.3, 1], [44, -96, 0.6, -1]]) { const r2 = len(x, 0, z * 106 / 122), y2 = 58 + 92 * Math.sqrt(Math.max(0, 1 - (r2 / 106) ** 2)); shelf(p, [x, y2 - 4, z], [ox, 0, oz], 16, 3.6, 0.2); }
  for (const [x, z] of [[0, 0], [-30, 20], [26, -26], [10, 40], [-40, -50]]) { const r2 = len(x, 0, z * 106 / 122), y2 = 58 + 92 * Math.sqrt(Math.max(0, 1 - (r2 / 106) ** 2)); sprout(p, [x, y2 - 2, z], [x * 0.01, 1, z * 0.01], 12, 7, (x + z) % 2 === 0); }
  for (let i = 0; i < 8; i++) { const ang = i * 0.785 + 0.3, r2 = 72, x = Math.cos(ang) * r2, z = Math.sin(ang) * r2 * 122 / 106, y = 58 + 92 * Math.sqrt(1 - (r2 / 106) ** 2); pore(p, [x, y - 1, z], 4, [x / 100, 0.8, z / 100]); }
  return getD();
}
function carHead(p0) {
  const p = [p0[0], p0[1] - 8, p0[2] - 40]; reset();
  // a big head on a thick neck, pushed well out from under the shell so it reads from the front
  U(cap(p, [0, 52, 60], [0, 58, 112], 25, 21), mixP(ROOT, FLESH(0.3), 0.3), 8);
  U(ell(p, [0, 60, 128], [27, 21, 26]), ROOT, 7); bark(p, 0.6);
  U(cap(p, [0, 52, 134], [0, 42, 156], 13, 7.5), ROOT2, 5);   // the beak-like snout
  S(ell(p, [0, 46, 150], [14, 3.2, 10]), 1.8, GUM);
  for (const s of [-1, 1]) eye(p, [s * 14, 70, 145], 4.8, [s * 0.3, 0, 1]);
  U(ell(p, [0, 78, 130], [24, 5, 18]), FLESH(0.8), 5);   // a brow
  S(p[2] - 62, 2);
  return getD();
}
function carLeg(p, s, z) {
  reset();
  U(cap(p, [s * 46, 50, z], [s * 52, 14, z + (z > 0 ? 6 : -2)], 18, 16), ROOT, 6); bark(p, 0.6);
  U(ell(p, [s * 52, 8, z + (z > 0 ? 8 : -2)], [20, 10, 22]), ROOT2, 6);
  for (const [ax, l] of [[-0.6, 20], [0, 22], [0.6, 20]]) rootFinger(p, [[s * 52, 6, z + (z > 0 ? 18 : 10)], [s * 52 + ax * l * 0.6, 3, z + (z > 0 ? 28 : 20)], [s * 52 + ax * l, 1.4, z + (z > 0 ? 34 : 26)]], 5, ROOT2);
  S(p[1] + 0.5, 1); P(p[1] - 12, ROOTD, 6);
  return getD();
}

// ---------------------------------------------------------------- THE GREAT ROOTWORM (burrow)
// The Rootworm's mother: thicker, older, ringed in lit bands, its mouth fringed with long feeler-roots that grope out.
export const B_Wyrm = {
  height: 140,
  parts: [
    { role: 'Body', pivot: [0, 0, 0], lo: [-64, -6, -72], hi: [64, 110, 66], h: 1.9, f: wyrmBody, tris: 9000 },
    { role: 'Head', pivot: [0, 88, 26], lo: [-60, 50, -6], hi: [60, 140, 110], h: 1.5, f: wyrmHead, tris: 10000 },
  ],
};
function wyrmBody(p) { reset(); const q = [p[0] / 1.15, p[1] / 1.1, p[2] / 1.1]; const d = wormBody(q) * 1.1; setDpaint(d); for (let i = 0; i < 3; i++) { const y = 26 + i * 22; P(Math.abs(p[1] - y) - 2.4 - Math.max(0, len(p[0], 0, p[2] + 24 - i * 6) - 30) * 0, GLOW(0.95), 1.2); } return getD(); }
function wyrmHead(p) {
  reset(); const q = [p[0] / 1.15, (p[1] - 88) / 1.1 + 88, (p[2] - 26) / 1.1 + 26]; wormHead(q); bumpScale(1.1);
  // feeler roots fringing the mouth, groping forward
  const m = [0, 95 * 1.0 + 7, 26 + 32 * 1.1 + 4];
  for (let i = 0; i < 10; i++) { const a = i * 0.628, b = [Math.cos(a) * 22, 102 + Math.sin(a) * 22, 64]; chain(p, [b, [b[0] * 1.5, b[1] + Math.sin(a) * 10 + 4, 84], [b[0] * 1.7 + Math.sin(i) * 4, b[1] + Math.sin(a) * 14 - 4, 100], [b[0] * 1.5, b[1] + Math.sin(a) * 12 - 12, 108]], 2.6, 0.6, ROOT2, 1.2); }
  return getD();
}
// helpers for scaled reuse: the field was computed in scaled space; correct the distance and keep the paint
function setDpaint(d) { setD(d); }
function bumpScale(k) { setD(getD() * k); }

// ---------------------------------------------------------------- THUNDERHEAD (storm)
// A storm cloud of puffballs: dozens of spore balls packed into one floating mass, dark beneath, cracks of light running
// through it, a heavy-browed face pushing out of the front, and spore rain trailing from its underside in lit threads.
export const B_Thunderhead = {
  height: 190,
  parts: [
    { role: 'Tail', pivot: [0, 70, 0], lo: [-70, -6, -60], hi: [70, 80, 60], h: 1.1, f: thunderTail, tris: 5500 },
    { role: 'Body', pivot: [0, 120, 0], lo: [-120, 64, -96], hi: [120, 200, 96], h: 2.2, f: thunderBody, tris: 14000 },
    { role: 'Head', pivot: [0, 120, 50], lo: [-50, 76, 30], hi: [50, 164, 112], h: 1.5, f: thunderHead, tris: 7000 },
  ],
};
const THB = [[0, 130, 0, 52], [-56, 120, -6, 40], [54, 124, 4, 42], [-26, 158, -14, 38], [28, 156, 8, 36], [-84, 110, 10, 28], [86, 112, -8, 30], [0, 112, -50, 36], [-40, 104, 34, 30], [44, 104, 30, 30], [0, 174, 6, 26], [-60, 140, -40, 26], [60, 146, -34, 26]];
function thunderBody(p) {
  reset();
  for (const [x, y, z, r] of THB) { U(sph(p, [x, y, z], r), CAP(1), 10); }
  P(118 - p[1] + fbm(p[0] * 0.03, p[1] * 0.03, p[2] * 0.03) * 20, mixP(CAP(0.45), C(0x0e0c10), 0.45), 12);   // dark beneath
  { const [d1] = cells(p[0] * 0.06, p[1] * 0.06, p[2] * 0.06); bump(-Math.max(0, 0.3 - d1) * 3); }
  // cracks of light: thin lit veins wandering through the mass
  { const n = fbm(p[0] * 0.025 + 3, p[1] * 0.025, p[2] * 0.025); S(Math.abs(n) * 80 - 1.0 + Math.max(0, 120 - p[1]) * 0.05, 0.8, GLOW(1)); }
  return getD();
}
function thunderHead(p) {
  reset();
  U(ell(p, [0, 118, 70], [38, 34, 30]), CAP(0.9), 8);
  U(ell(p, [0, 140, 86], [34, 9, 16]), CAP(0.75), 6);   // the brow
  for (const s of [-1, 1]) eye(p, [s * 14, 128, 95], 5);
  S(ell(p, [0, 104, 96], [20, 9, 12]), 2, GUM); S(ell(p, [0, 104, 92], [12, 5, 8]), 2, GLOW(0.9));
  for (let i = -5; i <= 5; i++) { const x = i * 3.4, a = Math.abs(i) / 6; U(cap(p, [x, 111 - a * a * 3, 99 - a * 6], [x, 107 - a * a * 3 - (i & 1) * 2, 101 - a * 6], 1.5, 0.4), TOOTH, 0.5); }
  S(p[2] - 34, 2);
  return getD();
}
function thunderTail(p) {
  reset();
  for (let i = 0; i < 18; i++) { const a = i * 0.349 + 0.2, r = 20 + (i % 4) * 14, L = 40 + (i * 17) % 34; const b = [Math.cos(a) * r, 76, Math.sin(a) * r * 0.8];
    chain(p, [b, [b[0] + Math.sin(i) * 3, b[1] - L * 0.5, b[2]], [b[0], b[1] - L, b[2] + Math.cos(i) * 3]], 2.4, 1.7, MYC2, 0.8); U(sph(p, [b[0], b[1] - L, b[2] + Math.cos(i) * 3], 2.8), GLOW(1), 0.6); }   // thick enough to hold together
  return getD();
}

// ---------------------------------------------------------------- ASH AND EMBER (twin hounds)
// A pair of hounds the Blight took: lean, ribbed, a ridge of little caps down the spine, mold in the fur, jaws grown through
// with pale gill-teeth, eyes lit. Four-footed (beast rig). ~140 high before scale.
const DFUR = C(0x4a423c), DFUR2 = C(0x38322e), DFURL = C(0x6e6458);
export const B_Hound = {
  height: 140, beast: true,
  parts: [
    { role: 'LegBack', pivot: [-16, 70, -44], lo: [-40, -4, -86], hi: [4, 96, -10], h: 1.4, f: (p) => houndHind(p, -1) },
    { role: 'LegFront', pivot: [16, 70, -44], lo: [-4, -4, -86], hi: [40, 96, -10], h: 1.4, f: (p) => houndHind(p, 1) },
    { role: 'Body', pivot: [0, 74, 0], lo: [-40, 40, -96], hi: [40, 130, 60], h: 1.5, f: houndBody, tris: 9000 },
    { role: 'Tail', pivot: [0, 82, -62], lo: [-24, 30, -140], hi: [24, 110, -50], h: 1.3, f: houndTail, tris: 2500 },
    { role: 'ArmBack', pivot: [-15, 72, 34], lo: [-36, -4, 4], hi: [4, 96, 64], h: 1.3, f: (p) => houndFore(p, -1) },
    { role: 'ArmFront', pivot: [15, 72, 34], lo: [-4, -4, 4], hi: [36, 96, 64], h: 1.3, f: (p) => houndFore(p, 1) },
    { role: 'Head', pivot: [0, 96, 46], lo: [-34, 64, 26], hi: [34, 140, 130], h: 1.2, f: houndHead, tris: 8000 },
  ],
};
function houndBody(p) {
  reset();
  U(ell(p, [0, 88, 20], [21, 24, 30]), DFUR, 10);   // the deep chest
  U(cap(p, [0, 88, 14], [0, 84, -50], 19, 15), DFUR2, 12);   // the barrel to the haunches
  U(ell(p, [0, 84, -50], [18, 18, 18]), DFUR, 10);
  U(ell(p, [0, 102, 30], [16, 14, 18]), DFUR, 10);   // the shoulders
  fur(p, 0.7);
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) U(cap(p, [s * 16.5, 98, 8 - i * 9], [s * 18.5, 78, 6 - i * 9], 1.4, 1), DFURL, 2.4);   // ribs
  P(p[1] - 72, mixP(DFURL, FLESH(0.3), 0.3), 6);
  // the ridge of caps down the spine, the front ones lit
  for (let i = 0; i < 8; i++) { const z = 34 - i * 11, y = z > 14 ? 110 : 105 - (14 - z) * 0.125; sprout(p, [0, y, z], [0, 1, -0.2], 9 - i * 0.6, 6 - i * 0.35, i < 3); }
  P(ell(p, [0, 108, -6], [12, 8, 46]) + fbm(p[0] * 0.15, p[1] * 0.15, p[2] * 0.15) * 6, mixP(CAP(0.8), DFUR2, 0.2), 3);
  return getD();
}
function houndHead(p) {
  reset();
  U(ell(p, [0, 104, 56], [15, 14, 16]), DFUR, 6);
  U(cap(p, [0, 100, 62], [0, 92, 96], 11, 6.5), DFUR, 6); fur(p, 0.4);
  U(sph(p, [0, 93, 98], 4.2), C(0x1a1614), 2);
  for (const s of [-1, 1]) U(cap(p, [s * 9, 114, 50], [s * 12, 128, 44], 4.2, 1), DFUR2, 3);   // ears
  // jaws parted, gill-teeth grown through
  S(ell(p, [0, 88, 82], [8, 3.5, 16]), 1.6, GUM);
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const z = 74 + i * 3.6; U(cap(p, [s * 6, 91, z], [s * 5.5, 86 - (i & 1) * 1.5, z + 0.5], 1.1, 0.3), TOOTH, 0.4); U(cap(p, [s * 5.6, 84.5, z + 1.5], [s * 5.2, 88.5, z + 2], 1, 0.3), TOOTH, 0.4); }
  for (const s of [-1, 1]) eye(p, [s * 8.5, 107, 68], 2.8, [s * 0.4, 0, 0.9]);
  sprout(p, [-6, 116, 52], [-0.4, 1, -0.2], 7, 4.6, true); sprout(p, [5, 117, 49], [0.3, 1, -0.3], 6, 4);
  S(p[2] - 34, 1);
  return getD();
}
function houndFore(p, s) {
  reset();
  U(ell(p, [s * 15, 86, 34], [8, 16, 10]), DFUR, 5);
  chain(p, [[s * 15, 76, 34], [s * 16, 44, 40], [s * 16, 26, 38], [s * 16, 6, 42]], 5.6, 3.6, DFUR2, 2); fur(p, 0.4);
  U(ell(p, [s * 16, 4, 46], [5.5, 3.6, 7]), C(0x2a2420), 2);
  for (let i = -1; i <= 1; i++) chain(p, [[s * 16 + i * 2.6, 4, 51], [s * 16 + i * 3, 1.4, 55]], 1.2, 0.5, CLAW, 0.5);
  S(p[1] + 0.5, 1);
  return getD();
}
function houndHind(p, s) {
  reset();
  U(ell(p, [s * 16, 80, -46], [10, 20, 16]), DFUR, 6);
  chain(p, [[s * 17, 70, -40], [s * 18, 44, -58], [s * 17, 22, -50], [s * 17, 6, -46]], 6, 3.8, DFUR2, 2); fur(p, 0.4);
  U(ell(p, [s * 17, 4, -40], [5.5, 3.6, 8]), C(0x2a2420), 2);
  for (let i = -1; i <= 1; i++) chain(p, [[s * 17 + i * 2.6, 4, -34], [s * 17 + i * 3, 1.4, -30]], 1.2, 0.5, CLAW, 0.5);
  S(p[1] + 0.5, 1);
  return getD();
}
function houndTail(p) {
  reset();
  const pts = []; for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push([Math.sin(t * 3) * 4, 84 - t * 36 + t * t * 10, -60 - t * 70]); }
  chain(p, pts, 7, 3, DFUR, 3); fur(p, 0.8);
  sprout(p, pts[5], [0, 1, -0.3], 8, 5, true); sprout(p, pts[7], [0.3, 1, -0.5], 6, 4);
  return getD();
}

// ---------------------------------------------------------------- THE FURNACE (heat)
// A burned-out stump that kept burning inside: charred bark split open down the chest on a core of light, two hollow stumps
// on its shoulders for chimneys, huge charred fists, cinders caught in the cracks. Every fourth thing it does, it vents.
const CHAR = C(0x221c1a), CHAR2 = C(0x16110f), ASH = C(0x5e5650);
export const B_Furnace = {
  height: 240, budget: 1.4,
  parts: [
    { role: 'LegBack', pivot: [-28, 92, -8], lo: [-70, -4, -50], hi: [4, 116, 46], h: 2.0, f: (p) => furnLeg(p, -1) },
    { role: 'LegFront', pivot: [28, 92, -8], lo: [-4, -4, -50], hi: [70, 116, 46], h: 2.0, f: (p) => furnLeg(p, 1) },
    { role: 'Body', pivot: [0, 92, 0], lo: [-100, 66, -84], hi: [100, 272, 84], h: 2.2, f: furnBody, tris: 14000 },
    { role: 'ArmBack', pivot: [-62, 182, 6], lo: [-120, 2, -36], hi: [-30, 216, 80], h: 1.8, f: (p) => furnArm(p, -1) },
    { role: 'ArmFront', pivot: [62, 182, 6], lo: [30, 2, -36], hi: [120, 216, 80], h: 1.8, f: (p) => furnArm(p, 1) },
    { role: 'Head', pivot: [0, 196, 30], lo: [-40, 166, 6], hi: [40, 236, 80], h: 1.4, f: furnHead, tris: 6000 },
  ],
};
function charBark(p, k = 1.3) { bark(p, k); P(-fbm(p[0] * 0.05, p[1] * 0.05, p[2] * 0.05) - 0.15, ASH, 0.2); { const n = fbm(p[0] * 0.04 + 5, p[1] * 0.04, p[2] * 0.04); if (Math.abs(n) < 0.012 && fbm(p[0] * 0.02, p[1] * 0.02 + 9, p[2] * 0.02) > 0.15) { bump(0.8); P(-1, GLOW(0.9), 0.5); } } }
function furnBody(p) {
  reset();
  U(ell(p, [0, 158, -6], [56, 66, 44]), CHAR, 12); U(ell(p, [0, 192, 4], [68, 30, 40]), CHAR, 16); U(ell(p, [0, 108, -6], [44, 26, 36]), CHAR2, 12);
  charBark(p, 1.5);
  // the core: split open down the front onto a deep glow
  S(ell(p, [0, 150, 40], [20, 46, 14]), 5, GLOW(1)); U(ell(p, [0, 150, 24], [16, 40, 10]), GLOW(1), 4);
  for (let i = 0; i < 6; i++) { const y = 120 + i * 11, w = 16 * Math.sin((i + 0.5) / 6 * Math.PI); U(cap(p, [-w - 6, y, 36], [w + 6, y + 3, 36], 2.4, 2.4), CHAR2, 1.5); }   // charred bars across it
  // chimneys: two hollow stumps on the shoulders, glowing inside
  for (const s of [-1, 1]) { const c = [s * 38, 214, -10]; U(cyl(p, c, 14, 22, 3), CHAR, 6); S(cyl(p, [c[0], c[1] + 8, c[2]], 9, 22, 2), 2, GLOW(1)); }
  for (const [x, y, z, ox, oz] of [[-50, 176, -30, -1, -0.6], [44, 150, -40, 0.7, -1], [0, 214, -30, 0, -1]]) shelf(p, [x, y, z], [ox, 0, oz], 18, 4, 0.1);
  return getD();
}
function furnHead(p) {
  reset();
  U(ell(p, [0, 196, 44], [22, 20, 20]), CHAR, 8); charBark(p, 0.8);
  for (const s of [-1, 1]) { S(sph(p, [s * 8, 200, 60], 5.5), 2, CHAR2); U(sph(p, [s * 8, 200, 58], 3.4), GLOW(1), 0.6); }
  S(ell(p, [0, 185, 60], [13, 4.5, 8]), 2, GLOW(0.9));
  S(p[2] - 26, 2);
  return getD();
}
function furnArm(p, s) {
  reset();
  const sh = [s * 64, 184, 4], el = [s * 80, 116, 22], wr = [s * 78, 54, 34];
  U(sph(p, sh, 22), CHAR, 8); U(cap(p, sh, el, 19, 17), CHAR, 8); U(cap(p, el, wr, 18, 21), CHAR2, 8); charBark(p, 1.1);
  U(ell(p, [wr[0], 34, wr[2] + 4], [25, 22, 25]), CHAR2, 8);
  for (let i = 0; i < 4; i++) { const x = wr[0] + s * (i - 1.5) * 8.5; U(sph(p, [x, 20, wr[2] + 22], 8.5), CHAR, 4); }
  S(p[1] - 6, 2);
  return getD();
}
function furnLeg(p, s) {
  reset();
  U(cap(p, [s * 28, 104, -8], [s * 32, 30, 0], 26, 24), CHAR2, 8); charBark(p, 1.0);
  U(ell(p, [s * 32, 14, 6], [30, 16, 32]), CHAR, 10);
  S(p[1] + 0.5, 1);
  return getD();
}



// ---------------------------------------------------------------- THE HYDRA (heads)
// A clump of inkcaps grown from one root: a squat, rooted mound, and out of it four long necks each ending in a shaggy
// dripping head with a face, swaying apart; a fifth, young, still low. It heals when you stop hurting it.
function hydraHead(p, base, mid, tip, k = 1) {
  chain(p, [base, mid, tip], 9 * k, 7 * k, FLESH(1), 4); fibres(p, mid, 12, 0.4);
  const t = tip, bell = cap(p, [t[0], t[1] + 4 * k, t[2]], [t[0], t[1] + 40 * k, t[2] - 2 * k], 17 * k, 10 * k), hol = cap(p, [t[0], t[1] - 8 * k, t[2]], [t[0], t[1] + 22 * k, t[2]], 13.5 * k, 8 * k);
  const bd = Math.max(bell, -hol, t[1] + 4 * k - p[1]);
  U(bd, CAP(1), 2.5);
  if (bd < 3) P(p[1] - (t[1] + 14 * k), INK, 4 * k);
  for (let i = 0; i < 9; i++) { const a = i * 0.698, x = t[0] + Math.cos(a) * 16.5 * k, z = t[2] + Math.sin(a) * 16.5 * k, L = (Math.sin(a) > 0.4 ? 2 : 6 + (i * 5) % 7) * k; U(cap(p, [x, t[1] + 6 * k, z], [x, t[1] + 6 * k - L, z], 1.7 * k, 1.1 * k), INK, 1.2); }
  for (const s of [-1, 1]) eye(p, [t[0] + s * 4.5 * k, t[1] - 1 * k, t[2] + 8 * k], 1.9 * k);
  S(ell(p, [t[0], t[1] - 8 * k, t[2] + 8 * k], [3.4 * k, 2.6 * k, 4 * k]), 1, GUM);
}
export const B_Hydra = {
  height: 230,
  parts: [
    { role: 'Body', pivot: [0, 50, 0], lo: [-100, -4, -100], hi: [100, 140, 100], h: 2.0, f: hydraBody, tris: 12000 },
    { role: 'Head', pivot: [0, 110, 10], lo: [-50, 90, -40], hi: [50, 262, 70], h: 1.5, f: (p) => { reset(); hydraHead(p, [0, 100, 6], [0, 160, 10], [4, 206, 22], 1.15); return getD(); }, tris: 6000 },
    { role: 'ArmFront', pivot: [40, 100, 4], lo: [20, 80, -50], hi: [140, 230, 60], h: 1.5, f: (p) => { reset(); hydraHead(p, [36, 96, 4], [72, 140, 6], [92, 176, 18]); return getD(); }, tris: 5000 },
    { role: 'ArmBack', pivot: [-40, 100, 4], lo: [-140, 80, -50], hi: [-20, 230, 60], h: 1.5, f: (p) => { reset(); hydraHead(p, [-36, 96, 4], [-74, 136, 2], [-96, 166, 16]); return getD(); }, tris: 5000 },
    { role: 'Tail', pivot: [0, 100, -36], lo: [-60, 80, -150], hi: [60, 250, -20], h: 1.5, f: (p) => { reset(); hydraHead(p, [0, 96, -34], [-10, 150, -70], [-6, 196, -90]); return getD(); }, tris: 5000 },
  ],
};
function hydraBody(p) {
  reset();
  U(ell(p, [0, 54, 0], [78, 54, 72]), FLESH(0.92), 14);
  U(ell(p, [0, 92, 0], [48, 26, 44]), FLESH(0.95), 16);
  fibres(p, [0, 0, 0], 20, 0.8); mold(p, 30, 100, 0.5);
  // roots fanning out into the floor
  for (let i = 0; i < 10; i++) { const a = i * 0.628 + 0.2; rootFinger(p, [[Math.cos(a) * 56, 18, Math.sin(a) * 50], [Math.cos(a) * 84, 6, Math.sin(a) * 78], [Math.cos(a + 0.1) * 104, 1.5, Math.sin(a + 0.1) * 96]], 9, ROOT2); }
  // the young fifth head, low on the front
  hydraHead(p, [10, 70, 44], [18, 86, 62], [20, 102, 74], 0.7);
  for (const [x, z] of [[-40, 30], [44, -26], [-20, -52], [50, 40]]) sprout(p, [x, 70 + Math.random() * 0, z], [x * 0.01, 1, z * 0.01], 12, 7, x > 0);
  S(p[1] + 1, 1); P(p[1] - 14, mixP(FLESH(0.5), C(0x2a2016), 0.5), 8);
  return getD();
}

// ---------------------------------------------------------------- THE MIRROR QUEEN (reflect)
// Tall and still, under a cap like a parasol: a wide, flat, polished disc that shines, a long gown of pale gills falling from
// a slender stalk, thin arms held out. When she shines, what you fire comes back.
const GLASS = C(0xe8eef2), GLASS2 = C(0xb8c4cc);
export const B_MirrorQueen = {
  height: 250,
  parts: [
    { role: 'LegBack', pivot: [-12, 56, 0], lo: [-36, -4, -30], hi: [6, 66, 36], h: 1.4, f: (p) => { reset(); rootLeg(p, [-12, 60, 0], [-13, 32, 5], [-12, 10, 1], 8, 6.5, [[-0.35, 1, 15], [0.05, 1, 18], [0.45, 0.9, 14]], -1); return getD(); } },
    { role: 'LegFront', pivot: [12, 56, 0], lo: [-6, -4, -30], hi: [36, 66, 36], h: 1.4, f: (p) => { reset(); rootLeg(p, [12, 60, 0], [13, 32, 5], [12, 10, 1], 8, 6.5, [[-0.35, 1, 15], [0.05, 1, 18], [0.45, 0.9, 14]], 1); return getD(); } },
    { role: 'Body', pivot: [0, 56, 0], lo: [-60, 14, -60], hi: [60, 196, 60], h: 1.6, f: mirrorBody, tris: 15000 },
    { role: 'ArmBack', pivot: [-15, 172, 2], lo: [-90, 90, -30], hi: [-2, 182, 50], h: 1.3, f: (p) => { reset(); rootArm(p, [-15, 172, 2], [-40, 150, 12], [-62, 132, 24], 4.6, 4, 22, -1); return getD(); } },
    { role: 'ArmFront', pivot: [15, 172, 2], lo: [2, 90, -30], hi: [90, 182, 50], h: 1.3, f: (p) => { reset(); rootArm(p, [15, 172, 2], [40, 150, 12], [62, 132, 24], 4.6, 4, 22, 1); return getD(); } },
    { role: 'Head', pivot: [0, 180, 2], lo: [-96, 160, -96], hi: [96, 262, 96], h: 1.7, f: mirrorHead, tris: 9000 },
  ],
};
function mirrorBody(p) {
  reset();
  U(cap(p, [0, 56, 0], [0, 190, 2], 12, 9), FLESH(1), 6); fibres(p, [0, 0, 0], 14, 0.4);
  for (const s of [-1, 1]) U(ell(p, [s * 13, 170, 2], [5, 4.5, 5]), ROOT, 3);
  // the gown: gills falling from the shoulders to the floor in pleats
  const rr = len(p[0], 0, p[2] - 2), a = Math.atan2(p[2] - 2, p[0]), t = clamp((176 - p[1]) / 160, 0, 1), R = 14 + t * 40 + Math.sin(a * 18) * 2.6 * t;
  U(Math.max(Math.abs(rr - R) - 2.2, p[1] - 176, 18 - p[1] + Math.sin(a * 7) * 3), mixP(FLESH(1), GLASS, 0.3), 2);
  if (Math.abs(rr - R) < 4) P(-Math.abs(Math.sin(a * 18)) + 0.25, mixP(FLESH(0.7), CAP(0.3), 0.3), 0.45);
  return getD();
}
function mirrorHead(p) {
  reset();
  U(cap(p, [0, 176, 2], [0, 206, 2], 9.5, 10), FLESH(1), 4);
  for (const s of [-1, 1]) eye(p, [s * 4.8, 194, 10.6], 2.1);
  S(ell(p, [0, 187, 10.4], [3, 1.6, 3]), 1, GUM);
  // the parasol: wide, flat, polished, rimmed in the strain's colour
  const q = [p[0], p[1] - 214, p[2] - 2], rr = len(q[0], 0, q[2]);
  const disc = Math.max(ell(q, [0, 0, 0], [86, 14, 86]), -ell(q, [0, -10, 0], [80, 12, 80]));
  U(disc, GLASS, 3);
  if (disc < 3) { P(76 - rr, mixP(CAP(1), GLASS2, 0.2), 3); if (q[1] > 0) P(len(q[0] + 30, 0, q[2] + 20) - 18, C(0xffffff), 8); }   // the rim in the strain's colour, a shine across the top
  if (disc < 3) { P(q[1] + 3, mixP(FLESH(1), GLASS, 0.3), 2); if (q[1] < -2) P(Math.abs(Math.sin(Math.atan2(q[2], q[0]) * 30)) - 0.25, mixP(FLESH(0.7), CAP(0.25), 0.3), 0.15); }
  U(sph(p, [0, 230, 2], 8), mixP(CAP(1), GLASS, 0.3), 4);   // the boss on top
  return getD();
}

// ---------------------------------------------------------------- THE UNBLINKING (vortex)
// A floating puffball that is one great eye: a lidded ball, the lids folds of cap, the eye wet and lit, its pupil a slit,
// and under it a fringe of grasping hyphae. It looks at you, and you come.
export const B_Unblinking = {
  height: 200,
  parts: [
    { role: 'Tail', pivot: [0, 70, 0], lo: [-60, -6, -60], hi: [60, 80, 60], h: 1.5, f: (p) => { reset(); for (let i = 0; i < 14; i++) { const a = i * 0.449, r = 26 + (i % 3) * 8, L = 46 + (i * 11) % 24, b = [Math.cos(a) * r, 74, Math.sin(a) * r]; const pts = []; for (let k = 0; k <= 5; k++) { const t = k / 5; pts.push([b[0] * (1 + t * 0.3) + Math.sin(t * 6 + i) * 4, b[1] - t * L, b[2] * (1 + t * 0.3)]); } chain(p, pts, 3, 1, ROOT2, 1.5); } return getD(); }, tris: 4000 },
    { role: 'Body', pivot: [0, 130, 0], lo: [-90, 56, -90], hi: [90, 232, 90], h: 1.9, f: unblinkBody, tris: 12000 },
    { role: 'Head', pivot: [0, 130, 30], lo: [-60, 80, 20], hi: [60, 182, 96], h: 1.4, f: unblinkEye, tris: 8000 },
  ],
};
function unblinkBody(p) {
  reset();
  U(sph(p, [0, 132, 0], 72), CAP(1), 4);
  { const [d1] = cells(p[0] * 0.07, p[1] * 0.07, p[2] * 0.07); bump(-Math.max(0, 0.3 - d1) * 3); }
  P(-fbm(p[0] * 0.05, p[1] * 0.05, p[2] * 0.05) - 0.2, CAP(0.78), 0.15);
  // the socket in front
  S(ell(p, [0, 132, 68], [44, 34, 28]), 4, mixP(CAP(0.4), C(0x100808), 0.5));
  // lids: heavy folds above and below
  U(cap(p, [-46, 158, 54], [46, 158, 54], 10, 10), CAP(0.85), 8); U(cap(p, [-40, 104, 58], [40, 104, 58], 8, 8), CAP(0.85), 8);
  crown(p, [0, 196, 0], 26, 9, 18, 7, 0.4);
  for (let i = 0; i < 10; i++) { const a = i * 0.628 + 0.4; if (Math.sin(a) < 0.3) pore(p, [Math.cos(a) * 71, 130 + Math.sin(i * 1.7) * 18, Math.sin(a) * 71], 3.4, [Math.cos(a), 0, Math.sin(a)]); }
  return getD();
}
function unblinkEye(p) {
  reset();
  const c = [0, 132, 46];
  U(sph(p, c, 36), C(0xece2cc), 2);
  // the iris: a lit ring; the pupil: a dark vertical slit; veins on the white
  const q = [p[0] - c[0], p[1] - c[1], p[2] - c[2]], r2 = len(q[0], q[1], 0);
  if (q[2] > 0) { P(r2 - 21, GLOW(1), 1); P(len(q[0] / 3.2, q[1] / 15, 0) - 1, C(0x080406), 0.4); P(Math.abs(fbm(p[0] * 0.08, p[1] * 0.08, 0)) * 30 - 0.8 + Math.max(0, 22 - r2) * 9, C(0xb04a3a), 0.6); }
  S(p[2] - 26, 2);
  return getD();
}

// ---------------------------------------------------------------- THE REAPER (stealth)
// A mantis of root and stalk: a thin upright body on four jointed legs, two long scythes of sharpened root folded in front,
// a tall narrow head with a split gill mouth and two great lit eyes. You see it when it strikes.
export const B_Reaper = {
  height: 230,
  parts: [
    { role: 'LegBack', pivot: [-14, 80, -20], lo: [-90, -4, -110], hi: [4, 116, 40], h: 1.4, f: (p) => { reset(); mantisLeg(p, -1, -20); mantisLeg(p, -1, -56); return getD(); } },
    { role: 'LegFront', pivot: [14, 80, -20], lo: [-4, -4, -110], hi: [90, 116, 40], h: 1.4, f: (p) => { reset(); mantisLeg(p, 1, -20); mantisLeg(p, 1, -56); return getD(); } },
    { role: 'Body', pivot: [0, 80, -20], lo: [-36, 50, -130], hi: [36, 190, 50], h: 1.5, f: mantisBody, tris: 8000 },
    { role: 'ArmBack', pivot: [-12, 168, 26], lo: [-50, 60, 0], hi: [10, 200, 140], h: 1.3, f: (p) => mantisArm(p, -1), tris: 4000 },
    { role: 'ArmFront', pivot: [12, 168, 26], lo: [-10, 60, 0], hi: [50, 200, 140], h: 1.3, f: (p) => mantisArm(p, 1), tris: 4000 },
    { role: 'Head', pivot: [0, 184, 30], lo: [-30, 176, 10], hi: [30, 250, 70], h: 1.2, f: mantisHead, tris: 5000 },
  ],
};
function mantisLeg(p, s, z) {
  const hip = [s * 12, 84, z], knee = [s * 52, 104, z + (z > -30 ? 10 : -14)], foot = [s * 66, 1.5, z + (z > -30 ? 22 : -34)];
  chain(p, [hip, knee], 4.6, 3.6, ROOT, 2); U(sph(p, knee, 4.4), ROOT2, 2);
  chain(p, [knee, [s * 62, 50, (knee[2] + foot[2]) / 2], foot], 3.6, 1.2, ROOT2, 1.5);
  U(cap(p, [s * 2, 102, z], hip, 6.5, 5), ROOT, 3);   // the hip runs up deep into the body, so a leg swung on its shared pivot never pulls out
  S(p[1] + 0.5, 1);
}
function mantisBody(p) {
  reset();
  // the abdomen behind, low and long; the thorax rising upright to the shoulders
  U(ell(p, [0, 92, -72], [22, 18, 52]), mixP(FLESH(0.9), CAP(0.3), 0.3), 8);
  { const t = along(p, [0, 92, -30], [0, 92, -124]); bump(Math.abs(Math.sin(t * 30)) < 0.2 ? 0.8 : 0); }
  chain(p, [[0, 86, -24], [0, 120, 0], [0, 160, 18], [0, 182, 26]], 13, 9, FLESH(1), 6); fibres(p, [0, 0, 0], 12, 0.5);
  sprout(p, [0, 110, -96], [0, 1, -0.4], 12, 7, true); sprout(p, [-8, 108, -60], [-0.4, 1, 0], 9, 5); sprout(p, [8, 104, -110], [0.5, 1, -0.4], 8, 4.6, true);
  mold(p, 70, 180, 0.5);
  return getD();
}
function mantisArm(p, s) {
  reset();
  const sh = [s * 12, 168, 26], el = [s * 18, 130, 58], wr = [s * 16, 172, 92];
  chain(p, [sh, el], 5.4, 4.6, ROOT, 2); U(sph(p, el, 5.2), ROOT2, 2); chain(p, [el, wr], 4.6, 3.8, ROOT2, 2);
  // the scythe: a long curved blade of hardened root folding back down
  const pts = []; for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push([s * (16 + t * 2), 172 - Math.sin(t * 2.6) * 30 - t * 70, 92 + Math.sin(t * 2.2) * 26 - t * 30]); }
  for (let k = 0; k < 8; k++) U(cap(p, pts[k], pts[k + 1], 3.6 * (1 - k / 9) + 0.6, 3.6 * (1 - (k + 1) / 9) + 0.6), mixP(C(0x2a1e16), CAP(0.5), 0.35), 1.5);
  for (let k = 1; k < 8; k += 2) U(cap(p, pts[k], [pts[k][0], pts[k][1] - 5, pts[k][2] + 5], 1.2, 0.3), TOOTH, 0.6);   // serrations
  return getD();
}
function mantisHead(p) {
  reset();
  U(cap(p, [0, 180, 28], [0, 206, 34], 7, 9), FLESH(1), 3);
  U(ell(p, [0, 216, 38], [16, 18, 12]), CAP(1), 4);
  U(cap(p, [0, 228, 34], [0, 246, 30], 7, 2), CAP(0.8), 3);   // a crest
  for (const s of [-1, 1]) { U(ell(p, [s * 12, 220, 44], [6, 8, 6]), GLOW(1), 1); }
  S(ell(p, [0, 204, 48], [4, 7, 6]), 1, GUM);
  for (const s of [-1, 1]) chain(p, [[s * 4, 200, 46], [s * 7, 194, 50], [s * 5, 188, 52]], 1.6, 0.5, TOOTH, 0.6);   // mandibles
  S(p[1] - 178, 1);
  return getD();
}

// ---------------------------------------------------------------- GRANDFATHER TOAD (tide)
// An old toad the size of a hut, warty all over, a garden of mushrooms grown on its back, a wide lipless mouth, two lit
// eyes on top of its head. When it croaks the floor floods. Four-footed (beast rig).
const TOAD = C(0x5a6038), TOAD2 = C(0x464c2c), TOADB = C(0xc8b880);
export const B_Toad = {
  height: 170, beast: true,
  parts: [
    { role: 'LegBack', pivot: [-60, 40, -40], lo: [-130, -4, -110], hi: [-30, 90, 10], h: 1.8, f: (p) => toadHind(p, -1) },
    { role: 'LegFront', pivot: [60, 40, -40], lo: [30, -4, -110], hi: [130, 90, 10], h: 1.8, f: (p) => toadHind(p, 1) },
    { role: 'Body', pivot: [0, 50, 0], lo: [-110, 4, -110], hi: [110, 176, 110], h: 2.2, f: toadBody, tris: 14000 },
    { role: 'ArmBack', pivot: [-50, 50, 50], lo: [-96, -4, 20], hi: [-20, 76, 110], h: 1.5, f: (p) => toadFore(p, -1) },
    { role: 'ArmFront', pivot: [50, 50, 50], lo: [20, -4, 20], hi: [96, 76, 110], h: 1.5, f: (p) => toadFore(p, 1) },
    { role: 'Head', pivot: [0, 80, 60], lo: [-90, 30, 30], hi: [90, 150, 140], h: 1.8, f: toadHead, tris: 9000 },
  ],
};
function warts(p, k = 2.2, f = 0.12) { const [d1] = cells(p[0] * f, p[1] * f, p[2] * f); bump(-Math.max(0, 0.32 - d1) * k * 3); }
function toadBody(p) {
  reset();
  U(ell(p, [0, 68, -10], [86, 56, 84]), TOAD, 12); U(ell(p, [0, 38, -6], [80, 30, 76]), TOADB, 14);
  warts(p, 2.6, 0.07); P(p[1] - 46, TOADB, 8);
  P(-fbm(p[0] * 0.04, p[1] * 0.04, p[2] * 0.04) - 0.1, TOAD2, 0.15);
  // the garden on its back
  for (const [x, z, L, r, g] of [[0, -10, 26, 16, 1], [-34, 10, 18, 11, 0], [30, -30, 20, 12, 1], [-20, -46, 16, 10, 0], [40, 16, 14, 9, 0], [-50, -20, 12, 8, 1], [14, 30, 12, 8, 0], [-4, -60, 14, 9, 1]]) { const y = 68 + 56 * Math.sqrt(Math.max(0, 1 - (x / 86) ** 2 - ((z + 10) / 84) ** 2)) - 3; sprout(p, [x, y, z], [x * 0.008, 1, z * 0.006], L, r, !!g); }
  P(ell(p, [0, 120, -10], [60, 10, 60]) + fbm(p[0] * 0.08, 0, p[2] * 0.08) * 10, mixP(CAP(0.7), TOAD2, 0.3), 4);
  S(p[1] + 1, 1);
  return getD();
}
function toadHead(p) {
  reset();
  U(ell(p, [0, 84, 70], [72, 40, 50]), TOAD, 12); warts(p, 2, 0.09);
  U(ell(p, [0, 58, 78], [68, 18, 46]), TOADB, 10);
  // the mouth: a wide slit all round the front
  S(Math.max(ell(p, [0, 70, 84], [70, 5, 48]), -ell(p, [0, 70, 70], [50, 8, 30])), 2, GUM);
  // eyes on top, in raised domes
  for (const s of [-1, 1]) { U(sph(p, [s * 34, 118, 74], 16), TOAD2, 6); eye(p, [s * 34, 124, 84], 8, [s * 0.3, 0.3, 0.9]); }
  P(p[1] - 66, TOADB, 6);
  S(p[2] - 34, 2);
  return getD();
}
function toadFore(p, s) {
  reset();
  chain(p, [[s * 50, 52, 50], [s * 64, 26, 70], [s * 66, 6, 80]], 12, 8, TOAD, 4); warts(p, 1.4);
  for (let i = -1; i <= 1; i++) chain(p, [[s * 66, 5, 82], [s * 66 + i * 9, 2, 96]], 4, 2.6, TOADB, 2);
  S(p[1] + 0.5, 1);
  return getD();
}
function toadHind(p, s) {
  reset();
  U(ell(p, [s * 70, 44, -44], [30, 36, 42]), TOAD, 10); warts(p, 1.6, 0.1);
  chain(p, [[s * 84, 26, -22], [s * 100, 8, -60], [s * 96, 4, -24]], 10, 7, TOAD2, 4);
  for (let i = -1; i <= 1; i++) chain(p, [[s * 96, 4, -20], [s * 96 + s * i * 10, 1.5, -2]], 3.6, 2.2, TOADB, 2);
  S(p[1] + 0.5, 1);
  return getD();
}



// ---------------------------------------------------------------- THE ROTWING (strafe)
// A dragon the Blight grew: a long body of pale stalk ribbed with root, a beaked bracket of a skull with lit eyes, a crest
// of caps down its neck and back, wings of torn gill-membrane stretched on finger-roots, and a long tail. It flies, and
// draws lines of fire through where you stand.
export const B_Rotwing = {
  height: 170,
  parts: [
    { role: 'Tail', pivot: [0, 90, -50], lo: [-40, 30, -200], hi: [40, 120, -40], h: 1.5, f: rotTail, tris: 4000 },
    { role: 'Body', pivot: [0, 92, 0], lo: [-50, 44, -90], hi: [50, 150, 96], h: 1.6, f: rotBody, tris: 9000 },
    { role: 'WingBack', pivot: [-24, 116, 10], lo: [-210, 60, -90], hi: [-14, 190, 70], h: 1.5, f: (p) => rotWing(p, -1), tris: 6000 },
    { role: 'WingFront', pivot: [24, 116, 10], lo: [14, 60, -90], hi: [210, 190, 70], h: 1.5, f: (p) => rotWing(p, 1), tris: 6000 },
    { role: 'Head', pivot: [0, 110, 74], lo: [-34, 80, 60], hi: [34, 160, 180], h: 1.3, f: rotHead, tris: 7000 },
  ],
};
function rotBody(p) {
  reset();
  chain(p, [[0, 92, -60], [0, 96, -20], [0, 104, 30], [0, 112, 70], [0, 116, 86]], 22, 11, FLESH(1), 10); fibres(p, [0, 0, 0], 16, 0.6);
  for (let i = 0; i < 7; i++) for (const s of [-1, 1]) { const z = 50 - i * 14, r = 19 - i * 0.6; chain(p, [[0, 98 + r * 0.95, z], [s * r * 0.8, 98 + r * 0.6, z - 1], [s * r * 1.02, 96 - r * 0.1, z - 2], [s * r * 0.8, 96 - r * 0.6, z - 3]], 2.1, 1.5, ROOT, 2); }   // ribs of root round the body
  for (let i = 0; i < 8; i++) { const z = 80 - i * 18, y = 124 - Math.abs(z - 20) * 0.1; sprout(p, [0, y, z], [0, 1, -0.3], 10 - i * 0.6, 6.5 - i * 0.3, i % 2 === 0); }
  for (const s of [-1, 1]) chain(p, [[s * 12, 80, 30], [s * 16, 60, 40], [s * 14, 52, 54]], 4, 2.4, ROOT2, 2);   // little forelegs tucked under
  mold(p, 70, 130, 0.5);
  return getD();
}
function rotHead(p) {
  reset();
  chain(p, [[0, 114, 76], [0, 122, 100], [0, 124, 118]], 11, 9, FLESH(1), 6);
  // the skull: a beak of layered bracket, hooked, the eyes lit in deep sockets, a crest of caps
  U(ell(p, [0, 126, 132], [17, 15, 20]), CAP(1), 6);
  U(cap(p, [0, 124, 140], [0, 112, 172], 12, 2.5), CAP(0.85), 5);   // the upper beak, hooked down
  U(cap(p, [0, 112, 138], [0, 106, 164], 8, 2), CAP(0.7), 4);   // the lower beak
  S(cap(p, [0, 114, 140], [0, 110, 166], 3.5, 1.5), 1, GUM);
  if (p[2] > 118) P(-Math.sin((p[2] - 120) * 0.4) - 0.3, CAP(0.72), 0.3);
  for (const s of [-1, 1]) { S(sph(p, [s * 11, 132, 140], 5), 2, DARK); U(sph(p, [s * 11, 132, 138.5], 3.2), GLOW(1), 0.6); }
  for (let i = 0; i < 4; i++) sprout(p, [0, 138 - i * 3, 128 - i * 9], [0, 1, -0.5], 10 - i, 5.5 - i * 0.6, i === 0);
  S(p[2] - 70, 2);
  return getD();
}
function rotWing(p, s) {
  reset();
  // the arm-root along the leading edge, finger-roots spreading, membrane between them
  const sh = [s * 22, 118, 12], el = [s * 80, 150, 20], wr = [s * 140, 160, 4];
  chain(p, [sh, el, wr], 6, 3.4, ROOT, 3); U(sph(p, el, 5.6), ROOT2, 2);
  const tips = [[s * 200, 150, -20], [s * 186, 116, -50], [s * 150, 92, -70], [s * 100, 84, -70]];
  for (const t of tips) chain(p, [wr, [(wr[0] + t[0]) / 2, (wr[1] + t[1]) / 2 + 3, (wr[2] + t[2]) / 2], t], 2.6, 0.8, ROOT2, 1.5);
  // the membrane: a thin, sagging sheet bounded by the leading edge, the fingers and the body
  const u = Math.abs(p[0]), tri = (a, b, c) => { const n = [(b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])]; const l = len(...n) || 1; return ((p[0] - a[0]) * n[0] + (p[1] - a[1]) * n[1] + (p[2] - a[2]) * n[2]) / l; };
  const pl = [sh, wr, [s * 200, 150, -20], [s * 186, 116, -50], [s * 150, 92, -70], [s * 100, 84, -70], [s * 30, 96, -40]];
  let mem = 1e9;
  for (let i = 1; i < pl.length - 1; i++) { const a = pl[0], b = pl[i], c = pl[i + 1];
    // inside the triangle a b c (in its plane), thin
    const d = Math.abs(tri(a, b, c)) - 1.9; const e1 = edgeIn(p, a, b, c), e2 = edgeIn(p, b, c, a), e3 = edgeIn(p, c, a, b); mem = Math.min(mem, Math.max(d, e1, e2, e3)); }
  const sag = Math.sin(clamp((u - 22) / 180, 0, 1) * Math.PI) * 0;
  U(mem + sag, mixP(FLESH(0.75), CAP(0.5), 0.4), 1.5);
  // the trailing edge scalloped between the finger tips, like a bat's, not cut straight
  const ends = [wr, ...tips, [s * 30, 96, -40]];
  for (let i = 1; i < ends.length - 1; i++) { const A = ends[i], B = ends[i + 1], m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2], R = len(A[0] - B[0], A[1] - B[1], A[2] - B[2]) * 0.5, o = [m[0] - sh[0], m[1] - sh[1], m[2] - sh[2]], ol = len(...o) || 1;
    S(sph(p, [m[0] + o[0] / ol * R * 0.05, m[1] + o[1] / ol * R * 0.05, m[2] + o[2] / ol * R * 0.05], R * 0.6), 3); }
  // darker along the fingers and the arm, mottled with mold between them
  if (mem < 3) { let near = 1e9; for (const t of tips) near = Math.min(near, cap(p, wr, t, 0)); near = Math.min(near, cap(p, sh, wr, 0));
    P(near - 9, mixP(CAP(0.55), C(0x1a1008), 0.35), 4); P(-fbm(p[0] * 0.05 + s, p[1] * 0.05, p[2] * 0.05) - 0.18, mixP(CAP(0.85), MYC2, 0.4), 0.1);
    if (fbm(p[0] * 0.11, p[1] * 0.11, p[2] * 0.11) > 0.42 && near > 12) P(-1, GLOW(0.55), 0.5); }
  // tears in it
  for (const [x, y, z, r] of [[150, 112, -40, 6], [108, 100, -50, 4.5]]) S(sph(p, [s * x, y, z], r), 1.5, CAP(0.5));
  return getD();
}
// a signed distance to the half-plane on the inside of edge a-b of triangle a b c (negative inside)
function edgeIn(p, a, b, c) {
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], n = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
  const e = [ab[1] * n[2] - ab[2] * n[1], ab[2] * n[0] - ab[0] * n[2], ab[0] * n[1] - ab[1] * n[0]], l = len(...e) || 1;   // in-plane perpendicular to ab, toward c
  const sgn = (e[0] * ac[0] + e[1] * ac[1] + e[2] * ac[2]) > 0 ? -1 : 1;
  return sgn * ((p[0] - a[0]) * e[0] + (p[1] - a[1]) * e[1] + (p[2] - a[2]) * e[2]) / l;
}
function rotTail(p) {
  reset();
  const pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push([Math.sin(t * 4) * 12 * t, 92 - t * 26 + Math.sin(t * 3) * 6, -54 - t * 140]); }
  chain(p, pts, 11, 2, FLESH(0.95), 4); fibres(p, [0, 0, 0], 12, 0.4);
  for (let k = 1; k < 10; k += 2) sprout(p, [pts[k][0], pts[k][1] + 7 - k * 0.5, pts[k][2]], [0, 1, -0.3], 8 - k * 0.5, 5 - k * 0.3, k === 1);
  const e = pts[10]; for (const s of [-1, 1]) U(Math.max(ell(p, [e[0] + s * 8, e[1], e[2] + 4], [12, 2, 16]), 0), mixP(FLESH(0.75), CAP(0.5), 0.4), 2);   // a spade of membrane
  return getD();
}

// ---------------------------------------------------------------- THE STUMP TITAN (ward)
// A titan of stumps: a great cut trunk for a body, its rings showing at the shoulders, a smaller stump of a head with a
// crown of shelves and two lit knots for eyes, arms of whole fallen trunks, a heart of light in a hollow in its chest. While
// its idols stand it cannot be hurt.
export const B_Titan = {
  height: 250, budget: 1.4,
  parts: [
    { role: 'LegBack', pivot: [-32, 96, -6], lo: [-80, -4, -56], hi: [4, 124, 50], h: 2.1, f: (p) => furnLegT(p, -1) },
    { role: 'LegFront', pivot: [32, 96, -6], lo: [-4, -4, -56], hi: [80, 124, 50], h: 2.1, f: (p) => furnLegT(p, 1) },
    { role: 'Body', pivot: [0, 96, 0], lo: [-110, 70, -90], hi: [110, 236, 90], h: 2.3, f: titanBody, tris: 14000 },
    { role: 'ArmBack', pivot: [-74, 190, 4], lo: [-140, -4, -46], hi: [-36, 226, 86], h: 1.9, f: (p) => titanArm(p, -1) },
    { role: 'ArmFront', pivot: [74, 190, 4], lo: [36, -4, -46], hi: [140, 226, 86], h: 1.9, f: (p) => titanArm(p, 1) },
    { role: 'Head', pivot: [0, 214, 10], lo: [-56, 196, -50], hi: [56, 290, 60], h: 1.6, f: titanHead, tris: 8000 },
  ],
};
function rings(p, c, y) { const rr = len(p[0] - c[0], 0, p[2] - c[2]); if (Math.abs(p[1] - y) < 3) { P(-Math.abs(Math.sin(rr * 0.55)) + 0.25, WOOD, 0.2); P(Math.abs(Math.sin(rr * 0.55)) - 0.25, mixP(WOOD, BARKD, 0.4), 0.2); } }
function titanBody(p) {
  reset();
  U(cyl(p, [0, 150, 0], 62, 72, 14), BARK, 16); U(ell(p, [0, 104, -4], [52, 30, 44]), BARK2, 14);
  bark(p, 1.8);
  rings(p, [0, 0, 0], 222);
  // the hollow in the chest with its heart
  S(ell(p, [0, 162, 52], [24, 30, 22]), 4, BARKD); U(sph(p, [0, 162, 40], 13), GLOW(1), 2);
  for (const [x, y, z, ox, oz] of [[-58, 196, -30, -1, -0.5], [56, 176, -36, 1, -0.6], [-20, 140, -60, -0.3, -1], [30, 120, -56, 0.4, -1], [0, 200, -56, 0, -1]]) shelf(p, [x, y, z], [ox, 0, oz], 22, 5, 0.12);
  P(fbm(p[0] * 0.04, p[1] * 0.04, p[2] * 0.04) * 30 + (216 - p[1]) * 0.4 - 6, MOSS, 6);
  return getD();
}
function titanHead(p) {
  reset();
  U(cyl(p, [0, 236, 6], 30, 26, 8), BARK, 8); bark(p, 1.2); rings(p, [0, 0, 6], 261);
  for (const s of [-1, 1]) { S(sph(p, [s * 12, 238, 34], 6.5), 2, BARKD); U(sph(p, [s * 12, 238, 31], 4.2), GLOW(1), 0.6); }
  S(ell(p, [0, 222, 34], [14, 4, 8]), 2, GUM);
  for (let i = 0; i < 7; i++) { const a = i * 0.9 + 0.3; shelf(p, [Math.cos(a) * 26, 262 - (i % 2) * 6, 6 + Math.sin(a) * 26], [Math.cos(a), 0, Math.sin(a)], 14, 3.4, 0.25); }
  sprout(p, [0, 262, 6], [0, 1, 0], 16, 9, true);
  S(p[1] - 200, 2);
  return getD();
}
function titanArm(p, s) {
  reset();
  const sh = [s * 76, 192, 4], el = [s * 92, 116, 24], wr = [s * 90, 46, 36];
  U(sph(p, sh, 26), BARK, 8); U(cap(p, sh, el, 22, 20), BARK, 8); U(cap(p, el, wr, 21, 24), BARK2, 8); bark(p, 1.2);
  U(ell(p, [wr[0], 26, wr[2] + 6], [30, 26, 30]), BARK2, 10);
  for (let i = 0; i < 4; i++) { const x = wr[0] + s * (i - 1.5) * 10; U(sph(p, [x, 12, wr[2] + 28], 10), BARK, 5); }
  rootlets(p, [wr[0], 10, wr[2] + 10], [s * 0.3, -0.4, 0.6], 5, 22, 3, s > 0 ? 5 : 9, ROOT2);
  shelf(p, [s * 84, 214, -10], [s, 0, -0.3], 22, 5);
  P(fbm(p[0] * 0.05, p[1] * 0.05, p[2] * 0.05) * 30 + (200 - p[1]) * 0.5 - 6, MOSS, 6);
  S(p[1] + 0.5, 1);
  return getD();
}
function furnLegT(p, s) {
  reset();
  U(cap(p, [s * 32, 108, -6], [s * 36, 30, 0], 30, 28), BARK2, 8); bark(p, 1.1);
  U(ell(p, [s * 36, 14, 8], [36, 18, 36]), BARK, 10);
  for (const [ax, az, l] of [[-0.6, 1, 32], [0.1, 1, 36], [0.7, 0.7, 30], [0.2, -1, 22]]) { const dx = ax * s; rootFinger(p, [[s * 36, 12, 8 + az * 12], [s * 36 + dx * l * 0.6, 6, 8 + az * l * 0.7], [s * 36 + dx * l, 1.4, 8 + az * l]], 8, ROOT2); }
  S(p[1] + 0.5, 1); P(p[1] - 16, ROOTD, 8);
  return getD();
}

// ---------------------------------------------------------------- THE LEVIATHAN (ward)
// What the Blight has grown under everything, pushing one head up into the room: a vast ridged dome of a cap like a brain,
// a ring of lit eyes round its brow, a lamprey maw under it, and below, a fringe of roots as thick as legs. While its
// tentacles stand it cannot be hurt.
export const B_Leviathan = {
  height: 200,
  parts: [
    { role: 'Tail', pivot: [0, 70, 0], lo: [-90, -6, -90], hi: [90, 80, 90], h: 1.7, f: (p) => { reset(); for (let i = 0; i < 12; i++) { const a = i * 0.5236 + 0.2, b = [Math.cos(a) * 50, 76, Math.sin(a) * 50]; const pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push([b[0] * (1 + t * 0.5) + Math.sin(t * 5 + i) * 6, b[1] - t * 70, b[2] * (1 + t * 0.5) + Math.cos(t * 4 + i) * 6]); } chain(p, pts, 8, 2, ROOT, 3); } return getD(); }, tris: 6000 },
    { role: 'Body', pivot: [0, 120, 0], lo: [-100, 60, -100], hi: [100, 236, 100], h: 2.0, f: levBody, tris: 14000 },
    { role: 'Head', pivot: [0, 100, 40], lo: [-50, 56, 20], hi: [50, 124, 110], h: 1.4, f: levMaw, tris: 7000 },
  ],
};
function levBody(p) {
  reset();
  U(ell(p, [0, 140, 0], [84, 64, 80]), CAP(1), 6);
  // brain-like ridges wandering over the dome
  { const n = fbm(p[0] * 0.035, p[1] * 0.035, p[2] * 0.035); bump(Math.abs(n) < 0.06 ? 2.6 : 0); P(Math.abs(n) - 0.06, CAP(0.62), 0.03); }
  U(ell(p, [0, 96, 0], [70, 22, 66]), FLESH(0.9), 12);
  // the brow: a ring of eyes
  for (let i = 0; i < 9; i++) { const a = (i - 4) * 0.28, r = 80; eye(p, [Math.sin(a) * r, 132 - Math.abs(i - 4) * 3, Math.cos(a) * r * 0.97], 5.4 - Math.abs(i - 4) * 0.5); }
  crown(p, [0, 200, 0], 34, 12, 20, 7, 0.2);
  return getD();
}
function levMaw(p) {
  reset();
  U(ell(p, [0, 92, 64], [40, 26, 34]), FLESH(0.9), 6);
  S(ell(p, [0, 88, 86], [28, 20, 24]), 3, GUM); S(ell(p, [0, 88, 76], [14, 10, 14]), 2, GLOW(1));
  for (let ring = 0; ring < 3; ring++) for (let i = 0; i < 16; i++) { const a = i * 0.3927 + ring * 0.2, r = 26 - ring * 6, z = 88 - ring * 5, b = [Math.cos(a) * r, 88 + Math.sin(a) * r * 0.75, z], tip = [Math.cos(a) * r * 0.62, 88 + Math.sin(a) * r * 0.75 * 0.62, z - 6]; U(cap(p, b, tip, 2.4, 0.4), TOOTH, 0.6); }
  S(p[2] - 26, 2);
  return getD();
}

// ---------------------------------------------------------------- THE DEVOURER (devour)
// A mouth that learned to walk: a great ball that is almost all maw, ringed with rows of teeth, its lips puckered and
// lit inside, carried low on six thick root legs. It calls its food and eats what you leave alive.
export const B_Devourer = {
  height: 170,
  parts: [
    ...[[1, 30, 1], [1, -6, -1], [1, -40, 1], [-1, 30, -1], [-1, -6, 1], [-1, -40, -1]].map(([s, z, ph]) => ({ role: ph > 0 ? 'LegFront' : 'LegBack', pivot: [s * 56, 64, z], lo: s > 0 ? [30, -4, z - 60] : [-160, -4, z - 60], hi: s > 0 ? [160, 120, z + 60] : [-30, 120, z + 60], h: 1.7, f: (p) => devLeg(p, s, z) })),
    { role: 'Body', pivot: [0, 70, 0], lo: [-100, 20, -110], hi: [100, 190, 110], h: 2.0, f: devBody, tris: 14000 },
    { role: 'Head', pivot: [0, 100, 50], lo: [-80, 30, 30], hi: [80, 170, 130], h: 1.6, f: devMaw, tris: 10000 },
  ],
};
function devLeg(p, s, z) {
  reset();
  const fz = z * 1.4, hip = [s * 56, 70, z], knee = [s * 104, 104, (z + fz) / 2], foot = [s * 132, 1.5, fz];
  chain(p, [hip, [s * 80, 96, z], knee], 12, 10, ROOT, 4); U(sph(p, knee, 11), ROOT2, 4); chain(p, [knee, [s * 124, 56, (knee[2] + foot[2]) / 2], foot], 10, 4, ROOT2, 3); bark(p, 0.5);
  S(p[1] + 0.5, 1);
  return getD();
}
function devBody(p) {
  reset();
  U(ell(p, [0, 108, -10], [82, 70, 86]), CAP(1), 6);
  { const [d1] = cells(p[0] * 0.06, p[1] * 0.06, p[2] * 0.06); bump(-Math.max(0, 0.3 - d1) * 3.6); }
  P(-fbm(p[0] * 0.05, p[1] * 0.05, p[2] * 0.05) - 0.2, CAP(0.75), 0.15);
  for (const [x, z] of [[-30, -40], [20, -60], [40, -10], [-50, 10], [0, -80]]) sprout(p, [x, 168 - Math.abs(x) * 0.3, z], [x * 0.01, 1, -0.2], 14, 8, x > 0);
  for (let i = 0; i < 10; i++) { const a = i * 0.628 + 0.4; if (Math.sin(a) < 0.2) pore(p, [Math.cos(a) * 80, 110 + Math.sin(i * 1.3) * 22, -10 + Math.sin(a) * 84], 4, [Math.cos(a), 0, Math.sin(a)]); }
  return getD();
}
function devMaw(p) {
  reset();
  // puckered lips round a huge round mouth facing forward
  const m = [0, 104, 82];
  U(torus(rotX(p, m, 1.5708), m, 46, 14), mixP(CAP(0.8), FLESH(0.3), 0.3), 8);
  U(cap(p, [0, 104, 38], [0, 104, 76], 50, 47), CAP(0.72), 10);   // the collar of flesh the lips are pursed out on, grown from the body
  S(ell(p, [0, 104, 70], [42, 42, 40]), 4, GUM); S(ell(p, [0, 104, 50], [24, 24, 24]), 3, GLOW(1));
  for (let ring = 0; ring < 3; ring++) for (let i = 0; i < 20; i++) { const a = i * 0.3142 + ring * 0.15, r = 40 - ring * 9, z = 86 - ring * 9, b = [Math.cos(a) * r, 104 + Math.sin(a) * r, z], tip = [Math.cos(a) * r * 0.66, 104 + Math.sin(a) * r * 0.66, z - 8]; U(cap(p, b, tip, 3, 0.5), TOOTH, 0.6); }
  for (const s of [-1, 1]) eye(p, [s * 26, 154, 54], 5, [s * 0.2, 0.5, 0.85]);   // up on the collar, over the lips
  S(p[2] - 34, 2);
  return getD();
}

// ---------------------------------------------------------------- THE NAMELESS (eclipse)
// Tall as the room allows: a figure cloaked in overlapping caps from crown to floor, no face but a hood of cap and a slit of
// light where a face would be, and eyes, dozens of them, opening all over the cloak. It puts out the light, all but one.
export const B_Nameless = {
  height: 280,
  parts: [
    { role: 'Body', pivot: [0, 30, 0], lo: [-112, -4, -112], hi: [112, 236, 112], h: 2.0, f: nameBody, tris: 16000 },
    { role: 'ArmBack', pivot: [-40, 200, 4], lo: [-120, 40, -50], hi: [-20, 214, 90], h: 1.6, f: (p) => nameArm(p, -1), tris: 4000 },
    { role: 'ArmFront', pivot: [40, 200, 4], lo: [20, 40, -50], hi: [120, 214, 90], h: 1.6, f: (p) => nameArm(p, 1), tris: 4000 },
    { role: 'Head', pivot: [0, 222, 6], lo: [-50, 200, -50], hi: [50, 300, 70], h: 1.5, f: nameHead, tris: 7000 },
  ],
};
function nameBody(p) {
  reset();
  // a tall cone of a cloak, made of overlapping layers of cap, each a flared skirt
  const rr = len(p[0], 0, p[2]), a = Math.atan2(p[2], p[0]);
  for (let i = 0; i < 7; i++) { const y0 = 226 - i * 30, R0 = 20 + i * 9, t = clamp((y0 - p[1]) / 40, 0, 1), R = R0 + t * 16 + Math.sin(a * 9 + i) * 3 * t;
    const sh = Math.max(Math.abs(rr - R) - 2.6, p[1] - y0, y0 - 42 - p[1]); U(sh, CAP(1 - (i % 2) * 0.25), 2);
    if (sh < 3) P(y0 - 36 - p[1], mixP(CAP(0.55), C(0x140c08), 0.35), 3); }   // each layer darker at its hem
  U(cap(p, [0, 0, 0], [0, 230, 0], 16, 12), mixP(CAP(0.4), C(0x0e0a10), 0.5), 6);   // the stalk inside
  // eyes opening all over it
  for (let i = 0; i < 26; i++) { const k = i % 7, y0 = 226 - k * 30, y = y0 - 12 - (i * 13) % 24, t = clamp((y0 - y) / 40, 0, 1), ang = i * 2.39 + 0.5, R = 20 + k * 9 + t * 16 + 2.4; eye(p, [Math.cos(ang) * R, y, Math.sin(ang) * R], 2.4 + (i % 4) * 0.8, [Math.cos(ang), 0, Math.sin(ang)]); }
  S(p[1] + 1, 1);
  return getD();
}
function nameHead(p) {
  reset();
  // the hood: a tall cap folded forward over nothing; inside, a slit of light
  const q = rotX(p, [0, 236, 6], -0.2);
  const hood = ell(q, [0, 254, 8], [34, 44, 34]);
  U(Math.max(hood, -ell(q, [0, 236, 18], [24, 34, 26]), 210 - q[1]), CAP(0.9), 4);
  // heavy folds falling down it, and a lip turned back round the opening
  if (hood < 3) { const a = Math.atan2(q[0], q[2] - 8); bump((Math.abs(Math.sin(a * 6 + q[1] * 0.02)) < 0.3 ? 1.6 : 0) * smooth(270, 230, q[1])); P(-Math.abs(Math.sin(a * 6 + q[1] * 0.02)) + 0.25, CAP(0.62), 0.12); }
  S(ell(q, [0, 238, 42], [19, 30, 14]), 3, C(0x08060a));   // the opening: a deep oval where a face should be
  U(Math.max(torus(rotX(q, [0, 238, 38], 1.45), [0, 238, 38], 19, 3.4), -(q[2] - 30)), CAP(0.7), 3);
  U(ell(p, [0, 236, 10], [22, 24, 22]), C(0x08060a), 4);
  U(ell(p, [0, 240, 27], [13, 2.4, 3]), GLOW(1), 1); U(ell(p, [0, 240, 25], [18, 5, 2]), mixP(GLOW(0.5), C(0x08060a), 0.5), 1.5);   // the slit, and its light on the dark round it
  crown(p, [0, 290, 4], 10, 6, 14, 5, 0.6);
  S(p[1] - 204, 2);
  return getD();
}
function nameArm(p, s) {
  reset();
  // long thin arms of root hidden under the cloak's edge, hands of many fingers
  rootArm(p, [s * 40, 200, 4], [s * 64, 140, 20], [s * 70, 80, 38], 7, 6, 36, s);
  for (let i = 0; i < 3; i++) shelf(p, [s * (46 + i * 4), 196 - i * 26, 2], [s, 0, 0.1], 14 - i * 2, 3.4, 0.15);
  return getD();
}

// ================================================================ THE HOSTS (survival bosses)
// Out on the survival maps the bosses are not new things the Blight grew: they are people it took. Each was somebody
// the town knew (the foreman, the baron, the deacon, the hangman), and the mold wears them the way they dressed. Every
// hat has become a cap of the strain, coats and dresses have gone to gill and mycelium, faces are pale stalk-flesh with
// the Blight's lit eyes. One rule held for all fifteen, from the usual practice for game characters: the silhouette
// first (each must read as a solid black shape, at a distance, and not be mistaken for another), then the big forms
// (proportion: big, medium, small), then the secondary forms (garments, props, limbs), and only then the small detail,
// kept on the face, the hands and the one thing that names them (the pick, the pole, the noose, the book).
//
// Shape language, so no two read alike from across a map:
//   square and heavy  Big Tony (gorilla stance, a sledge for a fist), The Harbourmaster (a wall of greatcoat, a hook)
//   round             Baron Blackwater (a barrel of a belly, a tiny top hat, a cane), The Human Cannonball (a shell of a head)
//   tall and thin     The Founder (stovepipe, beard to the belt), The Ferryman (hood, a pole twice his height),
//                     The Hangman (pointed hood, arms to the knee, the noose), Mother Mourn (veil and a bell of a dress),
//                     The Ringmaster (shoulders like a coat-hanger, a tower of a hat, tails)
//   broken            The Abomination (a heap of joined bodies, three heads), The Twins (one pair of legs, two of everything else)
//   small and sharp   The Shift Boss (stooped, a lamp on his brow, a pick), Grin (a ruff, a cone, a grin), Deacon Moss (a
//                     brim like a cartwheel, the book held up), Captain Graves (tricorn, a peg leg, a cutlass)

const COAT = (k = 0.5, d = 0x1a120c, t = 0.45) => mixP(CAP(k), C(d), t);   // a garment the strain has soaked into
const SKIN = FLESH(0.92), SKIN2 = FLESH(0.74, 0x120a06), LEATH = C(0x2e2219), LEATH2 = C(0x1e1610), IRONC = C(0x3a3a3c), BRASS = C(0x8a6a2e), ROPE2 = C(0x8a7656), BONEC = C(0xd8ccae);

// --- the rig: two legs, a body, two arms, a head. Each host gives its own shapes; the boxes are mirrored for the arms.
function hostRig(o) {
  const hy = o.hipY, hx = o.hipX || 15, sh = o.sh, a = o.armBox, mir = (b) => [-b[0], b[1], b[2]];
  const part = (fn) => (p) => { reset(); fn(p); return getD(); };
  const pad = (P) => ({ ...P, lo: P.lo.map((v) => v - 12), hi: P.hi.map((v, i) => v + (i === 1 && P.role.startsWith('Leg') ? 16 : 12)) });   // room round every part, so nothing is ever cut flat by its box
  return {
    height: o.height, budget: o.budget || 1.25,
    parts: [
      { role: 'LegBack', pivot: [-hx, hy, 0], lo: [-hx - 36, -4, -44], hi: [-hx + 28, hy + 18, 46], h: o.legH || 1.5, f: part((p) => (o.leg || hostLeg)(p, -1, o)), tris: o.legTris || 2600 },
      { role: 'LegFront', pivot: [hx, hy, 0], lo: [hx - 28, -4, -44], hi: [hx + 36, hy + 18, 46], h: o.legH || 1.5, f: part((p) => (o.leg || hostLeg)(p, 1, o)), tris: o.legTris || 2600 },
      { role: 'Body', pivot: [0, hy, 0], lo: o.bodyLo, hi: o.bodyHi, h: o.bodyH || 1.7, f: part(o.torso), tris: o.bodyTris || 12000 },
      { role: 'ArmBack', pivot: [-sh[0], sh[1], sh[2]], lo: [-a[1][0], a[0][1], a[0][2]], hi: [-a[0][0], a[1][1], a[1][2]], h: o.armH || 1.4, f: part((p) => o.arm(p, -1)), tris: o.armTris ? o.armTris[0] : 4000 },
      { role: 'ArmFront', pivot: [sh[0], sh[1], sh[2]], lo: a[0], hi: a[1], h: o.armH || 1.4, f: part((p) => o.arm(p, 1)), tris: o.armTris ? o.armTris[1] : 4000 },
      { role: 'Head', pivot: o.neck, lo: o.headLo, hi: o.headHi, h: o.headH || 1.3, f: part(o.head), tris: o.headTris || 9000 },
    ].map(pad),
  };
}
// a leg: a thigh and shin of root under the trousers, a boot (or the root foot of the rank and file)
function hostLeg(p, s, o) {
  const L = o.legs || {}, hy = o.hipY, hx = o.hipX || 15, w = L.w || 1, hip = [s * hx, hy + 4, 0], knee = [s * (hx + (L.splay || 3)), hy * 0.52, 5], ank = [s * (hx + (L.splay || 3) * 0.6), 11, 1];
  const r0 = (L.r || 11) * w, cloth = L.cloth || COAT(0.42, 0x16100a, 0.55);
  U(cap(p, hip, knee, r0 * 1.15, r0), cloth, 4); U(cap(p, knee, ank, r0, r0 * 0.78), cloth, 4);
  { const a = Math.atan2(p[2] - knee[2], p[0] - knee[0]); bump(Math.abs(Math.sin(a * 5 + p[1] * 0.08)) < 0.2 ? -0.6 : 0); }   // creases in the cloth
  if (L.boot === false) { rootLeg(p, [ank[0], ank[1] + 16, ank[2]], [ank[0], ank[1] + 8, ank[2] + 1], ank, r0 * 0.7, r0 * 0.75, [[-0.35, 1, 16], [0.05, 1, 19], [0.45, 0.9, 15], [0.1, -1, 10]], s); return; }
  // the boot: a shaft to mid-shin, a heel, a toe, cracked and grown through
  const bt = L.bootTop || 34;
  U(cap(p, [ank[0], bt, ank[2] + 1], [ank[0], 12, ank[2] + 1], r0 * 0.95, r0 * 0.9), LEATH, 3);
  U(ell(p, [ank[0], 7, ank[2] + 6], [r0 * 0.85, 7, r0 * 1.7]), LEATH, 4); U(ell(p, [ank[0], 5, ank[2] + r0 * 1.4], [r0 * 0.7, 5, r0 * 0.8]), LEATH2, 3);
  U(Math.max(cap(p, [ank[0], bt - 2, ank[2] + 1], [ank[0], bt + 3, ank[2] + 1], r0 * 1.08), -cap(p, [ank[0], bt - 8, ank[2] + 1], [ank[0], bt + 8, ank[2] + 1], r0 * 0.7)), LEATH2, 1.5);   // the turned-down top
  rootlets(p, [ank[0], 4, ank[2] + r0 * 1.6], [0, -0.2, 1], 3, 9, 1.3, s + 3);   // the root has come through the toe
  S(p[1] + 0.5, 1); P(p[1] - 12, mixP(LEATH2, C(0x0a0806), 0.4), 5);
}
// a coat, a cloak or a dress: a tapering elliptic shell from shoulders to hem, open down the front unless closed,
// hem ragged into gills, grooves running down it
function garment(p, g) {
  const { top, bot, r0, r1, t = 2.6, open = 0, closed = false, ragged = 4, rag = 7, col = COAT(), cx = 0, cz = 0, back = 0 } = g;
  const y = p[1], u = clamp((top - y) / (top - bot), 0, 1), rx = r0[0] + (r1[0] - r0[0]) * u * u, rz = r0[1] + (r1[1] - r0[1]) * u * u;
  const x = p[0] - cx, z = p[2] - cz - back * u, a = Math.atan2(z, x), nr = len(x / rx, 0, z / rz), d = (nr - 1) * Math.min(rx, rz);
  const hem = bot + Math.sin(a * rag + 1.3) * ragged * 0.5 + Math.abs(Math.sin(a * rag * 2.3)) * ragged * 0.5;
  let s = Math.max(Math.abs(d) - t, hem - y, y - top);
  if (!closed && open > 0) s = Math.max(s, Math.min(open * (0.4 + u) - Math.abs(x), z));   // the opening down the front
  U(s, col, 3);
  if (s < 3) { bump((Math.abs(Math.sin(a * (g.folds || 9) + y * 0.015)) < 0.22 ? -0.9 : 0) * u); P(y - (hem + 10), mixP(col, C(0x0a0806), 0.35), 6); }
  return s;
}
// a mushroom hat: a crown (tapered, round topped), a brim with gills under it, warts on top
function hat(p, h) {
  const { c, crown: [rB, rT, H], brim = 0, brimT = 3, tilt = 0, droop = 0, col = CAP(1), gills = true, warts = 0, seed = 1, band = null } = h;
  const q = tilt ? rotZ(p, c, tilt) : p, qq = h.pitch ? rotX(q, c, h.pitch) : q, rr = len(qq[0] - c[0], 0, qq[2] - c[2]);
  const crownD = cap(qq, [c[0], c[1], c[2]], [c[0], c[1] + H, c[2]], rB, rT);
  U(crownD, col, 3);
  if (h.dome) U(ell(qq, [c[0], c[1] + H, c[2]], [rT, h.dome, rT]), col, 4);
  if (brim) { const by = c[1] + droop * (rr / brim) ** 2; U(Math.max(ell(qq, [c[0], by, c[2]], [brim, brimT, brim * (h.brimZ || 1)]), -(rr - rB * 0.6)), col, 2.5);
    if (gills && qq[1] < by && rr < brim) { const g = Math.abs(Math.sin(Math.atan2(qq[2] - c[2], qq[0] - c[0]) * 20)); P(by - qq[1] - 0.4, FLESH(0.8), 0.8); if (g < 0.3) bump(-0.5); } }
  if (band) P(Math.abs(qq[1] - (c[1] + band[0])) - band[1], band[2], 0.6);
  if (warts) for (let i = 0; i < warts; i++) { const a = i * 2.399 + seed, y = c[1] + H * (0.2 + 0.75 * hashI(i, seed)), r = rB + (rT - rB) * ((y - c[1]) / H); U(ell(qq, [c[0] + Math.cos(a) * r, y, c[2] + Math.sin(a) * r], [2.6, 1.8, 2.6]), mixP(CAP(0.55), FLESH(0.4), 0.5), 1.5); }
  P(-fbm(qq[0] * 0.08 + seed, qq[1] * 0.08, qq[2] * 0.08) - 0.3, CAP(0.78), 0.12);
}
// a face on stalk-flesh: sockets with lit eyes, a brow, a nose ridge, a mouth slot of gill-teeth
function hostFace(p, f) {
  const { c, eyeX = 7, eyeY = 4, eyeR = 3, mouthY = -11, mouthW = 10, brow = true, teeth = true, nose = true, z = 0 } = f;
  for (const s of [-1, 1]) eye(p, [c[0] + s * eyeX, c[1] + eyeY, c[2] + z], eyeR, [s * 0.15, 0, 1]);
  if (brow) U(ell(p, [c[0], c[1] + eyeY + eyeR * 1.4, c[2] + z - 1], [eyeX + eyeR * 2.2, eyeR * 0.9, eyeR * 1.5]), SKIN2, 2.5);
  if (nose) U(cap(p, [c[0], c[1] + eyeY, c[2] + z], [c[0], c[1] - 4, c[2] + z + 3.5], 2.2, 2.8), SKIN, 2);
  S(ell(p, [c[0], c[1] + mouthY, c[2] + z - 1], [mouthW, 3, 6]), 1.5, GUM);
  if (teeth) for (let i = -3; i <= 3; i++) { const x = c[0] + i * mouthW * 0.27; U(cap(p, [x, c[1] + mouthY + 2.6, c[2] + z + 1], [x, c[1] + mouthY - 0.4 - (i & 1), c[2] + z + 1.6], 0.9, 0.3), TOOTH, 0.4); }
  S(sph(p, [c[0] - 6, c[1] - 4, c[2] + z + 2], 3.2), 2); S(sph(p, [c[0] + 6, c[1] - 4, c[2] + z + 2], 3.2), 2);   // hollow cheeks
}
// a hand: a knot of root, n fingers curled round a grip (if grip) or hanging
function hand(p, wr, s, r, n = 4, L = 16, grip = null) {
  U(ell(p, wr, [r * 1.15, r, r * 1.15]), ROOT2, r * 0.5);
  for (let i = 0; i < n; i++) {
    const sp = (i - (n - 1) / 2) * 0.5;
    if (grip) { const g = grip, b = [wr[0] + s * sp * 3, wr[1] - r * 0.4, wr[2] + r * 0.6 + sp * 4]; rootFinger(p, [b, [g[0] + s * 4, g[1] + sp * 4.2, g[2] + 4], [g[0], g[1] + sp * 4.2 - 1, g[2] + 6], [g[0] - s * 3, g[1] + sp * 4.2 - 2, g[2] + 3]], r * 0.45, ROOT2); }
    else rootFinger(p, [[wr[0] + s * sp * 3, wr[1] - 2, wr[2] + 2], [wr[0] + s * sp * 6, wr[1] - L * 0.5, wr[2] + 4], [wr[0] + s * sp * 7, wr[1] - L, wr[2] + 7]], r * 0.42, ROOT2);
  }
  rootFinger(p, [[wr[0] - s * r * 0.6, wr[1], wr[2] + r * 0.7], [wr[0] - s * r, wr[1] - L * 0.35, wr[2] + r * 1.6], [wr[0] - s * r * 0.8, wr[1] - L * 0.55, wr[2] + r * 2.2]], r * 0.38, ROOT2);
}
// an arm in a sleeve: upper arm and forearm in cloth to a cuff, then the hand
function sleeveArm(p, s, sh, el, wr, r, col, cuff = null) {
  U(cap(p, sh, el, r * 1.25, r * 1.05), col, 3); U(cap(p, el, wr, r * 1.05, r * 0.9), col, 3); U(sph(p, el, r * 1.1), col, 2);
  { const a = Math.atan2(p[2] - el[2], p[0] - el[0]); bump(Math.abs(Math.sin(a * 4 + p[1] * 0.12)) < 0.15 ? -0.6 : 0); }
  if (cuff) U(cap(p, [wr[0] + (el[0] - wr[0]) * 0.12, wr[1] + (el[1] - wr[1]) * 0.12, wr[2] + (el[2] - wr[2]) * 0.12], [wr[0] + (el[0] - wr[0]) * 0.02, wr[1] + (el[1] - wr[1]) * 0.02, wr[2] + (el[2] - wr[2]) * 0.02], r * 1.25, r * 1.2), cuff, 1.5);
  P(sph(p, sh, r * 2), mixP(col, C(0x000000), 0.2), r);
}
// a hanging strand (a beard, seaweed, a veil): a wavering chain from a down by L
function strand(p, a, L, r, col, seed, sway = 3) { const pts = []; for (let k = 0; k <= 5; k++) { const t = k / 5; pts.push([a[0] + Math.sin(t * 4 + seed) * sway * t, a[1] - L * t, a[2] + Math.cos(t * 3 + seed) * sway * 0.6 * t + t * 2]); } chain(p, pts, r, r * 0.45, col, 1.2); }
// a little torso of stalk-flesh: chest, belly, a waist, a neck stub; the garment goes over it
let TRUNK = null;
const smin = (a, b, k) => { const h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1); return b + (a - b) * h - k * h * (1 - h); };
// cloth worn close (a shirt, a waistcoat, tights): the trunk's own shapes let out by t, between two heights, a slit down the front if open
function fitted(q, f) { const T = f.shapes || TRUNK; let d = 1e9; for (const [c, r] of T) d = smin(d, ell(q, c, [r[0] + f.t, r[1] + f.t, r[2] + f.t]), 10);
  const y = q[1]; let s = Math.max(d, (f.bot + Math.sin(Math.atan2(q[2], q[0]) * 7) * (f.ragged || 0)) - y, y - f.top);
  if (f.open) s = Math.max(s, Math.min(f.open - Math.abs(q[0]), (f.openFrom || 0) - q[2]));
  U(s, f.col, 2); if (s < 2) { const a = Math.atan2(q[2], q[0]); bump(Math.abs(Math.sin(a * (f.folds || 6) + y * 0.05)) < 0.18 ? -0.6 : 0); } return s; }
function trunk(p, o) { const { chest, belly, neckY, lean = 0 } = o; const q = [p[0], p[1], p[2] - (p[1] - 80) * lean]; TRUNK = [chest, belly];
  U(ell(q, chest[0], chest[1]), SKIN, 10); U(ell(q, belly[0], belly[1]), SKIN, 12); U(cap(q, [0, chest[0][1], chest[0][2]], [0, neckY, chest[0][2] + 2], 10, 8), SKIN, 6); mold(p, 60, neckY); return q; }

// ---------------------------------------------------------------- BIG TONY (The Foreman)
// A gorilla of a man: short bowed legs, a chest like a boiler, a small head sunk between the shoulders under a hard hat
// that has grown into a bracket fungus. The right fist has fused round his sledgehammer, head and all.
export const B_Foreman = hostRig({
  height: 230, hipY: 66, hipX: 21, sh: [42, 150, 10], neck: [0, 156, 26], legs: { r: 15, splay: 6, bootTop: 38 },
  bodyLo: [-80, 40, -60], bodyHi: [80, 196, 72], headLo: [-46, 140, -18], headHi: [46, 222, 70], headH: 1.2,
  armBox: [[18, -6, -40], [100, 170, 96]], armTris: [4500, 7000],
  torso(p) {
    const q = trunk(p, { chest: [[0, 136, 10], [52, 40, 38]], belly: [[0, 98, 14], [40, 34, 34]], neckY: 160, lean: 0.18 });
    for (const s of [-1, 1]) U(ell(q, [s * 40, 150, 6], [22, 20, 22]), SKIN, 10);   // the shoulders, a yoke of muscle
    // the shirt: sleeves rolled, the front torn open; braces over the shoulders
    fitted(q, { shapes: [[[0, 136, 10], [52, 40, 38]], [[0, 98, 14], [40, 34, 34]], [[-40, 150, 6], [22, 20, 22]], [[40, 150, 6], [22, 20, 22]]], t: 2, top: 168, bot: 76, ragged: 2, open: 9, openFrom: 20, col: COAT(0.35, 0x3a2c20, 0.6), folds: 7 });
    // braces painted on over the shirt, belt to shoulder, front and back; a belt worn on the belly, its buckle
    for (const s of [-1, 1]) P(Math.abs(Math.abs(q[0]) - 20 - Math.abs(q[1] - 150) * 0.06) - 4 + (q[1] > 82 && q[1] < 176 ? 0 : 99), LEATH, 0.6);
    fitted(q, { shapes: [[[0, 98, 14], [40, 34, 34]], [[0, 136, 10], [52, 40, 38]]], t: 3.4, top: 86, bot: 76, col: LEATH2, folds: 3 }); U(box(q, [0, 81, 49], [7, 5, 2.4], 1), BRASS, 1.5);
    shelf(q, [-44, 162, -6], [-1, 0, -0.4], 14, 4); shelf(q, [-38, 168, -18], [-0.7, 0, -0.8], 11, 3.4);   // a clutch of bracket on one shoulder only
    sprout(q, [-20, 168, -14], [-0.3, 1, -0.5], 11, 7, true); sprout(q, [-36, 160, -6], [-0.8, 0.6, -0.3], 8, 5);
    pore(q, [18, 120, 48], 3, [0.3, 0, 1]); pore(q, [-26, 104, 44], 2.6, [-0.4, 0, 1]);
  },
  arm(p, s) {
    if (s < 0) { const sh = [-42, 150, 10], el = [-60, 112, 20], wr = [-62, 78, 30];
      U(cap(p, sh, el, 17, 14), SKIN, 5); U(cap(p, el, wr, 15, 12), SKIN, 5); U(cap(p, [-56, 138, 14], [-62, 112, 20], 18, 15), COAT(0.35, 0x3a2c20, 0.6), 3); mold(p, 70, 150);
      hand(p, wr, -1, 10, 4, 20); return; }
    const sh = [42, 150, 10], el = [62, 112, 24], wr = [64, 80, 40];
    U(cap(p, sh, el, 18, 15), SKIN, 5); U(cap(p, el, wr, 16, 15), SKIN, 5); U(cap(p, [56, 138, 14], [62, 112, 24], 19, 16), COAT(0.35, 0x3a2c20, 0.6), 3); mold(p, 70, 150);
    // the sledge: a haft through the fist, the head grown over with shelf and mold
    const g0 = [64, 78, 44], g1 = [64, 18, 66];
    U(cap(p, [64, 96, 34], g1, 4.2, 3.6), WOOD, 1.5);
    U(box(rotX(p, g1, -0.34), g1, [12, 12, 22], 4), IRONC, 3); { const [d1] = cells(p[0] * 0.15, p[1] * 0.15, p[2] * 0.15); if (box(rotX(p, g1, -0.34), g1, [13, 13, 23], 4) < 2) P(0.3 - d1, mixP(CAP(0.6), C(0x3a2a1a), 0.3), 0.08); }
    shelf(p, [76, 22, 66], [1, 0, 0.2], 11, 3.4); shelf(p, [52, 16, 70], [-1, 0, 0.1], 9, 3);
    U(ell(p, g0, [15, 13, 15]), SKIN, 6); for (let i = 0; i < 4; i++) U(cap(p, [56 + i * 5, 84, 38], [56 + i * 5, 74, 50], 4.2, 3.6), ROOT2, 2);   // the fist, closed on it
  },
  head(p) {
    U(cap(p, [0, 150, 22], [0, 176, 30], 16, 15), SKIN, 6); U(ell(p, [0, 172, 34], [17, 16, 15]), SKIN, 6);
    U(ell(p, [0, 160, 40], [15, 7, 9]), SKIN2, 4);   // a heavy jaw
    hostFace(p, { c: [0, 174, 46], eyeX: 6.5, eyeR: 2.8, mouthY: -14, mouthW: 8 });
    // the hard hat: a low dome with a peak, gone over to bracket fungus, shelves fanning off one side
    hat(p, { c: [0, 182, 31], crown: [19, 17, 6], dome: 10, brim: 23, brimT: 2.4, brimZ: 1.15, col: CAP(1), warts: 6, seed: 4 });
    shelf(p, [-16, 192, 26], [-1, 0, 0.1], 13, 3.6); shelf(p, [-14, 200, 32], [-0.8, 0, 0.5], 10, 3);
    S(p[1] - 146, 1.5);
  },
});

// ---------------------------------------------------------------- THE ABOMINATION (Stitched Mass)
// What the Blight made when it ran out of patience: three or four of them pressed into one heap, joined with mycelium
// stitches, three heads at three heights, one huge arm and a bundle of small ones.
export const B_Abomination = hostRig({
  height: 240, hipY: 70, hipX: 22, sh: [44, 150, 4], neck: [6, 170, 12], legs: { r: 16, splay: 8, boot: false },
  bodyLo: [-90, 40, -76], bodyHi: [90, 214, 80], bodyTris: 15000, headLo: [-40, 150, -30], headHi: [52, 236, 60], headH: 1.3,
  armBox: [[16, -6, -50], [110, 170, 90]], armTris: [6000, 6000],
  torso(p) {
    const blobs = [[0, 108, 4, 40], [-26, 136, -6, 34], [24, 148, 2, 32], [-8, 170, -14, 24], [36, 116, 12, 26], [-40, 104, 10, 22], [10, 84, 18, 24], [-36, 172, 10, 18]];
    for (const [x, y, z, r] of blobs) U(ell(p, [x, y, z], [r, r * 0.92, r * 0.9]), SKIN, 9);
    // seams where they were joined: stitched with cords of mycelium
    for (let i = 0; i < blobs.length - 1; i++) { const [x, y, z, r] = blobs[i], [x2, y2, z2] = blobs[i + 1], m = [(x + x2) / 2, (y + y2) / 2, (z + z2) / 2], d = sph(p, m, r * 0.9);
      if (d < 4) { P(Math.abs(d) - 1.2, mixP(GUM, FLESH(0.3), 0.3), 0.8); for (let k = -3; k <= 3; k++) { const a = k * 0.35; U(cap(p, [m[0] + Math.cos(a) * r * 0.8, m[1] + Math.sin(a) * r * 0.8 - 3, m[2] + r * 0.45], [m[0] + Math.cos(a) * r * 0.8, m[1] + Math.sin(a) * r * 0.8 + 3, m[2] + r * 0.5], 0.9), MYC, 0.6); } } }
    // two more heads half-swallowed into the heap: on the left shoulder and low on the belly
    U(ell(p, [-36, 182, 18], [13, 14, 12]), SKIN, 6); hostFace(p, { c: [-36, 182, 29], eyeX: 4.6, eyeR: 2.2, mouthY: -8, mouthW: 5 });
    U(ell(p, [18, 92, 38], [12, 11, 8]), SKIN, 6); for (const s of [-1, 1]) eye(p, [18 + s * 4.6, 95, 45], 2.2); S(ell(p, [18, 87, 45], [5, 2.4, 4]), 1.2, GUM);
    hat(p, { c: [-36, 192, 16], crown: [9, 6, 6], dome: 6, brim: 14, brimT: 2, col: CAP(0.9), tilt: 0.4, warts: 3, seed: 7 });
    // a bundle of small arms coming out of the back, hanging
    for (let i = 0; i < 3; i++) { const b = [-30 + i * 14, 150 - i * 12, -40]; rootArm(p, b, [b[0] - 10, b[1] - 26, -52], [b[0] - 8, b[1] - 52, -46], 4.2, 3, 12, -1); }
    sprout(p, [20, 172, -10], [0.3, 1, -0.4], 12, 7, true); sprout(p, [-12, 186, -20], [-0.3, 1, -0.6], 9, 5); sprout(p, [44, 128, -10], [1, 0.4, -0.5], 8, 5, true);
    mold(p, 70, 200, 0.5); warts(p, 1.4, 0.1);
  },
  arm(p, s) {
    if (s < 0) { rootArm(p, [-40, 150, 4], [-58, 112, 12], [-60, 82, 22], 7.5, 4, 22, -1); U(ell(p, [-48, 136, 6], [14, 18, 14]), SKIN, 6); return; }
    // the one huge arm: swollen, bulging, a club of a fist dragging nearly to the floor
    const sh = [44, 150, 4], el = [74, 104, 18], wr = [78, 50, 30], SK = mixP(SKIN, CAP(0.7), 0.3);
    U(cap(p, sh, el, 22, 18), SK, 8); U(cap(p, el, wr, 18, 22), SK, 8); U(ell(p, [78, 34, 34], [24, 22, 24]), SK, 8);
    warts(p, 2, 0.12); for (let k = 0; k < 4; k++) U(cap(p, [64 + k * 8, 20, 48], [62 + k * 9, 6, 52], 6, 5), ROOT2, 3);
    for (const [y, r] of [[128, 9], [92, 8], [64, 9]]) U(ell(p, [70, y, 26], [r * 1.4, r, r]), SK, 6);   // muscle knotted under the skin
    mold(p, 10, 150, 0.5); { const n = fbm(p[0] * 0.05 + 2, p[1] * 0.05, p[2] * 0.05); P(Math.abs(n) * 34 - 1.1, mixP(GUM, CAP(0.4), 0.4), 0.7); }   // veins
    { const m = [60, 128, 10], d = sph(p, m, 20); if (d < 3) P(Math.abs(d) - 1.2, GUM, 0.8); }
    sprout(p, [86, 110, 4], [1, 0.6, -0.3], 9, 6, true);
  },
  head(p) {
    U(cap(p, [6, 160, 8], [6, 186, 14], 15, 16), SKIN, 6); U(ell(p, [8, 196, 16], [19, 20, 17]), SKIN, 6);
    hostFace(p, { c: [8, 196, 31], eyeX: 7, eyeR: 3, mouthY: -12, mouthW: 9 });
    // one eye sewn shut with mycelium
    for (let k = -2; k <= 2; k++) U(cap(p, [1 + k * 1.6, 202, 32], [1 + k * 1.6, 196, 33], 0.7), MYC, 0.4);
    hat(p, { c: [8, 210, 12], crown: [14, 8, 8], dome: 8, brim: 22, brimT: 2.6, droop: 4, col: CAP(1), tilt: -0.25, warts: 5, seed: 3 });
    S(p[1] - 156, 1.5);
  },
});

// ---------------------------------------------------------------- THE FOUNDER (Father of Deadwater Gulch)
// The town's first man and its last word: very tall, very thin, a frock coat to the shin, a stovepipe hat gone to a tall
// inky cap, and a beard of hyphae hanging to his belt. He walks upright; everything about him points down.
export const B_Founder = hostRig({
  height: 275, hipY: 88, hipX: 12, sh: [24, 196, 2], neck: [0, 200, 6], legs: { r: 8, splay: 2, bootTop: 44 },
  bodyLo: [-54, 22, -50], bodyHi: [54, 214, 50], headLo: [-46, 190, -40], headHi: [46, 300, 52], headH: 1.2, headTris: 11000,
  armBox: [[4, 50, -30], [56, 204, 50]],
  torso(p) {
    const q = trunk(p, { chest: [[0, 176, 2], [24, 22, 15]], belly: [[0, 132, 2], [18, 30, 14]], neckY: 206 });
    U(cap(q, [0, 96, 0], [0, 130, 0], 16, 17), SKIN, 8);
    // the frock coat: narrow shoulders, buttoned to the waist, open below, tails to the shin
    garment(q, { top: 204, bot: 34, r0: [27, 19], r1: [33, 27], open: 9, ragged: 4, col: COAT(0.32, 0x14100c, 0.6), folds: 11 });
    garment(q, { top: 206, bot: 182, r0: [16, 14], r1: [28, 20], closed: true, t: 2, col: COAT(0.3, 0x14100c, 0.62) });   // the high collar
    for (let i = 0; i < 5; i++) pore(q, [0, 168 - i * 10, 21 - i * 0.4], 1.6, [0, 0, 1]);   // the buttons are pores now
    // the watch chain across the waistcoat, still bright
    { const pts = []; for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push([-12 + t * 24, 140 - Math.sin(t * Math.PI) * 6, 19 + Math.sin(t * Math.PI) * 1.5]); } chain(q, pts, 0.9, 0.9, BRASS, 0.4); U(sph(q, [12, 140, 19], 2.6), GLOW(0.8), 0.6); }
    sprout(q, [-10, 196, -14], [-0.3, 1, -0.6], 10, 6, true); sprout(q, [8, 186, -17], [0.3, 0.8, -0.8], 7, 4.4);
  },
  arm(p, s) {
    const sh = [s * 24, 196, 2], el = [s * 32, 152, 6], wr = [s * 34, 112, 12];
    sleeveArm(p, s, sh, el, wr, 6, COAT(0.32, 0x14100c, 0.6), C(0xc8bca0));
    hand(p, [wr[0], wr[1] - 5, wr[2] + 1], s, 4.5, 4, 26);   // long fingers, hanging
  },
  head(p) {
    U(cap(p, [0, 200, 4], [0, 226, 8], 9, 10), SKIN, 5); U(ell(p, [0, 232, 10], [12, 17, 13]), SKIN, 5);   // a long gaunt face
    hostFace(p, { c: [0, 236, 21], eyeX: 5, eyeR: 2.6, mouthY: -12, mouthW: 6, teeth: false });
    U(ell(p, [0, 238, 22], [9, 2.4, 2.5]), SKIN2, 2);
    // the beard: dozens of hyphae hanging from the jaw to the belt, the longest in the middle
    for (let i = 0; i < 15; i++) { const a = (i / 14 - 0.5) * 2.4, x = Math.sin(a) * 11, z = 10 + Math.cos(a) * 11, L = 50 - Math.abs(i - 7) * 4.2 + hashI(i, 5) * 8; strand(p, [x, 226, z], L, 1.8, mixP(MYC2, FLESH(0.3), 0.3), i * 1.3, 2.5); }
    U(ell(p, [0, 224, 18], [12, 6, 7]), MYC2, 4);
    // the stovepipe: tall, a hair narrower at the top, a band, a narrow brim curled up at the sides
    hat(p, { c: [0, 248, 10], crown: [14, 13, 42], dome: 3, brim: 20, brimT: 2, droop: -3, col: CAP(1), band: [7, 3.5, CAP(0.45, 0x0a0806)], warts: 4, seed: 9 });
    S(p[1] - 196, 1.5);
  },
});

// ---------------------------------------------------------------- THE SHIFT BOSS (Overseer of the Night Shift)
// Stooped from a life under low roofs: a round helmet with a lamp on the brow (the lamp is a glowing mushroom now), a
// pick on his shoulder, a sack of ore on his back.
export const B_ShiftBoss = hostRig({
  height: 205, hipY: 62, hipX: 15, sh: [30, 140, 18], neck: [0, 148, 30], legs: { r: 11, splay: 4, bootTop: 36 },
  bodyLo: [-62, 40, -70], bodyHi: [62, 180, 80], headLo: [-36, 130, 6], headHi: [36, 204, 80],
  armBox: [[8, 20, -60], [70, 200, 72]], armTris: [4000, 6000],
  torso(p) {
    const q = trunk(p, { chest: [[0, 122, 16], [30, 26, 24]], belly: [[0, 92, 10], [26, 24, 22]], neckY: 150, lean: 0.35 });
    fitted(q, { t: 2.6, top: 152, bot: 68, ragged: 2, open: 7, openFrom: 22, col: COAT(0.35, 0x3a3020, 0.62), folds: 8 });   // the jacket, worn open
    for (const s of [-1, 1]) P(Math.abs(Math.abs(q[0]) - 13) - 3 + (q[1] > 70 && q[1] < 154 ? 0 : 99), LEATH, 0.5);   // braces, painted on the jacket
    // the ore sack on his back, lumpy, roped
    U(ell(q, [0, 120, -30], [26, 30, 18]), C(0x6a5a42), 8); { const [d1] = cells(q[0] * 0.12, q[1] * 0.12, q[2] * 0.12); if (ell(q, [0, 120, -30], [27, 31, 19]) < 2) bump(-Math.max(0, 0.3 - d1) * 6); }
    U(torus(q, [0, 146, -26], 14, 2), ROPE2, 1.5); for (const s of [-1, 1]) U(cap(q, [s * 12, 146, -20], [s * 18, 156, 14], 1.8), ROPE2, 1);
    for (let i = 0; i < 4; i++) sprout(q, [-14 + i * 9, 146 + (i & 1) * 4, -36], [0, 1, -0.4], 8 - i, 5 - i * 0.6, i === 1);   // mushrooms fruiting out of the ore
  },
  arm(p, s) {
    const sh = [s * 30, 140, 18], el = [s * 40, 112, 28], wr = [s * 40, 86, 40];
    sleeveArm(p, s, sh, el, wr, 6.5, COAT(0.35, 0x3a3020, 0.62));
    if (s < 0) { hand(p, wr, s, 6, 4, 16); return; }
    // the pick: a haft held at the end, the head a curved spike of bone-hard fungus
    const g = [40, 84, 46], top = [36, 176, 6];
    U(cap(p, [41, 60, 56], top, 3.4, 3), WOOD, 1.2);
    { const pts = [[36, 176, 6], [34, 186, -16], [32, 182, -40], [30, 168, -56]], pts2 = [[36, 176, 6], [38, 184, 26], [38, 180, 40]]; chain(p, pts, 5, 1.2, IRONC, 2); chain(p, pts2, 5, 2, IRONC, 2); U(box(p, [36, 176, 6], [6, 7, 7], 2), IRONC, 2); }
    P(-fbm(p[0] * 0.1, p[1] * 0.1, p[2] * 0.1) - 0.15, mixP(CAP(0.5), C(0x2a1a10), 0.4), 0.15);
    hand(p, wr, s, 6.5, 4, 16, g);
  },
  head(p) {
    U(cap(p, [0, 142, 26], [0, 164, 36], 12, 13), SKIN, 5); U(ell(p, [0, 168, 40], [14, 14, 13]), SKIN, 5);
    hostFace(p, { c: [0, 166, 51], eyeX: 5.5, eyeR: 2.6, mouthY: -10, mouthW: 7 });
    for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 2, x = Math.sin(a) * 9; strand(p, [x, 160, 46 + Math.cos(a) * 4], 10 + hashI(i, 3) * 6, 1.6, MYC2, i, 1.5); }   // a short beard of hyphae
    // the helmet: a round dome with a short brim all round, and on the brow the lamp, a lit mushroom in a brass ring
    hat(p, { c: [0, 176, 38], crown: [16, 15, 4], dome: 13, brim: 19, brimT: 2, droop: 2, col: CAP(1), warts: 4, seed: 2 });
    U(torus(rotX(p, [0, 182, 56], 1.4), [0, 182, 56], 6, 2), BRASS, 1); U(sph(p, [0, 182, 56], 5.4), GLOW(1), 1); sprout(p, [0, 184, 55], [0, 0.4, 1], 5, 4, true);
    S(p[1] - 138, 1.5);
  },
});

// ---------------------------------------------------------------- BARON BLACKWATER (Owner of Everything Down Here)
// Round: a belly like a cask in a waistcoat, short legs, a tiny top hat perched on a big head, a monocle that glows, a
// moustache of gills, coat tails, a silver-topped cane.
export const B_Baron = hostRig({
  height: 235, hipY: 60, hipX: 22, sh: [46, 150, 4], neck: [0, 154, 10], legs: { r: 13, splay: 5, bootTop: 30 },
  bodyLo: [-80, 20, -78], bodyHi: [80, 186, 84], bodyTris: 14000, headLo: [-44, 140, -30], headHi: [44, 236, 60], headH: 1.2,
  armBox: [[18, -6, -40], [86, 170, 80]], armTris: [4000, 5500],
  torso(p) {
    U(ell(p, [0, 112, 10], [56, 56, 52]), SKIN, 14); U(ell(p, [0, 148, 4], [44, 22, 34]), SKIN, 12);
    // the waistcoat over the belly, buttons straining (pores), a chain; the coat open over it with tails behind
    fitted(p, { shapes: [[[0, 112, 10], [56, 56, 52]], [[0, 148, 4], [44, 22, 34]]], t: 2, top: 164, bot: 72, col: mixP(CAP(0.6), C(0x5a1a12), 0.4), folds: 5 });
    garment(p, { top: 168, bot: 40, r0: [48, 38], r1: [62, 50], open: 34, ragged: 3, col: COAT(0.3, 0x100c0a, 0.65), folds: 8, cz: 2, back: -8 });
    for (let i = 0; i < 5; i++) pore(p, [0, 150 - i * 15, 62 - Math.abs(i - 2) * 2.5], 2.2, [0, 0.1, 1]);
    { const pts = []; for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push([-24 + t * 48, 118 - Math.sin(t * Math.PI) * 10, 58 + Math.sin(t * Math.PI) * 4]); } chain(p, pts, 1, 1, BRASS, 0.4); }
    U(torus(p, [0, 160, 6], 24, 4), mixP(C(0xd8ccb4), FLESH(0.3), 0.3), 2);   // a cravat gone to a ring of gill
    sprout(p, [-30, 160, -26], [-0.4, 1, -0.6], 11, 7, true); sprout(p, [26, 154, -30], [0.4, 0.8, -0.8], 8, 5);
  },
  arm(p, s) {
    const sh = [s * 46, 150, 4], el = [s * 60, 118, 14], wr = [s * 62, 88, 28];
    sleeveArm(p, s, sh, el, wr, 9, COAT(0.3, 0x100c0a, 0.65), C(0xd8ccb4));
    if (s < 0) { hand(p, wr, s, 7.5, 4, 14); return; }
    // the cane: black, a silver knob, planted forward
    const g = [62, 84, 32];
    U(cap(p, [62, 92, 30], [64, 2, 58], 2.6, 2.4), C(0x141012), 1); U(sph(p, [62, 94, 30], 4.6), C(0xb8b4a8), 1.2); U(sph(p, [64, 2, 58], 3), BRASS, 1);
    hand(p, wr, s, 7.5, 4, 14, g);
  },
  head(p) {
    U(cap(p, [0, 150, 8], [0, 170, 12], 20, 20), SKIN, 8); U(ell(p, [0, 182, 14], [24, 22, 21]), SKIN, 8); U(ell(p, [0, 168, 20], [22, 12, 16]), SKIN, 8);   // jowls
    hostFace(p, { c: [0, 186, 33], eyeX: 8, eyeR: 2.8, mouthY: -15, mouthW: 9 });
    U(torus(rotX(p, [8, 190, 34], 1.5), [8, 190, 34], 4.8, 0.9), BRASS, 0.5); U(cap(p, [12, 188, 34], [16, 160, 32], 0.4), BRASS, 0.3);   // the monocle
    for (const s of [-1, 1]) chain(p, [[s * 2, 178, 34], [s * 12, 176, 34], [s * 22, 180, 30], [s * 26, 186, 26]], 2.6, 0.6, mixP(MYC2, C(0x3a2a1a), 0.4), 1);   // a moustache of gills
    // the top hat: comically small on that head, tipped to one side
    hat(p, { c: [6, 200, 12], crown: [10, 11, 22], dome: 1.5, brim: 15, brimT: 1.6, droop: -2, tilt: -0.22, col: CAP(1), band: [4, 2.6, CAP(0.4, 0x0a0806)], warts: 3, seed: 6 });
    S(p[1] - 146, 1.5);
  },
});

// ---------------------------------------------------------------- DEACON MOSS (Still Preaching)
// A preacher in a long black coat with a brim as wide as a cartwheel, a beard of moss to his chest, the book held up
// open in front of him. Its pages are gills now, and they glow.
export const B_Deacon = hostRig({
  height: 240, hipY: 78, hipX: 13, sh: [26, 172, 6], neck: [0, 176, 10], legs: { r: 9, splay: 2, bootTop: 36 },
  bodyLo: [-56, 20, -50], bodyHi: [56, 192, 54], headLo: [-60, 168, -54], headHi: [60, 250, 70], headH: 1.3, headTris: 10000,
  armBox: [[6, 60, -30], [60, 182, 90]], armTris: [4000, 6500],
  torso(p) {
    const q = trunk(p, { chest: [[0, 152, 4], [24, 22, 17]], belly: [[0, 120, 4], [21, 26, 16]], neckY: 182, lean: 0.06 });
    U(cap(q, [0, 86, 0], [0, 118, 0], 17, 19), SKIN, 8);
    garment(q, { top: 180, bot: 30, r0: [27, 21], r1: [34, 30], open: 7, ragged: 5, col: COAT(0.25, 0x0c0a0a, 0.7), folds: 12 });
    U(Math.max(Math.abs(q[1] - 176) - 3, cap(q, [0, 170, 6], [0, 182, 6], 15) ), C(0xe0d8c4), 1.5);   // the white collar, the last clean thing on him
    sprout(q, [-14, 172, -14], [-0.4, 1, -0.6], 10, 6, true); sprout(q, [12, 158, -18], [0.4, 0.7, -0.8], 7, 4.4);
    mold(q, 40, 180, 0.55);
  },
  arm(p, s) {
    if (s < 0) { const sh = [-26, 172, 6], el = [-34, 136, 12], wr = [-34, 102, 18]; sleeveArm(p, s, sh, el, wr, 6, COAT(0.25, 0x0c0a0a, 0.7)); hand(p, wr, s, 5, 4, 18); return; }
    // the book arm: forearm raised, the book open on the palm, held up to be read from
    const sh = [26, 172, 6], el = [34, 140, 22], wr = [26, 152, 52];
    sleeveArm(p, s, sh, el, wr, 6, COAT(0.25, 0x0c0a0a, 0.7));
    U(ell(p, [24, 150, 58], [8, 4, 8]), ROOT2, 2);
    const bk = [20, 158, 62], q = rotX(rotZ(p, bk, -0.25), bk, -0.5);
    for (const sd of [-1, 1]) { const qq = rotZ(q, bk, sd * 0.22); U(box(qq, [bk[0] + sd * 11, bk[1], bk[2]], [10, 1.6, 14], 0.8), C(0x1a120e), 0.8);   // the boards
      U(box(qq, [bk[0] + sd * 10.5, bk[1] + 2.6, bk[2]], [9.5, 1.6, 13], 0.6), mixP(FLESH(0.9), C(0xe8dcc0), 0.4), 0.6);   // the pages
      if (box(qq, [bk[0] + sd * 10.5, bk[1] + 2.6, bk[2]], [9.5, 2, 13], 0.6) < 0.8) { const g = Math.abs(Math.sin(qq[2] * 1.4)); P(g - 0.25, GLOW(0.55), 0.15); } }
    for (let i = 0; i < 4; i++) rootFinger(p, [[22 + i * 2, 148, 56], [18 + i * 4, 152, 62], [14 + i * 4, 156, 66]], 1.8, ROOT2);
  },
  head(p) {
    U(cap(p, [0, 176, 8], [0, 196, 12], 10, 11), SKIN, 5); U(ell(p, [0, 204, 14], [13, 16, 14]), SKIN, 5);
    hostFace(p, { c: [0, 206, 26], eyeX: 5.2, eyeR: 2.7, mouthY: -11, mouthW: 6.5 });
    // the beard: a mat of moss from the jaw to the chest, a little sprout in it
    U(ell(p, [0, 188, 20], [13, 16, 9]), MOSS, 5); { const n = fbm(p[0] * 0.3, p[1] * 0.3, p[2] * 0.3); if (ell(p, [0, 188, 20], [14, 17, 10]) < 2) bump(n * 1.6); }
    for (let i = 0; i < 7; i++) strand(p, [-9 + i * 3, 178, 22], 12 + hashI(i, 2) * 8, 1.6, MOSS, i * 1.7, 2);
    // the brim: wide and flat, a low round crown, curling down at the edge
    hat(p, { c: [0, 216, 12], crown: [14, 13, 9], dome: 7, brim: 44, brimT: 2, droop: 6, col: CAP(1), band: [2, 2.4, CAP(0.4, 0x0a0806)], warts: 5, seed: 11 });
    sprout(p, [18, 222, 20], [0.4, 1, 0.3], 9, 5, true); sprout(p, [-30, 220, -10], [-0.5, 1, -0.2], 7, 4);
    S(p[1] - 172, 1.5);
  },
});

// ---------------------------------------------------------------- THE FERRYMAN (Everyone Goes Across)
// A thin black figure in a hooded cloak to the ground, nothing of him showing but two lit eyes and one long hand, and
// a pole twice his height with a lit pod hung from the top of it.
export const B_Ferryman = hostRig({
  height: 250, hipY: 84, hipX: 11, sh: [22, 184, 4], neck: [0, 186, 6], legs: { r: 8, splay: 1, bootTop: 30 },
  bodyLo: [-60, 2, -60], bodyHi: [60, 200, 56], bodyTris: 13000, headLo: [-34, 172, -36], headHi: [34, 252, 48],
  armBox: [[4, -8, -30], [60, 300, 70]], armTris: [3500, 6000],
  torso(p) {
    const q = trunk(p, { chest: [[0, 162, 2], [20, 20, 15]], belly: [[0, 126, 2], [16, 26, 13]], neckY: 190 });
    garment(q, { top: 196, bot: 6, r0: [24, 19], r1: [42, 36], open: 5, ragged: 7, rag: 9, col: COAT(0.2, 0x08070a, 0.75), folds: 13, t: 2.4 });
    garment(q, { top: 198, bot: 150, r0: [22, 18], r1: [38, 30], closed: true, ragged: 6, rag: 6, col: COAT(0.22, 0x0a080a, 0.72), t: 2 });   // a short cape over the shoulders
    for (let i = 0; i < 4; i++) sprout(q, [-16 + i * 10, 186 - (i & 1) * 6, -22], [i * 0.1 - 0.15, 0.9, -0.6], 8, 5, i === 2);
    // wet weed hanging off the hem
    for (let i = 0; i < 10; i++) { const a = i * 0.63 + 0.2; strand(q, [Math.cos(a) * 38, 22, Math.sin(a) * 33], 14 + hashI(i, 4) * 8, 1.5, mixP(MOSS, CAP(0.3), 0.3), i, 1.5); }
  },
  arm(p, s) {
    const sh = [s * 22, 184, 4], el = [s * 30, 146, 14], wr = [s * 30, 120, 30];
    // a wide sleeve, hanging open
    U(cap(p, sh, el, 8, 9), COAT(0.2, 0x08070a, 0.75), 3); U(Math.max(cap(p, el, [wr[0], wr[1] + 6, wr[2] - 4], 9, 12), -cap(p, el, [wr[0], wr[1] + 2, wr[2] - 2], 6, 10)), COAT(0.2, 0x08070a, 0.75), 2.5);
    if (s < 0) { hand(p, wr, s, 4.4, 4, 22); return; }
    // the pole: a long pale shaft, held at the middle; at the top a crook with a lit pod hanging off it
    const g = [30, 118, 34], t = [34, 292, 20], b = [26, -4, 46];
    U(cap(p, b, t, 2.6, 2.2), mixP(BONEC, C(0x4a4030), 0.4), 1);
    chain(p, [t, [38, 300, 14], [44, 296, 6], [46, 286, 4]], 2.2, 1.6, mixP(BONEC, C(0x4a4030), 0.4), 1);
    U(cap(p, [46, 286, 4], [46, 276, 4], 0.8), MYC2, 0.4); U(ell(p, [46, 268, 4], [6, 8, 6]), mixP(CAP(0.6), C(0x2a2010), 0.3), 1.5); P(ell(p, [46, 268, 4], [6.4, 8.4, 6.4]) + 1.2, GLOW(1), 1.2);
    hand(p, wr, s, 4.6, 4, 14, g);
  },
  head(p) {
    // the hood: deep, pointed at the back, the face lost in it but for the eyes
    const hood = Math.max(ell(p, [0, 212, 6], [19, 24, 22]), -ell(p, [0, 208, 18], [13, 18, 16]));
    U(Math.min(hood, cap(p, [0, 224, -6], [0, 238, -22], 9, 2)), COAT(0.22, 0x0a080a, 0.72), 4);
    U(ell(p, [0, 206, 8], [12, 16, 12]), C(0x060507), 4);
    for (const s of [-1, 1]) U(ell(p, [s * 4.6, 210, 19], [2.2, 1.4, 1.4]), GLOW(1), 0.6);
    { const a = Math.atan2(p[0], p[2] - 6); if (hood < 3) bump((Math.abs(Math.sin(a * 5 + p[1] * 0.04)) < 0.25 ? -1 : 0)); }
    S(p[1] - 180, 1.5);
  },
});

// ---------------------------------------------------------------- MOTHER MOURN (The Lagoon's Own)
// A widow in a bell of a mourning dress, swept along the ground; a narrow bodice, long thin arms, and over the face a
// veil hung from a tall comb, the veil gone to a curtain of dark gill through which her eyes still show.
export const B_Mourn = hostRig({
  height: 260, hipY: 84, hipX: 10, sh: [22, 186, 2], neck: [0, 190, 4], legs: { r: 7, splay: 0, bootTop: 18 },
  bodyLo: [-76, 0, -76], bodyHi: [76, 204, 76], bodyTris: 15000, headLo: [-40, 178, -46], headHi: [40, 270, 46], headTris: 11000,
  armBox: [[4, 60, -30], [70, 196, 60]],
  torso(p) {
    const q = trunk(p, { chest: [[0, 164, 2], [18, 20, 14]], belly: [[0, 136, 2], [13, 18, 11]], neckY: 196 });
    // the bodice, tight, buttoned; the skirt a great bell to the floor, flounced in tiers like gills
    garment(q, { top: 192, bot: 120, r0: [17, 14], r1: [18, 15], closed: true, t: 2.4, ragged: 0, col: COAT(0.25, 0x0c080c, 0.7), folds: 14 });
    const sk = garment(q, { top: 124, bot: 2, r0: [22, 20], r1: [66, 62], closed: true, t: 3, ragged: 6, rag: 13, col: COAT(0.26, 0x0c080c, 0.7), folds: 16 });
    for (const y of [96, 64, 34]) { const u = (124 - y) / 122, r = 22 + 44 * u * u; U(Math.max(Math.abs(len(q[0], 0, q[2]) - (r + 3)) - 2, Math.abs(q[1] - y) - 4 - Math.sin(Math.atan2(q[2], q[0]) * 18) * 1.5), COAT(0.34, 0x0c080c, 0.6), 2); }   // the flounces
    U(ell(q, [0, 100, 0], [30, 30, 28]), C(0x060506), 6); void sk;   // the dark inside, never seen
    for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.4; sprout(q, [Math.cos(a) * 52, 40 + (i & 1) * 12, Math.sin(a) * 48], [Math.cos(a), 0.5, Math.sin(a)], 8, 5, i % 2 === 0); }
    U(torus(q, [0, 188, 3], 11, 2.2), C(0x0a0808), 1.5); for (let i = 0; i < 5; i++) pore(q, [0, 178 - i * 10, 15.5], 1.4, [0, 0, 1]);
  },
  leg(p, s) {   // only the toes of her shoes ever show under the hem
    U(cap(p, [s * 10, 86, 0], [s * 11, 12, 2], 7, 6), C(0x060506), 3); U(ell(p, [s * 11, 6, 8], [6, 6, 11]), LEATH2, 3); S(p[1] + 0.5, 1);
  },
  arm(p, s) {
    const sh = [s * 22, 186, 2], el = [s * 30, 146, 10], wr = [s * 32, 108, 20];
    sleeveArm(p, s, sh, el, wr, 4.8, COAT(0.25, 0x0c080c, 0.7));
    U(Math.max(cap(p, el, [wr[0], wr[1] + 8, wr[2] - 2], 6, 9), -cap(p, el, [wr[0], wr[1] + 4, wr[2]], 4, 7)), COAT(0.25, 0x0c080c, 0.7), 2);   // lace at the wrist, ragged
    hand(p, [wr[0], wr[1] - 3, wr[2] + 2], s, 3.8, 4, 30);   // fingers too long
  },
  head(p) {
    U(cap(p, [0, 190, 4], [0, 212, 6], 7, 8), SKIN, 4); U(ell(p, [0, 220, 8], [11, 14, 11]), SKIN, 4);
    hostFace(p, { c: [0, 222, 18], eyeX: 4.6, eyeR: 2.4, mouthY: -10, mouthW: 5, teeth: false });
    // the comb: a tall crest at the back of the head, the veil hung from it, falling in strips over the face to the chest
    U(Math.max(ell(p, [0, 238, 2], [14, 22, 8]), -(p[1] - 226)), COAT(0.3, 0x0a080a, 0.65), 3);
    for (let i = 0; i < 19; i++) { const a = (i / 18) * Math.PI * 1.25 - Math.PI * 0.12, x = Math.cos(a) * 15, z = 8 + Math.sin(a) * 15, L = 44 + hashI(i, 8) * 10 - (Math.sin(a) > 0.9 ? 10 : 0);
      if (Math.abs(x) < 6 && z > 18) continue;   // a gap over the eyes
      const pts = []; for (let k = 0; k <= 5; k++) { const t = k / 5; pts.push([x * (1 + t * 0.5), 240 - L * t, z * (1 + t * 0.35) + 2 * t]); } chain(p, pts, 1.6, 1.1, mixP(COAT(0.3, 0x0a080a, 0.65), C(0x000000), 0.2), 0.8); }
    S(p[1] - 186, 1.5);
  },
});

// ---------------------------------------------------------------- THE HUMAN CANNONBALL (Fired Twice Nightly)
// Short and solid, built to be shot from a gun: a round shell of a helmet (a puffball now) with goggles that glow, a
// little cape, a strongman's belt, bowed legs braced for the landing.
export const B_Cannonball = hostRig({
  height: 200, hipY: 58, hipX: 18, sh: [34, 128, 4], neck: [0, 132, 8], legs: { r: 13, splay: 6, bootTop: 34 },
  bodyLo: [-66, 30, -60], bodyHi: [66, 170, 60], headLo: [-46, 120, -42], headHi: [46, 214, 56], headH: 1.2,
  armBox: [[14, 30, -30], [76, 140, 60]],
  torso(p) {
    const q = trunk(p, { chest: [[0, 112, 4], [36, 26, 26]], belly: [[0, 86, 4], [30, 22, 24]], neckY: 134 });
    fitted(q, { t: 1.6, top: 132, bot: 70, col: mixP(CAP(0.7), C(0xe8dcc0), 0.35), folds: 4 });   // the striped tights
    if (q[1] > 70 && q[1] < 134 && Math.abs(len(q[0] / 36, 0, q[2] / 27) - 1) < 0.15) P(-Math.abs(Math.sin(q[1] * 0.2)) + 0.5, C(0xe8dcc0), 0.2);
    U(Math.max(Math.abs(q[1] - 78) - 6, len(q[0], 0, q[2]) - 33), LEATH, 2); U(ell(q, [0, 78, 32], [10, 8, 3]), BRASS, 1.5);
    garment(q, { top: 136, bot: 76, r0: [30, 22], r1: [42, 30], closed: true, back: -12, t: 1.8, ragged: 5, col: mixP(CAP(0.8), C(0x5a1a12), 0.3), folds: 6 });   // the cape (only behind)
    S(Math.max(-q[2] + 6, -(q[1] - 76)), 2);   // cut the cape away in front
    sprout(q, [-24, 130, -12], [-0.5, 1, -0.4], 9, 6, true);
  },
  arm(p, s) {
    const sh = [s * 34, 128, 4], el = [s * 52, 104, 8], wr = [s * 56, 80, 18];
    U(cap(p, sh, el, 13, 11), SKIN, 5); U(cap(p, el, wr, 11, 9), SKIN, 5); mold(p, 70, 130);
    U(cap(p, [wr[0], wr[1] + 10, wr[2] - 2], [wr[0], wr[1] - 2, wr[2] + 1], 10, 10), LEATH, 1.5);   // wrist straps
    hand(p, [wr[0], wr[1] - 4, wr[2] + 1], s, 8, 4, 12);
  },
  head(p) {
    U(cap(p, [0, 126, 6], [0, 146, 10], 13, 14), SKIN, 5);
    // the helmet: a big round shell coming down over the head to the jaw, a fin over the top, a lit seam round it
    const hm = ell(p, [0, 166, 10], [30, 34, 30]);
    U(Math.max(hm, 142 - p[1]), CAP(1), 4); { const [d1] = cells(p[0] * 0.18, p[1] * 0.18, p[2] * 0.18); if (hm < 2) bump(-Math.max(0, 0.32 - d1) * 3); }
    U(Math.max(Math.abs(p[0]) - 2.6, ell(p, [0, 176, 4], [10, 34, 36]), -(p[1] - 168)), mixP(CAP(0.6), C(0x2a1a12), 0.4), 2);   // the fin
    P(Math.abs(p[1] - 150) - 1.2, GLOW(0.8), 0.6);
    // the goggles: two big lit lenses in brass rings on the front of the shell
    for (const s of [-1, 1]) { const g = [s * 11, 164, 38]; U(torus(rotX(p, g, 1.5), g, 7, 2.4), BRASS, 1); S(sph(p, [g[0], g[1], g[2] + 3], 6.2), 1); U(sph(p, [g[0], g[1], g[2] - 2], 6.2), GLOW(1), 1); }
    U(ell(p, [0, 140, 24], [14, 6, 8]), SKIN, 4); S(ell(p, [0, 138, 31], [8, 2.6, 4]), 1.2, GUM);   // the jaw under the shell
    S(p[1] - 122, 1.5);
  },
});

// ---------------------------------------------------------------- THE TWINS (Billed as Inseparable)
// One pair of legs and everything else twice: two bodies leaning apart from one pair of hips, two heads (one round,
// one long), an arm each on the outside and the two inner arms grown together into one.
export const B_Twins = hostRig({
  height: 230, hipY: 70, hipX: 17, sh: [56, 150, 2], neck: [0, 150, 6], legs: { r: 12, splay: 5, bootTop: 34 },
  bodyLo: [-90, 40, -50], bodyHi: [90, 196, 56], bodyTris: 15000, headLo: [-80, 140, -34], headHi: [80, 240, 50], headTris: 12000,
  armBox: [[30, 30, -30], [100, 160, 60]],
  torso(p) {
    U(ell(p, [0, 84, 2], [30, 20, 22]), SKIN, 10);
    for (const s of [-1, 1]) { const q = rotZ(p, [0, 90, 0], s * -0.32); U(ell(q, [0, 122, 2], [22, 30, 18]), SKIN, 10); U(ell(q, [0, 146, 2], [26, 16, 18]), SKIN, 10); U(cap(q, [0, 146, 4], [0, 168, 6], 9, 8), SKIN, 6);
      fitted(q, { shapes: [[[0, 122, 2], [22, 30, 18]], [[0, 146, 2], [26, 16, 18]]], t: 2, top: 158, bot: 94, ragged: 2, col: s < 0 ? mixP(CAP(0.7), C(0x3a1a2a), 0.4) : mixP(CAP(0.7), C(0x1a2a3a), 0.4), folds: 7 }); }
    garment(p, { top: 98, bot: 62, r0: [32, 22], r1: [34, 24], closed: true, ragged: 4, col: COAT(0.4, 0x2a1a10, 0.55), folds: 8 });   // the shared skirt of a costume
    // the inner arms, grown into one, hanging between them
    chain(p, [[-14, 146, 12], [-6, 122, 22], [0, 100, 28]], 6, 5, ROOT, 3); chain(p, [[14, 146, 12], [6, 122, 22], [0, 100, 28]], 6, 5, ROOT2, 3); hand(p, [0, 96, 30], 1, 6.5, 5, 14);
    for (let k = -2; k <= 2; k++) U(cap(p, [k * 2.4, 150 + k * 2, 18], [k * 2.4, 140 + k * 2, 22], 0.7), MYC, 0.4);   // stitched where they meet
    sprout(p, [-30, 164, -10], [-0.6, 1, -0.4], 9, 6, true); sprout(p, [30, 162, -12], [0.6, 1, -0.4], 8, 5);
  },
  arm(p, s) {
    const sh = [s * 56, 150, 2], el = [s * 70, 118, 10], wr = [s * 72, 88, 22];
    sleeveArm(p, s, sh, el, wr, 7, s < 0 ? mixP(CAP(0.7), C(0x3a1a2a), 0.4) : mixP(CAP(0.7), C(0x1a2a3a), 0.4), C(0xe8dcc0)); hand(p, wr, s, 6.5, 4, 16);
  },
  head(p) {
    for (const s of [-1, 1]) { const c = [s * 40, 186, 8]; U(cap(p, [s * 34, 156, 6], [c[0], c[1] - 8, c[2]], 9, 10), SKIN, 5);
      if (s < 0) { U(ell(p, c, [15, 15, 14]), SKIN, 5); hostFace(p, { c: [c[0], c[1], c[2] + 13], eyeX: 5, eyeR: 2.5, mouthY: -9, mouthW: 6 });
        hat(p, { c: [c[0], c[1] + 10, c[2]], crown: [13, 12, 3], dome: 11, brim: 20, brimT: 2.4, droop: 5, col: CAP(1), warts: 5, seed: 13 }); }   // the round one under a toadstool
      else { U(ell(p, c, [11, 18, 12]), SKIN, 5); hostFace(p, { c: [c[0], c[1] - 2, c[2] + 11], eyeX: 4.2, eyeR: 2.3, mouthY: -10, mouthW: 5 });
        hat(p, { c: [c[0], c[1] + 10, c[2]], crown: [14, 9, 20], dome: 9, brim: 15, brimT: 1.6, droop: 7, col: CAP(1), warts: 4, seed: 14, tilt: 0.15 }); } }   // the long one under a bell
    S(p[1] - 148, 1.5);
  },
});

// ---------------------------------------------------------------- GRIN (The Last Clown)
// Baggy and bright: a ruff like a frilled gill round the neck, a tall cone hat with a puffball on its tip, a round lit
// nose, a grin too wide for the face, pantaloons and long shoes.
export const B_Grin = hostRig({
  height: 220, hipY: 66, hipX: 18, sh: [34, 140, 4], neck: [0, 144, 6], legs: { r: 14, splay: 6, bootTop: 26, cloth: mixP(CAP(0.8), C(0xe8dcc0), 0.4) },
  bodyLo: [-60, 30, -50], bodyHi: [60, 172, 56], headLo: [-52, 130, -40], headHi: [52, 262, 60], headTris: 10000,
  armBox: [[14, 40, -30], [72, 150, 60]],
  leg(p, s, o) {
    hostLeg(p, s, o);
    U(ell(p, [s * 22, 6, 24], [9, 6, 22]), C(0x6a1a14), 3); U(sph(p, [s * 22, 8, 44], 7), C(0x6a1a14), 2);   // the long shoes, round toed
  },
  torso(p) {
    const q = trunk(p, { chest: [[0, 120, 4], [26, 22, 19]], belly: [[0, 92, 6], [30, 26, 24]], neckY: 146 });
    garment(q, { top: 142, bot: 60, r0: [30, 23], r1: [40, 32], closed: true, t: 2.2, ragged: 3, col: mixP(CAP(0.8), C(0xe8dcc0), 0.4), folds: 6 });
    for (let i = 0; i < 3; i++) U(sph(q, [0, 124 - i * 16, 26 + i * 2], 4.6), GLOW(0.9), 1.2);   // three big lit pom-poms down the front
    { const a = Math.atan2(q[2], q[0]); if (Math.abs(len(q[0] / 34, 0, q[2] / 27) - 1) < 0.15 && q[1] < 142 && q[1] > 60) P(Math.abs(Math.sin(a * 3)) - 0.5, mixP(CAP(1), C(0x000000), 0.2), 0.1); }
    // the ruff: a deep frill of gill round the neck
    { const a = Math.atan2(q[2] - 4, q[0]), rr = len(q[0], 0, q[2] - 4), y0 = 142 + Math.sin(a * 16) * 4; U(Math.max(Math.abs(q[1] - y0) - 2.4 - (rr - 10) * 0.06, rr - 32, 9 - rr), mixP(C(0xf0e8d8), FLESH(0.4), 0.3), 2); }
    sprout(q, [-20, 134, -18], [-0.5, 1, -0.6], 8, 5, true);
  },
  arm(p, s) {
    const sh = [s * 34, 140, 4], el = [s * 46, 112, 14], wr = [s * 48, 84, 26];
    sleeveArm(p, s, sh, el, wr, 8, mixP(CAP(0.8), C(0xe8dcc0), 0.4));
    U(Math.max(Math.abs(len(p[0] - wr[0], 0, p[2] - wr[2]) - 9) - 2, Math.abs(p[1] - (wr[1] + 6 + Math.sin(Math.atan2(p[2] - wr[2], p[0] - wr[0]) * 10) * 2)) - 2), C(0xf0e8d8), 1.5);   // frilled cuffs
    hand(p, [wr[0], wr[1] - 4, wr[2] + 2], s, 7, 4, 14);
  },
  head(p) {
    U(cap(p, [0, 140, 6], [0, 160, 10], 11, 13), SKIN, 5); U(ell(p, [0, 170, 12], [21, 20, 19]), SKIN, 6);
    // the grin: ear to ear, full of teeth; the nose a round lit ball; the eyes small and wide apart
    S(Math.max(ell(p, [0, 160, 28], [18, 8, 10]), -(p[1] - 154 + Math.abs(p[0]) * 0.25)), 1.5, GUM);
    for (let i = -6; i <= 6; i++) { const x = i * 2.6, y = 162 - Math.abs(i) * 0.2; U(cap(p, [x, y + 3, 28 - Math.abs(i) * 0.3], [x, y - 1.5, 29 - Math.abs(i) * 0.3], 1.1, 0.3), TOOTH, 0.4); }
    U(sph(p, [0, 172, 33], 5.6), mixP(GLOW(1), C(0xff3020), 0.25), 1.2);
    for (const s of [-1, 1]) { eye(p, [s * 9, 180, 26], 2.6); P(ell(p, [s * 9, 180, 27], [5, 8, 3]), C(0xe8e0d0), 1); }   // greasepaint over the eyes
    // the cone hat, tall and leaning, a lit puffball on the tip
    hat(p, { c: [0, 186, 10], crown: [15, 2.5, 52], col: CAP(1), tilt: 0.28, warts: 6, seed: 17, band: [4, 3, mixP(CAP(0.4), C(0xe8dcc0), 0.5)] });
    { const tip = [14, 236, 10]; U(sph(p, tip, 7), mixP(C(0xe8dcc0), FLESH(0.4), 0.3), 2); { const [d1] = cells(p[0] * 0.4, p[1] * 0.4, p[2] * 0.4); if (sph(p, tip, 7.5) < 1) bump(-Math.max(0, 0.3 - d1) * 1.5); } }
    S(p[1] - 136, 1.5);
  },
});

// ---------------------------------------------------------------- THE RINGMASTER (The Show Must Go On)
// A coat-hanger of a man: shoulders out to here with fringed epaulettes, a waist you could close your hand round, a
// tower of a top hat, a tailcoat whose tails reach his knees, tall boots, and the whip coiled in his fist.
export const B_Ringmaster = hostRig({
  height: 265, hipY: 86, hipX: 12, sh: [38, 186, 2], neck: [0, 190, 6], legs: { r: 9, splay: 2, bootTop: 58 },
  bodyLo: [-70, 30, -56], bodyHi: [70, 204, 50], headLo: [-40, 180, -36], headHi: [40, 300, 50], headTris: 10000,
  armBox: [[18, 20, -30], [84, 198, 70]], armTris: [4000, 6500],
  torso(p) {
    const q = trunk(p, { chest: [[0, 166, 2], [34, 22, 17]], belly: [[0, 128, 2], [15, 22, 13]], neckY: 196 });
    U(cap(q, [0, 92, 0], [0, 122, 0], 15, 14), SKIN, 8);
    // the tailcoat: cut away in front at the waist, two long tails behind to the knee; a waistcoat, buttons
    const coat = mixP(CAP(0.75), C(0x6a1410), 0.35);
    fitted(q, { t: 2.2, top: 194, bot: 118, col: coat, folds: 6 });
    { const tl = Math.max(garment(q, { top: 124, bot: 50, r0: [19, 16], r1: [24, 20], closed: true, t: 2, ragged: 3, rag: 3, col: coat, folds: 4 }), q[2] + 4); void tl; }
    S(Math.max(-q[2] - 2, 124 - q[1], q[1] - 40), 2);   // cut the long coat away in front of the legs: tails behind only
    for (let i = 0; i < 4; i++) pore(q, [0, 178 - i * 12, 18], 1.8, [0, 0, 1]);
    // the epaulettes: shelf-fungus fringed with hyphae
    for (const s of [-1, 1]) { U(ell(q, [s * 36, 194, 0], [14, 4, 13]), BRASS, 2); for (let i = 0; i < 9; i++) { const a = i * 0.7 - 2.8; strand(q, [s * (36 + Math.cos(a) * 12), 191, Math.sin(a) * 11], 9, 1.1, BRASS, i, 0.5); } }
    sprout(q, [-14, 192, -14], [-0.3, 1, -0.6], 10, 6, true);
  },
  arm(p, s) {
    const sh = [s * 38, 186, 2], el = [s * 48, 152, 10], wr = [s * 50, 120, 22];
    sleeveArm(p, s, sh, el, wr, 6.4, mixP(CAP(0.75), C(0x6a1410), 0.35), BRASS);
    if (s < 0) { hand(p, wr, s, 5.2, 4, 18); return; }
    // the whip: a short handle in the fist, the lash coiled in loops hanging from it
    const g = [50, 116, 28];
    U(cap(p, [50, 124, 24], [52, 100, 34], 2.6, 2.2), LEATH, 1);
    for (let k = 0; k < 4; k++) U(torus(rotZ(p, [56, 84 - k * 3, 36], 1.35 + k * 0.1), [56, 84 - k * 3, 36], 14 - k * 1.5, 1.4), LEATH2, 0.8);
    chain(p, [[52, 100, 34], [54, 92, 36], [56, 72, 40], [52, 50, 46], [58, 36, 52]], 1.4, 0.6, LEATH2, 0.6);
    hand(p, wr, s, 5.4, 4, 14, g);
  },
  head(p) {
    U(cap(p, [0, 190, 4], [0, 212, 8], 9, 10), SKIN, 5); U(ell(p, [0, 220, 10], [12, 15, 12]), SKIN, 5);
    hostFace(p, { c: [0, 222, 21], eyeX: 5, eyeR: 2.6, mouthY: -11, mouthW: 6 });
    for (const s of [-1, 1]) chain(p, [[s * 1.5, 214, 22], [s * 10, 213, 21], [s * 18, 216, 17], [s * 21, 222, 14]], 2.2, 0.5, mixP(MYC2, C(0x2a1a10), 0.5), 1);   // the moustache, waxed
    hat(p, { c: [0, 230, 9], crown: [13, 15, 54], dome: 2, brim: 19, brimT: 1.8, droop: -3, col: CAP(1), band: [8, 4.5, mixP(CAP(0.3), C(0x6a1410), 0.5)], warts: 5, seed: 19 });
    S(p[1] - 186, 1.5);
  },
});

// ---------------------------------------------------------------- THE HARBOURMASTER (Nothing Leaves Without His Say)
// A wall of greatcoat: wide, deep, collar up, a peaked cap low over his eyes, barnacles grown thick on his shoulders,
// a hook where his left hand was, a pipe clamped in a beard of weed.
export const B_Harbourmaster = hostRig({
  height: 240, hipY: 74, hipX: 18, sh: [44, 166, 4], neck: [0, 170, 8], legs: { r: 12, splay: 4, bootTop: 40 },
  bodyLo: [-80, 20, -66], bodyHi: [80, 196, 68], bodyTris: 14000, headLo: [-40, 156, -34], headHi: [40, 238, 60],
  armBox: [[18, 30, -40], [90, 180, 70]], armTris: [4500, 5500],
  torso(p) {
    const q = trunk(p, { chest: [[0, 146, 4], [40, 28, 26]], belly: [[0, 112, 6], [36, 30, 28]], neckY: 176 });
    const coat = mixP(CAP(0.4), C(0x1a2430), 0.55);
    garment(q, { top: 172, bot: 30, r0: [40, 31], r1: [54, 44], open: 6, ragged: 4, col: coat, folds: 9, t: 3.2 });
    for (const s of [-1, 1]) U(ell(q, [s * 36, 168, 4], [18, 14, 22]), coat, 8);   // the shoulders of it, rounded
    garment(q, { top: 184, bot: 160, r0: [20, 18], r1: [40, 30], closed: true, t: 2.4, col: coat });   // the collar turned up
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) U(sph(q, [s * 12, 160 - i * 18, 38 + (i > 2 ? 2 : 0)], 2.8), BRASS, 1);   // two rows of buttons
    // barnacles: cones crowded on the shoulders and down the back, each with a dark pit
    for (let i = 0; i < 26; i++) { const a = i * 2.399, side = i % 2 ? 1 : -1, x = side * (26 + hashI(i, 1) * 22), y = 150 + hashI(i, 2) * 30, z = -10 + Math.sin(a) * 18, r = 3 + hashI(i, 3) * 3;
      U(cap(q, [x, y - 2, z], [x * 1.04, y + r * 1.2, z], r, r * 0.6), C(0xa8a094), 1.5); S(sph(q, [x * 1.04, y + r * 1.3, z], r * 0.4), 0.6, C(0x1a1612)); }
    sprout(q, [-18, 178, -20], [-0.3, 1, -0.6], 9, 6, true);
  },
  arm(p, s) {
    const sh = [s * 44, 166, 4], el = [s * 56, 128, 12], wr = [s * 56, 96, 26];
    sleeveArm(p, s, sh, el, wr, 9.5, mixP(CAP(0.4), C(0x1a2430), 0.55), mixP(CAP(0.3), C(0x101418), 0.6));
    if (s > 0) { hand(p, wr, s, 8, 4, 16); return; }
    // the hook: a cup over the stump and a great iron hook
    U(cap(p, [wr[0], wr[1] + 4, wr[2]], [wr[0], wr[1] - 8, wr[2] + 2], 9, 8), C(0x2a2018), 1.5);
    { const c = [wr[0], wr[1] - 26, wr[2] + 6], q = rotY(p, c, 0.5), a = Math.atan2(q[1] - c[1], q[2] - c[2]); U(Math.max(Math.abs(len(0, q[1] - c[1], q[2] - c[2]) - 11) - 2.6, Math.abs(q[0] - c[0]) - 2.6, a > 0.7 && a < 2.4 ? 3 : -3), IRONC, 1);
      U(cap(p, [wr[0], wr[1] - 8, wr[2] + 2], [c[0], c[1] + 11, c[2]], 2.6), IRONC, 1); }
  },
  head(p) {
    U(cap(p, [0, 164, 6], [0, 186, 10], 13, 14), SKIN, 5); U(ell(p, [0, 194, 12], [16, 17, 15]), SKIN, 5);
    hostFace(p, { c: [0, 194, 26], eyeX: 5.8, eyeR: 2.7, mouthY: -12, mouthW: 7 });
    // the beard of weed, thick; the pipe
    U(ell(p, [0, 180, 20], [15, 12, 9]), mixP(MOSS, CAP(0.3), 0.3), 5); for (let i = 0; i < 9; i++) strand(p, [-10 + i * 2.5, 174, 22], 10 + hashI(i, 6) * 10, 1.6, mixP(MOSS, CAP(0.3), 0.3), i, 1.5);
    chain(p, [[6, 184, 28], [12, 180, 36], [16, 182, 42]], 1.4, 1.4, C(0x2a1a10), 0.6); U(cap(p, [16, 180, 42], [16, 190, 42], 3.4, 3.8), C(0x3a2416), 1); U(sph(p, [16, 191, 42], 2.6), GLOW(0.9), 0.6);
    // the peaked cap: a flat round top, a band, a short visor out over the eyes
    hat(p, { c: [0, 204, 12], crown: [17, 19, 8], dome: 3, col: CAP(1), band: [2, 3, mixP(CAP(0.3), C(0x101418), 0.6)], warts: 4, seed: 21, pitch: 0.12 });
    U(Math.max(ell(p, [0, 203, 30], [16, 1.8, 12]), -(p[2] - 20)), mixP(CAP(0.35), C(0x0a0808), 0.6), 1.5);
    S(p[1] - 160, 1.5);
  },
});

// ---------------------------------------------------------------- THE HANGMAN (The Wharf Is Named for His Work)
// Tall, long in the arm, bare-armed and aproned, a pointed hood over the whole head with two holes for the light to come
// out of; a coil of rope over one shoulder and the noose hanging from his hand.
export const B_Hangman = hostRig({
  height: 280, hipY: 92, hipX: 14, sh: [34, 196, 2], neck: [0, 200, 4], legs: { r: 10, splay: 3, bootTop: 46 },
  bodyLo: [-64, 40, -50], bodyHi: [64, 214, 56], headLo: [-30, 190, -30], headHi: [30, 290, 38],
  armBox: [[14, 0, -36], [70, 204, 66]], armTris: [4500, 6500],
  torso(p) {
    const q = trunk(p, { chest: [[0, 172, 2], [32, 26, 20]], belly: [[0, 136, 4], [24, 26, 18]], neckY: 204 });
    U(cap(q, [0, 98, 0], [0, 130, 0], 18, 19), SKIN, 8); fibres(q, [0, 0, 0], 18, 0.6);
    // the apron, leather, from the chest to the shin, strapped round the neck
    { const ap = box(q, [0, 120, 21], [26, 54, 4], 2); U(Math.max(ap, -(q[2] - 12)), LEATH, 2); if (ap < 2) P(-fbm(q[0] * 0.08, q[1] * 0.08, 3) - 0.1, mixP(LEATH, CAP(0.4), 0.4), 0.15); }
    U(Math.max(Math.abs(q[1] - 104) - 3, len(q[0], 0, q[2]) - 26), LEATH2, 2);
    // the coil of rope over the left shoulder, across the chest
    { const c = [-14, 168, 4], q2 = rotZ(rotX(q, c, 0.2), c, 0.75); for (let k = 0; k < 4; k++) U(torus(rotX(q2, c, 1.57), [c[0], c[1], c[2] + (k - 1.5) * 2.6], 26, 2.4), ROPE2, 1); }
    garment(q, { top: 120, bot: 52, r0: [24, 19], r1: [28, 22], open: 10, ragged: 5, col: COAT(0.3, 0x14100c, 0.6), folds: 9 });   // breeches, ragged
    sprout(q, [16, 196, -14], [0.4, 1, -0.6], 10, 6, true); sprout(q, [24, 186, -16], [0.6, 0.8, -0.6], 7, 4.4);
  },
  arm(p, s) {
    const sh = [s * 34, 196, 2], el = [s * 42, 148, 10], wr = [s * 44, 100, 18];
    U(cap(p, sh, el, 9, 7.5), SKIN, 4); U(cap(p, el, wr, 7.5, 6), SKIN, 4); fibres(p, el, 12, 0.5); mold(p, 90, 190);
    if (s < 0) { hand(p, wr, s, 6, 4, 24); return; }
    // the noose: a rope from the fist down to the loop and its knot
    const g = [44, 96, 22];
    chain(p, [[44, 104, 22], [46, 86, 24], [48, 64, 22], [48, 44, 20]], 2.4, 2.4, ROPE2, 1);
    U(cap(p, [48, 48, 20], [48, 30, 20], 3.6, 3.6), ROPE2, 1); for (let k = 0; k < 6; k++) U(torus(p, [48, 30 + k * 3, 20], 4, 1.2), ROPE2, 0.6);
    U(torus(rotZ(p, [48, 16, 20], 1.57), [48, 16, 20], 13, 2.4), ROPE2, 1);
    hand(p, wr, s, 6.2, 4, 14, g);
  },
  head(p) {
    U(cap(p, [0, 198, 4], [0, 222, 6], 10, 11), SKIN, 5);
    // the hood: down over the whole head to the shoulders, a tall point, two ragged holes with the light behind them
    const hd = Math.min(cap(p, [0, 204, 4], [0, 268, -6], 16, 3), ell(p, [0, 206, 4], [17, 14, 16]));
    U(hd, mixP(CAP(0.35), C(0x14100e), 0.6), 4);
    { const a = Math.atan2(p[0], p[2] - 4); if (hd < 2) bump(Math.abs(Math.sin(a * 4 + p[1] * 0.05)) < 0.2 ? -0.8 : 0); }
    for (const s of [-1, 1]) { S(ell(p, [s * 6, 226, 19], [3.6, 2.6, 6]), 1.2, C(0x060505)); U(ell(p, [s * 6, 226, 15], [2.4, 1.8, 1.8]), GLOW(1), 0.6); }
    U(Math.max(Math.abs(len(p[0], 0, (p[2] - 4) * 1.05) - 19) - 2, Math.abs(p[1] - 196 - Math.sin(Math.atan2(p[2], p[0]) * 7) * 3) - 3), mixP(CAP(0.35), C(0x14100e), 0.6), 2);   // the ragged hem on the shoulders
    S(p[1] - 194, 1.5);
  },
});

// ---------------------------------------------------------------- CAPTAIN GRAVES (Master of the Providence)
// Drowned and still in command: a tricorn hat (three upturned lobes of cap), a long coat with deep cuffs streaming weed,
// a peg leg, barnacles, and a cutlass of fungus-bone held out.
export const B_Graves = hostRig({
  height: 235, hipY: 78, hipX: 15, sh: [34, 166, 4], neck: [0, 170, 8], legs: { r: 10, splay: 3, bootTop: 44 },
  bodyLo: [-66, 22, -56], bodyHi: [66, 194, 60], headLo: [-46, 156, -40], headHi: [46, 236, 52],
  armBox: [[14, 40, -30], [80, 180, 110]], armTris: [4000, 6500],
  leg(p, s, o) {
    if (s > 0) { hostLeg(p, s, o); return; }
    // the peg: the leg ends at the knee in a wooden peg strapped on
    const hip = [-15, 82, 0], knee = [-17, 42, 5];
    U(cap(p, hip, knee, 11, 10), COAT(0.42, 0x16100a, 0.55), 4); U(cap(p, knee, [-17, 34, 5], 10, 9), mixP(LEATH, C(0x000000), 0.2), 2);
    U(cap(p, [-17, 36, 5], [-16, 2, 3], 5.6, 3.6), WOOD, 1.5); for (const y of [40, 30]) U(Math.max(Math.abs(p[1] - y) - 1.5, len(p[0] + 17, 0, p[2] - 5) - 10.5), LEATH2, 1);
    S(p[1] + 0.5, 1);
  },
  torso(p) {
    const q = trunk(p, { chest: [[0, 146, 4], [30, 24, 20]], belly: [[0, 116, 4], [26, 26, 19]], neckY: 176 });
    const coat = mixP(CAP(0.45), C(0x1a1430), 0.5);
    garment(q, { top: 176, bot: 40, r0: [34, 24], r1: [40, 34], open: 12, ragged: 7, rag: 8, col: coat, folds: 10 });
    for (let i = 0; i < 5; i++) for (const s of [-1, 1]) U(sph(q, [s * 16, 160 - i * 14, 25], 2.2), BRASS, 1);
    U(Math.max(Math.abs(q[1] - 108) - 4, len(q[0], 0, q[2]) - 30), LEATH, 2); U(box(q, [0, 108, 30], [6, 5, 2], 1), BRASS, 1);
    U(Math.max(box(rotZ(q, [0, 140, 0], 0.6), [0, 140, 0], [4, 46, 32], 1), -(q[2] + 0)), LEATH2, 1.5);   // the baldric
    for (let i = 0; i < 14; i++) { const a = i * 0.45 + 0.3; strand(q, [Math.cos(a) * 38, 46, Math.sin(a) * 32], 10 + hashI(i, 9) * 10, 1.4, mixP(MOSS, CAP(0.3), 0.3), i, 1.4); }   // weed off the hem
    for (let i = 0; i < 14; i++) { const x = (hashI(i, 4) - 0.5) * 50, y = 120 + hashI(i, 5) * 50, z = -20 - hashI(i, 6) * 6, r = 2.4 + hashI(i, 7) * 2; U(cap(q, [x, y, z], [x, y, z - r], r, r * 0.6), C(0xa8a094), 1.2); }
    sprout(q, [-14, 172, -16], [-0.4, 1, -0.6], 9, 6, true);
  },
  arm(p, s) {
    const sh = [s * 34, 166, 4], el = [s * 44, 132, 14], wr = s > 0 ? [44, 112, 40] : [-46, 100, 22];
    sleeveArm(p, s, sh, el, wr, 7, mixP(CAP(0.45), C(0x1a1430), 0.5), mixP(CAP(0.3), C(0x0a0818), 0.6));
    U(cap(p, [wr[0], wr[1] + 2, wr[2]], [wr[0] + (el[0] - wr[0]) * 0.25, wr[1] + (el[1] - wr[1]) * 0.25, wr[2] + (el[2] - wr[2]) * 0.25], 11, 10), mixP(CAP(0.3), C(0x0a0818), 0.6), 1.5);   // deep cuffs
    if (s < 0) { hand(p, wr, s, 6, 4, 16); return; }
    // the cutlass: a basket hilt and a curved blade of pale fungus-bone, held out forward
    const g = [44, 110, 46]; U(torus(rotX(p, [44, 110, 50], 0.2), [44, 110, 50], 6, 1.2), BRASS, 0.6);
    { const pts = [[44, 112, 52], [44, 118, 70], [44, 120, 88], [44, 116, 104]]; chain(p, pts, 2, 0.6, BONEC, 0.6); U(Math.max(chainD(p, pts, 4, 1.2), Math.abs(p[0] - 44) - 0.9), BONEC, 0.6); }
    hand(p, wr, s, 6, 4, 12, g);
  },
  head(p) {
    U(cap(p, [0, 164, 6], [0, 186, 10], 11, 12), SKIN, 5); U(ell(p, [0, 194, 12], [14, 16, 14]), SKIN, 5);
    hostFace(p, { c: [0, 194, 25], eyeX: 5.4, eyeR: 2.7, mouthY: -12, mouthW: 6.5 });
    for (let i = 0; i < 8; i++) strand(p, [-8 + i * 2.3, 180, 22], 12 + hashI(i, 11) * 8, 1.4, mixP(MOSS, CAP(0.3), 0.3), i, 1.6);   // weed in the beard
    // the tricorn: a low crown, the brim turned up into three lobes, one at the front
    hat(p, { c: [0, 206, 11], crown: [15, 14, 7], dome: 6, col: CAP(1), warts: 4, seed: 23 });
    { const c = [0, 206, 11], rr = len(p[0] - c[0], 0, p[2] - c[2]), a = Math.atan2(p[2] - c[2], p[0] - c[0]), lobe = Math.cos((a - Math.PI / 2) * 3), up = 6 + lobe * 7, R = 24 + lobe * 3;
      U(Math.max(Math.abs(p[1] - (c[1] + up * ((rr - 12) / 14))) - 1.8, rr - R, 13 - rr), CAP(1), 1.5); if (Math.abs(rr - R) < 2.5) P(-1, mixP(CAP(0.4), C(0xd8ccb4), 0.5), 0.5); }
    S(p[1] - 160, 1.5);
  },
});

export const CREATURES = { Rotcap, Sporeling, Creeper, Puffball, Inkcap, BlightRat, Drifter, Bracketback, Shrieker, Shelfshield, Sporecaller, GoldenTruffle, Rootworm, SporePod, GraspingMycel, B_BroodMother, B_KingPuff, B_DriftQueen, B_Lantern, B_Carapace, B_Wyrm, B_Thunderhead, B_Hound, B_Furnace, B_Hydra, B_MirrorQueen, B_Unblinking, B_Reaper, B_Toad, B_Rotwing, B_Titan, B_Leviathan, B_Devourer, B_Nameless,
  B_Foreman, B_Abomination, B_Founder, B_ShiftBoss, B_Baron, B_Deacon, B_Ferryman, B_Mourn, B_Cannonball, B_Twins, B_Grin, B_Ringmaster, B_Harbourmaster, B_Hangman, B_Graves };
