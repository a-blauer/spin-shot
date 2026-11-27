# Ash and Ember (boss, twin hounds): two hounds the Blight took. Long powerful bodies of dark fur, deep-chested and
# tucked at the waist, spiky fur along the back and a ridge of caps down the spine, sores where the mould broke through;
# long legs on sharp toes; a long wedge of a skull, ears laid back, lit eyes, the long jaws open in a snarl full of teeth.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

FUR, FUR2, FUR3 = C(0x3c3430), C(0x2c2622), C(0x52463e)
fur = lambda m, n: FUR3 if n.y > 0.6 else (FUR2 if n.y < -0.3 else FUR)
reset(); parts = []
for s in (-1, 1):
    P, _ = root_leg(s, [s * 16, 70, -44], (s * 16, 78, -46), (s * 20, 46, -64), (s * 18, 14, -46), [14.5, 9.5, 6.5], toes=4, toe_len=16, spread=0.8, paint=fur, tip=C(0xd8ccb0))
    parts.append(P)
for s in (-1, 1):
    P, _ = root_leg(s, [s * 15, 72, 34], (s * 17, 78, 32), (s * 18, 44, 40), (s * 17, 12, 38), [12.5, 8.5, 6.5], toes=4, toe_len=16, spread=0.8, paint=fur, tip=C(0xd8ccb0))
    P.role = 'ArmFront' if s > 0 else 'ArmBack'; parts.append(P)

BODY = Part('Body', [0, 74, 0])
pieces = [(skin([(0, 86, -54), (0, 86, -30), (0, 88, -4), (0, 92, 22), (0, 96, 40)], [(19, 20), (17, 18), (20, 24), (24, 28), (20, 22)], sub=2, name='body'), fur)]
pieces += [(blob((0, 100, 48), (16, 18, 18), name='necksock'), fur)] + [(blob((s * 16, 80, -46), (13, 14, 14), name='haunch'), fur) for s in (-1, 1)] + [(blob((s * 16, 80, 32), (12, 13, 12), name='shoulder'), fur) for s in (-1, 1)]
bo, bp = fuse(pieces, voxel=0.9, smooth=3, tris=2600, name='body')
BODY.add(bo, bp); pj = projector(bo)
spikes(BODY, pj, [(s * 6, 112, z) for s in (-1, 1) for z in (-40, -20, 0, 20)] + [(s * 16, 100, z) for s in (-1, 1) for z in (-30, 14, 34)], lambda p: (p.x * 0.05, 1, -0.6), 10, 3, lambda m, n: FUR2)
grow_mushrooms(BODY, pj, [((0, 112, z), (0, 1, -0.2), 9 + (i % 2) * 4, 7 + (i % 2)) for i, z in enumerate((-50, -35, -20, -5, 10, 25))], glow_spots=True)
sore(BODY.add, pj, (20, 84, -10), (1, 0, 0), 5, 3)
sore(BODY.add, pj, (-22, 90, 14), (-1, 0, 0.2), 4, 6)
rot_patch(BODY.add, pj, (-18, 80, -40), (-1, -0.3, 0), 8, 9)
parts.append(BODY)

TAIL = Part('Tail', [0, 82, -62])
tp = [(0, 88, -56), (0, 82, -90), (0, 66, -120), (0, 52, -138)]
tl, _ = fuse([(skin(tp, [9, 7, 4.5, 2], sub=2, name='tail'), None)], voxel=0.6, smooth=2, tris=0, name='tail')
sharpen(tl, Vector(tp[2]), Vector(tp[3]) + Vector((0, -4, -4)), 5)
TAIL.add(tl, fur, 700); pt = projector(tl)
spikes(TAIL, pt, [(0, 92, -80), (0, 82, -100), (0, 68, -118)], lambda p: (0, 1, -0.6), 8, 2.4, lambda m, n: FUR2)
parts.append(TAIL)

EYES = [{'at': [s * 11, 112, 92], 'r': 4.4, 's': s, 'out': [s * 0.5, 0.15, 0.85]} for s in (-1, 1)]
HEAD = Part('Head', [0, 96, 46], eyes=EYES)
pieces = [(skin([(0, 94, 34), (0, 100, 56), (0, 104, 72), (0, 106, 86)], [16, 17, 18, 16], sub=2, name='neck'), fur),
          (skin([(0, 108, 84), (0, 102, 104), (0, 98, 126)], [(15, 13), (11, 10), (7, 6.5)], sub=2, name='snout'), fur),
          (skin([(0, 92, 88), (0, 86, 106), (0, 84, 122)], [(11, 7), (8.5, 5), (6, 3.6)], sub=2, name='jaw'), fur)]
for s in (-1, 1):
    pieces.append((blob((s * 11, 118, 90), (8, 2.8, 5), rot=(0.2, 0, -s * 0.45), name='brow'), lambda m, n: FUR2))
ho, hp = fuse(pieces, voxel=0.6, smooth=3, tris=2400, name='head')
HEAD.add(ho, hp); ph = projector(ho); seat_eyes(EYES, ph)
HEAD.add(blob((0, 92, 108), (6.5, 3.4, 18), name='gape'), lambda m, n: MOUTH, 140)
HEAD.add(blob((0, 100, 128), (4.6, 3.6, 3.4), name='nose'), lambda m, n: BLACK, 40)
for i in range(6):                                                   # the snarl: long teeth top and bottom
    z = 96 + i * 5.2
    for s in (-1, 1):
        L = 7 if i in (4, 5) else 4.4
        HEAD.add(skin([(s * 6.5, 97.5, z), (s * 6.2, 97.5 - L, z + 0.6)], [1.7, 0.1], sub=1, name='t'), lambda m, n: TOOTH, 12)
        if i < 5: HEAD.add(skin([(s * 5.6, 87.5, z + 2), (s * 5.4, 87.5 + L * 0.8, z + 2.4)], [1.5, 0.1], sub=1, name='t'), lambda m, n: TOOTH, 12)
for s in (-1, 1):                                                    # ears laid back, pointed
    HEAD.add(skin([(s * 10, 116, 78), (s * 13, 122, 71), (s * 15, 126, 64)], [4.5, 3, 0.3], sub=1, name='ear'), lambda m, n: FUR2, 60)
spikes(HEAD, ph, [(s * 12, 110, 70) for s in (-1, 1)] + [(0, 118, 72)], lambda p: (p.x * 0.06, 0.6, -1), 9, 2.6, lambda m, n: FUR2)
parts.append(HEAD)

export('B_Hound', parts, out_path('B_Hound'), height=140, beast=True)
