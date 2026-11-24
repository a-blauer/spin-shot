// The Descent's own progression. Two things are earned by going down, and neither is raw power:
//   deeds      account-wide machines and favours that give you more say over the next run
//   ascension  the gun that carried a winning run is marked, once per difficulty; each mark opens a choice for that gun
import * as THREE from 'three';
import { Meta } from './meta.js';

const st = (k) => Meta.stat(k);
export const DEEDS = [
  { id: 'bless', name: 'Blessings', need: 'Clear room 5 of the Descent.', test: () => st('dRoom') >= 5, text: 'One cleared room in three ends with a blessing: a free part, of any rarity.' },
  { id: 'roll2', name: 'Second Roll', need: 'Clear room 10 of the Descent.', test: () => st('dRoom') >= 10, text: 'The mystery box gives two free rolls in every room, not one.' },
  { id: 'eye', name: "Scavenger's Eye", need: 'Clear room 15 of the Descent.', test: () => st('dRoom') >= 15, text: 'Parts that suit the gun in your hands turn up far more often.' },
  { id: 'recycle', name: 'The Recycler', need: 'Finish the Descent.', test: () => st('dWins') >= 1, text: 'A machine at every workbench: give it two parts you do not want and it makes one new part, as rare as the lesser of the two.' },
  { id: 'reroll', name: 'Recycler: Reroll', need: 'Finish the Descent on Hard or Nightmare.', test: () => st('dDiff') >= 2, text: 'Once a room, the Recycler turns a single part into a different part of the same rarity.' },
  { id: 'banish', name: 'Banish', need: 'Ascend three weapons.', test: () => st('dAsc') >= 3, text: 'Strike a kind of part from the run at the workbench: it will not drop again. Three times a run.' },
  { id: 'keep', name: 'Keepsake', need: 'Finish the Descent on Nightmare.', test: () => st('dDiff') >= 3, text: 'Begin every Descent already carrying one part of your choice.' },
];
export const deed = (id) => { const D = DEEDS.find((d) => d.id === id); return !!D && (Meta.allOn() || D.test()); };
export const deedsHeld = () => DEEDS.filter((D) => deed(D.id)).map((D) => D.id);

// a gun evolves by being used: kills with it, in this run
export const EVO_NEED = [30, 90, 180, 300];
export const ROMAN = ['', 'I', 'II', 'III', 'IV'];

// ascension: 1 Carried, 2 Tempered, 3 Attuned
export const ASC = [
  { name: 'Carried', text: 'You may begin any Descent with it in your hands.' },
  { name: 'Tempered', text: 'Choose its temper at any workbench: one strength traded for another.' },
  { name: 'Attuned', text: 'Bind it to an element at any workbench: its hits carry it.' },
];
export const TEMPERS = [
  { id: '', name: 'Balanced', text: 'As it came.', mods: [] },
  { id: 'quick', name: 'Quick', text: '+18% fire rate, -12% damage', mods: [['FireRate', 0.18], ['Damage', -0.12]] },
  { id: 'heavy', name: 'Heavy', text: '+20% damage, -14% fire rate', mods: [['Damage', 0.2], ['FireRate', -0.14]] },
  { id: 'deep', name: 'Deep', text: '+40% magazine, -15% reload speed', mods: [['MagSize', 0.4], ['ReloadSpeed', -0.15]] },
  { id: 'keen', name: 'Keen', text: '+12% crit chance, -10% damage', mods: [['CritChance', 0.12], ['Damage', -0.1]] },
  { id: 'light', name: 'Light', text: '+25% reload speed, -20% magazine', mods: [['ReloadSpeed', 0.25], ['MagSize', -0.2]] },
];
export const ATTUNES = [
  { id: '', name: 'None', text: 'No element.', col: null },
  { id: 'ember', name: 'Ember', text: 'Hits can set the target alight.', col: [1, 0.5, 0.15], hex: '#ff7a1a' },
  { id: 'frost', name: 'Frost', text: 'Hits can chill and slow the target.', col: [0.55, 0.85, 1], hex: '#7fd8ff' },
  { id: 'storm', name: 'Storm', text: 'Hits can arc to two enemies nearby.', col: [0.65, 0.6, 1], hex: '#9a8cff' },
  { id: 'venom', name: 'Venom', text: 'Hits can poison the target.', col: [0.5, 0.9, 0.35], hex: '#8fe08a' },
];
export const temperOf = (name) => (Meta.asc(name) >= 2 ? TEMPERS.find((T) => T.id === (Meta.ascPick(name).temper || '')) || TEMPERS[0] : TEMPERS[0]);
export const attuneOf = (name) => (Meta.asc(name) >= 3 ? ATTUNES.find((A) => A.id === (Meta.ascPick(name).attune || '')) || ATTUNES[0] : ATTUNES[0]);
// what an attuned gun does to the thing it hits (about one hit in six, weighed by how much of a shot the hit was)
export function attuneHit(p, E, A, dealt, procCoef, at) {
  if (!A || !A.id || E.dead || Math.random() >= 0.18 * Math.max(0.1, procCoef)) return;
  const G = p.game;
  if (A.id === 'ember') E.applyBurn(Math.max(6, dealt * 0.4), 3);
  else if (A.id === 'frost') { E.applySlow(0.4, 2.5); if (G.time - (E.frFx || -9) > 0.7) { E.frFx = G.time; G.fx.frostBurst(E.pos, 70); } }
  else if (A.id === 'venom') E.applyBleed(dealt * 0.5);
  else if (A.id === 'storm') {
    let k = 0; for (const O of G.enemies) { if (O === E || O.dead || O.emerging || O.pos.distanceTo(E.pos) > 600) continue; if (k++ >= 2) break; G.fx.arc(at || E.pos, O.pos, A.col); p.dealDamage(O, dealt * 0.4, O.pos, new THREE.Vector3(), false, 0, true, 0, 0, 0, 0, A.col); }
  }
}
