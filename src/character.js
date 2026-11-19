// Third-person player characters: chunky flat-shaded figures built from primitives in the game's palette, assembled
// from the cosmetic pieces in cosmetics.js. Origin at the feet, facing +Z, about 180 units tall.
import * as THREE from 'three';
import { toonMaterial } from './render.js';
import { cosItem } from './cosmetics.js';

const mats = new Map();
function mat(c, glow = 0) { const k = c + ':' + glow; if (!mats.has(k)) { const m = toonMaterial({ glow }); m.uniforms.uColor.value.setHex(c); mats.set(k, m); } return mats.get(k); }
const G = { box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 14), cone: new THREE.ConeGeometry(0.5, 1, 14), ball: new THREE.SphereGeometry(0.5, 14, 10), tor: new THREE.TorusGeometry(0.5, 0.09, 6, 18) };
const geo = new Map();
function taper(top, bot) { const k = top + '/' + bot; if (!geo.has(k)) geo.set(k, new THREE.CylinderGeometry(top, bot, 1, 14)); return geo.get(k); }
function add(p, g, c, sx, sy, sz, x = 0, y = 0, z = 0, glow = 0) { const m = new THREE.Mesh(g, mat(c, glow)); m.scale.set(sx, sy, sz); m.position.set(x, y, z); p.add(m); return m; }
const shade = (c, k) => { const o = new THREE.Color(c); o.multiplyScalar(k); return o.getHex(); };
const grp = (p, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); return g; };

export function buildCharacter(look) {
  const Bd = cosItem('body', look.body), K = Bd.kind, W = Bd.w, LH = Bd.lh, HIP = 62 * LH;
  const tone = K === 'human' ? cosItem('tone', look.tone).c : Bd.c, HAIR = cosItem('hair', look.hair), HC = cosItem('haircol', look.haircol).c;
  const BT = cosItem('boots', look.boots), GL = cosItem('gloves', look.gloves), NK = cosItem('neck', look.neck), SH = cosItem('shoulder', look.shoulder), WS = cosItem('waist', look.waist);
  const O = cosItem('outfit', look.outfit), L = cosItem('legs', look.legs), H = cosItem('hat', look.hat), F = cosItem('face', look.face), B = cosItem('back', look.back);
  const root = new THREE.Group(), R = { root, hipY: HIP };
  const body = R.body = grp(root, 0, HIP, 0); body.scale.set(W, 1, W);

  // ---- legs: stubby, big boots
  for (const s of [-1, 1]) {
    const leg = grp(root, s * 15 * W, HIP, 0); R[s < 0 ? 'legL' : 'legR'] = leg; leg.scale.set(W, LH, W);
    const peg = BT.style === 'peg' && s > 0, limb = K === 'skeleton' ? 0.5 : 1;
    if (peg) { add(leg, taper(0.5, 0.42), L.a, 26, 20, 26, 0, -10, 0); add(leg, taper(0.4, 0.25), BT.a, 16, 42, 16, 0, -41, 0); continue; }
    add(leg, taper(0.5, 0.42), L.a, 26 * limb + (limb < 1 ? 8 : 0), 40, 26 * limb + (limb < 1 ? 8 : 0), 0, -20, 0);
    if (L.chaps) add(leg, G.box, L.b, 8, 34, 28, s * 12, -20, 0);
    if (L.stripe) add(leg, G.box, L.b, 4, 38, 4, s * 13, -20, 0);
    const bs = BT.style;
    if (bs === 'sandal') { add(leg, G.box, tone, 22, 14, 34, 0, -51, 5); add(leg, G.box, BT.a, 24, 4, 8, 0, -45, 8); add(leg, G.box, BT.b, 26, 4, 38, 0, -60, 5); continue; }
    const tall = bs === 'tall' ? 12 : bs === 'low' ? -6 : 0;
    add(leg, G.box, shade(BT.a, 0.95), 26, 18 + tall, 38, 0, -50 + tall / 2, 5);                               // boot
    add(leg, G.box, shade(BT.b, 0.8), 27, 5, 40, 0, -59.5, 5);                                                 // sole
    if (bs === 'low') add(leg, G.box, BT.b, 27, 4, 20, 0, -50, 14);
    if (bs === 'tall') add(leg, G.cyl, BT.b, 29, 4, 29, 0, -36, 0);
    if (bs === 'spur') { add(leg, G.box, BT.b, 27.5, 4, 39, 0, -47, 5); add(leg, G.cyl, 0xffcd5a, 10, 2, 10, 0, -52, -17).rotation.z = Math.PI / 2; }
  }
  add(body, G.cyl, shade(L.a, 0.85), 50, 12, 36, 0, 2, 0);                   // hips
  add(body, G.cyl, O.c, 52, 7, 38, 0, 7, 0);                                 // belt
  add(body, G.box, 0xffcd5a, 10, 8, 3, 0, 7, 19);                            // buckle
  switch (WS.id) {
    case 'holster': add(body, G.box, WS.a, 12, 22, 10, 27, -4, 4); add(body, G.box, WS.b, 7, 10, 8, 27, 9, 4); break;
    case 'twin': for (const s of [-1, 1]) { add(body, G.box, WS.a, 12, 22, 10, s * 27, -4, 4); add(body, G.box, WS.b, 7, 10, 8, s * 27, 9, 4); } break;
    case 'ammo': add(body, G.cyl, WS.a, 55, 9, 41, 0, 7, 0); for (let i = -4; i <= 4; i++) if (i) add(body, G.cyl, WS.b, 4, 10, 4, i * 5.4, 7, 20 - Math.abs(i) * 0.7); break;
    case 'sash': add(body, G.cyl, WS.a, 56, 14, 42, 0, 7, 0); add(body, G.box, WS.a, 12, 34, 4, -18, -12, 19); add(body, G.box, WS.b, 12, 4, 4.5, -18, -27, 19); break;
    case 'tool': add(body, G.box, WS.a, 14, 16, 8, -24, -2, 12); add(body, G.box, WS.a, 14, 16, 8, 24, -2, 12); add(body, G.box, WS.b, 4, 24, 4, 24, 4, 17); add(body, G.box, WS.b, 10, 5, 5, 24, 16, 17); break;
    case 'rope': { const t = add(body, G.tor, WS.a, 30, 30, 26, 27, -4, 2); t.rotation.y = Math.PI / 2; add(body, G.tor, WS.b, 24, 24, 22, 27, -4, 2).rotation.y = Math.PI / 2; break; }
    case 'chips': add(body, G.ball, WS.a, 22, 24, 16, -24, -6, 12); add(body, G.cyl, WS.b, 12, 3, 12, -24, 6, 12); add(body, G.cyl, 0xf2e8d5, 12, 3, 12, -24, 9, 12); break;
    case 'champ': add(body, G.cyl, WS.a, 57, 14, 43, 0, 7, 0); add(body, G.cyl, WS.b, 26, 4, 26, 0, 7, 20).rotation.x = Math.PI / 2; for (const s of [-1, 1]) add(body, G.cyl, WS.b, 12, 3, 12, s * 19, 7, 15).rotation.x = Math.PI / 2; break;
    case 'skulls': for (const x of [-22, 22]) { add(body, G.box, WS.a, 2, 10, 2, x, 0, 16); add(body, G.box, WS.b, 12, 11, 11, x, -10, 16); add(body, G.box, 0x140d12, 8, 3, 1, x, -9, 22); } break;
    default: break;
  }

  // ---- torso by style
  const st = O.style;
  add(body, taper(0.5, 0.44), O.a, 58, 50, 40, 0, 34, 0);
  if (K === 'skeleton') add(body, taper(0.5, 0.5), 0x140d12, 59, 2, 41, 0, 9, 0);
  if (K === 'gator') { const t = grp(body, 0, 4, -18); t.rotation.x = 0.9; add(t, taper(0.2, 0.5), tone, 26, 60, 22, 0, -28, 0); R.tail = t; }
  if (st === 'poncho') { add(body, taper(0.3, 0.62), O.a, 74, 44, 56, 0, 42, 0); add(body, taper(0.585, 0.62), O.b, 74, 6, 56, 0, 26, 0); add(body, taper(0.47, 0.5), shade(O.b, 0.8), 74, 5, 56, 0, 40, 0); }
  if (st === 'shirt' || st === 'badge' || st === 'plaid') { add(body, G.box, O.b, 4, 44, 2, 0, 36, 20.5); for (let i = 0; i < 3; i++) add(body, G.ball, O.c, 4, 4, 3, 0, 22 + i * 12, 21.5); }
  if (st === 'badge') add(body, G.cyl, 0xffcd5a, 11, 3, 11, -15, 46, 19).rotation.x = Math.PI / 2;
  if (st === 'plaid') { for (let i = 0; i < 3; i++) add(body, taper(0.5, 0.5), O.b, 59 - i, 4, 41, 0, 20 + i * 14, 0); for (const x of [-16, 16]) add(body, G.box, O.b, 4, 48, 41.5, x, 34, 0); }
  if (st === 'overalls') { add(body, G.box, O.b, 30, 26, 3, 0, 28, 20); for (const x of [-12, 12]) add(body, G.box, O.b, 7, 34, 42, x, 44, 0); add(body, taper(0.5, 0.5), 0xf2e8d5, 56, 16, 39, 0, 50, 0); }
  if (st === 'coat' || st === 'suit') {
    add(body, G.box, O.c, 14, 40, 2, 0, 38, 20);                             // shirt front
    for (const s of [-1, 1]) add(body, G.box, shade(O.a, 0.8), 10, 30, 3, s * 10, 44, 20.5).rotation.z = s * 0.25;   // lapels
    add(body, G.box, O.b, 5, 26, 2.5, 0, 38, 21.5);                          // tie
    if (st === 'coat') add(body, taper(0.46, 0.56), O.a, 62, 30, 44, 0, -4, -1);   // long tails
    if (st === 'suit') for (const x of [-20, -10, 10, 20]) add(body, G.box, O.b, 1.2, 46, 41, x, 34, 0);
  }
  if (st === 'vest') { add(body, taper(0.5, 0.45), 0xece6d6, 57, 48, 39, 0, 34, 0); for (const s of [-1, 1]) add(body, G.box, O.a, 22, 46, 42, s * 17, 33, 0); add(body, G.box, O.b, 12, 6, 3, 0, 56, 20); }
  if (st === 'stripes') for (let i = 0; i < 5; i++) add(body, taper(0.5, 0.5), O.b, 58.5 - i * 0.5, 5, 40.5, 0, 14 + i * 10, 0);
  if (st === 'hazmat') { add(body, G.box, O.b, 6, 48, 2, 0, 34, 20.5); add(body, taper(0.5, 0.5), O.b, 59, 6, 41, 0, 20, 0); add(body, G.cyl, 0x140d12, 16, 2, 16, 14, 44, 20).rotation.x = Math.PI / 2; }
  if (st === 'bones') { add(body, G.box, O.b, 5, 40, 2, 0, 36, 20.5); for (let i = 0; i < 4; i++) add(body, G.box, O.b, 36 - i * 4, 4, 2, 0, 50 - i * 9, 20.5); }

  switch (NK.id) {
    case 'kerchief': add(body, G.cyl, NK.a, 30, 8, 28, 0, 60, 0); add(body, G.cone, NK.a, 26, 20, 6, 0, 48, 19).rotation.x = Math.PI; add(body, G.ball, NK.b, 4, 4, 2, 0, 50, 22.5); break;
    case 'bolo': add(body, G.box, NK.a, 1.6, 26, 1.6, -3, 44, 21.5); add(body, G.box, NK.a, 1.6, 26, 1.6, 3, 44, 21.5); add(body, G.ball, NK.b, 8, 9, 4, 0, 56, 22); break;
    case 'scarf': add(body, G.cyl, NK.a, 36, 12, 34, 0, 60, 0); add(body, G.box, NK.a, 12, 44, 5, 12, 38, 20); add(body, G.box, NK.b, 12, 5, 5.5, 12, 18, 20); add(body, G.box, NK.b, 12, 5, 5.5, 12, 30, 20); break;
    case 'bowtie': for (const s of [-1, 1]) add(body, G.cone, NK.a, 12, 12, 5, s * 7, 57, 21).rotation.z = s * Math.PI / 2; add(body, G.ball, NK.b, 5, 5, 4, 0, 57, 22); break;
    case 'chain': { const t = add(body, G.tor, NK.a, 36, 44, 30, 0, 50, 6); t.rotation.x = 1.1; add(body, G.box, NK.b, 9, 9, 3, 0, 32, 21.5, 0.5).rotation.z = Math.PI / 4; break; }
    case 'bandolier': { const b = add(body, G.box, NK.a, 9, 76, 43, 0, 34, 0); b.rotation.z = 0.75; for (let i = -3; i <= 3; i++) add(body, G.cyl, NK.b, 4, 8, 4, i * 6.5, 34 - i * 7, 21.5).rotation.z = 0.75; break; }
    case 'teeth': { const t = add(body, G.tor, NK.a, 34, 40, 20, 0, 52, 6); t.rotation.x = 1.1; for (let i = -2; i <= 2; i++) add(body, G.cone, NK.b, 4, 9, 4, i * 6, 38 + Math.abs(i) * 2.5, 21).rotation.x = Math.PI; break; }
    case 'lei': for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; add(body, G.ball, i % 2 ? NK.a : NK.b, 11, 9, 11, Math.sin(a) * 24, 56 - Math.cos(a) * 6 - 4, Math.cos(a) * 20); } break;
    case 'noose': add(body, G.cyl, NK.a, 28, 6, 26, 0, 60, 0); add(body, G.box, NK.a, 5, 30, 5, 6, 44, 20); add(body, G.box, NK.b, 7, 8, 7, 6, 56, 20); break;
    case 'medal': add(body, G.box, NK.a, 8, 16, 2, -14, 46, 20.6); add(body, G.cyl, NK.b, 11, 3, 11, -14, 35, 21, 0.5).rotation.x = Math.PI / 2; break;
    default: break;
  }
  // ---- arms: shoulder pivots, mitten hands
  for (const s of [-1, 1]) {
    const arm = grp(body, s * 36, 54, 0); R[s < 0 ? 'armL' : 'armR'] = arm;
    add(arm, G.ball, O.a, 24, 22, 24, 0, 0, 0);
    add(arm, taper(0.5, 0.42), O.a, 20, 38, 20, 0, -20, 0);
    if (st === 'stripes') for (let i = 0; i < 3; i++) add(arm, G.cyl, O.b, 20.5, 4, 20.5, 0, -10 - i * 10, 0);
    if (st === 'plaid') add(arm, G.cyl, O.b, 20.5, 4, 20.5, 0, -22, 0);
    add(arm, G.cyl, O.c, 19, 7, 19, 0, -40, 0);                              // cuff
    const bare = GL.id === 'bare', hc = bare ? (st === 'hazmat' || st === 'bones' ? O.b : tone) : GL.a, big = GL.style === 'big' ? 1.35 : 1;
    add(arm, G.ball, hc, 21 * big, 22 * big, 21 * big, 0, -50, 0);                                             // mitten
    if (K === 'robot' && bare) { add(arm, G.box, shade(tone, 0.6), 6, 12, 6, -6, -60, 4); add(arm, G.box, shade(tone, 0.6), 6, 12, 6, 6, -60, 4); }
    if (!bare) { add(arm, G.cyl, GL.b, 21, 5, 21, 0, -42, 0); if (GL.style === 'long') add(arm, taper(0.5, 0.46), GL.a, 22, 16, 22, 0, -32, 0); if (GL.style === 'wrap') for (let i = 0; i < 3; i++) add(arm, G.cyl, GL.b, 21.5, 2, 21.5, 0, -46 - i * 4, 0); }
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
  const gun = R.gun = grp(R.armR, 0, -52, 8);
  add(gun, G.box, 0x2a2a32, 7, 10, 44, 0, 4, 18); add(gun, G.box, 0x4E3324, 7, 16, 9, 0, -4, 2); add(gun, G.cyl, 0x46464e, 5, 16, 5, 0, 6, 42).rotation.x = Math.PI / 2;

  // ---- head: big, simple face
  const head = R.head = grp(body, 0, 66, 0); head.scale.set(Bd.hs / W, Bd.hs, Bd.hs / W);
  add(head, G.cyl, K === 'skeleton' ? shade(tone, 0.8) : tone, K === 'skeleton' ? 9 : 18, 10, K === 'skeleton' ? 9 : 18, 0, 0, 0);   // neck
  const sk = F.id === 'skull' ? F.a : tone, covered = F.id === 'shades' || F.id === 'gasmask' || F.id === 'hockey';
  const humanEyes = () => { if (!covered) for (const s of [-1, 1]) { if (F.id === 'patch' && s > 0) continue; add(head, G.box, 0x140d12, 7, F.id === 'skull' ? 12 : 8, 2, s * 12, 31, 22.5); } };
  const plainMouth = F.id === 'none' || F.id === 'specs' || F.id === 'patch' || F.id === 'monocle';
  switch (K) {
    case 'skeleton':
      add(head, G.box, sk, 50, 36, 44, 0, 30, 0); add(head, G.box, sk, 36, 14, 38, 0, 6, 2);
      if (!covered) for (const s of [-1, 1]) { if (F.id === 'patch' && s > 0) continue; add(head, G.box, 0x140d12, 13, 13, 2, s * 12, 30, 22.5); }
      add(head, G.cone, 0x140d12, 6, 8, 2, 0, 18, 22.5); for (let i = -2; i <= 2; i++) add(head, G.box, 0x140d12, 1.4, 9, 2, i * 6, 6, 21.5);
      break;
    case 'robot':
      add(head, G.cyl, sk, 50, 46, 46, 0, 24, 0); add(head, G.cyl, shade(tone, 0.7), 52, 5, 48, 0, 4, 0); add(head, G.cyl, shade(tone, 0.7), 52, 5, 48, 0, 44, 0);
      if (!covered) add(head, G.box, 0x140d12, 36, 12, 4, 0, 30, 21); if (!covered) for (const s of [-1, 1]) add(head, G.box, 0xffe27a, 9, 6, 2, s * 9, 30, 23.5, 1.8);
      for (const s of [-1, 1]) add(head, G.cyl, shade(tone, 0.6), 8, 8, 8, s * 27, 24, 0).rotation.z = Math.PI / 2;
      for (let i = -2; i <= 2; i++) add(head, G.box, 0x140d12, 2, 8, 2, i * 6, 12, 22.5);
      if (H.id === 'none') { add(head, G.box, shade(tone, 0.6), 2, 18, 2, 0, 56, 0); add(head, G.ball, 0xc8211b, 7, 7, 7, 0, 66, 0, 1.5); }
      break;
    case 'gator':
      add(head, G.box, sk, 48, 34, 44, 0, 24, -2); add(head, G.box, sk, 44, 8, 30, 0, 44, -9); add(head, G.box, sk, 38, 16, 40, 0, 16, 34); add(head, G.box, shade(tone, 0.8), 36, 8, 38, 0, 5, 32);
      for (const s of [-1, 1]) { add(head, G.ball, sk, 14, 14, 14, s * 14, 42, 12); if (!covered && !(F.id === 'patch' && s > 0)) add(head, G.ball, 0xffe27a, 8, 9, 5, s * 14, 43, 18); if (!covered && !(F.id === 'patch' && s > 0)) add(head, G.box, 0x140d12, 2, 8, 2, s * 14, 43, 20.5); add(head, G.ball, 0x140d12, 3, 3, 3, s * 8, 24, 54); }
      for (let i = 0; i < 5; i++) for (const s of [-1, 1]) add(head, G.cone, 0xf2e8d5, 4, 6, 4, s * 17, 9, 18 + i * 8).rotation.x = Math.PI;
      break;
    default:   // human and zombie
      add(head, G.box, sk, 50, 44, 44, 0, 26, 0); add(head, G.box, sk, 44, 8, 40, 0, 2, 0);
      for (const s of [-1, 1]) add(head, G.box, shade(tone, 0.85), 5, 14, 10, s * 27, 24, 0);
      add(head, G.box, shade(sk, 0.85), 8, 10, 6, 0, 22, 24);
      humanEyes(); if (plainMouth) add(head, G.box, shade(tone, 0.6), 14, 3, 2, 0, 10, 22.5);
      break;
  }
  // Face pieces are built for the human head, then fitted to each other model: wrap() follows the head's shape
  // (round on the robot, narrow on the skeleton's jaw) and FIT moves or resizes a piece where the anatomy differs.
  const fg = grp(head, 0, 0, 0);
  const wrap = (c, w, h, d, x, y, z) => {
    if (K === 'robot') return add(fg, G.cyl, c, w + 3, h, d + 3, x, y, z);
    if (K === 'skeleton' && y < 12) { add(fg, G.box, c, 39, h, d - 4, x, y, z + 2); return add(fg, G.box, c, w, Math.max(4, y + h / 2 - 13), d, x, 13 + Math.max(4, y + h / 2 - 13) / 2, z); }
    return add(fg, G.box, c, w, h, d, x, y, z);
  };
  const EYEWEAR = ['specs', 'shades', 'patch', 'monocle'];
  if (K === 'gator') {
    const FIT = { stache: [0, 4, 32.5, 1, 1, 1], cigar: [5, 3, 30, 1, 1, 1], bandana: [0, 3, 33, 0.8, 0.95, 0.96], beard: [0, -2, 30, 0.72, 0.6, 0.85], greybeard: [0, -2, 30, 0.72, 0.6, 0.85],
      gasmask: [0, 2, 33, 0.8, 0.75, 1], skull: [0, 2, 32, 1, 1, 1], hockey: [0, 22, -1.5, 1, 0.5, 1] };
    const f = EYEWEAR.includes(F.id) ? [0, F.id === 'specs' || F.id === 'monocle' ? 6 : 12, -2.5, 1.17, 1, 1] : FIT[F.id];
    if (f) { fg.position.set(f[0], f[1], f[2]); fg.scale.set(f[3], f[4], f[5]); }
  }
  if (K === 'robot' && F.id === 'hockey') fg.position.z = 1.5;
  if (K === 'skeleton' && EYEWEAR.includes(F.id)) fg.position.y = -1;
  switch (F.id) {
    case 'stache': add(fg, G.box, F.a, 26, 6, 5, 0, 14, 23); for (const s of [-1, 1]) add(fg, G.box, F.a, 6, 10, 5, s * 14, 10, 23); break;
    case 'bandana': wrap(F.a, 52, 20, 46, 0, 10, 0); add(fg, G.cone, F.a, 30, 18, 6, 0, -6, 21).rotation.x = Math.PI; for (const x of [-12, 0, 12]) add(fg, G.ball, F.b, 4, 4, 2, x, 10, 23.5); break;
    case 'specs': for (const s of [-1, 1]) { const t = add(fg, G.tor, F.a, 15, 15, 8, s * 12, 31, 23); t.rotation.set(0, 0, 0); } add(fg, G.box, F.a, 8, 2, 2, 0, 32, 23.5); break;
    case 'shades': add(fg, G.box, F.a, 46, 10, 4, 0, 31, 22.5); for (const s of [-1, 1]) add(fg, G.box, F.a, 18, 14, 4, s * 12, 29, 23); if (K === 'human') add(fg, G.box, shade(tone, 0.6), 14, 3, 2, 0, 10, 22.5); break;
    case 'beard': case 'greybeard': wrap(F.a, 52, 22, 46, 0, 6, 0); add(fg, G.box, F.a, 34, F.id === 'greybeard' ? 34 : 16, 30, 0, F.id === 'greybeard' ? -18 : -10, 8); add(fg, G.box, shade(F.a, 0.6), 12, 3, 2, 0, 12, 23.5); break;
    case 'patch': add(fg, G.box, F.a, 14, 13, 3, 12, 31, 23); add(fg, G.box, F.a, 52, 3, 46, 0, 37, 0).rotation.z = -0.2; break;
    case 'cigar': if (K === 'human') add(fg, G.box, shade(tone, 0.6), 14, 3, 2, 0, 10, 22.5); add(fg, G.cyl, F.a, 5, 20, 5, 9, 9, 31).rotation.x = Math.PI / 2 - 0.2; add(fg, G.ball, F.b, 6, 6, 6, 9, 11, 41, 1.6); break;
    case 'monocle': { add(fg, G.tor, F.a, 17, 17, 8, 12, 31, 23); add(fg, G.box, F.a, 1.5, 26, 1.5, 21, 18, 23); break; }
    case 'gasmask': wrap(F.a, 52, 34, 46, 0, 18, 1); for (const s of [-1, 1]) add(fg, G.cyl, F.b, 15, 4, 15, s * 12, 30, 24, 0.6).rotation.x = Math.PI / 2; add(fg, G.cyl, 0x1c1a20, 18, 14, 18, 0, 8, 28).rotation.x = Math.PI / 2; break;
    case 'skull': add(fg, G.box, F.b, 6, 6, 2, 0, 21, 27.5); for (let i = -2; i <= 2; i++) add(fg, G.box, F.b, 1.6, 9, 2, i * 6, 6, 22.5); add(fg, G.box, F.b, 30, 1.6, 2, 0, 6, 22.5); break;
    case 'hockey': add(fg, G.box, F.a, 44, 46, 6, 0, 22, 23); for (const s of [-1, 1]) { add(fg, G.box, 0x140d12, 9, 7, 2, s * 11, 31, 26.5); add(fg, G.box, F.b, 4, 12, 2, s * 14, 42, 26.5); } for (let i = 0; i < 3; i++) for (const x of [-6, 6]) add(fg, G.ball, 0x140d12, 3, 3, 2, x, 6 + i * 6, 26.5); break;
    default: break;
  }
  // hair: only on heads that grow it; big hats hide the top but long styles still show
  if (K === 'human' && HAIR.id !== 'bald') {
    const open = ['none', 'visor', 'halo', 'horns', 'crown'].includes(H.id), hc = HC, hd = shade(HC, 0.8);
    if (open) switch (HAIR.id) {
      case 'short': add(head, G.box, hc, 52, 12, 46, 0, 46, -1); break;
      case 'long': add(head, G.box, hc, 52, 12, 46, 0, 46, -1); break;
      case 'pomp': add(head, G.box, hc, 52, 10, 46, 0, 45, -1); add(head, G.ball, hc, 44, 22, 30, 0, 54, 12); break;
      case 'mohawk': for (let i = 0; i < 5; i++) add(head, G.box, hc, 8, 18 - Math.abs(i - 2) * 3, 9, 0, 54, -18 + i * 9); break;
      case 'braids': add(head, G.box, hc, 52, 12, 46, 0, 46, -1); break;
      case 'bun': add(head, G.box, hc, 52, 8, 46, 0, 44, -1); add(head, G.ball, hc, 20, 18, 20, 0, 56, -6); break;
      case 'afro': add(head, G.ball, hc, 74, 58, 66, 0, 46, -4); break;
      case 'mullet': add(head, G.box, hc, 52, 10, 46, 0, 45, -1); break;
      case 'spikes': add(head, G.box, hd, 52, 6, 46, 0, 43, -1); for (const [x, z] of [[-16, 10], [0, 12], [16, 10], [-10, -8], [10, -8], [0, -18]]) add(head, G.cone, hc, 12, 22, 12, x, 56, z); break;
      default: break;
    }
    if (HAIR.id === 'long') add(head, G.box, hc, 54, 50, 10, 0, 22, -22);
    if (HAIR.id === 'mullet') add(head, G.box, hc, 44, 40, 8, 0, 14, -23);
    if (HAIR.id === 'braids') for (const s of [-1, 1]) { for (let i = 0; i < 4; i++) add(head, G.ball, i % 2 ? hd : hc, 11, 12, 11, s * 26, 28 - i * 11, -12); add(head, G.ball, 0xc8211b, 6, 6, 6, s * 26, -16, -12); }
    if (!open && HAIR.id !== 'long' && HAIR.id !== 'mullet' && HAIR.id !== 'braids') add(head, G.box, hc, 52, 10, 30, 0, 38, -9);   // a little showing under the brim
  }
  const hat = R.hat = grp(head, 0, 48, 0);
  if (K === 'gator') hat.position.set(0, 48, -7);
  if (K === 'robot') hat.position.y = 47;
  switch (H.id) {
    case 'cowboy': case 'whitehat': add(hat, G.cyl, H.a, 86, 4, 76, 0, 2, 0); add(hat, taper(0.42, 0.5), H.a, 50, 24, 44, 0, 15, 0); add(hat, G.cyl, H.b, 51, 6, 45, 0, 6, 0); for (const s of [-1, 1]) add(hat, G.box, H.a, 10, 8, 70, s * 40, 5, 0).rotation.z = s * 0.5; break;
    case 'cap': add(hat, G.ball, H.a, 54, 36, 48, 0, 2, 0); add(hat, G.box, H.a, 40, 4, 26, 0, 2, 32); add(hat, G.box, H.b, 22, 14, 3, 0, 9, 23); break;
    case 'bowler': add(hat, G.cyl, H.a, 70, 4, 62, 0, 2, 0); add(hat, G.ball, H.a, 52, 46, 46, 0, 6, 0); add(hat, G.cyl, H.b, 53, 5, 47, 0, 6, 0); break;
    case 'beanie': add(hat, G.ball, H.a, 56, 44, 50, 0, 0, 0); add(hat, G.cyl, shade(H.a, 0.75), 56, 10, 50, 0, 0, 0); add(hat, G.ball, H.b, 14, 14, 14, 0, 24, 0); break;
    case 'visor': add(hat, G.cyl, H.b, 54, 6, 48, 0, 0, 0); add(hat, G.box, H.a, 46, 3, 30, 0, 0, 32, 0.4).rotation.x = 0.2; break;
    case 'tophat': add(hat, G.cyl, H.a, 72, 4, 64, 0, 2, 0); add(hat, taper(0.52, 0.46), H.a, 48, 50, 44, 0, 28, 0); add(hat, G.cyl, H.b, 46, 8, 42, 0, 9, 0); break;
    case 'sombrero': add(hat, G.cyl, H.a, 120, 5, 110, 0, 2, 0); add(hat, G.tor, H.b, 118, 108, 30, 0, 5, 0).rotation.x = Math.PI / 2; add(hat, G.cone, H.a, 46, 42, 42, 0, 24, 0); add(hat, G.cyl, H.b, 44, 6, 40, 0, 7, 0); break;
    case 'miner': add(hat, G.ball, H.a, 58, 44, 52, 0, 0, 0); add(hat, G.cyl, H.a, 66, 4, 60, 0, 0, 0); add(hat, G.cyl, 0x3a3a40, 16, 8, 16, 0, 12, 25).rotation.x = Math.PI / 2; add(hat, G.cyl, H.b, 12, 3, 12, 0, 12, 30, 1.8).rotation.x = Math.PI / 2; break;
    case 'fez': add(hat, taper(0.42, 0.5), H.a, 40, 30, 38, 0, 16, 0); add(hat, G.box, H.b, 2, 22, 2, 14, 24, 10); add(hat, G.ball, H.b, 7, 7, 7, 14, 12, 10); break;
    case 'cone': add(hat, G.box, H.a, 56, 5, 56, 0, 2, 0); add(hat, G.cone, H.a, 42, 62, 42, 0, 34, 0); add(hat, taper(0.3, 0.38), H.b, 42, 10, 42, 0, 28, 0); break;
    case 'horns': for (const s of [-1, 1]) { const h = add(hat, G.cone, H.a, 14, 34, 14, s * 20, 10, 0); h.rotation.z = -s * 0.5; add(hat, G.cone, H.b, 8, 12, 8, s * 27, 24, 0).rotation.z = -s * 0.5; } break;
    case 'halo': add(hat, G.tor, H.a, 46, 46, 30, 0, 22, 0, 1.6).rotation.x = Math.PI / 2; break;
    case 'crown': add(hat, G.cyl, H.a, 50, 14, 46, 0, 6, 0); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; add(hat, G.cone, H.a, 10, 16, 10, Math.sin(a) * 22, 20, Math.cos(a) * 20); } add(hat, G.ball, H.b, 8, 8, 6, 0, 7, 23, 0.8); break;
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
  if (R.tail) R.tail.rotation.y = Math.sin(t * 2.4) * 0.35 + s * 0.3 * k;
  if (R.bird) R.bird.rotation.z = Math.sin(t * 3.1) * 0.08;
  if (R.wingL) { const f = Math.sin(t * 3) * 0.2; R.wingL.rotation.y = -0.3 - f; R.wingR.rotation.y = 0.3 + f; }
}
