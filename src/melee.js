// Melee weapons. Everyone starts with the Bowie Knife; the rest come from the upgrade shop and the weapon roulette.
// dmg: base hit; range (cm, 150 for a knife up to 340 for the shovel: it decides how you fight with it); arc (degrees, total); cd: seconds between swings; wind: delay from press to hit;
// cleave: enemies hit per swing; knock: shove; extras: bleed (fraction over 3s), burn (dps), slow, leech, money, shock.
export const MELEE = [
  { name: 'Bowie Knife', rarity: 'Common', dmg: 120, range: 150, arc: 70, cd: 0.34, wind: 0.06, cleave: 2, knock: 260, desc: 'The fastest swing and the shortest reach. Your starting blade.', model: 'knife' },
  { name: 'Hatchet', rarity: 'Uncommon', dmg: 200, range: 180, arc: 75, cd: 0.52, wind: 0.09, cleave: 2, knock: 380, bleed: 0.25, desc: 'Short, hits hard and leaves them bleeding.', model: 'hatchet' },
  { name: 'Slugger', rarity: 'Uncommon', dmg: 170, range: 250, arc: 110, cd: 0.58, wind: 0.10, cleave: 4, knock: 900, desc: 'Wide swing that sends them flying.', model: 'bat' },
  { name: 'Cattle Prod', rarity: 'Uncommon', dmg: 130, range: 270, arc: 60, cd: 0.42, wind: 0.07, cleave: 2, knock: 200, slow: 0.5, shock: 0.5, desc: 'A long pole. Slows, and arcs to enemies nearby.', model: 'prod' },
  { name: 'Machete', rarity: 'Rare', dmg: 240, range: 240, arc: 120, cd: 0.46, wind: 0.08, cleave: 4, knock: 320, bleed: 0.4, desc: 'Long, wide and fast.', model: 'machete' },
  { name: 'Railroad Sledge', rarity: 'Rare', dmg: 620, range: 290, arc: 90, cd: 1.05, wind: 0.2, cleave: 5, knock: 1300, quake: 1, desc: 'Slow. Flattens a whole group.', model: 'sledge' },
  { name: 'Branding Iron', rarity: 'Rare', dmg: 210, range: 260, arc: 80, cd: 0.5, wind: 0.09, cleave: 3, knock: 350, burn: 60, desc: 'Sets everything it touches on fire.', model: 'brand' },
  { name: "Butcher's Cleaver", rarity: 'Epic', dmg: 420, range: 170, arc: 90, cd: 0.5, wind: 0.09, cleave: 3, knock: 500, leech: 0.08, bleed: 0.3, desc: 'Close work. Heals you for part of every hit.', model: 'cleaver' },
  { name: 'Gunslinger Katana', rarity: 'Epic', dmg: 380, range: 310, arc: 140, cd: 0.38, wind: 0.06, cleave: 6, knock: 300, crit: 0.15, desc: 'Long, fast and very wide.', model: 'katana' },
  { name: "Gravedigger's Shovel", rarity: 'Legendary', dmg: 700, range: 340, arc: 120, cd: 0.6, wind: 0.11, cleave: 6, knock: 1000, money: 25, leech: 0.04, desc: 'The longest reach there is. Huge hits, and every one pays out.', model: 'shovel' },
];
export const MELEE_PRICE = { Common: 0, Uncommon: 1500, Rare: 3200, Epic: 6500, Legendary: 12000 };
// codes: the roulette wheel and the upgrade shop carry melee weapons as 1000 + index (shop) so they never clash with gun or upgrade indices
export const MELEE_CODE = 1000;
export const isMelee = (c) => c >= MELEE_CODE && c < MELEE_CODE + MELEE.length;
export function rollMelee(rarityIdx, owned) {
  const R = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
  for (let r = Math.min(4, Math.max(1, rarityIdx)); r >= 1; r--) { const pool = MELEE.map((m, i) => i).filter((i) => MELEE[i].rarity === R[r] && i !== owned); if (pool.length) return pool[Math.random() * pool.length | 0]; }
  return 1;
}

// Honing at the workbench: four levels, each adding damage, reach and swing speed. It is your edge, so it stays with you
// when you pick up a different blade.
export const HONE_MAX = 4;
export const HONE_COST = [1500, 3000, 5000, 8000];
export const honeDamage = (t) => 1 + 0.3 * t;
export const honeRange = (t) => 1 + 0.06 * t;
export const honeSpeed = (t) => 0.05 * t;
export const honeCleave = (t) => Math.floor(t / 2);
export const reachText = (r) => `${(r / 100).toFixed(1)} m reach`;
