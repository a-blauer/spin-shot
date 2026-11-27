// What makes each gun its own gun.
// Every weapon has one signature: a rule that changes how it is played and what you want to fit to it. A signature is
// a handful of hooks the player's firing and damage code calls (shot, pre, crit, post, kill, reload, tick), plus two
// plain tables: `aff` multiplies a stat while the gun is in your hands (so the same part is worth more on the right
// gun), and `proc` multiplies how often on-hit parts go off. `noCrit` guns never roll a random crit: theirs are earned.
//
// A shot carries a context `C` from the trigger pull to everything it hits, including rockets that land later:
//   C.mult   damage multiplier for the whole shot        C.base   damage of one projectile, after C.mult
//   C.pierce extra pierce   C.chains extra jumps         C.forceCrit  every hit of this shot crits
//   C.last   this was the last round in the magazine     C.hits   how many things the shot has hit so far
//   C.g      the gun's own state, kept on its slot       C.gen    how many links down a chain reaction we are
import * as THREE from 'three';
import { DATA } from './data.js';
import { SIG2, sig2Tick, sig2Amp, sig2After } from './signatures2.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const GOLD = [1, 0.84, 0.3];
const near = (G, c, r, skip) => G.enemies.filter((E) => E !== skip && !E.dead && !E.emerging && E.pos.distanceTo(c) < r);
const say = (p, pos, text, col, size = 1.05) => p.game.hud.floater(pos.clone().add(V3(0, 60, 0)), text, col, size);
const front = (p) => p.eye().add(p.forward().multiplyScalar(150));
const later = (p, t, fn) => { (p.sgQ || (p.sgQ = [])).push({ t, fn }); };
const mark = (G, E, amt, time) => { const cur = E.markUntil > G.time ? E.markAmt || 0 : 0; E.markAmt = Math.max(cur, amt); E.markUntil = Math.max(E.markUntil || 0, G.time + time); };
const dist = (p, E) => E.pos.distanceTo(p.pos);

export const SIG = {
  // ------------------------------------------------------------------ pistols
  'Tin Star': {
    name: 'Bounty', short: 'Kills load gold rounds: +150% damage, through two more.',
    text: 'Every kill loads a gold round. A gold round hits for +150% and goes through two more enemies, and every kill it makes loads another. It holds six.',
    play: 'Chain kills. Finish the weak ones to arm the shot for the strong one.', fav: ['Piercing Tip', 'Marksman Scope', 'Heavy Rounds'], aff: { Pierce: 2, HeadshotDamage: 1.5 },
    shot(p, S, W, g, C) { if (g.gold > 0) { g.gold--; C.mult *= 2.5; C.pierce += 2; C.tracer = GOLD; p.game.fx.flash(p.game.vm.muzzleWorld(), GOLD, 50, 0.1, true); p.play('S_Coin', 0.35, 1.5); } },
    kill(p, E, C, g) { if ((g.gold || 0) < 6) { g.gold = (g.gold || 0) + 1; if (g.gold === 1 || g.gold === 6) say(p, E.pos, g.gold === 6 ? 'SIX GOLD ROUNDS' : 'GOLD ROUND', GOLD); } },
    hud: (p, S, W, g) => (g.gold > 0 ? [`GOLD ROUNDS  x${g.gold}`, '#ffd23a'] : null),
  },
  'Saloon Six': {
    name: 'Sixth Chamber', short: 'Six rounds, always. The sixth crits for double. Magazine parts add damage.',
    text: 'The cylinder always holds six: anything that would add rounds adds that much damage instead. The sixth round always crits and hits twice as hard.',
    play: 'Count your shots. Spend five on the crowd and save the sixth for something that deserves it.', fav: ['Extended Mag', 'Quick Hands', 'Hollow Tip'], aff: { MagSize: 1.5, ReloadSpeed: 1.5 },
    mag: () => 6,
    sheet: (p, S) => ({ dmg: 1 + Math.max(0, p.stat('MagSize')) + 0.1 * S.tier }),
    shot(p, S, W, g, C) { C.mult *= 1 + Math.max(0, p.stat('MagSize')) + 0.1 * S.tier; if (C.last) { C.forceCrit = true; C.mult *= 2; C.tracer = [1, 0.35, 0.2]; p.addShake(0.7); p.fovKick += 3; say(p, front(p), 'SIXTH CHAMBER', [1, 0.45, 0.25]); } },
    hud: (p, S) => (S.ammo === 1 ? ['SIXTH CHAMBER', '#ff7a4a'] : null),
  },
  Copperhead: {
    name: 'Venom', short: 'Hits poison and stack without limit. The poisoned burst and spread it.',
    text: 'Every hit poisons for 40% of its damage again over three seconds, and the poison stacks without limit. Anything that dies poisoned bursts and passes half of it to whatever is near.',
    play: 'Tap through a pack, move on, and let them rot. Crits do nothing for the poison; more bullets do.', fav: ['Serrated', 'Split Barrel', 'Extended Mag'], aff: { Multishot: 1.5, MagSize: 1.5 }, proc: { Bleed: 2 },
    post(p, E, C, g, h) { if (h.killed) return; const G = p.game; E.applyBleed(h.dealt * 0.4); E.sgVenom = G.time + 3.2; if (G.time > (E.sgVfx || 0)) { E.sgVfx = G.time + 0.5; G.fx.puff(h.at, [0.45, 0.9, 0.3], 26, 0.4); } },
  },
  Sidewinders: {
    name: 'Twin Fangs', short: 'No random crits. A second bullet into the same enemy always crits.',
    text: 'Two guns, two bullets. No random crits: when a second bullet of the same shot bites the enemy the first one hit, it always crits.',
    play: 'Get close or aim down the sights so both land. Crit damage is everything; crit chance is wasted.', fav: ['Hollow Tip', 'Split Barrel', 'Marksman Scope'], aff: { CritDamage: 1.5, Multishot: 1.5 }, noCrit: true,
    crit(p, E, C) { if (C.seen.has(E)) return true; C.seen.add(E); return false; },
  },
  // ------------------------------------------------------------------ SMGs
  'Back-Alley': {
    name: 'Mugger', short: 'Within 4.5 m: +50% damage, life steal, and kills pay extra (in the Descent they count twice toward evolving). Weak at range.',
    text: 'Inside four and a half metres it hits 50% harder, steals life with every bullet and shakes extra cash out of anything it kills; in the Descent, where there is no cash, those kills count twice toward evolving. Past fifteen metres it does a quarter less.',
    play: 'Stay in their faces. The closer the fight, the more it pays and the more it heals.', fav: ['Leech Rounds', 'Heavy Rounds', 'Rapid Bolt'], aff: { Lifesteal: 2 }, proc: { Money: 2 },
    pre: (p, E) => { const d = dist(p, E); return d < 450 ? 1.5 : 1.5 - 0.75 * clamp((d - 450) / 1050, 0, 1); },
    post(p, E, C, g, h) { if (dist(p, E) < 450 + E.radius) p.combatHeal(h.dealt * (0.015 + p.stat('Lifesteal'))); },
    kill(p, E) { if (dist(p, E) < 450 + E.radius) { const pay = Math.round((E.money || 0) * 0.5) + 50; p.addMoney(pay, true); if (p.game.descent && C && C.S) C.S.evoK = (C.S.evoK || 0) + (E.isBoss ? 10 : E.elite ? 3 : 1); say(p, E.pos, 'MUGGED', GOLD, 0.95); } },
  },
  "Hornet's Nest": {
    name: 'Swarm', short: 'Each hit on one target adds +2.5% damage, to +75%, then spills over.',
    text: 'Every hit leaves a sting: +2.5% damage to that target per sting, up to thirty. A fully stung target spills the swarm onto two enemies beside it with every hit. Stings fade after two seconds.',
    play: 'Pick one thing and do not let go of the trigger. The best boss-killer among the light guns.', fav: ['Feed Loop', 'Extended Mag', 'Rapid Bolt'], aff: { AmmoSave: 2, MagSize: 1.5 },
    pre: (p, E) => { const s = E.sgSting; return s && s.until > p.game.time ? 1 + 0.025 * s.n : 1; },
    post(p, E, C, g, h) {
      const G = p.game; if (h.killed) { g.n = 0; return; }
      let s = E.sgSting; if (!s || s.until < G.time) s = E.sgSting = { n: 0 };
      s.n = Math.min(30, s.n + 1); s.until = G.time + 2; g.n = s.n; g.nT = s.until;
      if (s.n === 30 && !s.full) { s.full = true; say(p, E.pos, 'SWARMED', [1, 0.9, 0.3], 1.2); p.play('S_PowerUp', 0.35, 1.7); }
      if (s.n >= 30 && G.time > (g.spillT || 0)) {
        g.spillT = G.time + 0.11; let k = 0;
        for (const O of near(G, E.pos, 460, E)) { if (k++ >= 2) break; G.fx.tracer(h.at, O.pos.clone().add(V3(0, 50, 0)), [1, 0.9, 0.3], 2, 0.07); p.dealDamage(O, h.dealt * 0.4, O.pos, O.pos.clone().sub(E.pos).normalize(), false, 0, true, 0, 0, 0, 0, [1, 0.9, 0.3]); }
      }
    },
    hud: (p, S, W, g) => (g.n > 0 && g.nT > p.game.time ? [`STINGS  ${g.n}/30`, g.n >= 30 ? '#ffe36a' : '#d8c890'] : null),
  },
  Rustler: {
    name: 'Hot Hand', short: 'Crits cost no ammo and speed the gun up. A cold shot slows it again.',
    text: 'A crit puts its round straight back in the magazine, and each one fires the gun 6% faster, up to +60%. A shot that fails to crit cools it two steps.',
    play: 'A crit-chance gun through and through: past half, the magazine almost never runs dry.', fav: ['Keen Sight', 'Hollow Tip', 'Marksman Scope'], aff: { CritChance: 1.5 },
    rate: (p, S, W, g) => 1 + 0.06 * (g.heat || 0),
    post(p, E, C, g, h) {
      if (C.echo) return;
      if (h.crit) { if (!C.refund) { C.refund = true; if (C.S.ammo < p.magSize(C.S)) C.S.ammo++; } g.heat = Math.min(10, (g.heat || 0) + 1); }
      else if (!C.cool) { C.cool = true; g.heat = Math.max(0, (g.heat || 0) - 2); }
      g.heatT = p.game.time + 1.5;
    },
    tick(p, S, W, g) { if (g.heat > 0 && p.game.time > (g.heatT || 0)) g.heat = 0; },
    hud: (p, S, W, g) => (g.heat > 0 ? [`HOT HAND  +${g.heat * 6}%`, g.heat >= 10 ? '#ff7a4a' : '#ffb347'] : null),
  },
  // ------------------------------------------------------------------ rifles
  'Quarter Horse': {
    name: 'Trick Shot', short: 'No random crits. Every hit skips to another enemy, and a skip always crits.',
    text: 'Every bullet that hits skips on to another enemy, and a skipped bullet always crits. Each further skip hits 25% harder. No random crits. With nobody else to hit, it comes back weaker.',
    play: 'Shoot the one in front to hit the one behind. Ricochet parts turn one bullet into a room clear.', fav: ['Ricochet', 'Hollow Tip', 'Heavy Rounds'], aff: { Ricochet: 2, CritDamage: 1.5 }, noCrit: true,
    ric: { add: 1, mul: 0.6, grow: 1.25, crit: true, self: 0.4 },
  },
  'Lawman AR': {
    name: 'Warrant', short: 'Hits make the target take +3% from everything, to +36%.',
    text: 'Every hit serves a warrant: the target takes 3% more damage from everything (your other gun, fire, blasts, the blade) up to +36%, for six seconds. The first four rounds of a burst go exactly where you point.',
    play: 'The set-up gun. Paint the big one, then swap to something heavy while the warrant stands.', fav: ['Extended Mag', 'Split Barrel', 'Cryo Cell'], aff: { MagSize: 1.5, Multishot: 1.5 },
    shot(p, S, W, g) { const T = p.game.time; if (T - (g.lastT || -9) > 0.3) g.burst = 0; g.burst = (g.burst || 0) + 1; g.lastT = T; },
    spread: (p, S, W, g) => ((g.burst || 0) <= 4 ? 0.12 : 1),
    post(p, E, C, g, h) {
      if (h.killed) return; const G = p.game;
      const n = Math.min(12, (E.sgWarT > G.time ? E.sgWar || 0 : 0) + 1); E.sgWar = n; E.sgWarT = G.time + 6; mark(G, E, 0.03 * n, 6);
      if (n === 12 && !E.sgWanted) { E.sgWanted = true; say(p, E.pos, 'WANTED  +36%', [1, 0.85, 0.4], 1.2); p.play('S_Bell', 0.3, 1.4); }
    },
  },
  'Long Rider': {
    name: 'Long Shot', short: 'Damage climbs with distance: up to +120% at 30 m. No spread when aimed.',
    text: 'The further the bullet flies the harder it lands: nothing extra inside eight metres, +120% at thirty and beyond. Aimed, it has no spread at all.',
    play: 'Keep the room between you and them. Back off, line them up, and let it go through.', fav: ['Marksman Scope', 'Piercing Tip', 'Heavy Rounds'], aff: { HeadshotDamage: 1.5, Pierce: 2 },
    spread: (p) => (p.aiming ? 0 : 1),
    pre: (p, E) => 1 + 1.2 * clamp((dist(p, E) - 800) / 2200, 0, 1),
    kill(p, E, C, g, h) { if (dist(p, E) > 2900 && p.game.time > (g.sayT || 0)) { g.sayT = p.game.time + 1.5; say(p, E.pos, 'LONG SHOT', [0.8, 0.9, 1]); } },
  },
  'Gold Rush': {
    name: 'Paydirt', short: 'Pays on every hit, and hits harder the richer you are: up to +100% at $6,000.',
    text: 'Every hit pays, and the gun hits harder the more money you are carrying: +1% for every $60, up to +100% at $6,000.',
    play: 'A reason not to spend. Hoard and it becomes a monster; every purchase is a choice to weaken it.', fav: ['Heavy Rounds', 'Rapid Bolt', 'Keen Sight'], aff: { MoneyGain: 1.5 }, proc: { Money: 2 },
    rich: (p) => clamp(p.money / 60000, 0, 1),
    sheet(p) { return { dmg: 1 + this.rich(p) }; },
    shot(p, S, W, g, C) { C.mult *= 1 + this.rich(p); },
    hud(p) { const r = this.rich(p); return [`PAYDIRT  +${Math.round(r * 100)}%`, r >= 1 ? '#ffd23a' : '#d8c890']; },
  },
  // ------------------------------------------------------------------ shotguns
  Sawbuck: {
    name: 'Both Barrels', short: 'Reload speed is also damage. A kill loads a barrel on the spot.',
    text: 'Faster hands hit harder: every 1% of reload speed is also 1% more damage. A blast that kills slips a fresh shell into the barrel at once.',
    play: 'Two shots, then the reload is the fight. Quick Hands is its damage part and its speed part at once.', fav: ['Quick Hands', 'Heavy Rounds', 'Split Barrel'], aff: { ReloadSpeed: 2 },
    sheet: (p) => ({ dmg: 1 + Math.max(0, p.stat('ReloadSpeed')) }),
    shot(p, S, W, g, C) { C.mult *= 1 + Math.max(0, p.stat('ReloadSpeed')); },
    kill(p, E, C) { const S = C.S; if (C.fed || S.reserve <= 0 || S.ammo >= p.magSize(S)) return; C.fed = true; S.ammo++; S.reserve--; p.play('S_Switch', 0.6, 1.5); },
  },
  Homesteader: {
    name: 'Hold the Line', short: 'Damage grows with max health and armor. Every blast that lands gives shield.',
    text: 'Built for someone who can take a hit: +1% damage for every 2 max health above 150 and for every point of armor, up to +150%. Every blast that lands gives 6 shield (at most every half second, to a quarter of your health) and shoves them back.',
    play: 'The tank gun. Your class level and your armor are its damage: stand in the doorway and do not move.', fav: ['Heavy Rounds', 'Leech Rounds'],
    tough: (p) => clamp(Math.max(0, p.maxHealth - 150) / 200 + Math.max(0, p.stat('Armor')) / 100, 0, 1.5),
    sheet(p) { return { dmg: 1 + this.tough(p) }; },
    shot(p, S, W, g, C) { C.mult *= 1 + this.tough(p); },
    post(p, E, C, g, h) {
      if (!C.shielded) { C.shielded = true; p.combatShield(6); }
      if (!h.killed && !E.isBoss && h.dir) E.applyKnock(V3(h.dir.x * 130, 30, h.dir.z * 130));
    },
    hud(p) { const t = this.tough(p); return t > 0 ? [`HOLD THE LINE  +${Math.round(t * 100)}%`, '#9fd0ff'] : null; },
  },
  Stampede: {
    name: 'Stampede', short: 'Each shell fires the next 8% faster and 4% harder until you reload.',
    text: 'Every shell fired makes the next come 8% faster and hit 4% harder, and it keeps building until you reload or let up for a second. The bigger the drum, the faster it ends.',
    play: 'Starts as a thump and ends as a roar. Magazine and ammo-saving parts are worth double here.', fav: ['Extended Mag', 'Feed Loop', 'Heavy Rounds'], aff: { MagSize: 2, AmmoSave: 2 },
    shot(p, S, W, g, C) { const T = p.game.time; if (T - (g.lastT || -9) > 1) g.run = 0; C.mult *= 1 + Math.min(1, 0.04 * (g.run || 0)); g.run = (g.run || 0) + 1; g.lastT = T; },
    rate: (p, S, W, g) => 1 + Math.min(2, 0.08 * Math.max(0, (g.run || 0) - 1)),
    reload(p, S, W, g) { g.run = 0; },
    tick(p, S, W, g) { if (g.run > 0 && p.game.time - (g.lastT || 0) > 1) g.run = 0; },
    hud: (p, S, W, g) => (g.run > 1 ? [`STAMPEDE  +${Math.round(Math.min(2, 0.08 * (g.run - 1)) * 100)}%`, g.run > 12 ? '#ff7a4a' : '#ffb347'] : null),
  },
  "Dragon's Breath": {
    name: 'Wildfire', short: 'Burning targets take +40%. What dies burning erupts and spreads it.',
    text: 'Pellets hit burning targets 40% harder, and anything that dies on fire erupts, setting everything around it alight. Those can erupt too.',
    play: 'Light the middle of the pack and watch it go round the room. Fire and blast parts feed it.', fav: ['Incendiary', 'Blast Cap', 'Split Barrel'], aff: { ExplosionRadius: 1.5 }, proc: { Ignite: 2, Explode: 1.5 },
    pre: (p, E) => (E.burnT > 0 ? 1.4 : 1),
    post(p, E, C, g, h) { E.sgWild = p.game.time + 5; E.sgWildD = Math.max(E.sgWildD || 0, C.base * 4); },
  },
  // ------------------------------------------------------------------ machine guns
  'Iron Mule': {
    name: 'Mule Kick', short: 'Every sixth round is a triple-damage slug. On-hit parts go off twice as often.',
    text: 'Every sixth round is a heavy slug: triple damage, a small blast, and it floors what it hits. Parts that trigger on a hit (fire, frost, bleed, arc, blast, gold) go off twice as often on this gun.',
    play: 'The gun to hang effects on. Stack the elemental parts and the belt does the rest.', fav: ['Incendiary', 'Cryo Cell', 'Arc Coil', 'Blast Cap', 'Serrated'], proc: 2,
    shot(p, S, W, g, C) { g.n = (g.n || 0) + 1; if (g.n % 6 === 0) { C.mult *= 3; C.slug = true; C.tracer = [1, 0.6, 0.2]; p.addShake(0.45); p.play('S_Blunt', 0.35, 0.8); } },
    post(p, E, C, g, h) {
      if (!C.slug || C.slugDone) return; C.slugDone = true;
      p.explodeAt(h.at, 200 * (1 + p.stat('ExplosionRadius')), C.base * 0.5, 0.5, false, false, [1, 0.6, 0.2], E);
      if (!E.dead) p.stun(E, 0.6);
    },
    hud: (p, S, W, g) => { const k = 5 - ((g.n || 0) % 6); return k === 0 ? ['SLUG UP', '#ff9a3a'] : null; },
  },
  Thresher: {
    name: 'Harvest', short: 'Every kill feeds four rounds back into the drum.',
    text: 'Every kill feeds four rounds straight back into the drum, free. In a crowd it never has to stop.',
    play: 'Useless on its own for the first second, unstoppable in a horde. Against one big target the drum still runs dry.', fav: ['Feed Loop', 'Rapid Bolt', 'Piercing Tip'], aff: { AmmoSave: 2 },
    kill(p, E, C) { const S = C.S, m = p.magSize(S); if (S.ammo < m) S.ammo = Math.min(m, S.ammo + 4); },
  },
  // ------------------------------------------------------------------ snipers
  Widowmaker: {
    name: 'First Blood', short: 'Double damage to anything at full health. A headshot kill returns the round.',
    text: 'Double damage against anything still at full health. A headshot kill puts the round back in the rifle.',
    play: 'One bullet, one body. It opens fights; it does not finish them. Never shoot the same thing twice.', fav: ['Marksman Scope', 'Heavy Rounds', 'Piercing Tip'], aff: { HeadshotDamage: 1.5, Damage: 1.25 },
    pre: (p, E, C) => (E.health >= E.maxHealth * 0.95 ? 2 : 1),
    kill(p, E, C, g, h) { if (!h.head || C.fed) return; C.fed = true; const S = C.S; if (S.ammo < p.magSize(S)) S.ammo++; say(p, E.pos, 'CLEAN KILL', [0.85, 0.95, 1]); },
  },
  'Railroad Spike': {
    name: 'Skewer', short: 'Gains +25% damage for every enemy it has gone through, and pins them.',
    text: 'The slug gathers force as it goes: +25% damage for every enemy it has already been through, and each one it passes is pinned in place. Every point of pierce adds another 15% to that.',
    play: 'The back of the line dies first. Make them queue up in a corridor, then pull the trigger once.', fav: ['Piercing Tip', 'Heavy Rounds', 'Quick Hands'],
    pierceGain: (p) => 0.25 + 0.15 * Math.max(0, p.stat('Pierce')), pin: 1.2,
  },
  // ------------------------------------------------------------------ launchers
  'Dynamite Dan': {
    name: 'Chain Reaction', short: 'Anything a blast kills drops a lit stick of its own.',
    text: 'Anything killed by the blast drops a lit stick of its own, which goes off for 70% a moment later. Those kills drop sticks too, four deep. Right click sets off every stick you have in the air or on the ground, there and then; it never aims down the sights.',
    aimKey(p, S) {
      const G = p.game; let n = 0;
      for (const P of G.projectiles.list) if (!P.done && P.kind === 'Grenade' && P.sx && P.sx.S === S) { G.projectiles.detonate(P, P.pos.clone()); n++; }
      if (n) p.play('S_UIMove', 0.6, 0.7); else p.play('S_Deny', 0.4);
    },
    play: 'Never fire at one enemy. Fire at the weakest one in the thickest part of the crowd.', fav: ['Blast Cap', 'Heavy Rounds', 'Split Barrel'], aff: { ExplosionRadius: 1.5 }, proc: { Explode: 2 },
    kill(p, E, C) {
      const gen = C.gen || 0; if (gen >= 4) return;
      const G = p.game, W = C.W, C2 = Object.assign({}, C, { gen: gen + 1, base: C.base * 0.7, seen: new Set(), hits: 0 });
      G.projectiles.spawn({ pos: E.pos.clone().add(V3(0, 40, 0)), vel: V3((Math.random() - 0.5) * 240, 380, (Math.random() - 0.5) * 240), damage: C2.base, splash: W.splash * 0.8 * (1 + p.stat('ExplosionRadius')), gravity: 1, bounces: 2, bounceDamp: 0.4, fuse: 0.55, kind: 'Grenade', radius: 10, color: [1, 0.5, 0.2], procCoef: 0.5, sx: C2 });
    },
  },
  Boomtown: {
    name: 'Death From Above', short: 'Airborne: +80% damage, bigger blast. Your own rockets throw you, unharmed.',
    text: 'While you are off the ground its rockets hit 80% harder and burst 30% wider. Your own blasts never hurt you and throw you half as far again.',
    play: 'Fire at your feet, fly, and shoot down. Extra jumps keep you up there longer.', fav: ['Spring Step', 'Heavy Rounds', 'Quick Hands'], aff: { ExplosionRadius: 1.5, AirDamage: 1.5 }, selfLaunch: 1.5,
    shot(p, S, W, g, C) { if (!p.grounded) { C.mult *= 1.8; C.splashMul = 1.3; if (p.game.time > (g.sayT || 0)) { g.sayT = p.game.time + 2; say(p, front(p), 'DEATH FROM ABOVE', [1, 0.6, 0.3]); } } },
    hud: (p) => (!p.grounded ? ['AIRBORNE  +80%', '#ff9a3a'] : null),
  },
  'Fireworks Finale': {
    name: 'Grand Finale', short: 'Extra projectiles are full-power rockets. The last shot fires twice as many.',
    text: 'Extra projectiles are full-power rockets on this launcher, not half. The last shot in the tube is the finale: twice as many rockets.',
    play: 'The multishot gun. Every Split Barrel is four more real rockets; reload fast to reach the finale again.', fav: ['Split Barrel', 'Quick Hands', 'Blast Cap'], aff: { Multishot: 1.5, ReloadSpeed: 1.5 }, fullMulti: true,
    shot(p, S, W, g, C) { if (C.last) { C.pelletMul = 2; p.addShake(0.8); say(p, front(p), 'GRAND FINALE', [1, 0.6, 0.85], 1.2); } },
    hud: (p, S) => (S.ammo === 1 ? ['FINALE NEXT', '#ff9ad8'] : null),
  },
  // ------------------------------------------------------------------ energy
  'Tesla Coil': {
    name: 'Conductor', short: 'Lightning grows 5% a jump. Pierce adds jumps; spare ones hit the first target again.',
    text: 'Lightning gains 5% with every jump instead of fading. Every point of pierce is another jump, and jumps that find nobody new go back into the first target at a quarter power each.',
    play: 'The more of them there are, the harder the last one is hit. Alone against a boss it still lands every jump.', fav: ['Piercing Tip', 'Arc Coil', 'Heavy Rounds'], aff: { Pierce: 2 }, proc: { Chain: 2 },
    chain: { mul: 1.05, back: 0.25, add: (p) => Math.round(Math.max(0, p.stat('Pierce'))) },
  },
  "Will-o'-Wisp": {
    name: 'Haunt', short: 'Whatever it kills rises as a wisp that hunts the next enemy and bursts.',
    text: 'Whatever it kills rises as a wisp that hunts down the nearest enemy and bursts on it. What the wisps kill rise too, five deep.',
    play: 'Kill the small ones first and send their ghosts at the big one. Damage decides whether the chain keeps going.', fav: ['Heavy Rounds', 'Blast Cap', 'Cryo Cell'], aff: { ExplosionRadius: 1.5, Damage: 1.25 },
    kill(p, E, C) {
      const gen = C.gen || 0; if (gen >= 5) return;
      const G = p.game, W = C.W, C2 = Object.assign({}, C, { gen: gen + 1, base: C.base * 0.85, seen: new Set(), hits: 0 });
      const col = [0.6, 1, 0.85];
      G.projectiles.spawn({ pos: E.pos.clone().add(V3(0, 70, 0)), vel: V3((Math.random() - 0.5) * 500, 520, (Math.random() - 0.5) * 500), damage: C2.base, splash: W.splash * (1 + p.stat('ExplosionRadius')), slow: W.slow, homing: 7, life: 4, kind: 'Orb', radius: 11, color: col, procCoef: 0.5, sx: C2, soft: true });
      G.fx.flash(E.pos, col, 80, 0.2, false);
    },
  },
  'Frostbite Beam': {
    name: 'Deep Freeze', short: 'Hold the beam to freeze a target. The frozen take double from everything else.',
    text: 'Hold the beam on a target for about a second to freeze it solid for three. Anything frozen takes double damage from everything except the beam, and shatters when it dies, chilling and hurting what is near. Bosses cannot be held still, but are frostbitten: +50%.',
    play: 'Half of a two-gun plan. Freeze, swap, and break them with the heaviest thing you carry.', fav: ['Cryo Cell', 'Extended Mag', 'Feed Loop'], aff: { MagSize: 1.5, AmmoSave: 1.5 }, proc: { Freeze: 2 }, frost: true,
    post(p, E, C, g, h) {
      const G = p.game; if (h.killed || E.sgFrozen > G.time) return;
      E.sgFrost = (E.sgFrostT > G.time ? E.sgFrost || 0 : 0) + 1; E.sgFrostT = G.time + 1.5;
      if (E.sgFrost < (E.isBoss ? 60 : E.elite ? 34 : 22)) return;
      E.sgFrost = 0; const dur = E.isBoss ? 4 : 3;
      E.sgFrozen = G.time + dur; E.sgFrozenAmt = E.isBoss ? 0.5 : 1;
      if (!E.isBoss) p.stun(E, dur);
      G.fx.frostBurst(E.pos, 160); p.play('S_Frost', 0.7, 1.1); say(p, E.pos, E.isBoss ? 'FROSTBITTEN' : 'FROZEN', [0.6, 0.9, 1], 1.2);
    },
  },
  'Hellfire Hose': {
    name: 'Scorched Earth', short: 'Leaves the ground burning. Enemies in your fire take +25% from everything.',
    text: 'The flame leaves the ground burning where it lands for four seconds. Enemies standing in your fire burn, and take 25% more damage from everything.',
    play: 'Paint the floor, not the enemy. Lay a road of fire and fight on the far side of it.', fav: ['Incendiary', 'Extended Mag', 'Feed Loop'], aff: { MagSize: 1.5, AmmoSave: 1.5 }, proc: { Ignite: 2 },
    flameEnd(p, C, g, at, hit) { if (hit || !C.flameAt) { if (!C.flameHit) C.flameAt = at.clone(); if (hit) C.flameHit = true; } },
    after(p, S, W, g, C) {
      const G = p.game; if (!C.flameAt || G.time < (g.zT || 0)) return; g.zT = G.time + 0.18;
      const fl = G.phys.raycast(C.flameAt.clone().add(V3(0, 20, 0)), V3(0, -1, 0), 500); if (!fl) return;
      const P0 = fl.point;
      for (const Z of p.gzones) if (Z.hose && Z.at.distanceTo(P0) < 120) { Z.t = 4; return; }
      let n = 0, old = -1; p.gzones.forEach((Z, i) => { if (Z.hose) { n++; if (old < 0) old = i; } }); if (n >= 16) p.gzones.splice(old, 1);
      p.gzones.push({ at: P0.clone(), r: 165, t: 4, tick: 0, dps: C.base * 6, hose: true, mark: 0.25 });
    },
  },
  // ------------------------------------------------------------------ wonder weapons
  Buzzsaw: {
    name: 'Rip Saw', short: 'Blades hit 30% harder after each wall bounce, and every cut bleeds.',
    text: 'A blade hits 30% harder after every wall it bounces off, and every cut bleeds for 40% more. Each ricochet part adds two bounces.',
    play: 'A small-room gun. Fire into corners and along walls, not at the enemy: the third bounce is the one that counts.', fav: ['Ricochet', 'Serrated', 'Piercing Tip'], aff: { Ricochet: 2 }, proc: { Bleed: 2 }, bounceGain: 0.3,
    sawBounces: (p) => 2 * Math.round(Math.max(0, p.stat('Ricochet'))),
    post(p, E, C, g, h) { if (!h.killed) E.applyBleed(h.dealt * 0.4); },
  },
  Thunderhead: {
    name: 'Static', short: 'Moving builds static: up to +150% damage and three more jumps.',
    text: 'Moving builds static and standing still bleeds it away. Each shot spends a little: at full charge it hits 150% harder, jumps three more times and bursts wider. The faster you move, the faster it fills.',
    play: 'Never stand still with it. Sprint, slide and dash between shots and it stays full.', fav: ['Swiftness', 'Quick Step', 'Arc Coil'], proc: { Chain: 1.5 },
    tick(p, S, W, g, dt) { const sp = Math.hypot(p.vel.x, p.vel.z); const k = sp / 840; g.c = clamp((g.c || 0) + (sp > 200 ? dt * 0.3 * Math.min(4, k * k) : -dt * 0.3), 0, 1); },   // 840 is a plain run: anything faster fills it faster than firing drains it
    shot(p, S, W, g, C) { const c = g.c || 0; C.mult *= 1 + 1.5 * c; C.chains += Math.round(3 * c); C.splashMul = 1 + 0.5 * c; g.c = Math.max(0, c - 0.09); if (c > 0.9) p.game.fx.flash(p.game.vm.muzzleWorld(), [1, 0.95, 0.5], 90, 0.12, true); },
    hud: (p, S, W, g) => [`STATIC  ${Math.round((g.c || 0) * 100)}%`, (g.c || 0) > 0.9 ? '#fff27a' : '#d8c890'],
  },
  'Fan of Knives': {
    name: '52 Pickup', short: 'Reload early and the rest of the deck is thrown at once.',
    text: 'Reload with rounds left and the rest of the deck goes at once: three knives for every round still in it, in a wide fan. A bigger deck is a bigger throw.',
    play: 'Throw a few fans, then reload on purpose with the pack on top of you. Reload speed is your fire rate.', fav: ['Quick Hands', 'Extended Mag', 'Piercing Tip'], aff: { ReloadSpeed: 2, MagSize: 1.5 },
    reload(p, S, W, g) {
      const n = S.ammo; if (n <= 0 || S.reserve <= 0) return;
      const G = p.game, k = Math.min(45, n * 3), dmg = W.dmg * (1 + 0.2 * S.tier);
      const muzzle = G.vm.muzzleWorld(), dir = new THREE.Vector3(); G.camera.getWorldDirection(dir);
      const up = new THREE.Vector3().setFromMatrixColumn(G.camera.matrixWorld, 1), prev = p.shotCtx;
      p.shotCtx = { sig: this, W, S, g, mult: 1, base: dmg, pierce: 0, chains: 0, seen: new Set(), hits: 0, gen: 0 };
      for (let i = 0; i < k; i++) p.fireProjectile(muzzle, dir.clone().applyAxisAngle(up, -(i - (k - 1) / 2) * Math.min(0.07, 1.4 / k)).add(V3(0, (Math.random() - 0.5) * 0.05, 0)).normalize(), dmg, 0.2, W);
      p.shotCtx = prev; S.ammo = 0; p.addShake(0.8); p.play('S_SwingBig', 0.8, 1.2); say(p, front(p), '52 PICKUP', [0.9, 0.9, 1], 1.2);
    },
    hud: (p, S) => (S.ammo > 0 && S.ammo < p.magSize(S) ? [`RELOAD THROWS  ${Math.min(45, S.ammo * 3)}`, '#cfd6de'] : null),
  },
  'Black Cat': {
    name: 'Jinx', short: 'No crit ceiling: past 100% it rolls double crits. Each non-crit adds +20% luck.',
    text: 'Crit chance has no ceiling on this rifle: anything past 100% is the chance of a double crit, half as hard again. Every shot that fails to crit, or hits nothing, adds +20% to the next until one does.',
    play: 'The luck gun. Stack crit chance past the point of sense and every shot is the lucky one.', fav: ['Keen Sight', 'Hollow Tip', 'Marksman Scope'], aff: { CritChance: 1.5, CritDamage: 1.5 }, critCap: 9,
    critAdd: (p, E, C, g) => 0.2 * (g.pity || 0),
    crit(p, E, C, g, rolled, cc) {
      if (C.cat === undefined) { C.cat = rolled; C.dbl = rolled && cc > 1 && Math.random() < cc - 1; if (rolled) g.pity = 0; if (C.dbl) say(p, E.pos, 'JINX', [0.8, 0.5, 1], 1.3); }
      return C.cat;
    },
    pre: (p, E, C) => (C.dbl ? 1.5 : 1),
    after(p, S, W, g, C) { if (!C.cat) g.pity = Math.min(5, (g.pity || 0) + 1); },
    hud: (p, S, W, g) => (g.pity > 0 ? [`LUCK  +${g.pity * 20}%`, '#c79aff'] : null),
  },
};

Object.assign(SIG, SIG2);   // the oddities: weapons that are not guns at all
// A gun's favoured parts work harder on it, but only half as much harder as they first did: x2 is x1.5, x1.5 is x1.25.
{ const half = (m) => 1 + (m - 1) * 0.5;
  for (const k in SIG) { const S = SIG[k];
    if (typeof S.proc === 'number') S.proc = half(S.proc); else if (S.proc) for (const f in S.proc) S.proc[f] = half(S.proc[f]);
    if (S.aff) for (const f in S.aff) S.aff[f] = half(S.aff[f]); } }
export const sigAmp = sig2Amp, sigAfter = sig2After;
export const sigOf = (W) => (W && !globalThis.__nosig && SIG[W.name]) || null;   // __nosig: the test harness measures a gun with and without its rule
// a gun's own running state lives on its slot and is thrown away when the slot holds a different gun
export function sigState(S) { if (!S.sg || S.sg.def !== S.def) S.sg = { def: S.def }; return S.sg; }
// how much more often an on-hit part of kind `fx` goes off on this gun
export const sigProc = (sig, fx) => (!sig || !sig.proc ? 1 : typeof sig.proc === 'number' ? sig.proc : sig.proc[fx] || 1);

// Things that outlive the shot and the gun: delayed blasts, and what happens when something poisoned, burning or frozen
// dies. They work whichever gun is in your hands by then, which is what makes a two-gun plan worth having.
export function sigTick(p, dt) {
  const G = p.game, Q = p.sgQ;
  if (Q && Q.length) for (let i = Q.length - 1; i >= 0; i--) { Q[i].t -= dt; if (Q[i].t <= 0) { const f = Q[i].fn; Q.splice(i, 1); f(); } }
  p.sgFxT = (p.sgFxT || 0) - dt;
  if (p.sgFxT <= 0) {
    p.sgFxT = 0.22;
    for (const E of G.enemies) if (!E.dead && E.sgFrozen > G.time) G.fx.add({ pos: E.pos.clone().add(V3((Math.random() - 0.5) * 50, 20 + Math.random() * 90, (Math.random() - 0.5) * 50)), life: 0.4, size0: 50, size1: 90, rot: Math.random() * 360, c0: [0.85, 0.96, 1, 0.9], c1: [0.5, 0.8, 1, 0], fadeOut: 0.6, tex: 'FX_Snow', kind: 'add', glow: 1.6 });
  }
  sig2Tick(p, dt);
  if (p.wield || p.slot.def < 0) return;
  const W = DATA.weapons[p.slot.def], sig = sigOf(W);
  if (sig && sig.tick) sig.tick(p, p.slot, W, sigState(p.slot), dt);
}
export function sigDeath(p, E, head) {
  const G = p.game, T = G.time, at = E.pos.clone();
  // a kill the shot did not see happen (it bled out a moment later, or a co-op host confirmed it) still belongs to the gun
  const L = E.sgLast;
  if (!E.sgKilled && L && T - L.t < 1.5 && L.C.sig && L.C.sig.kill) { E.sgKilled = true; L.C.sig.kill(p, E, L.C, L.C.g, { head: !!head, at, killed: true, dealt: 0, crit: false, dir: null }); }
  E.sgLast = null;
  if (E.sgVenom > T && E.bleedDps > 0) {                                  // Copperhead: the poison moves on
    const total = E.bleedDps * Math.max(0.5, E.bleedT) * 0.5;
    G.fx.puff(at.clone().add(V3(0, 50, 0)), [0.45, 0.9, 0.3], 120, 0.7); G.fx.ring(E.feet(), 380, [0.45, 0.9, 0.3], 0.35);
    for (const O of near(G, at, 380, E)) { O.applyBleed(total); O.sgVenom = T + 3.2; }
  }
  if (E.sgWild > T && E.burnT > 0) {                                      // Dragon's Breath: the fire moves on
    const dmg = E.sgWildD || 100, dps = E.burnDps;
    later(p, 0.16, () => {
      const R = 300 * (1 + p.stat('ExplosionRadius'));
      for (const O of near(G, at, R, E)) { O.applyBurn(Math.max(dps, dmg * 0.1), 3); O.sgWild = G.time + 5; O.sgWildD = Math.max(O.sgWildD || 0, dmg * 0.8); }
      G.fx.fireBurst(at, R * 0.8); p.explodeAt(at, R, dmg, 0, true, false, [1, 0.5, 0.12], null);
    });
  }
  if (E.sgFrozen > T) {                                                   // Frostbite Beam: frozen things shatter
    const dmg = Math.min(E.maxHealth * 0.3, 4000);
    later(p, 0.05, () => {
      G.fx.frostBurst(at, 330); G.audio.playAt('S_ShieldBreak', at, 0.7, 1.3);
      for (const O of near(G, at, 330, E)) { O.applySlow(0.6, 3); p.dealDamage(O, dmg, O.pos, O.pos.clone().sub(at).normalize(), false, 0, true, 0, 0, 0, 0, [0.6, 0.9, 1]); }
    });
  }
}

// the card text every station shows: the gun's rule in a line
for (const W of DATA.weapons) { const s = SIG[W.name]; if (s) { W.base = W.desc; W.desc = `${s.name}: ${s.short}`; } }
