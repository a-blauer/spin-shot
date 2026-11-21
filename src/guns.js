// Every weapon is its own model. Guns are drawn as side profiles (x = forward, z = up, in view-model units,
// bore line near z = 7, pistol grip at the origin) and extruded to a width with chamfered edges, then dressed
// with turned parts (barrels, cylinders, drums, scopes). Flat colours, no textures: dark blued steel, worn
// walnut, brass, plus one accent per gun.
import * as THREE from 'three';
import { hex } from './render.js';
import { URot } from './mapkit.js';

const V = (x, y, z) => ({ X: x, Y: y, Z: z });
const R = (p, y, r) => new URot(p, y, r);
const C = (h) => hex(h);
const d2r = (d) => d * Math.PI / 180;

// How each gun handles. Class defaults, then per-gun overrides.
//   view model   pos / rise / side: kick back, muzzle climb, sideways jitter.  k, d: the recovery spring.  shake: camera shake.
//                weight: how heavy it feels (sway lag, bob, how fast it aims and draws).  hip: where it sits [fwd, right, up, pitch, yaw, roll].
//   action       what cycles after a shot: slide / recip (a handle that runs with the bolt) / revolver / pump / lever / bolt / pulse / none.
//                cycle: seconds it takes.  shell: the case it throws ('pistol', 'rifle', 'shot') and shellAt, the point in the cycle it leaves.
//   reload       mag / twin / revolver / break / shell / box / drumtop / muzzle / cell / charge / deck, with rp: the pose [pitch, yaw, roll] it is
//                held in, charge: what finishes it (slide, handle, bolt, slap), magDir: which way the magazine comes out.
//   camera       cam { up: degrees the aim climbs per shot, snap: the punch that springs back, side, pat: rand / zig / left / right / S,
//                taper: how fast the climb settles in a burst, fov: zoom punch }.
//   flash        muzzle flash size (0 = none) and flashTint.
const FEEL_CLASS = {
  Pistol: { pos: 1, rise: 1.3, side: 1, k: 330, d: 25, shake: 0, weight: 0.6, hip: [3, -1.5, 2, 0, -1, -4], action: 'slide', cycle: 0.09, lock: true, shell: 'pistol', reload: 'mag', rp: [16, -10, 34], charge: 'slide', cam: { up: 0.9, snap: 1, side: 0.25 }, flash: 0.9 },
  SMG: { pos: 0.65, rise: 0.55, side: 1.7, k: 400, d: 27, shake: 0, weight: 0.8, hip: [1, -0.5, 0.5, 0, -1, -5], action: 'recip', cycle: 0.07, shell: 'pistol', reload: 'mag', rp: [14, -8, 30], charge: 'handle', cam: { up: 0.3, snap: 0.4, side: 0.3, taper: 0.05 }, flash: 0.9 },
  Rifle: { pos: 0.9, rise: 0.8, side: 1, k: 300, d: 23, shake: 0.03, weight: 1, hip: [0, 0, 0, 0, -1.5, -6], action: 'recip', cycle: 0.08, shell: 'rifle', reload: 'mag', rp: [14, -8, 30], charge: 'handle', cam: { up: 0.4, snap: 0.45, side: 0.2, taper: 0.05 }, flash: 1 },
  Shotgun: { pos: 1.9, rise: 1.15, side: 0.8, k: 170, d: 16, shake: 0.28, weight: 1.15, hip: [0, 0, 0, 0, -1.5, -6], action: 'none', shell: 'shot', reload: 'shell', rp: [12, -12, 26], shells: 3, cam: { up: 1.8, snap: 2.1, side: 0.4, fov: 3 }, flash: 1.5 },
  LMG: { pos: 0.8, rise: 0.5, side: 1.9, k: 260, d: 20, shake: 0.06, weight: 1.7, hip: [-2, 0.5, -1.5, 0, -2, -7], action: 'recip', cycle: 0.07, shell: 'rifle', reload: 'box', rp: [4, -18, 34], charge: 'handle', cam: { up: 0.45, snap: 0.6, side: 0.3, taper: 0.12 }, flash: 1.2, draw: 'heavy' },
  Sniper: { pos: 2.6, rise: 0.85, side: 0.5, k: 120, d: 13, shake: 0.4, weight: 1.4, hip: [-1, 0, -0.5, 0, -1.5, -6], action: 'none', shell: 'rifle', reload: 'mag', rp: [14, -8, 30], charge: 'bolt', cam: { up: 2.4, snap: 2.9, side: 0.2, fov: 4 }, flash: 1.5 },
  Launcher: { pos: 2.5, rise: 1, side: 0.6, k: 110, d: 12, shake: 0.45, weight: 1.6, hip: [-2, 0, -2, 0, -2, -6], action: 'load', cycle: 0.55, shell: null, reload: 'muzzle', rp: [30, -16, 16], cam: { up: 1.5, snap: 1.8, side: 0.3, fov: 3.5 }, flash: 1.6, draw: 'heavy' },
  Energy: { pos: 0.3, rise: 0.22, side: 0.8, k: 300, d: 24, shake: 0, weight: 1, hip: [0, 0, 0, 0, -1.5, -6], action: 'pulse', shell: null, reload: 'cell', rp: [8, -16, 36], cam: { up: 0.35, snap: 0.5, side: 0.2 }, flash: 1 },
  Wonder: { pos: 1, rise: 1, side: 1, k: 220, d: 18, shake: 0.15, weight: 1.1, hip: [0, 0, 0, 0, -1.5, -6], action: 'none', shell: null, reload: 'cell', rp: [8, -16, 36], cam: { up: 0.5, snap: 0.5, side: 0.2 }, flash: 1 },
};
const FEEL_GUN = {
  // --- pistols
  'Tin Star': { action: 'revolver', cycle: 0.17, reload: 'revolver', rp: [24, -22, 62], shell: null, rise: 1.6, k: 380, d: 24, cam: { up: 0.7, snap: 1.4, side: 0.15 }, flash: 1 },
  'Saloon Six': { action: 'revolver', cycle: 0.3, reload: 'revolver', rp: [26, -24, 66], shell: null, weight: 0.85, pos: 1.7, rise: 2.4, k: 190, d: 16, shake: 0.22, cam: { up: 1.7, snap: 2.8, side: 0.3, fov: 3 }, flash: 1.6 },
  'Copperhead': { pos: 0.55, rise: 0.5, side: 2.2, k: 420, cycle: 0.05, weight: 0.7, cam: { up: 0.2, snap: 0.35, side: 0.36, pat: 'zig', taper: 0.04 }, flash: 0.7 },
  'Sidewinders': { twin: true, reload: 'twin', side: 1.5, rise: 1.1, cycle: 0.08, cam: { up: 0.4, snap: 0.7, side: 0.42, pat: 'zig' }, flash: 0.8 },
  // --- SMGs
  'Back-Alley': { side: 2.1, pos: 0.8, magDir: [0, -30, -8], rp: [6, -6, -34], cam: { up: 0.3, snap: 0.45, side: 0.46, pat: 'rand', taper: 0.03 }, rattle: 1 },
  "Hornet's Nest": { pos: 0.45, rise: 0.3, side: 2.4, k: 440, d: 28, cycle: 0.045, charge: 'slap', cam: { up: 0.13, snap: 0.2, side: 0.24, pat: 'rand', taper: 0.02 }, flash: 0.7, flashTint: [1, 0.9, 0.4] },
  'Rustler': { pos: 0.45, rise: 0.35, side: 0.7, cam: { up: 0.22, snap: 0.25, side: 0.09, pat: 'right', taper: 0.08 }, flash: 0.3 },
  // --- rifles
  'Quarter Horse': { action: 'lever', cycle: 0.17, shellAt: 0.42, reload: 'shell', rp: [12, -12, 30], shells: 3, charge: 'lever', pos: 1.3, rise: 1.5, k: 240, cam: { up: 1, snap: 1.7, side: 0.15, fov: 2 }, flash: 1.2 },
  'Lawman AR': { pos: 0.85, rise: 0.75, cam: { up: 0.4, snap: 0.45, side: 0.2, pat: 'S', taper: 0.07 } },
  'Long Rider': { pos: 1.5, rise: 1.4, k: 220, d: 18, shake: 0.12, weight: 1.25, cycle: 0.1, cam: { up: 0.75, snap: 1.2, side: 0.12, pat: 'rand', taper: 0.1, fov: 1.6 }, flash: 1.3 },
  'Gold Rush': { pos: 0.7, rise: 0.6, side: 0.8, k: 340, cam: { up: 0.3, snap: 0.4, side: 0.12, pat: 'left', taper: 0.08 }, flash: 1, flashTint: [1, 0.85, 0.4] },
  // --- shotguns
  Sawbuck: { reload: 'break', rp: [8, -16, 26], pos: 2.6, rise: 1.6, k: 140, d: 14, shake: 0.45, action: 'hammers', shell: null, weight: 1, cam: { up: 2.6, snap: 3.6, side: 0.5, pat: 'zig', fov: 4.5 }, flash: 2 },
  "Homesteader": { action: 'pump', cycle: 0.42, shellAt: 0.5, supOn: 'pump', charge: 'pump', cam: { up: 1.9, snap: 2.4, side: 0.35, fov: 3 } },
  'Stampede': { pos: 1.2, rise: 1, k: 240, d: 20, shake: 0.14, reload: 'mag', rp: [10, -10, 32], action: 'recip', cycle: 0.12, charge: 'slap', cam: { up: 1, snap: 1.4, side: 0.4, pat: 'zig', taper: 0.06, fov: 1.6 }, flash: 1.2 },
  "Dragon's Breath": { action: 'pump', cycle: 0.36, shellAt: 0.5, supOn: 'pump', charge: 'pump', pos: 2.1, shake: 0.35, cam: { up: 1.7, snap: 2.3, side: 0.4, fov: 3.4 }, flash: 2.2, flashTint: [1, 0.55, 0.15] },
  // --- LMGs
  'Iron Mule': { pos: 0.9, rise: 0.6, side: 1.7, shake: 0.08, cycle: 0.09, cam: { up: 0.6, snap: 0.75, side: 0.3, pat: 'S', taper: 0.3 }, flash: 1.3 },
  'Thresher': { pos: 0.35, rise: 0.15, side: 2.6, k: 300, shake: 0.07, weight: 2, action: 'crank', reload: 'drumtop', rp: [2, -20, 30], shell: 'rifle', spool: true, cam: { up: 0.05, snap: 0.2, side: 0.3, pat: 'rand' }, flash: 1.1 },
  // --- snipers
  Widowmaker: { action: 'bolt', cycle: 0.72, shellAt: 0.42, cam: { up: 2.3, snap: 3.2, side: 0.2, fov: 4 } },
  'Railroad Spike': { pos: 3.4, rise: 0.6, k: 85, d: 11, shake: 0.6, weight: 1.7, action: 'pulse', shell: null, reload: 'cell', rp: [10, -16, 36], chargeUp: 0.28, cam: { up: 0.8, snap: 4.6, side: 0.1, fov: 6 }, flash: 1.8, flashTint: [0.55, 0.85, 1] },
  // --- launchers
  'Dynamite Dan': { cycle: 0.42, hip: [-3, 1.5, -4.5, 0, -2, -6], pos: 1.6, rise: 1.2, k: 150, cam: { up: 1.6, snap: 2.1, side: 0.3, fov: 3 }, flash: 1.2 },
  Boomtown: { cycle: 0.7, hip: [-2, 2, -4.5, 0, -2, -6], pos: 2.2, rise: 0.8, k: 100, d: 11, weight: 1.9, cam: { up: 0.6, snap: 3, side: 0.2, fov: 4.5 }, flash: 2 },
  'Fireworks Finale': { cycle: 0.6, hip: [-2, 2, -4, 0, -2, -6], pos: 2.8, rise: 1.1, shake: 0.5, beats: 4, cam: { up: 1.2, snap: 2.2, side: 0.8, fov: 4 }, flash: 1.8, flashTint: [1, 0.7, 0.85] },
  // --- energy
  'Tesla Coil': { side: 2.2, pos: 0.4, cam: { up: 0.1, snap: 0.3, side: 0.5, pat: 'rand' }, flash: 0.9 },
  "Will-o'-Wisp": { pos: 0.6, rise: 0.5, k: 200, d: 15, cam: { up: 0.25, snap: 0.6, side: 0.1 }, flash: 1 },
  'Frostbite Beam': { pos: 0.12, rise: 0.08, side: 0.5, cam: { up: 0.01, snap: 0.02, side: 0.04, pat: 'S' }, flash: 0.6 },
  'Hellfire Hose': { pos: 0.2, rise: 0.1, side: 1.4, weight: 1.4, cam: { up: 0.03, snap: 0.04, side: 0.06, pat: 'rand' }, flash: 0 },
  // --- wonder weapons
  Buzzsaw: { action: 'saw', cycle: 0.3, pos: 4, rise: 2, side: 3, shake: 0.12, reload: 'mag', rp: [10, -12, 34], charge: 'rev', weight: 1.3, cam: { up: 0.4, snap: 0.9, side: 0.5, pat: 'zig' }, flash: 0 },
  'Thunderhead': { pos: 4, rise: 3.4, shake: 0.25, reload: 'charge', rp: [6, -22, 30], action: 'reels', cam: { up: 0.9, snap: 1.3, side: 0.25, fov: 2 }, flash: 1.4, flashTint: [1, 0.9, 0.45] },
  "Fan of Knives": { pos: 3, rise: 3.2, side: 1.6, reload: 'deck', rp: [16, -12, 24], cam: { up: 0.8, snap: 1.1, side: 0.3, pat: 'zig' }, flash: 0 },
  'Black Cat': { action: 'bolt', cycle: 0.66, shellAt: 0.42, shell: 'rifle', reload: 'mag', rp: [14, -8, 30], charge: 'bolt', weight: 1.3, pos: 9, rise: 5.5, k: 150, d: 15, shake: 0.3, cam: { up: 1.4, snap: 2, side: 0.12, fov: 3 }, flash: 0.25 },
};
export const gunFeel = (W) => {
  const f = Object.assign({ action: 'none', weight: 1, flash: 1 }, FEEL_CLASS[W.cls] || FEEL_CLASS.Rifle, FEEL_GUN[W.name] || {});
  f.cam = Object.assign({ up: 0.4, snap: 0.5, side: 0.2, pat: 'rand', taper: 0, fov: 0 }, (FEEL_CLASS[W.cls] || FEEL_CLASS.Rifle).cam, (FEEL_GUN[W.name] || {}).cam);
  if (f.cycle === undefined) f.cycle = 0.08;
  if (f.shellAt === undefined) f.shellAt = 0;
  return f;
};

// How shiny each finish is (0 matte .. 1 polished): drives the glint and rim in the view-model shader.
const METAL = { steel: 0.75, steelD: 0.6, steelL: 0.95, brass: 1, wood: 0.12, woodD: 0.12, woodL: 0.12, bone: 0.3, black: 0.35, red: 0.25, rubber: 0.05 };
const tagPal = (P) => { for (const k in P) { P[k].metal = METAL[k] === undefined ? 0.3 : METAL[k]; P[k].grain = k.startsWith('wood'); } return P; };
export const PAL = tagPal({
  steel: C(0x4a5063), steelD: C(0x2c303c), steelL: C(0x8d94a6), wood: C(0x7a4528), woodD: C(0x55301c), woodL: C(0xa0643a),
  brass: C(0xd9a03a), bone: C(0xe8dcc0), black: C(0x1d1c24), red: C(0xb0262c), rubber: C(0x2a2a30),
});

const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const arc = (cx, cz, r, a0, a1, n = 6, rz = r) => { const o = []; for (let i = 0; i <= n; i++) { const a = d2r(a0 + (a1 - a0) * i / n); o.push([cx + Math.cos(a) * r, cz + Math.sin(a) * rz]); } return o; };
const star = (cx, cz, r, n = 5, k = 0.45) => { const o = []; for (let i = 0; i < n * 2; i++) { const a = Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r * k : r; o.push([cx + Math.cos(a) * rr, cz + Math.sin(a) * rr]); } return o; };

// Vault tiers re-finish the whole gun: I gilded trim, II black lacquer and gold with energised parts,
// III obsidian and glowing gold. buildGun also bolts on tier hardware (brake, bayonet, crown, wings).
const TIER_PAL = [
  null,
  { steelL: 0xE2B23A, brass: 0xF2C43A, steel: 0x343848, wood: 0x6a3a22 },
  { steelL: 0xF2C43A, brass: 0xFFD24A, steel: 0x2a2436, steelD: 0x1a1622, wood: 0x241a20, woodD: 0x16101a, woodL: 0x3a2a30 },
  { steelL: 0xFFD860, brass: 0xFFE27A, steel: 0x15121c, steelD: 0x0c0a12, wood: 0x5a0f1c, woodD: 0x3a0a14, woodL: 0x7a1a28, black: 0x08070c, bone: 0xfff4d8 },
];
const TIER_GLOW = [0, 0xF2C43A, 0xFF4FD0, 0xFF4FD0];

export function buildGun(vm, W, tier, mastered = false) {
  const N = W.name;
  const BASE = PAL;
  // eslint-disable-next-line no-shadow
  const PAL_T = Object.assign({}, BASE);
  if (mastered && tier === 0) { PAL_T.steelL = C(0xE2B23A); PAL_T.brass = C(0xF2C43A); PAL_T.steelD = C(0x8a6a1e); }   // level 5 mastery: gold finish
  if (TIER_PAL[tier]) for (const k in TIER_PAL[tier]) PAL_T[k] = C(TIER_PAL[tier][k]);
  tagPal(PAL_T);
  return buildGunWith(vm, W, tier, PAL_T);
}

function buildGunWith(vm, W, tier, PAL) {
  const N = W.name;
  const Accent = tier >= 3 ? C(W.color).lerp(new THREE.Color(1, 1, 1), 0.25) : C(W.color);
  Accent.metal = ['Energy', 'Wonder'].includes(W.cls) ? 0.5 : 0.4;
  const Trim = tier > 0 ? C(0xF2C43A) : PAL.steelL;
  const TG = tier > 0 ? 0.6 + 0.25 * tier : 0;
  let cur = vm.gun, oy = 0, ox = 0, oz = 0, sfx = '';
  // --- kit: every helper takes gun coordinates (x forward, y right, z up); ox/oy/oz move them into the current group ---
  const E = (pts, w, col, o = {}) => { const m = vm.Ext(pts, w, col, Object.assign({ parent: cur }, o, { y: (o.y || 0) + oy })); m.position.y -= oz; m.position.z += ox; return m; };
  const Pt = (kind, x, y, z, sx, sy, sz, col, rot = null, glow = 0) => vm.Part(cur, kind, V(x - ox, y + oy, z - oz), V(sx, sy, sz), col, rot, glow);
  const B = (x, y, z, sx, sy, sz, col, rot = null, glow = 0) => Pt(0, x, y, z, sx, sy, sz, col, rot, glow);
  const T = (x0, x1, d, z, col, y = 0, glow = 0, sides = 1) => Pt(sides, (x0 + x1) / 2, y, z, d, d, Math.abs(x1 - x0), col, R(90, 0, 0), glow);
  const O = (x0, x1, d, z, col, y = 0) => T(x0, x1, d, z, col, y, 0, 7);                           // octagonal barrel
  const Ty = (x, z, d, w, col, y = 0, glow = 0) => Pt(1, x, y, z, d, d, w, col, R(0, 0, 90), glow);   // axle across the gun
  const Tz = (x, z0, z1, d, col, y = 0, glow = 0) => Pt(1, x, y, (z0 + z1) / 2, d, d, Math.abs(z1 - z0), col, null, glow);   // vertical post
  const Ball = (x, y, z, d, col, glow = 0) => Pt(2, x, y, z, d, d, d, col, null, glow);
  const Cone = (x, z, d, len, col, fwd = true, y = 0, glow = 0) => Pt(3, x, y, z, d, d, len, col, R(fwd ? -90 : 90, 0, 0), glow);
  const Ring = (x, z, d, t, col, glow = 0, y = 0) => Pt(8, x, y, z, t / 0.12, d, d, col, null, glow);  // hoop around the bore
  const mkGroup = (x, y, z) => { const g = new THREE.Group(); g.position.set(y + oy, z - oz, -(x - ox)); g.userData.rest = g.position.clone(); g.userData.piv = [x, y, z]; cur.add(g); vm.parts.push(g); return g; };
  const group = (x, y, z) => mkGroup(x, y, z);
  const into = (g, fn) => { const pc = cur, py = oy, px = ox, pz = oz; cur = g; oy = 0; ox = 0; oz = 0; fn(); cur = pc; oy = py; ox = px; oz = pz; };
  // A named moving part, pivoting at (px, py, pz). Inside fn the helpers still take gun coordinates.
  const part = (name, px, py, pz, fn) => { const g = mkGroup(px, py, pz); g.userData.piv = [px, py, pz]; vm.A[name + sfx] = g; const pc = cur, y0 = oy, x0 = ox, z0 = oz; cur = g; ox = px; oy = -py; oz = pz; fn(); cur = pc; oy = y0; ox = x0; oz = z0; return g; };
  // Add to a moving part after it has been built (gun coordinates, as everywhere).
  const on = (name, fn) => { const g = vm.A[name + sfx] || (name === 'pump' ? vm.PumpRoot : null); if (!g || !g.userData.piv) return; const pc = cur, y0 = oy, x0 = ox, z0 = oz; cur = g; ox = g.userData.piv[0]; oy = -g.userData.piv[1]; oz = g.userData.piv[2]; fn(); cur = pc; oy = y0; ox = x0; oz = z0; };
  // --- small parts: the screws, pins, vents, plates and bands that stop a gun looking like three boxes ----------------
  const dk = (c, k = 0.66) => { const d = c.clone().multiplyScalar(k); d.metal = c.metal; d.grain = c.grain; return d; };
  const lt = (c, k = 1.28) => { const d = c.clone().multiplyScalar(k); d.metal = c.metal; d.grain = c.grain; return d; };
  const both = (fn) => { fn(-1); fn(1); };
  const screw = (x, z, w, d = 1.1, col = PAL.steelL) => both((s) => { Ty(x, z, d, 0.3, col, s * (w / 2)); B(x, s * (w / 2 + 0.16), z, d * 0.75, 0.06, 0.16, PAL.black); });   // slotted head on each side
  const pinT = (x, z, w, d = 0.9, col = PAL.steelL) => Ty(x, z, d, w + 0.24, col);                                       // cross pin, showing both sides
  const slotsS = (x0, x1, z, w, n, h = 1.6, len = 0.8, col = PAL.black) => both((s) => { for (let i = 0; i < n; i++) B(x0 + (x1 - x0) * (i + 0.5) / n, s * (w / 2), z, len, 0.14, h, col); });   // vents cut in the sides
  const groove = (x0, x1, z, w, col = PAL.black, h = 0.3) => both((s) => B((x0 + x1) / 2, s * (w / 2), z, x1 - x0, 0.14, h, col));   // a line engraved along the side
  const plate = (pts, w, col, lift = 0.3, o = {}) => E(pts, w + lift * 2, col, Object.assign({ bevel: 0.14 }, o));        // raised panel on both sides
  const rail = (x0, x1, z, w = 2.4, col = PAL.steelD) => { E(rect(x0, z, x1, z + 0.6), w, col, { bevel: 0.1 }); const n = Math.max(1, Math.floor((x1 - x0) / 1.7)); for (let i = 0; i < n; i++) B(x0 + (x1 - x0) * (i + 0.5) / n, 0, z + 0.85, 0.85, w + 0.3, 0.5, col); };   // slotted accessory rail
  const crown = (x, z, d, col = PAL.steelL) => { T(x - 0.5, x + 0.1, d * 1.18, z, col); T(x, x + 0.25, d * 0.55, z, PAL.black); };   // muzzle crown and bore
  const swivel = (x, z, col = PAL.steelL) => { Tz(x, z - 1.2, z, 0.5, col); Ty(x, z - 1.7, 1.6, 0.4, col); };            // sling stud and loop
  const rivets = (x0, x1, z, w, n, d = 0.8, col = PAL.steelL) => both((s) => { for (let i = 0; i < n; i++) Ball(x0 + (x1 - x0) * (i + 0.5) / Math.max(1, n), s * (w / 2), z, d, col); });
  const hose = (pts, d, col) => { for (let i = 0; i + 1 < pts.length; i++) vm.Cap(cur, V(pts[i][0] - ox, pts[i][1] + oy, pts[i][2] - oz), V(pts[i + 1][0] - ox, pts[i + 1][1] + oy, pts[i + 1][2] - oz), d / 2, col); };   // a pipe or cable through the given points
  // --- shared furniture ---------------------------------------------------------------------------------------
  const grip = (x, z, col, len = 12, rake = 16, th = 5.6, w = 4.2) => {
    const dx = Math.tan(d2r(rake)) * len;
    E([[x + th / 2, z], [x - th / 2, z], [x - th / 2 - dx, z - len + 1.2], [x - th / 2 - dx + 1, z - len], [x + th / 2 - dx - 0.6, z - len], [x + th / 2 - dx, z - len + 1]], w, col, { bevel: 0.9 });
    const g = dk(col, 0.7);
    for (let i = 0; i < 4; i++) { const t = 0.28 + i * 0.15; both((s) => B(x - dx * t, s * (w / 2 - 0.02), z - len * t, th * 0.62, 0.12, 0.34, g)); }   // finger grooves
    E([[x + th / 2 - dx - 0.4, z - len + 0.5], [x - th / 2 - dx + 0.6, z - len + 0.5], [x - th / 2 - dx + 0.8, z - len - 0.3], [x + th / 2 - dx - 0.7, z - len - 0.3]], w + 0.3, g, { bevel: 0.15 });   // butt cap
  };
  const guard = (x, z, col = PAL.steelD, len = 7.5, h = 5) => {
    const o = [[x, z], [x + len, z], [x + len, z - h + 1.6], [x + len - 1.6, z - h], [x + 1.2, z - h], [x, z - h + 1.2]];
    const i = [[x + 0.9, z + 0.2], [x + len - 0.9, z + 0.2], [x + len - 0.9, z - h + 1.9], [x + len - 1.9, z - h + 0.9], [x + 1.5, z - h + 0.9], [x + 0.9, z - h + 1.5]];
    E(o, 1.3, col, { holes: [i], bevel: 0.15 });
    E([[x + 2.6, z], [x + 3.8, z], [x + 3.4, z - 3.2], [x + 2.5, z - 2.9]], 0.9, PAL.steelL, { bevel: 0.1 });
  };
  const stock = (x, zTop, col, len = 22, drop = 4, butt = 9.5, w = 4.6, wrist = 5.4) => {
    E([[x, zTop], [x, zTop - wrist], [x - len * 0.42, zTop - wrist - 1 - drop * 0.6], [x - len, zTop - drop - butt], [x - len - 1.2, zTop - drop - butt + 0.6], [x - len - 1.2, zTop - drop - 0.6], [x - len, zTop - drop], [x - len * 0.38, zTop - 0.8]], w, col, { bevel: 1 });
    E(rect(x - len - 2.2, zTop - drop - butt + 0.4, x - len - 0.8, zTop - drop - 0.2), w + 0.2, PAL.rubber, { bevel: 0.3 });
    E(rect(x - len - 0.9, zTop - drop - butt + 0.2, x - len - 0.5, zTop - drop), w + 0.3, PAL.steelD, { bevel: 0.05 });                       // spacer between wood and pad
    for (const f of [0.22, 0.78]) T(x - len - 2.4, x - len - 2.1, 0.9, zTop - drop - butt * f, PAL.steelL);                                   // butt-plate screws
    swivel(x - len * 0.72, zTop - drop * 0.7 - butt * 0.8);
    E([[x - 1, zTop - 1.6], [x - len * 0.36, zTop - 2.2], [x - len * 0.36, zTop - 2.6], [x - 1, zTop - 2]], w + 0.14, dk(col, 0.72), { bevel: 0.04 });   // a line cut along the comb
    E([[x + 0.3, zTop + 0.1], [x + 0.3, zTop - wrist - 0.1], [x - 0.7, zTop - wrist - 0.1], [x - 0.7, zTop + 0.1]], w + 0.5, PAL.steelD, { bevel: 0.15 });   // steel collar where it meets the receiver
  };
  const wireStock = (x, z, col = PAL.steelD, len = 18, h = 8) => {
    E([[x, z + 1], [x, z - 1], [x - len, z - 1], [x - len, z - h], [x - len - 1.8, z - h], [x - len - 1.8, z + 2.4], [x - len, z + 2.4], [x - len, z + 1]], 1.6, col, { bevel: 0.3 });
  };
  const post = (x, z, h = 2, col = Trim) => E([[x - 0.7, z], [x + 0.7, z], [x + 0.35, z + h], [x - 0.35, z + h]], 0.9, col, { bevel: 0.1, glow: TG });
  const notch = (x, z, w = 3.6, col = PAL.steelD) => { B(x, -w / 2 + 0.5, z + 0.45, 1, 0.8, 0.9, col); B(x, w / 2 - 0.5, z + 0.45, 1, 0.8, 0.9, col); };
  const scope = (x0, x1, z, d, col = PAL.steelD, lens = C(0x6ad0ff)) => {
    T(x0, x1, d, z, col); T(x0 - 1.5, x0 + 2.5, d * 1.3, z, col); T(x1 - 4, x1 + 1, d * 1.42, z, col);
    T(x0 - 1.7, x0 - 1.4, d * 1.05, z, C(0x1c2a38)); T(x1 + 0.9, x1 + 1.2, d * 1.15, z, lens, 0, 0.6);
    const m = (x0 + x1) / 2; Tz(m, z + d * 0.4, z + d * 0.95, d * 0.5, PAL.steelL); Ty(m + 0.5, z, d * 0.5, d * 1.5, PAL.steelL);
    Tz(m, z + d * 0.95, z + d * 1.08, d * 0.62, PAL.steelD); Ring(x0 + 0.4, z, d * 1.34, 0.3, PAL.steelL); Ring(x1 - 1.4, z, d * 1.46, 0.3, PAL.steelL); Ring(m - d, z, d * 1.06, 0.3, PAL.steelL); Ring(m + d + 0.5, z, d * 1.06, 0.3, PAL.steelL);   // turret cap, bell and tube rings
    for (const x of [x0 + (x1 - x0) * 0.28, x0 + (x1 - x0) * 0.72]) both((s) => Ty(x, z - d * 0.5 - 1.6, 0.7, 0.3, PAL.steelL, s * 1.25));   // ring screws
    for (const x of [x0 + (x1 - x0) * 0.28, x0 + (x1 - x0) * 0.72]) E([[x - 1.2, z - d * 0.2], [x + 1.2, z - d * 0.2], [x + 1.5, z - d * 0.5 - 2.6], [x - 1.5, z - d * 0.5 - 2.6]], 2.4, PAL.steelD, { bevel: 0.2 });
  };
  const banana = (x, z, len, w, col = PAL.steelD, curve = 14, th = 4.6) => {
    const n = 5, f = [], b = [];
    for (let i = 0; i <= n; i++) { const t = i / n, a = d2r(-90 + curve * t - 6); const px = x + Math.cos(a) * len * t + t * t * curve * 0.12, pz = z + Math.sin(a) * len * t; f.push([px + th / 2, pz]); b.unshift([px - th / 2, pz]); }
    E(f.concat(b), w, col, { bevel: 0.35 });
    for (const t of [0.3, 0.55, 0.8]) { const a = d2r(-90 + curve * t - 6), px = x + Math.cos(a) * len * t + t * t * curve * 0.12, pz = z + Math.sin(a) * len * t; both((s) => B(px, s * (w / 2), pz, th * 0.8, 0.14, 0.4, dk(col, 0.6))); }   // stamped ribs
  };
  const flutes = (x0, x1, z, d, n, col) => { for (let i = 0; i < n; i++) { const a = d2r(i * 360 / n + 30); T(x0, x1, d * 0.3, z + Math.sin(a) * d * 0.43, col, Math.cos(a) * d * 0.43); } };
  const fins = (x0, x1, z, d, n, col) => { for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * (i + 0.5) / n; T(x - 0.5, x + 0.5, d, z, col); } };

  let Sight = 10, Muzzle = V(30, 0, 7), Eject = V(4, 3, 7), Support = V(16, 0, 1);
  let twoHandPistol = false;

  // --- revolver / pistol bodies (reused for twin pistols and distinct per gun through their parameters) ---------------
  const revolver = (o) => {
    const { bl, bd, cd, gripCol, frame, oct } = o;
    E([[-6, 3.2], [-6.5, 8.6], [-3, 9.6], [9, 9.6], [9, 4.6], [6.5, 2.6], [1, 2.4]], 3.2, frame, { bevel: 0.5, holes: [rect(0.6, 4.2 - cd * 0.08, 7.4, 9.0)] });
    E([[-0.4, 3.6], [0.5, 3.6], [0.5, 8.9], [-0.4, 8.9]], Math.min(cd * 0.8, 5.8), frame, { bevel: 0.6 });   // recoil shield behind the cylinder
    vm.CylPart = part('cyl', 4, 0, 6.6, () => {
      T(0.7, 7.3, cd, 6.6, PAL.steelL); T(0.5, 0.75, cd * 0.92, 6.6, PAL.steel);
      for (let i = 0; i < 6; i++) { const a = d2r(i * 60), c = Math.cos(a) * cd, s = Math.sin(a) * cd;
        T(2.4, 7.4, cd * 0.2, 6.6 + s * 0.44, PAL.steel, c * 0.44);                                  // flutes
        T(0.42, 0.6, cd * 0.2, 6.6 + Math.sin(a + 0.52) * cd * 0.31, PAL.black, Math.cos(a + 0.52) * cd * 0.31);    // empty chambers
      }
      part('rims', 4, 0, 6.6, () => { for (let i = 0; i < 6; i++) { const a = d2r(i * 60) + 0.52; T(0.3, 0.66, cd * 0.24, 6.6 + Math.sin(a) * cd * 0.31, PAL.brass, Math.cos(a) * cd * 0.31); } });   // cartridge rims, seen from behind
    });
    vm.SpinPart = null;
    (oct ? O : T)(9, 9 + bl, bd, 7.4, frame);
    T(9 + bl - 0.3, 9 + bl + 0.25, bd * 0.6, 7.4, PAL.black);                                   // bore
    E(rect(9, 8.6, 9 + bl - 1, 9.5), 1.2, PAL.steelD, { bevel: 0.15 });                         // top rib
    T(9, 9 + bl * 0.6, 1.3, 4.9, PAL.steelL);                                                  // ejector rod
    E([[9, 4.4], [9, 6], [12, 6], [13, 4.4]], 1.6, frame, { bevel: 0.2 });
    post(9 + bl - 1.6, 9.5, 1.8, PAL.brass);
    part('hammer', -5.4, 0, 8.2, () => { E([[-5.8, 7.8], [-7.6, 9.8], [-7.4, 10.8], [-6.4, 10.7], [-4.6, 9.2]], 0.9, PAL.steelD, { bevel: 0.2 }); B(-7.3, 0, 10.6, 1, 1.7, 0.4, PAL.steel); });   // spur hammer
    notch(-3.4, 9.4, 3.2);
    grip(-2.6, 3.4, gripCol, 12.5, o.rake || 22, 6, 4.4);
    for (const s of [-1, 1]) Ty(-4.4, -2.2, 1.5, 0.3, PAL.brass, s * 2.3);                      // grip screws
    guard(1.2, 2.8, o.guardCol || PAL.steelD, 7, 4.6);
    vm.MagRoot = part('mag', 4, 0, 6.6, () => {   // speedloader: a knob and a disc holding six rounds
      T(-1.4, 0.2, cd * 0.62, 6.6, PAL.steelD); T(-2.2, -1.4, cd * 0.3, 6.6, PAL.steelL);
      part('loaderRounds', 4, 0, 6.6, () => { for (let i = 0; i < 6; i++) { const a = d2r(i * 60) + 0.52; T(0.2, 3.6, cd * 0.2, 6.6 + Math.sin(a) * cd * 0.31, PAL.brass, Math.cos(a) * cd * 0.31); } });
    });
    // -- detail: side plate and screws, bolt notches, backstrap, butt cap and lanyard ring, ejector housing, sight ramp
    plate([[-4.4, 4.2], [-4.6, 8], [-1.6, 8.7], [0, 8.7], [0, 4.4], [-1.2, 3.4]], 3.2, dk(frame, 0.84), 0.22);
    screw(-3.3, 5.2, 3.7, 0.95); screw(-1.1, 7.7, 3.7, 0.8); screw(7.8, 3.7, 3.3, 0.8);
    on('cyl', () => { for (let i = 0; i < 6; i++) { const a = d2r(i * 60 + 30); B(1.7, Math.cos(a) * cd * 0.49, 6.6 + Math.sin(a) * cd * 0.49, 1, 0.5, 0.5, PAL.steelD, R(0, 0, i * 60 + 30 - 90)); } Ring(7.1, 6.6, cd * 1.01, 0.25, PAL.steelD); });
    E([[-5.9, 3.4], [-5.2, 3.4], [-5.2 - Math.tan(d2r(o.rake || 22)) * 11.2, -7.8], [-5.9 - Math.tan(d2r(o.rake || 22)) * 11.2, -7.8]], 2.2, frame, { bevel: 0.12 });   // backstrap
    Ty(-2.6 - Math.tan(d2r(o.rake || 22)) * 12.5, -10.2, 1.7, 0.45, PAL.steelL);                                                  // lanyard ring
    E([[9, 3.9], [9 + bl * 0.62, 3.9], [9 + bl * 0.62 + 0.8, 4.9], [9 + bl * 0.62, 5.9], [9, 5.9]], 2, frame, { bevel: 0.3 }); Ball(9 + bl * 0.62 + 0.6, 0, 4.9, 1.5, PAL.steelL);   // ejector housing and rod head
    E([[9 + bl - 4.4, 9.4], [9 + bl - 0.6, 9.4], [9 + bl - 0.9, 10], [9 + bl - 3.2, 10]], 1.3, PAL.steelD, { bevel: 0.1 });       // sight ramp
    groove(10.5, 9 + bl - 5, 7.4, bd + 0.02, PAL.steelD, 0.22);                                                                // maker's line down the barrel
    crown(9 + bl + 0.1, 7.4, bd * 0.92, frame);
    E([[-0.2, 9.5], [8.4, 9.5], [8, 10], [0.2, 10]], 1.5, dk(frame, 0.8), { bevel: 0.1 });                                        // sighting groove along the top strap
    Muzzle = V(9 + bl + 0.5, 0, 7.4); Sight = 11; Eject = V(4, 3, 7);
  };
  const autoPistol = (o) => {
    const { len, slide, frame, gripCol } = o;
    T(1, len + 0.9, 2.2, 7.6, PAL.steelL); T(len + 0.7, len + 1, 1.3, 7.6, PAL.black);                    // barrel: bright where the slide uncovers it
    part('slide', 0, 0, 7.4, () => {
      E([[-5, 5.4], [-5, 9.2], [-3.6, 9.8], [len - 1, 9.8], [len, 9], [len, 5.4]], 3.6, slide, { bevel: 0.55, holes: [rect(2, 8.3, 7, 9.5)] });
      for (let i = 0; i < 5; i++) B(-3.8 + i * 0.9, 0, 7.6, 0.35, 3.8, 3, PAL.steelD);                     // serrations
      B(4.5, 1.75, 8, 5, 0.25, 1.8, PAL.black);                                                           // ejection port
      post(len - 1.6, 9.8, 1.5); notch(-3.8, 9.7, 3.4);
      for (const s of [-1, 1]) Ball(-3.8, s * 1.2, 10.3, 0.7, C(0xfff2c0), 1.6);                            // night-sight dots
    });
    part('hammer', -4.6, 0, 8, () => E([[-4.8, 7.4], [-6.6, 8.8], [-6.2, 9.8], [-4.6, 9]], 1, PAL.steelD, { bevel: 0.2 }));
    E([[-4.6, 3], [-4.6, 5.4], [len - 0.6, 5.4], [len - 0.6, 3.8], [8, 3.2], [7, 2]], 3.2, frame, { bevel: 0.4 });
    B(3, 1.75, 4.6, 3.2, 0.3, 0.7, PAL.steelL); Ball(0.4, 1.8, 3.6, 1, PAL.steelL);                         // slide stop, mag release
    grip(-1.4, 3.2, gripCol, 12, 14, 5.8, 4);
    guard(1.6, 3, frame, 6.6, 4.4);
    // -- detail: front serrations, a lightening cut, extractor, safety, takedown lever, beavertail, rail, grip screws
    on('slide', () => {
      for (let i = 0; i < 3; i++) B(len - 4.4 + i * 0.9, 0, 7.6, 0.35, 3.8, 2.6, PAL.steelD);
      groove(-2.6, len - 5.4, 6.1, 3.62, dk(slide, 0.6), 0.26);
      B(2.2, 1.82, 9.1, 2.2, 0.14, 0.4, PAL.steelL);
      E([[len - 3.4, 9.8], [len - 0.6, 9.8], [len - 0.9, 10.2], [len - 2.6, 10.2]], 1.2, PAL.steelD, { bevel: 0.08 });
    });
    both((s) => { B(-3.5, s * 1.72, 5.3, 2.4, 0.3, 0.8, PAL.steelL); Ball(-2.5, s * 1.9, 5.3, 0.8, PAL.steelL); });           // ambi safety
    Ty(6.2, 4.7, 1, 3.5, PAL.steelL); B(7.4, 1.7, 4.7, 1.6, 0.22, 0.5, PAL.steelL);                                              // takedown pin and lever
    E([[-4.6, 5.4], [-6.6, 5.9], [-6.8, 5.1], [-4.6, 3.6]], 2.6, frame, { bevel: 0.3 });                                         // beavertail
    for (let i = 0; i < 3; i++) B(len - 3.6 + i * 1.1, 0, 3.6, 0.6, 3.3, 0.5, dk(frame, 0.7));                                  // light rail
    screw(-2.2, 0.4, 4.1, 0.8); screw(-3.9, -5.6, 4.1, 0.8);
    plate([[-0.2, 2.2], [-3.8, 2.2], [-6.2, -7], [-2.8, -7]], 4, dk(gripCol, 0.84), 0.16);                                       // grip panel
    Muzzle = V(len + 1, 0, 7.6); Sight = 11; Eject = V(4, 3, 8.5);
  };
  const pistolMag = (len = 4, col = PAL.steelD) => { vm.MagRoot = part('mag', -2.4, 0, -6.4, () => { E([[-0.8, -5.4], [-5, -5.4], [-5.8, -6.4 - len + 1.5], [-1.4, -6.4 - len + 1.5]], 3, col, { bevel: 0.3 }); E([[-0.4, 1.6], [-3.4, 1.6], [-4.6, -5.4], [-1, -5.4]], 2.6, col, { bevel: 0.2 }); B(-1.6, 0, 1.9, 1.6, 1.2, 0.7, PAL.brass); }); };

  switch (N) {
    // ============================================================ PISTOLS
    case 'Tin Star': {
      revolver({ bl: 13, bd: 3, cd: 7, gripCol: PAL.wood, frame: PAL.steelL, oct: true });
      for (const s of [-1, 1]) E(star(-5.6, -3.2, 1.9), 0.4, PAL.brass, { y: s * 2.3, bevel: 0.05 });
      Support = V(-1, -4.5, -4); twoHandPistol = true;
      break;
    }
    case 'Saloon Six': {
      revolver({ bl: 22, bd: 3.6, cd: 8.6, gripCol: PAL.woodD, frame: PAL.steel, guardCol: PAL.brass, rake: 30 });
      E(rect(9, 3.6, 24, 5.6), 2.2, PAL.steel, { bevel: 0.4 });                                 // heavy under-lug
      B(18, 0, 9.8, 12, 1.6, 0.5, Accent);
      for (let i = 0; i < 3; i++) B(12 + i * 3.4, 0, 9.9, 1.8, 1, 0.5, PAL.black);                    // vented rib
      Support = V(-1, -4.5, -4); twoHandPistol = true;
      break;
    }
    case 'Copperhead': {
      autoPistol({ len: 15, slide: PAL.steelD, frame: Accent, gripCol: PAL.black });
      T(15, 21, 3.4, 7.6, PAL.steelD); for (let i = 0; i < 3; i++) for (const a of [0, 90, 180, 270]) Ball(16.4 + i * 1.7, Math.cos(d2r(a)) * 1.6, 7.6 + Math.sin(d2r(a)) * 1.6, 0.9, PAL.black);
      E([[9, 3.2], [12, 3.2], [11.4, -3.6], [9.4, -3.6]], 2.6, PAL.black, { bevel: 0.6 });         // fore grip
      wireStock(-5, 7.5, PAL.steelD, 13, 7);
      vm.MagRoot = part('mag', -2.4, 0, -6.4, () => { E([[-0.4, 1.6], [-3.4, 1.6], [-7.6, -17.4], [-3.2, -17.4]], 3, PAL.steelD, { bevel: 0.3 }); for (let i = 0; i < 4; i++) B(-4.6 - i * 0.55, 1.55, -8 - i * 2.4, 1.6, 0.2, 1.2, C(0xC8743A), null, 0.4); });   // long stick, copper rounds showing through the witness holes
      Muzzle = V(21.5, 0, 7.6); Support = V(10.4, 0, -1);
      break;
    }
    case 'Sidewinders': {
      const one = () => {
        autoPistol({ len: 16, slide: PAL.steelL, frame: PAL.steel, gripCol: Accent });
        for (const s of [-1, 1]) { Ball(-2.6, s * 2.1, 0, 0.9, PAL.bone); Ball(-4.2, s * 2.1, -5.4, 0.9, PAL.bone); }
      };
      one(); pistolMag(4); const m1 = vm.MagRoot;
      const g2 = group(2, -15, 0); sfx = '2'; into(g2, () => { one(); pistolMag(4); }); sfx = ''; vm.MagRoot = m1;
      vm.A.twin = g2;
      Support = V(1, -15, -4);
      break;
    }
    // ============================================================ SMGs
    case 'Back-Alley': {
      T(-8, 22, 5.4, 7, PAL.steel);                                                             // tube receiver
      T(22, 33, 4.4, 7, PAL.steelD); for (let i = 0; i < 4; i++) for (const a of [45, 135, 225, 315]) Ball(24 + i * 2.4, Math.cos(d2r(a)) * 2.1, 7 + Math.sin(d2r(a)) * 2.1, 1.1, PAL.black);
      T(33, 36, 2.4, 7, PAL.steelD);
      B(6, -2.6, 7.6, 9, 0.5, 1.6, PAL.black); part('charge', 9, -3.2, 7.6, () => { Ball(9, -3.9, 7.6, 2, PAL.steelL); B(9, -3, 7.6, 1, 1.4, 1, PAL.steelL); });   // bolt slot + handle (open bolt: it runs with every shot)
      for (let i = 0; i < 3; i++) Ring(-5 + i * 3, 7, 5.9, 0.5, PAL.steelD);                       // weld seams on the tube
      E([[-3, 1.6], [-3, 4.6], [8, 4.6], [8, 3], [5, 1.6]], 3, PAL.steel, { bevel: 0.4 });
      grip(-0.6, 2, Accent, 11, 12, 5, 3.6); guard(1.4, 2, PAL.steelD, 6, 4);
      wireStock(-8, 7, PAL.steelD, 16, 9);
      vm.MagRoot = group(14, -2.4, 7); into(vm.MagRoot, () => { B(0, -7, 0, 4, 13, 2.4, PAL.steelD); B(0, -1.6, 0, 5, 3, 3.4, PAL.steel); });   // side magazine
      post(31, 9.2, 2); notch(-6, 9.4, 3);
      Muzzle = V(36.5, 0, 7); Support = V(15, -6, 5); Sight = 11.6;
      break;
    }
    case "Hornet's Nest": {
      E([[-7, 3.4], [-7, 10], [16, 10], [16, 3.4]], 4.6, PAL.steel, { bevel: 0.6 });               // receiver
      T(16, 30, 3, 7.2, PAL.steelD); fins(17, 26, 7.2, 4.8, 7, PAL.steel);
      T(30, 34, 4.4, 7.2, PAL.steelD); B(32, 0, 9.6, 3, 0.8, 0.8, PAL.black);                      // compensator
      for (let i = 0; i < 4; i++) B(-4 + i * 5, 0, 10.2, 2.4, 4.8, 0.5, i % 2 ? PAL.black : Accent, null, i % 2 ? 0 : 0.25);   // hornet stripes
      part('charge', 4, -2.6, 8.6, () => { Ball(4, -3.4, 8.6, 2, PAL.steelL); B(4, -2.6, 8.6, 1, 1.4, 1, PAL.steelL); }); B(4, -2.35, 8.6, 8, 0.3, 1.4, PAL.black);
      stock(-7, 9.4, PAL.wood, 20, 5, 9, 4.2);
      grip(-2, 3.6, PAL.wood, 11, 16, 5.4, 4); guard(0.6, 3.4, PAL.steelD, 6.6, 4.4);
      E([[20, 4.6], [24, 4.6], [23.4, -4], [20.6, -4]], 3.4, PAL.wood, { bevel: 0.9 });            // vertical fore grip
      vm.MagRoot = group(11, 0, 3); into(vm.MagRoot, () => { Ty(0, -5.4, 13, 4.2, PAL.steelD); Ty(0, -5.4, 5, 4.6, Accent, 0, 0.3); Ty(0, -5.4, 14, 1, PAL.steel); });   // drum
      post(29, 8.8, 2.2); notch(-5, 10, 3.6);
      Muzzle = V(34.5, 0, 7.2); Support = V(22, 0, -1); Sight = 12.2;
      break;
    }
    case 'Rustler': {
      E([[-6, 3.6], [-6, 9.4], [-3, 10.4], [14, 10.4], [18, 8.6], [18, 3.6]], 4.2, Accent, { bevel: 0.6 });
      E(rect(-4, 10.4, 12, 11.2), 2, PAL.steelD, { bevel: 0.2 });
      part('charge', 3, -2.2, 8.8, () => { B(3, -2.5, 8.8, 2.6, 1, 1.1, PAL.steelL); }); B(5, -2.15, 8.8, 7, 0.25, 1.3, PAL.black);
      T(18, 20, 3, 7, PAL.steelD); T(20, 36, 4.6, 7, PAL.black); T(35.6, 36.2, 3, 7, PAL.steelD);   // suppressor
      for (const s of [-1, 1]) { E([[2.6, 5.4], [7.4, 7.6], [5.8, 5.4], [7.4, 3.4]], 0.3, PAL.bone, { y: s * 2.2, bevel: 0.04, glow: 0.3 }); }
      E([[18, 3.2], [18, 5.4], [8, 5.4], [8, 3.2]], 4.8, PAL.black, { bevel: 0.8 });                // handguard
      grip(-1.6, 3.8, PAL.black, 11, 14, 5.2, 3.8); guard(1, 3.6, PAL.steelD, 6, 4.2);
      wireStock(-6, 8, PAL.steelD, 15, 8);
      vm.MagRoot = group(8.4, 0, 3.4); into(vm.MagRoot, () => banana(0, 0, 13, 2.8, PAL.steelD, 22, 4));
      Ring(13, 11.6, 3.4, 0.5, PAL.steelD); post(13, 10.4, 1.6, Trim); notch(-4, 11.2, 3.4);
      Muzzle = V(36.6, 0, 7); Support = V(14, 0, 1); Sight = 12.6;
      break;
    }
    // ============================================================ RIFLES
    case 'Quarter Horse': {
      E([[-7, 4], [-7, 9.6], [-4, 10.2], [10, 10.2], [10, 4]], 3.8, PAL.steel, { bevel: 0.5 });      // receiver
      stock(-7, 9.6, PAL.wood, 24, 5, 10, 4.4, 5.6);
      E([[10, 3.8], [10, 6.2], [28, 6.2], [28, 4.4]], 4.4, PAL.wood, { bevel: 1 });                  // forend
      O(10, 48, 2.8, 8, PAL.steelD); T(10, 44, 2.2, 5.2, PAL.steel); Ring(28.5, 6.8, 5.6, 0.9, PAL.brass); Ring(43, 6.8, 5.4, 0.8, PAL.steelD);
      part('lever', 5, 0, 3.6, () => E([[-3, 4], [5, 4], [5, 3], [1, 2.8], [-1, -1.4], [-6.4, -3.6], [-9.4, -1], [-6, 2.6], [-4, 2.6]], 1.6, PAL.steelL, { bevel: 0.25, holes: [[[-5.6, 1.6], [-2, 1.6], [-2.4, -1], [-6.2, -2.4], [-8, -0.9]]] }));   // lever loop
      part('hammer', -6.6, 0, 9.6, () => E([[-7.2, 9.6], [-8.8, 11.2], [-8.3, 11.9], [-7.3, 11.6], [-5.8, 10.3]], 1, PAL.steelD, { bevel: 0.2 }));
      for (const s of [-1, 1]) { Ty(-1, 7, 1.6, 0.3, PAL.brass, s * 1.95); Ty(6, 6, 1.2, 0.3, PAL.brass, s * 1.95); }   // receiver screws
      E(rect(13, 4.1, 26, 4.5), 4.7, PAL.woodD, { bevel: 0.1 });
      B(2, 2.1, 8.4, 5, 0.3, 1.8, PAL.black);
      post(46.4, 9.4, 2); notch(8, 10, 3.2);
      vm.MagRoot = group(3, 0, 7.4); into(vm.MagRoot, () => { T(-2, 2, 1.5, 0, PAL.brass); Cone(2.8, 0, 1.5, 1.8, PAL.steelL); });
      Muzzle = V(48.6, 0, 8); Support = V(22, 0, 2); Sight = 12;
      break;
    }
    case 'Lawman AR': {
      E([[-7, 4], [-7, 10], [14, 10], [14, 5], [10, 4]], 4.2, PAL.steel, { bevel: 0.5 });            // stamped receiver
      E([[-4, 10], [12, 10], [11, 11], [-3, 11]], 3, PAL.steelD, { bevel: 0.3 });                    // top cover
      stock(-7, 9.4, Accent, 21, 4, 9.6, 4.2);
      E([[14, 4.6], [14, 9.4], [30, 9], [30, 5]], 4.6, Accent, { bevel: 0.9 });                      // handguard
      for (let i = 0; i < 4; i++) B(17 + i * 3.4, 0, 7.2, 1.6, 4.9, 1, PAL.steelD);
      T(30, 46, 2.4, 7.4, PAL.steelD); T(30, 40, 1.8, 9.6, PAL.steelD); E([[39, 7.6], [41, 7.6], [40.6, 12.4], [39.4, 12.4]], 1.4, PAL.steelD, { bevel: 0.2 });  // gas tube + front sight tower
      T(46, 49, 3.2, 7.4, PAL.steelD);
      grip(-2, 4.2, Accent, 11.4, 16, 5.2, 3.8); guard(0.6, 4, PAL.steelD, 6.6, 4.4);
      E(rect(0, 11, 8, 14), 3, PAL.steelD, { bevel: 0.5 }); B(7.6, 0, 12.6, 0.4, 2.2, 2.2, C(0xFF3A2A), null, 2);   // red dot
      B(4, -2.3, 8.6, 9, 0.3, 1.6, PAL.black); part('charge', 8, -2.4, 8.6, () => { Ball(8, -3.2, 8.6, 1.8, PAL.steelL); B(8, -2.6, 8.6, 1, 1.2, 0.9, PAL.steelL); });
      B(-2, 2.2, 6.4, 1.6, 0.4, 0.8, PAL.red); for (let i = 0; i < 2; i++) Ty(-4 + i * 14, 5.4, 1.1, 4.5, PAL.steelL);   // selector, takedown pins
      vm.MagRoot = group(10, 0, 4.4); into(vm.MagRoot, () => banana(0, 0, 14, 3, PAL.steelD, 30, 5));
      Muzzle = V(49.5, 0, 7.4); Support = V(22, 0, 3); Sight = 12.6;
      break;
    }
    case 'Long Rider': {
      E([[-7, 4.4], [-7, 10], [16, 10], [16, 4.4]], 4.2, PAL.steelD, { bevel: 0.5 });
      E(rect(-6, 10, 15, 10.8), 3, PAL.steel, { bevel: 0.2 });
      stock(-7, 9.6, Accent, 23, 3, 9.4, 4.2, 6);
      E([[16, 5], [16, 9.6], [33, 9.2], [33, 5.4]], 4.4, Accent, { bevel: 1.2 });
      for (let i = 0; i < 5; i++) Ty(19 + i * 3, 7.3, 1.5, 4.6, PAL.black);
      T(33, 54, 2.6, 7.4, PAL.steelD); T(54, 59, 3.8, 7.4, PAL.steel); for (let i = 0; i < 3; i++) B(55.2 + i * 1.4, 0, 7.4, 0.6, 4, 1.2, PAL.black);  // muzzle brake
      E([[42, 7.6], [44, 7.6], [43.6, 11.6], [42.4, 11.6]], 1.4, PAL.steelD, { bevel: 0.2 });
      E([[38, 5], [39.4, 5], [36, -3], [35, -3]], 1, PAL.steelD, { y: 1.6, bevel: 0.2 }); E([[38, 5], [39.4, 5], [36, -3], [35, -3]], 1, PAL.steelD, { y: -1.6, bevel: 0.2 });  // folded bipod
      grip(-2, 4.6, PAL.black, 11.4, 14, 5.2, 3.8); guard(0.6, 4.4, PAL.steelD, 6.6, 4.4);
      scope(-1, 13, 13.2, 3);
      part('charge', 6, -2.3, 8.4, () => { Ball(6, -3.2, 8.4, 1.8, PAL.steelL); B(6, -2.5, 8.4, 1, 1.2, 0.9, PAL.steelL); }); B(4, -2.2, 8.4, 9, 0.3, 1.4, PAL.black);
      vm.MagRoot = group(10, 0, 4.6); into(vm.MagRoot, () => E([[2.6, 0.4], [-2.6, 0.4], [-3.4, -11], [1.8, -11]], 3.2, PAL.steel, { bevel: 0.35 }));
      Muzzle = V(59.5, 0, 7.4); Support = V(24, 0, 3); Sight = 13.4;
      break;
    }
    case 'Gold Rush': {
      const gold = C(0xE0AC2A), goldD = C(0xA87818); gold.metal = 1; goldD.metal = 0.9;
      E([[-7, 4.4], [-7, 9.6], [14, 9.6], [14, 4.4]], 4.2, gold, { bevel: 0.5, glow: 0.15 });
      E([[-5, 9.6], [-5, 12.6], [9, 12.6], [11, 9.6]], 1.6, goldD, { bevel: 0.3, holes: [[[-3.6, 10.2], [-3.6, 11.6], [8, 11.6], [9, 10.2]]] });   // carry handle
      E([[-7, 9.4], [-7, 5], [-24, 2.4], [-26, 2.6], [-26, 10], [-24, 10.2]], 4, PAL.bone, { bevel: 0.9 });   // ivory stock
      T(14, 32, 5.4, 7.2, PAL.bone); for (let i = 0; i < 6; i++) Ring(16.4 + i * 2.6, 7.2, 5.9, 0.5, goldD);
      T(32, 46, 2.4, 7.2, gold, 0, 0.15); E([[36, 7.6], [38, 7.6], [37.6, 12.6], [36.4, 12.6]], 1.4, goldD, { bevel: 0.2 }); T(46, 50, 3.4, 7.2, goldD);
      grip(-2, 4.6, PAL.bone, 11.4, 16, 5.2, 3.8); guard(0.6, 4.4, goldD, 6.6, 4.4);
      for (const s of [-1, 1]) { Ty(4, 7, 3.6, 0.3, PAL.bone, s * 2.2); E([[2.6, 6.2], [5.4, 7.8], [5, 8.2], [4, 7.6], [3, 8], [2.4, 7.4], [3.4, 7]], 0.2, gold, { y: s * 2.4, bevel: 0.03 }); }   // pickaxe medallion
      part('charge', 8, -2.3, 8.4, () => { Ball(8, -3.2, 8.4, 1.8, PAL.bone); B(8, -2.5, 8.4, 1, 1.2, 0.9, goldD); }); B(5, -2.2, 8.4, 8, 0.3, 1.4, PAL.black);
      vm.MagRoot = group(9, 0, 4.4); into(vm.MagRoot, () => banana(0, 0, 12, 3, goldD, 16, 5));
      Muzzle = V(50.5, 0, 7.2); Support = V(22, 0, 3.4); Sight = 12.6;
      break;
    }
    // ============================================================ SHOTGUNS
    case 'Sawbuck': {
      E([[-6, 4], [-6, 10], [-2, 10.8], [8, 10.8], [8, 4]], 5.6, PAL.steel, { bevel: 0.7 });
      E(rect(7.6, 5.4, 8.2, 10.6), 5.2, PAL.steelL, { bevel: 0.1 });                                 // standing breech face
      part('barrels', 8.6, 0, 4.6, () => {
        for (const s of [-1, 1]) { T(8.2, 36, 3.9, 8.4, PAL.steelD, s * 2); T(8.1, 8.5, 3, 8.4, PAL.black, s * 2); T(35.6, 36.2, 3.1, 8.4, PAL.black, s * 2); }
        E(rect(8.4, 9.9, 35, 10.5), 1.2, PAL.steel, { bevel: 0.15 });
        E([[8.4, 4], [8.4, 6.6], [24, 6.6], [26, 5.4], [24, 4]], 6, PAL.wood, { bevel: 1.2 });
        for (let i = 0; i < 4; i++) B(12 + i * 3, 0, 4, 1.2, 6.1, 0.5, PAL.woodD);                    // chequering on the forend
        Ball(35, 0, 11, 1.2, PAL.brass);
        Ty(8.6, 4.6, 2.2, 6.2, PAL.steelL);                                                           // hinge pin
      });
      part('hammer', -5.6, 0, 9.8, () => { for (const s of [-1, 1]) E([[-6, 9.6], [-7.6, 11.1], [-7.1, 11.8], [-6.2, 11.5], [-4.8, 10.5]], 0.9, PAL.steelL, { y: s * 1.8, bevel: 0.2 }); });   // twin hammers
      stock(-6, 9.4, PAL.wood, 20, 5.5, 10, 4.8, 6);
      E([[-5, 4], [2, 4], [1, 2.2], [-1, 0.2], [-5.4, -0.8], [-6.4, 1.6]], 1.4, PAL.steelD, { bevel: 0.2, holes: [[[-4.6, 3.2], [0.4, 3.2], [-1.2, 1], [-5, 0.2]]] });
      for (const x of [-2.6, -1]) E([[x, 3.6], [x + 0.9, 3.6], [x + 0.5, 1.2], [x - 0.2, 1.4]], 0.8, PAL.steelL, { bevel: 0.1 });   // two triggers
      E([[1, 10.8], [3, 10.8], [-1, 13], [-2, 12.4]], 1, PAL.steelL, { bevel: 0.15 });               // top lever
      for (const s of [-1, 1]) Ty(2, 7.4, 3, 0.3, PAL.steelL, s * 2.85);                              // side lock plates
      vm.MagRoot = part('mag', 8.4, 0, 8.4, () => { for (const s of [-1, 1]) { T(8.6, 13.4, 3.2, 8.4, PAL.red, s * 2); T(7.9, 8.6, 3.5, 8.4, PAL.brass, s * 2); } });
      Muzzle = V(36.6, 0, 8.4); Support = V(18, 0, 2.4); Sight = 11.6;
      break;
    }
    case "Homesteader": {
      E([[-6, 4], [-6, 10], [-3, 10.8], [14, 10.8], [14, 4]], 4.6, PAL.steel, { bevel: 0.6 });
      T(14, 50, 3.6, 8.6, PAL.steelD); T(14, 44, 3.2, 5, PAL.steel); T(44, 45.4, 3.8, 5, PAL.steelL); Ring(40, 6.8, 5.2, 0.9, PAL.steelD);
      vm.PumpRoot = group(26, 0, 5); into(vm.PumpRoot, () => { T(-7, 7, 6, 0, PAL.wood); for (let i = 0; i < 5; i++) Ring(-5 + i * 2.5, 0, 6.4, 0.5, PAL.woodD); B(-10, 2.2, 1, 8, 0.5, 1, PAL.steelD); });
      stock(-6, 9.6, PAL.wood, 21, 5, 10, 4.6, 5.8);
      guard(-2, 4, PAL.steelD, 7, 4.4);
      B(6, 2.5, 8.6, 7, 0.3, 2.2, PAL.black); Ball(49, 0, 10.9, 1.2, PAL.brass);
      E(rect(-2, 10.8, 12, 11.4), 1.6, PAL.steelD, { bevel: 0.15 }); for (let i = 0; i < 6; i++) B(-1 + i * 2.2, 0, 11.5, 1, 1.7, 0.3, PAL.black);   // matted top rib
      B(6, 0, 3.9, 9, 3, 0.4, PAL.steelL);                                                               // loading gate
      B(4, 0, 4, 7, 2.6, 0.5, Accent);
      vm.MagRoot = group(6, 0, 7); into(vm.MagRoot, () => { T(-3, 2, 3.2, 0, PAL.red); T(-3.8, -3, 3.4, 0, PAL.brass); });
      Muzzle = V(50.6, 0, 8.6); Support = V(26, 0, 1.6); Sight = 11.8;
      break;
    }
    case 'Stampede': {
      E([[-8, 3.6], [-8, 11], [20, 11], [20, 3.6]], 5.6, Accent, { bevel: 0.9 });
      E(rect(-6, 11, 18, 12), 3, PAL.steelD, { bevel: 0.3 }); for (let i = 0; i < 7; i++) B(-4.6 + i * 3.4, 0, 12.1, 1.6, 3.2, 0.5, PAL.black);
      E([[-8, 10.6], [-8, 4], [-22, 3], [-24, 3.6], [-24, 10.2], [-22, 10.6]], 5, Accent, { bevel: 1 }); E(rect(-25.4, 3.4, -23.6, 10.4), 5.2, PAL.rubber, { bevel: 0.3 });
      T(20, 40, 4.2, 7.6, PAL.steelD); T(20, 30, 6.4, 7.6, PAL.black); for (let i = 0; i < 4; i++) for (const a of [0, 90, 180, 270]) Ball(22 + i * 2.2, Math.cos(d2r(a)) * 3.1, 7.6 + Math.sin(d2r(a)) * 3.1, 1.1, PAL.steelD);
      grip(-3, 3.8, PAL.black, 11, 14, 5.4, 4); guard(-0.4, 3.6, PAL.steelD, 6.6, 4.4);
      part('charge', 8, -3, 8.6, () => { Ball(8, -3.9, 8.6, 2.2, PAL.steelL); B(8, -3.1, 8.6, 1.2, 1.4, 1, PAL.steelL); }); B(8, -2.85, 8.6, 12, 0.3, 1.8, PAL.black);
      E([[14, 3.6], [18, 3.6], [17.4, -3.6], [14.6, -3.6]], 3.4, PAL.black, { bevel: 0.9 });
      vm.MagRoot = group(7, 0, 3.4); into(vm.MagRoot, () => { Ty(0, -7, 15, 6, PAL.steelD); Ty(0, -7, 6, 6.6, PAL.steelL); B(0, 0, -0.6, 5, 4, 2.6, PAL.steelD); for (let i = 0; i < 6; i++) Ball(Math.cos(i) * 5, 3.1, -7 + Math.sin(i) * 5, 1.4, PAL.red); });
      post(38.4, 9.6, 2.2); notch(-6, 12, 3.4);
      Muzzle = V(40.6, 0, 7.6); Support = V(16, 0, -1); Sight = 13.6;
      break;
    }
    case "Dragon's Breath": {
      const ember = C(0xFF7A1A);
      E([[-6, 4], [-6, 10], [-3, 10.8], [12, 10.8], [12, 4]], 4.8, PAL.steelD, { bevel: 0.6 });
      T(12, 36, 4, 8.4, PAL.steelD); T(12, 32, 3.2, 4.8, PAL.steel);
      E([[13, 10], [35, 10], [34, 11.4], [14, 11.4]], 4.6, PAL.steel, { bevel: 0.5 }); for (let i = 0; i < 6; i++) B(16 + i * 3.2, 0, 11.5, 1.6, 4.8, 0.5, ember, null, 1.6);   // glowing heat shield vents
      Cone(38.5, 8.4, 8.4, 6, Accent, false, 0, 0.5); T(40.6, 41.4, 7.4, 8.4, ember, 0, 2);                         // flared dragon muzzle
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) Cone(41 + i * 0.2, 8.4 + (i - 1) * 2.6, 1.6, 3, PAL.bone, true, s * 3.2);   // teeth
      vm.PumpRoot = group(22, 0, 4.8); into(vm.PumpRoot, () => { T(-6, 6, 6, 0, PAL.black); for (let i = 0; i < 4; i++) Ring(-4.4 + i * 3, 0, 6.4, 0.6, ember, 0.8); });
      grip(-2, 4.2, PAL.woodD, 12, 20, 6, 4.4); guard(0.6, 4, PAL.steelD, 6.6, 4.4);                                 // pistol grip, no stock
      E([[-6, 10], [-6, 5], [-9, 5.4], [-9, 9.6]], 4.4, PAL.steel, { bevel: 0.6 });
      vm.MagRoot = group(5, 0, 7.4); into(vm.MagRoot, () => { T(-3, 2, 3.2, 0, ember, 0, 1.2); T(-3.8, -3, 3.4, 0, PAL.brass); });
      Muzzle = V(42, 0, 8.4); Support = V(22, 0, 1.4); Sight = 12.6;
      break;
    }
    // ============================================================ LMGs
    case 'Iron Mule': {
      E([[-8, 3.6], [-8, 12], [22, 12], [22, 3.6]], 7, Accent, { bevel: 0.9 });
      part('cover', 20, 0, 12.2, () => {
        E([[-6, 12], [20, 12], [18, 13.4], [-4, 13.4]], 6, PAL.steelD, { bevel: 0.4 });                               // feed cover, hinged at the front
        for (let i = 0; i < 5; i++) B(-2 + i * 4, 0, 13.5, 2, 5, 0.4, PAL.steel);
        E([[-6.6, 11.6], [-5.4, 11.6], [-5.4, 13.6], [-6.6, 13.6]], 3, PAL.steelL, { bevel: 0.2 });                   // latch
      });
      E([[24, 9.6], [26, 9.6], [30, 14], [38, 14], [38, 12.6], [31, 12.6], [28, 9.6]], 1.6, PAL.steelD, { bevel: 0.3 }); // carry handle on the barrel
      part('charge', 0, -3.7, 9.6, () => { Ball(0, -4.7, 9.6, 2.4, PAL.steelL); B(0, -3.9, 9.6, 1.2, 1.6, 1, PAL.steelL); }); B(-2, -3.55, 9.6, 10, 0.3, 1.6, PAL.black);
      stock(-8, 11, PAL.wood, 20, 4, 10, 5, 6.4);
      T(22, 54, 3.6, 8, PAL.steelD); fins(23, 40, 8, 5.8, 9, PAL.steel); T(54, 58, 4.8, 8, PAL.steel);
      E([[44, 8], [46, 8], [45.6, 12.6], [44.4, 12.6]], 1.4, PAL.steelD, { bevel: 0.2 });
      for (const s of [-1, 1]) E([[48, 6], [49.6, 6], [38, -1], [37, -0.2]], 1, PAL.steelD, { y: s * 2.6, bevel: 0.2 });   // bipod
      grip(-2, 3.8, PAL.black, 11.4, 14, 5.4, 4); guard(0.6, 3.6, PAL.steelD, 6.6, 4.4);
      vm.MagRoot = group(8, -5, 3.6); into(vm.MagRoot, () => {
        E(rect(-6.5, -10, 6.5, 0), 7, C(0x5A6040), { y: -3, bevel: 0.7 }); E(rect(-7, -1, 7, 0.6), 7.6, C(0x444a30), { y: -3, bevel: 0.3 });
        for (let i = 0; i < 6; i++) Pt(1, -4 + i * 1.7, 0.5 - i * 0.2, 4 + i * 0.9, 1.4, 1.4, 4.4, PAL.brass, R(0, 0, 90));   // belt up into the feed tray
      });
      Muzzle = V(58.6, 0, 8); Support = V(26, 0, 2); Sight = 14.4;
      break;
    }
    case 'Thresher': {
      E([[-8, 2.6], [-8, 12], [14, 12], [14, 2.6]], 8, Accent, { bevel: 1.2 });                                        // brass breech
      for (const x of [-6, 12]) for (const s of [-1, 1]) Ball(x, s * 4.1, 10, 1.3, PAL.steelD);
      Ty(2, 15, 9, 5, PAL.steelD); Ty(2, 15, 9.6, 1, PAL.steel); B(2, 0, 12, 4, 3, 2, PAL.steelD);                     // top drum
      vm.SpinPart = group(34, 0, 7); vm.spinAxis = 'z';
      into(vm.SpinPart, () => {
        for (let i = 0; i < 6; i++) { const a = d2r(i * 60); T(-20, 22, 2.3, Math.sin(a) * 3.3, PAL.steelD, Math.cos(a) * 3.3); }
        T(-20, -17, 9.6, 0, PAL.steel); T(0, 2, 9.6, 0, PAL.steel); T(19, 21, 9.6, 0, PAL.steel); T(-20, 20, 2.4, 0, PAL.steelL);
      });
      part('crank', 10, 0, 5.4, () => { Ty(10, 5.4, 2, 6, PAL.steelD, -6.6); E([[8.9, 6.4], [11.1, 6.4], [11.1, 0.2], [8.9, 0.2]], 1.2, PAL.steelL, { y: -9.4, bevel: 0.2 }); Ty(10, 1, 2.4, 7.2, PAL.wood, -13.2); });   // crank, turned by the off hand (the handle is a fist and a bit long)
      E([[-8, 10], [-8, 4], [-13, 4], [-13, 10]], 5, PAL.steelD, { bevel: 0.6 });
      for (const s of [-1, 1]) E([[-12, 9], [-12, 5], [-20, 5.6], [-20, 8.4]], 1.8, PAL.wood, { y: s * 3.2, bevel: 0.7 });   // spade grips
      grip(-2, 3, PAL.wood, 11, 12, 5.4, 4);
      vm.MagRoot = group(2, 0, 15); into(vm.MagRoot, () => Ty(0, 0, 6, 5.4, PAL.brass));
      Muzzle = V(56.5, 0, 7); Support = V(10, -13.4, 1.0); Sight = 16.5;
      break;
    }
    // ============================================================ SNIPERS
    case 'Widowmaker': {
      E([[-10, 3.4], [-34, -0.6], [-36, 0], [-36, 8.4], [-34, 9], [-18, 9.6], [-8, 8], [0, 6.4], [30, 6.4], [32, 5], [30, 3.6], [8, 3.4], [2, 2.6], [-2, 0], [-7, -1.6]], 4.6, PAL.black, { bevel: 1.2 });   // one-piece stock
      E(rect(-37.4, 0.2, -35.6, 8.6), 4.8, PAL.rubber, { bevel: 0.3 });
      E(rect(-30, 9.4, -20, 11), 3.4, PAL.steelD, { bevel: 0.6 });                                                     // cheek rest
      T(-6, 14, 4.4, 8.2, PAL.steel); T(14, 66, 2.8, 8.2, PAL.steelD); T(66, 70, 4, 8.2, PAL.steel);
      part('bolt', -4, 0, 8.2, () => { T(-9.6, 2, 3.2, 8.2, PAL.steelL); T(-10.2, -9.6, 3.8, 8.2, PAL.steelD); Pt(1, -4, 3.2, 7.2, 1.4, 1.4, 5, PAL.steelL, R(0, 0, 55)); Ball(-4, 5.6, 5.6, 2.8, PAL.steelL); });   // bolt + knob
      B(2, 2.3, 8.4, 9, 0.3, 2, PAL.black);                                                                        // ejection port
      guard(-2, 2.8, PAL.steelD, 7, 4.2);
      scope(-2, 20, 12.8, 3.4);
      vm.MagRoot = group(6, 0, 3.4); into(vm.MagRoot, () => E([[3, 0.4], [-3, 0.4], [-3, -4], [3, -4]], 3.2, PAL.steelD, { bevel: 0.4 }));
      Muzzle = V(70.5, 0, 8.2); Support = V(22, 0, 2.6); Sight = 13.6;
      break;
    }
    case 'Railroad Spike': {
      E([[-8, 3.6], [-8, 11], [18, 11], [18, 3.6]], 5.6, PAL.steel, { bevel: 0.8 });
      for (const z of [10.4, 4.6]) E(rect(18, z - 1, 66, z + 1), 3.4, PAL.steelD, { bevel: 0.4 });                    // twin rails
      for (let i = 0; i < 6; i++) { E(rect(22 + i * 7.4, 3.2, 25 + i * 7.4, 11.8), 4.6, PAL.steel, { bevel: 0.5 }); Ty(23.5 + i * 7.4, 7.5, 3.4, 5.2, Accent, 0, 1.6); }   // coil clamps
      part('emit', 41, 0, 7.5, () => T(18, 64, 1.6, 7.5, Accent, 0, 2.2));
      E([[-8, 10.4], [-8, 4.4], [-26, 3], [-28, 3.6], [-28, 9.6], [-26, 10.4]], 4.6, PAL.steelD, { bevel: 0.9, holes: [[[-12, 8.6], [-12, 5.6], [-22, 5], [-22, 8.6]]] });
      B(4, 3, 7.4, 12, 0.4, 4, Accent, null, 1.2); for (let i = 0; i < 3; i++) Ty(-3 + i * 6, 12, 3, 4, PAL.brass);   // capacitors
      grip(-2, 3.8, PAL.black, 11.4, 14, 5.4, 4); guard(0.6, 3.6, PAL.steelD, 6.6, 4.4);
      scope(0, 18, 15.6, 3.2, PAL.steelD, Accent);
      vm.MagRoot = group(8, 0, 3.6); into(vm.MagRoot, () => { E(rect(-3, -7, 3, 0.4), 4, PAL.steelD, { bevel: 0.5 }); B(0, 2.1, -3.4, 4, 0.3, 4.6, Accent, null, 1.6); });
      Muzzle = V(66.5, 0, 7.5); Support = V(24, 0, 2); Sight = 16.4;
      break;
    }
    // ============================================================ LAUNCHERS
    case 'Dynamite Dan': {
      O(6, 34, 10.5, 9, PAL.steelD); T(33, 36, 11.6, 9, PAL.brass); T(4, 7, 11.6, 9, PAL.brass); Ring(20, 9, 11.4, 0.8, PAL.steel);
      E([[4, 12], [4, 4.6], [-6, 3.6], [-26, 0.4], [-28, 1], [-28, 8.6], [-26, 9.2], [-8, 9.6]], 5, PAL.wood, { bevel: 1.2 });
      E(rect(-29.4, 1.2, -27.6, 8.8), 5.2, PAL.rubber, { bevel: 0.3 });
      E([[-4, 4.4], [8, 4.4], [8, 3.4], [2, 3], [0, -1], [-6, -1.6], [-7, 1.6]], 1.6, PAL.steelD, { bevel: 0.25, holes: [[[-4.4, 3.4], [0.6, 3.4], [-0.6, 0], [-5, -0.4]]] });
      E([[16, 4], [20, 4], [19.4, -3.4], [16.6, -3.4]], 3.4, PAL.wood, { bevel: 0.9 });
      E([[10, 14], [12, 14], [14, 18], [12, 18]], 1, PAL.steelD, { bevel: 0.15 });                                      // ladder sight
      vm.MagRoot = group(36, 0, 9);
      into(vm.MagRoot, () => { for (const [y, z] of [[-2.4, -1.4], [2.4, -1.4], [0, 2.6]]) { T(-4, 8, 4.4, z, Accent, y); T(-4.2, -3.6, 4.6, z, C(0xe8d8b0), y); T(8, 8.6, 4.6, z, C(0xe8d8b0), y); } Ring(2, 0.2, 10.4, 1, PAL.black); Pt(1, 10, 0, 3.6, 0.7, 0.7, 4, C(0xe8d8b0), R(60, 0, 0)); Ball(11.4, 0, 5.4, 1.6, C(0xFFB040), 2.5); });
      Muzzle = V(44, 0, 9); Support = V(18, 0, -1); Sight = 16;
      break;
    }
    case 'Boomtown': {
      T(-16, 34, 7.4, 9.6, C(0x4A5A3A)); Cone(-22, 9.6, 13, 12, C(0x3a4630), true); T(-17, -15, 8.6, 9.6, PAL.steelD);  // tube + rear blast cone
      T(-6, 12, 8.8, 9.6, PAL.wood); Ring(-6, 9.6, 9.4, 0.8, PAL.steelD); Ring(12, 9.6, 9.4, 0.8, PAL.steelD);        // wooden heat shield
      T(33, 36, 8.6, 9.6, PAL.steelD);
      E([[8, 13], [9.6, 13], [9.6, 18], [8, 18]], 1.2, PAL.steelD, { y: -3.6, bevel: 0.2 }); B(8.8, -3.6, 16.6, 0.5, 3, 2.4, PAL.black);   // optic
      grip(0, 6, PAL.wood, 11.6, 12, 5.4, 4); guard(2.6, 5.8, PAL.steelD, 6.4, 4.2);
      E([[16, 6], [20, 6], [19.4, -3], [16.6, -3]], 3.6, PAL.wood, { bevel: 0.9 });
      vm.MagRoot = group(36, 0, 9.6);
      into(vm.MagRoot, () => { T(0, 6, 5, 0, PAL.steel); T(6, 16, 10.4, 0, Accent); Cone(20, 0, 10.4, 8, Accent, true); Cone(3.6, 0, 10.4, 5, Accent, false); T(23.4, 25.4, 1.6, 0, PAL.steelL); Ring(11, 0, 10.9, 0.7, PAL.brass); });
      Muzzle = V(62, 0, 9.6); Support = V(18, 0, -0.6); Sight = 17;
      break;
    }
    case 'Fireworks Finale': {
      E([[-8, 4], [-8, 13.8], [26, 13.8], [26, 4]], 9.6, Accent, { bevel: 1.2 });                                      // four-tube pod
      const tips = [C(0xFFD23A), C(0x4AD0FF), C(0x7CFF6A), C(0xFF5A4A)];
      vm.MagRoot = group(26, 0, 8.9);
      let k = 0;
      for (const y of [-2.3, 2.3]) for (const z of [11.2, 6.6]) {
        T(25.6, 27, 4.2, z, PAL.black, y); T(-8.8, -7.6, 4.2, z, PAL.black, y);
        const c = tips[k++]; into(vm.MagRoot, () => { Cone(3.2, z - 8.9, 3.4, 4.4, c, true, y, 0.5); T(0, 1.2, 3.4, z - 8.9, PAL.bone, y); });
      }
      for (const s of [-1, 1]) { E(star(4, 9, 2.8), 0.3, C(0xFFE27A), { y: s * 4.9, bevel: 0.04, glow: 0.6 }); E(star(16, 10.6, 1.8), 0.3, PAL.bone, { y: s * 4.9, bevel: 0.04 }); E(star(-3, 6.4, 1.5), 0.3, PAL.bone, { y: s * 4.9, bevel: 0.04 }); }
      E(rect(-9.6, 3.4, 27.6, 4.6), 10.2, PAL.steelD, { bevel: 0.4 }); E(rect(-9.6, 13.2, 27.6, 14.4), 10.2, PAL.steelD, { bevel: 0.4 });
      for (let i = 0; i < 4; i++) Tz(-4 + i * 2, 14.4, 15.6 + (i % 2) * 0.8, 0.5, PAL.bone);                             // fuses poking out the back
      grip(0, 3.6, PAL.black, 11.4, 12, 5.4, 4); guard(2.6, 3.4, PAL.steelD, 6.4, 4.2);
      E([[16, 3.6], [20, 3.6], [19.4, -4], [16.6, -4]], 3.6, PAL.black, { bevel: 0.9 });
      E([[4, 14.4], [6, 14.4], [6, 18], [4, 18]], 1.2, PAL.steelD, { y: -3.4, bevel: 0.2 });
      Muzzle = V(31, 0, 8.9); Support = V(18, 0, -1.4); Sight = 17;
      break;
    }
    // ============================================================ ENERGY
    case 'Tesla Coil': {
      E([[-8, 3.6], [-8, 10.4], [12, 10.4], [12, 3.6]], 5.6, PAL.wood, { bevel: 0.9 });                                 // mahogany box
      E(rect(-9, 9.6, 13, 11), 6.2, PAL.brass, { bevel: 0.4 }); E(rect(-9, 3, 13, 4.4), 6.2, PAL.brass, { bevel: 0.4 });
      stock(-8, 9.6, PAL.woodD, 19, 4, 9.6, 4.4);
      T(12, 20, 6, 7, PAL.brass); T(20, 38, 3.2, 7, PAL.bone); for (let i = 0; i < 9; i++) Ring(21.2 + i * 1.9, 7, 5.2, 0.9, C(0xC06A30));   // copper windings
      Ring(40, 7, 9.4, 1.5, PAL.brass); part('emit', 40, 0, 7, () => Ball(40, 0, 7, 4.6, Accent, 2.6)); T(38, 40, 2, 7, PAL.steelD);                // toroid + spark ball
      for (let i = 0; i < 2; i++) { Tz(-2 + i * 7, 11, 14.6, 3.4, C(0x8fb6d0), 0, 0.15); Tz(-2 + i * 7, 12, 13.6, 1, Accent, 0, 2.4); Tz(-2 + i * 7, 14.6, 15.4, 3.8, PAL.brass); }   // vacuum tubes
      grip(-2, 3.8, PAL.woodD, 11.4, 14, 5.4, 4); guard(0.6, 3.6, PAL.brass, 6.6, 4.4);
      vm.MagRoot = group(6, 0, 3.6); into(vm.MagRoot, () => { Tz(0, -8, 0, 5.6, PAL.steelD); Tz(0, -6.6, -1.4, 5.9, Accent, 0, 1.6); Tz(0, -8.8, -8, 4, PAL.brass); });
      Muzzle = V(43, 0, 7); Support = V(16, 0, 2.4); Sight = 13;
      break;
    }
    case "Will-o'-Wisp": {
      E([[-8, 3.6], [-8, 9.6], [8, 9.6], [8, 3.6]], 4.6, PAL.steelD, { bevel: 0.7 });
      stock(-8, 9.2, PAL.woodD, 18, 4.5, 9.4, 4.2);
      // ghost lantern: a caged glass jar with the wisp inside
      T(8, 11, 9.6, 8, PAL.brass); T(27, 30, 9.6, 8, PAL.brass);
      T(11, 27, 8.2, 8, C(0xbff7ea), 0, 0.35); part('emit', 19, 0, 8, () => { Ball(19, 0, 8, 5.6, Accent, 2.8); Ball(21.4, 0, 9.2, 2.6, C(0xeafff8), 3); });
      for (let i = 0; i < 6; i++) { const a = d2r(i * 60 + 30); T(10, 28, 0.9, 8 + Math.sin(a) * 4.5, PAL.brass, Math.cos(a) * 4.5); }
      Cone(34, 8, 10.6, 8, PAL.brass, false); T(37.4, 38.2, 9.4, 8, Accent, 0, 1.8);                                    // bell muzzle
      E([[14, 12.6], [24, 12.6], [22, 16.6], [16, 16.6]], 1.2, PAL.brass, { bevel: 0.2, holes: [[[16, 13.4], [22, 13.4], [21, 15.6], [17, 15.6]]] });   // carry ring
      grip(-2, 3.8, PAL.woodD, 11.4, 14, 5.4, 4); guard(0.6, 3.6, PAL.brass, 6.6, 4.4);
      vm.MagRoot = group(3, 0, 3.6); into(vm.MagRoot, () => { Tz(0, -7, 0, 5, C(0xbff7ea), 0, 0.3); Tz(0, -6, -1, 3, Accent, 0, 2.2); Tz(0, -7.8, -7, 5.4, PAL.brass); });
      Muzzle = V(39, 0, 8); Support = V(19, 0, 2.6); Sight = 14;
      break;
    }
    case 'Frostbite Beam': {
      const ice = C(0xDFF6FF);
      E([[-8, 3.6], [-8, 10.4], [14, 10.4], [16, 8.4], [16, 3.6]], 5.4, C(0xE9EEF2), { bevel: 1.2 });                   // enamel body
      E(rect(-6, 10.4, 12, 11.2), 2.4, PAL.steelL, { bevel: 0.2 });
      E([[-8, 9.6], [-8, 4.6], [-24, 3.4], [-26, 4], [-26, 9.2], [-24, 9.8]], 4.6, C(0xE9EEF2), { bevel: 1, holes: [[[-12, 8.2], [-12, 5.8], [-21, 5.2], [-21, 8.2]]] });
      T(16, 40, 2.4, 7, PAL.steelL); for (let i = 0; i < 6; i++) Ring(19 + i * 3.4, 7, 6.4, 0.9, Accent, 1.2);          // cooling coil
      part('emit', 41, 0, 7, () => Cone(43.6, 7, 4.6, 8, ice, true, 0, 2.2)); T(39, 41, 4.4, 7, PAL.steelL);                                          // crystal emitter
      Ty(4, 12.6, 4.6, 4.4, PAL.steelL); Ty(4, 12.6, 3.2, 4.8, Accent, 0, 1.2);       // coolant canister on top
      for (const s of [-1, 1]) { Ty(6, 7, 3.4, 0.3, PAL.steelD, s * 2.8); B(6, s * 3, 7.6, 0.4, 0.2, 2, PAL.red); }     // gauge
      grip(-2, 3.8, C(0x5a6a78), 11.4, 14, 5.4, 4); guard(0.6, 3.6, PAL.steelL, 6.6, 4.4);
      vm.MagRoot = group(8, 0, 3.6); into(vm.MagRoot, () => { Tz(0, -8, 0, 5.4, Accent, 0, 1.4); Tz(0, -8.8, -8, 5.8, PAL.steelL); Tz(0, -0.6, 0.4, 5.8, PAL.steelL); });
      Muzzle = V(48, 0, 7); Support = V(22, 0, 2); Sight = 15;
      break;
    }
    case 'Hellfire Hose': {
      const flameB = C(0x5AB0FF);
      E([[-8, 4], [-8, 10], [14, 10], [14, 4]], 5, C(0x8A2A1A), { bevel: 0.8 });
      for (const s of [-1, 1]) { T(-12, 12, 7.4, -1.6, C(0xC8302A), s * 3.9); Ball(12, s * 3.9, -1.6, 7.4, C(0xC8302A)); Ball(-12, s * 3.9, -1.6, 7.4, C(0xC8302A)); Ring(0, -1.6, 7.9, 0.7, PAL.steelD, 0, s * 3.9); }   // twin fuel tanks
      T(-4, 4, 2, 2.6, PAL.brass); Ty(0, 2.6, 4, 1.4, PAL.brass);
      T(14, 44, 3.2, 7, PAL.steelD); T(14, 30, 5.2, 7, PAL.steel); for (let i = 0; i < 5; i++) for (const a of [45, 135, 225, 315]) Ball(16.6 + i * 2.8, Math.cos(d2r(a)) * 2.5, 7 + Math.sin(d2r(a)) * 2.5, 1.2, PAL.black);
      Cone(46.5, 7, 7, 6, PAL.steelD, false); T(48.8, 49.6, 6, 7, Accent, 0, 1.8);                                      // nozzle
      T(40, 48, 1, 3.6, PAL.brass); part('emit', 48.6, 0, 3.6, () => Ball(48.6, 0, 3.6, 1.8, flameB, 3));                                                 // pilot light
      E([[-8, 9.4], [-8, 4.6], [-20, 5], [-20, 9]], 4, PAL.steelD, { bevel: 0.8 });
      grip(-2, 4.2, PAL.black, 11, 14, 5.4, 4); guard(0.6, 4, PAL.steelD, 6.6, 4.4);
      E([[22, 4.4], [26, 4.4], [25.4, -3], [22.6, -3]], 3.4, PAL.black, { bevel: 0.9 });
      Ty(4, 10.6, 3, 2, PAL.brass); Tz(4, 10, 12, 1.2, PAL.steelL);                                                     // valve wheel
      vm.MagRoot = group(0, 0, -6); into(vm.MagRoot, () => Ty(0, 0, 3, 9, PAL.brass));
      Muzzle = V(50, 0, 7); Support = V(24, 0, -0.4); Sight = 12.4;
      break;
    }
    // ============================================================ WONDER WEAPONS
    case 'Buzzsaw': {
      E([[-8, 3.6], [-8, 11], [14, 11], [14, 3.6]], 6.4, C(0xC8A020), { bevel: 0.9 });                                  // motor housing
      for (let i = 0; i < 5; i++) B(-5 + i * 3.6, 0, 11.2, 1.6, 6.6, 0.6, PAL.black);
      Ty(-2, 13.4, 5, 4, PAL.steelD); Ty(-2, 13.4, 2, 6, PAL.red);                                                      // fuel cap
      E([[14, 4.6], [14, 9.6], [24, 9], [24, 5.2]], 4, PAL.steelD, { bevel: 0.6 });
      vm.SpinPart = group(34, 0, 7.4); vm.spinAxis = 'x';
      into(vm.SpinPart, () => {
        const teeth = []; for (let i = 0; i < 28; i++) { const a = i * Math.PI / 14, r = i % 2 ? 11.6 : 9.4; teeth.push([Math.cos(a) * r, Math.sin(a) * r]); }
        E(teeth, 0.9, PAL.steelL, { bevel: 0.2, holes: [arc(0, 0, 2.4, 0, 330, 8)] }); Ty(0, 0, 5, 1.6, PAL.steelD); Ty(0, 0, 2, 2.2, PAL.red);
      });
      E(arc(34, 7.4, 13.4, 20, 200, 10).concat(arc(34, 7.4, 11.6, 200, 20, 10)), 3, C(0xC8A020), { bevel: 0.4 });       // blade guard
      E([[-8, 10.4], [-8, 4.4], [-22, 4], [-24, 4.6], [-24, 9.8], [-22, 10.4]], 5, PAL.black, { bevel: 1, holes: [[[-11, 8.6], [-11, 6], [-20, 5.6], [-20, 8.6]]] });
      grip(-2, 3.8, PAL.black, 11.4, 14, 5.4, 4); guard(0.6, 3.6, PAL.steelD, 6.6, 4.4);
      E([[12, 11], [14, 11], [20, 17], [10, 17], [8, 15.4], [16, 15.4]], 2, PAL.black, { bevel: 0.5 });                  // top handle
      vm.MagRoot = group(6, 0, 3.6); into(vm.MagRoot, () => { for (let i = 0; i < 3; i++) Ty(0, -2 - i * 1.6, 9, 0.8, PAL.steelL); });
      Muzzle = V(46, 0, 7.4); Support = V(16, 0, 2.4); Sight = 19;
      break;
    }
    case 'Thunderhead': {
      const gold = C(0xC8782E), goldD = C(0x8A4E1C); gold.metal = 1; goldD.metal = 0.9;                                   // copper fittings
      const housing = C(0x2E3A52); housing.metal = 0.6;
      E([[-8, 3.6], [-8, 12.6], [-4, 14.4], [16, 14.4], [18, 12.6], [18, 3.6]], 6.2, housing, { bevel: 1.2 });               // storm-engine housing
      E(rect(-9, 3, 19, 4.6), 6.8, gold, { bevel: 0.4, glow: 0.3 }); E([[-5, 14.4], [15, 14.4], [12, 16.4], [-2, 16.4]], 5, gold, { bevel: 0.6, glow: 0.3 });
      const reels = [C(0x7FD8FF), C(0xBFEFFF), C(0x4FA8FF)];                                                              // three rotors behind glass
      for (const s of [-1, 1]) E(rect(-4, 6.8, 14, 12), 0.4, C(0x10161f), { y: s * 3.2, bevel: 0.05 });
      for (let i = 0; i < 3; i++) part('reel' + i, -1 + i * 6, 0, 9.4, () => { for (const s of [-1, 1]) { Ty(-1 + i * 6, 9.4, 4.4, 0.3, PAL.black, s * 3.45); Ball(-1 + i * 6, s * 3.5, 10.6, 2, reels[i], 1.4); Ball(-1 + i * 6, s * 3.5, 8.3, 1.5, reels[(i + 1) % 3], 1.2); } });
      for (let i = 0; i < 5; i++) { Tz(-2 + i * 3.6, 16.2, 17.2, 1.4, PAL.bone); Ball(-2 + i * 3.6, 0, 17.5, 1.1, C(0xBFEFFF), 2.6); }   // insulators along the top
      part('lever', -6, -4.4, 6.4, () => { Tz(-6, 6, 11.6, 1.2, PAL.steelL, -4.4); Ball(-6, -4.4, 12.4, 2.8, PAL.black); }); Ty(-6, 6.4, 2.4, 1.4, gold, -4);   // pull lever, on the side the off hand can reach
      T(18, 30, 5, 9, gold, 0, 0.3); Ring(22, 9, 7.4, 1, goldD); Ring(27, 9, 7.4, 1, goldD);
      for (let i = 0; i < 3; i++) { const a = d2r(i * 120 + 90); E([[30, -0.8], [40, -0.3], [44, 0], [40, 0.3], [30, 0.8]], 1, gold, { bevel: 0.2, glow: 1.4 }).position.add(new THREE.Vector3(Math.cos(a) * 3, 9 + Math.sin(a) * 3, 0)); }   // lightning prongs
      Ball(38, 0, 9, 3.4, C(0xBFEFFF), 3);
      stock(-8, 12, PAL.woodD, 18, 6, 9.6, 4.6);
      grip(-2, 3.8, C(0x55301c), 11.4, 14, 5.4, 4); guard(0.6, 3.6, gold, 6.6, 4.4);
      vm.MagRoot = group(8, 0, 3.6); into(vm.MagRoot, () => { for (let i = 0; i < 5; i++) Tz(0, -1.6 - i * 1.5, -0.4 - i * 1.5, 6, i % 2 ? gold : C(0x4FA8FF), 0, 0.4); });   // capacitor stack
      Muzzle = V(44.5, 0, 9); Support = V(22, 0, 4); Sight = 18.4;
      break;
    }
    case "Fan of Knives": {
      E([[-8, 3.6], [-8, 11], [20, 11], [24, 8], [24, 3.6]], 5.6, PAL.black, { bevel: 0.9 });                            // blade thrower: a flat spring box with a wide mouth
      E(rect(-9, 10.4, 21, 11.6), 6, PAL.brass, { bevel: 0.3 }); E(rect(-9, 3, 25, 4.2), 6, PAL.brass, { bevel: 0.3 });
      const steelB = C(0xC9CED8); steelB.metal = 1;
      for (const s of [-1, 1]) { E(star(12, 7.4, 1.8, 4, 0.5), 0.3, steelB, { y: s * 2.9, bevel: 0.04 }); E([[-5, 5.4], [5, 7.4], [-5, 9.4], [-3.4, 7.4]], 0.3, steelB, { y: s * 2.9, bevel: 0.04 }); }   // a throwing star and a blade stamped in the side
      const card = (g, x, yaw, roll, col) => { const m = vm.Part(g, 0, V(x, 0, 0), V(8.6, 0.25, 6), col, R(0, yaw, roll), 0.35); return m; };
      vm.MagRoot = group(26, 0, 8);
      into(vm.MagRoot, () => { for (let i = 0; i < 5; i++) { const k = i - 2; const c = vm.Part(cur, 0, V(4 - Math.abs(k) * 0.7, k * 2.6, 1.2 + i * 0.3), V(11, 2.6, 0.3), steelB, R(28, k * 15, 0), 0.15); const pp = vm.Part(cur, 0, V(0.4 - Math.abs(k) * 0.7, k * 1.3, 0.4 + i * 0.3), V(3.4, 1.5, 0.7), PAL.black, R(28, k * 15, 0), 0); (vm.Cards = vm.Cards || []).push({ c, pp, cr: c.position.clone(), pr: pp.position.clone(), k }); } });
      E([[-8, 10.4], [-8, 4.4], [-22, 3.6], [-24, 4.2], [-24, 9.6], [-22, 10.2]], 4.6, C(0x3a1a20), { bevel: 1 });
      grip(-2, 3.8, PAL.bone, 11.4, 14, 5.4, 4); guard(0.6, 3.6, PAL.brass, 6.6, 4.4);
      part('deck', 10, 0, 11.6, () => { E([[6, 11.6], [14, 11.6], [14, 13.6], [6, 13.6]], 4, PAL.steelD, { bevel: 0.3 }); for (let i = 0; i < 3; i++) B(10, 0, 13.7 + i * 0.3, 8 - i, 2.6 - i * 0.4, 0.25, steelB); both((s) => Ty(10, 12.6, 1, 0.3, PAL.brass, s * 2.05)); });   // blade cassette on top
      Muzzle = V(34, 0, 8); Support = V(16, 0, 2); Sight = 15;
      break;
    }
    case 'Black Cat': {
      const eye = C(0x7CFF4A);
      E([[-10, 3.4], [-30, 0], [-34, 2], [-36, 8], [-33, 9.6], [-30, 7], [-20, 9.4], [-8, 8], [0, 6.4], [28, 6.4], [30, 5], [28, 3.6], [8, 3.4], [2, 2.6], [-2, 0], [-7, -1.6]], 4.4, PAL.black, { bevel: 1.2 });   // stock that curls like a tail
      T(-6, 14, 4.4, 8.2, PAL.black); T(14, 60, 2.8, 8.2, PAL.steelD); T(60, 72, 4.8, 8.2, PAL.black);                    // integral suppressor
      part('bolt', -4, 0, 8.2, () => { T(-9.6, 2, 3.2, 8.2, PAL.steelD); Pt(1, -4, 3.2, 7.2, 1.4, 1.4, 5, PAL.steelD, R(0, 0, 55)); Ball(-4, 5.6, 5.6, 2.8, eye, 1.4); });
      guard(-2, 2.8, PAL.steelD, 7, 4.2);
      scope(-2, 20, 12.8, 3.6, PAL.black, eye);
      for (const s of [-1, 1]) E([[-3.4, 14.2], [-0.2, 14.2], [-1.6, 17.4]], 1, PAL.black, { y: s * 1.5, bevel: 0.25 });     // ears on the scope
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) Pt(1, 21, s * 3, 12.6 + (i - 1) * 0.9, 0.25, 0.25, 5, PAL.bone, R(0, 0, 90 + s * (i - 1) * 12));   // whiskers at the objective
      for (const s of [-1, 1]) { E([[2, 5.2], [3.4, 6.4], [4.8, 5.2], [3.4, 4.2]], 0.3, eye, { y: s * 2.3, bevel: 0.04, glow: 1.4 }); }
      vm.MagRoot = group(6, 0, 3.4); into(vm.MagRoot, () => E([[3, 0.4], [-3, 0.4], [-3, -4], [3, -4]], 3.2, PAL.steelD, { bevel: 0.4 }));
      Muzzle = V(72.5, 0, 8.2); Support = V(22, 0, 2.6); Sight = 13.6;
      break;
    }
    default: {
      autoPistol({ len: 15, slide: PAL.steel, frame: PAL.steelD, gripCol: PAL.wood }); pistolMag(4);
      Support = V(-1, -4.5, -4);
    }
  }
  if (!vm.MagRoot) pistolMag(4);
  // --- detail pass: what turns a silhouette into a made thing. Each gun gets its own, in its own character. -----------
  const S = PAL.steel, SD = PAL.steelD, SL = PAL.steelL, BR = PAL.brass, BK = PAL.black, BN = PAL.bone, WD = PAL.woodD;
  switch (N) {
    case 'Tin Star': {
      on('cyl', () => Ring(0.9, 6.6, 7.1, 0.25, BR));                                           // brass ratchet ring
      for (const s of [-1, 1]) E(star(-1.8, 6.4, 1.1), 0.2, BR, { y: s * 1.95, bevel: 0.04 });   // a small star stamped in the side plate
      B(15, 0, 9.6, 6, 0.9, 0.3, SD);
      break;
    }
    case 'Saloon Six': {
      slotsS(26.5, 30.5, 8.6, 3.62, 3, 0.9, 0.8);                                               // ports cut beside the front sight
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) B(13 + i * 3.6, s * 1.15, 4.6, 2.2, 0.14, 0.9, BK);   // lightening cuts in the under-lug
      groove(10, 23, 5.7, 2.24, SD, 0.2);
      on('hammer', () => B(-7.5, 0, 10.9, 1.2, 2.3, 0.3, BR));                                   // wide target spur
      plate([[-3.4, 2.6], [-6.6, 2.4], [-11.4, -7.4], [-8.2, -8.4]], 4.4, dk(PAL.woodD, 0.8), 0.18);
      screw(-6.4, -2.4, 4.9, 1.2, BR);
      break;
    }
    case 'Copperhead': {
      E(rect(15.4, 5.8, 20.6, 6.4), 3.5, SD, { bevel: 0.1 }); Ring(21.2, 7.6, 3.7, 0.4, SL);      // shroud collar
      screw(10.5, 2.2, 2.8, 0.8); screw(10.6, -2.4, 2.8, 0.8);
      B(-10, 0, 8.4, 9, 1.9, 0.3, SL); Ty(-5.2, 7.5, 1.4, 2.2, SL);                             // stock rail and hinge pin
      break;
    }
    case 'Sidewinders': {
      break;
    }
    // ---------------------------------------------------------------- SMGs
    case 'Back-Alley': {
      T(-9.2, -8, 5.9, 7, SD); Ring(-8.5, 7, 6, 0.35, SL); Ring(-7.4, 7, 5.7, 0.3, SL);           // knurled end cap
      both((s) => B(-5.6, s * 1.25, 10.2, 1.4, 0.3, 1.5, SD));                                    // rear sight ears
      B(14, -3.15, 7, 5.6, 1, 4.2, S); Ball(11.2, -3.5, 5.2, 1, SL); screw(14, 9.2, 0.4, 0.9);    // magazine housing and catch
      for (let i = 0; i < 3; i++) B(-0.6 - Math.tan(d2r(12)) * (3 + i * 2.6), 0, 2 - (3 + i * 2.6), 5.3, 3.9, 0.8, BN);   // tape round the grip
      pinT(2, 3.5, 3); pinT(6.4, 3.9, 3);
      Ring(22.3, 7, 5.3, 0.5, SL); Ring(32.8, 7, 4.9, 0.5, SL); crown(36.2, 7, 2.3, SD);
      B(7, 2.72, 8, 6, 0.14, 2, BK);                                                               // ejection port
      E([[20, 9.2], [22, 9.2], [22, 10.4], [21, 10.8], [20, 10.4]], 1, SD, { bevel: 0.15 });        // sling loop on the jacket
      Ty(-8.2, 4.6, 1.3, 2.4, SL);                                                                 // stock hinge
      break;
    }
    case "Hornet's Nest": {
      plate([[-5.4, 4.6], [-5.4, 8.9], [8, 8.9], [10.4, 6.8], [8, 4.6]], 4.6, dk(S, 0.82), 0.22);
      screw(-4.2, 5.6, 5.1, 0.9); screw(13.4, 9, 4.7, 0.9); screw(13.4, 4.6, 4.7, 0.9); screw(6.6, 8, 5.1, 0.8);
      both((s) => B(-5.4, s * 1.2, 11.3, 0.9, 0.35, 2.2, SD)); B(-5.4, 0, 12.2, 0.9, 2.8, 0.35, SD);   // ladder rear sight
      into(vm.MagRoot, () => {
        Ty(0, -5.4, 3.2, 5, SL); B(0, -2.6, -5.4, 5.4, 0.3, 1.1, SL); B(0, -2.6, -5.4, 1.1, 0.3, 5.4, SL);   // winding key
        for (let i = 0; i < 8; i++) { const a = d2r(i * 45 + 22); both((s) => Ball(Math.cos(a) * 5.4, s * 2.15, -5.4 + Math.sin(a) * 5.4, 0.8, SL)); }
      });
      slotsS(30.6, 33.6, 7.2, 4.42, 3, 2.2, 0.5);
      both((s) => { for (let i = 0; i < 3; i++) B(21.9 - i * 0.12, s * 1.72, 2.2 - i * 1.8, 3, 0.14, 0.35, WD); });
      Ring(16.6, 7.2, 4.4, 0.6, SL); E([[26.4, 8.6], [28.2, 8.6], [27.8, 9.4], [26.8, 9.4]], 3.2, SD, { bevel: 0.1 });
      B(5, 2.34, 6, 8, 0.14, 1.6, BK);
      break;
    }
    case 'Rustler': {
      groove(-5.6, 17.6, 6.6, 4.22, dk(Accent, 0.5), 0.26);                                       // upper and lower halves
      plate([[5.4, 3.8], [5.4, 6.2], [11.6, 6.2], [11.6, 3.8]], 4.2, dk(Accent, 0.74), 0.3);       // magazine well
      pinT(-3, 5.2, 4.2); pinT(15.4, 5, 4.2); both((s) => { B(-1.8, s * 2.16, 7.6, 1.6, 0.2, 0.5, BN); Ball(-2.6, s * 2.2, 7.6, 0.7, PAL.red, 0.6); });   // pins, selector
      rail(-3.6, 11.6, 11.2, 2);
      for (const x of [21.5, 23, 33, 34.5]) Ring(x, 7, 4.9, 0.3, SD); T(36, 36.5, 4.2, 7, SD);       // suppressor bands and cap
      slotsS(9.4, 16.8, 4.5, 4.82, 4, 1, 1.1, dk(Accent, 0.45));                                  // handguard vents
      Ty(-6.4, 6.6, 1.6, 2.6, SL);                                                                 // stock hinge
      B(6, 2.14, 7.6, 5, 0.14, 1.5, BK);
      break;
    }
    // ---------------------------------------------------------------- RIFLES
    case 'Quarter Horse': {
      both((s) => { E([[0.4, 6.2], [5, 6.2], [5.6, 7.2], [5, 8.2], [0.4, 8.2]], 0.25, BR, { y: s * 1.96, bevel: 0.05 }); });   // brass loading gate
      E([[26.6, 3.6], [28.4, 3.6], [28.4, 6.4], [26.6, 6.4]], 4.7, SD, { bevel: 0.2 });               // forend cap
      T(44, 45, 2.6, 5.2, SL); crown(48.3, 8, 2.8, SD);
      E([[5, 10.2], [8.6, 10.2], [9.4, 11.6], [8.6, 11.6], [8, 10.8], [6.4, 10.8], [5.8, 11.6], [5, 11.6]], 1.6, SD, { bevel: 0.1 });   // buckhorn rear sight
      both((s) => { Ty(-5.6, 8.4, 0.5, 0.3, SL, s * 2.2); }); E([[-6.6, 6.6], [-4.8, 6.6], [-4.8, 4.8], [-6.6, 4.8]], 0.4, SL, { y: -2.5, bevel: 0.1, holes: [rect(-6.2, 5.2, -5.2, 6.2)] });   // saddle ring
      E(rect(-33.6, -5.2, -32.8, 4.6), 4.7, BR, { bevel: 0.2 });                                       // brass butt plate
      both((s) => { for (let i = 0; i < 4; i++) B(-12 - i * 1.3, s * 2.24, 5.4 - i * 0.5, 0.3, 0.12, 3.4, WD, R(0, 0, 0)); });   // chequering on the wrist
      E([[-7, 9.6], [-12, 9], [-12, 9.5], [-7, 10.2]], 1.6, S, { bevel: 0.1 });                         // upper tang
      groove(12, 26, 5, 4.42, WD, 0.24);
      break;
    }
    case 'Lawman AR': {
      groove(-6.6, 13.6, 6.9, 4.22, SD, 0.28);                                                    // receiver seam
      plate([[6.6, 4], [6.6, 6.6], [13.4, 6.6], [13.4, 5], [10, 4]], 4.2, dk(S, 0.8), 0.34);        // magazine well
      B(4, 2.22, 8.6, 7.4, 0.16, 2, SL); Ball(-1.6, 2.5, 8.8, 1.4, SD);                             // dust cover, forward assist
      pinT(-4.6, 5, 4.2, 1); pinT(12.6, 6, 4.2, 1);
      both((s) => E(star(2.6, 5.4, 1.5), 0.2, BR, { y: s * 2.18, bevel: 0.04 }));                    // lawman's star on the well
      rail(-5.6, 12.6, 11, 2.2); rail(15, 28.6, 9.2, 2.2, dk(Accent, 0.6));
      slotsS(15.6, 29, 5.6, 4.62, 5, 0.7, 1.6, dk(Accent, 0.45));
      E([[36, 6.4], [38, 6.4], [38.4, 5.2], [36.4, 5.2]], 1.4, SD, { bevel: 0.15 });                   // bayonet lug
      slotsS(46.4, 48.8, 7.4, 3.22, 3, 1.6, 0.4); Ring(46.1, 7.4, 3.5, 0.3, SL); Ring(30.3, 7.4, 3.4, 0.6, SL); Ring(40, 7.4, 3, 0.5, SL);
      both((s) => B(-17, s * 2.12, 7.4, 8, 0.14, 0.3, dk(Accent, 0.55)));
      E(rect(0.4, 14, 7.6, 14.5), 3.3, S, { bevel: 0.1 }); both((s) => Ty(4, 12.4, 1.2, 0.3, SL, s * 1.55));   // optic hood and windage knobs
      break;
    }
    case 'Long Rider': {
      flutes(35, 52, 7.4, 2.7, 6, SD); crown(59.2, 7.4, 3.6, SD);
      groove(-6.6, 15.6, 7, 4.22, S, 0.28);
      plate([[6.6, 4.4], [6.6, 6.8], [13.6, 6.8], [13.6, 4.4]], 4.2, S, 0.3);
      pinT(-4.6, 5.4, 4.2, 1); pinT(14.4, 6.4, 4.2, 1); both((s) => { B(-1.8, s * 2.16, 7.8, 1.6, 0.2, 0.5, SL); });
      E([[-12, 8.6], [-24, 7.8], [-24, 9.6], [-13, 10.4]], 3.4, dk(Accent, 0.7), { bevel: 0.6 }); both((s) => Ty(-18, 8.6, 1, 0.3, SL, s * 1.75));   // adjustable cheek piece
      rail(16.6, 32, 9.4, 2.2, dk(Accent, 0.6));
      into(vm.MagRoot, () => { for (const z of [-3, -6, -9]) both((s) => B(-0.6 + z * 0.07, s * 1.62, z, 4.4, 0.14, 0.4, SD)); });
      Ring(33.4, 7.4, 3.6, 0.6, SL); Ring(53.6, 7.4, 4, 0.4, SL);
      both((s) => B(5, s * 2.14, 5.4, 5, 0.14, 0.3, S));
      break;
    }
    case 'Gold Rush': {
      const gold = C(0xE0AC2A), goldD = C(0xA87818), goldL = C(0xFFD860); gold.metal = 1; goldD.metal = 0.9; goldL.metal = 1;
      plate([[-5.6, 5.2], [-5.6, 8.8], [0.6, 8.8], [0.6, 5.2]], 4.2, goldD, 0.2); plate([[7.6, 5.2], [7.6, 8.8], [13, 8.8], [13, 5.2]], 4.2, goldD, 0.2);   // engraved panels either side of the medallion
      both((s) => { for (let i = 0; i < 3; i++) { B(-4.4 + i * 1.8, s * 2.34, 7, 0.3, 0.1, 2.6, goldL); B(8.6 + i * 1.6, s * 2.34, 7, 0.3, 0.1, 2.6, goldL); } });   // scroll lines
      pinT(-6, 5, 4.2, 1, goldL); pinT(13, 5.2, 4.2, 1, goldL);
      E(rect(-27, 2.2, -25.8, 10.2), 4.2, gold, { bevel: 0.3 }); both((s) => E(star(-15, 6.6, 2), 0.2, gold, { y: s * 2.04, bevel: 0.04 }));   // gold butt plate, star inlay in the ivory
      slotsS(46.4, 49.6, 7.2, 3.42, 3, 1.6, 0.5); Ring(32.4, 7.2, 3.4, 0.6, goldL); Ring(45.8, 7.2, 3.7, 0.4, goldL);
      into(vm.MagRoot, () => { for (let i = 0; i < 3; i++) Ty(0.3 + i * 0.5, -3 - i * 3, 1.6, 3.3, goldL); });   // gold showing through the magazine
      break;
    }
    // ---------------------------------------------------------------- SHOTGUNS
    case 'Sawbuck': {
      both((s) => { for (let i = 0; i < 3; i++) B(-2.6 + i * 2.2, s * 2.82, 6 + i * 0.5, 1.6, 0.1, 0.25, SL, R(0, 0, 0)); B(4.6, s * 2.82, 5, 2.4, 0.1, 0.25, SL); });   // scroll engraving
      both((s) => { Ty(-3.4, 8.6, 1, 0.3, SL, s * 2.9); Ty(5.6, 9.6, 0.8, 0.3, SL, s * 2.9); });
      on('barrels', () => {
        E(rect(20.4, 6.2, 21.8, 10.8), 8.2, SD, { bevel: 0.25 });                                    // band holding the barrels together
        both((s) => { Ring(35.7, 8.4, 4.3, 0.5, SL, 0, s * 2); });
        E([[8.6, 3.5], [11.4, 3.5], [11, 4.1], [9, 4.1]], 2, SL, { bevel: 0.15 });                    // forend latch
        swivel(22, 4.1);
      });
      both((s) => T(8.02, 8.22, 1.1, 8.4, BK, s * 2));                                               // firing-pin holes in the breech face
      E([[-5.6, 10.1], [-3.4, 10.5], [-3.4, 11], [-5.6, 10.6]], 1.2, SL, { bevel: 0.1 });               // tang safety
      break;
    }
    case "Homesteader": {
      pinT(-1, 5.4, 4.6, 1); pinT(4.6, 5, 4.6, 1); both((s) => Ball(-3.4, s * 2.34, 6.6, 1.1, PAL.red));   // trigger-group pins, cross-bolt safety
      plate([[-4.6, 4.2], [-4.6, 6.4], [6.4, 6.4], [6.4, 4.2]], 4.6, dk(S, 0.82), 0.2);
      T(45.2, 46.2, 3.4, 5, SD); crown(50.3, 8.6, 3.5, SD); Ring(14.6, 8.6, 4.3, 0.7, SL);
      E(rect(40.6, 5.4, 41.6, 8.4), 1.6, SD, { bevel: 0.1 });                                          // barrel clamp
      on('pump', () => { both((s) => B(26, s * 3.06, 5, 9, 0.14, 0.5, WD)); T(18.6, 19.2, 6.3, 5, SD); T(32.8, 33.4, 6.3, 5, SD); });
      both((s) => { for (let i = 0; i < 4; i++) B(-13 - i * 1.3, s * 2.34, 5.6 - i * 0.5, 0.3, 0.12, 3.4, WD); });
      both((s) => { B(2.6, s * 2.36, 8, 4.4, 0.12, 2, BR); B(2.6, s * 2.42, 8, 3.4, 0.1, 0.3, SD); });                          // brass maker's plate
      break;
    }
    case 'Stampede': {
      groove(-7.6, 19.6, 7, 5.62, dk(Accent, 0.5), 0.3);
      plate([[3, 3.8], [3, 6.4], [11, 6.4], [11, 3.8]], 5.6, dk(Accent, 0.72), 0.3);
      pinT(-5.6, 5, 5.6, 1.1); pinT(18, 5, 5.6, 1.1); both((s) => { B(-2.4, s * 2.86, 8, 1.8, 0.2, 0.5, BN); });
      both((s) => { for (let i = 0; i < 4; i++) B(-5.6 + i * 1.5, s * 2.84, 9.4, 0.4, 0.12, 2.4, BN); B(-3.4, s * 2.86, 9.4, 7, 0.12, 0.4, BN, R(-24, 0, 0)); });   // a tally of five scratched in the receiver
      slotsS(31.4, 39, 7.6, 4.22, 4, 1.2, 1); crown(40.3, 7.6, 4, SD); Ring(20.4, 7.6, 6.9, 0.6, SL); Ring(29.8, 7.6, 6.9, 0.5, SL);
      both((s) => B(-16, s * 2.52, 7.2, 9, 0.14, 0.4, dk(Accent, 0.5))); E([[-10, 10.8], [-20, 10.6], [-20, 11.6], [-11, 11.8]], 4, BK, { bevel: 0.5 });   // cheek pad
      both((s) => { for (let i = 0; i < 3; i++) B(15.9 - i * 0.1, s * 1.72, 1.6 - i * 1.6, 3, 0.14, 0.35, SD); });
      break;
    }
    case "Dragon's Breath": {
      const ember = C(0xFF7A1A), scale = dk(Accent, 0.7);
      both((s) => { for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) E([[-4.4 + i * 2.6 + (r % 2) * 1.3, 5 + r * 1.8], [-3.1 + i * 2.6 + (r % 2) * 1.3, 6.2 + r * 1.8], [-1.8 + i * 2.6 + (r % 2) * 1.3, 5 + r * 1.8]], 0.2, r % 2 ? scale : Accent, { y: s * 2.44, bevel: 0.04 }); });   // scales
      both((s) => Ball(9.6, s * 2.5, 9, 1.5, ember, 2.2));                                           // eyes
      rivets(13.6, 34.6, 10.7, 4.7, 6, 0.7, SL);
      for (let i = 0; i < 4; i++) E([[-8.6 + i * 0.2, 9.6 - i * 1.2], [-11.4, 8.9 - i * 1.2], [-8.6 + i * 0.2, 8.4 - i * 1.2]], 1.2, BN, { bevel: 0.15 });   // spines down the back
      for (let i = 0; i < 3; i++) B(-2 - Math.tan(d2r(20)) * (3 + i * 2.8), 0, 4.2 - (3 + i * 2.8), 6.3, 4.7, 0.8, C(0x3a1a14));   // leather wrap
      Ring(12.4, 8.4, 4.6, 0.7, SL); Ring(33, 4.8, 3.6, 0.5, SL);
      on('pump', () => { T(15.4, 16, 6.6, 4.8, SD); T(28, 28.6, 6.6, 4.8, SD); });
      pinT(-1, 5.4, 4.8, 1); pinT(6, 5, 4.8, 1);
      break;
    }
    // ---------------------------------------------------------------- LMGs
    case 'Iron Mule': {
      rivets(-6.6, 20.6, 4.6, 7.04, 7, 0.9, SL); rivets(-6.6, 20.6, 11, 7.04, 7, 0.9, SL);
      plate([[-4, 5.6], [-4, 10], [8, 10], [8, 5.6]], 7, dk(Accent, 0.78), 0.2);
      B(10, 3.56, 8, 8, 0.14, 2.6, BK);                                                               // ejection port on the right
      E([[-2, 10.6], [14, 10.6], [14, 11.6], [-2, 11.6]], 7.6, dk(Accent, 0.6), { bevel: 0.2 });        // feed tray lip under the cover
      T(22, 44, 1.8, 5.2, S); Ring(44.4, 6.6, 6.4, 0.9, SD); Ring(22.6, 8, 4.6, 0.8, SL); crown(58.3, 8, 4.4, SD);   // gas tube and block
      slotsS(54.6, 57.6, 8, 4.82, 3, 2.2, 0.5);
      E([[-28.4, 2], [-27, 2], [-27, 0.4], [-30.6, -0.6], [-30.6, 0.4], [-28.4, 0.8]], 5, SD, { bevel: 0.2 });   // shoulder rest
      into(vm.MagRoot, () => {
        E(rect(-6.6, -6.4, 6.6, -4.4), 7.2, C(0xD8C24A), { y: -3, bevel: 0.1 });                     // stencil stripe
        both((s) => B(0, -3 + s * 3.6, -1.4, 3, 0.3, 1.6, SL)); E([[-3, 0.6], [3, 0.6], [2.4, 2], [-2.4, 2]], 1, SD, { y: -3, bevel: 0.2, holes: [rect(-1.8, 0.9, 1.8, 1.5)] });   // latches and carry handle
      });
      pinT(-4.6, 6, 7, 1.2); pinT(16, 5, 7, 1.2);
      break;
    }
    case 'Thresher': {
      for (const x of [-6.6, 3, 12.6]) E(rect(x - 0.7, 2.4, x + 0.7, 12.2), 8.5, BR, { bevel: 0.2 });   // brass straps round the breech
      rivets(-6.6, 12.6, 4, 8.52, 5, 0.9, SL); rivets(-6.6, 12.6, 10.8, 8.52, 5, 0.9, SL);
      both((s) => { B(-1.8, s * 4.06, 7.4, 6.4, 0.14, 3.4, BK); B(-1.8, s * 4.12, 7.4, 5.6, 0.14, 2.6, BR); });   // maker's plate
      into(vm.SpinPart, () => { T(21.6, 22.4, 10.2, 0, SD); for (let i = 0; i < 6; i++) { const a = d2r(i * 60); T(22.3, 22.6, 1.5, Math.sin(a) * 3.3, BK, Math.cos(a) * 3.3); } T(-10, -9, 9.8, 0, PAL.steel); T(9.6, 10.6, 9.8, 0, PAL.steel); });   // muzzle plate with six bores, extra clamps
      into(vm.MagRoot, () => { for (let i = 0; i < 6; i++) { const a = d2r(i * 60); both((s) => B(Math.cos(a) * 2.2, s * 2.74, Math.sin(a) * 2.2, 0.4, 0.14, 1.8, PAL.steelD, R(0, 0, 0))); } Ty(0, 0, 1.6, 5.9, SL); });
      E([[14, 3.4], [18, 3.4], [18, 5], [14, 6]], 5, SD, { bevel: 0.4 });                              // yoke under the barrels
      on('crank', () => Ball(10, -14.4, 1, 2.4, PAL.wood));
      break;
    }
    // ---------------------------------------------------------------- SNIPERS
    case 'Widowmaker': {
      flutes(16, 60, 8.2, 2.9, 6, BK); crown(70.2, 8.2, 3.8, SD); Ring(14.4, 8.2, 4.6, 0.6, SL); Ring(65.6, 8.2, 4.2, 0.4, SL);
      both((s) => { for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) Ball(-9.6 + i * 1.3 - j * 0.5, s * 2.32, 5 - j * 1.4, 0.6, C(0x34343c)); });   // stippled grip
      both((s) => { for (let i = 0; i < 4; i++) B(14 + i * 4, s * 2.32, 5, 2.4, 0.14, 0.7, C(0x34343c)); });      // forend vents
      screw(-1, 4.2, 4.7, 1, SL); screw(12, 4.4, 4.7, 1, SL); swivel(26, 3.5); swivel(-28, 0.6);
      both((s) => Ty(-33, 4.4, 1.2, 0.3, SL, s * 2.32));                                             // butt-pad adjuster
      on('bolt', () => { T(-10.8, -10.2, 2.6, 8.2, SL); for (let i = 0; i < 3; i++) Ring(-8.6 + i * 1.2, 8.2, 3.3, 0.3, SD); });   // cocking piece, grooved shroud
      into(vm.MagRoot, () => E(rect(-3.4, -4.6, 3.4, -3.9), 3.6, SL, { bevel: 0.1 }));
      E(rect(-30, 11, -20, 11.4), 3.6, BK, { bevel: 0.1 });
      break;
    }
    case 'Railroad Spike': {
      hose([[-2, -2.9, 9], [8, -3.1, 11.6], [20, -2.6, 12]], 1, C(0x1c1c22)); hose([[-4, 2.9, 5], [10, 3.1, 3.6], [22, 2.4, 3.4]], 0.9, C(0x1c1c22));   // power cables
      for (let i = 0; i < 6; i++) both((s) => { Ball(22.6 + i * 7.4, s * 2.34, 11.2, 0.8, SL); Ball(22.6 + i * 7.4, s * 2.34, 3.8, 0.8, SL); Ball(24.4 + i * 7.4, s * 2.34, 11.2, 0.8, SL); Ball(24.4 + i * 7.4, s * 2.34, 3.8, 0.8, SL); });   // clamp bolts
      both((s) => { for (let i = 0; i < 5; i++) B(-6 + i * 2.2, s * 2.84, 4.4, 1.3, 0.12, 0.9, i % 2 ? BK : C(0xE8C020)); });   // hazard stripe
      for (let i = 0; i < 6; i++) B(-6 + i * 1.6, 0, 11.4, 0.5, 4.6, 0.9, SD);                         // heat-sink fins
      both((s) => { Ty(12, 7.4, 3.2, 0.3, BK, s * 2.86); Ty(12, 7.4, 2.4, 0.3, BN, s * 2.92); B(12.5, s * 3, 7.9, 0.3, 0.1, 1.6, PAL.red, R(0, 0, 0)); });   // charge gauge
      T(64.6, 66.4, 6, 7.5, SD); both((s) => B(66.2, 0, 7.5 + s * 2.6, 2.4, 2.4, 0.8, S));                // rail tips
      E([[-28.4, 3.4], [-27, 3.4], [-27, 9.8], [-28.4, 9.8]], 4.8, PAL.rubber, { bevel: 0.3 });
      pinT(-5, 5, 5.6, 1.1); pinT(15, 5, 5.6, 1.1);
      break;
    }
    // ---------------------------------------------------------------- LAUNCHERS
    case 'Dynamite Dan': {
      for (const x of [9, 14.5, 26, 31]) Ring(x, 9, 11, 0.5, PAL.steel); rivets(6, 34, 9, 10.6, 6, 1, BR);
      E([[2.6, 12.4], [5.4, 12.4], [5.4, 14.2], [2.6, 14.2]], 3, BR, { bevel: 0.3 }); Ty(4, 14.2, 1.4, 3.6, SL);   // top hinge
      E([[4, 3.2], [7, 3.2], [7, 4.6], [4, 4.6]], 2.4, BR, { bevel: 0.3 }); Ball(5.5, 0, 2.9, 1.3, SL);          // latch
      E([[10, 13.6], [12.4, 13.6], [12.4, 14.4], [10, 14.4]], 2.2, SD, { bevel: 0.1 }); both((s) => { for (let i = 0; i < 3; i++) B(12.9, s * 0.6, 15 + i * 1, 0.2, 0.5, 0.2, BN); });
      Ty(-18, 10, 3.4, 5.4, C(0xe8d8b0)); Ty(-18, 10, 4.2, 0.6, SD, -2.8); Ty(-18, 10, 4.2, 0.6, SD, 2.8); hose([[-18, 0, 11.6], [-8, 0.6, 12.6], [3, 0, 13.6]], 0.5, C(0xe8d8b0));   // fuse-cord reel on the stock, fed forward
      both((s) => { for (let i = 0; i < 3; i++) B(17.8 - i * 0.1, s * 1.72, 1.4 - i * 1.6, 3.2, 0.14, 0.35, WD); });
      E(rect(-29.8, 0.8, -29.2, 9), 5.4, BR, { bevel: 0.1 });
      both((s) => E(star(-14, 5.6, 2), 0.2, Accent, { y: s * 2.54, bevel: 0.04 }));
      break;
    }
    case 'Boomtown': {
      for (const x of [-12, 20, 28]) Ring(x, 9.6, 7.9, 0.7, SD); for (const x of [16, 24]) T(x, x + 1.4, 7.6, 9.6, C(0xD8C24A));   // bands and yellow warning rings
      for (let i = 0; i < 6; i++) { const a = d2r(i * 60); T(-5.4, 11.4, 0.5, 9.6 + Math.sin(a) * 4.5, WD, Math.cos(a) * 4.5); }   // slats in the wooden heat shield
      E([[-12, 5.6], [-8, 5.6], [-8.6, 3.2], [-13.4, 2.6]], 4, PAL.rubber, { bevel: 0.8 });           // shoulder rest
      E([[1.6, 4.4], [11, 4.4], [11, 6.2], [1.6, 6.2]], 4.4, SD, { bevel: 0.3 }); pinT(3, 5.2, 4.4, 1); pinT(9.6, 5.2, 4.4, 1);   // trigger housing
      swivel(-14, 6.2); swivel(30, 6.2);
      both((s) => { for (let i = 0; i < 3; i++) B(17.9 - i * 0.1, s * 1.82, 2.4 - i * 1.6, 3.4, 0.14, 0.35, WD); });
      T(8.4, 9.2, 2.6, 16.6, SD, -3.6); Ty(8.8, 13.6, 1.2, 1.6, SL, -3.6);
      break;
    }
    case 'Fireworks Finale': {
      const hot = [C(0xFFE27A), C(0x4AD0FF), C(0x7CFF6A), C(0xFF5A4A)]; let k = 0;
      for (const y of [-2.3, 2.3]) for (const z of [11.2, 6.6]) { T(26.8, 27.3, 4.7, z, hot[k++ % 4], y, 0.5); }   // bright ring round each mouth
      for (const x of [-2, 9, 20]) { E(rect(x, 4, x + 1.4, 13.8), 9.9, BN, { bevel: 0.1 }); E(rect(x + 1.4, 4, x + 2.4, 13.8), 9.9, C(0x4AD0FF), { bevel: 0.1 }); }   // candy bands round the pod
      for (const x of [-8.6, 26.4]) for (const z of [4, 14]) both((s) => Ball(x, s * 5.1, z, 1.2, SL));
      hose([[-3, 3.6, 14.8], [-8, 4.4, 15.2], [-11, 3.6, 12.4], [-9.4, 3, 9]], 0.5, BN);                      // master fuse trailing off the back
      E([[8, 14.4], [18, 14.4], [18, 16.4], [16.6, 16.4], [16.6, 15.4], [9.4, 15.4], [9.4, 16.4], [8, 16.4]], 1.4, SD, { bevel: 0.2 });   // carry handle
      both((s) => { for (let i = 0; i < 3; i++) B(17.9 - i * 0.1, s * 1.82, 1.4 - i * 1.6, 3.4, 0.14, 0.35, SD); });
      break;
    }
    // ---------------------------------------------------------------- ENERGY
    case 'Tesla Coil': {
      for (const x of [-8.4, 11.6]) for (const z of [3.8, 10.2]) { both((s) => { B(x, s * 2.86, z, 2.4, 0.16, 2.4, BR); Ball(x, s * 2.96, z, 0.8, SD); }); }   // brass corner brackets
      both((s) => { Ty(2, 7, 3.4, 0.3, BK, s * 2.86); Ty(2, 7, 2.6, 0.3, BN, s * 2.94); B(2.4, s * 3.04, 7.5, 0.3, 0.1, 1.5, PAL.red); });   // voltmeter
      slotsS(-6, -1, 7, 5.62, 4, 3, 0.4, WD);
      hose([[-2, 0, 15], [3, 1.4, 16.4], [9, 1.2, 13], [13, 0.6, 10]], 0.5, C(0xC06A30)); hose([[5, 0, 15], [8, -1.4, 16], [12, -1.2, 12.4], [14, -0.6, 9.6]], 0.5, C(0xC06A30));   // copper leads from the valves
      T(19.4, 20.4, 5.6, 7, BN); T(37.6, 38.4, 5.6, 7, BN);                                           // porcelain insulators
      E([[-6, 11], [-2.6, 11], [-2.6, 11.6], [-6, 11.6]], 2.4, SD, { bevel: 0.1 }); E([[-5.6, 11.6], [-4.8, 11.6], [-3, 14.2], [-3.8, 14.2]], 0.6, BR, { bevel: 0.1 }); Ball(-3.2, 0, 14.4, 1.3, BK);   // knife switch
      for (let i = 0; i < 4; i++) { const a = d2r(i * 90 + 45); Ball(40, Math.cos(a) * 4.7, 7 + Math.sin(a) * 4.7, 1.1, SD); }
      break;
    }
    case "Will-o'-Wisp": {
      for (const x of [8.4, 29.6]) for (let i = 0; i < 6; i++) { const a = d2r(i * 60); Ball(x, Math.cos(a) * 4.9, 8 + Math.sin(a) * 4.9, 1, PAL.steelL); }   // rivets round the lantern caps
      Ring(15, 8, 8.9, 0.4, BR); Ring(23, 8, 8.9, 0.4, BR);
      for (let i = 0; i < 3; i++) Ty(19 + (i - 1) * 0.2, 17.6 + i * 1.5, 1.7, 0.4, BR);                    // chain links above the carry ring
      both((s) => { E([[-6, 5], [-4, 7.6], [-6, 8.6], [-3, 8.2], [-1, 5.6], [-3.4, 6.2]], 0.2, Accent, { y: s * 2.34, bevel: 0.04, glow: 1.2 }); E([[2, 5], [4.4, 5], [5.6, 8.6], [3.6, 6.4], [1.6, 8.6]], 0.2, Accent, { y: s * 2.34, bevel: 0.04, glow: 1.2 }); });   // glowing runes
      slotsS(31, 33.4, 8, 9.2, 2, 2.6, 0.5, BK);
      both((s) => { Tz(-14, 5.4, 8.6, 1.6, C(0xbff7ea), s * 2.5, 0.3); Tz(-14, 8.6, 9.2, 1, BR, s * 2.5); });      // vials on the stock
      pinT(-5, 5, 4.6, 1, BR); pinT(5.6, 5, 4.6, 1, BR);
      break;
    }
    case 'Frostbite Beam': {
      const hoseC = C(0x7fb6d8);
      hose([[4, -2.4, 12.6], [10, -3.2, 12], [16, -3, 9], [20, -1.6, 7.6]], 0.9, hoseC); hose([[4, 2.4, 12.6], [12, 3.2, 10.6], [18, 2.2, 8]], 0.9, hoseC);   // coolant lines
      groove(-7.6, 15.6, 6.4, 5.42, C(0x9aa8b6), 0.3); plate([[8, 3.6], [8, 6], [15.6, 6], [15.6, 3.6]], 5.4, C(0xD2DAE2), 0.24);
      both((s) => { for (let i = 0; i < 3; i++) E([[-5 + i * 2.6, 7.6], [-3.8 + i * 2.6, 9.6], [-2.6 + i * 2.6, 7.6], [-3.4 + i * 2.6, 7.6], [-3.8 + i * 2.6, 8.4], [-4.2 + i * 2.6, 7.6]], 0.2, Accent, { y: s * 2.74, bevel: 0.04, glow: 0.8 }); });   // chevrons
      slotsS(-7, -3, 5, 5.42, 3, 1.4, 0.5, C(0x9aa8b6));
      for (const x of [17.4, 38.4]) T(x, x + 0.8, 5.4, 7, PAL.steel);
      for (let i = 0; i < 4; i++) { const a = d2r(i * 90 + 45); E([[38.6, 0], [42.4, 0], [40, 2.6]], 0.4, C(0xDFF6FF), { bevel: 0.08, glow: 0.8 }).position.add(new THREE.Vector3(Math.cos(a) * 1.8, 7 + Math.sin(a) * 1.8, 0)); }   // frost fins round the emitter
      pinT(-5, 5, 5.4, 1); pinT(13, 5, 5.4, 1); Ty(4, 12.6, 1.6, 5.4, PAL.steelD);
      break;
    }
    case 'Hellfire Hose': {
      hose([[10, -3.9, 0.6], [15, -3.6, 3.4], [16, -2.4, 6]], 1.3, BK); hose([[10, 3.9, 0.6], [15, 3.6, 3.4], [16, 2.4, 6]], 1.3, BK);   // fuel lines up from the tanks
      both((s) => { T(-13.6, -12.8, 4, -1.6, BR, s * 3.9); Ball(13.6, s * 3.9, -1.6, 2.2, BR); Ring(-6, -1.6, 7.9, 0.6, SD, 0, s * 3.9); Ring(6, -1.6, 7.9, 0.6, SD, 0, s * 3.9); });   // tank caps and straps
      both((s) => { for (let i = 0; i < 4; i++) B(-6 + i * 2, s * 2.52, 5.2, 1.2, 0.12, 1, i % 2 ? BK : C(0xE8C020)); });   // hazard stripe
      plate([[-6, 6.6], [-6, 9.4], [8, 9.4], [8, 6.6]], 5, C(0x6E2014), 0.22); rivets(-5, 7, 8, 5.5, 5, 0.8, SL);
      hose([[44, 0.6, 3.6], [36, 1.8, 3], [28, 1.6, 4.4]], 0.6, BR); Ring(30.4, 7, 5.6, 0.5, SL); Ring(14.4, 7, 5.6, 0.6, SL);
      Tz(4, 12, 12.6, 3.4, PAL.red); for (let i = 0; i < 4; i++) { const a = d2r(i * 90); B(4 + Math.cos(a) * 1.4, Math.sin(a) * 1.4, 12.5, 1.4, 0.5, 0.3, PAL.red, R(0, i * 90, 0)); }   // red valve wheel
      both((s) => { for (let i = 0; i < 3; i++) B(23.9 - i * 0.1, s * 1.72, 2.4 - i * 1.6, 3.2, 0.14, 0.35, SD); });
      break;
    }
    // ---------------------------------------------------------------- WONDER
    case 'Buzzsaw': {
      const yel = C(0xC8A020), yd = dk(yel, 0.7);
      for (let i = 0; i < 5; i++) { const a = d2r(40 + i * 35); Ball(34 + Math.cos(a) * 12.5, -1.6, 7.4 + Math.sin(a) * 12.5, 1.1, SL); Ball(34 + Math.cos(a) * 12.5, 1.6, 7.4 + Math.sin(a) * 12.5, 1.1, SL); }   // bolts round the guard
      both((s) => { for (let i = 0; i < 4; i++) E([[2 + i * 2.6, 5], [3.4 + i * 2.6, 5], [4.6 + i * 2.6, 7.4], [3.2 + i * 2.6, 7.4]], 0.2, BK, { y: s * 3.24, bevel: 0.04 }); });   // hazard chevrons
      plate([[-6.4, 4.6], [-6.4, 9.8], [0.6, 9.8], [0.6, 4.6]], 6.4, yd, 0.24); rivets(-5.4, -0.4, 5.2, 6.9, 3, 0.8, SL); rivets(-5.4, -0.4, 9.2, 6.9, 3, 0.8, SL);
      T(-6, -5, 1.6, 12.6, SL, 3.4); hose([[-5.4, 3.4, 12.6], [-2, 3.8, 14.6], [2, 3.4, 13.6]], 0.5, BK); E([[1.4, 12.6], [3.6, 12.6], [3.6, 14.6], [1.4, 14.6]], 1.6, PAL.red, { y: 3.4, bevel: 0.4 });   // pull-start cord and handle
      T(6, 11, 2.2, 4.2, SD, 3.6); T(11, 11.6, 2.8, 4.2, SL, 3.6);                                        // exhaust stub
      E([[14, 6], [24, 6.2], [24, 8], [14, 8.2]], 4.4, SL, { bevel: 0.2 });                                 // bare steel arm to the arbor
      pinT(18, 7.1, 4.4, 1.2, SD); pinT(21.6, 7.1, 4.4, 1.2, SD);
      both((s) => { for (let i = 0; i < 3; i++) B(-14 - i * 2.4, s * 2.52, 7.2, 1.2, 0.14, 2.6, C(0x2a2a30)); });
      break;
    }
    case 'Thunderhead': {
      const gold = C(0xC8782E), goldD = C(0x8A4E1C); gold.metal = 1; goldD.metal = 0.9;
      for (let i = 0; i < 6; i++) B(-5 + i * 1.7, 0, 14.6, 0.5, 4.6, 0.9, PAL.steelD);                                    // cooling fins
      both((s) => { Ty(15.4, 5.2, 2.6, 0.3, PAL.black, s * 3.14); Ty(15.4, 5.2, 1.9, 0.3, PAL.bone, s * 3.2); B(15.8, s * 3.3, 5.6, 0.3, 0.1, 1.2, PAL.red); });   // charge gauge
      for (const x of [-7.6, 17.6]) for (const z of [5.2, 13]) both((s) => { E([[x - 1.2, z - 1.2], [x + 1.2, z - 1.2], [x + 1.2, z + 1.2], [x - 1.2, z + 1.2]], 0.3, gold, { y: s * 3.14, bevel: 0.05, glow: 0.2 }); Ball(x, s * 3.3, z, 0.9, goldD); });   // copper corner brackets
      both((s) => E([[-6.6, 12.6], [16.6, 12.6], [16.6, 13.4], [-6.6, 13.4]], 0.2, gold, { y: s * 3.14, bevel: 0.04, glow: 0.3 }));
      rivets(19, 29, 9, 5.1, 4, 0.9, goldD); crown(30.2, 9, 5.2, goldD);
      both((s) => { for (let i = 0; i < 3; i++) B(-14 - i * 2.2, s * 2.32, 5.6 - i * 1.4, 0.3, 0.12, 3.2, BK); });
      break;
    }
    case "Fan of Knives": {
      for (const x of [-8.4, 20.4]) for (const z of [3.6, 11]) both((s) => { B(x, s * 2.86, z, 2.6, 0.16, 2.2, BR); Ball(x, s * 2.98, z, 0.8, SD); });   // brass corners
      Ty(23.4, 5, 2.2, 5.8, BR); Ty(23.4, 5, 1.4, 6.2, SD);                                              // roller at the mouth
      both((s) => { for (let i = 0; i < 3; i++) B(-13 - i * 2.2, s * 2.32, 6.4, 0.3, 0.12, 3, BR); });
      E(rect(-25.2, 4, -23.8, 9.8), 4.8, BR, { bevel: 0.2 });
      pinT(-5, 5, 5.6, 1, BR);
      break;
    }
    case 'Black Cat': {
      const eye = C(0x7CFF4A), gold = C(0xE8B62A); gold.metal = 1;
      for (const x of [61, 64, 67, 70]) Ring(x, 8.2, 5, 0.3, C(0x2c2c36)); T(72, 72.6, 4.2, 8.2, C(0x2c2c36)); Ring(14.4, 8.2, 4.6, 0.6, C(0x2c2c36));   // suppressor bands
      Ring(-0.6, 8.2, 5, 0.9, PAL.red); Ball(-0.6, 0, 5.4, 1.6, gold);                                    // collar and bell
      both((s) => { Ball(-20, s * 2.22, 5.2, 1.6, C(0x3a3a46)); for (let i = 0; i < 3; i++) Ball(-21.6 + i * 1.6, s * 2.22, 7.2, 0.9, C(0x3a3a46)); });   // paw print in the stock
      both((s) => { for (let i = 0; i < 3; i++) B(16 + i * 1.6, s * 2.22, 5, 0.3, 0.12, 2.4, C(0x3a3a46), R(0, 0, 0)); });   // claw marks on the forend
      on('bolt', () => { for (let i = 0; i < 3; i++) Ring(-8.6 + i * 1.2, 8.2, 3.3, 0.3, C(0x3a3a46)); });
      screw(-1, 4.2, 4.5, 1, C(0x3a3a46)); swivel(24, 3.5, C(0x3a3a46));
      both((s) => E([[2, 5.2], [3.4, 6.4], [4.8, 5.2], [3.4, 4.2]], 0.2, BK, { y: s * 2.36, bevel: 0.02 }));
      break;
    }
    default: break;
  }
  // --- vault tier hardware: every gun has its own three upgrades (I, II, III), built on top of the re-finish ----
  if (tier > 0) {
    const gold = C(0xF2C43A), g = C(TIER_GLOW[tier]), M = Muzzle, mx = Muzzle.X, mz = Muzzle.Z;
    const Spike = (x, y, z, h, col, glow = 0, d = 1.3) => vm.Part(cur, 3, V(x, y + oy, z + h / 2), V(d, d, h), col, null, glow);
    const both = (fn) => { fn(-1); fn(1); };
    const t2 = tier >= 2, t3 = tier >= 3;
    switch (N) {
      case 'Tin Star':
        both((s) => E(star(mx - 3, mz, 3), 0.4, gold, { y: s * 1.9, bevel: 0.05, glow: 0.6 }));                        // I star muzzle plates
        if (t2) { T(9, 19, 4.6, 7.4, PAL.steel); Ring(19, 7.4, 5.6, 0.8, g, 2.2); }                                     // II bull barrel sleeve
        if (t3) { Ring(4, 6.6, 10.4, 0.9, g, 2.6); E(star(-8.6, 11.4, 2.6, 8, 0.6), 0.5, gold, { bevel: 0.1, glow: 1 }); }   // III glowing cylinder, spur hammer
        break;
      case 'Saloon Six':
        scope(1, 13, 12.4, 2.4, PAL.steelD, g);                                                                        // I pistol scope
        if (t2) E(rect(24, 3, 31.4, 5.6), 3, gold, { bevel: 0.5, glow: 0.4 });                                          // II barrel weight
        if (t3) for (let i = 0; i < 4; i++) Spike(14 + i * 4, 0, 9.6, 2.6, g, 2.6, 1);                                  // III vent flames along the rib
        break;
      case 'Copperhead':
        B(-5, 0, -19, 4, 2.8, 7, gold, R(-12, 0, 0), 0.4);                                                             // I extended magazine
        if (t2) { Ty(5, 7.6, 7.4, 1.6, gold, 3, 0.5); Ty(5, 7.6, 3, 2, PAL.black, 3); }                                 // II side drum
        if (t3) { T(15, 23, 2.2, 10.2, gold, 0, 0.8); Ring(22, 8.8, 7, 0.7, g, 2.4); }                                  // III second barrel
        break;
      case 'Sidewinders':
        both((s) => Cone(mx + 1.6, mz + s * 1.3, 1.1, 3.4, PAL.bone, true));                                           // I fangs
        if (t2) for (let i = 0; i < 4; i++) Ring(3 + i * 3.2, 7.6, 5.6, 0.9, C(0x4ad06a), 1.2);                         // II coiled snake
        if (t3) both((s) => Ball(13, s * 2, 9.4, 1.5, C(0xff3030), 3));                                                 // III red eyes
        break;
      case 'Back-Alley':
        T(15, 24, 3, 3.2, PAL.black); T(24, 24.6, 3.2, 3.2, C(0xfff0a0), 0, 3);                                         // I taped-on torch
        if (t2) for (let i = 0; i < 5; i++) Spike(23 + i * 2.4, 0, 9, 2.6, PAL.steelL);                                 // II nails through the jacket
        if (t3) { for (let i = 0; i < 6; i++) Ring(-6 + i * 4.6, 7, 6.8, 0.5, g, 2.2); }                                // III live wire wrap
        break;
      case "Hornet's Nest":
        Cone(mx + 2.6, mz, 2.2, 6, gold, true, 0, 0.6);                                                                // I stinger muzzle
        if (t2) both((s) => E([[2, 9], [12, 11], [20, 16], [8, 14], [-4, 12]], 0.3, C(0xdff6ff), { y: s * 3.4, bevel: 0.05, glow: 0.8 }));   // II wings
        if (t3) { Ty(11, -2.4, 16, 3.4, C(0xFFD23A), 0, 1.4); for (let i = 0; i < 3; i++) Ty(11, -2.4, 16.6, 0.5, PAL.black, -1.2 + i * 1.2); }   // III honeycomb drum
        break;
      case 'Rustler':
        both((s) => E(star(12, 7.6, 2, 4, 0.5), 0.3, gold, { y: s * 2.2, bevel: 0.04, glow: 0.8 }));                    // I gold throwing stars
        if (t2) for (let i = 0; i < 4; i++) B(22 + i * 3.4, 0, 9.6, 2.4, 0.3, 3.4, PAL.steelL, R(0, 0, (i - 1.5) * 16), 0.2);   // II fins on the suppressor
        if (t3) { Ring(36, 7, 7.4, 0.8, g, 2.6); B(2, 0, 12.4, 5, 3.4, 0.3, PAL.brass, null, 0.4); }   // III brass plate on top, glowing muzzle
        break;
      case 'Quarter Horse':
        E([[30, 6.2], [38, 6.2], [36, 2], [33, 2]], 2, PAL.brass, { bevel: 0.4 });                                      // I saddle ring / barrel band
        if (t2) { scope(0, 16, 12.6, 2.6, PAL.brass, g); }                                                              // II brass scope
        if (t3) { both((s) => E([[-24, 6], [-14, 8], [-18, 3]], 0.4, gold, { y: s * 2.5, bevel: 0.08, glow: 1 })); O(40, 49, 4, 8, gold); }   // III horseshoe inlay, gold barrel end
        break;
      case 'Lawman AR':
        E(star(-16, 6, 3.2), 5, gold, { bevel: 0.2, glow: 0.6 });                                                       // I badge in the stock
        if (t2) { E([[mx - 10, mz - 2], [mx + 6, mz - 2.4], [mx + 11, mz - 3.2], [mx + 5, mz - 4.6], [mx - 10, mz - 4]], 0.7, C(0xd8dce6), { bevel: 0.2 }); }   // II bayonet
        if (t3) { both((s) => B(22, s * 2.6, 7.2, 14, 0.3, 1, C(0x4a8cff), null, 2.4)); B(4, 0, 14.6, 3, 2, 1.2, PAL.red, null, 2.6); }   // III police lights
        break;
      case 'Long Rider':
        T(mx, mx + 8, 4.4, mz, PAL.black);                                                                             // I long brake
        if (t2) both((s) => E([[39, 5], [40.6, 5], [34, -6], [33, -5]], 1, gold, { y: s * 2.4, bevel: 0.2 }));           // II deployed bipod
        if (t3) { T(12, 16.4, 5, 13.2, PAL.steelD); T(16, 16.6, 4.4, 13.2, g, 0, 2.6); for (let i = 0; i < 5; i++) Ring(36 + i * 3.6, mz, 4.6, 0.5, g, 2.2); }   // III big objective lens, rifled glow
        break;
      case 'Gold Rush':
        for (let i = 0; i < 3; i++) Ball(16 + i * 5, 0, 10.6, 2, [C(0xFF4050), C(0xFFE060), C(0x60E060)][i], 1.6);      // I three gemstones
        if (t2) { E([[mx - 8, mz - 2], [mx + 6, mz - 2.4], [mx + 10, mz - 3.2], [mx + 5, mz - 4.4], [mx - 8, mz - 4]], 0.7, gold, { bevel: 0.2, glow: 0.3 }); }   // II gold bayonet
        if (t3) { for (let i = 0; i < 6; i++) Ty(9, -9 - i * 1.3, 6, 3.4, i % 2 ? gold : C(0xFFE27A), 0, 0.8); Cone(mx + 2.4, mz, 4.6, 5, gold, false, 0, 1.2); }   // III gold-bar magazine, trumpet muzzle
        break;
      case 'Sawbuck':
        both((s) => T(36, 44, 3.9, 8.4, PAL.steelD, s * 2));                                                            // I longer barrels
        if (t2) for (let i = 0; i < 4; i++) T(-16 + i * 3, -13 + i * 3, 2.6, 2.6, PAL.red, 2.6);                        // II shell loops on the stock
        if (t3) { both((s) => { T(44, 45, 4.6, 8.4, g, s * 2, 2.6); }); B(12, 0, 11.4, 14, 1.4, 0.6, gold, null, 1); }  // III glowing bores, gold rib
        break;
      case "Homesteader":
        T(50, 56, 3.2, 5, PAL.steel); T(44, 56, 3.2, 5, PAL.steel);                                                     // I magazine extension
        if (t2) { for (let i = 0; i < 5; i++) T(0 + i * 2.8, 2.6 + i * 2.8, 2.6, 11.6, i % 2 ? PAL.red : C(0x2a6ad0), 0); B(6.4, 0, 10.6, 15, 3, 0.5, PAL.black); }   // II shell saddle
        if (t3) { Cone(mx + 3, mz, 6.4, 5, gold, false, 0, 1); for (let i = 0; i < 4; i++) { const a = d2r(i * 90 + 45); Spike(mx + 1, Math.cos(a) * 3, mz + Math.sin(a) * 3 - 1.5, 3, PAL.bone, 0, 1); } }   // III breacher muzzle
        break;
      case 'Stampede':
        E(rect(20, 2.4, 38, 4.4), 3, PAL.steelD, { bevel: 0.3 });                                                       // I under rail
        if (t2) { Ty(7, -5, 15, 3.4, PAL.steelD, 6.6); Ty(7, -5, 6, 3.8, gold, 6.6, 0.5); }                             // II second drum
        if (t3) { for (let i = 0; i < 5; i++) B(-4 + i * 5, 0, 12.6, 3.4, 4, 0.3, PAL.brass, R(18, 0, 0), 0.3); Ring(mx - 2, mz, 7.6, 0.9, g, 2.6); }   // III brass heat plates on the rail
        break;
      case "Dragon's Breath":
        both((s) => E([[36, 10], [42, 15], [38, 10]], 0.6, PAL.bone, { y: s * 3, bevel: 0.1 }));                        // I horns
        if (t2) both((s) => E([[-2, 9], [10, 12], [2, 18], [0, 13], [-8, 15], [-6, 10]], 0.4, C(0xB0302A), { y: s * 3.2, bevel: 0.08 }));   // II wings
        if (t3) { both((s) => Ball(34, s * 2.6, 10.4, 1.6, C(0xFFE060), 3)); for (let i = 0; i < 5; i++) Spike(-4 + i * 4, 0, 10.8, 2.4 - Math.abs(i - 2) * 0.4, C(0xFF7A1A), 2); }   // III eyes and a spine of fire
        break;
      case 'Iron Mule':
        B(8, -8, -3, 14, 8, 12, C(0x4a5034));                                                                           // I bigger ammo box
        if (t2) { E([[24, 12], [30, 12], [30, 20], [28, 22], [24, 20]], 7, PAL.steelD, { bevel: 0.6 }); B(27, 0, 17, 0.6, 5, 2.4, PAL.black); }   // II gun shield
        if (t3) { fins(40, 54, 8, 6.4, 6, g); both((s) => B(4, s * 3.7, 8, 20, 0.3, 1.2, g, null, 2.4)); }              // III red-hot barrel
        break;
      case 'Thresher':
        Ty(2, 15, 10.4, 6, gold, 0, 0.4);                                                                               // I larger gold drum
        if (t2) { T(8, 14, 13.4, 7, PAL.brass); Ring(14, 7, 14.6, 1, gold, 0.6); }                                      // II barrel shroud
        if (t3) { for (let i = 0; i < 8; i++) { const a = d2r(i * 45); Ball(56.5, Math.cos(a) * 6, 7 + Math.sin(a) * 6, 1.3, C(0xFFB040), 2.6); } }   // III lanterns round the muzzle
        break;
      case 'Widowmaker':
        T(mx, mx + 10, 5, mz, PAL.black);                                                                               // I suppressor
        if (t2) { both((s) => E([[30, 5], [31.6, 5], [26, -5], [25, -4]], 1, PAL.steelD, { y: s * 2.4, bevel: 0.2 })); }   // II bipod
        if (t3) { for (let i = 0; i < 8; i++) both((s) => E([[-20 + i * 1.5, 2 + i * 0.4], [-19 + i * 1.5, 2 + i * 0.4], [-19 + i * 1.5, 7], [-20 + i * 1.5, 7]], 0.3, PAL.bone, { y: s * 2.4, bevel: 0.04 })); T(20.4, 21, 3.6, 12.8, PAL.red, 0, 2.6); }   // III kill tallies, red lens
        break;
      case 'Railroad Spike':
        for (let i = 0; i < 6; i++) Ty(23.5 + i * 7.4, 13.4, 2.4, 3, PAL.brass);                                        // I capacitor row
        if (t2) both((s) => { for (let i = 0; i < 3; i++) B(28 + i * 12, s * 3, 7.5, 8, 0.3, 0.8, g, null, 2.6); });     // II arc strips
        if (t3) { Ring(66, 7.5, 12, 1.1, g, 2.8); Ring(60, 7.5, 9, 0.8, C(0xdff6ff), 2.8); Ball(69, 0, 7.5, 2.6, C(0xdff6ff), 3); }   // III muzzle accelerator rings
        break;
      case 'Dynamite Dan':
        for (const z of [15.4, 17]) T(8, 20, 2.6, z, Accent, 0);                                                        // I spare sticks strapped on top
        if (t2) { Ring(14, 15.6, 5.4, 0.9, PAL.black); Tz(-2, 9.6, 13, 3.4, PAL.brass); Ball(-2, 0, 14, 2.4, PAL.red, 1.6); }   // II plunger detonator
        if (t3) { T(33, 40, 13.4, 9, PAL.steelD); for (let i = 0; i < 6; i++) { const a = d2r(i * 60); Spike(39, Math.cos(a) * 6, 9 + Math.sin(a) * 6 - 1.5, 3, gold, 1, 1.2); } }   // III mortar muzzle
        break;
      case 'Boomtown':
        E([[8, 13], [14, 13], [14, 21], [8, 21]], 3, PAL.steelD, { y: -3.6, bevel: 0.4 }); B(14.2, -3.6, 17, 0.4, 2.2, 2.2, g, null, 2.4);   // I targeting computer
        if (t2) for (const y of [-6.6, 6.6]) { T(-4, 14, 3.4, 9.6, C(0x4A5A3A), y); Cone(16.4, 9.6, 3.4, 4, Accent, true, y); }   // II side rockets
        if (t3) { both((s) => E([[-22, 9.6], [-12, 9.6], [-22, 18]], 0.6, PAL.red, { y: s * 5, bevel: 0.1 })); Ring(-16, 9.6, 11, 1, g, 2.6); }   // III tail fins and afterburner ring
        break;
      case 'Fireworks Finale':
        for (let i = 0; i < 6; i++) Spike(-6 + i * 6, 0, 17, 3, [C(0xFFD23A), C(0x4AD0FF), C(0x7CFF6A), C(0xFF5A4A)][i % 4], 1.6, 1.6);   // I sparkler row
        if (t2) both((s) => { T(-8, 26, 4.4, 18.4, Accent, s * 3.2); Cone(28.4, 18.4, 4.2, 5, C(0xFFD23A), true, s * 3.2, 0.6); });   // II two more tubes
        if (t3) { for (let i = 0; i < 8; i++) { const a = d2r(i * 45); Ball(31.6, Math.cos(a) * 7.4, 10.2 + Math.sin(a) * 7.4, 1.4, i % 2 ? C(0xFF6FAE) : C(0xFFF0A0), 2.8); } }   // III ring of fairy lights
        break;
      case 'Tesla Coil':
        Tz(16, 10, 16, 1.4, PAL.brass); Ball(16, 0, 16.6, 2.4, Accent, 2.6);                                            // I second spark post
        if (t2) { Ring(40, 7, 13.4, 1.4, PAL.brass); Ring(40, 7, 16, 0.6, g, 2.6); }                                    // II double toroid
        if (t3) { for (let i = 0; i < 4; i++) { const a = d2r(i * 90 + 45); T(40, 48, 0.9, 7 + Math.sin(a) * 4, C(0xdff6ff), Math.cos(a) * 4, 3); } Ball(49, 0, 7, 3, C(0xdff6ff), 3); }   // III arc cage
        break;
      case "Will-o'-Wisp":
        Ball(15, 0, 6.6, 3, Accent, 2.8);                                                                               // I a second wisp in the jar
        if (t2) { for (let i = 0; i < 3; i++) Ball(-12 - i * 4, 0, 11 + i * 1.6, 2 - i * 0.4, Accent, 2.6); }           // II wisps trailing off the stock
        if (t3) { Ring(34, 8, 13.6, 0.8, C(0xeafff8), 2.8); for (let i = 0; i < 6; i++) { const a = d2r(i * 60); Spike(38, Math.cos(a) * 5.4, 8 + Math.sin(a) * 5.4 - 1.5, 3, PAL.brass, 0.6, 1); } }   // III crowned bell
        break;
      case 'Frostbite Beam':
        for (let i = 0; i < 4; i++) Spike(18 + i * 5, 0, 9.4, 3.4 - i * 0.4, C(0xDFF6FF), 1.6, 1.6);                    // I icicles on the barrel
        if (t2) { Ty(-2, 12.6, 4.6, 4.4, PAL.steelL); Ty(-2, 12.6, 3.2, 4.8, Accent, 0, 1.2); }                         // II second coolant canister
        if (t3) { for (let i = 0; i < 6; i++) { const a = d2r(i * 60); vm.Part(cur, 3, V(45, Math.cos(a) * 3.4 + oy, 7 + Math.sin(a) * 3.4), V(1.6, 1.6, 7), C(0xDFF6FF), R(-90 + Math.sin(a) * 30, -Math.cos(a) * 30, 0), 2.4); } }   // III crystal cluster emitter
        break;
      case 'Hellfire Hose':
        Tz(-4, -1.6, 9, 1.6, PAL.brass, 3.9); Ty(-4, 9.6, 3.6, 1.2, PAL.steelL, 3.9);                                   // I pressure gauge pipe
        if (t2) { T(-12, 12, 6, -6.4, C(0xC8302A)); Ball(12, 0, -6.4, 6, C(0xC8302A)); Ball(-12, 0, -6.4, 6, C(0xC8302A)); }   // II third tank
        if (t3) { for (let i = 0; i < 6; i++) { const a = d2r(i * 60); Spike(49, Math.cos(a) * 3.6, 7 + Math.sin(a) * 3.6 - 2, 4, C(0xFF7A1A), 2.6, 1.6); } Ball(48.6, 0, 3.6, 2.6, C(0x5AB0FF), 3); }   // III burner crown
        break;
      case 'Buzzsaw':
        both((s) => E(arc(34, 7.4, 13.6, 200, 330, 8).concat(arc(34, 7.4, 12, 330, 200, 8)), 0.8, PAL.steelD, { y: s * 2.2, bevel: 0.2 }));   // I lower guard
        if (t2) into(vm.SpinPart, () => { const tt = []; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? 7.6 : 5.6; tt.push([Math.cos(a) * r, Math.sin(a) * r]); } E(tt, 0.9, gold, { y: 1.8, bevel: 0.2, glow: 0.6, holes: [arc(0, 0, 2.4, 0, 330, 8)] }); });   // II second blade
        if (t3) { for (let i = 0; i < 5; i++) Spike(-6 + i * 4, 0, 11.4, 2.6, g, 2.4, 1.2); Ty(34, 7.4, 3, 4, g, 0, 2.8); }   // III hot exhaust stacks, glowing hub
        break;
      case 'Thunderhead':
        for (let i = 0; i < 7; i++) Ball(-4 + i * 3.4, 0, 3, 1.2, C(0xBFEFFF), 2.6);                                    // I arc lamps underneath
        if (t2) { both((s) => E(star(10, 16.8, 3.4), 0.4, gold, { y: s * 2.2, bevel: 0.05, glow: 1.2 })); }             // II copper stars
        if (t3) { Ring(34, 9, 12, 1, gold, 1.4); for (let i = 0; i < 3; i++) Ty(-1 + i * 6, 9.4, 4.4, 7.4, C(0xBFEFFF), 0, 2.6); }   // III rotors white-hot, halo
        break;
      case "Fan of Knives":
        both((s) => E(star(-14, 7, 2.4, 4, 0.5), 0.3, PAL.bone, { y: s * 2.5, bevel: 0.04, glow: 0.6 }));               // I throwing-star inlay
        if (t2) { for (let i = 0; i < 4; i++) B(-2 + i * 5, 0, 12.2, 4.4, 1.6, 0.25, C(0xC9CED8), R(14, 0, 0), 0.2); }   // II spare blades racked on top
        if (t3) { Ball(26, 0, 8, 3, g, 3); for (let i = 0; i < 2; i++) Ring(24 - i * 4, 8, 12 - i * 2, 0.6, g, 2.6); E([[-6, 13.6], [-2, 13.6], [-3, 17], [-5, 17]], 3, PAL.bone, { bevel: 0.6 }); }   // III death's-head skull, cursed glow
        break;
      case 'Black Cat':
        both((s) => E([[-36, 8], [-40, 12], [-44, 8], [-42, 14], [-37, 13]], 0.8, PAL.black, { y: s * 0.6, bevel: 0.2 }));   // I tail tip curl
        if (t2) both((s) => E([[62, 8.2], [68, 8.2], [66, 5.6], [64, 4.6]], 0.5, PAL.bone, { y: s * 1.8, bevel: 0.1 }));     // II claws at the muzzle
        if (t3) { both((s) => Ball(19, s * 1.5, 12.8, 1.8, C(0x7CFF4A), 3)); for (let i = 0; i < 4; i++) Ring(40 + i * 5, 8.2, 4.4, 0.5, C(0x7CFF4A), 2.4); }   // III glowing eyes and barrel
        break;
      default: break;
    }
    void M; void g;
  }
  return { Sight, Muzzle, Eject, Support, twoHandPistol };
}
