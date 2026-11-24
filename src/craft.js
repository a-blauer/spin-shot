// The Descent's workbench: the gun on the table, the parts you are carrying beside it, and the numbers on the other side.
// Drag a part onto the gun and it is fitted there and then: the model changes, the numbers move. Drag it off again to
// take it back. Hovering a part shows what it would do before you commit to it.
import * as THREE from 'three';
import { DATA, RARITY_HEX, cash } from './data.js';
import { CORE0, CORE_DEFS, isCore } from './cores.js';

const CSS = `
#craft { display:none; position:fixed; inset:0; z-index:9; cursor:default; color:#f2e8d5; font-family:"Barlow Condensed",sans-serif;
  background:radial-gradient(ellipse at 50% 42%, rgba(46,30,22,0.94), rgba(10,6,8,0.985) 70%); user-select:none; touch-action:none; }
#craft .cw { position:absolute; inset:3vh 3vw; display:grid; grid-template-rows:auto 1fr auto; gap:1.4vh; }
#craft .ch { display:flex; align-items:baseline; gap:18px; border-bottom:2px solid rgba(255,205,90,0.35); padding-bottom:6px; }
#craft .ch h1 { margin:0; font:400 44px "Big Shoulders Display"; letter-spacing:2px; color:#ffcd5a; }
#craft .ch .sub { font-size:19px; color:#b9ad98; flex:1; }
#craft .ch .cash { font:400 30px "Big Shoulders Display"; color:#ffd23a; }
#craft .ch button { font:400 22px "Big Shoulders Display"; letter-spacing:1px; background:#2a1a14; color:#f2e8d5; border:2px solid #ffcd5a; padding:6px 18px; cursor:pointer; }
#craft .ch button:hover { background:#ffcd5a; color:#1a0f0c; }
#craft .cb { display:grid; grid-template-columns:minmax(250px,23vw) 1fr minmax(250px,23vw); gap:1.6vw; min-height:0; }
#craft h2 { margin:0 0 8px; font:400 24px "Big Shoulders Display"; letter-spacing:1.5px; color:#ffcd5a; display:flex; justify-content:space-between; }
#craft h2 i { font:600 17px "Barlow Condensed"; color:#b9ad98; font-style:normal; }
#craft .col { background:rgba(0,0,0,0.32); border:1px solid rgba(255,205,90,0.22); padding:12px 12px; display:flex; flex-direction:column; min-height:0; }
#craft .list { overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:6px; padding-right:4px; }
#craft .chip { display:grid; grid-template-columns:46px 1fr auto; gap:10px; align-items:center; background:linear-gradient(90deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02)); border:1px solid rgba(255,255,255,0.14);
  border-left:4px solid var(--c); padding:6px 8px; cursor:grab; transition:transform .08s, background .12s; }
#craft .chip:hover { background:rgba(255,255,255,0.13); transform:translateX(3px); }
#craft .chip.none { opacity:.35; pointer-events:none; }
#craft .gly { width:44px; height:44px; display:flex; align-items:center; justify-content:center; font:400 19px "Big Shoulders Display"; color:#14100e; background:var(--c); clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%); }
#craft .chip b { display:block; font:700 19px "Barlow Condensed"; color:var(--c); line-height:1.05; }
#craft .chip span { font-size:16px; color:#d8cdb8; line-height:1.1; }
#craft .chip em { font:400 26px "Big Shoulders Display"; font-style:normal; color:#f2e8d5; }
#craft .empty { color:#9a8f7c; font-size:18px; line-height:1.3; padding:10px 4px; }
#craft .mid { display:flex; flex-direction:column; min-height:0; }
#craft .tabs { display:flex; gap:8px; }
#craft .tab { flex:1; padding:7px 10px; background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.16); border-bottom:3px solid transparent; cursor:pointer; font:400 22px "Big Shoulders Display"; letter-spacing:1px; color:#b9ad98; text-align:center; }
#craft .tab.on { color:var(--c); border-bottom-color:var(--c); background:rgba(255,255,255,0.08); }
#craft .tab small { display:block; font:600 14px "Barlow Condensed"; color:#9a8f7c; letter-spacing:0; }
#craft .table { position:relative; flex:1; min-height:160px; margin-top:8px; border:1px solid rgba(255,205,90,0.22);
  background:radial-gradient(ellipse at 50% 60%, rgba(255,190,110,0.20), rgba(0,0,0,0) 62%), linear-gradient(#1b120e, #2c1c13 58%, #4a3020 58%, #37241a); overflow:hidden; }
#craft .table.over { border-color:#7dff8a; box-shadow:inset 0 0 60px rgba(125,255,138,0.25); }
#craft .table.full.over { border-color:#ff5a4d; box-shadow:inset 0 0 60px rgba(255,90,77,0.25); }
#craft .table canvas { position:absolute; inset:0; width:100%; height:100%; cursor:grab; }
#craft .hint { position:absolute; left:0; right:0; top:10px; text-align:center; font-size:19px; color:#d8cdb8; pointer-events:none; text-shadow:0 2px 6px #000; }
#craft .pop { position:absolute; left:50%; top:50%; width:20px; height:20px; margin:-10px; border-radius:50%; border:3px solid var(--c); pointer-events:none; opacity:0; }
#craft .pop.go { animation:cpop .5s ease-out; }
@keyframes cpop { 0% { opacity:1; transform:scale(1); } 100% { opacity:0; transform:scale(16); } }
#craft .slots { display:flex; gap:8px; margin-top:10px; align-items:stretch; }
#craft .slot { flex:1; max-width:92px; aspect-ratio:1; border:2px dashed rgba(255,255,255,0.25); display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; background:rgba(0,0,0,0.3); }
#craft .slot.fill { border:2px solid var(--c); background:rgba(255,255,255,0.07); cursor:grab; }
#craft .slot.fill:hover::after { content:"TAKE OFF"; position:absolute; bottom:2px; font:700 12px "Barlow Condensed"; color:#ff9a8a; }
#craft .slot .gly { width:54%; height:54%; font-size:17px; }
#craft .slot small { font:700 12px "Barlow Condensed"; color:#d8cdb8; text-align:center; line-height:1; margin-top:3px; }
#craft .slot.lock { border-style:solid; border-color:rgba(255,255,255,0.1); color:#6a6258; font-size:13px; text-align:center; }
#craft .tune { margin-top:10px; display:flex; gap:12px; align-items:center; }
#craft .tune button { font:400 21px "Big Shoulders Display"; letter-spacing:1px; padding:8px 16px; background:#3a2418; color:#ffcd5a; border:2px solid #ffcd5a; cursor:pointer; white-space:nowrap; }
#craft .tune button:hover:not(:disabled) { background:#ffcd5a; color:#1a0f0c; }
#craft .tune button:disabled { opacity:.4; cursor:default; }
#craft .tune span { font-size:17px; color:#b9ad98; line-height:1.15; }
#craft .row { display:grid; grid-template-columns:1fr auto; align-items:baseline; padding:5px 2px; border-bottom:1px solid rgba(255,255,255,0.08); font-size:20px; color:#d8cdb8; }
#craft .row b { font:400 25px "Big Shoulders Display"; color:#f2e8d5; transition:color .5s; }
#craft .row b.up { color:#7dff8a; transition:none; } #craft .row b.down { color:#ff7a6a; transition:none; }
#craft .row u { text-decoration:none; font:700 17px "Barlow Condensed"; margin-left:8px; color:#7dff8a; } #craft .row u.neg { color:#ff7a6a; }
#craft .row.big { border-bottom:2px solid rgba(255,205,90,0.35); } #craft .row.big b { font-size:38px; color:#ffcd5a; }
#craft .fx { margin-top:10px; font-size:17px; color:#d8cdb8; line-height:1.25; overflow-y:auto; flex:1; }
#craft .fx div { padding:2px 0; } #craft .fx b { color:var(--c); }
#craft .cf { display:flex; gap:8px; align-items:center; flex-wrap:wrap; min-height:44px; background:rgba(0,0,0,0.32); border:1px solid rgba(255,205,90,0.22); padding:6px 12px; }
#craft .cf h3 { margin:0 8px 0 0; font:400 21px "Big Shoulders Display"; letter-spacing:1px; color:#ffcd5a; }
#craft .pas { display:flex; align-items:center; gap:6px; padding:3px 9px 3px 4px; border:1px solid rgba(255,255,255,0.14); background:rgba(255,255,255,0.05); font-size:16px; }
#craft .pas .gly { width:28px; height:28px; font-size:12px; } #craft .pas b { color:var(--c); font-size:17px; } #craft .pas em { font:400 19px "Big Shoulders Display"; font-style:normal; }
#cghost { position:fixed; z-index:10; pointer-events:none; transform:translate(-50%,-50%) rotate(-6deg) scale(1.15); filter:drop-shadow(0 8px 14px rgba(0,0,0,0.7)); }
#cghost .gly { width:60px; height:60px; display:flex; align-items:center; justify-content:center; font:400 24px "Big Shoulders Display"; color:#14100e; background:var(--c); clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%); }
@media (max-width: 900px) { #craft .cb { grid-template-columns:1fr; grid-auto-rows:minmax(0,auto); overflow-y:auto; } #craft .table { min-height:210px; } #craft .ch h1 { font-size:30px; } }
`;

export function makeCraft(H) {   // H: { game(), audio, preview(), entered(), left() }
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const el = document.createElement('div'); el.id = 'craft'; document.body.appendChild(el);
  let open = false, scene = null, cam = null, model = null, modelKey = '', spin = 2.2, spinV = 0, bump = 0, t = 0, drag = null, lastSheet = null, hover = -1, cv = null, R = null;
  const P = () => H.game().player, U = (i) => DATA.upgrades[i];
  const esc = (s) => String(s).replace(/[<>&]/g, '');
  const gly = (u) => `<div class="gly">${esc(U(u).glyph)}</div>`;
  const guns = () => { const p = P(), out = []; for (let i = 0; i < p.maxSlots; i++) if (p.weapons[i].def >= 0) out.push(i); return out; };

  // ---- the gun on the table
  function ensureScene() {
    if (scene) return;
    scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(26, 2, 1, 2000);
    const top = new THREE.Mesh(new THREE.BoxGeometry(260, 6, 120), new THREE.MeshBasicMaterial({ color: 0x4a3020 })); top.position.set(0, -15, 0); scene.add(top);
    for (let k = -3; k <= 3; k++) { const ln = new THREE.Mesh(new THREE.BoxGeometry(260, 0.4, 0.8), new THREE.MeshBasicMaterial({ color: 0x33211a })); ln.position.set(0, -11.9, k * 17); scene.add(ln); }
    const mat = new THREE.Mesh(new THREE.BoxGeometry(84, 0.6, 40), new THREE.MeshBasicMaterial({ color: 0x1d2a26 })); mat.position.set(0, -11.6, 0); scene.add(mat);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(86, 0.5, 42), new THREE.MeshBasicMaterial({ color: 0x6a5a2a })); edge.position.set(0, -11.8, 0); scene.add(edge);
  }
  function rebuildModel(force) {
    const p = P(), S = p.slot; if (S.def < 0) return;
    const key = S.def + '|' + S.tier + '|' + S.cores.join(',');
    if (key === modelKey && !force) return; modelKey = key;
    if (model) scene.remove(model);
    const g = H.game().vm.constructor.displayModel(H.game(), S.def, Math.min(3, S.tier), S.cores);
    const box = new THREE.Box3().setFromObject(g), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    g.position.sub(c); model = new THREE.Group(); model.add(g); model.userData.len = Math.max(sz.x, sz.z, sz.y * 1.6); scene.add(model);
  }
  function tick(dt) {
    if (!open || !R || !scene) return;
    t += dt; if (!drag || drag.kind !== 'spin') { spin += spinV * dt; spinV *= Math.exp(-dt * 3); }
    bump = Math.max(0, bump - dt * 3.2);
    const w = cv.clientWidth | 0, h = cv.clientHeight | 0;
    if (w > 8 && h > 8 && (cv.width !== w || cv.height !== h)) R.setSize(w, h, false);
    if (model) {
      const L = model.userData.len || 40, k = 1 + Math.sin(bump * Math.PI) * 0.12;
      model.rotation.set(0.1 + Math.sin(t * 0.7) * 0.02, spin + Math.sin(t * 0.35) * 0.12, 0); model.scale.setScalar(k); model.position.y = 2 + Math.sin(t * 1.1) * 0.5 + Math.sin(bump * Math.PI) * 3;
      cam.aspect = Math.max(0.3, w / Math.max(1, h)); const d = Math.max(L * 2.15 / Math.min(1.6, cam.aspect), 60);
      cam.position.set(0, d * 0.2, d); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
    }
    R.setClearColor(0x000000, 0); R.render(scene, cam);
  }

  // ---- what the panels say
  const fmt = { damage: (v) => v.toFixed(v < 20 ? 1 : 0), rate: (v) => v.toFixed(1) + ' /s', dps: (v) => Math.round(v).toLocaleString(), mag: (v) => v, reload: (v) => v.toFixed(2) + 's', crit: (v) => Math.round(v) + '%', critX: (v) => 'x' + v.toFixed(1), head: (v) => '+' + Math.round(v - 100) + '%', pellets: (v) => v, pierce: (v) => v };
  const ROWS = [['dps', 'Damage per second', 1], ['damage', 'Damage per projectile'], ['pellets', 'Projectiles per shot'], ['rate', 'Fire rate'], ['mag', 'Magazine'], ['reload', 'Reload', 0, -1], ['crit', 'Crit chance'], ['critX', 'Crit damage'], ['head', 'Headshot bonus'], ['pierce', 'Pierces']];
  function sheetWith(u) {   // the numbers as they would be with one more part fitted
    const p = P(), S = p.slot; if (u < 0 || S.cores.length >= p.coreSlots(S)) return null;
    S.cores.push(u); p.recompute(); const sh = p.gunSheet(); S.cores.pop(); p.recompute(); return sh;
  }
  function statsHtml(flash) {
    const p = P(), sh = p.gunSheet(); if (!sh) return '';
    const nx = hover >= 0 ? sheetWith(hover) : null;
    let h = '';
    for (const [k, label, big, sign] of ROWS) {
      const v = sh[k], was = lastSheet ? lastSheet[k] : v, better = (sign || 1) * (v - was);
      let d = ''; if (nx && Math.abs(nx[k] - v) > 1e-6) { const good = (sign || 1) * (nx[k] - v) > 0; d = `<u class="${good ? '' : 'neg'}">&#9654; ${fmt[k](nx[k])}</u>`; }
      h += `<div class="row${big ? ' big' : ''}"><span>${label}</span><span><b class="${flash && Math.abs(better) > 1e-6 ? (better > 0 ? 'up' : 'down') : ''}">${fmt[k](v)}</b>${d}</span></div>`;
    }
    // what the fitted parts do, added up
    const S = p.slot, n = new Map(); for (const u of S.cores) n.set(u, (n.get(u) || 0) + 1);
    let fx = ''; for (const [u, c] of n) fx += `<div style="--c:${U(u).hex}"><b>${esc(U(u).name)}${c > 1 ? ' x' + c : ''}</b>  ${esc(U(u).desc)}${c > 1 ? ' (each)' : ''}</div>`;
    if (S.mods.length) fx += `<div style="--c:#ffcd5a"><b>Tune-up ${'I'.repeat(S.mods.length)}</b>  +${20 * S.mods.length}% damage, bigger magazine and reserve</div>`;
    lastSheet = sh;
    return h + `<div class="fx">${fx || '<div style="color:#9a8f7c">Nothing fitted yet.</div>'}</div>`;
  }
  function render(flash) {
    const p = P(), S = p.slot, G = guns(), cap = p.coreSlots(S), inv = Object.keys(p.coreInv).map(Number).filter((u) => p.coreInv[u] > 0).sort((a, b) => a - b);
    const total = inv.reduce((s, u) => s + p.coreInv[u], 0), full = S.cores.length >= cap;
    let h = `<div class="cw"><div class="ch"><h1>WORKBENCH</h1><div class="sub">Drag a part onto the gun to fit it. Drag it off to take it back. Nothing here costs anything but the tune-up.</div><div class="cash">$${cash(p.money)}</div><button id="cclose">DONE  [E]</button></div><div class="cb">`;
    h += `<div class="col"><h2>PARTS <i>${total} carried</i></h2><div class="list">`;
    if (!inv.length) h += `<div class="empty">You are not carrying any parts.<br><br>They drop from what you kill: the stranger the enemy, the better the part. Bosses always leave three.</div>`;
    for (const u of inv) h += `<div class="chip" data-u="${u}" style="--c:${U(u).hex}">${gly(u)}<div><b>${esc(U(u).name)}</b><span>${esc(U(u).desc)}</span></div><em>x${p.coreInv[u]}</em></div>`;
    h += `</div></div><div class="mid"><div class="tabs">`;
    for (const i of G) { const W = DATA.weapons[p.weapons[i].def], s = p.weapons[i]; h += `<div class="tab${i === p.active ? ' on' : ''}" data-i="${i}" style="--c:${RARITY_HEX[W.rarity] || '#fff'}">${esc(W.name.toUpperCase())}<small>${s.cores.length} of ${p.coreSlots(s)} fitted</small></div>`; }
    h += `</div><div class="table${full ? ' full' : ''}" id="ctable"><canvas id="ccv"></canvas><div class="hint">${full ? 'This gun is full. Take a part off, or tune it up for another slot.' : total ? 'Drop a part here' : ''}</div><div class="pop" id="cpop"></div></div><div class="slots">`;
    for (let k = 0; k < 8; k++) {
      if (k < S.cores.length) { const u = S.cores[k]; h += `<div class="slot fill" data-k="${k}" style="--c:${U(u).hex}">${gly(u)}<small>${esc(U(u).name)}</small></div>`; }
      else if (k < cap) h += `<div class="slot"></div>`;
      else h += `<div class="slot lock">TUNE-UP<br>${k - 3}</div>`;
    }
    const maxed = S.mods.length >= 4, cost = maxed ? 0 : p.benchCost(S);
    h += `</div><div class="tune"><button id="ctune" ${maxed || p.money < cost ? 'disabled' : ''}>${maxed ? 'FULLY TUNED' : `TUNE-UP  $${cash(cost)}`}</button><span>${maxed ? 'This gun has had all four tune-ups.' : '+20% damage, +15% magazine and reserve, a little fire rate and reload, and one more part slot.'}</span></div></div>`;
    h += `<div class="col"><h2>${esc(DATA.weapons[S.def].name.toUpperCase())}</h2><div id="cstats" style="display:flex;flex-direction:column;min-height:0;flex:1">${statsHtml(flash)}</div></div></div>`;
    // passives
    const pas = []; for (let k = 0; k < CORE_DEFS.length; k++) { const u = CORE0 + k; if (CORE_DEFS[k].kind === 'me' && p.upgradeStacks[u] > 0) pas.push(u); }
    h += `<div class="cf"><h3>ON YOU</h3>${pas.length ? pas.map((u) => `<div class="pas" style="--c:${U(u).hex}" title="${esc(U(u).desc)}">${gly(u)}<b>${esc(U(u).name)}</b><em>x${p.upgradeStacks[u]}</em><span>${esc(U(u).desc)}</span></div>`).join('') : '<span style="color:#9a8f7c;font-size:17px">Passives (health, speed, armor and the like) work the moment you pick them up. None yet.</span>'}</div></div>`;
    el.innerHTML = h;
    const pv = H.preview(); R = pv && pv.R; cv = pv ? pv.canvas : null;
    if (cv) { cv.id = 'ccv'; cv.style.cssText = ''; el.querySelector('#ccv').replaceWith(cv); }
    ensureScene(); rebuildModel(false);
    if (flash) setTimeout(() => el.querySelectorAll('.row b').forEach((b) => b.classList.remove('up', 'down')), 60);
    el.querySelector('#cclose').onclick = close;
    el.querySelectorAll('.tab').forEach((tb) => { tb.onclick = () => { const i = +tb.dataset.i; if (i !== p.active) { p.switchTo(i); lastSheet = null; modelKey = ''; H.audio.play('S_Switch', 0.6); render(false); } }; });
    const tu = el.querySelector('#ctune'); tu.onclick = () => { const n0 = S.mods.length; p.benchUpgrade(); if (S.mods.length > n0) { bump = 1; pop('#ffcd5a'); } render(true); };
    el.querySelectorAll('.chip').forEach((c) => {
      c.onpointerdown = (e) => startDrag(e, { kind: 'fit', u: +c.dataset.u });
      c.onpointerenter = () => { if (!drag) { hover = +c.dataset.u; refreshStats(); } }; c.onpointerleave = () => { if (!drag && hover >= 0) { hover = -1; refreshStats(); } };
    });
    el.querySelectorAll('.slot.fill').forEach((s) => { s.onpointerdown = (e) => startDrag(e, { kind: 'pull', k: +s.dataset.k, u: p.slot.cores[+s.dataset.k] }); });
    if (cv) cv.onpointerdown = (e) => { drag = { kind: 'spin', x: e.clientX }; cv.setPointerCapture(e.pointerId); };
  }
  function refreshStats() { const c = el.querySelector('#cstats'); if (c) { const keep = lastSheet; c.innerHTML = statsHtml(false); lastSheet = keep; } }
  function pop(col) { const q = el.querySelector('#cpop'); if (!q) return; q.style.setProperty('--c', col); q.classList.remove('go'); void q.offsetWidth; q.classList.add('go'); }

  // ---- dragging
  let ghost = null;
  function startDrag(e, d) {
    e.preventDefault(); drag = Object.assign(d, { x0: e.clientX, y0: e.clientY, moved: false });
    ghost = document.createElement('div'); ghost.id = 'cghost'; ghost.style.setProperty('--c', U(d.u).hex); ghost.innerHTML = gly(d.u); document.body.appendChild(ghost); moveGhost(e);
    if (d.kind === 'fit') { hover = d.u; refreshStats(); }
    H.audio.play('S_UIMove', 0.5, 1.2);
  }
  function moveGhost(e) { if (ghost) { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; } }
  const overTable = (e) => { const tb = el.querySelector('#ctable'), sl = el.querySelector('.slots'); const hit = (n) => { if (!n) return false; const r = n.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; }; return hit(tb) || hit(sl); };
  addEventListener('pointermove', (e) => {
    if (!open || !drag) return;
    if (drag.kind === 'spin') { const dx = e.clientX - drag.x; spin += dx * 0.012; spinV = dx * 0.5; drag.x = e.clientX; return; }
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6) drag.moved = true;
    moveGhost(e); const tb = el.querySelector('#ctable'); if (tb) tb.classList.toggle('over', drag.kind === 'fit' && overTable(e));
  });
  addEventListener('pointerup', (e) => {
    if (!open || !drag) return; const d = drag; drag = null;
    if (d.kind === 'spin') return;
    if (ghost) { ghost.remove(); ghost = null; }
    const p = P(), S = p.slot, on = overTable(e); hover = -1;
    // a part dropped on the gun (or simply clicked) is fitted; a fitted part dragged off the bench (or clicked) comes off
    if (d.kind === 'fit' && (on || !d.moved)) {
      if (p.fitCore(S, d.u)) { bump = 1; H.audio.play('S_Upgrade', 0.8, 1.15); H.audio.play('S_MagIn', 0.7, 0.9); render(true); pop(U(d.u).hex); return; }
      H.audio.play('S_Deny', 0.6);
    } else if (d.kind === 'pull' && (!on || !d.moved)) { if (p.pullCore(S, d.k)) { H.audio.play('S_MagOut', 0.7, 1.1); bump = 0.5; render(true); return; } }
    render(false);
  });
  addEventListener('keydown', (e) => { if (!open) return; e.stopImmediatePropagation(); if (e.code === 'KeyE' || e.code === 'Escape' || e.code === 'Tab' || e.code === 'KeyF') { e.preventDefault(); close(); } }, true);
  addEventListener('keyup', (e) => { if (open) e.stopImmediatePropagation(); }, true);

  function show() { if (open || !H.game() || !H.game().descent) return; open = true; lastSheet = null; modelKey = ''; hover = -1; drag = null; P().coreNew = 0; H.entered(); el.style.display = 'block'; render(false); H.audio.play('S_Switch', 0.7, 0.8); }
  function close() { if (!open) return; open = false; if (ghost) { ghost.remove(); ghost = null; } el.style.display = 'none'; H.left(); }
  return { show, close, tick, isOpen: () => open, refresh: () => { if (open) render(false); } };
}
