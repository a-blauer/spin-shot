(() => {
const g = __dmh, D = __meta ? null : null, P = g.player;
g.godMode = true; g.tip = () => {}; if (g.hud) g.hud.toast = () => {};
for (const E of g.enemies) { E.dead = true; E.remove = true; } g.enemies.length = 0;
const DATA = window.__DATA, out = [];
const base = P.pos.clone(); base.y = P.pos.y;
function measure(E, frames) {
  const pts = []; let n = 0;
  for (let f = 0; f < frames; f++) {
    __sim(6);
    if (E.dead) break;
    const B = E.puppet, ps = window.__bodyPoints(B, 200); if (!ps) return { err: B && B.custom ? 'custom rig' : B && !B.is3D ? 'flat cut-out' : 'no points' };
    const fy = E.pos.y - E.feetOffset;
    for (const [role, x, y, z] of ps) pts.push([role, Math.hypot(x - E.pos.x, z - E.pos.z), y - fy, x - E.pos.x, z - E.pos.z]);
    n++;
  }
  if (!pts.length) return { err: 'dead' };
  const H = E.hitH || E.half * 2, R = E.hitR || E.radius, hy = E.headY() - (E.pos.y - E.feetOffset);
  const ys = pts.map((p) => p[2]).sort((a, b) => a - b), ds = pts.map((p) => p[1]).sort((a, b) => a - b);
  const q = (a, f) => a[Math.min(a.length - 1, Math.floor(a.length * f))];
  // torso band: the middle of the body's height, where most shots land
  const band = pts.filter((p) => p[2] > q(ys, 0.25) && p[2] < q(ys, 0.85)).map((p) => p[1]).sort((a, b) => a - b);
  const inside = pts.filter((p) => p[1] <= R && p[2] >= 0 && p[2] <= H).length / pts.length;
  const head = pts.filter((p) => p[0] === 'Head'), body = pts.filter((p) => p[0] !== 'Head');
  const hs = head.map((p) => p[2]).sort((a, b) => a - b);
  const cx = pts.reduce((a, p) => a + p[3], 0) / pts.length, cz = pts.reduce((a, p) => a + p[4], 0) / pts.length;
  return {
    H: Math.round(H), R: Math.round(R), headAt: Math.round(hy),
    top: Math.round(q(ys, 0.99)), bot: Math.round(q(ys, 0.01)), r50: Math.round(q(ds, 0.5)), r90: Math.round(q(ds, 0.9)), rMax: Math.round(q(ds, 0.995)), band90: Math.round(q(band, 0.9)),
    inside: +inside.toFixed(2), off: Math.round(Math.hypot(cx, cz)),
    head: head.length ? [Math.round(hs[0]), Math.round(q(hs, 0.5)), Math.round(hs[hs.length - 1])] : null,
    headAbove: head.length ? +(head.filter((p) => p[2] > hy).length / head.length).toFixed(2) : null,
    bodyAbove: +(body.filter((p) => p[2] > hy).length / Math.max(1, body.length)).toFixed(2),
  };
}
const seen = new Set(), list = [];
DATA.enemies.forEach((e, i) => { const k = (e.model || e.art) + '|' + e.ai + '|' + e.scale; if (!seen.has(k)) { seen.add(k); list.push(['enemy', i, e.name, e.ai, e.model || e.art]); } });
DATA.bosses.forEach((b, i) => list.push(['boss', i, b.name, b.ai || '', b.model || b.art]));
window.__hbList = list; window.__hbOut = out; window.__hbMeasure = measure;
return list.length;
})()
