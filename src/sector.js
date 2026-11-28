// ---- The sectors of the Descent. Each four rooms are one strain of the Blight, and the strain is in the room before
// anything comes out of the dark: its mold creeping in along the walls and over the floor, its caps in the corners, its
// motes in the air. And each strain does one thing to the floor, the same thing in every room of its stretch, so you
// learn it once and then play round it:
//   Toadstool   puffball beds: step close and they burst
//   Rustcap     rust fall: spores come down where you stand
//   Mirecap     mire mold: pools that drag at your feet
//   Nightshade  blooms: a cloud opens near you and hangs there
//   Char        smoulder: the charred patches catch light
// Everyone builds the dressing for themselves from the room's number, so it is the same for all without being sent; the
// host alone lays the hazards, as ordinary markers and fires, which are sent like any other. A boss room is dressed but
// quiet: the boss is enough.
import * as THREE from 'three';
import { Geo } from './propkit.js';
import { toonMaterial } from './render.js';
import { STRAINS } from './blight.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const rgb = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
const mixh = (a, b, k) => { const A = rgb(a), B = rgb(b); return (Math.round((A[0] + (B[0] - A[0]) * k) * 255) << 16) | (Math.round((A[1] + (B[1] - A[1]) * k) * 255) << 8) | Math.round((A[2] + (B[2] - A[2]) * k) * 255); };

export const SECTORS = [
  { hazard: 'Puffball beds', tip: 'the puffball beds burst when you get close. Draw the crowd through them.' },
  { hazard: 'Rust fall', tip: 'rust spores come down where you stand. Keep moving.' },
  { hazard: 'Mire mold', tip: 'the mire pools drag at your feet. Jump or dash across.' },
  { hazard: 'Blooms', tip: 'clouds bloom beside you and hang there. Step out of them.' },
  { hazard: 'Smoulder', tip: 'the charred patches catch light. Off them when they glow.' },
];

// one lit mesh and one unlit (the glowing bits), built in the kit's Z-up space and stood up
function toMesh(G, glow) {
  const { pos, col, idx } = G.out(); if (!idx.length) return null;
  const v = new Float32Array(pos.length); for (let i = 0; i < pos.length; i += 3) { v[i] = pos[i]; v[i + 1] = pos[i + 2]; v[i + 2] = pos[i + 1]; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(v, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
  const m = new THREE.Mesh(g, glow ? new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }) : toonMaterial({ vcol: true, double: true }));
  return m;
}

export class Sector {
  constructor(g, D) {
    this.g = g; this.D = D; this.room = D.room; this.s = g.strainNow(); this.T = STRAINS[this.s];
    this.quiet = D.isBossRoom(); this.t = 0; this.cd = 6; this.queue = []; this.spots = []; this.beds = []; this.pools = []; this.patches = [];
    this.root = new THREE.Group(); g.scene.add(this.root);
    let seed = (D.room * 7919 + D.arena * 104729 + 17) % 2147483647; this.rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    this.build();
  }
  rr(a, b) { return a + this.rnd() * (b - a); }
  // a place on the room's own floor, clear of the doors, the ammo, the bench and the chest, and of everything picked so far
  spot(r, { edge = false, tries = 40 } = {}) {
    const g = this.g, A = this.D.A(), S = this.D.S(), [cx, cy] = A.c, keep = [S.spawn, S.exit, S.ammo, S.bench, S.chest, S.box];
    // a destination names the places its strain's beds and pools go (local [x, y]); each is used once
    if (A.dest && A.beds) { while ((this.bedI = this.bedI || 0) < A.beds.length) { const [bx, by] = A.beds[this.bedI++], x = cx + bx, y = cy + by, gy = g.fx.groundY(V3(x, 300, y), 500); if (gy < -40 || gy > 40) continue; this.spots.push([x, y, r]); return [x, gy, y]; } return null; }
    for (let k = 0; k < tries; k++) {
      let x, y;
      if (edge) { const side = this.rnd() < 0.5, e = this.rnd() < 0.5 ? -1 : 1; x = side ? cx + e * (A.hx - r - this.rr(60, 260)) : cx + this.rr(-A.hx + 400, A.hx - 400); y = side ? cy + this.rr(-A.hy + 500, A.hy - 500) : cy + e * (A.hy - r - this.rr(60, 260)); }
      else { x = cx + this.rr(-A.hx + 500 + r, A.hx - 500 - r); y = cy + this.rr(-A.hy + 700 + r, A.hy - 700 - r); }
      if (keep.some((p) => p && Math.hypot(p[0] - x, p[1] - y) < 650 + r)) continue;
      if (this.spots.some((q) => Math.hypot(q[0] - x, q[1] - y) < q[2] + r + 120)) continue;
      const [ix, iy] = g.cellOf(x, y); if (g.navFree && !g.navFree(ix, iy)) continue;
      const ok = [[0, 0], [r * 0.7, 0], [-r * 0.7, 0], [0, r * 0.7], [0, -r * 0.7]].every(([dx, dy]) => { const [a, b] = g.cellOf(x + dx, y + dy); return !g.navFree || g.navFree(a, b); });
      if (!ok) continue;
      const gy = g.fx.groundY(V3(x, 300, y), 500); if (gy < -40 || gy > 40) continue;   // the floor itself, not a dais or a crate
      if (![0, 1, 2, 3, 4, 5, 6, 7].every((k) => Math.abs(g.fx.groundY(V3(x + Math.cos(k * 0.785) * r, 300, y + Math.sin(k * 0.785) * r), 500) - gy) < 3)) continue;   // and flat all the way out: nothing it lies on drops away under it
      this.spots.push([x, y, r]); return [x, gy, y];
    }
    return null;
  }
  build() {
    const T = this.T, s = this.s, rr = (a, b) => this.rr(a, b), rnd = this.rnd;
    const capD = mixh(T.cap, 0x000000, 0.45), moldA = mixh(T.cap, 0x0a0c08, 0.72), moldB = mixh(T.cap, T.flesh, 0.18), ash = 0x1a1614;
    const lit = new Geo(), glo = new Geo();
    // an irregular flat patch, lying just over the floor
    const patch = (G, x, y, z, r, c, lob = 0.22, k = 1) => { const ring = [], ph = rnd() * 9; for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2, w = 1 + lob * (Math.sin(a * 3 + ph) * 0.6 + Math.sin(a * 5 - ph * 1.3) * 0.4); ring.push([x + Math.cos(a) * r * w * k, y + Math.sin(a) * r * w, z]); } G.fan(x, y, z, ring, c); };
    // a toadstool of the strain: pale stalk, gills under, the cap in the strain's colour with flecks of the flesh
    const toad = (x, y, z, h, w, lean = 0) => {
      const fy = this.g.fx.groundY(V3(x, 300, y), 500); if (Math.abs(fy - z) > 3) return; z = fy - 1;   // stood on the floor right where it grows
      const b = lit.n; lit.lathe([[w * 0.2, 0], [w * 0.16, h * 0.5], [w * 0.13, h * 0.92], [w * 0.5, h * 0.94], [w * 0.52, h * 1.0], [w * 0.4, h + w * 0.22], [0, h + w * 0.3]], (k) => (k < 2 ? T.flesh : k < 3 ? mixh(T.flesh, T.cap, 0.25) : k < 4 ? T.cap : T.cap), 10);
      lit.place(b, { x, y, z, pitch: lean, yaw: rnd() * 360 });
      for (let q = 0; q < 3; q++) { const a = rnd() * 6.28, r = w * rr(0.08, 0.3); const b2 = lit.n; lit.blob(0, 0, 0, w * 0.06, w * 0.06, w * 0.03, T.flesh, { nu: 6, nv: 4 }); lit.place(b2, { x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, z: z + h + w * 0.28 - r * 0.25 }); }
    };
    // ---- creep: mold in along the walls and out over the floor, thickest at the edges (a destination lays its own)
    const n = this.D.A().dest ? 0 : 9 + Math.round(rnd() * 4) + s;
    for (let i = 0; i < n; i++) {
      const r = rr(260, 620), at = this.spot(r * 1.3, { edge: i < n * 0.65 }); if (!at) continue; const [x, gy, y] = at;
      patch(lit, x, y, gy + 1.2, r, moldA, 0.3); patch(lit, x + r * 0.12, y - r * 0.08, gy + 2.2, r * 0.6, moldB, 0.35);
      if (s === 4) patch(lit, x - r * 0.1, y + r * 0.1, gy + 2.6, r * 0.35, ash, 0.4);
      for (let q = 0; q < 4 + s; q++) { const a = rnd() * 6.28, d = rnd() * r * 0.7; patch(glo, x + Math.cos(a) * d, y + Math.sin(a) * d, gy + 3.2, rr(6, 16), T.glow, 0.2); }
      if (rnd() < 0.7) for (let q = 0, m = 3 + Math.round(rnd() * 4); q < m; q++) { const a = rnd() * 6.28, d = rnd() * r * 0.5, big = q === 0 ? 1.6 : 1; toad(x + Math.cos(a) * d, y + Math.sin(a) * d, gy, rr(26, 54) * big, rr(26, 46) * big, rr(-14, 14)); }
    }
    // ---- the strain's own thing
    if (s === 0) for (let i = 0; i < 5; i++) {   // puffball beds: a clutch of pale, swollen balls each with a lit pore on top
      const at = this.spot(290); if (!at) continue; const [x, gy, y] = at, L = new Geo(), Gl = new Geo();
      patch(L, 0, 0, 1.4, 230, moldA, 0.25);
      for (let q = 0, m = 3 + Math.round(rnd() * 2); q < m; q++) {
        const a = (q / m) * 6.28 + rnd() * 0.6, d = q ? rr(70, 140) : 0, R = q ? rr(34, 52) : rr(58, 70), px = Math.cos(a) * d, py = Math.sin(a) * d, ph = rnd() * 9;
        L.blob(px, py, R * 0.78, R, R, R * 0.82, (nx, ny, nz) => (nz < -0.55 ? mixh(T.flesh, 0x6a5a40, 0.5) : nz > 0.7 ? mixh(T.flesh, 0xffffff, 0.15) : mixh(T.flesh, 0xb49a70, 0.25 + 0.2 * Math.sin(nx * 5 + ph))), { nu: 16, nv: 10, warp: (X, Y, Z, nx, ny, nz) => { const w = 1 + 0.06 * Math.sin(nx * 6 + ph) * Math.cos(ny * 5); return [X * w, Y * w, Z * w]; } });
        patch(Gl, px, py, R * 0.78 + R * 0.83, R * 0.18, T.glow, 0.1);
        for (let k = 0; k < 4; k++) { const b = rnd() * 6.28, rz = rr(0.2, 0.7); patch(Gl, px + Math.cos(b) * R * 0.75 * (1 - rz * 0.5), py + Math.sin(b) * R * 0.75 * (1 - rz * 0.5), R * 0.78 + R * 0.82 * rz, R * 0.07, mixh(T.glow, T.flesh, 0.4), 0.1); }
      }
      const grp = new THREE.Group(); grp.position.set(x, gy, y); for (const m of [toMesh(L, false), toMesh(Gl, true)]) if (m) grp.add(m); this.root.add(grp);
      this.beds.push({ x, y, gy, grp, cd: 0, pop: 0 });
    }
    if (s === 1) {   // rust fall: sacs of it hang from the roof, swaying, over the whole room
      const A = this.D.A(), top = A.H + 4;   // hung from the roof itself
      for (let i = 0; i < 14; i++) { const x = A.c[0] + rr(-A.hx + 400, A.hx - 400), y = A.c[1] + rr(-A.hy + 600, A.hy - 600), L = rr(120, 420), R = rr(40, 80), b = lit.n;
        lit.tube([[x, y, top], [x + rr(-20, 20), y + rr(-20, 20), top - L * 0.5], [x, y, top - L]], 4, mixh(T.flesh, 0x000000, 0.3), { S: 5 });
        lit.blob(x, y, top - L - R * 0.9, R * 0.8, R * 0.8, R, (nx, ny, nz) => (nz > 0.6 ? T.flesh : mixh(T.cap, 0x3a1a08, nz < -0.5 ? 0.4 : 0)), { nu: 12, nv: 8 });
        patch(glo, x, y, top - L - R * 1.9, R * 0.22, T.glow, 0.1); void b; }
    }
    if (s === 2) for (let i = 0; i < 6; i++) {   // mire mold: dark, wet pools rimmed with growth, bubbles standing in them
      const r = rr(230, 360), at = this.spot(r * 1.3); if (!at) continue; const [x, gy, y] = at;
      patch(lit, x, y, gy + 1.6, r * 1.12, mixh(T.cap, T.flesh, 0.25), 0.18); patch(lit, x, y, gy + 2.6, r, mixh(T.cap, 0x020604, 0.75), 0.16); patch(lit, x, y, gy + 3.2, r * 0.82, mixh(T.cap, 0x0a1c14, 0.55), 0.16);
      for (let q = 0; q < 7; q++) { const a = rnd() * 6.28, d = rnd() * r * 0.75, R = rr(8, 20); lit.blob(x + Math.cos(a) * d, y + Math.sin(a) * d, gy + 3, R, R, R * 0.55, mixh(T.glow, T.cap, 0.6), { nu: 8, nv: 5 }); }
      for (let q = 0; q < 10; q++) { const a = rnd() * 6.28, d = r * rr(0.2, 0.8); patch(glo, x + Math.cos(a) * d, y + Math.sin(a) * d, gy + 4, rr(5, 12), T.glow, 0.2); }
      this.pools.push({ x, y, gy, r });
    }
    if (s === 4) for (let i = 0; i < 7; i++) {   // smoulder: black crusts split by cracks that glow from under
      const r = rr(190, 290), at = this.spot(r * 1.2); if (!at) continue; const [x, gy, y] = at, L = new Geo(), Gl = new Geo();
      patch(L, 0, 0, 1.6, r, 0x141010, 0.2); patch(L, r * 0.1, 0, 2.4, r * 0.7, 0x241c18, 0.3);
      for (let q = 0; q < 7; q++) { const a = (q / 7) * 6.28 + rnd() * 0.4; let px = 0, py = 0; const pts = []; for (let k = 0; k < 4; k++) { px += Math.cos(a + rr(-0.5, 0.5)) * r * 0.24; py += Math.sin(a + rr(-0.5, 0.5)) * r * 0.24; pts.push([px, py]); }
        for (let k = 0; k < pts.length - 1; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], nx = -(y1 - y0), ny = x1 - x0, l = Math.hypot(nx, ny) || 1, w = (7 - k * 1.5) / l; const b = Gl.n; for (const [X, Y] of [[x0 + nx * w, y0 + ny * w], [x0 - nx * w, y0 - ny * w], [x1 - nx * w * 0.6, y1 - ny * w * 0.6], [x1 + nx * w * 0.6, y1 + ny * w * 0.6]]) Gl.v(X, Y, 3.4, mixh(T.glow, 0xffe0a0, k * 0.15)); Gl.idx.push(b, b + 1, b + 2, b, b + 2, b + 3); } }
      patch(Gl, 0, 0, 3.6, r * 0.12, 0xffb050, 0.2);
      const grp = new THREE.Group(); grp.position.set(x, gy, y); const mL = toMesh(L, false), mG = toMesh(Gl, true); if (mL) grp.add(mL); if (mG) grp.add(mG); this.root.add(grp);
      this.patches.push({ x, y, gy, r, glow: mG, heat: 0 });
    }
    for (const m of [toMesh(lit, false), toMesh(glo, true)]) if (m) this.root.add(m);
  }
  // ---- every frame, everyone: the motes, the beds and patches answering their warnings, the mire at your own feet
  tick(dt) {
    const g = this.g, P = g.player, T = this.T, gl = rgb(T.glow);
    this.t += dt;
    if (g.phase !== 'Village' && !P.dead && Math.random() < dt * 9) {   // motes of the strain drifting up through the room
      const a = Math.random() * 6.28, r = 300 + Math.random() * 1500;
      g.fx.add({ pos: V3(P.pos.x + Math.cos(a) * r, P.pos.y - 80 + Math.random() * 260, P.pos.z + Math.sin(a) * r), vel: V3((Math.random() - 0.5) * 30, 18 + Math.random() * 30, (Math.random() - 0.5) * 30), life: 3.5, size0: 5, size1: 8, c0: [gl[0], gl[1], gl[2], 0.9], fadeIn: 0.3, fadeOut: 0.4, glow: 1, tex: 'FX_Disc' });
    }
    const warned = (x, y, r) => g.hazards.list.some((H) => H.kind === 'Marker' && H.age < 0.2 && Math.hypot(H.pos.x - x, H.pos.z - y) < r);
    for (const B of this.beds) {   // a bed that was set off sags flat and swells back
      if (B.pop <= 0 && warned(B.x, B.y, 80)) B.pop = 1;
      if (B.pop > 0) { B.pop -= dt / 10; const k = B.pop > 0.93 ? 1 - (1 - B.pop) / 0.07 * 0.65 : 0.35 + 0.65 * Math.min(1, (0.93 - B.pop) / 0.6); B.grp.scale.set(1 + (1 - k) * 0.25, Math.max(0.3, k), 1 + (1 - k) * 0.25); }
      else B.grp.scale.set(1, 1 + 0.03 * Math.sin(this.t * 2 + B.x), 1);
    }
    for (const C of this.patches) {   // a patch about to catch burns bright through its cracks
      if (warned(C.x, C.y, 60)) C.heat = 1;
      C.heat = Math.max(0, C.heat - dt / 4.5);
      if (C.glow) { const k = 0.55 + 0.25 * Math.sin(this.t * 1.7 + C.x) + C.heat * 1.2; C.glow.material.color.setRGB(k, k, k); }
    }
    if (this.pools.length && !P.dead && P.grounded) for (const Q of this.pools) if (Math.hypot(P.pos.x - Q.x, P.pos.z - Q.y) < Q.r && P.pos.y - 90 < Q.gy + 40) {
      if (P.slowT <= 0.05) P.slowAmt = 0.4; else P.slowAmt = Math.max(P.slowAmt, 0.4); P.slowT = Math.max(P.slowT, 0.15);
      if (Math.random() < dt * 6 && Math.hypot(P.vel.x, P.vel.z) > 100) g.fx.add({ pos: V3(P.pos.x + (Math.random() - 0.5) * 60, Q.gy + 6, P.pos.z + (Math.random() - 0.5) * 60), vel: V3(0, 90, 0), gravity: 300, life: 0.5, size0: 14, size1: 4, c0: [gl[0] * 0.5, gl[1] * 0.6, gl[2] * 0.5, 0.9], tex: 'FX_Disc' });
      break;
    }
  }
  // ---- the host: lays the strain's hazard while the room is being fought
  hostTick(dt) {
    const g = this.g, D = this.D;
    if (this.quiet || D.cleared || g.phase !== 'Round' || g.roundT < 3) return;
    const room = this.D.depth || this.room, dmg = 10 + room * 1.1, dps = 7 + room * 0.45, col = rgb(this.T.glow), rust = [0.95, 0.55, 0.2];
    const players = [g.player, ...g.net.ghosts.values()].filter((T) => !T.dead && (!T.pos || T.pos.y < 600));
    const floor = (x, z) => { const y = g.fx.groundY(V3(x, 300, z), 500); return y < -40 || y > 40 ? null : V3(x, y + 1, z); };
    for (const Q of this.queue) { Q.t -= dt; if (Q.t <= 0) { g.hazards.fire(Q.at, Q.dps, Q.r, Q.life, Q.col); Q.done = true; } }
    this.queue = this.queue.filter((Q) => !Q.done);
    if (this.s === 0) for (const B of this.beds) { B.cd -= dt; if (B.cd <= 0 && players.some((T) => Math.hypot(T.pos.x - B.x, T.pos.z - B.y) < 300)) { B.cd = 11; g.hazards.marker(V3(B.x, B.gy + 1, B.y), dmg, 330, 0.8, col); } }
    if ((this.cd -= dt) > 0) return;
    if (this.s === 1) { this.cd = 6.5 + Math.random() * 2; for (const T of players) { const v = T.vel || V3(0, 0, 0), at = floor(T.pos.x + v.x * 0.55, T.pos.z + v.z * 0.55); if (at) g.hazards.marker(at, dmg, 220, 1.4, rust); } }
    else if (this.s === 3) { this.cd = 8.5 + Math.random() * 2; for (const T of players) { const a = Math.random() * 6.28, d = 160 + Math.random() * 220, at = floor(T.pos.x + Math.cos(a) * d, T.pos.z + Math.sin(a) * d); if (at) { g.hazards.marker(at, 0, 290, 1.1, col); this.queue.push({ t: 1.1, at, dps, r: 290, life: 5, col }); } } }
    else if (this.s === 4) { this.cd = 5.5 + Math.random() * 1.5; const near = this.patches.map((C) => [C, Math.min(...players.map((T) => Math.hypot(T.pos.x - C.x, T.pos.z - C.y)))]).filter(([, d]) => d < 1500).sort((a, b) => a[1] - b[1]).slice(0, 2);
      for (const [C] of near) { const at = V3(C.x, C.gy + 1, C.y); g.hazards.marker(at, 0, C.r, 1.3, [1, 0.45, 0.12]); this.queue.push({ t: 1.3, at, dps: dps * 1.2, r: C.r, life: 3.5, col: [1, 0.4, 0.1] }); } }
    else this.cd = 1e9;
  }
  dispose() { this.g.scene.remove(this.root); this.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
}
