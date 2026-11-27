# Carapace (boss, shell): a tortoise that is mostly fungus. A vast faceted bracket shell, ringed in growth bands, its rim
# heavy, bitten and dripping, plates of bracket stacked on its crown and little caps growing in the cracks; a pale pored
# underside; four thick stumpy root legs on sharp claws; pushing out under the front rim a beaked head with a scowl.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

BAND_A, BAND_B = CAP(1), mix(CAP(1), C(0xf0e2c0), 0.2)
reset(); parts = []
for role, s, z in (('LegBack', -1, -40), ('LegFront', 1, -40), ('ArmBack', -1, 44), ('ArmFront', 1, 44)):
    zz = 1 if z > 0 else -1
    P, _ = root_leg(1 if 'Front' in role else -1, [s * 46, 46, z], (s * 48, 54, z), (s * 62, 34, z + zz * 6), (s * 62, 14, z + zz * 10), [22, 21, 19], toes=3, toe_len=28, spread=0.9,
                    fwd=(s * 0.5, 0, zz))
    P.role = role; parts.append(P)

BODY = Part('Body', [0, 50, 0])
shell = lathe([(0, 186), (30, 182), (62, 166), (77, 152), (90, 138), (101, 121), (110, 104), (116, 89), (120, 74), (124, 56), (120, 46), (100, 42), (60, 40), (0, 40)], seg=16, name='shell')
deform(shell, lambda v: Vector((v.x, v.y, v.z * 1.1)))
def _bite(v):
    r = math.hypot(v.x, v.z / 1.1)
    if r < 104 or v.y > 80: return v
    a = math.atan2(v.z, v.x); b = max(0, math.sin(a * 6 + 0.4)) ** 4 * 12 + max(0, math.sin(a * 11)) ** 6 * 5
    return Vector((v.x * (1 - b / r), v.y - b * 0.4, v.z * (1 - b / r)))
deform(shell, _bite)
def shell_paint(m, n):
    if n.y < -0.5: return FLESH(0.85)
    RINGS = (182, 166, 152, 138, 121, 104, 89, 74, 56)               # the lathe's rings: a band between each pair
    k = sum(1 for y in RINGS if m.y < y)
    return BAND_B if k % 3 == 2 else (mix(CAP(1), ROOT_D, 0.12) if k % 3 == 1 else BAND_A)
BODY.add(shell, shell_paint)
pieces = []
rim = lathe([(124, 64), (134, 56), (134, 44), (122, 40), (114, 52)], seg=14, name='rim')
deform(rim, lambda v: _bite(Vector((v.x, v.y, v.z * 1.1))))
BODY.add(rim, lambda m, n: mix(CAP(1), ROOT_D, 0.35) if n.y > -0.4 else FLESH(0.8), 900)
pieces += [(blob((sx * 48, 52, z), (20, 18, 20), name='sock'), lambda m, n: FLESH(0.8)) for sx in (-1, 1) for z in (-40, 44)] + [(blob((0, 60, 110), (28, 26, 26), name='neck'), lambda m, n: ROOT)]
so, sp = fuse(pieces, voxel=1.6, smooth=1, tris=1800, name='sockets')
BODY.add(so, sp); ps = projector(shell, rim)
for k in range(18):                                                   # pores on the pale underside
    a = k * 2.4; r = 30 + (k % 4) * 18
    h = ps.ray_cast(Vector((math.cos(a) * r, 0, math.sin(a) * r * 1.1)), Vector((0, 1, 0)), 80)
    if h[0] is not None: BODY.add(decal(ps, h[0], h[1], 3, seg=10, rings=1, lift=0.4), lambda m, n: mix(FLESH(0.8), BLACK, 0.5))
# plates of bracket stacked on the crown
for i, (x, z, R, ang) in enumerate(((-30, -40, 30, 0.6), (36, 10, 26, -0.4), (-10, 40, 22, 2.8), (40, -60, 22, -1.0))):
    hit = ps.ray_cast(Vector((x, 260, z)), Vector((0, -1, 0)), 300)
    if hit[0] is None: continue
    for k in range(2):
        r = R * (1 - k * 0.3)
        sh = lathe([(0, r * 0.22), (r * 0.6, r * 0.2), (r, 0), (r * 0.9, -r * 0.1), (0, -r * 0.12)], seg=8, name='plate')
        M = Matrix.Translation(hit[0] + Vector((0, 2 + k * r * 0.3, 0))) @ Vector((0, 1, 0)).rotation_difference(hit[1]).to_matrix().to_4x4() @ Matrix.Rotation(ang, 4, 'Y')
        bake_world(transform(sh, M))
        BODY.add(sh, lambda m, n: GILL_A if n.y < -0.4 else (BAND_B if k else BAND_A), 160)
grow_mushrooms(BODY, ps, [((-60, 140, 30), (-0.6, 1, 0.2), 10, 9), ((64, 120, -50), (0.7, 1, -0.4), 8, 8), ((10, 186, -10), (0, 1, 0), 14, 11), ((-20, 176, 40), (-0.2, 1, 0.3), 9, 7)], glow_spots=True)
for i, (a, y) in enumerate(((0.8, 120), (2.2, 100), (3.6, 140), (5.0, 110))):
    r = 116 - (y - 74) * 0.5
    rot_patch(BODY.add, ps, (math.cos(a) * r, y, math.sin(a) * r * 1.1), (math.cos(a), 0.6, math.sin(a)), 14, 10 + i * 3)
sore(BODY.add, ps, (-90, 120, -40), (-0.9, 0.4, -0.3), 8, 30)
for i, a in enumerate((0.3, 1.1, 2.0, 3.4, 4.2, 5.3)):                # ooze dripping off the rim
    r = 131; top = Vector((math.cos(a) * r, 42, math.sin(a) * r * 1.1)); L = 10 + (i % 3) * 5
    BODY.add(skin([tuple(top + Vector((0, 2, 0))), tuple(top - Vector((0, L * 0.6, 0))), tuple(top - Vector((0, L, 0)))], [3, 2, 0.8], sub=1, name='drip'), lambda m, n: OOZE, 40)
parts.append(BODY)

EYES = [{'at': [s * 17, 96, 200], 'r': 7, 's': s, 'out': [s * 0.55, 0.15, 0.82]} for s in (-1, 1)]
HEAD = Part('Head', [0, 62, 118], eyes=EYES)
pieces = [(skin([(0, 60, 104), (0, 72, 144), (0, 80, 172)], [28, 27, 27], sub=2, name='neck'), lambda m, n: ROOT),
          (blob((0, 82, 184), (30, 26, 30), e=0.85, name='skull'), lambda m, n: ROOT)]
for s in (-1, 1): pieces.append((blob((s * 16, 104, 190), (14, 4.5, 8), rot=(0.25, 0, -s * 0.4), name='brow'), lambda m, n: ROOT_D))
ho, hp = fuse(pieces, voxel=0.9, smooth=2, tris=2000, name='head')
HEAD.add(ho, hp); ph = projector(ho); seat_eyes(EYES, ph)
beak = skin([(0, 76, 204), (0, 68, 216), (0, 56, 222)], [(16, 10), (10, 7), (0.5, 0.5)], sub=1, name='beak')
HEAD.add(beak, lambda m, n: mix(ROOT_D, BLACK, 0.4), 200)
HEAD.add(decal(ph, (0, 66, 204), (0, -0.3, 1), 15, seg=24, rings=2, lift=0.5, squash=(1, 0.35), wobble=0.1, seed=2), lambda m, n: MOUTH)
for x in (-10, -5, 5, 10):
    h = ph.ray_cast(Vector((x, 69, 260)), Vector((0, 0, -1)), 100)
    if h[0] is not None: HEAD.add(skin([tuple(h[0] - h[1] * 0.4), tuple(h[0] + h[1] * 1.2 + Vector((0, -6, 0)))], [2.6, 0.12], sub=1, name='t'), lambda m, n: TOOTH, 16)
for k in range(6):                                                     # bark plates on the skull
    a = k * 0.6 - 1.5; c = Vector((math.cos(a) * 22, 104 + math.sin(k) * 3, 176 + math.sin(a) * 10))
    HEAD.add(decal(ph, c, (math.cos(a), 1, 0.3), 5, seg=6, rings=1, lift=0.6), lambda m, n: ROOT_D)
for o in HEAD.pieces: deform(o[0], lambda v: v + Vector((0, 12 * max(0, min(1, (v.z - 104) / 60)), 0)))   # held up off the floor
for e in EYES: e['at'][1] += 12
parts.append(HEAD)

export('B_Carapace', parts, out_path('B_Carapace'), height=170, beast=True)
