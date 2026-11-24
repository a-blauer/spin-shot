// The Descent: the run as a string of rooms. Clear the room, take what it pays, choose the next door by what is
// written over it. Rooms 5, 10, 15 and 20 belong to bosses. The host (or the solo player) owns the state; guests
// are told the room, what it paid and what the doors offer, and build the same things on their own side.
import * as THREE from 'three';
import { DATA, lin, randInt, zombieCount, maxAlive } from './data.js';
import { V, R } from './mapkit.js';
import { Interactable } from './interact.js';
import { ARENAS, spots } from './map_descent.js';
import { rollBuff } from './classes.js';
import { Meta } from './meta.js';

export const ROOMS = 20;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const C = (h) => new THREE.Color(h);
// what the chest at the end of a room is made of: better the deeper you are
function chestTier(room) {
  const W = room <= 5 ? [60, 40, 0, 0] : room <= 10 ? [12, 53, 35, 0] : room <= 15 ? [0, 25, 50, 25] : [0, 0, 45, 55];
  let r = Math.random() * 100; for (let i = 0; i < 4; i++) { r -= W[i]; if (r < 0) return i; }
  return 3;
}

export class Descent {
  constructor(game) {
    this.g = game; this.room = 0; this.arena = 0; this.flip = 1; this.cleared = false; this.guns = [1, 2]; this.tier = 0; this.gates = []; this.things = []; this.late = []; this.seq = 0; this.bossT = -1; this.seen = -1; this.zones = []; this.zkey = '';
    // eight rooms, each met twice in a run: the second time from the other end. Never the same room twice running.
    const sh = () => { const o = [...Array(8).keys()]; for (let i = 7; i > 0; i--) { const j = randInt(0, i); [o[i], o[j]] = [o[j], o[i]]; } return o; };
    const a = sh(); let b = sh(); while (b[0] === a[7]) b = sh();
    this.order = a.concat(b);
    this.bossPick = this.pickBosses();
  }
  get host() { return this.g.net.role !== 'client'; }
  isBossRoom(r = this.room) { return r > 0 && r % 5 === 0; }
  arenaFor(room) { return room % 5 === 0 ? 8 + ((room / 5 - 1) % 2) : this.order[room - 1 - Math.floor(room / 5)]; }
  flipFor(room) { return room % 5 === 0 ? (room > 10 ? -1 : 1) : (room - 1 - Math.floor(room / 5) >= 8 ? -1 : 1); }
  A() { return ARENAS[this.arena]; }
  S() { return spots(this.A(), this.flip); }
  // one boss from each of the four tiers; which one is the luck of the run
  pickBosses() { const out = []; for (let t = 1; t <= 4; t++) { const L = DATA.bosses.map((b, i) => (b.tier === t ? i : -1)).filter((i) => i >= 0); out.push(L.length ? L[randInt(0, L.length - 1)] : this.g.map.bosses[(t - 1) % Math.max(1, this.g.map.bosses.length)]); } return out; }

  // ------------------------------------------------------------------ flow (host)
  tick(dt) {
    const g = this.g;
    this.tickFx(dt);
    if (!this.host) return;
    if (g.phase === 'PreGame') { g.phaseTimer -= dt; if (g.phaseTimer <= 0) this.enter(1); return; }
    if (g.phase === 'Round') {
      if (this.bossT >= 0) { this.bossT -= dt; if (this.bossT < 0) this.spawnBoss(); }
      g.tickRound(dt);
      if (this.isBossRoom() && g.bossSpawned && (!g.boss || g.boss.dead)) {
        if (!this.twinAlive() && (this.deadT = (this.deadT || 0) + dt) > 0.4) { this.deadT = 0; for (const E of g.enemies) if (!E.dead && !E.isBoss) { E.lastHitExplosive = true; E.takeHit(1e9, E.pos, V3(0, 1, 0), false); } g.spawned = g.toSpawn; this.clear(); }
      }
    }
  }
  twinAlive() { const L = this.g.enemies.filter((E) => E.isBoss && !E.dead && !E.decoy); if (L.length && (!this.g.boss || this.g.boss.dead)) this.g.boss = L[0]; return L.length > 0; }
  enter(room) {
    const g = this.g;
    this.wipe();
    this.room = room; this.arena = this.arenaFor(room); this.flip = this.flipFor(room); this.cleared = false; this.seq++;
    for (const E of g.enemies) if (!E.dead) E.remove = true;
    g.hazards.clear(); g.boss = null; g.bossSpawned = false; g.bossRound = false; this.zones = [];
    g.round = room; g.phase = 'Round';
    const boss = this.isBossRoom(), n = g.net.role === 'host' ? g.net.ghosts.size : 0;
    g.toSpawn = Math.round((boss ? 8 + room * 0.6 : Math.min(zombieCount(room) * 0.6, 14 + room * 3.4)) * (1 + 0.6 * n));
    g.spawned = 0; g.killed = 0; g.powerupsThisRound = 0; g.tonicsThisRound = 0; g.grenadesThisRound = 0; g.ammoThisRound = 0; g.spawnTimer = boss ? 5 : 1.6; g.roundT = 0; g.midChest = true;
    this.bossT = boss ? 2.2 : -1;
    this.roster = this.rollRoster(room);
    // two guns for the walls, the better ones the deeper you are; and what the chest at the end will be
    const RAR = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'], want = (room < 6 ? [0, 1] : room < 11 ? [1, 2] : room < 16 ? [2, 3] : [3, 4]).map((k) => RAR[k]);
    const pool = DATA.weapons.map((w, i) => i).filter((i) => i > 0), pick = [];
    for (let k = 0; k < 2; k++) { const L = pool.filter((i) => !pick.includes(i) && want.includes(DATA.weapons[i].rarity)), L2 = L.length ? L : pool.filter((i) => !pick.includes(i)); pick.push(L2[randInt(0, L2.length - 1)]); }
    this.guns = pick; this.tier = Math.min(3, chestTier(room) + (boss ? 1 : 0));
    this.arrive(true);
    if (g.net.role === 'host' && g.player.dead) g.player.revive();
  }
  // everyone: stand at the way in, facing the room, with the room's ammo box and wall guns in place
  arrive(started) {
    const g = this.g, P = g.player, A = this.A(), S = this.S(), room = this.room;
    if (P.grappling) P.endGrapple(false);
    if (P.menu) P.closeMenu();
    P.pos.set(S.spawn[0] + (Math.random() - 0.5) * 300, 100, S.spawn[1]); P.vel.set(0, 0, 0); P.pitch = 0; P.yaw = S.yaw; P.invuln = Math.max(P.invuln || 0, 2.5);
    g.zones.forEach((Z, i) => { Z.unlocked = i === A.zone; });
    g.hud.hurtWhite = 0.3; g.audio.play('S_Door', 1, 0.7);
    const boss = this.isBossRoom();
    g.banner(boss ? `ROOM ${room}  -  BOSS` : `ROOM ${room} / ${ROOMS}`, boss ? lin(1, 0.25, 0.15) : lin(0.85, 0.08, 0.06), 3.2, 'round');
    g.hud.roundFlash = 1;
    if (room === 1) g.hud.toast('Clear the room. A workbench, a chest and the way on open when it is empty.', '#ffd24d');
    this.station('AmmoCrate', S.ammo[0], S.ammo[1], S.ammoYaw, Math.round((350 + room * 45) / 10) * 10, -1, 'Ammo');
    this.guns.forEach((wi, k) => { const w = DATA.weapons[wi]; if (!w) return; const [x, y, yaw] = S.guns[k]; this.station('WallBuy', x, y, yaw, Math.round((w.wallCost > 0 ? w.wallCost : { Rare: 2600, Epic: 4200, Legendary: 6500 }[w.rarity] || 2000) / 10) * 10, wi, w.name, 130); });
    if (started) { Meta.roundStarted(room, g.map.id); P.onRoundStarted(room); }
    g.navRebuild(P.pos);
  }
  spawnBoss() {
    const g = this.g, A = this.A(), bi = this.bossPick[this.room / 5 - 1], B = DATA.bosses[bi];
    const at = V3(A.c[0], 260, A.c[1] + this.flip * A.hy * 0.3);
    g.bossSpawned = true;
    g.boss = g.spawnEnemy(B.minion, at, false, bi, 1, 1 + 0.5 * (g.net.role === 'host' ? g.net.ghosts.size : 0), 0, false);
    if (B.mech === 'twin') { const T = g.spawnEnemy(B.minion, at.clone().add(V3(500, 0, 0)), false, bi, 1, 1, 0, false); T.twin = g.boss; g.boss.twin = T; }
    g.banner(`${B.name.toUpperCase()}`, lin(1, 0.25, 0.15), 4); g.hud.toast(B.desc || B.title, '#ff9a8a');
    g.audio.play('S_BossRoar', 1, 0.8);
  }
  // the room is empty: the bench and the chest come up, and the way on opens
  clear() {
    const g = this.g;
    if (this.cleared) return;
    this.cleared = true; g.phase = 'Intermission'; g.phaseTimer = 0; this.seq++; this.zones = [];
    g.player.onRoundEnded(this.room);
    if (this.room >= ROOMS) { g.levelComplete(); return; }
    this.open();
    g.banner(`ROOM ${this.room} CLEAR`, this.isBossRoom() ? lin(1, 0.75, 0.2) : [0.95, 0.95, 0.92], 3);
  }
  next() { if (this.host && this.cleared && this.room < ROOMS) this.enter(this.room + 1); }

  // ------------------------------------------------------------------ what stands in a room (built by everyone)
  station(type, x, y, yaw, cost, weapon, label, z = 0) { const W = this.g.world; W.rt = true; let I; try { I = W.Station(type, V(x, y, z), yaw, cost, weapon, label); } finally { W.rt = false; } I.descent = true; this.things.push(I); return I; }
  open() {
    const g = this.g, S = this.S(), boss = (this.room + 1) % 5 === 0, col = boss ? 0xff5a4a : 0xffcd5a, hex = boss ? '#ff5a4a' : '#ffcd5a';
    const B = this.station('HighRoller', S.bench[0], S.bench[1], S.benchYaw, 2500, -1, 'Workbench'); B.makeSolid(-12, 140, -185, 185, 0, 170);
    const Ch = this.station('Chest', S.chest[0], S.chest[1], S.chestYaw, 0, this.tier, 'Chest'); Ch.keep = true;
    const [x, y] = S.exit;
    const I = new Interactable(g, 'Quest', V(x, y, 0), 0, 0, -1, '', V(100, 100, 100));
    I.useRadius = 260; const f = this.flip;
    I.pane = I.part(null, 0, V(0, f * 104, 245), V(370, 8, 490), C(col), null, 1.1); I.pane.material = I.pane.material.clone(); I.pane.material.transparent = true; I.pane.material.opacity = 0.55;
    I.part(null, 0, V(0, f * 40, 4), V(370, 260, 4), C(col), null, 1.6);
    I.text(null, V(0, f * 60, 680), S.textYaw, 96, boss ? 'THE SEAL' : 'THE WAY DOWN', hex); I.text(null, V(0, f * 60, 624), S.textYaw, 40, boss ? 'something is waiting' : `room ${this.room + 1} of ${ROOMS}`, '#e8e0d0');
    I.q = { usable: () => this.cleared, prompt: () => `[E] ${boss ? 'Break the seal' : 'Go on'}  -  room ${this.room + 1}\nSpend what you mean to spend first: the bench and the chest stay here.${g.net.active ? '\nEveryone goes together' : ''}`,
      use: () => { if (this.host) this.next(); else g.net.emit('door', { g: 0 }); } };
    g.scene.add(I.group); g.interactables.push(I); this.gates.push(I);
    g.fx.ring(V3(x, 6, y), 300, lin(1, 0.8, 0.35), 0.5); g.fx.ring(V3(S.bench[0], 6, S.bench[1] - f * 120), 260, lin(0.4, 0.9, 1), 0.5); g.fx.ring(V3(S.chest[0], 6, S.chest[1]), 260, lin(1, 0.85, 0.4), 0.5);
    g.audio.play('S_LevelUp', 0.6, 1.2);
  }
  wipe() {
    const g = this.g;
    for (const I of this.gates.concat(this.things)) { I.remove = true; I.enabled = false; if (I.solid) I.solid.enabled = false; }
    this.gates = []; this.things = [];
  }
  // ---- flat pools of light or water that a boss lays over the floor (the Toad's mire, the Nameless's one lit patch)
  zone(x, z, r, col, y, op, life) { this.zones.push([Math.round(x), Math.round(z), Math.round(r), col, y, op, life]); }
  tickFx(dt) {
    const g = this.g, t = g.time;
    for (const I of this.gates) if (I.pane) I.pane.material.opacity = 0.42 + 0.2 * Math.sin(t * 3);
    if (this.host) { for (const Z of this.zones) Z[6] -= dt; this.zones = this.zones.filter((Z) => Z[6] > 0); }
    const key = this.zones.map((Z) => Z.slice(0, 4).join(',')).join('|');
    if (key !== this.zkey) {
      this.zkey = key; for (const m of this.zmesh || []) { g.scene.remove(m); m.geometry.dispose(); m.material.dispose(); }
      this.zmesh = this.zones.map((Z) => { const m = new THREE.Mesh(new THREE.CircleGeometry(Z[2], 48), new THREE.MeshBasicMaterial({ color: Z[3], transparent: true, opacity: Z[5], depthWrite: false, fog: false })); m.rotation.x = -Math.PI / 2; m.position.set(Z[0], Z[4], Z[1]); m.renderOrder = 2; g.scene.add(m); return m; });
    }
    (this.zmesh || []).forEach((m, i) => { const Z = this.zones[i]; if (Z) m.material.opacity = Z[5] * (0.85 + 0.15 * Math.sin(t * 4 + i)) * Math.min(1, Math.max(0.15, Z[6] * 2)); });
  }

  // ------------------------------------------------------------------ what comes up in a room
  // Each room draws its own handful from everything in the bestiary: two or three kinds of the common run, and more
  // of the strange ones the deeper it is. No two rooms have quite the same crowd.
  rollRoster(room) {
    const E = DATA.enemies, fodder = [], odd = [];
    E.forEach((D, i) => { if (D.boss || D.ai === 'Gilded') return; const cap = room * 1.25 + 1; if (D.minRound > cap) return; (['Walker', 'Runner', 'Crawler'].includes(D.ai) ? fodder : odd).push(i); });
    const take = (L, n) => { const out = []; L = L.slice(); while (out.length < n && L.length) out.push(L.splice(randInt(0, L.length - 1), 1)[0]); return out; };
    const R0 = take(fodder, room < 4 ? 2 : 3), R1 = take(odd, Math.min(5, 1 + Math.floor(room / 3)));
    const gilded = E.map((D, i) => (D.ai === 'Gilded' ? i : -1)).filter((i) => i >= 0);
    return { f: R0, o: R1, gold: gilded.length ? gilded[randInt(0, gilded.length - 1)] : -1 };
  }
  pick() {
    const Rr = this.roster, E = DATA.enemies; if (!Rr) return 0;
    if (Rr.gold >= 0 && Math.random() < 0.012) return Rr.gold;
    const L = Rr.f.map((i) => [i, Math.max(3, E[i].weight) * 1.6]).concat(Rr.o.map((i) => [i, Math.max(0.6, E[i].weight)]));
    let tot = 0; for (const l of L) tot += l[1];
    let r = Math.random() * tot; for (const l of L) { r -= l[1]; if (r <= 0) return l[0]; }
    return L[0][0];
  }
  // half a per cent of everything that dies leaves a buff; the deeper the room, the better it tends to be
  dropBuff(E, at) {
    if (E.isBoss || E.splitChild || Math.random() >= 0.005) return;
    const room = this.room, T = room <= 5 ? [50, 40, 10, 0, 0] : room <= 10 ? [20, 45, 28, 7, 0] : room <= 15 ? [0, 30, 42, 23, 5] : [0, 12, 40, 34, 14];
    let r = Math.random() * 100, ri = 0; for (let q = 0; q < 5; q++) { r -= T[q]; if (r <= 0) { ri = q; break; } }
    const P = this.g.player, u = rollBuff(ri, P.upgradeStacks, P.cls.id); if (u >= 0) { this.g.pickups.spawn('Buff', at.clone().add(V3(0, 0, 60)), u); this.g.hud.toast('Something dropped a buff', '#c58cff'); }
  }

  // ------------------------------------------------------------------ co-op
  state() { return [this.room, this.arena, this.flip, this.cleared ? 1 : 0, this.seq, this.guns, this.tier, this.zones]; }
  sync(d) {
    const g = this.g, room = d[0] | 0, seq = d[4] | 0;
    if (Array.isArray(d[7])) this.zones = d[7].slice(0, 6).map((Z) => Z.slice(0, 7).map(Number));
    if (seq === this.seen || room < 1 || room > ROOMS) return;
    this.seen = seq;
    if (room !== this.room) {
      this.wipe(); this.room = room; this.arena = Math.max(0, Math.min(ARENAS.length - 1, d[1] | 0)); this.flip = d[2] < 0 ? -1 : 1; this.cleared = false; g.round = room; g.hazards.clear();
      this.guns = (Array.isArray(d[5]) ? d[5] : []).slice(0, 2).map((v) => Math.max(1, Math.min(DATA.weapons.length - 1, v | 0))); this.tier = Math.max(0, Math.min(3, d[6] | 0));
      if (g.player.dead) g.player.revive();
      this.arrive(true);
    }
    if (d[3] && !this.cleared) { this.cleared = true; if (room < ROOMS) { this.open(); g.banner(`ROOM ${room} CLEAR`, [0.95, 0.95, 0.92], 3); } }
  }
}
