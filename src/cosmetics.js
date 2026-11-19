// Character cosmetics: what exists, what each piece looks like (palette + shape flags) and what unlocks it.
// `need` is [lifetime stat, amount]; no `need` means it is available from the start.
export const SLOTS = ['body', 'tone', 'hair', 'haircol', 'outfit', 'legs', 'boots', 'gloves', 'hat', 'face', 'neck', 'shoulder', 'waist', 'back'];
export const SLOT_NAMES = { body: 'BODY', tone: 'SKIN', hair: 'HAIR', haircol: 'HAIR COLOR', outfit: 'OUTFIT', legs: 'LEGS', boots: 'BOOTS', gloves: 'GLOVES', hat: 'HAT', face: 'FACE', neck: 'NECK', shoulder: 'SHOULDERS', waist: 'WAIST', back: 'BACK' };
const STAT_TEXT = { kills: 'Kill # enemies', headshots: 'Get # headshot kills', bestRound: 'Reach round #', bosses: 'Defeat # bosses', runs: 'Play # runs', eliteKills: 'Kill # elites',
  slotSpins: 'Spin the slots # times', moneyEarned: 'Earn $# in total', wins: 'Clear Deadwater Gulch', mastered: 'Master # guns', airKills: 'Get # kills in the air', tier3: 'Upgrade a weapon to tier 3' };
export const needText = (I) => (I.need ? STAT_TEXT[I.need[0]].replace('#', I.need[1].toLocaleString()).replace(/\b1 (bosses|runs|guns)/, (m, w) => '1 ' + w.replace(/e?s$/, '')) : '');

export const COSMETICS = {
  // base models: Human is the starter; the others unlock. w = build, lh = leg length, hs = head size; non-humans ignore skin tone
  body: [
    { id: 'regular', name: 'Human', kind: 'human', w: 1, lh: 1, hs: 1 },
    { id: 'skeleton', name: 'Skeleton', kind: 'skeleton', w: 0.82, lh: 1.05, hs: 1, c: 0xf2e8d5, need: ['kills', 350] },
    { id: 'tinman', name: 'Robot', kind: 'robot', w: 1.08, lh: 0.96, hs: 1, c: 0x9aa0aa, need: ['bosses', 1] },
    { id: 'gator', name: 'Gator', kind: 'gator', w: 1.1, lh: 0.9, hs: 1, c: 0x5a8a4a, need: ['eliteKills', 20] },
  ],
  hair: [
    { id: 'short', name: 'Short' }, { id: 'bald', name: 'Bald' }, { id: 'long', name: 'Long' }, { id: 'pomp', name: 'Pompadour' },
    { id: 'mohawk', name: 'Mohawk', need: ['kills', 120] }, { id: 'braids', name: 'Braids', need: ['runs', 3] }, { id: 'bun', name: 'Top Knot', need: ['headshots', 40] },
    { id: 'afro', name: 'Afro', need: ['bestRound', 6] }, { id: 'mullet', name: 'Mullet', need: ['slotSpins', 15] }, { id: 'spikes', name: 'Spikes', need: ['eliteKills', 15] },
  ],
  haircol: [
    { id: 'brown', name: 'Brown', c: 0x3a2a22 }, { id: 'black', name: 'Black', c: 0x1c1a20 }, { id: 'blonde', name: 'Blonde', c: 0xe0b860 }, { id: 'ginger', name: 'Ginger', c: 0xb0502a },
    { id: 'grey', name: 'Grey', c: 0xb8b2a8 }, { id: 'teal', name: 'Teal', c: 0x1f8a8a, need: ['kills', 300] }, { id: 'pink', name: 'Pink', c: 0xe86a9a, need: ['slotSpins', 40] },
    { id: 'red', name: 'Blood Red', c: 0xc8211b, need: ['headshots', 200] }, { id: 'white', name: 'White', c: 0xf2e8d5, need: ['bestRound', 10] }, { id: 'goldh', name: 'Gold', c: 0xffcd5a, need: ['moneyEarned', 150000] },
  ],
  boots: [
    { id: 'work', name: 'Work Boots', a: 0x4E3324, b: 0x2a1c14 }, { id: 'cowboy', name: 'Cowboy Boots', a: 0x6a4a32, b: 0x3a2a22, style: 'spur' }, { id: 'sneak', name: 'Sneakers', a: 0xf2e8d5, b: 0xc8211b, style: 'low' },
    { id: 'rubber', name: 'Rubber Boots', a: 0xe8c81e, b: 0x2a2430, style: 'tall', need: ['runs', 6] }, { id: 'blackb', name: 'Black Boots', a: 0x1c1a20, b: 0x140d12, style: 'tall', need: ['kills', 180] },
    { id: 'sandal', name: 'Sandals', a: 0x8a5a3c, b: 0x4E3324, style: 'sandal', need: ['slotSpins', 30] }, { id: 'snake', name: 'Snakeskin', a: 0x4f8a5a, b: 0xffcd5a, style: 'spur', need: ['eliteKills', 30] },
    { id: 'peg', name: 'Peg Leg', a: 0x8a6a42, b: 0x3a2a22, style: 'peg', need: ['bosses', 2] }, { id: 'redb', name: 'Red Boots', a: 0xc8211b, b: 0xf2e8d5, style: 'spur', need: ['bestRound', 11] },
    { id: 'goldb', name: 'Gold Boots', a: 0xe0ac2a, b: 0xfff4d8, style: 'tall', need: ['moneyEarned', 200000] },
  ],
  gloves: [
    { id: 'bare', name: 'Bare Hands' }, { id: 'leather', name: 'Leather', a: 0x4E3324, b: 0xC9A46A }, { id: 'blackg', name: 'Black', a: 0x1c1a20, b: 0x6a2030, need: ['kills', 25] },
    { id: 'whiteg', name: 'Dealer White', a: 0xece6d6, b: 0xE8B83A, need: ['slotSpins', 25] }, { id: 'redg', name: 'Red', a: 0xc8211b, b: 0x140d12, need: ['headshots', 80] },
    { id: 'wraps', name: 'Hand Wraps', a: 0xd8d2c4, b: 0xb8b2a8, style: 'wrap', need: ['runs', 5] }, { id: 'boxing', name: 'Boxing Gloves', a: 0xc8211b, b: 0xf2e8d5, style: 'big', need: ['eliteKills', 12] },
    { id: 'hazg', name: 'Rubber', a: 0xe8c81e, b: 0x140d12, style: 'long', need: ['bosses', 2] }, { id: 'boneg', name: 'Bone', a: 0xe8dcc0, b: 0x3a2a30, need: ['mastered', 1] },
    { id: 'goldg', name: 'Gilded', a: 0xE0AC2A, b: 0xfff4d8, need: ['bestRound', 20] },
  ],
  neck: [
    { id: 'none', name: 'None' }, { id: 'kerchief', name: 'Neckerchief', a: 0xc8211b, b: 0xf2e8d5 }, { id: 'bolo', name: 'Bolo Tie', a: 0x140d12, b: 0x1f8a8a },
    { id: 'scarf', name: 'Long Scarf', a: 0x1f6a6a, b: 0xffcd5a, need: ['runs', 3] }, { id: 'bowtie', name: 'Bow Tie', a: 0xc8211b, b: 0x140d12, need: ['slotSpins', 20] },
    { id: 'chain', name: 'Gold Chain', a: 0xffcd5a, b: 0xffcd5a, need: ['moneyEarned', 40000] }, { id: 'bandolier', name: 'Bandolier', a: 0x4E3324, b: 0xe0ac2a, need: ['kills', 250] },
    { id: 'teeth', name: 'Tooth Necklace', a: 0x3a2a22, b: 0xf2e8d5, need: ['eliteKills', 20] }, { id: 'lei', name: 'Lei', a: 0xe86a9a, b: 0xffcd5a, need: ['bestRound', 9] },
    { id: 'noose', name: 'Cut Noose', a: 0xc9a46a, b: 0x8a6a42, need: ['bosses', 3] }, { id: 'medal', name: 'Medal', a: 0x34506a, b: 0xffcd5a, need: ['wins', 1] },
  ],
  shoulder: [
    { id: 'none', name: 'None' }, { id: 'patch', name: 'Leather Pad', a: 0x4E3324, b: 0xC9A46A }, { id: 'epaulette', name: 'Epaulettes', a: 0xffcd5a, b: 0xc8211b, need: ['kills', 150] },
    { id: 'pauldron', name: 'Steel Pauldron', a: 0x9aa0aa, b: 0x46464e, need: ['bosses', 1] }, { id: 'spikes', name: 'Spiked Pads', a: 0x1c1a20, b: 0xd8d2c4, need: ['eliteKills', 35] },
    { id: 'crow', name: 'Crow', a: 0x1c1a20, b: 0xe0ac2a, need: ['headshots', 120] }, { id: 'parrot', name: 'Parrot', a: 0xc8211b, b: 0x1f8a4c, need: ['moneyEarned', 60000] },
    { id: 'fur', name: 'Fur Mantle', a: 0x6a4a32, b: 0xcdbf9a, need: ['bestRound', 14] }, { id: 'roll', name: 'Blanket Roll', a: 0xb0603a, b: 0xe8c24a, need: ['runs', 10] },
    { id: 'lantern', name: 'Lantern', a: 0x3a3a40, b: 0xffe27a, need: ['airKills', 60] },
  ],
  waist: [
    { id: 'belt', name: 'Plain Belt' }, { id: 'holster', name: 'Holster', a: 0x4E3324, b: 0x2a2a32 }, { id: 'twin', name: 'Twin Holsters', a: 0x3a2a22, b: 0x46464e, need: ['kills', 60] },
    { id: 'ammo', name: 'Ammo Belt', a: 0x4E3324, b: 0xe0ac2a, need: ['headshots', 60] }, { id: 'sash', name: 'Sash', a: 0xc8211b, b: 0xffcd5a, need: ['runs', 4] },
    { id: 'tool', name: 'Tool Belt', a: 0x8a6a42, b: 0x9aa0aa, need: ['tier3', 1] }, { id: 'rope', name: 'Rope Coil', a: 0xc9a46a, b: 0x8a6a42, need: ['airKills', 30] },
    { id: 'chips', name: 'Chip Pouch', a: 0x1f5a3c, b: 0xc8211b, need: ['slotSpins', 50] }, { id: 'champ', name: 'Champion Belt', a: 0x140d12, b: 0xffcd5a, need: ['bosses', 4] },
    { id: 'skulls', name: 'Skull Trophies', a: 0x3a2a22, b: 0xf2e8d5, need: ['kills', 800] },
  ],
  tone: [
    { id: 't1', name: 'Sand', c: 0xe2b48a }, { id: 't2', name: 'Clay', c: 0xc98a5e }, { id: 't3', name: 'Umber', c: 0x8a5a3c }, { id: 't4', name: 'Dusk', c: 0x5e3d2c },
    { id: 't5', name: 'Bone', c: 0xf2e8d5 }, { id: 't6', name: 'Rot', c: 0x8fae6a, need: ['kills', 500] }, { id: 't7', name: 'Ghost', c: 0x9fd6e0, need: ['bestRound', 12] }, { id: 't8', name: 'Gold', c: 0xe0ac2a, need: ['wins', 1] },
  ],
  outfit: [
    { id: 'drifter', name: 'Drifter', a: 0xB0603A, b: 0xE8C24A, c: 0x4E3324, style: 'poncho' },
    { id: 'rancher', name: 'Rancher', a: 0x3f6f8a, b: 0xf2e8d5, c: 0x6a4a32, style: 'shirt' },
    { id: 'mechanic', name: 'Mechanic', a: 0x46586a, b: 0xffcd5a, c: 0x2a2430, style: 'overalls', need: ['runs', 3] },
    { id: 'undertaker', name: 'Undertaker', a: 0x24202a, b: 0x6a2030, c: 0xece6d6, style: 'coat', need: ['kills', 25] },
    { id: 'dealer', name: 'Dealer', a: 0x1f5a3c, b: 0xE8B83A, c: 0xece6d6, style: 'vest', need: ['slotSpins', 25] },
    { id: 'lumber', name: 'Lumberjack', a: 0xc8211b, b: 0x140d12, c: 0x6a4a32, style: 'plaid', need: ['kills', 150] },
    { id: 'sheriff', name: 'Sheriff', a: 0x8a6a42, b: 0xffcd5a, c: 0x3a2a22, style: 'badge', need: ['headshots', 50] },
    { id: 'convict', name: 'Convict', a: 0xf2e8d5, b: 0x140d12, c: 0x8a8a90, style: 'stripes', need: ['eliteKills', 10] },
    { id: 'pinstripe', name: 'Pinstripe', a: 0x2a2a3c, b: 0x8a8ab0, c: 0xf0ece0, style: 'suit', need: ['tier3', 1] },
    { id: 'showman', name: 'Showman', a: 0x7a2a8a, b: 0xffcd5a, c: 0xf2e8d5, style: 'coat', need: ['moneyEarned', 50000] },
    { id: 'hazmat', name: 'Hazmat', a: 0xe8c81e, b: 0x140d12, c: 0x3a3a40, style: 'hazmat', need: ['bosses', 2] },
    { id: 'bones', name: 'Bone Suit', a: 0x1c1a20, b: 0xf2e8d5, c: 0x9c1f24, style: 'bones', need: ['mastered', 1] },
    { id: 'highroller', name: 'High Roller', a: 0xf2e8d5, b: 0xc8211b, c: 0xffcd5a, style: 'suit', need: ['moneyEarned', 250000] },
    { id: 'gilded', name: 'Gilded', a: 0x5a0f1c, b: 0xFFD860, c: 0xfff4d8, style: 'coat', need: ['bestRound', 20] },
  ],
  legs: [
    { id: 'denim', name: 'Denim', a: 0x34506a, b: 0x4E3324 }, { id: 'dust', name: 'Dusters', a: 0x8a7a5e, b: 0x3a2a22 },
    { id: 'black', name: 'Blacks', a: 0x1c1a20, b: 0x140d12, need: ['kills', 100] }, { id: 'chaps', name: 'Chaps', a: 0x6a4a32, b: 0x8a5a3c, chaps: true, need: ['bestRound', 6] },
    { id: 'red', name: 'Reds', a: 0x8a1f24, b: 0xf2e8d5, need: ['headshots', 150] }, { id: 'teal', name: 'Teals', a: 0x1f6a6a, b: 0xffcd5a, need: ['airKills', 50] },
    { id: 'white', name: 'Whites', a: 0xece6d6, b: 0xc8211b, need: ['slotSpins', 60] }, { id: 'goldl', name: 'Gold Trim', a: 0x2a2430, b: 0xffcd5a, stripe: true, need: ['bosses', 4] },
  ],
  hat: [
    { id: 'none', name: 'None' }, { id: 'cowboy', name: 'Cowboy Hat', a: 0x3a2a22, b: 0xc8211b }, { id: 'cap', name: 'Trucker Cap', a: 0xc8211b, b: 0xf2e8d5 },
    { id: 'bowler', name: 'Bowler', a: 0x1c1a20, b: 0x6a2030, need: ['kills', 50] }, { id: 'beanie', name: 'Beanie', a: 0x1f6a6a, b: 0xffcd5a, need: ['runs', 5] },
    { id: 'visor', name: 'Dealer Visor', a: 0x1f8a4c, b: 0x140d12, need: ['slotSpins', 10] }, { id: 'tophat', name: 'Top Hat', a: 0x140d12, b: 0xc8211b, need: ['bestRound', 8] },
    { id: 'sombrero', name: 'Sombrero', a: 0xe0b060, b: 0xc8211b, need: ['kills', 400] }, { id: 'miner', name: 'Miner Helmet', a: 0xe8c81e, b: 0xfff4d8, need: ['bosses', 1] },
    { id: 'fez', name: 'Fez', a: 0xa01f24, b: 0xffcd5a, need: ['moneyEarned', 25000] }, { id: 'cone', name: 'Traffic Cone', a: 0xf07a1e, b: 0xf2e8d5, need: ['airKills', 25] },
    { id: 'whitehat', name: 'White Hat', a: 0xece6d6, b: 0xffcd5a, need: ['headshots', 300] }, { id: 'horns', name: 'Horns', a: 0x8a1f24, b: 0xf2e8d5, need: ['eliteKills', 40] },
    { id: 'halo', name: 'Halo', a: 0xffe27a, b: 0xffe27a, need: ['bestRound', 15] }, { id: 'crown', name: 'Crown', a: 0xffcd5a, b: 0xc8211b, need: ['wins', 1] },
  ],
  face: [
    { id: 'none', name: 'None' }, { id: 'stache', name: 'Moustache', a: 0x3a2a22 }, { id: 'bandana', name: 'Bandana', a: 0xc8211b, b: 0xf2e8d5 },
    { id: 'specs', name: 'Round Specs', a: 0x140d12, need: ['runs', 2] }, { id: 'shades', name: 'Shades', a: 0x140d12, need: ['kills', 200] },
    { id: 'beard', name: 'Beard', a: 0x5a3a26, need: ['bestRound', 5] }, { id: 'patch', name: 'Eyepatch', a: 0x140d12, need: ['headshots', 25] },
    { id: 'cigar', name: 'Cigar', a: 0x6a4a32, b: 0xff7a2a, need: ['bosses', 1] }, { id: 'monocle', name: 'Monocle', a: 0xffcd5a, need: ['moneyEarned', 100000] },
    { id: 'greybeard', name: 'Prospector Beard', a: 0xd8d2c4, need: ['kills', 1000] }, { id: 'gasmask', name: 'Gas Mask', a: 0x3a3a40, b: 0x9fd6e0, need: ['bosses', 3] },
    { id: 'skull', name: 'Skull Paint', a: 0xf2e8d5, b: 0x140d12, need: ['eliteKills', 25] }, { id: 'hockey', name: 'Goalie Mask', a: 0xece6d6, b: 0xc8211b, need: ['bestRound', 18] },
  ],
  back: [
    { id: 'none', name: 'None' }, { id: 'pack', name: 'Bedroll', a: 0x6a4a32, b: 0xc8211b }, { id: 'shotgun', name: 'Slung Shotgun', a: 0x3a2a22, b: 0x46464e, need: ['kills', 75] },
    { id: 'guitar', name: 'Guitar', a: 0xb0703a, b: 0x3a2a22, need: ['runs', 8] }, { id: 'cape', name: 'Cape', a: 0xc8211b, b: 0xffcd5a, need: ['bestRound', 10] },
    { id: 'sack', name: 'Money Sack', a: 0xcdbf9a, b: 0x1f8a4c, need: ['moneyEarned', 75000] }, { id: 'shovel', name: 'Shovel', a: 0x8a8a90, b: 0x6a4a32, need: ['bosses', 2] },
    { id: 'tank', name: 'Air Tank', a: 0xe8c81e, b: 0x3a3a40, need: ['airKills', 100] }, { id: 'tomb', name: 'Tombstone', a: 0x8a8a90, b: 0x5a5a62, need: ['kills', 2000] },
    { id: 'wings', name: 'Wings', a: 0xf2e8d5, b: 0xffe27a, need: ['wins', 1] },
  ],
};
export const DEFAULT_LOOK = { body: 'regular', tone: 't1', hair: 'short', haircol: 'brown', outfit: 'drifter', legs: 'denim', boots: 'work', gloves: 'bare', hat: 'cowboy', face: 'none', neck: 'none', shoulder: 'none', waist: 'belt', back: 'none' };
export const cosItem = (slot, id) => COSMETICS[slot].find((I) => I.id === id) || COSMETICS[slot][0];
export const lookString = (L) => SLOTS.map((s) => L[s]).join('|');
export function parseLook(str) { const p = String(str || '').split('|'), L = {}; SLOTS.forEach((s, i) => { L[s] = cosItem(s, p[i]).id; }); return L; }
