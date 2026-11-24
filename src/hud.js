// Sulfur-style HUD drawn on a 2D canvas: chunky condensed type with dark outlines, bone-white and saloon-gold
// panels with clipped corners. Crosshair with spread/kick, hit markers, damage arcs, floating numbers,
// banners, toasts, boss bar, power-up timers, casino menus (with live slot reels), inventory and death card.
import { BUILDS, TIERS } from './builds.js';
import { ATTACK_LABEL } from './enemies.js';
import { TONICS } from './data.js';
import { cash } from './data.js';
import { diff } from './data.js';
import { GRENADES } from './grenades.js';
import * as THREE from 'three';
import { coreSvg } from './cores.js';
import { DATA, RARITY_HEX, SYMBOLS, luckMult, cssRGB, SUITS, SUIT_HEX, SUIT_BONUS } from './data.js';

import { MELEE, MELEE_CODE, isMelee } from './melee.js';
import { Meta } from './meta.js';
const WD = (c) => (isMelee(c) ? MELEE[c - MELEE_CODE] : DATA.weapons[c]);
const BONE = '#f2e8d5', GOLD = '#ffcd5a', BLOOD = '#e0342c', INK = '#140d12', PANEL = 'rgba(22,14,20,0.86)';
const F_BIG = '"Big Shoulders Display", Impact, "Arial Narrow", sans-serif';
const F_TXT = '"Barlow Condensed", "Arial Narrow", Arial, sans-serif';
const toCss = (c) => (typeof c === 'string' ? c : cssRGB(c));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const _v = new THREE.Vector3();

export class Hud {
  constructor(canvas) {
    this.cv = canvas;
    this.g = canvas.getContext('2d');
    this.toasts = []; this.banners = []; this.floaters = [];
    this.roundFlash = 0; this.fps = 0; this.showFps = false;
    this.icons = null;
    this.time = 0;
    this.reel = [0, 0, 0];
  }
  setAtlas(img, meta) { this.icons = { img, meta }; }
  drawTeam(game, W, H, S) {
    const g = this.g, T = game.net.team(); let y = 150 * S; const x = W - 250 * S;
    this.text(`LOBBY CODE  ${game.net.code}`, W - 20 * S, y - 14 * S, 15 * S, 'rgba(242,232,213,0.7)', 'right', F_TXT, 700, 0.12);
    for (const m of T) {
      g.fillStyle = 'rgba(22,12,18,0.78)'; g.fillRect(x, y, 230 * S, 40 * S); g.fillStyle = m.dead ? '#5a4a52' : '#c8211b'; g.fillRect(x, y, 5 * S, 40 * S);
      this.text(m.name + (m.dead ? '  (down)' : ''), x + 14 * S, y + 20 * S, 19 * S, m.dead ? '#8a7a80' : BONE, 'left', F_TXT, 700);
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 14 * S, y + 27 * S, 202 * S, 6 * S); g.fillStyle = m.hp > 0.35 ? '#e9e2d0' : '#ff5a4d'; g.fillRect(x + 14 * S, y + 27 * S, 202 * S * (m.dead ? 0 : m.hp), 6 * S);
      y += 46 * S;
    }
  }
  // taking damage: blood hits the lens, the frame flashes and the edges close in
  hurt(strength) {
    this.hurtFx = this.hurtFx || [];
    const n = 2 + Math.round(strength * 3);
    for (let i = 0; i < n; i++) {
      const edge = Math.random() * 4 | 0, r = Math.random();
      const x = edge === 0 ? 0.04 + Math.random() * 0.14 : edge === 1 ? 0.82 + Math.random() * 0.14 : r, y = edge === 2 ? 0.05 + Math.random() * 0.16 : edge === 3 ? 0.78 + Math.random() * 0.16 : Math.random();
      this.hurtFx.push({ x, y, s: 0.12 + Math.random() * 0.16 + strength * 0.08, k: Math.random() * 4 | 0, rot: Math.random() * 6.28, t: 0, life: 2.2 + Math.random() * 1.2 });
    }
    if (this.hurtFx.length > 14) this.hurtFx.splice(0, this.hurtFx.length - 14);
    this.hurtWhite = 0.1;
  }
  // "you got this, and here is what it does": a card per upgrade, a few seconds each
  gotUpgrade(i, stack, tag) { this.cards = this.cards || []; this.cards.push({ i, stack, tag, t: 0, life: 15 }); if (this.cards.length > 3) this.cards.shift(); }
  gotTonic(i, level) { this.cards = this.cards || []; this.cards.push({ tonic: i, stack: level, t: 0, life: 9 }); if (this.cards.length > 3) this.cards.shift(); }
  drawCards() {
    this.cardsBottom = 0;
    if (!this.cards || !this.cards.length) return;
    const g = this.g, S = this.S, W = this.W, w = 560 * S, x = W / 2 - w / 2; let y = this.H * 0.17;
    for (const c of this.cards) {
      c.t += 1 / 60;
      const U = c.tonic != null ? { name: TONICS[c.tonic].name, desc: TONICS[c.tonic].desc + `.  Level ${c.stack}.`, rarity: 'Tonic' } : DATA.upgrades[c.i], col = c.tonic != null ? '#ffb359' : RARITY_HEX[U.rarity], a = Math.min(1, c.t * 6, (c.life - c.t) * 2.5), slide = (1 - Math.min(1, c.t * 6)) * 30 * S;
      g.font = `600 ${this.fs(19 * S)}px ${F_TXT}`;
      const words = U.desc.split(' '), lines = []; let ln = '';
      for (const wd of words) { const t = ln ? ln + ' ' + wd : wd; if (g.measureText(t).width > w - 118 * S && ln) { lines.push(ln); ln = wd; } else ln = t; }
      if (ln) lines.push(ln);
      const h = (58 + lines.length * 24) * S;
      g.globalAlpha = Math.max(0, a);
      g.fillStyle = 'rgba(20,10,16,0.92)'; g.fillRect(x, y - slide, w, h); g.fillStyle = col; g.fillRect(x, y - slide, 6 * S, h); g.fillRect(x, y - slide, w, 2 * S);
      this.icon(c.tonic != null ? 'TN_' + c.tonic : 'U_' + c.i, x + 20 * S, y - slide + h / 2 - 34 * S, 68 * S, Math.max(0, a));
      this.text(U.name.toUpperCase() + (c.tonic == null && c.stack > 1 ? `  x${c.stack}` : ''), x + 102 * S, y - slide + 32 * S, 27 * S, col, 'left', F_BIG, 400, 0.08, Math.max(0, a));
      this.text((c.tag || U.rarity).toUpperCase(), x + w - 14 * S, y - slide + 28 * S, 14 * S, col, 'right', F_TXT, 700, 0.1, Math.max(0, a));
      lines.forEach((t, k) => this.text(t, x + 102 * S, y - slide + (56 + k * 24) * S, 19 * S, BONE, 'left', F_TXT, 600, 0.1, Math.max(0, a)));
      g.globalAlpha = 1;
      y += h + 10 * S;
    }
    this.cardsBottom = y;   // banners start below whatever cards are up
    this.cards = this.cards.filter((c) => c.t < c.life);
  }
  tip(text) { (this.tipQ = this.tipQ || []).push({ text, t: 0 }); if (this.tipQ.length > 4) this.tipQ.splice(1, 1); }
  drawTip(dt, W, H, S, hide) {
    const Q = this.tipQ; if (!Q || !Q.length) return;
    const T = Q[0]; if (!hide) T.t += dt;
    const life = 9, a = clamp(Math.min(T.t * 3, (life - T.t) * 2), 0, 1);
    if (T.t >= life) { Q.shift(); return; }
    if (hide) return;
    const g = this.g, w = Math.min(640 * S, W - 80 * S), size = 19 * S, lines = this.wrap(T.text, w - 44 * S, size, F_TXT, 600), h = (38 + lines.length * 25) * S, x = (W - w) / 2, y = H * 0.7 - h;
    g.globalAlpha = a;
    this.panel(x, y, w, h, 'rgba(143,208,255,0.9)', 'rgba(10,16,24,0.88)', 10 * S);
    this.text('TIP', x + 22 * S, y + 26 * S, 16 * S, '#8fd0ff', 'left', F_BIG, 400, 0.14);
    lines.forEach((ln, i) => this.text(ln, x + 22 * S, y + (52 + i * 25) * S, size, BONE, 'left', F_TXT, 600, 0.01));
    g.globalAlpha = 1;
  }
  toast(text, color = BONE) { this.toasts.push({ text, color: toCss(color), t: 0, life: 3.2 }); if (this.toasts.length > 6) this.toasts.shift(); }
  banner(text, color = BONE, dur = 3, kind = '') {
    if (kind === 'round') { this.roundBanner = { text, t: 0, life: dur }; return; }
    this.banners.push({ text, color: toCss(color), t: 0, life: dur });
    if (this.banners.length > 3) this.banners.shift();
  }
  floater(pos, text, color, scale = 1) {
    this.floaters.push({ pos: pos.clone(), text, color: toCss(color), scale, t: 0, life: 0.9, dx: (Math.random() - 0.5) * 30 });
    if (this.floaters.length > 60) this.floaters.shift();
  }

  // ------------------------------------------------------------------ primitives
  fs(size) { return Math.max(size, this.minFs || 12); }
  text(str, x, y, size, color = BONE, align = 'left', font = F_TXT, weight = 700, outline = 0.18, alpha = 1) {
    const g = this.g;
    size = this.fs(size);
    g.font = `${font === F_BIG ? '' : weight + ' '}${Math.round(size)}px ${font}`;
    g.textAlign = align; g.textBaseline = 'alphabetic';
    g.globalAlpha = alpha;
    if (outline > 0) { g.lineJoin = 'round'; g.lineWidth = Math.max(2, size * outline); g.strokeStyle = INK; g.strokeText(str, x, y); }
    g.fillStyle = color; g.fillText(str, x, y);
    g.globalAlpha = 1;
    return g.measureText(str).width;
  }
  panel(x, y, w, h, border = GOLD, fill = PANEL, notch = 10) {
    const g = this.g;
    g.beginPath();
    g.moveTo(x + notch, y); g.lineTo(x + w, y); g.lineTo(x + w, y + h - notch); g.lineTo(x + w - notch, y + h); g.lineTo(x, y + h); g.lineTo(x, y + notch); g.closePath();
    g.fillStyle = fill; g.fill();
    if (border) { g.lineWidth = 2; g.strokeStyle = border; g.stroke(); }
  }
  bar(x, y, w, h, frac, color, back = 'rgba(0,0,0,0.55)', segs = 0) {
    const g = this.g;
    g.fillStyle = INK; g.fillRect(x - 3, y - 3, w + 6, h + 6);
    g.fillStyle = back; g.fillRect(x, y, w, h);
    g.fillStyle = color; g.fillRect(x, y, w * clamp(frac, 0, 1), h);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x, y, w * clamp(frac, 0, 1), Math.max(2, h * 0.28));
    if (segs > 1) { g.fillStyle = INK; for (let i = 1; i < segs; i++) g.fillRect(x + (w * i) / segs - 1, y, 2, h); }
  }
  measure(str, size, font = F_TXT, weight = 700) {
    const g = this.g; size = this.fs(size);
    g.font = `${font === F_BIG ? '' : weight + ' '}${Math.round(size)}px ${font}`;
    return g.measureText(str).width;
  }
  rrect(x, y, w, h, r) {
    const g = this.g; r = Math.min(r, w / 2, h / 2);
    g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r);
    g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  }
  // keycap badge, vertically centred on cy; returns its width
  key(k, x, cy, h, fill = BONE, alpha = 1) {
    const g = this.g; h = Math.max(h, this.fs(0) * 1.5);
    const fsz = h * 0.6, tw = this.measure(k, fsz, F_BIG);
    const w = Math.max(h, tw + h * 0.55);
    g.globalAlpha = alpha;
    this.rrect(x, cy - h / 2 + h * 0.08, w, h, h * 0.18); g.fillStyle = INK; g.fill();
    this.rrect(x, cy - h / 2, w, h * 0.92, h * 0.18); g.fillStyle = fill; g.fill();
    g.globalAlpha = 1;
    this.text(k, x + w / 2, cy + fsz * 0.34, fsz, INK, 'center', F_BIG, 400, 0, alpha);
    return w;
  }
  // a row of "[Key] label" hints, e.g. "[E] Play again   [Tab] Leave"
  hints(str, x, cy, size, align = 'center', alpha = 0.9, hex = null) {
    const parts = str.split(/(\[[^\]]+\])/).map((t) => t.trim()).filter(Boolean);
    const H = this.fs(size) * 1.35, gap = size * 0.45;
    const widths = parts.map((t) => (t[0] === '[' ? Math.max(H, this.measure(t.slice(1, -1), H * 0.6, F_BIG) + H * 0.55) : this.measure(t, size, F_TXT, 700)));
    let total = 0; parts.forEach((t, i) => { total += widths[i] + (i < parts.length - 1 ? (t[0] === '[' ? gap : gap * 3.2) : 0); });
    let px = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    parts.forEach((t, i) => {
      if (t[0] === '[') px += this.key(t.slice(1, -1), px, cy, H, BONE, alpha) + gap;
      else { this.text(t, px, cy + this.fs(size) * 0.36, size, hex || `rgba(242,232,213,${alpha})`, 'left', F_TXT, 700, 0.12); px += widths[i] + gap * 3.2; }
    });
    return total;
  }
  star(cx, cy, r, fill) {
    const g = this.g;
    g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    g.closePath();
    g.lineJoin = 'round'; g.lineWidth = Math.max(2, r * 0.45); g.strokeStyle = INK; g.stroke();
    if (fill) { g.fillStyle = fill; g.fill(); } else { g.lineWidth = Math.max(1, r * 0.18); g.strokeStyle = 'rgba(242,232,213,0.45)'; g.stroke(); }
  }
  // set marks drawn as flat shapes (never a font glyph): 0 Iron (a bullet), 1 Blood (a drop), 2 Gold (a nugget), 3 Wind (a feathered chevron)
  suit(kind, cx, cy, r, col) {
    const g = this.g; g.fillStyle = col; g.beginPath();
    if (kind === 0) { g.moveTo(cx - r * 0.5, cy + r); g.lineTo(cx - r * 0.5, cy - r * 0.2); g.quadraticCurveTo(cx - r * 0.5, cy - r, cx, cy - r * 1.05); g.quadraticCurveTo(cx + r * 0.5, cy - r, cx + r * 0.5, cy - r * 0.2); g.lineTo(cx + r * 0.5, cy + r); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(cx - r * 0.5, cy + r * 0.35, r, r * 0.22); return; }
    if (kind === 1) { g.moveTo(cx, cy - r * 1.05); g.bezierCurveTo(cx + r * 0.2, cy - r * 0.3, cx + r * 0.85, cy + r * 0.1, cx + r * 0.7, cy + r * 0.5); g.arc(cx, cy + r * 0.35, r * 0.72, 0.2, Math.PI - 0.2); g.bezierCurveTo(cx - r * 0.85, cy + r * 0.1, cx - r * 0.2, cy - r * 0.3, cx, cy - r * 1.05); g.fill(); return; }
    if (kind === 2) { g.moveTo(cx - r * 0.9, cy + r * 0.2); g.lineTo(cx - r * 0.45, cy - r * 0.75); g.lineTo(cx + r * 0.4, cy - r * 0.85); g.lineTo(cx + r * 0.95, cy - r * 0.05); g.lineTo(cx + r * 0.5, cy + r * 0.8); g.lineTo(cx - r * 0.5, cy + r * 0.85); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(cx - r * 0.45, cy - r * 0.75); g.lineTo(cx + r * 0.4, cy - r * 0.85); g.lineTo(cx, cy - r * 0.1); g.closePath(); g.fill(); return; }
    if (kind === 3) { for (const o of [-0.55, 0.25]) { g.beginPath(); g.moveTo(cx - r * 0.8, cy + (o - 0.35) * r); g.lineTo(cx + r * 0.2, cy + (o - 0.35) * r); g.lineTo(cx + r * 0.9, cy + o * r); g.lineTo(cx + r * 0.2, cy + (o + 0.35) * r); g.lineTo(cx - r * 0.8, cy + (o + 0.35) * r); g.lineTo(cx - r * 0.2, cy + o * r); g.closePath(); g.fill(); } return; }
    if (kind === 2) { g.moveTo(cx, cy - r); g.lineTo(cx + r * 0.72, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r * 0.72, cy); g.closePath(); g.fill(); return; }
    if (kind === 3) { for (const [dx, dy] of [[0, -0.45], [-0.48, 0.15], [0.48, 0.15]]) { g.moveTo(cx + dx * r + r * 0.42, cy + dy * r); g.arc(cx + dx * r, cy + dy * r, r * 0.42, 0, Math.PI * 2); } g.fill(); }
    else {
      const f = kind === 1 ? 1 : -1;   // heart, or the same shape flipped for a spade
      g.moveTo(cx, cy + f * r * 0.95); g.bezierCurveTo(cx - r * 1.5, cy - f * r * 0.1, cx - r * 0.6, cy - f * r * 1.2, cx, cy - f * r * 0.35);
      g.bezierCurveTo(cx + r * 0.6, cy - f * r * 1.2, cx + r * 1.5, cy - f * r * 0.1, cx, cy + f * r * 0.95); g.fill();
    }
    if (kind !== 1) { g.beginPath(); g.moveTo(cx, cy + r * 0.1); g.lineTo(cx + r * 0.32, cy + r); g.lineTo(cx - r * 0.32, cy + r); g.closePath(); g.fill(); }
  }
  playingCard(c, x, y, w, h, hidden) {
    const g = this.g;
    this.rrect(x, y + 4, w, h, w * 0.12); g.fillStyle = INK; g.fill();
    this.rrect(x, y, w, h, w * 0.12); g.fillStyle = hidden ? '#8e1c24' : '#f4ecdc'; g.fill();
    if (hidden) { this.rrect(x + w * 0.12, y + w * 0.12, w * 0.76, h - w * 0.24, w * 0.08); g.strokeStyle = GOLD; g.lineWidth = Math.max(2, w * 0.04); g.stroke(); return; }
    const red = c.s === 1 || c.s === 2, col = red ? '#c8212a' : '#1d1418';
    const rank = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }[c.r] || String(c.r);
    this.text(rank, x + w * 0.5, y + h * 0.46, h * 0.42, col, 'center', F_BIG, 400, 0);
    this.suit(c.s, x + w * 0.5, y + h * 0.72, h * 0.14, col);
  }
  chip(str, x, cy, size, color, fill = 'rgba(0,0,0,0.45)', align = 'left') {
    const g = this.g, tw = this.measure(str, size, F_TXT, 700), padX = size * 0.5, h = this.fs(size) * 1.45;
    const x0 = align === 'right' ? x - tw - padX * 2 : x;
    this.rrect(x0, cy - h / 2, tw + padX * 2, h, h * 0.22); g.fillStyle = fill; g.fill();
    g.lineWidth = Math.max(1, size * 0.08); g.strokeStyle = color; g.globalAlpha = 0.7; g.stroke(); g.globalAlpha = 1;
    this.text(str, x0 + padX, cy + this.fs(size) * 0.36, size, color, 'left', F_TXT, 700, 0);
    return tw + padX * 2;
  }
  icon(name, x, y, size, alpha = 1) {
    // the Descent's parts have no painted icon: a six-sided tag in the part's colour with its short name
    if (name[0] === 'U' && name[1] === '_') { const U = DATA.upgrades[+name.slice(2)]; if (U && U.core) {
      // the Descent's parts: a six-sided tag in the part's colour with its own symbol
      const g = this.g, r = size * 0.5; g.globalAlpha = alpha; g.fillStyle = U.hex; g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; g[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill();
      if (!U.img) { U.img = new Image(); U.img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(coreSvg(U).replace('<svg ', '<svg width="96" height="96" ')); }
      if (U.img.complete && U.img.naturalWidth) g.drawImage(U.img, x - size * 0.29, y - size * 0.29, size * 0.58, size * 0.58);
      g.globalAlpha = 1; return; } }
    if (!this.icons) return;
    const m = this.icons.meta[name]; if (!m) return;
    const I = this.icons.img, W = I.width, H = I.height;
    this.g.globalAlpha = alpha;
    this.g.drawImage(I, m.u0 * W, m.v0 * H, (m.u1 - m.u0) * W, (m.v1 - m.v0) * H, x - size / 2, y - size / 2, size, size);
    this.g.globalAlpha = 1;
  }
  wrap(str, maxW, size, font = F_TXT, weight = 600) {
    const g = this.g; size = this.fs(size); g.font = `${font === F_BIG ? '' : weight + ' '}${Math.round(size)}px ${font}`;
    const words = str.split(' '), out = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }
    if (line) out.push(line);
    return out;
  }

  // ------------------------------------------------------------------ frame
  draw(game, dt, mode) {
    const cv = this.cv, g = this.g;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.floor(cv.clientWidth * dpr), H = Math.floor(cv.clientHeight * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, W, H);
    const S = Math.min(W / 1920, H / 1080) * 1.0;
    this.S = S; this.W = W; this.H = H; this.minFs = 12 * dpr;
    this.time += dt;
    if (mode === 'title' || !game || !game.player) return;
    const P = game.player;

    this.drawVignette(game, P);
    if (!P.dead) this.drawCornerShade(W, H, S);
    if (game.vm.scoped && !P.dead) this.drawScope(W, H, S);
    if (!P.dead) this.drawEnemyBars(game, P);
    if (this.needMouse && !P.dead) { const S2 = this.S; this.g.fillStyle = 'rgba(20,10,16,0.75)'; this.g.fillRect(this.W / 2 - 250 * S2, this.H * 0.62, 500 * S2, 54 * S2); this.text('CLICK TO GRAB THE MOUSE', this.W / 2, this.H * 0.62 + 37 * S2, 30 * S2, GOLD, 'center', F_BIG, 400, 0.1); }
    if (game.net && game.net.active) this.drawTeam(game, W, H, S);
    if (!P.inMenu() && !P.showInventory) this.drawCards(); else this.cardsBottom = 0;
    this.drawFloaters(game, dt);
    this.drawCoop(game);
    if (!P.inMenu() && !P.dead) this.drawBuilds(P, H, S, game.round <= 1 ? 350 * S : 0);
    this.drawTip(dt, W, H, S, !!P.menu || P.dead || P.showInventory);
    if (!P.dead) {
      this.drawCasinoMarker(game);
      this.drawStragglers(game);
      this.drawCrosshair(game, P, W, H, S);
      this.drawDamageArcs(game, P, W, H, S);
      this.drawVitals(game, P, W, H, S);
      this.drawWeapon(game, P, W, H, S);
      this.drawRound(game, W, H, S);
      this.drawBoss(game, W, H, S);
      this.drawPowerups(game, W, H, S);
      this.drawPrompt(game, P, W, H, S);
      this.drawHelp(game, W, H, S, dt);
      if (P.menu) this.drawMenu(game, P, W, H, S);
      else if (P.showInventory) this.drawInventory(game, P, W, H, S);
    }
    this.drawBanners(dt, W, H, S, !!P.menu || P.showInventory || !!game.victory);
    this.drawToasts(dt, W, H, S);
    if (P.dead) this.drawDeath(game, P, W, H, S);
    else if (game.victory) this.drawVictory(game, P, W, H, S);
    if (mode === 'paused' && !P.dead) { this.g.fillStyle = 'rgba(10,6,10,0.62)'; this.g.fillRect(0, 0, W, H); }
    if (this.showFps) this.text(`${this.fps.toFixed(0)} fps`, W - 12 * S, 28 * S, 22 * S, '#9f9', 'right');
  }

  drawVignette(game, P) {
    const g = this.g, W = this.W, H = this.H;
    if (this.hurtFx && this.hurtFx.length && this.icons) {
      const dt = 1 / 60, I = this.icons.img;
      for (const f of this.hurtFx) {
        f.t += dt;
        const m = this.icons.meta['FX_Blood_' + f.k]; if (!m) continue;
        const a = Math.min(1, (f.life - f.t) / 0.9), sz = f.s * H * (1 + Math.min(1, f.t * 8) * 0.15);
        g.save(); g.globalAlpha = Math.max(0, a) * 0.85; g.translate(f.x * W, f.y * H + f.t * f.t * 6 * this.S); g.rotate(f.rot);
        g.drawImage(I, m.u0 * I.width, m.v0 * I.height, (m.u1 - m.u0) * I.width, (m.v1 - m.v0) * I.height, -sz / 2, -sz / 2, sz, sz); g.restore();
      }
      this.hurtFx = this.hurtFx.filter((f) => f.t < f.life);
    }
    if (this.hurtWhite > 0) { g.fillStyle = `rgba(255,230,220,${this.hurtWhite * 2.2})`; g.fillRect(0, 0, W, H); this.hurtWhite -= 1 / 60; }
    const low = P.health < P.maxHealth * 0.35 ? (1 - P.health / (P.maxHealth * 0.35)) * (0.55 + 0.25 * Math.sin(this.time * 6)) : 0;
    const a = clamp(P.hurtFlash * 0.75 + low * 0.6, 0, 0.9);
    if (a > 0.01) {
      const grad = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85);
      grad.addColorStop(0, 'rgba(160,10,20,0)'); grad.addColorStop(1, `rgba(150,8,18,${a})`);
      g.fillStyle = grad; g.fillRect(0, 0, W, H);
    }
    if (game.instaKill > 0 || game.doublePoints > 0) {
      const c = game.instaKill > 0 ? '200,30,30' : '255,200,40';
      const grad = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.9);
      grad.addColorStop(0, `rgba(${c},0)`); grad.addColorStop(1, `rgba(${c},0.18)`);
      g.fillStyle = grad; g.fillRect(0, 0, W, H);
    }
    if (P.dashT > 0 || Math.hypot(P.vel.x, P.vel.z) > 1300) {
      const sp = clamp((Math.hypot(P.vel.x, P.vel.z) - 1100) / 1200, 0, 0.5) + (P.dashT > 0 ? 0.35 : 0);
      g.strokeStyle = `rgba(255,255,255,${0.12 * sp})`; g.lineWidth = 2;
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2 + this.time * 0.7, r0 = H * (0.42 + 0.05 * Math.sin(i * 7.3 + this.time * 9)), r1 = H * 0.9;
        g.beginPath(); g.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0); g.lineTo(W / 2 + Math.cos(a) * r1, H / 2 + Math.sin(a) * r1); g.stroke();
      }
    }
  }
  drawScope(W, H, S) {
    const g = this.g, r = H * 0.46;
    g.fillStyle = '#07050a';
    g.beginPath(); g.rect(0, 0, W, H); g.arc(W / 2, H / 2, r, 0, Math.PI * 2, true); g.fill();
    g.strokeStyle = '#07050a'; g.lineWidth = 3 * S;
    g.beginPath(); g.moveTo(W / 2 - r, H / 2); g.lineTo(W / 2 - 14 * S, H / 2); g.moveTo(W / 2 + 14 * S, H / 2); g.lineTo(W / 2 + r, H / 2);
    g.moveTo(W / 2, H / 2 + 14 * S); g.lineTo(W / 2, H / 2 + r); g.moveTo(W / 2, H / 2 - r); g.lineTo(W / 2, H / 2 - 14 * S); g.stroke();
    g.fillStyle = BLOOD; g.beginPath(); g.arc(W / 2, H / 2, 3 * S, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 18 * S; g.beginPath(); g.arc(W / 2, H / 2, r - 9 * S, 0, Math.PI * 2); g.stroke();
  }
  drawCrosshair(game, P, W, H, S) {
    const g = this.g, cx = W / 2, cy = H / 2;
    if (game.vm.scoped) return;
    const ads = game.vm.aimA;
    const spreadPx = Math.tan(P.spreadDeg() * Math.PI / 180) / Math.tan(P.fov * Math.PI / 360) * (W / 2);
    const gap = (6 + spreadPx + P.crossKick * 9) * S / Math.max(S, 0.0001) * (S > 0 ? 1 : 1);
    const O = game.vm.optic, oa = O && !P.wield ? clamp((ads - 0.7) / 0.25, 0, 1) : 0;   // looking through an optic: its own reticle takes over
    const noSight = game.vm.feel && (game.vm.feel.cant || game.vm.feel.twin);   // nothing to sight down: the crosshair stays
    const len = 10 * S, a = noSight ? 1 : (1 - ads * 0.85) * (1 - oa);
    g.globalAlpha = a;
    const tick = (x0, y0, x1, y1) => { g.strokeStyle = INK; g.lineWidth = 5 * S; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.strokeStyle = BONE; g.lineWidth = 2.4 * S; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
    const G2 = Math.max(gap, 5 * S);
    tick(cx - G2 - len, cy, cx - G2, cy); tick(cx + G2, cy, cx + G2 + len, cy); tick(cx, cy + G2, cx, cy + G2 + len);
    if (P.W.cls !== 'Shotgun') tick(cx, cy - G2 - len, cx, cy - G2);
    g.globalAlpha = 1 - oa;
    g.fillStyle = INK; g.fillRect(cx - 2.5 * S, cy - 2.5 * S, 5 * S, 5 * S); g.fillStyle = BONE; g.fillRect(cx - 1.4 * S, cy - 1.4 * S, 2.8 * S, 2.8 * S);
    if (oa > 0) {
      const col = '#' + O.col.toString(16).padStart(6, '0');
      g.globalAlpha = oa * 0.22; g.fillStyle = col; g.beginPath(); g.arc(cx, cy, 9 * S, 0, Math.PI * 2); g.fill();
      g.globalAlpha = oa;
      if (O.ret === 'cross') {
        const r0 = 7 * S, r1 = 38 * S;
        for (const [w, c] of [[4 * S, 'rgba(0,0,0,0.55)'], [1.9 * S, col]]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(cx - r1, cy); g.lineTo(cx - r0, cy); g.moveTo(cx + r0, cy); g.lineTo(cx + r1, cy); g.moveTo(cx, cy + r0); g.lineTo(cx, cy + r1); g.stroke(); }
        g.fillStyle = 'rgba(0,0,0,0.55)'; g.beginPath(); g.arc(cx, cy, 2.9 * S, 0, Math.PI * 2); g.fill();
        g.fillStyle = col; g.beginPath(); g.arc(cx, cy, 1.9 * S, 0, Math.PI * 2); g.fill();
      } else {
        for (const [w, c] of [[3.6 * S, 'rgba(0,0,0,0.4)'], [1.7 * S, col]]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.arc(cx, cy, 15 * S, 0, Math.PI * 2); g.stroke(); }   // holo ring and dot
        g.fillStyle = col; g.beginPath(); g.arc(cx, cy, 3 * S, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#fff'; g.globalAlpha = oa * 0.8; g.beginPath(); g.arc(cx, cy, 1.2 * S, 0, Math.PI * 2); g.fill();
      }
    }
    g.globalAlpha = 1;
    if (P.reloading) {
      const f = 1 - P.reloadT / Math.max(P.reloadDur, 0.01);
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 5 * S; g.beginPath(); g.arc(cx, cy, 26 * S, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = GOLD; g.lineWidth = 3 * S; g.beginPath(); g.arc(cx, cy, 26 * S, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); g.stroke();
      if (P.stat('ActiveReload') > 0 && !P.arFail) { g.strokeStyle = '#7dff8a'; g.lineWidth = 7 * S; g.beginPath(); g.arc(cx, cy, 26 * S, -Math.PI / 2 + 0.42 * Math.PI * 2, -Math.PI / 2 + 0.62 * Math.PI * 2); g.stroke(); this.hints('[R]', cx, cy + 50 * S, 16 * S, 'center', 0.9); }
    }
    if (P.hitMarker > 0) {
      const k = P.hitMarker / 0.18, s = (9 + 6 * (1 - k)) * S * P.hitScale, o = 6 * S;
      const col = P.hitKill ? BLOOD : P.hitHead ? '#ffb347' : BONE;
      g.globalAlpha = clamp(k * 1.5, 0, 1);
      const x = (sx, sy) => { g.beginPath(); g.moveTo(cx + sx * o, cy + sy * o); g.lineTo(cx + sx * (o + s), cy + sy * (o + s)); g.stroke(); };
      g.strokeStyle = INK; g.lineWidth = 6 * S; x(1, 1); x(-1, 1); x(1, -1); x(-1, -1);
      g.strokeStyle = col; g.lineWidth = 3 * S; x(1, 1); x(-1, 1); x(1, -1); x(-1, -1);
      g.globalAlpha = 1;
    }
    if (P.killPulse > 0) {
      g.globalAlpha = P.killPulse * 0.8;
      this.icon('I_Skull', cx, cy - 46 * S - (1 - P.killPulse) * 12 * S, 30 * S * (1 + (1 - P.killPulse) * 0.3));
      g.globalAlpha = 1;
    }
  }
  drawDamageArcs(game, P, W, H, S) {
    const g = this.g, cx = W / 2, cy = H / 2;
    for (const d of P.damageInd) {
      const to = d.at.clone().sub(P.pos);
      const ang = Math.atan2(to.x, to.z);                 // world yaw toward source
      const fwd = Math.atan2(-Math.sin(P.yaw), -Math.cos(P.yaw));
      let rel = ang - fwd; // positive = to the left? convert to screen angle: 0 = up
      const sx = to.x * Math.cos(P.yaw) - to.z * Math.sin(P.yaw);           // right component
      const sz = -to.x * Math.sin(P.yaw) - to.z * Math.cos(P.yaw);          // forward component
      rel = Math.atan2(sx, sz);
      const a = -Math.PI / 2 + rel, r = 120 * S;
      g.globalAlpha = clamp(d.t / 1.4, 0, 1) * (0.5 + d.s * 0.5);
      g.strokeStyle = BLOOD; g.lineWidth = 10 * S;
      g.beginPath(); g.arc(cx, cy, r, a - 0.32, a + 0.32); g.stroke();
      g.fillStyle = BLOOD;
      g.beginPath(); g.moveTo(cx + Math.cos(a) * (r + 22 * S), cy + Math.sin(a) * (r + 22 * S)); g.lineTo(cx + Math.cos(a - 0.12) * (r + 6 * S), cy + Math.sin(a - 0.12) * (r + 6 * S)); g.lineTo(cx + Math.cos(a + 0.12) * (r + 6 * S), cy + Math.sin(a + 0.12) * (r + 6 * S)); g.fill();
      g.globalAlpha = 1;
    }
  }
  drawCornerShade(W, H, S) {
    // HUD plates: slanted dark panels with a gold edge behind the bottom corners, and a chip behind the round number
    const g = this.g;
    const plate = (x0, x1, y0, y1, slant) => {
      g.beginPath();
      if (slant > 0) { g.moveTo(x0, y0); g.lineTo(x1 - slant, y0); g.lineTo(x1, y1); g.lineTo(x0, y1); }
      else { g.moveTo(x0 - slant, y0); g.lineTo(x1, y0); g.lineTo(x1, y1); g.lineTo(x0, y1); }
      g.closePath();
      const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, 'rgba(22,12,18,0.82)'); gr.addColorStop(1, 'rgba(22,12,18,0.55)');
      g.fillStyle = gr; g.fill();
      g.beginPath(); if (slant > 0) { g.moveTo(x0, y0); g.lineTo(x1 - slant, y0); g.lineTo(x1, y1); } else { g.moveTo(x1, y0); g.lineTo(x0 - slant, y0); g.lineTo(x0, y1); }
      g.lineWidth = 3 * S; g.strokeStyle = GOLD; g.stroke();
      g.fillStyle = '#c8211b'; if (slant > 0) g.fillRect(x0, y0 + 6 * S, 6 * S, y1 - y0 - 6 * S); else g.fillRect(x1 - 6 * S, y0 + 6 * S, 6 * S, y1 - y0 - 6 * S);
    };
    plate(0, 520 * S, H - 216 * S, H, 70 * S);
    plate(W - 470 * S, W, H - 216 * S, H, -70 * S);
    // round badge
    const cx = 80 * S, cy = 104 * S, r = 62 * S;
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fillStyle = 'rgba(22,12,18,0.85)'; g.fill();
    g.lineWidth = 7 * S; g.strokeStyle = '#8a1f1c'; g.stroke();                                   // a plain iron-red badge: no chip markings
    g.lineWidth = 2 * S; g.strokeStyle = GOLD; g.beginPath(); g.arc(cx, cy, r + 5 * S, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 2 * S; g.strokeStyle = 'rgba(242,232,213,0.5)'; g.beginPath(); g.arc(cx, cy, r - 8 * S, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; g.beginPath(); g.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3.2 * S, 0, Math.PI * 2); g.fillStyle = GOLD; g.fill(); }   // rivets
  }
  drawVitals(game, P, W, H, S) {
    const x = 44 * S, y = H - 64 * S, w = 400 * S, h = 22 * S;
    const g = this.g;
    const low = P.health < P.maxHealth * 0.35;
    // money + luck
    const my = y - 92 * S;
    const ms = `$${Math.floor(P.money / 10).toLocaleString()}`;
    const mw = this.text(ms, x, my, 60 * S, GOLD, 'left', F_BIG, 400, 0.12);
    let lx = x + mw + 18 * S;
    if (game.doublePoints > 0) lx += this.text('x2', lx - 8 * S, my - 30 * S, 28 * S, GOLD, 'left', F_BIG, 400, 0.12) + 6 * S;
    // health
    this.icon('I_Heart', x + 16 * S, y - 30 * S, 36 * S);
    const hs = `${Math.ceil(P.health)}`;
    const hw = this.text(hs, x + 42 * S, y - 16 * S, 46 * S, low ? BLOOD : BONE, 'left', F_BIG, 400, 0.12);
    this.text(`/ ${Math.round(P.maxHealth)}`, x + 50 * S + hw, y - 16 * S, 22 * S, '#bdb3a2', 'left', F_TXT, 700, 0.12);
    const hc = low ? (Math.sin(this.time * 10) > 0 ? '#ff4a3a' : BLOOD) : '#ece2cc';
    this.bar(x, y - 4 * S, w, h, P.health / P.maxHealth, hc, 'rgba(60,10,16,0.8)', Math.max(1, Math.round(P.maxHealth / 50)));
    if (P.overshield > 0) { g.fillStyle = 'rgba(120,200,255,0.9)'; g.fillRect(x, y - 4 * S, w * clamp(P.overshield / P.maxHealth, 0, 1), 6 * S); }
    // movement pips, each group labelled underneath
    let px = x;
    const py = y + 30 * S, ph = 12 * S;
    const group = (label, n, draw) => {
      const x0 = px; draw();
      this.text(label, x0, py + ph + 18 * S, 14 * S, 'rgba(242,232,213,0.7)', 'left', F_TXT, 700, 0.12);
      px = Math.max(px, x0 + this.measure(label, 14 * S, F_TXT, 700)) + 22 * S;
    };
    const pip = (on, col, wd = 28 * S) => { g.fillStyle = INK; g.fillRect(px - 2 * S, py - 2 * S, wd + 4 * S, ph + 4 * S); g.fillStyle = on ? col : 'rgba(255,255,255,0.14)'; g.fillRect(px, py, wd, ph); px += wd + 6 * S; };
    group('DASH', P.maxDash(), () => {
      const st = px;
      for (let i = 0; i < P.maxDash(); i++) pip(i < P.dashCharges, '#7fd3ff');
      if (P.dashCharges < P.maxDash()) { const i = P.dashCharges; g.fillStyle = 'rgba(127,211,255,0.5)'; g.fillRect(st + i * 34 * S, py, 28 * S * clamp(P.dashRecharge / P.dashCooldown(), 0, 1), ph); }
    });
    group('JUMP', P.maxAirJumps(), () => { for (let i = 0; i < P.maxAirJumps(); i++) pip(i < P.airJumps || P.grounded, BONE); });
    group('WALL', 1, () => {
      const f = clamp((P.wallStam ?? P.maxWallStam()) / P.maxWallStam(), 0, 1);
      g.fillStyle = INK; g.fillRect(px - 2 * S, py - 2 * S, 58 * S, ph + 4 * S);
      g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(px, py, 54 * S, ph);
      g.fillStyle = f < 0.15 ? '#ff5a4d' : '#8fe08a'; g.fillRect(px, py, 54 * S * f, ph);
      px += 60 * S;
    });
    group(P.cls.short, 1, () => {
      const gr = Math.max(0, Math.min(1, P.abilityReady()));
      g.fillStyle = INK; g.fillRect(px - 2 * S, py - 2 * S, 58 * S, ph + 4 * S);
      g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(px, py, 54 * S, ph);
      g.fillStyle = gr >= 1 ? GOLD : '#a07a30'; g.fillRect(px, py, 54 * S * gr, ph);
      px += 60 * S;
    });
  }
  // the blade is in hand: its name, how far it reaches, the swing chain, and the gun waiting on the belt
  drawBlade(P, x, y, S) {
    const g = this.g, MW = MELEE[P.meleeDef || 0], t = P.meleeTier || 0;
    this.text(`${(P.meleeRange() / 100).toFixed(1)} M`, x, y, 62 * S, BONE, 'right', F_BIG, 400, 0.1);
    this.text('REACH', x - this.measure(`${(P.meleeRange() / 100).toFixed(1)} M`, 62 * S, F_BIG) - 12 * S, y - 4 * S, 18 * S, '#bdb3a2', 'right', F_TXT, 700, 0.12);
    for (let i = 0; i < 3; i++) { g.fillStyle = INK; g.fillRect(x - (i + 1) * 46 * S - 1, y + 14 * S, 44 * S, 16 * S); g.fillStyle = P.meleeComboT > 0 && (2 - i) <= P.meleeCombo ? ((2 - i) === 2 ? '#ffb347' : BONE) : 'rgba(255,255,255,0.14)'; g.fillRect(x - (i + 1) * 46 * S + 1, y + 16 * S, 40 * S, 12 * S); }
    this.text(MW.name.toUpperCase() + (t ? ` +${t}` : ''), x, y - 104 * S, 34 * S, RARITY_HEX[MW.rarity], 'right', F_BIG, 400, 0.12);
    this.text(`${Math.round(MW.dmg * P.meleePower())} DAMAGE   HITS ${Math.round(P.meleeCleave())}`, x, y - 75 * S, 18 * S, 'rgba(242,232,213,0.8)', 'right', F_TXT, 700, 0.12);
    this.hints('[Fire] Swing   [Aim] Hold to wind up   [X] Gun', x, y + 50 * S, 18 * S, 'right');
    if (P.flow > 0) this.text(`FLOW x${P.flow}`, x - 150 * S, y + 28 * S, 20 * S, '#7fe3ff', 'right', F_BIG, 400, 0.12);
    if (P.meleeCharge > 0) { const cw = 220 * S, cx = this.W / 2 - cw / 2, cy = this.H * 0.6; g.fillStyle = INK; g.fillRect(cx - 2, cy - 2, cw + 4, 10 * S + 4); g.fillStyle = P.meleeCharge >= 1 ? '#ffd24d' : BONE; g.fillRect(cx, cy, cw * P.meleeCharge, 10 * S); }
    { const n = P.grenades.length, N = n ? GRENADES[P.grenades[n - 1]] : null, label = N ? `${N.name.toUpperCase()}  x${n}` : 'NO GRENADES';
      this.text(label, x, y - 270 * S, 22 * S, N ? N.hex : 'rgba(255,255,255,0.35)', 'right', F_BIG, 400, 0.1);
      this.key('V', x - this.measure(label, 22 * S, F_BIG) - 38 * S, y - 278 * S, 22 * S); }
    let cy = y - 146 * S;
    for (let i = P.maxSlots - 1; i >= 0; i--) { const o = P.weapons[i]; if (o.def < 0) continue; const D = DATA.weapons[o.def]; this.text(`${i + 1}  ${D.name.toUpperCase()}   ${o.ammo} / ${o.reserve}`, x, cy, 18 * S, 'rgba(242,232,213,0.7)', 'right', F_TXT, 700, 0.1); cy -= 24 * S; }
  }
  drawWeapon(game, P, W, H, S) {
    const x = W - 44 * S, y = H - 64 * S;
    const Sl = P.slot, Wd = P.W;
    const g = this.g;
    if (P.wield) return this.drawBlade(P, x, y, S);
    const mag = P.magSize(Sl);
    const low = Sl.ammo <= Math.max(2, Math.floor(mag / 4));
    const rs = `/ ${Sl.reserve}`, rw = this.measure(rs, 34 * S, F_BIG);
    this.text(rs, x, y, 34 * S, '#bdb3a2', 'right', F_BIG, 400, 0.12);
    this.text(`${Sl.ammo}`, x - rw - 10 * S, y, 88 * S, Sl.ammo === 0 ? BLOOD : low ? '#ffb347' : BONE, 'right', F_BIG, 400, 0.1);
    // mag pips
    const n = Math.min(mag, 40), pw = Math.min(11 * S, (300 * S) / n), filledN = Math.round((Sl.ammo / mag) * n);
    for (let i = 0; i < n; i++) {
      g.fillStyle = INK; g.fillRect(x - (i + 1) * pw - 1, y + 14 * S, pw, 16 * S);
      g.fillStyle = i < filledN ? (low ? '#ffb347' : BONE) : 'rgba(255,255,255,0.12)'; g.fillRect(x - (i + 1) * pw + 1, y + 16 * S, pw - 3 * S, 12 * S);
    }
    // what this gun has been given at the workbench, and whether its alt-fire is ready
    { const mods = Sl.mods || []; let my = y - 300 * S;
      for (const u of mods) { const U = DATA.upgrades[u]; this.text(U.name.toUpperCase(), x, my, 15 * S, RARITY_HEX[U.rarity], 'right', F_TXT, 700, 0.1); my -= 18 * S; }
      const alt = P.altKind && P.altKind();
      if (P.deadeyeT > 0) this.text(`DEADEYE  ${P.deadeyeT.toFixed(1)}`, this.W / 2, this.H / 2 + 96 * S, 20 * S, '#ffcd5a', 'center', F_BIG, 400, 0.12);
      if (Sl.hot > 0) this.text('HOT MAG', x, y + 44 * S, 15 * S, '#ff8a2a', 'right', F_TXT, 700, 0.1); }
    // melee weapon, with the three-swing chain
    { const MW = MELEE[P.meleeDef || 0], mn = MW.name.toUpperCase() + (P.meleeTier ? ` +${P.meleeTier}` : ''); this.text(mn, x, y - 232 * S, 26 * S, RARITY_HEX[MW.rarity], 'right', F_BIG, 400, 0.1); const tw = this.measure(mn, 26 * S, F_BIG);
      this.key('Q', x - tw - 38 * S, y - 241 * S, 24 * S);
      // grenades: what V throws next, and how many are on the belt
      { const n = P.grenades.length, N = n ? GRENADES[P.grenades[n - 1]] : null, label = N ? `${N.name.toUpperCase()}  x${n}` : 'NO GRENADES';
        this.text(label, x, y - 270 * S, 22 * S, N ? N.hex : 'rgba(255,255,255,0.35)', 'right', F_BIG, 400, 0.1);
        this.key('V', x - this.measure(label, 22 * S, F_BIG) - 38 * S, y - 278 * S, 22 * S); }
      for (let i = 0; i < 3; i++) { g.fillStyle = P.meleeComboT > 0 && i <= P.meleeCombo ? (i === 2 ? '#ffb347' : BONE) : 'rgba(255,255,255,0.18)'; g.fillRect(x - 14 * S - i * 18 * S, y - 226 * S, 14 * S, 5 * S); } }
    // name + class/tier
    this.text(Wd.name.toUpperCase(), x, y - 104 * S, 34 * S, RARITY_HEX[Wd.rarity], 'right', F_BIG, 400, 0.12);
    let sx = x;
    for (let i = 2; i >= 0; i--) { this.star(sx - 9 * S, y - 82 * S, 9 * S, i < Sl.tier ? '#ff73d9' : null); sx -= 22 * S; }
    this.text(Wd.cls.toUpperCase(), sx - 2 * S, y - 75 * S, 18 * S, 'rgba(242,232,213,0.8)', 'right', F_TXT, 700, 0.12);
    let status = '', sc = GOLD;
    if (P.reloading) status = 'RELOADING';
    else if (Sl.ammo === 0 && Sl.reserve === 0) { status = 'NO AMMO - BUY MORE'; sc = BLOOD; }
    if (status) this.text(status, x, y + 56 * S, 19 * S, sc, 'right', F_TXT, 700, 0.12);
    else if (low) this.hints('[R] Reload', x, y + 50 * S, 18 * S, 'right');
    // other slots as chips above the name
    let cy = y - 146 * S;
    for (let i = P.maxSlots - 1; i >= 0; i--) {
      if (i === P.active) continue;
      const o = P.weapons[i];
      const label = o.def >= 0 ? DATA.weapons[o.def].name.toUpperCase() : 'EMPTY';
      const tw = this.text(label, x, cy + 6 * S, 18 * S, o.def >= 0 ? 'rgba(242,232,213,0.85)' : 'rgba(242,232,213,0.4)', 'right', F_TXT, 700, 0.14);
      const kh = Math.max(24 * S, this.fs(0) * 1.5), kw = Math.max(kh, this.measure(`${i + 1}`, kh * 0.6, F_BIG) + kh * 0.55);
      this.key(`${i + 1}`, x - tw - 10 * S - kw, cy, kh, o.def >= 0 ? BONE : 'rgba(242,232,213,0.5)');
      cy -= 32 * S;
    }
  }
  drawRound(game, W, H, S) {
    const x = 44 * S, y = 150 * S;
    const r = game.round;
    const fl = this.roundFlash > 0 ? this.roundFlash : 0;
    this.roundFlash = Math.max(0, this.roundFlash - 0.016);
    const col = fl > 0 && Math.sin(this.time * 30) > 0 ? BONE : '#d0241d';
    let tx = 160 * S;
    { let fs = 84 * S; const tw = this.measure(`${Math.max(r, 0)}`, fs, F_BIG); if (tw > 86 * S) fs *= (86 * S) / tw;
      this.text(game.descent ? 'ROOM' : 'ROUND', 80 * S, 70 * S, 13 * S, 'rgba(242,232,213,0.8)', 'center', F_TXT, 700, 0.1);
      this.text(`${Math.max(r, 0)}`, 80 * S, 104 * S + this.fs(fs) * 0.42, fs, col, 'center', F_BIG, 400, 0.08); }
    const zn = game.final && game.final.active ? game.map.final.under : game.zones[game.zone] ? `${game.zones[game.zone].name.toUpperCase()}  -  ${diff().name.toUpperCase()}` : '';
    let info = '', ic = BONE;
    if (game.final && (game.final.active || game.final.gate)) { info = game.final.active ? game.map.final.arena : game.map.final.open; ic = GOLD; }
    else if (game.phase === 'Round') info = `${game.remaining()} LEFT`;
    else if (game.phase === 'PreGame') info = `STARTS IN ${Math.ceil(game.phaseTimer)}`;
    else if (game.phase === 'Intermission') info = game.descent ? 'ROOM CLEAR  -  GO ON WHEN READY' : `NEXT ROUND IN ${Math.ceil(game.phaseTimer)}`;
    else if (game.phase === 'Casino') { info = `BREAK  ${Math.ceil(game.phaseTimer)}`; ic = GOLD; }
    this.text(info, tx, y - 46 * S, 28 * S, ic, 'left', F_BIG, 400, 0.12);
    this.text(zn, tx, y - 16 * S, 19 * S, 'rgba(242,232,213,0.85)', 'left', F_TXT, 700, 0.14);
    // the job in hand on the way to the last boss: top right, out of the way
    const Q = game.quest && !(game.final && game.final.active) ? game.quest.hud() : null;
    if (Q) {
      const g = this.g, rx = W - 40 * S, w = 330 * S, top = 34 * S;
      const hh = ((Q.prog ? 92 : 70) + (Q.how ? 24 : 0)) * S;
      g.fillStyle = 'rgba(14,10,12,0.55)'; g.fillRect(rx - w - 14 * S, top - 6 * S, w + 28 * S, hh);
      g.fillStyle = GOLD; g.fillRect(rx + 10 * S, top - 6 * S, 4 * S, hh);
      if (Q.how) this.text(Q.how, rx, top + (Q.prog ? 88 : 64) * S, 14 * S, 'rgba(242,232,213,0.7)', 'right', F_TXT, 600, 0.02);
      this.text(Q.title + (Q.steps ? `   ${Q.step} / ${Q.steps}` : ''), rx, top + 12 * S, 15 * S, GOLD, 'right', F_TXT, 700, 0.14);
      this.text(Q.text, rx, top + 38 * S, 19 * S, BONE, 'right', F_TXT, 700, 0.02);
      if (Q.prog) { this.bar(rx - w, top + 56 * S, w - 96 * S, 9 * S, Q.frac, GOLD, 'rgba(40,30,20,0.8)', 4); this.text(Q.prog, rx, top + 66 * S, 16 * S, 'rgba(242,232,213,0.9)', 'right', F_TXT, 700, 0.04); }
    }
  }
  drawBoss(game, W, H, S) {
    const B = game.boss;
    if (!B || B.dead || B.emerging) return;
    const w = 760 * S, x = (W - w) / 2, y = 54 * S;
    this.text(B.displayName().toUpperCase(), W / 2, y - 10 * S, 30 * S, B.enraged ? '#ff5a3a' : BONE, 'center', F_BIG, 400, 0.14);
    this.bar(x, y, w, 18 * S, B.health / B.maxHealth, B.ward > 0 ? '#6ab8ff' : B.exposedT > 0 ? '#ffd24d' : B.enraged ? '#ff3b2a' : '#c8211b', 'rgba(40,8,12,0.8)', 10);
    // what it is doing, in words: a fight you can read is a fight you can answer
    const say = B.ward > 0 ? 'WARDED - KILL THE WISPS' : B.exposedT > 0 ? 'STAGGERED - HIT IT NOW' : B.bossAttack >= 0 ? ATTACK_LABEL[B.attackName()] : '';
    if (say) this.text(say, W / 2, y + 44 * S, 20 * S, B.ward > 0 ? '#9fd0ff' : B.exposedT > 0 ? '#ffd24d' : '#ffb39a', 'center', F_TXT, 700, 0.14);
  }
  drawPowerups(game, W, H, S) {
    let x = W / 2 - 60 * S;
    const y = H - 70 * S;
    const one = (icon, t, col) => { this.icon(icon, x, y, 64 * S, t < 5 && Math.sin(this.time * 12) < 0 ? 0.35 : 1); this.text(`${Math.ceil(t)}`, x, y + 50 * S, 22 * S, col, 'center', F_BIG); x += 120 * S; };
    if (game.instaKill > 0) one('I_InstaKill', game.instaKill, '#ff5a4d');
    if (game.doublePoints > 0) one('I_DoublePoints', game.doublePoints, GOLD);
    { const Q = game.player; if (Q && Q.safeT > 0.05 && !Q.dead) this.text(`NOTHING CAN TOUCH YOU  ${Math.ceil(Q.safeT)}`, W / 2, Q.menu ? 30 * S : H * 0.14, 20 * S, '#9fe0ff', 'center', F_TXT, 700, 0.08); }
    { const J = game.player && game.player.benchJob; if (J) this.text(J.t > 0 ? `WORKBENCH  ${Math.ceil(J.t)}s` : 'WORKBENCH UPGRADE READY', W / 2, H - 165 * S, 18 * S, J.t > 0 ? '#c9b8cf' : '#ff8cff', 'center', F_TXT, 700); }
    if (game.fireSale) this.text(`HALF PRICE  ${Math.ceil(game.fireSaleT || 0)}s`, W / 2, H - 140 * S, 18 * S, '#ff8cff', 'center', F_TXT, 700);
  }
  drawPrompt(game, P, W, H, S) {
    if (P.menu || !P.focus) return;
    let t = P.focus.prompt(P);
    if (!t) return;
    // first line is the action; an optional second line says what you are looking at
    const [l1, l2] = t.split('\n');
    const g = this.g, size = 24 * S, s2 = 16 * S;
    let tw = this.measure(l1.replace(/\[[^\]]+\]/g, 'XX'), size, F_TXT, 700) + 40 * S;
    if (l2) tw = Math.max(tw, this.measure(l2, s2, F_TXT, 500) + 10 * S);
    const cy = H * 0.64, hh = l2 ? 84 * S : 56 * S;
    this.rrect(W / 2 - tw / 2 - 22 * S, cy - 28 * S, tw + 44 * S, hh, 10 * S);
    g.fillStyle = 'rgba(20,10,16,0.86)'; g.fill(); g.lineWidth = 2 * S; g.strokeStyle = 'rgba(255,205,90,0.85)'; g.stroke();
    this.hints(l1, W / 2, cy, size, 'center', 1, P.focus.promptHex ? P.focus.promptHex() : null);
    if (l2) this.text(l2, W / 2, cy + 36 * S, s2, '#d9cfbd', 'center', F_TXT, 500);
  }
  // when only a handful of enemies are left, point at each one
  drawStragglers(game) {
    const L = game.stragglers(); if (!L.length || L.length > 4) return;
    const S = this.S, W = this.W, H = this.H, g = this.g, m = 54 * S;
    for (const E of L) {
      _v.set(E.pos.x, E.pos.y + E.half + 40, E.pos.z);
      const d = _v.distanceTo(game.player.pos);
      _v.project(game.camera);
      let x = (_v.x * 0.5 + 0.5) * W, y = (-_v.y * 0.5 + 0.5) * H;
      const behind = _v.z > 1; if (behind) { x = W - x; y = H - m - 130 * S; }
      const on = !behind && x > m && x < W - m && y > m + 70 * S && y < H - m - 130 * S;
      x = clamp(x, m, W - m); y = clamp(y, m + 70 * S, H - m - 130 * S);
      const r = (on ? 9 : 13) * S, bob = on ? Math.sin(this.time * 6) * 3 * S : 0;
      g.fillStyle = INK; g.beginPath(); g.moveTo(x, y + r + 4 * S + bob); g.lineTo(x - r - 3 * S, y - r * 0.6 - 3 * S + bob); g.lineTo(x + r + 3 * S, y - r * 0.6 - 3 * S + bob); g.closePath(); g.fill();
      g.fillStyle = '#ff4d40'; g.beginPath(); g.moveTo(x, y + r + bob); g.lineTo(x - r, y - r * 0.6 + bob); g.lineTo(x + r, y - r * 0.6 + bob); g.closePath(); g.fill();
      if (!on) this.text(`${Math.round(d / 100)}m`, x, y + r + 22 * S, 15 * S, BONE, 'center', F_TXT, 700);
    }
  }
  drawCasinoMarker(game) {
    const gate = game.final && game.final.gate;
    if (game.final && game.final.active) return;
    const box = game.box;
    if (!gate && (!box || game.player.pos.distanceTo(box.pos) < 700)) return;
    const S = this.S, W = this.W, H = this.H;
    _v.set(0, 380, 0);
    if (gate) _v.set(gate.x, gate.y + 300, gate.z); else _v.set(box.pos.x, box.pos.y + 260, box.pos.z);
    const d = _v.distanceTo(game.player.pos);
    _v.project(game.camera);
    let x = (_v.x * 0.5 + 0.5) * W, y = (-_v.y * 0.5 + 0.5) * H;
    const behind = _v.z > 1;
    if (behind) { x = W - x; y = H - 40 * S; }
    const m = 60 * S;
    x = clamp(x, m, W - m); y = clamp(y, m + 80 * S, H - m - 120 * S);
    const bob = Math.sin(this.time * 4) * 5 * S;
    this.icon('I_Card', x, y + bob, 52 * S);
    this.text(game.final && game.final.gate ? 'CRYPT' : 'BOX', x, y + 46 * S + bob, 18 * S, GOLD, 'center', F_BIG);
    this.text(`${Math.round(d / 100)}m`, x, y + 66 * S + bob, 15 * S, BONE, 'center', F_TXT, 600);
  }
  // things in the world that teammates need to find: pings, and anyone who is down
  // the builds you are feeding: family, rank and how many buffs it holds, down the left edge
  drawBuilds(P, H, S, ox = 0) {
    if (!P.build) return; const L = Object.keys(BUILDS).filter((b) => P.build[b] > 0).sort((a, b) => P.build[b] - P.build[a]); if (!L.length) return;
    let y = H * 0.36;
    for (const b of L) {
      const n = P.build[b], r = (P.buildRank && P.buildRank[b]) || 0, next = TIERS[r], on = r > 0;
      this.g.globalAlpha = on ? 1 : 0.55;
      this.text(`${b.toUpperCase()}${r ? ' ' + 'I'.repeat(r) : ''}`, ox + 22 * S, y, 15 * S, on ? BUILDS[b].hex : '#b8b0a4', 'left', F_TXT, 700);
      this.text(next ? `${n}/${next}` : `${n}`, ox + 150 * S, y, 13 * S, '#d9cfbd', 'left', F_TXT, 500);
      this.g.globalAlpha = 1; y += 20 * S;
    }
  }
  drawCoop(game) {
    const S = this.S, W = this.W, H = this.H, P = game.player, g = this.g;
    const mark = (pos, lift, label, sub, col, big) => {
      _v.copy(pos); _v.y += lift; const d = Math.round(pos.distanceTo(P.pos) / 100);
      _v.project(game.camera); if (_v.z > 1) return;
      const x = clamp((_v.x * 0.5 + 0.5) * W, 60 * S, W - 60 * S), y = clamp((-_v.y * 0.5 + 0.5) * H, 70 * S, H - 160 * S), r = (big ? 13 : 9) * S;
      g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillStyle = col; g.strokeStyle = 'rgba(10,6,10,0.85)'; g.lineWidth = 3 * S; g.fillRect(-r, -r, r * 2, r * 2); g.strokeRect(-r, -r, r * 2, r * 2); g.restore();
      this.text(`${label}${label ? '  ' : ''}${d}m`, x, y - r - 12 * S, (big ? 20 : 17) * S, col, 'center', F_TXT, 700, 0.06);
      if (sub) this.text(sub, x, y + r + 24 * S, 16 * S, BONE, 'center', F_TXT, 700, 0.06);
    };
    for (const p of game.pings || []) { const a = p.t > 6 ? 7 - p.t : 1; g.globalAlpha = a; mark(p.pos, 40, p.name.toUpperCase(), '', toCss(p.col), false); g.globalAlpha = 1; }
    if (!game.net.active) return;
    for (const G of game.net.ghosts.values()) if (G.down && G.fresh) mark(G.pos, 60, `${G.name.toUpperCase()} IS DOWN`, G.rp > 0.02 ? `getting up ${Math.round(G.rp * 100)}%` : `${Math.ceil(G.bleed)}s`, '#ff5a4d', true);
    const T = game.net.reviveTarget;
    if (T && !P.dead && !P.menu) {
      const y = H * 0.62, w = 300 * S;
      this.hints(`[E] Hold to get ${T.name} up`, W / 2, y, 22 * S, 'center');
      g.fillStyle = 'rgba(10,6,10,0.7)'; g.fillRect(W / 2 - w / 2, y + 16 * S, w, 10 * S); g.fillStyle = '#7fe0ff'; g.fillRect(W / 2 - w / 2, y + 16 * S, w * clamp(T.rp || 0, 0, 1), 10 * S);
    }
  }
  drawFloaters(game, dt) {
    const S = this.S, W = this.W, H = this.H;
    for (const f of this.floaters) {
      f.t += dt;
      _v.copy(f.pos); _v.y += f.t * 90;
      _v.project(game.camera);
      if (_v.z > 1) continue;
      const k = f.t / f.life;
      const pop = k < 0.12 ? 1 + (0.12 - k) * 5 : 1;
      const x = (_v.x * 0.5 + 0.5) * W + f.dx * S * k, y = (-_v.y * 0.5 + 0.5) * H;
      this.text(f.text, x, y, 30 * S * f.scale * pop, f.color, 'center', F_BIG, 400, 0.16, clamp((1 - k) * 2, 0, 1));
    }
    this.floaters = this.floaters.filter((f) => f.t < f.life);
  }
  drawEnemyBars(game, P) {
    const S = this.S, W = this.W, H = this.H, g = this.g;
    for (const E of game.enemies) {
      if (E.dead || E.isBoss || E.burrowed) continue;
      const d = E.pos.distanceTo(P.pos);
      if (!(E.sinceHit < 3 || (E.elite && d < 2500))) continue;
      _v.set(E.pos.x, E.pos.y - E.feetOffset + E.puppet.heightCm + 30, E.pos.z);
      _v.project(game.camera);
      if (_v.z > 1 || Math.abs(_v.x) > 1.1 || Math.abs(_v.y) > 1.1) continue;
      const sx = (_v.x * 0.5 + 0.5) * W, sy = (-_v.y * 0.5 + 0.5) * H;
      const k = clamp(1600 / Math.max(d, 1), 0.5, 1.4);
      const bw = 70 * k * S, bh = 7 * k * S;
      const acc = E.elite ? cssRGB(E.accent()) : '#d93326';
      g.fillStyle = 'rgba(0,0,0,0.65)'; g.fillRect(sx - bw / 2 - 2, sy - 2, bw + 4, bh + 4);
      g.fillStyle = acc; g.fillRect(sx - bw / 2, sy, bw * clamp(E.health / E.maxHealth, 0, 1), bh);
      if (E.shield > 0 && E.maxShield > 0) { g.fillStyle = 'rgba(90,165,255,0.95)'; g.fillRect(sx - bw / 2, sy - 4 * S, bw * (E.shield / E.maxShield), 3 * S); }
    }
  }
  drawHelp(game, W, H, S, dt) {
    this.helpT = (this.helpT || 0) + dt;
    if (game.round > 1 || this.helpT > 900 || game.player.menu) return;   // shown for the first round only
    const a = 1;
    const rows = [['WASD', 'move'], ['SPACE', 'jump'], ['SHIFT', 'dash'], ['C', 'slide'], ['F', (game.player.cls.ability || 'ability').toLowerCase()], ['R', 'reload'], ['G', 'ping'], ['\u2190 \u2192', 'radio'], ['Q', 'quick melee'], ['X', 'draw blade'], ['V', 'grenade'], ['E', 'use'], ['TAB', 'upgrades']];
    const x = 44 * S, rh = 34 * S, w = 300 * S;
    let y = H * 0.27;
    const tip = [];
    const h = rows.length * rh + 54 * S + tip.length * this.fs(15 * S) * 1.35 + 20 * S;
    this.g.globalAlpha = a; this.panel(x - 14 * S, y - 40 * S, w, h, 'rgba(255,205,90,0.55)', 'rgba(20,10,16,0.7)', 12 * S); this.g.globalAlpha = 1;
    this.text('CONTROLS', x + 4 * S, y - 6 * S, 24 * S, GOLD, 'left', F_BIG, 400, 0.1, a);
    y += 26 * S;
    for (const [k, d] of rows) {
      const kw = this.key(k, x + 4 * S, y, 26 * S, BONE, a);
      this.text(d, x + 4 * S + Math.max(kw, 74 * S) + 12 * S, y + 7 * S, 18 * S, `rgba(242,232,213,${0.92 * a})`, 'left', F_TXT, 600, 0.12);
      y += rh;
    }
    for (const l of tip) { this.text(l, x + 4 * S, y + 4 * S, 15 * S, `rgba(255,205,90,${0.85 * a})`, 'left', F_TXT, 600, 0.1); y += this.fs(15 * S) * 1.35; }
  }
  drawBanners(dt, W, H, S, hideSmall = false) {
    if (this.roundBanner) {
      const b = this.roundBanner; b.t += dt;
      const k = b.t / b.life;
      const a = k < 0.1 ? k / 0.1 : k > 0.75 ? (1 - k) / 0.25 : 1;
      const sc = 1 + Math.max(0, 0.15 - k) * 3;
      const g = this.g;
      g.save(); g.translate(W / 2, Math.max(H * 0.36, (this.cardsBottom || 0) + 150 * S)); g.scale(sc, sc);
      this.text(b.text, 0, 0, 120 * S, '#c8211b', 'center', F_BIG, 400, 0.08, a);
      g.restore();
      if (b.t > b.life) this.roundBanner = null;
    }
    let y = Math.max(H * 0.22, (this.cardsBottom || 0) + 44 * S);
    for (const b of this.banners) {
      b.t += dt;
      if (hideSmall) continue;
      const k = b.t / b.life;
      const a = k < 0.08 ? k / 0.08 : k > 0.8 ? (1 - k) / 0.2 : 1;
      const size = 38 * S;
      this.g.font = `${Math.round(size)}px ${F_BIG}`;
      const tw = this.g.measureText(b.text).width;
      this.g.globalAlpha = a * 0.75;
      this.g.fillStyle = 'rgba(14,8,12,0.75)'; this.g.fillRect(W / 2 - tw / 2 - 30 * S, y - size * 1.05, tw + 60 * S, size * 1.45);
      this.g.fillStyle = b.color; this.g.fillRect(W / 2 - tw / 2 - 30 * S, y + size * 0.36, tw + 60 * S, 3 * S);
      this.g.globalAlpha = 1;
      this.text(b.text, W / 2, y, size, b.color, 'center', F_BIG, 400, 0.1, a);
      y += size * 1.7;
    }
    this.banners = this.banners.filter((b) => b.t < b.life);
  }
  drawToasts(dt, W, H, S) {
    let y = H * 0.36;
    const g = this.g;
    for (const t of this.toasts) {
      t.t += dt;
      const a = t.t < 0.15 ? t.t / 0.15 : t.t > t.life - 0.5 ? (t.life - t.t) / 0.5 : 1;
      const slide = (1 - Math.min(1, t.t / 0.15)) * 40 * S;
      const size = 21 * S, tw = this.measure(t.text, size, F_TXT, 700);
      const x = W - 44 * S + slide;
      g.globalAlpha = clamp(a, 0, 1) * 0.8;
      g.fillStyle = 'rgba(14,8,12,0.75)'; g.fillRect(x - tw - 18 * S, y - this.fs(size) * 0.95, tw + 30 * S, this.fs(size) * 1.35);
      g.fillStyle = t.color; g.fillRect(x + 8 * S, y - this.fs(size) * 0.95, 4 * S, this.fs(size) * 1.35);
      g.globalAlpha = 1;
      this.text(t.text, x, y, size, t.color, 'right', F_TXT, 700, 0.12, clamp(a, 0, 1));
      y += this.fs(size) * 1.6;
    }
    this.toasts = this.toasts.filter((t) => t.t < t.life);
  }
  // lay out one menu entry at width iw; returns { h, draw(x, y) }
  menuItem(it, iw, S, P) {
    const g = this.g;
    if (it.kind === 'info') {
      const L = this.wrap(it.text, iw, 20 * S);
      const lh = this.fs(20 * S) * 1.35;
      return { h: L.length * lh + 8 * S, draw: (x, y) => { L.forEach((l, i) => this.text(l, x, y + (i + 0.8) * lh, 20 * S, toCss(it.color), 'left', F_TXT, 600, 0.08)); } };
    }
    if (it.kind === 'result') {
      const h = 60 * S;
      return { h: h + 12 * S, draw: (x, y) => {
        this.rrect(x, y, iw, h, 8 * S); g.fillStyle = 'rgba(0,0,0,0.4)'; g.fill(); g.lineWidth = 2 * S; g.strokeStyle = toCss(it.color); g.globalAlpha = 0.6; g.stroke(); g.globalAlpha = 1;
        let size = 34 * S; const tw = this.measure(it.text, size, F_BIG); if (tw > iw - 30 * S) size *= (iw - 30 * S) / tw;
        this.text(it.text, x + iw / 2, y + h / 2 + this.fs(size) * 0.36, size, toCss(it.color), 'center', F_BIG, 400, 0.1);
      } };
    }
    if (it.kind === 'wheel') {
      const R = 150 * S;
      return { h: R * 2 + 44 * S, draw: (x, y) => {
        const M = P.menu, n = M.wheel.length, cx = x + iw / 2, cy = y + R + 26 * S, a = Math.PI * 2 / n;
        g.beginPath(); g.arc(cx, cy, R + 8 * S, 0, Math.PI * 2); g.fillStyle = GOLD; g.fill();
        for (let i = 0; i < n; i++) {
          // wedge i sits under the pointer (straight up) when M.ang is inside [i*a, (i+1)*a)
          const a0 = -Math.PI / 2 + i * a - M.ang, w = M.wheel[i];
          g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a0, a0 + a); g.closePath();
          g.fillStyle = w < 0 ? '#3a0c12' : i % 2 ? '#2a1a22' : '#1c1218'; g.fill();
          g.save(); g.translate(cx, cy); g.rotate(a0 + a / 2);
          g.fillStyle = w < 0 ? '#ff4d40' : RARITY_HEX[WD(w).rarity]; g.fillRect(R - 12 * S, -R * Math.tan(a / 2) * 0.86, 12 * S, R * Math.tan(a / 2) * 1.72);
          const nm = w < 0 ? 'BUST' : WD(w).name.toUpperCase(); let fs = 17 * S; const tw = this.measure(nm, fs, F_BIG); if (tw > R * 0.62) fs *= (R * 0.62) / tw;
          this.text(nm, R * 0.9 - 14 * S, this.fs(fs) * 0.35, fs, w < 0 ? '#ff4d40' : RARITY_HEX[WD(w).rarity], 'right', F_BIG, 400, 0);
          g.restore();
        }
        g.beginPath(); g.arc(cx, cy, 16 * S, 0, Math.PI * 2); g.fillStyle = GOLD; g.fill();
        g.beginPath(); g.moveTo(cx, cy - R + 22 * S); g.lineTo(cx - 14 * S, cy - R - 12 * S); g.lineTo(cx + 14 * S, cy - R - 12 * S); g.closePath(); g.fillStyle = BONE; g.fill(); g.lineWidth = 3 * S; g.strokeStyle = INK; g.stroke();
      } };
    }
    if (it.kind === 'cards') {
      const ch = 104 * S, cw = 74 * S;
      return { h: ch + 44 * S, draw: (x, y) => {
        this.text(it.label, x, y + 22 * S, 18 * S, 'rgba(242,232,213,0.8)', 'left', F_TXT, 700, 0.08);
        it.cards.forEach((c, i) => this.playingCard(c, x + i * (cw + 10 * S), y + 32 * S, cw, ch, i === it.hide));
      } };
    }
    if (it.kind === 'stats') {
      return { h: 58 * S, draw: (x, y) => {
        const cw = iw / it.items.length;
        it.items.forEach(([k, v], i) => {
          this.text(k, x + i * cw, y + 18 * S, 14 * S, 'rgba(242,232,213,0.6)', 'left', F_TXT, 700, 0.08);
          this.text(v, x + i * cw, y + 48 * S, 30 * S, BONE, 'left', F_BIG, 400, 0.1);
        });
      } };
    }
    if (it.kind === 'pay') {
      const cols = 2, rh = this.fs(19 * S) * 1.55, rows = Math.ceil(it.rows.length / cols);
      return { h: rows * rh + 46 * S, draw: (x, y) => {
        this.text('PAYTABLE', x, y + 24 * S, 15 * S, 'rgba(255,205,90,0.85)', 'left', F_TXT, 700, 0.08);
        g.fillStyle = 'rgba(255,205,90,0.3)'; g.fillRect(x + 80 * S, y + 18 * S, iw - 80 * S, 2 * S);
        const cw = iw / cols;
        it.rows.forEach(([a, b, c], i) => {
          const cx = x + (i % cols) * cw, cy = y + 38 * S + Math.floor(i / cols) * rh + rh * 0.62;
          this.text(a, cx, cy, 19 * S, BONE, 'left', F_TXT, 700, 0.08);
          this.text(b, cx + cw - 30 * S, cy, 19 * S, c, 'right', F_TXT, 700, 0.08);
          g.fillStyle = 'rgba(242,232,213,0.12)'; g.fillRect(cx, cy + 8 * S, cw - 30 * S, 1);
        });
      } };
    }
    // option card
    const kh = 40 * S, nameSize = 28 * S, descSize = 18 * S, priceSize = 32 * S;
    const priceStr = it.price !== undefined ? `$${cash(it.price)}` : '';
    const pw = priceStr ? this.measure(priceStr, priceSize, F_BIG) + 30 * S : 0;
    const ic = it.icon ? 58 * S : 0;
    const left = 24 * S + kh * 1.6 + (ic ? ic + 8 * S : 0);
    const descL = it.desc ? this.wrap(it.desc + (it.note ? `  (${it.note})` : ''), iw - left - pw - 20 * S, descSize) : [];
    const dlh = this.fs(descSize) * 1.32;
    // the build bar: pips for what you hold, one more for this buff, and in plain words what that does
    const B = it.build, bSize = 15 * S, blh = this.fs(bSize) * 1.35; let bLines = [];
    if (B) {
      const head = !B.target ? `${B.name}: fully awake` : B.wakes ? `WAKES ${B.name} ${B.rankName}` : B.owned ? `${B.name}  ${B.n + 1} of ${B.target}` : `Starts ${B.name}  (1 of ${B.target})`;
      bLines.push({ head, pips: B.target ? [B.n, B.target] : null });
      if (B.power) for (const l of this.wrap((B.wakes ? '' : `At ${B.target}: `) + B.power, iw - left - pw - 30 * S, bSize)) bLines.push({ text: l, bright: B.wakes });
      for (const c of B.combos) for (const l of this.wrap('+ ' + c, iw - left - pw - 30 * S, bSize)) bLines.push({ text: l, combo: true });
    }
    const bh = bLines.length ? bLines.length * blh + 14 * S : 0;
    const h = Math.max(ic ? 74 * S : 62 * S, 50 * S + descL.length * dlh + (descL.length ? 6 * S : 0)) + bh;
    return { h: h + 10 * S, draw: (x, y) => {
      const afford = it.price === undefined || P.money >= it.price;
      const a = it.disabled ? 0.45 : 1;
      g.globalAlpha = a;
      this.rrect(x, y, iw, h, 8 * S); g.fillStyle = 'rgba(255,255,255,0.05)'; g.fill();
      g.fillStyle = toCss(it.tagColor || it.color); g.fillRect(x, y + 8 * S, 4 * S, h - 16 * S);
      g.globalAlpha = 1;
      this.key(it.key, x + 18 * S, y + (ic ? h / 2 : 31 * S), kh, it.disabled ? 'rgba(242,232,213,0.5)' : BONE, a);
      if (ic) this.icon(it.icon, x + 24 * S + kh * 1.45 + ic / 2, y + h / 2, ic, a);
      const nw = this.text(it.name, x + left, y + 40 * S, nameSize, toCss(it.color), 'left', F_BIG, 400, 0.1, a);
      let tgx = x + left + nw + 14 * S;
      if (it.suit) { this.suit(SUITS.indexOf(it.suit), tgx + 9 * S, y + 30 * S, 10 * S, SUIT_HEX[it.suit]); tgx += 26 * S; }
      if (it.tag) this.chip(it.tag, tgx, y + 30 * S, 14 * S, toCss(it.tagColor || it.color));
      descL.forEach((l, i) => this.text(l, x + left, y + 50 * S + (i + 0.8) * dlh, descSize, '#cdc3b2', 'left', F_TXT, 600, 0.06, a));
      if (bLines.length) {
        let by = y + h - bh + 4 * S; const bx = x + left;
        g.fillStyle = B.hex; g.globalAlpha = B.wakes ? 0.22 : B.owned ? 0.12 : 0.05; this.rrect(bx - 10 * S, by - 2 * S, iw - left - pw - 4 * S, bh - 6 * S, 6 * S); g.fill(); g.globalAlpha = 1;
        g.fillStyle = B.hex; g.fillRect(bx - 10 * S, by - 2 * S, 3 * S, bh - 6 * S);
        for (const L of bLines) {
          const ty = by + blh * 0.78;
          if (L.head) {
            const tw = this.text(L.head, bx, ty, bSize, B.hex, 'left', F_TXT, 800, 0.06);
            if (L.pips) { let px = bx + tw + 14 * S; const r = 5 * S; for (let k = 0; k < L.pips[1]; k++) { g.beginPath(); g.arc(px + r, ty - r * 0.9, r, 0, Math.PI * 2); if (k < L.pips[0]) { g.fillStyle = B.hex; g.fill(); } else if (k === L.pips[0]) { g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 2 * S; g.strokeStyle = B.hex; g.stroke(); } else { g.lineWidth = 1.5 * S; g.strokeStyle = 'rgba(255,255,255,0.3)'; g.stroke(); } px += r * 2 + 5 * S; } if (B.owned && !B.wakes) this.text('in your build', px + 8 * S, ty, 13 * S, '#d9cfbd', 'left', F_TXT, 500); }
          } else this.text(L.text, bx, ty, bSize, L.combo ? '#ffffff' : L.bright ? '#fff4d0' : '#b5ab9a', 'left', F_TXT, L.combo || L.bright ? 700 : 500, 0.06);
          by += blh;
        }
      }
      if (priceStr) this.text(priceStr, x + iw - 18 * S, y + h / 2 + this.fs(priceSize) * 0.36, priceSize, afford ? GOLD : '#c0463c', 'right', F_BIG, 400, 0.1, a);
    } };
  }
  drawMenu(game, P, W, H, S) {
    const M = P.menuText(); if (!M) return;
    const g = this.g;
    const w = Math.min(900 * S, W - 40 * S), x = (W - w) / 2, pad = 36 * S, iw = w - pad * 2;
    const reels = P.menu.type === 'Slots';
    const items = (M.showHelp ? M.help : M.lines).map((it) => this.menuItem(it, iw, S, P));
    const headH = 88 * S;
    const showReels = reels && !M.showHelp;
    const h = headH + 22 * S + (showReels ? 178 * S : 0) + items.reduce((a, i) => a + i.h, 0) + 66 * S;
    const y = Math.max(16 * S, (H - h) / 2 - 20 * S);
    g.fillStyle = 'rgba(8,4,8,0.4)'; g.fillRect(0, 0, W, H);
    this.panel(x, y, w, h, GOLD, 'rgba(20,10,16,0.95)', 18 * S);
    const grd = g.createLinearGradient(0, y, 0, y + headH);
    grd.addColorStop(0, 'rgba(200,33,27,0.55)'); grd.addColorStop(1, 'rgba(120,14,20,0.35)');
    this.panel(x + 4 * S, y + 4 * S, w - 8 * S, headH - 4 * S, null, grd, 15 * S);
    g.fillStyle = GOLD; g.fillRect(x + 4 * S, y + headH, w - 8 * S, 2 * S);
    const tw = this.text(M.title, x + pad, y + headH * 0.72, 52 * S, GOLD, 'left', F_BIG, 400, 0.08);
    // "?" badge: opens the explanation for this station
    const qx = x + pad + tw + 30 * S, qy = y + headH * 0.5, qr = Math.max(17 * S, this.fs(0) * 0.9);
    g.beginPath(); g.arc(qx, qy, qr, 0, Math.PI * 2); g.fillStyle = M.showHelp ? GOLD : 'rgba(0,0,0,0.45)'; g.fill(); g.lineWidth = 2 * S; g.strokeStyle = GOLD; g.stroke();
    this.text('?', qx, qy + qr * 0.42, qr * 1.25, M.showHelp ? INK : GOLD, 'center', F_BIG, 400, 0);
    this.chip(`$${Math.floor(P.money / 10).toLocaleString()}`, x + w - pad, y + headH * 0.5, 18 * S, GOLD, 'rgba(0,0,0,0.45)', 'right');
    let cy = y + headH + 22 * S;
    if (showReels) { this.drawReels(P, W / 2, cy + 80 * S, S); cy += 178 * S; }
    for (const it of items) { it.draw(x + pad, cy); cy += it.h; }
    g.fillStyle = 'rgba(255,205,90,0.25)'; g.fillRect(x + pad, y + h - 58 * S, iw, 1.5 * S);
    const foot = M.showHelp ? '[?] Back' : `${M.footer}${M.footer ? '   ' : ''}[?] Info`;
    this.hints(foot, W / 2, y + h - 30 * S, 19 * S, 'center');
  }
  drawReels(P, cx, cy, S) {
    const M = P.menu, g = this.g;
    const sym = ['CHERRY', 'BELL', 'BAR', '7', 'CROWN', 'CLOVER', 'SKULL'];
    const cols = ['#d8202e', '#c98a10', '#1d1418', '#d8202e', '#c07a10', '#2e9a3a', '#3a3036'];
    const rw = 164 * S, rh = 132 * S, gap = 18 * S;
    const total = rw * 3 + gap * 2;
    // cabinet bezel
    this.rrect(cx - total / 2 - 18 * S, cy - rh / 2 - 16 * S, total + 36 * S, rh + 32 * S, 14 * S);
    g.fillStyle = '#2a0c12'; g.fill(); g.lineWidth = 3 * S; g.strokeStyle = GOLD; g.stroke();
    for (let i = 0; i < 3; i++) {
      const x = cx + (i - 1) * (rw + gap) - rw / 2, y = cy - rh / 2;
      let s, nextS = 0, spinning = false, off = 0;
      if (M.stage === 0) s = (Math.floor(this.time * 0.5) + i * 2) % 7;
      else if (M.stage === 1) { const r = P.slotReel(i); s = r.sym; nextS = r.next; spinning = r.spinning; off = -r.frac * rh; }
      else s = M.reels[i];
      g.save(); g.beginPath(); g.rect(x, y, rw, rh); g.clip();
      g.fillStyle = '#f4ecdc'; g.fillRect(x, y, rw, rh);
      const drawSym = (k, oy) => {
        if (k === 5) this.icon('I_Clover', x + rw / 2, cy + oy, 82 * S);
        else if (k === 6) this.icon('I_Skull', x + rw / 2, cy + oy, 82 * S);
        else {
          let size = (k === 3 ? 96 : 50) * S; const tw = this.measure(sym[k], size, F_BIG); if (tw > rw - 24 * S) size *= (rw - 24 * S) / tw;
          this.text(sym[k], x + rw / 2, cy + oy + this.fs(size) * 0.36, size, cols[k], 'center', F_BIG, 400, 0);
        }
      };
      drawSym(s, off);
      if (spinning) drawSym(nextS, off + rh);
      // drum shading: dark at the top and bottom edges
      const sh = g.createLinearGradient(0, y, 0, y + rh);
      sh.addColorStop(0, 'rgba(40,20,20,0.55)'); sh.addColorStop(0.22, 'rgba(40,20,20,0)'); sh.addColorStop(0.78, 'rgba(40,20,20,0)'); sh.addColorStop(1, 'rgba(40,20,20,0.55)');
      g.fillStyle = sh; g.fillRect(x, y, rw, rh);
      g.restore();
      g.lineWidth = 3 * S; g.strokeStyle = INK; g.strokeRect(x, y, rw, rh);
    }
    // payline
    g.fillStyle = 'rgba(200,33,27,0.85)';
    g.fillRect(cx - total / 2 - 18 * S, cy - 1.5 * S, 14 * S, 3 * S); g.fillRect(cx + total / 2 + 4 * S, cy - 1.5 * S, 14 * S, 3 * S);
  }
  drawInventory(game, P, W, H, S) {
    const g = this.g;
    const wAll = Math.min(1640 * S, W - 40 * S), xAll = (W - wAll) / 2, y = 90 * S, h = H - 200 * S, pad = 30 * S, lw = 400 * S;
    g.fillStyle = 'rgba(8,4,8,0.4)'; g.fillRect(0, 0, W, H);
    this.panel(xAll, y, wAll, h, GOLD, 'rgba(20,10,16,0.95)', 18 * S);
    // left column: who you are and what you are carrying
    { const lx = xAll + pad, rx = lx + lw - 20 * S; let ly = y + 62 * S;
      this.text(P.cls.name.toUpperCase(), lx, ly, 40 * S, GOLD, 'left', F_BIG, 400, 0.08); ly += 22 * S;
      g.fillStyle = GOLD; g.fillRect(lx, ly, lw - 20 * S, 2 * S); ly += 30 * S;
      const pc = (v) => `${v >= 0 ? '+' : ''}${Math.round(v * 100)}%`, st = (n) => P.stat(n);
      const rows = [['Health', `${Math.ceil(P.health)} / ${Math.round(P.maxHealth)}`], ['Move speed', `${Math.round(P.maxWalk)}`], ['Damage', pc(st('Damage'))], ['Fire rate', pc(st('FireRate'))], ['Reload speed', pc(st('ReloadSpeed'))],
        ['Crit chance', pc(st('CritChance'))], ['Crit damage', pc(st('CritDamage'))], ['Headshot damage', pc(st('HeadshotDamage'))], ['Armor', pc(st('Armor'))], ['Health regen', `${(+st('HealthRegen')).toFixed(1)} /s`], ['Money gain', pc(st('MoneyGain'))], ['Luck', `${Math.round(P.luck)}`]];
      for (const [k, v] of rows) { this.text(k, lx, ly, 17 * S, 'rgba(242,232,213,0.7)', 'left', F_TXT, 600, 0.04); this.text(v, rx, ly, 18 * S, BONE, 'right', F_TXT, 700, 0.04); ly += 25 * S; }
      ly += 22 * S; this.text('WEAPONS', lx, ly, 28 * S, GOLD, 'left', F_BIG, 400, 0.08); ly += 12 * S; g.fillStyle = GOLD; g.fillRect(lx, ly, lw - 20 * S, 2 * S); ly += 32 * S;
      P.weapons.forEach((Sl, i) => {
        if (Sl.def < 0) return; const Wd = DATA.weapons[Sl.def], col = RARITY_HEX[Wd.rarity];
        this.text(`${i + 1}`, lx, ly, 16 * S, 'rgba(242,232,213,0.5)', 'left', F_TXT, 700); this.text(Wd.name.toUpperCase(), lx + 22 * S, ly, 22 * S, col, 'left', F_BIG, 400, 0.08);
        { const t = Math.min(3, Sl.tier), ew = t < 3 ? this.text('\u2605'.repeat(3 - t), rx, ly, 16 * S, 'rgba(242,232,213,0.18)', 'right', F_TXT, 700) : 0, fw = t ? this.text('\u2605'.repeat(t), rx - ew, ly, 16 * S, GOLD, 'right', F_TXT, 700) : 0; this.text(Wd.cls, rx - ew - fw - 8 * S, ly, 15 * S, 'rgba(242,232,213,0.75)', 'right', F_TXT, 700, 0.06); } ly += 22 * S;
        if (!Sl.mods.length) { this.text('No workbench upgrades', lx + 22 * S, ly, 14 * S, 'rgba(242,232,213,0.4)', 'left', F_TXT, 600); ly += 20 * S; }
        for (const u of Sl.mods) { const U = DATA.upgrades[u]; this.text(U.name, lx + 22 * S, ly, 15 * S, RARITY_HEX[U.rarity], 'left', F_TXT, 700, 0.06); ly += 18 * S; for (const l of this.wrap(U.desc, lw - 46 * S, 13 * S).slice(0, 2)) { this.text(l, lx + 22 * S, ly, 13 * S, '#b5ab9a', 'left', F_TXT, 600); ly += 16 * S; } ly += 2 * S; }
        ly += 12 * S;
      });
      { const Md = MELEE[P.meleeDef || 0]; this.text('Q', lx, ly, 16 * S, 'rgba(242,232,213,0.5)', 'left', F_TXT, 700); this.text(Md.name.toUpperCase(), lx + 22 * S, ly, 22 * S, RARITY_HEX[Md.rarity] || BONE, 'left', F_BIG, 400, 0.08); this.text(P.meleeTier > 0 ? `Honed x${P.meleeTier}` : 'Blade', rx, ly, 15 * S, 'rgba(242,232,213,0.75)', 'right', F_TXT, 700, 0.06); }
      g.fillStyle = 'rgba(214,170,80,0.35)'; g.fillRect(lx + lw - 2 * S, y + 24 * S, 2 * S, h - 80 * S);
    }
    const x = xAll + lw + 14 * S, w = wAll - lw - 14 * S;
    this.text('UPGRADES', x + pad, y + 62 * S, 52 * S, GOLD, 'left', F_BIG, 400, 0.08);
    let cx = x + w - pad;
    for (const [lab, val, col] of [['POWER', Math.round(P.power()), BONE], ['HEADSHOTS', P.headshots, BONE], ['KILLS', P.kills, BONE]]) {
      const vw = this.text(`${val}`, cx, y + 60 * S, 30 * S, col, 'right', F_BIG, 400, 0.1);
      const lw = this.text(lab, cx, y + 26 * S, 13 * S, 'rgba(242,232,213,0.6)', 'right', F_TXT, 700, 0.06);
      cx -= Math.max(vw, lw) + 40 * S;
    }
    g.fillStyle = GOLD; g.fillRect(x + pad, y + 84 * S, w - pad * 2, 2 * S);
    // suit sets: count toward the next bonus at 3 / 6 / 9
    { let sx = x + pad; const sy = y + 110 * S;
      SUITS.forEach((k, i) => {
        const n = (P.suitCounts || {})[k] || 0, t = (P.suitTiers || {})[k] || 0;
        this.suit(i, sx + 11 * S, sy, 12 * S, SUIT_HEX[k]);
        const tw = this.text(`${n}/${Math.min(9, (t + 1) * 3)}  ${SUIT_BONUS[k]}${t > 1 ? ' x' + t : ''}`, sx + 30 * S, sy + 7 * S, 16 * S, t > 0 ? SUIT_HEX[k] : 'rgba(242,232,213,0.55)', 'left', F_TXT, 700, 0.08);
        sx += tw + 62 * S;
      }); }
    const list = P.upgradeOrder;
    if (!list.length) this.text('None yet.', x + pad, y + 130 * S, 20 * S, '#bdb3a2', 'left', F_TXT, 600);
    const top = y + 136 * S, bottom = y + h - 56 * S;
    let cols = 3, cardH = 74 * S;
    const rows = () => Math.ceil(list.length / cols);
    while (rows() * (cardH + 10 * S) > bottom - top && cols < 5) cols++;
    if (rows() * (cardH + 10 * S) > bottom - top) cardH = (bottom - top) / rows() - 10 * S;
    const cw = (w - pad * 2 - (cols - 1) * 12 * S) / cols;
    list.forEach((u, i) => {
      const U = DATA.upgrades[u], col = RARITY_HEX[U.rarity];
      const bx = x + pad + (i % cols) * (cw + 12 * S), by = top + Math.floor(i / cols) * (cardH + 10 * S);
      this.rrect(bx, by, cw, cardH, 8 * S); g.fillStyle = 'rgba(255,255,255,0.05)'; g.fill();
      g.fillStyle = col; g.fillRect(bx, by + 6 * S, 4 * S, cardH - 12 * S);
      const ns = cols > 3 ? 19 * S : 21 * S;
      const isz = Math.min(cardH - 14 * S, 56 * S); this.icon(`U_${u}`, bx + 12 * S + isz / 2, by + cardH / 2, isz);
      const tx0 = bx + 20 * S + isz;
      this.suit(SUITS.indexOf(U.suit), bx + cw - 16 * S, by + 16 * S, 8 * S, SUIT_HEX[U.suit]);
      const nw = this.text(U.name, tx0, by + 28 * S, ns, col, 'left', F_TXT, 700, 0.1);
      if (P.upgradeStacks[u] > 1) this.chip(`x${P.upgradeStacks[u]}`, tx0 + 8 * S + nw, by + 21 * S, 14 * S, col);
      const dl = this.wrap(U.desc, cw - 34 * S - isz, 16 * S);
      const lh = this.fs(16 * S) * 1.25, maxL = Math.max(1, Math.floor((cardH - 36 * S) / lh));
      dl.slice(0, maxL).forEach((l, k) => this.text(k === maxL - 1 && dl.length > maxL ? l + '...' : l, tx0, by + 34 * S + (k + 0.85) * lh, 16 * S, '#c9bfae', 'left', F_TXT, 600, 0.05));
    });
    this.hints('[Tab] Close', W / 2, y + h - 28 * S, 18 * S);
  }
  drawDeath(game, P, W, H, S) {
    const g = this.g;
    const t = game.time - (game.deathTime || game.time);
    g.fillStyle = `rgba(30,4,8,${clamp(t * 0.6, 0, 0.78)})`; g.fillRect(0, 0, W, H);
    if (t < 0.8) return;
    const a = clamp((t - 0.8) * 2, 0, 1);
    const cy = H * 0.38;
    this.text(game.coopDown ? 'YOU ARE DOWN' : 'YOU DIED', W / 2, cy, 140 * S, '#d0241d', 'center', F_BIG, 400, 0.06, a);
    if (P.downed) {
      const y = H * 0.86, w = 360 * S;
      this.text(P.reviveP > 0.02 ? 'A TEAMMATE IS GETTING YOU UP' : `BLEEDING OUT  ${Math.ceil(P.bleed)}`, W / 2, y, 30 * S, P.reviveP > 0.02 ? '#7fe0ff' : '#ff8a80', 'center', F_BIG, 400, 0.08);
      g.fillStyle = 'rgba(10,6,10,0.7)'; g.fillRect(W / 2 - w / 2, y + 16 * S, w, 12 * S);
      g.fillStyle = P.reviveP > 0.02 ? '#7fe0ff' : '#d0241d'; g.fillRect(W / 2 - w / 2, y + 16 * S, w * (P.reviveP > 0.02 ? P.reviveP : clamp(P.bleed / 30, 0, 1)), 12 * S);
    }
      // what did the damage this run, and what landed in the last few seconds
    { const R = P.damageReport().slice(0, 6), x = 40 * S; let y = H * 0.2;
      if (R.length && a > 0.5) {
        this.text('DAMAGE TAKEN THIS RUN', x, y, 20 * S, GOLD, 'left', F_BIG, 400, 0.1); y += 30 * S;
        for (const r of R) { this.text(`${r.pct}%`, x + 50 * S, y, 19 * S, BONE, 'right', F_TXT, 700); this.text(`${r.who}  -  ${r.total} over ${r.hits} hit${r.hits > 1 ? 's' : ''}, biggest ${r.max}`, x + 62 * S, y, 19 * S, 'rgba(242,232,213,0.85)', 'left', F_TXT, 600); y += 26 * S; }
        y += 16 * S; this.text('LAST 8 SECONDS', x, y, 20 * S, '#ff5a4d', 'left', F_BIG, 400, 0.1); y += 30 * S;
        const last = (P.dmgRecent || []).filter((d) => game.deathTime - d.t < 8).slice(-7);
        for (const d of last) { this.text(`-${Math.round(d.dmg)}`, x + 50 * S, y, 19 * S, '#ff8a80', 'right', F_TXT, 700); this.text(`${d.who}   ${(game.deathTime - d.t).toFixed(1)}s before`, x + 62 * S, y, 19 * S, 'rgba(242,232,213,0.85)', 'left', F_TXT, 600); y += 26 * S; }
      } }
    const survived = Math.max(0, game.round - 1);
        const stats = [['ROUND', game.round], ['KILLS', P.kills], ['HEADSHOTS', P.headshots], ['UPGRADES', P.upgradeOrder.length], ['PURSE', `$${cash(P.money)}`]];
    const cw = 170 * S, total = cw * stats.length, x0 = W / 2 - total / 2;
    g.globalAlpha = a; this.panel(x0 - 20 * S, cy + 96 * S, total + 40 * S, 110 * S, 'rgba(255,205,90,0.7)', 'rgba(20,10,16,0.8)', 12 * S); g.globalAlpha = 1;
    stats.forEach(([k, v], i) => {
      const sx = x0 + cw * (i + 0.5);
      this.text(k, sx, cy + 132 * S, 15 * S, 'rgba(242,232,213,0.65)', 'center', F_TXT, 700, 0.06, a);
      this.text(`${v}`, sx, cy + 182 * S, 40 * S, i === 5 ? GOLD : BONE, 'center', F_BIG, 400, 0.1, a);
    });
    this.drawRenown(W, S, cy + 250 * S, a);
    if (t > 2) {
      g.globalAlpha = 0.6 + 0.4 * Math.sin(this.time * 4);
      this.hints('[Enter] Restart', W / 2, cy + 388 * S, 24 * S);
      g.globalAlpha = 1;
    }
  }
  // what the run was worth: renown earned, where that leaves your rank, and anything it unlocked
  drawRenown(W, S, y, a = 1) {
    const g = this.g, R = Meta.runSummary(), I = R.info, bw = 520 * S, x0 = W / 2 - bw / 2;
    const up = I.rank > R.rank0;
    this.text(`RENOWN  +${R.xp.toLocaleString()}`, W / 2, y, 30 * S, GOLD, 'center', F_BIG, 400, 0.1, a);
    this.text(`RANK ${I.rank}  -  ${I.name.toUpperCase()}`, x0, y + 34 * S, 19 * S, up ? '#7dff8a' : BONE, 'left', F_BIG, 400, 0.1, a);
    this.text(I.max ? 'TOP RANK' : `${I.into.toLocaleString()} / ${I.span.toLocaleString()}`, x0 + bw, y + 34 * S, 17 * S, 'rgba(242,232,213,0.75)', 'right', F_TXT, 700, 0.1, a);
    g.globalAlpha = a; g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x0, y + 44 * S, bw, 10 * S); g.fillStyle = up ? '#7dff8a' : '#ffcd5a'; g.fillRect(x0, y + 44 * S, bw * (I.max ? 1 : clamp(I.into / Math.max(1, I.span), 0, 1)), 10 * S); g.globalAlpha = 1;
    let line = '';
    if (R.unlocked.length) { const show = R.unlocked.slice(0, 3).join('   |   '); line = `Earned: ${show}${R.unlocked.length > 3 ? `   +${R.unlocked.length - 3} more` : ''}`; }
    else if (I.next) line = `Next rank: ${I.next.name}${I.next.reward ? '  -  ' + I.next.reward : ''}`;
    if (line) this.text(line, W / 2, y + 82 * S, 18 * S, R.unlocked.length ? '#7dff8a' : 'rgba(242,232,213,0.7)', 'center', F_TXT, 700, 0.1, a);
  }
  drawVictory(game, P, W, H, S) {
    const g = this.g;
    g.fillStyle = 'rgba(20,10,4,0.78)'; g.fillRect(0, 0, W, H);
    const cy = H * 0.36;
    this.text('LEVEL COMPLETE', W / 2, cy, 140 * S, GOLD, 'center', F_BIG, 400, 0.06);
    this.text(game.map.final.win, W / 2, cy + 56 * S, 28 * S, BONE, 'center', F_TXT, 700, 0.1);
    const stats = [['ROUND', game.round], ['KILLS', P.kills], ['HEADSHOTS', P.headshots], ['UPGRADES', P.upgradeOrder.length], ['PURSE', `$${cash(P.money)}`]];
    const cw = 170 * S, total = cw * stats.length, x0 = W / 2 - total / 2;
    this.panel(x0 - 20 * S, cy + 96 * S, total + 40 * S, 110 * S, GOLD, 'rgba(20,10,16,0.85)', 12 * S);
    stats.forEach(([k, v], i) => { const sx = x0 + cw * (i + 0.5); this.text(k, sx, cy + 132 * S, 15 * S, 'rgba(242,232,213,0.65)', 'center', F_TXT, 700, 0.06); this.text(`${v}`, sx, cy + 182 * S, 40 * S, i === 5 ? GOLD : BONE, 'center', F_BIG, 400, 0.1); });
    this.drawRenown(W, S, cy + 250 * S, 1);
    this.hints('[Enter] Back to the menu', W / 2, cy + 388 * S, 24 * S);
  }
  drawPaused(W, H, S) {
    const g = this.g;
    g.fillStyle = 'rgba(10,6,10,0.62)'; g.fillRect(0, 0, W, H);
    const cy = H * 0.36;
    this.text('PAUSED', W / 2, cy, 120 * S, GOLD, 'center', F_BIG, 400, 0.06);
    this.text('Click to resume', W / 2, cy + 52 * S, 26 * S, BONE, 'center', F_TXT, 700, 0.1);
    const rows = [['WASD', 'move'], ['SPACE', 'jump'], ['SHIFT', 'dash'], ['C', 'slide'], ['F', (game.player.cls.ability || 'ability').toLowerCase()], ['R', 'reload'], ['G', 'ping'], ['\u2190 \u2192', 'radio'], ['Q', 'quick melee'], ['X', 'draw blade'], ['V', 'grenade'], ['E', 'use'], ['1-3', 'guns'], ['4', 'blade'], ['TAB', 'upgrades'], ['[ ]', 'sensitivity'], ['F3', 'fps']];
    const cols = 3, cw = 300 * S, rh = 42 * S, x0 = W / 2 - (cols * cw) / 2, y0 = cy + 110 * S;
    this.panel(x0 - 24 * S, y0 - 36 * S, cols * cw + 48 * S, Math.ceil(rows.length / cols) * rh + 40 * S, 'rgba(255,205,90,0.7)', 'rgba(20,10,16,0.85)', 12 * S);
    rows.forEach(([k, d], i) => {
      const x = x0 + (i % cols) * cw, y = y0 + Math.floor(i / cols) * rh;
      const kw = this.key(k, x, y, 28 * S);
      this.text(d, x + Math.max(kw, 70 * S) + 12 * S, y + 7 * S, 19 * S, BONE, 'left', F_TXT, 600, 0.08);
    });
  }
}
