// Sculpting kit for map props: soft shapes built once and handed to world.Shape(). Everything is in UE coordinates
// (X forward, Y right, Z up; cm). A Geo collects vertices with their own colour, so one shape can carry a cloth's hem,
// a barrel's hoops or a mushroom's spots and still be a single batch. Colour edges are crisp because each colour region
// is its own surface (its vertices are not shared with the next one).
import * as THREE from 'three';

const C = new THREE.Color();
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// a cheap smooth value noise, so cloth and bark are uneven without being random from one build to the next
export const wob = (a, b = 0) => Math.sin(a * 1.7 + b * 2.3) * 0.5 + Math.sin(a * 3.1 - b * 1.3 + 1.7) * 0.3 + Math.sin(a * 5.3 + b * 4.1 + 0.4) * 0.2;

export class Geo {
  constructor() { this.pos = []; this.col = []; this.idx = []; }
  get n() { return this.pos.length / 3; }
  v(x, y, z, c) { C.setHex(c, THREE.NoColorSpace); this.pos.push(x, y, z); this.col.push(C.r, C.g, C.b); return this.n - 1; }
  out() { return { pos: this.pos, col: this.col, idx: this.idx }; }
  // move everything added since `from` with f([x, y, z]) -> [x, y, z]
  map(from, f) { for (let i = from * 3; i < this.pos.length; i += 3) { const [x, y, z] = f([this.pos[i], this.pos[i + 1], this.pos[i + 2]]); this.pos[i] = x; this.pos[i + 1] = y; this.pos[i + 2] = z; } return this; }
  // turn (degrees about Z, then tip about Y, then roll about X) and move what was added since `from`
  place(from, { x = 0, y = 0, z = 0, yaw = 0, pitch = 0, roll = 0, s = 1 } = {}) {
    const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(roll * Math.PI / 180, pitch * Math.PI / 180, yaw * Math.PI / 180, 'ZYX')), p = new THREE.Vector3();
    return this.map(from, ([a, b, c]) => { p.set(a * s, b * s, c * s).applyMatrix4(m); return [p.x + x, p.y + y, p.z + z]; });
  }
  // a grid surface: f(u, v) -> [x, y, z] for u, v in [u0, u1] x [v0, v1]; c a colour or c(u, v); wrapU joins the u ends
  surf(f, u0, u1, nu, v0, v1, nv, c, wrapU = false) {
    const b = this.n, cols = wrapU ? nu : nu + 1;
    for (let j = 0; j <= nv; j++) for (let i = 0; i < cols; i++) { const u = u0 + ((u1 - u0) * i) / nu, v = v0 + ((v1 - v0) * j) / nv, [x, y, z] = f(u, v); this.v(x, y, z, typeof c === 'function' ? c(u, v) : c); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = b + j * cols + i, a2 = b + j * cols + ((i + 1) % cols), d = a + cols, d2 = a2 + cols; this.idx.push(a, a2, d, a2, d2, d); }
    return this;
  }
  // a closed disc fan: centre and a ring of points
  fan(cx, cy, cz, ring, c) { const k = this.v(cx, cy, cz, c), b = this.n; for (const [x, y, z] of ring) this.v(x, y, z, c); for (let i = 0; i < ring.length; i++) this.idx.push(k, b + i, b + ((i + 1) % ring.length)); return this; }
  // a tube along a smooth path through pts ([x, y, z] each): r a radius or r(t); c a colour or c(t, a); S sides; caps closes
  // the ends round. flat(t) -> [k1, k2] squashes the section (a strap, a root).
  tube(pts, r, c, { S = 10, M = 0, caps = true, flat = null, open = false } = {}) {
    const curve = new THREE.CatmullRomCurve3(pts.map((q) => V3(q[0], q[1], q[2])), false, 'centripetal'), L = curve.getLength();
    M = M || Math.max(4, Math.min(48, Math.round(L / 14)));
    const R = typeof r === 'function' ? r : () => r, cf = typeof c === 'function' ? c : () => c, b = this.n;
    let N = null; const rings = [];
    for (let i = 0; i <= M; i++) {
      const t = i / M, P = curve.getPointAt(t), T = curve.getTangentAt(t);
      if (!N) N = Math.abs(T.z) < 0.9 ? V3(0, 0, 1) : V3(1, 0, 0);
      N = N.clone().addScaledVector(T, -N.dot(T)).normalize(); const B = new THREE.Vector3().crossVectors(T, N);
      const cap = caps ? Math.min(0.5, R(t) / L) : 0, e = cap && t < cap ? Math.sqrt(Math.max(0, 1 - ((cap - t) / cap) ** 2)) : cap && t > 1 - cap ? Math.sqrt(Math.max(0, 1 - ((t - 1 + cap) / cap) ** 2)) : 1;
      const rr = Math.max(0.3, R(t) * e), [fa, fb] = flat ? flat(t) : [1, 1];
      for (let j = 0; j < S; j++) { const a = (j / S) * Math.PI * 2, ca = Math.cos(a) * rr * fa, sa = Math.sin(a) * rr * fb; this.v(P.x + N.x * ca + B.x * sa, P.y + N.y * ca + B.y * sa, P.z + N.z * ca + B.z * sa, cf(t, a)); }
      rings.push(P);
    }
    for (let i = 0; i < M; i++) for (let j = 0; j < S; j++) { const a = b + i * S + j, a2 = b + i * S + ((j + 1) % S); this.idx.push(a, a2, a + S, a2, a2 + S, a + S); }
    if (open) { /* ends left open: the tube runs into something */ }
    return this;
  }
  // a body of revolution about Z: prof [[r, z], ...] bottom to top; c a colour or c(k, t) for profile point k (t its share
  // of the way up). Each profile span is its own band, so colour changes between points are crisp. at: offset.
  lathe(prof, c, S = 16, at = [0, 0, 0], squash = [1, 1]) {
    const cf = typeof c === 'function' ? c : () => c, n = prof.length;
    // runs of spans that share a colour are one smooth surface; a new colour starts a new one (a crisp edge)
    for (let k = 0; k < n - 1;) {
      const col = cf(k, k / (n - 1)); let e = k + 1; while (e < n - 1 && cf(e, e / (n - 1)) === col) e++;
      const k0 = k;
      this.surf((u, v) => { const a = u * Math.PI * 2, i = Math.round(v), [r, z] = prof[k0 + i]; return [at[0] + Math.cos(a) * r * squash[0], at[1] + Math.sin(a) * r * squash[1], at[2] + z]; }, 0, 1, S, 0, e - k, e - k, col, true);
      k = e;
    }
    // close a profile that ends off the axis
    if (prof[0][0] > 0.01) { const [r, z] = prof[0], ring = []; for (let j = 0; j < S; j++) { const a = (j / S) * Math.PI * 2; ring.push([at[0] + Math.cos(a) * r * squash[0], at[1] + Math.sin(a) * r * squash[1], at[2] + z]); } this.fan(at[0], at[1], at[2] + z, ring, cf(0, 0)); }
    if (prof[n - 1][0] > 0.01) { const [r, z] = prof[n - 1], ring = []; for (let j = 0; j < S; j++) { const a = (j / S) * Math.PI * 2; ring.push([at[0] + Math.cos(a) * r * squash[0], at[1] + Math.sin(a) * r * squash[1], at[2] + z]); } this.fan(at[0], at[1], at[2] + z, ring, cf(n - 2, 1)); }
    return this;
  }
  // a box with crisp flat faces (half sizes hx, hy, hz): planks, boards, battens, beams, staves. Each face has its own
  // corners, so edges stay sharp and a face can take its own colour: c a colour or c(nx, ny, nz) with the face's normal.
  box(cx, cy, cz, hx, hy, hz, c) {
    const cf = typeof c === 'function' ? c : () => c;
    const F = [[[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1], [1, 0, 0]], [[-1, 1, -1], [-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 0, 0]],
      [[1, 1, -1], [-1, 1, -1], [-1, 1, 1], [1, 1, 1], [0, 1, 0]], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1], [0, -1, 0]],
      [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1], [0, 0, 1]], [[-1, 1, -1], [1, 1, -1], [1, -1, -1], [-1, -1, -1], [0, 0, -1]]];
    for (const [a, b, d, e, n] of F) { const col = cf(n[0], n[1], n[2]), k = this.n; for (const [sx, sy, sz] of [a, b, d, e]) this.v(cx + sx * hx, cy + sy * hy, cz + sz * hz, col); this.idx.push(k, k + 1, k + 2, k, k + 2, k + 3); }
    return this;
  }
  // a rounded block (superellipsoid): half sizes hx, hy, hz; e how square (2 a ball, 6 a cushion, 10 a block with soft
  // edges); warp(x, y, z, nx, ny, nz) -> [x, y, z] dents and puffs it; c a colour or c(x, y, z)
  blob(cx, cy, cz, hx, hy, hz, c, { e = 2, nu = 20, nv = 12, warp = null } = {}) {
    const sp = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), p), p = 2 / e;
    return this.surf((u, v) => {
      const th = u * Math.PI * 2, ph = -Math.PI / 2 + v * Math.PI, cp = Math.cos(ph);
      let x = hx * sp(cp, p) * sp(Math.cos(th), p), y = hy * sp(cp, p) * sp(Math.sin(th), p), z = hz * sp(Math.sin(ph), p);
      if (warp) [x, y, z] = warp(x, y, z, cp * Math.cos(th), cp * Math.sin(th), Math.sin(ph));
      return [cx + x, cy + y, cz + z];
    }, 0, 1, nu, 0, 1, nv, typeof c === 'function' ? (u, v) => { const th = u * Math.PI * 2, ph = -Math.PI / 2 + v * Math.PI; return c(Math.cos(ph) * Math.cos(th), Math.cos(ph) * Math.sin(th), Math.sin(ph)); } : c, true);
  }
}
// build a shape: fn(G) fills a Geo
export const shape = (fn) => () => { const G = new Geo(); fn(G); return G.out(); };
// the same for built things (planks, boards, staves): a squared-off blob (e 8 or more, no warp) is drawn as a true box,
// so a board's ends are square and a row of them closes up, where a blob's poles would taper them to points
export const shapeB = (fn) => () => { const G = new Geo(), blob = G.blob.bind(G); G.blob = (cx, cy, cz, hx, hy, hz, c, o = {}) => ((o.e || 2) >= 8 && !o.warp ? G.box(cx, cy, cz, hx, hy, hz, c) : blob(cx, cy, cz, hx, hy, hz, c, o)); fn(G); return G.out(); };
