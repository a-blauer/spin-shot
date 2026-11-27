# The Brood Mother (boss, eggs): an upright queen. A heavy pale torso plated with root, two pairs of long root arms with
# sharp fingers, a crowned cap (a ring of tall spikes round a spotted dome) over a face of four lit eyes and a fanged
# mouth; behind her a huge segmented egg sac dragging on the floor, studded with faceted pods split by glowing seams.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

reset(); parts = []
SAC, SAC_D = mix(FLESH(0.85), C(0xcfc4a8), 0.5), mix(FLESH(0.6), ROOT_D, 0.4)
for s in (-1, 1):
    P, _ = root_leg(s, [s * 22, 60, 26], (s * 22, 66, 26), (s * 27, 38, 32), (s * 26, 13, 30), [15, 13, 11], toes=4, toe_len=22)
    parts.append(P)

BODY = Part('Body', [0, 60, 20])
pieces = [(skin([(0, 66, 24), (0, 92, 28), (0, 120, 32), (0, 146, 36), (0, 158, 38)], [(32, 26), (34, 28), (31, 25), (34, 26), (24, 20)], sub=2, name='torso'), lambda m, n: FLESH(1))]
for s in (-1, 1):
    pieces += [(blob((s * 32, 146, 36), (15, 14, 14), name='sho'), lambda m, n: ROOT), (blob((s * 26, 116, 42), (11, 11, 11), name='sho2'), lambda m, n: ROOT),
               (blob((s * 22, 64, 26), (14, 13, 14), name='hip'), lambda m, n: ROOT)]
# the sac: a long chain of swelling segments dragging behind
SP = [Vector((0, 92, 8)), Vector((0, 72, -40)), Vector((0, 60, -90)), Vector((0, 52, -136)), Vector((0, 44, -168))]
SR = [(30, 28), (52, 46), (58, 52), (50, 44), (28, 24)]
sp_pts, sp_rad = [], []
for i in range(21):                                                  # swelling segments
    t = i / 20; f = t * (len(SP) - 1); k = min(int(f), len(SP) - 2); u = f - k
    sp_pts.append(tuple(SP[k].lerp(SP[k + 1], u))); w = 1.0 if i % 4 in (1, 2) else 0.84
    sp_rad.append(((SR[k][0] * (1 - u) + SR[k + 1][0] * u) * w, (SR[k][1] * (1 - u) + SR[k + 1][1] * u) * w))
pieces.append((skin(sp_pts, sp_rad, sub=2, name='sac'), lambda m, n: SAC if n.y > -0.3 else SAC_D))
body, bp = fuse(pieces, voxel=1.4, smooth=3, tris=0, name='body')
deform(body, lambda v: Vector((v.x, max(v.y, 0.5), v.z)))
decimate(body, 4200)
def body_paint(m, n):
    return bp(m, n)
BODY.add(body, body_paint); pj = projector(body)
BODY.add(blob((0, 160, 40), (19, 16, 18), name='necksock'), lambda m, n: FLESH(1), 300)
# root plating down the torso's front and sides
for x in (-20, -8, 8, 20):
    BODY.add(ribbon(pj, [(x, 152, 50), (x * 1.1, 130, 54), (x * 1.15, 108, 56), (x * 1.05, 86, 52), (x, 70, 48)], 4.2, lambda p: (p.x * 0.02, 0, 1), lift=0.9, taper=False), lambda m, n: ROOT)
# the eggs: faceted pods sunk in the sac, each split by a glowing seam
for i in range(11):
    t = (i + 0.5) / 11; f = t * (len(SP) - 1); k = min(int(f), len(SP) - 2); c = SP[k].lerp(SP[k + 1], f - k)
    a = i * 2.4 + 0.5; o = Vector((math.cos(a) * 0.9, abs(math.sin(a)) * 0.9 + 0.3, 0)).normalized()
    hit = pj.ray_cast(c + o * 90, -o, 140)
    if hit[0] is None: continue
    b = hit[0] - o * 4; r = 11 + (i % 3) * 2
    pod = lathe([(0, r * 1.6), (r * 0.6, r * 1.3), (r, r * 0.6), (r * 0.8, 0), (0, -r * 0.2)], seg=7, name='egg')
    pod.matrix_world = Matrix.Translation(b) @ Vector((0, 1, 0)).rotation_difference(o).to_matrix().to_4x4(); bake_world(pod)
    BODY.add(pod, lambda m, n: CAP(1) if n.y > -0.5 else mix(CAP(1), ROOT_D, 0.5), 80)
    pe = projector(pod); side = o.cross(Vector((0, 0, 1))).normalized()
    BODY.add(ribbon(pe, [tuple(b + o * r * 1.4), tuple(b + o * r * 0.9 + side * r * 0.75), tuple(b + o * r * 0.2 + side * r * 0.85)], 2.0, lambda p, o=o, side=side: side + o * 0.3, lift=0.4), lambda m, n: GLOW(1))
sore(BODY.add, pj, (-30, 100, 48), (-0.6, 0, 1), 6, 3)
rot_patch(BODY.add, pj, (40, 70, -100), (1, 0.2, 0), 14, 5)
rot_patch(BODY.add, pj, (-36, 90, -60), (-1, 0.5, 0), 12, 8)
parts.append(BODY)

for s in (-1, 1):
    P, _ = root_arm(s, [s * 34, 150, 34], (s * 34, 148, 36), (s * 60, 124, 52), (s * 70, 96, 72), [11, 9, 7.5], fingers=3, f_len=22)
    parts.append(P)
for s in (-1, 1):
    P, _ = root_arm(s, [s * 28, 118, 40], (s * 28, 116, 42), (s * 46, 96, 58), (s * 50, 72, 74), [8.5, 7, 6], fingers=3, f_len=16)
    parts.append(P)

# head: four eyes and a fanged mouth under a crowned cap
EYES = [{'at': [x, y, z], 'r': r, 's': s, 'out': [s * 0.3, 0, 1]} for x, y, z, r, s in ((-9, 182, 70, 5, -1), (9, 182, 70, 5, 1), (-19, 190, 62, 3.6, -1), (19, 190, 62, 3.6, 1))]
HEAD = Part('Head', [0, 160, 38], eyes=EYES)
face = [(skin([(0, 150, 40), (0, 170, 46), (0, 190, 48), (0, 206, 44)], [(24, 22), (27, 24), (27, 23), (22, 20)], sub=2, name='face'), lambda m, n: FLESH(1))]
for s in (-1, 1): face.append((blob((s * 13, 194, 66), (12, 3.4, 6), rot=(0, 0, s * 0.42), name='brow'), lambda m, n: ROOT_D))
fo, fp = fuse(face, voxel=0.7, smooth=2, tris=1800, name='face')
HEAD.add(fo, fp); pf = projector(fo); seat_eyes(EYES, pf)
HEAD.add(decal(pf, (0, 164, 70), (0, -0.1, 1), 15, seg=30, rings=3, lift=0.5, squash=(1, 0.38), wobble=0.08, seed=5), lambda m, n: MOUTH)
for i in range(7):
    x = -12 + i * 4; top = i % 2 == 0; L = 8 if i in (1, 5) else 4
    h = pf.ray_cast(Vector((x, 168 if top else 160, 110)), Vector((0, 0, -1)), 80)
    if h[0] is not None: HEAD.add(skin([tuple(h[0] - h[1] * 0.4), tuple(h[0] + h[1] * 1.4 + Vector((0, -L if top else L, 0)))], [2.2 if L > 5 else 1.6, 0.12], sub=1, name='t'), lambda m, n: TOOTH, 16)
CAPM = Matrix.Translation((0, 210, 40)) @ Matrix.Rotation(-0.1, 4, 'X')
cap, cpaint, brim = rotten_cap([(0, 26), (20, 25), (42, 18), (56, 8), (62, 0), (56, -3), (28, 2), (0, 4)], CAPM, [(0.9, 0.3, 8), (2.7, 0.25, 7), (4.6, 0.35, 9)], seg=48, rim_from=42, rim_to=62)
HEAD.add(cap, cpaint, 1800)
pc = cap_spots(HEAD, cap, CAPM, [(0.4, 0.5, 6), (1.6, 0.7, 5), (2.6, 0.4, 6), (3.6, 0.75, 5), (4.8, 0.55, 6), (5.7, 0.8, 4.4)], rim=66)
for i in range(8):                                                  # the crown: a ring of tall spikes
    a = i * math.pi / 4 + 0.2; b = CAPM @ Vector((math.cos(a) * 24, 20, math.sin(a) * 24)); o = (CAPM.to_3x3() @ Vector((math.cos(a) * 0.25, 1, math.sin(a) * 0.25))).normalized()
    L = 26 if i % 2 == 0 else 18
    HEAD.add(skin([tuple(b - o * 3), tuple(b + o * L * 0.5), tuple(b + o * L)], [5, 3, 0.15], sub=1, name='spike'), lambda m, n: mix(CAP(1), ROOT_D, 0.5), 60)
drips(HEAD, brim, [0.5, 1.9, 3.1, 4.2, 5.4], 62, CAPM)
cap_rot(HEAD, pc, CAPM, [(2.0, 0.85, 8), (5.0, 0.7, 7)], rim=66)
parts.append(HEAD)

export('B_BroodMother', parts, out_path('B_BroodMother'), height=205, lean=0.0)
