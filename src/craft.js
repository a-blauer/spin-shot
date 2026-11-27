// The Descent's workbench: the gun on the table, the parts you are carrying beside it, and the numbers on the other side.
// Drag a part onto the gun and it is fitted there and then: the model changes, the numbers move. Drag it off again to
// take it back. Hovering a part shows what it would do before you commit to it.
import * as THREE from 'three';
import { DATA, RARITY_HEX, cash } from './data.js';
import { CORE0, CORE_DEFS, coreSvg, BLADE, fusionOf, coreTier } from './cores.js';
import { MELEE, HONE_MAX } from './melee.js';
import { sigOf, sigProc } from './signatures.js';
import { Meta } from './meta.js';
import { TURRET_TYPES, turretStats, turretModel } from './turret.js';
import { machine, MACHINES, ROMAN, ASC, TEMPERS, ATTUNES, temperOf, attuneOf } from './deeds.js';
import { ASPECTS, ASPECT_ORDER, PART_ASPECT, aspectsOf, forgePlan, forgeText, forgeName, forgeRoles, forgeSym, forgeHolds } from './forge.js';

const CSS = `
#craft { display:none; position:fixed; inset:0; z-index:9; cursor:default; color:#f2e8d5; font-family:"Barlow Condensed",sans-serif;
  background:radial-gradient(ellipse at 50% 42%, rgba(46,30,22,0.94), rgba(10,6,8,0.985) 70%); user-select:none; touch-action:none; }
#craft .cw { position:absolute; inset:3vh 3vw; display:grid; grid-template-rows:auto 1fr auto; gap:1.4vh; }
#craft .ch { display:flex; align-items:baseline; gap:18px; border-bottom:2px solid rgba(255,205,90,0.35); padding-bottom:6px; }
#craft .ch h1 { margin:0; font:400 44px "Big Shoulders Display"; letter-spacing:2px; color:#ffcd5a; }
#craft .ch .sub { font-size:18px; color:#a99e8b; flex:1; line-height:1.3; }
#craft kbd { font:700 14px "Barlow Condensed"; letter-spacing:.5px; color:#140d12; background:#e9dfc8; padding:1px 6px; border-radius:4px; box-shadow:0 2px 0 #000; margin:0 2px; }
#craft .ch .cash { font:400 30px "Big Shoulders Display"; color:#ffd23a; }
#craft .ch button { font:400 22px "Big Shoulders Display"; letter-spacing:1px; background:#ffcd5a; color:#140d12; border:0; border-radius:6px; box-shadow:0 3px 0 #000; padding:7px 20px; cursor:pointer; align-self:center; }
#craft .ch button:hover { filter:brightness(1.08); }
#craft .cb { display:grid; grid-template-columns:minmax(250px,23vw) 1fr minmax(250px,23vw); gap:1.6vw; min-height:0; }
#craft h2 { margin:0 0 8px; font:400 24px "Big Shoulders Display"; letter-spacing:1.5px; color:#ffcd5a; display:flex; justify-content:space-between; }
#craft h2 i { font:600 17px "Barlow Condensed"; color:#b9ad98; font-style:normal; }
#craft .col { background:rgba(0,0,0,0.38); border:1px solid rgba(255,205,90,0.18); border-radius:8px; padding:12px 12px; display:flex; flex-direction:column; min-height:0; }
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
#craft .tab { flex:1; padding:7px 10px; background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.12); border-radius:6px 6px 0 0; border-bottom:3px solid transparent; cursor:pointer; font:400 22px "Big Shoulders Display"; letter-spacing:1px; color:#b9ad98; text-align:center; }
#craft .tab:hover:not(.on) { color:#e9dfc8; background:rgba(255,255,255,0.05); }
#craft .tab.on { color:var(--c); border-bottom-color:var(--c); background:rgba(255,255,255,0.08); }
#craft .tab small { display:block; font:600 14px "Barlow Condensed"; color:#9a8f7c; letter-spacing:0; }
#craft .table { position:relative; flex:1; min-height:160px; margin-top:8px; border:1px solid rgba(255,205,90,0.22); border-radius:6px;
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
#craft .evo .et { display:flex; gap:14px; align-items:baseline; font-size:17px; color:#b9ad98; margin-top:6px; line-height:1.25; }
#craft .evo .et b { white-space:nowrap; flex:none; }
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
#craft .rec { margin-top:10px; padding:9px 12px; flex:none; border:1px solid rgba(154,255,192,.28); border-left:4px solid #9affc0; border-radius:6px; background:rgba(14,40,28,.35); }
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
#craft .rec button { font:400 17px "Big Shoulders Display"; letter-spacing:1px; padding:5px 12px; background:#9affc0; color:#0c1a12; border:0; border-radius:4px; cursor:pointer; }
#craft .rec button:hover:not(:disabled) { filter:brightness(1.1); }
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
#craft .cf { display:flex; gap:8px; align-items:center; flex-wrap:wrap; min-height:44px; background:rgba(0,0,0,0.38); border:1px solid rgba(255,205,90,0.18); border-radius:8px; padding:6px 12px; }
#craft .cf h3 { margin:0 8px 0 0; font:400 21px "Big Shoulders Display"; letter-spacing:1px; color:#ffcd5a; }
#craft .pas { display:flex; align-items:center; gap:6px; padding:3px 9px 3px 4px; border:1px solid rgba(255,255,255,0.14); background:rgba(255,255,255,0.05); font-size:16px; }
#craft .pas .gly { width:28px; height:28px; font-size:12px; } #craft .pas b { color:var(--c); font-size:17px; } #craft .pas em { font:400 19px "Big Shoulders Display"; font-style:normal; }
#craft .rec select { font:600 16px "Barlow Condensed"; background:#0c1a12; color:#e9dfc8; border:1px solid rgba(154,255,192,.45); border-radius:4px; padding:5px 6px; max-width:100%; flex:1; min-width:0; }
#craft .rec .scrap { font:400 24px "Big Shoulders Display"; color:#e9dfc8; margin-left:auto; }
#craft .rec .drop { border:2px dashed rgba(154,255,192,.35); border-radius:6px; padding:8px; text-align:center; color:#d8cdb8; font-size:16px; margin:4px 0 8px; line-height:1.3; }
#craft .rec .drop small { font-size:14px; color:#9a8f7c; }
#craft .pas { cursor:pointer; position:relative; } #craft .pas.sel { outline:2px solid #ff8cff; background:rgba(255,140,255,.12); }
#craft .pas button { font:400 15px "Big Shoulders Display"; padding:2px 6px; margin-left:4px; background:#2a1630; color:#ff8cff; border:1px solid #ff8cff; cursor:pointer; }
#craft .pas button:disabled { opacity:.35; cursor:default; }
#craft .ft { font:400 21px "Big Shoulders Display"; letter-spacing:1px; color:#ff8cff; margin-left:auto; display:flex; align-items:center; gap:8px; }
#craft .ft button { font:400 17px "Big Shoulders Display"; padding:4px 10px; background:#2a1630; color:#ff8cff; border:2px solid #ff8cff; cursor:pointer; }
#craft .ft button:disabled { opacity:.35; cursor:default; }
#craft .press { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px; border:1px solid rgba(127,255,224,.28); border-radius:8px; background:radial-gradient(ellipse at 50% 40%, rgba(20,70,62,.45), rgba(0,0,0,.35) 70%); padding:20px; }
#craft .press.over { background:rgba(20,80,70,.6); }
#craft .press .dishes { display:flex; gap:26px; align-items:center; }
#craft .press .dish { width:120px; height:120px; border:3px dashed rgba(127,255,224,.55); border-radius:50%; display:flex; align-items:center; justify-content:center; color:rgba(127,255,224,.6); font:400 40px "Big Shoulders Display"; }
#craft .press .dish.f { border:3px solid var(--c); cursor:pointer; background:rgba(0,0,0,.45); }
#craft .press .dish svg { width:84px; height:84px; }
#craft .press .dw { display:flex; flex-direction:column; align-items:center; gap:6px; } #craft .press .dw small { font:400 20px "Big Shoulders Display"; letter-spacing:2px; color:#7fffe0; } #craft .press .dw i { font:600 15px "Barlow Condensed"; font-style:normal; color:var(--a,#9a8f7c); min-height:18px; }
#craft .press .dish.hot { border-color:#ffffff; }
#craft .dim { color:#8f8574; }
#craft .chip.slim { grid-template-columns:40px 1fr auto; padding:4px 8px; }
#craft .eqh { margin-top:12px !important; } #craft .eqlist { flex:0 1 auto; max-height:38%; } #craft .chip.eq { cursor:pointer; background:rgba(0,0,0,0.25); position:relative; } #craft .chip.eq:hover::after { content:'TAKE OFF'; position:absolute; right:8px; bottom:3px; font:700 12px "Barlow Condensed"; color:#ff9a8a; }
#craft .eqg { font:400 16px "Big Shoulders Display"; letter-spacing:1.5px; color:#9a8f7c; margin:6px 0 0 2px; } #craft .chip.slim .gly { width:38px; height:38px; } #craft .chip.slim span i { font-style:normal; font-weight:700; }
#craft .press .res span { display:block; } #craft .press .res span.dim { font-size:15px; margin-top:4px; }
#craft .guide { overflow-y:auto; display:flex; flex-direction:column; gap:12px; font-size:16px; } #craft .guide p { margin:0; line-height:1.25; }
#craft .aspg { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
#craft .aspt { display:flex; align-items:center; gap:8px; padding:5px 8px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-left:3px solid var(--c); font:400 20px "Big Shoulders Display"; letter-spacing:1px; color:var(--c); cursor:help; }
#craft .aspt:hover, #craft .rcp > div:hover { background:rgba(255,255,255,0.12); }
#craft .aspt .gly { width:28px; height:28px; flex:none; }
#craft .rcp { display:flex; flex-direction:column; gap:6px; margin-top:4px; } #craft .rcp > div { padding:6px 10px; background:rgba(0,0,0,0.3); border:1px solid rgba(127,255,224,0.18); border-radius:5px; cursor:help; }
#craft .rcp b { display:block; font:400 19px "Big Shoulders Display"; letter-spacing:1px; color:#7fffe0; } #craft .rcp span { font-size:15px; color:#b9ad98; } #craft .rcp .lock b { color:#6f665a; }
#craft .press .dw small { cursor:help; }
#ctip { position:fixed; z-index:12; display:none; max-width:360px; pointer-events:none; background:rgba(14,10,10,0.97); border:1px solid rgba(255,205,90,0.35); border-radius:6px; box-shadow:0 8px 24px rgba(0,0,0,0.6);
  padding:10px 12px; font:400 16px/1.3 "Barlow Condensed",sans-serif; color:#e6dcc8; }
#ctip b { display:block; font:400 22px "Big Shoulders Display"; letter-spacing:1px; color:#ffcd5a; margin-bottom:3px; }
#ctip em { display:block; font-style:normal; color:#9a8f7c; margin:4px 0; } #ctip em i, #craft .chip span i { font-style:normal; }
#ctip .tr { margin-top:5px; } #ctip .tr u { text-decoration:none; font:400 17px "Big Shoulders Display"; letter-spacing:1px; color:#7fffe0; margin-right:6px; }
#craft .asp { display:grid; grid-template-columns:auto 1fr; gap:2px 8px; font-size:15px; line-height:1.2; margin:6px 0 10px; } #craft .asp b { font:400 18px "Big Shoulders Display"; letter-spacing:1px; } #craft .asp span { color:#d8cdb8; } #craft .asp em { font-style:normal; color:#9a8f7c; }
#craft .press .eq { font:400 46px "Big Shoulders Display"; color:#7fffe0; }
#craft .press .res { min-height:120px; display:flex; gap:14px; align-items:center; max-width:560px; }
#craft .press .res .dish { border-style:solid; flex-shrink:0; }
#craft .press .res b { display:block; font:400 30px "Big Shoulders Display"; color:var(--c); } #craft .press .res span { font-size:18px; color:#e6dcc8; }
#craft .press button { font:400 30px "Big Shoulders Display"; letter-spacing:2px; padding:8px 40px; background:#7fffe0; color:#0a1a18; border:0; border-radius:6px; box-shadow:0 4px 0 #000; cursor:pointer; }
#craft .press button:hover:not(:disabled) { filter:brightness(1.1); } #craft .press button:disabled { background:#1d3a36; color:#5e8f86; box-shadow:none; cursor:default; }
#craft .press p { margin:0; font-size:17px; color:#b9ad98; text-align:center; max-width:560px; line-height:1.25; }
#cghost { position:fixed; z-index:10; pointer-events:none; transform:translate(-50%,-50%) rotate(-6deg) scale(1.15); filter:drop-shadow(0 8px 14px rgba(0,0,0,0.7)); }
#cghost .gly { width:60px; height:60px; display:flex; align-items:center; justify-content:center; font:400 24px "Big Shoulders Display"; color:#14100e; background:var(--c); clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%); }

/* ---- the gunsmith's look: walnut panels with brass rivets, stitched leather tags, brass plates for buttons ---- */
#craft { --wal:#24150d; --walD:#160c07; --walL:#3a2416; --brass:#d9a54e; --brassL:#f3cf86; --brassD:#7a5320; --ink:#1c0f08; --cream:#ecdcb6; --cream2:#b9a582; --ox:#6e2219;
  background:radial-gradient(ellipse at 50% 40%, rgba(58,34,20,0.93), rgba(12,7,5,0.985) 72%),
    repeating-linear-gradient(90deg, rgba(255,220,170,0.018) 0 2px, transparent 2px 11px); color:var(--cream); }
#craft .ch { border-bottom:0; padding-bottom:10px; position:relative; }
#craft .ch::after { content:""; position:absolute; left:0; right:0; bottom:0; height:3px; background:linear-gradient(90deg, transparent, var(--brassD) 8%, var(--brass) 50%, var(--brassD) 92%, transparent); }
#craft .ch h1 { font-size:50px; letter-spacing:4px; background:linear-gradient(180deg, var(--brassL) 15%, var(--brass) 55%, #9a6a26 100%); -webkit-background-clip:text; background-clip:text; color:transparent;
  filter:drop-shadow(0 2px 0 #0a0503) drop-shadow(0 0 14px rgba(217,165,78,0.25)); }
#craft .ch h1::before, #craft .ch h1::after { content:"\\2726"; font-size:20px; vertical-align:middle; margin:0 12px; -webkit-text-fill-color:var(--brass); }
#craft .ch .sub { color:var(--cream2); }
#craft kbd { background:linear-gradient(#f3e4c0, #cdb68a); color:var(--ink); box-shadow:0 2px 0 #3a2410; }
#craft .ch button, #craft .brassbtn { font:400 22px "Big Shoulders Display"; letter-spacing:2px; color:var(--ink); border:1px solid #5a3a12; border-radius:4px; padding:7px 22px; cursor:pointer;
  background:linear-gradient(180deg, var(--brassL), var(--brass) 48%, #a8772c 52%, #c99440); box-shadow:inset 0 1px 0 rgba(255,255,255,0.55), 0 3px 0 #3a2410, 0 6px 12px rgba(0,0,0,0.5); text-shadow:0 1px 0 rgba(255,240,200,0.5); }
#craft .ch button:hover, #craft .brassbtn:hover:not(:disabled) { filter:brightness(1.1); }
#craft .brassbtn:disabled { filter:grayscale(0.8) brightness(0.55); cursor:default; }
#craft .col, #craft .cf { position:relative; border:2px solid #4e321c; border-radius:6px; padding:14px 14px 12px;
  background:radial-gradient(circle at 9px 9px, var(--brass) 2.6px, #4a3010 3.4px, transparent 4.2px), radial-gradient(circle at calc(100% - 9px) 9px, var(--brass) 2.6px, #4a3010 3.4px, transparent 4.2px),
    radial-gradient(circle at 9px calc(100% - 9px), var(--brass) 2.6px, #4a3010 3.4px, transparent 4.2px), radial-gradient(circle at calc(100% - 9px) calc(100% - 9px), var(--brass) 2.6px, #4a3010 3.4px, transparent 4.2px),
    repeating-linear-gradient(90deg, rgba(255,220,170,0.025) 0 1px, transparent 1px 7px, rgba(0,0,0,0.05) 7px 9px, transparent 9px 16px), linear-gradient(180deg, #2c1a10, #1b0f09);
  box-shadow:inset 0 0 0 1px rgba(255,210,140,0.07), inset 0 0 30px rgba(0,0,0,0.55), 0 8px 22px rgba(0,0,0,0.45); }
#craft h2 { color:var(--brass); letter-spacing:2.5px; border-bottom:1px solid rgba(217,165,78,0.25); padding-bottom:5px; margin-bottom:10px; text-shadow:0 2px 0 #0a0503; }
#craft h2 i { color:var(--cream2); }
#craft .chip { position:relative; background:linear-gradient(180deg, #3a2014, #2a160d); border:1px solid #57341e; border-left:5px solid var(--c); border-radius:3px; box-shadow:0 2px 0 rgba(0,0,0,0.5); }
#craft .chip::after { content:""; position:absolute; inset:3px 3px 3px 2px; border:1px dashed rgba(236,220,182,0.16); border-radius:2px; pointer-events:none; }
#craft .chip:hover { background:linear-gradient(180deg, #4a2a1a, #341b10); }
#craft .chip span { color:#d9c8a4; }
#craft .chip em { color:var(--brassL); text-shadow:0 2px 0 #000; }
#craft .gly { box-shadow:0 0 0 2px rgba(0,0,0,0.5); filter:drop-shadow(0 0 0 #000); }
#craft .chip > .gly, #craft .slot.fill .gly { outline:2px solid rgba(217,165,78,0.0); }
#craft .tab { background:linear-gradient(180deg, #2e1b10, #1e110a); border:1px solid #4e321c; border-bottom:3px solid transparent; color:var(--cream2); border-radius:5px 5px 0 0; }
#craft .tab.on { background:linear-gradient(180deg, #4a2e1a, #2e1b10); color:var(--c); border-bottom-color:var(--c); box-shadow:inset 0 1px 0 rgba(255,220,160,0.15); }
#craft .table { border:2px solid #4e321c; border-radius:4px; box-shadow:inset 0 0 50px rgba(0,0,0,0.6);
  background:radial-gradient(ellipse at 50% 58%, rgba(255,190,110,0.22), rgba(0,0,0,0) 60%), linear-gradient(#170d08, #261509 58%, #3e2616 58%, #2a180d); }
#craft .slot { border:2px solid #4e321c; border-radius:50%; background:radial-gradient(circle, #120a06 55%, #2a180d); box-shadow:inset 0 3px 8px rgba(0,0,0,0.8), 0 0 0 2px rgba(217,165,78,0.25); }
#craft .slot small { color:#8c7a5e; }
#craft .slot.fill { border:2px solid var(--c); background:radial-gradient(circle, #2e1b10 50%, #1b0f09); box-shadow:inset 0 2px 6px rgba(0,0,0,0.7), 0 0 0 2px var(--brass), 0 0 14px color-mix(in srgb, var(--c) 45%, transparent); }
#craft .slot.fill small { position:absolute; bottom:-16px; white-space:nowrap; font-size:11px; color:var(--cream2); }
#craft .slots { gap:12px; padding-bottom:12px; }
#craft .slot.lock { border:2px dashed rgba(217,165,78,0.18); background:rgba(0,0,0,0.25); box-shadow:none; }
#craft .evo .eb { height:12px; border:1px solid #6a3a5a; border-radius:6px; background:#1a0c14; overflow:hidden; box-shadow:inset 0 2px 4px #000; }
#craft .evo .eb i { background:linear-gradient(90deg, #a04a9a, #ff8cff); box-shadow:0 0 10px #ff8cff; }
#craft .row { border-bottom:1px dotted rgba(217,165,78,0.18); color:#d9c8a4; }
#craft .row b { color:var(--cream); }
#craft .row.big { border-bottom:2px solid rgba(217,165,78,0.45); } #craft .row.big b { color:var(--brassL); text-shadow:0 0 14px rgba(217,165,78,0.35); }
#craft .sig { background:linear-gradient(90deg, rgba(217,165,78,0.13), rgba(217,165,78,0.02)); border-radius:0 4px 4px 0; }
#craft .cf { padding:8px 14px; }
#craft .cf h3 { color:var(--brass); }
#craft .pas { background:linear-gradient(180deg, #3a2014, #2a160d); border:1px solid #57341e; border-radius:3px; }
/* the Recycler, on the bench: a brass counter for the scrap, a hopper to drop parts in, and the catalogue button */
#craft .rec { border:2px solid #4e321c; border-left:5px solid #8fd6a8; border-radius:4px; background:linear-gradient(180deg, #1e2418, #141810); box-shadow:inset 0 0 24px rgba(0,0,0,0.6); }
#craft .rec h3 { color:#a8e8bc; display:flex; align-items:center; justify-content:space-between; }
#craft .rec .ctr { font:400 24px "Big Shoulders Display"; color:var(--ink); background:linear-gradient(180deg, var(--brassL), var(--brass)); padding:1px 10px; border-radius:3px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 0 #3a2410; letter-spacing:1px; }
#craft .rec .ctr small { font:600 14px "Barlow Condensed"; margin-left:4px; }
#craft .rec .drop { border:2px dashed rgba(168,232,188,0.4); background:repeating-linear-gradient(45deg, rgba(168,232,188,0.05) 0 8px, transparent 8px 16px); color:#cfe6d2; }
#craft .rec.over .drop { background:rgba(120,220,150,0.25); border-color:#a8e8bc; }
#craft .rec button.brassbtn { width:100%; font:400 21px "Big Shoulders Display"; letter-spacing:2px; padding:7px 10px; color:var(--ink); border:1px solid #5a3a12; border-radius:4px;
  background:linear-gradient(180deg, var(--brassL), var(--brass) 48%, #a8772c 52%, #c99440); box-shadow:inset 0 1px 0 rgba(255,255,255,0.55), 0 3px 0 #3a2410; }
/* the catalogue: every part you can make, laid out like a gunsmith's price list */
#cmk { position:absolute; inset:0; z-index:3; display:flex; align-items:center; justify-content:center; background:rgba(8,4,2,0.78); backdrop-filter:blur(3px); }
#cmk .mk { width:min(1240px, 94vw); height:min(760px, 90vh); display:grid; grid-template-columns:1fr 360px; grid-template-rows:auto 1fr; gap:14px; }
#cmk .mkh { grid-column:1 / 3; display:flex; align-items:center; gap:16px; }
#cmk .mkh h1 { margin:0; font:400 40px "Big Shoulders Display"; letter-spacing:3px; color:var(--brassL); text-shadow:0 2px 0 #000; }
#cmk .mkh .sc { font:400 26px "Big Shoulders Display"; color:var(--ink); background:linear-gradient(180deg, var(--brassL), var(--brass)); padding:2px 14px; border-radius:3px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.5), 0 3px 0 #3a2410; }
#cmk .mkh .flt { display:flex; gap:6px; margin-left:auto; }
#cmk .mkh .flt span { font:400 18px "Big Shoulders Display"; letter-spacing:1.5px; padding:5px 12px; border:1px solid #57341e; color:var(--cream2); cursor:pointer; border-radius:3px; background:#24150d; }
#cmk .mkh .flt span.on { color:var(--ink); background:var(--brass); border-color:var(--brass); }
#cmk .grid { overflow-y:auto; padding:4px 8px 8px 2px; }
#cmk .tier { font:400 20px "Big Shoulders Display"; letter-spacing:3px; color:var(--t); margin:10px 0 6px; display:flex; align-items:center; gap:10px; }
#cmk .tier::after { content:""; flex:1; height:1px; background:linear-gradient(90deg, var(--t), transparent); opacity:.5; }
#cmk .tier i { font:600 15px "Barlow Condensed"; font-style:normal; color:var(--cream2); letter-spacing:0; }
#cmk .cards { display:grid; grid-template-columns:repeat(auto-fill, minmax(196px, 1fr)); gap:8px; }
#cmk .card { position:relative; display:grid; grid-template-columns:40px 1fr; gap:4px 8px; padding:8px 9px 7px; cursor:pointer; border-radius:3px;
  background:linear-gradient(180deg, #3a2014, #26140b); border:1px solid #57341e; border-top:3px solid var(--c); box-shadow:0 2px 0 rgba(0,0,0,0.5); transition:transform .08s; }
#cmk .card:hover { transform:translateY(-2px); background:linear-gradient(180deg, #4a2a1a, #2e180e); }
#cmk .card.on { outline:2px solid var(--brassL); box-shadow:0 0 18px rgba(243,207,134,0.35); }
#cmk .card.no { opacity:.45; }
#cmk .card .gly { width:40px; height:40px; grid-row:1 / 3; }
#cmk .card b { font:700 17px "Barlow Condensed"; color:var(--c); line-height:1.05; align-self:end; }
#cmk .card span { font-size:14px; color:#cdbb98; line-height:1.1; grid-column:1 / 3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; min-height:31px; }
#cmk .card u { text-decoration:none; font:400 17px "Big Shoulders Display"; color:var(--brassL); align-self:start; }
#cmk .card u.no { color:#c77; }
#cmk .card em { position:absolute; right:7px; top:6px; font:700 13px "Barlow Condensed"; font-style:normal; color:var(--cream2); }
#cmk .card.suit::before { content:"SUITS THIS GUN"; position:absolute; right:7px; bottom:-8px; font:700 11px "Barlow Condensed"; letter-spacing:.5px; color:#0c1a10; background:#7dff8a; padding:0 5px; border-radius:2px; }
#cmk .det { display:flex; flex-direction:column; gap:10px; }
#cmk .det .big { display:flex; align-items:center; gap:14px; }
#cmk .det .big .gly { width:84px; height:84px; flex:none; }
#cmk .det h3 { margin:0; font:400 34px "Big Shoulders Display"; letter-spacing:1px; color:var(--c); line-height:1; }
#cmk .det .rar { display:inline-block; margin-top:6px; font:700 14px "Barlow Condensed"; letter-spacing:1px; padding:1px 8px; border-radius:2px; color:var(--ink); background:var(--t); }
#cmk .det .rar + .rar { margin-left:4px; background:#3a2416; color:var(--cream); border:1px solid #6a4a2a; }
#cmk .det p { margin:0; font-size:19px; line-height:1.3; color:var(--cream); }
#cmk .det .note { font-size:16px; color:var(--cream2); line-height:1.3; padding:8px 10px; background:rgba(0,0,0,0.3); border-left:3px solid var(--brass); }
#cmk .det .note b { color:var(--brassL); font-weight:700; }
#cmk .det .note.good { border-left-color:#7dff8a; } #cmk .det .note.good b { color:#7dff8a; }
#cmk .det .cost { margin-top:auto; display:grid; grid-template-columns:1fr auto; gap:2px 10px; font-size:18px; color:var(--cream2); border-top:1px solid rgba(217,165,78,0.3); padding-top:8px; }
#cmk .det .cost b { font:400 24px "Big Shoulders Display"; color:var(--cream); text-align:right; } #cmk .det .cost b.no { color:#ff8a7a; }
#cmk .det .brassbtn { font-size:28px; padding:10px; width:100%; }
#cmk .det .out { min-height:22px; font-size:17px; color:#a8e8bc; text-align:center; }
#cmk .x { font:400 20px "Big Shoulders Display"; letter-spacing:1px; padding:6px 14px; border:1px solid #57341e; background:#24150d; color:var(--cream); cursor:pointer; border-radius:3px; }
#cmk .x:hover { background:#3a2416; }
/* the Compressor: a brass press. A gauge on the crosshead, the dishes on the platen, pipes to a glass chamber, and a lever */
#craft .press { position:relative; gap:0; justify-content:flex-start; padding:0; border:2px solid #4e321c; border-radius:6px; overflow:hidden;
  background:radial-gradient(ellipse at 50% 62%, rgba(80,220,190,0.10), rgba(0,0,0,0) 55%), repeating-linear-gradient(90deg, rgba(255,220,170,0.02) 0 1px, transparent 1px 12px), linear-gradient(180deg, #1d120b, #120a06); }
#craft .press.over { background:radial-gradient(ellipse at 50% 62%, rgba(80,220,190,0.28), rgba(0,0,0,0) 60%), linear-gradient(180deg, #1d120b, #120a06); }
#craft .press .head { align-self:stretch; height:118px; position:relative; flex:none;
  background:linear-gradient(180deg, #5a3c1c, #3a2410 40%, #24160a); border-bottom:4px solid #120a05; box-shadow:0 6px 14px rgba(0,0,0,0.6); }
#craft .press .head::before { content:""; position:absolute; left:0; right:0; bottom:10px; height:6px; background:linear-gradient(90deg, var(--brassD), var(--brass), var(--brassD)); }
#craft .press .head .rv { position:absolute; top:14px; width:10px; height:10px; border-radius:50%; background:radial-gradient(circle at 35% 35%, var(--brassL), var(--brassD)); box-shadow:0 1px 1px #000; }
#craft .press .gauge { position:absolute; left:50%; top:10px; width:150px; height:150px; margin-left:-75px; border-radius:50%; z-index:2;
  background:radial-gradient(circle, #f3e6c4 0 58%, #d8c49a 60%, transparent 61%), radial-gradient(circle, var(--brassL) 0 66%, var(--brassD) 70%, #3a2410 72%); box-shadow:0 6px 14px rgba(0,0,0,0.7); }
#craft .press .gauge svg { position:absolute; inset:0; width:100%; height:100%; }
#craft .press .gauge .nd { transform-origin:75px 75px; transition:transform .7s cubic-bezier(.3,1.6,.5,1); }
#craft .press .cols { position:absolute; top:118px; bottom:0; width:26px; background:linear-gradient(90deg, #3a3a40, #8a8a92 40%, #4a4a52); box-shadow:0 0 10px rgba(0,0,0,0.6); }
#craft .press .ram { position:absolute; left:50%; top:110px; width:44px; margin-left:-22px; height:40px; background:linear-gradient(90deg, #5a5a62, #c4c4cc 45%, #6a6a72); transition:height .35s ease-in; z-index:1; }
#craft .press.go .ram { height:190px; transition:height .22s ease-in; }
#craft .press.go { animation:prshake .45s; }
@keyframes prshake { 0%,100% { transform:none; } 30% { transform:translateY(3px); } 50% { transform:translate(-2px,1px); } 70% { transform:translate(2px,2px); } }
#craft .press .steam { position:absolute; width:70px; height:70px; border-radius:50%; background:radial-gradient(circle, rgba(240,240,235,0.55), transparent 65%); opacity:0; pointer-events:none; }
#craft .press.go .steam { animation:steam .9s ease-out; }
@keyframes steam { 0% { opacity:.9; transform:translateY(0) scale(.4); } 100% { opacity:0; transform:translateY(-90px) scale(2.2); } }
#craft .press .floor { flex:1; align-self:stretch; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; padding:22px 20px 18px; position:relative; }
#craft .press .dishes { gap:46px; position:relative; z-index:1; }
#craft .press .dw { position:relative; z-index:2; }
#craft .press .dw i { background:#120a06; padding:1px 8px; border-radius:8px; border:1px solid #3a2410; }
#craft .press .dw small { font:400 17px "Big Shoulders Display"; letter-spacing:3px; color:var(--ink); background:linear-gradient(180deg, var(--brassL), var(--brass)); padding:1px 12px; border-radius:2px; box-shadow:0 2px 0 #3a2410; }
#craft .press .dish { width:128px; height:128px; border:0; color:rgba(127,255,224,0.55);
  background:radial-gradient(circle, rgba(20,60,54,0.9) 0 52%, rgba(127,255,224,0.25) 54%, #0e0805 56%, #0e0805 60%, var(--brassD) 62%, var(--brassL) 68%, var(--brass) 74%, #5a3a12 78%, transparent 79%);
  box-shadow:0 10px 18px rgba(0,0,0,0.6); }
#craft .press .dish:not(.f) { animation:dishpulse 2.4s ease-in-out infinite; }
@keyframes dishpulse { 50% { color:rgba(127,255,224,0.95); text-shadow:0 0 12px rgba(127,255,224,0.8); } }
#craft .press .dish.f { border:0; background:radial-gradient(circle, color-mix(in srgb, var(--c) 30%, #0a0604) 0 52%, var(--c) 54%, #0e0805 56%, #0e0805 60%, var(--brassD) 62%, var(--brassL) 68%, var(--brass) 74%, #5a3a12 78%, transparent 79%);
  box-shadow:0 10px 18px rgba(0,0,0,0.6), 0 0 30px color-mix(in srgb, var(--c) 40%, transparent); }
#craft .press .dish .gly { width:64px; height:64px; }
#craft .press .pipes { position:absolute; left:0; right:0; top:50%; height:0; z-index:0; }
#craft .press .pipe { position:absolute; background:linear-gradient(180deg, #e0a070, #9a5a30 50%, #6a3a1a); box-shadow:0 3px 6px rgba(0,0,0,0.6); border-radius:6px; }
#craft .press .pipe.lit { background:linear-gradient(180deg, #9affe8, #3aa88e 50%, #1e6a5a); box-shadow:0 0 12px rgba(127,255,224,0.6); }
#craft .press .eq { display:none; }
#craft .press .dw i.none { visibility:hidden; }
#craft .press .modes { display:flex; gap:8px; position:relative; z-index:1; }
#craft .press .modes > div { width:180px; padding:6px 10px 7px; border:1px solid #4e321c; border-radius:4px; background:rgba(10,6,4,0.7); text-align:center; transition:all .2s; }
#craft .press .modes b { display:block; font:400 22px "Big Shoulders Display"; letter-spacing:3px; color:var(--brass); }
#craft .press .modes span { display:block; font:700 15px "Barlow Condensed"; color:var(--cream); line-height:1.1; }
#craft .press .modes i { display:block; font-style:normal; font-size:14px; color:var(--cream2); line-height:1.1; }
#craft .press .modes .on { border-color:#7fffe0; background:rgba(20,70,60,0.75); box-shadow:0 0 18px rgba(127,255,224,0.35); }
#craft .press .modes .on b { color:#7fffe0; }
#craft .press .modes .off { opacity:.38; }
#craft .press .dishes.plain .dw small { visibility:hidden; }
#craft .press .dish { width:112px !important; height:112px !important; } #craft .press .res .dish { width:96px !important; height:96px !important; } #craft .press .dish .gly { width:56px; height:56px; }
#craft .press .floor { gap:10px !important; } #craft .press .res { min-height:112px !important; padding:8px 14px 8px 8px !important; } #craft .press .res b { font-size:28px !important; } #craft .press .recipe { font-size:16px !important; padding:6px 14px !important; }
#craft .press .mnote { font-size:15px; color:var(--cream2); margin-top:-6px; position:relative; z-index:1; }
#craft .press .res.none { visibility:hidden; }
#craft .press .head .plate { position:absolute; left:50%; top:30px; transform:translateX(-50%); font:400 30px "Big Shoulders Display"; letter-spacing:6px; color:var(--ink); padding:4px 26px;
  background:linear-gradient(180deg, var(--brassL), var(--brass) 50%, #a8772c); border:1px solid #5a3a12; border-radius:3px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.5), 0 3px 0 #1a0e06; white-space:nowrap; }
#craft .press .recipe { position:relative; z-index:1; max-width:640px; text-align:center; font-size:18px; line-height:1.35; color:var(--cream2); padding:8px 16px; background:rgba(10,6,4,0.75); border:1px solid #4e321c; border-radius:6px; }
#craft .press .recipe label { display:block; font:400 15px "Big Shoulders Display"; letter-spacing:3px; color:var(--brass); margin-bottom:2px; }
#craft .press .recipe s { text-decoration:none; color:#6f6250; font-style:italic; }
#craft .press .res { position:relative; z-index:1; min-height:140px; max-width:620px; gap:18px; padding:12px 18px 12px 12px; border-radius:70px 8px 8px 70px;
  background:linear-gradient(180deg, rgba(10,20,18,0.85), rgba(6,10,9,0.9)); border:2px solid #4e321c; box-shadow:inset 0 0 24px rgba(127,255,224,0.08); }
#craft .press .res .dish { width:116px; height:116px; }
#craft .press .res p { color:#9fbcb4; text-align:left; font-size:18px; }
#craft .press .res b { font-size:32px; text-shadow:0 0 16px color-mix(in srgb, var(--c) 50%, transparent); }
#craft .press .lever { display:flex; align-items:center; gap:14px; }
#craft .press button#cpgo { font:400 32px "Big Shoulders Display"; letter-spacing:4px; padding:10px 46px; border-radius:4px; color:#06201a; border:1px solid #0e3a30;
  background:linear-gradient(180deg, #c8fff0, #7fffe0 48%, #46c8a8 52%, #6ae8c8); box-shadow:inset 0 1px 0 rgba(255,255,255,0.6), 0 4px 0 #0a2a22, 0 0 24px rgba(127,255,224,0.35); }
#craft .press button#cpgo:disabled { background:linear-gradient(180deg, #3a3228, #2a241c); color:#6a5a48; border-color:#2a1e14; box-shadow:0 4px 0 #120a05; }
#craft .press .lever i { font:600 15px "Barlow Condensed"; font-style:normal; color:var(--cream2); max-width:220px; line-height:1.2; }
#craft .aspt { background:linear-gradient(180deg, #3a2014, #26140b); border:1px solid #57341e; border-left:4px solid var(--c); }
#craft .rcp > div { background:linear-gradient(180deg, #24180f, #160e08); border:1px solid #4e321c; border-left:4px solid #7fffe0; }
#ctip { background:linear-gradient(180deg, #2c1a10, #1a0f09); border:1px solid #6a4a22; box-shadow:0 0 0 1px rgba(0,0,0,0.6), 0 10px 26px rgba(0,0,0,0.7); }
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
  let onBlade = false, onTurret = false;
  const sel = () => { const p = P(); return onTurret ? { turret: true, def: -1, cores: p.turretCores || (p.turretCores = []), mods: [] } : onBlade ? { blade: true, def: -1, cores: p.bladeCores, mods: [] } : p.slot; };
  const bladeW = () => MELEE[P().meleeDef] || MELEE[0];
  const partText = (u) => (onTurret ? U(u).desc : onBlade ? (BLADE[U(u).name] ? BLADE[U(u).name][1] : 'Does nothing on a blade') : U(u).desc);
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
    const p = P(), S = p.slot; if (!onTurret && !onBlade && S.def < 0) return;
    const key = onTurret ? 'turret|' + (p.turretType || 'sentry') : onBlade ? 'blade|' + p.meleeDef + '|' + (p.meleeTier || 0) : S.def + '|' + S.tier + '|' + S.cores.join(',');
    if (key === modelKey && !force) return; modelKey = key;
    if (model) scene.remove(model);
    let g;
    if (onTurret) { g = new THREE.Group(); const m = turretModel(p.turretType || 'sentry'); m.scale.setScalar(2.4); g.add(m); }   // shown at the size of a gun on the mat
    else if (onBlade) { const t = H.game().vm.constructor.meleeTool(bladeW()); g = new THREE.Group(); g.add(t); t.rotation.z = -Math.PI / 2; t.scale.setScalar(1.1); }   // laid along the table, handle to the left
    else g = H.game().vm.constructor.displayModel(H.game(), S.def, Math.min(4, S.tier), S.cores);
    const box = new THREE.Box3().setFromObject(g), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    g.position.sub(c); model = new THREE.Group(); model.add(g); model.userData.rxz = 0.5 * Math.hypot(sz.x, sz.z); model.userData.hy = 0.5 * sz.y + 0.05 * Math.hypot(sz.x, sz.z); scene.add(model);   // it turns about the upright: this is as wide and as tall as it ever gets
  }
  function tick(dt) {
    if (!open || !R || !scene || press.mode) return;
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
  function turretHtml() {
    const p = P(), S = turretStats(p), cur = p.turretType || 'sentry';
    let h = '<div class="sig" style="--c:#6ec8ff"><b>SHOULDER TURRET</b>Comes out for a while when you press F and fires on what it sees. Gun parts fitted here work on it: damage, fire rate and crit as on a gun, a bigger magazine keeps it out longer, a faster reload brings it back sooner, and on-hit parts go off from its shots.</div>';
    h += `<div class="ar" style="display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px">${TURRET_TYPES.map((T) => `<span class="tt${T.id === cur ? ' on' : ''}" data-tt="${T.id}" title="${esc(T.text)}" style="cursor:pointer;padding:4px 10px;border:2px solid ${T.id === cur ? '#6ec8ff' : 'rgba(255,255,255,.2)'};font:400 19px 'Big Shoulders Display';color:${T.id === cur ? '#6ec8ff' : '#d8cdb8'}">${esc(T.name.toUpperCase())}</span>`).join('')}</div><div style="font-size:16px;color:#d8cdb8;margin-bottom:6px">${esc(S.T.text)}</div>`;
    const row = (l, v) => `<div class="row"><span>${l}</span><b>${v}</b></div>`;
    h += row('Damage', `x${S.dmg.toFixed(2)}`) + row('Fire rate', `${(S.T.rate * S.rate).toFixed(1)}/s`) + row('Out for', `${S.time.toFixed(1)}s`) + row('Cooldown', `${(30 * S.cdK).toFixed(0)}s`) + row('Range', `${(S.range / 100).toFixed(0)} m`);
    if (S.pellets > 1) h += row('Pellets', S.pellets); if (S.T.chains) h += row('Jumps', S.chains); if (S.crit) h += row('Crit chance', `+${Math.round(S.crit * 100)}%`);
    if (S.procs.length) h += `<div class="fx">${S.procs.map((u) => `<div style="--c:${U(u).hex}"><b>${esc(U(u).name)}</b>  ${esc(U(u).desc)}</div>`).join('')}</div>`;
    return h;
  }
  function statsHtml(flash) {
    if (onTurret) return turretHtml();
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
  // ---- the Compressor's own screen: your gun parts, two dishes (three with the Crucible), and what will come out.
  // Kept quiet on purpose: names, aspects and the result. Everything else is on hover (data-t -> tips[]).
  function renderPress() {
    const p = P(), inv = Object.keys(p.coreInv).map(Number).filter((u) => p.coreInv[u] > 0 && U(u).kind === 'gun').sort((a, b) => a - b);
    const fus = machine('fusion'), cru = machine('crucible'), nd = cru ? 3 : 2;
    { const c = {}; for (let i = 0; i < 3; i++) { const u = press[i]; if (u === undefined) continue; c[u] = (c[u] || 0) + 1; if (i >= nd || (p.coreInv[u] || 0) < c[u]) press[i] = undefined; } }
    const dishes = press.slice(0, nd), filled = dishes.filter((u) => u !== undefined);
    let out = -1, why = '', how = '', plan = null;
    if (filled.length >= 2) {
      [out, how] = p.compressOut(dishes);
      if (how === 'forge') plan = forgePlan(filled);
      else if (out < 0) why = how && how !== 'none' && how !== 'crucible' ? how : filled.length === 2 ? (fusionOf(U(filled[0]).name, U(filled[1]).name) ? 'Fusing two elements needs Compressor: Fusion, found at the bottom of the Descent.' : (filled[0] === filled[1] && (U(filled[0]).pressed || U(filled[0]).fuse)) ? 'A pressed or fused part cannot be pressed again.' : 'Only two of the same part press together. Any two parts forge with Compressor: Fusion, found at the bottom of the Descent.') : '';
    }
    tips = [];
    const tip = (html) => { tips.push(html); return ` data-t="${tips.length - 1}"`; };
    const aspTag = (a) => a.map((x) => `<i style="color:${ASPECTS[x].hex}">${ASPECTS[x].name}</i>`).join(' + ');
    const ROLE = ['TRIGGER', 'EFFECT', 'TWIST'], RK = ['when', 'what', 'how'];
    const ROLE_TIP = ['<b>TRIGGER</b>What sets the new effect off: the aspect of the part on this dish.', '<b>EFFECT</b>What happens when it goes off: the aspect of the part on this dish.', '<b>TWIST</b>Something extra the effect does: the aspect of the part on this dish. Optional.'];
    const aspTip = (a) => { const R = forgeRoles(a), A = ASPECTS[a], parts = Object.keys(PART_ASPECT).filter((n) => PART_ASPECT[n] === a && !Meta.upgradeLocked(n)); return `<b style="color:${A.hex}">${A.name.toUpperCase()}</b><em>${esc(parts.join(', '))}</em><div class="tr"><u>TRIGGER</u>${esc(R.when)}</div><div class="tr"><u>EFFECT</u>${esc(R.what)}</div>${cru ? `<div class="tr"><u>TWIST</u>${esc(R.how)}</div>` : ''}`; };

    let h = `<div class="cw"><div class="ch"><h1>THE COMPRESSOR</h1><div class="sub">${fus ? `Put ${cru ? 'two or three' : 'two'} parts on the dishes to make a new one.` : 'Put two of the same part on the dishes to press them into one.'} <span class="dim">Hover anything for details.</span></div><button id="cclose">DONE  [E]</button></div><div class="cb">`;
    // the parts you carry: name and aspect; what each does is on hover
    h += `<div class="col"><h2>GUN PARTS <i>${inv.reduce((s2, u) => s2 + p.coreInv[u], 0)}</i></h2><div class="list">`;
    if (!inv.length) h += '<div class="empty">You are not carrying any gun parts.</div>';
    for (const u of inv) { const a = aspectsOf(U(u)); h += `<div class="chip slim" data-u="${u}" style="--c:${U(u).hex}"${tip(`<b style="color:${U(u).hex}">${esc(U(u).name)}</b>${fus && a.length ? `<em>${aspTag(a)}</em>` : ''}${esc(U(u).desc)}`)}>${gly(u)}<div><b>${esc(U(u).name)}</b>${fus && a.length ? `<span>${aspTag(a)}</span>` : ''}</div><em>x${p.coreInv[u]}</em></div>`; }
    h += '</div>';
    // what is fitted to your guns (and blade, and turret): click one and it comes off, straight onto a dish
    const src = [];
    for (const gi of guns()) { const S = p.weapons[gi]; if (S.cores && S.cores.length) src.push([`g${gi}`, DATA.weapons[S.def].name, S.cores]); }
    if ((p.bladeCores || []).length) src.push(['blade', bladeW().name, p.bladeCores]);
    if ((p.turretCores || []).length) src.push(['turret', 'Turret', p.turretCores]);
    h += `<h2 class="eqh">ON YOUR GUNS <i>click to take off</i></h2><div class="list eqlist">`;
    if (!src.length) h += '<div class="empty">Nothing fitted.</div>';
    for (const [key, nm, cores] of src) {
      h += `<div class="eqg">${esc(nm.toUpperCase())}</div>`;
      const n = new Map(); for (const u of cores) if (U(u).kind === 'gun') n.set(u, (n.get(u) || 0) + 1);
      for (const [u, c] of n) { const a = aspectsOf(U(u)); h += `<div class="chip slim eq" data-src="${key}" data-u="${u}" style="--c:${U(u).hex}"${tip(`<b style="color:${U(u).hex}">${esc(U(u).name)}</b>${fus && a.length ? `<em>${aspTag(a)}</em>` : ''}${esc(U(u).desc)}<em>Fitted to ${esc(nm)}. Click to take it off and put it on a dish.</em>`)}>${gly(u)}<div><b>${esc(U(u).name)}</b>${fus && a.length ? `<span>${aspTag(a)}</span>` : ''}</div><em>${c > 1 ? 'x' + c : ''}</em></div>`; }
    }
    // the press itself: a crosshead with a gauge that rises as the dishes fill, the columns, the ram, then the platen
    const ready = out >= 0 || !!plan; let mode = '';
    h += '</div></div><div class="mid"><div class="press" id="cpress"><div class="head">';
    for (const x of [3, 12, 21, 79, 88, 97]) h += `<i class="rv" style="left:${x}%"></i>`;
    h += `<div class="plate">${fus ? 'PRESS  &amp;  FORGE' : 'PARTS  PRESS'}</div>`;
    h += `</div><div class="cols" style="left:6%"></div><div class="cols" style="right:6%"></div><div class="ram"></div><div class="steam" style="left:18%;top:70px"></div><div class="steam" style="right:18%;top:70px"></div>`;
    { // the three things the press can do, the one these dishes will do lit
      const same = filled.length === 2 && filled[0] === filled[1]; mode = plan ? 'forge' : out >= 0 ? (same ? 'press' : 'fuse') : '';
      const M = [['press', 'PRESS', 'Two of the same part', 'one part, half again as strong']];
      if (fus) M.push(['fuse', 'FUSE', 'Two different elements', 'a named elemental part'], ['forge', 'FORGE', cru ? 'Any two or three parts' : 'Any two parts', 'keeps them all, plus a new effect']);
      h += `<div class="floor"><div class="modes">${M.map(([k, n, a2, b2]) => `<div class="${mode === k ? 'on' : mode ? 'off' : ''}"><b>${n}</b><span>${a2}</span><i>${b2}</i></div>`).join('')}</div>`;
      if (cru) h += `<div class="mnote">${mode === 'press' || mode === 'fuse' ? 'Two dishes are all this needs: leave the third empty.' : 'Pressing two of the same part, or fusing two elements, uses only the first two dishes.'}</div>`;
    }
    h += `<div class="dishes${mode === 'press' || mode === 'fuse' ? ' plain' : ''}"><div class="pipe${filled.length >= 2 ? ' lit' : ''}" style="left:64px;right:64px;top:${fus ? 70 : 48}px;height:14px"></div><div class="pipe lit" style="display:${ready ? 'block' : 'none'};left:50%;margin-left:-7px;top:${fus ? 70 : 48}px;width:14px;height:${fus ? 150 : 128}px"></div>`;
    for (let i = 0; i < nd; i++) {
      const u = dishes[i], a = u !== undefined ? aspectsOf(U(u)) : [];
      let t = ROLE_TIP[i];
      if (u !== undefined && fus && a.length) t += a.map((x) => `<div class="tr"><u style="color:${ASPECTS[x].hex}">${ASPECTS[x].name}</u>${esc(forgeRoles(x)[RK[i]])}</div>`).join('') + '<em>Click to take it off.</em>';
      else if (u !== undefined) t = `<b style="color:${U(u).hex}">${esc(U(u).name)}</b><em>Click to take it off.</em>`;
      const cap = fus ? `<small${tip(t)}>${ROLE[i]}</small>` : '';
      const asp = fus ? (a.length || i === 2 ? `<i style="--a:${a.length ? ASPECTS[a[0]].hex : '#6f665a'}">${a.length ? a.map((x) => ASPECTS[x].name).join(' + ') : 'optional'}</i>` : '<i class="none"></i>') : '';
      h += `<div class="dw">${cap}` + (u !== undefined ? `<div class="dish f" data-d="${i}" style="--c:${U(u).hex}"${tip(t)}>${gly(u)}</div>` : `<div class="dish" data-d="${i}"${fus ? tip(ROLE_TIP[i]) : ''}>+</div>`) + `${asp}</div>`;
    }
    if (fus && plan) {   // the recipe, read out as a sentence: each dish fills in its part of it
      const seg = (i, ph) => { const u = dishes[i], A = u !== undefined ? aspectsOf(U(u))[0] : null; return A ? `<b style="color:${ASPECTS[A].hex}">${esc(forgeRoles(A)[RK[i]])}</b>` : `<s>${ph}</s>`; };
      h += `</div><div class="recipe"><label>THE NEW EFFECT</label>${seg(0, 'something sets it off')}, ${seg(1, 'something happens')}${nd > 2 ? `, and ${seg(2, 'with a twist (optional)')}` : ''}.`;
    }
    h += `</div><div class="eq">=</div><div class="res${plan || out >= 0 || filled.length ? '' : ' none'}">`;
    if (plan) {
      const nm = forgeName(plan), hx = ASPECTS[plan.what[0]].hex;
      h += `<div class="dish" style="--c:${hx};border-color:${hx}"><div class="gly" style="--c:${hx};width:60px;height:60px"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="color:#14100e">${forgeSym(plan)}</svg></div></div>`;
      h += `<div style="--c:${hx}"${tip(`<b style="color:${hx}">${esc(nm)}</b>${esc(forgeHolds(plan))}<em>Everything those parts do, in one slot.</em>${esc(forgeText(plan))}${plan.L > 1 ? '<em>Resonance: more than one dish shares the WHAT aspect, so it is stronger.</em>' : ''}`)}><b>${esc(nm)}</b><span>${esc(forgeText(plan))}</span><span class="dim">+ keeps ${esc(plan.Us.map((x) => x.name).join(', '))}</span></div>`;
    } else if (out >= 0) h += `<div class="dish" style="--c:${U(out).hex};border-color:${U(out).hex}">${gly(out)}</div><div style="--c:${U(out).hex}"><b>${esc(U(out).name)}</b><span>${esc(U(out).desc)}</span></div>`;
    else h += `<p>${filled.length < 2 ? (filled.length ? 'One more part.' : '') : esc(why)}</p>`;
    h += `</div><div class="lever"><button id="cpgo" ${out >= 0 || plan ? '' : 'disabled'}>${plan ? 'FORGE' : 'PRESS'}</button><i>${ready ? 'The parts on the dishes go in; one comes out.' : filled.length ? 'Fill the other dish to build pressure.' : 'Drag parts onto the dishes, or click one in the list.'}</i></div></div></div></div>`;
    // the right column: the ten aspects as small tiles (all the detail on hover), and the two old recipes
    h += '<div class="col"><h2>GUIDE</h2><div class="guide">';
    if (fus) {
      h += `<p class="dim">Each part has an aspect. The dish it sits on decides what that aspect does.</p><div class="aspg">`;
      for (const a of ASPECT_ORDER) { const A = ASPECTS[a]; h += `<div class="aspt" style="--c:${A.hex}"${tip(aspTip(a))}><span class="gly">${coreSvg({ name: A.sym, hex: A.hex })}</span>${A.name}</div>`; }
      h += '</div>';
    }
    h += '<div class="rcp">';
    h += `<div${tip('<b>PRESS</b>Two of the same part become one, every number half again: two Incendiary (20%) make one at 30%. Counts (pierce, bounce, projectiles) round up.')}><b>Same part x2</b><span>Pressed: half again as strong</span></div>`;
    if (fus) {
      const E = { fire: 'Incendiary', ice: 'Cryo Cell', blood: 'Serrated', shock: 'Arc Coil' };
      let ft = '<b>FUSE</b>Two different elements make their own named part:'; for (const d of CORE_DEFS) if (d.fuse) { const [a, b] = d.fuse.split('+'); ft += `<div class="tr"><u style="color:${d.hex}">${esc(d.name)}</u>${E[a]} + ${E[b]}: ${esc(d.desc)}</div>`; }
      h += `<div${tip(ft)}><b>Two elements</b><span>Fused: a named elemental part</span></div>`;
      h += `<div${tip(`<b>FORGE</b>Any other ${cru ? 'two or three parts' : 'two parts'}: one part that keeps all of them at full strength, plus a new effect read from the dishes in order.<em>A forged part cannot be forged again.</em>`)}><b>Anything else</b><span>Forged: keeps all of them, plus a new effect</span></div>`;
      if (!cru) h += `<div class="lock"${tip(`<b>COMPRESSOR: CRUCIBLE</b>${Meta.machineHow('crucible')}. A third dish, TWIST: something extra the new effect does.`)}><b>Third dish</b><span>Not yet found</span></div>`;
    } else h += `<div class="lock"${tip(`<b>COMPRESSOR: FUSION</b>${Meta.machineHow('fusion')}. Any two gun parts forge into one that keeps both and wakes a new effect.`)}><b>Forging</b><span>Not yet found</span></div>`;
    h += '</div></div></div></div></div>';
    el.innerHTML = h;
    el.querySelector('#cclose').onclick = close;
    el.querySelectorAll('.dish.f[data-d]').forEach((d) => { d.onclick = () => { press[+d.dataset.d] = undefined; H.audio.play('S_Unfit', 0.6); hideTip(); render(false); }; });
    const go = el.querySelector('#cpgo'); if (go) go.onclick = () => { if (go.dataset.busy) return; go.dataset.busy = 1; const pr = el.querySelector('#cpress'); if (pr) pr.classList.add('go'); H.audio.play('S_Slam', 0.5, 0.8); setTimeout(() => { if (!open) return; const r = p.compress(...dishes); for (let i = 0; i < 3; i++) press[i] = undefined; if (r < 0) H.audio.play('S_Deny', 0.6); else { H.audio.play('S_Bench', 0.9, plan ? 0.65 : 0.8); H.game().hud.toast(`${plan ? 'Forged' : 'Pressed'}: ${U(r).name}. Fit it at the workbench.`, U(r).hex); } render(false); }, 460); };
    el.querySelectorAll('.chip:not(.eq)').forEach((cc) => { cc.onpointerdown = (e) => { hideTip(); startDrag(e, { kind: 'fit', u: +cc.dataset.u }); }; });
    el.querySelectorAll('.chip.eq').forEach((cc) => { cc.onclick = () => {
      const k = cc.dataset.src, u = +cc.dataset.u, S = k === 'blade' ? { blade: true, def: -1, cores: p.bladeCores, mods: [] } : k === 'turret' ? { turret: true, def: -1, cores: p.turretCores, mods: [] } : p.weapons[+k.slice(1)];
      if (!p.pullCore(S, u)) { H.audio.play('S_Deny', 0.6); return; }
      p.recompute(); hideTip(); H.audio.play('S_Unfit', 0.8);
      for (let i = 0; i < nd; i++) if (press[i] === undefined) { press[i] = u; break; }   // and onto the first free dish
      render(false);
    }; });
  }
  // the hover box: one for the whole screen, filled from tips[] by whatever is under the pointer
  let tips = [], tipEl = null;
  const hideTip = () => { if (tipEl) tipEl.style.display = 'none'; };
  function moveTip(e) {
    if (!open || !press.mode || drag) { hideTip(); return; }
    const n = e.target && e.target.closest && e.target.closest('[data-t]');
    if (!n || !el.contains(n)) { hideTip(); return; }
    if (!tipEl) { tipEl = document.createElement('div'); tipEl.id = 'ctip'; document.body.appendChild(tipEl); }
    const k = +n.dataset.t; if (tipEl.dataset.k !== String(k) || tipEl.style.display === 'none') { tipEl.innerHTML = tips[k] || ''; tipEl.dataset.k = k; }
    tipEl.style.display = 'block';
    const w = tipEl.offsetWidth, hh = tipEl.offsetHeight;
    let x = e.clientX + 18, y = e.clientY + 18; if (x + w > innerWidth - 8) x = e.clientX - w - 18; if (y + hh > innerHeight - 8) y = Math.max(8, innerHeight - hh - 8);
    tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px';
  }
  addEventListener('pointermove', moveTip);
  function render(flash) {
    if (press.mode) { renderPress(); return; }
    const p = P(), S = sel(), G = guns(), inv = Object.keys(p.coreInv).map(Number).filter((u) => p.coreInv[u] > 0).sort((a, b) => a - b);
    const total = inv.reduce((s, u) => s + p.coreInv[u], 0);
    let h = `<div class="cw"><div class="ch"><h1>WORKBENCH</h1><div class="sub"><kbd>Drag</kbd> a part onto the gun to fit it, off to take it back. <kbd>Shift</kbd> moves every copy. Each evolve adds a slot.</div><button id="cclose">DONE  [E]</button></div><div class="cb">`;
    h += `<div class="col"><h2>PARTS <i>${total} carried</i></h2><div class="list">`;
    if (!inv.length) h += `<div class="empty">You are not carrying any parts.<br><br>They drop from what you kill: the stranger the enemy, the better the part. Bosses always leave one.</div>`;
    const sg = onBlade ? null : sigOf(DATA.weapons[S.def]);
    for (const u of inv) { const nt = suits(sg, U(u)); h += `<div class="chip${nt ? ' suit' : ''}" data-u="${u}" style="--c:${U(u).hex}">${gly(u)}<div><b>${esc(U(u).name)}</b><span>${esc(partText(u))}${nt ? ` <u>${nt}</u>` : ''}</span></div><em>x${p.coreInv[u]}</em></div>`; }
    h += `</div>${recHtml(p)}</div><div class="mid"><div class="tabs">`;
    for (const i of G) { const W = DATA.weapons[p.weapons[i].def], s = p.weapons[i]; h += `<div class="tab${!onBlade && !onTurret && i === p.active ? ' on' : ''}" data-i="${i}" style="--c:${RARITY_HEX[W.rarity] || '#fff'}">${esc(W.name.toUpperCase())}<small>${s.cores.length} / ${p.partSlots(s)} slots</small></div>`; }
    { const W = bladeW(); h += `<div class="tab${onBlade && !onTurret ? ' on' : ''}" data-i="blade" style="--c:${RARITY_HEX[W.rarity] || '#fff'}">${esc(W.name.toUpperCase())}<small>${p.bladeCores.length} / ${p.partSlots({ blade: true })} slots</small></div>`; }
    if (p.cls && p.cls.id === 'engineer') h += `<div class="tab${onTurret ? ' on' : ''}" data-i="turret" style="--c:#6ec8ff">TURRET<small>${(p.turretCores || []).length} / 4 slots</small></div>`;
    h += `</div><div class="table" id="ctable"><canvas id="ccv"></canvas><div class="hint">${total ? 'Drop a part here' : ''}</div><div class="pop" id="cpop"></div></div><div class="slots">`;
    // its slots: one tile each, filled or empty; the ones still to come are shown locked
    const cap = p.partSlots(S), most = onTurret ? 4 : onBlade ? 4 + HONE_MAX : 8;
    for (let i = 0; i < most; i++) { const u = S.cores[i];
      if (u !== undefined && i < S.cores.length) h += `<div class="slot fill" data-u="${u}" style="--c:${U(u).hex}" title="${esc(partText(u))}">${gly(u)}<small>${esc(U(u).name)}</small></div>`;
      else h += i < cap ? '<div class="slot"><small>EMPTY</small></div>' : `<div class="slot lock" title="${onBlade ? 'Hone the blade to open this slot' : 'Evolve the gun to open this slot'}"><small>${onBlade ? 'HONE' : 'EVOLVE'} ${ROMAN[i - 3] || ''}</small></div>`; }
    if (onTurret) {
      h += `</div><div class="evo"><div class="et"><b>SHOULDER TURRET</b><span>Four slots. Choose its type on the right.</span></div></div></div>`;
    } else if (onBlade) {
      const t = p.meleeTier || 0, need = p.honeNeed(), k = p.meleeK || 0, maxed = t >= HONE_MAX;
      h += `</div><div class="evo"><div class="eb"><i style="width:${maxed ? 100 : Math.min(100, (k / need) * 100)}%"></i></div><div class="et"><b>${maxed ? 'FULLY HONED' : `HONED ${t ? ROMAN[t] : '0'} OF IV`}</b><span>${maxed ? 'The blade is as sharp as it gets.' : `${Math.max(0, need - k)} more kills with the blade and it is honed: harder, faster, further, and one more part slot.`}</span></div></div></div>`;
    } else {
      const maxed = S.mods.length >= 4, need = p.evoNeed(S), k = S.evoK || 0;
      h += `</div><div class="evo"><div class="eb"><i style="width:${maxed ? 100 : Math.min(100, (k / need) * 100)}%"></i></div><div class="et"><b>${maxed ? 'FULLY EVOLVED' : `EVOLVED ${S.mods.length ? ROMAN[S.mods.length] : '0'} OF IV`}</b><span>${maxed ? 'This gun has evolved four times.' : `${Math.max(0, need - k)} more kills with this gun and it evolves: +20% damage, +15% magazine and reserve, a little fire rate and reload, and one more part slot.`}</span></div></div>${ascHtml(S)}</div>`;
    }
    h += `<div class="col"><h2>${esc(onTurret ? 'TURRET' : onBlade ? bladeW().name.toUpperCase() : DATA.weapons[S.def].name.toUpperCase())}</h2><div id="cstats" style="display:flex;flex-direction:column;min-height:0;flex:1;overflow-y:auto">${statsHtml(flash)}</div></div></div>`;
    // passives
    const pas = []; for (let k = 0; k < CORE_DEFS.length; k++) { const u = CORE0 + k; if (CORE_DEFS[k].kind === 'me' && p.upgradeStacks[u] > 0) pas.push(u); }
    const ftOn = machine('fortune'), used = p.fortuneUsed || {};
    h += `<div class="cf"><h3>ON YOU</h3>${pas.length ? pas.map((u) => `<div class="pas${ftSel.includes(u) ? ' sel' : ''}" data-pu="${u}" style="--c:${U(u).hex}" title="${esc(U(u).desc)}${ftOn ? '  (click to pick it for a trade)' : ''}">${gly(u)}<b>${esc(U(u).name)}</b><em>x${p.upgradeStacks[u]}</em><span>${esc(U(u).desc)}</span>${ftOn ? `<button data-rr="${u}" ${used[u] ? 'disabled' : ''} title="Turn it into another ${U(u).rarity.toLowerCase()} buff. Once a room for each.">REROLL</button>` : ''}</div>`).join('') : '<span style="color:#9a8f7c;font-size:17px">Passives (health, speed, armor and the like) work the moment you pick them up. None yet.</span>'}${fortuneHtml(p, pas)}</div></div>`;
    if (mkOpen) h += catHtml(p);
    el.innerHTML = h;
    const pv = H.preview(); R = pv && pv.R; cv = pv ? pv.canvas : null;
    if (cv) { cv.id = 'ccv'; cv.style.cssText = ''; el.querySelector('#ccv').replaceWith(cv); }
    ensureScene(); rebuildModel(false);
    if (flash) setTimeout(() => el.querySelectorAll('.row b').forEach((b) => b.classList.remove('up', 'down')), 60);
    el.querySelector('#cclose').onclick = close;
    el.querySelectorAll('.tab').forEach((tb) => { tb.onclick = () => {
      if (tb.dataset.i === 'turret') { if (!onTurret) { onTurret = true; onBlade = false; lastSheet = null; modelKey = ''; H.audio.play('S_Switch', 0.6); render(false); } return; }
      if (tb.dataset.i === 'blade') { if (!onBlade || onTurret) { onTurret = false; onBlade = true; lastSheet = null; modelKey = ''; H.audio.play('S_Switch', 0.6); render(false); } return; }
      const i = +tb.dataset.i; if (i !== p.active || onBlade || onTurret) { onBlade = false; onTurret = false; if (i !== p.active || p.wield) p.switchTo(i); lastSheet = null; modelKey = ''; H.audio.play('S_Switch', 0.6); render(false); } }; });
    el.querySelectorAll('.tt[data-tt]').forEach((b) => { b.onclick = () => { p.turretType = b.dataset.tt; if (p.shoulder) p.shoulder.typeId = ''; H.audio.play('S_Fit', 0.7); render(true); }; });
    // an ascended gun's temper and element
    el.querySelectorAll('.ap').forEach((b) => { b.onclick = () => { if (onBlade) return; Meta.setAscPick(DATA.weapons[S.def].name, b.dataset.k, b.dataset.v); p.recompute(); H.audio.play('S_Fit', 0.7); bump = 0.6; pop('#ff8cff'); render(true); }; });
    // the Recycler: make
    { const b = el.querySelector('#rcat'); if (b) b.onclick = () => { mkOpen = true; mkOut = ''; H.audio.play('S_UIMove', 0.6); render(false); }; }
    if (mkOpen) {
      el.querySelector('#mkx').onclick = () => { mkOpen = false; H.audio.play('S_UIMove', 0.5); render(false); };
      el.querySelectorAll('#cmk .flt span').forEach((f) => { f.onclick = () => { mkF = f.dataset.f; H.audio.play('S_UIMove', 0.5); render(false); }; });
      el.querySelectorAll('#cmk .card').forEach((c) => { c.onclick = () => { mkSel = +c.dataset.mk; mkOut = ''; H.audio.play('S_UIMove', 0.5, 1.2); render(false); }; });
      { const g0 = el.querySelector('#cmk .grid'); if (g0) { g0.scrollTop = mkScroll; g0.onscroll = () => { mkScroll = g0.scrollTop; }; } }
      const go = el.querySelector('#mkgo'); if (go) go.onclick = () => { const u = mkSel; if (p.makePart(u)) { mkOut = `Made ${U(u).name}.`; recOut = mkOut; H.audio.play('S_Upgrade', 0.8); bump = 0.5; } else { mkOut = 'Not enough scrap.'; H.audio.play('S_Deny', 0.6); } render(false); };
    }
    // the Fortune Teller: pick two for a trade, or reroll one
    el.querySelectorAll('.pas[data-pu]').forEach((c) => { c.onclick = (e) => { if (!machine('fortune') || e.target.tagName === 'BUTTON') return; const u = +c.dataset.pu, k = ftSel.indexOf(u); if (k >= 0 && !(ftSel.length === 2 && ftSel[0] === ftSel[1] && k === 0 && p.upgradeStacks[u] >= 2 && false)) ftSel.splice(k, 1); else { ftSel.push(u); if (ftSel.length > 2) ftSel.shift(); } H.audio.play('S_UIMove', 0.5); render(false); }; });
    el.querySelectorAll('.pas button[data-rr]').forEach((b) => { b.onclick = () => { const u = +b.dataset.rr, v = p.fortuneReroll(u); if (v < 0) H.audio.play('S_Deny', 0.6); else { ftSel = []; pop(U(v).hex); } render(true); }; });
    { const b = el.querySelector('#fttrade'); if (b) b.onclick = () => { const v = p.fortuneTrade(ftSel[0], ftSel[1]); ftSel = []; if (v < 0) H.audio.play('S_Deny', 0.6); else pop(U(v).hex); render(true); }; }
    el.querySelectorAll('.chip').forEach((c) => {
      c.onpointerdown = (e) => startDrag(e, { kind: 'fit', u: +c.dataset.u });
      c.onpointerenter = () => { if (!drag) { hover = +c.dataset.u; refreshStats(); } }; c.onpointerleave = () => { if (!drag && hover >= 0) { hover = -1; refreshStats(); } };
    });
    el.querySelectorAll('.slot.fill').forEach((s) => { s.onpointerdown = (e) => startDrag(e, { kind: 'pull', u: +s.dataset.u }); });
    if (cv) cv.onpointerdown = (e) => { drag = { kind: 'spin', x: e.clientX }; cv.setPointerCapture(e.pointerId); };
  }
  // ---- the Recycler: drop a part in to break it down for scrap; spend scrap to make a part. Rarer costs more.
  let hop = [], recOut = '', press = [];
  function recHtml(p) {
    if (press.mode) return '';
    if (!machine('recycler')) return `<div class="rec locked" id="crec"><h3>THE RECYCLER</h3><p>${Meta.machineHow('recycler')}. It breaks parts you do not want into scrap, and spend scrap on the ones you do.</p></div>`;
    let h = `<div class="rec" id="crec"><h3>THE RECYCLER <span class="ctr">${p.scrap || 0}<small>SCRAP</small></span></h3>`;
    h += `<div class="drop">Drag a part here to break it down<br><small>Common 1 · Uncommon 2 · Rare 4 · Epic 8 scrap</small></div>`;
    h += `<button class="brassbtn" id="rcat">MAKE A PART  &#9656;</button><div class="out">${recOut}</div></div>`;
    return h;
  }
  // ---- the catalogue: every part the Recycler can make, by rarity, with what it does and what it costs
  let mkOpen = false, mkSel = -1, mkF = 'all', mkOut = '', mkScroll = 0;
  const TIERN = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC'], TIERC = ['#cfc6b4', '#7dff8a', '#5ab4ff', '#d68cff'];
  function makeList(p) {
    const out = [];
    for (let k = 0; k < CORE_DEFS.length; k++) {
      const u = CORE0 + k, d = CORE_DEFS[k]; if (d.noDrop || Meta.upgradeLocked(d.name)) continue;
      const me = d.kind === 'me'; if (mkF === 'gun' && me) continue; if (mkF === 'me' && !me) continue;
      out.push({ u, d, me, t: coreTier(u), cost: p.makeCost(u), full: me && p.upgradeStacks[u] >= U(u).stacks });
    }
    return out.sort((a, b) => a.t - b.t || a.cost - b.cost || a.d.name.localeCompare(b.d.name));
  }
  function catHtml(p) {
    const sc = p.scrap || 0, L = makeList(p), S = p.slot, sg = !onBlade && S.def >= 0 ? sigOf(DATA.weapons[S.def]) : null;
    if (!L.some((x) => x.u === mkSel)) mkSel = (L.find((x) => x.cost <= sc && !x.full) || L[0] || { u: -1 }).u;
    let h = `<div id="cmk"><div class="mk"><div class="mkh"><h1>THE RECYCLER  &#8212;  MAKE A PART</h1><span class="sc">${sc} SCRAP</span><div class="flt">`;
    for (const [k, n] of [['all', 'ALL'], ['gun', 'GUN PARTS'], ['me', 'WORN ON YOU']]) h += `<span data-f="${k}" class="${mkF === k ? 'on' : ''}">${n}</span>`;
    h += `</div><button class="x" id="mkx">BACK  [E]</button></div><div class="col"><div class="grid">`;
    for (let t = 0; t < 4; t++) {
      const row = L.filter((x) => x.t === t); if (!row.length) continue;
      h += `<div class="tier" style="--t:${TIERC[t]}">${TIERN[t]} <i>${row[0].cost === row[row.length - 1].cost ? row[0].cost + ' scrap each' : ''}</i></div><div class="cards">`;
      for (const x of row) {
        const have = x.me ? p.upgradeStacks[x.u] || 0 : p.coreInv[x.u] || 0, nt = !x.me && suits(sg, U(x.u));
        h += `<div class="card${x.u === mkSel ? ' on' : ''}${x.cost > sc || x.full ? ' no' : ''}${nt ? ' suit' : ''}" data-mk="${x.u}" style="--c:${U(x.u).hex}">${gly(x.u)}<b>${esc(x.d.name)}</b><u class="${x.cost > sc ? 'no' : ''}">${x.cost} scrap</u>${have ? `<em>${x.me ? 'ON YOU' : 'HAVE'} ${have}</em>` : ''}<span>${esc(U(x.u).desc)}</span></div>`;
      }
      h += '</div>';
    }
    if (!L.length) h += '<div class="empty">Nothing to make here yet.</div>';
    h += '</div></div><div class="col det">';
    if (mkSel >= 0) {
      const u = mkSel, d = U(u), t = coreTier(u), me = d.kind === 'me', cost = p.makeCost(u), full = me && p.upgradeStacks[u] >= d.stacks, nt = !me && suits(sg, d);
      const fitted = me ? 0 : p.weapons.reduce((n, W) => n + (W.cores || []).filter((x) => x === u).length, 0) + (p.bladeCores || []).filter((x) => x === u).length;
      const asp = !me && machine('fusion') ? aspectsOf(d) : [];
      h += `<div class="big" style="--c:${d.hex}">${gly(u)}<div><h3>${esc(d.name)}</h3><span class="rar" style="--t:${TIERC[t]}">${TIERN[t]}</span><span class="rar">${me ? 'WORN ON YOU' : 'GUN PART'}</span></div></div>`;
      h += `<p>${esc(d.desc)}</p>`;
      if (me) h += `<div class="note">Works on you the moment it is made: no slot needed. You can carry up to <b>${d.stacks}</b>; you have <b>${p.upgradeStacks[u] || 0}</b>.</div>`;
      else {
        h += `<div class="note">Goes in a part slot on a gun or the blade. Drag it onto the gun on the bench to fit it.${BLADE[d.name] ? `<br>On a blade: <b>${esc(BLADE[d.name][1])}</b>` : ''}</div>`;
        if (nt) h += `<div class="note good">On your <b>${esc(DATA.weapons[S.def].name)}</b>: <b>${esc(nt)}</b>.</div>`;
        if (asp.length) h += `<div class="note">Compressor aspect: ${asp.map((x) => `<b style="color:${ASPECTS[x].hex}">${ASPECTS[x].name}</b>`).join(' + ')}</div>`;
        h += `<div class="note">You carry <b>${p.coreInv[u] || 0}</b>${fitted ? `, and <b>${fitted}</b> fitted` : ''}.</div>`;
      }
      h += `<div class="cost"><span>Costs</span><b>${cost} scrap</b><span>You have</span><b class="${cost > sc ? 'no' : ''}">${sc} scrap</b><span>Left after</span><b>${Math.max(0, sc - cost)}</b></div>`;
      h += `<button class="brassbtn" id="mkgo" ${cost > sc || full ? 'disabled' : ''}>${full ? 'CARRYING THE MOST' : cost > sc ? `NEED ${cost - sc} MORE SCRAP` : `MAKE  ${esc(d.name.toUpperCase())}`}</button><div class="out">${mkOut}</div>`;
    }
    return h + '</div></div></div>';
  }
  // ---- the Fortune Teller, on the strip of buffs you carry
  let ftSel = [];
  function fortuneHtml(p, pas) {
    if (press.mode || !machine('fortune') || !pas.length) return '';
    ftSel = ftSel.filter((u) => p.upgradeStacks[u] > 0);
    const ok = ftSel.length === 2 && coreTier(ftSel[0]) === coreTier(ftSel[1]) && coreTier(ftSel[0]) < 3 && (ftSel[0] !== ftSel[1] || p.upgradeStacks[ftSel[0]] >= 2);
    return `<div class="ft">FORTUNE TELLER<button id="fttrade" ${ok ? '' : 'disabled'} title="Pick two buffs of one rarity (click them), and get one of the rarity above.">TRADE 2 UP</button></div>`;
  }
  // ---- what this gun has earned on other runs
  function ascHtml(S) {
    const W = DATA.weapons[S.def], a = Meta.asc(W.name), dia = '\u25C6'.repeat(a) + '\u25C7'.repeat(3 - a);
    if (!a) return `<div class="asc lk"><h4>NOT YET ASCENDED <s>${dia}</s></h4>Finish a Descent with this gun doing the most damage and it ascends: once on each difficulty, three times in all. I: choose its temper. II: bind it to an element. III: crowned, one more part slot and faster evolution.</div>`;
    const T = temperOf(W.name), A = attuneOf(W.name);
    let h = `<div class="asc"><h4>ASCENDED ${ROMAN[a]} <s>${dia}</s></h4>`;
    h += a >= 1 ? `<div class="ar"><label>TEMPER</label>${TEMPERS.map((t) => `<span class="ap${t.id === T.id ? ' on' : ''}" data-k="temper" data-v="${t.id}" title="${esc(t.text)}">${t.name}</span>`).join('')}<em>${esc(T.text)}</em></div>` : `<div>${ROMAN[1]}, Tempered: win with it to choose a temper for it.</div>`;
    h += a >= 2 ? `<div class="ar"><label>ELEMENT</label>${ATTUNES.map((t) => `<span class="ap${t.id === A.id ? ' on' : ''}" data-k="attune" data-v="${t.id}" title="${esc(t.text)}" ${t.hex && t.id !== A.id ? `style="color:${t.hex}"` : ''}>${t.name}</span>`).join('')}<em>${esc(A.text)}</em></div>` : `<div style="margin-top:4px">${ROMAN[2]}, Attuned: win with it on another difficulty to bind it to an element.</div>`;
    h += a >= 3 ? '<div class="ar"><label>CROWNED</label><em>One more part slot than any other gun, and it evolves a third faster.</em></div>' : `<div style="margin-top:4px">${ROMAN[3]}, Crowned: win with it on the third difficulty for one more part slot and faster evolution.</div>`;
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
  const overPress = (e) => { const n = el.querySelector('#cpress'); if (!n) return false; const r = n.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; };
  const overTable = (e) => { const tb = el.querySelector('#ctable'), sl = el.querySelector('.slots'); const hit = (n) => { if (!n) return false; const r = n.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; }; return hit(tb) || hit(sl); };
  addEventListener('pointermove', (e) => {
    if (!open || !drag) return;
    if (drag.kind === 'spin') { const dx = e.clientX - drag.x; spin += dx * 0.012; spinV = dx * 0.5; drag.x = e.clientX; return; }
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6) drag.moved = true;
    moveGhost(e); const tb = el.querySelector('#ctable'); if (tb) tb.classList.toggle('over', drag.kind === 'fit' && overTable(e));
    const rc = el.querySelector('#crec'); if (rc) rc.classList.toggle('over', drag.kind === 'fit' && overRec(e));
    const pr = el.querySelector('#cpress'); if (pr) pr.classList.toggle('over', drag.kind === 'fit' && overPress(e));
  });
  addEventListener('pointerup', (e) => {
    if (!open || !drag) return; const d = drag; drag = null;
    if (d.kind === 'spin') return;
    if (ghost) { ghost.remove(); ghost = null; }
    const p = P(), S = sel(), on = overTable(e); hover = -1;
    // a part dropped on the gun (or simply clicked) is fitted; a fitted part dragged off the bench (or clicked) comes off
    const all = d.all || e.shiftKey;
    if (d.kind === 'fit' && d.moved && overRec(e)) {   // into the Recycler: broken down for scrap
      const got = p.scrapPart(d.u, all ? p.coreInv[d.u] || 0 : 1);
      if (got) { recOut = `+${got} scrap from ${U(d.u).name}.`; H.audio.play('S_Unfit', 0.8, 0.7); } else H.audio.play('S_Deny', 0.6);
      render(false); return;
    }
    if (d.kind === 'fit' && press.mode) {   // the Compressor: onto a dish
      if (overPress(e) || !d.moved) {
        const nd = machine('crucible') ? 3 : 2, under = document.elementFromPoint(e.clientX, e.clientY), dn = under && under.closest && under.closest('[data-d]');
        let at = dn && d.moved ? +dn.dataset.d : -1; if (!(at >= 0 && at < nd)) { at = -1; for (let i = 0; i < nd; i++) if (press[i] === undefined) { at = i; break; } }
        const have = press.filter((u, i) => u === d.u && i !== at).length;
        if (at >= 0 && (p.coreInv[d.u] || 0) > have && U(d.u).kind === 'gun') { press[at] = d.u; H.audio.play('S_Fit', 0.7, 0.8); } else H.audio.play('S_Deny', 0.6);
      }
      render(false); return;
    }
    if (d.kind === 'fit' && (on || !d.moved)) {
      let n = 0; while (p.fitCore(S, d.u)) { n++; if (!all) break; }
      if (n) { bump = 1; H.audio.play('S_Fit', 0.9); render(true); pop(U(d.u).hex); return; }
      H.audio.play('S_Deny', 0.6);
    } else if (d.kind === 'pull' && (!on || !d.moved)) { let n = 0; while (p.pullCore(S, d.u)) { n++; if (!all) break; } if (n) { H.audio.play('S_Unfit', 0.8); bump = 0.5; render(true); return; } }
    render(false);
  });
  addEventListener('keydown', (e) => { if (!open) return; e.stopImmediatePropagation(); if (e.code === 'KeyE' || e.code === 'Escape' || e.code === 'Tab' || e.code === 'KeyF') { e.preventDefault(); if (mkOpen) { mkOpen = false; render(false); } else close(); } }, true);
  addEventListener('keyup', (e) => { if (open) e.stopImmediatePropagation(); }, true);

  function show(blade, mode) { if (open || !H.game() || !H.game().descent) return; open = true; onBlade = !!blade && mode !== 'press'; onTurret = false; hop = []; recOut = ''; press = []; mkOpen = false; mkOut = ''; mkScroll = 0; press.mode = mode === 'press'; ftSel = []; lastSheet = null; modelKey = ''; hover = -1; drag = null; P().coreNew = 0; H.entered(); el.style.display = 'block'; render(false); H.audio.play('S_Bench', 0.8); }
  function close() { if (!open) return; open = false; hideTip(); if (ghost) { ghost.remove(); ghost = null; } el.style.display = 'none'; H.left(); }
  return { show, close, tick, isOpen: () => open, refresh: () => { if (open) render(false); } };
}
