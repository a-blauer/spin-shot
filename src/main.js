// Boot: fonts, atlases, audio, world build, input (pointer lock + keyboard), fixed-ish game loop.
import { CLASSES, rollBuff, rollGunMod } from './classes.js';
import { MELEE, rollMelee } from './melee.js';
import { MUTATORS, setMutators, mutators, mutXp, DIFFS, RARITY_HEX, difficulty, setDifficulty, zombieCount, maxAlive, zombieHealth } from './data.js';
import { preloadGunSounds } from './gunsound.js';
import { buildCharacter, animateCharacter } from './character.js';
import { COSMETICS, SLOTS, SLOT_NAMES, needText, PAGES, SHAPES, bodyStatLines, DEFAULT_SHAPE, FACE_PRESETS, parseLook } from './cosmetics.js';
import { Net } from './net.js';
import { makeVillageUI } from './village_ui.js';
import { makeCraft } from './craft.js';
import * as THREE from 'three';
import { loadAtlas, loadCreaturePack, Atlas } from './render.js';
import { MAPS } from './maps.js';
import { setParts } from './puppet.js';
import { Audio } from './audio.js';
import { Hud } from './hud.js';
import { Game } from './game.js';
import { MACHINES, machine, ASC, ROMAN, temperOf, attuneOf } from './deeds.js';
import { CORE0 as CORE_0, CORE_DEFS as CORE_LIST, coreSvg } from './cores.js';
import { Meta, STARTERS, ACHIEVEMENTS, GROUPS, SKINS, GUN_LEVELS, GUN_TRAITS, RANKS, rankXp, WORLD, MEDALS, MEDAL_HEX, HEIRLOOM_ROUND, CLASS_META, CLASS_LEVELS, CLASS_LEVEL_NAMES, shopGuns } from './meta.js';

THREE.ColorManagement.enabled = false;
const params = new URLSearchParams(location.search);
const TEST = params.has('test');
const URLMAP = params.has('map') ? +params.get('map') : -1;   // ?map=1 builds that map straight away (tests)
Meta.load(); Meta.setUnlockAll(TEST);
if (TEST) import('./signatures.js').then((m) => { window.__sig = m; });
if (TEST) window.__meta = { Meta, RANKS, ACHIEVEMENTS, CLASS_META, WORLD, SKINS, STARTERS, MELEE, rollBuff, rollGunMod, rollMelee, rankXp };

const glCanvas = document.getElementById('gl');
const hudCanvas = document.getElementById('hud');
const title = document.getElementById('title');
const loading = document.getElementById('loading');
const status = (t) => { if (loading) loading.textContent = t; };

const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, TEST ? 1 : 1.5));
const hud = new Hud(hudCanvas);
const audio = new Audio('audio/');
let game = null;
let mode = 'title';
let lockFailed = false;
let lockFails = 0, lockRetry = 0;
function requestLock() {
  if (TEST || lockFailed || ('ontouchstart' in window && matchMedia('(pointer: coarse)').matches)) return;
  if (!glCanvas.requestPointerLock) { lockFailed = true; return; }
  if (document.pointerLockElement) return;
  // Browsers refuse a new lock for about a second after Esc releases one. A refusal is never treated as permanent:
  // try again shortly, and any click in the game grabs the mouse too. Only give up if it never works at all.
  const again = () => { lockFails++; if (lockFails >= 8) { lockFailed = true; hud.toast('Mouse lock unavailable here - open the page in its own tab for best aim', '#ffcd5a'); return; } clearTimeout(lockRetry); lockRetry = setTimeout(() => { if (mode === 'play' && !document.pointerLockElement) requestLock(); }, 1300); };
  try {
    const p = glCanvas.requestPointerLock({ unadjustedMovement: true });
    if (p && p.catch) p.catch(() => { try { const q = glCanvas.requestPointerLock(); if (q && q.catch) q.catch(again); } catch (e) { again(); } });
  } catch (e) { again(); }
}
document.addEventListener('pointerlockchange', () => { if (document.pointerLockElement) lockFails = 0; });

// ------------------------------------------------------------------ input
const keys = new Set();
const edges = { grenade: 0, jump: 0, slide: 0, slideUp: 0, dash: 0, grapple: 0, reload: 0, interact: 0, barricade: 0, melee: 0, wield: 0, back: 0, next: 0, prev: 0, firePressed: 0, ping: 0, choice: [0, 0, 0, 0] };
let mouseL = false, mouseR = false, lookX = 0, lookY = 0;
let settings = {};
try { settings = JSON.parse(localStorage.getItem('dmh-settings') || '{}') || {}; } catch (e) { settings = {}; }
const sens = () => settings.sens || 0.11;
const BIND = {
  KeyW: 'fwd', ArrowUp: 'fwd', KeyS: 'back_', ArrowDown: 'back_', KeyA: 'left', KeyD: 'right',   // the left and right arrows work the radio
};
function onKey(e, down) {
  const c = e.code;
  // Ctrl is slide and R is reload, so Ctrl+R comes up in play all the time: during a run it must not reload the page.
  // (On the title screen it still does, and F5 always does.)
  const inRun = mode === 'play' || mode === 'paused';
  if (['Tab', 'Space', 'ControlLeft', 'KeyC', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F3', 'Slash', 'Quote'].includes(c) || ((e.ctrlKey || e.metaKey) && (c !== 'KeyR' || inRun))) e.preventDefault();
  if (down) {
    if (e.repeat) return;
    keys.add(c);
    switch (c) {
      case 'Space': edges.jump = 1; break;
      case 'ArrowRight': if (mode === 'play') audio.radio.press(true); break;    // radio: next song
      case 'ArrowLeft': if (mode === 'play') audio.radio.press(false); break;    // radio: this song again from the top
      case 'KeyC': case 'ControlLeft': edges.slide = 1; break;
      case 'ShiftLeft': case 'ShiftRight': edges.dash = 1; break;
      case 'KeyF': edges.grapple = 1; break;
      case 'KeyR': edges.reload = 1; break;
      case 'KeyE': edges.interact = 1; break;
      case 'KeyG': edges.ping = 1; break;
      case 'KeyB': edges.barricade = 1; break;
      case 'KeyQ': edges.melee = 1; break;
      case 'KeyX': edges.wield = 1; break;
      case 'KeyV': edges.grenade = 1; break;
      case 'Tab': edges.back = 1; break;
      case 'Digit1': edges.choice[0] = 1; break;
      case 'Digit2': edges.choice[1] = 1; break;
      case 'Digit3': edges.choice[2] = 1; break;
      case 'Digit4': edges.choice[3] = 1; break;
      case 'Slash': case 'KeyH': if (game && game.player.menu) game.player.menuHelp = !game.player.menuHelp; break;
      case 'Enter': if (game && game.victory) { game.victory = false; if (game.levelDone) restartRun(true); break; } if (game && game.player.dead && !game.coopDown && game.time - (game.deathTime || 0) > 1) restartRun(); break;
      case 'F3': hud.showFps = !hud.showFps; break;
      case 'BracketLeft': settings.sens = Math.max(0.02, sens() - 0.01); hud.toast(`Mouse sensitivity ${settings.sens.toFixed(2)}`); saveSettings(); break;
      case 'BracketRight': settings.sens = Math.min(0.5, sens() + 0.01); hud.toast(`Mouse sensitivity ${settings.sens.toFixed(2)}`); saveSettings(); break;
      default: break;
    }
  } else {
    keys.delete(c);
    if (c === 'KeyC' || c === 'ControlLeft') edges.slideUp = 1;
  }
}
function saveSettings() { try { localStorage.setItem('dmh-settings', JSON.stringify(settings)); } catch (e) { /* storage unavailable */ } }
addEventListener('keydown', (e) => onKey(e, true));
// a second net for anything that still tries to leave mid-run (a browser that will not let the page stop Ctrl+R, a closed tab)
addEventListener('beforeunload', (e) => { if (!TEST && game && (mode === 'play' || mode === 'paused') && game.round > 0 && !game.player.dead && !game.victory) { e.preventDefault(); e.returnValue = ''; } });
addEventListener('keyup', (e) => onKey(e, false));
addEventListener('blur', () => { keys.clear(); mouseL = mouseR = false; });
glCanvas.addEventListener('contextmenu', (e) => e.preventDefault());
hudCanvas.addEventListener('contextmenu', (e) => e.preventDefault());
addEventListener('mousedown', (e) => {
  if (mode !== 'play') return;
  if (!TEST && !TOUCH && !lockFailed && !document.pointerLockElement) { requestLock(); return; }   // this click takes the mouse back; it does not fire
  if (e.button === 0) { mouseL = true; edges.firePressed = 1; }
  if (e.button === 2) mouseR = true;
  if (e.button === 1) { edges.ping = 1; e.preventDefault(); }
});
addEventListener('mouseup', (e) => { if (e.button === 0) mouseL = false; if (e.button === 2) mouseR = false; });
addEventListener('mousemove', (e) => {
  if (mode !== 'play' || TOUCH || (!document.pointerLockElement && !TEST && !lockFailed)) return;
  lookX += e.movementX || 0; lookY += e.movementY || 0;
});
addEventListener('wheel', (e) => { if (mode !== 'play') return; if (e.ctrlKey || e.metaKey) e.preventDefault();   // sliding (Ctrl) while switching guns must not zoom the page
  if (e.deltaY > 0) edges.next = 1; else if (e.deltaY < 0) edges.prev = 1; }, { passive: false });

function readInput() {
  const In = {
    fwd: Math.max(-1, Math.min(1, (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) + stick.y)),
    right: Math.max(-1, Math.min(1, (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0) + stick.x)),
    sprint: false,
    slideHeld: keys.has('KeyC') || keys.has('ControlLeft'), jumpHeld: keys.has('Space') || touchJump,
    fire: mouseL || touchFire, aim: mouseR || touchAim,
    lookX: lookX * sens(), lookY: lookY * sens(),
    jump: edges.jump, slide: edges.slide, slideUp: edges.slideUp, dash: edges.dash, grapple: edges.grapple, reload: edges.reload,
    useHeld: keys.has('KeyE'), ping: edges.ping,
    interact: edges.interact, barricade: edges.barricade, melee: edges.melee, wield: edges.wield, grenade: edges.grenade, back: edges.back, next: edges.next, prev: edges.prev, firePressed: edges.firePressed, choice: edges.choice.slice(),
  };
  if (window.__dmhInput) Object.assign(In, window.__dmhInput(In) || {});
  lookX = lookY = 0;
  for (const k of Object.keys(edges)) if (k !== 'choice') edges[k] = 0;
  edges.choice = [0, 0, 0, 0];
  return In;
}

// ------------------------------------------------------------------ boot
async function boot() {
  status('Loading fonts...');
  try { await Promise.all([document.fonts.load('40px "Big Shoulders Display"'), document.fonts.load('600 20px "Barlow Condensed"'), document.fonts.load('700 20px "Barlow Condensed"')]); } catch (e) { /* fallback fonts */ }
  status('Shuffling the deck...');
  await loadAtlas('');
  setParts(await (await fetch('parts.json')).json());
  const img = new Image(); img.src = Atlas.blobUrl.fx; await img.decode().catch(() => {});
  hud.setAtlas(img, Atlas.meta);
  const DESCENT_MAP = Math.max(0, MAPS.findIndex((M) => M.mode === 'descent')), map0 = MAPS[URLMAP >= 0 ? URLMAP : Meta.map()] ? (URLMAP >= 0 ? URLMAP : Meta.map()) : DESCENT_MAP;
  status(MAPS[map0].loading);
  await loadCreaturePack(MAPS[map0].pack);
  await new Promise((r) => setTimeout(r, 20));
  game = new Game(renderer, audio, hud, map0);
  game.settings = Object.assign(game.settings, settings);
  await game.build();
  window.__dmh = game;
  window.__diffTest = { setDifficulty, zombieCount, maxAlive, zombieHealth };
  window.__roll = (r, st, c) => import('./classes.js').then((k) => k.rollBuff(r, st, c));
  window.__gs1 = (n) => import('./gunsound.js').then((m) => m.gunSound(game.audio, n, 1, false));
  status('');
  document.body.classList.add('ready'); progBadge();
  resize();
  if (TEST) start();
}
function start() {
  audio.unlock();
  preloadGunSounds(audio);
  audio.preload(['S_ShellDrop', 'S_HullDrop', 'S_ShellIn', 'S_Rack', 'S_HitFlesh', 'S_HitFlesh2', 'S_HitMarker', 'S_Kill', 'S_Step0', 'S_Step1', 'S_Step2', 'S_Step3', 'S_Jump', 'S_Land', 'S_Groan0', 'S_Groan1', 'S_EnemyDie', 'S_Coin', 'S_Explosion', 'S_RoundStart', 'S_Swing', 'S_SwingBig', 'S_Blade', 'S_Blunt', 'S_Zap', 'S_Part', 'S_Gib', 'S_Hurt', 'S_Enter', 'S_Clear']);
  title.style.display = 'none';
  mode = 'play'; applySettings();
  if (TOUCH) { document.getElementById('touch').style.display = 'block'; lockFailed = true; }
  if (game) game.vm.hidden = false;
  if (settings.fullscreen && !fsOn() && !TEST) setFullscreen(true, true);   // the player chose fullscreen: go back to it with each run
  requestLock();
}
// ---- progress screen (achievements, gun levels, cosmetics) on the title card
const prog = document.getElementById('progress');
// ---- small pictures for rewards: buff icons cut from the icon sheet, guns and blades rendered from their models
const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const iconCache = new Map();
function iconURL(name) {
  if (iconCache.has(name)) return iconCache.get(name);
  let url = '';
  try {
    const I = hud.icons, m = I && I.meta[name];
    if (m) { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const W = I.img.width, H = I.img.height; cv.getContext('2d').drawImage(I.img, m.u0 * W, m.v0 * H, (m.u1 - m.u0) * W, (m.v1 - m.v0) * H, 0, 0, 128, 128); url = cv.toDataURL('image/png'); }
  } catch (e) { url = ''; }
  iconCache.set(name, url); return url;
}
let thR = null, thVM = null;
function modelThumb(kind, name) {
  const key = kind + ':' + name; if (iconCache.has(key)) return iconCache.get(key);
  let url = '';
  try {
    const TW = 420, TH = 230;
    if (!thR) { thR = new THREE.WebGLRenderer({ canvas: document.createElement('canvas'), antialias: true, alpha: true, preserveDrawingBuffer: true }); thR.setPixelRatio(1); thR.setSize(TW, TH, false); thR.setClearColor(0x000000, 0); }
    const sc = new THREE.Scene(), box = new THREE.Box3(); let obj;
    if (kind === 'gun') {
      const def = game.data.weapons.findIndex((w) => w.name === name); if (def < 0) throw new Error('no gun');
      obj = game.vm.constructor.displayModel(game, def, 0);      // the wall-buy display piece: the gun alone, no hands
    } else {
      const W = MELEE.find((m) => m.name === name); if (!W) throw new Error('no blade');
      if (!thVM) thVM = new game.vm.constructor(game);
      thVM.meleeBuild(W); obj = thVM.mtool.children[0]; obj.removeFromParent(); obj.position.set(0, 0, 0); obj.rotation.set(-Math.PI / 2, 0, 0);   // the weapon without the fists, laid on its side
    }
    sc.add(obj); obj.updateMatrixWorld(true); box.setFromObject(obj);
    const ctr = box.getCenter(new THREE.Vector3()), dir = (kind === 'gun' ? new THREE.Vector3(1, 0.22, 0.38) : new THREE.Vector3(1, 0.15, 0.3)).normalize();
    const far = box.getSize(new THREE.Vector3()).length() + 20, cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, far * 2); cam.position.copy(ctr).addScaledVector(dir, far); cam.up.set(0, 1, 0); cam.lookAt(ctr); cam.updateMatrixWorld(true);
    // fit the box: its corners measured along the camera's right and up
    const R = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), U = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1); let hw = 1, hh = 1;
    for (let i = 0; i < 8; i++) { const p = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).sub(ctr); hw = Math.max(hw, Math.abs(p.dot(R))); hh = Math.max(hh, Math.abs(p.dot(U))); }
    const k = Math.max(hw / (TW / TH), hh) * 1.12; cam.left = -k * TW / TH; cam.right = k * TW / TH; cam.top = k; cam.bottom = -k; cam.updateProjectionMatrix();
    thR.render(sc, cam); url = thR.domElement.toDataURL('image/png');
  } catch (e) { url = ''; }
  iconCache.set(key, url); return url;
}
const hexOf = (n) => '#' + n.toString(16).padStart(6, '0');
const kindOf = (name) => { const u = game && game.data.upgrades.find((x) => x.name === name); return u ? (u.gun ? 'workbench modifier' : u.cls ? 'class buff' : 'buff') : 'buff'; };
// a reward, spelled out: what it is as well as what it is called
function rewardLine(R) {
  const out = [];
  if (R.starter) out.push(`${R.starter} as a starting gun`);
  if (R.machine) out.push(`${(MACHINES.find((m) => m.id === R.machine) || {}).name} (machine)`);
  (R.parts || []).forEach((u) => out.push(`${u} (part)`));
  (R.guns || []).forEach((g) => out.push(`${g} (gun)`));
  (R.blades || []).forEach((b2) => out.push(`${b2} (blade)`));
  (R.upgrades || []).forEach((u) => out.push(`${u} (${kindOf(u)})`));
  if (R.heirloom) out.push(`${R.heirloom} (heirloom)`);
  if (R.cos) for (const c of R.cos) { const [sl, id] = c.split(':'), I = (COSMETICS[sl] || []).find((i) => i.id === id); if (I) out.push(`${I.name} (${(SLOT_NAMES[sl] || sl).toLowerCase()})`); }
  if (R.renown) out.push(`+${R.renown.toLocaleString()} (renown)`);
  return out.join(', ');
}
// what a claimed reward puts on the popup: one card per thing, with a picture
function rewardCards(M) {
  const R = M.reward, out = [], ups = game.data.upgrades, guns = game.data.weapons;
  const gun = (name, starter) => { const W = guns.find((w) => w.name === name) || {}; out.push({ img: modelThumb('gun', name), wide: true, name, col: RARITY_HEX[W.rarity] || '#f2e8d5', kind: starter ? 'Starting gun' : `${W.rarity || ''} ${(W.cls || 'gun').toLowerCase()}`, desc: (W.desc || '') + (starter ? ' Pick it as your starting gun in the lobby.' : ' Now in the weapon pool: the mystery box can roll it.') }); };
  if (R.starter) gun(R.starter, true);
  if (R.machine) { const D = MACHINES.find((m) => m.id === R.machine) || {}; out.push({ name: D.name, col: '#9affc0', kind: 'Machine', desc: D.text }); }
  (R.guns || []).forEach((g) => gun(g, false));
  (R.parts || []).forEach((n) => { const U = ups.find((x) => x.core && x.name === n) || {}; out.push({ img: 'data:image/svg+xml;utf8,' + encodeURIComponent(coreSvg(U, U.hex || '#fff').replace('style="', 'style="background:#14100e;')), name: n, col: U.hex || '#f2e8d5', kind: `${U.rarity || ''} ${U.kind === 'me' ? 'body part' : 'gun part'}`, desc: U.desc || '' }); });
  (R.blades || []).forEach((n) => { const W = MELEE.find((m) => m.name === n) || {}; out.push({ img: modelThumb('blade', n), wide: true, name: n, col: RARITY_HEX[W.rarity] || '#f2e8d5', kind: `${W.rarity || ''} blade`, desc: (W.desc || '') + ' Now in the mystery box.' }); });
  (R.upgrades || []).forEach((n) => { const i = ups.findIndex((u) => u.name === n), U = ups[i] || {}, k = kindOf(n); out.push({ img: iconURL('U_' + i), name: n, col: RARITY_HEX[U.rarity] || '#f2e8d5', kind: `${U.rarity || ''} ${k}`, desc: (U.desc || '') + (k === 'workbench modifier' ? ' Now turns up at the workbench.' : ' Now turns up in chests.') }); });
  if (R.heirloom) { const i = ups.findIndex((u) => u.name === R.heirloom), U = ups[i] || {}; out.push({ img: iconURL('U_' + i), name: R.heirloom, col: '#ffcd5a', kind: 'Heirloom', desc: (U.desc || '') + ' Pick it in the lobby to start every run with it.' }); }
  if (R.cos) for (const c of R.cos) { const [sl, id] = c.split(':'), I = (COSMETICS[sl] || []).find((i) => i.id === id); if (I) out.push({ sw: [I.a, I.b, I.c].filter((x) => x !== undefined), name: I.name, col: '#ffcd5a', kind: SLOT_NAMES[sl] || sl, desc: 'New for your character. Wear it from the character screen.' }); }
  if (R.renown) out.push({ name: `+${R.renown.toLocaleString()} renown`, col: '#ffcd5a', kind: 'Renown', desc: 'Added to your rank right away.' });
  return out;
}
const claimEl = document.createElement('div'); claimEl.id = 'claim'; document.body.appendChild(claimEl);
claimEl.addEventListener('click', (e) => e.stopPropagation());
function showClaim(list) {
  if (!list.length) return;
  const card = (C, from) => {
    let s = `<div class="citem${C.wide ? ' wide' : ''}" style="border-color:${C.col}">`;
    s += C.sw ? `<div class="cimg csw">${C.sw.map((x) => `<i style="background:${hexOf(x)}"></i>`).join('')}</div>` : C.img ? `<div class="cimg"><img src="${C.img}" alt=""></div>` : '';
    return s + `<div class="ctxt"><b style="color:${C.col}">${esc(C.name)}</b><em>${esc(C.kind)}${from ? `  -  ${esc(from)}` : ''}</em><p>${esc(C.desc)}</p>${C.skin ? `<button class="cequip" data-skin="${C.skin}">EQUIP NOW</button>` : ''}</div></div>`;
  };
  let h;
  if (list.length === 1) {
    const M = list[0];
    h = `<div class="cbox"><div class="ck">REWARD CLAIMED</div><h3>${esc(M.title.toUpperCase())}</h3><div class="chow">${esc(M.how && M.how !== M.title ? M.how : 'Rank reached')}</div><div class="citems">${rewardCards(M).map((C) => card(C)).join('')}</div>`;
  } else {
    // several at once: one list of everything, each card saying where it came from
    h = `<div class="cbox many"><div class="ck">REWARDS CLAIMED</div><h3>${list.length} REWARDS</h3><div class="chow">Everything below is now yours.</div><div class="citems">${list.map((M) => rewardCards(M).map((C) => card(C, M.title)).join('')).join('')}</div>`;
  }
  h += '<button id="cok">CONTINUE</button></div>';
  claimEl.innerHTML = h; claimEl.style.display = 'flex'; claimEl.scrollTop = 0;
  audio.play('S_LevelUp', 0.7);
  claimEl.querySelector('#cok').onclick = () => { claimEl.style.display = 'none'; };
  claimEl.querySelectorAll('.cequip').forEach((el) => { el.onclick = () => { Meta.setSkin(el.dataset.skin); if (game) game.vm.setWeapon(game.vm.weaponDef, game.vm.weaponTier, false); el.textContent = 'EQUIPPED'; el.disabled = true; renderProgress(); }; });
}
// the count on the title's PROGRESS button
function progBadge() {
  const n = Meta.claimable().length, b = document.getElementById('progbtn'); if (b) b.innerHTML = n ? `PROGRESS<i class="badge">${n}</i>` : 'PROGRESS';
  // the title card's footer: where you stand, at a glance
  let f = document.querySelector('#title .tfoot'); const T = document.getElementById('title');
  if (!f && T) { f = document.createElement('div'); f.className = 'tfoot'; T.appendChild(f); }
  if (f) { const I = Meta.rankInfo(); f.innerHTML = `<b>RANK ${I.rank}  ${esc(I.name.toUpperCase())}</b>${I.max ? 'top rank' : `${I.into.toLocaleString()} / ${I.span.toLocaleString()} renown to the next`}`; }
}

// ---- the Progress screen: a rank banner, anything waiting to be claimed, then one tab at a time
const PTABS = [['renown', 'RENOWN'], ['maps', 'MAPS'], ['classes', 'CLASSES'], ['challenges', 'CHALLENGES'], ['arsenal', 'ARSENAL'], ['record', 'RECORD']];
let progTab = 'renown';
const MAP_CLEAR = (m) => ACHIEVEMENTS.find((x) => x.stat === 'clear_' + m.id);
const tabOf = (key) => (key[0] === 'r' ? 'renown' : key[0] === 'c' ? 'classes' : key[0] === 'h' ? 'maps' : ACHIEVEMENTS.some((A) => 'a:' + A.id === key && /^clear_/.test(A.stat)) ? 'maps' : 'challenges');
let progArm = false;
const rewardTags = (line) => String(line || '').split(/,\s+/).filter(Boolean).map((t) => { const m = /^(.*?)\s*\(([a-z ]+)\)$/i.exec(t); return m ? `<s class="tg k-${m[2].split(' ')[0].toLowerCase()}">${esc(m[1])}<i>${esc(m[2])}</i></s>` : `<s class="tg">${esc(t)}</s>`; }).join('');
function renderProgress() {
  const weapons = game ? game.data.weapons : [];
  const bar = (v, n) => `<div class="bar"><i style="width:${Math.max(0, Math.min(1, n > 0 ? v / n : 1)) * 100}%"></i></div>`;
  // one reward: what it is, and whether it is locked, waiting or claimed
  const rw = (key, lead) => {
    const M = Meta.milestone(key); if (!M) return ''; const st = Meta.stateOf(key);
    return `<div class="prw ${st}"><span>${lead ? `<u>${esc(lead)}</u> ` : ''}${rewardTags(rewardLine(M.reward))}</span>${st === 'ready' ? `<button class="pclaim" data-claim="${esc(key)}">CLAIM</button>` : st === 'claimed' ? '<em>\u2713 Claimed</em>' : ''}</div>`;
  };
  const I = Meta.rankInfo(), ready = Meta.claimable(), per = {}; for (const M of ready) per[tabOf(M.key)] = (per[tabOf(M.key)] || 0) + 1;
  let h = `<div class="ph"><h2>PROGRESS</h2><span style="flex:1"></span><button id="preset" style="margin-right:10px;background:#2a1820;color:#ff9a8a;border:1px solid #ff9a8a;box-shadow:none">${progArm ? 'PRESS AGAIN: THIS ERASES EVERYTHING' : 'RESET PROGRESS'}</button><button id="pclose">CLOSE</button></div>`;
  h += `<div class="renown"><div class="rk"><b>RANK ${I.rank}  -  ${esc(I.name.toUpperCase())}</b><span>${I.max ? `${I.xp.toLocaleString()} renown  -  top rank` : `${I.into.toLocaleString()} / ${I.span.toLocaleString()} renown to rank ${I.next.rank}`}</span></div>${bar(I.max ? 1 : I.into, I.max ? 1 : I.span)}`;
  h += `<div class="rn">${I.max ? 'You hold the top rank.' : `Next: ${esc(I.next.name)}  -  ${esc(rewardLine(RANKS[I.rank]))}`}</div></div>`;
  if (ready.length) h += `<div class="claimbar"><b>${ready.length} reward${ready.length > 1 ? 's' : ''} ready to claim</b><span>${esc(ready.slice(0, 3).map((M) => M.title).join('  |  '))}${ready.length > 3 ? `  +${ready.length - 3} more` : ''}</span><button id="claimall">CLAIM ALL</button></div>`;
  h += '<div class="ptabs">' + PTABS.map(([id, label]) => `<button class="${progTab === id ? 'on' : ''}" data-tab="${id}">${label}${per[id] ? `<i class="badge">${per[id]}</i>` : ''}</button>`).join('') + '</div><div class="pbody">';
  if (progTab === 'renown') {
    h += '<p class="pnote">Every round you clear and every boss you kill pays renown, win or lose. Hard pays 1.5x and Nightmare 2x. Each rank holds a reward.</p><div class="pgrid">';
    RANKS.forEach((R, i) => {
      if (i === 0) return;
      const st = Meta.stateOf('r' + (i + 1));
      h += `<div class="pc ${st}${i + 1 === I.rank + 1 ? ' next' : ''}"><div class="pt"><b><i class="num">${i + 1}</i>${esc(R.name)}</b><span>${rankXp(i + 1).toLocaleString()} renown</span></div>${rw('r' + (i + 1))}</div>`;
    });
    h += '</div>';
  } else if (progTab === 'maps') {
    h += `<p class="pnote">Each map is its own run. Survival maps are the side mode. Reach round ${HEIRLOOM_ROUND} and clear each one for renown, and clear it on Hard and Nightmare for the silver and gold medals.</p><div class="pgrid">`;
    WORLD.forEach((m) => {
      const MP = MAPS.find((x) => x.id === m.id), med = Meta.medal(m.id), best = Meta.bestRoundOn(m.id), A = MAP_CLEAR(m), rounds = MP ? MP.rounds : 12;
      h += `<div class="pc ${med ? 'claimed' : ''}"><div class="pt"><b>${esc(m.name)}</b><span>${MEDALS.map((n, d) => `<i class="med" title="${n}" style="${med > d ? `background:${MEDAL_HEX[d]};border-color:${MEDAL_HEX[d]}` : ''}"></i>`).join('')}</span></div>`;
      h += `${bar(Math.min(best, 20), 20)}<div class="pn">Best round ${best}${med ? '  -  cleared on ' + DIFFS[med - 1].name : ''}</div>${rw('h:' + m.id, `Round ${HEIRLOOM_ROUND}:`)}${A ? rw('a:' + A.id, 'Clear:') : ''}</div>`;
    });
    h += '</div>';
  } else if (progTab === 'classes') {
    h += '<p class="pnote">Rounds cleared while playing a class count toward its mastery. Each level unlocks more of that class.</p><div class="pgrid">';
    for (const C of CLASS_META) {
      const n = Meta.clsRounds(C.id), lvl = Meta.clsLevel(C.id), CL = CLASSES.find((x) => x.id === C.id), prev = lvl > 0 ? CLASS_LEVELS[lvl - 1] : 0, max = lvl >= CLASS_LEVELS.length;
      h += `<div class="pc ${max ? 'claimed' : ''}"><div class="pt"><b style="color:${CL ? CL.hex : '#f2e8d5'}">${esc(C.name)}</b><span>${lvl ? CLASS_LEVEL_NAMES[lvl - 1] : 'Novice'}</span></div>`;
      h += `${bar(max ? 1 : n - prev, max ? 1 : CLASS_LEVELS[lvl] - prev)}<div class="pn">${n} round${n === 1 ? '' : 's'} cleared${max ? '' : `  -  ${CLASS_LEVELS[lvl]} for ${CLASS_LEVEL_NAMES[lvl]}`}</div>`;
      C.rewards.forEach((R, k) => { h += rw(`c:${C.id}:${k}`, `${CLASS_LEVEL_NAMES[k]} (${CLASS_LEVELS[k]}):`); });
      h += '</div>';
    }
    h += '</div>';
  } else if (progTab === 'challenges') {
    GROUPS.forEach((G, gi) => {
      const L = ACHIEVEMENTS.filter((A) => A.group === gi && !/^clear_/.test(A.stat)); if (!L.length) return;
      // waiting to be claimed first, then the ones in progress (nearest first), then the claimed
      const ord = (A) => { const st = Meta.stateOf('a:' + A.id); return st === 'ready' ? -1 : st === 'claimed' ? 2 : 1 - Math.min(1, Meta.stat(A.stat) / A.need); };
      L.sort((x, y) => ord(x) - ord(y));
      h += `<h4>${esc(G.toUpperCase())}<span>${L.filter((A) => Meta.stat(A.stat) >= A.need).length} / ${L.length}</span></h4><div class="pgrid">`;
      for (const A of L) {
        const v = Math.min(A.need, Meta.stat(A.stat)), st = Meta.stateOf('a:' + A.id);
        h += `<div class="pc ${st}"><div class="pt"><b>${esc(A.name)}</b><span>${A.need > 1 ? `${v.toLocaleString()} / ${A.need.toLocaleString()}` : st === 'locked' ? '' : 'Done'}</span></div><div class="pn">${esc(A.desc)}</div>${st === 'locked' && A.need > 1 ? bar(v, A.need) : ''}${rw('a:' + A.id)}</div>`;
      }
      h += '</div>';
    });
  } else if (progTab === 'arsenal') {
    h += '<p class="pnote">Kills with a gun level it up, and each level is a permanent trait for that gun. Locked guns say what unlocks them.</p><div class="pgrid">';
    for (const W of weapons) {
      const locked = Meta.gunLocked(W.name), lvl = Meta.gunLevel(W.name), xp = Meta.gunXp(W.name);
      const next = lvl < GUN_LEVELS.length ? GUN_LEVELS[lvl] : GUN_LEVELS[GUN_LEVELS.length - 1], prev = lvl > 0 ? GUN_LEVELS[lvl - 1] : 0;
      h += `<div class="pc ${locked ? 'locked' : lvl >= 5 ? 'claimed' : ''}"><div class="pt"><b style="color:${locked ? '' : RARITY_HEX[W.rarity] || ''}">${esc(W.name)}</b><span>${locked ? 'Locked' : 'Level ' + lvl + ' / 5'}</span></div>`;
      h += locked ? `<div class="pn">${esc(Meta.howToUnlock('guns', W.name))}</div>` : `${bar(lvl >= 5 ? 1 : xp - prev, lvl >= 5 ? 1 : next - prev)}<div class="pn">${xp.toLocaleString()} kills  -  ${lvl < 5 ? 'next: ' + esc(GUN_TRAITS[lvl]) : 'mastered'}</div>`;
      h += '</div>';
    }
    h += '</div>';
  } else {
    const T = (k) => Meta.stat(k).toLocaleString(), cells = [['Runs', T('runs')], ['Clears', T('wins')], ['Rounds cleared', T('rounds')], ['Best round', T('bestRound')], ['Kills', T('kills')], ['Headshots', T('headshots')], ['Melee kills', T('meleeKills')], ['Elites killed', T('eliteKills')], ['Bosses killed', T('bosses')], ['Chests opened', T('chests')], ['Money earned', '$' + T('moneyEarned')], ['Renown', T('xp')]];
    h += '<div class="pstats">' + cells.map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join('') + '</div>';
  }
  h += '</div>';
  const keep = prog.scrollTop;
  prog.innerHTML = h; prog.scrollTop = keep;
  prog.querySelector('#pclose').onclick = (e) => { e.stopPropagation(); progArm = false; prog.style.display = 'none'; progBadge(); };
  // Starting over: rank, unlocks, gun levels, cosmetics, your character and the Descent's deeds and ascensions all go.
  // Your name and your settings stay. It takes two presses.
  prog.querySelector('#preset').onclick = (e) => {
    e.stopPropagation();
    if (!progArm) { progArm = true; renderProgress(); setTimeout(() => { if (progArm) { progArm = false; if (prog.style.display === 'block') renderProgress(); } }, 6000); return; }
    progArm = false; Meta.reset();
    try { location.reload(); } catch (err) { /* not allowed here: carry on with the fresh save */ }
    if (game && game.round === 0) { game.player.setBody(Meta.look()); game.player.setClass(Meta.cls()); }
    renderProgress(); progBadge();
  };
  prog.querySelectorAll('.ptabs button').forEach((el) => { el.onclick = (e) => { e.stopPropagation(); progTab = el.dataset.tab; prog.scrollTop = 0; renderProgress(); }; });
  prog.querySelectorAll('.pclaim').forEach((el) => { el.onclick = (e) => { e.stopPropagation(); const M = Meta.claim(el.dataset.claim); if (M) { renderProgress(); progBadge(); showClaim([M]); } }; });
  const all = prog.querySelector('#claimall'); if (all) all.onclick = (e) => { e.stopPropagation(); const L = Meta.claimAll(); renderProgress(); progBadge(); showClaim(L); };
  prog.querySelectorAll('.skin').forEach((el) => { el.onclick = (e) => { e.stopPropagation(); if (el.classList.contains('locked')) return; Meta.setSkin(el.dataset.skin); if (game) game.vm.setWeapon(game.vm.weaponDef, game.vm.weaponTier, false); renderProgress(); }; });
}
prog.addEventListener('click', (e) => e.stopPropagation());
// ---- character locker: live 3D preview plus every cosmetic by slot
const locker = document.getElementById('locker');
let lockCanvas = null, lockR = null, lockScene = null, lockCam = null, lockChar = null, lockPage = 'build', lockT = 0, lockSpin = 0.5, lockZoom = 0;
const LW = 420, LH = 580;
// One preview canvas and one WebGL context for the life of the page (the locker and the workbench share it). Making a
// new context per redraw makes browsers (phones especially) throw away the oldest one, which is the game's own renderer.
function ensureLock() {
  if (lockCanvas) return;
  lockCanvas = document.createElement('canvas'); lockCanvas.id = 'lcanvas'; lockCanvas.width = LW; lockCanvas.height = LH;
  try {
    lockR = new THREE.WebGLRenderer({ canvas: lockCanvas, antialias: true, alpha: true }); lockR.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); lockR.setSize(LW, LH, false);
    lockScene = new THREE.Scene(); lockCam = new THREE.PerspectiveCamera(30, LW / LH, 10, 3000); lockCam.position.set(0, 130, 640); lockCam.lookAt(0, 112, 0);
    const fl = new THREE.Mesh(new THREE.CylinderGeometry(110, 120, 8, 32), new THREE.MeshBasicMaterial({ color: 0x2a1820 })); fl.position.y = -4; lockScene.add(fl); lockerRebuild();
  } catch (err) { lockR = null; }
}
function lockerRebuild() { if (!lockScene) return; if (lockChar) lockScene.remove(lockChar); lockChar = buildCharacter(Meta.look()); lockScene.add(lockChar); }
// The character creator. A page of the body's sliders (three of them change how you play, and say so as you drag), then
// pages for the face, the hair and what is worn. The figure on the left is the real one, rebuilt on every change.
const hx6 = (n) => '#' + (n || 0).toString(16).padStart(6, '0');
function lockerStats() {
  const L = bodyStatLines(Meta.look()), all = [...L.arms, ...L.legs, ...L.weight];
  const el = locker.querySelector('#lstats'); if (el) el.innerHTML = all.length ? all.map(([t, ok]) => `<span class="${ok ? 'up' : 'dn'}">${t}</span>`).join('') : '<span class="nil">An ordinary build: nothing gained, nothing given up.</span>';
  for (const k of ['arms', 'legs', 'weight']) { const e = locker.querySelector(`#lfx-${k}`); if (e) e.innerHTML = L[k].length ? L[k].map(([t, ok]) => `<span class="${ok ? 'up' : 'dn'}">${t}</span>`).join('') : '<span class="nil">No effect at the middle.</span>'; }
}
function renderLocker() {
  const [have, total] = Meta.cosCount(), look = Meta.look(), sh = look.shape;
  let h = `<div class="ph"><h2>WARDROBE</h2><span class="lcount">${have} of ${total} pieces owned  -  Mossbottom sells the rest</span><button id="lrand" class="alt">RANDOM LOOK</button><button id="lclose">DONE</button></div><div class="lwrap"><div class="lleft"><canvas id="lcanvas" width="${LW}" height="${LH}"></canvas><div class="lhint">Drag to turn</div><div class="lstats"><h4>WHAT THIS BODY DOES</h4><div id="lstats"></div></div></div><div class="lside"><div class="ltabs">`;
  for (const P of PAGES) h += `<button class="ltab ${P.id === lockPage ? 'on' : ''}" data-page="${P.id}">${P.name}</button>`;
  h += '</div><div class="lscroll">';
  const page = PAGES.find((P) => P.id === lockPage) || PAGES[0];
  const slider = (K) => { const v = Math.round(sh[K.id] * 10); return `<div class="lsl${K.stat ? ' st' : ''}"><div class="lsn"><b>${K.name}</b><i id="lsv-${K.id}"></i></div><div class="lsr"><span>${K.lo}</span><input type="range" min="-10" max="10" step="1" value="${v}" data-shape="${K.id}"><span>${K.hi}</span></div>${K.stat ? `<div class="lfx" id="lfx-${K.id}"></div>` : ''}</div>`; };
  if (page.id === 'face') h += `<div class="lsec"><h3>FACES <i>a whole face to start from; change any part of it below</i></h3><div class="lgrid">${FACE_PRESETS.map((Q, i) => `<div class="litem ${Object.keys(Q.set).every((k) => look[k] === Q.set[k]) ? 'sel' : ''}" data-face="${i}"><b>${Q.name}</b></div>`).join('')}</div></div>`;
  for (const slot of page.slots) {
    const cur = look[slot];
    h += `<div class="lsec"><h3>${SLOT_NAMES[slot]}</h3><div class="lgrid${COSMETICS[slot].every((I) => I.c !== undefined && I.a === undefined) ? ' sw' : ''}">`;
    for (const I of COSMETICS[slot]) {
      if (!Meta.cosOwned(slot, I.id)) continue;   // the wardrobe holds what you own; the shop shows the rest
      const ok = true, c1 = I.c ?? I.a, c2 = I.b ?? I.c ?? I.a;
      h += `<div class="litem ${ok ? '' : 'locked'} ${cur === I.id ? 'sel' : ''}" data-slot="${slot}" data-id="${I.id}"><div class="lsw">${c1 === undefined ? '' : `<i style="background:${hx6(c1)}"></i><i style="background:${hx6(c2)}"></i>`}</div><b>${I.name}</b>${ok ? '' : `<span>${needText(I)}</span>`}</div>`;
    }
    h += '</div></div>';
  }
  { const SL = SHAPES.filter((K) => K.page === page.id), st = SL.filter((K) => K.stat), ot = SL.filter((K) => !K.stat);
    if (st.length) h = h.replace('<div class="lscroll">', `<div class="lscroll"><div class="lsec"><h3>BUILD <i>these three change how you play</i></h3>${st.map(slider).join('')}</div>`);
    if (ot.length) h += `<div class="lsec"><h3>${page.id === 'build' ? 'SIZE' : 'SHAPE'} <i>looks only</i></h3><div class="lsl2">${ot.map(slider).join('')}</div>${page.id === 'build' ? '<button id="lreset" class="alt">RESET EVERY SLIDER</button>' : ''}</div>`; }
  h += '</div></div></div>';
  const sc0 = locker.querySelector('.lscroll'), top0 = sc0 ? sc0.scrollTop : 0;
  locker.innerHTML = h;
  { const sc = locker.querySelector('.lscroll'); if (sc) sc.scrollTop = top0; }
  lockerStats();
  locker.querySelector('#lclose').onclick = (e) => { e.stopPropagation(); locker.style.display = 'none'; Net.refreshPresence(); if (game && game.round === 0) game.player.setBody(Meta.look()); renderLobby(); if (vmode === 'wardrobe') { vmode = ''; panelOut(); } };
  locker.querySelectorAll('.ltab').forEach((el) => { el.onclick = (e) => { e.stopPropagation(); lockPage = el.dataset.page; const sc = locker.querySelector('.lscroll'); if (sc) sc.scrollTop = 0; renderLocker(); }; });
  locker.querySelectorAll('.litem').forEach((el) => { el.onclick = (e) => { e.stopPropagation(); if (el.classList.contains('locked')) return; if (el.dataset.face !== undefined) Meta.setLooks(FACE_PRESETS[+el.dataset.face].set); else Meta.setLook(el.dataset.slot, el.dataset.id); lockerRebuild(); renderLocker(); }; });
  locker.querySelectorAll('input[data-shape]').forEach((el) => {
    const say = () => { const v = +el.value, K = SHAPES.find((q) => q.id === el.dataset.shape), o = locker.querySelector(`#lsv-${K.id}`); if (o) o.textContent = K.zero === -1 ? (v > -10 ? `${(v + 10) * 5}%` : '') : v === 0 ? '' : `${v > 0 ? K.hi : K.lo} ${Math.abs(v) * 10}%`; };
    say();
    el.oninput = (e) => { e.stopPropagation(); Meta.setShape(el.dataset.shape, +el.value / 10); say(); lockerRebuild(); lockerStats(); };
    el.addEventListener('keydown', (e) => e.stopPropagation()); el.addEventListener('pointerdown', (e) => e.stopPropagation());
  });
  { const b = locker.querySelector('#lreset'); if (b) b.onclick = (e) => { e.stopPropagation(); Meta.setShapes(DEFAULT_SHAPE); lockerRebuild(); renderLocker(); }; }
  locker.querySelector('#lrand').onclick = (e) => {
    e.stopPropagation();
    const pick = (slot) => { const L = COSMETICS[slot].filter((I) => Meta.cosUnlocked(slot, I.id)); return L[Math.floor(Math.random() * L.length)].id; }, o = {};
    for (const P of PAGES) for (const slot of P.slots) o[slot] = pick(slot);
    for (const slot of ['face', 'neck', 'shoulder', 'back']) if (Math.random() < 0.6) o[slot] = 'none';
    if (o.beard === 'none' && o.hair === 'none') o.hair = 'braids';
    Meta.setLooks(o);
    const S0 = Meta.shape(), r = () => Math.round((Math.random() * 2 - 1) * 7) / 10;
    Meta.setShapes(Object.assign({}, S0, { hatH: r(), hatF: r(), brim: r(), nose: r(), beardL: r(), beardW: r(), head: Math.round((Math.random() * 2 - 1) * 4) / 10 }));   // the three that change how you play are left as you set them
    lockerRebuild(); renderLocker();
  };
  // One preview canvas and one WebGL context for the life of the page. Making a new context per redraw makes
  // browsers (phones especially) throw away the oldest one, which is the game's own renderer.
  ensureLock(); if (lockR) { lockR.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); lockR.setSize(LW, LH, false); } lockCanvas.id = 'lcanvas'; if (lockCam) { lockCam.aspect = LW / LH; lockCam.updateProjectionMatrix(); }
  const cv = lockCanvas; locker.querySelector('#lcanvas').replaceWith(cv);
  let drag = null;
  cv.onpointerdown = (e) => { drag = e.clientX; cv.setPointerCapture(e.pointerId); };
  cv.onpointermove = (e) => { if (drag !== null) { lockSpin += (e.clientX - drag) * 0.012; drag = e.clientX; } };
  cv.onpointerup = () => { drag = null; };
}
function tickLocker(dt) {
  if (locker.style.display !== 'block' || !lockR || !lockChar) return;
  lockT += dt; lockChar.rotation.y = lockSpin + Math.sin(lockT * 0.4) * 0.12;
  animateCharacter(lockChar, lockT, 0, { preview: true });
  // the camera stands back for the body and the clothes and comes in for the face and the hair
  const R = lockChar.userData.rig, hy = R.headY || 130, close = lockPage === 'beard' ? 1 : lockPage === 'hat' ? 0.55 : 0;
  lockZoom += (close - lockZoom) * Math.min(1, dt * 6);
  const z = lockZoom, tall = (R.topY || 220) + 12, ty = (tall * 0.5) * (1 - z) + (hy + 6) * z, dist = Math.max(520, tall * 2.9) * (1 - z) + 300 * z;
  lockCam.position.set(0, ty + 14 * (1 - z), dist); lockCam.lookAt(0, ty, 0);
  lockR.render(lockScene, lockCam);
}
locker.addEventListener('click', (e) => e.stopPropagation());
// test hook: contact sheet of every piece in a slot on one base model
window.__charSheet = (base, slot, view, cols0) => {
  const V = { head: [0, 166, 260, 164, 0.45], face: [0, 160, 175, 160, 0.3], torso: [0, 130, 320, 130, 0.5], legs: [0, 45, 320, 40, 0.5], back: [0, 135, 440, 130, 2.6], full: [0, 125, 640, 115, 0.5], side: [0, 162, 260, 160, 1.45], rear: [0, 160, 270, 158, 2.75] }[view];
  const items = COSMETICS[slot], cw = 240, ch = 300, cols = cols0 || Math.min(8, items.length), out = document.createElement('canvas'); out.width = cw * cols; out.height = ch * Math.ceil(items.length / cols);
  const g = out.getContext('2d'); g.fillStyle = '#3a2430'; g.fillRect(0, 0, out.width, out.height);
  ensureLock(); lockR.setSize(cw, ch, false); const cam = new THREE.PerspectiveCamera(30, cw / ch, 10, 3000); cam.position.set(V[0], V[1], V[2]); cam.lookAt(0, V[3], 0);
  const sc = new THREE.Scene();
  items.forEach((I, i) => {
    const look = Object.assign({}, Meta.look(), base || {}, { [slot]: I.id }), ch3 = buildCharacter(look); ch3.rotation.y = V[4]; animateCharacter(ch3, 0, 0, { preview: true }); sc.add(ch3);
    lockR.render(sc, cam); g.drawImage(lockCanvas, (i % cols) * cw, Math.floor(i / cols) * ch, cw, ch); sc.remove(ch3);
    g.fillStyle = '#ffcd5a'; g.font = '16px sans-serif'; g.fillText(I.name, (i % cols) * cw + 6, Math.floor(i / cols) * ch + 18);
  });
  lockR.setSize(LW, LH, false);
  return out.toDataURL('image/jpeg', 0.85);
};
// a sheet of whole looks: [{ label, look, yaw, view }]
window.__lookSheet = (list, cols = 6, cw = 240, ch = 320) => {
  const out = document.createElement('canvas'); out.width = cw * cols; out.height = ch * Math.ceil(list.length / cols);
  const g = out.getContext('2d'); g.fillStyle = '#3a2430'; g.fillRect(0, 0, out.width, out.height);
  ensureLock(); lockR.setSize(cw, ch, false); const sc = new THREE.Scene();
  list.forEach((Q, i) => {
    const look = Object.assign({}, Meta.look(), Q.look || {}); look.shape = Object.assign({}, DEFAULT_SHAPE, (Q.look || {}).shape);
    const c3 = buildCharacter(look); if (Q.post && window.__proto) window.__proto(c3, Q.post, look); c3.rotation.y = Q.yaw === undefined ? 0.5 : Q.yaw; animateCharacter(c3, Q.t || 0, Q.speed || 0, { preview: !Q.aim }); sc.add(c3);
    const V = Q.view || [0, 125, 700, 112]; const cam = new THREE.PerspectiveCamera(30, cw / ch, 10, 3000); cam.position.set(V[0], V[1], V[2]); cam.lookAt(0, V[3], 0);
    lockR.render(sc, cam); g.drawImage(lockCanvas, (i % cols) * cw, Math.floor(i / cols) * ch, cw, ch); sc.remove(c3);
    g.fillStyle = '#ffcd5a'; g.font = '15px sans-serif'; g.fillText(Q.label || '', (i % cols) * cw + 6, Math.floor(i / cols) * ch + 18);
  });
  lockR.setSize(LW, LH, false);
  return out.toDataURL('image/jpeg', 0.85);
};
// test hook: heads framed the way the NOSE AND BEARD page frames them. list: [{ label, look, yaw, dist, dy }]
window.__buildChar = buildCharacter;
window.__faceSheet = (list, cols = 6, cw = 260, ch = 260) => {
  const out = document.createElement('canvas'); out.width = cw * cols; out.height = ch * Math.ceil(list.length / cols);
  const g = out.getContext('2d'); g.fillStyle = '#3a2430'; g.fillRect(0, 0, out.width, out.height);
  ensureLock(); lockR.setSize(cw, ch, false); const sc = new THREE.Scene();
  list.forEach((Q, i) => {
    const look = Object.assign({}, Meta.look(), Q.look || {}); look.shape = Object.assign({}, DEFAULT_SHAPE, (Q.look || {}).shape);
    const c3 = buildCharacter(look); c3.rotation.y = Q.yaw || 0; animateCharacter(c3, 0, 0, { preview: true }); if (Q.noArms) { const R = c3.userData.rig; R.armL.visible = R.armR.visible = false; if (R.gun) R.gun.visible = false; } sc.add(c3);
    const hy = (c3.userData.rig.headY || 130) + 6 + (Q.dy || 0), cam = new THREE.PerspectiveCamera(30, cw / ch, 10, 3000); cam.position.set(Q.dx || 0, hy + (Q.up || 0), Q.dist || 300); cam.lookAt(Q.dx || 0, hy, 0);
    lockR.render(sc, cam); g.drawImage(lockCanvas, (i % cols) * cw, Math.floor(i / cols) * ch, cw, ch); sc.remove(c3);
    g.fillStyle = '#ffcd5a'; g.font = '15px sans-serif'; g.fillText(Q.label || '', (i % cols) * cw + 6, Math.floor(i / cols) * ch + 18);
  });
  lockR.setSize(LW, LH, false);
  return out.toDataURL('image/jpeg', 0.85);
};
// test hook: where sculpted shapes stand. prefix: the start of the shape key ('banner', 'tree'). -> [{ key, chunk, p: [x, y, z] }]
window.__shapeSpots = (prefix) => {
  const out = [], G = game.world.constructor.PRIM_GEOS;
  for (const [key, list] of game.world.inst) { const [id, , ch] = key.split('|').map(Number), sk = G[id].userData.shape; if (!sk || !sk.startsWith(prefix)) continue; for (const it of list) { const v = new THREE.Vector3().setFromMatrixPosition(it.m); out.push({ key: sk, chunk: ch, p: [Math.round(v.x), Math.round(v.y), Math.round(v.z)] }); } }
  return out;
};
// test hook: views of the world. list: [{ chunk, at: [x, y, z], look: [x, y, z], fov, label }] (three.js coordinates)
window.__worldSheet = (list, cols = 2, cw = 640, ch = 400) => {
  const out = document.createElement('canvas'); out.width = cw * cols; out.height = ch * Math.ceil(list.length / cols);
  const g = out.getContext('2d'); ensureLock(); lockR.setSize(cw, ch, false);
  list.forEach((Q, i) => {
    if (Q.chunk !== undefined && game.world.showChunk) game.world.showChunk(Q.chunk);
    const cam = new THREE.PerspectiveCamera(Q.fov || 50, cw / ch, 5, 40000); cam.position.set(...Q.at); cam.lookAt(...Q.look);
    lockR.render(game.scene, cam); g.drawImage(lockCanvas, (i % cols) * cw, Math.floor(i / cols) * ch, cw, ch);
    g.fillStyle = '#ffcd5a'; g.font = '15px sans-serif'; g.fillText(Q.label || '', (i % cols) * cw + 6, Math.floor(i / cols) * ch + 18);
  });
  lockR.setSize(LW, LH, false);
  return out.toDataURL('image/jpeg', 0.86);
};
// test hook: a sheet of guns as the workbench shows them, with parts fitted. list: [{ def, cores, yaw, pitch, label }]
window.__gunSheet = (list, cols = 6, cw = 320, ch = 210) => {
  const out = document.createElement('canvas'); out.width = cw * cols; out.height = ch * Math.ceil(list.length / cols);
  const g = out.getContext('2d'); g.fillStyle = '#5a4a52'; g.fillRect(0, 0, out.width, out.height);
  ensureLock(); lockR.setSize(cw, ch, false); const sc = new THREE.Scene();
  list.forEach((Q, i) => {
    const m = game.vm.constructor.displayModel(game, Q.def, Q.tier || 0, Q.cores || []), piv = new THREE.Group(); piv.add(m); sc.add(piv);
    const b = new THREE.Box3().setFromObject(m); if (Q.rear) { b.min.z = b.max.z - (b.max.z - b.min.z) * Q.rear; }   // rear: frame only the back fraction of the gun (stock and grip)
    const c = b.getCenter(new THREE.Vector3()); m.position.sub(c); piv.rotation.set(Q.pitch || 0, Q.yaw === undefined ? -Math.PI / 2 : Q.yaw, 0);
    const s = b.getSize(new THREE.Vector3()), r = Math.max(s.z, s.y * (cw / ch), s.x) * 0.56 + 1.5, cam = new THREE.OrthographicCamera(-r, r, r * ch / cw, -r * ch / cw, -500, 500); cam.position.set(0, 0, 100); cam.lookAt(0, 0, 0);
    lockR.render(sc, cam); g.drawImage(lockCanvas, (i % cols) * cw, Math.floor(i / cols) * ch, cw, ch); sc.remove(piv);
    g.fillStyle = '#ffcd5a'; g.font = '14px sans-serif'; g.fillText(Q.label || game.data.weapons[Q.def].name, (i % cols) * cw + 5, Math.floor(i / cols) * ch + 15);
  });
  lockR.setSize(LW, LH, false);
  return out.toDataURL('image/jpeg', 0.88);
};
// test hook: pieces of a gun model that touch nothing else (floating). Builds the model, reads every mesh as an oriented
// box (from its geometry's bounds), joins any two whose boxes meet (with a small tolerance), and reports every mesh that
// is not joined to the biggest group. [{ name, at: [x, y, z] in gun units, size, color }]
window.__THREE = THREE;
// test hook: things set against a sculpted stock or grip that do not touch its real surface (or are sunk out of sight in it).
// For each sculpted piece, the widest it reaches either side at each (x, z), from its own vertices; every other piece within
// its length and height whose inner face sits more than `gap` off that (over its whole footprint) is reported.
window.__sculptGapScan = (def, tier = 0, gap = 0.25) => {
  const VM = game.vm.constructor, vm = new VM(game); vm.weaponDef = def; vm.weaponTier = tier; vm.coresOverride = []; vm.noMerge = true; vm.build();
  const G = vm.gun; G.updateWorldMatrix(true, true); const inv = new THREE.Matrix4().copy(G.matrixWorld).invert(), v = new THREE.Vector3(), M = new THREE.Matrix4(), out = [];
  const shown = (o) => { for (let p = o; p && p !== G.parent; p = p.parent) if (!p.visible) return false; return true; };
  const meshes = vm.parts.slice(0, vm.gunPartCount).filter((o) => o.isMesh && shown(o) && o.geometry);
  const toGun = (o, x, y, z) => { M.multiplyMatrices(inv, o.matrixWorld); v.set(x, y, z).applyMatrix4(M); return [-v.z, v.x, v.y]; };
  // every plain piece's box in gun units, to tell what is held on by something other than the sculpted piece
  const boxOf = (O) => { if (!O.geometry.boundingBox) O.geometry.computeBoundingBox(); const bb = O.geometry.boundingBox, c = []; for (let i = 0; i < 8; i++) c.push(toGun(O, i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z)); return [0, 1, 2].map((k) => [Math.min(...c.map((q) => q[k])), Math.max(...c.map((q) => q[k]))]); };
  const plain = meshes.filter((o) => !o.geometry.userData.sculpt), boxes = new Map(plain.map((o) => [o, boxOf(o)]));
  const touchesOther = (O) => { const a = boxes.get(O); for (const [P, b] of boxes) { if (P === O) continue; if ([0, 1, 2].every((k) => a[k][0] <= b[k][1] + 0.08 && b[k][0] <= a[k][1] + 0.08)) return true; } return false; };
  for (const S of meshes.filter((o) => /^(stk|grip)/.test(o.geometry.userData.sculpt || ''))) {
    const P = S.geometry.attributes.position, bins = new Map(), B = 0.6; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < P.count; i++) { const [x, y, z] = toGun(S, P.getX(i), P.getY(i), P.getZ(i)); x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
      const k = Math.round(x / B) + ',' + Math.round(z / B), e = bins.get(k) || [0, 0]; if (y > 0) e[0] = Math.max(e[0], y); else e[1] = Math.max(e[1], -y); bins.set(k, e); }
    for (const O of meshes) {
      if (O === S || O.geometry.userData.sculpt) continue;
      if (!O.geometry.boundingBox) O.geometry.computeBoundingBox(); const bb = O.geometry.boundingBox, c = [];
      for (let i = 0; i < 8; i++) c.push(toGun(O, i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z));
      const ax = Math.min(...c.map((q) => q[0])), bx = Math.max(...c.map((q) => q[0])), ay = Math.min(...c.map((q) => q[1])), by = Math.max(...c.map((q) => q[1])), az = Math.min(...c.map((q) => q[2])), bz = Math.max(...c.map((q) => q[2]));
      if (bx < x0 || ax > x1 || bz < z0 || az > z1 || (ay < 0.2 && by > -0.2)) continue;   // not alongside it, or through the middle of it
      const side = ay > 0 ? 0 : 1, inner = side === 0 ? ay : -by, outer = side === 0 ? by : -ay; let best = 1e9, reach = 0;
      for (let x = Math.max(ax, x0); x <= Math.min(bx, x1) + 1e-6; x += B / 2) for (let z = Math.max(az, z0); z <= Math.min(bz, z1) + 1e-6; z += B / 2) { const e = bins.get(Math.round(x / B) + ',' + Math.round(z / B)); if (!e) continue; reach = Math.max(reach, e[side]); best = Math.min(best, inner - e[side]); }
      if (best === 1e9) continue;
      if (best > gap && !touchesOther(O)) out.push({ what: 'floats ' + best.toFixed(2), on: S.geometry.userData.sculpt.slice(0, 4), at: [((ax + bx) / 2).toFixed(1), ((ay + by) / 2).toFixed(1), ((az + bz) / 2).toFixed(1)], size: [(bx - ax).toFixed(1), (by - ay).toFixed(1), (bz - az).toFixed(1)] });
      else if (outer < reach - 0.05 && bx - ax < 30) out.push({ what: 'sunk', on: S.geometry.userData.sculpt.slice(0, 4), at: [((ax + bx) / 2).toFixed(1), ((ay + by) / 2).toFixed(1), ((az + bz) / 2).toFixed(1)] });
    }
  }
  return out;
};
window.__floatScan = (def, tier = 0, tol = 0.35) => {
  const VM = game.vm.constructor, vm = new VM(game); vm.weaponDef = def; vm.weaponTier = tier; vm.coresOverride = []; vm.noMerge = true; vm.build();
  const g = vm.gun; g.updateWorldMatrix(true, true);
  const shown = (o) => { for (let p = o; p && p !== g.parent; p = p.parent) if (!p.visible) return false; return true; };
  const ms = vm.parts.slice(0, vm.gunPartCount).filter((o) => o.isMesh && shown(o) && o.geometry);
  const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), sc = new THREE.Vector3().setFromMatrixColumn(g.matrixWorld, 0).length();
  const box = ms.map((m) => {
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); const bb = m.geometry.boundingBox, M = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
    const c = bb.getCenter(new THREE.Vector3()).applyMatrix4(M), ax = [], h = [], half = bb.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    for (let k = 0; k < 3; k++) { const v = new THREE.Vector3().setFromMatrixColumn(M, k); const L = v.length(); ax.push(L > 1e-9 ? v.divideScalar(L) : new THREE.Vector3(k === 0, k === 1, k === 2)); h.push([half.x, half.y, half.z][k] * L + tol); }
    return { c, ax, h };
  });
  const sep = (A, Bx) => {   // separating axis test for two oriented boxes
    const T = Bx.c.clone().sub(A.c), axes = [...A.ax, ...Bx.ax]; for (const a of A.ax) for (const b of Bx.ax) { const x = a.clone().cross(b); if (x.lengthSq() > 1e-8) axes.push(x.normalize()); }
    for (const L of axes) { let ra = 0, rb = 0; for (let k = 0; k < 3; k++) { ra += A.h[k] * Math.abs(A.ax[k].dot(L)); rb += Bx.h[k] * Math.abs(Bx.ax[k].dot(L)); } if (Math.abs(T.dot(L)) > ra + rb) return true; }
    return false;
  };
  const par = ms.map((_, i) => i), find = (i) => (par[i] === i ? i : (par[i] = find(par[i])));
  for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) if (find(i) !== find(j) && !sep(box[i], box[j])) par[find(i)] = find(j);
  const cnt = {}; for (let i = 0; i < ms.length; i++) { const r = find(i); cnt[r] = (cnt[r] || 0) + 1; }
  const main = +Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
  const out = []; for (let i = 0; i < ms.length; i++) if (find(i) !== main) { const b = box[i], c = b.c; out.push({ at: [+(-c.z / sc * sc).toFixed(1), +c.x.toFixed(1), +c.y.toFixed(1)], size: b.h.map((v) => +(v - tol).toFixed(1)), color: '#' + (ms[i].material.uniforms && ms[i].material.uniforms.uColor ? ms[i].material.uniforms.uColor.value.getHexString() : '?'), geo: ms[i].geometry.type.replace('Geometry', '') }); }
  vm.clear && vm.clear();
  return out;
};
window.__build = buildCharacter; window.__THREE = THREE;
window.__locker = () => { locker.style.display = 'block'; renderLocker(); };

// ---- lobby: every run starts here. Character, loadout, map, and inviting friends by lobby code.
const lobby = document.getElementById('lobby');
let lobbyBusy = false, lobbyMsg = '', lobbyTimer = 0, lobbySig = '';
const esc2 = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function myName() { let v = 'Player'; try { v = localStorage.getItem('dmh-name') || 'Player'; } catch (e) { /* private mode */ } return v; }
function openLobby() { title.style.display = 'none'; lobby.style.display = 'block'; lobbyMsg = ''; renderLobby(); }
const lobbyInfo = {};   // why a locked choice is locked, shown on the line under its group after you click it
function closeLobby() { lobby.style.display = 'none'; if (vmode === 'gate') { vmode = ''; panelOut(); } else { if (Net.active) Net.leave(); title.style.display = 'flex'; progBadge(); } }
function renderLobby() {
  if (lobby.style.display !== 'block') return;
  const nmEl = lobby.querySelector('#lname'), cdEl = lobby.querySelector('#lcode'), focus = document.activeElement && document.activeElement.id;
  const nameV = nmEl ? nmEl.value : myName(), codeV = cdEl ? cdEl.value : '';
  const L = Meta.look(), client = Net.role === 'client', hosting = Net.role === 'host';
  const RI = Meta.rankInfo();
  // ---- the lobby: who is playing on the left, the run on the right, one line of detail per choice, and the
  // summary and START pinned to the bottom. Options are chips; only the chosen one is described.
  const chip = (attr, sel, locked, name, sub, extra = '') => `<div class="lbpick chip ${sel ? 'sel' : ''} ${locked ? 'locked' : ''}" ${attr} ${extra}><b>${name}</b>${sub ? `<span>${sub}</span>` : ''}</div>`;
  const group = (label, body, detail, note = '') => `<div class="lbg"><div class="lbgl">${label}${note ? `<i>${note}</i>` : ''}</div><div class="lbgc"><div class="chips">${body}</div>${detail ? `<div class="lbdesc">${detail}</div>` : ''}</div></div>`;
  const info = (k) => (lobbyInfo[k] ? `<span class="warn">${esc2(lobbyInfo[k])}</span>` : '');
  let h = `<div class="lbh"><h2>THE WAY DOWN</h2><span class="lbrank">RANK ${RI.rank}  -  ${RI.name.toUpperCase()}<i>${RI.max ? 'top rank' : `${RI.into.toLocaleString()} / ${RI.span.toLocaleString()} renown`}</i></span><button id="lbback">BACK TO THE VILLAGE</button></div><div class="lbwrap"><aside>`;
  // party
  h += '<section><h3>PARTY</h3><canvas id="lbline" width="536" height="400"></canvas>';
  const list = Net.active ? Net.lobbyList() : [{ name: nameV, host: true, me: true }];
  for (const p of list) h += `<div class="lbrow ${p.me ? 'me' : ''}"><b>${esc2(p.name)}</b><span>${p.host ? 'Host' : ''}${p.me ? (p.host ? ' - you' : 'You') : ''}</span></div>`;
  if (!Net.active) {
    h += `<label class="lbl">Your name <input id="lname" maxlength="16" value="${esc2(nameV)}"></label>`;
    if (Net.lobby) h += `<button id="lbinvite" class="wide">INVITE FRIENDS</button><div class="lbor">or join a friend</div><div class="lbjoin"><input id="lcode" maxlength="8" placeholder="CODE" autocapitalize="characters" autocomplete="off" value="${esc2(codeV)}"><button id="lbjoin">JOIN</button></div>`;
    else h += `<p class="dim">${Net.tried ? 'Playing with friends is not available in this view.' : 'Connecting...'}</p>`;
  } else if (hosting) h += `<div class="lbcode"><span>LOBBY CODE</span><b>${esc2(Net.code)}</b></div><p class="dim">Friends pick PLAY, type this code and press JOIN.</p><button id="lbleave" class="wide alt">CLOSE LOBBY</button>`;
  else h += `<div class="lbcode"><span>LOBBY CODE</span><b>${esc2(Net.code)}</b></div><button id="lbleave" class="wide alt">LEAVE LOBBY</button>`;
  h += `<p class="msg">${esc2(lobbyMsg)}</p></section>`;
  h += '</aside><main>';
  const Kr = client ? null : Meta.contractRules(), Kc = client ? null : Meta.contract(), daily = !!Kr, dsc0 = Math.max(0, MAPS.findIndex((M) => M.mode === 'descent'));   // a contract sets the run
  const hm = client ? Net.hostMap() : -1, curMap = client ? (MAPS[hm] ? hm : game.mapId) : Kr ? (Kr.mode === 'descent' ? dsc0 : Kr.map) : (MAPS[Meta.map()] ? Meta.map() : Math.max(0, MAPS.findIndex((M) => M.mode === 'descent')));
  const curDf = client ? difficulty() : Kr ? Kr.diff : Meta.difficulty(), ups = game ? game.data.upgrades : [];
  // the run
  h += '<section><h3>THE RUN</h3>';
  if (client) {
    h += group('MAP', chip('', true, false, esc2(MAPS[curMap].name), ''), 'The host chooses the map and the difficulty.');
    h += group('DIFFICULTY', chip('', true, false, 'Host\u2019s choice', ''), 'You will see it when the run starts.');
  } else {
    const dsc = MAPS.findIndex((M) => M.mode === 'descent'), isD = curMap === dsc; if (!isD) window.__survMap = curMap;
    h += group('GAME TYPE', chip(`data-map="${dsc}"`, isD, daily, 'The Descent', `20 rooms  -  best ${Meta.bestRoundOn('descent')}`) + chip(`data-map="${window.__survMap || 0}"`, !isD, daily, 'Survival', 'side mode: one map, endless rounds'),
      isD ? esc2(MAPS[dsc].blurb) : 'Hold one map round after round, and work its task to open the way to the last boss.', daily ? 'set by your contract' : '');
    if (!isD) h += group('MAP', MAPS.map((M, i) => (M.mode ? '' : chip(`data-map="${i}"`, curMap === i, daily, esc2(M.name), `best ${Meta.bestRoundOn(M.id)}${MEDALS.map((n, d) => `<i class="med" title="${n}" style="${Meta.medal(M.id) > d ? `background:${MEDAL_HEX[d]};border-color:${MEDAL_HEX[d]}` : ''}"></i>`).join('')}`))).join(''),
      `${esc2(MAPS[curMap].blurb)} <span class="dim2">${MAPS[curMap].rounds} rounds.</span>`, daily ? 'set by your contract' : '');
    h += group('DIFFICULTY', DIFFS.map((D, i) => chip(`data-df="${i}"`, curDf === i, daily, D.name, '')).join(''), esc2(DIFFS[curDf].desc), daily ? 'set by your contract' : '');
  }
  h += '</section>';
  // you
  h += '<section><h3>YOUR LOADOUT</h3>';
  { const C = CLASSES.find((c) => c.id === Meta.cls()) || CLASSES[0], lv = Meta.clsLevel(C.id), n = Meta.clsRounds(C.id);
    h += group('CLASS', CLASSES.map((K) => { const l = Meta.clsLevel(K.id); return chip(`data-cls="${K.id}"`, Meta.cls() === K.id, false, `<em style="color:${K.hex}">${K.name}</em>`, l ? CLASS_LEVEL_NAMES[l - 1] : 'Novice'); }).join(''),
      `${C.blurb} <span class="dim2">${lv < CLASS_LEVELS.length ? `${n} / ${CLASS_LEVELS[lv]} rounds to ${CLASS_LEVEL_NAMES[lv]}.` : 'Mastered.'}</span><ul class="lbkit">${C.kit.map((k) => `<li>${k}</li>`).join('')}</ul>`); }
  { const curW = Meta.starter();
    { const own = Meta.ownedGuns(); h += group('STARTING GUN', own.map((n) => { const W = game ? game.data.weapons.find((w) => w.name === n) : null; return chip(`data-w="${esc2(n)}"`, curW === n, false, esc2(n), W ? `<em style="color:${RARITY_HEX[W.rarity] || '#ccc'}">${W.rarity}</em> ${W.cls || ''}` : ''); }).join(''), `${own.length} gun${own.length === 1 ? '' : 's'} of ${shopGuns().length}. Buy more at Bramble &amp; Bolt in the square, for gold.`); } }
  h += '</section>';
  // the Descent's own progression: what going down has earned, and what you take with you
  if (MAPS[curMap] && MAPS[curMap].mode === 'descent') {
    const asc = Meta.ascended().sort(), marks = asc.reduce((a, n) => a + Meta.asc(n), 0), dia = (n) => '\u25C6'.repeat(n) + '\u25C7'.repeat(3 - n), nd = MACHINES.filter((D) => machine(D.id)).length;
    h += '<section><h3>THE DESCENT</h3>';
    h += group('MACHINES', MACHINES.map((D) => { const ok = machine(D.id), r = Meta.machineRank(D.id); return chip(`data-deed="${D.id}"`, ok, !ok, esc2(D.name), ok ? 'Running' : `Rank ${r}`, `data-why="${esc2(`Rank ${r}. ` + D.text)}" data-grp="d"`); }).join(''),
      info('d') || (nd ? `<ul class="lbkit">${MACHINES.filter((D) => machine(D.id)).map((D) => `<li><b>${esc2(D.name)}:</b> ${esc2(D.short)}</li>`).join('')}</ul>` : 'Machines are helpers that turn up in the Descent once your rank opens them. Click one to see what it does and the rank that brings it.'), `${nd} of ${MACHINES.length}`);
    const cur = Meta.carry();
    h += group('CARRIED GUN', chip('data-carry=""', !cur, false, 'None', 'the usual start') + asc.map((n) => { const a = Meta.asc(n), T = temperOf(n), A = attuneOf(n); return chip(`data-carry="${esc2(n)}"`, cur === n, false, esc2(n), `${dia(a)}${T.id ? ' ' + T.name : ''}${A.id ? ' ' + A.name : ''}`); }).join(''),
      asc.length ? `An ascended gun can go down with you from the first room. <span class="dim2">${marks} mark${marks === 1 ? '' : 's'} on ${asc.length} gun${asc.length === 1 ? '' : 's'}. ${ROMAN[2]} lets you choose its temper and ${ROMAN[3]} its element, both at any workbench.</span>` : 'Finish a Descent and the gun that did the most damage ascends. A gun can ascend once on each difficulty, three times in all: I, it can start runs with you; II, you choose its temper; III, you bind it to an element.', asc.length ? '' : 'none ascended yet');
    h += '</section>';
  }
  // the contract, if one was taken at the challenge board
  if (!client) {
    h += '<section><h3>CONTRACT</h3>';
    if (Kc) { const mods = MUTATORS.filter((M, i) => (Kc.muts >> i) & 1); h += group(esc2(Kc.title.toUpperCase()), mods.map((M) => chip('', true, true, M.name, '')).join('') + chip('data-drop="1"', false, false, 'Drop it', 'play a plain run'), `${esc2(Kc.flavor)} <span class="dim2">${mods.map((M) => `${M.name}: ${M.desc}`).join(' ')} Win it for <b class="gold">${Kc.gold.toLocaleString()} gold</b> and <b class="gold">${Kc.renown.toLocaleString()} renown</b> on top of the run's pay.</span>`); }
    else h += group('NONE TAKEN', chip('', true, false, 'A plain run', 'no modifiers'), 'The challenge board in the square posts six contracts a day: runs with set rules that pay bonus gold and renown when won.');
    h += '</section>';
    const W0 = Meta.starter(), C0 = CLASSES.find((c) => c.id === Meta.cls()) || CLASSES[0];
    h += `</main></div><div class="lbfoot"><div class="lbsum"><b>${esc2(MAPS[curMap].name)}</b><span>${DIFFS[curDf].name}</span><span>${C0.name}</span><span>${esc2(W0)}</span>${Kc ? `<span class="gold">contract: +${Kc.gold.toLocaleString()} gold</span>` : ''}</div><button id="lbstart" class="lbstart">${Kc ? 'GO DOWN ON CONTRACT' : 'GO DOWN'}</button></div>`;
  } else h += '</main></div><div class="lbfoot"><div class="lbstart wait">THE HOST CHOOSES THE RUN AND STARTS IT</div></div>';
  lobby.innerHTML = h;
  const q = (id) => lobby.querySelector(id);
  q('#lbback').onclick = (e) => { e.stopPropagation(); closeLobby(); };
  const saveName = () => { const n = q('#lname'); if (n) { try { localStorage.setItem('dmh-name', n.value || 'Player'); } catch (err) { /* private mode */ } } return myName(); };
  for (const id of ['#lname', '#lcode']) { const el = q(id); if (el) { el.addEventListener('keydown', (e) => e.stopPropagation()); el.addEventListener('keyup', (e) => e.stopPropagation()); if (focus === id.slice(1)) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } } }
  if (q('#lname')) q('#lname').addEventListener('change', saveName);
  if (q('#lbinvite')) q('#lbinvite').onclick = async (e) => { e.stopPropagation(); if (lobbyBusy) return; lobbyBusy = true; lobbyMsg = 'Opening your lobby...'; const n = saveName(); renderLobby(); try { await Net.host(n); lobbyMsg = ''; } catch (err) { lobbyMsg = 'Could not open a lobby right now.'; } lobbyBusy = false; renderLobby(); };
  if (q('#lbjoin')) q('#lbjoin').onclick = async (e) => { e.stopPropagation(); if (lobbyBusy) return; lobbyBusy = true; const n = saveName(), code = q('#lcode').value; lobbyMsg = 'Joining...'; renderLobby(); try { await Net.join(code, n); lobbyMsg = ''; } catch (err) { lobbyMsg = err && err.message === 'code' ? 'Enter the lobby code your friend sees.' : 'No lobby found with that code.'; } lobbyBusy = false; renderLobby(); };
  if (q('#lbleave')) q('#lbleave').onclick = (e) => { e.stopPropagation(); Net.leave(); lobbyMsg = ''; renderLobby(); };
  if (q('#lbcustom')) q('#lbcustom').onclick = (e) => { e.stopPropagation(); locker.style.display = 'block'; renderLocker(); };
  lobby.querySelectorAll('.lbpick[data-drop]').forEach((el) => { el.onclick = (e) => { e.stopPropagation(); Meta.takeContract(''); renderLobby(); }; });
  lobby.querySelectorAll('.lbpick[data-cls]').forEach((el) => { el.onclick = (e) => { e.stopPropagation(); Meta.setCls(el.dataset.cls); renderLobby(); }; });
  lobby.querySelectorAll('.lbpick[data-map]').forEach((el) => { el.onclick = (e) => { e.stopPropagation(); if (el.classList.contains('locked')) return; Meta.setMap(+el.dataset.map); Net.setMap(+el.dataset.map); renderLobby(); }; });
  lobby.querySelectorAll('.lbpick.locked[data-why]').forEach((el) => { el.addEventListener('click', (e) => { e.stopPropagation(); lobbyInfo[el.dataset.grp] = `${el.querySelector('b').textContent}: ${el.dataset.why}`; renderLobby(); }, true); });
  lobby.querySelectorAll('.lbpick[data-mu]').forEach((el) => { el.onclick = (e) => { e.stopPropagation(); if (Meta.dailyOn()) return; Meta.toggleMut(+el.dataset.mu); renderLobby(); }; });
  lobby.querySelectorAll('.lbpick[data-daily]').forEach((el) => { el.onclick = (e) => { e.stopPropagation(); Meta.setDaily(!Meta.dailyOn()); Net.setMap(Meta.map()); renderLobby(); }; });
  lobby.querySelectorAll('.lbpick[data-df]').forEach((el) => { el.onclick = (e) => { e.stopPropagation(); if (el.classList.contains('locked')) return; Meta.setDifficulty(+el.dataset.df); renderLobby(); }; });
  lobby.querySelectorAll('.lbpick[data-heir]').forEach((el) => { el.onclick = (e) => { e.stopPropagation(); if (el.classList.contains('locked')) return; delete lobbyInfo.h; Meta.setHeirloom(el.dataset.heir); renderLobby(); }; });
  lobby.querySelectorAll('.lbpick[data-w]').forEach((el) => { el.onclick = (e) => { e.stopPropagation(); if (el.classList.contains('locked')) return; delete lobbyInfo.w; Meta.setStarter(el.dataset.w); renderLobby(); }; });
  lobby.querySelectorAll('.lbpick[data-carry]').forEach((el) => { el.onclick = (e) => { e.stopPropagation(); Meta.setCarry(el.dataset.carry); renderLobby(); }; });
  if (q('#lbstart')) q('#lbstart').onclick = (e) => { e.stopPropagation(); saveName(); if (!Net.active) Net.name = myName(); beginRun(); };
}
let beginning = false;
async function beginRun() {
  if (beginning) return;
  // the map is chosen in the lobby (the host's choice in co-op); if it is not the one standing, build it now
  const K = Net.role !== 'client' ? Meta.contractRules() : null, DSC = Math.max(0, MAPS.findIndex((M) => M.mode === 'descent'));
  const hm = Net.role === 'client' ? Net.hostMap() : K ? (K.mode === 'descent' ? DSC : K.map) : Meta.map(), want = MAPS[hm] ? hm : DSC;
  vui.close(); vmode = ''; if (game.village) game.village.leave();
  if (want !== game.mapId && game.round === 0) { beginning = true; lobby.style.display = 'none'; await rebuildGame(want); beginning = false; }
  if (Net.role !== 'client') { setDifficulty(K ? K.diff : Meta.difficulty()); setMutators(K ? K.muts : 0, 0); }
  // the Descent: through the Way Down and straight into the first room (a guest follows the host down)
  if (game.descent && (game.phase === 'Village' || game.phase === 'PreGame') && Net.role !== 'client') { game.phase = 'PreGame'; game.phaseTimer = 0.01; }
  if (game.round === 0) { game.player.setBody(Meta.look()); game.player.setClass(Meta.cls()); }
  lobby.style.display = 'none'; locker.style.display = 'none';
  // apply the chosen starting weapon to a fresh run
  const P = game.player, idx = game.data.weapons.findIndex((w) => w.name === Meta.starter());
  if (idx > 0 && game.round === 0 && P.weapons[0].def === 0) { P.weapons[0].def = idx; P.weapons[0].tier = 0; P.refillAll(); game.vm.setWeapon(idx, 0, false); }
  // a fresh run: start the renown tally, and hand over the heirloom
  if (game.round === 0 && !game.metaRun) {
    game.metaRun = true; Meta.beginRun();
    
    // what each class carries in from the start: the sniper has a sniper rifle on the back as well as the starting gun,
    // and the brawler brings a katana instead of a knife
    if (P.cls.id === 'sniper') { const si = game.data.weapons.findIndex((w) => w.name === 'Widowmaker'), first = P.active; if (si > 0 && !P.weapons.some((S) => S.def === si)) { P.giveWeapon(si); P.switchTo(first); game.vm.setWeapon(P.weapons[first].def, 0, false); } }
    if (P.cls.id === 'brawler') { const ki = MELEE.findIndex((m) => /katana/i.test(m.name)); if (ki >= 0) P.meleeDef = ki; }
    // the Descent: an ascended gun may go down with you
    if (game.descent) {
      const cn = Meta.carry(), ci = cn ? game.data.weapons.findIndex((w) => w.name === cn && !w.cash) : -1;
      if (ci > 0) { P.weapons[0].def = ci; P.weapons[0].tier = 0; P.weapons[0].mods = []; P.weapons[0].evoK = 0; P.recompute(); P.refillAll(); game.vm.setWeapon(ci, 0, false); game.hud.toast(`Carried: ${cn}  -  ascended ${ROMAN[Meta.asc(cn)]}`, '#ff8cff'); }
    }
  }
  game.touch = TOUCH;
  if (Net.role === 'client' && game.round === 0) { const a = Math.random() * 6.28; P.pos.x += Math.cos(a) * 130; P.pos.z += Math.sin(a) * 130; }   // don't spawn inside the host
  start();
}
// The party, standing in a row at the top of the lobby, each as they look right now. It is drawn with the character
// screen's renderer (one preview context for the page) and copied onto the lobby's own canvas.
let lineScene = null, lineCam = null, lineT = 0; const lineChars = [];
function tickLineup(dt) {
  const cv = lobby.querySelector('#lbline');
  if (!cv || lobby.style.display !== 'block' || locker.style.display === 'block') return;
  ensureLock(); if (!lockR) return;
  if (!lineScene) { lineScene = new THREE.Scene(); lineCam = new THREE.PerspectiveCamera(24, cv.width / cv.height, 10, 6000); }
  const list = (Net.active ? Net.lobbyList() : [{ name: (lobby.querySelector('#lname') || {}).value || Net.name || 'Player', me: true, look: Meta.lookStr() }]).slice(0, 4);
  const n = list.length, gap = 170;
  list.forEach((p, i) => {
    const look = p.look || Meta.lookStr(), C = lineChars[i];
    if (!C || C.look !== look) { if (C) lineScene.remove(C.ch); const ch = buildCharacter(parseLook(look)); lineScene.add(ch); lineChars[i] = { ch, look }; }
    const ch = lineChars[i].ch; ch.position.set((i - (n - 1) / 2) * gap, 0, 0); ch.visible = true; lineChars[i].name = p.name; lineChars[i].me = p.me;
  });
  for (let i = n; i < lineChars.length; i++) if (lineChars[i]) lineChars[i].ch.visible = false;
  lineT += dt;
  for (let i = 0; i < n; i++) { const ch = lineChars[i].ch; ch.rotation.y = Math.sin(lineT * 0.5 + i * 1.7) * 0.35; animateCharacter(ch, lineT + i * 0.8, 0, { preview: true }); }
  const tall = Math.max(...lineChars.slice(0, n).map((c) => (c.ch.userData.rig && c.ch.userData.rig.topY) || 220)) + 20, span = (n - 1) * gap + 180;
  const dist = Math.max(tall * 2.4, span * 1.9 / (cv.width / cv.height));
  lineCam.position.set(0, tall * 0.52, dist); lineCam.lookAt(0, tall * 0.46, 0); lineCam.aspect = cv.width / cv.height; lineCam.updateProjectionMatrix();
  lockR.setSize(cv.width, cv.height, false); lockR.setPixelRatio(1); lockR.render(lineScene, lineCam);
  const x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height); x.drawImage(lockCanvas, 0, 0, cv.width, cv.height);
  // names under the feet
  x.textAlign = 'center'; x.font = '400 30px "Big Shoulders Display", sans-serif';
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3((i - (n - 1) / 2) * gap, -6, 0).project(lineCam), sx = (v.x * 0.5 + 0.5) * cv.width, sy = Math.min(cv.height - 10, (-v.y * 0.5 + 0.5) * cv.height + 34);
    x.fillStyle = 'rgba(20,10,16,0.8)'; const t = String(lineChars[i].name || '').toUpperCase().slice(0, 14), w = x.measureText(t).width + 18; x.fillRect(sx - w / 2, sy - 27, w, 34);
    x.fillStyle = lineChars[i].me ? '#ffcd5a' : '#f2e8d5'; x.fillText(t, sx, sy);
  }
}
function tickLobby(dt) {
  tickLineup(dt);
  if (lobby.style.display !== 'block') return;
  lobbyTimer -= dt; if (lobbyTimer > 0) return; lobbyTimer = 0.4;
  if (Net.role === 'client') {
    if (Net.hostStarted()) { beginRun(); return; }
    if (!Net.hostHere()) { Net.leave(); lobbyMsg = 'The host closed the lobby.'; renderLobby(); return; }
  }
  const sig = Net.hostMap() + '|' + Net.role + '|' + (Net.active ? Net.lobbyList().map((p) => p.name).join(',') : '') + '|' + !!Net.lobby + '|' + Net.tried;
  if (sig !== lobbySig) { lobbySig = sig; renderLobby(); }
}
lobby.addEventListener('click', (e) => e.stopPropagation());
Net.init().then(() => { Net.tried = true; });
document.getElementById('playbtn').addEventListener('click', (e) => { e.stopPropagation(); if (game) goVillage(); });
document.getElementById('setbtn').addEventListener('click', (e) => { e.stopPropagation(); pauseEl.classList.add('menu'); pauseEl.querySelector('h2').textContent = 'SETTINGS'; pauseEl.querySelector('#presume').textContent = 'DONE'; pauseEl.style.display = 'flex'; });
document.getElementById('charbtn').addEventListener('click', (e) => { e.stopPropagation(); locker.style.display = 'block'; renderLocker(); });   // the same character screen the lobby opens
document.getElementById('progbtn').addEventListener('click', (e) => { e.stopPropagation(); if (Meta.claimable().length) progTab = tabOf(Meta.claimable()[0].key); renderProgress(); prog.style.display = 'block'; prog.scrollTop = 0; });
hudCanvas.addEventListener('click', () => {
  if (!game) return;
  if (game.player.dead && !game.coopDown && game.time - (game.deathTime || 0) > 2) { restartRun(); return; }
});
document.addEventListener('pointerlockchange', () => {
  if (TEST || lockFailed) return;
  if (!document.pointerLockElement && mode === 'play' && !game.player.dead && !TOUCH) setPaused(true);
});

// ---- fullscreen with the keyboard held. A page cannot stop Ctrl+W (close the tab), Ctrl+Tab, Ctrl+T or Ctrl+N: the
// browser takes those before the page hears of them. In a fullscreen the page itself asked for, Chromium browsers
// (Chrome, Edge, Opera) let it hold named keys with every modifier, so sliding on Ctrl while moving forward, opening the
// upgrade list or reloading is safe. Esc is not held: it still leaves fullscreen and frees the mouse.
const LOCK_KEYS = ['KeyG', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR', 'KeyT', 'KeyN', 'KeyQ', 'KeyE', 'KeyF', 'KeyX', 'KeyV', 'KeyC', 'KeyB', 'KeyH', 'KeyP', 'Tab', 'Space', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'F3', 'PageUp', 'PageDown'];
const fsOn = () => !!document.fullscreenElement;
const canHoldKeys = () => !!(navigator.keyboard && navigator.keyboard.lock);
function holdKeys() {
  try { if (canHoldKeys()) { if (fsOn()) navigator.keyboard.lock(LOCK_KEYS).catch(() => {}); else navigator.keyboard.unlock(); } } catch (e) { /* not allowed here */ }
  const b = document.getElementById('pfull'); if (b) b.textContent = 'FULLSCREEN: ' + (fsOn() ? 'ON' : 'OFF');
}
async function setFullscreen(on, quiet) {
  try {
    if (on && !fsOn()) await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    else if (!on && fsOn()) await document.exitFullscreen();
  } catch (e) { if (!quiet) hud.toast('Fullscreen is not available here', '#ffcd5a'); }
  holdKeys();
}
document.addEventListener('fullscreenchange', holdKeys);

// ---- pause / settings panel
const pauseEl = document.getElementById('pause');
function applySettings() {
  if (game) { game.settings.fov = settings.fov || 100; game.settings.shake = settings.shake ?? 1; }
  audio.setMasterVol(settings.volume ?? 0.8); audio.setSfxVol(settings.sfx ?? 1); audio.setMusicVol(settings.music ?? 0.5);
}
function setPaused(p) {
  pauseEl.classList.remove('menu'); pauseEl.querySelector('h2').textContent = 'PAUSED'; pauseEl.querySelector('#presume').textContent = 'RESUME';
  if (p) { mode = 'paused'; keys.clear(); mouseL = mouseR = false; stick.x = stick.y = 0; touchFire = false; }
  else { mode = 'play'; if (settings.fullscreen && !fsOn()) setFullscreen(true, true); requestLock(); }
  pauseEl.style.display = p ? 'flex' : 'none';
  const box = pauseEl.querySelector('#pdmg');
  if (box && p && game) { const R = game.player.damageReport().slice(0, 6); box.innerHTML = R.length ? '<h3>DAMAGE TAKEN THIS RUN</h3>' + R.map((r) => `<div><b>${r.pct}%</b> ${r.who.replace(/[<>&]/g, '')} <i>${r.total} over ${r.hits} hit${r.hits > 1 ? 's' : ''}, biggest ${r.max}</i></div>`).join('') : ''; }
}
const SLIDERS = [['sens', 'Mouse sensitivity', 0.02, 0.5, 0.01, 0.11], ['fov', 'Field of view', 80, 120, 1, 100], ['volume', 'Master volume', 0, 1, 0.05, 0.8], ['sfx', 'Sound effects', 0, 1, 0.05, 1], ['music', 'Music', 0, 1, 0.05, 0.5], ['shake', 'Screen shake', 0, 1.5, 0.1, 1]];
const SET_GROUPS = [['CONTROLS', ['sens', 'fov']], ['AUDIO', ['volume', 'sfx', 'music']], ['FEEL', ['shake']]];
const fmtSet = (k, v) => { v = parseFloat(v); return k === 'fov' ? `${Math.round(v)}°` : k === 'sens' ? (v * 100).toFixed(0) : `${Math.round(v * 100)}%`; };
const sliderHtml = (k) => { const [, label, mn, mx, st] = SLIDERS.find((s) => s[0] === k); return `<label><span>${label}</span><input type="range" data-k="${k}" min="${mn}" max="${mx}" step="${st}"><b></b></label>`; };
pauseEl.innerHTML = '<div class="pbox"><div class="phd"><h2>PAUSED</h2></div><div class="pcols"><div class="pcol">' + SET_GROUPS.map(([t, ks]) => `<h3 class="psec">${t}</h3>` + ks.map(sliderHtml).join('')).join('') + `<div class="pfs"><button id="pfull">FULLSCREEN: OFF</button><span>${canHoldKeys() ? 'In fullscreen the game also holds Ctrl+W, Ctrl+Tab and Ctrl+T, so sliding on Ctrl cannot close or switch the tab.' : 'This browser cannot stop Ctrl+W closing the tab: slide with C rather than Ctrl.'}</span></div><div class="pfs"><button id="ptips">SHOW TIPS AGAIN</button><span>Tips explain each thing once, the first time you meet it.</span></div></div><div class="pcol"><div id="pdmg"></div>` + '<div class="pradio"><div class="prh"><h3 class="psec">RADIO</h3><span id="prn"></span><button id="pradd">ADD SONGS</button><button id="prclr">CLEAR</button><input id="prfile" type="file" multiple accept="audio/*,.mp3,.ogg,.wav,.m4a,.flac" hidden></div><div id="prlist"></div><p>← restarts the song, → skips. Songs stay in this browser and are never uploaded. In co-op only the host needs songs: everyone hears the host’s radio.</p></div>' + `<h3 class="psec">MENU SONG</h3><div class="pfs"><button id="pmenu">CHOOSE FILE</button><button id="pmenuclr">CLEAR</button><span id="pmenun"></span><input id="pmenufile" type="file" accept="audio/*,.mp3,.ogg,.wav,.m4a,.flac" hidden></div></div></div>` + '<div class="pbtns"><button id="presume">RESUME</button><button id="prestart">BACK TO THE VILLAGE</button><button id="pquit">QUIT TO TITLE</button></div></div>';
pauseEl.querySelectorAll('input[type=range]').forEach((el) => {
  const def = SLIDERS.find((s) => s[0] === el.dataset.k)[5];
  el.value = settings[el.dataset.k] ?? def; el.nextElementSibling.textContent = fmtSet(el.dataset.k, el.value);
  el.oninput = () => { settings[el.dataset.k] = parseFloat(el.value); el.nextElementSibling.textContent = fmtSet(el.dataset.k, el.value); applySettings(); saveSettings(); };
});
{ // the radio's shelf
  const R = audio.radio, n = pauseEl.querySelector('#prn'), list = pauseEl.querySelector('#prlist'), file = pauseEl.querySelector('#prfile');
  const draw = () => { n.textContent = R.tracks.length ? `${R.tracks.length} song${R.tracks.length > 1 ? 's' : ''}` : 'empty'; list.textContent = ''; for (const T of R.tracks) { const d = document.createElement('div'); d.textContent = T.title; if (R.cur >= 0 && R.tracks[R.cur] === T) d.className = 'on'; list.appendChild(d); } };
  R.onChange = draw; draw();
  pauseEl.querySelector('#pradd').onclick = () => file.click();
  file.onchange = async () => { n.textContent = 'loading\u2026'; await R.addFiles([...file.files]); file.value = ''; draw(); };
  pauseEl.querySelector('#prclr').onclick = () => { R.clear(); };
  // the main-menu song: chosen once, kept in this browser, played whenever the title screen or the lobby is up
  const mAudio = document.createElement('audio'); mAudio.loop = true; let mUrl = '', mFor = null;
  const BUILT_IN = { url: 'menu_song.mp3', title: 'Lucky You' };   // the game's own menu song; a file the player picks takes its place
  const mName = pauseEl.querySelector('#pmenun'), mFile = pauseEl.querySelector('#pmenufile');
  const mSync = () => {
    const S = R.menuSong || BUILT_IN; mName.textContent = R.menuSong ? R.menuSong.title : 'Lucky You (built in)  -  pick a file to use your own';
    const want = !!S && (title.style.display !== 'none' || lobby.style.display === 'block') && !document.hidden;
    if (S !== mFor) { mAudio.pause(); mGain = 0; if (mUrl) URL.revokeObjectURL(mUrl); mUrl = S && S.data ? URL.createObjectURL(new Blob([S.data], { type: S.type || 'audio/mpeg' })) : ''; mAudio.src = S && S.url ? S.url : mUrl; mFor = S || null; }
    mWant = want;
    if (want && mAudio.paused) { mGain = 0; mAudio.volume = 0; mAudio.play().catch(() => { /* waits for the first click */ }); }
  };
  // the song never cuts: it swells in over a second and a half when a menu comes up and falls away as the game takes over
  let mWant = false, mGain = 0, mLast = performance.now();
  setInterval(() => {
    const now = performance.now(), dt = Math.min(0.2, (now - mLast) / 1000); mLast = now;
    if (mAudio.paused && !mWant) { mGain = 0; return; }
    mGain = mWant ? Math.min(1, mGain + dt / 1.6) : Math.max(0, mGain - dt / 1.1);
    const e = mGain * mGain * (3 - 2 * mGain);
    mAudio.volume = Math.max(0, Math.min(1, (audio.musicVol ?? 0.5) * 0.4 * e));
    if (!mWant && mGain <= 0 && !mAudio.paused) mAudio.pause();
  }, 40);
  setInterval(mSync, 200); window.addEventListener('pointerdown', mSync); R.ready.then(mSync);
  pauseEl.querySelector('#pmenu').onclick = () => mFile.click();
  mFile.onchange = async () => { mName.textContent = 'loading\u2026'; await R.setMenu(mFile.files[0]); mFile.value = ''; mSync(); };
  pauseEl.querySelector('#pmenuclr').onclick = async () => { await R.clearMenu(); mSync(); };
  new MutationObserver(() => { if (pauseEl.style.display !== 'none') draw(); }).observe(pauseEl, { attributes: true, attributeFilter: ['style'] });
}
pauseEl.querySelector('#ptips').onclick = (e) => { Meta.tipsReset(); Meta.save(); e.target.textContent = 'TIPS WILL SHOW AGAIN'; };
pauseEl.querySelector('#presume').onclick = () => { if (pauseEl.classList.contains('menu')) { pauseEl.classList.remove('menu'); pauseEl.style.display = 'none'; } else setPaused(false); };
pauseEl.querySelector('#pfull').onclick = () => { const on = !fsOn(); settings.fullscreen = on; saveSettings(); setFullscreen(on); };
pauseEl.querySelector('#pquit').onclick = () => { pauseEl.style.display = 'none'; restartRun('title'); };
pauseEl.querySelector('#prestart').onclick = () => { pauseEl.style.display = 'none'; restartRun(); };   // home to the village
addEventListener('keydown', (e) => { if (e.code === 'KeyP' && game && mode === 'play' && !game.player.dead) { if (document.pointerLockElement) document.exitPointerLock(); setPaused(true); } });

// ---- a fresh game on the same renderer, audio and assets (a restart, or a different map)
async function rebuildGame(mapId) {
  title.style.display = 'flex'; progBadge(); document.body.classList.remove('ready'); status(MAPS[mapId].loading);
  await loadCreaturePack(MAPS[mapId].pack);
  await new Promise((r) => setTimeout(r, 30));
  hud.toasts = []; hud.banners = []; hud.floaters = []; hud.roundBanner = null; hud.helpT = 99;
  game = new Game(renderer, audio, hud, mapId);
  game.settings = Object.assign(game.settings, settings);
  await game.build();
  window.__dmh = game;
  status(''); document.body.classList.add('ready'); title.style.display = 'none';
}
let restarting = false;
async function restartRun(toMenu) {
  if (restarting) return; restarting = true;
  if (toMenu === 'title' && Net.active) Net.leave();   // home to the village keeps the party together; the title ends it
  vui.close(); vmode = ''; locker.style.display = 'none'; lobby.style.display = 'none';
  mode = 'title'; title.style.display = 'flex'; progBadge(); document.body.classList.remove('ready'); status(toMenu === 'title' ? 'Dealing a new hand...' : 'Walking home to Thimblewick...');
  await new Promise((r) => setTimeout(r, 30));
  hud.toasts = []; hud.banners = []; hud.floaters = []; hud.roundBanner = null; hud.helpT = 99;
  const DSC = Math.max(0, MAPS.findIndex((M) => M.mode === 'descent'));
  if (MAPS[DSC].pack) await loadCreaturePack(MAPS[DSC].pack);
  game = new Game(renderer, audio, hud, DSC);
  game.settings = Object.assign(game.settings, settings);
  await game.build();
  window.__dmh = game;
  status(''); document.body.classList.add('ready'); restarting = false;
  if (toMenu === 'title') { if (TOUCH) document.getElementById('touch').style.display = 'none'; if (document.pointerLockElement) document.exitPointerLock(); audio.music('off'); return; }
  enterVillage();
}
// ---- Thimblewick: PLAY puts you in the village (built into the Descent's map); runs start at the Way Down
let vmode = '';   // which village window has the mouse: 'gate', 'wardrobe', or '' (the shop, board and casino are vui's)
function panelIn() { mode = 'craft'; keys.clear(); mouseL = mouseR = false; stick.x = stick.y = 0; touchFire = false; if (document.pointerLockElement) document.exitPointerLock(); }
function panelOut() { if (mode === 'craft') { mode = 'play'; keys.clear(); mouseL = mouseR = false; requestLock(); } }
function enterVillage() {
  if (!game || !game.villageRT) return;
  game.player.setBody(Meta.look()); game.player.setClass(Meta.cls());
  game.villageRT.enter(); title.style.display = 'none'; lobby.style.display = 'none'; locker.style.display = 'none';
  start(); game.vm.hidden = true;
  if (!Meta.tipSeen('village1')) { Meta.tipMark('village1'); hud.tip('Welcome to Thimblewick. Walk up to anything lit and press E: the shop on the square, your wardrobe at home, the challenge board, the casino under the big toadstool. The Way Down is at the north end of the road.'); }
}
async function goVillage() {
  const DSC = Math.max(0, MAPS.findIndex((M) => M.mode === 'descent'));
  if (!game || game.mapId !== DSC || game.metaRun || game.round > 0 || game.phase === 'GameOver') { await restartRun(false); return; }
  enterVillage();
}
function onVillage(kind, arg) {
  if (kind === 'wardrobe') { vmode = 'wardrobe'; panelIn(); locker.style.display = 'block'; renderLocker(); }
  else if (kind === 'gate') { vmode = 'gate'; panelIn(); lobbyMsg = ''; lobby.style.display = 'block'; renderLobby(); }
  else vui.show(kind, arg);
}

// ---- touch controls: left thumb moves, right thumb looks, buttons for everything else
const TOUCH = !TEST && ('ontouchstart' in window) && matchMedia('(pointer: coarse)').matches;
const stick = { x: 0, y: 0 };
let touchFire = false, touchAim = false, touchJump = false;
if (TOUCH) {
  const T = document.getElementById('touch');
  const btn = (id, label, cls, down, up) => { const b = document.createElement('div'); b.className = 'tb ' + cls; b.textContent = label; b.id = id; T.appendChild(b);
    b.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); down(); b.classList.add('on'); }, { passive: false });
    b.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); if (up) up(); b.classList.remove('on'); }, { passive: false }); return b; };
  btn('tfire', 'FIRE', 'big', () => { touchFire = true; edges.firePressed = 1; }, () => { touchFire = false; });
  btn('tjump', 'JUMP', '', () => { edges.jump = 1; touchJump = true; }, () => { touchJump = false; });
  btn('tdash', 'DASH', '', () => { edges.dash = 1; });
  btn('tslide', 'SLIDE', '', () => { edges.slide = 1; }, () => { edges.slideUp = 1; });
  btn('taim', 'AIM', '', () => { touchAim = !touchAim; });
  btn('treload', 'RELOAD', 'sm', () => { edges.reload = 1; });
  btn('tuse', 'USE', 'sm', () => { edges.interact = 1; });
  btn('tmelee', 'MELEE', '', () => { edges.melee = 1; });
  btn('tgren', 'NADE', 'sm', () => { edges.grenade = 1; });
  btn('thook', 'HOOK', 'sm', () => { edges.grapple = 1; });
  btn('tswap', 'SWAP', 'sm', () => { edges.next = 1; });
  btn('ttab', 'TAB', 'sm', () => { edges.back = 1; });
  btn('tinfo', '?', 'sm', () => { if (game && game.player.menu) game.player.menuHelp = !game.player.menuHelp; });
  btn('tpause', 'II', 'sm', () => { if (mode === 'play') setPaused(true); });
  for (let i = 0; i < 4; i++) btn('tc' + i, String(i + 1), 'sm num', () => { edges.choice[i] = 1; });
  let moveId = null, lookId = null, mo = null, lo = null;
  T.addEventListener('touchstart', (e) => { if (game && game.victory) { game.victory = false; if (game.levelDone) restartRun(true); } else if (game && game.player.dead && !game.coopDown && game.time - (game.deathTime || 0) > 2) { restartRun(); return; } for (const t of e.changedTouches) { if (t.clientX < innerWidth * 0.45 && moveId === null) { moveId = t.identifier; mo = [t.clientX, t.clientY]; } else if (lookId === null) { lookId = t.identifier; lo = [t.clientX, t.clientY]; } } e.preventDefault(); }, { passive: false });
  T.addEventListener('touchmove', (e) => { for (const t of e.changedTouches) {
    if (t.identifier === moveId) { stick.x = Math.max(-1, Math.min(1, (t.clientX - mo[0]) / 60)); stick.y = Math.max(-1, Math.min(1, -(t.clientY - mo[1]) / 60)); }
    else if (t.identifier === lookId) { lookX += (t.clientX - lo[0]) * 2.2; lookY += (t.clientY - lo[1]) * 2.2; lo = [t.clientX, t.clientY]; } } e.preventDefault(); }, { passive: false });
  const end = (e) => { for (const t of e.changedTouches) { if (t.identifier === moveId) { moveId = null; stick.x = stick.y = 0; } if (t.identifier === lookId) lookId = null; } };
  T.addEventListener('touchend', end); T.addEventListener('touchcancel', end);
}

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  glCanvas.style.width = w + 'px'; glCanvas.style.height = h + 'px';
}
addEventListener('resize', resize);

// the Descent's workbench window: the game goes on underneath (co-op does not stop), but you are not steering
const craft = makeCraft({
  game: () => game, audio, preview: () => { ensureLock(); return lockR ? { R: lockR, canvas: lockCanvas } : null; },
  entered: () => { mode = 'craft'; keys.clear(); mouseL = mouseR = false; stick.x = stick.y = 0; touchFire = false; if (document.pointerLockElement) document.exitPointerLock(); },
  left: () => { if (mode === 'craft') { mode = 'play'; keys.clear(); mouseL = mouseR = false; requestLock(); } },
});
window.__craft = craft;
const vui = makeVillageUI({
  audio, preview: () => { ensureLock(); return lockR ? { R: lockR, canvas: lockCanvas } : null; }, thumb: (k, n) => modelThumb(k, n),
  entered: panelIn, left: panelOut, toast: (t, c) => hud.toast(t, c), looked: () => { Net.refreshPresence(); if (game) game.player.setBody(Meta.look()); },
});
window.__vui = vui; window.__metaOff = () => Meta.setUnlockAll(false); window.__Meta = Meta; window.__village = { onVillage, enterVillage, goVillage };
let last = performance.now(), fpsAcc = 0, fpsN = 0, villT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  tickLocker(dt); tickLobby(dt); craft.tick(dt); vui.tick(dt);
  if (game && !game.openCraft) game.openCraft = (blade, mode) => craft.show(blade, mode);
  if (game && !game.onVillage) game.onVillage = onVillage;
  // a guest in the village goes down when the host does
  if (game && game.village && game.village.on && Net.role === 'client' && !beginning) { villT = (villT || 0) - dt; if (villT <= 0) { villT = 0.4; if (Net.hostStarted()) beginRun(); } }
  if (mode === 'craft' && craft.isOpen() && (!game || game.player.dead || !game.descent)) craft.close();
  hud.needMouse = mode === 'play' && !TEST && !TOUCH && !lockFailed && !document.pointerLockElement;
  if (window.__dmhFixedDt) dt = window.__dmhFixedDt;
  fpsAcc += dt; fpsN++; if (fpsAcc > 0.5) { hud.fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; }
  if (!game) { hud.draw(null, dt, 'title'); return; }
  if (mode === 'play') {
    const In = readInput();
    if (!window.__dmhHold) { try { game.step(dt, In); } catch (e) { if (!window.__dmhErr) { window.__dmhErr = true; console.error(e); } } }
  } else if (mode === 'craft') {
    keys.clear(); mouseL = mouseR = false; lookX = lookY = 0;
    const In = readInput();
    if (!window.__dmhHold) { try { game.step(dt, In); } catch (e) { if (!window.__dmhErr) { window.__dmhErr = true; console.error(e); } } }
  } else if (mode === 'title') {
    game.vm.hidden = true;
    // slow attract camera while on the title card
    game.player.yaw += dt * 0.05;
    game.player.updateCamera(dt);
    game.env.update(dt, game.camera.position, game.zone);
  }
  game.render();
  hud.draw(game, mode === 'play' || mode === 'paused' || mode === 'craft' ? dt : 0, mode);
}
requestAnimationFrame(frame);
boot().catch((e) => { console.error(e); status('Failed to load: ' + e.message); });

// ------------------------------------------------------------------ test hooks (headless play-testing)
window.__setMode = (m) => { if (TEST) mode = m; };
window.__sim = (n, inp = {}, dt = 1 / 60) => {
  const base = { fwd: 0, right: 0, sprint: false, slideHeld: false, fire: false, aim: false, lookX: 0, lookY: 0, jump: 0, slide: 0, slideUp: 0, dash: 0, grapple: 0, reload: 0, interact: 0, back: 0, next: 0, prev: 0, firePressed: 0, ping: 0, choice: [0, 0, 0, 0] };
  const t0 = performance.now();
  for (let i = 0; i < n; i++) {
    const In = Object.assign({}, base, typeof inp === 'function' ? inp(i) : inp);
    if (i > 0 && typeof inp !== 'function') { for (const k of ['jump', 'slide', 'slideUp', 'dash', 'grapple', 'reload', 'interact', 'back', 'next', 'prev', 'firePressed']) In[k] = 0; In.choice = [0, 0, 0, 0]; }
    game.step(dt, In);
    hud.time += dt;
  }
  return performance.now() - t0;
};
