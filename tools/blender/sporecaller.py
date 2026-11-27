# Sporecaller (Priest): the veiled one. A tall faceted cone of pale mycelium veil falling almost to the floor in broad
# folds, its hem torn into points, root feet showing under it; wide sleeves with long-fingered root hands; a tall
# pointed morel cap, pitted like a honeycomb, the face sunk in its shadow; in one hand a crooked root staff hung with a
# lit spore lantern. Rotting at the hem.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from bkit import _obj

VEIL, VEIL_D, HEM = C(0xcfc6ae), C(0xa89e86), FLESH(0.8)
DARK = C(0x241a14)
reset(); parts = []
for s in (-1, 1):
    P, _ = root_leg(s, [s * 12, 60, 0], (s * 12, 64, 0), (s * 13, 36, 4), (s * 12, 11, 2), [9, 7.5, 6], toes=3, toe_len=15)
    parts.append(P)

# the veil: a faceted cone, broad folds, the hem torn into points, hollow inside
BODY = Part('Body', [0, 60, 0])
NF = 7
def veil_r(y, a):
    t = max(0.0, min(1.0, (168 - y) / 146)); fold = (abs(math.cos(a * NF / 2)) * 2 - 1) * 4.5 * t
    return 16 + t * 31 + fold
bm = bmesh.new(); rings = []
SEG = 28
for j, y in enumerate((170, 150, 126, 100, 74, 48, 30)):
    ring = []
    for i in range(SEG):
        a = i * 2 * math.pi / SEG; r = veil_r(y, a)
        yy = y
        if j == 6: yy = 30 - (14 if i % 2 == 0 else 2) - 6 * max(0, math.sin(a * 3 + 1))      # the torn hem
        ring.append(bm.verts.new((math.cos(a) * r, yy, math.sin(a) * r)))
    rings.append(ring)
inner = [bm.verts.new((math.cos(i * 2 * math.pi / SEG) * (veil_r(40, i * 2 * math.pi / SEG) - 3), 46, math.sin(i * 2 * math.pi / SEG) * (veil_r(40, i * 2 * math.pi / SEG) - 3))) for i in range(SEG)]
top = bm.verts.new((0, 172, 0)); roof = bm.verts.new((0, 60, 0))
for j in range(len(rings) - 1):
    for i in range(SEG):
        k = (i + 1) % SEG; bm.faces.new((rings[j][i], rings[j][k], rings[j + 1][k], rings[j + 1][i]))
for i in range(SEG):
    k = (i + 1) % SEG
    bm.faces.new((top, rings[0][k], rings[0][i]))
    bm.faces.new((rings[-1][i], rings[-1][k], inner[k], inner[i]))
    bm.faces.new((inner[i], inner[k], roof))
bm.normal_update()
veil = _obj('veil', bm)
def veil_paint(m, n):
    if n.y < -0.3: return DARK
    a = math.atan2(m.z, m.x); fold = abs(math.cos(a * NF / 2))
    if m.y < 34: return mix(HEM, ROT, 0.35)
    if m.y < 42: return HEM
    return VEIL if fold > 0.3 else VEIL_D
BODY.add(veil, veil_paint)
for s in (-1, 1): BODY.add(blob((s * 12, 64, 0), (11, 11, 11), name='hipsock'), lambda m, n: DARK, 120)          # hip sockets inside the veil
BODY.add(blob((0, 166, 2), (12, 10, 12), name='necksock'), lambda m, n: DARK, 120)
pv = projector(veil)
collar = lathe([(17, 4), (21, 1.5), (21, -1.5), (17, -4)], seg=14, name='collar')
bake_world(transform(collar, Matrix.Translation((0, 164, 1))))
BODY.add(collar, lambda m, n: FLESH(0.75), 140)
for i, (a, y, r) in enumerate(((2.0, 52, 8), (4.4, 46, 7), (0.6, 64, 5))):
    rr = veil_r(y, a); rot_patch(BODY.add, pv, (math.cos(a) * rr, y, math.sin(a) * rr), (math.cos(a), 0, math.sin(a)), r, 10 + i * 3)
BODY.add(ribbon(pv, [(math.cos(1.2) * veil_r(y, 1.2), y, math.sin(1.2) * veil_r(y, 1.2)) for y in (40, 60, 80, 96)], 2.6, lambda p: (p.x, 0, p.z), lift=0.6), lambda m, n: OOZE)
for k in range(5):                                                      # glowing spores clinging to the veil
    a = k * 1.3 + 0.4; y = 70 + k * 16; rr = veil_r(y, a)
    BODY.add(decal(pv, (math.cos(a) * rr, y, math.sin(a) * rr), (math.cos(a), 0, math.sin(a)), 2.4, seg=10, rings=1, lift=0.5), lambda m, n: GLOW(1))
parts.append(BODY)

# arms: a wide sleeve, a long-fingered root hand out of it
def sleeve(s):
    return skin([(s * 18, 161, 2), (s * 24, 142, 6), (s * 28, 124, 11)], [(9, 9), (11, 11), (13.5, 13.5)], sub=1, name='sleeve')
def sleeve_paint(m, n): return HEM if m.y < 128 else VEIL
PB, _ = root_arm(-1, [-16, 160, 2], (-18, 160, 2), (-26, 136, 8), (-28, 114, 14), [6, 5, 4.4], fingers=3, f_len=14)
PB.add(sleeve(-1), sleeve_paint, 400); parts.append(PB)
PF, _ = root_arm(1, [16, 160, 2], (18, 160, 2), (26, 140, 10), (30, 122, 18), [6, 5, 4.6], fingers=3, f_len=10, curl=(-1, 0, 0.3))
PF.add(sleeve(1), sleeve_paint, 400)
# the staff: a crooked root through the fist, a hook at the top, the lantern hanging from it
X, Z = 30, 18
st = skin([(X + 1, 28, Z), (X - 1, 70, Z + 1), (X + 1.5, 110, Z), (X, 150, Z + 1), (X + 1, 168, Z), (X + 6, 176, Z), (X + 13, 174, Z), (X + 15, 168, Z)], [3.2, 2.8, 2.8, 2.7, 2.6, 2.4, 2.2, 1.6], sub=1, name='staff')
PF.add(st, lambda m, n: ROOT_D, 260)
L = Vector((X + 15, 148, Z))
PF.add(skin([(X + 15, 168, Z), (X + 15, 158, Z)], [0.9, 0.9], sub=1, name='chain'), lambda m, n: BLACK, 20)
lan = lathe([(0, 9), (4, 8.5), (7, 3), (7.5, -2), (5, -7), (0, -8)], seg=8, name='lantern')
bake_world(transform(lan, Matrix.Translation(L)))
PF.add(lan, lambda m, n: GLOW(1) if abs(n.y) < 0.6 else ROOT_D, 120)
cp = lathe([(0, 4), (5, 3), (8.5, 0), (8, -1), (0, -0.5)], seg=8, name='lcap')
bake_world(transform(cp, Matrix.Translation(L + Vector((0, 9, 0)))))
PF.add(cp, lambda m, n: CAP(1), 60)
for k in range(4):
    a = k * math.pi / 2 + 0.4
    PF.add(skin([tuple(L + Vector((math.cos(a) * 7.6, 6, math.sin(a) * 7.6))), tuple(L + Vector((math.cos(a) * 7.6, -6, math.sin(a) * 7.6)))], [0.9, 0.9], sub=1, name='bar'), lambda m, n: ROOT_D, 20)
parts.append(PF)

# head: a dark face in shadow, a tall pitted morel over it
EYES = [{'at': [s * 5, 177.5, 12.2], 'r': 2.8, 's': s, 'out': [s * 0.3, 0.05, 0.95]} for s in (-1, 1)]
HEAD = Part('Head', [0, 168, 3], eyes=EYES)
fo, fp = fuse([(skin([(0, 160, 3), (0, 176, 4), (0, 190, 4)], [11, 12, 12], sub=2, name='neck'), lambda m, n: DARK)] +
              [(blob((s * 5.5, 181, 11.5), (5, 1.8, 3), rot=(0, 0, s * 0.45), name='brow'), lambda m, n: DARK) for s in (-1, 1)], voxel=0.5, smooth=2, tris=900, name='face')
HEAD.add(fo, fp)
mor = lathe([(0, 252), (4, 248), (10, 236), (16, 220), (21, 204), (25, 192), (27, 186), (24, 184), (12, 186), (0, 188)], seg=12, name='morel')
def _twist(v):
    a = math.atan2(v.z, v.x); r = math.hypot(v.x, v.z); k = 1 + 0.06 * math.sin(a * 6 + v.y * 0.15)
    return Vector((v.x * k, v.y, v.z * k + 3))
deform(mor, _twist)
def morel_paint(m, n):
    if n.y < -0.4: return DARK
    a = math.atan2(m.z - 3, m.x); u = a * 6 / math.pi + (m.y / 11) % 2 * 0.5; v = m.y / 11
    pit = (abs((u % 1) - 0.5) < 0.32) and (abs((v % 1) - 0.5) < 0.32)
    return mix(CAP(0.6), DARK, 0.45) if pit else CAP(1)
HEAD.add(mor, morel_paint, 1600)
parts.append(HEAD)

export('Sporecaller', parts, out_path('Sporecaller'), height=235)
