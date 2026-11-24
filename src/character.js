// Third-person player characters: chunky flat-shaded figures built from primitives in the game's palette, assembled
// from the cosmetic pieces in cosmetics.js. Origin at the feet, facing +Z, about 180 units tall.
import * as THREE from 'three';
import { toonMaterial } from './render.js';
import { cosItem, shapeOf } from './cosmetics.js';
import { headKit, pl, TOP } from './headkit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const mats = new Map();
function mat(c, glow = 0) { const k = c + ':' + glow; if (!mats.has(k)) { const m = toonMaterial({ glow }); m.uniforms.uColor.value.setHex(c); mats.set(k, m); } return mats.get(k); }
const G = { dome: new THREE.SphereGeometry(0.5, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2), box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 14), cone: new THREE.ConeGeometry(0.5, 1, 14), ball: new THREE.SphereGeometry(0.5, 14, 10), tor: new THREE.TorusGeometry(0.5, 0.09, 6, 18) };
const geo = new Map();
function taper(top, bot) { const k = top + '/' + bot; if (!geo.has(k)) geo.set(k, new THREE.CylinderGeometry(top, bot, 1, 14)); return geo.get(k); }
function add(p, g, c, sx, sy, sz, x = 0, y = 0, z = 0, glow = 0) { const m = new THREE.Mesh(g, mat(c, glow)); m.scale.set(sx, sy, sz); m.position.set(x, y, z); p.add(m); return m; }
// a box with its edges taken off: heads, hands, boots and anything else that should not look like a crate
function rbox(p, c, w, h, d, x = 0, y = 0, z = 0, r = 4, glow = 0) { w = Math.round(w * 2) / 2; h = Math.round(h * 2) / 2; d = Math.round(d * 2) / 2; r = Math.round(r * 10) / 10; const k = `r${w}/${h}/${d}/${r}`; if (!geo.has(k)) geo.set(k, new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 0.1, h / 2 - 0.1, d / 2 - 0.1))); const m = new THREE.Mesh(geo.get(k), mat(c, glow)); m.position.set(x, y, z); p.add(m); return m; }
const shade = (c, k) => { const o = new THREE.Color(c); o.multiplyScalar(k); return o.getHex(); };
const mix = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k).getHex();
const grp = (p, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); return g; };

export function buildCharacter(look) {
  // The body: a frame (how broad the shoulder, how narrow the waist) and ten sliders. Everything worn hangs on the same
  // groups the body is made of, so a piece fits whatever the body under it is: thick limbs scale what is on them, long
  // limbs stretch the sleeve or the trouser leg and carry the hand, the boot and the gun with them.
  const Bd = cosItem('body', look.body), FM = Bd.f || 0, SV = shapeOf(look), K = 'human', wt = SV.weight, mu = SV.muscle;
  const aK = 1 + 0.2 * SV.arms, lF = 1 + 0.18 * SV.legs, LEG = 1.2, lq = (62 * lF - 21) / 41, HIP = 41 * lq * LEG + 21;
  const WX = wt > 0 ? 1 + 0.24 * wt : 1 + 0.15 * wt, WZ = wt > 0 ? 1 + 0.38 * wt : 1 + 0.16 * wt, LIMB = wt > 0 ? 1 + 0.26 * wt : 1 + 0.16 * wt;
  const SW = (1 - 0.1 * FM) * (1 + 0.12 * SV.shoulders), HPW = (1 + 0.07 * FM) * (1 + 0.14 * SV.hips);
  const ARMW = LIMB * (1 + 0.2 * mu) * (1 - 0.06 * FM), LEGW = LIMB * (1 + 0.1 * mu), HS = 0.86 * (1 + 0.1 * SV.head);
  const chest = (SV.chest + 1) / 2, rear = (SV.rear + 1) / 2, groin = (SV.groin + 1) / 2;
  const tone = cosItem('tone', look.tone).c, HAIR = cosItem('hair', look.hair), HC = cosItem('haircol', look.haircol).c;
  const BT = cosItem('boots', look.boots), GL = cosItem('gloves', look.gloves), NK = cosItem('neck', look.neck), SH = cosItem('shoulder', look.shoulder), WS = cosItem('waist', look.waist);
  const O = cosItem('outfit', look.outfit), L = cosItem('legs', look.legs), H = cosItem('hat', look.hat), F = cosItem('face', look.face), B = cosItem('back', look.back);
  const JAW = cosItem('jaw', look.jaw), EY = cosItem('eyes', look.eyes), EC = cosItem('eyecol', look.eyecol).c, BR = cosItem('brows', look.brows), NS = cosItem('nose', look.nose);
  const MO = cosItem('mouth', look.mouth), LP = cosItem('lips', look.lips), FH = cosItem('fhair', look.fhair), MK = cosItem('mark', look.mark);
  const root = new THREE.Group(), R = { root, hipY: HIP };
  const body = R.body = grp(root, 0, HIP, 0); body.scale.set(WX, 1, WZ);
  const st = O.style;

  // ---- legs: a thigh and shin that take the leg's length, and a boot the size of a foot whatever the leg is
  const FW = Math.max(LEGW * 0.94, 1 + 0.1 * wt), tucked = ['tall', 'spur'].includes(BT.style);
  for (const s of [-1, 1]) {
    const leg = grp(root, s * 15 * WX * Math.max(0.94, HPW), HIP, 0); R[s < 0 ? 'legL' : 'legR'] = leg; leg.scale.set(LEGW, LEG, LEGW);
    const peg = BT.style === 'peg' && s > 0;
    if (peg) { const pg = grp(leg, 0, 0, 0); pg.scale.y = HIP / (62 * LEG); add(pg, taper(0.5, 0.42), L.a, 26, 20, 26, 0, -10, 0); add(pg, G.cyl, 0x6a6a72, 19, 3, 19, 0, -21, 0); add(pg, taper(0.4, 0.25), BT.a, 16, 42, 16, 0, -41, 0); add(pg, G.cyl, 0x3a3a40, 9, 2.4, 9, 0, -61, 0); continue; }
    // the foot hangs from the ankle at its own size: y 0 is the ankle, -21 the ground
    const up = grp(leg, 0, 0, 0), ft = grp(leg, 0, -41 * lq, 0); up.scale.y = lq; ft.scale.set(FW / LEGW, 1 / LEG, FW / LEGW);
    // a thigh, a knee and a shin that narrows into the boot
    const lw = 26;
    add(up, taper(0.5, 0.43), L.a, lw, 22, lw + 1, 0, -11, 0); add(up, G.ball, shade(L.a, 0.92), lw * 0.88, 9, lw * 0.92, 0, -22, 1.5); add(up, taper(0.44, 0.38), L.a, lw, 20, lw, 0, -31, 0);
    add(up, G.box, shade(L.a, 0.8), lw * 0.5, 16, 1.5, 0, -8, lw * 0.5 - 0.4).rotation.z = s * 0.06;   // a crease down the front
    if (L.chaps) { add(up, G.box, L.b, 8, 34, 28, s * 12, -20, 0); for (let k = 0; k < 6; k++) add(up, G.box, shade(L.b, 0.8), 5, 3.4, 2, s * 17.5, -6 - k * 5.6, -11 + (k % 2) * 3).rotation.z = s * 0.3; add(up, G.cyl, 0xc9c9d0, 6, 1.6, 6, s * 16.2, -7, 6).rotation.z = Math.PI / 2; }
    if (L.stripe) add(up, G.box, L.b, 4, 38, 4, s * 13, -20, 0);
    switch (L.id) {   // what each pair is known by
      case 'denim': add(up, G.box, shade(L.a, 0.72), 1.2, 30, 1.2, s * lw * 0.47, -18, 0); break;
      case 'dust': rbox(up, shade(L.a, 0.78), 13, 10, 3, 0, -22, lw * 0.44, 1.2); add(up, G.box, shade(L.a, 0.6), 9, 1, 3.2, 0, -19.4, lw * 0.44); break;
      case 'black': for (let k = 0; k < 5; k++) add(up, G.ball, 0xc9c9d0, 2.6, 2.6 / lq, 2.6, s * lw * 0.49, -5 - k * 7.4, 0); break;
      case 'red': add(up, G.box, L.b, 2.6, 38, 3, s * 12.7, -20, 0); break;
      case 'teal': add(up, taper(0.5, 0.5), L.b, lw * 0.82, 2.4, lw * 0.82, 0, -37, 0); add(up, taper(0.5, 0.5), L.b, lw * 0.98, 2, lw * 1.02, 0, -3, 0); break;
      case 'white': for (const x of [-6, 6]) add(up, G.box, shade(L.a, 0.8), 0.9, 38, 0.9, x, -20, lw * 0.45); add(up, G.box, L.b, 1.6, 38, 2, s * 12.9, -20, 0); break;
      default: break;
    }
    const bs = BT.style, B1 = shade(BT.a, 0.95), B2 = shade(BT.b, 0.8), GOLDM = 0xc9a43a;
    const sole = (th = 4, c = B2, len = 31, z = 4.5, w = 22) => rbox(ft, c, w, th, len, 0, -21 + th / 2, z, 1.6);
    const shaft = (h, c = B1, r = 23.5) => add(ft, taper(0.5, 0.47), c, r, h + 9, r, 0, (h - 9) / 2, -1);    // from h above the ankle to 9 below it
    const vamp = (c = B1, toe = true) => { rbox(ft, c, 21, 13, 22, 0, -11.5, 1, 5); if (toe) rbox(ft, c, 20, 10, 16, 0, -13, 10.5, 4.8); };
    if (bs === 'sandal') {
      add(ft, G.cyl, tone, 17, 9, 17, 0, -4, -1); rbox(ft, tone, 18, 9, 27, 0, -13.2, 4.5, 4.4); for (let k = 0; k < 4; k++) add(ft, G.ball, shade(tone, 0.9), 4.4, 4.4, 5.4, -6.4 + k * 4.3, -15, 18.2 - Math.abs(k - 1) * 0.8);
      rbox(ft, BT.a, 20, 3, 4.5, 0, -10, 11.5, 1.2); rbox(ft, BT.a, 20.5, 3, 4.5, 0, -8.2, 2.5, 1.2); add(ft, G.box, BT.a, 3, 3, 12, 0, -9, 7); add(ft, G.cyl, BT.a, 19, 2.6, 19, 0, -3, -1); add(ft, G.ball, GOLDM, 3.4, 3.4, 2, s * 9.6, -3, 2); sole(3.4, BT.b); continue;
    }
    if (!tucked) { const hr = lw * 0.98 * Math.max(1, FW / LEGW); add(up, taper(0.5, 0.5), L.id === 'denim' ? mix(L.a, 0xffffff, 0.28) : shade(L.a, 0.84), hr, 5, hr, 0, -37.6, 0); }   // the hem comes down over the boot
    if (bs === 'spur') {   // a riding boot: tall stitched shaft, pointed toe, a heel under it and a spur behind
      shaft(18); add(ft, G.cyl, BT.b, 24.4, 2.4, 24.4, 0, 17.4, -1); for (const k of [-1, 1]) { add(ft, G.box, BT.b, 1.3, 13, 1.3, k * 4, 8, 10.6).rotation.z = k * 0.42; add(ft, G.box, shade(BT.a, 0.7), 2.4, 6, 3, k * 11.8, 17, -1); }
      vamp(B1, false); add(ft, G.cone, B1, 19, 14, 11, 0, -13.4, 18).rotation.x = Math.PI / 2; add(ft, G.box, shade(BT.a, 0.75), 13, 1.2, 1.2, 0, -8.4, 11.6);
      sole(3, B2, 24, 2); add(ft, G.cone, B2, 19.4, 14.4, 3, 0, -19.5, 18).rotation.x = Math.PI / 2; add(ft, G.box, shade(BT.b, 0.6), 18, 6.4, 9, 0, -17.8, -6.4);
      add(ft, G.box, GOLDM, 2.6, 2.2, 9, 0, -12.6, -14); add(ft, G.cyl, 0xffcd5a, 8.5, 1.4, 8.5, 0, -12.6, -19.6).rotation.z = Math.PI / 2; for (let k = 0; k < 6; k++) add(ft, G.box, 0xffcd5a, 1.2, 2.6, 2.6, 0, -12.6 + Math.sin(k * 1.047) * 5, -19.6 + Math.cos(k * 1.047) * 5);
      if (BT.id === 'snake') for (let k = 0; k < 7; k++) add(ft, G.ball, shade(BT.a, 0.7), 4, 3, 2, (k % 2 ? 4.5 : -4.5) * (k % 3 ? 1 : 0.2), 13 - k * 3.6, 10.4 - (k > 4 ? 0.4 : 0));
      if (BT.id === 'redb') { for (let k = 0; k < 5; k++) add(ft, G.cone, BT.b, 3, 5, 1.4, Math.sin(k * 1.2566) * 3.4, 6 + Math.cos(k * 1.2566) * 3.4, 10.9).rotation.z = -k * 1.2566; add(ft, G.cyl, BT.b, 5, 1.4, 5, 0, 6, 10.9).rotation.x = Math.PI / 2; }
      continue;
    }
    if (bs === 'tall') {   // a long smooth boot the trousers go into
      shaft(23); vamp(); add(ft, G.cyl, BT.b, 24.6, 3, 24.6, 0, 22, -1); sole(4.6); add(ft, G.box, shade(BT.b, 0.6), 21, 2.6, 10, 0, -19.8, -6.4);
      if (BT.id === 'rubber') { rbox(ft, shade(BT.a, 0.8), 20.6, 6, 8, 0, -15.4, 15.4, 2.8); add(ft, G.cyl, shade(BT.a, 0.8), 23.9, 2, 23.9, 0, 3, -1); }
      if (BT.id === 'blackb') for (const y of [4, 13]) { add(ft, G.cyl, BT.b, 24.2, 2.6, 24.2, 0, y, -1); add(ft, G.box, 0xc9c9d0, 1.6, 4, 4.6, s * 12.2, y, 2); }
      if (BT.id === 'goldb') { add(ft, G.box, BT.b, 2.4, 24, 1.4, 0, 9, 10.7); rbox(ft, BT.b, 20.4, 5, 7, 0, -15.6, 15.8, 2.4); add(ft, G.ball, BT.b, 5, 5, 2.4, s * 11.6, 14, -1); }
      continue;
    }
    if (bs === 'low') {   // a canvas shoe: a white rubber toe and sole, a stripe down the side, laces
      shaft(2.6, B1); add(ft, G.cyl, 0xf2e8d5, 24, 1.6, 24, 0, 3.4, -1); vamp(); rbox(ft, 0xf2e8d5, 20.6, 7.4, 8, 0, -14.4, 15.4, 3.2); rbox(ft, BT.a, 10, 9, 4, 0, -2.6, 8.6, 1.6);
      sole(5, 0xf2e8d5); rbox(ft, BT.b, 22.5, 1.3, 31.5, 0, -17.2, 4.5, 0.6); for (const k of [-1, 1]) add(ft, G.box, BT.b, 0.9, 4.4, 13, k * 10.6, -10.4, 1).rotation.x = 0.5;
      for (let k = 0; k < 3; k++) add(ft, G.box, 0xf2e8d5, 8.4, 1.3, 1.6, 0, -4.6 - k * 2.6, 9.6 + k * 1.9).rotation.x = -0.6;
      continue;
    }
    // a working boot: a round toe with a cap, laces up the front and a heavy sole
    shaft(8); add(ft, G.cyl, shade(BT.a, 0.72), 24.6, 2.6, 24.6, 0, 7.4, -1); vamp(); rbox(ft, shade(BT.a, 0.78), 20.6, 7.6, 8.4, 0, -14.2, 15.2, 3.2);
    sole(4.8); add(ft, G.box, shade(BT.b, 0.6), 21.6, 2.6, 10, 0, -19.8, -6.4); rbox(ft, shade(BT.a, 1.15), 8, 14, 2, 0, -1, 10.2, 1);
    for (let k = 0; k < 4; k++) add(ft, G.box, BT.b, 9.5, 1.2, 1.4, 0, 4.4 - k * 3.3, 11 + (k > 2 ? 0.6 : 0));
    if (st === 'stripes' && s < 0) { add(ft, G.tor, 0x6a6a72, 27, 27, 24, 0, 11, -1).rotation.x = Math.PI / 2; for (let k = 0; k < 3; k++) add(ft, G.tor, 0x6a6a72, 7, 9, 5, s * (14 + k * 2.4), 7 - k * 6.4, -3).rotation.y = k % 2 ? 0 : Math.PI / 2; add(ft, G.ball, 0x3a3a40, 13, 13, 13, s * 24, -14.4, -4); }
  }
  // hips, and what the sliders put on them: all of it under the trousers (or the coat, when there are tails)
  const under = st === 'coat' ? O.a : shade(L.a, 0.85);
  if (rear > 0.02) for (const s of [-1, 1]) { const d = 16 + 9 * rear; add(body, G.ball, under, d, d, d, s * 9 * HPW, -3, -18 - 6.5 * rear + d / 2); }
  if (groin > 0.02) add(body, G.ball, st === 'coat' ? O.a : L.a, 13 + 7 * groin, 12 + 6 * groin, 10 + 8 * groin, 0, -5, 13.5 + 1.5 * groin);
  add(body, G.cyl, shade(L.a, 0.85), 50 * HPW, 12, 36, 0, 2, 0);             // hips
  const wg = grp(body, 0, 0, 0); wg.scale.x = Math.max(1, HPW);            // what hangs at the waist sits out as far as the hips do
  add(body, G.cyl, O.c, 52, 7, 38, 0, 7, 0);                                 // belt
  rbox(body, 0xffcd5a, 11, 8.6, 3, 0, 7, 19, 2); add(body, G.box, shade(O.c, 0.7), 5, 4, 3.4, 0, 7, 19);   // buckle
  for (const x of [-21, -9, 9, 21]) add(body, G.box, shade(O.c, 0.75), 2.4, 8.4, 39.2, x, 7, 0);          // belt loops
  if (st !== 'coat') { for (const s of [-1, 1]) { rbox(body, shade(L.a, 0.72), 12, 8, 1.6, s * 11.5 * HPW, -1, -18, 0.8); add(body, G.box, shade(L.a, 0.6), 9, 1, 1.8, s * 11.5 * HPW, 1.6, -18); } add(body, G.box, shade(L.a, 0.68), 1.4, 7, 1.4, 1.2, -1.6, 17.9); }
  switch (WS.id) {
    case 'holster': add(wg, G.box, WS.a, 12, 22, 10, 27, -4, 4); add(wg, G.box, WS.b, 7, 10, 8, 27, 9, 4); break;
    case 'twin': for (const s of [-1, 1]) { add(wg, G.box, WS.a, 12, 22, 10, s * 27, -4, 4); add(wg, G.box, WS.b, 7, 10, 8, s * 27, 9, 4); } break;
    case 'ammo': add(wg, G.cyl, WS.a, 55, 9, 41, 0, 7, 0); for (let i = -4; i <= 4; i++) if (i) add(wg, G.cyl, WS.b, 4, 10, 4, i * 5.4, 7, 20 - Math.abs(i) * 0.7); break;
    case 'sash': add(wg, G.cyl, WS.a, 56, 14, 42, 0, 7, 0); add(wg, G.box, WS.a, 12, 34, 4, -18, -12, 19); add(wg, G.box, WS.b, 12, 4, 4.5, -18, -27, 19); break;
    case 'tool': add(wg, G.box, WS.a, 14, 16, 8, -24, -2, 12); add(wg, G.box, WS.a, 14, 16, 8, 24, -2, 12); add(wg, G.box, WS.b, 4, 24, 4, 24, 4, 17); add(wg, G.box, WS.b, 10, 5, 5, 24, 16, 17); break;
    case 'rope': { const t = add(wg, G.tor, WS.a, 30, 30, 26, 27, -4, 2); t.rotation.y = Math.PI / 2; add(wg, G.tor, WS.b, 24, 24, 22, 27, -4, 2).rotation.y = Math.PI / 2; break; }
    case 'chips': add(wg, G.ball, WS.a, 22, 24, 16, -24, -6, 12); add(wg, G.cyl, WS.b, 12, 3, 12, -24, 6, 12); add(wg, G.cyl, 0xf2e8d5, 12, 3, 12, -24, 9, 12); break;
    case 'champ': add(wg, G.cyl, WS.a, 57, 14, 43, 0, 7, 0); add(wg, G.cyl, WS.b, 26, 4, 26, 0, 7, 20).rotation.x = Math.PI / 2; for (const s of [-1, 1]) add(wg, G.cyl, WS.b, 12, 3, 12, s * 19, 7, 15).rotation.x = Math.PI / 2; break;
    case 'skulls': for (const x of [-22, 22]) { add(wg, G.box, WS.a, 2, 10, 2, x, 0, 16); add(wg, G.box, WS.b, 12, 11, 11, x, -10, 16); add(wg, G.box, 0x140d12, 8, 3, 1, x, -9, 22); } break;
    default: break;
  }

  // ---- torso by style
  add(body, taper(0.5, Math.round((0.44 - 0.05 * FM) * 100) / 100), O.a, 58, 50, 40, 0, 34, 0);
  if (st !== 'poncho') { rbox(body, O.a, Math.round(74 * SW), 15, 36, 0, 53, 0, 7); add(body, taper(0.5, 0.47), shade(O.a, 0.93), 61, 20, 42, 0, 44, 0.5); }   // a yoke across the shoulders and a chest under it
  add(body, taper(0.42, 0.5), O.c, 26, 6, 24, 0, 62, 0);                                                     // collar
  // the chest: two rounded forms under the shirt, set apart so whatever runs down the middle of an outfit still shows.
  // vband and hband lay a strip of an outfit over them (a strap, a stripe, a rib) so it follows the form instead of
  // vanishing into it.
  const BX = 11.5, BY = 42, BRd = 5 + 6 * chest, BZ = 21 + 7 * chest - BRd, bust = chest > 0.02 && st !== 'poncho';
  const vband = (x, w, c) => { if (!bust) return; for (const s of [-1, 1]) { const dx = Math.abs(x) - BX; if (Math.abs(dx) >= BRd - 0.5) continue; const rr = Math.sqrt(BRd * BRd - dx * dx) * 2 + 0.9; add(body, G.cyl, c, rr, w, rr, s * Math.abs(x), BY, BZ).rotation.z = Math.PI / 2; } };
  const hband = (y, h, c) => { if (!bust) return; const dy = y - BY; if (Math.abs(dy) >= BRd - 0.5) return; const rr = Math.sqrt(BRd * BRd - dy * dy) * 2 + 0.9; for (const s of [-1, 1]) add(body, G.cyl, c, rr, h, rr, s * BX, y, BZ); };
  // how far the chest stands out at a point on the front: what is pinned there is moved out by this much
  const bz = (x, y) => { if (!bust) return 0; const dx = Math.abs(x) - BX, dy = y - BY, d2 = BRd * BRd - dx * dx - dy * dy; return d2 > 0 ? Math.max(0, BZ + Math.sqrt(d2) - 20.2) : 0; };
  if (bust) for (const s of [-1, 1]) add(body, G.ball, st === 'overalls' ? O.b : O.a, BRd * 2, BRd * 2, BRd * 2, s * BX, BY, BZ);   // under overalls it is the bib that rises over them
  if (st === 'poncho') { add(body, taper(0.3, 0.62), O.a, 74, 44, 56, 0, 42, 0); add(body, taper(0.585, 0.62), O.b, 74, 6, 56, 0, 26, 0); add(body, taper(0.47, 0.5), shade(O.b, 0.8), 74, 5, 56, 0, 40, 0); }
  if (st === 'shirt' || st === 'badge' || st === 'plaid') { add(body, G.box, O.b, 4, 44, 2, 0, 36, 20.5); for (let i = 0; i < 3; i++) add(body, G.ball, O.c, 4, 4, 3, 0, 22 + i * 12, 21.5); }
  if (st === 'badge') add(body, G.cyl, 0xffcd5a, 9, 3, 9, -15, 46, 20.6 + bz(-15, 46)).rotation.x = Math.PI / 2;
  if (st === 'plaid') { for (let i = 0; i < 3; i++) add(body, taper(0.5, 0.5), O.b, 59 - i, 4, 41, 0, 20 + i * 14, 0); for (const x of [-16, 16]) add(body, G.box, O.b, 4, 48, 41.5, x, 34, 0); vband(16, 4, O.b); hband(48, 4, O.b); hband(34, 4, O.b); }
  if (st === 'overalls') { add(body, G.box, O.b, 30, 26, 3, 0, 28, 20); for (const x of [-12, 12]) add(body, G.box, O.b, 7, 34, 42, x, 44, 0); add(body, taper(0.5, 0.5), 0xf2e8d5, 56, 16, 39, 0, 50, 0); }
  if (st === 'coat' || st === 'suit') {
    add(body, G.box, O.c, 14, 40, 2, 0, 38, 20);                             // shirt front
    for (const s of [-1, 1]) add(body, G.box, shade(O.a, 0.8), 10, 30, 3, s * 10, 44, 20.5).rotation.z = s * 0.25;   // lapels
    add(body, G.box, O.b, 5, 26, 2.5, 0, 38, 21.5);                          // tie
    if (st === 'coat') add(body, taper(0.46, 0.56), O.a, 62, 30, 44, 0, -4, -1);   // long tails
    if (st === 'suit') { for (const x of [-20, -10, 10, 20]) add(body, G.box, O.b, 1.2, 46, 41, x, 34, 0); vband(10, 1.2, O.b); vband(20, 1.2, O.b); }
  }
  if (st === 'vest') { add(body, taper(0.5, 0.45), 0xece6d6, 57, 48, 39, 0, 34, 0); for (const s of [-1, 1]) add(body, G.box, O.a, 22, 46, 42, s * 17, 33, 0); add(body, G.box, O.b, 12, 6, 3, 0, 56, 20); }
  if (st === 'stripes') for (let i = 0; i < 5; i++) { add(body, taper(0.5, 0.5), O.b, 58.5 - i * 0.5, 5, 40.5, 0, 14 + i * 10, 0); hband(14 + i * 10, 5, O.b); }
  if (st === 'hazmat') { add(body, G.box, O.b, 6, 48, 2, 0, 34, 20.5); add(body, taper(0.5, 0.5), O.b, 59, 6, 41, 0, 20, 0); add(body, G.cyl, 0x140d12, 16, 2, 16, 14, 44, 20 + bz(14, 44)).rotation.x = Math.PI / 2; }
  if (st === 'bones') { add(body, G.box, O.b, 5, 40, 2, 0, 36, 20.5); for (let i = 0; i < 4; i++) { add(body, G.box, O.b, 36 - i * 4, 4, 2, 0, 50 - i * 9, 20.5); hband(50 - i * 9, 4, O.b); } }

  // ---- what makes each outfit itself: pockets, collars, trim, the things a person would notice
  {
    const GOLDM = 0xc9a43a, fr = (c, w, h, d, x, y, zo = 0) => add(body, G.box, c, w, h, d, x, y, 21 + zo + bz(x, y)), btn = (c, x, y, zo = 0.6) => add(body, G.ball, c, 3.4, 3.4, 2.2, x, y, 21 + zo + bz(x, y));
    const collar = (c) => { for (const s of [-1, 1]) { const m = add(body, G.box, c, 10, 5.4, 2.4, s * 7, 59.4, 15.6); m.rotation.z = s * 0.55; m.rotation.y = -s * 0.35; } };
    const pocket = (x, y, c = shade(O.a, 0.84)) => { fr(c, 11, 10, 1, x, y); fr(shade(O.a, 0.72), 11.6, 3.2, 1.5, x, y + 4.6); btn(O.c, x, y + 4.4, 1.2); };
    switch (st) {
      case 'poncho': for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; add(body, G.box, i % 2 ? O.b : shade(O.b, 0.8), 2.6, 7.4, 2.6, Math.sin(a) * 45, 17.2, Math.cos(a) * 34); }
        for (let i = 0; i < 12; i++) { const a = ((i + 0.5) / 12) * Math.PI * 2, m = add(body, G.box, O.c, 5.4, 5.4, 1.6, Math.sin(a) * 38.6, 33, Math.cos(a) * 29.2); m.rotation.y = a; m.rotation.z = Math.PI / 4; }
        for (const s of [-1, 1]) add(body, G.box, shade(O.a, 0.55), 2.2, 13, 1.6, s * 2.6, 55, 20.6).rotation.z = -s * 0.3; add(body, taper(0.3, 0.33), O.b, 45, 3, 34.6, 0, 61.6, 0); break;
      case 'shirt': collar(mix(O.a, 0xffffff, 0.16)); pocket(14, 43); add(body, taper(0.5, 0.5), shade(O.a, 0.86), 60.4, 1.4, 41.6, 0, 51.6, 0); break;
      case 'plaid': collar(shade(O.a, 0.85)); for (const s of [-1, 1]) { add(body, G.box, O.c, 5.4, 52, 42.6, s * 9, 35, 0); btn(GOLDM, s * 9, 14, 1); } break;   // braces over the check
      case 'badge': collar(mix(O.a, 0xffffff, 0.16)); pocket(14, 43); for (const s of [-1, 1]) add(body, G.box, O.c, 15, 45, 41.8, s * 21.5, 33, 0);                                    // a leather waistcoat over the shirt
        for (let k = 0; k < 5; k++) add(body, G.cone, 0xffcd5a, 4.4, 6, 2.6, -15 + Math.sin(k * 1.2566) * 6, 46 + Math.cos(k * 1.2566) * 6, 21 + bz(-15, 46)).rotation.z = -k * 1.2566; break;
      case 'overalls': fr(shade(O.b, 0.84), 14, 9, 1.2, 0, 30, 0.6); fr(shade(O.b, 0.7), 14.6, 2.4, 1.6, 0, 34.6, 0.6); for (const s of [-1, 1]) btn(GOLDM, s * 12, 40, 1.2);
        add(body, G.box, 0xc8211b, 8, 13, 3, 15, -7, -18.6).rotation.z = 0.2; add(body, G.box, 0x9aa0aa, 3, 15, 2, -16, -3, -19); add(body, G.box, 0x9aa0aa, 7, 4, 2, -16, 5, -19); break;
      case 'coat':
        for (const s of [-1, 1]) { const m = add(body, G.box, shade(O.a, 0.86), 5, 10, 15, s * 13.6, 63, -2); m.rotation.z = s * 0.28; for (const y of [24, 16]) add(body, G.ball, O.id === 'undertaker' ? 0x9aa0aa : O.b, 3.6, 3.6, 2.2, s * 10.5, y, 20.4); fr(shade(O.a, 0.74), 12, 2.6, 1.4, s * 18, 20, -1.4); }
        add(body, G.box, shade(O.a, 0.55), 2, 26, 3, 0, -7, -24.4);                                                                               // the vent in the tails
        if (O.id === 'undertaker') { add(body, G.tor, GOLDM, 15, 10, 4, 9.5, 21, 20.2); add(body, G.ball, O.c, 9, 7, 3, 0, 57, 21.4); }
        if (O.id === 'showman') { for (let i = 0; i < 3; i++) { add(body, G.box, O.b, 31 - i * 4, 2.6, 1.6, 0, 51 - i * 8.6, 23.2); hband(51 - i * 8.6, 2.6, O.b); for (const s of [-1, 1]) add(body, G.ball, O.b, 4.4, 4.4, 2.4, s * (15.5 - i * 2), 51 - i * 8.6, 23.2 + bz(s * 12, 51 - i * 8.6)); } add(body, G.cyl, O.b, 70.4, 2.4, 50, 0, -17.6, -1); }
        if (O.id === 'gilded') { for (const s of [-1, 1]) add(body, G.box, O.b, 1.8, 31, 1.4, s * 15, 44, 21.8 + bz(s * 15, 44)).rotation.z = s * 0.25; add(body, G.cyl, O.b, 70.4, 2.4, 50, 0, -17.6, -1); add(body, G.ball, O.b, 7, 7, 2.6, -17, 38, 21 + bz(-17, 38), 0.4); }
        break;
      case 'suit': fr(O.c, 6.4, 4.4, 1.2, -15.5, 48, 0.4); for (const y of [22, 15]) add(body, G.ball, shade(O.a, 0.6), 3.6, 3.6, 2.2, 3.4, y, 20.6); for (const s of [-1, 1]) fr(shade(O.a, 0.74), 12, 2.4, 1.3, s * 18, 19, -1.6);
        if (O.id === 'highroller') { add(body, G.ball, 0xc8211b, 6.4, 6.4, 3.4, 14.5, 51, 21.6 + bz(14.5, 51)); add(body, G.tor, GOLDM, 15, 10, 4, 10, 20, 20.2); } break;
      case 'vest': for (const s of [-1, 1]) add(body, G.cone, O.b, 9, 11, 4.4, s * 6.5, 57, 21.2).rotation.z = s * Math.PI / 2; add(body, G.ball, shade(O.b, 0.75), 5, 5, 4, 0, 57, 21.8); add(body, G.tor, GOLDM, 13, 9, 4, 12, 22, 21.4); for (let i = 0; i < 3; i++) add(body, G.ball, O.b, 3.2, 3.2, 2, 7.4, 40 - i * 9, 21.6); break;
      case 'stripes': fr(0xf2e8d5, 13, 7.4, 1, -13.5, 47, 0.4); for (const x of [-17, -15, -12.5, -10]) fr(0x140d12, 1.2, 4.6, 1.2, x, 47, 0.6); break;
      case 'hazmat': add(body, G.tor, shade(O.a, 0.84), 36, 36, 44, 0, 62.4, 0).rotation.x = Math.PI / 2; add(body, G.cyl, 0x140d12, 19, 1.2, 19, 0, 38, -20.4).rotation.x = Math.PI / 2; for (let k = 0; k < 3; k++) add(body, G.cyl, O.a, 6.6, 1.5, 6.6, Math.sin(k * 2.094) * 5, 38 + Math.cos(k * 2.094) * 5, -20.7).rotation.x = Math.PI / 2;
        add(body, G.box, 0x3a3a40, 12, 8, 2, -13, 26, 20.4); add(body, G.box, 0x9fd6e0, 9, 4, 2.4, -13, 26, 20.5, 0.5); break;
      case 'bones': for (let i = 0; i < 6; i++) add(body, G.box, O.b, 6.4, 5, 1.6, 0, 13 + i * 8, -20.4); add(body, G.box, O.b, 22, 4.4, 1.6, 0, 3, 18.4); for (const s of [-1, 1]) add(body, G.box, O.b, 10, 4, 1.6, s * 13, -1, 17.6).rotation.z = -s * 0.5; break;
      default: break;
    }
  }
  switch (NK.id) {
    case 'kerchief': add(body, G.cyl, NK.a, 30, 8, 28, 0, 60, 0); add(body, G.cone, NK.a, 26, 20, 6, 0, 48, 19).rotation.x = Math.PI; add(body, G.ball, NK.b, 4, 4, 2, 0, 50, 22.5); break;
    case 'bolo': add(body, G.box, NK.a, 1.6, 26, 1.6, -3, 44, 21.5); add(body, G.box, NK.a, 1.6, 26, 1.6, 3, 44, 21.5); add(body, G.ball, NK.b, 8, 9, 4, 0, 56, 22); break;
    case 'scarf': add(body, G.cyl, NK.a, 36, 12, 34, 0, 60, 0); add(body, G.box, NK.a, 12, 44, 5, 12, 38, 20); add(body, G.box, NK.b, 12, 5, 5.5, 12, 18, 20); add(body, G.box, NK.b, 12, 5, 5.5, 12, 30, 20); break;
    case 'bowtie': for (const s of [-1, 1]) add(body, G.cone, NK.a, 12, 12, 5, s * 7, 57, 21).rotation.z = s * Math.PI / 2; add(body, G.ball, NK.b, 5, 5, 4, 0, 57, 22); break;
    case 'chain': { const t = add(body, G.tor, NK.a, 36, 44, 30, 0, 50, 6); t.rotation.x = 1.1; add(body, G.box, NK.b, 9, 9, 3, 0, 32, 21.5, 0.5).rotation.z = Math.PI / 4; break; }
    case 'bandolier': { const bo = bust ? 7 * chest : 0, b = add(body, G.box, NK.a, 9, 76, 43 + bo, 0, 34, bo / 2); b.rotation.z = 0.75; for (let i = -3; i <= 3; i++) add(body, G.cyl, NK.b, 4, 8, 4, i * 6.5, 34 - i * 7, 21.5 + bo).rotation.z = 0.75; break; }
    case 'teeth': { const t = add(body, G.tor, NK.a, 34, 40, 20, 0, 52, 6); t.rotation.x = 1.1; for (let i = -2; i <= 2; i++) add(body, G.cone, NK.b, 4, 9, 4, i * 6, 38 + Math.abs(i) * 2.5, 21).rotation.x = Math.PI; break; }
    case 'lei': for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; add(body, G.ball, i % 2 ? NK.a : NK.b, 11, 9, 11, Math.sin(a) * 24, 56 - Math.cos(a) * 6 - 4, Math.cos(a) * 20); } break;
    case 'noose': add(body, G.cyl, NK.a, 28, 6, 26, 0, 60, 0); add(body, G.box, NK.a, 5, 30, 5, 6, 44, 20); add(body, G.box, NK.b, 7, 8, 7, 6, 56, 20); break;
    case 'medal': { const mz = Math.max(bz(-14, 46), bz(-14, 38)); add(body, G.box, NK.a, 8, 16, 2, -14, 46, 20.6 + mz); add(body, G.cyl, NK.b, 11, 3, 11, -14, 35, 21 + mz, 0.5).rotation.x = Math.PI / 2; break; }
    default: break;
  }
  // ---- arms: shoulder pivots; the sleeve takes the arm's length and carries the hand (and the gun) out with it
  for (const s of [-1, 1]) {
    const arm = grp(body, s * 36 * SW, 54, 0); R[s < 0 ? 'armL' : 'armR'] = arm; arm.scale.set(ARMW / WX, 1, ARMW / WZ);
    const sl = grp(arm, 0, 0, 0), wr = grp(arm, 0, -43 * (aK - 1), 0); sl.scale.y = aK; R[s < 0 ? 'wristL' : 'wristR'] = wr;
    // shoulder, upper arm, an elbow, a forearm into the cuff, and a hand with a thumb and fingers
    add(arm, G.ball, O.a, 25, 23, 25, 0, 0, 0);
    add(sl, taper(0.5, 0.44), O.a, 21, 22, 21, 0, -12, 0); add(sl, G.ball, shade(O.a, 0.92), 19, 12, 19, 0, -23, 0); add(sl, taper(0.46, 0.4), O.a, 20, 18, 20, 0, -31, 0);
    if (st === 'stripes') for (let i = 0; i < 3; i++) add(sl, G.cyl, O.b, 21.5 - i, 4, 21.5 - i, 0, -10 - i * 10, 0);
    if (st === 'plaid') add(sl, G.cyl, O.b, 21, 4, 21, 0, -22, 0);
    if (st === 'shirt' || st === 'plaid' || st === 'badge') add(sl, taper(0.5, 0.5), shade(O.a, 0.84), 21.4, 4.4, 21.4, 0, -35.4, 0);   // rolled back above the cuff
    if (st === 'vest') add(sl, G.cyl, O.b, 22, 2.6, 22, 0, -15, 0);                                                                  // sleeve garters
    if (st === 'coat' || st === 'suit') for (let k = 0; k < 2; k++) add(sl, G.ball, O.id === 'undertaker' ? 0x9aa0aa : O.b, 2.6, 2.6 / aK, 2.6, 0, -33.6 - k * 3.4, -10.4);     // cuff buttons
    if (st === 'hazmat') add(sl, G.cyl, O.b, 21.6, 3, 21.6, 0, -36, 0);
    add(sl, G.cyl, O.c, 18.5, 6, 18.5, 0, -40, 0);                              // cuff
    const bare = GL.id === 'bare', hc = bare ? (st === 'hazmat' || st === 'bones' ? O.b : tone) : GL.a, big = GL.style === 'big' ? 1.3 : 1, hk = Math.pow(ARMW, -0.5) * (1 - 0.06 * FM);
    const hand = grp(wr, 0, -50, 0); hand.scale.set(big * hk, big, big * hk);     // a thick arm does not mean a hand to match
    rbox(hand, hc, 10, 14, 17, 0, 1, 0, 3.6);                                                                  // palm
    for (let k = 0; k < 4; k++) { const f = rbox(hand, shade(hc, k % 2 ? 0.92 : 1), 9, 9, 3.8, 0, -8.5, -6.3 + k * 4.2, 1.6); f.rotation.z = s * 0.25; f.position.x = s * -1.2; }   // four fingers, curled in a little
    { const t = rbox(hand, hc, 5, 9, 5, s * -5, 0, 9.5, 2); t.rotation.x = 0.5; }                              // thumb
    if (!bare) { add(sl, G.cyl, GL.b, 20, 5, 20, 0, -42, 0); if (GL.style === 'long') add(sl, taper(0.5, 0.46), GL.a, 21.5, 16, 21.5, 0, -32, 0); if (GL.style === 'wrap') for (let i = 0; i < 3; i++) rbox(wr, GL.b, Math.round(11 * hk + 1), 2.2, Math.round(18 * hk + 1), 0, -46 - i * 3.6, 0, 1); }
    // shoulder piece (left shoulder for single items)
    switch (SH.id) {
      case 'patch': add(arm, G.ball, SH.a, 28, 14, 28, 0, 8, 0); add(arm, G.cyl, SH.b, 29, 2, 29, 0, 4, 0); break;
      case 'epaulette': add(arm, G.cyl, SH.a, 30, 4, 30, 0, 11, 0); for (let i = 0; i < 5; i++) add(arm, G.box, SH.a, 2, 9, 2, s * 13, 5, -10 + i * 5); add(arm, G.ball, SH.b, 8, 5, 8, 0, 14, 0); break;
      case 'pauldron': if (s < 0) { add(arm, G.ball, SH.a, 36, 26, 34, -2, 8, 0); add(arm, G.ball, SH.b, 38, 6, 36, -2, 2, 0); add(arm, G.ball, SH.b, 6, 6, 6, -2, 20, 0); } break;
      case 'spikes': add(arm, G.ball, SH.a, 30, 16, 30, 0, 9, 0); for (const z of [-8, 0, 8]) add(arm, G.cone, SH.b, 7, 16, 7, s * 6, 20, z).rotation.z = -s * 0.5; break;
      case 'crow': case 'parrot': if (s < 0) { const b = grp(arm, -2, 16, 0); add(b, G.ball, SH.a, 14, 18, 16, 0, 8, 0); add(b, G.ball, SH.a, 11, 11, 11, 0, 20, 3); add(b, G.cone, SH.b, 5, 9, 5, 0, 19, 10).rotation.x = Math.PI / 2; add(b, G.box, SH.id === 'parrot' ? SH.b : SH.a, 6, 5, 18, 0, 4, -10); add(b, G.ball, 0x140d12, 2.5, 2.5, 2.5, -4, 22, 7); add(b, G.ball, 0x140d12, 2.5, 2.5, 2.5, 4, 22, 7); R.bird = b; } break;
      case 'fur': add(arm, G.ball, SH.a, 36, 22, 36, 0, 8, 0); add(arm, G.ball, SH.b, 22, 12, 30, s * 6, 14, 0); break;
      case 'roll': if (s < 0) { add(arm, G.cyl, SH.a, 20, 44, 20, 8, 14, 0).rotation.x = Math.PI / 2; for (const z of [-14, 14]) add(arm, G.cyl, SH.b, 21, 4, 21, 8, 14, z).rotation.x = Math.PI / 2; } break;
      case 'lantern': if (s < 0) { add(arm, G.box, SH.a, 3, 14, 3, -4, 16, 0); add(arm, G.cyl, SH.a, 12, 3, 12, -4, 30, 0); add(arm, G.cyl, SH.b, 10, 12, 10, -4, 23, 0, 1.6); } break;
      default: break;
    }
  }
  // ---- gun in the right hand
  const gun = R.gun = grp(R.wristR, 0, -52, 8); gun.scale.set(1 / ARMW, 1, 1 / ARMW);   // the gun is the same gun in any hand
  add(gun, G.box, 0x2a2a32, 7, 10, 44, 0, 4, 18); add(gun, G.box, 0x4E3324, 7, 16, 9, 0, -4, 2); add(gun, G.cyl, 0x46464e, 5, 16, 5, 0, 6, 42).rotation.x = Math.PI / 2;

  // ---- head: one sculpted surface (headkit.js), with every feature placed on its skin
  const head = R.head = grp(body, 0, 66, 0); head.scale.set(HS / WX, HS, HS / WZ);
  const HK = headKit(JAW.id), fz = HK.fz, PI = Math.PI;
  const gm = (p, g, c, glow = 0) => { const m = new THREE.Mesh(g, mat(c, glow)); p.add(m); return m; };
  const nk = 18 * (1 - 0.12 * FM) * (1 + 0.22 * Math.max(0, wt)) * (1 + 0.12 * mu);
  add(head, G.cyl, tone, nk, 12, nk, 0, 0, 0);   // neck
  // What hangs off the head past the chin (a beard) has to clear the chest, and that is as deep as the body is heavy.
  const HF = (18 * WZ + 2) / HS;
  const paint = F.id === 'skull', sk = paint ? F.a : tone, covered = F.id === 'shades' || F.id === 'gasmask' || F.id === 'hockey';
  const lowMask = F.id === 'bandana' || F.id === 'gasmask', hard = F.id === 'hockey' || F.id === 'gasmask', dark = 0x140d12;
  gm(head, HK.geo, sk);
  if (wt > 0.25) for (const s of [-1, 1]) add(head, G.ball, sk, 15 + 5 * wt, 13, 20, s * (HK.hw(9) - 4), 8.5, HK.zc(9) + 2);   // weight shows in the face too
  if (!['long', 'bangs', 'bob', 'wavy'].includes(HAIR.id)) for (const s of [-1, 1]) { const ex = HK.fx(-1, 24); add(head, G.ball, shade(tone, 0.9), 6.5, 14, 10, s * (ex + 1.2), 24, -1.5); add(head, G.ball, shade(tone, 0.68), 2.5, 8, 5, s * (ex + 3.4), 24, -0.6); }   // ears
  const bc = HAIR.id !== 'bald' || FH.id !== 'none' ? HC : shade(sk, 0.6);
  const eyeOn = (s) => !covered && !(F.id === 'patch' && s > 0);
  // a small rounded thing on the face at (x, y), standing `o` off the skin: lips, brows, scars, spots
  const dab = (c, w, h, d, x, y, o = 0, r = 0) => { const m = add(head, G.ball, c, w, h, d, x, y, fz(x, y) + o); m.rotation.z = r; return m; };
  if (paint) { for (const s of [-1, 1]) if (eyeOn(s)) dab(dark, 11, 12, 3, s * 12, 31, 0.2); add(head, G.cone, dark, 6, 7, 3, 0, 21, fz(0, 21) + 0.4); for (let i = -3; i <= 3; i++) add(head, G.box, F.b, 1.3, 7, 1.4, i * 3.6, 8, fz(i * 3.6, 8) + 0.1); dab(F.b, 26, 1.4, 1.4, 0, 8, 0.1); }
  else {
    // nose: a bridge that comes forward as it comes down, a rounded tip and two wings
    if (!hard) {
      const n1 = shade(sk, 0.93), n2 = shade(sk, 0.85), f0 = fz(0, 24);
      const nose = (bw, bl, tw, th, td, fwd, drop = 0, wing = 1) => {
        const b = add(head, taper(0.32, 0.5), n1, bw, bl, bw * 0.9, 0, 25 - drop * 0.3, f0 + fwd * 0.42); b.rotation.x = -Math.atan2(fwd, bl) * 0.9;
        add(head, G.ball, n1, tw, th, td, 0, 18.4 - drop, f0 + fwd); if (wing) for (const s of [-1, 1]) add(head, G.ball, n2, tw * 0.5 * wing, th * 0.62, td * 0.6, s * tw * 0.44, 17.6 - drop, f0 + fwd * 0.55);
        return b;
      };
      switch (NS.id) {
        case 'small': nose(5.5, 9, 6.5, 5.4, 6, 3); break;
        case 'broad': nose(8.5, 12, 11.5, 7.4, 8, 4.2, 0, 1.3); break;
        case 'long': nose(7, 16, 8.6, 7, 9, 6, 2.6); break;
        case 'button': nose(4.6, 7, 8.4, 7.6, 8, 3.6, -0.6, 0); break;
        case 'hook': nose(7.4, 13, 8.4, 7.6, 9, 6.6, 1.6).rotation.x -= 0.16; add(head, G.ball, n1, 6.4, 6, 6, 0, 25.5, f0 + 3.6); break;
        case 'broken': nose(7.4, 13, 9, 7, 8, 4.4).rotation.z = 0.22; break;
        default: nose(7, 13, 8.8, 7, 8, 4.6); break;
      }
    }
    // eyes: an oval white set into the head, an iris of the chosen colour, a pupil and a glint, under a lid that gives them a look
    for (const s of [-1, 1]) {
      if (!eyeOn(s)) continue;
      const e = EY.id, w = e === 'wide' ? 12 : 11, h = e === 'wide' ? 10 : e === 'narrow' ? 5.6 : 8, g = grp(head, s * 12, 30.5, fz(12, 30.5) - 0.3);
      g.rotation.y = s * 0.16; g.rotation.z = e === 'almond' ? s * 0.17 : e === 'down' ? -s * 0.17 : 0;
      add(g, G.ball, 0xf6f1e8, w, h, 3.4, 0, 0, 0, 0.22);
      const ir = Math.min(6, h * 0.82), iy = e === 'sleepy' ? -0.6 : 0;
      add(g, G.cyl, EC, ir, 0.7, ir, s * 0.5, iy, 1.5).rotation.x = PI / 2; add(g, G.cyl, dark, ir * 0.5, 0.8, ir * 0.5, s * 0.5, iy, 1.62).rotation.x = PI / 2; add(g, G.ball, 0xffffff, 1.5, 1.5, 0.9, s * 0.5 + 1.3, iy + 1.3, 2);
      const lidY = e === 'sleepy' ? h * 0.2 : e === 'wide' ? h * 0.56 : h * 0.48, lid = e === 'lashes' ? 0x1a1210 : shade(sk, 0.86);
      add(g, G.ball, lid, w + 1.6, h * (e === 'lashes' ? 0.5 : 0.62), 4.6, 0, lidY + h * 0.14, 0.1);                                                              // upper lid
      if (e === 'lashes') add(g, G.ball, 0x1a1210, 5, 1.8, 2, s * (w / 2 + 1.2), h * 0.44, 0.9).rotation.z = s * 0.6;
      if (e === 'bags') add(g, G.ball, shade(sk, 0.78), w - 1, 3, 2.4, 0, -h / 2 - 0.9, 0.1);
      if (e === 'narrow' || e === 'sleepy') add(g, G.ball, shade(sk, 0.9), w, h * 0.4, 4, 0, -h * 0.52, 0);                                   // a lower lid closes them further
    }
    // brows
    if (F.id !== 'shades' && !hard) for (const s of [-1, 1]) {
      const bw = (w, h, x, y, r) => { dab(bc, w, h, 2.8, s * x, y, 0.5, s * r).rotation.y = s * 0.18; };
      switch (BR.id) {
        case 'thick': bw(14.5, 4.6, 12, 38.4, -0.08); break; case 'thin': bw(12.5, 1.7, 12, 38.2, -0.12); break;
        case 'arched': bw(8.4, 2.8, 8.8, 38.2, 0.32); bw(8, 2.6, 15.4, 38.8, -0.38); break;
        case 'angry': bw(13.5, 3.4, 12, 37.6, 0.34); break; case 'worried': bw(13.5, 3, 12, 38.8, -0.36); break;
        case 'uni': bw(14, 3.4, 12, 38.2, -0.06); if (s > 0) dab(bc, 12, 3, 2.8, 0, 38.4, 0.5); break;
        case 'none': break;
        default: bw(13.5, 3, 12, 38.2, -0.1); break;
      }
    }
    // mouth: hidden by a mask, and by a beard that grows over it
    if (!lowMask && F.id !== 'hockey' && FH.id !== 'beard' && FH.id !== 'long') {
      const ln = shade(tone, 0.5), lip = LP.c !== undefined ? LP.c : mix(tone, 0xb04a48, MO.id === 'full' ? 0.45 : 0.22), my = 9.6;
      const line = (w, y = my, x = 0, r = 0) => dab(ln, w, 1.9, 1.8, x, y, 0, r);
      switch (MO.id) {
        case 'smile': line(9, my - 0.5); line(5.6, my + 0.5, -6.4, -0.5); line(5.6, my + 0.5, 6.4, 0.5); dab(lip, 9.5, 3, 2.2, 0, my - 3.2, -0.1); break;
        case 'frown': line(9, my + 0.5); line(5.6, my - 0.6, -6.4, 0.5); line(5.6, my - 0.6, 6.4, -0.5); dab(lip, 9.5, 3, 2.2, 0, my - 2.6, -0.1); break;
        case 'smirk': line(11, my, -1); line(5.6, my + 1.1, 6.6, 0.6); dab(lip, 9.5, 3, 2.2, -0.5, my - 3, -0.1); break;
        case 'full': dab(shade(lip, 0.9), 13, 3.6, 2.6, 0, my + 1.4, 0.1); line(11.5, my - 0.3); dab(lip, 12, 4.4, 3, 0, my - 2.8, 0.2); break;
        case 'grin': dab(ln, 17, 7, 2, 0, my - 1, -0.2); add(head, G.box, 0xf6f1e8, 12.5, 3.4, 1.6, 0, my - 0.4, fz(0, my) + 0.3); line(5.6, my + 1.4, -8, -0.7); line(5.6, my + 1.4, 8, 0.7); dab(lip, 10, 2.6, 2.2, 0, my - 4.6, 0); break;
        case 'thin': line(13, my); break;
        default: line(14.5); dab(lip, 10, 3.2, 2.4, 0, my - 3, -0.1); break;
      }
    }
    // marks: paint, scars and what the years leave
    const scar = mix(tone, 0xc8585a, 0.5);
    if (!hard) switch (MK.id) {
      case 'freckles': for (const s of [-1, 1]) for (const [x, y] of [[8.5, 24.6], [12, 23], [15.5, 25], [19, 23.4], [11, 26.2], [16.6, 21.8]]) dab(shade(tone, 0.68), 1.7, 1.7, 1, s * x, y, 0.1); break;
      case 'mole': dab(0x2a1810, 2.4, 2.4, 1.6, 14, 14, 0.1); break;
      case 'blush': for (const s of [-1, 1]) dab(mix(tone, 0xe05a6a, 0.45), 10, 6, 1.6, s * 16, 22.4, 0); break;
      case 'scareye': dab(scar, 2.2, 20, 1.6, -12.5, 31, 2.2, 0.2); break;
      case 'scarcheek': dab(scar, 13, 1.9, 1.4, 15.5, 22.6, 0.1, 0.45); for (const k of [-1, 0, 1]) dab(scar, 1.3, 4.6, 1.4, 15.5 + k * 3.6, 22.6 + k * 1.7, 0.1, 0.45); break;
      case 'scarlip': dab(scar, 1.9, 9.5, 1.6, 5, 10, 0.5, 0.2); break;
      case 'liner': for (const s of [-1, 1]) { dab(dark, 12.6, 1.5, 1.6, s * 12, 26.2, 0.6); dab(dark, 5, 1.4, 1.6, s * 18.6, 28.2, 0.4, s * 0.7); } break;
      case 'shadow': case 'smoky': for (const s of [-1, 1]) { dab(MK.c, 13.5, 3.6, 2, s * 12, 35.4, 0.9); if (MK.id === 'smoky') { dab(MK.c, 12.6, 2, 1.6, s * 12, 25.8, 0.4); dab(MK.c, 3, 7, 1.6, s * 18.8, 30.4, 0.3); } } break;
      case 'warpaint': for (const s of [-1, 1]) { dab(MK.c, 10.5, 2.4, 1.4, s * 13.5, 24.8, 0.1); dab(MK.c, 8.5, 2.4, 1.4, s * 14.5, 21.6, 0.1); } break;
      case 'band': gm(head, HK.shell({ k: 1.012, kin: 0.97, a0: -1.95, a1: 1.95, top: 36.4, bot: 25.2, nv: 4 }), MK.c); break;
      case 'tear': dab(0x1c2a3a, 2.6, 3.8, 1.4, -15.5, 24, 0.1); break;
      case 'wrinkles': for (const s of [-1, 1]) { dab(shade(tone, 0.8), 4.4, 1, 1.2, s * 20, 31.8, 0.1, s * 0.3); dab(shade(tone, 0.8), 4.4, 1, 1.2, s * 20, 29.6, 0.1, -s * 0.3); dab(shade(tone, 0.8), 9, 1.2, 1.2, s * 12, 25, 0.1); dab(shade(tone, 0.78), 1.2, 8, 1.2, s * 8.6, 14.5, 0.1, s * 0.25); dab(shade(tone, 0.76), 1.2, 4, 1.2, s * 2.4, 37.6, 0.5); } dab(shade(tone, 0.82), 22, 1.1, 1.2, 0, 43.4, 0.1); break;
      default: break;
    }
  }
  // Facewear and facial hair hang on one group in front of the face.
  const fg = grp(head, 0, 0, 0), sh = (c, o, glow = 0) => gm(fg, HK.shell(o), c, glow), arms = (c, y = 31) => { for (const s of [-1, 1]) { const x = HK.hw(y) + 1; add(fg, G.box, c, 1.4, 1.8, 24, s * x, y, 7); } };
  switch (F.id) {
    case 'bandana': sh(F.a, { k: 1.075, kin: 0.97, top: pl([[0, 21.5], [1.2, 20], [PI, 17]]), bot: pl([[0, -5], [0.9, -3], [PI, 2]]) }); add(fg, G.cone, F.a, 26, 17, 7, 0, -9, fz(0, 2) - 1).rotation.x = PI; for (const s of [-1, 1]) add(fg, G.ball, shade(F.a, 0.85), 9, 6, 5, s * 5, 15, HK.pt(PI, 15, 1.1)[1] - 2).rotation.z = s * 0.5;
      for (const [x, y] of [[-12, 12], [0, 14], [12, 12], [-6, 5], [6, 5]]) add(fg, G.ball, F.b, 3.4, 3.4, 2, x, y, fz(x, y) * 1.075 + 1.1); break;
    case 'specs': for (const s of [-1, 1]) add(fg, G.tor, F.a, 14, 14, 9, s * 12, 30.5, fz(12, 30.5) + 2.6).rotation.y = s * 0.16; add(fg, G.box, F.a, 9, 1.6, 1.6, 0, 32, fz(4, 32) + 2.6); arms(F.a); break;
    case 'shades': for (const s of [-1, 1]) { const l = add(fg, G.ball, F.a, 15.5, 11.5, 3, s * 12, 30, fz(12, 30) + 2.2); l.rotation.y = s * 0.16; add(fg, G.ball, 0x6a6a7a, 4, 2, 1, s * 14.5, 32.6, fz(14, 32) + 3.4).rotation.z = 0.5; } add(fg, G.box, F.a, 30, 2.2, 2, 0, 34.4, fz(6, 34) + 2.2); add(fg, G.box, F.a, 7, 2, 2, 0, 31, fz(2, 31) + 2.4); arms(F.a, 33); break;
    case 'patch': add(fg, G.ball, F.a, 13.5, 12.5, 4.4, 12, 30.6, fz(12, 30.6) + 0.6).rotation.y = 0.16; { const m = sh(F.a, { k: 1.03, kin: 1.0, top: 36.6, bot: 34.4, nv: 2, lift: 0.01 }); m.rotation.z = -0.16; m.position.set(1.5, -0.6, 0); } break;
    case 'cigar': add(fg, G.cyl, F.a, 5, 20, 5, 7.5, 9, fz(7, 9) + 8.5).rotation.x = PI / 2 - 0.2; add(fg, G.ball, F.b, 6, 6, 6, 7.5, 11, fz(7, 9) + 18.6, 1.6); add(fg, G.cyl, 0xe8d8b0, 5.3, 3, 5.3, 7.5, 7.6, fz(7, 9) + 2).rotation.x = PI / 2 - 0.2; break;
    case 'monocle': { const z = fz(12, 30.5) + 2.6; add(fg, G.tor, F.a, 16, 16, 9, 12, 30.5, z).rotation.y = 0.16; add(fg, G.cyl, 0xbfe4ee, 13, 0.5, 13, 12, 30.5, z - 0.2).rotation.x = PI / 2; add(fg, G.box, F.a, 1, 22, 1, 20.6, 19, z - 3).rotation.z = 0.12; break; }
    case 'gasmask': sh(F.a, { k: 1.085, kin: 0.97, a0: -2.05, a1: 2.05, top: pl([[0, 37], [1.2, 35], [2.1, 30]]), bot: pl([[0, -6], [1.2, -3], [2.1, 4]]) }); sh(0x1c1a20, { k: 1.06, kin: 0.99, top: 32, bot: 28.6, nv: 2 });
      for (const s of [-1, 1]) { const z = fz(12, 30) * 1.085; add(fg, G.cyl, 0x1c1a20, 17, 4, 17, s * 12, 30, z).rotation.x = PI / 2; add(fg, G.cyl, F.b, 13.5, 4.6, 13.5, s * 12, 30, z + 0.6, 0.6).rotation.x = PI / 2; }
      add(fg, G.cyl, 0x1c1a20, 17, 13, 17, 0, 8, fz(0, 8) + 6).rotation.x = PI / 2; add(fg, G.cyl, 0x4a4a52, 18, 3, 18, 0, 8, fz(0, 8) + 12).rotation.x = PI / 2; for (const s of [-1, 1]) add(fg, G.cyl, 0x2a2a30, 10, 7, 10, s * 15, 9, fz(15, 9) + 3).rotation.z = PI / 2 - s * 0.9; break;
    case 'hockey': sh(F.a, { k: 1.08, kin: 1.0, a0: -1.2, a1: 1.2, top: pl([[0, 46], [1.2, 42]]), bot: pl([[0, -3], [1.2, 4]]) }); sh(0x2a2a30, { k: 1.045, kin: 0.99, top: 31, bot: 28, nv: 2 });
      for (const s of [-1, 1]) { const z = fz(11.5, 31) * 1.08; add(fg, G.ball, dark, 9.5, 7, 2.4, s * 11.5, 31, z + 0.6); add(fg, G.box, F.b, 3.4, 9, 1, s * 13, 41, fz(13, 41) * 1.08 + 0.7).rotation.z = s * 0.2; add(fg, G.box, F.b, 3, 7, 1, s * 16, 18, fz(16, 18) * 1.08 + 0.6).rotation.z = -s * 0.5; }
      add(fg, G.box, F.b, 3.4, 8, 1, 0, 43, fz(0, 43) * 1.08 + 0.7); for (let i = 0; i < 3; i++) for (const x of [-5, 0, 5]) add(fg, G.ball, dark, 2.4, 2.4, 1.6, x, 6 + i * 5, fz(x, 6 + i * 5) * 1.08 + 0.5); break;
    default: break;
  }
  // facial hair, in the colour of the hair. What sits on the front of the face is left off under a mask; a beard's
  // length still shows below one.
  {
    const fc = HC, fd = shade(HC, 0.8), front = !lowMask && F.id !== 'hockey', fh = FH.id, ly = 14.4, lz = (x, y) => fz(x, y);
    const tash = (w, h, d = 4.4, y = ly) => { add(fg, G.ball, fc, w * 0.56, h, d, -w * 0.24, y, lz(w * 0.24, y) + 0.6).rotation.z = 0.16; add(fg, G.ball, fc, w * 0.56, h, d, w * 0.24, y, lz(w * 0.24, y) + 0.6).rotation.z = -0.16; };
    if (front) switch (fh) {
      case 'stubble': sh(mix(tone, HC, 0.4), { k: 1.014, kin: 0.97, a0: -2.0, a1: 2.0, top: pl([[0, 15.6], [0.5, 12.6], [1.0, 17.6], [2.0, 23]]), bot: -6 }); break;
      case 'stache': tash(24, 5); break;
      case 'pencil': tash(19, 2, 2.4, 13.6); break;
      case 'handlebar': tash(21, 4.6); for (const s of [-1, 1]) { add(fg, G.ball, fc, 9.5, 3, 3.4, s * 13.6, 15.6, lz(13.6, 15.6) + 0.8).rotation.z = s * 0.75; add(fg, G.ball, fd, 4, 4, 3.4, s * 16.8, 19, lz(16.8, 19) + 0.8); } break;
      case 'horseshoe': tash(25, 5.6); for (const s of [-1, 1]) add(fg, G.ball, fc, 5.6, 17, 4.4, s * 11.6, 7.4, lz(11.6, 7.4) + 0.4); break;
      case 'walrus': tash(28, 8.6, 6.4, 13); for (const s of [-1, 1]) add(fg, G.ball, fd, 9.5, 8, 5, s * 9, 9, lz(9, 9) + 0.8).rotation.z = -s * 0.3; break;
      case 'soul': add(fg, G.ball, fc, 5, 6.4, 3, 0, 3.6, lz(0, 3.6) + 0.3); break;
      case 'goatee': tash(21, 4.4); for (const s of [-1, 1]) add(fg, G.ball, fc, 4.6, 11, 3.6, s * 9.8, 9.2, lz(9.8, 9.2) + 0.3); sh(fc, { k: 1.09, kin: 0.97, a0: -0.62, a1: 0.62, top: 5.6, bot: -7, nv: 5 }); break;
      case 'vandyke': tash(20, 4.2); for (const s of [-1, 1]) add(fg, G.ball, fc, 8.5, 2.8, 3.2, s * 13, 15.6, lz(13, 15.6) + 0.7).rotation.z = s * 0.7; add(fg, G.ball, fc, 10, 7, 7, 0, 2.4, lz(0, 2.4) - 0.6); add(fg, G.cone, fc, 9, 15, 7.5, 0, -6.5, lz(0, 0) - 2).rotation.x = PI; break;
      case 'chinstrap': sh(fc, { k: 1.05, kin: 0.97, a0: -1.42, a1: 1.42, top: pl([[0, 3.6], [0.9, 6], [1.42, 26]]), bot: -7 }); break;
      case 'chops': for (const s of [-1, 1]) sh(fc, { k: 1.07, kin: 0.97, a0: s > 0 ? 0.72 : -1.5, a1: s > 0 ? 1.5 : -0.72, top: pl([[0.7, 14], [1.1, 30], [1.5, 31]]), bot: pl([[0.7, 3.5], [1.5, 2]]), nv: 5 }); break;
      default: break;
    }
    if (fh === 'beard' || fh === 'long') {
      sh(fc, { k: 1.085, kin: 0.97, a0: -1.5, a1: 1.5, top: pl([[0, 16.6], [0.45, 13.4], [0.95, 19], [1.5, 30]]), bot: -8 });                    // round the jaw and under the chin
      add(fg, G.ball, fc, 31, 21, 19, 0, -8.5, Math.max(fz(0, 0) - 5, HF - 9.5));                                                                 // the length of it lies on the chest
      if (fh === 'long') { add(fg, G.ball, fc, 25, 24, 17, 0, -21, HF - 8.5); add(fg, G.ball, fd, 17, 16, 13, 0, -34, HF - 7); }
      if (front) { tash(25, 5.4, 4.6, 15); add(fg, G.ball, shade(fc, 0.5), 11, 2.6, 2.4, 0, 11, fz(0, 11) * 1.085 + 0.2); }
    }
  }
  // hair: a scalp that follows the head down to a hairline, and on it whatever the style adds. A hat that covers the
  // crown hides the top of it; what hangs below the hat is always there.
  const open = ['none', 'visor', 'halo', 'horns', 'crown'].includes(H.id);
  if (HAIR.id !== 'bald') {
    const hc = HC, hd = shade(HC, 0.8), id = HAIR.id, hm = (c, o) => gm(head, HK.shell(o), c);
    const HL = pl([[0, 41.6], [0.75, 41.6], [1.05, 37.6], [1.3, 30.5], [1.52, 31.5], [1.8, 32.5], [2.2, 22], [2.6, 14.5], [PI, 12.5]]), HLH = pl([[0, 43.6], [0.6, 44.4], [1.0, 39], [1.3, 31.5], [1.52, 32], [1.8, 33], [2.2, 23], [2.6, 15.5], [PI, 13.5]]);
    const cut = pl([[0, 44.5], [PI, 44.5]]), topOf = open ? undefined : cut;   // under a hat only the hair below the band is there
    const scalp = (k = 1.07, line = HL, c = hc, lift = 1.7) => hm(c, { k, kin: 0.96, top: topOf, bot: line, lift: open ? lift : 0 });
    const curtain = (k, a, bot, fall, c = hd, top = 44) => hm(c, { k, kin: k - 0.16, a0: a, a1: PI * 2 - a, top: open ? top : Math.min(top, 44.5), bot, fall });
    const fringe = (bot = 37.6, a = 0.95, c = hc) => { if (open) hm(c, { k: 1.1, kin: 1.0, a0: -a, a1: a, top: 46.5, bot, nv: 5, lift: 2 }); };
    const dy = (x, z) => HK.domeY(x, z), on = (g, c, w, h, d, x, z, up = 0) => add(head, g, c, w, h, d, x, dy(x, z) + up, z);
    switch (id) {
      case 'short': scalp(); if (open) on(G.ball, hc, 28, 8, 11, -4, 15.5, 1.5).rotation.z = 0.1; break;
      case 'buzz': scalp(1.03, HL, hd, 0.6); break;
      case 'long': scalp(); curtain(1.1, 1.0, -13, 22); break;
      case 'bangs': scalp(); curtain(1.1, 1.0, -13, 22); fringe(); break;
      case 'bob': scalp(); curtain(1.14, 0.82, 6.5, 19, hc); fringe(38.4, 0.9, hd); break;
      case 'mullet': scalp(); curtain(1.1, 2.0, -12, 24); if (open) on(G.ball, hc, 26, 7, 10, 3, 16, 1.4); break;
      case 'wavy': scalp(); curtain(1.11, 1.0, -3, 22, hc); for (const a of [1.2, 1.75, 2.3, 2.85, PI * 2 - 2.85, PI * 2 - 2.3, PI * 2 - 1.75, PI * 2 - 1.2]) { const p = HK.pt(a, 22, 1.1); add(head, G.ball, hd, 13, 12, 13, p[0], -4, p[1]); add(head, G.ball, hc, 12, 11, 12, p[0] * 1.03, 10, p[1] * 1.03); } if (open) on(G.ball, hc, 28, 8, 11, 5, 15.5, 1.5); break;
      case 'pomp': scalp(); if (open) { on(G.ball, hc, 40, 18, 26, 0, 12, 3.5); on(G.ball, hd, 34, 12, 24, 0, -5, 2); } break;
      case 'mohawk': scalp(1.014, HL, mix(tone, HC, 0.42), 0); if (open) for (let i = 0; i < 6; i++) { const z = 16 - i * 7, h = 17 - Math.abs(i - 2.5) * 3; rbox(head, i % 2 ? hd : hc, 7, h, 9, 0, dy(0, z) + h / 2 - 1.5, z, 2.6); } break;
      case 'braids': scalp(); if (open) add(head, G.box, hd, 1.6, 4, 36, 0, TOP + 0.6, -2); for (const s of [-1, 1]) { const p = HK.pt(s * 2.0, 24, 1.1); for (let i = 0; i < 4; i++) add(head, G.ball, i % 2 ? hd : hc, 10.5, 12, 10.5, p[0], 26 - i * 10.5, p[1]); add(head, G.ball, 0xc8211b, 6, 6, 6, p[0], -15, p[1]); } break;
      case 'bun': scalp(1.06, HLH); if (open) { on(G.ball, hc, 19, 17, 19, 0, -7, 5.5); on(G.cyl, hd, 12, 3, 12, 0, -7, 0.6); } break;
      case 'afro': if (open) add(head, G.ball, hc, 70, 52, 60, 0, 48, -6); else scalp(1.12, HL, hc, 0); break;
      case 'spikes': scalp(1.04, HL, hd, 0.8); if (open) for (const [x, z] of [[-15, 10], [0, 14], [15, 10], [-12, -6], [12, -6], [0, -16], [0, 0]]) { const c = on(G.cone, hc, 12, 22, 12, x, z, 7); c.rotation.z = -x * 0.03; c.rotation.x = z * 0.03; } break;
      case 'slick': scalp(1.085, HLH, hc, 2.4); if (open) add(head, G.ball, hd, 38, 20, 16, 0, 36, HK.pt(PI, 36, 1.0)[1] + 2); break;
      case 'part': scalp(); if (open) { on(G.ball, hc, 32, 8.5, 14, 7, 15, 1.6).rotation.z = -0.16; on(G.ball, hd, 14, 6, 30, -13, -2, 0.6); } break;
      case 'pony': scalp(1.075, HLH); { const z = HK.pt(PI, 36, 1.08)[1]; add(head, G.ball, hc, 13, 13, 12, 0, 37, z - 3); add(head, G.cyl, 0xc8211b, 9, 4, 9, 0, 34, z - 6.5).rotation.x = 0.6; add(head, taper(0.5, 0.2), hd, 13, 38, 12, 0, 16, z - 11).rotation.x = -0.24; } break;
      case 'pigtails': scalp(); if (open) add(head, G.box, hd, 1.6, 4, 36, 0, TOP + 0.6, -2); for (const s of [-1, 1]) { const p = HK.pt(s * 1.85, 31, 1.1); add(head, G.ball, 0xc8211b, 8, 8, 8, p[0], 31, p[1]); add(head, taper(0.5, 0.22), s > 0 ? hc : hd, 12.5, 32, 12.5, p[0] + s * 4.2, 15, p[1] - 1).rotation.z = s * 0.24; } break;
      case 'curly': scalp(1.04, HL, hd, 0.5); if (open) { for (let i = 0; i < 11; i++) { const a = (i / 11) * PI * 2 + 0.28, p = HK.pt(a, 41, 1.0); add(head, G.ball, i % 2 ? hd : hc, 19, 17, 19, p[0] * 0.98, 42.5, p[1] * 0.98); } for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2, x = Math.sin(a) * 11, z = Math.cos(a) * 10 - 1; on(G.ball, i % 2 ? hc : hd, 17, 14, 17, x, z, 2); } on(G.ball, hc, 16, 13, 16, 0, -1, 4); } break;
      case 'dreads': scalp(1.06, HL, hd); for (let i = 0; i < 13; i++) { const a = 1.12 + (i / 12) * (PI * 2 - 2.24), p = HK.pt(a, 30, 1.09), len = 33 + (i % 2) * 7 + (i % 3) * 2; add(head, G.cyl, i % 2 ? hd : hc, 6.6, len, 6.6, p[0], 38 - len / 2, p[1]); add(head, G.ball, i % 2 ? hc : hd, 7.2, 5, 7.2, p[0], 38 - len, p[1]); } if (open) for (let i = -2; i <= 2; i++) on(G.ball, i % 2 ? hc : hd, 7.5, 6, 30, i * 7.6, -3, 1.2); break;
      case 'undercut': scalp(1.014, HL, mix(tone, HC, 0.42), 0); if (open) { hm(hc, { k: 1.1, kin: 0.96, bot: pl([[0, 40.6], [1.0, 41.6], [PI, 40]]), lift: 2.6 }); on(G.ball, hc, 34, 8, 13, -4, 15, 2.4).rotation.z = 0.12; } break;
      case 'flat': scalp(1.04, HL, hd, 0.5); if (open) rbox(head, hc, 43, 9, 40, 0, 50.6, -1, 2.2); break;
      case 'rows': if (open) for (let i = -3; i <= 3; i++) { const x = i * 6.2, P = []; for (let z = 19 - Math.abs(i) * 1.5; z >= -19 + Math.abs(i); z -= 4.75) P.push([x, dy(x, z) + 0.7, z]); const zb = HK.pt(PI, 30, 1.0)[1] * (1 - Math.abs(i) * 0.035); P.push([x, 32, zb - 0.6], [x, 23, HK.pt(PI, 23, 1)[1] * (1 - Math.abs(i) * 0.035) - 0.6]); gm(head, HK.tube(P, 2.3), i % 2 ? hd : hc); } else scalp(1.03, HL, hd, 0); break;
      case 'horseshoe': hm(hd, { k: 1.06, kin: 0.96, a0: 1.08, a1: PI * 2 - 1.08, top: 38.5, bot: HL }); break;
      default: break;
    }
  }
  // a hat comes down over the crown to the brow; a ring, horns or a halo sits up on top of it
  const hat = R.hat = grp(head, 0, { halo: 46.5, horns: 44, crown: 41.5, visor: 41, fez: 44.5 }[H.id] || 42, 0);
  switch (H.id) {
    case 'cowboy': case 'whitehat': {
      add(hat, G.cyl, H.a, 82, 3, 70, 0, 2, 0);                                                                                   // brim, curled up at the sides and dipped front and back
      for (const s of [-1, 1]) { const c = add(hat, G.ball, H.a, 17, 9, 58, s * 36.5, 6, 0); c.rotation.z = s * 0.6; add(hat, G.ball, shade(H.a, 0.8), 6, 4, 50, s * 40.5, 9.6, 0).rotation.z = s * 0.6; }
      for (const z of [-1, 1]) add(hat, G.ball, H.a, 44, 5, 15, 0, 1.4, z * 31).rotation.x = z * 0.14;
      add(hat, taper(0.42, 0.5), H.a, 50, 21, 44, 0, 13.5, 0); for (const s of [-1, 1]) add(hat, G.ball, H.a, 19, 10, 39, s * 8.6, 24, -1); add(hat, G.ball, shade(H.a, 0.72), 8, 4, 30, 0, 26.4, -1);   // a crown pinched into a crease
      add(hat, G.cyl, H.b, 51, 5, 45, 0, 6, 0);
      if (H.id === 'whitehat') { for (let k = 0; k < 5; k++) add(hat, G.cone, H.b, 3.4, 5, 1.6, Math.sin(k * 1.2566) * 3.6, 6 + Math.cos(k * 1.2566) * 3.6, 22.9).rotation.z = -k * 1.2566; }
      else { add(hat, G.box, 0xc9a43a, 5.4, 4.4, 1.6, 13, 6, 21.4); const q = add(hat, G.cone, 0xf2e8d5, 5, 22, 2, -24, 17, 6); q.rotation.z = 0.5; add(hat, G.cone, 0xc8211b, 2.4, 9, 2.2, -27.4, 22.6, 6).rotation.z = 0.5; }   // a buckle, and a feather in the band
      break; }
    case 'cap': add(hat, G.dome, H.a, 54, 38, 49, 0, 0, 0); add(hat, G.cyl, shade(H.a, 0.8), 54.6, 3, 49.6, 0, 1.5, 0); { const b = add(hat, G.cyl, H.a, 42, 2.4, 34, 0, 1.6, 26); b.rotation.x = 0.1; } add(hat, G.dome, H.b, 30, 28, 49.6, 0, 1, 0.6); add(hat, G.ball, H.b, 5, 3, 5, 0, 19, 0); break;
    case 'bowler': add(hat, G.cyl, H.a, 70, 3, 62, 0, 2, 0); add(hat, G.tor, H.a, 69, 61, 16, 0, 2.6, 0).rotation.x = Math.PI / 2; add(hat, G.dome, H.a, 52, 50, 47, 0, 3, 0); add(hat, G.cyl, H.b, 53, 5, 48, 0, 6, 0); add(hat, G.box, shade(H.b, 0.7), 2, 6, 6, 26.6, 6, 0); break;
    case 'beanie': add(hat, G.dome, H.a, 54.5, 48, 49, 0, 5, 0); add(hat, G.cyl, shade(H.a, 0.75), 56, 9, 50.5, 0, 4.5, 0); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; add(hat, G.box, shade(H.a, 0.62), 1.4, 9.2, 1.4, Math.sin(a) * 28, 4.5, Math.cos(a) * 25.2); } add(hat, G.ball, H.b, 13, 13, 13, 0, 31, 0); break;
    case 'visor': add(hat, G.cyl, H.b, 54, 6, 48, 0, 0, 0); add(hat, G.box, H.a, 46, 3, 30, 0, 0, 32, 0.4).rotation.x = 0.2; break;
    case 'tophat': add(hat, G.cyl, H.a, 72, 4, 64, 0, 2, 0); add(hat, taper(0.52, 0.46), H.a, 48, 50, 44, 0, 28, 0); add(hat, G.cyl, H.b, 46, 8, 42, 0, 9, 0); break;
    case 'sombrero': add(hat, G.cyl, H.a, 120, 5, 110, 0, 2, 0); add(hat, G.tor, H.b, 118, 108, 30, 0, 5, 0).rotation.x = Math.PI / 2; add(hat, G.cone, H.a, 46, 42, 42, 0, 24, 0); add(hat, G.cyl, H.b, 44, 6, 40, 0, 7, 0); break;
    case 'miner': add(hat, G.dome, H.a, 57, 46, 52, 0, 1, 0); add(hat, G.cyl, H.a, 66, 3.4, 60, 0, 2, 0); add(hat, G.box, shade(H.a, 0.8), 6, 3, 50, 0, 22.6, 0); add(hat, G.cyl, 0x3a3a40, 16, 8, 16, 0, 12, 25).rotation.x = Math.PI / 2; add(hat, G.cyl, H.b, 12, 3, 12, 0, 12, 30, 1.8).rotation.x = Math.PI / 2; break;
    case 'fez': add(hat, taper(0.42, 0.5), H.a, 40, 30, 38, 0, 16, 0); add(hat, G.box, H.b, 2, 22, 2, 14, 24, 10); add(hat, G.ball, H.b, 7, 7, 7, 14, 12, 10); break;
    case 'cone': add(hat, G.box, H.a, 56, 5, 56, 0, 2, 0); add(hat, G.cone, H.a, 42, 62, 42, 0, 34, 0); add(hat, taper(0.3, 0.38), H.b, 42, 10, 42, 0, 28, 0); break;
    case 'horns': for (const s of [-1, 1]) { const h = add(hat, G.cone, H.a, 14, 34, 14, s * 20, 10, 0); h.rotation.z = -s * 0.5; add(hat, G.cone, H.b, 8, 12, 8, s * 27, 24, 0).rotation.z = -s * 0.5; } break;
    case 'halo': add(hat, G.tor, H.a, 46, 46, 30, 0, 22, 0, 1.6).rotation.x = Math.PI / 2; break;
    case 'crown': add(hat, G.cyl, H.a, 53, 13, 48, 0, 6, 0); for (let i = 0; i < 6; i++) { const a = (i + 0.5) / 6 * Math.PI * 2; add(hat, G.ball, i % 2 ? 0x2a6ad0 : 0x2aa05a, 5, 5, 4, Math.sin(a) * 26, 6, Math.cos(a) * 23.6, 0.6); } for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; add(hat, G.cone, H.a, 10, 16, 10, Math.sin(a) * 23.5, 20, Math.cos(a) * 21); add(hat, G.ball, 0xfff4d8, 4, 4, 4, Math.sin(a) * 23.5, 29, Math.cos(a) * 21); } add(hat, G.ball, H.b, 9, 9, 6, 0, 7, 24, 0.8); break;
    default: break;
  }
  // ---- back
  const back = grp(body, 0, 36, -22);
  switch (B.id) {
    case 'pack': add(back, G.cyl, B.a, 26, 60, 26, 0, 10, -8).rotation.z = Math.PI / 2; for (const x of [-16, 16]) add(back, G.cyl, B.b, 27, 5, 27, x, 10, -8).rotation.z = Math.PI / 2; break;
    case 'shotgun': { const g = grp(back, 0, 8, -6); g.rotation.z = 0.7; add(g, G.box, B.a, 8, 34, 10, 0, -34, 0); add(g, G.cyl, B.b, 7, 70, 7, 0, 18, 0); add(g, G.box, B.a, 9, 24, 9, 0, 4, 0); break; }
    case 'guitar': { const g = grp(back, 0, 0, -8); g.rotation.z = -0.6; add(g, G.cyl, B.a, 40, 10, 40, 0, -14, 0).rotation.x = Math.PI / 2; add(g, G.cyl, B.a, 30, 10, 30, 0, 12, 0).rotation.x = Math.PI / 2; add(g, G.cyl, 0x140d12, 12, 11, 12, 0, -8, 0).rotation.x = Math.PI / 2; add(g, G.box, B.b, 7, 60, 6, 0, 54, 0); add(g, G.box, B.b, 11, 14, 6, 0, 88, 0); break; }
    case 'cape': { const c = R.cape = grp(back, 0, 24, 0); add(c, G.box, B.a, 60, 84, 4, 0, -42, -4); add(c, G.box, B.b, 60, 6, 4.5, 0, -82, -4); add(back, G.box, B.b, 64, 8, 10, 0, 24, 2); break; }
    case 'sack': add(back, G.ball, B.a, 48, 52, 40, 0, 4, -14); add(back, G.cyl, B.a, 14, 14, 14, 0, 34, -14); add(back, G.box, B.b, 6, 20, 2, 0, 4, -34.5); add(back, G.box, B.b, 14, 4, 2, 0, 10, -34.5); add(back, G.box, B.b, 14, 4, 2, 0, -2, -34.5); break;
    case 'shovel': { const g = grp(back, 0, 10, -6); g.rotation.z = -0.5; add(g, G.cyl, B.b, 5, 96, 5, 0, 0, 0); add(g, G.box, B.a, 26, 30, 4, 0, 60, 0); add(g, G.box, B.b, 18, 5, 5, 0, -48, 0); break; }
    case 'tank': for (const x of [-12, 12]) { add(back, G.cyl, B.a, 20, 54, 20, x, 10, -10); add(back, G.ball, B.a, 20, 20, 20, x, 37, -10); add(back, G.cyl, B.b, 8, 8, 8, x, 48, -10); } add(back, G.box, B.b, 50, 6, 4, 0, 10, 0); break;
    case 'tomb': add(back, G.box, B.a, 46, 54, 12, 0, 6, -8); add(back, G.cyl, B.a, 46, 12, 46, 0, 33, -8).rotation.x = Math.PI / 2; add(back, G.box, B.b, 22, 5, 2, 0, 22, -14.5); add(back, G.box, B.b, 5, 26, 2, 0, 16, -14.5); break;
    case 'wings': for (const s of [-1, 1]) { const w = R[s < 0 ? 'wingL' : 'wingR'] = grp(back, s * 10, 26, -4); for (let i = 0; i < 4; i++) { const f = add(w, G.box, i === 3 ? B.b : B.a, 14, 58 - i * 9, 4, s * (12 + i * 13), -10 - i * 5, -2); f.rotation.z = s * (0.25 + i * 0.12); } } break;
    default: break;
  }
  root.userData.rig = R;
  return root;
}

// walk / idle / aim pose. `speed` in world units per second.
export function animateCharacter(root, t, speed, opts = {}) {
  const R = root.userData.rig, k = Math.min(1, speed / 500), w = t * (6 + k * 7), s = Math.sin(w);
  R.legL.rotation.x = s * 0.75 * k; R.legR.rotation.x = -s * 0.75 * k;
  R.body.position.y = (R.hipY || 62) + Math.abs(Math.cos(w)) * 5 * k + Math.sin(t * 2.2) * 1.2 * (1 - k);
  R.body.rotation.z = s * 0.05 * k; R.body.rotation.x = 0.08 * k;
  R.armL.rotation.x = opts.preview ? -0.15 + Math.sin(t * 1.6) * 0.06 - s * 0.6 * k : -0.9 + s * 0.12 * k; R.armL.rotation.z = opts.preview ? -0.12 : 0.35;
  R.armR.rotation.x = -1.25 + Math.sin(t * 2.2) * 0.03 + s * 0.08 * k; R.armR.rotation.z = -0.1;
  R.gun.rotation.x = 1.25;
  R.head.rotation.y = opts.preview ? Math.sin(t * 0.7) * 0.25 : 0; R.head.rotation.z = Math.sin(t * 1.3) * 0.03 + s * 0.04 * k;
  if (R.cape) R.cape.rotation.x = 0.12 + k * 0.5 + Math.sin(t * 3) * 0.05;
  if (R.bird) R.bird.rotation.z = Math.sin(t * 3.1) * 0.08;
  if (R.wingL) { const f = Math.sin(t * 3) * 0.2; R.wingL.rotation.y = -0.3 - f; R.wingR.rotation.y = 0.3 + f; }
}
