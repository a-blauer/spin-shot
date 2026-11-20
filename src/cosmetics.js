// Character cosmetics: what exists, what each piece looks like (palette + shape flags) and what unlocks it.
// `need` is [lifetime stat, amount]; no `need` means it is available from the start.
export const SLOTS = ['body', 'tone', 'hair', 'haircol', 'outfit', 'legs', 'boots', 'gloves', 'hat', 'face', 'neck', 'shoulder', 'waist', 'back'];
export const SLOT_NAMES = { body: 'BODY', tone: 'SKIN', hair: 'HAIR', haircol: 'HAIR COLOR', outfit: 'OUTFIT', legs: 'LEGS', boots: 'BOOTS', gloves: 'GLOVES', hat: 'HAT', face: 'FACE', neck: 'NECK', shoulder: 'SHOULDERS', waist: 'WAIST', back: 'BACK' };
const STAT_TEXT = { kills: 'Kill # enemies', headshots: 'Get # headshot kills', bestRound: 'Reach round #', bosses: 'Defeat # bosses', runs: 'Play # runs', eliteKills: 'Kill # elites',
  chests: 'Open # chests', moneyEarned: 'Earn $# in total', wins: 'Clear Deadwater Gulch', mastered: 'Master # guns', airKills: 'Get # kills in the air', tier3: 'Give one gun three modifiers' };
export const needText = (I) => (I.need ? STAT_TEXT[I.need[0]].replace('#', I.need[1].toLocaleString()).replace(/\b1 (bosses|runs|guns)/, (m, w) => '1 ' + w.replace(/e?s$/, '')) : '');

export const COSMETICS = {
  // base models: Human is the starter; the others unlock. w = build, lh = leg length, hs = head size; non-humans ignore skin tone
  body: [
    { id: 'regular', name: 'Human', kind: 'human', w: 1, lh: 1, hs: 1 },
    { id: 'skeleton', name: 'Skeleton', kind: 'skeleton', w: 0.82, lh: 1.05, hs: 1, c: 0xf2e8d5, need: ['kills', 4200] },
    { id: 'tinman', name: 'Robot', kind: 'robot', w: 1.08, lh: 0.96, hs: 1, c: 0x9aa0aa, need: ['bosses', 4] },
    { id: 'gator', name: 'Gator', kind: 'gator', w: 1.1, lh: 0.9, hs: 1, c: 0x5a8a4a, need: ['eliteKills', 100] },
  ],
  hair: [
    { id: 'short', name: 'Short' }, { id: 'bald', name: 'Bald' }, { id: 'long', name: 'Long' }, { id: 'pomp', name: 'Pompadour' },
    { id: 'mohawk', name: 'Mohawk', need: ['kills', 1400] }, { id: 'braids', name: 'Braids', need: ['runs', 9] }, { id: 'bun', name: 'Top Knot', need: ['headshots', 300] },
    { id: 'afro', name: 'Afro', need: ['bestRound', 4] }, { id: 'mullet', name: 'Mullet', need: ['chests', 45] }, { id: 'spikes', name: 'Spikes', need: ['eliteKills', 75] },
  ],
  haircol: [
    { id: 'brown', name: 'Brown', c: 0x3a2a22 }, { id: 'black', name: 'Black', c: 0x1c1a20 }, { id: 'blonde', name: 'Blonde', c: 0xe0b860 }, { id: 'ginger', name: 'Ginger', c: 0xb0502a },
    { id: 'grey', name: 'Grey', c: 0xb8b2a8 }, { id: 'teal', name: 'Teal', c: 0x1f8a8a, need: ['kills', 3600] }, { id: 'pink', name: 'Pink', c: 0xe86a9a, need: ['chests', 100] },
    { id: 'red', name: 'Blood Red', c: 0xc8211b, need: ['headshots', 1600] }, { id: 'white', name: 'White', c: 0xf2e8d5, need: ['bestRound', 6] }, { id: 'goldh', name: 'Gold', c: 0xffcd5a, need: ['moneyEarned', 900000] },
  ],
  boots: [
    { id: 'work', name: 'Work Boots', a: 0x4E3324, b: 0x2a1c14 }, { id: 'cowboy', name: 'Cowboy Boots', a: 0x6a4a32, b: 0x3a2a22, style: 'spur' }, { id: 'sneak', name: 'Sneakers', a: 0xf2e8d5, b: 0xc8211b, style: 'low' },
    { id: 'rubber', name: 'Rubber Boots', a: 0xe8c81e, b: 0x2a2430, style: 'tall', need: ['runs', 18] }, { id: 'blackb', name: 'Black Boots', a: 0x1c1a20, b: 0x140d12, style: 'tall', need: ['kills', 2200] },
    { id: 'sandal', name: 'Sandals', a: 0x8a5a3c, b: 0x4E3324, style: 'sandal', need: ['chests', 90] }, { id: 'snake', name: 'Snakeskin', a: 0x4f8a5a, b: 0xffcd5a, style: 'spur', need: ['eliteKills', 150] },
    { id: 'peg', name: 'Peg Leg', a: 0x8a6a42, b: 0x3a2a22, style: 'peg', need: ['bosses', 8] }, { id: 'redb', name: 'Red Boots', a: 0xc8211b, b: 0xf2e8d5, style: 'spur', need: ['bestRound', 7] },
    { id: 'goldb', name: 'Gold Boots', a: 0xe0ac2a, b: 0xfff4d8, style: 'tall', need: ['moneyEarned', 1200000] },
  ],
  gloves: [
    { id: 'bare', name: 'Bare Hands' }, { id: 'leather', name: 'Leather', a: 0x4E3324, b: 0xC9A46A }, { id: 'blackg', name: 'Black', a: 0x1c1a20, b: 0x6a2030, need: ['kills', 300] },
    { id: 'whiteg', name: 'Dealer White', a: 0xece6d6, b: 0xE8B83A, need: ['chests', 75] }, { id: 'redg', name: 'Red', a: 0xc8211b, b: 0x140d12, need: ['headshots', 650] },
    { id: 'wraps', name: 'Hand Wraps', a: 0xd8d2c4, b: 0xb8b2a8, style: 'wrap', need: ['runs', 15] }, { id: 'boxing', name: 'Boxing Gloves', a: 0xc8211b, b: 0xf2e8d5, style: 'big', need: ['eliteKills', 60] },
    { id: 'hazg', name: 'Rubber', a: 0xe8c81e, b: 0x140d12, style: 'long', need: ['bosses', 8] }, { id: 'boneg', name: 'Bone', a: 0xe8dcc0, b: 0x3a2a30, need: ['mastered', 2] },
    { id: 'goldg', name: 'Gilded', a: 0xE0AC2A, b: 0xfff4d8, need: ['bestRound', 12] },
  ],
  neck: [
    { id: 'none', name: 'None' }, { id: 'kerchief', name: 'Neckerchief', a: 0xc8211b, b: 0xf2e8d5 }, { id: 'bolo', name: 'Bolo Tie', a: 0x140d12, b: 0x1f8a8a },
    { id: 'scarf', name: 'Long Scarf', a: 0x1f6a6a, b: 0xffcd5a, need: ['runs', 9] }, { id: 'bowtie', name: 'Bow Tie', a: 0xc8211b, b: 0x140d12, need: ['chests', 60] },
    { id: 'chain', name: 'Gold Chain', a: 0xffcd5a, b: 0xffcd5a, need: ['moneyEarned', 240000] }, { id: 'bandolier', name: 'Bandolier', a: 0x4E3324, b: 0xe0ac2a, need: ['kills', 3000] },
    { id: 'teeth', name: 'Tooth Necklace', a: 0x3a2a22, b: 0xf2e8d5, need: ['eliteKills', 100] }, { id: 'lei', name: 'Lei', a: 0xe86a9a, b: 0xffcd5a, need: ['bestRound', 5] },
    { id: 'noose', name: 'Cut Noose', a: 0xc9a46a, b: 0x8a6a42, need: ['bosses', 12] }, { id: 'medal', name: 'Medal', a: 0x34506a, b: 0xffcd5a, need: ['wins', 1] },
  ],
  shoulder: [
    { id: 'none', name: 'None' }, { id: 'patch', name: 'Leather Pad', a: 0x4E3324, b: 0xC9A46A }, { id: 'epaulette', name: 'Epaulettes', a: 0xffcd5a, b: 0xc8211b, need: ['kills', 1800] },
    { id: 'pauldron', name: 'Steel Pauldron', a: 0x9aa0aa, b: 0x46464e, need: ['bosses', 4] }, { id: 'spikes', name: 'Spiked Pads', a: 0x1c1a20, b: 0xd8d2c4, need: ['eliteKills', 200] },
    { id: 'crow', name: 'Crow', a: 0x1c1a20, b: 0xe0ac2a, need: ['headshots', 950] }, { id: 'parrot', name: 'Parrot', a: 0xc8211b, b: 0x1f8a4c, need: ['moneyEarned', 360000] },
    { id: 'fur', name: 'Fur Mantle', a: 0x6a4a32, b: 0xcdbf9a, need: ['bestRound', 8] }, { id: 'roll', name: 'Blanket Roll', a: 0xb0603a, b: 0xe8c24a, need: ['runs', 30] },
    { id: 'lantern', name: 'Lantern', a: 0x3a3a40, b: 0xffe27a, need: ['airKills', 350] },
  ],
  waist: [
    { id: 'belt', name: 'Plain Belt' }, { id: 'holster', name: 'Holster', a: 0x4E3324, b: 0x2a2a32 }, { id: 'twin', name: 'Twin Holsters', a: 0x3a2a22, b: 0x46464e, need: ['kills', 700] },
    { id: 'ammo', name: 'Ammo Belt', a: 0x4E3324, b: 0xe0ac2a, need: ['headshots', 500] }, { id: 'sash', name: 'Sash', a: 0xc8211b, b: 0xffcd5a, need: ['runs', 12] },
    { id: 'tool', name: 'Tool Belt', a: 0x8a6a42, b: 0x9aa0aa, need: ['tier3', 1] }, { id: 'rope', name: 'Rope Coil', a: 0xc9a46a, b: 0x8a6a42, need: ['airKills', 200] },
    { id: 'chips', name: 'Chip Pouch', a: 0x1f5a3c, b: 0xc8211b, need: ['chests', 150] }, { id: 'champ', name: 'Champion Belt', a: 0x140d12, b: 0xffcd5a, need: ['bosses', 16] },
    { id: 'skulls', name: 'Skull Trophies', a: 0x3a2a22, b: 0xf2e8d5, need: ['kills', 9600] },
  ],
  tone: [
    { id: 't1', name: 'Sand', c: 0xe2b48a }, { id: 't2', name: 'Clay', c: 0xc98a5e }, { id: 't3', name: 'Umber', c: 0x8a5a3c }, { id: 't4', name: 'Dusk', c: 0x5e3d2c },
    { id: 't5', name: 'Bone', c: 0xf2e8d5 }, { id: 't6', name: 'Rot', c: 0x8fae6a, need: ['kills', 6000] }, { id: 't7', name: 'Ghost', c: 0x9fd6e0, need: ['bestRound', 7] }, { id: 't8', name: 'Gold', c: 0xe0ac2a, need: ['wins', 1] },
  ],
  outfit: [
    { id: 'drifter', name: 'Drifter', a: 0xB0603A, b: 0xE8C24A, c: 0x4E3324, style: 'poncho' },
    { id: 'rancher', name: 'Rancher', a: 0x3f6f8a, b: 0xf2e8d5, c: 0x6a4a32, style: 'shirt' },
    { id: 'mechanic', name: 'Mechanic', a: 0x46586a, b: 0xffcd5a, c: 0x2a2430, style: 'overalls', need: ['runs', 9] },
    { id: 'undertaker', name: 'Undertaker', a: 0x24202a, b: 0x6a2030, c: 0xece6d6, style: 'coat', need: ['kills', 300] },
    { id: 'dealer', name: 'Dealer', a: 0x1f5a3c, b: 0xE8B83A, c: 0xece6d6, style: 'vest', need: ['chests', 75] },
    { id: 'lumber', name: 'Lumberjack', a: 0xc8211b, b: 0x140d12, c: 0x6a4a32, style: 'plaid', need: ['kills', 1800] },
    { id: 'sheriff', name: 'Sheriff', a: 0x8a6a42, b: 0xffcd5a, c: 0x3a2a22, style: 'badge', need: ['headshots', 400] },
    { id: 'convict', name: 'Convict', a: 0xf2e8d5, b: 0x140d12, c: 0x8a8a90, style: 'stripes', need: ['eliteKills', 50] },
    { id: 'pinstripe', name: 'Pinstripe', a: 0x2a2a3c, b: 0x8a8ab0, c: 0xf0ece0, style: 'suit', need: ['tier3', 1] },
    { id: 'showman', name: 'Showman', a: 0x7a2a8a, b: 0xffcd5a, c: 0xf2e8d5, style: 'coat', need: ['moneyEarned', 300000] },
    { id: 'hazmat', name: 'Hazmat', a: 0xe8c81e, b: 0x140d12, c: 0x3a3a40, style: 'hazmat', need: ['bosses', 8] },
    { id: 'bones', name: 'Bone Suit', a: 0x1c1a20, b: 0xf2e8d5, c: 0x9c1f24, style: 'bones', need: ['mastered', 2] },
    { id: 'highroller', name: 'High Roller', a: 0xf2e8d5, b: 0xc8211b, c: 0xffcd5a, style: 'suit', need: ['moneyEarned', 1500000] },
    { id: 'gilded', name: 'Gilded', a: 0x5a0f1c, b: 0xFFD860, c: 0xfff4d8, style: 'coat', need: ['bestRound', 12] },
  ],
  legs: [
    { id: 'denim', name: 'Denim', a: 0x34506a, b: 0x4E3324 }, { id: 'dust', name: 'Dusters', a: 0x8a7a5e, b: 0x3a2a22 },
    { id: 'black', name: 'Blacks', a: 0x1c1a20, b: 0x140d12, need: ['kills', 1200] }, { id: 'chaps', name: 'Chaps', a: 0x6a4a32, b: 0x8a5a3c, chaps: true, need: ['bestRound', 4] },
    { id: 'red', name: 'Reds', a: 0x8a1f24, b: 0xf2e8d5, need: ['headshots', 1200] }, { id: 'teal', name: 'Teals', a: 0x1f6a6a, b: 0xffcd5a, need: ['airKills', 300] },
    { id: 'white', name: 'Whites', a: 0xece6d6, b: 0xc8211b, need: ['chests', 200] }, { id: 'goldl', name: 'Gold Trim', a: 0x2a2430, b: 0xffcd5a, stripe: true, need: ['bosses', 16] },
  ],
  hat: [
    { id: 'none', name: 'None' }, { id: 'cowboy', name: 'Cowboy Hat', a: 0x3a2a22, b: 0xc8211b }, { id: 'cap', name: 'Trucker Cap', a: 0xc8211b, b: 0xf2e8d5 },
    { id: 'bowler', name: 'Bowler', a: 0x1c1a20, b: 0x6a2030, need: ['kills', 600] }, { id: 'beanie', name: 'Beanie', a: 0x1f6a6a, b: 0xffcd5a, need: ['runs', 15] },
    { id: 'visor', name: 'Dealer Visor', a: 0x1f8a4c, b: 0x140d12, need: ['chests', 30] }, { id: 'tophat', name: 'Top Hat', a: 0x140d12, b: 0xc8211b, need: ['bestRound', 5] },
    { id: 'sombrero', name: 'Sombrero', a: 0xe0b060, b: 0xc8211b, need: ['kills', 4800] }, { id: 'miner', name: 'Miner Helmet', a: 0xe8c81e, b: 0xfff4d8, need: ['bosses', 4] },
    { id: 'fez', name: 'Fez', a: 0xa01f24, b: 0xffcd5a, need: ['moneyEarned', 150000] }, { id: 'cone', name: 'Traffic Cone', a: 0xf07a1e, b: 0xf2e8d5, need: ['airKills', 150] },
    { id: 'whitehat', name: 'White Hat', a: 0xece6d6, b: 0xffcd5a, need: ['headshots', 2400] }, { id: 'horns', name: 'Horns', a: 0x8a1f24, b: 0xf2e8d5, need: ['eliteKills', 200] },
    { id: 'halo', name: 'Halo', a: 0xffe27a, b: 0xffe27a, need: ['bestRound', 9] }, { id: 'crown', name: 'Crown', a: 0xffcd5a, b: 0xc8211b, need: ['wins', 1] },
  ],
  face: [
    { id: 'none', name: 'None' }, { id: 'stache', name: 'Moustache', a: 0x3a2a22 }, { id: 'bandana', name: 'Bandana', a: 0xc8211b, b: 0xf2e8d5 },
    { id: 'specs', name: 'Round Specs', a: 0x140d12, need: ['runs', 6] }, { id: 'shades', name: 'Shades', a: 0x140d12, need: ['kills', 2400] },
    { id: 'beard', name: 'Beard', a: 0x5a3a26, need: ['bestRound', 3] }, { id: 'patch', name: 'Eyepatch', a: 0x140d12, need: ['headshots', 200] },
    { id: 'cigar', name: 'Cigar', a: 0x6a4a32, b: 0xff7a2a, need: ['bosses', 4] }, { id: 'monocle', name: 'Monocle', a: 0xffcd5a, need: ['moneyEarned', 600000] },
    { id: 'greybeard', name: 'Prospector Beard', a: 0xd8d2c4, need: ['kills', 12000] }, { id: 'gasmask', name: 'Gas Mask', a: 0x3a3a40, b: 0x9fd6e0, need: ['bosses', 12] },
    { id: 'skull', name: 'Skull Paint', a: 0xf2e8d5, b: 0x140d12, need: ['eliteKills', 100] }, { id: 'hockey', name: 'Goalie Mask', a: 0xece6d6, b: 0xc8211b, need: ['bestRound', 11] },
  ],
  back: [
    { id: 'none', name: 'None' }, { id: 'pack', name: 'Bedroll', a: 0x6a4a32, b: 0xc8211b }, { id: 'shotgun', name: 'Slung Shotgun', a: 0x3a2a22, b: 0x46464e, need: ['kills', 900] },
    { id: 'guitar', name: 'Guitar', a: 0xb0703a, b: 0x3a2a22, need: ['runs', 24] }, { id: 'cape', name: 'Cape', a: 0xc8211b, b: 0xffcd5a, need: ['bestRound', 6] },
    { id: 'sack', name: 'Money Sack', a: 0xcdbf9a, b: 0x1f8a4c, need: ['moneyEarned', 450000] }, { id: 'shovel', name: 'Shovel', a: 0x8a8a90, b: 0x6a4a32, need: ['bosses', 8] },
    { id: 'tank', name: 'Air Tank', a: 0xe8c81e, b: 0x3a3a40, need: ['airKills', 600] }, { id: 'tomb', name: 'Tombstone', a: 0x8a8a90, b: 0x5a5a62, need: ['kills', 24000] },
    { id: 'wings', name: 'Wings', a: 0xf2e8d5, b: 0xffe27a, need: ['wins', 1] },
  ],
};
export const DEFAULT_LOOK = { body: 'regular', tone: 't1', hair: 'short', haircol: 'brown', outfit: 'drifter', legs: 'denim', boots: 'work', gloves: 'bare', hat: 'cowboy', face: 'none', neck: 'none', shoulder: 'none', waist: 'belt', back: 'none' };
export const cosItem = (slot, id) => COSMETICS[slot].find((I) => I.id === id) || COSMETICS[slot][0];
export const lookString = (L) => SLOTS.map((s) => L[s]).join('|');
export function parseLook(str) { const p = String(str || '').split('|'), L = {}; SLOTS.forEach((s, i) => { L[s] = cosItem(s, p[i]).id; }); return L; }
