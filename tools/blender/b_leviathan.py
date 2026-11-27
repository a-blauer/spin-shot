# The Leviathan (boss, ward): what lives under everything, one head pushed up into the room. A vast faceted dome folded
# and ridged like a brain, a ring of five scowling eyes round its brow under a heavy ridge; under it a huge round maw ringed
# with rings of hooked teeth, lit deep inside, its lip crowned with spikes; round its base a fringe of thick root
# tentacles curling over the floor to sharp points. Rotting: sores and olive rot over the dome.
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

reset(); parts = []; rng = random.Random(9)
EYES = [{'at': [x, 178 - abs(x) * 0.3, 92 - abs(x) * 0.5], 'r': 9 if x == 0 else 7, 's': -1 if x < 0 else 1, 'out': [x / 60, 0.1, 1]} for x in (-40, -20, 0, 20, 40)]
BODY = Part('Body', [0, 120, 0], eyes=EYES)
dome = lathe([(0, 238), (36, 234), (68, 218), (90, 192), (104, 160), (110, 124), (114, 84), (122, 40), (134, 10), (138, 0), (0, 0)], seg=18, name='dome')
pieces = [(dome, lambda m, n: CAP(1))]
for k in range(30):                                                   # the folds: thick winding ridges over the top
    a0 = rng.uniform(0, 2 * math.pi); el0 = rng.uniform(0.35, 1.45); pts = []
    for j in range(6):
        a = a0 + j * rng.uniform(0.12, 0.3) * (1 if k % 2 else -1); el = el0 + math.sin(j * 1.3 + k) * 0.18
        r = 112 * math.cos(el * 0.75); y = 110 + 124 * math.sin(el * 0.75 + 0.1)
        pts.append((math.cos(a) * r, min(y, 238), math.sin(a) * r))
    if any(p[2] > 40 and 140 < p[1] < 210 and abs(p[0]) < 70 for p in pts): continue     # keep the brow and eyes clear
    pieces.append((skin(pts, [10] * len(pts), sub=1, name='fold'), lambda m, n: mix(CAP(1), C(0xf0e2c0), 0.2)))
pieces.append((skin([(-62, 186, 64), (-30, 196, 84), (0, 198, 92), (30, 196, 84), (62, 186, 64)], [10, 12, 12, 12, 10], sub=1, name='brow'), lambda m, n: mix(CAP(1), ROOT_D, 0.4)))
pieces.append((blob((0, 110, 60), (60, 50, 50), name='mawsock'), lambda m, n: FLESH(0.85)))
bo, bp = fuse(pieces, voxel=2.0, smooth=1, tris=0, name='dome')
deform(bo, lambda v: Vector((v.x, max(v.y, 0), v.z)))
decimate(bo, 5200)
def dome_paint(m, n):
    if m.y < 30: return ROOT_D
    return bp(m, n) if n.y > -0.3 else mix(CAP(1), ROOT_D, 0.5)
BODY.add(bo, dome_paint); pj = projector(bo); seat_eyes(EYES, pj, 0.3)
for i, (a, y, r) in enumerate(((2.0, 200, 14), (3.4, 150, 16), (4.4, 210, 12), (5.6, 130, 14), (1.0, 120, 12))):
    rr = 100 * math.cos((y - 120) / 140); rot_patch(BODY.add, pj, (math.cos(a) * rr, y, math.sin(a) * rr), (math.cos(a), (y - 120) / 100, math.sin(a)), r, 3 + i * 3)
sore(BODY.add, pj, (-80, 120, 40), (-0.8, 0, 0.5), 9, 30)
sore(BODY.add, pj, (70, 170, -40), (0.7, 0.5, -0.4), 7, 33)
for i in range(11):                                                   # root tentacles curling out over the floor
    a = i * 2 * math.pi / 11 + 0.4
    if math.sin(a) > 0.75: continue
    d = Vector((math.cos(a), 0, math.sin(a))); side = Vector((-d.z, 0, d.x)) * (1 if i % 2 else -1)
    pts = [d * 92 + Vector((0, 26, 0)), d * 122 + Vector((0, 14, 0)) + side * 6, d * 150 + Vector((0, 8, 0)) + side * 16, d * 168 + Vector((0, 14, 0)) + side * 24, d * 170 + Vector((0, 26, 0)) + side * 18]
    t, _ = fuse([(skin([tuple(p) for p in pts], [16, 12, 8, 5, 2], sub=2, name='tentacle'), None)], voxel=1.0, smooth=2, tris=0, name='tentacle')
    deform(t, lambda v: Vector((v.x, max(v.y, 0), v.z)))
    sharpen(t, pts[3], pts[4] + (pts[4] - pts[3]).normalized() * 6, 6)
    BODY.add(t, lambda m, n: ROOT if n.y > -0.2 else ROOT_D, 360)
parts.append(BODY)

HEAD = Part('Head', [0, 100, 40])
lip = lathe([(28, 6), (38, 4), (42, 0), (40, -6), (30, -8)], seg=16, name='lip')
lip.matrix_world = Matrix.Translation((0, 110, 100)) @ Matrix.Rotation(math.pi / 2, 4, 'X'); bake_world(lip)
HEAD.add(lip, lambda m, n: mix(FLESH(0.6), ROOT_D, 0.55) if n.z > 0.2 else ROOT_D, 600)
gul = lathe([(0, 2), (30, 1), (18, -26), (0, -30)], seg=16, name='gullet')
gul.matrix_world = Matrix.Translation((0, 110, 100)) @ Matrix.Rotation(math.pi / 2, 4, 'X'); bake_world(gul)
HEAD.add(gul, lambda m, n: GLOW(1) if math.hypot(m.x, m.y - 110) < 12 else MOUTH, 200)
HEAD.add(blob((0, 110, 56), (36, 34, 20), name='throat'), lambda m, n: MOUTH, 300)
for ring, (R, z, L, n) in enumerate(((30, 102, 15, 14), (21, 94, 11, 12), (12, 86, 7, 9))):
    for i in range(n):
        a = i * 2 * math.pi / n + ring * 0.25; c = Vector((math.cos(a) * R, 110 + math.sin(a) * R, z)); inw = Vector((-math.cos(a), -math.sin(a), -0.5)).normalized()
        HEAD.add(skin([tuple(c - inw * 2), tuple(c + inw * L * 0.6 + Vector((0, 0, 2))), tuple(c + inw * L)], [4.2 - ring * 0.8, 2.4, 0.15], sub=1, name='t'), lambda m, n: TOOTH, 20)
for i in range(12):
    a = i * math.pi / 6 + 0.1; b = Vector((math.cos(a) * 41, 110 + math.sin(a) * 41, 100)); o = Vector((math.cos(a), math.sin(a), 0.6)).normalized()
    HEAD.add(skin([tuple(b - o * 3), tuple(b + o * 10), tuple(b + o * 19)], [5, 3, 0.15], sub=1, name='spike'), lambda m, n: ROOT_D, 30)
for o in HEAD.pieces: deform(o[0], lambda v: Vector((0, 116, 100)) + (v + Vector((0, 6, 24)) - Vector((0, 116, 100))) * 1.25)   # the maw pushes out of the dome, huge
HEAD.add(skin([(0, 116, 60), (0, 116, 86), (0, 116, 112)], [40, 38, 36], sub=2, name='neck'), lambda m, n: mix(FLESH(0.6), ROOT_D, 0.55), 300)
parts.append(HEAD)

export('B_Leviathan', parts, out_path('B_Leviathan'), height=200, lean=0.0)
