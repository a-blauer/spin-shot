# The Unblinking (boss, vortex): a floating pod that is one great eye. A faceted, ridged shell of cap with spines along
# its ridges, opened at the front by heavy angular lids, upper and lower, that never close; in the socket one huge lit eye
# with a slit pupil (the game's eye mesh); a fringe of thick barbed grasping tendrils under it.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

reset(); parts = []
NR = 10
TAIL = Part('Tail', [0, 70, 0])
for i in range(9):
    a = i * 0.698; x, z = math.cos(a) * 36, math.sin(a) * 36
    pts = [(x, 86, z), (x * 1.3, 54, z * 1.3), (x * 1.12, 24, z * 1.12), (x * 1.45, 2, z * 1.45), (x * 1.6, -6, z * 1.6)]
    t, _ = fuse([(skin(pts, [7, 5.6, 4.2, 2.6, 1.2], sub=2, name='tendril'), None)], voxel=0.8, smooth=2, tris=0, name='tendril')
    sharpen(t, Vector(pts[3]), Vector(pts[4]) + Vector((x, 0, z)).normalized() * 5, 4)
    TAIL.add(t, lambda m, n: ROOT if n.y > -0.3 else ROOT_D, 300)
    for k, u in enumerate((0.35, 0.65)):
        p = Vector(pts[1]).lerp(Vector(pts[2]), u); o = Vector((math.cos(a + 0.5 * (k - 0.5)), -0.5, math.sin(a + 0.5 * (k - 0.5)))).normalized()
        TAIL.add(skin([tuple(p), tuple(p + o * 8)], [2, 0.1], sub=1, name='barb'), lambda m, n: ROOT_D, 12)
parts.append(TAIL)

BODY = Part('Body', [0, 130, 0])
shell = lathe([(0, 224), (16, 220), (40, 208), (62, 188), (78, 162), (84, 136), (80, 110), (66, 88), (44, 72), (20, 64), (0, 62)], seg=20, name='shell')
def _rid(v):
    a = math.atan2(v.z, v.x); k = 1 + 0.08 * (abs(math.cos(a * NR / 2)) * 2 - 1); return Vector((v.x * k, v.y, v.z * k))
deform(shell, _rid)
carve(shell, blob((0, 132, 78), (50, 38, 40), seg=32, name='socket'))     # the socket the eye sits in
def shell_paint(m, n):
    if m.z > 30 and Vector((m.x / 52, (m.y - 132) / 40, 0)).length < 1.02 and n.z < 0.6: return MOUTH
    if n.y < -0.5: return FLESH(0.85)
    a = math.atan2(m.z, m.x); return mix(CAP(1), ROOT_D, 0.35) if abs(math.cos(a * NR / 2)) < 0.3 else CAP(1)
BODY.add(shell, shell_paint, 3000); pj = projector(shell)
for s in (-1, 1):                                                    # the lids: heavy angular plates, upper and lower
    lid = skin([(-52, 132 + s * 34, 50), (-26, 132 + s * 46, 62), (0, 132 + s * 50, 66), (26, 132 + s * 46, 62), (52, 132 + s * 34, 50)], [9, 12, 13, 12, 9], sub=1, name='lid')
    BODY.add(lid, lambda m, n: mix(CAP(1), ROOT_D, 0.45) if n.y * (1 if m.y > 132 else -1) < -0.2 else CAP(0.8), 500)
    for k in range(7):                                               # lashes of spines along the lid
        x = -42 + k * 14; y = 132 + s * (40 + 10 * (1 - (x / 52) ** 2)); b = Vector((x, y, 64 - abs(x) * 0.2))
        BODY.add(skin([tuple(b), tuple(b + Vector((x * 0.08, s * 12, 8)))], [2.6, 0.15], sub=1, name='lash'), lambda m, n: ROOT_D, 14)
for k in range(NR):                                                  # spines along the ridges
    a = k * 2 * math.pi / NR
    if math.sin(a) > 0.6: continue
    for y in (190, 150, 108):
        r = 72 if y != 150 else 88; c = Vector((math.cos(a) * r, y, math.sin(a) * r)); o = Vector((math.cos(a), (y - 140) / 80, math.sin(a))).normalized()
        h = pj.ray_cast(c + o * 40, -o, 80)
        if h[0] is not None: BODY.add(skin([tuple(h[0] - o * 2), tuple(h[0] + o * 9), tuple(h[0] + o * 18)], [4.5, 2.6, 0.15], sub=1, name='spine'), lambda m, n: mix(CAP(1), ROOT_D, 0.5), 30)
rot_patch(BODY.add, pj, (-50, 200, -30), (-0.5, 0.8, -0.3), 14, 3)
sore(BODY.add, pj, (70, 120, -30), (0.9, 0, -0.4), 8, 6)
parts.append(BODY)

EYE = [{'at': [0, 132, 42], 'r': 38, 's': 1, 'out': [0, 0, 1]}]
HEAD = Part('Head', [0, 132, 42], eyes=EYE)
HEAD.add(blob((0, 132, 36), (40, 36, 14), name='sclera'), lambda m, n: MOUTH, 300)
parts.append(HEAD)

export('B_Unblinking', parts, out_path('B_Unblinking'), height=200)
