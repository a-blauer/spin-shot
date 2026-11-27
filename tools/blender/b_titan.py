# The Stump Titan (boss, ward): a titan of stumps. A great cut trunk of a body, grooved bark, its sawn tops showing their
# rings at the shoulders; a hollow in its chest with a heart of light in it; a smaller stump of a head crowned with bracket
# shelves, two lit knots of eyes and a split of a mouth; arms of whole trunks ending in root hands with long hooked claws;
# thick stump legs on root toes. Moss and rot over it.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

BARK_A, BARK_B, MOSS, RING_A, RING_B = C(0x5a4030), C(0x3e2c20), C(0x4e6a34), C(0xc8a878), C(0xa88458)
BAND_A, BAND_B = CAP(1), mix(CAP(0.75), C(0xf0e2c0), 0.3)
def bark(m, n):
    a = math.atan2(m.z, m.x)
    return BARK_B if abs(math.sin(a * 11 + m.y * 0.015)) < 0.2 else BARK_A
reset(); parts = []
for s in (-1, 1):
    P, _ = root_leg(s, [s * 32, 96, -6], (s * 34, 100, -6), (s * 38, 58, -2), (s * 38, 20, 0), [24, 22, 20], toes=5, toe_len=32, spread=1.3, paint=bark, tip=BARK_B)
    parts.append(P)

BODY = Part('Body', [0, 96, 0])
pieces = [(lathe([(0, 236), (66, 236), (72, 220), (70, 180), (62, 140), (56, 110), (52, 96), (0, 96)], seg=14, name='trunk'), bark)]
pieces += [(blob((s * 32, 100, -6), (26, 22, 26), name='hip'), bark) for s in (-1, 1)]
for s in (-1, 1):                                                    # the shoulder stumps, sawn flat on top
    pieces.append((lathe([(0, 236), (30, 236), (34, 226), (34, 196), (28, 184), (0, 184)], seg=12, name='sho'), bark))
    bake_world(transform(pieces[-1][0], Matrix.Translation((s * 74, -10, 4))))
bo, bp = fuse(pieces, voxel=1.6, smooth=1, tris=0, name='trunk')
carve(bo, blob((0, 168, 62), (30, 36, 30), seg=24, name='hollow'))     # the hollow in its chest
decimate(bo, 5000)
def body_paint(m, n):
    if n.y > 0.85 and m.y > 220:                                      # sawn tops: growth rings
        for cx in (0, -74, 74):
            r = math.hypot(m.x - cx, m.z - (4 if cx else 0))
            if r < (32 if cx else 68): return RING_A if int(r / 5) % 2 == 0 else RING_B
    if math.hypot(m.x, (m.y - 168) * 0.83) < 30 and m.z < 62 and m.z > 20 and n.z < 0.5: return BARK_B   # inside the hollow
    return bp(m, n)
BODY.add(bo, body_paint); pj = projector(bo)
heart = lathe([(0, 16), (8, 12), (13, 4), (12, -6), (6, -14), (0, -18)], seg=8, name='heart')
bake_world(transform(heart, Matrix.Translation((0, 166, 44))))
BODY.add(heart, lambda m, n: GLOW(1), 120)
for k in range(5):                                                   # roots of light from the heart into the hollow's walls
    a = k * 2 * math.pi / 5 + 0.3
    BODY.add(skin([(0, 166, 44), (math.cos(a) * 18, 166 + math.sin(a) * 22, 40), (math.cos(a) * 26, 166 + math.sin(a) * 30, 34)], [2.6, 1.6, 0.6], sub=1, name='vein'), lambda m, n: GLOW(0.8), 30)
for i, (a, y) in enumerate(((2.3, 200), (3.5, 140), (5.1, 180), (0.4, 120))):
    r = 70 - (220 - y) * 0.08; rot_patch(BODY.add, pj, (math.cos(a) * r, y, math.sin(a) * r), (math.cos(a), 0.2, math.sin(a)), 15, 3 + i * 3)
for x, z in ((-20, -30), (30, -20), (-40, 10)):
    BODY.add(decal(pj, (x, 236, z), (0, 1, 0), 14, seg=14, rings=2, lift=0.5, wobble=0.4, seed=x), lambda m, n: MOSS)
grow_mushrooms(BODY, pj, [((40, 236, -30), (0.2, 1, -0.2), 14, 10), ((-50, 236, 26), (-0.3, 1, 0.2), 10, 8), ((74, 226, 4), (0.3, 1, 0), 10, 7)], glow_spots=True)
parts.append(BODY)

for s in (-1, 1):                                                     # arms of whole trunks
    P, ob = root_arm(s, [s * 74, 190, 4], (s * 76, 196, 4), (s * 96, 120, 18), (s * 102, 46, 32), [28, 25, 23], fingers=4, f_len=40, f_r=8, curl=(0, -0.3, 1), spread=0.9,
                     paint=bark, tris=2200, tip=BARK_B)
    pa = projector(ob)
    BODY_ = P
    for k in range(3):
        y = 160 - k * 34; BODY_.add(decal(pa, (s * 112, y, 20), (s, 0, 0.3), 8 + k, seg=12, rings=2, lift=0.6, wobble=0.4, seed=k + s), lambda m, n: MOSS)
    parts.append(P)

EYES = [{'at': [s * 8.6, 243, 52], 'r': 6, 's': s, 'out': [s * 0.15, 0, 1]} for s in (-1, 1)]
HEAD = Part('Head', [0, 214, 10], eyes=EYES)
hd = lathe([(0, 270), (32, 270), (36, 262), (36, 224), (32, 212), (0, 212)], seg=12, name='stump')
bake_world(transform(hd, Matrix.Translation((0, 0, 18))))
pieces = [(hd, bark)] + [(blob((s * 9, 243, 50), (10, 10, 6), name='knot'), lambda m, n: BARK_B) for s in (-1, 1)]
pieces += [(skin([(-24, 254, 48), (0, 250, 54), (24, 254, 48)], [5, 6, 5], sub=1, name='brow'), lambda m, n: BARK_B)]
ho, hp = fuse(pieces, voxel=0.9, smooth=1, tris=2000, name='head')
def head_paint(m, n):
    if n.y > 0.85 and m.y > 266: r = math.hypot(m.x, m.z - 18); return RING_A if int(r / 4) % 2 == 0 else RING_B
    return hp(m, n)
HEAD.add(ho, head_paint); ph = projector(ho); seat_eyes(EYES, ph, 0.2)
HEAD.add(decal(ph, (0, 228, 54), (0, 0, 1), 14, seg=26, rings=3, lift=0.5, squash=(1, 0.3), wobble=0.15, seed=4), lambda m, n: MOUTH)
for i in range(5):
    x = -9 + i * 4.5; top = i % 2 == 0
    h = ph.ray_cast(Vector((x, 231 if top else 225, 100)), Vector((0, 0, -1)), 60)
    if h[0] is not None: HEAD.add(skin([tuple(h[0] - h[1] * 0.4), tuple(h[0] + h[1] * 1.0 + Vector((0, -4.4 if top else 4.4, 0)))], [2, 0.12], sub=1, name='t'), lambda m, n: TOOTH, 14)
for i, (a, y, R) in enumerate(((0.8, 266, 22), (2.4, 258, 18), (4.0, 262, 20), (5.4, 254, 16))):   # a crown of bracket shelves
    sh = lathe([(0, R * 0.22), (R * 0.6, R * 0.2), (R, 0), (R * 0.9, -R * 0.1), (0, -R * 0.12)], seg=8, name='shelf')
    bake_world(transform(sh, Matrix.Translation((math.cos(a) * 34, y, math.sin(a) * 34 + 18)) @ Matrix.Rotation(-a + math.pi / 2, 4, 'Y') @ Matrix.Diagonal((1, 1, 0.6, 1))))
    HEAD.add(sh, lambda m, n: GILL_A if n.y < -0.4 else (BAND_A if i % 2 else BAND_B), 140)
for o in HEAD.pieces: deform(o[0], lambda v: v + Vector((0, 16, 0)))     # sits up out of the trunk
for e in EYES: e['at'][1] += 16
HEAD.add(blob((0, 236, 18), (30, 14, 30), name='neck'), bark, 300)
parts.append(HEAD)

export('B_Titan', parts, out_path('B_Titan'), height=250)
