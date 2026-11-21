// The maps. Each one is its own run: its own ground, its own creatures, its own bosses and its own last room.
// Nothing from one map turns up on another.
import * as THREE from 'three';
import { DATA } from './data.js';
import { buildMine, MINE_LOOT } from './map_mine.js';
import { buildFrost, FROST_LOOT, frostAmbient } from './map_frost.js';
import { buildBayou, BAYOU_LOOT, bayouAmbient } from './map_bayou.js';

const C = (h) => new THREE.Color(h);
const sun = (x, y, z) => new THREE.Vector3(x, z, y).normalize();

export const MAPS = [
  { id: 'gulch', name: 'Deadwater Gulch', blurb: 'A dead frontier town, its outskirts and the Badlands beyond. Wide streets and rooftops.', pack: 0, loading: 'Building Deadwater Gulch...',
    final: { arena: 'THE CRYPT', open: 'THE CRYPT IS OPEN', toast: 'Step into the light to face the Founder', under: 'BENEATH DEADWATER', acts: ['THE SEAL CRACKS', 'DEADWATER BURNS'], taunt: 'No one leaves Deadwater',
      win: 'Deadwater Gulch is cleared. The Founder is back in the ground.' } },
  { id: 'mine', name: 'Blackwater Mine', blurb: 'Timbered galleries, a flooded cavern and the seam at the bottom. Close quarters by lamplight.', pack: 1, loading: 'Going down the shaft...',
    build: buildMine, loot: MINE_LOOT, noSky: true, wind: 0.06, spawnYaw: Math.PI,
    // one mood per district, blended as you walk between them
    palette(P, zone) {
      P.sky = C(0x05070a); P.fogStart = 600; P.fogDensity = 0.00036; P.fogMax = 0.93; P.sun = sun(0.25, -0.3, 0.9);
      P.lit.set(1.04, 0.98, 0.9, 1.04); P.shadow.set(0.56, 0.58, 0.7, 0.84);
      switch (zone) {
        case 0: P.fog = C(0x3a2c20); P.lit.set(1.08, 0.97, 0.84, 1.05); P.shadow.set(0.62, 0.54, 0.54, 0.84); break;                         // the lift landing: lamp light
        case 1: P.fog = C(0x2a322c); P.shadow.set(0.54, 0.62, 0.6, 0.84); break;                                                             // the galleries
        case 2: P.fog = C(0x143a46); P.shadow.set(0.48, 0.64, 0.78, 0.84); P.sprite.setRGB(0.9, 1, 1.05); P.fogStart = 900; P.fogDensity = 0.00024; P.fogMax = 0.86; break;   // the flooded cavern
        case 3: P.fog = C(0x3a2640); P.shadow.set(0.62, 0.54, 0.76, 0.84); P.sprite.setRGB(1, 0.94, 1.05); P.fogStart = 900; P.fogDensity = 0.00026; P.fogMax = 0.86; break;    // the crystal seam
        case 4: P.fog = C(0x422414); P.lit.set(1.08, 0.95, 0.82, 1.05); P.shadow.set(0.66, 0.5, 0.48, 0.84); P.fogStart = 900; P.fogDensity = 0.00024; P.fogMax = 0.86; break;                      // the works
        case 'vault': P.fog = C(0x0a2622); P.sky = C(0x020807); P.lit.set(0.96, 1.02, 0.96, 1.04); P.shadow.set(0.36, 0.56, 0.52, 0.8); P.fogStart = 1100; P.fogDensity = 0.00021; P.fogMax = 0.8; break;
        default: P.fog = C(0x1e2420);
      }
      return P;
    },
    vault: { floor: 0x0c1416, floor2: 0x122024, wedgeA: 0x4a5a5e, wedgeB: 0x0a1012, glow: 0x6AF0C0, colA: 0x1c2a30, colB: 0x141e24, cap: 0xC9CDD6, slit: 0x3AE0B0, lamp: [0.3, 1.0, 0.8], cairn: [0x3a4448, 0x56646a, 0x2c3438, 0x7a8a90], chand: 0xC9CDD6, chandGlow: 0x9AF0DC, chandLamp: [0.5, 1.0, 0.85], sign: 'PROPERTY OF BARON BLACKWATER', signCol: [150, 240, 210] },
    final: { arena: 'THE BOTTOM OF THE SHAFT', open: 'THE LIFT IS RUNNING', toast: 'Step into the light to ride down to the Baron', under: 'THE BOTTOM OF THE SHAFT', acts: ['THE PROPS GIVE WAY', 'THE SEAM IS ALIGHT'], taunt: 'The shift is not over',
      win: 'Blackwater Mine is quiet. The Baron stays at the bottom.' } },
  { id: 'frost', name: 'Frostbite Junction', blurb: 'A mountain rail depot under snow: boxcar alleys, an engine shed, a frozen lake and the open pass.', pack: 2, loading: 'Digging out the line...',
    build: buildFrost, loot: FROST_LOOT, ambient: frostAmbient, wind: 0.34, spawnYaw: Math.PI,
    palette(P, zone) {
      P.sky = C(0x0c1830); P.fog = C(0x6a8fb0); P.fogStart = 800; P.fogDensity = 0.00024; P.fogMax = 0.88; P.sun = sun(0.5, -0.45, 0.6);
      P.lit.set(0.94, 0.99, 1.08, 1.05); P.shadow.set(0.5, 0.6, 0.84, 0.86); P.sprite.setRGB(0.94, 0.99, 1.06);
      switch (zone) {
        case 0: P.fog = C(0x7088a6); P.lit.set(1.0, 0.98, 1.0, 1.05); break;                                          // the station: lamps on the platform
        case 1: P.fog = C(0x5c7494); P.shadow.set(0.46, 0.56, 0.8, 0.86); break;                                      // the freight yard
        case 2: P.fog = C(0x6a7890); P.lit.set(1.0, 0.97, 0.98, 1.05); P.shadow.set(0.54, 0.58, 0.76, 0.86); break;     // the roundhouse
        case 3: P.fog = C(0x8aa6c6); P.fogStart = 600; P.fogDensity = 0.00032; P.fogMax = 0.92; break;                 // the pass: blowing snow
        case 4: P.fog = C(0x7fb0c8); P.sky = C(0x102a40); P.shadow.set(0.48, 0.66, 0.86, 0.86); break;                 // the lake
        case 5: P.fog = C(0x566c92); P.lit.set(1.0, 0.97, 0.98, 1.05); P.shadow.set(0.48, 0.54, 0.8, 0.86); break;      // bunkhouse row
        case 'vault': P.fog = C(0x1a3050); P.sky = C(0x050a18); P.lit.set(0.92, 0.98, 1.1, 1.05); P.shadow.set(0.4, 0.5, 0.78, 0.82); P.fogStart = 1100; P.fogDensity = 0.00021; P.fogMax = 0.8; break;
        default: break;
      }
      return P;
    },
    vault: { floor: 0x101a2a, floor2: 0x16243a, wedgeA: 0xaac0d0, wedgeB: 0x0c1220, glow: 0x4AA8E8, colA: 0x1c2a44, colB: 0x141e34, cap: 0xdfe8ee, slit: 0xFF4A3A, lamp: [1.0, 0.3, 0.25], cairn: [0xdfe8ee, 0x9fc8de, 0xb8c6d2, 0x6a7686], chand: 0x8a8f99, chandGlow: 0xFF5A4A, chandLamp: [1.0, 0.4, 0.3], sign: 'THE LINE IS CLOSED', signCol: [255, 120, 100] },
    final: { arena: 'THE END OF THE LINE', open: 'THE LAST TRAIN IS IN', toast: 'Step into the light to ride to the end of the line', under: 'THE END OF THE LINE', acts: ['THE LINE BUCKLES', 'THE BOILERS BLOW'], taunt: 'Nothing leaves on time',
      win: 'Frostbite Junction is dug out. The line is open.' } },
  { id: 'bayou', name: 'Mourning Bayou', blurb: 'A drowned parish round a black lagoon: a wrecked steamer, shanty lanes, a boneyard and open marsh. Two ways round.', pack: 3, loading: 'Poling out across the water...',
    build: buildBayou, loot: BAYOU_LOOT, ambient: bayouAmbient, wind: 0.1, spawnYaw: Math.PI,
    palette(P, zone) {
      P.sky = C(0x0a1612); P.fog = C(0x2e4a3a); P.fogStart = 700; P.fogDensity = 0.00028; P.fogMax = 0.9; P.sun = sun(-0.4, 0.5, 0.7);
      P.lit.set(0.98, 1.04, 0.92, 1.05); P.shadow.set(0.48, 0.6, 0.54, 0.85); P.sprite.setRGB(0.96, 1.03, 0.94);
      switch (zone) {
        case 0: P.fog = C(0x3a4e3c); P.lit.set(1.04, 1.02, 0.9, 1.05); break;                                             // the landing: lamps on the dock
        case 1: P.fog = C(0x34463a); P.lit.set(1.04, 1.0, 0.9, 1.05); P.shadow.set(0.52, 0.56, 0.5, 0.85); break;          // shanty town
        case 2: P.fog = C(0x44545c); P.sky = C(0x0c141c); P.shadow.set(0.48, 0.56, 0.66, 0.85); P.sprite.setRGB(0.95, 1, 1.03); break;   // the boneyard: ground mist
        case 3: P.fog = C(0x1e3a2c); P.shadow.set(0.4, 0.6, 0.5, 0.84); P.fogStart = 600; P.fogDensity = 0.00034; break;     // cypress deep
        case 4: P.fog = C(0x586a3a); P.sky = C(0x141c0c); P.lit.set(1.02, 1.04, 0.86, 1.05); P.shadow.set(0.54, 0.6, 0.44, 0.85); break; // gator flats: a sick yellow
        case 5: P.fog = C(0x58482c); P.sky = C(0x18120a); P.lit.set(1.08, 0.98, 0.84, 1.05); P.shadow.set(0.6, 0.5, 0.44, 0.85); break;  // the still: firelight
        case 'vault': P.fog = C(0x14301e); P.sky = C(0x040a06); P.lit.set(0.96, 1.04, 0.9, 1.04); P.shadow.set(0.4, 0.58, 0.44, 0.82); P.fogStart = 1100; P.fogDensity = 0.00021; P.fogMax = 0.8; break;
        default: break;
      }
      return P;
    },
    vault: { floor: 0x0e1612, floor2: 0x16241a, wedgeA: 0x5a6a52, wedgeB: 0x0c1210, glow: 0x5AA02A, colA: 0x1c2a20, colB: 0x16201a, cap: 0x8a8a6a, slit: 0x5AA02A, lamp: [0.6, 1.0, 0.3], cairn: [0x4a5a44, 0x6a7a5a, 0x3a4636, 0x8a8a7a], chand: 0xb9974a, chandGlow: 0x8ad04a, chandLamp: [0.7, 1.0, 0.4], sign: 'ALL GO ACROSS', signCol: [170, 230, 110] },
    final: { arena: 'UNDER THE LAGOON', open: 'THE WATER PARTS', toast: 'Step into the light to go down to Mother Mourn', under: 'UNDER THE LAGOON', acts: ['THE ROOTS WAKE', 'THE LAGOON RISES'], taunt: 'All go across',
      win: 'Mourning Bayou is still. The lagoon keeps its own.' } },
];

MAPS.forEach((M, i) => {
  M.index = i;
  M.enemies = DATA.enemies.map((e, k) => (e.map === i ? k : -1)).filter((k) => k >= 0);
  M.bosses = DATA.bosses.map((b, k) => (b.map === i && !b.final ? k : -1)).filter((k) => k >= 0);
  M.finalBoss = DATA.bosses.findIndex((b) => b.map === i && b.final);
  M.rounds = M.bosses.length * 3;
});
