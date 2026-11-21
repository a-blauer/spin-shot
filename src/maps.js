// The maps. Each one is its own run: its own ground, its own creatures, its own bosses and its own last room.
// Nothing from one map turns up on another.
import * as THREE from 'three';
import { DATA } from './data.js';
import { buildMine, MINE_LOOT } from './map_mine.js';

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
];

MAPS.forEach((M, i) => {
  M.index = i;
  M.enemies = DATA.enemies.map((e, k) => (e.map === i ? k : -1)).filter((k) => k >= 0);
  M.bosses = DATA.bosses.map((b, k) => (b.map === i && !b.final ? k : -1)).filter((k) => k >= 0);
  M.finalBoss = DATA.bosses.findIndex((b) => b.map === i && b.final);
  M.rounds = M.bosses.length * 3;
});
