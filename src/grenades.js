// Grenades: dropped by the dead, thrown with V. You carry up to four; V throws the one picked up last.
export const GRENADES = [
  { name: 'Frag', color: [0.45, 0.85, 0.4], hex: '#7fd866', radius: 420, dmg: 2.4, weight: 5, desc: 'Big blast.' },
  { name: 'Firebomb', color: [1, 0.5, 0.12], hex: '#ff8a2a', radius: 320, dmg: 0.7, weight: 3, desc: 'Leaves a burning patch for 6 seconds.' },
  { name: 'Frost', color: [0.5, 0.85, 1], hex: '#8fdcff', radius: 400, dmg: 0.4, weight: 3, desc: 'Slows everything it touches to a crawl.' },
  { name: 'Shock', color: [0.75, 0.6, 1], hex: '#c4a0ff', radius: 380, dmg: 0.5, weight: 2, desc: 'Stuns a crowd and arcs between them.' },
  { name: 'Cluster', color: [1, 0.85, 0.3], hex: '#ffd84d', radius: 260, dmg: 1.3, weight: 1.5, desc: 'Bursts into five smaller bombs.' },
  // not dropped: the Bomber's satchel and the two workbench alt-fire payloads
  { name: 'Satchel', color: [1, 0.55, 0.15], hex: '#ffa23a', radius: 460, dmg: 1.8, weight: 0, desc: '' },
  { name: 'Gravity', color: [0.7, 0.45, 1], hex: '#b58cff', radius: 520, dmg: 1.5, weight: 0, desc: '' },
  { name: 'Underbarrel', color: [1, 0.8, 0.4], hex: '#ffd070', radius: 320, dmg: 1.5, weight: 0, desc: '' },
];
export const GRENADE_MAX = 4;
export const GRENADE_ROLL = () => { let t = 0; for (const G of GRENADES) t += G.weight; let r = Math.random() * t; for (let i = 0; i < GRENADES.length; i++) { r -= GRENADES[i].weight; if (r <= 0) return i; } return 0; };
