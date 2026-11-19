// Collision: one static BVH for solid geometry (blocks movement + bullets), one including invisible blockers
// (movement only), plus a list of door boxes that can open. Capsule movement with substeps, step-up and
// contact normals (used for wall-running, mantling and landing).
import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';

const _seg = new THREE.Line3();
const _box = new THREE.Box3();
const _tri = new THREE.Vector3();
const _cap = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _ray = new THREE.Ray();
const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _hitPt = new THREE.Vector3();

export class Physics {
  constructor() {
    this.solid = null;
    this.move = null;
    this.doors = []; // { box: THREE.Box3, enabled }
  }
  setWorld(solidGeo, moveGeo) {
    this.solid = new MeshBVH(solidGeo, { maxLeafTris: 8 });
    this.move = new MeshBVH(moveGeo, { maxLeafTris: 8 });
  }
  addDoor(box) { const d = { box, enabled: true }; this.doors.push(d); return d; }

  // Pushes a capsule (segment start=bottom sphere center, end=top sphere center) out of geometry.
  // Returns accumulated push vector; contacts receive normals.
  _resolve(bvh, seg, radius, contacts) {
    const push = new THREE.Vector3();
    for (let iter = 0; iter < 3; iter++) {
      _box.makeEmpty();
      _box.expandByPoint(seg.start); _box.expandByPoint(seg.end);
      _box.min.addScalar(-radius); _box.max.addScalar(radius);
      let any = false;
      bvh.shapecast({
        intersectsBounds: (b) => b.intersectsBox(_box),
        intersectsTriangle: (tri) => {
          tri.closestPointToSegment(seg, _tri, _cap);
          const d = _tri.distanceTo(_cap);
          if (d < radius) {
            const depth = radius - d;
            if (d > 1e-4) _dir.subVectors(_cap, _tri).divideScalar(d);
            else tri.getNormal(_dir);
            seg.start.addScaledVector(_dir, depth);
            seg.end.addScaledVector(_dir, depth);
            push.addScaledVector(_dir, depth);
            if (contacts) contacts.push(_dir.clone());
            any = true;
          }
        },
      });
      // doors
      for (const D of this.doors) {
        if (!D.enabled) continue;
        for (let k = 0; k < 3; k++) {
          const t = k / 2;
          _v.lerpVectors(seg.start, seg.end, t);
          D.box.clampPoint(_v, _v2);
          const d = _v.distanceTo(_v2);
          if (d < radius) {
            let depth = radius - d;
            if (d > 1e-4) _dir.subVectors(_v, _v2).divideScalar(d);
            else {
              // sample point is inside the box: leave through the nearest side face
              const b = D.box;
              const opts = [[_v.x - b.min.x, -1, 0], [b.max.x - _v.x, 1, 0], [_v.z - b.min.z, 0, -1], [b.max.z - _v.z, 0, 1]];
              opts.sort((p, q) => p[0] - q[0]);
              _dir.set(opts[0][1], 0, opts[0][2]);
              depth = opts[0][0] + radius;
            }
            seg.start.addScaledVector(_dir, depth);
            seg.end.addScaledVector(_dir, depth);
            push.addScaledVector(_dir, depth);
            if (contacts) contacts.push(_dir.clone());
            any = true;
          }
        }
      }
      if (!any) break;
    }
    return push;
  }

  // pos = capsule center. Moves by vel*dt; modifies vel; returns contact info.
  moveCapsule(pos, vel, dt, radius, halfHeight, opts = {}) {
    const out = { grounded: false, groundNormal: new THREE.Vector3(0, 1, 0), walls: [], ceiling: false, stepped: false };
    if (!this.move) { pos.addScaledVector(vel, dt); return out; }
    const disp = vel.length() * dt;
    const steps = Math.max(1, Math.min(8, Math.ceil(disp / (radius * 0.6))));
    const sdt = dt / steps;
    const inner = Math.max(0, halfHeight - radius);
    for (let s = 0; s < steps; s++) {
      const before = pos.clone();
      pos.addScaledVector(vel, sdt);
      _seg.start.set(pos.x, pos.y - inner, pos.z);
      _seg.end.set(pos.x, pos.y + inner, pos.z);
      const contacts = [];
      const push = this._resolve(this.move, _seg, radius, contacts);
      // step up small ledges while walking
      if (opts.stepHeight && opts.wasGrounded) {
        let blockedH = false;
        for (const c of contacts) if (Math.abs(c.y) < 0.3) blockedH = true;
        if (blockedH) {
          const tryPos = before.clone().add(new THREE.Vector3(0, opts.stepHeight, 0));
          tryPos.x += vel.x * sdt; tryPos.z += vel.z * sdt;
          const seg2 = new THREE.Line3(new THREE.Vector3(tryPos.x, tryPos.y - inner, tryPos.z), new THREE.Vector3(tryPos.x, tryPos.y + inner, tryPos.z));
          const c2 = [];
          const p2 = this._resolve(this.move, seg2, radius, c2);
          let stillBlocked = false;
          for (const c of c2) if (Math.abs(c.y) < 0.3) stillBlocked = true;
          if (!stillBlocked && p2.length() < 2) {
            // drop back down onto the step
            const down = this.raycastDown(new THREE.Vector3(tryPos.x, tryPos.y - halfHeight + 5, tryPos.z), opts.stepHeight + 10, true);
            if (down) {
              pos.set(tryPos.x, down.point.y + halfHeight + 0.5, tryPos.z);
              out.stepped = true;
              out.grounded = true;
              continue;
            }
          }
        }
      }
      pos.set(_seg.start.x, _seg.start.y + inner, _seg.start.z);
      for (const c of contacts) {
        if (c.y > 0.55) {
          out.grounded = true;
          out.groundNormal.copy(c);
        } else if (c.y < -0.6) {
          out.ceiling = true;
        } else {
          out.walls.push(c);
        }
        const vn = vel.dot(c);
        if (vn < 0) vel.addScaledVector(c, -vn);
      }
      if (push.lengthSq() < 1e-6 && contacts.length === 0) continue;
    }
    return out;
  }

  overlapsCapsule(pos, radius, halfHeight) {
    const inner = Math.max(0, halfHeight - radius);
    const seg = new THREE.Line3(new THREE.Vector3(pos.x, pos.y - inner, pos.z), new THREE.Vector3(pos.x, pos.y + inner, pos.z));
    const p = this._resolve(this.move, seg, radius, null);
    return p.length() > 0.5;
  }

  // First hit along a ray against solid geometry (+ closed doors). Returns {point, normal, distance, door} or null.
  raycast(origin, dir, maxDist, includeBlockers = false) {
    if (!this.solid) return null;
    _ray.origin.copy(origin);
    _ray.direction.copy(dir).normalize();
    const bvh = includeBlockers ? this.move : this.solid;
    const hit = bvh.raycastFirst(_ray, THREE.DoubleSide, 0, maxDist);
    let best = null;
    if (hit && hit.distance <= maxDist) {
      const n = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);
      if (n.dot(_ray.direction) > 0) n.negate();
      best = { point: hit.point.clone(), normal: n, distance: hit.distance, door: null };
    }
    for (const D of this.doors) {
      if (!D.enabled) continue;
      if (_ray.intersectBox(D.box, _hitPt)) {
        const d = _hitPt.distanceTo(origin);
        if (d <= maxDist && (!best || d < best.distance)) {
          const c = D.box.getCenter(_v);
          const n = new THREE.Vector3();
          const rel = _hitPt.clone().sub(c);
          const sz = D.box.getSize(_v2).multiplyScalar(0.5);
          const ax = Math.abs(rel.x / sz.x), ay = Math.abs(rel.y / sz.y), az = Math.abs(rel.z / sz.z);
          if (ax >= ay && ax >= az) n.set(Math.sign(rel.x), 0, 0); else if (ay >= az) n.set(0, Math.sign(rel.y), 0); else n.set(0, 0, Math.sign(rel.z));
          best = { point: _hitPt.clone(), normal: n, distance: d, door: D };
        }
      }
    }
    return best;
  }
  raycastDown(origin, maxDist, includeBlockers = false) {
    return this.raycast(origin, new THREE.Vector3(0, -1, 0), maxDist, includeBlockers);
  }
  lineOfSight(a, b) {
    _v.subVectors(b, a);
    const d = _v.length();
    if (d < 1) return true;
    return !this.raycast(a, _v.divideScalar(d), d - 5);
  }
}
