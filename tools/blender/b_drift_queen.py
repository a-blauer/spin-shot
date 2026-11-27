# The Drift Queen (boss, swarm): a vast floating pod, faceted and ridged, wider than tall, a crown of tall caps on top, a
# mean face across its front under a heavy brow, lit buds all over its underside; below, on a thick stalk, a heavy round
# maw ringed with hooked teeth and lit deep inside; a curtain of thick glowing tendrils trailing under her, barbed.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

reset(); parts = []
NR = 10
def ridge(v, d=0.08):
    a = math.atan2(v.z, v.x); k = 1 + d * (abs(math.cos(a * NR / 2)) * 2 - 1); return Vector((v.x * k, v.y, v.z * k))

TAIL = Part('Tail', [0, 70, 0])
for i in range(7):
    a = i * 0.9; R = 30 + (i % 2) * 12; x, z = math.cos(a) * R, math.sin(a) * R
    pts = [(x, 82, z), (x * 1.12, 54, z * 1.12), (x * 0.95, 26, z * 0.95), (x * 1.06, 4, z * 1.06), (x * 1.1, -8, z * 1.1)]
    t, _ = fuse([(skin(pts, [5, 4.2, 3.4, 2.4, 1.2], sub=2, name='tendril'), None)], voxel=0.7, smooth=2, tris=0, name='tendril')
    sharpen(t, Vector(pts[3]), Vector(pts[4]) + Vector((0, -5, 0)), 3.6)
    TAIL.add(t, lambda m, n: FLESH(0.8), 260); pt = projector(t)
    for k, y in enumerate((60, 36, 14)):
        c = Vector((x * 1.05, y, z * 1.05)); o = Vector((math.cos(a), 0, math.sin(a)))
        TAIL.add(decal(pt, c, o, 2.6, seg=10, rings=1, lift=0.5), lambda m, n: GLOW(1))
        TAIL.add(skin([tuple(c + o * 2), tuple(c + o * 7 + Vector((0, -3, 0)))], [1.6, 0.1], sub=1, name='barb'), lambda m, n: ROOT_D, 12)
parts.append(TAIL)

EYES = [{'at': [s * 22, 152, 76], 'r': 9, 's': s, 'out': [s * 0.3, -0.1, 0.95]} for s in (-1, 1)]
BODY = Part('Body', [0, 110, 0], eyes=EYES)
pod = lathe([(0, 192), (18, 190), (44, 180), (68, 162), (82, 140), (84, 122), (76, 104), (56, 94), (26, 90), (0, 90)], seg=20, name='pod')
deform(pod, ridge)
pieces = [(pod, lambda m, n: FLESH(0.85) if n.y < -0.5 else (mix(CAP(1), ROOT_D, 0.35) if abs(math.cos(math.atan2(m.z, m.x) * NR / 2)) < 0.3 else CAP(1)))]
pieces.append((skin([(-40, 170, 66), (-18, 166, 76), (0, 158, 80), (18, 166, 76), (40, 170, 66)], [5, 7, 6, 7, 5], sub=1, name='brow'), lambda m, n: mix(CAP(1), ROOT_D, 0.5)))
pieces.append((blob((0, 92, 8), (26, 12, 26), name='socket'), lambda m, n: FLESH(0.9)))
bo, bp = fuse(pieces, voxel=1.2, smooth=1, tris=4200, name='pod')
BODY.add(bo, bp); pj = projector(bo); seat_eyes(EYES, pj)
# the scowl: a wide slot under the eyes, teeth along it
BODY.add(decal(pj, (0, 126, 82), (0, -0.2, 1), 30, seg=36, rings=3, lift=0.6, squash=(1, 0.3), wobble=0.1, seed=4), lambda m, n: MOUTH)
for i in range(9):
    x = -24 + i * 6; top = i % 2 == 0
    h = pj.ray_cast(Vector((x, 130 if top else 122, 140)), Vector((0, 0, -1)), 120)
    if h[0] is not None: HEAD_T = BODY.add(skin([tuple(h[0] - h[1] * 0.4), tuple(h[0] + h[1] * 1.6 + Vector((0, -6 if top else 6, 0)))], [2.6, 0.15], sub=1, name='t'), lambda m, n: TOOTH, 16)
for i in range(16):                                                   # lit buds over the underside
    a = i * 2.4; r = 20 + (i % 4) * 14; c = Vector((math.cos(a) * r, 92, math.sin(a) * r))
    h = pj.ray_cast(c + Vector((0, -40, 0)), Vector((0, 1, 0)), 80)
    if h[0] is None: continue
    BODY.add(lathe([(0, 6), (4.5, 4), (5, 0), (0, -1)], seg=7, name='bud'), lambda m, n: GLOW(1) if n.y < -0.3 else FLESH(0.9), 30)
    bake_world(transform(BODY.pieces[-1][0], Matrix.Translation(h[0]) @ Matrix.Rotation(math.pi, 4, 'X')))
grow_mushrooms(BODY, pj, [((math.cos(a) * 30, 190, math.sin(a) * 30 - 10), (math.cos(a) * 0.25, 1, math.sin(a) * 0.25), 26 + (i % 2) * 14, 15) for i, a in enumerate([k * 1.257 + 0.3 for k in range(5)])])
sore(BODY.add, pj, (-62, 140, 40), (-0.8, 0, 0.5), 8, 3)
rot_patch(BODY.add, pj, (60, 160, -40), (0.7, 0.4, -0.6), 14, 6)
rot_patch(BODY.add, pj, (-40, 176, -50), (-0.4, 0.8, -0.5), 11, 9)
BODY.add(ribbon(pj, [(70, 150, 30), (78, 136, 36), (80, 122, 40), (74, 108, 42)], 3.4, lambda p: (p.x, 0, p.z), lift=0.6), lambda m, n: OOZE)
parts.append(BODY)

HEAD = Part('Head', [0, 86, 12])
pieces = [(skin([(0, 96, 10), (0, 80, 16), (0, 64, 24)], [16, 18, 21], sub=2, name='stalk'), lambda m, n: FLESH(1))]
bell = lathe([(16, 14), (22, 6), (25, 0), (23, -6), (16, -8), (0, -6)], seg=12, name='maw')
bell.matrix_world = Matrix.Translation((0, 52, 30)) @ Matrix.Rotation(math.pi / 2, 4, 'X'); bake_world(bell)
pieces.append((bell, lambda m, n: FLESH(0.8)))
ho, hp = fuse(pieces, voxel=0.8, smooth=2, tris=1800, name='maw')
HEAD.add(ho, hp)
gul = lathe([(0, 2), (17, 1), (10, -10), (0, -12)], seg=12, name='gullet')
gul.matrix_world = Matrix.Translation((0, 52, 38)) @ Matrix.Rotation(math.pi / 2, 4, 'X'); bake_world(gul)
HEAD.add(gul, lambda m, n: GLOW(1) if math.hypot(m.x, m.y - 52) < 7 else MOUTH, 120)
for ring, (R, z, L, n) in enumerate(((17, 38, 9, 12), (11.5, 33, 6.5, 10))):
    for i in range(n):
        a = i * 2 * math.pi / n + ring * 0.3; c = Vector((math.cos(a) * R, 52 + math.sin(a) * R, z)); inw = Vector((-math.cos(a), -math.sin(a), -0.5)).normalized()
        HEAD.add(skin([tuple(c - inw), tuple(c + inw * L * 0.6 + Vector((0, 0, 1.5))), tuple(c + inw * L)], [3 - ring * 0.6, 1.8, 0.1], sub=1, name='t'), lambda m, n: TOOTH, 20)
parts.append(HEAD)

export('B_DriftQueen', parts, out_path('B_DriftQueen'), height=190)
