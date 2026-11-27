# Grasping Mycel (Totem): a thick braid of three twisting strands of mycelium rising out of a mat, swaying, ending in a
# hooked claw of three long fingers drawn to sharp dark points; a few caps and lit pores along it. Rotting.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

reset(); parts = []
MYC, MAT = C(0xcfc4a8), FLESH(0.7)
myc = lambda m, n: MYC if n.y > -0.4 else mix(MYC, ROOT_D, 0.5)
def braid(y0, y1, r0, r1, twist0, n=10, rad=7.5):
    obs = []
    for i in range(3):
        pts = []
        for k in range(n + 1):
            t = k / n; y = y0 + (y1 - y0) * t; a = i * 2.094 + twist0 + t * 3.0; r = r0 + (r1 - r0) * t
            pts.append((math.cos(a) * r, y, math.sin(a) * r))
        obs.append(skin(pts, [rad * (1 - 0.15 * k / n) for k in range(n + 1)], sub=1, name='strand'))
    return obs
BODY = Part('Body', [0, 0, 0])
mat = blob((0, 1, 0), (50, 7, 50), e=0.7, name='mat'); deform(mat, lambda v: Vector((v.x, max(v.y, 0), v.z)))
BODY.add(mat, lambda m, n: MAT if n.y > 0.3 else mix(MAT, ROOT_D, 0.5), 400); pm = projector(mat)
for k in range(10):
    a = k * 0.63 + 0.1; L = 56 + (k % 3) * 12
    BODY.add(skin([(math.cos(a) * 30, 4, math.sin(a) * 30), (math.cos(a + 0.15) * L * 0.8, 2, math.sin(a + 0.15) * L * 0.8), (math.cos(a) * L, 0.6, math.sin(a) * L)], [3, 2, 0.2], sub=1, name='root'), lambda m, n: MAT, 30)
bo, bp = fuse([(o, myc) for o in braid(0, 80, 10, 7, 0)], voxel=0.8, smooth=2, tris=1600, name='braid')
BODY.add(bo, bp); pb = projector(bo)
grow_mushrooms(BODY, pb, [((12, 46, 6), (0.8, 0.6, 0.3), 5, 6.5), ((-8, 24, -10), (-0.7, 0.5, -0.5), 4, 5)])
BODY.add(decal(pb, (-8, 30, 8), (-0.6, 0, 1), 3.2, seg=12, rings=1, lift=0.6), lambda m, n: GLOW(1))
rot_patch(BODY.add, pm, (-30, 6, 14), (0, 1, 0), 9, 4)
sore(BODY.add, pb, (8, 62, -8), (0.6, 0, -1), 3.4, 7)
parts.append(BODY)

HEAD = Part('Head', [0, 70, 0])
pieces = [(o, myc) for o in braid(70, 134, 7, 4, 3.0, n=8, rad=6.5)] + [(blob((0, 138, 4), (11, 10, 11), name='palm'), lambda m, n: ROOT)]
tips = []
pts = [(0, 136, 4)]; rad = [9]; edges = []
for k in (-1, 0, 1):                                          # three long hooked fingers curling forward
    ch = [(k * 11, 150, 10), (k * 15, 156, 24), (k * 13, 146, 38), (k * 8, 132, 42)]
    i = len(pts); pts += ch; rad += [6, 4.8, 3.2, 1.6]; edges += [(0, i), (i, i + 1), (i + 1, i + 2), (i + 2, i + 3)]
    tips.append((Vector(ch[1]).lerp(Vector(ch[2]), 0.5), Vector(ch[3]) + (Vector(ch[3]) - Vector(ch[2])).normalized() * 4))
cl = skin(pts, rad, edges, sub=2, name='claw')
pieces.append((cl, lambda m, n: ROOT))
ho, hp = fuse(pieces, voxel=0.7, smooth=2, tris=0, name='head')
for a, b in tips: sharpen(ho, a, b, 4)
decimate(ho, 2200)
def hpaint(m, n):
    for a, b in tips:
        if (m - b).length < 7: return mix(ROOT_D, BLACK, 0.6)
    return hp(m, n)
HEAD.add(ho, hpaint); ph = projector(ho)
for k in (-1, 0, 1):
    HEAD.add(ribbon(ph, [(k * 11, 156, 14), (k * 15, 160, 24), (k * 13, 152, 36)], 1.6, lambda p: (0, 1, 0.2), lift=0.5), lambda m, n: MYC)
grow_mushrooms(HEAD, ph, [((-6, 118, 6), (-0.6, 0.6, 0.5), 5, 6)])
HEAD.add(decal(ph, (5, 100, 7), (0.5, 0, 1), 2.8, seg=12, rings=1, lift=0.6), lambda m, n: GLOW(1))
rot_patch(HEAD.add, ph, (6, 138, -8), (0.5, 0.3, -1), 6, 12)
parts.append(HEAD)

export('GraspingMycel', parts, out_path('GraspingMycel'), height=140, lean=0.0)
