// Runtime map builder (port of ADMHMapBuilder): instanced toon geometry, collision (BVH), nav blocking,
// zones, doors, wall buys, casino stations, signs and Sulfur-style sprite dressing.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MeshBVH } from 'three-mesh-bvh';
import { V, V2, R, UVec, URot, RotFromXY, cross, Pal, FMath, randInit, frand } from './mapkit.js';
import { toonMaterial, hex, sprite, SpriteBatch } from './render.js';
import { textMesh } from './text.js';
import * as Z from './mapzones.js';
import { Interactable } from './interact.js';

const GRAVITY = 980 * 1.6;
const lin = (c) => new THREE.Color(c.r, c.g, c.b).convertLinearToSRGB();

// Extra low-poly primitives (unit size, centred like the others; UE axes in comments):
//  4 arch: half cylinder lying along UE Y with its flat face down (canvas covers, fenders, mounds, arched tops)
//  5 wedge: triangular prism, ridge along UE Y (pediments, gables, roofs)
//  6 pyramid: square-based, faces aligned with the axes (spires, obelisk tips)
//  7 octagon: 8-sided prism (columns, basins, chunky low-poly pillars)
//  8 ring: torus around UE Y (wagon wheels, hoops)
function archGeo() {
  const g = new THREE.CylinderGeometry(0.5, 0.5, 1, 14, 1, false, 0, Math.PI);
  g.rotateX(Math.PI / 2); g.rotateZ(Math.PI / 2); g.scale(1, 2, 1); g.translate(0, -0.5, 0);
  return g;
}
function prismGeo(poly) {
  // poly: [[x,y],...] CCW in the x/y plane, extruded along z in [-0.5, 0.5]; flat-shaded
  const P = [];
  const tri = (a, b, c) => P.push(...a, ...b, ...c);
  const n = poly.length;
  for (let i = 1; i < n - 1; i++) {
    tri([...poly[0], 0.5], [...poly[i], 0.5], [...poly[i + 1], 0.5]);
    tri([...poly[0], -0.5], [...poly[i + 1], -0.5], [...poly[i], -0.5]);
  }
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n];
    tri([...a, -0.5], [...b, -0.5], [...b, 0.5]);
    tri([...a, -0.5], [...b, 0.5], [...a, 0.5]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.computeVertexNormals();
  return g;
}
function pyramidGeo() { const g = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1); g.rotateY(Math.PI / 4); return g; }
function octGeo() { const g = new THREE.CylinderGeometry(0.5, 0.5, 1, 8); g.rotateY(Math.PI / 8); return g; }
function ringGeo(tube = 0.06) { return new THREE.TorusGeometry(0.5 - tube, tube, 6, 22); }
const GEOS = [
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.CylinderGeometry(0.5, 0.5, 1, 16),
  new THREE.SphereGeometry(0.5, 16, 10),
  new THREE.ConeGeometry(0.5, 1, 16),
  archGeo(),
  prismGeo([[-0.5, -0.5], [0.5, -0.5], [0, 0.5]]),
  pyramidGeo(),
  octGeo(),
  ringGeo(),
];
const COLGEOS = [
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
  new THREE.SphereGeometry(0.5, 8, 6),
  new THREE.ConeGeometry(0.5, 1, 10),
  archGeo(),
  prismGeo([[-0.5, -0.5], [0.5, -0.5], [0, 0.5]]),
  pyramidGeo(),
  octGeo(),
  ringGeo(0.1),
];
export const PRIM = { GEOS };

export class World {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;
    this.inst = new Map();          // key mesh|glow -> [{matrix, color}]
    this.colSolid = [];             // geometries (visible collision, blocks bullets)
    this.colBlock = [];             // invisible blockers (movement only)
    this.doors = [];
    this.interactables = [];
    this.signs = new THREE.Group();
    scene.add(this.signs);
    this.statics = {
      sprite: new SpriteBatch(scene, 'sprite', 'fx', 6000, 1),
      fx: new SpriteBatch(scene, 'fx', 'fx', 3000, 2),
      add: new SpriteBatch(scene, 'add', 'fx', 2000, 3),
    };
    for (const b of Object.values(this.statics)) b.begin();
    this.decalSerial = 0;
    this.jumpPads = [];
  }

  // ------------------------------------------------------------------ primitives (UE coordinates)
  _matrix(center, size, rot) {
    const q = rot ? rot.quat3() : new THREE.Quaternion();
    return new THREE.Matrix4().compose(center.to3(), q, new THREE.Vector3(size.X, size.Z, size.Y));
  }
  AddInstance(meshId, center, size, rot, color, collide, glow, nav) {
    const m = this._matrix(center, size, rot);
    const key = meshId + '|' + (glow ? 1 : 0);
    if (!this.inst.has(key)) this.inst.set(key, []);
    this.inst.get(key).push({ m, c: hex(color) });
    if (collide) {
      const g = COLGEOS[meshId].clone().applyMatrix4(m);
      this.colSolid.push(g);
      if (nav) {
        const b = new THREE.Box3().setFromBufferAttribute(g.attributes.position);
        this.game.navBlockBox3(b, 1);
      }
    }
  }
  Box(center, size, color, collide = true, nav = true, yaw = 0) { this.AddInstance(0, center, size, R(0, yaw, 0), color, collide, false, nav); }
  BoxRot(center, size, color, rot, collide = true) { this.AddInstance(0, center, size, rot, color, collide, false, false); }
  Glow(center, size, color, meshId = 0, rot = null) { this.AddInstance(meshId, center, size, rot || R(0, 0, 0), color, false, true, false); }
  Cyl(center, d, h, color, collide = true, nav = true, rot = null) { this.AddInstance(1, center, V(d, d, h), rot || R(0, 0, 0), color, collide, false, nav); }
  Ball(center, size, color, collide = false) { this.AddInstance(2, center, size, R(0, 0, 0), color, collide, false, false); }
  ConeShape(center, size, color, collide = false, rot = null) { this.AddInstance(3, center, size, rot || R(0, 0, 0), color, collide, false, false); }
  Arch(center, size, color, rot = null, collide = false) { this.AddInstance(4, center, size, rot || R(0, 0, 0), color, collide, false, false); }
  Wedge(center, size, color, rot = null, collide = false) { this.AddInstance(5, center, size, rot || R(0, 0, 0), color, collide, false, false); }
  Pyramid(center, size, color, rot = null, collide = false) { this.AddInstance(6, center, size, rot || R(0, 0, 0), color, collide, false, false); }
  Oct(center, size, color, collide = true, nav = true, rot = null) { this.AddInstance(7, center, size, rot || R(0, 0, 0), color, collide, false, nav); }
  Ring(center, size, color, rot = null) { this.AddInstance(8, center, size, rot || R(0, 0, 0), color, false, false, false); }
  // local-frame helper: position from an object's base, yaw and a local offset
  L(base, yaw, x, y, z) { return base.add(R(0, yaw, 0).RotateVector(V(x, y, z))); }
  Blocker(center, size) {
    const m = this._matrix(center, size, null);
    this.colBlock.push(COLGEOS[0].clone().applyMatrix4(m));
  }
  Ramp(bottom, top, width, color) {
    const D = top.sub(bottom);
    const len = D.Size();
    const X = D.mul(1 / len);
    const side = cross(V(0, 0, 1), X).GetSafeNormal();
    const up = cross(X, side);
    const thick = 30;
    const center = bottom.add(top).mul(0.5).sub(up.mul(thick * 0.5));
    const rot = RotFromXY(X, side);
    this.AddInstance(0, center, V(len + 20, width, thick), rot, color, true, false, false);
    this.AddInstance(0, center.add(side.mul(width * 0.5)).add(up.mul(45)), V(len, 8, 8), rot, Pal.WoodDark, false, false, false);
    this.AddInstance(0, center.sub(side.mul(width * 0.5)).add(up.mul(45)), V(len, 8, 8), rot, Pal.WoodDark, false, false, false);
  }
  Floor(min, max, z, color) {
    const c = min.add(max).mul(0.5), s = max.sub(min);
    this.AddInstance(0, V(c.X, c.Y, z), V(s.X, s.Y, 2), R(0, 0, 0), color, false, false, false);
  }
  Wall(A, B, height, thick, color, gaps, zoneWall, cap = Pal.AdobeDark, lintel = Pal.WoodDark) {
    const D = B.sub(A); const len = D.Size(); const dir = D.mul(1 / len);
    const yaw = Math.atan2(dir.Y, dir.X) * 180 / Math.PI;
    const sorted = [...gaps].sort((a, b) => a.X - b.X);
    let cursor = 0;
    const seg = (s0, s1) => {
      if (s1 - s0 < 1) return;
      const mid = A.add(dir.mul((s0 + s1) * 0.5));
      this.Box(V(mid.X, mid.Y, height * 0.5), V(s1 - s0, thick, height), color, true, true, yaw);
      this.Box(V(mid.X, mid.Y, height + 15), V(s1 - s0, thick + 30, 30), cap, true, false, yaw);
      if (zoneWall) this.ZoneCeiling(mid, s1 - s0, thick, height, dir);
    };
    for (const G of sorted) {
      seg(cursor, G.X);
      if (zoneWall) {
        const mid = A.add(dir.mul((G.X + G.Y) * 0.5));
        this.ZoneCeiling(mid, G.Y - G.X, thick, height, dir);
        this.Box(V(mid.X, mid.Y, height + 15), V(G.Y - G.X + 60, thick + 40, 40), lintel, true, false, yaw);
      }
      cursor = G.Y;
    }
    seg(cursor, len);
  }
  BoxYaw(center, size, color, yaw, collide = true) { this.AddInstance(0, center, size, R(0, yaw, 0), color, collide, false, false); }
  // Invisible wall above a zone wall. It is a switchable blocker, not baked collision: when the zones on both sides
  // are unlocked it is turned off, so you can go over the top (rooftops, grapple, wall-run) as well as through the door.
  ZoneCeiling(mid, len, thick, height, dir) {
    const alongX = Math.abs(dir.X) > 0.7, hx = (alongX ? len : thick) / 2, hy = (alongX ? thick : len) / 2;
    const box = new THREE.Box3(new THREE.Vector3(mid.X - hx, height, mid.Y - hy), new THREE.Vector3(mid.X + hx, height + 5000, mid.Y + hy));
    const zoneOf = (x, y) => this.game.zones.findIndex((Z, i) => i !== this.game.casinoZone && x >= Z.min.X && x <= Z.max.X && y >= Z.min.Y && y <= Z.max.Y);
    const nx = alongX ? 0 : 1, ny = alongX ? 1 : 0;
    const a = zoneOf(mid.X - nx * 250, mid.Y - ny * 250), b = zoneOf(mid.X + nx * 250, mid.Y + ny * 250);
    (this.game.zoneCeilings = this.game.zoneCeilings || []).push({ blk: this.game.phys.addDoor(box), a, b });
  }
  BlockerYaw(center, size, yaw) {
    const m = this._matrix(center, size, R(0, yaw, 0));
    this.colBlock.push(COLGEOS[0].clone().applyMatrix4(m));
  }

  // ------------------------------------------------------------------ sprites (three space helpers)
  spriteAt(name, center3, right3, up3, w, h, tint = [1, 1, 1, 1], kind = 'sprite') {
    const b = this.statics[kind];
    b.pushBasis(sprite(name), center3, right3, up3, w, h, tint[0], tint[1], tint[2], tint[3], 0, 0, kind === 'add' ? 1 : 0);
  }
  Foliage(name, base, height, aspect = 1, tint = [1, 1, 1, 1]) {
    const yaw = FMath.FRandRange(0, Math.PI);
    const c = base.to3().add(new THREE.Vector3(0, height * 0.5, 0));
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < 2; i++) {
      const a = yaw + i * Math.PI / 2;
      const right = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      this.spriteAt(name, c, right, up, height * aspect, height, tint, 'sprite');
    }
  }
  // normal in UE space
  SurfaceDecal(name, point, normal, size, spin, tint = [1, 1, 1, 1], kind = 'sprite') {
    const n = normal.GetSafeNormal().to3();
    const ref = Math.abs(n.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    // wall decals: texture up = world up, right along the wall
    let up = ref.clone().addScaledVector(n, -ref.dot(n)).normalize();
    let right = new THREE.Vector3().crossVectors(up, n).normalize();
    if (spin) {
      const q = new THREE.Quaternion().setFromAxisAngle(n, spin * Math.PI / 180);
      up.applyQuaternion(q); right.applyQuaternion(q);
    }
    const c = point.to3().addScaledVector(n, 1.2 + (this.decalSerial++ % 6) * 0.25);
    this.spriteAt(name, c, right, up, size.X, size.Y, tint, kind);
  }
  GlowCross(center, color, size, strength) {
    const c = center.to3();
    const t = [color.r, color.g, color.b, strength];
    const up = new THREE.Vector3(0, 1, 0);
    this.spriteAt('FX_Glow', c, new THREE.Vector3(1, 0, 0), up, size, size, t, 'add');
    this.spriteAt('FX_Glow', c, new THREE.Vector3(0, 0, 1), up, size, size, t, 'add');
    this.spriteAt('FX_Glow', c, new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), size, size, t, 'add');
  }
  GroundAt(XY) {
    const hit = this.game.phys.raycastDown(new THREE.Vector3(XY.X, 4000, XY.Y), 4300);
    if (!hit) return null;
    return { p: new UVec(hit.point.x, hit.point.z, hit.point.y), n: new UVec(hit.normal.x, hit.normal.z, hit.normal.y) };
  }
  Lamp(loc, color, intensity, radius, bulb) {
    if (bulb) this.AddInstance(2, loc, V(30), R(0, 0, 0), Pal.Bulb, false, true, false);
    const c = lin(color);
    this.pendingLamps.push({ loc, c, radius });
  }
  _finishLamps() {
    for (const L of this.pendingLamps) {
      this.GlowCross(L.loc, L.c, Math.min(520, Math.max(160, L.radius * 0.42)), 0.55);
      const g = this.GroundAt(V2(L.loc.X, L.loc.Y));
      if (g && L.loc.Z - g.p.Z < 900 && L.loc.Z > g.p.Z) {
        this.SurfaceDecal('FX_Glow', g.p, g.n, V2(L.radius * 1.1, L.radius * 1.1), 0, [L.c.r, L.c.g, L.c.b, 0.35], 'add');
      }
    }
  }
  Sign(loc, yaw, text, color, size) {
    const col = `rgb(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)})`;
    const m = textMesh(String(text), size, col, 0.6);
    const rot = R(0, yaw, 0);
    const n = rot.RotateVector(V(1, 0, 0)).to3();
    const r = rot.RotateVector(V(0, -1, 0)).to3();
    const mat = new THREE.Matrix4().makeBasis(r, new THREE.Vector3(0, 1, 0), n);
    m.quaternion.setFromRotationMatrix(mat);
    m.position.copy(loc.to3());
    this.signs.add(m);
  }

  // ------------------------------------------------------------------ set pieces
  Building(Min, Max, Height, WallColor, RoofColor, TrimColor, FacadeDir, Name) {
    const C = Min.add(Max).mul(0.5), S = Max.sub(Min);
    this.Box(V(C.X, C.Y, Height * 0.5), V(S.X, S.Y, Height), WallColor);
    this.Box(V(C.X, C.Y, Height + 10), V(S.X + 20, S.Y + 20, 20), RoofColor, true, false);
    this.Box(V(C.X, Min.Y + 10, Height + 50), V(S.X + 20, 20, 60), TrimColor, true, false);
    this.Box(V(C.X, Max.Y - 10, Height + 50), V(S.X + 20, 20, 60), TrimColor, true, false);
    this.Box(V(Min.X + 10, C.Y, Height + 50), V(20, S.Y + 20, 60), TrimColor, true, false);
    this.Box(V(Max.X - 10, C.Y, Height + 50), V(20, S.Y + 20, 60), TrimColor, true, false);
    this.Box(V(C.X, C.Y, 20), V(S.X + 16, S.Y + 16, 40), TrimColor, true, false);
    this.pendingBuildings.push([Min, Max, Height, FacadeDir]);
    if (FacadeDir === 0) return;
    const bX = Math.abs(FacadeDir) === 1;
    const Sgn = FacadeDir > 0 ? 1 : -1;
    const FaceCoord = bX ? (Sgn > 0 ? Max.X : Min.X) : (Sgn > 0 ? Max.Y : Min.Y);
    const SpanMin = bX ? Min.Y : Min.X, SpanMax = bX ? Max.Y : Max.X, Span = SpanMax - SpanMin;
    const At = (along, out, z) => (bX ? V(FaceCoord + out * Sgn, along, z) : V(along, FaceCoord + out * Sgn, z));
    const Sz = (along, out, z) => (bX ? V(out, along, z) : V(along, out, z));
    const Mid = (SpanMin + SpanMax) * 0.5;
    this.Box(At(Mid, 4, 140), Sz(160, 8, 280), Pal.WoodDark, false, false);
    const Windows = Math.max(1, Math.trunc(Span / 450));
    for (let i = 0; i < Windows; i++) {
      const A = SpanMin + Span * (i + 0.5) / Windows;
      if (Math.abs(A - Mid) < 200) continue;
      this.Glow(At(A, 4, 190), Sz(150, 6, 120), 0xFFB86A);
      this.Box(At(A, 8, 190), Sz(10, 6, 120), Pal.WoodDark, false, false);
      this.Box(At(A, 8, 125), Sz(170, 12, 12), Pal.WoodDark, false, false);
      if (Height > 500) {
        this.Glow(At(A, 4, Height - 170), Sz(110, 6, 110), 0xFFC98A);
        this.Box(At(A, 8, Height - 105), Sz(130, 12, 12), Pal.WoodDark, false, false);
      }
    }
    this.Box(At(Mid, 130, 330), Sz(Span - 60, 260, 18), TrimColor, true, false);
    for (let i = 0; i < 4; i++) {
      const A = SpanMin + 60 + (Span - 120) * i / 3;
      this.Box(At(A, 250, 160), Sz(18, 18, 320), Pal.WoodDark, false, false);
    }
    this.Box(At(Mid, 0, Height + 110), Sz(Span * 0.7, 30, 160), WallColor, true, false);
    this.Box(At(Mid, 18, Height + 110), Sz(Span * 0.6, 6, 110), Pal.Cream, false, false);
    const SignYaw = bX ? (Sgn > 0 ? 0 : 180) : (Sgn > 0 ? 90 : -90);
    this.Sign(At(Mid, 24, Height + 110), SignYaw, Name, { r: 70 / 255, g: 35 / 255, b: 25 / 255 }, 70);
    this.Lamp(At(Mid, 90, 300), { r: 1, g: 0.7, b: 0.4 }, 8, 700, true);
  }
  StreetLamp(Base, Yaw) {
    this.Cyl(Base.add(V(0, 0, 200)), 16, 400, Pal.MetalDark, true, false);
    const Arm = R(0, Yaw, 0).RotateVector(V(60, 0, 0));
    this.Box(Base.add(V(0, 0, 395)).add(Arm.mul(0.5)), V(80, 10, 10), Pal.MetalDark, false, false, Yaw);
    this.ConeShape(Base.add(V(0, 0, 380)).add(Arm), V(50, 50, 30), Pal.MetalDark);
    this.Lamp(Base.add(V(0, 0, 355)).add(Arm), { r: 1, g: 0.72, b: 0.42 }, 10, 900, true);
  }
  Barrel(Base, Color) {
    this.Cyl(Base.add(V(0, 0, 55)), 70, 110, Color, true, true);
    this.Cyl(Base.add(V(0, 0, 30)), 74, 8, Pal.MetalDark, false, false);
    this.Cyl(Base.add(V(0, 0, 85)), 74, 8, Pal.MetalDark, false, false);
  }
  Crate(Base, Size) {
    const c = Base.add(V(0, 0, Size * 0.5));
    this.Box(c, V(Size), Pal.Wood);
    const t = Size * 0.09, e = Size + 4;
    // frame edges + a diagonal brace on two faces
    for (const [x, y] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) this.Box(c.add(V(x * (Size * 0.5 - t * 0.4), y * (Size * 0.5 - t * 0.4), 0)), V(t, t, e), Pal.WoodDark, false, false);
    for (const z of [1, -1]) {
      this.Box(c.add(V(0, Size * 0.5 - t * 0.4, z * (Size * 0.5 - t * 0.4))), V(e, t, t), Pal.WoodDark, false, false);
      this.Box(c.add(V(0, -Size * 0.5 + t * 0.4, z * (Size * 0.5 - t * 0.4))), V(e, t, t), Pal.WoodDark, false, false);
      this.Box(c.add(V(Size * 0.5 - t * 0.4, 0, z * (Size * 0.5 - t * 0.4))), V(t, e, t), Pal.WoodDark, false, false);
      this.Box(c.add(V(-Size * 0.5 + t * 0.4, 0, z * (Size * 0.5 - t * 0.4))), V(t, e, t), Pal.WoodDark, false, false);
    }
    this.BoxRot(c.add(V(Size * 0.5 + 1, 0, 0)), V(t * 0.6, Size * 1.25, t), Pal.WoodDark, R(0, 0, 45), false);
    this.BoxRot(c.add(V(0, Size * 0.5 + 1, 0)), V(Size * 1.25, t * 0.6, t), Pal.WoodDark, R(45, 0, 0), false);
  }
  Cactus(Base, H) {
    this.Blocker(Base.add(V(0, 0, H * 0.5)), V(60, 60, H));
    this.game.navBlockBox3(new THREE.Box3(new THREE.Vector3(Base.X - 30, 0, Base.Y - 30), new THREE.Vector3(Base.X + 30, H, Base.Y + 30)), 1);
    this.Foliage(FMath.RandBool() ? 'P_Cactus_0' : 'P_Cactus_1', Base.sub(V(0, 0, 4)), H * 1.25, 0.8);
  }
  PalmTree(Base, H) {
    const Segs = 7;
    let P = Base;
    const lean = FMath.FRandRange(0, 360);
    const ld = R(0, lean, 0).Vector();
    for (let i = 0; i < Segs; i++) {
      const bend = (i / Segs) * (i / Segs) * 90;
      const Next = P.add(ld.mul(bend * 0.6)).add(V(0, 0, H / Segs));
      const D = Next.sub(P);
      this.AddInstance(7, P.add(Next).mul(0.5), V(48 - i * 3.5, 48 - i * 3.5, D.Size() + 4), RotFromXY(cross(V(0, 0, 1), D.GetSafeNormal()).Size() > 0.01 ? cross(D.GetSafeNormal(), cross(V(0, 0, 1), D.GetSafeNormal())).GetSafeNormal() : V(1, 0, 0), cross(V(0, 0, 1), D.GetSafeNormal()).Size() > 0.01 ? cross(V(0, 0, 1), D.GetSafeNormal()).GetSafeNormal() : V(0, 1, 0)), i % 2 ? 0x8A6A4A : 0x6E5236, i < 2, false);
      P = Next;
    }
    this.Blocker(Base.add(V(0, 0, 200)), V(50, 50, 400));
    this.game.navBlockBox3(new THREE.Box3(new THREE.Vector3(Base.X - 25, 0, Base.Y - 25), new THREE.Vector3(Base.X + 25, 400, Base.Y + 25)), 1);
    // drooping fronds: three tapering segments each, bending further down toward the tip
    const leaf = [0x3E8A3A, 0x34763A, 0x4C9A44];
    for (let k = 0; k < 9; k++) {
      const yaw = k * 40 + FMath.FRandRange(-10, 10);
      let at = P.add(V(0, 0, 6));
      let pitch = k % 2 ? 18 : 6;
      const widths = [70, 56, 34];
      for (let sgi = 0; sgi < 3; sgi++) {
        const len = 115 - sgi * 10;
        const dir = R(pitch, yaw, 0).Vector();
        const c = at.add(dir.mul(len * 0.5));
        this.AddInstance(0, c, V(len + 8, widths[sgi], 6), R(pitch, yaw, 0), leaf[(k + sgi) % 3], false, false, false);
        // centre rib
        this.AddInstance(0, c.add(V(0, 0, 4)), V(len + 8, 6, 4), R(pitch, yaw, 0), 0x2E5A2A, false, false, false);
        at = at.add(dir.mul(len));
        pitch -= 24;
      }
    }
    for (let i = 0; i < 3; i++) this.Ball(P.add(R(0, i * 120, 0).RotateVector(V(26, 0, -24))), V(34), 0x5A3A1E, false);
  }
  DeadTree(Base, H) {
    this.Cyl(Base.add(V(0, 0, H * 0.25)), 46, H * 0.5, 0x3A2E2A, true, true);
    this.Foliage('P_DeadTree', Base.sub(V(0, 0, 4)), H * 1.5, 1.0, [0.9, 0.86, 0.86, 1]);
  }
  Car(Base, Yaw, Color) {
    // 1930s pickup: rounded fenders, long hood with grille, cab with glass, wooden-sided bed
    const L = (x, y, z) => this.L(Base, Yaw, x, y, z);
    const rot = R(0, Yaw, 0);
    const chrome = 0xC8CCD4, glass = 0x26323E, dark = 0x24201E;
    const body = Color;
    const trim = new THREE.Color().setHex(Color, THREE.NoColorSpace).multiplyScalar(0.72).getHex(THREE.NoColorSpace);
    this.BlockerYaw(L(0, 0, 100), V(470, 190, 200), Yaw);
    { const r = 250; this.game.NavBlockBox({ min: Base.sub(V(r * 0.8, r * 0.8, 0)), max: Base.add(V(r * 0.8, r * 0.8, 200)) }, 1); }
    this.AddInstance(0, L(0, 0, 46), V(430, 150, 18), rot, dark, true, false, false);           // chassis
    for (const sy of [-1, 1]) this.AddInstance(0, L(20, sy * 88, 44), V(160, 26, 8), rot, dark, false, false, false); // running boards
    for (const [wx, wy] of [[150, 1], [150, -1], [-150, 1], [-150, -1]]) {
      this.AddInstance(1, L(wx, wy * 84, 38), V(76, 76, 26), R(0, Yaw, 90), 0x18161A, false, false, false);   // tyre
      this.AddInstance(1, L(wx, wy * 98, 38), V(36, 36, 4), R(0, Yaw, 90), chrome, false, false, false);     // hubcap
      this.AddInstance(4, L(wx, wy * 80, 44), V(108, 40, 54), rot, trim, false, false, false);             // fender
    }
    this.AddInstance(0, L(140, 0, 86), V(170, 118, 62), rot, body, true, false, false);         // hood
    this.AddInstance(4, L(140, 0, 116), V(166, 116, 18), R(0, Yaw + 90, 0), body, false, false, false); // rounded hood top
    this.AddInstance(0, L(228, 0, 88), V(10, 96, 76), rot, chrome, false, false, false);         // grille
    for (let i = 0; i < 5; i++) this.AddInstance(0, L(234, -36 + i * 18, 88), V(4, 4, 66), rot, 0x6A6E76, false, false, false);
    for (const sy of [-1, 1]) {
      this.AddInstance(2, L(214, sy * 72, 104), V(26), rot, chrome, false, false, false);
      this.AddInstance(2, L(224, sy * 72, 104), V(10, 20, 20), rot, Pal.Bulb, false, true, false);    // headlights
    }
    this.AddInstance(0, L(244, 0, 58), V(12, 196, 14), rot, chrome, false, false, false);        // bumpers
    this.AddInstance(0, L(-244, 0, 58), V(12, 196, 14), rot, chrome, false, false, false);
    // cab
    this.AddInstance(0, L(10, 0, 100), V(114, 164, 60), rot, body, true, false, false);
    this.AddInstance(0, L(10, 0, 152), V(104, 158, 46), rot, glass, false, false, false);
    for (const [px, py] of [[62, 1], [62, -1], [-42, 1], [-42, -1]]) this.AddInstance(0, L(px, py * 78, 152), V(10, 8, 46), rot, body, false, false, false);
    this.AddInstance(0, L(10, 0, 181), V(120, 166, 14), rot, body, false, false, false);
    this.AddInstance(4, L(10, 0, 188), V(166, 118, 14), R(0, Yaw + 90, 0), body, false, false, false);
    // bed with plank sides
    this.AddInstance(0, L(-150, 0, 70), V(170, 166, 12), rot, Pal.WoodDark, false, false, false);
    for (const sy of [-1, 1]) {
      this.AddInstance(0, L(-150, sy * 80, 100), V(172, 8, 50), rot, Pal.Wood, false, false, false);
      this.AddInstance(0, L(-150, sy * 82, 112), V(174, 4, 4), rot, Pal.WoodDark, false, false, false);
    }
    this.AddInstance(0, L(-234, 0, 100), V(8, 166, 50), rot, Pal.Wood, false, false, false);
    this.AddInstance(0, L(-150, 20, 96), V(60, 50, 40), R(0, Yaw + 20, 0), Pal.Wood, false, false, false);   // cargo crate
    this.AddInstance(0, L(-236, 0, 120), V(4, 120, 6), rot, trim, false, false, false);
  }
  Wagon(Base, Yaw) {
    // covered wagon: plank bed, canvas bonnet over hoops, spoked wheels, tongue and a water barrel
    const L = (x, y, z) => this.L(Base, Yaw, x, y, z);
    const rot = R(0, Yaw, 0), across = R(0, Yaw + 90, 0);
    this.BlockerYaw(L(0, 0, 150), V(420, 210, 300), Yaw);
    this.game.NavBlockBox({ min: Base.sub(V(220, 220, 0)), max: Base.add(V(220, 220, 300)) }, 1);
    this.AddInstance(0, L(0, 0, 110), V(380, 160, 24), rot, Pal.WoodDark, true, false, false);
    for (const sy of [-1, 1]) {
      this.AddInstance(0, L(0, sy * 82, 140), V(384, 10, 56), rot, Pal.Wood, false, false, false);
      for (let i = 0; i < 4; i++) this.AddInstance(0, L(-150 + i * 100, sy * 88, 140), V(10, 4, 58), rot, Pal.WoodDark, false, false, false);
    }
    for (const sx of [-1, 1]) this.AddInstance(0, L(sx * 190, 0, 140), V(10, 160, 56), rot, Pal.Wood, false, false, false);
    // canvas bonnet + hoops + dark open back
    this.AddInstance(4, L(-10, 0, 168), V(184, 330, 200), across, Pal.Cream, false, false, false);
    for (let i = 0; i < 4; i++) this.AddInstance(4, L(-150 + i * 95, 0, 166), V(190, 10, 206), across, 0xC8B898, false, false, false);
    this.AddInstance(4, L(-176, 0, 170), V(150, 4, 168), across, 0x2A2420, false, false, false);
    // wheels: rim ring, hub, six spokes
    for (const [wx, wy, d] of [[130, 1, 110], [130, -1, 110], [-130, 1, 140], [-130, -1, 140]]) {
      const c = L(wx, wy * 92, d * 0.5);
      this.AddInstance(8, c, V(d, 10, d), rot, Pal.WoodDark, false, false, false);
      this.AddInstance(1, c, V(24, 24, 16), R(0, Yaw, 90), 0x3A2A20, false, false, false);
      for (let k = 0; k < 3; k++) this.AddInstance(0, c, V(d * 0.9, 5, 6), R(k * 60, Yaw, 0), Pal.Wood, false, false, false);
    }
    this.AddInstance(1, L(130, 0, 55), V(10, 10, 200), R(0, Yaw, 90), Pal.WoodDark, false, false, false);   // axles
    this.AddInstance(1, L(-130, 0, 70), V(10, 10, 200), R(0, Yaw, 90), Pal.WoodDark, false, false, false);
    this.AddInstance(0, L(290, 0, 70), V(200, 10, 10), R(-12, Yaw, 0), Pal.WoodDark, false, false, false);   // tongue
    this.AddInstance(0, L(380, 0, 52), V(10, 120, 10), rot, Pal.WoodDark, false, false, false);
    this.Barrel(L(40, 120, 0), 0x6A4A30);
  }
  Headstone(Base, Yaw, Style) {
    const L = (x, y, z) => this.L(Base, Yaw, x, y, z);
    const rot = R(0, Yaw, 0), across = R(0, Yaw + 90, 0);
    if (Style === 0) {
      // arched tablet on a plinth
      this.AddInstance(0, L(0, 0, 10), V(44, 84, 20), rot, Pal.StoneDark, true, false, true);
      this.AddInstance(0, L(0, 0, 60), V(26, 70, 80), rot, Pal.Stone, true, false, false);
      this.AddInstance(4, L(0, 0, 100), V(70, 26, 36), across, Pal.Stone, false, false, false);
      this.AddInstance(0, L(14, 0, 70), V(2, 40, 6), rot, Pal.StoneDark, false, false, false);
      this.AddInstance(0, L(14, 0, 82), V(2, 30, 4), rot, Pal.StoneDark, false, false, false);
    } else if (Style === 1) {
      // wooden cross on a cairn
      this.AddInstance(7, L(0, 0, 12), V(60, 60, 24), rot, Pal.StoneDark, true, false, true);
      this.AddInstance(0, L(0, 0, 80), V(14, 14, 140), rot, 0x6A5038, true, false, false);
      this.AddInstance(0, L(0, 0, 112), V(14, 74, 14), rot, 0x6A5038, false, false, false);
    } else {
      // obelisk
      this.AddInstance(0, L(0, 0, 12), V(66, 66, 24), rot, Pal.StoneDark, true, false, true);
      this.AddInstance(0, L(0, 0, 34), V(50, 50, 20), rot, Pal.Stone, true, false, false);
      this.AddInstance(0, L(0, 0, 100), V(30, 30, 112), rot, Pal.Stone, true, false, false);
      this.AddInstance(6, L(0, 0, 170), V(30, 30, 28), rot, Pal.Stone, false, false, false);
    }
    // grave mound
    this.AddInstance(4, L(110, 0, 2), V(90, 170, 30), across, 0x7A5A3E, false, false, false);
  }
  Boxcar(Center, Length, Color) {
    this.Box(Center.add(V(0, 0, 45)), V(220, Length - 100, 70), Pal.MetalDark);
    this.Box(Center.add(V(0, 0, 270)), V(320, Length, 360), Color, true, false);
    this.Box(Center.add(V(0, 0, 458)), V(330, Length + 10, 16), Pal.RoofDark, true, false);
    for (let i = 0; i < 4; i++) {
      const Y = (i < 2 ? -1 : 1) * (Length * 0.5 - 140) + ((i % 2) ? 60 : -60);
      this.Cyl(Center.add(V(-110, Y, 40)), 70, 20, 0x222222, false, false, R(0, 0, 90));
      this.Cyl(Center.add(V(110, Y, 40)), 70, 20, 0x222222, false, false, R(0, 0, 90));
    }
    this.Box(Center.add(V(-162, 0, 260)), V(6, 300, 280), Pal.WoodDark, false, false);
    this.Box(Center.add(V(162, 0, 260)), V(6, 300, 280), Pal.WoodDark, false, false);
    for (let i = 0; i < 6; i++) {
      const Y = -Length * 0.5 + Length * (i + 0.5) / 6;
      if (Math.abs(Y) < 200) continue;
      this.Box(Center.add(V(0, Y, 270)), V(330, 12, 360), Pal.RoofDark, false, false);
    }
    for (const sx of [-1, 1]) {
      this.Box(Center.add(V(sx * 166, 0, 412)), V(6, 340, 10), Pal.MetalDark, false, false);    // door rail
      this.Box(Center.add(V(sx * 166, 0, 108)), V(6, 340, 10), Pal.MetalDark, false, false);
      for (let r = 0; r < 7; r++) this.Box(Center.add(V(sx * 166, Length * 0.5 - 40, 120 + r * 46)), V(6, 50, 6), Pal.MetalDark, false, false); // ladder
    }
    this.Box(Center.add(V(0, 0, 470)), V(60, Length - 40, 8), Pal.WoodDark, false, false);     // roof walk
    this.game.NavBlockBox({ min: Center.add(V(-160, -Length * 0.5, 0)), max: Center.add(V(160, Length * 0.5, 450)) }, 1);
  }
  Mesa(Center, Size, Height) {
    // layered butte: strata stepping in as they rise, each tier a little skewed, a darker band under each lip
    const tiers = Height > 600 ? 4 : 3;
    const cols = [Pal.RockA, Pal.RockB, Pal.RedRock, Pal.RockB];
    let z = 0;
    for (let t = 0; t < tiers; t++) {
      const h = Height / tiers;
      const shrink = t * 70;
      const sx = Size.X - shrink - FMath.FRandRange(0, 40), sy = Size.Y - shrink - FMath.FRandRange(0, 40);
      const yaw = FMath.FRandRange(-6, 6);
      const off = V(FMath.FRandRange(-20, 20), FMath.FRandRange(-20, 20), 0);
      this.Box(V(Center.X + off.X, Center.Y + off.Y, z + h * 0.5), V(sx, sy, h), cols[t % cols.length], true, t === 0, yaw);
      this.Box(V(Center.X + off.X, Center.Y + off.Y, z + h - 8), V(sx + 16, sy + 16, 16), 0x7A3A22, true, false, yaw);
      // eroded chunks clinging to the sides
      for (let k = 0; k < 2; k++) {
        const side = (k + t) % 4;
        const along = FMath.FRandRange(-0.35, 0.35);
        const p = side < 2 ? V(Center.X + (side ? 1 : -1) * sx * 0.5, Center.Y + along * sy, z + h * 0.45) : V(Center.X + along * sx, Center.Y + (side === 3 ? 1 : -1) * sy * 0.5, z + h * 0.45);
        this.Box(p, V(FMath.FRandRange(90, 170), FMath.FRandRange(90, 170), h * FMath.FRandRange(0.6, 0.9)), cols[(t + 1) % cols.length], true, false, FMath.FRandRange(0, 90));
      }
      z += h;
    }
    this.Box(V(Center.X, Center.Y, Height + 6), V(Size.X - tiers * 70 + 10, Size.Y - tiers * 70 + 10, 12), 0xC98A52, true, false);
    for (let i = 0; i < 4; i++) {
      const a = FMath.FRandRange(0, Math.PI * 2);
      const r = Math.max(Size.X, Size.Y) * 0.5 + 60;
      this.Ball(V(Center.X + Math.cos(a) * r, Center.Y + Math.sin(a) * r, 30), V(FMath.FRandRange(110, 200), FMath.FRandRange(110, 200), FMath.FRandRange(80, 130)), Pal.RockA, true);
    }
    if (Height > 500) this.Pyramid(V(Center.X + Size.X * 0.2, Center.Y - Size.Y * 0.15, Height + 90), V(120, 120, 180), Pal.RockB, R(0, 20, 0), true);
  }
  Mausoleum(Base, W, D, H, Yaw, Name) {
    // stone tomb: stepped plinth, block with a portico of octagonal columns, pediment, iron door
    const L = (x, y, z) => this.L(Base, Yaw, x, y, z);
    const rot = R(0, Yaw, 0), across = R(0, Yaw + 90, 0);
    this.AddInstance(0, L(0, 0, 15), V(D + 120, W + 120, 30), rot, Pal.StoneDark, true, false, true);
    this.AddInstance(0, L(20, 0, 40), V(D + 60, W + 60, 20), rot, Pal.Stone, true, false, false);
    this.AddInstance(0, L(-30, 0, 50 + H * 0.5), V(D - 60, W, H), rot, Pal.Stone, true, false, true);
    this.AddInstance(0, L(-30, 0, 50 + H + 14), V(D - 20, W + 40, 28), rot, Pal.StoneDark, true, false, false);
    this.AddInstance(5, L(-30, 0, 50 + H + 28 + 60), V(W + 40, D - 20, 120), across, Pal.StoneDark, false, false, false);
    // portico
    const fx = D * 0.5 - 30;
    this.AddInstance(0, L(fx, 0, 50 + H - 20), V(70, W + 20, 40), rot, Pal.StoneDark, false, false, false);
    this.AddInstance(5, L(fx + 6, 0, 50 + H + 40), V(W + 20, 70, 80), across, Pal.Stone, false, false, false);
    for (const sy of [-1, 1]) for (const k of [0, 1]) {
      const y = sy * (W * 0.5 - 30 - k * 70);
      this.AddInstance(7, L(fx, y, 50 + (H - 40) * 0.5), V(36, 36, H - 40), rot, 0xA8A8AE, true, false, false);
      this.AddInstance(0, L(fx, y, 56), V(46, 46, 12), rot, Pal.StoneDark, false, false, false);
    }
    // door: dark recess, iron frame and bars, little cross above
    const dx = D * 0.5 - 60 + 1;
    this.AddInstance(0, L(-30 + (D - 60) * 0.5 + 2, 0, 50 + 120), V(6, 130, 240), rot, 0x141216, false, false, false);
    this.AddInstance(4, L(-30 + (D - 60) * 0.5 + 2, 0, 50 + 240), V(130, 6, 56), across, 0x141216, false, false, false);
    for (let i = 0; i < 4; i++) this.AddInstance(0, L(-30 + (D - 60) * 0.5 + 6, -45 + i * 30, 50 + 120), V(4, 6, 236), rot, 0x4A4E56, false, false, false);
    this.AddInstance(0, L(-30 + (D - 60) * 0.5 + 6, 0, 50 + 200), V(4, 130, 6), rot, 0x4A4E56, false, false, false);
    this.AddInstance(0, L(fx + 40, 0, 50 + H + 70), V(6, 8, 50), rot, Pal.Gold, false, false, false);
    this.AddInstance(0, L(fx + 40, 0, 50 + H + 80), V(6, 30, 8), rot, Pal.Gold, false, false, false);
    if (Name) this.Sign(L(fx + 40, 0, 50 + H - 22), Yaw, Name, { r: 0.18, g: 0.17, b: 0.2 }, 22);
    void dx;
  }
  Fountain(F) {
    // tiered plaza fountain: octagonal basin with a lip, water, column, two bowls, gold finial and spray
    this.Oct(F.add(V(0, 0, 26)), V(720, 720, 52), Pal.Cream, true, true);
    for (let i = 0; i < 8; i++) {
      const d = R(0, i * 45, 0).Vector();
      this.AddInstance(0, F.add(d.mul(342)).add(V(0, 0, 64)), V(40, 290, 28), R(0, i * 45, 0), 0xD8C8A8, false, false, false);
    }
    this.Glow(F.add(V(0, 0, 56)), V(660, 660, 6), Pal.Water, 7);
    this.Oct(F.add(V(0, 0, 150)), V(80, 80, 200), Pal.Cream, true, false);
    this.ConeShape(F.add(V(0, 0, 230)), V(300, 300, 70), Pal.Cream, false, R(180, 0, 0));
    this.Cyl(F.add(V(0, 0, 265)), 300, 8, 0xD8C8A8, false, false);
    this.Glow(F.add(V(0, 0, 262)), V(270, 270, 4), Pal.Water, 1);
    this.Oct(F.add(V(0, 0, 320)), V(46, 46, 110), Pal.Cream, false, false);
    this.ConeShape(F.add(V(0, 0, 380)), V(150, 150, 40), Pal.Cream, false, R(180, 0, 0));
    this.Glow(F.add(V(0, 0, 398)), V(130, 130, 4), Pal.Water, 1);
    this.Ball(F.add(V(0, 0, 420)), V(36), Pal.Gold);
    // water spilling over the bowl lips: each stream arcs out from the lip and falls, with a splash where it lands
    const stream = (yaw, pts, w) => {
      const d = R(0, yaw, 0).Vector();
      const P = pts.map(([r, z]) => F.add(d.mul(r)).add(V(0, 0, z)));
      for (let k = 0; k < P.length - 1; k++) {
        const h = Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]);
        const th = Math.atan2(pts[k + 1][0] - pts[k][0], pts[k][1] - pts[k + 1][1]) * 180 / Math.PI;
        this.Glow(P[k].add(P[k + 1]).mul(0.5), V(w, w, h + w * 0.6), 0x4FB8E8, 1, R(th, yaw, 0));
      }
      this.Glow(P[P.length - 1], V(w * 3.4, w * 3.4, w * 1.2), 0xA8E8FF, 2);
    };
    for (let i = 0; i < 16; i++) {
      stream(i * 22.5 + 11, [[150, 264], [176, 244], [188, 64]], 7);
      if (i % 2 === 0) stream(i * 22.5 + 22, [[74, 398], [92, 384], [100, 266]], 6);
    }
    this.Glow(F.add(V(0, 0, 470)), V(12, 12, 90), 0xCFF6FF, 1);
    this.Ring(F.add(V(0, 0, 66)), V(300, 10, 300), 0xCFF6FF, R(0, 0, 90));
    this.Lamp(F.add(V(0, 0, 120)), { r: 0.3, g: 0.8, b: 1 }, 10, 800, false);
  }
  GasPump(Base, Yaw) {
    const L = (x, y, z) => this.L(Base, Yaw, x, y, z);
    const rot = R(0, Yaw, 0);
    this.AddInstance(0, L(0, 0, 8), V(80, 70, 16), rot, Pal.Concrete, true, false, true);
    this.AddInstance(0, L(0, 0, 90), V(56, 50, 150), rot, Pal.CasinoRed, true, false, false);
    this.AddInstance(0, L(0, 0, 168), V(62, 56, 10), rot, 0x5A0A14, false, false, false);
    this.AddInstance(0, L(29, 0, 120), V(4, 36, 40), rot, 0xFFF2CC, false, true, false);
    this.AddInstance(2, L(0, 0, 196), V(44, 44, 48), rot, 0xFFE8A8, false, true, false);
    this.AddInstance(0, L(0, 0, 176), V(20, 20, 10), rot, 0xC8CCD4, false, false, false);
    this.AddInstance(0, L(0, 30, 110), V(10, 10, 60), rot, 0x1A1A1E, false, false, false);
    this.AddInstance(0, L(16, 30, 76), V(36, 8, 8), R(-30, Yaw, 0), 0x1A1A1E, false, false, false);
    this.AddInstance(0, L(30, 30, 64), V(10, 10, 26), rot, 0xC8CCD4, false, false, false);
  }
  JumpPad() { /* jump pads removed */ }
  Billboard(Center, Length, Yaw, Text) {
    const Rt = R(0, Yaw, 0);
    this.Box(Center, V(30, Length, 360), Pal.Cream, true, false, Yaw);
    this.Box(Center.add(V(0, 0, 190)), V(40, Length + 20, 20), Pal.WoodDark, true, false, Yaw);
    this.Box(Center.sub(V(0, 0, 190)), V(40, Length + 20, 20), Pal.WoodDark, true, false, Yaw);
    const Along = Rt.RotateVector(V(0, 1, 0));
    this.Cyl(Center.sub(V(0, 0, Center.Z * 0.5 + 90)).add(Along.mul(Length * 0.35)), 26, Center.Z - 180, Pal.WoodDark, false, false);
    this.Cyl(Center.sub(V(0, 0, Center.Z * 0.5 + 90)).sub(Along.mul(Length * 0.35)), 26, Center.Z - 180, Pal.WoodDark, false, false);
    const N = Rt.RotateVector(V(1, 0, 0));
    this.Box(Center.add(N.mul(17)), V(4, Length * 0.9, 260), Pal.CasinoRed, false, false, Yaw);
    this.Box(Center.sub(N.mul(17)), V(4, Length * 0.9, 260), Pal.Felt, false, false, Yaw);
    this.Sign(Center.add(N.mul(22)).add(V(0, 0, 40)), Yaw, Text, { r: 1, g: 215 / 255, b: 120 / 255 }, 60);
    this.Sign(Center.sub(N.mul(22)).add(V(0, 0, 40)), Yaw + 180, 'FEELING LUCKY?', { r: 1, g: 240 / 255, b: 200 / 255 }, 60);
  }

  // ------------------------------------------------------------------ gameplay registration
  AddZone(name, min, max, spawns = true) {
    this.game.zones.push({ name, min, max, unlocked: false, spawns });
    return this.game.zones.length - 1;
  }
  Station(type, loc, yaw, cost, weapon, label, size = V(100, 100, 100)) {
    const I = new Interactable(this.game, type, loc, yaw, cost, weapon, label, size);
    this.scene.add(I.group);
    if (type === 'Door') {
      this.doors.push(I);
    } else if (type !== 'WallBuy' && type !== 'ExitBell' && type !== 'MysteryBox' && type !== 'Chest') {
      const ext = (type === 'UpgradeCounter' || type === 'StatBooth') ? V(60, 170, 120) : V(60, 70, 120);
      this.game.NavBlockBox({ min: loc.sub(ext), max: loc.add(ext) }, 1);
      I.solid = true;
    }
    this.game.registerInteractable(I);
    return I;
  }
  WallBuy(name, loc, yaw) {
    const i = this.game.data.weapons.findIndex((w) => w.name === name);
    if (i < 0) return;
    const w = this.game.data.weapons[i];
    this.Station('WallBuy', loc, yaw, w.wallCost > 0 ? w.wallCost : 1500, i, w.name);
  }
  Door(center, yaw, cost, zoneA, zoneB) {
    const D = this.Station('Door', V(center.X, center.Y, 0), yaw, cost, -1, this.game.zones[zoneB].name, V(70, 420, 520));
    D.zoneA = zoneA; D.zoneB = zoneB;
  }
  SpawnAt(loc, zone) {
    this.game.spawnPoints.push({ pos: loc.to3(), zone });
    this.Box(V(loc.X, loc.Y, 3), V(170, 120, 6), 0x4A3426, false, false, frand() * 180);
    this.Box(V(loc.X + 30, loc.Y - 20, 8), V(60, 50, 12), 0x3A281C, false, false, frand() * 180);
  }

  // ------------------------------------------------------------------ build
  build() {
    randInit(1337);
    this.pendingLamps = [];
    this.pendingBuildings = [];
    const GM = this.game;
    if (GM.mapId !== 0) return this.buildMap(GM.map);
    GM.navInit(-15200, -15200, 15200, 15200, 100);
    this.AddZone('Motel Courtyard', V2(-6000, -6000), V2(-2000, -2000));
    this.AddZone('Main Street', V2(-6000, -2000), V2(-2000, 6000));
    this.AddZone('Chapel Hill', V2(-2000, -6000), V2(2000, -2000));
    this.AddZone('Rail Yard', V2(-2000, 2000), V2(2000, 6000));
    this.AddZone('Clocktower Square', V2(-2000, -2000), V2(2000, 2000));
    this.AddZone('Boneyard Mesa', V2(2000, -6000), V2(6000, 6000));
    GM.casinoZone = this.AddZone('Clocktower Square', V2(-900, -1100), V2(900, 1100), false);
    GM.zones[GM.casinoZone].unlocked = true;
    // the outskirts: four districts wrapped around the old town, about tripling the map
    this.AddZone('Shanty Row', V2(-10600, -10600), V2(-6000, 6000));
    this.AddZone('Stockyards', V2(-6000, -10600), V2(10600, -6000));
    this.AddZone('Refinery', V2(6000, -6000), V2(10600, 10600));
    this.AddZone('Ghost Rails', V2(-10600, 6000), V2(6000, 10600));
    // the Badlands: one ring right round the outside (listed last, so every inner district is matched first)
    this.AddZone('The Badlands', V2(-15000, -15000), V2(15000, 15000));
    // Districts. The town used to be eleven walled yards; it is now six, each two or three of the old ones with the
    // walls between them taken down. A district is a set of rectangles that share a name and open together.
    const DISTRICT = [['Main Street', [0, 1]], ['Clocktower Square', [2, 3, 4, GM.casinoZone]], ['Boneyard Mesa', [5]], ['Shanty Row', [7, 10]], ['The Stockyards', [8, 9]], ['The Badlands', [11]]];
    DISTRICT.forEach(([name, list], gi) => { for (const zi of list) { GM.zones[zi].name = name; GM.zones[zi].group = gi; } });
    // bind methods for the translated zone builders
    const M = {};
    for (const k of ['Box', 'BoxRot', 'Glow', 'Cyl', 'Ball', 'ConeShape', 'Blocker', 'Ramp', 'Floor', 'Wall', 'Lamp', 'Sign', 'Building', 'StreetLamp',
      'Barrel', 'Crate', 'Cactus', 'PalmTree', 'DeadTree', 'Car', 'Wagon', 'Headstone', 'Boxcar', 'Mesa', 'JumpPad', 'Billboard', 'Station',
      'WallBuy', 'Door', 'SpawnAt', 'AddInstance', 'Foliage', 'SurfaceDecal', 'Arch', 'Wedge', 'Pyramid', 'Oct', 'Ring', 'Mausoleum', 'Fountain', 'GasPump', 'BoxYaw']) {
      const f = this[k].bind(this);
      M[k] = (...args) => { const loc = args.find((x) => x && x.X !== undefined); if (loc && !['Box', 'AddInstance', 'Cyl', 'Ball', 'Glow', 'BoxRot', 'ConeShape', 'Blocker', 'Foliage', 'SurfaceDecal', 'Floor', 'Wall', 'Ramp'].includes(k)) this.debugLog.push({ k, x: loc.X, y: loc.Y, z: loc.Z, a: args.filter((x) => typeof x === 'string' || typeof x === 'number').slice(0, 3) }); return f(...args); };
    }
    this.debugLog = [];
    M.RotFromXY = RotFromXY;
    M.AreaBlocked = (x0, y0, x1, y1) => { for (let x = x0; x <= x1; x += 100) for (let y = y0; y <= y1; y += 100) { const [cx, cy] = GM.cellOf(x, y); if (!GM.navFree(cx, cy)) return true; } return false; };
    const gmShim = {
      set PlayerSpawn(v) { GM.playerSpawn = v.to3(); },
      set CasinoBounds(b) { GM.casinoBounds = { minX: b.min.X, maxX: b.max.X, minZ: b.min.Y, maxZ: b.max.Y }; },
      set CasinoOutside(v) { GM.casinoOutside = v.to3(); },
      NavBlockBox: (b, d) => GM.NavBlockBox(b, d),
    };
    Z.BuildGroundAndBounds(M, gmShim);
    Z.BuildMotel(M, gmShim);
    Z.BuildMainStreet(M, gmShim);
    Z.BuildChapel(M, gmShim);
    Z.BuildRailYard(M, gmShim);
    Z.BuildPlaza(M, gmShim);
    Z.BuildPlazaCentre(M, gmShim);
    Z.BuildMesa(M, gmShim);
    Z.BuildOutskirts(M, gmShim);
    Z.BuildBadlands(M, gmShim);
    Z.BuildDoors(M, gmShim);
    Z.BuildVault(M, gmShim);
    this.placeLoot();
    this.finish();
  }
  // Any map but the first. The map's own file lays everything out through the same primitives; what is shared is the
  // registration (zones, districts, doors, spawn pits), the loot placement and the last room.
  buildMap(MAP) {
    const GM = this.game, M = {};
    for (const k of ['Box', 'BoxRot', 'Glow', 'Cyl', 'Ball', 'ConeShape', 'Blocker', 'Ramp', 'Floor', 'Wall', 'Lamp', 'Sign', 'Building', 'StreetLamp', 'Barrel', 'Crate', 'DeadTree', 'Wagon', 'Headstone', 'Boxcar',
      'Station', 'WallBuy', 'Door', 'SpawnAt', 'AddInstance', 'Foliage', 'SurfaceDecal', 'Arch', 'Wedge', 'Pyramid', 'Oct', 'Ring', 'BoxYaw', 'BlockerYaw', 'AddZone', 'L', 'GlowCross']) M[k] = this[k].bind(this);
    M.RotFromXY = RotFromXY; M.GM = GM; M.world = this;
    M.Districts = (list) => list.forEach(([name, zs], gi) => { for (const zi of zs) { GM.zones[zi].name = name; GM.zones[zi].group = gi; } });
    M.Spawn = (v) => { GM.playerSpawn = v.to3(); };
    this.decor = [];
    M.Decor = (min, max, count, kinds) => this.decor.push([min, max, count, kinds]);
    MAP.build(M);
    Z.BuildVault(M, null, MAP.vault);
    this.placeLoot(MAP.loot);
    this.finish();
  }

  // Chests and mystery-box spots. Each sits on open ground beside something solid, clear of doors and spawn pits.
  // The spread is fixed (same seed every run): cheap chests in town, better ones further out, the best on the
  // Badlands' corner towers where only the skyway reaches.
  placeLoot(CFG) {
    const GM = this.game, taken = [];
    const free = (x, y, pad) => { const [cx, cy] = GM.cellOf(x, y); for (let a = -pad; a <= pad; a++) for (let b = -pad; b <= pad; b++) if (!GM.navFree(cx + a, cy + b)) return false; return true; };
    const wallDir = (x, y) => { const [cx, cy] = GM.cellOf(x, y); let sx = 0, sy = 0, n = 0; for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) if (!GM.navFree(cx + a, cy + b)) { sx += a; sy += b; n++; } return n ? [sx, sy, n] : null; };
    const clear = (x, y, d) => taken.every((t) => Math.hypot(t[0] - x, t[1] - y) > d) && GM.spawnPoints.every((S) => Math.hypot(S.pos.x - x, S.pos.z - y) > 320) && GM.interactables.every((I) => Math.hypot(I.pos.x - x, I.pos.z - y) > 520);
    const find = (zi, ringOnly, spacing) => {
      const Z = GM.zones[zi];
      for (let tries = 0; tries < 600; tries++) {
        const x = FMath.FRandRange(Z.min.X + 300, Z.max.X - 300), y = FMath.FRandRange(Z.min.Y + 300, Z.max.Y - 300);
        if (ringOnly && !CFG && Math.max(Math.abs(x), Math.abs(y)) < 11000) continue;
        if (GM.zoneAt({ x, y: 0, z: y }) !== zi) continue;
        if (!free(x, y, 1)) continue;
        const wd = wallDir(x, y); if (!wd || wd[2] < 4) continue;                     // wants something at its back
        if (!clear(x, y, spacing)) continue;
        taken.push([x, y]);
        return [x, y, Math.atan2(-wd[1], -wd[0]) * 180 / Math.PI];                  // face away from the wall
      }
      return null;
    };
    const chest = (zi, tier, ring) => { const s = find(zi, ring, 1100); return s ? this.Station('Chest', V(s[0], s[1], 0), s[2], 0, tier, 'Chest') : null; };
    // a dozen to begin with; the rest arrive during the run (Game.dropChest)
    const PLAN = CFG ? CFG.chests : { 0: [0], 1: [0], 2: [0], 3: [1], 4: [0], 5: [1], 7: [1], 8: [1], 9: [2], 10: [1], 11: [2, 2] };
    GM.spawnChest = (zi, tier) => chest(zi, tier, zi === 11);
    if (CFG) {
      for (const zi in PLAN) for (const tier of PLAN[zi]) chest(+zi, tier, false);
      for (const [x, y, z, yaw] of CFG.relics || []) this.Station('Chest', V(x, y, z), yaw, 0, 3, 'Chest');   // reliquaries: somewhere you have to work to reach
      const [bx, by, byaw, bz] = CFG.box;
      GM.boxSpots = [{ pos: V(bx, by, 0).to3(), yaw: byaw, zone: bz }];
      for (const zi of CFG.boxZones) { const s = find(zi, false, 900); if (s) GM.boxSpots.push({ pos: V(s[0], s[1], 0).to3(), yaw: s[2], zone: zi }); }
      GM.box = this.Station('MysteryBox', V(bx, by, 0), byaw, 950, -1, 'Mystery Box');
      return;
    }
    for (const zi in PLAN) for (const tier of PLAN[zi]) chest(+zi, tier, +zi === 11);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) this.Station('Chest', V(sx * 12800 - sx * 180, sy * 12800 + sy * 180, 636), sx > 0 ? 180 : 0, 0, 3, 'Chest');   // reliquaries on the corner towers
    // where the mystery box can turn up: one spot per district, starting in the square
    GM.boxSpots = [{ pos: V(60, 640, 0).to3(), yaw: 90, zone: 4 }];
    for (const zi of [1, 2, 3, 5, 7, 8, 9, 10]) { const s = find(zi, false, 900); if (s) GM.boxSpots.push({ pos: V(s[0], s[1], 0).to3(), yaw: s[2], zone: zi }); }
    GM.box = this.Station('MysteryBox', V(60, 640, 0), 90, 950, -1, 'Mystery Box');
  }

  finish() {
    // instanced render batches
    for (const [key, list] of this.inst) {
      const [meshId, glow] = key.split('|').map(Number);
      const mesh = new THREE.InstancedMesh(GEOS[meshId], toonMaterial({ glow: glow ? 1.1 : 0 }), list.length);
      list.forEach((it, i) => { mesh.setMatrixAt(i, it.m); mesh.setColorAt(i, it.c); });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
      this.scene.add(mesh);
    }
    // collision
    const solid = mergeGeometries(this.colSolid.map((g) => { const n = g.toNonIndexed(); for (const k of Object.keys(n.attributes)) if (k !== 'position') n.deleteAttribute(k); return n; }), false);
    const block = mergeGeometries([...this.colSolid, ...this.colBlock].map((g) => { const n = g.toNonIndexed(); for (const k of Object.keys(n.attributes)) if (k !== 'position') n.deleteAttribute(k); return n; }), false);
    this.game.phys.setWorld(solid, block);
    // dressing needs collision for ground traces
    this._finishLamps();
    for (const b of this.pendingBuildings) this.decorateBuilding(...b);
    this.decorate();
    for (const b of Object.values(this.statics)) b.end();
  }

  decorateBuilding(Min, Max, Height, FacadeDir) {
    const faces = [[V(1, 0, 0), Max.X, true], [V(-1, 0, 0), Min.X, true], [V(0, 1, 0), Max.Y, false], [V(0, -1, 0), Min.Y, false]];
    for (const [N, Coord, bX] of faces) {
      const SpanMin = bX ? Min.Y : Min.X, SpanMax = bX ? Max.Y : Max.X, Span = SpanMax - SpanMin;
      const Pt = (along, z) => (bX ? V(Coord, along, z) : V(along, Coord, z));
      const grime = Math.max(1, Math.trunc(Span / 380));
      for (let i = 0; i < grime; i++) {
        const A = SpanMin + Span * (i + 0.5) / grime;
        this.SurfaceDecal('D_Grime', Pt(A, 70 + FMath.FRandRange(-10, 30)), N, V2(Span / grime * 1.25, 150), FMath.FRandRange(-8, 8), [0, 0, 0, 0.32], 'fx');
      }
      const drips = Math.max(1, Math.trunc(Span / 300));
      for (let i = 0; i < drips; i++) {
        if (frand() < 0.6) {
          const A = SpanMin + Span * (i + 0.5) / drips + FMath.FRandRange(-60, 60);
          this.SurfaceDecal('D_Drip', Pt(A, Height - 70), N, V2(220, 150), 0, [0, 0, 0, 0.28], 'fx');
        }
      }
      const marks = FMath.RandRange(1, 3);
      for (let i = 0; i < marks; i++) {
        const A = FMath.FRandRange(SpanMin + 80, SpanMax - 80);
        const z = FMath.FRandRange(120, Math.max(140, Height - 120));
        const pick = FMath.RandRange(0, 2);
        if (pick === 0) this.SurfaceDecal('D_Patch', Pt(A, z), N, V2(150, 110), FMath.FRandRange(-10, 10));
        else this.SurfaceDecal(pick === 1 ? 'D_Crack_0' : 'D_Crack_1', Pt(A, z), N, V2(170, 170), FMath.FRandRange(0, 360), [1, 1, 1, 0.8], 'fx');
      }
    }
    if (FacadeDir !== 0) {
      const bX = Math.abs(FacadeDir) === 1;
      const Sgn = FacadeDir > 0 ? 1 : -1;
      const N = bX ? V(Sgn, 0, 0) : V(0, Sgn, 0);
      const Face = bX ? (Sgn > 0 ? Max.X : Min.X) : (Sgn > 0 ? Max.Y : Min.Y);
      const Mid = bX ? (Min.Y + Max.Y) * 0.5 : (Min.X + Max.X) * 0.5;
      const along = Mid + (FMath.RandBool() ? 1 : -1) * 130;
      const P = bX ? V(Face + 6 * Sgn, along, 170) : V(along, Face + 6 * Sgn, 170);
      this.SurfaceDecal(frand() < 0.6 ? 'D_Wanted' : 'D_Lucky', P, N, V2(70, 92), FMath.FRandRange(-5, 5));
    }
  }

  decorate() {
    if (this.decor) return this.decorateMap();
    const zones = [
      [V2(-5900, -5900), V2(-2100, -2100), 60, ['P_Grass_0', 'P_Grass_1', 'P_Bush', 'P_Grass_2', 'P_Grass_0', 'D_Crack']],
      [V2(-5900, -1900), V2(-2100, 5900), 70, ['P_Grass_1', 'P_Tumble', 'P_Grass_2', 'D_Crack', 'D_Grime', 'P_Grass_0']],
      [V2(-1900, -5900), V2(1900, -2100), 80, ['P_Grass_0', 'P_Grass_1', 'P_Bones', 'P_Bush', 'P_Grass_2', 'P_Grass_1']],
      [V2(-1900, 2100), V2(1900, 5900), 60, ['P_Grass_2', 'P_Bush', 'D_Grime', 'P_Grass_0', 'P_Tumble', 'D_Crack']],
      [V2(-1900, -1900), V2(1900, 1900), 26, ['D_Crack', 'D_Grime', 'P_Grass_1', 'D_Crack', 'P_Grass_0', 'D_Grime']],
      [V2(2100, -5900), V2(5900, 5900), 110, ['P_Grass_2', 'P_Bones', 'P_Cactus', 'P_Grass_0', 'P_Tumble', 'P_Grass_1']],
    ];
    for (const [mn, mx, count, kinds] of zones) {
      for (let i = 0; i < count; i++) {
        const XY = V2(FMath.FRandRange(mn.X, mx.X), FMath.FRandRange(mn.Y, mx.Y));
        if (Math.abs(XY.X) < 950 && Math.abs(XY.Y) < 1150) continue;
        const g = this.GroundAt(XY);
        if (!g || g.n.Z < 0.85 || g.p.Z > 40) continue; // only on the walkable ground, never on roofs, basins or props
        const kind = kinds[FMath.RandRange(0, 5)];
        if (kind === 'D_Crack') this.SurfaceDecal(FMath.RandBool() ? 'D_Crack_0' : 'D_Crack_1', g.p, g.n, V2(260, 260), FMath.FRandRange(0, 360), [1, 1, 1, 0.6], 'fx');
        else if (kind === 'D_Grime') this.SurfaceDecal('D_Grime', g.p, g.n, V2(320, 260), FMath.FRandRange(0, 360), [0, 0, 0, 0.22], 'fx');
        else if (kind === 'P_Cactus') this.Cactus(g.p, FMath.FRandRange(150, 260));
        else if (kind === 'P_Bush') this.Foliage(kind, g.p.sub(V(0, 0, 6)), FMath.FRandRange(80, 130), 1.3);
        else if (kind === 'P_Bones') this.SurfaceDecal('P_Bones', g.p, g.n, V2(140, 140), FMath.FRandRange(0, 360));
        else if (kind === 'P_Tumble') this.Foliage(kind, g.p.sub(V(0, 0, 4)), FMath.FRandRange(60, 90), 1);
        else this.Foliage(kind, g.p.sub(V(0, 0, 3)), FMath.FRandRange(40, 75), 1.2);
      }
    }
    for (let i = 0; i < 18; i++) {
      const XY = V2(FMath.FRandRange(-1900, 1900), FMath.FRandRange(-5800, 1900));
      if (Math.abs(XY.X) <= 950 && Math.abs(XY.Y) <= 1150) continue;
      const g = this.GroundAt(XY);
      if (g && g.n.Z > 0.85 && g.p.Z < 40) this.SurfaceDecal('FX_Blood_' + FMath.RandRange(0, 3), g.p, g.n, V2(140, 140), FMath.FRandRange(0, 360), [0.75, 0.75, 0.75, 1]);
    }
  }
  // dressing for the other maps: each asks for so many of a few kinds of thing over a rectangle of its floor
  decorateMap() {
    for (const [mn, mx, count, kinds] of this.decor) {
      for (let i = 0; i < count; i++) {
        const XY = V2(FMath.FRandRange(mn.X, mx.X), FMath.FRandRange(mn.Y, mx.Y));
        const g = this.GroundAt(XY);
        if (!g || g.n.Z < 0.85 || g.p.Z > 40 || g.p.Z < -5) continue;
        const kind = kinds[FMath.RandRange(0, kinds.length - 1)];
        if (kind === 'D_Crack') this.SurfaceDecal(FMath.RandBool() ? 'D_Crack_0' : 'D_Crack_1', g.p, g.n, V2(260, 260), FMath.FRandRange(0, 360), [1, 1, 1, 0.6], 'fx');
        else if (kind === 'D_Grime') this.SurfaceDecal('D_Grime', g.p, g.n, V2(320, 260), FMath.FRandRange(0, 360), [0, 0, 0, 0.22], 'fx');
        else if (kind === 'P_Bones') this.SurfaceDecal('P_Bones', g.p, g.n, V2(140, 140), FMath.FRandRange(0, 360));
        else if (kind === 'Blood') this.SurfaceDecal('FX_Blood_' + FMath.RandRange(0, 3), g.p, g.n, V2(140, 140), FMath.FRandRange(0, 360), [0.75, 0.75, 0.75, 1]);
        else if (kind === 'P_Bush') this.Foliage(kind, g.p.sub(V(0, 0, 6)), FMath.FRandRange(80, 130), 1.3);
        else if (kind === 'P_Tumble') this.Foliage(kind, g.p.sub(V(0, 0, 4)), FMath.FRandRange(60, 90), 1);
        else if (Array.isArray(kind)) this.Foliage(kind[0], g.p.sub(V(0, 0, 3)), FMath.FRandRange(kind[1], kind[2]), kind[3] || 1, kind[4] || [1, 1, 1, 1]);
        else this.Foliage(kind, g.p.sub(V(0, 0, 3)), FMath.FRandRange(40, 75), 1.2);
      }
    }
  }
}
