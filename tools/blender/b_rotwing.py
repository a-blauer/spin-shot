# The Rotwing (boss, strafe): a dragon in flight, Blight-grown, anatomy kept. A deep chest and ribcage tapering to the
# hips, forelegs and hind legs tucked up under the body as a flying animal carries them, claws sharp; a long S-curved neck;
# a long tail ending in a spade of bracket; the head a long skull and snout, heavy brow ridges low over scowling eyes, horns
# sweeping back, nostrils, the jaw hanging open on rows of teeth; a crest of caps from the head down the neck and spine. The
# wings: a bat's arm - upper arm to the elbow, forearm to the wrist, a thumb claw at the wrist, four long finger bones
# spreading from it - with membrane stretched between the fingers (its trailing edge scalloped between the tips), and from
# the last finger back to the body. Rot: torn holes and olive patches on the membrane, sores on the hide.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

DRG, DRG2, DRGB = C(0xd8ccb0), C(0xb0a284), C(0x8a7a5e)
hide = lambda m, n: mix(DRG, FLESH(0.8), 0.5) if n.y < -0.4 else DRG
reset(); parts = []

def crest(P, pts, h0, h1):
    for i, p in enumerate(pts):
        t = i / max(1, len(pts) - 1); h = h0 + (h1 - h0) * t; b = Vector(p)
        P.add(skin([tuple(b - Vector((0, 2, 0))), tuple(b + Vector((0, h * 0.6, -2))), tuple(b + Vector((0, h, -4)))], [h * 0.42, h * 0.25, 0.15], sub=1, name='crest'), lambda m, n: CAP(0.85), 24)

TAIL = Part('Tail', [0, 90, -50])
tp = [(0, 94, -46), (0, 88, -100), (4, 76, -150), (-2, 68, -186)]
tl, _ = fuse([(skin(tp, [15, 11, 7, 4], sub=2, name='tail'), None)], voxel=0.8, smooth=2, tris=1100, name='tail')
TAIL.add(tl, hide)
TAIL.add(fan((-2, 68, -184), [(0, 78, -188), (16, 68, -204), (0, 60, -218), (-16, 68, -204), (0, 78, -188)], t=2.4, scallop=0.0), lambda m, n: CAP(1), 120)
crest(TAIL, [Vector(tp[0]).lerp(Vector(tp[1]), u) + Vector((0, 12, 0)) for u in (0.2, 0.6)] + [Vector(tp[1]).lerp(Vector(tp[2]), u) + Vector((0, 8, 0)) for u in (0.2, 0.6)] + [Vector(tp[2]).lerp(Vector(tp[3]), 0.4) + Vector((0, 5, 0))], 10, 5)
parts.append(TAIL)

BODY = Part('Body', [0, 92, 0])
pieces = [(blob((0, 102, 22), (30, 30, 40), seg=16, name='chest'), hide),
          (skin([(0, 102, 4), (0, 98, -30), (0, 94, -60)], [27, 23, 18], sub=2, name='belly'), hide),
          (skin([(0, 110, 50), (0, 120, 74), (0, 124, 96)], [16, 14.5, 13], sub=2, name='neck'), hide)]
for s in (-1, 1):
    pieces.append((blob((s * 24, 118, 12), (11, 11, 11), name='wingsock'), hide))
    pieces.append((skin([(s * 18, 88, 34), (s * 20, 70, 44), (s * 16, 66, 62)], [8, 6, 4.5], sub=1, name='foreleg'), lambda m, n: DRG2))
    pieces.append((skin([(s * 20, 90, -52), (s * 26, 70, -40), (s * 20, 62, -66)], [11, 7.5, 5], sub=1, name='hindleg'), lambda m, n: DRG2))
bo, bp = fuse(pieces, voxel=0.8, smooth=2, tris=3800, name='body')
BODY.add(bo, bp); pj = projector(bo)
for z in range(40, -64, -10):                                         # belly scales: plates across the underside
    h = pj.ray_cast(Vector((0, 40, z)), Vector((0, 1, 0)), 120)
    if h[0] is not None: BODY.add(decal(pj, h[0], h[1], 9, seg=6, rings=1, lift=0.5, squash=(1.6, 0.5)), lambda m, n: mix(DRG, FLESH(0.8), 0.6))
for x0 in (-1, 1):                                                    # ribs showing down the flanks
    for z in (36, 24, 12, 0):
        BODY.add(ribbon(pj, [(x0 * 22, 120, z), (x0 * 30, 104, z - 2), (x0 * 26, 88, z - 4)], 2.4, lambda p, x0=x0: (x0, 0, 0), lift=0.6), lambda m, n: DRG2)
for s in (-1, 1):                                                     # claws on the tucked feet
    for k in (-1, 0, 1):
        for base, d in (((s * 16 + k * 3, 66, 64), (0, -0.4, 1)), ((s * 20 + k * 3.5, 62, -70), (0, -0.4, -1))):
            b = Vector(base); dd = Vector(d).normalized()
            BODY.add(skin([tuple(b), tuple(b + dd * 5 + Vector((0, -2, 0))), tuple(b + dd * 8 + Vector((0, -5, 0)))], [2, 1.2, 0.1], sub=1, name='claw'), lambda m, n: DRGB, 12)
crest(BODY, [(0, 128 - abs(z - 20) * 0.18 + (8 if z > 60 else 0), z) for z in (92, 72, 52, 32, 12, -8, -28, -48)], 12, 7)
sore(BODY.add, pj, (28, 100, 0), (1, 0, 0), 4, 3)
rot_patch(BODY.add, pj, (-26, 96, -30), (-1, -0.2, 0), 7, 6, mold=False)
parts.append(BODY)

def wing(s):
    P = Part('WingFront' if s > 0 else 'WingBack', [s * 24, 116, 10])
    sh, el, wr = Vector((s * 26, 118, 12)), Vector((s * 74, 146, -14)), Vector((s * 116, 150, 14))
    tips = [Vector((s * 206, 140, -10)), Vector((s * 194, 112, -48)), Vector((s * 160, 84, -74)), Vector((s * 112, 80, -84))]
    bones = [(skin([tuple(sh), tuple(el)], [8, 6], sub=1, name='humerus'), lambda m, n: DRG2), (skin([tuple(el), tuple(wr)], [6, 4.6], sub=1, name='radius'), lambda m, n: DRG2),
             (blob(tuple(el), (6.5, 6.5, 6.5), name='elbow'), lambda m, n: DRGB), (blob(tuple(wr), (5.4, 5.4, 5.4), name='wrist'), lambda m, n: DRGB)]
    for t in tips: bones.append((skin([tuple(wr), tuple(wr.lerp(t, 0.5)), tuple(t)], [3.6, 2.6, 1.0], sub=1, name='finger'), lambda m, n: DRG2))
    wo, wp = fuse(bones, voxel=0.6, smooth=1, tris=1600, name='armbones')
    P.add(wo, wp)
    P.add(skin([tuple(wr), tuple(wr + Vector((s * 4, 6, 8))), tuple(wr + Vector((s * 3, 4, 16)))], [3, 1.8, 0.12], sub=1, name='thumb'), lambda m, n: DRGB, 20)
    mem = lambda m, n: mix(CAP(0.8), C(0x241a14), 0.15) if (m - wr).length < 40 else CAP(1)
    P.add(fan(tuple(wr), [tuple(t) for t in tips], t=1.6, scallop=0.16), mem, 400)
    P.add(fan(tuple(el), [tuple(wr), tuple(tips[3]), (s * 70, 88, -60), (s * 30, 96, -40)], t=1.6), mem, 200)
    P.add(fan(tuple(sh), [tuple(el), (s * 30, 96, -40)], t=1.6), mem, 80)
    pm = projector(*[o for o, _ in P.pieces[-3:]])
    for i, (u, v) in enumerate(((0.55, 0.3), (0.7, 0.65), (0.4, 0.8))):          # rot on the membrane: olive patches with a lit sore
        c = wr.lerp(tips[1 + i % 3], u).lerp(wr.lerp(tips[i % 3], u), v)
        P.add(decal(pm, tuple(c), (0, 1, 0.1), 7 + i * 2, seg=16, rings=2, lift=1.2, wobble=0.4, seed=i), lambda m, n: ROT)
        P.add(decal(pm, tuple(c), (0, 1, 0.1), 3, seg=10, rings=1, lift=1.6), lambda m, n: OOZE)
    return P
parts += [wing(-1), wing(1)]

EYES = [{'at': [s * 11, 132, 120], 'r': 4.6, 's': s, 'out': [s * 0.7, 0.15, 0.7]} for s in (-1, 1)]
HEAD = Part('Head', [0, 110, 74], eyes=EYES)
pieces = [(skin([(0, 116, 78), (0, 126, 94), (0, 130, 110)], [12, 11.5, 11], sub=2, name='neck'), hide),
          (blob((0, 128, 116), (15, 13, 16), seg=16, name='skull'), hide),
          (skin([(0, 125, 122), (0, 122, 146), (0, 118, 168)], [(12, 10), (10, 8), (7, 6)], sub=1, name='snout'), hide),
          (skin([(0, 108, 114), (0, 103, 140), (0, 100, 160)], [(9.5, 5.5), (8, 4), (5, 3)], sub=1, name='jaw'), lambda m, n: DRG2),
          (skin([(0, 114, 82), (0, 110, 100), (0, 109, 114)], [(11, 9), (10, 8), (9.5, 6)], sub=2, name='throat'), hide)]
for s in (-1, 1):                                                     # the hinge: cheek muscle from the skull down to the jaw
    pieces.append((skin([(s * 9, 126, 112), (s * 9, 116, 116), (s * 8.5, 108, 120)], [(4, 5), (4.5, 5), (4, 4)], sub=1, name='cheek'), hide))
for s in (-1, 1):
    pieces.append((skin([(s * 14, 138, 112), (s * 10, 136, 128)], [4.4, 3], sub=1, name='brow'), lambda m, n: DRG2))
ho, hp = fuse(pieces, voxel=0.5, smooth=2, tris=2600, name='head')
HEAD.add(ho, hp); ph = projector(ho); seat_eyes(EYES, ph, 0.3)
HEAD.add(blob((0, 111, 140), (8, 4, 24), name='gape'), lambda m, n: MOUTH, 120)
for i in range(6):                                                    # rows of teeth, top and bottom
    z = 124 + i * 7.5; w = 8.6 - i * 0.9
    for s in (-1, 1):
        HEAD.add(skin([(s * w, 117, z), (s * w * 0.95, 109.5, z + 0.6)], [1.8, 0.1], sub=1, name='t'), lambda m, n: TOOTH, 10)
        HEAD.add(skin([(s * (w - 1), 101 - i * 0.5, z - 2), (s * (w - 1), 107 - i * 0.5, z - 1.5)], [1.5, 0.1], sub=1, name='t'), lambda m, n: TOOTH, 10)
for s in (-1, 1):                                                     # horns sweeping back, nostrils
    HEAD.add(skin([(s * 11, 140, 108), (s * 17, 148, 94), (s * 22, 154, 82)], [4.4, 2.8, 0.15], sub=1, name='horn'), lambda m, n: DRGB, 40)
    HEAD.add(skin([(s * 13, 128, 104), (s * 17, 130, 96), (s * 20, 132, 88)], [3, 1.8, 0.12], sub=1, name='horn2'), lambda m, n: DRGB, 30)
    HEAD.add(blob((s * 4, 126, 167), (1.8, 1.4, 1.6), name='nostril'), lambda m, n: MOUTH, 12)
crest(HEAD, [(0, 138 - i * 4, 104 - i * 10) for i in range(3)], 10, 7)
parts.append(HEAD)

export('B_Rotwing', parts, out_path('B_Rotwing'), height=170)
