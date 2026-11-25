// The Descent's own progression. Two things are earned by going down, and neither is raw power:
//   machines   account-wide helpers opened by rank, that give you more say over the next run
//   ascension  the gun that carried a winning run is marked, once per difficulty; each mark opens a choice for that gun
import * as THREE from 'three';
import { Meta } from './meta.js';

// Machines: account-wide helpers that appear in the Descent, opened by rank (see RANKS in meta.js). The old deeds are gone.
export const MACHINES = [
  { id: 'compressor', name: 'The Compressor', short: 'A second bench every third room: two of the same gun part become one, half as strong again.', text: 'Every third room a second bench stands by the workbench. Feed it two of the same gun part and it presses them into one that is half as strong again: two Incendiary (20%) make one at 30%. A pressed part cannot be pressed again.' },
  { id: 'showcase', name: 'The Showcase', short: 'Half the time, the chest at the end of a room is a grade better.', text: 'Half the time, the chest waiting at the end of a room comes up a grade better than it would have: better buffs, sooner.' },
  { id: 'recycler', name: 'The Recycler', short: 'Break parts into scrap; spend scrap to make the part you want.', text: 'At every workbench: break gun parts you do not want down into scrap, and spend scrap on the gun part you do want. Rarer parts give more scrap and cost more to make.' },
  { id: 'fortune', name: 'The Fortune Teller', short: 'Reroll your character buffs, or trade two for one of the next rarity.', text: 'At every workbench: each room, reroll any character buff you carry (once each) into another of the same rarity, or give up two of one rarity for one of the next rarity up.' },
  { id: 'fusion', name: 'Compressor: Fusion', short: 'The Compressor fuses two different elemental parts into one with a new effect.', text: 'The Compressor can now fuse two different elemental parts (Incendiary, Cryo Cell, Serrated, Arc Coil) into one part that carries both, and does something neither does alone.' },
];
export const machine = (id) => Meta.machineOn(id);
export const machinesHeld = () => MACHINES.filter((M) => machine(M.id)).map((M) => M.id);

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
