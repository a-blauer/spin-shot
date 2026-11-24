// Builds. Every buff belongs to a family (fire, frost, storm, blood, powder, deadeye, bulwark, rush, fortune, blade).
// Holding two buffs of one family wakes its first power; holding five wakes the second. The powers are things that
// happen in the world - bursts, strikes, blades, coins - so a run is about feeding one or two families, not adding
// percentages. Chests lean toward families you have already started.
import * as THREE from 'three';
import { DATA, lin } from './data.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const TIERS = [2, 5, 8];
export const BUILDS = {
  Ember: { hex: '#ff8a3a', col: [1, 0.5, 0.15], p: ['Your hits can set enemies alight. Burning enemies burst into flame when they die and set light to whatever is near.', 'Every burst heals you, and a ring of fire rolls out from you every 7 seconds.', 'Everything burning takes 30% more from you, and the ring comes twice as often.'] },
  Frost: { hex: '#8ad8ff', col: [0.5, 0.85, 1], p: ['Your hits can chill enemies. Chilled enemies shatter when they die: the shards cut and chill everything near.', 'Shatters freeze what they hit solid for a moment and give you overshield.', 'A blizzard breaks from you every 8 seconds and freezes everything near solid.'] },
  Storm: { hex: '#b8a8ff', col: [0.7, 0.65, 1], p: ['Every sixth hit calls lightning down on the target for 150% of the hit.', 'Every fourth hit for 120%, and the bolt forks to two more for 40% and leaves them dazed.', 'Every third hit.'] },
  Blood: { hex: '#ff4a5a', col: [1, 0.2, 0.25], p: ['Your hits can open wounds. Bleeding enemies burst when they die, wounding everything near and making it bleed.', 'Every burst heals you, and three kills in quick succession send you into a blood rage.', 'You heal for 3% of all damage you deal, and a burst that kills sets off another.'] },
  Powder: { hex: '#ffcf5a', col: [1, 0.8, 0.3], p: ['Every eighth hit fires a seeking rocket for 250% of the hit.', 'Every fifth hit for 200%, and enemies killed by a blast drop a live bomb.', 'Three smaller rockets at a time.'] },
  Deadeye: { hex: '#ffe9a0', col: [1, 0.9, 0.6], p: ['Crits throw a tracer on to the nearest other enemy.', 'The tracer hits three, and a kill with a crit gives you overshield.', 'A kill with a crit loads a golden round: your next shot is a certain crit for double.'] },
  Bulwark: { hex: '#9ab8d8', col: [0.6, 0.72, 0.85], p: ['Anything that hits you is shocked and thrown back; kills top up your overshield.', 'While you hold overshield it pulses every 6 seconds, hurting everything near for twice what you hold.', 'A quarter of every blow is turned and thrown back threefold.'] },
  Rush: { hex: '#7affc0', col: [0.45, 1, 0.75], p: ['Your dash leaves a live wire: everything you pass through is struck.', 'Kills give dash charge back, and the dash ends in a blast.', 'At a run you crackle: lightning leaps from you to the nearest enemy twice a second.'] },
  Fortune: { hex: '#ffd24d', col: [1, 0.82, 0.3], p: ['The dead throw two coins that seek out the living.', 'Three coins, and each one that lands pays you.', 'Four coins that hit harder and pay more.'] },
  Blade: { hex: '#e0e6f0', col: [0.88, 0.9, 0.95], p: ['A kill with a blade throws a spinning saw down the line.', 'Blade hits heal you, and two saws fly.', 'Every blade hit throws a saw.'] },
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
  if (u.core) return null;   // the Descent's parts are their own thing: they do not feed the build families
  if (u.build !== undefined) return u.build;
  let b = null; const names = (u.mods || []).map((m) => m[0]);
  for (const [name, fx, stats] of RULES) if ((u.fx && fx.includes(u.fx)) || names.some((n) => stats.includes(n)) || (name === 'Blade' && names.some((n) => n.startsWith('Melee')))) { b = name; break; }
  if (!b) for (const [name, , , re] of RULES) if (re.test(u.desc || '')) { b = name; break; }
  u.build = b; return b;
}
export function countBuilds(stacks) { const c = {}; stacks.forEach((n, i) => { if (n > 0) { const b = buildOf(DATA.upgrades[i]); if (b) c[b] = (c[b] || 0) + n; } }); return c; }
export const rank = (P, b) => { const n = (P.build && P.build[b]) || 0; return n >= TIERS[2] ? 3 : n >= TIERS[1] ? 2 : n >= TIERS[0] ? 1 : 0; };
// what a chest card says about the family a buff feeds: where you stand, what one more does, and what it would combine with
export function buildNote(P, u) {
  const b = buildOf(u); if (!b) return null;
  const n = (P.build && P.build[b]) || 0, r = n >= TIERS[2] ? 3 : n >= TIERS[1] ? 2 : n >= TIERS[0] ? 1 : 0, target = r < 3 ? TIERS[r] : 0, wakes = target && n + 1 >= target;
  const combos = [];
  if (r === 0 && wakes) for (const [k, x, y, text] of DUOS) { const other = x === b ? y : y === b ? x : null; if (other && P.buildRank && P.buildRank[other] > 0) combos.push(`${k} with your ${other}: ${text}`); }
  return { name: b.toUpperCase(), hex: BUILDS[b].hex, n, target, wakes, owned: n > 0, rankName: 'I'.repeat(r + 1), power: target ? BUILDS[b].p[r] : '', combos };
}
// called when the set of buffs changes: announce any power that has just woken
export function buildChanged(P) {
  const old = P.buildRank || {}, now = {}; P.build = countBuilds(P.upgradeStacks);
  if (P.slot && P.slot.mods) for (const m of P.slot.mods) { const b = buildOf(DATA.upgrades[m]); if (b) P.build[b] = (P.build[b] || 0) + 1; }   // what is fitted to the gun in your hands counts too
  for (const b in BUILDS) { now[b] = rank(P, b); if (now[b] > (old[b] || 0) && P.game && P.game.hud && P.buildRank) { P.game.banner(`${b.toUpperCase()} ${'I'.repeat(now[b])}`, BUILDS[b].col, 3.5); P.toast(BUILDS[b].p[now[b] - 1], BUILDS[b].hex); P.play('S_LevelUp', 0.7, now[b] === 2 ? 0.8 : 1.1); const f = V3(P.pos.x, P.pos.y - 85, P.pos.z); P.game.fx.ring(f, 420, BUILDS[b].col, 0.6); P.game.fx.ring(f, 240, [1, 1, 1], 0.4); } }
  // two families awake together make a third thing between them
  const duo = {}; for (const [k, a, b] of DUOS) duo[k] = now[a] > 0 && now[b] > 0;
  if (P.duo && P.game && P.game.hud) for (const [k, a, b, text] of DUOS) if (duo[k] && !P.duo[k]) { P.game.banner(k.toUpperCase(), [1, 1, 1], 3); P.toast(`${a} + ${b}: ${text}`, '#ffffff'); }
  P.duo = duo; P.buildRank = now;
}
export const DUOS = [
  ['Thermal Shock', 'Ember', 'Frost', 'an enemy that is both burning and chilled when you hit it goes off in a burst of steam.'],
  ['Superconductor', 'Storm', 'Frost', 'your lightning freezes what it strikes.'],
  ['Napalm', 'Ember', 'Powder', 'your rockets and bombs set everything they catch alight.'],
  ['Arterial', 'Blood', 'Deadeye', 'crits open a wound: the target bleeds for the whole hit.'],
  ['Live Current', 'Storm', 'Rush', 'everything your dash strikes is hit by lightning as well.'],
  ['Loaded Dice', 'Fortune', 'Powder', 'your coins explode where they land.'],
  ['Blood Money', 'Blood', 'Fortune', 'blood bursts throw coins.'],
  ['Iron Maiden', 'Bulwark', 'Blade', 'blade hits give overshield.'],
];
const near = (G, at, r, skip) => G.enemies.filter((K) => !K.dead && K !== skip && K.pos.distanceTo(at) < r + K.radius);
const hurt = (P, K, dmg, col) => { P.procDepth++; P.dealDamage(K, dmg, K.pos, V3(0, 0, 0), false, 0, true, 0, 0, 0, 0, col); P.procDepth--; };
function coins(P, at, E, n, pay) {
  const G = P.game, T = near(G, at, 1400, E), boom = P.duo && P.duo['Loaded Dice'];
  for (let i = 0; i < n; i++) { const K = T[i % Math.max(1, T.length)]; if (!K) break; const a = Math.random() * Math.PI * 2; G.projectiles.spawn({ pos: at.clone().add(V3(0, 80, 0)), vel: V3(Math.cos(a) * 500, 700, Math.sin(a) * 500), damage: P.power() * (n > 3 ? 0.35 : 0.25), splash: boom ? 160 : 0, fromProc: true, procCoef: 0, target: K, homing: 8, life: 3, kind: 'Card', color: BUILDS.Fortune.col, radius: 9, moneyPerHit: pay }); }
}
function saws(P, n) {
  const G = P.game, f = V3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw)); P.sawT = G.time + 0.4;
  for (let i = 0; i < n; i++) { const d = f.clone().applyAxisAngle(V3(0, 1, 0), (i - (n - 1) / 2) * 0.35); G.projectiles.spawn({ pos: P.pos.clone().add(V3(0, 10, 0)).addScaledVector(d, 80), vel: d.multiplyScalar(1500), damage: P.power() * 1.1, fromProc: true, procCoef: 0, pierce: 6, bounces: 2, life: 2.2, kind: 'Saw', color: BUILDS.Blade.col, radius: 26 }); }
  P.play('S_Saw', 0.6, 1, 0.05);
}
const shield = (P, a) => { P.overshield = Math.min(P.shieldCap(), P.overshield + a); };

// ---------------------------------------------------------------- a shot of yours has landed
function strike(P, E, r, hit) {
  const G = P.game, pw = hit || P.power(), c = BUILDS.Storm.col, top = E.pos.clone().add(V3((Math.random() - 0.5) * 300, 1400, (Math.random() - 0.5) * 300));
  G.fx.shockStrike(E.feet(), 230, c); G.fx.flash(E.pos, c, 200, 0.16, true); G.audio.playAt('S_Zap', E.pos, 0.7, 0.9);
  hurt(P, E, pw * (r > 1 ? 1.2 : 1.5), c); if (P.duo && P.duo.Superconductor) { E.applySlow(0.6, 2.5); P.stun(E, 0.7); }
  if (r > 1) { let from = E.pos; for (const K of near(G, E.pos, 600, E).slice(0, 2)) { G.fx.arc(from, K.pos, c); hurt(P, K, pw * 0.4, c); P.stun(K, 0.5); if (P.duo && P.duo.Superconductor) K.applySlow(0.6, 2.5); from = K.pos; } }
}
export function buildHit(P, E, at, dealt, crit, head) {
  const G = P.game, pw = P.power(); let r;
  // a family that works on a condition brings the condition with it: your own hits light, chill and cut
  if ((r = rank(P, 'Ember')) && Math.random() < 0.12 + 0.06 * r) E.applyBurn(pw * 0.4, 3);
  if ((r = rank(P, 'Frost')) && Math.random() < 0.12 + 0.06 * r) E.applySlow(0.45, 2.5);
  if ((r = rank(P, 'Blood')) && Math.random() < 0.12 + 0.06 * r) E.applyBleed(dealt * 0.4);
  if (rank(P, 'Blood') > 2) P.combatHeal(dealt * 0.03);
  if (P.duo) {
    if (P.duo['Thermal Shock'] && E.burnT > 0 && E.slowT > 0 && !(E.steamT > G.time)) { E.steamT = G.time + 1.5; G.fx.ring(E.feet(), 300, [0.9, 0.95, 1], 0.35); for (let q = 0; q < 5; q++) G.fx.add({ pos: E.pos.clone(), vel: V3((Math.random() - 0.5) * 300, 260 + Math.random() * 200, (Math.random() - 0.5) * 300), drag: 1.5, life: 0.9, size0: 90, size1: 260, rot: Math.random() * 360, c0: [0.95, 0.97, 1, 0.8], c1: [0.9, 0.92, 0.95, 0], fadeOut: 0.7, tex: 'FX_Smoke' }); for (const K of near(G, E.pos, 300)) hurt(P, K, pw * 0.8, [0.9, 0.95, 1]); }
    if (P.duo.Arterial && crit) E.applyBleed(dealt);
    if (P.duo['Iron Maiden'] && P.meleeHitting) shield(P, 2);
  }
  if (crit && rank(P, 'Deadeye') > 2 && E.dead) { P.goldRound = true; }
  if ((r = rank(P, 'Storm'))) { P.stN = (P.stN || 0) + 1; if (P.stN >= (r > 2 ? 3 : r > 1 ? 4 : 6)) { P.stN = 0; strike(P, E, r, dealt); } }
  if ((r = rank(P, 'Powder'))) {
    P.pwN = (P.pwN || 0) + 1;
    if (P.pwN >= (r > 1 ? 5 : 8)) { P.pwN = 0; const from = P.pos.clone().add(V3(0, 70, 0)); for (let i = 0; i < (r > 2 ? 3 : 1); i++) { const d = E.pos.clone().sub(from).normalize().add(V3((i - 1) * 0.35 * (r > 2 ? 1 : 0), 0.5, 0)).normalize(); G.projectiles.spawn({ pos: from.clone(), vel: d.multiplyScalar(1700), damage: dealt * (r > 2 ? 0.9 : r > 1 ? 2 : 2.5), splash: 200, burn: P.duo && P.duo.Napalm ? pw * 0.5 : 0, fromProc: true, procCoef: 0, target: E.dead ? null : E, homing: 7, life: 4, kind: 'Missile', color: BUILDS.Powder.col, radius: 9 }); } G.audio.playAt('S_Launcher', from, 0.3, 1.7); }
  }
  if (crit && (r = rank(P, 'Deadeye'))) {
    let from = E.pos.clone().add(V3(0, 40, 0)); const c = BUILDS.Deadeye.col;
    for (const K of near(G, E.pos, 900, E).sort((a, b) => a.pos.distanceTo(E.pos) - b.pos.distanceTo(E.pos)).slice(0, r > 1 ? 3 : 1)) { const to = K.pos.clone().add(V3(0, 40, 0)); G.fx.arc(from, to, c); G.fx.flash(to, c, 90, 0.12, true); hurt(P, K, dealt * 0.4, c); from = to; }
    if (r > 1 && E.dead) shield(P, 6);
  }
  if (P.meleeHitting && rank(P, 'Blade') > 1) P.combatHeal(2);
  if (P.meleeHitting && rank(P, 'Blade') > 2 && !(P.sawT > G.time)) saws(P, 1);
}
// ---------------------------------------------------------------- something of yours has died
export function buildKill(P, E) {
  const G = P.game, pw = P.power(), at = E.pos.clone(); let r;
  if (P.procDepth > 1) return;
  if (E.burnT > 0 && (r = rank(P, 'Ember'))) {
    const c = BUILDS.Ember.col, R = r > 1 ? 440 : 340; G.fx.fireBurst(E.feet(), R, c); G.audio.playAt('S_Flame', at, 0.6, 0.9);
    for (const K of near(G, at, R, E)) { K.applyBurn(pw * 0.5, 3); hurt(P, K, pw * 0.5, c); }
    if (r > 1) P.combatHeal(2);
  }
  if (E.slowT > 0 && (r = rank(P, 'Frost'))) {
    const c = BUILDS.Frost.col; G.fx.frostBurst(E.feet(), 360, c); G.audio.playAt('S_Frost', at, 0.7);
    for (const K of near(G, at, 360, E)) { hurt(P, K, pw * 0.6, c); K.applySlow(0.6, 2.5); if (r > 1) P.stun(K, 0.9); }
    if (r > 1) shield(P, 4);
  }
  if (E.bleedT > 0 && (r = rank(P, 'Blood'))) {
    const c = BUILDS.Blood.col, R = r > 1 ? 400 : 300, d = Math.min(pw * 2, E.maxHealth * 0.1); G.fx.bloodBurst(at, R);
    for (const K of near(G, at, R, E)) { K.applyBleed(d); if (r < 3) P.procDepth++; hurt(P, K, d, c); if (r < 3) P.procDepth--; }   // at the third rank a burst that kills is itself a kill, and bursts in turn
    if (r > 1) P.combatHeal(3);
    if (P.duo && P.duo['Blood Money']) coins(P, at, E, 2, 0);
  }
  if ((r = rank(P, 'Blood')) > 1) { const t = G.time; P.brK = (P.brK || []).filter((x) => t - x < 4); P.brK.push(t); if (P.brK.length >= 3 && !(P.rageT > 3)) { P.brK = []; P.rage = Math.max(P.rage, 0.25); P.rageT = 5; P.bloodT = 5; G.hud.hurtFlash = 0.25; G.banner('BLOOD RAGE', BUILDS.Blood.col, 1.6); } }
  if (E.lastHitExplosive && rank(P, 'Powder') > 1 && !(P.bombT > G.time)) { P.bombT = G.time + 0.6; G.projectiles.spawn({ pos: at.clone().add(V3(0, 60, 0)), vel: V3((Math.random() - 0.5) * 500, 520, (Math.random() - 0.5) * 500), damage: pw * 1.2, splash: 260, burn: P.duo && P.duo.Napalm ? pw * 0.5 : 0, fromProc: true, procCoef: 0, gravity: 1, bounces: 1, fuse: 0.9, life: 3, kind: 'Grenade', color: BUILDS.Powder.col, radius: 9 }); }
  if ((r = rank(P, 'Fortune'))) {
    coins(P, at, E, r > 2 ? 4 : r > 1 ? 3 : 2, r > 2 ? 6 : r > 1 ? 5 : 0);
  }
  if ((r = rank(P, 'Bulwark'))) shield(P, 2);
  if (rank(P, 'Rush') > 1 && P.dashCharges < P.maxDash()) P.dashRecharge += P.dashCooldown() * 0.25;
  if (P.meleeHitting && (r = rank(P, 'Blade')) && !(P.sawT > G.time)) {
    saws(P, Math.min(2, r));
  }
}
// ---------------------------------------------------------------- something has hit you
export function buildHurt(P, source, amount = 0) {
  const G = P.game;
  if (rank(P, 'Bulwark') > 2 && source && !source.dead && source.takeHit && amount > 0) hurt(P, source, amount * 0.75, BUILDS.Bulwark.col);
  if (rank(P, 'Bulwark') && source && !source.dead && source.pos && !(P.bkT > G.time)) {
    P.bkT = G.time + 0.6; const c = BUILDS.Bulwark.col; G.fx.arc(P.pos, source.pos, c); G.fx.flash(source.pos, c, 160, 0.15, true); hurt(P, source, P.power() * 0.7, c); P.stun(source, 0.6);
    if (!source.isBoss && source.launch) { const d = source.pos.clone().sub(P.pos).setY(0).normalize(); source.launch(V3(d.x * 600, 260, d.z * 600)); }
  }
}
// ---------------------------------------------------------------- every frame
export function buildTick(P, dt) {
  const G = P.game; if (P.dead || !P.build) return; let r;
  if (rank(P, 'Ember') > 1 && (P.emT = (P.emT || 0) + dt) > (rank(P, 'Ember') > 2 ? 3.5 : 7)) { P.emT = 0; if (near(G, P.pos, 520).length) { const c = BUILDS.Ember.col; P.shockAround(520, P.power() * 0.6, c, 200, 120, 'fire'); for (const K of near(G, P.pos, 520)) K.applyBurn(P.power() * 0.5, 3); } else P.emT = 6; }
  if (rank(P, 'Bulwark') > 1 && (P.bpT = (P.bpT || 0) + dt) > 6) { P.bpT = 0; if (P.overshield > 1 && near(G, P.pos, 460).length) P.shockAround(460, P.overshield * 2, BUILDS.Bulwark.col, 420, 200); else P.bpT = 5; }
  if (rank(P, 'Frost') > 2 && (P.fzT = (P.fzT || 0) + dt) > 8) { P.fzT = 0; const L = near(G, P.pos, 620); if (L.length) { const c = BUILDS.Frost.col, f = V3(P.pos.x, P.pos.y - 85, P.pos.z); G.fx.frostBurst(f, 620, c); G.audio.playAt('S_Frost', P.pos, 0.9, 0.75); for (const K of L) { K.applySlow(0.7, 3); P.stun(K, 1.4); hurt(P, K, P.power() * 0.5, c); } } else P.fzT = 7; }
  if (rank(P, 'Rush') > 2 && Math.hypot(P.vel.x, P.vel.z) > 700 && (P.crT = (P.crT || 0) + dt) > 0.5) { P.crT = 0; const K = near(G, P.pos, 520).sort((a, b) => a.pos.distanceTo(P.pos) - b.pos.distanceTo(P.pos))[0]; if (K) { const c = BUILDS.Rush.col; G.fx.arc(P.pos, K.pos, c); G.fx.flash(K.pos, c, 100, 0.1, true); hurt(P, K, P.power() * 0.3, c); } }
  if ((r = rank(P, 'Rush'))) {
    if (P.dashT > 0) {
      if (!P.wire) { P.wire = new Set(); P.wireFrom = P.pos.clone(); }
      const c = BUILDS.Rush.col;
      for (const K of near(G, P.pos, 210)) if (!P.wire.has(K)) { P.wire.add(K); G.fx.arc(P.pos, K.pos, c); G.fx.flash(K.pos, c, 120, 0.12, true); hurt(P, K, P.power() * 0.9, c); P.stun(K, 0.4); if (P.duo && P.duo['Live Current'] && !K.dead) strike(P, K, 1); }
      if (Math.random() < dt * 40) G.fx.sparks(V3(P.pos.x, P.pos.y - 60, P.pos.z), V3(0, 1, 0), c, 3);
    } else if (P.wire) {
      if (P.wireFrom) G.fx.arc(P.wireFrom, P.pos, BUILDS.Rush.col);
      if (r > 1) { P.procDepth++; P.explodeAt(P.pos.clone(), 320, P.power() * 1.2, 0, true, false, BUILDS.Rush.col, null); P.procDepth--; }
      P.wire = null;
    }
  }
}
