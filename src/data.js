// Game tables and the formulas that drive them (port of DMHData).
import content from './content.json';

export const DATA = content;
// Money is kept in tenths so small payouts still add up; everything the player sees is shown divided by ten.
export const cash = (x) => Math.max(0, Math.round((+x || 0) / 10)).toLocaleString();
export const cost10 = (x) => Math.max(10, Math.round(x / 10) * 10);   // prices are whole numbers of what is shown
// economy guard: common stat sticks cap at 5 copies, uncommons at 4
for (const u of DATA.upgrades) { if (u.rarity === 'Common') u.stacks = Math.min(u.stacks, 5); else if (u.rarity === 'Uncommon') u.stacks = Math.min(u.stacks, 4); }
// Every upgrade belongs to a set (Iron, Blood, Gold, Wind). Owning 3 / 6 / 9 different upgrades of one set gives its bonus.
export const SUITS = ['Iron', 'Blood', 'Gold', 'Wind'];
export const SUIT_HEX = { Iron: '#c9c2d6', Blood: '#ff5a5a', Gold: '#ffd24d', Wind: '#7dff8a' };
export const SUIT_BONUS = { Iron: '+12% damage', Blood: '+30 max health, +1 regen', Gold: '+15% money, +25% clover find', Wind: '+7% move speed, 15% faster dash' };
const H = ['MaxHealth', 'HealthRegen', 'Armor', 'Lifesteal', 'Thorns', 'Revives'], Dm = ['MoneyGain', 'LuckFind', 'CasinoDiscount', 'Interest', 'PickupRange'];
const Cl = ['MoveSpeed', 'JumpPower', 'ExtraJumps', 'DashCharges', 'DashCooldown', 'GrappleCooldown', 'WallRunTime', 'SlideBoost', 'AirControl', 'DashDamage', 'SlideDamage', 'AirDamage', 'SpeedDamage'];
for (const u of DATA.upgrades) {
  const m = u.mods.length ? u.mods[0][0] : null;
  if (m && H.includes(m) || ['Heal', 'Shield'].includes(u.fx)) u.suit = 'Blood';
  else if (m && Dm.includes(m) || ['Money', 'Clover'].includes(u.fx)) u.suit = 'Gold';
  else if (m && Cl.includes(m) || ['OnDash', 'OnSlide', 'OnGrapple', 'OnAirJump', 'OnWallRun', 'OnMantle'].includes(u.trigger) || u.fx === 'Haste') u.suit = 'Wind';
  else u.suit = 'Iron';
}
export const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Cursed'];
export const RARITY_HEX = { Common: '#d8d8d8', Uncommon: '#5bd65b', Rare: '#4aa3ff', Epic: '#b565f0', Legendary: '#ffb22e', Cursed: '#ff3b3b' };
export const rarityIndex = (r) => RARITIES.indexOf(r);

export const STATS = ['None', 'MaxHealth', 'HealthRegen', 'Armor', 'MoveSpeed', 'JumpPower', 'ExtraJumps', 'DashCharges', 'DashCooldown', 'GrappleCooldown',
  'WallRunTime', 'SlideBoost', 'AirControl', 'Damage', 'FireRate', 'ReloadSpeed', 'MagSize', 'ReserveAmmo', 'CritChance', 'CritDamage', 'HeadshotDamage',
  'Pierce', 'Multishot', 'Spread', 'ExplosionRadius', 'Knockback', 'AirDamage', 'SpeedDamage', 'SlideDamage', 'LowHealthDamage', 'BossDamage', 'EliteDamage',
  'MoneyGain', 'LuckFind', 'CasinoDiscount', 'Interest', 'Lifesteal', 'Thorns', 'SlamDamage', 'ProcChance', 'PickupRange', 'DashDamage', 'Revives', 'AmmoSave',
  'MeleeDamage', 'MeleeSpeed', 'MeleeRange', 'MeleeKnock', 'MeleeLifesteal', 'MeleeCleave', 'MeleeArc', 'MeleeBleed', 'MeleeMoney', 'MeleeCrit', 'MeleeBurn', 'MeleeShock', 'MeleeAmmo', 'MeleeDashReset', 'MeleeGuard', 'MeleeExecute', 'MeleeFrenzy',
  // gun modifiers (workbench) and class perks
  'AltLauncher', 'AltGravity', 'AltRail', 'AltBuck', 'ActiveReload', 'EchoShot', 'Ricochet', 'LastRounds', 'FirstShot', 'FullAuto', 'KillReload', 'SteadyAim', 'Shrapnel',
  'AbilityCooldown', 'AbilityPower', 'AbilityDuration', 'MeleeAbilityReset', 'RushGuard', 'TurretRate', 'TurretDamage', 'TurretCount', 'TurretShock', 'TurretAura', 'DeadeyeExtend', 'SwapReload', 'HeadMark', 'AdsCrit', 'GrenadeCap', 'BlastChain'];

export const AFFIX = { Blazing: 0, Frozen: 1, Shielded: 2, Vampiric: 3, Splitting: 4, Hasted: 5, Armored: 6, Blinking: 7, Gilded: 8, Volatile: 9 };
export const ENEMY_CREATURES = ['Shambler', 'Sprinter', 'Crawler', 'Bloater', 'Spitter', 'Leaper', 'Wisp', 'Brute', 'Screamer', 'Burrower', 'Gilded', 'Riot', 'Priest'];
export const BOSS_CREATURES = ['BigTony', 'Abomination', 'Carrion', 'Croupier', 'Gravedigger', 'LastDealer'];

export const TONICS = [
  { name: 'Vigor Tonic', desc: '+25 max health', base: 1500, step: 600, max: 8 },
  { name: "Bull's Blood", desc: '+10% damage', base: 2000, step: 800, max: 8 },
  { name: 'Quicksilver', desc: '+8% move speed', base: 1500, step: 600, max: 5 },
  { name: 'Deadeye Draught', desc: '+6% crit chance', base: 1800, step: 700, max: 6 },
  { name: 'Steady Hands', desc: '+10% fire rate and reload speed', base: 2000, step: 800, max: 6 },
  { name: 'Lucky Liquor', desc: '+2 Luck', base: 2500, step: 1500, max: 99 },
  { name: 'Mule Kick', desc: 'Carry a third weapon', base: 4000, step: 0, max: 1 },
  { name: 'Feather Fizz', desc: '+1 mid-air jump and +1 dash charge', base: 3500, step: 3000, max: 2 },
];
export const SYMBOLS = ['CHERRY', 'BELL', 'BAR', 'SEVEN', 'CROWN', 'CLOVER', 'SKULL'];
export const VAULT_COST = [5000, 10000, 20000];
export const PICKUP_NAMES = { Clover: 'Four-Leaf Clover', MaxAmmo: 'MAX AMMO', InstaKill: 'INSTA-KILL', DoublePoints: 'DOUBLE MONEY', Nuke: 'NUKE', FireSale: 'HALF PRICE', MoneyBag: 'Money Bag' };

const rand = Math.random;
export const randInt = (a, b) => a + Math.floor(rand() * (b - a + 1));
export const frandRange = (a, b) => a + rand() * (b - a);

export const luckMult = (luck) => 1 + 0.03 * Math.min(40, Math.max(0, luck));   // luck helps, but it tops out
// The mystery box: Uncommon 55%, Rare 30%, Epic 11%, Legendary 4% with no luck; about 20% Legendary at the cap.
export function rollBoxRarity(luck) {
  const M = luckMult(luck), W = [0, 55, 30 * M, 11 * M * M, 4 * M * M * M];
  let r = rand() * (W[1] + W[2] + W[3] + W[4]);
  for (let i = 1; i < 5; i++) { r -= W[i]; if (r <= 0) return i; }
  return 1;
}
export const luckRerollChance = (luck) => 1 - 1 / (1 + 0.06 * Math.max(0, luck));

export function rollRarity(luck, bias = 1) {
  const base = [55, 27, 12, 4.5, 1.5];
  const M = luckMult(luck) * Math.max(0.1, bias);
  const W = base.map((b, i) => b * Math.pow(M, i));
  const total = W.reduce((a, b) => a + b, 0);
  let r = rand() * total, acc = 0;
  for (let i = 0; i < 5; i++) { acc += W[i]; if (r <= acc) return i; }
  return 0;
}
import { Meta } from './meta.js';
export function rollUpgradeOfRarity(rarity, stacks) {
  let pool = [];
  for (let tier = rarity; tier >= 0 && pool.length === 0; tier--) {
    DATA.upgrades.forEach((u, i) => { if (rarityIndex(u.rarity) === tier && (stacks[i] || 0) < u.stacks && !Meta.upgradeLocked(u.name)) pool.push(i); });
    if (rarity === 5) break;
  }
  return pool.length ? pool[randInt(0, pool.length - 1)] : -1;
}
export function rollWeaponOfRarity(rarity, exA, exB) {
  let pool = [];
  for (let tier = rarity; tier >= 0 && pool.length === 0; tier--) {
    for (let i = 1; i < DATA.weapons.length; i++) if (i !== exA && i !== exB && rarityIndex(DATA.weapons[i].rarity) === tier && !Meta.gunLocked(DATA.weapons[i].name)) pool.push(i);
  }
  return pool.length ? pool[randInt(0, pool.length - 1)] : 1;
}
// The level is 15 rounds. Difficulty formulas were written for 25, so they read an effective round that covers the same climb.
// Three difficulties. Nightmare is the game as it was tuned; Hard and Normal scale down from it.
//   hp: enemy health    slope: how fast rounds ramp (health, damage, tougher types)    count: enemies per round
//   alive: how many at once    dmg: damage you take    spawn: seconds between spawns (higher = slower)
export const DIFFS = [
  { name: 'Normal', hp: 0.6, slope: 1.0, count: 0.6, alive: 0.75, dmg: 0.55, spawn: 1.45, desc: 'Fewer, weaker enemies that hit for about half and ramp up gently.' },
  { name: 'Hard', hp: 0.8, slope: 1.35, count: 0.8, alive: 0.88, dmg: 0.75, spawn: 1.2, desc: 'A real fight. Between the two.' },
  { name: 'Nightmare', hp: 1, slope: 1.7, count: 1, alive: 1, dmg: 1, spawn: 1, desc: 'Full hordes, full damage, the steepest climb.' },
];
let DF = DIFFS[2], dfi = 2;
export const setDifficulty = (i) => { dfi = Math.max(0, Math.min(2, i | 0)); DF = DIFFS[dfi]; };
export const difficulty = () => dfi;
export const diff = () => DF;
export const effRound = (r) => 1 + (Math.max(1, r) - 1) * DF.slope;
// hordes: far more bodies each round, each one 40% weaker than before
export const zombieHealth = (r0) => { const r = effRound(r0); return 0.6 * DF.hp * (r < 10 ? 150 + 100 * (r - 1) : 950 * Math.pow(1.1, r - 9)); };
const oldCount = (x) => 1.05 * (x <= 5 ? 6 + (x - 1) * 4.5 : 24 + (x - 5) * 5);
// kill pay shrinks as the horde grows so a round is worth about what it was
export const payScale = (r) => Math.max(0.3, Math.min(2.2, oldCount(1 + (Math.max(1, r) - 1) * 1.25) / zombieCount(r)));   // what a round is worth climbs slowly, and the same on every difficulty   // a round pays the same on every difficulty: fewer enemies, more each
export const zombieCount = (r) => Math.round((9 + r * 2 + 0.35 * Math.pow(r, 2.35)) * DF.count);   // a slow start: 11 in round 1, 34 by round 5, 107 by 10, 242 in round 15 (Nightmare)   // 15 in round 1, 65 by round 5, 178 by round 10, 345 in round 15
export const maxAlive = (r) => Math.max(8, Math.round(Math.min(64, 11 + r * 3.5) * DF.alive));
export const rarityPrice = (r) => [1000, 2000, 3500, 6000, 10000, 2500][r] || 1000;

// colour helpers: content colours are sRGB hex; the renderer works in sRGB directly
export const hexRGB = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
export const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const cssRGB = (c, a = 1) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;
// UE FLinearColor literals were linear; convert to sRGB for display
export const lin = (r, g, b) => [r, g, b].map((x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055));
