// The Engineer's turret. It fires whatever gun is bound to it: press E on it while holding a gun and that gun is the
// turret's from then on (you get back whatever it held before). With nothing bound it fires a built-in sentry gun.
import * as THREE from 'three';
import { DATA, hexRGB, RARITY_HEX, zombieHealth } from './data.js';
import { toonMaterial } from './render.js';
import { PRIM } from './world.js';
import { ViewModel } from './viewmodel.js';
import { gunSound } from './gunsound.js';

const mats = new Map();
const mat = (hexc, glow = 0) => { const k = hexc + '|' + glow; if (!mats.has(k)) { const m = toonMaterial({ glow }); m.uniforms.uColor.value.set(hexc); mats.set(k, m); } return mats.get(k); };
const box = (parent, x, y, z, sx, sy, sz, col, glow = 0, geo = 0) => { const m = new THREE.Mesh(PRIM.GEOS[geo], mat(col, glow)); m.position.set(x, y, z); m.scale.set(sx, sy, sz); parent.add(m); return m; };
const SENTRY = { name: 'Sentry Gun', dmg: 26, rate: 4, pellets: 1, range: 2200, mode: 'Hitscan', splash: 0, color: 0x9CCBFF, critBonus: 0, burn: 0, slow: 0, cls: 'SMG', rarity: 'Common', spread: 1.5 };

export class Turret {
  constructor(game, pos, builtinOnly = false) {
    this.game = game; this.type = 'Turret'; this.useRadius = 210; this.enabled = true; this.open = false;
    this.builtinOnly = builtinOnly;                 // the second turret (Twin Mount) cannot take a gun
    this.bound = null;                              // { def, tier, mods }
    this.cd = 0; this.scan = 0; this.target = null; this.shock = 0; this.age = 0; this.kick = 0;
    this.group = new THREE.Group(); this.pos = this.group.position;
    // tripod
    for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.5, leg = box(this.group, Math.cos(a) * 26, 30, Math.sin(a) * 26, 7, 70, 7, 0x2b2d33); leg.rotation.z = -Math.cos(a) * 0.42; leg.rotation.x = Math.sin(a) * 0.42; box(this.group, Math.cos(a) * 42, 3, Math.sin(a) * 42, 16, 6, 16, 0x1b1c20); }
    box(this.group, 0, 66, 0, 18, 20, 18, 0x3a3d45, 0, 1); box(this.group, 0, 78, 0, 30, 6, 30, 0x1b1c20, 0, 1);
    this.yawG = new THREE.Group(); this.yawG.position.y = 84; this.group.add(this.yawG);
    box(this.yawG, -19, 14, 0, 5, 30, 26, 0x4a4e58); box(this.yawG, 19, 14, 0, 5, 30, 26, 0x4a4e58); box(this.yawG, 0, 1, 0, 42, 5, 26, 0x2b2d33);
    this.head = new THREE.Group(); this.head.position.y = 20; this.yawG.add(this.head);
    box(this.head, 0, -4, 4, 26, 14, 40, 0x3a3d45); box(this.head, 22, -2, 6, 14, 18, 22, 0x56704a);            // cradle and ammo box
    this.eyeM = box(this.head, 0, 8, -14, 7, 7, 7, 0x6ec8ff, 1.2, 2);
    this.gunG = new THREE.Group(); this.gunG.position.set(0, 6, -4); this.head.add(this.gunG);
    this.setGun(null);
    this.place(pos);
    game.scene.add(this.group);
    game.interactables.push(this);
  }
  get W() { return this.bound ? DATA.weapons[this.bound.def] : SENTRY; }
  setGun(b) {
    this.bound = b; this.shots = 0;
    while (this.gunG.children.length) this.gunG.remove(this.gunG.children[0]);
    if (b) {
      try { const g = ViewModel.displayModel(this.game, b.def, Math.min(4, b.tier || 0)); const bb = new THREE.Box3().setFromObject(g), c = bb.getCenter(new THREE.Vector3()); g.position.sub(c); const s = 1.5; const h = new THREE.Group(); h.add(g); h.scale.setScalar(s); h.rotation.y = Math.PI; this.gunG.add(h); this.len = (bb.max.z - bb.min.z) * s * 0.5; }
      catch (e) { this.len = 30; }
    } else { box(this.gunG, 0, 0, 22, 9, 9, 50, 0x23252b); box(this.gunG, 0, 0, 48, 12, 12, 8, 0x111215); this.len = 52; }
  }
  place(p) { this.group.position.copy(p); this.target = null; this.game.fx.ring(p, 120, [0.43, 0.78, 1], 0.4); }
  isUsable() { return !this.builtinOnly && this.game.player.cls.id === 'engineer'; }
  prompt(P) {
    const S = P.slot, held = S.def >= 0 ? DATA.weapons[S.def] : null;
    const cur = `Turret gun: ${this.W.name}.`;
    if (!held) return cur;
    if (P.gunCount() < 2) return `${cur}\nPick up a second gun and you can bind one to the turret.`;
    return `[E] Bind ${held.name} to the turret\n${cur} ${this.bound ? `You get the ${this.W.name} back.` : 'It is the turret\'s from then on.'}`;
  }
  muzzle() { const v = new THREE.Vector3(0, 6, this.len + 6); return this.head.localToWorld(v); }
  update(dt) {
    const G = this.game, P = G.player, W = this.W;
    this.age += dt; this.cd -= dt; this.scan -= dt; this.kick = Math.max(0, this.kick - dt * 8);
    this.gunG.position.z = -4 - this.kick * 6;
    const eye = new THREE.Vector3(this.pos.x, this.pos.y + 108, this.pos.z), range = Math.min(W.range || 2200, 2600) * (1 + P.stat('TurretRange'));
    if (this.scan <= 0 || (this.target && (this.target.dead || this.target.burrowed))) {
      this.scan = 0.25; let best = null, bd = range;
      for (const E of G.enemies) {
        if (E.dead || E.burrowed) continue;
        const d = E.pos.distanceTo(eye); if (d >= bd) continue;
        if (!G.phys.lineOfSight(eye, E.pos)) continue;
        bd = d; best = E;
      }
      this.target = best;
    }
    const T = this.target;
    if (!T) { this.yawG.rotation.y += dt * 0.6; this.head.rotation.x += (0 - this.head.rotation.x) * Math.min(1, dt * 4); }
    else {
      const aim = T.pos.clone(); aim.y += (T.hitH || 100) * 0.15;
      const dx = aim.x - eye.x, dz = aim.z - eye.z, want = Math.atan2(dx, dz);
      let dy = want - this.yawG.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
      this.yawG.rotation.y += dy * Math.min(1, dt * 12);
      this.head.rotation.x += (-Math.atan2(aim.y - eye.y, Math.hypot(dx, dz)) - this.head.rotation.x) * Math.min(1, dt * 12);
      if (this.cd <= 0 && Math.abs(dy) < 0.25) this.fire(T, aim, W, P);
    }
    // Shock Fence: anything that gets close is zapped and slowed
    const shock = P.stat('TurretShock');
    if (shock > 0) { this.shock -= dt; if (this.shock <= 0) { this.shock = 1; for (const E of G.enemies) if (!E.dead && !E.burrowed && E.pos.distanceTo(this.pos) < 380) { E.applySlow(E.isBoss ? 0.25 : 0.5, 1.3); P.dealDamage(E, P.power() * 0.25 * shock, E.pos, null, false, 0, true, 0, 0, 0, 0, [0.5, 0.8, 1]); G.fx.arc(eye, E.pos, [0.5, 0.8, 1]); } } }
    this.eyeM.material = mat(T ? 0xff5a3a : 0x6ec8ff, 1.2);
  }
  fire(T, aim, W, P) {
    const G = this.game, cont = W.mode === 'Beam' || W.mode === 'Flame';
    const rate = (cont ? 8 : W.rate * 0.7) * (1 + P.stat('TurretRate'));
    this.cd = 1 / Math.max(0.3, rate);
    // a bound gun still has a magazine: the turret stops to reload it
    if (this.bound) { this.shots = (this.shots || 0) + (cont ? W.rate / 8 : 1); if (this.shots >= (W.mag || 1)) { this.shots = 0; this.cd += W.reload || 2; } }
    const tier = this.bound ? (this.bound.tier || 0) : 0;
    const round = Math.max(1, G.round);
    let dmg = (this.bound ? W.dmg * (1 + 0.2 * tier) * (cont ? W.rate / 8 : 1) : Math.max(SENTRY.dmg * (1 + 0.15 * (round - 1)), zombieHealth(round) * 0.12)) * (1 + P.stat('TurretDamage'));
    const from = this.muzzle(), col = hexRGB(W.color || 0x9CCBFF);
    this.kick = 1;
    if (from.distanceTo(P.pos) < 3200) gunSound(G.audio, this.bound ? W.name : 'Back-Alley', 0.3, false);
    G.fx.flash(from, [1, 0.85, 0.5], 60, 0.06, false);
    const pellets = Math.max(1, W.pellets || 1), spread = (W.spread || 1) * 0.012;
    for (let p = 0; p < pellets; p++) {
      const dir = aim.clone().sub(from).normalize(); dir.x += (Math.random() - 0.5) * spread; dir.y += (Math.random() - 0.5) * spread; dir.z += (Math.random() - 0.5) * spread; dir.normalize();
      if (W.mode === 'Hitscan' || cont) {
        let hit = null, bt = (W.range || 2200) * (1 + P.stat('TurretRange')); const wall = G.phys.raycast(from, dir, bt); if (wall) bt = wall.distance;
        for (const E of G.enemies) { if (E.dead || E.burrowed) continue; const t = G.rayEnemy(from, dir, bt, E, 6); if (t !== null && t < bt) { bt = t; hit = E; } }
        const at = from.clone().addScaledVector(dir, bt);
        G.fx.tracer(from, at, col, cont ? 8 : 3, 0.06);
        if (hit) { P.dealDamage(hit, dmg, at, dir, at.y > hit.headY(), 0.25 / pellets, false, W.critBonus || 0, (W.burn || 0) + P.stat('TurretBurn'), W.slow || 0, 0); if (W.splash > 0) P.explodeAt(at, W.splash, dmg * 0.6, 0.1, true, false, col, hit); }
        else if (wall && W.splash > 0) P.explodeAt(at, W.splash, dmg * 0.6, 0.1, true, false, col, null);
      } else if (W.mode === 'Chain') P.fireChain(from, dir, dmg, W);
      else P.fireProjectile(from, dir, dmg, 0.25 / pellets, W);
    }
  }
  // E on the turret: the gun in your hands becomes the turret's
  bind(P) {
    const S = P.slot; if (S.def < 0) return;
    if (P.gunCount() < 2) { P.toast('You need a second gun before you can give one to the turret', '#ccc'); P.play('S_Deny', 0.5); return; }
    const old = this.bound, W = DATA.weapons[S.def];
    this.setGun({ def: S.def, tier: S.tier, mods: (S.mods || []).slice() });
    if (old) { S.def = old.def; S.tier = old.tier; S.mods = old.mods || []; S.ammo = P.magSize(S); S.reserve = P.reserveSize(S); P.recompute(); G_vm(P, S); }
    else { P.returnCores(S); S.def = -1; S.tier = 0; S.mods = []; S.ammo = 0; S.reserve = 0; P.cycleWeapon(1); }
    P.toast(`${W.name} is bound to the turret`, RARITY_HEX[W.rarity]); P.play('S_MagIn', 0.9, 0.8);
  }
  destroy() { this.game.scene.remove(this.group); const i = this.game.interactables.indexOf(this); if (i >= 0) this.game.interactables.splice(i, 1); }
}
function G_vm(P, S) { P.reloading = false; P.fireCd = 0.4; P.game.vm.setWeapon(S.def, Math.min(4, S.tier), true); }

// ---- The Engineer's shoulder turret. It rides on your right shoulder, comes out for a while when you call it (F), finds
// its own targets and fires on them, then folds away. Its type is chosen at the workbench, and gun parts fitted to it
// there work on it: their numbers (damage, fire rate, crit; a bigger magazine keeps it out longer, faster reload brings
// it back sooner, more projectiles add pellets) and their on-hit effects.
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const TURRET_TYPES = [
  { id: 'sentry', name: 'Sentry', text: 'A quick hitscan gun that is good at any range.', rate: 3, dmg: 1, range: 2400, pellets: 1, spread: 1.2, col: 0x9ccbff, snd: 'Back-Alley' },
  { id: 'scatter', name: 'Scattergun', text: 'Blasts of six pellets. Murderous up close, useless far off.', rate: 1.1, dmg: 0.5, range: 1000, pellets: 6, spread: 7, col: 0xffc070, snd: 'Sawbuck' },
  { id: 'tesla', name: 'Tesla Coil', text: 'Lightning that jumps on to 3 more enemies and slows everything it touches.', rate: 0.9, dmg: 2.4, range: 1500, chains: 3, col: 0x9a8cff, snd: 'Tesla Coil' },
  { id: 'flamer', name: 'Flamer', text: 'A short cone of fire that sets everything in it alight.', rate: 8, dmg: 0.13, range: 650, flame: true, col: 0xff7a1a, snd: 'Hellfire Hose' },
];
export const turretType = (id) => TURRET_TYPES.find((t) => t.id === id) || TURRET_TYPES[0];
export const TURRET_TIME = 10;
// what the fitted parts add up to
export function turretStats(P) {
  const m = {}, procs = [];
  for (const u of P.turretCores || []) { const U = DATA.upgrades[u]; for (const [k, v] of U.mods || []) m[k] = (m[k] || 0) + v; if (U.trigger === 'OnHit' && U.fx) procs.push(u); }
  const T = turretType(P.turretType), s = (k) => m[k] || 0;
  return {
    T, procs,
    dmg: Math.max(0.1, 1 + s('Damage') + P.stat('TurretDamage')), rate: Math.max(0.2, 1 + s('FireRate') + P.stat('TurretRate')) * (P.cv === 'over' ? 1.6 : 1), crit: s('CritChance'),
    time: TURRET_TIME * (1 + s('MagSize')) * (P.cv === 'over' ? 0.6 : P.cv === 'watch' ? 1.8 : 1), cdK: (1 / (1 + s('ReloadSpeed'))) * (P.cv === 'watch' ? 1.35 : 1), pellets: (T.pellets || 1) + Math.round(s('Multishot')) * (T.pellets > 1 ? 2 : 1),
    chains: (T.chains || 0) + Math.round(s('Pierce') + s('Ricochet')), range: T.range * (1 + P.stat('TurretRange')), steal: s('Lifesteal'), burn: P.stat('TurretBurn'),
  };
}
// ---- the shoulder turret's body, shared by the turret itself and the workbench. Built about its swivel: the mount below,
// the yoke turns (yawG), the head tips (head), and the business end (barrel) is built along +z and turned to face -z.
const cylA = (parent, x, y, z, d, len, axis, col, glow = 0, geo = 1) => { const m = box(parent, x, y, z, d, len, d, col, glow, geo); if (axis === 'z') m.rotation.x = Math.PI / 2; else if (axis === 'x') m.rotation.z = Math.PI / 2; return m; };
const torus = (parent, x, y, z, d, axis, col, glow = 0) => { const m = box(parent, x, y, z, d, d, d, col, glow, 8); if (axis === 'y') m.rotation.x = Math.PI / 2; else if (axis === 'x') m.rotation.y = Math.PI / 2; return m; };
const GUNMETAL = 0x34373f, DARK = 0x1d1e23, BRASS = 0xb8923a, LEATHER = 0x5a3a24, COPPER = 0xc87a3a;
export function turretBody() {
  const group = new THREE.Group(), arm = new THREE.Group(); group.add(arm);
  // the mount: a riveted plate strapped to the shoulder, a pedestal and a brass swivel ring
  box(arm, 0, -6.4, 0.4, 12.5, 2.2, 11.5, GUNMETAL, 0, 7); box(arm, 0, -5.2, 0.4, 10.4, 0.5, 9.4, 0x454953, 0, 7);
  for (const x of [-4.4, 4.4]) { box(arm, x, -8.6, 0.4, 1.6, 4.4, 10.6, LEATHER); box(arm, x, -6.6, -5.3, 2.2, 1.6, 0.5, BRASS); }
  for (const [x, z] of [[-5, -4], [5, -4], [-5, 4.8], [5, 4.8]]) box(arm, x, -5, z, 0.8, 0.8, 0.8, BRASS, 0, 2);
  cylA(arm, 0, -3.6, 0, 5.6, 3, 'y', 0x454953); torus(arm, 0, -2.1, 0, 7.2, 'y', BRASS);
  const yawG = new THREE.Group(); arm.add(yawG);
  // the yoke: a turntable and two arms that hold the head on its trunnions
  cylA(yawG, 0, -1.2, 0, 7, 1.2, 'y', GUNMETAL);
  for (const x of [-4.5, 4.5]) { box(yawG, x, 1.4, 0.4, 1.3, 6, 4.6, GUNMETAL); cylA(yawG, x * 1.13, 2.5, 0, 2.6, 0.9, 'x', BRASS); }
  const head = new THREE.Group(); head.position.y = 2.5; yawG.add(head);
  // the head: an armoured box with a bevelled top, a lit sensor in a hood, a stub of aerial
  box(head, 0, 0, 0.6, 7.2, 4.8, 9, GUNMETAL); box(head, 0, 2.7, 0.9, 6, 0.7, 7.6, 0x454953); box(head, 0, -2.6, 0.6, 6.4, 0.5, 8, DARK);
  box(head, 0, 0.2, 5.1, 7.8, 5.4, 1.2, 0x2a2c33); for (const y of [-1.2, 0.4, 2]) box(head, 0, y, 5.8, 5.6, 0.5, 0.3, DARK);   // the back plate, louvred
  const stripe = []; for (const x of [-3.7, 3.7]) { box(head, x, 0, 0.6, 0.3, 3.6, 7.4, 0x2a2c33); stripe.push(box(head, x * 1.03, 0.9, 0.6, 0.2, 0.7, 6.8, 0x6ec8ff, 0.5)); }
  cylA(head, 0, 1.4, -4.1, 2.8, 1.2, 'z', DARK); const eye = box(head, 0, 1.4, -4.6, 1.7, 1.7, 1.7, 0x6ec8ff, 1.2, 2);
  cylA(head, -2.6, 4.6, 3.4, 0.3, 3.8, 'y', DARK); box(head, -2.6, 6.6, 3.4, 0.7, 0.7, 0.7, 0xff5a3a, 1.4, 2);
  const barrel = new THREE.Group(); barrel.rotation.y = Math.PI; barrel.position.z = -4.4; head.add(barrel);
  return { group, arm, yawG, head, barrel, eye, stripe };
}
// what sticks out of the head, by type, built along +z from the face of the head
export function dressTurret(barrel, T, stripe) {
  while (barrel.children.length) barrel.remove(barrel.children[0]);
  const B = barrel, c = T.col;
  if (stripe) for (const m of stripe) m.material = mat(c, 0.5);
  if (T.id === 'sentry') {
    cylA(B, 0, 0, 2.4, 3, 4.4, 'z', GUNMETAL); for (const z of [1, 2.4, 3.8]) torus(B, 0, 0, z, 3.2, 'z', DARK);   // the cooling shroud
    cylA(B, 0, 0, 7.4, 1.3, 9, 'z', DARK); box(B, 0, 0, 11.6, 2.4, 1.3, 1.8, GUNMETAL); for (const x of [-0.8, 0.8]) box(B, x, 0, 11.6, 0.3, 1.5, 0.9, DARK);   // barrel and its brake
    torus(B, 0, 0, 10.2, 1.9, 'z', c, 1.2);
    box(B, 3.8, -1, -0.6, 1.8, 2.6, 3.4, 0x4a4a2a); for (let i = 0; i < 4; i++) box(B, 2.6 - i * 0.5, -2.4 - i * 0.6, -0.6, 0.7, 0.5, 1.2, BRASS);   // the ammunition box and its belt
  } else if (T.id === 'scatter') {
    for (const x of [-1.15, 1.15]) { cylA(B, x, 0, 4.6, 1.8, 8.2, 'z', DARK); cylA(B, x, 0, 9.2, 2.5, 1.2, 'z', GUNMETAL, 0, 3).rotation.x = -Math.PI / 2; torus(B, x, 0, 8.6, 2.1, 'z', c, 0.9); }
    for (const z of [1.6, 5.6]) box(B, 0, 0, z, 5, 2.4, 0.9, GUNMETAL); box(B, 0, 1.4, 3.6, 1.2, 0.6, 5, BRASS);
    for (let i = 0; i < 3; i++) cylA(B, -2.9 + i * 0.6, -1.9, 1, 0.9, 2.2, 'y', 0xa8281e);   // a few shells in a side carrier
  } else if (T.id === 'tesla') {
    cylA(B, 0, 0, 1.6, 2.8, 3, 'z', 0xe6e0d0); for (const z of [0.8, 1.8, 2.8]) torus(B, 0, 0, z, 3.2, 'z', 0x8a8478);   // the insulator
    cylA(B, 0, 0, 5.6, 1, 6, 'z', BRASS); for (let i = 0; i < 4; i++) torus(B, 0, 0, 4 + i * 1.1, 3.8 - i * 0.35, 'z', COPPER);   // the coil
    box(B, 0, 0, 9.6, 2.8, 2.8, 2.8, c, 1.4, 2); torus(B, 0, 0, 9.6, 4, 'x', c, 0.9); torus(B, 0, 0, 9.6, 4, 'y', c, 0.6);   // the charged ball, in its rings
  } else {
    cylA(B, 0, 0, 4.4, 2.2, 7, 'z', DARK); for (const z of [2.6, 4.8]) torus(B, 0, 0, z, 2.6, 'z', BRASS);
    cylA(B, 0, 0, 8.6, 2.8, 1.8, 'z', GUNMETAL, 0, 3).rotation.x = -Math.PI / 2;   // the flared nozzle
    box(B, 0, -1.1, 9.6, 0.9, 0.9, 0.9, c, 2, 2);   // the pilot light
    cylA(B, 0, -3, 1.4, 3, 5.2, 'z', 0xa8281e); for (const z of [-0.6, 3.4]) cylA(B, 0, -3, z, 3.1, 0.4, 'z', BRASS); box(B, 0, -1.6, 4.6, 0.6, 1.8, 0.6, BRASS);   // the fuel tank and its feed
  }
}
// the turret as the workbench shows it: the whole thing at rest, its head tipped up a touch
export function turretModel(typeId) { const b = turretBody(); dressTurret(b.barrel, turretType(typeId), b.stripe); b.head.rotation.x = 0.12; b.yawG.rotation.y = 0.5; return b.group; }

export class ShoulderTurret {
  constructor(game) {
    this.game = game; this.t = 0; this.out = 0; this.cd = 0; this.scan = 0; this.target = null; this.kick = 0; this.typeId = '';
    this.group = new THREE.Group(); this.group.visible = false; game.scene.add(this.group);
    const b = turretBody(); this.group.add(b.group); this.arm = b.arm; this.yawG = b.yawG; this.head = b.head; this.barrel = b.barrel; this.eyeM = b.eye; this.stripe = b.stripe;
  }
  dress(T) { if (this.typeId === T.id) return; this.typeId = T.id; dressTurret(this.barrel, T, this.stripe); }
  deploy(P) { const S = turretStats(P); this.t = S.time; this.cd = 0.3; this.dress(S.T); }
  get active() { return this.t > 0; }
  muzzle() { const v = new THREE.Vector3(0, 0, -15); return this.head.localToWorld(v); }
  update(dt, P) {
    const G = this.game; this.t = Math.max(0, this.t - dt); this.out += ((this.t > 0 ? 1 : 0) - this.out) * Math.min(1, dt * 9); this.kick = Math.max(0, this.kick - dt * 8);
    this.group.visible = this.out > 0.02 && !P.dead;
    if (!this.group.visible) return;
    // on the right shoulder, just in view at the top right
    const cam = G.camera, q = cam.quaternion, r = new THREE.Vector3(1, 0, 0).applyQuaternion(q), u = new THREE.Vector3(0, 1, 0).applyQuaternion(q), f = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
    this.group.position.copy(cam.position).addScaledVector(r, 34).addScaledVector(u, -10 + 25 * this.out).addScaledVector(f, 52);
    this.group.quaternion.copy(q); this.arm.scale.setScalar(Math.max(0.01, this.out * 0.55));
    this.barrel.position.z = this.kick * 1.6;
    if (this.t <= 0) return;
    const S = turretStats(P), T = S.T; this.dress(T);
    this.cd -= dt; this.scan -= dt;
    const eye = cam.position.clone().addScaledVector(r, 30).addScaledVector(u, 8);
    if (this.scan <= 0 || (this.target && (this.target.dead || this.target.burrowed))) {
      this.scan = 0.2; let best = null, bd = S.range;
      for (const E of G.enemies) { if (E.dead || E.burrowed || E.emerging) continue; const d = E.pos.distanceTo(eye); if (d >= bd || !G.phys.lineOfSight(eye, E.pos)) continue; bd = d; best = E; }
      this.target = best;
    }
    const E = this.target;
    // turn the head toward it (in the camera's frame)
    if (E) { const aim = E.pos.clone(); aim.y += (E.hitH || 100) * 0.15; const loc = aim.clone().sub(this.group.position).applyQuaternion(q.clone().invert()); this.yawG.rotation.y += (Math.atan2(-loc.x, -loc.z) - this.yawG.rotation.y) * Math.min(1, dt * 14); this.head.rotation.x += (Math.atan2(loc.y, Math.hypot(loc.x, loc.z)) - this.head.rotation.x) * Math.min(1, dt * 14); if (this.cd <= 0) this.fire(E, aim, S, P); }
    else { this.yawG.rotation.y *= 1 - Math.min(1, dt * 4); this.head.rotation.x *= 1 - Math.min(1, dt * 4); }
    this.eyeM.material = mat(E ? 0xff5a3a : 0x6ec8ff, 1.2);
  }
  fire(E, aim, S, P) {
    const G = this.game, T = S.T, rate = T.rate * S.rate; this.cd = 1 / rate; this.kick = 1;
    const round = Math.max(1, G.round), base = 2 * Math.max(26 * (1 + 0.15 * (round - 1)), zombieHealth(round) * 0.12) * S.dmg * T.dmg;
    const from = this.muzzle(), col = hexRGB(T.col);
    if (!T.flame || Math.random() < 0.3) gunSound(G.audio, T.snd, T.flame ? 0.18 : 0.28, false);
    const hit = (O, d, at, dir, coef) => {
      P.dealDamage(O, d, at, dir, at.y > O.headY(), coef, false, S.crit, S.burn > 0 ? d * 0.3 * S.burn : 0, 0, 0);
      if (S.steal > 0) P.combatHeal(d * S.steal);
      for (const u of S.procs) { const U = DATA.upgrades[u]; if (Math.random() < U.chance * coef * (1 + P.stat('ProcChance'))) P.executeProc(U, 1, O, at, d, 'OnHit'); }
    };
    if (T.flame) {
      const dir = aim.clone().sub(from).normalize();
      for (let k = 0; k < 2; k++) G.fx.add({ pos: from.clone(), vel: dir.clone().multiplyScalar(900 + Math.random() * 300).add(V3((Math.random() - 0.5) * 160, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 160)), drag: 1.2, life: 0.45, size0: 14, size1: 70, c0: [1, 0.65, 0.2, 0.9], c1: [1, 0.25, 0.05, 0], tex: 'FX_Puff', glow: 1 });
      for (const O of G.enemies) { if (O.dead || O.burrowed) continue; const v = O.pos.clone().sub(from), d = v.length(); if (d > S.range) continue; if (v.normalize().dot(dir) < 0.93) continue; hit(O, base, O.pos, dir, 0.15); O.applyBurn(base * 1.5, 3); }
      return;
    }
    if (T.chains) {
      let at = from, cur = E, k = 0; const done = new Set();
      while (cur && k <= S.chains) {
        done.add(cur); G.fx.arc(at, cur.pos.clone().add(V3(0, 60, 0)), col); hit(cur, base * Math.pow(0.7, k), cur.pos, cur.pos.clone().sub(at).normalize(), k ? 0.3 : 0.6); cur.applySlow(0.4, 1.5);
        at = cur.pos.clone().add(V3(0, 60, 0)); let nx = null, nd = 560; for (const O of G.enemies) { if (O.dead || done.has(O) || O.burrowed) continue; const d = O.pos.distanceTo(cur.pos); if (d < nd) { nd = d; nx = O; } } cur = nx; k++;
      }
      G.audio.playAt('S_Zap', from, 0.3, 1.2); return;
    }
    G.fx.flash(from, [1, 0.85, 0.5], 30, 0.05, false);
    const spread = (T.spread || 1) * 0.012;
    for (let k = 0; k < S.pellets; k++) {
      const dir = aim.clone().sub(from).normalize(); dir.x += (Math.random() - 0.5) * spread; dir.y += (Math.random() - 0.5) * spread; dir.z += (Math.random() - 0.5) * spread; dir.normalize();
      let bt = S.range, best = null; const wall = G.phys.raycast(from, dir, bt); if (wall) bt = wall.distance;
      for (const O of G.enemies) { if (O.dead || O.burrowed) continue; const t = G.rayEnemy(from, dir, bt, O, 6); if (t !== null && t < bt) { bt = t; best = O; } }
      const at = from.clone().addScaledVector(dir, bt); G.fx.tracer(from, at, col, 3, 0.05);
      if (best) hit(best, base, at, dir, 0.5 / S.pellets);
    }
  }
  destroy() { this.game.scene.remove(this.group); }
}
