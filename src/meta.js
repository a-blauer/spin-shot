// Meta progression that persists between runs (localStorage).
//   * RENOWN: every round cleared and boss killed pays XP (more on Hard and Nightmare). Twenty ranks, each with a reward.
//   * THE FRONTIER: per-map medals (Normal / Hard / Nightmare clears), a best round, an heirloom for getting past the
//     first boss and a legendary for clearing it.
//   * CLASS MASTERY: rounds cleared as a class unlock that class's last epic and legendary, then its hands.
//   * CHALLENGES: lifetime feats that unlock guns, blades, buffs, workbench modifiers and hand cosmetics.
//   * per-gun XP that unlocks permanent traits for that gun.
// A reward is EARNED when its goal is met and UNLOCKED when the player claims it on the Progress screen.
// Everything is a pure function of the lifetime stats, so nothing can be lost by a change to the numbers.
import { MUTATORS, mutXp } from './data.js';
import { COSMETICS, SLOTS, DEFAULT_LOOK, cosItem, lookString } from './cosmetics.js';
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
export const RANKS = [
  { name: 'Drifter' },
  { name: 'Greenhorn', starter: 'Back-Alley' },
  { name: 'Ranch Hand', upgrades: ['Time Dilator'] },
  { name: 'Deputy', starter: 'Sawbuck' },
  { name: 'Gunhand', upgrades: ['Twin Link'] },
  { name: 'Trailblazer', starter: 'Quarter Horse' },
  { name: 'Bounty Hunter', upgrades: ['Bloodlust Engine'] },
  { name: 'Regulator', skin: 'rawhide' },
  { name: 'Marshal', upgrades: ['Iron Will'] },
  { name: 'Pathfinder', starter: 'Saloon Six' },
  { name: 'Outrider', upgrades: ['Storm Anchor'] },
  { name: 'Pistolero', upgrades: ['Feeding Frenzy'] },
  { name: 'Vigilante', skin: 'gunmetal' },
  { name: 'Desperado', upgrades: ['Headsman'] },
  { name: 'Nightrider', upgrades: ['Curtain Call'] },
  { name: 'Warden', starter: 'Homesteader' },
  { name: 'Reaper', upgrades: ['Mirror Shard'] },
  { name: 'Gravewalker', upgrades: ['Bottomless Chamber'] },
  { name: 'Dead Shot', upgrades: ["Bulwark"] },
  { name: 'Legend', skin: 'legend' },
];
export const rankXp = (r) => (r <= 1 ? 0 : Math.round(250 * Math.pow(r - 1, 1.7) / 50) * 50);   // total XP needed to hold rank r
export const rankOf = (xp) => { let r = 1; while (r < RANKS.length && xp >= rankXp(r + 1)) r++; return r; };
// what a run pays
export const roundXp = (round, diff) => Math.round((30 + 12 * Math.max(1, round | 0)) * (DIFF_XP[diff] || 1));
export const bossXp = (final, diff) => Math.round((final ? 800 : 120) * (DIFF_XP[diff] || 1));

// starting weapon choices for the lobby loadout
export const STARTERS = [{ w: 'Tin Star' }, { w: 'Copperhead' }];
RANKS.forEach((R, i) => { if (R.starter) STARTERS.push({ w: R.starter, rank: i + 1, key: 'r' + (i + 1), text: `Rank ${i + 1}  -  ${R.name}` }); });

// ---- class mastery: rounds cleared while playing the class
export const CLASS_LEVELS = [8, 25, 60];
export const CLASS_LEVEL_NAMES = ['Adept', 'Veteran', 'Master'];
export const CLASS_META = [
  { id: 'gunslinger', name: 'Gunslinger', rewards: [{ upgrades: ['High Noon'] }, { upgrades: ['Loaded for Bear'] }, { skin: 'm_gunslinger' }] },
  { id: 'brawler', name: 'Brawler', rewards: [{ upgrades: ['Unstoppable'] }, { upgrades: ['Juggernaut'] }, { skin: 'm_brawler' }] },
  { id: 'engineer', name: 'Engineer', rewards: [{ upgrades: ['Remote Detonator'] }, { upgrades: ['Twin Mount'] }, { skin: 'm_engineer' }] },
  { id: 'sniper', name: 'Sniper', rewards: [{ upgrades: ['Second Opinion'] }, { upgrades: ['Killshot'] }, { skin: 'm_sniper' }] },
  { id: 'bomber', name: 'Bomber', rewards: [{ upgrades: ['Recycler'] }, { upgrades: ['Carpet Bomber'] }, { skin: 'm_bomber' }] },
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
export const GROUPS = ['Combat', 'Survival', 'Fortune', 'The Frontier'];
export const ACHIEVEMENTS = [
  { id: 'kills25', group: 0, name: 'First Blood', desc: 'Kill 300 enemies', stat: 'kills', need: 300, skin: 'undertaker' },
  { id: 'kills250', group: 0, name: 'Exterminator', desc: 'Kill 3,000 enemies', stat: 'kills', need: 3000, upgrades: ["Spirit Daggers"] },
  { id: 'kills1000', group: 0, name: 'One-Man Army', desc: 'Kill 12,000 enemies', stat: 'kills', need: 12000, upgrades: ['Storm Crown'] },
  { id: 'head100', group: 0, name: 'Sharpshooter', desc: 'Get 800 headshot kills', stat: 'headshots', need: 800, upgrades: ["Deadeye Glass"] },
  { id: 'air100', group: 0, name: 'Airborne', desc: 'Get 600 kills while in the air', stat: 'airKills', need: 600, upgrades: ['Overdrive'] },
  { id: 'elite25', group: 0, name: 'Elite Hunter', desc: 'Kill 100 elites', stat: 'eliteKills', need: 100, upgrades: ["Executioner's Hood"] },
  { id: 'melee1', group: 0, name: 'Close Work', desc: 'Get 400 melee kills', stat: 'meleeKills', need: 400, blades: ['Gunslinger Katana'] },
  { id: 'melee2', group: 0, name: 'Gravedigger', desc: 'Get 2,000 melee kills', stat: 'meleeKills', need: 2000, blades: ["Gravedigger's Shovel"] },
  { id: 'round5', group: 1, name: 'Still Standing', desc: 'Reach round 3', stat: 'bestRound', need: 3, guns: ['Fireworks Finale'] },
  { id: 'round10', group: 1, name: 'Dug In', desc: 'Reach round 6', stat: 'bestRound', need: 6, guns: ['Railroad Spike'], upgrades: ["Outlaw's Nerve"] },
  { id: 'round15', group: 1, name: 'Hard to Kill', desc: 'Reach round 9', stat: 'bestRound', need: 9, guns: ['Black Cat'] },
  { id: 'round20', group: 1, name: 'Last One Standing', desc: 'Reach round 12', stat: 'bestRound', need: 12, guns: ['Fan of Knives'], skin: 'gilded' },
  { id: 'boss1', group: 1, name: 'Boss Killer', desc: 'Defeat 4 bosses', stat: 'bosses', need: 4, guns: ['Buzzsaw'] },
  { id: 'boss3', group: 1, name: 'Boss Hunter', desc: 'Defeat 12 bosses', stat: 'bosses', need: 12, upgrades: ['Phoenix Feather'] },
  { id: 'boss40', group: 1, name: 'Kingslayer', desc: 'Defeat 40 bosses', stat: 'bosses', need: 40, upgrades: ['Giant Slayer'] },
  { id: 'slots25', group: 2, name: 'Treasure Seeker', desc: 'Open 75 chests', stat: 'chests', need: 75, guns: ['Gold Rush'], skin: 'dealer' },
  { id: 'money100k', group: 2, name: 'Big Earner', desc: 'Earn $600,000 in total', stat: 'moneyEarned', need: 600000, upgrades: ['Midas Touch'] },
  { id: 'tier3', group: 2, name: 'Gunsmith', desc: 'Give one gun three modifiers', stat: 'tier3', need: 1, skin: 'pinstripe' },
  { id: 'bench40', group: 2, name: 'Tinkerer', desc: 'Fit 40 workbench modifiers', stat: 'mods', need: 40, upgrades: ["Storm Caller"] },
  { id: 'tonic60', group: 2, name: 'Snake Oil', desc: 'Drink 60 tonics', stat: 'tonics', need: 60, upgrades: ["Lich's Bargain"] },
  { id: 'master1', group: 2, name: 'Mastery', desc: 'Get two guns to level 5', stat: 'mastered', need: 2, skin: 'bone' },
  { id: 'master6', group: 2, name: 'Arsenal', desc: 'Get six guns to level 5', stat: 'mastered', need: 6, upgrades: ['Seventh Son'] },
  { id: 'win', group: 3, name: 'Town Tamer', desc: 'Clear Deadwater Gulch', stat: 'clear_gulch', need: 1, guns: ['Thunderhead'] },
  { id: 'win_mine', group: 3, name: 'Struck Gold', desc: 'Clear Blackwater Mine', stat: 'clear_mine', need: 1, upgrades: ['Gold Fever'] },
  { id: 'win_frost', group: 3, name: 'End of the Line', desc: 'Clear Frostbite Junction', stat: 'clear_frost', need: 1, upgrades: ["Winter's Halo"] },
  { id: 'win_bayou', group: 3, name: 'Last Rites', desc: 'Clear Mourning Bayou', stat: 'clear_bayou', need: 1, upgrades: ["Guardian Angel"] },
  { id: 'win_carnival', group: 3, name: 'Final Curtain', desc: 'Clear Carnival of Ash', stat: 'clear_carnival', need: 1, upgrades: ['Master of Ceremonies'] },
  { id: 'win_wharf', group: 3, name: 'Cut Down', desc: 'Clear Gallows Wharf', stat: 'clear_wharf', need: 1, upgrades: ['Aegis'] },
  { id: 'maps3', group: 3, name: 'Globetrotter', desc: 'Clear three different maps', stat: 'mapsCleared', need: 3, skin: 'trail' },
  { id: 'maps6', group: 3, name: 'Polyshot', desc: 'Clear all six maps', stat: 'mapsCleared', need: 6, skin: 'frontier' },
  { id: 'hard1', group: 3, name: 'Hardened', desc: 'Clear any map on Hard or above', stat: 'hardClears', need: 1, upgrades: ['Unbroken'] },
  { id: 'nm1', group: 3, name: 'Nightmare Fuel', desc: 'Clear any map on Nightmare', stat: 'nmClears', need: 1, upgrades: ["Treasure Hunter"] },
  { id: 'nm6', group: 3, name: 'No Rest for the Wicked', desc: 'Clear all six maps on Nightmare', stat: 'nmClears', need: 6, skin: 'nightmare' },
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
  if (A.guns) out.push(...A.guns);
  if (A.blades) out.push(...A.blades);
  if (A.upgrades) out.push(...A.upgrades);
  if (A.heirloom) out.push(`Heirloom: ${A.heirloom}`);
  if (A.skin) out.push(`${SKINS.find((k) => k.id === A.skin).name} hands`);
  return out.join(', ');
}

// Every goal in one list: { key, ok(), banner, label, how, reward }. `how` is the plain-words condition, used wherever
// a locked thing has to say what unlocks it; `label` is what the end-of-run card calls it when it carries no reward.
const MILESTONES = [];
RANKS.forEach((R, i) => { if (i > 0) MILESTONES.push({ key: 'r' + (i + 1), ok: () => val('rank') >= i + 1, banner: `RANK ${i + 1}  -  ${R.name.toUpperCase()}`, title: `Rank ${i + 1}  -  ${R.name}`, how: `Rank ${i + 1}  -  ${R.name}`, reward: R }); });
for (const C of CLASS_META) C.rewards.forEach((R, k) => MILESTONES.push({ key: `c:${C.id}:${k}`, ok: () => (S.stats['cls_' + C.id] || 0) >= CLASS_LEVELS[k], banner: `${C.name.toUpperCase()} ${CLASS_LEVEL_NAMES[k].toUpperCase()}`, title: `${C.name} ${CLASS_LEVEL_NAMES[k]}`, how: `${C.name} ${CLASS_LEVEL_NAMES[k]}  -  clear ${CLASS_LEVELS[k]} rounds as the ${C.name}`, reward: R }));
for (const A of ACHIEVEMENTS) MILESTONES.push({ key: 'a:' + A.id, ok: () => val(A.stat) >= A.need, banner: `CHALLENGE: ${A.name.toUpperCase()}`, title: A.name, how: A.desc, reward: A });
for (const m of WORLD) {
  MILESTONES.push({ key: 'h:' + m.id, ok: () => (S.stats['best_' + m.id] || 0) >= HEIRLOOM_ROUND, banner: '', title: `${m.name} heirloom`, how: `Reach round ${HEIRLOOM_ROUND} in ${m.name}`, reward: { heirloom: m.heirloom } });
  MEDALS.forEach((name, d) => MILESTONES.push({ key: `m:${m.id}:${d}`, ok: () => (S.stats['clear_' + m.id] || 0) >= d + 1, banner: `${name.toUpperCase()} MEDAL  -  ${m.name.toUpperCase()}`, label: `${name} medal: ${m.name}`, how: '', reward: {}, top: () => (S.stats['clear_' + m.id] || 0) === d + 1 }));
}
const BY_KEY = new Map(MILESTONES.map((M) => [M.key, M]));
const hasReward = (M) => !!rewardText(M.reward);
// 'locked' (goal not met), 'ready' (met, waiting to be claimed) or 'claimed'
const stateOf = (M) => (!M.ok() ? 'locked' : S.claimed[M.key] || !hasReward(M) ? 'claimed' : 'ready');
function recompute() {
  lockedGuns = new Set(); lockedUps = new Set(); lockedBlades = new Set(); earnedSkins = new Set(['drifter']);
  for (const M of MILESTONES) {
    const R = M.reward;
    if (M.ok() && S.claimed[M.key]) { if (R.skin) earnedSkins.add(R.skin); continue; }   // earned AND claimed
    (R.guns || []).forEach((g) => lockedGuns.add(g)); (R.upgrades || []).forEach((u) => lockedUps.add(u)); (R.blades || []).forEach((b) => lockedBlades.add(b));
  }
}

export const Meta = {
  load() {
    let old = false, preClaim = false;
    try { const raw = localStorage.getItem(KEY); if (raw) { const o = JSON.parse(raw); if (o && typeof o === 'object') { old = !o.got || typeof o.got !== 'object'; preClaim = !o.claimed || typeof o.claimed !== 'object'; S = Object.assign(fresh(), o); } } } catch (e) { S = fresh(); old = false; preClaim = false; }
    if (!S.got || typeof S.got !== 'object') S.got = {};
    if (!S.claimed || typeof S.claimed !== 'object') S.claimed = {};
    if (!S.stats || typeof S.stats !== 'object') S.stats = {};
    if (!S.cos || typeof S.cos !== 'object') S.cos = {};
    if (!S.gunXp || typeof S.gunXp !== 'object') S.gunXp = {};
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
    recompute();
    events.length = 0;
  },
  save() { if (!dirty) return; dirty = false; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable: progress lasts for this session only */ } },
  reset() { S = fresh(); dirty = true; recompute(); this.save(); },
  setUnlockAll(v) { unlockAll = v; },
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
  claim(key) { const M = BY_KEY.get(key); if (!M || stateOf(M) !== 'ready') return null; S.claimed[key] = 1; dirty = true; recompute(); this.save(); return M; },
  claimAll() { const L = this.claimable(); for (const M of L) S.claimed[M.key] = 1; if (L.length) { dirty = true; recompute(); this.save(); } return L; },
  // ---- renown
  xp() { return S.stats.xp || 0; },
  rank() { return val('rank'); },
  rankInfo() {
    const xp = this.xp(), r = rankOf(xp), max = r >= RANKS.length, lo = rankXp(r), hi = max ? lo : rankXp(r + 1);
    return { rank: r, name: RANKS[r - 1].name, xp, into: xp - lo, span: hi - lo, max, next: max ? null : { rank: r + 1, name: RANKS[r].name, reward: rewardText(RANKS[r]) } };
  },
  addXp(n) { n = Math.max(0, Math.round(n * mutXp())); if (!n) return; S.stats.xp = (S.stats.xp || 0) + n; run.xp += n; dirty = true; this.check(); },
  // ---- what a run reports
  beginRun() { run = { xp: 0, xp0: this.xp(), unlocked: [] }; },
  runSummary() { return { xp: run.xp, rank0: rankOf(run.xp0), unlocked: run.unlocked.slice(), info: this.rankInfo() }; },
  roundStarted(round, mapId) { this.best('bestRound', round); if (mapId) this.best('best_' + mapId, round); },
  roundCleared(round, mapId, clsId, diff) { if (clsId) this.bump('cls_' + clsId); this.bump('rounds'); this.addXp(roundXp(round, diff)); },
  bossKilled(final, diff) { this.bump('bosses'); this.addXp(bossXp(final, diff)); },
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
  cosUnlocked(slot, id) { const I = cosItem(slot, id); return unlockAll || !I.need || !!S.cos[slot + ':' + I.id]; },
  look() { const L = {}; for (const s of SLOTS) { const id = (S.look || {})[s]; L[s] = this.cosUnlocked(s, id) ? cosItem(s, id).id : DEFAULT_LOOK[s]; } return L; },
  lookStr() { return lookString(this.look()); },
  setLook(slot, id) { if (!SLOTS.includes(slot) || !this.cosUnlocked(slot, id)) return; S.look = Object.assign({}, DEFAULT_LOOK, S.look); S.look[slot] = cosItem(slot, id).id; dirty = true; this.save(); },
  starterUnlocked(w) { const T = STARTERS.find((t) => t.w === w); return !!T && (unlockAll || !T.rank || (this.rank() >= T.rank && !!S.claimed['r' + T.rank])); },
  starter() { return this.starterUnlocked(S.starter) ? S.starter : 'Tin Star'; },
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
  map() { if (daily) return daily.map; return Number.isInteger(S.map) && S.map >= 0 ? S.map : 0; },
  setMap(i) { S.map = i; dirty = true; this.save(); },
  setStarter(w) { if (this.starterUnlocked(w)) { S.starter = w; dirty = true; this.save(); } },
  cosCount() { let n = 0, t = 0; for (const s of SLOTS) for (const I of COSMETICS[s]) { t++; if (this.cosUnlocked(s, I.id)) n++; } return [n, t]; },
  popEvents() { return events.splice(0, events.length); },
  gunLocked(name) { return !unlockAll && lockedGuns.has(name); },
  upgradeLocked(name) { return !unlockAll && lockedUps.has(name); },
  bladeLocked(name) { return !unlockAll && lockedBlades.has(name); },
  skinUnlocked(id) { return unlockAll || earnedSkins.has(id); },
  skinById(id) { return SKINS.find((k) => k.id === id) || SKINS[0]; },
  skin() { return SKINS.find((k) => k.id === S.skin && this.skinUnlocked(k.id)) || SKINS[0]; },
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
