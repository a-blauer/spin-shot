// Unreal-space helpers used by the map builder (ported from the UE5 version).
// UE space: X forward, Y right, Z up (left-handed, cm). three.js space: x = UE.X, y = UE.Z, z = UE.Y (cm).
import * as THREE from 'three';

export class UVec {
  constructor(x = 0, y = 0, z = 0) { this.X = x; this.Y = y; this.Z = z; }
  add(o) { return new UVec(this.X + o.X, this.Y + o.Y, this.Z + o.Z); }
  sub(o) { return new UVec(this.X - o.X, this.Y - o.Y, this.Z - o.Z); }
  mul(s) { return new UVec(this.X * s, this.Y * s, this.Z * s); }
  Size() { return Math.hypot(this.X, this.Y, this.Z); }
  GetSafeNormal() { const l = this.Size(); return l > 1e-8 ? this.mul(1 / l) : new UVec(); }
  to3(out = new THREE.Vector3()) { return out.set(this.X, this.Z, this.Y); }
  Rotation() { return new URot(0, Math.atan2(this.Y, this.X) * 180 / Math.PI, 0); }
}
export class UVec2 {
  constructor(x = 0, y = 0) { this.X = x; this.Y = y; }
  add(o) { return new UVec2(this.X + o.X, this.Y + o.Y); }
  sub(o) { return new UVec2(this.X - o.X, this.Y - o.Y); }
  mul(s) { return new UVec2(this.X * s, this.Y * s); }
  Size() { return Math.hypot(this.X, this.Y); }
}
export const V = (x, y, z) => (y === undefined ? new UVec(x, x, x) : new UVec(x, y, z));
export const V2 = (x, y) => new UVec2(x, y);
export const cross = (a, b) => new UVec(a.Y * b.Z - a.Z * b.Y, a.Z * b.X - a.X * b.Z, a.X * b.Y - a.Y * b.X);

// FRotator (degrees). Rows are the rotated X, Y, Z axes (UE FRotationMatrix convention).
export class URot {
  constructor(p = 0, y = 0, r = 0, rows = null) {
    this.Pitch = p; this.Yaw = y; this.Roll = r;
    if (rows) { this.rows = rows; return; }
    const d = Math.PI / 180;
    const SP = Math.sin(p * d), CP = Math.cos(p * d), SY = Math.sin(y * d), CY = Math.cos(y * d), SR = Math.sin(r * d), CR = Math.cos(r * d);
    this.rows = [
      new UVec(CP * CY, CP * SY, SP),
      new UVec(SR * SP * CY - CR * SY, SR * SP * SY + CR * CY, -SR * CP),
      new UVec(-(CR * SP * CY + SR * SY), CY * SR - CR * SP * SY, CR * CP),
    ];
  }
  RotateVector(v) {
    const [a, b, c] = this.rows;
    return new UVec(v.X * a.X + v.Y * b.X + v.Z * c.X, v.X * a.Y + v.Y * b.Y + v.Z * c.Y, v.X * a.Z + v.Y * b.Z + v.Z * c.Z);
  }
  Vector() { return this.rows[0]; }
  // three.js quaternion for this rotation (basis mapped through the UE->three axis swap)
  quat3(out = new THREE.Quaternion()) {
    const [a, b, c] = this.rows;
    const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(a.X, a.Z, a.Y), new THREE.Vector3(c.X, c.Z, c.Y), new THREE.Vector3(b.X, b.Z, b.Y));
    return out.setFromRotationMatrix(m);
  }
}
export const R = (p, y, r) => new URot(p, y, r);
export function RotFromXY(X, Y) {
  const x = X.GetSafeNormal();
  const z = cross(x, Y).GetSafeNormal();
  const y = cross(z, x);
  return new URot(0, 0, 0, [x, y, z]);
}

export const LC = (r, g, b, a = 1) => ({ r, g, b, a });
export const FC = (r, g, b) => ({ r: r / 255, g: g / 255, b: b / 255, a: 1 });
export const BOX = (min, max) => ({ min, max });

// Deterministic RNG so the town is the same every run (UE FMath::RandInit(1337)).
let seed = 1337;
export function randInit(s) { seed = s >>> 0; }
export function frand() {
  seed = (seed + 0x6D2B79F5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const FMath = {
  Abs: Math.abs, Cos: Math.cos, Sin: Math.sin, Sqrt: Math.sqrt, Max: Math.max, Min: Math.min,
  DegreesToRadians: (d) => d * Math.PI / 180,
  FRandRange: (a, b) => a + (b - a) * frand(),
  RandRange: (a, b) => a + Math.floor(frand() * (b - a + 1)),
  RandBool: () => frand() < 0.5,
  FRand: () => frand(),
};

export const Pal = {
  Sand: 0xC9A66B, Concrete: 0x8C857A, Asphalt: 0x45414C, Sidewalk: 0x9A8F80, Grass: 0x5E7A4A, GrassDark: 0x48613A,
  Gravel: 0x7A6E62, Tile: 0xB8A48A, TileDark: 0x8E7A62, RedRock: 0xB5643C, RockA: 0xA0502E, RockB: 0xC77A45,
  Adobe: 0xD9B38C, AdobeDark: 0xB48A64, Wood: 0x8A5A3A, WoodDark: 0x5A3A2A, Brick: 0xA0523A, Cream: 0xE8DCC0,
  Teal: 0x2F7F7A, RoofRed: 0x6B3A3A, RoofDark: 0x3A2E2E, Metal: 0x6A7480, MetalDark: 0x3E444C, Stone: 0x8A8A90,
  StoneDark: 0x5E5E66, Bone: 0xEDE3C8, CasinoRed: 0x7A1022, CasinoBlack: 0x1A1A22, Gold: 0xE8B830, Felt: 0x1F6B3A,
  Carpet: 0x5A0E1E, Water: 0x3FA7C8, Leaf: 0x3E8A3A, Neon: 0xFF4FA0, NeonBlue: 0x4FD8FF, Bulb: 0xFFD98A,
};
