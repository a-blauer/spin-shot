# Thunderhead (boss, storm): a storm cloud of puffballs. A mass of faceted puffball lumps packed together and heaped up to
# a flat spreading anvil on top, cut flat and dark beneath, cracks of light between the lumps; a heavy-browed scowling
# face pushing out of the front with a jagged mouth; under it thick lit threads of spore rain, beaded with drops.
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

reset(); parts = []
DARK, DARK2 = mix(CAP(0.55), C(0x18141c), 0.55), mix(CAP(0.8), C(0x18141c), 0.35)
rng = random.Random(7)

TAIL = Part('Tail', [0, 70, 0])
for i in range(11):
    a = i * 2.4; r = 16 + (i % 4) * 18; x, z = math.cos(a) * r, math.sin(a) * r * 0.8; L = 60 + (i % 3) * 14
    TAIL.add(skin([(x, 82, z), (x + 2, 82 - L * 0.5, z), (x - 1, 82 - L, z + 1)], [2.2, 1.6, 0.4], sub=1, name='thread'), lambda m, n: GLOW(0.8), 40)
    for k in range(3):
        y = 76 - L * (0.25 + k * 0.3); TAIL.add(blob((x + 1, y, z), (2.6, 3.4, 2.6), seg=8, name='drop'), lambda m, n: GLOW(1), 20)
parts.append(TAIL)

BODY = Part('Body', [0, 120, 0])
lumps = [((0, 130, 0), (70, 46, 60)), ((-70, 120, 10), (48, 38, 44)), ((70, 122, -6), (50, 40, 46)), ((-40, 150, -40), (50, 40, 44)), ((40, 156, -30), (52, 42, 46)),
         ((0, 168, 20), (54, 40, 46)), ((-90, 104, -30), (34, 28, 32)), ((92, 106, 30), (32, 28, 30)), ((0, 110, -60), (48, 34, 36)), ((-50, 112, 50), (38, 30, 34)), ((52, 112, 52), (36, 30, 32))]
pieces = [(blob(c, r, e=0.9, rot=(rng.uniform(-0.3, 0.3), rng.uniform(0, 3), rng.uniform(-0.3, 0.3)), seg=10, name='lump'), lambda m, n: CAP(1)) for c, r in lumps]
pieces.append((blob((0, 186, -6), (98, 26, 74), e=0.85, seg=12, name='anvil'), lambda m, n: CAP(1)))   # the anvil spreading on top
bo, _ = fuse(pieces, voxel=2.0, smooth=1, tris=0, name='cloud')
deform(bo, lambda v: Vector((v.x, max(v.y, 84 + 0.0008 * (v.x * v.x + v.z * v.z)), v.z)))           # cut flat beneath
decimate(bo, 3000)
def cloud_paint(m, n):
    if n.y < -0.6: return DARK
    if m.y < 100: return DARK2
    return CAP(1) if n.y > 0.2 else mix(CAP(1), DARK2, 0.35)
BODY.add(bo, cloud_paint); pj = projector(bo)
# cracks of light between the lumps
for pts in (((-30, 118, 50), (-24, 140, 52), (-12, 160, 46), (-16, 178, 40)), ((34, 112, 48), (40, 134, 50), (30, 154, 44)), ((-80, 130, 30), (-88, 150, 10), (-82, 170, -20)),
            ((88, 128, 20), (96, 144, -4), (88, 166, -24)), ((10, 150, -70), (-10, 168, -64), (-30, 184, -50))):
    BODY.add(ribbon(pj, pts, 4.2, lambda p: (p.x, 0.2, p.z), lift=0.8), lambda m, n: GLOW(1))
for i, (x, z) in enumerate(((-60, -40), (50, -50), (-20, 60))): rot_patch(BODY.add, pj, (x, 200, z), (0, 1, 0), 14, 5 + i * 3)
for k in range(10):                                                   # spore vents under the cloud
    a = k * 2.4; r = 20 + (k % 4) * 20
    h = pj.ray_cast(Vector((math.cos(a) * r, 40, math.sin(a) * r)), Vector((0, 1, 0)), 120)
    if h[0] is not None: BODY.add(decal(pj, h[0], h[1], 5, seg=10, rings=1, lift=0.5), lambda m, n: GLOW(1))
parts.append(BODY)

EYES = [{'at': [s * 20, 128, 104], 'r': 8, 's': s, 'out': [s * 0.3, 0.05, 0.95]} for s in (-1, 1)]
HEAD = Part('Head', [0, 120, 50], eyes=EYES)
hp_ = [(blob((0, 118, 76), (42, 38, 34), e=0.9, seg=12, name='face'), lambda m, n: CAP(1)),
       (skin([(-40, 140, 92), (-18, 136, 106), (0, 128, 110), (18, 136, 106), (40, 140, 92)], [8, 10, 9, 10, 8], sub=1, name='brow'), lambda m, n: DARK2)]
ho, hp = fuse(hp_, voxel=1.0, smooth=1, tris=1600, name='face')
HEAD.add(ho, hp); ph = projector(ho); seat_eyes(EYES, ph)
HEAD.add(decal(ph, (0, 100, 108), (0, -0.2, 1), 24, seg=32, rings=3, lift=0.6, squash=(1, 0.36), wobble=0.12, seed=3), lambda m, n: MOUTH)
for i in range(9):
    x = -18 + i * 4.5; top = i % 2 == 0; L = 9 if i in (1, 7) else 5.5
    h = ph.ray_cast(Vector((x, 105 if top else 95, 170)), Vector((0, 0, -1)), 100)
    if h[0] is not None: HEAD.add(skin([tuple(h[0] - h[1] * 0.4), tuple(h[0] + h[1] * 1.6 + Vector((0, -L if top else L, 0)))], [2.6, 0.12], sub=1, name='t'), lambda m, n: TOOTH, 16)
HEAD.add(ribbon(ph, [(-30, 100, 92), (-36, 112, 86), (-34, 124, 80)], 3, lambda p: (-1, 0, 0.6), lift=0.7), lambda m, n: GLOW(1))
for o in HEAD.pieces: deform(o[0], lambda v: Vector((0, 116, 60)) + (v - Vector((0, 116, 60))) * 1.25)
for e in EYES: e['at'] = list(Vector((0, 116, 60)) + (Vector(e['at']) - Vector((0, 116, 60))) * 1.25); e['r'] *= 1.2
parts.append(HEAD)

export('B_Thunderhead', parts, out_path('B_Thunderhead'), height=190)
