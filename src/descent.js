// The Descent: the run as a string of rooms. Clear the room, take what it pays, choose the next door by what is
// written over it. Rooms 5, 10, 15 and 20 belong to bosses. The host (or the solo player) owns the state; guests
// are told the room, what it paid and what the doors offer, and build the same things on their own side.
import * as THREE from 'three';
import { buildPortal, tickPortal, W as PW, SPRING as PSPRING, PORTAL_Y } from './portal.js';
import { DATA, lin, randInt, zombieCount, maxAlive, difficulty, mutators, DIFFS } from './data.js';
import { machine, ASC } from './deeds.js';
import { sigOf } from './signatures.js';
import { V, R } from './mapkit.js';
import { Interactable } from './interact.js';
import { ARENAS, spots, N_ROOMS, bedOf } from './map_descent.js';
import { rollCore, CORE0, CORE_DEFS, coreTier } from './cores.js';
import { Meta } from './meta.js';
import { Raid } from './raid.js';
import { Sector, SECTORS } from './sector.js';
import { STRAINS } from './blight.js';
// boss health multiplier by depth (room 5 / 10 / 15 / 20), on top of the room's usual health curve
const BOSS_HP = [2.3, 2.5, 2.7, 2.9];

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
    this.g = game; this.room = 0; this.arena = 0; this.flip = 1; this.cleared = false; this.guns = [1, 2]; this.tier = 0; this.gates = []; this.things = []; this.late = []; this.seq = 0; this.bossT = -1; this.seen = -1; this.zones = []; this.zkey = ''; this.rdy = new Set(); this.rdyN = [0, 1];
    // sixteen rooms out of all there are, none of them twice in a run
    const o = [...Array(N_ROOMS).keys()]; for (let i = o.length - 1; i > 0; i--) { const j = randInt(0, i); [o[i], o[j]] = [o[j], o[i]]; }
    this.order = o.length >= 16 ? o.slice(0, 16) : o.concat(o).slice(0, 16);
    this.bossPick = this.pickBosses();
    this.result = null;
  }
  bed() { return bedOf(this.arena); }
  get host() { return this.g.net.role !== 'client'; }
  isBossRoom(r = this.room) { return r > 0 && r % 5 === 0; }
  arenaFor(room) { return room % 5 === 0 ? (room >= ROOMS ? N_ROOMS + 1 : N_ROOMS) : this.order[room - 1 - Math.floor(room / 5)]; }   // the last room is the Hollow King's, and no other's
  flipFor(room) { return room % 5 === 0 ? (room > 10 ? -1 : 1) : (room % 2 ? 1 : -1); }
  A() { return ARENAS[this.arena]; }
  S() { return spots(this.A(), this.flip); }
  // one boss from each of the four tiers; which one is the luck of the run
  pickBosses() { const out = []; for (let t = 1; t <= 4; t++) { const L = DATA.bosses.map((b, i) => (b.tier === t ? i : -1)).filter((i) => i >= 0); out.push(L.length ? L[randInt(0, L.length - 1)] : this.g.map.bosses[(t - 1) % Math.max(1, this.g.map.bosses.length)]); } return out; }

  // ------------------------------------------------------------------ flow (host)
  tick(dt) {
    const g = this.g;
    this.tickFx(dt);
    if (this.raid) { this.raid.root.visible = g.phase !== 'Village'; if (g.phase !== 'Village') this.raid.tick(dt); }
    if (this.sector && g.phase !== 'Village') { this.sector.tick(dt); if (this.host) this.sector.hostTick(dt); }
    if (g.phase === 'Village') return;   // up in the village: nothing happens down here until the run starts
    if (!this.host) return;
    this.contain(dt);
    if (this.cleared && this.rdy.size) { const N = this.need(); this.rdyN = [N.filter((k) => this.rdy.has(k)).length, N.length]; if (N.length && this.rdyN[0] >= N.length) { this.next(); return; } } else this.rdyN = [0, this.need().length];
    if (g.phase === 'PreGame') { g.phaseTimer -= dt; if (g.phaseTimer <= 0) this.enter(1); return; }
    if (g.phase === 'Round') {
      if (this.bossT >= 0) { this.bossT -= dt; if (this.bossT < 0) { if (this.room >= ROOMS && this.raid) this.raid.begin(); else this.spawnBoss(); } }
      g.tickRound(dt);
      if (this.isBossRoom() && g.bossSpawned && (!g.boss || g.boss.dead)) {
        if (!this.twinAlive() && (this.deadT = (this.deadT || 0) + dt) > 0.4) { this.deadT = 0; for (const E of g.enemies) if (!E.dead && !E.isBoss) { E.lastHitExplosive = true; E.takeHit(1e9, E.pos, V3(0, 1, 0), false); } g.spawned = g.toSpawn; this.clear(); }
      }
    }
  }
  ceilAt(p) { const A = this.A(); return A && Math.abs(p.x - A.c[0]) < A.hx + 300 && Math.abs(p.z - A.c[1]) < A.hy + 300 ? A.H : Infinity; }
  // Nothing leaves the room. Whatever ends up over the roof, through a wall or under the floor is put back on open
  // ground inside; a flyer is simply held under the roof.
  contain(dt) {
    this.conT = (this.conT || 0) - dt; if (this.conT > 0) return; this.conT = 0.4;
    const g = this.g, A = this.A(); if (!A) return;
    for (const E of g.enemies) {
      if (E.dead || E.remove || E.raidHeart) continue;
      const top = A.H - E.half - 12;
      if (E.ai === 'Flyer' && E.pos.y > top && E.pos.y < A.H + 40) { E.pos.y = top; if (E.vel.y > 0) E.vel.y = 0; }
      const out = Math.abs(E.pos.x - A.c[0]) > A.hx - 20 || Math.abs(E.pos.z - A.c[1]) > A.hy - 20 || E.pos.y - E.half > A.H - 30 || (E.pos.y < -220 && !E.burrowed);
      E.outT = out ? (E.outT || 0) + 1 : 0;
      if (E.outT < 2) continue;
      E.outT = 0; g.rescues = (g.rescues || 0) + 1;
      if (E.isBoss || !g.relocate(E)) { const at = g.findFreeLocationNear(V3(A.c[0], 0, A.c[1]), 0, Math.min(A.hx, A.hy) * 0.6); E.pos.set(at ? at.x : A.c[0], (at ? at.y : 0) + E.half + 4, at ? at.z : A.c[1]); E.vel.set(0, 0, 0); E.burrowed = false; E.collides = true; }
    }
  }
  twinAlive() { const L = this.g.enemies.filter((E) => E.isBoss && !E.dead && !E.decoy); if (L.length && (!this.g.boss || this.g.boss.dead)) this.g.boss = L[0]; return L.length > 0; }
  enter(room) {
    const g = this.g;
    this.wipe();
    this.room = room; this.arena = this.arenaFor(room); this.flip = this.flipFor(room); this.cleared = false; this.seq++; this.rdy.clear();
    for (const E of g.enemies) if (!E.dead) E.remove = true;
    g.hazards.clear(); g.boss = null; g.bossSpawned = false; g.bossRound = false; this.zones = [];
    g.round = room; g.phase = 'Round';
    const boss = this.isBossRoom(), n = g.net.role === 'host' ? g.net.ghosts.size : 0;
    g.toSpawn = boss ? 0 : Math.round((24 + room * 4.5) * (1 + 0.6 * n));   // a boss's room holds the boss and nothing else, unless it calls something up itself   // a room is a few minutes' work, the first ones included
    g.spawned = 0; g.killed = 0; g.powerupsThisRound = 0; g.tonicsThisRound = 0; g.grenadesThisRound = 0; g.ammoThisRound = 0; g.spawnTimer = boss ? 5 : 1.6; g.roundT = 0; g.midChest = true;
    this.bossT = boss ? 2.2 : -1;
    this.roster = this.rollRoster(room);
    // two guns for the walls, the better ones the deeper you are; and what the chest at the end will be
    const RAR = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'], want = (room < 6 ? [0, 1] : room < 11 ? [1, 2] : room < 16 ? [2, 3] : [3, 4]).map((k) => RAR[k]);
    const pool = DATA.weapons.map((w, i) => i).filter((i) => i > 0 && !DATA.weapons[i].cash), pick = [];   // nothing that runs on money: there is none down here
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
    if (g.world.showChunk) g.world.showChunk(this.arena);
    const raidRoom = this.arena === N_ROOMS + 1;
    if (this.raid && !raidRoom) { this.raid.dispose(); this.raid = null; }
    if (raidRoom && !this.raid) this.raid = new Raid(g, this);
    if (this.sector) { this.sector.dispose(); this.sector = null; }
    if (!raidRoom) this.sector = new Sector(g, this);
    g.hud.hurtWhite = 0.3; g.audio.play('S_Enter', 1);
    const boss = this.isBossRoom();
    g.banner(boss ? `ROOM ${room}  -  BOSS` : `ROOM ${room} / ${ROOMS}`, boss ? lin(1, 0.25, 0.15) : lin(0.85, 0.08, 0.06), 3.2, 'round');
    g.hud.roundFlash = 1;
    if (!raidRoom && (room - 1) % 4 === 0) { const St = STRAINS[g.strainNow()], c = St.glow; g.hud.toast(`${St.name.toUpperCase()} SECTOR - ${SECTORS[g.strainNow()].tip}`, [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255]); }
    if (room === 1) g.hud.toast('Clear the room. Enemies drop parts; a workbench to fit them and the way on open when it is empty.', '#ffd24d');
    this.station('AmmoCrate', S.ammo[0], S.ammo[1], S.ammoYaw, 0, -1, 'Ammo');
    if (started) { Meta.roundStarted(room, g.map.id); P.onRoundStarted(room); }
    g.navRebuild(P.pos);
  }
  spawnBoss() {
    const g = this.g, A = this.A(), bi = this.bossPick[this.room / 5 - 1], B = DATA.bosses[bi];
    const at = V3(A.c[0], 260, A.c[1] + this.flip * A.hy * 0.3);
    g.bossSpawned = true;
    // a boss is a fight, not a speed bump: deeper ones carry more, and each extra player adds most of another one
    const hpK = BOSS_HP[(B.tier || 1) - 1] || BOSS_HP[0], more = g.net.role === 'host' ? g.net.ghosts.size : 0;
    g.boss = g.spawnEnemy(B.minion, at, false, bi, 1, hpK * (1 + 0.6 * more), 0, false);
    if (g.boss) g.boss.hpMul = hpK * (1 + 0.6 * more);
    if (B.mech === 'twin') { const T = g.spawnEnemy(B.minion, at.clone().add(V3(500, 0, 0)), false, bi, 1, hpK * 0.72 * (1 + 0.6 * more), 0, false); T.twin = g.boss; g.boss.twin = T; }
    // the entrance: the room holds its breath, the name goes up big, then it comes for you
    g.hitstop = Math.max(g.hitstop || 0, 0.45); g.shakeAt(at, 1400); g.fx.flash(at, [1, 0.3, 0.2], 900, 0.6, true);
    g.audio.play('S_BossRoar', 1, 0.8); g.audio.play('S_Phase', 0.8);
  }
  // the room is empty: the bench and the chest come up, and the way on opens
  clear() {
    const g = this.g;
    if (this.cleared) return;
    this.cleared = true; g.phase = 'Intermission'; g.phaseTimer = 0; this.seq++; this.zones = [];
    g.player.onRoundEnded(this.room); if (g.player.onRoomClear) g.player.onRoomClear(); Meta.bump('dRooms');
    this.progress();
    if (this.room >= ROOMS) { this.reward(); g.levelComplete(); return; }
    this.open();
    g.banner(`ROOM ${this.room} CLEAR`, this.isBossRoom() ? lin(1, 0.75, 0.2) : [0.95, 0.95, 0.92], 3);
  }
  next() { if (this.host && this.cleared && this.room < ROOMS) this.enter(this.room + 1); }
  // the way on opens when everyone still standing has put a hand to it
  need() { const g = this.g; return (g.player.dead ? [] : ['host']).concat([...g.net.ghosts.entries()].filter(([, G]) => !G.dead).map(([k]) => k)); }
  ready(id) {
    if (!this.host || !this.cleared || this.room >= ROOMS) return;
    this.rdy.add(id); const N = this.need(), n = N.filter((k) => this.rdy.has(k)).length;
    if (n >= N.length) { this.next(); return; }
    this.g.hud.toast(`${n} of ${N.length} at the door  -  everyone has to press it`, '#ffcd5a'); this.g.audio.play('S_Door', 0.5, 1.4);
  }

  // ------------------------------------------------------------------ what stands in a room (built by everyone)
  station(type, x, y, yaw, cost, weapon, label, z = 0) { const W = this.g.world; W.rt = true; let I; try { I = W.Station(type, V(x, y, z), yaw, cost, weapon, label); } finally { W.rt = false; } I.descent = true; this.things.push(I); return I; }
  open() {
    const g = this.g, S = this.S(), boss = (this.room + 1) % 5 === 0, col = boss ? 0xff5a4a : 0xffcd5a, hex = boss ? '#ff5a4a' : '#ffcd5a';
    const B = this.station('HighRoller', S.bench[0], S.bench[1], S.benchYaw, 0, -1, 'Workbench'); B.makeSolid(-12, 140, -185, 185, 0, 170);
    { const P = g.player; P.fortuneUsed = {}; }   // the Fortune Teller rerolls each buff once a room
    // the Mystery Box comes up in every third room, with one free roll
    if (this.room % 3 === 0) { g.player.boxRolls = 1; g.box = this.station('MysteryBox', S.box[0], S.box[1], S.chestYaw, 0, -1, 'Mystery Box'); }
    // the Compressor stands by the workbench every third room
    if (machine('compressor') && this.room % 3 === 0) {
      const a = (S.benchYaw * Math.PI) / 180, side = (k) => [S.bench[0] - Math.sin(a) * 470 * k, S.bench[1] + Math.cos(a) * 470 * k], far = (q) => Math.min(...[S.box, S.chest, S.exit].filter(Boolean).map((o) => Math.hypot(o[0] - q[0], o[1] - q[1])));
      const at = far(side(1)) >= far(side(-1)) ? side(1) : side(-1);
      const C = this.station('Compressor', at[0], at[1], S.benchYaw, 0, -1, 'Compressor'); C.makeSolid(0, 150, -160, 160, 0, 470);
    }
    const [x, y] = S.exit;
    const I = new Interactable(g, 'Quest', V(x, y, 0), 0, 0, -1, '', V(100, 100, 100));
    I.useRadius = 260; const f = this.flip;
    buildPortal(I, f, col, boss);
    // its pillars and crown are solid (and so something to grapple to); the room's own doorway behind it is hidden
    { const solid = (x0, x1, y0, y1, z0, z1) => { const b = new THREE.Box3(); for (let k = 0; k < 8; k++) b.expandByPoint(V(x + ((k & 1) ? x1 : x0), y + f * ((k & 2) ? y1 : y0), (k & 4) ? z1 : z0).to3()); return g.phys.addDoor(b); };
      I.solids = [solid(-PW - 96, -PW - 2, PORTAL_Y - 48, PORTAL_Y + 48, 0, PSPRING + 20), solid(PW + 2, PW + 96, PORTAL_Y - 48, PORTAL_Y + 48, 0, PSPRING + 20), solid(-PW - 100, PW + 100, PORTAL_Y - 48, PORTAL_Y + 48, PSPRING + PW - 20, PSPRING + PW + 110)]; }
    I.text(null, V(0, f * 20, 900), S.textYaw, 96, boss ? 'THE SEAL' : 'THE WAY DOWN', hex); I.text(null, V(0, f * 20, 840), S.textYaw, 40, boss ? 'something is waiting' : `room ${this.room + 1} of ${ROOMS}`, '#e8e0d0');
    I.q = { usable: () => this.cleared, prompt: () => `[E] ${boss ? 'Break the seal' : 'Go on'}  -  room ${this.room + 1}\nFit your parts at the bench first: it stays here.${g.net.active ? `\nEveryone has to press it  (${this.rdyN[0]} of ${this.rdyN[1]} ready)` : ''}`,
      use: () => { if (this.host) this.ready('host'); else { g.net.emit('door', { g: 0 }); g.hud.toast('You are at the door. Waiting for the others.', '#ffcd5a'); } } };
    g.scene.add(I.group); g.interactables.push(I); this.gates.push(I);
    g.fx.ring(V3(x, 6, y), 300, lin(1, 0.8, 0.35), 0.5); g.fx.ring(V3(S.bench[0], 6, S.bench[1] - f * 120), 260, lin(0.4, 0.9, 1), 0.5); g.fx.ring(V3(S.chest[0], 6, S.chest[1]), 260, lin(1, 0.85, 0.4), 0.5);
    g.audio.play('S_Clear', 0.9);
  }
  wipe() {
    const g = this.g;
    for (const I of this.gates.concat(this.things)) { I.remove = true; I.enabled = false; if (I.solid) I.solid.enabled = false; for (const b of I.solids || []) b.enabled = false; }
    if (g.box && g.box.descent) g.box = null;
    this.gates = []; this.things = [];
  }
  // ---- flat pools of light or water that a boss lays over the floor (the Toad's mire, the Nameless's one lit patch)
  zone(x, z, r, col, y, op, life) { this.zones.push([Math.round(x), Math.round(z), Math.round(r), col, y, op, life]); }
  tickFx(dt) {
    const g = this.g, t = g.time;
    for (const I of this.gates) tickPortal(I, g, dt);
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
    // one entry per kind of creature (several maps' entries share a creature): never two of the same in one room's crowd
    const take = (L, n, used = new Set()) => { const out = []; L = L.slice(); while (out.length < n && L.length) { const i = L.splice(randInt(0, L.length - 1), 1)[0], k = E[i].model || E[i].art; if (used.has(k)) continue; used.add(k); out.push(i); } return out; };
    const seen = new Set(), R0 = take(fodder, room < 4 ? 2 : 3, seen), R1 = take(odd, Math.min(5, 1 + Math.floor(room / 3)), seen);
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
  // One in a hundred of everything that dies leaves a buff. What it can be depends on what died: the common run leave
  // common and uncommon ones, the stranger kinds up to rare, and an elite up to epic.
  dropBuff(E, at) {
    if (E.splitChild || E.noLoot || E.ai === 'Totem') return;
    const P = this.g.player, ban = P.banCores || null;
    const pick = (cap) => rollCore(cap, P.upgradeStacks, ban);
    const drop = (cap, off = 0) => this.g.pickups.spawn('Buff', at.clone().add(V3(Math.cos(off) * (off ? 90 : 0), 0, Math.sin(off) * (off ? 90 : 0)).add(V3(0, 0, 60))), pick(cap));
    // a boss leaves one good one and often a second, an elite leaves one about a third of the time, and the rank and file
    // leave them rarely: a room is worth one or two (the odds thin as the rooms fill up). Half what it was.
    if (E.isBoss) { drop(3, 0.5); if (Math.random() < 0.5) drop(3, 2.6); return; }
    const odds = 0.5 * (E.elite ? 0.6 : Math.max(0.045, 0.1 - this.room * 0.003) * (['Walker', 'Runner', 'Crawler'].includes(E.ai) ? 1 : 1.5)) * (1 + Math.max(0, P.stat('LuckFind')));
    if (Math.random() >= odds) return;
    drop(E.elite ? 3 : ['Walker', 'Runner', 'Crawler'].includes(E.ai) ? 1 : 2);
  }

  // ------------------------------------------------------------------ what going down earns
  // every room cleared is written down
  progress() {
    Meta.best('dRoom', this.room);
  }
  // The run is won. The gun that did the most of it is marked for this difficulty, if it has not been already; if it
  // has, the mark goes to the next gun down that pulled its weight (a tenth of the run or more).
  reward() {
    if (this.result) return;
    const P = this.g.player, df = difficulty(), R = P.runDmg || {}, tot = Object.values(R).reduce((a, b) => a + b, 0) || 1;
    Meta.bump('dWins'); Meta.best('dDiff', df + 1); Meta.best('dRoom', ROOMS);
    const L = Object.keys(R).map(Number).sort((a, b) => R[b] - R[a]).map((i) => ({ i, name: DATA.weapons[i].name, share: R[i] / tot }));
    const res = this.result = { top: L.slice(0, 3), diff: DIFFS[df].name, asc: null, level: 0, already: false };
    const W = L.find((q) => q.share >= 0.1 && !Meta.ascHas(q.name, df));
    if (W) { Meta.ascend(W.name, df); res.asc = W.name; res.level = Meta.asc(W.name); }
    else if (L.length) res.already = true;
    this.progress(); Meta.runWon('descent', this.g.mapId, df, mutators()); Meta.save();
  }

  // ------------------------------------------------------------------ co-op
  state() { return [this.room, this.arena, this.flip, this.cleared ? 1 : 0, this.seq, this.guns, this.tier, this.zones, this.rdyN, this.raid ? this.raid.state() : 0]; }
  sync(d) {
    const g = this.g, room = d[0] | 0, seq = d[4] | 0;
    if (Array.isArray(d[7])) this.zones = d[7].slice(0, 6).map((Z) => Z.slice(0, 7).map(Number));
    if (Array.isArray(d[8])) this.rdyN = [d[8][0] | 0, Math.max(1, d[8][1] | 0)];
    if (this.raid && Array.isArray(d[9])) this.raid.sync(d[9]);
    if (seq === this.seen || room < 1 || room > ROOMS) return;
    this.seen = seq;
    if (room !== this.room) {
      this.wipe(); this.room = room; this.arena = Math.max(0, Math.min(ARENAS.length - 1, d[1] | 0)); this.flip = d[2] < 0 ? -1 : 1; this.cleared = false; g.round = room; g.hazards.clear();
      this.guns = (Array.isArray(d[5]) ? d[5] : []).slice(0, 2).map((v) => Math.max(1, Math.min(DATA.weapons.length - 1, v | 0))); this.tier = Math.max(0, Math.min(3, d[6] | 0));
      if (g.player.dead) g.player.revive();
      this.arrive(true);
    }
    if (d[3] && !this.cleared) { this.cleared = true; this.progress(); if (this.g.player.onRoomClear) this.g.player.onRoomClear(); if (room >= ROOMS) this.reward(); if (room < ROOMS) { this.open(); g.banner(`ROOM ${room} CLEAR`, [0.95, 0.95, 0.92], 3); } }
  }
}
