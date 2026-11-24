// Builds. Every buff belongs to a family (fire, frost, storm, blood, powder, deadeye, bulwark, rush, fortune, blade).
// Holding two buffs of one family wakes its first power; holding five wakes the second. The powers are things that
// happen in the world - bursts, strikes, blades, coins - so a run is about feeding one or two families, not adding
// percentages. Chests lean toward families you have already started.
import * as THREE from 'three';
import { DATA, lin } from './data.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const TIERS = [2, 5];
export const BUILDS = {
  Ember: { hex: '#ff8a3a', col: [1, 0.5, 0.15], p: ['Burning enemies burst into flame when they die and set light to whatever is near.', 'Every burst heals you, and a ring of fire rolls out from you every 7 seconds.'] },
  Frost: { hex: '#8ad8ff', col: [0.5, 0.85, 1], p: ['Chilled enemies shatter when they die: the shards cut and chill everything near.', 'Shatters freeze what they hit solid for a moment and give you overshield.'] },
  Storm: { hex: '#b8a8ff', col: [0.7, 0.65, 1], p: ['Every sixth hit calls lightning down on the target.', 'Every fourth hit, and the bolt forks to two more and leaves them dazed.'] },
  Blood: { hex: '#ff4a5a', col: [1, 0.2, 0.25], p: ['Bleeding enemies burst when they die, wounding everything near and making it bleed.', 'Every burst heals you, and three kills in quick succession send you into a blood rage.'] },
  Powder: { hex: '#ffcf5a', col: [1, 0.8, 0.3], p: ['Every eighth hit fires a seeking rocket.', 'Every fifth hit, and enemies killed by a blast drop a live bomb.'] },
  Deadeye: { hex: '#ffe9a0', col: [1, 0.9, 0.6], p: ['Crits throw a tracer on to the nearest other enemy.', 'The tracer hits three, and a kill with a crit gives you overshield.'] },
  Bulwark: { hex: '#9ab8d8', col: [0.6, 0.72, 0.85], p: ['Anything that hits you is shocked and thrown back; kills top up your overshield.', 'While you hold overshield it pulses every 6 seconds, hurting everything near for twice what you hold.'] },
  Rush: { hex: '#7affc0', col: [0.45, 1, 0.75], p: ['Your dash leaves a live wire: everything you pass through is struck.', 'Kills give dash charge back, and the dash ends in a blast.'] },
  Fortune: { hex: '#ffd24d', col: [1, 0.82, 0.3], p: ['The dead throw two coins that seek out the living.', 'Four coins, and each one that lands pays you.'] },
  Blade: { hex: '#e0e6f0', col: [0.88, 0.9, 0.95], p: ['A kill with a blade throws a spinning saw down the line.', 'Blade hits heal you, and two saws fly.'] },
};
const RULES = [
  ['Ember', ['Ignite'], ['LowBurn', 'HotBarrel', 'BlastBurn', 'TurretBurn', 'MeleeBurn'], /ignit|burn|alight|on fire|flame/i],
  ['Frost', ['Freeze'], ['PierceSlow'], /chill|slow|freez/i],
  ['Storm', ['Chain'], ['LightBolt', 'MeleeShock', 'TurretShock'], /lightning|\barc\b|bolt of light/i],
  ['Blood', ['Bleed', 'Execute', 'Heal'], ['Lifesteal', 'KillHealth', 'MeleeBleed', 'MeleeLifesteal', 'CritHeal', 'EliteExecute', 'HeadExecute', 'MeleeExecute', 'HealBoost', 'HealthRegen'], /bleed|heals?\b|healing/i],
  ['Powder', ['Explode', 'Nova', 'Shockwave', 'Missile'], ['ExplosionRadius', 'GrenadeCap', 'GrenadeDamage', 'GrenadeSave', 'BlastChain', 'ClusterAll', 'FinalRound', 'HeadPop', 'EliteBlast', 'Shrapnel'], /explod|blast|rocket|grenade|bomb/i],
  ['Blade', [], [], /melee|heavy blow|swing/i],
  ['Deadeye', ['Skip'], ['CritChance', 'CritDamage', 'HeadshotDamage', 'HeadStreak', 'CritFlash', 'FarDamage', 'Spread', 'AdsCrit', 'WeakPoint', 'HeadMark', 'HeadCrit', 'SteadyAim', 'WallCrit'], /crit|headshot/i],
  ['Bulwark', ['Shield', 'Invuln'], ['Armor', 'PlateArmor', 'BlockChance', 'ShieldRegen', 'MaxHealth', 'Thorns', 'Overheal', 'HitCap', 'Bulwark', 'Revives', 'SecondWind', 'DashGuard', 'AirGuard'], /overshield|armor|shrug/i],
  ['Rush', ['Haste', 'ResetDash'], ['MoveSpeed', 'DashCharges', 'DashCooldown', 'DashDamage', 'SlideSpeed', 'SlideDamage', 'SlideBoost', 'SlideLaunch', 'Trample', 'KillRush', 'SpeedDamage', 'ExtraJumps', 'DashReload'], /dash|slid|speed/i],
  ['Fortune', ['Money'], ['MoneyGain', 'Interest', 'CasinoDiscount', 'MoneyDamage', 'RoundMoney', 'GoldKill', 'SpendNova', 'ChestLuck', 'ChestRefund', 'PickupRange'], /money|\$|cost/i],
];
export function buildOf(u) {
  if (u.build !== undefined) return u.build;
  let b = null; const names = (u.mods || []).map((m) => m[0]);
  for (const [name, fx, stats] of RULES) if ((u.fx && fx.includes(u.fx)) || names.some((n) => stats.includes(n)) || (name === 'Blade' && names.some((n) => n.startsWith('Melee')))) { b = name; break; }
  if (!b) for (const [name, , , re] of RULES) if (re.test(u.desc || '')) { b = name; break; }
  u.build = b; return b;
}
export function countBuilds(stacks) { const c = {}; stacks.forEach((n, i) => { if (n > 0) { const b = buildOf(DATA.upgrades[i]); if (b) c[b] = (c[b] || 0) + n; } }); return c; }
export const rank = (P, b) => { const n = (P.build && P.build[b]) || 0; return n >= TIERS[1] ? 2 : n >= TIERS[0] ? 1 : 0; };
// what a chest card says about the family a buff feeds
export function buildNote(P, u) {
  const b = buildOf(u); if (!b) return null; const n = (P.build && P.build[b]) || 0, next = n < TIERS[0] ? 0 : n < TIERS[1] ? 1 : -1;
  return { name: b.toUpperCase(), hex: BUILDS[b].hex, text: next < 0 ? `${b} is fully awake` : `${b} ${n}/${TIERS[next]}  -  at ${TIERS[next]}: ${BUILDS[b].p[next]}` };
}
// called when the set of buffs changes: announce any power that has just woken
export function buildChanged(P) {
  const old = P.buildRank || {}, now = {}; P.build = countBuilds(P.upgradeStacks);
  for (const b in BUILDS) { now[b] = rank(P, b); if (now[b] > (old[b] || 0) && P.game && P.game.hud && P.buildRank) { P.game.banner(`${b.toUpperCase()} ${now[b] === 2 ? 'II' : 'I'}`, BUILDS[b].col, 3.5); P.toast(BUILDS[b].p[now[b] - 1], BUILDS[b].hex); P.play('S_LevelUp', 0.7, now[b] === 2 ? 0.8 : 1.1); const f = V3(P.pos.x, P.pos.y - 85, P.pos.z); P.game.fx.ring(f, 420, BUILDS[b].col, 0.6); P.game.fx.ring(f, 240, [1, 1, 1], 0.4); } }
  P.buildRank = now;
}
const near = (G, at, r, skip) => G.enemies.filter((K) => !K.dead && K !== skip && K.pos.distanceTo(at) < r + K.radius);
const hurt = (P, K, dmg, col) => { P.procDepth++; P.dealDamage(K, dmg, K.pos, V3(0, 0, 0), false, 0, true, 0, 0, 0, 0, col); P.procDepth--; };
const shield = (P, a) => { P.overshield = Math.min(P.shieldCap(), P.overshield + a); };

// ---------------------------------------------------------------- a shot of yours has landed
export function buildHit(P, E, at, dealt, crit, head) {
  const G = P.game, pw = P.power(); let r;
  if ((r = rank(P, 'Storm'))) {
    P.stN = (P.stN || 0) + 1;
    if (P.stN >= (r > 1 ? 4 : 6)) {
      P.stN = 0; const c = BUILDS.Storm.col, top = E.pos.clone().add(V3((Math.random() - 0.5) * 300, 1400, (Math.random() - 0.5) * 300));
      G.fx.arc(top, E.pos, c); G.fx.arc(top, E.pos, [1, 1, 1]); G.fx.flash(E.pos, c, 260, 0.2, true); G.fx.ring(E.feet(), 200, c, 0.3); G.audio.playAt('S_Chain', E.pos, 0.7, 0.8);
      hurt(P, E, pw * 0.9, c);
      if (r > 1) { let from = E.pos; for (const K of near(G, E.pos, 600, E).slice(0, 2)) { G.fx.arc(from, K.pos, c); hurt(P, K, pw * 0.6, c); P.stun(K, 0.5); from = K.pos; } }
    }
  }
  if ((r = rank(P, 'Powder'))) {
    P.pwN = (P.pwN || 0) + 1;
    if (P.pwN >= (r > 1 ? 5 : 8)) { P.pwN = 0; const from = P.pos.clone().add(V3(0, 70, 0)), d = E.pos.clone().sub(from).normalize().add(V3(0, 0.5, 0)).normalize(); G.projectiles.spawn({ pos: from, vel: d.multiplyScalar(1700), damage: pw * 1.2, splash: 200, fromProc: true, procCoef: 0, target: E.dead ? null : E, homing: 7, life: 4, kind: 'Missile', color: BUILDS.Powder.col, radius: 9 }); G.audio.playAt('S_Launcher', from, 0.3, 1.7); }
  }
  if (crit && (r = rank(P, 'Deadeye'))) {
    let from = E.pos.clone().add(V3(0, 40, 0)); const c = BUILDS.Deadeye.col;
    for (const K of near(G, E.pos, 900, E).sort((a, b) => a.pos.distanceTo(E.pos) - b.pos.distanceTo(E.pos)).slice(0, r > 1 ? 3 : 1)) { const to = K.pos.clone().add(V3(0, 40, 0)); G.fx.arc(from, to, c); G.fx.flash(to, c, 90, 0.12, true); hurt(P, K, dealt * 0.4, c); from = to; }
    if (r > 1 && E.dead) shield(P, 6);
  }
  if (P.meleeHitting && rank(P, 'Blade') > 1) P.combatHeal(2);
}
// ---------------------------------------------------------------- something of yours has died
export function buildKill(P, E) {
  const G = P.game, pw = P.power(), at = E.pos.clone(); let r;
  if (P.procDepth > 1) return;
  if (E.burnT > 0 && (r = rank(P, 'Ember'))) {
    const c = BUILDS.Ember.col, R = r > 1 ? 440 : 340; G.fx.ring(E.feet(), R, c, 0.4); G.fx.flash(at, c, R * 0.6, 0.25, true); G.fx.puff(at, c, 160, 0.5); G.audio.playAt('S_Flame', at, 0.6, 0.9);
    for (const K of near(G, at, R, E)) { K.applyBurn(pw * 0.5, 3); hurt(P, K, pw * 0.5, c); }
    if (r > 1) P.combatHeal(2);
  }
  if (E.slowT > 0 && (r = rank(P, 'Frost'))) {
    const c = BUILDS.Frost.col; G.fx.ring(E.feet(), 360, c, 0.35); G.fx.sparks(at, V3(0, 1, 0), [0.85, 0.95, 1], 18); G.fx.flash(at, c, 220, 0.2, true); G.audio.playAt('S_Ricochet', at, 0.6, 1.2);
    for (const K of near(G, at, 360, E)) { hurt(P, K, pw * 0.6, c); K.applySlow(0.6, 2.5); if (r > 1) P.stun(K, 0.9); }
    if (r > 1) shield(P, 4);
  }
  if (E.bleedT > 0 && (r = rank(P, 'Blood'))) {
    const c = BUILDS.Blood.col, R = r > 1 ? 400 : 300, d = Math.min(pw * 2, E.maxHealth * 0.1); G.fx.ring(E.feet(), R, c, 0.35); G.fx.puff(at, [0.7, 0.05, 0.08], 200, 0.6); G.fx.flash(at, c, 200, 0.18, true);
    for (const K of near(G, at, R, E)) { hurt(P, K, d, c); K.applyBleed(d); }
    if (r > 1) P.combatHeal(3);
  }
  if ((r = rank(P, 'Blood')) > 1) { const t = G.time; P.brK = (P.brK || []).filter((x) => t - x < 4); P.brK.push(t); if (P.brK.length >= 3 && !(P.rageT > 3)) { P.brK = []; P.rage = Math.max(P.rage, 0.25); P.rageT = 5; P.bloodT = 5; G.hud.hurtFlash = 0.25; G.banner('BLOOD RAGE', BUILDS.Blood.col, 1.6); } }
  if (E.lastHitExplosive && rank(P, 'Powder') > 1 && !(P.bombT > G.time)) { P.bombT = G.time + 0.6; G.projectiles.spawn({ pos: at.clone().add(V3(0, 60, 0)), vel: V3((Math.random() - 0.5) * 500, 520, (Math.random() - 0.5) * 500), damage: pw * 1.2, splash: 260, fromProc: true, procCoef: 0, gravity: 1, bounces: 1, fuse: 0.9, life: 3, kind: 'Grenade', color: BUILDS.Powder.col, radius: 9 }); }
  if ((r = rank(P, 'Fortune'))) {
    const T = near(G, at, 1400, E); for (let i = 0; i < (r > 1 ? 4 : 2); i++) { const K = T[i % Math.max(1, T.length)]; if (!K) break; const a = Math.random() * Math.PI * 2; G.projectiles.spawn({ pos: at.clone().add(V3(0, 80, 0)), vel: V3(Math.cos(a) * 500, 700, Math.sin(a) * 500), damage: pw * 0.4, fromProc: true, procCoef: 0, target: K, homing: 8, life: 3, kind: 'Card', color: BUILDS.Fortune.col, radius: 9, moneyPerHit: r > 1 ? 10 : 0 }); }
  }
  if ((r = rank(P, 'Bulwark'))) shield(P, 2);
  if (rank(P, 'Rush') > 1 && P.dashCharges < P.maxDash()) P.dashRecharge += P.dashCooldown() * 0.25;
  if (P.meleeHitting && (r = rank(P, 'Blade')) && !(P.sawT > G.time)) {
    P.sawT = G.time + 0.4; const f = V3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));
    for (let i = 0; i < r; i++) { const d = f.clone().applyAxisAngle(V3(0, 1, 0), (i - (r - 1) / 2) * 0.35); G.projectiles.spawn({ pos: P.pos.clone().add(V3(0, 10, 0)).addScaledVector(d, 80), vel: d.multiplyScalar(1500), damage: pw * 1.1, fromProc: true, procCoef: 0, pierce: 6, bounces: 2, life: 2.2, kind: 'Saw', color: BUILDS.Blade.col, radius: 26 }); }
    P.play('S_Saw', 0.6, 1, 0.05);
  }
}
// ---------------------------------------------------------------- something has hit you
export function buildHurt(P, source) {
  const G = P.game;
  if (rank(P, 'Bulwark') && source && !source.dead && source.pos && !(P.bkT > G.time)) {
    P.bkT = G.time + 0.6; const c = BUILDS.Bulwark.col; G.fx.arc(P.pos, source.pos, c); G.fx.flash(source.pos, c, 160, 0.15, true); hurt(P, source, P.power() * 0.7, c); P.stun(source, 0.6);
    if (!source.isBoss && source.launch) { const d = source.pos.clone().sub(P.pos).setY(0).normalize(); source.launch(V3(d.x * 600, 260, d.z * 600)); }
  }
}
// ---------------------------------------------------------------- every frame
export function buildTick(P, dt) {
  const G = P.game; if (P.dead || !P.build) return; let r;
  if (rank(P, 'Ember') > 1 && (P.emT = (P.emT || 0) + dt) > 7) { P.emT = 0; if (near(G, P.pos, 520).length) { const c = BUILDS.Ember.col; P.shockAround(520, P.power() * 0.6, c, 200, 120); for (const K of near(G, P.pos, 520)) K.applyBurn(P.power() * 0.5, 3); } else P.emT = 6; }
  if (rank(P, 'Bulwark') > 1 && (P.bpT = (P.bpT || 0) + dt) > 6) { P.bpT = 0; if (P.overshield > 1 && near(G, P.pos, 460).length) P.shockAround(460, P.overshield * 2, BUILDS.Bulwark.col, 420, 200); else P.bpT = 5; }
  if ((r = rank(P, 'Rush'))) {
    if (P.dashT > 0) {
      if (!P.wire) { P.wire = new Set(); P.wireFrom = P.pos.clone(); }
      const c = BUILDS.Rush.col;
      for (const K of near(G, P.pos, 210)) if (!P.wire.has(K)) { P.wire.add(K); G.fx.arc(P.pos, K.pos, c); G.fx.flash(K.pos, c, 120, 0.12, true); hurt(P, K, P.power() * 0.9, c); P.stun(K, 0.4); }
      if (Math.random() < dt * 40) G.fx.sparks(V3(P.pos.x, P.pos.y - 60, P.pos.z), V3(0, 1, 0), c, 3);
    } else if (P.wire) {
      if (P.wireFrom) G.fx.arc(P.wireFrom, P.pos, BUILDS.Rush.col);
      if (r > 1) { P.procDepth++; P.explodeAt(P.pos.clone(), 320, P.power() * 1.2, 0, true, false, BUILDS.Rush.col, null); P.procDepth--; }
      P.wire = null;
    }
  }
}
