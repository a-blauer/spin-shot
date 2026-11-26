// ---- Forging at the Compressor. With Compressor: Fusion (rank 17) any two gun parts go on the dishes and come out as one
// forged part; Compressor: Crucible (rank 20) adds a third dish.
//
// A forged part keeps everything its parts did, at full strength, in one slot, and wakes one new effect, its resonance.
// The resonance is read from the dishes in order:
//   dish 1, WHEN   what sets it off       (its aspect's trigger)
//   dish 2, WHAT   what happens           (its aspect's payload)
//   dish 3, HOW    how it happens         (its aspect's twist; optional, a two-part forge has none)
// Every gun part has an aspect (a fused part has both of its elements, a pressed part its own part's). Ten aspects,
// so 100 resonances from two parts and 1000 from three, on top of whatever the parts themselves do.
// When more than one dish shares the WHAT dish's aspect the resonance is stronger (Resonance II and III).
//
// The resonances are built to lean on the rest of the parts: they set statuses the status parts ride on (Accelerant,
// Brittle Rounds, Open Wound, Shatter, Contagion, Catalyst, Bloodbank, Heat Shield), Lingering makes those statuses
// last, Proc chance makes them likelier, Explosion radius widens their blasts, Conductor carries burn and bleed down
// their lightning. One forged part's resonance can set off another forged part's (lightning from one counts as
// lightning for the other, its blast as a blast), but only once: a chain is two links long.
import * as THREE from 'three';
import { DATA } from './data.js';
import { CORE_SYM, BLADE } from './cores.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

export const ASPECTS = {
  fire:   { name: 'Fire',   hex: '#ff7a1a', rgb: [1, 0.5, 0.15],    sym: 'Incendiary' },
  frost:  { name: 'Frost',  hex: '#7fd8ff', rgb: [0.6, 0.88, 1],    sym: 'Cryo Cell' },
  blood:  { name: 'Blood',  hex: '#d0252a', rgb: [0.9, 0.2, 0.25],  sym: 'Serrated' },
  storm:  { name: 'Storm',  hex: '#9a8cff', rgb: [0.6, 0.65, 1],    sym: 'Arc Coil' },
  blast:  { name: 'Blast',  hex: '#ff5a3a', rgb: [1, 0.55, 0.25],   sym: 'Blast Cap' },
  edge:   { name: 'Edge',   hex: '#ff6a6a', rgb: [1, 0.35, 0.35],   sym: 'Keen Sight' },
  reach:  { name: 'Reach',  hex: '#ffd24d', rgb: [1, 0.85, 0.35],   sym: 'Split Barrel' },
  rhythm: { name: 'Rhythm', hex: '#ffe36a', rgb: [1, 0.9, 0.45],    sym: 'Rapid Bolt' },
  grip:   { name: 'Grip',   hex: '#5a8aff', rgb: [0.4, 0.6, 1],     sym: 'Tether' },
  life:   { name: 'Life',   hex: '#7dff8a', rgb: [0.5, 1, 0.6],     sym: 'Leech Rounds' },
};
export const ASPECT_ORDER = Object.keys(ASPECTS);

// every gun part's aspect
export const PART_ASPECT = {
  'Incendiary': 'fire', 'Accelerant': 'fire',
  'Cryo Cell': 'frost', 'Brittle Rounds': 'frost', 'Shatter': 'frost',
  'Serrated': 'blood', 'Open Wound': 'blood',
  'Arc Coil': 'storm', 'Conductor': 'storm', 'Static Build': 'storm',
  'Heavy Rounds': 'blast', 'Blast Cap': 'blast', 'Concussive': 'blast', 'Lodestone': 'blast', 'Hollow Charge': 'blast',
  'Keen Sight': 'edge', 'Hollow Tip': 'edge', 'Marksman Scope': 'edge', 'Steady Barrel': 'edge', 'Death Mark': 'edge',
  'Piercing Tip': 'reach', 'Split Barrel': 'reach', 'Ricochet': 'reach', 'Bank Shot': 'reach', 'Splitter': 'reach', 'Grapeshot': 'reach',
  'Rapid Bolt': 'rhythm', 'Extended Mag': 'rhythm', 'Quick Hands': 'rhythm', 'Feed Loop': 'rhythm', 'Holster Loader': 'rhythm', 'Echo Chamber': 'rhythm', 'Heat Sink': 'rhythm',
  'Tether': 'grip', 'Undertow': 'grip', 'Pinning Bolt': 'grip', 'Lingering': 'grip',
  'Leech Rounds': 'life', 'Whetstone': 'life', 'Salvage Rounds': 'life', 'Catalyst': 'life', 'Contagion': 'life',
};
const ELEM = { fire: 'fire', ice: 'frost', blood: 'blood', shock: 'storm' };
export const aspectsOf = (U) => {
  if (!U || U.kind !== 'gun' || U.forged) return [];
  if (U.fuse) return U.fuse.split('+').map((e) => ELEM[e]);
  const a = PART_ASPECT[U.pressed || U.name]; return a ? [a] : [];
};

// ---- the three tables. Numbers are the resonance's own; `k` (resonance level) scales damage and healing, not reach.
const WHEN = {
  fire:   { ch: 0.15, text: (c) => `${c} when you hit a burning enemy` },
  frost:  { ch: 0.15, text: (c) => `${c} when you hit a chilled enemy` },
  blood:  { ch: 0.15, text: (c) => `${c} when you hit a bleeding enemy` },
  grip:   { ch: 0.18, text: (c) => `${c} when you hit an enemy that is stunned, pinned, tethered or being pulled` },
  storm:  { ch: 0.2,  text: (c) => `${c} each time your lightning strikes an enemy` },
  blast:  { ch: 0.35, cd: 0.8, text: (c) => `${c} each time one of your blasts goes off` },
  edge:   { ch: 0.25, text: (c) => `${c} on a critical hit or a headshot` },
  reach:  { ch: 0.25, text: (c) => `${c} when one shot goes on to hit another enemy` },
  rhythm: { every: 10, text: (c, n) => `every ${n}th hit with this gun` },
  life:   { ch: 0.5,  text: (c) => `${c} when you kill an enemy that carries a status` },
};
const pc = (x) => `${Math.round(x * 100)}%`;
const WHAT = {
  fire:   { text: (k, m) => `everything within ${m(3)} m catches fire, burning for ${pc(0.5 * k)} a second for 3 s` },
  frost:  { text: (k, m) => `a frost nova chills everything within ${m(3.5)} m and hits it for ${pc(0.4 * k)}` },
  blood:  { text: (k, m, h) => `${5 + h * 2} bone shards burst out at enemies within 5 m for ${pc(0.35 * k)} each and make them bleed` },
  storm:  { text: (k, m, h) => `lightning leaps to ${3 + h * 2} enemies for ${pc(0.5 * k)} each` },
  blast:  { text: (k, m) => `it explodes for ${pc(0.9 * k)} within ${m(2.3)} m` },
  edge:   { text: (k) => `the enemy is marked (it takes 30% more damage from you for 4 s) and struck for ${pc(0.6 * k)}` },
  reach:  { text: (k, m, h) => `${3 + h * 2} seeking shots fly at enemies nearby for ${pc(0.45 * k)} each` },
  rhythm: { text: (k) => `${pc(0.15 * k)} of the magazine goes back in and the gun fires ${pc(0.25 * k)} faster for 3 s` },
  grip:   { text: (k, m) => `a pull drags enemies within ${m(4.8)} m together for 1.2 s, then bursts for ${pc(0.5 * k)}` },
  life:   { text: (k) => `you heal ${pc(0.025 * k)} of your health and gain ${Math.round(8 * k)} shield` },
};
const HOW = {
  fire:   'it leaves the ground burning for 3 s',
  frost:  'everything it touches is chilled',
  blood:  'everything it hurts bleeds',
  storm:  'it happens again a moment later at the nearest other enemy',
  blast:  'it is half again as large and knocks ordinary enemies down',
  edge:   'it does half again as much damage, and that damage can crit',
  reach:  'it also happens at a second enemy nearby',
  rhythm: 'it can happen twice as often',
  grip:   'it drags what it touches toward its centre and slows it',
  life:   'it heals you for 5% of the damage it deals',
};
const NOUN = { fire: 'Wildfire', frost: 'Rime', blood: 'Thornburst', storm: 'Thunderhead', blast: 'Powder Keg', edge: 'Deadeye', reach: 'Scattershot', rhythm: 'Clockwork', grip: 'Snare', life: 'Mercy' };
const ADJ = { fire: 'Kindled', frost: 'Rimed', blood: 'Barbed', storm: 'Echoing', blast: 'Heavy', edge: 'Keen', reach: 'Forked', rhythm: 'Quick', grip: 'Binding', life: 'Kind' };
const ROMAN = ['', '', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX'];

const join = (L, w) => (L.length < 2 ? L[0] || '' : L.slice(0, -1).join(', ') + ` ${w} ` + L[L.length - 1]);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// What the dishes would make: null when they make nothing; { why } when they cannot; else the plan.
export function forgePlan(us) {
  const Us = us.map((u) => DATA.upgrades[u]);
  if (us.length < 2 || us.length > 3) return null;
  if (Us.some((U) => !U || U.kind !== 'gun')) return { why: 'Only gun parts go on the dishes.' };
  if (Us.some((U) => U.forged)) return { why: 'A forged part cannot be forged again.' };
  const roles = Us.map(aspectsOf);
  if (roles.some((r) => !r.length)) return { why: `${Us[roles.findIndex((r) => !r.length)].name} has no aspect the Compressor can read.` };
  const [when, what] = roles, how = roles[2] || [];
  const L = roles.filter((r) => r.some((a) => what.includes(a))).length, k = 1 + 0.3 * (L - 1);
  const quick = how.includes('rhythm'), heavy = how.includes('blast') ? 1 : 0;
  return { us: us.slice(), Us, when, what, how, L, k, quick, heavy };
}

// the words of a plan
export function forgeText(P) {
  const mr = (x) => String(Math.round(x * (P.heavy ? 1.5 : 1) * 10) / 10);
  const split = P.what.length > 1 ? 0.6 : 1;
  const whens = P.when.map((a) => { const W = WHEN[a]; if (W.every) return W.text('', P.quick ? 6 : W.every); return W.text(pc(Math.min(1, W.ch * (P.quick ? 2 : 1))) + ' chance', 0); });
  const whats = P.what.map((a) => WHAT[a].text(P.k * split, mr, P.heavy));
  const hows = P.how.map((a) => HOW[a]);
  let s = `${cap(join(whens, 'or'))}: ${join(whats, 'and')}${P.what.length > 1 ? ' (each at 60%)' : ''}`;
  if (hows.length) s += `; ${join(hows, 'and')}`;
  s += '.';
  if (P.L > 1) s += ` Resonance ${['', '', 'II', 'III'][P.L]}: ${P.L === 3 ? '60' : '30'}% stronger.`;
  return s;
}
export function forgeName(P) {
  const noun = P.what.map((a) => NOUN[a]).join('-');
  const adj = P.how.length ? P.how.map((a) => ADJ[a]).join(' ') + ' ' : '';
  return (P.L === 3 ? 'Pure ' : '') + adj + noun;
}

// its symbol: WHAT on top, WHEN below left, HOW below right
export function forgeSym(P) {
  const sym = (a) => CORE_SYM[ASPECTS[a].sym] || CORE_SYM.Lingering || '';
  return `<g transform="translate(6.2 0) scale(.48)">${sym(P.what[0])}</g><g transform="translate(0 12.4) scale(.46)">${sym(P.when[0])}</g>` + (P.how.length ? `<g transform="translate(12.6 12.4) scale(.46)">${sym(P.how[0])}</g>` : '');
}
export const forgeHolds = (P) => `Holds ${join(P.Us.map((U) => U.name), 'and')} at full strength.`;
// the forged part itself, made once per recipe and kept for the rest of the session
const MADE = new Map();
export function forgeIndex(us) {
  const P = forgePlan(us); if (!P || P.why) return -1;
  const key = P.Us.map((U) => U.name).join('|');
  if (MADE.has(key)) return MADE.get(key);
  let name = forgeName(P), n = 1; while (DATA.upgrades.some((U) => U.name === name + ROMAN[n])) n++; name += ROMAN[n];
  const hex = ASPECTS[P.what[0]].hex;
  const holds = forgeHolds(P);
  const def = {
    name, rarity: 'Legendary', hex, glyph: 'FRG', kind: 'gun', look: P.Us[1].look || P.Us[0].look || '', stacks: 99, trigger: null, fx: null, chance: 0, mag: 0, cd: 0, insp: '', suit: 'None', core: true, cut: true, noDrop: true,
    mods: P.Us.flatMap((U) => U.mods.map(([s, v]) => [s, v])),
    desc: `${holds} ${forgeText(P)}`,
    forged: { parts: P.us, when: P.when, what: P.what, how: P.how, k: P.k, L: P.L, quick: P.quick, heavy: P.heavy, key },
  };
  DATA.upgrades.push(def); const i = DATA.upgrades.length - 1; MADE.set(key, i);
  CORE_SYM[name] = forgeSym(P);
  // on a blade it is its parts' blade effects (the resonance is a gun's)
  const B = P.Us.map((U) => BLADE[U.name]).filter(Boolean);
  if (B.length) BLADE[name] = [B.flatMap((b) => b[0]), B.map((b, j) => (j ? b[1].charAt(0).toLowerCase() + b[1].slice(1) : b[1])).join('; ')];
  return i;
}

// ================================================================== at work
// p.forges is set by Player.recompute: the forged parts on the gun in your hands.
const near = (G, c, r, skip) => G.enemies.filter((E) => E !== skip && !E.dead && !E.emerging && !E.burrowed && E.pos.distanceTo(c) < r).sort((a, b) => a.pos.distanceTo(c) - b.pos.distanceTo(c));
const statusOn = (E, t) => E.burnT > 0 || E.bleedT > 0 || (E.slowT > 0 && E.slowAmt > 0) || E.shockT > t || E.markUntil > t || E.tetherUntil > t;
const gripped = (p, E, t) => E.staggerT > 0 || E.pinT > t || E.tetherUntil > t || (p.wells || []).some((Z) => Z.at.distanceTo(E.pos) < Z.r);

function ready(p, f, base) {
  const G = p.game, F = f.F, W = F.when.map((a) => WHEN[a]);
  const cd = Math.max(...W.map((w) => w.cd || 0.5)) * (F.quick ? 0.5 : 1);
  if (G.time - (p.forgeAt[f.u] || -99) < cd) return false;
  const ch = Math.min(1, base * (F.quick ? 2 : 1) * (1 + p.stat('ProcChance')) * (p.swapBoost ? 2 : 1));
  if (ch < 1 && Math.random() >= ch) return false;
  p.forgeAt[f.u] = G.time; return true;
}
const chanceOf = (F, ok) => Math.max(0, ...F.when.filter(ok).map((a) => WHEN[a].ch || 0));

// a hit with this gun (not a proc's)
export function forgeHit(p, E, dealt, crit, head, at, procCoef) {
  if (!p.forges || !p.forges.length || (p.forgeDepth || 0) > 0) return;
  const t = p.game.time, C = p.shotCtx;
  let second = false;
  if (C) { const s = C.fset || (C.fset = new Set()); if (!s.has(E)) { s.add(E); second = s.size >= 2; } }
  for (const f of p.forges) {
    const F = f.F;
    if (F.when.includes('rhythm')) { p.forgeN[f.u] = (p.forgeN[f.u] || 0) + 1; if (p.forgeN[f.u] >= (F.quick ? 6 : 10)) { p.forgeN[f.u] = 0; p.forgeAt[f.u] = t; fire(p, f, E, at, dealt); continue; } }
    const ok = (a) => (a === 'fire' && E.burnT > 0) || (a === 'frost' && E.slowT > 0 && E.slowAmt > 0) || (a === 'blood' && E.bleedT > 0) || (a === 'grip' && gripped(p, E, t)) || (a === 'edge' && (crit || head)) || (a === 'reach' && second);
    const ch = chanceOf(F, ok); if (!ch) continue;
    if (ready(p, f, ch * procCoef)) fire(p, f, E, at, dealt);
  }
}
// something else of yours happened: 'arc' (your lightning struck E), 'blast' (one of your blasts went off at `at`), 'kill'
export function forgeEvent(p, kind, E, at) {
  if (!p.forges || !p.forges.length || (p.forgeDepth || 0) > 1) return;
  const t = p.game.time;
  for (const f of p.forges) {
    if (p.forgeFiring === f.u) continue;   // a resonance never sets off itself
    const F = f.F;
    const ok = (a) => (a === 'storm' && kind === 'arc') || (a === 'blast' && kind === 'blast') || (a === 'life' && kind === 'kill' && E && statusOn(E, t));
    const ch = chanceOf(F, ok); if (!ch) continue;
    if (ready(p, f, ch)) fire(p, f, E && !E.dead ? E : null, at || (E ? E.pos : p.pos), p.power());
  }
}
export function tickForge(p, dt) {
  if (p.forgeRofT > 0) { p.forgeRofT -= dt; if (p.forgeRofT <= 0) p.forgeRof = 0; }
  const L = p.forgeLater; if (!L || !L.length) return;
  for (let i = L.length - 1; i >= 0; i--) { const q = L[i]; q.t -= dt; if (q.t > 0) continue; L.splice(i, 1); if (q.T && !q.T.dead) fire(p, q.f, q.T, q.T.pos.clone(), q.d, true); }
}

// the resonance itself
function fire(p, f, T, at, d, again = false) {
  const G = p.game, F = f.F, k = F.k, heavy = F.heavy, R = (heavy ? 1.5 : 1) * (1 + (p.stat('ExplosionRadius') || 0) * 0.5);
  const how = F.how, keen = how.includes('edge'), kind = how.includes('life');
  p.forgeDepth = (p.forgeDepth || 0) + 1; const prevF = p.forgeFiring; p.forgeFiring = f.u; p.procDepth++;
  const one = (T0, c0) => {
    const c = (T0 && !T0.dead ? T0.pos : c0).clone(), touched = new Set(); let sum = 0, status = false;
    const col = ASPECTS[F.what[0]].rgb;
    const hurt = (E, amt, cc = col) => {
      if (!E || E.dead) return 0;
      let a = amt; if (keen) { a *= 1.5; if (Math.random() < p.stat('CritChance')) a *= 2 + p.stat('CritDamage'); }
      const got = p.dealDamage(E, a, E.pos, V3(0, 0, 0), false, 0, true, 0, 0, 0, 0, cc) || 0; sum += got; touched.add(E); return got;
    };
    const split = F.what.length > 1 ? 0.6 : 1, kk = k * split;
    for (const a of F.what) switch (a) {
      case 'fire': { const r = 300 * R; for (const E of near(G, c, r, null)) { E.applyBurn(0.5 * kk * d, 3); touched.add(E); } G.fx.fireBurst(c, r); G.audio.playAt('S_Explode', c, 0.35, 1.4); status = true; break; }
      case 'frost': { const r = 350 * R; for (const E of near(G, c, r, null)) { E.applySlow(0.45, 2.5); hurt(E, 0.4 * kk * d, [0.6, 0.88, 1]); } G.fx.frostBurst(c, r); G.audio.playAt('S_Frost', c, 0.45); status = true; break; }
      case 'blood': { const L = near(G, c, 500 * R, null).slice(0, 5 + heavy * 2); for (const E of L) { G.fx.tracer(c.clone().add(V3(0, 50, 0)), E.pos.clone().add(V3(0, 50, 0)), [0.95, 0.85, 0.75], 3, 0.12); hurt(E, 0.35 * kk * d, [0.9, 0.2, 0.25]); if (!E.dead) E.applyBleed(0.6 * kk * d); } G.fx.puff(c.clone().add(V3(0, 40, 0)), [0.6, 0.12, 0.12], 70, 0.3); G.audio.playAt('S_Gib', c, 0.4, 1.2); status = true; break; }
      case 'storm': {
        const carry = p.S.Conductor && T0 && !T0.dead ? { burn: T0.burnT > 0 ? T0.burnDps : 0, bleed: T0.bleedT > 0 ? T0.bleedDps * T0.bleedT : 0 } : null;
        let from = c.clone().add(V3(0, 60, 0)); const done = new Set(T0 ? [T0] : []);
        for (let j = 0; j < 3 + heavy * 2 + (p.S.Conductor ? 1 : 0); j++) {
          let best = null, bd = 700 * 700; for (const E of near(G, from, 700, null)) { if (done.has(E)) continue; const q = E.pos.distanceToSquared(from); if (q < bd) { bd = q; best = E; } }
          if (!best) break; done.add(best);
          G.fx.arc(from, best.pos.clone().add(V3(0, 60, 0)), [0.6, 0.65, 1]); hurt(best, 0.5 * kk * d, [0.55, 0.8, 1]);
          best.shockT = G.time + 3; if (carry && !best.dead) { if (carry.burn) best.applyBurn(carry.burn, 3); if (carry.bleed) best.applyBleed(carry.bleed); }
          if (!best.dead) forgeEvent(p, 'arc', best, best.pos); from = best.pos.clone().add(V3(0, 60, 0));
        }
        G.audio.playAt('S_Zap', c, 0.45, 1.1); status = true; break;
      }
      case 'blast': { const before = sum; p.explodeAt(c.clone().add(V3(0, 40, 0)), 230 * R, 0.9 * kk * d, 0, true, false, [1, 0.55, 0.25], null); for (const E of near(G, c, 230 * R, null)) touched.add(E); sum = before + 0.9 * kk * d * touched.size; break; }
      case 'edge': {
        const E = T0 && !T0.dead ? T0 : near(G, c, 700, null)[0];
        if (E) { E.markAmt = Math.max(E.markUntil > G.time ? E.markAmt || 0 : 0, 0.3); E.markUntil = Math.max(E.markUntil || 0, G.time + 4); hurt(E, 0.6 * kk * d, [1, 0.35, 0.35]); G.hud.floater(E.pos.clone().add(V3(0, 70, 0)), 'MARKED', [1, 0.35, 0.4], 0.9); G.fx.ring(E.feet ? E.feet() : E.pos, 90, [1, 0.35, 0.35], 0.3); status = true; }
        G.audio.playAt('S_Crit', c, 0.4, 1.2); break;
      }
      case 'reach': {
        const L = near(G, c, 800, T0 && !T0.dead ? T0 : null).slice(0, 3 + heavy * 2);
        for (const E of L) { G.fx.tracer(c.clone().add(V3(0, 60, 0)), E.pos.clone().add(V3(0, 50, 0)), [1, 0.85, 0.35], 3, 0.1); hurt(E, 0.45 * kk * d, [1, 0.85, 0.35]); }
        G.audio.playAt('S_Ricochet', c, 0.45, 1.3); break;
      }
      case 'rhythm': {
        const S = p.slot; if (S && S.def >= 0) S.ammo = Math.min(p.magSize(S), S.ammo + Math.max(1, Math.ceil(0.15 * kk * p.magSize(S))));
        p.forgeRof = Math.max(p.forgeRof || 0, 0.25 * kk); p.forgeRofT = 3; p.play('S_MagIn', 0.5, 1.3);
        G.fx.ring(V3(p.pos.x, p.pos.y - 85, p.pos.z), 110, [1, 0.9, 0.45], 0.25); break;
      }
      case 'grip': { const r = 480 * R; p.wells.push({ at: c.clone(), t: 1.2, r, dmg: 0.5 * kk * d }); for (const E of near(G, c, r, null)) touched.add(E); G.fx.ring(c, r, [0.4, 0.6, 1], 0.4); G.audio.playAt('S_Grapple', c, 0.4, 0.7); status = true; break; }
      case 'life': { p.combatHeal(p.maxHealth * 0.025 * kk); p.overshield = Math.min(p.shieldCap(), p.overshield + 8 * kk); G.fx.heal(p.pos.clone().addScaledVector(p.forward(), 110).add(V3(0, 30, 0))); p.play('S_PowerUp', 0.35, 1.4); break; }
    }
    // the twist on what it touched (a payload that touches no one, like a heal, works on what is near where it went off)
    const hit = touched.size ? [...touched].filter((E) => !E.dead) : near(G, c, 300, null);
    for (const a of how) switch (a) {
      case 'fire': p.gzones.push({ at: T0 && T0.feet ? T0.feet() : c.clone(), r: 220 * R, t: 3, tick: 0, dps: 0.3 * k * d }); status = true; break;
      case 'frost': for (const E of hit) E.applySlow(0.3, 2); status = true; break;
      case 'blood': for (const E of hit) if (!E.dead) E.applyBleed(0.4 * k * d); status = true; break;
      case 'grip': for (const E of hit) { if (E.dead) continue; E.applySlow(0.25, 2); if (!E.isBoss) { const v = c.clone().sub(E.pos).setY(0); const L2 = v.length(); if (L2 > 30) E.applyKnock(v.multiplyScalar(Math.min(500, L2 * 2.2) / L2).add(V3(0, 120, 0))); } } break;
      case 'blast': for (const E of hit) if (!E.isBoss && !E.dead) p.stun(E, 0.5); break;
      case 'life': if (sum > 0) p.combatHeal(sum * 0.05); break;
    }
    if (status && p.S.HeatSink) p.heatSink();
    return touched;
  };
  const first = one(T, at);
  // Forked: once more at another enemy; Echoing: once more a moment later
  if (!again && how.includes('reach')) { const O = near(G, (T && !T.dead ? T.pos : at), 700, T).find((E) => !first.has(E)) || near(G, (T && !T.dead ? T.pos : at), 700, T)[0]; if (O) one(O, O.pos); }
  if (!again && how.includes('storm')) { const O = near(G, (T && !T.dead ? T.pos : at), 900, T)[0]; if (O) (p.forgeLater || (p.forgeLater = [])).push({ t: 0.45, f, T: O, d }); }
  p.procDepth--; p.forgeFiring = prevF; p.forgeDepth--;
}

// the three lines an aspect gives, for the Compressor's own list
export function forgeRoles(a) {
  const W = WHEN[a], m = (x) => String(x);
  return { when: cap(W.every ? W.text('', W.every) : W.text(pc(W.ch) + ' chance')), what: cap(WHAT[a].text(1, m, 0)), how: cap(HOW[a]) };
}
// test only: set a forged part's resonance off at an enemy
export function forgeFireTest(p, u, T) { const f = (p.forges || []).find((x) => x.u === u); if (f) fire(p, f, T, T ? T.pos.clone() : p.pos.clone(), p.power()); return !!f; }
