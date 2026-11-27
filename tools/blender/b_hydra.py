# The Hydra (boss, heads): a squat faceted mound of root, roots spreading out over the floor, and out of it four thick
# segmented necks, each ending in a tall ridged inkcap head - shaggy above, ink-black and dripping below - with a scowl
# and a fanged mouth under the bell. Rotting: sores and olive rot on the mound.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

INK, INK2 = C(0x16121a), C(0x2a2230)
SCALE = mix(CAP(0.7), C(0xf0e6d0), 0.45)
reset(); parts = []

BODY = Part('Body', [0, 50, 0])
mound = blob((0, 40, 0), (86, 48, 82), e=0.8, seg=14, name='mound')
pieces = [(mound, lambda m, n: ROOT_L if n.y > 0.6 else (ROOT if m.y > 14 else ROOT_D))]
pieces += [(blob(c, (26, 22, 26), name='sock'), lambda m, n: ROOT) for c in ((0, 100, 10), (38, 96, 4), (-38, 96, 4), (0, 96, -32))]
mo, mp = fuse(pieces, voxel=1.6, smooth=1, tris=0, name='mound')
deform(mo, lambda v: Vector((v.x, max(v.y, 0), v.z)))
decimate(mo, 2600)
BODY.add(mo, mp); pj = projector(mo)
for i in range(9):                                                  # roots spreading over the floor, sharp at the ends
    a = i * 2 * math.pi / 9 + 0.2; d = Vector((math.cos(a), 0, math.sin(a)))
    pts = [d * 58 + Vector((0, 22, 0)), d * 86 + Vector((0, 9, 0)), d * 108 + Vector((0, 2.5, 0)), d * 124 + Vector((0, 0.8, 0))]
    r, _ = fuse([(skin([tuple(p) for p in pts], [13, 8, 4.5, 1.6], sub=2, name='root'), None)], voxel=0.9, smooth=2, tris=0, name='root')
    sharpen(r, pts[2], pts[3] + d * 6, 5)
    BODY.add(r, lambda m, n: ROOT if n.y > -0.3 else ROOT_D, 260)
for k in range(8):
    a = k * 0.8 + 0.3; BODY.add(ribbon(pj, [(math.cos(a) * 80, 40, math.sin(a) * 78), (math.cos(a + 0.08) * 70, 66, math.sin(a + 0.08) * 70), (math.cos(a) * 52, 88, math.sin(a) * 52)], 4, lambda p: (p.x, 0.4, p.z), lift=0.7), lambda m, n: ROOT)
sore(BODY.add, pj, (60, 50, 50), (0.7, 0, 0.7), 8, 3)
sore(BODY.add, pj, (-66, 46, 40), (-0.8, 0, 0.5), 6, 6)
rot_patch(BODY.add, pj, (-40, 70, -56), (-0.6, 0.4, -0.7), 14, 9)
rot_patch(BODY.add, pj, (50, 76, -40), (0.6, 0.5, -0.6), 12, 12)
parts.append(BODY)

def neck_head(base, mid, head, seed):
    base, mid, head = Vector(base), Vector(mid), Vector(head)
    EYES = [{'at': [head.x + s * 5.6, head.y - 9, head.z + 14], 'r': 3.8, 's': s, 'out': [s * 0.2, 0, 1]} for s in (-1, 1)]
    P = Part('Head', list(base), eyes=EYES)
    ctrl = [base, base.lerp(mid, 0.5) + Vector((0, 0, 4)), mid, mid.lerp(head, 0.6), head + Vector((0, -20, -2))]
    pts, rad = [], []
    for i in range(17):                                             # a segmented neck: swelling and pinching
        t = i / 16; f = t * (len(ctrl) - 1); k = min(int(f), len(ctrl) - 2); pts.append(tuple(ctrl[k].lerp(ctrl[k + 1], f - k)))
        rad.append((20 - 6 * t) * (1.0 if i % 3 != 0 else 0.86))
    nk = [(skin(pts, rad, sub=1, name='neck'), lambda m, n: FLESH(1) if n.y > -0.3 else mix(FLESH(1), ROOT_D, 0.3)),
          (blob(tuple(head + Vector((0, -13, 2))), (15, 17, 15), name='face'), lambda m, n: FLESH(1))]
    for s in (-1, 1): nk.append((blob(tuple(head + Vector((s * 6, -4.5, 14))), (6.5, 2.2, 3.4), rot=(0, 0, s * 0.45), name='brow'), lambda m, n: mix(FLESH(1), ROOT_D, 0.6)))
    no, npnt = fuse(nk, voxel=0.8, smooth=2, tris=1800, name='neck')
    P.add(no, npnt); pf = projector(no); seat_eyes(EYES, pf)
    mc = head + Vector((0, -20, 15))
    P.add(decal(pf, tuple(mc), (0, -0.1, 1), 7.5, seg=24, rings=2, lift=0.5, squash=(1, 0.5), wobble=0.1, seed=seed), lambda m, n: MOUTH)
    for i, x in enumerate((-4.5, -1.5, 1.5, 4.5)):
        for top in (True, False):
            h = pf.ray_cast(Vector((mc.x + x, mc.y + (2.8 if top else -2.8), mc.z + 40)), Vector((0, 0, -1)), 80)
            if h[0] is None: continue
            L = 6 if (i in (0, 3) and top) else 3.4
            P.add(skin([tuple(h[0] - h[1] * 0.4), tuple(h[0] + h[1] * 1.0 + Vector((0, -L if top else L, 0)))], [1.5 if L > 5 else 1.1, 0.1], sub=1, name='t'), lambda m, n: TOOTH, 12)
    bell = lathe([(0, 50), (5, 49), (11, 44), (16, 34), (19, 22), (21, 10), (22, 0), (19, -3), (12, 0), (0, 6)], seg=16, name='bell')
    def _rid(v):
        a = math.atan2(v.z, v.x); k = 1 + 0.08 * (abs(math.cos(a * 4)) * 2 - 1)
        y = v.y - (6 * max(0, math.sin(a * 7 + seed)) ** 2 if v.y < 4 else 0); return Vector((v.x * k, y, v.z * k))
    deform(bell, _rid)
    bake_world(transform(bell, Matrix.Translation(head + Vector((0, 0, -2)))))
    def bpaint(m, n, hy=head.y):
        if n.y < -0.4: return GILL_A
        a = math.atan2(m.z - head.z + 2, m.x - head.x); e = hy + 14 + 4 * math.sin(a * 7 + seed)
        return INK if m.y < e else CAP(1)
    P.add(bell, bpaint, 700); pb = projector(bell)
    for k in range(16):                                              # shaggy scales
        a = k * 2.4; y = head.y + 18 + (k % 4) * 7; r = 19 - (k % 4) * 2.4
        o = Vector((math.cos(a), 0.25, math.sin(a))); c = head + Vector((math.cos(a) * r, y - head.y, math.sin(a) * r - 2))
        h = pb.ray_cast(c + o * 20, -o, 50)
        if h[0] is None: continue
        b = h[0] - o * 0.8
        P.add(skin([tuple(b), tuple(b + o * 3 + Vector((0, -5, 0))), tuple(b + o * 4.5 + Vector((0, -10, 0)))], [3.2, 2, 0.12], sub=1, name='scale'), lambda m, n: SCALE, 24)
    for i in range(4):                                               # ink drops off the rim
        a = i * 1.57 + seed; x, z = head.x + math.cos(a) * 20, head.z - 2 + math.sin(a) * 20; L = 8 + (i % 2) * 6
        P.add(skin([(x, head.y + 2, z), (x, head.y - L * 0.6, z), (x, head.y - L, z)], [3, 2.2, 0.5], sub=1, name='drop'), lambda m, n: INK2, 40)
    def grow(v, head=head):                                        # the head a third bigger, easing into the neck
        d = (v - head).length; k = 1.35 if d < 34 else (1.35 - 0.35 * min(1, (d - 34) / 30))
        return head + (v - head) * k
    for o in P.pieces: deform(o[0], grow)
    for e in EYES: e['at'] = list(grow(Vector(e['at']))); e['r'] *= 1.3
    return P
parts += [neck_head((0, 104, 10), (0, 170, 22), (0, 236, 30), 1), neck_head((38, 100, 4), (80, 160, 10), (104, 206, 20), 2),
          neck_head((-38, 100, 4), (-80, 160, 10), (-104, 206, 20), 3), neck_head((0, 100, -32), (0, 170, -74), (0, 222, -96), 4)]
for P, pv in zip(parts[1:], ([0, 110, 10], [40, 100, 4], [-40, 100, 4], [0, 100, -36])): P.pivot = pv

export('B_Hydra', parts, out_path('B_Hydra'), height=230, lean=0.0)
