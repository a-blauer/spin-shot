// The way to the last boss. Every map hides a short chain of jobs: parts to find, lanterns to feed, things to shoot,
// switches to throw in order, ground to hold. None of it stops the rounds and nothing waits for it: you fit it in
// while the dead keep coming, and the last room opens when the last job is done.
import * as THREE from 'three';
import { V, R } from './mapkit.js';
import { Interactable } from './interact.js';

const C = (h) => new THREE.Color(h);
const rgb = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const to3 = (a) => V3(a[0], a[2] || 0, a[1]);
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const IRON = C(0x2a2c32), DARK = C(0x18181c), BRASS = C(0xb9974a);

export class Quest {
  constructor(game) {
    this.g = game; this.def = game.map.quest || null; this.objs = []; this.i = 0; this.done = false; this.S = null;
    this.seed = (Math.random() * 1e9) | 0; this.t = 0;
    if (this.def) this.enter();
  }
  get active() { return !!this.def && !this.done; }
  past(n) { return this.done || this.i >= n; }   // have the first n jobs been done
  // ---------------------------------------------------------------- things in the world
  // a spot on the ground: on open floor (the nearest, if the mark is inside something) and at the height of that floor
  spot(a) {
    const g = this.g; let x = a[0], y = a[1];
    const [cx, cy] = g.cellOf(x, y), ok = (i, j) => g.navFree(i, j);
    if (!ok(cx, cy)) { let best = null, bd = 1e9; for (let r = 1; r <= 6 && !best; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { if (Math.max(Math.abs(i), Math.abs(j)) !== r || !ok(cx + i, cy + j)) continue; const [px, py] = g.cellCenter(cx + i, cy + j), d = (px - x) ** 2 + (py - y) ** 2; if (d < bd) { bd = d; best = [px, py]; } } if (best) [x, y] = best; }
    const h = g.phys.raycastDown(V3(x, (a[2] || 0) + 260, y), 900);
    return [x, y, h ? h.point.y : (a[2] || 0), a[3] || 0];
  }
  mk(at, yaw = 0) {
    const I = new Interactable(this.g, 'Quest', V(at[0], at[1], at[2] || 0), yaw, 0, -1, '', V(100, 100, 100));
    I.q = { usable: () => false, prompt: () => '', use: () => {} };
    this.g.scene.add(I.group); this.objs.push(I); return I;
  }
  drop(I) { const k = this.objs.indexOf(I); if (k >= 0) this.objs.splice(k, 1); this.g.scene.remove(I.group); }
  clear() { for (const I of this.objs.slice()) this.drop(I); }
  item(at, col) {
    const I = this.mk(at), c = C(col);
    I.core = new THREE.Group(); I.group.add(I.core); I.core.position.y = 70;
    I.part(I.core, 1, V(0, 0, 0), V(26, 26, 64), c, null, 2.2); I.part(I.core, 1, V(0, 0, 36), V(32, 32, 10), BRASS); I.part(I.core, 1, V(0, 0, -36), V(32, 32, 10), BRASS);
    I.part(null, 1, V(0, 0, 3), V(90, 90, 6), DARK); I.glow = rgb(col); I.bob = true;
    return I;
  }
  vessel(at, col) {
    const I = this.mk(at), c = C(col);
    I.part(null, 1, V(0, 0, 8), V(110, 110, 16), IRON); I.part(null, 1, V(0, 0, 70), V(14, 14, 120), IRON);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.785; I.part(null, 0, V(Math.cos(a) * 40, Math.sin(a) * 40, 180), V(6, 6, 110), IRON); }
    I.part(null, 1, V(0, 0, 128), V(100, 100, 10), IRON); I.part(null, 3, V(0, 0, 252), V(110, 110, 44), IRON);
    I.fill = I.part(null, 2, V(0, 0, 180), V(60, 60, 80), c, null, 2.6); I.fill.scale.setScalar(8); I.glow = rgb(col);
    return I;
  }
  target(at, col, r) {
    const I = this.mk(at), c = C(col);
    I.ball = I.part(null, 2, V(0, 0, 0), V(r * 1.7, r * 1.7, r * 1.7), c, null, 2.8); I.part(null, 8, V(0, 0, 0), V(r * 2.6, 10, r * 2.6), IRON); I.part(null, 8, V(0, 0, 0), V(r * 2.6, 10, r * 2.6), IRON, R(0, 90, 0));
    I.glow = rgb(col); return I;
  }
  bell(at, yaw, col, pips) {
    const I = this.mk(at, yaw), c = C(col);
    I.part(null, 0, V(0, 0, 120), V(16, 16, 240), DARK); I.part(null, 0, V(0, 30, 236), V(12, 80, 12), DARK);
    I.swing = new THREE.Group(); I.group.add(I.swing); I.swing.position.set(60, 232, 0);
    I.part(I.swing, 3, V(0, 0, -40), V(70, 70, 64), BRASS); I.part(I.swing, 1, V(0, 0, -74), V(78, 78, 10), BRASS); I.part(I.swing, 2, V(0, 0, -84), V(16, 16, 16), DARK);
    for (let k = 0; k < pips; k++) I.part(null, 2, V(10, 0, 40 + k * 26), V(16, 16, 16), c, null, 2.6);
    I.glow = rgb(col); I.useRadius = 190; return I;
  }
  lever(at, yaw, col) {
    const I = this.mk(at, yaw), c = C(col);
    I.part(null, 0, V(0, 0, 100), V(30, 90, 200), IRON); I.part(null, 0, V(16, 0, 150), V(8, 70, 70), DARK);
    I.arm = I.part(null, 0, V(34, 0, 150), V(70, 10, 10), BRASS, R(40, 0, 0)); I.lamp = I.part(null, 2, V(18, 0, 196), V(18, 18, 18), c, null, 2.6);
    I.glow = rgb(col); I.useRadius = 190; return I;
  }
  post(at, col) { const I = this.mk(at); I.part(null, 1, V(0, 0, 30), V(18, 18, 60), DARK); I.part(null, 2, V(0, 0, 66), V(22, 22, 22), C(col), null, 2.4); return I; }
  // ---------------------------------------------------------------- the chain
  enter() {
    this.clear();
    const D = this.def.steps[this.i], S = this.S = { type: D.type, D, p: [0] }, col = D.color || 0xFFB03A, rand = rng(this.seed + this.i * 7919);
    if (D.type === 'collect') {
      const pool = D.spots.map((s, k) => k); for (let k = pool.length - 1; k > 0; k--) { const j = Math.floor(rand() * (k + 1)); [pool[k], pool[j]] = [pool[j], pool[k]]; }
      S.at = pool.slice(0, D.n).map((k) => this.spot(D.spots[k])); S.items = S.at.map((a) => this.item(a, col)); S.got = S.at.map(() => false);
    } else if (D.type === 'souls') {
      S.v = D.at.map((a) => this.spot(a)).map((a) => ({ I: this.vessel(a, col), pos: to3(a), n: 0 }));
    } else if (D.type === 'shoot') {
      S.tg = D.at.map((a) => ({ I: this.target(a, col, D.r || 50), pos: to3(a), hit: false }));
    } else if (D.type === 'order') {
      const seq = D.at.map((a, k) => k); for (let k = seq.length - 1; k > 0; k--) { const j = Math.floor(rand() * (k + 1)); [seq[k], seq[j]] = [seq[j], seq[k]]; }
      S.seq = seq; S.k = 0;
      S.bells = D.at.map((a) => this.spot(a)).map((a, k) => { const I = this.bell(a, a[3] || 0, col, seq.indexOf(k) + 1); I.q.usable = () => this.S === S && !I.rung; I.q.prompt = () => `[E] ${D.prompt || 'Ring it'}`; I.q.use = () => this.event(['o', this.i, k]); return I; });
    } else if (D.type === 'use') {
      const at = this.spot(D.at), I = this.lever(at, at[3] || 0, col); I.q.usable = () => this.S === S; I.q.prompt = () => `[E] ${D.prompt || 'Use'}`; I.q.use = () => this.event(['u', this.i]);
    } else if (D.type === 'hold') {
      const c = this.spot(D.at); S.pos = to3(c); S.r = D.r || 550; S.time = D.time || 35; S.t = 0;
      for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; this.post(this.spot([c[0] + Math.cos(a) * S.r, c[1] + Math.sin(a) * S.r, c[2]]), col); }
    }
  }
  // what the HUD shows: the job in hand and how far along it is
  hud() {
    if (!this.def) return null;
    if (this.done) return { title: this.def.name, text: this.def.after || 'The way is open', prog: '', frac: 1 };
    const S = this.S, D = S.D; let n = 0, of = 0;
    if (S.type === 'collect') { n = S.got.filter(Boolean).length; of = S.got.length; }
    else if (S.type === 'souls') { of = S.v.length * D.need; n = S.v.reduce((a, v) => a + Math.min(D.need, v.n), 0); }
    else if (S.type === 'shoot') { n = S.tg.filter((t) => t.hit).length; of = S.tg.length; }
    else if (S.type === 'order') { n = S.k; of = S.seq.length; }
    else if (S.type === 'hold') { n = Math.floor(S.t); of = S.time; }
    const how = D.how || { collect: 'They glow. Walk over each one to pick it up.', souls: `Kill ${D.need || ''} enemies close to each one to fill it.`, shoot: 'Shoot each one. Look up: they hang high.', order: 'Count the lights on each. Use them fewest to most. A wrong one resets them.', hold: 'Stand in the ring during a round, with enemies still alive.', boss: 'Kill the boss of the next third round.', use: 'Find it and press E.' }[S.type] || '';
    return { how, title: this.def.name, text: D.text, prog: of ? (S.type === 'hold' ? `${n}s / ${of}s` : S.type === 'souls' ? `${S.v.filter((v) => v.n >= D.need).length} / ${S.v.length}` : `${n} / ${of}`) : '', frac: of ? n / of : 0, step: this.i + 1, steps: this.def.steps.length };
  }
  cue(pos, col, big) { const g = this.g; g.fx.flash(pos, col, big ? 500 : 260, 0.5, true); g.fx.ring(pos, big ? 500 : 220, col, 0.5); g.audio.playAt(big ? 'S_LevelUp' : 'S_Pickup', pos, 1, big ? 1 : 1.3); }
  // something a player did. In co-op it goes to everyone, and everyone applies it the same way.
  event(e) { this.apply(e); if (this.g.net.active) this.g.net.emit('door', { q: e }); }
  apply(e) {
    if (!this.active || !Array.isArray(e) || e[1] !== this.i) return;
    const S = this.S, D = S.D, g = this.g, k = e[2] | 0;
    if (e[0] === 'c' && S.type === 'collect' && S.got[k] === false) {
      S.got[k] = true; this.cue(S.items[k].pos.clone().add(V3(0, 70, 0)), S.items[k].glow); this.drop(S.items[k]);
      g.hud.toast(`${D.item || 'Part'} found  (${S.got.filter(Boolean).length} / ${S.got.length})`, '#ffd24d');
      if (S.got.every(Boolean)) this.advance();
    } else if (e[0] === 't' && S.type === 'shoot' && S.tg[k] && !S.tg[k].hit) {
      const T = S.tg[k]; T.hit = true; this.cue(T.pos, T.I.glow); this.drop(T.I);
      if (S.tg.every((t) => t.hit)) this.advance();
    } else if (e[0] === 'o' && S.type === 'order' && S.bells[k] && !S.bells[k].rung) {
      const I = S.bells[k]; I.ringT = 1;
      if (S.seq[S.k] === k) { I.rung = true; S.k++; g.audio.playAt('S_Bell', I.pos, 1, 0.8 + S.k * 0.12); g.fx.ring(I.pos.clone().add(V3(0, 200, 0)), 260, I.glow, 0.5); if (S.k >= S.seq.length) this.advance(); }
      else { S.k = 0; for (const B of S.bells) B.rung = false; g.audio.playAt('S_Bell', I.pos, 1, 0.5); g.hud.toast(D.wrong || 'Wrong order. Start again.', '#ff7a5a'); }
    } else if (e[0] === 'u' && S.type === 'use') this.advance();
  }
  advance(quiet) {
    const g = this.g, D = this.S.D;
    this.i++;
    if (!quiet) { g.banner(D.done || 'DONE', [1, 0.8, 0.25], 3.5); g.audio.play('S_LevelUp', 0.8, 1.2); }
    if (this.i >= this.def.steps.length) { this.clear(); this.S = null; this.done = true; if (g.net.role !== 'client' && !g.final) g.openVault(to3(this.def.gate)); return; }
    this.enter();
    if (!quiet) g.hud.toast(this.S.D.text, '#ffd24d');
  }
  // ---------------------------------------------------------------- hooks from the game
  shot(from, dir, maxT) {
    const S = this.S; if (!this.active || S.type !== 'shoot') return;
    for (let k = 0; k < S.tg.length; k++) {
      const T = S.tg[k]; if (T.hit) continue;
      const r = (S.D.r || 50) + 14, o = T.pos.clone().sub(from), t = o.dot(dir); if (t < 0 || t > maxT + r) continue;
      if (o.lengthSq() - t * t < r * r) { this.event(['t', this.i, k]); return; }
    }
  }
  blast(at, radius) { const S = this.S; if (!this.active || S.type !== 'shoot') return; for (let k = 0; k < S.tg.length; k++) if (!S.tg[k].hit && S.tg[k].pos.distanceTo(at) < radius + 60) this.event(['t', this.i, k]); }
  killed(E) {
    const S = this.S, g = this.g; if (!this.active || g.net.role === 'client') return;
    if (S.type === 'boss' && E.isBoss && !E.boss.final) { this.cue(E.pos, rgb(S.D.color || 0xFFB03A), true); this.advance(); return; }
    if (S.type !== 'souls' || E.isBoss) return;
    let best = null, bd = S.D.r || 700;
    for (const v of S.v) { if (v.n >= S.D.need) continue; const d = Math.hypot(v.pos.x - E.pos.x, v.pos.z - E.pos.z); if (d < bd && Math.abs(v.pos.y - E.pos.y) < 500) { bd = d; best = v; } }
    if (!best) return;
    best.n++; g.fx.arc(E.pos.clone(), best.pos.clone().add(V3(0, 180, 0)), best.I.glow); g.audio.playAt('S_Pickup', best.pos, 0.5, 0.7 + 0.6 * best.n / S.D.need);
    if (best.n >= S.D.need) this.cue(best.pos.clone().add(V3(0, 180, 0)), best.I.glow);
    if (S.v.every((v) => v.n >= S.D.need)) this.advance();
  }
  tick(dt) {
    if (!this.def) return;
    const g = this.g, P = g.player, S = this.S; this.t += dt;
    for (const I of this.objs) {
      if (I.bob) { I.core.position.y = 70 + Math.sin(this.t * 2.4 + I.pos.x) * 12; I.core.rotation.y += dt * 1.6; }
      if (I.swing) { I.ringT = Math.max(0, (I.ringT || 0) - dt); I.swing.rotation.z = Math.sin(this.t * 14) * 0.5 * I.ringT; }
      if (I.glow && Math.random() < dt * 0.9) g.fx.flash(I.pos.clone().add(V3(0, 120, 0)), I.glow, 150, 0.6, false);   // a glint, so it can be found
    }
    if (!this.active) return;
    if (S.type === 'collect') { for (let k = 0; k < S.items.length; k++) if (!S.got[k] && !P.dead && Math.hypot(S.items[k].pos.x - P.pos.x, S.items[k].pos.z - P.pos.z) < 130 && Math.abs(S.items[k].pos.y - (P.pos.y - 100)) < 220) this.event(['c', this.i, k]); }
    else if (S.type === 'souls') { for (const v of S.v) { const f = Math.min(1, v.n / S.D.need); v.I.fill.scale.setScalar(8 + (v.n >= S.D.need ? 70 + Math.sin(this.t * 5) * 6 : f * 56)); } }
    else if (S.type === 'hold') {
      if (Math.random() < dt * 2) g.fx.ring(S.pos.clone().add(V3(0, 6, 0)), S.r, rgb(S.D.color || 0xFFB03A), 0.9);
      if (g.net.role === 'client') return;
      const inside = (p) => Math.hypot(p.x - S.pos.x, p.z - S.pos.z) < S.r && Math.abs(p.y - 100 - S.pos.y) < 400;
      const on = (!P.dead && inside(P.pos)) || (g.net.active && g.net.alivePositions().some(inside));
      if (on && g.phase === 'Round' && g.remaining() > 0) { S.t += dt; g.questHeat = 1.5; if (S.t >= S.time) this.advance(); }
    }
  }
  // ---------------------------------------------------------------- co-op: the host's copy is the true one
  state() {
    if (!this.def) return 0;
    const S = this.S; let p = [];
    if (S) { if (S.type === 'collect') p = S.got.map((b) => (b ? 1 : 0)); else if (S.type === 'souls') p = S.v.map((v) => v.n); else if (S.type === 'shoot') p = S.tg.map((t) => (t.hit ? 1 : 0)); else if (S.type === 'order') p = [S.k]; else if (S.type === 'hold') p = [Math.round(S.t * 10) / 10]; }
    return [this.seed, this.done ? 99 : this.i, ...p];
  }
  sync(a) {
    if (!this.def || !Array.isArray(a)) return;
    if (a[0] !== this.seed) { this.seed = a[0] | 0; this.i = 0; this.done = false; this.enter(); }
    const want = a[1] | 0;
    while (this.active && this.i < Math.min(want, this.def.steps.length)) this.advance(true);
    const S = this.S; if (!this.active || !S || want !== this.i) return;
    const p = a.slice(2);
    if (S.type === 'collect') p.forEach((b, k) => { if (b && S.got[k] === false) this.apply(['c', this.i, k]); });
    else if (S.type === 'shoot') p.forEach((b, k) => { if (b && S.tg[k] && !S.tg[k].hit) this.apply(['t', this.i, k]); });
    else if (S.type === 'souls') p.forEach((n, k) => { if (S.v[k]) S.v[k].n = Math.max(S.v[k].n, n | 0); });
    else if (S.type === 'order') { if ((p[0] | 0) > S.k) { for (let k = S.k; k < (p[0] | 0); k++) S.bells[S.seq[k]].rung = true; S.k = p[0] | 0; } }
    else if (S.type === 'hold') S.t = Math.max(S.t, +p[0] || 0);
  }
}
