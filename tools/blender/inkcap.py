# Inkcap (Spitter): a tall shaggy bell of a cap, faceted and scaled, its lower half gone ink-black and dripping, over a
# slim root stalk; under the rim a scowling face and a round pursed mouth ringed with teeth that it spits through.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

INK, INK2 = C(0x16121a), C(0x2a2230)
SCALE = mix(CAP(0.7), C(0xf0e6d0), 0.45)
reset(); parts = []

# legs and body: a slim stalk on thin root legs
for s in (-1, 1):
    P, _ = root_leg(s, [s * 13, 70, 0], (s * 13, 74, 0), (s * 16, 42, 6), (s * 14, 12, 1), [9, 7.5, 6], toes=3, toe_len=15)
    parts.append(P)
BODY = Part('Body', [0, 70, 0])
st = skin([(0, 72, 0), (0, 96, 1), (0, 120, 3), (0, 128, 3)], [(15, 13), (11, 10), (12, 11), (13, 12)], sub=2, name='stalk')
socks = [blob((s * 13, 72, 0), (10, 10, 10), name='hip') for s in (-1, 1)] + [blob((s * 15, 120, 3), (8.5, 8.5, 8.5), name='sho') for s in (-1, 1)]
body, bp = fuse([(st, lambda m, n: FLESH(0.9) if m.y > 84 else ROOT)] + [(o, lambda m, n: ROOT) for o in socks], voxel=0.8, smooth=3, tris=1600, name='body')
BODY.add(body, bp); pj = projector(body)
BODY.add(ribbon(pj, [(-11, 116, 6), (-10, 104, 9), (-8, 92, 10), (-9, 82, 9)], 2.2, lambda p: (-0.6, 0, 1), lift=0.6), lambda m, n: OOZE)
sore(BODY.add, pj, (9, 98, 8), (0.6, 0, 1), 3.4, 3)
rot_patch(BODY.add, pj, (-9, 78, -8), (-0.6, 0, -1), 6, 6)
parts.append(BODY)
for s in (-1, 1):
    P, _ = root_arm(s, [s * 15, 120, 3], (s * 16, 120, 3), (s * 25, 95, 9), (s * 27, 72, 14), [6, 5, 4.2], fingers=3, f_len=12)
    parts.append(P)

# head: the face on the stalk's top, the bell over it
EYES = [{'at': [s * 6.5, 141, 14.2], 'r': 3.4, 'out': [s * 0.3, 0.05, 0.95], 's': s} for s in (-1, 1)]
TEETH = []
for i in range(8):
    a = i * math.pi / 4; c = [math.cos(a) * 4.6, 132 + math.sin(a) * 4.6, 16.2]
    TEETH.append({'a': c, 'b': [c[0] * 0.35, 132 + (c[1] - 132) * 0.35, 17.6], 'r': 1.5})
HEAD = Part('Head', [0, 128, 3], eyes=EYES, teeth=TEETH)
face = [(skin([(0, 124, 3), (0, 140, 4), (0, 152, 4)], [13, 14, 13], sub=2, name='neck'), lambda m, n: FLESH(1))]
for s in (-1, 1): face.append((blob((s * 7, 146.5, 14), (7, 2.4, 4), rot=(0, 0, s * 0.45), name='brow'), lambda m, n: FLESH(0.7)))
face.append((lathe([(5.6, 2.6), (7.2, 0.5), (6.6, -1.6), (4.2, -2)], seg=14, name='lips'), lambda m, n: FLESH(0.75)))
bake_world(transform(face[-1][0], Matrix.Translation((0, 132, 13.6)) @ Matrix.Rotation(math.pi / 2, 4, 'X')))
fo, fp = fuse(face, voxel=0.5, smooth=2, tris=1600, name='face')
HEAD.add(fo, fp)
HEAD.add(blob((0, 132, 15.8), (4.2, 4.2, 2), name='mouth'), lambda m, n: MOUTH, 40)
# the bell: tall, faceted, its brim bitten; black ink on the lower half
bell = lathe([(0, 228), (6, 226), (14, 218), (21, 204), (26, 186), (30, 168), (33, 152), (29, 148), (20, 152), (0, 158)], seg=20, name='bell')
def _ridge(v):
    a = math.atan2(v.z, v.x); k = 1 + 0.07 * (abs(math.cos(a * 5)) * 2 - 1); return Vector((v.x * k, v.y, v.z * k))
deform(bell, _ridge)
def _bite(v):
    if v.y > 156: return v
    a = math.atan2(v.z, v.x); k = 1 - 0.12 * max(0, math.sin(a * 5 + 1)); return Vector((v.x * k, v.y - 8 * max(0, math.sin(a * 7 + 2)) ** 2 - 3 * max(0, math.sin(a * 3)), v.z * k))
deform(bell, _bite)
bake_world(transform(bell, Matrix.Translation((0, 0, 3))))
def bell_paint(m, n):
    if n.y < -0.4: return GILL_A
    a = math.atan2(m.z - 3, m.x); e = 172 + 7 * math.sin(a * 7) + 4 * math.sin(a * 3 + 1)      # the ink's ragged upper edge
    return INK if m.y < e else (mix(INK, CAP(1), 0.5) if m.y < e + 6 else CAP(1))
HEAD.add(bell, bell_paint, 900)
pb = projector(bell)
# shaggy scales: pale flakes curling down off the upper bell
for k in range(34):
    a = k * 2.4; y = 180 + (k % 4) * 11; r = 29 - (y - 180) * 0.3
    p = Vector((math.cos(a) * r, y, math.sin(a) * r + 3)); o = Vector((math.cos(a), 0.25, math.sin(a)))
    hit = pb.ray_cast(p + o * 20, -o, 50)
    if hit[0] is None: continue
    b = hit[0] - o * 0.8
    HEAD.add(skin([tuple(b), tuple(b + o * 4 + Vector((0, -6, 0))), tuple(b + o * 6 + Vector((0, -13, 0)))], [4.2, 2.6, 0.15], sub=1, name='scale'), lambda m, n: SCALE if y > 176 else INK2, 30)
# ink drops hanging off the rim
for i, a in enumerate((0.3, 1.2, 2.2, 3.1, 3.9, 4.8, 5.6)):
    x, z = math.cos(a) * 29, math.sin(a) * 29 + 3; L = 10 + (i % 3) * 7
    HEAD.add(skin([(x, 150, z), (x * 1.02, 150 - L * 0.6, z * 1.02), (x * 1.02, 150 - L, z * 1.02)], [3.4, 2.6, 0.6], sub=1, name='drop'), lambda m, n: INK2, 60)
rot_patch(HEAD.add, pb, (-20, 196, -12), (-0.7, 0.3, -0.6), 6, 40)
parts.append(HEAD)

export('Inkcap', parts, out_path('Inkcap'), height=214)
