# Shelfshield (Shield): a Rotcap gone hard. A heavy bark trunk on thick root legs, a cap of three thick stacked bracket
# shelves, faceted and banded, and its front arm grown into a great faceted bracket shield, ringed in bands like a cut
# log, thick as a door, with a boss of flesh at its heart. The face under the shelves is shallow: a scowl and a slot of
# teeth. Rotting: sores, olive rot with mould, a crack lit from inside.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

reset(); parts = []
BAND_A, BAND_B = CAP(1), mix(CAP(0.75), C(0xf0e2c0), 0.3)
for s in (-1, 1):
    P, _ = root_leg(s, [s * 17, 64, 0], (s * 18, 68, 0), (s * 22, 38, 5), (s * 22, 13, 3), [15, 13, 11], toes=4, toe_len=20, spread=1.2)
    parts.append(P)

BODY = Part('Body', [0, 64, 0])
tr = skin([(0, 62, 0), (0, 84, 3), (0, 108, 3), (0, 126, 2), (0, 134, 2)], [(30, 26), (33, 29), (30, 26), (26, 22), (20, 18)], sub=2, name='trunk')
socks = [blob((s * 18, 64, 0), (15, 14, 15), name='hip') for s in (-1, 1)] + [blob((s * 27, 122, 4), (13, 13, 13), name='sho') for s in (-1, 1)]
body, bp = fuse([(tr, lambda m, n: ROOT)] + [(o, lambda m, n: ROOT) for o in socks], voxel=1.0, smooth=4, tris=2200, name='body')
BODY.add(body, bp); pj = projector(body)
BODY.add(decal(pj, (0, 92, 28), (0, 0, 1), 22, seg=48, rings=8, lift=0.9, squash=(0.95, 1.4), wobble=0.06, seed=2), lambda m, n: FLESH(1))
for s in (-1, 1):
    BODY.add(ribbon(pj, [(s * 26, 122, 10), (s * 30, 104, 14), (s * 31, 86, 16), (s * 28, 70, 16)], 2.4, lambda p, s=s: (s, 0, 0.4), lift=0.6), lambda m, n: FLESH(0.85))
BODY.add(ribbon(pj, [(-12, 118, -20), (-16, 100, -26), (-14, 82, -28), (-18, 70, -24)], 2.6, lambda p: (-0.3, 0, -1), lift=0.6), lambda m, n: OOZE)
sore(BODY.add, pj, (-20, 76, 18), (-0.7, 0, 0.7), 5, 3)
rot_patch(BODY.add, pj, (18, 100, -20), (0.7, 0, -0.7), 9, 7)
parts.append(BODY)

P, _ = root_arm(-1, [-25, 122, 4], (-27, 121, 4), (-37, 94, 9), (-40, 68, 15), [11, 9.5, 8.5], fingers=3, f_len=15)
parts.append(P)
# the shield arm: shoulder, elbow, the forearm running into the back of the shield
SA = Part('ArmFront', [25, 122, 4])
arm = skin([(27, 121, 4), (34, 98, 18), (22, 94, 38)], [11, 9.5, 9], sub=2, name='sarm')
ao, apaint = fuse([(arm, lambda m, n: ROOT), (blob((27, 121, 4), (12, 12, 12), name='ball'), lambda m, n: ROOT)], voxel=0.9, smooth=3, tris=900, name='sarm')
SA.add(ao, apaint)
SC = Vector((10, 96, 50))
sh = lathe([(0, 10), (6.5, 9.8), (13, 9.3), (19.5, 8.6), (26, 7.8), (32.5, 6.8), (39, 5.2), (45, 2), (46, -2), (42, -5), (22, -6), (0, -6.5)], seg=10, name='shield')   # thick, faceted, domed
def _chip(v):
    r = math.hypot(v.x, v.z)
    if r < 36: return v
    a = math.atan2(v.z, v.x); bite = max(0, math.sin(a * 4 + 0.6)) ** 4 * 6 + max(0, math.sin(a * 7 + 2)) ** 6 * 3
    return Vector((v.x * (1 - bite / r), v.y, v.z * (1 - bite / r)))
deform(sh, _chip)
SM = Matrix.Translation(SC) @ Matrix.Rotation(math.pi / 2, 4, 'X') @ Matrix.Rotation(0.15, 4, 'Z')
bake_world(transform(sh, SM))
def shield_paint(m, n):
    q = m - SC; r = math.hypot(q.x, q.y)
    if n.z < 0.3 and r > 42: return ROOT_D                        # the bark rim
    if n.z < -0.3: return ROOT
    return BAND_A if int(r / 6.5) % 2 == 0 else BAND_B
SA.add(sh, shield_paint, 2400)
ps = projector(sh)
SA.add(blob(tuple(SC + Vector((0, 0, 10))), (10, 10, 5), name='boss'), lambda m, n: FLESH(0.9), 140)
for k in range(6):                                               # rivets of little caps round the boss
    a = k * math.pi / 3 + 0.3; c = SC + Vector((math.cos(a) * 17, math.sin(a) * 17, 16))
    h = ps.ray_cast(c, Vector((0, 0, -1)), 40)
    if h[0] is not None: SA.add(blob(tuple(h[0]), (3.2, 3.2, 2.2), name='rivet'), lambda m, n: mix(CAP(1), ROOT_D, 0.4), 40)
sore(SA.add, ps, tuple(SC + Vector((-24, -14, 10))), (0, 0, 1), 5, 30)
rot_patch(SA.add, ps, tuple(SC + Vector((26, 18, 8))), (0, 0, 1), 9, 33)
SA.add(ribbon(ps, [tuple(SC + Vector((x, y, 10))) for x, y in ((8, 40), (12, 28), (6, 18), (10, 11))], 2.4, lambda p: (0, 0, 1), lift=0.8), lambda m, n: OOZE)
parts.append(SA)

# head: a shallow face, three thick bracket shelves stacked over it
EYES = [{'at': [s * 9.5, 143, 23.5], 'r': 5, 's': s, 'out': [s * 0.25, 0.05, 0.96]} for s in (-1, 1)]
HEAD = Part('Head', [0, 134, 6], eyes=EYES)
face = [(skin([(0, 122, 4), (0, 138, 6), (0, 154, 6)], [20, 22, 20], sub=2, name='neck'), lambda m, n: mix(FLESH(1), ROOT_D, 0.25))]
for s in (-1, 1): face.append((blob((s * 10, 150, 22), (10, 3.4, 5), rot=(0, 0, s * 0.42), name='brow'), lambda m, n: ROOT_D))
fo, fp = fuse(face, voxel=0.6, smooth=3, tris=1500, name='face')
HEAD.add(fo, fp); pf = projector(fo)
HEAD.add(decal(pf, (0, 130, 24), (0, -0.1, 1), 11, seg=28, rings=3, lift=0.5, squash=(1, 0.42), wobble=0.08, seed=9), lambda m, n: MOUTH)
for i in range(7):
    x = -9 + i * 3; top = i % 2 == 0
    h = pf.ray_cast(Vector((x, 133.4 if top else 126.8, 50)), Vector((0, 0, -1)), 60)
    if h[0] is not None: HEAD.add(skin([tuple(h[0] - h[1] * 0.4), tuple(h[0] + h[1] * 1.0 + Vector((0, -3.2 if top else 3.2, 0)))], [1.5, 0.12], sub=1, name='t'), lambda m, n: TOOTH, 16)
HEAD.add(skin([(0, 150, 6), (0, 170, 3), (0, 194, -2)], [20, 17, 13], sub=2, name='stem'), lambda m, n: mix(CAP(1), ROOT_D, 0.4), 300)
for i, (y, R, z, tilt) in enumerate(((160, 54, 6, 0.04), (173, 44, 3, -0.03), (185, 32, 0, 0.05))):
    shelf = lathe([(0, 9), (R * 0.5, 8), (R * 0.85, 4), (R, 0), (R * 0.95, -3), (R * 0.6, -4), (0, -4)], seg=9, name='shelf')
    def _jag(v, R=R, i=i):
        r = math.hypot(v.x, v.z)
        if r < R * 0.7: return v
        a = math.atan2(v.z, v.x); bite = max(0, math.sin(a * 5 + i * 1.3)) ** 3 * R * 0.12
        return Vector((v.x * (1 - bite / r), v.y - bite * 0.3, v.z * (1 - bite / r)))
    deform(shelf, _jag)
    M = Matrix.Translation((0, y, z)) @ Matrix.Rotation(tilt, 4, 'Z') @ Matrix.Rotation(0.06 * (i - 1), 4, 'X') @ Matrix.Diagonal((1, 1, 0.86, 1))
    bake_world(transform(shelf, M))
    def sp(m, n, y=y, R=R):
        if n.y < -0.4: return GILL_A if int(math.hypot(m.x, m.z) / 3) % 2 else GILL_B
        r = math.hypot(m.x, m.z)
        if n.y < 0.35: return mix(CAP(1), ROOT_D, 0.4)                     # the thick banded edge
        return mix(CAP(1), ROT, 0.5) if r > R * 0.8 else (BAND_A if int(r / 8) % 2 == 0 else BAND_B)
    HEAD.add(shelf, sp, 700)
    pc = projector(shelf)
    if i == 0: rot_patch(HEAD.add, pc, (-22, 172, -18), (0, 1, 0), 7, 50)
    if i == 1: sore(HEAD.add, pc, (22, 184, 10), (0, 1, 0.2), 4, 55)
grow_mushrooms(HEAD, pc, [((-16, 192, 6), (-0.2, 1, 0), 8, 6), ((14, 196, -4), (0.3, 1, -0.1), 6, 5)])
parts.append(HEAD)

export('Shelfshield', parts, out_path('Shelfshield'), height=215)
