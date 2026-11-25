// The village's windows: Mossbottom's shop, the challenge board, and the four games of the Lucky Toadstool. Each is a
// card over the village (which goes on behind it). Gold moves through Meta: the shop spends it, the board pays it, and
// the casino takes a stake when you bet and pays when you win. The house keeps a little: slots about 3%, roulette 2.7%
// (one zero), high-low dice 2%, blackjack under 1% (3:2 naturals, the dealer stands on soft 17, no splits).
import * as THREE from 'three';
import { Meta, shopGuns } from './meta.js';
import { COSMETICS, SLOT_NAMES, needText } from './cosmetics.js';
import { buildCharacter, animateCharacter } from './character.js';
import { MUTATORS, DIFFS, RARITY_HEX } from './data.js';
import { MAPS } from './maps.js';

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (n) => Math.round(n).toLocaleString();
const coin = (s = '') => `<i class="coin ${s}"></i>`;
const SHOP_TABS = [
  { id: 'hats', name: 'Hats', slots: ['hat', 'hattip'] },
  { id: 'clothes', name: 'Clothes', slots: ['outfit', 'legs'] },
  { id: 'feet', name: 'Boots & Gloves', slots: ['boots', 'gloves'] },
  { id: 'trinkets', name: 'Trinkets', slots: ['neck', 'shoulder', 'waist', 'face', 'back'] },
  { id: 'guns', name: 'Guns' },
];
const STAKES = [5, 10, 25, 50, 100, 250, 500, 1000];
const CHIP_COL = { 5: '#5a7a9a', 10: '#3a6aa8', 25: '#3a8a4a', 50: '#c8962a', 100: '#1a1a1a', 250: '#8a3aa8', 500: '#b8392e', 1000: '#2a8a8a' };
// slot symbols, drawn: berry, acorn, bell, clover, star, toadstool, the gnome's hat (the jackpot)
const SYM = {
  berry: '<svg viewBox="0 0 64 64"><path d="M32 14c4-8 12-9 16-6-6 1-10 4-12 9" fill="#3a8a3a"/><circle cx="24" cy="38" r="13" fill="#c8281e"/><circle cx="40" cy="40" r="13" fill="#e0342c"/><circle cx="20" cy="33" r="3" fill="#fff" opacity=".7"/><circle cx="36" cy="35" r="3" fill="#fff" opacity=".7"/><path d="M24 25 32 14 40 27" stroke="#3a6a2a" stroke-width="3" fill="none"/></svg>',
  acorn: '<svg viewBox="0 0 64 64"><path d="M14 28c0-10 8-15 18-15s18 5 18 15z" fill="#6a4a2a"/><path d="M14 28h36" stroke="#4a3018" stroke-width="3"/><path d="M18 29c0 14 6 24 14 27 8-3 14-13 14-27z" fill="#c8862a"/><path d="M32 13V6" stroke="#4a3018" stroke-width="4" stroke-linecap="round"/><ellipse cx="25" cy="38" rx="3" ry="7" fill="#fff" opacity=".3"/></svg>',
  bell: '<svg viewBox="0 0 64 64"><path d="M32 8c-11 0-16 9-16 20 0 10-4 14-7 18h46c-3-4-7-8-7-18 0-11-5-20-16-20z" fill="#e8b830"/><rect x="8" y="45" width="48" height="6" rx="3" fill="#c8962a"/><circle cx="32" cy="55" r="5" fill="#a8781e"/><path d="M24 18c-3 4-3 10-3 14" stroke="#fff6c8" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
  clover: '<svg viewBox="0 0 64 64"><g fill="#3a9a4a"><circle cx="23" cy="24" r="11"/><circle cx="41" cy="24" r="11"/><circle cx="23" cy="40" r="11"/><circle cx="41" cy="40" r="11"/></g><path d="M32 32c4 10 10 18 18 22" stroke="#2a6a2a" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="32" cy="32" r="5" fill="#2a7a3a"/></svg>',
  star: '<svg viewBox="0 0 64 64"><path d="M32 5l8 18 19 2-14 13 4 19-17-10-17 10 4-19L5 25l19-2z" fill="#ffcd5a" stroke="#c8962a" stroke-width="3" stroke-linejoin="round"/><circle cx="26" cy="26" r="3" fill="#fff" opacity=".8"/></svg>',
  shroom: '<svg viewBox="0 0 64 64"><path d="M6 34C6 18 18 8 32 8s26 10 26 26z" fill="#c8281e"/><circle cx="20" cy="24" r="5" fill="#fbf4e6"/><circle cx="38" cy="16" r="4" fill="#fbf4e6"/><circle cx="46" cy="28" r="4" fill="#fbf4e6"/><circle cx="30" cy="27" r="3" fill="#fbf4e6"/><path d="M24 34h16l2 22H22z" fill="#fbf4e6"/><path d="M6 34h52" stroke="#8a1a14" stroke-width="3"/></svg>',
  hat: '<svg viewBox="0 0 64 64"><path d="M32 4 50 46H14z" fill="#b8281e"/><path d="M32 4 41 25" stroke="#e0503c" stroke-width="4" stroke-linecap="round"/><rect x="8" y="44" width="48" height="9" rx="4.5" fill="#8a1a14"/><circle cx="32" cy="5" r="5" fill="#ffcd5a"/><rect x="26" y="44" width="12" height="9" fill="#ffcd5a"/></svg>',
};
const REEL = { berry: 7, acorn: 6, bell: 5, clover: 4, star: 3, shroom: 2, hat: 1 };
const PAY3 = { berry: 8, acorn: 14, bell: 24, clover: 40, star: 75, shroom: 180, hat: 700 };
const PAY2 = { berry: 1, acorn: 1.5, bell: 2, clover: 2.5, star: 3, shroom: 5, hat: 10 };   // the first two reels alike
const spinReel = () => { let r = Math.random() * 28; for (const k of Object.keys(REEL)) { r -= REEL[k]; if (r < 0) return k; } return 'berry'; };
const slotPay = (a, b, c) => (a === b && b === c ? PAY3[a] : a === b ? PAY2[a] : 0);
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const SUITS = ['♠', '♥', '♦', '♣'], RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function makeVillageUI(H) {
  const el = document.getElementById('vpanel');
  let open = false, kind = '', arg = null, stake = 25;
  // shop state
  let tab = 'hats', pick = null, stage = null;
  // casino state
  const C = { slot: { reels: ['berry', 'acorn', 'bell'], busy: false }, rou: { bets: {}, hist: [], busy: false, ang: 0, ball: 0 }, bj: null, dice: { target: 50, over: true, last: null, busy: false } };
  let msg = '', msgCls = '';
  const say = (t, c = '') => { msg = t; msgCls = c; const m = el.querySelector('.msg'); if (m) { m.textContent = t; m.className = 'msg ' + c; } };
  const purse = () => { const b = el.querySelector('.vp-purse b'); if (b) b.textContent = fmt(Meta.gold()); };
  const sound = (n, v = 0.8) => { try { H.audio.play(n, v); } catch (e) { /* no audio yet */ } };

  function show(k, a) {
    if (open && kind === k) return;
    open = true; kind = k; arg = a; msg = ''; msgCls = ''; pick = null;
    if (k === 'roulette') C.rou.bets = {};
    H.entered(); el.style.display = 'block'; render(); sound('S_UISelect', 0.7);
  }
  function close() { if (!open) return; open = false; el.style.display = 'none'; if (stage) stage.detach(); H.left(); }
  const head = (title, line) => `<div class="vp-head"><div class="tt"><h2>${title}</h2><p>${line}</p></div><div class="vp-purse">${coin()}<b>${fmt(Meta.gold())}</b></div><button class="vp-x">Done<kbd>E</kbd></button></div>`;
  function render() {
    let h = '';
    if (kind === 'shop') h = renderShop();
    else if (kind === 'board') h = renderBoard();
    else h = renderCasino();
    el.innerHTML = `<div class="vp-card k-${kind}">${h}</div>`;
    el.querySelector('.vp-x').onclick = (e) => { e.stopPropagation(); close(); };
    if (kind === 'shop') wireShop(); else if (kind === 'board') wireBoard(); else wireCasino();
  }

  // ------------------------------------------------------------------ the shop
  function shopItems(t) {
    if (t === 'guns') return shopGuns().map((w) => ({ gun: true, name: w.name, w, state: Meta.gunState(w.name), price: Meta.gunPrice(w.name) })).sort((a, b) => ['owned', 'buy', 'locked'].indexOf(a.state) - ['owned', 'buy', 'locked'].indexOf(b.state) || a.price - b.price);
    const T = SHOP_TABS.find((q) => q.id === t), out = [];
    for (const slot of T.slots) for (const I of COSMETICS[slot]) { const own = Meta.cosOwned(slot, I.id), earn = !!I.need; out.push({ slot, I, name: I.name, state: own ? 'owned' : earn ? 'locked' : 'buy', price: Meta.cosPrice(slot, I.id) }); }
    return out;
  }
  function renderShop() {
    const items = shopItems(tab); if (!pick || pick.tab !== tab) { const first = items.find((x) => x.state === 'buy') || items[0]; pick = first ? { tab, key: first.gun ? first.name : first.slot + ':' + first.I.id } : null; }
    let h = head('Bramble &amp; Bolt', 'Mossbottom’s counter: hats, clothes, trinkets, and guns to start your runs with');
    h += '<div class="vp-body"><div class="shop-left"><div class="shop-stage" id="sstage"></div><div class="shop-info" id="sinfo"></div></div><div style="flex:1;min-width:0;display:flex;flex-direction:column">';
    h += `<div class="vp-tabs">${SHOP_TABS.map((T) => { const L = shopItems(T.id), n = L.filter((x) => x.state === 'owned').length; return `<div class="vp-tab ${T.id === tab ? 'on' : ''}" data-tab="${T.id}">${T.name}<i>${n}/${L.length}</i></div>`; }).join('')}</div><div class="vp-scroll"><div class="grid">`;
    if (tab === 'guns') {
      for (const x of items) {
        const k = x.name, sel = pick && pick.key === k, st = Meta.starter() === k;
        h += `<div class="it gun ${x.state === 'locked' ? 'lock' : ''} ${sel ? 'sel' : ''}" data-key="${esc(k)}" style="--rc:${RARITY_HEX[x.w.rarity] || '#888'}">${st ? '<span class="star">STARTING</span>' : ''}<img src="${H.thumb('gun', k)}" alt=""><div class="gi"><b>${esc(k)}</b><span>${esc(x.w.rarity)} ${esc(x.w.cls || '')}</span>${x.state === 'owned' ? '<div class="ok">OWNED</div>' : x.state === 'locked' ? `<div class="nd">${esc(Meta.howToUnlock('guns', k) || 'Unlocked by progress')}</div>` : `<div class="pr ${Meta.gold() < x.price ? 'poor' : ''}">${coin('s')}${fmt(x.price)}</div>`}</div></div>`;
      }
    } else {
      const T = SHOP_TABS.find((q) => q.id === tab);
      for (const slot of T.slots) {
        h += `<h4>${esc(SLOT_NAMES[slot] || slot).toUpperCase()}</h4>`;
        for (const x of items.filter((q) => q.slot === slot)) {
          const k = slot + ':' + x.I.id, sel = pick && pick.key === k, worn = Meta.look()[slot] === x.I.id;
          h += `<div class="it ${x.state === 'locked' ? 'lock' : ''} ${sel ? 'sel' : ''}" data-key="${esc(k)}">${worn ? '<span class="star">WEARING</span>' : ''}<b>${esc(x.name)}</b>${x.state === 'owned' ? `<div class="ok">${x.price || x.I.need ? 'OWNED' : 'STARTER KIT'}</div>` : x.state === 'locked' ? `<div class="nd">${esc(needText(x.I))}</div>` : `<div class="pr ${Meta.gold() < x.price ? 'poor' : ''}">${coin('s')}${fmt(x.price)}</div>`}</div>`;
        }
      }
    }
    return h + '</div></div></div></div>';
  }
  function shopPick() { if (!pick) return null; const L = shopItems(tab); return L.find((x) => (x.gun ? x.name : x.slot + ':' + x.I.id) === pick.key) || null; }
  function shopInfo() {
    const x = shopPick(), box = el.querySelector('#sinfo'), stg = el.querySelector('#sstage'); if (!box) return;
    if (!x) { box.innerHTML = ''; return; }
    const poor = x.state === 'buy' && Meta.gold() < x.price;
    let h = `<h3>${esc(x.name)}</h3><div class="tags">`;
    if (x.gun) {
      const W = x.w, st = Meta.starter() === x.name;
      h += `<span class="tag" style="color:${RARITY_HEX[W.rarity]}">${esc(W.rarity)}</span><span class="tag">${esc(W.cls || 'gun')}</span>${x.state === 'owned' ? '<span class="tag own">Owned</span>' : x.state === 'locked' ? '<span class="tag lock">Locked</span>' : ''}${st ? '<span class="tag start">Starting gun</span>' : ''}</div>`;
      h += `<div class="desc">${esc(W.desc || '')}</div><div class="stats"><div><span>DAMAGE</span><b>${Math.round(W.dmg * (W.pellets || 1))}</b></div><div><span>RATE</span><b>${(+W.rate || 0).toFixed(1)}/s</b></div><div><span>MAG</span><b>${W.mag}</b></div><div><span>RELOAD</span><b>${(+W.reload || 0).toFixed(1)}s</b></div></div>`;
      if (x.state === 'owned') h += `<div class="row"><button class="vp-btn ${st ? 'alt' : 'blue'}" id="sact" ${st ? 'disabled' : ''}>${st ? 'Your starting gun' : 'Start runs with it'}</button></div>`;
      else if (x.state === 'locked') h += `<div class="why">${esc(Meta.howToUnlock('guns', x.name) || 'Unlocked by progress, then sold here.')}</div>`;
      else h += `<div class="row"><button class="vp-btn" id="sbuy" ${poor ? 'disabled' : ''}>Buy  ${coin()} ${fmt(x.price)}</button></div>${poor ? `<div class="why">You need ${fmt(x.price - Meta.gold())} more gold. Runs pay it: a finished run pays most.</div>` : '<div class="desc">Bought once; choose it at the Way Down before any run.</div>'}`;
      if (stage) stage.detach();
      if (stg) stg.innerHTML = `<img src="${H.thumb('gun', x.name)}" alt="">`;
    } else {
      const worn = Meta.look()[x.slot] === x.I.id;
      h += `<span class="tag">${esc(SLOT_NAMES[x.slot] || x.slot)}</span>${x.state === 'owned' ? '<span class="tag own">Owned</span>' : x.state === 'locked' ? '<span class="tag lock">Locked</span>' : ''}${worn ? '<span class="tag start">Wearing</span>' : ''}</div>`;
      if (x.state === 'owned') h += `<div class="desc">${worn ? 'You have it on.' : 'Yours. Put it on here, or change at your wardrobe at home.'}</div><div class="row"><button class="vp-btn blue" id="swear" ${worn ? 'disabled' : ''}>${worn ? 'Wearing it' : 'Wear it'}</button></div>`;
      else if (x.state === 'locked') h += `<div class="why">Earned, not sold: ${esc(needText(x.I))}</div><div class="desc">Shown on you on the left, so you know what you are working toward.</div>`;
      else h += `<div class="desc">Shown on you on the left.</div><div class="row"><button class="vp-btn" id="sbuy" ${poor ? 'disabled' : ''}>Buy  ${coin()} ${fmt(x.price)}</button></div>${poor ? `<div class="why">You need ${fmt(x.price - Meta.gold())} more gold.</div>` : ''}`;
      if (stg && (!stage || !stg.contains(stage.canvas))) { stg.innerHTML = '<div class="hint">Drag to turn</div>'; stage = stage || makeStage(); stage.attach(stg); }
      if (stage) stage.dress(Object.assign(Meta.look(), { [x.slot]: x.I.id }), x.slot);
    }
    box.innerHTML = h;
    const buy = box.querySelector('#sbuy');
    if (buy) buy.onclick = (e) => {
      e.stopPropagation();
      const ok = x.gun ? Meta.buyGun(x.name) : Meta.buyCos(x.slot, x.I.id);
      if (ok) { sound('S_Buy', 0.9); if (!x.gun) Meta.setLook(x.slot, x.I.id); H.toast(`Bought: ${x.name}`, '#ffcd5a'); H.looked(); render(); } else sound('S_Deny', 0.6);
    };
    const wear = box.querySelector('#swear'); if (wear) wear.onclick = (e) => { e.stopPropagation(); Meta.setLook(x.slot, x.I.id); sound('S_Fit', 0.7); H.looked(); render(); };
    const act = box.querySelector('#sact'); if (act) act.onclick = (e) => { e.stopPropagation(); Meta.setStarter(x.name); sound('S_Fit', 0.7); render(); };
  }
  function wireShop() {
    el.querySelectorAll('.vp-tab').forEach((t) => { t.onclick = (e) => { e.stopPropagation(); tab = t.dataset.tab; pick = null; render(); }; });
    el.querySelectorAll('.it[data-key]').forEach((t) => { t.onclick = (e) => { e.stopPropagation(); pick = { tab, key: t.dataset.key }; el.querySelectorAll('.it.sel').forEach((q) => q.classList.remove('sel')); t.classList.add('sel'); sound('S_UISelect', 0.4); shopInfo(); }; });
    shopInfo();
  }
  // the try-on: your gnome in whatever is picked, on the one shared preview renderer
  function makeStage() {
    const P = H.preview(); if (!P) return null;
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(28, 400 / 520, 10, 4000);
    const fl = new THREE.Mesh(new THREE.CylinderGeometry(120, 130, 8, 40), new THREE.MeshBasicMaterial({ color: 0x3a2430 })); fl.position.y = -4; scene.add(fl);
    let ch = null, spin = 0.5, t = 0, zoom = 0, want = 0, drag = null, host = null;
    const S = {
      canvas: P.canvas,
      attach(hostEl) { host = hostEl; hostEl.prepend(P.canvas); P.canvas.onpointerdown = (e) => { drag = e.clientX; P.canvas.setPointerCapture(e.pointerId); }; P.canvas.onpointermove = (e) => { if (drag !== null) { spin += (e.clientX - drag) * 0.012; drag = e.clientX; } }; P.canvas.onpointerup = () => { drag = null; }; },
      detach() { host = null; },
      dress(L, slot) { if (ch) scene.remove(ch); ch = buildCharacter(L); if (ch.userData.rig && ch.userData.rig.gun) ch.userData.rig.gun.visible = false; scene.add(ch); want = ['hat', 'hattip', 'face', 'neck'].includes(slot) ? 1 : ['boots', 'legs'].includes(slot) ? -1 : 0; },
      tick(dt) {
        if (!host || !ch || !open || kind !== 'shop') return;
        const w = Math.max(200, host.clientWidth | 0), h2 = Math.max(200, host.clientHeight | 0);
        P.R.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); P.R.setSize(w, h2, false); cam.aspect = w / h2; cam.updateProjectionMatrix();
        t += dt; ch.rotation.y = spin + Math.sin(t * 0.5) * 0.25; animateCharacter(ch, t, 0, { preview: true });
        zoom += (want - zoom) * Math.min(1, dt * 5);
        const R = ch.userData.rig, top = (R.topY || 220) + 12, hy = R.headY || 130, z = Math.max(0, zoom), lo = Math.max(0, -zoom);
        const ty = (top * 0.5) * (1 - z - lo) + (hy + 8) * z + 40 * lo, dist = Math.max(560, top * 3) * (1 - z - lo * 0.4) + 330 * z;
        cam.position.set(0, ty + 20, dist); cam.lookAt(0, ty, 0); P.R.render(scene, cam);
      },
    };
    return S;
  }

  // ------------------------------------------------------------------ the challenge board
  function renderBoard() {
    const L = Meta.board(), cur = Meta.contract();
    let h = head('The Challenge Board', 'Mayor Thistlewood’s contracts: six a day, the same for everyone. New ones at midnight UTC.');
    h += `<div class="vp-body"><div class="board"><p class="lead">Take one contract and its rules are set at the Way Down: the mode, the difficulty and the modifiers. Win that run and the bonus is paid on top of what the run pays. Each contract pays once.</p><div class="notes">`;
    L.forEach((c, i) => {
      const mods = MUTATORS.filter((M, k) => (c.muts >> k) & 1), taken = cur && cur.id === c.id, where = c.mode === 'descent' ? 'The Descent' : `Survival: ${MAPS[c.map] ? MAPS[c.map].name : ''}`;
      h += `<div class="note ${taken ? 'taken' : ''} ${c.done ? 'done' : ''}" style="--r:${[-1.2, 0.8, -0.4, 1.1, -0.9, 0.5][i % 6]}deg">${c.done ? '<span class="stamp p">PAID</span>' : taken ? '<span class="stamp t">TAKEN</span>' : ''}<h3>${esc(c.title)}</h3><div class="fl">${esc(c.flavor)}</div>`;
      h += `<div class="rules"><span>${esc(where)}</span><span class="d${c.diff}">${esc(DIFFS[c.diff].name)}</span>${mods.map((M) => `<span>${esc(M.name)}</span>`).join('')}</div>`;
      h += `<div class="mods">${mods.map((M) => `<b>${esc(M.name)}:</b> ${esc(M.desc)}`).join('<br>')}</div>`;
      h += `<div class="pay"><span class="gd">${coin()}${fmt(c.gold)}</span><span class="rn">+${fmt(c.renown)} renown</span></div>`;
      h += c.done ? '' : taken ? `<button class="vp-btn alt" data-drop="1">Drop this contract</button>` : `<button class="vp-btn" data-take="${esc(c.id)}">Take contract</button>`;
      h += '</div>';
    });
    return h + '</div></div></div>';
  }
  function wireBoard() {
    el.querySelectorAll('[data-take]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); Meta.takeContract(b.dataset.take); sound('S_Fit', 0.8); const c = Meta.contract(); H.toast(`Contract taken: ${c ? c.title : ''}. Its rules are set at the Way Down.`, '#9fe0ff'); render(); }; });
    el.querySelectorAll('[data-drop]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); Meta.takeContract(''); sound('S_UISelect', 0.6); render(); }; });
  }

  // ------------------------------------------------------------------ the casino
  const stakeRow = () => `<h4>Your stake</h4><div class="chips">${STAKES.map((v) => `<div class="chip ${v === stake ? 'on' : ''} ${Meta.gold() < v ? 'off' : ''}" data-stake="${v}" style="background:${CHIP_COL[v]}">${v >= 1000 ? '1K' : v}</div>`).join('')}</div>`;
  function renderCasino() {
    const T = { slots: ['The Toadstool Slots', 'Three reels. Line up the first two, or all three.'], roulette: ['Roulette', 'Pip’s wheel: one zero, thirty-six numbers. Place chips, then spin.'], blackjack: ['Blackjack', 'Dame Fennel deals. Beat her hand without going over 21.'], dice: ['High-Low Dice', 'Clatterby rolls a hundred-sided die. Pick a line, pick a side.'] }[kind];
    let h = head(T[0], T[1]) + '<div class="vp-body"><div class="cas">';
    if (kind === 'slots') {
      h += `<div class="cas-main"><div class="slot-face"><div class="nm">★ Lucky Toadstool ★</div><div class="reels">${[0, 1, 2].map((i) => `<div class="reel"><div class="strip" id="r${i}">${reelStrip(C.slot.reels[i])}</div></div>`).join('')}</div></div><div class="msg ${msgCls}">${esc(msg)}</div><button class="vp-btn" id="spin" style="min-width:260px">Spin  ${coin()} ${stake}</button></div>`;
      h += `<div class="cas-side">${stakeRow()}<h4>Pays (times your stake)</h4><div class="paytab">${Object.keys(PAY3).reverse().map((k) => `<div class="sy">${SYM[k]}${SYM[k]}${SYM[k]}</div><b>×${PAY3[k]}</b>`).join('')}${Object.keys(PAY2).reverse().map((k) => `<div class="sy">${SYM[k]}${SYM[k]}</div><b>×${PAY2[k]}</b>`).join('')}</div><p>Two alike means the first two reels. The machine returns about 97 of every 100 gold staked.</p></div>`;
    } else if (kind === 'roulette') {
      const R = C.rou, tot = Object.values(R.bets).reduce((a, b) => a + b, 0);
      h += `<div class="cas-main"><div class="rou"><canvas id="wheel" width="600" height="600"></canvas><div class="layout">${layoutHtml()}</div></div><div class="msg ${msgCls}">${esc(msg)}</div><div class="acts"><button class="vp-btn" id="rspin" ${tot ? '' : 'disabled'}>Spin  ${coin()} ${fmt(tot)}</button><button class="vp-btn alt" id="rclear" ${tot ? '' : 'disabled'}>Clear bets</button></div></div>`;
      h += `<div class="cas-side">${stakeRow()}<p>Click the layout to put a chip down; click again to add another. Red, black, odd, even, low and high pay 1 to 1, a dozen 2 to 1, a single number 35 to 1. Zero takes the rest.</p><h4>Last numbers</h4><div class="hist">${R.hist.map((n) => `<span style="background:${n === 0 ? '#2a8a3a' : RED.has(n) ? '#b82a2a' : '#1a1a1a'}">${n}</span>`).join('') || '<p>None yet.</p>'}</div></div>`;
    } else if (kind === 'blackjack') {
      const B = C.bj, live = B && !B.done;
      h += `<div class="cas-main"><div class="bj">${handHtml('Dame Fennel', B ? B.dealer : [], B && !B.done)}${handHtml('You', B ? B.you : [], false, B && B.doubled)}</div><div class="msg ${msgCls}">${esc(msg)}</div><div class="acts">${live ? `<button class="vp-btn" id="hit">Hit</button><button class="vp-btn alt" id="stand">Stand</button><button class="vp-btn blue" id="dbl" ${B.you.length === 2 && Meta.gold() >= B.bet ? '' : 'disabled'}>Double</button>` : `<button class="vp-btn" id="deal" style="min-width:240px">Deal  ${coin()} ${stake}</button>`}</div></div>`;
      h += `<div class="cas-side">${stakeRow()}<p>Get closer to 21 than the dealer without going over. Picture cards count 10, aces 1 or 11. A natural 21 pays 3 to 2; a win pays 1 to 1; a tie gives your stake back. The dealer draws to 16 and stands on every 17. Double: one more card, twice the stake.</p></div>`;
    } else {
      const D = C.dice, p = D.over ? (100 - D.target) / 100 : (D.target - 1) / 100, mult = p > 0 ? 0.98 / p : 0;
      h += `<div class="cas-main"><div class="dice"><div class="roll" id="droll">${D.last === null ? '--' : D.last}</div><div class="bar"><i style="${D.over ? `left:${D.target}%;right:0` : `left:0;width:${D.target - 1}%`}"></i><em style="left:${D.last === null ? 50 : D.last}%"></em></div>`;
      h += `<input type="range" min="5" max="95" value="${D.target}" id="dtarget"><div class="seg"><button data-side="under" class="${D.over ? '' : 'on'}">UNDER ${D.target}</button><button data-side="over" class="${D.over ? 'on' : ''}">OVER ${D.target}</button></div><div class="odds"><div>CHANCE<b>${Math.round(p * 100)}%</b></div><div>PAYS<b>×${mult.toFixed(2)}</b></div><div>WIN<b>${coin()} ${fmt(Math.floor(stake * mult))}</b></div></div></div><div class="msg ${msgCls}">${esc(msg)}</div><button class="vp-btn" id="droll2" style="min-width:260px">Roll  ${coin()} ${stake}</button></div>`;
      h += `<div class="cas-side">${stakeRow()}<p>The die rolls 1 to 100. Over wins on anything above your line, under on anything below it; the line itself loses. The longer the odds, the bigger the pay: the house keeps 2 in every 100.</p></div>`;
    }
    return h + '</div></div>';
  }
  function wireCasino() {
    el.querySelectorAll('.chip[data-stake]').forEach((c) => { c.onclick = (e) => { e.stopPropagation(); if (c.classList.contains('off')) return; stake = +c.dataset.stake; sound('S_Coin', 0.4); render(); }; });
    if (kind === 'slots') { const b = el.querySelector('#spin'); b.disabled = C.slot.busy || Meta.gold() < stake; b.onclick = (e) => { e.stopPropagation(); spinSlots(); }; }
    if (kind === 'roulette') {
      drawWheel(); const R = C.rou;
      el.querySelectorAll('.layout [data-bet]').forEach((d) => { d.onclick = (e) => { e.stopPropagation(); if (R.busy) return; const tot = Object.values(R.bets).reduce((a, b) => a + b, 0); if (Meta.gold() < tot + stake) { say('Not enough gold for another chip', 'lose'); sound('S_Deny', 0.5); return; } R.bets[d.dataset.bet] = (R.bets[d.dataset.bet] || 0) + stake; sound('S_Coin', 0.5); msg = ''; render(); }; });
      const sp = el.querySelector('#rspin'); if (sp) sp.onclick = (e) => { e.stopPropagation(); spinRoulette(); };
      const cl = el.querySelector('#rclear'); if (cl) cl.onclick = (e) => { e.stopPropagation(); if (!R.busy) { R.bets = {}; render(); } };
    }
    if (kind === 'blackjack') {
      const on = (id, fn) => { const b = el.querySelector(id); if (b) b.onclick = (e) => { e.stopPropagation(); fn(); }; };
      on('#deal', bjDeal); on('#hit', bjHit); on('#stand', bjStand); on('#dbl', bjDouble);
      const d = el.querySelector('#deal'); if (d) d.disabled = Meta.gold() < stake;
    }
    if (kind === 'dice') {
      const D = C.dice, r = el.querySelector('#dtarget');
      r.oninput = (e) => { e.stopPropagation(); D.target = +r.value; render(); el.querySelector('#dtarget').focus(); };
      r.addEventListener('keydown', (e) => e.stopPropagation());
      el.querySelectorAll('.seg button').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); D.over = b.dataset.side === 'over'; render(); }; });
      const b = el.querySelector('#droll2'); b.disabled = D.busy || Meta.gold() < stake; b.onclick = (e) => { e.stopPropagation(); rollDice(); };
    }
  }
  // -- slots
  function reelStrip(cur) { return `<div>${SYM[spinReel()]}</div><div>${SYM[cur]}</div><div>${SYM[spinReel()]}</div>`; }
  function spinSlots() {
    const S = C.slot; if (S.busy) return;
    if (!Meta.stake(stake)) { say('Not enough gold', 'lose'); sound('S_Deny', 0.6); return; }
    S.busy = true; purse(); say(''); sound('S_Coin', 0.7);
    const out = [spinReel(), spinReel(), spinReel()], bet = stake;
    out.forEach((k, i) => {
      const st = el.querySelector('#r' + i), lead = []; for (let n = 0; n < 18 + i * 7; n++) lead.push(spinReel());
      // the strip runs top to bottom: the old symbol at the top, the spin, and the result third from the end (middle row)
      const L = [S.reels[i]].concat(lead, [out[i]]);
      st.innerHTML = `<div>${SYM[spinReel()]}</div>` + L.map((q) => `<div>${SYM[q]}</div>`).join('') + `<div>${SYM[spinReel()]}</div>`;
      const endY = -(L.length - 1) * 100;
      st.style.transition = 'none'; st.style.transform = 'translateY(0px)'; void st.offsetHeight;
      st.style.transition = `transform ${1.1 + i * 0.45}s cubic-bezier(.15,.7,.25,1.04)`; st.style.transform = `translateY(${endY}px)`;
      setTimeout(() => sound('S_UISelect', 0.5), (1100 + i * 450));
    });
    setTimeout(() => {
      S.reels = out; S.busy = false; const m = slotPay(...out), win = Math.floor(bet * m);
      if (win > 0) { Meta.payout(win); Meta.bump('casinoWon', win); sound(m >= 40 ? 'S_Jackpot' : 'S_Cash', 0.9); say(m >= 40 ? `JACKPOT!  +${fmt(win)}` : `WIN  +${fmt(win)}`, 'win'); } else { say('No luck. Again?', 'lose'); }
      Meta.bump('casinoPlays'); purse(); const b = el.querySelector('#spin'); if (b) b.disabled = Meta.gold() < stake;
    }, 2100);
  }
  // -- roulette
  function layoutHtml() {
    const B = C.rou.bets, cell = (key, cls, label, extra = '') => `<div class="${cls} ${B[key] ? 'bet' : ''} ${C.rou.hit === key ? 'hit' : ''}" data-bet="${key}" ${B[key] ? `data-b="${B[key]}"` : ''} ${extra}>${label}</div>`;
    let h = cell('n0', 'z', '0', 'style="grid-column:1;grid-row:1 / 4"');
    for (let c = 0; c < 12; c++) for (let r = 0; r < 3; r++) { const n = c * 3 + (3 - r); h += cell('n' + n, RED.has(n) ? 'r' : 'k', n, `style="grid-column:${c + 2};grid-row:${r + 1}"`); }
    [['d1', '1st 12'], ['d2', '2nd 12'], ['d3', '3rd 12']].forEach(([k, t], i) => { h += cell(k, 'o', t, `style="grid-column:${2 + i * 4} / span 4;grid-row:4"`); });
    [['lo', '1-18'], ['ev', 'EVEN'], ['red', 'RED'], ['blk', 'BLACK'], ['od', 'ODD'], ['hi', '19-36']].forEach(([k, t], i) => { h += cell(k, k === 'red' ? 'r' : k === 'blk' ? 'k' : 'o', t, `style="grid-column:${2 + i * 2} / span 2;grid-row:5"`); });
    return h;
  }
  const rouletteWins = (key, n) => {
    if (key[0] === 'n') return +key.slice(1) === n ? 36 : 0;
    if (n === 0) return 0;
    switch (key) { case 'd1': return n <= 12 ? 3 : 0; case 'd2': return n > 12 && n <= 24 ? 3 : 0; case 'd3': return n > 24 ? 3 : 0; case 'lo': return n <= 18 ? 2 : 0; case 'hi': return n > 18 ? 2 : 0; case 'ev': return n % 2 === 0 ? 2 : 0; case 'od': return n % 2 ? 2 : 0; case 'red': return RED.has(n) ? 2 : 0; case 'blk': return RED.has(n) ? 0 : 2; default: return 0; }
  };
  function drawWheel() {
    const cv = el.querySelector('#wheel'); if (!cv) return; const g = cv.getContext('2d'), R = C.rou, cx = 300, cy = 300;
    g.clearRect(0, 0, 600, 600);
    g.save(); g.translate(cx, cy); g.rotate(R.ang);
    g.fillStyle = '#5a3a22'; g.beginPath(); g.arc(0, 0, 292, 0, Math.PI * 2); g.fill(); g.fillStyle = '#c8962a'; g.beginPath(); g.arc(0, 0, 276, 0, Math.PI * 2); g.fill();
    const n = WHEEL.length, da = (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) { const v = WHEEL[i]; g.fillStyle = v === 0 ? '#2a8a3a' : RED.has(v) ? '#b82a2a' : '#1a1a1a'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 268, i * da - da / 2 - Math.PI / 2, i * da + da / 2 - Math.PI / 2); g.closePath(); g.fill(); g.save(); g.rotate(i * da); g.fillStyle = '#fff'; g.font = '700 22px "Fraunces", Georgia, serif'; g.textAlign = 'center'; g.fillText(String(v), 0, -238); g.restore(); }
    g.fillStyle = '#3a2416'; g.beginPath(); g.arc(0, 0, 200, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#c8962a'; g.lineWidth = 6; g.stroke();
    for (let k = 0; k < 4; k++) { g.save(); g.rotate(k * Math.PI / 2); g.fillStyle = '#e8c060'; g.fillRect(-6, -150, 12, 300); g.restore(); }
    g.fillStyle = '#ffcd5a'; g.beginPath(); g.arc(0, 0, 34, 0, Math.PI * 2); g.fill();
    g.restore();
    // the ball, on the track
    const br = R.ballR || 222; g.fillStyle = '#fff'; g.beginPath(); g.arc(cx + Math.sin(R.ball) * br, cy - Math.cos(R.ball) * br, 11, 0, Math.PI * 2); g.fill();
  }
  function spinRoulette() {
    const R = C.rou; if (R.busy) return; const tot = Object.values(R.bets).reduce((a, b) => a + b, 0); if (!tot) return;
    if (!Meta.stake(tot)) { say('Not enough gold', 'lose'); sound('S_Deny', 0.6); return; }
    R.busy = true; R.hit = null; purse(); say('No more bets...'); sound('S_Coin', 0.7);
    const n = WHEEL[Math.floor(Math.random() * WHEEL.length)], idx = WHEEL.indexOf(n), da = (Math.PI * 2) / WHEEL.length;
    const a0 = R.ang, b0 = R.ball, dur = 4.2, a1 = a0 + Math.PI * 2 * 3 + Math.random() * 2;
    // the ball ends over pocket idx: its angle = wheel angle + idx * da
    const b1 = a1 + idx * da - Math.PI * 2 * 6; let t = 0;
    R.anim = (dt) => {
      t += dt; const k = Math.min(1, t / dur), e = 1 - Math.pow(1 - k, 3);
      R.ang = a0 + (a1 - a0) * e; R.ball = b0 + (b1 - b0) * (1 - Math.pow(1 - k, 2.4)); R.ballR = 262 - 40 * Math.min(1, Math.max(0, (k - 0.55) / 0.35)) + (k > 0.6 && k < 0.95 ? Math.sin(t * 40) * 6 * (0.95 - k) : 0);
      if (k >= 1) R.ball = a1 + idx * da;
      drawWheel();
      if (k >= 1) {
        R.anim = null; R.busy = false; R.hist.unshift(n); R.hist = R.hist.slice(0, 12); R.hit = 'n' + n;
        let win = 0; for (const [k2, v] of Object.entries(R.bets)) win += v * rouletteWins(k2, n);
        if (win) { Meta.payout(win); Meta.bump('casinoWon', win); sound(win >= tot * 10 ? 'S_Jackpot' : 'S_Cash', 0.9); }
        Meta.bump('casinoPlays');
        msg = `${n} ${n === 0 ? 'GREEN' : RED.has(n) ? 'RED' : 'BLACK'}  -  ${win ? `WIN +${fmt(win)}` : 'the house takes it'}`; msgCls = win ? 'win' : 'lose';
        const keep = R.bets; R.bets = Meta.gold() >= tot ? keep : {}; render();   // the same bets stay down for another spin, if you can cover them
      }
    };
  }
  // -- blackjack
  const draw = () => ({ r: Math.floor(Math.random() * 13), s: Math.floor(Math.random() * 4) });
  const total = (h) => { let t = 0, a = 0; for (const c of h) { const v = c.r === 0 ? 11 : Math.min(10, c.r + 1); t += v; if (c.r === 0) a++; } while (t > 21 && a) { t -= 10; a--; } return t; };
  const soft = (h) => { let t = 0, a = 0; for (const c of h) { t += c.r === 0 ? 11 : Math.min(10, c.r + 1); if (c.r === 0) a++; } while (t > 21 && a) { t -= 10; a--; } return a > 0; };
  function handHtml(who, h, hideHole, dbl) {
    const cards = h.map((c, i) => (hideHole && i === 1 ? '<div class="card back"></div>' : `<div class="card ${c.s === 1 || c.s === 2 ? 'red' : ''}"><div class="c1">${RANKS[c.r]}<br>${SUITS[c.s]}</div><div class="pip">${SUITS[c.s]}</div><div class="c2">${RANKS[c.r]}<br>${SUITS[c.s]}</div></div>`)).join('');
    const t = h.length ? (hideHole ? total([h[0]]) : total(h)) : '';
    return `<div class="hand"><div class="lb">${who}${h.length ? `<b>${t}${hideHole ? ' +?' : ''}</b>` : ''}${dbl ? ' <span class="tag start">DOUBLED</span>' : ''}</div><div class="cards">${cards || '<div style="height:116px"></div>'}</div></div>`;
  }
  function bjDeal() {
    if (C.bj && !C.bj.done) return;
    if (!Meta.stake(stake)) { say('Not enough gold', 'lose'); sound('S_Deny', 0.6); return; }
    C.bj = { bet: stake, you: [draw(), draw()], dealer: [draw(), draw()], done: false, doubled: false }; msg = ''; sound('S_Coin', 0.6);
    const B = C.bj, yb = total(B.you) === 21, db = total(B.dealer) === 21;
    if (yb || db) return bjSettle(yb && db ? 'push' : yb ? 'bj' : 'lose');
    render();
  }
  function bjHit() { const B = C.bj; if (!B || B.done) return; B.you.push(draw()); sound('S_UISelect', 0.5); if (total(B.you) > 21) return bjSettle('bust'); if (total(B.you) === 21) return bjStand(); render(); }
  function bjDouble() { const B = C.bj; if (!B || B.done || B.you.length !== 2 || !Meta.stake(B.bet)) return; B.bet *= 2; B.doubled = true; B.you.push(draw()); if (total(B.you) > 21) return bjSettle('bust'); bjStand(); }
  function bjStand() {
    const B = C.bj; if (!B || B.done) return;
    while (total(B.dealer) < 17) B.dealer.push(draw());   // stands on every 17, soft ones too
    const y = total(B.you), d = total(B.dealer);
    bjSettle(d > 21 || y > d ? 'win' : y === d ? 'push' : 'lose');
  }
  function bjSettle(r) {
    const B = C.bj; B.done = true; let pay = 0;
    if (r === 'bj') pay = Math.floor(B.bet * 2.5); else if (r === 'win') pay = B.bet * 2; else if (r === 'push') pay = B.bet;
    if (pay) Meta.payout(pay); if (pay > B.bet) Meta.bump('casinoWon', pay - B.bet); Meta.bump('casinoPlays');
    msg = { bj: `BLACKJACK!  +${fmt(pay)}`, win: `YOU WIN  +${fmt(pay)}`, push: 'A TIE  -  stake back', lose: total(B.dealer) > 21 ? 'Dealer busts... and so do you' : 'Dealer wins', bust: 'BUST' }[r]; msgCls = pay > B.bet ? 'win' : pay ? '' : 'lose';
    sound(r === 'bj' ? 'S_Jackpot' : pay > B.bet ? 'S_Cash' : pay ? 'S_Coin' : 'S_Deny', 0.8); render();
  }
  void soft;
  // -- dice
  function rollDice() {
    const D = C.dice; if (D.busy) return;
    const p = D.over ? (100 - D.target) / 100 : (D.target - 1) / 100, mult = 0.98 / p, bet = stake;
    if (!Meta.stake(bet)) { say('Not enough gold', 'lose'); sound('S_Deny', 0.6); return; }
    D.busy = true; purse(); say(''); sound('S_Coin', 0.6);
    const n = 1 + Math.floor(Math.random() * 100), out = el.querySelector('#droll'); let k = 0;
    const iv = setInterval(() => { k++; if (out) out.textContent = 1 + Math.floor(Math.random() * 100); if (k % 3 === 0) sound('S_UISelect', 0.25); }, 50);
    setTimeout(() => {
      clearInterval(iv); D.busy = false; D.last = n;
      const won = D.over ? n > D.target : n < D.target, win = won ? Math.floor(bet * mult) : 0;
      if (win) { Meta.payout(win); Meta.bump('casinoWon', win); sound(mult >= 5 ? 'S_Jackpot' : 'S_Cash', 0.85); }
      Meta.bump('casinoPlays');
      msg = won ? `${n}  -  WIN +${fmt(win)}` : `${n}  -  no good`; msgCls = won ? 'win' : 'lose'; render();
    }, 900);
  }

  function tick(dt) {
    if (!open) return;
    if (stage) stage.tick(dt);
    if (kind === 'roulette' && C.rou.anim) C.rou.anim(dt);
  }
  // E or Esc closes whatever window is up (the slider and the name fields keep their own keys)
  addEventListener('keydown', (e) => { if (!open) return; if (e.code === 'Escape' || e.code === 'KeyE') { e.preventDefault(); e.stopPropagation(); close(); } }, true);
  el.addEventListener('click', (e) => e.stopPropagation());
  return { show, close, tick, isOpen: () => open, kind: () => kind, refresh: () => { if (open) render(); } };
}
