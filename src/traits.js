// What makes one kind of enemy act unlike another that shares its basic behaviour. Each kind has a short entry here:
// how it moves, what its hit does besides hurt, what it can do at range, what it does when shot at, what it leaves
// when it dies. The base behaviours (walker, runner, spitter...) stay as they are; these sit on top.
import * as THREE from 'three';
import { DATA, lin } from './data.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const flatN = (v) => { const d = Math.hypot(v.x, v.z) || 1; return V3(v.x / d, 0, v.z / d); };
export const TRAITS = {
  // ---- walkers
  Shambler: { hit: { slow: 0.7, slowT: 1.2 }, tag: 'grabs' },
  'Pit Hand': { ranged: { type: 'throw', cd: 5, min: 450, max: 1500, speed: 1300, kind: 'Card', color: [0.6, 0.6, 0.65] }, tag: 'throws its pick' },
  Brakeman: { brace: 1 },
  'The Drowned': { hit: { slow: 0.5, slowT: 2 }, death: { type: 'cloud', r: 300, life: 6, color: [0.2, 0.5, 0.8], dps: 0.25 } },
  Roustabout: { hit: { knock: 1100 } },
  Deckhand: { hook: { cd: 7, range: 1000 } },
  Ooze: { trail: { every: 1.6, r: 150, life: 4, color: [0.4, 0.9, 0.2], dps: 0.3 } },
  Scarab: { charge: { cd: 7, speed: 3.2, name: 'ROLLS' } },
  Wraith: { move: 'lurk' },
  // ---- runners
  Sprinter: { move: 'zigzag' },
  'Tallow Runner': { death: { type: 'burst', r: 260, life: 5, color: [1, 0.5, 0.15], dps: 0.5 } },
  Snowblind: { hit: { slow: 0.5, slowT: 2 } },
  Tumbler: { dodge: 1 },
  Rigger: { move: 'flank' },
  Skitterling: { pack: 1 },
  'Cinder Hound': { charge: { cd: 5, speed: 2.8, name: 'POUNCES' } },
  // ---- crawlers
  'Gutter Crawler': { hit: { slow: 0.6, slowT: 1.5 } },
  'Pale Crawler': { move: 'ambush' },
  'Rime Crawler': { death: { type: 'freeze', r: 380 } },
  Gator: { hit: { bleed: 0.5, bleedT: 3 }, charge: { cd: 8, speed: 2.6, name: 'LUNGES' } },
  Contortionist: { dodge: 1 },
  'Wharf Crab': { brace: 1, move: 'strafe' },
  Grub: { hit: { bleed: 0.4, bleedT: 2 } },
  // ---- bloaters (all still burst when killed)
  Gasbag: { death: { type: 'cloud', r: 420, life: 8, color: [0.5, 0.9, 0.2], dps: 0.35 } },
  Scald: { death: { type: 'burst', r: 340, life: 5, color: [1, 0.6, 0.3], dps: 0.6 } },
  'Bog Bloat': { death: { type: 'spawn', n: 3, ai: 'Crawler' } },
  'The Glutton': { ranged: { type: 'lob', cd: 6, min: 400, max: 1300, r: 260, color: [0.6, 0.8, 0.2] }, hit: { drain: 0.08 } },
  'The Cook': { ranged: { type: 'throw', cd: 4, min: 400, max: 1400, speed: 1400, kind: 'Card', color: [0.8, 0.82, 0.86] } },
  Sporecap: { trail: { every: 2.2, r: 190, life: 5, color: [0.7, 1, 0.35], dps: 0.25 } },
  // ---- spitters
  Powderman: { spit: { type: 'lob', r: 300, color: [1, 0.6, 0.2] } },
  Hailer: { spit: { type: 'fan', n: 3, spread: 14, speed: 1200, kind: 'Orb', color: [0.6, 0.85, 1] } },
  Angler: { hook: { cd: 6, range: 1300 } },
  'Knife Thrower': { spit: { type: 'fan', n: 5, spread: 9, speed: 1700, kind: 'Card', color: [0.85, 0.88, 0.92] } },
  Harpooner: { spit: { type: 'snipe', speed: 2600, mult: 1.8, kind: 'Card', color: [0.7, 0.75, 0.8] } },
  Webspinner: { spit: { type: 'web', r: 240 } },
  'Hooded Cobra': { spit: { type: 'spray', n: 3 } },
  // ---- leapers
  'Timber Wolf': { pack: 1 },
  Bullfrog: { hook: { cd: 6, range: 900 } },
  'Mangy Lion': { roar: { cd: 9, r: 750 } },
  'Wharf Rat': { hit: { steal: 150 } },
  Snapvine: { move: 'ambush', hit: { slow: 0.8, slowT: 1.2 } },
  // ---- flyers
  'Gloom Bat': { aura: { type: 'screech', cd: 6, r: 520 } },
  'Whiteout Owl': { hit: { slow: 0.5, slowT: 2 } },
  Skeeter: { hit: { drain: 0.3, bleed: 0.3, bleedT: 3 } },
  'Balloon Clown': { death: { type: 'pop', r: 320 } },
  'Carrion Gull': { bomb: { cd: 4.5, r: 200, life: 4, color: [0.85, 0.85, 0.7], dps: 0.35 } },
  Watcher: { ranged: { type: 'throw', cd: 3.5, min: 300, max: 1600, speed: 1500, kind: 'Orb', color: [1, 0.8, 0.3] } },
  Hornet: { hit: { bleed: 0.5, bleedT: 4 } },
  'Fiend Bat': { pack: 1 },
  'Drift Jelly': { aura: { type: 'shock', cd: 3, r: 330 } },
  // ---- brutes
  'The Mule': { charge: { cd: 7, speed: 3, name: 'CHARGES' } },
  Whitepelt: { ranged: { type: 'throw', cd: 5, min: 500, max: 1500, speed: 1100, kind: 'Orb', color: [0.9, 0.95, 1] }, hit: { slow: 0.4, slowT: 2 } },
  Mossback: { regen: 0.04 },
  Strongman: { ranged: { type: 'lob', cd: 6, min: 500, max: 1500, r: 300, color: [0.7, 0.7, 0.75] } },
  'The Diver': { hook: { cd: 7, range: 1200 } },
  'Stone Golem': { quake: 1 },
  // ---- the rest
  'Shrieking Idol': { ward: 1 },
  Rockworm: { erupt: 1 },
  Jack: { death: { type: 'pop', r: 300 } },
  Scorpion: { hit: { bleed: 0.6, bleedT: 4, slow: 0.3, slowT: 2 } },
  'Nugget Thief': { hit: { steal: 300 } },
};
export const traitOf = (E) => E.tr || (E.tr = (!E.isBoss && TRAITS[E.def.name]) || {});
const say = (E, text, col = [1, 0.85, 0.5]) => E.game.hud.floater(E.pos.clone().add(V3(0, E.half * 0.8, 0)), text, col, 0.8);
const ground = (G, at) => { const h = G.phys.raycastDown(V3(at.x, at.y + 300, at.z), 1500); return h ? h.point : V3(at.x, at.y - 90, at.z); };
const ranks = (G) => [G.player, ...G.net.ghosts.values()].filter((T) => !T.dead);

// ---------------------------------------------------------------- once a frame, before it decides where to go
export function traitTick(E, dt, C) {
  const T = traitOf(E), G = E.game, { P, Pl, dist, los } = C; if (!T || E.emerge > 0) return;
  const X = E.tx || (E.tx = { r: 2 + Math.random() * 3, h: 3 + Math.random() * 3, a: 2 + Math.random() * 2, t: 0, b: 2 + Math.random() * 2, c: 3 + Math.random() * 3, ro: 4 });
  if (E.braceT > 0) E.braceT -= dt;
  if (E.dodgeCd > 0) E.dodgeCd -= dt;
  if (T.regen && E.sinceHit > 3 && E.health < E.maxHealth) E.health = Math.min(E.maxHealth, E.health + E.maxHealth * T.regen * dt);
  if (T.ward) G.hasWard = true;
  if (T.ranged && los && (X.r -= dt) <= 0 && dist > T.ranged.min && dist < T.ranged.max) { X.r = T.ranged.cd * (0.8 + Math.random() * 0.4); shoot(E, T.ranged, Pl); }
  if (T.hook && los && (X.h -= dt) <= 0 && dist > 350 && dist < T.hook.range) {
    X.h = T.hook.cd; X.hookT = 0.55; X.hookAt = P; E.windup = 1; G.fx.arc(E.pos, Pl, [0.8, 0.8, 0.7]); say(E, 'HOOK');
  }
  if (X.hookT > 0) { X.hookT -= dt; E.stop(); if (X.hookT <= 0) { E.windup = 0; const Q = X.hookAt; if (Q && !Q.dead && E.canSee(Q.pos) && Q.pos.distanceTo(E.pos) < T.hook.range + 200) { const d = flatN(E.pos.clone().sub(Q.pos)); G.fx.arc(E.pos, Q.pos, [1, 0.9, 0.7]); Q.applyKnockback(d.multiplyScalar(1250).add(V3(0, 260, 0))); Q.receiveDamage(E.attackDamage * 0.4, E, false); G.audio.playAt('S_Grapple', E.pos, 0.8, 0.8); } } }
  if (T.trail && E.grounded && (X.t += dt) > T.trail.every) { X.t = 0; G.hazards.fire(ground(G, E.pos), E.attackDamage * T.trail.dps, T.trail.r, T.trail.life, T.trail.color); }
  if (T.bomb && (X.b -= dt) <= 0 && Math.hypot(Pl.x - E.pos.x, Pl.z - E.pos.z) < 260) { X.b = T.bomb.cd; const at = ground(G, Pl); G.hazards.marker(at, E.attackDamage * 0.6, T.bomb.r, 0.7, T.bomb.color); G.hazards.fire(at, E.attackDamage * T.bomb.dps, T.bomb.r, T.bomb.life, T.bomb.color); }
  if (T.aura && (X.a -= dt) <= 0 && dist < T.aura.r) {
    X.a = T.aura.cd; const c = T.aura.type === 'shock' ? [0.5, 0.8, 1] : [0.8, 0.6, 1];
    G.fx.ring(E.pos.clone(), T.aura.r, c, 0.35); G.audio.playAt(T.aura.type === 'shock' ? 'S_Chain' : 'S_Screech', E.pos, 0.6, 1.3);
    for (const Q of ranks(G)) if (Q.pos.distanceTo(E.pos) < T.aura.r) Q.receiveDamage(T.aura.type === 'shock' ? E.attackDamage * 0.5 : 1, E, false, T.aura.type === 'shock' ? 0 : 0.45, 2);
  }
  if (T.roar && los && (X.ro -= dt) <= 0 && dist < T.roar.r) {
    X.ro = T.roar.cd; G.fx.ring(E.feet(), T.roar.r, [1, 0.8, 0.4], 0.5); G.audio.playAt('S_BossRoar', E.pos, 0.7, 1.4); say(E, 'ROARS'); G.shakeAt(E.pos, 300);
    for (const Q of ranks(G)) if (Q.pos.distanceTo(E.pos) < T.roar.r) Q.receiveDamage(1, E, false, 0.5, 1.8);
    for (const K of G.enemies) if (!K.dead && K !== E && K.pos.distanceTo(E.pos) < 900) K.hurryT = 4;
  }
  if (T.charge && !E.chT && los && (X.c -= dt) <= 0 && dist > 450 && dist < 1500 && E.grounded) { X.c = T.charge.cd; E.chW = 0.6; E.windup = 1; say(E, T.charge.name); G.audio.playAt('S_Snarl', E.pos, 0.9, 0.8); }
  if (E.pend) { E.pend.t -= dt; if (E.pend.t <= 0) { for (const Q of ranks(G)) if (Math.hypot(Q.pos.x - E.pend.at.x, Q.pos.z - E.pend.at.z) < E.pend.r) Q.receiveDamage(1, E, false, 0.8, 1.6); E.pend = null; } }
  if (E.sprayN > 0 && (E.sprayT -= dt) <= 0) { E.sprayN--; E.sprayT = 0.22; E.fireAt(Pl.clone().add(V3(0, 20, 0)), 1150, 1, E.attackDamage * 0.6, 60, 'Acid', [0.5, 1, 0.3], 1, 3); }
}
function shoot(E, R, Pl) {
  const G = E.game;
  if (R.type === 'lob') { const at = ground(G, Pl); G.hazards.marker(at, E.attackDamage * 1.1, R.r, 1.2, R.color); E.lungeT = 0.25; G.audio.playAt('S_Spit', E.pos, 0.8, 0.7); }
  else { E.fireAt(Pl.clone().add(V3(0, 20, 0)), R.speed, 0, E.attackDamage * 0.8, 0, R.kind, R.color, 1, 0); E.lungeT = 0.25; }
}
// a spitter's own way of spitting. Returns true if it has been dealt with here.
export function traitSpit(E, aim) {
  const T = traitOf(E), S = T && T.spit, G = E.game; if (!S) return false;
  switch (S.type) {
    case 'fan': E.fireAt(aim, S.speed, 0, E.attackDamage * 0.6, 0, S.kind, S.color, S.n, S.spread); return true;
    case 'lob': G.hazards.marker(ground(G, aim), E.attackDamage * 1.3, S.r, 1.3, S.color); G.audio.playAt('S_Spit', E.pos, 0.8, 0.6); return true;
    case 'snipe': G.fx.arc(E.pos, aim, [1, 0.3, 0.2]); E.fireAt(aim, S.speed, 0, E.attackDamage * S.mult, 0, S.kind, S.color, 1, 0); return true;
    case 'web': { const at = ground(G, aim); G.hazards.marker(at, E.attackDamage * 0.5, S.r, 1.0, [0.9, 0.9, 0.85]); E.pend = { at, r: S.r, t: 1.0 }; return true; }
    case 'spray': E.sprayN = S.n; E.sprayT = 0; return true;
    default: return false;
  }
}
// ---------------------------------------------------------------- where it goes and how fast
export function traitMove(E, dt, C, desired, speedScale) {
  const T = traitOf(E), { P, To, dist, los } = C; if (!T) return [desired, speedScale];
  if (E.chW > 0) { E.chW -= dt; if (E.chW <= 0) { E.windup = 0; E.chT = 1.3; E.chDir = flatN(To); E.chHit = false; } return [V3(0, 0, 0), 0]; }
  if (E.chT > 0) {
    E.chT -= dt;
    if (!E.chHit && dist < 150 + E.radius) { E.chHit = true; P.receiveDamage(E.attackDamage * 1.2, E, true); P.applyKnockback(E.chDir.clone().multiplyScalar(900).add(V3(0, 320, 0))); E.chT = 0; }
    if (E.chT <= 0) { E.staggerT = 0.8; E.attackCd = Math.max(E.attackCd, 1); }
    return [E.chDir.clone(), T.charge.speed];
  }
  if (T.pack) { let n = 0; for (const K of E.game.enemies) if (K !== E && !K.dead && K.def === E.def && K.pos.distanceTo(E.pos) < 520) n++; if (n >= 2) speedScale *= 1.3; }
  if (E.hurryT > 0) { E.hurryT -= dt; speedScale *= 1.3; }
  const side = () => V3().crossVectors(flatN(To), V3(0, 1, 0));
  switch (T.move) {
    case 'zigzag': if (los && dist < 1400 && dist > 250) desired = desired.clone().addScaledVector(side(), Math.sin(E.life * 4 + (E.seed || (E.seed = Math.random() * 9))) * 1.1).normalize(); break;
    case 'flank': if (los && dist < 1300 && dist > 420) { if (!E.fs) E.fs = Math.random() < 0.5 ? 1 : -1; desired = desired.clone().multiplyScalar(0.45).addScaledVector(side(), E.fs).normalize(); speedScale *= 1.15; } break;
    case 'strafe': if (los && dist < 900 && dist > 260) { desired = desired.clone().multiplyScalar(0.6).addScaledVector(side(), Math.sin(E.life * 1.6) > 0 ? 1 : -1).normalize(); } break;
    case 'hop': E.hopT = (E.hopT || 0) - dt; if (E.grounded && E.hopT <= 0 && desired.lengthSq() > 0.01) { E.hopT = 0.75; E.vel.y = 520; E.vel.x = desired.x * E.baseSpeed * 1.9; E.vel.z = desired.z * E.baseSpeed * 1.9; E.grounded = false; } if (!E.grounded) return [desired, 1.7]; return [V3(0, 0, 0), 0];
    case 'lurk': { const f = V3(-Math.sin(P.yaw || 0), 0, -Math.cos(P.yaw || 0)), seen = los && f.dot(flatN(To).negate()) > 0.82; speedScale *= seen ? 0.12 : 1.7; break; }
    case 'ambush': if (!E.woke) { if (dist < 520 || E.sinceHit < 1) { E.woke = true; E.hurryT = 3; say(E, '!'); } else return [V3(0, 0, 0), 0]; } break;
    default: break;
  }
  return [desired, speedScale];
}
// ---------------------------------------------------------------- its blow has landed
export function traitHit(E, P) {
  const T = traitOf(E), H = T && T.hit, G = E.game;
  if (T && T.quake) G.hazards.ring(E.feet(), E.attackDamage * 0.5, 900, 1500, lin(0.6, 0.55, 0.5));
  if (!H) return;
  if (H.slow) P.receiveDamage(1, E, false, H.slow, H.slowT);
  if (H.knock) P.applyKnockback(flatN(P.pos.clone().sub(E.pos)).multiplyScalar(H.knock).add(V3(0, 380, 0)));
  if (H.bleed) { P.tBleed = { t: H.bleedT, dps: E.attackDamage * H.bleed / H.bleedT, src: E }; if (P === G.player) G.hud.toast('Bleeding', '#ff6a6a'); }
  if (H.drain) E.health = Math.min(E.maxHealth, E.health + E.maxHealth * H.drain);
  if (H.steal && P === G.player && P.money > 0) { const m = Math.min(P.money, H.steal); P.money -= m; E.money = (E.money || 0) + m * 2; say(E, `-$${Math.round(m / 10)}`, [1, 0.85, 0.3]); G.audio.playAt('S_Coin', E.pos, 0.8, 0.7); }
}
// ---------------------------------------------------------------- it is being shot. Returns the damage it takes.
export function traitDamage(E, amount) {
  const T = traitOf(E), G = E.game;
  if (G.hasWard && !(T && T.ward)) for (const K of G.enemies) if (!K.dead && K !== E && K.tr && K.tr.ward && K.pos.distanceTo(E.pos) < 750) { amount *= 0.6; if (!(E.wSay > G.time)) { E.wSay = G.time + 1.5; G.fx.arc(K.pos, E.pos, [1, 0.4, 1]); } break; }
  if (!T || amount > 1e8) return amount;
  if (T.brace) { if (E.braceT > 0) return amount * 0.3; if (!(E.braceCd > G.time)) { E.braceCd = G.time + 6; E.braceT = 1.6; say(E, 'BRACED', [0.7, 0.8, 0.9]); return amount * 0.3; } }
  if (T.dodge && !(E.dodgeCd > 0) && E.grounded && Math.random() < 0.4) { E.dodgeCd = 2.5; const P = G.net.targetOf(E), s = V3().crossVectors(flatN(P.pos.clone().sub(E.pos)), V3(0, 1, 0)).multiplyScalar(Math.random() < 0.5 ? 1 : -1); E.launch(V3(s.x * 800, 200, s.z * 800)); say(E, 'DODGE', [0.8, 0.9, 1]); return amount * 0.25; }
  return amount;
}
// ---------------------------------------------------------------- it has died
export function traitDeath(E) {
  const T = traitOf(E), D = T && T.death, G = E.game; if (!T) return;
  if (T.erupt || !D) { if (T.erupt && E.life < 4) G.hazards.ring(E.feet(), E.attackDamage * 0.4, 800, 1300, lin(0.6, 0.45, 0.3)); if (!D) return; }
  const at = ground(G, E.pos);
  switch (D.type) {
    case 'burst': case 'cloud': G.hazards.fire(at, E.attackDamage * D.dps, D.r, D.life, D.color); break;
    case 'freeze': G.fx.ring(at, D.r, [0.6, 0.85, 1], 0.4); for (const Q of ranks(G)) if (Q.pos.distanceTo(E.pos) < D.r) Q.receiveDamage(1, E, false, 0.6, 2.5); for (const K of G.enemies) if (!K.dead && K !== E && K.pos.distanceTo(E.pos) < D.r) K.applySlow(0.4, 2); break;
    case 'pop': G.fx.ring(at, D.r, [1, 0.5, 0.7], 0.35); G.fx.flash(E.pos, [1, 0.8, 0.5], D.r * 0.6, 0.2, true); G.audio.playAt('S_Explosion', E.pos, 0.6, 1.6); for (const Q of ranks(G)) if (Q.pos.distanceTo(E.pos) < D.r) { Q.receiveDamage(E.attackDamage * 0.8, E, false); Q.applyKnockback(flatN(Q.pos.clone().sub(E.pos)).multiplyScalar(700).add(V3(0, 300, 0))); } break;
    case 'spawn': { const d = G.enemyOfAI ? G.enemyOfAI(D.ai) : -1; if (d >= 0 && !E.splitChild) for (let i = 0; i < D.n; i++) { const f = G.findFreeLocationNear(E.pos, 60, 320); if (f) { const K = G.spawnEnemy(d, f.add(V3(0, 80, 0)), false, -1, 0.8, 0.5, 0, false); if (K) { K.splitChild = true; K.noLoot = true; K.emerge = 0.4; } } } break; }
    default: break;
  }
}
// bleeding and the like on the players themselves (host's own player; guests take theirs through the hit)
export function traitsPlayerTick(G, dt) {
  const P = G.player, B = P.tBleed; if (!B || P.dead) return;
  B.t -= dt; B.k = (B.k || 0) + dt; if (B.k >= 0.5) { B.k = 0; P.receiveDamage(B.dps * 0.5, null, false, 0, 0, true); }
  if (B.t <= 0) P.tBleed = null;
}
