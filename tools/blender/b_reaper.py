# The Reaper (boss, stealth): a praying mantis, Blight-grown, with the anatomy kept: a thorax carrying the middle and hind
# legs; a long raised prothorax carrying the head and the raptorial forelegs; a long segmented abdomen sloping back with the
# wings folded flat along it. The forelegs: a thick femur running forward and down from the shoulder, spined along its inner
# edge, and the tibia folded back up against it as a flat hooked scythe blade. The head: a wide triangle, two great eyes at
# its upper corners, mandibles at the point, two long antennae. Middle and hind legs: thin, jointed high, feet splayed on
# sharp tarsal points. Faceted plates; rot in places.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

BLADE, BLADE_D = C(0xd8ceb4), C(0xa89e86)
plate = lambda m, n: FLESH(1) if n.y > -0.3 else mix(FLESH(1), ROOT_D, 0.35)
reset(); parts = []

def legs(s):
    P = Part('LegFront' if s > 0 else 'LegBack', [s * 14, 80, -20])
    for root, knee, foot in (((s * 12, 96, -6), (s * 52, 122, 6), (s * 66, 4, 34)), ((s * 12, 92, -26), (s * 58, 118, -48), (s * 72, 4, -92))):
        R, K, F = Vector(root), Vector(knee), Vector(foot)
        pts = [R, R.lerp(K, 0.5) + Vector((0, 3, 0)), K, K.lerp(F, 0.5), F + Vector((0, 4, 0))]
        lg, _ = fuse([(skin([tuple(p) for p in pts], [5.5, 5, 4.6, 3.6, 2.6], sub=1, name='leg'), None), (blob(tuple(K), (5.6, 5.6, 5.6), seg=12, name='knee'), None)], voxel=0.6, smooth=1, tris=0, name='leg')
        d = (F - K).normalized(); side = Vector((0, 1, 0)).cross(Vector((d.x, 0, d.z)).normalized()).normalized()
        for k in (-1, 1):                                                 # the tarsus: splayed sharp points on the floor
            t = skin([tuple(F + Vector((0, 4, 0))), tuple(F + Vector((d.x, 0, d.z)).normalized() * 9 + side * k * 6 + Vector((0, 1, 0))), tuple(F + Vector((d.x, 0, d.z)).normalized() * 16 + side * k * 10 + Vector((0, 0.5, 0)))], [2.4, 1.6, 0.15], sub=1, name='tarsus')
            P.add(t, lambda m, n: ROOT_D, 40)
        deform(lg, lambda v: Vector((v.x, max(v.y, 0.5), v.z)))
        decimate(lg, 700)
        P.add(lg, lambda m, n: ROOT if n.y > -0.3 else ROOT_D)
        for u in (0.3, 0.6):                                              # little spines on the shins
            c = K.lerp(F, u); P.add(skin([tuple(c), tuple(c + side * s * 0 + Vector((0, 2, 0)) + (Vector((c.x, 0, c.z)).normalized()) * 5)], [1.2, 0.1], sub=1, name='spine'), lambda m, n: ROOT_D, 10)
    return P
parts += [legs(-1), legs(1)]

BODY = Part('Body', [0, 80, -20])
ab = []
for i in range(13):                                                       # the abdomen: segmented, sloping back and down
    t = i / 12; z = -30 - t * 96; y = 98 - 26 * t * t; r = (19 - 13 * t ** 1.5) * (1.0 if i % 2 else 0.88)
    ab.append(((0, y, z), (r * 1.05, r * 0.85)))
pieces = [(blob((0, 96, -14), (15, 13, 22), seg=14, name='thorax'), plate),
          (skin([(0, 100, -2), (0, 122, 4), (0, 146, 12), (0, 166, 20), (0, 174, 24)], [9.5, 8.5, 8, 8.5, 9], sub=1, name='prothorax'), plate),
          (skin([p for p, r in ab], [r for p, r in ab], sub=1, name='abdomen'), lambda m, n: FLESH(0.9) if n.y > -0.3 else mix(FLESH(0.7), ROOT, 0.4)),
          (blob((0, 168, 24), (11, 10, 11), name='shoulders'), plate)]
bo, bp = fuse(pieces, voxel=0.9, smooth=1, tris=2800, name='body')
BODY.add(bo, bp); pj = projector(bo)
for s in (-1, 1):                                                         # the wings, folded flat along the back: long leaf plates
    w = lathe([(0, 62), (7, 54), (13, 28), (15, 0), (13, -28), (7, -52), (0, -62)], seg=10, name='wing')
    w.matrix_world = Matrix.Translation((s * 7, 108, -66)) @ Matrix.Rotation(-0.27, 4, 'X') @ Matrix.Rotation(math.pi / 2, 4, 'X') @ Matrix.Diagonal((1, 1, 0.18, 1)); bake_world(w)
    BODY.add(w, lambda m, n: CAP(1) if n.y > 0 else mix(CAP(1), ROOT_D, 0.5), 220)
    pw = projector(w)
    BODY.add(ribbon(pw, [(s * 7, 126, -16), (s * 8, 112, -64), (s * 7, 96, -112)], 1.6, lambda p: (0, 1, 0), lift=0.4, taper=False), lambda m, n: mix(CAP(1), ROOT_D, 0.6))
    BODY.add(decal(pw, (s * 8, 118, -40), (0, 1, 0), 4.5, seg=12, rings=1, lift=0.5), lambda m, n: GLOW(1))
sore(BODY.add, pj, (14, 92, -70), (1, 0, 0), 4, 3)
rot_patch(BODY.add, pj, (-14, 90, -96), (-1, 0.2, 0), 7, 6)
parts.append(BODY)

def scythe(s):
    P = Part('ArmFront' if s > 0 else 'ArmBack', [s * 12, 168, 26])
    sh, knee, tip = Vector((s * 13, 166, 28)), Vector((s * 20, 126, 62)), Vector((s * 17, 170, 48))
    fem, _ = fuse([(skin([tuple(sh), tuple(sh.lerp(knee, 0.5)), tuple(knee)], [8.5, 8, 6.8], sub=1, name='femur'), None), (blob(tuple(sh), (8.5, 8.5, 8.5), name='sho'), None),
                   (blob(tuple(knee), (7, 7, 7), name='knee'), None)], voxel=0.6, smooth=1, tris=900, name='femur')
    P.add(fem, lambda m, n: FLESH(0.9) if (m - knee).length > 8 else ROOT_D)
    inner = Vector((-s, 0, 0.6)).normalized()
    for i in range(6):                                                    # the spines along the femur's inner edge
        c = sh.lerp(knee, 0.15 + i * 0.14) + inner * 6
        P.add(skin([tuple(c), tuple(c + inner * (5 + (i % 2) * 3) + Vector((0, -3, 2)))], [1.8, 0.12], sub=1, name='spine'), lambda m, n: BLADE_D, 12)
    bl = [knee, knee.lerp(tip, 0.4) + inner * 2, knee.lerp(tip, 0.8) + inner * 1, tip]
    blade = skin([tuple(p) for p in bl], [(1.6, 6), (1.6, 6), (1.3, 4.5), (0.6, 2)], sub=1, name='blade')   # flat: thin side to side
    P.add(blade, lambda m, n: BLADE if abs(n.x) > 0.5 else BLADE_D, 300)
    hook = skin([tuple(tip), tuple(tip + Vector((-s * 1, -4, 8))), tuple(tip + Vector((-s * 2, -10, 12)))], [2.4, 1.4, 0.12], sub=1, name='hook')
    P.add(hook, lambda m, n: BLADE_D, 40)
    for i in range(5):                                                    # teeth along the blade's edge
        c = knee.lerp(tip, 0.18 + i * 0.16) - inner * 0.5
        P.add(skin([tuple(c), tuple(c - (tip - knee).normalized() * 3 + Vector((0, 0, 3)))], [1.2, 0.1], sub=1, name='bt'), lambda m, n: BLADE_D, 10)
    return P
parts += [scythe(-1), scythe(1)]

EYES = [{'at': [s * 14, 212, 48], 'r': 8.5, 's': s, 'out': [s * 0.75, 0.1, 0.65]} for s in (-1, 1)]
HEAD = Part('Head', [0, 184, 30], eyes=EYES)
hp_ = [(skin([(0, 174, 26), (0, 182, 32), (0, 188, 38)], [7, 6.5, 6.5], sub=1, name='neck'), plate),
       (skin([(-15, 212, 44), (0, 206, 48), (15, 212, 44)], [9, 8, 9], sub=1, name='brow'), plate),
       (skin([(0, 208, 44), (0, 198, 50), (0, 188, 54)], [(13, 6), (8, 5), (4, 4)], sub=1, name='face'), plate)]
hp_ += [(blob((s * 14, 212, 46), (8, 8, 8), name='eyebulge'), plate) for s in (-1, 1)]
ho, hpp = fuse(hp_, voxel=0.5, smooth=1, tris=1400, name='head')
HEAD.add(ho, hpp); ph = projector(ho); seat_eyes(EYES, ph, 0.45)
for s in (-1, 1):
    HEAD.add(skin([(s * 4.5, 190, 54), (s * 3.5, 184, 57), (s * 1.2, 180, 57)], [2.4, 1.4, 0.12], sub=1, name='mandible'), lambda m, n: BLADE_D, 30)
    HEAD.add(skin([(s * 4, 214, 50), (s * 12, 236, 48), (s * 22, 256, 40), (s * 30, 262, 30)], [1.6, 1.2, 0.8, 0.2], sub=1, name='antenna'), lambda m, n: ROOT_D, 40)
parts.append(HEAD)

export('B_Reaper', parts, out_path('B_Reaper'), height=230)
