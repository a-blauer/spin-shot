# Drifter (Flyer): a floating spore balloon, faceted and ridged like an onion dome with a pointed spout on top, a band of
# lit pores round it and two glaring eyes; under it a skirt of pointed gill petals curling outward; hanging below, a
# lamprey mouth like an upturned bell ringed inside with hooked teeth; three heavy tendrils trail from it, ending in barbs.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

reset(); parts = []
NR = 8
def ridge(v, d=0.1):
    a = math.atan2(v.z, v.x); k = 1 + d * (abs(math.cos(a * NR / 2)) * 2 - 1); return Vector((v.x * k, v.y, v.z * k))

# tail: three tendrils, barbed
TAIL = Part('Tail', [0, 40, 0])
for i in range(3):
    a = i * 2.094 + 0.5; x, z = math.cos(a) * 9, math.sin(a) * 9
    pts = [(x, 44, z), (x * 1.7, 26, z * 1.7), (x * 1.2, 8, z * 1.2), (x * 1.8, -6, z * 1.8)]
    t, _ = fuse([(skin(pts, [4.2, 3.4, 2.6, 1.2], sub=2, name='tendril'), None)], voxel=0.6, smooth=2, tris=0, name='tendril')
    sharpen(t, Vector(pts[2]), Vector(pts[3]) + (Vector(pts[3]) - Vector(pts[2])).normalized() * 4, 3.5)
    TAIL.add(t, lambda m, n: FLESH(0.85) if m.y > 4 else ROOT_D, 360)
    for k, u in enumerate((0.3, 0.55)):                                        # barbs
        p = Vector(pts[1]).lerp(Vector(pts[2]), u); o = Vector((math.cos(a + 0.6 * (k - 0.5)), -0.6, math.sin(a + 0.6 * (k - 0.5))))
        TAIL.add(skin([tuple(p), tuple(p + o * 6)], [1.6, 0.1], sub=1, name='barb'), lambda m, n: ROOT_D, 12)
parts.append(TAIL)

# body: the dome, the pores, the petal skirt
EYES = [{'at': [s * 9, 82, 37.2], 'r': 4.2, 's': s, 'out': [s * 0.3, -0.25, 0.92]} for s in (-1, 1)]
BODY = Part('Body', [0, 62, 0], eyes=EYES)
dome = lathe([(0, 118), (3, 116), (6, 110), (14, 104), (26, 98), (36, 88), (40, 76), (38, 66), (30, 60), (0, 58)], seg=16, name='dome')
deform(dome, ridge)
dp = lambda m, n: GILL_A if n.y < -0.5 else (mix(CAP(1), ROOT_D, 0.35) if abs(math.cos(math.atan2(m.z, m.x) * NR / 2)) < 0.35 else CAP(1))
pieces = [(dome, dp)] + [(blob((s * 9.5, 89, 33), (8, 2.6, 4.4), rot=(0.25, 0, s * 0.42), name='brow'), lambda m, n: mix(CAP(1), ROOT_D, 0.5)) for s in (-1, 1)]
do, dpp = fuse(pieces, voxel=0.7, smooth=1, tris=2400, name='dome')
BODY.add(do, dpp); pj = projector(do)
BODY.add(blob((0, 58, 2), (15, 9, 15), name='socket'), lambda m, n: FLESH(1), 200)        # the socket the mouth hangs from
for i in range(10):
    a = i * 2 * math.pi / 10 + 0.31
    c = Vector((math.cos(a) * 25, 100, math.sin(a) * 25)); d = (math.cos(a), 0.9, math.sin(a))      # spore vents round the crown
    BODY.add(decal(pj, c, d, 3.2, seg=12, rings=1, lift=0.5), lambda m, n: mix(CAP(1), BLACK, 0.55))
    BODY.add(decal(pj, c, d, 1.8, seg=10, rings=1, lift=0.8), lambda m, n: GLOW(1))
rot_patch(BODY.add, pj, (-20, 100, -18), (-0.5, 0.8, -0.4), 8, 5)
sore(BODY.add, pj, (24, 96, -12), (0.6, 0.6, -0.3), 4, 9)
for i in range(8):                                                                 # the skirt of pointed gill petals
    a = i * math.pi / 4 + 0.39; d = Vector((math.cos(a), 0, math.sin(a)))
    pts = [tuple(d * 24 + Vector((0, 62, 0))), tuple(d * 33 + Vector((0, 54, 0))), tuple(d * 38 + Vector((0, 44, 0))), tuple(d * 43 + Vector((0, 40, 0)))]
    pet = skin(pts, [(7.5, 3), (7, 2.6), (4.5, 2), (0.6, 0.6)], sub=1, name='petal')
    BODY.add(pet, lambda m, n: FLESH(0.85) if n.y < 0 else mix(FLESH(0.85), GILL_B, 0.5), 120)
parts.append(BODY)

# head: the lamprey mouth hanging below
HEAD = Part('Head', [0, 50, 0])
bell = lathe([(7, 68), (9, 62), (11, 52), (13, 42), (16, 32), (17.5, 26), (16, 23), (12, 24), (9, 30), (0, 36)], seg=10, name='mouthbell')
bake_world(transform(bell, Matrix.Translation((0, 0, 4))))
HEAD.add(bell, lambda m, n: MOUTH if (n.y < -0.2 and math.hypot(m.x, m.z - 4) < 14) else (FLESH(0.8) if m.y < 34 else FLESH(1)), 700)
for ring, (R, y, L) in enumerate(((13.5, 25, 6), (9.5, 30, 4.5))):
    for i in range(10):
        a = i * math.pi / 5 + ring * 0.31; c = Vector((math.cos(a) * R, y, math.sin(a) * R + 4)); inw = Vector((-math.cos(a), 0.5, -math.sin(a))).normalized()
        HEAD.add(skin([tuple(c), tuple(c + inw * L)], [1.7 - ring * 0.3, 0.1], sub=1, name='t'), lambda m, n: TOOTH, 14)
parts.append(HEAD)

export('Drifter', parts, out_path('Drifter'), height=110)
