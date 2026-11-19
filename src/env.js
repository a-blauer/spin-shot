// Per-zone monochrome atmosphere (blended as you move) + gradient sky dome with moon and paper clouds.
import * as THREE from 'three';
import { G, hex, sprite } from './render.js';

const C = (h) => hex(h);
const ue2three = (x, y, z) => new THREE.Vector3(x, z, y).normalize();

function base() {
  return {
    fog: C(0x4e6a6a), sky: C(0x142430),
    lit: new THREE.Vector4(1, 0.98, 0.94, 1.07), shadow: new THREE.Vector4(0.56, 0.6, 0.76, 0.86),
    sprite: new THREE.Color(1, 1, 1), sun: ue2three(0.45, -0.4, 0.8), fogStart: 700, fogDensity: 0.0003, fogMax: 0.9,
  };
}

export function zonePalette(zone, casinoNight) {
  const P = base();
  switch (zone) {
    case 0: P.fog = C(0x3e7a78); P.sky = C(0x10303a); P.shadow.set(0.5, 0.62, 0.72, 0.85); P.sprite.setRGB(0.92, 1, 1); P.sun = ue2three(-0.35, 0.5, 0.78); break;
    case 1: P.fog = C(0xc0844e); P.sky = C(0x4e3e5e); P.lit.set(1.05, 0.96, 0.86, 1.06); P.shadow.set(0.58, 0.5, 0.66, 0.86); P.sun = ue2three(0.6, 0.3, 0.55); break;
    case 2: P.fog = C(0x6e4c74); P.sky = C(0x1e1432); P.shadow.set(0.5, 0.46, 0.7, 0.84); P.sprite.setRGB(1, 0.95, 1); break;
    case 3: P.fog = C(0x6a8a5e); P.sky = C(0x1c2e24); P.shadow.set(0.52, 0.6, 0.6, 0.85); P.sun = ue2three(-0.5, -0.3, 0.8); break;
    case 4: P.fog = C(0x6a2c52); P.sky = C(0x180c24); P.lit.set(1, 0.94, 0.98, 1.06); P.shadow.set(0.56, 0.44, 0.7, 0.85); P.sprite.setRGB(1, 0.94, 1); break;
    case 5: P.fog = C(0xd27a3c); P.sky = C(0x7a3424); P.lit.set(1.06, 0.96, 0.86, 1.06); P.shadow.set(0.64, 0.44, 0.46, 0.86); P.sun = ue2three(0.2, -0.7, 0.6); P.fogDensity = 0.00026; break;
    case 6: P.fog = C(0x4e1622); P.sky = C(0x2a0a12); P.lit.set(1.02, 0.92, 0.86, 1.04); P.shadow.set(0.6, 0.42, 0.5, 0.84); P.sprite.setRGB(1, 0.9, 0.88); P.fogStart = 300; P.fogDensity = 0.00055; P.fogMax = 0.8; break;
    case 7: P.fog = C(0x5a0c14); P.sky = C(0x12040a); P.lit.set(1.08, 0.9, 0.8, 1.05); P.shadow.set(0.62, 0.36, 0.4, 0.82); P.sprite.setRGB(1.05, 0.9, 0.86); P.fogStart = 1100; P.fogDensity = 0.00021; P.fogMax = 0.8; P.sun = ue2three(0.2, 0.3, 0.9); break;   // the vault
    default: break;
  }
  if (casinoNight && zone !== 6 && zone !== 7) {
    P.fog.lerp(C(0x5a1e4a), 0.45);
    P.sky.lerp(C(0x12061c), 0.5);
    P.shadow.lerp(new THREE.Vector4(0.55, 0.4, 0.7, P.shadow.w), 0.4);
    P.fogDensity *= 1.15;
  }
  return P;
}

export class Environment {
  constructor(scene, fxBatch) {
    this.scene = scene;
    this.cur = zonePalette(0, false);
    this.casino = false;
    this.zone = 0;
    // sky dome
    const geo = new THREE.SphereGeometry(150000, 32, 16);
    this.sky = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: { fogColor: G.fogColor, skyTop: G.skyTop, sunDir: G.sunDir },
      vertexShader: `varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 fogColor; uniform vec3 skyTop; uniform vec3 sunDir; varying vec3 vD;
        void main(){ vec3 d = normalize(vD); float t = smoothstep(-0.02, 0.55, d.y);
          vec3 c = mix(fogColor, skyTop, t); float s = pow(max(dot(d, sunDir), 0.0), 24.0);
          gl_FragColor = vec4(c + fogColor * s * 0.35, 1.0); }`,
      side: THREE.BackSide, depthWrite: false,
    }));
    this.sky.renderOrder = -10;
    this.sky.frustumCulled = false;
    scene.add(this.sky);
    // moon + clouds (static directions, drawn through the fx batch each frame)
    this.skySprites = [{ spr: sprite('P_Moon'), dir: ue2three(0.55, -0.55, 0.42), size: 7000, cloud: false }];
    for (let i = 0; i < 9; i++) {
      const a = (i * 40 + (Math.random() * 20 - 10)) * Math.PI / 180;
      this.skySprites.push({ spr: sprite('P_Cloud'), dir: ue2three(Math.cos(a), Math.sin(a), 0.06 + Math.random() * 0.14), size: 14000 + Math.random() * 8000, cloud: true });
    }
    this.fxBatch = fxBatch;
  }

  setCasinoMood(on) { this.casino = on; }

  update(dt, camPos, zone) {
    if (zone >= 0) this.zone = zone;
    const T = zonePalette(this.zone, this.casino);
    const k = Math.min(1, dt * 1.6);
    const P = this.cur;
    P.fog.lerp(T.fog, k); P.sky.lerp(T.sky, k); P.lit.lerp(T.lit, k); P.shadow.lerp(T.shadow, k); P.sprite.lerp(T.sprite, k);
    P.sun.lerp(T.sun, k).normalize();
    P.fogStart += (T.fogStart - P.fogStart) * k; P.fogDensity += (T.fogDensity - P.fogDensity) * k; P.fogMax += (T.fogMax - P.fogMax) * k;
    G.fogColor.value.copy(P.fog);
    G.skyTop.value.copy(P.sky);
    G.litTint.value.copy(P.lit);
    G.shadowTint.value.copy(P.shadow);
    G.spriteTint.value.copy(P.sprite);
    G.sunDir.value.copy(P.sun);
    G.fogParams.value.set(P.fogStart, P.fogDensity, 0, P.fogMax);
    this.sky.position.copy(camPos);
  }

  drawSky(batch, camPos) {
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3(), u = new THREE.Vector3(), c = new THREE.Vector3();
    const cloud = this.cur.fog.clone().lerp(new THREE.Color(1, 1, 1), 0.35);
    for (const s of this.skySprites) {
      right.crossVectors(up, s.dir).normalize();
      u.crossVectors(s.dir, right).normalize();
      c.copy(s.dir).multiplyScalar(70000).add(camPos);
      if (s.cloud) batch.pushBasis(s.spr, c, right, u, s.size, s.size * (s.spr.h / s.spr.w), cloud.r, cloud.g, cloud.b, 0.45, 0, 1, 0);
      else batch.pushBasis(s.spr, c, right, u, s.size, s.size, 1, 0.98, 0.9, 1, 0, 1, 0);
    }
  }
}
