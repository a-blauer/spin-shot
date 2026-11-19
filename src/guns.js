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

// How each gun handles: kick back (pos), muzzle climb (rise), sideways jitter (side), recovery spring (k, d),
// camera shake, the action it cycles after a shot and the way it reloads. Class defaults, then per-gun overrides.
const FEEL_CLASS = {
  Pistol: { pos: 1, rise: 1.3, side: 1, k: 330, d: 25, shake: 0, reload: 'mag' },
  SMG: { pos: 0.65, rise: 0.55, side: 1.7, k: 400, d: 27, shake: 0, reload: 'mag' },
  Rifle: { pos: 0.9, rise: 0.8, side: 1, k: 300, d: 23, shake: 0.03, reload: 'mag' },
  Shotgun: { pos: 1.9, rise: 1.9, side: 0.8, k: 170, d: 16, shake: 0.28, reload: 'shell' },
  LMG: { pos: 0.8, rise: 0.5, side: 1.9, k: 260, d: 20, shake: 0.06, reload: 'box' },
  Sniper: { pos: 2.3, rise: 2.3, side: 0.5, k: 120, d: 13, shake: 0.4, reload: 'mag' },
  Launcher: { pos: 2.5, rise: 1.5, side: 0.6, k: 110, d: 12, shake: 0.45, reload: 'tube' },
  Energy: { pos: 0.3, rise: 0.22, side: 0.8, k: 300, d: 24, shake: 0, reload: 'cell' },
  Wonder: { pos: 1, rise: 1, side: 1, k: 220, d: 18, shake: 0.15, reload: 'cell' },
};
const FEEL_GUN = {
  'Tin Star': { action: 'revolver', reload: 'revolver', rise: 1.6 },
  'Saloon Six': { action: 'revolver', reload: 'revolver', pos: 1.7, rise: 2.4, k: 190, d: 16, shake: 0.22 },
  'Penny Pusher': { pos: 0.55, rise: 0.5, side: 2.2, k: 420 },
  'Snake Eyes': { side: 1.5, rise: 1.1 },
  'Back-Alley': { side: 2.1, pos: 0.8 },
  "Hornet's Nest": { pos: 0.45, rise: 0.3, side: 2.4, k: 440, d: 28 },
  'Card Sharp': { pos: 0.45, rise: 0.35, side: 0.7 },
  'Quarter Horse': { action: 'lever', reload: 'shell', pos: 1.3, rise: 1.5, k: 240 },
  'Lawman AR': { pos: 0.85, rise: 0.75 },
  'Long Odds': { pos: 1.5, rise: 1.4, k: 220, d: 18, shake: 0.12 },
  Jackpot: { pos: 0.7, rise: 0.6, side: 0.8, k: 340 },
  Sawbuck: { reload: 'break', pos: 2.6, rise: 2.8, k: 140, d: 14, shake: 0.45 },
  "Dealer's Pump": { action: 'pump' },
  'Full House': { pos: 1.2, rise: 1, k: 240, d: 20, shake: 0.14, reload: 'mag' },
  "Dragon's Breath": { action: 'pump', pos: 2.1, shake: 0.35 },
  'Iron Mule': { pos: 0.9, rise: 0.6, side: 1.7, shake: 0.08 },
  'Gatling Gambler': { pos: 0.35, rise: 0.15, side: 2.6, k: 300, shake: 0.07 },
  Widowmaker: { action: 'bolt' },
  'Railroad Spike': { pos: 3.2, rise: 1.2, k: 85, d: 11, shake: 0.6 },
  'Dynamite Dan': { pos: 1.6, rise: 2, k: 150 },
  'Fireworks Finale': { pos: 2.8, rise: 1.8, shake: 0.5 },
  'Tesla Coil': { side: 2.2, pos: 0.4 },
  'Frostbite Beam': { pos: 0.12, rise: 0.08, side: 0.5 },
  'Hellfire Hose': { pos: 0.2, rise: 0.1, side: 1.4 },
  Buzzsaw: { pos: 1.3, rise: 0.6, side: 2, shake: 0.12 },
  'The House Always Wins': { pos: 1.4, rise: 1.2, shake: 0.25 },
  "Dead Man's Hand": { pos: 0.8, rise: 1.4, side: 1.6 },
  'Black Cat': { action: 'bolt', pos: 1.7, rise: 1.8, shake: 0.3 },
};
export const gunFeel = (W) => Object.assign({ action: 'none' }, FEEL_CLASS[W.cls] || FEEL_CLASS.Rifle, FEEL_GUN[W.name] || {});

export const PAL = {
  steel: C(0x3d4150), steelD: C(0x23252e), steelL: C(0x7e8494), wood: C(0x7a4528), woodD: C(0x55301c), woodL: C(0xa0643a),
  brass: C(0xd9a03a), bone: C(0xe8dcc0), black: C(0x17161c), red: C(0xb0262c), rubber: C(0x2a2a30),
};

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
  return buildGunWith(vm, W, tier, PAL_T);
}

function buildGunWith(vm, W, tier, PAL) {
  const N = W.name;
  const Accent = tier >= 3 ? C(W.color).lerp(new THREE.Color(1, 1, 1), 0.25) : C(W.color);
  const Trim = tier > 0 ? C(0xF2C43A) : PAL.steelL;
  const TG = tier > 0 ? 0.6 + 0.25 * tier : 0;
  let cur = vm.gun, oy = 0;
  // --- kit -------------------------------------------------------------------------------------------------
  const E = (pts, w, col, o = {}) => vm.Ext(pts, w, col, Object.assign({ parent: cur }, o, { y: (o.y || 0) + oy }));
  const B = (x, y, z, sx, sy, sz, col, rot = null, glow = 0) => vm.Part(cur, 0, V(x, y + oy, z), V(sx, sy, sz), col, rot, glow);
  const T = (x0, x1, d, z, col, y = 0, glow = 0, sides = 1) => vm.Part(cur, sides, V((x0 + x1) / 2, y + oy, z), V(d, d, Math.abs(x1 - x0)), col, R(90, 0, 0), glow);
  const O = (x0, x1, d, z, col, y = 0) => T(x0, x1, d, z, col, y, 0, 7);                           // octagonal barrel
  const Ty = (x, z, d, w, col, y = 0, glow = 0) => vm.Part(cur, 1, V(x, y + oy, z), V(d, d, w), col, R(0, 0, 90), glow);   // axle across the gun
  const Tz = (x, z0, z1, d, col, y = 0, glow = 0) => vm.Part(cur, 1, V(x, y + oy, (z0 + z1) / 2), V(d, d, Math.abs(z1 - z0)), col, null, glow);   // vertical post
  const Ball = (x, y, z, d, col, glow = 0) => vm.Part(cur, 2, V(x, y + oy, z), V(d, d, d), col, null, glow);
  const Cone = (x, z, d, len, col, fwd = true, y = 0, glow = 0) => vm.Part(cur, 3, V(x, y + oy, z), V(d, d, len), col, R(fwd ? -90 : 90, 0, 0), glow);
  const Ring = (x, z, d, t, col, glow = 0, y = 0) => vm.Part(cur, 8, V(x, y + oy, z), V(t / 0.12, d, d), col, null, glow);  // hoop around the bore
  const group = (x, y, z) => vm.scene_(V(x, y + oy, z));
  const into = (g, fn) => { const pc = cur, py = oy; cur = g; oy = 0; fn(); cur = pc; oy = py; };
  // --- shared furniture ---------------------------------------------------------------------------------------
  const grip = (x, z, col, len = 12, rake = 16, th = 5.6, w = 4.2) => {
    const dx = Math.tan(d2r(rake)) * len;
    E([[x + th / 2, z], [x - th / 2, z], [x - th / 2 - dx, z - len + 1.2], [x - th / 2 - dx + 1, z - len], [x + th / 2 - dx - 0.6, z - len], [x + th / 2 - dx, z - len + 1]], w, col, { bevel: 0.9 });
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
    for (const x of [x0 + (x1 - x0) * 0.28, x0 + (x1 - x0) * 0.72]) E([[x - 1.2, z - d * 0.2], [x + 1.2, z - d * 0.2], [x + 1.5, z - d * 0.5 - 2.6], [x - 1.5, z - d * 0.5 - 2.6]], 2.4, PAL.steelD, { bevel: 0.2 });
  };
  const banana = (x, z, len, w, col = PAL.steelD, curve = 14, th = 4.6) => {
    const n = 5, f = [], b = [];
    for (let i = 0; i <= n; i++) { const t = i / n, a = d2r(-90 + curve * t - 6); const px = x + Math.cos(a) * len * t + t * t * curve * 0.12, pz = z + Math.sin(a) * len * t; f.push([px + th / 2, pz]); b.unshift([px - th / 2, pz]); }
    E(f.concat(b), w, col, { bevel: 0.35 });
  };
  const flutes = (x0, x1, z, d, n, col) => { for (let i = 0; i < n; i++) { const a = d2r(i * 360 / n + 30); T(x0, x1, d * 0.3, z + Math.sin(a) * d * 0.43, col, Math.cos(a) * d * 0.43); } };
  const fins = (x0, x1, z, d, n, col) => { for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * (i + 0.5) / n; T(x - 0.5, x + 0.5, d, z, col); } };

  let Sight = 10, Muzzle = V(30, 0, 7), Eject = V(4, 3, 7), Support = V(16, 0, 1);
  let twoHandPistol = false;

  // --- revolver / pistol bodies (reused for twin pistols and distinct per gun through their parameters) ---------------
  const revolver = (o) => {
    const { bl, bd, cd, gripCol, frame, oct } = o;
    E([[-6, 3.2], [-6.5, 8.6], [-3, 9.6], [9, 9.6], [9, 4.6], [6.5, 2.6], [1, 2.4]], 3.2, frame, { bevel: 0.5, holes: [rect(0.6, 4.2 - cd * 0.08, 7.4, 9.0)] });
    const cyl = group(4, 0, 6.6); vm.CylPart = cyl;
    into(cyl, () => { T(-3.3, 3.3, cd, 0, PAL.steelL); flutes(-3.4, 1.2, 0, cd, 6, PAL.steelD); T(-3.5, -3.3, cd * 0.5, 0, PAL.brass); });
    vm.SpinPart = null;
    (oct ? O : T)(9, 9 + bl, bd, 7.4, frame);
    E(rect(9, 8.6, 9 + bl - 1, 9.5), 1.2, PAL.steelD, { bevel: 0.15 });                         // top rib
    T(9, 9 + bl * 0.6, 1.3, 4.9, PAL.steelL);                                                  // ejector rod
    E([[9, 4.4], [9, 6], [12, 6], [13, 4.4]], 1.6, frame, { bevel: 0.2 });
    post(9 + bl - 1.6, 9.5, 1.8);
    E([[-6.2, 8.4], [-7.8, 10], [-7, 10.6], [-4.8, 9.4]], 1.1, PAL.steelD, { bevel: 0.2 }); // hammer
    notch(-3.4, 9.4, 3.2);
    grip(-2.6, 3.4, gripCol, 12.5, o.rake || 22, 6, 4.4);
    guard(1.2, 2.8, o.guardCol || PAL.steelD, 7, 4.6);
    Muzzle = V(9 + bl + 0.5, 0, 7.4); Sight = 11; Eject = V(4, 3, 7);
  };
  const autoPistol = (o) => {
    const { len, slide, frame, gripCol } = o;
    E([[-5, 5], [-5, 9.2], [-3.6, 9.8], [len - 1, 9.8], [len, 9], [len, 5]], 3.6, slide, { bevel: 0.55 });   // slide
    for (let i = 0; i < 5; i++) B(-3.8 + i * 0.9, 0, 7.6, 0.35, 3.8, 3, PAL.steelD);                       // serrations
    E([[-4.6, 3], [-4.6, 5.2], [len - 0.6, 5.2], [len - 0.6, 3.8], [8, 3.2], [7, 2]], 3.2, frame, { bevel: 0.4 });
    T(len - 1, len + 0.8, 2.2, 7.6, PAL.steelD);
    B(3.5, 1.9, 8, 4.5, 0.2, 1.6, PAL.steelD);                                                           // ejection port
    post(len - 1.6, 9.8, 1.5); notch(-3.8, 9.7, 3.4);
    grip(-1.4, 3.2, gripCol, 12, 14, 5.8, 4);
    guard(1.6, 3, frame, 6.6, 4.4);
    Muzzle = V(len + 1, 0, 7.6); Sight = 11; Eject = V(4, 3, 8.5);
  };
  const pistolMag = (len = 4, col = PAL.steelD) => { vm.MagRoot = group(-2.4, 0, -6.4); into(vm.MagRoot, () => E([[1.6, 1], [-2.6, 1], [-3.4, -len + 1.5], [1, -len + 1.5]], 3, col, { bevel: 0.3 })); };

  switch (N) {
    // ============================================================ PISTOLS
    case 'Tin Star': {
      revolver({ bl: 13, bd: 3, cd: 7, gripCol: PAL.wood, frame: PAL.steelL, oct: true });
      for (const s of [-1, 1]) E(star(-5.6, -3.2, 1.9), 0.4, PAL.brass, { y: s * 2.3, bevel: 0.05 });
      vm.MagRoot = group(4, 0, 6.6); into(vm.MagRoot, () => { for (let i = 0; i < 3; i++) T(-1.6, 1.6, 1.3, -1 + i * 1.5, PAL.brass, i - 1); });
      Support = V(-1, -4.5, -4); twoHandPistol = true;
      break;
    }
    case 'Saloon Six': {
      revolver({ bl: 22, bd: 3.6, cd: 8.6, gripCol: PAL.woodD, frame: PAL.steel, guardCol: PAL.brass, rake: 30 });
      E(rect(9, 3.6, 24, 5.6), 2.2, PAL.steel, { bevel: 0.4 });                                 // heavy under-lug
      B(18, 0, 9.8, 12, 1.6, 0.5, Accent);
      vm.MagRoot = group(4, 0, 6.6); into(vm.MagRoot, () => { for (let i = 0; i < 3; i++) T(-2, 2, 1.6, -1 + i * 1.7, PAL.brass, i - 1); });
      Support = V(-1, -4.5, -4); twoHandPistol = true;
      break;
    }
    case 'Penny Pusher': {
      autoPistol({ len: 15, slide: PAL.steelD, frame: Accent, gripCol: PAL.black });
      T(15, 21, 3.4, 7.6, PAL.steelD); for (let i = 0; i < 3; i++) for (const a of [0, 90, 180, 270]) Ball(16.4 + i * 1.7, Math.cos(d2r(a)) * 1.6, 7.6 + Math.sin(d2r(a)) * 1.6, 0.9, PAL.black);
      E([[9, 3.2], [12, 3.2], [11.4, -3.6], [9.4, -3.6]], 2.6, PAL.black, { bevel: 0.6 });         // fore grip
      wireStock(-5, 7.5, PAL.steelD, 13, 7);
      vm.MagRoot = group(-2.4, 0, -6.4); into(vm.MagRoot, () => E([[1.6, 1], [-2.6, 1], [-5.2, -11], [-0.8, -11]], 3, PAL.steelD, { bevel: 0.3 }));
      Muzzle = V(21.5, 0, 7.6); Support = V(10.4, 0, -1);
      break;
    }
    case 'Snake Eyes': {
      const one = () => {
        autoPistol({ len: 16, slide: PAL.steelL, frame: PAL.steel, gripCol: Accent });
        for (const s of [-1, 1]) { Ball(-2.6, s * 2.1, 0, 0.9, PAL.bone); Ball(-4.2, s * 2.1, -5.4, 0.9, PAL.bone); }
      };
      one(); pistolMag(4);
      const g2 = group(2, -15, 0); into(g2, one);
      Support = V(1, -15, -4);
      break;
    }
    // ============================================================ SMGs
    case 'Back-Alley': {
      T(-8, 22, 5.4, 7, PAL.steel);                                                             // tube receiver
      T(22, 33, 4.4, 7, PAL.steelD); for (let i = 0; i < 4; i++) for (const a of [45, 135, 225, 315]) Ball(24 + i * 2.4, Math.cos(d2r(a)) * 2.1, 7 + Math.sin(d2r(a)) * 2.1, 1.1, PAL.black);
      T(33, 36, 2.4, 7, PAL.steelD);
      B(6, 2.6, 7.6, 9, 0.5, 1.6, PAL.black); Ball(9, 3.6, 7.6, 1.8, PAL.steelL);                // bolt slot + handle
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
      Ball(4, 3.2, 10.6, 2, PAL.steelL);
      stock(-7, 9.4, PAL.wood, 20, 5, 9, 4.2);
      grip(-2, 3.6, PAL.wood, 11, 16, 5.4, 4); guard(0.6, 3.4, PAL.steelD, 6.6, 4.4);
      E([[20, 4.6], [24, 4.6], [23.4, -4], [20.6, -4]], 3.4, PAL.wood, { bevel: 0.9 });            // vertical fore grip
      vm.MagRoot = group(11, 0, 3); into(vm.MagRoot, () => { Ty(0, -5.4, 13, 4.2, PAL.steelD); Ty(0, -5.4, 5, 4.6, Accent, 0, 0.3); Ty(0, -5.4, 14, 1, PAL.steel); });   // drum
      post(29, 8.8, 2.2); notch(-5, 10, 3.6);
      Muzzle = V(34.5, 0, 7.2); Support = V(22, 0, -1); Sight = 12.2;
      break;
    }
    case 'Card Sharp': {
      E([[-6, 3.6], [-6, 9.4], [-3, 10.4], [14, 10.4], [18, 8.6], [18, 3.6]], 4.2, Accent, { bevel: 0.6 });
      E(rect(-4, 10.4, 12, 11.2), 2, PAL.steelD, { bevel: 0.2 });
      T(18, 20, 3, 7, PAL.steelD); T(20, 36, 4.6, 7, PAL.black); T(35.6, 36.2, 3, 7, PAL.steelD);   // suppressor
      for (const s of [-1, 1]) { E([[3, 5.4], [5, 7.4], [7, 5.4], [5, 3.6]], 0.3, PAL.bone, { y: s * 2.2, bevel: 0.04, glow: 0.3 }); }
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
      E([[-3, 4], [5, 4], [5, 3], [1, 2.8], [-1, -1.4], [-6.4, -3.6], [-9.4, -1], [-6, 2.6], [-4, 2.6]], 1.6, PAL.steelD, { bevel: 0.25, holes: [[[-5.6, 1.6], [-2, 1.6], [-2.4, -1], [-6.2, -2.4], [-8, -0.9]]] });   // lever loop
      E([[-7.4, 9.8], [-9.6, 11.8], [-8.6, 12.4], [-5.6, 10.4]], 1.4, PAL.steelD, { bevel: 0.2 });
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
      B(4, 2.3, 8.6, 6, 0.3, 1.6, PAL.black); Ball(8, 3, 8.6, 1.6, PAL.steelL);
      vm.MagRoot = group(10, 0, 4.4); into(vm.MagRoot, () => banana(0, 0, 14, 3, PAL.steelD, 30, 5));
      Muzzle = V(49.5, 0, 7.4); Support = V(22, 0, 3); Sight = 12.6;
      break;
    }
    case 'Long Odds': {
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
      vm.MagRoot = group(10, 0, 4.6); into(vm.MagRoot, () => E([[2.6, 0.4], [-2.6, 0.4], [-3.4, -11], [1.8, -11]], 3.2, PAL.steel, { bevel: 0.35 }));
      Muzzle = V(59.5, 0, 7.4); Support = V(24, 0, 3); Sight = 13.4;
      break;
    }
    case 'Jackpot': {
      const gold = C(0xE0AC2A), goldD = C(0xA87818);
      E([[-7, 4.4], [-7, 9.6], [14, 9.6], [14, 4.4]], 4.2, gold, { bevel: 0.5, glow: 0.15 });
      E([[-5, 9.6], [-5, 12.6], [9, 12.6], [11, 9.6]], 1.6, goldD, { bevel: 0.3, holes: [[[-3.6, 10.2], [-3.6, 11.6], [8, 11.6], [9, 10.2]]] });   // carry handle
      E([[-7, 9.4], [-7, 5], [-24, 2.4], [-26, 2.6], [-26, 10], [-24, 10.2]], 4, PAL.bone, { bevel: 0.9 });   // ivory stock
      T(14, 32, 5.4, 7.2, PAL.bone); for (let i = 0; i < 6; i++) Ring(16.4 + i * 2.6, 7.2, 5.9, 0.5, goldD);
      T(32, 46, 2.4, 7.2, gold, 0, 0.15); E([[36, 7.6], [38, 7.6], [37.6, 12.6], [36.4, 12.6]], 1.4, goldD, { bevel: 0.2 }); T(46, 50, 3.4, 7.2, goldD);
      grip(-2, 4.6, PAL.bone, 11.4, 16, 5.2, 3.8); guard(0.6, 4.4, goldD, 6.6, 4.4);
      for (const s of [-1, 1]) { Ty(4, 7, 3.6, 0.3, PAL.bone, s * 2.2); B(4, s * 2.4, 7, 0.6, 0.2, 2.4, C(0x1f7a3a)); }   // $ medallion
      vm.MagRoot = group(9, 0, 4.4); into(vm.MagRoot, () => banana(0, 0, 12, 3, goldD, 16, 5));
      Muzzle = V(50.5, 0, 7.2); Support = V(22, 0, 3.4); Sight = 12.6;
      break;
    }
    // ============================================================ SHOTGUNS
    case 'Sawbuck': {
      E([[-6, 4], [-6, 10], [-2, 10.8], [8, 10.8], [8, 4]], 5.6, PAL.steel, { bevel: 0.7 });
      for (const s of [-1, 1]) { T(8, 36, 3.9, 8.4, PAL.steelD, s * 2); T(35.6, 36.2, 3.1, 8.4, PAL.black, s * 2); E([[-6, 10], [-7.6, 11.4], [-6.8, 12], [-4.8, 10.8]], 1, PAL.steelL, { y: s * 1.8, bevel: 0.2 }); }
      E(rect(8, 9.9, 35, 10.5), 1.2, PAL.steel, { bevel: 0.15 });
      E([[8, 4], [8, 6.6], [24, 6.6], [26, 5.4], [24, 4]], 6, PAL.wood, { bevel: 1.2 });
      stock(-6, 9.4, PAL.wood, 20, 5.5, 10, 4.8, 6);
      E([[-5, 4], [2, 4], [1, 2.2], [-1, 0.2], [-5.4, -0.8], [-6.4, 1.6]], 1.4, PAL.steelD, { bevel: 0.2, holes: [[[-4.6, 3.2], [0.4, 3.2], [-1.2, 1], [-5, 0.2]]] });
      E([[1, 10.8], [3, 10.8], [-1, 13], [-2, 12.4]], 1, PAL.steelL, { bevel: 0.15 });               // top lever
      Ball(35, 0, 11, 1.2, PAL.brass);
      vm.MagRoot = group(2, 0, 7.6); into(vm.MagRoot, () => { for (const s of [-1, 1]) { T(-3, 2, 3.2, 0, PAL.red, s * 2); T(-3.8, -3, 3.4, 0, PAL.brass, s * 2); } });
      Muzzle = V(36.6, 0, 8.4); Support = V(18, 0, 2.4); Sight = 11.6;
      break;
    }
    case "Dealer's Pump": {
      E([[-6, 4], [-6, 10], [-3, 10.8], [14, 10.8], [14, 4]], 4.6, PAL.steel, { bevel: 0.6 });
      T(14, 50, 3.6, 8.6, PAL.steelD); T(14, 44, 3.2, 5, PAL.steel); T(44, 45.4, 3.8, 5, PAL.steelL); Ring(40, 6.8, 5.2, 0.9, PAL.steelD);
      vm.PumpRoot = group(26, 0, 5); into(vm.PumpRoot, () => { T(-7, 7, 6, 0, PAL.wood); for (let i = 0; i < 5; i++) Ring(-5 + i * 2.5, 0, 6.4, 0.5, PAL.woodD); B(-10, 2.2, 1, 8, 0.5, 1, PAL.steelD); });
      stock(-6, 9.6, PAL.wood, 21, 5, 10, 4.6, 5.8);
      guard(-2, 4, PAL.steelD, 7, 4.4);
      B(6, 2.5, 8.6, 7, 0.3, 2.2, PAL.black); Ball(49, 0, 10.9, 1.2, PAL.brass);
      B(4, 0, 4, 7, 2.6, 0.5, Accent);
      vm.MagRoot = group(6, 0, 7); into(vm.MagRoot, () => { T(-3, 2, 3.2, 0, PAL.red); T(-3.8, -3, 3.4, 0, PAL.brass); });
      Muzzle = V(50.6, 0, 8.6); Support = V(26, 0, 1.6); Sight = 11.8;
      break;
    }
    case 'Full House': {
      E([[-8, 3.6], [-8, 11], [20, 11], [20, 3.6]], 5.6, Accent, { bevel: 0.9 });
      E(rect(-6, 11, 18, 12), 3, PAL.steelD, { bevel: 0.3 }); for (let i = 0; i < 7; i++) B(-4.6 + i * 3.4, 0, 12.1, 1.6, 3.2, 0.5, PAL.black);
      E([[-8, 10.6], [-8, 4], [-22, 3], [-24, 3.6], [-24, 10.2], [-22, 10.6]], 5, Accent, { bevel: 1 }); E(rect(-25.4, 3.4, -23.6, 10.4), 5.2, PAL.rubber, { bevel: 0.3 });
      T(20, 40, 4.2, 7.6, PAL.steelD); T(20, 30, 6.4, 7.6, PAL.black); for (let i = 0; i < 4; i++) for (const a of [0, 90, 180, 270]) Ball(22 + i * 2.2, Math.cos(d2r(a)) * 3.1, 7.6 + Math.sin(d2r(a)) * 3.1, 1.1, PAL.steelD);
      grip(-3, 3.8, PAL.black, 11, 14, 5.4, 4); guard(-0.4, 3.6, PAL.steelD, 6.6, 4.4);
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
      E([[-6, 12], [20, 12], [18, 13.4], [-4, 13.4]], 6, PAL.steelD, { bevel: 0.4 });                                 // feed cover
      E([[2, 13.4], [4, 13.4], [8, 17], [16, 17], [16, 15.6], [9, 15.6], [6, 13.4]], 1.6, PAL.steelD, { bevel: 0.3 }); // carry handle
      stock(-8, 11, PAL.wood, 20, 4, 10, 5, 6.4);
      T(22, 54, 3.6, 8, PAL.steelD); fins(23, 40, 8, 5.8, 9, PAL.steel); T(54, 58, 4.8, 8, PAL.steel);
      E([[44, 8], [46, 8], [45.6, 12.6], [44.4, 12.6]], 1.4, PAL.steelD, { bevel: 0.2 });
      for (const s of [-1, 1]) E([[48, 6], [49.6, 6], [38, -1], [37, -0.2]], 1, PAL.steelD, { y: s * 2.6, bevel: 0.2 });   // bipod
      grip(-2, 3.8, PAL.black, 11.4, 14, 5.4, 4); guard(0.6, 3.6, PAL.steelD, 6.6, 4.4);
      vm.MagRoot = group(8, -5, 3.6); into(vm.MagRoot, () => {
        E(rect(-6.5, -10, 6.5, 0), 7, C(0x5A6040), { y: -3, bevel: 0.7 }); E(rect(-7, -1, 7, 0.6), 7.6, C(0x444a30), { y: -3, bevel: 0.3 });
        for (let i = 0; i < 6; i++) vm.Part(cur, 1, V(-4 + i * 1.7, 0.5 - i * 0.2, 4 + i * 0.9), V(1.4, 1.4, 4.4), PAL.brass, R(0, 0, 90));   // belt up into the feed tray
      });
      Muzzle = V(58.6, 0, 8); Support = V(26, 0, 2); Sight = 14.4;
      break;
    }
    case 'Gatling Gambler': {
      E([[-8, 2.6], [-8, 12], [14, 12], [14, 2.6]], 8, Accent, { bevel: 1.2 });                                        // brass breech
      for (const x of [-6, 12]) for (const s of [-1, 1]) Ball(x, s * 4.1, 10, 1.3, PAL.steelD);
      Ty(2, 15, 9, 5, PAL.steelD); Ty(2, 15, 9.6, 1, PAL.steel); B(2, 0, 12, 4, 3, 2, PAL.steelD);                     // top drum
      vm.SpinPart = group(34, 0, 7); vm.spinAxis = 'z';
      into(vm.SpinPart, () => {
        for (let i = 0; i < 6; i++) { const a = d2r(i * 60); T(-20, 22, 2.3, Math.sin(a) * 3.3, PAL.steelD, Math.cos(a) * 3.3); }
        T(-20, -17, 9.6, 0, PAL.steel); T(0, 2, 9.6, 0, PAL.steel); T(19, 21, 9.6, 0, PAL.steel); T(-20, 20, 2.4, 0, PAL.steelL);
      });
      Ty(4, 6, 2, 12, PAL.steelD, 4); E([[2.6, 5], [5.4, 5], [5.4, -1], [2.6, -1]], 1.2, PAL.steelD, { y: 9.4, bevel: 0.2 }); Ty(4, -1, 2.4, 4, PAL.wood, 11.4);   // crank
      E([[-8, 10], [-8, 4], [-13, 4], [-13, 10]], 5, PAL.steelD, { bevel: 0.6 });
      for (const s of [-1, 1]) E([[-12, 9], [-12, 5], [-20, 5.6], [-20, 8.4]], 1.8, PAL.wood, { y: s * 3.2, bevel: 0.7 });   // spade grips
      grip(-2, 3, PAL.wood, 11, 12, 5.4, 4);
      vm.MagRoot = group(2, 0, 15); into(vm.MagRoot, () => Ty(0, 0, 6, 5.4, PAL.brass));
      Muzzle = V(56.5, 0, 7); Support = V(18, 0, 0.8); Sight = 16.5;
      break;
    }
    // ============================================================ SNIPERS
    case 'Widowmaker': {
      E([[-10, 3.4], [-34, -0.6], [-36, 0], [-36, 8.4], [-34, 9], [-18, 9.6], [-8, 8], [0, 6.4], [30, 6.4], [32, 5], [30, 3.6], [8, 3.4], [2, 2.6], [-2, 0], [-7, -1.6]], 4.6, PAL.black, { bevel: 1.2 });   // one-piece stock
      E(rect(-37.4, 0.2, -35.6, 8.6), 4.8, PAL.rubber, { bevel: 0.3 });
      E(rect(-30, 9.4, -20, 11), 3.4, PAL.steelD, { bevel: 0.6 });                                                     // cheek rest
      T(-6, 14, 4.4, 8.2, PAL.steel); T(14, 66, 2.8, 8.2, PAL.steelD); T(66, 70, 4, 8.2, PAL.steel);
      T(-9, -6, 3.2, 8.2, PAL.steelL); vm.Part(cur, 1, V(-4, 3.2, 7.2), V(1.4, 1.4, 5), PAL.steelL, R(0, 0, 55)); Ball(-4, 5.6, 5.6, 2.6, PAL.steelL);   // bolt + knob
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
      T(18, 64, 1.6, 7.5, Accent, 0, 2.2);
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
      into(vm.MagRoot, () => { for (const [y, z] of [[-2.4, -1.4], [2.4, -1.4], [0, 2.6]]) { T(-4, 8, 4.4, z, Accent, y); T(-4.2, -3.6, 4.6, z, C(0xe8d8b0), y); T(8, 8.6, 4.6, z, C(0xe8d8b0), y); } Ring(2, 0.2, 10.4, 1, PAL.black); vm.Part(cur, 1, V(10, 0, 3.6), V(0.7, 0.7, 4), C(0xe8d8b0), R(60, 0, 0)); Ball(11.4, 0, 5.4, 1.6, C(0xFFB040), 2.5); });
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
      E([[-10, 4], [-10, 16.4], [30, 16.4], [30, 4]], 12.4, Accent, { bevel: 1.4 });                                   // four-tube pod
      const tips = [C(0xFFD23A), C(0x4AD0FF), C(0x7CFF6A), C(0xFF5A4A)];
      vm.MagRoot = group(30, 0, 10.2);
      let k = 0;
      for (const y of [-3, 3]) for (const z of [13.2, 7.2]) {
        T(29.6, 31.2, 5.4, z, PAL.black, y); T(-10.8, -9.6, 5.4, z, PAL.black, y);
        const c = tips[k++]; into(vm.MagRoot, () => { Cone(3.4, z - 10.2, 4.2, 5, c, true, y, 0.5); T(0, 1.2, 4.2, z - 10.2, PAL.bone, y); });
      }
      for (const s of [-1, 1]) { E(star(4, 10, 3.4), 0.3, C(0xFFE27A), { y: s * 6.3, bevel: 0.04, glow: 0.6 }); E(star(18, 12.4, 2.2), 0.3, PAL.bone, { y: s * 6.3, bevel: 0.04 }); E(star(-4, 7, 1.8), 0.3, PAL.bone, { y: s * 6.3, bevel: 0.04 }); }
      E(rect(-12, 3.4, 32, 4.6), 13, PAL.steelD, { bevel: 0.4 }); E(rect(-12, 15.8, 32, 17), 13, PAL.steelD, { bevel: 0.4 });
      grip(0, 3.6, PAL.black, 11.4, 12, 5.4, 4); guard(2.6, 3.4, PAL.steelD, 6.4, 4.2);
      E([[16, 3.6], [20, 3.6], [19.4, -4], [16.6, -4]], 3.6, PAL.black, { bevel: 0.9 });
      E([[4, 17], [6, 17], [6, 21], [4, 21]], 1.2, PAL.steelD, { y: -4, bevel: 0.2 });
      Muzzle = V(36, 0, 10.2); Support = V(18, 0, -1.4); Sight = 20;
      break;
    }
    // ============================================================ ENERGY
    case 'Tesla Coil': {
      E([[-8, 3.6], [-8, 10.4], [12, 10.4], [12, 3.6]], 5.6, PAL.wood, { bevel: 0.9 });                                 // mahogany box
      E(rect(-9, 9.6, 13, 11), 6.2, PAL.brass, { bevel: 0.4 }); E(rect(-9, 3, 13, 4.4), 6.2, PAL.brass, { bevel: 0.4 });
      stock(-8, 9.6, PAL.woodD, 19, 4, 9.6, 4.4);
      T(12, 20, 6, 7, PAL.brass); T(20, 38, 3.2, 7, PAL.bone); for (let i = 0; i < 9; i++) Ring(21.2 + i * 1.9, 7, 5.2, 0.9, C(0xC06A30));   // copper windings
      Ring(40, 7, 9.4, 1.5, PAL.brass); Ball(40, 0, 7, 4.6, Accent, 2.6); T(38, 40, 2, 7, PAL.steelD);                // toroid + spark ball
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
      T(11, 27, 8.2, 8, C(0xbff7ea), 0, 0.35); Ball(19, 0, 8, 5.6, Accent, 2.8); Ball(21.4, 0, 9.2, 2.6, C(0xeafff8), 3);
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
      Cone(43.6, 7, 4.6, 8, ice, true, 0, 2.2); T(39, 41, 4.4, 7, PAL.steelL);                                          // crystal emitter
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
      T(40, 48, 1, 3.6, PAL.brass); Ball(48.6, 0, 3.6, 1.8, flameB, 3);                                                 // pilot light
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
    case 'The House Always Wins': {
      const gold = C(0xE8B62A), goldD = C(0xA87818);
      E([[-8, 3.6], [-8, 12.6], [-4, 14.4], [16, 14.4], [18, 12.6], [18, 3.6]], 6.2, C(0xB0202C), { bevel: 1.2 });               // slot-machine cabinet
      E(rect(-9, 3, 19, 4.6), 6.8, gold, { bevel: 0.4, glow: 0.3 }); E([[-5, 14.4], [15, 14.4], [12, 16.4], [-2, 16.4]], 5, gold, { bevel: 0.6, glow: 0.3 });
      const reels = [C(0xFF4050), C(0xFFE060), C(0x60E060)];
      for (const s of [-1, 1]) { E(rect(-4, 6.8, 14, 12), 0.4, PAL.bone, { y: s * 3.2, bevel: 0.05 }); for (let i = 0; i < 3; i++) Ball(-1 + i * 6, s * 3.4, 9.4, 3, reels[i], 1.2); }
      for (let i = 0; i < 5; i++) Ball(-2 + i * 3.6, 0, 16.8, 1.3, C(0xFFF0A0), 2.6);                                    // marquee bulbs
      Tz(4, 6, 11, 1.2, PAL.steelL, 4.4); Ball(4, 4.4, 12, 2.6, C(0xFF4050), 0.6);                                         // pull lever
      T(18, 30, 5, 9, gold, 0, 0.3); Ring(22, 9, 7.4, 1, goldD); Ring(27, 9, 7.4, 1, goldD);
      for (let i = 0; i < 3; i++) { const a = d2r(i * 120 + 90); E([[30, -0.8], [40, -0.3], [44, 0], [40, 0.3], [30, 0.8]], 1, gold, { bevel: 0.2, glow: 1.4 }).position.add(new THREE.Vector3(Math.cos(a) * 3, 9 + Math.sin(a) * 3, 0)); }   // lightning prongs
      Ball(38, 0, 9, 3.4, C(0xFFF0A0), 3);
      stock(-8, 12, C(0x55301c), 18, 6, 9.6, 4.6);
      grip(-2, 3.8, C(0x55301c), 11.4, 14, 5.4, 4); guard(0.6, 3.6, gold, 6.6, 4.4);
      vm.MagRoot = group(8, 0, 3.6); into(vm.MagRoot, () => { for (let i = 0; i < 5; i++) Tz(0, -1.6 - i * 1.5, -0.4 - i * 1.5, 6, i % 2 ? gold : goldD, 0, 0.4); });   // coin stack
      Muzzle = V(44.5, 0, 9); Support = V(22, 0, 4); Sight = 18.4;
      break;
    }
    case "Dead Man's Hand": {
      E([[-8, 3.6], [-8, 11], [20, 11], [24, 8], [24, 3.6]], 5.6, PAL.black, { bevel: 0.9 });                            // dealer's shoe
      E(rect(-9, 10.4, 21, 11.6), 6, PAL.brass, { bevel: 0.3 }); E(rect(-9, 3, 25, 4.2), 6, PAL.brass, { bevel: 0.3 });
      for (const s of [-1, 1]) { E([[2, 6], [4.4, 8.6], [6.8, 6], [4.4, 5.2]], 0.3, PAL.red, { y: s * 2.9, bevel: 0.04, glow: 0.4 }); E(star(12, 7.4, 1.8, 4, 0.5), 0.3, PAL.bone, { y: s * 2.9, bevel: 0.04 }); }
      const card = (g, x, yaw, roll, col) => { const m = vm.Part(g, 0, V(x, 0, 0), V(8.6, 0.25, 6), col, R(0, yaw, roll), 0.35); return m; };
      vm.MagRoot = group(26, 0, 8);
      into(vm.MagRoot, () => { for (let i = 0; i < 5; i++) { const k = i - 2; const c = vm.Part(cur, 0, V(4 - Math.abs(k) * 0.7, k * 2.6, 1.2 + i * 0.3), V(9.6, 6, 0.25), C(0xF4EEDF), R(28, k * 15, 0), 0.35); void c; vm.Part(cur, 2, V(6 - Math.abs(k) * 0.7, k * 3.3, 2.6 + i * 0.3), V(1.8, 1.8, 0.5), i % 2 ? PAL.red : PAL.black, R(28, k * 15, 0), 0.3); } });
      E([[-8, 10.4], [-8, 4.4], [-22, 3.6], [-24, 4.2], [-24, 9.6], [-22, 10.2]], 4.6, C(0x3a1a20), { bevel: 1 });
      grip(-2, 3.8, PAL.bone, 11.4, 14, 5.4, 4); guard(0.6, 3.6, PAL.brass, 6.6, 4.4);
      E([[6, 11.6], [14, 11.6], [14, 13.6], [6, 13.6]], 4, PAL.bone, { bevel: 0.3 }); for (let i = 0; i < 3; i++) B(10, 0, 13.7 + i * 0.3, 8 - i, 4 - i * 0.6, 0.25, i % 2 ? PAL.red : PAL.bone);   // deck on top
      Muzzle = V(34, 0, 8); Support = V(16, 0, 2); Sight = 15;
      break;
    }
    case 'Black Cat': {
      const eye = C(0x7CFF4A);
      E([[-10, 3.4], [-30, 0], [-34, 2], [-36, 8], [-33, 9.6], [-30, 7], [-20, 9.4], [-8, 8], [0, 6.4], [28, 6.4], [30, 5], [28, 3.6], [8, 3.4], [2, 2.6], [-2, 0], [-7, -1.6]], 4.4, PAL.black, { bevel: 1.2 });   // stock that curls like a tail
      T(-6, 14, 4.4, 8.2, PAL.black); T(14, 60, 2.8, 8.2, PAL.steelD); T(60, 72, 4.8, 8.2, PAL.black);                    // integral suppressor
      T(-9, -6, 3.2, 8.2, PAL.steelD); vm.Part(cur, 1, V(-4, 3.2, 7.2), V(1.4, 1.4, 5), PAL.steelD, R(0, 0, 55)); Ball(-4, 5.6, 5.6, 2.6, eye, 1.4);
      guard(-2, 2.8, PAL.steelD, 7, 4.2);
      scope(-2, 20, 12.8, 3.6, PAL.black, eye);
      for (const s of [-1, 1]) E([[-3.4, 14.2], [-0.2, 14.2], [-1.6, 17.4]], 1, PAL.black, { y: s * 1.5, bevel: 0.25 });     // ears on the scope
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) vm.Part(cur, 1, V(21, s * 3, 12.6 + (i - 1) * 0.9), V(0.25, 0.25, 5), PAL.bone, R(0, 0, 90 + s * (i - 1) * 12));   // whiskers at the objective
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
      case 'Penny Pusher':
        B(-5, 0, -19, 4, 2.8, 7, gold, R(-12, 0, 0), 0.4);                                                             // I coin-roll magazine
        if (t2) { Ty(5, 7.6, 7.4, 1.6, gold, 3, 0.5); Ty(5, 7.6, 3, 2, PAL.black, 3); }                                 // II side coin hopper
        if (t3) { T(15, 23, 2.2, 10.2, gold, 0, 0.8); Ring(22, 8.8, 7, 0.7, g, 2.4); }                                  // III second barrel
        break;
      case 'Snake Eyes':
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
      case 'Card Sharp':
        both((s) => E(star(12, 7.6, 2, 4, 0.5), 0.3, gold, { y: s * 2.2, bevel: 0.04, glow: 0.8 }));                    // I gold suits
        if (t2) for (let i = 0; i < 4; i++) B(22 + i * 3.4, 0, 9.6, 2.4, 0.3, 3.4, PAL.bone, R(0, 0, (i - 1.5) * 16), 0.4);   // II card fins on the suppressor
        if (t3) { Ring(36, 7, 7.4, 0.8, g, 2.6); B(2, 0, 12.4, 5, 3.4, 0.3, PAL.bone, null, 0.6); Ball(2, 0, 12.8, 1.4, PAL.red, 1.4); }   // III ace on top, glowing muzzle
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
      case 'Long Odds':
        T(mx, mx + 8, 4.4, mz, PAL.black);                                                                             // I long brake
        if (t2) both((s) => E([[39, 5], [40.6, 5], [34, -6], [33, -5]], 1, gold, { y: s * 2.4, bevel: 0.2 }));           // II deployed bipod
        if (t3) { T(12, 16.4, 5, 13.2, PAL.steelD); T(16, 16.6, 4.4, 13.2, g, 0, 2.6); for (let i = 0; i < 5; i++) Ring(36 + i * 3.6, mz, 4.6, 0.5, g, 2.2); }   // III big objective lens, rifled glow
        break;
      case 'Jackpot':
        for (let i = 0; i < 3; i++) Ball(16 + i * 5, 0, 10.6, 2, [C(0xFF4050), C(0xFFE060), C(0x60E060)][i], 1.6);      // I slot lights
        if (t2) { Tz(-2, 9.6, 15, 1, gold, 2.6); Ball(-2, 2.6, 15.6, 2.4, PAL.red, 1); }                                // II pull lever
        if (t3) { for (let i = 0; i < 6; i++) Ty(9, -9 - i * 1.3, 6, 3.4, i % 2 ? gold : C(0xFFE27A), 0, 0.8); Cone(mx + 2.4, mz, 4.6, 5, gold, false, 0, 1.2); }   // III coin-stack mag, trumpet muzzle
        break;
      case 'Sawbuck':
        both((s) => T(36, 44, 3.9, 8.4, PAL.steelD, s * 2));                                                            // I longer barrels
        if (t2) for (let i = 0; i < 4; i++) T(-16 + i * 3, -13 + i * 3, 2.6, 2.6, PAL.red, 2.6);                        // II shell loops on the stock
        if (t3) { both((s) => { T(44, 45, 4.6, 8.4, g, s * 2, 2.6); }); B(12, 0, 11.4, 14, 1.4, 0.6, gold, null, 1); }  // III glowing bores, gold rib
        break;
      case "Dealer's Pump":
        T(50, 56, 3.2, 5, PAL.steel); T(44, 56, 3.2, 5, PAL.steel);                                                     // I magazine extension
        if (t2) { for (let i = 0; i < 5; i++) T(0 + i * 2.8, 2.6 + i * 2.8, 2.6, 11.6, i % 2 ? PAL.red : C(0x2a6ad0), 0); B(6.4, 0, 10.6, 15, 3, 0.5, PAL.black); }   // II shell saddle
        if (t3) { Cone(mx + 3, mz, 6.4, 5, gold, false, 0, 1); for (let i = 0; i < 4; i++) { const a = d2r(i * 90 + 45); Spike(mx + 1, Math.cos(a) * 3, mz + Math.sin(a) * 3 - 1.5, 3, PAL.bone, 0, 1); } }   // III breacher muzzle
        break;
      case 'Full House':
        E(rect(20, 2.4, 38, 4.4), 3, PAL.steelD, { bevel: 0.3 });                                                       // I under rail
        if (t2) { Ty(7, -5, 15, 3.4, PAL.steelD, 6.6); Ty(7, -5, 6, 3.8, gold, 6.6, 0.5); }                             // II second drum
        if (t3) { for (let i = 0; i < 5; i++) B(-4 + i * 5, 0, 12.6, 3.4, 4, 0.3, [PAL.red, PAL.bone, PAL.black, PAL.bone, PAL.red][i], R(18, 0, 0), 0.5); Ring(mx - 2, mz, 7.6, 0.9, g, 2.6); }   // III five cards on the rail
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
      case 'Gatling Gambler':
        Ty(2, 15, 10.4, 6, gold, 0, 0.4);                                                                               // I larger gold drum
        if (t2) { T(8, 14, 13.4, 7, PAL.brass); Ring(14, 7, 14.6, 1, gold, 0.6); }                                      // II barrel shroud
        if (t3) { for (let i = 0; i < 8; i++) { const a = d2r(i * 45); Ball(56.5, Math.cos(a) * 6, 7 + Math.sin(a) * 6, 1.3, i % 2 ? C(0xFF4050) : C(0xFFF0A0), 2.6); } }   // III roulette lights round the muzzle
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
      case 'The House Always Wins':
        for (let i = 0; i < 7; i++) Ball(-4 + i * 3.4, 0, 3, 1.2, C(0xFFF0A0), 2.6);                                    // I under-glow bulbs
        if (t2) { both((s) => E(star(10, 16.8, 3.4), 0.4, gold, { y: s * 2.2, bevel: 0.05, glow: 1.2 })); }             // II marquee stars
        if (t3) { Ring(34, 9, 12, 1, gold, 1.4); for (let i = 0; i < 3; i++) Ty(-1 + i * 6, 9.4, 4.4, 7.4, C(0xFFF0A0), 0, 2.6); }   // III jackpot reels lit, halo
        break;
      case "Dead Man's Hand":
        both((s) => E(star(-14, 7, 2.4, 4, 0.5), 0.3, PAL.bone, { y: s * 2.5, bevel: 0.04, glow: 0.6 }));               // I suit inlay
        if (t2) { for (let i = 0; i < 4; i++) B(-2 + i * 5, 0, 12.2, 3.6, 4.4, 0.25, i % 2 ? PAL.red : PAL.black, R(14, 0, 0), 0.4); }   // II aces and eights on top
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
