# Golden Truffle (Gilded): a knobbly truffle gone gold, faceted like a nugget, a wide greedy grin packed with teeth and two
# narrow eyes, short fast legs on sharp toes, stubby arms with little sharp fingers, a sprig of gold caps on top. Gold
# whatever the strain (only its eyes take the strain's light). It is a treasure: no rot.
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

GOLD, GOLD_D, GOLD_L, GOLD_DD = C(0xd8a830), C(0x9a7018), C(0xf6dc78), C(0x6a4a10)
gp = lambda m, n: GOLD_L if n.y > 0.6 else (GOLD_D if n.y < -0.4 else GOLD)
reset(); parts = []
for s in (-1, 1):
    P, _ = root_leg(s, [s * 18, 46, 0], (s * 19, 50, 0), (s * 22, 28, 6), (s * 21, 10, 3), [11, 9, 7.5], toes=3, toe_len=15, paint=gp, tip=GOLD_DD)
    parts.append(P)

EYES = [{'at': [s * 14.4, 112, 55], 'r': 6, 's': s, 'out': [s * 0.25, 0.05, 0.96]} for s in (-1, 1)]
BODY = Part('Body', [0, 48, 0], eyes=EYES)
rng = random.Random(4)
pieces = [(blob((0, 96, 0), (56, 52, 53), e=0.78, rot=(0.1, 0.4, 0.05), name='nugget'), gp)]
for k in range(11):                                                  # knobs all over
    a = rng.uniform(0, 2 * math.pi); y = rng.uniform(62, 140); r = 48 * math.sqrt(max(0.15, 1 - ((y - 96) / 56) ** 2))
    if math.sin(a) > 0.25 and 66 < y < 136: continue                 # leave the face smooth
    pieces.append((blob((math.cos(a) * r, y, math.sin(a) * r), (16, 14, 16), e=0.5, rot=(a, a * 2, 0), name='knob'), gp))
for s in (-1, 1):
    pieces.append((blob((s * 15, 120, 50), (12, 3.6, 6), rot=(0.2, 0, -s * 0.38), name='brow'), lambda m, n: GOLD_D))
    pieces.append((blob((s * 19, 48, 0), (13, 12, 13), name='hip'), gp)); pieces.append((blob((s * 44, 98, 12), (11, 11, 11), name='sho'), gp))
body, bp = fuse(pieces, voxel=1.2, smooth=1, tris=1000, name='nugget')       # coarse: faceted like a nugget
BODY.add(body, bp); pj = projector(body); seat_eyes(EYES, pj)
# the grin: wide, curving up at the corners, crammed with teeth
grin = [(x, 90 + 0.012 * x * x) for x in range(-26, 27, 2)]
BODY.add(decal(pj, (0, 92, 54), (0, -0.05, 1), 27, seg=40, rings=4, lift=0.6, squash=(1, 0.32), wobble=0.05, seed=3), lambda m, n: MOUTH)
for i in range(13):
    x = -22 + i * 3.67; top = i % 2 == 0; y = 92 + 0.01 * x * x + (4.2 if top else -4.2)
    h = pj.ray_cast(Vector((x, y, 100)), Vector((0, 0, -1)), 80)
    if h[0] is not None: BODY.add(skin([tuple(h[0] - h[1] * 0.4), tuple(h[0] + h[1] * 1.2 + Vector((0, -3.8 if top else 3.8, 0)))], [1.8, 0.12], sub=1, name='t'), lambda m, n: C(0xfff4d8), 14)
parts.append(BODY)
for s in (-1, 1):
    P, _ = root_arm(s, [s * 44, 98, 12], (s * 45, 98, 12), (s * 56, 82, 20), (s * 58, 66, 28), [9, 7.5, 6.5], fingers=3, f_len=11, paint=gp, tip=GOLD_DD)
    parts.append(P)

HEAD = Part('Head', [0, 136, 0])
for base, up, h, r in (((0, 134, 0), (0.05, 1, 0), 32, 11), ((-9, 132, 4), (-0.5, 1, 0.2), 24, 8), ((8, 132, -6), (0.45, 1, -0.3), 21, 7)):
    stl, cap = mushroom(base, up, h, r)
    HEAD.add(stl, lambda m, n: GOLD_L, 60); HEAD.add(cap, gp, 120)
parts.append(HEAD)

export('GoldenTruffle', parts, out_path('GoldenTruffle'), height=160)
