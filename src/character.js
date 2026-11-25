// Third-person player characters: chunky flat-shaded figures built from primitives in the game's palette, assembled
// from the cosmetic pieces in cosmetics.js. Origin at the feet, facing +Z, about 180 units tall.
import * as THREE from 'three';
import { toonMaterial } from './render.js';
import { cosItem, shapeOf } from './cosmetics.js';
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
export const charMat = mat, charShade = shade, charMix = mix;
const grp = (p, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); return g; };

export function buildCharacter(look) {
  // The body: a frame (how broad the shoulder, how narrow the waist) and ten sliders. Everything worn hangs on the same
  // groups the body is made of, so a piece fits whatever the body under it is: thick limbs scale what is on them, long
  // limbs stretch the sleeve or the trouser leg and carry the hand, the boot and the gun with them.
  const FM = 0, SV = shapeOf(look), wt = SV.weight, mu = 0;
  const aK = 0.88 * (1 + 0.2 * SV.arms), lF = 0.64 * (1 + 0.18 * SV.legs), LEG = 1.2, lq = (62 * lF - 21) / 41, HIP = 41 * lq * LEG + 21;
  const WX = wt > 0 ? 1 + 0.24 * wt : 1 + 0.15 * wt, WZ = wt > 0 ? 1 + 0.38 * wt : 1 + 0.16 * wt, LIMB = wt > 0 ? 1 + 0.26 * wt : 1 + 0.16 * wt;
  const SW = 1, HPW = 1;
  const ARMW = LIMB * (1 + 0.2 * mu) * (1 - 0.06 * FM), LEGW = LIMB * (1 + 0.1 * mu), HS = 1 + 0.12 * SV.head;
  const chest = 0, rear = 0, groin = 0;
  const tone = cosItem('tone', look.tone).c, HAIR = cosItem('hair', look.hair), HC = cosItem('haircol', look.haircol).c;
  const BT = cosItem('boots', look.boots), GL = cosItem('gloves', look.gloves), NK = cosItem('neck', look.neck), SH = cosItem('shoulder', look.shoulder), WS = cosItem('waist', look.waist);
  const O = cosItem('outfit', look.outfit), L = cosItem('legs', look.legs), H = cosItem('hat', look.hat), F = cosItem('face', look.face), B = cosItem('back', look.back);
  const NS = cosItem('nose', look.nose), BL = cosItem('blush', look.blush), BE = cosItem('beard', look.beard).id, ST = cosItem('stache', look.stache).id;
  const HCI = cosItem('hatcol', look.hatcol), HP = cosItem('hatpat', look.hatpat).id, TIP = cosItem('hattip', look.hattip).id;
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

  // ---- the head. A gnome has no face: the hat comes down to the nose, the nose sits on the beard, and those three
  // (with the build and the clothes) are the character. The skin that shows is cheeks, ears and nose.
  const head = R.head = grp(body, 0, 60, 0); head.scale.set(HS / WX, HS, HS / WZ);
  const PI = Math.PI, HF = (18 * WZ + 2) / HS, BC = HC, BD = shade(HC, 0.86), dark = 0x140d12;
  add(head, G.cyl, tone, 20, 8, 20, 0, 0, 0);                                                // neck
  add(head, G.ball, tone, 42, 38, 38, 0, 15, 0);                                             // cheeks, under the brim
  for (const s of [-1, 1]) { add(head, G.ball, shade(tone, 0.94), 7, 13, 9, s * 20.6, 13, -2); add(head, G.cone, shade(tone, 0.94), 6, 9, 4, s * 23, 19, -3).rotation.z = -s * 0.7; }   // ears, a little pointed
  { // the nose
    const NC = BL.id === 'red' ? mix(tone, 0xd8463a, 0.55) : BL.id === 'rosy' ? mix(tone, 0xe07a6a, 0.4) : mix(tone, 0xd88a70, 0.2), nose = grp(head, 0, 14, 17.5); nose.scale.setScalar(1.22 * (1 + 0.4 * SV.nose));
    switch (NS.id) {
      case 'potato': add(nose, G.ball, NC, 20, 15, 15, 0, 0, 3); add(nose, G.ball, NC, 8, 7, 7, 6, -3, 7); break;
      case 'long': add(nose, G.ball, NC, 12, 11, 25, 0, -1, 8).rotation.x = 0.22; break;
      case 'button': add(nose, G.ball, NC, 10.5, 9.5, 10, 0, 0, 3); break;
      case 'pointed': add(nose, G.ball, NC, 12, 11, 10, 0, 0, 2); add(nose, G.cone, NC, 10.5, 18, 9.5, 0, -1, 11).rotation.x = PI / 2 + 0.15; break;
      case 'bulb': add(nose, G.ball, NC, 10, 10, 10, 0, 3, 2); add(nose, G.ball, NC, 17, 15, 15, 0, -2, 7); break;
      case 'hook': add(nose, G.ball, NC, 12, 13, 18, 0, 1, 5).rotation.x = 0.5; add(nose, G.ball, NC, 10, 9, 9, 0, -6, 11); break;
      default: add(nose, G.ball, NC, 16, 14, 15, 0, 0, 4); break;
    }
    if (BL.id !== 'plain') for (const s of [-1, 1]) add(head, G.ball, mix(tone, 0xe05a6a, BL.id === 'red' ? 0.5 : 0.36), 10, 8, 5, s * 13.5, 11.5, 14.6);
  }
  // ---- beard: it starts under the nose, spreads to the cheeks and lies down the front of the body
  {
    // it hangs from the chin and is tipped forward far enough to lie on whatever the chest is wearing (a poncho stands well out)
    const bl = 1 + 0.4 * SV.beardL, bw = 1 + 0.3 * SV.beardW, z0 = HF - 2.5, bgP = grp(head, 0, 6, 8), bg = grp(bgP, 0, -6, -8); bgP.rotation.x = st === 'poncho' ? -0.3 : -0.05;
    const tuft = (c, w, h, x, y, z, rz = 0) => { const m = add(bg, G.cone, c, w, h, w * 0.62, x, y, z); m.rotation.x = PI; m.rotation.z = rz; return m; };
    const cheeks = () => { for (const s of [-1, 1]) add(bg, G.ball, BC, 17 * bw, 21, 16, s * 15.5, 7.5, 8.5); };
    const braid = (x, y, n, c0 = 0, dx = 0) => { for (let i = 0; i < n; i++) add(bg, G.ball, (i + c0) % 2 ? BD : BC, 12.5 - i * 0.7, 10.5, 11 - i * 0.5, x + dx * i, y - i * 8.2 * bl, z0 + 3); add(bg, G.cyl, 0xc8211b, 7.5, 3.4, 7, x + dx * n, y - n * 8.2 * bl + 2.5, z0 + 1); tuft(BC, 8, 9, x + dx * n, y - n * 8.2 * bl - 3.5, z0 + 1); };
    switch (BE) {
      case 'long': { const L = 72 * bl; cheeks(); add(bg, G.ball, BC, 50 * bw, L * 0.82, 19, 0, 9 - L * 0.41, z0); for (const [x, k, c] of [[-11, 0.84, BD], [11, 0.84, BD], [0, 1, BC]]) tuft(c, 19 * bw, L * 0.5, x * 1.15 * bw, 9 - L * (k - 0.25), z0 + (x ? 1 : 2.6), x * 0.012); break; }
      case 'round': { const L = 54 * bl; cheeks(); add(bg, G.ball, BC, 60 * bw, L, 22, 0, 8 - L * 0.45, z0); for (let i = -2; i <= 2; i++) tuft(i % 2 ? BD : BC, 14 * bw, 16, i * 10.5 * bw, 8 - L * 0.9 + Math.abs(i) * 3.4, z0 + 2.5 - Math.abs(i), i * 0.1); break; }
      case 'forked': { const L = 68 * bl; cheeks(); add(bg, G.ball, BC, 46 * bw, L * 0.6, 19, 0, 9 - L * 0.3, z0); for (const s of [-1, 1]) tuft(s > 0 ? BC : BD, 19 * bw, L * 0.62, s * 10.5 * bw, 9 - L * 0.69, z0 + 1.5, s * 0.2); break; }
      case 'braid': cheeks(); add(bg, G.ball, BC, 44 * bw, 30, 18, 0, -2, z0); braid(0, -15, 5); break;
      case 'twin': cheeks(); add(bg, G.ball, BC, 44 * bw, 26, 18, 0, 0, z0); for (const s of [-1, 1]) braid(s * 8.5, -8, 5, s > 0 ? 1 : 0, s * 1.3); break;
      case 'short': cheeks(); add(bg, G.ball, BC, 46 * bw, 30 * bl, 18, 0, 0, z0); for (let i = -1; i <= 1; i++) tuft(i ? BD : BC, 13 * bw, 12, i * 11 * bw, -14 * bl + Math.abs(i) * 2.5, z0 + 2, i * 0.12); break;
      case 'curly': cheeks(); for (let r = 0; r < 5; r++) { const n = 4 - (r > 2 ? r - 2 : 0), w = (n - 1) * 11.5 * bw; for (let i = 0; i < n; i++) add(bg, G.ball, (r + i) % 2 ? BD : BC, 17, 16, 14, -w / 2 + i * 11.5 * bw + (r % 2 ? 2.4 : -2.4), 5 - r * 11 * bl, z0 + 3 - Math.abs(i - (n - 1) / 2) * 1.3); } break;
      case 'wizard': { const L = 92 * bl; cheeks(); add(bg, G.ball, BC, 34 * bw, L * 0.55, 18, 0, 9 - L * 0.28, z0); tuft(BC, 22 * bw, L * 0.62, 0, 9 - L * 0.69, z0 + 1.5); tuft(BD, 9, 16, -6 * bw, 9 - L * 0.5, z0 + 3.4, -0.12); break; }
      default: break;
    }
    // moustache: two tufts from under the nose
    const mc = mix(HC, 0xffffff, 0.22), mz = 19.6;
    switch (ST) {
      case 'droop': for (const s of [-1, 1]) { add(bg, G.ball, mc, 19, 8.5, 8.5, s * 8.6, 7.4, mz).rotation.z = -s * 0.45; add(bg, G.cone, mc, 7, 10, 6, s * 17.4, 1.6, mz - 1.2).rotation.z = PI - s * 0.5; } break;
      case 'handlebar': for (const s of [-1, 1]) { add(bg, G.ball, mc, 17, 6.5, 7.5, s * 8, 8.6, mz).rotation.z = s * 0.2; add(bg, G.tor, mc, 8, 8, 22, s * 17.4, 12, mz - 0.6); } break;
      case 'walrus': for (const s of [-1, 1]) add(bg, G.ball, mc, 24, 13.5, 11, s * 7.4, 4.4, mz + 0.4).rotation.z = -s * 0.72; break;
      case 'curl': for (const s of [-1, 1]) { add(bg, G.ball, mc, 16, 6.5, 7.5, s * 8, 8, mz).rotation.z = -s * 0.2; add(bg, G.tor, mc, 9.5, 9.5, 24, s * 17, 5, mz - 0.6); } break;
      default: break;
    }
  }
  // ---- hair: what shows below the hat
  {
    const hc = HC, hd = shade(HC, 0.84), zb = -Math.max(15, (18 * WZ + 1.5) / HS - 4);
    switch (HAIR.id) {
      case 'tufts': for (const s of [-1, 1]) for (let i = 0; i < 3; i++) add(head, G.ball, i % 2 ? hd : hc, 13, 12, 14, s * (23 + i * 1.6), 16 - i * 6.5, -3 + i * 2.6); break;
      case 'braids': for (const s of [-1, 1]) { for (let i = 0; i < 6; i++) add(head, G.ball, i % 2 ? hd : hc, 11.5 - i * 0.5, 10.5, 11.5 - i * 0.5, s * (23.5 + Math.min(i, 2) * 1.2), 12 - i * 8.4, 3 + Math.min(i, 3) * 1.5); add(head, G.cyl, 0xc8211b, 7, 3.2, 7, s * 26, -36, 7.5); add(head, G.cone, hc, 7, 9, 7, s * 26, -42, 7.5).rotation.x = PI; for (const k of [-1, 1]) add(head, G.cone, 0xc8211b, 5, 7, 2.4, s * 26 + k * 4.4, -36, 10).rotation.z = k * PI / 2; } break;
      case 'pigtails': for (const s of [-1, 1]) { add(head, G.ball, 0xc8211b, 8, 8, 8, s * 23.5, 13, -4); add(head, taper(0.5, 0.2), s > 0 ? hc : hd, 14, 26, 14, s * 29, 2, -4).rotation.z = s * 0.45; } break;
      case 'long': add(head, G.ball, hc, 46, 30, 26, 0, 8, -9); add(head, G.ball, hc, 42, 66, 17, 0, -18, zb); for (const x of [-12, 0, 12]) add(head, G.cone, x ? hd : hc, 15, 20, 9, x, -52, zb).rotation.x = PI; break;
      case 'pony': add(head, G.ball, hc, 42, 26, 22, 0, 10, -11); add(head, G.cyl, 0xc8211b, 9, 4, 9, 0, 3, zb - 1); add(head, taper(0.5, 0.18), hd, 14, 46, 12, 0, -20, zb - 3).rotation.x = -0.12; break;
      default: break;
    }
  }
  // ---- what sits on the nose or sticks out of the beard
  switch (F.id) {
    case 'specs': for (const s of [-1, 1]) add(head, G.tor, F.a, 13, 13, 9, s * 8.4, 17.5, 22.5); add(head, G.box, F.a, 5, 1.5, 1.5, 0, 18.6, 23); for (const s of [-1, 1]) add(head, G.box, F.a, 1.3, 1.5, 20, s * 15.6, 18, 13); break;
    case 'shades': for (const s of [-1, 1]) add(head, G.ball, F.a, 14.5, 10, 3, s * 8.6, 17.4, 22.4); add(head, G.box, F.a, 6, 2, 2, 0, 19, 22.6); for (const s of [-1, 1]) add(head, G.box, F.a, 1.4, 2, 20, s * 16, 18.4, 13); break;
    case 'monocle': add(head, G.tor, F.a, 15, 15, 9, 9, 17.5, 22.6); add(head, G.cyl, 0xbfe4ee, 12, 0.5, 12, 9, 17.5, 22.4).rotation.x = PI / 2; add(head, G.box, F.a, 0.9, 20, 0.9, 16.6, 7.5, 20.6).rotation.z = 0.1; break;
    case 'cigar': add(head, G.cyl, F.a, 5, 18, 5, 8, 4.6, 26).rotation.x = PI / 2 - 0.15; add(head, G.ball, F.b, 6, 6, 6, 8, 6, 35, 1.6); break;
    case 'pipe': add(head, G.cyl, F.a, 2.6, 17, 2.6, 8, 3.6, 26).rotation.x = PI / 2 - 0.3; add(head, G.cyl, F.a, 8.5, 9, 8.5, 8, 4.4, 35.5); add(head, G.cyl, 0x1c1a20, 6, 1, 6, 8, 9, 35.5); add(head, G.ball, F.b, 4.4, 2.4, 4.4, 8, 9.4, 35.5, 1.4); break;
    default: break;
  }
  // ---- the hat. It sits at the top of the nose and hides everything above it.
  const HA = HCI.c !== undefined ? HCI.c : H.a, HB = H.b, hat = R.hat = grp(head, 0, 21, 0);
  const hh = 1 + 0.4 * SV.hatH, flop = 1 + SV.hatF, brimW = 6 + 7 * (SV.brim + 1);
  const colOf = (i, n) => (HP === 'stripes' ? (i % 2 ? HB : HA) : HP === 'dip' && i >= n - 2 ? HB : HA);
  // a soft cone built up a spine that leans as it rises: p0 is where it stands, bend(i) how much each length of it tips
  const cone = (h, n, r0, r1, bend, p0 = [0, 0, 0], col = colOf) => {
    const p = new THREE.Vector3(p0[0], p0[1], p0[2]), q = new THREE.Quaternion(), up = new THREE.Vector3(), L = h / n;
    for (let i = 0; i < n; i++) {
      const ra = r0 + (r1 - r0) * (i / n), rb = r0 + (r1 - r0) * ((i + 1) / n), b = bend(i);
      q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(b[0], 0, b[1]))); up.set(0, 1, 0).applyQuaternion(q);
      const m = new THREE.Mesh(taper(Math.round(((0.5 * rb) / ra) * 40) / 40, 0.5), mat(col(i, n))); m.scale.set(ra * 2, L * 1.14, ra * 1.84); m.position.copy(p).addScaledVector(up, L / 2); m.quaternion.copy(q); hat.add(m);
      if (i) { const k = new THREE.Mesh(G.ball, mat(col(i, n))); k.scale.set(ra * 2, ra * 1.2, ra * 1.84); k.position.copy(p); k.quaternion.copy(q); hat.add(k); }
      p.addScaledVector(up, L);
    }
    return { p, q };
  };
  const brim = (r0, e = brimW) => { add(hat, taper(Math.round(((0.5 * r0) / (r0 + e)) * 40) / 40, 0.5), HA, (r0 + e) * 2, 8, (r0 + e) * 1.84, 0, 0.5, 0); add(hat, G.tor, shade(HA, 0.86), (r0 + e) * 2, (r0 + e) * 1.84, 14, 0, -3, 0).rotation.x = PI / 2; };
  const scatter = (h, r0, r1) => {   // spots, stars and patches on the lower hat
    if (!['spots', 'stars', 'patches'].includes(HP)) return;
    for (let k = 0; k < 11; k++) { const a = k * 2.4 + 0.4, y = 9 + ((k * 7) % 5) * h * 0.085, r = r0 + (r1 - r0) * (y / h) + 0.3, x = Math.sin(a) * r, z = Math.cos(a) * r * 0.92;
      if (HP === 'spots') add(hat, G.ball, HB, 7, 7, 3, x, y, z).rotation.y = a;
      else if (HP === 'stars') { const g = grp(hat, x, y, z); g.rotation.y = a; for (let j = 0; j < 5; j++) add(g, G.cone, 0xffcd5a, 2.6, 4.4, 1.2, Math.sin(j * 1.2566) * 2.4, Math.cos(j * 1.2566) * 2.4, 0.4).rotation.z = -j * 1.2566; }
      else { const m = add(hat, G.box, k % 2 ? HB : shade(HA, 0.72), 9, 8, 1.6, x, y, z); m.rotation.y = a; m.rotation.z = (k % 3 - 1) * 0.3; } }
  };
  let tipAt = null;
  const R0 = 25.5;
  if (HP === 'band' && !['mushroom', 'acorn', 'pot'].includes(H.id) && ['gnome', 'straight', 'curl', 'stocking', 'wizard', 'halo'].includes(H.id)) { add(hat, G.cyl, HB, R0 * 2 + 1.6, 7, (R0 * 2 + 1.6) * 0.92, 0, 8, 0); add(hat, G.box, 0xc9a43a, 8, 6, 2, 0, 8, R0 * 0.92 + 0.8); }
  switch (H.id) {
    case 'gnome': brim(R0); for (const s of [-1, 1]) add(hat, G.cone, HA, 11, 17, 8, s * (R0 + brimW + 3), -1, 0).rotation.z = -s * 1.95; tipAt = cone(78 * hh, 7, R0, 2.4, (i) => [-0.03 * flop * i, 0.085 * flop * i]); scatter(78 * hh, R0, 2.4); break;
    case 'halo': brim(R0); tipAt = cone(70 * hh, 6, R0, 2.4, (i) => [-0.03 * flop * i, 0.06 * flop * i]); scatter(70 * hh, R0, 2.4); { const m = add(hat, G.tor, HB, 40, 40, 26, tipAt.p.x, tipAt.p.y + 10, tipAt.p.z, 1.6); m.rotation.x = PI / 2; } break;
    case 'straight': brim(R0, brimW * 0.6); tipAt = cone(84 * hh, 4, R0, 1.6, () => [0, 0]); scatter(84 * hh, R0, 1.6); break;
    case 'curl': brim(R0, brimW * 0.7); tipAt = cone(74 * hh, 8, R0, 2.6, (i) => (i < 3 ? [0, 0] : [0.52 * flop, 0])); scatter(74 * hh * 0.5, R0, 14); break;
    case 'stocking': add(hat, G.cyl, HB, R0 * 2 + 3, 9, (R0 * 2 + 3) * 0.92, 0, 3, 0); tipAt = cone(112 * hh, 9, R0, 3, (i) => (i < 1 ? [0, 0] : [-0.04, 0.34 * flop])); scatter(40, R0, 19); break;
    case 'wizard': add(hat, G.cyl, HA, (R0 + 14 + brimW) * 2, 3, (R0 + 14 + brimW) * 1.84, 0, 1.5, 0); add(hat, G.tor, shade(HA, 0.86), (R0 + 14 + brimW) * 2, (R0 + 14 + brimW) * 1.84, 8, 0, 1.5, 0).rotation.x = PI / 2; tipAt = cone(76 * hh, 6, R0 - 1.5, 2.2, (i) => (i === 3 ? [-0.5 * flop, 0.2] : i > 3 ? [-0.12 * flop, 0.05] : [0, 0])); scatter(76 * hh, R0 - 1.5, 2.2); break;
    case 'jester': add(hat, G.dome, HB, 53, 30, 49, 0, 0, 0); add(hat, G.cyl, HA, 54, 6, 50, 0, 3, 0); for (const s of [-1, 1]) { const t = cone(54 * hh, 6, 14, 2, (i) => [0, -s * (i === 0 ? 0.6 : 0.24 * flop)], [s * 8, 6, 0], () => (s > 0 ? HA : HB)); add(hat, G.ball, 0xffcd5a, 8, 8, 8, t.p.x, t.p.y, t.p.z); add(hat, G.ball, 0x3a2a22, 2.4, 2.4, 2.4, t.p.x, t.p.y - 3.4, t.p.z + 1.4); } break;
    case 'mushroom': add(hat, G.dome, HA, 84, 50 * hh, 78, 0, 1, 0); add(hat, G.cyl, 0xf2e8d5, 82, 3.4, 76, 0, 1, 0); add(hat, G.tor, HA, 84, 78, 12, 0, 2, 0).rotation.x = PI / 2; for (let k = 0; k < 9; k++) { const a = k * 2.4, e = 0.35 + (k % 3) * 0.26; add(hat, G.ball, HB, 13 - (k % 3) * 2, 5, 13 - (k % 3) * 2, Math.sin(a) * 41 * Math.cos(e), 1 + 25 * hh * Math.sin(e) * 0.99, Math.cos(a) * 38 * Math.cos(e)); } break;
    case 'acorn': add(hat, G.dome, HA, 58, 44 * hh, 54, 0, 0, 0); add(hat, G.cyl, shade(HA, 0.8), 60, 5, 56, 0, 2.5, 0); for (let k = 1; k < 4; k++) { const e = k * 0.36, m = add(hat, G.tor, HB, 58 * Math.cos(e), 54 * Math.cos(e), 16, 0, 22 * hh * Math.sin(e), 0); m.rotation.x = PI / 2; } { const st = add(hat, G.cyl, HB, 5, 10, 5, 2, 22 * hh + 3, 0); st.rotation.z = -0.3; add(hat, G.ball, 0x4f8a3a, 14, 2.4, 8, 9, 22 * hh + 6, 0).rotation.z = 0.3; } break;
    case 'pot': add(hat, G.cyl, HA, 56, 34 * hh, 52, 0, 17 * hh, 0); add(hat, G.tor, HB, 57, 53, 16, 0, 1.5, 0).rotation.x = PI / 2; add(hat, G.cyl, shade(HA, 0.8), 57, 2.4, 53, 0, 34 * hh, 0); for (const s of [-1, 1]) add(hat, G.tor, HB, 15, 12, 30, s * 30, 22 * hh, 0); add(hat, G.ball, shade(HA, 0.7), 9, 7, 3, 14, 20 * hh, 24.6); break;
    case 'horns': add(hat, G.dome, HA, 55, 46 * hh, 51, 0, 2, 0); add(hat, G.cyl, 0xc9a43a, 56.4, 6, 52.4, 0, 4, 0); add(hat, G.box, 0xc9a43a, 5, 24 * hh, 52.6, 0, 13 * hh, 0); for (const s of [-1, 1]) { const h = add(hat, G.cone, HB, 13, 30, 13, s * 30, 16, 0); h.rotation.z = -s * 0.75; add(hat, G.cyl, 0xc9a43a, 14, 4, 14, s * 24.6, 9.6, 0).rotation.z = -s * 0.75; } break;
    case 'visor': add(hat, G.dome, HB, 54, 40, 49, 0, 0, 0); add(hat, G.cyl, shade(HB, 1.4), 55, 5, 50, 0, 2.5, 0); { const v = add(hat, G.cyl, HA, 48, 2, 40, 0, 1.4, 27, 0.25); v.rotation.x = 0.16; } break;
    case 'cowboy': case 'whitehat': {
      add(hat, G.cyl, HA, 82, 3, 70, 0, 2, 0);                                                                                   // brim, curled up at the sides and dipped front and back
      for (const s of [-1, 1]) { const c = add(hat, G.ball, HA, 17, 9, 58, s * 36.5, 6, 0); c.rotation.z = s * 0.6; add(hat, G.ball, shade(HA, 0.8), 6, 4, 50, s * 40.5, 9.6, 0).rotation.z = s * 0.6; }
      for (const z of [-1, 1]) add(hat, G.ball, HA, 44, 5, 15, 0, 1.4, z * 31).rotation.x = z * 0.14;
      add(hat, taper(0.42, 0.5), HA, 50, 21, 44, 0, 13.5, 0); for (const s of [-1, 1]) add(hat, G.ball, HA, 19, 10, 39, s * 8.6, 24, -1); add(hat, G.ball, shade(HA, 0.72), 8, 4, 30, 0, 26.4, -1);   // a crown pinched into a crease
      add(hat, G.cyl, HB, 51, 5, 45, 0, 6, 0);
      if (H.id === 'whitehat') { for (let k = 0; k < 5; k++) add(hat, G.cone, HB, 3.4, 5, 1.6, Math.sin(k * 1.2566) * 3.6, 6 + Math.cos(k * 1.2566) * 3.6, 22.9).rotation.z = -k * 1.2566; }
      else { add(hat, G.box, 0xc9a43a, 5.4, 4.4, 1.6, 13, 6, 21.4); const q = add(hat, G.cone, 0xf2e8d5, 5, 22, 2, -24, 17, 6); q.rotation.z = 0.5; add(hat, G.cone, 0xc8211b, 2.4, 9, 2.2, -27.4, 22.6, 6).rotation.z = 0.5; }   // a buckle, and a feather in the band
      break; }
    case 'cap': add(hat, G.dome, HA, 54, 38, 49, 0, 0, 0); add(hat, G.cyl, shade(HA, 0.8), 54.6, 3, 49.6, 0, 1.5, 0); { const b = add(hat, G.cyl, HA, 42, 2.4, 34, 0, 1.6, 26); b.rotation.x = 0.1; } add(hat, G.dome, HB, 30, 28, 49.6, 0, 1, 0.6); add(hat, G.ball, HB, 5, 3, 5, 0, 19, 0); break;
    case 'bowler': add(hat, G.cyl, HA, 70, 3, 62, 0, 2, 0); add(hat, G.tor, HA, 69, 61, 16, 0, 2.6, 0).rotation.x = Math.PI / 2; add(hat, G.dome, HA, 52, 50, 47, 0, 3, 0); add(hat, G.cyl, HB, 53, 5, 48, 0, 6, 0); add(hat, G.box, shade(HB, 0.7), 2, 6, 6, 26.6, 6, 0); break;
    case 'beanie': add(hat, G.dome, HA, 54.5, 48, 49, 0, 5, 0); add(hat, G.cyl, shade(HA, 0.75), 56, 9, 50.5, 0, 4.5, 0); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; add(hat, G.box, shade(HA, 0.62), 1.4, 9.2, 1.4, Math.sin(a) * 28, 4.5, Math.cos(a) * 25.2); } add(hat, G.ball, HB, 13, 13, 13, 0, 31, 0); break;
    case 'tophat': add(hat, G.cyl, HA, 72, 4, 64, 0, 2, 0); add(hat, taper(0.52, 0.46), HA, 48, 50, 44, 0, 28, 0); add(hat, G.cyl, HB, 46, 8, 42, 0, 9, 0); break;
    case 'sombrero': add(hat, G.cyl, HA, 120, 5, 110, 0, 2, 0); add(hat, G.tor, HB, 118, 108, 30, 0, 5, 0).rotation.x = Math.PI / 2; add(hat, G.cone, HA, 46, 42, 42, 0, 24, 0); add(hat, G.cyl, HB, 44, 6, 40, 0, 7, 0); break;
    case 'miner': add(hat, G.dome, HA, 57, 46, 52, 0, 1, 0); add(hat, G.cyl, HA, 66, 3.4, 60, 0, 2, 0); add(hat, G.box, shade(HA, 0.8), 6, 3, 50, 0, 22.6, 0); add(hat, G.cyl, 0x3a3a40, 16, 8, 16, 0, 12, 25).rotation.x = Math.PI / 2; add(hat, G.cyl, HB, 12, 3, 12, 0, 12, 30, 1.8).rotation.x = Math.PI / 2; break;
    case 'fez': add(hat, taper(0.42, 0.5), HA, 40, 30, 38, 0, 16, 0); add(hat, G.box, HB, 2, 22, 2, 14, 24, 10); add(hat, G.ball, HB, 7, 7, 7, 14, 12, 10); break;
    case 'cone': add(hat, G.box, HA, 56, 5, 56, 0, 2, 0); add(hat, G.cone, HA, 42, 62, 42, 0, 34, 0); add(hat, taper(0.3, 0.38), HB, 42, 10, 42, 0, 28, 0); break;
    case 'crown': add(hat, G.dome, HB, 52, 36, 47, 0, 2, 0); add(hat, G.cyl, HA, 53, 13, 48, 0, 6, 0); for (let i = 0; i < 6; i++) { const a = (i + 0.5) / 6 * Math.PI * 2; add(hat, G.ball, i % 2 ? 0x2a6ad0 : 0x2aa05a, 5, 5, 4, Math.sin(a) * 26, 6, Math.cos(a) * 23.6, 0.6); } for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; add(hat, G.cone, HA, 10, 16, 10, Math.sin(a) * 23.5, 20, Math.cos(a) * 21); add(hat, G.ball, 0xfff4d8, 4, 4, 4, Math.sin(a) * 23.5, 29, Math.cos(a) * 21); } add(hat, G.ball, HB, 9, 9, 6, 0, 7, 24, 0.8); break;
    default: break;
  }

  // something on the tip, for the hats that come to one
  if (tipAt && TIP !== 'none') {
    const t = grp(hat, tipAt.p.x, tipAt.p.y, tipAt.p.z);
    switch (TIP) {
      case 'pompom': add(t, G.ball, 0xf2e8d5, 14, 14, 14, 0, 2, 0); break;
      case 'bell': add(t, G.ball, 0xffcd5a, 10, 10, 10, 0, -2, 0); add(t, G.box, 0x3a2a22, 6, 1.4, 1.4, 0, -5.4, 4.4); add(t, G.ball, 0x3a2a22, 2.4, 2.4, 2.4, 0, -7.6, 0); break;
      case 'star': for (let j = 0; j < 5; j++) add(t, G.cone, 0xffcd5a, 6, 11, 3, Math.sin(j * 1.2566) * 6, 4 + Math.cos(j * 1.2566) * 6, 0, 0.5).rotation.z = -j * 1.2566; add(t, G.cyl, 0xffcd5a, 9, 3, 9, 0, 4, 0, 0.5).rotation.x = PI / 2; break;
      case 'tassel': add(t, G.box, HB, 1.6, 14, 1.6, 0, -7, 0); add(t, G.ball, HB, 6, 6, 6, 0, -1, 0); add(t, G.cone, HB, 7, 12, 7, 0, -19, 0); break;
      case 'flower': for (let j = 0; j < 6; j++) add(t, G.ball, 0xe86a9a, 7, 7, 4, Math.sin(j * 1.047) * 5.4, 3 + Math.cos(j * 1.047) * 5.4, 0); add(t, G.ball, 0xffcd5a, 6, 6, 5, 0, 3, 1); break;
      case 'lantern': add(t, G.box, 0x3a3a40, 1.4, 8, 1.4, 0, -4, 0); add(t, G.cyl, 0x3a3a40, 9, 2, 9, 0, -8, 0); add(t, G.cyl, 0xffe27a, 7.5, 9, 7.5, 0, -13.4, 0, 1.6); add(t, G.cyl, 0x3a3a40, 9, 2, 9, 0, -18.6, 0); break;
      default: break;
    }
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
  root.userData.rig = R; R.topY = new THREE.Box3().setFromObject(root).max.y; R.headY = HIP + 60 + 16 * HS;
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
