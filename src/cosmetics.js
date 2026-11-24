// Character cosmetics: what exists, what each piece looks like (palette + shape flags) and what unlocks it.
// `need` is [lifetime stat, amount]; no `need` means it is available from the start.
// The first fourteen keep their places: a look is sent to other players as these, in this order, and old looks still read.
export const SLOTS = ['body', 'tone', 'hair', 'haircol', 'outfit', 'legs', 'boots', 'gloves', 'hat', 'face', 'neck', 'shoulder', 'waist', 'back',
  'jaw', 'eyes', 'eyecol', 'brows', 'nose', 'mouth', 'lips', 'fhair', 'mark'];
export const SLOT_NAMES = { body: 'FRAME', tone: 'SKIN', hair: 'HAIR', haircol: 'HAIR COLOR', outfit: 'OUTFIT', legs: 'TROUSERS', boots: 'BOOTS', gloves: 'GLOVES', hat: 'HAT', face: 'FACEWEAR', neck: 'NECK', shoulder: 'SHOULDERS', waist: 'WAIST', back: 'BACK',
  jaw: 'HEAD SHAPE', eyes: 'EYES', eyecol: 'EYE COLOR', brows: 'BROWS', nose: 'NOSE', mouth: 'MOUTH', lips: 'LIPS', fhair: 'FACIAL HAIR', mark: 'MARKS' };
// the creator's pages, and what is on each
export const PAGES = [
  { id: 'build', name: 'BODY', slots: ['body'] },
  { id: 'face', name: 'FACE', slots: ['tone', 'jaw', 'eyes', 'eyecol', 'brows', 'nose', 'mouth', 'lips', 'mark'] },
  { id: 'hair', name: 'HAIR', slots: ['hair', 'haircol', 'fhair'] },
  { id: 'clothes', name: 'CLOTHES', slots: ['outfit', 'legs', 'boots', 'gloves'] },
  { id: 'extras', name: 'EXTRAS', slots: ['hat', 'face', 'neck', 'shoulder', 'waist', 'back'] },
];
// The body is shaped by sliders, each from -1 to 1 with 0 the ordinary build. The first three change how you play;
// the rest are only looks.
export const SHAPES = [
  { id: 'arms', name: 'Arm length', lo: 'Short', hi: 'Long', stat: true },
  { id: 'legs', name: 'Leg length', lo: 'Short', hi: 'Long', stat: true },
  { id: 'weight', name: 'Weight', lo: 'Skinny', hi: 'Heavy', stat: true },
  { id: 'muscle', name: 'Muscle', lo: 'Lean', hi: 'Brawny' },
  { id: 'shoulders', name: 'Shoulders', lo: 'Narrow', hi: 'Broad' },
  { id: 'chest', name: 'Chest', lo: 'Flat', hi: 'Full', zero: -1 },
  { id: 'hips', name: 'Hips', lo: 'Narrow', hi: 'Wide' },
  { id: 'rear', name: 'Backside', lo: 'Flat', hi: 'Full', zero: -1 },
  { id: 'groin', name: 'Groin', lo: 'Flat', hi: 'Full', zero: -1 },
  { id: 'head', name: 'Head size', lo: 'Small', hi: 'Large' },
];
// whole faces to start from: one press sets the head and every feature on it
export const FACE_PRESETS = [
  { name: 'Drifter', set: { jaw: 'oval', eyes: 'plain', brows: 'plain', nose: 'plain', mouth: 'plain', mark: 'none' } },
  { name: 'Bruiser', set: { jaw: 'strong', eyes: 'narrow', brows: 'thick', nose: 'broken', mouth: 'frown', mark: 'scarcheek' } },
  { name: 'Belle', set: { jaw: 'heart', eyes: 'lashes', brows: 'arched', nose: 'small', mouth: 'full', mark: 'mole' } },
  { name: 'Old Timer', set: { jaw: 'gaunt', eyes: 'bags', brows: 'thick', nose: 'long', mouth: 'thin', mark: 'wrinkles' } },
  { name: 'Charmer', set: { jaw: 'diamond', eyes: 'almond', brows: 'arched', nose: 'plain', mouth: 'smirk', mark: 'none' } },
  { name: 'Gentle', set: { jaw: 'soft', eyes: 'wide', brows: 'worried', nose: 'button', mouth: 'smile', mark: 'freckles' } },
  { name: 'Outlaw', set: { jaw: 'square', eyes: 'sleepy', brows: 'angry', nose: 'hook', mouth: 'smirk', mark: 'scareye' } },
  { name: 'Scholar', set: { jaw: 'narrow', eyes: 'down', brows: 'thin', nose: 'long', mouth: 'thin', mark: 'none' } },
  { name: 'Jolly', set: { jaw: 'round', eyes: 'wide', brows: 'plain', nose: 'broad', mouth: 'grin', mark: 'blush' } },
  { name: 'Stone', set: { jaw: 'square', eyes: 'narrow', brows: 'uni', nose: 'broad', mouth: 'plain', mark: 'none' } },
];
const cl = (v) => Math.max(-1, Math.min(1, +v || 0));
export const DEFAULT_SHAPE = { arms: 0, legs: 0, weight: 0, muscle: 0, shoulders: 0, chest: -1, hips: 0, rear: -1, groin: -1, head: 0 };
export const shapeOf = (look) => { const o = {}, s = (look && look.shape) || {}; for (const K of SHAPES) o[K.id] = s[K.id] === undefined ? DEFAULT_SHAPE[K.id] : cl(s[K.id]); return o; };
// What a body is worth in a fight. Long arms reach further with a blade and hold a kicking gun less steadily; long legs
// jump and dash further and run slower; weight is health against being easy to hit, and the thin can slip a blow.
export function bodyStats(look) {
  const s = shapeOf(look), a = s.arms, l = s.legs, w = s.weight;
  return {
    reach: 1 + 0.15 * a, spread: 1 + 0.2 * a,
    jump: 1 + 0.12 * Math.max(0, l), dash: 1 + 0.15 * l, speed: 1 - 0.08 * l,
    health: 1 + (w > 0 ? 0.25 : 0.2) * w, hit: 1 + 0.3 * Math.max(0, w), evade: 0.15 * Math.max(0, -w),
  };
}
const pc = (v) => `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`;
// the same, in words, for the creator: [text, good?] per line, by slider
export function bodyStatLines(look) {
  const B = bodyStats(look), s = shapeOf(look), L = { arms: [], legs: [], weight: [] };
  if (s.arms) { L.arms.push([`${pc(B.reach - 1)} melee reach`, s.arms > 0]); L.arms.push([`${pc(B.spread - 1)} spread on automatic guns`, s.arms < 0]); }
  if (s.legs > 0) { L.legs.push([`${pc(B.jump - 1)} jump height`, true]); L.legs.push([`${pc(B.dash - 1)} dash distance`, true]); L.legs.push([`${pc(B.speed - 1)} movement speed`, false]); }
  if (s.legs < 0) { L.legs.push([`${pc(B.speed - 1)} movement speed`, true]); L.legs.push([`${pc(B.dash - 1)} dash distance`, false]); }
  if (s.weight > 0) { L.weight.push([`${pc(B.health - 1)} health`, true]); L.weight.push([`${pc(B.hit - 1)} bigger to hit`, false]); }
  if (s.weight < 0) { L.weight.push([`${pc(B.health - 1)} health`, false]); L.weight.push([`${Math.round(B.evade * 100)}% chance to evade a hit`, true]); }
  return L;
}
const STAT_TEXT = { kills: 'Kill # enemies', headshots: 'Get # headshot kills', bestRound: 'Reach round #', bosses: 'Defeat # bosses', runs: 'Play # runs', eliteKills: 'Kill # elites',
  chests: 'Open # chests', moneyEarned: 'Earn $# in total', wins: 'Clear Deadwater Gulch', mastered: 'Master # guns', airKills: 'Get # kills in the air', tier3: 'Give one gun three modifiers' };
export const needText = (I) => (I.need ? STAT_TEXT[I.need[0]].replace('#', I.need[1].toLocaleString()).replace(/\b1 (bosses|runs|guns)/, (m, w) => '1 ' + w.replace(/e?s$/, '')) : '');

export const COSMETICS = {
  // the frame the sliders work on. f: 0 broad in the shoulder and straight in the waist, 1 narrow in the shoulder and wide in the hip
  body: [
    { id: 'regular', name: 'Masculine', f: 0 }, { id: 'fem', name: 'Feminine', f: 1 },
  ],
  hair: [
    { id: 'short', name: 'Short' }, { id: 'bald', name: 'Bald' }, { id: 'long', name: 'Long' }, { id: 'pomp', name: 'Pompadour' },
    { id: 'mohawk', name: 'Mohawk', need: ['kills', 1400] }, { id: 'braids', name: 'Braids', need: ['runs', 9] }, { id: 'bun', name: 'Top Knot', need: ['headshots', 300] },
    { id: 'afro', name: 'Afro', need: ['bestRound', 4] }, { id: 'mullet', name: 'Mullet', need: ['chests', 45] }, { id: 'spikes', name: 'Spikes', need: ['eliteKills', 75] },
    { id: 'buzz', name: 'Buzz Cut' }, { id: 'slick', name: 'Slicked Back' }, { id: 'part', name: 'Side Part' }, { id: 'bob', name: 'Bob' }, { id: 'pony', name: 'Ponytail' },
    { id: 'pigtails', name: 'Pigtails' }, { id: 'curly', name: 'Curls' }, { id: 'dreads', name: 'Locs' }, { id: 'undercut', name: 'Undercut' }, { id: 'flat', name: 'Flat Top' },
    { id: 'wavy', name: 'Long Waves' }, { id: 'bangs', name: 'Fringe' }, { id: 'rows', name: 'Cornrows' }, { id: 'horseshoe', name: 'Balding' },
  ],
  haircol: [
    { id: 'brown', name: 'Brown', c: 0x3a2a22 }, { id: 'black', name: 'Black', c: 0x1c1a20 }, { id: 'blonde', name: 'Blonde', c: 0xe0b860 }, { id: 'ginger', name: 'Ginger', c: 0xb0502a },
    { id: 'grey', name: 'Grey', c: 0xb8b2a8 }, { id: 'teal', name: 'Teal', c: 0x1f8a8a, need: ['kills', 3600] }, { id: 'pink', name: 'Pink', c: 0xe86a9a, need: ['chests', 100] },
    { id: 'red', name: 'Blood Red', c: 0xc8211b, need: ['headshots', 1600] }, { id: 'white', name: 'White', c: 0xf2e8d5, need: ['bestRound', 6] }, { id: 'goldh', name: 'Gold', c: 0xffcd5a, need: ['moneyEarned', 900000] },
    { id: 'dkbrown', name: 'Dark Brown', c: 0x241812 }, { id: 'auburn', name: 'Auburn', c: 0x7a2e1a }, { id: 'sandy', name: 'Sandy', c: 0xb89060 }, { id: 'platinum', name: 'Platinum', c: 0xe8e0c8 },
    { id: 'silver', name: 'Silver', c: 0x8e9098 }, { id: 'blue', name: 'Blue', c: 0x2a5ad0 }, { id: 'green', name: 'Green', c: 0x3f9a4a }, { id: 'purple', name: 'Purple', c: 0x7a3ab0 },
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
    { id: 'whiteg', name: 'Parlor White', a: 0xece6d6, b: 0xE8B83A, need: ['chests', 75] }, { id: 'redg', name: 'Red', a: 0xc8211b, b: 0x140d12, need: ['headshots', 650] },
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
    { id: 'chips', name: 'Coin Pouch', a: 0x1f5a3c, b: 0xc8211b, need: ['chests', 150] }, { id: 'champ', name: 'Champion Belt', a: 0x140d12, b: 0xffcd5a, need: ['bosses', 16] },
    { id: 'skulls', name: 'Skull Trophies', a: 0x3a2a22, b: 0xf2e8d5, need: ['kills', 9600] },
  ],
  tone: [
    { id: 't1', name: 'Sand', c: 0xe2b48a }, { id: 't2', name: 'Clay', c: 0xc98a5e }, { id: 't3', name: 'Umber', c: 0x8a5a3c }, { id: 't4', name: 'Dusk', c: 0x5e3d2c },
    { id: 't5', name: 'Bone', c: 0xf2e8d5 }, { id: 't6', name: 'Rot', c: 0x8fae6a, need: ['kills', 6000] }, { id: 't7', name: 'Ghost', c: 0x9fd6e0, need: ['bestRound', 7] }, { id: 't8', name: 'Gold', c: 0xe0ac2a, need: ['wins', 1] },
    { id: 't9', name: 'Porcelain', c: 0xf3d3bd }, { id: 't10', name: 'Honey', c: 0xd9a06c }, { id: 't11', name: 'Bronze', c: 0xa86c44 }, { id: 't12', name: 'Chestnut', c: 0x74472e }, { id: 't13', name: 'Ebony', c: 0x40291f },
  ],
  outfit: [
    { id: 'drifter', name: 'Drifter', a: 0xB0603A, b: 0xE8C24A, c: 0x4E3324, style: 'poncho' },
    { id: 'rancher', name: 'Rancher', a: 0x3f6f8a, b: 0xf2e8d5, c: 0x6a4a32, style: 'shirt' },
    { id: 'mechanic', name: 'Mechanic', a: 0x46586a, b: 0xffcd5a, c: 0x2a2430, style: 'overalls', need: ['runs', 9] },
    { id: 'undertaker', name: 'Undertaker', a: 0x24202a, b: 0x6a2030, c: 0xece6d6, style: 'coat', need: ['kills', 300] },
    { id: 'dealer', name: 'Barkeep', a: 0x1f5a3c, b: 0xE8B83A, c: 0xece6d6, style: 'vest', need: ['chests', 75] },
    { id: 'lumber', name: 'Lumberjack', a: 0xc8211b, b: 0x140d12, c: 0x6a4a32, style: 'plaid', need: ['kills', 1800] },
    { id: 'sheriff', name: 'Sheriff', a: 0x8a6a42, b: 0xffcd5a, c: 0x3a2a22, style: 'badge', need: ['headshots', 400] },
    { id: 'convict', name: 'Convict', a: 0xf2e8d5, b: 0x140d12, c: 0x8a8a90, style: 'stripes', need: ['eliteKills', 50] },
    { id: 'pinstripe', name: 'Pinstripe', a: 0x2a2a3c, b: 0x8a8ab0, c: 0xf0ece0, style: 'suit', need: ['tier3', 1] },
    { id: 'showman', name: 'Showman', a: 0x7a2a8a, b: 0xffcd5a, c: 0xf2e8d5, style: 'coat', need: ['moneyEarned', 300000] },
    { id: 'hazmat', name: 'Hazmat', a: 0xe8c81e, b: 0x140d12, c: 0x3a3a40, style: 'hazmat', need: ['bosses', 8] },
    { id: 'bones', name: 'Bone Suit', a: 0x1c1a20, b: 0xf2e8d5, c: 0x9c1f24, style: 'bones', need: ['mastered', 2] },
    { id: 'highroller', name: 'Cattle Baron', a: 0xf2e8d5, b: 0xc8211b, c: 0xffcd5a, style: 'suit', need: ['moneyEarned', 1500000] },
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
    { id: 'visor', name: 'Telegraph Visor', a: 0x1f8a4c, b: 0x140d12, need: ['chests', 30] }, { id: 'tophat', name: 'Top Hat', a: 0x140d12, b: 0xc8211b, need: ['bestRound', 5] },
    { id: 'sombrero', name: 'Sombrero', a: 0xe0b060, b: 0xc8211b, need: ['kills', 4800] }, { id: 'miner', name: 'Miner Helmet', a: 0xe8c81e, b: 0xfff4d8, need: ['bosses', 4] },
    { id: 'fez', name: 'Fez', a: 0xa01f24, b: 0xffcd5a, need: ['moneyEarned', 150000] }, { id: 'cone', name: 'Traffic Cone', a: 0xf07a1e, b: 0xf2e8d5, need: ['airKills', 150] },
    { id: 'whitehat', name: 'White Hat', a: 0xece6d6, b: 0xffcd5a, need: ['headshots', 2400] }, { id: 'horns', name: 'Horns', a: 0x8a1f24, b: 0xf2e8d5, need: ['eliteKills', 200] },
    { id: 'halo', name: 'Halo', a: 0xffe27a, b: 0xffe27a, need: ['bestRound', 9] }, { id: 'crown', name: 'Crown', a: 0xffcd5a, b: 0xc8211b, need: ['wins', 1] },
  ],
  face: [
    { id: 'none', name: 'None' }, { id: 'bandana', name: 'Bandana', a: 0xc8211b, b: 0xf2e8d5 },
    { id: 'specs', name: 'Round Specs', a: 0x140d12, need: ['runs', 6] }, { id: 'shades', name: 'Shades', a: 0x140d12, need: ['kills', 2400] },
    { id: 'patch', name: 'Eyepatch', a: 0x140d12, need: ['headshots', 200] },
    { id: 'cigar', name: 'Cigar', a: 0x6a4a32, b: 0xff7a2a, need: ['bosses', 4] }, { id: 'monocle', name: 'Monocle', a: 0xffcd5a, need: ['moneyEarned', 600000] },
    { id: 'gasmask', name: 'Gas Mask', a: 0x3a3a40, b: 0x9fd6e0, need: ['bosses', 12] },
    { id: 'skull', name: 'Skull Paint', a: 0xf2e8d5, b: 0x140d12, need: ['eliteKills', 100] }, { id: 'hockey', name: 'Goalie Mask', a: 0xece6d6, b: 0xc8211b, need: ['bestRound', 11] },
  ],
  jaw: [
    { id: 'oval', name: 'Oval' }, { id: 'square', name: 'Square' }, { id: 'round', name: 'Round' }, { id: 'narrow', name: 'Long' }, { id: 'heart', name: 'Heart' }, { id: 'strong', name: 'Lantern Jaw' },
    { id: 'soft', name: 'Full Cheeks' }, { id: 'gaunt', name: 'Gaunt' }, { id: 'diamond', name: 'Diamond' },
  ],
  eyes: [
    { id: 'plain', name: 'Plain' }, { id: 'wide', name: 'Wide' }, { id: 'narrow', name: 'Narrow' }, { id: 'sleepy', name: 'Heavy-lidded' }, { id: 'lashes', name: 'Lashes' },
    { id: 'almond', name: 'Upturned' }, { id: 'down', name: 'Downturned' }, { id: 'bags', name: 'Tired' },
  ],
  eyecol: [
    { id: 'brown', name: 'Brown', c: 0x4a2c1a }, { id: 'dark', name: 'Dark', c: 0x1a1210 }, { id: 'hazel', name: 'Hazel', c: 0x80602a }, { id: 'green', name: 'Green', c: 0x3f7a4a }, { id: 'blue', name: 'Blue', c: 0x3a6ea8 },
    { id: 'grey', name: 'Grey', c: 0x7a8088 }, { id: 'amber', name: 'Amber', c: 0xc08a2a }, { id: 'violet', name: 'Violet', c: 0x7a4aa8 }, { id: 'red', name: 'Red', c: 0xb01f24 }, { id: 'white', name: 'Pale', c: 0xc8d8e0 },
  ],
  brows: [
    { id: 'plain', name: 'Plain' }, { id: 'thick', name: 'Thick' }, { id: 'thin', name: 'Thin' }, { id: 'arched', name: 'Arched' }, { id: 'angry', name: 'Scowl' }, { id: 'worried', name: 'Worried' },
    { id: 'uni', name: 'Monobrow' }, { id: 'none', name: 'None' },
  ],
  nose: [
    { id: 'plain', name: 'Plain' }, { id: 'small', name: 'Small' }, { id: 'broad', name: 'Broad' }, { id: 'long', name: 'Long' }, { id: 'button', name: 'Button' }, { id: 'hook', name: 'Hooked' }, { id: 'broken', name: 'Broken' },
  ],
  mouth: [
    { id: 'plain', name: 'Plain' }, { id: 'smile', name: 'Smile' }, { id: 'frown', name: 'Frown' }, { id: 'smirk', name: 'Smirk' }, { id: 'full', name: 'Full Lips' }, { id: 'grin', name: 'Grin' }, { id: 'thin', name: 'Thin' },
  ],
  lips: [
    { id: 'natural', name: 'Natural' }, { id: 'red', name: 'Red', c: 0xb01f24 }, { id: 'rose', name: 'Rose', c: 0xd0607a }, { id: 'coral', name: 'Coral', c: 0xe07a5a }, { id: 'plum', name: 'Plum', c: 0x6a2a4a }, { id: 'black', name: 'Black', c: 0x1c1418 },
  ],
  // facial hair takes the colour of the hair
  fhair: [
    { id: 'none', name: 'None' }, { id: 'stubble', name: 'Stubble' }, { id: 'stache', name: 'Moustache' }, { id: 'pencil', name: 'Pencil' }, { id: 'handlebar', name: 'Handlebar' }, { id: 'horseshoe', name: 'Horseshoe' },
    { id: 'walrus', name: 'Walrus' }, { id: 'soul', name: 'Soul Patch' }, { id: 'goatee', name: 'Goatee' }, { id: 'vandyke', name: 'Van Dyke' }, { id: 'chinstrap', name: 'Chin Strap' }, { id: 'chops', name: 'Mutton Chops' },
    { id: 'beard', name: 'Full Beard' }, { id: 'long', name: 'Prospector Beard' },
  ],
  mark: [
    { id: 'none', name: 'None' }, { id: 'freckles', name: 'Freckles' }, { id: 'mole', name: 'Beauty Mark' }, { id: 'blush', name: 'Blush' }, { id: 'scareye', name: 'Scar: Eye' }, { id: 'scarcheek', name: 'Scar: Cheek' },
    { id: 'scarlip', name: 'Scar: Lip' }, { id: 'liner', name: 'Eyeliner' }, { id: 'shadow', name: 'Eyeshadow', c: 0x6a4a9a }, { id: 'smoky', name: 'Smoky Eyes', c: 0x2a2028 }, { id: 'warpaint', name: 'War Paint', c: 0xc8211b },
    { id: 'band', name: 'Painted Mask', c: 0x1c1a20 }, { id: 'tear', name: 'Teardrop' }, { id: 'wrinkles', name: 'Weathered' },
  ],
  back: [
    { id: 'none', name: 'None' }, { id: 'pack', name: 'Bedroll', a: 0x6a4a32, b: 0xc8211b }, { id: 'shotgun', name: 'Slung Shotgun', a: 0x3a2a22, b: 0x46464e, need: ['kills', 900] },
    { id: 'guitar', name: 'Guitar', a: 0xb0703a, b: 0x3a2a22, need: ['runs', 24] }, { id: 'cape', name: 'Cape', a: 0xc8211b, b: 0xffcd5a, need: ['bestRound', 6] },
    { id: 'sack', name: 'Money Sack', a: 0xcdbf9a, b: 0x1f8a4c, need: ['moneyEarned', 450000] }, { id: 'shovel', name: 'Shovel', a: 0x8a8a90, b: 0x6a4a32, need: ['bosses', 8] },
    { id: 'tank', name: 'Air Tank', a: 0xe8c81e, b: 0x3a3a40, need: ['airKills', 600] }, { id: 'tomb', name: 'Tombstone', a: 0x8a8a90, b: 0x5a5a62, need: ['kills', 24000] },
    { id: 'wings', name: 'Wings', a: 0xf2e8d5, b: 0xffe27a, need: ['wins', 1] },
  ],
};
export const DEFAULT_LOOK = { body: 'regular', tone: 't1', hair: 'short', haircol: 'brown', outfit: 'drifter', legs: 'denim', boots: 'work', gloves: 'bare', hat: 'cowboy', face: 'none', neck: 'none', shoulder: 'none', waist: 'belt', back: 'none',
  jaw: 'oval', eyes: 'plain', eyecol: 'brown', brows: 'plain', nose: 'plain', mouth: 'plain', lips: 'natural', fhair: 'none', mark: 'none' };
export const cosItem = (slot, id) => COSMETICS[slot].find((I) => I.id === id) || COSMETICS[slot][0];
// A look as one string, for other players: the pieces in order, then the body's sliders as one letter each (a = -1, k = 0, u = 1).
export const shapeString = (sh) => SHAPES.map((K) => String.fromCharCode(97 + Math.round((cl(sh[K.id] === undefined ? DEFAULT_SHAPE[K.id] : sh[K.id]) + 1) * 10))).join('');
export function parseShape(str) { const o = Object.assign({}, DEFAULT_SHAPE); if (typeof str !== 'string' || !/^[a-u]+$/.test(str)) return o; SHAPES.forEach((K, i) => { if (i < str.length) o[K.id] = (str.charCodeAt(i) - 97) / 10 - 1; }); return o; }
export const lookString = (L) => SLOTS.map((s) => L[s]).join('|') + '|~' + shapeString(shapeOf(L));
export function parseLook(str) {
  const p = String(str || '').split('|'), L = {}, sh = p.find((q) => q[0] === '~');
  SLOTS.forEach((s, i) => { const v = p[i]; L[s] = v && v[0] !== '~' && COSMETICS[s].some((I) => I.id === v) ? v : DEFAULT_LOOK[s]; });
  // looks from before facial hair had a slot of its own
  if (!sh) { const of = p[9]; if (of === 'stache') L.fhair = 'horseshoe'; else if (of === 'beard') L.fhair = 'beard'; else if (of === 'greybeard') L.fhair = 'long'; }
  L.shape = parseShape(sh ? sh.slice(1) : '');
  return L;
}
