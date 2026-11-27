# King Puffcap (boss, split): the Puffball grown regal. The same earthstar - ridged flask, star of rays - bigger in the
# snarl, its sac scarred with lit spots, and for a head a band of gold set with points and a ring of tall caps.
# (from the Puffball:) Puffball, redesigned as an earthstar (not a round ball): a tall ridged flask of a spore sac, taller than wide, standing
# on a star of thick pointed rays that curl back at their tips. Two rays walk (legs), two lash (arms), the rest are fixed
# round the base. On top a beaked pore, lit inside, that bursts (the Head). On the sac's front a scowl and a wide jagged
# maw. Rotting: sores, olive rot with mould, glowing cracks between the ridges.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

reset(); parts = []
SAC, SAC_D = mix(CAP(1), ROOT, 0.35), mix(CAP(1), ROOT_D, 0.6)
RAY_IN, RAY_OUT = FLESH(0.85), ROOT_D
NR = 9                                                              # ridges round the sac

def ridged(v, depth=0.15):
    r = math.hypot(v.x, v.z)
    if r < 1e-6: return v
    a = math.atan2(v.z, v.x); k = 1 + depth * (abs(math.cos(a * NR / 2)) * 2 - 1)
    return Vector((v.x * k, v.y, v.z * k))

# ---------------------------------------------------------------- body: the ridged flask, a face, a ring of fixed rays
EYES = [{'at': [s * 16, 146, 47], 'r': 8, 'out': [s * 0.38, 0.12, 0.92], 's': s} for s in (-1, 1)]
BODY = Part('Body', [0, 56, 0], eyes=EYES)
sac = lathe([(0, 200), (10, 198), (20, 190), (32, 172), (44, 148), (52, 122), (50, 98), (40, 78), (28, 62), (0, 56)], seg=18, name='sac')
deform(sac, ridged)
def sac_paint(m, n):
    a = math.atan2(m.z, m.x); crest = abs(math.cos(a * NR / 2))
    if m.y < 66: return mix(SAC_D, ROT, 0.4)
    return SAC if crest > 0.45 else SAC_D
pieces = [(sac, sac_paint)]
for s in (-1, 1):
    pieces.append((blob((s * 13, 156, 41), (15, 5.5, 8), rot=(0.1, 0, -s * 0.42), name='brow'), lambda m, n: SAC_D))
    pieces.append((blob((s * 28, 60, 2), (16, 12, 16), name='hipsock'), lambda m, n: RAY_OUT))
    pieces.append((blob((s * 54, 120, 14), (11, 11, 11), name='armsock'), lambda m, n: SAC_D))
body, bp = fuse(pieces, voxel=0.8, smooth=1, tris=3000, name='sac')
BODY.add(body, bp)
pj = projector(body)
# the maw: a wide dark gash across the front, ragged teeth top and bottom
BODY.add(decal(pj, (0, 116, 56), (0, -0.05, 1), 31, seg=40, rings=4, lift=0.6, squash=(1, 0.38), wobble=0.12, seed=7), lambda m, n: MOUTH)
seat_eyes(EYES, pj)
for i in range(9):
    x = -21 + i * 5.25; c = 116 + 8.6 * math.sqrt(max(0, 1 - (x / 27) ** 2)) - 1.2; L = 5.5 if i % 2 else 3.6
    h = pj.ray_cast(Vector((x, c, 90)), Vector((0, 0, -1)), 80)
    if h[0] is not None: BODY.add(skin([tuple(h[0] - h[1] * 0.5), tuple(h[0] + h[1] * 2.6 + Vector((0, -L * 1.3, 0)))], [2.4, 0.15], sub=1, name='t'), lambda m, n: TOOTH, 20)
    c2 = 116 - 8.6 * math.sqrt(max(0, 1 - (x / 27) ** 2)) + 1.2; L2 = 4.6 if i % 2 == 0 else 3
    h = pj.ray_cast(Vector((x * 0.95, c2, 90)), Vector((0, 0, -1)), 80)
    if h[0] is not None and 0 < i < 8: BODY.add(skin([tuple(h[0] - h[1] * 0.5), tuple(h[0] + h[1] * 2.4 + Vector((0, L2 * 1.3, 0)))], [2.1, 0.15], sub=1, name='t'), lambda m, n: TOOTH, 20)
# glowing cracks down a few of the ridge valleys, sores, rot
for a in (2.1, 3.0, 4.4, 5.3):
    av = round(a / (2 * math.pi / NR) - 0.5) * (2 * math.pi / NR) + math.pi / NR
    pts = [(math.cos(av) * 60, y, math.sin(av) * 60) for y in (160, 140, 118, 96, 80)]
    BODY.add(ribbon(pj, pts, 2.8, lambda p: (p.x, 0, p.z), lift=0.6), lambda m, n: OOZE)
sore(BODY.add, pj, (40, 100, 34), (0.8, 0, 0.6), 5, 21)
sore(BODY.add, pj, (-46, 150, -18), (-0.9, 0.2, -0.3), 4, 24)
rot_patch(BODY.add, pj, (-30, 120, -44), (-0.6, 0, -0.8), 12, 27)
rot_patch(BODY.add, pj, (34, 166, -26), (0.6, 0.5, -0.5), 9, 30)

# the fixed rays round the base: thick, pointed, pale inside, curling back up at the tips
def ray(a, reach, rise, r0, name='ray'):
    d = Vector((math.cos(a), 0, math.sin(a)))
    pts = [tuple(d * 30 + Vector((0, 62, 0))), tuple(d * (30 + reach * 0.45) + Vector((0, 48, 0))), tuple(d * (30 + reach * 0.85) + Vector((0, 32, 0))), tuple(d * (30 + reach) + Vector((0, 32 + rise, 0)))]
    ob = skin(pts, [r0, r0 * 0.78, r0 * 0.5, r0 * 0.3], sub=2, name=name)
    ob2, _ = fuse([(ob, None)], voxel=1.0, smooth=2, tris=0, name=name)
    sharpen(ob2, Vector(pts[2]), Vector(pts[3]) + (Vector(pts[3]) - Vector(pts[2])).normalized() * 8, r0 * 0.7)
    decimate(ob2, 360)
    return ob2, (lambda m, n: RAY_IN if n.y > 0.15 else RAY_OUT)
for a in (math.pi / 2 + 0.55, math.pi / 2 - 0.55, -math.pi / 2, -math.pi / 2 + 0.8, -math.pi / 2 - 0.8):
    ob, pt = ray(a, 52 if a > 0 else 58, 16, 11)
    BODY.add(ob, pt)
parts.append(BODY)

# ---------------------------------------------------------------- legs: two rays it walks on, down to sharp points
def leg(s):
    X = lambda x: s * x
    pts = [(X(30), 62, 2), (X(52), 52, 4), (X(66), 26, 8), (X(70), 1, 10)]; rad = [15, 12, 8, 2]
    sk = skin(pts, rad, sub=2, name='leg')
    ob, _ = fuse([(sk, None), (blob((X(30), 60, 2), (15, 15, 15), name='ball'), None)], voxel=1.0, smooth=2, tris=0, name='leg')
    sharpen(ob, Vector(pts[2]), Vector((X(71), 0.3, 10)), 9)
    deform(ob, lambda v: Vector((v.x, max(v.y, 0.3), v.z)))
    decimate(ob, 700)
    P = Part('LegFront' if s > 0 else 'LegBack', [X(30), 52, 0]); P.add(ob, lambda m, n: RAY_IN if (n.y > 0.2 and m.y > 30) else RAY_OUT)
    pl = projector(ob)
    P.add(ribbon(pl, [(X(42), 64, 4), (X(54), 58, 6), (X(62), 44, 8)], 2.4, lambda p: (0, 1, 0)), lambda m, n: OOZE)
    return P

# ---------------------------------------------------------------- arms: two rays that lash, from high on the sac's sides
def arm(s):
    X = lambda x: s * x
    pts = [(X(54), 120, 14), (X(76), 114, 24), (X(90), 96, 36), (X(94), 80, 46), (X(90), 72, 56)]; rad = [10, 8.5, 6.5, 4.2, 1.8]
    sk = skin(pts, rad, sub=2, name='arm')
    ob, _ = fuse([(sk, None), (blob((X(54), 120, 14), (10.5, 10.5, 10.5), name='ball'), None)], voxel=0.9, smooth=2, tris=0, name='arm')
    sharpen(ob, Vector(pts[3]), Vector((X(86), 68, 62)), 6)
    decimate(ob, 700)
    P = Part('ArmFront' if s > 0 else 'ArmBack', [X(66), 120, 18]); P.add(ob, lambda m, n: RAY_IN if n.y > 0.2 else RAY_OUT)
    return P
parts += [leg(-1), leg(1), arm(-1), arm(1)]

# ---------------------------------------------------------------- head: a band of gold, points, a ring of tall caps
GOLD, GOLD_D = C(0xd8b040), C(0x8a6a20)
HEAD = Part('Head', [0, 176, 0])
band = lathe([(30, 14), (33, 10), (34, -2), (30, -6), (18, -6), (18, 14)], seg=12, name='band')
bake_world(transform(band, Matrix.Translation((0, 186, 0))))
HEAD.add(band, lambda m, n: GOLD if abs(n.y) < 0.6 else GOLD_D, 300)
for i in range(12):
    a = i * math.pi / 6; L = 14 if i % 2 == 0 else 8
    HEAD.add(skin([(math.cos(a) * 31, 198, math.sin(a) * 31), (math.cos(a) * 32, 198 + L, math.sin(a) * 32)], [4, 0.2], sub=1, name='pt'), lambda m, n: GOLD, 20)
pb = projector(band)
for i in range(6):
    a = i * math.pi / 3 + 0.5; h = 26 + (i % 2) * 14; base = (math.cos(a) * 20, 186, math.sin(a) * 20)
    st, cp = mushroom(base, (math.cos(a) * 0.3, 1, math.sin(a) * 0.3), h, 11)
    HEAD.add(st, lambda m, n: FLESH(0.9), 60); HEAD.add(cp, lambda m, n: CAP(1) if n.y > -0.2 else GILL_A, 140)
HEAD.add(lathe([(0, 206), (12, 204), (8, 194), (0, 192)], seg=10, name='pore'), lambda m, n: GLOW(1), 40)
parts.append(HEAD)

export('B_KingPuff', parts, out_path('B_KingPuff'), height=230)
