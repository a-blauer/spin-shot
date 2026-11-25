// The way on out of a Descent room: a stone arch against the end wall, filled with a slow gold whirl (red for a boss's
// seal) that opens out from its heart when the room is cleared, a ring of turning runes set in the floor before it, and
// motes of light drawn in from the edges. All of it lives in an Interactable's group (UE frame: x across, y toward the
// wall when f = 1, z up); tickPortal keeps it moving.
import * as THREE from 'three';
import { PRIM } from './world.js';
import { toonMaterial } from './render.js';

// the opening: half its width, and the height where the round top springs from. The arch stands just in front of the
// room's own doorway (whose frame it hides), PORTAL_Y from the exit spot toward the wall.
export const W = 200, SPRING = 430, PORTAL_Y = -14;

const PORTAL_VS = /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const PORTAL_FS = /* glsl */`
  uniform float uT; uniform float uOpen; uniform vec3 uCol; uniform vec3 uHot; uniform float uSpin;
  varying vec2 vUv;
  float arch(vec2 p, float R, float s) { return p.y < s ? max(abs(p.x) - R, -p.y) : length(p - vec2(0.0, s)) - R; }
  void main() {
    vec2 p = (vUv - vec2(0.5, 0.0)) * vec2(${(2 * W + 60).toFixed(1)}, ${(SPRING + W + 30).toFixed(1)});
    // it opens from its heart outward
    vec2 h = vec2(0.0, ${(SPRING * 0.72).toFixed(1)});
    float o = max(uOpen, 0.001);
    float d = arch(h + (p - h) / o, ${W.toFixed(1)}, ${SPRING.toFixed(1)}) * o;
    if (d > 26.0) discard;
    vec2 s = p - h; float r = length(s) / 280.0, a = atan(s.y, s.x);
    float sw = a + uT * 0.55 * uSpin + 2.4 / (r + 0.22);
    float n = sin(sw * 3.0 + r * 9.0 - uT * 2.4) * 0.5 + sin(sw * 5.0 - r * 15.0 + uT * 1.7) * 0.3 + sin(a * 7.0 - uT * 1.1 + r * 5.0) * 0.2;
    float band = smoothstep(0.15, 0.95, n * 0.5 + 0.5);
    vec3 col = mix(uCol * 0.07, uCol * 1.05, band * (0.3 + 0.7 * smoothstep(0.0, 1.0, r)));
    // fine streaks spiralling in
    float st = sin(sw * 22.0 + r * 40.0 - uT * 6.0); col += uHot * 0.35 * smoothstep(0.92, 1.0, st) * smoothstep(0.1, 0.6, r);
    col += uHot * exp(-r * r * 22.0) * 1.3;   // a bright heart, far off
    float rim = exp(-abs(d) / 9.0);
    col = mix(col, uHot * 1.5, rim * 0.9);
    float al = d < 0.0 ? 0.94 : rim * 0.9;
    gl_FragColor = vec4(col, al * smoothstep(0.0, 0.2, uOpen));
  }`;
const RUNE_FS = /* glsl */`
  uniform float uT; uniform vec3 uCol; uniform float uOpen; varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * 2.0; float r = length(p), a = atan(p.y, p.x);
    float ring = smoothstep(0.03, 0.0, abs(r - 0.96)) + smoothstep(0.025, 0.0, abs(r - 0.70));
    // a band of glyphs between the two rings: dashes and pips of three kinds, turning slowly
    float u = (a + uT * 0.12) / 6.2831853 * 36.0, cell = floor(u), f = fract(u), k = mod(cell * 7.0, 3.0);
    float y = (r - 0.75) / 0.17;
    float g = 0.0;
    if (y > 0.0 && y < 1.0) {
      if (k < 1.0) g = step(abs(f - 0.5), 0.08) * step(0.15, y) * step(y, 0.85);
      else if (k < 2.0) g = step(length(vec2((f - 0.5) * 1.4, y - 0.5)), 0.22) - step(length(vec2((f - 0.5) * 1.4, y - 0.5)), 0.12);
      else g = step(abs(f - 0.5 - (y - 0.5) * 0.5), 0.07) * step(0.2, y) * step(y, 0.8) + step(abs(y - 0.5), 0.06) * step(abs(f - 0.5), 0.25);
    }
    // an inner star of lines that turns the other way
    float b = a - uT * 0.2; float star = smoothstep(0.02, 0.0, abs(r * cos(mod(b, 1.0471976) - 0.5235988) - 0.48)) * step(r, 0.68);
    float v = clamp(ring + g + star * 0.8, 0.0, 1.0) * (0.75 + 0.25 * sin(uT * 2.0 + r * 6.0));
    if (v < 0.02) discard;
    gl_FragColor = vec4(uCol * 1.3, v * smoothstep(0.0, 1.0, uOpen));
  }`;

const mats = new Map();
const mat = (c, glow = 0) => { const k = c + '|' + glow; if (!mats.has(k)) { const m = toonMaterial({ glow }); m.uniforms.uColor.value.set(c); mats.set(k, m); } return mats.get(k); };
// a piece at UE local (x, y, z), size (sx along x, sy along y, sz up), tipped in the x-z plane by `tilt` radians
function piece(g, geo, x, y, z, sx, sy, sz, c, glow = 0, tilt = 0) { const m = new THREE.Mesh(PRIM.GEOS[geo], mat(c, glow)); m.position.set(x, z, y); m.scale.set(sx, sz, sy); if (tilt) m.rotation.z = tilt; g.add(m); return m; }

export function buildPortal(I, f, col, boss) {
  const g = new THREE.Group(); I.group.add(g);
  const c = new THREE.Color(col), hot = c.clone().lerp(new THREE.Color(0xffffff), 0.55);
  const stone = boss ? 0x2e2426 : 0x38322c, stoneD = boss ? 0x1e1618 : 0x26221e, gold = boss ? 0x8a3a2a : 0xb8923a, y0 = f * PORTAL_Y;
  // the pillars: plinth, shaft with a lit groove up its face, capital
  for (const s of [-1, 1]) {
    const x = s * (W + 48);
    piece(g, 0, x, y0, 22, 132, 96, 44, stoneD); piece(g, 0, x, y0, 50, 116, 88, 12, gold);
    piece(g, 0, x, y0, 230, 92, 74, 360, stone); for (const z of [120, 230, 340]) piece(g, 0, x, y0, z, 96, 78, 8, stoneD);
    piece(g, 0, x - s * 47, y0, 230, 4, 30, 340, col, 1.4);   // a lit seam down the inner face
    piece(g, 0, x, y0 - f * 38, 230, 14, 4, 300, col, 1.0);
    piece(g, 0, x, y0, SPRING - 8, 128, 92, 30, gold); piece(g, 0, x, y0, SPRING + 12, 118, 86, 14, stoneD);
  }
  // the arch: nine wedged stones on the half-round, a seam of light along their inner edge, a keystone with a lit gem
  const N = 9;
  for (let i = 0; i < N; i++) {
    const a = ((i + 0.5) / N) * Math.PI, rm = W + 48, key = i === (N - 1) / 2;
    const x = Math.cos(a) * rm, z = SPRING + Math.sin(a) * rm;
    piece(g, 0, x, y0, z, (rm * Math.PI) / N - 5, key ? 96 : 80, key ? 120 : 94, key ? stoneD : stone, 0, a - Math.PI / 2);
    const ri = W + 3; piece(g, 0, Math.cos(a) * ri, y0 - f * 30, SPRING + Math.sin(a) * ri, (ri * Math.PI) / N + 2, 6, 5, col, 1.4, a - Math.PI / 2);
  }
  piece(g, 7, 0, y0 - f * 52, SPRING + W + 52, 40, 14, 40, col, 2);
  piece(g, 0, 0, y0 - f * 46, SPRING + W + 52, 64, 6, 64, gold, 0, Math.PI / 4);
  // the whirl that fills it
  const U = { uT: { value: 0 }, uOpen: { value: 0 }, uCol: { value: c }, uHot: { value: hot }, uSpin: { value: boss ? -0.7 : 1 } };
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(2 * W + 60, SPRING + W + 30), new THREE.ShaderMaterial({ uniforms: U, vertexShader: PORTAL_VS, fragmentShader: PORTAL_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  sheet.position.set(0, (SPRING + W + 30) / 2, y0 - f * 4); sheet.renderOrder = 3; g.add(sheet);
  // a dark threshold, and the runes set in the floor before it
  piece(g, 0, 0, y0 - f * 30, 3, 2 * W + 140, 120, 6, stoneD);
  piece(g, 1, 0, -f * 280, 2, 560, 560, 4, stoneD); piece(g, 8, 0, -f * 280, 5, 560, 30, 560, gold).rotation.x = Math.PI / 2;
  const RU = { uT: U.uT, uCol: { value: c }, uOpen: U.uOpen };
  const runes = new THREE.Mesh(new THREE.PlaneGeometry(540, 540), new THREE.ShaderMaterial({ uniforms: RU, vertexShader: PORTAL_VS, fragmentShader: RUNE_FS, transparent: true, depthWrite: false }));
  runes.rotation.x = -Math.PI / 2; runes.position.set(0, 6, -f * 280); runes.renderOrder = 2; g.add(runes);
  I.portal = { U, born: -1, f, c: [c.r, c.g, c.b], h: [hot.r, hot.g, hot.b], mote: 0 };
  return g;
}

// open it out, turn it, and draw motes of light in from its edges
export function tickPortal(I, G, dt) {
  const P = I.portal; if (!P) return;
  if (P.born < 0) P.born = G.time;
  const age = G.time - P.born, k = Math.min(1, age / 1.4);
  P.U.uOpen.value = 1 - Math.pow(1 - k, 3) + (k >= 1 ? 0.012 * Math.sin(G.time * 2.2) : 0);
  P.U.uT.value = G.time;
  P.mote += dt * 26;
  const o = I.group.position;
  while (P.mote >= 1) {
    P.mote -= 1;
    // from somewhere on a loop just outside the opening, toward its heart
    const a = Math.random() * Math.PI * 2, e = 1.05 + Math.random() * 0.3, x = Math.cos(a) * W * 1.1 * e, z = Math.max(25, SPRING * 0.72 + Math.sin(a) * 340 * e);
    const tx = 0, tz = SPRING * 0.72, life = 0.9 + Math.random() * 0.6;
    const pos = new THREE.Vector3(o.x + x, o.y + Math.max(20, z), o.z + P.f * (PORTAL_Y - 30) - P.f * Math.random() * 90);
    const vel = new THREE.Vector3((tx - x) / life * 0.8, (tz - z) / life * 0.8, P.f * 40);
    G.fx.add({ pos, vel, drag: 0.2, life, size0: 7 + Math.random() * 8, size1: 1, c0: [P.h[0], P.h[1], P.h[2], 0.95], c1: [P.c[0], P.c[1], P.c[2], 0], tex: 'FX_Glow', kind: 'add', glow: 1.5 });
  }
}
