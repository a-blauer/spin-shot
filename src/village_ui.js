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
import { SYM } from './casino_symbols.js';
import { WHEEL } from './casino_world.js';

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
// The reels: 57 stops each, the wild on one of them. The wild stands in for any symbol to make three of a kind (three
// wilds is the top prize); it does not make pairs. With these pays a spin returns about 97 in 100 (worked out exactly over
// every combination).
const REEL = { berry: 14, acorn: 12, bell: 10, clover: 8, star: 6, shroom: 4, hat: 2, wild: 1 };
const PAY3 = { berry: 6, acorn: 10, bell: 17, clover: 28, star: 52, shroom: 126, hat: 490, wild: 1400 };
const PAY2 = { berry: 1, acorn: 1.5, bell: 2, clover: 2.5, star: 3, shroom: 5, hat: 10, wild: 10 };   // the first two reels alike
const STOPS = Object.values(REEL).reduce((a, b) => a + b, 0);
const spinReel = () => { let r = Math.random() * STOPS; for (const k of Object.keys(REEL)) { r -= REEL[k]; if (r < 0) return k; } return 'berry'; };
const slotPay = (a, b, c) => { const nw = [a, b, c].filter((x) => x !== 'wild'); if (!nw.length) return PAY3.wild; if (nw.every((x) => x === nw[0])) return PAY3[nw[0]]; return a === b ? PAY2[a] : 0; };
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
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
    if (k === 'gunshop') tab = 'guns'; else if (k === 'shop' && tab === 'guns') tab = 'hats';   // the guns are sold at their own shop now
    if (k === 'roulette') { C.rou.bets = {}; H.rigs().rouletteBets({}); }
    H.entered(); if (['slots', 'roulette', 'blackjack', 'dice'].includes(k)) H.seat(k, a | 0); el.style.display = 'block'; render(); sound('S_UISelect', 0.7);
  }
  function close() { if (!open) return; open = false; el.style.display = 'none'; if (stage) stage.detach(); H.left(); }
  const head = (title, line) => `<div class="vp-head"><div class="tt"><h2>${title}</h2><p>${line}</p></div><div class="vp-purse">${coin()}<b>${fmt(Meta.gold())}</b></div><button class="vp-x">Done<kbd>E</kbd></button></div>`;
  function render() {
    let h = '';
    if (kind === 'shop' || kind === 'gunshop') h = renderShop();
    else if (kind === 'board') h = renderBoard();
    else h = renderCasino();
    const bar = ['slots', 'roulette', 'blackjack', 'dice'].includes(kind); el.classList.toggle('bar', bar);
    el.innerHTML = bar ? `<div class="vp-bar k-${kind}">${h}</div>` : `<div class="vp-card k-${kind}">${h}</div>`;
    el.querySelector('.vp-x').onclick = (e) => { e.stopPropagation(); close(); };
    if (kind === 'shop' || kind === 'gunshop') { wireShop(); if (H.cosThumbs) H.cosThumbs(el); } else if (kind === 'board') wireBoard(); else wireCasino();
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
    const gs = kind === 'gunshop', TABS = SHOP_TABS.filter((T) => (T.id === 'guns') === gs);
    let h = gs ? head('Flintwhistle’s Guns', 'Old Flintwhistle’s gunsmithy: the guns you start your runs with') : head('Bramble &amp; Bolt', 'Mossbottom’s counter: hats, clothes and trinkets');
    h += '<div class="vp-body"><div class="shop-left"><div class="shop-stage" id="sstage"></div><div class="shop-info" id="sinfo"></div></div><div style="flex:1;min-width:0;display:flex;flex-direction:column">';
    h += `<div class="vp-tabs">${TABS.map((T) => { const L = shopItems(T.id), n = L.filter((x) => x.state === 'owned').length; return `<div class="vp-tab ${T.id === tab ? 'on' : ''}" data-tab="${T.id}">${T.name}<i>${n}/${L.length}</i></div>`; }).join('')}</div><div class="vp-scroll"><div class="grid">`;
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
          const pic = H.cosPic && H.cosPic(slot);
          h += `<div class="it ${pic ? 'pic' : ''} ${x.state === 'locked' ? 'lock' : ''} ${sel ? 'sel' : ''}" data-key="${esc(k)}">${worn ? '<span class="star">WEARING</span>' : ''}${pic ? `<img class="lth" data-k="${esc(k)}" alt="">` : ''}<b>${esc(x.name)}</b>${x.state === 'owned' ? `<div class="ok">${x.price || x.I.need ? 'OWNED' : 'STARTER KIT'}</div>` : x.state === 'locked' ? `<div class="nd">${esc(needText(x.I))}</div>` : `<div class="pr ${Meta.gold() < x.price ? 'poor' : ''}">${coin('s')}${fmt(x.price)}</div>`}</div>`;
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
        if (!host || !ch || !open || (kind !== 'shop' && kind !== 'gunshop')) return;
        const w = Math.max(200, host.clientWidth | 0), h2 = Math.max(200, host.clientHeight | 0);
        P.R.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); P.R.setSize(w, h2, false); cam.aspect = w / h2; cam.updateProjectionMatrix();
        t += dt; ch.rotation.y = spin + Math.sin(t * 0.5) * 0.25; animateCharacter(ch, t, 0, { preview: true });
        zoom += (want - zoom) * Math.min(1, dt * 5);
        // the whole hat in view however tall it is: from the shoulders to the tip, with room round it
        const R = ch.userData.rig, top = (R.topY || 220) + 12, hy = R.headY || 130, z = Math.max(0, zoom), lo = Math.max(0, -zoom), span = top - (hy - 60);
        const ty = (top * 0.5) * (1 - z - lo) + ((hy - 60 + top) / 2) * z + 40 * lo, dist = Math.max(560, top * 3) * (1 - z - lo * 0.4) + Math.max(360, span * 3.1) * z;
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
  // ------------------------------------------------------------------ the casino: a bet bar along the bottom, the game itself on the table
  // in the world (H.rigs()), where anyone nearby can watch it; each play is told to the party (H.broadcast)
  const stakeRow = () => `<div class="cchips">${STAKES.map((v) => `<div class="cchip ${v === stake ? 'on' : ''} ${Meta.gold() < v ? 'off' : ''}" data-stake="${v}" style="background:${CHIP_COL[v]}">${v >= 1000 ? '1K' : v}</div>`).join('')}</div>`;
  const R3 = () => H.rigs();
  let seq = 0;
  const tell = (k, o) => { seq++; H.broadcast(Object.assign({ k, s: seq }, o)); };
  function renderCasino() {
    const T = { slots: ['Toadstool Slots', 'Line up the first two reels, or all three. The wild makes any three. Returns about 97 in 100.'], roulette: ['Pip’s Roulette', 'One zero. Click the layout to put chips down, then spin.'], blackjack: ['Dame Fennel’s Blackjack', '3 to 2 on a natural. The dealer stands on every 17.'], dice: ['Clatterby’s High-Low', 'Two dice make a roll from 1 to 100. Pick a line and a side.'] }[kind];
    let ctl = '';
    if (kind === 'slots') ctl = `<button class="vp-btn" id="spin">Spin  ${coin()} ${stake}</button><div class="paytab">${Object.keys(PAY3).reverse().slice(0, 4).map((k) => `<div class="sy">${SYM[k]}${SYM[k]}${SYM[k]}</div><b>×${PAY3[k]}</b>`).join('')}</div>`;
    else if (kind === 'roulette') { const R = C.rou, tot = Object.values(R.bets).reduce((a, b) => a + b, 0); ctl = `<div class="layout">${layoutHtml()}</div><div class="col"><button class="vp-btn" id="rspin" ${tot && !R.busy ? '' : 'disabled'}>Spin  ${coin()} ${fmt(tot)}</button><button class="vp-btn alt" id="rclear" ${tot && !R.busy ? '' : 'disabled'}>Clear</button><div class="hist">${R.hist.slice(0, 8).map((n) => `<span style="background:${n === 0 ? '#2a8a3a' : RED.has(n) ? '#b82a2a' : '#1a1a1a'}">${n}</span>`).join('')}</div></div>`; }
    else if (kind === 'blackjack') { const B = C.bj, live = B && !B.done; ctl = `<div class="totals">${B ? `<span>Dealer <b>${B.done ? total(B.dealer) : total([B.dealer[0]]) + ' +?'}</b></span><span>You <b>${total(B.you)}</b>${B.doubled ? ' <i>doubled</i>' : ''}</span>` : '<span>Place your stake and deal.</span>'}</div>${live ? `<button class="vp-btn" id="hit">Hit</button><button class="vp-btn alt" id="stand">Stand</button><button class="vp-btn blue" id="dbl" ${B.you.length === 2 && Meta.gold() >= B.bet ? '' : 'disabled'}>Double</button>` : `<button class="vp-btn" id="deal">Deal  ${coin()} ${stake}</button>`}`; }
    else { const D = C.dice, p = D.over ? (100 - D.target) / 100 : (D.target - 1) / 100, mult = p > 0 ? 0.98 / p : 0; ctl = `<div class="dctl"><input type="range" min="5" max="95" value="${D.target}" id="dtarget"><div class="seg"><button data-side="under" class="${D.over ? '' : 'on'}">Under ${D.target}</button><button data-side="over" class="${D.over ? 'on' : ''}">Over ${D.target}</button></div></div><div class="odds"><div>Chance<b>${Math.round(p * 100)}%</b></div><div>Pays<b>×${mult.toFixed(2)}</b></div></div><button class="vp-btn" id="droll2">Roll  ${coin()} ${stake}</button>`; }
    return `<div class="bar-head"><div class="tt"><h2>${T[0]}</h2><p>${T[1]}</p></div><div class="cmsg ${msgCls}">${esc(msg)}</div><div class="vp-purse">${coin()}<b>${fmt(Meta.gold())}</b></div><button class="vp-x">Leave<kbd>E</kbd></button></div><div class="bar-body"><div class="ctl">${ctl}</div><div class="stakes"><h4>Stake</h4>${stakeRow()}</div></div>`;
  }
  function wireCasino() {
    el.querySelectorAll('.cchip[data-stake]').forEach((c) => { c.onclick = (e) => { e.stopPropagation(); if (c.classList.contains('off')) return; stake = +c.dataset.stake; sound('S_Coin', 0.4); render(); }; });
    if (kind === 'slots') { const b = el.querySelector('#spin'); b.disabled = C.slot.busy || Meta.gold() < stake; b.onclick = (e) => { e.stopPropagation(); spinSlots(); }; }
    if (kind === 'roulette') {
      const R = C.rou;
      el.querySelectorAll('.layout [data-bet]').forEach((d) => { d.onclick = (e) => { e.stopPropagation(); if (R.busy) return; const tot = Object.values(R.bets).reduce((a, b) => a + b, 0); if (Meta.gold() < tot + stake) { say('Not enough gold for another chip', 'lose'); sound('S_Deny', 0.5); return; } R.bets[d.dataset.bet] = (R.bets[d.dataset.bet] || 0) + stake; sound('S_Coin', 0.5); msg = ''; R3().rouletteBets(R.bets); tell('rou', { b: R.bets }); render(); }; });
      const sp = el.querySelector('#rspin'); if (sp) sp.onclick = (e) => { e.stopPropagation(); spinRoulette(); };
      const cl = el.querySelector('#rclear'); if (cl) cl.onclick = (e) => { e.stopPropagation(); if (!R.busy) { R.bets = {}; R3().rouletteBets({}); tell('rou', { b: {} }); render(); } };
    }
    if (kind === 'blackjack') { const on = (id, fn) => { const b = el.querySelector(id); if (b) b.onclick = (e) => { e.stopPropagation(); fn(); }; }; on('#deal', bjDeal); on('#hit', bjHit); on('#stand', bjStand); on('#dbl', bjDouble); const d = el.querySelector('#deal'); if (d) d.disabled = Meta.gold() < stake; }
    if (kind === 'dice') {
      const D = C.dice, r = el.querySelector('#dtarget');
      r.oninput = (e) => { e.stopPropagation(); D.target = +r.value; render(); el.querySelector('#dtarget').focus(); };
      r.addEventListener('keydown', (e) => e.stopPropagation());
      el.querySelectorAll('.seg button').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); D.over = b.dataset.side === 'over'; render(); }; });
      const b = el.querySelector('#droll2'); b.disabled = D.busy || Meta.gold() < stake; b.onclick = (e) => { e.stopPropagation(); rollDice(); };
    }
  }
  // -- slots: the reels turn in the machine's window
  function spinSlots() {
    const S = C.slot, i = arg | 0; if (S.busy) return;
    if (!Meta.stake(stake)) { say('Not enough gold', 'lose'); sound('S_Deny', 0.6); return; }
    S.busy = true; purse(); say(''); sound('S_Coin', 0.7); render();
    const out = [spinReel(), spinReel(), spinReel()], bet = stake, m = slotPay(...out), win = Math.floor(bet * m);
    tell('slot', { i, r: out, w: win });
    for (let k = 0; k < 3; k++) setTimeout(() => sound('S_UISelect', 0.5), 2100 * (0.55 + k * 0.22) * 1000 / 1000);
    R3().spinSlots(i, out).then(() => {
      S.busy = false;
      if (win > 0) { Meta.payout(win); Meta.bump('casinoWon', win); sound(m >= 40 ? 'S_Jackpot' : 'S_Cash', 0.9); msg = m >= 40 ? `Jackpot!  +${fmt(win)}` : `Win  +${fmt(win)}`; msgCls = 'win'; } else { msg = 'No luck. Again?'; msgCls = 'lose'; }
      R3().say('slot' + i, win ? `${H.me()}  +${fmt(win)}` : `${H.me()}: no luck`, win ? '#ffe9a0' : '#d8ccb8');
      Meta.bump('casinoPlays'); if (open && kind === 'slots') render();
    });
  }
  // -- roulette: the chips go down on the layout, Pip spins the wheel
  function layoutHtml() {
    const B = C.rou.bets, cell = (key, cls, label, extra = '') => `<div class="${cls} ${B[key] ? 'bet' : ''} ${C.rou.hit === key ? 'hit' : ''}" data-bet="${key}" ${B[key] ? `data-b="${B[key]}"` : ''} ${extra}>${label}</div>`;
    let h = cell('n0', 'z', '0', 'style="grid-column:1;grid-row:1 / 4"');
    for (let c = 0; c < 12; c++) for (let r = 0; r < 3; r++) { const n = c * 3 + (3 - r); h += cell('n' + n, RED.has(n) ? 'r' : 'k', n, `style="grid-column:${c + 2};grid-row:${r + 1}"`); }
    [['d1', '1st 12'], ['d2', '2nd 12'], ['d3', '3rd 12']].forEach(([k, t], i) => { h += cell(k, 'o', t, `style="grid-column:${2 + i * 4} / span 4;grid-row:4"`); });
    [['lo', '1-18'], ['ev', 'Even'], ['red', 'Red'], ['blk', 'Black'], ['od', 'Odd'], ['hi', '19-36']].forEach(([k, t], i) => { h += cell(k, k === 'red' ? 'r' : k === 'blk' ? 'k' : 'o', t, `style="grid-column:${2 + i * 2} / span 2;grid-row:5"`); });
    return h;
  }
  const rouletteWins = (key, n) => {
    if (key[0] === 'n') return +key.slice(1) === n ? 36 : 0;
    if (n === 0) return 0;
    switch (key) { case 'd1': return n <= 12 ? 3 : 0; case 'd2': return n > 12 && n <= 24 ? 3 : 0; case 'd3': return n > 24 ? 3 : 0; case 'lo': return n <= 18 ? 2 : 0; case 'hi': return n > 18 ? 2 : 0; case 'ev': return n % 2 === 0 ? 2 : 0; case 'od': return n % 2 ? 2 : 0; case 'red': return RED.has(n) ? 2 : 0; case 'blk': return RED.has(n) ? 0 : 2; default: return 0; }
  };
  function spinRoulette() {
    const R = C.rou; if (R.busy) return; const tot = Object.values(R.bets).reduce((a, b) => a + b, 0); if (!tot) return;
    if (!Meta.stake(tot)) { say('Not enough gold', 'lose'); sound('S_Deny', 0.6); return; }
    R.busy = true; R.hit = null; purse(); msg = 'No more bets...'; msgCls = ''; sound('S_Coin', 0.7); render();
    const n = WHEEL[Math.floor(Math.random() * WHEEL.length)]; let win = 0; for (const [k2, v] of Object.entries(R.bets)) win += v * rouletteWins(k2, n);
    tell('rou', { b: R.bets, n, w: win });
    R3().spinRoulette(n).then(() => {
      R.busy = false; R.hist.unshift(n); R.hist = R.hist.slice(0, 12); R.hit = 'n' + n;
      if (win) { Meta.payout(win); Meta.bump('casinoWon', win); sound(win >= tot * 10 ? 'S_Jackpot' : 'S_Cash', 0.9); }
      Meta.bump('casinoPlays');
      msg = `${n} ${n === 0 ? 'green' : RED.has(n) ? 'red' : 'black'}  -  ${win ? `win +${fmt(win)}` : 'the house takes it'}`; msgCls = win ? 'win' : 'lose';
      R3().say('rou', `${H.me()}: ${n}  ${win ? '+' + fmt(win) : ''}`, win ? '#ffe9a0' : '#d8ccb8');
      if (Meta.gold() < tot) { R.bets = {}; R3().rouletteBets({}); }   // the same bets stay down for another spin, if you can cover them
      if (open && kind === 'roulette') render();
    });
  }
  // -- blackjack: real cards on Dame Fennel's felt
  const draw = () => ({ r: Math.floor(Math.random() * 13), s: Math.floor(Math.random() * 4) });
  const total = (h) => { let t = 0, a = 0; for (const c of h) { const v = c.r === 0 ? 11 : Math.min(10, c.r + 1); t += v; if (c.r === 0) a++; } while (t > 21 && a) { t -= 10; a--; } return t; };
  const showBJ = () => { const B = C.bj; R3().blackjackHands(B.dealer, B.you, !B.done); tell('bj', { d: B.dealer.map((c) => [c.r, c.s]), y: B.you.map((c) => [c.r, c.s]), h: B.done ? 0 : 1 }); };
  function bjDeal() {
    if (C.bj && !C.bj.done) return;
    if (!Meta.stake(stake)) { say('Not enough gold', 'lose'); sound('S_Deny', 0.6); return; }
    C.bj = { bet: stake, you: [draw(), draw()], dealer: [draw(), draw()], done: false, doubled: false }; msg = ''; sound('S_Coin', 0.6);
    const B = C.bj, yb = total(B.you) === 21, db = total(B.dealer) === 21;
    if (yb || db) return bjSettle(yb && db ? 'push' : yb ? 'bj' : 'lose');
    showBJ(); render();
  }
  function bjHit() { const B = C.bj; if (!B || B.done) return; B.you.push(draw()); sound('S_UISelect', 0.5); if (total(B.you) > 21) return bjSettle('bust'); if (total(B.you) === 21) return bjStand(); showBJ(); render(); }
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
    msg = { bj: `Blackjack!  +${fmt(pay)}`, win: `You win  +${fmt(pay)}`, push: 'A tie: stake back', lose: total(B.dealer) > 21 ? 'Dealer busts... and so do you' : 'Dealer wins', bust: 'Bust' }[r]; msgCls = pay > B.bet ? 'win' : pay ? '' : 'lose';
    sound(r === 'bj' ? 'S_Jackpot' : pay > B.bet ? 'S_Cash' : pay ? 'S_Coin' : 'S_Deny', 0.8); showBJ();
    R3().say('bj', `${H.me()}: ${msg}`, pay > B.bet ? '#ffe9a0' : '#d8ccb8'); render();
  }
  // -- dice: two dice thrown across Clatterby's table, the tens and the ones
  function rollDice() {
    const D = C.dice; if (D.busy) return;
    const p = D.over ? (100 - D.target) / 100 : (D.target - 1) / 100, mult = 0.98 / p, bet = stake;
    if (!Meta.stake(bet)) { say('Not enough gold', 'lose'); sound('S_Deny', 0.6); return; }
    D.busy = true; purse(); msg = ''; sound('S_Coin', 0.6); render();
    const n = 1 + Math.floor(Math.random() * 100), won = D.over ? n > D.target : n < D.target, win = won ? Math.floor(bet * mult) : 0;
    tell('dice', { n, t: D.target, o: D.over ? 1 : 0, w: win });
    R3().rollDice(n, D.target, D.over).then(() => {
      D.busy = false; D.last = n;
      if (win) { Meta.payout(win); Meta.bump('casinoWon', win); sound(mult >= 5 ? 'S_Jackpot' : 'S_Cash', 0.85); } else sound('S_UISelect', 0.4);
      Meta.bump('casinoPlays');
      msg = won ? `${n}  -  win +${fmt(win)}` : `${n}  -  no good`; msgCls = won ? 'win' : 'lose';
      R3().say('dice', `${H.me()}: ${n} ${won ? '+' + fmt(win) : ''}`, won ? '#ffe9a0' : '#d8ccb8');
      if (open && kind === 'dice') render();
    });
  }
  function tick(dt) {
    if (!open) return;
    if (stage) stage.tick(dt);
  }
  // E or Esc closes whatever window is up (the slider and the name fields keep their own keys)
  addEventListener('keydown', (e) => { if (!open) return; if (e.code === 'Escape' || e.code === 'KeyE') { e.preventDefault(); e.stopPropagation(); close(); } }, true);
  el.addEventListener('click', (e) => e.stopPropagation());
  return { show, close, tick, isOpen: () => open, kind: () => kind, refresh: () => { if (open) render(); } };
}
