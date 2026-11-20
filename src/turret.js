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
      try { const g = ViewModel.displayModel(this.game, b.def, Math.min(3, b.tier || 0)); const bb = new THREE.Box3().setFromObject(g), c = bb.getCenter(new THREE.Vector3()); g.position.sub(c); const s = 1.5; const h = new THREE.Group(); h.add(g); h.scale.setScalar(s); h.rotation.y = Math.PI; this.gunG.add(h); this.len = (bb.max.z - bb.min.z) * s * 0.5; }
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
    const eye = new THREE.Vector3(this.pos.x, this.pos.y + 108, this.pos.z), range = Math.min(W.range || 2200, 2600);
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
        let hit = null, bt = W.range || 2200; const wall = G.phys.raycast(from, dir, bt); if (wall) bt = wall.distance;
        for (const E of G.enemies) { if (E.dead || E.burrowed) continue; const t = G.rayEnemy(from, dir, bt, E, 6); if (t !== null && t < bt) { bt = t; hit = E; } }
        const at = from.clone().addScaledVector(dir, bt);
        G.fx.tracer(from, at, col, cont ? 8 : 3, 0.06);
        if (hit) { P.dealDamage(hit, dmg, at, dir, at.y > hit.headY(), 0.25 / pellets, false, W.critBonus || 0, W.burn || 0, W.slow || 0, 0); if (W.splash > 0) P.explodeAt(at, W.splash, dmg * 0.6, 0.1, true, false, col, hit); }
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
    else { S.def = -1; S.tier = 0; S.mods = []; S.ammo = 0; S.reserve = 0; P.cycleWeapon(1); }
    P.toast(`${W.name} is bound to the turret`, RARITY_HEX[W.rarity]); P.play('S_MagIn', 0.9, 0.8);
  }
  destroy() { this.game.scene.remove(this.group); const i = this.game.interactables.indexOf(this); if (i >= 0) this.game.interactables.splice(i, 1); }
}
function G_vm(P, S) { P.reloading = false; P.fireCd = 0.4; P.game.vm.setWeapon(S.def, Math.min(3, S.tier), true); }
