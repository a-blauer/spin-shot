# The Mirror Queen (boss, reflect): tall and still under a wide flat parasol of a cap, faceted and polished to a shine,
# a spike at its crown, gills fanning beneath; a long gown of pale knife-pleated gills falling to the floor in points; a
# narrow bodice and a high collar; a long narrow face in the shade of the cap with two cold eyes; long thin arms held out,
# ending in very long sharp fingers.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from bkit import _obj
import bmesh

GOWN, GOWN_D, SHINE = C(0xd8d0c0), C(0xa89c88), C(0xf4f0e6)
DARK = C(0x241a14)
reset(); parts = []
for s in (-1, 1):
    P, _ = root_leg(s, [s * 12, 56, 0], (s * 12, 60, 0), (s * 13, 34, 3), (s * 12, 11, 2), [9, 7.5, 6], toes=3, toe_len=15)
    parts.append(P)

BODY = Part('Body', [0, 56, 0])
NP = 36                                                              # knife pleats round the gown
def gown_r(y, i):
    t = max(0.0, min(1.0, (168 - y) / 140)); base = 13 + t * 44
    return base + (5 * t if i % 2 == 0 else -2 * t)
bm = bmesh.new(); rings = []
for j, y in enumerate((172, 150, 124, 98, 72, 46, 28)):
    ring = []
    for i in range(NP):
        a = i * 2 * math.pi / NP; r = gown_r(y, i); yy = y
        if j == 6: yy = 28 - (16 if i % 2 == 0 else 4) - 5 * max(0, math.sin(a * 3))
        ring.append(bm.verts.new((math.cos(a) * r, yy, math.sin(a) * r)))
    rings.append(ring)
inner = [bm.verts.new((math.cos(i * 2 * math.pi / NP) * gown_r(40, i) * 0.9, 44, math.sin(i * 2 * math.pi / NP) * gown_r(40, i) * 0.9)) for i in range(NP)]
top = bm.verts.new((0, 176, 0)); roof = bm.verts.new((0, 62, 0))
for j in range(len(rings) - 1):
    for i in range(NP):
        k = (i + 1) % NP; bm.faces.new((rings[j][i], rings[j][k], rings[j + 1][k], rings[j + 1][i]))
for i in range(NP):
    k = (i + 1) % NP
    bm.faces.new((top, rings[0][k], rings[0][i])); bm.faces.new((rings[-1][i], rings[-1][k], inner[k], inner[i])); bm.faces.new((inner[i], inner[k], roof))
bm.normal_update()
gown = _obj('gown', bm)
def gown_paint(m, n):
    if n.y < -0.4: return DARK
    a = math.atan2(m.z, m.x); i = int(round(a / (2 * math.pi / NP))) % NP
    return GOWN if (n.x * math.cos(a) + n.z * math.sin(a)) > 0.92 else GOWN_D
BODY.add(gown, gown_paint)
for s in (-1, 1): BODY.add(blob((s * 12, 60, 0), (10, 10, 10), name='hipsock'), lambda m, n: DARK, 100)
pg = projector(gown)
# a narrow bodice of root laced over the top of the gown, a high pleated collar
BODY.add(skin([(0, 150, 0), (0, 166, 1), (0, 178, 2)], [(16, 12), (14, 10), (11, 9)], sub=2, name='bodice'), lambda m, n: ROOT, 400)
for k in range(12):
    a = k * math.pi / 6; b = Vector((math.cos(a) * 10, 180, math.sin(a) * 9 + 2)); o = Vector((math.cos(a), 1.6, math.sin(a))).normalized()
    BODY.add(skin([tuple(b), tuple(b + o * 13)], [(4.6, 0.8), (0.4, 0.4)], sub=1, name='collar'), lambda m, n: GOWN, 20)
for s in (-1, 1): BODY.add(blob((s * 15, 172, 2), (8, 8, 8), name='sho'), lambda m, n: ROOT, 120)
rot_patch(BODY.add, pg, (40, 40, 20), (0.9, 0, 0.4), 9, 3)
rot_patch(BODY.add, pg, (-30, 70, -34), (-0.6, 0, -0.8), 7, 6)
parts.append(BODY)

for s in (-1, 1):                                                    # long thin arms held out, very long sharp fingers
    P, _ = root_arm(s, [s * 15, 172, 2], (s * 16, 172, 2), (s * 52, 156, 14), (s * 82, 128, 22), [6, 5, 4], fingers=4, f_len=32, f_r=2.5, curl=(0, -1, 0.5), spread=0.7, thumb=False)
    parts.append(P)

EYES = [{'at': [s * 5.5, 196, 15], 'r': 3.2, 's': s, 'out': [s * 0.2, 0, 1]} for s in (-1, 1)]
HEAD = Part('Head', [0, 180, 2], eyes=EYES)
fo, fp = fuse([(skin([(0, 178, 2), (0, 194, 6), (0, 214, 6), (0, 224, 4)], [(9, 8), (11, 10), (10, 9), (8, 7)], sub=2, name='face'), lambda m, n: mix(FLESH(0.9), DARK, 0.35))] +
              [(blob((s * 6, 200, 13.5), (5.5, 1.8, 3), rot=(0, 0, s * 0.42), name='brow'), lambda m, n: DARK) for s in (-1, 1)], voxel=0.45, smooth=2, tris=1200, name='face')
HEAD.add(fo, fp); pf = projector(fo); seat_eyes(EYES, pf)
HEAD.add(decal(pf, (0, 186, 14), (0, -0.1, 1), 3.2, seg=14, rings=1, lift=0.4, squash=(1, 0.4)), lambda m, n: MOUTH)
par = lathe([(0, 244), (14, 242), (44, 236), (74, 230), (96, 226), (98, 223), (90, 221), (50, 224), (12, 226), (0, 226)], seg=12, name='parasol')
def _scal(v):
    r = math.hypot(v.x, v.z)
    if r < 80: return v
    a = math.atan2(v.z, v.x); s = abs(math.sin(a * 6)); return Vector((v.x, v.y - 5 * (1 - s) * (r - 80) / 18, v.z))
deform(par, _scal)
def par_paint(m, n):
    if n.y < -0.3: return GILL_B if int(math.atan2(m.z, m.x) * 18) % 2 else GILL_A
    r = math.hypot(m.x, m.z); a = math.atan2(m.z, m.x)
    if abs(math.sin(a * 3 + 0.4)) > 0.993 and r > 30: return SHINE                      # glints: it shines like a mirror
    return mix(CAP(1), SHINE, 0.25) if int(r / 22) % 2 == 0 else CAP(1)
HEAD.add(par, par_paint, 1600)
HEAD.add(skin([(0, 242, 0), (0, 254, 0), (0, 266, 0)], [4.5, 2.6, 0.2], sub=1, name='finial'), lambda m, n: mix(CAP(1), DARK, 0.4), 40)
HEAD.add(skin([(0, 222, 2), (0, 236, 2)], [5, 5], sub=1, name='stem'), lambda m, n: mix(FLESH(0.9), DARK, 0.35), 60)
pp = projector(par)
rot_patch(HEAD.add, pp, (-50, 240, -40), (0, 1, 0), 9, 20)
parts.append(HEAD)

export('B_MirrorQueen', parts, out_path('B_MirrorQueen'), height=250)
