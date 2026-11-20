// Game mode (port of ADMHGameMode): rounds, spawning, nav flow field, zones & doors, casino nights,
// drops and power-ups. Also owns every subsystem and the frame update order.
import * as THREE from 'three';
import { Meta } from './meta.js';
import { DATA, zombieCount, maxAlive, lin, frandRange, randInt } from './data.js';
import { Physics } from './physics.js';
import { World } from './world.js';
import { Environment } from './env.js';
import { Fx } from './fx.js';
import { ViewModel, vmSun } from './viewmodel.js';
import { Enemy } from './enemies.js';
import { Player } from './player.js';
import { Net } from './net.js';
import { VAULT } from './mapzones.js';
import { Projectiles, Hazards, Pickups } from './entities.js';
import { G as UNI, updateCamBasis, Cam, sprite } from './render.js';

const INF = 1e9;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

export class Game {
  constructor(renderer, audio, hud) {
    this.renderer = renderer;
    this.audio = audio;
    this.hud = hud;
    this.data = DATA;
    this.settings = { fov: 100, sens: 0.12, shake: 1, volume: 0.8 };
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, 16 / 9, 5, 200000);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);
    this.phys = new Physics();
    Net.attach(this);
    this.zones = []; this.spawnPoints = []; this.interactables = []; this.casinoDoors = [];
    this.playerSpawn = V3(0, 100, 0); this.casinoBounds = null; this.casinoOutside = V3(0, 100, 0); this.casinoZone = 6;
    this.enemies = [];
    this.phase = 'PreGame'; this.phaseTimer = 6; this.round = 0;
    this.toSpawn = 0; this.spawned = 0; this.killed = 0; this.totalKills = 0; this.bossRound = false; this.bossSpawned = false; this.boss = null;
    this.spawnTimer = 0; this.powerupsThisRound = 0; this.instaKill = 0; this.doublePoints = 0; this.fireSale = false; this.casinoNights = 0;
    this.flowTimer = 0; this.time = 0; this.zone = 0;
  }

  async build() {
    this.fx = new Fx(this, this.scene);
    this.env = new Environment(this.scene, this.fx.batches.fx);
    this.world = new World(this.scene, this);
    this.world.build();
    this.projectiles = new Projectiles(this, this.scene);
    this.hazards = new Hazards(this, this.scene);
    this.pickups = new Pickups(this, this.scene);
    this.vm = new ViewModel(this);
    this.player = new Player(this);
    this.vm.setWeapon(0, 0, false);
    this.unlockZone(0, true);
    this.player.pos.copy(this.playerSpawn).add(V3(0, 0, 0));
    // UE yaw 60 -> forward (cos60, sin60) in UE XY -> three (x, z)
    const fx = Math.cos(60 * Math.PI / 180), fz = Math.sin(60 * Math.PI / 180);
    this.player.yaw = Math.atan2(-fx, -fz);
    this.navRebuild(this.player.pos);
  }

  // ------------------------------------------------------------------ registration (called by World)
  registerInteractable(I) {
    this.interactables.push(I);
    if (I.type === 'Door') {
      this.NavBlockBox(I.navBox, 1);
      if (I.cost < 0) this.casinoDoors.push(I);
    }
  }
  isCasinoOpen() { return true; }
  priceMult() { let m = Math.min(2, Math.max(0.4, 1 - this.player.stat('CasinoDiscount'))); if (this.fireSale) m *= 0.5; return m * (1 + 0.04 * Math.max(0, this.round - 1)); }   // prices rise 4% a round
  banner(text, color, dur = 3, kind = '') { this.hud.banner(text, color, dur, kind); }
  shakeAt(at, radius) { const d = at.distanceTo(this.player.pos); this.player.addShake(Math.max(0, 1 - d / (radius * 4 + 600)) * Math.min(1.2, Math.max(0.3, radius / 250))); }

  // ------------------------------------------------------------------ nav grid (UE X,Y == three x,z)
  navInit(minX, minY, maxX, maxY, cell) {
    this.navCell = cell; this.navOX = minX; this.navOY = minY;
    this.navW = Math.ceil((maxX - minX) / cell); this.navH = Math.ceil((maxY - minY) / cell);
    this.navBlock = new Uint8Array(this.navW * this.navH);
    this.navDist = new Int32Array(this.navW * this.navH).fill(INF);
    this.navQueue = new Int32Array(this.navW * this.navH);
  }
  cellOf(x, z) { return [Math.floor((x - this.navOX) / this.navCell), Math.floor((z - this.navOY) / this.navCell)]; }
  cellCenter(cx, cy) { return [this.navOX + (cx + 0.5) * this.navCell, this.navOY + (cy + 0.5) * this.navCell]; }
  navValid(cx, cy) { return cx >= 0 && cy >= 0 && cx < this.navW && cy < this.navH; }
  navFree(cx, cy) { return this.navValid(cx, cy) && this.navBlock[cy * this.navW + cx] === 0; }
  _navBlock(minX, minY, minZ, maxX, maxY, maxZ, delta) {
    if (!this.navW) return;
    if (minZ > 150 || maxZ < 40) return;
    const pad = 40;
    const [ax, ay] = this.cellOf(minX - pad, minY - pad), [bx, by] = this.cellOf(maxX + pad, maxY + pad);
    for (let y = Math.max(0, ay); y <= Math.min(this.navH - 1, by); y++) for (let x = Math.max(0, ax); x <= Math.min(this.navW - 1, bx); x++) {
      const [cx, cy] = this.cellCenter(x, y);
      if (cx >= minX - pad && cx <= maxX + pad && cy >= minY - pad && cy <= maxY + pad) {
        const i = y * this.navW + x;
        this.navBlock[i] = Math.max(0, Math.min(255, this.navBlock[i] + delta));
      }
    }
  }
  NavBlockBox(b, d) { // UE-space {min: UVec, max: UVec}
    const mn = b.min, mx = b.max;
    this._navBlock(Math.min(mn.X, mx.X), Math.min(mn.Y, mx.Y), Math.min(mn.Z, mx.Z), Math.max(mn.X, mx.X), Math.max(mn.Y, mx.Y), Math.max(mn.Z, mx.Z), d);
  }
  navBlockBox3(b, d) { this._navBlock(b.min.x, b.min.z, b.min.y, b.max.x, b.max.z, b.max.y, d); }
  navRebuild(target, extra) {
    if (!this.navW) return;
    this.navTarget = target.clone();
    const W = this.navW, H = this.navH, D = this.navDist, B = this.navBlock, Q = this.navQueue;
    D.fill(INF);
    let qn = 0;
    const [tx, ty] = this.cellOf(target.x, target.z);
    for (let R = 0; R <= 10 && qn === 0; R++) {
      for (let y = ty - R; y <= ty + R; y++) for (let x = tx - R; x <= tx + R; x++) {
        if (Math.max(Math.abs(x - tx), Math.abs(y - ty)) !== R) continue;
        if (this.navFree(x, y)) { const i = y * W + x; D[i] = R; Q[qn++] = i; }
      }
    }
    if (extra) for (const p of extra) { const [ex, ey] = this.cellOf(p.x, p.z); if (this.navFree(ex, ey) && D[ey * W + ex] === INF) { D[ey * W + ex] = 0; Q[qn++] = ey * W + ex; } }
    const DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1];
    let head = 0;
    while (head < qn) {
      const i = Q[head++], x = i % W, y = (i / W) | 0, d = D[i];
      for (let k = 0; k < 8; k++) {
        const nx = x + DX[k], ny = y + DY[k];
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const ni = ny * W + nx;
        if (B[ni] !== 0 || D[ni] !== INF) continue;
        if (k >= 4 && (B[y * W + nx] !== 0 || B[ny * W + x] !== 0)) continue;
        D[ni] = d + 1; Q[qn++] = ni;
      }
    }
  }
  flowDirection(from, flee) {
    const direct = V3(this.navTarget.x - from.x, 0, this.navTarget.z - from.z);
    if (direct.lengthSq() > 0) direct.normalize().multiplyScalar(flee ? -1 : 1);
    const [cx, cy] = this.cellOf(from.x, from.z);
    if (!this.navValid(cx, cy)) return direct;
    const W = this.navW, D = this.navDist;
    const DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1];
    const best = (x, y) => {
      let bd = flee ? -1 : INF, out = null;
      const cur = D[y * W + x];
      for (let k = 0; k < 8; k++) {
        const nx = x + DX[k], ny = y + DY[k];
        if (!this.navFree(nx, ny)) continue;
        if (k >= 4 && (!this.navFree(nx, y) || !this.navFree(x, ny))) continue;
        const d = D[ny * W + nx];
        if (d === INF) continue;
        if ((!flee && d < bd && (d < cur || cur === INF)) || (flee && d > bd)) { bd = d; out = [nx, ny]; }
      }
      return out;
    };
    const here = D[cy * W + cx];
    if (!flee && here === 0) return direct;
    const n1 = best(cx, cy);
    if (!n1) return direct;
    const n2 = best(n1[0], n1[1]) || n1;
    const a = this.cellCenter(n1[0], n1[1]), b = this.cellCenter(n2[0], n2[1]);
    const dir = V3((a[0] + b[0]) * 0.5 - from.x, 0, (a[1] + b[1]) * 0.5 - from.z);
    return dir.lengthSq() > 0 ? dir.normalize() : direct;
  }
  inCasino(p) { const B = this.casinoBounds; return B && p.x >= B.minX && p.x <= B.maxX && p.z >= B.minZ && p.z <= B.maxZ; }
  findFreeLocationNear(c, minR, maxR) {
    for (let a = 0; a < 24; a++) {
      const ang = Math.random() * Math.PI * 2, r = frandRange(minR, maxR);
      const x = c.x + Math.cos(ang) * r, z = c.z + Math.sin(ang) * r;
      const [cx, cy] = this.cellOf(x, z);
      if (!this.navFree(cx, cy) || this.navDist[cy * this.navW + cx] === INF) continue;
      if (!this.isCasinoOpen() && this.inCasino({ x, z })) continue;
      const h = this.phys.raycast(V3(x, 300, z), V3(0, -1, 0), 500);
      if (h && h.point.y < 60) return h.point.clone();
    }
    return null;
  }
  zoneAt(p) {
    if (this.inCasino(p)) return this.casinoZone;
    for (let i = 0; i < this.zones.length; i++) {
      if (i === this.casinoZone) continue;
      const Z = this.zones[i];
      if (p.x >= Z.min.X && p.x <= Z.max.X && p.z >= Z.min.Y && p.z <= Z.max.Y) return i;
    }
    return -1;
  }

  // ray vs vertical capsule; returns entry distance or null
  rayEnemy(o, d, maxT, E, extra = 0) {
    const r = E.radius + extra, h = Math.max(0, E.half - E.radius);
    const c = E.pos;
    let best = null;
    const ox = o.x - c.x, oz = o.z - c.z;
    const a = d.x * d.x + d.z * d.z, b = 2 * (ox * d.x + oz * d.z), cc = ox * ox + oz * oz - r * r;
    if (a > 1e-8) {
      const disc = b * b - 4 * a * cc;
      if (disc >= 0) {
        const s = Math.sqrt(disc);
        let t = (-b - s) / (2 * a);
        if (cc < 0) t = 0;
        if (t >= 0 && t <= maxT) { const y = o.y + d.y * t; if (y >= c.y - h && y <= c.y + h) best = t; }
      }
    }
    for (const sy of [c.y - h, c.y + h]) {
      const px = o.x - c.x, py = o.y - sy, pz = o.z - c.z;
      const bb = px * d.x + py * d.y + pz * d.z, c2 = px * px + py * py + pz * pz - r * r;
      const disc = bb * bb - c2;
      if (disc < 0) continue;
      let t = -bb - Math.sqrt(disc);
      if (c2 < 0) t = 0;
      if (t >= 0 && t <= maxT && (best === null || t < best)) best = t;
    }
    return best;
  }

  // ------------------------------------------------------------------ the vault and the last boss
  vaultCenter() { return V3(VAULT.X, 0, VAULT.Y); }
  inVault(p) { return Math.hypot(p.x - VAULT.X, p.z - VAULT.Y) < VAULT.R + 400; }
  openVault(at) {
    const f = this.findFreeLocationNear(at, 0, 300) || at.clone(); f.y = Math.max(0, this.fx.groundY(f, 2000));
    this.final = { gate: f, active: false, done: false, beam: null, safeR: 0, t: 0 };
    for (const E of this.enemies) if (!E.dead && !E.isBoss) { E.lastHitExplosive = true; E.takeHit(1e9, E.pos, V3(0, 1, 0), false); }
    this.toSpawn = this.spawned;
    this.banner('THE VAULT IS OPEN', lin(1, 0.8, 0.2), 6); this.hud.toast('Step into the light to face the Last Dealer', '#ffd24d');
    this.audio.play('S_Jackpot', 1); this.player.addShake(2);
  }
  enterVault() {
    const P = this.player, C = this.vaultCenter();
    if (P.grappling) P.endGrapple(false);
    P.pos.set(C.x, 100, C.z - VAULT.R + 260); P.vel.set(0, 0, 0); P.pitch = 0; P.yaw = 0; if (P.forward().z < 0) P.yaw = Math.PI;   // face the middle of the room
    P.invuln = 2; P.refillAll(); P.health = P.maxHealth;
    this.hud.hurtWhite = 0.35; this.audio.play('S_Door', 1, 0.6);
    this.banner('THE VAULT', lin(1, 0.25, 0.15), 3);
  }
  startFinal() {
    const F = this.final; if (!F || F.active || F.done || this.net.role === 'client') return;
    F.active = true; F.gate = null; F.safeR = 0; F.beam = null;
    const C = this.vaultCenter();
    this.boss = this.spawnEnemy(0, V3(C.x, 300, C.z + 300), false, 5, 1, 1 + 0.5 * this.net.ghosts.size, 0, false);
    this.banner('THE LAST DEALER', lin(1, 0.8, 0.2), 5); this.hud.toast('The house always wins', '#ff5a4d');
    this.audio.play('S_BossRoar', 1, 0.7);
  }
  levelComplete() {
    const F = this.final; if (F) { F.active = false; F.done = true; F.beam = null; F.safeR = 0; }
    for (const E of this.enemies) if (!E.dead && !E.isBoss) { E.lastHitExplosive = true; E.takeHit(1e9, E.pos, V3(0, 1, 0), false); }
    this.hazards.list.forEach((H) => { H.life = Math.min(H.life, H.age + 0.1); });
    this.victory = true; this.levelDone = true; Meta.bump('wins'); Meta.save();
    this.audio.play('S_Jackpot', 1); this.player.addShake(2.5); this.hitstop = 0.4;
  }
  tickFinal(dt) {
    const F = this.final, P = this.player; if (!F) return;
    F.t += dt;
    if (F.gate) {
      // a column of gold light with sparks spiralling up it
      if (Math.random() < dt * 30) { const a = F.t * 3 + Math.random() * 6.28, r = 70 + Math.random() * 40; this.fx.flash(V3(F.gate.x + Math.cos(a) * r, F.gate.y + Math.random() * 700, F.gate.z + Math.sin(a) * r), lin(1, 0.8, 0.25), 50 + Math.random() * 50, 0.5, false); }
      if (Math.random() < dt * 6) this.fx.flash(V3(F.gate.x, F.gate.y + 60, F.gate.z), lin(1, 0.7, 0.2), 320, 0.4, true);
      if (!P.dead && Math.hypot(P.pos.x - F.gate.x, P.pos.z - F.gate.z) < 170 && Math.abs(P.pos.y - 95 - F.gate.y) < 300) { this.enterVault(); if (this.net.role !== 'client') this.startFinal(); }
      if (this.net.role === 'host' && this.net.alivePositions().some((p) => this.inVault(p))) this.startFinal();
    }
    if (!F.active) return;
    const C = this.vaultCenter(), inside = this.inVault(P.pos);
    // late arrivals (and anyone who dies and comes back) are pulled into the fight; nobody falls out of the room
    if (!P.dead && (!inside || P.pos.y < -250)) { this.enterVault(); }
    if (!inside || P.dead) return;
    // atmosphere: embers rising, chips raining, the room shaking harder as the boss weakens
    const B = this.boss, rage = B && !B.dead ? 1 - B.health / B.maxHealth : 0;
    if (Math.random() < dt * (10 + rage * 30)) { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * VAULT.R; this.fx.flash(V3(C.x + Math.cos(a) * r, 20 + Math.random() * 500, C.z + Math.sin(a) * r), lin(1, 0.35 + Math.random() * 0.3, 0.1), 14 + Math.random() * 22, 0.9, false); }
    if (Math.random() < dt * (1.5 + rage * 5)) { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * VAULT.R; this.fx.add({ pos: V3(C.x + Math.cos(a) * r, 800, C.z + Math.sin(a) * r), vel: V3(0, -300, 0), gravity: 900, life: 2.2, size0: 34, size1: 34, rot: Math.random() * 360, rotVel: 500, groundY: 2, bounce: 0.35, c0: [1, 1, 1, 1], fadeOut: 0.4, tex: 'FX_Coin', kind: 'sprite' }); }
    if (rage > 0.66 && Math.random() < dt * 0.7) P.addShake(0.25);
    // rotating beams: jump them or stay between them
    const bm = F.beam;
    if (bm) {
      bm.ang += bm.spd * dt; bm.t = (bm.t || 0) + dt;
      const armed = bm.t > 1.1, o = V3(bm.x, bm.y + 55, bm.z);
      for (let k = 0; k < bm.n; k++) {
        const a = bm.ang + k * Math.PI * 2 / bm.n, dx = Math.sin(a), dz = Math.cos(a);
        for (let r = 160; r < VAULT.R * 2; r += 150) if (Math.random() < dt * 60 * 0.5) this.fx.flash(V3(o.x + dx * r, o.y, o.z + dz * r), armed ? lin(1, 0.25, 0.1) : lin(1, 0.8, 0.3), armed ? 110 : 40, 0.1, false);
        if (!armed) continue;
        const px = P.pos.x - o.x, pz = P.pos.z - o.z, along = px * dx + pz * dz, side = Math.abs(px * dz - pz * dx);
        if (along > 60 && side < 55 && P.pos.y - 90 < o.y + 45) { F.beamHit = (F.beamHit || 0) - dt; if (F.beamHit <= 0) { F.beamHit = 0.5; P.receiveDamage(bm.dmg, null, false); P.addShake(0.6); } }
      }
    }
    // all in: a wall of fire closes on the centre
    if (F.safeR > 0) {
      for (let i = 0; i < 10; i++) if (Math.random() < dt * 60 * 0.6) { const a = Math.random() * 6.28, r = F.safeR + Math.random() * 60; this.fx.flash(V3(C.x + Math.cos(a) * r, 30 + Math.random() * 160, C.z + Math.sin(a) * r), lin(1, 0.4 + Math.random() * 0.3, 0.08), 90 + Math.random() * 80, 0.25, false); }
      if (Math.hypot(P.pos.x - C.x, P.pos.z - C.z) > F.safeR) { F.burn = (F.burn || 0) - dt; if (F.burn <= 0) { F.burn = 0.4; P.receiveDamage(14, null, false, 0, 0, true); } }
    }
  }

  // ------------------------------------------------------------------ rounds
  update(dt) {
    this.time += dt;
    const P = this.player;
    this.flowTimer -= dt;
    if (this.net.role === 'client') { this.instaKill = Math.max(0, this.instaKill - dt); this.doublePoints = Math.max(0, this.doublePoints - dt); return; }
    if (this.flowTimer <= 0) { this.flowTimer = 0.3; this.navRebuild(P.dead && this.net.alivePositions().length ? this.net.alivePositions()[0] : P.pos, this.net.alivePositions()); }
    this.instaKill = Math.max(0, this.instaKill - dt);
    this.doublePoints = Math.max(0, this.doublePoints - dt);
    if (this.final && (this.final.gate || this.final.active)) return;   // the rounds stop once the vault is open
    switch (this.phase) {
      case 'PreGame': this.phaseTimer -= dt; if (this.phaseTimer <= 0) this.startRound(); break;
      case 'Round': this.tickRound(dt); break;
      case 'Intermission':
        this.phaseTimer -= dt;
        if (this.phaseTimer <= 0) this.startRound();
        break;
      case 'Casino': this.phaseTimer -= dt; if (this.phaseTimer <= 0) { this.closeCasino(); this.startRound(); } break;
      default: break;
    }
  }
  aliveCount() { let n = 0; for (const E of this.enemies) if (!E.dead) n++; return n; }
  remaining() { if (this.net.role === 'client') return this.net.netRem; return Math.max(0, this.toSpawn - this.spawned) + this.aliveCount() + (this.bossRound && !this.bossSpawned ? 1 : 0); }
  tickRound(dt) {
    this.spawnTimer -= dt;
    const alive = this.aliveCount();
    if (this.spawned < this.toSpawn && alive < maxAlive(this.round) && this.spawnTimer <= 0) { this.spawnTimer = Math.max(0.3, 2.1 - this.round * 0.11) / 0.7; this.spawnOne(); }   // 30% slower trickle
    if (this.bossRound && !this.bossSpawned && (this.killed >= this.toSpawn / 4 || this.spawned >= this.toSpawn)) {
      const loc = this.pickSpawn(false);
      if (loc) {
        this.bossSpawned = true;
        const bi = (Math.floor(this.round / 5) - 1) % 5;   // the sixth boss only appears in the vault
        this.boss = this.spawnEnemy(0, loc.add(V3(0, 200, 0)), false, bi, 1, 1, 0, false);
        const B = DATA.bosses[bi];
        this.banner(`BOSS: ${B.name.toUpperCase()}`, lin(1, 0.25, 0.15), 4);
        this.audio.play('S_BossRoar', 1, 0.8);
      }
    }
    if (this.spawned >= this.toSpawn && alive === 0 && (!this.bossRound || this.bossSpawned)) this.endRound();
  }
  startRound() {
    this.round++;
    this.toSpawn = zombieCount(this.round);
    this.bossRound = this.round % 5 === 0;
    if (this.bossRound) this.toSpawn = Math.max(6, Math.floor(this.toSpawn * 6 / 10));
    if (this.net.role === 'host') { this.toSpawn = Math.round(this.toSpawn * (1 + 0.6 * this.net.ghosts.size)); if (this.player.dead) this.player.revive(); }
    this.spawned = 0; this.killed = 0; this.bossSpawned = false; this.boss = null; this.powerupsThisRound = 0; this.spawnTimer = 1.5;
    this.phase = 'Round';
    if (this.barricadeT === undefined) this.casinoInit();
    Meta.best('bestRound', this.round);
    this.banner(`ROUND ${this.round}`, lin(0.85, 0.08, 0.06), 3.5, 'round');
    this.hud.roundFlash = 1;
    this.player.onRoundStarted(this.round);
  }
  endRound() {
    this.phase = 'Intermission'; this.phaseTimer = 15;
    this.player.onRoundEnded(this.round);

    this.player.onCasinoOpened();
    if (this.round % 3 === 0) this.banner(`ROUND ${this.round} CLEAR`, lin(1, 0.75, 0.2), 4);
    else this.banner(`ROUND ${this.round} CLEAR`, [0.95, 0.95, 0.92], 3);
  }
  // The casino never closes. Its doors stand open and enemies can follow you in; the only protection is the
  // barricade (60s, then a 3 minute cooldown), thrown from the lever inside or with B.
  casinoInit() {
    for (const D of this.casinoDoors) { D.setOpen(true); this.NavBlockBox(D.navBox, -1); }
    this.env.setCasinoMood(true);
    this.barricadeT = 0; this.barricadeCd = 0; this.fireSaleT = 0;
  }
  openCasinoPath() {
    const plaza = 4;
    for (let step = 0; step < 2 && this.zones[plaza] && !this.zones[plaza].unlocked; step++) {
      let best = null, bestReach = false;
      for (const D of this.interactables) {
        if (D.type !== 'Door' || D.cost < 0 || D.open || !this.zones[D.zoneA] || !this.zones[D.zoneB]) continue;
        const a = this.zones[D.zoneA].unlocked, b = this.zones[D.zoneB].unlocked;
        if (a === b) continue;
        const far = a ? D.zoneB : D.zoneA, reach = far === plaza;
        if (!best || (reach && !bestReach) || (reach === bestReach && D.cost < best.cost)) { best = D; bestReach = reach; }
      }
      if (!best) break;
      this.openDoor(best);
      this.banner('PATH TO THE CASINO OPENED', lin(1, 0.8, 0.3), 4);
    }
  }
  setBarricade(on) {
    for (const D of this.casinoDoors) { D.setOpen(!on); this.NavBlockBox(D.navBox, on ? 1 : -1); }
    this.audio.play('S_Door', 0.9, on ? 0.8 : 1.4);
  }
  toggleBarricade() {
    if (this.net.active) { this.hud.toast('The barricade is single-player only', '#ff5a4d'); return; }
    if (this.barricadeT > 0) { this.barricadeT = 0; this.barricadeCd = 180; this.setBarricade(false); this.banner('BARRICADE DOWN', lin(1, 0.6, 0.2), 2.5); return; }
    if (this.barricadeCd > 0) { this.hud.toast(`Barricade ready in ${Math.ceil(this.barricadeCd)}s`, '#ff5a4d'); this.audio.play('S_Deny', 0.6); return; }
    if (!this.inCasino(this.player.pos)) { this.hud.toast('Barricade only works inside the casino', '#ff5a4d'); return; }
    this.barricadeT = 60; this.setBarricade(true); this.banner('BARRICADE UP  -  60s', lin(0.5, 0.9, 1), 3);
  }
  tickCasino(dt) {
    if (this.barricadeT > 0) { this.barricadeT -= dt; if (this.barricadeT <= 0) { this.barricadeT = 0; this.barricadeCd = 180; this.setBarricade(false); this.banner('BARRICADE DOWN', lin(1, 0.6, 0.2), 2.5); } }
    else if (this.barricadeCd > 0) this.barricadeCd = Math.max(0, this.barricadeCd - dt);
    if (this.fireSaleT > 0) { this.fireSaleT -= dt; this.fireSale = this.fireSaleT > 0; }
  }
  openCasino() {} closeCasino() {}
  ringBell() { this.toggleBarricade(); }
  playerDied() { if (this.net.active && !this.net.allDead()) { this.deathTime = this.time; this.coopDown = true; this.hud.toast('You are down. You respawn next round if a teammate survives.', '#ff9a4d'); return; } this.gameOver(); }
  gameOver() { if (this.phase === 'GameOver') return; this.coopDown = false; Meta.bump('runs'); Meta.save(); this.phase = 'GameOver'; this.deathTime = this.time; this.audio.play('S_Lose', 1, 0.7); }

  pickEnemyType() {
    let total = 0; const W = DATA.enemies.map((D) => { let w = this.round >= D.minRound ? D.weight : 0; if (D.ai === 'Walker') w = Math.max(3, w - this.round * 0.35); total += w; return w; });
    let r = Math.random() * total;
    for (let i = 0; i < W.length; i++) { r -= W[i]; if (r <= 0) return i; }
    return 0;
  }
  pickSpawn(fly) {
    const PL = this.player.pos;
    const c = [];
    this.spawnPoints.forEach((S, i) => {
      const Z = this.zones[S.zone];
      if (!Z || !Z.unlocked || !Z.spawns) return;
      const d = Math.hypot(S.pos.x - PL.x, S.pos.z - PL.z);
      if (d < 800) return;
      c.push([d, i]);
    });
    if (!c.length) { const f = this.findFreeLocationNear(PL, 1200, 2500); return f ? f.add(V3(0, fly ? 500 : 100, 0)) : null; }
    c.sort((a, b) => a[0] - b[0]);
    const pick = c[randInt(0, Math.min(c.length, 6) - 1)][1];
    const base = this.spawnPoints[pick].pos, out = base.clone().add(V3(frandRange(-120, 120), fly ? 500 : 100, frandRange(-120, 120)));
    const [cx, cy] = this.cellOf(out.x, out.z);
    if (!this.navFree(cx, cy) || this.phys.overlapsCapsule(V3(out.x, out.y + 20, out.z), 34, 80)) { out.x = base.x; out.z = base.z; }   // never nudge a spawn into a wall
    return out;
  }
  spawnOne() {
    const type = this.pickEnemyType();
    const fly = DATA.enemies[type].ai === 'Flyer';
    const loc = this.pickSpawn(fly);
    if (!loc) return;
    let elite = false;
    if (this.round >= 4 && DATA.enemies[type].ai !== 'Gilded') elite = Math.random() < Math.min(0.03 + 0.01 * (this.round - 4), 0.25);
    if (this.spawnEnemy(type, loc, elite, -1, 1, 1, 0, false)) this.spawned++;
  }
  spawnEnemy(def, loc, elite, boss, scaleMul, healthMul, affixes, splitChild) {
    const E = new Enemy(this, def, loc, Math.max(1, this.round), elite, boss, scaleMul, healthMul, affixes, splitChild);
    this.enemies.push(E);
    return E;
  }
  enemyKilled(E, headshot) {
    this.killed++; this.totalKills++;
    this.net.killed(E, headshot);
    if (this.net.role === 'host' && E.netKiller && !E.isBoss) return;   // a teammate's kill: their client pays them
    const P = this.player, loc = E.pos.clone();
    P.onEnemyKilled(E, headshot);
    const luckFind = 1 + P.stat('LuckFind');
    let clover = 0.025 * luckFind;
    if (E.elite) clover = 0.25 * luckFind;
    if (E.has('Gilded') || E.ai === 'Gilded') { clover = 1; this.pickups.spawn('MoneyBag', loc.clone().add(V3(60, 0, 0)), 300 + this.round * 40); }
    if (E.isBoss) {
      for (let i = 0; i < 3; i++) this.pickups.spawn('Clover', loc.clone().add(V3(frandRange(-150, 150), 0, frandRange(-150, 150))));
      this.pickups.spawn('MaxAmmo', loc.clone().add(V3(0, 0, 150)));
      this.pickups.spawn('MoneyBag', loc.clone().add(V3(0, 0, -150)), 1500 + this.round * 100);
      Meta.bump('bosses');
      if (E.boss.name === 'The Gravedigger' && !this.won) { this.won = true; this.openVault(loc); }
      if (E.boss.final) this.levelComplete();
      this.banner(`${E.boss.name.toUpperCase()} DEFEATED`, lin(1, 0.8, 0.2), 4);
    } else if (Math.random() < clover) this.pickups.spawn('Clover', loc);
    if (!E.isBoss && Math.random() < 0.07) this.pickups.spawn('Ammo', loc.clone().add(V3(40, 0, 0)));   // a magazine now and then
    if (!E.isBoss && this.powerupsThisRound < 4 && Math.random() < 0.022) {
      this.powerupsThisRound++;
      this.pickups.spawn(['MaxAmmo', 'InstaKill', 'DoublePoints', 'Nuke', 'FireSale'][randInt(0, 4)], loc);
    }
  }
  enemyEscaped(E) {
    this.banner('Gilded Ghoul escaped', lin(0.9, 0.75, 0.3), 2.5);
    this.fx.flash(E.pos, lin(1, 0.85, 0.3), 80, 0.3, true);
    E.dead = true; E.remove = true; E.puppet.visible = false;
  }
  activatePowerup(type) {
    const P = this.player;
    switch (type) {
      case 'MaxAmmo': P.refillAll(); this.banner('MAX AMMO', lin(0.3, 0.7, 1), 2.5); break;
      case 'InstaKill': this.instaKill = 30; this.banner('INSTA-KILL', lin(1, 0.2, 0.2), 2.5); break;
      case 'DoublePoints': this.doublePoints = 30; this.banner('DOUBLE MONEY', lin(1, 0.85, 0.2), 2.5); break;
      case 'Nuke': {
        this.banner('NUKE', lin(1, 0.5, 0.1), 2.5);
        P.addShake(1.5);
        const list = this.enemies.filter((E) => !E.dead && !E.isBoss);
        for (const E of list) { this.fx.explosion(E.pos, 120, lin(1, 0.6, 0.2)); E.lastHitExplosive = true; E.kill(P, false); }
        this.audio.play('S_Explosion', 1, 0.7);
        P.addMoney(400, false);
        break;
      }
      case 'FireSale': this.fireSale = true; this.fireSaleT = 60; this.banner('CASINO HALF PRICE FOR 60s', lin(0.9, 0.3, 1), 3.5); break;
      default: break;
    }
  }
  openDoor(D) {
    if (!D || D.open) return;
    D.setOpen(true);
    this.net.doorOpened(D);
    this.NavBlockBox(D.navBox, -1);
    const c = D.box3.getCenter(V3(0, 0, 0));
    this.fx.dust(c.clone().setY(c.y - 150), lin(0.3, 0.25, 0.2), 200);
    for (let i = 0; i < 14; i++) {
      const v = V3(frandRange(-1, 1), frandRange(0.5, 1.4), frandRange(-1, 1)).multiplyScalar(frandRange(300, 700));
      this.fx.add({ pos: c.clone().add(V3(frandRange(-80, 80), frandRange(-150, 150), frandRange(-80, 80))), vel: v, gravity: 1800, life: frandRange(1.2, 2), size0: frandRange(30, 60), size1: 30,
        rot: Math.random() * 360, rotVel: frandRange(-600, 600), groundY: this.fx.groundY(c, 600), bounce: 0.3, c0: [0.55, 0.36, 0.22, 1], fadeOut: 0.3, tex: 'FX_Gib_Bone', kind: 'sprite' });
    }
    this.unlockZone(D.zoneA); this.unlockZone(D.zoneB);
    this.navRebuild(this.navTarget || this.player.pos);
  }
  unlockZone(z, silent = false) {
    const Z = this.zones[z];
    if (!Z || Z.unlocked) return;
    Z.unlocked = true;
    if (z !== 0 && !silent) this.banner(`${Z.name.toUpperCase()} OPENED`, [0.95, 0.9, 0.8], 2.5);
  }

  // ------------------------------------------------------------------ frame
  step(dt, input) {
    const P = this.player;
    if (this.hitstop > 0) { this.hitstop -= dt; dt *= 0.15; }
    this.audio.music(this.phase === 'GameOver' ? 'off' : this.final && this.final.active ? 'boss' : this.phase === 'Round' ? (this.boss && !this.boss.dead ? 'boss' : 'fight') : this.zone === this.casinoZone ? 'casino' : 'calm');
    this.tickCasino(dt);
    if (this.phase !== 'GameOver') this.update(dt);
    for (const ev of Meta.popEvents()) {
      if (ev.type === 'cos') { this.hud.toast(`New cosmetic: ${ev.name}`, '#ffd24d'); } else if (ev.type === 'ach') { this.banner(`ACHIEVEMENT: ${ev.name.toUpperCase()}`, lin(1, 0.8, 0.2), 4); if (ev.reward) this.hud.toast(`Unlocked: ${ev.reward}`, '#ffd24d'); } else { this.hud.toast(`${ev.name} level ${ev.level}: ${ev.trait}`, '#7fd3ff'); if (this.player.W.name === ev.name) this.vm.setWeapon(this.player.slot.def, this.player.slot.tier, false); }
    }
    this.metaSave = (this.metaSave || 0) + dt; if (this.metaSave > 10) { this.metaSave = 0; Meta.save(); }
    if (this.phase === 'GameOver') this.time += dt; // keep the clock running so the death card fades in and accepts a restart
    P.update(dt, input);
    for (const E of this.enemies) E.update(dt);
    this.tickFinal(dt);
    this.net.tick(dt);
    if (this.net.role !== 'client') { this.separate(dt); this.unstick(dt); }
    this.enemies = this.enemies.filter((E) => !E.remove);
    this.projectiles.update(dt);
    this.hazards.update(dt);
    this.pickups.update(dt);
    for (const I of this.interactables) I.update(dt);
    this.fx.update(dt);
    // zone atmosphere
    const z = this.zoneAt(P.pos);
    if (z >= 0) this.zone = z;
    this.env.update(dt, this.camera.position, this.inVault(P.pos) ? 7 : this.zone);
    // audio listener + ambience
    const fwd = new THREE.Vector3(); this.camera.getWorldDirection(fwd);
    this.audio.setListener(this.camera.position, fwd, V3(0, 1, 0));
    this.audio.loop('S_AmbWind', this.zone === this.casinoZone ? 0.05 : 0.22);
    this.audio.loop('S_AmbCasino', this.zone === this.casinoZone ? (this.isCasinoOpen() ? 0.55 : 0.2) : this.isCasinoOpen() ? 0.06 : 0);
  }
  // Enemies get shoved by each other, by knockback and by closing doors. Anything that ends up inside a blocked
  // nav cell is walked back out to the nearest open one; anything that makes no progress for 5s is respawned.
  unstick(dt) {
    for (const E of this.enemies) {
      if (E.dead || E.burrowed || E.emerging || E.ai === 'Flyer' || E.isBoss) continue;
      const [cx, cy] = this.cellOf(E.pos.x, E.pos.z);
      E.wallT = (E.wallT || 0) - dt;
      if (E.wallT <= 0) { E.wallT = 0.3; E.inWall = this.phys.overlapsCapsule(V3(E.pos.x, E.pos.y + 16, E.pos.z), E.radius * 0.6, Math.max(E.radius * 0.6, E.half - 18)) ? (E.inWall || 0) + 1 : 0; }
      if (E.inWall >= 2) {   // wedged in geometry for more than half a second: put it back on the nearest open ground
        const f = this.findFreeLocationNear(E.pos, 60, 500);
        if (f) { const h = this.phys.raycastDown(V3(f.x, E.pos.y + 150, f.z), 900, true); E.pos.set(f.x, (h ? h.point.y : f.y) + E.half + 1, f.z); E.vel.set(0, 0, 0); }
        E.inWall = 0;
      }
      if (!this.navFree(cx, cy)) {
        let best = null, bd = 1e9;
        for (let r = 1; r <= 4 && !best; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !this.navFree(cx + dx, cy + dy)) continue;
          const [x, z] = this.cellCenter(cx + dx, cy + dy), d = (x - E.pos.x) ** 2 + (z - E.pos.z) ** 2;
          if (d < bd) { bd = d; best = [x, z]; }
        }
        if (best) { const k = Math.min(1, dt * 8); E.pos.x += (best[0] - E.pos.x) * k; E.pos.z += (best[1] - E.pos.z) * k; }
      }
      E.stuckT = (E.stuckT || 0) + dt;
      if (!E.stuckAt) E.stuckAt = E.pos.clone();
      if (E.pos.distanceTo(E.stuckAt) > 90 || E.pos.distanceTo(this.player.pos) < 450 || E.sinceHit < 2) { E.stuckT = 0; E.stuckAt.copy(E.pos); }
      else if (E.stuckT > 5 && this.barricadeT <= 0) {
        const sp = this.pickSpawn(false);
        if (sp) { E.pos.copy(sp); E.vel.set(0, 0, 0); E.emerge = 1; }
        E.stuckT = 0; E.stuckAt.copy(E.pos);
      }
    }
  }
  separate(dt) {
    const L = this.enemies.filter((E) => !E.dead && !E.burrowed);
    this.separatePairs(L, dt);
    // apply each enemy's total shove only if it does not end up inside level geometry
    const probe = V3(0, 0, 0);
    for (const E of L) {
      if (!E.sepX && !E.sepZ) continue;
      probe.set(E.pos.x + E.sepX, E.pos.y + 14, E.pos.z + E.sepZ);
      if (E.ai === 'Flyer' || !this.phys.overlapsCapsule(probe, E.radius * 0.85, Math.max(E.radius, E.half - 14))) { E.pos.x += E.sepX; E.pos.z += E.sepZ; }
      E.sepX = 0; E.sepZ = 0;
    }
  }
  separatePairs(L, dt) {
    for (let i = 0; i < L.length; i++) {
      const A = L[i];
      for (let j = i + 1; j < L.length; j++) {
        const B = L[j];
        const dx = B.pos.x - A.pos.x, dz = B.pos.z - A.pos.z, rr = (A.radius + B.radius) * 0.9;
        if (Math.abs(B.pos.y - A.pos.y) > A.half + B.half) continue;
        const d2 = dx * dx + dz * dz;
        if (d2 >= rr * rr || d2 < 1e-4) continue;
        const d = Math.sqrt(d2), push = (rr - d) * 0.5 * Math.min(1, dt * 12), nx = dx / d, nz = dz / d;
        const wa = A.isBoss ? 0.1 : B.isBoss ? 1.9 : 1, wb = 2 - wa;
        A.sepX = (A.sepX || 0) - nx * push * wa; A.sepZ = (A.sepZ || 0) - nz * push * wa; B.sepX = (B.sepX || 0) + nx * push * wb; B.sepZ = (B.sepZ || 0) + nz * push * wb;
      }
      // player vs enemy: enemies can't stand inside you
      const P = this.player;
      if (P.dead) continue;
      const dx = P.pos.x - A.pos.x, dz = P.pos.z - A.pos.z, rr = 38 + A.radius;
      if (Math.abs(P.pos.y - A.pos.y) > 90 + A.half - 10) continue;
      const d2 = dx * dx + dz * dz;
      if (d2 >= rr * rr || d2 < 1e-4) continue;
      const d = Math.sqrt(d2), pen = rr - d, nx = dx / d, nz = dz / d;
      A.sepX = (A.sepX || 0) - nx * pen * 0.7; A.sepZ = (A.sepZ || 0) - nz * pen * 0.7;
      if (P.dashT <= 0) { P.pos.x += nx * pen * 0.3; P.pos.z += nz * pen * 0.3; }
    }
  }

  render() {
    const R = this.renderer, cam = this.camera, P = this.player;
    const w = R.domElement.width, h = R.domElement.height;
    const aspect = w / Math.max(1, h);
    const hf = P.fov * Math.PI / 180;
    cam.fov = 2 * Math.atan(Math.tan(hf / 2) / aspect) * 180 / Math.PI;
    cam.aspect = aspect;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    updateCamBasis(cam);
    // dynamic sprite batches
    const B = this.fx.batches;
    for (const b of Object.values(B)) b.begin();
    this.env.drawSky(B.fx, cam.position);
    this.fx.draw();
    for (const E of this.enemies) E.draw(B);
    this.projectiles.draw(B.add);
    this.pickups.draw(B.sprite, B.add);
    this.drawCable(B.add);
    this.fx.end();
    R.autoClear = false;
    R.setClearColor(UNI.fogColor.value, 1);
    R.clear();
    R.render(this.scene, cam);
    // view model overlay
    const vm = this.vm;
    const vhf = 80 * Math.PI / 180;
    vm.camera.fov = 2 * Math.atan(Math.tan(vhf / 2) / aspect) * 180 / Math.PI;
    vm.camera.aspect = aspect;
    vm.camera.updateProjectionMatrix();
    const q = cam.getWorldQuaternion(new THREE.Quaternion()).invert();
    vmSun.value.copy(UNI.sunDir.value).applyQuaternion(q);
    if (!vm.hidden) { R.clearDepth(); R.render(vm.scene, vm.camera); }
  }
  drawCable(add) {
    const P = this.player;
    if (!P.grappling) return;
    const a = this.vm.muzzleWorld(), b = P.grapplePoint;
    const d = b.clone().sub(a), len = d.length();
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const axis = d.normalize();
    const side = new THREE.Vector3().crossVectors(axis, Cam.pos.clone().sub(mid).normalize()).normalize();
    add.pushBasis(sprite('FX_Spark'), mid, axis, side, len, 6, 1, 0.85, 0.55, 1, 0, 0, 1.5);
  }
}
