// The Blight redrawn to sit in the game's world: the rooms are built from a few bold, clean, rounded shapes in flat
// colour (the skull plaques are a rounded block with two black holes), so the creatures are too.
// Rules for every creature here:
//   - a few big primitives (spheres, round cones, rounded boxes), melted together with broad blends; no noise, no
//     fibres, no rags, nothing thinner than a finger;
//   - chunky proportions: big heads and caps, thick limbs, mitten hands with three stubby fingers;
//   - three or four flat colour areas: cap (strain colour), flesh (strain colour), root brown, and the glow;
//     markings are painted on, never carved;
//   - faces are graphic: dark sockets with a round lit eye, a dark mouth with a few big teeth, all shallow, so
//     nothing behind can show through;
//   - the same rig as before (part roles and pivots), so every animation still fits.
import { C, CAP, FLESH, GLOW, mixP, reset, U, S, P, getD, sph, ell, cap, chain, cyl, box, torus, len, clamp } from './kit.mjs';

const ROOT = C(0x6a4a32), ROOT_D = C(0x4a3222), MYC = C(0xe8dfcc), DARK = C(0x140c0a), MOUTH = C(0x2a1214), TOOTH = C(0xf0e6cc);
const SPOT = C(0xf4ecd8);
// a rounded intersection: where two cuts meet, a soft edge about k across, never a knife edge (a knife edge comes out
// stair-stepped on the sculpt grid)
const smax = (k, ...a) => a.reduce((x, y) => { const h = clamp(0.5 - 0.5 * (y - x) / k, 0, 1); return y + (x - y) * h + k * h * (1 - h); });
const sm = (a, b, t) => { t = clamp((t - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- shared pieces
// Faces are drawn big and clean, every feature at least three samples of the sculpt grid across (anything finer comes
// out ragged), and shallow, so nothing behind them can show through.
// An eye: the lit eye itself is not sculpted. A sculpt can only colour its corners, so a small bright eye in it comes
// out blurred. The eye is a separate little mesh the game sets in the socket (a lit ball, a dark rim, a slit pupil,
// each its own solid colour, so their edges stay sharp). The sculpt only carves the socket for it and raises a heavy brow
// over it that tips toward the middle (s = which side). E(at, r, s, out) records an eye for its part.
const E = (at, r, s = 1, out = [0, 0, 1]) => ({ at, r, s, out });   // s: +1 the eye on the creature's left (+x)
function socket(p, e) {
  const { at, r, s, out } = e, o = (k) => [at[0] + out[0] * r * k, at[1] + out[1] * r * k, at[2] + out[2] * r * k];
  S(sph(p, o(0.75), r * 1.15), r * 0.5, mixP(DARK, MOUTH, 0.3));
  const b0 = [at[0] + s * r * 1.35, at[1] + r * 1.35, at[2] + r * 0.1], b1 = [at[0] - s * r * 1.05, at[1] + r * 0.55, at[2] + r * 0.75];   // outer end high, inner end low over the eye: a scowl
  U(cap(p, b0, b1, r * 0.5, r * 0.62), FLESH(0.85), r * 0.5);
}
// A mouth: a wide grin, curving up at the corners, cut shallow and dark. Its teeth, like the eyes, are separate
// little meshes the game sets along the lips (sharp-edged, each one solid colour): Mouth() works them out once,
// mouthCut() carves the grin into the sculpt.
function Mouth(c, w, h, d, teeth = 5) {
  const tw = w * 1.7 / teeth, z = c[2] + d * 0.3, curve = (x) => -(x - c[0]) * (x - c[0]) / (w * w) * h * 0.8, T = [];
  for (let i = 0; i < teeth; i++) { const x = c[0] + (i - (teeth - 1) / 2) * tw, edge = Math.abs(i - (teeth - 1) / 2) / ((teeth - 1) / 2), L = h * (0.9 + 0.7 * (edge > 0.7 ? 1 : (i % 2) * 0.35)), y = c[1] + curve(x) + h * 1.05;
    T.push({ a: [x, y, z], b: [x, y - L, z + 0.6], r: tw * 0.34 }); }
  for (let i = 0; i < teeth - 1; i++) { const x = c[0] + (i - (teeth - 2) / 2) * tw, y = c[1] + curve(x) - h * 1.05; T.push({ a: [x, y, z], b: [x, y + h * 0.75, z + 0.6], r: tw * 0.28 }); }
  return { c, w, h, d, teeth: T };
}
function mouthCut(p, M) {
  const { c, w, h, d } = M, x = p[0] - c[0], q = [p[0], p[1] + (x * x) / (w * w) * h * 0.8, p[2]];
  S(ell(q, c, [w, h, d]), Math.min(w, h) * 0.3, MOUTH);
}
// a mushroom cap: a smooth dome with a clean rolled brim and a flat underside, round spots painted on top
function dome(p, c, r, h, o = {}) {
  const { spots = 6, under = 0.3, spotR = 0.2, seed = 1, tilt = 0 } = o;
  const q = [p[0] - c[0], p[1] - c[1] + tilt * (p[2] - c[2]) / r, p[2] - c[2]];
  const top = ell(q, [0, 0, 0], [r, h, r]);
  const cut = -(q[1] + h * under);   // flat underneath, a little below the widest point
  const d = smax(2.5, top, cut);
  U(d, CAP(1), 4);
  // the underside in flesh colour (only on the cap itself: a paint with no bound would cover the face below it)
  P(Math.max(q[1] + h * under - 1.2, d - 1.5), FLESH(0.85), 0.8);
  // spots: round, on top, painted
  for (let i = 0; i < spots; i++) {
    const a = i * 2.399 + seed, t = Math.sqrt((i + 0.6) / spots) * 0.78, rx = Math.cos(a) * t * r, rz = Math.sin(a) * t * r;
    const ry = h * Math.sqrt(Math.max(0, 1 - t * t));
    P(len(q[0] - rx, q[1] - ry, q[2] - rz) - r * spotR * (0.8 + ((i * 7) % 5) * 0.08), SPOT, 0.8);
  }
  return d;
}
// a thick root leg: hip to knee to ankle, a rounded foot with three stubby toes, flat underneath
function leg(p, hip, knee, ank, r0, r1, s) {
  U(cap(p, hip, knee, r0, r0 * 0.9), ROOT, r0 * 0.6);
  U(cap(p, knee, ank, r0 * 0.9, r1), ROOT, r0 * 0.6);
  U(ell(p, [ank[0], 7, ank[2] + 4], [r1 * 1.5, 8, r1 * 1.9]), ROOT_D, 5);
  for (const k of [-1, 0, 1]) U(cap(p, [ank[0] + k * r1 * 0.7 * s, 5, ank[2] + 8], [ank[0] + k * r1 * 1.1 * s, 4, ank[2] + r1 * 2.6], 4.5, 3.8), ROOT_D, 3);
  S(p[1], 1);   // flat on the floor (S carves where its field is negative: below y = 0)
}
// a thick arm: shoulder, elbow, wrist, a mitten hand with three stubby fingers
function arm(p, sh, el, wr, r, s, paint = ROOT) {
  U(cap(p, sh, el, r, r * 0.9), paint, r * 0.6);
  U(cap(p, el, wr, r * 0.9, r * 0.85), paint, r * 0.6);
  const hand = [wr[0], wr[1] - r * 0.9, wr[2] + r * 0.2];
  U(ell(p, hand, [r * 1.15, r * 1.25, r * 0.95]), ROOT_D, r * 0.5);
  for (const k of [-1, 0, 1]) U(cap(p, [hand[0] + k * r * 0.55 * s, hand[1] - r * 0.6, hand[2] + r * 0.2], [hand[0] + k * r * 0.7 * s, hand[1] - r * 1.9, hand[2] + r * 0.6], r * 0.42, r * 0.34), ROOT_D, r * 0.3);
}

// ---------------------------------------------------------------- ROTCAP (Walker)
// A stout walking toadstool: a big spotted red cap, a barrel of pale stalk for a body with a clean ring round it,
// stumpy root legs and heavy arms. The face is on the stalk under the brim: two lit eyes, a wide toothy mouth.
const RC = { hipY: 64, neck: [0, 134, 6], sh: 25 };
const RC_MOUTH = Mouth([0, 130, 22], 12.5, 4.4, 4, 5);
const RC_EYES = [-1, 1].map((s) => E([s * 9.5, 143, 23.5], 5, s, [s * 0.2, 0, 1]));
export const Rotcap = {
  height: 200,
  parts: [
    { role: 'LegBack', pivot: [-17, RC.hipY, 0], lo: [-48, -4, -34], hi: [10, 88, 40], h: 1.6, f: (p) => { reset(); leg(p, [-17, 70, 0], [-20, 36, 3], [-19, 12, 1], 11, 10, -1); return getD(); } },
    { role: 'LegFront', pivot: [17, RC.hipY, 0], lo: [-10, -4, -34], hi: [48, 88, 40], h: 1.6, f: (p) => { reset(); leg(p, [17, 70, 0], [20, 36, 3], [19, 12, 1], 11, 10, 1); return getD(); } },
    { role: 'Body', pivot: [0, RC.hipY, 0], lo: [-46, 40, -40], hi: [46, 162, 46], h: 1.5, f: rotcapBody },
    { role: 'ArmBack', pivot: [-RC.sh, 122, 4], lo: [-62, 20, -30], hi: [-8, 132, 48], h: 1.5, f: (p) => { reset(); arm(p, [-27, 120, 4], [-36, 92, 8], [-38, 66, 14], 8.5, -1); return getD(); } },
    { role: 'ArmFront', pivot: [RC.sh, 122, 4], lo: [8, 20, -30], hi: [62, 132, 48], h: 1.5, f: (p) => { reset(); arm(p, [27, 120, 4], [36, 92, 8], [38, 66, 14], 8.5, 1); return getD(); } },
    { role: 'Head', pivot: RC.neck, lo: [-72, 116, -66], hi: [72, 206, 80], h: 1.1, f: rotcapHead, tris: 9000, eyes: RC_EYES, teeth: RC_MOUTH.teeth },
  ],
};
function rotcapBody(p) {
  reset();
  // a barrel of stalk, wider at the hips, ending well under the head's neck
  U(cap(p, [0, 76, 0], [0, 116, 2], 28, 23), FLESH(1), 8);
  U(ell(p, [0, 72, 0], [27, 16, 25]), FLESH(1), 10);
  // the ring: a clean collar round the chest, sloping down and out
  { const rr = len(p[0], 0, p[2] - 1), y0 = 110 - (rr - 22) * 0.45; U(smax(2.2, Math.abs(p[1] - y0) - 3, rr - 33, 20 - rr), FLESH(0.8), 2.5); }
  // shoulders
  for (const s of [-1, 1]) U(sph(p, [s * 24, 118, 3], 10), ROOT, 7);
  // a darker band at the hips
  P(p[1] - 66, mixP(FLESH(0.7), ROOT, 0.35), 3);
  S(122 - p[1], 2);   // nothing above the neck: the head carries on from here
  return getD();
}
function rotcapHead(p) {
  reset();
  // the neck and face: the top of the stalk under the cap, solid and rounded
  U(cap(p, [0, 122, 4], [0, 152, 6], 19, 21), FLESH(1), 6);
  // the face: two big lit eyes and a wide mouth, all shallow
  for (const e of RC_EYES) socket(p, e);
  mouthCut(p, RC_MOUTH);
  // the cap: a big spotted dome, tipped a little forward
  dome(p, [0, 165, 6], 50, 30, { spots: 7, under: 0.28, spotR: 0.17, seed: 2, tilt: 0.12 });
  S(p[1] - 118, 1);   // the neck ends inside the body
  return getD();
}

// ---------------------------------------------------------------- SPORECALLER (Priest)
// The veiled one: a tall cone of pale veil to the floor with a few broad folds, a tall pointed morel cap with the
// face in its shadow, and in one hand a staff hung with a lit spore lantern.
const SC_EYES = [-1, 1].map((s) => E([s * 5, 177.5, 12.2], 2.8, s));
export const Sporecaller = {
  height: 235,
  parts: [
    { role: 'LegBack', pivot: [-12, 60, 0], lo: [-36, -4, -30], hi: [6, 108, 36], h: 1.4, f: (p) => { reset(); leg(p, [-12, 60, 0], [-13, 34, 3], [-12, 12, 1], 8, 7, -1); U(cap(p, [-12, 60, 0], [-10, 94, 0], 9, 11), MYC, 4); return getD(); } },
    { role: 'LegFront', pivot: [12, 60, 0], lo: [-6, -4, -30], hi: [36, 108, 36], h: 1.4, f: (p) => { reset(); leg(p, [12, 60, 0], [13, 34, 3], [12, 12, 1], 8, 7, 1); U(cap(p, [12, 60, 0], [10, 94, 0], 9, 11), MYC, 4); return getD(); } },
    { role: 'Body', pivot: [0, 60, 0], lo: [-52, 16, -52], hi: [52, 182, 52], h: 1.6, f: callerBody, tris: 9000 },
    { role: 'ArmBack', pivot: [-16, 160, 2], lo: [-50, 70, -24], hi: [-2, 168, 44], h: 1.3, f: (p) => { reset(); sleeve(p, -1); return getD(); } },
    { role: 'ArmFront', pivot: [16, 160, 2], lo: [2, 20, -24], hi: [56, 168, 60], h: 1.3, f: callerArm, tris: 4000 },
    { role: 'Head', pivot: [0, 168, 3], lo: [-34, 150, -34], hi: [34, 250, 38], h: 0.9, f: callerHead, tris: 9000, eyes: SC_EYES },
  ],
};
function callerBody(p) {
  reset();
  // the veil: a round cone from the shoulders to just off the floor, with broad soft folds
  const a = Math.atan2(p[2], p[0]), fold = Math.sin(a * 5) * 1.8;
  const top = 168, bot = 22, t = clamp((top - p[1]) / (top - bot), 0, 1), R = 16 + t * 30 + fold * t;
  const rr = len(p[0], 0, p[2]);
  U(smax(3, rr - R, p[1] - top, bot - p[1]), MYC, 3);
  // the shoulders round off the top of the veil
  U(ell(p, [0, 160, 2], [22, 12, 17]), MYC, 8);
  // a hem in the flesh colour, and a collar
  P(p[1] - 34, FLESH(0.8), 2);
  U(torus([p[0], p[1] - 164, p[2] - 2], [0, 0, 0], 17, 3.4), FLESH(0.75), 2);
  // a hollow under the hem so it reads as cloth, not a pillar
  S(cap(p, [0, 10, 0], [0, 60, 0], 38, 22), 4);
  S(172 - p[1], 2);
  return getD();
}
function sleeve(p, s) {
  // a wide sleeve hanging from the shoulder, a mitten hand out of its end
  U(cap(p, [s * 18, 160, 2], [s * 27, 128, 10], 8, 12), MYC, 4);
  P(sph(p, [s * 27, 126, 10], 12), FLESH(0.8), 2);
  const wr = [s * 28, 116, 14];
  U(ell(p, wr, [6.5, 7, 6]), ROOT_D, 3);
  for (const k of [-1, 0, 1]) U(cap(p, [wr[0] + k * 3.5 * s, wr[1] - 4, wr[2] + 2], [wr[0] + k * 4 * s, wr[1] - 11, wr[2] + 3], 2.6, 2.1), ROOT_D, 1.8);
}
function callerArm(p) {
  reset();
  sleeve(p, 1);
  // the staff: a straight rod of root through the fist, a hook at the top, the lantern hanging from it
  const x = 30, z = 18;
  U(cap(p, [x, 30, z], [x, 166, z], 2.6, 2.4), ROOT, 1);
  U(torus([p[0] - x - 8, p[1] - 166, p[2] - z], [0, 0, 0], 8, 2.4), ROOT, 1);   // the hook, a ring lying flat
  const L = [x + 15, 146, z];
  U(cap(p, [x + 15, 166, z], [x + 15, 156, z], 1.2), ROOT_D, 0.5);
  U(ell(p, L, [7, 9, 7]), C(0x5a4630), 2);
  U(ell(p, [L[0], L[1] + 8, L[2]], [6, 3, 6]), CAP(1), 1.5);
  P(ell(p, L, [7.6, 6.5, 7.6]), GLOW(1), 1);   // a lit band round the lantern
  return getD();
}
function callerHead(p) {
  reset();
  // the neck, and the face in the shadow of the cap
  U(cap(p, [0, 160, 3], [0, 186, 4], 10, 12), FLESH(0.9), 4);
  P(p[1] - 190, mixP(FLESH(0.5), DARK, 0.5), 6);   // shadowed under the brim
  for (const e of SC_EYES) socket(p, e);
  // the cap: a tall round cone with a rolled brim, broad ribs painted darker between
  const q = [p[0], p[1] - 184, p[2] - 3];
  const k = clamp(q[1] / 60, 0, 1), r = 24 * (1 - k * 0.8) + 2.5;
  U(smax(2, len(q[0], 0, q[2]) - r, -q[1] - 2, q[1] - 60), CAP(1), 3);
  U(torus(q, [0, 0, 0], 22, 4), CAP(0.9), 3);   // the rolled brim
  U(sph(p, [0, 246, 3], 4), CAP(0.8), 3);
  const a = Math.atan2(q[2], q[0]); if (q[1] > 3) P(Math.abs(Math.sin(a * 4)) - 0.3, mixP(CAP(0.6), DARK, 0.25), 0.12);
  S(p[1] - 152, 1);
  return getD();
}

// ================================================================= the rest of the Blight
// A face in one call: two scowling eyes (eye meshes) and a snarling mouth (tooth meshes) for a head part. c is the
// middle of the face, w its half-width; returns { eyes, teeth, cut(p) } to hang on the part and carve in its field.
function Face(c, w, o = {}) {
  const { er = w * 0.32, ey = w * 0.35, mw = w * 0.85, mh = w * 0.3, my = -w * 0.55, teeth = 5, out = 0.18, md = w * 0.28, eyez = 0, mz = 0 } = o;
  const eyes = [-1, 1].map((s) => E([c[0] + s * w * 0.48, c[1] + ey, c[2] + eyez], er, s, [s * out, 0, 1]));
  const M = Mouth([c[0], c[1] + my, c[2] + mz], mw, mh, md, teeth);
  return { eyes, teeth: M.teeth, cut: (p) => { for (const e of eyes) socket(p, e); mouthCut(p, M); } };
}
// a beast's leg, hip to knee to hock to paw, thick, a rounded paw with three toes forward
function beastLeg(p, hip, knee, ank, r, paint = ROOT) {
  U(cap(p, hip, knee, r * 1.2, r), paint, r * 0.7);
  U(cap(p, knee, ank, r, r * 0.8), paint, r * 0.6);
  U(ell(p, [ank[0], r * 0.6, ank[2] + r * 0.5], [r * 1.2, r * 0.7, r * 1.6]), ROOT_D, r * 0.5);
  for (const k of [-1, 0, 1]) U(cap(p, [ank[0] + k * r * 0.6, r * 0.5, ank[2] + r], [ank[0] + k * r * 0.8, r * 0.35, ank[2] + r * 2.1], r * 0.4, r * 0.3), ROOT_D, r * 0.3);
  S(p[1], 1);
}
// a stack of bracket shelves (half-discs standing out of a surface): at, facing dir (x,z), n tiers
function shelves(p, at, dir, R, n, paint = CAP(1)) {
  for (let i = 0; i < n; i++) {
    const r = R * (1 - i * 0.18), c = [at[0] + dir[0] * r * 0.25, at[1] + i * R * 0.42, at[2] + dir[1] * r * 0.25];
    const q = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
    U(smax(1.5, ell(q, [0, 0, 0], [r, r * 0.2, r]), -(q[0] * dir[0] + q[2] * dir[1]) - r * 0.1), i % 2 ? mixP(paint, C(0xf0e2c0), 0.35) : paint, 2.5);
  }
}

// ---------------------------------------------------------------- SPORELING (Runner)
// Runs bent double: a hunched pale body, a big round puffball head split by a huge toothy grin, long thick arms that drag
// at the knuckles, stilt-straight legs.
const SL_FACE = Face([0, 172, 46], 14, { er: 4.6, ey: 6, my: -7, mw: 13, mh: 4.6, teeth: 6, out: 0.15 });
export const Sporeling = {
  height: 185,
  parts: [
    { role: 'LegBack', pivot: [-13, 88, -4], lo: [-40, -4, -40], hi: [6, 100, 40], h: 1.4, f: (p) => { reset(); leg(p, [-13, 92, -4], [-15, 52, 8], [-13, 12, -2], 9, 8, -1); return getD(); } },
    { role: 'LegFront', pivot: [13, 88, -4], lo: [-6, -4, -40], hi: [40, 100, 40], h: 1.4, f: (p) => { reset(); leg(p, [13, 92, -4], [15, 52, 8], [13, 12, -2], 9, 8, 1); return getD(); } },
    { role: 'Body', pivot: [0, 88, -4], lo: [-40, 66, -42], hi: [40, 166, 44], h: 1.4, f: (p) => { reset();
      U(ell(p, [0, 92, -4], [18, 13, 16]), FLESH(1), 6);
      U(cap(p, [0, 98, -6], [0, 128, -2], 19, 21), FLESH(1), 9);
      U(cap(p, [0, 128, -2], [0, 148, 14], 21, 15), FLESH(1), 9);       // the hunch
      for (const s of [-1, 1]) U(sph(p, [s * 15, 140, 10], 10), ROOT, 6);
      P(p[1] - 100, mixP(FLESH(0.7), ROOT, 0.35), 3);
      return getD(); } },
    { role: 'ArmBack', pivot: [-14, 141, 10], lo: [-52, 14, -16], hi: [-2, 150, 60], h: 1.3, f: (p) => { reset(); arm(p, [-16, 140, 10], [-26, 104, 22], [-28, 66, 34], 7, -1); return getD(); } },
    { role: 'ArmFront', pivot: [14, 141, 10], lo: [2, 14, -16], hi: [52, 150, 60], h: 1.3, f: (p) => { reset(); arm(p, [16, 140, 10], [26, 104, 22], [28, 66, 34], 7, 1); return getD(); } },
    { role: 'Head', pivot: [0, 150, 18], lo: [-36, 134, -10], hi: [36, 206, 66], h: 1.0, f: (p) => { reset();
      U(cap(p, [0, 146, 14], [0, 160, 24], 10, 12), FLESH(1), 4);
      U(ell(p, [0, 174, 28], [25, 24, 23]), CAP(1), 5);
      for (let i = 0; i < 5; i++) { const a = i * 2.4 + 1, t = 0.35 + (i % 3) * 0.2; P(sph(p, [Math.cos(a) * 22 * t, 190 + (i % 2) * 4, 28 + Math.sin(a) * 22 * t - 4], 3.4 + (i % 2)), SPOT, 0.6); }
      SL_FACE.cut(p); S(p[1] - 142, 1); return getD(); }, tris: 8000, eyes: SL_FACE.eyes, teeth: SL_FACE.teeth },
  ],
};

// ---------------------------------------------------------------- CREEPER (Crawler)
// A low dome of a body studded with little caps on six thick jointed root legs, and at the front a scowling face with a
// cluster of four eyes and a pair of hooked fangs.
const CR_LEGS2 = [[1, 22], [1, 0], [1, -20], [-1, 22], [-1, 0], [-1, -20]];
const CR_EYES = [[-7, 54, 56, 3.6, -1], [7, 54, 56, 3.6, 1], [-12, 47, 53, 2.6, -1], [12, 47, 53, 2.6, 1]].map(([x, y, z, r, s]) => E([x, y, z], r, s, [s * 0.25, 0.1, 1]));
const CR_FANGS = [-1, 1].map((s) => ({ a: [s * 6, 36, 56], b: [s * 4, 24, 60], r: 2.6 }));
export const Creeper = {
  height: 90,
  parts: [
    ...CR_LEGS2.map(([s, z], i) => ({ role: i === 0 || i === 2 || i === 4 ? 'LegFront' : 'LegBack', pivot: [s * 24, 50, z], lo: s > 0 ? [10, -4, z - 40] : [-110, -4, z - 40], hi: s > 0 ? [110, 96, z + 40] : [-10, 96, z + 40], h: 1.3,
      f: (p) => { reset(); const hip = [s * 24, 50, z], knee = [s * 62, 80, z + (z > 5 ? 10 : z < -5 ? -10 : 0)], foot = [s * 92, 4, z + (z > 5 ? 20 : z < -5 ? -20 : 0)];
        U(cap(p, hip, knee, 6.5, 5.5), ROOT, 4); U(cap(p, knee, foot, 5.5, 3.5), ROOT_D, 4); U(sph(p, knee, 7), ROOT, 4); S(p[1] - 0.5, 1); return getD(); } })),
    { role: 'Body', pivot: [0, 50, 0], lo: [-48, 12, -54], hi: [48, 100, 50], h: 1.3, f: (p) => { reset();
      U(ell(p, [0, 50, -4], [36, 26, 40]), CAP(1), 10);
      U(ell(p, [0, 38, 0], [32, 14, 36]), FLESH(1), 10);
      P(p[1] - 40, FLESH(0.9), 3);
      for (let i = 0; i < 7; i++) { const a = i * 2.4, r = 8 + (i % 3) * 9, x = Math.cos(a) * r, z = Math.sin(a) * r - 6, y = 50 + 26 * Math.sqrt(Math.max(0, 1 - (x * x) / 1296 - ((z + 4) * (z + 4)) / 1600));
        U(cap(p, [x, y - 4, z], [x, y + 6, z], 2.6), MYC, 2); U(ell(p, [x, y + 7, z], [6, 3.4, 6]), CAP(0.85), 1.5); P(sph(p, [x, y + 9, z], 2), SPOT, 0.4); }
      return getD(); } },
    { role: 'Head', pivot: [0, 48, 30], lo: [-28, 18, 16], hi: [28, 72, 72], h: 0.9, tris: 5000, eyes: CR_EYES, teeth: CR_FANGS, f: (p) => { reset();
      U(ell(p, [0, 46, 44], [20, 15, 15]), CAP(0.9), 6);
      U(ell(p, [0, 38, 48], [15, 9, 11]), FLESH(0.9), 5);
      for (const e of CR_EYES) socket(p, e);
      S(ell(p, [0, 33, 56], [8, 4, 4]), 2, MOUTH);
      S(p[2] - 26, 1); return getD(); } },
  ],
};

// ---------------------------------------------------------------- PUFFBALL (Bloater)
// A cart-sized ball of a puffball on two stumps: smooth skin with a few big lit cracks, a huge mouth across the front
// packed with teeth, two mean little eyes over it, stub arms, and a crown of points round the pore on top.
const PB_FACE = Face([0, 128, 76], 44, { er: 8, ey: 20, my: -10, mw: 34, mh: 11, md: 14, teeth: 7, out: 0.3 });
export const Puffball = {
  height: 215,
  parts: [
    { role: 'LegBack', pivot: [-30, 52, 0], lo: [-66, -4, -40], hi: [0, 90, 44], h: 1.8, f: (p) => { reset(); leg(p, [-30, 64, 0], [-32, 34, 4], [-32, 12, 2], 17, 15, -1); return getD(); } },
    { role: 'LegFront', pivot: [30, 52, 0], lo: [0, -4, -40], hi: [66, 90, 44], h: 1.8, f: (p) => { reset(); leg(p, [30, 64, 0], [32, 34, 4], [32, 12, 2], 17, 15, 1); return getD(); } },
    { role: 'Body', pivot: [0, 56, 0], lo: [-86, 34, -86], hi: [86, 198, 92], h: 1.6, tris: 12000, eyes: PB_FACE.eyes, teeth: PB_FACE.teeth, f: (p) => { reset();
      U(ell(p, [0, 118, 0], [78, 74, 76]), CAP(1), 8);
      P(p[1] - 92, FLESH(0.9), 6);                                               // pale underside
      // a few big glowing cracks on the sides and back
      for (const [a, y] of [[2.2, 140], [3.6, 120], [4.6, 150]]) { const x = Math.cos(a) * 76, z = Math.sin(a) * 76; P(Math.max(cap(p, [x, y + 18, z], [x * 0.95, y - 18, z * 0.95], 3), -100), GLOW(1), 1); }
      PB_FACE.cut(p); return getD(); } },
    { role: 'ArmBack', pivot: [-66, 120, 18], lo: [-108, 36, -10], hi: [-44, 134, 66], h: 1.4, f: (p) => { reset(); arm(p, [-66, 118, 18], [-82, 100, 26], [-86, 82, 34], 10, -1); return getD(); } },
    { role: 'ArmFront', pivot: [66, 120, 18], lo: [44, 36, -10], hi: [108, 134, 66], h: 1.4, f: (p) => { reset(); arm(p, [66, 118, 18], [82, 100, 26], [86, 82, 34], 10, 1); return getD(); } },
    { role: 'Head', pivot: [0, 176, 0], lo: [-46, 164, -46], hi: [46, 226, 46], h: 1.2, f: (p) => { reset();
      U(cyl(p, [0, 186, 0], 24, 10, 4), CAP(0.85), 4);
      for (let i = 0; i < 7; i++) { const a = i * 0.8976; U(cap(p, [Math.cos(a) * 22, 190, Math.sin(a) * 22], [Math.cos(a) * 25, 212, Math.sin(a) * 25], 6, 1.5), CAP(0.75), 3); }
      S(cap(p, [0, 200, 0], [0, 180, 0], 12), 3, GLOW(1));
      S(p[1] - 172, 1); return getD(); } },
  ],
};

// ---------------------------------------------------------------- INKCAP (Spitter)
// A tall shaggy bell of a head over a slim stalk, the bell's lower half gone black and dripping in a few fat drops; under
// the rim a scowl and a round pursed mouth ringed with little teeth that it spits through.
export const Inkcap = {
  height: 214,
  parts: [
    { role: 'LegBack', pivot: [-13, 70, 0], lo: [-40, -4, -36], hi: [6, 90, 40], h: 1.4, f: (p) => { reset(); leg(p, [-13, 74, 0], [-15, 40, 4], [-13, 12, 1], 9, 8, -1); return getD(); } },
    { role: 'LegFront', pivot: [13, 70, 0], lo: [-6, -4, -36], hi: [40, 90, 40], h: 1.4, f: (p) => { reset(); leg(p, [13, 74, 0], [15, 40, 4], [13, 12, 1], 9, 8, 1); return getD(); } },
    { role: 'Body', pivot: [0, 70, 0], lo: [-34, 52, -34], hi: [34, 156, 36], h: 1.3, f: (p) => { reset();
      U(ell(p, [0, 76, 0], [18, 12, 16]), FLESH(1), 6); U(cap(p, [0, 80, 0], [0, 128, 2], 16, 13), FLESH(1), 8);
      for (const s of [-1, 1]) U(sph(p, [s * 14, 120, 3], 8), ROOT, 5);
      S(124 - p[1], 2); return getD(); } },
    { role: 'ArmBack', pivot: [-15, 120, 3], lo: [-46, 30, -20], hi: [-2, 130, 44], h: 1.2, f: (p) => { reset(); arm(p, [-16, 119, 3], [-24, 94, 8], [-26, 70, 14], 6, -1); return getD(); } },
    { role: 'ArmFront', pivot: [15, 120, 3], lo: [2, 30, -20], hi: [46, 130, 44], h: 1.2, f: (p) => { reset(); arm(p, [16, 119, 3], [24, 94, 8], [26, 70, 14], 6, 1); return getD(); } },
    { role: 'Head', pivot: [0, 128, 3], lo: [-38, 104, -38], hi: [38, 224, 40], h: 1.1, tris: 9000, eyes: IC_EYES(), teeth: IC_TEETH(), f: inkHead },
  ],
};
function IC_EYES() { return [-1, 1].map((s) => E([s * 6.5, 141, 14.5], 3.4, s, [s * 0.2, 0, 1])); }
function IC_TEETH() { const T = []; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, c = [Math.cos(a) * 4.4, 132 + Math.sin(a) * 4.4, 16]; T.push({ a: c, b: [c[0] * 0.35, 132 + (c[1] - 132) * 0.35, 17.5], r: 1.5 }); } return T; }
function inkHead(p) {
  reset();
  U(cap(p, [0, 124, 3], [0, 150, 4], 13, 14), FLESH(1), 5);
  for (const e of IC_EYES()) socket(p, e);
  U(torus(rotXp(p, [0, 132, 14]), [0, 0, 0], 5.2, 2.4), FLESH(0.8), 1.5); S(sph(p, [0, 132, 16], 4), 1, MOUTH);   // the pursed mouth
  // the bell: tall, round-topped, flaring a little at the rim
  const q = [p[0], p[1], p[2] - 3], t = clamp((q[1] - 150) / 64, 0, 1), R = 27 - t * t * 15;
  U(smax(3, len(q[0], 0, q[2]) - R, q[1] - 214, 148 - q[1]), CAP(1), 4);
  S(cap(p, [0, 140, 3], [0, 160, 3], 20, 18), 3);                                // hollow under the bell
  // the ink: the lower half black, with four fat drops hanging off the rim
  P(Math.max(q[1] - 170, 146 - q[1]), C(0x16121a), 4);                        // ink on the bell's lower half only
  for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.6, x = Math.cos(a) * 26, z = Math.sin(a) * 26 + 3; U(cap(p, [x, 152, z], [x * 1.02, 140 - (i % 2) * 5, z * 1.02], 3.4, 2.6), C(0x16121a), 2); }
  for (let i = 0; i < 6; i++) { const a = i * 1.047; P(cap(p, [Math.cos(a) * 18, 214, Math.sin(a) * 18 + 3], [Math.cos(a) * 26, 176, Math.sin(a) * 26 + 3], 2.2), mixP(CAP(0.7), C(0xf0e6d0), 0.4), 0.8); }   // a few pale scales
  S(p[1] - 116, 1);
  return getD();
}
// rotate p about the x axis through c by 90 degrees (so a torus made flat in xz stands up facing +z)
function rotXp(p, c) { return [p[0] - c[0], p[2] - c[2], -(p[1] - c[1])]; }

// ---------------------------------------------------------------- BLIGHT RAT (Leaper)
// A big hunched sewer rat: a heavy body of dull fur, a long wedge of a head with a snarl full of teeth and two mean lit
// eyes, round ears, three fat pale stalks out of its back with lit caps, a thick bare tail.
const FUR_A = C(0x5e5246), FUR_B = C(0x463c32), PINKY = C(0xb88a7c);
const RT_EYES = [-1, 1].map((s) => E([s * 9, 58, 60], 3.4, s, [s * 0.55, 0.2, 0.8]));
const RT_TEETH = [[-3, 0], [3, 0], [-7, 1], [7, 1]].map(([x, b]) => ({ a: [x, 44, 80 - Math.abs(x) * 0.8], b: [x * 0.95, 38 - b, 81 - Math.abs(x) * 0.8], r: b ? 1.4 : 2 }));
export const BlightRat = {
  height: 100, beast: true,
  parts: [
    { role: 'LegBack', pivot: [-13, 36, -26], lo: [-36, -4, -58], hi: [4, 58, 0], h: 1.1, f: (p) => { reset(); beastLeg(p, [-15, 40, -26], [-20, 24, -34], [-18, 8, -24], 6.5, FUR_A); return getD(); } },
    { role: 'LegFront', pivot: [13, 36, -26], lo: [-4, -4, -58], hi: [36, 58, 0], h: 1.1, f: (p) => { reset(); beastLeg(p, [15, 40, -26], [20, 24, -34], [18, 8, -24], 6.5, FUR_A); return getD(); } },
    { role: 'Body', pivot: [0, 38, 0], lo: [-36, 6, -64], hi: [36, 124, 44], h: 1.2, f: (p) => { reset();
      U(ell(p, [0, 44, -6], [23, 22, 36]), FUR_A, 10); U(ell(p, [0, 56, -10], [19, 16, 26]), FUR_B, 10);
      U(ell(p, [0, 44, 22], [17, 17, 16]), FUR_A, 9);
      P(p[1] - 34, mixP(FUR_A, MYC, 0.35), 4);                                     // pale belly
      for (const [x, z, h] of [[-6, -6, 46], [5, -14, 56], [-2, -24, 40]]) { const top = [x * 1.6, 60 + h, z - 4];
        U(cap(p, [x, 62, z], top, 4.2, 3.2), MYC, 3); U(ell(p, top, [7.5, 4, 7.5]), CAP(1), 2); P(sph(p, [top[0], top[1] + 3, top[2]], 3.4), GLOW(1), 0.6); }
      return getD(); } },
    { role: 'Tail', pivot: [0, 34, -42], lo: [-24, -4, -140], hi: [24, 48, -30], h: 1.1, tris: 1500, f: (p) => { reset(); chain(p, [[0, 40, -28], [0, 36, -44], [3, 28, -70], [-4, 18, -98], [4, 10, -126]], 7, 2.4, PINKY, 3); return getD(); } },   // rooted well inside the body, so it stays on as it swings
    { role: 'ArmBack', pivot: [-11, 34, 26], lo: [-30, -4, 6], hi: [4, 48, 50], h: 1.1, f: (p) => { reset(); beastLeg(p, [-12, 36, 26], [-14, 20, 30], [-13, 8, 28], 5.5, FUR_A); return getD(); } },
    { role: 'ArmFront', pivot: [11, 34, 26], lo: [-4, -4, 6], hi: [30, 48, 50], h: 1.1, f: (p) => { reset(); beastLeg(p, [12, 36, 26], [14, 20, 30], [13, 8, 28], 5.5, FUR_A); return getD(); } },
    { role: 'Head', pivot: [0, 46, 32], lo: [-32, 20, 16], hi: [32, 80, 96], h: 0.9, tris: 7000, eyes: RT_EYES, teeth: RT_TEETH, f: (p) => { reset();
      U(ell(p, [0, 52, 46], [15, 14, 16]), FUR_A, 6);
      U(cap(p, [0, 52, 50], [0, 45, 80], 12, 6.5), FUR_A, 6);                   // the snout
      U(sph(p, [0, 46, 85], 4), PINKY, 2);                                         // the nose
      for (const s of [-1, 1]) { U(smax(1, ell(p, [s * 12, 68, 40], [8, 9, 3]), -100), PINKY, 3); P(ell(p, [s * 12, 68, 41], [5.5, 6.5, 3]), mixP(PINKY, MOUTH, 0.4), 1); }   // ears
      for (const e of RT_EYES) socket(p, e);
      S(smax(1, ell(p, [0, 41, 72], [9, 4, 12]), -(p[2] - 64)), 1.5, MOUTH);         // the snarl
      S(p[2] - 30, 1); return getD(); } },
  ],
};

// ---------------------------------------------------------------- DRIFTER (Flyer)
// A floating spore balloon: a smooth dome with a band of lit pores round it, a skirt of thick gill lobes under it, and
// hanging below, a fat round lamprey mouth ringed with teeth; three heavy tendrils trail from it.
const DR_TEETH = (() => { const T = []; for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, c = [Math.cos(a) * 9, 26, Math.sin(a) * 9 + 4]; T.push({ a: c, b: [c[0] * 0.4, 31, (c[2] - 4) * 0.4 + 4], r: 2 }); } return T; })();
const DR_EYES = [-1, 1].map((s) => E([s * 9, 82, 38], 4.2, s, [s * 0.3, -0.25, 1]));
export const Drifter = {
  height: 110,
  parts: [
    { role: 'Tail', pivot: [0, 40, 0], lo: [-28, -8, -28], hi: [28, 46, 28], h: 1.1, tris: 3000, f: (p) => { reset();
      for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.5, x = Math.cos(a) * 9, z = Math.sin(a) * 9; chain(p, [[x, 42, z], [x * 1.6, 24, z * 1.6], [x * 1.2, 6, z * 1.2], [x * 1.7, -4, z * 1.7]], 3.4, 1.6, FLESH(0.85), 2); }
      return getD(); } },
    { role: 'Body', pivot: [0, 62, 0], lo: [-46, 34, -46], hi: [46, 114, 46], h: 1.2, eyes: DR_EYES, f: (p) => { reset();
      U(smax(2, ell(p, [0, 76, 0], [38, 32, 38]), 62 - p[1]), CAP(1), 6);
      for (let i = 0; i < 8; i++) { const a = i * 0.785 + 0.39; U(ell(p, [Math.cos(a) * 30, 58, Math.sin(a) * 30], [11, 9, 11]), FLESH(0.85), 6); }   // the gill lobes
      for (let i = 0; i < 6; i++) { const a = i * 1.047 + 2.2; if (Math.abs(Math.sin(a) - 1) < 0.5) continue; P(sph(p, [Math.cos(a) * 37, 78, Math.sin(a) * 37], 3.6), GLOW(1), 0.6); }
      P(sph(p, [0, 106, 0], 12), SPOT, 2);
      for (const e of DR_EYES) socket(p, e);
      return getD(); } },
    { role: 'Head', pivot: [0, 50, 0], lo: [-26, 18, -26], hi: [26, 62, 32], h: 0.9, tris: 4000, teeth: DR_TEETH, f: (p) => { reset();
      U(cap(p, [0, 56, 2], [0, 30, 4], 10, 14), FLESH(1), 4);
      U(torus(p, [0, 26, 4], 11, 5), FLESH(0.8), 3);
      S(cap(p, [0, 22, 4], [0, 36, 4], 8.5), 2, MOUTH);
      return getD(); } },
  ],
};

// ---------------------------------------------------------------- BRACKETBACK (Brute)
// A rotten stump stood up: a huge hunched barrel of bark, thick stacked shelves of fungus over its back and shoulders,
// log arms ending in heavy knotted fists, short stump legs, and a small sunk head: two lit eyes under a heavy brow and a
// jagged slot of a mouth.
const BARK_A = C(0x5a4030), BARK_B = C(0x3e2c20), MOSS = C(0x4e6a34);
const BB_FACE = Face([0, 184, 62], 14, { er: 4.4, ey: 4, my: -8, mw: 11, mh: 3.6, md: 6, teeth: 5, out: 0.15 });
export const Bracketback = {
  height: 240, scale: 1.5,
  parts: [
    { role: 'LegBack', pivot: [-26, 92, -8], lo: [-68, -4, -50], hi: [4, 112, 46], h: 1.8, f: (p) => { reset(); leg(p, [-28, 96, -8], [-32, 52, -4], [-32, 16, -2], 19, 18, -1); return getD(); } },
    { role: 'LegFront', pivot: [26, 92, -8], lo: [-4, -4, -50], hi: [68, 112, 46], h: 1.8, f: (p) => { reset(); leg(p, [28, 96, -8], [32, 52, -4], [32, 16, -2], 19, 18, 1); return getD(); } },
    { role: 'Body', pivot: [0, 92, 0], lo: [-92, 66, -86], hi: [92, 240, 74], h: 1.9, tris: 12000, f: (p) => { reset();
      U(cap(p, [0, 100, -4], [0, 160, 4], 46, 52), BARK_A, 14);
      U(ell(p, [0, 182, 12], [60, 40, 46]), BARK_A, 18);                           // the hunched shoulders
      P(Math.abs(Math.sin(Math.atan2(p[2], p[0]) * 7)) - 0.15, BARK_B, 0.12);       // grooves of bark, painted
      P(210 - p[1], MOSS, 6);                                                     // moss on the top of the hump
      shelves(p, [-34, 186, -30], [-0.5, -0.9], 30, 3); shelves(p, [30, 160, -40], [0.4, -0.9], 26, 3); shelves(p, [0, 140, -46], [0, -1], 30, 2);
      shelves(p, [-52, 206, 10], [-1, 0], 22, 2); shelves(p, [52, 206, 10], [1, 0], 22, 2);
      return getD(); } },
    { role: 'ArmBack', pivot: [-58, 176, 8], lo: [-116, 0, -36], hi: [-28, 224, 82], h: 1.6, f: (p) => { reset(); logArm(p, -1); return getD(); } },
    { role: 'ArmFront', pivot: [58, 176, 8], lo: [28, 0, -36], hi: [116, 224, 82], h: 1.6, f: (p) => { reset(); logArm(p, 1); return getD(); } },
    { role: 'Head', pivot: [0, 176, 30], lo: [-42, 144, 6], hi: [42, 216, 80], h: 1.0, tris: 7000, eyes: BB_FACE.eyes, teeth: BB_FACE.teeth, f: (p) => { reset();
      U(ell(p, [0, 184, 48], [20, 18, 18]), BARK_A, 6);
      U(cap(p, [-18, 196, 58], [18, 196, 58], 6), BARK_B, 5);                     // the brow shelf
      BB_FACE.cut(p); S(p[2] - 30, 2); return getD(); } },
  ],
};
function logArm(p, s) {
  const sh = [s * 62, 186, 8], el = [s * 80, 120, 20], wr = [s * 84, 54, 34];
  U(cap(p, sh, el, 19, 16), BARK_A, 10); U(cap(p, el, wr, 16, 15), BARK_A, 8); U(sph(p, el, 17), BARK_B, 6);
  U(ell(p, [wr[0], wr[1] - 16, wr[2] + 4], [20, 20, 18]), BARK_B, 8);               // the fist
  for (const k of [-1, 0, 1]) U(sph(p, [wr[0] + k * 9, wr[1] - 30, wr[2] + 12], 7), BARK_B, 4);
  shelves(p, [s * 70, 170, -4], [s * 0.6, -0.8], 16, 2);
}

// ---------------------------------------------------------------- SHRIEKER (Screamer)
// A tall funnel-cap opening upward like a horn, its throat lit and ribbed, on a thick stalk; the face is on the stalk just
// under the funnel: two glaring eyes and a stretched-open screaming mouth.
const SH_FACE = Face([0, 140, 16], 11, { er: 3.6, ey: 4, my: -7, mw: 7, mh: 5, md: 5, teeth: 4, out: 0.2 });
export const Shrieker = {
  height: 220,
  parts: [
    { role: 'LegBack', pivot: [-16, 48, 0], lo: [-56, -4, -44], hi: [4, 62, 44], h: 1.4, f: (p) => { reset(); leg(p, [-16, 54, 0], [-20, 32, 4], [-20, 12, 1], 10, 9, -1); return getD(); } },
    { role: 'LegFront', pivot: [16, 48, 0], lo: [-4, -4, -44], hi: [56, 62, 44], h: 1.4, f: (p) => { reset(); leg(p, [16, 54, 0], [20, 32, 4], [20, 12, 1], 10, 9, 1); return getD(); } },
    { role: 'Body', pivot: [0, 50, 0], lo: [-36, 34, -36], hi: [36, 166, 40], h: 1.3, f: (p) => { reset();
      U(ell(p, [0, 58, 0], [20, 12, 18]), FLESH(1), 6); U(cap(p, [0, 60, 0], [0, 140, 2], 16, 12), FLESH(1), 8);
      U(torus(p, [0, 112, 1], 15, 3), FLESH(0.8), 2);
      for (const s of [-1, 1]) U(sph(p, [s * 13, 128, 2], 7), ROOT, 5);
      S(136 - p[1], 2); return getD(); } },
    { role: 'ArmBack', pivot: [-15, 130, 2], lo: [-60, 40, -30], hi: [-4, 140, 50], h: 1.2, f: (p) => { reset(); arm(p, [-15, 129, 2], [-26, 100, 8], [-30, 72, 14], 6, -1); return getD(); } },
    { role: 'ArmFront', pivot: [15, 130, 2], lo: [4, 40, -30], hi: [60, 140, 50], h: 1.2, f: (p) => { reset(); arm(p, [15, 129, 2], [26, 100, 8], [30, 72, 14], 6, 1); return getD(); } },
    { role: 'Head', pivot: [0, 150, 4], lo: [-60, 126, -40], hi: [60, 244, 76], h: 1.2, tris: 9000, eyes: SH_FACE.eyes, teeth: SH_FACE.teeth, f: (p) => { reset();
      U(cap(p, [0, 130, 3], [0, 160, 4], 13, 12), FLESH(1), 4);
      SH_FACE.cut(p);
      // the funnel: a thick-walled horn opening up and forward
      const q = rotXp2(p, [0, 160, 4], -0.3), t = clamp(q[1] / 76, 0, 1), R = 10 + t * t * 40, rr = len(q[0], 0, q[2]);
      U(smax(2, Math.abs(rr - R) - 3.4, -q[1], q[1] - 76), CAP(1), 4);
      U(torus([q[0], q[1] - 76, q[2]], [0, 0, 0], 50, 4.4), CAP(0.8), 3);           // the rolled rim
      P(Math.max(rr - (R - 1.5), 20 - q[1]), GLOW(1), 2);                           // the lit throat (inside the wall only)
      for (let i = 0; i < 8; i++) { const a = i * 0.785; P(Math.max(Math.abs((q[0] * Math.sin(a) - q[2] * Math.cos(a))) - 1.6, -(q[0] * Math.cos(a) + q[2] * Math.sin(a)), rr - R + 1), mixP(CAP(0.7), DARK, 0.3), 0.6); }
      S(p[1] - 122, 1); return getD(); } },
  ],
};
// tip p about the x axis through c by angle a (positive tips +y toward +z)
function rotXp2(p, c, a) { const y = p[1] - c[1], z = p[2] - c[2], co = Math.cos(a), si = Math.sin(a); return [p[0] - c[0], y * co - z * si, y * si + z * co]; }

// ---------------------------------------------------------------- SHELFSHIELD (Shield)
// A Rotcap gone hard: a heavier stalk, a cap of thick stacked shelves, and its front arm fused into a great round shield
// of bracket, banded and thick as a door. The face under the shelves is shallow and clear of everything behind it.
const SS_EYES = [-1, 1].map((s) => E([s * 9.5, 143, 23.5], 5, s, [s * 0.2, 0, 1]));
const SS_MOUTH = Mouth([0, 130, 22], 12.5, 4.4, 4, 5);
export const Shelfshield = {
  height: 215,
  parts: [
    { role: 'LegBack', pivot: [-17, 64, 0], lo: [-48, -4, -34], hi: [10, 88, 40], h: 1.6, f: (p) => { reset(); leg(p, [-17, 70, 0], [-20, 36, 3], [-19, 12, 1], 12, 11, -1); return getD(); } },
    { role: 'LegFront', pivot: [17, 64, 0], lo: [-10, -4, -34], hi: [48, 88, 40], h: 1.6, f: (p) => { reset(); leg(p, [17, 70, 0], [20, 36, 3], [19, 12, 1], 12, 11, 1); return getD(); } },
    { role: 'Body', pivot: [0, 64, 0], lo: [-46, 40, -40], hi: [46, 162, 46], h: 1.5, f: rotcapBody },
    { role: 'ArmBack', pivot: [-25, 122, 4], lo: [-62, 20, -30], hi: [-8, 132, 48], h: 1.5, f: (p) => { reset(); arm(p, [-27, 120, 4], [-36, 92, 8], [-38, 66, 14], 9, -1); return getD(); } },
    { role: 'ArmFront', pivot: [25, 122, 4], lo: [-40, 20, -10], hi: [70, 156, 74], h: 1.4, tris: 7000, f: (p) => { reset();
      arm(p, [27, 120, 4], [34, 98, 18], [24, 92, 36], 9, 1);
      // the shield: a thick round bracket in front of the body, ringed in the cap's colours, a boss of flesh in its middle
      const c = [10, 96, 50], q = [p[0] - c[0], p[1] - c[1], p[2] - c[2]], rr = len(q[0], q[1], 0);
      U(smax(2, ell(q, [0, 0, 0], [44, 44, 7]), -q[2] - 6), CAP(1), 4);
      P(Math.abs(Math.sin(rr * 0.2)) - 0.45, mixP(CAP(0.75), C(0xf0e2c0), 0.3), 0.15);
      U(ell(q, [0, 0, 6], [10, 10, 6]), FLESH(0.85), 3);
      return getD(); } },
    { role: 'Head', pivot: [0, 134, 6], lo: [-62, 116, -52], hi: [62, 222, 62], h: 1.1, tris: 9000, eyes: SS_EYES, teeth: SS_MOUTH.teeth, f: (p) => { reset();
      U(cap(p, [0, 122, 4], [0, 152, 6], 19, 21), FLESH(1), 6);
      for (const e of SS_EYES) socket(p, e); mouthCut(p, SS_MOUTH);
      for (let i = 0; i < 3; i++) dome(p, [0, 160 + i * 14, 4 - i * 4], 52 - i * 12, 12, { spots: 0, under: 0.5 });   // a cap of stacked shelves
      S(p[1] - 118, 1); return getD(); } },
  ],
};

// ---------------------------------------------------------------- GOLDEN TRUFFLE (Gilded)
// A plump knobbly truffle gone gold, a wide greedy grin of teeth and two narrow eyes, short fast legs, stubby arms, and a
// little sprig of caps on top. Gold whatever the strain (only its eyes take the strain's light).
const G1 = C(0xeab838), G2 = C(0xc08a26), G3 = C(0x8a5e1a), GL = C(0xffe08a);
const GT_FACE = Face([0, 100, 52], 30, { er: 6, ey: 12, my: -12, mw: 24, mh: 7, md: 8, teeth: 7, out: 0.25 });
export const GoldenTruffle = {
  height: 160,
  parts: [
    { role: 'LegBack', pivot: [-18, 46, 0], lo: [-44, -4, -30], hi: [0, 60, 36], h: 1.3, f: (p) => { reset(); leg(p, [-18, 50, 0], [-20, 28, 4], [-19, 11, 1], 10, 9, -1); return getD(); } },
    { role: 'LegFront', pivot: [18, 46, 0], lo: [0, -4, -30], hi: [44, 60, 36], h: 1.3, f: (p) => { reset(); leg(p, [18, 50, 0], [20, 28, 4], [19, 11, 1], 10, 9, 1); return getD(); } },
    { role: 'Body', pivot: [0, 48, 0], lo: [-62, 28, -60], hi: [62, 152, 64], h: 1.3, tris: 10000, eyes: GT_FACE.eyes, teeth: GT_FACE.teeth, f: (p) => { reset();
      U(ell(p, [0, 92, 0], [52, 50, 50]), G1, 8);
      for (let i = 0; i < 14; i++) { const a = i * 2.399, t = (i + 0.5) / 14, y = 92 + (1 - 2 * t) * 46, r = Math.sqrt(Math.max(0, 1 - ((y - 92) / 50) ** 2)) * 50; const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (z > 30 && Math.abs(y - 96) < 24) continue; U(sph(p, [x, y, z], 9), G2, 5); }
      P(p[1] - 60, G3, 6); P(sph(p, [-16, 126, 30], 10), GL, 4);
      GT_FACE.cut(p); return getD(); } },
    { role: 'ArmBack', pivot: [-44, 98, 12], lo: [-76, 46, -10], hi: [-28, 106, 48], h: 1.2, f: (p) => { reset(); arm(p, [-44, 96, 12], [-56, 82, 20], [-58, 70, 28], 7, -1, G2); return getD(); } },
    { role: 'ArmFront', pivot: [44, 98, 12], lo: [28, 46, -10], hi: [76, 106, 48], h: 1.2, f: (p) => { reset(); arm(p, [44, 96, 12], [56, 82, 20], [58, 70, 28], 7, 1, G2); return getD(); } },
    { role: 'Head', pivot: [0, 136, 0], lo: [-30, 126, -30], hi: [30, 180, 30], h: 1.0, f: (p) => { reset();
      for (const [x, z, h, r] of [[0, 0, 26, 9], [-10, 4, 16, 6.5], [9, -5, 18, 7]]) { U(cap(p, [x, 130, z], [x, 130 + h, z], 3.2, 2.6), MYC, 2); U(smax(1.5, ell(p, [x, 130 + h, z], [r, r * 0.6, r]), 128 + h - p[1]), G1, 2); }
      S(p[1] - 130, 1); return getD(); } },
  ],
};

// ---------------------------------------------------------------- ROOTWORM (Burrower)
// A root as thick as a barrel arching up out of the floor in fat ringed segments, and at its end a round mouth opening
// toward you: rings of big teeth round a lit gullet, two small mean eyes above it.
const RW_TEETH = (() => { const T = [], c = [0, 106, 58]; for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 9; i++) { const a = i * 0.698 + ring * 0.35, R = 19 - ring * 7; const at = [c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R, c[2] - ring * 4]; T.push({ a: at, b: [c[0] + Math.cos(a) * R * 0.45, c[1] + Math.sin(a) * R * 0.45, c[2] - ring * 4 + 2], r: 3 - ring }); } return T; })();
const RW_EYES = [-1, 1].map((s) => E([s * 14, 128, 50], 4, s, [s * 0.3, 0.3, 1]));
export const Rootworm = {
  lean: 0,
  height: 120,
  parts: [
    { role: 'Body', pivot: [0, 0, 0], lo: [-58, -20, -66], hi: [58, 102, 62], h: 1.5, tris: 9000, f: (p) => { reset();
      const pts = [[0, -10, -40], [0, 30, -32], [0, 62, -12], [0, 86, 14]];
      chain(p, pts, 30, 27, ROOT, 10);
      for (let i = 0; i < 6; i++) { const t = (i + 0.5) / 6, k = Math.floor(t * 3), f = t * 3 - k, a = pts[k], b = pts[k + 1], c = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
        P(Math.abs(len(p[0] - c[0], p[1] - c[1], p[2] - c[2]) - 30) - 2 + (Math.abs(p[1] - c[1]) > 6 ? 99 : 0), ROOT_D, 1); }
      U(ell(p, [0, 0, -40], [52, 10, 50]), ROOT_D, 10);                             // the torn floor it came up through
      return getD(); } },
    { role: 'Head', pivot: [0, 88, 26], lo: [-42, 58, -2], hi: [42, 152, 82], h: 1.0, tris: 7000, eyes: RW_EYES, teeth: RW_TEETH, f: (p) => { reset();
      U(cap(p, [0, 88, 18], [0, 106, 46], 28, 27), ROOT, 8);
      U(torus(rotXp(p, [0, 106, 52]), [0, 0, 0], 22, 6), FLESH(0.8), 3);
      S(cap(p, [0, 106, 66], [0, 106, 36], 17, 10), 3, MOUTH);
      P(sph(p, [0, 106, 36], 10), GLOW(1), 3);
      for (const e of RW_EYES) socket(p, e);
      S(p[1] - 64, 2); return getD(); } },
  ],
};

// ---------------------------------------------------------------- SPORE POD (Totem)
// A clutch of fat round pods on a mat, the big one in the middle split by a glowing seam with teeth along it.
const SP_TEETH = [-6, -2, 2, 6].map((x, i) => ({ a: [x, 58 + (i % 2) * 0.5, 15], b: [x, 52, 16.5], r: 1.8 }));
export const SporePod = {
  lean: 0,
  height: 64,
  parts: [
    { role: 'Body', pivot: [0, 0, 0], lo: [-58, -4, -58], hi: [58, 72, 58], h: 1.3, tris: 7000, f: (p) => { reset();
      U(ell(p, [0, 3, 0], [52, 6, 52]), FLESH(0.7), 8);
      for (const [x, z, r] of [[-28, 14, 13], [24, 18, 11], [30, -18, 14], [-22, -26, 12], [2, -34, 9]]) { U(ell(p, [x, r * 0.9, z], [r, r * 1.1, r]), CAP(1), 4); P(cap(p, [x, r * 2, z + r * 0.9], [x, 0, z + r * 0.9], 1.6), GLOW(1), 0.6); }
      S(p[1], 1); return getD(); } },
    { role: 'Head', pivot: [0, 30, 0], lo: [-26, 22, -26], hi: [26, 84, 26], h: 1.0, tris: 5000, teeth: SP_TEETH, f: (p) => { reset();
      U(ell(p, [0, 46, 0], [20, 26, 19]), CAP(1), 4);
      S(smax(1, ell(p, [0, 56, 14], [12, 3.4, 8]), -100), 1, GLOW(1));
      P(sph(p, [0, 72, 0], 6), SPOT, 1);
      S(p[1] - 26, 1); return getD(); } },
  ],
};

// ---------------------------------------------------------------- GRASPING MYCEL (Totem)
// A thick braid of mycelium rising out of a mat, swaying, ending in a hooked three-fingered claw; a few caps and lit
// pores along it.
export const GraspingMycel = {
  lean: 0,
  height: 140,
  parts: [
    { role: 'Body', pivot: [0, 0, 0], lo: [-58, -16, -58], hi: [58, 86, 58], h: 1.3, tris: 6000, f: (p) => { reset();
      U(ell(p, [0, 2, 0], [48, 7, 48]), FLESH(0.7), 8);
      for (let i = 0; i < 3; i++) { const a = i * 2.094; chain(p, [[Math.cos(a) * 9, 0, Math.sin(a) * 9], [Math.cos(a + 1) * 7, 40, Math.sin(a + 1) * 7], [Math.cos(a + 2) * 6, 80, Math.sin(a + 2) * 6]], 8, 7, MYC, 4); }
      U(ell(p, [12, 46, 6], [8, 4, 8]), CAP(1), 2); P(sph(p, [-8, 30, 8], 3.4), GLOW(1), 0.6);
      S(p[1], 1); return getD(); } },
    { role: 'Head', pivot: [0, 70, 0], lo: [-42, 60, -38], hi: [42, 162, 52], h: 1.1, tris: 6000, f: (p) => { reset();
      for (let i = 0; i < 3; i++) { const a = i * 2.094 + 2; chain(p, [[Math.cos(a) * 6, 70, Math.sin(a) * 6], [Math.cos(a + 1) * 5, 110, Math.sin(a + 1) * 5], [0, 136, 4]], 7, 6, MYC, 4); }
      // the claw: three thick hooked fingers curling forward
      for (const k of [-1, 0, 1]) chain(p, [[0, 136, 4], [k * 12, 152, 10], [k * 16, 150, 28], [k * 10, 138, 38]], 6, 2.6, ROOT_D, 3);
      U(ell(p, [-6, 118, 6], [7, 3.6, 7]), CAP(1), 2); P(sph(p, [5, 100, 7], 3), GLOW(1), 0.5);
      S(p[1] - 66, 1); return getD(); } },
  ],
};

// ================================================================= the bosses
// distance to a triangle (for thin membranes: wings, fins, frills), after Inigo Quilez
function triD(p, a, b, c) {
  const sub = (u, v) => [u[0] - v[0], u[1] - v[1], u[2] - v[2]], dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const ba = sub(b, a), pa = sub(p, a), cb = sub(c, b), pb = sub(p, b), ac = sub(a, c), pc = sub(p, c), nor = cross(ba, ac);
  const sg = Math.sign(dot(cross(ba, nor), pa)) + Math.sign(dot(cross(cb, nor), pb)) + Math.sign(dot(cross(ac, nor), pc));
  if (sg < 2) {
    const seg = (e, q) => { const t = clamp(dot(e, q) / dot(e, e), 0, 1); const r = [e[0] * t - q[0], e[1] * t - q[1], e[2] * t - q[2]]; return dot(r, r); };
    return Math.sqrt(Math.min(seg(ba, pa), seg(cb, pb), seg(ac, pc)));
  }
  return Math.sqrt(dot(nor, pa) * dot(nor, pa) / dot(nor, nor));
}
// a membrane stretched over a fan of points (each triangle from the root to two neighbours), t thick
function membrane(p, root, pts, t) { let d = 1e9; for (let i = 0; i + 1 < pts.length; i++) d = Math.min(d, triD(p, root, pts[i], pts[i + 1])); return d - t; }
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// teeth in a ring (a round maw facing out): centre c, radius R, n teeth pointing in toward the middle, facing +z or dir
function ringTeeth(c, R, n, r, len0 = 0.5, z0 = 0) { const T = []; for (let i = 0; i < n; i++) { const a = i * 2 * Math.PI / n; const at = [c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R, c[2] + z0]; T.push({ a: at, b: lerp3(at, [c[0], c[1], c[2] + z0 + 2], len0), r }); } return T; }

// ---------------------------------------------------------------- THE BROOD MOTHER (eggs)
// An upright queen: a heavy pale torso, two pairs of thick root arms, a crowned cap over a face of four eyes and a fanged
// mouth, and behind her a huge egg sac dragging on the floor, studded with lit pods.
const BM_EYES = [[-9, 182, 70, 5, -1], [9, 182, 70, 5, 1], [-19, 190, 62, 3.6, -1], [19, 190, 62, 3.6, 1]].map(([x, y, z, r, s]) => E([x, y, z], r, s, [s * 0.3, 0, 1]));
const BM_MOUTH = Mouth([0, 164, 68], 15, 5, 5, 6);
export const B_BroodMother = {
  lean: 0,
  height: 205,
  parts: [
    { role: 'LegBack', pivot: [-22, 60, 26], lo: [-62, -4, -14], hi: [10, 86, 70], h: 1.6, f: (p) => { reset(); leg(p, [-22, 66, 26], [-26, 36, 30], [-26, 12, 28], 14, 12, -1); return getD(); } },
    { role: 'LegFront', pivot: [22, 60, 26], lo: [-10, -4, -14], hi: [62, 86, 70], h: 1.6, f: (p) => { reset(); leg(p, [22, 66, 26], [26, 36, 30], [26, 12, 28], 14, 12, 1); return getD(); } },
    { role: 'Body', pivot: [0, 60, 20], lo: [-98, -4, -204], hi: [98, 178, 80], h: 2.0, tris: 16000, f: (p) => { reset();
      U(cap(p, [0, 70, 24], [0, 150, 36], 34, 30), FLESH(1), 12);
      for (const s of [-1, 1]) { U(sph(p, [s * 32, 146, 36], 13), ROOT, 8); U(sph(p, [s * 26, 116, 42], 10), ROOT, 6); }
      // the sac: one long pale lobe dragging behind, pods on it
      U(cap(p, [0, 76, -10], [0, 52, -150], 56, 48), mixP(FLESH(0.85), MYC, 0.5), 20);
      S(p[1], 1);
      for (let i = 0; i < 9; i++) { const t = (i + 0.5) / 9, a = i * 2.4; const c = lerp3([0, 76, -10], [0, 52, -150], t), R = 54 - t * 6; const x = Math.cos(a) * R * 0.85, y = c[1] + Math.abs(Math.sin(a)) * R * 0.8;
        U(ell(p, [x, y, c[2]], [13, 11, 13]), CAP(1), 4); P(cap(p, [x, y + 11, c[2] + 8], [x, y + 11, c[2] - 8], 1.6), GLOW(1), 0.7); }
      return getD(); } },
    { role: 'ArmBack', pivot: [-34, 150, 34], lo: [-100, 40, -10], hi: [-12, 162, 98], h: 1.5, f: (p) => { reset(); arm(p, [-34, 148, 36], [-60, 124, 50], [-70, 96, 70], 9, -1); return getD(); } },
    { role: 'ArmFront', pivot: [34, 150, 34], lo: [12, 40, -10], hi: [100, 162, 98], h: 1.5, f: (p) => { reset(); arm(p, [34, 148, 36], [60, 124, 50], [70, 96, 70], 9, 1); return getD(); } },
    { role: 'ArmBack', pivot: [-28, 118, 40], lo: [-84, 36, 0], hi: [-8, 130, 92], h: 1.4, f: (p) => { reset(); arm(p, [-28, 116, 42], [-46, 96, 58], [-50, 72, 74], 7.5, -1); return getD(); } },
    { role: 'ArmFront', pivot: [28, 118, 40], lo: [8, 36, 0], hi: [84, 130, 92], h: 1.4, f: (p) => { reset(); arm(p, [28, 116, 42], [46, 96, 58], [50, 72, 74], 7.5, 1); return getD(); } },
    { role: 'Head', pivot: [0, 160, 38], lo: [-76, 140, -36], hi: [76, 238, 112], h: 1.2, tris: 12000, eyes: BM_EYES, teeth: BM_MOUTH.teeth, f: (p) => { reset();
      U(cap(p, [0, 152, 40], [0, 186, 46], 24, 26), FLESH(1), 6);
      for (const e of BM_EYES) socket(p, e); mouthCut(p, BM_MOUTH);
      dome(p, [0, 206, 40], 66, 26, { spots: 8, spotR: 0.15, under: 0.3, seed: 3, tilt: 0.1 });
      for (let i = 0; i < 6; i++) { const a = i * 1.047 + 0.5, x = Math.cos(a) * 26, z = 40 + Math.sin(a) * 26; U(cap(p, [x, 220, z], [x * 1.1, 236, z], 4, 1.6), CAP(0.8), 2); }
      S(p[1] - 148, 1); return getD(); } },
  ],
};

// ---------------------------------------------------------------- KING PUFFCAP (split)
// The Puffball grown regal: the same huge body and snarl, a crown of tall caps.
const KP_FACE = Face([0, 128, 76], 44, { er: 8.5, ey: 20, my: -10, mw: 36, mh: 12, md: 14, teeth: 8, out: 0.3 });
export const B_KingPuff = {
  height: 230,
  parts: [
    ...Puffball.parts.filter((q) => q.role !== 'Head' && q.role !== 'Body'),
    { ...Puffball.parts.find((q) => q.role === 'Body'), eyes: KP_FACE.eyes, teeth: KP_FACE.teeth, f: (p) => { reset();
      U(ell(p, [0, 118, 0], [78, 74, 76]), CAP(1), 8); P(p[1] - 92, FLESH(0.9), 6);
      for (let i = 0; i < 10; i++) { const a = i * 2.4, y = 110 + (i % 3) * 20; P(sph(p, [Math.cos(a) * 76, y, Math.sin(a) * 76], 7), SPOT, 1); }
      KP_FACE.cut(p); return getD(); } },
    { role: 'Head', pivot: [0, 176, 0], lo: [-62, 160, -62], hi: [62, 252, 62], h: 1.2, tris: 7000, f: (p) => { reset();
      U(cyl(p, [0, 188, 0], 34, 12, 4), C(0xd8b040), 4);                                  // a band of gold
      for (let i = 0; i < 6; i++) { const a = i * 1.047; const x = Math.cos(a) * 28, z = Math.sin(a) * 28, h = 24 + (i % 2) * 12;
        U(cap(p, [x, 190, z], [x * 1.05, 190 + h, z * 1.05], 4.5, 3.6), MYC, 2); U(smax(1.5, ell(p, [x * 1.05, 190 + h, z * 1.05], [11, 7, 11]), 188 + h - p[1]), CAP(1), 2); }
      S(p[1] - 172, 1); return getD(); } },
  ],
};

// ---------------------------------------------------------------- THE DRIFT QUEEN (swarm)
// A vast floating pod crowned with tall caps, a mean face across its front, lit buds all over its underside, a heavy
// round maw on a stalk below, and a curtain of thick glowing tendrils trailing under her.
const DQ_EYES = [-1, 1].map((s) => E([s * 22, 152, 76], 9, s, [s * 0.3, -0.1, 1]));
const DQ_TEETH = ringTeeth([0, 52, 30], 16, 12, 3.4, 0.55, 2);
export const B_DriftQueen = {
  height: 190,
  parts: [
    { role: 'Tail', pivot: [0, 70, 0], lo: [-52, -8, -52], hi: [52, 76, 52], h: 1.3, tris: 5000, f: (p) => { reset();
      for (let i = 0; i < 7; i++) { const a = i * 0.9, R = 30 + (i % 2) * 10, x = Math.cos(a) * R, z = Math.sin(a) * R; chain(p, [[x, 74, z], [x * 1.1, 46, z * 1.1], [x * 0.95, 20, z * 0.95], [x * 1.05, -4, z * 1.05]], 4.4, 2.2, FLESH(0.8), 2); P(sph(p, [x * 1.05, -2, z * 1.05], 4), GLOW(1), 1); }
      return getD(); } },
    { role: 'Body', pivot: [0, 110, 0], lo: [-88, 58, -88], hi: [88, 230, 88], h: 1.8, tris: 14000, eyes: DQ_EYES, f: (p) => { reset();
      U(smax(3, ell(p, [0, 140, 0], [80, 56, 80]), 96 - p[1]), CAP(1), 10);
      U(ell(p, [0, 100, 0], [70, 14, 70]), FLESH(0.85), 10);
      for (let i = 0; i < 14; i++) { const a = i * 2.4, r = 14 + (i % 4) * 14; P(sph(p, [Math.cos(a) * r, 88, Math.sin(a) * r], 5), GLOW(1), 1); U(sph(p, [Math.cos(a) * r, 90, Math.sin(a) * r], 6), FLESH(0.9), 3); }
      for (let i = 0; i < 5; i++) { const a = i * 1.257 + 0.3, x = Math.cos(a) * 30, z = Math.sin(a) * 30 - 10, h = 26 + (i % 2) * 14; U(cap(p, [x, 186, z], [x, 186 + h, z], 5, 4), MYC, 3); U(smax(1.5, ell(p, [x, 186 + h, z], [14, 8, 14]), 184 + h - p[1]), CAP(0.85), 2); P(sph(p, [x, 194 + h, z], 4), SPOT, 1); }
      for (const e of DQ_EYES) socket(p, e);
      U(cap(p, [-28, 168, 70], [28, 168, 70], 6), CAP(0.8), 5);                         // a heavy brow
      return getD(); } },
    { role: 'Head', pivot: [0, 86, 12], lo: [-38, 30, -26], hi: [38, 98, 62], h: 1.1, tris: 6000, teeth: DQ_TEETH, f: (p) => { reset();
      U(cap(p, [0, 96, 10], [0, 58, 24], 14, 20), FLESH(1), 5);
      U(torus(rotXp(p, [0, 52, 28]), [0, 0, 0], 18, 6), FLESH(0.8), 3);
      S(cap(p, [0, 52, 40], [0, 52, 14], 13, 8), 3, MOUTH); P(sph(p, [0, 52, 12], 8), GLOW(1), 2);
      return getD(); } },
  ],
};

// ---------------------------------------------------------------- THE LAMPLIGHTER (decoy)
// An anglerfish grown out of a puffball: a dark round bulb that is mostly mouth, rows of long needle teeth, two small mean
// eyes high up, a fin of gill-frill down its back, and over its front on a long arching stalk, the lure: a lit pod.
const LL_EYES = [-1, 1].map((s) => E([s * 30, 154, 62], 6.5, s, [s * 0.5, 0.1, 1]));
const LL_TEETH = (() => { const T = []; for (let i = 0; i < 11; i++) { const x = -48 + i * 9.6, cu = (x * x) / 2304; T.push({ a: [x, 110 + cu * 10, 84 - cu * 18], b: [x, 86 + cu * 10, 86 - cu * 18], r: 3 }); } for (let i = 0; i < 10; i++) { const x = -43 + i * 9.6, cu = (x * x) / 2304; T.push({ a: [x, 58 + cu * 8, 80 - cu * 18], b: [x, 80 + cu * 8, 82 - cu * 18], r: 2.8 }); } return T; })();
const ANG = C(0x2a2a34), ANG2 = C(0x3c3a48);
export const B_Lantern = {
  height: 200,
  parts: [
    { role: 'Tail', pivot: [0, 96, -60], lo: [-42, 36, -154], hi: [42, 152, -38], h: 1.3, tris: 5000, f: (p) => { reset();
      U(cap(p, [0, 100, -50], [0, 96, -120], 26, 10), ANG, 8);
      U(smax(1, membrane(p, [0, 96, -110], [[0, 140, -110], [0, 120, -150], [0, 70, -150], [0, 56, -112]], 2.2), -100), CAP(1), 3);
      return getD(); } },
    { role: 'Body', pivot: [0, 100, 0], lo: [-82, 28, -82], hi: [82, 180, 98], h: 1.6, tris: 14000, eyes: LL_EYES, teeth: LL_TEETH, f: (p) => { reset();
      U(ell(p, [0, 104, 4], [70, 66, 72]), ANG, 10);
      P(p[1] - 72, ANG2, 6);
      // the mouth: a huge grin across the whole front
      { const x = p[0], q = [p[0], p[1] - (x * x) / 2304 * 9, p[2]]; S(ell(q, [0, 84, 76], [54, 26, 30]), 6, MOUTH); }
      for (const e of LL_EYES) socket(p, e);
      U(smax(1, membrane(p, [0, 150, -10], [[0, 182, 20], [0, 186, -20], [0, 170, -60], [0, 130, -74]], 2.4), -100), CAP(1), 4);   // the fin
      return getD(); } },
    { role: 'Head', pivot: [0, 160, 10], lo: [-28, 148, -12], hi: [28, 240, 134], h: 1.1, tris: 5000, f: (p) => { reset();
      chain(p, [[0, 160, 10], [0, 212, 34], [0, 226, 76], [0, 206, 112]], 5, 3.2, ANG2, 3);
      U(ell(p, [0, 194, 118], [12, 14, 12]), FLESH(0.9), 3); P(ell(p, [0, 192, 118], [13, 10, 13]), GLOW(1), 2);
      U(ell(p, [0, 207, 116], [9, 4, 9]), CAP(1), 2);
      S(p[1] - 154, 1); return getD(); } },
  ],
};

// ---------------------------------------------------------------- CARAPACE (shell)
// A tortoise that is mostly fungus: a vast domed bracket shell ringed in bands with a heavy rolled rim, pale pored
// underside, four thick stumpy legs, and pushing out under the front rim a beaked head with a scowl.
const CP_EYES = [-1, 1].map((s) => E([s * 14, 86, 176], 6, s, [s * 0.55, 0.1, 0.8]));
const CP_TEETH = [-10, -5, 0, 5, 10].map((x) => ({ a: [x, 66, 194 - Math.abs(x) * 0.5], b: [x, 58, 195 - Math.abs(x) * 0.5], r: 2.6 }));
export const B_Carapace = {
  height: 170, beast: true,
  parts: [
    ...[['LegBack', -1, -40], ['LegFront', 1, -40], ['ArmBack', -1, 44], ['ArmFront', 1, 44]].map(([role, s, z]) => ({ role, pivot: [s * 46, 46, z], lo: s < 0 ? [-88, -4, z - 42] : [12, -4, z - 42], hi: s < 0 ? [-12, 74, z + 46] : [88, 74, z + 46], h: 1.6,
      f: (p) => { reset(); U(cap(p, [s * 48, 54, z], [s * 60, 14, z + (z > 0 ? 8 : -8)], 20, 17), ROOT, 8); U(ell(p, [s * 60, 8, z + (z > 0 ? 12 : -12)], [20, 9, 22]), ROOT_D, 6);
        for (const k of [-1, 0, 1]) U(sph(p, [s * 60 + k * 10, 6, z + (z > 0 ? 30 : -30)], 6), ROOT_D, 3); S(p[1], 1); return getD(); } })),
    { role: 'Body', pivot: [0, 50, 0], lo: [-132, 10, -144], hi: [132, 186, 144], h: 2.0, tris: 14000, f: (p) => { reset();
      U(smax(4, ell(p, [0, 60, 0], [120, 118, 132]), 44 - p[1]), CAP(1), 10);
      U(torus([p[0], p[1] - 50, p[2] * 0.92], [0, 0, 0], 116, 12), CAP(0.8), 6);                       // the rolled rim
      const rr = len(p[0], 0, p[2] * 0.9); P(Math.abs(Math.sin(rr * 0.07 + p[1] * 0.04)) - 0.12, mixP(CAP(0.7), C(0xf0e2c0), 0.4), 0.1);   // growth bands
      U(ell(p, [0, 36, 0], [106, 16, 118]), FLESH(0.85), 10);                                            // pale underside
      return getD(); } },
    { role: 'Head', pivot: [0, 62, 118], lo: [-46, 28, 92], hi: [46, 120, 214], h: 1.2, tris: 8000, eyes: CP_EYES, teeth: CP_TEETH, f: (p) => { reset();
      U(cap(p, [0, 60, 110], [0, 76, 160], 26, 24), ROOT, 8);
      U(ell(p, [0, 76, 178], [24, 20, 22]), ROOT, 8);
      U(cap(p, [0, 70, 186], [0, 62, 204], 15, 7), ROOT_D, 5);                                          // the beak
      for (const e of CP_EYES) socket(p, e);
      S(ell(p, [0, 62, 192], [13, 4, 12]), 2, MOUTH);
      S(p[2] - 100, 2); return getD(); } },
  ],
};

// ---------------------------------------------------------------- THE GREAT ROOTWORM (burrow)
// The Rootworm's mother: far thicker, ringed with lit bands, and its round maw fringed with thick groping feeler-roots
// round two rings of big teeth.
const WY_C = [0, 112, 84];
const WY_TEETH = [...ringTeeth(WY_C, 28, 12, 4.4, 0.45, -2), ...ringTeeth(WY_C, 18, 10, 3.2, 0.4, -8)];
const WY_EYES = [-1, 1].map((s) => E([s * 22, 146, 70], 6, s, [s * 0.35, 0.3, 1]));
export const B_Wyrm = {
  lean: 0,
  height: 140,
  parts: [
    { role: 'Body', pivot: [0, 0, 0], lo: [-68, -8, -76], hi: [68, 112, 70], h: 1.7, tris: 10000, f: (p) => { reset();
      const pts = [[0, -10, -50], [0, 36, -40], [0, 72, -14], [0, 96, 20]];
      chain(p, pts, 42, 38, ROOT, 12);
      for (let i = 0; i < 4; i++) { const t = (i + 0.5) / 4, k = Math.min(2, Math.floor(t * 3)), f = t * 3 - k, c = lerp3(pts[k], pts[k + 1], f); P(Math.abs(p[1] - c[1]) - 3, GLOW(1), 1.5); }
      U(ell(p, [0, 0, -50], [62, 12, 60]), ROOT_D, 12);
      return getD(); } },
    { role: 'Head', pivot: [0, 88, 26], lo: [-64, 46, -8], hi: [64, 172, 118], h: 1.2, tris: 10000, eyes: WY_EYES, teeth: WY_TEETH, f: (p) => { reset();
      U(cap(p, [0, 92, 20], [0, 112, 64], 40, 38), ROOT, 10);
      U(torus(rotXp(p, [0, 112, 76]), [0, 0, 0], 32, 8), FLESH(0.8), 4);
      S(cap(p, [0, 112, 96], [0, 112, 56], 25, 14), 4, MOUTH); P(sph(p, [0, 112, 54], 14), GLOW(1), 4);
      for (let i = 0; i < 8; i++) { const a = i * 0.785 + 0.4, r = 38, x = Math.cos(a) * r, y = 112 + Math.sin(a) * r; chain(p, [[x * 0.9, y - (y - 112) * 0.1, 76], [x * 1.25, 112 + (y - 112) * 1.25, 96], [x * 1.4, 112 + (y - 112) * 1.35, 112]], 5, 2.4, ROOT_D, 3); }
      for (const e of WY_EYES) socket(p, e);
      S(p[1] - 52, 2); return getD(); } },
  ],
};

// ---------------------------------------------------------------- THUNDERHEAD (storm)
// A storm cloud of puffballs: a mass of round balls packed together, dark beneath, cracks of light between them, a
// heavy-browed scowling face pushing out of the front, and thick lit threads of spore rain under it.
const TH_FACE = Face([0, 122, 104], 26, { er: 7, ey: 12, my: -10, mw: 22, mh: 7, md: 9, teeth: 7, out: 0.25 });
export const B_Thunderhead = {
  height: 190,
  parts: [
    { role: 'Tail', pivot: [0, 70, 0], lo: [-72, -8, -62], hi: [72, 80, 62], h: 1.2, tris: 5000, f: (p) => { reset();
      for (let i = 0; i < 9; i++) { const a = i * 2.4, R = 20 + (i % 3) * 18, x = Math.cos(a) * R, z = Math.sin(a) * R * 0.8; U(cap(p, [x, 78, z], [x * 1.05, 2 + (i % 2) * 14, z * 1.05], 3, 1.6), GLOW(1), 1.5); }
      return getD(); } },
    { role: 'Body', pivot: [0, 120, 0], lo: [-124, 60, -100], hi: [124, 214, 100], h: 2.0, tris: 14000, f: (p) => { reset();
      for (const [x, y, z, r] of [[0, 140, 0, 56], [-58, 130, -10, 44], [58, 132, -6, 46], [-30, 172, -20, 40], [34, 170, -12, 40], [0, 120, -50, 44], [-86, 118, 10, 30], [86, 118, 10, 30], [0, 182, 20, 30]])
        U(sph(p, [x, y, z], r), CAP(1), 6);
      P(p[1] - 112, mixP(CAP(0.55), DARK, 0.35), 8);
      P(Math.max(Math.abs(Math.sin(p[0] * 0.05 + p[2] * 0.03)) - 0.04, Math.abs(Math.sin(p[1] * 0.06 - p[2] * 0.02)) - 0.1), GLOW(1), 0.03);   // seams of light
      return getD(); } },
    { role: 'Head', pivot: [0, 120, 50], lo: [-52, 74, 28], hi: [52, 166, 118], h: 1.1, tris: 8000, eyes: TH_FACE.eyes, teeth: TH_FACE.teeth, f: (p) => { reset();
      U(ell(p, [0, 122, 80], [36, 34, 30]), CAP(0.9), 6);
      U(cap(p, [-28, 142, 104], [28, 142, 104], 7), CAP(0.75), 6);
      TH_FACE.cut(p); S(p[2] - 34, 2); return getD(); } },
  ],
};

// ---------------------------------------------------------------- ASH AND EMBER (twin hounds)
// Two hounds the Blight took: long powerful bodies of dark fur, a ridge of caps down the spine, lit eyes, long jaws full
// of teeth in a snarl.
const HD_FUR = C(0x3c3430), HD_FUR2 = C(0x2c2622);
const HD_EYES = [-1, 1].map((s) => E([s * 11, 112, 92], 4.4, s, [s * 0.5, 0.15, 0.85]));
const HD_TEETH = (() => { const T = []; for (let i = 0; i < 5; i++) { const z = 98 + i * 5.5; for (const s of [-1, 1]) { T.push({ a: [s * 7.5, 95, z], b: [s * 7, 88, z + 0.5], r: i === 4 ? 1.4 : 1.8 }); if (i < 4) T.push({ a: [s * 6.5, 82, z + 2], b: [s * 6.5, 88, z + 2.5], r: 1.5 }); } } return T; })();
export const B_Hound = {
  height: 140, beast: true,
  parts: [
    { role: 'LegBack', pivot: [-16, 70, -44], lo: [-42, -4, -90], hi: [4, 100, -6], h: 1.2, f: (p) => { reset(); beastLeg(p, [-16, 76, -46], [-20, 46, -62], [-18, 12, -44], 8, HD_FUR); return getD(); } },
    { role: 'LegFront', pivot: [16, 70, -44], lo: [-4, -4, -90], hi: [42, 100, -6], h: 1.2, f: (p) => { reset(); beastLeg(p, [16, 76, -46], [20, 46, -62], [18, 12, -44], 8, HD_FUR); return getD(); } },
    { role: 'Body', pivot: [0, 74, 0], lo: [-42, 38, -98], hi: [42, 136, 62], h: 1.3, tris: 9000, f: (p) => { reset();
      U(cap(p, [0, 84, -50], [0, 92, 30], 24, 30), HD_FUR, 12);
      P(p[1] - 72, HD_FUR2, 5);
      for (let i = 0; i < 6; i++) { const z = -50 + i * 15, y = 108 + Math.sin(i) * 3; U(cap(p, [0, y, z], [0, y + 10 + (i % 2) * 4, z - 3], 3, 2.4), MYC, 2); U(smax(1, ell(p, [0, y + 13 + (i % 2) * 4, z - 3], [7, 4, 7]), y + 11 + (i % 2) * 4 - p[1]), CAP(1), 1.5); }
      return getD(); } },
    { role: 'Tail', pivot: [0, 82, -62], lo: [-26, 28, -144], hi: [26, 112, -48], h: 1.2, tris: 2500, f: (p) => { reset(); chain(p, [[0, 86, -64], [0, 80, -96], [0, 64, -124], [0, 50, -138]], 8, 4, HD_FUR, 4); return getD(); } },
    { role: 'ArmBack', pivot: [-15, 72, 34], lo: [-40, -4, 4], hi: [4, 100, 66], h: 1.2, f: (p) => { reset(); beastLeg(p, [-17, 78, 32], [-18, 44, 38], [-17, 12, 36], 7.5, HD_FUR); return getD(); } },
    { role: 'ArmFront', pivot: [15, 72, 34], lo: [-4, -4, 4], hi: [40, 100, 66], h: 1.2, f: (p) => { reset(); beastLeg(p, [17, 78, 32], [18, 44, 38], [17, 12, 36], 7.5, HD_FUR); return getD(); } },
    { role: 'Head', pivot: [0, 96, 46], lo: [-36, 62, 24], hi: [36, 144, 134], h: 0.9, tris: 9000, eyes: HD_EYES, teeth: HD_TEETH, f: (p) => { reset();
      U(cap(p, [0, 98, 50], [0, 106, 78], 18, 17), HD_FUR, 6);
      U(cap(p, [0, 100, 84], [0, 92, 124], 13, 9), HD_FUR, 6);                       // the long snout
      U(sph(p, [0, 96, 126], 4.4), DARK, 2);
      for (const s of [-1, 1]) U(cap(p, [s * 11, 118, 74], [s * 16, 138, 64], 6, 2), HD_FUR2, 3);   // ears laid back
      for (const e of HD_EYES) socket(p, e);
      S(smax(1, ell(p, [0, 89, 110], [9.5, 5, 22]), 86 - p[2]), 2, MOUTH);
      S(p[2] - 36, 2); return getD(); } },
  ],
};

// ---------------------------------------------------------------- THE FURNACE (heat)
// A burned-out stump still burning inside: charred bark split open down the chest on a core of light, two hollow
// chimney stumps on its shoulders, huge charred fists, and a scowl of fire in its sunk face.
const CHAR = C(0x2a2220), CHAR2 = C(0x3e3230), EMBER = C(0xff8a3a);
const FN_FACE = Face([0, 204, 62], 14, { er: 4.6, ey: 4, my: -8, mw: 11, mh: 3.8, md: 6, teeth: 5, out: 0.15 });
export const B_Furnace = {
  height: 240, scale: 1.4,
  parts: [
    { role: 'LegBack', pivot: [-28, 92, -8], lo: [-74, -4, -50], hi: [4, 118, 46], h: 1.8, f: (p) => { reset(); leg(p, [-30, 98, -8], [-34, 54, -4], [-34, 16, -2], 20, 19, -1); return getD(); } },
    { role: 'LegFront', pivot: [28, 92, -8], lo: [-4, -4, -50], hi: [74, 118, 46], h: 1.8, f: (p) => { reset(); leg(p, [30, 98, -8], [34, 54, -4], [34, 16, -2], 20, 19, 1); return getD(); } },
    { role: 'Body', pivot: [0, 92, 0], lo: [-102, 66, -86], hi: [102, 276, 86], h: 1.9, tris: 13000, f: (p) => { reset();
      U(cap(p, [0, 100, 0], [0, 180, 8], 50, 58), CHAR, 14);
      U(ell(p, [0, 198, 12], [66, 40, 50]), CHAR, 18);
      for (const s of [-1, 1]) { U(smax(2, cyl(p, [s * 44, 236, -4], 18, 26, 4), -(len(p[0] - s * 44, 0, p[2] + 4) - 11)), CHAR2, 6); P(Math.max(len(p[0] - s * 44, 0, p[2] + 4) - 12, 255 - p[1]), EMBER, 2); }
      // the split down the chest, lit from inside
      S(smax(2, Math.abs(p[0] + Math.sin(p[1] * 0.08) * 4) - 7, -(p[2] - 30), Math.abs(p[1] - 160) - 52), 4, EMBER);
      P(Math.abs(p[0] + Math.sin(p[1] * 0.08) * 4) - 12 + (p[2] < 30 ? 99 : 0), GLOW(1), 3);
      P(Math.abs(Math.sin(Math.atan2(p[2], p[0]) * 6 + p[1] * 0.02)) - 0.08, mixP(CHAR, EMBER, 0.6), 0.05);   // cracks of embers
      return getD(); } },
    { role: 'ArmBack', pivot: [-62, 182, 6], lo: [-124, 0, -36], hi: [-28, 220, 84], h: 1.6, f: (p) => { reset(); furnArm(p, -1); return getD(); } },
    { role: 'ArmFront', pivot: [62, 182, 6], lo: [28, 0, -36], hi: [124, 220, 84], h: 1.6, f: (p) => { reset(); furnArm(p, 1); return getD(); } },
    { role: 'Head', pivot: [0, 196, 30], lo: [-42, 164, 4], hi: [42, 238, 82], h: 1.0, tris: 7000, eyes: FN_FACE.eyes, teeth: FN_FACE.teeth, f: (p) => { reset();
      U(ell(p, [0, 204, 48], [21, 19, 18]), CHAR, 6); U(cap(p, [-19, 216, 58], [19, 216, 58], 6), CHAR2, 5);
      FN_FACE.cut(p); P(ell(p, [0, 196, 64], [12, 5, 6]), GLOW(1), 1); S(p[2] - 30, 2); return getD(); } },
  ],
};
function furnArm(p, s) {
  const sh = [s * 66, 192, 6], el = [s * 84, 124, 18], wr = [s * 88, 58, 32];
  U(cap(p, sh, el, 20, 17), CHAR, 10); U(cap(p, el, wr, 17, 16), CHAR, 8); U(sph(p, el, 18), CHAR2, 6);
  U(ell(p, [wr[0], wr[1] - 18, wr[2] + 4], [22, 22, 20]), CHAR2, 8);
  for (const k of [-1, 0, 1]) U(sph(p, [wr[0] + k * 10, wr[1] - 33, wr[2] + 13], 8), CHAR2, 4);
  P(Math.abs(Math.sin(p[1] * 0.12 + p[0] * 0.05)) - 0.06, EMBER, 0.05);
}

// ---------------------------------------------------------------- THE HYDRA (heads)
// A squat rooted mound and out of it four thick necks, each ending in a tall black-dripping inkcap head with a scowl and
// a fanged mouth.
function hydraNeck(base, mid, head) {
  const F = Face([head[0], head[1] - 6, head[2] + 15], 11, { er: 3.8, ey: 3, my: -8, mw: 8, mh: 3.4, md: 5, teeth: 5, out: 0.2 });
  return { eyes: F.eyes, teeth: F.teeth, f: (p) => { reset();
    chain(p, [base, mid, [head[0], head[1] - 20, head[2] - 2]], 14, 11, FLESH(1), 6);
    U(ell(p, [head[0], head[1] - 8, head[2] + 2], [15, 16, 15]), FLESH(1), 5);
    F.cut(p);
    const q = [p[0] - head[0], p[1] - head[1], p[2] - head[2] + 2], t = clamp(q[1] / 46, 0, 1), R = 20 - t * t * 11;
    U(smax(2.5, len(q[0], 0, q[2]) - R, q[1] - 46, -q[1] - 2), CAP(1), 3);
    P(Math.max(q[1] - 14, -q[1] - 4), C(0x16121a), 3);
    for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.4; U(cap(p, [head[0] + Math.cos(a) * 19, head[1] + 2, head[2] - 2 + Math.sin(a) * 19], [head[0] + Math.cos(a) * 19, head[1] - 8 - i * 2, head[2] - 2 + Math.sin(a) * 19], 3, 2.4), C(0x16121a), 2); }
    return getD(); } };
}
const HY_H = hydraNeck([0, 110, 10], [0, 170, 22], [0, 236, 30]), HY_A = hydraNeck([40, 104, 4], [80, 160, 10], [104, 206, 20]),
  HY_B = hydraNeck([-40, 104, 4], [-80, 160, 10], [-104, 206, 20]), HY_T = hydraNeck([0, 104, -36], [0, 170, -74], [0, 222, -96]);
export const B_Hydra = {
  lean: 0,
  height: 230,
  parts: [
    { role: 'Body', pivot: [0, 50, 0], lo: [-104, -4, -104], hi: [104, 144, 104], h: 1.7, tris: 12000, f: (p) => { reset();
      U(ell(p, [0, 54, 0], [80, 56, 78]), FLESH(0.9), 12);
      P(p[1] - 30, ROOT, 8);
      for (let i = 0; i < 8; i++) { const a = i * 0.785; chain(p, [[Math.cos(a) * 60, 20, Math.sin(a) * 60], [Math.cos(a) * 88, 8, Math.sin(a) * 88], [Math.cos(a) * 100, 0, Math.sin(a) * 100]], 11, 5, ROOT, 5); }
      S(p[1], 1); return getD(); } },
    { role: 'Head', pivot: [0, 110, 10], lo: [-52, 88, -42], hi: [52, 286, 72], h: 1.2, tris: 7000, eyes: HY_H.eyes, teeth: HY_H.teeth, f: HY_H.f },
    // all four necks animate as heads (they sway and strike like a head; an arm's chop would fold an upright neck over backwards)
    { role: 'Head', pivot: [40, 100, 4], lo: [18, 78, -52], hi: [142, 256, 62], h: 1.2, tris: 7000, eyes: HY_A.eyes, teeth: HY_A.teeth, f: HY_A.f },
    { role: 'Head', pivot: [-40, 100, 4], lo: [-142, 78, -52], hi: [-18, 256, 62], h: 1.2, tris: 7000, eyes: HY_B.eyes, teeth: HY_B.teeth, f: HY_B.f },
    { role: 'Head', pivot: [0, 100, -36], lo: [-62, 78, -152], hi: [62, 272, -18], h: 1.2, tris: 7000, eyes: HY_T.eyes, teeth: HY_T.teeth, f: HY_T.f },
  ],
};

// ---------------------------------------------------------------- THE MIRROR QUEEN (reflect)
// Tall and still under a wide flat polished parasol of a cap, a long gown of pale gills to the floor, a narrow face in
// the shade of the cap with two cold eyes, long thin arms held out.
const MQ_EYES = [-1, 1].map((s) => E([s * 5.5, 196, 15], 3.2, s, [s * 0.2, 0, 1]));
export const B_MirrorQueen = {
  height: 250,
  parts: [
    { role: 'LegBack', pivot: [-12, 56, 0], lo: [-38, -4, -32], hi: [8, 112, 38], h: 1.3, f: (p) => { reset(); leg(p, [-12, 60, 0], [-13, 34, 3], [-12, 12, 1], 8, 7, -1); U(cap(p, [-12, 60, 0], [-10, 98, 0], 9, 11), FLESH(0.8), 4); return getD(); } },   // the thigh runs up into the gown
    { role: 'LegFront', pivot: [12, 56, 0], lo: [-8, -4, -32], hi: [38, 112, 38], h: 1.3, f: (p) => { reset(); leg(p, [12, 60, 0], [13, 34, 3], [12, 12, 1], 8, 7, 1); U(cap(p, [12, 60, 0], [10, 98, 0], 9, 11), FLESH(0.8), 4); return getD(); } },
    { role: 'Body', pivot: [0, 56, 0], lo: [-62, 12, -62], hi: [62, 198, 62], h: 1.5, tris: 12000, f: (p) => { reset();
      const a = Math.atan2(p[2], p[0]), t = clamp((182 - p[1]) / 160, 0, 1), R = 12 + t * t * 44 + Math.sin(a * 12) * 2.2 * t;
      U(smax(3, len(p[0], 0, p[2]) - R, p[1] - 182, 20 - p[1]), MYC, 4);
      P(Math.abs(Math.sin(a * 12)) - 0.22 + (p[1] > 160 ? 9 : 0), mixP(MYC, FLESH(0.6), 0.4), 0.1);   // the gill lines
      S(cap(p, [0, 8, 0], [0, 70, 0], 50, 26), 4);
      U(ell(p, [0, 180, 2], [18, 10, 13]), FLESH(0.9), 6);
      S(190 - p[1], 2); return getD(); } },
    { role: 'ArmBack', pivot: [-15, 172, 2], lo: [-94, 86, -32], hi: [-2, 184, 52], h: 1.2, f: (p) => { reset(); arm(p, [-15, 172, 2], [-44, 150, 14], [-72, 126, 28], 5.5, -1, FLESH(0.9)); return getD(); } },
    { role: 'ArmFront', pivot: [15, 172, 2], lo: [2, 86, -32], hi: [94, 184, 52], h: 1.2, f: (p) => { reset(); arm(p, [15, 172, 2], [44, 150, 14], [72, 126, 28], 5.5, 1, FLESH(0.9)); return getD(); } },
    { role: 'Head', pivot: [0, 180, 2], lo: [-98, 158, -98], hi: [98, 264, 98], h: 1.2, tris: 9000, eyes: MQ_EYES, f: (p) => { reset();
      U(cap(p, [0, 178, 2], [0, 214, 4], 9, 10), FLESH(1), 4);
      U(cap(p, [0, 192, 9], [0, 184, 14], 4, 2), FLESH(0.9), 2);                      // a long thin nose
      for (const e of MQ_EYES) socket(p, e);
      S(ell(p, [0, 182, 13], [4, 1.4, 3]), 1, MOUTH);
      // the parasol: wide, flat and polished, a raised rim, a mirror-bright face to it
      const q = [p[0], p[1] - 224, p[2] - 2], rr = len(q[0], 0, q[2]);
      U(smax(2, ell(q, [0, 0, 0], [92, 10 + Math.max(0, 1 - rr / 92) * 14, 92]), -q[1] - 4), CAP(1), 4);
      U(torus(q, [0, -2, 0], 88, 4.6), CAP(0.8), 3);
      P(Math.max(rr - 70, -q[1] - 1), mixP(C(0xf4f0e8), CAP(0.4), 0.3), 4);         // the shining face of it
      P(Math.abs(rr - 76) - 2, GLOW(1), 1);
      S(p[1] - 176, 1); return getD(); } },
  ],
};

// ---------------------------------------------------------------- THE UNBLINKING (vortex)
// A floating puffball that is one great eye: a ball of cap with heavy folded lids, and in it one huge lit eye with a slit
// pupil (a real eye mesh, sharp), and a fringe of thick grasping tendrils under it.
const UB_EYE = [E([0, 132, 42], 38, 1, [0, 0, 1])];
export const B_Unblinking = {
  height: 200,
  parts: [
    { role: 'Tail', pivot: [0, 70, 0], lo: [-62, -8, -62], hi: [62, 82, 62], h: 1.3, tris: 5000, f: (p) => { reset();
      for (let i = 0; i < 9; i++) { const a = i * 0.698, x = Math.cos(a) * 36, z = Math.sin(a) * 36; chain(p, [[x, 80, z], [x * 1.3, 50, z * 1.3], [x * 1.15, 22, z * 1.15], [x * 1.45, 0, z * 1.45]], 6, 2.4, ROOT, 3); }
      return getD(); } },
    { role: 'Body', pivot: [0, 130, 0], lo: [-92, 54, -92], hi: [92, 236, 92], h: 1.7, tris: 12000, f: (p) => { reset();
      U(sph(p, [0, 140, 0], 80), CAP(1), 6);
      S(ell(p, [0, 132, 64], [50, 40, 40]), 6, mixP(DARK, MOUTH, 0.5));                  // the socket
      for (const s of [-1, 1]) U(torus(rotXp2([p[0], p[1], p[2]], [0, 132 + s * 36, 50], s * 0.5), [0, 0, 0], 40, 9), CAP(0.75), 6);   // heavy lids above and below
      P(p[1] - 96, FLESH(0.85), 8);
      return getD(); } },
    { role: 'Head', pivot: [0, 132, 42], lo: [-62, 78, 18], hi: [62, 184, 98], h: 1.3, tris: 3000, eyes: UB_EYE, f: (p) => { reset();
      U(ell(p, [0, 132, 30], [36, 36, 14]), FLESH(0.8), 4);                              // what the eye is set in (behind the eye mesh)
      return getD(); } },
  ],
};

// ---------------------------------------------------------------- THE REAPER (stealth): a mantis, built as one
// The anatomy of a praying mantis, Blight-grown: a long raised prothorax carrying the head and the raptorial forelegs;
// a thorax with the middle and hind legs; a long segmented abdomen behind with folded wings lying along its back. The
// forelegs: a thick spined femur running forward and down from the shoulder, and the tibia folded back up against it as
// a hooked scythe blade. The head: a wide triangle, two great eyes at its upper corners, short mandibles at the point,
// two long antennae. Middle and hind legs: thin, jointed high at the knee, feet splayed.
const MN = { thorax: [0, 96, -14], neck: [0, 172, 24] };
const MN_EYES = [-1, 1].map((s) => E([s * 14, 212, 48], 8.5, s, [s * 0.75, 0.1, 0.65]));
const MN_TEETH = [-1, 1].map((s) => ({ a: [s * 4.5, 190, 54], b: [s * 1.6, 180, 57], r: 2.4 }));
const mantisSpines = (s) => { const T = []; for (let i = 0; i < 5; i++) { const t = 0.15 + i * 0.17, a = lerp3([s * 14, 164, 30], [s * 20, 128, 62], t); T.push({ a: [a[0] - s * 2.5, a[1] - 2, a[2] + 1], b: [a[0] - s * 7, a[1] - 7, a[2] + 3], r: 1.5 }); } return T; };
function mantisLegs(p, s) {
  // middle leg: from the thorax out, up to a high knee, down to a splayed foot
  const mid = [[s * 12, 96, -6], [s * 52, 122, 6], [s * 66, 4, 34]], hind = [[s * 12, 92, -26], [s * 58, 118, -48], [s * 72, 4, -92]];
  for (const L of [mid, hind]) { U(cap(p, L[0], L[1], 5.5, 4.4), ROOT, 3); U(sph(p, L[1], 5.4), ROOT_D, 2); U(cap(p, L[1], L[2], 4.2, 2.6), ROOT, 2);
    const f = L[2]; U(ell(p, [f[0], 2.5, f[2]], [5, 2.5, 7]), ROOT_D, 2); }
  S(p[1], 0.5);
}
function scythe(p, s) {
  const sh = [s * 13, 166, 28], knee = [s * 20, 126, 62], tip = [s * 17, 170, 48];
  U(sph(p, sh, 8), FLESH(0.9), 4);
  U(cap(p, sh, knee, 8, 6.5), FLESH(0.9), 4);                                        // the femur
  U(sph(p, knee, 6.6), ROOT_D, 3);
  // the tibia: a flattened curved blade folding back up, its inner edge sharp, ending in a hook
  const bl = [knee, lerp3(knee, tip, 0.4), lerp3(knee, tip, 0.8), tip];
  let d = 1e9; for (let i = 0; i < 3; i++) { const a = bl[i], b = bl[i + 1], t = clamp(((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1]) + (p[2] - a[2]) * (b[2] - a[2])) / ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2 + (b[2] - a[2]) ** 2), 0, 1);
    const c = lerp3(a, b, t), r = 5.5 - (i + t) * 1.3; d = Math.min(d, len((p[0] - c[0]) * 2.6, p[1] - c[1], p[2] - c[2]) / 1.6 - r); }
  U(d, C(0xd8ceb4), 2);
  U(cap(p, tip, [s * 15, 160, 60], 2.4, 0.8), C(0xd8ceb4), 1.5);                    // the hook
}
export const B_Reaper = {
  height: 230,
  parts: [
    { role: 'LegBack', pivot: [-14, 80, -20], lo: [-92, -4, -112], hi: [4, 132, 42], h: 1.1, tris: 4000, f: (p) => { reset(); mantisLegs(p, -1); return getD(); } },
    { role: 'LegFront', pivot: [14, 80, -20], lo: [-4, -4, -112], hi: [92, 132, 42], h: 1.1, tris: 4000, f: (p) => { reset(); mantisLegs(p, 1); return getD(); } },
    { role: 'Body', pivot: [0, 80, -20], lo: [-40, 46, -134], hi: [40, 194, 52], h: 1.2, tris: 12000, f: (p) => { reset();
      U(ell(p, MN.thorax, [15, 13, 22]), FLESH(1), 6);                                  // the thorax
      chain(p, [[0, 104, 0], [0, 140, 10], MN.neck], 10, 8, FLESH(1), 5);                // the long raised prothorax
      // the abdomen: long, segmented, sloping back and down, banded
      const ab = [[0, 98, -30], [0, 96, -70], [0, 86, -108], [0, 74, -126]];
      chain(p, ab, 19, 6, FLESH(0.9), 6);
      P(Math.abs(Math.sin(p[2] * 0.22)) - 0.16 + (p[2] > -30 ? 99 : 0), mixP(FLESH(0.7), ROOT, 0.4), 0.06);
      // the wings, folded flat along its back: two long leaf-shaped plates
      for (const s of [-1, 1]) U(smax(1, ell(rotXp2(p, [s * 5, 114, -60], -0.18), [0, 0, 0], [13, 3, 54]), -100), CAP(1), 3);
      P(sph(p, [0, 118, -40], 9), SPOT, 1); P(sph(p, [0, 112, -80], 7), SPOT, 1);
      return getD(); } },
    { role: 'ArmBack', pivot: [-12, 168, 26], lo: [-52, 110, 0], hi: [10, 182, 76], h: 0.9, tris: 6000, teeth: mantisSpines(-1), f: (p) => { reset(); scythe(p, -1); return getD(); } },
    { role: 'ArmFront', pivot: [12, 168, 26], lo: [-10, 110, 0], hi: [52, 182, 76], h: 0.9, tris: 6000, teeth: mantisSpines(1), f: (p) => { reset(); scythe(p, 1); return getD(); } },
    { role: 'Head', pivot: [0, 184, 30], lo: [-36, 166, 10], hi: [36, 262, 72], h: 0.8, tris: 8000, eyes: MN_EYES, teeth: MN_TEETH, f: (p) => { reset();
      U(cap(p, [0, 174, 26], [0, 186, 38], 7, 6), FLESH(1), 3);                          // the neck
      // the head: a wide triangle, broad at the eyes, narrowing to the mouth
      U(cap(p, [0, 208, 42], [0, 190, 52], 15, 6), FLESH(1), 5);
      for (const e of MN_EYES) U(sph(p, e.at, e.r * 0.92), FLESH(0.8), 3);              // bulges the eyes sit in
      for (const e of MN_EYES) socket(p, { ...e, r: e.r * 0.9 });
      for (const s of [-1, 1]) U(cap(p, [s * 4, 214, 50], [s * 22, 256, 40], 1.6, 1), ROOT_D, 1);   // antennae
      S(ell(p, [0, 188, 56], [5, 3, 3]), 1, MOUTH);
      return getD(); } },
  ],
};

// ---------------------------------------------------------------- GRANDFATHER TOAD (tide)
// A toad the size of a hut: a broad warty body, a garden of mushrooms on its back, a huge wide mouth across the whole
// front with a row of teeth, two big scowling eyes on bumps on top of its head, thick bowed legs.
const TD_A = C(0x5a6a3a), TD_B = C(0x7a8a4e), TD_BELLY = C(0xd8cca0);
const TD_EYES = [-1, 1].map((s) => E([s * 40, 136, 106], 12, s, [s * 0.4, 0.35, 0.85]));
const TD_TEETH = (() => { const T = []; for (let i = 0; i < 11; i++) { const x = -60 + i * 12, cu = (x * x) / 4900; T.push({ a: [x, 92 - cu * 10, 128 - cu * 26], b: [x, 82 - cu * 10, 129 - cu * 26], r: 3.4 }); } return T; })();
export const B_Toad = {
  height: 170, beast: true,
  parts: [
    { role: 'LegBack', pivot: [-60, 40, -40], lo: [-134, -4, -114], hi: [-28, 96, 12], h: 1.6, f: (p) => { reset(); beastLeg(p, [-64, 50, -40], [-108, 40, -50], [-92, 10, -20], 18, TD_A); return getD(); } },
    { role: 'LegFront', pivot: [60, 40, -40], lo: [28, -4, -114], hi: [134, 96, 12], h: 1.6, f: (p) => { reset(); beastLeg(p, [64, 50, -40], [108, 40, -50], [92, 10, -20], 18, TD_A); return getD(); } },
    { role: 'Body', pivot: [0, 50, 0], lo: [-114, 2, -114], hi: [114, 190, 114], h: 1.9, tris: 14000, f: (p) => { reset();
      U(ell(p, [0, 82, 0], [100, 70, 104]), TD_A, 10);
      P(p[1] - 60, TD_BELLY, 8);
      for (let i = 0; i < 16; i++) { const a = i * 2.4, t = (i + 0.5) / 16, y = 82 + (1 - t) * 60, r = Math.sqrt(Math.max(0, 1 - ((y - 82) / 70) ** 2)) * 100; P(sph(p, [Math.cos(a) * r, y, Math.sin(a) * r], 7 + (i % 3) * 2), TD_B, 1.5); }
      for (const [x, z, h, r] of [[-26, -30, 30, 16], [20, -50, 22, 12], [6, -10, 40, 20], [36, -16, 18, 10], [-40, -60, 16, 11]]) { const y = 140 - Math.abs(x) * 0.2; U(cap(p, [x, y, z], [x, y + h, z], 4.6, 3.8), MYC, 2); U(smax(1.5, ell(p, [x, y + h, z], [r, r * 0.55, r]), y + h - 2 - p[1]), CAP(1), 2); P(sph(p, [x + r * 0.3, y + h + r * 0.45, z], r * 0.25), SPOT, 1); }
      return getD(); } },
    { role: 'ArmBack', pivot: [-50, 50, 50], lo: [-100, -4, 18], hi: [-16, 80, 114], h: 1.4, f: (p) => { reset(); beastLeg(p, [-54, 56, 50], [-66, 30, 62], [-64, 10, 70], 13, TD_A); return getD(); } },
    { role: 'ArmFront', pivot: [50, 50, 50], lo: [16, -4, 18], hi: [100, 80, 114], h: 1.4, f: (p) => { reset(); beastLeg(p, [54, 56, 50], [66, 30, 62], [64, 10, 70], 13, TD_A); return getD(); } },
    { role: 'Head', pivot: [0, 80, 60], lo: [-94, 28, 28], hi: [94, 160, 144], h: 1.4, tris: 10000, eyes: TD_EYES, teeth: TD_TEETH, f: (p) => { reset();
      U(ell(p, [0, 94, 92], [74, 46, 46]), TD_A, 10);
      for (const e of TD_EYES) { U(sph(p, [e.at[0] * 0.95, e.at[1] - 4, e.at[2] - 6], 17), TD_A, 8); socket(p, e); }
      { const x = p[0], q = [p[0], p[1] + (x * x) / 4900 * 10, p[2] + (x * x) / 4900 * 26]; S(ell(q, [0, 86, 128], [72, 7, 22]), 3, MOUTH); }
      P(p[1] - 80, TD_BELLY, 4);
      S(p[2] - 36, 2); return getD(); } },
  ],
};

// ---------------------------------------------------------------- THE ROTWING (strafe): a dragon, built as one
// The anatomy of a dragon in flight, Blight-grown: a deep chest and ribcage tapering to the hips, the forelegs and hind
// legs tucked up under the body as a flying animal carries them, a long S-curved neck, a long tail with a spade of bracket
// at its end. The head: a long skull and snout, heavy brow ridges over scowling eyes, horns sweeping back, nostrils, the
// jaw open on rows of teeth. A crest of caps runs from the head down the neck and spine. The wings: a bat's arm, the
// upper arm to the elbow and forearm to the wrist, then four long finger bones spreading from the wrist, a thumb claw at
// the wrist; membrane stretched between the fingers, the body and the arm, its trailing edge scalloped between
// fingertips.
const DRG = C(0xd8ccb0), DRG2 = C(0xb0a284), DRGB = C(0x8a7a5e);
const RW_EYES2 = [-1, 1].map((s) => E([s * 11, 132, 120], 4.6, s, [s * 0.7, 0.15, 0.7]));
const RW_TEETH2 = (() => { const T = []; for (let i = 0; i < 6; i++) { const z = 124 + i * 7.5, w = 9 - i * 0.9; for (const s of [-1, 1]) { T.push({ a: [s * w, 117, z], b: [s * w * 0.95, 110, z + 0.6], r: 1.8 }); T.push({ a: [s * (w - 1), 101 - i * 0.5, z - 2], b: [s * (w - 1), 107 - i * 0.5, z - 1.5], r: 1.5 }); } } return T; })();
function dragonWing(p, s) {
  const sh = [s * 26, 118, 12], el = [s * 74, 146, -14], wr = [s * 116, 150, 14];
  const tips = [[s * 206, 140, -10], [s * 194, 112, -48], [s * 160, 84, -74], [s * 112, 80, -84]];
  U(cap(p, sh, el, 8, 6), DRG2, 4); U(sph(p, el, 6.5), DRGB, 2); U(cap(p, el, wr, 6, 4.6), DRG2, 3); U(sph(p, wr, 5.2), DRGB, 2);
  U(cap(p, wr, [s * 122, 160, 26], 3.2, 1.2), DRGB, 1.5);                                // the thumb claw
  for (const t of tips) U(cap(p, wr, t, 3.4, 1.4), DRG2, 2);
  // the membrane: between the fingers (scalloped: each span sags in its middle), and from the last finger back to the body
  const scallop = (a, b) => { const m = lerp3(a, b, 0.5); const dir = lerp3(wr, m, 1); return [m[0] - (m[0] - wr[0]) * 0.16, m[1] - (m[1] - wr[1]) * 0.16, m[2] - (m[2] - wr[2]) * 0.16]; };
  const fan = [tips[0], scallop(tips[0], tips[1]), tips[1], scallop(tips[1], tips[2]), tips[2], scallop(tips[2], tips[3]), tips[3]];
  let d = membrane(p, wr, fan, 1.4);
  d = Math.min(d, membrane(p, el, [wr, tips[3], [s * 70, 88, -60], [s * 30, 96, -40]], 1.4), membrane(p, sh, [el, [s * 30, 96, -40]], 1.4));
  U(d, CAP(1), 1.5);
  P(Math.max(-1e9, len(p[0] - wr[0], p[1] - wr[1], p[2] - wr[2]) - 40), mixP(CAP(0.8), DARK, 0.15), 6);
}
export const B_Rotwing = {
  height: 170,
  parts: [
    { role: 'Tail', pivot: [0, 90, -50], lo: [-42, 28, -214], hi: [42, 128, -36], h: 1.1, tris: 7000, f: (p) => { reset();
      const pts = [[0, 92, -50], [0, 86, -100], [4, 74, -150], [-2, 66, -186]];
      chain(p, pts, 15, 4, DRG, 5);
      U(smax(1, membrane(p, [-2, 66, -186], [[0, 74, -186], [14, 66, -208], [0, 60, -214], [-14, 66, -208], [0, 74, -186]], 1.8), -100), CAP(1), 2);   // the spade
      for (let i = 0; i < 6; i++) { const t = 0.1 + i * 0.14, k = Math.min(2, Math.floor(t * 3)), c = lerp3(pts[k], pts[k + 1], t * 3 - k), r = 15 - t * 11; U(cap(p, [c[0], c[1] + r * 0.7, c[2]], [c[0], c[1] + r * 0.7 + 7 - t * 4, c[2] - 3], 2.6 - t, 0.8), CAP(0.85), 1); }
      return getD(); } },
    { role: 'Body', pivot: [0, 92, 0], lo: [-54, 40, -94], hi: [54, 156, 100], h: 1.2, tris: 14000, f: (p) => { reset();
      U(ell(p, [0, 102, 22], [30, 30, 40]), DRG, 10);                                    // the chest
      U(cap(p, [0, 100, 0], [0, 94, -60], 27, 18), DRG, 10);                               // the belly to the hips
      chain(p, [[0, 110, 50], [0, 120, 74], [0, 124, 96]], 16, 13, DRG, 6);                 // the base of the neck
      P(p[1] - 88, mixP(DRG, FLESH(0.8), 0.5), 5);                                         // the belly scales
      P(Math.max(Math.abs(Math.sin(p[2] * 0.3)) - 0.25, p[1] - 92), DRG2, 0.08);
      for (const s of [-1, 1]) {                                                           // legs tucked up under it
        chain(p, [[s * 18, 88, 34], [s * 20, 70, 44], [s * 16, 66, 62]], 7, 4.5, DRG2, 3); U(ell(p, [s * 16, 64, 66], [5, 3, 6]), DRGB, 2);
        chain(p, [[s * 20, 90, -52], [s * 26, 70, -40], [s * 20, 62, -66]], 10, 5, DRG2, 4); U(ell(p, [s * 20, 60, -72], [6, 3, 8]), DRGB, 2); }
      for (let i = 0; i < 8; i++) { const z = 92 - i * 20, y = 128 - Math.abs(z - 20) * 0.18 + (i < 2 ? 8 : 0); U(cap(p, [0, y - 4, z], [0, y + 8, z - 4], 4, 2), CAP(0.85), 2); }   // the crest down the spine
      return getD(); } },
    { role: 'WingBack', pivot: [-24, 116, 10], lo: [-214, 56, -94], hi: [-12, 194, 74], h: 1.2, tris: 9000, f: (p) => { reset(); dragonWing(p, -1); return getD(); } },
    { role: 'WingFront', pivot: [24, 116, 10], lo: [12, 56, -94], hi: [214, 194, 74], h: 1.2, tris: 9000, f: (p) => { reset(); dragonWing(p, 1); return getD(); } },
    { role: 'Head', pivot: [0, 110, 74], lo: [-38, 78, 58], hi: [38, 168, 184], h: 0.9, tris: 12000, eyes: RW_EYES2, teeth: RW_TEETH2, f: (p) => { reset();
      chain(p, [[0, 118, 80], [0, 128, 96], [0, 130, 110]], 12, 11, DRG, 5);               // the top of the neck
      U(ell(p, [0, 128, 116], [15, 13, 16]), DRG, 6);                                      // the skull
      U(cap(p, [0, 124, 122], [0, 118, 168], 12, 7), DRG, 5);                               // the upper jaw and snout
      U(cap(p, [0, 104, 118], [0, 100, 160], 9, 5), DRG2, 4);                              // the lower jaw, hanging open
      S(smax(1.5, ell(p, [0, 110, 140], [10, 6, 30]), 116 - p[2]), 2, MOUTH);
      for (const s of [-1, 1]) {
        U(cap(p, [s * 14, 138, 112], [s * 9, 134, 130], 4.4, 3), DRG2, 3);               // brow ridges, low over the eyes
        U(cap(p, [s * 11, 140, 108], [s * 22, 154, 82], 4.4, 1.2), DRGB, 2);             // horns sweeping back
        U(cap(p, [s * 13, 128, 104], [s * 20, 132, 88], 3, 0.8), DRGB, 1.5);
        S(sph(p, [s * 4, 126, 168], 1.8), 0.8, MOUTH); }                                   // nostrils
      for (const e of RW_EYES2) socket(p, e);
      for (let i = 0; i < 3; i++) U(cap(p, [0, 138 - i * 4, 104 - i * 10], [0, 148 - i * 4, 98 - i * 10], 3.4, 1.4), CAP(0.85), 1.5);
      S(p[2] - 72, 2); return getD(); } },
  ],
};

// ---------------------------------------------------------------- THE STUMP TITAN (ward)
// A titan of stumps: a great cut trunk of a body with its rings showing at the shoulders, a heart of light in a hollow
// in its chest, a smaller stump of a head crowned with shelves and two lit knots of eyes, arms of whole trunks.
const TT_FACE = Face([0, 238, 52], 18, { er: 6, ey: 5, my: -10, mw: 14, mh: 4.6, md: 7, teeth: 5, out: 0.15 });
export const B_Titan = {
  height: 250,
  parts: [
    { role: 'LegBack', pivot: [-32, 96, -6], lo: [-84, -4, -58], hi: [4, 126, 52], h: 1.9, f: (p) => { reset(); leg(p, [-34, 102, -6], [-38, 56, -2], [-38, 16, 0], 22, 21, -1); return getD(); } },
    { role: 'LegFront', pivot: [32, 96, -6], lo: [-4, -4, -58], hi: [84, 126, 52], h: 1.9, f: (p) => { reset(); leg(p, [34, 102, -6], [38, 56, -2], [38, 16, 0], 22, 21, 1); return getD(); } },
    { role: 'Body', pivot: [0, 96, 0], lo: [-114, 68, -92], hi: [114, 240, 92], h: 2.0, tris: 14000, f: (p) => { reset();
      U(smax(4, cyl(p, [0, 160, 0], 70, 74, 10), -100), BARK_A, 6);
      for (const s of [-1, 1]) U(smax(2, cyl(p, [s * 76, 214, 4], 30, 16, 6), -100), BARK_A, 8);   // shoulder stumps
      P(Math.abs(Math.sin(Math.atan2(p[2], p[0]) * 9)) - 0.12 + (p[1] > 226 ? 99 : 0), BARK_B, 0.1);
      P(Math.max(226 - p[1] + (Math.abs(len(p[0], 0, p[2]) % 14 - 7) < 1.5 ? -3 : 3), -1e9), mixP(C(0xc8a878), BARK_A, 0.3), 1);   // the rings on the cut top
      S(ell(p, [0, 170, 70], [26, 30, 20]), 5, DARK); P(sph(p, [0, 170, 58], 16), GLOW(1), 3); U(sph(p, [0, 170, 56], 12), GLOW(1), 3);   // the heart
      shelves(p, [-50, 200, -60], [-0.5, -0.9], 24, 2); shelves(p, [46, 180, -64], [0.5, -0.9], 22, 2);
      return getD(); } },
    { role: 'ArmBack', pivot: [-74, 190, 4], lo: [-144, -4, -48], hi: [-34, 230, 88], h: 1.7, f: (p) => { reset(); trunkArm(p, -1); return getD(); } },
    { role: 'ArmFront', pivot: [74, 190, 4], lo: [34, -4, -48], hi: [144, 230, 88], h: 1.7, f: (p) => { reset(); trunkArm(p, 1); return getD(); } },
    { role: 'Head', pivot: [0, 214, 10], lo: [-58, 194, -52], hi: [58, 292, 62], h: 1.2, tris: 8000, eyes: TT_FACE.eyes, teeth: TT_FACE.teeth, f: (p) => { reset();
      U(smax(3, cyl(p, [0, 242, 20], 32, 30, 8), -100), BARK_A, 6);
      TT_FACE.cut(p);
      shelves(p, [0, 272, 0], [0, -1], 34, 2); shelves(p, [-26, 266, 16], [-1, 0], 20, 2); shelves(p, [26, 266, 16], [1, 0], 20, 2);
      S(p[1] - 208, 2); return getD(); } },
  ],
};
function trunkArm(p, s) {
  const sh = [s * 80, 200, 4], el = [s * 98, 122, 18], wr = [s * 100, 50, 32];
  U(cap(p, sh, el, 24, 21), BARK_A, 10); U(cap(p, el, wr, 21, 20), BARK_A, 8); U(sph(p, el, 22), BARK_B, 6);
  U(ell(p, [wr[0], wr[1] - 20, wr[2] + 4], [25, 24, 22]), BARK_B, 8);
  for (const k of [-1, 0, 1]) U(sph(p, [wr[0] + k * 12, wr[1] - 38, wr[2] + 14], 9), BARK_B, 4);
  P(Math.abs(Math.sin(Math.atan2(p[2] - el[2], p[0] - el[0]) * 7)) - 0.12, BARK_B, 0.1);
}

// ---------------------------------------------------------------- THE LEVIATHAN (ward)
// What lives under everything, one head pushed up into the room: a vast ridged dome like a brain, a ring of scowling
// eyes round its brow, under it a huge round maw ringed in teeth, and round its base a fringe of thick root tentacles.
const LV_EYES = [-40, -20, 0, 20, 40].map((x, i) => E([x, 178 - Math.abs(x) * 0.3, 92 - Math.abs(x) * 0.5], i === 2 ? 9 : 7, x < 0 ? -1 : 1, [x / 60, 0.1, 1]));
const LV_TEETH = [...ringTeeth([0, 110, 104], 30, 14, 4.4, 0.45, -2), ...ringTeeth([0, 110, 104], 18, 10, 3.2, 0.4, -10)];
export const B_Leviathan = {
  lean: 0,
  height: 200,
  parts: [
    { role: 'Body', pivot: [0, 120, 0], lo: [-104, -8, -104], hi: [104, 240, 104], h: 1.8, tris: 16000, eyes: LV_EYES, f: (p) => { reset();
      U(ell(p, [0, 160, 0], [92, 74, 88]), CAP(1), 10);
      // the roots it stands on, thick as legs, and the floor broken round them (part of the body: they never swing)
      for (let i = 0; i < 8; i++) { const a = i * 0.785 + 0.4, x = Math.cos(a), z = Math.sin(a); chain(p, [[x * 50, 90, z * 50], [x * 74, 40, z * 74], [x * 84, 14, z * 84], [x * 90, 0, z * 90]], 14, 6, ROOT, 6); }
      U(ell(p, [0, 6, 0], [92, 10, 92]), ROOT_D, 10); S(p[1], 1);
      U(cap(p, [0, 80, 0], [0, 140, 10], 64, 70), FLESH(0.9), 14);
      { const a = Math.atan2(p[2], p[0]), r = Math.sin(a * 9 + p[1] * 0.04) * Math.sin(p[1] * 0.08 + a * 3); P(Math.abs(r) - 0.12 + (p[1] < 186 ? 99 : 0), mixP(CAP(0.7), DARK, 0.25), 0.05); }   // brain ridges on top
      U(cap(p, [-60, 196, 70], [60, 196, 70], 9), CAP(0.8), 8);
      for (const e of LV_EYES) socket(p, e);
      return getD(); } },
    { role: 'Head', pivot: [0, 100, 40], lo: [-54, 52, 16], hi: [54, 128, 114], h: 1.1, tris: 9000, teeth: LV_TEETH, f: (p) => { reset();
      U(cap(p, [0, 108, 40], [0, 110, 86], 40, 40), FLESH(0.9), 8);
      U(torus(rotXp(p, [0, 110, 96]), [0, 0, 0], 36, 7), FLESH(0.75), 4);
      S(cap(p, [0, 110, 116], [0, 110, 70], 27, 14), 4, MOUTH); P(sph(p, [0, 110, 66], 14), GLOW(1), 4);
      return getD(); } },
  ],
};

// ---------------------------------------------------------------- THE DEVOURER (devour)
// A mouth that learned to walk: a great round body that is almost all maw, the maw ringed with rows of teeth and lit
// deep inside, small mean eyes above it, carried low on six thick jointed root legs.
const DV_EYES = [-1, 1].map((s) => E([s * 26, 172, 92], 7.5, s, [s * 0.35, 0.65, 0.7]));
const DV_TEETH = [...ringTeeth([0, 110, 126], 50, 18, 5, 0.4, -4), ...ringTeeth([0, 110, 126], 34, 14, 4, 0.4, -14)];
export const B_Devourer = {
  height: 170,
  parts: [
    ...[[1, 30, 'LegFront'], [1, -6, 'LegBack'], [1, -40, 'LegFront'], [-1, 30, 'LegBack'], [-1, -6, 'LegFront'], [-1, -40, 'LegBack']].map(([s, z, role]) => ({ role, pivot: [s * 56, 64, z], lo: s > 0 ? [26, -4, z - 64] : [-166, -4, z - 64], hi: s > 0 ? [166, 130, z + 64] : [-26, 130, z + 64], h: 1.5, tris: 3000,
      f: (p) => { reset(); const hip = [s * 60, 70, z], knee = [s * 118, 112, z + (z > 10 ? 22 : z < -10 ? -22 : 0)], foot = [s * 148, 4, z + (z > 10 ? 40 : z < -10 ? -40 : 0)];
        U(cap(p, hip, knee, 13, 11), ROOT, 6); U(sph(p, knee, 12), ROOT_D, 4); U(cap(p, knee, foot, 11, 7), ROOT, 5); U(ell(p, [foot[0], 4, foot[2]], [11, 5, 13]), ROOT_D, 4); S(p[1], 1); return getD(); } })),
    { role: 'Body', pivot: [0, 70, 0], lo: [-104, 18, -114], hi: [104, 194, 114], h: 1.8, tris: 13000, f: (p) => { reset();
      U(ell(p, [0, 112, -6], [92, 78, 96]), CAP(1), 10);
      P(p[1] - 70, FLESH(0.85), 8);
      for (let i = 0; i < 7; i++) { const a = i * 2.4, x = Math.cos(a) * 50, z = -30 + Math.sin(a) * 40; U(cap(p, [x, 180, z], [x, 196, z], 5, 4), MYC, 2); U(smax(1.5, ell(p, [x, 198, z], [12, 7, 12]), 194 - p[1]), CAP(0.8), 2); }
      S(80 - p[2], 3); return getD(); } },   // the front is the maw (Head)
    { role: 'Head', pivot: [0, 100, 50], lo: [-84, 26, 26], hi: [84, 192, 136], h: 1.3, tris: 10000, teeth: DV_TEETH, eyes: DV_EYES, f: (p) => { reset();
      U(cap(p, [0, 110, 34], [0, 110, 104], 72, 64), CAP(1), 10);
      for (const e of DV_EYES) socket(p, e);
      U(torus(rotXp(p, [0, 110, 116]), [0, 0, 0], 56, 11), FLESH(0.75), 6);
      S(cap(p, [0, 110, 140], [0, 110, 80], 46, 20), 6, MOUTH); P(sph(p, [0, 110, 74], 22), GLOW(1), 6);
      S(p[2] - 36, 2); return getD(); } },   // reaching back into the body, so tipping it forward never opens a seam
  ],
};

// ---------------------------------------------------------------- THE NAMELESS (eclipse)
// Tall as the room allows: a figure cloaked from crown to floor in overlapping caps, no face but a deep hood with a slit
// of light, and eyes, many of them, open all over the cloak, every one a sharp lit eye.
const NM_EYES = (() => { const L = []; for (let i = 0; i < 14; i++) { const a = -0.9 + (i % 7) * 0.3 + (i > 6 ? 0.15 : 0), y = 70 + Math.floor(i / 7) * 60 + (i % 3) * 14, t = (232 - y) / 210, R = 34 + t * 64 + 4; L.push(E([Math.sin(a) * R, y, Math.cos(a) * R], 6 + (i % 3) * 2, Math.sin(a) < 0 ? -1 : 1, [Math.sin(a), 0, Math.cos(a)])); } return L; })();
export const B_Nameless = {
  lean: 0,
  height: 280,
  parts: [
    { role: 'Body', pivot: [0, 30, 0], lo: [-114, -4, -114], hi: [114, 240, 114], h: 1.8, tris: 16000, eyes: NM_EYES, f: (p) => { reset();
      const t = clamp((232 - p[1]) / 210, 0, 1), R = 34 + t * 64, a = Math.atan2(p[2], p[0]);
      U(smax(4, len(p[0], 0, p[2]) - R - Math.abs(Math.sin(a * 5)) * 4 * t, p[1] - 232, -p[1]), C(0x24202a), 6);
      for (let k = 0; k < 4; k++) { const y = 70 + k * 44; P(Math.abs(p[1] - y - Math.sin(a * 5) * 6) - 2.5, CAP(0.75), 1); }   // the overlapping caps' edges
      for (const e of NM_EYES) socket(p, e);
      S(cap(p, [0, -10, 0], [0, 50, 0], 80, 40), 6);
      return getD(); } },
    { role: 'ArmBack', pivot: [-40, 200, 4], lo: [-124, 36, -52], hi: [-18, 216, 92], h: 1.4, tris: 4000, f: (p) => { reset(); U(cap(p, [-40, 200, 4], [-80, 120, 40], 16, 22), C(0x24202a), 6); arm(p, [-80, 124, 40], [-88, 94, 54], [-90, 70, 62], 7, -1, C(0x24202a)); return getD(); } },
    { role: 'ArmFront', pivot: [40, 200, 4], lo: [18, 36, -52], hi: [124, 216, 92], h: 1.4, tris: 4000, f: (p) => { reset(); U(cap(p, [40, 200, 4], [80, 120, 40], 16, 22), C(0x24202a), 6); arm(p, [80, 124, 40], [88, 94, 54], [90, 70, 62], 7, 1, C(0x24202a)); return getD(); } },
    { role: 'Head', pivot: [0, 222, 6], lo: [-52, 198, -52], hi: [52, 302, 72], h: 1.2, tris: 7000, f: (p) => { reset();
      U(ell(p, [0, 250, 4], [38, 46, 38]), C(0x24202a), 8);
      U(cap(p, [0, 286, -6], [0, 300, -20], 10, 3), C(0x24202a), 6);                     // the hood's point
      S(ell(p, [0, 246, 38], [22, 30, 20]), 6, DARK);                                      // the hood's deep opening
      P(ell(p, [0, 248, 26], [14, 3, 6]), GLOW(1), 1);                                     // the slit of light where a face would be
      U(ell(p, [0, 248, 24], [12, 2.4, 3]), GLOW(1), 1);
      S(p[1] - 214, 2); return getD(); } },
  ],
};
