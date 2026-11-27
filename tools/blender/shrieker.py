# Shrieker (Screamer): a tall faceted funnel-cap opening upward like a horn, its rim torn, its throat ribbed and lit, on a
# thick root stalk; the face sits on the stalk just under the funnel: two glaring eyes over a stretched-open screaming
# mouth full of teeth. Rotting in places.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

reset(); parts = []
for s in (-1, 1):
    P, _ = root_leg(s, [s * 16, 48, 0], (s * 17, 52, 0), (s * 22, 30, 6), (s * 22, 12, 4), [13, 11, 9], toes=3, toe_len=18)
    parts.append(P)

BODY = Part('Body', [0, 50, 0])
st = skin([(0, 48, 0), (0, 74, 2), (0, 100, 2), (0, 124, 2), (0, 134, 3)], [(23, 20), (18, 16), (16, 14), (17, 15), (16, 14)], sub=2, name='stalk')
socks = [blob((s * 16, 50, 0), (13, 13, 13), name='hip') for s in (-1, 1)] + [blob((s * 16, 129, 2), (9, 9, 9), name='sho') for s in (-1, 1)]
body, bp = fuse([(st, lambda m, n: ROOT)] + [(o, lambda m, n: ROOT) for o in socks], voxel=0.9, smooth=3, tris=1800, name='body')
BODY.add(body, bp); pj = projector(body)
for s in (-1, 1):
    BODY.add(ribbon(pj, [(s * 14, 124, 8), (s * 16, 108, 10), (s * 17, 92, 9), (s * 19, 74, 10), (s * 21, 58, 12)], 2.4, lambda p, s=s: (s * 0.6, 0, 1), lift=0.6), lambda m, n: FLESH(0.85))
sore(BODY.add, pj, (-10, 88, 14), (-0.4, 0, 1), 4.5, 3)
sore(BODY.add, pj, (12, 68, -14), (0.6, 0, -1), 3.6, 5)
rot_patch(BODY.add, pj, (14, 104, -10), (0.8, 0, -0.6), 7, 8)
for o in tuft((-15, 60, 14), (-0.5, 0, 1), 4, n=6, seed=3): BODY.add(o, lambda m, n: MOLD, 40)
parts.append(BODY)
for s in (-1, 1):
    P, _ = root_arm(s, [s * 15, 130, 2], (s * 17, 129, 2), (s * 30, 104, 10), (s * 35, 78, 18), [7.5, 6, 5], fingers=3, f_len=15)
    parts.append(P)

# head: the face on the upper stalk, the horn above it
EYES = [{'at': [s * 7.5, 152, 14.5], 'r': 4.0, 'out': [s * 0.35, 0.05, 0.94], 's': s} for s in (-1, 1)]
HEAD = Part('Head', [0, 150, 4], eyes=EYES)
pieces = [(skin([(0, 128, 3), (0, 146, 4), (0, 164, 4)], [16, 15.5, 14], sub=2, name='neck'), lambda m, n: ROOT_L)]
for s in (-1, 1):
    pieces.append((blob((s * 8, 158, 14), (8, 2.6, 4.4), rot=(0, 0, s * 0.5), name='brow'), lambda m, n: ROOT_D))
    pieces.append((blob((s * 11, 138, 10), (6, 8, 6), name='jaw'), lambda m, n: ROOT_L))
ho, hp = fuse(pieces, voxel=0.55, smooth=2, tris=1600, name='face')
HEAD.add(ho, hp)
ph = projector(ho)
# the screaming mouth: a tall gaping oval, teeth round its edge
HEAD.add(decal(ph, (0, 139, 16), (0, 0, 1), 7.5, seg=28, rings=3, lift=0.5, squash=(0.8, 1.45), wobble=0.1, seed=4), lambda m, n: MOUTH)
for i in range(10):
    a = i * 2 * math.pi / 10 + 0.3; e = Vector((math.cos(a) * 6.2, 139 + math.sin(a) * 10.4, 30))
    h = ph.ray_cast(e, Vector((0, 0, -1)), 40)
    if h[0] is None: continue
    inw = Vector((-math.cos(a), -math.sin(a) * 1.4, 0)).normalized()
    HEAD.add(skin([tuple(h[0] - h[1] * 0.4), tuple(h[0] + h[1] * 1.2 + inw * 3.4)], [1.3, 0.12], sub=1, name='t'), lambda m, n: TOOTH, 16)
# the horn: faceted, flaring, torn at the rim; ribbed throat lit inside
horn = lathe([(0, 184), (13, 196), (27, 216), (42, 236), (51, 246), (54, 242), (46, 232), (31, 210), (20, 186), (15, 168), (13, 160), (0, 158)], seg=16, name='horn')
def _torn(v):
    r = math.hypot(v.x, v.z)
    if r < 38: return v
    a = math.atan2(v.z, v.x); t = (r - 38) / 16
    bite = max(0, math.sin(a * 5 + 0.7)) ** 3 * 9 + max(0, math.sin(a * 2 + 2)) * 4
    return Vector((v.x * (1 - bite * t / r), v.y - bite * t * 0.9, v.z * (1 - bite * t / r)))
deform(horn, _torn)
bake_world(transform(horn, Matrix.Translation((0, 0, 5)) @ Matrix.Rotation(0.1, 4, 'X')))
def horn_paint(m, n):
    r = math.hypot(m.x, m.z - 5)
    inside = n.y > 0.2 and m.y > 180 and r < (m.y - 150) * 0.68
    if inside:
        if r < 22: return GLOW(1) if int((m.y - 180) / 7) % 2 == 0 else GLOW(0.6)
        return GILL_B if int(math.atan2(m.z - 5, m.x) * 6) % 2 else GILL_A
    return mix(CAP(1), ROT, 0.45) if m.y > 236 else CAP(1)
HEAD.add(horn, horn_paint, 1400)
# ribs running up the outside of the horn, and a split along one rib, lit inside
for k in range(8):
    a = k * math.pi / 4 + 0.2
    pts = [(math.cos(a) * rr, y, math.sin(a) * rr + 5) for y, rr in ((166, 16.5), (186, 22), (210, 33), (230, 45.5))]
    q = [tuple(Matrix.Rotation(0.1, 4, 'X') @ Vector(p_)) for p_ in pts]
    HEAD.add(skin(q, [3.4, 3.8, 3.4, 2.2], sub=1, name='rib'), lambda m, n: mix(CAP(1), ROOT_D, 0.45), 120)
pr = projector(horn)
for i, (a, y) in enumerate(((0.4, 222), (2.1, 206), (3.5, 228), (4.9, 198))):
    rr = (y - 150) * 0.66 + 4; c = Vector((math.cos(a) * rr, y, math.sin(a) * rr + 5)); o = Vector((math.cos(a), -0.4, math.sin(a)))
    rot_patch(HEAD.add, pr, tuple(c), tuple(o), 6, 60 + i * 3, mold=(i % 2 == 0))
HEAD.add(ribbon(pr, [tuple(Matrix.Rotation(0.1, 4, 'X') @ Vector((math.cos(2.6) * rr, y, math.sin(2.6) * rr + 5))) for y, rr in ((176, 19.5), (192, 24.5), (208, 30.5), (220, 36))], 2.6, lambda p: (p.x, 0, p.z - 5), lift=0.8), lambda m, n: OOZE)
for i, (a, y) in enumerate(((1.0, 212), (2.9, 226), (4.2, 214), (5.6, 230), (0.1, 228))):
    rr = (y - 150) * 0.62 + 3; c = Matrix.Rotation(0.1, 4, 'X') @ Vector((math.cos(a) * rr, y, math.sin(a) * rr + 5))
    HEAD.add(decal(pr, c, (math.cos(a), -0.5, math.sin(a)), 3.4, seg=12, rings=1, lift=0.5), lambda m, n: GLOW(1))
parts.append(HEAD)

export('Shrieker', parts, out_path('Shrieker'), height=220)
