# The Nameless (boss, eclipse): tall as the room allows. A figure cloaked from crown to floor in overlapping tiers of cap,
# each tier flaring and torn at its hem, the edges catching the strain's colour; no face, only a tall pointed hood with a
# deep opening and a slit of light where a face would be; eyes, many of them, open all over the cloak, every one a sharp
# lit eye; wide sleeves of cap and long thin dark hands with very long sharp fingers.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

CLOAK, CLOAK2 = C(0x24202a), C(0x34303c)
reset(); parts = []
def R_at(y): t = max(0.0, min(1.0, (232 - y) / 210)); return 34 + t * 64

EYES = []
for i in range(14):
    a = -0.9 + (i % 7) * 0.3 + (0.15 if i > 6 else 0); y = 70 + (i // 7) * 60 + (i % 3) * 14; R = R_at(y) + 4
    EYES.append({'at': [math.sin(a) * R, y, math.cos(a) * R], 'r': 6 + (i % 3) * 2, 's': -1 if math.sin(a) < 0 else 1, 'out': [math.sin(a), 0, math.cos(a)]})
BODY = Part('Body', [0, 30, 0], eyes=EYES)
TIERS = [(236, 186), (196, 140), (154, 96), (112, 52), (70, 0)]              # top and hem of each tier of cap
tier_obs = []
for k, (top, hem) in enumerate(TIERS):
    rt, rh = R_at(top) * 0.92, R_at(hem) + 8
    sh = lathe([(0, top + 4), (rt, top), (rh * 0.96, hem + 6), (rh, hem), (rh - 6, hem + 2), (rt - 6, top - 6), (0, top - 4)], seg=20, name='tier')
    def _hem(v, hem=hem, k=k):
        if v.y > hem + 8: return v
        a = math.atan2(v.z, v.x); bite = max(0, math.sin(a * 7 + k * 1.7)) ** 3 * 10 + max(0, math.sin(a * 3 + k)) * 4
        return Vector((v.x, v.y + bite * (1 if k < 4 else 0), v.z))
    deform(sh, _hem)
    def tp(m, n, hem=hem):
        if m.y < hem + 10 and n.y > -0.5: return mix(CAP(0.75), CLOAK, 0.3)          # the edge catches the strain's colour
        return CLOAK2 if n.y > 0.5 else CLOAK
    BODY.add(sh, tp, 900); tier_obs.append(sh)
BODY.add(blob((0, 120, 0), (40, 110, 40), name='core'), lambda m, n: CLOAK, 200)
pj = projector(*tier_obs); seat_eyes(EYES, pj, 0.3)
for e in EYES:                                                        # each eye in a ragged lid of cap
    BODY.add(decal(pj, e['at'], e['out'], e['r'] * 1.5, seg=16, rings=1, lift=0.6, squash=(1.3, 0.8), wobble=0.2, seed=int(e['at'][1])), lambda m, n: BLACK)
for i, (a, y) in enumerate(((2.6, 110), (3.6, 170), (4.4, 70), (1.4, 200))):
    rr = R_at(y) + 6; rot_patch(BODY.add, pj, (math.cos(a) * rr, y, math.sin(a) * rr), (math.cos(a), 0.4, math.sin(a)), 12, 3 + i * 3, mold=False)
parts.append(BODY)

for s in (-1, 1):
    P, _ = root_arm(s, [s * 40, 200, 4], (s * 42, 198, 4), (s * 82, 122, 40), (s * 90, 72, 62), [9, 7, 5.5], fingers=4, f_len=30, f_r=2.6, curl=(0, -0.5, 1), spread=0.7, thumb=False,
                    paint=lambda m, n: CLOAK, tip=C(0x0c0a10))
    sl = lathe([(0, 22), (16, 20), (24, 0), (34, -40), (30, -44), (14, -4), (0, -2)], seg=12, name='sleeve')
    d = Vector((s * 40, -78, 36)).normalized()
    sl.matrix_world = Matrix.Translation((s * 42, 198, 4)) @ Vector((0, -1, 0)).rotation_difference(d).to_matrix().to_4x4(); bake_world(sl)
    P.add(sl, lambda m, n: mix(CAP(0.75), CLOAK, 0.3) if n.y < -0.5 else CLOAK, 400)
    parts.append(P)

HEAD = Part('Head', [0, 222, 6])
hood = lathe([(0, 304), (6, 298), (20, 284), (34, 262), (40, 240), (38, 220), (30, 212), (0, 214)], seg=16, name='hood')
deform(hood, lambda v: Vector((v.x, v.y, v.z - max(0, v.y - 270) * 0.5)))     # the point droops back
carve(hood, blob((0, 244, 40), (22, 30, 24), seg=24, name='opening'))
HEAD.add(hood, lambda m, n: CLOAK if not (m.z > 14 and abs(m.x) < 24 and 212 < m.y < 276 and n.z < 0.6) else BLACK, 1400)
HEAD.add(blob((0, 248, 18), (12, 2.4, 3), name='slit'), lambda m, n: GLOW(1), 40)
HEAD.add(blob((0, 248, 14), (16, 6, 4), name='glow'), lambda m, n: GLOW(0.5), 40)
parts.append(HEAD)

export('B_Nameless', parts, out_path('B_Nameless'), height=280, lean=0.0)
