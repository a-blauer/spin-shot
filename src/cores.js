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
  G('Whetstone', 'Rare', '#ff73d9', 'EVO', [['EvolveSpeed', 0.25]], 'This gun evolves 25% faster', null, 'gold'),
  // ---- passives: yours as soon as you pick them up
  M('Vitality', 'Common', '#ff6a7a', 'HP', [['MaxHealth', 20]], '+20 max health'),
  M('Swiftness', 'Common', '#8ff0c0', 'SPD', [['MoveSpeed', 0.05]], '+5% move speed'),
  M('Bandolier Strap', 'Common', '#c9a56a', 'RSV', [['ReserveAmmo', 0.2]], '+20% reserve ammo'),
  M('Plating', 'Uncommon', '#aab4c0', 'ARM', [['Armor', 12]], 'Take about 10% less damage', null, 8),
  M('Mending', 'Uncommon', '#7dff8a', 'REG', [['HealthRegen', 1]], '+1 health per second'),
  M('Quick Step', 'Uncommon', '#7fb4ff', 'DSH', [['DashCooldown', 0.12]], 'Dash recharges 12% faster', null, 6),
  M('Lucky Find', 'Uncommon', '#7dff8a', 'LCK', [['LuckFind', 0.12]], 'Enemies drop parts 12% more often'),
  M('Barrier', 'Rare', '#7fd0ff', 'SHD', [], 'Kills give 8 shield', P('OnKill', 'Shield', 1, 8)),
  M('Spring Step', 'Rare', '#d0ff8a', 'JMP', [['ExtraJumps', 1]], '+1 air jump', null, 2),
  M('Second Wind', 'Epic', '#ffffff', '1UP', [['Revives', 1]], 'Get back up once when you would die', null, 2),
];

// One hand-drawn symbol per part, on a 24-unit square, in a single ink colour (`currentColor`); `var(--c)` is the part's own colour, for cut-outs.
export const CORE_SYM = {
 "Heavy Rounds": "<path d=\"M8.5 21v-9.5C8.5 7 12 2.5 12 2.5S15.5 7 15.5 11.5V21z\"/><rect x=\"7\" y=\"18\" width=\"10\" height=\"3.4\" rx=\".6\"/>",
 "Rapid Bolt": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 6l5 6-5 6\"/><path d=\"M10 6l5 6-5 6\"/><path d=\"M17 6l4 6-4 6\"/></g>",
 "Extended Mag": "<path d=\"M7 2.5h8.5l2.3 15.2-8.6 3.8z\"/><g stroke=\"#0000\" fill=\"none\"></g><path d=\"M8.2 7.5h8M8.9 11.5h8M9.6 15.5h7.6\" stroke=\"var(--c,#fff)\" stroke-width=\"1.3\" fill=\"none\"/>",
 "Quick Hands": "<path d=\"M12 4a8 8 0 1 0 7.6 10.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linecap=\"round\"/><path d=\"M12 .5l6 3.7-6 3.9z\"/>",
 "Keen Sight": "<circle cx=\"12\" cy=\"12\" r=\"7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\"/><path d=\"M12 1.5v6M12 16.5v6M1.5 12h6M16.5 12h6\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\"/><circle cx=\"12\" cy=\"12\" r=\"1.8\"/>",
 "Hollow Tip": "<path d=\"M12 1.5l2.6 7.9 7.9 2.6-7.9 2.6-2.6 7.9-2.6-7.9-7.9-2.6 7.9-2.6z\"/>",
 "Marksman Scope": "<circle cx=\"12\" cy=\"8\" r=\"5.5\"/><path d=\"M3.5 22c0-5 3.5-7.5 8.5-7.5s8.5 2.5 8.5 7.5z\"/><circle cx=\"12\" cy=\"8\" r=\"2\" fill=\"var(--c,#fff)\"/>",
 "Piercing Tip": "<rect x=\"10.3\" y=\"2\" width=\"3.4\" height=\"20\" rx=\"1\"/><path d=\"M1.5 12h14\" stroke=\"currentColor\" stroke-width=\"2.6\" stroke-linecap=\"round\"/><path d=\"M15.5 6.5l7 5.5-7 5.5z\"/>",
 "Feed Loop": "<path d=\"M12 12c-2-3.4-3.6-5-6-5a5 5 0 0 0 0 10c2.4 0 4-1.6 6-5s3.6-5 6-5a5 5 0 0 1 0 10c-2.4 0-4-1.6-6-5z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"3\" stroke-linejoin=\"round\"/>",
 "Incendiary": "<path d=\"M12.5 1.5c.5 4 5.5 6 5.5 12a6 6 0 0 1-12 0c0-2.4 1-4 2.5-5.5.2 2 1 3 2 3.5-.5-4 .5-7.5 2-10z\"/>",
 "Cryo Cell": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\"><path d=\"M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7\"/><path d=\"M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5\"/></g>",
 "Serrated": "<path d=\"M12 2s7 8.2 7 13a7 7 0 0 1-14 0c0-4.8 7-13 7-13z\"/>",
 "Split Barrel": "<g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 12h7\"/><path d=\"M10 12L20 4M10 12h11M10 12l10 8\"/></g><circle cx=\"21\" cy=\"4\" r=\"1.8\"/><circle cx=\"21.5\" cy=\"12\" r=\"1.8\"/><circle cx=\"21\" cy=\"20\" r=\"1.8\"/>",
 "Arc Coil": "<path d=\"M14 1.5L4.5 13.5h6L8.5 22.5 19.5 9.5h-6.5z\"/>",
 "Blast Cap": "<path d=\"M12 1l2.3 5.3 5-2.8-1.7 5.5 5.4 1-4.4 3.5 3.4 4.3-5.5-.3.2 5.5-4.7-3-4.7 3 .2-5.5-5.5.3 3.4-4.3L1 10l5.4-1L4.7 3.5l5 2.8z\"/><circle cx=\"12\" cy=\"11.8\" r=\"3\" fill=\"var(--c,#fff)\"/>",
 "Ricochet": "<path d=\"M2 5l8 13 5-9 4 5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M22.5 18.5l-6.5-.5 4.3-5z\"/><path d=\"M5 21.5h11\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/>",
 "Leech Rounds": "<path d=\"M12 21S3 15.5 3 9.2A4.7 4.7 0 0 1 12 7a4.7 4.7 0 0 1 9 2.2C21 15.5 12 21 12 21z\"/><path d=\"M12 8.5s3 3.3 3 5.3a3 3 0 0 1-6 0c0-2 3-5.3 3-5.3z\" fill=\"var(--c,#fff)\"/>",
 "Whetstone": "<path d=\"M12 2.5l8.5 9h-5v4.5h-7V11.5h-5z\"/><rect x=\"8.5\" y=\"17.5\" width=\"7\" height=\"2.2\"/><rect x=\"8.5\" y=\"20.6\" width=\"7\" height=\"1.4\"/>",
 "Gilded Rounds (old)": "<circle cx=\"12\" cy=\"12\" r=\"9.5\"/><path d=\"M14.8 8.8c-.6-1-1.6-1.5-2.8-1.5-1.7 0-2.9.9-2.9 2.3 0 3 5.9 1.5 5.9 4.7 0 1.4-1.3 2.4-3 2.4-1.4 0-2.5-.6-3.1-1.7M12 5.3v13.4\" fill=\"none\" stroke=\"var(--c,#fff)\" stroke-width=\"1.9\" stroke-linecap=\"round\"/>",
 "Vitality": "<path d=\"M12 21.5S2.5 15.5 2.5 8.8A5 5 0 0 1 12 6.5a5 5 0 0 1 9.5 2.3C21.5 15.5 12 21.5 12 21.5z\"/>",
 "Swiftness": "<path d=\"M9 3h7l-3 6h6L8.5 21.5l2-8.5H5z\" transform=\"rotate(20 12 12)\"/><path d=\"M1.5 8h4M1 12h3M2 16h4\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/>",
 "Bandolier Strap": "<g><path d=\"M4 21v-9c0-2.5 1.5-5 1.5-5S7 9.5 7 12v9z\"/><path d=\"M10.5 21v-9c0-2.5 1.5-5 1.5-5s1.5 2.5 1.5 5v9z\"/><path d=\"M17 21v-9c0-2.5 1.5-5 1.5-5S20 9.5 20 12v9z\"/></g><path d=\"M2 5.5l20-3\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\"/>",
 "Plating": "<path d=\"M12 1.5l8.5 3v6.5c0 5.5-3.7 9.5-8.5 11.5-4.8-2-8.5-6-8.5-11.5V4.5z\"/><path d=\"M12 5v14\" stroke=\"var(--c,#fff)\" stroke-width=\"1.6\"/>",
 "Mending": "<path d=\"M8.5 2.5h7v6h6v7h-6v6h-7v-6h-6v-7h6z\"/>",
 "Quick Step": "<path d=\"M11 4l10 8-10 8v-5H7V9h4z\"/><path d=\"M2 9v6M4.8 7.5v9\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/>",
 "Lucky Find": "<g><circle cx=\"8\" cy=\"8\" r=\"4.3\"/><circle cx=\"16\" cy=\"8\" r=\"4.3\"/><circle cx=\"8\" cy=\"15\" r=\"4.3\"/><circle cx=\"16\" cy=\"15\" r=\"4.3\"/></g><path d=\"M12 12c0 5-1 8 3 10.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\"/>",
 "Barrier": "<path d=\"M12 1.5l9 5.2v10.6l-9 5.2-9-5.2V6.7z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.6\" stroke-linejoin=\"round\"/><path d=\"M12 6.5l4.8 2.8v5.4L12 17.5l-4.8-2.8V9.3z\"/>",
 "Spring Step": "<path d=\"M12 1.5l8 8h-5v3.5H9V9.5H4z\"/><path d=\"M12 11l8 8h-5v3.5H9V19H4z\" opacity=\".75\"/>",
 "Second Wind": "<path d=\"M12 3a9 9 0 1 0 8.5 6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.6\" stroke-linecap=\"round\"/><path d=\"M12 .2l5.5 3-5.5 3.3z\"/><path d=\"M12 17.5s-5-3-5-6.3a2.7 2.7 0 0 1 5-1.3 2.7 2.7 0 0 1 5 1.3c0 3.3-5 6.3-5 6.3z\"/>"
};
export const coreSvg = (d, ink = '#14100e') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="color:${ink};--c:${d.hex}">${CORE_SYM[d.name] || ''}</svg>`;
export const CORE0 = DATA.upgrades.length;
for (const d of CORE_DEFS) DATA.upgrades.push({ stacks: 99, trigger: null, fx: null, chance: 0, mag: 0, cd: 0, insp: '', suit: 'None', ...d, core: true, cut: true });
export const isCore = (i) => i >= CORE0 && i < CORE0 + CORE_DEFS.length;
export const coreKind = (i) => (isCore(i) ? DATA.upgrades[i].kind : null);
const TIER = { Common: 0, Uncommon: 1, Rare: 2, Epic: 3 };
// a random part no rarer than `cap` (0 common .. 3 epic); `have` (stacks by index) keeps capped passives from turning up again
// a part of exactly this rarity (0..3), not one of `skip`, falling back to any rarity below it
export function rollCoreAt(t, skip = null, have = null) {
  for (; t >= 0; t--) { const pool = []; CORE_DEFS.forEach((d, k) => { const i = CORE0 + k; if (TIER[d.rarity] === t && !(skip && skip.has(i)) && !(have && d.kind === 'me' && (have[i] || 0) >= DATA.upgrades[i].stacks)) pool.push(i); }); if (pool.length) return pool[Math.floor(Math.random() * pool.length)]; }
  return CORE0;
}
export const coreTier = (i) => TIER[DATA.upgrades[i].rarity] || 0;
export function rollCore(cap, have = null, skip = null) {
  const W = [[100], [58, 42], [46, 36, 18], [40, 34, 20, 6]][Math.max(0, Math.min(3, cap))];
  let r = Math.random() * 100, t = 0; for (let q = 0; q < W.length; q++) { r -= W[q]; if (r <= 0) { t = q; break; } }
  for (; t >= 0; t--) {
    const pool = []; CORE_DEFS.forEach((d, k) => { const i = CORE0 + k; if (TIER[d.rarity] === t && !(skip && skip.has(i)) && !(have && d.kind === 'me' && (have[i] || 0) >= DATA.upgrades[i].stacks)) pool.push(i); });
    if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  }
  return CORE0;
}
