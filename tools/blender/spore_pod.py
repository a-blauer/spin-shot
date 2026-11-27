# Spore Pod (Totem): a clutch of pods on a mat of mycelium, faceted and ridged like bulbs with pointed tips, each split
# by a lit seam; the big one in the middle stands tall, split down its front by a glowing seam lined with teeth, a crown
# of points round its tip. Rotting at the base.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

reset(); parts = []
MAT = FLESH(0.7)
def pod(c, r, h, seg=8, lean=(0, 0)):
    ob = lathe([(0, h), (r * 0.18, h * 0.9), (r * 0.7, h * 0.62), (r, h * 0.36), (r * 0.9, h * 0.12), (r * 0.5, 0), (0, -1)], seg=seg, name='pod')
    def rid(v):
        a = math.atan2(v.z, v.x); k = 1 + 0.12 * (abs(math.cos(a * seg / 2)) * 2 - 1); return Vector((v.x * k, v.y, v.z * k))
    deform(ob, rid)
    ob.matrix_world = Matrix.Translation(c) @ Matrix.Rotation(lean[0], 4, 'X') @ Matrix.Rotation(lean[1], 4, 'Z'); bake_world(ob)
    return ob
BODY = Part('Body', [0, 0, 0])
mat = blob((0, 1, 0), (54, 6, 54), e=0.7, name='mat')
deform(mat, lambda v: Vector((v.x, max(v.y, 0), v.z)))
BODY.add(mat, lambda m, n: MAT if n.y > 0.3 else mix(MAT, ROOT_D, 0.5), 400)
pm = projector(mat)
for k in range(12):                                          # roots of mycelium creeping out over the floor
    a = k * 0.52 + 0.2; L = 60 + (k % 3) * 12
    BODY.add(skin([(math.cos(a) * 36, 4, math.sin(a) * 36), (math.cos(a + 0.12) * L * 0.8, 2, math.sin(a + 0.12) * L * 0.8), (math.cos(a + 0.05) * L, 0.6, math.sin(a + 0.05) * L)], [2.8, 1.8, 0.2], sub=1, name='root'), lambda m, n: MAT, 30)
for i, (x, z, r) in enumerate(((-28, 14, 13), (24, 18, 11), (30, -18, 14), (-22, -26, 12), (2, -34, 9))):
    o = pod((x, 2, z), r, r * 2.4, seg=7, lean=(0.15 * math.sin(i * 2), 0.18 * math.cos(i * 3)))
    BODY.add(o, lambda m, n: CAP(1) if n.y > -0.3 else mix(CAP(1), ROOT_D, 0.5), 220)
    po = projector(o)
    BODY.add(ribbon(po, [(x, r * 2.0, z + r * 0.4), (x + 0.5, r * 1.4, z + r * 0.8), (x, r * 0.7, z + r * 0.85)], 1.8, lambda p, x=x, z=z: (p.x - x, 0, p.z - z), lift=0.5), lambda m, n: GLOW(1))
rot_patch(BODY.add, pm, (-36, 6, -4), (0, 1, 0), 10, 3)
rot_patch(BODY.add, pm, (30, 6, 30), (0, 1, 0), 8, 6)
parts.append(BODY)

TEETH = []
HEAD = Part('Head', [0, 30, 0])
big = pod((0, 20, 0), 21, 62, seg=9)
HEAD.add(big, lambda m, n: CAP(1) if n.y > -0.3 else mix(CAP(1), ROOT_D, 0.5), 900)
pb = projector(big)
HEAD.add(decal(pb, (0, 52, 20), (0, 0, 1), 11, seg=30, rings=3, lift=0.5, squash=(0.42, 1.35), wobble=0.08, seed=2), lambda m, n: MOUTH)
HEAD.add(decal(pb, (0, 52, 20), (0, 0, 1), 4.2, seg=16, rings=1, lift=0.8, squash=(0.5, 2.6), seed=3), lambda m, n: GLOW(1))
for i in range(8):                                            # teeth along both lips of the seam
    y = 40 + i * 3.4; s = 1 if i % 2 else -1
    h = pb.ray_cast(Vector((s * 4.2, y, 60)), Vector((0, 0, -1)), 80)
    if h[0] is not None: HEAD.add(skin([tuple(h[0] - h[1] * 0.4), tuple(h[0] + h[1] * 1.4 + Vector((-s * 3.6, 0, 0)))], [1.6, 0.1], sub=1, name='t'), lambda m, n: TOOTH, 14)
for i in range(6):
    a = i * math.pi / 3 + 0.3; b = Vector((math.cos(a) * 4.5, 78, math.sin(a) * 4.5)); o = Vector((math.cos(a), 1.4, math.sin(a))).normalized()
    HEAD.add(skin([tuple(b - o), tuple(b + o * 9)], [2.2, 0.1], sub=1, name='crown'), lambda m, n: mix(CAP(1), ROOT_D, 0.5), 16)
sore(HEAD.add, pb, (-17, 36, -6), (-1, 0, -0.3), 4, 9)
parts.append(HEAD)

export('SporePod', parts, out_path('SporePod'), height=64, lean=0.0)
