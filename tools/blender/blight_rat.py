# Blight Rat, after tools/blight/refs/blight_rat.png: a big hunched sewer rat in dull brown fur, three tall mushrooms
# with glowing spotted caps growing out of its back, a long pink tail curling up behind, a long snarling head with a
# glowing eye, big yellow incisors, round pink ears, and pink feet ending in sharp pointed toes. Rotting in places.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

FUR, FUR_D, FUR_L = C(0x6a5242), C(0x4a3a2e), C(0x9a826c)
SKIN, SKIN_D, INCISOR = C(0xc08272), C(0x9a5e52), C(0xe2c47a)
reset(); parts = []

# ---------------------------------------------------------------- body: a hunched barrel of fur
BODY = Part('Body', [0, 38, 0])
sk = skin([(0, 44, -38), (0, 54, -14), (0, 51, 12), (0, 52, 30)], [(27, 25), (31, 30), (26, 25), (17, 17)], sub=2, name='body')
socks = [blob((s * 17, 41, -28), (18, 18, 20), name='haunch') for s in (-1, 1)] + [blob((s * 13, 40, 20), (13, 13, 13), name='shoulder') for s in (-1, 1)]
fur = lambda m, n: FUR_L if (n.y < -0.35 or m.y < 30) else FUR
body, bp = fuse([(sk, fur)] + [(o, fur) for o in socks], voxel=1.0, smooth=6, tris=2600, name='body')
BODY.add(body, bp)
pj = projector(body)
# spiky clumps of fur down the spine and over the shoulders
spikes(BODY, pj, [(0, 70, z) for z in (-34, -26, 16, 24)] + [(s * 16, 66, z) for s in (-1, 1) for z in (-30, 12)], lambda p: (p.x * 0.03, 1, -0.9), 9, 3.2, lambda m, n: FUR_D)
# three tall mushrooms out of its back, caps glowing with spots
grow_mushrooms(BODY, pj, [((-16, 78, -26), (-0.45, 1, -0.2), 30, 19), ((2, 84, -8), (0.0, 1, 0.0), 40, 23), ((17, 76, 8), (0.5, 1, 0.2), 28, 18)], glow_spots=True)
sore(BODY.add, pj, (24, 46, -16), (1, 0, 0), 6, 3)
rot_patch(BODY.add, pj, (-22, 54, -2), (-1, 0.3, 0), 10, 6)
parts.append(BODY)

# ---------------------------------------------------------------- hind legs: a heavy haunch, a long foot, sharp toes
def hind(s):
    X = lambda x: s * x
    pts = [(X(20), 42, -28), (X(25), 25, -14), (X(23), 11, -34), (X(23), 5, -26)]; rad = [17, 12, 8, 8]
    edges = [(0, 1), (1, 2), (2, 3)]
    tips = digits(pts, rad, edges, 3, [([(X(23 + k * 4), 5, -19), (X(23 + k * 5.5), 3.4, -9), (X(23 + k * 6.5), 1.6, 1)], 4.2) for k in (-1.5, -0.5, 0.5, 1.5)])
    ob, paint = solid_limb(pts, rad, edges, [((X(17), 41, -28), 17)], tips, lambda m, n: SKIN if m.y < 12 else FUR, 1400, floor=0.8, tip=C(0xe6d6b8))
    P = Part('LegFront' if s > 0 else 'LegBack', [X(16), 40, -28]); P.add(ob, paint)
    return P

# ---------------------------------------------------------------- forelegs: thin, bent, pink paws with sharp toes
def fore(s):
    X = lambda x: s * x
    pts = [(X(14), 40, 22), (X(18), 24, 16), (X(18), 10, 28), (X(18), 5, 33)]; rad = [13, 9.5, 7, 7]
    edges = [(0, 1), (1, 2), (2, 3)]
    tips = digits(pts, rad, edges, 3, [([(X(18 + k * 3.6), 4.5, 38), (X(18 + k * 5), 3, 46), (X(18 + k * 6), 1.5, 54)], 3.8) for k in (-1.5, -0.5, 0.5, 1.5)])
    ob, paint = solid_limb(pts, rad, edges, [((X(13), 40, 20), 12)], tips, lambda m, n: SKIN if m.y < 12 else FUR, 1200, floor=0.8, tip=C(0xe6d6b8))
    P = Part('ArmFront' if s > 0 else 'ArmBack', [X(12), 38, 22]); P.add(ob, paint)
    return P
parts += [hind(-1), hind(1), fore(-1), fore(1)]

# ---------------------------------------------------------------- tail: long, bare, ringed, curling up behind
TAIL = Part('Tail', [0, 36, -46])
tp = [(0, 44, -28), (0, 40, -40), (0, 34, -56), (2, 26, -80), (8, 28, -104), (14, 42, -118), (14, 58, -116), (10, 68, -104), (7, 70, -96)]
tr = [9, 8.5, 7.5, 6.5, 5.6, 4.6, 3.8, 3.0, 2.2]
tail, _ = fuse([(skin(tp, tr, sub=2, name='tail'), lambda m, n: SKIN)], voxel=0.7, smooth=3, tris=0, name='tail')
sharpen(tail, Vector(tp[-2]), Vector((5, 70, -90)), 4)
decimate(tail, 900)
def tail_paint(m, n):
    best, arc = 1e9, 0
    for i in range(len(tp) - 1):
        a, b = Vector(tp[i]), Vector(tp[i + 1]); t = max(0, min(1, (m - a).dot(b - a) / (b - a).length_squared)); d = (m - a.lerp(b, t)).length
        if d < best: best, arc = d, i + t
    return SKIN_D if (arc * 3.2) % 1 < 0.22 else SKIN          # rings
TAIL.add(tail, tail_paint)
parts.append(TAIL)

# ---------------------------------------------------------------- head: a long snarling wedge, big incisors, round ears
EYES = [{'at': [s * 10.5, 60, 57], 'r': 4.8, 'out': [s * 0.75, 0.2, 0.62], 's': s} for s in (-1, 1)]
HEAD = Part('Head', [0, 48, 34], eyes=EYES)
fur2 = lambda m, n: FUR_L if (m.y < 44 and n.y < 0) else FUR
pieces = [(blob((0, 56, 44), (15, 15, 16), name='skull'), fur2),
          (skin([(0, 55, 50), (0, 52, 68), (0, 48, 86)], [12, 9, 5.5], sub=2, name='snout'), fur2),
          (skin([(0, 44, 46), (0, 38, 62), (0, 36, 74)], [9, 7, 4.2], sub=2, name='jaw'), fur2),
          (blob((0, 48, 36), (12, 12, 12), name='neckball'), fur2)]
for s in (-1, 1):
    pieces.append((blob((s * 9.5, 64, 53), (7, 3, 5), rot=(0, 0, -s * 0.45), name='brow'), lambda m, n: FUR_D))
    pieces.append((blob((s * 11, 50, 52), (7, 7, 8), name='cheek'), fur2))
head, hp = fuse(pieces, voxel=0.7, smooth=4, tris=2200, name='head')
HEAD.add(head, hp)
ph = projector(head)
spikes(HEAD, ph, [(s * 14, 54, 46) for s in (-1, 1)] + [(s * 12, 46, 44) for s in (-1, 1)] + [(0, 70, 40)], lambda p: (p.x * 0.08, 0.3, -1), 8, 2.6, lambda m, n: FUR_D)
HEAD.add(blob((0, 42, 66), (5.5, 3.6, 11), name='mouth'), lambda m, n: MOUTH, 120)
HEAD.add(blob((0, 49, 88), (4.6, 3.8, 3.6), name='nose'), lambda m, n: SKIN_D, 100)
for s in (-1, 1):                                             # big yellow incisors, top and bottom, and a few side teeth
    HEAD.add(skin([(s * 2.3, 48, 84), (s * 2.3, 41, 86), (s * 2.1, 35, 85)], [2.0, 1.8, 0.5], sub=1, name='inc'), lambda m, n: INCISOR, 80)
    HEAD.add(skin([(s * 2.0, 37, 72), (s * 2.0, 41, 74), (s * 1.8, 44, 74)], [1.6, 1.3, 0.4], sub=1, name='inc2'), lambda m, n: INCISOR, 60)
    for z in (62, 68):
        HEAD.add(skin([(s * 5.5, 46, z), (s * 5.2, 41.5, z + 1)], [1.3, 0.3], sub=1, name='tooth'), lambda m, n: TOOTH, 40)
    ear = blob((s * 13, 70, 40), (9, 10, 3.4), rot=(0.25, 0, s * 0.35), name='ear')
    HEAD.add(ear, lambda m, n: SKIN, 200)
    pe = projector(ear)
    HEAD.add(decal(pe, (s * 13, 70, 43), (s * 0.3, 0.2, 1), 6, seg=18, rings=2, lift=0.3), lambda m, n: SKIN_D)
sore(HEAD.add, ph, (-12, 52, 52), (-1, 0.1, 0.4), 3.4, 70)
parts.append(HEAD)

for ob, _ in HEAD.pieces:                                     # the head 20% bigger, about its pivot
    deform(ob, lambda v: Vector((0, 48, 34)) + (v - Vector((0, 48, 34))) * 1.2)
for e in EYES: e['at'] = list(Vector((0, 48, 34)) + (Vector(e['at']) - Vector((0, 48, 34))) * 1.2); e['r'] *= 1.2

export('BlightRat', parts, out_path('BlightRat'), height=105, beast=True)
