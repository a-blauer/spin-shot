# Bracketback (Brute): a rotten stump stood up. A huge hunched barrel of grooved bark, moss on the hump, thick bracket
# shelves stacked over its back and shoulders; log arms ending in heavy knotted hands with thick hooked claws; short
# stump legs on root toes; a small sunk head under a heavy brow shelf: two lit eyes and a jagged slot of a mouth.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

BARK_A, BARK_B, MOSS = C(0x5a4030), C(0x3e2c20), C(0x4e6a34)
BAND_A, BAND_B = CAP(1), mix(CAP(0.75), C(0xf0e2c0), 0.3)
reset(); parts = []
def bark(m, n):
    a = math.atan2(m.z, m.x)
    return BARK_B if abs(math.sin(a * 9 + m.y * 0.02)) < 0.22 else BARK_A

def shelf(P, c, out, R, n=3, seed=0):
    """A stack of bracket shelves growing out of a surface at c, toward out (horizontal)."""
    o = Vector(out).normalized(); ang = math.atan2(o.x, o.z)
    for k in range(n):
        r = R * (1 - k * 0.24); y = c[1] - k * R * 0.42
        sh = lathe([(0, r * 0.22), (r * 0.6, r * 0.2), (r, 0.02 * r), (r * 0.95, -r * 0.1), (0, -r * 0.12)], seg=9, name='shelf')
        def _half(v, r=r, k=k):
            # squash to a half-disc on its back side, jag the front edge
            z = v.z if v.z > 0 else v.z * 0.25
            a = math.atan2(v.z, v.x); rr = math.hypot(v.x, z)
            bite = max(0, math.sin(a * 5 + seed + k)) ** 3 * r * 0.14 if rr > r * 0.6 else 0
            f = (1 - bite / rr) if rr > 1e-3 else 1
            return Vector((v.x * f, v.y - bite * 0.3, z * f))
        deform(sh, _half)
        M = Matrix.Translation((c[0], y, c[2])) @ Matrix.Rotation(ang, 4, 'Y') @ Matrix.Rotation(-0.12, 4, 'X')
        bake_world(transform(sh, M))
        def sp(m, n_, cc=Vector((c[0], y, c[2])), r=r):
            if n_.y < -0.4: return GILL_A
            if n_.y < 0.35: return mix(CAP(1), ROOT_D, 0.4)
            d = (m - cc).length
            return mix(CAP(1), ROT, 0.5) if d > r * 0.85 else (BAND_A if int(d / 6) % 2 == 0 else BAND_B)
        P.add(sh, sp, 260)

# legs: short thick stumps
for s in (-1, 1):
    P, _ = root_leg(s, [s * 26, 92, -8], (s * 28, 96, -8), (s * 32, 54, -4), (s * 32, 18, -2), [21, 19, 17], toes=4, toe_len=26, spread=1.2,
                    paint=lambda m, n: BARK_B if m.y < 10 else bark(m, n))
    parts.append(P)

# body: the hunched barrel
BODY = Part('Body', [0, 92, 0])
pieces = [(skin([(0, 96, -4), (0, 130, 0), (0, 160, 4), (0, 184, 12), (0, 200, 18)], [(46, 42), (50, 46), (54, 46), (60, 44), (44, 34)], sub=2, name='barrel'), bark)]
pieces += [(blob((s * 56, 186, 8), (21, 20, 20), name='sho'), bark) for s in (-1, 1)] + [(blob((s * 28, 96, -8), (22, 20, 22), name='hip'), bark) for s in (-1, 1)]
body, bp = fuse(pieces, voxel=1.4, smooth=4, tris=3200, name='body')
def body_paint(m, n):
    if n.y > 0.55 and m.y > 196: return MOSS
    return bp(m, n)
BODY.add(body, body_paint); pj = projector(body)
BODY.add(blob((0, 182, 36), (17, 16, 15), name='neck'), bark, 300)
# deep cracks in the bark, two lit from inside
for i, (x, z, out) in enumerate(((-30, 40, (-0.6, 0, 1)), (34, 36, (0.6, 0, 1)), (8, -48, (0, 0, -1)))):
    BODY.add(ribbon(pj, [(x, 200, z), (x * 1.1, 172, z * 1.1), (x, 146, z * 1.15), (x * 1.05, 120, z * 1.1)], 3.6, lambda p, out=out: out, lift=0.7), (lambda m, n: OOZE) if i < 2 else (lambda m, n: BLACK))
sore(BODY.add, pj, (-12, 130, 48), (-0.2, 0, 1), 7, 3)
sore(BODY.add, pj, (40, 120, -30), (0.7, 0, -0.7), 6, 6)
rot_patch(BODY.add, pj, (-46, 140, -20), (-1, 0, -0.3), 13, 9)
shelf(BODY, (-30, 196, -36), (-0.5, 0, -1), 32, 3, 1); shelf(BODY, (32, 170, -44), (0.4, 0, -1), 28, 3, 2); shelf(BODY, (0, 146, -50), (0, 0, -1), 30, 2, 3)
shelf(BODY, (-56, 214, 8), (-1, 0, -0.1), 22, 2, 4); shelf(BODY, (56, 214, 8), (1, 0, -0.1), 22, 2, 5)
grow_mushrooms(BODY, pj, [((-14, 222, -6), (-0.2, 1, -0.2), 10, 8), ((10, 222, -14), (0.2, 1, -0.3), 13, 9), ((22, 216, 0), (0.4, 1, 0), 8, 6)])
parts.append(BODY)

# arms: log arms, heavy hands with thick hooked claws
for s in (-1, 1):
    P, ob = root_arm(s, [s * 58, 176, 8], (s * 62, 186, 8), (s * 80, 120, 20), (s * 84, 60, 34), [19, 16.5, 15.5], fingers=3, f_len=36, f_r=7, curl=(0, -0.3, 1), spread=0.8,
                     paint=bark, tris=1800, tip=C(0x1c120c))
    pa = projector(ob)
    shelf(P, (s * 72, 172, -6), (s * 0.6, 0, -0.8), 17, 2, 6 + s)
    rot_patch(P.add, pa, (s * 86, 100, 30), (s, 0, 0.4), 8, 20 + s)
    parts.append(P)

# head: small, sunk between the shoulders
EYES = [{'at': [s * 6.7, 188, 62], 'r': 4.4, 's': s, 'out': [s * 0.15, 0, 1]} for s in (-1, 1)]
HEAD = Part('Head', [0, 176, 30], eyes=EYES)
fo, fp = fuse([(blob((0, 182, 48), (20, 19, 18), name='head'), bark),
               (skin([(-15, 193, 60), (0, 195, 64), (15, 193, 60)], [4, 4.6, 4], sub=1, name='brow'), lambda m, n: BARK_B)], voxel=0.7, smooth=2, tris=1400, name='head')
shelf(HEAD, (0, 200, 50), (0, 0, 1), 17, 1, 9)
HEAD.add(fo, fp); ph = projector(fo)
HEAD.add(decal(ph, (0, 176, 64), (0, 0, 1), 10, seg=26, rings=3, lift=0.5, squash=(1, 0.38), wobble=0.12, seed=4), lambda m, n: MOUTH)
for i in range(6):
    x = -8 + i * 3.2; top = i % 2 == 0
    h = ph.ray_cast(Vector((x, 178.6 if top else 173.6, 90)), Vector((0, 0, -1)), 60)
    if h[0] is not None: HEAD.add(skin([tuple(h[0] - h[1] * 0.4), tuple(h[0] + h[1] * 1.0 + Vector((0, -3.4 if top else 3.4, 0)))], [1.6, 0.12], sub=1, name='t'), lambda m, n: TOOTH, 14)
parts.append(HEAD)

export('Bracketback', parts, out_path('Bracketback'), height=240, scale=1.5)
