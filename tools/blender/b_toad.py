# Grandfather Toad (boss, tide): a toad the size of a hut. A broad squat warty body, faceted, a pale belly, warts all over
# (some lit from inside), a garden of mushrooms and bracket on its back; a huge wide head with a mouth across the whole
# front, a row of teeth along it; two big scowling eyes up on bumps; thick bowed legs on webbed feet with sharp toes.
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

TD_A, TD_B, TD_C, BELLY = C(0x5a6a3a), C(0x7a8a4e), C(0x3e4a28), C(0xd8cca0)
skin_p = lambda m, n: BELLY if (n.y < -0.3 and m.y < 70) else (TD_B if n.y > 0.65 else TD_A)
reset(); parts = []; rng = random.Random(5)

def webbed_leg(s, role, pivot, hip, knee, ank, rad, toes_dir):
    P, ob = root_leg(s, pivot, hip, knee, ank, rad, toes=4, toe_len=rad[2] * 3.2, spread=1.1, paint=lambda m, n: TD_C if m.y < 8 else skin_p(m, n), tip=C(0x1c180c), fwd=toes_dir)
    P.role = role
    A = Vector(ank); f = Vector(toes_dir).normalized(); side = Vector((0, 1, 0)).cross(f).normalized(); L = rad[2] * 3.2 * 0.8
    pts = [tuple(A + (f * math.cos(a) - side * math.sin(a)) * L + Vector((0, -A.y + 1.5, 0))) for a in (-1.0, -0.33, 0.33, 1.0)]
    P.add(fan(tuple(A + Vector((0, -A.y + 2, 0))), pts, t=1.4), lambda m, n: TD_C, 60)          # the web between the toes
    return P
parts.append(webbed_leg(-1, 'LegBack', [-60, 40, -40], (-64, 50, -40), (-110, 42, -52), (-94, 12, -18), [24, 18, 14], (-0.4, 0, 1)))
parts.append(webbed_leg(1, 'LegFront', [60, 40, -40], (64, 50, -40), (110, 42, -52), (94, 12, -18), [24, 18, 14], (0.4, 0, 1)))
parts.append(webbed_leg(-1, 'ArmBack', [-50, 50, 50], (-54, 56, 50), (-68, 30, 62), (-66, 11, 72), [18, 14, 12], (-0.3, 0, 1)))
parts.append(webbed_leg(1, 'ArmFront', [50, 50, 50], (54, 56, 50), (68, 30, 62), (66, 11, 72), [18, 14, 12], (0.3, 0, 1)))

BODY = Part('Body', [0, 50, 0])
pieces = [(blob((0, 84, -6), (100, 66, 100), e=0.85, seg=16, name='body'), skin_p)]
pieces += [(blob(c, (24, 22, 24), name='sock'), skin_p) for c in ((-62, 52, -40), (62, 52, -40), (-52, 56, 50), (52, 56, 50))] + [(blob((0, 90, 60), (60, 40, 40), name='neck'), skin_p)]
warts = []
for i in range(26):
    a = rng.uniform(0, 2 * math.pi); y = rng.uniform(70, 140); r = math.sqrt(max(0.05, 1 - ((y - 84) / 66) ** 2)) * 100
    c = (math.cos(a) * r, y, math.sin(a) * r - 6); warts.append(c)
    pieces.append((blob(c, (9 + i % 3 * 3,) * 3, seg=8, name='wart'), skin_p))
bo, bp = fuse(pieces, voxel=1.6, smooth=1, tris=4200, name='body')
BODY.add(bo, bp); pj = projector(bo)
for i, c in enumerate(warts[::3]):                                    # some warts lit from inside
    o = (Vector(c) - Vector((0, 84, -6))).normalized()
    BODY.add(decal(pj, Vector(c) + o * 6, o, 4, seg=10, rings=1, lift=0.6), lambda m, n: GLOW(1))
grow_mushrooms(BODY, pj, [((x, 150, z), (x * 0.004, 1, z * 0.004), h, r) for x, z, h, r in ((-26, -30, 30, 16), (20, -50, 22, 12), (6, -10, 40, 20), (36, -16, 18, 10), (-40, -60, 16, 11), (-8, -70, 24, 13))], glow_spots=True)
for i, (x, z) in enumerate(((-60, 20), (60, -10))): rot_patch(BODY.add, pj, (x, 130, z), (x / 60, 1, 0.2), 16, 4 + i * 3)
sore(BODY.add, pj, (-90, 80, -30), (-1, 0, -0.2), 9, 10)
parts.append(BODY)

EYES = [{'at': [s * 40, 136, 106], 'r': 12, 's': s, 'out': [s * 0.4, 0.35, 0.85]} for s in (-1, 1)]
HEAD = Part('Head', [0, 80, 60], eyes=EYES)
pieces = [(blob((0, 96, 92), (78, 46, 48), e=0.85, seg=16, name='head'), skin_p)]
for s in (-1, 1):
    pieces.append((blob((s * 38, 128, 98), (19, 17, 19), name='eyebump'), skin_p))
    pieces.append((blob((s * 36, 148, 106), (16, 5, 9), rot=(0.3, 0, -s * 0.38), name='brow'), lambda m, n: TD_C))
ho, hp = fuse(pieces, voxel=1.1, smooth=1, tris=2600, name='head')
def gape(v):                                                          # the mouth: a deep slot right across the front, curving back
    cu = v.x * v.x / 4900; my = 86 - cu * 10; mz = 132 - cu * 26
    if abs(v.y - my) < 5 and v.z > mz - 22: return Vector((v.x, v.y, min(v.z, mz - 22)))
    return v
deform(ho, gape)
HEAD.add(ho, lambda m, n: MOUTH if abs(m.y - (86 - m.x * m.x / 4900 * 10)) < 6 and m.z > 60 and n.z < 0.5 else hp(m, n)); ph = projector(ho); seat_eyes(EYES, ph, 0.25)
for i in range(13):                                                   # a row of teeth along the top lip, a few up from the bottom
    x = -66 + i * 11; cu = x * x / 4900; y = 91 - cu * 10; z = 130 - cu * 26
    h = ph.ray_cast(Vector((x, y + 2, z + 60)), Vector((0, -0.1, -1)).normalized(), 120)
    if h[0] is None: continue
    b = h[0] - Vector((0, 0, 2)); L = 9 if i % 3 == 1 else 6
    HEAD.add(skin([tuple(b), tuple(b + Vector((0, -L, 1.5)))], [3.2, 0.15], sub=1, name='t'), lambda m, n: TOOTH, 14)
parts.append(HEAD)

export('B_Toad', parts, out_path('B_Toad'), height=170, beast=True)
