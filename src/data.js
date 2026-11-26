// Game tables and the formulas that drive them (port of DMHData).
import content from './content.json';

export const DATA = content;
// buffs retired for doing the same job as another one. They keep their slot (saves and the net protocol index
// upgrades by position) but are never offered again.
const CUT = new Set(["Twin Mount", "Remote Detonator", "Coin Purse", "Paymaster", "Tax Collector", "Trade License", "Tyrant's Purse", "Master Key", "Surgeon's Kit", "Vampire Fang", "Trophy Rack", "Titan's Belt", "Hard Hat", "Second Skin", "Iron Lung", "Barrier Coil", "Close Quarters", "Sharpshooter's Creed", "Hot Streak", "High Ground", "Featherfall", "Wind Chime", "Cowboy Spurs", "Dash Blades", "Fuel Cell", "Wind Walker", "Tailwind Ribbon", "Rattlesnake Skin", "Momentum Core", "Vulture's Due", "Bounty Poster", "Wisp Jar", "Brass Knuckles", "Reaper's Whetstone", "Warlord's Banner", "Lead Weight", "Fencer's Glove", "Wide Swing", "Iron Curtain", "Powder Charge", "Reel Spring", "Grapple Shock", "Eagle Eye", "Haymaker", "Deep Pockets", "Tri-Tip", "Hex Bullets", "Sticky Dynamite", "Chain Reaction", "Avalanche", "Loose Wire", "Air Supremacy", "Hermes' Wings", "Massacre", "Cursed Coin", "Death Warrant", "Apex Predator", "Predator", "Opportunist", "Spotter's Scope", "Thick Skull", "Tool Belt", "Iron Gut", "Gun Belt", "Dead Aim", "Light Pack", "Knuckle Wraps", "Vanguard", "Split Rounds", "Overflow Rounds", "Hangman's Mask", "Overwatch", "Bigger Boom", "Spring Heels", "Thunderclap Boots", "Mantle Spikes", "Colossus"]);
for (const u of DATA.upgrades) { u.cut = CUT.has(u.name); u.plain = !u.trigger && /^([+\-\u2212]\d[^.]*\.\s*)+$/.test((u.desc || '') + ' '); u.meleeOnly = !u.cls && /melee|heavy blow|swing/i.test(u.desc || ''); }
// Money is kept in tenths so small payouts still add up; everything the player sees is shown divided by ten.
export const cash = (x) => Math.max(0, Math.round((+x || 0) / 10)).toLocaleString();
export const cost10 = (x) => Math.max(10, Math.round(x / 10) * 10);   // prices are whole numbers of what is shown
// economy guard: common stat sticks cap at 5 copies, uncommons at 4
for (const u of DATA.upgrades) { if (u.rarity === 'Common') u.stacks = Math.min(u.stacks, 5); else if (u.rarity === 'Uncommon') u.stacks = Math.min(u.stacks, 4); }
// Every upgrade belongs to a set (Iron, Blood, Gold, Wind). Owning 3 / 6 / 9 different upgrades of one set gives its bonus.
export const SUITS = ['Iron', 'Blood', 'Gold', 'Wind'];
export const SUIT_HEX = { Iron: '#c9c2d6', Blood: '#ff5a5a', Gold: '#ffd24d', Wind: '#7dff8a' };
export const SUIT_BONUS = { Iron: '+12% damage', Blood: '+30 max health, +1 regen', Gold: '+20% money', Wind: '+7% move speed, 15% faster dash' };
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
  'AbilityCooldown', 'AbilityPower', 'AbilityDuration', 'MeleeAbilityReset', 'RushGuard', 'TurretRate', 'TurretDamage', 'TurretCount', 'TurretShock', 'TurretAura', 'DeadeyeExtend', 'SwapReload', 'HeadMark', 'AdsCrit', 'GrenadeCap', 'BlastChain',
  // the second set of buffs: conditions (who, where, when), ways of not dying, and class perks that change an ability
  'FullHealthDamage', 'CloseDamage', 'FarDamage', 'StatusDamage', 'HealthyDamage', 'MoneyDamage', 'StreakDamage', 'HealthDamage', 'BlockChance', 'AirGuard', 'DashGuard', 'PlateArmor', 'HitCap',
  'SecondWind', 'HealBoost', 'Overheal', 'ShieldRegen', 'KillHealth', 'CritHeal', 'EliteExecute', 'ChestLuck', 'ChestRefund', 'RoundMoney', 'MeleeHeavy', 'MeleeStun', 'MeleeArmor',
  'SwapSpeed', 'DeadeyeCrit', 'DeadeyeReload', 'RushShield', 'HealthMelee', 'TurretRange', 'TurretBurn', 'TurretBlast', 'StillDamage', 'HeadCrit', 'HeadExecute', 'GrenadeDamage', 'BlastBurn', 'GrenadeSave', 'ClusterAll',
  // buffs that do something rather than add a number
  'LandShock', 'Quake', 'Glide', 'OpenerStun', 'PointBlank', 'AirKillJump', 'WeakPoint', 'HeadPop', 'LightBolt', 'Parry', 'BladeWave', 'WallCrit', 'LowBurn', 'CritStun', 'Trample', 'BlockShock', 'SpendNova', 'GoldKill',
  'RampFire', 'DashReload', 'TapedMag', 'HotBarrel', 'PierceRamp', 'PierceSlow', 'FinalRound',
  'HollowN', 'HeadStreak', 'CritFlash', 'EliteBlast', 'KillRush', 'KillTempo', 'Bulwark', 'SlideLaunch', 'EvolveSpeed', 'BladeHone',
  // the Descent's unlockable parts: status riders, handling, two-gun play, and body buffs that work with statuses and movement
  'StatusTime', 'Accelerant', 'BrittleCrit', 'WoundStagger', 'Contagion', 'Shatter', 'Conductor', 'BlastStun', 'HolsterReload', 'BankShot', 'Lodestone', 'Tether',
  'HeatSink', 'Splitter', 'Catalyst', 'Salvage', 'ChillGuard', 'BloodBank', 'HeatShield', 'GroundRod', 'FrostWake', 'EmberDash', 'SmokeStep', 'StaticLand',
  'RoomReserve', 'ReloadGuard', 'ScrapPick', 'ExtraSlot', 'Backlash', 'Decoy', 'KineticPlate', 'WallGuard', 'SwapGuard', 'LastStand', 'PartAmmo', 'Lantern',
  'Grapeshot', 'PinBolt', 'EchoHit', 'MarkHit', 'HollowCharge', 'StaticBuild'];

export const AFFIX = { Blazing: 0, Frozen: 1, Shielded: 2, Vampiric: 3, Splitting: 4, Hasted: 5, Armored: 6, Blinking: 7, Gilded: 8, Volatile: 9 };
export const ENEMY_CREATURES = DATA.enemies.map((e) => e.model || e.art);   // the Blight's sculpted creature (art stays the key bosses look kinds up by)
export const BOSS_CREATURES = DATA.bosses.map((b) => b.model || b.art);

export const TONICS = [
  { name: 'Vigor Tonic', desc: '+25 max health', base: 1500, step: 600, max: 8 },
  { name: "Bull's Blood", desc: '+10% damage', base: 2000, step: 800, max: 8 },
  { name: 'Quicksilver', desc: '+8% move speed', base: 1500, step: 600, max: 5 },
  { name: 'Deadeye Draught', desc: '+6% crit chance', base: 1800, step: 700, max: 6 },
  { name: 'Steady Hands', desc: '+10% fire rate and reload speed', base: 2000, step: 800, max: 6 },
  { name: 'Iron Tonic', desc: '+8 armor', base: 1800, step: 700, max: 6 },
  { name: 'Mule Kick', desc: 'Carry a third weapon', base: 4000, step: 0, max: 1 },
  { name: 'Feather Fizz', desc: '+1 mid-air jump and +1 dash charge', base: 3500, step: 3000, max: 2 },
];
export const SYMBOLS = ['CHERRY', 'BELL', 'BAR', 'SEVEN', 'CROWN', 'CLOVER', 'SKULL'];
export const VAULT_COST = [5000, 10000, 20000];
export const PICKUP_NAMES = { Clover: 'Four-Leaf Clover', MaxAmmo: 'MAX AMMO', InstaKill: 'INSTA-KILL', DoublePoints: 'DOUBLE MONEY', Nuke: 'NUKE', FireSale: 'HALF PRICE', MoneyBag: 'Money Bag' };

const rand = Math.random;
export const randInt = (a, b) => a + Math.floor(rand() * (b - a + 1));
export const frandRange = (a, b) => a + rand() * (b - a);

export const luckMult = () => 1;   // luck is gone from the game; the rounds decide how good the loot is
// The mystery box: Uncommon 55%, Rare 30%, Epic 11%, Legendary 4% with no luck; about 20% Legendary at the cap.
// The mystery box gets better as the rounds go by: Uncommon 55 / Rare 30 / Epic 11 / Legendary 4 at the start, about
// 37 / 32 / 19 / 12 by round twenty.
export function rollBoxRarity(round) {
  const M = 1 + 0.025 * Math.min(24, Math.max(0, round || 0)), W = [16, 55, 30 * M, 11 * M * M, 4 * M * M * M];   // every gun you have unlocked can come out, the plain ones less often
  let r = rand() * (W[0] + W[1] + W[2] + W[3] + W[4]);
  for (let i = 0; i < 5; i++) { r -= W[i]; if (r <= 0) return i; }
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
    DATA.upgrades.forEach((u, i) => { if (!u.cut && rarityIndex(u.rarity) === tier && (stacks[i] || 0) < u.stacks && !Meta.upgradeLocked(u.name)) pool.push(i); });
    if (rarity === 5) break;
  }
  return pool.length ? pool[randInt(0, pool.length - 1)] : -1;
}
export function rollWeaponOfRarity(rarity, exA, exB) {
  let pool = [];
  for (let tier = rarity; tier >= 0 && pool.length === 0; tier--) {
    for (let i = 0; i < DATA.weapons.length; i++) if (i !== exA && i !== exB && rarityIndex(DATA.weapons[i].rarity) === tier && !Meta.gunLocked(DATA.weapons[i].name)) pool.push(i);
  }
  return pool.length ? pool[randInt(0, pool.length - 1)] : 1;
}
// The level is 15 rounds. Difficulty formulas were written for 25, so they read an effective round that covers the same climb.
// Three difficulties. Nightmare is the game as it was tuned; Hard and Normal scale down from it.
//   hp: enemy health    slope: how fast rounds ramp (health, damage, tougher types)    count: enemies per round
//   alive: how many at once    dmg: damage you take    spawn: seconds between spawns (higher = slower)
export const DIFFS = [
  { name: 'Normal', hp: 0.8, slope: 1.0, count: 0.8, alive: 0.75, dmg: 0.65, spawn: 1.45, desc: 'Smaller hordes that hit for about two thirds and ramp up gently.' },
  { name: 'Hard', hp: 0.9, slope: 1.35, count: 0.9, alive: 0.88, dmg: 0.85, spawn: 1.2, desc: 'A real fight. Between the two.' },
  { name: 'Nightmare', hp: 1, slope: 1.7, count: 1, alive: 1, dmg: 1, spawn: 1, desc: 'Full hordes, full damage, the steepest climb.' },
];
// Challenge modifiers: handicaps a player switches on for extra renown. The ones in `f` bend the difficulty numbers;
// the others are read where they bite (money in addMoney, health in recompute).
export const MUTATORS = [
  { id: 'hides', name: 'Thick Hides', desc: 'Enemies have half again as much health.', xp: 0.25, f: { hp: 1.5 } },
  { id: 'blood', name: 'Bad Blood', desc: 'Everything hits you half again as hard.', xp: 0.25, f: { dmg: 1.5 } },
  { id: 'yard', name: 'The Whole Graveyard', desc: 'Bigger hordes, and more of them up at once.', xp: 0.25, f: { count: 1.4, alive: 1.3 } },
  { id: 'climb', name: 'Steep Climb', desc: 'Every round gets harder faster.', xp: 0.2, f: { slope: 1.3 } },
  { id: 'purse', name: 'Short Purse', desc: 'You earn 40% less money.', xp: 0.2, money: 0.6 },
  { id: 'jaw', name: 'Glass Jaw', desc: 'You have 40% less health.', xp: 0.2, health: 0.6 },
];
let DF = DIFFS[2], dfi = 2, mutMask = 0, dailyBonus = 0;
const rebuildDiff = () => { DF = Object.assign({}, DIFFS[dfi]); MUTATORS.forEach((M, i) => { if ((mutMask >> i) & 1 && M.f) for (const k in M.f) DF[k] *= M.f[k]; }); };
const mutProd = (key) => MUTATORS.reduce((a, M, i) => a * ((mutMask >> i) & 1 && M[key] ? M[key] : 1), 1);
export const setDifficulty = (i) => { dfi = Math.max(0, Math.min(2, i | 0)); rebuildDiff(); };
export const setMutators = (mask, daily = 0) => { mutMask = (mask | 0) & ((1 << MUTATORS.length) - 1); dailyBonus = daily ? 0.5 : 0; rebuildDiff(); };
export const mutators = () => mutMask;
export const mutMoney = () => mutProd('money');
export const mutHealth = () => mutProd('health');
export const mutXp = () => 1 + dailyBonus + MUTATORS.reduce((a, M, i) => a + ((mutMask >> i) & 1 ? M.xp : 0), 0);
export const difficulty = () => dfi;
export const diff = () => DF;
export const effRound = (r) => 1 + (Math.max(1, r) - 1) * DF.slope;
// Health of a basic enemy. Raised across the board (Normal x1.9, Hard x1.6, Nightmare x1.4 on what it was): a starter
// pistol now takes three body shots in round one, and a horde is something you work through rather than wipe.
export const zombieHealth = (r0) => { const r = effRound(r0); return 0.85 * DF.hp * (r < 10 ? 150 + 100 * (r - 1) : 950 * Math.pow(1.1, r - 9)); };
const oldCount = (x) => 1.05 * (x <= 5 ? 6 + (x - 1) * 4.5 : 24 + (x - 5) * 5);
// kill pay shrinks as the horde grows so a round is worth about what it was
export const payScale = (r) => Math.max(0.3, Math.min(2.2, oldCount(1 + (Math.max(1, r) - 1) * 1.25) / zombieCount(r)));   // what a round is worth climbs slowly, and the same on every difficulty   // a round pays the same on every difficulty: fewer enemies, more each
export const zombieCount = (r) => Math.round((14 + r * 5 + 0.35 * Math.pow(r, 2.35)) * DF.count);   // longer rounds from the start: 19 in round 1, 54 by round 5, 142 by 10, 292 in round 15 (Nightmare; Normal is 80% of that)  //   // a slow start: 11 in round 1, 34 by round 5, 107 by 10, 242 in round 15 (Nightmare)   // 15 in round 1, 65 by round 5, 178 by round 10, 345 in round 15
export const maxAlive = (r) => Math.max(8, Math.round(Math.min(64, 11 + r * 3.5) * DF.alive));
export const rarityPrice = (r) => [1000, 2000, 3500, 6000, 10000, 2500][r] || 1000;

// colour helpers: content colours are sRGB hex; the renderer works in sRGB directly
export const hexRGB = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
export const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const cssRGB = (c, a = 1) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;
// UE FLinearColor literals were linear; convert to sRGB for display
export const lin = (r, g, b) => [r, g, b].map((x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055));
