// Thimblewick at run time: puts you in the village (no enemies, no guns out, the sky open), stands its people in their
// places, and sets out the things you use: the shop counter, your wardrobe, the challenge board, the casino's tables and
// machines, and the Way Down. Using one calls game.onVillage(kind, arg), which main.js answers with the right window.
import * as THREE from 'three';
import { V } from './mapkit.js';
import { Interactable } from './interact.js';
import { ARENAS, VILLAGE_IDX } from './map_descent.js';
import { VSPOTS } from './map_village.js';
import { buildCharacter, animateCharacter } from './character.js';
import { DEFAULT_LOOK, COSMETICS } from './cosmetics.js';
import { buildPortal, tickPortal } from './portal.js';
import { Meta } from './meta.js';
import { makeSign, signFontsReady } from './village_signs.js';
import { CasinoRigs } from './casino_world.js';
import { Net } from './net.js';
import { GNOME_LOOK, gnomeOf } from './town.js';

// the people of the village, dressed from the same wardrobe as you
const look = (o) => { const L = Object.assign({}, DEFAULT_LOOK, o); for (const k of Object.keys(o)) if (COSMETICS[k] && !COSMETICS[k].some((I) => I.id === o[k])) L[k] = DEFAULT_LOOK[k]; return L; };
const PEOPLE = {
  // the three brought home from the bottom of the Descent: here only once rescued
  gunshop: { name: 'Old Flintwhistle', look: GNOME_LOOK.forge, need: 'forge' },
  trainer: { name: 'Old Hobnail', look: GNOME_LOOK.trainer, need: 'trainer' },
  lectern: { name: 'Mother Inkcap', look: GNOME_LOOK.lectern, need: 'lectern' },
  shop: { name: 'Mossbottom', look: look({ hat: 'acorn', outfit: 'apron', beard: 'round', haircol: 'grey', nose: 'potato', tone: 't3', hatcol: 'mustard', face: 'none' }) },
  gate: { name: 'Old Brannock', look: look({ hat: 'cap', outfit: 'rancher', beard: 'braid', haircol: 'ginger', nose: 'bulb', tone: 't5', back: 'pack' }) },
  roulette: { name: 'Pip', look: look({ hat: 'gambler', outfit: 'quilted', beard: 'short', haircol: 'black', nose: 'button', tone: 't9', hatcol: 'red' }) },
  blackjack: { name: 'Dame Fennel', look: look({ hat: 'curl', hatcol: 'plum', outfit: 'drifter', beard: 'none', stache: 'none', hair: 'long', haircol: 'auburn', nose: 'pointed', tone: 't1', blush: 'rosy' }) },
  dice: { name: 'Clatterby', look: look({ hat: 'jester', hatcol: 'teal', hattip: 'bell', outfit: 'singlet', beard: 'forked', haircol: 'brown', nose: 'hook', tone: 't4' }) },
};
const FOLK = [
  look({ hat: 'mushroom', outfit: 'rancher', beard: 'curly', haircol: 'blonde', tone: 't10' }), look({ hat: 'stocking', hatcol: 'forest', outfit: 'drifter', beard: 'twin', haircol: 'grey', tone: 't2' }),
  look({ hat: 'wizard', hatcol: 'plum', hattip: 'star', outfit: 'duster', beard: 'wizard', haircol: 'snow', tone: 't3' }), look({ hat: 'pot', outfit: 'apron', beard: 'none', stache: 'walrus', haircol: 'dkbrown', tone: 't11' }),
  look({ hat: 'gnome', hatcol: 'pink', outfit: 'quilted', beard: 'braid', haircol: 'ginger', tone: 't1', hattip: 'flower' }),
];
// what each says when you walk up, before you open their window
const HELLO = {
  gunshop: ['Bring me fragments and I’ll bring you a gun.', 'Glad to be out of that cage. Glad to be at an anvil again.'],
  trainer: ['Every class has more in it than you know. Let’s find it.', 'Points from your runs buy lessons here. Come on, then.'],
  lectern: ['Shall I read you a page? The road gets harder; the haul gets richer.', 'Every page has a price, and every price a payment.'],
  shop: ['Hats, boots, coats and buttons. Gold only, no credit.', 'Fresh from the tinker’s cart. Have a look.'],
  gate: ['The Way Down. Mind your step.', 'Ready when you are. Gather your party first.'],
  roulette: ['Red or black? Place your bets.'], blackjack: ['Twenty-one, dear. Sit down.'], dice: ['Over or under? Roll the bones!'],
};

export class Village {
  constructor(game) {
    this.g = game; this.on = false; this.built = false; this.people = []; this.uses = []; this.t = 0;
    this.A = ARENAS[VILLAGE_IDX];
  }
  // local village coordinates to the world (three.js x, z)
  w(x, y) { return [this.A.c[0] + x, this.A.c[1] + y]; }
  // ---- arrive in the village: everything put away, the sky out, standing on the south road looking up the valley
  enter() {
    const g = this.g, P = g.player; if (!this.A) return;
    if (!this.built) this.build();
    this.on = true; g.village = this;
    g.phase = 'Village'; g.phaseTimer = 0; g.round = 0;
    if (g.descent) { g.descent.wipe(); g.descent.arena = VILLAGE_IDX; g.descent.room = 0; }
    for (const E of g.enemies) E.remove = true; g.hazards.clear();
    g.world.showChunk(VILLAGE_IDX);
    g.env.noSky = false;
    for (const p of this.people) p.root.visible = !p.need || Meta.gnomeHome(p.need); for (const I of this.uses) { I.enabled = true; I.group.visible = true; } for (const M of this.signs || []) M.visible = true; if (this.rigs) this.rigs.visible = true;
    this.spawn();
    g.vm.hidden = true;
    try { g.navRebuild(P.pos); } catch (e) { /* the village is off the rooms' walking grid: nothing walks here */ }
  }
  spawn() {
    const P = this.g.player, [sx, sy, yaw] = VSPOTS.spawn, [x, y] = this.w(sx, sy);
    const n = this.g.net.active ? (this.g.net.role === 'client' ? 1 + Math.random() * 3 : 0) : 0, a = Math.random() * 6.28;
    P.pos.set(x + Math.cos(a) * 160 * n, 120, y + Math.sin(a) * 160 * n); P.vel.set(0, 0, 0); P.yaw = yaw; P.pitch = -0.04;
    if (P.dead) P.revive(); P.health = P.maxHealth;
  }
  // leaving for a run: the village stays built, its people and stations hidden
  leave() {
    const g = this.g; this.on = false; g.village = null; g.env.noSky = !!g.map.noSky;
    for (const p of this.people) p.root.visible = false; for (const I of this.uses) { I.enabled = false; I.group.visible = false; } for (const M of this.signs || []) M.visible = false; if (this.rigs) this.rigs.visible = false;
    g.vm.hidden = false;
  }
  // ---- the people and the things to use
  build() {
    const g = this.g; this.built = true;
    const person = (key, [x, y, yaw], L, name) => {
      const root = buildCharacter(L), [wx, wy] = this.w(x, y); root.position.set(wx, 0, wy); root.rotation.y = yaw + Math.PI;
      if (root.userData.rig && root.userData.rig.gun) root.userData.rig.gun.visible = false;
      g.scene.add(root); const p = { key, root, name, yaw0: yaw, yaw, at: [wx, wy], t: Math.random() * 10, said: 0, need: '' }; this.people.push(p); return p;
    };
    for (const k of ['shop', 'gunshop', 'trainer', 'lectern', 'gate']) { const p = person(k, (VSPOTS[k] || VSPOTS.gunshop).npc, PEOPLE[k].look, PEOPLE[k].name); p.need = PEOPLE[k].need || ''; }
    for (const k of ['roulette', 'blackjack', 'dice']) person(k, VSPOTS.casino[k].npc, PEOPLE[k].look, PEOPLE[k].name);
    VSPOTS.folk.forEach((f, i) => person('folk', f, FOLK[i % FOLK.length], ''));
    // a thing to use: a prompt within reach, and E opens its window
    const use = (kind, [x, y], prompt, arg, r = 210, can = null) => {
      const [wx, wy] = this.w(x, y), I = new Interactable(g, 'Quest', V(wx, wy, 0), 0, 0, -1, '', V(100, 100, 100));
      I.useRadius = r; I.village = kind;
      I.q = { usable: () => this.on, prompt: () => prompt(), use: () => { if (can && !can()) return; if (g.onVillage) g.onVillage(kind, arg); } };
      g.scene.add(I.group); g.interactables.push(I); this.uses.push(I); return I;
    };
    use('shop', VSPOTS.shop.at, () => `[E] Clothes  -  Mossbottom’s counter\nGold: ${Meta.gold().toLocaleString()}`, null, 260);
    // the rescued: each station stands empty, and tells you so, until its gnome is home
    const lost = (id) => `${gnomeOf(id).name} is lost at the bottom of the Descent.\nBeat its last boss to bring them home.`;
    use('gunshop', VSPOTS.gunshop.at, () => (Meta.gnomeHome('forge') ? `[E] The Forge  -  Flintwhistle\nWeapon fragments: ${Meta.frags().toLocaleString()}` : `The Forge stands cold.\n${lost('forge')}`), null, 260, () => Meta.gnomeHome('forge'));
    use('trainer', VSPOTS.trainer.at, () => (Meta.gnomeHome('trainer') ? '[E] The Training Yard  -  Old Hobnail\nNew perks, abilities and gear for every class' : `The Training Yard is empty.\n${lost('trainer')}`), null, 300, () => Meta.gnomeHome('trainer'));
    use('lectern', VSPOTS.lectern.at, () => { if (!Meta.gnomeHome('lectern')) return `The Lectern’s book lies shut.\n${lost('lectern')}`; const n = Meta.pages(), c = n ? n.toString(2).split('1').length - 1 : 0; return `[E] The Lectern  -  Mother Inkcap\n${c ? `${c} page${c > 1 ? 's' : ''} read for your next run` : 'A harder run for a richer haul'}`; }, null, 260, () => Meta.gnomeHome('lectern'));
    use('wardrobe', VSPOTS.wardrobe.at, () => '[E] Wardrobe\nChange into anything you own', null);
    use('wardrobe', VSPOTS.wardrobe.mirror, () => '[E] Mirror\nChange into anything you own', null);
    use('roulette', VSPOTS.casino.roulette.at, () => '[E] Roulette', null);
    use('blackjack', VSPOTS.casino.blackjack.at, () => '[E] Blackjack', null);
    use('dice', VSPOTS.casino.dice.at, () => '[E] High-Low dice', null);
    VSPOTS.casino.slots.forEach((s, i) => use('slots', s, () => '[E] Slot machine', i, 150));
    // the Way Down: the same arch as the rooms' doors, lit gold, its words over it
    const gate = use('gate', VSPOTS.gate.at, () => `[E] The Way Down\n${this.g.net.role === 'client' ? 'The host starts the run' : 'Choose your run and go down'}`, null, 330);
    buildPortal(gate, 1, 0xffcd5a, false);
    // the painted signs, once the village's lettering has loaded
    this.signs = [];
    signFontsReady().then(() => { for (const S of VSPOTS.signs) { const [x, y] = this.w(S.at[0], S.at[1]), M = makeSign(S.kind, S.o, new THREE.Vector3(x, S.at[2], y), new THREE.Vector3(S.face[0], 0, S.face[1]), S.h, S.glow || 0); M.visible = this.on; g.scene.add(M); this.signs.push(M); } });
    this.gate = gate;
    this.rigs = new CasinoRigs(this);
    for (const I of this.uses) { I.enabled = false; I.group.visible = false; }
  }
  // ---- every frame in the village
  tick(dt) {
    if (!this.on) return;
    const g = this.g, P = g.player, t = (this.t += dt);
    if (P.health < P.maxHealth) P.health = P.maxHealth;
    if (this.gate) tickPortal(this.gate, g, dt);
    // people: an easy idle; they turn to face you when you come near, and say hello once in a while
    for (const p of this.people) {
      p.t += dt; const dx = P.pos.x - p.at[0], dz = P.pos.z - p.at[1], d = Math.hypot(dx, dz);
      const want = d < 520 ? Math.atan2(-dx, -dz) : p.yaw0;   // a yaw faces (-sin, -cos): toward you
      let dy = ((want - p.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI; p.yaw += dy * Math.min(1, dt * 4);
      p.root.rotation.y = p.yaw + Math.PI;
      animateCharacter(p.root, p.t, 0, { preview: true, rest: true });
      if (p.key !== 'folk' && d < 420 && t - p.said > 25 && HELLO[p.key]) { p.said = t; const L = HELLO[p.key]; g.hud.toast(`${p.name}: “${L[Math.floor(Math.random() * L.length)]}”`, '#f4e4c0'); }
    }
    // fireflies drifting over the grass and round the pond, and smoke from the chimneys
    this.ff = (this.ff || 0) + dt * 14;
    while (this.ff >= 1) {
      this.ff -= 1;
      const a = Math.random() * 6.28, r = 300 + Math.random() * 2200, pos = new THREE.Vector3(P.pos.x + Math.cos(a) * r, 60 + Math.random() * 220, P.pos.z + Math.sin(a) * r);
      g.fx.add({ pos, vel: new THREE.Vector3((Math.random() - 0.5) * 40, (Math.random() - 0.3) * 20, (Math.random() - 0.5) * 40), drag: 0.1, life: 2.4 + Math.random() * 2, size0: 7, size1: 3, c0: [1, 0.92, 0.5, 0.9], c1: [1, 0.8, 0.3, 0], fadeIn: 0.5, tex: 'FX_Glow', kind: 'add', glow: 1.4 });
    }
    for (const M of this.signs || []) if (M.userData.tick) M.userData.tick(dt);
    if (this.rigs) { this.rigs.tick(dt); this.rigs.tickLabels(dt); this.watch(); }
    // smoke curling up from the chimneys, and the campfire: flames, sparks, and its light breathing
    this.sm = (this.sm || 0) + dt * 5;
    while (this.sm >= 1) { this.sm -= 1; for (const [x0, y0, z] of VSPOTS.smoke) { if (Math.random() < 0.55) continue; const [x, y] = this.w(x0, y0); g.fx.add({ pos: new THREE.Vector3(x + (Math.random() - 0.5) * 20, z, y + (Math.random() - 0.5) * 20), vel: new THREE.Vector3(18 + Math.random() * 14, 55 + Math.random() * 25, 6), drag: 0.25, life: 4 + Math.random() * 2, size0: 36, size1: 150, c0: [0.86, 0.84, 0.82, 0.32], c1: [0.9, 0.88, 0.86, 0], tex: 'FX_Smoke', kind: 'fx' }); } }
    { const [fx, fy] = this.w(VSPOTS.fire[0], VSPOTS.fire[1]); this.fl = (this.fl || 0) + dt * 30;
      while (this.fl >= 1) { this.fl -= 1; const a = Math.random() * 6.28, r = Math.random() * 26; g.fx.add({ pos: new THREE.Vector3(fx + Math.cos(a) * r, 22, fy + Math.sin(a) * r), vel: new THREE.Vector3((Math.random() - 0.5) * 20, 90 + Math.random() * 70, (Math.random() - 0.5) * 20), drag: 0.6, life: 0.5 + Math.random() * 0.4, size0: 34 + Math.random() * 20, size1: 6, c0: [1, 0.72, 0.3, 0.95], c1: [1, 0.3, 0.08, 0], tex: 'FX_Flame', kind: 'add', glow: 1.6 }); if (Math.random() < 0.12) g.fx.add({ pos: new THREE.Vector3(fx, 40, fy), vel: new THREE.Vector3((Math.random() - 0.5) * 60, 150 + Math.random() * 120, (Math.random() - 0.5) * 60), drag: 0.3, life: 1.4, size0: 5, size1: 2, c0: [1, 0.8, 0.4, 1], c1: [1, 0.4, 0.1, 0], tex: 'FX_Glow', kind: 'add', glow: 2 }); } }
    // the casino hums when you are near it
    if (g.audio && g.audio.loop) { const [cx, cy] = this.w(VSPOTS.casino.c[0], VSPOTS.casino.c[1]), d = Math.hypot(P.pos.x - cx, P.pos.z - cy); g.audio.loop('S_AmbCasino', Math.max(0, Math.min(0.35, (2600 - d) / 3000))); }
  }
  // ---- the casino, live: sit down at a game (stand at it, look at the table), tell the party what you play, and show
  // what they play on the same tables
  seat(kind, i = 0) {
    if (!this.rigs) return; const P = this.g.player, S = this.rigs.seat(kind, i);
    P.pos.set(S.at.x, P.pos.y, S.at.z); P.vel.set(0, 0, 0);
    const eye = P.eye ? P.eye() : P.pos.clone().add(new THREE.Vector3(0, 60, 0)), d = S.look.clone().sub(eye);
    P.yaw = Math.atan2(-d.x, -d.z); P.pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
  }
  broadcast(cz) { if (Net.room) Net.room.presence({ cz }).catch(() => {}); }
  watch() {
    if (!Net.room) return; this.seen = this.seen || {};
    for (const p of Net.room.peers()) {
      if (p.isMe || !p.presence || !p.presence.cz) continue;
      const c = p.presence.cz, key = p.peer + c.k + (c.i || 0); if (this.seen[key] === c.s) continue; this.seen[key] = c.s;
      const who = String(p.presence.name || 'A friend').slice(0, 16), R = this.rigs;
      try {
        if (c.k === 'slot' && Array.isArray(c.r)) R.spinSlots(c.i | 0, c.r.slice(0, 3)).then(() => R.say('slot' + (c.i | 0), c.w ? `${who}  +${c.w}` : `${who}: no luck`));
        else if (c.k === 'rou') { R.rouletteBets(c.b || {}); if (Number.isInteger(c.n)) R.spinRoulette(c.n).then(() => R.say('rou', `${who}: ${c.n}${c.w ? '  +' + c.w : ''}`)); }
        else if (c.k === 'bj') R.blackjackHands((c.d || []).map(([r, s]) => ({ r, s })), (c.y || []).map(([r, s]) => ({ r, s })), !!c.h);
        else if (c.k === 'dice' && Number.isInteger(c.n)) R.rollDice(c.n, c.t, !!c.o).then(() => R.say('dice', `${who}: ${c.n}${c.w ? '  +' + c.w : ''}`));
      } catch (e) { /* a garbled message: ignore it */ }
    }
  }
  nearCasino() { const P = this.g.player, [cx, cy] = this.w(VSPOTS.casino.c[0], VSPOTS.casino.c[1]); return Math.hypot(P.pos.x - cx, P.pos.z - cy) < 1700; }
  // the place you stand to use a thing (for tests)
  spot(kind) { const I = this.uses.find((u) => u.village === kind); return I ? I.pos.clone() : null; }
}
