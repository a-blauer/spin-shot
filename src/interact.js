// Doors, wall buys and casino stations (port of ADMHInteractable). Built from toon primitives in UE-local space.
import * as THREE from 'three';
import { V, R, UVec } from './mapkit.js';
import { toonMaterial, hex } from './render.js';
import { textMesh } from './text.js';
import { PRIM } from './world.js';
import { ViewModel } from './viewmodel.js';

const matCache = new Map();
function mat(color, glow) {
  const key = color.getHexString() + '|' + glow;
  if (!matCache.has(key)) { const m = toonMaterial({ glow }); m.uniforms.uColor.value.copy(color); matCache.set(key, m); }
  return matCache.get(key);
}
const lin = (r, g, b) => new THREE.Color(r, g, b).convertLinearToSRGB();
export const RarityHex = [0xD8D8D8, 0x5BD65B, 0x4AA3FF, 0xB565F0, 0xFFB22E, 0xFF3B3B];

const CASINO_ONLY = new Set(['Slots', 'ArmsRoulette', 'MoneyTable', 'UpgradeCounter', 'StatBooth', 'HighRoller', 'ExitBell']);
export const STATION_NAMES = { Slots: 'Slots', ArmsRoulette: 'Weapon Roulette', MoneyTable: 'Blackjack', UpgradeCounter: 'Upgrades', StatBooth: 'Tonics', HighRoller: 'Workbench', ExitBell: 'Barricade', AmmoCrate: 'Ammo' };

export class Interactable {
  constructor(game, type, loc, yaw, cost, weapon, label, size) {
    this.game = game;
    this.type = type;
    this.cost = cost;
    this.weapon = weapon;
    this.label = label;
    this.open = false;
    this.enabled = true;
    this.casinoOnly = CASINO_ONLY.has(type);
    this.zoneA = -1; this.zoneB = -1;
    this.useRadius = 200;
    this.spinSpeed = 0;
    this.age = 0;
    this.locUE = loc;
    this.yaw = yaw;
    this.group = new THREE.Group();
    this.group.position.copy(loc.to3());
    this.group.quaternion.copy(R(0, yaw, 0).quat3());
    this.pos = this.group.position.clone();
    this.build(size);
  }

  part(parent, meshId, loc, size, color, rot = null, glow = 0) {
    const m = new THREE.Mesh(PRIM.GEOS[meshId], mat(color, glow > 0 ? Math.min(1.4, glow * 0.45) : 0));
    m.position.copy(loc.to3());
    if (rot) m.quaternion.copy(rot.quat3());
    m.scale.set(size.X, size.Z, size.Y);
    (parent || this.group).add(m);
    return m;
  }
  text(parent, loc, yaw, sizeCm, str, color = '#ffcd5a') {
    const t = textMesh(str, sizeCm, color, 0.7);
    const rot = R(0, yaw, 0);
    const n = rot.RotateVector(V(1, 0, 0)).to3();
    const r = rot.RotateVector(V(0, -1, 0)).to3();
    t.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, new THREE.Vector3(0, 1, 0), n));
    t.position.copy(loc.to3());
    (parent || this.group).add(t);
    return t;
  }
  spinner(loc) {
    const s = new THREE.Group();
    s.position.copy(loc.to3());
    this.group.add(s);
    this.spin = s;
    return s;
  }

  build(Size) {
    const Wood = lin(0.42, 0.26, 0.15), DarkWood = lin(0.22, 0.13, 0.08), Gold = lin(1, 0.72, 0.18), Red = lin(0.62, 0.07, 0.1);
    const Felt = lin(0.07, 0.38, 0.18), Black = lin(0.06, 0.05, 0.06), White = new THREE.Color(1, 1, 1);
    const P = (...a) => this.part(...a);
    switch (this.type) {
      case 'Door': {
        // blocking box in world space
        const h = Size.mul(0.5);
        const box = new THREE.Box3();
        const rot = R(0, this.yaw, 0);
        for (let i = 0; i < 8; i++) {
          const c = V((i & 1) ? h.X : -h.X, (i & 2) ? h.Y : -h.Y, (i & 4) ? h.Z : -h.Z);
          box.expandByPoint(this.locUE.add(V(0, 0, h.Z)).add(rot.RotateVector(c)).to3());
        }
        this.box3 = box;
        this.blocker = this.game.phys.addDoor(box);
        this.navBox = { min: new UVec(box.min.x, box.min.z, box.min.y), max: new UVec(box.max.x, box.max.z, box.max.y) };
        if (this.cost < 0) {
          P(null, 0, V(0, -Size.Y * 0.25, Size.Z * 0.5), V(Size.X * 0.9, Size.Y * 0.48, Size.Z), Red);
          P(null, 0, V(0, Size.Y * 0.25, Size.Z * 0.5), V(Size.X * 0.9, Size.Y * 0.48, Size.Z), Red);
          P(null, 0, V(0, 0, Size.Z * 0.5), V(Size.X * 1.05, 8, Size.Z), Gold, null, 1.5);
          P(null, 1, V(0, 0, Size.Z * 0.62), V(30, 30, Size.X * 1.1), Gold, R(0, 0, 90), 2);
          this.text(null, V(Size.X * 0.6, 0, Size.Z + 50), 0, 44, 'BARRICADED');
          this.text(null, V(-Size.X * 0.6, 0, Size.Z + 50), 180, 44, 'BARRICADED');
        } else {
          const W = Size.Y;
          P(null, 0, V(0, 0, Size.Z * 0.5), V(Size.X * 0.25, W, Size.Z), DarkWood);
          for (let i = 0; i < 6; i++) {
            const z = 50 + i * (Size.Z - 80) / 5;
            const tilt = (i % 2 === 0 ? 1 : -1) * (4 + Math.random() * 8);
            P(null, 0, V(Size.X * 0.15, 0, z), V(14, W * 1.05, 36), Wood.clone().lerp(DarkWood, (i % 3) * 0.3), R(0, 0, tilt));
            P(null, 0, V(-Size.X * 0.15, 0, z), V(14, W * 1.05, 36), Wood.clone().lerp(DarkWood, ((i + 1) % 3) * 0.3), R(0, 0, -tilt));
          }
          P(null, 0, V(Size.X * 0.25, 0, Size.Z * 0.5), V(10, W * 0.9, 14), Red, R(0, 0, 40));
          P(null, 0, V(Size.X * 0.25, 0, Size.Z * 0.5), V(10, W * 0.9, 14), Red, R(0, 0, -40));
          this.priceText = [this.text(null, V(Size.X * 0.4, 0, Size.Z * 0.5 + 140), 0, 60, '$' + this.cost),
            this.text(null, V(-Size.X * 0.4, 0, Size.Z * 0.5 + 140), 180, 60, '$' + this.cost)];
        }
        this.useRadius = Math.max(Size.Y * 0.6, 260);
        break;
      }
      case 'WallBuy': {
        const W = this.game.data.weapons[this.weapon];
        // wooden display plaque with gold trim, two pegs and the real weapon model hung on it
        P(null, 0, V(5, 0, 185), V(10, 210, 120), DarkWood);
        P(null, 0, V(9, 0, 247), V(6, 220, 8), Gold, null, 0.6);
        P(null, 0, V(9, 0, 123), V(6, 220, 8), Gold, null, 0.6);
        P(null, 0, V(9, 106, 185), V(6, 8, 128), Gold, null, 0.6);
        P(null, 0, V(9, -106, 185), V(6, 8, 128), Gold, null, 0.6);
        const gun = ViewModel.displayModel(this.game, this.weapon, 0);
        const L = { Pistol: 2.0, SMG: 1.6, Shotgun: 1.6, Rifle: 1.5, Sniper: 1.3, LMG: 1.35, Launcher: 1.4, Energy: 1.5, Wonder: 1.5 }[W.cls] || 1.3;
        gun.scale.setScalar(L);
        gun.position.copy(V(30, 0, 180).to3());
        const box = new THREE.Box3().setFromObject(gun);
        const c = box.getCenter(new THREE.Vector3()).sub(gun.position);
        gun.position.z -= c.z; gun.position.y -= c.y;
        this.group.add(gun);
        // brass pegs from the plaque, set just under the gun so it reads as resting on them
        const gb = new THREE.Box3().setFromObject(gun);
        const span = Math.min(80, (gb.max.z - gb.min.z) * 0.3), depth = Math.max(14, gb.max.x - 10);
        for (const y of [-span, span]) {
          P(null, 1, V(10 + depth * 0.5, y, gb.min.y - 3), V(5, 5, depth), Gold, R(90, 0, 0), 0.4);
          P(null, 2, V(10 + depth, y, gb.min.y - 1), V(8), Gold, null, 0.4);
        }
        this.text(null, V(14, 0, 286), 0, 26, W.name.toUpperCase(), '#f0ebdc');
        this.text(null, V(14, 0, 262), 0, 22, `$${this.cost}`, '#ffcd5a');
        this.useRadius = 200;
        break;
      }
      case 'Slots': {
        // cabinet slot machine: plinth, red cabinet with a rounded crown, bulb marquee, three reels, coin tray, lever, stool
        P(null, 0, V(0, 0, 30), V(96, 116, 60), Black);
        P(null, 0, V(0, 0, 120), V(84, 104, 120), Red);
        P(null, 4, V(0, 0, 203), V(104, 84, 46), Red, R(0, 90, 0));
        P(null, 0, V(0, 0, 182), V(88, 108, 6), Gold, null, 0.6);
        for (let i = 0; i < 7; i++) {
          const y = -42 + i * 14;
          P(null, 2, V(43, y, 182 + Math.sqrt(Math.max(0, 1 - (y / 52) ** 2)) * 40), V(9), lin(1, 0.92, 0.6), null, 3);
        }
        // reel window: dark recess, gold frame, three drums with symbols
        P(null, 0, V(42.5, 0, 140), V(2, 92, 44), Black);
        for (const z of [116, 164]) P(null, 0, V(44, 0, z), V(4, 96, 6), Gold, null, 0.6);
        for (const y of [-46, 46]) P(null, 0, V(44, y, 140), V(4, 6, 52), Gold, null, 0.6);
        const sym = [['7', '#c8212a'], ['BAR', '#1d1418'], ['7', '#c8212a']];
        for (let i = 0; i < 3; i++) {
          P(null, 1, V(32, (i - 1) * 28, 140), V(36, 36, 24), lin(0.98, 0.97, 0.92), R(0, 0, 90));
          this.text(null, V(50.5, (i - 1) * 28, 140), 0, sym[i][0] === 'BAR' ? 7 : 13, sym[i][0], sym[i][1]);
        }
        P(null, 0, V(46, 0, 100), V(10, 70, 20), Gold, null, 0.4);
        P(null, 0, V(52, 0, 78), V(24, 74, 12), Black);
        P(null, 0, V(44, 0, 70), V(4, 60, 6), lin(0.6, 0.6, 0.65));
        P(null, 1, V(0, 60, 150), V(10, 10, 80), lin(0.75, 0.75, 0.8));
        P(null, 2, V(0, 60, 194), V(24), lin(0.9, 0.1, 0.1), null, 1.2);
        // stool
        P(null, 1, V(120, 0, 34), V(8, 8, 68), lin(0.6, 0.6, 0.65));
        P(null, 1, V(120, 0, 72), V(54, 54, 10), Red);
        P(null, 1, V(120, 0, 4), V(40, 40, 8), lin(0.4, 0.4, 0.45));
        // topper sign, gold side rails, a row of jewel lights on the plinth, a lit belly glass and a spill of coins in the tray
        P(null, 0, V(0, 0, 252), V(12, 92, 40), Black); P(null, 0, V(0, 0, 274), V(16, 98, 5), Gold, null, 0.6); P(null, 0, V(0, 0, 230), V(16, 98, 5), Gold, null, 0.6);
        this.text(null, V(7, 0, 252), 0, 26, '777', '#ffcd5a');
        for (const y of [-53, 53]) { P(null, 0, V(34, y, 122), V(6, 3, 112), Gold, null, 0.3); P(null, 2, V(30, y, 186), V(12), lin(1, 0.92, 0.6), null, 3); }
        for (let i = 0; i < 5; i++) P(null, 2, V(49, -40 + i * 20, 42), V(11), hex(RarityHex[i]), null, 2.4);
        P(null, 0, V(51.5, 0, 100), V(2, 60, 14), lin(1, 0.86, 0.5), null, 1.6); this.text(null, V(53, 0, 100), 0, 8, 'FORTUNE', '#3a1418');
        for (let i = 0; i < 5; i++) P(null, 1, V(56 + (i % 2) * 5, -22 + i * 11, 86 + (i % 3)), V(12, 12, 3), Gold, R(i * 9, 0, i * 7), 0.8);
        P(null, 0, V(0, 0, 3), V(110, 130, 6), Gold, null, 0.4);
        this.useRadius = 170;
        this.glowAt = V(80, 0, 200); this.glowCol = [1, 0.4, 0.5];
        break;
      }
      case 'ArmsRoulette': {
        // a carnival prize wheel: stage, lacquered cabinet, a bulb-ringed wheel of ten rarity-coloured wedges with brass
        // pegs and a flapper, a marquee overhead, and two of the prizes on pedestals either side
        const Cream = lin(0.96, 0.93, 0.84), Bulb = lin(1, 0.92, 0.6), Pink = lin(1, 0.45, 0.65);
        P(null, 0, V(30, 0, 12), V(210, 520, 24), Black); P(null, 0, V(30, 0, 25), V(214, 524, 4), Gold, null, 0.5);
        P(null, 0, V(0, 0, 72), V(96, 230, 96), Red); P(null, 0, V(0, 0, 122), V(104, 238, 8), Gold, null, 0.5); P(null, 0, V(0, 0, 30), V(102, 236, 8), Gold, null, 0.5);
        P(null, 0, V(49, 0, 76), V(3, 190, 60), Black); for (let k = 0; k < 5; k++) P(null, 2, V(52, -72 + k * 36, 76), V(20), hex(RarityHex[k]), null, 2);
        P(null, 0, V(-22, 0, 200), V(34, 70, 160), DarkWood); P(null, 0, V(-4, 0, 150), V(10, 90, 60), DarkWood, R(0, 0, 0));
        P(null, 1, V(-14, 0, 290), V(350, 350, 12), Gold, R(90, 0, 0), 0.5); P(null, 1, V(-9, 0, 290), V(334, 334, 14), Black, R(90, 0, 0));
        for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2; P(null, 2, V(0, Math.cos(a) * 160, 290 + Math.sin(a) * 160), V(12), k % 2 ? Bulb : Pink, null, 3); }
        const s = this.spinner(V(4, 0, 290));
        P(s, 1, V(0, 0, 0), V(296, 296, 8), Cream, R(90, 0, 0));
        const order = [0, 2, 1, 5, 3, 0, 4, 1, 5, 2];   // rarity of each wedge; 5 = bust
        for (let k = 0; k < 10; k++) {
          const g = new THREE.CircleGeometry(140, 10, k * Math.PI / 5 + 0.03, Math.PI / 5 - 0.06);
          const w = new THREE.Mesh(g, mat(order[k] === 5 ? Black : hex(RarityHex[order[k]]), order[k] === 5 ? 0 : 0.35)); w.rotation.y = Math.PI / 2; w.position.x = 5; s.add(w);
          const a = k * Math.PI / 5; P(s, 1, V(8, Math.cos(a) * 140, Math.sin(a) * 140), V(9, 9, 14), Gold, R(90, 0, 0), 0.6);
        }
        P(s, 1, V(8, 0, 0), V(64, 64, 14), Gold, R(90, 0, 0), 0.6); P(s, 2, V(16, 0, 0), V(30), Red, null, 1.2);
        P(null, 0, V(-6, 0, 468), V(20, 26, 30), Gold, null, 0.5); P(null, 3, V(14, 0, 448), V(22, 26, 44), Cream, R(180, 0, 0), 2.5);
        // marquee
        P(null, 0, V(-14, 0, 530), V(14, 400, 76), Black); P(null, 0, V(-12, 0, 570), V(16, 410, 6), Gold, null, 0.6); P(null, 0, V(-12, 0, 490), V(16, 410, 6), Gold, null, 0.6);
        for (let k = 0; k < 13; k++) P(null, 2, V(-4, -192 + k * 32, 582), V(11), k % 2 ? Bulb : Pink, null, 3);
        this.text(null, V(-5, 0, 530), 0, 38, 'WEAPON ROULETTE', '#ffcd5a');
        for (const y of [-205, 205]) P(null, 0, V(-14, y, 400), V(10, 10, 190), Gold, null, 0.4);
        // lever
        P(null, 1, V(20, 128, 130), V(9, 9, 90), lin(0.75, 0.75, 0.8), R(0, 0, -18)); P(null, 2, V(20, 143, 176), V(26), Red, null, 1.2);
        // prizes on show
        [[8, -215], [12, 215]].forEach(([wi, y]) => {
          P(null, 0, V(40, y, 70), V(60, 70, 92), DarkWood); P(null, 0, V(40, y, 118), V(68, 78, 6), Gold, null, 0.5); P(null, 0, V(40, y, 126), V(40, 50, 10), Red);
          try { const gun = ViewModel.displayModel(this.game, wi, 0); gun.scale.setScalar(1.25); gun.position.copy(V(40, y, 165).to3()); const b = new THREE.Box3().setFromObject(gun), c = b.getCenter(new THREE.Vector3()).sub(gun.position); gun.position.sub(c); gun.position.y += (b.max.y - b.min.y) * 0.5 - 30; this.group.add(gun); } catch (e) { /* no model */ }
        });
        this.spinSpeed = 20; this.spinAxis = 'roll';
        this.useRadius = 260;
        this.glowAt = V(120, 0, 300); this.glowCol = [1, 0.6, 0.3];
        break;
      }
      case 'MoneyTable': {
        P(null, 1, V(0, 0, 40), V(80, 80, 80), DarkWood);
        P(null, 0, V(0, 0, 90), V(300, 170, 16), Felt);
        P(null, 0, V(0, 0, 86), V(316, 186, 12), Wood);
        const s = this.spinner(V(-90, 0, 104));
        P(s, 1, V(0, 0, 0), V(110, 110, 14), Wood);
        for (let i = 0; i < 6; i++) P(s, 0, V(0, 0, 8), V(100, 10, 4), i % 2 === 0 ? Red : Black, R(0, i * 30, 0));
        P(s, 2, V(46, 0, 12), V(8), White, null, 2);
        for (let i = 0; i < 5; i++) P(null, 1, V(60 + i * 12, -40 + i * 18, 102 + i * 2), V(22, 22, 6), i % 2 ? Red : Gold, null, 1);
        this.text(null, V(0, 0, 230), 0, 36, 'BLACKJACK');
        this.spinSpeed = 60; this.spinAxis = 'yaw';
        this.useRadius = 260;
        this.glowAt = V(0, 0, 260); this.glowCol = [0.6, 1, 0.6];
        break;
      }
      case 'UpgradeCounter': {
        // pawn shop: glass display counter of trinkets, cash register, loaded shelves, three gold balls overhead
        P(null, 0, V(0, 0, 40), V(100, 320, 80), Wood);
        P(null, 0, V(0, 0, 84), V(104, 324, 8), DarkWood);
        P(null, 0, V(0, 0, 100), V(96, 316, 30), lin(0.6, 0.8, 0.85), null, 0.15);
        P(null, 0, V(0, 0, 116), V(104, 324, 4), DarkWood);
        for (let i = 0; i < 6; i++) P(null, i % 2 ? 2 : 0, V(10, -130 + i * 52, 98), V(18), hex(RarityHex[i % 5]), R(0, i * 30, 0), 1.2);
        // register
        P(null, 0, V(-10, 110, 140), V(50, 60, 40), lin(0.55, 0.45, 0.2));
        P(null, 0, V(-20, 110, 172), V(30, 56, 24), lin(0.55, 0.45, 0.2), R(-20, 0, 0));
        P(null, 0, V(-6, 110, 178), V(4, 30, 12), lin(0.4, 1, 0.5), null, 2);
        P(null, 0, V(-64, 0, 200), V(26, 340, 380), DarkWood); P(null, 0, V(-50, 0, 388), V(8, 344, 8), Gold, null, 0.5);
        for (const y of [-166, 166]) P(null, 0, V(-40, y, 240), V(50, 10, 300), DarkWood);
        for (let sh = 0; sh < 3; sh++) {
          P(null, 0, V(-36, 0, 150 + sh * 90), V(50, 330, 8), Wood);
          for (let i = 0; i < 5; i++) P(null, i % 2 ? 2 : (i % 3 ? 0 : 7), V(-36, -120 + i * 60, 176 + sh * 90), V(34, 34, i % 2 ? 34 : 44), hex(RarityHex[(i + sh) % 5]), R(0, i * 20, 0), 1.2);
        }
        // the pawnbroker's three gold balls
        P(null, 0, V(40, -150, 470), V(120, 8, 8), DarkWood);
        for (let i = 0; i < 3; i++) {
          const p = i === 1 ? V(90, -150, 410) : V(70, i === 0 ? -176 : -124, 430);
          P(null, 1, p.add(V(0, 0, 30)), V(3, 3, 60 - (i === 1 ? -20 : 0)), DarkWood);
          P(null, 2, p, V(34), Gold, null, 0.8);
        }
        P(null, 0, V(-56, 0, 520), V(12, 330, 80), Black); P(null, 0, V(-54, 0, 562), V(14, 338, 6), Gold, null, 0.6); P(null, 0, V(-54, 0, 478), V(14, 338, 6), Gold, null, 0.6);
        for (let i = 0; i < 11; i++) P(null, 2, V(-46, -160 + i * 32, 574), V(11), hex(RarityHex[i % 5]), null, 3);
        this.text(null, V(-48, 0, 520), 0, 44, 'UPGRADES', '#78e6dc');
        for (let i = 0; i < 3; i++) { P(null, 0, V(51, -106 + i * 106, 42), V(3, 92, 58), DarkWood); P(null, 0, V(52, -106 + i * 106, 73), V(3, 96, 4), Gold, null, 0.5); P(null, 2, V(53, -106 + i * 106, 42), V(14), hex(RarityHex[i + 1]), null, 1.6); }
        for (const y of [-80, 80]) { P(null, 1, V(20, y, 400), V(3, 3, 110), Black); P(null, 3, V(20, y, 336), V(56, 56, 34), lin(0.2, 0.5, 0.45)); P(null, 2, V(20, y, 322), V(18), lin(1, 0.92, 0.7), null, 3); }
        P(null, 0, V(20, -120, 126), V(40, 60, 3), Red); for (let i = 0; i < 3; i++) P(null, 1, V(14 + i * 8, -120 + i * 6, 131), V(16, 16, 5), Gold, null, 0.8);
        this.useRadius = 250;
        this.glowAt = V(120, 0, 260); this.glowCol = [0.7, 0.8, 1];
        break;
      }
      case 'StatBooth': {
        // saloon back-bar: counter with a brass rail, mirrored back wall, shelves of tonics, two stools
        P(null, 0, V(0, 0, 55), V(100, 320, 110), DarkWood);
        for (let i = 0; i < 4; i++) P(null, 0, V(51, -120 + i * 80, 55), V(4, 60, 90), Wood);
        P(null, 0, V(0, 0, 112), V(116, 336, 10), Wood);
        P(null, 1, V(58, 0, 18), V(8, 8, 320), Gold, R(90, 90, 0), 0.4);
        P(null, 0, V(-66, 0, 200), V(20, 340, 380), DarkWood); for (const y of [-166, 166]) P(null, 0, V(-48, y, 250), V(40, 12, 280), DarkWood);
        P(null, 0, V(-55.5, 0, 252), V(2, 296, 166), Gold, null, 0.6);
        P(null, 0, V(-54, 0, 252), V(2, 284, 154), lin(0.55, 0.7, 0.78), null, 0.25);
        const T = [lin(1, 0.2, 0.2), lin(1, 0.6, 0.1), lin(0.3, 0.8, 1), lin(0.4, 1, 0.3), lin(0.8, 0.3, 1), lin(1, 0.9, 0.3), lin(0.9, 0.9, 0.95), lin(0.5, 0.3, 0.15)];
        for (let r = 0; r < 2; r++) {
          P(null, 0, V(-40, 0, 150 + r * 70), V(30, 300, 6), Wood);
          for (let i = 0; i < 8; i++) {
            const p = V(-40, -126 + i * 36, 172 + r * 70);
            const tall = (i + r) % 3 === 0;
            P(null, (i + r) % 2 ? 1 : 7, p, V(20, 20, tall ? 40 : 30), T[(i + r * 3) % T.length], null, 1.4);
            P(null, 1, p.add(V(0, 0, tall ? 28 : 22)), V(8, 8, 14), T[(i + r * 3) % T.length].clone().multiplyScalar(0.5));
          }
        }
        for (let i = 0; i < 4; i++) P(null, 1, V(10, -100 + i * 66, 128), V(12, 12, 24), T[i], null, 1.2);
        for (const y of [-90, 90]) {
          P(null, 1, V(110, y, 38), V(8, 8, 76), lin(0.6, 0.6, 0.65));
          P(null, 1, V(110, y, 80), V(50, 50, 10), Red);
        }
        P(null, 0, V(-58, 0, 440), V(12, 300, 80), Black); P(null, 0, V(-56, 0, 482), V(14, 308, 6), Gold, null, 0.6); P(null, 0, V(-56, 0, 398), V(14, 308, 6), Gold, null, 0.6);
        for (let i = 0; i < 10; i++) P(null, 2, V(-48, -144 + i * 32, 494), V(11), i % 2 ? lin(1, 0.92, 0.6) : lin(1, 0.5, 0.3), null, 3);
        this.text(null, V(-50, 0, 440), 0, 48, 'TONICS', '#ffcd5a');
        // brass tap tower, glasses, a bar towel, and two shaded lamps over the counter
        P(null, 0, V(30, 120, 124), V(26, 70, 14), Gold, null, 0.4);
        for (let i = 0; i < 3; i++) { P(null, 1, V(30, 98 + i * 22, 146), V(7, 7, 34), Gold, null, 0.5); P(null, 0, V(40, 98 + i * 22, 160), V(22, 5, 5), Gold, null, 0.5); P(null, 0, V(30, 98 + i * 22, 172), V(6, 6, 22), [Red, Black, lin(0.1, 0.4, 0.2)][i]); }
        for (let i = 0; i < 4; i++) P(null, 1, V(34, -150 + i * 16, 126), V(11, 11, 18), lin(0.75, 0.9, 0.95), null, 0.5);
        P(null, 0, V(40, 30, 119), V(34, 50, 3), lin(0.9, 0.88, 0.8));
        for (const y of [-80, 80]) { P(null, 1, V(20, y, 400), V(3, 3, 110), Black); P(null, 3, V(20, y, 336), V(56, 56, 34), Red); P(null, 2, V(20, y, 322), V(18), lin(1, 0.9, 0.6), null, 3); }
        this.useRadius = 250;
        this.glowAt = V(120, 0, 260); this.glowCol = [1, 0.7, 0.4];
        break;
      }
      case 'HighRoller': {
        // WORKBENCH: where guns get upgraded. A heavy bench against a pegboard of tools, a rifle clamped in a vise under a
        // work lamp, parts and oil to hand, and a sign with rising chevrons so it reads as "make this better" from across the room.
        const Steel = lin(0.55, 0.57, 0.62), SteelD = lin(0.2, 0.2, 0.24), Green = lin(0.35, 0.9, 0.4);
        P(null, 0, V(4, 0, 250), V(10, 380, 270), DarkWood);                                   // back board
        P(null, 0, V(10, 0, 250), V(4, 350, 240), lin(0.62, 0.5, 0.34));                       // pegboard
        for (let y = -150; y <= 150; y += 50) for (let z = 160; z <= 340; z += 45) P(null, 1, V(13, y, z), V(5, 5, 3), SteelD, R(0, 90, 0));
        // tools on the board: hammer, wrench, saw, pliers
        P(null, 0, V(15, -130, 250), V(5, 10, 90), Wood); P(null, 0, V(15, -130, 300), V(8, 46, 22), Steel);
        P(null, 0, V(15, -70, 250), V(5, 12, 100), Steel); P(null, 1, V(15, -70, 306), V(30, 30, 6), Steel, R(0, 90, 0)); P(null, 1, V(17, -70, 306), V(14, 14, 7), DarkWood, R(0, 90, 0));
        P(null, 0, V(15, 110, 262), V(4, 120, 34), Steel, R(0, 0, 0)); P(null, 0, V(15, 44, 262), V(8, 26, 44), Wood);
        P(null, 0, V(15, 150, 200), V(5, 8, 70), Red, R(8, 0, 0)); P(null, 0, V(15, 162, 200), V(5, 8, 70), Red, R(-8, 0, 0));
        // bench
        P(null, 0, V(70, 0, 100), V(130, 360, 16), Wood);
        P(null, 0, V(70, 0, 92), V(136, 366, 6), DarkWood);
        for (const y of [-160, 160]) for (const x of [16, 124]) P(null, 0, V(x, y, 46), V(16, 16, 92), DarkWood);
        P(null, 0, V(70, 0, 34), V(120, 330, 8), DarkWood);                                    // lower shelf
        P(null, 0, V(60, -110, 52), V(60, 70, 28), lin(0.3, 0.42, 0.3)); P(null, 0, V(60, -30, 48), V(50, 50, 20), lin(0.5, 0.2, 0.15));   // ammo tins
        P(null, 1, V(70, 90, 58), V(44, 44, 40), SteelD);                                      // parts bucket
        // vise with a rifle clamped in it
        P(null, 0, V(70, -40, 122), V(46, 60, 28), SteelD); P(null, 0, V(70, -62, 146), V(46, 14, 30), Steel); P(null, 0, V(70, -18, 146), V(46, 14, 30), Steel);
        P(null, 1, V(104, -40, 132), V(8, 8, 46), Steel, R(0, 90, 0));
        P(null, 0, V(70, 20, 152), V(16, 190, 20), Black); P(null, 1, V(70, 150, 156), V(9, 9, 110), SteelD, R(90, 0, 0));
        P(null, 0, V(70, -96, 148), V(18, 70, 26), Wood, R(-8, 0, 0)); P(null, 0, V(70, 40, 136), V(12, 16, 26), Black); P(null, 0, V(70, 70, 166), V(8, 60, 10), SteelD);
        // parts on the bench: gears, oil can, a spare barrel, bolts
        const gear = this.spinner(V(100, 110, 112)); P(gear, 1, V(0, 0, 0), V(34, 34, 6), Gold, null, 0.4); for (let i = 0; i < 6; i++) P(gear, 0, V(0, 0, 0), V(42, 7, 6), Gold, R(0, i * 30, 0), 0.4);
        P(null, 1, V(38, 130, 124), V(20, 20, 30), Red); P(null, 3, V(38, 130, 146), V(14, 14, 16), Red); P(null, 1, V(40, 60, 113), V(8, 8, 70), Steel, R(90, 0, 20));
        for (let i = 0; i < 4; i++) P(null, 1, V(110, -120 + i * 13, 112), V(7, 7, 8), Steel);
        // work lamp on an arm
        P(null, 0, V(20, 150, 300), V(8, 8, 120), SteelD); P(null, 0, V(50, 150, 356), V(70, 8, 8), SteelD); P(null, 3, V(84, 150, 340), V(50, 50, 34), lin(0.75, 0.6, 0.2)); P(null, 2, V(84, 150, 326), V(20), lin(1, 0.9, 0.6), null, 2.2);
        // sign: big name, plain purpose, three rising chevrons
        P(null, 0, V(8, 0, 432), V(12, 390, 96), Black); P(null, 0, V(10, 0, 482), V(14, 400, 8), Gold, null, 0.6); P(null, 0, V(10, 0, 382), V(14, 400, 8), Gold, null, 0.6);
        this.text(null, V(16, -40, 446), 0, 46, 'WORKBENCH', '#ffcd5a');
        this.text(null, V(16, -40, 402), 0, 21, 'UPGRADE YOUR WEAPONS', '#f2e8d5');
        for (let i = 0; i < 3; i++) for (const sgn of [-1, 1]) P(null, 0, V(17, 150 + sgn * 13, 404 + i * 24), V(4, 38, 9), Green, R(sgn * 38, 0, 0), 1.6 - i * 0.3);
        this.spinSpeed = 40; this.spinAxis = 'yaw';
        this.useRadius = 260;
        this.glowAt = V(120, 0, 240); this.glowCol = [1, 0.8, 0.3];
        break;
      }
      case 'ExitBell': {
        // barricade control: a steel post with a hazard-striped switch box, a big red throw lever, status lamps and a
        // turning amber beacon on top, so it reads as "this locks the doors" and not as decoration
        const Steel = lin(0.55, 0.57, 0.62), SteelD = lin(0.2, 0.2, 0.24), Yellow = lin(1, 0.78, 0.1);
        P(null, 0, V(0, 0, 8), V(100, 110, 16), Black); P(null, 0, V(0, 0, 17), V(104, 114, 3), Yellow, null, 0.3);
        P(null, 0, V(-6, 0, 80), V(30, 34, 130), SteelD); P(null, 1, V(-22, 34, 90), V(9, 9, 170), Black);
        P(null, 0, V(0, 0, 190), V(44, 130, 150), Steel); P(null, 0, V(1, 0, 190), V(46, 120, 140), SteelD);
        for (const [y, z] of [[-56, 126], [56, 126], [-56, 254], [56, 254]]) P(null, 1, V(22, y, z), V(8, 8, 6), Steel, R(90, 0, 0));
        P(null, 0, V(24, 0, 138), V(3, 104, 24), Yellow, null, 0.3);
        for (let k = 0; k < 5; k++) P(null, 0, V(25.5, -40 + k * 20, 138), V(2, 8, 30), Black, R(0, 0, 30));
        P(null, 0, V(24, 0, 152), V(4, 108, 4), SteelD); P(null, 0, V(24, 0, 124), V(4, 108, 4), SteelD);
        P(null, 0, V(24, -12, 206), V(4, 20, 76), Black);
        P(null, 1, V(46, -12, 222), V(10, 10, 60), Steel, R(55, 0, 0)); P(null, 2, V(72, -12, 240), V(30), Red, null, 1.4);
        P(null, 2, V(25, 36, 232), V(18), lin(0.3, 1, 0.4), null, 3); P(null, 2, V(25, 36, 204), V(18), lin(1, 0.2, 0.15), null, 2);
        P(null, 0, V(25, 36, 180), V(3, 30, 12), Black);
        P(null, 0, V(0, 0, 268), V(50, 136, 6), SteelD);
        const s = this.spinner(V(0, 0, 286));
        P(null, 1, V(0, 0, 276), V(40, 40, 12), SteelD);
        P(s, 1, V(0, 0, 0), V(30, 30, 30), lin(1, 0.6, 0.1), null, 3); P(s, 0, V(6, 0, 0), V(4, 26, 26), Steel); P(s, 2, V(0, 0, 16), V(30), lin(1, 0.6, 0.1), null, 3);
        P(null, 0, V(2, 0, 350), V(12, 190, 50), Black); P(null, 0, V(4, 0, 377), V(14, 196, 5), Yellow, null, 0.5); P(null, 0, V(4, 0, 323), V(14, 196, 5), Yellow, null, 0.5);
        this.text(null, V(10, 0, 350), 0, 30, 'BARRICADE', '#ffcd5a');
        this.spinSpeed = 200; this.spinAxis = 'yaw';
        this.useRadius = 180;
        this.glowAt = V(30, 0, 280); this.glowCol = [1, 0.6, 0.2];
        break;
      }
      case 'AmmoCrate': {
        // army surplus ammo crate: olive box, dark banding, rope handles, lid propped open on a pile of shells
        const Olive = lin(0.26, 0.31, 0.17), OliveD = lin(0.17, 0.2, 0.11), Brass = lin(1, 0.62, 0.18);
        P(null, 0, V(0, 0, 36), V(120, 80, 72), Olive);
        for (const x of [-48, 48]) P(null, 0, V(x, 0, 36), V(8, 84, 74), OliveD);
        P(null, 0, V(0, 0, 70), V(124, 84, 6), OliveD);
        for (const y of [-42, 42]) P(null, 8, V(0, y, 46), V(30, 6, 22), lin(0.75, 0.66, 0.45));
        P(null, 0, V(-68, 0, 114), V(8, 84, 84), Olive, R(15, 0, 0));
        P(null, 0, V(-63, 0, 114), V(2, 60, 30), OliveD, R(15, 0, 0));
        for (let i = 0; i < 18; i++) {
          const x = -40 + (i % 6) * 16, y = -18 + Math.floor(i / 6) * 18;
          P(null, 1, V(x, y, 78), V(11, 11, 16), Brass, null, 0.3);
          P(null, 3, V(x, y, 91), V(10, 10, 10), lin(0.62, 0.42, 0.28));
        }
        this.text(null, V(61, 0, 36), 0, 16, 'AMMO', '#e6dcb4');
        P(null, 0, V(-14, 112, 26), V(100, 76, 52), OliveD); P(null, 0, V(-14, 112, 53), V(104, 80, 4), Olive); P(null, 0, V(-10, 108, 76), V(76, 58, 40), Olive, R(0, 14, 0)); P(null, 0, V(-10, 108, 97), V(80, 62, 4), OliveD, R(0, 14, 0));
        P(null, 0, V(-6, -104, 20), V(70, 60, 40), Olive, R(0, -10, 0)); P(null, 0, V(30, -104, 46), V(10, 44, 10), Brass, R(0, -10, 0), 0.3);
        P(null, 0, V(-70, 0, 150), V(6, 6, 300), OliveD); P(null, 0, V(-66, 0, 176), V(6, 150, 46), Black);
        this.text(null, V(-61, 0, 176), 0, 26, this.cost > 0 ? `AMMO  $${this.cost}` : 'FREE AMMO', '#e6e6c8');
        this.useRadius = 170;
        this.glowAt = V(30, 0, 120); this.glowCol = [1, 0.75, 0.3];
        break;
      }
      default: break;
    }
  }

  isUsable() {
    if (!this.enabled || this.open) return false;
    if (this.type === 'Door' && this.cost < 0) return false;
    if (this.casinoOnly) return this.game.isCasinoOpen();
    return true;
  }

  prompt(player) {
    const G = this.game;
    switch (this.type) {
      case 'Door': {
        let where = this.label;
        if (G.zones[this.zoneA] && G.zones[this.zoneB]) where = G.zones[this.zoneA].unlocked ? G.zones[this.zoneB].name : G.zones[this.zoneA].name;
        return `[E] Open ${where}  $${this.cost}`;
      }
      case 'WallBuy': {
        const n = G.data.weapons[this.weapon].name;
        if (player && player.hasWeapon(this.weapon)) return `[E] ${n} ammo  $${Math.floor(this.cost / 2)}`;
        return `[E] ${n}  $${this.cost}`;
      }
      case 'AmmoCrate': return this.cost > 0 ? `[E] Refill ammo  $${this.cost}` : '[E] Refill ammo  (free)';
      case 'ExitBell': return (this.game.barricadeT > 0 ? `[E] Lower the barricade  (${Math.ceil(this.game.barricadeT)}s left)` : this.game.barricadeCd > 0 ? `Barricade ready in ${Math.ceil(this.game.barricadeCd)}s` : '[E] Barricade the doors for 60s');
      case 'Slots': return `[E] Slots  $${player ? player.slotPrice() : this.cost}`;
      default: return `[E] ${STATION_NAMES[this.type] || this.type}`;
    }
  }

  setOpen(open) {
    this.open = open;
    this.group.visible = !open;
    if (this.blocker) this.blocker.enabled = !open;
  }

  update(dt) {
    this.age += dt;
    if (this.spin && this.spinSpeed) {
      const speed = (this.isUsable() ? this.spinSpeed : this.spinSpeed * 0.1) * dt;
      // UE roll = rotation about local X (three x); UE yaw = about local Z (three y)
      if (this.spinAxis === 'roll') this.spin.rotateX(-speed * Math.PI / 180);
      else this.spin.rotateY(-speed * Math.PI / 180);
    }
  }
}
