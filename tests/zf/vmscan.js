(() => {
  const g = __dmh, P = g.player, vm = g.vm, out = [];
  const N = g.data.weapons.length;
  const comps = (mesh) => {   // connected islands of a mesh, in the gun's space
    const geo = mesh.geometry, pos = geo.attributes.position, idx = geo.index, n = pos.count, par = new Int32Array(n).map((_, i) => i);
    const f = (a) => { while (par[a] !== a) a = par[a] = par[par[a]]; return a; }, u = (a, b) => { a = f(a); b = f(b); if (a !== b) par[a] = b; };
    const key = new Map(); for (let i = 0; i < n; i++) { const k = Math.round(pos.getX(i) * 200) + ',' + Math.round(pos.getY(i) * 200) + ',' + Math.round(pos.getZ(i) * 200); const j = key.get(k); if (j !== undefined) u(i, j); else key.set(k, i); }
    const tri = idx ? idx.count / 3 : n / 3; for (let t = 0; t < tri; t++) { const a = idx ? idx.getX(t * 3) : t * 3, b = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, c = idx ? idx.getX(t * 3 + 2) : t * 3 + 2; u(a, b); u(b, c); }
    const M = new Map(), v = __dmh.player.pos.clone(); mesh.updateWorldMatrix(true, false);
    for (let i = 0; i < n; i++) { const r = f(i); let b = M.get(r); if (!b) M.set(r, b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]); v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mesh.matrixWorld); b[0] = Math.min(b[0], v.x); b[1] = Math.min(b[1], v.y); b[2] = Math.min(b[2], v.z); b[3] = Math.max(b[3], v.x); b[4] = Math.max(b[4], v.y); b[5] = Math.max(b[5], v.z); }
    return [...M.values()];
  };
  const inPart = (o) => { for (let q = o; q; q = q.parent) if (q.userData && q.userData.piv) return q; return null; };
  for (let w = 1; w < N; w++) for (const tier of [0, 3]) {
    try { P.giveWeapon(w); vm.setWeapon(w, tier, false); __sim(2); } catch (e) { out.push([w, 'err ' + e.message]); continue; }
    vm.root.updateMatrixWorld(true);
    const parts = [], statics = [];
    vm.root.traverse((o) => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return; const p = inPart(o); const cs = comps(o); if (p) { for (const c of cs) (window.__pc || (window.__pc = [])).push([c, Object.keys(vm.A).find((k) => vm.A[k] === p) || p.name]); let b = parts.find((x) => x.p === p); if (!b) parts.push(b = { p, bb: [1e9, 1e9, 1e9, -1e9, -1e9, -1e9], n: Object.keys(vm.A).find((k) => vm.A[k] === p) || p.name }); for (const c of cs) for (let i = 0; i < 3; i++) { b.bb[i] = Math.min(b.bb[i], c[i]); b.bb[i + 3] = Math.max(b.bb[i + 3], c[i + 3]); } } else for (const c of cs) statics.push(c); });
    const touch = (a, b, t = 0.25) => a[0] <= b[3] + t && b[0] <= a[3] + t && a[1] <= b[4] + t && b[1] <= a[4] + t && a[2] <= b[5] + t && b[2] <= a[5] + t;
    const PC = window.__pc || []; window.__pc = [];
    for (const s of statics) { if (statics.some((o) => o !== s && touch(s, o))) continue; const hit = PC.find(([c]) => touch(s, c)); if (hit) out.push([w, g.data.weapons[w].name, tier, hit[1], s.map((x) => Math.round(x * 10) / 10)]); }
    for (const s of []) for (const p of parts) {
      const B = p.bb, ov = [0, 1, 2].map((i) => Math.max(0, Math.min(s[i + 3], B[i + 3]) - Math.max(s[i], B[i]))), vol = [0, 1, 2].map((i) => Math.max(1e-6, s[i + 3] - s[i]));
      const frac = (ov[0] / vol[0]) * (ov[1] / vol[1]) * (ov[2] / vol[2]);
      if (frac > 0.5) out.push([w, g.data.weapons[w].name, p.n, s.map((x) => Math.round(x * 10) / 10)]);
    }
  }
  return JSON.stringify(out);
})()
