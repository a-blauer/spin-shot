# Creeper, after tools/blight/refs/creeper.png: a broad conical red cap with big pale spots, studded with little
# mushrooms, over a squat root body; under the cap's front brim a bone-pale scowling face with four glowing eyes (two big,
# two small), an open mouth and two curved fangs; six thick angular bark legs veined with pale lines, little mushrooms on
# the knees, each foot splitting into sharp root toes. Rotting in places.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

BARK, BARK_D = C(0x6a4228), C(0x4a2c1c)
VEIN, BONE, BONE_D = C(0xd8c090), C(0xdccaa0), C(0xb09c78)
reset(); parts = []

# ---------------------------------------------------------------- body: a squat root core under a wide rotting cap
BODY = Part('Body', [0, 50, 0])
core = blob((0, 42, -4), (30, 20, 32), name='core')
socks = [blob((s * 24, 46, z * 0.9), (11, 11, 11), name='sock') for s in (-1, 1) for z in (22, 0, -20)]
body, bp = fuse([(core, lambda m, n: BARK)] + [(o, lambda m, n: BARK) for o in socks], voxel=1.0, smooth=5, tris=1400, name='core')
BODY.add(body, bp)
CAPM = Matrix.Translation((0, 60, -6)) @ Matrix.Rotation(0.12, 4, 'X')
cap, cpaint, brim = rotten_cap([(0, 34), (12, 33), (32, 22), (50, 6), (56, 0), (50, -3), (26, 3), (0, 6)], CAPM,
                               [(0.7, 0.28, 7), (2.4, 0.22, 6), (4.0, 0.3, 8), (5.4, 0.2, 5)], seg=48, rim_from=36, rim_to=56)
BODY.add(cap, cpaint, 2600)
pc = cap_spots(BODY, cap, CAPM, [(0.3, 0.5, 9), (1.4, 0.3, 8), (2.2, 0.62, 7.5), (3.3, 0.45, 9), (4.3, 0.6, 7), (5.2, 0.35, 8), (5.9, 0.75, 5.5), (1.0, 0.8, 5), (3.9, 0.85, 5), (2.8, 0.15, 5)], rim=56)
cap_rot(BODY, pc, CAPM, [(2.0, 0.7, 7), (4.8, 0.5, 6)], rim=56)
# little mushrooms all over the cap, one tall one on top
def on_cap(a, t):
    q = CAPM @ Vector((math.cos(a) * t * 50, 40 - 34 * t, math.sin(a) * t * 50)); return tuple(q)
grow_mushrooms(BODY, pc, [(on_cap(0.2, 0.08), (0.1, 1, -0.1), 12, 9)] +
               [(on_cap(a, t), (math.cos(a) * t * 1.6, 1, math.sin(a) * t * 1.6), h, r) for a, t, h, r in
                [(0.9, 0.55, 6, 5), (2.0, 0.85, 5, 4.4), (2.7, 0.5, 6, 5.2), (3.6, 0.8, 5, 4.4), (4.5, 0.4, 5, 4.6), (5.6, 0.62, 6, 5), (0.1, 0.9, 4, 3.6), (3.1, 0.92, 4, 3.6)]])
drips(BODY, brim, [0.9, 2.1, 3.7, 4.6, 5.8], 52, CAPM)
parts.append(BODY)

# ---------------------------------------------------------------- legs: thick angular bark, each foot split into root toes
LEGS = [(1, 22), (1, 0), (1, -20), (-1, 22), (-1, 0), (-1, -20)]
for i, (s, z) in enumerate(LEGS):
    d = Vector((s, 0, z / 30)).normalized()
    hip = Vector((s * 22, 46, z * 0.9)); knee = hip + d * 30 + Vector((0, 14, 0)); ankle = hip + d * 56 + Vector((0, -36, 0))
    pts = [tuple(hip), tuple(knee), tuple(ankle)]; rad = [13, 12.5, 11]; edges = [(0, 1), (1, 2)]
    side = Vector((0, 1, 0)).cross(d).normalized()
    toes = [([tuple(ankle + d * 4 + side * k * 6 + Vector((0, -5, 0))), tuple(ankle + d * 8 + side * k * 9 + Vector((0, -8, 0))), tuple(ankle + d * 12 + side * k * 11 + Vector((0, -9.5, 0)))], 7) for k in (-1, 1)] + [([tuple(ankle - d * 4 + Vector((0, -5, 0))), tuple(ankle - d * 8 + Vector((0, -8, 0))), tuple(ankle - d * 11 + Vector((0, -9.5, 0)))], 6.5)]
    tips = digits(pts, rad, edges, 2, toes)
    leg, lp = solid_limb(pts, rad, edges, [(hip - d * 2, 13), (knee, 12.5)], tips, lambda m, n: BARK if n.y > -0.3 else BARK_D, 700, voxel=1.0, smooth=2, sharp_r=8, floor=0.6, tip=BARK_D)
    P = Part('LegFront' if i % 2 == 0 else 'LegBack', [s * 24, 50, z]); P.add(leg, lp)
    pl = projector(leg)
    # pale veins running down the outer face, branching on the shin
    o = lambda p, d=d: (d.x, 0.15, d.z)
    P.add(ribbon(pl, [tuple(knee.lerp(hip, 0.4)), tuple(knee), tuple(knee.lerp(ankle, 0.35)), tuple(knee.lerp(ankle, 0.7) + side * 2), tuple(knee.lerp(ankle, 0.95))], 2.6, o, lift=0.6), lambda m, n: VEIN)
    P.add(ribbon(pl, [tuple(knee.lerp(ankle, 0.35)), tuple(knee.lerp(ankle, 0.5) - side * 6), tuple(knee.lerp(ankle, 0.62) - side * 9)], 2.2, o, lift=0.6), lambda m, n: VEIN)
    P.add(ribbon(pl, [tuple(knee.lerp(ankle, 0.7) + side * 2), tuple(knee.lerp(ankle, 0.8) + side * 8)], 2.0, o, lift=0.6), lambda m, n: VEIN)
    grow_mushrooms(P, pl, [(tuple(knee + Vector((0, 8, 0))), (d.x * 0.4, 1, d.z * 0.4), 5 + (i % 2) * 2, 4.5 + (i % 3))])
    if i in (1, 4): sore(P.add, pl, tuple(knee.lerp(ankle, 0.5)), tuple(-side * s + d * 0.3), 3.4, 90 + i)
    parts.append(P)

# ---------------------------------------------------------------- head: a bone-pale scowling face under the brim
EYES = [{'at': [s * 10.5, 50, 49.5], 'r': 4.6, 'out': [s * 0.35, 0.1, 0.95], 's': s} for s in (-1, 1)] + \
       [{'at': [s * 4.8, 44.5, 53], 'r': 2.7, 'out': [s * 0.2, 0.05, 1], 's': s} for s in (-1, 1)]
HEAD = Part('Head', [0, 48, 30], eyes=EYES)
pieces = [(blob((0, 44, 40), (19, 15, 14), name='face'), lambda m, n: BONE), (blob((0, 44, 30), (14, 13, 12), name='neck'), lambda m, n: BONE_D)]
for s in (-1, 1):
    pieces.append((blob((s * 9, 54, 50), (8, 3, 4.6), rot=(0, 0, s * 0.42), name='brow'), lambda m, n: BONE_D))
    pieces.append((blob((s * 11, 36, 46), (7.5, 7, 7), name='jowl'), lambda m, n: BONE))
head, hp = fuse(pieces, voxel=0.6, smooth=4, tris=1800, name='head')
HEAD.add(head, hp)
pf = projector(head)
HEAD.add(blob((0, 34, 52.5), (7, 3.6, 3.4), name='mouth'), lambda m, n: MOUTH, 80)
for s in (-1, 1):
    HEAD.add(skin([(s * 7.5, 36, 51), (s * 8, 29, 54.5), (s * 6.4, 23, 55), (s * 4.6, 19.5, 53.5)], [2.6, 2.1, 1.2, 0.15], sub=1, name='fang'), lambda m, n: TOOTH, 90)
    HEAD.add(ribbon(pf, [(s * 3, 52, 56), (s * 1.5, 46, 57), (s * 2.5, 41, 56)], 1.0, lambda p: (0, 0, 1), lift=0.5, taper=False), lambda m, n: BONE_D)
rot_patch(HEAD.add, pf, (-14, 40, 42), (-1, 0, 0.6), 4, 70, mold=False)
parts.append(HEAD)

for ob, _ in HEAD.pieces:                                     # the face 30% bigger, about its pivot
    deform(ob, lambda v: Vector((0, 48, 30)) + (v - Vector((0, 48, 30))) * 1.3)
for e in EYES: e['at'] = list(Vector((0, 48, 30)) + (Vector(e['at']) - Vector((0, 48, 30))) * 1.3); e['r'] *= 1.3

export('Creeper', parts, out_path('Creeper'), height=90, beast=True)
