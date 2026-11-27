# King Puffcap (boss, split): a bloated tyrant king of the puffballs. A ridged puffball for a head-and-shoulders, heavy-lidded
# glaring eyes, a sneering underbite with two tusks, jowls, a beard of hanging spore-tendrils lit at the tips; a pleated ruff
# of pale gill round his neck; a deep robe falling in broad faceted folds to an ermine hem (pale, black-spotted); stubby
# root hands, one gripping a scepter of root topped with a caged glowing spore-pod; on his crown a band of gold set with
# tall points and little lit pods, the puffball's top bulging through it, spotted, a pore venting at its peak. Rotting.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from bkit import _obj
import bmesh

GOLD, GOLD_D = C(0xd8b040), C(0x8a6a20)
ROBE, ROBE_D = C(0x4e2c5e), C(0x341c40)
ERMINE, RUFF, RUFF_D = FLESH(0.95), C(0xe2d8c0), C(0xb0a488)
reset(); parts = []
NR = 9
def ridged(v, d=0.1):
    a = math.atan2(v.z, v.x); k = 1 + d * (abs(math.cos(a * NR / 2)) * 2 - 1); return Vector((v.x * k, v.y, v.z * k))

for s in (-1, 1):
    P, _ = root_leg(s, [s * 30, 52, 0], (s * 30, 60, 0), (s * 33, 34, 8), (s * 33, 13, 10), [17, 15, 13], toes=4, toe_len=22, spread=1.1)
    parts.append(P)

# ---------------------------------------------------------------- body: the robe, the ruff, the puffball with the face
EYES = [{'at': [s * 19, 172, 49], 'r': 8, 's': s, 'out': [s * 0.35, 0.05, 0.94]} for s in (-1, 1)]
BODY = Part('Body', [0, 56, 0], eyes=EYES)
NF = 10
def robe_r(y, a):
    t = max(0.0, min(1.0, (136 - y) / 104)); return 44 + t * 30 + (abs(math.cos(a * NF / 2)) * 2 - 1) * 5 * t
bm = bmesh.new(); rings = []; SEG = 40
for j, y in enumerate((138, 116, 92, 68, 46, 32)):
    rings.append([bm.verts.new((math.cos(i * 2 * math.pi / SEG) * robe_r(y, i * 2 * math.pi / SEG), y, math.sin(i * 2 * math.pi / SEG) * robe_r(y, i * 2 * math.pi / SEG))) for i in range(SEG)])
inner = [bm.verts.new((math.cos(i * 2 * math.pi / SEG) * (robe_r(32, i * 2 * math.pi / SEG) - 4), 42, math.sin(i * 2 * math.pi / SEG) * (robe_r(32, i * 2 * math.pi / SEG) - 4))) for i in range(SEG)]
top = bm.verts.new((0, 140, 0)); roof = bm.verts.new((0, 64, 0))
for j in range(len(rings) - 1):
    for i in range(SEG):
        k = (i + 1) % SEG; bm.faces.new((rings[j][i], rings[j][k], rings[j + 1][k], rings[j + 1][i]))
for i in range(SEG):
    k = (i + 1) % SEG
    bm.faces.new((top, rings[0][k], rings[0][i])); bm.faces.new((rings[-1][i], rings[-1][k], inner[k], inner[i])); bm.faces.new((inner[i], inner[k], roof))
bm.normal_update(); robe = _obj('robe', bm)
BODY.add(robe, lambda m, n: ROBE_D if n.y < -0.4 else ROBE)
hem = lathe([(78, 46), (82, 40), (82, 30), (76, 26), (70, 32), (70, 44)], seg=40, name='hem')
deform(hem, lambda v: Vector((v.x * robe_r(40, math.atan2(v.z, v.x)) / 74, v.y, v.z * robe_r(40, math.atan2(v.z, v.x)) / 74)))
BODY.add(hem, lambda m, n: ERMINE, 600); ph_ = projector(hem)
for k in range(14):                                                   # the ermine's black tails
    a = k * 2 * math.pi / 14 + 0.1; r = robe_r(36, a) + 9
    BODY.add(decal(ph_, (math.cos(a) * r, 36, math.sin(a) * r), (math.cos(a), 0, math.sin(a)), 2.6, seg=8, rings=1, lift=0.5, squash=(0.6, 1.6)), lambda m, n: BLACK)
pr = projector(robe)
for i, (a, y) in enumerate(((2.4, 70), (4.0, 96), (5.4, 60))):
    rr = robe_r(y, a); rot_patch(BODY.add, pr, (math.cos(a) * rr, y, math.sin(a) * rr), (math.cos(a), 0, math.sin(a)), 10, 3 + i * 3)
for s in (-1, 1): BODY.add(blob((s * 30, 60, 0), (14, 12, 14), name='hipsock'), lambda m, n: ROBE_D, 80)
# the ruff: a pleated ring of pale gill round the neck
ruff = lathe([(38, 5), (60, 4), (72, 1), (72, -1), (60, -4), (38, -5)], seg=64, name='ruff')
deform(ruff, lambda v: Vector((v.x, v.y + 4.5 * math.sin(math.atan2(v.z, v.x) * 24) * min(1, (math.hypot(v.x, v.z) - 38) / 30), v.z)))
bake_world(transform(ruff, Matrix.Translation((0, 136, 2)) @ Matrix.Rotation(-0.12, 4, 'X')))
BODY.add(ruff, lambda m, n: RUFF if math.sin(math.atan2(m.z - 2, m.x) * 24) > 0 else RUFF_D, 900)
# the puffball: ridged, a face on its front
pb = lathe([(0, 206), (20, 204), (40, 196), (54, 180), (58, 162), (54, 146), (44, 134), (0, 128)], seg=NR * 2, name='puff')
deform(pb, ridged)
pieces = [(pb, lambda m, n: CAP(1) if abs(math.cos(math.atan2(m.z, m.x) * NR / 2)) > 0.35 else mix(CAP(1), ROOT_D, 0.3))]
for s in (-1, 1):
    pieces.append((blob((s * 19, 182, 46), (15, 5, 8), rot=(0.2, 0, -s * 0.32), name='lid'), lambda m, n: mix(CAP(1), ROOT_D, 0.45)))   # heavy lids
    pieces.append((blob((s * 30, 146, 38), (16, 14, 14), name='jowl'), lambda m, n: CAP(1)))
pieces.append((blob((0, 138, 40), (26, 13, 16), name='chin'), lambda m, n: CAP(1)))
fo, fp = fuse(pieces, voxel=1.0, smooth=1, tris=3200, name='puff')
BODY.add(fo, fp); pj = projector(fo); seat_eyes(EYES, pj, 0.3)
BODY.add(decal(pj, (0, 152, 56), (0, -0.1, 1), 24, seg=36, rings=3, lift=0.6, squash=(1, 0.3), wobble=0.08, seed=4), lambda m, n: MOUTH)   # the sneer
for i in range(7):                                                    # the underbite: lower teeth up over the lip, two tusks
    x = -15 + i * 5; L = 13 if i in (0, 6) else 5
    h = pj.ray_cast(Vector((x, 148.5, 120)), Vector((0, 0, -1)), 100)
    if h[0] is None: continue
    BODY.add(skin([tuple(h[0] - h[1] * 0.6), tuple(h[0] + h[1] * 1.6 + Vector((x * 0.04, L, 0)))], [3.4 if L > 10 else 2, 0.15], sub=1, name='t'), lambda m, n: TOOTH, 14)
for k in range(7):                                                    # the beard of spore-tendrils
    x = -18 + k * 6; L = 22 + ((k * 7) % 5) * 6 - abs(x) * 0.3
    h = pj.ray_cast(Vector((x, 136, 120)), Vector((0, 0, -1)), 100)
    if h[0] is None: continue
    b = h[0] - Vector((0, 0, 2))
    BODY.add(skin([tuple(b), tuple(b + Vector((x * 0.05, -L * 0.5, 4))), tuple(b + Vector((x * 0.1, -L, 2)))], [4.4, 3, 1.4], sub=1, name='beard'), lambda m, n: mix(FLESH(0.6), ROOT_D, 0.7), 30)
    BODY.add(blob(tuple(b + Vector((x * 0.1, -L - 1, 2))), (2.4, 3, 2.4), seg=8, name='bead'), lambda m, n: GLOW(1), 12)
sore(BODY.add, pj, (-44, 170, 24), (-0.8, 0.1, 0.5), 5, 21)
rot_patch(BODY.add, pj, (40, 186, -26), (0.6, 0.4, -0.6), 9, 24)
parts.append(BODY)

# ---------------------------------------------------------------- arms: robe sleeves, stubby root hands, the scepter
for s in (-1, 1):
    P, _ = root_arm(s, [s * 66, 120, 18], (s * 60, 124, 14), (s * 74, 98, 28), (s * 74, 76, 44), [12, 10, 9], fingers=3, f_len=14, curl=(-s * 0.6, -0.4, 1))
    sl = lathe([(0, 2), (14, 0), (19, -20), (24, -34), (21, -37), (12, -6), (0, -4)], seg=12, name='sleeve')
    d = Vector((s * 14, -26, 14)).normalized()
    sl.matrix_world = Matrix.Translation((s * 60, 126, 14)) @ Vector((0, -1, 0)).rotation_difference(d).to_matrix().to_4x4(); bake_world(sl)
    P.add(sl, lambda m, n: ERMINE if n.y < -0.6 else ROBE, 400)
    if s > 0:                                                         # the scepter
        X, Z = 76, 52
        P.add(skin([(X, 34, Z), (X, 90, Z), (X, 150, Z)], [3.2, 3, 2.8], sub=1, name='rod'), lambda m, n: ROOT_D, 120)
        P.add(lathe([(0, 6), (7, 3), (8, 0), (0, -3)], seg=10, name='cup'), lambda m, n: GOLD, 60); bake_world(transform(P.pieces[-1][0], Matrix.Translation((X, 152, Z))))
        P.add(blob((X, 162, Z), (8, 9, 8), seg=12, name='orb'), lambda m, n: GLOW(1), 80)
        for k in range(4):
            a = k * math.pi / 2 + 0.4
            P.add(skin([(X + math.cos(a) * 6, 154, Z + math.sin(a) * 6), (X + math.cos(a) * 10, 162, Z + math.sin(a) * 10), (X + math.cos(a) * 3, 172, Z + math.sin(a) * 3)], [1.3, 1.3, 1], sub=1, name='cage'), lambda m, n: GOLD, 30)
    parts.append(P)

# ---------------------------------------------------------------- head: the crown
HEAD = Part('Head', [0, 176, 0])
band = lathe([(40, 16), (44, 12), (45, 0), (41, -4), (34, -4), (34, 16)], seg=12, name='band')
bake_world(transform(band, Matrix.Translation((0, 196, 0))))
HEAD.add(band, lambda m, n: GOLD if abs(n.y) < 0.6 else GOLD_D, 300)
for i in range(12):
    a = i * math.pi / 6; L = 26 if i % 2 == 0 else 13
    b = Vector((math.cos(a) * 42, 210, math.sin(a) * 42)); o = Vector((math.cos(a) * 0.2, 1, math.sin(a) * 0.2)).normalized()
    HEAD.add(skin([tuple(b), tuple(b + o * L)], [(5.5, 2.4), (0.3, 0.3)], sub=1, name='pt'), lambda m, n: GOLD, 20)
    if i % 2 == 0: HEAD.add(blob(tuple(b + o * (L + 2)), (3, 3, 3), seg=8, name='gem'), lambda m, n: GLOW(1), 16)
    else: HEAD.add(blob(tuple(b - o * 4 + Vector((math.cos(a), 0, math.sin(a))) * 3.5), (3, 3, 2), seg=8, name='stud'), lambda m, n: CAP(1), 12)
dome = lathe([(0, 232), (14, 230), (28, 222), (36, 210), (38, 200), (0, 200)], seg=14, name='dome')
HEAD.add(dome, lambda m, n: CAP(1), 300); pd = projector(dome)
for k, (a, t) in enumerate(((0.3, 0.5), (1.8, 0.6), (3.2, 0.45), (4.6, 0.65), (5.6, 0.4))):
    c = Vector((math.cos(a) * 30 * t, 240, math.sin(a) * 30 * t)); h = pd.ray_cast(c, Vector((0, -1, 0)), 80)
    if h[0] is not None: HEAD.add(decal(pd, h[0], h[1], 4.5, seg=12, rings=1, lift=0.4), lambda m, n: SPOT)
HEAD.add(lathe([(0, 236), (8, 236), (5, 228), (0, 227)], seg=10, name='pore'), lambda m, n: GLOW(1), 40)
parts.append(HEAD)

export('B_KingPuff', parts, out_path('B_KingPuff'), height=230)
