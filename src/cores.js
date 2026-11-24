// The Descent's own buffs: a short list of parts, each one doing one plain thing, that you stack.
// A gun part goes into your pack and is fitted to a weapon at the workbench (as many of the same part as the gun has room
// for). A passive works on you the moment you pick it up. They are ordinary upgrades underneath, so everything that reads
// stats and sets off effects already understands them; they are simply never offered by chests.
import { DATA } from './data.js';

const G = (name, rarity, hex, glyph, mods, desc, proc = null, look = '') => ({ name, rarity, hex, glyph, mods, desc, look, kind: 'gun', ...(proc || {}) });
const M = (name, rarity, hex, glyph, mods, desc, proc = null, stacks = 99) => ({ name, rarity, hex, glyph, mods, desc, kind: 'me', stacks, ...(proc || {}) });
const P = (trigger, fx, chance, mag, cd = 0) => ({ trigger, fx, chance, mag, cd });

export const CORE_DEFS = [
  // ---- gun parts
  G('Heavy Rounds', 'Common', '#ffb057', 'DMG', [['Damage', 0.15]], '+15% damage', null, 'brake'),
  G('Rapid Bolt', 'Common', '#6fd6ff', 'ROF', [['FireRate', 0.12]], '+12% fire rate', null, 'fins'),
  G('Extended Mag', 'Common', '#b9c2cc', 'MAG', [['MagSize', 0.25]], '+25% magazine', null, 'mag'),
  G('Quick Hands', 'Common', '#ffe36a', 'RLD', [['ReloadSpeed', 0.2]], '+20% reload speed', null, 'tape'),
  G('Keen Sight', 'Uncommon', '#ff6a6a', 'CRT', [['CritChance', 0.08]], '+8% crit chance', null, 'dot'),
  G('Hollow Tip', 'Uncommon', '#ff4d8a', 'CRX', [['CritDamage', 0.3]], '+30% crit damage', null, 'tip'),
  G('Marksman Scope', 'Uncommon', '#9ad0ff', 'HED', [['HeadshotDamage', 0.25]], '+25% headshot damage', null, 'scope'),
  G('Piercing Tip', 'Uncommon', '#e8eef5', 'PRC', [['Pierce', 1]], 'Shots pass through 1 more enemy', null, 'needle'),
  G('Feed Loop', 'Uncommon', '#8fe08a', 'AMO', [['AmmoSave', 0.1]], '10% of shots cost no ammo', null, 'belt'),
  G('Incendiary', 'Uncommon', '#ff7a1a', 'FIR', [], '20% chance to set the target on fire', P('OnHit', 'Ignite', 0.2, 0.5), 'fire'),
  G('Cryo Cell', 'Uncommon', '#7fd8ff', 'ICE', [], '20% chance to chill and slow the target', P('OnHit', 'Freeze', 0.2, 0.5), 'frost'),
  G('Serrated', 'Uncommon', '#d0252a', 'BLD', [], '20% chance to make the target bleed', P('OnHit', 'Bleed', 0.2, 0.8), 'blood'),
  G('Split Barrel', 'Rare', '#ffd24d', 'x2', [['Multishot', 1], ['Spread', 0.12]], '+1 projectile at half damage', null, 'barrel'),
  G('Arc Coil', 'Rare', '#9a8cff', 'ARC', [], '15% chance for lightning to jump to nearby enemies', P('OnHit', 'Chain', 0.15, 0.4), 'shock'),
  G('Blast Cap', 'Rare', '#ff5a3a', 'EXP', [], '10% chance for a hit to explode', P('OnHit', 'Explode', 0.1, 1.0), 'blast'),
  G('Ricochet', 'Rare', '#cfd6de', 'RIC', [['Ricochet', 1]], 'Shots bounce to 1 more enemy', null, 'chrome'),
  G('Leech Rounds', 'Rare', '#c8306a', 'LCH', [['Lifesteal', 0.02]], 'Heal for 2% of damage dealt', null, 'vial'),
  G('Gilded Rounds', 'Rare', '#ffd23a', '$', [], '20% chance for a hit to pay out', P('OnHit', 'Money', 0.2, 6), 'gold'),
  // ---- passives: yours as soon as you pick them up
  M('Vitality', 'Common', '#ff6a7a', 'HP', [['MaxHealth', 20]], '+20 max health'),
  M('Swiftness', 'Common', '#8ff0c0', 'SPD', [['MoveSpeed', 0.05]], '+5% move speed'),
  M('Bandolier Strap', 'Common', '#c9a56a', 'RSV', [['ReserveAmmo', 0.2]], '+20% reserve ammo'),
  M('Plating', 'Uncommon', '#aab4c0', 'ARM', [['Armor', 12]], 'Take about 10% less damage', null, 8),
  M('Mending', 'Uncommon', '#7dff8a', 'REG', [['HealthRegen', 1]], '+1 health per second'),
  M('Quick Step', 'Uncommon', '#7fb4ff', 'DSH', [['DashCooldown', 0.12]], 'Dash recharges 12% faster', null, 6),
  M('Fortune', 'Uncommon', '#ffd23a', '$$', [['MoneyGain', 0.1]], '+10% money'),
  M('Barrier', 'Rare', '#7fd0ff', 'SHD', [], 'Kills give 8 shield', P('OnKill', 'Shield', 1, 8)),
  M('Spring Step', 'Rare', '#d0ff8a', 'JMP', [['ExtraJumps', 1]], '+1 air jump', null, 2),
  M('Second Wind', 'Epic', '#ffffff', '1UP', [['Revives', 1]], 'Get back up once when you would die', null, 2),
];

export const CORE0 = DATA.upgrades.length;
for (const d of CORE_DEFS) DATA.upgrades.push({ stacks: 99, trigger: null, fx: null, chance: 0, mag: 0, cd: 0, insp: '', suit: 'None', ...d, core: true, cut: true });
export const isCore = (i) => i >= CORE0 && i < CORE0 + CORE_DEFS.length;
export const coreKind = (i) => (isCore(i) ? DATA.upgrades[i].kind : null);
const TIER = { Common: 0, Uncommon: 1, Rare: 2, Epic: 3 };
// a random part no rarer than `cap` (0 common .. 3 epic); `have` (stacks by index) keeps capped passives from turning up again
export function rollCore(cap, have = null) {
  const W = [[100], [58, 42], [46, 36, 18], [40, 34, 20, 6]][Math.max(0, Math.min(3, cap))];
  let r = Math.random() * 100, t = 0; for (let q = 0; q < W.length; q++) { r -= W[q]; if (r <= 0) { t = q; break; } }
  for (; t >= 0; t--) {
    const pool = []; CORE_DEFS.forEach((d, k) => { const i = CORE0 + k; if (TIER[d.rarity] === t && !(have && d.kind === 'me' && (have[i] || 0) >= DATA.upgrades[i].stacks)) pool.push(i); });
    if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  }
  return CORE0;
}
