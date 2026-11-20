// Boot: fonts, atlases, audio, world build, input (pointer lock + keyboard), fixed-ish game loop.
import { DIFFS, difficulty, setDifficulty, zombieCount, maxAlive, zombieHealth } from './data.js';
import { preloadGunSounds } from './gunsound.js';
import { buildCharacter, animateCharacter } from './character.js';
import { COSMETICS, SLOTS, SLOT_NAMES, needText } from './cosmetics.js';
import { Net } from './net.js';
import * as THREE from 'three';
import { loadAtlas, Atlas } from './render.js';
import { setParts } from './puppet.js';
import { Audio } from './audio.js';
import { Hud } from './hud.js';
import { Game } from './game.js';
import { STARTERS } from './meta.js';
import { Meta, ACHIEVEMENTS, SKINS, GUN_LEVELS, GUN_TRAITS, rewardText } from './meta.js';

THREE.ColorManagement.enabled = false;
const params = new URLSearchParams(location.search);
const TEST = params.has('test');
Meta.load(); Meta.setUnlockAll(TEST);

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
const edges = { grenade: 0, jump: 0, slide: 0, slideUp: 0, dash: 0, grapple: 0, reload: 0, interact: 0, barricade: 0, melee: 0, back: 0, next: 0, prev: 0, firePressed: 0, choice: [0, 0, 0, 0] };
let mouseL = false, mouseR = false, lookX = 0, lookY = 0;
let settings = {};
try { settings = JSON.parse(localStorage.getItem('dmh-settings') || '{}') || {}; } catch (e) { settings = {}; }
const sens = () => settings.sens || 0.11;
const BIND = {
  KeyW: 'fwd', ArrowUp: 'fwd', KeyS: 'back_', ArrowDown: 'back_', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
};
function onKey(e, down) {
  const c = e.code;
  if (['Tab', 'Space', 'ControlLeft', 'KeyC', 'ArrowUp', 'ArrowDown'].includes(c) || (e.ctrlKey && c !== 'KeyR')) e.preventDefault();
  if (down) {
    if (e.repeat) return;
    keys.add(c);
    switch (c) {
      case 'Space': edges.jump = 1; break;
      case 'KeyC': case 'ControlLeft': edges.slide = 1; break;
      case 'ShiftLeft': case 'ShiftRight': edges.dash = 1; break;
      case 'KeyF': edges.grapple = 1; break;
      case 'KeyR': edges.reload = 1; break;
      case 'KeyE': edges.interact = 1; break;
      case 'KeyB': edges.barricade = 1; break;
      case 'KeyQ': edges.melee = 1; break;
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
addEventListener('keyup', (e) => onKey(e, false));
addEventListener('blur', () => { keys.clear(); mouseL = mouseR = false; });
glCanvas.addEventListener('contextmenu', (e) => e.preventDefault());
hudCanvas.addEventListener('contextmenu', (e) => e.preventDefault());
addEventListener('mousedown', (e) => {
  if (mode !== 'play') return;
  if (!TEST && !TOUCH && !lockFailed && !document.pointerLockElement) { requestLock(); return; }   // this click takes the mouse back; it does not fire
  if (e.button === 0) { mouseL = true; edges.firePressed = 1; }
  if (e.button === 2) mouseR = true;
});
addEventListener('mouseup', (e) => { if (e.button === 0) mouseL = false; if (e.button === 2) mouseR = false; });
addEventListener('mousemove', (e) => {
  if (mode !== 'play' || TOUCH || (!document.pointerLockElement && !TEST && !lockFailed)) return;
  lookX += e.movementX || 0; lookY += e.movementY || 0;
});
addEventListener('wheel', (e) => { if (mode !== 'play') return; if (e.deltaY > 0) edges.next = 1; else if (e.deltaY < 0) edges.prev = 1; }, { passive: true });

function readInput() {
  const In = {
    fwd: Math.max(-1, Math.min(1, (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) + stick.y)),
    right: Math.max(-1, Math.min(1, (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) + stick.x)),
    sprint: false,
    slideHeld: keys.has('KeyC') || keys.has('ControlLeft'),
    fire: mouseL || touchFire, aim: mouseR || touchAim,
    lookX: lookX * sens(), lookY: lookY * sens(),
    jump: edges.jump, slide: edges.slide, slideUp: edges.slideUp, dash: edges.dash, grapple: edges.grapple, reload: edges.reload,
    interact: edges.interact, barricade: edges.barricade, melee: edges.melee, grenade: edges.grenade, back: edges.back, next: edges.next, prev: edges.prev, firePressed: edges.firePressed, choice: edges.choice.slice(),
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
  status('Building Deadwater Gulch...');
  await new Promise((r) => setTimeout(r, 20));
  game = new Game(renderer, audio, hud);
  game.settings = Object.assign(game.settings, settings);
  await game.build();
  window.__dmh = game;
  window.__diffTest = { setDifficulty, zombieCount, maxAlive, zombieHealth };
  status('');
  document.body.classList.add('ready');
  resize();
  if (TEST) start();
}
function start() {
  audio.unlock();
  audio.master && (audio.master.gain.value = 0.8);
  preloadGunSounds(audio);
  audio.preload(['S_Pistol', 'S_Revolver', 'S_HitFlesh', 'S_HitFlesh2', 'S_HitMarker', 'S_Kill', 'S_Step0', 'S_Step1', 'S_Step2', 'S_Step3', 'S_Jump', 'S_Land', 'S_Groan0', 'S_Groan1', 'S_EnemyDie', 'S_Coin', 'S_Explosion', 'S_RoundStart']);
  title.style.display = 'none';
  mode = 'play'; applySettings();
  if (TOUCH) { document.getElementById('touch').style.display = 'block'; lockFailed = true; }
  if (game) game.vm.hidden = false;
  requestLock();
}
// ---- progress screen (achievements, gun levels, cosmetics) on the title card
const prog = document.getElementById('progress');
function renderProgress() {
  const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const st = Meta.state;
  let h = '<div class="ph"><h2>PROGRESS</h2><button id="pclose">CLOSE</button></div><div class="pcols">';
  h += '<section><h3>ACHIEVEMENTS</h3>';
  for (const A of ACHIEVEMENTS) {
    const done = !!st.ach[A.id], v = Math.min(A.need, Meta.stat(A.stat));
    h += `<div class="row ${done ? 'done' : ''}"><div class="rt"><b>${esc(A.name)}</b><span>${esc(A.desc)}</span></div><div class="rw">${done ? 'Unlocked' : 'Unlocks'}: ${esc(rewardText(A))}</div><div class="bar"><i style="width:${(v / A.need) * 100}%"></i></div><div class="num">${v.toLocaleString()} / ${A.need.toLocaleString()}</div></div>`;
  }
  h += '</section><section><h3>WEAPONS</h3>';
  const weapons = game ? game.data.weapons : [];
  for (const W of weapons) {
    const locked = Meta.gunLocked(W.name), lvl = Meta.gunLevel(W.name), xp = Meta.gunXp(W.name);
    const next = lvl < GUN_LEVELS.length ? GUN_LEVELS[lvl] : GUN_LEVELS[GUN_LEVELS.length - 1], prev = lvl > 0 ? GUN_LEVELS[lvl - 1] : 0;
    const need = ACHIEVEMENTS.find((A) => (A.guns || []).includes(W.name));
    h += `<div class="row ${locked ? 'locked' : ''}"><div class="rt"><b>${esc(W.name)}</b><span>${locked ? 'Locked: ' + esc(need.desc) : 'Level ' + lvl + ' / 5'}</span></div>`;
    if (!locked) h += `<div class="rw">${lvl < 5 ? 'Next: ' + esc(GUN_TRAITS[lvl]) : 'Mastered'}</div><div class="bar"><i style="width:${lvl >= 5 ? 100 : ((xp - prev) / (next - prev)) * 100}%"></i></div><div class="num">${xp} kills</div>`;
    h += '</div>';
  }
  h += '</section><section><h3>HANDS</h3>';
  for (const K of SKINS) {
    const ok = Meta.skinUnlocked(K.id), sel = Meta.skin().id === K.id;
    const need = ACHIEVEMENTS.find((A) => A.skin === K.id);
    const hx = (n) => '#' + n.toString(16).padStart(6, '0');
    h += `<div class="row skin ${ok ? '' : 'locked'} ${sel ? 'sel' : ''}" data-skin="${K.id}"><div class="sw"><i style="background:${hx(K.glove)}"></i><i style="background:${hx(K.cuff)}"></i><i style="background:${hx(K.sleeve)}"></i></div><div class="rt"><b>${esc(K.name)}</b><span>${ok ? (sel ? 'Equipped' : 'Click to equip') : 'Locked: ' + esc(need.desc)}</span></div></div>`;
  }
  h += `<h3 style="margin-top:18px">TOTALS</h3><div class="row"><div class="rt"><span>Runs ${Meta.stat('runs')} &nbsp; Best round ${Meta.stat('bestRound')} &nbsp; Kills ${Meta.stat('kills').toLocaleString()} &nbsp; Bosses ${Meta.stat('bosses')}</span></div></div>`;
  h += '</section></div>';
  prog.innerHTML = h;
  prog.querySelector('#pclose').onclick = (e) => { e.stopPropagation(); prog.style.display = 'none'; };
  prog.querySelectorAll('.skin').forEach((el) => { el.onclick = (e) => { e.stopPropagation(); Meta.setSkin(el.dataset.skin); if (game) game.vm.setWeapon(game.vm.weaponDef, game.vm.weaponTier, false); renderProgress(); }; });
}
prog.addEventListener('click', (e) => e.stopPropagation());
// ---- character locker: live 3D preview plus every cosmetic by slot
const locker = document.getElementById('locker');
let lockCanvas = null, lockR = null, lockScene = null, lockCam = null, lockChar = null, lockSlot = 'outfit', lockT = 0, lockSpin = 0.5;
function lockerRebuild() { if (!lockScene) return; if (lockChar) lockScene.remove(lockChar); lockChar = buildCharacter(Meta.look()); lockScene.add(lockChar); }
function renderLocker() {
  const [have, total] = Meta.cosCount();
  let h = `<div class="ph"><h2>CHARACTER</h2><span class="lcount">${have} / ${total} unlocked</span><button id="lclose">DONE</button></div><div class="lwrap"><canvas id="lcanvas" width="360" height="460"></canvas><div class="lside"><div class="ltabs">`;
  for (const sl of SLOTS) h += `<button class="ltab ${sl === lockSlot ? 'on' : ''}" data-slot="${sl}">${SLOT_NAMES[sl]}</button>`;
  h += '</div><div class="lgrid">';
  const cur = Meta.look()[lockSlot], hx = (n) => '#' + (n || 0).toString(16).padStart(6, '0');
  for (const I of COSMETICS[lockSlot]) {
    const ok = Meta.cosUnlocked(lockSlot, I.id), c1 = I.c ?? I.a, c2 = I.b ?? I.c ?? I.a;
    h += `<div class="litem ${ok ? '' : 'locked'} ${cur === I.id ? 'sel' : ''}" data-id="${I.id}"><div class="lsw">${c1 === undefined ? '' : `<i style="background:${hx(c1)}"></i><i style="background:${hx(c2)}"></i>`}</div><b>${I.name}</b><span>${ok ? (cur === I.id ? 'Equipped' : '') : needText(I)}</span></div>`;
  }
  h += '</div></div></div>';
  locker.innerHTML = h;
  locker.querySelector('#lclose').onclick = (e) => { e.stopPropagation(); locker.style.display = 'none'; Net.refreshPresence(); renderLobby(); };
  locker.querySelectorAll('.ltab').forEach((el) => { el.onclick = (e) => { e.stopPropagation(); lockSlot = el.dataset.slot; renderLocker(); }; });
  locker.querySelectorAll('.litem').forEach((el) => { el.onclick = (e) => { e.stopPropagation(); if (el.classList.contains('locked')) return; Meta.setLook(lockSlot, el.dataset.id); lockerRebuild(); renderLocker(); }; });
  // One preview canvas and one WebGL context for the life of the page. Making a new context per redraw makes
  // browsers (phones especially) throw away the oldest one, which is the game's own renderer.
  if (!lockCanvas) {
    lockCanvas = document.createElement('canvas'); lockCanvas.id = 'lcanvas'; lockCanvas.width = 360; lockCanvas.height = 460;
    try {
      lockR = new THREE.WebGLRenderer({ canvas: lockCanvas, antialias: true, alpha: true }); lockR.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); lockR.setSize(360, 460, false);
      lockScene = new THREE.Scene(); lockCam = new THREE.PerspectiveCamera(30, 360 / 460, 10, 3000); lockCam.position.set(0, 130, 610); lockCam.lookAt(0, 112, 0);
      const fl = new THREE.Mesh(new THREE.CylinderGeometry(110, 120, 8, 32), new THREE.MeshBasicMaterial({ color: 0x2a1820 })); fl.position.y = -4; lockScene.add(fl); lockerRebuild();
    } catch (err) { lockR = null; }
  }
  const cv = lockCanvas; locker.querySelector('#lcanvas').replaceWith(cv);
  let drag = null;
  cv.onpointerdown = (e) => { drag = e.clientX; cv.setPointerCapture(e.pointerId); };
  cv.onpointermove = (e) => { if (drag !== null) { lockSpin += (e.clientX - drag) * 0.012; drag = e.clientX; } };
  cv.onpointerup = () => { drag = null; };
}
function tickLocker(dt) {
  if (locker.style.display !== 'block' || !lockR || !lockChar) return;
  lockT += dt; lockChar.rotation.y = lockSpin + Math.sin(lockT * 0.4) * 0.25;
  animateCharacter(lockChar, lockT, 0, { preview: true });
  lockR.render(lockScene, lockCam);
}
locker.addEventListener('click', (e) => e.stopPropagation());
// test hook: contact sheet of every piece in a slot on one base model
window.__charSheet = (body, slot, view) => {
  const V = { head: [0, 150, 250, 150, 0.55], torso: [0, 105, 300, 105, 0.5], legs: [0, 40, 300, 35, 0.5], back: [0, 110, 420, 105, 2.6], full: [0, 125, 600, 110, 0.5], side: [0, 150, 250, 150, 1.45] }[view];
  const items = COSMETICS[slot], cw = 240, ch = 300, cols = Math.min(8, items.length), out = document.createElement('canvas'); out.width = cw * cols; out.height = ch * Math.ceil(items.length / cols);
  const g = out.getContext('2d'); g.fillStyle = '#3a2430'; g.fillRect(0, 0, out.width, out.height);
  lockR.setSize(cw, ch, false); const cam = new THREE.PerspectiveCamera(30, cw / ch, 10, 3000); cam.position.set(V[0], V[1], V[2]); cam.lookAt(0, V[3], 0);
  const sc = new THREE.Scene();
  items.forEach((I, i) => {
    const look = Object.assign({}, Meta.look(), window.__baseLook || {}, { body, [slot]: I.id }), ch3 = buildCharacter(look); ch3.rotation.y = V[4]; animateCharacter(ch3, 0, 0, { preview: true }); sc.add(ch3);
    lockR.render(sc, cam); g.drawImage(lockCanvas, (i % cols) * cw, Math.floor(i / cols) * ch, cw, ch); sc.remove(ch3);
    g.fillStyle = '#ffcd5a'; g.font = '16px sans-serif'; g.fillText(I.name, (i % cols) * cw + 6, Math.floor(i / cols) * ch + 18);
  });
  lockR.setSize(360, 460, false);
  return out.toDataURL('image/jpeg', 0.85);
};
window.__build = buildCharacter; window.__THREE = THREE;
window.__locker = () => { locker.style.display = 'block'; renderLocker(); };

// ---- lobby: every run starts here. Character, loadout, map, and inviting friends by lobby code.
const lobby = document.getElementById('lobby');
let lobbyBusy = false, lobbyMsg = '', lobbyTimer = 0, lobbySig = '';
const esc2 = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function myName() { let v = 'Player'; try { v = localStorage.getItem('dmh-name') || 'Player'; } catch (e) { /* private mode */ } return v; }
function openLobby() { title.style.display = 'none'; lobby.style.display = 'block'; lobbyMsg = ''; renderLobby(); }
function closeLobby() { if (Net.active) Net.leave(); lobby.style.display = 'none'; title.style.display = 'flex'; }
function renderLobby() {
  if (lobby.style.display !== 'block') return;
  const nmEl = lobby.querySelector('#lname'), cdEl = lobby.querySelector('#lcode'), focus = document.activeElement && document.activeElement.id;
  const nameV = nmEl ? nmEl.value : myName(), codeV = cdEl ? cdEl.value : '';
  const L = Meta.look(), client = Net.role === 'client', hosting = Net.role === 'host';
  let h = '<div class="lbh"><h2>LOBBY</h2><button id="lbback">BACK</button></div><div class="lbgrid">';
  // players + invite
  h += '<section><h3>PLAYERS</h3>';
  const list = Net.active ? Net.lobbyList() : [{ name: nameV, host: true, me: true }];
  for (const p of list) h += `<div class="lbrow ${p.me ? 'me' : ''}"><b>${esc2(p.name)}</b><span>${p.host ? 'Host' : ''}${p.me ? (p.host ? ' - you' : 'You') : ''}</span></div>`;
  if (!Net.active) {
    h += `<label class="lbl">Your name <input id="lname" maxlength="16" value="${esc2(nameV)}"></label>`;
    if (Net.lobby) h += `<button id="lbinvite" class="wide">INVITE FRIENDS</button><div class="lbor">or join a friend</div><div class="lbjoin"><input id="lcode" maxlength="8" placeholder="CODE" autocapitalize="characters" autocomplete="off" value="${esc2(codeV)}"><button id="lbjoin">JOIN</button></div>`;
    else h += `<p class="dim">${Net.tried ? 'Playing with friends is not available in this view.' : 'Connecting...'}</p>`;
  } else if (hosting) h += `<div class="lbcode"><span>LOBBY CODE</span><b>${esc2(Net.code)}</b></div><p class="dim">Friends pick PLAY, type this code and press JOIN.</p><button id="lbleave" class="wide alt">CLOSE LOBBY</button>`;
  else h += `<div class="lbcode"><span>LOBBY CODE</span><b>${esc2(Net.code)}</b></div><button id="lbleave" class="wide alt">LEAVE LOBBY</button>`;
  h += `<p class="msg">${esc2(lobbyMsg)}</p></section>`;
  // character
  h += `<section><h3>CHARACTER</h3><div class="lbchar">${SLOTS.map((sl) => `<div><span>${SLOT_NAMES[sl]}</span><b>${esc2(COSMETICS[sl].find((I) => I.id === L[sl]).name)}</b></div>`).join('')}</div><button id="lbcustom" class="wide">CUSTOMIZE</button></section>`;
  // loadout
  h += '<section><h3>LOADOUT</h3><p class="dim">Starting weapon</p>';
  for (const T of STARTERS) { const ok = Meta.starterUnlocked(T.w), W = game ? game.data.weapons.find((w) => w.name === T.w) : null; h += `<div class="lbpick ${ok ? '' : 'locked'} ${Meta.starter() === T.w ? 'sel' : ''}" data-w="${esc2(T.w)}"><b>${esc2(T.w)}</b><span>${ok ? (W ? W.cls : '') : esc2(T.text)}</span></div>`; }
  h += '</section>';
  // map
  h += '<section><h3>DIFFICULTY</h3>' + (client ? `<div class="lbpick sel"><b>${DIFFS[difficulty()].name}</b><span>The host chooses</span></div>` : DIFFS.map((D, i) => `<div class="lbpick ${Meta.difficulty() === i ? 'sel' : ''}" data-df="${i}"><b>${D.name}</b><span>${D.desc}</span></div>`).join('')) + '</section>';
  h += '<section><h3>MAP</h3><div class="lbpick sel"><b>Deadwater Gulch</b><span>Motel, main street and the Lucky Stiff casino</span></div><div class="lbpick locked"><b>More maps</b><span>Coming later</span></div></section></div>';
  h += client ? '<div class="lbstart wait">WAITING FOR THE HOST TO START</div>' : '<button id="lbstart" class="lbstart">START GAME</button>';
  lobby.innerHTML = h;
  const q = (id) => lobby.querySelector(id);
  q('#lbback').onclick = (e) => { e.stopPropagation(); closeLobby(); };
  const saveName = () => { const n = q('#lname'); if (n) { try { localStorage.setItem('dmh-name', n.value || 'Player'); } catch (err) { /* private mode */ } } return myName(); };
  for (const id of ['#lname', '#lcode']) { const el = q(id); if (el) { el.addEventListener('keydown', (e) => e.stopPropagation()); el.addEventListener('keyup', (e) => e.stopPropagation()); if (focus === id.slice(1)) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } } }
  if (q('#lname')) q('#lname').addEventListener('change', saveName);
  if (q('#lbinvite')) q('#lbinvite').onclick = async (e) => { e.stopPropagation(); if (lobbyBusy) return; lobbyBusy = true; lobbyMsg = 'Opening your lobby...'; const n = saveName(); renderLobby(); try { await Net.host(n); lobbyMsg = ''; } catch (err) { lobbyMsg = 'Could not open a lobby right now.'; } lobbyBusy = false; renderLobby(); };
  if (q('#lbjoin')) q('#lbjoin').onclick = async (e) => { e.stopPropagation(); if (lobbyBusy) return; lobbyBusy = true; const n = saveName(), code = q('#lcode').value; lobbyMsg = 'Joining...'; renderLobby(); try { await Net.join(code, n); lobbyMsg = ''; } catch (err) { lobbyMsg = err && err.message === 'code' ? 'Enter the lobby code your friend sees.' : 'No lobby found with that code.'; } lobbyBusy = false; renderLobby(); };
  if (q('#lbleave')) q('#lbleave').onclick = (e) => { e.stopPropagation(); Net.leave(); lobbyMsg = ''; renderLobby(); };
  q('#lbcustom').onclick = (e) => { e.stopPropagation(); locker.style.display = 'block'; renderLocker(); };
  lobby.querySelectorAll('.lbpick[data-df]').forEach((el) => { el.onclick = (e) => { e.stopPropagation(); Meta.setDifficulty(+el.dataset.df); renderLobby(); }; });
  lobby.querySelectorAll('.lbpick[data-w]').forEach((el) => { el.onclick = (e) => { e.stopPropagation(); if (el.classList.contains('locked')) return; Meta.setStarter(el.dataset.w); renderLobby(); }; });
  if (q('#lbstart')) q('#lbstart').onclick = (e) => { e.stopPropagation(); saveName(); if (!Net.active) Net.name = myName(); beginRun(); };
}
function beginRun() {
  if (Net.role !== 'client') setDifficulty(Meta.difficulty());
  lobby.style.display = 'none'; locker.style.display = 'none';
  // apply the chosen starting weapon to a fresh run
  const P = game.player, idx = game.data.weapons.findIndex((w) => w.name === Meta.starter());
  if (idx > 0 && game.round === 0 && P.weapons[0].def === 0) { P.weapons[0].def = idx; P.weapons[0].tier = 0; P.refillAll(); game.vm.setWeapon(idx, 0, false); }
  game.touch = TOUCH;
  if (Net.role === 'client' && game.round === 0) { const a = Math.random() * 6.28; P.pos.x += Math.cos(a) * 130; P.pos.z += Math.sin(a) * 130; }   // don't spawn inside the host
  start();
}
function tickLobby(dt) {
  if (lobby.style.display !== 'block') return;
  lobbyTimer -= dt; if (lobbyTimer > 0) return; lobbyTimer = 0.4;
  if (Net.role === 'client') {
    if (Net.hostStarted()) { beginRun(); return; }
    if (!Net.hostHere()) { Net.leave(); lobbyMsg = 'The host closed the lobby.'; renderLobby(); return; }
  }
  const sig = Net.role + '|' + (Net.active ? Net.lobbyList().map((p) => p.name).join(',') : '') + '|' + !!Net.lobby + '|' + Net.tried;
  if (sig !== lobbySig) { lobbySig = sig; renderLobby(); }
}
lobby.addEventListener('click', (e) => e.stopPropagation());
Net.init().then(() => { Net.tried = true; });
document.getElementById('playbtn').addEventListener('click', (e) => { e.stopPropagation(); if (game) openLobby(); });
document.getElementById('setbtn').addEventListener('click', (e) => { e.stopPropagation(); pauseEl.classList.add('menu'); pauseEl.querySelector('h2').textContent = 'SETTINGS'; pauseEl.querySelector('#presume').textContent = 'DONE'; pauseEl.style.display = 'flex'; });
document.getElementById('progbtn').addEventListener('click', (e) => { e.stopPropagation(); renderProgress(); prog.style.display = 'block'; });
hudCanvas.addEventListener('click', () => {
  if (!game) return;
  if (game.player.dead && !game.coopDown && game.time - (game.deathTime || 0) > 2) { restartRun(); return; }
});
document.addEventListener('pointerlockchange', () => {
  if (TEST || lockFailed) return;
  if (!document.pointerLockElement && mode === 'play' && !game.player.dead && !TOUCH) setPaused(true);
});

// ---- pause / settings panel
const pauseEl = document.getElementById('pause');
function applySettings() {
  if (game) { game.settings.fov = settings.fov || 100; game.settings.shake = settings.shake ?? 1; }
  if (audio.master) audio.master.gain.value = settings.volume ?? 0.8;
  audio.setMusicVol(settings.music ?? 0.5);
}
function setPaused(p) {
  pauseEl.classList.remove('menu'); pauseEl.querySelector('h2').textContent = 'PAUSED'; pauseEl.querySelector('#presume').textContent = 'RESUME';
  if (p) { mode = 'paused'; keys.clear(); mouseL = mouseR = false; stick.x = stick.y = 0; touchFire = false; }
  else { mode = 'play'; requestLock(); }
  pauseEl.style.display = p ? 'flex' : 'none';
  const box = pauseEl.querySelector('#pdmg');
  if (box && p && game) { const R = game.player.damageReport().slice(0, 6); box.innerHTML = R.length ? '<h3>DAMAGE TAKEN THIS RUN</h3>' + R.map((r) => `<div><b>${r.pct}%</b> ${r.who.replace(/[<>&]/g, '')} <i>${r.total} over ${r.hits} hit${r.hits > 1 ? 's' : ''}, biggest ${r.max}</i></div>`).join('') : ''; }
}
const SLIDERS = [['sens', 'Mouse sensitivity', 0.02, 0.5, 0.01, 0.11], ['fov', 'Field of view', 80, 120, 1, 100], ['volume', 'Volume', 0, 1, 0.05, 0.8], ['music', 'Music', 0, 1, 0.05, 0.5], ['shake', 'Screen shake', 0, 1.5, 0.1, 1]];
pauseEl.innerHTML = '<div class="pbox"><h2>PAUSED</h2>' + SLIDERS.map(([k, label, mn, mx, st]) => `<label><span>${label}</span><input type="range" data-k="${k}" min="${mn}" max="${mx}" step="${st}"><b></b></label>`).join('') + '<div class="pbtns"><button id="presume">RESUME</button><div id="pdmg"></div><button id="prestart">RESTART RUN</button><button id="pquit">QUIT TO MENU</button></div></div>';
pauseEl.querySelectorAll('input').forEach((el) => {
  const def = SLIDERS.find((s) => s[0] === el.dataset.k)[5];
  el.value = settings[el.dataset.k] ?? def; el.nextElementSibling.textContent = el.value;
  el.oninput = () => { settings[el.dataset.k] = parseFloat(el.value); el.nextElementSibling.textContent = el.value; applySettings(); saveSettings(); };
});
pauseEl.querySelector('#presume').onclick = () => { if (pauseEl.classList.contains('menu')) { pauseEl.classList.remove('menu'); pauseEl.style.display = 'none'; } else setPaused(false); };
pauseEl.querySelector('#pquit').onclick = () => { pauseEl.style.display = 'none'; restartRun(true); };
pauseEl.querySelector('#prestart').onclick = () => { pauseEl.style.display = 'none'; restartRun(); };
addEventListener('keydown', (e) => { if (e.code === 'KeyP' && game && mode === 'play' && !game.player.dead) { if (document.pointerLockElement) document.exitPointerLock(); setPaused(true); } });

// ---- restart without reloading the page: build a fresh run on the same renderer, audio and assets
let restarting = false;
async function restartRun(toMenu) {
  if (restarting) return; restarting = true;
  if (Net.active) Net.leave();
  mode = 'title'; title.style.display = 'flex'; document.body.classList.remove('ready'); status('Dealing a new hand...');
  await new Promise((r) => setTimeout(r, 30));
  hud.toasts = []; hud.banners = []; hud.floaters = []; hud.roundBanner = null; hud.helpT = 99;
  game = new Game(renderer, audio, hud);
  game.settings = Object.assign(game.settings, settings);
  await game.build();
  window.__dmh = game;
  status(''); document.body.classList.add('ready'); restarting = false;
  if (toMenu === true) { if (TOUCH) document.getElementById('touch').style.display = 'none'; if (document.pointerLockElement) document.exitPointerLock(); audio.music('off'); return; }
  beginRun();
}

// ---- touch controls: left thumb moves, right thumb looks, buttons for everything else
const TOUCH = !TEST && ('ontouchstart' in window) && matchMedia('(pointer: coarse)').matches;
const stick = { x: 0, y: 0 };
let touchFire = false, touchAim = false;
if (TOUCH) {
  const T = document.getElementById('touch');
  const btn = (id, label, cls, down, up) => { const b = document.createElement('div'); b.className = 'tb ' + cls; b.textContent = label; b.id = id; T.appendChild(b);
    b.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); down(); b.classList.add('on'); }, { passive: false });
    b.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); if (up) up(); b.classList.remove('on'); }, { passive: false }); return b; };
  btn('tfire', 'FIRE', 'big', () => { touchFire = true; edges.firePressed = 1; }, () => { touchFire = false; });
  btn('tjump', 'JUMP', '', () => { edges.jump = 1; });
  btn('tdash', 'DASH', '', () => { edges.dash = 1; });
  btn('tslide', 'SLIDE', '', () => { edges.slide = 1; }, () => { edges.slideUp = 1; });
  btn('taim', 'AIM', '', () => { touchAim = !touchAim; });
  btn('treload', 'RELOAD', 'sm', () => { edges.reload = 1; });
  btn('tuse', 'USE', 'sm', () => { edges.interact = 1; });
  btn('tbar', 'BARR', 'sm', () => { edges.barricade = 1; });
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

let last = performance.now(), fpsAcc = 0, fpsN = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  tickLocker(dt); tickLobby(dt);
  hud.needMouse = mode === 'play' && !TEST && !TOUCH && !lockFailed && !document.pointerLockElement;
  if (window.__dmhFixedDt) dt = window.__dmhFixedDt;
  fpsAcc += dt; fpsN++; if (fpsAcc > 0.5) { hud.fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; }
  if (!game) { hud.draw(null, dt, 'title'); return; }
  if (mode === 'play') {
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
  hud.draw(game, mode === 'play' || mode === 'paused' ? dt : 0, mode);
}
requestAnimationFrame(frame);
boot().catch((e) => { console.error(e); status('Failed to load: ' + e.message); });

// ------------------------------------------------------------------ test hooks (headless play-testing)
window.__setMode = (m) => { if (TEST) mode = m; };
window.__sim = (n, inp = {}, dt = 1 / 60) => {
  const base = { fwd: 0, right: 0, sprint: false, slideHeld: false, fire: false, aim: false, lookX: 0, lookY: 0, jump: 0, slide: 0, slideUp: 0, dash: 0, grapple: 0, reload: 0, interact: 0, back: 0, next: 0, prev: 0, firePressed: 0, choice: [0, 0, 0, 0] };
  const t0 = performance.now();
  for (let i = 0; i < n; i++) {
    const In = Object.assign({}, base, typeof inp === 'function' ? inp(i) : inp);
    if (i > 0 && typeof inp !== 'function') { for (const k of ['jump', 'slide', 'slideUp', 'dash', 'grapple', 'reload', 'interact', 'back', 'next', 'prev', 'firePressed']) In[k] = 0; In.choice = [0, 0, 0, 0]; }
    game.step(dt, In);
    hud.time += dt;
  }
  return performance.now() - t0;
};
