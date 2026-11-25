// The Descent's workbench: the gun on the table, the parts you are carrying beside it, and the numbers on the other side.
// Drag a part onto the gun and it is fitted there and then: the model changes, the numbers move. Drag it off again to
// take it back. Hovering a part shows what it would do before you commit to it.
import * as THREE from 'three';
import { DATA, RARITY_HEX, cash } from './data.js';
import { CORE0, CORE_DEFS, coreSvg, BLADE } from './cores.js';
import { MELEE, HONE_MAX } from './melee.js';
import { sigOf, sigProc } from './signatures.js';
import { Meta } from './meta.js';
import { deed, DEEDS, ROMAN, ASC, TEMPERS, ATTUNES, temperOf, attuneOf } from './deeds.js';

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
#craft .gly svg, #cghost .gly svg { width:58%; height:58%; display:block; }
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
#craft .table canvas { position:absolute; inset:0; width:100%; height:100%; cursor:grab; }
#craft .hint { position:absolute; left:0; right:0; top:10px; text-align:center; font-size:19px; color:#d8cdb8; pointer-events:none; text-shadow:0 2px 6px #000; }
#craft .pop { position:absolute; left:50%; top:50%; width:20px; height:20px; margin:-10px; border-radius:50%; border:3px solid var(--c); pointer-events:none; opacity:0; }
#craft .pop.go { animation:benchpop .5s ease-out; }
@keyframes benchpop { 0% { opacity:1; transform:scale(1); } 100% { opacity:0; transform:scale(16); } }
#craft .slots { display:flex; gap:6px; margin-top:10px; align-items:stretch; flex-wrap:wrap; min-height:84px; }
#craft .slot { width:60px; height:60px; border:2px dashed rgba(255,255,255,0.25); display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; background:rgba(0,0,0,0.3); }
#craft .slot.fill { border:2px solid var(--c); background:rgba(255,255,255,0.07); cursor:grab; }
#craft .slot.lock { border:2px solid rgba(255,255,255,0.08); background:rgba(0,0,0,0.25); }
#craft .slot.lock small { color:#6f665a; }
#craft .slot.fill:hover::after { content:"TAKE OFF"; position:absolute; bottom:2px; font:700 12px "Barlow Condensed"; color:#ff9a8a; }
#craft .slot .gly { width:54%; height:54%; font-size:17px; }
#craft .slot small { font:700 12px "Barlow Condensed"; color:#d8cdb8; text-align:center; line-height:1; margin-top:3px; }
#craft .slot.none { width:auto; flex:1; color:#9a8f7c; font-size:18px; }
#craft .slot em { position:absolute; top:-9px; right:-9px; min-width:26px; padding:0 4px; height:26px; border-radius:13px; background:var(--c); color:#14100e; font:400 19px "Big Shoulders Display"; font-style:normal; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px #000; }
#craft .evo { margin-top:10px; }
#craft .evo .eb { height:10px; background:rgba(255,255,255,.1); border:1px solid rgba(255,140,255,.5); }
#craft .evo .eb i { display:block; height:100%; background:#ff8cff; }
#craft .evo .et { display:flex; justify-content:space-between; font-size:17px; color:#b9ad98; margin-top:4px; }
#craft .evo .et b { font:400 21px "Big Shoulders Display"; letter-spacing:1px; color:#ff8cff; }
#craft .asc { margin-top:8px; padding:8px 10px; border:1px solid rgba(255,140,255,.35); background:rgba(40,16,40,.45); font-size:16px; color:#b9ad98; line-height:1.2; }
#craft .asc h4 { margin:0 0 4px; font:400 20px "Big Shoulders Display"; letter-spacing:1px; color:#ff8cff; }
#craft .asc h4 s { text-decoration:none; color:#ffcd5a; margin-left:8px; letter-spacing:4px; }
#craft .asc .ar { display:flex; flex-wrap:wrap; gap:5px; align-items:center; margin-top:5px; }
#craft .asc .ar label { width:64px; font:400 16px "Big Shoulders Display"; letter-spacing:1px; color:#e9dfc8; }
#craft .asc .ap { padding:3px 9px; border:1px solid rgba(255,255,255,.25); cursor:pointer; color:#e9dfc8; font-size:15px; }
#craft .asc .ap:hover { border-color:#ff8cff; }
#craft .asc .ap.on { background:#ff8cff; color:#1a0f0c; border-color:#ff8cff; font-weight:700; }
#craft .asc .lk { opacity:.55; }
#craft .asc .ar em { font-style:normal; color:#b9ad98; font-size:15px; margin-left:6px; }
#craft .mid { overflow-y:auto; }
#craft .rec { margin-top:8px; padding:7px 10px; flex:none; border:2px solid #9affc0; background:rgba(14,40,28,.55); }
#craft .rec.over { background:rgba(40,90,60,.7); }
#craft .rec.locked { border-color:rgba(255,255,255,.2); background:rgba(0,0,0,.25); }
#craft .rec h3 { margin:0 0 6px; font:400 22px "Big Shoulders Display"; letter-spacing:1px; color:#9affc0; }
#craft .rec.locked h3 { color:#8f8676; }
#craft .rec p { margin:0; font-size:15px; color:#b9ad98; line-height:1.2; }
#craft .rec .hop { display:flex; gap:8px; align-items:center; margin:4px 0 6px; }
#craft .rec h3 i { font:400 14px "Barlow Condensed",sans-serif; letter-spacing:0; color:#b9ad98; font-style:normal; margin-left:6px; }
#craft .rec .hs { width:44px; height:44px; border:2px dashed rgba(154,255,192,.5); display:flex; align-items:center; justify-content:center; color:rgba(154,255,192,.5); font-size:24px; }
#craft .rec .hs.f { border:2px solid var(--c); cursor:pointer; background:rgba(0,0,0,.4); }
#craft .rec .hs svg { width:36px; height:36px; }
#craft .rec .hop b { font:400 24px "Big Shoulders Display"; color:#9affc0; }
#craft .rec .rb { display:flex; flex-wrap:wrap; gap:6px; }
#craft .rec button { font:400 17px "Big Shoulders Display"; letter-spacing:1px; padding:5px 10px; background:#12281c; color:#9affc0; border:2px solid #9affc0; cursor:pointer; }
#craft .rec button:hover:not(:disabled) { background:#9affc0; color:#0c1a12; }
#craft .rec button:disabled { opacity:.35; cursor:default; }
#craft .rec button.bn { color:#ff9a8a; border-color:#ff9a8a; background:#2a1412; }
#craft .rec button.bn:hover:not(:disabled) { background:#ff9a8a; color:#1a0c0a; }
#craft .rec .out { margin-top:6px; font-size:16px; color:#e9dfc8; min-height:19px; }
#craft .tune { margin-top:10px; display:flex; gap:12px; align-items:center; }
#craft .tune button { font:400 21px "Big Shoulders Display"; letter-spacing:1px; padding:8px 16px; background:#3a2418; color:#ffcd5a; border:2px solid #ffcd5a; cursor:pointer; white-space:nowrap; }
#craft .tune button:hover:not(:disabled) { background:#ffcd5a; color:#1a0f0c; }
#craft .tune button:disabled { opacity:.4; cursor:default; }
#craft .tune span { font-size:17px; color:#b9ad98; line-height:1.15; }
#craft .row { display:grid; grid-template-columns:1fr auto; align-items:baseline; padding:3px 2px; border-bottom:1px solid rgba(255,255,255,0.08); font-size:20px; color:#d8cdb8; }
#craft .row b { font:400 25px "Big Shoulders Display"; color:#f2e8d5; transition:color .5s; }
#craft .row b.up { color:#7dff8a; transition:none; } #craft .row b.down { color:#ff7a6a; transition:none; }
#craft .row u { text-decoration:none; font:700 17px "Barlow Condensed"; margin-left:8px; color:#7dff8a; } #craft .row u.neg { color:#ff7a6a; }
#craft .row.big { border-bottom:2px solid rgba(255,205,90,0.35); } #craft .row.big b { font-size:38px; color:#ffcd5a; }
#craft .fx { margin-top:10px; font-size:17px; color:#d8cdb8; line-height:1.25; flex:none; }
#craft #cstats::-webkit-scrollbar { width:6px; } #craft #cstats::-webkit-scrollbar-thumb { background:rgba(255,205,90,0.35); }
#craft .fx div { padding:2px 0; } #craft .fx b { color:var(--c); }
#craft .sig { margin:0 0 8px; padding:8px 10px 9px; border-left:4px solid var(--c); background:linear-gradient(90deg, rgba(255,205,90,0.12), rgba(255,205,90,0.02)); font-size:16px; line-height:1.18; color:#e6dcc8; }
#craft .sig b { display:block; font:400 24px "Big Shoulders Display"; letter-spacing:1px; color:var(--c); margin-bottom:2px; }
#craft .sig i { display:block; margin-top:5px; font-style:normal; color:#b9ad98; }
#craft .sig em { display:block; margin-top:5px; font-style:normal; font-weight:700; color:#7dff8a; }
#craft .chip.suit { border-color:rgba(125,255,138,0.55); box-shadow:inset 3px 0 0 #7dff8a; }
#craft .chip span u { text-decoration:none; font-weight:700; color:#7dff8a; }
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
  const gly = (u) => `<div class="gly">${coreSvg(U(u))}</div>`;
  const guns = () => { const p = P(), out = []; for (let i = 0; i < p.maxSlots; i++) if (p.weapons[i].def >= 0) out.push(i); return out; };
  // what is on the table: the gun in hand, or the blade
  let onBlade = false;
  const sel = () => { const p = P(); return onBlade ? { blade: true, def: -1, cores: p.bladeCores, mods: [] } : p.slot; };
  const bladeW = () => MELEE[P().meleeDef] || MELEE[0];
  const partText = (u) => (onBlade ? (BLADE[U(u).name] ? BLADE[U(u).name][1] : 'Does nothing on a blade') : U(u).desc);
  // the blade's numbers, as the gun's are shown
  function bladeSheet() {
    const p = P(), W = bladeW();
    return { damage: W.dmg * p.meleePower(), rate: p.meleeSpeed() / Math.max(0.2, W.cd || 0.5), reach: p.meleeRange() / 100, crit: 100 * Math.min(0.75, (W.crit || 0) + p.stat('MeleeCrit')), cleave: p.meleeCleave(), steal: 100 * p.stat('MeleeLifesteal') };
  }
  const BROWS = [['damage', 'Damage per swing', 1], ['rate', 'Swings per second'], ['reach', 'Reach (m)'], ['crit', 'Crit chance'], ['cleave', 'Enemies per swing'], ['steal', 'Life steal']];
  const bfmt = { damage: (v) => Math.round(v), rate: (v) => v.toFixed(2), reach: (v) => v.toFixed(1), crit: (v) => Math.round(v) + '%', cleave: (v) => v, steal: (v) => Math.round(v) + '%' };

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
    const p = P(), S = p.slot; if (!onBlade && S.def < 0) return;
    const key = onBlade ? 'blade|' + p.meleeDef + '|' + (p.meleeTier || 0) : S.def + '|' + S.tier + '|' + S.cores.join(',');
    if (key === modelKey && !force) return; modelKey = key;
    if (model) scene.remove(model);
    let g;
    if (onBlade) { const t = H.game().vm.constructor.meleeTool(bladeW()); g = new THREE.Group(); g.add(t); t.rotation.z = -Math.PI / 2; t.scale.setScalar(1.1); }   // laid along the table, handle to the left
    else g = H.game().vm.constructor.displayModel(H.game(), S.def, Math.min(4, S.tier), S.cores);
    const box = new THREE.Box3().setFromObject(g), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    g.position.sub(c); model = new THREE.Group(); model.add(g); model.userData.rxz = 0.5 * Math.hypot(sz.x, sz.z); model.userData.hy = 0.5 * sz.y + 0.05 * Math.hypot(sz.x, sz.z); scene.add(model);   // it turns about the upright: this is as wide and as tall as it ever gets
  }
  function tick(dt) {
    if (!open || !R || !scene) return;
    t += dt; if (!drag || drag.kind !== 'spin') { spin += spinV * dt; spinV *= Math.exp(-dt * 3); }
    bump = Math.max(0, bump - dt * 3.2);
    const w = cv.clientWidth | 0, h = cv.clientHeight | 0;
    if (w > 8 && h > 8 && (cv.width !== w || cv.height !== h)) R.setSize(w, h, false);
    if (model) {
      // It hovers just above the mat whichever way it is turned: its lowest point, measured each frame, is kept 1.5 over
      // the table. The camera stands back far enough that a sphere round the whole model fits the view with a margin.
      const rxz = model.userData.rxz || 30, hy = model.userData.hy || 10, k = 1 + Math.sin(bump * Math.PI) * 0.12;
      model.rotation.set(0.1 + Math.sin(t * 0.7) * 0.02, spin + Math.sin(t * 0.35) * 0.12, 0); model.scale.setScalar(k); model.position.y = 0;
      model.updateMatrixWorld(true); const lo = new THREE.Box3().setFromObject(model).min.y;
      const lift = -11.6 + 1.5 - lo + Math.sin(t * 1.1) * 0.5 + 0.5 + Math.sin(bump * Math.PI) * 3; model.position.y = lift;
      cam.aspect = Math.max(0.3, w / Math.max(1, h));
      // far enough that the widest it turns to fits across, and the tallest fits up and down, with a little room
      const vh = THREE.MathUtils.degToRad(cam.fov / 2), hh = Math.atan(Math.tan(vh) * cam.aspect); let d = rxz * 1.08 + Math.max((rxz * 1.1) / Math.tan(hh), (hy * 1.25) / Math.tan(vh));
      const cy = lift; d = Math.max(d, 75); cam.position.set(0, cy + d * 0.16, d); cam.lookAt(0, cy, 0); cam.updateProjectionMatrix();
    }
    R.setClearColor(0x000000, 0); R.render(scene, cam);
  }

  // ---- what the panels say
  const fmt = { damage: (v) => v.toFixed(v < 20 ? 1 : 0), rate: (v) => v.toFixed(1) + ' /s', dps: (v) => Math.round(v).toLocaleString(), mag: (v) => v, reload: (v) => v.toFixed(2) + 's', crit: (v) => Math.round(v) + '%', critX: (v) => 'x' + v.toFixed(1), head: (v) => '+' + Math.round(v - 100) + '%', pellets: (v) => v, pierce: (v) => v };
  const ROWS = [['dps', 'Damage per second', 1], ['damage', 'Damage per projectile'], ['pellets', 'Projectiles per shot'], ['rate', 'Fire rate'], ['mag', 'Magazine'], ['reload', 'Reload', 0, -1], ['crit', 'Crit chance'], ['critX', 'Crit damage'], ['head', 'Headshot bonus'], ['pierce', 'Pierces']];
  // why a part is worth more on this gun, in a few words (or '' when it is nothing special here)
  function suits(sg, d) {
    if (!sg) return '';
    const k = d.mods && d.mods[0] ? sg.aff && sg.aff[d.mods[0][0]] : 0, pm = d.fx ? sigProc(sg, d.fx) : 1;
    if (k > 1) return `x${k} on this gun`;
    if (pm > 1) return `goes off x${pm} as often on this gun`;
    return sg.fav && sg.fav.includes(d.name) ? 'suits this gun' : '';
  }
  function sheetWith(u) {   // the numbers as they would be with one more part fitted
    const p = P(), S = p.slot; if (u < 0) return null;
    if (onBlade) { if (!BLADE[U(u).name] || p.bladeCores.length >= p.partSlots({ blade: true })) return null; p.bladeCores.push(u); p.recompute(); const sh = bladeSheet(); p.bladeCores.pop(); p.recompute(); return sh; }
    if (S.cores.length >= p.partSlots(S)) return null;
    S.cores.push(u); p.recompute(); const sh = p.gunSheet(); S.cores.pop(); p.recompute(); return sh;
  }
  function statsHtml(flash) {
    if (onBlade) return bladeHtml(flash);
    const p = P(), sh = p.gunSheet(); if (!sh) return '';
    const nx = hover >= 0 ? sheetWith(hover) : null;
    const sgRule = sigOf(DATA.weapons[p.slot.def]);
    let h = '';
    for (const [k, label, big, sign] of ROWS) {
      if (k === 'crit' && sgRule && sgRule.noCrit) { h += `<div class="row"><span>${label}</span><span><b style="font-size:19px">earned, not rolled</b></span></div>`; continue; }
      const v = sh[k], was = lastSheet ? lastSheet[k] : v, better = (sign || 1) * (v - was);
      let d = ''; if (nx && Math.abs(nx[k] - v) > 1e-6) { const good = (sign || 1) * (nx[k] - v) > 0; d = `<u class="${good ? '' : 'neg'}">&#9654; ${fmt[k](nx[k])}</u>`; }
      h += `<div class="row${big ? ' big' : ''}"><span>${label}</span><span><b class="${flash && Math.abs(better) > 1e-6 ? (better > 0 ? 'up' : 'down') : ''}">${fmt[k](v)}</b>${d}</span></div>`;
    }
    // what the fitted parts do, added up
    const S = p.slot, n = new Map(); for (const u of S.cores) n.set(u, (n.get(u) || 0) + 1);
    let fx = ''; for (const [u, c] of n) fx += `<div style="--c:${U(u).hex}"><b>${esc(U(u).name)}${c > 1 ? ' x' + c : ''}</b>  ${esc(U(u).desc)}${c > 1 ? ' (each)' : ''}</div>`;
    if (S.mods.length) fx += `<div style="--c:#ffcd5a"><b>Tune-up ${'I'.repeat(S.mods.length)}</b>  +${20 * S.mods.length}% damage, bigger magazine and reserve</div>`;
    lastSheet = sh;
    const sg = sigOf(DATA.weapons[S.def]);
    if (sg) h = `<div class="sig" style="--c:${RARITY_HEX[DATA.weapons[S.def].rarity] || '#ffcd5a'}"><b>${esc(sg.name.toUpperCase())}</b>${esc(sg.text)}<i>${esc(sg.play)}</i><em>Best with: ${esc(sg.fav.join(', '))}</em></div>` + h;
    return h + `<div class="fx">${fx || '<div style="color:#9a8f7c">Nothing fitted yet.</div>'}</div>`;
  }
  function bladeHtml(flash) {
    const p = P(), sh = bladeSheet(), nx = hover >= 0 ? sheetWith(hover) : null, W = bladeW();
    let h = `<div class="sig" style="--c:${RARITY_HEX[W.rarity] || '#ffcd5a'}"><b>${esc(W.name.toUpperCase())}</b>Parts work on a blade too: each does what it would to an edge (shown on the part). They stay on the melee slot when you change blades.</div>`;
    for (const [k, label, big] of BROWS) {
      const v = sh[k], was = lastSheet && lastSheet.damage !== undefined && lastSheet.reach !== undefined ? lastSheet[k] : v, better = v - was;
      let d = ''; if (nx && Math.abs(nx[k] - v) > 1e-6) d = `<u class="${nx[k] > v ? '' : 'neg'}">&#9654; ${bfmt[k](nx[k])}</u>`;
      h += `<div class="row${big ? ' big' : ''}"><span>${label}</span><span><b class="${flash && Math.abs(better) > 1e-6 ? (better > 0 ? 'up' : 'down') : ''}">${bfmt[k](v)}</b>${d}</span></div>`;
    }
    lastSheet = sh;
    const n = new Map(); for (const u of p.bladeCores) n.set(u, (n.get(u) || 0) + 1);
    let fx = ''; for (const [u, c] of n) fx += `<div style="--c:${U(u).hex}"><b>${esc(U(u).name)}${c > 1 ? ' x' + c : ''}</b>  ${esc(partText(u))}${c > 1 ? ' (each)' : ''}</div>`;
    return h + `<div class="fx">${fx || '<div style="color:#9a8f7c">Nothing fitted yet.</div>'}</div>`;
  }
  function render(flash) {
    const p = P(), S = sel(), G = guns(), inv = Object.keys(p.coreInv).map(Number).filter((u) => p.coreInv[u] > 0).sort((a, b) => a - b);
    const total = inv.reduce((s, u) => s + p.coreInv[u], 0);
    let h = `<div class="cw"><div class="ch"><h1>WORKBENCH</h1><div class="sub">Drag a part onto the gun or the blade to fit it, or off it to take it back. Four slots to start, and one more each time it evolves (a blade: each time it is honed). Hold Shift to move every copy at once.</div><button id="cclose">DONE  [E]</button></div><div class="cb">`;
    h += `<div class="col"><h2>PARTS <i>${total} carried</i></h2><div class="list">`;
    if (!inv.length) h += `<div class="empty">You are not carrying any parts.<br><br>They drop from what you kill: the stranger the enemy, the better the part. Bosses always leave one.</div>`;
    const sg = onBlade ? null : sigOf(DATA.weapons[S.def]);
    for (const u of inv) { const nt = suits(sg, U(u)); h += `<div class="chip${nt ? ' suit' : ''}" data-u="${u}" style="--c:${U(u).hex}">${gly(u)}<div><b>${esc(U(u).name)}</b><span>${esc(partText(u))}${nt ? ` <u>${nt}</u>` : ''}</span></div><em>x${p.coreInv[u]}</em></div>`; }
    h += `</div>${recHtml(p)}</div><div class="mid"><div class="tabs">`;
    for (const i of G) { const W = DATA.weapons[p.weapons[i].def], s = p.weapons[i]; h += `<div class="tab${!onBlade && i === p.active ? ' on' : ''}" data-i="${i}" style="--c:${RARITY_HEX[W.rarity] || '#fff'}">${esc(W.name.toUpperCase())}<small>${s.cores.length} / ${p.partSlots(s)} slots</small></div>`; }
    { const W = bladeW(); h += `<div class="tab${onBlade ? ' on' : ''}" data-i="blade" style="--c:${RARITY_HEX[W.rarity] || '#fff'}">${esc(W.name.toUpperCase())}<small>${p.bladeCores.length} / ${p.partSlots({ blade: true })} slots</small></div>`; }
    h += `</div><div class="table" id="ctable"><canvas id="ccv"></canvas><div class="hint">${total ? 'Drop a part here' : ''}</div><div class="pop" id="cpop"></div></div><div class="slots">`;
    // its slots: one tile each, filled or empty; the ones still to come are shown locked
    const cap = p.partSlots(S), most = onBlade ? 4 + HONE_MAX : 8;
    for (let i = 0; i < most; i++) { const u = S.cores[i];
      if (u !== undefined && i < S.cores.length) h += `<div class="slot fill" data-u="${u}" style="--c:${U(u).hex}" title="${esc(partText(u))}">${gly(u)}<small>${esc(U(u).name)}</small></div>`;
      else h += i < cap ? '<div class="slot"><small>EMPTY</small></div>' : `<div class="slot lock" title="${onBlade ? 'Hone the blade to open this slot' : 'Evolve the gun to open this slot'}"><small>${onBlade ? 'HONE' : 'EVOLVE'} ${ROMAN[i - 3] || ''}</small></div>`; }
    if (onBlade) {
      const t = p.meleeTier || 0, need = p.honeNeed(), k = p.meleeK || 0, maxed = t >= HONE_MAX;
      h += `</div><div class="evo"><div class="eb"><i style="width:${maxed ? 100 : Math.min(100, (k / need) * 100)}%"></i></div><div class="et"><b>${maxed ? 'FULLY HONED' : `HONED ${t ? ROMAN[t] : '0'} OF IV`}</b><span>${maxed ? 'The blade is as sharp as it gets.' : `${Math.max(0, need - k)} more kills with the blade and it is honed: harder, faster, further, and one more part slot.`}</span></div></div></div>`;
    } else {
      const maxed = S.mods.length >= 4, need = p.evoNeed(S), k = S.evoK || 0;
      h += `</div><div class="evo"><div class="eb"><i style="width:${maxed ? 100 : Math.min(100, (k / need) * 100)}%"></i></div><div class="et"><b>${maxed ? 'FULLY EVOLVED' : `EVOLVED ${S.mods.length ? ROMAN[S.mods.length] : '0'} OF IV`}</b><span>${maxed ? 'This gun has evolved four times.' : `${Math.max(0, need - k)} more kills with this gun and it evolves: +20% damage, +15% magazine and reserve, a little fire rate and reload, and one more part slot.`}</span></div></div>${ascHtml(S)}</div>`;
    }
    h += `<div class="col"><h2>${esc(onBlade ? bladeW().name.toUpperCase() : DATA.weapons[S.def].name.toUpperCase())}</h2><div id="cstats" style="display:flex;flex-direction:column;min-height:0;flex:1;overflow-y:auto">${statsHtml(flash)}</div></div></div>`;
    // passives
    const pas = []; for (let k = 0; k < CORE_DEFS.length; k++) { const u = CORE0 + k; if (CORE_DEFS[k].kind === 'me' && p.upgradeStacks[u] > 0) pas.push(u); }
    h += `<div class="cf"><h3>ON YOU</h3>${pas.length ? pas.map((u) => `<div class="pas" style="--c:${U(u).hex}" title="${esc(U(u).desc)}">${gly(u)}<b>${esc(U(u).name)}</b><em>x${p.upgradeStacks[u]}</em><span>${esc(U(u).desc)}</span></div>`).join('') : '<span style="color:#9a8f7c;font-size:17px">Passives (health, speed, armor and the like) work the moment you pick them up. None yet.</span>'}</div></div>`;
    el.innerHTML = h;
    const pv = H.preview(); R = pv && pv.R; cv = pv ? pv.canvas : null;
    if (cv) { cv.id = 'ccv'; cv.style.cssText = ''; el.querySelector('#ccv').replaceWith(cv); }
    ensureScene(); rebuildModel(false);
    if (flash) setTimeout(() => el.querySelectorAll('.row b').forEach((b) => b.classList.remove('up', 'down')), 60);
    el.querySelector('#cclose').onclick = close;
    el.querySelectorAll('.tab').forEach((tb) => { tb.onclick = () => {
      if (tb.dataset.i === 'blade') { if (!onBlade) { onBlade = true; lastSheet = null; modelKey = ''; H.audio.play('S_Switch', 0.6); render(false); } return; }
      const i = +tb.dataset.i; if (i !== p.active || onBlade) { onBlade = false; if (i !== p.active || p.wield) p.switchTo(i); lastSheet = null; modelKey = ''; H.audio.play('S_Switch', 0.6); render(false); } }; });
    // an ascended gun's temper and element
    el.querySelectorAll('.ap').forEach((b) => { b.onclick = () => { if (onBlade) return; Meta.setAscPick(DATA.weapons[S.def].name, b.dataset.k, b.dataset.v); p.recompute(); H.audio.play('S_Fit', 0.7); bump = 0.6; pop('#ff8cff'); render(true); }; });
    // the Recycler
    el.querySelectorAll('.hs.f').forEach((b) => { b.onclick = () => { hop.splice(+b.dataset.h, 1); H.audio.play('S_Unfit', 0.6); render(false); }; });
    const act = (id, fn) => { const b = el.querySelector(id); if (b) b.onclick = () => { const r = fn(); hop = []; if (r === false || r < 0) H.audio.play('S_Deny', 0.6); else { H.audio.play(id === '#rban' ? 'S_Deny' : 'S_Upgrade', 0.8); recOut = id === '#rban' ? 'Struck from this run.' : `The Recycler made: <b style="color:${U(r).hex}">${esc(U(r).name)}</b>${CORE_DEFS[r - CORE0].kind === 'me' ? ' (yours at once)' : ''}`; } render(true); }; };
    act('#rrec', () => p.recycle(hop[0], hop[1])); act('#rrer', () => p.rerollPart(hop[0])); act('#rban', () => p.banishPart(hop[0]));
    el.querySelectorAll('.chip').forEach((c) => {
      c.onpointerdown = (e) => startDrag(e, { kind: 'fit', u: +c.dataset.u });
      c.onpointerenter = () => { if (!drag) { hover = +c.dataset.u; refreshStats(); } }; c.onpointerleave = () => { if (!drag && hover >= 0) { hover = -1; refreshStats(); } };
    });
    el.querySelectorAll('.slot.fill').forEach((s) => { s.onpointerdown = (e) => startDrag(e, { kind: 'pull', u: +s.dataset.u }); });
    if (cv) cv.onpointerdown = (e) => { drag = { kind: 'spin', x: e.clientX }; cv.setPointerCapture(e.pointerId); };
  }
  // ---- the Recycler: a hopper for up to two parts, and what the machine can do with them
  let hop = [], recOut = '';
  function recHtml(p) {
    if (!deed('recycle')) return `<div class="rec locked" id="crec"><h3>THE RECYCLER</h3><p>Locked. ${DEEDS.find((d) => d.id === 'recycle').need} Then two parts you do not want become one new part.</p></div>`;
    // only what you still carry can sit in the hopper
    const c = {}; hop = hop.filter((u) => { c[u] = (c[u] || 0) + 1; return (p.coreInv[u] || 0) >= c[u]; });
    const slot = (i) => (hop[i] !== undefined ? `<div class="hs f" data-h="${i}" style="--c:${U(hop[i]).hex}" title="${esc(U(hop[i]).name)}: click to take it back">${gly(hop[i])}</div>` : '<div class="hs">+</div>');
    const rr = deed('reroll'), bn = deed('banish'), left = 3 - (p.banishN || 0);
    let h = `<div class="rec" id="crec"><h3 title="Drop parts in here. Two become one new part, as rare as the lesser of them.">THE RECYCLER <i>drop two parts in</i></h3><div class="hop">${slot(0)}<b>+</b>${slot(1)}</div><div class="rb">`;
    h += `<button id="rrec" ${hop.length === 2 ? '' : 'disabled'}>RECYCLE</button>`;
    h += rr ? `<button id="rrer" ${hop.length === 1 && p.rerolls > 0 ? '' : 'disabled'} title="Turn one part into another of the same rarity. Once a room.">REROLL (${p.rerolls > 0 ? p.rerolls : 0})</button>` : '';
    h += bn ? `<button id="rban" class="bn" ${hop.length === 1 && left > 0 ? '' : 'disabled'} title="This kind of part will not drop again this run. You lose the ones you carry.">BANISH (${left})</button>` : '';
    h += `</div><div class="out">${recOut}</div>`;
    const nx = !rr ? DEEDS.find((d) => d.id === 'reroll') : !bn ? DEEDS.find((d) => d.id === 'banish') : null;
    if (nx) h += `<p style="opacity:.75">Next: ${esc(nx.name)}. ${esc(nx.need)}</p>`;
    return h + '</div>';
  }
  // ---- what this gun has earned on other runs
  function ascHtml(S) {
    const W = DATA.weapons[S.def], a = Meta.asc(W.name), dia = '\u25C6'.repeat(a) + '\u25C7'.repeat(3 - a);
    if (!a) return `<div class="asc lk"><h4>NOT YET ASCENDED <s>${dia}</s></h4>Finish a Descent with this gun doing the most damage and it ascends: once on each difficulty, three times in all. I: start runs with it. II: choose its temper. III: bind it to an element.</div>`;
    const T = temperOf(W.name), A = attuneOf(W.name);
    let h = `<div class="asc"><h4>ASCENDED ${ROMAN[a]} <s>${dia}</s></h4>`;
    h += a >= 2 ? `<div class="ar"><label>TEMPER</label>${TEMPERS.map((t) => `<span class="ap${t.id === T.id ? ' on' : ''}" data-k="temper" data-v="${t.id}" title="${esc(t.text)}">${t.name}</span>`).join('')}<em>${esc(T.text)}</em></div>` : `<div>${ROMAN[2]}, Tempered: win with it on another difficulty to choose a temper for it.</div>`;
    h += a >= 3 ? `<div class="ar"><label>ELEMENT</label>${ATTUNES.map((t) => `<span class="ap${t.id === A.id ? ' on' : ''}" data-k="attune" data-v="${t.id}" title="${esc(t.text)}" ${t.hex && t.id !== A.id ? `style="color:${t.hex}"` : ''}>${t.name}</span>`).join('')}<em>${esc(A.text)}</em></div>` : a >= 2 ? `<div style="margin-top:4px">${ROMAN[3]}, Attuned: win with it on the third difficulty to bind it to an element.</div>` : '';
    return h + '</div>';
  }
  function refreshStats() { const c = el.querySelector('#cstats'); if (c) { const keep = lastSheet; c.innerHTML = statsHtml(false); lastSheet = keep; } }
  function pop(col) { const q = el.querySelector('#cpop'); if (!q) return; q.style.setProperty('--c', col); q.classList.remove('go'); void q.offsetWidth; q.classList.add('go'); }

  // ---- dragging
  let ghost = null;
  function startDrag(e, d) {
    e.preventDefault(); drag = Object.assign(d, { x0: e.clientX, y0: e.clientY, moved: false, all: e.shiftKey });
    ghost = document.createElement('div'); ghost.id = 'cghost'; ghost.style.setProperty('--c', U(d.u).hex); ghost.innerHTML = gly(d.u); document.body.appendChild(ghost); moveGhost(e);
    if (d.kind === 'fit') { hover = d.u; refreshStats(); }
    H.audio.play('S_UIMove', 0.5, 1.2);
  }
  function moveGhost(e) { if (ghost) { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; } }
  const overRec = (e) => { const n = el.querySelector('#crec'); if (!n || n.classList.contains('locked')) return false; const r = n.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; };
  const overTable = (e) => { const tb = el.querySelector('#ctable'), sl = el.querySelector('.slots'); const hit = (n) => { if (!n) return false; const r = n.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; }; return hit(tb) || hit(sl); };
  addEventListener('pointermove', (e) => {
    if (!open || !drag) return;
    if (drag.kind === 'spin') { const dx = e.clientX - drag.x; spin += dx * 0.012; spinV = dx * 0.5; drag.x = e.clientX; return; }
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6) drag.moved = true;
    moveGhost(e); const tb = el.querySelector('#ctable'); if (tb) tb.classList.toggle('over', drag.kind === 'fit' && overTable(e));
    const rc = el.querySelector('#crec'); if (rc) rc.classList.toggle('over', drag.kind === 'fit' && overRec(e));
  });
  addEventListener('pointerup', (e) => {
    if (!open || !drag) return; const d = drag; drag = null;
    if (d.kind === 'spin') return;
    if (ghost) { ghost.remove(); ghost = null; }
    const p = P(), S = sel(), on = overTable(e); hover = -1;
    // a part dropped on the gun (or simply clicked) is fitted; a fitted part dragged off the bench (or clicked) comes off
    const all = d.all || e.shiftKey;
    if (d.kind === 'fit' && d.moved && overRec(e)) {   // into the Recycler's hopper
      const inHop = hop.filter((u) => u === d.u).length;
      if (hop.length < 2 && (p.coreInv[d.u] || 0) > inHop) { hop.push(d.u); recOut = ''; H.audio.play('S_Fit', 0.6, 0.8); } else H.audio.play('S_Deny', 0.6);
      render(false); return;
    }
    if (d.kind === 'fit' && (on || !d.moved)) {
      let n = 0; while (p.fitCore(S, d.u)) { n++; if (!all) break; }
      if (n) { bump = 1; H.audio.play('S_Fit', 0.9); render(true); pop(U(d.u).hex); return; }
      H.audio.play('S_Deny', 0.6);
    } else if (d.kind === 'pull' && (!on || !d.moved)) { let n = 0; while (p.pullCore(S, d.u)) { n++; if (!all) break; } if (n) { H.audio.play('S_Unfit', 0.8); bump = 0.5; render(true); return; } }
    render(false);
  });
  addEventListener('keydown', (e) => { if (!open) return; e.stopImmediatePropagation(); if (e.code === 'KeyE' || e.code === 'Escape' || e.code === 'Tab' || e.code === 'KeyF') { e.preventDefault(); close(); } }, true);
  addEventListener('keyup', (e) => { if (open) e.stopImmediatePropagation(); }, true);

  function show(blade) { if (open || !H.game() || !H.game().descent) return; open = true; onBlade = !!blade; hop = []; recOut = ''; lastSheet = null; modelKey = ''; hover = -1; drag = null; P().coreNew = 0; H.entered(); el.style.display = 'block'; render(false); H.audio.play('S_Bench', 0.8); }
  function close() { if (!open) return; open = false; if (ghost) { ghost.remove(); ghost = null; } el.style.display = 'none'; H.left(); }
  return { show, close, tick, isOpen: () => open, refresh: () => { if (open) render(false); } };
}
