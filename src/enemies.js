// Ghouls, elites and bosses (port of ADMHEnemy): flow-field chasing, per-type behaviours (spitters kite,
// leapers pounce, screamers frenzy the horde, burrowers tunnel, priests heal, gilded ghouls flee with loot),
// elite affixes, rooftop climbing, wind-up melee, and multi-phase boss attack patterns.
import * as THREE from 'three';
import { DATA, AFFIX, ENEMY_CREATURES, BOSS_CREATURES, zombieHealth, effRound, payScale, hexRGB, lerp3, lin, frandRange, randInt } from './data.js';
import { Puppet } from './puppet.js';
import { Body3D } from './body3d.js';

const GRAV = 980 * 1.6;
const UP = new THREE.Vector3(0, 1, 0);
const flat = (v) => new THREE.Vector3(v.x, 0, v.z);
const safeN2 = (v) => { const f = flat(v); const l = f.length(); return l > 1e-4 ? f.divideScalar(l) : f.set(0, 0, 0); };
const EyeYellow = [1, 0.93, 0.48];
import { traitTick, traitMove, traitHit, traitDamage, traitDeath, traitSpit } from './traits.js';
import { X_ATTACKS, mechX, hitX, deathX, attackX, thinkTotem } from './bossx.js';
const ATTACKS = ['Charge', 'Slam', 'Volley', 'Summon', 'Leap', 'Teleport', 'Ring', 'Barrage', 'Sweep', 'Hook', 'Pools', 'NailWall', 'Ambush', 'Dive'].concat(X_ATTACKS);
// what the boss bar calls each move while it is winding up, so a fight reads as a set of things to answer
export const ATTACK_LABEL = { Charge: 'CHARGE - sidestep it', Slam: 'GROUND SLAM - jump the ring', Volley: 'VOLLEY', Summon: 'CALLING THE HANDS', Leap: 'LEAP - move', Teleport: 'VANISHED', Ring: 'SHOCKWAVES - jump them', Barrage: 'BARRAGE - keep moving',
  Sweep: 'SWEEP - get behind it', Hook: 'CHAIN HOOK - out of the line', Pools: 'BILE - off the green', NailWall: 'NAIL WALL - find the gap', Ambush: 'AMBUSH - it is behind you', Dive: 'DIVE - out of the line' };
let HZ_GROUP = 1;

let SERIAL = 0;
const _probe = new THREE.Vector3();
export class Enemy {
  constructor(game, defIndex, pos, round, elite, bossIndex, scaleMul = 1, healthMul = 1, forcedAffixes = 0, splitChild = false) {
    this.game = game;
    this.id = ++SERIAL;
    this.defIndex = Math.max(0, Math.min(DATA.enemies.length - 1, defIndex));
    this.round = Math.max(1, round);
    this.bossIndex = bossIndex;
    this.splitChild = splitChild;
    this.elite = elite && bossIndex < 0;
    const D = this.def = DATA.enemies[this.defIndex];
    this.ai = this.isBoss ? 'Boss' : D.ai;
    let hp = zombieHealth(this.round) * D.hp * healthMul;
    this.bodyScale = D.scale * scaleMul;
    this.baseSpeed = D.speed;
    this.attackDamage = D.dmg * (1 + 0.035 * (effRound(this.round) - 1));
    this.money = Math.max(4, Math.round(D.money * 0.95 * payScale(this.round)));
    this.bodyColor = hexRGB(D.body);
    if (this.ai === 'Walker') {
      const R = Math.random();
      if (this.round >= 6 && R < Math.min(0.15 + this.round * 0.03, 0.7)) this.baseSpeed = 470;
      else if (this.round >= 3 && R < 0.85) this.baseSpeed = 320;
      else this.baseSpeed = frandRange(150, 220);
    }
    if (this.isBoss) {
      const B = this.boss = DATA.bosses[bossIndex];
      const cycle = Math.max(0, Math.floor((this.round - 5) / 25));
      hp = zombieHealth(this.round) * B.hp * (1 + cycle * 0.5) * healthMul;
      this.bodyScale = Math.min(B.scale, B.final ? 2.5 : 2.0) * scaleMul;   // big enough to loom, never so big it is in the rafters
      this.baseSpeed = B.speed;
      this.attackDamage = B.dmg * (1 + 0.03 * (effRound(this.round) - 1));
      this.money = B.reward;
      this.bodyColor = hexRGB(B.body);
      this.attackMask = B.attacks.map((a) => ATTACKS.indexOf(a));
    }
    this.affixes = 0; this.innate = 0;
    if (!this.isBoss && D.innate) for (const n of D.innate) this.innate |= 1 << AFFIX[n];   // what this kind of creature always is; not shown as a variant
    this.shield = 0; this.maxShield = 0;
    if (this.elite) {
      this.affixes = forcedAffixes;
      if (!this.affixes) {
        const count = this.round >= 12 ? 3 : this.round >= 6 ? 2 : 1;
        const pool = [];
        for (let i = 0; i < DATA.affixes.length; i++) if (!(splitChild && i === AFFIX.Splitting)) pool.push(i);
        for (let n = 0; n < count && pool.length; n++) this.affixes |= 1 << pool.splice(randInt(0, pool.length - 1), 1)[0];
      }
      hp *= 2.5; this.bodyScale *= 1.2; this.money *= 3;
    } else if (!this.isBoss) {
      // variants: an ordinary enemy carrying one modifier, more common in later rounds
      this.affixes = forcedAffixes;
      if (!this.affixes && !splitChild && !game.net.remoteSpawn && this.round >= 2 && Math.random() < Math.min(0.32, 0.04 + this.round * 0.02)) {
        const pool = [AFFIX.Armored, AFFIX.Armored, AFFIX.Volatile, AFFIX.Volatile, AFFIX.Blazing, AFFIX.Frozen, AFFIX.Hasted, AFFIX.Shielded, AFFIX.Vampiric, AFFIX.Splitting, AFFIX.Blinking];
        if (Math.random() < 0.06) pool.length = 0, pool.push(AFFIX.Gilded);
        this.affixes = 1 << pool[randInt(0, pool.length - 1)];
      }
      if (this.affixes) { this.variant = true; this.money = Math.round(this.money * 1.5); }
    }
    if (this.affixes | this.innate) {
      if (this.has('Hasted')) this.baseSpeed *= this.elite ? 1.6 : 1.35;
      if (this.has('Gilded')) this.money *= 3;
      if (this.has('Shielded')) { this.maxShield = hp * 0.5; this.shield = this.maxShield; }
    }
    this.maxHealth = this.health = Math.max(1, hp);
    // capsule
    this.radius = (this.ai === 'Bloater' ? 48 : 34) * this.bodyScale;
    let half = 100 * this.bodyScale;
    if (['Crawler', 'Leaper', 'Burrower'].includes(this.ai)) half = 50 * this.bodyScale;
    if (this.ai === 'Flyer') half = 40 * this.bodyScale;
    this.half = Math.max(half, this.radius);
    this.feetOffset = this.half;
    this.wide = Math.min(this.radius, 130) > 58;   // too broad for one-cell gaps: follows the flow field that keeps clear of walls
    this.pos = pos.clone();
    this.vel = new THREE.Vector3();
    this.grounded = false;
    this.yaw = 0;
    // body
    const creature = this.isBoss ? BOSS_CREATURES[bossIndex] : ENEMY_CREATURES[this.defIndex];
    let tint = [1, 1, 1], aura = this.accent(), auraSize = 0;
    if (this.elite) { tint = lerp3([1, 1, 1], this.accent(), 0.22); auraSize = 230; }
    if (this.isBoss) { auraSize = 300; aura = lin(1, 0.25, 0.1); }
    if (splitChild) tint = lerp3(tint, [0.75, 1, 0.6], 0.25);
    this.puppet = game.flatEnemies ? new Puppet(creature, this.bodyScale, tint, aura, auraSize) : new Body3D(creature, this.bodyScale, tint, aura, auraSize);
    this.ckind = game.fx.kindFor(this.puppet.atlas);
    // hit shape from the art itself: as tall as the drawn creature and as wide as its body (arms and claws stick out past it)
    { let w = 0; for (const p of this.puppet.parts) w = Math.max(w, Math.abs(p.rest[0] + p.off[0]) + p.size[0] * 0.5);
      this.hitR = Math.max(this.radius, w * this.puppet.baseScale * 0.58); this.hitH = Math.max(this.half * 2, this.puppet.heightCm);
      if (this.puppet.is3D) { this.hitR = Math.max(this.radius * 0.8, this.puppet.bodyR); this.hitH = this.puppet.heightCm; } }   // the 3D body is the hit shape
    this.puppet.setMods(DATA.affixes.map((A, i) => (this.affixes & (1 << i) ? Object.keys(AFFIX).find((k) => AFFIX[k] === i) : null)).filter(Boolean));
    // timers
    this.emerge = this.ai === 'Flyer' ? 0.01 : 1.5;
    if (this.isBoss) this.emerge = 2.0;
    if (splitChild) this.emerge = 0;
    this.special = frandRange(1.5, 4);
    this.attackCd = 0.5;
    this.windup = 0; this.lungeT = 0; this.groan = frandRange(1, 6);
    this.slowT = 0; this.slowAmt = 0; this.frenzyT = 0; this.burnT = 0; this.burnDps = 0; this.bleedT = 0; this.bleedDps = 0; this.dotTick = 0;
    this.climb = 0; this.stuck = 0; this.affixT = 0; this.fireTrail = 0; this.life = 0; this.sinceHit = 99;
    this.leaping = false; this.leapHit = false; this.burrowed = false; this.burrowT = 0;
    this.enraged = false; this.bossAttack = -1; this.bossT = 0; this.bossStep = 0; this.bossTimer = 2.5; this.chargeDir = new THREE.Vector3();
    this.dead = false; this.gibbed = false; this.deathAge = 0; this.remove = false; this.lastHitDir = new THREE.Vector3(); this.lastHitExplosive = false;
    this.desiredSpeed = this.baseSpeed;
    this.moveDir = new THREE.Vector3();
    if (this.emerge > 0.05) game.fx.dust(this.feet(), lin(0.25, 0.18, 0.12), 70 * this.bodyScale);
  }
  get isBoss() { return this.bossIndex >= 0; }
  get emerging() { return this.emerge > 0; }
  has(name) { return ((this.affixes | this.innate) & (1 << AFFIX[name])) !== 0; }
  feet() { return new THREE.Vector3(this.pos.x, this.pos.y - this.feetOffset, this.pos.z); }
  headY() { const feet = this.pos.y - this.feetOffset, H = this.hitH || this.half * 2; return feet + H * (['Crawler', 'Leaper', 'Burrower'].includes(this.ai) ? 0.55 : this.ai === 'Flyer' ? 0.5 : this.puppet && this.puppet.headFrac ? this.puppet.headFrac : 0.74); }   // the head is the top quarter of what is drawn
  healthFrac() { return this.health / this.maxHealth; }
  accent() {
    for (let i = 0; i < DATA.affixes.length; i++) if (this.affixes & (1 << i)) return hexRGB(DATA.affixes[i].color);
    return this.isBoss ? lin(1, 0.2, 0.1) : EyeYellow;
  }
  displayName() {
    if (this.isBoss) return `${this.boss.name}, ${this.boss.title}`;
    let pre = '';
    for (let i = 0; i < DATA.affixes.length; i++) if (this.affixes & (1 << i)) pre += DATA.affixes[i].name + ' ';
    return pre + this.def.name;
  }

  // ------------------------------------------------------------------ movement primitives
  launch(v, xy = true, z = true) {
    if (xy) { this.vel.x = v.x; this.vel.z = v.z; } else { this.vel.x += v.x; this.vel.z += v.z; }
    if (z) this.vel.y = v.y; else this.vel.y += v.y;
    this.grounded = false;
    this.launched = 0.1;
  }
  moveToward(dir, scale = 1) {
    if (this.staggerT > 0) { this.staggerT -= 1 / 60; scale *= 0.25; }   // just been shot: stumbling
    if (this.hurry) scale *= 1.5;   // last few of the round come running
    // Keeping up: an enemy that is far from its target and cannot see it closes the gap fast. Within 16 m, or in plain
    // sight, it moves at its normal pace, so you can always open a gap and watch them come.
    this.catchT = (this.catchT || 0) - 1 / 60;
    if (this.catchT <= 0) { this.catchT = 0.4; const T = this.game.net.targetOf(this), d = Math.hypot(T.pos.x - this.pos.x, T.pos.z - this.pos.z); this.catchUp = d > 1600 && !this.canSee(T.pos) ? Math.min(2.6, 1 + (d - 1600) / 1400) : 1; }
    scale *= this.catchUp || 1;
    let m = scale;
    if (!this.isBoss && this.ai !== 'Flyer' && this.game.player && !this.game.player.dead) {
      // surround instead of queueing: each enemy holds its own side of the player on the way in
      const P = this.game.player, tx = P.pos.x - this.pos.x, tz = P.pos.z - this.pos.z, d = Math.hypot(tx, tz) || 1;
      if (this.flank === undefined) { this.flank = Math.random() * 2 - 1; this.jukeNext = this.life + 1 + Math.random() * 2; this.jukeUntil = 0; }
      const px = -tz / d, pz = tx / d;
      dir = dir.clone();
      if (d > 280 && d < 1700) { const w = this.flank * Math.min(0.8, (d - 280) / 600); dir.x += px * w; dir.z += pz * w; }
      // fast or elite enemies sidestep when the crosshair settles on them
      if ((this.ai === 'Runner' || this.ai === 'Leaper' || this.elite) && d > 320 && d < 1500 && this.life > this.jukeNext) {
        const f = P.forward();
        if ((-tx * f.x - tz * f.z) / d > 0.99) { this.jukeUntil = this.life + 0.38; this.jukeSide = Math.random() < 0.5 ? -1 : 1; this.jukeNext = this.life + 1.4 + Math.random() * 1.6; }
      }
      if (this.life < this.jukeUntil) { dir.x += px * this.jukeSide * 1.6; dir.z += pz * this.jukeSide * 1.6; m *= 1.3; }
      const L = Math.hypot(dir.x, dir.z); if (L > 1e-4) { dir.x /= L; dir.z /= L; }
    }
    if (this.slowT > 0) m *= 1 - this.slowAmt;
    if (this.frenzyT > 0) m *= 1.4;
    this.desiredSpeed = this.baseSpeed * m;
    this.moveDir.copy(dir);
  }
  stop() { this.moveDir.set(0, 0, 0); this.vel.x = 0; this.vel.z = 0; if (this.ai === 'Flyer') this.vel.y = 0; }

  physics(dt) {
    const G = this.game;
    if (this.ai === 'Flyer') {
      const want = this.moveDir.clone().multiplyScalar(this.desiredSpeed);
      this.vel.lerp(want, Math.min(1, dt * 3));
      this.pos.addScaledVector(this.vel, dt);
      const gy = G.fx.groundY(this.pos, 3000);
      if (gy > -1e8 && this.pos.y < gy + 80) { this.pos.y = gy + 80; this.vel.y = Math.max(0, this.vel.y); }
      this.grounded = false;
      this.groundY = gy;
    } else {
      // character-movement style acceleration on the ground, light air control
      const accel = this.grounded ? 2048 : 2048 * 0.4;
      const want = this.moveDir.clone().multiplyScalar(this.desiredSpeed);
      if (this.grounded && !this.launched) {
        const cur = flat(this.vel);
        const diff = want.sub(cur);
        const l = diff.length(), step = accel * dt * (this.moveDir.lengthSq() > 0 ? 1 : 1.5);
        if (l > step) diff.multiplyScalar(step / l);
        this.vel.x += diff.x; this.vel.z += diff.z;
      } else if (this.moveDir.lengthSq() > 0) {
        const cur = flat(this.vel);
        const sp = Math.max(this.desiredSpeed, cur.length());
        cur.addScaledVector(this.moveDir, accel * dt);
        if (cur.length() > sp) cur.setLength(sp);
        this.vel.x = cur.x; this.vel.z = cur.z;
      }
      if (this.launched > 0) this.launched = Math.max(0, this.launched - dt);   // must come back to exactly 0: everything else tests it for truth
      this.vel.y -= GRAV * dt;
      if (this.grounded && this.vel.y < -50 && !this.launched) this.vel.y = -50;
      this.vel.y = Math.max(this.vel.y, -4000);
      const wasG = this.grounded;
      if (this.collides === false) {
        if (this.burrowed) this.vel.y = 0;   // underground, not in free fall
        this.pos.addScaledVector(this.vel, dt);
        this.grounded = false;
      } else {
        // big bodies walk on a slimmer, shorter capsule (bottom still on the ground) so a boss fits through a district doorway
        const mr = Math.min(this.radius, 130), mh = Math.max(mr, Math.min(this.half, 140)), dy = this.half - mh;   // and no taller than a doorway or a plank bridge overhead
        this.pos.y -= dy;
        const r = G.phys.moveCapsule(this.pos, this.vel, dt, mr, mh, { stepHeight: this.isBoss ? 80 : 45, wasGrounded: wasG });
        this.pos.y += dy;
        this.grounded = r.grounded;
        if (!this.grounded && wasG && this.vel.y <= 0 && !this.launched) {
          const h = G.phys.raycastDown(new THREE.Vector3(this.pos.x, this.pos.y - this.half + 5, this.pos.z), 45, true);
          if (h) { this.pos.y = h.point.y + this.half + 0.5; this.grounded = true; }
        }
        if (this.grounded && this.vel.y < 0) this.vel.y = 0;
      }
      // under the floor (shoved through thin geometry): find the surface above and stand on it; if all else fails, respawn
      this.floorT = (this.floorT || 0) - dt;
      if (this.floorT <= 0 && this.collides !== false && !this.burrowed) {
        this.floorT = 0.3;
        const up = G.phys.raycastDown(new THREE.Vector3(this.pos.x, this.pos.y + this.half - 4, this.pos.z), this.half * 2 + 3000, true);
        if (up && up.point.y > this.pos.y - this.half + 50) { this.pos.y = up.point.y + this.half + 1; this.vel.y = 0; this.grounded = true; }
        else if (!up) {
          const top = G.phys.raycastDown(new THREE.Vector3(this.pos.x, this.pos.y + 3000, this.pos.z), 6000, true);
          if (top) { this.pos.y = top.point.y + this.half + 1; this.vel.set(0, 0, 0); this.grounded = true; }
        }
        // Inside the ground itself. The ground is a slab with an underside, so a low body shoved into it (at a crowded
        // spawn, or by a blast) passes the check above - it finds a "floor" beneath it - and then walks about out of
        // sight with only its claws showing. The test: the middle of the body is inside closed geometry whose top is no
        // higher than its own head, or than the slab is thick. (A body merely brushing a tall wall is inside geometry too, and is left alone.)
        if (!this.leaping) {
          const mh = Math.max(Math.min(this.radius, 130), Math.min(this.half, 140)), cy = this.pos.y - (this.half - mh);
          const above = G.phys.solidAbove(_probe.set(this.pos.x, cy, this.pos.z));
          if (above === null || above - cy > Math.max(mh + 15, 110)) this.inT = 0;
          else {
            this.inT = (this.inT || 0) + 1; G.rescues = (G.rescues || 0) + 1;
            if (G.rescueLog && G.rescueLog.length < 60) G.rescueLog.push(`${this.def.name} life ${this.life.toFixed(1)} @${Math.round(this.pos.x)},${Math.round(this.pos.z)} y ${Math.round(this.pos.y)} half ${Math.round(this.half)} above ${Math.round(above)} inT ${this.inT}`);
            if (this.inT <= 2) { this.pos.y = above + this.half + 1; this.vel.set(0, 0, 0); this.grounded = true; }
            else { this.inT = 0; G.relocate(this); }
          }
        }
      }
      // Out of the world. Anything under the ground that is not a Burrower mid-dig gets two seconds to sort itself out and
      // is then put back on open ground near the player with its collision on. Nothing is ever left falling.
      this.belowT = !this.burrowed && this.pos.y < -260 ? (this.belowT || 0) + dt : 0;
      if (this.belowT > 2 || this.pos.y < -1500) {
        this.collides = true; this.burrowed = false; this.belowT = 0;
        if (!G.relocate(this)) { const sp = G.pickSpawn(false); if (sp) this.pos.set(sp.x, sp.y + this.half + 60, sp.z); else this.pos.set(G.player.pos.x, 400, G.player.pos.z); this.vel.set(0, 0, 0); this.emerge = 1.4; }
      }
      if (this.gy_t === undefined || (this.gy_t -= dt) <= 0) { this.gy_t = 0.25; const gy = G.fx.groundY(this.pos, 4000); this.groundY = gy > -1e8 ? gy : this.pos.y - this.feetOffset; }
      if (this.grounded) this.groundY = this.pos.y - this.feetOffset;
    }
    const sp = Math.hypot(this.vel.x, this.vel.z);
    if (sp > 30) this.yaw = Math.atan2(this.vel.x, this.vel.z);
  }

  canSee(where) {
    return this.game.phys.lineOfSight(new THREE.Vector3(this.pos.x, this.pos.y + 40, this.pos.z), where);
  }

  // ------------------------------------------------------------------ tick
  update(dt) {
    const G = this.game;
    if (this.dead) {
      this.deathAge += dt;
      if (!this.gibbed) this.puppet.tick(dt, this.feet(), { vel: new THREE.Vector3(), grounded: true });
      if (this.deathAge > (this.gibbed ? 0.1 : 1.6)) this.remove = true;
      return;
    }
    this.life += dt; this.sinceHit += dt;
    if (this.remote) {   // co-op mirror: the host simulates, we glide to its last reported position
      const px = this.pos.x, py = this.pos.y, pz = this.pos.z;
      this.pos.lerp(this.netPos, Math.min(1, dt * 9));
      this.vel.set((this.pos.x - px) / Math.max(dt, 1e-3), 0, (this.pos.z - pz) / Math.max(dt, 1e-3));
      this.grounded = this.ai !== 'Flyer'; this.groundY = this.pos.y - this.feetOffset;
      if (this.emerge > 0) this.emerge -= dt;
      this.animate(dt);
      return;
    }
    if (this.slowT > 0) this.slowT -= dt;
    if (this.frenzyT > 0) this.frenzyT -= dt;
    this.dotTick -= dt;
    if (this.dotTick <= 0 && (this.burnT > 0 || this.bleedT > 0 || this.slowT > 0)) {
      this.dotTick = 0.25;
      let dot = 0;
      if (this.burnT > 0) {
        dot += this.burnDps * 0.25; this.burnT -= 0.25;
        // on fire: flames standing on the body and smoke coming off it
        for (let q = 0; q < 2; q++) { const o = randDir().multiplyScalar(26 * this.bodyScale); o.y = Math.abs(o.y) * 1.4 - 10; const h = (34 + Math.random() * 26) * this.bodyScale; G.fx.add({ pos: this.pos.clone().add(o), vel: new THREE.Vector3(0, 150, 0), drag: 1, life: 0.34, size0: h, size1: h * 0.45, rot: (Math.random() - 0.5) * 24, c0: [1, 0.9, 0.5, 1], c1: [1, 0.35, 0.05, 1], fadeOut: 0.5, tex: 'FX_FlameUp', kind: 'add', glow: 2 }); }
        if (Math.random() < 0.5) G.fx.add({ pos: this.pos.clone().add(new THREE.Vector3(0, 50 * this.bodyScale, 0)), vel: new THREE.Vector3(0, 140, 0), drag: 1, life: 0.8, size0: 26 * this.bodyScale, size1: 70 * this.bodyScale, rot: Math.random() * 360, c0: [0.14, 0.12, 0.12, 0.6], c1: [0.1, 0.1, 0.1, 0], fadeOut: 0.7, tex: 'FX_Smoke' });
      }
      if (this.bleedT > 0) { dot += this.bleedDps * 0.25; this.bleedT -= 0.25;
        // bleeding: it drips
        G.fx.add({ mode: 'streak', pos: this.pos.clone().addScaledVector(randDir(), 20 * this.bodyScale), vel: new THREE.Vector3((Math.random() - 0.5) * 120, 60, (Math.random() - 0.5) * 120), gravity: 1700, life: 0.9, size0: 9, size1: 8, stretch: 3, groundY: this.pos.y - this.half, splat: Math.random() < 0.3, c0: [0.75, 0.05, 0.08, 1], fadeOut: 0.1, tex: 'FX_Drop' }); }
      // chilled: frost hangs on it
      if (this.slowT > 0 && this.slowAmt > 0.2 && Math.random() < 0.6) G.fx.add({ pos: this.pos.clone().addScaledVector(randDir(), 34 * this.bodyScale), vel: new THREE.Vector3(0, -30, 0), life: 0.5, size0: 20 * this.bodyScale, size1: 12 * this.bodyScale, rot: Math.random() * 60, rotVel: 60, c0: [0.9, 0.97, 1, 1], c1: [0.55, 0.85, 1, 0], fadeOut: 0.6, tex: 'FX_Snow', kind: 'add', glow: 1.6 });
      if (dot > 0) this.takeHit(dot, this.pos, new THREE.Vector3(), false);
      if (this.dead) return;
    }
    if (this.burnT <= 0) this.burnDps = 0;
    if (this.bleedT <= 0) this.bleedDps = 0;
    if (this.has('Vampiric')) this.health = Math.min(this.maxHealth, this.health + this.maxHealth * 0.01 * dt);

    this.moveDir.set(0, 0, 0);
    this.desiredSpeed = this.baseSpeed;
    if (this.emerge > 0) {
      this.emerge -= dt;
      // clawing out of the ground: dirt flies while it climbs
      this.digT = (this.digT || 0) - dt;
      if (this.digT <= 0 && this.ai !== 'Flyer' && this.grounded) {
        this.digT = 0.16; const f = this.feet();
        G.fx.dust(f, lin(0.25, 0.18, 0.12), 55 * this.bodyScale);
        for (let i = 0; i < 3; i++) G.fx.add({ pos: f.clone().add(new THREE.Vector3(frandRange(-40, 40) * this.bodyScale, 6, frandRange(-40, 40) * this.bodyScale)), vel: new THREE.Vector3(frandRange(-220, 220), frandRange(260, 520), frandRange(-220, 220)), gravity: 1500, life: frandRange(0.5, 0.9), size0: frandRange(10, 22) * this.bodyScale, size1: 8, rot: Math.random() * 360, rotVel: frandRange(-500, 500), c0: [0.3, 0.2, 0.13, 1], fadeOut: 0.2, tex: 'FX_Disc', kind: 'sprite' });
        if (Math.random() < 0.3) G.audio.playAt('S_Step' + randInt(0, 3), this.pos, 0.5, 0.6, 0.2);
      }
      this.stop();
    } else if (this.isBoss) this.thinkBoss(dt); else this.think(dt);
    if (!this.remove && !this.dead) {
      if (this.bossMoveOverride) { this.desiredSpeed = this.bossMoveOverride; this.bossMoveOverride = 0; }
      this.physics(dt);
    }
    this.animate(dt);
  }

  animate(dt) {
    const G = this.game;
    this.lungeT = Math.max(0, this.lungeT - dt);
    this.puppet.groundY = this.groundY;
    this.puppet.shieldOn = this.shield > 0;
    this.puppet.tick(dt, this.feet(), {
      vel: this.vel, grounded: this.grounded, stagger: this.staggerT > 0, flying: this.ai === 'Flyer', crawler: this.ai === 'Crawler' || this.ai === 'Burrower',
      faceToward: (this.dead ? null : G.net.targetOf(this).pos), windup: this.windup > 0 ? 1 : 0, lunge: this.lungeT > 0 ? 1 : 0,
      sink: this.burrowed ? 1 : this.emerge > 0 ? Math.pow(Math.min(1, Math.max(0, this.emerge / (this.isBoss ? 2 : 1.5))), 1.6) : 0, digging: this.emerge > 0 && !this.burrowed ? 1 : 0,
      frenzy: this.frenzyT > 0 ? 1 : 0, speedRef: Math.max(180, this.baseSpeed * 0.8),
    });
    this.groan -= dt;
    if (this.groan <= 0) {
      this.groan = frandRange(3.5, 8);
      let snd = 'S_Groan' + randInt(0, 3);
      if (this.ai === 'Flyer') snd = 'S_Wings'; else if (this.ai === 'Runner' || this.ai === 'Leaper') snd = 'S_Snarl';
      G.audio.playAt(snd, this.pos, this.isBoss ? 1 : 0.55, this.isBoss ? 0.7 : Math.min(1.4, Math.max(0.7, 1.2 / Math.max(this.bodyScale, 0.5))), 0.12);
    }
  }

  think(dt) {
    const G = this.game, P = G.net.targetOf(this);
    if (!P || P.dead) return;
    const Me = this.pos, Pl = P.pos;
    const To = Pl.clone().sub(Me);
    const dist = To.length(), dist2D = Math.hypot(To.x, To.z);
    if (this.ai === 'Totem') { thinkTotem(this, dt); return; }
    const hasteMul = this.has('Hasted') ? 1.6 : 1;
    this.attackCd -= dt * hasteMul; this.special -= dt; this.climb -= dt; this.affixT -= dt;
    if (this.has('Blinking') && this.affixT <= 0 && dist > 700) { this.affixT = 4; this.blink(350, 550); }
    if (this.has('Blazing')) {
      this.fireTrail -= dt;
      if (this.fireTrail <= 0 && this.grounded) { this.fireTrail = 0.9; const H = G.hazards.fire(this.feet(), 8 + this.round, 90 * this.bodyScale, 3.5); if (H) H.label = 'Blazing fire trail'; }
    }
    if (this.burrowed) {
      this.burrowT -= dt;
      this.stop();
      if (this.burrowT <= 0) {
        const out = G.findFreeLocationNear(Pl, 350, 650);
        if (out) this.pos.set(out.x, out.y + this.feetOffset + 5, out.z);
        this.burrowed = false; this.emerge = 0.6; this.collides = true;
        G.fx.dust(this.feet(), lin(0.35, 0.25, 0.15), 90);
      }
      return;
    }
    if (this.windup > 0) {
      this.windup -= dt * hasteMul;
      if (this.windup <= 0) this.meleeStrike();
      this.moveToward(safeN2(To), 0.25);
      return;
    }
    if (this.leaping) {
      if (!this.leapHit && dist < 130 * this.bodyScale) {
        this.leapHit = true;
        P.receiveDamage(this.attackDamage * 1.3, this, true);
        P.applyKnockback(safeN2(To).multiplyScalar(500).add(new THREE.Vector3(0, 250, 0)));
      }
      if (this.grounded && this.vel.y <= 0 && !this.launched) this.leaping = false;
      return;
    }
    let desired = new THREE.Vector3(), speedScale = 1;
    const los = dist < 2200 ? this.canSee(Pl) : false;
    const flow = (flee = false) => G.flowDirection(Me, flee, this.wide);
    traitTick(this, dt, { P, Pl, To, dist, los });
    switch (this.ai) {
      case 'Flyer': {
        const goal = Pl.clone().add(new THREE.Vector3(0, 60 + 50 * Math.sin(this.life * 3), 0));
        if (dist > 600) goal.y += 250;
        const dir = goal.sub(Me).normalize();
        this.moveToward(dir, 1);
        if (dist < this.def.range + 40 && this.attackCd <= 0) {
          this.attackCd = this.def.cd;
          this.lungeT = 0.2;
          P.receiveDamage(this.attackDamage, this, true, this.has('Frozen') ? 0.5 : 0, 2); traitHit(this, P);
        }
        return;
      }
      case 'Spitter':
      case 'Priest': {
        const keep = this.ai === 'Priest' ? 1100 : 850;
        // Ranged enemies telegraph: they rear back for half a second and then shoot at where you WERE when they
        // started, a little off true. Keep moving and it misses; stand still and it lands.
        if (this.windT > 0) {
          this.windT -= dt;
          if (this.windT <= 0) {
            const aim = this.windAim.clone().add(new THREE.Vector3((Math.random() - 0.5) * 90, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 90));
            if (this.ai === 'Spitter') { if (!traitSpit(this, aim)) this.fireAt(aim, 1050, 1, this.attackDamage, 70, 'Acid', [0.4, 1, 0.2], 1, 0); }
            else this.fireAt(aim, 760, 0, this.attackDamage, 0, 'Orb', lin(0.7, 0.3, 1), 1, 0);
          }
        } else if (los && dist < this.def.range && this.attackCd <= 0) {
          this.attackCd = this.def.cd * 1.4;
          this.windT = 0.55; this.windAim = Pl.clone();
          G.fx.glowAt(Me.clone().add(new THREE.Vector3(0, 60 * this.bodyScale, 0)), this.ai === 'Spitter' ? [0.4, 1, 0.2] : lin(0.7, 0.3, 1), 70, 0.5);
          G.audio.playAt('S_Attack', Me, 0.5, 1.5, 0.1);
        }
        if (this.ai === 'Priest' && this.special <= 0) {
          this.special = 1;
          for (const E of G.enemies) {
            if (E !== this && !E.dead && E.pos.distanceToSquared(Me) < 700 * 700 && E.health < E.maxHealth) {
              E.health = Math.min(E.maxHealth, E.health + E.maxHealth * 0.05);
              G.fx.arc(Me.clone().add(new THREE.Vector3(0, 80, 0)), E.pos, lin(0.6, 1, 0.5));
            }
          }
        }
        if (los && dist < keep * 0.7) { desired = safeN2(To).negate(); speedScale = 0.7; }
        else if (los && dist < keep) { desired = new THREE.Vector3().crossVectors(safeN2(To), UP).multiplyScalar(Math.sin(this.life * 0.7) > 0 ? 1 : -1); speedScale = 0.6; }
        else desired = flow();
        break;
      }
      case 'Gilded': {
        desired = dist < 1800 ? flow(true) : new THREE.Vector3();
        if (this.life > 25) { G.enemyEscaped(this); return; }
        break;
      }
      case 'Leaper': {
        if (los && this.grounded && dist > 350 && dist < 1100 && this.special <= 0) {
          this.special = 3.5; this.leaping = true; this.leapHit = false;
          const T = dist / 1200 + 0.2;
          const v = To.clone().divideScalar(T);
          v.y = (To.y + 0.5 * GRAV * T * T) / T;
          this.launch(v);
          this.lungeT = 0.4;
          return;
        }
        desired = los && dist < 800 && Math.abs(To.y) < 260 ? safeN2(To) : flow();
        break;
      }
      case 'Screamer': {
        if (this.special <= 0 && dist < 1600) {
          this.special = 7;
          G.fx.ring(this.feet(), 700, [0.95, 0.9, 0.85], 0.5);
          G.audio.playAt('S_Screech', Me, 1, 1, 0.1);
          for (const E of G.enemies) if (!E.dead && E.pos.distanceToSquared(Me) < 700 * 700) E.frenzyT = Math.max(E.frenzyT, 5);
        }
        desired = los && dist < 800 && Math.abs(To.y) < 260 ? safeN2(To) : flow();
        break;
      }
      case 'Burrower': {
        if (dist > 1500 && this.special <= 0 && this.grounded) {
          this.special = 9; this.burrowed = true; this.burrowT = 1.5; this.collides = false;
          G.fx.dust(this.feet(), lin(0.35, 0.25, 0.15), 90);
          this.stop();
          return;
        }
        desired = los && dist < 800 && Math.abs(To.y) < 260 ? safeN2(To) : flow();
        break;
      }
      case 'Bloater': {
        desired = los && dist < 800 && Math.abs(To.y) < 260 ? safeN2(To) : flow();
        break;
      }
      default:
        desired = los && dist < 800 && Math.abs(To.y) < 200 ? safeN2(To) : flow();
        break;
    }
    [desired, speedScale] = traitMove(this, dt, { P, To, dist, los }, desired, speedScale);
    const reach = this.def.range * Math.max(1, this.bodyScale * 0.8);
    if (!['Spitter', 'Priest', 'Gilded'].includes(this.ai) && dist < reach + 40 && this.attackCd <= 0 && !(this.chT > 0) && !(this.chW > 0)) {
      // take turns: only two attackers (three from round 12, four from round 22) may be mid-swing on one target at a time
      const busy = G.enemies.reduce((n, e) => n + (e !== this && !e.dead && e.windup > 0 && e.swingAt === P ? 1 : 0), 0);
      if (busy >= (this.round >= 10 ? 4 : this.round >= 5 ? 3 : 2) || G.time - (P.lastSwingStart || -9) < 0.28) { this.attackCd = 0.25 + Math.random() * 0.35; return; }
      P.lastSwingStart = G.time; this.swingAt = P;
      this.attackCd = this.def.cd;
      this.windup = this.ai === 'Brute' ? 0.55 : 0.32;
      return;
    }
    // jump only at a player who has been up high for a while, and only some enemies try it
    this.highT = To.y > 230 ? (this.highT || 0) + dt : 0;
    if (this.jumper === undefined) this.jumper = Math.random() < 0.4;
    if (this.jumper && this.grounded && this.climb <= 0 && this.highT > 1.6 && dist2D < 520 && this.ai !== 'Gilded') {
      this.climb = (this.ai === 'Brute' ? 8 : 5.5) + Math.random() * 3;
      const H = Math.min(To.y + 160, 1100);
      const vz = Math.sqrt(2 * GRAV * H);
      this.launch(safeN2(To).multiplyScalar(Math.min(dist2D * 1.4 + 150, 700)).add(new THREE.Vector3(0, vz, 0)));
      G.fx.dust(this.feet(), lin(0.3, 0.25, 0.2), 50);
      return;
    }
    desired = this.steer(desired, speedScale, dt, dist2D);
    if (desired.lengthSq() > 1e-4) this.moveToward(desired, speedScale);
  }

  // Called with the direction the AI wants to go; returns the direction to actually take.
  steer(desired, speedScale, dt, dist2D) {
    const G = this.game, Me = this.pos;
    // Something solid in the way that the flow field does not know about (a step, a ramp's edge, a prop):
    //   1. after a third of a second of pushing, slide round it on whichever side is open;
    //   2. if it still will not give, tell the nav grid that the cell ahead is blocked so everyone routes round it
    //      from now on, and hop.
    if (this.sideT > 0) { this.sideT -= dt; desired = desired.clone().applyAxisAngle(UP, this.side * 1.25); }
    // "not getting anywhere" is measured on the ground actually covered, not on velocity: a body sliding against a wall keeps its speed
    this.pgT = (this.pgT || 0) + dt; if (!this.pgPos) this.pgPos = Me.clone();
    if (this.pgT >= 0.4) { this.noProg = Math.hypot(Me.x - this.pgPos.x, Me.z - this.pgPos.z) < this.baseSpeed * Math.max(0.3, speedScale) * this.pgT * 0.25; this.pgPos.copy(Me); this.pgT = 0; }
    if (desired.lengthSq() > 1e-4 && this.grounded && !(this.staggerT > 0) && speedScale > 0.3 && this.noProg) {
      this.stuck += dt; this.stuckSum = (this.stuckSum || 0) + dt;
      if (this.stuck > 0.35 && !(this.sideT > 0)) {
        const o = new THREE.Vector3(Me.x, Me.y - this.half + 55, Me.z), reach = Math.min(this.radius, 130) + 110;
        const L = G.phys.raycast(o, desired.clone().applyAxisAngle(UP, 0.9), reach), Rr = G.phys.raycast(o, desired.clone().applyAxisAngle(UP, -0.9), reach);
        this.side = !L && Rr ? 1 : L && !Rr ? -1 : L && Rr ? (L.distance > Rr.distance ? 1 : -1) : (this.side || (Math.random() < 0.5 ? 1 : -1));
        this.sideT = 0.7;
      }
      if (this.stuckSum > 1.6 && dist2D > 500) { this.stuckSum = 0; G.navScar(this, desired); }
      if (this.stuck > 1.2) { this.stuck = 0; this.launch(desired.clone().multiplyScalar(300).add(new THREE.Vector3(0, 520, 0))); }
    } else { this.stuck = 0; this.stuckSum = Math.max(0, (this.stuckSum || 0) - dt * 0.5); }
    return desired;
  }

  meleeStrike() {
    const G = this.game, P = G.net.targetOf(this);
    const dist = P.pos.distanceTo(this.pos);
    const reach = this.def.range * Math.max(1, this.bodyScale * 0.8) * 1.35 + 40;
    this.lungeT = 0.22;
    G.audio.playAt('S_Attack', this.pos, 0.8, Math.min(1.3, Math.max(0.7, 1.1 / Math.max(this.bodyScale, 0.5))), 0.1);
    if (this.ai === 'Brute') {
      G.audio.playAt('S_Stomp', this.pos, 1);
      G.fx.ring(this.feet().add(new THREE.Vector3(0, 5, 0)), 320, lin(0.6, 0.45, 0.3), 0.35);
      if (dist < 320 && P.pos.y < this.pos.y + 150 && this.canSee(P.pos)) {
        P.receiveDamage(this.attackDamage, this, true); traitHit(this, P);
        P.applyKnockback(safeN2(P.pos.clone().sub(this.pos)).multiplyScalar(700).add(new THREE.Vector3(0, 400, 0)));
      }
      return;
    }
    if (dist < reach && this.canSee(P.pos)) {   // no hitting through walls
      P.receiveDamage(this.attackDamage * (this.ai === 'Bloater' ? 0.4 : 1), this, true, this.has('Frozen') ? 0.5 : 0, 2); traitHit(this, P);
      if (this.has('Vampiric')) this.health = Math.min(this.maxHealth, this.health + this.maxHealth * 0.05);
    }
  }

  fireAt(aim, speed, gravity, dmg, splash, kind, color, count, spreadDeg) {
    const G = this.game;
    const fwd = safeN2(G.net.targetOf(this).pos.clone().sub(this.pos));
    const from = this.pos.clone().add(new THREE.Vector3(0, 50 * this.bodyScale, 0)).addScaledVector(fwd, 40 * this.bodyScale);
    this.lungeT = 0.2;
    G.audio.playAt(kind === 'Acid' ? 'S_Spit' : 'S_Attack', from, 0.8, 1, 0.1);
    for (let i = 0; i < count; i++) {
      const off = count > 1 ? (i - (count - 1) * 0.5) * spreadDeg * Math.PI / 180 : 0;
      let dir = aim.clone().sub(from).normalize();
      if (off) dir.applyAxisAngle(UP, off);
      let vel = dir.multiplyScalar(speed);
      if (gravity > 0) {
        const fl = new THREE.Vector3(aim.x - from.x, 0, aim.z - from.z);
        const T = Math.max(0.35, fl.length() / speed);
        if (off) fl.applyAxisAngle(UP, off);
        vel = fl.divideScalar(T);
        vel.y = ((aim.y - from.y) + 0.5 * 980 * gravity * T * T) / T;
      }
      G.projectiles.spawn({ hostile: true, pos: from.clone(), vel, gravity, damage: dmg, splash, life: 6, slow: this.has('Frozen') ? 0.4 : 0, kind, color, radius: kind === 'Card' ? 14 : 16 });
    }
  }

  explode(radius, dmg, color) {
    const G = this.game, P = G.net.targetOf(this);
    G.fx.explosion(this.pos, radius, color);
    G.audio.playAt('S_Explosion', this.pos, 1, 1, 0.1);
    G.shakeAt(this.pos, radius);
    if (P.pos.distanceTo(this.pos) < radius + 40) {
      P.receiveDamage(dmg, this, false);
      P.applyKnockback(P.pos.clone().sub(this.pos).normalize().multiplyScalar(600).add(new THREE.Vector3(0, 300, 0)));
    }
  }
  blink(minR, maxR) {
    const G = this.game;
    const out = G.findFreeLocationNear(G.net.targetOf(this).pos, minR, maxR);
    if (!out) return;
    G.fx.flash(this.pos, this.accent(), 70 * this.bodyScale, 0.3, true);
    this.pos.set(out.x, out.y + this.feetOffset + 10, out.z);
    this.vel.set(0, 0, 0);
    G.fx.flash(this.pos, this.accent(), 70 * this.bodyScale, 0.3, true);
    G.audio.playAt('S_Dash', this.pos, 0.6, 0.8);
  }
  applyBurn(dps, time) { if (this.remote) { this.game.net.sendFx(this, 'burn', dps, time); return; } this.burnDps = Math.max(this.burnDps, dps); this.burnT = Math.max(this.burnT, time); }
  applyBleed(total) { if (this.remote) { this.game.net.sendFx(this, 'bleed', total); return; } this.bleedDps += total / 3; this.bleedT = 3; }
  applySlow(amount, time) {
    if (this.remote) { this.game.net.sendFx(this, 'slow', amount, time); return; }
    const resist = this.isBoss ? 0.4 : 1;
    this.slowAmt = Math.min(0.85, Math.max(0, Math.max(this.slowAmt * (this.slowT > 0 ? 1 : 0), amount * resist)));
    this.slowT = Math.max(this.slowT, time);
  }
  applyKnock(impulse) {
    if (this.remote) { this.game.net.sendFx(this, 'knock', Math.round(impulse.x), Math.round(impulse.y), Math.round(impulse.z)); return; }
    const resist = this.isBoss ? 0.1 : this.ai === 'Brute' ? 0.35 : 1;
    if (impulse.length() * resist > 120 && !this.burrowed) this.launch(impulse.clone().multiplyScalar(resist), true, impulse.y > 0);
  }

  // returns damage dealt (0 if immune). sets this.dead on kill.
  takeHit(amount, at, fromDir, headshot) {
    if (this.dead || amount <= 0 || this.burrowed) return 0;
    if (this.remote) return this.game.net.sendHit(this, amount, fromDir, headshot);
    if (this.finalInv > 0) return 0;
    if (this.ward > 0) { if (!(this.wardSay > 0)) { this.wardSay = 0.5; this.game.hud.floater(this.pos.clone().add(new THREE.Vector3(0, this.half * 0.6, 0)), 'WARDED', [0.55, 0.8, 1], 1.4); } return 0; }
    if (!this.isBoss && !this.remote) amount = traitDamage(this, amount);
    if (this.isBoss && this.boss.tier && amount < 1e8) { amount = hitX(this, amount, fromDir, headshot); if (amount <= 0) return 0; }
    this.netKiller = this._netHit || null;
    let dmg = amount;
    if (this.exposedT > 0) dmg *= 1.5;   // staggered: a missed charge or a hard landing leaves a boss open
    if (this.slowT > 0) dmg *= 1.15;
    if (this.ai === 'Shield' && fromDir.lengthSq() > 0) {
      const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
      if (fwd.dot(safeN2(fromDir).negate()) > 0.45 && !headshot) dmg *= 0.3;
    }
    if (this.has('Armored') && !headshot) dmg *= 0.5;
    this.sinceHit = 0;
    if (fromDir.lengthSq() > 0) this.lastHitDir.copy(fromDir);
    this.puppet.hurt(Math.min(1, Math.max(0.25, dmg / Math.max(this.maxHealth * 0.25, 1))));
    // bosses shrug off part of a burst: past a tenth of their health in one second, only 30% of the rest gets through.
    // Ordinary guns never reach it; it stops a lucky legendary from deleting a boss in three shots.
    if (this.isBoss) {
      const now = this.game.time; if (!(now - this.gate0 < 1)) { this.gate0 = now; this.gateSum = 0; }
      const room = Math.max(0, this.maxHealth * 0.1 - this.gateSum), over = Math.max(0, dmg - room);
      this.gateSum += dmg; dmg -= over * 0.7;
    }
    const dealt = dmg;
    if (this.shield > 0) { const a = Math.min(this.shield, dmg); this.shield -= a; dmg -= a; }
    const before = this.health;
    this.health -= dmg;
    if (this.health > 0 && at && !this.isBoss) {
      this.puppet.addWound(at);
      // a heavy hit, or dropping past half health, takes an arm off
      const half = this.maxHealth * 0.5;
      if (!this.armLost && ((before > half && this.health <= half && Math.random() < 0.6) || dmg > this.maxHealth * 0.4)) {
        // (a severed part is drawn at its own width: the size passed to debris is the WIDTH, and the sprite's aspect
        // gives the height. Passing the length made every limb three to five times too big - an arm the size of a wagon.)
        const arm = this.puppet.popPart(['ArmFront', 'ArmBack']);
        if (arm) {
          this.armLost = true; this.attackDamage *= 0.75;
          const loc = this.puppet.partWorld(arm), hd = fromDir.lengthSq() > 0 ? fromDir.clone().normalize() : new THREE.Vector3(0, 1, 0);
          this.game.fx.debris(arm.tex, loc, hd.multiplyScalar(380).add(new THREE.Vector3(0, 520, 0)).addScaledVector(randDir(), 160), arm.size[0] * this.puppet.baseScale, 8, frandRange(-600, 600), true, arm.spr, this.ckind, this.puppet.facing < 0);
          this.game.fx.fleshHit(loc, hd, this.bodyScale * 1.2, true);
          this.game.fx.bloodPool(this.pos, 60 * this.bodyScale);
        }
      }
    }
    if (this.health <= 0) this.kill(this.game.player, headshot);
    else if (this.isBoss && !this.enraged && this.health < this.maxHealth * 0.4) {
      this.enraged = true; this.baseSpeed *= 1.25; this.bossTimer = 0.5;
      this.puppet.setTint([1, 0.72, 0.66]);
      this.game.audio.playAt('S_BossRoar', this.pos, 1.2, 0.9);
      this.game.banner(`${this.boss.name.toUpperCase()} IS ENRAGED`, lin(1, 0.3, 0.2), 2.5);
    }
    return dealt;
  }

  kill(killer, headshot) {
    if (this.dead || (this.remote && !this.netDying)) return;
    this.dead = true;
    if (this.isBoss && this.boss.tier) deathX(this);
    const G = this.game, loc = this.pos.clone();
    this.gibbed = this.isBoss || this.ai === 'Bloater' || this.lastHitExplosive || Math.random() < (this.elite ? 0.6 : 0.3);
    const hitDir = this.lastHitDir.lengthSq() < 1e-4 ? new THREE.Vector3(0, 1, 0) : this.lastHitDir.clone().normalize();
    if (headshot && !this.gibbed) {
      const headLoc = this.puppet.headWorld();
      const head = this.puppet.popHead();
      if (head) {
        const v = hitDir.clone().multiplyScalar(420).add(new THREE.Vector3(0, 650, 0)).addScaledVector(randDir(), 120);
        G.fx.debris(head.tex, headLoc, v, head.size[0] * this.puppet.baseScale, 8, frandRange(-700, 700), true, head.spr, this.ckind, this.puppet.facing < 0);
      }
      G.fx.fleshHit(headLoc, hitDir, this.bodyScale * 1.4, true);
      G.fx.gibs(headLoc, this.bodyColor, this.bodyScale * 0.6, 4);
    }
    if (this.gibbed) {
      G.fx.gibs(loc, this.bodyColor, this.bodyScale, this.isBoss ? 34 : this.elite ? 16 : 10);
      this.puppet.visible = false;
      G.audio.playAt('S_Gib', loc, 1, 1, 0.1);
    } else {
      G.fx.fleshHit(loc, hitDir, this.bodyScale, true);
      G.fx.bloodPool(loc, 110 * this.bodyScale);
      { const limb = this.puppet.popPart(['ArmFront', 'ArmBack', 'LegFront', 'LegBack']);   // something always comes off
        if (limb) G.fx.debris(limb.tex, this.puppet.partWorld(limb), hitDir.clone().multiplyScalar(300).add(new THREE.Vector3(0, 480, 0)).addScaledVector(randDir(), 200), limb.size[0] * this.puppet.baseScale, 8, frandRange(-600, 600), true, limb.spr, this.ckind, this.puppet.facing < 0); }
      this.puppet.startDeath(hitDir);
      G.audio.playAt('S_EnemyDie', loc, 0.8, Math.min(1.3, Math.max(0.7, 1.1 / Math.max(this.bodyScale, 0.5))), 0.12);
    }
    this.vel.set(0, 0, 0);
    if (this.remote) return;   // mirrors only play the death; the host owns the consequences
    if (!this.isBoss) traitDeath(this);
    if (this.ai === 'Bloater') {
      this.explode(330, this.attackDamage, lin(0.85, 0.95, 0.2));
      const caught = G.enemies.filter((E) => E !== this && !E.dead && E.pos.distanceTo(loc) < 330);
      for (const E of caught) E.takeHit(this.maxHealth * 0.5, E.pos, new THREE.Vector3(), false);
    }
    if (this.has('Volatile')) { const H = G.hazards.marker(this.feet(), this.attackDamage * 0.9, 280, 1.0, lin(1, 0.2, 0.1)); if (H) H.label = 'Volatile death blast'; }   // was 1.5x damage on a 0.7s fuse: too much at point-blank
    if (this.has('Splitting') && !this.splitChild) {
      for (let i = 0; i < 2; i++) {
        const out = G.findFreeLocationNear(loc, 60, 200);
        if (out) G.spawnEnemy(this.defIndex, out.add(new THREE.Vector3(0, 60, 0)), false, -1, 0.7, 0.4, 0, true);
      }
    }
    G.enemyKilled(this, headshot);
  }

  // ------------------------------------------------------------------ bosses
  thinkBoss(dt) {
    if (this.boss.final) { this.thinkFinal(dt); return; }
    const G = this.game, P = G.net.targetOf(this);
    if (!P || P.dead) return;
    const Me = this.pos, Pl = P.pos, To = Pl.clone().sub(Me), dist = To.length();
    const rage = this.enraged ? 1.35 : 1;
    if (this.wardSay > 0) this.wardSay -= dt;
    // bile that was spat lands and stays
    if (this.pools && this.pools.length) { for (const Q of this.pools) { Q.t -= dt; if (Q.t <= 0) { const H = G.hazards.fire(Q.at, this.attackDamage * 0.4, 215, 9, lin(0.35, 0.95, 0.2)); if (H) H.label = 'Bile pool'; } } this.pools = this.pools.filter((Q) => Q.t > 0); }
    // ---- signature mechanics, by boss
    const hpf = this.health / this.maxHealth;
    if (this.boss.tier) mechX(this, dt, { Pl });
    if (this.boss.mech === 'ward') {   // Mother Carrion (and the Gravedigger once): a ward that only her wisps hold up
      const stage = this.boss.wardStages === 1 ? (hpf < 0.5 ? 1 : 0) : hpf < 0.33 ? 2 : hpf < 0.66 ? 1 : 0;
      if (stage > (this.wardStage || 0)) {
        this.wardStage = stage; this.ward = 14; this.wardKids = []; this.bossAttack = -1; this.windup = 0; this.bossTimer = 2;
        const wisp = this.boss.wardArt ? DATA.enemies.findIndex((e) => e.art === this.boss.wardArt) : G.enemyOfAI('Flyer');
        for (let i = 0; i < 4 + stage; i++) { const a = i / (4 + stage) * Math.PI * 2, at = Me.clone().add(new THREE.Vector3(Math.cos(a) * 420, 160, Math.sin(a) * 420)); const K = G.spawnEnemy(wisp >= 0 ? wisp : this.boss.minion, at, false, -1, 1.25, 1.6, 0, false); if (K) { K.wardOf = this; this.wardKids.push(K); } }
        this.puppet.setTint([0.6, 0.8, 1.25]); G.audio.playAt('S_Screech', Me, 1.1, 0.8);
        G.banner(this.boss.wardText || 'WARDED - KILL THE WISPS', lin(0.5, 0.8, 1), 3);
      }
      if (this.ward > 0) {
        this.ward -= dt; this.wardKids = this.wardKids.filter((K) => !K.dead);
        if (!this.wardKids.length || this.ward <= 0) { this.ward = 0; this.exposedT = 3.5; this.puppet.setTint(this.enraged ? [1, 0.72, 0.66] : [1, 1, 1]); G.banner('THE WARD BREAKS', lin(1, 0.85, 0.4), 2); G.audio.playAt('S_Door', Me, 1, 1.4); }
      }
    }
    if (this.boss.mech === 'shed') {   // the Abomination comes apart as it is hurt
      const stage = hpf < 0.25 ? 3 : hpf < 0.5 ? 2 : hpf < 0.75 ? 1 : 0;
      if (stage > (this.shedStage || 0)) {
        this.shedStage = stage;
        const crawler = G.enemyOfAI(this.boss.shedAI || 'Crawler');
        for (let i = 0; i < 3 + stage; i++) { const out = G.findFreeLocationNear(Me, 150, 500); if (out) G.spawnEnemy(crawler >= 0 ? crawler : this.boss.minion, out.add(new THREE.Vector3(0, 70, 0)), false, -1, 1, 0.7, 0, false); }
        G.fx.dust(this.feet(), lin(0.5, 0.15, 0.15), 240); G.audio.playAt('S_Gib', Me, 1.2, 0.7); G.banner(this.boss.shedText || 'IT IS COMING APART', lin(0.9, 0.3, 0.3), 2);
      }
    }
    if (this.exposedT > 0) {   // staggered: stands there and takes half again as much
      this.exposedT -= dt; this.stop(); this.windup = 0;
      if (this.exposedT <= 0 && !(this.ward > 0)) this.puppet.setTint(this.enraged ? [1, 0.72, 0.66] : [1, 1, 1]);
      if (this.bossAttack < 0) return;
    }
    if (this.bossAttack < 0) {
      this.bossTimer -= dt * rage * (this.xRate || 1);
      this.attackCd -= dt;
      const dir = this.steer(dist < 1200 && this.canSee(Pl) ? safeN2(To) : G.flowDirection(Me, false, true), 1, dt, Math.hypot(To.x, To.z));
      this.moveToward(dir, 1);
      if (dist < 220 * this.bodyScale * 0.5 + 120 && this.attackCd <= 0) {
        this.attackCd = 1.2; this.lungeT = 0.25;
        P.receiveDamage(this.attackDamage * 0.7, this, true);
        P.applyKnockback(safeN2(To).multiplyScalar(800).add(new THREE.Vector3(0, 350, 0)));
      }
      if (To.y > 250 && this.grounded && this.climb <= 0 && Math.hypot(To.x, To.z) < 900) { this.climb = 3; this.startBossAttack(4); return; }
      this.climb -= dt;
      if (this.bossTimer <= 0) {
        // never the same move twice running, and nothing that needs you close when you are far
        let pick = this.attackMask[randInt(0, this.attackMask.length - 1)];
        for (let k = 0; k < 6 && (pick === this.lastAttack || ((ATTACKS[pick] === 'Sweep' || ATTACKS[pick] === 'Slam') && dist > 900) || (ATTACKS[pick] === 'Hook' && (dist < 450 || dist > 1900))); k++) pick = this.attackMask[randInt(0, this.attackMask.length - 1)];
        this.lastAttack = pick;
        if (this.boss.mech === 'heat' && (this.heat = (this.heat || 0) + 1) >= 4) { this.heat = 0; pick = ATTACKS.indexOf('Vent'); }   // the Furnace: every fourth thing it does is let the heat out
        this.startBossAttack(pick);
        this.bossTimer = frandRange(2.0, 3.2);
      }
      return;
    }
    this.bossT += dt * rage;
    const feet = this.feet().add(new THREE.Vector3(0, 4, 0));
    const done = () => { this.bossAttack = -1; this.windup = 0; };
    switch (ATTACKS[this.bossAttack]) {
      case 'Charge':
        if (this.bossStep === 0) {
          this.windup = 1; this.stop();
          this.chargeDir = safeN2(To);
          if (this.bossT > 0.8) { this.bossStep = 1; this.bossT = 0; this.windup = 0; G.audio.playAt('S_BossRoar', Me, 1, 1.2); }
        } else {
          this.moveToward(this.chargeDir, 1); this.bossMoveOverride = 2000;
          if (Pl.distanceTo(Me) < 120 + 50 * this.bodyScale && !this.leapHit) {
            this.leapHit = true;
            P.receiveDamage(this.attackDamage * 1.4, this, true);
            P.applyKnockback(this.chargeDir.clone().multiplyScalar(1300).add(new THREE.Vector3(0, 500, 0)));
          }
          if (this.bossT > 1.3) {
            if (!this.leapHit) { this.exposedT = 2.4; this.puppet.setTint([1.25, 1.15, 0.6]); G.hud.floater(Me.clone().add(new THREE.Vector3(0, this.half * 0.7, 0)), 'WINDED', [1, 0.9, 0.3], 1.6); }
            else if (this.enraged && !this.chargedTwice) { this.chargedTwice = true; this.bossStep = 0; this.bossT = 0.35; this.leapHit = false; break; }   // enraged: straight into a second one
            done(); this.leapHit = false; this.chargedTwice = false;
          }
        }
        break;
      case 'Slam':
        this.windup = 1; this.stop();
        if (this.bossT > 0.75) {
          G.fx.ring(feet, 520, lin(1, 0.4, 0.1), 0.4);
          G.fx.dust(feet, lin(0.3, 0.2, 0.15), 200);
          G.audio.playAt('S_Stomp', Me, 1.2, 0.8);
          G.shakeAt(Me, 600);
          if (dist < 560 && Pl.y < Me.y + 200) {
            P.receiveDamage(this.attackDamage * 1.2, this, false);
            P.applyKnockback(safeN2(To).multiplyScalar(900).add(new THREE.Vector3(0, 600, 0)));
          }
          G.hazards.ring(feet, this.attackDamage * 0.6, 1100, 1600, lin(1, 0.4, 0.1));
          done();
        }
        break;
      case 'Volley': {
        this.stop();
        if (this.bossT > 0.4 + this.bossStep * 0.35 && this.bossStep < 3) {
          const cards = !!this.boss.cards;
          this.fireAt(Pl, cards ? 1700 : 1300, 0, this.attackDamage * 0.45, cards ? 0 : 80, cards ? 'Card' : 'Orb', cards ? [1, 1, 1] : lin(1, 0.3, 0.3), this.enraged ? 9 : 7, 9);
          this.bossStep++;
        }
        if (this.bossStep >= 3) done();
        break;
      }
      case 'Summon':
        this.windup = 1; this.stop();
        if (this.bossT > 0.9) {
          G.fx.ring(feet, 400, lin(0.6, 0.2, 1), 0.5);
          const n = this.enraged ? 6 : 4;
          const minion = this.boss.minion;
          const fly = DATA.enemies[minion].ai === 'Flyer';
          for (let i = 0; i < n; i++) {
            const out = G.findFreeLocationNear(Me, 200, 600);
            if (out) G.spawnEnemy(minion, out.add(new THREE.Vector3(0, fly ? 300 : 90, 0)), false, -1, 1, 0.6, 0, false);
          }
          done();
        }
        break;
      case 'Leap':
        if (this.bossStep === 0) {
          this.windup = 1; this.stop();
          if (this.bossT > 0.5) {
            this.windup = 0; this.bossStep = 1;
            const T = 1.1;
            const v = Pl.clone().sub(Me).divideScalar(T);
            v.y = ((Pl.y - Me.y) + 0.5 * GRAV * T * T) / T;
            this.launch(v);
            G.hazards.marker(Pl.clone().sub(new THREE.Vector3(0, 90, 0)), this.attackDamage * 1.3, 420, T + 0.05, lin(1, 0.25, 0.1));
          }
        } else if (this.bossT > 0.3 && this.grounded && !this.launched) {
          G.fx.dust(feet, lin(0.3, 0.2, 0.15), 250);
          G.hazards.ring(feet, this.attackDamage * 0.5, 900, 1200, lin(1, 0.5, 0.2));
          G.audio.playAt('S_Stomp', Me, 1.2, 0.7);
          G.shakeAt(Me, 700);
          this.exposedT = 1.1;
          done();
        } else if (this.bossT > 3) done();
        break;
      case 'Teleport':
        if (this.bossStep === 0) { this.blink(500, 800); this.bossStep = 1; }
        if (this.bossT > 0.6) { this.bossAttack = 2; this.bossStep = 0; this.bossT = 0; }
        break;
      case 'Ring': {
        this.windup = 1; this.stop();
        const rings = this.enraged ? 4 : 3;
        if (this.bossStep < rings && this.bossT > 0.5 + this.bossStep * 0.75) {
          G.hazards.ring(feet, this.attackDamage * 0.6, 800 + this.bossStep * 150, 2400, this.boss.cards ? lin(0.2, 1, 0.5) : lin(1, 0.3, 0.2));
          this.bossStep++;
        }
        if (this.bossStep >= rings) done();
        break;
      }
      case 'Barrage':
        this.windup = 1; this.stop();
        if (this.bossStep === 0) {
          this.bossStep = 1;
          const n = this.enraged ? 12 : 8;
          for (let i = 0; i < n; i++) {
            let spot = Pl.clone().add(new THREE.Vector3(frandRange(-700, 700), 0, frandRange(-700, 700)));
            if (i === 0) spot = Pl.clone().addScaledVector(P.vel, 0.8);
            const h = G.phys.raycastDown(spot.clone().add(new THREE.Vector3(0, 1500, 0)), 4500);
            if (h) spot = h.point;
            G.hazards.marker(spot, this.attackDamage * 0.7, 190, 1.1 + i * 0.08, lin(0.9, 0.2, 0.6));
          }
        }
        if (this.bossT > 1) done();
        break;
      case 'Sweep': {   // a wide swing: the ground in front lights up in an arc. Back off or get behind it.
        this.stop();
        if (this.bossStep === 0) {
          this.bossStep = 1; this.windup = 1; this.yaw = Math.atan2(To.x, To.z);
          const R = 300 + 95 * this.bodyScale, n = this.enraged ? 7 : 5, gid = HZ_GROUP++;
          for (let ring = 0; ring < 2; ring++) for (let i = 0; i < n; i++) {
            const a = this.yaw + (i / (n - 1) - 0.5) * (this.enraged ? 2.7 : 2.1), r = R * (ring ? 1 : 0.55);
            const H = G.hazards.marker(feet.clone().add(new THREE.Vector3(Math.sin(a) * r, 0, Math.cos(a) * r)), this.attackDamage * 1.1, ring ? 195 : 150, 0.85, lin(1, 0.55, 0.15)); if (H) { H.gid = gid; H.label = 'Sweep'; }
          }
          G.audio.playAt('S_Snarl', Me, 1, 0.6);
        }
        if (this.bossStep === 1 && this.bossT > 0.85) { this.bossStep = 2; this.lungeT = 0.3; this.windup = 0; G.audio.playAt('S_Slam', Me, 0.9, 1.1); }
        if (this.bossT > 1.3) done();
        break;
      }
      case 'Hook': {   // the chain: a line on the ground, and if you are standing in it when it lands you are dragged in
        this.stop();
        if (this.bossStep === 0) {
          this.bossStep = 1; this.windup = 1; this.chargeDir = safeN2(To); this.yaw = Math.atan2(To.x, To.z);
          const gid = HZ_GROUP++;
          for (let i = 1; i <= 10; i++) { const H = G.hazards.marker(feet.clone().addScaledVector(this.chargeDir, 60 + i * 175), this.attackDamage * 0.5, 95, 0.7, lin(0.75, 0.8, 0.9)); if (H) { H.gid = gid; H.label = 'Chain hook'; } }
          G.audio.playAt('S_Chain', Me, 1, 0.7);
        } else if (this.bossStep === 1 && this.bossT > 0.7) {
          this.bossStep = 2; this.windup = 0; this.lungeT = 0.25;
          const rel = Pl.clone().sub(Me), along = rel.x * this.chargeDir.x + rel.z * this.chargeDir.z, perp = Math.hypot(rel.x - this.chargeDir.x * along, rel.z - this.chargeDir.z * along);
          this.hooked = along > 60 && along < 1880 && perp < 135 && Math.abs(rel.y) < 420;
          if (this.hooked) { P.applyKnockback(this.chargeDir.clone().multiplyScalar(-Math.min(2600, 700 + along * 1.25)).add(new THREE.Vector3(0, 380, 0))); G.hud.floater(Pl.clone().add(new THREE.Vector3(0, 60, 0)), 'HOOKED', [0.8, 0.85, 1], 1.5); G.audio.playAt('S_Chain', Pl, 1, 1.2); }
        } else if (this.bossStep === 2 && this.bossT > 1.15) {
          if (this.hooked) { this.hooked = false; this.startBossAttack(ATTACKS.indexOf('Sweep')); } else { this.exposedT = 1.2; done(); }
        }
        break;
      }
      case 'Pools': {   // bile: blobs land where you are and where you are going, and the ground stays poisoned
        this.windup = 1; this.stop();
        const n = this.enraged ? 7 : 5;
        if (this.bossStep < n && this.bossT > 0.45 + this.bossStep * 0.2) {
          let spot = this.bossStep === 0 ? Pl.clone() : this.bossStep === 1 ? Pl.clone().addScaledVector(P.vel || new THREE.Vector3(), 0.7) : Pl.clone().add(new THREE.Vector3(frandRange(-650, 650), 0, frandRange(-650, 650)));
          const h = G.phys.raycastDown(spot.clone().add(new THREE.Vector3(0, 600, 0)), 3000); if (h) spot = h.point.clone(); else spot.y = feet.y;
          const H = G.hazards.marker(spot, this.attackDamage * 0.6, 200, 0.95, lin(0.35, 0.95, 0.2)); if (H) H.label = 'Bile';
          (this.pools = this.pools || []).push({ at: spot, t: 0.95 });
          this.bossStep++; if (this.bossStep === 1) G.audio.playAt('S_Spit', Me, 1.2, 0.6);
        }
        if (this.bossStep >= n && this.bossT > 0.45 + n * 0.2 + 0.4) done();
        break;
      }
      case 'NailWall': {   // a row of nails across you with one gap in it, then another along you
        this.windup = 1; this.stop();
        const waves = this.enraged ? 3 : 2;
        if (this.bossStep < waves && this.bossT > 0.4 + this.bossStep * 1.3) {
          const d = safeN2(To), axis = this.bossStep % 2 === 0 ? new THREE.Vector3(d.z, 0, -d.x) : d, gap = randInt(-3, 3), gid = HZ_GROUP++;
          const base = Pl.clone().addScaledVector(P.vel || new THREE.Vector3(), 0.3);
          for (let i = -7; i <= 7; i++) {
            if (i === gap) continue;
            let spot = base.clone().addScaledVector(axis, i * 215);
            const h = G.phys.raycastDown(spot.clone().add(new THREE.Vector3(0, 500, 0)), 2600); if (h) spot = h.point.clone(); else spot.y = feet.y;
            const H = G.hazards.marker(spot, this.attackDamage * 0.85, 118, 1.1, lin(0.9, 0.88, 0.8)); if (H) { H.gid = gid; H.label = 'Nail wall'; }
          }
          this.bossStep++; G.audio.playAt('S_Rack', Me, 1.2, 0.6);
        }
        if (this.bossStep >= waves && this.bossT > 0.4 + waves * 1.3 + 0.6) done();
        break;
      }
      case 'Ambush':   // gone, then right behind you and already swinging
        if (this.bossStep === 0) { this.bossStep = 1; this.blink(280, 430); G.audio.playAt('S_Wings', this.pos, 1, 0.6); }
        this.stop();
        if (this.bossT > 0.4) this.startBossAttack(ATTACKS.indexOf('Sweep'));
        break;
      case 'Dive':   // she marks a line through you and comes down it
        if (this.bossStep === 0) {
          this.windup = 1; this.stop();
          if (this.bossT < dt * 1.5 + 0.001) {
            this.chargeDir = safeN2(To); const gid = HZ_GROUP++;
            for (let i = 0; i < 8; i++) { let spot = feet.clone().addScaledVector(this.chargeDir, 180 + i * 230); const h = G.phys.raycastDown(spot.clone().add(new THREE.Vector3(0, 500, 0)), 2600); if (h) spot = h.point.clone(); const H = G.hazards.marker(spot, this.attackDamage * 1.1, 150, 0.9 + i * 0.05, lin(0.9, 0.2, 0.6)); if (H) { H.gid = gid; H.label = 'Dive'; } }
            G.audio.playAt('S_Screech', Me, 1, 1.1);
          }
          if (this.bossT > 0.9) { this.bossStep = 1; this.bossT = 0; this.windup = 0; }
        } else {
          this.moveToward(this.chargeDir, 1); this.bossMoveOverride = 2300;
          if (this.bossT > 0.8) { this.exposedT = 1.0; done(); }
        }
        break;
      default: if (!attackX(this, ATTACKS[this.bossAttack], dt, { Pl, To, dist, feet, done })) done();
    }
  }
  // ---- The Founder. Three acts by health: blades, then beams and falling rubble with his hands called in, then the room burns.
  thinkFinal(dt) {
    const G = this.game, F = G.final, P = G.net.targetOf(this), C = G.vaultCenter(), R0 = 1500;
    if (!F || !P) return;
    if (this.fAct === undefined) { this.fAct = 1; this.fCd = 2.5; this.fAtk = ''; this.fT = 0; this.fStep = 0; this.fLast = ''; this.fSummon = 12; this.fMelee = 0; this.finalInv = 0; }
    const hp = this.health / this.maxHealth, act = hp > 0.66 ? 1 : hp > 0.33 ? 2 : 3;
    const To = P.pos.clone().sub(this.pos), dist = Math.hypot(To.x, To.z), dir = safeN2(To), dmg = this.attackDamage;
    this.finalInv = Math.max(0, this.finalInv - dt); this.fMelee -= dt;
    // act change: roar, shove everyone back, call the floor staff
    if (act > this.fAct) {
      this.fAct = act; this.finalInv = 2.6; this.fAtk = 'roar'; this.fT = 0; this.fStep = 0; F.beam = null;
      G.banner(G.map.final.acts[act - 2], lin(1, 0.25, 0.1), 3.5); G.audio.playAt('S_BossRoar', this.pos, 1, act === 3 ? 0.6 : 0.8);
      G.hazards.ring(this.feet(), dmg * 0.5, 1300, 2200, lin(1, 0.3, 0.15)); G.player.addShake(2);
      this.enraged = act === 3; if (act === 3) { this.baseSpeed *= 1.45; F.safeR = R0; }
      this.fSummon = 0.5;
    }
    if (act === 3 && F.safeR > 880) F.safeR = Math.max(880, F.safeR - dt * 28);
    this.fSummon -= dt;
    if (act >= 2 && this.fSummon <= 0 && G.enemies.filter((e) => !e.dead).length < 14) {
      this.fSummon = act === 3 ? 16 : 22;
      for (let i = 0; i < (act === 3 ? 6 : 4); i++) { const a = Math.random() * 6.28, r = 400 + Math.random() * 700; const E = G.spawnEnemy(G.enemyOfAI(['Walker', 'Runner', 'Runner', 'Leaper'][randInt(0, 3)], 'Runner'), new THREE.Vector3(C.x + Math.cos(a) * r, 110, C.z + Math.sin(a) * r), false, -1, 1, 0.6, 0, false); E.emerge = 1.5; }
    }
    const face = () => { if (dist > 10) this.yaw = Math.atan2(To.x, To.z); };
    // ---- running an attack
    if (this.fAtk) {
      this.fT += dt; this.stop(); face();
      switch (this.fAtk) {
        case 'roar': this.windup = 0.2; if (this.fT > 2.4) this.fAtk = ''; break;
        case 'deal': {   // fans of blades, aimed where you are heading
          const n = act === 1 ? 3 : act === 2 ? 4 : 5, gap = act === 3 ? 0.34 : 0.45;
          this.windup = 0.15;
          if (this.fT > 0.6 + this.fStep * gap && this.fStep < n) {
            this.fStep++; this.lungeT = 0.2;
            const lead = P.pos.clone().addScaledVector(P.vel || new THREE.Vector3(), 0.25); lead.y = P.pos.y - 20;
            this.fireAt(lead, 1500 + act * 150, 0, dmg * 0.45, 0, 'Card', lin(1, 0.2, 0.2), 5 + act * 2, 40 + act * 8);
            G.audio.playAt('S_Spit', this.pos, 0.9, 1.3);
          }
          if (this.fT > 0.6 + n * gap + 0.5) this.fAtk = '';
          break;
        }
        case 'slam': {   // leap onto the target; a shockwave you have to jump
          if (this.fStep === 0 && this.fT > 0.45) { this.fStep = 1; const t = 0.95; this.launch(new THREE.Vector3(To.x / t, 1500, To.z / t)); this.fAir = 0; G.audio.playAt('S_Jump', this.pos, 1, 0.5); }
          else if (this.fStep === 0) this.windup = 0.2;
          else if (this.fStep === 1) { this.fAir += dt; if ((this.grounded && this.fAir > 0.3) || this.fAir > 2.2) { this.fStep = 2; this.fT = 0; this.finalImpact(dmg, act); } }
          else if (this.fStep === 2) { if (act === 3 && this.fT > 0.5 && !this.fSecond) { this.fSecond = true; G.hazards.ring(this.feet(), dmg * 0.6, 1400, 2400, lin(1, 0.5, 0.2)); } if (this.fT > 1.1) { this.fAtk = ''; this.fSecond = false; } }
          return;   // physics runs the leap; stop() above would kill it
        }
        case 'wheel': {   // the seal: every other wedge of the floor lights up, then the rest
          this.windup = 0.15;
          const waves = act === 1 ? 1 : 2;
          if (this.fStep < waves && this.fT > 0.5 + this.fStep * 1.7) {
            const par = (this.fPar = this.fStep === 0 ? randInt(0, 1) : 1 - this.fPar);
            for (let w = 0; w < 8; w++) if ((w & 1) === par) for (const r of [330, 720, 1110, 1400]) { const a = (w + 0.5) / 8 * Math.PI * 2; G.hazards.marker(new THREE.Vector3(C.x + Math.cos(a) * r, 2, C.z + Math.sin(a) * r), dmg * 0.9, 150 + r * 0.24, act === 3 ? 1.15 : 1.5, lin(1, 0.2, 0.1)); }
            this.fStep++; G.audio.playAt('S_Door', this.pos, 1, 0.6);
          }
          if (this.fT > 0.5 + waves * 1.7 + 0.6) this.fAtk = '';
          break;
        }
        case 'rain': {   // rubble falls where you stand and where you are running to
          this.windup = 0.1;
          if (this.fT > this.fStep * (act === 3 ? 0.2 : 0.28) && this.fT < 4.2) {
            this.fStep++;
            const at = this.fStep % 2 ? P.pos.clone().addScaledVector(P.vel || new THREE.Vector3(), 0.6) : P.pos.clone().add(new THREE.Vector3(frandRange(-500, 500), 0, frandRange(-500, 500)));
            at.y = 2; G.hazards.marker(at, dmg * 0.7, 190, 0.85, lin(1, 0.75, 0.2));
          }
          if (this.fT > 5) this.fAtk = '';
          break;
        }
        case 'beams': {   // rotating beams from the boss; they reverse in act three
          if (this.fStep === 0) { this.fStep = 1; F.beam = { x: this.pos.x, y: this.pos.y - this.feetOffset, z: this.pos.z, ang: Math.random() * 6.28, spd: (Math.random() < 0.5 ? -1 : 1) * (act === 3 ? 0.95 : 0.7), n: act === 3 ? 4 : 3, dmg: dmg * 0.6, t: 0 }; G.audio.playAt('S_Beam', this.pos, 1, 0.6); }
          this.windup = 0.2;
          if (act === 3 && this.fStep === 1 && this.fT > 3.6) { this.fStep = 2; F.beam.spd *= -1; }
          if (this.fT > 7) { F.beam = null; this.fAtk = ''; }
          break;
        }
        default: this.fAtk = ''; break;
      }
      return;
    }
    // ---- between attacks: stalk, swipe if close, pick the next move
    this.windup = 0;
    if (dist > 260) this.moveToward(dir, 1); else this.stop();
    face();
    if (dist < 330 && this.fMelee <= 0 && Math.abs(To.y) < 300) { this.fMelee = 1.3; this.lungeT = 0.25; P.receiveDamage(dmg * 0.7, this, true); P.applyKnockback(dir.clone().multiplyScalar(900).add(new THREE.Vector3(0, 380, 0))); G.audio.playAt('S_Attack', this.pos, 1, 0.6); }
    this.fCd -= dt;
    if (this.fCd <= 0) {
      const pool = act === 1 ? ['deal', 'slam', 'wheel'] : ['deal', 'slam', 'wheel', 'rain', 'beams'];
      let a = pool[randInt(0, pool.length - 1)]; if (a === this.fLast) a = pool[(pool.indexOf(a) + 1) % pool.length];
      this.fLast = this.fAtk = a; this.fT = 0; this.fStep = 0;
      this.fCd = act === 1 ? 2.4 : act === 2 ? 1.8 : 1.2;
    }
  }
  finalImpact(dmg, act) {
    const G = this.game, f = this.feet();
    G.audio.playAt('S_Slam', this.pos, 1, 0.6); G.audio.playAt('S_Explosion', this.pos, 0.8, 0.7);
    G.fx.dust(f, lin(0.4, 0.2, 0.15), 260); G.shakeAt(this.pos, 900);
    G.hazards.ring(f, dmg * 0.8, 1150, 1900, lin(1, 0.3, 0.15));
    for (let i = 0; i < 2 + act; i++) { const a = Math.random() * 6.28, r = 350 + Math.random() * 500; G.hazards.marker(new THREE.Vector3(f.x + Math.cos(a) * r, 2, f.z + Math.sin(a) * r), dmg * 0.7, 210, 1.0, lin(1, 0.3, 0.1)); }
    for (const T of [G.player, ...G.net.ghosts.values()]) if (!T.dead && T.pos.distanceTo(this.pos) < 380) { T.receiveDamage(dmg, this, true); T.applyKnockback(safeN2(T.pos.clone().sub(this.pos)).multiplyScalar(1100).add(new THREE.Vector3(0, 500, 0))); }
  }
  startBossAttack(a) { this.bossAttack = a; this.bossT = 0; this.bossStep = 0; this.leapHit = false; }
  attackName() { return ATTACKS[this.bossAttack]; }

  draw(batches) {
    this.puppet.draw(batches[this.ckind] || batches.creature, batches.fx, batches.add, !this.dead);
  }
}

function randDir() {
  const v = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
  return v.lengthSq() < 1e-4 ? v.set(0, 1, 0) : v.normalize();
}
