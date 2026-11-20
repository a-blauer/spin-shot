// Projectiles (player rockets/grenades/saws/cards/plasma + hostile acid/orbs), ground hazards (boss shock
// rings, telegraphed blast markers, fire patches) and pickups (clovers, money bags, power-ups).
import * as THREE from 'three';
import { toonMaterial, sprite, Cam } from './render.js';
import { PRIM } from './world.js';
import { textMesh } from './text.js';
import { DATA, PICKUP_NAMES, lin, RARITY_HEX } from './data.js';

const matCache = new Map();
function mat(rgb, glow) {
  const key = rgb.join(',') + '|' + glow;
  if (!matCache.has(key)) { const m = toonMaterial({ glow }); m.uniforms.uColor.value.setRGB(rgb[0], rgb[1], rgb[2]); matCache.set(key, m); }
  return matCache.get(key);
}
function part(group, meshId, pos, size, rgb, glow = 0) {
  const m = new THREE.Mesh(PRIM.GEOS[meshId], mat(rgb, glow));
  m.position.copy(pos);
  m.scale.copy(size);
  group.add(m);
  return m;
}
const UP = new THREE.Vector3(0, 1, 0);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const RING_GEO = new THREE.CylinderGeometry(1, 1, 1, 48, 1, true);
function disposeOwned(group) {
  group.traverse((o) => {
    if (o.userData.ownGeo && o.geometry) o.geometry.dispose();
    if (o.userData.ownMat && o.material) o.material.dispose();
  });
}

// ================================================================== projectiles
export class Projectiles {
  constructor(game, scene) { this.game = game; this.scene = scene; this.list = []; }
  spawn(o) {
    const P = Object.assign({ hostile: false, gravity: 0, damage: 10, splash: 0, life: 5, slow: 0, burn: 0, chains: 0, moneyPerHit: 0, critBonus: 0, procCoef: 1,
      fromProc: false, pierce: 0, bounces: 0, bounceDamp: 0.5, fuse: 0, homing: 0, target: null, kind: 'Orb', color: [1, 1, 1], radius: 14, age: 0, hit: new Set(), trail: 0 }, o);
    const g = new THREE.Group();
    const D = P.radius * 2;
    switch (P.kind) {
      case 'Rocket': case 'Missile':
        P.body = part(g, 1, V3(0, 0, 0), V3(D * 0.7, D * 2.6, D * 0.7), [0.36, 0.36, 0.4]);
        P.body.rotation.x = Math.PI / 2;
        part(g, 2, V3(0, 0, D * 1.4), V3(D * 0.9, D * 0.9, D * 0.9), P.color, 1.3);
        break;
      case 'Grenade':
        P.body = part(g, 1, V3(0, 0, 0), V3(D * 0.8, D * 1.8, D * 0.8), [0.9, 0.2, 0.15]);
        part(g, 0, V3(0, D, 0), V3(4, D * 0.6, 4), [1, 0.93, 0.66], 1.3);
        break;
      case 'Saw':
        P.body = part(g, 1, V3(0, 0, 0), V3(D * 2.2, 5, D * 2.2), P.color, 0.3);
        break;
      case 'Card':
        P.body = part(g, 0, V3(0, 0, 0), V3(D * 1.6, 3, D * 1.1), [0.98, 0.97, 0.95], 0.4);
        part(g, 0, V3(0, 2, 0), V3(D * 0.5, 2, D * 0.5), [0.93, 0.25, 0.33], 0.6).rotation.y = Math.PI / 4;
        break;
      default:
        P.body = part(g, 2, V3(0, 0, 0), V3(D, D, D), P.color, 1.3);
        break;
    }
    g.position.copy(P.pos);
    this.scene.add(g);
    P.group = g;
    P.glowSize = Math.max(60, P.radius * 9);
    this.list.push(P);
    if (P.hostile) this.game.net.sentProjectile(P);
    return P;
  }
  detonate(P, at) {
    if (P.done) return;
    P.done = true;
    const G = this.game;
    if (P.splash > 0) {
      if (P.hostile) {
        G.fx.explosion(at, P.splash, P.color);
        G.audio.playAt('S_Splat', at, 0.8);
        if (G.player.pos.distanceTo(at) < P.splash + 40) G.player.receiveDamage(P.damage, P, false, P.slow, P.slow > 0 ? 2 : 0);
      } else G.player.explodeAt(at, P.splash, P.damage, P.procCoef, P.fromProc, true, P.color, P.hit);   // whoever the round hit directly already took its damage: the blast is for everyone else
    } else G.fx.flash(at, P.color, Math.max(20, P.radius * 2.5), 0.15, false);
    this.scene.remove(P.group);
  }
  update(dt) {
    const G = this.game, player = G.player;
    for (const P of this.list) {
      if (P.done) continue;
      P.age += dt;
      if (P.age >= P.life || (P.fuse > 0 && P.age >= P.fuse)) { this.detonate(P, P.pos); continue; }
      if (P.homing > 0) {
        if ((!P.target || P.target.dead) && !P.hostile) P.target = player.findNearestEnemy(P.pos, 2500, null);
        if (P.target && !P.target.dead) {
          const sp = P.vel.length();
          const want = P.target.pos.clone().sub(P.pos).normalize().multiplyScalar(sp);
          P.vel.lerp(want, Math.min(1, dt * P.homing)).setLength(sp);
        }
      }
      P.vel.y -= 980 * P.gravity * dt;
      const start = P.pos.clone(), end = start.clone().addScaledVector(P.vel, dt);
      let moved = false;
      if (P.hostile) {
        if (!player.dead && segCapsule(start, end, player.pos, 45 + P.radius, 95 + P.radius)) {
          player.receiveDamage(P.damage, P, false, P.slow, P.slow > 0 ? 2 : 0);
          this.detonate(P, player.pos.clone());
          continue;
        }
      } else {
        // enemies first (closest along the segment)
        const seg = end.clone().sub(start), len = seg.length();
        const dir = len > 0 ? seg.clone().divideScalar(len) : V3(0, 0, 1);
        let best = null, bestT = len;
        for (const E of G.enemies) {
          if (E.dead || P.hit.has(E) || E.burrowed) continue;
          const t = G.rayEnemy(start, dir, len, E, P.radius);
          if (t !== null && t < bestT) { bestT = t; best = E; }
        }
        const wall = len > 0 ? G.phys.raycast(start, dir, len + P.radius) : null;
        if (best && (!wall || bestT <= wall.distance)) {
          const at = start.clone().addScaledVector(dir, bestT);
          player.handleProjectileHit(P, best, at);
          P.hit.add(best);
          if (P.kind === 'Grenade' && P.fuse > 0) { this.detonate(P, at); continue; }
          if (P.pierce > 0) { P.pierce--; P.pos.copy(end); moved = true; } else { this.detonate(P, at); continue; }
        }
      }
      if (!moved) {
        const seg = end.clone().sub(start), len = seg.length();
        const wall = len > 0 ? G.phys.raycast(start, seg.clone().divideScalar(len), len + P.radius * 0.5) : null;
        if (wall) {
          if (P.bounces > 0) {
            P.bounces--;
            const n = wall.normal;
            P.vel.addScaledVector(n, -2 * P.vel.dot(n)).multiplyScalar(P.bounceDamp);
            P.pos.copy(wall.point).addScaledVector(n, P.radius + 2);
            if (P.kind === 'Saw') { G.fx.sparks(wall.point, n, [1, 0.9, 0.66], 5); P.hit.clear(); G.audio.playAt('S_Ricochet', wall.point, 0.6); }
            else G.audio.playAt('S_HitWall', wall.point, 0.4, 1.4);
          } else { this.detonate(P, wall.point.clone().addScaledVector(wall.normal, 5)); continue; }
        } else P.pos.copy(end);
      }
      P.group.position.copy(P.pos);
      if (P.vel.lengthSq() > 1) {
        if (P.kind === 'Saw') P.body.rotation.y += 25 * dt;
        else if (P.kind === 'Card') P.group.rotation.y += 15.7 * dt;
        else if (P.kind === 'Grenade') P.group.rotation.x += 12 * dt;
        else P.group.quaternion.setFromUnitVectors(V3(0, 0, -1), P.vel.clone().normalize());
      }
      P.trail -= dt;
      if (P.trail <= 0 && (P.kind === 'Rocket' || P.kind === 'Missile')) {
        P.trail = 0.035;
        G.fx.puff(P.pos.clone().addScaledVector(P.vel.clone().normalize(), -30), [0.85, 0.84, 0.82], 40, 0.6);
      }
      if (P.kind === 'Acid' && Math.random() < dt * 20) G.fx.puff(P.pos, P.color, 18, 0.3);
    }
    this.list = this.list.filter((P) => !P.done);
  }
  draw(add) {
    const glow = sprite('FX_Glow');
    for (const P of this.list) add.pushBasis(glow, P.pos, Cam.right, Cam.up, P.glowSize, P.glowSize, P.color[0], P.color[1], P.color[2], 0.9, 0, 0, P.hostile ? 1.6 : 2.2);
  }
  clear() { for (const P of this.list) this.scene.remove(P.group); this.list = []; }
}

// segment vs vertical capsule (center c, radius r, half height h)
function segCapsule(a, b, c, r, h) {
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t, z = a.z + (b.z - a.z) * t;
    if (Math.hypot(x - c.x, z - c.z) < r && Math.abs(y - c.y) < h) return true;
  }
  return false;
}

// ================================================================== hazards
export class Hazards {
  constructor(game, scene) { this.game = game; this.scene = scene; this.list = []; }
  _add(H) { H.age = 0; H.group = new THREE.Group(); H.group.position.copy(H.pos); this.scene.add(H.group); this.list.push(H); return H; }
  ring(ground, damage, speed, maxRadius, color) {
    const H = this._add({ kind: 'Ring', pos: ground.clone(), damage, speed, maxRadius, color, radius: 60, life: maxRadius / Math.max(1, speed), hitPlayer: false });
    // thin glowing wall: open cylinder
    H.wall = new THREE.Mesh(RING_GEO, new THREE.MeshBasicMaterial({ color: new THREE.Color(color[0], color[1], color[2]), transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    H.wall.position.y = 20;
    H.wall.userData.ownMat = true;
    H.group.add(H.wall);
    this.game.net.sentHazard('ring', ground, [damage, speed, maxRadius], color);
    return H;
  }
  marker(ground, damage, radius, delay, color) {
    const H = this._add({ kind: 'Marker', pos: ground.clone(), damage, radius, delay, life: delay, color });
    H.disc = part(H.group, 1, V3(0, 2, 0), V3(radius * 2, 3, radius * 2), color.map((c) => c * 0.45), 0.6);
    H.inner = part(H.group, 1, V3(0, 4, 0), V3(10, 4, 10), color, 1.3);
    H.rim = new THREE.Mesh(new THREE.RingGeometry(radius * 0.96, radius, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(...color), side: THREE.DoubleSide }));
    H.rim.rotation.x = -Math.PI / 2; H.rim.position.y = 5;
    H.rim.userData.ownGeo = H.rim.userData.ownMat = true;
    H.group.add(H.rim);
    this.game.net.sentHazard('marker', ground, [damage, radius, delay], color);
    return H;
  }
  fire(ground, dps, radius, life) {
    const H = this._add({ kind: 'Fire', pos: ground.clone(), damage: dps, radius, life, color: lin(1, 0.35, 0.05), puff: 0 });
    H.disc = part(H.group, 1, V3(0, 2, 0), V3(radius * 2, 4, radius * 2), lin(1, 0.35, 0.05), 1.2);
    this.game.net.sentHazard('fire', ground, [dps, radius, life]);
    return H;
  }
  update(dt) {
    const G = this.game, P = G.player;
    for (const H of this.list) {
      H.age += dt;
      if (H.kind === 'Ring') {
        H.radius = 60 + H.speed * H.age;
        H.wall.scale.set(H.radius, 60 * (1 - 0.5 * H.age / H.life), H.radius);
        H.wall.material.opacity = 0.85 * (1 - 0.6 * H.age / H.life);
        if (!H.hitPlayer && !P.dead) {
          const d = Math.hypot(P.pos.x - H.pos.x, P.pos.z - H.pos.z);
          const feetY = P.pos.y - 90;
          if (Math.abs(d - H.radius) < 70 && feetY < H.pos.y + 70 && feetY > H.pos.y - 120) {
            H.hitPlayer = true;
            P.receiveDamage(H.damage, H, false);
            P.applyKnockback(V3(P.pos.x - H.pos.x, 0, P.pos.z - H.pos.z).normalize().multiplyScalar(900).add(V3(0, 450, 0)));
          }
        }
      } else if (H.kind === 'Marker') {
        const t = Math.min(1, H.age / H.delay);
        H.inner.scale.set(H.radius * 2 * t, 4, H.radius * 2 * t);
        if (H.age >= H.delay) {
          G.fx.explosion(H.pos.clone().add(V3(0, 40, 0)), H.radius, H.color);
          G.audio.playAt('S_Explosion', H.pos, 0.8, 1.1, 0.1);
          G.shakeAt(H.pos, H.radius);
          if (Math.hypot(P.pos.x - H.pos.x, P.pos.z - H.pos.z) < H.radius + 30 && P.pos.y < H.pos.y + 400) P.receiveDamage(H.damage, H, false);
          H.age = H.life + 1;
        }
      } else {
        const fl = 1 + 0.08 * Math.sin(H.age * 25);
        H.disc.scale.set(H.radius * 2 * fl, 4, H.radius * 2 * fl);
        H.puff -= dt;
        if (H.puff <= 0) {
          H.puff = 0.12;
          const a = Math.random() * Math.PI * 2, r = Math.random() * H.radius * 0.8;
          G.fx.add({ pos: H.pos.clone().add(V3(Math.cos(a) * r, 10, Math.sin(a) * r)), vel: V3(0, 120, 0), life: 0.5, size0: 40, size1: 10, c0: [1, 0.85, 0.4, 1], c1: [1, 0.3, 0.05, 1], fadeOut: 0.3, tex: 'FX_Flame', glow: 1 });
        }
        if (Math.hypot(P.pos.x - H.pos.x, P.pos.z - H.pos.z) < H.radius && Math.abs(P.pos.y - 90 - H.pos.y) < 60) P.receiveDamage(H.damage * dt, H, false, 0, 0, true);
      }
      if (H.age >= H.life) { this.scene.remove(H.group); disposeOwned(H.group); H.done = true; }
    }
    this.list = this.list.filter((H) => !H.done);
  }
  clear() { for (const H of this.list) this.scene.remove(H.group); this.list = []; }
}

// ================================================================== pickups
const PICKUP_COLOR = { Buff: lin(1, 1, 1), Ammo: lin(0.5, 0.7, 1), Clover: lin(0.3, 1, 0.35), MoneyBag: lin(1, 0.8, 0.2), MaxAmmo: lin(0.4, 0.75, 1), InstaKill: lin(1, 0.2, 0.18), DoublePoints: lin(1, 0.85, 0.2), Nuke: lin(1, 0.5, 0.1), FireSale: lin(0.95, 0.35, 1) };
const PICKUP_ICON = { Buff: 'I_Card', Ammo: 'I_MaxAmmo', Clover: 'I_Clover', MoneyBag: 'I_MoneyBag', MaxAmmo: 'I_MaxAmmo', InstaKill: 'I_InstaKill', DoublePoints: 'I_DoublePoints', Nuke: 'I_Nuke', FireSale: 'I_FireSale' };

export class Pickups {
  constructor(game, scene) { this.game = game; this.scene = scene; this.list = []; }
  spawn(type, at, amount = 0) {
    const G = this.game;
    const L = at.clone();
    const h = G.phys.raycastDown(L.clone().add(V3(0, 100, 0)), 1600);
    if (h) L.copy(h.point).add(V3(0, 70, 0));
    const buff = type === 'Buff' ? DATA.upgrades[amount] : null;
    const power = type !== 'Clover' && type !== 'MoneyBag' && type !== 'Ammo' && !buff;
    const K = { type, amount, base: L, pos: L.clone(), age: 0, life: power ? 25 : 30, power, size: power ? 90 : 64, color: PICKUP_COLOR[type], spr: sprite(PICKUP_ICON[type]) };
    if (buff) {   // an upgrade lying on the ground: its own icon, tinted and labelled by rarity
      const h = RARITY_HEX[buff.rarity];
      K.spr = sprite('U_' + amount) || K.spr; K.size = 84; K.life = 40; K.white = true;
      K.label = textMesh(buff.name, 24, h, 0.8); this.scene.add(K.label);
    }
    if (power) {
      const c = K.color;
      K.label = textMesh(PICKUP_NAMES[type], 26, `rgb(${c.map((x) => Math.round(x * 255)).join(',')})`, 0.8);
      this.scene.add(K.label);
    }
    if (power) G.audio.playAt('S_PowerUp', L, 0.6);   // ordinary drops are silent: a chime per drop was constant in a horde
    this.list.push(K);
  }
  update(dt) {
    const G = this.game, P = G.player;
    for (const K of this.list) {
      K.age += dt;
      K.pos.copy(K.base).add(V3(0, 20 * Math.sin(K.age * 3), 0));
      K.hidden = K.life - K.age < 5 && (K.age % 0.3) < 0.12;
      if (K.label) {
        K.label.position.copy(K.pos).add(V3(0, 70, 0));
        K.label.rotation.y = Math.atan2(P.pos.x - K.pos.x, P.pos.z - K.pos.z);
        K.label.visible = !K.hidden;
      }
      if (!P.dead && P.pos.distanceTo(K.pos) < P.pickupRadius()) { P.collectPickup(K.type, K.amount); K.done = true; }
      if (K.age >= K.life) K.done = true;
      if (K.done && K.label) this.scene.remove(K.label);
    }
    this.list = this.list.filter((K) => !K.done);
  }
  draw(sprB, addB) {
    const glow = sprite('FX_Glow');
    const r = new THREE.Vector3();
    for (const K of this.list) {
      if (K.hidden) continue;
      const a = K.age * 150 * Math.PI / 180;
      r.set(Math.cos(a), 0, -Math.sin(a));
      sprB.pushBasis(K.spr, K.pos, r, UP, K.size, K.size, 1, 1, 1, 1, 0, 0, 0.35);
      addB.pushBasis(glow, K.pos, Cam.right, Cam.up, K.size * 3, K.size * 3, K.color[0], K.color[1], K.color[2], 0.8, 0, 0, 1.8);
    }
  }
  clear() { for (const K of this.list) if (K.label) this.scene.remove(K.label); this.list = []; }
}
