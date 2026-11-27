// The Training Yard: what Old Hobnail teaches. Every class earns its own class points from runs played as it (rooms
// cleared, bosses beaten, the Descent finished), and spends them here on that class alone:
//   perk       always on once learned: a little more of what keeps the class standing (mods: stats, as buffs carry)
//   ability    a lesson for the class ability, always on once learned
//   variant    another way to use the class ability. Learn either or both; one is fitted at a time (or none: as it came)
//   gear       the class's own clothes (they used to come with class levels)
// Each tier opens once anything in the tier before it is learned.
export const CP_RATES = { room: 1, boss: 3, finalBoss: 6, win: 10 };
export const TRAINING = {
  gunslinger: [
    { id: 'feet', kind: 'perk', tier: 1, cost: 15, name: 'Light Feet', text: '+6% move speed, and your dash recharges 10% faster.', mods: [['MoveSpeed', 0.06], ['DashCooldown', 0.1]] },
    { id: 'gear0', kind: 'gear', tier: 1, cost: 20, name: "Gambler's Hat", cos: 'hat:gambler' },
    { id: 'hands', kind: 'perk', tier: 2, cost: 30, name: 'Quick Hands', text: '+10% reload speed, and swapping guns is 25% faster.', mods: [['ReloadSpeed', 0.1], ['SwapSpeed', 0.25]] },
    { id: 'quick', kind: 'ability', tier: 2, cost: 30, name: 'Quickload', text: 'Deadeye refills every magazine you carry when it starts.', mods: [['DeadeyeReload', 1]] },
    { id: 'fan', kind: 'variant', tier: 2, cost: 40, name: 'Fan the Hammer', text: 'Deadeye lasts 3 seconds instead of 5, and you fire 60% faster through it.' },
    { id: 'gear1', kind: 'gear', tier: 2, cost: 40, name: 'Duster', cos: 'outfit:duster' },
    { id: 'nerve', kind: 'perk', tier: 3, cost: 50, name: 'Iron Nerve', text: '+25 max health and +15 armor.', mods: [['MaxHealth', 25], ['Armor', 15]] },
    { id: 'calm', kind: 'variant', tier: 3, cost: 50, name: 'Dead Calm', text: 'Deadeye lasts 6 seconds, and you take 40% less damage through it.' },
    { id: 'gear2', kind: 'gear', tier: 3, cost: 70, name: 'Quickdraw Rig', cos: 'waist:quickdraw' },
  ],
  brawler: [
    { id: 'skin', kind: 'perk', tier: 1, cost: 15, name: 'Thick Skin', text: '+30 max health.', mods: [['MaxHealth', 30]] },
    { id: 'gear0', kind: 'gear', tier: 1, cost: 20, name: 'Flat Cap', cos: 'hat:flatcap' },
    { id: 'breath', kind: 'perk', tier: 2, cost: 30, name: 'Second Breath', text: 'Regenerate 1 health a second.', mods: [['HealthRegen', 1]] },
    { id: 'shield', kind: 'ability', tier: 2, cost: 30, name: 'Shoulder Shield', text: 'Bull Rush leaves you with 40 shield when it ends.', mods: [['RushShield', 40]] },
    { id: 'long', kind: 'variant', tier: 2, cost: 40, name: 'Long Charge', text: 'Bull Rush runs nearly twice as far; it recharges a quarter slower.' },
    { id: 'gear1', kind: 'gear', tier: 2, cost: 40, name: 'Brass Knuckles', cos: 'gloves:knuckles' },
    { id: 'guard', kind: 'perk', tier: 3, cost: 50, name: 'Guard Up', text: '+25 armor.', mods: [['Armor', 25]] },
    { id: 'check', kind: 'variant', tier: 3, cost: 50, name: 'Shoulder Check', text: 'A short, sharp Bull Rush that heals you 12% of your health and recharges a third faster.' },
    { id: 'gear2', kind: 'gear', tier: 3, cost: 70, name: 'Singlet', cos: 'outfit:singlet' },
  ],
  engineer: [
    { id: 'plate', kind: 'perk', tier: 1, cost: 15, name: 'Field Plating', text: '+15 armor.', mods: [['Armor', 15]] },
    { id: 'gear0', kind: 'gear', tier: 1, cost: 20, name: "Welder's Cap", cos: 'hat:welder' },
    { id: 'spares', kind: 'perk', tier: 2, cost: 30, name: 'Spare Parts', text: 'Your turret deals 20% more damage and reaches 20% further.', mods: [['TurretDamage', 0.2], ['TurretRange', 0.2]] },
    { id: 'deploy', kind: 'ability', tier: 2, cost: 30, name: 'Quick Deploy', text: 'The turret recharges 20% faster.', mods: [['AbilityCooldown', 0.2]] },
    { id: 'over', kind: 'variant', tier: 2, cost: 40, name: 'Overclock', text: 'The turret is out for 60% as long, and fires 60% faster.' },
    { id: 'gear1', kind: 'gear', tier: 2, cost: 40, name: 'Shop Apron', cos: 'outfit:apron' },
    { id: 'bulk', kind: 'perk', tier: 3, cost: 50, name: 'Reinforced', text: '+30 max health and 2 shield back a second.', mods: [['MaxHealth', 30], ['ShieldRegen', 2]] },
    { id: 'watch', kind: 'variant', tier: 3, cost: 50, name: 'Long Watch', text: 'The turret stays out 80% longer; it recharges 35% slower.' },
    { id: 'gear2', kind: 'gear', tier: 3, cost: 70, name: 'Tool Pack', cos: 'back:toolpack' },
  ],
  sniper: [
    { id: 'foot', kind: 'perk', tier: 1, cost: 15, name: 'Sure Footing', text: '+5% move speed, and your dash recharges 10% faster.', mods: [['MoveSpeed', 0.05], ['DashCooldown', 0.1]] },
    { id: 'gear0', kind: 'gear', tier: 1, cost: 20, name: 'Boonie Hat', cos: 'hat:boonie' },
    { id: 'hard', kind: 'perk', tier: 2, cost: 30, name: 'Hard Target', text: '+20 armor.', mods: [['Armor', 20]] },
    { id: 'reel', kind: 'ability', tier: 2, cost: 30, name: 'Fast Reel', text: 'The grapple recharges 25% faster.', mods: [['GrappleCooldown', 0.25]] },
    { id: 'line', kind: 'variant', tier: 2, cost: 40, name: 'Long Line', text: 'The grapple reaches 60% further.' },
    { id: 'gear1', kind: 'gear', tier: 2, cost: 40, name: 'Ghillie Suit', cos: 'outfit:ghillie' },
    { id: 'eye', kind: 'perk', tier: 3, cost: 50, name: 'Patience', text: '+20% headshot damage.', mods: [['HeadshotDamage', 0.2]] },
    { id: 'roll', kind: 'variant', tier: 3, cost: 50, name: 'Landing Roll', text: 'For 3 seconds after a grapple you take half damage.' },
    { id: 'gear2', kind: 'gear', tier: 3, cost: 70, name: 'Spyglass', cos: 'face:spyglass' },
  ],
  bomber: [
    { id: 'pockets', kind: 'perk', tier: 1, cost: 15, name: 'Powder Pockets', text: 'Carry one more grenade.', mods: [['GrenadeCap', 1]] },
    { id: 'gear0', kind: 'gear', tier: 1, cost: 20, name: 'Blast Hood', cos: 'hat:blasthood' },
    { id: 'pad', kind: 'perk', tier: 2, cost: 30, name: 'Blast Padding', text: '+20 max health and +15 armor.', mods: [['MaxHealth', 20], ['Armor', 15]] },
    { id: 'fuse', kind: 'ability', tier: 2, cost: 30, name: 'Short Fuse', text: 'The Satchel Charge recharges 25% faster.', mods: [['AbilityCooldown', 0.25]] },
    { id: 'cluster', kind: 'variant', tier: 2, cost: 40, name: 'Cluster Charge', text: 'The satchel is a cluster bomb: it bursts into five smaller bombs.' },
    { id: 'gear1', kind: 'gear', tier: 2, cost: 40, name: 'Quilted Coat', cos: 'outfit:quilted' },
    { id: 'bang', kind: 'perk', tier: 3, cost: 50, name: 'Bigger Bang', text: '+12% explosion radius.', mods: [['ExplosionRadius', 0.12]] },
    { id: 'twin', kind: 'variant', tier: 3, cost: 50, name: 'Twin Satchel', text: 'The satchel recharges 40% faster; its blast is a quarter smaller.' },
    { id: 'gear2', kind: 'gear', tier: 3, cost: 70, name: 'Powder Keg', cos: 'back:keg' },
  ],
};
export const KIND_NAMES = { perk: 'Perk', ability: 'Ability', variant: 'Variant', gear: 'Gear' };
