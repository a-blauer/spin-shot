// Sculpted pieces for the Wildwood's wet places (Bogwater Fen first): pollard willows, the drainage windpump, the
// eel-catcher's hut on its stilts and his gear, the peat cutters' stacks, the duck decoy's pipe, the drowned chapel.
// Same rules as dest_props.js: UE frame (X the front, Y right, Z up, cm), [key, build] pairs, keys carry every number
// the shape depends on, things stand on z = 0, every piece whole: nothing hangs in the air or stops short of its hold.
import { shapeB as shape, shapeF, wob } from './propkit.js';
import { dark, mix } from './village_shapes.js';
import { q, rng } from './dest_props.js';

export const FN = {   // the fen's colours
  bark: [0x5e5444, 0x544a3c, 0x665a48], barkD: 0x3a3228, willow: [0x8aa070, 0x7a9462, 0x96aa7c], willowD: 0x5e7650,
  timber: 0x6a5a46, timberD: 0x4a3e30, timberL: 0x847058, tar: 0x22201e, tarL: 0x34302a, white: 0xe2dccc,
  brick: [0x8a4e3a, 0x7e4634, 0x94563e], thatch: 0xb89a5e, thatchD: 0x8a7240, reed: 0xc8b47a, reedD: 0x9a8656,
  peat: 0x3a2a1e, peatL: 0x5a4230, canvas: 0xd8ccb0, net: 0x6a6252, iron: 0x3a3a40,
  stone: [0x8a8a80, 0x7e7e74, 0x969488, 0x74746a], moss: 0x5a7a3a, mossD: 0x46602e,
};
const N = (s) => Math.abs(Math.round(s)) || 0;
const deg = (r) => (r * 180) / Math.PI;

// ---- a pollard willow by the water: a short fat trunk leaning a little, its head swollen and knobbled where it has
// been cut back for years, a crown of straight whips springing up and out of it, long narrow leaves in drifts along
// them. The head is over a gnome's head; the trunk is all that stands in your way.
export function pollardWillow(h = 300, seed = 1) {
  seed = N(seed); h = q(h, 20);
  return ['fwillow4|' + [h, seed % 4].join('|'), shape((G) => {
    const R = rng(seed * 71 + h), tr = 40, lx = (R() - 0.5) * 50, ly = (R() - 0.5) * 50, bc = (t, a) => (Math.sin(a * 5 + t * 18 + seed) > 0.45 ? FN.barkD : FN.bark[seed % 3]);
    G.tube([[0, 0, -16], [lx * 0.4, ly * 0.4, h * 0.5], [lx, ly, h]], (t) => tr * (1.35 - 0.2 * t + 0.25 * Math.max(0, t - 0.8) / 0.2), bc, { S: 12, M: 8 });
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + R(); G.tube([[Math.cos(a) * tr * 0.5, Math.sin(a) * tr * 0.5, 40], [Math.cos(a) * tr * 1.8, Math.sin(a) * tr * 1.8, 6], [Math.cos(a) * tr * 2.5, Math.sin(a) * tr * 2.5, -8]], (t) => tr * 0.45 * (1 - t * 0.6), bc, { S: 6, M: 4 }); }
    // the head: knobs where the whips have been cut, again and again
    G.blob(lx, ly, h + 6, tr * 1.6, tr * 1.6, tr * 0.9, (nx, ny, nz) => (nz > 0.5 ? FN.barkD : FN.bark[(seed + 1) % 3]), { nu: 12, nv: 7, warp: (x, y, z, nx, ny) => { const w = 1 + wob(nx * 5 + seed, ny * 5) * 0.2; return [x * w, y * w, z]; } });
    // the whips: up and out, leaves in drifts along their upper halves
    const nW = 22 + (seed % 5);
    for (let i = 0; i < nW; i++) { const a = (i / nW) * Math.PI * 2 + R() * 0.4, out = 0.3 + R() * 0.45, L = 300 + R() * 220, sx = lx + Math.cos(a) * tr * 0.9, sy = ly + Math.sin(a) * tr * 0.9, sz = h + 12;
      const tip = [sx + Math.cos(a) * L * out, sy + Math.sin(a) * L * out, sz + L * Math.sqrt(1 - out * out) * 0.85], P0 = [sx, sy, sz], P1 = [sx + (tip[0] - sx) * 0.45, sy + (tip[1] - sy) * 0.45, sz + (tip[2] - sz) * 0.6];
      G.tube([P0, P1, tip], (t) => 4 * (1 - t * 0.7), FN.bark[2], { S: 3, M: 4 });
      const on = (u) => (u <= 0.5 ? P0.map((v, k) => v + (P1[k] - v) * (u / 0.5)) : P1.map((v, k) => v + (tip[k] - v) * ((u - 0.5) / 0.5)));   // along the whip
      // the leaves: narrow drifts hanging along the whip's upper half, pale under, grey-green
      for (const u of [0.5, 0.75, 1]) { const [x, y, z] = on(u), s = 26 + R() * 14, c = FN.willow[(i + Math.round(u * 10)) % 3];
        G.blob(x, y, z - s * 0.6, s * 0.34, s * 0.34, s * 1.15, (nx, ny, nz) => (nz > 0.6 ? mix(c, 0xd0d8b0, 0.3) : nz < -0.5 ? FN.willowD : c), { nu: 4, nv: 3 }); } }
  })];
}

// ---- the drainage windpump: a smock tower of tarred boards on a brick base, eight-sided and tapering, a white cap
// turned to the wind with four lattice sails and a fantail behind; its scoop wheel's housing at its foot by the dyke
// (+X). WP: its sizes.
export const WP = { base: 120, r0: 210, r1: 120, top: 760, hub: 840 };
export function windpump() {
  return ['fwindpump2', shape((G) => {
    const { base, r0, r1, top, hub } = WP;
    const b0 = G.n;
    G.lathe([[r0 + 30, -6], [r0 + 30, base], [r0 + 4, base + 6], [0, base + 6]], (k) => (k < 1 ? FN.brick[0] : FN.brick[(k + 1) % 3]), 8);
    for (let k = 0; k < 5; k++) G.lathe([[r0 + 30.6, 12 + k * 22], [r0 + 30.6, 14 + k * 22], [r0 + 28, 14 + k * 22], [r0 + 28, 12 + k * 22], [r0 + 30.6, 12 + k * 22]], 0xb8b0a0, 8, [0, 0, 0], [1, 1], true);
    // the smock: boards in bands, each lapping over the one below, a little lighter where the tar has worn
    const nb = 16; for (let k = 0; k < nb; k++) { const z0 = base + 6 + ((top - base - 6) * k) / nb, z1 = base + 6 + ((top - base - 6) * (k + 1)) / nb, ra = r0 + ((r1 - r0) * k) / nb, rb = r0 + ((r1 - r0) * (k + 1)) / nb;
      G.lathe([[ra + 1.5, z0 - 3], [rb, z1 + 1], [rb - 2, z1 + 1]].concat(k === nb - 1 ? [[0, z1 + 1]] : []), k % 5 === 2 ? FN.tarL : FN.tar, 8, [0, 0, 0], [1, 1], k !== nb - 1); }
    G.place(b0, { yaw: 22.5 });   // a face toward the dyke (+X), not a corner
    const rz = (z) => r0 + ((r1 - r0) * (z - base)) / (top - base), apo = Math.cos(Math.PI / 8), lean = -deg(Math.atan2((r0 - r1) * apo, top - base));
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8, b = G.n; G.box(0, 0, 0, 3, 3, (top - base) / 2 + 2, FN.tarL); const rm = (r0 + r1) / 2; G.place(b, { x: Math.cos(a) * rm, y: Math.sin(a) * rm, z: (top + base) / 2, yaw: deg(a), pitch: -deg(Math.atan2(r0 - r1, top - base)) }); }
    // the door and a window on the dyke side (+X), lying in the face
    { const b = G.n; G.box(0, 0, 0, 4, 40, 92, FN.timberD); G.place(b, { x: rz(base + 100) * apo + 2, z: base + 100, pitch: lean }); }
    { const b = G.n; G.box(0, 0, 0, 3, 22, 28, 0x1a1a1a); G.place(b, { x: rz(base + 400) * apo + 1.5, z: base + 400, pitch: lean }); }
    // the cap: a boat-shaped hood, white, on the curb
    G.lathe([[r1 + 6, top - 2], [r1 + 6, top + 8], [r1 - 6, top + 8], [r1 - 6, top - 2]], FN.white, 8);
    G.blob(0, 0, top + 40, r1 + 10, r1 - 10, 74, (nx, ny, nz) => (nz < -0.2 ? FN.timberD : FN.white), { nu: 16, nv: 8, warp: (x, y, z) => [x, y, Math.max(z, -34)] });
    G.box(r1 + 6, 0, top + 70, 30, 30, 26, FN.white);
    // the sails: on the windshaft out of the cap's front, four lattice frames with their boards
    const hx0 = r1 + 40; G.tube([[0, 0, hub - 6], [hx0 + 20, 0, hub]], 9, FN.iron, { S: 10 });
    { const b = G.n; G.lathe([[18, -12], [18, 12]], FN.iron, 12); G.place(b, { pitch: 90, x: hx0 + 14, z: hub }); }
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.35, b = G.n, L = 420;
      G.box(0, 0, L / 2 + 10, 4, 7, L / 2 + 10, FN.timberD);
      for (let k = 1; k <= 9; k++) G.box(0, -35, 20 + k * 44, 2.5, 37, 2, FN.timber);
      for (const yy of [-6, -72]) G.box(0, yy, L / 2 + 34, 2.5, 2.5, L / 2 - 10, FN.timber);
      for (let k = 1; k <= 8; k++) G.box(1.5, -39, 42 + k * 44, 0.8, 30, 21, k % 2 ? FN.canvas : dark(FN.canvas, 0.92));
      G.place(b, { roll: deg(a), x: hx0 + 24, z: hub }); }
    // the fantail behind on its frame, its blades
    G.box(-r1 - 60, 0, top + 70, 60, 6, 6, FN.timberD); G.box(-r1 - 116, 0, top + 104, 4, 4, 40, FN.timberD);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2, b = G.n; G.box(0, 0, 26, 1.5, 9, 22, FN.white); G.place(b, { x: -r1 - 116, z: top + 140, yaw: 90, roll: deg(a) }); }
    // the scoop wheel's housing at its foot on the dyke side: a boarded hood over the wheel, the race beneath
    G.box(r0 + 97, 0, 90, 92, 30, 90, FN.timber); G.surf((u, v) => { const a = Math.PI * u; return [r0 + 97 + Math.cos(a) * 92, (v - 0.5) * 60, 180 + Math.sin(a) * 40]; }, 0, 1, 8, 0, 1, 1, FN.timberD);
  })];
}

// ---- the eel-catcher's hut on its stilts over the mere's edge: six posts braced from a gnome's head up, a plank floor,
// boarded walls, a door to the ladder, a thatched roof with its ridge along Y. Its front (+X) is the ladder's side.
export const SH2 = { deck: 200, w: 360, d: 460, eave: 420, ridge: 600 };
export function stiltHut() {
  return ['fstilthut2', shape((G) => {
    const { deck, w, d, eave, ridge } = SH2, hw = w / 2, hd = d / 2, T = FN.timber, TD = FN.timberD;
    for (const sx of [-1, 1]) for (const y of [-hd + 10, 0, hd - 10]) G.tube([[sx * (hw - 10), y, -24], [sx * (hw - 10), y, deck]], 9, TD, { S: 7 });
    for (const sx of [-1, 1]) { G.box(sx * (hw - 10), 0, deck - 14, 8, hd + 4, 8, TD); G.tube([[sx * (hw - 10), -hd + 10, 170], [sx * (hw - 10), 0, deck - 20]], 4, TD, { S: 4 }); G.tube([[sx * (hw - 10), hd - 10, 170], [sx * (hw - 10), 0, deck - 20]], 4, TD, { S: 4 }); }
    for (let x = -hw + 12; x < hw + 70; x += 22) G.box(x, 0, deck + 4, 10.4, hd + 6, 4, Math.round(x / 22) % 4 ? T : FN.timberL);
    for (const y of [-hd - 4, hd + 4]) G.box(hw + 30, y, deck - 6, 34, 4, 6, TD);
    // walls of boards, the door on the +X side
    for (const sy of [-1, 1]) G.box(0, sy * (hd - 6), (deck + 8 + eave) / 2, hw - 6, 5, (eave - deck - 8) / 2, T);
    G.box(-(hw - 6), 0, (deck + 8 + eave) / 2, 5, hd - 6, (eave - deck - 8) / 2, T);
    G.box(hw - 6, -hd / 2 - 30, (deck + 8 + eave) / 2, 5, hd / 2 - 24, (eave - deck - 8) / 2, T); G.box(hw - 6, hd / 2 + 30, (deck + 8 + eave) / 2, 5, hd / 2 - 24, (eave - deck - 8) / 2, T);
    G.box(hw - 6, 0, eave - 30, 5, 56, 30, T); G.box(hw - 3, 0, (deck + 8 + eave - 60) / 2, 3, 52, (eave - 60 - deck - 8) / 2, TD);
    G.box(-(hw + 1.5), 0, deck + 150, 1, 40, 30, 0x1a1a18);
    // the thatch: two slopes from the eaves to the ridge, overhanging, a ragged edge
    const ov = 60, a = Math.atan2(ridge - eave, hw);
    for (const sx of [-1, 1]) { const xa = sx * (hw + ov), za = eave - ov * Math.tan(a);
      G.surf((u, v) => { const x = xa * (1 - v), z = za + (ridge - za) * v + (v < 0.06 ? wob(u * 30, sx) * 6 : 0); return [x, -hd - ov + u * (d + ov * 2), z]; }, 0, 1, 16, 0, 1, 6, (u, v) => (v < 0.1 ? FN.thatchD : mix(FN.thatch, 0xd8b878, wob(u * 20, v * 6 + sx) * 0.4 + 0.2)));
      G.surf((u, v) => { const x = xa * (1 - v), z = za + (ridge - za) * v; return [x, -hd - ov + (1 - u) * (d + ov * 2), z - 4]; }, 0, 1, 2, 0, 1, 2, FN.thatchD); }
    G.blob(0, 0, ridge + 12, 26, hd + ov, 16, FN.thatchD, { e: 4, nu: 10, nv: 5 });
    for (const sy of [-1, 1]) G.surf((u, v) => { const x = (u - 0.5) * 2 * hw * (1 - v); return [x, sy * (hd - 4), eave + (ridge - eave) * v]; }, 0, 1, 1, 0, 1, 1, T);
    // the ladder up to the door
    const lx0 = hw + 134, lx1 = hw + 80, lxz = (z) => lx0 + ((lx1 - lx0) * (z + 6)) / (deck + 6);
    for (const sy of [-1, 1]) G.tube([[lx0, sy * 24, -6], [lx1, sy * 24, deck], [lx1 - 4, sy * 24, deck + 90]], 3.5, FN.timberL, { S: 5 });
    for (let z = 26; z < deck; z += 30) G.box(lxz(z), 0, z, 2.5, 24, 2.5, T);
  })];
}

// ---- a punt: a long flat boat with raked ends, its pole lying along it
export function punt(len = 420, seed = 1) {
  seed = N(seed); len = q(len, 20);
  return ['fpunt|' + [len, seed % 2].join('|'), shape((G) => {
    const hl = len / 2, w = 52, c = seed % 2 ? FN.timber : 0x5a4e40;
    G.surf((u, v) => { const x = -hl + u * len, rake = Math.max(0, Math.abs(x) - (hl - 60)) / 60, z = 2 + rake * 14; return [x, (v - 0.5) * 2 * w, z]; }, 0, 1, 12, 0, 1, 1, dark(c, 0.8));
    for (const sy of [-1, 1]) G.surf((u, v) => { const x = -hl + u * len, rake = Math.max(0, Math.abs(x) - (hl - 60)) / 60; return [x, sy * w, 2 + rake * 14 + v * (22 - rake * 4)]; }, 0, 1, 12, 0, 1, 1, c);
    for (const sx of [-1, 1]) G.box(sx * (hl - 2), 0, 22, 3, w, 6, c);
    for (const x of [-hl * 0.5, 0, hl * 0.5]) G.box(x, 0, 14, 10, w - 2, 2, FN.timberL);
    G.tube([[-hl * 0.8, 20, 18], [hl * 0.9, 26, 20]], 2.5, FN.timberL, { S: 5 });
  })];
}

// ---- an eel trap: a long wicker cone, its mouth with the funnel inside, lying on the boards or the bank
export function eelTrap(seed = 1) {
  seed = N(seed);
  return ['feeltrap2|' + (seed % 2), shape((G) => {
    const b = G.n; G.lathe([[2, 0], [18, 14], [24, 60], [26, 108], [24, 112], [14, 104], [8, 90]], (k) => (k % 2 ? FN.reedD : FN.reed), 10);
    const pr = (z) => (z < 14 ? 2 + (16 * z) / 14 : z < 60 ? 18 + (6 * (z - 14)) / 46 : 24 + (2 * (z - 60)) / 48);   // the cone's radius at z
    for (let z = 10; z < 108; z += 12) G.lathe([[pr(z) - 0.6, z - 1], [pr(z) + 0.8, z - 1], [pr(z) + 0.8, z + 1], [pr(z) - 0.6, z + 1], [pr(z) - 0.6, z - 1]], FN.reedD, 10, [0, 0, 0], [1, 1], true);
    G.place(b, { pitch: 90, z: 26 });
  })];
}

// ---- a rack for drying nets: two forked posts and a pole, the nets hung over it in loose folds
export function netRack(len = 360) {
  len = q(len, 20);
  return ['fnets|' + len, shape((G) => {
    for (const sy of [-1, 1]) { G.tube([[0, sy * len / 2, -10], [0, sy * len / 2, 180]], 5, FN.timberD, { S: 6 }); for (const sx of [-1, 1]) G.tube([[0, sy * len / 2, 172], [sx * 12, sy * len / 2, 196]], 2.5, FN.timberD, { S: 4 }); }
    G.tube([[0, -len / 2 - 20, 182], [0, len / 2 + 20, 182]], 3.5, FN.timberL, { S: 6 });
    for (const sx of [-1, 1]) G.surf((u, v) => { const y = (u - 0.5) * (len - 30), sag = Math.sin(u * Math.PI) * 10, x = sx * (3 + v * 16 + Math.sin(u * 9 + v * 3) * 3); return [x, y, 186 - v * (110 + sag + Math.sin(u * 13) * 8)]; }, 0, 1, 10, 0, 1, 4, (u, v) => ((Math.floor(u * 40) + Math.floor(v * 10)) % 2 ? FN.net : dark(FN.net, 0.82)));
  })];
}

// ---- a stack of cut peats drying: blocks laid crosswise in a square open stack, dark and crumbly
export function peatStack(layers = 6, seed = 1) {
  seed = N(seed);
  return ['fpeat|' + [layers, seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 11 + layers);
    for (let k = 0; k < layers; k++) { const z = 7.6 + k * 15, along = k % 2 === 0, n = 4;
      for (let i = 0; i < n; i++) { const o = -54 + i * 36 + (R() - 0.5) * 4, c = (i + k) % 3 ? FN.peat : FN.peatL; if (along) G.box(o, 0, z, 14, 60, 7.6, c); else G.box(0, o, z, 60, 14, 7.6, c); } }
  })];
}
// ---- a peat barrow: a flat-bedded barrow with no sides, a load of peats on it, its handles down on the ground
export function peatBarrow() {
  return ['fpbarrow', shape((G) => {
    const b = G.n; G.lathe([[26, -5], [26, 5], [20, 5], [20, -5], [26, -5]], FN.timberD, 12, [0, 0, 0], [1, 1], true); G.lathe([[5, -9], [5, 9]], FN.iron, 8); for (let k = 0; k < 6; k++) { const c = G.n; G.box(12, 0, 0, 8, 2, 2, FN.timber); G.place(c, { yaw: k * 60 }); } G.place(b, { roll: 90, x: 90, z: 26 });
    for (const sy of [-1, 1]) G.tube([[96, sy * 12, 26], [40, sy * 34, 46], [-60, sy * 36, 40], [-120, sy * 38, 4]], 3.5, FN.timber, { S: 5 });
    G.box(-10, 0, 47, 64, 42, 3, FN.timberL); for (const sy of [-1, 1]) G.box(-60, sy * 36, 22, 3, 3, 20, FN.timberD);
    for (let k = 0; k < 2; k++) for (let i = 0; i < 3; i++) G.box(-40 + i * 32, 0, 57 + k * 14, 13, 34, 7, (i + k) % 2 ? FN.peat : FN.peatL);
  })];
}

// ---- the duck decoy's pipe: a curved netted ditch of shrinking hoops (the water under it is the map's), along +X
// bending toward +Y; and its screens of reed beside it. DK: the hoops' places, for their bodies.
export const decoyHoops = (L = 1400) => { const out = []; for (let i = 0; i <= 10; i++) { const t = i / 10, x = t * L * 0.9, y = t * t * L * 0.35, a = Math.atan2(2 * t * L * 0.35, L * 0.9), r = 230 - 160 * t; out.push([x, y, a, r]); } return out; };
export function decoyPipe(L = 1400) {
  L = q(L, 100);
  return ['fdecoy|' + L, shape((G) => {
    const H = decoyHoops(L);
    for (const [x, y, a, r] of H) { const nx = -Math.sin(a), ny = Math.cos(a), pts = []; for (let k = 0; k <= 10; k++) { const t = (k / 10) * Math.PI; pts.push([x + nx * Math.cos(t) * r, y + ny * Math.cos(t) * r, -8 + Math.sin(t) * r * 0.85]); }
      pts[0][2] = -12; pts[10][2] = -12; G.tube(pts, 3, FN.timberL, { S: 5 }); }
    for (const k of [0.2, 0.5, 0.8]) { const pts = H.map(([x, y, a, r]) => { const t = k * Math.PI, nx = -Math.sin(a), ny = Math.cos(a); return [x + nx * Math.cos(t) * r, y + ny * Math.cos(t) * r, -8 + Math.sin(t) * r * 0.85 + 3]; }); G.tube(pts, 1.4, FN.net, { S: 4 }); }
    for (let i = 0; i < H.length - 1; i++) { const [x0, y0, a0, r0] = H[i], [x1, y1, a1, r1] = H[i + 1];
      G.surf((u, v) => { const t = u * Math.PI, A = a0 + (a1 - a0) * v, rr = r0 + (r1 - r0) * v, nx = -Math.sin(A), ny = Math.cos(A), x = x0 + (x1 - x0) * v, y = y0 + (y1 - y0) * v; return [x + nx * Math.cos(t) * rr, y + ny * Math.cos(t) * rr, -8 + Math.sin(t) * rr * 0.85 + 2]; }, 0.12, 0.88, 6, 0, 1, 2, (u, v) => ((Math.floor(u * 24) + Math.floor(v * 8)) % 2 ? FN.net : dark(FN.net, 0.85))); }
  })];
}
// ---- a screen of reed bundles on a frame: the decoyman hid behind these
export function reedScreen(len = 300, h = 180) {
  len = q(len, 20); h = q(h, 10);
  return ['fscreen|' + [len, h].join('|'), shape((G) => {
    for (const sy of [-1, 1]) G.box(0, sy * (len / 2 - 6), h / 2, 5, 5, h / 2 + 6, FN.timberD); for (const z of [40, h - 30]) G.box(4, 0, z, 3, len / 2, 3, FN.timberD);
    for (let y = -len / 2 + 10; y < len / 2 - 6; y += 14) { const hh = h - 6 + ((y * 7) % 13); G.box(-2, y, hh / 2, 4, 6.8, hh / 2, Math.round(y / 14) % 3 ? FN.reed : FN.reedD); }
  })];
}

// ---- the drowned chapel: a small church of grey stone gone roofless, its walls broken to jagged tops (lower toward
// the west), the west door open under its round arch, the east wall standing to its gable with the window's arch in it,
// a floor of flags, fallen stones round its foot. Along X: west end at -X (the door), east at +X. CH: its sizes;
// chapelWalls(): the wall runs [x, y, w, d, h], for bodies.
export const CH = { L: 980, W: 560, t: 60, h: 420, door: 80, west: 330 };
export const chapelWalls = () => { const { L, W, t, h, door, west } = CH, hl = L / 2, hw = W / 2, wl = hw - t - door; return [
  [0, -hw + t / 2, L, t, 200], [0, hw - t / 2, L, t, 200], [hl - t / 2, 0, t, W, h], [-hl + t / 2, -door - wl / 2, t, wl, west], [-hl + t / 2, door + wl / 2, t, wl, west]]; };
export function chapelRuin() {
  return ['fchapel3', shapeF((G) => {
    const { L, W, t, h, door, west } = CH, hl = L / 2, hw = W / 2, S = FN.stone, R = rng(91), CO = 30, BL = 56;
    // a wall of stone courses in running bond from s0 to s1 along its run, at `at` across it; top(s) its height there
    // (a whole number of courses), hole(s, z) where there is no stone (a door, a window)
    const wall = (s0, s1, at, along, top, hole = () => false) => { for (let k = 0; ; k++) { const z = k * CO; let any = false;
      for (let s = s0 - (k % 2 ? BL / 2 : 0); s < s1; s += BL) { const a = Math.max(s0, s), b = Math.min(s1, s + BL), m = (a + b) / 2; if (b - a < 8 || z >= top(m) || hole(m, z + CO / 2)) continue; any = true;
        const j = k + Math.round(m / BL) + 400, c = (j * 3) % 5 === 0 ? FN.moss : S[j % 4];
        if (along) G.box(m, at, z + CO / 2, (b - a) / 2 - 0.6, t / 2, CO / 2 - 0.4, c); else G.box(at, m, z + CO / 2, t / 2, (b - a) / 2 - 0.6, CO / 2 - 0.4, c); }
      if (!any && z > h + 300) break; } };
    // an arch of voussoirs over an opening in a wall along Y at x: centred at y = 0, springing at z0, radius r
    const arch = (x, z0, r) => { const n = 9; for (let i = 0; i < n; i++) { const a = ((i + 0.5) / n) * Math.PI, b = G.n; G.box(0, 0, 0, t / 2 + 1, (Math.PI * (r + 12)) / n / 2 - 0.8, 12, S[i % 4]); G.place(b, { x, y: Math.cos(a) * (r + 12), z: z0 + Math.sin(a) * (r + 12), roll: deg(a) - 90 }); } };
    const q = (v) => Math.round(v / CO) * CO;
    // the long walls, broken lower toward the west
    const ruin = (s) => q(h * (0.55 + 0.45 * Math.max(0, Math.min(1, (s + hl) / L))) * (0.82 + 0.18 * Math.sin(s * 0.013 + 1.3)));
    for (const sy of [-1, 1]) wall(-hl, hl, sy * (hw - t / 2), true, ruin);
    // the east wall and its gable, the window's opening through both, its arch over it
    const winZ0 = h - 150, winZ1 = h + 40, winR = 62;
    wall(-hw + t, hw - t, hl - t / 2, false, (s) => q(h + Math.max(0, (hw - t - Math.abs(s)) / (hw - t)) * 200), (s, z) => Math.abs(s) < winR + 4 && z > winZ0 && (z < winZ1 || Math.hypot(s, z - winZ1) < winR + 20));
    arch(hl - t / 2, winZ1, winR); G.box(hl - t / 2, 0, winZ0 - 6, t / 2 + 4, winR + 14, 6, S[3]);
    // the west wall either side of the door, its arch, the stone over it
    const doorZ = 200; wall(-hw + t, hw - t, -hl + t / 2, false, () => west, (s, z) => Math.abs(s) < door + 4 && (z < doorZ || Math.hypot(s, z - doorZ) < door + 20));
    arch(-hl + t / 2, doorZ, door);
    // the floor: flags, green in the joints, a step at the door
    for (let x = -hl + t + 30; x < hl - t; x += 60) for (let y = -hw + t + 30; y < hw - t; y += 60) G.box(x, y, 1.2, 28.5, 28.5, 1.2, (Math.round(x / 60) + Math.round(y / 60)) % 5 ? S[(Math.round(x / 60) * 3 + Math.round(y / 60) + 40) % 4] : FN.mossD);
    G.box(-hl - 30, 0, 6, 32, door + 10, 6, S[1]);
    // fallen stones by the broken walls
    for (let i = 0; i < 14; i++) { const sy = i % 2 ? 1 : -1, x = -hl + 60 + R() * (L * 0.6), y = sy * (hw + 40 + R() * 90), sz = 14 + R() * 10; G.box(x, y, sz * 0.7, sz * 1.4, sz, sz * 0.7, S[i % 4]); }
  })];
}

// ---- an alder of the carr: a slim dark trunk, a few limbs, a crown of dark leaf in soft lumps well over a gnome's head
export function alder(h = 1100, seed = 1) {
  seed = N(seed); h = q(h, 100);
  return ['falder|' + [h, seed % 3].join('|'), shape((G) => {
    const R = rng(seed * 43 + h), tr = h * 0.035, lf = [0x2e4a26, 0x34522a, 0x2a4422][seed % 3];
    G.lathe([[tr * 1.5, -10], [tr * 1.1, h * 0.12], [tr * 0.75, h * 0.55], [tr * 0.4, h * 0.8]], (k) => (k ? 0x4a4038 : 0x3a322a), 8);
    const lumps = [[0, 0, h * 0.78, h * 0.2]];
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + R(), L = h * 0.2, z0 = h * (0.42 + i * 0.05), tip = [Math.cos(a) * L, Math.sin(a) * L, z0 + h * 0.16];
      G.tube([[0, 0, z0], [tip[0] * 0.6, tip[1] * 0.6, z0 + h * 0.1], tip], (t) => tr * 0.4 * (1 - t * 0.6), 0x4a4038, { S: 4, M: 3 }); lumps.push([tip[0], tip[1], tip[2] + h * 0.04, h * (0.14 + R() * 0.03)]); }
    lumps.forEach(([x, y, z, r], i) => G.blob(x, y, z, r * 1.1, r * 1.1, r * 0.85, (nx, ny, nz) => (nz > 0.5 ? mix(lf, 0x6a9040, 0.25) : nz < -0.35 ? dark(lf, 0.7) : lf), { nu: 9, nv: 6, warp: (px, py, pz, nx, ny, nz) => { const w = 1 + wob(nx * 3 + i, ny * 3 + nz * 2) * 0.12; return [px * w, py * w, pz * w]; } }));
  })];
}
export const alderTrunk = (h) => q(h, 100) * 0.035 * 1.5;
// ---- reeds at the water's edge: green blades with paler tips, a couple of brown heads (lighter than the village's)
export function fenReeds(h = 150, seed = 1) {
  seed = N(seed); h = q(h, 10);
  return ['freeds|' + [h, seed % 4].join('|'), shape((G) => {
    const R = rng(seed * 23 + h);
    for (let i = 0; i < 9; i++) { const a = R() * Math.PI * 2, lean = 0.08 + R() * 0.3, L = h * (0.55 + R() * 0.5), w0 = 2.6 + R() * 1.4, col = i % 3 ? 0x6a8a3a : 0x86a24a, tip = mix(col, 0xc8b878, 0.5), ox = Math.cos(a) * R() * 14, oy = Math.sin(a) * R() * 14;
      G.surf((u, v) => { const t = v, b = lean * t * t * L, w = w0 * (1 - t * 0.9), s = (u - 0.5) * 2; return [ox + Math.cos(a) * b - Math.sin(a) * w * s, oy + Math.sin(a) * b + Math.cos(a) * w * s, L * t]; }, 0, 1, 1, 0, 1, 4, (u, v) => (v > 0.75 ? tip : col)); }
    for (let i = 0; i < 2; i++) { const a = R() * 6.28, L = h * (0.9 + R() * 0.3), ox = Math.cos(a) * 8, oy = Math.sin(a) * 8, tx = ox + Math.cos(a) * L * 0.08, ty = oy + Math.sin(a) * L * 0.08;
      G.tube([[ox, oy, 0], [tx, ty, L]], 1.3, 0x7a8a44, { S: 3, M: 1 }); G.blob(tx, ty, L - 12, 4.2, 4.2, 13, 0x6a4026, { nu: 5, nv: 4 }); }
  })];
}
