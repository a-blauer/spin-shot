// The stations that come up after a room, sculpted in the world's own make (the same kit and colours as the village
// and the destinations: oak, red shingles, brass, iron, cream). UE frame: X is the front (where you stand), Y right,
// Z up, cm. Each returns [key, build] for world.shapeId; the parts that glow or move are the station's own (interact.js).
import { shapeB as shape } from './propkit.js';
import { dark, mix } from './village_shapes.js';

const C = { oak: 0x8a6440, oakD: 0x5e4228, oakL: 0xa8804e, plank: [0x8a6a48, 0x7a5c3e, 0x846444], red: [0x8a3a2c, 0x7a3226, 0x96402e],
  brass: 0xc8963c, brassD: 0x9a6e2a, iron: 0x3a3a40, ironL: 0x6a6a72, cream: 0xe8dcc0, cloth: 0x3e5e3a, stone: 0x9a9488, copper: 0xb0683a, rope: 0xb09a6c };
const rng = (seed) => { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };

// a deck of planks the station stands on: boards along Y, a dark under-deck so no gap shows the ground
const deck = (G, x0, x1, hy, h = 8) => { G.box((x0 + x1) / 2, 0, h / 2 - 0.5, (x1 - x0) / 2 - 1, hy - 1, h / 2 - 0.5, 0x2a2018); for (let x = x0 + 11; x < x1 - 4; x += 22) G.box(x, 0, h - 1, 10.4, hy, 1.6, C.plank[Math.round(x / 22) & 1 ? 1 : 0]); };
// a red shingled pent roof: courses of shingles from the back (x0, z0) down to the front (x1, z1), hy either side
const pentRoof = (G, x0, z0, x1, z1, hy, rows = 5, seed = 1) => {
  const L = Math.hypot(x1 - x0, z0 - z1), nx = (z0 - z1) / L, nz = (x1 - x0) / L;
  G.surf((u, v) => { const x = x0 + (x1 - x0) * v, z = z0 + (z1 - z0) * v, lift = ((v * rows) % 1) * 3; return [x + nx * lift, -hy + u * hy * 2, z + nz * lift + 3]; }, 0, 1, 12, 0, 1, rows * 2, (u, v) => C.red[(Math.floor(v * rows) + Math.floor(u * 16) * 5 + seed) % 3]);
  G.surf((u, v) => { const x = x0 + (x1 - x0) * v, z = z0 + (z1 - z0) * v; return [x - nx * 4, -hy + u * hy * 2, z - nz * 4]; }, 0, 1, 2, 0, 1, 2, 0x4e3a2a);
  G.box(x1, 0, z1 - 2, 3, hy + 2, 6, 0x6a2a20);
};
// a carved name board in a frame: the board's face at x = x0 + 4 (the text goes just in front of it)
const nameBoard = (G, x0, y0, y1, z0, z1) => { G.box(x0, (y0 + y1) / 2, (z0 + z1) / 2, 4, (y1 - y0) / 2, (z1 - z0) / 2, 0x6a2a20); for (const z of [z0, z1]) G.box(x0 + 2, (y0 + y1) / 2, z, 4, (y1 - y0) / 2 + 4, 4, C.oakD); for (const y of [y0, y1]) G.box(x0 + 2, y, (z0 + z1) / 2, 4, 4, (z1 - z0) / 2 + 4, C.oakD); };

// ---- THE WORKBENCH: a tinker's bench under its own little red roof. An oak bench on stout legs with drawers and a
// shelf under, a brass-jawed vise on the front corner, a cloth with parts laid out, an oil can; behind it a board of
// tools hung on pegs and a shelf of jars; the name board on top of the roof. Footprint x -14..150, y -205..205.
export function workbenchShape() {
  return ['st_bench3', shape((G) => {
    const R = rng(71);
    deck(G, -14, 150, 205);
    // the back: two posts, boards between, a rail for the tools, the shelf of jars
    for (const y of [-196, 196]) G.box(4, y, 214, 9, 9, 206, C.oakD);
    G.box(-2, 0, 214, 3, 190, 206, 0x2a2018);
    for (let y = -178; y < 182; y += 24) G.box(3, y, 214, 2.4, 11.4, 204, C.plank[Math.round(y / 24) & 1]);
    for (const z of [180, 300]) G.box(8, 0, z, 4, 188, 5, C.oakD);
    G.box(22, 90, 330, 18, 92, 3, C.oakD); for (const y of [12, 168]) G.box(12, y, 316, 8, 3, 14, C.oakD);
    for (const [y, h, col] of [[30, 30, 0xb83a2a], [62, 24, 0x3a6ab0], [92, 34, 0xd8a83a], [124, 26, 0x6a9a4a], [154, 30, 0xa8a8b0]]) { G.lathe([[10, 333], [11, 333 + h * 0.8], [7, 333 + h], [7, 333 + h + 6], [0, 333 + h + 6]], (k) => (k < 2 ? mix(col, 0x9ab8b0, 0.35) : C.brassD), 10, [22, y, 0]); }
    // tools on pegs: hammer, saw, wrench, brace, file, calipers
    const peg = (y, z) => G.box(9, y, z, 5, 2, 2, C.brass);
    peg(-150, 286); G.box(13, -150, 250, 2.4, 3, 32, C.oakL); G.box(13, -150, 282, 4, 16, 5, C.iron);
    peg(-104, 286); G.box(12, -104, 236, 1, 22, 44, C.ironL); G.box(13, -104, 286, 3, 16, 8, C.oakL);
    peg(-62, 286); G.box(13, -62, 252, 2, 3, 30, C.ironL); G.box(13, -62, 284, 2, 9, 6, C.ironL);
    G.tube([[13, -20, 290], [13, -20, 262], [13, -4, 252], [13, -20, 236], [13, -20, 214]], 2.2, C.ironL, { S: 5, M: 10 }); G.box(13, -20, 290, 4, 5, 5, C.oakL); peg(-20, 296);
    peg(20, 286); G.box(12.5, 20, 250, 1.6, 3, 32, C.iron); G.box(13, 20, 282, 3, 3.5, 7, C.oakD);
    peg(56, 286); for (const s of [-1, 1]) G.box(12.5, 56 + s * 6, 256, 1.6, 1.6, 28, C.brass); G.box(12.5, 56, 284, 2, 10, 2, C.brass);
    // the bench: thick oak top, an edge board, legs, stretchers, the shelf, three drawers with brass pulls
    G.box(78, 0, 103, 64, 192, 7, C.oak); G.box(143, 0, 98, 2, 194, 10, C.oakD);
    for (const y of [-180, 180]) for (const x of [24, 132]) G.box(x, y, 52, 8, 8, 44, C.oakD);
    for (const y of [-180, 180]) G.box(78, y, 26, 54, 5, 4, C.oakD);
    G.box(78, 0, 32, 56, 178, 3, C.plank[0]);
    G.box(110, 0, 82, 28, 170, 14, C.oakD);
    for (const y of [-112, 0, 112]) { G.box(140, y, 83, 2, 50, 11, C.oakL); G.box(142.5, y, 83, 1.2, 9, 2.2, C.brass); }
    // under the bench: a crate of scrap, a coil of rope, a bucket
    G.box(70, -100, 58, 40, 50, 22, C.oakL); for (const y of [-130, -100, -70]) G.box(70, y, 82, 30, 6, 3, C.ironL);
    G.tube(Array.from({ length: 25 }, (_, i) => { const a = i * 0.9; return [80 + Math.cos(a) * 26, 70 + Math.sin(a) * 26, 38 + i * 0.6]; }), 3.4, C.rope, { S: 5, M: 48 });
    G.lathe([[16, 35], [20, 70], [18, 70], [14, 37]], C.ironL, 12, [60, 140, 0]);
    // the vise on the front left corner: an iron body, brass jaws, the screw and its tommy bar
    G.box(124, -150, 116, 16, 22, 8, C.iron); G.box(130, -150, 132, 12, 20, 10, C.brass); G.box(150, -150, 132, 6, 20, 10, C.brass);
    G.tube([[150, -150, 124], [176, -150, 124]], 3, C.iron, { S: 6, M: 3 }); G.tube([[176, -168, 124], [176, -132, 124]], 2, C.ironL, { S: 5, M: 3 });
    // in the vise, a gun's action being worked on: the receiver, a barrel stub
    G.box(140, -150, 150, 22, 9, 10, C.ironL); G.tube([[140, -142, 152], [140, -70, 152]], 4.6, C.iron, { S: 8, M: 4 });
    // the cloth and the parts on it: a spring, gears, screws; an oil can; a small anvil block on the right end
    G.box(84, 20, 110.5, 40, 70, 0.6, C.cloth);
    G.tube(Array.from({ length: 30 }, (_, i) => { const a = i * 0.7; return [70 + i * 0.9, 10 + Math.cos(a) * 4, 115 + Math.sin(a) * 4]; }), 1.1, C.ironL, { S: 4, M: 60 });
    for (const [x, y, r] of [[96, 50, 12], [108, 30, 8]]) { G.lathe([[0, 111], [r, 111], [r, 114], [0, 114]], C.brass, 12, [x, y, 0]); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; G.box(x + Math.cos(a) * (r + 1.5), y + Math.sin(a) * (r + 1.5), 112.5, 1.6, 1.6, 1.5, C.brass); } }
    for (let i = 0; i < 5; i++) G.box(70 + R() * 30, -20 + R() * 30, 111.6, 1.2, 4, 1.2, C.ironL);
    G.lathe([[13, 110], [14, 124], [10, 134], [4, 140], [3, 146], [0, 146]], C.brass, 12, [60, 110, 0]); G.tube([[66, 118, 136], [76, 130, 146]], 1.6, C.brass, { S: 5, M: 3 });
    G.box(100, 150, 116, 18, 24, 6, C.iron); G.box(100, 150, 126, 14, 32, 4, C.iron); G.box(100, 178, 126, 8, 6, 3, C.iron);
    // the roof over it all: posts carry it forward on brackets; red shingles down to a drip board
    for (const y of [-196, 196]) G.tube([[8, y, 380], [70, y, 421]], 4.5, C.oakD, { S: 6, M: 4 });
    pentRoof(G, -16, 450, 150, 398, 214, 6, 1);
    for (const y of [-196, 196]) G.box(4, y, 431, 9, 9, 15, C.oakD);
    // the name board stands up on the roof's back edge
    nameBoard(G, 2, -170, 170, 462, 534);
    for (const y of [-120, 120]) G.box(0, y, 452, 4, 4, 12, C.oakD);
  })];
}
// where the lantern hangs (its flame is the station's), the gear turns, the name goes
export const BENCH = { lantern: [112, 176, 330], gear: [110, 70, 112], text: [9, 0, 506] };

// ---- THE COMPRESSOR: an old screw press, oak and iron, on its own deck. Two great oak posts in iron bands, a crossbeam
// bolted through, the brass screw down through it with a spoked iron wheel on top; the bed below with two copper dishes
// for the two parts, a chute at the front where the one comes out into a tray. A gauge on one post, a lever on the
// other, the name board on the crossbeam. Footprint x -10..160, y -165..165; the platen is the station's (it moves).
export function pressShape() {
  return ['st_press3', shape((G) => {
    deck(G, -10, 160, 168);
    // the base: a heavy oak block, iron corner straps
    G.box(80, 0, 36, 58, 150, 28, C.oakD); for (const y of [-150, 150]) for (const x of [24, 136]) G.box(x, y, 36, 4, 4, 28, C.iron);
    // the bed: an iron plate with two copper dishes let into it
    G.box(80, 0, 68, 52, 112, 4, C.iron);
    for (const y of [-52, 52]) G.lathe([[0, 70], [30, 70], [34, 74], [33, 78], [28, 76], [0, 73]], (k) => (k < 2 ? C.copper : k < 4 ? mix(C.copper, 0xffffff, 0.2) : dark(C.copper, 0.6)), 16, [80, y, 0]);
    // the posts: oak, iron bands, standing on the base and through the crossbeam
    for (const y of [-128, 128]) { G.box(80, y, 240, 20, 18, 176, C.oak); for (const z of [110, 200, 290, 380]) G.box(80, y, z, 21.5, 19.5, 5, C.iron); }
    // the crossbeam, bolted through each post
    G.box(80, 0, 430, 28, 158, 22, C.oakD); for (const y of [-128, 128]) for (const z of [420, 440]) G.box(51, y, z, 2, 5, 5, C.ironL);
    G.box(80, 0, 454, 30, 40, 4, C.iron);
    // the screw: brass, threads all down it, through the beam; the spoked wheel on top
    G.tube([[80, 0, 300], [80, 0, 488]], 9, C.brass, { S: 10, M: 6 }); for (let z = 306; z < 400; z += 9) G.lathe([[9, z], [11.5, z + 3], [9, z + 6]], C.brassD, 10, [80, 0, 0]);
    G.lathe([[0, 484], [20, 484], [20, 498], [0, 498]], C.iron, 12, [80, 0, 0]);
    G.tube(Array.from({ length: 25 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return [80 + Math.cos(a) * 86, Math.sin(a) * 86, 492]; }), 6, C.iron, { S: 7, M: 48, caps: false });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; G.tube([[80 + Math.cos(a) * 18, Math.sin(a) * 18, 492], [80 + Math.cos(a) * 84, Math.sin(a) * 84, 492]], 3.4, C.iron, { S: 6, M: 3 }); if (i % 2 === 0) G.tube([[80 + Math.cos(a) * 86, Math.sin(a) * 86, 492], [80 + Math.cos(a) * 92, Math.sin(a) * 92, 512]], 3.6, C.oakL, { S: 6, M: 3 }); }
    // the chute: a copper trough out of the bed's front down to a little tray on the deck
    G.surf((u, v) => { const x = 132 + v * 22, z = 66 - v * 36, w = 18; return [x, (u - 0.5) * 2 * w, z - Math.sin(u * Math.PI) * 8]; }, 0, 1, 4, 0, 1, 3, C.copper);
    G.box(148, 0, 16, 12, 30, 8, C.oakL); G.box(148, 0, 12, 10, 28, 6, 0x2a2018);
    // a gauge on the left post, a lever on the right
    { const b = G.n; G.lathe([[0, 0], [16, 0], [16, 5], [0, 5]], C.brass, 14, [0, 0, 0]); G.place(b, { x: 100, y: -128, z: 330, pitch: 90 }); }
    G.tube([[100, 128, 230], [130, 128, 290]], 3, C.iron, { S: 6, M: 3 }); G.lathe([[7, 288], [8, 292], [8, 302], [0, 306]], 0xa8302a, 10, [131, 128, 0]);
    // the name board across the crossbeam's face, a brass plate on the base for the rule
    G.box(110, 0, 430, 3, 146, 19, 0x6a2a20); for (const z of [409, 451]) G.box(112, 0, z, 3, 150, 3, C.oakL); for (const y of [-148, 148]) G.box(112, y, 430, 3, 3, 22, C.oakL);
  })];
}
export const PRESS = { platen: [80, 0, 288], dishes: [[80, -52, 75], [80, 52, 75]], gauge: [103, -128, 330], text: [114, 0, 438], rule: [114, 0, 417] };
