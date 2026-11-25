// The village's signs, painted rather than typed: each is drawn once on a canvas (a shaped board, its own lettering in
// the village's storybook serif, trim, nails, bulbs) and hung as a quad. The casino's marquee keeps its canvas and
// chases its bulbs round the rim.
import * as THREE from 'three';
import { G } from './render.js';

const SERIF = '"Fraunces", Georgia, serif', ROUND = '"Nunito", Arial, sans-serif';
export const signFontsReady = () => (document.fonts && document.fonts.load ? Promise.all(['900 80px Fraunces', 'italic 600 40px Fraunces', '800 30px Nunito'].map((f) => document.fonts.load(f))).catch(() => {}) : Promise.resolve());

// ---- painting helpers
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
function grain(g, x, y, w, h, base, dark, seed = 1) {
  const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, base[0]); gr.addColorStop(0.5, base[1]); gr.addColorStop(1, base[2]); g.fillStyle = gr; g.fill();
  g.save(); g.clip(); g.globalAlpha = 0.16; g.strokeStyle = dark; g.lineWidth = 2;
  for (let i = 0; i < h / 7; i++) { const yy = y + i * 7 + Math.sin(i * 1.7 + seed) * 2; g.beginPath(); g.moveTo(x, yy); for (let k = 0; k <= 12; k++) g.lineTo(x + (w * k) / 12, yy + Math.sin(k * 0.9 + i * 0.6 + seed) * 2.5); g.stroke(); }
  g.globalAlpha = 0.22; for (let i = 0; i < 5; i++) { const cx = x + w * ((i * 0.37 + seed * 0.13) % 1), cy = y + h * ((i * 0.61 + 0.2) % 1); g.beginPath(); g.ellipse(cx, cy, 14, 6, 0, 0, Math.PI * 2); g.stroke(); }
  g.restore();
}
function nail(g, x, y) { const r = g.createRadialGradient(x - 2, y - 2, 1, x, y, 7); r.addColorStop(0, '#e8d8b0'); r.addColorStop(0.5, '#8a7a5a'); r.addColorStop(1, '#3a3020'); g.fillStyle = r; g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill(); }
// lettering: a painted word with a soft shadow, an outline, and a gradient fill
function letter(g, text, x, y, px, { fill = ['#fff3d0', '#f0c860'], stroke = '#3a1e0c', sw = 0.12, font = `900 ${px}px ${SERIF}`, shadow = 'rgba(0,0,0,0.45)', maxW = 9999, track = 0 } = {}) {
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  if ('letterSpacing' in g) g.letterSpacing = track + 'px';
  let k = 1; const w = g.measureText(text).width; if (w > maxW) { k = maxW / w; }
  g.save(); g.translate(x, y); g.scale(k, 1);
  g.fillStyle = shadow; g.fillText(text, px * 0.03, px * 0.07);
  if (stroke) { g.lineJoin = 'round'; g.lineWidth = px * sw; g.strokeStyle = stroke; g.strokeText(text, 0, 0); }
  const gr = g.createLinearGradient(0, -px * 0.8, 0, px * 0.1); gr.addColorStop(0, fill[0]); gr.addColorStop(1, fill[1] || fill[0]); g.fillStyle = gr; g.fillText(text, 0, 0);
  g.restore(); if ('letterSpacing' in g) g.letterSpacing = '0px';
}
function toadstool(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = '#fbf2dc'; g.beginPath(); g.moveTo(-16, 0); g.quadraticCurveTo(-20, 44, -26, 58); g.lineTo(26, 58); g.quadraticCurveTo(20, 44, 16, 0); g.fill();
  g.strokeStyle = '#5a2a14'; g.lineWidth = 4; g.stroke();
  const cg = g.createLinearGradient(0, -60, 0, 6); cg.addColorStop(0, '#ff5a46'); cg.addColorStop(1, '#a81c14'); g.fillStyle = cg;
  g.beginPath(); g.moveTo(-70, 6); g.bezierCurveTo(-70, -70, 70, -70, 70, 6); g.quadraticCurveTo(0, 18, -70, 6); g.fill(); g.lineWidth = 5; g.stroke();
  g.fillStyle = '#fff6e4'; for (const [sx, sy, r] of [[-38, -14, 10], [-8, -38, 12], [28, -22, 9], [48, -2, 6], [-56, -2, 6], [8, -8, 6]]) { g.beginPath(); g.arc(sx, sy, r, 0, Math.PI * 2); g.fill(); }
  g.restore();
}

// ---- the boards
function paint(kind, o) {
  const c = document.createElement('canvas'), g = c.getContext('2d'); let draw = null;
  if (kind === 'marquee') {
    c.width = 1400; c.height = 720;
    const base = document.createElement('canvas'); base.width = c.width; base.height = c.height; const b = base.getContext('2d');
    // an arched board: square shoulders, a round crown
    const shape = (gg, inset) => { const x0 = 40 + inset, x1 = 1360 - inset, y1 = 680 - inset, top = 250 + inset; gg.beginPath(); gg.moveTo(x0, y1 - 30); gg.lineTo(x0, top + 70); gg.quadraticCurveTo(x0, top, x0 + 90, top - 10); gg.bezierCurveTo(400, 70 + inset, 1000, 70 + inset, x1 - 90, top - 10); gg.quadraticCurveTo(x1, top, x1, top + 70); gg.lineTo(x1, y1 - 30); gg.quadraticCurveTo(x1, y1, x1 - 30, y1); gg.lineTo(x0 + 30, y1); gg.quadraticCurveTo(x0, y1, x0, y1 - 30); gg.closePath(); };
    shape(b, 0); const og = b.createLinearGradient(0, 80, 0, 680); og.addColorStop(0, '#6a3a1a'); og.addColorStop(1, '#3a1e0c'); b.fillStyle = og; b.fill();
    shape(b, 18); const rg = b.createLinearGradient(0, 100, 0, 660); rg.addColorStop(0, '#b8281e'); rg.addColorStop(0.6, '#8a1612'); rg.addColorStop(1, '#5e0c0a'); b.fillStyle = rg; b.fill();
    b.lineWidth = 6; b.strokeStyle = '#f0c860'; b.stroke(); shape(b, 34); b.lineWidth = 2.5; b.strokeStyle = 'rgba(240,200,96,0.7)'; b.stroke();
    // a soft sheen across the lacquer
    b.save(); shape(b, 18); b.clip(); const sh = b.createLinearGradient(0, 120, 0, 420); sh.addColorStop(0, 'rgba(255,255,255,0.18)'); sh.addColorStop(1, 'rgba(255,255,255,0)'); b.fillStyle = sh; b.fillRect(0, 0, 1400, 420); b.restore();
    toadstool(b, 700, 190, 1.25);
    letter(b, 'The Lucky', 700, 330, 66, { font: `italic 600 66px ${SERIF}`, fill: ['#fff3d0', '#f6d88a'], stroke: '#3a0c08', sw: 0.1 });
    letter(b, 'TOADSTOOL', 700, 500, 168, { fill: ['#fff2b8', '#e8a83a'], stroke: '#3a0c08', sw: 0.13, maxW: 1120, track: 6 });
    for (const sx of [190, 1210]) { b.fillStyle = '#f0c860'; b.font = `900 64px ${SERIF}`; b.textAlign = 'center'; b.fillText('♦', sx, 470); }
    b.fillStyle = 'rgba(255,240,200,0.85)'; b.font = `800 34px ${ROUND}`; b.textAlign = 'center'; if ('letterSpacing' in b) b.letterSpacing = '8px'; b.fillText('GAMES OF CHANCE  ·  EST. 1742', 700, 600); if ('letterSpacing' in b) b.letterSpacing = '0px';
    // the bulbs round the rim: their places along the outline
    const pts = []; { const P = new Path2D(); const tmp = document.createElement('canvas').getContext('2d'); void tmp; const L = [];
      const seg = (x0, y0, x1, y1, n) => { for (let i = 0; i < n; i++) L.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n]); };
      seg(66, 650, 66, 330, 7); for (let i = 0; i <= 26; i++) { const t = i / 26, x = 66 + (1334 - 66) * t, y = 320 - Math.sin(t * Math.PI) * 196 - (t < 0.08 || t > 0.92 ? 0 : 0); L.push([x, y]); } seg(1334, 330, 1334, 650, 7); seg(1334, 654, 66, 654, 24);
      void P; pts.push(...L); }
    draw = (phase) => {
      g.clearRect(0, 0, c.width, c.height); g.drawImage(base, 0, 0);
      pts.forEach(([x, y], i) => { const on = (i + phase) % 3 !== 0; const r = g.createRadialGradient(x, y, 1, x, y, on ? 20 : 9); r.addColorStop(0, on ? '#fffbe8' : '#8a6a3a'); r.addColorStop(0.35, on ? '#ffd870' : '#5a4020'); r.addColorStop(1, on ? 'rgba(255,190,80,0)' : 'rgba(60,40,20,0)'); g.fillStyle = r; g.beginPath(); g.arc(x, y, on ? 20 : 9, 0, Math.PI * 2); g.fill(); });
    };
    draw(0);
  } else if (kind === 'wood') {
    const W = o.w || 900, H = o.h || 300; c.width = W; c.height = H;
    // a plank with notched ends, hung from two rings
    const shape = (gg, i) => { const n = Math.min(40, H * 0.16); gg.beginPath(); gg.moveTo(n + i, i); gg.lineTo(W - n - i, i); gg.lineTo(W - i, H / 2); gg.lineTo(W - n - i, H - i); gg.lineTo(n + i, H - i); gg.lineTo(i, H / 2); gg.closePath(); };
    shape(g, 4); g.fillStyle = '#3a2412'; g.fill(); shape(g, 12); grain(g, 12, 12, W - 24, H - 24, o.wood || ['#a8743e', '#8a5a2e', '#6e4422'], '#3a2210', o.seed || 1);
    shape(g, 24); g.lineWidth = 3; g.strokeStyle = 'rgba(255,230,180,0.35)'; g.stroke();
    nail(g, 46, H / 2); nail(g, W - 46, H / 2);
    if (o.sub) { letter(g, o.text, W / 2, H * 0.56, H * 0.36, { fill: o.fill || ['#fff6e0', '#f2d9a0'], maxW: W - 150 }); letter(g, o.sub, W / 2, H * 0.84, H * 0.15, { font: `italic 600 ${H * 0.15}px ${SERIF}`, fill: ['#f6e2b8'], stroke: '#3a2210', sw: 0.12, maxW: W - 170 }); }
    else letter(g, o.text, W / 2, H * 0.66, H * 0.46, { fill: o.fill || ['#fff6e0', '#f2d9a0'], maxW: W - 150 });
    if (o.leaves) { for (const sx of [70, W - 70]) for (let k = 0; k < 5; k++) { g.save(); g.translate(sx + (k - 2) * 12, 18 + (k % 2) * 6); g.rotate((k - 2) * 0.4); g.fillStyle = k % 2 ? '#5c8e3a' : '#76a844'; g.beginPath(); g.ellipse(0, 0, 18, 8, 0, 0, Math.PI * 2); g.fill(); g.restore(); } }
  } else if (kind === 'stone') {
    const W = 1100, H = 320; c.width = W; c.height = H;
    rr(g, 8, 8, W - 16, H - 16, 26); const sg = g.createLinearGradient(0, 0, 0, H); sg.addColorStop(0, '#b8b0a2'); sg.addColorStop(1, '#8a8274'); g.fillStyle = sg; g.fill();
    g.save(); g.clip(); g.globalAlpha = 0.12; for (let i = 0; i < 260; i++) { g.fillStyle = i % 2 ? '#fff' : '#2a2620'; g.fillRect((i * 97) % W, (i * 53) % H, 3 + (i % 4), 2); } g.globalAlpha = 0.5; g.fillStyle = '#5c7a3a'; for (let i = 0; i < 18; i++) { g.beginPath(); g.ellipse(20 + i * 8 + (i % 3) * 6, H - 20 - (i % 4) * 8, 18, 10, 0.3, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(W - 30 - i * 7, 22 + (i % 3) * 7, 14, 8, -0.4, 0, Math.PI * 2); g.fill(); } g.restore();
    rr(g, 30, 30, W - 60, H - 60, 16); g.lineWidth = 6; g.strokeStyle = 'rgba(60,54,44,0.55)'; g.stroke(); rr(g, 34, 34, W - 60, H - 60, 16); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,0.35)'; g.stroke();
    // carved: a dark cut with a light lower lip
    const carve = (t, y, px, font) => { g.font = font; g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillText(t, W / 2 + 2, y + 3); g.fillStyle = '#3e3830'; g.fillText(t, W / 2, y); };
    carve(o.text, 178, 120, `900 120px ${SERIF}`); carve(o.sub || '', 252, 44, `italic 600 44px ${SERIF}`);
  }
  return { canvas: c, draw };
}

// a painted sign, h cm tall, standing at a world point (three.js coordinates) and facing a direction in the ground plane
export function makeSign(kind, o, at, face, h, glow = 0) {
  const P = paint(kind, o), tex = new THREE.CanvasTexture(P.canvas); tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = 8;
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: tex }, fogColor: G.fogColor, fogParams: G.fogParams, uGlow: { value: glow }, uLit: G.litTint },
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform sampler2D map; uniform vec3 fogColor; uniform vec4 fogParams; uniform float uGlow; uniform vec4 uLit; varying vec2 vUv; varying vec3 vW;
      void main(){ vec4 t = texture2D(map, vUv); if (t.a < 0.5) discard; vec3 c = t.rgb * mix(uLit.rgb * 0.98, vec3(1.08), uGlow);
        float d = distance(vW, cameraPosition); float f = clamp(1.0 - exp(-max(d - fogParams.x, 0.0) * fogParams.y), 0.0, 1.0) * fogParams.w * (1.0 - uGlow * 0.7);
        gl_FragColor = vec4(mix(c, fogColor, f), 1.0); }`,
  });
  const back = new THREE.MeshBasicMaterial({ color: kind === 'stone' ? 0x8a8274 : kind === 'marquee' ? 0x3a1e0c : 0x5a3a1e });
  const aspect = P.canvas.width / P.canvas.height, w = h * aspect, grp = new THREE.Group();
  const front = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); grp.add(front);
  const rear = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.985, h * 0.97), back); rear.rotation.y = Math.PI; rear.position.z = -1.5; grp.add(rear);
  grp.position.copy(at); grp.rotation.y = Math.atan2(face.x, face.z);
  let t = 0, ph = 0;
  grp.userData.tick = P.draw ? (dt) => { t += dt; if (t > 0.16) { t = 0; ph = (ph + 1) % 3; P.draw(ph); tex.needsUpdate = true; } } : null;
  return grp;
}
