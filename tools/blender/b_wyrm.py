# The Great Rootworm (boss, burrow): the Rootworm's mother - far thicker, its segments ringed with lit bands, its maw
# fringed with thick groping feeler-roots round rings of big teeth. (After the Rootworm:)
# Rootworm (Burrower): a root as thick as a barrel arching up out of torn floor in fat faceted segments, each ringed by a
# hard ridge, sharp rootlets jutting from it; at its end a round mouth opening toward you: three rings of hooked teeth
# round a lit gullet, a bark lip, two small mean eyes above. Rotting: sores, olive rot, mould.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

reset(); parts = []
BODY = Part('Body', [0, 0, 0])
PTS = [Vector(p) for p in ((0, -14, -54), (0, 20, -48), (0, 52, -34), (0, 76, -12), (0, 92, 10), (0, 98, 22))]
RAD = [44, 43, 42, 40, 39, 38]
SEGP, SEGR, GLOWBANDS = [], [], []
for i in range(25):                                         # fat segments: the radius swells and pinches along it
    t = i / 24; f = t * (len(PTS) - 1); k = min(int(f), len(PTS) - 2); SEGP.append(tuple(PTS[k].lerp(PTS[k + 1], f - k)))
    SEGR.append(RAD[k] * (1.0 if i % 4 in (1, 2) else 0.86))
    if i % 4 == 3 and 2 < i < 23: GLOWBANDS.append((Vector(SEGP[-1]), (PTS[k + 1] - PTS[k]).normalized(), RAD[k] * 0.86))
sk = skin(SEGP, SEGR, sub=1, name='worm')
wo, wp = fuse([(sk, lambda m, n: ROOT)], voxel=1.2, smooth=1, tris=0, name='worm')
deform(wo, lambda v: v if v.y > 0 else Vector((v.x, 0, v.z)))
def worm_paint(m, n):
    for c, d, r in GLOWBANDS:
        if abs((m - c).dot(d)) < 1.5 and (m - c).length < r * 1.25: return GLOW(1)      # lit bands in the creases
    return ROOT if n.y > -0.5 else ROOT_D
BODY.add(wo, worm_paint, 3600); pj = projector(wo)
def along(t):
    f = t * (len(PTS) - 1); k = min(int(f), len(PTS) - 2); return PTS[k].lerp(PTS[k + 1], f - k), (PTS[k + 1] - PTS[k]).normalized(), RAD[k]
for k, (t, a, L) in enumerate(((0.3, 0.6, 16), (0.45, 2.5, 13), (0.62, -0.9, 15), (0.75, 3.7, 12), (0.2, 4.6, 11))):   # rootlets
    c, d, r = along(t); side = d.cross(Vector((1, 0, 0))).normalized(); o = (Vector((math.cos(a), 0, 0)) + side * math.sin(a)).normalized()
    o = (o * math.cos(0.0) + Vector((math.cos(a), 0.2, math.sin(a)))).normalized()
    hit = pj.ray_cast(c + o * 50, -o, 90); b = (hit[0] - o * 1.5) if hit[0] is not None else c + o * r
    BODY.add(skin([tuple(b), tuple(b + o * L * 0.5 + d * 3), tuple(b + o * L + d * 6)], [3.6, 2.2, 0.1], sub=1, name='rootlet'), lambda m, n: ROOT_D, 40)
# torn floor: chunks of slab tipped up round where it broke through
for k in range(9):
    a = k * 2 * math.pi / 9 + 0.2; r = 56 + (k % 3) * 7
    ch = blob((math.cos(a) * r, 2, math.sin(a) * r - 50), (17, 6, 12), rot=(0.4 * math.sin(a), -a, 0.35 * math.cos(a)), e=0.4, name='chunk')
    bake_world(ch); deform(ch, lambda v: Vector((v.x, max(v.y, 0), v.z)))
    BODY.add(ch, lambda m, n: C(0x3c3a3e) if n.y > 0.3 else C(0x2a282c), 40)
sore(BODY.add, pj, (24, 40, -24), (1, 0, 0.3), 6, 3)
sore(BODY.add, pj, (-22, 66, -6), (-1, 0.3, 0), 5, 5)
rot_patch(BODY.add, pj, (-26, 28, -40), (-1, 0, -0.2), 12, 7)
rot_patch(BODY.add, pj, (0, 96, -4), (0, 1, -0.3), 9, 9)
BODY.add(ribbon(pj, [(26, 20, -40), (28, 40, -32), (26, 58, -18), (24, 72, -2)], 2.8, lambda p: (1, 0, 0), lift=0.6), lambda m, n: OOZE)
parts.append(BODY)

# head: a faceted barrel end, the round maw facing forward
EYES = [{'at': [s * 14, 128, 49], 'r': 4, 's': s, 'out': [s * 0.3, 0.3, 0.9]} for s in (-1, 1)]
HEAD = Part('Head', [0, 88, 26], eyes=EYES)
hd = lathe([(26, 18), (28, 10), (29, 0), (27, -10), (25, -18), (0, -18)], seg=12, name='headbarrel')   # spun on y, then turned to face +z
hd.matrix_world = Matrix.Translation((0, 106, 40)) @ Matrix.Rotation(math.pi / 2, 4, 'X'); bake_world(hd)
pieces = [(hd, lambda m, n: ROOT), (blob((0, 92, 24), (26, 24, 22), name='neck'), lambda m, n: ROOT)]
for s in (-1, 1): pieces.append((blob((s * 13, 134, 48), (8, 2.8, 5), rot=(0, 0, -s * 0.5), name='brow'), lambda m, n: ROOT_D))
ho, hp = fuse(pieces, voxel=0.9, smooth=1, tris=1600, name='head')
HEAD.add(ho, hp)
lip = lathe([(16, 4), (22, 3), (25, 0), (23, -4), (16, -5)], seg=14, name='lip')
lip.matrix_world = Matrix.Translation((0, 106, 59)) @ Matrix.Rotation(math.pi / 2, 4, 'X'); bake_world(lip)
HEAD.add(lip, lambda m, n: mix(FLESH(0.8), ROOT_D, 0.35) if n.z > 0.2 else ROOT_D, 300)
for i in range(10):                                         # a crown of bark spikes round the lip, flaring out
    a = i * math.pi / 5 + 0.15; b = Vector((math.cos(a) * 23, 106 + math.sin(a) * 23, 58)); o = Vector((math.cos(a), math.sin(a), 0.7)).normalized()
    HEAD.add(skin([tuple(b - o * 2), tuple(b + o * 6), tuple(b + o * 12)], [3.6, 2.2, 0.1], sub=1, name='spike'), lambda m, n: ROOT_D, 30)
gul = lathe([(0, 2), (16, 1), (10, -14), (0, -16)], seg=12, name='gullet')
gul.matrix_world = Matrix.Translation((0, 106, 60)) @ Matrix.Rotation(math.pi / 2, 4, 'X'); bake_world(gul)
HEAD.add(gul, lambda m, n: GLOW(1) if math.hypot(m.x, m.y - 106) < 7 else MOUTH, 120)
for ring, (R, z, L, n) in enumerate(((18, 60, 11, 9), (12.5, 55, 8, 8), (8, 50, 6, 7))):
    for i in range(n):
        a = i * 2 * math.pi / n + ring * 0.35; c = Vector((math.cos(a) * R, 106 + math.sin(a) * R, z)); inw = Vector((-math.cos(a), -math.sin(a), -0.5)).normalized()
        HEAD.add(skin([tuple(c - inw * 1), tuple(c + inw * L * 0.6 + Vector((0, 0, 1.5))), tuple(c + inw * L)], [3.2 - ring * 0.5, 1.9, 0.1], sub=1, name='t'), lambda m, n: TOOTH, 20)
ph = projector(ho)
rot_patch(HEAD.add, ph, (-22, 118, 30), (-1, 0.4, 0), 7, 20)
for i in range(8):                                          # thick groping feeler-roots round the maw
    a = i * math.pi / 4 + 0.4; d = Vector((math.cos(a), math.sin(a), 0))
    pts = [Vector((0, 106, 58)) + d * 22, Vector((0, 106, 70)) + d * 30, Vector((0, 106, 84)) + d * 36 + Vector((0, -6, 0)), Vector((0, 106, 94)) + d * 34 + Vector((0, -12, 0))]
    f, _ = fuse([(skin([tuple(p) for p in pts], [5, 4.2, 3, 1.6], sub=2, name='feeler'), None)], voxel=0.6, smooth=2, tris=0, name='feeler')
    sharpen(f, pts[2], pts[3] + (pts[3] - pts[2]).normalized() * 3, 3)
    HEAD.add(f, lambda m, n: ROOT_D, 220)
for o in HEAD.pieces:                                       # the whole head half again as big, about the maw's root
    deform(o[0], lambda v: Vector((0, 88, 26)) + (v - Vector((0, 88, 26))) * 1.4)
for e in EYES: e['at'] = list(Vector((0, 88, 26)) + (Vector(e['at']) - Vector((0, 88, 26))) * 1.4); e['r'] *= 1.3
parts.append(HEAD)

export('B_Wyrm', parts, out_path('B_Wyrm'), height=140, lean=0.0)
