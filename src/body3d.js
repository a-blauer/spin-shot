// Enemies in the round.
//
// Every creature in the game is drawn as a set of flat painted parts (a body, a head, arms, legs, a tail, wings, whatever
// it is holding). This turns each of those parts into a solid:
//
//  SCULPTING  The part's silhouette is read off the art. For every point inside it we work out how far it is from the
//             edge and how wide the limb is at that point, and raise the surface to a round cross-section: an arm becomes
//             a tube, a belly becomes a dome, a blade stays thin. The same is done on the back, so the two shells meet at
//             the outline. The big forms come first and nothing is added that the outline does not already say.
//  PAINTING   The front keeps the painted art exactly. The back cannot (it would show a second face), so it is painted in
//             the art's own colour blocks: every vertex takes the average colour of the art around it, which keeps the
//             shirt a shirt and the hair hair, and loses the features. Light then falls on the forms in the same two
//             bands as the rest of the world.
//  RIGGING    The parts hang on the pivots they always had, but now in depth: legs swing fore and aft, arms come up and
//             reach forward, the body leans into a run and goes over backwards when it dies, and the whole thing turns
//             to face whoever it is after instead of always facing you.
//  COST       Each part of each kind of creature is one instanced mesh, so a room of sixty enemies of eight kinds is some
//             sixty draw calls and no per-frame geometry work; a creature is two to four thousand triangles.
import * as THREE from 'three';
import { Atlas, G as UNI } from './render.js';
import { Puppet, getParts } from './puppet.js';
import { IronhideRig } from './ironhide.js';
import { BLIGHT, blightMaterial, strainRGB } from './blight.js';
const CUSTOM = new Set();   // creatures with a hand-sculpted body instead of one raised from their art

const D2R = Math.PI / 180;
const DEPTH = { Body: 0.82, Head: 1.0, ArmFront: 1.0, ArmBack: 1.0, LegFront: 1.0, LegBack: 1.0, Tail: 0.85, WingFront: 0.14, WingBack: 0.14, Prop: 0.4 };

// ------------------------------------------------------------------------------------------------ sculpting a part
const _cv = typeof document !== 'undefined' ? document.createElement('canvas') : null;
function sculpt(D, role, soft = 0) {
  const m = Atlas.meta[D.tex], tex = Atlas.tex[m.atlas], img = tex && tex.image;
  const W = D.size[0], H = D.size[1];
  const RW = Math.max(10, Math.min(56, Math.round(W / 2.2))), RH = Math.max(10, Math.min(56, Math.round(H / 2.2)));
  let px = null;
  if (img && _cv) {
    _cv.width = RW; _cv.height = RH; const c = _cv.getContext('2d', { willReadFrequently: true }); c.clearRect(0, 0, RW, RH);
    const iw = img.width, ih = img.height;
    try { c.drawImage(img, m.u0 * iw, m.v0 * ih, (m.u1 - m.u0) * iw, (m.v1 - m.v0) * ih, 0, 0, RW, RH); px = c.getImageData(0, 0, RW, RH).data; } catch (e) { px = null; }
  }
  const N = RW * RH, inside = new Uint8Array(N), d = new Float32Array(N);
  for (let i = 0; i < N; i++) inside[i] = px ? (px[i * 4 + 3] > (soft ? 20 : 110) ? 1 : 0) : 1;
  // distance to the outline, in cm (two-pass chamfer); the picture's own border counts as outline
  const sx = W / RW, sy = H / RH, BIG = 1e6, diag = Math.hypot(sx, sy);
  for (let i = 0; i < N; i++) d[i] = inside[i] ? BIG : 0;
  const at = (x, y) => (x < 0 || y < 0 || x >= RW || y >= RH ? 0 : d[y * RW + x]);
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) { const i = y * RW + x; if (!inside[i]) continue; d[i] = Math.min(d[i], at(x - 1, y) + sx, at(x, y - 1) + sy, at(x - 1, y - 1) + diag, at(x + 1, y - 1) + diag); }
  for (let y = RH - 1; y >= 0; y--) for (let x = RW - 1; x >= 0; x--) { const i = y * RW + x; if (!inside[i]) continue; d[i] = Math.min(d[i], at(x + 1, y) + sx, at(x, y + 1) + sy, at(x + 1, y + 1) + diag, at(x - 1, y + 1) + diag); }
  // how wide the form is here: every point takes the height of the ridge it runs down from
  const r = Float32Array.from(d), order = Array.from({ length: N }, (_, i) => i).filter((i) => inside[i]).sort((a, b) => d[b] - d[a]);
  for (const i of order) { const x = i % RW, y = (i / RW) | 0; let best = r[i];
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const X = x + ox, Y = y + oy; if (X < 0 || Y < 0 || X >= RW || Y >= RH) continue; const j = Y * RW + X; if (d[j] > d[i] && r[j] > best) best = r[j]; }
    r[i] = best; }
  const k = DEPTH[role] ?? 0.6, cap = Math.min(W, H) * 0.5;
  const height = (i) => { if (!inside[i]) return 0; const R = Math.min(r[i], cap), q = Math.min(d[i], R); return Math.sqrt(Math.max(0, R * R - (R - q) * (R - q))) * k; };
  const hf = new Float32Array(N); for (let i = 0; i < N; i++) hf[i] = height(i);
  // one pass of smoothing keeps the facets broad
  const hs = Float32Array.from(hf);
  for (let y = 1; y < RH - 1; y++) for (let x = 1; x < RW - 1; x++) { const i = y * RW + x; if (inside[i]) hs[i] = (hf[i] * 4 + hf[i - 1] + hf[i + 1] + hf[i - RW] + hf[i + RW]) / 8; }
  const sampleH = (u, v) => { const X = Math.max(0, Math.min(RW - 1, u * RW - 0.5)), Y = Math.max(0, Math.min(RH - 1, v * RH - 0.5)), x0 = X | 0, y0 = Y | 0, x1 = Math.min(RW - 1, x0 + 1), y1 = Math.min(RH - 1, y0 + 1), fx = X - x0, fy = Y - y0;
    return (hs[y0 * RW + x0] * (1 - fx) + hs[y0 * RW + x1] * fx) * (1 - fy) + (hs[y1 * RW + x0] * (1 - fx) + hs[y1 * RW + x1] * fx) * fy; };
  // the colour blocks of the art, for the back
  let ar = 0.5, ag = 0.5, ab = 0.5, an = 0;
  if (px) { for (let i = 0; i < N; i++) if (inside[i]) { ar += px[i * 4]; ag += px[i * 4 + 1]; ab += px[i * 4 + 2]; an++; } if (an) { ar /= an * 255; ag /= an * 255; ab /= an * 255; } }
  const blockColour = (u, v) => { if (!px) return [ar, ag, ab]; const cx = Math.round(u * RW - 0.5), cy = Math.round(v * RH - 0.5), R = 3; let rr = 0, gg = 0, bb = 0, n = 0;
    for (let oy = -R; oy <= R; oy++) for (let ox = -R; ox <= R; ox++) { const X = cx + ox, Y = cy + oy; if (X < 0 || Y < 0 || X >= RW || Y >= RH) continue; const j = Y * RW + X; if (!inside[j]) continue; rr += px[j * 4]; gg += px[j * 4 + 1]; bb += px[j * 4 + 2]; n++; }
    return n ? [rr / n / 255, gg / n / 255, bb / n / 255] : [ar, ag, ab]; };

  // The mesh. A grid is laid over the picture and the outline is cut through it cell by cell (marching squares), so the
  // edge of the solid is a clean run of short straight facets that follows the art, and the front and back shells meet
  // exactly on it: a closed form with no painted edge to fall apart when it is seen from the side.
  const nx = Math.max(4, Math.min(16, Math.round(W / 7))), ny = Math.max(4, Math.min(16, Math.round(H / 7)));
  const pos = [], uv = [], nor = [], col = [], side = [], idx = [];
  const [u0, v0, u1, v1] = m.gl || (m.gl = [m.u0, 1 - m.v1, m.u1, 1 - m.v0]);
  // how much of the art covers the neighbourhood of a grid point (0..1)
  const cover = (u, v) => { const cx = u * RW - 0.5, cy = v * RH - 0.5, R = Math.max(1, Math.round(RW / nx * 0.5)), Ry = Math.max(1, Math.round(RH / ny * 0.5)); let n = 0, t = 0;
    for (let oy = -Ry; oy <= Ry; oy++) for (let ox = -R; ox <= R; ox++) { const X = Math.round(cx + ox), Y = Math.round(cy + oy); t++; if (X >= 0 && Y >= 0 && X < RW && Y < RH && inside[Y * RW + X]) n++; } return n / t; };
  const F = new Float32Array((nx + 1) * (ny + 1));
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) F[j * (nx + 1) + i] = cover(i / nx, j / ny) - (soft ? 0.12 : 0.42);
  let zmax = 0; const seen = new Map();
  const vert = (key, u, v, rim, s) => {
    const kk = key + (s ? 'b' : 'f'); let id = seen.get(kk); if (id !== undefined) return id;
    const h = rim ? 0 : Math.max(sampleH(u, v), 0.6); zmax = Math.max(zmax, h);
    const e = 0.5 / Math.max(nx, ny), gx = (sampleH(u + e, v) - sampleH(u - e, v)) / (2 * e * W), gy = (sampleH(u, v - e) - sampleH(u, v + e)) / (2 * e * H), zz = rim ? 0.25 : 1, L = Math.hypot(gx, gy, zz) || 1;
    id = pos.length / 3;
    pos.push((u - 0.5) * W, (0.5 - v) * H, s ? -h : h); uv.push(u0 + (u1 - u0) * u, v1 + (v0 - v1) * v);
    nor.push(-gx / L, -gy / L, (s ? -zz : zz) / L); const c = blockColour(u, v); col.push(c[0], c[1], c[2]); side.push(s);
    seen.set(kk, id); return id;
  };
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const C = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], f = C.map(([a, b]) => F[b * (nx + 1) + a]);
    if (f[0] < 0 && f[1] < 0 && f[2] < 0 && f[3] < 0) continue;
    for (let s = 0; s < 2; s++) {
      const poly = [];
      for (let k = 0; k < 4; k++) { const A = C[k], B = C[(k + 1) & 3], fa = f[k], fb = f[(k + 1) & 3];
        if (fa >= 0) poly.push(vert(A[0] + ',' + A[1], A[0] / nx, A[1] / ny, false, s));
        if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb), x = A[0] + (B[0] - A[0]) * t, y = A[1] + (B[1] - A[1]) * t, lo = (A[0] + A[1] * 100 < B[0] + B[1] * 100) ? A : B, hi = lo === A ? B : A;
          poly.push(vert('e' + lo[0] + ',' + lo[1] + '>' + hi[0] + ',' + hi[1], x / nx, y / ny, true, s)); } }
      for (let k = 1; k + 1 < poly.length; k++) { if (s) idx.push(poly[0], poly[k], poly[k + 1]); else idx.push(poly[0], poly[k + 1], poly[k]); }
    }
  }
  // Art too fine or too faint to raise a form from (a crackle of lightning, a glassy wing): try again reading fainter
  // paint as solid, and if there is still nothing, it stays a flat painted card that turns with the body.
  if (!idx.length && !soft) return sculpt(D, role, 1);
  if (!idx.length) {
    for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { pos.push((u - 0.5) * W, (0.5 - v) * H, 0); uv.push(u0 + (u1 - u0) * u, v1 + (v0 - v1) * v); nor.push(0, 0, 1); col.push(ar, ag, ab); side.push(2); }
    idx.push(0, 3, 1, 1, 3, 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 1));
  g.setIndex(idx);
  return { geo: g, thick: zmax, tris: idx.length / 3 };
}

// ------------------------------------------------------------------------------------------------ the material
const MATS = new Map();
function material(atlas) {
  if (MATS.has(atlas)) return MATS.get(atlas);
  const m = new THREE.ShaderMaterial({
    uniforms: { map: { value: Atlas.tex[atlas] }, sunDir: UNI.sunDir, fogColor: UNI.fogColor, fogParams: UNI.fogParams, spriteTint: UNI.spriteTint },
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute float aSide; attribute vec4 iTint; attribute vec3 color;
      varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec3 vCol; varying float vSide; varying vec4 vTint;
      void main() {
        vec4 p = instanceMatrix * vec4(position, 1.0);
        vec4 w = modelMatrix * p; vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        vUv = uv; vCol = color; vSide = aSide; vTint = iTint;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D map; uniform vec3 sunDir; uniform vec3 fogColor; uniform vec4 fogParams; uniform vec3 spriteTint;
      varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec3 vCol; varying float vSide; varying vec4 vTint;
      void main() {
        vec4 t = texture2D(map, vUv);
        // the front is the painting; the back is its colour blocks, and so is any sliver of the solid the painting does not reach
        if (vSide > 1.5 && t.a < 0.3) discard;   // a flat card keeps its painted edge
        vec3 base = vSide > 1.5 ? t.rgb : mix(vCol, t.rgb, smoothstep(0.3, 0.6, t.a) * (1.0 - step(0.5, vSide)));
        // right up against the eye it thins out to nothing instead of filling the view (a solid body can be stood inside; a cut-out could not)
        float dist = distance(vW, cameraPosition);
        if (dist < 95.0) { float keep = smoothstep(38.0, 95.0, dist); vec2 q = floor(mod(gl_FragCoord.xy, 4.0)); float th = (q.x * 4.0 + mod(q.y * 2.0 + q.x * 3.0, 4.0) + 0.5) / 16.0; if (keep < fract(th + q.y * 0.25)) discard; }
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        // two bands of light, as on everything else, held closer together so the painted colours stay the painted colours
        float ndl = dot(n, sunDir), band = smoothstep(-0.05, 0.1, ndl);
        vec3 c = base * mix(vec3(0.70, 0.72, 0.82), vec3(1.03, 1.02, 0.99), band);
        c *= mix(0.9, 1.0, clamp(n.y * 0.5 + 0.5, 0.0, 1.0));
        // a little of the outline's dark at grazing angles, so the round edge reads against the room
        vec3 vd = normalize(cameraPosition - vW); float rim = 1.0 - clamp(abs(dot(n, vd)), 0.0, 1.0);
        c *= 1.0 - smoothstep(0.72, 1.0, rim) * 0.35;
        c *= vTint.rgb * spriteTint;
        c = mix(c, vec3(1.0, 0.98, 0.92), clamp(vTint.a, 0.0, 1.0));
        float f = clamp(1.0 - exp(-max(dist - fogParams.x, 0.0) * fogParams.y), 0.0, 1.0) * fogParams.w;
        gl_FragColor = vec4(mix(c, fogColor, f), 1.0);
      }`,
  });
  MATS.set(atlas, m); return m;
}

// ------------------------------------------------------------------------------------------------ the batches
// one instanced mesh for each part of each kind of creature
const KINDS = new Map();   // creature -> [{ mesh, tint, n, cap, D }]
let SCENE = null, PARTS = null;
export function bodies3dInit(scene, parts) {
  for (const list of KINDS.values()) for (const K of list) { if (!K) continue; if (K.mesh.parent) K.mesh.parent.remove(K.mesh); if (!K.blight) K.mesh.geometry.dispose(); }
  KINDS.clear(); MATS.clear(); SCENE = scene; PARTS = parts || getParts();
}
function makeMesh(K, cap) {
  const old = K.mesh, mesh = new THREE.InstancedMesh(K.geo, K.blight ? blightMaterial() : material(K.atlas), cap);
  K.tint = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4); K.tint.setUsage(THREE.DynamicDrawUsage); K.geo.setAttribute('iTint', K.tint);
  if (K.blight) for (const a of ['iCap', 'iFlesh', 'iGlow']) { const prev = K[a]; K[a] = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3); K[a].setUsage(THREE.DynamicDrawUsage); K.geo.setAttribute(a, K[a]); if (old && prev) K[a].array.set(prev.array); }   // the strain's three colours, per creature
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false; mesh.count = 0; mesh.renderOrder = 3;
  if (old) { mesh.instanceMatrix.array.set(old.instanceMatrix.array); K.tint.array.set(K.oldTint); SCENE.remove(old); old.dispose(); }   // growing mid-frame keeps what was already queued
  K.oldTint = K.tint.array; K.mesh = mesh; K.cap = cap; SCENE.add(mesh);
}
function kindFor(creature) {
  let list = KINDS.get(creature); if (list) return list;
  list = [];
  const BL = BLIGHT.get(creature);   // sculpted, not raised from art
  if (BL) { for (const pt of BL.parts) { const K = { geo: pt.geo, thick: 0, tris: pt.tris, atlas: 'blight', blight: true, n: 0 }; makeMesh(K, 24); list.push(K); } KINDS.set(creature, list); return list; }
  for (const D of PARTS) { if (D.creature !== creature) continue; const m = Atlas.meta[D.tex]; if (!m || !Atlas.tex[m.atlas]) { list.push(null); continue; }
    const S = sculpt(D, D.role), K = { geo: S.geo, thick: S.thick, tris: S.tris, atlas: m.atlas, n: 0 }; makeMesh(K, 24); list.push(K); }
  KINDS.set(creature, list); return list;
}
export function bodies3dBegin() { for (const list of KINDS.values()) for (const K of list) if (K) K.n = 0; for (const R of CUSTOM) R.frame(); }
export function bodies3dEnd() {
  for (const list of KINDS.values()) for (const K of list) { if (!K) continue; K.mesh.count = K.n; if (K.n) { K.mesh.instanceMatrix.needsUpdate = true; K.tint.needsUpdate = true; if (K.blight) { K.iCap.needsUpdate = true; K.iFlesh.needsUpdate = true; K.iGlow.needsUpdate = true; } } }
}
export function bodies3dStats() { let calls = 0, tris = 0, kinds = 0; for (const list of KINDS.values()) { kinds++; for (const K of list) if (K && K.n) { calls++; tris += K.tris * K.n; } } return { kinds, calls, tris }; }

// ------------------------------------------------------------------------------------------------ one creature
const _root = new THREE.Matrix4(), _m = new THREE.Matrix4(), _a = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1), _p = new THREE.Vector3();
const interpTo = (cur, tgt, dt, speed) => cur + (tgt - cur) * Math.min(1, dt * speed);

const BEASTS = new Set('TimberWolf Lion CinderHound Rat Bullfrog Skitterling Webspinner Scarab Scorpion TwinHound BroodMother Ironhide Carapace Toad Hydra Snapvine Devourer'.split(' '));
export class Body3D extends Puppet {
  constructor(creature, scale, tint, aura, auraSize) {
    super(creature, scale, tint, aura, auraSize);
    this.is3D = true; this.creature = creature; this.facing = 1; this.beast = BEASTS.has(creature) || !!(BLIGHT.get(creature) && BLIGHT.get(creature).beast); this.sculpted = BLIGHT.has(creature); this.strainC = strainRGB(0); this.hasLegs = this.parts.some((q) => q.role === 'LegFront' || q.role === 'LegBack');
    this.kind = SCENE && PARTS ? kindFor(creature) : null;
    if (!this.kind || !this.kind.some(Boolean)) { this.is3D = false; this.kind = null; return; }   // no art to sculpt from: stay a cut-out
    const B = this.parts.find((p) => p.role === 'Body') || this.parts[0];
    this.bodyR = Math.max(18, B.size[0] * 0.42) * scale;
    this.yaw3 = Math.random() * 6.283;
    if (creature === 'Ironhide' && SCENE) { try { this.custom = new IronhideRig(SCENE); CUSTOM.add(this.custom); this.plates = 4; } catch (e) { this.custom = null; if (typeof window !== 'undefined') window.__ihErr = String(e && e.stack || e).slice(0, 300); } }
  }
  setStrain(i) { this.strain = i; this.strainC = strainRGB(i); }
  // a sculpted part knocked off: it flies on its own (spinning, falling, bouncing on the floor) and lies where it lands
  fling(P, at, vel) {
    this.rootMatrix(); this.partMatrix(P, _m); _m.premultiply(_root); const q = new THREE.Quaternion(); _m.decompose(_v, q, _s);
    const ax = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    P.fly = { p: at.clone(), v: vel.clone(), q, ax, w: 6 + Math.random() * 8, rest: false };
  }
  flyTick(dt) {
    if (!this.feet) return;
    for (const P of this.parts) { const F = P.fly; if (!F || F.rest) continue;
      F.v.y -= 2100 * dt; F.p.addScaledVector(F.v, dt); F.q.premultiply(new THREE.Quaternion().setFromAxisAngle(F.ax, F.w * dt));
      const floor = this.feet.y + Math.min(P.size[0], P.size[1]) * 0.25 * this.baseScale;
      if (F.p.y < floor) { F.p.y = floor; if (Math.abs(F.v.y) < 140) { F.rest = true; F.v.set(0, 0, 0); } else { F.v.y *= -0.32; F.v.x *= 0.55; F.v.z *= 0.55; F.w *= 0.5; } } }
  }
  tick(dt, feet, S) {
    super.tick(dt, feet, S);
    if (!this.is3D) return;
    if (this.sculpted) this.flyTick(dt);
    // it faces what it is after (or the way it is going, if that is somewhere else), and takes a moment to come round
    let want = this.yaw3;
    const T = S && S.faceToward;
    if (T) { const dx = T.x - feet.x, dz = T.z - feet.z; if (dx * dx + dz * dz > 1) want = Math.atan2(dx, dz); }
    let d = want - this.yaw3; d = Math.atan2(Math.sin(d), Math.cos(d));
    const step = (S && S.stagger ? 1.2 : this.dying ? 0 : 6.5) * dt; this.yaw3 += Math.max(-step, Math.min(step, d));
    // the flat extras that ride on the body (auras, modifier gear, shadows) sit in the plane it faces
    this.toCam.set(Math.sin(this.yaw3), 0, Math.cos(this.yaw3)); this.right.set(Math.cos(this.yaw3), 0, -Math.sin(this.yaw3));
    const sp = Math.hypot(S.vel.x, S.vel.z);
    this.leanF = interpTo(this.leanF || 0, Math.min(1, sp / Math.max(S.speedRef || 200, 1)), dt, 5);
    if (this.dying && this.fall === undefined) this.fall = Math.random() < 0.5 ? 1 : -1;
  }
  // where each part is: [pitch (fore and aft, about its pivot), roll (in the plane of the art), lift, scale, push forward]
  pose(P) {
    const S = this.S || {}, sw = Math.sin(this.walk), cw = Math.cos(this.walk), st = Math.min(1.2, this.stride || 0), T = this.time, amp = this.amp || 1;
    const side = (P.role === 'ArmBack' || P.role === 'LegBack' || P.role === 'WingBack') ? -1 : 1;
    let pitch = 0, roll = 0, oz = 0, sc = 1, fwd = 0, yaw = 0;
    switch (P.role) {
      case 'LegFront': case 'LegBack': {
        if (S.flying) { pitch = 14 + Math.sin(T * 2 + P.phase) * 8; break; }
        pitch = side * sw * 27 * Math.min(st, 1.1) * Math.min(amp, 1.15); oz = Math.max(0, side * cw) * 9 * st;
        roll = side * Math.sin(T * 0.8 + this.seed) * 2 * (this.idle || 0);
        if (!S.grounded) pitch = side * 22;
        break;
      }
      case 'ArmFront': case 'ArmBack': {
        const reach = this.reach || 0, idle = this.idle || 0;
        // hanging at rest and swaying; up and groping forward on the chase; right back on the wind-up, then down hard
        pitch = -(reach * (58 + side * sw * 16 * amp + Math.sin(T * 2.3 + P.phase) * 6)) + Math.sin(T * 1.7 + P.phase) * 5 * idle + this.twitch * side * 12 * idle;
        if (this.beast) {   // four-footed and many-legged things: the front limbs are legs, so they stride, rear a little, then swipe
          const L = Math.min(1, this.lunge);
          pitch = -side * sw * 24 * Math.min(st, 1.1) + Math.sin(T * 1.7 + P.phase) * 3 * idle;
          pitch = pitch * (1 - this.windup) + -42 * this.windup; pitch = pitch * (1 - L) + -78 * L;
          roll = side * (this.windup * -8 + L * 4); oz = Math.max(0, -side * cw) * 7 * st;
          if (this.dig > 0.01) pitch = pitch * (1 - this.dig) - (60 + Math.sin(T * 14 + P.phase) * 20) * this.dig;
          sc = 1 + L * 0.1; break;
        }
        // back and overhead on the wind-up, then chopped down in front of the body (never swung behind it)
        { const L = Math.min(1, this.lunge); pitch = pitch * (1 - this.windup) + -150 * this.windup; pitch = pitch * (1 - L) + -46 * L; }
        roll = side * (Math.sin(T * 0.9 + P.phase * 2 + this.seed) * 6 * idle - this.windup * 22 + this.lunge * 8);
        // a crawler's arms are drawn already down on the ground, splayed: they are its legs. They paw along in a short
        // stride and rise into the strike; they are never swung up off the ground (that bent them back over the body)
        if (S.crawler && !this.hasLegs) { const L = Math.min(1, this.lunge); pitch = -side * sw * 18 * Math.min(st, 1.1) * (1 - this.windup) - 30 * this.windup * (1 - L) - 40 * L; roll = side * (Math.max(0, side * cw) * 6 * st - this.windup * 8); oz = Math.max(0, -side * cw) * 6 * st; }
        if (S.flying) pitch = -20 + Math.sin(T * 3 + P.phase) * 12 - this.windup * 60 + this.lunge * 40;
        if (this.dig > 0.01) { pitch = pitch * (1 - this.dig) - (165 + Math.sin(T * 14 + P.phase) * 18) * this.dig; }
        sc = 1 + this.lunge * 0.18;
        break;
      }
      case 'Head': roll = Math.sin(T * 1.3 + P.phase) * 3 + (Math.sin(T * 0.55 + this.seed) * 7 + this.twitch * 14) * (this.idle || 0) - sw * 5 * st + this.hurtT * 10 * (this.hurtSide || 1);
        pitch = -this.windup * 14 + this.lunge * 18 + this.hurtT * -16 + Math.sin(T * 0.7 + this.seed) * 4 * (this.idle || 0); oz = Math.abs(cw) * 3 * st; sc = 1 + this.lunge * 0.06; break;
      case 'Body': roll = this.bodyRot * 0.25; break;
      case 'WingFront': case 'WingBack': roll = -side * (Math.sin(T * 11) * 30 - 6); yaw = side * (20 + Math.sin(T * 11) * 16); fwd = -6; break;
      case 'Tail': yaw = Math.sin(T * 3.5 + P.phase) * 22 + sw * 16 * st; pitch = 12 + Math.sin(T * 2 + P.phase) * 6; fwd = -8; break;
      default: roll = side * (Math.sin(T * 1.4 + P.phase) * 4 + sw * 6 * st - this.windup * 16 + this.lunge * 10); pitch = -this.windup * 50 + this.lunge * 60 - (this.reach || 0) * 20; fwd = 4; break;
    }
    return [pitch, roll, oz, sc, fwd, yaw];
  }
  rootMatrix() {
    const f = this.feet, s = this.baseScale;
    let pitch = (this.leanF || 0) * 9 + this.lunge * 8 - this.windup * 8 - this.hurtT * 11, roll = this.bodyRot * 0.45, drop = 0;

    if (this.dying) { const A = Math.min(1, this.deathT / 0.34), e = 1 - (1 - A) * (1 - A); pitch += (this.fall || 1) * -86 * e; roll *= 1 - e; drop = this.deathT > 0.9 ? (this.deathT - 0.9) * 120 : -Math.sin(A * Math.PI) * 14; }
    _e.set(pitch * D2R, this.yaw3, roll * D2R, 'YXZ'); _q.setFromEuler(_e);
    _p.set(f.x, f.y + (this.offZ || 0) * s - drop, f.z);
    _s.set(s * this.sqX, s * this.sqZ, s * this.sqX);
    _root.compose(_p, _q, _s);
    // the waddle's side-to-side shift, and the lunge thrown forward
    _a.makeTranslation((this.offX || 0), 0, this.lunge * 7 - this.windup * 6); _root.multiply(_a);
    return _root;
  }
  partMatrix(P, out) {
    const [pitch, roll, oz, sc, fwd, yaw] = this.pose(P);
    out.makeTranslation(P.rest[0], P.rest[1] + oz, fwd + (P.rz || 0));
    _e.set(pitch * D2R, yaw * D2R, roll * D2R, 'YXZ'); _q.setFromEuler(_e); _a.makeRotationFromQuaternion(_q); out.multiply(_a);
    if (sc !== 1) { _a.makeScale(sc, sc, sc); out.multiply(_a); }
    _a.makeTranslation(P.off[0], P.off[1], 0); out.multiply(_a);
    return out;
  }
  // the flat-rig helpers the rest of the game uses (where the head is, where a limb is) answer from the solid
  partTransform(P, outC, outX, outY) {
    if (!this.is3D) return super.partTransform(P, outC, outX, outY);
    this.rootMatrix(); this.partMatrix(P, _m); _m.premultiply(_root);
    outC.setFromMatrixPosition(_m); const e = _m.elements;
    outX.set(e[0], e[1], e[2]).multiplyScalar(P.size[0]); outY.set(e[4], e[5], e[6]).multiplyScalar(P.size[1]);
  }
  draw(batch, fxBatch, addBatch, alive) {
    super.draw(batch, fxBatch, addBatch, alive);
    if (!this.is3D || !this.visible || !this.feet || !this.S) return;
    const flash = this.flashT > 0 ? 1 : 0, t = this.tint;
    this.rootMatrix();
    if (this.custom) { this.custom.pose(this, _root, (this.heightCm / Math.max(1e-3, this.baseScale)) / 180); return; }
    for (let i = 0; i < this.parts.length; i++) {
      const P = this.parts[i], K = this.kind[i]; if (!K || (!P.visible && !P.fly)) continue;
      if (K.n >= K.cap) makeMesh(K, K.cap * 2);
      if (P.fly) { const b = this.baseScale; _m.compose(P.fly.p, P.fly.q, _s.set(b, b, b)); _a.makeTranslation(P.off[0], P.off[1], 0); _m.multiply(_a); }
      else { this.partMatrix(P, _m); _m.premultiply(_root); }
      _m.toArray(K.mesh.instanceMatrix.array, K.n * 16);
      const a = K.tint.array, o = K.n * 4; a[o] = t[0]; a[o + 1] = t[1]; a[o + 2] = t[2]; a[o + 3] = flash;
      if (K.blight) { const sc = this.strainC, o3 = K.n * 3; K.iCap.array.set(sc[0], o3); K.iFlesh.array.set(sc[1], o3); K.iGlow.array.set(sc[2], o3); }
      K.n++;
    }
  }
}

// for checking the whole bestiary: what was sculpted for a creature, part by part
export function bodies3dAudit(creature) {
  if (!SCENE || !PARTS) return null; const list = kindFor(creature), defs = PARTS.filter((D) => D.creature === creature);
  return defs.map((D, i) => { const K = list[i]; if (!K) return { role: D.role, missing: true };
    const p = K.geo.getAttribute('position').array; let bad = 0; for (let k = 0; k < p.length; k++) if (!Number.isFinite(p[k])) bad++;
    return { role: D.role, tris: K.tris, thick: +K.thick.toFixed(1), w: +D.size[0].toFixed(0), h: +D.size[1].toFixed(0), bad }; });
}

if (typeof window !== 'undefined') window.__Body3D = Body3D;
