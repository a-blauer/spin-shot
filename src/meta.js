// Meta progression that persists between runs (localStorage).
//   * RENOWN: every round cleared and boss killed pays XP (more on Hard and Nightmare). Twenty ranks, each with a reward.
//   * THE FRONTIER: per-map medals (Normal / Hard / Nightmare clears), a best round, an heirloom for getting past the
//     first boss and a legendary for clearing it.
//   * CLASS MASTERY: rounds cleared as a class unlock that class's last epic and legendary, then its hands.
//   * CHALLENGES: lifetime feats that unlock guns, blades, buffs, workbench modifiers and hand cosmetics.
//   * per-gun XP that unlocks permanent traits for that gun.
// A reward is EARNED when its goal is met and UNLOCKED when the player claims it on the Progress screen.
// Everything is a pure function of the lifetime stats, so nothing can be lost by a change to the numbers.
import { MUTATORS, mutXp, DATA, DIFFS } from './data.js';
import { COSMETICS, SLOTS, DEFAULT_LOOK, cosItem, lookString, SHAPES, DEFAULT_SHAPE, shapeOf } from './cosmetics.js';
const KEY = 'dmh-meta-v1';

export const GUN_LEVELS = [150, 500, 1200, 2500, 5000];           // kills needed for levels 1..5
export const GUN_TRAITS = ['+10% reload speed', '+15% magazine size', '+10% damage', '+8% crit chance', '+10% damage and a gold finish'];

// the maps, in lobby order (ids match maps.js). The heirloom is a Common buff you may start a run with.
export const WORLD = [
  { id: 'gulch', name: 'Deadwater Gulch', heirloom: 'Hollow Points' },
  { id: 'mine', name: 'Blackwater Mine', heirloom: 'Loose Change' },
  { id: 'frost', name: 'Frostbite Junction', heirloom: 'Cold Rounds' },
  { id: 'bayou', name: 'Mourning Bayou', heirloom: 'Tough Hide' },
  { id: 'carnival', name: 'Carnival of Ash', heirloom: 'Rabbit Reflexes' },
  { id: 'wharf', name: 'Gallows Wharf', heirloom: 'Whetstone' },
];
export const HEIRLOOM_ROUND = 4;                                   // reach this round on a map (its first boss is dead) to earn its heirloom
export const MEDALS = ['Bronze', 'Silver', 'Gold'];               // a clear on Normal / Hard / Nightmare
export const MEDAL_HEX = ['#c98a4a', '#cfd3da', '#ffcd5a'];
export const DIFF_XP = [1, 1.5, 2];

// ---- renown: rank n is RANKS[n - 1]
// The Descent is the game: renown from it climbs these ranks, and each rank opens something new to go down with. The
// thirty ordinary guns and every part and buff found today are there from the start; ranks add the oddities (the strange
// guns, roughly commonest first) and the machines (account-wide helpers that appear in the Descent).
export const MACHINE_NAMES = { compressor: 'The Compressor', showcase: 'The Showcase', recycler: 'The Recycler', fortune: 'The Fortune Teller', fusion: 'Compressor: Fusion' };
export const RANKS = [
  { name: 'Drifter' },
  { name: 'Greenhorn', machine: 'compressor' },
  { name: 'Ranch Hand', parts: ['Accelerant', 'Open Wound', 'Heat Shield', 'Bloodbank', 'Ember Dash'], guns: ['Bullwhip'] },
  { name: 'Deputy', guns: ['Come-Back Kid'] },
  { name: 'Gunhand', machine: 'showcase' },
  { name: 'Trailblazer', parts: ['Brittle Rounds', 'Conductor', 'Cold Comfort', 'Grounding Rod', 'Frost Wake'], guns: ['Bear Trap'] },
  { name: 'Bounty Hunter', guns: ['Lariat'] },
  { name: 'Regulator', parts: ['Steady Barrel', 'Concussive', 'Holster Loader', 'Quick Swap', 'Brace'], guns: ['Tumbleweed'] },
  { name: 'Marshal', machine: 'recycler' },
  { name: 'Pathfinder', guns: ['Barn Door'] },
  { name: 'Outrider', parts: ['Salvage Rounds', 'Scrap Magnet', 'Quartermaster', 'Scavenger', 'Lingering'], guns: ['Old Faithful'] },
  { name: 'Pistolero', guns: ['Whaler'] },
  { name: 'Vigilante', machine: 'fortune' },
  { name: 'Desperado', parts: ['Smoke Step', 'Decoy', 'Kinetic Plating', 'Static Landing', 'Wall Runner'], guns: ['Jack-in-the-Box'] },
  { name: 'Nightrider', guns: ['William Tell'] },
  { name: 'Warden', guns: ['Calliope'] },
  { name: 'Reaper', machine: 'fusion' },
  { name: 'Gravewalker', parts: ['Bank Shot', 'Lodestone', 'Heat Sink', 'Catalyst', 'Lantern'], guns: ['Loaded Dice'] },
  { name: 'Dead Shot', guns: ['Sawbones'] },
  { name: 'Tunnel Rat', guns: ['Live Wire'] },
  { name: 'Lamplighter', guns: ['Gusher'] },
  { name: 'Gravedigger', parts: ['Contagion', 'Shatter', 'Tether', 'Undertow'], guns: ['High Striker'] },
  { name: 'Undertaker', guns: ['Wrecking Ball'] },
  { name: 'Hellhound', guns: ['Hall of Mirrors'] },
  { name: 'Bone Collector', guns: ['House Edge'] },
  { name: 'Deep Walker', parts: ['Splitter', 'Backlash', 'Last Stand', 'Pack Mule'], guns: ['Tilt'] },
  { name: 'Abyss Walker', guns: ['Homing Pigeon'] },
  { name: 'Iron Prophet', guns: ['One-Armed Bandit'] },
  { name: 'Last Light', guns: ['Poltergeist'] },
  { name: 'Underlord', guns: ['Hocus Pocus'] },
  { name: 'Legend', guns: ["Dead Man's Hand"] },
];
export const rankXp = (r) => (r <= 1 ? 0 : Math.round(250 * Math.pow(r - 1, 1.7) / 50) * 50);   // total XP needed to hold rank r
export const rankOf = (xp) => { let r = 1; while (r < RANKS.length && xp >= rankXp(r + 1)) r++; return r; };
// what a run pays
export const roundXp = (round, diff) => Math.round((30 + 12 * Math.max(1, round | 0)) * (DIFF_XP[diff] || 1));
export const bossXp = (final, diff) => Math.round((final ? 800 : 120) * (DIFF_XP[diff] || 1));

// starting weapon choices for the lobby loadout
export const STARTERS = ['Tin Star', 'Copperhead', 'Back-Alley', 'Sawbuck', 'Quarter Horse', 'Saloon Six', 'Homesteader'].map((w) => ({ w }));

// ---- class mastery: rounds cleared while playing the class
export const CLASS_LEVELS = [8, 25, 60];
export const CLASS_LEVEL_NAMES = ['Adept', 'Veteran', 'Master'];
export const CLASS_META = [
  { id: 'gunslinger', name: 'Gunslinger', rewards: [{ cos: ['hat:gambler'], renown: 300 }, { cos: ['outfit:duster'], renown: 800 }, { cos: ['waist:quickdraw'], renown: 3000 }] },
  { id: 'brawler', name: 'Brawler', rewards: [{ cos: ['hat:flatcap'], renown: 300 }, { cos: ['gloves:knuckles'], renown: 800 }, { cos: ['outfit:singlet'], renown: 3000 }] },
  { id: 'engineer', name: 'Engineer', rewards: [{ cos: ['hat:welder'], renown: 300 }, { cos: ['outfit:apron'], renown: 800 }, { cos: ['back:toolpack'], renown: 3000 }] },
  { id: 'sniper', name: 'Sniper', rewards: [{ cos: ['hat:boonie'], renown: 300 }, { cos: ['outfit:ghillie'], renown: 800 }, { cos: ['face:spyglass'], renown: 3000 }] },
  { id: 'bomber', name: 'Bomber', rewards: [{ cos: ['hat:blasthood'], renown: 300 }, { cos: ['outfit:quilted'], renown: 800 }, { cos: ['back:keg'], renown: 3000 }] },
];

export const SKINS = [
  { id: 'drifter', name: 'Drifter', glove: 0x4E3324, gloveL: 0x6E4A32, cuff: 0xC9A46A, sleeve: 0xB0603A, stripe: 0xE8C24A },
  { id: 'undertaker', name: 'Undertaker', glove: 0x1c1a20, gloveL: 0x2e2a34, cuff: 0xece6d6, sleeve: 0x24202a, stripe: 0x6a2030 },
  { id: 'dealer', name: 'Barkeep', glove: 0xece6d6, gloveL: 0xffffff, cuff: 0xece6d6, sleeve: 0x1f5a3c, stripe: 0xE8B83A },
  { id: 'pinstripe', name: 'Pinstripe', glove: 0x2a2a3c, gloveL: 0x3c3c54, cuff: 0xf0ece0, sleeve: 0x2a2a3c, stripe: 0x8a8ab0 },
  { id: 'bone', name: 'Bone', glove: 0xe8dcc0, gloveL: 0xf6eed8, cuff: 0x3a2a30, sleeve: 0x3a2a30, stripe: 0x9c1f24 },
  { id: 'gilded', name: 'Gilded', glove: 0xE0AC2A, gloveL: 0xFFD860, cuff: 0xfff4d8, sleeve: 0x5a0f1c, stripe: 0xFFD860 },
  { id: 'rawhide', name: 'Rawhide', glove: 0x8a5a34, gloveL: 0xa8744a, cuff: 0x3a2a22, sleeve: 0x6a6a52, stripe: 0xc9a46a },
  { id: 'gunmetal', name: 'Gunmetal', glove: 0x3a3e46, gloveL: 0x565c68, cuff: 0x1c1e24, sleeve: 0x2a2e36, stripe: 0x9aa0aa },
  { id: 'trail', name: 'Trail Dust', glove: 0xa89070, gloveL: 0xc4ac8a, cuff: 0x5a4632, sleeve: 0x8a7a5e, stripe: 0x3a2a22 },
  { id: 'frontier', name: 'Frontier', glove: 0x24304a, gloveL: 0x34466a, cuff: 0xffcd5a, sleeve: 0x7a1c1c, stripe: 0xf2e8d5 },
  { id: 'nightmare', name: 'Nightmare', glove: 0x140d12, gloveL: 0x2a1820, cuff: 0xc8211b, sleeve: 0x140d12, stripe: 0xff5a4d },
  { id: 'legend', name: 'Legend', glove: 0xf2e8d5, gloveL: 0xffffff, cuff: 0xffcd5a, sleeve: 0x140d12, stripe: 0xffcd5a },
  { id: 'm_gunslinger', name: 'Master Gunslinger', glove: 0x3a2a22, gloveL: 0x54402e, cuff: 0xffcd5a, sleeve: 0x4a3a24, stripe: 0xffcd5a },
  { id: 'm_brawler', name: 'Master Brawler', glove: 0x3a2a22, gloveL: 0x54402e, cuff: 0xff6a4d, sleeve: 0x4a221c, stripe: 0xff6a4d },
  { id: 'm_engineer', name: 'Master Engineer', glove: 0x3a2a22, gloveL: 0x54402e, cuff: 0x6ec8ff, sleeve: 0x24384a, stripe: 0x6ec8ff },
  { id: 'm_sniper', name: 'Master Sniper', glove: 0x3a2a22, gloveL: 0x54402e, cuff: 0x8fe08f, sleeve: 0x2a4230, stripe: 0x8fe08f },
  { id: 'm_bomber', name: 'Master Bomber', glove: 0x3a2a22, gloveL: 0x54402e, cuff: 0xffa23a, sleeve: 0x4a3018, stripe: 0xffa23a },
];

// ---- challenges. stat = lifetime counter (or best value) the challenge reads; the rest is what it unlocks.
export const GROUPS = ['Combat', 'The Descent', 'The Workshop', 'Survival'];
export const ACHIEVEMENTS = [
  { id: 'kills25', group: 0, name: 'First Blood', desc: 'Kill 300 enemies', stat: 'kills', need: 300, renown: 250 },
  { id: 'kills250', group: 0, name: 'Exterminator', desc: 'Kill 3,000 enemies', stat: 'kills', need: 3000, parts: ['Grapeshot'] },
  { id: 'kills1000', group: 0, name: 'One-Man Army', desc: 'Kill 12,000 enemies', stat: 'kills', need: 12000, renown: 2500 },
  { id: 'head100', group: 0, name: 'Sharpshooter', desc: 'Get 800 headshot kills', stat: 'headshots', need: 800, parts: ['Echo Chamber'] },
  { id: 'air100', group: 0, name: 'Airborne', desc: 'Get 600 kills while in the air', stat: 'airKills', need: 600, renown: 1000 },
  { id: 'wall150', group: 0, name: 'Wall Walker', desc: 'Get 150 kills while wall-running', stat: 'wallKills', need: 150, renown: 800 },
  { id: 'elite25', group: 0, name: 'Elite Hunter', desc: 'Kill 100 elites', stat: 'eliteKills', need: 100, parts: ['Death Mark'] },
  { id: 'melee1', group: 0, name: 'Close Work', desc: 'Get 400 melee kills', stat: 'meleeKills', need: 400, blades: ['Gunslinger Katana'] },
  { id: 'melee2', group: 0, name: 'Gravedigger', desc: 'Get 2,000 melee kills', stat: 'meleeKills', need: 2000, blades: ["Gravedigger's Shovel"] },
  { id: 'd5', group: 1, name: 'Going Down', desc: 'Reach room 5 of the Descent', stat: 'dRoom', need: 5, renown: 150 },
  { id: 'd10', group: 1, name: 'Halfway Down', desc: 'Reach room 10 of the Descent', stat: 'dRoom', need: 10, renown: 400 },
  { id: 'd15', group: 1, name: 'Deep Water', desc: 'Reach room 15 of the Descent', stat: 'dRoom', need: 15, renown: 800 },
  { id: 'dwin', group: 1, name: 'The Bottom', desc: 'Clear the Descent', stat: 'dWins', need: 1, renown: 1500 },
  { id: 'dwin5', group: 1, name: 'Regular', desc: 'Clear the Descent 5 times', stat: 'dWins', need: 5, renown: 3000 },
  { id: 'dhard', group: 1, name: 'Hardened', desc: 'Clear the Descent on Hard or above', stat: 'dDiff', need: 2, parts: ['Hollow Charge'] },
  { id: 'dnm', group: 1, name: 'Nightmare Fuel', desc: 'Clear the Descent on Nightmare', stat: 'dDiff', need: 3, renown: 5000 },
  { id: 'boss1', group: 1, name: 'Boss Killer', desc: 'Defeat 4 bosses', stat: 'bosses', need: 4, renown: 300 },
  { id: 'boss3', group: 1, name: 'Boss Hunter', desc: 'Defeat 12 bosses', stat: 'bosses', need: 12, parts: ['Pinning Bolt'] },
  { id: 'boss40', group: 1, name: 'Kingslayer', desc: 'Defeat 40 bosses', stat: 'bosses', need: 40, renown: 2500 },
  { id: 'rooms100', group: 1, name: 'Long Way Down', desc: 'Clear 100 rooms of the Descent', stat: 'dRooms', need: 100, renown: 1500 },
  { id: 'fit50', group: 2, name: 'Tinkerer', desc: 'Fit 50 parts at the workbench', stat: 'fits', need: 50, renown: 400 },
  { id: 'evo10', group: 2, name: 'Evolution', desc: 'Evolve guns 10 times', stat: 'mods', need: 10, renown: 600 },
  { id: 'evo4', group: 2, name: 'Fully Evolved', desc: 'Evolve one gun all the way to IV', stat: 'dEvo', need: 4, parts: ['Static Build'] },
  { id: 'press10', group: 2, name: 'Under Pressure', desc: 'Press 10 parts at the Compressor', stat: 'pressed', need: 10, renown: 500 },
  { id: 'fuse3', group: 2, name: 'Alchemist', desc: 'Fuse 3 elemental parts', stat: 'fused', need: 3, renown: 800 },
  { id: 'scrap40', group: 2, name: 'Scrapper', desc: 'Scrap 40 parts at the Recycler', stat: 'scrapped', need: 40, renown: 500 },
  { id: 'make10', group: 2, name: 'Made to Order', desc: 'Make 10 parts at the Recycler', stat: 'made', need: 10, renown: 600 },
  { id: 'fort15', group: 2, name: 'Second Sight', desc: 'Reroll or trade 15 buffs at the Fortune Teller', stat: 'fortune', need: 15, renown: 600 },
  { id: 'asc1', group: 2, name: 'Ascendant', desc: 'Ascend a gun', stat: 'dAsc', need: 1, renown: 1000 },
  { id: 'asc6', group: 2, name: 'Hall of Fame', desc: 'Earn 6 ascension marks', stat: 'dAsc', need: 6, renown: 4000 },
  { id: 'win', group: 3, name: 'Town Tamer', desc: 'Clear Deadwater Gulch', stat: 'clear_gulch', need: 1, renown: 600 },
  { id: 'win_mine', group: 3, name: 'Struck Gold', desc: 'Clear Blackwater Mine', stat: 'clear_mine', need: 1, renown: 600 },
  { id: 'win_frost', group: 3, name: 'End of the Line', desc: 'Clear Frostbite Junction', stat: 'clear_frost', need: 1, renown: 600 },
  { id: 'win_bayou', group: 3, name: 'Last Rites', desc: 'Clear Mourning Bayou', stat: 'clear_bayou', need: 1, renown: 600 },
  { id: 'win_carnival', group: 3, name: 'Final Curtain', desc: 'Clear Carnival of Ash', stat: 'clear_carnival', need: 1, renown: 600 },
  { id: 'win_wharf', group: 3, name: 'Cut Down', desc: 'Clear Gallows Wharf', stat: 'clear_wharf', need: 1, renown: 600 },
  { id: 'maps3', group: 3, name: 'Globetrotter', desc: 'Clear three different Survival maps', stat: 'mapsCleared', need: 3, renown: 1200 },
  { id: 'maps6', group: 3, name: 'Polyshot', desc: 'Clear all six Survival maps', stat: 'mapsCleared', need: 6, renown: 3000 },
];

const fresh = () => ({ stats: {}, got: {}, claimed: {}, gunXp: {}, skin: 'drifter', look: Object.assign({}, DEFAULT_LOOK), cos: {} });
let S = fresh();
let dirty = false, daily = null;
const events = [];
let lockedGuns = new Set(), lockedUps = new Set(), lockedBlades = new Set(), earnedSkins = new Set(), unlockAll = false;
let run = { xp: 0, xp0: 0, unlocked: [] };

const clears = (lvl) => WORLD.filter((m) => (S.stats['clear_' + m.id] || 0) >= lvl).length;
const DERIVED = { mapsCleared: () => clears(1), hardClears: () => clears(2), nmClears: () => clears(3), rank: () => rankOf(S.stats.xp || 0) };
const val = (k) => (DERIVED[k] ? DERIVED[k]() : S.stats[k] || 0);

export function rewardText(A) {
  const out = [];
  if (A.starter) out.push(`${A.starter} as a starting gun`);
  if (A.machine) out.push(`Machine: ${MACHINE_NAMES[A.machine]}`);
  if (A.parts) out.push(`${A.parts.length} new parts: ${A.parts.join(', ')}`);
  if (A.guns) out.push(...A.guns);
  if (A.blades) out.push(...A.blades);
  if (A.upgrades) out.push(...A.upgrades);
  if (A.heirloom) out.push(`Heirloom: ${A.heirloom}`);
  if (A.cos) for (const c of A.cos) { const [sl, id] = c.split(':'), I = (COSMETICS[sl] || []).find((i) => i.id === id); if (I) out.push(I.name); }
  if (A.renown) out.push(`+${A.renown.toLocaleString()} renown`);
  return out.join(', ');
}

// Every goal in one list: { key, ok(), banner, label, how, reward }. `how` is the plain-words condition, used wherever
// a locked thing has to say what unlocks it; `label` is what the end-of-run card calls it when it carries no reward.
const MILESTONES = [];
RANKS.forEach((R, i) => { if (i > 0) MILESTONES.push({ key: 'r' + (i + 1), ok: () => val('rank') >= i + 1, banner: `RANK ${i + 1}  -  ${R.name.toUpperCase()}`, title: `Rank ${i + 1}  -  ${R.name}`, how: `Rank ${i + 1}  -  ${R.name}`, reward: R }); });
for (const C of CLASS_META) C.rewards.forEach((R, k) => MILESTONES.push({ key: `c:${C.id}:${k}`, ok: () => (S.stats['cls_' + C.id] || 0) >= CLASS_LEVELS[k], banner: `${C.name.toUpperCase()} ${CLASS_LEVEL_NAMES[k].toUpperCase()}`, title: `${C.name} ${CLASS_LEVEL_NAMES[k]}`, how: `${C.name} ${CLASS_LEVEL_NAMES[k]}  -  clear ${CLASS_LEVELS[k]} rounds as the ${C.name}`, reward: R }));
for (const A of ACHIEVEMENTS) MILESTONES.push({ key: 'a:' + A.id, ok: () => val(A.stat) >= A.need, banner: `CHALLENGE: ${A.name.toUpperCase()}`, title: A.name, how: A.desc, reward: A });
for (const m of WORLD) {
  MILESTONES.push({ key: 'h:' + m.id, ok: () => (S.stats['best_' + m.id] || 0) >= HEIRLOOM_ROUND, banner: '', title: `${m.name}: round ${HEIRLOOM_ROUND}`, how: `Reach round ${HEIRLOOM_ROUND} in ${m.name}`, reward: { renown: 500 } });
  MEDALS.forEach((name, d) => MILESTONES.push({ key: `m:${m.id}:${d}`, ok: () => (S.stats['clear_' + m.id] || 0) >= d + 1, banner: `${name.toUpperCase()} MEDAL  -  ${m.name.toUpperCase()}`, label: `${name} medal: ${m.name}`, how: '', reward: {}, top: () => (S.stats['clear_' + m.id] || 0) === d + 1 }));
}
const BY_KEY = new Map(MILESTONES.map((M) => [M.key, M]));
const hasReward = (M) => !!rewardText(M.reward);
// 'locked' (goal not met), 'ready' (met, waiting to be claimed) or 'claimed'
const stateOf = (M) => (!M.ok() ? 'locked' : S.claimed[M.key] || !hasReward(M) ? 'claimed' : 'ready');
const payClaim = (M) => { S.stats['claim:' + M.key] = 1; const n = M.reward && M.reward.renown; if (n) S.stats.xp = (S.stats.xp || 0) + n; };
function recompute() {
  lockedGuns = new Set(); lockedUps = new Set(); lockedBlades = new Set(); earnedSkins = new Set(['drifter']);
  for (const M of MILESTONES) {
    const R = M.reward;
    if (M.ok() && S.claimed[M.key]) continue;   // earned AND claimed
    (R.guns || []).forEach((g) => lockedGuns.add(g)); (R.upgrades || []).forEach((u) => lockedUps.add(u)); (R.parts || []).forEach((u) => lockedUps.add(u)); (R.blades || []).forEach((b) => lockedBlades.add(b));
  }
}

// ---- GOLD: the village's money. Every run pays some (rooms, rounds and bosses), a finished run pays a lot more, and a
// contract from the challenge board pays a bonus on top. It buys cosmetics and guns at the shopkeeper's, and is staked in
// the Lucky Toadstool. Gold is paid the moment it is earned, so a run that ends badly still keeps what it made.
export const GOLD_START = 300;
const DIFF_GOLD = [1, 1.5, 2];
export const GOLD_RATES = { room: 12, round: 8, boss: 40, finalBoss: 150, win: 250 };
// a gun to start runs with: bought once, chosen at the gate before any run
export const GUN_PRICE = { Common: 300, Uncommon: 600, Rare: 1100, Epic: 1800, Legendary: 2800 };
export const shopGuns = () => DATA.weapons.filter((w) => !w.cash);
const commonGun = (name) => DATA.weapons.some((w) => w.name === name && w.rarity === 'Common' && !w.cash);
// cosmetics: the gnome's own face and colouring are free to change; what they wear is bought, earned, or in the starter kit
export const BODY_SLOTS = ['hair', 'haircol', 'tone', 'nose', 'blush', 'beard', 'stache', 'hatcol', 'hatpat'];
export const STARTER_COS = { hat: ['gnome', 'stocking'], hattip: ['none', 'pompom'], outfit: ['drifter'], legs: ['denim'], boots: ['work'], gloves: ['bare'], neck: ['none'], shoulder: ['none'], waist: ['belt'], face: ['none'], back: ['none'] };
const COS_BASE = { hat: 260, hattip: 120, outfit: 520, legs: 260, boots: 220, gloves: 180, neck: 160, shoulder: 240, waist: 200, face: 200, back: 320 };
// ---- THE CHALLENGE BOARD: six contracts a day, the same for everyone. Each is a run with its rules set: the mode, the
// difficulty and the modifiers. Win it with the contract taken and it pays its bonus, once.
const CONTRACT_NAMES = [
  ['Mushroom Patrol', 'The cellar folk want the way kept clear.'], ['A Hat Full of Trouble', 'Someone dropped the mayor’s hat down the hole. Bring back the honour.'],
  ['Root and Branch', 'Dig out the rot, all of it.'], ['The Long Dig', 'Go all the way down and come back with a story.'], ['Toadstool Tithe', 'The council pays well for brave beards.'],
  ['Lantern Duty', 'Carry the light where nobody else will.'], ['Cobble Breaker', 'Something under the square keeps knocking.'], ['The Beekeeper’s Bet', 'He says you won’t. Prove him wrong.'],
  ['Moss and Mettle', 'Old gnomes did it in worse boots.'], ['Thimble Rigged', 'Odds stacked, pockets light. Win anyway.'], ['Pickle Barrel Run', 'Grandma’s pickles are down there. Do not ask.'], ['Brass Buttons', 'A soldier’s errand for a tinker’s pay.'],
];
const hashStr = (k) => { let h = 2166136261; for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; };
function boardFor(key) {
  let h = hashStr('board|' + key); const rnd = () => { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0; h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const n = MUTATORS.length, out = [], used = new Set();
  // three Descent contracts, one at each difficulty, and three on the Survival maps
  const plan = [['descent', 0, 1], ['descent', 1, 1], ['descent', 2, 2], ['survival', 0, 1], ['survival', 1, 2], ['descent', 1, 3]];
  plan.forEach(([mode, diff, nm], i) => {
    let mask = 0; while (bits(mask) < nm) mask |= 1 << Math.floor(rnd() * n);
    let ni = Math.floor(rnd() * CONTRACT_NAMES.length); while (used.has(ni)) ni = (ni + 1) % CONTRACT_NAMES.length; used.add(ni);
    const k = 1 + 0.3 * nm + (mode === 'survival' ? -0.15 : 0), gold = Math.round(([280, 520, 880][diff] * k) / 10) * 10, renown = Math.round(([500, 950, 1600][diff] * k) / 50) * 50;
    out.push({ id: key + '#' + i, title: CONTRACT_NAMES[ni][0], flavor: CONTRACT_NAMES[ni][1], mode, map: mode === 'survival' ? Math.floor(rnd() * 6) : -1, diff, muts: mask, gold, renown });
  });
  return out;
}
const bits = (m) => { let c = 0; while (m) { c += m & 1; m >>= 1; } return c; };
const dayKey = () => { const d = new Date(); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`; };

export const Meta = {
  load() {
    let old = false, preClaim = false;
    try { const raw = localStorage.getItem(KEY); if (raw) { const o = JSON.parse(raw); if (o && typeof o === 'object') { old = !o.got || typeof o.got !== 'object'; preClaim = !o.claimed || typeof o.claimed !== 'object'; S = Object.assign(fresh(), o); } } } catch (e) { S = fresh(); old = false; preClaim = false; }
    if (!S.got || typeof S.got !== 'object') S.got = {};
    if (!S.claimed || typeof S.claimed !== 'object') S.claimed = {};
    if (!S.stats || typeof S.stats !== 'object') S.stats = {};
    if (!S.cos || typeof S.cos !== 'object') S.cos = {};
    if (!S.gunXp || typeof S.gunXp !== 'object') S.gunXp = {};
    // the village came: a purse to start with, the starter gun you had chosen, and whatever you were already wearing
    if (typeof S.gold !== 'number') { S.gold = GOLD_START; dirty = true; }
    if (!S.owned || typeof S.owned !== 'object') {
      S.owned = { guns: {}, cos: {} };
      if (S.starter && S.starter !== 'Tin Star') S.owned.guns[S.starter] = 1;
      for (const sl of SLOTS) { const id = (S.look || {})[sl], I = id !== undefined && COSMETICS[sl] && COSMETICS[sl].find((i) => i.id === id); if (I && !I.need) S.owned.cos[sl + ':' + I.id] = 1; }
      dirty = true;
    }
    S.owned.guns = S.owned.guns || {}; S.owned.cos = S.owned.cos || {};
    const st = S.stats;
    if (old) {
      // A save from before maps, ranks and medals. Every win so far was in Deadwater Gulch, and what was done is worth renown.
      if ((st.wins || 0) > 0 && !WORLD.some((m) => st['wins_' + m.id])) { st.wins_gulch = st.wins; st.clear_gulch = Math.max(st.clear_gulch || 0, 1); }
      if ((st.bestRound || 0) > 0 && !WORLD.some((m) => st['best_' + m.id])) st.best_gulch = st.bestRound;
      if (st.xp === undefined) st.xp = Math.round((st.runs || 0) * 250 + (st.bosses || 0) * 120 + (st.wins || 0) * 800);
      dirty = true;
    }
    for (const key of Object.keys(S.cos)) { const [slot, id] = key.split(':'), I = COSMETICS[slot] && COSMETICS[slot].find((i) => i.id === id); if (!I || !I.need || (S.stats[I.need[0]] || 0) < I.need[1]) { delete S.cos[key]; dirty = true; } }
    this.check(true);      // whatever is already earned is simply marked; only new things are announced
    // a save from before rewards had to be claimed keeps everything it had already unlocked
    if (preClaim) { for (const M of MILESTONES) if (M.ok()) S.claimed[M.key] = 1; dirty = true; }
    for (const k of Object.keys(S.claimed)) if (!S.stats['claim:' + k]) { S.stats['claim:' + k] = 1; dirty = true; }
    this.check(true);
    recompute();
    events.length = 0;
  },
  save() { if (!dirty) return; dirty = false; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable: progress lasts for this session only */ } },
  reset() { S = fresh(); dirty = true; recompute(); this.save(); },
  setUnlockAll(v) { unlockAll = v; },
  allOn() { return unlockAll; },
  // ---- the Descent: a gun is marked once for each difficulty it has carried a winning run on
  asc(name) { const m = (S.asc || {})[name] || 0; return (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1); },
  ascHas(name, df) { return !!((((S.asc || {})[name] || 0) >> df) & 1); },
  ascend(name, df) { S.asc = S.asc || {}; if (this.ascHas(name, df)) return false; S.asc[name] = (S.asc[name] || 0) | (1 << df); this.bump('dAsc'); dirty = true; this.save(); return true; },
  ascended() { return Object.keys(S.asc || {}).filter((n) => this.asc(n) > 0); },
  ascPick(name) { return (S.ascPick || {})[name] || {}; },
  setAscPick(name, key, val) { S.ascPick = S.ascPick || {}; S.ascPick[name] = Object.assign({}, S.ascPick[name], { [key]: val }); dirty = true; this.save(); },
  carry() { return S.carry && this.asc(S.carry) > 0 ? S.carry : ''; },
  setCarry(n) { S.carry = n || ''; dirty = true; this.save(); },
  keepsake() { return S.keepsake || ''; },
  setKeepsake(n) { S.keepsake = n || ''; dirty = true; this.save(); },
  get state() { return S; },
  stat(k) { return val(k); },
  // tips are shown once per profile
  tipSeen(k) { return !!(S.tips && S.tips[k]); },
  tipMark(k) { (S.tips = S.tips || {})[k] = 1; dirty = true; },
  tipsReset() { S.tips = {}; dirty = true; },
  bump(k, n = 1) { S.stats[k] = (S.stats[k] || 0) + n; dirty = true; this.check(); },
  best(k, v) { if (v > (S.stats[k] || 0)) { S.stats[k] = v; dirty = true; this.check(); } },
  check(silent) {
    let changed = false;
    for (const M of MILESTONES) {
      if (S.got[M.key] || !M.ok()) continue;
      S.got[M.key] = 1; dirty = true; changed = true;
      if (silent || (M.top && !M.top())) continue;      // a Gold clear announces Gold, not all three medals
      const rt = rewardText(M.reward);
      events.push({ type: 'ms', banner: M.banner, toast: rt ? `Reward earned: ${rt}  -  claim it in Progress` : '' });
      if (rt || M.label) run.unlocked.push(rt || M.label);
    }
    if (changed) { recompute(); if (!silent) this.save(); }
    for (const slot of SLOTS) for (const I of COSMETICS[slot]) {
      if (!I.need || S.cos[slot + ':' + I.id] || (S.stats[I.need[0]] || 0) < I.need[1]) continue;
      S.cos[slot + ':' + I.id] = true; dirty = true;
      if (!silent) events.push({ type: 'cos', name: I.name });
    }
  },
  // ---- claiming
  milestone(key) { return BY_KEY.get(key); },
  stateOf(key) { const M = BY_KEY.get(key); return M ? stateOf(M) : 'locked'; },
  claimable() { return MILESTONES.filter((M) => stateOf(M) === 'ready'); },
  claim(key) { const M = BY_KEY.get(key); if (!M || stateOf(M) !== 'ready') return null; S.claimed[key] = 1; payClaim(M); dirty = true; recompute(); this.check(); this.save(); return M; },
  claimAll() { const L = this.claimable(); for (const M of L) { S.claimed[M.key] = 1; payClaim(M); } if (L.length) { dirty = true; recompute(); this.check(); this.save(); } return L; },
  // ---- renown
  xp() { return S.stats.xp || 0; },
  rank() { return val('rank'); },
  rankInfo() {
    const xp = this.xp(), r = rankOf(xp), max = r >= RANKS.length, lo = rankXp(r), hi = max ? lo : rankXp(r + 1);
    return { rank: r, name: RANKS[r - 1].name, xp, into: xp - lo, span: hi - lo, max, next: max ? null : { rank: r + 1, name: RANKS[r].name, reward: rewardText(RANKS[r]) } };
  },
  addXp(n) { n = Math.max(0, Math.round(n * mutXp())); if (!n) return; S.stats.xp = (S.stats.xp || 0) + n; run.xp += n; dirty = true; this.check(); },
  // ---- what a run reports
  beginRun() { run = { xp: 0, xp0: this.xp(), unlocked: [], gold: 0, goldWhy: {}, contract: this.contract(), contractPaid: null }; },
  runSummary() { return { xp: run.xp, rank0: rankOf(run.xp0), unlocked: run.unlocked.slice(), info: this.rankInfo(), gold: run.gold || 0, contract: run.contractPaid || null }; },
  roundStarted(round, mapId) { this.best('bestRound', round); if (mapId) this.best('best_' + mapId, round); },
  roundCleared(round, mapId, clsId, diff) { if (clsId) this.bump('cls_' + clsId); this.bump('rounds'); this.addXp(roundXp(round, diff)); this.addGold((mapId === 'descent' ? GOLD_RATES.room : GOLD_RATES.round) * (DIFF_GOLD[diff] || 1), 'rooms'); this.save(); },
  bossKilled(final, diff) { this.bump('bosses'); this.addXp(bossXp(final, diff)); this.addGold((final ? GOLD_RATES.finalBoss : GOLD_RATES.boss) * (DIFF_GOLD[diff] || 1), 'bosses'); },
  won(mapId, diff) { this.bump('wins'); if (mapId) { this.bump('wins_' + mapId); this.best('clear_' + mapId, diff + 1); } this.save(); },
  // ---- maps
  medal(mapId) { return Math.min(3, S.stats['clear_' + mapId] || 0); },
  bestRoundOn(mapId) { return S.stats['best_' + mapId] || 0; },
  heirloomUnlocked(mapId) { return unlockAll || ((S.stats['best_' + mapId] || 0) >= HEIRLOOM_ROUND && !!S.claimed['h:' + mapId]); },
  heirloom() { const m = WORLD.find((w) => w.id === S.heir); return m && this.heirloomUnlocked(m.id) ? m.heirloom : null; },
  heirloomId() { return this.heirloom() ? S.heir : ''; },
  setHeirloom(mapId) { if (mapId && !this.heirloomUnlocked(mapId)) return; S.heir = mapId || ''; dirty = true; this.save(); },
  // ---- classes
  clsRounds(id) { return S.stats['cls_' + id] || 0; },
  clsLevel(id) { const n = this.clsRounds(id); let l = 0; while (l < CLASS_LEVELS.length && n >= CLASS_LEVELS[l]) l++; return l; },
  // ---- lookups
  howToUnlock(kind, name) { for (const M of MILESTONES) { const R = M.reward; if ((kind === 'skin' ? R.skin === name : (R[kind] || []).includes(name)) && M.how) return M.how; } return ''; },
  challengeDone(id) { const A = ACHIEVEMENTS.find((a) => a.id === id); return !!A && val(A.stat) >= A.need; },
  // earned: a cosmetic whose goal is met (or one with no goal). Owned: earned and either free, in the starter kit, earned
  // by a goal, or bought. Only what is owned can be worn.
  cosEarned(slot, id) { const I = cosItem(slot, id); return unlockAll || !I.need || !!S.cos[slot + ':' + I.id]; },
  cosPrice(slot, id) { const I = cosItem(slot, id); if (BODY_SLOTS.includes(slot) || I.need || (STARTER_COS[slot] || []).includes(I.id)) return 0; const k = COSMETICS[slot].indexOf(I); return (COS_BASE[slot] || 200) + 40 * (k % 4); },
  cosOwned(slot, id) { const I = cosItem(slot, id); if (unlockAll || BODY_SLOTS.includes(slot) || (STARTER_COS[slot] || []).includes(I.id)) return true; if (I.need) return !!S.cos[slot + ':' + I.id]; return !!(S.owned && S.owned.cos[slot + ':' + I.id]); },
  cosUnlocked(slot, id) { return this.cosOwned(slot, id); },
  buyCos(slot, id) { const I = cosItem(slot, id), p = this.cosPrice(slot, id); if (this.cosOwned(slot, id) || I.need || !p || !this.spend(p)) return false; S.owned.cos[slot + ':' + I.id] = 1; this.bump('bought'); dirty = true; this.save(); return true; },
  // gold
  gold() { return S.gold | 0; },
  addGold(n, why = '') { n = Math.max(0, Math.round(n)); if (!n) return 0; S.gold = (S.gold | 0) + n; run.gold = (run.gold || 0) + n; if (why) (run.goldWhy = run.goldWhy || {})[why] = (run.goldWhy[why] || 0) + n; this.bump('goldEarned', n); dirty = true; return n; },
  spend(n) { n = Math.round(n); if (n < 0 || (S.gold | 0) < n) return false; S.gold -= n; dirty = true; this.save(); return true; },
  // the casino: a stake comes off when you bet and the winnings go on when it pays; both are saved at once
  stake(n) { return this.spend(n); },
  payout(n) { n = Math.max(0, Math.round(n)); if (n) { S.gold = (S.gold | 0) + n; dirty = true; this.save(); } },
  // guns to start a run with
  gunPrice(name) { const W = DATA.weapons.find((w) => w.name === name); return W ? GUN_PRICE[W.rarity] || 1000 : 0; },
  ownsGun(name) { return unlockAll || commonGun(name) || !!(S.owned && S.owned.guns[name]); },   // every Common gun is yours from the start
  gunState(name) { return this.ownsGun(name) ? 'owned' : this.gunLocked(name) ? 'locked' : 'buy'; },   // (Commons are owned, so never locked)
  buyGun(name) { if (this.gunState(name) !== 'buy' || !this.spend(this.gunPrice(name))) return false; S.owned.guns[name] = 1; this.bump('bought'); dirty = true; this.save(); return true; },
  ownedGuns() { return shopGuns().map((w) => w.name).filter((n) => this.ownsGun(n) && (commonGun(n) || !this.gunLocked(n))); },
  // the challenge board
  board() { const key = dayKey(); if (!S.board || S.board.key !== key) S.board = { key, done: {} }; return boardFor(key).map((c) => Object.assign(c, { done: !!S.board.done[c.id] })); },
  contract() { const id = S.contract; if (!id) return null; const c = this.board().find((q) => q.id === id); return c && !c.done ? c : null; },
  takeContract(id) { S.contract = id || ''; dirty = true; this.save(); },
  // what a contract asks of the run being started: the mode, map, difficulty and modifiers it fixes
  contractRules() { const c = this.contract(); return c ? { mode: c.mode, map: c.map, diff: c.diff, muts: c.muts } : null; },
  // a run was won: pay for it, and the contract's bonus if this was its run
  runWon(mode, mapIndex, diff, muts) {
    if (run.wonPaid) return run.contractPaid; run.wonPaid = true;
    this.addGold(GOLD_RATES.win * (DIFF_GOLD[diff] || 1), 'won');
    const c = run.contract; let paid = null;
    if (c && !S.board.done[c.id] && c.mode === mode && c.diff === diff && (c.muts & muts) === c.muts && (c.mode !== 'survival' || c.map === mapIndex)) {
      S.board.done[c.id] = 1; this.addGold(c.gold, 'contract'); S.stats.xp = (S.stats.xp || 0) + c.renown; run.xp += c.renown; paid = c; S.contract = ''; this.bump('contracts');
    }
    run.contractPaid = paid; dirty = true; this.check(); this.save(); return paid;
  },

  look() {
    const L = {}, K = S.look || {};
    for (const s of SLOTS) { const id = K[s]; L[s] = id !== undefined && COSMETICS[s].some((I) => I.id === id) && this.cosUnlocked(s, id) ? id : DEFAULT_LOOK[s]; }
    // facial hair used to be a piece of facewear
    if (K.fhair === undefined) { if (K.face === 'stache') L.fhair = 'horseshoe'; else if (K.face === 'beard') L.fhair = 'beard'; else if (K.face === 'greybeard') L.fhair = 'long'; }
    L.shape = shapeOf({ shape: S.shape });
    return L;
  },
  shape() { return shapeOf({ shape: S.shape }); },
  setShape(id, v) { if (!SHAPES.some((K) => K.id === id)) return; S.shape = Object.assign({}, DEFAULT_SHAPE, S.shape); S.shape[id] = Math.max(-1, Math.min(1, Math.round((+v || 0) * 10) / 10)); dirty = true; this.save(); },
  setShapes(o) { S.shape = Object.assign({}, DEFAULT_SHAPE, o); dirty = true; this.save(); },
  setLooks(o) { const L = this.look(); delete L.shape; for (const k of SLOTS) if (o[k] !== undefined && this.cosUnlocked(k, o[k])) L[k] = cosItem(k, o[k]).id; S.look = L; dirty = true; this.save(); },
  lookStr() { return lookString(this.look()); },
  setLook(slot, id) { if (!SLOTS.includes(slot) || !this.cosUnlocked(slot, id)) return; const L = this.look(); delete L.shape; L[slot] = cosItem(slot, id).id; S.look = L; dirty = true; this.save(); },
  starterUnlocked(w) { return this.ownsGun(w) && (commonGun(w) || !this.gunLocked(w)) && DATA.weapons.some((q) => q.name === w && !q.cash); },
  starter() { return this.loadout()[0]; },
  // the guns you go down with: two of the ones you own (one for a class that brings its own, the sniper's rifle)
  loadoutSize(cls = this.cls()) { return cls === 'sniper' ? 1 : 2; },
  loadout(cls = this.cls()) {
    const own = this.ownedGuns(), n = this.loadoutSize(cls), L = (Array.isArray(S.loadout) ? S.loadout : [S.starter]).filter((g, i, a) => g && own.includes(g) && a.indexOf(g) === i).slice(0, n);
    for (const g of ['Tin Star', 'Copperhead', ...own]) { if (L.length >= n) break; if (own.includes(g) && !L.includes(g)) L.push(g); }
    return L;
  },
  toggleLoadout(name) { const n = this.loadoutSize(), L = this.loadout(); const i = L.indexOf(name); if (i >= 0) { if (L.length > 1) L.splice(i, 1); } else if (this.ownsGun(name)) { L.push(name); while (L.length > n) L.shift(); } S.loadout = L; S.starter = L[0]; dirty = true; this.save(); },
  cls() { return typeof S.cls === 'string' ? S.cls : 'gunslinger'; },
  setCls(id) { S.cls = id; dirty = true; this.save(); },
  // today's challenge: the same map, difficulty and two handicaps for everyone, changing at midnight UTC
  today() {
    const d = new Date(), key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    let h = 2166136261; for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    const n = MUTATORS.length, a = h % n, b = (a + 1 + ((h >>> 8) % (n - 1))) % n;
    return { key, map: (h >>> 16) % 6, diff: 1, muts: (1 << a) | (1 << b), names: [MUTATORS[a].name, MUTATORS[b].name] };
  },
  dailyOn() { return !!daily; },
  setDaily(on) { daily = on ? this.today() : null; },
  dailyBest() { const t = this.today(); return S.daily && S.daily.key === t.key ? S.daily : { key: t.key, best: 0, won: 0 }; },
  dailyRound(round, won) { if (!daily) return; const b = this.dailyBest(); if (round > b.best || (won && !b.won)) { S.daily = { key: daily.key, best: Math.max(b.best, round), won: won ? 1 : b.won }; S.dailies = Math.max(S.dailies || 0, 0); dirty = true; } if (won && !b.won) { S.dailyWins = (S.dailyWins || 0) + 1; dirty = true; } },
  dailyWins() { return S.dailyWins || 0; },
  mutators() { return daily ? daily.muts : (S.muts | 0); },
  toggleMut(i) { S.muts = (S.muts | 0) ^ (1 << i); dirty = true; this.save(); },
  difficulty() { if (daily) return daily.diff; return S.diff === 1 || S.diff === 2 ? S.diff : 0; },
  setDifficulty(i) { S.diff = i; dirty = true; this.save(); },
  map() { if (daily) return daily.map; return Number.isInteger(S.map) && S.map >= 0 && S.mapPick2 ? S.map : -1; },   // -1: nothing chosen since the Descent became the game, so the lobby opens on it
  setMap(i) { S.map = i; S.mapPick2 = 1; dirty = true; this.save(); },
  setStarter(w) { if (this.starterUnlocked(w)) { S.starter = w; dirty = true; this.save(); } },
  cosCount() { let n = 0, t = 0; for (const s of SLOTS) for (const I of COSMETICS[s]) { t++; if (this.cosUnlocked(s, I.id)) n++; } return [n, t]; },
  popEvents() { return events.splice(0, events.length); },
  // a machine is running once the rank that brings it has been reached and its reward claimed
  machineOn(id) { if (unlockAll) return true; const i = RANKS.findIndex((R) => R.machine === id); if (i < 0) return false; const M = BY_KEY.get('r' + (i + 1)); return !!M && stateOf(M) === 'claimed'; },
  machineRank(id) { return RANKS.findIndex((R) => R.machine === id) + 1; },
  gunLocked(name) { return !unlockAll && lockedGuns.has(name); },
  upgradeLocked(name) { return !unlockAll && lockedUps.has(name); },
  bladeLocked(name) { return !unlockAll && lockedBlades.has(name); },
  skinUnlocked(id) { return unlockAll || earnedSkins.has(id); },
  skinById(id) { return SKINS.find((k) => k.id === id) || SKINS[0]; },
  skin() {
    const L = this.look(), pick = (slot) => (COSMETICS[slot] || []).find((i) => i.id === L[slot]) || (COSMETICS[slot] || [])[0] || {};
    const gl = pick('gloves'), o = pick('outfit'), t = pick('tone'), lift = (c) => { const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255, f = (v) => Math.min(255, Math.round(v + (255 - v) * 0.22)); return (f(r) << 16) | (f(g) << 8) | f(b); };
    const glove = gl.a != null ? gl.a : (t.c != null ? t.c : 0xe2b48a);
    return { id: 'look', name: 'Your look', glove, gloveL: lift(glove), cuff: gl.b != null ? gl.b : (o.c != null ? o.c : 0x4E3324), sleeve: o.a != null ? o.a : 0xB0603A, stripe: o.b != null ? o.b : 0xE8C24A };
  },
  setSkin(id) { if (this.skinUnlocked(id)) { S.skin = id; dirty = true; this.save(); } },
  gunXp(name) { return S.gunXp[name] || 0; },
  gunLevel(name) { const x = S.gunXp[name] || 0; let l = 0; while (l < GUN_LEVELS.length && x >= GUN_LEVELS[l]) l++; return l; },
  addGunKill(name) {
    const before = this.gunLevel(name);
    S.gunXp[name] = (S.gunXp[name] || 0) + 1; dirty = true;
    const after = this.gunLevel(name);
    if (after > before) {
      events.push({ type: 'gun', name, level: after, trait: GUN_TRAITS[after - 1] });
      if (after === GUN_LEVELS.length) this.bump('mastered');
      this.save();
    }
  },
};
