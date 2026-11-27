# Sporeling, redesigned lean and angular (not round): a wiry hunched sprinter of root. An open ribcage of root with the
# blight glowing inside it, spines down its back, long arms ending in long sharp fingers, digitigrade legs on pointed
# toes, and for a head a long forward-pointing hood of a cap, its rim fringed with points, the face sunk in its shadow:
# glowing eyes and a jaw of jagged teeth.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

reset(); parts = []
root = lambda m, n: ROOT if n.y > -0.4 else ROOT_D

# ---------------------------------------------------------------- body: pelvis, a spine, an open ribcage, the glow inside
BODY = Part('Body', [0, 88, -4])
pieces = [(skin([(0, 90, -4), (0, 104, -8), (0, 118, -10), (0, 134, -6), (0, 146, 6), (0, 152, 16)], [(14, 11), (9.6, 8.4), (8.6, 7.4), (8.6, 7.4), (10.4, 9.2), (9.2, 8)], sub=2, name='spine'), root),
          (blob((0, 92, -3), (15, 10, 12), name='pelvis'), root),
          (skin([(0, 120, 12), (0, 132, 14), (0, 142, 16)], [3.6, 4.2, 4.0], sub=1, name='sternum'), root)]
for s in (-1, 1):
    pieces.append((blob((s * 16, 142, 8), (8, 8, 8), name='shoulder'), root))
    pieces.append((blob((s * 12, 90, -4), (9, 9, 9), name='hip'), root))
    for k, y in enumerate((120, 127, 134, 141)):                  # ribs: from the spine round the side to the sternum
        w = 14 + k * 1.2
        pieces.append((skin([(s * 4, y - 4, -10 + k * 1.5), (s * w, y - 2, -4 + k), (s * (w + 1), y - 4, 6 + k), (s * 5, y - 8, 13 + k * 0.6)], [2.6, 2.4, 2.4, 2.2], sub=1, name='rib'), root))
body, bp = fuse(pieces, voxel=0.7, smooth=3, tris=3200, name='body')
BODY.add(body, bp)
BODY.add(blob((0, 128, 2), (9, 10, 8), name='heart'), lambda m, n: GLOW(1), 160)        # the blight burning inside
pj = projector(body)
spikes(BODY, pj, [(0, 150, 4), (0, 144, -6), (0, 136, -12), (0, 126, -14), (0, 116, -13), (0, 106, -11)], lambda p: (0, 0.5, -1), 10, 2.6, lambda m, n: ROOT_D)
sore(BODY.add, pj, (12, 96, 6), (0.6, 0, 1), 3.2, 11)
rot_patch(BODY.add, pj, (-12, 94, -8), (-1, 0, -0.4), 5, 14)
parts.append(BODY)

# ---------------------------------------------------------------- legs: digitigrade, the hock high, three pointed toes
def leg(s):
    X = lambda x: s * x
    pts = [(X(13), 92, -4), (X(15), 60, 12), (X(14), 30, -10), (X(14), 6, 2)]; rad = [12, 8.6, 6.6, 5.6]
    edges = [(0, 1), (1, 2), (2, 3)]
    tips = digits(pts, rad, edges, 3, [([(X(14 + k * 3.5), 4, 9), (X(14 + k * 5), 2.4, 15), (X(14 + k * 6), 1.0, 22)], 3.2) for k in (-1, 0, 1)])
    ob, paint = solid_limb(pts, rad, edges, [((X(13), 91, -4), 9)], tips, root, 1000, sharp_r=5, floor=0.8)
    P = Part('LegFront' if s > 0 else 'LegBack', [X(13), 88, -4]); P.add(ob, paint)
    pl = projector(ob)
    P.add(ribbon(pl, [(X(17), 84, 0), (X(19), 70, 8), (X(18), 56, 12)], 1.6, lambda p: (s, 0, 0.3)), lambda m, n: OOZE)
    return P

# ---------------------------------------------------------------- arms: long, thin, three long sharp fingers and a thumb
def arm(s):
    X = lambda x: s * x
    pts = [(X(16), 142, 8), (X(27), 112, 14), (X(30), 80, 28), (X(30), 72, 32)]; rad = [7.8, 6.4, 5.2, 5.2]
    edges = [(0, 1), (1, 2), (2, 3)]
    tips = digits(pts, rad, edges, 3, [([(X(30 + k * 3), 64, 38), (X(30 + k * 4), 55, 42), (X(30 + k * 4.6), 45, 44)], 2.6) for k in (-1, 0, 1)] +
                  [([(X(26), 68, 36), (X(24), 60, 41)], 2.4)])
    ob, paint = solid_limb(pts, rad, edges, [((X(16), 142, 8), 7.5)], tips, root, 1100, sharp_r=4.5)
    P = Part('ArmFront' if s > 0 else 'ArmBack', [X(14), 141, 10]); P.add(ob, paint)
    pa = projector(ob)
    sore(P.add, pa, (X(28), 104, 16), (s, 0, 0.3), 2.6, 30 + s)
    return P
parts += [leg(-1), leg(1), arm(-1), arm(1)]

# ---------------------------------------------------------------- head: a long pointed hood over a sunken face
EYES = [{'at': [s * 6.2, 156, 39], 'r': 3.4, 'out': [s * 0.35, 0.05, 0.94], 's': s} for s in (-1, 1)]
HEAD = Part('Head', [0, 150, 18], eyes=EYES)
hood = blob((0, 167, 20), (21, 17, 36), name='hood')
def _hood(v):
    u = max(0.0, min(1.0, (v.z + 16) / 72))
    x = v.x * (1 - 0.55 * u)
    dy = v.y - 167
    if dy < 0: dy *= 0.3                                           # a flat shelf underneath, the face sheltered by it
    y = 167 + dy * (1 - 0.45 * u) - 16 * u * u
    return Vector((x, y, v.z))
deform(hood, _hood)
sharpen(hood, Vector((0, 156, 44)), Vector((0, 146, 70)), 10)
def hood_paint(m, n):
    if n.y < -0.3: return GILL_A
    return mix(CAP(1), ROT, 0.5) if m.z < 0 else CAP(1)
HEAD.add(hood, hood_paint, 1800)
ph = projector(hood)
for k, (a, t, r) in enumerate([(0.4, 0.3, 4), (2.2, 0.5, 3.2), (4.0, 0.35, 3.6)]):
    c = Vector((math.cos(a) * 9 * t * 2, 190, 16 + math.sin(a) * 30 * t))
    hit = ph.ray_cast(c, Vector((0, -1, 0)), 80)
    if hit[0] is not None: HEAD.add(decal(ph, hit[0], hit[1], r, seg=16, rings=2, lift=0.4), lambda m, n: GLOW(1))
rot_patch(HEAD.add, ph, (-10, 172, 0), (-0.6, 1, -0.4), 7, 50)
# a fringe of points hanging off the hood's rim
fr = [(s * w, 158, z) for s in (-1, 1) for w, z in ((16, 4), (14, 16), (11, 28), (7, 40))] + [(0, 160, -8)]
spikes(HEAD, ph, fr, lambda p: (p.x * 0.04, -1, 0), 7, 2.2, lambda m, n: ROOT_D)
face = [(blob((0, 153, 28), (10, 8, 13), name='face'), lambda m, n: C(0x2a1c14)), (blob((0, 150, 18), (9, 9, 9), name='neck'), lambda m, n: C(0x2a1c14)),
        (blob((0, 143.5, 30), (8.5, 4.2, 10), rot=(0.15, 0, 0), name='jaw'), lambda m, n: ROOT_D)]
fo, fp = fuse(face, voxel=0.6, smooth=3, tris=900, name='face')
HEAD.add(fo, fp)
HEAD.add(blob((0, 147.5, 36), (5.5, 2.4, 5), name='mouth'), lambda m, n: MOUTH, 60)
for i, x in enumerate((-6, -3.6, -1.2, 1.2, 3.6, 6)):              # jagged teeth, top row down and bottom row up
    z = 39.5 - abs(x) * 0.8; L = 4.2 if i in (0, 5) else 3
    HEAD.add(skin([(x, 150.5, z), (x * 1.02, 150.5 - L, z + 0.6)], [1.0, 0.1], sub=1, name='t'), lambda m, n: TOOTH, 20)
    HEAD.add(skin([(x * 0.9, 145, z - 1), (x * 0.92, 145 + L * 0.8, z - 0.4)], [0.9, 0.1], sub=1, name='t'), lambda m, n: TOOTH, 20)
parts.append(HEAD)

export('Sporeling', parts, out_path('Sporeling'), height=185)
