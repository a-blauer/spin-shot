    if (!this.MagRoot) this.MagRoot = this.scene_(V(2, 0, -6));
    this.magRest = this.MagRoot.position.clone();
    this.sightZ = SightZ;
    this.supportRest = P3(SupportRest);
    this.muzzle = this.scene_(MuzzleAt);
    this.eject = this.scene_(EjectAt);
    // hands
    this.Box(V(-2, 0, -3), V(9, 7.5, 10), Glove, R(-12, 0, 0));
    for (let i = 0; i < 3; i++) this.Part(this.gun, 1, V(3.2, -0.6, -1.5 - i * 2.9), V(3.2, 3.2, 7.8), i === 0 ? GloveLight : Glove, R(0, 0, 90));
    this.Part(this.gun, 1, V(0.5, -4.2, 1.6), V(3, 3, 7), GloveLight, R(-70, 0, 0));
    this.Part(this.gun, 1, V(-8, 2.5, -9.5), V(9.5, 9.5, 9), Cuff, R(-50, -10, 0));
    this.Part(this.gun, 1, V(-22, 6, -24), V(12, 12, 34), Sleeve, R(-50, -12, 0));
    this.Part(this.gun, 1, V(-15, 4.2, -16.6), V(12.6, 12.6, 3), SleeveStripe, R(-50, -12, 0));
    this.support = this.scene_(SupportRest);
    this.Box(V(0, -1, -2.5), V(10, 8, 7), Glove, R(0, 8, 0), 0, this.support);
    for (let i = 0; i < 3; i++) this.Part(this.support, 1, V(-2 + i * 3, 3, -0.5), V(2.9, 2.9, 7), i === 1 ? GloveLight : Glove);
    this.Part(this.support, 1, V(-6, -8, -9), V(9, 9, 10), Cuff, R(-35, 50, 0));
    this.Part(this.support, 1, V(-16, -19, -20), V(11.5, 11.5, 32), Sleeve, R(-35, 50, 0));
    // muzzle flash: star facing the camera, flame along the barrel, additive glow
    const big = ['Shotgun', 'Sniper', 'Launcher'].includes(this.cls);
    this.FS = big ? 30 : (this.cls === 'Pistol' ? 18 : 22);
    const tint = (this.cls === 'Energy' || this.cls === 'Wonder') ? Accent.clone().lerp(new THREE.Color(1, 1, 1), 0.35) : new THREE.Color(1, 1, 1);
    const star = flashMesh('FX_Star', false); star.material.uniforms.tint.value.set(tint.r, tint.g, tint.b, 1);
    const flame = flashMesh('FX_Flame', false); flame.material.uniforms.tint.value.set(tint.r, tint.g, tint.b, 1);
    const glow = flashMesh('FX_Glow', true); glow.material.uniforms.tint.value.set(1, 0.7, 0.35, 0.6);
    flame.rotation.x = -Math.PI / 2;              // lies flat along the barrel (-z fwd)
    flame.rotation.z = Math.PI / 2;
    flame.position.set(0, 0, -this.FS * 0.55);
    for (const q of [star, flame, glow]) { this.muzzle.add(q); this.parts.push(q); }
    this.flash = [star, flame, glow];
  }

  // ---------------------------------------------------------------- events
  fire(kick, continuous) {
    const K = Math.min(3, Math.max(0.05, kick));
    const ads = 1 - this.aimA * 0.55;
    // UE (x back, y, z up) -> view (y, z, -x)
    const rx = (Math.random() * 12 - 6) * K;
    this.recoilPosVel.add(new THREE.Vector3(rx, 14 * K, 55 * K).multiplyScalar(ads));
    this.recoilRotVel.add(new THREE.Vector3(140 * K, (Math.random() * 80 - 40) * K, (Math.random() * 180 - 90) * K).multiplyScalar(ads));
    if (!continuous || Math.random() < 0.5) {
      this.flashTime = continuous ? 0.03 : 0.05;
      const J = 0.8 + Math.random() * 0.5;
      const [star, flame, glow] = this.flash;
      for (const q of this.flash) q.visible = !this.scoped;
      star.rotation.z = Math.random() * Math.PI * 2;
      star.scale.set(this.FS * J, this.FS * J, 1);
      flame.scale.set(this.FS * 1.3 * J, this.FS * 0.55 * (0.8 + Math.random() * 0.4), 1);
      glow.scale.set(this.FS * 3.5, this.FS * 3.5, 1);
    }
    if (this.cls === 'LMG' || this.cls === 'Wonder') this.spinSpeed = Math.min(this.spinSpeed + 400, 1800);
    if (this.cls === 'Shotgun' && this.PumpRoot) this.jolt(0.4);
    if (!continuous && !['Launcher', 'Energy', 'Wonder'].includes(this.cls)) {
      const p = this.toWorld(this.eject);
      const cam = this.game.camera;
      const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
      const fwd = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 2).negate();
      const vel = right.multiplyScalar(180 + Math.random() * 80).add(up.multiplyScalar(160 + Math.random() * 100)).addScaledVector(fwd, -40).add(this.game.player.vel);
      this.game.fx.debris('FX_Shell', p, vel, this.cls === 'Shotgun' ? 7 : 4.5, 3, Math.random() * 1800 - 900, true);
    }
  }
  land(impact) { this.landVel -= Math.min(1.5, Math.max(0, impact)) * 60; }
  jolt(a) {
    this.recoilPosVel.add(new THREE.Vector3(0, -10, 20).multiplyScalar(a));
    this.recoilRotVel.add(new THREE.Vector3(-40, 0, 25).multiplyScalar(a));
  }
  // world position of a view-model point: project through the overlay camera, unproject into the world camera
  toWorld(obj, dist = 45) {
    const p = new THREE.Vector3();
    obj.getWorldPosition(p);
    p.project(this.camera);
    const cam = this.game.camera;
    const w = new THREE.Vector3(p.x, p.y, 0.5).unproject(cam);
    const o = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);
    return o.clone().add(w.sub(o).normalize().multiplyScalar(dist));
  }
  muzzleWorld() { return this.muzzle ? this.toWorld(this.muzzle, 60) : this.game.player.eye(); }

  // ---------------------------------------------------------------- per frame
  update(dt, In) {
    if (dt <= 0) return;
    dt = Math.min(dt, 0.05);
    this.time += dt;
    const hs = Math.hypot(In.localVel.x, In.localVel.z);
    this.sprintA = interp(this.sprintA, (In.sprinting && !In.aiming && !In.reloading && In.grounded) ? 1 : 0, dt, 9);
    this.aimA = interp(this.aimA, (In.aiming && !In.reloading && this.switchT <= 0) ? 1 : 0, dt, 14);
    this.slideA = interp(this.slideA, In.sliding ? 1 : 0, dt, 10);
    this.wallA = interp(this.wallA, In.wallSide, dt, 8);
    this.airA = interp(this.airA, In.grounded ? 0 : 1, dt, 6);
    this.scoped = this.cls === 'Sniper' && this.aimA > 0.92;

    // sway (UE: Y right, Z up) -> view x, y
    const sm = 1 - this.aimA * 0.75;
    const lx = Math.max(-6, Math.min(6, In.look.x)), ly = Math.max(-6, Math.min(6, In.look.y));
    this.swayVel.add(new THREE.Vector3(-lx * 0.9 * sm, -ly * 0.7 * sm, 0).multiplyScalar(40));
    spring(this.swayPos, this.swayVel, 160, 18, dt);
    const lx8 = Math.max(-8, Math.min(8, In.look.x)), ly8 = Math.max(-8, Math.min(8, In.look.y));
    this.swayRotVel.add(new THREE.Vector3(ly8 * 1.4, -lx8 * 1.6, -lx8 * 2.4).multiplyScalar(22 * sm));
    spring(this.swayRot, this.swayRotVel, 140, 16, dt);
    this.swayPos.clampScalar(-5, 5);
    this.swayRot.clampScalar(-12, 12);

    const bobT = In.grounded && !In.sliding ? Math.min(1.6, hs / 640) : 0;
    this.bobAmp = interp(this.bobAmp, bobT, dt, 8);
    this.bobPhase += dt * (6 + hs * 0.0105);
    const bm = this.bobAmp * (1 - this.aimA * 0.85) * (1 + this.sprintA * 0.6);
    const bob = new THREE.Vector3(Math.sin(this.bobPhase) * 1.6 * bm, -Math.abs(Math.cos(this.bobPhase)) * 1.4 * bm + Math.sin(this.time * 1.6) * 0.25, 0);
    const bobRot = new THREE.Vector3(Math.abs(Math.cos(this.bobPhase)) * 1.2 * bm, Math.sin(this.bobPhase) * 0.8 * bm, Math.sin(this.bobPhase) * 1.6 * bm);

    spring(this.recoilPos, this.recoilPosVel, 260, 22, dt);
    spring(this.recoilRot, this.recoilRotVel, 240, 20, dt);
    { const a = (0 - this.landZ) * 120 - this.landVel * 13; this.landVel += a * dt; this.landZ += this.landVel * dt; }

    // positions in UE-local terms (x fwd, y right, z up) then mapped
    const ads = { X: 26, Y: 0, Z: -this.sightZ + 0.5 };
    const pos = { X: HipPos.X + (ads.X - HipPos.X) * this.aimA, Y: HipPos.Y + (ads.Y - HipPos.Y) * this.aimA, Z: HipPos.Z + (ads.Z - HipPos.Z) * this.aimA };
    const rot = { P: 0, Y: 0, R: 0 };
    const add = (x, y, z, k) => { pos.X += x * k; pos.Y += y * k; pos.Z += z * k; };
    const addR = (p, y, r, k) => { rot.P += p * k; rot.Y += y * k; rot.R += r * k; };
    add(-6, -2, -6, this.sprintA); addR(-16, -32, -24, this.sprintA);
    add(-2, -2, -3, this.slideA); addR(4, 0, -16, this.slideA);
    rot.R += -this.wallA * 10;
    pos.Z += this.airA * 1.2; rot.P += this.airA * 3;
    pos.Z += Math.sin(this.time * 1.4) * 0.3 * (1 - this.aimA);

    let reloadPose = 0, magOffZ = 0;
    const supOff = new THREE.Vector3();
    let pumpOff = 0;
    if (In.reloading) {
      const T = Math.min(1, Math.max(0, In.reloadFrac));
      reloadPose = sstep(0, 0.14, T) * (1 - sstep(0.82, 1, T));
      const out = sstep(0.18, 0.32, T), inA = sstep(0.45, 0.62, T);
      magOffZ = -26 * out * (1 - inA);
      if (out > 0.99 && inA < 0.01) magOffZ = -60;
      const toMag = this.magRest.clone().sub(this.supportRest).add(P3(V(-2, -3, -8)));
      supOff.copy(toMag).multiplyScalar(sstep(0.1, 0.25, T) * (1 - sstep(0.62, 0.78, T))).add(new THREE.Vector3(0, magOffZ * 0.6, 0));
      if (this.PumpRoot) {
        const rack = Math.sin(sstep(0.84, 0.98, T) * Math.PI);
        pumpOff = -7 * rack;
        supOff.z += 7 * rack;
      }
      const crossed = (m) => this.lastReload < m && T >= m;
      if (crossed(0.2)) this.game.audio.play('S_MagOut', 0.7);
      if (crossed(0.6)) { this.game.audio.play(this.cls === 'Shotgun' ? 'S_ShellIn' : 'S_MagIn', 0.8); this.jolt(0.6); }
      if (crossed(0.86) && ['Shotgun', 'Sniper', 'Rifle', 'LMG'].includes(this.cls)) { this.game.audio.play('S_Rack', 0.8); this.jolt(0.5); }
      this.lastReload = T;
    } else this.lastReload = 0;
    add(-3, -3, -4, reloadPose); addR(14, -8, 30, reloadPose);

    if (this.switchT > 0) {
      this.switchT -= dt;
      if (this.switchT <= 0.18 && !this.swapped && this.pendingDef >= 0) {
        this.swapped = true;
        this.weaponDef = this.pendingDef; this.weaponTier = this.pendingTier; this.pendingDef = -1;
        this.build();
        this.game.audio.play('S_Switch', 0.7);
      }
    }
    const drop = this.switchT <= 0 ? 0 : (this.switchT > 0.18 ? 1 - sstep(0.18, 0.36, this.switchT) : sstep(0, 0.18, this.switchT));
    add(-4, 2, -22, drop); addR(-35, 10, 20, drop);

    const p3 = P3(pos).add(this.swayPos).add(bob).add(this.recoilPos).add(new THREE.Vector3(0, this.landZ, 0));
    this.gun.position.copy(p3);
    // UE pitch (nose up) -> rotation about view x; yaw (right) -> about -y; roll -> about -z
    const P = rot.P + this.swayRot.x + bobRot.x + this.recoilRot.x;
    const Y = rot.Y + this.swayRot.y + bobRot.y + this.recoilRot.y;
    const Rr = rot.R + this.swayRot.z + bobRot.z + this.recoilRot.z;
    this.gun.quaternion.copy(quatVM(R(P, Y, Rr)));
    if (this.MagRoot) this.MagRoot.position.copy(this.magRest).add(new THREE.Vector3(0, magOffZ, 0));
    if (this.support) this.support.position.copy(this.supportRest).add(supOff);
    if (this.PumpRoot) this.PumpRoot.position.copy(this.PumpRoot.userData.rest).add(new THREE.Vector3(0, 0, -(pumpOff + Math.min(0, -this.recoilPos.z * 0.6))));
    if (this.SpinPart) {
      this.spinSpeed = interp(this.spinSpeed, this.cls === 'Wonder' ? 600 : 0, dt, 1.5);
      const a = this.spinSpeed * dt * Math.PI / 180;
      if (this.spinAxis === 'x') this.SpinPart.rotateX(a); else this.SpinPart.rotateZ(a);
    }
    if (this.flashTime > 0) {
      this.flashTime -= dt;
      if (this.flashTime <= 0) for (const q of this.flash) q.visible = false;
    }
    // star and glow always face the overlay camera
    if (this.flash.length) {
      const inv = this.muzzle.getWorldQuaternion(new THREE.Quaternion()).invert();
      const spin = this.flash[0].rotation.z;
      this.flash[0].quaternion.copy(inv).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), spin));
      this.flash[0].rotation.z = spin;
      this.flash[2].quaternion.copy(inv);
    }
    this.root.visible = !this.scoped && !this.hidden;
  }
}

function spring(x, v, k, damp, dt) {
  const ax = -x.x * k - v.x * damp, ay = -x.y * k - v.y * damp, az = -x.z * k - v.z * damp;
  v.x += ax * dt; v.y += ay * dt; v.z += az * dt;
  x.addScaledVector(v, dt);
}
