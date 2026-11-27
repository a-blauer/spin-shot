# Thunderhead (boss, storm): a storm spirit of the puffballs. A broad angular glaring face - heavy V of a brow, deep-set lit
# eyes, cheekbones cracked with light, a jagged gaping mouth of teeth - set in a great lion's mane of dark storm-puffballs,
# faceted and heaped highest over its crown, pale-topped, their pores lit; forked lightning crackling across the mane;
# chimneys of spore venting on top; under it hang forked bolts of lightning and threads of beaded spore rain.
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

STORM, STORM_L, STORM_D = C(0x4a4258), C(0x857c9a), C(0x2a2434)
reset(); parts = []; rng = random.Random(11)

def bolt(P, start, length, seed, w=2.2, fork=True):
    r = random.Random(seed); pts = [Vector(start)]
    for k in range(6):
        p = pts[-1] + Vector((r.uniform(-9, 9), -length / 6, r.uniform(-6, 6))); pts.append(p)
    P.add(skin([tuple(p) for p in pts], [w * (1 - 0.6 * k / 6) for k in range(7)], sub=1, name='bolt'), lambda m, n: GLOW(1), 60)
    if fork:
        b = pts[2]; q = [b]
        for k in range(3): q.append(q[-1] + Vector((r.uniform(4, 10) * (1 if seed % 2 else -1), -length / 7, r.uniform(-4, 4))))
        P.add(skin([tuple(p) for p in q], [w * 0.7, w * 0.5, w * 0.35, w * 0.2], sub=1, name='fork'), lambda m, n: GLOW(1), 30)

TAIL = Part('Tail', [0, 70, 0])
for i, (x, z) in enumerate(((-34, 10), (30, 18), (0, -16), (-60, -24), (62, -10))):
    bolt(TAIL, (x, 104, z), 92 + (i % 3) * 18, i + 3)
for i in range(10):
    a = i * 2.4; r = 20 + (i % 4) * 16; x, z = math.cos(a) * r, math.sin(a) * r * 0.8; L = 40 + (i % 3) * 16
    TAIL.add(skin([(x, 106, z), (x + 1, 96 - L, z)], [1.2, 0.5], sub=1, name='rain'), lambda m, n: GLOW(0.6), 20)
    for k in range(2): TAIL.add(blob((x + 1, 90 - L * (0.4 + k * 0.5), z), (2.2, 3, 2.2), seg=8, name='drop'), lambda m, n: GLOW(1), 12)
parts.append(TAIL)

# the mane: storm puffballs heaped round the face and over the crown
BODY = Part('Body', [0, 120, 0])
puffs = [((0, 126, -10), (64, 50, 52))]
for k in range(13):
    a = k * 2 * math.pi / 13 + 0.12; up = math.sin(a)
    r = 30 + 8 * max(0, up) + rng.uniform(-3, 3)
    puffs.append(((math.cos(a) * 74, 140 + up * 60 + max(0, up) * 8, 22 - abs(math.cos(a)) * 8), (r, r * 0.9, r)))
for x, y, z, r in ((-44, 206, -16, 30), (10, 214, -20, 34), (52, 202, -12, 28), (-20, 190, -48, 28), (30, 186, -50, 28), (-80, 168, -30, 26), (82, 166, -30, 26)):
    puffs.append(((x, y, z), (r, r * 0.85, r)))
pieces = [(blob(c, rr, e=0.9, seg=10, rot=(rng.uniform(-0.4, 0.4), rng.uniform(0, 3), rng.uniform(-0.4, 0.4)), name='puff'), None) for c, rr in puffs]
bo, _ = fuse(pieces, voxel=2.0, smooth=1, tris=0, name='mane')
deform(bo, lambda v: Vector((v.x, max(v.y, 84 + 0.0006 * (v.x * v.x + v.z * v.z)), v.z)))      # flat and dark beneath
decimate(bo, 4200)
def storm(m, n):
    if n.y < -0.55: return STORM_D
    if n.y > 0.55: return STORM_L
    return STORM
BODY.add(bo, storm); pj = projector(bo)
for k in range(16):                                                    # lit pores over the puffballs
    c, rr = puffs[1 + k % (len(puffs) - 1)]; d = (Vector(c) - Vector((0, 126, -10))).normalized() + Vector((0, 0.4, 0.3))
    h = pj.ray_cast(Vector(c) + d.normalized() * 80, -d.normalized(), 160)
    if h[0] is not None:
        BODY.add(decal(pj, h[0], h[1], 4.5, seg=10, rings=1, lift=0.5), lambda m, n: STORM_D)
        BODY.add(decal(pj, h[0], h[1], 2.6, seg=8, rings=1, lift=0.8), lambda m, n: GLOW(1))
for k in range(7):                                                     # forked lightning crackling across the mane
    a = k * 2 * math.pi / 7 + 0.3; pts = []
    for j in range(5):
        rr = 46 + j * 13; aa = a + (0.12 if j % 2 else -0.12)
        c = Vector((math.cos(aa) * rr, 124 + math.sin(aa) * rr * 0.9, 70 - j * 6))
        h = pj.ray_cast(c + Vector((0, 0, 80)), Vector((0, 0, -1)), 200)
        if h[0] is not None: pts.append(tuple(h[0]))
    if len(pts) >= 3: BODY.add(ribbon(pj, pts, 3.4, lambda p: (0, 0.2, 1), lift=1.0), lambda m, n: GLOW(1))
for x, z, h in ((-30, -20, 16), (20, -30, 22), (46, -4, 12)):         # spore chimneys venting on top
    hit = pj.ray_cast(Vector((x, 300, z)), Vector((0, -1, 0)), 300)
    if hit[0] is None: continue
    b = hit[0] - Vector((0, 3, 0))
    BODY.add(lathe([(0, h), (5, h), (8, h * 0.5), (10, 0), (0, -2)], seg=8, name='chimney'), lambda m, n: STORM_L, 40); bake_world(transform(BODY.pieces[-1][0], Matrix.Translation(b)))
    BODY.add(lathe([(0, 1), (5, 0.5), (0, -1)], seg=8, name='vent'), lambda m, n: GLOW(1), 12); bake_world(transform(BODY.pieces[-1][0], Matrix.Translation(b + Vector((0, h, 0)))))
rot_patch(BODY.add, pj, (-60, 180, 10), (-0.6, 0.7, 0.2), 12, 5)
rot_patch(BODY.add, pj, (50, 110, -50), (0.7, 0, -0.7), 12, 8)
parts.append(BODY)

# the face: broad, angular, glaring
EYES = [{'at': [s * 18, 134, 84], 'r': 8.5, 's': s, 'out': [s * 0.3, 0.05, 0.95]} for s in (-1, 1)]
HEAD = Part('Head', [0, 120, 50], eyes=EYES)
pieces = [(blob((0, 126, 60), (42, 38, 28), e=0.85, seg=12, name='face'), lambda m, n: CAP(1)),
          (skin([(-44, 152, 72), (-22, 146, 86), (0, 134, 92), (22, 146, 86), (44, 152, 72)], [8, 10, 9, 10, 8], sub=1, name='brow'), lambda m, n: mix(CAP(1), ROOT_D, 0.45)),
          (blob((0, 96, 70), (24, 14, 22), e=0.75, seg=12, name='jaw'), lambda m, n: CAP(1))]
for s in (-1, 1): pieces.append((blob((s * 32, 120, 76), (12, 9, 10), e=0.6, seg=10, rot=(0, 0, s * 0.5), name='cheek'), lambda m, n: CAP(1)))
ho, hp = fuse(pieces, voxel=1.0, smooth=1, tris=0, name='face')
cut = blob((0, 106, 96), (22, 10, 22), seg=24, name='mouthcut'); carve(ho, cut)
decimate(ho, 2400)
inm = lambda m: (m.x / 24) ** 2 + ((m.y - 106) / 12) ** 2 + ((m.z - 96) / 24) ** 2 < 1.1
HEAD.add(ho, lambda m, n: MOUTH if inm(m) else hp(m, n)); ph = projector(ho); seat_eyes(EYES, ph, 0.35)
for i in range(9):
    x = -16 + i * 4; L = 13 if i in (1, 7) else 8
    h = ph.ray_cast(Vector((x, 113, 180)), Vector((0, 0, -1)), 200)
    if h[0] is not None:
        b = Vector((x, 115.5, h[0].z - 3)); HEAD.add(skin([tuple(b + Vector((0, 1, 0))), tuple(b + Vector((0, -L, 0.8)))], [3.2, 0.12], sub=1, name='t'), lambda m, n: TOOTH, 12)
    if i % 2 == 1:
        h = ph.ray_cast(Vector((x + 2, 99, 180)), Vector((0, 0, -1)), 200)
        if h[0] is not None:
            b = Vector((x + 2, 96.5, h[0].z - 3)); HEAD.add(skin([tuple(b - Vector((0, 1, 0))), tuple(b + Vector((0, 8, 0.8)))], [2.8, 0.12], sub=1, name='t'), lambda m, n: TOOTH, 12)
for s in (-1, 1):                                                      # light cracking down the cheekbones
    HEAD.add(ribbon(ph, [(s * 28, 126, 84), (s * 34, 116, 82), (s * 30, 106, 80), (s * 36, 98, 74)], 2.6, lambda p, s=s: (s * 0.5, 0, 1), lift=0.7), lambda m, n: GLOW(1))
grow = lambda v: Vector((0, 120, 50)) + (v - Vector((0, 120, 50))) * 1.22 + Vector((0, 16, -8))
for o in HEAD.pieces: deform(o[0], grow)
for e in EYES: e['at'] = list(grow(Vector(e['at']))); e['r'] *= 1.2
parts.append(HEAD)

export('B_Thunderhead', parts, out_path('B_Thunderhead'), height=190)
