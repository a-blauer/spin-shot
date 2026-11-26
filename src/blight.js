// The Blight: the mold the gnomes are hired to clear out. Its creatures are sculpted (tools/sculpt_blight.mjs) rather
// than raised from painted art, and shipped in blight.json: per creature, a set of parts on pivots that the 3D body rig
// (body3d.js) animates like any other. Every vertex carries a fixed colour plus how much of its STRAIN's three colours
// (cap, flesh, glow) shows there, so one sculpt is every strain: a strain is three colours per creature, set per instance.
import * as THREE from 'three';
import { G as UNI } from './render.js';
import { getParts } from './puppet.js';
import { smoothPart } from './blight_smooth.js';

// Strains: each sector the mold has reached grows its own. cap = the caps and hides, flesh = stalks and gills,
// glow = eyes, pores and veins (unshaded).
export const STRAINS = [
  { id: 'toad', name: 'Toadstool', cap: 0xa4432a, flesh: 0xe2d8c0, glow: 0xc4ff58 },
  { id: 'rust', name: 'Rustcap', cap: 0xc4782c, flesh: 0xdac9a6, glow: 0xffd24e },
  { id: 'mire', name: 'Mirecap', cap: 0x3e6c4c, flesh: 0xcfd3b4, glow: 0x6effd2 },
  { id: 'shade', name: 'Nightshade', cap: 0x56367c, flesh: 0xd0c4da, glow: 0xe27cff },
  { id: 'char', name: 'Char', cap: 0x2a2326, flesh: 0x8e7e76, glow: 0xff5a22 },
];
const rgb = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
export const strainRGB = (i) => { const S = STRAINS[((i % STRAINS.length) + STRAINS.length) % STRAINS.length]; return [rgb(S.cap), rgb(S.flesh), rgb(S.glow)]; };

export const BLIGHT = new Map();   // creature name -> { height, beast, parts: [{ role, pivot, off, size, geo }] }
export const isBlight = (name) => BLIGHT.has(name);

// Load and decode every creature, and enter their parts in the rig's table (so Puppet finds them like painted ones).
let loading = null;
const BOSSLOAD = new Map();
// a boss's sculpt, fetched on its own (they are big); resolves when it is in BLIGHT
export function loadBlightBoss(name) {
  if (BLIGHT.has(name)) return Promise.resolve();
  if (!BOSSLOAD.has(name)) BOSSLOAD.set(name, decodeFile('bl_' + name + '.json'));
  return BOSSLOAD.get(name);
}
export const blightPending = (name) => BOSSLOAD.has(name) && !BLIGHT.has(name);
export function loadBlight(url = 'blight.json') {
  if (loading) return loading;
  loading = decodeFile(url);
  return loading;
}
const NO_SMOOTH = typeof location !== 'undefined' && /[?&]smooth=0/.test(location.search);   // ?smooth=0 to compare
function decodeFile(url) {
  const unpack = async (pt) => { const bin = atob(pt.b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    if (!pt.z) return u8.buffer;
    return new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer(); };
  return fetch(url).then((r) => (r.ok ? r.json() : null)).then(async (j) => {
    if (!j || !j.creatures) return;
    const PARTS = getParts();
    for (const [name, K] of Object.entries(j.creatures)) {
      const bufs = await Promise.all(K.parts.map(unpack));
      const parts = K.parts.map((pt, layer) => {
        const buf = bufs[layer];
        let o = 0; const take = (T, n, bytes) => { const a = new T(buf, o, n); o += Math.ceil((n * bytes) / 4) * 4; return a; };
        const pos = take(Int16Array, pt.v * 3, 2), nor = pt.z >= 3 ? take(Int8Array, pt.v * 2, 1) : take(Int8Array, pt.v * 3, 1), col = take(Uint8Array, pt.v * 3, 1), w = take(Uint8Array, pt.v * 3, 1), ao = take(Uint8Array, pt.v, 1), idx = pt.i32 ? take(Uint32Array, pt.i, 4) : take(Uint16Array, pt.i, 2);
        if (pt.z >= 2) for (let i = 3; i < pos.length; i++) pos[i] += pos[i - 3];   // positions stored as running differences
        if (pt.z >= 3) { let hw = 0; for (let i = 0; i < idx.length; i++) { if (idx[i] === 0) idx[i] = hw++; else idx[i] = hw - idx[i]; } }   // indices: how far back from the next new vertex
        else if (pt.z >= 2) for (let i = 1; i < idx.length; i++) idx[i] += idx[i - 1];
        let N3 = nor;
        if (pt.z >= 3) { N3 = new Int8Array(pt.v * 3); for (let q = 0; q < pt.v; q++) { let x = nor[q * 2] / 127, y = nor[q * 2 + 1] / 127; const z = 1 - Math.abs(x) - Math.abs(y); if (z < 0) { const ox = x; x = (1 - Math.abs(y)) * Math.sign(ox || 1); y = (1 - Math.abs(ox)) * Math.sign(y || 1); } const l = Math.hypot(x, y, z) || 1; N3[q * 3] = Math.round(x / l * 127); N3[q * 3 + 1] = Math.round(y / l * 127); N3[q * 3 + 2] = Math.round(z / l * 127); } }
        const g = new THREE.BufferGeometry(), P = new Float32Array(pt.v * 3); for (let i = 0; i < P.length; i++) P[i] = pos[i] / 16;
        g.setAttribute('position', new THREE.BufferAttribute(P, 3));
        const SN = NO_SMOOTH ? null : smoothPart(P, idx, col, w);   // blight_smooth.js: lumps, ragged paint and facets taken out
        g.setAttribute('normal', SN ? new THREE.BufferAttribute(SN, 3) : new THREE.BufferAttribute(N3, 3, true));
        g.setAttribute('color', new THREE.BufferAttribute(col, 3, true));
        g.setAttribute('aW', new THREE.BufferAttribute(w, 3, true));
        g.setAttribute('aAo', new THREE.BufferAttribute(ao, 1, true));
        g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere();
        if (PARTS) PARTS.push({ creature: name, role: pt.role, tex: 'FX_Disc', pivot: [pt.pivot[0], pt.pivot[1], pt.pivot[2]], offset: pt.off, size: pt.size, layer, sculpted: true });
        return { role: pt.role, pivot: pt.pivot, off: pt.off, size: pt.size, geo: g, tris: pt.i / 3, eyes: pt.eyes, teeth: pt.teeth };
      });
      BLIGHT.set(name, { height: K.height, beast: K.beast, parts });
    }
  }).catch((e) => { console.warn(url, e); });
}

// The material: lit in the world's two bands like everything else, the strain mixed in per instance, the glow unshaded.
let MAT = null;
// How the sculpted creatures are drawn, so they can be brought in line with the rest of the game's look:
//   x clean    0..1  the sculpt's painted detail simplified to a few flat tones, its shading darkness lifted, colour richer
//   y facet    0/1   lit by its flat faces, like the world's low-poly props, instead of smoothly
//   z outline  0..1  a dark line round the silhouette (an inverted hull drawn behind it)
//   w bands    0..1  a second, darker shadow step (three-tone cel light) instead of the single soft edge
export const BLIGHT_STYLE = { value: new THREE.Vector4(1, 0, 0, 0) };   // the clean look is the game's look
export const STYLES = { current: [0, 0, 0, 0], clean: [1, 0, 0, 0], faceted: [1, 1, 0, 0], outlined: [1, 0, 1, 0], cel: [1, 0, 1, 1], toon: [1, 1, 1, 0] };
export function setBlightStyle(name) { const v = STYLES[name] || STYLES.clean; BLIGHT_STYLE.value.set(...v); if (OUTLINE) OUTLINE.visible = v[2] > 0; }
if (typeof location !== 'undefined') { const m = /[?&]bstyle=(\w+)/.exec(location.search); if (m) setBlightStyle(m[1]); }
let OUTLINE = null;
// the outline: each part again, pushed out along its normals by a few pixels' worth, drawn back faces only, in dark
export function blightOutlineMaterial() {
  if (OUTLINE) return OUTLINE;
  OUTLINE = new THREE.ShaderMaterial({
    side: THREE.BackSide, uniforms: { bStyle: BLIGHT_STYLE, fogColor: UNI.fogColor, fogParams: UNI.fogParams },
    vertexShader: /* glsl */`
      uniform vec4 bStyle; attribute vec3 color; attribute vec3 aW; attribute vec3 iCap; attribute vec3 iFlesh; varying vec3 vW; varying vec3 vBase;
      void main() {
        mat3 im = mat3(instanceMatrix); vec3 n = normalize(mat3(modelMatrix) * (im * normal));
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
        float d = distance(w.xyz, cameraPosition);
        w.xyz += n * bStyle.z * clamp(d * 0.0028, 0.6, 9.0);
        vW = w.xyz; vBase = color + aW.x * iCap + aW.y * iFlesh;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform vec4 bStyle; uniform vec3 fogColor; uniform vec4 fogParams; varying vec3 vW; varying vec3 vBase;
      void main() {
        if (bStyle.z <= 0.0) discard;
        float dist = distance(vW, cameraPosition); if (dist < 95.0) discard;
        vec3 c = vBase * 0.16 + vec3(0.02, 0.015, 0.02);
        float f = clamp(1.0 - exp(-max(dist - fogParams.x, 0.0) * fogParams.y), 0.0, 1.0) * fogParams.w;
        gl_FragColor = vec4(mix(c, fogColor, f), 1.0);
      }`,
  });
  OUTLINE.visible = BLIGHT_STYLE.value.z > 0;
  return OUTLINE;
}
export function blightMaterial() {
  if (MAT) return MAT;
  MAT = new THREE.ShaderMaterial({
    uniforms: { sunDir: UNI.sunDir, litTint: UNI.litTint, shadowTint: UNI.shadowTint, fogColor: UNI.fogColor, fogParams: UNI.fogParams, spriteTint: UNI.spriteTint, bStyle: BLIGHT_STYLE, uGrade: UNI.grade },
    vertexShader: /* glsl */`
      uniform vec4 bStyle; attribute vec3 color; attribute vec3 aW; attribute float aAo; attribute vec4 iTint; attribute vec3 iCap; attribute vec3 iFlesh; attribute vec3 iGlow;
      varying vec3 vN; varying vec3 vW; varying vec3 vCol; varying vec2 vWt; varying vec3 vCap; varying vec3 vFlesh; varying float vGlow; varying float vAo; varying vec4 vTint; varying vec3 vGlowC;
      void main() {
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0); vW = w.xyz;
        mat3 im = mat3(instanceMatrix);
        vN = normalize(mat3(modelMatrix) * (im * (normal / vec3(dot(im[0], im[0]), dot(im[1], im[1]), dot(im[2], im[2])))));
        vCol = color; vWt = aW.xy; vCap = iCap; vFlesh = iFlesh; vGlow = aW.z; vGlowC = iGlow; vAo = mix(aAo, 1.0, bStyle.x * 0.7); vTint = iTint;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 sunDir; uniform vec4 litTint; uniform vec4 shadowTint; uniform vec3 fogColor; uniform vec4 fogParams; uniform vec3 spriteTint; uniform vec4 bStyle; uniform vec4 uGrade;
      varying vec3 vN; varying vec3 vW; varying vec3 vCol; varying vec2 vWt; varying vec3 vCap; varying vec3 vFlesh; varying float vGlow; varying float vAo; varying vec4 vTint; varying vec3 vGlowC;
      // snap to n flat steps, per pixel, each step easing into the next (no hard contour line, no triangle-shaped edges)
      float snapSoft(float x, float n) { float y = x * n, k = floor(y), t = y - k, e = max(0.22, fwidth(y)); return (k + smoothstep(0.5 - e, 0.5 + e, t)) / n; }
      void main() {
        // clean: the paint's many tones of cap and flesh snapped to a few, the fixed colours posterised; done here per
        // pixel so the borders run smooth across the triangles instead of following them
        vec2 wq = mix(vWt, vec2(snapSoft(vWt.x, 4.0), snapSoft(vWt.y, 4.0)), bStyle.x);
        float L = max(dot(vCol, vec3(0.3, 0.55, 0.15)), 1e-4); vec3 cq = mix(vCol, vCol * snapSoft(L, 8.0) / L, bStyle.x * step(0.06, L));
        vec3 vBase = cq + wq.x * vCap + wq.y * vFlesh;
        float dist = distance(vW, cameraPosition);
        // right up against the eye it thins out to nothing instead of filling the view
        if (dist < 95.0) { float keep = smoothstep(38.0, 95.0, dist); vec2 q = floor(mod(gl_FragCoord.xy, 4.0)); float th = (q.x * 4.0 + mod(q.y * 2.0 + q.x * 3.0, 4.0) + 0.5) / 16.0; if (keep < fract(th + q.y * 0.25)) discard; }
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        if (bStyle.y > 0.5) { vec3 fn = normalize(cross(dFdx(vW), dFdy(vW))); n = dot(fn, n) < 0.0 ? -fn : fn; }   // faceted
        vec3 base = vBase * vAo;
        if (bStyle.x > 0.0) { float l = dot(base, vec3(0.3, 0.55, 0.15)); base = mix(base, max(mix(vec3(l), base, 1.3) * 1.08, 0.0), bStyle.x); }   // richer, a touch lighter
        // the room's air in them too, at half the strength the walls get: they belong to the room but still stand out of it
        if (uGrade.w > 0.0) { vec3 k = fogColor / max(1e-3, max(fogColor.r, max(fogColor.g, fogColor.b))); const vec3 W3 = vec3(0.299, 0.587, 0.114); base = mix(base, k * (dot(base, W3) / max(dot(k, W3), 1e-3)), uGrade.x * 0.5); }
        float ndl = dot(n, sunDir), band = smoothstep(-0.1, 0.16, ndl);   // a soft edge to the shadow, so small dents in a sculpt do not tear it into ragged patches
        vec3 c = mix(base * shadowTint.rgb, base * litTint.rgb, band);
        if (bStyle.w > 0.0) c *= mix(1.0, mix(0.78, 1.0, smoothstep(-0.45, -0.35, ndl)), bStyle.w * (1.0 - band));   // a deeper step in the shadow
        float top = clamp((n.y - 0.55) / 0.35, 0.0, 1.0); c *= mix(1.0, litTint.a, top * band);
        c *= mix(shadowTint.a, 1.0, clamp(n.y * 0.5 + 0.5, 0.0, 1.0));
        // a little dark at grazing angles, so the round edge reads against the room
        vec3 vd = normalize(cameraPosition - vW); float rim = 1.0 - clamp(abs(dot(n, vd)), 0.0, 1.0);
        c *= 1.0 - smoothstep(0.7, 1.0, rim) * 0.32 * (1.0 - bStyle.x);
        c *= vTint.rgb * spriteTint;
        // the glow: the strain's own light, not shaded
        c = mix(c, vGlowC * 1.15, clamp(vGlow, 0.0, 1.0));
        c = mix(c, vec3(1.0, 0.98, 0.92), clamp(vTint.a, 0.0, 1.0));
        float f = clamp(1.0 - exp(-max(dist - fogParams.x, 0.0) * fogParams.y), 0.0, 1.0) * fogParams.w * (1.0 - vGlow * 0.5);
        gl_FragColor = vec4(mix(c, fogColor, f), 1.0);
      }`,
  });
  return MAT;
}
