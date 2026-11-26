// The Lucky Toadstool's games, played out on the tables themselves so that anyone standing round can watch: Pip's wheel
// turns and the ball drops, Dame Fennel deals real cards onto the felt, Clatterby's dice tumble across his table, and
// the slot machines' reels spin in their windows. A play is started by whoever sits down (locally, from the bet bar)
// or arrives in a friend's presence; either way the same thing happens here.
import * as THREE from 'three';
import { VSPOTS } from './map_village.js';
import { symbolAtlas, SYM_ORDER } from './casino_symbols.js';
import { textMesh } from './text.js';

const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const SUITS = ['♠', '♥', '♦', '♣'], RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CHIP = { 5: 0x5a7a9a, 10: 0x3a6aa8, 25: 0x3a8a4a, 50: 0xc8962a, 100: 0x1a1a1a, 250: 0x8a3aa8, 500: 0xb8392e, 1000: 0x2a8a8a };
const basic = (c, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color: c }, o));
const put = (m, o) => { if (o.position) m.position.copy(o.position); if (o.rotation) m.rotation.copy(o.rotation); return m; };
const ease = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

// ---- card faces, drawn once each
const cardTex = new Map();
function cardFace(r, s) {
  const k = r + '/' + s; if (cardTex.has(k)) return cardTex.get(k);
  const c = document.createElement('canvas'); c.width = 140; c.height = 200; const g = c.getContext('2d');
  g.fillStyle = '#fbf8f0'; g.beginPath(); g.roundRect(2, 2, 136, 196, 14); g.fill(); g.strokeStyle = '#c8c0b0'; g.lineWidth = 3; g.stroke();
  const col = s === 1 || s === 2 ? '#c8281e' : '#1a1a1a'; g.fillStyle = col; g.textAlign = 'center';
  g.font = '900 38px Fraunces, Georgia, serif'; g.fillText(RANKS[r], 26, 44); g.font = '30px serif'; g.fillText(SUITS[s], 26, 76);
  g.save(); g.translate(114, 156); g.rotate(Math.PI); g.font = '900 38px Fraunces, Georgia, serif'; g.fillText(RANKS[r], 0, 0); g.font = '30px serif'; g.fillText(SUITS[s], 0, 32); g.restore();
  g.font = '84px serif'; g.fillText(SUITS[s], 70, 130);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4; cardTex.set(k, t); return t;
}
let backTex = null;
function cardBack() {
  if (backTex) return backTex;
  const c = document.createElement('canvas'); c.width = 140; c.height = 200; const g = c.getContext('2d');
  g.fillStyle = '#fbf8f0'; g.beginPath(); g.roundRect(2, 2, 136, 196, 14); g.fill(); g.fillStyle = '#8a1e1a'; g.beginPath(); g.roundRect(12, 12, 116, 176, 8); g.fill();
  g.strokeStyle = '#c8392e'; g.lineWidth = 4; for (let i = -20; i < 40; i++) { g.beginPath(); g.moveTo(12 + i * 10, 12); g.lineTo(12 + i * 10 - 176, 188); g.stroke(); }
  g.fillStyle = '#f0c860'; g.beginPath(); g.arc(70, 100, 20, 0, Math.PI * 2); g.fill();
  backTex = new THREE.CanvasTexture(c); backTex.colorSpace = THREE.NoColorSpace; return backTex;
}
// a die face: a digit (or two) on ivory
const dieTex = new Map();
function dieFace(txt) {
  if (dieTex.has(txt)) return dieTex.get(txt);
  const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d');
  g.fillStyle = '#f6efe0'; g.fillRect(0, 0, 96, 96); g.strokeStyle = '#d8ccb0'; g.lineWidth = 6; g.strokeRect(3, 3, 90, 90);
  g.fillStyle = txt.length > 1 ? '#8a1e1a' : '#1a1a1a'; g.font = `900 ${txt.length > 1 ? 46 : 58}px Fraunces, Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 48, 52);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; dieTex.set(txt, t); return t;
}

export class CasinoRigs {
  constructor(village) {
    this.V = village; this.g = village.g; this.root = new THREE.Group(); this.g.scene.add(this.root); this.anims = []; this.labels = {};
    const C = VSPOTS.casino; this.C = C;
    this.buildRoulette(); this.buildBlackjack(); this.buildDice(); this.buildSlots();
  }
  // a local village point (x, y) at height h, as a three.js position
  P(x, y, h) { const [wx, wz] = this.V.w(x, y); return new THREE.Vector3(wx, h, wz); }
  set visible(v) { this.root.visible = v; }
  tick(dt) { this.anims = this.anims.filter((a) => { a.t += dt; const k = Math.min(1, a.t / a.dur); a.fn(k, dt); if (k >= 1) { if (a.done) a.done(); return false; } return true; }); }
  run(dur, fn) { return new Promise((res) => this.anims.push({ t: 0, dur, fn, done: res })); }
  // a word over a table for everyone to read (who played, and what came of it); it fades after a while
  say(key, text, color = '#ffe9a0') {
    const L = this.labels[key]; if (L && L.m) this.root.remove(L.m);
    const pos = key === 'rou' ? this.C.roulette.table : key === 'bj' ? this.C.blackjack.table : key === 'dice' ? this.C.dice.table : this.C.slots[+key.slice(4) || 0];
    const m = textMesh(text, 9, color, 1); m.position.copy(this.P(pos[0] + (key.startsWith('slot') ? 40 : 0), pos[1], 190)); m.rotation.y = 0; this.root.add(m);
    const cam = this.g.camera; m.userData.face = true; this.labels[key] = { m, t: 7 }; void cam;
  }
  tickLabels(dt) {
    const cam = this.g.camera;
    for (const k of Object.keys(this.labels)) { const L = this.labels[k]; if (!L.m) continue; L.t -= dt; L.m.lookAt(cam.position.x, L.m.position.y, cam.position.z); if (L.t <= 0) { this.root.remove(L.m); L.m = null; } }
  }

  // ---------------------------------------------------------------- roulette
  buildRoulette() {
    const [tx, ty] = this.C.roulette.table, T = this.C.T, base = this.P(tx - 90 * T, ty, 18 + 92 * T);
    const R = (this.rou = { g: new THREE.Group(), chips: new THREE.Group() }); R.g.position.copy(base); this.root.add(R.g); this.root.add(R.chips);
    R.g.add(put(new THREE.Mesh(new THREE.CylinderGeometry(41, 36, 9, 40, 1, true), basic(0x6a3e1e, { side: THREE.DoubleSide })), { position: new THREE.Vector3(0, 2, 0) }));
    R.g.add(put(new THREE.Mesh(new THREE.TorusGeometry(40, 2.2, 6, 48), basic(0xc8962a)), { rotation: new THREE.Euler(Math.PI / 2, 0, 0), position: new THREE.Vector3(0, 6.6, 0) }));
    R.g.add(put(new THREE.Mesh(new THREE.CylinderGeometry(39, 39, 1, 40), basic(0x3a2416)), { position: new THREE.Vector3(0, 0.5, 0) }));
    // the turning part: a disc painted with the pockets, the brass turret in its middle, and the ball riding on it
    const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'), n = WHEEL.length, da = (Math.PI * 2) / n;
    g.fillStyle = '#c8962a'; g.beginPath(); g.arc(256, 256, 256, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < n; i++) { const v = WHEEL[i]; g.fillStyle = v === 0 ? '#2a8a3a' : RED.has(v) ? '#b82a2a' : '#1a1a1a'; g.beginPath(); g.moveTo(256, 256); g.arc(256, 256, 246, i * da - da / 2, i * da + da / 2); g.closePath(); g.fill(); g.save(); g.translate(256, 256); g.rotate(i * da + Math.PI / 2); g.fillStyle = '#fff'; g.font = '700 22px Fraunces, Georgia, serif'; g.textAlign = 'center'; g.fillText(String(v), 0, -214); g.restore(); }
    g.strokeStyle = '#c8962a'; g.lineWidth = 4; for (let i = 0; i < n; i++) { g.beginPath(); g.moveTo(256 + Math.cos(i * da + da / 2) * 170, 256 + Math.sin(i * da + da / 2) * 170); g.lineTo(256 + Math.cos(i * da + da / 2) * 246, 256 + Math.sin(i * da + da / 2) * 246); g.stroke(); }
    g.fillStyle = '#5a3a22'; g.beginPath(); g.arc(256, 256, 170, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#c8962a'; g.lineWidth = 6; g.stroke();
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = 8;
    R.disc = new THREE.Mesh(new THREE.CircleGeometry(34, 64), basic(0xffffff, { map: tex })); R.disc.rotation.x = -Math.PI / 2; R.disc.position.y = 2.2; R.g.add(R.disc);
    for (let k = 0; k < 4; k++) { const arm = new THREE.Mesh(new THREE.BoxGeometry(2, 30, 1.6), basic(0xe8c060)); arm.rotation.z = (k * Math.PI) / 2; arm.position.z = 2.2; R.disc.add(arm); }
    R.disc.add(put(new THREE.Mesh(new THREE.ConeGeometry(4, 9, 12), basic(0xe8c060)), { rotation: new THREE.Euler(Math.PI / 2, 0, 0), position: new THREE.Vector3(0, 0, 5) }));
    R.ball = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 8), basic(0xffffff, { emissive: 0x333333 })); R.disc.add(R.ball);
    R.ang = 0; R.ballA = 0; R.ballR = 31; this.placeBall();
    // the layout, painted on the felt the way the bet bar shows it: zero on the left, 3-6-9 along the far row, the
    // dozens and the even-money boxes along the near edge (table frame: x -31..140, y -33..56)
    { const X0 = -31, X1 = 140, Y0 = -33, Y1 = 56, S = 6, L = document.createElement('canvas'); L.width = (X1 - X0) * S; L.height = (Y1 - Y0) * S; const q = L.getContext('2d');
      const box = (x0, y0, x1, y1, fill, text, fs = 13) => { const a = (x0 - X0) * S, b = (y0 - Y0) * S, w = (x1 - x0) * S, h = (y1 - y0) * S; q.fillStyle = fill; q.fillRect(a, b, w, h); q.strokeStyle = '#f4ecd6'; q.lineWidth = 5; q.strokeRect(a, b, w, h); q.fillStyle = '#fff'; q.font = `700 ${fs * S}px Fraunces, Georgia, serif`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(text, a + w / 2, b + h / 2 + 2); };
      q.fillStyle = '#1f6a34'; q.fillRect(0, 0, L.width, L.height);
      box(-30.5, -33, -16.5, 33, '#2a8a3a', '0');
      for (let n = 1; n <= 36; n++) { const c2 = Math.floor((n - 1) / 3), r = (n - 1) % 3, x = -10 + c2 * 13, y = (1 - r) * 22; box(x - 6.5, y - 11, x + 6.5, y + 11, RED.has(n) ? '#b82a2a' : '#1a1a1a', String(n), n > 9 ? 8 : 9); }
      ['1st 12', '2nd 12', '3rd 12'].forEach((t, i) => box(-16.5 + i * 52, 33, 35.5 + i * 52, 44.5, '#1f6a34', t, 7));
      ['1-18', 'Even', '', '', 'Odd', '19-36'].forEach((t, i) => box(-16.5 + i * 26, 44.5, 9.5 + i * 26, 56, i === 2 ? '#b82a2a' : i === 3 ? '#1a1a1a' : '#1f6a34', t, 7));
      const lt = new THREE.CanvasTexture(L); lt.colorSpace = THREE.NoColorSpace; lt.anisotropy = 8;
      const pl = new THREE.Mesh(new THREE.PlaneGeometry((X1 - X0) * T, (Y1 - Y0) * T), basic(0xffffff, { map: lt })); pl.rotation.x = -Math.PI / 2;
      pl.position.copy(this.P(tx + ((X0 + X1) / 2) * T, ty + ((Y0 + Y1) / 2) * T, 18 + 93.1 * T)); this.root.add(pl); }
    // where a chip goes on the layout, by bet: the numbers, zero, the dozens, the even-money boxes (table frame, scaled)
    R.spot = (key) => {
      let x, y; if (key[0] === 'n') { const n = +key.slice(1); if (n === 0) { x = -24; y = 0; } else { const c2 = Math.floor((n - 1) / 3), r = (n - 1) % 3; x = -10 + c2 * 13; y = (1 - r) * 22; } }
      else if (key[0] === 'd') { x = -10 + ((+key[1] - 1) * 4 + 1.5) * 13; y = 39; }
      else { const i = ['lo', 'ev', 'red', 'blk', 'od', 'hi'].indexOf(key); x = -10 + (i * 2 + 0.5) * 13; y = 50.5; }
      return this.P(tx + x * T, ty + y * T, 18 + 93.6 * T);
    };
  }
  placeBall() { const R = this.rou; R.ball.position.set(Math.cos(R.ballA) * R.ballR, Math.sin(R.ballA) * R.ballR, 3.4); R.disc.rotation.z = R.ang; }
  rouletteBets(bets) {
    const R = this.rou; R.chips.clear();
    for (const [k, v] of Object.entries(bets || {})) { const p = R.spot(k), n = Math.max(1, Math.min(6, Math.round(Math.log2(1 + v / 10)))), stake = [1000, 500, 250, 100, 50, 25, 10, 5].find((s) => v >= s) || 5; for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 1.2, 16), basic(CHIP[stake] || 0x3a6aa8)); m.position.copy(p).add(new THREE.Vector3((i % 2) * 0.3, 0.6 + i * 1.25, 0)); m.add(new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 1.25, 14), basic(0xf4ecd6))); m.children[0].scale.set(1, 1, 1); R.chips.add(m); const top = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 1.3, 12), basic(CHIP[stake] || 0x3a6aa8)); m.add(top); } }
  }
  // spin: the wheel one way, the ball the other, slowing; the ball drops into the pocket for n
  spinRoulette(n, dur = 4.2) {
    const R = this.rou, idx = WHEEL.indexOf(n), da = (Math.PI * 2) / WHEEL.length;
    // the pocket's angle on the disc, in the disc's own frame (the canvas's y runs down, the disc's up)
    const target = -(idx * da), a0 = R.ang, a1 = a0 + Math.PI * 2 * (2.5 + Math.random()), b0 = R.ballA, b1 = target - Math.PI * 2 * 5;
    return this.run(dur, (k) => { R.ang = a0 + (a1 - a0) * ease(k); R.ballA = b0 + (b1 - b0) * (1 - Math.pow(1 - k, 2.2)); R.ballR = 31.5 - 6.5 * Math.min(1, Math.max(0, (k - 0.55) / 0.35)) + (k > 0.6 && k < 0.92 ? Math.sin(k * 90) * 1.4 * (0.92 - k) : 0); if (k >= 1) R.ballA = target; this.placeBall(); });
  }

  // ---------------------------------------------------------------- blackjack
  buildBlackjack() {
    const [tx, ty] = this.C.blackjack.table, T = this.C.T; this.bj = { g: new THREE.Group(), top: 18 + 92.6 * T, tx, ty, cards: [], key: '' }; this.root.add(this.bj.g);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 20), basic(0x5a3a22)); shoe.position.copy(this.P(tx + 42, ty + 48, this.bj.top + 4)); this.root.add(shoe);
  }
  // lay the hands on the felt: the dealer's on her side, yours on yours; new cards slide in from the shoe
  blackjackHands(dealer, you, hideHole) {
    const B = this.bj, key = JSON.stringify([dealer, you, hideHole]); if (key === B.key) return; B.key = key;
    const want = [];
    const row = (h, y, who) => h.forEach((c, i) => want.push({ id: who + i, c, x: B.tx + (i - (h.length - 1) / 2) * 17, y: B.ty + y, back: who === 'd' && i === 1 && hideHole }));
    row(dealer || [], 38, 'd'); row(you || [], -36, 'y');
    const keep = new Map(B.cards.map((m) => [m.userData.id, m]));
    B.g.clear(); B.cards = [];
    for (const w of want) {
      let m = keep.get(w.id), fresh = false;
      if (!m || m.userData.r !== w.c.r || m.userData.s !== w.c.s) { m = new THREE.Mesh(new THREE.PlaneGeometry(14, 20), basic(0xffffff, { map: w.back ? cardBack() : cardFace(w.c.r, w.c.s) })); m.rotation.set(-Math.PI / 2, 0, Math.PI); m.userData = { id: w.id, r: w.c.r, s: w.c.s, back: w.back }; fresh = true; m.position.copy(this.P(B.tx + 42, B.ty + 48, B.top + 8)); }
      if (m.userData.back !== w.back) { m.material = basic(0xffffff, { map: w.back ? cardBack() : cardFace(w.c.r, w.c.s) }); m.userData.back = w.back; }
      B.g.add(m); B.cards.push(m);
      const to = this.P(w.x, w.y, B.top + 0.4 + B.cards.length * 0.02), from = m.position.clone();
      if (fresh || from.distanceTo(to) > 0.5) this.run(0.28, (k) => { m.position.lerpVectors(from, to, ease(k)); m.position.y += Math.sin(k * Math.PI) * 4; });
    }
  }

  // ---------------------------------------------------------------- dice
  buildDice() {
    const [tx, ty] = this.C.dice.table, T = this.C.T; this.dc = { tx, ty, top: 18 + 107 * T, dice: [] };
    for (let i = 0; i < 2; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 8), Array.from({ length: 6 }, (_, f) => basic(0xffffff, { map: dieFace(i ? String(f) : `${f}0`) }))); m.position.copy(this.P(tx + (i ? 14 : -14), ty, this.dc.top + 4)); this.root.add(m); this.dc.dice.push(m); }
    // a slate on a stand behind the table: the last roll, in chalk
    const c = document.createElement('canvas'); c.width = 256; c.height = 160; this.dc.slate = c; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.NoColorSpace; this.dc.tex = tex;
    const sl = new THREE.Mesh(new THREE.PlaneGeometry(48, 30), basic(0xffffff, { map: tex })); sl.position.copy(this.P(tx, ty - 120, 150)); this.root.add(sl);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(52, 34, 2), basic(0x6a4a2a)); fr.position.copy(sl.position).add(new THREE.Vector3(0, 0, -1.4)); this.root.add(fr);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(3, 130, 3), basic(0x5a3a22)); leg.position.copy(this.P(tx, ty - 122, 70)); this.root.add(leg);
    this.slate('--', '');
  }
  slate(big, small) { const c = this.dc.slate, g = c.getContext('2d'); g.fillStyle = '#26302a'; g.fillRect(0, 0, 256, 160); g.fillStyle = '#f2efe4'; g.textAlign = 'center'; g.font = '900 86px Fraunces, Georgia, serif'; g.fillText(big, 128, 100); g.font = '700 24px Nunito, sans-serif'; g.fillText(small, 128, 140); this.dc.tex.needsUpdate = true; }
  // roll: both dice thrown from your side, tumbling, coming to rest with the tens and the ones on top
  rollDice(n, line, over, dur = 1.1) {
    const D = this.dc, tens = n === 100 ? 0 : Math.floor(n / 10), ones = n % 10, out = [];
    D.dice.forEach((m, i) => {
      const top = i ? String(ones) : `${tens}0`; const mats = m.material; mats[2] = basic(0xffffff, { map: dieFace(top) });   // +y: the face that ends up on top
      for (const f of [0, 1, 3, 4, 5]) mats[f] = basic(0xffffff, { map: dieFace(i ? String(Math.floor(Math.random() * 10)) : `${Math.floor(Math.random() * 10)}0`) });
      const from = this.P(D.tx + (i ? 10 : -10), D.ty + 60, D.top + 30), to = this.P(D.tx + (i ? 12 : -12) + (Math.random() - 0.5) * 16, D.ty - 6 + (Math.random() - 0.5) * 14, D.top + 4);
      const ax = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(), spin = 14 + Math.random() * 8, yaw = Math.random() * 6.28, qEnd = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0));
      out.push(this.run(dur, (k) => { const e = ease(k), b = Math.abs(Math.sin(k * Math.PI * 2.5)) * 20 * (1 - k); m.position.lerpVectors(from, to, e); m.position.y = to.y + (from.y - to.y) * (1 - e) * 0.4 + b; const q = new THREE.Quaternion().setFromAxisAngle(ax, spin * (1 - e)); m.quaternion.copy(q.multiply(qEnd)); if (k >= 1) m.quaternion.copy(qEnd); }));
    });
    return Promise.all(out).then(() => this.slate(String(n), `${over ? 'over' : 'under'} ${line}`));
  }

  // ---------------------------------------------------------------- slots
  buildSlots() {
    const A = symbolAtlas(), SL = this.C.SL; this.slots = [];
    this.C.slots.forEach(([sx, sy]) => {
      const reels = [];
      for (let i = 0; i < 3; i++) {
        const tex = new THREE.CanvasTexture(A.canvas); tex.colorSpace = THREE.NoColorSpace; tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1, 1.5 / SYM_ORDER.length);
        const m = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 15), basic(0xffffff, { map: tex })); m.rotation.y = -Math.PI / 2;
        m.position.copy(this.P(sx + this.C.slotOut - 24.2 * SL / 0.66, sy + (i - 1) * 10.6, 18 + 166 * SL)); this.root.add(m);
        const R = { m, tex, pos: Math.random() * 7 }; reels.push(R); this.setReel(R, R.pos);
      }
      this.slots.push(reels);
    });
    A.ready.then(() => { for (const r of this.slots.flat()) r.tex.needsUpdate = true; });
  }
  // a reel at a position along the strip (in symbols: k means symbol k is in the middle)
  setReel(R, p) { const n = SYM_ORDER.length; R.tex.offset.y = 1 - (p + 0.5) / n - R.tex.repeat.y / 2; }
  spinSlots(i, out, dur = 2.1) {
    const reels = this.slots[i], n = SYM_ORDER.length;
    return Promise.all(reels.map((R, k) => { const p0 = R.pos, end = SYM_ORDER.indexOf(out[k]), p1 = end + n * (4 + k * 2) + (p0 - (p0 % n)), d = dur * (0.55 + k * 0.22);
      return this.run(d, (q) => { R.pos = p0 + (p1 - p0) * ease(q) + (q > 0.94 ? Math.sin((q - 0.94) * 60) * 0.05 * (1 - q) : 0); if (q >= 1) R.pos = end; this.setReel(R, R.pos); }); }));
  }
  // the spot to stand at and where to look, for whoever plays a game here
  seat(kind, i = 0) {
    const C = this.C, at = kind === 'slots' ? [C.slots[i][0] - 38, C.slots[i][1]] : C[kind].at, look = kind === 'slots' ? [C.slots[i][0] + C.slotOut, C.slots[i][1], 18 + 120 * C.SL] : [C[kind].table[0], C[kind].table[1], 18 + 94 * C.T];
    return { at: this.P(at[0], at[1], 0), look: this.P(look[0], look[1], look[2]) };
  }
}
