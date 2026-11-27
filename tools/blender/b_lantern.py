# The Lamplighter (boss, decoy): an anglerfish grown out of a puffball. A dark faceted bulb that is mostly mouth: a heavy
# skull over a huge jutting underjaw, the gape between packed with long needle teeth, two small mean eyes high up, a
# spined fin of gill-frill down its back, a finned tail; over its front on a long arching stalk the lure, a lit pod.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

ANG, ANG2, ANG3 = C(0x2a2a34), C(0x3c3a48), C(0x1c1c24)
reset(); parts = []
angp = lambda m, n: ANG2 if n.y > 0.5 else (ANG3 if n.y < -0.5 else ANG)

TAIL = Part('Tail', [0, 96, -60])
tt, _ = fuse([(skin([(0, 104, -46), (0, 100, -80), (0, 98, -112), (0, 98, -124)], [(24, 28), (16, 20), (9, 12), (5, 7)], sub=2, name='tail'), None)], voxel=0.9, smooth=2, tris=900, name='tail')
TAIL.add(tt, angp)
TAIL.add(fan((0, 98, -116), [(0, 150, -128), (0, 138, -152), (0, 112, -158), (0, 84, -158), (0, 58, -150), (0, 46, -128)], t=1.8, scallop=0.25), lambda m, n: CAP(1), 200)
for p in ((0, 150, -128), (0, 138, -152), (0, 112, -158), (0, 84, -158), (0, 58, -150), (0, 46, -128)):
    TAIL.add(skin([(0, 98, -116), p], [2.6, 0.4], sub=1, name='ray'), lambda m, n: mix(CAP(1), ROOT_D, 0.5), 30)
parts.append(TAIL)

EYES = [{'at': [s * 30, 154, 62], 'r': 6.5, 's': s, 'out': [s * 0.5, 0.1, 0.86]} for s in (-1, 1)]
BODY = Part('Body', [0, 100, 0], eyes=EYES)
skull = [(blob((0, 126, -4), (68, 54, 70), e=0.85, name='skull'), angp), (blob((0, 108, -30), (60, 50, 50), e=0.9, name='back'), angp)]
skull += [(blob((s * 56, 96, -18), (16, 22, 22), name='hinge'), angp) for s in (-1, 1)]
for s in (-1, 1): skull.append((blob((s * 30, 162, 56), (13, 4, 7), rot=(0.25, 0, -s * 0.4), name='brow'), lambda m, n: ANG3))
so, sp = fuse(skull, voxel=1.4, smooth=1, tris=2600, name='skull')
deform(so, lambda v: Vector((v.x, max(v.y, 98 + 0.0035 * v.x * v.x + 0.12 * max(0, v.z)), v.z)))   # the gape opens upward at the front   # cut flat across the gape
BODY.add(so, sp); ps = projector(so); seat_eyes(EYES, ps)
jaw = blob((0, 70, 14), (66, 30, 80), e=0.8, name='jaw')
deform(jaw, lambda v: Vector((v.x, min(v.y, 86 + 0.0035 * v.x * v.x) + 0.0045 * max(0, v.z) ** 2, v.z + max(0, v.z) * 0.12)))   # a scoop, curving up in front           # the underjaw juts forward
BODY.add(jaw, angp, 1600); pjw = projector(jaw)
BODY.add(blob((0, 92, 6), (58, 14, 62), name='gape'), lambda m, n: MOUTH, 300)                              # the dark inside
BODY.add(blob((0, 78, 0), (30, 26, 30), name='core'), angp, 200)                                             # holds jaw and skull together
def edge(pj, x, up, y0, zs=range(120, -10, -2), ymax=1e9):
    # the front edge of a jaw at x: scanning back from the front, the first z where a vertical ray (up or down) hits it
    for z in zs:
        h = pj.ray_cast(Vector((x, y0, z)), Vector((0, 1 if up else -1, 0)), 120)
        if h[0] is not None and h[0].y < ymax: return h[0]
    return None
for i in range(13):                                                   # long needle teeth, top row hanging, bottom row rising
    x = -54 + i * 9
    b = edge(ps, x, True, 60, range(66, -10, -2), ymax=136)
    if b is not None:
        L = 22 - abs(x) * 0.18; b = b - Vector((0, -1, 4))
        BODY.add(skin([tuple(b + Vector((0, 2, 0))), tuple(b + Vector((0, -L * 0.6, 2.5))), tuple(b + Vector((0, -L, 1)))], [2.8, 1.6, 0.12], sub=1, name='t'), lambda m, n: TOOTH, 20)
    if i % 2 == 0 and abs(x) < 52:
        b = edge(pjw, x + 4.5, False, 200)
        if b is not None:
            L = 17 - abs(x) * 0.12; b = b - Vector((0, 1, 4))
            BODY.add(skin([tuple(b - Vector((0, 2, 0))), tuple(b + Vector((0, L * 0.6, 2))), tuple(b + Vector((0, L, 0.5)))], [2.6, 1.4, 0.12], sub=1, name='t'), lambda m, n: TOOTH, 20)
# the dorsal fin: a spined frill down the back
fin_pts = [(0, 186, 20), (0, 192, -6), (0, 184, -32), (0, 166, -56), (0, 138, -74)]
BODY.add(fan((0, 156, -16), fin_pts, t=2, scallop=0.3), lambda m, n: CAP(1), 200)
for p in fin_pts: BODY.add(skin([(0, 156, -16), p], [3, 0.4], sub=1, name='spine'), lambda m, n: mix(CAP(1), ROOT_D, 0.5), 30)
for s in (-1, 1):                                                     # gill frills at the sides
    BODY.add(fan((s * 60, 120, -10), [(s * 70, 146, -22), (s * 84, 134, -32), (s * 88, 116, -34), (s * 80, 98, -26)], t=1.6, scallop=0.3), lambda m, n: CAP(0.85), 120)
for k in range(6):                                                    # little lit pores along the flank
    a = 2.6 + k * 0.22; BODY.add(decal(ps, (math.cos(a) * 68, 128, math.sin(a) * 68), (math.cos(a), 0, math.sin(a)), 2.6, seg=10, rings=1, lift=0.5), lambda m, n: GLOW(1))
    a2 = -a + math.pi; BODY.add(decal(ps, (math.cos(a2) * 68, 128, math.sin(a2) * 68), (math.cos(a2), 0, math.sin(a2)), 2.6, seg=10, rings=1, lift=0.5), lambda m, n: GLOW(1))
sore(BODY.add, ps, (-50, 140, 30), (-0.8, 0.2, 0.5), 6, 3)
rot_patch(BODY.add, ps, (40, 170, -20), (0.5, 0.8, -0.3), 12, 6)
parts.append(BODY)

HEAD = Part('Head', [0, 160, 10])
stalk_pts = [(0, 160, 10), (0, 196, 18), (0, 220, 40), (0, 226, 70), (0, 216, 98), (0, 204, 112)]
st, _ = fuse([(skin(stalk_pts, [6, 5, 4.4, 3.8, 3.2, 2.8], sub=2, name='stalk'), None)], voxel=0.6, smooth=2, tris=700, name='stalk')
HEAD.add(st, lambda m, n: ANG2)
lure = lathe([(0, 16), (7, 13), (12, 6), (13, 0), (10, -8), (4, -13), (0, -14)], seg=10, name='lure')
bake_world(transform(lure, Matrix.Translation((0, 192, 118))))
HEAD.add(lure, lambda m, n: GLOW(1) if -9 < m.y - 192 < 9 else FLESH(0.9), 200)
lc = lathe([(0, 6), (8, 4), (13, 0), (12, -1), (0, 0)], seg=10, name='lcap')
bake_world(transform(lc, Matrix.Translation((0, 206, 118))))
HEAD.add(lc, lambda m, n: CAP(1), 80)
for k in range(5):
    a = k * 2 * math.pi / 5 + 0.3
    HEAD.add(skin([(math.cos(a) * 5, 180, 118 + math.sin(a) * 5), (math.cos(a) * 8, 168 - (k % 2) * 6, 118 + math.sin(a) * 8)], [1.4, 0.2], sub=1, name='feeler'), lambda m, n: FLESH(0.8), 14)
parts.append(HEAD)

export('B_Lantern', parts, out_path('B_Lantern'), height=200)
