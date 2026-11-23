// What each map does that the others do not: the mine's lift, the night train on the mountain line, deep and shallow
// water in the bayou, the tide on the wharf, the magician's cabinets and the big wheel at the carnival.
// A map asks for them in its `mech` entry; this builds them and runs them.
import * as THREE from 'three';
import { V, R } from './mapkit.js';
import { Interactable } from './interact.js';

const C = (h) => new THREE.Color(h);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const to3 = (a) => V3(a[0], a[2] || 0, a[1]);
const IRON = C(0x2a2c32), DARK = C(0x18181c), BRASS = C(0xb9974a), TIMBER = C(0x4a3226);
// Traps: switches the players pay to throw. Two guard doorways on every map; the Gulch also has the Noon Bell.
// kind: 'fire' burns what stands in the doorway, 'shock' pins and fries it, 'blast' goes off once after a short fuse,
// 'bell' staggers everything in earshot. door = which of the map's doors (in build order) the trap covers.
const TRAPS = {
  gulch: [{ kind: 'blast', name: 'Powder Kegs', door: 0 }, { kind: 'fire', name: 'Lamp Oil', door: 0.5 }, { kind: 'bell', name: 'Noon Bell', at: [260, -1250, 0] }],
  mine: [{ kind: 'fire', name: 'Steam Vent', door: 0 }, { kind: 'blast', name: 'Shot Holes', door: 0.5 }],
  frost: [{ kind: 'shock', name: 'Signal Wire', door: 0 }, { kind: 'fire', name: 'Brazier Line', door: 0.5 }],
  bayou: [{ kind: 'shock', name: 'Bug Zapper', door: 0 }, { kind: 'blast', name: 'The Still', door: 0.5 }],
  carnival: [{ kind: 'shock', name: 'Lightning Machine', door: 0 }, { kind: 'fire', name: 'Fire Breather', door: 0.5 }],
  wharf: [{ kind: 'shock', name: 'Harpoon Wire', door: 0 }, { kind: 'blast', name: 'Powder Hoist', door: 0.5 }],
};
const TRAP_INFO = {
  fire: { cost: 10000, run: 12, cool: 60, col: [1, 0.5, 0.15], say: 'Sets the doorway alight for 12 seconds' },
  shock: { cost: 10000, run: 12, cool: 60, col: [0.5, 0.8, 1], say: 'Pins and fries whatever comes through for 12 seconds' },
  blast: { cost: 12500, run: 1.6, cool: 75, col: [1, 0.75, 0.3], say: 'Blows the doorway after a short fuse' },
  bell: { cost: 15000, run: 6, cool: 90, col: [1, 0.9, 0.5], say: 'Staggers everything in earshot for 6 seconds' },
};
const HALF = 114;   // eye-ish height of the player's centre above the ground

export class Mech {
  constructor(game) {
    this.g = game; this.M = game.map.mech || {}; this.objs = []; this.t = 0; this.cd = 0; this.safe = null; this.sink = 0;
    const M = this.M;
    if (M.lift) this.buildLift(M.lift);
    if (M.cabinets) M.cabinets.forEach((pair, k) => this.buildCabinets(pair, k));
    if (M.train) this.buildTrain(M.train);
    if (M.tide) this.buildTide(M.tide);
    if (M.wheel) this.buildWheel(M.wheel);
    this.traps = []; (TRAPS[game.map.id] || []).forEach((T, k) => { try { this.buildTrap(T, k); } catch (e) { /* a trap that cannot be placed is left out */ } });
  }
  mk(at, yaw = 0, snap = true) {
    if (snap) at = this.g.quest.spot(at);
    const I = new Interactable(this.g, 'Quest', V(at[0], at[1], at[2] || 0), yaw, 0, -1, '', V(100, 100, 100)); I.at = at;
    I.q = { usable: () => false, prompt: () => '', use: () => {} };
    this.g.scene.add(I.group); this.objs.push(I); return I;
  }
  // move the player somewhere else at once: a flash, a thump, a moment's grace
  send(P, pos, yaw) {
    const g = this.g;
    if (P.grappling) P.endGrapple(false);
    P.pos.copy(pos).add(V3(0, HALF, 0)); P.vel.set(0, 0, 0); if (yaw !== undefined) P.yaw = yaw; P.invuln = Math.max(P.invuln || 0, 1.2);
    g.hud.hurtWhite = 0.3; g.audio.play('S_Door', 1, 0.7); g.fx.ring(pos.clone().add(V3(0, 10, 0)), 260, [1, 0.85, 0.5], 0.5);
  }
  // ------------------------------------------------------------------ the mine: a cage lift between the top and the bottom
  buildLift(L) {
    const ends = [L.a, L.b].map((e, k) => {
      const bare = (L.bare || [])[k], I = this.mk(e, e[3] || 0, !bare);   // an end can use a cage the map has already built
      if (!bare) for (const [x, y] of [[-90, -90], [-90, 90], [90, -90], [90, 90]]) I.part(null, 0, V(x, y, 150), V(12, 12, 300), IRON);
      if (!bare) { I.part(null, 0, V(0, 0, 4), V(200, 200, 8), TIMBER); I.part(null, 0, V(0, 0, 304), V(210, 210, 12), IRON);
        for (const s of [-1, 1]) { I.part(null, 0, V(0, s * 94, 110), V(190, 6, 8), IRON); I.part(null, 0, V(0, s * 94, 170), V(190, 6, 8), IRON); I.part(null, 0, V(-94, 0, 110 + (s > 0 ? 0 : 60)), V(6, 190, 8), IRON); }
        I.part(null, 1, V(0, 0, 900), V(10, 10, 1200), DARK); }
      const lz = bare ? bare : 286;
      I.lamp = I.part(null, 2, V(0, 0, lz), V(26, 26, 26), C(0xff5a3a), null, 2.4); I.lampOn = I.part(null, 2, V(0, 0, lz), V(27, 27, 27), C(0x7dff8a), null, 2.6);
      I.useRadius = bare ? 330 : 210;
      const ready = () => this.g.quest.past(L.need || 0);
      I.q.usable = () => this.cd <= 0;
      I.q.prompt = () => (ready() ? `[E] Ride the lift ${k ? 'up' : 'down'}` : L.dead || 'The lift has no power');
      I.q.use = (P) => { if (!ready()) { this.g.audio.play('S_Deny', 0.8); return; } this.cd = 2.5; this.send(P, to3(ends[1 - k].at), undefined); this.g.audio.play('S_Chain', 1, 0.6); };
      return I;
    });
    this.lift = { ends, L };
  }
  // ------------------------------------------------------------------ the carnival: step into one cabinet, step out of its twin
  buildCabinets(pair, idx) {
    const col = [0xb565f0, 0x4fd8ff, 0xffb22e, 0x5bd65b][idx % 4];
    const ends = pair.map((e, k) => {
      const I = this.mk(e, e[3] || 0);
      I.part(null, 0, V(-50, 0, 150), V(16, 150, 300), C(0x3a1420)); for (const s of [-1, 1]) I.part(null, 0, V(0, s * 70, 150), V(110, 12, 300), C(0x5a1a2a));
      I.part(null, 0, V(0, 0, 306), V(124, 164, 14), BRASS); I.part(null, 6, V(0, 0, 350), V(110, 150, 80), C(0x5a1a2a)); I.part(null, 0, V(0, 0, 5), V(124, 164, 10), BRASS);
      I.part(null, 0, V(-38, 0, 150), V(4, 120, 270), C(col), null, 2.2);
      for (let s = 0; s < 5; s++) I.part(null, 2, V(52, -56 + s * 28, 286), V(12, 12, 12), C(col), null, 2.6);
      I.useRadius = 200; I.glow = [C(col).r, C(col).g, C(col).b];
      I.q.usable = () => this.cd <= 0;
      I.q.prompt = () => `[E] Step into the cabinet\n${this.M.cabinetNames ? 'It comes out at ' + this.M.cabinetNames[idx][1 - k] : ''}`;
      I.q.use = (P) => { const o = ends[1 - k].at, yaw = ((pair[1 - k][3] || 0) * Math.PI / 180), out = V3(o[0] + Math.cos(yaw) * 170, o[2] || 0, o[1] + Math.sin(yaw) * 170); this.cd = 6; this.send(P, out); this.g.fx.flash(I.pos.clone().add(V3(0, 150, 0)), I.glow, 400, 0.5, true); };
      return I;
    });
    (this.cabinets = this.cabinets || []).push(ends);
  }
  // ------------------------------------------------------------------ the mountain line: a train that is not there runs it anyway
  buildTrain(T) {
    const I = this.mk([T.x0, T.y, T.z || 0], 0, false), ghost = C(0x9fe0ff), dim = C(0x2a4a5a);
    const car = (x, len, h) => { I.part(null, 0, V(x, 0, 90 + h / 2), V(len, 300, h), dim, null, 0.9); I.part(null, 0, V(x, 0, 96 + h), V(len + 20, 320, 12), ghost, null, 2); for (const s of [-1, 1]) for (let k = -1; k <= 1; k++) I.part(null, 0, V(x + k * len * 0.3, s * 152, 100 + h * 0.55), V(len * 0.16, 6, h * 0.3), ghost, null, 2.6); };
    I.part(null, 1, V(260, 0, 250), V(250, 250, 620), dim, R(90, 0, 0), 0.9); I.part(null, 1, V(480, 0, 450), V(90, 90, 180), dim, null, 0.9); I.part(null, 0, V(-190, 0, 290), V(280, 310, 380), dim, null, 0.9);
    I.part(null, 2, V(590, 0, 330), V(90, 90, 90), C(0xffffff), null, 3); I.part(null, 6, V(660, 0, 70), V(160, 240, 110), ghost, R(0, 0, 0), 2);
    for (let k = 1; k <= (T.cars || 4); k++) car(-560 - (k - 1) * 900 - 250, 820, 330);
    I.group.visible = false;
    this.train = { I, T, x: null, wait: T.first || 45, warn: false, len: 1200 + (T.cars || 4) * 900 };
  }
  tickTrain(dt) {
    const g = this.g, tr = this.train, T = tr.T, P = g.player, host = g.net.role !== 'client';
    if (tr.x === null) {
      if (host) {
        tr.wait -= dt;
        if (tr.wait < 6 && !tr.warn) { tr.warn = true; g.hud.toast(T.warn || 'The night train is coming. Get off the line.', '#9fe0ff'); g.audio.play('S_Screech', 0.7, 0.45); }
        if (tr.wait <= 0) { tr.x = T.x0 - 600; tr.warn = false; g.audio.play('S_BossRoar', 0.6, 1.5); }
      }
      if (tr.warn && Math.random() < dt * 10) { const x = T.x0 + Math.random() * (T.x1 - T.x0); g.fx.flash(V3(x, (T.z || 0) + 20, T.y + (Math.random() < 0.5 ? -70 : 70)), [0.6, 0.9, 1], 120, 0.4, false); }
      return;
    }
    tr.x += (T.speed || 3200) * dt; tr.I.group.visible = true; tr.I.group.position.set(tr.x, T.z || 0, T.y);
    const x1 = tr.x + 700, x0 = tr.x - tr.len, on = (p) => p.x > x0 && p.x < x1 && Math.abs(p.z - T.y) < (T.half || 200) && p.y < (T.z || 0) + 520;
    if (Math.random() < dt * 30) g.fx.flash(V3(x1 - Math.random() * 300, (T.z || 0) + 40, T.y + (Math.random() - 0.5) * 300), [0.6, 0.9, 1], 200, 0.3, false);
    if (host) for (const E of g.enemies) if (!E.dead && !E.isBoss && E.ai !== 'Flyer' && on(E.pos)) { E.lastHitExplosive = true; E.takeHit(1e9, E.pos, V3(1, 0.4, 0), false); }
    if (!P.dead && on(P.pos) && !(tr.hitT > 0)) { tr.hitT = 1.5; P.receiveDamage(T.damage || 70, null, true); P.applyKnockback(V3(500, 520, (P.pos.z >= T.y ? 1 : -1) * 900)); g.hud.toast('Hit by the night train', '#9fe0ff'); }
    tr.hitT = Math.max(0, (tr.hitT || 0) - dt);
    if (x0 > T.x1) { tr.x = null; tr.I.group.visible = false; tr.wait = (T.every || 80) * (0.8 + Math.random() * 0.4); }
  }
  // ------------------------------------------------------------------ the wharf: the sea comes in over the low ground and goes out again
  buildTide(T) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: T.color || 0x1c4a5a, transparent: true, opacity: 0.62, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; const [x0, y0, x1, y1] = T.rect; m.scale.set(x1 - x0, y1 - y0, 1); m.position.set((x0 + x1) / 2, T.low, (y0 + y1) / 2); m.renderOrder = 2;
    this.g.scene.add(m); this.tide = { m, T, level: T.low, t: T.first || 70, state: 0 };
  }
  tideLevel() { return this.tide ? this.tide.level : -1e9; }
  tickTide(dt) {
    const td = this.tide, T = td.T, g = this.g;
    if (g.net.role !== 'client') {
      td.t -= dt;
      if (td.t <= 0) { td.state = (td.state + 1) % 4; td.t = [T.out || 75, T.turn || 14, T.in || 40, T.turn || 14][td.state]; if (td.state === 1) g.hud.toast(T.warnIn || 'The tide is coming in. The low ground will flood.', '#7ad0e8'); if (td.state === 3) g.hud.toast(T.warnOut || 'The tide is going out.', '#7ad0e8'); if (td.state % 2) g.audio.play('S_Wings', 0.7, 0.4); }
    }
    const k = td.state === 0 ? 0 : td.state === 2 ? 1 : td.state === 1 ? 1 - td.t / (T.turn || 14) : td.t / (T.turn || 14), want = T.low + (T.high - T.low) * Math.max(0, Math.min(1, k));
    td.level += (want - td.level) * Math.min(1, dt * 3); td.m.position.y = td.level + Math.sin(this.t * 0.9) * 2;
  }
  // how deep the water is where a body stands: 0 dry, up to 1 at the waist and beyond. Deep water (2) is not for wading.
  depth(p, feetY) {
    const M = this.g.map; let d = 0;
    if (M.water) { const w = M.water(p.x, p.z); if (w === 2) return 2; if (w === 1 && feetY < this.g.zoneZ(p.x, p.z) + 40) d = 0.5; }
    if (this.tide) { const T = this.tide.T, [x0, y0, x1, y1] = T.rect; if (p.x > x0 && p.x < x1 && p.z > y0 && p.z < y1) d = Math.max(d, Math.max(0, Math.min(1, (this.tide.level - feetY) / 90))); }
    return d;
  }
  // how much the ground slows the player here (1 = not at all)
  slow(P) { if (!this.M.wet) return 1; const d = this.depth(P.pos, P.pos.y - HALF); this.wet = d; return d >= 2 ? 0.45 : 1 - 0.42 * d; }
  tickWater(dt) {
    const g = this.g, P = g.player; if (P.dead) return;
    const feet = P.pos.y - HALF, d = this.depth(P.pos, feet), grounded = P.grounded !== false;
    if (d > 0.3 && d < 2 && Math.hypot(P.vel.x, P.vel.z) > 150 && Math.random() < dt * 9) g.fx.dust(V3(P.pos.x, feet + 8, P.pos.z), [0.5, 0.7, 0.75], 60);
    if (d < 2) { this.sink = Math.max(0, this.sink - dt * 2); if (d < 0.2 && grounded) { this.safeT = (this.safeT || 0) + dt; if (this.safeT > 0.4) { this.safeT = 0; (this.safe = this.safe || V3()).copy(P.pos); } } return; }
    if (feet > g.zoneZ(P.pos.x, P.pos.z) + 60) return;   // over it, not in it
    this.sink += dt;
    if (this.sink > 0.7 && this.safe) {   // something takes hold: you come up coughing where you last stood
      this.sink = 0; P.receiveDamage(this.M.drown || 25, null, true); this.send(P, this.safe.clone().sub(V3(0, HALF, 0))); g.hud.toast(this.M.drownText || 'Something in the deep water dragged you under', '#7ad0e8');
    }
  }
  // ------------------------------------------------------------------ the carnival: a turn on the big wheel, above it all
  buildWheel(W) {
    const I = this.mk(W.at, W.at[3] || 0, !W.bare);
    if (!W.bare) { I.part(null, 0, V(0, 0, 60), V(60, 110, 120), C(0x5a1a2a)); I.part(null, 0, V(0, 0, 126), V(70, 120, 12), BRASS); } I.part(null, 2, V(0, 0, W.bare ? 290 : 160), V(34, 34, 34), C(0xffd24d), null, 2.6);
    I.useRadius = 200;
    I.q.usable = () => !this.ride;
    I.q.prompt = (P) => `[E] Ride the wheel  $${W.cost}\nOne turn, out of reach`;
    I.q.use = (P) => { if (!P.spend(W.cost)) return; this.ride = { t: 0 }; this.g.audio.play('S_SlotPull', 1, 0.6); };
    const car = this.mk(W.c, 0, false); car.part(null, 0, V(0, 0, -20), V(150, 130, 12), C(0x5a1a2a)); for (const s of [-1, 1]) { car.part(null, 0, V(0, s * 62, 30), V(150, 8, 90), C(0x7a2e38)); car.part(null, 0, V(s * 72, 0, 30), V(8, 130, 90), C(0x7a2e38)); }
    car.part(null, 0, V(0, 0, 170), V(10, 10, 280), BRASS); car.group.visible = false;
    this.wheel = { I, W, car };
  }
  tickWheel(dt) {
    const g = this.g, P = g.player, W = this.wheel.W, car = this.wheel.car, R0 = this.ride;
    if (!R0) return;
    R0.t += dt; const k = R0.t / (W.time || 26), a = -Math.PI / 2 + k * Math.PI * 2, ax = (W.axis || 0) * Math.PI / 180;
    const c = to3(W.c), h = Math.cos(a) * W.r, pos = V3(c.x + Math.cos(ax) * h, c.y + W.r + Math.sin(a) * W.r + 40, c.z + Math.sin(ax) * h);
    car.group.visible = true; car.group.position.copy(pos); car.group.rotation.y = -ax;
    if (P.grappling) P.endGrapple(false);
    P.pos.set(pos.x, pos.y + HALF - 10, pos.z); P.vel.set(0, 0, 0); P.riding = true;
    if (k >= 1 || P.dead) { this.ride = null; car.group.visible = false; P.riding = false; if (!P.dead) this.send(P, to3(W.off || W.at).add(V3(Math.cos((W.at[3] || 0) * Math.PI / 180) * 160, 0, Math.sin((W.at[3] || 0) * Math.PI / 180) * 160))); }
  }
  // ------------------------------------------------------------------
  tick(dt) {
    this.t += dt; this.cd = Math.max(0, this.cd - dt);
    if (this.lift) { const on = this.g.quest.past(this.lift.L.need || 0); for (const I of this.lift.ends) { I.lamp.visible = !on; I.lampOn.visible = on; } }
    if (this.train) this.tickTrain(dt);
    if (this.tide) this.tickTide(dt);
    if (this.M.wet) this.tickWater(dt);
    if (this.wheel) this.tickWheel(dt);
    for (const T of this.traps) this.tickTrap(T, dt);
  }
  // co-op: the host says where the train is and how the tide stands
  state() { if (!this.train && !this.tide) return 0; const tr = this.train, td = this.tide; return [tr ? (tr.x === null ? -1e6 : Math.round(tr.x)) : 0, tr && tr.warn ? 1 : 0, td ? td.state : 0, td ? Math.round(td.t * 10) / 10 : 0]; }
  sync(a) {
    const tr = this.train, td = this.tide;
    if (tr) { const x = a[0]; if (x <= -1e6 + 1) { if (tr.x !== null) { tr.x = null; tr.I.group.visible = false; } if (a[1] && !tr.warn) { this.g.hud.toast(tr.T.warn || 'The night train is coming. Get off the line.', '#9fe0ff'); this.g.audio.play('S_Screech', 0.7, 0.45); } tr.warn = !!a[1]; } else if (tr.x === null || Math.abs(tr.x - x) > 1500) tr.x = x; }
    if (td) { if ((a[2] | 0) !== td.state) { td.state = a[2] | 0; if (td.state === 1) this.g.hud.toast(td.T.warnIn || 'The tide is coming in. The low ground will flood.', '#7ad0e8'); } td.t = +a[3] || 0; }
  }
  net() {}
  // ------------------------------------------------------------------ traps
  buildTrap(D, idx) {
    const g = this.g, info = TRAP_INFO[D.kind];
    const T = { D, idx, info, run: 0, cool: 0, mine: false, fxT: 0, hitT: 0, c: null, n: V3(1, 0, 0), t: V3(0, 0, 1), hw: 300, hl: 380 };
    let at;
    if (D.at) { at = D.at; T.c = to3(D.at); T.radius = 2600; }
    else {
      const doors = g.interactables.filter((I) => I.type === 'Door' && I.box3); if (!doors.length) return;
      const Dr = doors[Math.min(doors.length - 1, Math.round(D.door * (doors.length - 1)))];
      if (this.traps.some((o) => o.door === Dr)) return;
      const c = Dr.box3.getCenter(V3(0, 0, 0)), sz = Dr.box3.getSize(V3(0, 0, 0)), alongX = sz.x < sz.z;   // the thin side is the way through
      T.door = Dr; T.c = c; T.n = alongX ? V3(1, 0, 0) : V3(0, 0, 1); T.t = alongX ? V3(0, 0, 1) : V3(1, 0, 0); T.hw = Math.max(sz.x, sz.z) / 2 + 30; T.floor = Dr.box3.min.y;
      // the switch stands beside the doorway, clear of the path through it
      let best = null;
      for (const side of [1, -1]) for (const out of [1, -1]) for (const far of [330, 430, 250, 800, 900, 1000]) {
        if (best) break;
        const p = c.clone().addScaledVector(T.n, out * far).addScaledVector(T.t, side * (T.hw + 70)), [cx, cy] = g.cellOf(p.x, p.z);
        if (!g.navFree(cx, cy)) continue;
        if (g.interactables.concat(g.quest.objs, this.objs).some((I) => Math.hypot(I.pos.x - p.x, I.pos.z - p.z) < 260)) continue;
        const h = g.phys.raycastDown(V3(p.x, T.floor + 200, p.z), 600); if (!h || Math.abs(h.point.y - T.floor) > 90) continue;
        const head = V3(p.x, h.point.y + 200, p.z); if ([T.n, T.t, T.n.clone().negate(), T.t.clone().negate()].some((d) => g.phys.raycast(head, d, 100) || g.phys.raycast(head.clone().setY(h.point.y + 60), d, 60))) continue;   // room for the board: nothing within arm's reach
        best = { p, yaw: Math.atan2(-(T.n.z * out), -(T.n.x * out)) * 180 / Math.PI, y: h.point.y };
      }
      if (!best) return;
      at = [best.p.x, best.p.z, best.y, best.yaw]; T.yaw = best.yaw;
    }
    const I = this.mk(at, at[3] || 0, !!D.at), col = C(new THREE.Color(info.col[0], info.col[1], info.col[2]).getHex());
    I.part(null, 0, V(0, 0, 55), V(16, 16, 110), IRON);                       // post
    I.part(null, 0, V(0, 0, 122), V(30, 46, 44), DARK);                       // switch box
    I.part(null, 0, V(17, 0, 122), V(4, 38, 36), BRASS);                      // face plate
    T.lever = I.part(null, 0, V(24, 0, 132), V(8, 8, 34), C(0xb8322a), null, 1.2);
    T.lamp = I.part(null, 2, V(0, 0, 156), V(14, 14, 14), col, null, 2.4);
    I.part(null, 0, V(0, 0, 4), V(40, 40, 8), IRON);                          // foot
    I.part(null, 0, V(0, 0, 205), V(8, 150, 44), DARK); I.part(null, 0, V(0, 0, 205), V(4, 158, 52), BRASS);   // name board over the switch, lettered both sides
    I.text(null, V(6, 0, 205), 0, 26, D.name.toUpperCase(), '#ffcd5a'); I.text(null, V(-6, 0, 205), 180, 26, D.name.toUpperCase(), '#ffcd5a');
    I.part(null, 0, V(0, 0, 170), V(10, 10, 60), IRON);
    if (D.kind === 'bell') { I.part(null, 0, V(0, 0, 265), V(12, 12, 80), TIMBER); I.part(null, 0, V(0, 0, 305), V(12, 110, 12), TIMBER); I.part(null, 3, V(0, 40, 272), V(50, 50, 56), BRASS); }
    I.useRadius = 190; I.glow = info.col.slice();
    I.q.usable = () => true;
    I.q.prompt = (P) => T.run > 0 ? `${D.name.toUpperCase()}\nRunning` : T.cool > 0 ? `${D.name.toUpperCase()}\nResetting  ${Math.ceil(T.cool)}s` : `[E] ${D.name}  -  $${Math.round(info.cost * (P ? P.priceMult() : 1) / 10)}\n${info.say}`;
    I.q.use = (P) => {
      if (T.run > 0 || T.cool > 0) { P.play('S_Deny', 0.4); return; }
      if (!P.spend(Math.round(info.cost * P.priceMult()))) return;
      this.fireTrap(T, true);
      if (g.net.active) g.net.emit('door', { t: [idx] });
    };
    T.I = I; this.traps.push(T);
  }
  // someone else threw it: the same show, but the damage is theirs to deal
  trapRemote(idx) { const T = this.traps.find((o) => o.idx === idx); if (T && T.run <= 0) this.fireTrap(T, false); }
  fireTrap(T, mine) {
    const g = this.g, info = T.info;
    T.run = info.run; T.cool = info.cool + info.run; T.mine = mine; T.fxT = 0; T.hitT = 0; T.done = false;
    g.audio.playAt('S_Door', T.I.pos, 0.9, 0.7, 0); g.hud.toast(`${T.D.name}: ${T.D.kind === 'blast' ? 'fuse lit, stand clear' : 'running'}`, '#ffcd5a');
    if (T.D.kind === 'bell') {
      const p = T.I.pos.clone().add(V3(0, 220, 0));
      g.audio.play('S_Bell', 1, 0.7); g.fx.ring(T.I.pos.clone(), 900, info.col, 0.9); g.fx.ring(T.I.pos.clone(), 500, [1, 1, 1], 0.6); g.fx.flash(p, info.col, 200, 0.4, true);
    }
  }
  inTrap(T, pos, pad = 0) {
    if (T.radius) return pos.distanceTo(T.c) < T.radius;
    const d = pos.clone().sub(T.c); return Math.abs(d.dot(T.n)) < T.hl + pad && Math.abs(d.dot(T.t)) < T.hw + pad && Math.abs(pos.y - (T.floor + HALF)) < 320;
  }
  trapHit(E, amount, dir) {
    const P = this.g.player, dealt = E.takeHit(amount, E.pos, dir || V3(0, 0, 1), false);
    if (dealt > 0) this.g.hud.floater(E.pos.clone().add(V3(0, E.half || 90, 0)), `${Math.round(dealt)}`, [1, 0.8, 0.4], 0.9);
    if (!E.remote && !E.dead && E.health <= 0) E.kill(P, false);
  }
  tickTrap(T, dt) {
    const g = this.g, K = T.D.kind, col = T.info.col;
    T.cool = Math.max(0, T.cool - dt);
    T.lamp.visible = T.cool <= 0 || T.run > 0 ? (T.run > 0 ? Math.sin(this.t * 20) > 0 : true) : false;
    T.lever.rotation.x += ((T.run > 0 || T.cool > 0 ? 1.1 : 0) - T.lever.rotation.x) * Math.min(1, dt * 10);
    if (T.run <= 0) return;
    T.run -= dt; T.fxT -= dt; T.hitT -= dt;
    const rnd = (a) => (Math.random() * 2 - 1) * a, floorY = T.radius ? T.c.y : T.floor;
    const spot = () => T.c.clone().addScaledVector(T.n, rnd(T.hl)).addScaledVector(T.t, rnd(T.hw)).setY(floorY + 8);
    const enemies = () => g.enemies.filter((E) => !E.dead && !E.emerging && !E.burrowed && this.inTrap(T, E.pos));
    if (K === 'fire') {
      if (T.fxT <= 0) { T.fxT = 0.05; for (let k = 0; k < 3; k++) { const p = spot(); g.fx.add({ pos: p, vel: V3(rnd(30), 260 + Math.random() * 200, rnd(30)), life: 0.5 + Math.random() * 0.3, size0: 50, size1: 120, rot: Math.random() * 360, c0: [1, 0.55 + Math.random() * 0.3, 0.12, 0.8], c1: [0.9, 0.15, 0.02, 0], tex: 'FX_Puff', kind: 'add', glow: 2 }); } if (Math.random() < 0.3) g.fx.glowAt(T.c.clone().setY(floorY + 80), col, T.hw * 2.5, 0.25); }
      if (T.mine && T.hitT <= 0) { T.hitT = 0.5; for (const E of enemies()) { this.trapHit(E, E.maxHealth * (E.isBoss ? 0.012 : 0.14)); if (!E.dead && !E.remote) E.applyBurn(E.maxHealth * 0.03, 2); } }
      const P = g.player; if (!P.dead && T.hitT > 0.44 && this.inTrap(T, P.pos, -40)) P.receiveDamage(6, null, false);   // it burns you too
    } else if (K === 'shock') {
      if (T.fxT <= 0) { T.fxT = 0.07; const a = T.c.clone().addScaledVector(T.t, -T.hw).setY(floorY + 40 + Math.random() * 180), b = T.c.clone().addScaledVector(T.t, T.hw).addScaledVector(T.n, rnd(T.hl * 0.7)).setY(floorY + 40 + Math.random() * 180); g.fx.arc(a, b, col, 0.09, 7); if (Math.random() < 0.25) g.audio.playAt('S_Chain', T.c, 0.5, 1 + Math.random() * 0.4, 0.1); }
      if (T.hitT <= 0) { T.hitT = 0.5; for (const E of enemies()) { if (!E.remote && !E.isBoss) { E.staggerT = Math.max(E.staggerT || 0, 0.6); E.applySlow(0.85, 0.7); } if (T.mine) this.trapHit(E, E.maxHealth * (E.isBoss ? 0.008 : 0.09)); g.fx.arc(T.c.clone().setY(floorY + 200), E.pos, col, 0.1, 5); } }
    } else if (K === 'blast') {
      if (T.fxT <= 0) { T.fxT = 0.08; g.fx.sparks(spot().setY(floorY + 30), V3(0, 1, 0), col, 4); if (Math.random() < 0.5) g.audio.playAt('S_Ricochet', T.c, 0.3, 1.6, 0.1); }
      if (T.run <= 0 && !T.done) {
        T.done = true; const p = T.c.clone().setY(floorY + 80);
        g.fx.explosion(p, 620, col); g.fx.ring(p.clone().setY(floorY + 6), 700, col, 0.5); g.fx.dust(p.clone().setY(floorY + 6), [0.5, 0.42, 0.33], 200); g.audio.playAt('S_Explosion', p, 1.2, 0.8, 0);
        const P = g.player, pd = P.pos.distanceTo(p); P.addShake(Math.max(0, 1.6 - pd / 900));
        if (T.mine) for (const E of g.enemies) { if (E.dead || E.emerging || E.burrowed) continue; const d = E.pos.distanceTo(p); if (d > 620) continue; this.trapHit(E, E.maxHealth * (E.isBoss ? 0.08 : 0.9) * (1 - 0.4 * d / 620), E.pos.clone().sub(p).normalize()); if (!E.dead && !E.remote && !E.isBoss) E.applyKnock(E.pos.clone().sub(p).setY(0).normalize().multiplyScalar(700).add(V3(0, 420, 0))); }
        if (!P.dead && pd < 520) P.receiveDamage(40 * (1 - pd / 520), null, false);
      }
    } else if (K === 'bell') {
      if (T.fxT <= 0) { T.fxT = 1.5; g.fx.ring(T.I.pos.clone(), 1400, col, 1.2); g.audio.playAt('S_Bell', T.I.pos, 0.8, 0.7, 0); }
      if (T.hitT <= 0) { T.hitT = 0.4; for (const E of enemies()) if (!E.remote && !E.isBoss) { E.staggerT = Math.max(E.staggerT || 0, 0.6); E.applySlow(0.9, 0.6); E.attackCd = Math.max(E.attackCd || 0, 0.8); } }
    }
  }
}
