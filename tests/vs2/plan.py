# Layout planner for Thimblewick: footprints in the code frame (+x right, +y up), overlap check, schematic picture.
import math, itertools
from PIL import Image, ImageDraw
def cr(pts, n=24):   # centripetal-ish Catmull-Rom through pts (uniform is fine for a sketch)
    out = []
    P = [pts[0]] + pts + [pts[-1]]
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(n):
            t = k / n; t2 = t * t; t3 = t2 * t
            out.append(tuple(0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3) for j in (0, 1)))
    out.append(pts[-1]); return out
STREAM = [(-4800, -1650), (-3200, -1900), (-1900, -2080), (-700, -1950), (0, -1850), (700, -1950), (1600, -2250), (2700, -2380), (4800, -2250)]
import math as _m
SP = [(x, -1850 + _m.sin(x * 0.0009) * 260 + _m.sin(x * 0.0023) * 90) for x in range(-4800, 4801, 80)]
def stream_y(x):
    for a, b in zip(SP, SP[1:]):
        if a[0] <= x <= b[0]: t = (x - a[0]) / (b[0] - a[0] or 1); return a[1] + (b[1] - a[1]) * t
GIANTS = {'G0': (0, 4900, 680), 'G1': (-2850, 2750, 520), 'G2': (2750, 2650, 540), 'G3': (-3650, -1000, 470), 'G4': (3050, -2250, 430), 'G5': (-2300, -3050, 420), 'G6': (1700, -3850, 430)}
CASINO = (2250, 450)
F = {
  'square': ('c', 0, 0, 690), 'casino': ('c', *CASINO, 1150), 'bb_house': ('c', -1650, 250, 670), 'bb_counter': ('r', -1060, 250, 120, 650),
  'home': ('r', -1950, 1650, 760, 620), 'porch': ('r', -1340, 1650, 480, 900), 'garden': ('r', -2750, 1500, 620, 460),
  'forge': ('r', -1800, -1250, 660, 540), 'forge_counter': ('r', -1280, -1250, 120, 640), 'hearth': ('r', -1680, -1650, 220, 180), 'wheel': ('r', -2150, -1760, 330, 120),
  'yard': ('c', 1500, -2750, 510), 'campfire': ('c', 1050, -950, 280), 'lectern': ('c', 1150, 1700, 330), 'pool': ('c', 1700, 2050, 300),
  'gate': ('c', 0, 2600, 500), 'archS_w': ('c', -450, -1350, 170), 'archS_e': ('c', 450, -1350, 170), 'archN_w': ('c', -470, 1450, 170), 'archN_e': ('c', 470, 1450, 170),
  'cot_sw': ('c', -1100, -2900, 495), 'cot_w': ('c', -2750, -500, 495), 'ladder': ('c', 2255, 1679, 60), 'welcome': ('r', 0, -3250, 700, 120),
}
for k, (x, y, r) in GIANTS.items(): F[k] = ('c', x, y, r)
def box(f):
    if f[0] == 'c': return (f[1] - f[3], f[2] - f[3], f[1] + f[3], f[2] + f[3])
    return (f[1] - f[3] / 2, f[2] - f[4] / 2, f[1] + f[3] / 2, f[2] + f[4] / 2)
def dist(f, g):
    if f[0] == 'c' and g[0] == 'c': return math.hypot(f[1] - g[1], f[2] - g[2]) - f[3] - g[3]
    # rect vs anything: distance between boxes (circles as boxes): rough
    a, b = box(f), box(g); dx = max(a[0] - b[2], b[0] - a[2], 0); dy = max(a[1] - b[3], b[1] - a[3], 0)
    if dx == 0 and dy == 0: return -min(a[2] - b[0], b[2] - a[0], a[3] - b[1], b[3] - a[1])
    return math.hypot(dx, dy)
pairs_ok = {('bb_house', 'bb_counter'), ('forge', 'forge_counter'), ('home', 'porch'), ('forge', 'wheel'), ('G2', 'ladder')}
print('== tight pairs (gap < 120)')
for (a, f), (b, g) in itertools.combinations(F.items(), 2):
    if (a, b) in pairs_ok or (b, a) in pairs_ok: continue
    d = dist(f, g)
    if d < 120: print(f'{a:12s} {b:12s} gap {d:7.0f}')
print('== stream clearance (north/south bank at +-260)')
for k, f in F.items():
    x0, y0, x1, y1 = box(f)
    for x in (x0, (x0 + x1) / 2, x1):
        sy = stream_y(x)
        if sy is None: continue
        if y0 - 40 < sy + 260 and y1 + 40 > sy - 260 and k not in ('wheel',): print(f'{k} meets the stream at x={x:.0f} (stream y {sy:.0f})'); break
# picture
S = 1400 / 9000; W = 1400
img = Image.new('RGB', (W, W), (70, 100, 50)); d = ImageDraw.Draw(img)
P = lambda x, y: (W / 2 + x * S, W / 2 - y * S)
d.rectangle([P(-3000, 3000), P(3000, -3000)], outline=(200, 200, 120))
for a, b in zip(SP, SP[1:]): d.line([P(*a), P(*b)], fill=(60, 120, 150), width=int(520 * S))
for x in range(-4000, 4001, 1000): d.line([P(x, -4500), P(x, 4500)], fill=(90, 120, 70)); d.line([P(-4500, x), P(4500, x)], fill=(90, 120, 70))
d.line([P(0, -3400), P(0, 2400)], fill=(150, 120, 80), width=int(360 * S))
for k, f in F.items():
    col = (60, 40, 30) if k.startswith('G') else (230, 200, 120) if k in ('casino', 'bb_house', 'home', 'forge') else (200, 160, 200)
    if f[0] == 'c': d.ellipse([P(f[1] - f[3], f[2] + f[3]), P(f[1] + f[3], f[2] - f[3])], outline=col, width=2)
    else: d.rectangle([P(f[1] - f[3] / 2, f[2] + f[4] / 2), P(f[1] + f[3] / 2, f[2] - f[4] / 2)], outline=col, width=2)
    d.text(P(f[1] - 40, f[2] + 20), k, fill=(255, 255, 255))
img.save('/tmp/plan.png')
