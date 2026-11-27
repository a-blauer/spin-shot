# Rotcap, modelled after tools/blight/refs/rotcap.png: a huge tilted spotted cap over a scowling stone-grey face, a
# jagged frill collar, a pear-shaped cream belly with bark down its sides and a few glowing pores, huge bark arms ending
# in heavy fists with little mushrooms growing on them, short root legs splayed into root toes.
# Run: python3 tools/blender/rotcap.py   (writes tools/blender/out/Rotcap.json, which the baker picks up)
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
from bkit import *

ROOT, ROOT_D, ROOT_L = C(0x6e4a30), C(0x4c3222), C(0x8a6444)
FACE = [0.06, 0.055, 0.05, 0, 0.62, 0]          # the face: the flesh colour greyed down, like weathered stone
GILL_A, GILL_B = C(0x4a3222), C(0x6e5038)
SPOT = mix(FLESH(1.0), C(0x000000), 0)
MOUTH, TOOTH, PORE_RIM = C(0x1a0e0c), C(0xe8dcc0), C(0x5a3a22)
# the rot: dark olive decay, a sicker olive round it, pale mould, bone claws, ooze lit by the strain's glow
ROT, ROT2, MOLD, BONE, BONE_D, OOZE = C(0x2e2c18), C(0x55542e), C(0xc4cab0), C(0xd6caa6), C(0x7c6c50), GLOW(0.75)
def sore(add, pj, c, d, r, seed):
    """A rotting sore: a ragged dark patch, a sicker rim, a lit wet core."""
    add(decal(pj, c, d, r * 1.45, seg=22, rings=2, lift=1.0, wobble=0.35, seed=seed), lambda m, n: ROT2)
    add(decal(pj, c, d, r, seg=22, rings=2, lift=1.3, wobble=0.3, seed=seed + 1), lambda m, n: ROT)
    add(decal(pj, c, d, r * 0.42, seg=14, rings=1, lift=1.6, wobble=0.2, seed=seed + 2), lambda m, n: OOZE)

reset()
parts = []

# ---------------------------------------------------------------- legs: short and thick, splaying into root toes
def leg(s):
    hip, knee, ank = (s * 25, 50, 0), (s * 31, 30, 6), (s * 33, 12, 8)
    pts = [hip, knee, ank]; rad = [19, 16.5, 14.5]; edges = [(0, 1), (1, 2)]
    for a in (-1.15, -0.4, 0.35, 1.1):                       # four root toes fanning forward and out
        d = (math.sin(a) * s if s > 0 else math.sin(a) * s, 0, math.cos(a))
        mid = (ank[0] + d[0] * 15, 6.5, ank[2] + d[2] * 15); tip = (ank[0] + d[0] * 28, 2.5, ank[2] + d[2] * 28)
        i = len(pts); pts += [mid, tip]; rad += [7.5, 2.8]; edges += [(2, i), (i, i + 1)]
    ob = skin(pts, rad, edges, sub=2, name='leg')
    hipball = blob((s * 25, 52, 0), (20, 20, 20), name='hip')                  # the joint, sitting in the body's hip socket
    lp = lambda m, n: ROOT_D if m.y < 9 else ROOT
    ob, paint = fuse([(ob, lp), (hipball, lp)], voxel=1.1, smooth=5, tris=1300, name='leg')
    ob = deform(ob, lambda v: Vector((v.x, max(v.y, 0.0), v.z)))            # flat on the floor
    P = Part('LegFront' if s > 0 else 'LegBack', [s * 25, 48, 0])
    P.add(ob, paint)
    return P
parts += [leg(-1), leg(1)]

# ---------------------------------------------------------------- body: a pear of cream belly, bark down the sides
BODY = Part('Body', [0, 48, 0])
body = skin([(0, 34, 2), (0, 60, 5), (0, 88, 3), (0, 106, 0), (0, 116, 0)], [(31, 28), (42, 36), (38, 32), (31, 26), (20, 19)], sub=2, name='body')
_sh = [blob((s * 38, 104, -2), (20, 19, 19), name='shoulder') for s in (-1, 1)]    # shoulder sockets the arms swing in
_hp = [blob((s * 22, 46, 0), (19, 16, 18), name='hipsock') for s in (-1, 1)]
body, body_paint_f = fuse([(body, lambda m, n: ROOT)] + [(o, lambda m, n: ROOT) for o in _sh + _hp], voxel=1.3, smooth=8, tris=2400, name='body')
PORES = [Vector(p) for p in ((-15, 96, 30), (-22, 86, 31), (-12, 80, 35), (-19, 70, 37), (-26, 76, 33))]
def body_paint(m, n):
    return ROOT
BODY.add(body, body_paint)
pj = projector(body)
BODY.add(decal(pj, (0, 72, 30), (0, -0.05, 1), 32, seg=64, rings=12, lift=0.9, squash=(0.95, 1.3)), lambda m, n: FLESH(1))   # the belly
for c in PORES:
    BODY.add(decal(pj, c, (c.x * 0.02, 0.05, 1), 5.0, seg=14, rings=1, lift=1.3), lambda m, n: PORE_RIM)
    BODY.add(decal(pj, c, (c.x * 0.02, 0.05, 1), 3.2, seg=14, rings=1, lift=1.6), lambda m, n: GLOW(1))
# a few pale veins running over the bark at the sides
sore(BODY.add, pj, (14, 58, 34), (0.3, -0.1, 1), 6.5, 3)
sore(BODY.add, pj, (21, 84, 29), (0.5, 0.1, 1), 4.5, 7)
sore(BODY.add, pj, (-30, 60, -18), (-0.8, 0, -0.5), 8, 11)
BODY.add(decal(pj, (30, 96, -14), (0.7, 0.2, -0.6), 13, seg=26, rings=3, lift=0.6, wobble=0.45, seed=5), lambda m, n: ROT)   # rot spreading over the back
BODY.add(decal(pj, (-6, 92, -32), (0, 0.2, -1), 15, seg=26, rings=3, lift=0.6, wobble=0.5, seed=9), lambda m, n: ROT2)
for o in tuft((24, 110, -18), (0.6, 0.6, -0.4), 7, n=8, seed=2) + tuft((-18, 70, -30), (-0.4, 0, -1), 6, n=7, seed=4): BODY.add(o, lambda m, n: MOLD, tris=60)
for s in ():
    BODY.add(ribbon(pj, [(s * 30, 104, -6), (s * 33, 92, -2), (s * 35, 80, 2), (s * 32, 66, 8), (s * 30, 56, 12)], 2.2, lambda p, s=s: (s, 0, 0.3)), lambda m, n: FLESH(0.85))
    BODY.add(ribbon(pj, [(s * 33, 92, -2), (s * 31, 84, -14), (s * 28, 74, -22)], 1.8, lambda p, s=s: (s, 0, -0.5)), lambda m, n: FLESH(0.85))
# the frill collar: a jagged cone of flesh round the neck
collar = lathe([(16, 121), (27, 118), (41, 109), (48, 103), (47, 101), (39, 105), (24, 114), (15, 117)], seg=48, name='collar')
deform(collar, lambda v: Vector((v.x, v.y - (3.5 * abs(((math.atan2(v.z, v.x) * 14 / math.pi) % 2) - 1) if math.hypot(v.x, v.z) > 36 else 0), v.z)))
BODY.add(collar, lambda m, n: FLESH(0.9) if n.y > -0.2 else FLESH(0.7), tris=700)
parts.append(BODY)

# ---------------------------------------------------------------- arms: huge bark limbs, heavy fists, little mushrooms
def mushroom(base, up, h, r):
    """A little mushroom growing out of a surface at base, leaning along up."""
    u = Vector(up).normalized(); top = Vector(base) + u * h
    st = skin([tuple(base), tuple(top)], [r * 0.38, r * 0.3], sub=1, name='stalk')
    cap = lathe([(0, r * 0.62), (r * 0.6, r * 0.5), (r, r * 0.12), (r * 0.95, 0), (r * 0.3, r * 0.1), (0, r * 0.12)], seg=16, name='mcap')
    q = Vector((0, 1, 0)).rotation_difference(u)
    cap.matrix_world = Matrix.Translation(top) @ q.to_matrix().to_4x4(); bake_world(cap)
    return st, cap
def arm(s):
    # one branching skeleton from the shoulder ball to the fingertips, so the hand grows out of the arm: a thick upper
    # arm, a heavier forearm, a broad palm, three thick fingers curling down and in, a thumb across the front
    X = lambda x: s * x
    pts = [(X(44), 104, -2), (X(64), 82, 4), (X(73), 70, 8), (X(79), 58, 12), (X(82), 47, 18)]
    rad = [18, 15, 16.5, 14.5, (16, 13)]
    edges = [(0, 1), (1, 2), (2, 3), (3, 4)]
    for k in (-1, 0, 1):                                      # knuckle, middle joint, last joint, the tip curled under
        x = 82 + k * 13
        i = len(pts); pts += [(X(x), 41, 26), (X(x + k * 2.5), 32, 37), (X(x + k * 3.5), 22, 41), (X(x + k * 4.2), 13, 43), (X(x + k * 4.8), 7, 46)]
        rad += [7.6, 6.6, 5.6, 4.4, 2.6]; edges += [(4, i), (i, i + 1), (i + 1, i + 2), (i + 2, i + 3), (i + 3, i + 4)]
    i = len(pts); pts += [(X(68), 48, 25), (X(61), 41, 35), (X(59), 32, 43), (X(57), 25, 51)]; rad += [6.4, 5.4, 4.2, 2.4]; edges += [(4, i), (i, i + 1), (i + 1, i + 2), (i + 2, i + 3)]
    limb = skin(pts, rad, edges, sub=2, name='arm')
    ball = blob((X(44), 104, -2), (18.5, 18.5, 18.5), name='shoulderball')       # the joint, sitting in the body's socket
    hand = blob((X(81), 47, 16), (19, 13, 14), e=0.8, name='hand')            # the meat of the hand
    TIPS = [((X(82 + k * 13 + k * 3.5), 22, 41), (X(82 + k * 13 + k * 5.6), 4.5, 49)) for k in (-1, 0, 1)] + [((X(61), 41, 35), (X(55.5), 20, 56))]
    def ap(m, n):
        for a, b in TIPS:
            if (m - Vector(b)).length < 8: return mix(ROOT_D, C(0x1c120c), 0.6)   # the points darken to black
        return ROOT_D if (m.y < 30 and m.z > 18) else ROOT
    limb, paint = fuse([(limb, ap), (ball, ap), (hand, ap)], voxel=0.7, smooth=3, factor=0.5, tris=0, name='arm')
    for a, b in TIPS: sharpen(limb, a, b, 6.5)                 # each finger and the thumb drawn out to a hooked point
    decimate(limb, 3000)
    P = Part('ArmFront' if s > 0 else 'ArmBack', [X(44), 104, -2])
    P.add(limb, paint)
    pa = projector(limb)
    sore(P.add, pa, (X(68), 78, 18), (0.3 * s, 0, 1), 5, 13 + s)
    sore(P.add, pa, (X(56), 98, -16), (0.5 * s, 0.2, -1), 6, 17 + s)
    P.add(decal(pa, (X(62), 110, -4), (s, 0.6, -0.2), 11, seg=24, rings=3, lift=0.6, wobble=0.5, seed=21 + s), lambda m, n: ROT)
    for o in tuft((X(58), 112, -6), (s * 0.6, 0.8, -0.3), 6, n=7, seed=30 + s): P.add(o, lambda m, n: MOLD, tris=60)
    P.add(ribbon(pa, [(X(50), 112, 12), (X(58), 98, 17), (X(67), 82, 20), (X(74), 68, 24), (X(79), 60, 27)], 2.4, lambda p: (0.2 * s, 0, 1)), lambda m, n: FLESH(0.85))
    P.add(ribbon(pa, [(X(62), 94, 18), (X(72), 90, 10), (X(79), 84, 4)], 2.2, lambda p: (s, 0, 0.4), lift=0.7), lambda m, n: OOZE)   # a crack of rot, lit from inside
    for base, up, h, r in (((X(54), 112, -8), (s * 0.5, 1, -0.4), 9, 8), ((X(72), 76, -6), (s * 0.9, 0.5, -0.5), 7, 6.5), ((X(62), 104, 13), (s * 0.6, 1, 0.5), 6, 5.5)):
        u = Vector(up).normalized(); hit = pa.ray_cast(Vector(base) + u * 30, -u, 80)
        if hit[0] is not None: base = hit[0] - u * 1.5
        st, cp = mushroom(base, up, h, r)
        P.add(st, lambda m, n: FLESH(0.9), tris=80); P.add(cp, lambda m, n, up=up: CAP(1) if n.dot(Vector(up).normalized()) > -0.2 else GILL_A, tris=160)
    return P
parts += [arm(-1), arm(1)]

# ---------------------------------------------------------------- head: the stone face under a huge spotted cap
EYES = [{'at': [s * 12.5, 137, 29.5], 'r': 6.2, 'out': [s * 0.22, 0, 1], 's': s} for s in (-1, 1)]
HEAD = Part('Head', [0, 116, 2], eyes=EYES)
face = blob((0, 131, 8), (28, 21, 23), e=0.72, name='face')
_cheeks = [blob((s * 15, 127, 22), (11, 8, 9), name='cheek') for s in (-1, 1)]
face, _fp = fuse([(face, lambda m, n: FACE)] + [(o, lambda m, n: FACE) for o in _cheeks], voxel=0.8, smooth=4, tris=1100, name='face')
HEAD.add(face, lambda m, n: FACE)
pf = projector(face)
HEAD.add(decal(pf, (-17, 124, 22), (-0.5, -0.1, 1), 7, seg=20, rings=2, lift=0.5, wobble=0.5, seed=71), lambda m, n: ROT2)
HEAD.add(ribbon(pf, [(9, 150, 22), (13, 144, 28), (19, 137, 27), (22, 130, 24)], 1.4, lambda p: (0.4, 0, 1), lift=0.6), lambda m, n: ROT)
HEAD.add(ribbon(pf, [(-24, 140, 14), (-22, 132, 20), (-25, 124, 17)], 1.2, lambda p: (-1, 0, 0.5), lift=0.6), lambda m, n: ROT)
HEAD.add(blob((0, 123.5, 27.2), (14, 5.2, 4), e=0.4, name='mouth'), lambda m, n: MOUTH, tris=120)   # a dark slot of a mouth set into the face
for s in (-1, 1):                                             # heavy brows, low over the inner corner of each eye: a scowl
    b = blob((s * 12, 145.5, 28), (14, 4.6, 6), e=0.7, rot=(0, 0, s * 0.4), name='brow')
    HEAD.add(b, lambda m, n: FACE, tris=180)
    t = blob((s * 5.8, 125.2, 29.4), (3.8, 4.2, 1.6), e=0.4, name='tooth')          # two square teeth hanging from the lip
    HEAD.add(t, lambda m, n: TOOTH, tris=60)
cap = lathe([(0, 62), (18, 60), (42, 50), (64, 35), (82, 19), (93, 7), (96, 2), (93, -1), (74, 2), (46, 8), (22, 12), (10, 13)], seg=96, name='cap')
BITES = [(0.5, 0.22, 20), (1.75, 0.14, 13), (2.6, 0.26, 24), (3.9, 0.17, 15), (4.75, 0.22, 21), (5.75, 0.13, 12)]   # (angle, width, depth cm)
def _rot(v):
    r = math.hypot(v.x, v.z)
    if r < 52: return v
    a = math.atan2(v.z, v.x); bite = 0
    for a0, w, dep in BITES:
        da = (a - a0 + math.pi) % (2 * math.pi) - math.pi; bite = max(bite, dep * math.exp(-(da / w) ** 2))
    k = (r - 52) / 44; nr = r - bite * k
    return Vector((v.x * nr / r, v.y - bite * 0.35 * k - 2.5 * k * (1 + math.sin(a * 3 + 1)), v.z * nr / r))   # bitten in, and sagging
deform(cap, _rot)
CAPM = Matrix.Translation((0, 139, 2)) @ Matrix.Rotation(-0.09, 4, 'X') @ Matrix.Rotation(-0.12, 4, 'Z')   # tipped back so the face shows, and to one side
cap.matrix_world = CAPM; bake_world(cap)
# spots laid out on the cap seen from above: (angle, how far out 0..1, radius in cm), the cap's own centre, unrotated
SPOTS = [(0, 0.05, 13), (0.6, 0.45, 12), (2.2, 0.42, 11), (3.8, 0.46, 12), (5.2, 0.44, 10), (1.4, 0.74, 10), (3.0, 0.72, 9), (4.5, 0.74, 10), (5.9, 0.76, 8.5), (0.3, 0.8, 8), (2.2, 0.88, 6.5), (3.7, 0.9, 6.5), (5.1, 0.9, 6)]
CAPI = CAPM.inverted()
def cap_paint(m, n):
    if n.y < -0.25:                                           # the underside: radial gills, gone dark and rotten near the rim
        a = math.atan2(m.z - 3, m.x)
        g = GILL_B if math.sin(a * 16) > 0.3 else GILL_A   # broad gills: 40 thin ones shimmered at range
        return mix(g, ROT, 0.5) if math.hypot((CAPI @ m).x, (CAPI @ m).z) > 74 else g
    q = CAPI @ m; t = max(0.0, min(1.0, (math.hypot(q.x, q.z) - 62) / 30))
    return mix(CAP(1), ROT, 0.55 * t)                         # decay creeping in from the rim
HEAD.add(cap, cap_paint, tris=2600)
pc = projector(cap)
for i, (a, t, r) in enumerate(((0.9, 0.62, 16), (2.45, 0.55, 13), (4.2, 0.5, 18), (5.4, 0.66, 11), (3.3, 0.25, 9))):   # rot spreading over the top
    lc = Vector((math.cos(a) * t * 90, 70, math.sin(a) * t * 90)); wc = CAPM @ lc; up = (CAPM.to_3x3() @ Vector((0, 1, 0))).normalized()
    hit = pc.ray_cast(wc, -up, 200)
    if hit[0] is None: continue
    HEAD.add(decal(pc, hit[0], hit[1], r * 1.35, seg=26, rings=3, lift=1.0, wobble=0.45, seed=40 + i), lambda m, n: ROT2)
    HEAD.add(decal(pc, hit[0], hit[1], r, seg=26, rings=3, lift=1.4, wobble=0.45, seed=50 + i), lambda m, n: ROT)
    for o in tuft(hit[0], hit[1], r * 0.45, n=6, seed=60 + i): HEAD.add(o, lambda m, n: MOLD, tris=50)
for i, a in enumerate((1.2, 2.2, 3.55, 4.4, 5.25, 0.15)):                       # ooze hanging off the brim in drips
    lp = _rot(Vector((math.cos(a) * 88, 1, math.sin(a) * 88))); top = CAPM @ lp; L = 7 + (i % 3) * 4
    HEAD.add(skin([tuple(top + Vector((0, 1, 0))), tuple(top - Vector((0, L * 0.6, 0))), tuple(top - Vector((0, L, 0)))], [2.6, 1.8, 0.9], sub=1, name='drip'), lambda m, n: OOZE, tris=60)
for a, t, r in SPOTS:
    lc = Vector((math.cos(a) * t * 90, 70, math.sin(a) * t * 90))        # above the cap, in its own frame
    wc = CAPM @ lc; up = (CAPM.to_3x3() @ Vector((0, 1, 0))).normalized()
    hit = pc.ray_cast(wc, -up, 200)
    if hit[0] is None: continue
    HEAD.add(decal(pc, hit[0], hit[1], r, seg=18, rings=2, lift=0.45, squash=(1, 0.9), spin=a, wobble=0.15, seed=a), lambda m, n: SPOT)
parts.append(HEAD)

os.makedirs(os.path.join(os.path.dirname(__file__), 'out'), exist_ok=True)
export('Rotcap', parts, os.path.join(os.path.dirname(__file__), 'out', 'Rotcap.json'), height=205)
