# The Devourer (boss, devour): a mouth that learned to walk. A great faceted lump of a body, ridged and plated with bark,
# that is almost all maw: a huge round gape on the front ringed with rows of hooked teeth, its lip crowned with spikes,
# lit deep inside; small mean eyes up above it; carried low on six thick jointed root legs on sharp root toes.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

reset(); parts = []
LEGS = [('LegFront', 56, 30), ('LegBack', 56, -6), ('LegFront', 56, -40), ('LegBack', -56, 30), ('LegFront', -56, -6), ('LegBack', -56, -40)]
for role, x, z in LEGS:
    s = 1 if x > 0 else -1; d = Vector((s, 0, z / 70)).normalized()
    hip = Vector((x, 66, z)); knee = hip + d * 40 + Vector((0, 46, 0)); ank = hip + d * 84 + Vector((0, -52, 0))
    P, ob = root_leg(s, [x, 64, z], tuple(hip), tuple(knee), tuple(ank), [18, 16, 13], toes=3, toe_len=26, spread=1.0, fwd=tuple(d))
    P.role = role
    pl = projector(ob); side = Vector((0, 1, 0)).cross(d).normalized()
    P.add(ribbon(pl, [tuple(knee.lerp(hip, 0.4) + Vector((0, 4, 0))), tuple(knee + Vector((0, 6, 0))), tuple(knee.lerp(ank, 0.4) + d * 4), tuple(knee.lerp(ank, 0.8) + d * 3)], 3, lambda p, d=d: (d.x, 0.6, d.z), lift=0.7), lambda m, n: ROOT_D)
    parts.append(P)

EYES = [{'at': [s * 26, 172, 92], 'r': 7.5, 's': s, 'out': [s * 0.35, 0.65, 0.7]} for s in (-1, 1)]
BODY = Part('Body', [0, 70, 0], eyes=EYES)
pieces = [(blob((0, 110, -6), (96, 80, 100), e=0.8, seg=12, name='body'), lambda m, n: ROOT if n.y > -0.4 else ROOT_D)]
pieces += [(blob((x, 66, z), (22, 20, 22), name='sock'), lambda m, n: ROOT_D) for _, x, z in LEGS]
for s in (-1, 1): pieces.append((blob((s * 26, 180, 86), (14, 5, 9), rot=(0.4, 0, -s * 0.4), name='brow'), lambda m, n: ROOT_D))
bo, bp = fuse(pieces, voxel=1.6, smooth=1, tris=0, name='body')
carve(bo, blob((0, 110, 120), (60, 56, 60), seg=32, name='gape'))     # the maw takes the whole front
decimate(bo, 5000)
def body_paint(m, n):
    if m.z > 60 and math.hypot(m.x, m.y - 110) < 58 and n.z < 0.5: return MOUTH
    return bp(m, n)
BODY.add(bo, body_paint); pj = projector(bo); seat_eyes(EYES, pj, 0.3)
for k in range(10):                                                   # bark plates over the back
    a = k * 0.6 + 2.0; c = Vector((math.cos(a) * 70, 150 + (k % 3) * 14, math.sin(a) * 70 - 20))
    h = pj.ray_cast(c + (c - Vector((0, 110, -6))).normalized() * 40, -(c - Vector((0, 110, -6))).normalized(), 120)
    if h[0] is not None: BODY.add(decal(pj, h[0], h[1], 16, seg=6, rings=1, lift=1.2, wobble=0.1, seed=k), lambda m, n: ROOT_D)
for i, (a, y) in enumerate(((2.6, 130), (3.8, 160), (5.2, 120))):
    rot_patch(BODY.add, pj, (math.cos(a) * 96, y, math.sin(a) * 96), (math.cos(a), 0.3, math.sin(a)), 15, 3 + i * 3)
sore(BODY.add, pj, (-80, 90, 40), (-0.9, 0, 0.4), 8, 20)
grow_mushrooms(BODY, pj, [((-30, 190, -30), (-0.3, 1, -0.2), 14, 11), ((20, 192, -50), (0.2, 1, -0.4), 11, 9), ((40, 180, -10), (0.4, 1, 0), 9, 8)], glow_spots=True)
parts.append(BODY)

HEAD = Part('Head', [0, 100, 50])
lip = lathe([(50, 8), (60, 5), (64, 0), (62, -6), (52, -8)], seg=20, name='lip')
lip.matrix_world = Matrix.Translation((0, 110, 128)) @ Matrix.Rotation(math.pi / 2, 4, 'X'); bake_world(lip)
HEAD.add(lip, lambda m, n: mix(FLESH(0.6), ROOT_D, 0.6) if n.z > 0.2 else ROOT_D, 700)
gul = lathe([(0, 2), (52, 1), (34, -30), (0, -36)], seg=18, name='gullet')
gul.matrix_world = Matrix.Translation((0, 110, 126)) @ Matrix.Rotation(math.pi / 2, 4, 'X'); bake_world(gul)
HEAD.add(gul, lambda m, n: GLOW(1) if math.hypot(m.x, m.y - 110) < 22 else MOUTH, 300)
for ring, (R, z, L, n) in enumerate(((52, 126, 26, 16), (38, 112, 20, 13), (25, 98, 14, 10))):
    for i in range(n):
        a = i * 2 * math.pi / n + ring * 0.2; c = Vector((math.cos(a) * R, 110 + math.sin(a) * R, z)); inw = Vector((-math.cos(a), -math.sin(a), 0.25)).normalized()
        HEAD.add(skin([tuple(c - inw * 2), tuple(c + inw * L * 0.6 + Vector((0, 0, 3))), tuple(c + inw * L)], [6.5 - ring * 1.2, 3.8, 0.15], sub=1, name='t'), lambda m, n: TOOTH, 20)
for i in range(16):
    a = i * math.pi / 8 + 0.1; b = Vector((math.cos(a) * 63, 110 + math.sin(a) * 63, 128)); o = Vector((math.cos(a), math.sin(a), 0.5)).normalized()
    HEAD.add(skin([tuple(b - o * 3), tuple(b + o * 9), tuple(b + o * 17)], [5, 3, 0.15], sub=1, name='spike'), lambda m, n: ROOT_D, 30)
for o in HEAD.pieces: deform(o[0], lambda v: v - Vector((0, 0, 32)))     # the maw set into the front of the body
parts.append(HEAD)

export('B_Devourer', parts, out_path('B_Devourer'), height=170)
