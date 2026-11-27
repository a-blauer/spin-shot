# The Furnace (boss, heat): a burned-out stump still burning inside. A huge hunched barrel of charred bark, cracked all
# over with embers, split open down the chest on a core of light; two hollow chimney stumps on its shoulders, glowing at
# their mouths; log arms ending in huge charred hands with thick hooked claws; short stump legs on root toes; a small sunk
# head under a heavy brow, a scowl of fire. Its colours are its own (fire whatever the strain), the core takes the glow.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

CHAR, CHAR2, CHAR3, EMBER, EMBER2 = C(0x2a2220), C(0x3e3230), C(0x1a1414), C(0xff8a3a), C(0xffc060)
def char(m, n):
    return CHAR2 if n.y > 0.5 else (CHAR3 if n.y < -0.4 else CHAR)
reset(); parts = []
for s in (-1, 1):
    P, _ = root_leg(s, [s * 28, 92, -8], (s * 30, 98, -8), (s * 34, 56, -4), (s * 34, 18, -2), [22, 20, 18], toes=4, toe_len=26, spread=1.2, paint=char, tip=CHAR3)
    parts.append(P)

BODY = Part('Body', [0, 92, 0])
pieces = [(skin([(0, 98, -4), (0, 132, 0), (0, 166, 6), (0, 192, 12), (0, 210, 14)], [(48, 44), (54, 48), (58, 48), (64, 46), (48, 36)], sub=2, name='barrel'), char)]
pieces += [(blob((s * 60, 194, 8), (21, 20, 20), name='sho'), char) for s in (-1, 1)] + [(blob((s * 30, 98, -8), (22, 20, 22), name='hip'), char) for s in (-1, 1)]
pieces += [(blob((0, 200, 36), (18, 17, 16), name='neck'), char)]
for s in (-1, 1):                                                   # chimney stumps
    pieces.append((lathe([(0, 240), (12, 248), (16, 248), (17, 230), (22, 210), (24, 194), (0, 194)], seg=9, name='chimney'), char))
    bake_world(transform(pieces[-1][0], Matrix.Translation((s * 50, 0, -6)) @ Matrix.Rotation(s * -0.1, 4, 'Z')))
body, bp = fuse(pieces, voxel=1.4, smooth=2, tris=0, name='body')
# hollow the chimneys and split the chest
def carve(v):
    for s in (-1, 1):
        c = Vector((s * 42 + s * 0.12 * (v.y - 212), v.y, -6))
    return v
deform(body, carve)
decimate(body, 4200)
def body_paint(m, n):
    for s in (-1, 1):
        cx = s * 50 + s * 0.1 * (m.y - 0)
        if m.y > 238 and math.hypot(m.x - (s * 50 + s * 0.1 * m.y), m.z + 6) < 12: return EMBER2
    return bp(m, n)
BODY.add(body, body_paint); pj = projector(body)
# the split down the chest, lit from inside, its edges glowing
split = [(math.sin(y * 0.08) * 4, y, 0) for y in (208, 190, 172, 154, 136, 118)]
for k, (x, y, _) in enumerate(split):
    h = pj.ray_cast(Vector((x, y, 200)), Vector((0, 0, -1)), 300)
    if h[0] is not None: split[k] = tuple(h[0])
BODY.add(ribbon(pj, split, 22, lambda p: (0, 0, 1), lift=0.6, taper=False), lambda m, n: EMBER)
BODY.add(ribbon(pj, split, 12, lambda p: (0, 0, 1), lift=1.0, taper=False), lambda m, n: EMBER2)
import random as _r
rng = _r.Random(3)
for k in range(14):                                                 # cracks of embers wandering over the bark
    a = rng.uniform(0, 2 * math.pi); y = rng.uniform(110, 205); r = 70
    pts = []
    for j in range(4):
        aa = a + (j - 1.5) * 0.09 + rng.uniform(-0.05, 0.05); yy = y - j * 9
        h = pj.ray_cast(Vector((math.cos(aa) * 120, yy, math.sin(aa) * 120)), -Vector((math.cos(aa), 0, math.sin(aa))), 200)
        if h[0] is not None: pts.append(tuple(h[0]))
    if len(pts) >= 3 and not (abs(pts[0][0]) < 16 and pts[0][2] > 0): BODY.add(ribbon(pj, pts, 2.4, lambda p: (p.x, 0, p.z), lift=0.6), lambda m, n: EMBER)
for k, (x, y, z) in enumerate(split[1:-1]):                         # the charred bark curling back from the split
    for s in (-1, 1):
        b = Vector((x + s * 11, y, z - 2))
        BODY.add(skin([tuple(b), tuple(b + Vector((s * 6, -4, 5))), tuple(b + Vector((s * 9, -8, 3)))], [4, 2.6, 0.2], sub=1, name='curl'), lambda m, n: CHAR3, 30)
parts.append(BODY)

for s in (-1, 1):
    P, ob = root_arm(s, [s * 62, 182, 6], (s * 66, 192, 6), (s * 84, 124, 18), (s * 88, 64, 32), [20, 17, 16.5], fingers=3, f_len=38, f_r=7.5, curl=(0, -0.3, 1), spread=0.8,
                     paint=char, tris=2000, tip=EMBER)
    parts.append(P)

EYES = [{'at': [s * 7, 208, 62], 'r': 4.6, 's': s, 'out': [s * 0.15, 0, 1]} for s in (-1, 1)]
HEAD = Part('Head', [0, 196, 30], eyes=EYES)
fo, fp = fuse([(blob((0, 204, 48), (21, 19, 18), name='head'), char), (skin([(-18, 216, 58), (0, 214, 64), (18, 216, 58)], [5, 6, 5], sub=1, name='brow'), lambda m, n: CHAR3)],
              voxel=0.7, smooth=2, tris=1400, name='head')
HEAD.add(fo, fp); ph = projector(fo); seat_eyes(EYES, ph)
HEAD.add(decal(ph, (0, 196, 64), (0, 0, 1), 13, seg=26, rings=3, lift=0.5, squash=(1, 0.32), wobble=0.14, seed=4), lambda m, n: MOUTH)
HEAD.add(decal(ph, (0, 196, 64), (0, 0, 1), 9, seg=20, rings=2, lift=0.8, squash=(1, 0.22), wobble=0.1, seed=5), lambda m, n: EMBER2)
for i in range(6):
    x = -8 + i * 3.2; top = i % 2 == 0
    h = ph.ray_cast(Vector((x, 199 if top else 193, 100)), Vector((0, 0, -1)), 60)
    if h[0] is not None: HEAD.add(skin([tuple(h[0] - h[1] * 0.4), tuple(h[0] + h[1] * 1.0 + Vector((0, -3.6 if top else 3.6, 0)))], [1.7, 0.12], sub=1, name='t'), lambda m, n: CHAR3, 14)
parts.append(HEAD)

export('B_Furnace', parts, out_path('B_Furnace'), height=240, scale=1.4)
