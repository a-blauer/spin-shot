// The twenty bosses of the Descent. Each has one thing about it that is its own: a rule for how it is hurt, something
// it does to the room, or something it makes. Everything dangerous is laid down as a hazard (marker, ring, fire), so
// a guest sees exactly what the host does.
import * as THREE from 'three';
import { DATA, lin, frandRange, randInt } from './data.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const flat = (v) => { const d = Math.hypot(v.x, v.z) || 1; return V3(v.x / d, 0, v.z / d); };
export const X_ATTACKS = ['Spin', 'Erupt', 'Storm', 'Vent', 'Vortex', 'Tide', 'Strafe', 'Devour', 'Eclipse'];
const defOf = (art) => DATA.enemies.findIndex((e) => e.art === art);
const say = (E, text, col = [1, 0.9, 0.3]) => E.game.hud.floater(E.pos.clone().add(V3(0, E.half * 0.7, 0)), text, col, 1.6);
const players = (G) => [G.player, ...G.net.ghosts.values()].filter((T) => !T.dead);
// the room the fight is in: its middle, half its width, and the four raised slabs
function room(E) { const D = E.game.descent, A = D && D.A(); return A ? { c: V3(A.c[0], 0, A.c[1]), r: Math.min(A.hx, A.hy) - 260, pl: A.plinths } : { c: E.home || (E.home = E.pos.clone().setY(0)), r: 1300, pl: [] }; }
const ground = (E, at) => { const h = E.game.phys.raycastDown(V3(at.x, at.y + 400, at.z), 2000); return h ? h.point : V3(at.x, 0, at.z); };
const kids = (E, art, n, r0 = 200, r1 = 600, hp = 0.6) => { const G = E.game, d = defOf(art), out = []; if (d < 0) return out; const fly = DATA.enemies[d].ai === 'Flyer'; for (let i = 0; i < n; i++) { const at = G.findFreeLocationNear(E.pos, r0, r1); if (at) { const K = G.spawnEnemy(d, at.add(V3(0, fly ? 300 : 90, 0)), false, -1, 1, hp, 0, false); if (K) out.push(K); } } return out; };

// ------------------------------------------------------------------ every frame, before it chooses what to do
export function mechX(E, dt, C) {
  const G = E.game, B = E.boss, hpf = E.health / E.maxHealth, M = E.mx || (E.mx = { t: 0, n: 0 });
  M.t += dt;
  switch (B.mech) {
    case 'eggs':   // the Brood Mother: sacs that hatch unless you burst them
      if (M.t > (E.enraged ? 7 : 10)) { M.t = 0; const K = kids(E, 'EggSac', 2, 300, 800, 0.5); if (K.length) { say(E, 'EGGS', [0.8, 1, 0.5]); G.audio.playAt('S_Gib', E.pos, 1, 1.3); } }
      break;
    case 'swarm': {   // the Hive Queen: never alone
      const alive = G.enemies.filter((K) => !K.dead && K.def.art === 'Hornet').length;
      if (M.t > (hpf < 0.5 ? 4 : 7) && alive < 8) { M.t = 0; kids(E, 'Hornet', hpf < 0.5 ? 3 : 2, 200, 500, 0.5); }
      break; }
    case 'decoy':   // the Lamplighter: three lights, one fish
      if (E.decoy) { if (!E.owner || E.owner.dead) { E.noLoot = true; E.takeHit(1e9, E.pos, V3(0, 1, 0), false); } break; }
      E.decoys = (E.decoys || []).filter((K) => !K.dead);
      if (M.t > 15 && E.bossAttack < 0) {
        M.t = 0; G.fx.flash(E.pos, [1, 0.9, 0.5], 300, 0.4, true); E.blink(600, 1000);
        for (const K of E.decoys) K.takeHit(1e9, K.pos, V3(0, 1, 0), false);
        E.decoys = [];
        for (let i = 0; i < 2; i++) { const at = G.findFreeLocationNear(C.Pl, 600, 1100); if (!at) continue; const K = G.spawnEnemy(B.minion, at.add(V3(0, 200, 0)), false, E.bossIndex, 1, 1, 0, false); K.decoy = true; K.owner = E; K.noLoot = true; K.maxHealth = K.health = 1; K.money = 0; E.decoys.push(K); }
        G.banner('WHICH ONE IS IT', lin(1, 0.9, 0.5), 2.2);
      }
      break;
    case 'twin':   // the hounds: kill one and the other remembers
      if (E.twin && E.twin.dead && !M.alone) { M.alone = true; E.enraged = true; E.baseSpeed *= 1.3; E.health = Math.min(E.maxHealth, E.health + E.maxHealth * 0.3); E.puppet.setTint([1.2, 0.6, 0.5]); G.banner('IT HOWLS FOR THE OTHER', lin(1, 0.35, 0.2), 3); G.audio.playAt('S_BossRoar', E.pos, 1, 1.3); }
      break;
    case 'heads': {   // the Hydra: leave it alone and it mends
      if (E.sinceHit > 4 && hpf < 1) { E.health = Math.min(E.maxHealth, E.health + E.maxHealth * 0.012 * dt); if (M.t > 1.2) { M.t = 0; say(E, 'MENDING', [0.5, 1, 0.6]); } }
      const st = hpf < 0.33 ? 2 : hpf < 0.66 ? 1 : 0;
      if (st > M.n) { M.n = st; E.xRate = 1 + st * 0.3; G.banner('ANOTHER HEAD WAKES', lin(0.4, 1, 0.6), 2.5); G.audio.playAt('S_Screech', E.pos, 1, 0.7); }
      break; }
    case 'reflect':   // the Mirror Queen: when she shines, what you fire comes back
      if (M.up > 0) { M.up -= dt; if (M.up <= 0) { E.puppet.setTint(E.enraged ? [1, 0.72, 0.66] : [1, 1, 1]); E.exposedT = 2; M.t = 0; } }
      else if (M.t > 11) { M.up = 4; G.banner('THE MIRROR IS UP  -  HOLD YOUR FIRE', lin(0.7, 0.95, 1), 2.6); E.puppet.setTint([1.7, 1.9, 2.1]); G.audio.playAt('S_Door', E.pos, 1, 1.8); G.fx.ring(E.feet(), 500, [0.7, 0.95, 1], 0.5); }
      break;
    case 'stealth':   // the Mantis: you see it when it strikes
      if (E.bossAttack >= 0 || E.sinceHit < 1.2 || E.exposedT > 0) { M.t = 0; if (M.hid) { M.hid = false; E.puppet.setTint([1, 1, 1]); } }
      else if (M.t > 2.5 && !M.hid) { M.hid = true; E.puppet.setTint([0.16, 0.2, 0.2]); G.fx.puff(E.pos, [0.3, 0.4, 0.3], 200, 0.5); }
      E.baseSpeed = B.speed * (M.hid ? 1.5 : 1) * (E.enraged ? 1.15 : 1);
      break;
    case 'storm':   // Thunderhead: it never stops raining on you
      if (M.t > (E.enraged ? 2.6 : 4)) { M.t = 0; for (const T of players(G)) G.hazards.marker(ground(E, T.pos), E.attackDamage * 0.7, 190, 1.0, [1, 0.9, 0.4]); }
      break;
    case 'devour':
      if (M.grown) E.puppet.baseScale = E.bodyScale * (1 + M.grown * 0.05);
      break;
    default: break;
  }
}

// ------------------------------------------------------------------ what a hit does to it
export function hitX(E, dmg, fromDir, headshot) {
  const B = E.boss, G = E.game, M = E.mx || {};
  switch (B.mech) {
    case 'front':   // Old Ironhide: plate in front, hide behind
      if (!(E.exposedT > 0) && fromDir && fromDir.lengthSq() > 0) {
        const fwd = V3(Math.sin(E.yaw), 0, Math.cos(E.yaw));
        if (fwd.dot(flat(fromDir).negate()) > 0.35) { if (!(E.xSay > G.time)) { E.xSay = G.time + 0.7; say(E, 'ARMOURED  -  GET BEHIND IT', [0.7, 0.75, 0.8]); } return dmg * 0.15; }
      }
      return dmg;
    case 'reflect':
      if (M.up > 0) { if (!(E.xSay > G.time)) { E.xSay = G.time + 0.25; say(E, 'REFLECTED', [0.7, 0.95, 1]); const P = G.player; if (!P.dead) P.receiveDamage(Math.min(P.maxHealth * 0.12, 6 + dmg * 0.02), E, false); } return 0; }
      return dmg;
    case 'stealth': return M.hid ? dmg * 0.5 : dmg;
    case 'shell': return E.shellT > 0 ? 0 : dmg;
    default: return dmg;
  }
}

// ------------------------------------------------------------------ when it dies
export function deathX(E) {
  const G = E.game, B = E.boss;
  if (B.mech === 'split' && (E.gen || 0) < 2) {   // King Ooze: cut it and there are two
    for (const s of [-1, 1]) {
      const at = G.findFreeLocationNear(E.pos, 150, 500) || E.pos.clone();
      const K = G.spawnEnemy(B.minion, at.clone().add(V3(0, 120, 0)), false, E.bossIndex, Math.pow(0.66, (E.gen || 0) + 1), 0.4 * Math.pow(0.55, E.gen || 0), 0, false);
      K.gen = (E.gen || 0) + 1; K.noLoot = true; K.money = Math.round(E.money * 0.2); K.emerge = 0.6; K.launch(V3(s * 500, 600, frandRange(-300, 300)));
    }
    G.banner((E.gen || 0) === 0 ? 'IT COMES APART' : 'AND AGAIN', lin(0.4, 1, 0.7), 2);
    E.noLoot = (E.gen || 0) > 0;
  }
  if (E.decoys) for (const K of E.decoys) if (!K.dead) { K.noLoot = true; K.takeHit(1e9, K.pos, V3(0, 1, 0), false); }
}

// ------------------------------------------------------------------ the moves that are theirs alone. Returns true while it handles the attack.
export function attackX(E, name, dt, C) {
  const G = E.game, { Pl, To, dist, feet, done } = C, dmg = E.attackDamage, Rm = room(E), M = E.mx || (E.mx = { t: 0, n: 0 });
  switch (name) {
    case 'Spin': {   // Carapace: pulls everything in and goes across the room like a thrown stone, three times
      if (E.bossStep === 0) { E.windup = 1; E.stop(); if (E.bossT > 0.9) { E.bossStep = 1; E.bossT = 0; E.shellT = 99; E.spinN = 0; E.chargeDir = flat(To); E.puppet.setTint([0.6, 0.8, 0.9]); say(E, 'SHELL', [0.6, 0.85, 1]); G.audio.playAt('S_Stomp', E.pos, 1, 1.3); } return true; }
      E.moveToward(E.chargeDir, 1); E.bossMoveOverride = 1700; E.windup = 0.6;
      for (const T of players(G)) if (T.pos.distanceTo(E.pos) < 150 + 70 * E.bodyScale && !(T.spinHit > G.time)) { T.spinHit = G.time + 0.8; T.receiveDamage(dmg * 1.1, E, true); T.applyKnockback(E.chargeDir.clone().multiplyScalar(1200).add(V3(0, 450, 0))); }
      const off = E.pos.clone().sub(Rm.c); off.y = 0;
      if (E.bossT > 1.5 || (E.bossT > 0.25 && off.length() > Rm.r && off.dot(E.chargeDir) > 0)) {
        E.spinN++; E.bossT = 0; G.shakeAt(E.pos, 500); G.fx.dust(E.feet(), lin(0.4, 0.5, 0.55), 220); G.audio.playAt('S_Stomp', E.pos, 1, 1);
        if (E.spinN >= (E.enraged ? 4 : 3)) { E.shellT = 0; E.exposedT = 3.2; E.puppet.setTint([1.25, 1.15, 0.6]); say(E, 'ON ITS BACK'); done(); } else E.chargeDir = flat(Pl.clone().sub(E.pos));
      }
      return true; }
    case 'Erupt': {   // the Wyrm: under the floor, then under you
      if (E.bossStep === 0) { E.windup = 1; E.stop(); if (E.bossT > 0.7) { E.bossStep = 1; E.bossT = 0; E.burrowed = true; E.windup = 0; G.fx.dust(E.feet(), lin(0.4, 0.3, 0.2), 300); G.audio.playAt('S_Stomp', E.pos, 1, 0.6); E.eruptN = 0; } return true; }
      if (E.bossStep === 1) { E.stop(); if (E.bossT > 0.6) { E.bossStep = 2; E.bossT = 0; const at = ground(E, Pl); E.eruptAt = at.clone(); G.hazards.marker(at, dmg * 1.5, 400, 1.3, lin(0.9, 0.5, 0.2)); } return true; }
      if (E.bossStep === 2) { E.stop(); if (E.bossT > 1.3) { E.pos.set(E.eruptAt.x, E.eruptAt.y + E.feetOffset + 10, E.eruptAt.z); E.burrowed = false; E.emerge = 0.5; E.bossStep = 3; E.bossT = 0; G.hazards.ring(E.eruptAt, dmg * 0.5, 1000, 1500, lin(0.9, 0.5, 0.2)); G.shakeAt(E.pos, 800); G.fx.dust(E.eruptAt, lin(0.4, 0.3, 0.2), 400); G.audio.playAt('S_BossRoar', E.pos, 1, 0.6); } return true; }
      E.stop();
      if (E.bossT > 0.7) { E.eruptN++; if (E.enraged && E.eruptN < 2) { E.bossStep = 0; E.bossT = 0.5; } else { E.exposedT = 2.6; say(E, 'OUT OF THE GROUND'); done(); } }
      return true; }
    case 'Storm': {   // Thunderhead: the whole floor, twice
      E.windup = 1; E.stop();
      const waves = E.enraged ? 3 : 2;
      if (E.bossStep < waves && E.bossT > 0.5 + E.bossStep * 1.5) {
        for (let i = 0; i < 11; i++) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * Rm.r; G.hazards.marker(ground(E, V3(Rm.c.x + Math.cos(a) * r, 0, Rm.c.z + Math.sin(a) * r)), dmg * 0.9, 250, 1.4, [1, 0.9, 0.4]); }
        E.bossStep++; G.audio.playAt('S_Screech', E.pos, 0.8, 0.6);
      }
      if (E.bossStep >= waves && E.bossT > 0.5 + waves * 1.5) done();
      return true; }
    case 'Vent': {   // the Furnace: it has to let the heat out, and then it is soft
      E.windup = 1; E.stop();
      if (E.bossStep === 0 && E.bossT > 1.0) {
        E.bossStep = 1; G.banner('IT VENTS', lin(1, 0.5, 0.15), 2);
        for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, at = ground(E, V3(E.pos.x + Math.cos(a) * 520, E.pos.y, E.pos.z + Math.sin(a) * 520)); G.hazards.fire(at, dmg * 0.5, 210, 7); }
        G.hazards.ring(feet, dmg * 0.7, 900, 1900, lin(1, 0.45, 0.1)); G.shakeAt(E.pos, 700); G.audio.playAt('S_BossRoar', E.pos, 1, 0.9);
      }
      if (E.bossT > 1.6) { E.exposedT = 4; E.puppet.setTint([1.3, 1.0, 0.6]); say(E, 'COOLING  -  HIT IT NOW'); done(); }
      return true; }
    case 'Vortex': {   // the Unblinking: it looks at you and you come to it
      E.windup = 1; E.stop();
      if (E.bossStep === 0) { E.bossStep = 1; G.banner('DO NOT LET IT PULL YOU IN', lin(0.8, 0.5, 1), 2.4); G.hazards.fire(feet, dmg * 0.9, 430, 4.2, lin(0.7, 0.3, 1)); G.audio.playAt('S_Screech', E.pos, 1, 0.5); E.vN = 0; }
      const P = G.player; if (!P.dead) { const d = E.pos.clone().sub(P.pos); d.y = 0; const L = d.length(); if (L > 200 && L < 3200) { d.normalize(); P.vel.x += d.x * 2300 * dt; P.vel.z += d.z * 2300 * dt; } }
      if (E.bossT > 1 + E.vN * 1.1 && E.vN < 3) { E.vN++; G.hazards.ring(feet, dmg * 0.5, 800, 2400, lin(0.8, 0.5, 1)); }
      if (E.bossT > 4.2) done();
      return true; }
    case 'Tide': {   // Grandfather Toad: the floor goes under; the four slabs do not
      E.stop();
      if (E.bossStep === 0) { E.bossStep = 1; E.windup = 1; G.banner('THE MIRE RISES  -  GET ON A SLAB', lin(0.5, 1, 0.3), 3); G.audio.playAt('S_BossRoar', E.pos, 1, 0.5); for (const p of Rm.pl) G.fx.ring(V3(p[0], 96, p[1]), 380, [0.6, 1, 0.5], 0.8); if (G.descent) { G.descent.zone(Rm.c.x, Rm.c.z, Rm.r + 1600, 0x1e4a1a, 6, 0.3, 3); for (const p of Rm.pl) G.descent.zone(p[0], p[1], 330, 0xc8ffb0, 94, 0.5, 8); } }
      if (E.bossStep === 1 && E.bossT > 3) { E.bossStep = 2; E.windup = 0; if (G.descent) G.descent.zone(Rm.c.x, Rm.c.z, Rm.r + 1600, 0x1e4a1a, 50, 0.7, 5); G.audio.playAt('S_Stomp', E.pos, 1, 0.5); }
      if (E.bossStep === 2) { E.tideT = (E.tideT || 0) - dt; if (E.tideT <= 0) { E.tideT = 0.5; for (const P of players(G)) if (P.pos.y - 90 < 55) P.receiveDamage(dmg * 0.3, E, false); } }
      if (E.bossT > 8) done();
      return true; }
    case 'Strafe': {   // the Bone Dragon: a line of fire through where you stand, then another across it
      E.windup = 1; E.stop();
      const n = E.enraged ? 3 : 2;
      if (E.bossStep < n && E.bossT > 0.4 + E.bossStep * 1.3) {
        const d = flat(To), a = E.bossStep * 1.2 - 0.3, dir = V3(d.x * Math.cos(a) - d.z * Math.sin(a), 0, d.x * Math.sin(a) + d.z * Math.cos(a)), base = Pl.clone().addScaledVector(dir, -900);
        (E.lines = E.lines || []).push({ t: 1.1, pts: [...Array(8).keys()].map((i) => ground(E, base.clone().addScaledVector(dir, i * 260))) });
        for (const p of E.lines[E.lines.length - 1].pts) G.hazards.marker(p, dmg * 0.8, 170, 1.1, lin(0.35, 0.85, 1));
        E.bossStep++; G.audio.playAt('S_Screech', E.pos, 1, 0.8);
      }
      if (E.lines) { for (const L of E.lines) { L.t -= dt; if (L.t <= 0 && !L.lit) { L.lit = true; for (const p of L.pts) G.hazards.fire(p, dmg * 0.45, 170, 6, lin(0.35, 0.85, 1)); } } }
      if (E.bossStep >= n && E.bossT > 0.6 + n * 1.3 + 1.2) { E.lines = null; done(); }
      return true; }
    case 'Devour': {   // the Devourer: it calls food, and whatever you leave alive it eats
      E.windup = 1; E.stop();
      if (E.bossStep === 0 && E.bossT > 0.8) { E.bossStep = 1; E.meal = kids(E, 'Grub', E.enraged ? 7 : 5, 300, 800, 0.7); G.banner('KILL THEM BEFORE IT FEEDS', lin(1, 0.4, 0.5), 2.6); G.fx.ring(feet, 500, lin(1, 0.3, 0.4), 0.5); E.windup = 0; }
      if (E.bossStep === 1) {
        E.windup = 0;
        if (E.bossT > 6.5) {
          let ate = 0; for (const K of E.meal || []) if (!K.dead) { ate++; G.fx.flash(K.pos, [1, 0.3, 0.4], 120, 0.3, true); K.noLoot = true; K.money = 0; K.takeHit(1e9, K.pos, V3(0, 1, 0), false); }
          if (ate) { E.health = Math.min(E.maxHealth, E.health + E.maxHealth * 0.04 * ate); M.grown = Math.min(8, (M.grown || 0) + ate); E.attackDamage *= 1 + 0.03 * ate; say(E, `FED  x${ate}`, [1, 0.4, 0.5]); G.audio.playAt('S_Gib', E.pos, 1.2, 0.6); } else { E.exposedT = 3; say(E, 'STARVED'); }
          done();
        } else if (E.bossT > 1.2 && (E.meal || []).every((K) => K.dead)) { E.exposedT = 3; say(E, 'STARVED'); done(); }
      }
      return true; }
    case 'Eclipse': {   // the Nameless: the light goes, all but one piece of it
      E.windup = 1; E.stop();
      if (E.bossStep === 0) {
        E.bossStep = 1; const a = Math.random() * Math.PI * 2, r = Rm.r * 0.5; E.safe = ground(E, V3(Rm.c.x + Math.cos(a) * r, 0, Rm.c.z + Math.sin(a) * r));
        G.banner('STAND IN THE LIGHT', lin(1, 1, 0.85), 3); if (G.descent) { G.descent.zone(E.safe.x, E.safe.z, 470, 0xfff0c0, E.safe.y + 6, 0.55, 4.3); G.descent.zone(E.safe.x, E.safe.z, 500, 0xffffff, E.safe.y + 4, 0.35, 4.3); } G.audio.playAt('S_BossRoar', E.pos, 1, 0.45);
      }
      if (E.bossStep === 1 && E.bossT > 4.2) {
        E.bossStep = 2; G.hud.hurtWhite = 0.5; G.shakeAt(E.pos, 1200);
        for (const P of players(G)) if (Math.hypot(P.pos.x - E.safe.x, P.pos.z - E.safe.z) > 480) P.receiveDamage(Math.max(dmg * 1.6, (P.maxHealth || 150) * 0.5), E, false);
        G.hazards.ring(E.safe, dmg * 0.4, 1400, 2600, lin(0.75, 0.5, 1));
      }
      if (E.bossT > 5) done();
      return true; }
    default: return false;
  }
}

// Things that stand where they are put: egg sacs that hatch, tentacles that come down on whoever is near.
export function thinkTotem(E, dt) {
  const G = E.game, D = E.def;
  E.stop(); E.tt = (E.tt || 0) + dt;
  if (D.hatch) {
    if (E.tt > D.hatch) { const d = defOf(D.hatchArt); for (let i = 0; i < (D.hatchN || 3); i++) { const at = G.findFreeLocationNear(E.pos, 60, 260); if (at && d >= 0) { const K = G.spawnEnemy(d, at.add(V3(0, 80, 0)), false, -1, 1, 0.7, 0, false); if (K) { K.noLoot = true; } } } G.fx.puff(E.pos, [0.8, 0.9, 0.5], 160, 0.5); G.audio.playAt('S_Gib', E.pos, 0.9, 1.4); E.noLoot = true; E.money = 0; E.takeHit(1e9, E.pos, V3(0, 1, 0), false); }
    else E.windup = E.tt > D.hatch - 1.5 ? 1 : 0;
    return;
  }
  E.attackCd -= dt;
  if (E.slamT > 0) { E.slamT -= dt; E.windup = 1; if (E.slamT <= 0) { E.lungeT = 0.3; E.windup = 0; } return; }
  if (E.attackCd <= 0) for (const T of players(G)) if (Math.hypot(T.pos.x - E.pos.x, T.pos.z - E.pos.z) < D.range) { E.attackCd = D.cd; E.slamT = 0.9; G.hazards.marker(ground(E, T.pos), E.attackDamage, 230, 0.9, lin(0.7, 0.4, 0.9)); break; }
}
