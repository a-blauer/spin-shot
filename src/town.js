// The town's lost gnomes and the last boss's prize. The bottom of every Descent holds one thing worth bringing home: a gnome
// the Blight has caged, or a machine it has bound in chains. buildPrize makes it, standing in the raid's arena; free()
// opens it when the boss falls.
import * as THREE from 'three';
import { buildCharacter, animateCharacter } from './character.js';
import { DEFAULT_LOOK, COSMETICS } from './cosmetics.js';
import { GNOMES, MACHINE_NAMES } from './meta.js';
import { toonMaterial } from './render.js';

export const townLook = (o) => { const L = Object.assign({}, DEFAULT_LOOK, o); for (const k of Object.keys(o)) if (COSMETICS[k] && !COSMETICS[k].some((I) => I.id === o[k])) L[k] = DEFAULT_LOOK[k]; return L; };
export const GNOME_LOOK = {
  trainer: townLook({ hat: 'flatcap', hatcol: 'red', outfit: 'singlet', beard: 'short', stache: 'walrus', haircol: 'grey', nose: 'bulb', tone: 't5', gloves: 'knuckles' }),
  forge: townLook({ hat: 'cap', hatcol: 'navy', outfit: 'apron', beard: 'forked', haircol: 'snow', nose: 'bulb', tone: 't4', face: 'pipe' }),
  lectern: townLook({ hat: 'wizard', hatcol: 'plum', hattip: 'star', outfit: 'duster', beard: 'none', stache: 'none', hair: 'long', haircol: 'snow', nose: 'pointed', tone: 't2', blush: 'rosy' }),
};
export const gnomeOf = (id) => GNOMES.find((G) => G.id === id);

const M = (c) => toonMaterial({ color: c });
const IRON = M(0x34343c), IRONL = M(0x5a5a66), RUST = M(0x7a4228);
const STONE = M(0x8a8270), STONED = M(0x625a4a), BRASS = M(0xd8a83e);
const ROT = M(0x4e6a34), GLOW = new THREE.MeshBasicMaterial({ color: 0x9affb0 }), GLOWD = new THREE.MeshBasicMaterial({ color: 0x5ac070 });
const add = (P, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = m.receiveShadow = true; P.add(m); return m; };
const tube = (pts, r, mat, P, seg = 24) => { const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))); return add(P, new THREE.TubeGeometry(c, seg, r, 8), mat, 0, 0, 0); };

// a few pale caps and a skin of rot where the Blight has its hold
function blight(P, at, n, r, seed) {
  let s = seed; const R = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) {
    const a = R() * 6.28, d = R() * r, h = 14 + R() * 26, x = at[0] + Math.cos(a) * d, z = at[2] + Math.sin(a) * d;
    add(P, new THREE.CylinderGeometry(3, 4, h, 6), M(0xd8d0b0), x, at[1] + h / 2, z);
    add(P, new THREE.SphereGeometry(8 + R() * 9, 10, 6, 0, 6.28, 0, 1.5), R() < 0.5 ? GLOW : GLOWD, x, at[1] + h, z);
  }
}
// the stone it stands on: a squat round plinth, chipped, with a step
function plinth(P, r) {
  add(P, new THREE.CylinderGeometry(r * 1.12, r * 1.2, 30, 20), STONED, 0, 15, 0);
  add(P, new THREE.CylinderGeometry(r, r * 1.06, 60, 20), STONE, 0, 60, 0);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.28 + 0.2; add(P, new THREE.BoxGeometry(40, 20, 26), STONED, Math.cos(a) * (r - 6), 92, Math.sin(a) * (r - 6), 0, -a, 0); }
  add(P, new THREE.TorusGeometry(r * 0.98, 6, 6, 32), ROT, 0, 90, 0, Math.PI / 2);
  return 90;
}

// ---- a caged gnome: an iron birdcage on a chain from a hooked post, the gnome inside on the cage floor
function cage(P, id) {
  const top = plinth(P, 200);
  // the post: an iron column up from the back of the plinth, curling over into a hook
  tube([[0, top, -150], [0, top + 380, -150], [0, top + 540, -120], [0, top + 600, -20], [0, top + 560, 60], [0, top + 490, 40]], 14, IRON, P, 40);
  add(P, new THREE.CylinderGeometry(26, 30, 40, 10), IRONL, 0, top + 20, -150);
  const hang = new THREE.Group(); hang.position.set(0, top + 490, 40); P.add(hang);
  for (let i = 0; i < 6; i++) add(hang, new THREE.TorusGeometry(12, 3.5, 6, 12), IRONL, 0, -14 - i * 22, 0, 0, i % 2 ? Math.PI / 2 : 0, 0);
  const C = new THREE.Group(); C.position.set(0, -150, 0); C.rotation.y = -Math.PI / 2; hang.add(C);   // turned so its door (on its +x) faces the way in
  const R = 120, H = 260, N = 14, floor = -H;
  add(C, new THREE.CylinderGeometry(R + 8, R + 12, 16, 24), IRON, 0, floor, 0);                    // floor pan
  add(C, new THREE.TorusGeometry(R, 5, 6, 32), IRONL, 0, floor + 12, 0, Math.PI / 2);
  add(C, new THREE.TorusGeometry(R, 5, 6, 32), IRONL, 0, -70, 0, Math.PI / 2);                     // top band
  add(C, new THREE.TorusGeometry(R, 3.5, 6, 32), IRON, 0, floor * 0.55, 0, Math.PI / 2);           // middle band
  const door = new THREE.Group(); door.position.set(Math.cos(-0.45) * R, 0, Math.sin(-0.45) * R); C.add(door);   // hinge on the side facing you
  for (let i = 0; i < N; i++) {
    const a = (i / N) * 6.28, x = Math.cos(a) * R, z = Math.sin(a) * R, inDoor = a > 6.28 - 0.45 || a < 0.45 + 0.01;
    const bar = [[x, floor, z], [x, -70, z], [x * 0.6, -20, z * 0.6], [0, 6, 0]];
    if (inDoor) { const m = tube(bar.slice(0, 2).map((p) => [p[0] - door.position.x, p[1], p[2] - door.position.z]), 3.2, IRON, door, 4); m.userData.d = 1; tube(bar.slice(1), 3.2, IRON, C, 12); }
    else tube(bar, 3.2, IRON, C, 16);
  }
  add(door, new THREE.BoxGeometry(6, 30, 46), BRASS, Math.cos(0.4) * R - door.position.x + 4, floor * 0.5, Math.sin(0.4) * R - door.position.z);   // the padlock
  add(C, new THREE.TorusGeometry(16, 5, 6, 14), IRONL, 0, 18, 0);                                  // top ring
  // the Blight's hold: rot climbing the bars, caps on the floor pan and the dome
  for (let i = 0; i < 5; i++) { const a = 1.2 + i * 1.0; tube([[Math.cos(a) * R, floor + 10, Math.sin(a) * R], [Math.cos(a + 0.2) * (R + 4), floor + 90, Math.sin(a + 0.2) * (R + 4)], [Math.cos(a + 0.1) * (R + 2), floor + 170, Math.sin(a + 0.1) * (R + 2)]], 6, ROT, C, 10); }
  blight(C, [0, floor + 8, 0], 4, R - 30, 7);
  // the gnome, sitting low on the pan with his arms up on the bars
  const gn = buildCharacter(GNOME_LOOK[id] || GNOME_LOOK.trainer); gn.scale.setScalar(0.95); gn.position.set(0, floor + 8, -10); gn.rotation.y = 0;
  if (gn.userData.rig && gn.userData.rig.gun) gn.userData.rig.gun.visible = false;
  C.add(gn); blight(P, [0, top, 0], 9, 170, 3);
  return { hang, C, door, gn, floor, R };
}

// ---- a bound machine: a heavy iron cabinet with the machine's glow behind its glass, chained to the plinth and grown over
function bound(P, id) {
  const top = plinth(P, 220);
  const body = new THREE.Group(); body.position.y = top; P.add(body);
  add(body, new THREE.BoxGeometry(260, 300, 180), IRON, 0, 150, 0);
  add(body, new THREE.BoxGeometry(276, 20, 196), IRONL, 0, 306, 0); add(body, new THREE.BoxGeometry(276, 20, 196), IRONL, 0, 10, 0);
  for (const x of [-120, 120]) add(body, new THREE.BoxGeometry(24, 300, 196), IRONL, x, 150, 0);
  for (const x of [-120, 120]) for (const y of [30, 150, 270]) add(body, new THREE.SphereGeometry(7, 8, 6), BRASS, x, y, 99);
  const glass = add(body, new THREE.BoxGeometry(170, 150, 6), new THREE.MeshBasicMaterial({ color: 0x3a8a70, transparent: true, opacity: 0.8 }), 0, 190, 92);
  const core = add(body, new THREE.IcosahedronGeometry(42, 1), new THREE.MeshBasicMaterial({ color: 0x8affd8 }), 0, 190, 40);
  add(body, new THREE.BoxGeometry(200, 50, 10), BRASS, 0, 70, 92);
  tube([[100, 300, 0], [100, 380, -20], [60, 420, -60], [0, 430, -60]], 9, BRASS, body, 12);       // a steam line out of the top
  add(body, new THREE.CylinderGeometry(22, 22, 30, 12), IRONL, 0, 430, -60);
  // chains: four runs over the cabinet, staked into the plinth at the corners
  const chains = new THREE.Group(); P.add(chains);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const a = new THREE.Vector3(sx * 200, top + 2, sz * 150), b = new THREE.Vector3(sx * 60, top + 318, sz * 50), n = 7;
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, p = a.clone().lerp(b, t); p.y += Math.sin(t * Math.PI) * 30; const l = add(chains, new THREE.TorusGeometry(22, 7, 6, 12), RUST, p.x, p.y, p.z); l.lookAt(b); if (i % 2) l.rotateZ(Math.PI / 2); }
    add(chains, new THREE.CylinderGeometry(10, 16, 50, 8), IRONL, a.x, top + 10, a.z);
  }
  add(chains, new THREE.CylinderGeometry(70, 70, 40, 16), RUST, 0, top + 322, 0);   // the knot the chains meet at, and its lock
  add(chains, new THREE.BoxGeometry(50, 60, 24), BRASS, 0, top + 300, 70);
  // the Blight over it: a cap of rot on the top, caps around its foot
  add(body, new THREE.SphereGeometry(110, 16, 8, 0, 6.28, 0, 0.9), ROT, 40, 270, -30);
  blight(body, [40, 320, -30], 6, 70, 11); blight(P, [0, top, 0], 10, 200, 5);
  return { body, chains, core, glass };
}

// what the boss holds, in its arena. P = { kind: 'gnome'|'machine'|'hoard', id }
export function buildPrize(P) {
  const root = new THREE.Group(); root.name = 'prize';
  const o = { root, P, freed: false, t: 0, ft: 0, label: P.kind === 'gnome' ? gnomeOf(P.id).name : P.kind === 'machine' ? MACHINE_NAMES[P.id] : 'Gold' };
  if (P.kind === 'gnome') o.cage = cage(root, P.id);
  else if (P.kind === 'machine') o.mach = bound(root, P.id);
  else { plinth(root, 200); for (let i = 0; i < 26; i++) { const a = i * 2.4, r = 20 + (i % 7) * 18; add(root, new THREE.CylinderGeometry(22, 22, 8, 14), BRASS, Math.cos(a) * r, 94 + (i % 5) * 9, Math.sin(a) * r, (i % 3) * 0.2); } }
  root.scale.setScalar(P.kind === 'machine' ? 0.62 : 0.8);
  o.free = () => { o.freed = true; o.ft = 0; };
  o.tick = (dt) => {
    o.t += dt; if (o.freed) o.ft += dt;
    const C = o.cage, Mc = o.mach;
    if (C) {
      C.hang.rotation.z = Math.sin(o.t * 0.9) * (o.freed ? 0.02 : 0.05); C.hang.rotation.x = Math.sin(o.t * 0.7 + 1) * 0.03;
      const k = Math.min(1, o.ft / 0.8); C.door.rotation.y = -k * 1.9;
      // shaking the bars until freed; after, he climbs out and waves, then stands on the plinth
      if (!o.freed) { animateCharacter(C.gn, o.t, 0, { rest: true }); const R = C.gn.userData.rig; R.armL.rotation.x = -2.4 + Math.sin(o.t * 9) * 0.15; R.armR.rotation.x = -2.4 + Math.sin(o.t * 9 + 1) * 0.15; C.gn.position.x = Math.sin(o.t * 9) * 2; }
      else {
        const s = Math.min(1, Math.max(0, (o.ft - 0.6) / 1.4));
        if (C.gn.parent === C.C && s > 0) { root.attach(C.gn); }
        if (C.gn.parent === root) { const w = C.gn.position, tx = 0, tz = 200; w.x += (tx - w.x) * Math.min(1, dt * 3); w.z += (tz - w.z) * Math.min(1, dt * 3); w.y += (92 - w.y) * Math.min(1, dt * 4); C.gn.scale.setScalar(C.gn.scale.x + (1.25 - C.gn.scale.x) * Math.min(1, dt * 3)); }
        animateCharacter(C.gn, o.t, o.ft < 2.2 ? 300 : 0, { rest: true }); const R = C.gn.userData.rig; if (o.ft > 2.2) { R.armR.rotation.x = -2.6 + Math.sin(o.t * 8) * 0.35; R.armR.rotation.z = 0.3; }
      }
    }
    if (Mc) {
      Mc.core.rotation.y += dt * (o.freed ? 3 : 0.6); Mc.core.scale.setScalar(1 + Math.sin(o.t * (o.freed ? 6 : 2)) * 0.06);
      if (o.freed) { const k = Math.min(1, o.ft / 1.2); Mc.chains.position.y = -k * k * 300; Mc.chains.scale.setScalar(Math.max(0.01, 1 - k)); }
    }
  };
  return o;
}
