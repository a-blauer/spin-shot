// Flat-vector rendering (Sulfur-like). Everything is unlit:
//  - toon:   geometry gets a crisp 2-tone sun band + top-face boost + underside darkening, then distance fog
//  - sprite: atlas sprites with alpha-test (creatures, gibs, decals, foliage), tint + white hit flash, fog
//  - fx:     translucent / additive atlas sprites (muzzle stars, puffs, glows, tracers)
// All shading happens directly in sRGB so authored colours land on screen exactly.
import * as THREE from 'three';

export const G = {
  sunDir: { value: new THREE.Vector3(0.45, 0.8, -0.4).normalize() },
  litTint: { value: new THREE.Vector4(1, 0.98, 0.94, 1.07) },
  shadowTint: { value: new THREE.Vector4(0.56, 0.6, 0.76, 0.86) },
  fogColor: { value: new THREE.Color(0x3e7a78) },
  fogParams: { value: new THREE.Vector4(700, 0.0003, 0, 0.9) },
  skyTop: { value: new THREE.Color(0x10303a) },
  spriteTint: { value: new THREE.Color(1, 1, 1) },
};

export const hex = (h) => new THREE.Color().setHex(h, THREE.NoColorSpace);
export const rgb = (r, g, b) => new THREE.Color(r, g, b);

const FOG = /* glsl */`
  uniform vec3 fogColor;
  uniform vec4 fogParams;
  float fogAmount(vec3 wp) {
    float d = distance(wp, cameraPosition);
    return clamp(1.0 - exp(-max(d - fogParams.x, 0.0) * fogParams.y), 0.0, 1.0) * fogParams.w;
  }
`;

// ------------------------------------------------------------------ toon (geometry)
export function toonMaterial({ color = 0xffffff, glow = 0, instanced = false } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      sunDir: G.sunDir, litTint: G.litTint, shadowTint: G.shadowTint, fogColor: G.fogColor, fogParams: G.fogParams,
      uColor: { value: hex(color) }, uGlow: { value: glow },
    },
    vertexShader: /* glsl */`
      varying vec3 vN; varying vec3 vW; varying vec3 vCol;
      void main() {
        vec4 p = vec4(position, 1.0);
        vec3 n = normal;
        #ifdef USE_INSTANCING
          p = instanceMatrix * p;
          n = mat3(instanceMatrix) * n;
        #endif
        vec4 w = modelMatrix * p;
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * n);
        vCol = vec3(1.0);
        #ifdef USE_INSTANCING_COLOR
          vCol = instanceColor;
        #endif
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 sunDir; uniform vec4 litTint; uniform vec4 shadowTint; uniform vec3 uColor; uniform float uGlow;
      varying vec3 vN; varying vec3 vW; varying vec3 vCol;
      ${FOG}
      void main() {
        vec3 col = uColor * vCol;
        vec3 n = normalize(vN);
        float ndl = dot(n, sunDir);
        float band = smoothstep(-0.03, 0.07, ndl);
        vec3 c = mix(col * shadowTint.rgb, col * litTint.rgb, band);
        float top = clamp((n.y - 0.55) / 0.35, 0.0, 1.0);
        c *= mix(1.0, litTint.a, top * band);
        c *= mix(shadowTint.a, 1.0, clamp(n.y * 0.5 + 0.5, 0.0, 1.0));
        c += col * uGlow;
        float f = fogAmount(vW) * clamp(1.0 - uGlow * 0.2, 0.0, 1.0);
        gl_FragColor = vec4(mix(c, fogColor, f), 1.0);
      }`,
  });
}

// ------------------------------------------------------------------ sprites (instanced quads)
// per-instance: iUV (u0, v0, u1, v1 in GL texture space), iTint (rgba), iFx (flash, noFog, glow, unused)
function spriteShaders(kind) {
  const vertex = /* glsl */`
    attribute vec4 iUV; attribute vec4 iTint; attribute vec4 iFx;
    varying vec2 vUv; varying vec4 vTint; varying vec4 vFx; varying vec3 vW;
    void main() {
      vUv = vec2(mix(iUV.x, iUV.z, uv.x), mix(iUV.y, iUV.w, uv.y));
      vTint = iTint; vFx = iFx;
      vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
      vW = w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w;
    }`;
  const common = /* glsl */`
    uniform sampler2D map; uniform vec3 spriteTint;
    varying vec2 vUv; varying vec4 vTint; varying vec4 vFx; varying vec3 vW;
    ${FOG}`;
  let frag;
  if (kind === 'sprite') {
    frag = common + /* glsl */`
      void main() {
        vec4 t = texture2D(map, vUv);
        float a = t.a * vTint.a;
        if (a < 0.45) discard;
        vec3 c = t.rgb * vTint.rgb * spriteTint;
        c = mix(c, vec3(1.0, 0.98, 0.92), clamp(vFx.x, 0.0, 1.0));
        float f = fogAmount(vW) * (1.0 - vFx.y);
        gl_FragColor = vec4(mix(c, fogColor, f), 1.0);
      }`;
  } else if (kind === 'fx') {
    frag = common + /* glsl */`
      void main() {
        vec4 t = texture2D(map, vUv);
        float a = t.a * vTint.a;
        if (a < 0.004) discard;
        vec3 c = t.rgb * vTint.rgb * (1.0 + vFx.z);
        float f = fogAmount(vW) * (1.0 - vFx.y) * 0.8;
        gl_FragColor = vec4(mix(c, fogColor, f), a);
      }`;
  } else {
    frag = common + /* glsl */`
      void main() {
        vec4 t = texture2D(map, vUv);
        float f = fogAmount(vW) * (1.0 - vFx.y);
        vec3 c = t.rgb * t.a * vTint.rgb * vTint.a * max(vFx.z, 0.0) * (1.0 - f);
        if (max(c.r, max(c.g, c.b)) < 0.002) discard;
        gl_FragColor = vec4(c, 1.0);
      }`;
  }
  return { vertex, frag };
}

export function spriteMaterial(kind, texture) {
  const s = spriteShaders(kind);
  const m = new THREE.ShaderMaterial({
    uniforms: { map: { value: texture }, spriteTint: G.spriteTint, fogColor: G.fogColor, fogParams: G.fogParams },
    vertexShader: s.vertex,
    fragmentShader: s.frag,
    side: THREE.DoubleSide,
    transparent: kind !== 'sprite',
    depthWrite: kind === 'sprite',
    blending: kind === 'add' ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  return m;
}

// ------------------------------------------------------------------ atlas
export const Atlas = { meta: null, tex: {} };

export async function loadAtlas(base = '') {
  Atlas.meta = await (await fetch(base + 'atlas.json')).json();
  const loader = new THREE.TextureLoader();
  for (const name of ['creatures', 'fx']) {
    // load through a blob: URL (the artifact frame's CSP allows blob: images)
    const blob = await (await fetch(base + 'atlas_' + name + '.png')).blob();
    const url = URL.createObjectURL(blob);
    Atlas.blobUrl = Atlas.blobUrl || {};
    Atlas.blobUrl[name] = url;
    const t = await loader.loadAsync(url);
    t.colorSpace = THREE.NoColorSpace;
    t.anisotropy = 4;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    Atlas.tex[name] = t;
  }
}

// each map's creatures are their own atlas, fetched the first time that map is played
export async function loadCreaturePack(k, base = '', half = false) {
  if (Array.isArray(k)) { for (let i = 0; i < k.length; i++) await loadCreaturePack(k[i], base, i > 1); return; }   // the Descent: its own two sheets whole, the six maps' sheets at half size to keep the memory down
  const name = 'creatures' + (k || '');
  if (Atlas.tex[name]) return;
  if (!Object.values(Atlas.meta || {}).some((m) => m.atlas === name)) return;   // no such sheet in this build
  if (half) {
    const blob = await (await fetch(base + 'atlas_' + name + '.png')).blob(), bmp = await createImageBitmap(blob), c = document.createElement('canvas');
    c.width = bmp.width >> 1; c.height = bmp.height >> 1; c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); if (bmp.close) bmp.close();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.premultiplyAlpha = false;
    Atlas.tex[name] = t; return;
  }
  const blob = await (await fetch(base + 'atlas_' + name + '.png')).blob();
  const t = await new THREE.TextureLoader().loadAsync(URL.createObjectURL(blob));
  t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  Atlas.tex[name] = t;
}

export function sprite(name) {
  const m = Atlas.meta[name];
  if (!m) { console.warn('missing sprite', name); return Atlas.meta.FX_Disc; }
  if (!m.gl) m.gl = [m.u0, 1 - m.v1, m.u1, 1 - m.v0];
  return m;
}

// Immediate-mode instanced sprite batch: systems push quads each frame (or once, for static batches).
const PLANE = new THREE.PlaneGeometry(1, 1);
const _m = new THREE.Matrix4();
const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3();

export class SpriteBatch {
  constructor(scene, kind, atlas, capacity, renderOrder = 0) {
    this.capacity = capacity;
    const geo = PLANE.clone();
    this.uv = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4);
    this.tint = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4);
    this.fx = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4);
    for (const a of [this.uv, this.tint, this.fx]) a.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('iUV', this.uv);
    geo.setAttribute('iTint', this.tint);
    geo.setAttribute('iFx', this.fx);
    this.mesh = new THREE.InstancedMesh(geo, spriteMaterial(kind, Atlas.tex[atlas]), capacity);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = renderOrder;
    this.mesh.count = 0;
    scene.add(this.mesh);
    this.n = 0;
  }
  begin() { this.n = 0; }
  // right/up are world axes (unnormalised lengths = half... no: full width/height), center world pos.
  pushBasis(spr, center, right, up, w, h, r = 1, g = 1, b = 1, a = 1, flash = 0, noFog = 0, glow = 0) {
    if (this.n >= this.capacity) return -1;
    const i = this.n++;
    _x.copy(right).multiplyScalar(w);
    _y.copy(up).multiplyScalar(h);
    _z.crossVectors(right, up);
    _m.makeBasis(_x, _y, _z).setPosition(center);
    this.mesh.setMatrixAt(i, _m);
    const uv = spr.gl || sprite(spr.name).gl;
    this.uv.setXYZW(i, uv[0], uv[1], uv[2], uv[3]);
    this.tint.setXYZW(i, r, g, b, a);
    this.fx.setXYZW(i, flash, noFog, glow, 0);
    return i;
  }
  pushMatrix(spr, matrix, r = 1, g = 1, b = 1, a = 1, flash = 0, noFog = 0, glow = 0) {
    if (this.n >= this.capacity) return -1;
    const i = this.n++;
    this.mesh.setMatrixAt(i, matrix);
    const uv = spr.gl;
    this.uv.setXYZW(i, uv[0], uv[1], uv[2], uv[3]);
    this.tint.setXYZW(i, r, g, b, a);
    this.fx.setXYZW(i, flash, noFog, glow, 0);
    return i;
  }
  end() {
    this.mesh.count = this.n;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.uv.needsUpdate = true;
    this.tint.needsUpdate = true;
    this.fx.needsUpdate = true;
  }
}

// Camera basis (updated each frame) for billboards.
export const Cam = {
  pos: new THREE.Vector3(),
  right: new THREE.Vector3(1, 0, 0),
  up: new THREE.Vector3(0, 1, 0),
  fwd: new THREE.Vector3(0, 0, -1),
};
export function updateCamBasis(camera) {
  camera.getWorldPosition(Cam.pos);
  Cam.right.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
  Cam.up.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
  Cam.fwd.setFromMatrixColumn(camera.matrixWorld, 2).normalize().negate();
}
