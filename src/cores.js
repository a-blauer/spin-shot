// The Descent's own buffs: a short list of parts, each one doing one plain thing, that you stack.
// A gun part goes into your pack and is fitted to a weapon at the workbench (as many of the same part as the gun has room
// for). A passive works on you the moment you pick it up. They are ordinary upgrades underneath, so everything that reads
// stats and sets off effects already understands them; they are simply never offered by chests.
import { DATA } from './data.js';
import { Meta } from './meta.js';

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
  // ---- unlocked by rank (see RANKS in meta.js): status riders, handling and two-gun play
  G('Lingering', 'Uncommon', '#c9a0ff', 'DUR', [['StatusTime', 0.5]], 'Statuses this gun applies last 50% longer', null, 'tip'),
  G('Accelerant', 'Uncommon', '#ff9a2a', 'ACC', [['Accelerant', 1]], 'Hits on a burning enemy spread a short burn to anything touching it', null, 'fire'),
  G('Brittle Rounds', 'Uncommon', '#bfe8ff', 'BRT', [['BrittleCrit', 0.15]], '+15% crit chance against chilled enemies', null, 'frost'),
  G('Open Wound', 'Uncommon', '#e0405a', 'WND', [['WoundStagger', 1]], 'Hits on a bleeding enemy stagger it for a moment', null, 'blood'),
  G('Contagion', 'Rare', '#9ee05a', 'CTG', [['Contagion', 1]], 'An enemy that dies carrying a status passes it to the nearest enemy', null, 'vial'),
  G('Shatter', 'Rare', '#8ae0ff', 'SHT', [['Shatter', 1]], 'Enemies that die chilled burst, chilling everything nearby', null, 'frost'),
  G('Conductor', 'Rare', '#b0a0ff', 'CND', [['Conductor', 1]], 'Lightning from this gun jumps once more and carries the target\'s burn and bleed with it', null, 'shock'),
  G('Steady Barrel', 'Common', '#d8d0c0', 'STD', [['Spread', -0.25]], '25% tighter spread', null, 'barrel'),
  G('Concussive', 'Common', '#e8b870', 'CNC', [['Knockback', 0.3], ['BlastStun', 0.6]], '+30% knockback, and blasts knock ordinary enemies down', null, 'blast'),
  G('Holster Loader', 'Uncommon', '#c8b088', 'HLS', [['HolsterReload', 1]], 'This gun reloads itself while it is holstered', null, 'tape'),
  G('Bank Shot', 'Uncommon', '#e8e0d0', 'BNK', [['BankShot', 1]], 'A shot that hits a wall bounces once toward the nearest enemy', null, 'chrome'),
  G('Lodestone', 'Uncommon', '#a8a8c0', 'LOD', [['Lodestone', 1]], 'Hits stick a charge in the enemy; the 4th on the same enemy detonates them all', null, 'blast'),
  G('Tether', 'Rare', '#c0e0ff', 'TTH', [['Tether', 0.25]], 'Hits tie the target to the nearest other enemy for 3 seconds: each takes 25% of what the other takes', null, 'shock'),
  G('Undertow', 'Rare', '#5a8aff', 'UND', [], '8% chance on hit: a pull drags nearby enemies onto the target for 1.5 seconds', P('OnHit', 'Undertow', 0.08, 0), 'shock'),
  G('Heat Sink', 'Uncommon', '#ff7a5a', 'SNK', [['HeatSink', 0.2]], 'Each status this gun applies takes 0.2s off your class ability', null, 'gold'),
  G('Splitter', 'Rare', '#ffd27a', 'SPL', [['Splitter', 1]], 'A shot that kills splits into 2 smaller shots that seek enemies nearby', null, 'barrel'),
  G('Catalyst', 'Uncommon', '#ff8cff', 'CAT', [['Catalyst', 1]], 'Kills on an enemy carrying 2 or more statuses count double toward evolving this gun', null, 'gold'),
  // ---- unlocked by challenges (see ACHIEVEMENTS in meta.js): each plays off something you already do
  G('Grapeshot', 'Uncommon', '#c9b08a', 'GRP', [['Grapeshot', 0.12]], '12% chance a hit bursts into 3 shards that strike enemies nearby for 30%', null, 'needle'),
  G('Pinning Bolt', 'Uncommon', '#b0b8c8', 'PIN', [['PinBolt', 1]], 'Hits on an enemy within 1.5 m of a wall pin it there for 0.8 s', null, 'chrome'),
  G('Echo Chamber', 'Rare', '#8fd0ff', 'ECH', [['EchoHit', 0.5]], 'Every 6th hit on the same enemy rings again 0.4 s later for 50%', null, 'scope'),
  G('Death Mark', 'Rare', '#ff4a6a', 'MRK', [['MarkHit', 0.1]], '10% chance to mark the target: it takes 25% more damage from you for 4 s', null, 'blood'),
  G('Hollow Charge', 'Rare', '#ff8a3a', 'HCH', [['HollowCharge', 0.35]], 'Hits on a stunned or pinned enemy burst for 35% around it', null, 'blast'),
  G('Static Build', 'Rare', '#b8a8ff', 'STB', [['StaticBuild', 1]], 'Every 8 hits on the same enemy discharge lightning that jumps to 3 more for 60%', null, 'shock'),
  G('Salvage Rounds', 'Common', '#9affc0', 'SLV', [['Salvage', 0.1]], 'Kills with this gun have a 10% chance to give 1 scrap', null, 'belt'),
  // ---- unlocked by rank: body buffs that lean on statuses, movement and the machines
  M('Cold Comfort', 'Uncommon', '#a8e4ff', 'CLD', [['ChillGuard', 0.3]], 'Chilled enemies deal 30% less damage to you', null, 2),
  M('Bloodbank', 'Uncommon', '#d0304a', 'BBK', [['BloodBank', 1]], 'Each bleeding enemy within 5 m heals you 1 health a second (up to 3)', null, 3),
  M('Heat Shield', 'Uncommon', '#ff8a3a', 'HTS', [['HeatShield', 2]], 'Each burning enemy within 6 m gives you 2 shield a second', null, 3),
  M('Grounding Rod', 'Rare', '#b8a8ff', 'GRD', [['GroundRod', 0.1]], 'A shocked enemy cannot take more than 10% of your max health in one hit', null, 1),
  M('Frost Wake', 'Common', '#c8f0ff', 'FWK', [['FrostWake', 1]], 'Sliding chills the enemies you pass', null, 1),
  M('Ember Dash', 'Uncommon', '#ff6a2a', 'EDS', [['EmberDash', 1]], 'Dashing leaves a short line of fire behind you', null, 1),
  M('Smoke Step', 'Uncommon', '#a0a0a8', 'SMK', [['SmokeStep', 1]], 'Dashing drops a smoke cloud; enemies inside lose track of you for 2 seconds', null, 1),
  M('Static Landing', 'Rare', '#9a8cff', 'STL', [['StaticLand', 1]], 'Landing from a mid-air jump or a wall-run shocks the enemies near you', null, 1),
  M('Quartermaster', 'Uncommon', '#c9a56a', 'QMS', [['RoomReserve', 0.3]], 'Clearing a room refills 90% of every gun\'s reserve', null, 2),
  M('Brace', 'Uncommon', '#aab4c0', 'BRC', [['ReloadGuard', 0.3]], 'Take 30% less damage while reloading', null, 1),
  M('Scrap Magnet', 'Common', '#9affc0', 'MAG', [['ScrapPick', 1]], 'Every part you pick up also gives 1 scrap', null, 3),
  M('Pack Mule', 'Epic', '#d8a050', 'MUL', [['ExtraSlot', 1]], 'Carry one more gun', null, 1),
  M('Backlash', 'Uncommon', '#ff9a6a', 'BKL', [['Backlash', 1]], 'An enemy that hits you catches the element of the gun in your hands', null, 1),
  M('Decoy', 'Uncommon', '#e8d0a0', 'DCY', [['Decoy', 1]], 'Dashing leaves a decoy that enemies chase for 2 seconds', null, 1),
  M('Kinetic Plating', 'Uncommon', '#8ab0d0', 'KIN', [['KineticPlate', 1]], 'Each dash stores a charge (up to 2); the next hit you take is 40% smaller for each', null, 1),
  M('Wall Runner', 'Rare', '#d0ff8a', 'WLR', [['WallRunTime', 1.5], ['WallGuard', 0.4]], 'Wall-runs last much longer, and you take 40% less damage on a wall', null, 1),
  M('Quick Swap', 'Uncommon', '#ffe36a', 'SWP', [['SwapGuard', 1]], 'Swapping guns gives a second of 50% less damage, and the next hit sets its parts off twice as often', null, 1),
  M('Last Stand', 'Rare', '#ff5a5a', 'LST', [['LastStand', 1]], 'Dropping under 30% health slows everything near you by half for 3 seconds (60s cooldown)', null, 1),
  M('Scavenger', 'Common', '#e0c080', 'SCV', [['PartAmmo', 0.25]], 'Picking up a part refills 25% of your current gun\'s magazine', null, 2),
  M('Lantern', 'Uncommon', '#ffd87a', 'LTN', [['Lantern', 0.2]], 'Enemies within 4 m that carry any status are slowed a further 20%', null, 1),
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
// the character buffs no longer drop and cannot be made: class levels (meta.js) took their place. They stay defined, so
// saves and old references still resolve.
for (const d of CORE_DEFS) if (d.kind === 'me') d.noDrop = true;


// ---- the Compressor. Two of the same gun part pressed into one, half as strong again: its numbers, its chance, its text.
// A count (pierce, bounce, projectiles) rounds up. Pressed parts never drop and cannot be pressed again.
export const PRESS = 1.5;
const INT = new Set(['Pierce', 'Multishot', 'Ricochet']);
const scaleNum = (v, k) => { const x = Math.round(v * k * 100) / 100; return String(x); };
const scaleText = (t, k) => t.replace(/(\d+(?:\.\d+)?)/g, (m) => scaleNum(parseFloat(m), k));
const PRESSED_TEXT = { 'Piercing Tip': 'Shots pass through 2 more enemies', Ricochet: 'Shots bounce to 2 more enemies', 'Split Barrel': '+2 projectiles at half damage' };
for (const d of CORE_DEFS.slice()) {
  if (d.kind !== 'gun') continue;
  const mods = d.mods.map(([k, v]) => [k, INT.has(k) ? Math.ceil(v * PRESS) : v * PRESS]);
  const proc = d.trigger ? { trigger: d.trigger, fx: d.fx, chance: Math.min(1, d.chance * PRESS), mag: d.mag, cd: d.cd || 0 } : null;
  CORE_DEFS.push(G('Pressed ' + d.name, d.rarity, d.hex, d.glyph, mods, PRESSED_TEXT[d.name] || scaleText(d.desc, PRESS), proc, d.look));
  Object.assign(CORE_DEFS[CORE_DEFS.length - 1], { pressed: d.name, noDrop: true });
}
// ---- Compressor: Fusion. Two different elemental parts fused: both elements at once, and something neither does alone.
export const ELEMENT = { Incendiary: 'fire', 'Cryo Cell': 'ice', Serrated: 'blood', 'Arc Coil': 'shock' };
export const FUSIONS = [
  { a: 'fire', b: 'ice', name: 'Steam Vent', hex: '#e8e4ff', glyph: 'STM', desc: '20% chance on hit: a cloud of scalding steam bursts from the target, burning and slowing everything in it for 3 seconds' },
  { a: 'fire', b: 'shock', name: 'Plasma Arc', hex: '#ff9a3a', glyph: 'PLS', desc: '20% chance on hit: lightning leaps to 3 enemies nearby and sets each of them alight' },
  { a: 'fire', b: 'blood', name: 'Boiling Blood', hex: '#ff4a2a', glyph: 'BOL', desc: '20% chance to burn and bleed the target. If it dies within 4 seconds it bursts, setting everything near it alight' },
  { a: 'ice', b: 'shock', name: 'Storm Cloud', hex: '#8ab8ff', glyph: 'STR', desc: '20% chance on hit: a storm cloud hangs over the target for 4 seconds, chilling everything under it and striking it with lightning' },
  { a: 'ice', b: 'blood', name: 'Black Ice', hex: '#9ad8e8', glyph: 'BLK', desc: '20% chance to bleed and chill the target. Chilled, it bleeds twice as fast, and when it dies it shatters and chills what is near' },
  { a: 'shock', b: 'blood', name: 'Hemorrhage', hex: '#d0306a', glyph: 'HEM', desc: '20% chance on hit: lightning arcs to 2 enemies nearby, and everything it touches bleeds' },
];
for (const F of FUSIONS) { CORE_DEFS.push(G(F.name, 'Epic', F.hex, F.glyph, [], F.desc, P('OnHit', 'Fuse', 0.2, 0.5), 'fuse')); Object.assign(CORE_DEFS[CORE_DEFS.length - 1], { fuse: F.a + '+' + F.b, noDrop: true }); }
export const fusionOf = (n1, n2) => { const base = (n) => n.replace(/^Pressed /, ''), a = ELEMENT[base(n1)], b = ELEMENT[base(n2)]; if (!a || !b || a === b) return null; return FUSIONS.find((F) => (F.a === a && F.b === b) || (F.a === b && F.b === a)) || null; };

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

{ const K = {"Lingering": "<path d=\"M6 2h12v3.5l-4.6 6.5 4.6 6.5V22H6v-3.5l4.6-6.5L6 5.5z\"/>", "Accelerant": "@Incendiary|<circle cx=\"20\" cy=\"5\" r=\"2.2\"/><circle cx=\"21.5\" cy=\"11\" r=\"1.6\"/><circle cx=\"3\" cy=\"7\" r=\"1.6\"/>", "Brittle Rounds": "@Cryo Cell|<path d=\"M14 2l-3 6 4 3-3 6\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke=\"var(--c,#fff)\"/>", "Open Wound": "@Serrated|<path d=\"M7 9l10 9\" stroke=\"var(--c,#fff)\" stroke-width=\"2.4\"/>", "Contagion": "<circle cx=\"12\" cy=\"6.5\" r=\"4.2\"/><circle cx=\"5.5\" cy=\"17\" r=\"4.2\"/><circle cx=\"18.5\" cy=\"17\" r=\"4.2\"/><path d=\"M12 6.5L5.5 17h13z\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>", "Shatter": "<path d=\"M12 1l3 7-3 3-3-3z\"/><path d=\"M3 10l6 1 1 4-6 2z\"/><path d=\"M21 10l-6 1-1 4 6 2z\"/><path d=\"M10 17h4l1 6H9z\"/>", "Conductor": "@Arc Coil|<path d=\"M19 2l-3 5h3l-3 5\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"/>", "Steady Barrel": "<circle cx=\"12\" cy=\"12\" r=\"8\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M12 1v7M12 16v7M1 12h7M16 12h7\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"12\" cy=\"12\" r=\"1.8\"/>", "Concussive": "<circle cx=\"6\" cy=\"12\" r=\"3.5\"/><path d=\"M11 6a8 8 0 0 1 0 12M15 3a12 12 0 0 1 0 18M19 1a15 15 0 0 1 0 22\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>", "Holster Loader": "<path d=\"M6 2h12v5l-2.5 15h-7L6 7z\"/><rect x=\"10.5\" y=\"9\" width=\"3\" height=\"7\" rx=\"1\" fill=\"var(--c,#fff)\"/>", "Bank Shot": "<path d=\"M2 21h20\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M4 4l8 15 8-15\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M17 3l3 1-1 3\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>", "Lodestone": "<path d=\"M5 3v9a7 7 0 0 0 14 0V3h-4.5v9a2.5 2.5 0 0 1-5 0V3z\"/><rect x=\"5\" y=\"3\" width=\"4.5\" height=\"3.5\" fill=\"var(--c,#fff)\"/><rect x=\"14.5\" y=\"3\" width=\"4.5\" height=\"3.5\" fill=\"var(--c,#fff)\"/>", "Tether": "<circle cx=\"5\" cy=\"17\" r=\"4\"/><circle cx=\"19\" cy=\"7\" r=\"4\"/><path d=\"M8 15c3-1 2-6 5-7s3 0 3 0\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>", "Undertow": "<path d=\"M12 12m-1 0a1 1 0 1 1 2 0a3 3 0 1 1-6 0a5.5 5.5 0 1 1 11 0a8 8 0 1 1-16 0\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>", "Heat Sink": "<rect x=\"3\" y=\"17\" width=\"18\" height=\"4\"/><rect x=\"4\" y=\"4\" width=\"2.8\" height=\"13\"/><rect x=\"8.4\" y=\"4\" width=\"2.8\" height=\"13\"/><rect x=\"12.8\" y=\"4\" width=\"2.8\" height=\"13\"/><rect x=\"17.2\" y=\"4\" width=\"2.8\" height=\"13\"/>", "Splitter": "<path d=\"M2 12h8\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M10 12l9-7M10 12l9 7\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"20\" cy=\"5\" r=\"2.4\"/><circle cx=\"20\" cy=\"19\" r=\"2.4\"/><circle cx=\"10\" cy=\"12\" r=\"2.6\"/>", "Catalyst": "<path d=\"M9 2h6v2h-1v5l6 10a2 2 0 0 1-2 3H6a2 2 0 0 1-2-3l6-10V4H9z\"/><path d=\"M7.5 16h9\" stroke=\"var(--c,#fff)\" stroke-width=\"2\"/>", "Salvage Rounds": "<path d=\"M12 2l2 3 3.5-1 .5 3.5 3.5 1-1.5 3.3L22 15l-3.3 1.4.3 3.6-3.6-.4L14 22l-2-3-2 3-1.4-2.4-3.6.4.3-3.6L2 15l1.9-2.2L2.4 9.5 6 8.5l.5-3.5L10 6z\"/><circle cx=\"12\" cy=\"12\" r=\"3.5\" fill=\"var(--c,#fff)\"/>", "Cold Comfort": "@Cryo Cell|<circle cx=\"19\" cy=\"19\" r=\"4\" fill=\"var(--c,#fff)\"/>", "Bloodbank": "@Serrated|<path d=\"M12 11v7M8.5 14.5h7\" stroke=\"var(--c,#fff)\" stroke-width=\"2.4\"/>", "Heat Shield": "<path d=\"M12 1.5l8.5 3v6.5c0 5.5-3.7 9.5-8.5 11.5-4.8-2-8.5-6-8.5-11.5V4.5z\"/><path d=\"M12.3 6c.3 2 3 3 3 6.5a3.3 3.3 0 0 1-6.6 0c0-1.4.6-2.3 1.4-3.1.1 1.2.6 1.7 1.1 2-.3-2.3.3-4.2 1.1-5.4z\" fill=\"var(--c,#fff)\"/>", "Grounding Rod": "<rect x=\"10.5\" y=\"1.5\" width=\"3\" height=\"14\"/><path d=\"M4 16h16M7 19.5h10M10 23h4\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>", "Frost Wake": "<path d=\"M2 17c3-3 5 3 8 0s5 3 8 0 4 1 4 1\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M14 2v9M10 4l8 5M10 9l8-5\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"/>", "Ember Dash": "<path d=\"M3 12h10M3 7h6M3 17h6\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M13 5l9 7-9 7z\"/>", "Smoke Step": "<path d=\"M6 19a4 4 0 0 1-.5-8 6 6 0 0 1 11.5-2 4.5 4.5 0 0 1 1 9z\"/>", "Static Landing": "<path d=\"M12 1v11M7 8l5 5 5-5\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M2 21l4-5 3 3 3-4 3 4 3-3 4 5\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"/>", "Quartermaster": "<rect x=\"2.5\" y=\"7\" width=\"19\" height=\"14\" rx=\"1\"/><path d=\"M2.5 11h19\" stroke=\"var(--c,#fff)\" stroke-width=\"1.6\"/><path d=\"M8 3h8l2 4H6z\"/>", "Brace": "<path d=\"M12 1.5l8.5 3v6.5c0 5.5-3.7 9.5-8.5 11.5-4.8-2-8.5-6-8.5-11.5V4.5z\"/><path d=\"M10.5 18V10c0-1.5 1.5-3.5 1.5-3.5s1.5 2 1.5 3.5v8z\" fill=\"var(--c,#fff)\"/>", "Scrap Magnet": "@Lodestone|", "Pack Mule": "<path d=\"M4 9h16l-1.5 13h-13z\"/><path d=\"M8 9V6a4 4 0 0 1 8 0v3\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M9 14h6\" stroke=\"var(--c,#fff)\" stroke-width=\"2\"/>", "Backlash": "<path d=\"M20 5H8a5 5 0 0 0 0 10h9\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M15 11l4 4-4 4\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"21\" cy=\"5\" r=\"2\"/>", "Decoy": "<circle cx=\"12\" cy=\"5\" r=\"3.5\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M6 22v-7a6 6 0 0 1 12 0v7\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-dasharray=\"3 2\"/>", "Kinetic Plating": "<rect x=\"3\" y=\"3\" width=\"18\" height=\"5\" rx=\"1\"/><rect x=\"3\" y=\"10\" width=\"18\" height=\"5\" rx=\"1\"/><path d=\"M3 19.5h18\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>", "Wall Runner": "<rect x=\"17\" y=\"1\" width=\"5\" height=\"22\"/><path d=\"M4 20l4-5M8 14l4-5M11 8l4-5\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>", "Quick Swap": "<path d=\"M4 9h14l-4-4M20 15H6l4 4\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>", "Last Stand": "<path d=\"M6 2h12v3.5l-4.6 6.5 4.6 6.5V22H6v-3.5l4.6-6.5L6 5.5z\"/><path d=\"M12 17.5s-3-1.8-3-3.8a1.6 1.6 0 0 1 3-.8 1.6 1.6 0 0 1 3 .8c0 2-3 3.8-3 3.8z\" fill=\"var(--c,#fff)\"/>", "Scavenger": "<path d=\"M8.5 21v-9.5C8.5 7 12 2.5 12 2.5S15.5 7 15.5 11.5V21z\"/><path d=\"M18 5v6M15 8h6\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"/>", "Grapeshot": "<circle cx=\"7\" cy=\"8\" r=\"3\"/><circle cx=\"16\" cy=\"6\" r=\"2.4\"/><circle cx=\"17\" cy=\"16\" r=\"3.2\"/><circle cx=\"8\" cy=\"18\" r=\"2.2\"/><circle cx=\"12.2\" cy=\"12\" r=\"1.6\" fill=\"var(--c,#fff)\"/>", "Pinning Bolt": "<path d=\"M2 3h4v18H2z\"/><path d=\"M6 11h11l-2.5-2.5L16 7l5 5-5 5-1.5-1.5L17 13H6z\"/>", "Echo Chamber": "<circle cx=\"7\" cy=\"12\" r=\"3\"/><path d=\"M12 6.5a7 7 0 0 1 0 11M15.5 3.5a11 11 0 0 1 0 17\" stroke=\"currentColor\" fill=\"none\" stroke-width=\"2.4\" stroke-linecap=\"round\"/>", "Death Mark": "<path d=\"M12 2a8 8 0 0 0-5 14.2V20h3v-2h4v2h3v-3.8A8 8 0 0 0 12 2z\"/><circle cx=\"9\" cy=\"10\" r=\"1.9\" fill=\"var(--c,#fff)\"/><circle cx=\"15\" cy=\"10\" r=\"1.9\" fill=\"var(--c,#fff)\"/>", "Hollow Charge": "<path d=\"M12 2l2.6 5.6L20 6l-2 5.6L22 15l-5.6.8L15 22l-3-4.6L9 22l-1.4-6.2L2 15l4-3.4L4 6l5.4 1.6z\"/><circle cx=\"12\" cy=\"12.5\" r=\"3\" fill=\"var(--c,#fff)\"/>", "Static Build": "<path d=\"M3 21h4v-4H3zM8 21h4v-8H8zM13 21h4V9h-4z\"/><path d=\"M19 2l-3 6h3l-2 5 5-7h-3l2-4z\" fill=\"var(--c,#fff)\"/>", "Lantern": "<path d=\"M9 2h6v2h-6z\"/><path d=\"M7 5h10l1 4v9l-1 3H7l-1-3V9z\"/><path d=\"M12 9.5c.8 1.5 2 2.3 2 4a2 2 0 0 1-4 0c0-1.7 1.2-2.5 2-4z\" fill=\"var(--c,#fff)\"/>"};
  for (const n in K) { const v = K[n]; if (v[0] === '@') { const [b, extra] = v.slice(1).split('|'); CORE_SYM[n] = `<g transform="translate(1.5 1.5) scale(.86)">${CORE_SYM[b] || ''}</g>` + extra; } else CORE_SYM[n] = v; } }
for (const d of CORE_DEFS) if (d.pressed) CORE_SYM[d.name] = CORE_SYM[d.pressed] + '<path d="M2 23h20" stroke="currentColor" stroke-width="2.2"/><path d="M2 1h20" stroke="currentColor" stroke-width="2.2"/>';
{ const E = { fire: 'Incendiary', ice: 'Cryo Cell', blood: 'Serrated', shock: 'Arc Coil' };
  for (const F of FUSIONS) CORE_SYM[F.name] = `<g transform="translate(0 4) scale(.62)">${CORE_SYM[E[F.a]]}</g><g transform="translate(9.1 4) scale(.62)">${CORE_SYM[E[F.b]]}</g>`; }
export const coreSvg = (d, ink = '#14100e') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="color:${ink};--c:${d.hex}">${CORE_SYM[d.name] || ''}</svg>`;
export const CORE0 = DATA.upgrades.length;
for (const d of CORE_DEFS) DATA.upgrades.push({ stacks: 99, trigger: null, fx: null, chance: 0, mag: 0, cd: 0, insp: '', suit: 'None', ...d, core: true, cut: true });
export const isCore = (i) => i >= CORE0 && i < CORE0 + CORE_DEFS.length;
export const coreKind = (i) => (isCore(i) ? DATA.upgrades[i].kind : null);
const TIER = { Common: 0, Uncommon: 1, Rare: 2, Epic: 3 };
// a random part no rarer than `cap` (0 common .. 3 epic); `have` (stacks by index) keeps capped passives from turning up again
// a part of exactly this rarity (0..3), not one of `skip`, falling back to any rarity below it
// What each gun part does when it is fitted to a blade instead: [mods, words]
export const BLADE = {
  'Heavy Rounds': [[['MeleeDamage', 0.15]], '+15% blade damage'], 'Rapid Bolt': [[['MeleeSpeed', 0.1]], '+10% swing speed'],
  'Extended Mag': [[['MeleeRange', 0.08]], '+8% reach'], 'Quick Hands': [[['MeleeGuard', 0.1]], 'Take 10% less damage for 2s after a swing lands'],
  'Keen Sight': [[['MeleeCrit', 0.08]], '+8% crit chance with the blade'], 'Hollow Tip': [[['MeleeHeavy', 0.15]], '+15% damage on heavy swings'],
  'Marksman Scope': [[['MeleeExecute', 0.05]], 'Finishes off enemies below 5% health'], 'Piercing Tip': [[['MeleeCleave', 1]], 'Each swing hits 1 more enemy'],
  'Feed Loop': [[['MeleeAmmo', 0.2]], 'Blade hits put ammo back in your gun'], 'Incendiary': [[['MeleeBurn', 15]], 'Blade hits set enemies alight'],
  'Cryo Cell': [[['MeleeStun', 0.4]], 'Heavy swings stun for 0.4s'], 'Serrated': [[['MeleeBleed', 0.2]], 'Blade hits make enemies bleed'],
  'Split Barrel': [[['MeleeArc', 0.15]], '+15% wider swing'], 'Arc Coil': [[['MeleeShock', 0.2]], 'Blade hits can arc to an enemy nearby'],
  'Blast Cap': [[['MeleeKnock', 0.4]], '+40% knockback'], 'Ricochet': [[['MeleeCleave', 1]], 'Each swing hits 1 more enemy'],
  'Leech Rounds': [[['MeleeLifesteal', 0.02]], 'Heal for 2% of blade damage'], 'Whetstone': [[['BladeHone', 0.25]], 'The blade hones 25% faster'],
};
for (const d of CORE_DEFS) if (d.pressed && BLADE[d.pressed]) { const [m, t] = BLADE[d.pressed]; BLADE[d.name] = [m.map(([k, v]) => [k, v * PRESS]), scaleText(t, PRESS)]; }
{ const E = { fire: 'Incendiary', ice: 'Cryo Cell', blood: 'Serrated', shock: 'Arc Coil' };
  for (const F of FUSIONS) { const A = BLADE[E[F.a]], B = BLADE[E[F.b]]; BLADE[F.name] = [A[0].concat(B[0]), `${A[1]}; ${B[1].charAt(0).toLowerCase()}${B[1].slice(1)}`]; } }
export function rollCoreAt(t, skip = null, have = null) {
  for (; t >= 0; t--) { const pool = []; CORE_DEFS.forEach((d, k) => { const i = CORE0 + k; if (TIER[d.rarity] === t && !d.noDrop && !Meta.upgradeLocked(d.name) && !(skip && skip.has(i)) && !(have && d.kind === 'me' && (have[i] || 0) >= DATA.upgrades[i].stacks)) pool.push(i); }); if (pool.length) return pool[Math.floor(Math.random() * pool.length)]; }
  return CORE0;
}
export const coreTier = (i) => TIER[DATA.upgrades[i].rarity] || 0;
export function rollCore(cap, have = null, skip = null) {
  const W = [[100], [58, 42], [46, 36, 18], [40, 34, 20, 6]][Math.max(0, Math.min(3, cap))];
  let r = Math.random() * 100, t = 0; for (let q = 0; q < W.length; q++) { r -= W[q]; if (r <= 0) { t = q; break; } }
  for (; t >= 0; t--) {
    const pool = []; CORE_DEFS.forEach((d, k) => { const i = CORE0 + k; if (TIER[d.rarity] === t && !d.noDrop && !Meta.upgradeLocked(d.name) && !(skip && skip.has(i)) && !(have && d.kind === 'me' && (have[i] || 0) >= DATA.upgrades[i].stacks)) pool.push(i); });
    if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  }
  return CORE0;
}
