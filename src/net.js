// Co-op over the artifact `room` capability. One player hosts and runs the whole simulation (rounds, spawns, enemy AI);
// everyone else mirrors the host's enemies and sends their hits back. The lobby room carries the server list as presence.
// Everything heard here is untrusted: numbers are coerced and clamped before use.
import { difficulty, setDifficulty, mutators, setMutators } from './data.js';
import * as THREE from 'three';
import { Enemy } from './enemies.js';
import { Meta } from './meta.js';
import { PeerLobby } from './peernet.js';
import { buildCharacter, animateCharacter } from './character.js';
import { parseLook } from './cosmetics.js';
import { gunSound } from './gunsound.js';

const num = (v, lo = -1e6, hi = 1e6) => { v = +v; return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : 0; };
const cleanName = (s) => String(s || 'Player').replace(/[^\w .\-']/g, '').slice(0, 16) || 'Player';

class Ghost {
  constructor(net, peer) {
    this.net = net; this.peer = peer; this.pos = new THREE.Vector3(0, -99999, 0); this.to = new THREE.Vector3(); this.vel = new THREE.Vector3();
    this.forward = new THREE.Vector3(0, 0, 1); this.yaw = 0; this.dead = true; this.hp = 1; this.name = 'Player'; this.fresh = false; this.group = null; this.skin = '';
  }
  receiveDamage(amount, src, melee, slow = 0, slowT = 0) { if (this.net.role === 'host' && !this.dead) this.net.emit('d', { to: this.peer, a: Math.round(amount), m: melee ? 1 : 0, s: slow, t: slowT }); }
  applyKnockback() {}
  build(scene, lookStr) {
    if (this.group) scene.remove(this.group);
    const g = new THREE.Group(), ch = buildCharacter(parseLook(lookStr)); g.add(ch); this.char = ch;
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
    x.font = '700 40px "Barlow Condensed", sans-serif'; x.textAlign = 'center'; x.fillStyle = 'rgba(20,12,18,0.7)'; x.fillRect(0, 8, 256, 48); x.fillStyle = '#ffcd5a'; x.fillText(this.name, 128, 46);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, fog: false })); sp.scale.set(150, 38, 1); sp.position.set(0, 225, 0); sp.renderOrder = 999; g.add(sp);
    scene.add(g); this.group = g; this.skin = lookStr; this.builtName = this.name;
  }
}

export const Net = {
  lobby: null, room: null, role: 'solo', game: null, ghosts: new Map(), me: '', name: 'Player', code: '', hostPeer: '', offs: [], tp: 0, te: 0, ts: 0, tl: 0, seq: 0,
  hits: new Map(), netRem: 0, lastHost: 0, onChange: null, snap: null,
  get active() { return this.role !== 'solo'; },
  async init() {
    // inside a Claude artifact the page gets the `room` capability; anywhere else (the GitHub Pages build) players connect
    // straight to each other with no account
    try { if (window.claude && window.claude.use) this.lobby = await window.claude.use('room'); } catch (e) { this.lobby = null; }
    if (!this.lobby && !(window.claude && window.claude.use) && (window.RTCPeerConnection || window.__PeerCtor)) { this.lobby = PeerLobby; this.direct = true; return true; }
    if (this.lobby) this.lobby.onPeers(() => { const m = this.lobby.peers().find((p) => p.isMe && p.sameTab); if (m) this.me = m.peer; if (this.onChange) this.onChange(); }, () => {});
    return !!this.lobby;
  },
  servers() {
    if (!this.lobby) return [];
    return this.lobby.peers().filter((p) => !p.isMe && p.presence && p.presence.host && /^[a-z0-9][a-z0-9_.-]{0,47}$/.test(String(p.presence.code || '')))
      .map((p) => ({ peer: p.peer, code: String(p.presence.code), name: cleanName(p.presence.name), n: num(p.presence.n, 1, 16), round: num(p.presence.round, 0, 999) }));
  },
  async host(name) {
    const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let c = ''; for (let i = 0; i < 5; i++) c += A[Math.random() * A.length | 0];
    this.name = cleanName(name); this.code = c;
    this.room = await this.lobby.join('spin-' + c.toLowerCase(), true); if (this.room.me) this.me = this.room.me;
    this.role = 'host'; this.hostPeer = this.me; this.wire();
    this.started = false; await this.room.presence({ isHost: 1, name: this.name, look: Meta.lookStr(), started: 0, map: Meta.map() });
  },
  // join by lobby code: enter the room, then wait for whoever is hosting it to show up in presence
  async join(code, name) {
    code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    if (code.length < 4) throw new Error('code');
    const R = await this.lobby.join('spin-' + code.toLowerCase(), false); if (R.me) this.me = R.me;
    let host = null;
    for (const t0 = performance.now(); !host && performance.now() - t0 < 4000;) { host = R.peers().find((p) => !p.isMe && p.presence && p.presence.isHost); if (!host) await new Promise((r) => setTimeout(r, 100)); }
    if (!host) { R.leave().catch(() => {}); throw new Error('nogame'); }
    this.name = cleanName(name); this.code = code; this.hostPeer = host.peer; this.room = R; this.role = 'client'; this.lastHost = performance.now(); this.wire(); this.started = false;
    R.presence({ name: this.name, look: Meta.lookStr() }).catch(() => {});
  },
  leave() {
    for (const o of this.offs) try { o(); } catch (e) { /* gone */ }
    this.offs = [];
    if (this.room) this.room.leave().catch(() => {});
    for (const G of this.ghosts.values()) if (G.group && this.game) this.game.scene.remove(G.group);
    this.ghosts.clear(); this.room = null; this.role = 'solo'; this.hits.clear();
  },
  emit(topic, data) { if (this.room) this.room.emit(topic, data).catch(() => {}); },
  attach(game) { this.rejoining = null; this.game = game; game.net = this; this.chests = []; for (const G of this.ghosts.values()) G.group = null; },
  wire() {
    const R = this.room, on = (t, f) => this.offs.push(R.on(t, (m) => { if (m.isMe && m.sameTab) return; try { f(m.data || {}, m); } catch (e) { /* bad packet */ } }, () => {}));
    this.offs.push(R.onPeers(() => this.syncPeers(), () => {}));
    if (this.role === 'host') {
      on('h', (d, m) => { for (const h of (Array.isArray(d.l) ? d.l.slice(0, 80) : [])) this.hostHit(h, m.peer); });
      on('fx', (d, m) => this.hostFx(d, m.peer));
      on('pj', (d) => { if (Array.isArray(d) && d[14] === 1) this.onProjectile(d); });
      on('bar', (d, m) => { const G = this.ghosts.get(m.peer); if (G && G.fresh && !G.dead && this.game) this.game.toggleBarricade(G.pos); });
    } else {
      const fromHost = (f) => (d, m) => { if (m.peer === this.hostPeer) { this.lastHost = performance.now(); f(d, m); } };
      on('e', fromHost((d) => this.onEnemies(d)));
      on('s', fromHost((d) => this.onState(d)));
      on('pj', (d, m) => { if (Array.isArray(d) && d[14] === 1) this.onProjectile(d); else fromHost((x) => this.onProjectile(x))(d, m); });
      on('hz', fromHost((d) => this.onHazard(d)));
      on('k', fromHost((d) => this.onKill(d)));
      on('d', fromHost((d) => { if (d.to === this.me && this.game) this.game.player.receiveDamage(num(d.a, 0, 500), null, !!d.m, num(d.s, 0, 1), num(d.t, 0, 5)); }));
    }
    on('door', (d, m) => { if (d && Array.isArray(d.t)) { if (this.game && this.game.mech) this.game.mech.trapRemote(num(d.t[0], 0, 20) | 0); } else if (d && Array.isArray(d.a)) { if (this.game && this.game.audio.radio) this.game.audio.radio.net(d.a, !!m && m.peer === this.hostPeer); } else if (d && d.r) { if (this.role === 'host' && this.game && this.game.audio.radio) this.game.audio.radio.command(d.r === 1); } else if (Array.isArray(d.q)) { if (this.game) this.game.quest.apply(d.q.slice(0, 4).map((v, k) => (k ? num(v, 0, 999) : String(v).slice(0, 2)))); } else if (Array.isArray(d.m)) { if (this.game) this.game.mech.net(d.m); } else if (d && d.g != null) { if (this.role === 'host' && this.game && this.game.descent) this.game.descent.ready(m && m.peer || 'guest'); } else this.openDoorIdx(num(d.i, 0, 999)); });
  },
  // Chests that turn up during a run: the host places them and lists them in its state message, and every guest puts
  // one in the same spot (each player opens their own). The list is sent whole each time, so a lost message costs nothing.
  chestDropped(C, tier, zi) { if (this.role === 'host' && C.at) (this.chests = this.chests || []).push([Math.round(C.at[0]), Math.round(C.at[1]), Math.round(C.at[2]), tier, zi]); },
  onChest(r) {
    const g = this.game; if (!g || !g.spawnChestAt || !Array.isArray(r)) return;
    const d = { x: r[0], y: r[1], w: r[2], t: r[3], z: r[4] };
    const t = Math.max(0, Math.min(3, num(d.t, 0, 3) | 0)), x = num(d.x, -40000, 40000), y = num(d.y, -40000, 40000);
    if (g.interactables.some((I) => I.type === 'Chest' && Math.hypot(I.pos.x - x, I.pos.z - y) < 60)) return;   // already have it
    if ((g.goneChests || []).some((c) => Math.hypot(c[0] - x, c[1] - y) < 60)) return;                           // had it, opened it, and it is gone
    const C = g.spawnChestAt(x, y, num(d.w, -360, 360), t); if (!C) return;
    const Z = g.zones[num(d.z, 0, 99) | 0];
    g.player.toast(`A ${['wooden', 'iron-bound', 'gilt', 'reliquary'][t]} chest has turned up${Z ? ' in ' + Z.name : ''}`, ['#c9a46a', '#aab4c4', '#ffcd5a', '#c58cff'][t]); g.audio.play('S_Door', 0.6, 1.5);
  },
  syncPeers() {
    if (!this.room) return;
    const here = new Set();
    for (const p of this.room.peers()) {
      if (p.isMe) continue;
      here.add(p.peer);
      let G = this.ghosts.get(p.peer); if (!G) { G = new Ghost(this, p.peer); this.ghosts.set(p.peer, G); if (this.game) this.game.hud.toast('A player joined', '#7fd3ff'); }
      const s = p.presence || {};
      if (s.x === undefined) continue;
      G.to.set(num(s.x), num(s.y), num(s.z)); if (!G.fresh) { G.pos.copy(G.to); G.fresh = true; }
      G.down = !!s.dn; G.bleed = num(s.bl, 0, 60); G.rp = num(s.rp, 0, 1); G.rv = typeof s.rv === 'string' ? s.rv.slice(0, 80) : '';
      G.pitch = num(s.pt, -2, 2); G.wdef = num(s.w, -1, 500) | 0;
      { const sh = num(s.sh, 0, 100000) | 0; if (G.fresh && G.shot !== undefined && sh !== G.shot && !s.dead) G.queue = Math.min(10, (G.queue || 0) + Math.min(10, (sh - G.shot + 100000) % 100000)); G.shot = sh; }
      if (Array.isArray(s.pg) && s.pg.length >= 4) { const q = num(s.pg[3], 0, 1e6) | 0; if (G.pingSeq !== undefined && q !== G.pingSeq && this.game) this.game.showPing(new THREE.Vector3(num(s.pg[0], -1e5, 1e5), num(s.pg[1], -1e5, 1e5), num(s.pg[2], -1e5, 1e5)), cleanName(s.name), num(s.pg[4], 0, 3) | 0); G.pingSeq = q; } else if (G.pingSeq === undefined) G.pingSeq = 0;
      G.kills = num(s.kl, 0, 1e7) | 0; G.dmg = num(s.dm, 0, 1e12); G.yaw = num(s.yaw, -100, 100); G.hp = num(s.hp, 0, 1); G.dead = !!s.dead; G.name = cleanName(s.name); G.wantSkin = String(s.look || '').slice(0, 240);
    }
    for (const [peer, G] of this.ghosts) if (!here.has(peer)) {
      if (G.group && this.game) this.game.scene.remove(G.group);
      this.ghosts.delete(peer);
      if (this.game) this.game.hud.toast(`${G.name} left`, '#ff9a4d');
      if (this.role === 'client' && peer === this.hostPeer) this.hostGone();
    }
  },
  hostGone() {
    const g = this.game, code = this.code, name = this.name; this.leave();
    if (g && code && !this.rejoining) { this.rejoining = { code, name, game: g, until: performance.now() + 25000, next: performance.now() + 1500, busy: false }; g.banner('HOST LOST  -  TRYING TO RECONNECT', [1, 0.6, 0.2], 5); }
    else if (!this.rejoining) this.goSolo(g);
  },
  // nearest living player to an enemy (host only); falls back to the local player
  targetOf(E) {
    const P = this.game.player;
    { const L = P.lure; if (L && L.until > this.game.time && E.pos.distanceTo(L.pos) < L.r) return L.target; }   // Decoy and Smoke Step
    if (this.role !== 'host' || !this.ghosts.size) return P;
    let best = P, bd = P.dead ? Infinity : E.pos.distanceToSquared(P.pos);
    for (const G of this.ghosts.values()) { if (G.dead || !G.fresh) continue; const d = E.pos.distanceToSquared(G.pos); if (d < bd) { bd = d; best = G; } }
    return best;
  },
  alivePositions() { const out = []; for (const G of this.ghosts.values()) if (!G.dead && G.fresh) out.push(G.pos); return out; },
  allDead() { if (!this.game.player.dead) return false; for (const G of this.ghosts.values()) if (!G.dead) return false; return true; },

  // ---------------------------------------------------------------- per-frame
  tick(dt) {
    if (this.rejoining) { this.rejoinTick(); return; }
    const g = this.game; if (!g || !this.room) return;
    if (!this.started) this.lastHost = performance.now();
    const P = g.player;
    for (const G of this.ghosts.values()) {
      if (!G.fresh) continue;
      if (!G.group || G.skin !== G.wantSkin || G.builtName !== G.name) G.build(g.scene, G.wantSkin);
      const prev = G.pos.clone(); G.pos.lerp(G.to, Math.min(1, dt * 12)); G.vel.copy(G.pos).sub(prev).divideScalar(Math.max(dt, 1e-3));
      G.forward.set(Math.sin(G.yaw), 0, Math.cos(G.yaw));
      G.group.visible = !G.dead || G.down; G.group.position.set(G.pos.x, G.pos.y - (G.down ? 70 : 95), G.pos.z); G.group.rotation.y = G.yaw + Math.PI;
      G.char.rotation.x += ((G.down ? -Math.PI / 2 : 0) - G.char.rotation.x) * Math.min(1, dt * 8);   // a downed teammate lies where they fell
      if (G.down) { G.pulse = (G.pulse || 0) - dt; if (G.pulse <= 0) { G.pulse = 1.1; g.fx.ring(new THREE.Vector3(G.pos.x, G.pos.y - 88, G.pos.z), 150, [1, 0.3, 0.25], 0.9); } }
      if (G.queue > 0) { G.shotT = (G.shotT || 0) - dt; if (G.shotT <= 0) { G.shotT = Math.min(0.09, 0.1 / G.queue); G.queue--; this.ghostShot(G); } }
      G.animT = (G.animT || 0) + dt; G.spd = (G.spd || 0) + (Math.hypot(G.vel.x, G.vel.z) - (G.spd || 0)) * Math.min(1, dt * 8); animateCharacter(G.char, G.animT, G.spd);
    }
    // getting a teammate up: stand by them and hold E
    this.reviveTarget = null; this.rvPeer = '';
    if (!P.dead) { let bd = 240; for (const G of this.ghosts.values()) { if (!G.down || !G.fresh) continue; const d = G.pos.distanceTo(P.pos); if (d < bd) { bd = d; this.reviveTarget = G; } } if (this.reviveTarget && P.input && P.input.useHeld && !P.inMenu()) this.rvPeer = this.reviveTarget.peer; }
    if (P.downed) { let by = null; for (const G of this.ghosts.values()) if (!G.dead && G.fresh && G.rv === this.me && G.pos.distanceTo(P.pos) < 300) by = G; P.tickDowned(dt, !!by, by ? by.name : ''); }
    if (P.input && P.input.ping && !P.dead && !P.inMenu()) g.ping();
    this.tp -= dt;
    if (this.tp <= 0) {
      this.tp = 0.1;
      this.started = true;
      this.room.presence({ isHost: this.role === 'host' ? 1 : null, started: 1, x: Math.round(P.pos.x), y: Math.round(P.pos.y), z: Math.round(P.pos.z), yaw: Math.round(P.yaw * 100) / 100, hp: Math.round(Math.max(0, P.health / Math.max(1, P.maxHealth)) * 100) / 100, dead: P.dead ? 1 : 0, dn: P.downed ? 1 : null, bl: P.downed ? Math.round(P.bleed) : null, rp: P.downed ? Math.round((P.reviveP || 0) * 100) / 100 : null, rv: this.rvPeer || null, sh: P.shotSeq || 0, pt: Math.round(P.pitch * 100) / 100, w: P.wield ? -1 : P.slot.def, pg: g.myPing || null, name: this.name, look: Meta.lookStr(), kl: P.kills | 0, dm: Math.round(Object.values(P.runDmg || {}).reduce((a, b) => a + b, 0)) }).catch(() => {});
      if (this.role === 'client' && this.hits.size) { this.emit('h', { l: [...this.hits.entries()].slice(0, 80).map(([id, h]) => [id, Math.round(h.a), h.hs, Math.round(h.x * 100) / 100, Math.round(h.z * 100) / 100]) }); this.hits.clear(); }
    }
    if (this.role === 'host') {
      this.te -= dt; this.ts -= dt; this.tl -= dt;
      if (this.te <= 0) { this.te = 0.2; this.sendEnemies(); }
      if (this.ts <= 0) {
        this.ts = 0.5;
        const doors = []; g.interactables.forEach((I, i) => { if (I.type === 'Door' && I.open) doors.push(i); });
        const F = g.final, fin = F ? { g: F.gate ? [Math.round(F.gate.x), Math.round(F.gate.y), Math.round(F.gate.z)] : 0, a: F.active ? 1 : 0, d: F.done ? 1 : 0, r: Math.round(F.safeR || 0), b: F.beam ? [Math.round(F.beam.x), Math.round(F.beam.y), Math.round(F.beam.z), Math.round(F.beam.ang * 100) / 100, F.beam.spd, F.beam.n, Math.round(F.beam.dmg), Math.round((F.beam.t || 0) * 10) / 10] : 0 } : 0;
        this.emit('s', { df: difficulty(), mu: mutators(), dy: Meta.dailyOn() ? 1 : 0, r: g.round, ph: g.phase, pt: Math.round(g.phaseTimer || 0), rem: g.remaining(), doors, fin, ch: (this.chests || []).slice(-40), q: g.quest.state(), ds: g.descent ? g.descent.state() : null, mx: g.mech.state(), rd: g.audio.radio ? g.audio.radio.state() : null, bar: [Math.round(g.barricadeT || 0), Math.round(g.barricadeCd || 0)] });
        if (g.phase === 'Round' && this.allDead()) g.gameOver();
      }
    } else if (performance.now() - this.lastHost > 12000) this.hostGone();
  },
  sendEnemies() {
    const g = this.game, all = g.enemies.filter((E) => !E.dead), n = Math.max(1, Math.ceil(all.length / 45));
    this.seq++;
    for (let i = 0; i < n; i++) {
      this.emit('e', { q: this.seq, i, n, a: all.slice(i * 45, i * 45 + 45).map((E) => [E.id, E.defIndex, (E.elite ? 1 : 0) | (E.splitChild ? 2 : 0), E.bossIndex, E.affixes | 0,
        Math.round(E.pos.x), Math.round(E.pos.y), Math.round(E.pos.z), Math.round(Math.max(0, E.health / Math.max(1, E.maxHealth)) * 100),
        (E.windup > 0 ? 1 : 0) | (E.lungeT > 0 ? 2 : 0) | (E.burrowed ? 4 : 0) | (E.emerge > 0 ? 8 : 0)]) });
    }
  },
  // ---------------------------------------------------------------- host: hits from clients
  hostHit(h, peer) {
    if (!Array.isArray(h)) return;
    const E = this.game.enemies.find((e) => e.id === h[0]); if (!E || E.dead) return;
    E._netHit = peer;
    E.takeHit(num(h[1], 0, 200000), E.pos, new THREE.Vector3(num(h[3], -1, 1), 0, num(h[4], -1, 1)), !!h[2]);
    E._netHit = null;
  },
  // a teammate fired: flash at their muzzle, a tracer down their line of sight, and the report of their gun
  ghostShot(G) {
    const g = this.game, cp = Math.cos(G.pitch || 0), aim = new THREE.Vector3(-Math.sin(G.yaw) * cp, Math.sin(G.pitch || 0), -Math.cos(G.yaw) * cp).normalize();   // the same way Player.forward() reads yaw
    const side = new THREE.Vector3(aim.z, 0, -aim.x).normalize(), muzzle = G.pos.clone().addScaledVector(aim, 70).addScaledVector(side, -22).add(new THREE.Vector3(0, 28, 0));
    const W = G.wdef >= 0 ? g.data.weapons[G.wdef] : null, d = G.pos.distanceTo(g.player.pos);
    const col = W && Array.isArray(W.color) ? W.color : [1, 0.9, 0.6], mode = W ? W.mode : 'Hitscan';
    g.fx.flash(muzzle, mode === 'Hitscan' ? [1, 0.8, 0.4] : col, mode === 'Flame' ? 40 : 30, 0.07, true); g.fx.glowAt(muzzle, [0.45, 0.33, 0.15], 260, 0.06);
    // what leaves the barrel looks like the gun it came from: pellets fan out, a beam is a wide bright line, a flamethrower throws fire.
    // Rockets, grenades, plasma and saws are real projectiles and arrive on their own (see sentShot).
    if (mode === 'Hitscan' || mode === 'Beam' || mode === 'Chain') {
      const n = Math.max(1, Math.min(8, W ? W.pellets || 1 : 1)), sp = (W ? W.spread || 0 : 0) * Math.PI / 180;
      for (let k = 0; k < n; k++) {
        const dir = aim.clone(); if (n > 1 || sp > 0.02) { dir.x += (Math.random() - 0.5) * sp * 1.6; dir.y += (Math.random() - 0.5) * sp * 1.6; dir.z += (Math.random() - 0.5) * sp * 1.6; dir.normalize(); }
        const range = W ? Math.min(9000, W.range || 6000) : 6000, hit = g.phys.raycast(muzzle, dir, range), end = hit ? hit.point : muzzle.clone().addScaledVector(dir, range);
        g.fx.tracer(muzzle, end, mode === 'Hitscan' ? [1, 0.9, 0.6] : col, mode === 'Beam' ? 9 : mode === 'Chain' ? 6 : 4, mode === 'Beam' ? 0.09 : 0.08);
        if (hit) { g.fx.sparks(hit.point, hit.normal, mode === 'Hitscan' ? [1, 0.8, 0.5] : col, 3); if (mode !== 'Hitscan') g.fx.flash(hit.point, col, 40, 0.1, true); }
      }
    } else if (mode === 'Flame') {
      for (let k = 0; k < 4; k++) { const at = muzzle.clone().addScaledVector(aim, 60 + k * 30); g.fx.add({ pos: at, vel: aim.clone().multiplyScalar(1100 + Math.random() * 300).add(new THREE.Vector3((Math.random() - 0.5) * 160, (Math.random() - 0.5) * 160, (Math.random() - 0.5) * 160)), drag: 1.6, gravity: -90, life: 0.5, size0: 26, size1: 150, rot: Math.random() * 360, rotVel: 120, c0: [1, 0.85, 0.4, 1], c1: [1, 0.3, 0.05, 1], fadeOut: 0.5, tex: 'FX_Flame', glow: 0.9 }); }
    }
    if (W) gunSound(g.audio, W.name, Math.max(0.08, 0.6 / (1 + d / 900)), mode === 'Flame' || mode === 'Beam');
  },
  // the host dropped: hold the line and keep trying the same lobby for a while before carrying on alone
  rejoinTick() {
    const R = this.rejoining, g = R.game, now = performance.now();
    if (now > R.until) { this.rejoining = null; this.goSolo(g); return; }
    if (R.busy || now < R.next) return;
    R.busy = true;
    this.join(R.code, R.name).then(() => { this.rejoining = null; this.game = g; this.started = true; this.lastHost = performance.now(); g.banner('RECONNECTED', [0.5, 0.9, 1], 3); },
      () => { R.busy = false; R.next = performance.now() + 2500; });
  },
  goSolo(g) { if (g) { g.banner('HOST LEFT  -  PLAYING SOLO', [1, 0.6, 0.2], 4); g.enemies.forEach((E) => { E.remove = true; }); g.phase = 'Intermission'; g.phaseTimer = 8; if (g.player.downed || g.coopDown) { g.player.revive(); } } },
  hostFx(d, peer) {
    const E = this.game.enemies.find((e) => e.id === d.id); if (!E || E.dead) return;
    E._netHit = peer;
    if (d.k === 'burn') E.applyBurn(num(d.a, 0, 20000), num(d.b, 0, 20)); else if (d.k === 'bleed') E.applyBleed(num(d.a, 0, 100000));
    else if (d.k === 'slow') E.applySlow(num(d.a, 0, 1), num(d.b, 0, 20)); else if (d.k === 'knock') E.applyKnock(new THREE.Vector3(num(d.a, -3000, 3000), num(d.b, -3000, 3000), num(d.c, -3000, 3000)));
    E._netHit = null;
  },
  // ---------------------------------------------------------------- client: mirrors
  sendHit(E, amount, fromDir, headshot) {
    const h = this.hits.get(E.id) || { a: 0, hs: 0, x: 0, z: 0 };
    h.a += amount; if (headshot) h.hs = 1; h.x = fromDir.x; h.z = fromDir.z; this.hits.set(E.id, h);
    E.health = Math.max(1, E.health - amount); E.sinceHit = 0;
    if (fromDir.lengthSq() > 0) E.lastHitDir.copy(fromDir);
    E.puppet.hurt(Math.min(1, Math.max(0.25, amount / Math.max(E.maxHealth * 0.25, 1))));
    return amount;
  },
  sendFx(E, k, a, b, c) { this.emit('fx', { id: E.id, k, a, b, c }); },
  onEnemies(d) {
    const g = this.game; if (!g || !Array.isArray(d.a)) return;
    if (!this.snap || this.snap.q !== d.q) this.snap = { q: d.q, got: 0, ids: new Set() };
    for (const r of d.a.slice(0, 60)) {
      if (!Array.isArray(r)) continue;
      const id = num(r[0]); this.snap.ids.add(id);
      let E = g.enemies.find((e) => e.id === id);
      if (!E) {
        const def = num(r[1], 0, 99) | 0, fl = num(r[2], 0, 3) | 0, boss = Math.max(-1, Math.min(g.data.bosses.length - 1, num(r[3], -1, 99) | 0));
        this.remoteSpawn = true;
        E = new Enemy(g, def, new THREE.Vector3(num(r[5]), num(r[6]), num(r[7])), Math.max(1, g.round), !!(fl & 1), boss, fl & 2 ? 0.7 : 1, 1, num(r[4], 0, 1 << 20) | 0, !!(fl & 2));
        this.remoteSpawn = false;
        E.id = id; E.remote = true; E.netPos = E.pos.clone(); g.enemies.push(E);
        if (E.isBoss) g.boss = E;
      }
      if (E.dead) continue;
      E.netPos.set(num(r[5]), num(r[6]), num(r[7]));
      const hp = num(r[8], 0, 100) / 100 * E.maxHealth; if (hp < E.health || E.sinceHit > 0.6) E.health = Math.max(1, hp);
      const st = num(r[9], 0, 15) | 0; E.windup = st & 1 ? 0.2 : 0; E.lungeT = st & 2 ? 0.2 : 0; E.burrowed = !!(st & 4); if (!(st & 8)) E.emerge = 0;
    }
    if (++this.snap.got >= num(d.n, 1, 20)) for (const E of g.enemies) if (E.remote && !E.dead && !this.snap.ids.has(E.id)) { E.netDying = true; E.kill(null, false); }
  },
  onKill(d) {
    const g = this.game, E = g && g.enemies.find((e) => e.id === d.id); if (!E || E.dead) return;
    E.netDying = true; E.kill(null, !!d.hs);
    if (d.by === this.me || E.isBoss) g.enemyKilled(E, !!d.hs);
  },
  onState(d) {
    const g = this.game; if (!g) return;
    if (g.audio.radio) g.audio.radio.sync(d.rd);
    if (d.df != null && (d.df | 0) !== difficulty()) setDifficulty(num(d.df, 0, 2) | 0);
    if (d.mu != null && (d.mu | 0) !== mutators()) { setMutators(num(d.mu, 0, 4095) | 0, !!d.dy); g.player.recompute(); }   // the host's difficulty is everyone's
    const r = num(d.r, 0, 999) | 0, ph = ['PreGame', 'Round', 'Intermission', 'GameOver'].includes(d.ph) ? d.ph : 'Round';
    if (g.descent && Array.isArray(d.ds)) g.descent.sync(d.ds);
    if (r > g.round && !g.descent) {
      g.round = r; g.banner(`ROUND ${r}`, [0.85, 0.08, 0.06], 3.5, 'round'); g.hud.roundFlash = 1;
      if (g.player.dead) g.player.revive(); g.player.onRoundStarted(r); Meta.roundStarted(r, g.map.id);
      g.bossRound = r % 3 === 0;
    }
    if (ph !== g.phase) { if (ph === 'Intermission' && g.phase === 'Round') g.player.onRoundEnded(g.round); if (ph === 'GameOver') g.gameOver(); else g.phase = ph; }
    g.phaseTimer = num(d.pt, 0, 999); this.netRem = num(d.rem, 0, 9999);
    if (Array.isArray(d.bar)) { const up = num(d.bar[0], 0, 999) > 0; if (up !== (g.barricadeT > 0)) { g.setBarricade(up); g.banner(up ? 'BARRICADE UP  -  3 MINUTES' : 'BARRICADE DOWN', up ? [0.5, 0.9, 1] : [1, 0.6, 0.2], 2.5); } g.barricadeT = num(d.bar[0], 0, 999); g.barricadeCd = num(d.bar[1], 0, 999); }
    if (d.fin && typeof d.fin === 'object') {
      const f = d.fin, F = g.final || (g.final = { gate: null, active: false, done: false, beam: null, safeR: 0, t: 0 });
      F.gate = Array.isArray(f.g) ? new THREE.Vector3(num(f.g[0]), num(f.g[1]), num(f.g[2])) : null; F.active = !!f.a; F.safeR = num(f.r, 0, 3000);
      if (Array.isArray(f.b)) { const b = f.b, old = F.beam; F.beam = { x: num(b[0]), y: num(b[1]), z: num(b[2]), ang: old && Math.abs(old.ang - num(b[3], -1e4, 1e4)) < 0.6 && old.spd === num(b[4], -3, 3) ? old.ang : num(b[3], -1e4, 1e4), spd: num(b[4], -3, 3), n: Math.max(1, Math.min(6, num(b[5], 1, 6) | 0)), dmg: num(b[6], 0, 300), t: num(b[7], 0, 60) }; } else F.beam = null;
      if (f.d && !F.done) { F.done = true; g.victory = true; g.levelDone = true; Meta.won(g.map.id, difficulty()); g.audio.play('S_Jackpot', 1); }
    }
    if (Array.isArray(d.doors)) for (const i of d.doors.slice(0, 64)) this.openDoorIdx(num(i, 0, 999));
    if (Array.isArray(d.ch)) for (const r of d.ch.slice(0, 40)) this.onChest(r);
    if (Array.isArray(d.q)) g.quest.sync(d.q.slice(0, 16).map((v) => num(v, 0, 2e9)));
    if (Array.isArray(d.mx)) g.mech.sync(d.mx.slice(0, 8).map((v) => num(v, -1e6, 1e6)));
  },
  // enemy projectiles and ground hazards: the host announces each one and every client runs its own copy against its own player
  sentProjectile(P) {
    if (this.role !== 'host' || this._in) return;
    this.emit('pj', [Math.round(P.pos.x), Math.round(P.pos.y), Math.round(P.pos.z), Math.round(P.vel.x), Math.round(P.vel.y), Math.round(P.vel.z), P.gravity, Math.round(P.damage), P.splash, P.slow, P.kind, P.color.map((c) => Math.round(c * 100) / 100), P.radius, P.life]);
  },
  // a player's own rockets, grenades, plasma, saws and thrown blades: everyone else gets a copy that flies and bursts the same way
  // but hurts nothing (the damage is worked out by whoever fired it)
  sentShot(P) {
    if (!this.room || !this.started || this._in || P.ghost || P.hostile) return;
    const now = performance.now(); if (now - (this._pjT || 0) < 45) return; this._pjT = now;
    this.emit('pj', [Math.round(P.pos.x), Math.round(P.pos.y), Math.round(P.pos.z), Math.round(P.vel.x), Math.round(P.vel.y), Math.round(P.vel.z), P.gravity, 0, P.splash, 0, P.kind, P.color.map((c) => Math.round(c * 100) / 100), P.radius, Math.min(P.life, P.fuse > 0 ? P.fuse : 99), 1, P.bounces | 0, P.bounceDamp, P.gtype == null ? -1 : P.gtype]);
  },
  sentHazard(kind, at, a, color) {
    if (this.role !== 'host' || this._in) return;
    this.emit('hz', [kind, Math.round(at.x), Math.round(at.y), Math.round(at.z), a.map((v) => Math.round(v * 100) / 100), color ? color.map((c) => Math.round(c * 100) / 100) : null]);
  },
  onProjectile(d) {
    const g = this.game; if (!g || !Array.isArray(d) || g.projectiles.list.length > 150) return;
    const col = Array.isArray(d[11]) ? d[11].slice(0, 3).map((c) => num(c, 0, 4)) : [1, 1, 1]; while (col.length < 3) col.push(1);
    const kind = ['Orb', 'Card', 'Rocket', 'Missile', 'Grenade', 'Saw', 'Dagger'].includes(d[10]) ? d[10] : 'Orb';
    const mine = d[14] === 1;   // a teammate's own shot: for show
    this._in = true;
    g.projectiles.spawn({ hostile: !mine, pos: new THREE.Vector3(num(d[0]), num(d[1]), num(d[2])), vel: new THREE.Vector3(num(d[3], -9000, 9000), num(d[4], -9000, 9000), num(d[5], -9000, 9000)),
      gravity: num(d[6], 0, 5), damage: mine ? 0 : num(d[7], 0, 500), splash: num(d[8], 0, 800), slow: num(d[9], 0, 1), kind, color: col, radius: num(d[12], 4, 60), life: num(d[13], 0.1, 10),
      ghost: mine, bounces: mine ? num(d[15], 0, 6) | 0 : 0, bounceDamp: mine ? num(d[16], 0, 1) : 0.5, gcol: mine ? num(d[17], -1, 20) | 0 : -1 });
    this._in = false;
  },
  onHazard(d) {
    const g = this.game; if (!g || !Array.isArray(d) || !Array.isArray(d[4]) || g.hazards.list.length > 120) return;
    const at = new THREE.Vector3(num(d[1]), num(d[2]), num(d[3])), a = d[4].map((v) => num(v, 0, 5000));
    const col = Array.isArray(d[5]) ? d[5].slice(0, 3).map((c) => num(c, 0, 4)) : [1, 0.3, 0.2]; while (col.length < 3) col.push(0.2);
    this._in = true;
    if (d[0] === 'ring') g.hazards.ring(at, Math.min(a[0], 500), Math.max(100, a[1]), Math.min(a[2], 4000), col);
    else if (d[0] === 'marker') g.hazards.marker(at, Math.min(a[0], 500), Math.min(a[1], 1200), Math.min(a[2], 10), col);
    else if (d[0] === 'fire') g.hazards.fire(at, Math.min(a[0], 300), Math.min(a[1], 800), Math.min(a[2], 20));
    this._in = false;
  },
  openDoorIdx(i) { const g = this.game, D = g && g.interactables[i | 0]; if (D && D.type === 'Door' && !D.open) { this._door = true; g.openDoor(D); this._door = false; } },
  doorOpened(D) { if (this.active && !this._door) this.emit('door', { i: this.game.interactables.indexOf(D) }); },
  killed(E, headshot) { if (this.role === 'host') this.emit('k', { id: E.id, by: E.netKiller || this.me, hs: headshot ? 1 : 0 }); },
  // lobby (before the run starts): who is here, and has the host started
  lobbyList() { if (!this.room) return []; return this.room.peers().map((p) => ({ name: p.isMe ? this.name : cleanName((p.presence || {}).name), host: p.isMe ? this.role === 'host' : p.peer === this.hostPeer, me: p.isMe, look: p.isMe ? Meta.lookStr() : String((p.presence || {}).look || '').slice(0, 240) })); },
  hostHere() { return this.role !== 'client' || (this.room && this.room.peers().some((p) => p.peer === this.hostPeer)); },
  hostStarted() { if (this.role !== 'client' || !this.room) return false; const h = this.room.peers().find((p) => p.peer === this.hostPeer); return !!(h && h.presence && h.presence.started); },
  setMap(i) { if (this.role === 'host' && this.room) this.room.presence({ map: i }).catch(() => {}); },
  hostMap() { if (this.role !== 'client' || !this.room) return -1; const h = this.room.peers().find((p) => p.peer === this.hostPeer); const m = h && h.presence ? h.presence.map : -1; return Number.isInteger(m) ? m : -1; },
  refreshPresence() { if (this.room) this.room.presence({ name: this.name, look: Meta.lookStr() }).catch(() => {}); },
  team() { const out = []; for (const G of this.ghosts.values()) if (G.fresh) out.push({ name: G.name, hp: G.hp, dead: G.dead, host: G.peer === this.hostPeer }); return out; },
};
