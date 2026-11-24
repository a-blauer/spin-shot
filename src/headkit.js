// The head as one sculpted surface, and everything that has to lie on it.
//
// A head is described by a few widths (at the eyes, the cheeks, the jaw and the chin), how square the jaw is and how far
// the chin comes forward. From those comes a smooth closed surface: a superellipse at every height, rounder at the crown
// and squarer at the jaw. The same description answers "where is the skin at this point?", so an eye, a moustache or a
// scar is put on the face and not near it, and it makes shells: sheets that follow the head a little way off it, which
// is what hair, stubble, a bandana and a mask are. A shell can be told to hang (stop following the head below a height)
// and that is long hair.
import * as THREE from 'three';

const sm = (a, b, t) => { t = Math.max(0, Math.min(1, t)); t = t * t * (3 - 2 * t); return a + (b - a) * t; };
const sp = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
// half-widths: W at the eyes, C at the cheek, J at the jaw, Ch at the chin; nj how square the jaw; zf how far forward the chin; bot where it ends
export const FACES = {
  oval: { W: 25, C: 24, J: 20.5, Ch: 12.5, nj: 2.6, zf: 1.6, bot: -3 },
  square: { W: 25, C: 24.8, J: 24, Ch: 18, nj: 3.6, zf: 1.6, bot: -3 },
  round: { W: 25.5, C: 26, J: 23, Ch: 15, nj: 2.3, zf: 1, bot: -2 },
  narrow: { W: 23.5, C: 22, J: 18.5, Ch: 11.5, nj: 2.6, zf: 1.6, bot: -6 },
  heart: { W: 25.5, C: 23.5, J: 17.5, Ch: 9, nj: 2.4, zf: 2.2, bot: -3.5 },
  strong: { W: 25, C: 24.6, J: 23.6, Ch: 19.5, nj: 3.2, zf: 3.4, bot: -4.5 },
  soft: { W: 25, C: 26.8, J: 24.5, Ch: 14, nj: 2.2, zf: 1, bot: -2 },
  gaunt: { W: 24.5, C: 21.8, J: 19.5, Ch: 14, nj: 3, zf: 2, bot: -4.5 },
  diamond: { W: 23.5, C: 25.5, J: 19.5, Ch: 10.5, nj: 2.5, zf: 2, bot: -4 },
};
export const TOP = 48.5;
const D = 22, PC = 2.8, kits = new Map();
export function headKit(id) {
  if (kits.has(id)) return kits.get(id);
  const F = FACES[id] || FACES.oval;
  const prof = (y, a) => {
    if (y >= 30) { const t = Math.min(1, (y - 30) / (TOP - 30)); return a[3] * Math.pow(Math.max(0, 1 - Math.pow(t, PC)), 1 / PC); }
    if (y >= 17) return sm(a[2], a[3], (y - 17) / 13);
    if (y >= 7) return sm(a[1], a[2], (y - 7) / 10);
    if (y >= 1) return sm(a[0], a[1], (y - 1) / 6);
    const t = Math.min(1, (1 - y) / (1 - F.bot)); return a[0] * Math.sqrt(Math.max(0, 1 - t * t));
  };
  const hw = (y) => prof(y, [F.Ch, F.J, F.C, F.W]), hd = (y) => prof(y, [15, 19.5, 21.5, D]);
  const zc = (y) => (y >= 17 ? 0 : y >= 7 ? sm(F.zf * 0.5 + 0.6, 0, (y - 7) / 10) : sm(F.zf + 1.6, F.zf * 0.5 + 0.6, (y - F.bot) / (7 - F.bot)));
  const nn = (y) => (y >= 30 ? sm(2.9, 2.4, (y - 30) / 18) : y >= 17 ? sm(2.8, 2.9, (y - 17) / 13) : y >= 7 ? sm(F.nj, 2.8, (y - 7) / 10) : F.nj);
  const cy = (y) => Math.max(F.bot + 0.02, Math.min(TOP - 0.02, y));
  // a point on the head: phi is the angle round from the front (pi/2 is the head's +x side), k how far off the skin
  const pt = (phi, y, k = 1) => { y = cy(y); const e = 2 / nn(y); return [hw(y) * k * sp(Math.sin(phi), e), zc(y) + hd(y) * k * sp(Math.cos(phi), e)]; };
  // where the front of the face is at (x, y), and where the side of the head is at (z, y)
  const fz = (x, y) => { y = cy(y); const n = nn(y), t = Math.min(0.995, Math.abs(x) / Math.max(0.01, hw(y))); return zc(y) + hd(y) * Math.pow(1 - Math.pow(t, n), 1 / n); };
  const fx = (z, y) => { y = cy(y); const n = nn(y), t = Math.min(0.995, Math.abs(z - zc(y)) / Math.max(0.01, hd(y))); return hw(y) * Math.pow(1 - Math.pow(t, n), 1 / n); };
  // how high the crown is over (x, z)
  const domeY = (x, z) => { const r = Math.pow(Math.pow(Math.abs(x) / F.W, 2.5) + Math.pow(Math.abs(z) / D, 2.5), 1 / 2.5); return r >= 1 ? 30 : 30 + (TOP - 30) * Math.pow(1 - Math.pow(r, PC), 1 / PC); };
  // the head itself
  const M = 32, ys = []; for (let j = 0; j <= 26; j++) { const t = j / 26; ys.push(TOP - (TOP - F.bot) * (0.5 - 0.5 * Math.cos(t * Math.PI)) * 0.55 - (TOP - F.bot) * t * 0.45); }
  const pos = [], idx = [];
  for (const y of ys) for (let i = 0; i <= M; i++) { const p = pt((i / M) * Math.PI * 2, y); pos.push(p[0], y, p[1]); }
  for (let j = 0; j < ys.length - 1; j++) for (let i = 0; i < M; i++) { const a = j * (M + 1) + i, b = a + 1, c = a + M + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  // Shells. o: k / kin (outer and inner surface, as a multiple of the head), a0..a1 (the arc, radians from the front; a
  // full turn if left out), top and bot (heights, or functions of the angle from the front, 0 to pi), fall (below this
  // height the sheet stops following the head and hangs), lift (how much higher the crown of it stands).
  const cache = new Map();
  const shell = (o) => {
    const key = id + JSON.stringify(o, (k, v) => (typeof v === 'function' ? v.key || String(v) : v)); if (cache.has(key)) return cache.get(key);
    const full = o.a0 === undefined, a0 = full ? 0 : o.a0, a1 = full ? Math.PI * 2 : o.a1, nu = o.nu || Math.max(8, Math.round(((a1 - a0) / (Math.PI * 2)) * 36)), nv = o.nv || 9;
    const k = o.k || 1.06, kin = o.kin || Math.min(0.97, k - 0.1), lift = o.lift || 0, P = [], I = [];
    const val = (f, af) => (typeof f === 'function' ? f(af) : f);
    for (let s = 0; s < 2; s++) for (let i = 0; i <= nu; i++) {
      const phi = a0 + ((a1 - a0) * i) / nu; let af = Math.abs(((phi + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI);
      const yt = val(o.top === undefined ? TOP : o.top, af), yb = val(o.bot, af);
      for (let j = 0; j <= nv; j++) {
        const y = yt + ((yb - yt) * j) / nv, ye = o.fall !== undefined ? Math.max(y, o.fall) : y, p = pt(phi, ye, s ? kin : k);
        P.push(p[0], y + (s ? 0 : lift * Math.max(0, (y - 30) / (TOP - 30))), p[1]);
      }
    }
    const V = (s, i, j) => s * (nu + 1) * (nv + 1) + i * (nv + 1) + j;
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = V(0, i, j), b = V(0, i + 1, j), c = V(0, i, j + 1), d = V(0, i + 1, j + 1); I.push(a, c, b, b, c, d); const a2 = V(1, i, j), b2 = V(1, i + 1, j), c2 = V(1, i, j + 1), d2 = V(1, i + 1, j + 1); I.push(a2, b2, c2, b2, d2, c2); }
    for (let i = 0; i < nu; i++) { I.push(V(0, i, 0), V(0, i + 1, 0), V(1, i, 0), V(0, i + 1, 0), V(1, i + 1, 0), V(1, i, 0)); I.push(V(0, i, nv), V(1, i, nv), V(0, i + 1, nv), V(0, i + 1, nv), V(1, i, nv), V(1, i + 1, nv)); }
    if (!full) for (let j = 0; j < nv; j++) { I.push(V(0, 0, j), V(1, 0, j), V(0, 0, j + 1), V(0, 0, j + 1), V(1, 0, j), V(1, 0, j + 1)); I.push(V(0, nu, j), V(0, nu, j + 1), V(1, nu, j), V(0, nu, j + 1), V(1, nu, j + 1), V(1, nu, j)); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals();
    cache.set(key, g); return g;
  };
  // a tube along points on the crown (a cornrow)
  const tube = (pts, r) => { const key = id + 't' + JSON.stringify(pts) + r; if (!cache.has(key)) cache.set(key, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))), pts.length * 3, r, 6, false)); return cache.get(key); };
  const K = { F, geo, pt, fz, fx, domeY, hw, hd, zc, shell, tube };
  kits.set(id, K); return K;
}
// a line through points [angle from the front, height], as a function of the angle; `key` makes it cacheable
export const pl = (pts) => { const f = (af) => { for (let i = 1; i < pts.length; i++) if (af <= pts[i][0]) { const [a0, y0] = pts[i - 1], [a1, y1] = pts[i]; return y0 + ((y1 - y0) * (af - a0)) / Math.max(1e-6, a1 - a0); } return pts[pts.length - 1][1]; }; f.key = 'pl' + JSON.stringify(pts); return f; };
