// The look filter: the 3D view (world and gun) is drawn into a small image - a few hundred lines tall - and blown up to
// the screen with hard square pixels, optionally with a 4x4 ordered (Bayer) dither and a reduced number of shades per
// channel. Small faults in the models (fine facets, seams, thin gaps, ragged tips) fall below a pixel and disappear; the
// whole game reads as one hand-made picture. The HUD is its own canvas, so it stays sharp.
// Modes: 0 clean (no pass at all), 1 pixel, 2 pixel + dither.
import * as THREE from 'three';

const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const FRAG = `
uniform sampler2D tex; uniform vec2 res; uniform float dither; uniform float levels;
varying vec2 vUv;
float bayer(vec2 p) {
  int x = int(mod(p.x, 4.0)), y = int(mod(p.y, 4.0)), i = x + y * 4;
  float m[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.);
  return (m[i] + 0.5) / 16.0 - 0.5;
}
void main() {
  vec2 px = floor(vUv * res);
  vec3 c = texture2D(tex, (px + 0.5) / res).rgb;
  if (dither > 0.5) c = clamp(floor(c * levels + 0.5 + bayer(px) * 0.85) / levels, 0.0, 1.0);   // fewer shades, the steps dithered
  gl_FragColor = vec4(c, 1.0);
}`;

export class LookFilter {
  constructor() {
    this.rt = null; this.w = 0; this.h = 0;
    this.mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false,
      uniforms: { tex: { value: null }, res: { value: new THREE.Vector2(1, 1) }, dither: { value: 0 }, levels: { value: 7 } } });
    this.scene = new THREE.Scene();
    const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat); q.frustumCulled = false; this.scene.add(q);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this._v = new THREE.Vector2();
  }
  // Point the renderer at the small image (returns false, and does nothing, when the filter is off).
  begin(R, mode, rows) {
    if (!mode) return false;
    R.getDrawingBufferSize(this._v);
    const h = Math.max(120, Math.min(Math.round(rows || 360), this._v.y)), w = Math.max(1, Math.round(h * this._v.x / this._v.y));
    if (!this.rt || w !== this.w || h !== this.h) {
      if (this.rt) this.rt.dispose();
      this.rt = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true, generateMipmaps: false });
      this.rt.depthTexture = new THREE.DepthTexture(w, h, THREE.FloatType);   // float depth, as the screen uses (reversed range)
      this.w = w; this.h = h;
    }
    this.mode = mode;
    R.setRenderTarget(this.rt);
    return true;
  }
  // Blow the small image up onto the screen.
  end(R) {
    R.setRenderTarget(null);
    const U = this.mat.uniforms; U.tex.value = this.rt.texture; U.res.value.set(this.w, this.h); U.dither.value = this.mode === 2 ? 1 : 0;
    const ac = R.autoClear; R.autoClear = false; R.render(this.scene, this.cam); R.autoClear = ac;
  }
}
