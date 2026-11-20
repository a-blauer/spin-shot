// Sulfur-style HUD drawn on a 2D canvas: chunky condensed type with dark outlines, bone-white and saloon-gold
// panels with clipped corners. Crosshair with spread/kick, hit markers, damage arcs, floating numbers,
// banners, toasts, boss bar, power-up timers, casino menus (with live slot reels), inventory and death card.
import * as THREE from 'three';
import { DATA, RARITY_HEX, SYMBOLS, luckMult, cssRGB, SUITS, SUIT_HEX, SUIT_BONUS } from './data.js';

import { MELEE, MELEE_CODE, isMelee } from './melee.js';
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
  gotUpgrade(i, stack) { this.cards = this.cards || []; this.cards.push({ i, stack, t: 0, life: 15 }); if (this.cards.length > 3) this.cards.shift(); }
  drawCards() {
    if (!this.cards || !this.cards.length) return;
    const g = this.g, S = this.S, W = this.W, w = 560 * S, x = W / 2 - w / 2; let y = this.H * 0.17;
    for (const c of this.cards) {
      c.t += 1 / 60;
      const U = DATA.upgrades[c.i], col = RARITY_HEX[U.rarity], a = Math.min(1, c.t * 6, (c.life - c.t) * 2.5), slide = (1 - Math.min(1, c.t * 6)) * 30 * S;
      g.font = `600 ${this.fs(19 * S)}px ${F_TXT}`;
      const words = U.desc.split(' '), lines = []; let ln = '';
      for (const wd of words) { const t = ln ? ln + ' ' + wd : wd; if (g.measureText(t).width > w - 118 * S && ln) { lines.push(ln); ln = wd; } else ln = t; }
      if (ln) lines.push(ln);
      const h = (58 + lines.length * 24) * S;
      g.globalAlpha = Math.max(0, a);
      g.fillStyle = 'rgba(20,10,16,0.92)'; g.fillRect(x, y - slide, w, h); g.fillStyle = col; g.fillRect(x, y - slide, 6 * S, h); g.fillRect(x, y - slide, w, 2 * S);
      this.icon('U_' + c.i, x + 20 * S, y - slide + h / 2 - 34 * S, 68 * S, Math.max(0, a));
      this.text(U.name.toUpperCase() + (c.stack > 1 ? `  x${c.stack}` : ''), x + 102 * S, y - slide + 32 * S, 27 * S, col, 'left', F_BIG, 400, 0.08, Math.max(0, a));
      this.text(U.rarity.toUpperCase(), x + w - 14 * S, y - slide + 28 * S, 14 * S, col, 'right', F_TXT, 700, 0.1, Math.max(0, a));
      lines.forEach((t, k) => this.text(t, x + 102 * S, y - slide + (56 + k * 24) * S, 19 * S, BONE, 'left', F_TXT, 600, 0.1, Math.max(0, a)));
      g.globalAlpha = 1;
      y += h + 10 * S;
    }
    this.cards = this.cards.filter((c) => c.t < c.life);
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
  hints(str, x, cy, size, align = 'center', alpha = 0.9) {
    const parts = str.split(/(\[[^\]]+\])/).map((t) => t.trim()).filter(Boolean);
    const H = this.fs(size) * 1.35, gap = size * 0.45;
    const widths = parts.map((t) => (t[0] === '[' ? Math.max(H, this.measure(t.slice(1, -1), H * 0.6, F_BIG) + H * 0.55) : this.measure(t, size, F_TXT, 700)));
    let total = 0; parts.forEach((t, i) => { total += widths[i] + (i < parts.length - 1 ? (t[0] === '[' ? gap : gap * 3.2) : 0); });
    let px = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    parts.forEach((t, i) => {
      if (t[0] === '[') px += this.key(t.slice(1, -1), px, cy, H, BONE, alpha) + gap;
      else { this.text(t, px, cy + this.fs(size) * 0.36, size, `rgba(242,232,213,${alpha})`, 'left', F_TXT, 700, 0.12); px += widths[i] + gap * 3.2; }
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
  // card suit drawn as a flat shape (never a font glyph): 0 spade, 1 heart, 2 diamond, 3 club
  suit(kind, cx, cy, r, col) {
    const g = this.g; g.fillStyle = col; g.beginPath();
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
    if (!P.inMenu()) this.drawCards();
    this.drawFloaters(game, dt);
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
    const len = 10 * S, a = 1 - ads * 0.85;
    g.globalAlpha = a;
    const tick = (x0, y0, x1, y1) => { g.strokeStyle = INK; g.lineWidth = 5 * S; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.strokeStyle = BONE; g.lineWidth = 2.4 * S; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
    const G2 = Math.max(gap, 5 * S);
    tick(cx - G2 - len, cy, cx - G2, cy); tick(cx + G2, cy, cx + G2 + len, cy); tick(cx, cy + G2, cx, cy + G2 + len);
    if (P.W.cls !== 'Shotgun') tick(cx, cy - G2 - len, cx, cy - G2);
    g.globalAlpha = 1;
    g.fillStyle = INK; g.fillRect(cx - 2.5 * S, cy - 2.5 * S, 5 * S, 5 * S); g.fillStyle = BONE; g.fillRect(cx - 1.4 * S, cy - 1.4 * S, 2.8 * S, 2.8 * S);
    if (P.reloading) {
      const f = 1 - P.reloadT / Math.max(P.reloadDur, 0.01);
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 5 * S; g.beginPath(); g.arc(cx, cy, 26 * S, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = GOLD; g.lineWidth = 3 * S; g.beginPath(); g.arc(cx, cy, 26 * S, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); g.stroke();
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
    // round chip
    const cx = 80 * S, cy = 104 * S, r = 62 * S;
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fillStyle = 'rgba(22,12,18,0.85)'; g.fill();
    g.lineWidth = 9 * S; g.strokeStyle = '#c8211b'; g.stroke();
    g.setLineDash([14 * S, 12 * S]); g.lineWidth = 9 * S; g.strokeStyle = BONE; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    g.lineWidth = 2 * S; g.strokeStyle = GOLD; g.beginPath(); g.arc(cx, cy, r - 9 * S, 0, Math.PI * 2); g.stroke();
  }
  drawVitals(game, P, W, H, S) {
    const x = 44 * S, y = H - 64 * S, w = 400 * S, h = 22 * S;
    const g = this.g;
    const low = P.health < P.maxHealth * 0.35;
    // money + luck
    const my = y - 92 * S;
    const ms = `$${P.money.toLocaleString()}`;
    const mw = this.text(ms, x, my, 60 * S, GOLD, 'left', F_BIG, 400, 0.12);
    let lx = x + mw + 18 * S;
    if (game.doublePoints > 0) lx += this.text('x2', lx - 8 * S, my - 30 * S, 28 * S, GOLD, 'left', F_BIG, 400, 0.12) + 6 * S;
    const lt = `${P.luck}`, ltw = this.measure(lt, 32 * S, F_BIG), lm = `LUCK  x${luckMult(P.luck).toFixed(1)}`, lmw = this.measure(lm, 15 * S, F_TXT, 700);
    const pw = 48 * S + ltw + 10 * S + lmw + 14 * S, lph = Math.max(44 * S, this.fs(15 * S) * 2.6);
    this.rrect(lx, my - 40 * S, pw, lph, 10 * S); g.fillStyle = 'rgba(12,30,14,0.75)'; g.fill(); g.lineWidth = 2 * S; g.strokeStyle = 'rgba(125,255,138,0.55)'; g.stroke();
    const mid = my - 40 * S + lph / 2;
    this.icon('I_Clover', lx + 24 * S, mid, 32 * S);
    this.text(lt, lx + 44 * S, mid + this.fs(32 * S) * 0.36, 32 * S, '#7dff8a', 'left', F_BIG, 400, 0.12);
    this.text(lm, lx + 54 * S + ltw, mid + this.fs(15 * S) * 0.36, 15 * S, 'rgba(125,255,138,0.9)', 'left', F_TXT, 700, 0.1);
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
    group('HOOK', 1, () => {
      const gr = P.grappleCd > 0 ? 1 - P.grappleCd / P.grappleCooldown() : 1;
      g.fillStyle = INK; g.fillRect(px - 2 * S, py - 2 * S, 58 * S, ph + 4 * S);
      g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(px, py, 54 * S, ph);
      g.fillStyle = gr >= 1 ? GOLD : '#a07a30'; g.fillRect(px, py, 54 * S * gr, ph);
      px += 60 * S;
    });
  }
  drawWeapon(game, P, W, H, S) {
    const x = W - 44 * S, y = H - 64 * S;
    const Sl = P.slot, Wd = P.W;
    const g = this.g;
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
    // melee weapon, with the three-swing chain
    { const MW = MELEE[P.meleeDef || 0]; this.text(MW.name.toUpperCase(), x, y - 232 * S, 26 * S, RARITY_HEX[MW.rarity], 'right', F_BIG, 400, 0.1); const tw = this.measure(MW.name.toUpperCase(), 26 * S, F_BIG);
      this.key('V', x - tw - 38 * S, y - 241 * S, 24 * S);
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
      this.text('ROUND', 80 * S, 70 * S, 13 * S, 'rgba(242,232,213,0.8)', 'center', F_TXT, 700, 0.1);
      this.text(`${Math.max(r, 0)}`, 80 * S, 104 * S + this.fs(fs) * 0.42, fs, col, 'center', F_BIG, 400, 0.08); }
    const zn = game.final && game.final.active ? 'UNDER THE LUCKY STIFF' : game.zones[game.zone] ? game.zones[game.zone].name.toUpperCase() : '';
    let info = '', ic = BONE;
    if (game.final && (game.final.active || game.final.gate)) { info = game.final.active ? 'THE VAULT' : 'THE VAULT IS OPEN'; ic = GOLD; }
    else if (game.phase === 'Round') info = `${game.remaining()} LEFT`;
    else if (game.phase === 'PreGame') info = `STARTS IN ${Math.ceil(game.phaseTimer)}`;
    else if (game.phase === 'Intermission') info = `NEXT ROUND IN ${Math.ceil(game.phaseTimer)}`;
    else if (game.phase === 'Casino') { info = `CASINO  ${Math.ceil(game.phaseTimer)}`; ic = GOLD; }
    this.text(info, tx, y - 46 * S, 28 * S, ic, 'left', F_BIG, 400, 0.12);
    this.text(zn, tx, y - 16 * S, 19 * S, 'rgba(242,232,213,0.85)', 'left', F_TXT, 700, 0.14);
    {
      const bt = game.barricadeT || 0, bc = game.barricadeCd || 0, inC = game.zone === game.casinoZone;
      const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.ceil(t) % 60).padStart(2, '0')}`;
      if (bt > 0) this.text(`BARRICADE  ${Math.ceil(bt)}s`, x, y + 34 * S, 19 * S, '#7fd3ff', 'left', F_TXT, 700, 0.14);
      else if (bc > 0) this.text(`BARRICADE IN ${mmss(bc)}`, x, y + 34 * S, 17 * S, 'rgba(242,232,213,0.6)', 'left', F_TXT, 700, 0.14);
      else if (inC) this.hints('[B] Barricade', x, y + 30 * S, 17 * S, 'left', 0.9);
    }
    if (false) {
      const next = 3 - (game.round % 3);
      this.text(next === 3 ? 'CASINO NEXT' : `CASINO IN ${next}`, x, y + 34 * S, 17 * S, 'rgba(255,205,90,0.9)', 'left', F_TXT, 700, 0.14);
    }
  }
  drawBoss(game, W, H, S) {
    const B = game.boss;
    if (!B || B.dead || B.emerging) return;
    const w = 760 * S, x = (W - w) / 2, y = 54 * S;
    this.text(B.displayName().toUpperCase(), W / 2, y - 10 * S, 30 * S, B.enraged ? '#ff5a3a' : BONE, 'center', F_BIG, 400, 0.14);
    this.bar(x, y, w, 18 * S, B.health / B.maxHealth, B.enraged ? '#ff3b2a' : '#c8211b', 'rgba(40,8,12,0.8)', 10);
  }
  drawPowerups(game, W, H, S) {
    let x = W / 2 - 60 * S;
    const y = H - 70 * S;
    const one = (icon, t, col) => { this.icon(icon, x, y, 64 * S, t < 5 && Math.sin(this.time * 12) < 0 ? 0.35 : 1); this.text(`${Math.ceil(t)}`, x, y + 50 * S, 22 * S, col, 'center', F_BIG); x += 120 * S; };
    if (game.instaKill > 0) one('I_InstaKill', game.instaKill, '#ff5a4d');
    if (game.doublePoints > 0) one('I_DoublePoints', game.doublePoints, GOLD);
    if (game.fireSale) this.text(`CASINO HALF PRICE  ${Math.ceil(game.fireSaleT || 0)}s`, W / 2, H - 140 * S, 18 * S, '#ff8cff', 'center', F_TXT, 700);
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
    this.hints(l1, W / 2, cy, size, 'center', 1);
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
    if (!gate && (!game.isCasinoOpen() || game.zone === game.casinoZone)) return;
    const S = this.S, W = this.W, H = this.H;
    _v.set(0, 380, 0);
    if (gate) _v.set(gate.x, gate.y + 300, gate.z); else if (game.casinoBounds) _v.set((game.casinoBounds.minX + game.casinoBounds.maxX) / 2, 420, (game.casinoBounds.minZ + game.casinoBounds.maxZ) / 2);
    const d = _v.distanceTo(game.player.pos);
    _v.project(game.camera);
    let x = (_v.x * 0.5 + 0.5) * W, y = (-_v.y * 0.5 + 0.5) * H;
    const behind = _v.z > 1;
    if (behind) { x = W - x; y = H - 40 * S; }
    const m = 60 * S;
    x = clamp(x, m, W - m); y = clamp(y, m + 80 * S, H - m - 120 * S);
    const bob = Math.sin(this.time * 4) * 5 * S;
    this.icon('I_Card', x, y + bob, 52 * S);
    this.text(game.final && game.final.gate ? 'VAULT' : 'CASINO', x, y + 46 * S + bob, 18 * S, GOLD, 'center', F_BIG);
    this.text(`${Math.round(d / 100)}m`, x, y + 66 * S + bob, 15 * S, BONE, 'center', F_TXT, 600);
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
      if (E.elite || E.variant) this.text(E.displayName().toUpperCase(), sx, sy - 8 * k * S, 16 * k * S, acc, 'center', F_TXT, 700, 0.18);
    }
  }
  drawHelp(game, W, H, S, dt) {
    this.helpT = (this.helpT || 0) + dt;
    if (game.round > 1 || this.helpT > 900 || game.player.menu) return;   // shown for the first round only
    const a = 1;
    const rows = [['WASD', 'move'], ['SPACE', 'jump'], ['SHIFT', 'dash'], ['C', 'slide'], ['F', 'grapple'], ['R', 'reload'], ['V', 'melee'], ['E', 'use'], ['TAB', 'upgrades'], ['B', 'barricade (in casino)']];
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
      g.save(); g.translate(W / 2, H * 0.36); g.scale(sc, sc);
      this.text(b.text, 0, 0, 120 * S, '#c8211b', 'center', F_BIG, 400, 0.08, a);
      g.restore();
      if (b.t > b.life) this.roundBanner = null;
    }
    let y = H * 0.22;
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
    const priceStr = it.price !== undefined ? `$${it.price.toLocaleString()}` : '';
    const pw = priceStr ? this.measure(priceStr, priceSize, F_BIG) + 30 * S : 0;
    const ic = it.icon ? 58 * S : 0;
    const left = 24 * S + kh * 1.6 + (ic ? ic + 8 * S : 0);
    const descL = it.desc ? this.wrap(it.desc + (it.note ? `  (${it.note})` : ''), iw - left - pw - 20 * S, descSize) : [];
    const dlh = this.fs(descSize) * 1.32;
    const h = Math.max(ic ? 74 * S : 62 * S, 50 * S + descL.length * dlh + (descL.length ? 6 * S : 0));
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
    const lw = this.chip(`LUCK ${P.luck}`, x + w - pad, y + headH * 0.5, 18 * S, '#7dff8a', 'rgba(0,0,0,0.45)', 'right');
    this.chip(`$${P.money.toLocaleString()}`, x + w - pad - lw - 10 * S, y + headH * 0.5, 18 * S, GOLD, 'rgba(0,0,0,0.45)', 'right');
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
    const w = Math.min(1240 * S, W - 40 * S), x = (W - w) / 2, y = 90 * S, h = H - 200 * S, pad = 30 * S;
    g.fillStyle = 'rgba(8,4,8,0.4)'; g.fillRect(0, 0, W, H);
    this.panel(x, y, w, h, GOLD, 'rgba(20,10,16,0.95)', 18 * S);
    this.text('UPGRADES', x + pad, y + 62 * S, 52 * S, GOLD, 'left', F_BIG, 400, 0.08);
    let cx = x + w - pad;
    for (const [lab, val, col] of [['POWER', Math.round(P.power()), BONE], ['LUCK', `${P.luck}  x${luckMult(P.luck).toFixed(1)}`, '#7dff8a'], ['HEADSHOTS', P.headshots, BONE], ['KILLS', P.kills, BONE]]) {
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
        const stats = [['ROUND', game.round], ['KILLS', P.kills], ['HEADSHOTS', P.headshots], ['UPGRADES', P.upgradeOrder.length], ['LUCK', P.luck], ['PURSE', `$${P.money.toLocaleString()}`]];
    const cw = 170 * S, total = cw * stats.length, x0 = W / 2 - total / 2;
    g.globalAlpha = a; this.panel(x0 - 20 * S, cy + 96 * S, total + 40 * S, 110 * S, 'rgba(255,205,90,0.7)', 'rgba(20,10,16,0.8)', 12 * S); g.globalAlpha = 1;
    stats.forEach(([k, v], i) => {
      const sx = x0 + cw * (i + 0.5);
      this.text(k, sx, cy + 132 * S, 15 * S, 'rgba(242,232,213,0.65)', 'center', F_TXT, 700, 0.06, a);
      this.text(`${v}`, sx, cy + 182 * S, 40 * S, i === 5 ? GOLD : BONE, 'center', F_BIG, 400, 0.1, a);
    });
    if (t > 2) {
      g.globalAlpha = 0.6 + 0.4 * Math.sin(this.time * 4);
      this.hints('[Enter] Restart', W / 2, cy + 270 * S, 24 * S);
      g.globalAlpha = 1;
    }
  }
  drawVictory(game, P, W, H, S) {
    const g = this.g;
    g.fillStyle = 'rgba(20,10,4,0.78)'; g.fillRect(0, 0, W, H);
    const cy = H * 0.36;
    this.text('LEVEL COMPLETE', W / 2, cy, 140 * S, GOLD, 'center', F_BIG, 400, 0.06);
    this.text('Deadwater Gulch is cleared. The Last Dealer is out of the game.', W / 2, cy + 56 * S, 28 * S, BONE, 'center', F_TXT, 700, 0.1);
    const stats = [['ROUND', game.round], ['KILLS', P.kills], ['HEADSHOTS', P.headshots], ['UPGRADES', P.upgradeOrder.length], ['LUCK', P.luck], ['PURSE', `$${P.money.toLocaleString()}`]];
    const cw = 170 * S, total = cw * stats.length, x0 = W / 2 - total / 2;
    this.panel(x0 - 20 * S, cy + 96 * S, total + 40 * S, 110 * S, GOLD, 'rgba(20,10,16,0.85)', 12 * S);
    stats.forEach(([k, v], i) => { const sx = x0 + cw * (i + 0.5); this.text(k, sx, cy + 132 * S, 15 * S, 'rgba(242,232,213,0.65)', 'center', F_TXT, 700, 0.06); this.text(`${v}`, sx, cy + 182 * S, 40 * S, i === 5 ? GOLD : BONE, 'center', F_BIG, 400, 0.1); });
    this.hints('[Enter] Back to the menu', W / 2, cy + 270 * S, 24 * S);
  }
  drawPaused(W, H, S) {
    const g = this.g;
    g.fillStyle = 'rgba(10,6,10,0.62)'; g.fillRect(0, 0, W, H);
    const cy = H * 0.36;
    this.text('PAUSED', W / 2, cy, 120 * S, GOLD, 'center', F_BIG, 400, 0.06);
    this.text('Click to resume', W / 2, cy + 52 * S, 26 * S, BONE, 'center', F_TXT, 700, 0.1);
    const rows = [['WASD', 'move'], ['SPACE', 'jump'], ['SHIFT', 'dash'], ['C', 'slide'], ['F', 'grapple'], ['R', 'reload'], ['V', 'melee'], ['E', 'use'], ['1-4', 'weapons'], ['TAB', 'upgrades'], ['[ ]', 'sensitivity'], ['F3', 'fps']];
    const cols = 3, cw = 300 * S, rh = 42 * S, x0 = W / 2 - (cols * cw) / 2, y0 = cy + 110 * S;
    this.panel(x0 - 24 * S, y0 - 36 * S, cols * cw + 48 * S, Math.ceil(rows.length / cols) * rh + 40 * S, 'rgba(255,205,90,0.7)', 'rgba(20,10,16,0.85)', 12 * S);
    rows.forEach(([k, d], i) => {
      const x = x0 + (i % cols) * cw, y = y0 + Math.floor(i / cols) * rh;
      const kw = this.key(k, x, y, 28 * S);
      this.text(d, x + Math.max(kw, 70 * S) + 12 * S, y + 7 * S, 19 * S, BONE, 'left', F_TXT, 600, 0.08);
    });
  }
}
