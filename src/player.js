// The gunslinger (port of ADMHCharacter): first-person movement kit (sprint, slide, air jumps, dash, wall-run,
// mantle, grapple, ground slam, jump pads), camera feel (bob, roll, FOV kick, recoil springs, shake), gunplay
// (hitscan/pierce, beams, flames, chain lightning, projectiles, crits, headshots), 120 upgrades with proc
// triggers, and every casino station.
import { buildHit, buildKill, buildHurt, buildTick, buildChanged, buildNote } from './builds.js';
import { cash, cost10, difficulty, mutMoney, mutHealth } from './data.js';
import * as THREE from 'three';
import { Meta } from './meta.js';
import {
  diff, DATA, STATS, TONICS, zombieHealth, payScale, effRound, SUITS, SUIT_BONUS, SUIT_HEX, SYMBOLS, VAULT_COST, RARITIES, RARITY_HEX, rarityIndex, luckMult, luckRerollChance, rollRarity, rollUpgradeOfRarity,
  rollWeaponOfRarity, rarityPrice, hexRGB, lerp3, lin, randInt, frandRange,
} from './data.js';

const WalkSpeed = 840, SprintMult = 1, GroundJumpZ = 820, AirJumpZ = 760, DashSpeed = 2500, DashDuration = 0.16;
const GrappleRange = 4500, GrappleSpeed = 2700, BaseGravity = 1.6;
const RADIUS = 38, HALF = 90;
const UP = new THREE.Vector3(0, 1, 0);
const SLOT_STRIP = [0, 1, 0, 2, 0, 1, 3, 0, 5, 1, 2, 4, 0, 1, 6, 2];
import { gunSound } from './gunsound.js';
import { gunFeel } from './guns.js';
import { CLASSES, classById, rollBuff, rollGunMod, ALT_STATS } from './classes.js';
import { Turret } from './turret.js';
import { GRENADES, GRENADE_MAX } from './grenades.js';
import { MELEE, MELEE_PRICE, MELEE_CODE, isMelee, rollMelee, HONE_MAX, HONE_COST, honeDamage, honeRange, honeSpeed, honeCleave, reachText } from './melee.js';
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
// a wheel wedge or shop offer can be a gun index or a melee code
const wdef = (c) => (isMelee(c) ? MELEE[c - MELEE_CODE] : DATA.weapons[c]);
const flat = (v) => V3(v.x, 0, v.z);
const safeN2 = (v) => { const f = flat(v); const l = f.length(); return l > 1e-4 ? f.divideScalar(l) : f.set(0, 0, 0); };
const interpTo = (c, t, dt, s) => c + (t - c) * Math.min(1, dt * s);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const D2R = Math.PI / 180;
const WHITE = [1, 1, 1];
const STAT = Object.fromEntries(STATS.map((s, i) => [s, i]));
const vrandCone = (dir, half) => {
  // uniform within a cone around dir
  const u = Math.random(), v = Math.random();
  const cosT = 1 - u * (1 - Math.cos(half)), sinT = Math.sqrt(1 - cosT * cosT), phi = v * Math.PI * 2;
  const w = dir.clone().normalize();
  const a = Math.abs(w.y) < 0.99 ? UP : V3(1, 0, 0);
  const t1 = new THREE.Vector3().crossVectors(a, w).normalize(), t2 = new THREE.Vector3().crossVectors(w, t1);
  return w.multiplyScalar(cosT).addScaledVector(t1, sinT * Math.cos(phi)).addScaledVector(t2, sinT * Math.sin(phi));
};
// cheap 1D value noise for camera shake
const noise1 = (x) => { const i = Math.floor(x), f = x - i; const h = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return (s - Math.floor(s)) * 2 - 1; }; const u = f * f * (3 - 2 * f); return h(i) * (1 - u) + h(i + 1) * u; };

const ACTIVE_STATS = ['HollowN', 'HeadStreak', 'CritFlash', 'EliteBlast', 'KillRush', 'KillTempo', 'Bulwark', 'SlideLaunch', 'Glide', 'Parry', 'LandShock', 'WallCrit', 'BladeWave', 'AirKillJump', 'Trample', 'DashReload', 'TapedMag', 'FinalRound', 'RampFire', 'HotBarrel', 'LightBolt', 'AltLauncher', 'AltGravity', 'AltRail', 'AltBuck', 'ActiveReload', 'SteadyAim'];
const PROC_DAMAGE = ['Explode', 'Nova', 'Missile', 'Chain', 'Shockwave', 'Ignite', 'Skip'];
export class Player {
  constructor(game) {
    this.game = game;
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.yaw = 0; this.pitch = 0;
    this.grounded = false; this.groundNormal = UP.clone();
    this.stats = new Array(STATS.length).fill(0);
    this.booth = new Array(STATS.length).fill(0);
    this.upgradeStacks = new Array(DATA.upgrades.length).fill(0);
    this.upgradeOrder = [];
    this.procCd = new Array(DATA.upgrades.length).fill(0);
    this.periodic = new Array(DATA.upgrades.length).fill(0);
    this.weapons = [0, 1, 2].map((i) => ({ def: i ? -1 : 0, tier: 0, ammo: 0, reserve: 0, mods: [], altCd: 0, hot: 0 }));
    this.cls = CLASSES[0];
    this.maxSlots = 2; this.active = 0;
    this.money = 500; this.luck = 0; this.kills = 0; this.headshots = 0;
    this.maxHealth = 150; this.health = 150; this.overshield = 0;
    this.recompute();
    this.weapons[0].ammo = this.magSize(this.weapons[0]);
    this.weapons[0].reserve = this.reserveSize(this.weapons[0]);
    this.health = this.maxHealth;
    this.dashCharges = this.maxDash(); this.airJumps = this.maxAirJumps();
    // state
    Object.assign(this, {
      dead: false, sinceDamage: 99, hurtFlash: 0, invuln: 0, hitMarker: 0, hitKill: false, hitHead: false, hitScale: 1, haste: 0, hasteT: 0, rage: 0, rageT: 0,
      slowT: 0, slowAmt: 0, timeSinceGrounded: 0, timeSinceJump: 9, wallRunCd: 0, mantleCd: 0, slideCd: 0, slideDmgWindow: 0, padCd: 0, grappleCd: 0,
      dashRecharge: 0, dashT: 0, dashDir: V3(1, 0, 0), dashExit: 0, dashHits: new Set(), grappling: false, grappleT: 0, grapplePoint: V3(0, 0, 0),
      sliding: false, slideT: 0, slideSpeed: 0, wallRunning: false, wallSide: 0, wallNormal: V3(1, 0, 0), wallDir: V3(0, 0, 1), wallLeft: 0, wallProc: 0,
      slamming: false, slamStartY: 0, lastFall: 0, gravityScale: BaseGravity, maxWalk: WalkSpeed, airControl: 0.65,
      fireCd: 0, bloom: 0, reloading: false, reloadT: 0, reloadDur: 0, fireConsumed: false, procDepth: 0,
      eyeZ: 66, landDip: 0, landDipVel: 0, bobPhase: 0, footDist: 0, camRoll: 0, camKick: new THREE.Vector2(), camKickVel: new THREE.Vector2(),
      shake: 0, shakeT: 0, fovKick: 0, fov: 100, killPulse: 0, crossKick: 0, damageInd: [], heartbeat: 0, revives: 0, lastRound: 1,
      slotPulls: 0, pawnRerolls: 0, pawnOffers: [], chestsOpened: 0, benchUses: 0, benchJob: null, abilityCd: 0, deadeyeT: 0, rushT: 0, rushGuardT: 0, rushHits: new Set(), rushDir: V3(1, 0, 0), turrets: [], turretNext: 0,
      aimHold: 0, echoT: 0, healBucket: 12, swapBuffT: 0, wells: [], arFail: false, grenades: [0, 0], grenadeCd: 0, gzones: [], tonicLevels: new Array(8).fill(0), menu: null, menuStation: null, menuTick: 0, focus: null,
      showInventory: false, input: null, lookDelta: { x: 0, y: 0 }, launchedT: 0,
    });
  }
  stat(name) { return this.stats[STAT[name]] || 0; }
  get S() { if (this.statsDirty || !this._S) { const o = {}; for (let i = 1; i < STATS.length; i++) if (this.stats[i]) o[STATS[i]] = this.stats[i]; this._S = o; this.statsDirty = false; } return this._S; }
  get W() { return DATA.weapons[this.slot.def >= 0 ? this.slot.def : 0]; }
  get slot() { return this.weapons[this.active]; }
  eye() { return V3(this.pos.x, this.pos.y + this.eyeZ + this.landDip, this.pos.z); }
  forward() { return V3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); }
  right() { return V3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)); }
  inMenu() { return !!this.menu; }
  maxDash() { return 1 + Math.round(this.stat('DashCharges')); }
  maxAirJumps() { return 1 + Math.round(this.stat('ExtraJumps')); }
  dashCooldown() { return 1.8 / (1 + Math.max(0, this.stat('DashCooldown'))); }
  grappleCooldown() { return 3 / (1 + Math.max(0, this.stat('GrappleCooldown'))); }
  maxWallRun() { return 1.4 + this.stat('WallRunTime'); }
  // wall-run stamina: drains while on a wall, only comes back with your feet on the ground
  maxWallStam() { return 3 + this.stat('WallRunTime') * 2; }
  pickupRadius() { return 150 * (1 + this.stat('PickupRange')); }
  adsAlpha() { return this.game.vm.aimA; }
  toast(t, c) { this.game.hud.toast(t, c); }
  play(name, vol = 1, pitch = 1, jitter = 0) { this.game.audio.play(name, vol, pitch, jitter); }

  // ------------------------------------------------------------------ stats & inventory
  magSize(S) { if (S.def < 0) return 0; const W = DATA.weapons[S.def]; return Math.max(1, Math.ceil(W.mag * (1 + this.stat('MagSize')) * (1 + 0.1 * S.tier) * (Meta.gunLevel(W.name) >= 2 ? 1.15 : 1))); }
  reserveSize(S) { if (S.def < 0) return 0; const W = DATA.weapons[S.def]; return Math.max(0, Math.ceil(W.reserve * (1 + this.stat('ReserveAmmo')) * (1 + 0.1 * S.tier))); }
  weaponDps(raw) {
    const S = this.slot; if (S.def < 0) return 50;
    const W = DATA.weapons[S.def];
    let d = W.dmg * W.pellets * W.rate * (1 + this.stat('FireRate')) * (1 + 0.03 * S.tier) * (1 + 0.2 * S.tier);
    if (!raw) d *= Math.max(0.1, 1 + this.stat('Damage'));
    if (W.mode === 'Chain') d *= 1 + 0.4 * W.chains;
    return d;
  }
  // flat-damage upgrades keep pace with enemy health: x1 on round 1, growing as enemies do
  flatScale() { return zombieHealth(Math.max(1, this.game.round)) / 150; }
  power() { return Math.max(25, this.weaponDps(true) * 0.5); }   // half the gun's DPS before damage bonuses: dealDamage applies those, once
  spreadDeg() {
    const W = this.W;
    let s = W.spread * (this.aiming ? 0.55 : 1) * Math.max(0.15, 1 - this.stat('Spread')) * (1 + this.bloom);
    if (!this.grounded) s *= 1.15;
    return s;
  }
  hasWeapon(def) { for (let i = 0; i < this.maxSlots; i++) if (this.weapons[i].def === def) return true; return false; }
  giveWeapon(def) {
    if (isMelee(def)) { this.meleeDef = def - MELEE_CODE; this.meleeCd = 0.3; this.game.vm.meleeShow(MELEE[this.meleeDef]); this.play('S_Switch', 0.8); if (this.meleeTier > 0) this.toast(`Your honing carries over: ${MELEE[this.meleeDef].name} +${this.meleeTier}`, '#ffcd5a'); return; }
    for (let i = 0; i < this.maxSlots; i++) if (this.weapons[i].def === def) { const S = this.weapons[i]; S.ammo = this.magSize(S); S.reserve = this.reserveSize(S); this.switchTo(i); return; }
    let target = this.active;
    for (let i = 0; i < this.maxSlots; i++) if (this.weapons[i].def < 0) { target = i; break; }
    const S = this.weapons[target];
    S.def = def; S.tier = 0; S.mods = []; S.altCd = 0; S.hot = 0;
    this.reloading = false; this.active = target; this.fireCd = 0.45; this.wield = false;
    this.recompute(); S.ammo = this.magSize(S); S.reserve = this.reserveSize(S);
    this.game.vm.setWeapon(def, 0, true);
  }
  // Melee in hand. Q is still a quick swing with a gun out; drawing the blade (X, 4 or the wheel) puts the gun away:
  // fire swings, aim is a heavy blow, and the blade hits harder, reaches further and you move faster for it.
  setWield(on) {
    if (this.dead || this.inMenu() || !!this.wield === !!on) return;
    if (!on && this.slot.def < 0) return;
    this.wield = !!on; this.reloading = false; this.fireCd = 0.3; this.meleeCd = Math.max(this.meleeCd || 0, 0.22); this.railT = 0; this.spool = 0;
    this.play('S_Switch', 0.8, on ? 0.85 : 1);
    if (on) this.game.vm.meleeShow(MELEE[this.meleeDef]); else this.game.vm.setWeapon(this.slot.def, Math.min(3, this.slot.tier), true);
  }
  switchTo(i) {
    if (i >= this.maxSlots || this.weapons[i].def < 0) return;
    if (i === this.active) { if (this.wield) this.setWield(false); return; }
    this.wield = false;
    const prev = this.slot;
    this.active = i; this.reloading = false; this.fireCd = 0.38 / (1 + this.stat('SwapSpeed'));
    this.recompute();
    if (this.stat('SwapReload') > 0 && prev.def >= 0) { const take = Math.min(this.magSize(prev) - prev.ammo, prev.reserve); if (take > 0) { prev.ammo += take; prev.reserve -= take; } this.swapBuffT = 2; }   // Two-Gun Kid
    this.game.vm.setWeapon(this.weapons[i].def, Math.min(3, this.weapons[i].tier), true);
  }
  cycleWeapon(dir) {
    if (this.dead || this.inMenu()) return;
    // the wheel runs through the guns and then the blade
    const order = []; for (let s = 0; s < this.maxSlots; s++) if (this.weapons[s].def >= 0) order.push(s); order.push(-1);
    if (!this.wield && this.slot.def < 0) { if (order.length > 1) this.switchTo(order[0]); else this.setWield(true); return; }   // the hand is empty (the gun went to the turret): take the next gun
    const at = this.wield ? order.length - 1 : Math.max(0, order.indexOf(this.active)), to = order[(at + dir + order.length * 2) % order.length];
    if (to < 0) this.setWield(true); else this.switchTo(to);
  }
  refillMags() { for (const S of this.weapons) if (S.def >= 0) { const take = Math.min(this.magSize(S) - S.ammo, S.reserve); if (take > 0) { S.ammo += take; S.reserve -= take; } } }
  refillAll() { for (const S of this.weapons) if (S.def >= 0) { S.ammo = this.magSize(S); S.reserve = this.reserveSize(S); } }
  startReload() {
    if (this.reloading) return;
    const S = this.slot;
    if (S.def < 0 || S.ammo >= this.magSize(S) || S.reserve <= 0) return;
    this.reloading = true;
    this.arFail = false;
    this.reloadDur = DATA.weapons[S.def].reload / (1 + Math.max(-0.5, this.stat('ReloadSpeed') + (this.nearTurret ? 0.3 * this.stat('TurretAura') : 0))) / (Meta.gunLevel(DATA.weapons[S.def].name) >= 1 ? 1.1 : 1);
    if (this.stat('TapedMag') > 0) { S.tapeN = (S.tapeN || 0) + 1; if (S.tapeN % 2 === 0) { this.reloadDur = Math.min(this.reloadDur, 0.15); this.play('S_Switch', 0.9, 1.25); this.game.hud.floater(this.eye().add(this.forward().multiplyScalar(140)), 'TAPED MAG', [1, 0.85, 0.4], 1); } }
    this.reloadT = this.reloadDur;
    this.runProcs('OnReload', null, this.pos, 0, 1);
  }
  finishReload() {
    this.reloading = false;
    const S = this.slot;
    const take = Math.min(this.magSize(S) - S.ammo, S.reserve);
    S.ammo += take; S.reserve -= take;
  }
  recompute() {
    for (let i = 0; i < this.stats.length; i++) this.stats[i] = this.booth[i];
    this.upgradeStacks.forEach((n, u) => {
      if (n <= 0) return;
      for (const [stat, val] of DATA.upgrades[u].mods) this.stats[STAT[stat]] += val * n;
    });
    for (const [stat, val] of this.cls.stats) this.stats[STAT[stat]] += val;
    this.stats[STAT.MaxHealth] += this.killHP || 0;   // Trophy Rack: health earned by kills
    // the gun in your hands brings its own modifiers; `eff` is what procs read (your buffs plus this gun's)
    const eff = new Map(); for (const u of this.upgradeOrder) eff.set(u, this.upgradeStacks[u]);
    for (const u of (this.slot && this.slot.mods) || []) { for (const [stat, val] of DATA.upgrades[u].mods) this.stats[STAT[stat]] += val; eff.set(u, (eff.get(u) || 0) + 1); }
    this.eff = eff;
    this.statsDirty = true;
    // suit sets: 3 / 6 / 9 different upgrades of a suit
    const sc = { Iron: 0, Blood: 0, Gold: 0, Wind: 0 };
    this.upgradeStacks.forEach((n, u) => { if (n > 0) sc[DATA.upgrades[u].suit]++; });
    const tiers = {}; for (const k of SUITS) tiers[k] = Math.min(3, Math.floor(sc[k] / 3));
    this.stats[STAT.Damage] += 0.12 * tiers.Iron;
    this.stats[STAT.MaxHealth] += 30 * tiers.Blood; this.stats[STAT.HealthRegen] += tiers.Blood;
    this.stats[STAT.MoneyGain] += 0.2 * tiers.Gold;
    this.stats[STAT.MoveSpeed] += 0.07 * tiers.Wind; this.stats[STAT.DashCooldown] += 0.15 * tiers.Wind;
    if (this.suitTiers) for (const k of SUITS) if (tiers[k] > this.suitTiers[k]) { this.game.banner(`${k.toUpperCase()} SET ${'I'.repeat(tiers[k])}`, lin(1, 0.8, 0.2), 3); this.toast(`${SUIT_BONUS[k]} (x${tiers[k]})`, SUIT_HEX[k]); }
    this.suitCounts = sc; this.suitTiers = tiers;
    this.maxHealth = Math.max(30, Math.round((150 + this.stat('MaxHealth')) * mutHealth()));
    this.health = Math.min(this.health, this.maxHealth);
    this.dashCharges = Math.min(this.dashCharges ?? 1, this.maxDash());
    buildChanged(this);
  }
  addUpgrade(i) {
    const U = DATA.upgrades[i];
    if (this.upgradeStacks[i] >= U.stacks) return;
    if (this.upgradeStacks[i] === 0 && U.mods.some((m) => ACTIVE_STATS.includes(m[0])) && this.game.tip) this.game.tip('u_' + U.name, `${U.name}: ${U.desc}`);   // a buff that changes what your buttons do gets spelled out once
    if (this.upgradeStacks[i] === 0) this.upgradeOrder.push(i);
    this.upgradeStacks[i]++;
    const old = this.maxHealth;
    this.recompute();
    if (this.maxHealth > old) this.health += this.maxHealth - old;
    this.dashCharges = Math.min(this.maxDash(), this.dashCharges + 1);
    this.game.hud.gotUpgrade(i, this.upgradeStacks[i]);   // a card saying what it does
  }

  // ------------------------------------------------------------------ economy
  priceMult() { return this.game.priceMult(); }
  slotPrice() { return Math.round((750 + 250 * this.slotPulls) * this.priceMult() * (1 + 0.18 * Math.max(0, this.game.round - 1)) / 50) * 50; }   // dearer every round
  tonicPrice(i) { const T = TONICS[i]; return Math.round((T.base + T.step * this.tonicLevels[i]) * this.priceMult()); }
  addMoney(amount, mult) {
    if (amount <= 0) return;
    let a = amount;
    if (mult) { a *= mutMoney() * Math.max(0, 1 + this.stat('MoneyGain')); if (this.game.doublePoints > 0) a *= 2; }
    this.money += Math.max(1, Math.round(a));
    Meta.bump('moneyEarned', Math.max(1, Math.round(a)));
  }
  spend(amount) {
    amount = cost10(amount);
    if (amount < 0 || this.money < amount) { this.toast(`Not enough money  ($${cash(amount)} needed)`, '#ff5a4d'); this.play('S_Deny', 0.6); return false; }
    this.money -= amount;
    if (amount > 0) this.play('S_Buy', 0.6, 1, 0.05);
    if (this.S.SpendNova && amount > 0) {   // Gold Fever: money spent comes back as a blast, once for every $1,000
      this.spentAcc = (this.spentAcc || 0) + amount;
      if (this.spentAcc >= 10000) { this.spentAcc %= 10000; this.shockAround(650, this.power() * this.S.SpendNova, lin(1, 0.82, 0.25), 650); this.game.fx.coins(this.pos, 8); this.play('S_Cash', 0.8, 0.8); }
    }
    return true;
  }
  addLuck() {}   // the luck mechanic was removed; old code paths that grant it now do nothing

  collectPickup(type, amount) {
    if (this.procDepth < 2) this.runProcs('OnPickup', null, this.pos, 0, 1);
    if (type === 'Clover') this.addLuck(1);
    else if (type === 'MoneyBag') { this.addMoney(amount, true); this.toast(`Money bag  +$${cash(amount)}`, '#ffd23a'); this.play('S_Cash', 0.8); }
    else if (type === 'Tonic') this.gainTonic(amount);
    else if (type === 'Buff') { if (this.upgradeStacks[amount] >= DATA.upgrades[amount].stacks) { const u = rollBuff(rarityIndex(DATA.upgrades[amount].rarity), this.upgradeStacks, this.cls.id); if (u >= 0) this.addUpgrade(u); else { this.addMoney(500, true); this.toast('Nothing left to learn  +$50', '#ffd23a'); } } else this.addUpgrade(amount); this.play('S_Upgrade', 0.9); this.game.fx.flash(this.pos, lin(1, 0.9, 0.5), 90, 0.3, true); }
    else if (type === 'Grenade') { const N = GRENADES[amount]; if (this.grenades.length >= this.grenadeMax()) this.grenades.shift(); this.grenades.push(amount); this.toast(`${N.name} grenade  -  ${N.desc}`, N.hex); this.play('S_MagIn', 0.8, 0.8); }
    else if (type === 'Ammo') { for (const S of this.weapons) if (S.def >= 0) S.reserve = Math.min(this.reserveSize(S), S.reserve + this.magSize(S)); this.toast('+1 magazine', '#7fb4ff'); this.play('S_MagIn', 0.8, 1.2); }
    else { this.play('S_PowerUp', 0.9); this.game.activatePowerup(type); }
  }
  onRoundStarted(r) {
    this.lastRound = r;
    { const rv = Math.round(this.stat('Revives')); if (rv <= 0) this.revives = 0; else if (this.reviveRound === undefined || r - this.reviveRound >= 3) this.revives = rv; }   // a spent revive takes three rounds to come back
    this.periodic.fill(0.5); this.secondWindUsed = false;
    this.runProcs('OnRoundStart', null, this.pos, 0, 1);
    this.play('S_RoundStart', 0.8);
  }
  onRoundEnded() {
    this.play('S_RoundEnd', 0.8);
    Meta.roundCleared(this.game.round, this.game.map.id, this.cls.id, difficulty()); Meta.dailyRound(this.game.round, false);
    if (this.S.RoundMoney) { this.addMoney(this.S.RoundMoney, false); this.toast(`Round bonus  +$${cash(this.S.RoundMoney)}`, '#ffd24d'); }
    const rate = this.stat('Interest');
    if (rate > 0) { const pay = Math.min(Math.round(this.money * rate), 2000); if (pay > 0) { this.money += pay; this.toast(`Interest  +$${cash(pay)}`, '#ffd24d'); } }
  }
  onCasinoOpened() { this.slotPulls = Math.max(0, this.slotPulls - 2); this.pawnRerolls = 0; this.rollPawn(); }   // each round: fresh stock, slot price eases back
  rollPawn() {
    this.pawnOffers = [];
    for (let i = 0; i < 4; i++) for (let t = 0; t < 20; t++) {
      const u = rollUpgradeOfRarity(rollRarity(this.luck, 1.1), this.upgradeStacks);
      if (u >= 0 && !this.pawnOffers.includes(u)) { this.pawnOffers.push(u); break; }
    }
    // the fourth shelf sometimes holds a melee weapon
    if (Math.random() < 0.6) this.pawnOffers[3] = MELEE_CODE + rollMelee(rollRarity(this.luck, 1.2), this.meleeDef);
    if (this.menu && this.menu.type === 'Pawn') this.menu.offers = this.pawnOffers;
  }

  // ------------------------------------------------------------------ per-frame
  update(dt, In) {
    this.input = In;
    const G = this.game;
    // Mercury Sandals: at a full run you go through a crowd like a train
    if (this.S.Trample && !this.dead && this.grounded && Math.hypot(this.vel.x, this.vel.z) > 900) {
      const dirv = safeN2(this.vel);
      for (const E of G.enemies) {
        if (E.dead || E.emerging || E.burrowed || E.isBoss || G.time - (E.trampleAt || -9) < 1) continue;
        const d = flat(E.pos.clone().sub(this.pos));
        if (d.length() > 115 + E.radius || Math.abs(E.pos.y - this.pos.y) > 170 || d.dot(dirv) < 0) continue;
        E.trampleAt = G.time;
        const side = this.right().multiplyScalar(d.dot(this.right()) >= 0 ? 1 : -1);
        this.procDepth++; this.dealDamage(E, this.power() * this.S.Trample, E.pos, dirv, false, 0, true, 0, 0, 0, 0, [0.8, 0.95, 1]); this.procDepth--;
        if (!E.dead) { E.applyKnock(dirv.clone().multiplyScalar(520).addScaledVector(side, 420).add(V3(0, 300, 0))); this.stun(E, 0.6); }
        G.fx.dust(V3(E.pos.x, E.pos.y - 60, E.pos.z), lin(0.6, 0.55, 0.45), 50); G.fx.flash(E.pos, [0.8, 0.95, 1], 40, 0.1, false);
        this.play('S_HitFlesh2', 0.7, 0.8, 0.08); this.addShake(0.3);
      }
    }
    if (this.benchJob && this.benchJob.t > 0) { this.benchJob.t -= dt; if (this.benchJob.t <= 0) { this.toast('Workbench upgrade ready  -  claim it at the bench', '#ff8cff'); this.play('S_Upgrade', 0.5, 1.3); } }
    if (this.dead) {
      this.updateCamera(dt);
      return;
    }
    this.sinceDamage += dt; if (this.sinceDash !== undefined) this.sinceDash += dt;
    if (this.streakT > 0) { this.streakT -= dt; if (this.streakT <= 0) this.streak = 0; }
    if (this.dashGuardT > 0) this.dashGuardT -= dt;
    if (this.headCritT > 0) this.headCritT -= dt;
    if (this.S.ShieldRegen && this.sinceDamage > 4 && this.overshield < this.S.ShieldRegen) this.overshield = Math.min(this.S.ShieldRegen, this.shieldCap(), this.overshield + 12 * dt);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt * 1.5);
    this.invuln = Math.max(0, this.invuln - dt); this.safeT = Math.min(Math.max(0, (this.safeT || 0) - dt), this.invuln);
    this.hitMarker = Math.max(0, this.hitMarker - dt);
    this.hasteT = Math.max(0, this.hasteT - dt); if (this.hasteT <= 0) this.haste = 0;
    this.rageT = Math.max(0, this.rageT - dt); if (this.rageT <= 0) this.rage = 0;
    buildTick(this, dt);
    this.krT = Math.max(0, (this.krT || 0) - dt); this.ktT = Math.max(0, (this.ktT || 0) - dt);
    if (this.S.SlideLaunch && this.sliding && (this.slT = (this.slT || 0) - dt) <= 0) {   // Slide Grease: slide into them and they go up
      let hit = 0; for (const E of this.game.enemies) if (!E.dead && !E.isBoss && E.pos.distanceTo(this.pos) < 190 + E.radius) { hit++; E.launch(V3(this.vel.x * 0.4, 760, this.vel.z * 0.4)); this.stun(E, 0.9); this.procDepth++; this.dealDamage(E, this.power() * 0.4 * this.S.SlideLaunch, E.pos, V3(0, 1, 0), false, 0, true); this.procDepth--; }
      if (hit) { this.slT = 0.3; const f = V3(this.pos.x, this.pos.y - 85, this.pos.z); this.game.fx.ring(f, 220, [0.9, 0.95, 1], 0.25); this.game.fx.dust(f, lin(0.5, 0.45, 0.4), 120); this.play('S_Stomp', 0.5, 1.5, 0.05); }
    }
    this.slowT = Math.max(0, this.slowT - dt);
    // Healing in a fight (kills, lifesteal, leech, procs) all draws on one budget that refills at 2.2% of max health a
    // second and holds 6%. It used to be 8 a second flat, which a horde of a hundred filled without you noticing.
    this.healBucket = Math.min(Math.max(8, this.maxHealth * 0.06), this.healBucket + this.maxHealth * 0.022 * dt);
    this.shieldBucket = Math.min(16, (this.shieldBucket === undefined ? 16 : this.shieldBucket) + 6 * dt);
    const regen = Math.min(6, this.stat('HealthRegen')) + (this.nearTurret ? 4 * this.stat('TurretAura') : 0);   // regen in a fight tops out at 6 a second
    if (regen >= 0) this.health = Math.min(this.maxHealth, this.health + (regen + (this.sinceDamage > 5 ? 25 : 0)) * dt);
    // input edges
    const menu = this.inMenu();
    this.inFwd = menu ? 0 : In.fwd; this.inRight = menu ? 0 : In.right;
    this.sprintHeld = In.sprint;
    this.aiming = In.aim && !menu;
    if (!menu) this.look(In.lookX, In.lookY);
    if (In.jump) this.onJump();
    if (In.slide) this.onSlidePressed();
    if (In.slideUp) this.onSlideReleased();
    if (In.dash && !menu) this.doDash();
    if (In.grapple && !menu) this.useAbility();
    if (In.reload && !menu && !this.wield) { if (this.reloading && this.stat('ActiveReload') > 0) this.activeReload(); else this.startReload(); }
    if (In.interact) this.interact();
    if (In.melee && !menu) this.meleeBuffer = 0.22;
    if (this.flowWin > 0) this.flowWin -= dt;
    if (this.flowT > 0) { this.flowT -= dt; if (this.flowT <= 0) this.flow = 0; }
    if (!this.wield) this.meleeCharge = 0;
    if (In.wield && !menu) this.setWield(!this.wield);
    if (this.wield) {
      if (!menu && In.fire) this.meleeBuffer = Math.max(this.meleeBuffer || 0, 0.1);          // hold fire to keep swinging
      // Flow: press (not hold) fire in the instant after a swing lands and the chain speeds up and hits harder, up to four
      // stacks. Holding the button still swings, it just never builds any.
      if (!menu && In.firePressed && this.flowWin > 0) { this.flowWin = 0; this.flow = Math.min(4, (this.flow || 0) + 1); this.flowT = 3; this.play('S_UIMove', 0.7, 0.9 + this.flow * 0.15); }
      // Aim: wind up a heavy blow. The longer it is held (up to 0.8s) the harder it lands; a full wind-up launches and stuns.
      if (!menu && In.aim) { const c0 = this.meleeCharge || 0; this.meleeCharge = Math.min(1, c0 + dt / 0.8); if (c0 < 1 && this.meleeCharge >= 1) { this.play('S_Rack', 0.8, 1.5); this.game.fx.flash(this.eye().add(this.forward().multiplyScalar(90)), lin(1, 0.85, 0.4), 30, 0.2, true); } }
      else if (this.meleeCharge > 0) { this.meleeRelease = this.meleeCharge; this.meleeReleaseT = 0.3; this.meleeCharge = 0; }
      if (this.meleeReleaseT > 0) { this.meleeReleaseT -= dt; if (this.meleeCd <= 0 && this.meleeHitT < 0) { this.meleeReleaseT = 0; this.meleeSwing(true, this.meleeRelease); } }
      this.aiming = false;
    }
    if (In.grenade && !menu) this.throwGrenade();
    this.tickGrenades(dt);
    this.tickAbility(dt);
    this.tickMelee(dt, menu);
    if (In.back) { if (menu) this.closeMenu(); else this.showInventory = !this.showInventory; }
    if (In.next) this.cycleWeapon(1);
    if (In.prev) this.cycleWeapon(-1);
    for (let i = 0; i < 4; i++) if (In.choice[i]) this.handleChoice(i);
    if (In.firePressed) this.fireConsumed = false;
    this.fireHeld = In.fire && !this.wield;

    this.tickMobility(dt);
    this.tickCombat(dt);
    this.tickProcs(dt);
    this.tickMenu(dt);
    this.updateFocus();
    this.updateCamera(dt);
    this.killPulse = Math.max(0, this.killPulse - dt * 3);
    this.crossKick = interpTo(this.crossKick, 0, dt, 10);
    for (const d of this.damageInd) d.t -= dt;
    this.damageInd = this.damageInd.filter((d) => d.t > 0);
  }

  look(dx, dy) {
    // dx, dy are degrees (dy > 0 = look down)
    const k = this.aiming ? 0.6 : 1;
    this.yaw -= dx * k * D2R;
    this.pitch = clamp(this.pitch - dy * k * D2R, -89 * D2R, 89 * D2R);
    this.lookDelta.x += dx * k / 2.5; this.lookDelta.y += dy * k / 2.5;
  }
  addPitch(deg) { this.pitch = clamp(this.pitch + deg * D2R, -89 * D2R, 89 * D2R); }
  addYaw(deg) { this.yaw -= deg * D2R; }
  addShake(a) { this.shake = Math.min(this.shake + a * 0.5, 1.6); }   // half the old strength
  addKick(p, y) { this.camKickVel.x += p * 22; this.camKickVel.y += y * 22; }
  inputDir() {
    const d = this.forward().multiplyScalar(this.inFwd).add(this.right().multiplyScalar(this.inRight));
    if (d.length() > 1) d.normalize();
    return d;
  }
  launch(v, xy, z) {
    if (xy) { this.vel.x = v.x; this.vel.z = v.z; } else { this.vel.x += v.x; this.vel.z += v.z; }
    if (z) this.vel.y = v.y; else this.vel.y += v.y;
    if (v.y > 0 || z) { this.grounded = false; this.launchedT = 0.08; }
  }

  // ------------------------------------------------------------------ movement
  updateMoveSpeed() {
    if (this.sliding) return;
    let s = WalkSpeed * (1 + Math.min(1, this.stat('MoveSpeed')) + (this.krT > 0 ? (this.krN || 0) * this.S.KillRush : 0) + this.haste + (this.wield ? 0.08 : 0)) * (this.meleeCharge > 0 ? 0.7 : 1);
    if (this.sprintHeld && this.inFwd > 0.1 && !this.aiming) s *= SprintMult;
    if (this.aiming) s *= 0.7;
    s *= this.game.mech.slow(this);   // wading
    if (this.slowT > 0) s *= 1 - this.slowAmt;
    this.maxWalk = Math.max(150, s);
    this.airControl = clamp(0.85 + this.stat('AirControl'), 0, 1.6);
  }

  // UE CharacterMovement-style velocity integration
  integrate(dt) {
    const G = this.game;
    const accelDir = (this.wallRunning || this.dashT > 0 || this.grappling || this.inMenu()) ? V3(0, 0, 0) : this.inputDir();
    if (this.sliding) { accelDir.copy(this.forward().multiplyScalar(this.inFwd).add(this.right().multiplyScalar(this.inRight * 0.35))); if (accelDir.length() > 1) accelDir.normalize(); }
    const hv = flat(this.vel);
    if (this.dashT <= 0 && !this.grappling && !this.wallRunning) {
      if (this.grounded && this.launchedT <= 0) {
        const friction = this.sliding ? 0.3 : 11, braking = this.sliding ? 300 : 2800;
        const maxSpeed = this.maxWalk;
        const zeroAcc = accelDir.lengthSq() < 1e-6;
        const overMax = hv.length() > maxSpeed * 1.01;
        const old = hv.clone();
        if (zeroAcc || overMax) {
          // braking (sub-stepped)
          let t = dt;
          const fr = friction * 2;
          while (t > 1e-5) {
            const st = Math.min(t, 1 / 33);
            t -= st;
            const prev = hv.clone();
            const rev = hv.lengthSq() > 0 ? hv.clone().normalize().multiplyScalar(-braking) : V3(0, 0, 0);
            hv.addScaledVector(hv.clone().multiplyScalar(-fr).add(rev), st);
            if (hv.dot(prev) <= 0) { hv.set(0, 0, 0); break; }
          }
          if (overMax && hv.length() < maxSpeed && accelDir.dot(old) > 0) hv.copy(old).setLength(maxSpeed);
        } else {
          const sz = hv.length();
          hv.sub(hv.clone().sub(accelDir.clone().multiplyScalar(sz)).multiplyScalar(Math.min(dt * friction, 1)));
        }
        if (!zeroAcc) {
          const maxIn = hv.length() > maxSpeed ? hv.length() : maxSpeed;
          hv.addScaledVector(accelDir, 5600 * dt);
          if (hv.length() > maxIn) hv.setLength(maxIn);
        }
      } else if (accelDir.lengthSq() > 1e-6) {
        // air control: no lateral friction, accel scaled by AirControl, capped at max(maxWalk, current)
        const maxIn = Math.max(this.maxWalk, hv.length());
        const boost = hv.length() < 25 ? 1.5 : 1;
        hv.addScaledVector(accelDir, 3200 * this.airControl * boost * dt);
        if (hv.length() > maxIn) hv.setLength(maxIn);
      }
      this.vel.x = hv.x; this.vel.z = hv.z;
    }
    // gravity
    if (!this.grounded || this.launchedT > 0) this.vel.y -= 980 * this.gravityScale * dt;
    else this.vel.y = Math.min(this.vel.y, -40);
    // Buzzard Feather: hold jump on the way down to spread your coat and glide
    this.gliding = !!(this.S.Glide && !this.grounded && this.input && this.input.jumpHeld && this.vel.y < -240 && this.dashT <= 0 && !this.grappling && !this.wallRunning && this.timeSinceJump > 0.25);
    if (this.gliding) {
      this.vel.y += (-240 - this.vel.y) * Math.min(1, 9 * dt);
      this.glideFx = (this.glideFx || 0) - dt;
      if (this.glideFx <= 0) { this.glideFx = 0.09; const s = this.right().multiplyScalar(Math.random() < 0.5 ? 70 : -70); G.fx.puff(V3(this.pos.x, this.pos.y - 40, this.pos.z).add(s), [0.93, 0.96, 1], 34, 0.3, V3(0, 120, 0)); }
      if (!this.wasGliding) this.play('S_Dash', 0.3, 0.6, 0.05);
    }
    this.wasGliding = this.gliding;
    this.vel.y = Math.max(this.vel.y, -4000);
    if (this.launchedT > 0) this.launchedT -= dt;
    // collide
    const wasG = this.grounded;
    const r = G.phys.moveCapsule(this.pos, this.vel, dt, RADIUS, HALF, { stepHeight: 50, wasGrounded: wasG && this.launchedT <= 0 });
    // under a roof (the mine): nobody jumps, grapples or wall-runs out through the ceiling
    if (G.map.ceil) { const cz = G.map.ceil(this.pos.x, this.pos.z); if (cz !== null && this.pos.y > cz - HALF - 6) { this.pos.y = cz - HALF - 6; if (this.vel.y > 0) this.vel.y = 0; } }
    let grounded = r.grounded && this.vel.y <= 1 && this.launchedT <= 0;
    if (grounded) this.groundNormal.copy(r.groundNormal);
    if (!grounded && wasG && this.vel.y <= 0 && this.launchedT <= 0 && this.dashT <= 0) {
      const h = G.phys.raycastDown(V3(this.pos.x, this.pos.y - HALF + 10, this.pos.z), 55, true);
      if (h && h.normal.y > 0.6) { this.pos.y = h.point.y + HALF + 0.5; grounded = true; }
    }
    if (r.ceiling && this.vel.y > 0) this.vel.y = 0;
    if (!wasG && grounded) { this.grounded = true; this.onLanded(); }
    this.grounded = grounded;
    if (grounded && this.vel.y < 0) this.vel.y = 0;
    this.walls = r.walls;
    // safety: fell out of the world
    if (this.pos.y < -3000) { this.pos.copy(G.playerSpawn).add(V3(0, 120, 0)); this.vel.set(0, 0, 0); }
  }

  tickMobility(dt) {
    const G = this.game;
    if (!this.grounded) this.lastFall = Math.max(0, -this.vel.y);
    this.timeSinceGrounded = this.grounded ? 0 : this.timeSinceGrounded + dt;
    this.timeSinceJump += dt;
    this.wallRunCd = Math.max(0, this.wallRunCd - dt);
    if (this.wallStam === undefined) this.wallStam = this.maxWallStam();
    this.groundT = this.grounded ? (this.groundT || 0) + dt : 0;
    if (this.groundT > 0.4) this.wallStam = Math.min(this.maxWallStam(), this.wallStam + dt * 1.5);
    this.mantleCd = Math.max(0, this.mantleCd - dt);
    this.slideCd = Math.max(0, this.slideCd - dt);
    this.slideDmgWindow = Math.max(0, this.slideDmgWindow - dt);
    this.padCd = Math.max(0, this.padCd - dt);
    this.grappleCd = Math.max(0, this.grappleCd - dt);
    if (this.dashCharges < this.maxDash()) { this.dashRecharge += dt; if (this.dashRecharge >= this.dashCooldown()) { this.dashRecharge = 0; this.dashCharges++; } } else this.dashRecharge = 0;
    this.updateMoveSpeed();

    if (this.dashT > 0) {
      this.dashT -= dt;
      this.vel.copy(this.dashDir).multiplyScalar(DashSpeed);
      const dd = this.stat('DashDamage');
      if (dd > 0) {
        const struck = G.enemies.filter((E) => !E.dead && !this.dashHits.has(E) && E.pos.distanceTo(this.pos) < 170);
        for (const E of struck) { this.dashHits.add(E); this.dealDamage(E, dd * this.flatScale() + this.power() * 0.5, E.pos, this.dashDir, false, 1, true, 0, 0, 0, 0, lin(0.6, 0.9, 1)); }
      }
      if (this.dashT <= 0) { this.gravityScale = BaseGravity; this.vel.copy(this.dashDir).multiplyScalar(this.dashExit); }
      this.integrate(dt);
      return;
    }
    if (this.grappling) {
      this.grappleT += dt;
      const to = this.grapplePoint.clone().sub(this.pos);
      const want = to.clone().normalize().multiplyScalar(GrappleSpeed).add(this.inputDir().multiplyScalar(500));
      this.vel.lerp(want, Math.min(1, dt * 6));
      this.launchedT = 0.05;
      if (to.length() < 220 || this.grappleT > 2.6) this.endGrapple(false);
      this.integrate(dt);
      return;
    }
    if (this.sliding) {
      this.slideT -= dt;
      this.slideSpeed = interpTo(this.slideSpeed, WalkSpeed, dt, 1.6);
      this.maxWalk = this.slideSpeed;
      const sz = Math.hypot(this.vel.x, this.vel.z);
      if (sz < this.slideSpeed && sz > 10) { const f = safeN2(this.vel).multiplyScalar(this.slideSpeed); this.vel.x = f.x; this.vel.z = f.z; }
      // downhill boost
      if (this.grounded && this.groundNormal.y < 0.98) {
        const down = V3(this.groundNormal.x, 0, this.groundNormal.z);
        if (down.dot(this.vel) > 0) { this.slideSpeed = Math.min(2300, this.slideSpeed + 900 * dt); this.slideT = Math.max(this.slideT, 0.2); }
      }
      if (this.slideT <= 0 || !this.grounded || sz < 380) this.endSlide();
    }
    if (this.wallRunning) {
      this.wallLeft -= dt; this.wallStam = Math.max(0, this.wallStam - dt);
      if (this.wallStam <= 0) { this.wallLeft = 0; this.toast('Out of wall-run stamina', '#ff9a4d'); }
      const hit = G.phys.raycast(this.pos, this.wallNormal.clone().negate(), 90);
      const still = hit && Math.abs(hit.normal.y) < 0.3;
      const stalled = this.maxWallRun() - this.wallLeft > 0.25 && Math.hypot(this.vel.x, this.vel.z) < 250;
      if (!still || this.wallLeft <= 0 || this.grounded || this.inFwd < 0.1 || stalled) this.endWallRun();
      else {
        this.wallNormal.copy(hit.normal);
        let along = new THREE.Vector3().crossVectors(this.wallNormal, UP).normalize();
        if (along.dot(this.wallDir) < 0) along.negate();
        this.wallDir.copy(along);
        const speed = Math.max(Math.hypot(this.vel.x, this.vel.z), 950 * (1 + this.stat('MoveSpeed')));
        const vz = interpTo(this.vel.y, -140, dt, 1.8);
        this.vel.copy(along).multiplyScalar(Math.min(speed, 1700)).addScaledVector(this.wallNormal, -60);
        this.vel.y = vz;
        this.wallProc -= dt;
        if (this.wallProc <= 0) { this.wallProc = 0.5; this.runProcs('OnWallRun', null, this.pos, 0, 1); }
      }
    } else if (!this.grounded) {
      if (!this.tryMantle()) this.tryWallRun();
    }
    if (this.padCd <= 0) {
      const feet = V3(this.pos.x, this.pos.y - 90, this.pos.z);
      for (const pad of []) {
        if (Math.hypot(feet.x - pad.pos.x, feet.z - pad.pos.z) < pad.radius && Math.abs(feet.y - pad.pos.y) < 60) {
          this.padCd = 0.6;
          if (this.sliding) this.endSlide();
          this.launch(pad.launch, true, true);
          this.airJumps = this.maxAirJumps();
          G.fx.ring(pad.pos.clone().add(V3(0, 20, 0)), 150, lin(0.3, 0.85, 1), 0.35);
          this.play('S_JumpPad', 0.8);
          this.fovKick += 10;
          break;
        }
      }
    }
    if (this.slamming && !this.grounded) this.vel.y = Math.min(this.vel.y, -3200);
    this.integrate(dt);
  }

  onJump() {
    if (this.dead || this.inMenu()) return;
    const jm = 1 + this.stat('JumpPower');
    if (this.grappling) { this.endGrapple(true); return; }
    if (this.wallRunning) {
      const v = this.wallNormal.clone().multiplyScalar(720).addScaledVector(this.wallDir, Math.max(Math.hypot(this.vel.x, this.vel.z) * 0.85, 700)).add(V3(0, 820 * jm, 0));
      this.endWallRun(); this.wallRunCd = 0.3;
      if (this.S.WallCrit) { this.headCritT = 2; this.wallCritFx = 2; this.play('S_Crit', 0.4, 1.5, 0.04); this.game.hud.floater(this.eye().add(this.forward().multiplyScalar(140)), 'CRIT READY', [1, 0.85, 0.2], 1); }
      this.launch(v, true, true);
      this.timeSinceJump = 0;
      this.play('S_AirJump', 0.7, 1.05, 0.05);
      this.fovKick += 4;
      this.runProcs('OnJump', null, this.pos, 0, 1);
      return;
    }
    if (this.grounded || this.timeSinceGrounded < 0.15) {
      if (this.sliding) this.endSlide();
      this.launch(V3(0, GroundJumpZ * jm, 0), false, true);
      this.timeSinceJump = 0; this.timeSinceGrounded = 1;
      this.play('S_Jump', 0.6, 1, 0.06);
      this.landDipVel += 60;
      this.runProcs('OnJump', null, this.pos, 0, 1);
      return;
    }
    if (this.airJumps > 0) {
      this.airJumps--;
      const In = this.inputDir();
      let fl = flat(this.vel);
      if (In.lengthSq() > 1e-4) fl = In.normalize().multiplyScalar(Math.max(fl.length(), WalkSpeed * 0.9));
      this.launch(V3(fl.x, AirJumpZ * jm, fl.z), true, true);
      this.timeSinceJump = 0;
      const feet = V3(this.pos.x, this.pos.y - 90, this.pos.z);
      this.game.fx.ring(feet, 90, [0.95, 0.97, 1], 0.25);
      this.game.fx.puff(feet.add(V3(0, -5, 0)), [0.95, 0.96, 1], 70, 0.35);
      this.play('S_AirJump', 0.7, 1, 0.05);
      this.fovKick += 3; this.landDipVel += 80;
      this.runProcs('OnAirJump', null, this.pos, 0, 1);
    }
  }
  onLanded() {
    const fall = Math.max(Math.max(0, -this.vel.y), this.lastFall);
    const impact = clamp((fall - 300) / 1400, 0, 1);
    this.landDipVel -= 40 + impact * 260;
    this.game.vm.land(0.3 + impact);
    this.play('S_Land', 0.35 + impact * 0.6, 1, 0.06);
    if (impact > 0.5) { this.addShake(impact * 0.6); this.game.fx.dust(V3(this.pos.x, this.pos.y - 88, this.pos.z), lin(0.55, 0.48, 0.4), 50 + impact * 40); }
    this.airJumps = this.maxAirJumps();
    if (this.wallRunning) this.endWallRun();
    if (this.slamming) this.slamImpact();
    // Spring Heels / Colossus: coming down hard sends out a shockwave. A plain hop lands at about 820.
    if (this.S.LandShock && fall > (this.S.Quake ? 500 : 1000) && this.game.time - (this.landShockAt || -9) > 0.5) {
      this.landShockAt = this.game.time;
      this.shockAround(this.S.Quake ? 520 : 380, this.power() * this.S.LandShock, this.S.Quake ? lin(1, 0.75, 0.4) : lin(0.85, 0.95, 1), this.S.Quake ? 700 : 520);
      if (this.S.Quake) { this.addShake(0.8); this.landDipVel -= 160; }
    }
    if (!this.sliding && this.input && this.input.slideHeld && Math.hypot(this.vel.x, this.vel.z) > 700 && this.slideCd <= 0) this.startSlide();
    this.lastFall = 0;
  }
  tryWallRun() {
    if (this.wallRunCd > 0 || this.timeSinceJump < 0.08 || this.inFwd < 0.3 || this.slamming || this.wallStam < 0.4) return false;
    if (Math.hypot(this.vel.x, this.vel.z) < 350 || this.vel.y < -900) return false;
    const G = this.game, R = this.right();
    for (const side of [-1, 1]) {
      const hit = G.phys.raycast(this.pos, R.clone().multiplyScalar(side), 95);
      if (hit && Math.abs(hit.normal.y) < 0.25) {
        if (G.phys.raycastDown(this.pos, 160)) return false;
        this.wallRunning = true; this.wallSide = side;
        this.play('S_Wallrun', 0.5, 1, 0.05);
        this.wallNormal.copy(hit.normal);
        this.wallDir.crossVectors(this.wallNormal, UP).normalize();
        if (this.wallDir.dot(this.vel) < 0) this.wallDir.negate();
        this.wallLeft = Math.min(this.maxWallRun(), this.wallStam); this.wallProc = 0;
        this.airJumps = this.maxAirJumps();
        this.gravityScale = 0;
        this.vel.y = Math.max(this.vel.y, 120);
        return true;
      }
    }
    return false;
  }
  endWallRun() { this.wallRunning = false; this.wallRunCd = Math.max(this.wallRunCd, 0.2); this.gravityScale = BaseGravity; }
  tryMantle() {
    if (this.mantleCd > 0 || this.inFwd < 0.3 || this.slamming || this.grappling) return false;
    const G = this.game, fwd = this.forward();
    const chest = this.pos.clone().add(V3(0, 30, 0));
    const wall = G.phys.raycast(chest, fwd, 95);
    if (!wall || Math.abs(wall.normal.y) > 0.3) return false;
    const feetY = this.pos.y - 90;
    const over = wall.point.clone().addScaledVector(wall.normal, -45);
    const top = G.phys.raycastDown(V3(over.x, feetY + 300, over.z), 305);
    if (!top || top.normal.y < 0.7 || top.distance < 1) return false;
    const H = top.point.y - feetY;
    if (H < 45 || H > 280) return false;
    if (G.phys.overlapsCapsule(top.point.clone().add(V3(0, 100, 0)), 30, 85)) return false;
    this.mantleCd = 0.45;
    const vz = Math.sqrt(2 * 980 * BaseGravity * (H + 50));
    this.launch(wall.normal.clone().multiplyScalar(-380).add(V3(0, vz, 0)), true, true);
    this.game.vm.jolt(0.8);
    this.play('S_Step' + randInt(0, 3), 0.6);
    this.runProcs('OnMantle', null, this.pos, 0, 1);
    return true;
  }
  onSlidePressed() {
    if (this.dead || this.inMenu()) return;
    if (!this.grounded && !this.wallRunning && !this.grappling && this.timeSinceGrounded > 0.2) { this.doSlam(); return; }
    if (this.grounded && !this.sliding && this.slideCd <= 0 && Math.hypot(this.vel.x, this.vel.z) > 450) this.startSlide();
  }
  onSlideReleased() { if (this.sliding && this.slideT < 0.6) this.endSlide(); }
  startSlide() {
    this.sliding = true; this.slideT = 0.9;
    this.slideSpeed = Math.min(Math.max(Math.hypot(this.vel.x, this.vel.z), 1050) * (1 + this.stat('SlideBoost')) + 150, 2300);
    this.maxWalk = this.slideSpeed;
    const d = safeN2(this.vel).multiplyScalar(this.slideSpeed);
    this.vel.x = d.x; this.vel.z = d.z;
    this.slideDmgWindow = 1;
    this.game.fx.dust(V3(this.pos.x, this.pos.y - 85, this.pos.z), lin(0.55, 0.45, 0.35), 40);
    this.play('S_Slide', 0.6, 1, 0.06);
    this.fovKick += 4;
    this.runProcs('OnSlide', null, this.pos, 0, 1);
  }
  endSlide() { if (!this.sliding) return; this.sliding = false; this.slideCd = 0.25; this.slideDmgWindow = 1; this.updateMoveSpeed(); }
  doDash() {
    if (this.dashCharges <= 0 || this.dashT > 0) return;
    this.dashCharges--; if (this.S.DashGuard) this.dashGuardT = 1.5;
    if (this.grappling) this.endGrapple(false);
    if (this.wallRunning) this.endWallRun();
    if (this.sliding) this.endSlide();
    let d = this.inputDir();
    if (d.lengthSq() < 1e-4) d = this.forward();
    this.dashDir.copy(d.normalize());
    this.dashExit = Math.max(Math.hypot(this.vel.x, this.vel.z), 1100);
    this.dashT = DashDuration; this.dashHits.clear(); this.sinceDash = 0;
    this.invuln = Math.max(this.invuln, DashDuration + 0.12);
    if (this.grounded) { this.grounded = false; this.vel.y = 120; this.launchedT = 0.05; }
    this.gravityScale = 0;
    this.game.fx.puff(this.pos.clone().addScaledVector(this.dashDir, -60), lin(0.8, 0.9, 1), 90, 0.3);
    this.play('S_Dash', 0.8, 1, 0.05);
    this.fovKick += 12; this.addShake(0.25);
    if (this.reloading && this.stat('DashReload') > 0 && !this.wield) { this.finishReload(); this.play('S_Switch', 0.9, 1.4); this.game.vm.jolt && this.game.vm.jolt(0.5); this.game.hud.floater(this.eye().add(this.forward().multiplyScalar(140)), 'RELOADED', [0.6, 0.9, 1], 1); }
    this.runProcs('OnDash', null, this.pos, 0, 1);
  }
  startGrapple() {
    if (this.grappleCd > 0) { this.toast(`Grapple recharging (${this.grappleCd.toFixed(1)}s)`, '#b3b3b3'); return; }
    const G = this.game;
    const eye = G.camera.position.clone();
    const dir = new THREE.Vector3(); G.camera.getWorldDirection(dir);
    const hit = G.phys.raycast(eye, dir, GrappleRange);
    if (!hit) { this.toast('Nothing to hook', '#b3b3b3'); this.play('S_Dry', 0.5); return; }
    if (hit.point.distanceTo(this.pos) < 300) return;
    this.grappling = true; this.grappleT = 0;
    this.grapplePoint.copy(hit.point).addScaledVector(hit.normal, 30);
    if (this.sliding) this.endSlide();
    if (this.wallRunning) this.endWallRun();
    if (this.grounded) this.launch(V3(0, 450, 0), false, true);
    this.gravityScale = 0.25;
    G.fx.sparks(hit.point, hit.normal, [1, 0.93, 0.73], 6);
    this.play('S_Grapple', 0.8, 1, 0.05);
    this.fovKick += 6;
    this.runProcs('OnGrapple', null, this.pos, 0, 1);
  }
  endGrapple(jump) {
    if (!this.grappling) return;
    this.grappling = false;
    this.grappleCd = this.grappleCooldown();
    this.gravityScale = BaseGravity;
    if (jump) { this.launch(V3(this.vel.x * 0.9, Math.max(this.vel.y, 0) + 700, this.vel.z * 0.9), true, true); this.airJumps = this.maxAirJumps(); }
    else { this.vel.multiplyScalar(0.8); this.vel.y += 250; }
  }
  doSlam() {
    return; // ground slam removed
    // eslint-disable-next-line no-unreachable
    if (this.slamming) return;
    this.slamming = true; this.slamStartY = this.pos.y;
    this.vel.set(this.vel.x * 0.3, -3200, this.vel.z * 0.3);
    this.play('S_Dash', 0.5, 0.7);
  }
  slamImpact() {
    this.slamming = false;
    const G = this.game;
    const fall = Math.max(0, this.slamStartY - this.pos.y);
    const radius = 380 * (1 + this.stat('ExplosionRadius') * 0.5);
    const dmg = (120 + this.stat('SlamDamage')) * this.flatScale() + this.power() * 1.2 + fall * 0.15;
    const feet = V3(this.pos.x, this.pos.y - 88, this.pos.z);
    G.fx.ring(feet, radius, lin(1, 0.8, 0.5), 0.35);
    G.fx.dust(feet, lin(0.45, 0.38, 0.3), 140);
    this.play('S_Slam', 1);
    this.addShake(1.2); this.landDipVel -= 300;
    this.invuln = Math.max(this.invuln, 0.25);
    const hits = G.enemies.filter((E) => !E.dead && E.pos.distanceTo(this.pos) < radius);
    for (const E of hits) {
      const away = safeN2(E.pos.clone().sub(this.pos));
      E.applyKnock(away.clone().multiplyScalar(500).add(V3(0, 600, 0)));
      this.dealDamage(E, dmg, E.pos, away, false, 1, true, 0, 0, 0, 10, lin(1, 0.85, 0.5));
    }
    this.runProcs('OnSlam', null, this.pos, 0, 1);
  }
  applyKnockback(imp) {
    if (this.dead || this.dashT > 0) return;
    if (this.grappling) this.endGrapple(false);
    if (this.wallRunning) this.endWallRun();
    this.launch(imp, true, true);
  }
  // down and waiting: a teammate holding E beside you fills the bar in three seconds; the clock stops while they work
  tickDowned(dt, helped, by) {
    const G = this.game;
    if (helped) { this.reviveP = Math.min(1, (this.reviveP || 0) + dt / 3); if (this.reviveP >= 1) { this.pickedUp(by); return; } }
    else { this.reviveP = Math.max(0, (this.reviveP || 0) - dt * 0.5); this.bleed -= dt; }
    if (this.bleed <= 0) { this.downed = false; G.fx.gibs(this.pos, hexRGB(0xB0603A), 1, 16); this.play('S_Gib', 0.8); this.toast('You bled out. You respawn next round if a teammate survives.', '#ff9a4d'); }
  }
  pickedUp(by) {
    const G = this.game; this.dead = false; this.downed = false; this.health = Math.round(this.maxHealth * 0.4); this.invuln = 3; this.safeT = 3; this.vel.set(0, 0, 0); G.vm.hidden = false; G.coopDown = false;
    G.banner(by ? `${String(by).toUpperCase()} GOT YOU UP` : 'BACK ON YOUR FEET', [0.5, 0.9, 1], 2.5); this.play('S_PowerUp', 0.7, 1.2);
    G.fx.ring(V3(this.pos.x, this.pos.y - 85, this.pos.z), 220, [0.5, 0.9, 1], 0.4);
  }
  revive() {
    const G = this.game; this.dead = false; this.downed = false; this.health = this.maxHealth; this.invuln = 3; this.vel.set(0, 0, 0); G.vm.hidden = false; G.coopDown = false;
    const mates = G.net.alivePositions(); if (mates.length) this.pos.copy(mates[0]).add(V3(60, 20, 0));
    G.banner('BACK IN THE FIGHT', [0.5, 0.9, 1], 2.5);
  }
  // ------------------------------------------------------------------ melee
  // Press to swing; the hit lands after a short wind-up. Presses during a swing are buffered so chains feel instant.
  // Every third swing in a chain is a heavy finisher. A swing pulls you a step toward what you are aiming at.
  tickMelee(dt, menu) {
    this.meleeHitting = false;
    const G = this.game;
    if (this.meleeDef === undefined) { this.meleeDef = 0; this.meleeCd = 0; this.meleeCombo = 0; this.meleeComboT = 0; this.meleeHitT = -1; this.meleeBuffer = 0; this.frenzy = 0; this.frenzyT = 0; this.meleeGuardT = 0; this.meleeTier = this.meleeTier || 0; }
    this.meleeCd = Math.max(0, this.meleeCd - dt); this.meleeBuffer = Math.max(0, (this.meleeBuffer || 0) - dt); this.meleeGuardT = Math.max(0, this.meleeGuardT - dt);
    if (this.meleeComboT > 0) { this.meleeComboT -= dt; if (this.meleeComboT <= 0) this.meleeCombo = 0; }
    if (this.frenzyT > 0) { this.frenzyT -= dt; if (this.frenzyT <= 0) this.frenzy = 0; }
    if (this.dead || menu) { this.meleeHitT = -1; return; }
    if (this.meleeHitT >= 0) { this.meleeHitT -= dt; if (this.meleeHitT < 0) this.meleeStrike(); }
    if (this.meleeBuffer > 0 && this.meleeCd <= 0 && this.meleeHitT < 0) this.meleeSwing();
  }
  meleeSpeed() { return 1 + 0.08 * (this.flow || 0) + this.stat('MeleeSpeed') + (this.frenzy || 0) * this.stat('MeleeFrenzy') + honeSpeed(this.meleeTier || 0) + (this.wield ? 0.1 : 0); }
  meleeRange() { return MELEE[this.meleeDef].range * (1 + this.stat('MeleeRange')) * honeRange(this.meleeTier || 0) * (this.wield ? 1.08 : 1); }
  // everything that multiplies a swing before the per-hit rolls: buffs, frenzy, honing, and having the blade in hand
  meleePower() { return (1 + this.stat('MeleeDamage') + (this.frenzy || 0) * this.stat('MeleeFrenzy') + (this.wield ? 0.15 : 0) + this.stat('HealthMelee') * Math.max(0, this.maxHealth - 150) / 25) * honeDamage(this.meleeTier || 0); }
  meleeCleave() { return MELEE[this.meleeDef].cleave + this.stat('MeleeCleave') + honeCleave(this.meleeTier || 0); }
  honeCost() { return Math.round(HONE_COST[Math.min(HONE_MAX - 1, this.meleeTier || 0)] * this.priceMult()); }
  honeMelee() {
    const W = MELEE[this.meleeDef], t = this.meleeTier || 0;
    if (t >= HONE_MAX) { this.toast(`${W.name} is as sharp as it gets`, '#ccc'); return; }
    if (!this.spend(this.honeCost())) return;
    this.meleeTier = t + 1; this.benchUses++;
    this.play('S_Upgrade', 0.9); this.game.vm.meleeShow(W);
    this.toast(`${W.name} +${this.meleeTier}:  +${Math.round((honeDamage(this.meleeTier) - 1) * 100)}% damage, ${reachText(this.meleeRange())}`, '#ffcd5a');
    this.game.fx.flash(this.pos, lin(1, 0.8, 0.3), 90, 0.4, true);
  }
  meleeTargets(range, arcDeg) {
    const eye = this.eye(), f = this.forward(), ff = flat(f); if (ff.lengthSq() < 1e-4) ff.set(0, 0, 1); ff.normalize();
    const cosA = Math.cos(Math.min(170, arcDeg) * Math.PI / 360), out = [];
    for (const E of this.game.enemies) {
      if (E.dead || E.burrowed) continue;
      const dx = E.pos.x - eye.x, dz = E.pos.z - eye.z, d = Math.hypot(dx, dz), reach = range + (E.hitR || E.radius);
      if (d > reach || Math.abs(E.pos.y - this.pos.y) > 150 + E.half) continue;
      if (d > 50 && (dx * ff.x + dz * ff.z) / d < cosA) continue;
      if (!this.game.phys.lineOfSight(eye, E.pos)) continue;
      out.push([d, E]);
    }
    out.sort((a, b) => a[0] - b[0]);
    return out.map((o) => o[1]);
  }
  // ---- grenades (V): thrown in an arc, bounce, and go off on a fuse or on the first enemy they touch ----
  throwGrenade() {
    if (this.dead || this.grenadeCd > 0) return;
    if (!this.grenades.length) { this.toast('No grenades. Enemies drop them.', '#ccc'); this.play('S_Deny', 0.5); this.grenadeCd = 0.4; return; }
    const keep = this.S.GrenadeSave && Math.random() < Math.min(0.6, this.S.GrenadeSave);
    const t = keep ? this.grenades[this.grenades.length - 1] : this.grenades.pop(), N = GRENADES[t], G = this.game;
    if (keep) this.toast('Recycled', '#ffa23a');
    const dir = new THREE.Vector3(); G.camera.getWorldDirection(dir);
    const from = this.eye().addScaledVector(dir, 40).add(V3(0, -12, 0));
    G.projectiles.spawn({ pos: from, vel: dir.clone().multiplyScalar(1200).add(V3(0, 260, 0)).addScaledVector(this.vel, 0.6), damage: 0, splash: N.radius, gtype: t, gravity: 1, bounces: 3, bounceDamp: 0.45, fuse: 1.3, life: 4, kind: 'Grenade', radius: 12, color: N.color, procCoef: 0, fromProc: true });
    this.grenadeCd = 0.7; this.play('S_Dash', 0.5, 1.3); if (G.vm.jolt) G.vm.jolt(1.2);
  }
  grenadeDamage(mult) { return Math.max(250, zombieHealth(this.game.round) * mult) * (1 + this.stat('GrenadeDamage')); }   // keeps pace with the round
  grenadeBlast(t, at, P) {
    const N = GRENADES[t], G = this.game, R = N.radius * (1 + this.stat('ExplosionRadius')), dmg = P && P.altDmg ? P.altDmg : this.grenadeDamage(N.dmg);
    if (t === 6) { this.wells.push({ at: at.clone(), t: 2.2, r: R, dmg }); G.fx.ring(at, R, N.color, 0.5); this.play('S_Grapple', 0.7, 0.5); return; }   // gravity: pull first, burst later
    const near = () => G.enemies.filter((E) => !E.dead && !E.burrowed && E.pos.distanceTo(at) < R + 40 * E.bodyScale);
    this.explodeAt(at, R, dmg, 0, true, false, N.color, null);
    if (t === 1) { this.gzones.push({ at: at.clone(), r: R * 0.85, t: 6, tick: 0, dps: dmg * 0.45 }); for (const E of near()) E.applyBurn(dmg * 0.25, 4); }
    else if (t === 2) { for (const E of near()) E.applySlow(E.isBoss ? 0.35 : 0.75, E.isBoss ? 3 : 6); G.fx.ring(at, R, N.color, 0.6); }
    else if (t === 3) { const L = near(); let prev = null; for (const E of L) { if (!E.isBoss) { E.staggerT = Math.max(E.staggerT || 0, 2.5); E.applySlow(0.9, 2.5); } if (prev) G.fx.arc(prev.pos, E.pos, N.color); prev = E; } G.fx.ring(at, R, N.color, 0.4); }
    else if ((t === 4 || (t === 5 && this.stat('AbilityPower') >= 1) || (this.S.ClusterAll && t !== 6)) && !(P && P.child)) for (let i = 0; i < (t === 5 ? 4 : 5); i++) { const a = i / 5 * Math.PI * 2 + Math.random(); G.projectiles.spawn({ pos: at.clone().add(V3(0, 30, 0)), vel: V3(Math.cos(a) * 420, 520 + Math.random() * 160, Math.sin(a) * 420), damage: 0, splash: N.radius * 0.8, gtype: 4, child: true, gravity: 1, bounces: 1, bounceDamp: 0.3, fuse: 0.7 + Math.random() * 0.3, life: 3, kind: 'Grenade', radius: 8, color: N.color, procCoef: 0, fromProc: true }); }
  }
  tickGrenades(dt) {
    if (this.grenadeCd > 0) this.grenadeCd -= dt;
    const G = this.game;
    for (let i = this.wells.length - 1; i >= 0; i--) {
      const Z = this.wells[i]; Z.t -= dt;
      for (const E of G.enemies) { if (E.dead || E.burrowed || E.isBoss || E.remote) continue; const d = E.pos.distanceTo(Z.at); if (d < Z.r && d > 40) { const pull = 2600 * dt * (1 - d / Z.r * 0.5); E.vel.x += (Z.at.x - E.pos.x) / d * pull; E.vel.z += (Z.at.z - E.pos.z) / d * pull; E.staggerT = Math.max(E.staggerT || 0, 0.1); } }
      if (Math.random() < dt * 20) G.fx.glowAt(Z.at.clone().add(V3((Math.random() - 0.5) * Z.r, Math.random() * 120, (Math.random() - 0.5) * Z.r)), [0.7, 0.45, 1], 50, 0.25);
      if (Z.t <= 0) { this.explodeAt(Z.at, Z.r * 0.75, Z.dmg, 0, true, false, [0.7, 0.45, 1], null); this.wells.splice(i, 1); }
    }
    for (let i = this.gzones.length - 1; i >= 0; i--) {
      const Z = this.gzones[i]; Z.t -= dt; Z.tick -= dt;
      if (Z.tick <= 0) {
        Z.tick = 0.5;
        for (const E of G.enemies) if (!E.dead && !E.burrowed && Math.hypot(E.pos.x - Z.at.x, E.pos.z - Z.at.z) < Z.r && Math.abs(E.pos.y - Z.at.y) < 260) this.dealDamage(E, Z.dps * 0.5, E.pos, V3(0, 0, 0), false, 0, true, 0, Z.dps * 0.3, 0, 0, [1, 0.6, 0.2]);
        for (let k = 0; k < 5; k++) { const a = Math.random() * 6.28, r = Math.random() * Z.r; G.fx.add({ pos: V3(Z.at.x + Math.cos(a) * r, Z.at.y + 10, Z.at.z + Math.sin(a) * r), vel: V3(0, 120, 0), drag: 1, gravity: -120, life: 0.6, size0: 50, size1: 120, rot: Math.random() * 360, rotVel: 90, c0: [1, 0.85, 0.4, 1], c1: [1, 0.3, 0.05, 1], fadeOut: 0.5, tex: 'FX_Flame', glow: 0.9 }); }
      }
      if (Z.t <= 0) this.gzones.splice(i, 1);
    }
  }
  meleeSwing(power = false, charge = 0) {
    const W = MELEE[this.meleeDef], sp = this.meleeSpeed();
    this.meleeBuffer = 0; this.swingAt = this.game.time;
    const step = power ? 2 : this.meleeComboT > 0 ? (this.meleeCombo + 1) % 3 : 0;
    this.meleeCombo = step; this.meleeHeavy = step === 2; this.meleeBig = power; this.meleeChargeHit = power ? charge : 0;   // `big`: the wound-up heavy blow
    // a swing thrown out of a dash is a thrust: longer, harder, and it goes through the whole line
    this.meleeThrust = !power && (this.dashT > 0 || (this.sinceDash !== undefined && this.sinceDash < 0.3));
    if (this.meleeThrust) this.game.hud.floater(this.eye().add(this.forward().multiplyScalar(140)), 'DASH STRIKE', [0.6, 0.9, 1], 1.1);
    const cd = W.cd / sp * (power ? 1.3 + 0.3 * charge : this.meleeHeavy ? 1.2 : 1);
    this.meleeCd = cd; this.meleeComboT = cd + 0.55; this.meleeHitT = W.wind / sp * (power ? 1.7 : this.meleeHeavy ? 1.3 : 1);
    this.game.vm.meleeSwing(W, step, Math.max(0.16, cd * 0.8));
    this.play('S_Dash', 0.5, (this.meleeHeavy ? 0.8 : 1.25) * Math.max(0.6, Math.min(1.25, 1.45 - W.cd)), 0.06);   // heavier weapons cut the air lower
    // step in toward the nearest target in front so swings connect
    const T = this.meleeTargets(this.meleeRange() * 2.1, 60)[0];
    if (T) { const d = flat(T.pos.clone().sub(this.pos)); const gap = d.length() - T.radius - this.meleeRange() * 0.7; if (gap > 0) { d.normalize(); this.vel.x += d.x * Math.min(650, gap * 7); this.vel.z += d.z * Math.min(650, gap * 7); } }
    this.fovKick += this.meleeHeavy ? 5 : 2.5;
  }
  meleeStrike() {
    const G = this.game, W = MELEE[this.meleeDef], heavy = this.meleeHeavy, big = this.meleeBig;
    const chg = this.meleeChargeHit || 0, thrust = this.meleeThrust;
    const range = this.meleeRange() * (thrust ? 1.5 : big ? 1.1 + 0.15 * chg : heavy ? 1.1 : 1), arc = thrust ? 40 : W.arc * (1 + this.stat('MeleeArc')) * (heavy ? 1.15 : 1);
    const T = this.meleeTargets(range, arc).slice(0, Math.round(this.meleeCleave() + (thrust ? 3 : big ? 1 + Math.round(2 * chg) : heavy ? 1 : 0)));
    if ((heavy || big) && this.S.BladeWave) this.bladeWave(W.dmg * this.meleePower() * 1.6 * this.S.BladeWave * (1 + 0.06 * Math.max(0, effRound(G.round) - 1)), T);
    if (!T.length) {
      const hit = G.phys.raycast(this.eye(), this.forward(), range);   // steel on stone
      if (hit) { G.fx.sparks ? G.fx.sparks(hit.point, hit.normal) : G.fx.flash(hit.point, lin(1, 0.8, 0.4), 30, 0.12, false); this.play('S_HitWall', 0.6, 1.1, 0.1); this.addShake(0.2); }
      return;
    }
    const f = this.forward();
    this.meleeHitting = true;
    let base = W.dmg * this.meleePower() * (1 + 0.1 * (this.flow || 0)) * (thrust ? 1.5 : big ? 1.5 + 1.4 * chg : heavy ? 1.6 : 1) * (heavy ? 1 + this.stat('MeleeHeavy') : 1) * (1 + 0.06 * Math.max(0, effRound(G.round) - 1));
    let killed = 0, dealt = 0;
    for (const E of T) {
      const dir = safeN2(flat(E.pos.clone().sub(this.pos))), at = E.pos.clone().addScaledVector(dir, -E.radius * 0.6); at.y = Math.min(E.pos.y + E.half * 0.5, this.eye().y - 10);
      let dmg = base * Math.max(0.55, 1 - 0.15 * T.indexOf(E));   // the swing loses force as it passes through bodies: nearest first, 15% less each
      const ex = this.stat('MeleeExecute');
      if (ex > 0 && !E.isBoss && !E.elite && E.health / E.maxHealth < ex) dmg = Math.max(dmg, E.health + E.shield + 1);
      const hp0 = E.health + (E.shield || 0);
      this.dealDamage(E, dmg, at, dir, false, 1, false, (W.crit || 0) + this.stat('MeleeCrit'), (W.burn || 0) + this.stat('MeleeBurn'), W.slow || 0, (W.money || 0) + this.stat('MeleeMoney'), heavy ? [1, 0.75, 0.3] : undefined);
      const did = Math.max(0, hp0 - Math.max(0, E.health) - (E.shield || 0)); dealt += did;
      if (this.lastCrit && this.S.CritStun && !E.dead && !E.isBoss) { this.stun(E, this.S.CritStun); G.fx.sparks(at, dir.clone().negate(), [1, 0.85, 0.3], 6); G.hud.floater(at.clone().add(V3(0, 50, 0)), 'DAZED', [1, 0.85, 0.3], 0.9); }
      const bleed = (W.bleed || 0) + this.stat('MeleeBleed'); if (bleed > 0 && !E.dead) E.applyBleed(dmg * bleed);
      if (!E.dead && !E.isBoss) E.applyKnock(dir.clone().multiplyScalar(W.knock * (1 + this.stat('MeleeKnock')) * (heavy ? 1.5 : 1)).add(V3(0, heavy ? 420 : 220, 0)));
      // a hit rocks them: ordinary enemies stumble and their next attack is put off, so trading blows is a choice you make badly
      if (!E.dead && !E.isBoss) { const st = (heavy ? 0.7 : 0.35) * (E.elite ? 0.5 : 1); E.staggerT = Math.max(E.staggerT || 0, st); E.attackCd = Math.max(E.attackCd || 0, st + 0.25); if (big && chg >= 1) { E.staggerT = Math.max(E.staggerT, 1.0); E.applySlow(0.8, 1.2); } }
      if (heavy && !E.dead && !E.isBoss && this.S.MeleeStun) { E.staggerT = Math.max(E.staggerT || 0, this.S.MeleeStun); E.applySlow(0.9, this.S.MeleeStun); }
      const shock = (W.shock || 0) + this.stat('MeleeShock');
      if (shock > 0) { let n = 0; for (const O of G.enemies) { if (n >= 2) break; if (O === E || O.dead || T.includes(O) || O.pos.distanceTo(E.pos) > 420) continue; n++; this.dealDamage(O, dmg * shock, O.pos, dir, false, 0, true); G.fx.flash(O.pos, lin(0.5, 0.8, 1), 60, 0.15, true); } if (n) this.play('S_Chain', 0.5, 1.2, 0.1); }
      G.fx.fleshHit(at, dir, E.bodyScale * (heavy ? 1.5 : 1.1), true);
      if (E.dead) { killed++; Meta.bump('meleeKills'); }
    }
    // feel: freeze frames, a kick and a thump scaled by how hard and how many
    G.hitstop = Math.max(G.hitstop || 0, (heavy ? 0.11 : 0.06) + Math.min(0.04, T.length * 0.01) + (big ? 0.05 * chg : 0));
    this.flowWin = 0.24;   // the beat to press on
    this.addShake((heavy ? 0.9 : 0.4) + Math.min(0.4, T.length * 0.1)); this.fovKick += heavy ? 6 : 3;
    this.play('S_HitFlesh2', 0.9, heavy ? 0.7 : 1, 0.08); if (heavy) this.play('S_Slam', 0.6, 1.1, 0.05);
    G.audio.gunPunch(heavy ? 0.9 : 0.45);
    if (W.quake && heavy) { G.fx.ring(V3(this.pos.x, this.pos.y - 85, this.pos.z).addScaledVector(flat(f).normalize(), 120), 380, lin(0.7, 0.55, 0.4), 0.4); for (const E of G.enemies) if (!E.dead && !T.includes(E) && E.pos.distanceTo(this.pos) < 420) { this.dealDamage(E, base * 0.4, E.pos, safeN2(flat(E.pos.clone().sub(this.pos))), false, 0, true); if (!E.isBoss) E.applyKnock(safeN2(flat(E.pos.clone().sub(this.pos))).multiplyScalar(700).add(V3(0, 380, 0))); } }
    const leech = (W.leech || 0) + this.stat('MeleeLifesteal'); if (leech > 0) this.combatHeal(Math.min(12, dealt * leech));
    if (this.stat('MeleeGuard') > 0) this.meleeGuardT = 2;
    if (killed) {
      if (this.procDepth < 2) this.runProcs('OnMeleeKill', null, this.pos, 0, 1);
      if (this.stat('MeleeDashReset') > 0) this.dashCharges = Math.min(this.maxDash(), this.dashCharges + 1);
      const am = this.stat('MeleeAmmo'); if (am > 0) { const S = this.slot, mag = this.magSize(S); const add = Math.min(Math.ceil(mag * Math.min(1, am)), mag - S.ammo, S.reserve); if (add > 0) { S.ammo += add; S.reserve -= add; } }
      if (this.stat('MeleeFrenzy') > 0) { this.frenzy = Math.min(5, (this.frenzy || 0) + killed); this.frenzyT = 6; }
    }
  }
  // top sources of damage this run, biggest first: [{ who, total, hits, max, pct }]
  damageReport() { const L = this.dmgLog || {}, all = Object.keys(L).reduce((n, k) => n + L[k].total, 0) || 1; return Object.keys(L).map((k) => ({ who: k, total: Math.round(L[k].total), hits: L[k].hits, max: Math.round(L[k].max), pct: Math.round(L[k].total / all * 100) })).sort((a, b) => b.total - a.total); }
  shieldCap() { return Math.max(60, this.maxHealth * 0.6); }   // overshield tops out at 60% of your health, however many things feed it
  heal(a) {
    if (this.dead || a <= 0) return;
    a *= 1 + (this.S.HealBoost || 0);
    const over = this.health + a - this.maxHealth;
    this.health = Math.min(this.maxHealth, this.health + a);
    if (over > 0 && this.S.Overheal) this.overshield = Math.max(this.overshield, Math.min(this.S.Overheal, this.shieldCap(), this.overshield + over));   // Aegis: healing you cannot hold becomes shield
  }
  // healing earned by fighting (kills, lifesteal) comes out of a small bucket that refills at 8 health a second,
  // so a horde of a hundred is not a hundred heals
  // ---- shared pieces of the buffs that do things
  stun(E, t) { if (!E || E.dead || E.isBoss) return; if (E.elite) t *= 0.5; E.staggerT = Math.max(E.staggerT || 0, t); E.attackCd = Math.max(E.attackCd || 0, t + 0.25); E.applySlow(0.9, t); }
  // a shockwave around your feet: two rings, dust, a thump, and everything inside thrown back
  shockAround(radius, dmg, color, push = 520, lift = 360) {
    const G = this.game, feet = V3(this.pos.x, this.pos.y - 85, this.pos.z);
    G.fx.ring(feet, radius, color, 0.42); G.fx.ring(feet, radius * 0.55, lerp3(color, [1, 1, 1], 0.5), 0.26);
    G.fx.dust(feet, lin(0.5, 0.42, 0.33), Math.min(160, radius * 0.3));
    G.fx.flash(feet.clone().add(V3(0, 50, 0)), color, radius * 0.35, 0.16, true);
    this.addShake(0.7); this.play('S_Slam', 0.7, 1.05, 0.05);
    this.procDepth++;
    for (const E of G.enemies) {
      if (E.dead || E.emerging || E.burrowed || E.pos.distanceTo(this.pos) > radius + E.radius) continue;
      const away = safeN2(E.pos.clone().sub(this.pos));
      this.dealDamage(E, dmg, E.pos, away, false, 0, true, 0, 0, 0, 0, color);
      if (!E.dead && !E.isBoss) E.applyKnock(away.multiplyScalar(push).add(V3(0, lift, 0)));
    }
    this.procDepth--;
  }
  // Clean Bill: a bolt of light down the sights, through everything, as far as the first wall
  lightBolt(eye, dir, muzzle) {
    const G = this.game, wall = G.phys.raycast(eye, dir, 6000), far = wall ? wall.distance : 6000, end = eye.clone().addScaledVector(dir, far), col = [1, 0.97, 0.7];
    G.fx.tracer(muzzle, end, col, 30, 0.2);
    // a tracer seen from behind is a dot, so the bolt is also a string of lights from the muzzle to wherever it lands
    { const span = muzzle.distanceTo(end), n = Math.min(44, Math.ceil(span / 70)), d = end.clone().sub(muzzle).divideScalar(n);
      for (let k = 0; k <= n; k++) G.fx.add({ pos: muzzle.clone().addScaledVector(d, k), life: 0.3 + 0.16 * (k / n), size0: 46, size1: 18, c0: [1, 1, 0.9, 1], c1: [col[0], col[1], col[2], 0], fadeOut: 0.5, tex: 'FX_Glow', kind: 'add', glow: 3 }); }
    G.fx.flash(muzzle, col, 34, 0.1, true); G.fx.glowAt(end, col, 120, 0.2);
    if (wall) G.fx.sparks(wall.point, wall.normal, col, 6);
    this.play('S_Chain', 0.45, 1.7, 0.05);
    this.procDepth++;
    for (const E of G.enemies) {
      if (E.dead || E.burrowed) continue;
      const t = G.rayEnemy(eye, dir, far, E, 25);
      if (t === null) continue;
      const at = eye.clone().addScaledVector(dir, t);
      G.fx.flash(at, col, 40, 0.12, false);
      this.dealDamage(E, this.power() * this.S.LightBolt, at, dir, false, 0, true, 0, 0, 0, 0, col);
    }
    this.procDepth--;
  }
  // Long Reach: the heavy blow carries on as a wave of force down the line you are facing
  bladeWave(dmg, skip) {
    const G = this.game, f = this.forward(), eye = this.eye().add(V3(0, -30, 0)), len = 1300, col = [0.72, 0.93, 1];
    const a = eye.clone().addScaledVector(f, 90), b = eye.clone().addScaledVector(f, len);
    // seen from behind a beam is a dot, so the wave is a bar of light lying across your view that flies away down the line
    const rt = this.right(), fly = f.clone().multiplyScalar(len / 0.42), gy = G.fx.groundY(a, 400);
    G.fx.add({ mode: 'fixed', right: rt, up: UP.clone(), pos: a.clone(), vel: fly.clone(), life: 0.42, size0: 300, size1: 520, stretch: 0.3, c0: [col[0], col[1], col[2], 0.95], c1: [col[0], col[1], col[2], 0], fadeOut: 0.4, tex: 'FX_Spark', kind: 'add', glow: 3 });
    G.fx.add({ mode: 'fixed', right: rt, up: UP.clone(), pos: a.clone(), vel: fly.clone(), life: 0.42, size0: 260, size1: 460, stretch: 0.07, c0: [1, 1, 1, 1], c1: [1, 1, 1, 0], fadeOut: 0.4, tex: 'FX_Spark', kind: 'add', glow: 3 });
    G.fx.add({ pos: a.clone(), vel: fly.clone(), life: 0.42, size0: 120, size1: 200, c0: [col[0], col[1], col[2], 0.5], c1: [col[0], col[1], col[2], 0], tex: 'FX_Glow', kind: 'add', glow: 2 });
    for (let k = 1; k <= 5; k++) { const q = eye.clone().addScaledVector(f, len * k / 5.5); if (gy > -1e8) q.y = gy + 12; G.fx.add({ pos: q, delay: 0.42 * k / 5.5, vel: V3(0, 90, 0), drag: 2, life: 0.35, size0: 40, size1: 110, rot: Math.random() * 360, c0: [0.75, 0.72, 0.66, 0.6], c1: [0.75, 0.72, 0.66, 0], tex: 'FX_Puff' }); }
    G.fx.flash(a, col, 50, 0.1, true);
    this.play('S_Dash', 0.7, 1.7, 0.05);
    this.procDepth++;
    for (const E of G.enemies) {
      if (E.dead || E.burrowed || skip.includes(E)) continue;
      const v = E.pos.clone().sub(eye), t = v.dot(f);
      if (t < 0 || t > len || v.addScaledVector(f, -t).length() > 120 + E.radius) continue;
      this.dealDamage(E, dmg, E.pos, f, false, 0, true, 0, 0, 0, 0, col);
      if (!E.dead && !E.isBoss) E.applyKnock(f.clone().multiplyScalar(420).add(V3(0, 200, 0)));
    }
    this.procDepth--;
  }
  combatHeal(a) { const h = Math.min(a, this.healBucket); if (h > 0) { this.healBucket -= h; this.heal(h); } }
  receiveDamage(amount, source, melee, slowAmt = 0, slowTime = 0, silent = false) {
    if (this.dead || amount <= 0 || this.invuln > 0 || this.game.godMode) return;
    if (this.rushT > 0) return;                               // nothing lands on a Brawler mid-charge
    if (this.S.Bulwark && this.game.time > (this.bwT || 0)) {   // Scrap Plating: one blow in ten seconds rings off the plate, and the ring knocks them back
      this.bwT = this.game.time + Math.max(5, 11 - this.S.Bulwark); this.shockAround(400, this.power() * 0.8, [0.75, 0.82, 0.9]); this.play('S_Ricochet', 0.8, 0.7, 0.05);
      this.game.hud.floater(this.pos.clone().add(V3(0, 60, 0)), 'DEFLECTED', [0.75, 0.85, 1], 1); return;
    }
    amount *= diff().dmg;   // difficulty: everything that hurts you is scaled here, once
    buildHurt(this, source, amount);
    if (this.buildRank && this.buildRank.Bulwark > 2) amount *= 0.75;
    if (this.rushGuardT > 0) amount *= 1 - this.stat('RushGuard');
    const raw = amount;
    // Duelist's Sash: a blow that lands just as you swing is turned aside, and whoever threw it is left reeling
    if (melee && this.S.Parry && this.wield && !silent && this.game.time - (this.swingAt || -9) < 0.4) {
      const G = this.game, p = this.eye().add(this.forward().multiplyScalar(110));
      G.hud.floater(p, 'PARRY', [1, 0.9, 0.5], 1.3); G.fx.sparks(p, this.forward().negate(), [1, 0.9, 0.6], 10); G.fx.flash(p, [1, 0.9, 0.6], 40, 0.12, true);
      this.play('S_HitWall', 0.9, 1.35, 0.05); this.play('S_Crit', 0.5, 0.8, 0.05); this.addShake(0.45); G.hitstop = Math.max(G.hitstop || 0, 0.09);
      if (source && source.takeHit) { this.stun(source, 1.2 * this.S.Parry); if (!source.isBoss) source.applyKnock(safeN2(source.pos.clone().sub(this.pos)).multiplyScalar(380).add(V3(0, 160, 0))); }
      return;
    }
    if (this.S.BlockChance && !silent && Math.random() < Math.min(0.35, 1 - 1 / (1 + this.S.BlockChance))) {
      this.game.hud.floater(this.eye().add(this.forward().multiplyScalar(120)), 'BLOCKED', [0.7, 0.85, 1], 1.1); this.play('S_HitWall', 0.5, 0.7, 0.1);
      if (this.S.BlockShock && this.game.time - (this.blockShockAt || -9) > 1) { this.blockShockAt = this.game.time; this.shockAround(450, this.power() * this.S.BlockShock, lin(0.6, 0.8, 1)); }   // Bulwark throws it back
      return;
    }
    if (this.S.AirGuard && !this.grounded) amount *= 1 - Math.min(0.5, this.S.AirGuard);
    if (this.dashGuardT > 0 && this.S.DashGuard) amount *= 1 - Math.min(0.6, this.S.DashGuard);
    // a crowd cannot land all its swings in the same instant: after a melee hit the next one needs a beat
    if (melee) { if (this.game.time - (this.lastMeleeHit || -9) < 0.55) return; this.lastMeleeHit = this.game.time; }
    // the same goes for blasts: several markers going off together count once, not once each
    else if (source && (source.kind === 'Marker' || source.kind === 'Ring') && !silent) { if (this.game.time - (this.lastBlastHit || -9) < 0.4) return; this.lastBlastHit = this.game.time; }
    if (this.inMenu()) this.closeMenu();
    const armor = Math.min(200, this.stat('Armor') + (this.wield ? this.stat('MeleeArmor') : 0));   // 200 armor is a third of the damage; more does nothing
    let dmg = amount * (armor >= 0 ? 100 / (100 + armor) : 1 + -armor / 100);
    if (this.S.PlateArmor) dmg = Math.max(dmg * 0.4, dmg - this.S.PlateArmor);
    dmg = Math.max(dmg, raw * 0.2);   // armor, plating, guards and the rest together never take off more than 80%
    if (this.S.HitCap) dmg = Math.min(dmg, this.maxHealth * Math.max(0.2, this.S.HitCap));
    if (this.meleeGuardT > 0) dmg *= 1 - Math.min(0.6, this.stat('MeleeGuard'));
    if (this.overshield > 0) { const a = Math.min(this.overshield, dmg); this.overshield -= a; dmg -= a; if (this.overshield <= 0 && !silent) this.runProcs('OnShieldBreak', null, this.pos, 0, 1); }
    this.health -= dmg;
    if (this.S.SecondWind && !this.secondWindUsed && this.health > 0 && this.health < this.maxHealth * 0.25) { this.secondWindUsed = true; this.health = Math.min(this.maxHealth, this.health + this.maxHealth * Math.min(0.8, this.S.SecondWind)); this.invuln = Math.max(this.invuln, 0.6); this.toast('Second wind', '#7dff8a'); this.play('S_PowerUp', 0.7, 1.2); }
    this.sinceDamage = 0;
    // damage report: what hit you, totalled for the run and kept in order for the last few seconds
    { let who = 'Other';
      if (source && source.def) who = (source.isBoss ? source.boss.name : source.elite || source.variant ? source.displayName() : source.def.name) + (melee ? '' : ' (special)');
      else if (source && source.label) who = source.label;
      else if (source && source.hostile !== undefined) who = 'Enemy projectile';
      else if (source && source.kind) who = { Marker: 'Blast marker', Ring: 'Shockwave ring', Fire: 'Fire on the ground' }[source.kind] || source.kind;
      else if (melee) who = 'Enemy melee';
      this.dmgLog = this.dmgLog || {}; this.dmgRecent = this.dmgRecent || [];
      const L = this.dmgLog[who] || (this.dmgLog[who] = { total: 0, hits: 0, max: 0 }); L.total += dmg; L.hits++; L.max = Math.max(L.max, dmg);
      const last = this.dmgRecent[this.dmgRecent.length - 1];
      if (last && last.who === who && this.game.time - last.t < 1 && dmg < 5) { last.dmg += dmg; L.hits--; }   // burning ticks read as one line, not sixty
      else { this.dmgRecent.push({ who, dmg, t: this.game.time }); if (this.dmgRecent.length > 40) this.dmgRecent.shift(); } }
    if (!silent) {
      this.hurtFlash = Math.min(1, this.hurtFlash + 0.35 + dmg / Math.max(1, this.maxHealth));
      this.game.hud.hurt(Math.min(1, dmg / 40));
      this.hurtKick = (Math.random() < 0.5 ? -1 : 1) * Math.min(6, 2 + dmg * 0.08);
      const st = clamp(dmg / Math.max(1, this.maxHealth) * 3, 0.3, 1);
      this.addShake(0.5 + st * 0.8);
      this.addKick(-2.5 * st, frandRange(-1.5, 1.5) * st);
      this.play('S_Hurt', 0.9, 1, 0.08);
      const sp = source && source.pos ? source.pos : null;
      if (sp) { this.damageInd.push({ at: sp.clone(), t: 1.4, s: st }); if (this.damageInd.length > 8) this.damageInd.shift(); }
    }
    if (slowAmt > 0) { this.slowAmt = Math.max(this.slowAmt * (this.slowT > 0 ? 1 : 0), slowAmt); this.slowT = Math.max(this.slowT, slowTime); }
    if (melee && source && source.takeHit) {
      const thorns = this.stat('Thorns');
      if (thorns > 0) this.dealDamage(source, thorns * this.flatScale(), source.pos, source.pos.clone().sub(this.pos).normalize(), false, 1, true, 0, 0, 0, 0, lin(0.6, 1, 0.5));
    }
    if (!silent) this.runProcs('OnHurt', null, this.pos, 0, 1);
    if (this.health <= 0) {
      const G = this.game;
      if (this.revives > 0) {
        this.revives--; this.reviveRound = G.round; this.health = this.maxHealth; this.invuln = 2.5;
        G.fx.explosion(this.pos, 400, lin(1, 0.55, 0.15));
        G.banner('REVIVED', lin(1, 0.6, 0.2), 3);
        for (const E of G.enemies) if (!E.dead && E.pos.distanceTo(this.pos) < 500) E.applyKnock(safeN2(E.pos.clone().sub(this.pos)).multiplyScalar(1200).add(V3(0, 500, 0)));
        return;
      }
      this.health = 0; this.dead = true;
      this.closeMenu();
      if (this.grappling) this.endGrapple(false);
      // with a teammate still standing you go down instead: they have thirty seconds to get you up
      this.downed = G.net.active && G.net.alivePositions().length > 0;
      if (this.downed) { this.bleed = 30; this.reviveP = 0; this.vel.set(0, 0, 0); G.fx.dust(V3(this.pos.x, this.pos.y - 80, this.pos.z), lin(0.6, 0.2, 0.15), 60); }
      else G.fx.gibs(this.pos, hexRGB(0xB0603A), 1, 16);
      G.vm.hidden = true;
      this.addShake(2);
      this.play('S_Gib', 1);
      G.playerDied();
    }
  }

  // ------------------------------------------------------------------ camera
  updateCamera(dt) {
    const G = this.game, cam = G.camera;
    const sp = Math.hypot(this.vel.x, this.vel.z);
    { const a = (0 - this.landDip) * 140 - this.landDipVel * 14; this.landDipVel += a * dt; this.landDip += this.landDipVel * dt; }
    let bobZ = 0, bobRoll = 0;
    if (this.grounded && !this.sliding && !this.dead) {
      this.bobPhase += dt * (5.5 + sp * 0.0105);
      const amp = clamp(sp / 640, 0, 1.5) * (1 - this.adsAlpha() * 0.8);
      bobZ = -Math.abs(Math.cos(this.bobPhase)) * 2.2 * amp;
      bobRoll = Math.sin(this.bobPhase) * 0.35 * amp;
      this.footDist += sp * dt;
      if (this.footDist > (this.sprintHeld ? 260 : 210) && sp > 120) { this.footDist = 0; this.play('S_Step' + randInt(0, 3), 0.32, 1, 0.08); }
    }
    this.eyeZ = interpTo(this.eyeZ, this.dead ? -40 : this.sliding ? 22 : 66, dt, 12);
    let rollT = 0;
    if (this.wallRunning) rollT = -this.wallSide * 11; else if (this.sliding) rollT = -4;
    rollT += clamp(this.inRight || 0, -1, 1) * -1.2;
    this.camRoll = interpTo(this.camRoll, rollT, dt, 7);
    { const ax = -this.camKick.x * 180 - this.camKickVel.x * 17, ay = -this.camKick.y * 180 - this.camKickVel.y * 17; this.camKickVel.x += ax * dt; this.camKickVel.y += ay * dt; this.camKick.x += this.camKickVel.x * dt; this.camKick.y += this.camKickVel.y * dt; }
    this.shake = Math.max(0, this.shake - dt * 3.2);
    this.shakeT += dt * 38;
    const sh = this.shake * this.shake * (G.settings.shake ?? 1);
    const pitch = this.pitch + (this.camKick.x + noise1(this.shakeT) * 4 * sh) * D2R;
    const yaw = this.yaw - (this.camKick.y + noise1(this.shakeT + 31.7) * 4 * sh) * D2R;
    const roll = -(this.camRoll + bobRoll + noise1(this.shakeT + 77.1) * 3 * sh) * D2R;
    cam.position.set(this.pos.x, this.pos.y + this.eyeZ + bobZ + this.landDip, this.pos.z);
    cam.rotation.set(pitch, yaw, roll, 'YXZ');
    let zoom = 1;
    switch (this.W.cls) { case 'Sniper': zoom = 0.38; break; case 'Rifle': zoom = 0.72; break; case 'LMG': zoom = 0.78; break; default: zoom = 0.82; }
    { const O = G.vm.optic; if (O && O.zoom && this.W.cls !== 'Sniper') zoom = Math.min(zoom, O.zoom); }   // a scope magnifies a little; only a sniper's fills the view
    this.fovKick = interpTo(this.fovKick, 0, dt, 6);
    let tf = (G.settings.fov || 100) + clamp((sp - 700) / 60, 0, 14) + (this.sliding ? 6 : 0) + this.fovKick;
    tf = tf + ((G.settings.fov || 100) * zoom - tf) * this.adsAlpha();
    this.fov = interpTo(this.fov, tf, dt, 12);
    // view model
    const localVel = this.vel.clone().applyAxisAngle(UP, -this.yaw);
    G.vm.wield = !!this.wield && !this.dead; G.vm.mCharge = this.wield ? this.meleeCharge || 0 : 0;
    G.vm.update(dt, {
      look: this.lookDelta, localVel, grounded: this.grounded, sprinting: this.sprintHeld && this.inFwd > 0.1 && sp > 500, sliding: this.sliding,
      aiming: this.aiming && !this.inMenu(), wallSide: this.wallRunning ? this.wallSide : 0, reloading: this.reloading,
      reloadFrac: this.reloadDur > 0 ? 1 - this.reloadT / this.reloadDur : 0,
      ammo: this.slot.def >= 0 ? this.slot.ammo : 0, empty: this.slot.def >= 0 && this.slot.ammo <= 0 && !this.reloading, spool: this.spool || 0, charge: this.railT > 0 ? 1 - this.railT / 0.28 : 0,
    });
    this.lookDelta = { x: 0, y: 0 };
    { // badly hurt: the heartbeat comes up, quickens as it gets worse, and the rest of the world goes dull behind it
      const low = !this.dead && this.health < this.maxHealth * 0.3, k = low ? 1 - this.health / (this.maxHealth * 0.3) : 0;
      G.audio.setMuffle(low ? 0.35 + 0.5 * k : 0);
      if (low) { this.heartbeat -= dt; if (this.heartbeat <= 0) { this.heartbeat = 0.9 - 0.3 * k; this.play('S_Heartbeat', 0.6 + 0.25 * k, 1 + 0.12 * k); } }
    }
  }

  // ------------------------------------------------------------------ combat
  tickCombat(dt) {
    this.fireCd -= dt;
    this.bloom = interpTo(this.bloom, 0, dt, 5);
    if (this.reloading) { this.reloadT -= dt; if (this.reloadT <= 0) this.finishReload(); }
    for (const S of this.weapons) if (S.altCd > 0) S.altCd -= dt;
    this.aimHold = this.aiming && this.fireCd <= 0 ? this.aimHold + dt : 0;
    if (this.swapBuffT > 0) this.swapBuffT -= dt;
    if (this.echoT > 0) { this.echoT -= dt; if (this.echoT <= 0 && !this.reloading && this.slot.def >= 0) this.fireWeapon(true); }   // Echo Chamber's second shot
    // Feel: a crank gun has to wind up (holding the sights keeps it turning), and the rail gun charges for a beat before it lets go.
    const FL = this.slot.def >= 0 ? gunFeel(this.W) : null, trig = this.fireHeld && !this.inMenu() && !this.dead && !this.reloading;
    if (FL && FL.spool) this.spool = clamp((this.spool || 0) + dt * (trig && this.slot.ammo > 0 ? 1.5 : this.aiming ? (this.spool < 0.45 ? 1.2 : -0.2) : -1.1), 0, 1); else this.spool = 0;
    if (this.railT > 0) {
      this.railT -= dt;
      if (!FL || !FL.chargeUp || this.reloading || this.slot.ammo <= 0) this.railT = 0;
      else if (this.railT <= 0) { this.railT = 0; this.fireWeapon(); this.fireCd -= FL.chargeUp; }   // the charge is part of the cycle: the rate of fire is unchanged
      return;
    }
    if (!this.fireHeld || this.inMenu() || this.dead) return;
    if (!this.W.auto && !(this.stat('FullAuto') > 0) && this.fireConsumed) return;
    if (this.fireCd <= (FL && FL.chargeUp ? FL.chargeUp : 0) && this.game.vm.switchT <= 0.05) {
      if (FL && FL.chargeUp && this.slot.ammo > 0 && !this.reloading) { this.railT = FL.chargeUp; this.fireConsumed = true; this.play('S_Energy', 0.6, 0.55); return; }
      if (this.fireCd <= 0) { this.fireWeapon(); this.fireConsumed = true; }
    }
  }
  fireWeapon(echo = false) {
    const S = this.slot;
    if (S.def < 0 || this.reloading) return;
    const G = this.game, W = DATA.weapons[S.def];
    if (!echo && S.ammo <= 0) { this.startReload(); this.fireCd = 0.2; if (S.reserve <= 0) this.play('S_Dry', 0.6); return; }
    if (!echo && this.aiming && S.altCd <= 0 && this.altKind() && this.fireAlt(S, W)) return;   // aiming down the sights fires the gun's alt mode when it is ready
    // how long the trigger has been worked without a real pause: Hair Trigger speeds up on it, Overclock heats up on it
    if (!echo) { const gap = G.time - (this.lastShotAt || -9); this.sustain = gap < Math.max(0.35, 2 / W.rate) ? (this.sustain || 0) + gap : 0; this.lastShotAt = G.time; }
    const wasHot = this.hotBarrel > 0;
    this.hotBarrel = (this.sustain || 0) >= 2 ? this.stat('HotBarrel') : 0;
    if (this.hotBarrel > 0 && !wasHot) { this.play('S_PowerUp', 0.4, 1.6); G.hud.floater(this.eye().add(this.forward().multiplyScalar(140)), 'BARREL HOT', [1, 0.55, 0.15], 1.1); }
    const wasLast = !echo && S.ammo === 1;
    const rate = W.rate * (1 + this.stat('RampFire') * Math.min(1, (this.sustain || 0) / 2)) * Math.max(0.2, 1 + this.stat('FireRate') + (this.ktT > 0 ? (this.ktN || 0) * this.S.KillTempo : 0)) * (1 + 0.03 * S.tier) * (this.deadeyeT > 0 ? 1.5 : 1) * (gunFeel(W).spool ? 0.4 + 0.75 * (this.spool || 0) : 1);   // a crank gun starts slow and ends faster than its listed rate
    const mag = this.magSize(S), full = S.ammo >= mag, last = S.ammo <= Math.max(1, mag / 3);
    if (!echo) { this.fireCd = 1 / rate; if (this.deadeyeT <= 0 && Math.random() >= this.stat('AmmoSave')) S.ammo--; }
    const multi = W.pellets * Math.min(2, this.stat('Multishot'));   // extra projectiles scale with the gun's own count, and deal half damage
    let pellets = W.pellets + Math.floor(multi);
    if (Math.random() < multi - Math.floor(multi)) pellets++;
    let damage = W.dmg * (1 + 0.2 * S.tier);
    if (echo) damage *= 0.5;
    else {
      if (full) damage *= 1 + this.stat('FirstShot');                       // Opening Hand
      if (this.aimHold > 0.7) damage *= 1 + this.stat('SteadyAim');         // Steady Aim
      if (this.stat('EchoShot') > 0) this.echoT = 0.085;
    }
    if (last) damage *= 1 + this.stat('LastRounds');                         // Closer
    const finalRound = wasLast && S.ammo === 0 && mag >= 3 && this.stat('FinalRound') > 0 && W.mode !== 'Beam' && W.mode !== 'Flame';   // Outlaw's Nerve
    if (finalRound) damage *= 1 + this.stat('FinalRound');
    if (S.hot > 0) { damage *= 1.35; S.hot--; }                              // a perfect active reload
    if (this.aiming && this.cls.id === 'sniper') damage *= 1.15;
    this.aimHold = 0;
    const pierce = W.pierce + Math.round(this.stat('Pierce')) + (S.tier >= 3 ? 1 : 0) + (this.aiming && this.cls.id === 'sniper' ? 2 : 0);
    const muzzle = G.vm.muzzleWorld();
    const eye = G.camera.position.clone();
    const baseDir = new THREE.Vector3(); G.camera.getWorldDirection(baseDir);
    const aim = this.aimPoint(eye, baseDir);
    let projDir = aim.clone().sub(muzzle).normalize();
    if (projDir.dot(baseDir) < 0.5) projDir = baseDir.clone();
    const spread = this.deadeyeT > 0 ? 0 : this.spreadDeg() * D2R;
    const continuous = W.mode === 'Beam' || W.mode === 'Flame';
    const procCoef = continuous ? 0.25 : 1 / Math.max(1, pellets);
    let tracer = lerp3(hexRGB(W.color), [1, 0.96, 0.8], 0.5);
    if (S.tier > 0) tracer = lerp3(tracer, [1, 0.6, 0.95], 0.5);
    if (this.hotBarrel > 0) { tracer = [1, 0.5, 0.15]; G.fx.glowAt(muzzle, [1, 0.45, 0.1], 70, 0.12); }
    if (finalRound) {
      tracer = [1, 0.85, 0.3];
      G.fx.flash(muzzle, [1, 0.85, 0.4], 60, 0.14, true); this.addShake(0.9); this.fovKick += 6; this.play('S_Explosion', 0.5, 1.3, 0.05);
      G.hud.floater(eye.clone().addScaledVector(baseDir, 150), 'LAST ROUND', [1, 0.85, 0.3], 1.1);
      if (W.mode === 'Hitscan') this.explodeAt(aim, 280 * (1 + this.stat('ExplosionRadius')), damage * 0.5, 0.5, false, false, lin(1, 0.8, 0.3), null);
    }
    if (!echo && this.S.LightBolt) { this.boltN = (this.boltN || 0) + 1; if (this.boltN % 4 === 0 && this.health >= this.maxHealth * 0.9) this.lightBolt(eye, baseDir, muzzle); }
    for (let p = 0; p < pellets; p++) {
      const dmgP = p < W.pellets ? damage : damage * 0.5;
      const dir = spread > 0 ? vrandCone(baseDir, spread) : baseDir.clone();
      let pdir = spread > 0 ? vrandCone(projDir, spread) : projDir.clone();
      if (W.name === "Fan of Knives" && pellets > 1) pdir = projDir.clone().applyAxisAngle(new THREE.Vector3().setFromMatrixColumn(G.camera.matrixWorld, 1), -(p - (pellets - 1) / 2) * 0.045).add(vrandCone(projDir, 0.006).sub(projDir)).normalize();   // dealt as a fan, left to right
      switch (W.mode) {
        case 'Hitscan': this.fireHitscan(eye, dir, W.range, dmgP, pierce, procCoef, W, W.cls === 'Sniper' ? 7 : 3, tracer, muzzle); break;
        case 'Beam': this.fireHitscan(eye, dir, W.range, dmgP, pierce, procCoef, W, 10, hexRGB(W.color), muzzle); break;
        case 'Flame':
          this.fireHitscan(eye, dir, W.range, dmgP, pierce, procCoef, W, 0, lin(1, 0.5, 0.1), muzzle);
          if (p === 0) for (let k = 0; k < 2; k++) {
            G.fx.add({ pos: muzzle.clone().addScaledVector(dir, 20), vel: dir.clone().multiplyScalar(frandRange(900, 1300)).add(this.vel), drag: 1.5, gravity: -150, life: 0.32 + k * 0.08,
              size0: 18 + 10 * k, size1: 90 + 30 * k, rot: Math.random() * 360, rotVel: frandRange(-200, 200), c0: [1, 0.92, 0.55, 1], c1: [1, 0.35, 0.08, 1], fadeOut: 0.5, tex: Math.random() < 0.5 ? 'FX_Flame' : 'FX_Puff', glow: 0.9 });
          }
          break;
        case 'Chain': this.fireChain(muzzle, pdir, dmgP, W); break;
        default: this.fireProjectile(muzzle, pdir, dmgP, procCoef, W); break;
      }
    }
    let kick = 0.3;
    switch (W.cls) {
      case 'Shotgun': kick = 1.6; break; case 'Sniper': kick = 2.2; break; case 'Launcher': kick = 1.4; break;
      case 'Pistol': kick = W.auto ? 0.3 : 0.8; break; case 'Rifle': kick = W.auto ? 0.35 : 0.7; break; case 'LMG': kick = 0.45; break;
      case 'Energy': kick = continuous ? 0.04 : 0.4; break; default: kick = 0.3;
    }
    this.bloom = Math.min(this.bloom + (continuous ? 0.02 : 0.15), 1.5);
    this.fireFeedback(W, echo ? kick * 0.5 : kick, continuous, echo ? 0.5 : 1);
    if (S.ammo <= 0) this.startReload();
  }
  fireFeedback(W, kick, continuous, scale = 1) {
    const ads = (this.aiming ? 0.3 : 1) * scale, F = gunFeel(W), cam = F.cam, t = this.game.time;
    // a burst is a run of shots with no real pause; patterns are read off its length
    if (t - (this.lastShotT || -9) > Math.max(0.22, 1.8 / W.rate)) this.shotRun = 0;
    this.lastShotT = t; const n = this.shotRun = (this.shotRun || 0) + 1;
    const settle = 1 / (1 + (n - 1) * (cam.taper || 0));                       // the climb eases off as you hold the trigger down
    let side = 0;
    switch (cam.pat) {
      case 'zig': side = (n % 2 ? 1 : -1) * (0.6 + Math.random() * 0.4); break;          // left, right, left
      case 'left': side = -(0.5 + Math.random() * 0.5); break;
      case 'right': side = 0.5 + Math.random() * 0.5; break;
      case 'S': side = Math.sin(n * 0.55) * 0.9 + (Math.random() - 0.5) * 0.4; break;      // a slow snake you can learn
      default: side = Math.random() * 2 - 1;
    }
    const e = kick < 0.01 ? 0 : 1;
    this.addPitch(cam.up * settle * ads * e);
    this.addYaw(side * cam.side * ads * e);
    this.addKick(cam.snap * 1.3 * ads * e, side * cam.side * 2 * ads * e);
    this.crossKick = Math.min(this.crossKick + kick * 0.6, 2);
    // every shot is felt: a shake, a punch of the view, a flash on the world in front of you, and a buzz on phones
    this.addShake((continuous ? 0.02 : 0.06 + kick * 0.16) * (this.aiming ? 0.35 : 1));
    this.fovKick += (continuous ? 0.15 : Math.min(7, cam.fov || (0.6 + kick * 1.1))) * (this.aiming ? 0.25 : 1);
    if (!continuous) {
      const G = this.game, e = this.eye(), f = this.forward();
      G.fx.glowAt(e.clone().addScaledVector(f, 150), lin(0.45, 0.33, 0.15), (180 + kick * 90) * 1.8, 0.06);   // light on the scene only: the flash itself is on the gun
      if (navigator.vibrate && this.game.touch) { try { navigator.vibrate(Math.round(Math.min(40, 8 + kick * 10))); } catch (err) { /* unsupported */ } }
    }
    this.game.vm.fire(kick, continuous);
    // every gun has its own synthesized voice (gunsound.js); held beams and hoses tick quietly instead of blasting
    this.shotSeq = ((this.shotSeq || 0) + 1) % 100000;   // teammates see and hear this shot
    if (!continuous || Math.random() < 0.3) gunSound(this.game.audio, W.name, 1, continuous);
    const S = this.slot;
    if (S.ammo > 0 && S.ammo <= Math.max(2, Math.floor(this.magSize(S) / 6))) this.play('S_Dry', 0.35, 1.4);
  }
  aimPoint(eye, dir) {
    const G = this.game;
    const wall = G.phys.raycast(eye, dir, 30000);
    let best = wall ? wall.distance : 30000;
    for (const E of G.enemies) { if (E.dead) continue; const t = G.rayEnemy(eye, dir, best, E, 0); if (t !== null && t < best) best = t; }
    return eye.clone().addScaledVector(dir, best);
  }
  fireHitscan(start, dir, range, damage, pierce, procCoef, W, width, color, muzzle) {
    const G = this.game;
    const ignore = new Set();
    let from = start.clone(), final = start.clone().addScaledVector(dir, range), hits = 0, dmg = damage, remaining = range;
    for (let guard = 0; guard < 16; guard++) {
      const wall = G.phys.raycast(from, dir, remaining);
      const wallD = wall ? wall.distance : remaining;
      if (guard === 0) G.quest.shot(from, dir, wallD);
      let best = null, bestT = wallD;
      for (const E of G.enemies) {
        if (E.dead || ignore.has(E) || E.burrowed) continue;
        const t = G.rayEnemy(from, dir, bestT, E, W.mode === 'Flame' ? 30 : 0);
        if (t !== null && t < bestT) { bestT = t; best = E; }
      }
      if (!best) {
        if (wall) {
          final = wall.point;
          if (width > 0) {
            G.fx.sparks(wall.point, wall.normal, [1, 0.93, 0.73], 3);
            if (Math.random() < 0.3) G.audio.playAt(Math.random() < 0.3 ? 'S_Ricochet' : 'S_HitWall', wall.point, 0.6, 1, 0.15);
          }
          if (W.splash > 0) this.explodeAt(wall.point, W.splash * (1 + this.stat('ExplosionRadius')), dmg * 0.6, procCoef, false, false, color, null);
        } else final = from.clone().addScaledVector(dir, remaining);
        break;
      }
      const at = from.clone().addScaledVector(dir, bestT);
      final = at;
      const head = at.y > best.headY();
      this.dealDamage(best, dmg, at, dir, head, procCoef, false, W.critBonus, W.burn, W.slow, W.moneyPerHit);
      if (W.splash > 0) this.explodeAt(at, W.splash * (1 + this.stat('ExplosionRadius')), dmg * 0.6, procCoef, false, false, color, best);
      if (hits >= 1 && (this.S.PierceRamp || this.S.PierceSlow)) {
        G.fx.sparks(at, dir.clone().negate(), this.S.PierceRamp ? [1, 0.8, 0.4] : [0.8, 0.85, 0.9], 5);
        if (this.S.PierceSlow && !best.dead) best.applySlow(this.S.PierceSlow, 2.5);   // Rebar Rounds pin whatever stood behind
      }
      ignore.add(best);
      remaining -= bestT; from = at;
      hits++; dmg *= this.S.PierceRamp ? 1 + this.S.PierceRamp : 0.85;                 // Hollow Charge gathers force as it goes through
      if (hits > pierce) break;
    }
    if (width > 0) G.fx.tracer(muzzle, final, color, width, W.mode === 'Beam' ? 0.05 : 0.06);
    else if (W.mode === 'Flame') G.fx.glowAt(final, lin(1, 0.45, 0.1), 80, 0.15);
    // Ricochet Rounds: the bullet skips on to whoever is nearest
    let skips = hits > 0 && width > 0 && W.mode === 'Hitscan' ? Math.round(this.stat('Ricochet')) : 0, at0 = final;
    while (skips-- > 0) {
      let nx = null, nd = 750; for (const E of G.enemies) { if (E.dead || E.burrowed || ignore.has(E)) continue; const d = E.pos.distanceTo(at0); if (d < nd && G.phys.lineOfSight(at0, E.pos)) { nd = d; nx = E; } }
      if (!nx) break;
      const to = nx.pos.clone(); to.y += (nx.hitH || 100) * 0.1; G.fx.tracer(at0, to, color, 2, 0.08);
      this.dealDamage(nx, damage * 0.6, to, to.clone().sub(at0).normalize(), false, procCoef * 0.5, false, W.critBonus, W.burn, W.slow, 0); ignore.add(nx); at0 = to;
    }
  }
  fireChain(start, dir, damage, W) {
    const G = this.game, col = hexRGB(W.color);
    const wall = G.phys.raycast(start, dir, W.range);
    const wallD = wall ? wall.distance : W.range;
    let E = null, bestT = wallD;
    for (const C of G.enemies) { if (C.dead) continue; const t = G.rayEnemy(start, dir, bestT, C, 25); if (t !== null && t < bestT) { bestT = t; E = C; } }
    const at = start.clone().addScaledVector(dir, bestT);
    G.fx.arc(start, at, col);
    if (!E) { if (W.splash > 0) this.explodeAt(at, W.splash, damage * 0.6, 0.5, false, false, col, null); return; }
    const done = new Set([E]);
    this.dealDamage(E, damage, at, dir, at.y > E.headY(), 1, false, W.critBonus, W.burn, W.slow, W.moneyPerHit);
    if (W.splash > 0) this.explodeAt(at, W.splash, damage * 0.6, 0.5, false, false, col, E);
    let prev = E, dmg = damage;
    const links = W.chains + this.slot.tier;
    for (let c = 0; c < links; c++) {
      let best = null, bd = 750 * 750;
      for (const C of G.enemies) { if (C.dead || done.has(C)) continue; const d = C.pos.distanceToSquared(prev.pos); if (d < bd) { bd = d; best = C; } }
      if (!best) break;
      dmg *= 0.8;
      G.fx.arc(prev.pos, best.pos, col);
      done.add(best);
      this.dealDamage(best, dmg, best.pos, best.pos.clone().sub(prev.pos).normalize(), false, 0.5, false, W.critBonus, W.burn, W.slow, W.moneyPerHit);
      if (W.splash > 0) this.explodeAt(best.pos, W.splash, dmg * 0.5, 0.3, false, false, col, best);
      prev = best;
    }
  }
  fireProjectile(start, dir, damage, procCoef, W) {
    let kind = 'Orb', radius = 13;
    if (W.mode === 'Rocket') { kind = 'Rocket'; radius = 12; } else if (W.mode === 'Grenade') { kind = 'Grenade'; radius = 12; } else if (W.mode === 'Saw') { kind = 'Saw'; radius = 18; } else if (W.cls === 'Wonder') kind = 'Card';
    const o = { pos: start.clone(), vel: dir.clone().multiplyScalar(W.projSpeed), damage, splash: W.splash > 0 ? W.splash * (1 + this.stat('ExplosionRadius')) : 0,
      pierce: W.pierce + Math.round(this.stat('Pierce')), burn: W.burn, slow: W.slow, chains: W.chains, moneyPerHit: W.moneyPerHit, critBonus: W.critBonus, procCoef, life: 5, kind, radius, color: hexRGB(W.color) };
    if (kind === 'Grenade') Object.assign(o, { gravity: 1, bounces: 3, bounceDamp: 0.5, fuse: 1.4 }), o.vel.y += 260;
    else if (kind === 'Saw') Object.assign(o, { bounces: 5, bounceDamp: 1, life: 3 });
    this.game.projectiles.spawn(o);
  }
  damageMult(E) {
    let m = 1 + this.stat('Damage') + this.rage;
    const gl = Meta.gunLevel(this.W.name); if (gl >= 3) m += 0.1; if (gl >= 5) m += 0.1;
    if (!this.grounded) m += this.stat('AirDamage');
    if (this.swapBuffT > 0) m += 0.2;
    if (E && E.markT > 0) m += E.markAmt || 0;
    m += this.stat('SpeedDamage') * Math.max(0, this.vel.length() - 600) / 1000;
    if (this.sliding || this.slideDmgWindow > 0) m += this.stat('SlideDamage');
    if (this.health < this.maxHealth * 0.35) m += this.stat('LowHealthDamage');
    if (E) { if (E.elite) m += this.stat('EliteDamage'); if (E.isBoss) m += this.stat('BossDamage'); }
    // buffs that ask "who, where and when": the target's state, the range, and what shape you are in
    if (E && E.pos) {
      if (this.S.FullHealthDamage && E.health >= E.maxHealth * 0.9) m += this.S.FullHealthDamage;
      if (this.S.StatusDamage && (E.burnT > 0 || E.slowT > 0 || E.bleedT > 0)) m += this.S.StatusDamage;
      if (this.S.CloseDamage || this.S.FarDamage) { const d = E.pos.distanceTo(this.pos); if (d < 650) m += this.S.CloseDamage || 0; else if (d > 2000) m += this.S.FarDamage || 0; }
    }
    if (this.S.HealthyDamage && this.health >= this.maxHealth * 0.9) m += this.S.HealthyDamage;
    if (this.S.MoneyDamage) m += this.S.MoneyDamage * Math.min(20, this.money / 1000);
    if (this.S.StreakDamage) m += Math.min(0.6, this.S.StreakDamage * Math.min(10, this.streak || 0));   // a horde keeps a streak alive for free, so it has a ceiling
    if (this.S.HealthDamage) m += this.S.HealthDamage * Math.max(0, this.maxHealth - 150) / 25;
    if (this.S.StillDamage && this.aiming && Math.hypot(this.vel.x, this.vel.z) < 160) m += this.S.StillDamage;
    // Combination guard: every bonus above adds into one pool, and past +250% each further point counts half. Ten
    // conditional buffs that all happen to be true at once are strong, not a different game.
    if (m > 3.5) m = 3.5 + (m - 3.5) * 0.5;
    return Math.max(0.1, m);
  }
  dealDamage(E, base, at, dir, headshot, procCoef, fromProc, critBonus = 0, burn = 0, slow = 0, moneyPerHit = 0, numColor = WHITE) {
    if (!E || E.dead) return 0;
    const G = this.game;
    const mult = this.damageMult(E);
    let crit = !fromProc && Math.random() < Math.min(0.75, 0.05 + this.stat('CritChance') + (this.aiming ? this.stat('AdsCrit') : 0) + critBonus + (Meta.gunLevel(this.W.name) >= 4 ? 0.08 : 0) + (this.deadeyeT > 0 ? this.stat('DeadeyeCrit') : 0));
    if (!fromProc && this.headCritT > 0 && !this.meleeHitting) { crit = true; this.headCritT = 0; }
    if (!fromProc && this.goldRound && !this.meleeHitting) crit = true;   // Second Opinion: the shot after a headshot kill
    let weak = false;
    if (!fromProc && this.S.WeakPoint && (E.elite || E.isBoss)) { E.pryN = (E.pryN || 0) + 1; if (E.pryN % 5 === 0) { crit = true; weak = true; } }   // Pry Bar: every fifth hit finds the gap
    if (!fromProc) this.lastCrit = crit;
    let hollow = false;
    if (!fromProc && !this.meleeHitting) {
      if (this.S.HollowN) { this.hollowN = (this.hollowN || 0) + 1; if (this.hollowN % 5 === 0) hollow = true; }                       // Hollow Points: every fifth round mushrooms
      if (this.S.HeadStreak) { this.hsN = headshot ? Math.min(5, (this.hsN || 0) + 1) : 0; if (this.hsN >= 2) G.hud.floater(at.clone().add(V3(0, 40, 0)), `HEADS x${this.hsN}`, [1, 0.9, 0.4], 0.8); }   // Marksman's Monocle
      if (crit && this.S.CritFlash && G.time > (this.cfT || 0)) {                                                                      // Lens Shard: a crit goes off like a flashbulb
        this.cfT = G.time + 2; G.fx.flash(E.pos, [1, 1, 0.8], 300, 0.22, true); G.fx.ring(E.feet(), 420, [1, 1, 0.8], 0.3);
        for (const K of G.enemies) if (!K.dead && K !== E && K.pos.distanceTo(E.pos) < 420) this.stun(K, 0.5 + 0.15 * this.S.CritFlash);
      }
    }
    const fresh = E.health >= E.maxHealth * 0.9;
    let dmg = base * mult;
    if (crit) dmg *= 2 + this.stat('CritDamage');
    const head = headshot && !fromProc;
    if (head) dmg *= 1.75 + this.stat('HeadshotDamage');
    if (this.hsN > 0 && this.S.HeadStreak && !fromProc) dmg *= 1 + this.hsN * this.S.HeadStreak;
    if (this.buildRank && this.buildRank.Ember > 2 && E.burnT > 0) dmg *= 1.3;
    if (this.goldRound && !fromProc && !this.meleeHitting) { this.goldRound = false; dmg *= 2; G.fx.flash(at, [1, 0.85, 0.3], 220, 0.2, true); G.hud.floater(at.clone().add(V3(0, 40, 0)), 'GOLDEN ROUND', [1, 0.85, 0.3], 1); }
    if (hollow) { dmg *= 1 + this.S.HollowN; G.fx.flash(at, [1, 0.8, 0.3], 150, 0.16, true); G.fx.sparks(at, dir ? dir.clone().negate() : V3(0, 1, 0), [1, 0.85, 0.4], 10); if (!E.isBoss && dir) E.launch(V3(dir.x * 620, 260, dir.z * 620)); G.hud.floater(at.clone().add(V3(0, 30, 0)), 'HOLLOW POINT', [1, 0.8, 0.3], 0.8); }
    if (G.instaKill > 0 && !E.isBoss) dmg = Math.max(dmg, E.health + E.shield + 1);
    if (head && !E.isBoss && this.S.HeadExecute && E.health < E.maxHealth * this.S.HeadExecute) dmg = Math.max(dmg, E.health + E.shield + 1);   // Killshot
    const dealt = E.takeHit(dmg, at, dir || V3(0, 0, 0), head);
    if (dealt <= 0) return 0;
    if (!fromProc && this.procDepth < 1) buildHit(this, E, at, dealt, crit, head);
    const killed = E.dead;
    // bullets shove what they hit: a stumble back in proportion to the damage, and a short freeze on a kill
    if (!fromProc && dir && !E.isBoss && !E.remote && !killed && E.ai !== 'Flyer') {
      const push = Math.min(420, 90 + (dealt / Math.max(1, E.maxHealth)) * 900) * (E.ai === 'Brute' ? 0.3 : 1);
      E.vel.x += dir.x * push; E.vel.z += dir.z * push; E.staggerT = Math.max(E.staggerT || 0, Math.min(0.3, 0.08 + dealt / Math.max(1, E.maxHealth) * 0.5));
    }
    if (!fromProc) {
      if (weak) { G.hud.floater(at.clone().add(V3(0, 55, 0)), 'WEAK POINT', [1, 0.85, 0.2], 1.1); G.fx.sparks(at, dir ? dir.clone().negate() : UP, [1, 0.85, 0.3], 8); }
      if (fresh && !killed && this.S.OpenerStun && !E.isBoss) { this.stun(E, this.S.OpenerStun); G.fx.sparks(at, dir ? dir.clone().negate() : UP, [0.9, 0.9, 1], 5); G.audio.playAt('S_HitWall', at, 0.5, 0.8, 0.1); }   // Crowbar
      if (!killed && !this.meleeHitting && this.S.PointBlank && !E.isBoss && dir && G.time - (E.pbAt || -9) > 0.35 && E.pos.distanceTo(this.pos) < 420) {   // Focus Lens: a muzzle in the ribs
        E.pbAt = G.time; E.applyKnock(safeN2(dir).multiplyScalar(760).add(V3(0, 330, 0))); this.stun(E, 0.4);
        G.fx.puff(at, [1, 0.9, 0.7], 70, 0.25, dir.clone().multiplyScalar(300)); G.fx.flash(at, [1, 0.85, 0.5], 46, 0.1, false); this.addShake(0.25);
      }
      if (!killed && this.S.LowBurn && this.health < this.maxHealth * 0.35) E.applyBurn(dealt * this.S.LowBurn, 3);                // Adrenal Gland
      if (!killed && !this.meleeHitting && this.hotBarrel > 0) E.applyBurn(dealt * this.hotBarrel, 3);                              // Overclock
      if (head && killed && this.S.HeadPop && this.procDepth < 1) {                                                                  // Headhunter Scope
        this.procDepth++;
        const hp = E.pos.clone(); hp.y = E.headY() + 10;
        G.fx.gibs(hp, hexRGB(0x8a2a22), 0.5, 6);
        this.explodeAt(hp, 250, base * (1.75 + this.stat('HeadshotDamage')) * this.S.HeadPop, 0, true, false, lin(1, 0.3, 0.22), E);
        this.procDepth--;
      }
    }
    this.hitMarker = 0.18; this.hitKill = killed; this.hitHead = head; this.hitScale = killed ? 1.6 : head || crit ? 1.25 : 1;
    if (!fromProc || procCoef > 0.3) {
      const heavy = head || crit || killed || base > 80;
      if (!killed) G.fx.fleshHit(at, dir || V3(0, 1, 0), clamp(E.bodyScale, 0.7, 2), heavy);
      if (head) this.play('S_Headshot', 0.75, 1, 0.06); else if (crit) this.play('S_Crit', 0.55, 1, 0.06);
      G.audio.playAt(Math.random() < 0.5 ? 'S_HitFlesh' : 'S_HitFlesh2', at, 0.8, 1, 0.12);
      this.play('S_HitMarker', 0.35, killed ? 0.8 : 1, 0.04);
    }
    let c = numColor;
    if (fromProc && numColor === WHITE) c = [0.75, 0.55, 1];
    if (crit) c = [1, 0.85, 0.2];
    if (head) c = [1, 0.3, 0.25];
    G.hud.floater(at.clone().add(V3(Math.random() * 30 - 15, Math.random() * 30 - 15, Math.random() * 30 - 15)), `${Math.round(dealt)}${crit ? '!' : ''}`, c, crit || head ? 1.3 : 0.95);
    if (!fromProc && !killed) this.addMoney(Math.max(1, Math.round(10 * Math.min(1, procCoef * 1.5))) + moneyPerHit, true);
    if (crit && this.S.CritHeal) this.combatHeal(this.S.CritHeal);
    if (!killed && E.elite && !E.isBoss && this.S.EliteExecute && E.health < E.maxHealth * Math.min(0.3, this.S.EliteExecute)) { G.hud.floater(E.pos.clone().add(V3(0, 60, 0)), 'CULLED', [1, 0.2, 0.25], 1.2); E.kill(this, false); }
    const steal = this.stat('Lifesteal');
    if (steal > 0) this.combatHeal(dealt * steal);
    if (head && !killed && this.stat('HeadMark') > 0) { E.markT = 5; E.markAmt = this.stat('HeadMark'); }
    if (!killed) {
      if (burn > 0) E.applyBurn(burn * mult * Math.max(1, this.flatScale()), 3);
      if (slow > 0) E.applySlow(slow, 2);
      const knock = this.stat('Knockback');
      if (knock > 0 && dir && dir.lengthSq() > 0) E.applyKnock(safeN2(dir).multiplyScalar(400 * knock).add(V3(0, 100 * knock, 0)));
    }
    if (!fromProc) {
      this.runProcs('OnHit', E, at, dealt, procCoef);
      if (crit) this.runProcs('OnCrit', E, at, dealt, procCoef);
      if (head) this.runProcs('OnHeadshot', E, at, dealt, procCoef);
    }
    return dealt;
  }
  handleProjectileHit(P, E, at) {
    const head = !P.fromProc && at.y > E.headY();
    this.dealDamage(E, P.damage, at, P.vel.clone().normalize(), head, P.procCoef, P.fromProc, P.critBonus, P.burn, P.slow, P.moneyPerHit, P.fromProc ? [0.75, 0.55, 1] : WHITE);
    if (P.chains > 0) {
      let prev = E; const done = new Set([E]);
      for (let c = 0; c < P.chains; c++) {
        const next = this.findNearestEnemy(prev.pos, 700, prev);
        if (!next || done.has(next)) break;
        done.add(next);
        this.game.fx.arc(prev.pos, next.pos, P.color);
        this.dealDamage(next, P.damage * 0.7, next.pos, V3(0, 0, 0), false, 0.3, true);
        prev = next;
      }
    }
  }
  explodeAt(at, radius, damage, procCoef, fromProc, selfKnock, color, ignore) {
    this.game.quest.blast(at, radius);
    const G = this.game;
    G.fx.explosion(at, radius, color);
    G.audio.playAt('S_Explosion', at, clamp(radius / 300, 0.5, 1.2), 1, 0.1);
    const d = at.distanceTo(this.pos);
    this.addShake(clamp(1 - d / (radius * 4 + 400), 0, 1) * clamp(radius / 250, 0.3, 1.2));
    const skip = ignore instanceof Set ? ignore : null;
    const hits = G.enemies.filter((E) => E !== ignore && !(skip && skip.has(E)) && !E.dead && E.pos.distanceTo(at) < radius + 40 * E.bodyScale);
    for (const E of hits) {
      const fall = 1 - 0.5 * clamp(E.pos.distanceTo(at) / Math.max(1, radius), 0, 1);
      E.lastHitExplosive = true;
      if (this.S.BlastBurn && !E.dead) E.applyBurn(damage * this.S.BlastBurn, 3);
      this.dealDamage(E, damage * fall, E.pos, E.pos.clone().sub(at).normalize(), false, procCoef * 0.5, fromProc, 0, 0, 0, 0, fromProc ? [1, 0.6, 0.3] : WHITE);
      if (!E.dead) E.applyKnock(safeN2(E.pos.clone().sub(at)).multiplyScalar(250).add(V3(0, 250, 0)));
    }
    if (selfKnock) {
      const to = this.pos.clone().sub(at);
      if (to.length() < radius * 1.1) {
        const s = 1 - clamp(to.length() / (radius * 1.1), 0, 1);
        this.launch(to.normalize().multiplyScalar(1300 * s).add(V3(0, 700 * s, 0)), false, false);
      }
    }
  }
  findNearestEnemy(from, radius, exclude) {
    let best = null, bd = radius * radius;
    for (const E of this.game.enemies) { if (E === exclude || E.dead || E.emerging) continue; const d = E.pos.distanceToSquared(from); if (d < bd) { bd = d; best = E; } }
    return best;
  }
  onEnemyKilled(E, headshot) {
    const G = this.game;
    this.kills++; if (headshot) this.headshots++;
    Meta.bump('kills'); if (headshot) Meta.bump('headshots'); if (E.elite) Meta.bump('eliteKills'); if (!this.grounded) Meta.bump('airKills');
    Meta.addGunKill(this.W.name);
    const pay = E.money + (headshot ? Math.round(38 * Math.min(1, payScale(G.round))) : 0);   // the bonus shrinks with kill pay as the horde grows
    this.addMoney(pay, true);
    this.killPulse = 1;
    this.play('S_Kill', 0.6, 1, 0.08);
    G.fx.coins(E.pos, clamp(Math.floor(pay / 40), 1, 8));
    if (E.isBoss) this.addShake(1.5);
    G.hud.floater(E.pos.clone().add(V3(0, 80, 0)), `+$${cash(pay)}`, [1, 0.85, 0.25], headshot ? 1.2 : 1);
    const S = this.slot;
    if (S.def >= 0 && this.stat('KillReload') > 0) S.ammo = Math.min(this.magSize(S), S.ammo + Math.round(this.stat('KillReload')));
    if (this.deadeyeT > 0 && (this.deadeyeExt || 0) < 4) { const e = Math.min(this.stat('DeadeyeExtend'), 4 - (this.deadeyeExt || 0)); this.deadeyeT += e; this.deadeyeExt = (this.deadeyeExt || 0) + e; }   // kills stretch Deadeye, 4 seconds at most
    if (this.meleeHitting) { if (this.cls.id === 'brawler') this.combatHeal(3); if (this.stat('MeleeAbilityReset') > 0 && !this.inRush) this.abilityCd = Math.max(0, this.abilityCd - 1); }
    if (this.procDepth < 1 && this.stat('Shrapnel') > 0 && !E.lastHitExplosive && S.def >= 0) { this.procDepth++; this.explodeAt(E.pos, 260, DATA.weapons[S.def].dmg * DATA.weapons[S.def].pellets * (1 + 0.2 * S.tier) * this.stat('Shrapnel'), 0, true, false, [0.8, 0.8, 0.85], E); this.procDepth--; }
    if (this.procDepth < 1 && E.lastHitExplosive && this.stat('BlastChain') > 0) { this.procDepth++; this.explodeAt(E.pos, 300, this.power() * 1.2 * this.stat('BlastChain') * 2, 0, true, false, [1, 0.6, 0.25], E); this.procDepth--; }
    this.streak = (this.streakT > 0 ? (this.streak || 0) : 0) + 1; this.streakT = 3;
    { const t = G.time; this.multiT = (this.multiT || []).filter((x) => t - x < 1.2); this.multiT.push(t); }
    if (headshot && this.S.HeadCrit) this.headCritT = 3;
    buildKill(this, E);
    if (this.S.EliteBlast && E.elite && this.procDepth < 1) { this.procDepth++; this.explodeAt(E.pos, 440, this.power() * 2 * this.S.EliteBlast, 0, true, false, [1, 0.5, 0.2], E); this.procDepth--; }   // Rusty Shiv: an elite goes up when it goes down
    if (this.S.KillRush) { this.krN = Math.min(5, (this.krT > 0 ? this.krN || 0 : 0) + 1); this.krT = 5; }           // Energy Drink
    if (this.S.KillTempo) { this.ktN = Math.min(6, (this.ktT > 0 ? this.ktN || 0 : 0) + 1); this.ktT = 2; }        // Fanning Practice
    if (this.S.AirKillJump && !this.grounded && this.airJumps <= this.maxAirJumps()) {   // Featherweight: a kill in the air is a foothold
      this.airJumps++; const feet = V3(this.pos.x, this.pos.y - 88, this.pos.z);
      G.fx.ring(feet, 70, [0.8, 1, 0.85], 0.22); this.play('S_AirJump', 0.4, 1.5, 0.04);
    }
    if (this.S.GoldKill && !E.isBoss && Math.random() < this.S.GoldKill) {                // Midas Touch: now and then one turns to gold
      const bonus = Math.max(20, E.money * 4);
      this.addMoney(bonus, true); G.fx.coins(E.pos, 8); G.fx.flash(E.pos, lin(1, 0.82, 0.25), 90, 0.22, true); G.fx.ring(V3(E.pos.x, E.pos.y - 60, E.pos.z), 160, lin(1, 0.82, 0.25), 0.3);
      G.hud.floater(E.pos.clone().add(V3(0, 120, 0)), `GOLD  +$${cash(bonus)}`, [1, 0.85, 0.25], 1.4); this.play('S_Cash', 0.7, 1.2, 0.05);
    }
    if (this.S.KillHealth && (this.killHP || 0) < 60 * this.S.KillHealth) { this.killHPc = (this.killHPc || 0) + 1; if (this.killHPc >= 8) { this.killHPc = 0; this.killHP = (this.killHP || 0) + 1; this.recompute(); this.health = Math.min(this.maxHealth, this.health + 1); } }
    if (this.procDepth < 2) {
      if (this.multiT.length >= 3) { this.multiT.length = 0; this.runProcs('OnMultiKill', E, E.pos, 0, 1); }
      this.runProcs('OnKill', E, E.pos, 0, 1);
      if (E.elite || E.isBoss) this.runProcs('OnEliteKill', E, E.pos, 0, 1);
    }
  }
  runProcs(trigger, target, at, base, procCoef) {
    if (this.dead || this.procDepth > 2) return;
    const hitT = trigger === 'OnHit' || trigger === 'OnCrit' || trigger === 'OnHeadshot';
    const cm = 1 + this.stat('ProcChance');
    for (const [i, stk] of this.eff) {
      const U = DATA.upgrades[i];
      if (U.trigger !== trigger || !U.fx) continue;
      if (this.procCd[i] > 0) continue;
      if (this.procDepth > 0 && PROC_DAMAGE.includes(U.fx)) continue;   // a kill made by a buff never sets off another damaging buff: no chains through a crowd
      let ch = U.chance * cm;
      if (hitT) ch *= procCoef;
      if (U.chance < 1 && Math.random() >= ch) continue;
      if (U.cd > 0) this.procCd[i] = U.cd;
      this.executeProc(U, stk, target, at, hitT ? base : this.power(), trigger);
    }
  }
  tickProcs(dt) {
    for (let i = 0; i < this.procCd.length; i++) this.procCd[i] = Math.max(0, this.procCd[i] - dt);
    if (this.game.phase !== 'Round') return;
    for (const [i, stk] of this.eff) {
      const U = DATA.upgrades[i];
      if (U.trigger !== 'Periodic') continue;
      this.periodic[i] -= dt;
      if (this.periodic[i] > 0) continue;
      this.periodic[i] = Math.max(0.2, U.cd);
      const near = this.findNearestEnemy(this.pos, 1200, null);
      if (['Chain', 'Freeze', 'Explode'].includes(U.fx) && !near) continue;
      this.executeProc(U, stk, near, near ? near.pos : this.pos, this.power(), 'Periodic');
    }
  }
  executeProc(U, stacks, target, at, base, trigger) {
    const G = this.game;
    this.procDepth++;
    const N = Math.max(1, stacks), mag = U.mag * N;
    const selfC = !['OnHit', 'OnCrit', 'OnHeadshot', 'OnKill', 'OnEliteKill', 'OnMultiKill', 'Periodic'].includes(trigger);
    const Me = this.pos;
    const alive = target && !target.dead;
    const near = (c, r, skip) => G.enemies.filter((E) => E !== skip && !E.dead && !E.emerging && E.pos.distanceTo(c) < r);
    switch (U.fx) {
      case 'Explode': {
        const p = selfC ? Me.clone().add(V3(0, -40, 0)) : target ? target.pos.clone() : at.clone();
        this.explodeAt(p, 230 * (1 + this.stat('ExplosionRadius')), mag * base, 0, true, false, lin(1, 0.55, 0.15), null);
        break;
      }
      case 'Chain': {
        let from = target ? target.pos.clone() : Me.clone();
        const done = new Set(target ? [target] : []);
        const cc = lin(0.5, 0.8, 1);
        if (!target || trigger === 'Periodic') {
          from = Me.clone().add(V3(0, 60, 0));
          if (target) { G.fx.arc(from, target.pos, cc); this.dealDamage(target, mag * base, target.pos, V3(0, 0, 0), false, 0, true, 0, 0, 0, 0, lin(0.55, 0.8, 1)); from = target.pos.clone(); }
        }
        for (let c = 0; c < 3; c++) {
          let best = null, bd = 700 * 700;
          for (const E of near(from, 700, null)) { if (done.has(E)) continue; const d = E.pos.distanceToSquared(from); if (d < bd) { bd = d; best = E; } }
          if (!best) break;
          G.fx.arc(from, best.pos, cc);
          this.dealDamage(best, mag * base, best.pos, V3(0, 0, 0), false, 0, true, 0, 0, 0, 0, lin(0.55, 0.8, 1));
          done.add(best); from = best.pos.clone();
        }
        G.audio.playAt('S_Chain', from, 0.5);
        break;
      }
      case 'Ignite':
        if (alive && !selfC) target.applyBurn(mag * base, 3);
        else { const c = selfC ? Me : at; for (const E of near(c, 380, target)) E.applyBurn(mag * base, 3); G.fx.ring(c.clone().add(V3(0, -60, 0)), 380, lin(1, 0.4, 0.05), 0.3); }
        break;
      case 'Freeze': {
        const s = Math.min(U.mag + 0.1 * (N - 1), 0.85);
        if (alive && !selfC && trigger !== 'Periodic') { target.applySlow(s, 2.5); G.fx.flash(target.pos, lin(0.6, 0.9, 1), 40, 0.2, false); }
        else { for (const E of near(Me, 550, null)) E.applySlow(s, 2.5); G.fx.ring(Me.clone().add(V3(0, -80, 0)), 550, lin(0.6, 0.9, 1), 0.4); }
        break;
      }
      case 'Heal': this.combatHeal(mag); break;
      case 'Money': this.addMoney(Math.round(mag * (trigger === 'OnKill' ? Math.min(1, payScale(G.round)) : 1)), true); break;
      case 'Shield': { let a = mag; if (trigger === 'OnKill') { a = Math.min(a, this.shieldBucket || 0); this.shieldBucket = (this.shieldBucket || 0) - a; } this.overshield = Math.min(this.shieldCap(), this.overshield + a); break; }   // kill shields share a 6-a-second budget, like kill heals
      case 'Missile': {
        const from = Me.clone().add(V3(0, 90, 0));
        const aimE = alive ? target : this.findNearestEnemy(at, 2500, null);
        const dir = aimE ? aimE.pos.clone().sub(from).normalize().add(V3(0, 0.8, 0)) : V3(0, 1, 0);
        const knife = /Dagger/.test(U.name);   // a thrown blade is a blade, not a rocket
        G.projectiles.spawn({ pos: from, vel: dir.normalize().multiplyScalar(knife ? 1900 : 1500), damage: mag * base, splash: knife ? 0 : 140, fromProc: true, procCoef: 0, target: aimE, homing: knife ? 9 : 6, life: 4, kind: knife ? 'Dagger' : 'Missile', color: knife ? lin(0.6, 0.9, 1) : lin(1, 0.5, 0.2), radius: 10 });
        G.audio.playAt(knife ? 'S_Dash' : 'S_Launcher', from, knife ? 0.6 : 0.35, 1.5);
        break;
      }
      case 'RefundAmmo': { const S = this.slot; if (S.def >= 0) S.ammo = Math.min(this.magSize(S), S.ammo + Math.max(1, Math.ceil(mag * this.magSize(S)))); break; }
      case 'ResetDash': this.dashCharges = Math.min(this.maxDash(), this.dashCharges + Math.max(1, Math.round(mag))); break;
      case 'Nova': {
        const R = 420 * (1 + this.stat('ExplosionRadius') * 0.5);
        G.fx.ring(Me.clone().add(V3(0, -70, 0)), R, lin(1, 0.9, 0.5), 0.3);
        for (const E of near(Me, R, null)) this.dealDamage(E, mag * base, E.pos, E.pos.clone().sub(Me).normalize(), false, 0, true, 0, 0, 0, 0, lin(1, 0.9, 0.5));
        break;
      }
      case 'Haste': this.haste = Math.max(this.haste, mag); this.hasteT = 4; break;
      case 'Rage': this.rage = Math.max(this.rage, mag); this.rageT = Math.max(this.rageT, trigger === 'OnWallRun' ? 1 : 4); break;
      case 'Execute': {
        const th = Math.min(U.mag * (1 + 0.25 * (N - 1)), 0.5);
        if (alive && !target.isBoss && target.healthFrac() < th) {
          G.fx.flash(target.pos, lin(0.9, 0.1, 0.2), 70, 0.25, false);
          G.hud.floater(target.pos.clone().add(V3(0, 60, 0)), 'EXECUTED', [1, 0.2, 0.25], 1.2);
          target.kill(this, false);
        }
        break;
      }
      case 'Bleed': if (alive) target.applyBleed(mag * base); break;
      case 'Clover': this.addLuck(1); break;
      case 'Cooldown': this.abilityCd = Math.max(0, this.abilityCd - mag); break;
      case 'Invuln': this.invuln = Math.max(this.invuln, U.mag); G.fx.flash(Me, lin(0.8, 0.9, 1), 120, 0.3, true); break;
      case 'Shockwave': {
        G.fx.ring(Me.clone().add(V3(0, -70, 0)), 450, lin(0.9, 0.9, 1), 0.35);
        for (const E of near(Me, 450, null)) {
          const away = safeN2(E.pos.clone().sub(Me));
          this.dealDamage(E, mag * base, E.pos, away, false, 0, true, 0, 0, 0, 0, lin(0.9, 0.9, 1));
          if (!E.dead) E.applyKnock(away.multiplyScalar(900).add(V3(0, 420, 0)));
        }
        break;
      }
      case 'Skip': {   // Deadeye Glass: the round glances off a skull and finds the next one
        if (!target) break;
        const nx = this.findNearestEnemy(target.pos, 800, target);
        if (!nx || nx.burrowed) break;
        const to = nx.pos.clone(); to.y = nx.headY() + 8;
        G.fx.tracer(at, to, [1, 0.9, 0.6], 4, 0.12); G.fx.sparks(at, UP, [1, 0.9, 0.6], 4); G.fx.flash(to, [1, 0.5, 0.35], 36, 0.12, false);
        G.audio.playAt('S_Ricochet', at, 0.7, 1.2, 0.1);
        this.dealDamage(nx, mag * base, to, to.clone().sub(at).normalize(), false, 0, true, 0, 0, 0, 0, [1, 0.3, 0.25]);
        break;
      }
      case 'Stagger':   // Heavy Barrel: the hit takes them off their feet
        if (alive && !target.isBoss) { this.stun(target, U.mag); G.fx.sparks(at, UP, [1, 0.9, 0.6], 5); G.fx.puff(at, [0.9, 0.85, 0.75], 50, 0.25); G.audio.playAt('S_HitWall', at, 0.5, 0.7, 0.1); }
        break;
      default: break;
    }
    this.procDepth--;
  }

  // ------------------------------------------------------------------ interaction & casino
  updateFocus() {
    const G = this.game;
    if (this.inMenu()) {
      const S = this.menuStation, M = this.menu;
      const spinning = (M.type === 'Slots' || M.type === 'Roulette') ? M.stage === 1 : (M.type === 'MoneyTable' && M.stage === 2);
      if (M.type === 'Chest') { /* you paid for it: it waits for your choice */ }
      else if (!S || (!spinning && Math.hypot(S.pos.x - this.pos.x, S.pos.z - this.pos.z) > S.useRadius + 220) || !G.isCasinoOpen()) this.closeMenu();
      this.focus = S;
      return;
    }
    let best = null, bd = 1e9;
    for (const I of G.interactables.concat(G.quest.objs, G.mech.objs)) {
      if (!I.isUsable()) continue;
      const loc = I.type === 'Door' ? I.box3.getCenter(new THREE.Vector3()) : I.pos;
      if (Math.abs(loc.y - this.pos.y) > 320) continue;
      const d = Math.hypot(loc.x - this.pos.x, loc.z - this.pos.z);
      if (d < I.useRadius && d < bd) { bd = d; best = I; }
    }
    this.focus = best;
    // counters with wares: whichever item the crosshair is on (or nearest to) is the one E buys
    this.focusWare = null;
    if (best && best.wares && best.wares.length) {
      const e = G.camera.getWorldPosition(new THREE.Vector3()), f = G.camera.getWorldDirection(new THREE.Vector3()), v = new THREE.Vector3();
      let bw = null, bdot = 0.955;
      for (const w of best.wares) { v.copy(w.pos).sub(e); const d = v.length(); if (d > 420) continue; const dot = v.dot(f) / d; if (dot > bdot) { bdot = dot; bw = w; } }
      this.focusWare = bw;
    }
  }
  interact() {
    if (this.dead) return;
    if (this.inMenu()) { this.menuConfirm(); return; }
    const I = this.focus, G = this.game;
    if (!I || !I.isUsable()) return;
    switch (I.type) {
      case 'Quest': I.q.use(this); break;
      case 'Door': if (this.spend(I.cost)) { G.openDoor(I); G.audio.playAt('S_Door', I.pos, 1); } break;
      case 'WallBuy':
        if (this.hasWeapon(I.weapon)) {
          if (this.spend(Math.floor(I.cost / 2))) { for (const S of this.weapons) if (S.def === I.weapon) { S.ammo = this.magSize(S); S.reserve = this.reserveSize(S); } this.toast('Ammo refilled', '#cce6ff'); }
        } else if (this.spend(I.cost)) { this.giveWeapon(I.weapon); const W = DATA.weapons[I.weapon]; this.toast(`Bought ${W.name}`, RARITY_HEX[W.rarity]); }
        break;
      case 'AmmoCrate': if (this.spend(I.cost)) { this.refillAll(); this.toast('All ammo refilled', '#cce6ff'); } break;
      case 'ExitBell': G.ringBell(); break;
      // the casino has no menus: every station is played or bought from in the world
      case 'ArmsRoulette': I.wheelUse(this); break;
      case 'Slots': I.slotUse(this); break;
      case 'Chest': this.openChest(I); break;
      case 'MysteryBox': I.boxUse(this); break;
      case 'HighRoller': this.benchUpgrade(); break;
      case 'Turret': I.bind(this); break;
      default: this.openMenu(I); break;
    }
  }
  openMenu(I) {
    const map = { Slots: 'Slots', ArmsRoulette: 'Roulette', MoneyTable: 'MoneyTable', UpgradeCounter: 'Pawn', StatBooth: 'Tonic', HighRoller: 'Vault' };
    if (!map[I.type]) return;
    this.menu = { type: map[I.type], stage: 0, offers: map[I.type] === 'Pawn' ? this.pawnOffers : [], reels: [0, 0, 0], rarity: 0, timer: 0, spinLen: 0, result: '', resultColor: '#fff', pending: -1, stake: 0, bet: 0, pocket: 0, page: 0, reroll: false };
    this.menuStation = I; this.menuHelp = false;
    this.fireHeld = false; this.aiming = false;
    if (this.sliding) this.endSlide();
    this.play('S_UISelect', 0.6);
  }
  closeMenu() {
    const M = this.menu;
    if (M) {
      if (false) this.tableResolve();
      if (M.type === 'Chest') { if (M.offers.length) { this.chestTake(0); return; } }
      else if (M.type === 'Slots' && M.stage >= 1 && M.stage <= 2) { if (M.stage === 1) this.slotsResolve(); if (M.offers.length && M.offers[0] >= 0) this.addUpgrade(M.offers[0]); }
    }
    this.menu = null; this.menuStation = null;
  }
  handleChoice(i) {
    if (this.dead) return;
    if (!this.inMenu()) { if (i < this.maxSlots) this.switchTo(i); else if (i === 3) this.setWield(!this.wield); return; }
    const M = this.menu;
    switch (M.type) {
      case 'Slots':
        if (M.stage === 2 && M.offers[i] >= 0 && i < M.offers.length) {
          const U = DATA.upgrades[M.offers[i]];
          this.addUpgrade(M.offers[i]); this.play('S_Upgrade', 0.8);
          M.result = `Took ${U.name}`; M.resultColor = RARITY_HEX[U.rarity];
          M.offers = []; M.stage = 0;
        }
        break;
      case 'Roulette':
        if (M.stage === 2 && i === 0 && M.pending >= 0) {
          const W = wdef(M.pending);
          this.giveWeapon(M.pending);
          M.pending = -1; M.stage = 0;
          this.toast(`Took ${W.name}`, RARITY_HEX[W.rarity]); this.closeMenu(); return;
        }
        break;
      case 'MoneyTable':
        if (M.stage === 0) {
          const stake = [500, Math.floor(this.money / 4), Math.floor(this.money / 2), this.money][i];
          if (stake <= 0 || !this.spend(stake)) { this.play('S_Deny', 0.6); return; }
          M.stake = stake; M.result = ''; M.reroll = false;
          M.hand = [this.bjCard(), this.bjCard()]; M.dealer = [this.bjCard(), this.bjCard()];
          this.play('S_UISelect', 0.7);
          if (this.bjTotal(M.hand) === 21) this.bjFinish(); else M.stage = 1;
        } else if (M.stage === 1) {
          if (i === 0 || i === 2) {
            if (i === 2) { if (M.hand.length !== 2 || !this.spend(M.stake)) { this.play('S_Deny', 0.6); return; } M.stake *= 2; }
            let c = this.bjCard();
            if (this.bjTotal(M.hand.concat([c])) > 21 && Math.random() < luckRerollChance(this.luck)) { c = this.bjCard(); M.reroll = true; }   // luck swaps a busting card once
            M.hand.push(c); this.play('S_UIMove', 0.7);
            if (this.bjTotal(M.hand) >= 21 || i === 2) this.bjFinish();
          } else if (i === 1) this.bjFinish();
        }
        break;
      case 'Pawn':
        if (isMelee(M.offers[i])) { const W = MELEE[M.offers[i] - MELEE_CODE]; if (this.spend(Math.round(MELEE_PRICE[W.rarity] * this.priceMult()))) { this.giveWeapon(M.offers[i]); this.toast(`Melee: ${W.name}`, RARITY_HEX[W.rarity]); this.play('S_Buy', 0.8); M.offers[i] = -1; } break; }
        if (M.offers[i] >= 0 && i < M.offers.length) {
          const U = DATA.upgrades[M.offers[i]];
          if (this.spend(Math.round(rarityPrice(rarityIndex(U.rarity)) * this.priceMult()))) { this.addUpgrade(M.offers[i]); this.play('S_Upgrade', 0.8); M.offers[i] = -1; }
        }
        break;
      case 'Tonic': this.buyTonic(M.page * 4 + i); break;
      case 'Vault': if (i === 0) this.vaultUpgrade(false); else if (i === 1) this.vaultUpgrade(true); break;
      case 'Chest':
        if (i === 3) { if (this.banishes > 0) { M.banish = !M.banish; this.play('S_UIMove', 0.6); } else this.play('S_Deny', 0.4); }
        else if (!(M.offers[i] >= 0)) break;
        else if (M.banish) {   // strike this one from every chest for the rest of the run and draw another in its place
          this.banned.add(M.offers[i]); this.banishes--; M.banish = false;
          const keep = M.offers.filter((_, k) => k !== i), fresh = this.chestOffers(M.tier, keep);
          M.offers = fresh.length > keep.length ? [...keep.slice(0, i), fresh[fresh.length - 1], ...keep.slice(i)] : keep;
          this.play('S_Switch', 0.8, 0.8);
        } else this.chestTake(i);
        break;
      default: break;
    }
  }
  menuConfirm() {
    const M = this.menu;
    switch (M.type) {
      case 'Slots': if (M.stage === 0) this.slotsPull(); else if (M.stage === 1) this.slotsStop(); break;
      case 'Roulette':   // E spins, the wheel stops on its own, E again claims what it landed on
        if (M.lock > 0) break;
        if (M.stage === 0) this.rouletteSpin(); else if (M.stage === 2) this.handleChoice(0);
        break;
      case 'MoneyTable': if (M.stage === 3) { M.stage = 0; M.result = ''; } break;
      case 'Pawn': { const cost = Math.round(400 * (1 + this.pawnRerolls) * this.priceMult()); if (this.spend(cost)) { this.pawnRerolls++; this.rollPawn(); M.offers = this.pawnOffers; } break; }
      case 'Tonic': M.page = 1 - M.page; this.play('S_UIMove', 0.6); break;
      case 'Vault': this.vaultUpgrade(false); break;
      default: break;
    }
  }
  tickMenu(dt) {
    const M = this.menu;
    if (M && M.lock > 0) M.lock -= dt;
    if (M && M.type === 'Roulette' && M.stage === 1) {
      // the wheel: spins freely until you brake (or it times out), then coasts to a stop
      M.ang += M.spd * dt;
      if (M.spinLen - M.timer >= M.free) M.brake = true;
      if (M.brake) { M.spd -= dt * 5.5; if (M.spd <= 0.12) { this.rouletteResolve(); return; } }
      const seg = Math.floor(M.ang / (Math.PI * 2 / M.wheel.length));
      if (seg !== M.lastSeg) { M.lastSeg = seg; this.play('S_SlotTick', 0.4, 1, 0.05); }
      M.timer = Math.max(0.01, M.timer - dt);
      return;
    }
    if (!M || M.timer <= 0) return;
    M.timer -= dt;
    if (M.timer > 0) {
      this.menuTick -= dt;
      if (this.menuTick <= 0 && M.stage >= 1) { this.menuTick = 0.06 + (0.22 - 0.06) * (1 - clamp(M.timer / Math.max(M.spinLen, 0.1), 0, 1)); this.play('S_SlotTick', 0.45, 1, 0.05); }
      return;
    }
    M.timer = 0;
    if (M.type === 'Slots' && M.stage === 1) { while (M.stage === 1 && M.skill && M.skill.stopped < 3) this.slotsStop(); }
    else if (M.type === 'Roulette' && M.stage === 1) this.rouletteResolve();
    else if (M.type === 'MoneyTable' && M.stage === 2) this.tableResolve();
  }
  // Slots is a stop-the-reels game: each reel runs its strip at its own speed and you stop them left to right.
  // What lines up decides the rarity of the three upgrades offered. Luck slows the reels.
  slotsPull() {
    if (!this.spend(this.slotPrice())) return;
    const M = this.menu;
    this.slotPulls++;
    this.play('S_SlotPull', 0.8);
    M.stage = 1; M.timer = M.spinLen = 9; M.result = ''; M.reroll = false; M.reels = [0, 0, 0];
    M.skill = { t0: this.game.time, off: [randInt(0, 15), randInt(0, 15), randInt(0, 15)], stopped: 0, pos: [0, 0, 0] };
  }
  slotReel(i) {
    const M = this.menu, K = M.skill;
    if (!K) return { sym: M.reels[i], next: M.reels[i], frac: 0, spinning: false };
    if (i < K.stopped) return { sym: SLOT_STRIP[K.pos[i]], next: SLOT_STRIP[K.pos[i]], frac: 0, spinning: false };
    const p = K.off[i] + (this.game.time - K.t0) * (6.5 + i * 2.2) / (1 + 0.04 * this.luck);
    const k = Math.floor(p) % SLOT_STRIP.length;
    return { sym: SLOT_STRIP[k], next: SLOT_STRIP[(k + 1) % SLOT_STRIP.length], frac: p - Math.floor(p), spinning: true, k };
  }
  slotsStop() {
    const M = this.menu, K = M.skill;
    if (!K || K.stopped >= 3) return;
    const r = this.slotReel(K.stopped);
    K.pos[K.stopped] = r.k; M.reels[K.stopped] = r.sym; K.stopped++;
    this.play('S_SlotStop', 0.8, 0.9 + K.stopped * 0.1);
    if (K.stopped >= 3) {
      const [a, b, c] = M.reels, TRIPLE = [1, 2, 2, 3, 4], PAIR = [0, 1, 1, 2, 3];
      const pair = a === b || a === c ? a : b === c ? b : -1;
      let R = 0;
      if (a === b && b === c) R = a === 6 ? 5 : a === 5 ? 2 : TRIPLE[a];
      else if (pair >= 0 && pair <= 4) R = PAIR[pair];
      else if (pair === 5) { R = 1; this.addLuck(1); }
      if (R === 0 && Math.random() < luckRerollChance(this.luck)) { R = 1; M.reroll = true; }
      M.rarity = R;
      this.slotsResolve();
    }
  }
  slotsResolve() {
    Meta.bump('slotSpins');
    const M = this.menu;
    this.play('S_SlotStop', 0.8);
    M.stage = 2; M.timer = 0; M.offers = [];
    if (M.reels[0] === 5 && M.reels[1] === 5 && M.reels[2] === 5) this.addLuck(3);
    for (let i = 0; i < 3; i++) for (let t = 0; t < 25; t++) { const u = rollUpgradeOfRarity(M.rarity, this.upgradeStacks); if (u >= 0 && !M.offers.includes(u)) { M.offers.push(u); break; } }
    if (!M.offers.length) { this.money += this.slotPrice(); M.stage = 0; M.result = 'No upgrades left. Refunded.'; M.resultColor = '#ccc'; return; }
    this.play(M.rarity === 4 ? 'S_Jackpot' : M.rarity === 5 ? 'S_Lose' : 'S_Win', 0.9);
    if (M.rarity === 4 || M.rarity === 5) this.game.banner(M.rarity === 5 ? 'CURSED' : 'JACKPOT', RARITY_HEX[RARITIES[M.rarity]], 2.5);
  }
  // Weapon roulette is a real wheel: ten wedges (weapons, and one or two busts) spin past the pointer and you
  // choose when to brake. Luck rolls better weapons onto the wheel, removes a bust and slows the spin.
  rouletteSpin() {
    const cost = Math.round(950 * this.priceMult());
    if (!this.spend(cost)) return;
    const M = this.menu;
    M.stage = 1; M.timer = M.spinLen = 10; M.result = ''; M.reroll = false; M.brake = false; M.lastSeg = -1; M.free = 1.1 + Math.random() * 1.2;   // spins freely this long, then coasts to a stop by itself
    this.play('S_SlotPull', 0.7, 0.9);
    M.wheel = [];
    for (let i = 0; i < 10; i++) M.wheel.push(rollWeaponOfRarity(rollRarity(this.luck, 1.25), this.weapons[0].def, this.weapons[1].def));
    { const k = randInt(0, 9); M.wheel[k] = MELEE_CODE + rollMelee(rarityIndex(rollRarity(this.luck, 1.25)), this.meleeDef); if (Math.random() < 0.5) M.wheel[(k + 5) % 10] = MELEE_CODE + rollMelee(rarityIndex(rollRarity(this.luck, 1.25)), this.meleeDef); }   // one or two melee weapons on every wheel
    M.wheel[randInt(0, 4)] = -1;
    if (Math.random() < luckRerollChance(this.luck)) M.reroll = true; else M.wheel[randInt(5, 9)] = -1;
    M.ang = Math.random() * Math.PI * 2; M.spd = 8.5 / (1 + 0.03 * this.luck);
  }
  roulettePointed() { const M = this.menu, n = M.wheel.length; return M.wheel[Math.floor((((M.ang % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2 / n)) % n]; }
  rouletteResolve() {
    const M = this.menu;
    M.timer = 0; M.spd = 0; M.pending = this.roulettePointed();
    this.play(M.pending < 0 ? 'S_Lose' : 'S_Win', 0.8);
    M.lock = 0.5;   // a mashed E can't buy another spin or grab the prize before you have seen it
    if (M.pending < 0) { M.stage = 0; M.result = 'Bust. Nothing won.'; M.resultColor = '#ff4d40'; return; }
    M.stage = 2;
  }
  bjCard() { return { r: randInt(1, 13), s: randInt(0, 3) }; }
  bjTotal(cards) { let t = 0, aces = 0; for (const c of cards) { if (c.r === 1) { aces++; t += 11; } else t += Math.min(10, c.r); } while (t > 21 && aces > 0) { t -= 10; aces--; } return t; }
  bjFinish() {
    const M = this.menu, me = this.bjTotal(M.hand);
    if (me <= 21) while (this.bjTotal(M.dealer) < 17) M.dealer.push(this.bjCard());
    const d = this.bjTotal(M.dealer), natural = me === 21 && M.hand.length === 2;
    M.stage = 3;
    let pay = 0;
    if (me > 21) { M.result = `Bust. Lost $${cash(M.stake)}`; M.resultColor = '#ff4d40'; }
    else if (d > 21 || me > d) pay = Math.round(M.stake * (natural ? 2.5 : 2) * (1 + 0.05 * this.luck));
    else if (me === d) { pay = M.stake; M.result = 'Push. Stake returned.'; M.resultColor = '#d9d9e6'; }
    else { M.result = `Dealer wins. Lost $${cash(M.stake)}`; M.resultColor = '#ff4d40'; }
    if (pay > M.stake) {
      M.result = `${natural ? 'Blackjack! ' : ''}Won $${cash(pay)}`; M.resultColor = '#66ff73';
      const big = pay >= 5000; this.play(big ? 'S_Jackpot' : 'S_Win', 0.9);
      if (big) this.game.banner(`BIG WIN  $${cash(pay)}`, lin(1, 0.85, 0.2), 2.5);
    } else if (pay === 0) this.play('S_Lose', 0.8);
    this.money += pay;
  }
  tableResolve() { /* replaced by blackjack */ }
  buyPawn(i) {
    const o = this.pawnOffers[i]; if (o == null || o < 0) return;
    if (isMelee(o)) { const W = MELEE[o - MELEE_CODE]; if (this.spend(Math.round(MELEE_PRICE[W.rarity] * this.priceMult()))) { this.giveWeapon(o); this.toast(`Melee: ${W.name}`, RARITY_HEX[W.rarity]); this.play('S_Buy', 0.8); this.pawnOffers[i] = -1; } return; }
    const U = DATA.upgrades[o];
    if (this.spend(Math.round(rarityPrice(rarityIndex(U.rarity)) * this.priceMult()))) { this.addUpgrade(o); this.play('S_Upgrade', 0.8); this.pawnOffers[i] = -1; }
  }
  pawnRerollPrice() { return Math.round(400 * (1 + this.pawnRerolls) * this.priceMult()); }
  pawnReroll() { if (this.spend(this.pawnRerollPrice())) { this.pawnRerolls++; this.rollPawn(); this.play('S_UISelect', 0.7); } }
  // what the three drums will stop on. Luck gives a dud pull one free second roll.
  slotRarity([a, b, c]) {
    const TRIPLE = [1, 2, 2, 3, 4], PAIR = [0, 1, 1, 2, 3], pair = a === b || a === c ? a : b === c ? b : -1;
    if (a === b && b === c) return a === 6 ? 5 : a === 5 ? 2 : TRIPLE[a];
    if (pair >= 0 && pair <= 4) return PAIR[pair];
    return pair === 5 ? 1 : 0;
  }
  slotsRoll() {
    const roll = () => [0, 1, 2].map(() => SLOT_STRIP[randInt(0, SLOT_STRIP.length - 1)]);
    let r = roll();
    if (this.slotRarity(r) === 0 && Math.random() < luckRerollChance(this.luck)) r = roll();
    return r;
  }
  slotsPayout(res) {
    Meta.bump('slotSpins');
    const R = this.slotRarity(res), clovers = res.filter((x) => x === 5).length;
    if (clovers >= 2) this.addLuck(clovers === 3 ? 3 : 1);
    const u = rollUpgradeOfRarity(R, this.upgradeStacks);
    if (u < 0) { this.money += this.slotPrice(); this.toast('No upgrades left. Refunded.', '#ccc'); return; }
    const U = DATA.upgrades[u], names = res.map((x) => SYMBOLS[x]).join('  ');
    this.play(R === 4 ? 'S_Jackpot' : R === 5 ? 'S_Lose' : 'S_Win', 0.9);
    if (R === 4 || R === 5) this.game.banner(R === 5 ? 'CURSED' : 'JACKPOT', RARITY_HEX[RARITIES[R]], 2.5);
    this.toast(`${names}:  ${U.rarity} upgrade`, RARITY_HEX[U.rarity]);
    this.addUpgrade(u);
  }
  buyTonic(i) {
    if (i < 0 || i > 7) return;
    const T = TONICS[i];
    if (this.tonicLevels[i] >= T.max) { this.toast(`${T.name} is maxed out`, '#ccc'); return; }
    if (!this.spend(this.tonicPrice(i))) return;
    this.tonicLevels[i]++; Meta.bump('tonics');
    const B = this.booth;
    switch (i) {
      case 0: B[STAT.MaxHealth] += 25; break; case 1: B[STAT.Damage] += 0.1; break; case 2: B[STAT.MoveSpeed] += 0.08; break; case 3: B[STAT.CritChance] += 0.06; break;
      case 4: B[STAT.FireRate] += 0.1; B[STAT.ReloadSpeed] += 0.1; break; case 5: B[STAT.Armor] += 8; break; case 6: this.maxSlots = 3; break;
      case 7: B[STAT.ExtraJumps] += 1; B[STAT.DashCharges] += 1; break; default: break;
    }
    const old = this.maxHealth;
    this.recompute();
    if (this.maxHealth > old) this.health += this.maxHealth - old;
    this.play('S_Upgrade', 0.7);
    this.toast(`${T.name}  (level ${this.tonicLevels[i]})`, '#ffb359');
  }
  // ---------------------------------------------------------------- classes
  setClass(id) {
    this.cls = classById(id);
    if (this.cls.id === 'gunslinger') this.maxSlots = 3;
    if (this.cls.id === 'bomber') this.grenades = [0, 0, 1, 4];
    this.abilityCd = 0;
    const old = this.maxHealth; this.recompute(); this.health += Math.max(0, this.maxHealth - old);
  }
  gunCount() { let n = 0; for (let i = 0; i < this.maxSlots; i++) if (this.weapons[i].def >= 0) n++; return n; }
  grenadeMax() { return (this.cls.id === 'bomber' ? 6 : GRENADE_MAX) + Math.round(this.stat('GrenadeCap')); }
  abilityMax() { return this.cls.id === 'sniper' ? this.grappleCooldown() : this.cls.cd / (1 + Math.max(0, this.stat('AbilityCooldown'))); }
  abilityReady() { return this.cls.id === 'sniper' ? (this.grappleCd > 0 ? 1 - this.grappleCd / this.grappleCooldown() : 1) : (this.abilityCd > 0 ? 1 - this.abilityCd / this.abilityMax() : 1); }
  useAbility() {
    const G = this.game, id = this.cls.id;
    if (id === 'sniper') { if (this.grappling) this.endGrapple(false); else this.startGrapple(); return; }
    if (this.abilityCd > 0) { this.toast(`${this.cls.ability} recharging (${this.abilityCd.toFixed(1)}s)`, '#b3b3b3'); return; }
    const dir = new THREE.Vector3(); G.camera.getWorldDirection(dir);
    if (id === 'gunslinger') {
      this.deadeyeT = 5 + this.stat('AbilityDuration'); this.deadeyeExt = 0; this.abilityCd = this.abilityMax();
      if (this.S.DeadeyeReload) { this.refillMags(); this.reloading = false; }
      this.play('S_PowerUp', 0.8, 1.3); this.fovKick += 6; G.banner('DEADEYE', lin(1, 0.8, 0.35), 1.2);
    } else if (id === 'brawler') {
      const f = safeN2(flat(dir.clone())); if (f.lengthSq() < 0.1) return;
      this.rushT = 0.36; this.rushDir.copy(f); this.rushHits.clear(); this.abilityCd = this.abilityMax();
      if (this.sliding) this.endSlide(); if (this.wallRunning) this.endWallRun();
      this.play('S_Dash', 0.9, 0.7); this.fovKick += 10; this.addShake(0.3);
    } else if (id === 'bomber') {
      const from = this.eye().addScaledVector(dir, 40).add(V3(0, -12, 0));
      G.projectiles.spawn({ pos: from, vel: dir.clone().multiplyScalar(1100).add(V3(0, 280, 0)).addScaledVector(this.vel, 0.6), damage: 0, splash: GRENADES[5].radius, gtype: 5, gravity: 1, bounces: 2, bounceDamp: 0.35, fuse: 1.5, life: 4, kind: 'Grenade', radius: 18, color: GRENADES[5].color, procCoef: 0, fromProc: true });
      this.abilityCd = this.abilityMax(); this.play('S_Dash', 0.6, 0.9); if (G.vm.jolt) G.vm.jolt(1.6);
    } else if (id === 'engineer') {
      // where you are looking, on the ground
      const eye = G.camera.position.clone(), hit = G.phys.raycast(eye, dir, 750);
      let at = hit ? hit.point.clone().addScaledVector(dir, hit.normal.y > 0.6 ? 0 : -70) : eye.clone().addScaledVector(dir, 420);
      const down = G.phys.raycast(at.clone().add(V3(0, 60, 0)), V3(0, -1, 0), 1500); if (!down) { this.toast('No room for the turret there', '#ccc'); return; }
      at = down.point;
      const allowed = 1 + Math.round(this.stat('TurretCount'));
      if (this.turrets.length < allowed) this.turrets.push(new Turret(G, at, this.turrets.length > 0));
      else { const T = this.turrets[this.turretNext % this.turrets.length]; this.turretNext++; if (this.S.TurretBlast) this.explodeAt(T.pos.clone().add(V3(0, 60, 0)), 420, this.power() * 3 * this.S.TurretBlast, 0, true, false, lin(0.5, 0.8, 1), null); T.place(at); }
      this.abilityCd = this.abilityMax(); this.play('S_MagIn', 0.9, 0.6);
    }
    if (this.abilityCd > 0) this.runProcs('OnAbility', null, this.pos, 0, 1);
  }
  tickAbility(dt) {
    const G = this.game;
    if (this.abilityCd > 0) this.abilityCd -= dt;
    if (this.deadeyeT > 0) { this.deadeyeT -= dt; if (this.deadeyeT <= 0) this.play('S_Deny', 0.4, 0.7); }
    if (this.rushGuardT > 0) this.rushGuardT -= dt;
    if (this.rushT > 0) {
      // Bull Rush: a straight charge. Everything it touches is hit once, hard, and thrown aside.
      this.rushT -= dt;
      this.vel.x = this.rushDir.x * 2500; this.vel.z = this.rushDir.z * 2500; if (this.vel.y < 0) this.vel.y *= 0.5;
      const W = MELEE[this.meleeDef], pw = this.stat('AbilityPower');
      const dmg = Math.max(W.dmg * (1 + this.stat('MeleeDamage')) * honeDamage(this.meleeTier || 0) * 2.2 * (1 + 0.06 * Math.max(0, effRound(G.round) - 1)), zombieHealth(G.round)) * (1 + pw);
      this.inRush = true;
      for (const E of G.enemies) {
        if (E.dead || E.burrowed || this.rushHits.has(E)) continue;
        if (Math.hypot(E.pos.x - this.pos.x, E.pos.z - this.pos.z) > 150 + (E.hitR || E.radius) || Math.abs(E.pos.y - this.pos.y) > 260) continue;
        this.rushHits.add(E); this.meleeHitting = true;
        this.dealDamage(E, dmg, E.pos, this.rushDir, false, 1, false, 0, 0, 0, 0, [1, 0.6, 0.3]);
        if (!E.dead && !E.isBoss) { E.applyKnock(this.rushDir.clone().multiplyScalar(700).add(V3(0, 320, 0))); if (pw > 0) E.staggerT = Math.max(E.staggerT || 0, 1.2); }
        this.addShake(0.25); G.hitstop = Math.max(G.hitstop || 0, 0.03);
      }
      this.inRush = false; this.meleeHitting = false;
      if (this.rushT <= 0) { this.vel.x *= 0.35; this.vel.z *= 0.35; this.rushGuardT = 3; if (this.S.RushShield) { this.overshield = Math.min(this.shieldCap(), this.overshield + this.S.RushShield); this.haste = Math.max(this.haste, 0.3); this.hasteT = 3; } }
    }
    // Engineer: standing by the turret
    this.nearTurret = false; for (const T of this.turrets) if (T.pos.distanceTo(this.pos) < 520) this.nearTurret = true;
  }
  // ---------------------------------------------------------------- gun modifiers (workbench)
  altKind() { for (const a of ALT_STATS) if (this.stat(a) > 0) return a; return null; }
  fireAlt(S, W) {
    const G = this.game, kind = this.altKind(), pw = this.power();
    const muzzle = G.vm.muzzleWorld(), eye = G.camera.position.clone(), dir = new THREE.Vector3(); G.camera.getWorldDirection(dir);
    const shell = (gtype, speed, altDmg, radius) => G.projectiles.spawn({ pos: muzzle.clone(), vel: dir.clone().multiplyScalar(speed).add(V3(0, 160, 0)), damage: 0, splash: radius, gtype, altDmg, gravity: 1, bounces: 0, fuse: 3, life: 4, kind: 'Grenade', radius: 12, color: GRENADES[gtype].color, procCoef: 0, fromProc: true });
    if (kind === 'AltLauncher') { shell(7, 2400, pw * 5, 320); S.altCd = 12; this.play('S_Explosion', 0.35, 1.8); }
    else if (kind === 'AltGravity') { shell(6, 2000, pw * 4, 520); S.altCd = 10; this.play('S_Grapple', 0.8, 0.6); }
    else if (kind === 'AltRail') { this.fireHitscan(eye, dir, 12000, pw * 6, 99, 1, W, 14, [0.6, 0.9, 1], muzzle); S.altCd = 6; this.play('S_Crit', 0.9, 0.5); }
    else if (kind === 'AltBuck') { for (let k = 0; k < 8; k++) this.fireHitscan(eye, vrandCone(dir, 7 * D2R), 1600, pw * 0.4, 0, 0.12, W, 3, [1, 0.9, 0.6], muzzle); S.altCd = 4; this.play('S_Explosion', 0.3, 2.2); }
    else return false;
    this.fireCd = 0.35; this.fireFeedback(W, 1.8, false); this.aimHold = 0;
    return true;
  }
  activeReload() {
    if (this.arFail) return;
    const p = 1 - this.reloadT / Math.max(0.01, this.reloadDur), S = this.slot;
    if (p >= 0.42 && p <= 0.62) { this.finishReload(); S.hot = this.magSize(S); this.toast('Perfect reload  -  hot magazine', '#ffcd5a'); this.play('S_Crit', 0.7, 1.4); this.game.vm.jolt && this.game.vm.jolt(0.6); }
    else { this.arFail = true; this.reloadT += this.reloadDur * 0.25; this.play('S_Deny', 0.5); }
  }
  benchCost(S) { return Math.round([10000, 20000, 40000, 50000][Math.min(3, S.mods.length)] * this.priceMult()); /* $1,000, $2,000, $4,000, $5,000 */ }
  benchUpgrade() {
    if (this.wield) return this.honeMelee();
    const J = this.benchJob;
    if (J) {
      if (J.t > 0) { this.toast(`Still working  -  ${Math.ceil(J.t)}s`, '#ccc'); this.play('S_Deny', 0.4); return; }
      this.benchJob = null;
      const S = J.S, W = DATA.weapons[J.def];
      if (S.def !== J.def) { this.addMoney(J.cost, false); this.toast(`${W.name} is gone  -  money returned`, '#ccc'); return; }
      S.mods.push(J.u); S.tier = S.mods.length;
      this.recompute(); S.ammo = this.magSize(S); S.reserve = this.reserveSize(S);
      if (S === this.slot && !this.wield) this.game.vm.setWeapon(S.def, Math.min(3, S.tier), true);
      this.play('S_Upgrade', 0.9);
      Meta.bump('mods'); if (S.tier >= 3) Meta.bump('tier3');
      this.game.hud.gotUpgrade(J.u, 1, `${W.name} modifier`);
      this.game.fx.flash(this.pos, lin(1, 0.3, 0.9), 90, 0.4, true);
      return;
    }
    const S = this.slot;
    if (S.def < 0) return;
    const W = DATA.weapons[S.def];
    if (S.mods.length >= 4) { this.toast(`${W.name} has all four modifiers`, '#ccc'); return; }
    const u = rollGunMod(S.mods, W, this.cls.id, this.luck);
    if (u < 0) { this.toast('Nothing more this gun can take', '#ccc'); return; }
    const cost = this.benchCost(S);
    if (!this.spend(cost)) return;
    this.benchJob = { S, def: S.def, u, t: 10, cost }; this.benchUses++;
    if (this.game.descent) { this.benchJob.t = 0; return this.benchUpgrade(); }   // in the Descent there is no time to wait: the bench is done as you pay
    this.play('S_Switch', 0.9, 0.7);
    this.toast(`Working on ${W.name}  -  come back in 10s to claim it`, '#ff8cff');
  }
  // ---------------------------------------------------------------- chests and tonics
  // Chests are the main thing money is for, so they are priced against what a round pays: about one wooden chest a
  // round if you buy nothing else, and the better tiers are something you save for. Every chest opened makes all of
  // them 8.5% dearer, and prices creep up 2% a round so hoarding cash does not beat the curve.
  chestPrice(tier) { const n = this.chestsOpened, r = Math.max(1, this.game.round || 1); return Math.round([600, 1400, 3000, 6000][tier] * Math.pow(1.085, n) * (1 + 0.02 * (r - 1)) * this.priceMult() / 10) * 10; }
  // three buffs to choose from; each card rolls its own rarity (the chest's, or one better with luck)
  chestOffers(tier, keep = []) {
    const out = keep.slice(), hiChance = Math.min(0.85, 0.3 + this.stat('ChestLuck')), ban = this.banned || (this.banned = new Set());
    for (let tries = 0; tries < 60 && out.length < 3; tries++) {
      const u = rollBuff(Math.random() < hiChance ? tier + 1 : tier, this.upgradeStacks, this.cls.id);
      if (u >= 0 && !out.includes(u) && !ban.has(u)) out.push(u);
    }
    return out;
  }
  openChest(I) {
    if (I.opened || this.inMenu()) return;
    const offers = this.chestOffers(I.tier);
    if (!offers.length) { this.toast('Nothing left for you in there', '#ccc'); return; }
    const paid = I.free ? 0 : this.chestPrice(I.tier);
    if (!this.spend(paid)) return;
    this.chestsOpened++; I.setOpened(true); I.holding = true;   // it stays until you have chosen
    if (this.S.ChestRefund) this.addMoney(Math.round(paid * Math.min(0.5, this.S.ChestRefund)), false);
    this.runProcs('OnChest', null, this.pos, 0, 1);
    this.play('S_Upgrade', 0.9);
    this.game.fx.flash(I.pos.clone().add(V3(0, 60, 0)), lin(1, 0.85, 0.4), 140, 0.4, true);
    Meta.bump('chests');
    // nothing can touch you for five seconds: time to read the cards, pick, and move
    this.invuln = Math.max(this.invuln, 5); this.safeT = 5;
    if (this.banishes == null) this.banishes = 2;
    this.menu = { type: 'Chest', stage: 0, offers, tier: I.tier, rerolls: 0, banish: false, result: '', resultColor: '#fff', page: 0 };
    this.menuStation = I; this.menuHelp = false; this.fireHeld = false; this.aiming = false;
    if (this.sliding) this.endSlide();
  }
  chestTake(i) {
    const M = this.menu, I = this.menuStation; if (!M || M.type !== 'Chest' || !(M.offers[i] >= 0)) return;
    const u = M.offers[i], U = DATA.upgrades[u];
    M.offers = [];
    this.addUpgrade(u);
    this.play(rarityIndex(U.rarity) >= 3 ? 'S_LevelUp' : 'S_Upgrade', 0.9);
    if (rarityIndex(U.rarity) >= 3) this.game.banner(U.name.toUpperCase(), lin(1, 0.75, 0.25), 2.5);
    if (I) { I.holding = false; if (I.keep) I.setOpened(false); }
    this.invuln = Math.max(this.invuln, 2); this.safeT = Math.max(this.safeT || 0, this.invuln);   // and a moment to get clear
    this.menu = null; this.menuStation = null;
  }
  rollTonic() { const w = [5, 5, 4, 4, 4, 3, 1, 1.5], ok = (k) => this.tonicLevels[k] < Math.min(TONICS[k].max, 10) && !(k === 6 && this.maxSlots >= 3); let t = 0; for (let k = 0; k < 8; k++) if (ok(k)) t += w[k]; let r = Math.random() * t; for (let k = 0; k < 8; k++) if (ok(k)) { r -= w[k]; if (r <= 0) return k; } return 0; }
  gainTonic(i) {
    // a drink off the dead: one level of that tonic (if it is already full, another one that is not)
    if (this.tonicLevels[i] >= TONICS[i].max || (i === 6 && this.maxSlots >= 3)) { const open = TONICS.map((T, k) => k).filter((k) => this.tonicLevels[k] < TONICS[k].max && !(k === 6 && this.maxSlots >= 3)); if (!open.length) { this.addMoney(300, true); this.toast('Every tonic is maxed  +$30', '#ffd23a'); return; } i = open[randInt(0, open.length - 1)]; }
    const T = TONICS[i];
    this.tonicLevels[i]++; Meta.bump('tonics');
    const B = this.booth;
    switch (i) {
      case 0: B[STAT.MaxHealth] += 25; break; case 1: B[STAT.Damage] += 0.1; break; case 2: B[STAT.MoveSpeed] += 0.08; break; case 3: B[STAT.CritChance] += 0.06; break;
      case 4: B[STAT.FireRate] += 0.1; B[STAT.ReloadSpeed] += 0.1; break; case 5: B[STAT.Armor] += 8; break; case 6: this.maxSlots = 3; break;
      case 7: B[STAT.ExtraJumps] += 1; B[STAT.DashCharges] += 1; break; default: break;
    }
    const old = this.maxHealth;
    this.recompute();
    if (this.maxHealth > old) this.health += this.maxHealth - old;
    this.play('S_Upgrade', 0.7);
    this.game.hud.gotTonic(i, this.tonicLevels[i]);
  }

  // Menu content for the HUD: the on-screen lines stay minimal (options, prices, results); anything that
  // explains how a station works goes in `help`, shown only when the player opens the "?" panel.
  menuText() {
    const M = this.menu; if (!M) return null;
    const lines = [], help = [], dim = '#c9bfae', gold = '#ffd24d', bone = '#f2e8d5';
    const add = (text, color = dim) => lines.push({ kind: 'info', text, color });
    const res = (text, color = gold) => lines.push({ kind: 'result', text, color });
    const opt = (key, name, o = {}) => lines.push(Object.assign({ kind: 'opt', key, name, color: bone }, o));
    let title = '', footer = '';
    const LM = luckMult(this.luck);
    switch (M.type) {
      case 'Slots':
        title = 'SLOTS';
        help.push({ kind: 'info', text: `Press E to stop each reel, left to right. What lines up sets the rarity of the three upgrades you choose from. Luck (${this.luck}) slows the reels. Each spin costs more than the last.`, color: dim });
        help.push({ kind: 'pay', rows: [['NO MATCH', 'Common', RARITY_HEX.Common], ['BELL or BAR x2', 'Uncommon', RARITY_HEX.Uncommon], ['CHERRY x3', 'Uncommon', RARITY_HEX.Uncommon], ['SEVEN x2', 'Rare', RARITY_HEX.Rare], ['BELL or BAR x3', 'Rare', RARITY_HEX.Rare], ['CROWN x2', 'Epic', RARITY_HEX.Epic], ['SEVEN x3', 'Epic', RARITY_HEX.Epic], ['CROWN x3', 'Legendary', RARITY_HEX.Legendary], ['CLOVER x3', '+3 Luck, Rare', '#7dff8a'], ['SKULL x3', 'Cursed', RARITY_HEX.Cursed]] });
        if (M.stage === 0) {
          if (M.result) res(M.result, M.resultColor);
          opt('E', 'Spin', { price: this.slotPrice() });
          footer = '[Tab] Leave';
        } else if (M.stage === 1) { footer = '[E] Stop reel'; }
        else {
          const rn = RARITIES[M.rarity];
          res(`${rn.toUpperCase()}${M.reroll ? '  (LUCK REROLL)' : ''}`, RARITY_HEX[rn]);
          M.offers.forEach((u, i) => { const U = DATA.upgrades[u]; const have = this.upgradeStacks[u]; opt(String(i + 1), U.name, { icon: `U_${u}`, suit: U.suit, tag: U.rarity.toUpperCase(), tagColor: RARITY_HEX[U.rarity], color: RARITY_HEX[U.rarity], desc: U.desc, note: have ? `owned x${have}` : '' }); });
          footer = '[Tab] Take the first';
        }
        break;
      case 'Roulette':
        title = 'WEAPON ROULETTE';
        help.push({ kind: 'info', text: `The wheel holds ten wedges: weapons and one or two busts. Press E to pay and spin; the wheel stops on its own, and E again claims whatever is under the pointer. Luck (${this.luck}) puts better weapons on the wheel, can remove a bust and slows the spin. Taking the weapon fills an empty slot, or replaces the one you are holding.`, color: dim });
        if (M.stage === 0) { if (M.result) res(M.result, M.resultColor); opt('E', 'Spin again', { price: Math.round(950 * this.priceMult()) }); footer = '[Tab] Leave'; }
        else if (M.stage === 1) { lines.push({ kind: 'wheel' }); const w = this.roulettePointed(); if (w < 0) res('BUST', '#ff4d40'); else res(wdef(w).name.toUpperCase(), RARITY_HEX[wdef(w).rarity]); footer = ''; }
        else {
          const W = DATA.weapons[M.pending];
          res(`${W.name.toUpperCase()}${M.reroll ? '  (LUCK RE-SPIN)' : ''}`, RARITY_HEX[W.rarity]);
          add(`${W.rarity} ${W.cls === 'Wonder' ? 'wonder weapon' : W.cls.toLowerCase()}. ${W.desc}`);
          lines.push({ kind: 'stats', items: [['DAMAGE', `${W.dmg}${W.pellets > 1 ? ' x' + W.pellets : ''}`], ['RATE', `${W.rate.toFixed(1)}/s`], ['MAG', `${W.mag}`]] });
          opt('E', 'Claim', { color: gold });
          footer = '[Tab] Leave it';
        }
        break;
      case 'MoneyTable':
        title = 'BLACKJACK';
        help.push({ kind: 'info', text: `Get closer to 21 than the dealer without going over. Face cards count 10, aces 1 or 11. The dealer draws to 17. A win pays 2x, a two-card 21 pays 2.5x, a tie returns your stake. Double doubles the stake for exactly one more card. Luck (${this.luck}) adds ${this.luck * 5}% to winnings and has a ${Math.round(luckRerollChance(this.luck) * 100)}% chance to swap a card that would bust you.`, color: dim });
        if (M.stage === 0) {
          if (M.result) res(M.result, M.resultColor);
          opt('1', 'Minimum', { price: 500 });
          opt('2', 'Quarter', { price: Math.floor(this.money / 4) });
          opt('3', 'Half', { price: Math.floor(this.money / 2) });
          opt('4', 'All in', { price: this.money, color: '#ff664d' });
          footer = '[Tab] Leave';
        } else {
          const done = M.stage === 3;
          lines.push({ kind: 'cards', label: done ? `DEALER  ${this.bjTotal(M.dealer)}` : 'DEALER', cards: M.dealer, hide: done ? -1 : 1 });
          lines.push({ kind: 'cards', label: `YOU  ${this.bjTotal(M.hand)}${M.reroll ? '  (LUCK SWAP)' : ''}`, cards: M.hand, hide: -1 });
          if (!done) {
            add(`Stake $${cash(M.stake)}`, bone);
            opt('1', 'Hit'); opt('2', 'Stand');
            if (M.hand.length === 2) opt('3', 'Double', { price: M.stake });
            footer = '[Tab] Forfeit';
          } else { res(M.result, M.resultColor); footer = '[E] Again   [Tab] Leave'; }
        }
        break;
      case 'Pawn':
        title = 'UPGRADES';
        help.push({ kind: 'info', text: 'Sets: every upgrade carries a mark. Owning 3, 6 or 9 different upgrades with the same mark gives its bonus. Iron: +12% damage. Blood: +30 health, +1 regen. Gold: +15% money. Wind: +7% speed, faster dash.', color: dim });
        help.push({ kind: 'info', text: 'Four upgrades for sale. The stock changes every casino visit and luck makes rarer upgrades appear. Restock rolls four new ones and costs more each time.', color: dim });
        M.offers.forEach((u, i) => {
          if (u < 0) { opt(String(i + 1), 'Sold', { disabled: true }); return; }
          if (isMelee(u)) { const W = MELEE[u - MELEE_CODE]; opt(String(i + 1), W.name, { tag: 'MELEE  ' + W.rarity.toUpperCase(), tagColor: RARITY_HEX[W.rarity], color: RARITY_HEX[W.rarity], desc: `${W.desc} ${W.dmg} damage, ${reachText(W.range)}, replaces your ${MELEE[this.meleeDef].name}.`, price: Math.round(MELEE_PRICE[W.rarity] * this.priceMult()) }); return; }
          const U = DATA.upgrades[u]; const have = this.upgradeStacks[u];
          opt(String(i + 1), U.name, { icon: `U_${u}`, suit: U.suit, tag: U.rarity.toUpperCase(), tagColor: RARITY_HEX[U.rarity], color: RARITY_HEX[U.rarity], desc: U.desc, price: Math.round(rarityPrice(rarityIndex(U.rarity)) * this.priceMult()), note: have ? `owned x${have}` : '' });
        });
        opt('E', 'Restock', { price: Math.round(400 * (1 + this.pawnRerolls) * this.priceMult()), color: '#cfc5b4' });
        footer = '[Tab] Leave';
        break;
      case 'Tonic':
        title = 'TONICS';
        help.push({ kind: 'info', text: 'Permanent stat boosts for this run. Each level of a tonic costs more than the one before.', color: dim });
        for (let k = 0; k < 4; k++) {
          const idx = M.page * 4 + k, T = TONICS[idx], lv = this.tonicLevels[idx], max = lv >= T.max;
          opt(String(k + 1), T.desc, { icon: `TN_${idx}`, tag: max ? 'MAX' : `${lv}/${T.max}`, tagColor: max ? '#7dff8a' : '#cfc5b4', price: max ? undefined : this.tonicPrice(idx), disabled: max, color: '#ffd9a0' });
        }
        footer = `[E] Page ${M.page + 1}/2   [Tab] Leave`;
        break;
      case 'Chest': {
        title = `${['WOODEN', 'IRON', 'GILDED', 'RELIQUARY'][M.tier] || ''} CHEST`;
        help.push({ kind: 'info', text: 'Choose one of three buffs. Every buff feeds a build (Ember, Frost, Storm, Blood, Powder, Deadeye, Bulwark, Rush, Fortune, Blade): hold 2 of one build to wake its power, 5 for the second, 8 for the third. Two builds awake together can make a combination. Your builds are listed down the left of the screen, and the bar under each buff here shows what taking it does for its build. "Power" in a description means half a second of your current gun\'s damage. Banish strikes a buff from every chest for the rest of the run and draws another in its place; you get two banishes a run. Nothing can hurt you for five seconds after the chest opens.', color: dim });
        if (M.banish) res('BANISH WHICH ONE?', '#ff6a5a'); else res('CHOOSE ONE', gold);
        M.offers.forEach((u, i) => { const U = DATA.upgrades[u]; const have = this.upgradeStacks[u]; opt(String(i + 1), U.name, { icon: `U_${u}`, suit: U.suit, tag: U.rarity.toUpperCase(), tagColor: RARITY_HEX[U.rarity], color: M.banish ? '#ff9a8a' : RARITY_HEX[U.rarity], desc: U.desc, note: have ? `owned x${have}` : '', build: buildNote(this, U) }); });
        opt('4', M.banish ? 'Cancel banish' : `Banish one  (${this.banishes} left)`, { color: this.banishes > 0 ? bone : '#8a8078' });
        footer = '[Tab] Take the first';
        break;
      }
      case 'Vault': {
        title = 'WORKBENCH';
        help.push({ kind: 'info', text: 'Raises the tier of the weapon you are holding (max 3). Each tier: +75% damage, a bigger magazine and faster fire. Tier 3 adds pierce. Gamble pays half price for a chance at the upgrade; if it fails the money is lost.', color: dim });
        const S = this.slot;
        if (S.def >= 0) {
          const W = DATA.weapons[S.def];
          res(`${W.name.toUpperCase()}   ${'★'.repeat(S.tier)}${'☆'.repeat(3 - S.tier)}`, RARITY_HEX[W.rarity]);
          if (S.tier < 3) {
            const full = Math.round(VAULT_COST[S.tier] * this.priceMult());
            opt('1', `Upgrade to tier ${S.tier + 1}`, { price: full, color: gold });
            opt('2', 'Gamble', { tag: `${Math.round(Math.min(0.45 + 0.03 * this.luck, 0.75) * 100)}%`, tagColor: '#ff73d9', price: Math.floor(full / 2), color: '#ff73d9' });
          } else add('Max tier.', bone);
        }
        if (M.result) add(M.result, M.resultColor);
        footer = '[Tab] Leave';
        break;
      }
      default: break;
    }
    return { title, lines, help, footer, showHelp: !!this.menuHelp };
  }
}
