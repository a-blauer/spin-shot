// The Descent: the run as a string of rooms. Clear the room, take what it pays, choose the next door by what is
// written over it. Rooms 5, 10, 15 and 20 belong to bosses. The host (or the solo player) owns the state; guests
// are told the room, what it paid and what the doors offer, and build the same things on their own side.
import * as THREE from 'three';
import { DATA, lin, randInt, zombieCount, maxAlive } from './data.js';
import { V, R } from './mapkit.js';
import { Interactable } from './interact.js';
import { ARENAS, THEMES } from './map_descent.js';
import { rollBuff } from './classes.js';
import { Meta } from './meta.js';

export const ROOMS = 20;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const TIER_NAME = ['WOODEN CHEST', 'IRON CHEST', 'GILT CHEST', 'RELIQUARY'], TIER_HEX = ['#c9a46a', '#aab4c4', '#ffcd5a', '#c58cff'];
// reward kinds, in the order they are sent over the wire
const KINDS = ['Start', 'Chest', 'Arsenal', 'Bench', 'Box', 'Gold', 'Supply', 'Boss'];
const INFO = {
  Arsenal: ['ARMOURY', 'three guns for sale', '#ff9a6a'], Bench: ['WORKBENCH', 'upgrade a gun', '#7fe0ff'], Box: ['MYSTERY BOX', 'roll for a gun', '#ff8cff'],
  Gold: ['PAYROLL', 'a pile of cash', '#ffe27a'], Supply: ['FIELD KIT', 'ammo, health, a tonic', '#8aff8a'], Boss: ['THE SEAL', 'something is waiting', '#ff5a4a'],
};
const C = (h) => new THREE.Color(h);
const hexInt = (h) => parseInt(h.slice(1), 16);
// what the chest behind a door is made of: better the deeper you are
function chestTier(room, elite) {
  const W = room <= 5 ? [60, 40, 0, 0] : room <= 10 ? [12, 53, 35, 0] : room <= 15 ? [0, 25, 50, 25] : [0, 0, 45, 55];
  let r = Math.random() * 100, t = 0; for (let i = 0; i < 4; i++) { r -= W[i]; if (r < 0) { t = i; break; } }
  return Math.min(3, t + (elite ? 1 : 0));
}

export class Descent {
  constructor(game) {
    this.g = game; this.room = 0; this.arena = 0; this.cleared = false; this.reward = [0, 0, 0]; this.gates = []; this.offers = []; this.things = []; this.seq = 0; this.bossT = -1; this.seen = -1;
    // the order the sixteen ordinary arenas come in is shuffled each run; the four boss rooms are always the fifths
    const o = [...Array(16).keys()]; for (let i = 15; i > 0; i--) { const j = randInt(0, i); [o[i], o[j]] = [o[j], o[i]]; }
    this.order = o;
    this.bossPick = this.pickBosses();
  }
  get host() { return this.g.net.role !== 'client'; }
  isBossRoom(r = this.room) { return r > 0 && r % 5 === 0; }
  arenaFor(room) { return room % 5 === 0 ? 15 + room / 5 : this.order[room - 1 - Math.floor(room / 5)]; }
  A() { return ARENAS[this.arena]; }
  // one boss from each of the four tiers; which one is the luck of the run
  pickBosses() { const out = []; for (let t = 1; t <= 4; t++) { const L = DATA.bosses.map((b, i) => (b.tier === t ? i : -1)).filter((i) => i >= 0); out.push(L.length ? L[randInt(0, L.length - 1)] : this.g.map.bosses[(t - 1) % Math.max(1, this.g.map.bosses.length)]); } return out; }

  // ------------------------------------------------------------------ flow (host)
  tick(dt) {
    const g = this.g;
    if (!this.host) { this.tickGates(dt); return; }
    if (g.phase === 'PreGame') { g.phaseTimer -= dt; if (g.phaseTimer <= 0) this.enter(1, [0, 0, 0]); return; }
    if (g.phase === 'Round') {
      if (this.bossT >= 0) { this.bossT -= dt; if (this.bossT < 0) this.spawnBoss(); }
      g.tickRound(dt);
      if (this.isBossRoom() && g.bossSpawned && (!g.boss || g.boss.dead)) {
        if (!this.twinAlive() && (this.deadT = (this.deadT || 0) + dt) > 0.4) { this.deadT = 0; for (const E of g.enemies) if (!E.dead && !E.isBoss) { E.lastHitExplosive = true; E.takeHit(1e9, E.pos, V3(0, 1, 0), false); } g.spawned = g.toSpawn; this.clear(); }
      }
    }
    this.tickGates(dt);
  }
  twinAlive() { const L = this.g.enemies.filter((E) => E.isBoss && !E.dead && !E.decoy); if (L.length && (!this.g.boss || this.g.boss.dead)) this.g.boss = L[0]; return L.length > 0; }
  enter(room, reward) {
    const g = this.g;
    this.wipe();
    this.room = room; this.arena = this.arenaFor(room); this.reward = reward; this.cleared = false; this.seq++;
    for (const E of g.enemies) if (!E.dead) E.remove = true;
    g.hazards.clear(); g.boss = null; g.bossSpawned = false; g.bossRound = false;
    g.round = room; g.phase = 'Round';
    const boss = this.isBossRoom(), elite = !!reward[2], n = g.net.role === 'host' ? g.net.ghosts.size : 0;
    g.toSpawn = Math.round((boss ? 8 + room * 0.6 : Math.min(zombieCount(room) * 0.55, 12 + room * 3.2)) * (elite ? 1.4 : 1) * (1 + 0.6 * n));
    g.spawned = 0; g.killed = 0; g.powerupsThisRound = 0; g.tonicsThisRound = 0; g.grenadesThisRound = 0; g.ammoThisRound = 0; g.spawnTimer = boss ? 5 : 1.6; g.roundT = 0; g.midChest = true;
    this.bossT = boss ? 2.2 : -1; if (boss) g.bossSpawned = false;
    this.roster = this.rollRoster(room);
    g.zones.forEach((Z, i) => { Z.unlocked = i === this.A().zone; });
    this.arrive(true);
    if (g.net.role === 'host' && g.player.dead) g.player.revive();
  }
  // everyone: stand at the way in, facing the room
  arrive(started) {
    const g = this.g, P = g.player, A = this.A(), room = this.room;
    if (P.grappling) P.endGrapple(false);
    if (P.menu) P.closeMenu();
    P.pos.set(A.spawn[0] + (Math.random() - 0.5) * 160, 100, A.spawn[1]); P.vel.set(0, 0, 0); P.pitch = 0; P.yaw = Math.PI; P.invuln = Math.max(P.invuln || 0, 2.5);
    g.zones.forEach((Z, i) => { Z.unlocked = i === A.zone; });
    g.hud.hurtWhite = 0.3; g.audio.play('S_Door', 1, 0.7);
    const boss = this.isBossRoom();
    g.banner(boss ? `ROOM ${room}  -  BOSS` : `ROOM ${room} / ${ROOMS}`, boss ? lin(1, 0.25, 0.15) : lin(0.85, 0.08, 0.06), 3.2, 'round');
    g.hud.roundFlash = 1;
    if (room === 1) g.hud.toast('Clear the room. Then choose a door by what is written over it.', '#ffd24d');
    if (this.reward[2] && !boss) g.hud.toast('An elite room: more of them, and a better prize', '#ff8a6a');
    if (started) { Meta.roundStarted(room, g.map.id); P.onRoundStarted(room); }
    g.navRebuild(P.pos);
  }
  spawnBoss() {
    const g = this.g, A = this.A(), bi = this.bossPick[this.room / 5 - 1], B = DATA.bosses[bi];
    const at = V3(A.c[0], 260, A.c[1] + A.hy * 0.35);
    g.bossSpawned = true;
    g.boss = g.spawnEnemy(B.minion, at, false, bi, 1, 1 + 0.5 * (g.net.role === 'host' ? g.net.ghosts.size : 0), 0, false);
    if (B.mech === 'twin') { const T = g.spawnEnemy(B.minion, at.clone().add(V3(500, 0, 0)), false, bi, 1, 1, 0, false); T.twin = g.boss; g.boss.twin = T; }
    g.banner(`${B.name.toUpperCase()}`, lin(1, 0.25, 0.15), 4); g.hud.toast(B.title, '#ff9a8a');
    g.audio.play('S_BossRoar', 1, 0.8);
  }
  // the room is empty: pay out, and light the doors
  clear() {
    const g = this.g;
    if (this.cleared) return;
    this.cleared = true; g.phase = 'Intermission'; g.phaseTimer = 0; this.seq++;
    g.player.onRoundEnded(this.room);
    if (this.room >= ROOMS) { g.levelComplete(); return; }
    this.offers = this.rollOffers(this.room + 1);
    this.payout(); this.lightGates();
    g.banner(`ROOM ${this.room} CLEAR`, this.isBossRoom() ? lin(1, 0.75, 0.2) : [0.95, 0.95, 0.92], 3);
  }
  rollOffers(next) {
    if (next % 5 === 0) return [[7, 3, 0]];
    const W = { Chest: 34, Arsenal: next < 3 ? 22 : 12, Bench: next < 3 ? 0 : 14, Box: 10, Gold: 12, Supply: 10 };
    const out = [], used = new Set(), n = next <= 2 ? 2 : 3;
    while (out.length < n) {
      let tot = 0; for (const k in W) if (!used.has(k)) tot += W[k];
      let r = Math.random() * tot, pick = 'Chest'; for (const k in W) { if (used.has(k)) continue; r -= W[k]; if (r < 0) { pick = k; break; } }
      used.add(pick);
      const elite = next > 3 && Math.random() < 0.22 ? 1 : 0;
      out.push([KINDS.indexOf(pick), pick === 'Chest' ? chestTier(next, elite) : 0, elite]);
    }
    if (!out.some((o) => o[0] === 1) && Math.random() < 0.6) out[0] = [1, chestTier(next, 0), 0];   // there is nearly always a chest to go for
    return out;
  }
  choose(i) {
    if (!this.host || !this.cleared || !this.offers[i]) return;
    this.enter(this.room + 1, this.offers[i].slice());
  }

  // ------------------------------------------------------------------ what a room pays (built by everyone)
  station(type, x, y, yaw, cost, weapon, label) { const W = this.g.world; W.rt = true; let I; try { I = W.Station(type, V(x, y, 0), yaw, cost, weapon, label); } finally { W.rt = false; } I.descent = true; this.things.push(I); return I; }
  payout() {
    const g = this.g, A = this.A(), [x, y] = A.reward, kind = KINDS[this.reward[0]], tier = this.reward[1], elite = this.reward[2], room = this.room;
    const P = g.player;
    const chest = (dx, t) => { const C = this.station('Chest', x + dx, y, 90, 0, t, 'Chest'); C.free = true; return C; };
    switch (kind) {
      case 'Start': chest(0, 0); break;
      case 'Chest': chest(0, tier); break;
      case 'Boss': chest(-130, Math.min(3, 1 + room / 5)); this.station('AmmoCrate', x + 170, y, 90, 0, -1, 'Ammo'); break;
      case 'Arsenal': {
        // three guns you do not own, the better ones the deeper you are; dearer than a wall gun upstairs, since nothing else here costs
        const RAR = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'], want = (room < 6 ? [0, 1] : room < 11 ? [1, 2] : room < 16 ? [2, 3] : [3, 4]).map((k) => RAR[k]);
        const pool = DATA.weapons.map((w, i) => i).filter((i) => i > 0);
        const pick = []; let seed = this.room * 7919 + this.seq * 31;
        const rnd = () => { seed = (seed * 16807 + 11) % 2147483647; return seed / 2147483647; };
        for (let k = 0; k < 3; k++) { const L = pool.filter((i) => !pick.includes(i) && want.includes(DATA.weapons[i].rarity) && i !== 0), L2 = L.length ? L : pool.filter((i) => !pick.includes(i)); pick.push(L2[Math.floor(rnd() * L2.length)]); }
        pick.forEach((wi, k) => { const w = DATA.weapons[wi], I = this.station('WallBuy', x + (k - 1) * 330, y, 90, Math.round((w.wallCost > 0 ? w.wallCost : { Rare: 2600, Epic: 4200, Legendary: 6500 }[w.rarity] || 2000) * (elite ? 0.5 : 1) / 10) * 10, wi, w.name); I.rack = true; this.rack(I); });
        break; }
      case 'Bench': this.station('HighRoller', x, y, 90, 2500, -1, 'Workbench'); if (elite) chest(260, 0); break;
      case 'Box': g.box = this.station('MysteryBox', x, y, 90, elite ? 475 : 950, -1, 'Mystery Box'); break;
      case 'Gold': { const amt = (1200 + room * 200) * (elite ? 2 : 1); for (let k = 0; k < 5; k++) g.pickups.spawn('MoneyBag', V3(x + Math.cos(k * 1.257) * 110, 60, y + Math.sin(k * 1.257) * 110), Math.round(amt / 5)); break; }
      case 'Supply': this.station('AmmoCrate', x - 150, y, 90, 0, -1, 'Ammo'); P.health = P.maxHealth; g.pickups.spawn('Tonic', V3(x + 120, 60, y), P.rollTonic()); if (elite) g.pickups.spawn('Tonic', V3(x + 220, 60, y + 60), P.rollTonic()); P.toast('Patched up', '#8aff8a'); break;
      default: break;
    }
    g.fx.ring(V3(x, 6, y), 380, lin(1, 0.85, 0.4), 0.5);
  }
  // a wall gun with no wall: stand it on a rack
  rack(I) { I.part(null, 0, V(-22, 0, 75), V(14, 250, 150), C(0x2a2018)); for (const s of [-1, 1]) I.part(null, 0, V(-22, s * 118, 75), V(30, 14, 150), C(0x4a3a2c)); }
  lightGates() {
    const g = this.g, A = this.A(), O = this.offers, pos = O.length === 1 ? [A.gates[1]] : O.length === 2 ? [A.gates[0], A.gates[2]] : A.gates;
    O.forEach((o, i) => {
      const kind = KINDS[o[0]], inf = kind === 'Chest' ? [TIER_NAME[o[1]], 'free: your pick of three buffs', TIER_HEX[o[1]]] : INFO[kind], col = hexInt(inf[2]), [x, y] = pos[i];
      const I = new Interactable(g, 'Quest', V(x, y, 0), 0, 0, -1, '', V(100, 100, 100));
      I.useRadius = 250; I.gate = i;
      I.pane = I.part(null, 0, V(0, 100, 205), V(300, 8, 400), C(col), null, 1.1); I.pane.material = I.pane.material.clone(); I.pane.material.transparent = true; I.pane.material.opacity = 0.55;
      I.part(null, 0, V(0, 60, 4), V(300, 200, 4), C(col), null, 1.6);
      I.text(null, V(0, 40, 575), -90, 92, inf[0], inf[2]); I.text(null, V(0, 40, 512), -90, 40, inf[1], '#e8e0d0');
      if (o[2]) I.text(null, V(0, 40, 650), -90, 60, 'ELITE', '#ff5a4a');
      I.q = { usable: () => this.cleared, prompt: () => `[E] ${kind === 'Boss' ? 'Break the seal' : 'Take this door'}  -  ${inf[0]}${o[2] ? '  (elite)' : ''}\n${inf[1]}${g.net.active ? '\nEveryone goes together' : ''}`,
        use: () => { if (this.host) this.choose(i); else g.net.emit('door', { g: i }); } };
      g.scene.add(I.group); g.interactables.push(I); this.gates.push(I);
      g.fx.ring(V3(x, 6, y), 260, lin(((col >> 16) & 255) / 255, ((col >> 8) & 255) / 255, (col & 255) / 255), 0.5);
    });
    g.audio.play('S_LevelUp', 0.6, 1.2);
  }
  tickGates(dt) { const t = this.g.time; for (const I of this.gates) if (I.pane) I.pane.material.opacity = 0.42 + 0.2 * Math.sin(t * 3 + I.gate); }
  wipe() {
    const g = this.g;
    for (const I of this.gates.concat(this.things)) { I.remove = true; if (I.box) I.enabled = false; }
    if (g.box && g.box.descent) g.box = null;
    this.gates = []; this.things = []; this.offers = [];
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
  state() { return [this.room, this.arena, this.cleared ? 1 : 0, this.reward, this.offers, this.seq]; }
  sync(d) {
    const g = this.g, room = d[0] | 0, seq = d[5] | 0; if (seq === this.seen || room < 1 || room > ROOMS) return;
    this.seen = seq;
    const rw = Array.isArray(d[3]) ? d[3].slice(0, 3).map((v) => v | 0) : [0, 0, 0];
    if (room !== this.room) {
      this.wipe(); this.room = room; this.arena = Math.max(0, Math.min(19, d[1] | 0)); this.reward = rw; this.cleared = false; g.round = room; g.hazards.clear();
      if (g.player.dead) g.player.revive();
      this.arrive(true);
    }
    if (d[2] && !this.cleared) {
      this.cleared = true;
      this.offers = (Array.isArray(d[4]) ? d[4] : []).slice(0, 3).map((o) => [Math.max(1, Math.min(7, o[0] | 0)), Math.max(0, Math.min(3, o[1] | 0)), o[2] ? 1 : 0]);
      if (room < ROOMS) { this.payout(); this.lightGates(); g.banner(`ROOM ${room} CLEAR`, [0.95, 0.95, 0.92], 3); }
    }
  }
}
