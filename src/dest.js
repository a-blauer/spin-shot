// Destinations: the places the Descent goes. Each is an open map of its own (a farm, a wood, a depot, a mine), far
// bigger than the old rooms, with real edges (walls, hedges, cliffs, water) instead of four walls and a roof.
//
// A destination's builder lays out the whole place in its local frame: +Y north, +X east, z up, the playable ground
// flat at z = 0 (so anything can walk anywhere that is open, and the strain's growth can lie on it). Everything that
// looks like a thing is solid; nothing floats; nothing solid stands where a station goes. It returns where the
// stations stand (spots) and where nothing may come up out of the ground (keep).
//
// The framework puts it on the Descent's map (south of the old rooms, one cell of a five-wide grid each), gives it
// its zone and its air, scatters spawn marks over its open ground, and fences the playable edge (movement and the
// walking grid) so nothing walks off it even where its own edge is a hedge or a ditch.
import * as THREE from 'three';
import { V, V2 } from './mapkit.js';
import { buildBramble } from './dest_bramble.js';
import { buildOakwoods } from './dest_oakwoods.js';

export const DSP = 20000;   // one destination's cell on the map
const C = (h) => new THREE.Color(h);

// region: index into REGIONS (descent.js). hx, hy: the playable half-size. H: how high a flyer may go. air: the
// palette (env.js) while you are there. flip 1: the way in is at the south end and the way on at the north.
export const DEST_DEFS = [
  { key: 'bramble', region: 0, name: 'Bramble Farm', hx: 5400, hy: 5800, H: 2600, flip: 1, bed: 'S_AmbWind', build: buildBramble,
    air: { sky: 0x6c84b6, fog: 0xd2b482, fogStart: 2400, fogDensity: 0.000072, fogMax: 0.8, sun: [-0.62, -0.42, 0.42], lit: [1.08, 0.95, 0.8, 1.04], shadow: [0.44, 0.44, 0.62, 0.82], sprite: [1.04, 0.98, 0.9] } },
  { key: 'oakwoods', region: 1, name: 'Old Oak Woods', hx: 5600, hy: 6000, H: 2800, flip: 1, bed: 'S_AmbWind', build: buildOakwoods,
    air: { sky: 0x7e9eb4, fog: 0xa4b08a, fogStart: 1800, fogDensity: 0.00009, fogMax: 0.82, sun: [-0.5, -0.36, 0.5], lit: [1.02, 1.0, 0.84, 1.0], shadow: [0.36, 0.46, 0.42, 0.8], sprite: [0.96, 1.0, 0.9] } },
];
export const destOrigin = (i) => [(i % 5) * DSP, -(1 + Math.floor(i / 5)) * DSP];
// the walking grid has to reach every destination: the box they all sit in, with room for their edges
export function destBounds() {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  DEST_DEFS.forEach((D, i) => { const [x, y] = destOrigin(i); x0 = Math.min(x0, x - D.hx - 1000); x1 = Math.max(x1, x + D.hx + 1000); y0 = Math.min(y0, y - D.hy - 1000); y1 = Math.max(y1, y + D.hy + 1000); });
  return [x0, y0, x1, y1];
}
// the air of a destination, for maps.js's palette
export function destAir(P, key, sun) {
  const D = DEST_DEFS.find((d) => d.key === key); if (!D) return false; const A = D.air;
  P.sky = C(A.sky); P.fog = C(A.fog); P.fogStart = A.fogStart; P.fogDensity = A.fogDensity; P.fogMax = A.fogMax; P.sun = sun(...A.sun);
  P.lit.set(...A.lit); P.shadow.set(...A.shadow); P.sprite.setRGB(...A.sprite);
  return true;
}

// Build destination d as arena `ai` (its chunk) at its cell. M: the map kit; GM: the game (zones, walking grid).
export function buildDest(M, GM, d, ai) {
  const D = DEST_DEFS[d], [cx, cy] = destOrigin(d), { hx, hy } = D;
  M.world.chunk = ai; M.world.recordProps = true;
  const zone = M.AddZone(D.name, V2(cx - hx, cy - hy), V2(cx + hx, cy + hy), true); GM.zones[zone].group = 'dest:' + D.key;
  let out = null;
  M.at({ x: cx, y: cy, z: 0, rot: 0 }, () => { out = D.build(M, { hx, hy, H: D.H, GM, cx, cy }); });
  // the playable edge: an invisible fence (movement only) a little inside it, and the walking grid closed beyond it
  const t = 60;
  for (const s of [-1, 1]) {
    M.Blocker(V(cx, cy + s * (hy + t / 2), 1200), V(hx * 2 + t * 2, t, 2400));
    M.Blocker(V(cx + s * (hx + t / 2), cy, 1200), V(t, hy * 2 + t * 2, 2400));
    GM._navBlock(cx - hx - 400, s < 0 ? cy - hy - 400 : cy + hy, 0, cx + hx + 400, s < 0 ? cy - hy : cy + hy + 400, 200, 1);
    GM._navBlock(s < 0 ? cx - hx - 400 : cx + hx, cy - hy, 0, s < 0 ? cx - hx : cx + hx + 400, cy + hy, 200, 1);
  }
  // the builder says where things stand in its own frame; the run wants them on the map
  const L = out.spots, W = (p) => (p ? [p[0] + cx, p[1] + cy] : p), spots = { ...L };
  for (const k of ['spawn', 'exit', 'box', 'bench', 'chest', 'ammo', 'press']) spots[k] = W(L[k]);
  spots.guns = (L.guns || [[-hx + 8, 0, 0], [hx - 8, 0, 180]]).map(([x, y, a]) => [x + cx, y + cy, a]);
  const A = { c: [cx, cy], hx, hy, H: D.H, zone, theme: 0, boss: false, plinths: [], masses: [], dest: { key: D.key, region: D.region, name: D.name, flip: D.flip, bed: D.bed }, spots, bossAt: out.bossAt || null, beds: out.beds || null, title: D.name };
  // where they come up: open ground all over the place, never inside anything, and not right by the way in or the
  // stations (out.keep: [x, y, r] in the local frame)
  const keep = (out.keep || []).concat([[L.spawn[0], L.spawn[1], 1500], [L.exit[0], L.exit[1], 900], [L.bench[0], L.bench[1], 500], [L.box[0], L.box[1], 500]]);
  const free = (x, y) => { const [ix, iy] = GM.cellOf(cx + x, cy + y); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (!GM.navFree(ix + a, iy + b)) return false; return !keep.some(([kx, ky, r]) => Math.hypot(x - kx, y - ky) < r); };
  let made = 0;
  M.at({ x: cx, y: cy, z: 0, rot: 0 }, () => {
    for (let x = -hx + 500; x <= hx - 500; x += 900) for (let y = -hy + 500; y <= hy - 500; y += 900) {
      const jx = x + ((Math.abs(y) / 900) % 2 ? 450 : 0);   // staggered rows: no lines of them
      if (Math.abs(jx) > hx - 450) continue;
      if (free(jx, y)) { M.SpawnAt(V(jx, y, 0), zone, false); made++; }
    }
  });
  A.spawns = made;
  A.solidified = M.world.solidify(ai);   // what looks solid is solid (anything chunky the builder drew without a body)
  M.world.chunk = null;
  return A;
}
