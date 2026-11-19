// World-space text (signs, prices, labels): rounded bold text drawn to a canvas, shown on a fogged quad.
import * as THREE from 'three';
import { G } from './render.js';

const cache = new Map();

export function textTexture(text, color = '#ffd25a', outline = '#1d1418') {
  const key = text + '|' + color + '|' + outline;
  if (cache.has(key)) return cache.get(key);
  const font = '96px "Big Shoulders Display", "Arial Black", Arial, sans-serif';
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = font;
  const w = Math.ceil(g.measureText(text).width) + 48;
  c.width = Math.min(4096, w);
  c.height = 140;
  g.font = font;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = 18;
  g.strokeStyle = outline;
  g.strokeText(text, c.width / 2, 72);
  g.fillStyle = color;
  g.fillText(text, c.width / 2, 72);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 4;
  const res = { tex: t, aspect: c.width / c.height };
  cache.set(key, res);
  return res;
}

const textMat = new Map();
function material(tex, glow) {
  const key = tex.uuid + glow;
  if (textMat.has(key)) return textMat.get(key);
  const m = new THREE.ShaderMaterial({
    uniforms: { map: { value: tex }, fogColor: G.fogColor, fogParams: G.fogParams, uGlow: { value: glow } },
    vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform sampler2D map; uniform vec3 fogColor; uniform vec4 fogParams; uniform float uGlow; varying vec2 vUv; varying vec3 vW;
      void main(){ vec4 t = texture2D(map, vUv); if (t.a < 0.4) discard;
        float d = distance(vW, cameraPosition); float f = clamp(1.0 - exp(-max(d - fogParams.x, 0.0) * fogParams.y), 0.0, 1.0) * fogParams.w * (1.0 - uGlow);
        gl_FragColor = vec4(mix(t.rgb, fogColor, f), 1.0); }`,
    side: THREE.FrontSide,
  });
  textMat.set(key, m);
  return m;
}

const PLANE = new THREE.PlaneGeometry(1, 1);
// height = cap height in cm (UE TextRender world size); mesh lies in its local XY plane facing +Z.
// Two single-sided quads back to back, so text reads correctly from either side (never mirrored).
export function textMesh(text, height, color = '#ffd25a', glow = 0.5) {
  const { tex, aspect } = textTexture(text, color);
  const g = new THREE.Group();
  const h = height * 1.45;
  for (let i = 0; i < 2; i++) {
    const m = new THREE.Mesh(PLANE, material(tex, glow));
    m.scale.set(h * aspect, h, 1);
    if (i) { m.rotation.y = Math.PI; m.position.z = -0.6; }
    g.add(m);
  }
  return g;
}

export const cssColor = (c) => {
  const f = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255);
  return `rgb(${f(c.r)},${f(c.g)},${f(c.b)})`;
};
