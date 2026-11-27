# Shrieker (Screamer): a tall faceted funnel-cap opening upward like a horn, its rim torn, its throat ribbed and lit, on a
# thick root stalk; the face sits on the stalk just under the funnel: two glaring eyes over a stretched-open screaming
# mouth full of teeth. Rotting in places.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

reset(); parts = []
for s in (-1, 1):
    P, _ = root_leg(s, [s * 16, 48, 0], (s * 18, 52, 0), (s * 24, 30, 6), (s * 24, 12, 4), [17, 15, 12.5], toes=3, toe_len=22)
    parts.append(P)

BODY = Part('Body', [0, 50, 0])
st = skin([(0, 48, 0), (0, 74, 2), (0, 100, 2), (0, 124, 2), (0, 134, 3)], [(30, 26), (25, 22), (22, 19), (22, 19), (19, 17)], sub=2, name='stalk')
socks = [blob((s * 18, 50, 0), (17, 16, 17), name='hip') for s in (-1, 1)] + [blob((s * 20, 127, 2), (13, 13, 13), name='sho') for s in (-1, 1)]
body, bp = fuse([(st, lambda m, n: ROOT)] + [(o, lambda m, n: ROOT) for o in socks], voxel=0.9, smooth=3, tris=1800, name='body')
BODY.add(body, bp); pj = projector(body)
BODY.add(decal(pj, (0, 84, 24), (0, 0, 1), 18, seg=40, rings=6, lift=0.8, squash=(1, 1.6), wobble=0.06, seed=5), lambda m, n: FLESH(1))
for s in (-1, 1):
    BODY.add(ribbon(pj, [(s * 14, 124, 8), (s * 16, 108, 10), (s * 17, 92, 9), (s * 19, 74, 10), (s * 21, 58, 12)], 2.4, lambda p, s=s: (s * 0.6, 0, 1), lift=0.6), lambda m, n: FLESH(0.85))
sore(BODY.add, pj, (-10, 88, 14), (-0.4, 0, 1), 4.5, 3)
sore(BODY.add, pj, (12, 68, -14), (0.6, 0, -1), 3.6, 5)
rot_patch(BODY.add, pj, (14, 104, -10), (0.8, 0, -0.6), 7, 8)
for o in tuft((-15, 60, 14), (-0.5, 0, 1), 4, n=6, seed=3): BODY.add(o, lambda m, n: MOLD, 40)
parts.append(BODY)
for s in (-1, 1):
    P, _ = root_arm(s, [s * 15, 130, 2], (s * 22, 127, 2), (s * 36, 102, 12), (s * 40, 76, 20), [11, 9.5, 8.5], fingers=3, f_len=20)
    parts.append(P)

# head: the face on the upper stalk, the horn above it
EYES = [{'at': [s * 7.5, 152, 14.5], 'r': 4.0, 'out': [s * 0.35, 0.05, 0.94], 's': s} for s in (-1, 1)]
HEAD = Part('Head', [0, 150, 4], eyes=EYES)
pieces = [(skin([(0, 128, 3), (0, 146, 4), (0, 164, 4)], [20, 19, 17], sub=2, name='neck'), lambda m, n: ROOT_L)]
for s in (-1, 1):
    pieces.append((blob((s * 9, 158, 18), (9, 3, 5), rot=(0, 0, s * 0.5), name='brow'), lambda m, n: ROOT_D))
    pieces.append((blob((s * 13, 138, 14), (7, 9, 7), name='jaw'), lambda m, n: ROOT_L))
ho, hp = fuse(pieces, voxel=0.55, smooth=2, tris=1600, name='face')
HEAD.add(ho, hp)
ph = projector(ho); seat_eyes(EYES, ph, 0.3)
# the screaming mouth: a tall gaping oval, teeth round its edge
HEAD.add(decal(ph, (0, 139, 20), (0, 0, 1), 9, seg=28, rings=3, lift=0.5, squash=(0.8, 1.45), wobble=0.1, seed=4), lambda m, n: MOUTH)
for i in range(10):
    a = i * 2 * math.pi / 10 + 0.3; e = Vector((math.cos(a) * 7.4, 139 + math.sin(a) * 12.4, 40))
    h = ph.ray_cast(e, Vector((0, 0, -1)), 40)
    if h[0] is None: continue
    inw = Vector((-math.cos(a), -math.sin(a) * 1.4, 0)).normalized()
    HEAD.add(skin([tuple(h[0] - h[1] * 0.4), tuple(h[0] + h[1] * 1.2 + inw * 3.4)], [1.3, 0.12], sub=1, name='t'), lambda m, n: TOOTH, 16)
# the headpiece: three curved trumpet caps blaring up and out, ruffled bells, ribbed throats lit inside
def trumpet(pts, r0, r1, R, seed):
    P_ = [Vector(p) for p in pts]
    tube, _ = fuse([(skin([tuple(p) for p in P_], [r0 + (r1 - r0) * k / (len(P_) - 1) for k in range(len(P_))], sub=2, name='tube'), None)], voxel=0.7, smooth=2, tris=500, name='tube')
    HEAD.add(tube, lambda m, n: CAP(1) if n.y > -0.2 else mix(CAP(1), ROOT_D, 0.4))
    pt = projector(tube)
    for k in range(4):                                               # dark ribs round the tube
        t = 0.15 + k * 0.22; c = P_[1].lerp(P_[-1], t); d = (P_[-1] - P_[1]).normalized(); rl = r0 + (r1 - r0) * (0.33 + t * 0.67)
        ring = lathe([(rl - 1, 2.2), (rl + 1.4, 1.2), (rl + 1.4, -1.2), (rl - 1, -2.2)], seg=12, name='rib')
        ring.matrix_world = Matrix.Translation(c) @ Vector((0, 1, 0)).rotation_difference(d).to_matrix().to_4x4(); bake_world(ring)
        HEAD.add(ring, lambda m, n: mix(CAP(1), ROOT_D, 0.55), 60)
    bell = lathe([(0, 2), (R * 0.3, 4), (R * 0.65, 10), (R * 0.92, 16), (R, 18), (R + 1.5, 16.5), (R * 0.78, 10), (R * 0.45, 2), (r1, -4), (0, -4)], seg=18, name='bell')
    def ruff(v, R=R, seed=seed):
        rr = math.hypot(v.x, v.z)
        if rr < R * 0.7: return v
        a = math.atan2(v.z, v.x); t = (rr - R * 0.7) / (R * 0.4)
        return Vector((v.x, v.y + t * (3.5 * math.sin(a * 7 + seed) - 4 * max(0, math.sin(a * 3 + seed)) ** 3), v.z))
    deform(bell, ruff)
    d = (P_[-1] - P_[-2]).normalized()
    bell.matrix_world = Matrix.Translation(P_[-1] - d * 3) @ Vector((0, 1, 0)).rotation_difference(d).to_matrix().to_4x4(); bake_world(bell)
    E = P_[-1] - d * 3
    def bp(m, n, E=E, d=d, R=R):
        q = m - E; ax = q.dot(d); rad = (q - d * ax).length
        inside = n.dot(d) > 0.15 and rad < R * 0.95
        if inside: return GLOW(1) if int(ax / 4) % 2 == 0 else GLOW(0.55)
        return mix(CAP(1), ROT, 0.45) if rad > R * 0.85 else CAP(1)
    HEAD.add(bell, bp, 700)
    pb = projector(bell)
    rot_patch(HEAD.add, pb, tuple(E + d * 8 + d.orthogonal().normalized() * R * 0.8), tuple(d.orthogonal()), 4.5, seed, mold=(seed % 2 == 0))
trumpet([(0, 160, 0), (0, 178, -2), (0, 198, -8), (2, 220, -18)], 9, 11, 24, 1)
trumpet([(-6, 160, 2), (-16, 174, 0), (-30, 188, -2), (-44, 198, -6)], 7.5, 9, 18, 2)
trumpet([(6, 160, 2), (16, 174, 0), (30, 188, -2), (44, 198, -6)], 7.5, 9, 18, 3)
coll = lathe([(10, 6), (17, 3), (19, -1), (14, -5), (10, -4)], seg=16, name='collar')
deform(coll, lambda v: Vector((v.x, v.y + 2.2 * math.sin(math.atan2(v.z, v.x) * 9), v.z)))
bake_world(transform(coll, Matrix.Translation((0, 164, 3))))
HEAD.add(coll, lambda m, n: GILL_B if n.y < -0.2 else mix(CAP(1), ROOT_D, 0.3), 300)
parts.append(HEAD)

export('Shrieker', parts, out_path('Shrieker'), height=220)
