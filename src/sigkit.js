// Small things every signature uses.
import * as THREE from 'three';
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const GOLD = [1, 0.84, 0.3];
export const near = (G, c, r, skip) => G.enemies.filter((E) => E !== skip && !E.dead && !E.emerging && E.pos.distanceTo(c) < r);
export const say = (p, pos, text, col, size = 1.05) => p.game.hud.floater(pos.clone().add(V3(0, 60, 0)), text, col, size);
export const front = (p) => p.eye().add(p.forward().multiplyScalar(150));
export const later = (p, t, fn) => { (p.sgQ || (p.sgQ = [])).push({ t, fn }); };
export const mark = (G, E, amt, time) => { const cur = E.markUntil > G.time ? E.markAmt || 0 : 0; E.markAmt = Math.max(cur, amt); E.markUntil = Math.max(E.markUntil || 0, G.time + time); };
export const dist = (p, E) => E.pos.distanceTo(p.pos);
export const camDir = (G) => { const d = new THREE.Vector3(); G.camera.getWorldDirection(d); return d; };
export const cone = (dir, half) => { const u = Math.random(), a = Math.random() * 6.283, r = Math.tan(half) * Math.sqrt(u); const up = Math.abs(dir.y) < 0.99 ? V3(0, 1, 0) : V3(1, 0, 0), x = new THREE.Vector3().crossVectors(dir, up).normalize(), y = new THREE.Vector3().crossVectors(x, dir); return dir.clone().addScaledVector(x, Math.cos(a) * r).addScaledVector(y, Math.sin(a) * r).normalize(); };
// run something as if it were part of a shot: hooks, kills and parts all see the gun that caused it
export const asShot = (p, C, fn) => { const prev = p.shotCtx; p.shotCtx = C; try { fn(); } finally { p.shotCtx = prev; } };
