// The oddities: twenty-five weapons that are not really guns. Each has a `fire` of its own (or rides an ordinary
// gun's firing with a rule on top), and many put things into the world that outlive the shot: a boomerang on its way
// back, a trap ripening in a doorway, an enemy held in the air. Those are ticked here whichever weapon is in hand.
//   fire(p, S, W, g, C, F)   replaces the bullets. F = { muzzle, eye, dir, pdir, aim, damage, pierce, procCoef, spread, pellets }
//   free / ammo()            not fed by a magazine; ammo() says what it runs on instead        can()   may it fire right now
//   charge()                 hold to draw, let go to loose            rkey()  what the reload key does (true: nothing else)
//   hurt()                   sees damage before you take it            bar()   a timing meter under the crosshair
//   pTick / pHit / pWall / pEnd / pGone    the life of a projectile this weapon threw
import * as THREE from 'three';
import { V3, clamp, GOLD, near, say, front, later, mark, dist, camDir, cone, asShot } from './sigkit.js';

const UP = V3(0, 1, 0);
const T_ = (p) => p.game.time;
const ctxOf = (C, more) => Object.assign({}, C, { seen: new Set(), hits: 0 }, more || {});
// a thrown thing comes to rest on whatever it hit
const stick = (P, wall, nose = false) => {
  P.stuck = true; P.vel.set(0, 0, 0); P.gravity = 0; P.pos.copy(wall.point).addScaledVector(wall.normal, nose ? 22 : 3);
  if (nose) P.group.quaternion.setFromUnitVectors(V3(0, 0, -1), wall.normal.clone().negate()); else P.group.quaternion.setFromUnitVectors(UP, wall.normal);
  P.group.position.copy(P.pos);
};
const keep = (p, key, P, max) => { const L = p[key] = (p[key] || []).filter((q) => !q.done); L.push(P); while (L.length > max) p.game.projectiles.kill(L.shift()); return L; };
const segDist = (pt, a, b) => { const ab = b.clone().sub(a), t = clamp(pt.clone().sub(a).dot(ab) / Math.max(1, ab.lengthSq()), 0, 1); return pt.distanceTo(a.clone().addScaledVector(ab, t)); };
const inCone = (eye, dir, E, range, half) => { const v = E.pos.clone().sub(eye), d = v.length(); if (d > range + E.radius) return -1; const a = Math.acos(clamp(v.dot(dir) / Math.max(1, d), -1, 1)); return a < half + Math.atan2(E.radius, Math.max(60, d)) ? d : -1; };
const RANK = ['A', 'K', 'Q', 'J', '10', '9', '8'], SUIT = ['s', 'h', 'd', 'c'], REEL = ['CHERRY', 'BELL', 'BAR', 'SEVEN'];
function pokerHand(h) {
  const n = {}; for (const c of h) n[c[0]] = (n[c[0]] || 0) + 1;
  const cnt = Object.values(n).sort((a, b) => b - a), rk = Object.keys(n).map(Number).sort((a, b) => a - b);
  const flush = h.every((c) => c[1] === h[0][1]), straight = rk.length === 5 && rk[4] - rk[0] === 4;
  if (cnt[0] === 5) return ['FIVE OF A KIND', 15];
  if (straight && flush) return ['STRAIGHT FLUSH', 12];
  if (cnt[0] === 4) return ['FOUR OF A KIND', 9];
  if (cnt[0] === 3 && cnt[1] === 2) return ['FULL HOUSE', 7];
  if (flush) return ['FLUSH', 6];
  if (straight) return ['STRAIGHT', 5];
  if (cnt[0] === 3) return ['THREE OF A KIND', 4];
  if (cnt[0] === 2 && cnt[1] === 2) return n[0] === 2 && n[6] === 2 ? ["DEAD MAN'S HAND", 10] : ['TWO PAIR', 3];
  if (cnt[0] === 2) return ['PAIR', 2];
  return ['HIGH CARD', 1];
}

export const SIG2 = {
  // ------------------------------------------------------------------ thrown and returning
  'Come-Back Kid': {
    name: 'Catch', short: 'A boomerang. It hits on the way out and back, harder each time, and you catch it.',
    text: 'One boomerang, no ammunition. It cuts through everything on the way out and again on the way back, 20% deadlier for each thing it hits, six times over. Catch it and the next throw keeps half of what it built; walls send it home early.',
    play: 'Throw past them, not at them, then step so the return passes through the pack. Stand still and it comes straight back.', fav: ['Heavy Rounds', 'Serrated', 'Swiftness'],
    free: true, snd: ['S_SwingBig', 0.7, 1.15],
    ammo: (p, S, W, g) => [g.out && T_(p) < g.lost ? '0' : '1', g.out && T_(p) < g.lost ? 'IN THE AIR' : 'IN HAND'],
    can: (p, S, W, g) => !g.out || T_(p) > g.lost,
    shot(p, S, W, g, C) { C.mult *= 1 + (g.keep || 0); },
    fire(p, S, W, g, C, F) {
      if (p.sgBoom && !p.sgBoom.done) p.game.projectiles.kill(p.sgBoom);
      const P = p.sgBoom = p.fireProjectile(F.muzzle, F.pdir, F.damage, 1, W); P.life = 6; P.spin = 24; P.pierce = 99; P.bm = { t: 0, back: false, n: 0 };
      g.out = true; g.lost = T_(p) + 5.5; g.keep = 0;
    },
    pTick(p, P, dt) {
      const B = P.bm, G = p.game; B.t += dt;
      if (!B.back) { P.vel.multiplyScalar(Math.max(0, 1 - dt * 1.3)); if (B.t > 0.55) { B.back = true; P.hit.clear(); } return false; }
      const to = p.eye().add(V3(0, -25, 0)).sub(P.pos), d = to.length();
      if (d < 140) { const g = P.sx.g; g.keep = Math.min(1.5, (Math.pow(1.2, B.n) - 1) * 0.5); G.projectiles.kill(P); p.fireCd = Math.min(p.fireCd, 0.12); p.play('S_Pickup', 0.6, 1.3); if (g.keep > 0.15) say(p, front(p), `HOT CATCH  +${Math.round(g.keep * 100)}%`, [1, 0.75, 0.3]); return true; }
      P.vel.lerp(to.normalize().multiplyScalar(2300), Math.min(1, dt * 7));
      return false;
    },
    pHit(p, P, E, at) { if (P.bm.n < 6) { P.bm.n++; P.damage *= 1.2; } p.game.fx.sparks(at, UP, [1, 0.8, 0.4], 4); return true; },
    pWall(p, P, wall) { const B = P.bm; if (!B.back) { B.back = true; P.hit.clear(); p.game.fx.sparks(wall.point, wall.normal, [1, 0.9, 0.66], 5); p.game.audio.playAt('S_HitWall', wall.point, 0.5, 1.2); } P.pos.addScaledVector(P.vel, 1 / 60); return true; },
    pGone(p, P) { if (p.sgBoom === P) { P.sx.g.out = false; p.sgBoom = null; } },
    hud: (p, S, W, g) => (!g.out && g.keep > 0.15 ? [`HOT CATCH  +${Math.round(g.keep * 100)}%`, '#ffb347'] : null),
  },
  Whaler: {
    name: 'Reel In', short: 'A harpoon that drags what it hits to your feet, stunned and taking +50%.',
    text: 'The harpoon goes through up to three enemies and hauls every one of them to your feet, stunned and taking 50% more damage for three and a half seconds. Kill one on the line and the next harpoon is already loaded.',
    play: 'It does not finish the fight, it moves it. Reel the dangerous one in, then swap to the shotgun or the blade.', fav: ['Quick Hands', 'Piercing Tip', 'Heavy Rounds'], aff: { ReloadSpeed: 1.5, Pierce: 2 },
    fire(p, S, W, g, C, F) { p.fireProjectile(F.muzzle, F.pdir, F.damage, 1, W); },
    pHit(p, P, E, at) {
      const G = p.game; G.fx.tracer(G.vm.muzzleWorld(), at, [0.78, 0.72, 0.58], 3, 0.35);
      if (E.dead) return undefined;
      if (E.isBoss) { mark(G, E, 0.3, 3.5); return undefined; }
      const to = p.pos.clone().sub(E.pos); to.y = 0; const d = to.length(), sp = Math.min(2500, Math.max(0, d - 220) * 2.6); to.normalize();
      E.launch(V3(to.x * sp, 430, to.z * sp)); p.stun(E, 1.5); mark(G, E, 0.5, 3.5); E.sgHook = G.time + 3.5;
      return undefined;
    },
    kill(p, E, C) { const S = C.S, G = p.game; if (!(E.sgHook > G.time) || C.fed || p.slot !== S) return; C.fed = true; if (S.ammo < 1 && S.reserve > 0) { S.ammo = 1; S.reserve--; p.reloading = false; p.fireCd = Math.min(p.fireCd, 0.25); say(p, E.pos, 'LANDED', [0.8, 0.9, 1]); p.play('S_Rack', 0.6, 1.2); } },
  },
  'Bear Trap': {
    name: 'Patience', short: 'Lays traps that grow 25% deadlier every second they wait, up to four times.',
    text: 'It throws a trap that arms where it lands. A set trap gets 25% deadlier every second it waits, up to four times as strong after twelve, then snaps on the first thing to step near, rooting everything in the blast. You can keep as many set as the magazine holds.',
    play: 'Lay the room before the fight comes to you. The trap you set first is the one that kills the big one.', fav: ['Extended Mag', 'Blast Cap', 'Heavy Rounds'], aff: { MagSize: 1.5, ExplosionRadius: 1.5 },
    fire(p, S, W, g, C, F) { const P = p.fireProjectile(F.muzzle, F.pdir, 0, 0.5, W); P.gravity = 1; P.vel.y += 220; P.life = 60; P.dmg0 = F.damage; P.spin = 5; },
    snap(p, P, ripe) {
      const G = p.game, at = P.pos.clone().add(V3(0, 30, 0)); G.projectiles.kill(P); G.audio.playAt('S_Blade', at, 0.9, 0.7);
      asShot(p, ctxOf(P.sx), () => p.explodeAt(at, P.splash, P.dmg0 * (1 + ripe), 0.5, false, false, [1, 0.5, 0.2], null));
      for (const E of near(G, at, P.splash, null)) p.stun(E, 1.5);
      say(p, at, ripe >= 3 ? 'RIPE  x4' : `SNAP  x${(1 + ripe).toFixed(1)}`, ripe >= 3 ? GOLD : [1, 0.7, 0.4], ripe >= 3 ? 1.3 : 1);
    },
    pHit(p, P, E) { this.snap(p, P, 0); return true; },
    pWall(p, P, wall) { stick(P, wall); P.spin = 0; P.armT = 0; keep(p, 'sgTraps', P, p.magSize(P.sx.S)); p.game.audio.playAt('S_HitWall', P.pos, 0.5, 0.7); return true; },
    pTick(p, P, dt) {
      if (!P.stuck) return false;
      P.armT += dt; const ripe = Math.min(3, 0.25 * P.armT), G = p.game;
      P.group.scale.setScalar(1 + 0.12 * ripe);
      if (P.age > P.life - 0.2) { G.projectiles.kill(P); return true; }
      if (P.armT > 0.4) for (const E of G.enemies) if (!E.dead && !E.emerging && !E.burrowed && Math.hypot(E.pos.x - P.pos.x, E.pos.z - P.pos.z) < 130 + E.radius && Math.abs(E.feet().y - P.pos.y) < 160) { this.snap(p, P, ripe); break; }
      return true;
    },
    hud: (p) => { const n = (p.sgTraps || []).filter((q) => !q.done).length; return n ? [`TRAPS SET  ${n}`, '#ffb347'] : null; },
  },
  'Jack-in-the-Box': {
    name: 'Encore', short: 'Throws a box that pops a gunner for eight seconds. Its kills keep the show going.',
    text: 'Throws a tin box that pops open where it lands: a clown on a spring that shoots the nearest enemy four times a second for eight seconds. Every kill it makes adds a second to the act, and it goes out with a bang. Two can play at once.',
    play: 'Put it behind them. While they turn on you it works on their backs, and a busy box never closes.', fav: ['Rapid Bolt', 'Heavy Rounds', 'Blast Cap'], aff: { FireRate: 1.5 },
    fire(p, S, W, g, C, F) { const P = p.fireProjectile(F.muzzle, F.pdir, 0, 0.3, W); P.gravity = 1; P.vel.y += 260; P.life = 60; P.dmg0 = F.damage; P.spin = 7; },
    pHit: () => true,
    pWall(p, P, wall) { stick(P, wall); P.spin = 0; P.act = 8; P.cd = 0.5; keep(p, 'sgBoxes', P, 2); p.game.audio.playAt('S_HitWall', P.pos, 0.5, 0.6); return true; },
    pTick(p, P, dt) {
      if (!P.stuck) return false;
      const G = p.game; P.act -= dt; P.cd -= dt;
      if (!P.head.visible && P.cd <= 0) { P.head.visible = true; G.audio.playAt('S_JumpPad', P.pos, 0.7, 1.4); G.fx.sparks(P.pos.clone().add(V3(0, 40, 0)), UP, [1, 0.8, 0.3], 8); }
      if (P.head.visible) { P.head.position.y = 16 + Math.sin(P.age * 9) * 5; P.head.rotation.z = Math.sin(P.age * 6) * 0.18; }
      if (P.cd <= 0) {
        const top = P.pos.clone().add(V3(0, 62, 0)); let best = null, bd = 1500;
        for (const E of G.enemies) { if (E.dead || E.emerging || E.burrowed) continue; const d = E.pos.distanceTo(top); if (d < bd && G.phys.lineOfSight(top, E.pos)) { bd = d; best = E; } }
        P.cd = 0.25 / (1 + Math.max(0, p.stat('FireRate')));
        if (best) { const dir = best.pos.clone().sub(top).normalize(); P.head.rotation.y = Math.atan2(-dir.x, -dir.z); G.fx.tracer(top, best.pos, [1, 0.6, 0.8], 3, 0.06); G.fx.flash(top, [1, 0.6, 0.8], 40, 0.06, false); if (Math.random() < 0.4) G.audio.playAt('S_HitMarker', top, 0.5, 0.8); asShot(p, ctxOf(P.sx, { box: P }), () => p.dealDamage(best, P.dmg0, best.pos, dir, false, 0.5, false)); }
      }
      if (P.act <= 0 || P.age > P.life - 0.2) { const at = P.pos.clone().add(V3(0, 30, 0)); G.projectiles.kill(P); asShot(p, ctxOf(P.sx), () => p.explodeAt(at, P.splash, P.dmg0 * 5, 0.5, false, false, [1, 0.45, 0.7], null)); say(p, at, 'FINALE', [1, 0.55, 0.8]); }
      return true;
    },
    kill(p, E, C) { if (C.box && !C.box.done) C.box.act = Math.min(16, C.box.act + 1); },
    hud: (p) => { const L = (p.sgBoxes || []).filter((q) => !q.done && q.stuck); return L.length ? [`ON STAGE  ${L.map((q) => Math.max(0, q.act).toFixed(0) + 's').join('  ')}`, '#ff8ac0'] : null; },
  },
  'William Tell': {
    name: 'Bullseye', short: 'A crossbow you hold to draw. Loose it the instant it is full: a certain crit that pierces.',
    text: 'Hold the trigger to draw and let go to loose: the longer the draw, the harder and flatter the bolt. Loose it in the instant the string reaches full and it is a bullseye: a certain crit that goes through three more and puts the bolt back in the quiver. No other crits.',
    play: 'Count the draw. One bolt at the right moment is worth five snapped off early.', fav: ['Hollow Tip', 'Marksman Scope', 'Heavy Rounds'], aff: { CritDamage: 1.5, HeadshotDamage: 1.5 }, noCrit: true,
    snd: ['S_Swing', 0.8, 1.7],
    charge(p, S, W, g, dt, held) {
      if (held) { g.draw = Math.min(1.6, (g.draw || 0) + dt / (0.75 / (1 + Math.max(0, p.stat('FireRate'))))); if (!g.was) p.play('S_Rack', 0.3, 0.7); g.was = true; return false; }
      if (g.was) { g.was = false; g.rel = g.draw; g.draw = 0; return g.rel > 0.12; }
      g.draw = 0; return false;
    },
    bar: (p, S, W, g) => (g.draw > 0 ? { v: g.draw / 1.6, a: 1 / 1.6, b: 1.2 / 1.6, fill: true } : null),
    shot(p, S, W, g, C) {
      const r = g.rel || 0, d = Math.min(1, r); C.draw = d; C.mult *= 0.2 + 0.8 * d;
      if (r >= 1 && r <= 1.2) { C.forceCrit = true; C.pierce += 3; C.mult *= 1.25; S.reserve++; say(p, front(p), 'BULLSEYE', GOLD, 1.25); p.play('S_Crit', 0.6, 1.2); p.fovKick += 3; }
    },
    fire(p, S, W, g, C, F) { const P = p.fireProjectile(F.muzzle, F.pdir, F.damage, 1, W); P.vel.multiplyScalar(0.4 + 0.6 * C.draw); P.gravity = 0.55 * (1 - C.draw); P.life = 4; },
    after(p) { p.startReload(); },
  },
  // ------------------------------------------------------------------ held and swung
  'Wrecking Ball': {
    name: 'Momentum', short: 'An iron ball on a chain, held where you aim. The faster you swing it, the harder it hits.',
    text: 'Hold the trigger and an iron ball hangs on its chain where you are looking, crushing whatever it touches. Swing your aim and the ball swings with it: the faster it is moving, the harder it hits, up to three times, and it bats them aside.',
    play: 'Do not point it at them. Sweep it through them. A flick of the wrist is the difference between a nudge and a demolition.', fav: ['Extended Mag', 'Feed Loop', 'Heavy Rounds'], aff: { MagSize: 1.5, AmmoSave: 2 },
    snd: ['S_Chain', 0.45, 0.8],
    fire(p, S, W, g, C, F) {
      const G = p.game, T = G.time, wall = G.phys.raycast(F.eye, F.dir, W.range); let d = Math.max(170, (wall ? wall.distance : W.range) - 55);
      for (const E of G.enemies) { if (E.dead || E.burrowed) continue; const t = G.rayEnemy(F.eye, F.dir, d, E, 20); if (t !== null && t < d) d = Math.max(170, t + 20); }   // it stops on the first thing in the way
      const at = F.eye.clone().addScaledVector(F.dir, d);
      const fresh = p.sgBallAt && T - (p.sgBallT || 0) < 0.25, sw = fresh ? at.clone().sub(p.sgBallAt) : V3(0, 0, 0), sp = fresh ? sw.length() / Math.max(0.016, T - p.sgBallT) : 0;
      p.sgBallAt = at.clone(); p.sgBallT = T;
      const m = 1 + Math.min(2, sp / 1400); g.m = m; g.mT = T;
      if (!p.sgBall || p.sgBall.done) p.sgBall = G.projectiles.spawn({ pos: at.clone(), vel: V3(0, 0, 0), damage: 0, life: 9999, kind: 'Ball', radius: 36, color: [0.5, 0.52, 0.58], ghost: true, stuck: true });
      p.sgBall.pos.copy(at); G.fx.tracer(F.muzzle, at, [0.42, 0.43, 0.48], 3.5, 0.07);
      const push = sw.lengthSq() > 1 ? sw.clone().normalize() : F.dir;
      for (const E of near(G, at, 150, null)) { if (E.pos.distanceTo(at) > 105 + E.radius) continue; p.dealDamage(E, F.damage * m, at, push, false, 0.25, false); if (!E.dead && !E.isBoss && sp > 700) E.applyKnock(V3(push.x * Math.min(620, sp * 0.3), 150, push.z * Math.min(620, sp * 0.3))); }
      if (m > 2.4 && T > (g.sayT || 0)) { g.sayT = T + 1.2; G.audio.playAt('S_Slam', at, 0.5, 1.2); }
    },
    hud: (p, S, W, g) => (g.mT > T_(p) - 0.3 && g.m > 1.15 ? [`MOMENTUM  x${g.m.toFixed(1)}`, g.m > 2.4 ? '#ff7a4a' : '#ffb347'] : null),
  },
  Bullwhip: {
    name: 'Crack', short: 'Never runs dry. The tip of the whip hits double, always crits, and stuns.',
    text: 'A whip needs no ammunition. It lashes the first three things in a line out to ten metres, and whatever is at the very tip, the last metre and a half, takes double damage as a certain crit and is stunned. No other crits.',
    play: 'A range to keep, not a range to close: back up until they are at the end of the whip, and hold them there.', fav: ['Hollow Tip', 'Rapid Bolt', 'Serrated'], aff: { CritDamage: 1.5 }, noCrit: true,
    free: true, snd: ['S_Swing', 0.8, 1.35], ammo: () => ['WHIP', 'NEVER RUNS DRY'],
    fire(p, S, W, g, C, F) {
      const G = p.game, R = W.range, wall = G.phys.raycast(F.eye, F.dir, R), reach = wall ? wall.distance : R, end = F.eye.clone().addScaledVector(F.dir, reach);
      let tip = false; const L = [];
      for (const E of G.enemies) { if (E.dead || E.burrowed) continue; const d = inCone(F.eye, F.dir, E, reach, 0.14); if (d >= 0) L.push([d, E]); }
      L.sort((a, b) => b[0] - a[0]);   // the far end of the whip is the business end
      for (const [d, E] of L.slice(0, 3)) {
        const isTip = d > R * 0.86 - E.radius; C.forceCrit = isTip;
        p.dealDamage(E, F.damage * (isTip ? 2 : 1), E.pos, F.dir, false, 1, false);
        if (isTip) { tip = true; if (!E.dead) p.stun(E, 0.7); G.fx.sparks(E.pos, F.dir.clone().negate(), [1, 0.95, 0.8], 8); }
      }
      C.forceCrit = false;
      const mid = F.muzzle.clone().lerp(end, 0.5).add(V3(0, 40, 0)); G.fx.tracer(F.muzzle, mid, [0.42, 0.26, 0.14], 4, 0.12); G.fx.tracer(mid, end, [0.42, 0.26, 0.14], 3, 0.12);
      if (tip) { p.play('S_Crit', 0.7, 1.5); G.fx.flash(end, [1, 0.95, 0.8], 90, 0.08, true); if (G.time > (g.sayT || 0)) { g.sayT = G.time + 0.8; say(p, end, 'CRACK', [1, 0.95, 0.8], 1.15); } }
      else if (wall) G.fx.sparks(end, wall.normal, [1, 0.9, 0.7], 4);
    },
  },
  'High Striker': {
    name: 'Ring the Bell', short: 'A mallet with a meter that never stops. Strike at the top: triple damage and everything flies.',
    text: 'The meter runs up and down by itself. The mallet sends a shockwave along the ground as strong as the meter when you swing. Swing with it at the top and the bell rings: triple damage, a longer wave, and everything it touches goes up in the air, stunned.',
    play: 'Watch the meter, not the enemy. A full swing every second beats three weak ones.', fav: ['Heavy Rounds', 'Blast Cap', 'Extended Mag'], aff: { ExplosionRadius: 1.5 },
    snd: ['S_SwingBig', 0.8, 0.75],
    meter(p, g) { const per = 1.15 / (1 + 0.5 * Math.max(0, p.stat('FireRate'))), x = (T_(p) % per) / per; return x < 0.5 ? x * 2 : 2 - x * 2; },
    bar(p, S, W, g) { return { v: this.meter(p, g), a: 0.86, b: 1 }; },
    shot(p, S, W, g, C) { const m = this.meter(p, g); C.pow = m; if (m >= 0.86) { C.ding = true; C.mult *= 3; p.play('S_Bell', 0.8, 1.25); say(p, front(p), 'DING!', GOLD, 1.4); p.addShake(1); } else C.mult *= 0.4 + 0.7 * m; },
    fire(p, S, W, g, C, F) {
      const G = p.game, fl = V3(F.dir.x, 0, F.dir.z).normalize(), y = p.pos.y - 85, n = C.ding ? 5 : 3, R = W.splash * (1 + p.stat('ExplosionRadius')), C2 = ctxOf(C), o = p.pos.clone();
      for (let k = 0; k < n; k++) later(p, 0.06 + 0.07 * k, () => {
        const at = V3(o.x + fl.x * (240 + 250 * k), y + 30, o.z + fl.z * (240 + 250 * k));
        asShot(p, C2, () => p.explodeAt(at, R, F.damage, 0.5, false, false, C.ding ? GOLD : [0.9, 0.5, 0.3], null));
        if (C.ding) for (const E of near(G, at, R + 30, null)) if (!E.isBoss) { E.launch(V3(E.vel.x * 0.3, 900, E.vel.z * 0.3)); p.stun(E, 1.5); }
      });
    },
  },
  // ------------------------------------------------------------------ light and sound
  'Hall of Mirrors': {
    name: 'Bank Shot', short: 'A beam that bounces off walls three times, 50% stronger after each bounce.',
    text: 'A beam of light that goes through everything and bounces off three walls. Every bounce makes it half as strong again, and each new leg can hit the same enemy again. Each ricochet part is two more bounces.',
    play: 'The straight shot is the weak one. Find the corner that sends it back through the room twice.', fav: ['Ricochet', 'Heavy Rounds', 'Hollow Tip'], aff: { Ricochet: 1 },
    fire(p, S, W, g, C, F) {
      const G = p.game, col = [1, 0.4, 0.85], n = 3 + 2 * Math.round(Math.max(0, p.stat('Ricochet')));
      let from = F.eye.clone(), dir = F.dir.clone(), dmg = F.damage, mz = F.muzzle;
      for (let b = 0; b <= n; b++) {
        const wall = G.phys.raycast(from, dir, 4500), len = wall ? wall.distance : 4500;
        p.fireHitscan(from, dir, len + 2, dmg, 99, F.procCoef, W, 5 + b * 2, col, mz);
        if (!wall) break;
        G.fx.flash(wall.point, col, 70 + b * 25, 0.1, false);
        from = wall.point.clone().addScaledVector(wall.normal, 4); mz = from; dir = dir.clone().addScaledVector(wall.normal, -2 * dir.dot(wall.normal)).normalize(); dmg *= 1.5;
      }
    },
  },
  Calliope: {
    name: 'On the Beat', short: 'A steam organ. Fire in time and every blast builds: +25% a note, up to triple.',
    text: 'It blasts a wide cone of sound that throws them back. It has a beat, shown under the crosshair: fire on it and the tempo builds, 25% more damage and a wider blast for every note, up to eight. Fire off the beat and you start again.',
    play: 'You can mash it faster than the beat, and you should not. Two shots a second, in time, is three times the gun.', fav: ['Heavy Rounds', 'Extended Mag', 'Quick Hands'], aff: { MagSize: 1.5 },
    beat: (p) => 0.5 / (1 + 0.5 * Math.max(0, p.stat('FireRate'))),
    shot(p, S, W, g, C) { const T = T_(p), b = this.beat(p), on = Math.abs(T - (g.lastT || -9) - b) < 0.09; g.combo = on ? Math.min(8, (g.combo || 0) + 1) : 0; g.lastT = T; C.combo = g.combo; C.mult *= 1 + 0.25 * g.combo; if (g.combo === 8 && !g.full) { g.full = true; say(p, front(p), 'FULL STEAM', GOLD, 1.3); p.play('S_Bell', 0.5, 1.5); } if (!on) g.full = false; },
    fire(p, S, W, g, C, F) {
      const G = p.game, half = 0.42 + 0.035 * C.combo, R = W.range, col = [1, 0.85 - 0.05 * C.combo, 0.35];
      for (const E of G.enemies) { if (E.dead || E.burrowed) continue; const d = inCone(F.eye, F.dir, E, R, half); if (d < 0 || !G.phys.lineOfSight(F.eye, E.pos)) continue; p.dealDamage(E, F.damage * (1 - 0.5 * d / R), E.pos, F.dir, false, 1, false); if (!E.dead) E.applyKnock(V3(F.dir.x * (340 + 50 * C.combo), 160, F.dir.z * (340 + 50 * C.combo))); }
      for (let k = 1; k <= 3; k++) { const at = F.eye.clone().addScaledVector(F.dir, R * k / 3.4); G.fx.ring(V3(at.x, p.pos.y - 80, at.z), 70 + k * 80 * (1 + 0.08 * C.combo), col, 0.22 + 0.04 * k); G.fx.puff(at, [1, 1, 1], 40 + 20 * k, 0.3, F.dir.clone().multiplyScalar(500)); }
    },
    bar(p, S, W, g) { const b = this.beat(p), x = (T_(p) - (g.lastT || -9)) / b; return x > 1.6 ? null : { v: x / 1.6, a: (1 - 0.09 / b) / 1.6, b: (1 + 0.09 / b) / 1.6 }; },
    tick(p, S, W, g) { if (g.combo > 0 && T_(p) - (g.lastT || 0) > this.beat(p) * 1.6) { g.combo = 0; g.full = false; } },
    hud: (p, S, W, g) => (g.combo > 0 ? [`TEMPO  ${g.combo}/8   +${g.combo * 25}%`, g.combo >= 8 ? '#ffd23a' : '#ffb347'] : null),
  },
  // ------------------------------------------------------------------ ropes, wires and traps for the other gun
  Lariat: {
    name: 'Hogtie', short: 'Throws a loop that closes on up to four enemies, drags them together and slows them. Damage to one is felt by the others at half.',
    text: 'The loop opens where it lands and closes on up to four enemies inside it: each takes the hit, is dragged in toward the middle and slowed. While they are on the rope, whatever you do to one of them, with any weapon, the others feel half of. A new throw renews the rope on all.',
    play: 'Throw it into the thick of a pack, then hit the one in the middle with anything that splashes.', fav: ['Extended Mag', 'Quick Hands', 'Cryo Cell'], aff: { ReloadSpeed: 1.5 }, proc: { Freeze: 2 },
    snd: ['S_Swing', 0.7, 1.1],
    fire(p, S, W, g, C, F) {
      const G = p.game, wall = G.phys.raycast(F.eye, F.dir, W.range), col = [0.86, 0.72, 0.46]; let best = null, bt = wall ? wall.distance : W.range;
      // a loop, not a bullet: anything the throw passes close to is the target
      for (const E of G.enemies) { if (E.dead || E.burrowed || E.emerging) continue; const t = G.rayEnemy(F.eye, F.dir, bt, E, 70); if (t !== null && t < bt) { bt = t; best = E; } }
      const at = best ? best.pos.clone() : F.eye.clone().addScaledVector(F.dir, bt), R = 200, foot = best ? best.pos.y - (best.half || 60) : at.y;
      G.fx.tracer(F.muzzle, at, col, 3, 0.22); G.fx.ring(V3(at.x, foot + 4, at.z), R, col, 0.35);
      const eyeAt = V3(at.x, Math.max(at.y, foot + 60), at.z);
      const caught = near(G, at, R + 40).filter((E) => !E.burrowed && (E === best || G.phys.lineOfSight(eyeAt, E.pos))).sort((a, b) => (a === best ? -1 : b === best ? 1 : a.pos.distanceTo(at) - b.pos.distanceTo(at))).slice(0, 4);
      if (!caught.length) return;
      // the throw itself lands on each of them in full (not shared: they are not on the rope yet)
      for (const E of caught) { p.dealDamage(E, F.damage, E.pos, F.dir, false, 1, false); if (E !== best && !E.dead) G.fx.tracer(at, E.pos, col, 2, 0.3); }
      const live = caught.filter((E) => !E.dead); if (!live.length) return;
      const H = p.sgHerd = (p.sgHerd || []).filter((E) => !E.dead && E.sgRope > G.time && !live.includes(E));
      H.push(...live); while (H.length > 4) H.shift().sgRope = 0;
      for (const E of H) { E.sgRope = G.time + 8; E.applySlow(live.includes(E) ? W.slow : 0.25, live.includes(E) ? 6 : 8); }
      // and the loop pulls tight: they are dragged in toward the middle of it
      for (const E of live) { const d = V3(at.x - E.pos.x, 0, at.z - E.pos.z), L = d.length(); if (L > 40) E.applyKnock(d.multiplyScalar(Math.min(420, 160 + L * 1.6) / L).add(V3(0, 140, 0))); }
      p.game.audio.playAt('S_Slide', at, 0.5, 0.7);
      say(p, at, live.length > 1 ? `ROPED  ${live.length}` : 'ROPED', [0.9, 0.78, 0.5]);
    },
    hud: (p) => { const n = (p.sgHerd || []).filter((E) => !E.dead && E.sgRope > T_(p)).length; return n ? [`ON THE ROPE  ${n}/4`, '#d8b878'] : null; },
  },
  'Live Wire': {
    name: 'Perimeter', short: 'Plants rods. Lightning runs between them and burns whatever crosses the line.',
    text: 'It plants a rod wherever it lands, three at a time. Lightning runs between every pair in sight of each other and burns, slows and softens up (+20% from everything) whatever crosses the line. Every extra link makes all of them 25% stronger.',
    play: 'Draw a triangle round the place they have to walk through, then stand in the middle of it.', fav: ['Extended Mag', 'Arc Coil', 'Cryo Cell'], aff: { MagSize: 1.5 }, proc: { Chain: 2 },
    fire(p, S, W, g, C, F) { const P = p.fireProjectile(F.muzzle, F.pdir, F.damage * 2, 1, W); P.gravity = 0.25; P.life = 28; P.pierce = 99; P.dmg0 = F.damage; },
    pWall(p, P, wall) { stick(P, wall, true); keep(p, 'sgRods', P, Math.max(3, p.magSize(P.sx.S))); p.game.audio.playAt('S_Zap', P.pos, 0.5, 0.8); return true; },
    pTick: (p, P) => P.stuck,
    hud: (p) => { const n = (p.sgRods || []).filter((q) => !q.done && q.stuck).length; return n ? [`RODS  ${n}   LINKS  ${p.sgLinks || 0}`, '#9fdcff'] : null; },
  },
  Gusher: {
    name: 'Strike a Match', short: 'Sprays oil that slows and soaks. Any fire, or your reload key, sets the lot off.',
    text: 'It sprays crude oil: almost no damage, but it slows them and soaks in, up to forty coats. The moment anything oiled catches fire, from any source, it goes up, with every coat adding to the blast and the fire jumping to the next. The reload key strikes a match.',
    play: 'Hose the whole pack down first. Light it once. Fire parts, fire grenades and your other gun are all matches too.', fav: ['Extended Mag', 'Incendiary', 'Blast Cap'], aff: { MagSize: 1.5, ExplosionRadius: 1.5 }, proc: { Ignite: 2 },
    snd: ['S_Slide', 0.35, 1.5],
    fire(p, S, W, g, C, F) {
      const G = p.game;
      for (let k = 0; k < 2; k++) { const d = cone(F.dir, F.spread || 0.1); p.fireHitscan(F.eye, d, W.range, F.damage, 3, 0.25, W, 0, [0.1, 0.09, 0.08], F.muzzle);
        G.fx.add({ pos: F.muzzle.clone().addScaledVector(d, 20), vel: d.clone().multiplyScalar(900 + Math.random() * 400).add(p.vel), drag: 1.2, gravity: 520, life: 0.42 + k * 0.08, size0: 14, size1: 64 + 20 * k, rot: Math.random() * 360, rotVel: 120, c0: [0.09, 0.075, 0.06, 1], c1: [0.03, 0.025, 0.02, 0.85], fadeOut: 0.35, tex: 'FX_Puff', glow: 0 }); }
    },
    post(p, E, C, g, h) { if (h.killed) return; const T = T_(p); E.sgOil = Math.min(40, (E.sgOilT > T ? E.sgOil || 0 : 0) + 1); E.sgOilT = T + 12; E.sgOilD = Math.max(E.sgOilD || 0, C.base); E.applySlow(0.35, 1.5); },
    rkey(p, S, W, g) {
      const G = p.game; if (G.time < (g.mCd || 0)) return S.ammo >= p.magSize(S);
      let n = 0; for (const E of G.enemies) if (!E.dead && E.sgOil > 0 && E.sgOilT > G.time && E.pos.distanceTo(p.pos) < 2200) { E.applyBurn(Math.max(8, (E.sgOilD || 5) * 3), 3); n++; }
      if (n) { g.mCd = G.time + 0.8; p.play('S_Flame', 0.8, 1.2); say(p, front(p), 'STRIKE A MATCH', [1, 0.6, 0.2], 1.2); }
      return S.ammo >= p.magSize(S);
    },
  },
  // ------------------------------------------------------------------ games of chance
  'Loaded Dice': {
    name: 'Let It Ride', short: 'Throws two dice. The blast is as big as the roll, doubles do something special.',
    text: 'It throws a pair of exploding dice, and each die hits as hard as the number it shows. Snake eyes freezes everything nearby; boxcars is a triple blast; any other double goes off twice. A throw of seven or more adds 15% to the next, and it keeps riding until you roll low.',
    play: 'A gamble with good odds. Extra projectiles are extra dice, and three dice roll doubles a lot more often.', fav: ['Split Barrel', 'Blast Cap', 'Heavy Rounds'], aff: { Multishot: 1.5, ExplosionRadius: 1.5 },
    snd: ['S_SlotStop', 0.7, 0.9],
    shot(p, S, W, g, C) { C.mult *= 1 + 0.15 * (g.hot || 0); },
    fire(p, S, W, g, C, F) {
      const n = 1 + Math.max(1, F.pellets), rolls = [], dice = [];
      for (let k = 0; k < n; k++) { const r = 1 + Math.floor(Math.random() * 6); rolls.push(r); const P = p.fireProjectile(F.muzzle, cone(F.pdir, 0.07), F.damage * r / 3.5, 0.5, W); P.gravity = 1; P.vel.y += 250; P.bounces = 2; P.bounceDamp = 0.45; P.fuse = 0.95 + k * 0.08; P.spin = 15; P.roll = r; dice.push(P); }
      const tot = rolls.reduce((a, b) => a + b, 0), dbl = rolls.every((r) => r === rolls[0]);
      let msg = `${rolls.join(' + ')}`, col = [0.95, 0.93, 0.85];
      if (dbl && rolls[0] === 1) { msg = 'SNAKE EYES'; col = [0.6, 0.9, 1]; for (const P of dice) P.snake = true; }
      else if (dbl && rolls[0] === 6) { msg = 'BOXCARS'; col = GOLD; for (const P of dice) { P.damage *= 3; P.splash *= 1.5; } }
      else if (dbl) { msg = `DOUBLE ${rolls[0]}S`; col = [1, 0.7, 0.4]; for (const P of dice) P.again = true; }
      g.hot = tot >= 3.5 * n ? Math.min(6, (g.hot || 0) + 1) : 0;
      say(p, front(p), msg, col, dbl ? 1.3 : 1);
    },
    pEnd(p, P, at) {
      const G = p.game; G.hud.floater(at.clone().add(V3(0, 90, 0)), `${P.roll}`, [0.95, 0.93, 0.85], 1.3);
      if (P.snake) { G.fx.frostBurst(at, 460); for (const E of near(G, at, 460, null)) { p.stun(E, 2.5); E.applySlow(0.7, 4); } }
      if (P.again) { const C2 = ctxOf(P.sx), d = P.damage, r = P.splash; later(p, 0.3, () => asShot(p, C2, () => p.explodeAt(at, r, d, 0.5, false, false, [1, 0.7, 0.4], null))); }
    },
    hud: (p, S, W, g) => (g.hot > 0 ? [`LET IT RIDE  +${g.hot * 15}%`, g.hot >= 6 ? '#ffd23a' : '#ffb347'] : null),
  },
  'House Edge': {
    name: 'Raise', short: 'Fires chips and is fed with money. Hold the trigger to raise: dearer and deadlier.',
    text: 'It shoots chips and it is loaded with your money: a dollar a chip to start. Every chip in a burst raises the stake, another dollar every third chip and 5% more damage every one, up to +165%. A kill pays $15 plus three times the stake. Broke, it fires at 40%.',
    play: 'Short bursts are cheap and weak; long ones are ruinous and devastating. Kill with the big chips and it pays for itself.', fav: ['Hollow Tip', 'Heavy Rounds', 'Rapid Bolt'], aff: { MoneyGain: 1.5 }, proc: { Money: 2 },
    free: true, stake: (g) => 1 + Math.floor((g.raise || 0) / 3),
    ammo(p, S, W, g) { return ['$' + this.stake(g), 'A CHIP']; },
    shot(p, S, W, g, C) {
      const T = T_(p); if (T - (g.lastT || -9) > 0.5) g.raise = 0; g.lastT = T;
      const st = this.stake(g) * 10;
      if (p.money >= st) { p.money -= st; C.stake = st; C.mult *= 1 + 0.05 * (g.raise || 0); C.tracer = [0.3 + 0.02 * (g.raise || 0), 0.85, 0.45]; }
      else { C.mult *= 0.4; C.stake = 0; if (T > (g.sayT || 0)) { g.sayT = T + 2; say(p, front(p), 'BROKE', [1, 0.4, 0.35]); } }
      g.raise = Math.min(33, (g.raise || 0) + 1);
    },
    kill(p, E, C) { if (C.stake && !C.paid) { C.paid = true; p.addMoney(150 + C.stake * 3, true); } },
    tick(p, S, W, g) { if (g.raise > 0 && T_(p) - (g.lastT || 0) > 0.5) g.raise = 0; },
    hud: (p, S, W, g) => (g.raise > 1 ? [`RAISE  +${g.raise * 5}%`, g.raise >= 33 ? '#ffd23a' : '#7fe0a0'] : null),
  },
  "Dead Man's Hand": {
    name: 'Showdown', short: 'Five cards to a magazine. The fifth hits as hard as the poker hand you were dealt.',
    text: 'Every magazine is five thrown cards, dealt at random, and the hand shows under the crosshair. The fifth card is the showdown: it hits as hard as the hand is good, a pair twice, a flush six times, four of a kind nine, and bursts. Aces and eights is the dead man\'s hand: ten.',
    play: 'Four cards to soften them, one to end it. Save the fifth for the thing the hand deserves, and reload fast for the next deal.', fav: ['Quick Hands', 'Hollow Tip', 'Heavy Rounds'], aff: { ReloadSpeed: 2, CritDamage: 1.5 },
    mag: () => 5, snd: ['S_Blade', 0.6, 1.5],
    shot(p, S, W, g, C) {
      if (!g.hand || g.hand.length >= 5) g.hand = [];
      const r = g.hand.length && Math.random() < 0.2 ? g.hand[Math.floor(Math.random() * g.hand.length)][0] : Math.floor(Math.random() * 7);
      g.hand.push([r, Math.floor(Math.random() * 4)]);
      if (g.hand.length === 5) { const H = pokerHand(g.hand); C.hand = H[1]; C.mult *= H[1]; say(p, front(p), H[0], H[1] >= 5 ? GOLD : [0.95, 0.95, 1], H[1] >= 5 ? 1.4 : 1.1); if (H[1] >= 4) p.play('S_Jackpot', 0.6, 1.2); C.pierce -= 1; }
    },
    fire(p, S, W, g, C, F) { const P = p.fireProjectile(F.muzzle, F.pdir, F.damage, 1, W); P.spin = 18; if (C.hand) { P.pierce = 0; if (C.hand > 1) { P.splash = (170 + 22 * C.hand) * (1 + p.stat('ExplosionRadius')); P.color = GOLD; P.glowSize = 150; } } },
    reload(p, S, W, g) { g.hand = []; },
    hud: (p, S, W, g) => (g.hand && g.hand.length ? [g.hand.map((c) => RANK[c[0]] + SUIT[c[1]]).join('  '), g.hand.length >= 4 ? '#ffd23a' : '#e8e4f0'] : null),
  },
  'One-Armed Bandit': {
    name: 'Pull the Lever', short: 'Every reload spins three reels that decide what the magazine does.',
    text: 'Every reload spins three reels and the magazine does what they say. Cherries burn, bells arc to the enemy beside the one you hit, bars burst every third round, sevens crit and pay. Two the same doubles it. Three the same is the jackpot: all of it twice over and half as much damage again.',
    play: 'Do not like the spin? Reload. Reload speed is how often you get to pull, and a jackpot magazine is worth waiting for.', fav: ['Quick Hands', 'Extended Mag', 'Keen Sight'], aff: { ReloadSpeed: 2 },
    spin(p, g) {
      const r = []; for (let k = 0; k < 3; k++) r.push(k && Math.random() < 0.3 ? r[k - 1] : Math.floor(Math.random() * 4));
      g.reels = r; g.jack = r[0] === r[1] && r[1] === r[2]; g.shotN = 0;
      say(p, front(p), g.jack ? `JACKPOT  ${REEL[r[0]]}` : r.map((k) => REEL[k]).join(' - '), g.jack ? GOLD : [0.95, 0.9, 0.75], g.jack ? 1.4 : 1); p.play(g.jack ? 'S_Jackpot' : 'S_SlotStop', g.jack ? 0.8 : 0.6);
    },
    n: (g, k) => (g.reels ? g.reels.filter((x) => x === k).length * (g.jack ? 2 : 1) : 0),
    reload(p, S, W, g) { this.spin(p, g); },
    shot(p, S, W, g, C) { if (!g.reels) this.spin(p, g); g.shotN = (g.shotN || 0) + 1; if (g.jack) { C.mult *= 1.5; C.tracer = GOLD; } },
    critAdd(p, E, C, g) { return 0.12 * this.n(g, 3); },
    post(p, E, C, g, h) {
      const G = p.game, ch = this.n(g, 0), be = this.n(g, 1), ba = this.n(g, 2), sv = this.n(g, 3);
      if (ch && !h.killed) E.applyBurn(h.dealt * 0.25 * ch, 3);
      if (sv && !h.killed) p.addMoney(10 * sv, true);
      if (be && G.time > (g.arcT || 0)) { g.arcT = G.time + 0.14; let k = 0; for (const O of near(G, E.pos, 620, E)) { if (k++ >= Math.min(3, be)) break; G.fx.arc(E.pos, O.pos, [0.6, 0.85, 1]); p.dealDamage(O, h.dealt * 0.35, O.pos, V3(0, 0, 0), false, 0, true, 0, 0, 0, 0, [0.6, 0.85, 1]); } }
      if (ba && g.shotN % 3 === 0 && !C.barDone) { C.barDone = true; p.explodeAt(h.at, 150 * (1 + p.stat('ExplosionRadius')), C.base * 0.6 * ba, 0, true, false, [1, 0.6, 0.25], E); }
    },
    hud: (p, S, W, g) => (g.reels ? [(g.jack ? 'JACKPOT  ' : '') + g.reels.map((k) => REEL[k]).join(' - '), g.jack ? '#ffd23a' : '#e8dcc0'] : null),
  },
  // ------------------------------------------------------------------ paid for in blood
  Sawbones: {
    name: 'Bad Medicine', short: 'Loaded with your own health. The more you are missing, the harder it hits. Kills heal.',
    text: 'It has no magazine: every shot is four of your own health. It hits 1% harder for every 1% of health you are missing, up to double, and every kill gives fourteen back. At the last few points it stops charging you and fires at half.',
    play: 'The best version of this gun is the one held by somebody nearly dead. Decide how close you want to stand to that.', fav: ['Leech Rounds', 'Vitality', 'Mending'], aff: { Lifesteal: 2 },
    free: true, ammo: (p) => [`${Math.max(0, Math.round(p.health))}`, 'HEALTH IS AMMO'],
    miss: (p) => clamp(1 - p.health / Math.max(1, p.maxHealth), 0, 1),
    sheet(p) { return { dmg: 1 + this.miss(p) }; },
    shot(p, S, W, g, C) { if (p.health > 6) { p.health -= 4; p.sinceDamage = Math.min(p.sinceDamage || 0, 2); } else C.mult *= 0.5; C.mult *= 1 + this.miss(p); },
    kill(p, E, C) { if (!C.fed) { C.fed = true; p.heal(14); } },
    hud(p) { const m = this.miss(p); return m > 0.05 ? [`BAD MEDICINE  +${Math.round(m * 100)}%`, m > 0.6 ? '#ff5a4a' : '#ff9a8a'] : null; },
  },
  'Barn Door': {
    name: 'Bar the Door', short: 'Aim to raise the door: it stops 70% from the front and the next blast gives it back threefold.',
    text: 'A shotgun bolted to a door. Aim and the door is up: it stops 70% of whatever hits you from the front and keeps it. The next blast gives it back, three times over, shared across the pellets.',
    play: 'Take the hit on purpose. Aim into the charge, let it land on the door, and answer it.', fav: ['Plating', 'Vitality', 'Heavy Rounds'],
    cap: (p) => 120 + p.maxHealth * 0.5,
    hurt(p, S, W, g, amount, source) {
      if (!p.aiming) return amount;
      if (source && source.pos) { const to = source.pos.clone().sub(p.pos); to.y = 0; if (to.lengthSq() > 1 && to.normalize().dot(p.forward()) < 0.15) return amount; }
      const b = amount * 0.7, G = p.game; g.store = Math.min(this.cap(p), (g.store || 0) + b);
      if (G.time > (g.fxT || 0)) { g.fxT = G.time + 0.2; p.play('S_Ricochet', 0.7, 0.7, 0.05); G.fx.sparks(front(p), p.forward().negate(), [1, 0.85, 0.5], 6); say(p, front(p), 'BARRED', [0.9, 0.8, 0.6], 0.9); }
      return amount - b;
    },
    shot(p, S, W, g, C) { if (g.store > 1) { C.mult *= 1 + g.store * 3 / (W.dmg * W.pellets * (1 + 0.2 * S.tier)); C.tracer = [1, 0.7, 0.3]; if (g.store > 40) { say(p, front(p), 'PAYBACK', [1, 0.7, 0.3], 1.2); p.addShake(0.6); } g.store = 0; } },
    bar(p, S, W, g) { return g.store > 1 ? { v: g.store / this.cap(p), a: 0.999, b: 1, fill: true, col: '#ffb347' } : null; },
    hud: (p, S, W, g) => (g.store > 1 ? [`STORED  ${Math.round(g.store)}`, '#ffb347'] : p.aiming ? ['DOOR UP', '#d8c890'] : null),
  },
  'Old Faithful': {
    name: 'Pressure', short: 'Steam, no ammo. Hotter is stronger, up to double. Vent it with reload before it scalds you.',
    text: 'It runs on pressure, not ammunition. The longer you fire the hotter the steam and the harder it hits, up to double. Let it reach the top and it scalds you and locks for two seconds. The reload key vents it instead: a blast all round you, as big as the pressure you had.',
    play: 'Ride it to nine-tenths, walk into the middle of them, and vent. Then do it again.', fav: ['Heavy Rounds', 'Blast Cap', 'Plating'], aff: { ExplosionRadius: 1.5 },
    free: true, snd: ['S_Slide', 0.3, 2],
    ammo: (p, S, W, g) => [`${Math.round((g.h || 0) * 100)}%`, T_(p) < (g.lock || 0) ? 'SCALDED' : 'PRESSURE'],
    can: (p, S, W, g) => !(T_(p) < (g.lock || 0)),
    shot(p, S, W, g, C) {
      g.h = Math.min(1, (g.h || 0) + 0.0125); g.fT = T_(p); C.mult *= 1 + g.h;
      if (g.h >= 1) { g.h = 0; g.lock = T_(p) + 2; p.health = Math.max(1, p.health - 12); p.play('S_Hurt', 0.7); say(p, front(p), 'SCALDED', [1, 0.5, 0.4], 1.2); p.addShake(1); }
    },
    fire(p, S, W, g, C, F) {
      const G = p.game, d = cone(F.dir, F.spread || 0.08); p.fireHitscan(F.eye, d, W.range, F.damage, 2, 0.25, W, 0, [1, 1, 1], F.muzzle);
      G.fx.add({ pos: F.muzzle.clone().addScaledVector(d, 16), vel: d.clone().multiplyScalar(1100 + Math.random() * 300).add(p.vel), drag: 1.6, gravity: -160, life: 0.36, size0: 16, size1: 90 + 60 * (g.h || 0), rot: Math.random() * 360, rotVel: 90, c0: [1, 1, 1, 0.75], c1: [0.85, 0.92, 1, 0], fadeOut: 0.6, tex: 'FX_Puff', glow: 0.3 });
    },
    rkey(p, S, W, g) {
      const h = g.h || 0, G = p.game; if (h < 0.12 || G.time < (g.lock || 0)) return true;
      g.h = 0; g.fT = G.time; const R = (300 + 320 * h) * (1 + p.stat('ExplosionRadius')), dmg = W.dmg * (1 + 0.2 * S.tier) * 32 * h, at = p.pos.clone();
      G.fx.ring(V3(at.x, at.y - 80, at.z), R, [1, 1, 1], 0.4); for (let k = 0; k < 10; k++) { const a = k * 0.628; G.fx.puff(at.clone().add(V3(Math.cos(a) * R * 0.5, 0, Math.sin(a) * R * 0.5)), [1, 1, 1], 130, 0.6, V3(Math.cos(a) * 500, 120, Math.sin(a) * 500)); }
      p.play('S_Slam', 0.6, 1.5); p.addShake(0.8); say(p, front(p), `VENT  ${Math.round(h * 100)}%`, [0.85, 0.95, 1], 1.2);
      asShot(p, { sig: this, W, S, g, mult: 1, base: dmg, pierce: 0, chains: 0, seen: new Set(), hits: 0, gen: 0 }, () => { for (const E of near(G, at, R, null)) { p.dealDamage(E, dmg, E.pos, E.pos.clone().sub(at).normalize(), false, 0.5, false); if (!E.dead) E.applyKnock(E.pos.clone().sub(at).setY(0).normalize().multiplyScalar(650).add(V3(0, 260, 0))); } });
      return true;
    },
    tick(p, S, W, g, dt) { if (g.h > 0 && T_(p) - (g.fT || 0) > 0.45) g.h = Math.max(0, g.h - dt * 0.3); },
    bar: (p, S, W, g) => ({ v: g.h || 0, a: 0.75, b: 0.985, fill: true, col: '#cfe8f2' }),
  },
  // ------------------------------------------------------------------ things that fly on their own
  Tilt: {
    name: 'Multiball', short: 'A steel ball that bounces from enemy to enemy, 15% harder each time. Five hits: multiball.',
    text: 'It fires a steel ball that ricochets from one enemy to the next, eight times, hitting 15% harder with every bumper. The fifth hit is multiball: two more come out of it. With one target in the room it comes back round for the same one.',
    play: 'It wants a full table. Fire into the thick of it and watch the score run up.', fav: ['Ricochet', 'Heavy Rounds', 'Arc Coil'], aff: { Ricochet: 1 }, proc: 1.5,
    fire(p, S, W, g, C, F) { const P = p.fireProjectile(F.muzzle, F.pdir, F.damage, 1, W); P.bounces = 6; P.bounceDamp = 1; P.life = 6; P.pb = { n: 0, max: 8 + 2 * Math.round(Math.max(0, p.stat('Ricochet'))) }; },
    pTick(p, P) { const B = P.pb; if (B.t !== undefined && P.age - B.t > 0.3) { P.hit.clear(); B.t = undefined; } return false; },
    pHit(p, P, E, at) {
      const B = P.pb, G = p.game, sp = Math.max(1800, P.vel.length()); B.n++; P.damage *= 1.15; B.t = P.age;
      G.fx.sparks(at, UP, [0.9, 0.95, 1], 5); G.audio.playAt('S_HitMarker', at, 0.6, 0.8 + 0.08 * B.n); if (B.n > 1) G.hud.floater(at.clone().add(V3(0, 70, 0)), `x${B.n}`, [0.85, 0.92, 1], 0.9);
      if (B.n === 5 && !P.child) { say(p, at, 'MULTIBALL', GOLD, 1.3); p.play('S_Jackpot', 0.5, 1.4); for (let k = 0; k < 2; k++) { const a = Math.random() * 6.283, Q = G.projectiles.spawn({ pos: at.clone(), vel: V3(Math.cos(a) * sp, 120, Math.sin(a) * sp), damage: P.damage * 0.6, kind: 'Ball', radius: P.radius, color: P.color, life: 4, bounces: 6, bounceDamp: 1, procCoef: 0.5, sx: P.sx, homing: 4 }); Q.pb = { n: 0, max: 5 }; Q.child = true; Q.hit.add(E); } }
      if (B.n >= B.max) return undefined;
      const last = B.last || (B.last = []); last.push(E); if (last.length > 3) last.shift();   // it prefers a bumper it has not just come off
      let nx = null, nd = 1100, alt = null, ad = 1100; for (const O of G.enemies) { if (O === E || O.dead || O.burrowed || O.emerging) continue; const d = O.pos.distanceTo(at); if (!G.phys.lineOfSight(at, O.pos)) continue; if (last.includes(O)) { if (d < ad) { ad = d; alt = O; } } else if (d < nd) { nd = d; nx = O; } }
      nx = nx || alt;
      P.homing = 4; P.target = nx || E;
      if (nx) { P.vel.copy(nx.pos.clone().sub(at).normalize().multiplyScalar(sp)); P.hit.clear(); P.hit.add(E); B.t = undefined; }
      return true;
    },
  },
  Tumbleweed: {
    name: 'Snowball', short: 'Bowls a tumbleweed along the ground. It rolls through everything, growing bigger and 15% deadlier with each thing it runs over.',
    text: 'It bowls a tumbleweed along the ground in the way you are facing. It rolls straight through every enemy in its path, growing bigger and 15% deadlier with each one, ten times over, turns off walls twice, and bursts as big as it grew when it stops.',
    play: 'Bowl it down the longest line of them you can find: up a corridor, along a wall. It goes under anything flying.', fav: ['Heavy Rounds', 'Blast Cap', 'Incendiary'], aff: { ExplosionRadius: 1.5 },
    snd: ['S_SwingBig', 0.7, 0.75],
    // It does not fly: it is set down on the floor just ahead of you and rolls along it, following the ground up and
    // down slopes, until its time runs out or it has turned off two walls.
    fire(p, S, W, g, C, F) {
      const G = p.game, d = V3(F.dir.x, 0, F.dir.z); if (d.lengthSq() < 1e-4) d.set(Math.sin(p.yaw), 0, -Math.cos(p.yaw)); d.normalize();
      const P = p.fireProjectile(F.muzzle, d, F.damage, 0.6, W);
      P.gravity = 0; P.pierce = 99; P.bounces = 0; P.life = 3.2; P.tw = 0; P.wb = 0; P.spin = 0; P.group.scale.setScalar(22 / P.radius); P.radius = 22; P.roll = d; P.spd = W.projSpeed || 1300; P.dust = 0; P.air = true;
      // put it on the ground in front of you; with no floor there it drops until it finds one
      const at = F.muzzle.clone().addScaledVector(d, 40), dn = G.phys.raycastDown(at.clone().add(V3(0, 40, 0)), 520);
      if (dn) { P.pos.copy(dn.point).add(V3(0, P.radius, 0)); P.air = false; }
      P.vel.copy(d).multiplyScalar(P.spd); P.group.position.copy(P.pos);
      G.fx.puff(P.pos.clone().add(V3(0, -P.radius * 0.6, 0)), [0.62, 0.52, 0.36], 50, 0.5);
    },
    pTick(p, P, dt) {
      const G = p.game, d = P.roll;
      if (P.air) {   // falling to the floor
        P.vel.y -= 1960 * dt; P.pos.addScaledVector(P.vel, dt);
        const dn = G.phys.raycastDown(P.pos.clone().add(V3(0, 10, 0)), P.radius + 14);
        if (dn && P.vel.y <= 0) { P.pos.y = dn.point.y + P.radius; P.vel.y = 0; P.air = false; G.fx.puff(dn.point, [0.62, 0.52, 0.36], 60, 0.5); G.audio.playAt('S_Land', P.pos, 0.6, 0.8); }
      } else {
        P.spd = Math.min(P.spd * (1 + 0.35 * dt), 2400);   // it picks up speed as it goes
        const step = P.spd * dt, mid = P.pos.clone(), wall = G.phys.raycast(mid, d, step + P.radius);
        if (wall && Math.abs(wall.normal.y) < 0.6) {
          if (P.wb >= 2) { G.projectiles.detonate(P, wall.point.clone().addScaledVector(wall.normal, P.radius)); return true; }
          P.wb++; const n = V3(wall.normal.x, 0, wall.normal.z).normalize(); d.addScaledVector(n, -2 * d.dot(n)).normalize(); P.hit.clear();
          G.fx.puff(wall.point, [0.62, 0.52, 0.36], 70, 0.45); G.audio.playAt('S_Blunt', wall.point, 0.7, 0.8); return true;
        }
        const nx = P.pos.clone().addScaledVector(d, step), dn = G.phys.raycastDown(nx.clone().add(V3(0, P.radius + 40, 0)), P.radius * 2 + 90);
        if (dn) { P.pos.set(nx.x, dn.point.y + P.radius, nx.z); P.vel.copy(d).multiplyScalar(P.spd); }
        else { P.pos.copy(nx); P.vel.copy(d).multiplyScalar(P.spd); P.vel.y = 0; P.air = true; }   // off an edge: it falls and rolls on below
      }
      // everything it runs into
      for (const E of G.enemies) {
        if (E.dead || E.burrowed || E.emerging || P.hit.has(E)) continue;
        const r = (E.hitR || E.radius) + P.radius, dx = E.pos.x - P.pos.x, dz = E.pos.z - P.pos.z; if (dx * dx + dz * dz > r * r) continue;
        const y0 = E.pos.y - (E.feetOffset || 0), y1 = y0 + (E.hitH || (E.half || 50) * 2); if (P.pos.y + P.radius < y0 || P.pos.y - P.radius > y1) continue;
        const at = P.pos.clone(); p.handleProjectileHit(P, E, at); P.hit.add(E); this.pHit(p, P, E, at); if (P.done) return true;
      }
      // it turns as it rolls, and throws up dust
      const ax = V3(-d.z, 0, d.x); if (!P.air) P.group.rotateOnWorldAxis(ax, -(P.spd * dt) / P.radius);
      if ((P.dust -= dt) <= 0 && !P.air) { P.dust = 0.06; G.fx.puff(P.pos.clone().add(V3(0, -P.radius * 0.85, 0)).addScaledVector(d, -P.radius), [0.62, 0.52, 0.36], 26 + P.radius * 0.6, 0.45); }
      return true;
    },
    pHit(p, P, E, at) {
      if (P.tw < 10) { P.tw++; P.damage *= 1.15; P.splash += 24; P.radius += 3.4; P.group.scale.multiplyScalar(1.1); }
      if (!E.dead && !E.isBoss) E.applyKnock(V3(P.roll.x * 380 - P.roll.z * 260 * (P.tw % 2 ? 1 : -1), 260, P.roll.z * 380 + P.roll.x * 260 * (P.tw % 2 ? 1 : -1)));   // bowled aside
      p.game.fx.puff(at, [0.62, 0.52, 0.36], 50 + P.radius, 0.4); p.game.audio.playAt('S_Blunt', at, 0.5, 1.2 - Math.min(0.4, P.tw * 0.04));
      return true;
    },
    pEnd(p, P, at) { if (P.tw >= 4) say(p, at, `SNOWBALL  x${Math.pow(1.15, P.tw).toFixed(1)}`, [0.9, 0.8, 0.5]); },
    hud: (p) => { const L = p.game.projectiles.list.filter((P) => !P.done && P.roll && P.sx && P.sx.sig && P.sx.sig.name === 'Snowball'); if (!L.length) return null; const t = Math.max(...L.map((P) => P.tw)); return t ? [`ROLLING  x${Math.pow(1.15, t).toFixed(1)}`, t >= 6 ? '#ffd23a' : '#d8c890'] : null; },
  },
  'Homing Pigeon': {
    name: 'Air Mail', short: 'A pigeon with dynamite that flies where you look. It hits harder the longer it flies.',
    text: 'It lets go a pigeon carrying a stick of dynamite, and the bird flies wherever you are looking. The longer it has been in the air the harder it lands, +40% a second up to triple. Fire again to drop the load where it is.',
    play: 'Do not send it straight there. Take it the long way round the room, over the top, and down onto the thing at the back.', fav: ['Heavy Rounds', 'Blast Cap', 'Quick Hands'], aff: { ExplosionRadius: 1.5, ReloadSpeed: 1.5 },
    snd: ['S_Wings', 0.8, 1.1],
    can(p) { const P = p.sgBird; if (P && !P.done) { p.game.projectiles.detonate(P, P.pos.clone()); return false; } return true; },
    fire(p, S, W, g, C, F) { const P = p.sgBird = p.fireProjectile(F.muzzle, F.pdir, F.damage, 1, W); P.life = 7; P.d0 = P.damage; P.radius = 14; },
    pTick(p, P, dt) {
      const G = p.game, sp = 1500; P.damage = P.d0 * (1 + Math.min(2, 0.4 * P.age));
      if (p.slot === P.sx.S && !p.wield) { const eye = G.camera.position, d = camDir(G), wall = G.phys.raycast(eye, d, 6000), tg = eye.clone().addScaledVector(d, wall ? wall.distance : 3200), to = tg.sub(P.pos); if (to.length() > 80) P.vel.lerp(to.normalize().multiplyScalar(sp), Math.min(1, dt * 5.5)).setLength(sp); }
      if (Math.random() < dt * 14) G.fx.puff(P.pos.clone(), [0.95, 0.95, 1], 14, 0.5, V3(0, -60, 0));
      return false;
    },
    pGone(p, P) { if (p.sgBird === P) p.sgBird = null; },
    hud: (p) => { const P = p.sgBird; return P && !P.done ? [`AIR MAIL  +${Math.round(Math.min(2, 0.4 * P.age) * 100)}%   FIRE TO DROP`, P.age >= 5 ? '#ffd23a' : '#e8e4f0'] : null; },
  },
  // ------------------------------------------------------------------ the uncanny
  Poltergeist: {
    name: 'Bowling', short: 'Picks an enemy up and throws it. It bursts for a fifth of its own health on top.',
    text: 'The first pull plucks an enemy off the floor and holds it helpless in front of you; the second throws it. Whatever it lands on takes the blast, and the blast is this weapon\'s damage plus a fifth of the thrown one\'s own health. With nothing to grab it shoves the crowd back.',
    play: 'Pick up the biggest thing that is not a boss and throw it at the boss. Elites make the best ammunition.', fav: ['Heavy Rounds', 'Blast Cap', 'Quick Hands'], aff: { ExplosionRadius: 1.5 },
    snd: ['S_Blink', 0.7, 0.8],
    shot(p, S, W, g, C) { if (p.sgHeld && !p.sgHeld.dead && S.ammo < p.magSize(S)) S.ammo++; },   // the throw is free: the grab paid for it
    fire(p, S, W, g, C, F) {
      const G = p.game, col = [0.6, 0.95, 0.82];
      if (p.sgHeld && !p.sgHeld.dead) {
        const E = p.sgHeld; p.sgHeld = null; E.launch(V3(F.dir.x * 2700, F.dir.y * 2700 + 230, F.dir.z * 2700)); E.staggerT = Math.max(E.staggerT || 0, 1.6);
        (p.sgThrown || (p.sgThrown = [])).push({ E, t: 1.7, age: 0, dmg: F.damage + Math.min(E.maxHealth * 0.2, F.damage * 8), C: ctxOf(C) }); G.fx.flash(E.pos, col, 120, 0.15, true); return;
      }
      const wall = G.phys.raycast(F.eye, F.dir, W.range); let best = null, bt = wall ? wall.distance : W.range;
      for (const E of G.enemies) { if (E.dead || E.burrowed || E.isBoss || E.emerging) continue; const t = G.rayEnemy(F.eye, F.dir, bt, E, 70); if (t !== null && t < bt) { bt = t; best = E; } }
      if (best) { p.sgHeld = best; p.sgHeldT = G.time + 4.5; p.sgHeldS = S; G.fx.arc(F.muzzle, best.pos, col); say(p, best.pos, 'GOT ONE', col); return; }
      for (const E of G.enemies) { if (E.dead || E.burrowed) continue; const d = inCone(F.eye, F.dir, E, 750, 0.5); if (d < 0) continue; p.dealDamage(E, F.damage * 0.5, E.pos, F.dir, false, 1, false); if (!E.dead) E.applyKnock(V3(F.dir.x * 950, 280, F.dir.z * 950)); }
      G.fx.ring(V3(p.pos.x + F.dir.x * 250, p.pos.y - 80, p.pos.z + F.dir.z * 250), 300, col, 0.3);
    },
    hud: (p) => (p.sgHeld && !p.sgHeld.dead ? ['HOLDING   FIRE TO THROW', '#9af0d0'] : null),
  },
  'Hocus Pocus': {
    name: 'Abracadabra', short: 'Lifts everything in the burst helpless into the air. They take double, then half of it again.',
    text: 'The wand\'s burst lifts everything it catches off the floor and hangs it there, helpless, for three seconds. Anything in the air takes double damage from everything, and when the spell lets go it is slammed down for half of all it took while it hung. Bosses are too heavy to lift: they take 30% more instead.',
    play: 'The opening act for your other gun. Lift the pack, empty a magazine into it, and let the floor do the rest.', fav: ['Blast Cap', 'Quick Hands', 'Extended Mag'], aff: { ExplosionRadius: 1.5, ReloadSpeed: 1.5 },
    fire(p, S, W, g, C, F) { const P = p.fireProjectile(F.muzzle, F.pdir, F.damage, 0.5, W); P.life = 3; },
    post(p, E, C, g, h) {
      const G = p.game; if (h.killed) return;
      if (E.isBoss) { mark(G, E, 0.3, 4); return; }
      if (E.sgLift) return;
      E.sgLift = { until: G.time + (E.elite ? 1.8 : 3.2), y: E.pos.y + 240, taken: 0 }; (p.sgLifted || (p.sgLifted = [])).push(E);
      if (!C.said) { C.said = true; say(p, E.pos, 'ABRACADABRA', [1, 0.6, 0.9], 1.25); p.play('S_Luck', 0.5, 1.3); }
    },
  },
};

// ---------------------------------------------------------------------------------------------------------------
// What the oddities leave in the world, ticked whichever weapon you are holding.
export function sig2Tick(p, dt) {
  const G = p.game, T = G.time;
  // Wrecking Ball: the ball is only there while the chain is being held out
  if (p.sgBall && !p.sgBall.done && T - (p.sgBallT || 0) > 0.16) { G.projectiles.kill(p.sgBall); p.sgBall = null; p.sgBallAt = null; }
  // Poltergeist: the one in your grip, and the ones in the air
  if (p.sgHeld) {
    const E = p.sgHeld, mine = p.slot === p.sgHeldS && !p.wield && !p.dead;
    if (E.dead) p.sgHeld = null;
    else if (!mine || T > p.sgHeldT) { p.sgHeld = null; E.launch(V3(0, 200, 0)); }
    else { const d = camDir(G), tg = G.camera.position.clone().addScaledVector(d, 250 + E.radius).add(V3(0, -30, 0)); E.pos.lerp(tg, Math.min(1, dt * 12)); E.vel.set(0, 0, 0); E.grounded = false; E.staggerT = Math.max(E.staggerT || 0, 0.3); E.attackCd = Math.max(E.attackCd || 0, 0.6); if (Math.random() < dt * 12) G.fx.glowAt(E.pos.clone().add(V3((Math.random() - 0.5) * 60, (Math.random() - 0.5) * 90, (Math.random() - 0.5) * 60)), [0.6, 0.95, 0.82], 50, 0.25); }
  }
  if (p.sgThrown && p.sgThrown.length) for (let i = p.sgThrown.length - 1; i >= 0; i--) {
    const Q = p.sgThrown[i], E = Q.E; Q.age += dt; Q.t -= dt;
    let hit = E.dead || Q.t <= 0 || (Q.age > 0.14 && Math.hypot(E.vel.x, E.vel.z) < 650);
    if (!hit) for (const O of G.enemies) if (O !== E && !O.dead && !O.burrowed && O.pos.distanceTo(E.pos) < O.radius + E.radius + 40) { hit = true; break; }
    if (!hit) { E.staggerT = Math.max(E.staggerT || 0, 0.3); continue; }
    p.sgThrown.splice(i, 1); const at = E.pos.clone(), n0 = p.kills;
    asShot(p, Q.C, () => p.explodeAt(at, 310 * (1 + p.stat('ExplosionRadius')), Q.dmg, 0.5, false, false, [0.6, 0.95, 0.82], null));
    if (p.kills - n0 >= 3) say(p, at, 'STRIKE', GOLD, 1.4);
  }
  // Hocus Pocus: hold them up, then put them down hard
  if (p.sgLifted && p.sgLifted.length) for (let i = p.sgLifted.length - 1; i >= 0; i--) {
    const E = p.sgLifted[i], L = E.sgLift;
    if (E.dead || !L) { E.sgLift = null; p.sgLifted.splice(i, 1); continue; }
    if (T < L.until) { E.vel.x *= 0.85; E.vel.z *= 0.85; E.vel.y = clamp((L.y - E.pos.y) * 7, -500, 700); E.grounded = false; E.staggerT = Math.max(E.staggerT || 0, 0.3); E.attackCd = Math.max(E.attackCd || 0, 0.6); if (Math.random() < dt * 9) G.fx.glowAt(E.pos.clone().add(V3((Math.random() - 0.5) * 70, -60 - Math.random() * 60, (Math.random() - 0.5) * 70)), [1, 0.6, 0.9], 40, 0.35); continue; }
    E.sgLift = null; p.sgLifted.splice(i, 1); E.launch(V3(0, -1900, 0)); const echo = L.taken * 0.5;
    if (echo > 1) later(p, 0.14, () => { if (E.dead) return; const d = E.takeHit(echo, E.pos, V3(0, -1, 0), false); G.fx.ring(E.feet(), 200, [1, 0.6, 0.9], 0.3); G.audio.playAt('S_Slam', E.pos, 0.5, 1.2); if (d > 0) G.hud.floater(E.pos.clone().add(V3(0, 60, 0)), `SLAM ${Math.round(d)}`, [1, 0.6, 0.9], 1.2); });
  }
  // slow things: fences, ropes and oil
  p.sg2T = (p.sg2T || 0) - dt; if (p.sg2T > 0) return; p.sg2T = 0.2;
  const rods = p.sgRods = (p.sgRods || []).filter((q) => !q.done);
  if (rods.length > 1) {
    const live = rods.filter((q) => q.stuck), pairs = [];
    for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) { const a = live[i].pos, b = live[j].pos; if (a.distanceTo(b) < 1900 && G.phys.lineOfSight(a, b)) pairs.push([live[i], live[j]]); }
    p.sgLinks = pairs.length; const k = 1 + 0.25 * Math.max(0, pairs.length - 1), done = new Set();
    for (const [A, B] of pairs) {
      G.fx.arc(A.pos, B.pos, [0.5, 0.85, 1]);
      for (const E of G.enemies) { if (E.dead || E.burrowed || E.emerging || done.has(E) || segDist(E.pos, A.pos, B.pos) > 70 + E.radius) continue; done.add(E); asShot(p, ctxOf(A.sx), () => p.dealDamage(E, A.dmg0 * k, E.pos, V3(0, 0, 0), false, 0.3, false)); if (!E.dead) { E.applySlow(0.3, 0.6); mark(G, E, 0.2, 1.5); } }
    }
    if (pairs.length && Math.random() < 0.25) G.audio.playAt('S_Zap', pairs[0][0].pos, 0.25, 1.4);
  } else p.sgLinks = 0;
  if (p.sgHerd && p.sgHerd.length) { const H = p.sgHerd = p.sgHerd.filter((E) => !E.dead && E.sgRope > T); for (let i = 0; i + 1 < H.length; i++) G.fx.tracer(H[i].pos, H[i + 1].pos, [0.78, 0.66, 0.42], 2.5, 0.22); if (H.length === 1) G.fx.glowAt(H[0].pos, [0.78, 0.66, 0.42], 60, 0.22); }
  for (const E of G.enemies) {   // oil meets fire
    if (E.dead || !(E.sgOil > 0) || !(E.sgOilT > T) || !(E.burnT > 0)) continue;
    const n = E.sgOil, at = E.pos.clone(), d = E.sgOilD || 5; E.sgOil = 0;
    G.fx.fireBurst(at, 200); p.explodeAt(at, 210 * (1 + p.stat('ExplosionRadius')), n * d * 2.6, 0, true, false, [1, 0.5, 0.12], null);
    for (const O of near(G, at, 300, E)) if (O.sgOil > 0 && O.sgOilT > T) O.applyBurn(Math.max(8, d * 3), 3);
  }
}
// everything that is in the air takes double
export function sig2Amp(p, E) { return E.sgLift ? 2 : 1; }
export function sig2After(p, E, dealt, killed, dir) {
  if (!(dealt > 0)) return;
  if (E.sgLift) E.sgLift.taken += dealt;
  const G = p.game;
  if (E.sgRope > G.time && p.sgHerd && !p.sgSharing) {   // Lariat: what one feels, the others feel half of
    p.sgSharing = true;
    for (const O of p.sgHerd) { if (O === E || O.dead || !(O.sgRope > G.time)) continue; const d = O.takeHit(dealt * 0.5, O.pos, dir || V3(0, 0, 0), false); if (d > 0) G.hud.floater(O.pos.clone().add(V3(0, 40, 0)), `${Math.round(d)}`, [0.85, 0.72, 0.45], 0.85); }
    p.sgSharing = false;
  }
}
