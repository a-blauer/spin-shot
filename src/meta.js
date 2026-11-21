// Meta progression that persists between runs (localStorage): lifetime stats, achievements that unlock guns,
// upgrades and hand cosmetics, and per-gun XP that unlocks permanent traits for that gun.
import { COSMETICS, SLOTS, DEFAULT_LOOK, cosItem, lookString } from './cosmetics.js';
const KEY = 'dmh-meta-v1';

export const GUN_LEVELS = [150, 500, 1200, 2500, 5000];           // kills needed for levels 1..5
export const GUN_TRAITS = ['+10% reload speed', '+15% magazine size', '+10% damage', '+8% crit chance', '+10% damage and a gold finish'];

// starting weapon choices for the lobby loadout; `need` is [lifetime stat, amount]
export const STARTERS = [
  { w: 'Tin Star' }, { w: 'Copperhead' }, { w: 'Back-Alley', need: ['kills', 3600], text: 'Kill 3,600 enemies' },
  { w: 'Sawbuck', need: ['bestRound', 5], text: 'Reach round 5' }, { w: 'Quarter Horse', need: ['bosses', 4], text: 'Defeat 4 bosses' },
];
export const SKINS = [
  { id: 'drifter', name: 'Drifter', glove: 0x4E3324, gloveL: 0x6E4A32, cuff: 0xC9A46A, sleeve: 0xB0603A, stripe: 0xE8C24A },
  { id: 'undertaker', name: 'Undertaker', glove: 0x1c1a20, gloveL: 0x2e2a34, cuff: 0xece6d6, sleeve: 0x24202a, stripe: 0x6a2030 },
  { id: 'dealer', name: 'Barkeep', glove: 0xece6d6, gloveL: 0xffffff, cuff: 0xece6d6, sleeve: 0x1f5a3c, stripe: 0xE8B83A },
  { id: 'pinstripe', name: 'Pinstripe', glove: 0x2a2a3c, gloveL: 0x3c3c54, cuff: 0xf0ece0, sleeve: 0x2a2a3c, stripe: 0x8a8ab0 },
  { id: 'bone', name: 'Bone', glove: 0xe8dcc0, gloveL: 0xf6eed8, cuff: 0x3a2a30, sleeve: 0x3a2a30, stripe: 0x9c1f24 },
  { id: 'gilded', name: 'Gilded', glove: 0xE0AC2A, gloveL: 0xFFD860, cuff: 0xfff4d8, sleeve: 0x5a0f1c, stripe: 0xFFD860 },
];

// stat = lifetime counter (or best value) the achievement reads; reward lists what it unlocks
export const ACHIEVEMENTS = [
  { id: 'kills25', name: 'First Steps', desc: 'Kill 300 enemies', stat: 'kills', need: 300, skin: 'undertaker' },
  { id: 'kills250', name: 'Exterminator', desc: 'Kill 3,000 enemies', stat: 'kills', need: 3000, upgrades: ['Chain Reaction'] },
  { id: 'kills1000', name: 'Thousand', desc: 'Kill 12,000 enemies', stat: 'kills', need: 12000, upgrades: ['Storm Crown'] },
  { id: 'head100', name: 'Sharpshooter', desc: 'Get 800 headshot kills', stat: 'headshots', need: 800, upgrades: ['Death Warrant'] },
  { id: 'air100', name: 'Airborne', desc: 'Get 600 kills while in the air', stat: 'airKills', need: 600, upgrades: ["Hermes' Wings", 'Overdrive'] },
  { id: 'elite25', name: 'Elite Hunter', desc: 'Kill 100 elites', stat: 'eliteKills', need: 100, upgrades: ['Split Rounds'] },
  { id: 'round5', name: 'Round 5', desc: 'Reach round 3', stat: 'bestRound', need: 3, guns: ['Fireworks Finale'] },
  { id: 'round10', name: 'Round 10', desc: 'Reach round 6', stat: 'bestRound', need: 6, guns: ['Railroad Spike'], upgrades: ['Outlaw\'s Nerve'] },
  { id: 'round15', name: 'Round 15', desc: 'Reach round 9', stat: 'bestRound', need: 9, guns: ['Black Cat'] },
  { id: 'round20', name: 'Round 20', desc: 'Reach round 12', stat: 'bestRound', need: 12, guns: ["Fan of Knives"], skin: 'gilded' },
  { id: 'boss1', name: 'Boss Killer', desc: 'Defeat a boss', stat: 'bosses', need: 4, guns: ['Buzzsaw'] },
  { id: 'boss3', name: 'Boss Hunter', desc: 'Defeat 12 bosses', stat: 'bosses', need: 12, upgrades: ['Phoenix Feather'] },
  { id: 'slots25', name: 'Regular', desc: 'Open 75 chests', stat: 'chests', need: 75, guns: ['Gold Rush'], skin: 'dealer' },
  { id: 'money100k', name: 'Big Earner', desc: 'Earn $600,000 in total', stat: 'moneyEarned', need: 600000, upgrades: ['Midas Touch'] },
  { id: 'win', name: 'Town Tamer', desc: 'Beat the Founder and clear Deadwater Gulch', stat: 'wins', need: 1, guns: ['Thunderhead'] },
  { id: 'tier3', name: 'Maxed Out', desc: 'Give one gun three modifiers', stat: 'tier3', need: 1, skin: 'pinstripe' },
  { id: 'master1', name: 'Mastery', desc: 'Get any gun to level 5', stat: 'mastered', need: 2, skin: 'bone' },
];

const fresh = () => ({ stats: {}, ach: {}, gunXp: {}, skin: 'drifter', look: Object.assign({}, DEFAULT_LOOK), cos: {} });
let S = fresh();
let dirty = false;
const events = [];
let lockedGuns = new Set(), lockedUps = new Set(), unlockAll = false;

function recompute() {
  lockedGuns = new Set(); lockedUps = new Set();
  for (const A of ACHIEVEMENTS) if (!S.ach[A.id]) { (A.guns || []).forEach((g) => lockedGuns.add(g)); (A.upgrades || []).forEach((u) => lockedUps.add(u)); }
}
export function rewardText(A) {
  const out = [];
  if (A.guns) out.push(...A.guns);
  if (A.upgrades) out.push(...A.upgrades);
  if (A.skin) out.push(`${SKINS.find((k) => k.id === A.skin).name} hands`);
  return out.join(', ');
}

export const Meta = {
  load() {
    try { const raw = localStorage.getItem(KEY); if (raw) { const o = JSON.parse(raw); if (o && typeof o === 'object') S = Object.assign(fresh(), o); if (!S.cos || typeof S.cos !== 'object') S.cos = {}; } } catch (e) { S = fresh(); }
    // The unlock requirements were raised. Anything earned under the old, easy numbers is locked again until the new
    // number is met; lifetime stats are kept, so nothing has to be redone from zero.
    for (const id of Object.keys(S.ach || {})) { const A = ACHIEVEMENTS.find((a) => a.id === id); if (!A || (S.stats[A.stat] || 0) < A.need) { delete S.ach[id]; dirty = true; } }
    for (const key of Object.keys(S.cos)) { const [slot, id] = key.split(':'), I = COSMETICS[slot] && COSMETICS[slot].find((i) => i.id === id); if (!I || !I.need || (S.stats[I.need[0]] || 0) < I.need[1]) { delete S.cos[key]; dirty = true; } }
    recompute();
  },
  save() { if (!dirty) return; dirty = false; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable: progress lasts for this session only */ } },
  reset() { S = fresh(); dirty = true; recompute(); this.save(); },
  setUnlockAll(v) { unlockAll = v; },
  get state() { return S; },
  stat(k) { return S.stats[k] || 0; },
  bump(k, n = 1) { S.stats[k] = (S.stats[k] || 0) + n; dirty = true; this.check(); },
  best(k, v) { if (v > (S.stats[k] || 0)) { S.stats[k] = v; dirty = true; this.check(); } },
  check() {
    for (const A of ACHIEVEMENTS) {
      if (S.ach[A.id] || (S.stats[A.stat] || 0) < A.need) continue;
      S.ach[A.id] = true; dirty = true;
      events.push({ type: 'ach', name: A.name, reward: rewardText(A) });
      recompute(); this.save();
    }
    for (const slot of SLOTS) for (const I of COSMETICS[slot]) {
      if (!I.need || S.cos[slot + ':' + I.id] || (S.stats[I.need[0]] || 0) < I.need[1]) continue;
      S.cos[slot + ':' + I.id] = true; dirty = true;
      events.push({ type: 'cos', name: I.name });
    }
  },
  cosUnlocked(slot, id) { const I = cosItem(slot, id); return unlockAll || !I.need || !!S.cos[slot + ':' + I.id]; },
  look() { const L = {}; for (const s of SLOTS) { const id = (S.look || {})[s]; L[s] = this.cosUnlocked(s, id) ? cosItem(s, id).id : DEFAULT_LOOK[s]; } return L; },
  lookStr() { return lookString(this.look()); },
  setLook(slot, id) { if (!SLOTS.includes(slot) || !this.cosUnlocked(slot, id)) return; S.look = Object.assign({}, DEFAULT_LOOK, S.look); S.look[slot] = cosItem(slot, id).id; dirty = true; this.save(); },
  starterUnlocked(w) { const T = STARTERS.find((t) => t.w === w); return !!T && (unlockAll || !T.need || (S.stats[T.need[0]] || 0) >= T.need[1]); },
  starter() { return this.starterUnlocked(S.starter) ? S.starter : 'Tin Star'; },
  cls() { return typeof S.cls === 'string' ? S.cls : 'gunslinger'; },
  setCls(id) { S.cls = id; dirty = true; this.save(); },
  difficulty() { return S.diff === 1 || S.diff === 2 ? S.diff : 0; },
  setDifficulty(i) { S.diff = i; dirty = true; this.save(); },
  setStarter(w) { if (this.starterUnlocked(w)) { S.starter = w; dirty = true; this.save(); } },
  cosCount() { let n = 0, t = 0; for (const s of SLOTS) for (const I of COSMETICS[s]) { t++; if (this.cosUnlocked(s, I.id)) n++; } return [n, t]; },
  popEvents() { return events.splice(0, events.length); },
  gunLocked(name) { return !unlockAll && lockedGuns.has(name); },
  upgradeLocked(name) { return !unlockAll && lockedUps.has(name); },
  skinUnlocked(id) { return id === 'drifter' || ACHIEVEMENTS.some((A) => A.skin === id && S.ach[A.id]); },
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
