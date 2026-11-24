// Classes, and how the upgrade pool is split.
//   * buffs: come from chests and bosses. Class-weighted: perks that suit your class turn up more often, ones that
//     don't turn up less, and each class has perks nobody else can find.
//   * gun modifiers: come only from the workbench and live on one gun. Anything that changes how a gun behaves
//     (extra projectiles, pierce, on-hit effects, reload tricks, alt-fire) is in this pool.
import './cores.js';
import { buildOf, countBuilds } from './builds.js';
import { DATA, RARITIES, rarityIndex } from './data.js';
import { Meta } from './meta.js';

export const CLASSES = [
  { id: 'gunslinger', name: 'Gunslinger', ability: 'Deadeye', short: 'DEADEYE', cd: 20, hex: '#ffcd5a',
    blurb: 'Rifles and SMGs, and a third gun on the belt.',
    kit: ['Carries three guns', '+10% fire rate, +15% reload speed', 'F - Deadeye: 5 seconds of faster fire, free ammo and no spread'],
    stats: [['FireRate', 0.1], ['ReloadSpeed', 0.15]] },
  { id: 'brawler', name: 'Brawler', ability: 'Bull Rush', short: 'RUSH', cd: 7, hex: '#ff6a4d',
    blurb: 'Lives in melee range.',
    kit: ['+30% melee damage, +15% swing speed, +40 max health', 'Melee kills heal you a little, and the mystery box offers you blades far more often', 'F - Bull Rush: charge through a crowd, untouchable, hitting everything in the way'],
    stats: [['MeleeDamage', 0.3], ['MeleeSpeed', 0.15], ['MaxHealth', 40]] },
  { id: 'engineer', name: 'Engineer', ability: 'Turret', short: 'TURRET', cd: 3, hex: '#6ec8ff',
    blurb: 'Builds a turret and gives it a gun.',
    kit: ['F - place your turret, or call it to a new spot', 'Press E on the turret to bind the gun you are holding to it', '+15 armor'],
    stats: [['Armor', 15]] },
  { id: 'sniper', name: 'Sniper', ability: 'Grapple', short: 'HOOK', cd: 3, hex: '#8fe08f',
    blurb: 'High ground and head shots.',
    kit: ['The only class with the grapple hook (F)', '+40% headshot damage', 'Aimed shots deal +15% damage and pierce 2 more enemies'],
    stats: [['HeadshotDamage', 0.4]] },
  { id: 'bomber', name: 'Bomber', ability: 'Satchel Charge', short: 'SATCHEL', cd: 12, hex: '#ffa23a',
    blurb: 'Everything is a blast radius.',
    kit: ['Carries 6 grenades, starts with 4, and finds them more often', '+25% explosion radius', 'F - Satchel Charge: a heavy bomb, no grenade needed'],
    stats: [['ExplosionRadius', 0.25]] },
];
export const classById = (id) => CLASSES.find((C) => C.id === id) || CLASSES[0];

// ---- tag every upgrade once
const GUN_STATS = ['Pierce', 'Multishot', 'Spread', 'MagSize', 'ReserveAmmo', 'AmmoSave', 'FireRate', 'ReloadSpeed', 'ExplosionRadius', 'Knockback',
  'AltLauncher', 'AltGravity', 'AltRail', 'AltBuck', 'ActiveReload', 'EchoShot', 'Ricochet', 'LastRounds', 'FirstShot', 'FullAuto', 'KillReload', 'SteadyAim', 'Shrapnel',
  'RampFire', 'DashReload', 'TapedMag', 'HotBarrel', 'PierceRamp', 'PierceSlow', 'FinalRound'];
const GUN_TRIGGERS = ['OnHit', 'OnReload', 'OnCrit', 'OnHeadshot'];
export const ALT_STATS = ['AltLauncher', 'AltGravity', 'AltRail', 'AltBuck'];
const FIT = {
  brawler: { stats: ['MaxHealth', 'Armor', 'Thorns', 'DashDamage', 'SlamDamage', 'Lifesteal', 'LowHealthDamage', 'HealthRegen', 'CloseDamage', 'HealthDamage', 'BlockChance', 'PlateArmor', 'KillHealth', 'HealBoost'], trig: ['OnHurt', 'OnMeleeKill'], fx: [], melee: true },
  sniper: { stats: ['HeadshotDamage', 'CritChance', 'CritDamage', 'BossDamage', 'EliteDamage', 'GrappleCooldown', 'AirDamage', 'Pierce', 'SteadyAim', 'FirstShot', 'AltRail', 'Spread', 'FarDamage', 'FullHealthDamage', 'CritHeal', 'EliteExecute', 'AirGuard'], trig: ['OnGrapple', 'OnHeadshot', 'OnCrit'], fx: [] },
  gunslinger: { stats: ['FireRate', 'ReloadSpeed', 'MagSize', 'AmmoSave', 'Damage', 'SpeedDamage', 'MoveSpeed', 'Multishot', 'FullAuto', 'EchoShot', 'KillReload', 'ActiveReload', 'LastRounds', 'Ricochet', 'AltBuck', 'StreakDamage', 'HealthyDamage', 'DashGuard'], trig: ['OnReload', 'OnMultiKill'], fx: [] },
  bomber: { stats: ['ExplosionRadius', 'Knockback', 'AltLauncher', 'AltGravity', 'Shrapnel', 'StatusDamage'], trig: [], fx: ['Explode', 'Missile', 'Nova', 'Shockwave', 'Ignite'] },
  engineer: { stats: ['ProcChance', 'ReserveAmmo', 'Armor', 'PickupRange', 'ShieldRegen', 'Overheal', 'MoneyDamage', 'RoundMoney'], trig: ['Periodic', 'OnShieldBreak', 'OnPickup'], fx: ['Shield', 'Chain', 'Freeze'] },
};
for (const u of DATA.upgrades) {
  const names = u.mods.map((m) => m[0]), melee = names.some((n) => n.startsWith('Melee'));
  u.cls = (CLASSES.find((C) => C.name === u.insp) || {}).id || null;           // class perk: only that class is offered it
  u.gun = !!u.bench;   // the bench only tunes a gun's numbers now; everything that changes how a gun behaves comes out of chests with the rest
  u.alt = names.find((n) => ALT_STATS.includes(n)) || null; if (u.alt) u.cut = true;   // alternate fire was taken out, so nothing offers it
  u.grapple = u.trigger === 'OnGrapple' || (names.length > 0 && names.every((n) => n === 'GrappleCooldown'));   // only perks that do nothing without a hook
  u.fits = [];
  for (const id in FIT) { const F = FIT[id]; if ((F.melee && melee) || names.some((n) => F.stats.includes(n)) || F.trig.includes(u.trigger) || (u.fx && F.fx.includes(u.fx))) u.fits.push(id); }
}
// how likely this class is to be offered this upgrade, relative to a neutral one
export function classWeight(u, cls) {
  if (u.cls) return u.cls === cls ? 1.8 : 0;
  if (u.grapple && cls !== 'sniper') return 0;          // nobody else has a hook to improve
  // fewer plain numbers and fewer blade buffs for people who are not using a blade: what a chest offers should change how you play
  const dull = (u.plain ? 0.4 : 1) * (u.meleeOnly && cls !== 'brawler' ? 0.3 : 1);
  if (u.fits.includes(cls)) return 1.7 * dull;
  return (u.fits.length ? 0.6 : 1) * dull;
}
const pick = (pool) => { let t = 0; for (const p of pool) t += p[1]; let r = Math.random() * t; for (const p of pool) { r -= p[1]; if (r <= 0) return p[0]; } return pool.length ? pool[pool.length - 1][0] : -1; };

// Variety: a buff you already hold is far less likely to turn up again (each stack divides its odds), and the last
// dozen things offered are nearly ruled out, so two chests in a row do not hand you the same thing.
const RECENT = [];
// a buff of this rarity (falls to the tier below when that tier is spent)
export function rollBuff(rarity, stacks, cls) {
  const have = Array.isArray(stacks) ? countBuilds(stacks) : {};
  const hasAlt = Array.isArray(stacks) && stacks.some((n, i) => n > 0 && DATA.upgrades[i].alt);   // one alternate fire at a time   // a build you have started turns up more: a run should be able to commit
  for (let tier = rarity; tier >= 0; tier--) {
    const pool = [];
    DATA.upgrades.forEach((u, i) => { if (u.alt && !(stacks[i] > 0) && hasAlt) return; if (u.cut || u.gun || rarityIndex(u.rarity) !== tier || (stacks[i] || 0) >= u.stacks || Meta.upgradeLocked(u.name)) return; const b = buildOf(u), w = classWeight(u, cls) / (1 + 1.2 * (stacks[i] || 0)) * (RECENT.includes(i) ? 0.15 : 1) * (b ? 1 + 0.5 * Math.min(4, have[b] || 0) : 0.6); if (w > 0) pool.push([i, w]); });
    if (pool.length) { const got = pick(pool); RECENT.push(got); if (RECENT.length > 12) RECENT.shift(); return got; }
  }
  return -1;
}
// a modifier for one gun. `mods` is what that gun already has, W its weapon definition.
const RW = [12, 30, 28, 16, 7];   // the bench favours modifiers that change how a gun plays over plain numbers
export function rollGunMod(mods, W, cls, luck = 0) {
  { const bi = DATA.upgrades.findIndex((u) => u.bench); if (bi >= 0) return mods.length < 4 ? bi : -1; }
  const have = {}; for (const m of mods) have[m] = (have[m] || 0) + 1;
  const hasAlt = mods.some((m) => DATA.upgrades[m].alt), cont = W.mode === 'Beam' || W.mode === 'Flame';
  const pool = [];
  DATA.upgrades.forEach((u, i) => {
    if (!u.gun || (have[i] || 0) >= (u.rarity === 'Common' ? 1 : Math.min(u.stacks, 2)) || Meta.upgradeLocked(u.name)) return;
    if (u.alt && hasAlt) return;
    const names = u.mods.map((m) => m[0]);
    if (names.includes('FullAuto') && W.auto) return;
    if (cont && names.some((n) => ['EchoShot', 'FullAuto', 'FirstShot', 'LastRounds', 'SteadyAim', 'Ricochet', 'Multishot', 'ActiveReload', 'FinalRound', 'TapedMag', 'PierceRamp', 'PierceSlow'].includes(n))) return;
    if (names.includes('FinalRound') && W.mag < 3) return;
    if (names.includes('ExplosionRadius') && !(W.splash > 0)) return;
    if ((names.includes('FirstShot') && W.mag < 4) || (names.includes('LastRounds') && W.mag < 3)) return;   // magazine tricks need a magazine
    const ri = rarityIndex(u.rarity);
    pool.push([i, RW[ri] * (1 + 0.02 * Math.min(40, luck) * ri) * Math.max(0.4, classWeight(u, cls))]);
  });
  return pool.length ? pick(pool) : -1;
}
export const RARITY_NAME = RARITIES;
