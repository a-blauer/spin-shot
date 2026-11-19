"""
Dead Man's Hand creature art: paper-puppet parts drawn with vectorkit, in the
flat Sulfur manner: bold readable silhouettes, two-tone crescent shading with a
crisp rim light, no outlines, muted earthy palettes with one saturated accent.

Every creature is its own design (no shared heads or bodies). Coordinates are
creature space: y up, feet at y=0, the creature faces +x, 1 unit = 0.5 cm.
Each Part has a pivot; roles drive the in-game puppet animation.
"""
import math
import random
from vectorkit import Part, ellipse, blobby, limb, path_limb, rect, shade, light, mixc

BODY, HEAD, ARM_B, ARM_F, LEG_B, LEG_F, TAIL, WING_B, WING_F, PROP = (
    'Body', 'Head', 'ArmBack', 'ArmFront', 'LegBack', 'LegFront', 'Tail', 'WingBack', 'WingFront', 'Prop')

INK = '#1d1418'
BONE = '#e9dcc0'
BONE_S = '#b9a88a'
BLOOD = '#8e1a1f'
GOLD = '#e8b83a'


# ------------------------------------------------------------------ helpers

def S(p, pts, col, **kw):
    """Standard shaded shape: shadow base, lit crescent, crisp rim."""
    kw.setdefault('rim', True)
    return p.shape(pts, col, **kw)


def P(p, pts, col, **kw):
    """Hard-edged (polygon) shaded shape."""
    kw.setdefault('rim', True)
    return p.shape(pts, col, smooth=False, **kw)


def lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def rot(v, ang):
    c, s = math.cos(ang), math.sin(ang)
    return (v[0] * c - v[1] * s, v[0] * s + v[1] * c)


def jag(a, b, n, depth, seed=0, side=1):
    """Ragged edge points from a to b (for torn cloth)."""
    rnd = random.Random(seed)
    out = []
    dx, dy = b[0] - a[0], b[1] - a[1]
    L = math.hypot(dx, dy) or 1
    nx, ny = -dy / L * side, dx / L * side
    for i in range(n + 1):
        t = i / n
        d = depth * (rnd.uniform(0.2, 1.0) if i % 2 else rnd.uniform(-0.15, 0.15))
        out.append((a[0] + dx * t + nx * d, a[1] + dy * t + ny * d))
    return out


def ragged_oval(cx, cy, rx, ry, n=22, depth=0.18, seed=0):
    rnd = random.Random(seed)
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        k = 1.0 - (rnd.uniform(0.4, 1.0) * depth if i % 2 else rnd.uniform(-0.05, 0.05))
        pts.append((cx + math.cos(a) * rx * k, cy + math.sin(a) * ry * k))
    return pts


def claw(p, wrist, ang_deg, size, col, nail=BONE, n=3, spread=24, curl=-18, palm=True):
    """Bony clawed hand pointing along ang_deg."""
    a = math.radians(ang_deg)
    pc = (wrist[0] + math.cos(a) * size * 0.55, wrist[1] + math.sin(a) * size * 0.55)
    if palm:
        S(p, ellipse(pc[0], pc[1], size * 0.62, size * 0.5, n=14, rot=a), col, rim=False)
    for i in range(n):
        fa = a + math.radians((i - (n - 1) / 2) * spread)
        k1 = (pc[0] + math.cos(fa) * size * 0.85, pc[1] + math.sin(fa) * size * 0.85)
        fa2 = fa + math.radians(curl)
        k2 = (k1[0] + math.cos(fa2) * size * 0.7, k1[1] + math.sin(fa2) * size * 0.7)
        p.shape(path_limb([pc, k1, k2], [size * 0.2, size * 0.17, size * 0.12], n_end=6), col, lit=False)
        fa3 = fa2 + math.radians(curl)
        tip = (k2[0] + math.cos(fa3) * size * 0.45, k2[1] + math.sin(fa3) * size * 0.45)
        p.flat(path_limb([k2, tip], [size * 0.1, size * 0.02], n_end=4), nail)


def mitt(p, c, r, col, ang=0, knuckles=True):
    pts = blobby(c[0], c[1], r, r * 0.86, top=1.0, bottom=1.12, left=0.95, right=1.08, n=18, jitter=0.04, seed=int(c[0]) & 255)
    d = S(p, pts, col)
    if knuckles:
        for i in range(3):
            q = rot((r * 0.55, (i - 1) * r * 0.42), math.radians(ang))
            p.clipped(d, ellipse(c[0] + q[0], c[1] + q[1], r * 0.18, r * 0.12, n=8), shade(col, 0.8))
    return d


def boot(p, ankle, length, col, toe=1, h=None, sole='#231a16'):
    h = h or length * 0.42
    x, y = ankle
    pts = [(x - length * 0.32 * toe, y + h * 0.9), (x + length * 0.22 * toe, y + h * 0.9), (x + length * 0.38 * toe, y + h * 0.25),
           (x + length * 0.82 * toe, y + h * 0.12), (x + length * 0.86 * toe, y - h * 0.32), (x - length * 0.36 * toe, y - h * 0.32)]
    if toe < 0:
        pts = pts[::-1]
    d = P(p, pts, col)
    p.clipped(d, rect(x - length, y - h * 0.32, x + length, y - h * 0.12), sole)
    return d


def socket_eye(p, c, r, glow, socket=INK, pupil=0.32, lid=None, squint=0.0):
    """Sunken eye: dark socket, small glowing pupil, optional heavy lid."""
    so = blobby(c[0], c[1], r, r * (1 - squint * 0.6), top=0.8, bottom=1.1, n=14, jitter=0.06, seed=int(c[1] * 7) & 255)
    sd = p.flat(so, socket)
    p.circle(c[0] + r * 0.18, c[1] - r * 0.05, r * pupil, glow)
    p.circle(c[0] + r * 0.28, c[1] + r * 0.06, r * pupil * 0.38, '#fff6dc', opacity=0.9)
    if lid:
        p.clipped(sd, [(c[0] - r * 2, c[1] + r * (0.25 - squint)), (c[0] + r * 2, c[1] + r * (0.45 - squint)), (c[0] + r * 2, c[1] + r * 2), (c[0] - r * 2, c[1] + r * 2)], lid, smooth=False)


def teeth_row(p, clip_d, x0, x1, y, h, n, col='#e8dcc0', down=True, seed=0, jaggy=0.35):
    rnd = random.Random(seed)
    w = (x1 - x0) / n
    for i in range(n):
        tx = x0 + w * (i + 0.5)
        th = h * (1 - jaggy + rnd.uniform(0, jaggy))
        if down:
            tri = [(tx - w * 0.46, y), (tx + w * 0.46, y), (tx + w * rnd.uniform(-0.1, 0.1), y - th)]
        else:
            tri = [(tx - w * 0.46, y), (tx + w * 0.46, y), (tx + w * rnd.uniform(-0.1, 0.1), y + th)]
        p.clipped(clip_d, tri, col, smooth=False)


def stitches(p, a, b, n, col, w=3, cross=7):
    p.stroke([a, b], col, w * 0.8)
    dx, dy = b[0] - a[0], b[1] - a[1]
    L = math.hypot(dx, dy) or 1
    nx, ny = -dy / L, dx / L
    for i in range(n):
        t = (i + 0.5) / n
        c = lerp(a, b, t)
        p.stroke([(c[0] - nx * cross, c[1] - ny * cross), (c[0] + nx * cross, c[1] + ny * cross)], col, w)


def folds(p, clip_d, lines, col, w):
    for ln in lines:
        p.clipped(clip_d, path_limb(ln, [w * 0.2] + [w] * (len(ln) - 2) + [w * 0.2], n_end=4), col)


def ribs(p, clip_d, c, w, n, gap, col, tilt=-4):
    for i in range(n):
        y = c[1] - i * gap
        p.clipped(clip_d, path_limb([(c[0] - w * 0.1, y), (c[0] + w * 0.45, y + tilt), (c[0] + w, y + tilt * 2.6)], [2, 4.2, 1.5], n_end=4), col)


def part(name, role, pivot, layer):
    return Part(name, pivot, role, layer)


# ================================================================== 1. SHAMBLER: dead townsfolk in a torn shirt and suspenders

def shambler():
    skin, skin_d = '#a3ad8c', '#7d8a6c'
    shirt, pants, susp = '#d4c9ac', '#5d4c40', '#3a2c26'
    parts = []
    hip = (0, 176)
    # legs
    for role, hx, foot_x, layer, pc in ((LEG_B, -14, -26, 0, shade(pants, 0.82)), (LEG_F, 14, 30, 0.5, pants)):
        p = part('Shambler_' + role, role, (hx, hip[1]), layer)
        knee = (hx + (foot_x - hx) * 0.4 + 6, 92)
        d = S(p, path_limb([(hx, hip[1] + 6), knee, (foot_x, 30)], [21, 17, 15]), pc)
        p.clipped(d, jag((foot_x - 30, 58), (foot_x + 30, 58), 6, 10, seed=hx + 9, side=-1) + [(foot_x + 30, 0), (foot_x - 30, 0)], skin if role == LEG_F else skin_d, smooth=False)
        boot(p, (foot_x, 16), 52, '#4a3a30' if role == LEG_F else '#3a2e26')
        parts.append(p)
    # back arm: dangling
    p = part('Shambler_ArmBack', ARM_B, (2, 300), 1)
    S(p, path_limb([(2, 304), (-6, 246), (4, 196)], [17, 14, 11]), shade(skin, 0.86))
    p.shape(path_limb([(2, 306), (-5, 262)], [19, 17]), shade(shirt, 0.82))
    claw(p, (4, 194), -80, 26, shade(skin, 0.86), curl=-10)
    parts.append(p)
    # body: hunched torso
    b = part('Shambler_Body', BODY, hip, 2)
    torso = [(-30, 168), (30, 166), (40, 196), (36, 222), (52, 270), (58, 300), (40, 322), (8, 326), (-20, 312), (-34, 270), (-30, 228), (-36, 196)]
    td = S(b, torso, shirt)
    # torn hole showing ribs and skin
    hole = ragged_oval(4, 250, 22, 26, n=18, depth=0.3, seed=4)
    b.clipped(td, hole, skin, smooth=False)
    for i in range(3):
        b.clipped(td, path_limb([(-12, 266 - i * 13), (6, 262 - i * 13), (22, 256 - i * 13)], [1.5, 3.4, 1.2]), skin_d)
    b.clipped(td, ragged_oval(24, 206, 16, 12, n=14, depth=0.4, seed=7), '#9a3a30', opacity=0.85, smooth=False)
    # suspenders + belt
    b.clipped(td, path_limb([(-18, 176), (-14, 250), (8, 318)], [5, 5, 5]), susp)
    b.clipped(td, path_limb([(26, 172), (40, 240), (44, 304)], [5, 5, 5]), susp)
    b.clipped(td, rect(-60, 166, 70, 182), pants)
    folds(b, td, [[(-24, 300), (-10, 270), (-14, 236)], [(52, 292), (46, 270)]], shade(shirt, 0.78), 3)
    # collar
    b.clipped(td, [(20, 330), (58, 312), (44, 300), (30, 318)], shade(shirt, 0.9), smooth=False)
    parts.append(b)
    # head: long gaunt face, slack jaw
    h = part('Shambler_Head', HEAD, (36, 306), 3)
    hc = (56, 344)
    neck = S(h, path_limb([(30, 300), (48, 330)], [13, 13]), skin_d, rim=False)
    jaw = [(40, 316), (82, 306), (92, 292), (74, 286), (46, 296)]
    S(h, jaw, skin, rim=False)
    head = [(24, 352), (30, 382), (54, 396), (80, 388), (92, 362), (94, 340), (88, 318), (66, 314), (40, 320), (28, 334)]
    d = S(h, head, skin)
    # mouth gap between skull and jaw
    m = h.flat([(58, 318), (90, 316), (92, 300), (74, 296), (56, 306)], INK)
    teeth_row(h, m, 64, 90, 316, 8, 4, seed=3)
    # brow + sunken eyes
    h.clipped(d, blobby(66, 362, 34, 9, n=12), skin_d)
    socket_eye(h, (64, 352), 9, '#e8d068', socket='#3a3428')
    socket_eye(h, (84, 352), 7, '#e8d068', socket='#3a3428')
    h.clipped(d, [(88, 346), (100, 330), (90, 326)], skin_d, smooth=False)
    # stringy hair
    for i, (a, b2) in enumerate((((30, 380), (8, 352)), ((40, 392), (14, 372)), ((52, 396), (30, 400)), ((66, 396), (60, 404)))):
        h.flat(path_limb([a, lerp(a, b2, 0.5), b2], [5, 4, 1.2]), '#3e3632')
    h.clipped(d, blobby(36, 350, 8, 12, n=10), '#7e6a5a')  # ear nub
    parts.append(h)
    # front arm: reaching forward
    p = part('Shambler_ArmFront', ARM_F, (44, 298), 4)
    S(p, path_limb([(44, 300), (92, 284), (140, 272)], [16, 13, 11]), skin)
    sl = S(p, path_limb([(42, 302), (80, 290)], [19, 17]), shade(shirt, 0.95))
    p.clipped(sl, jag((76, 270), (84, 312), 4, 6, seed=2) + [(60, 312), (60, 270)], skin, smooth=False)
    claw(p, (140, 272), -8, 26, skin, curl=-16)
    parts.append(p)
    return parts


# ================================================================== 2. SPRINTER: gaunt feral runner with a slit grin

def sprinter():
    skin, skin_d = '#bcc6c3', '#8c9a9a'
    rag, wrap = '#3e3a48', '#d8cfb6'
    parts = []
    hip = (0, 168)
    for role, hx, knee, ankle, layer, sc in ((LEG_B, -10, (-40, 96), (-62, 22), 0, skin_d), (LEG_F, 12, (44, 100), (40, 22), 0.5, skin)):
        p = part('Sprinter_' + role, role, (hx, hip[1]), layer)
        d = S(p, path_limb([(hx, hip[1] + 4), knee, ankle], [16, 11, 9]), sc)
        tc = rag if role == LEG_F else shade(rag, 0.78)
        S(p, path_limb([(hx, hip[1] + 6), lerp((hx, hip[1]), knee, 0.85)], [19, 15]), tc, rim=False)
        ke = lerp((hx, hip[1]), knee, 0.85)
        p.flat([(ke[0] - 17, ke[1] + 8), (ke[0] - 8, ke[1] - 12), (ke[0], ke[1] + 2), (ke[0] + 8, ke[1] - 10), (ke[0] + 17, ke[1] + 6)], tc, smooth=False)
        p.clipped(d, path_limb([lerp(knee, ankle, 0.35), lerp(knee, ankle, 0.75)], [13, 12]), shade(wrap, 0.9 if role == LEG_F else 0.75))
        for t in (0.42, 0.55, 0.68):
            q = lerp(knee, ankle, t)
            p.clipped(d, path_limb([(q[0] - 14, q[1] + 3), (q[0] + 14, q[1] - 3)], [1.5, 1.5]), shade(wrap, 0.6))
        # long bare foot
        S(p, [(ankle[0] - 8, ankle[1] + 10), (ankle[0] + 34, ankle[1] - 6), (ankle[0] + 40, ankle[1] - 18), (ankle[0] - 12, ankle[1] - 18)], sc, rim=False)
        parts.append(p)
    p = part('Sprinter_ArmBack', ARM_B, (-6, 284), 1)
    S(p, path_limb([(-6, 286), (-46, 236), (-62, 186)], [12, 9, 8]), skin_d)
    claw(p, (-62, 184), -110, 24, skin_d, n=4, spread=18)
    parts.append(p)
    b = part('Sprinter_Body', BODY, hip, 2)
    torso = [(-24, 164), (26, 160), (40, 206), (66, 262), (66, 292), (36, 300), (6, 290), (-14, 252), (-26, 208)]
    td = S(b, torso, skin)
    ribs(b, td, (20, 262), 40, 4, 12, skin_d)
    b.clipped(td, path_limb([(-4, 214), (18, 200), (36, 204)], [1, 3, 1]), skin_d)
    b.clipped(td, rect(-60, 140, 70, 184), rag)
    b.clipped(td, rect(-60, 178, 70, 186), '#6a5034')
    b.flat(path_limb([(30, 182), (40, 160), (34, 146)], [3, 3, 2]), '#6a5034')
    parts.append(b)
    h = part('Sprinter_Head', HEAD, (52, 288), 3)
    S(h, path_limb([(46, 284), (66, 306)], [11, 10]), skin_d, rim=False)
    head = [(52, 318), (58, 342), (82, 352), (108, 342), (118, 318), (112, 296), (92, 288), (66, 292)]
    d = S(h, head, skin)
    # ear-to-ear slit grin
    m = h.flat([(62, 314), (88, 306), (116, 312), (110, 298), (86, 290), (66, 300)], INK)
    teeth_row(h, m, 64, 116, 314, 11, 8, seed=7, jaggy=0.5)
    teeth_row(h, m, 66, 112, 292, 9, 7, seed=8, down=False, jaggy=0.5)
    h.clipped(d, path_limb([(60, 316), (64, 300)], [1.5, 2]), skin_d)
    socket_eye(h, (86, 330), 7, '#ff4632', socket='#2a2028', pupil=0.42)
    socket_eye(h, (104, 330), 6, '#ff4632', socket='#2a2028', pupil=0.42)
    h.clipped(d, blobby(86, 340, 30, 6, n=10), skin_d)
    h.flat([(112, 322), (118, 318), (114, 316)], skin_d, smooth=False)
    h.clipped(d, path_limb([(70, 344), (84, 350)], [1, 2.5]), light(skin, 1.08))
    # pinned-back ear
    S(h, [(58, 330), (36, 342), (42, 330), (56, 322)], skin_d, smooth=False, rim=False)
    parts.append(h)
    p = part('Sprinter_ArmFront', ARM_F, (50, 280), 4)
    d = S(p, path_limb([(50, 282), (92, 250), (128, 262)], [12, 9, 8]), skin)
    p.clipped(d, path_limb([(96, 254), (122, 262)], [10, 9]), wrap)
    for t in (0.2, 0.5, 0.8):
        q = lerp((96, 254), (122, 262), t)
        p.clipped(d, path_limb([(q[0] - 3, q[1] + 10), (q[0] + 3, q[1] - 10)], [1.4, 1.4]), shade(wrap, 0.65))
    claw(p, (128, 262), 20, 24, skin, n=4, spread=16, curl=-24)
    parts.append(p)
    return parts


# ================================================================== 3. GUTTER CRAWLER: legless miner dragging itself

def crawler():
    skin, skin_d = '#8f7f8c', '#6c5e6c'
    vest, helm = '#6e5432', '#c9a23a'
    parts = []
    b = part('Crawler_Body', BODY, (-30, 46), 2)
    torso = [(-110, 40), (-60, 20), (10, 16), (60, 30), (84, 64), (60, 104), (0, 116), (-70, 104), (-114, 72)]
    td = S(b, torso, skin)
    b.clipped(td, [(-60, 0), (40, 0), (54, 120), (-40, 130)], vest, smooth=False)
    b.clipped(td, [(-20, 0), (2, 0), (14, 130), (-6, 130)], shade(vest, 0.7), smooth=False)
    for y in (90, 64, 40):
        b.circle(18, y, 3.5, GOLD)
    for i in range(6):
        b.circle(-92 + i * 26, 108 - abs(i - 2.5) * 4, 7, BONE)
    # dragged spine and guts
    b.flat(path_limb([(-112, 54), (-150, 34), (-186, 20)], [13, 8, 4]), '#7c2630')
    b.flat(path_limb([(-112, 48), (-140, 14), (-170, 8)], [8, 6, 3]), '#a03a40')
    for i in range(4):
        b.circle(-128 - i * 14, 46 - i * 6, 4, BONE)
    parts.append(b)
    h = part('Crawler_Head', HEAD, (70, 82), 3)
    S(h, path_limb([(66, 80), (92, 92)], [16, 14]), skin_d, rim=False)
    head = [(84, 104), (92, 132), (124, 140), (150, 128), (158, 100), (150, 74), (124, 62), (96, 70)]
    d = S(h, head, skin)
    m = h.flat([(120, 84), (156, 92), (160, 72), (142, 62), (122, 70)], INK)
    teeth_row(h, m, 124, 158, 90, 9, 5, seed=11)
    teeth_row(h, m, 126, 154, 66, 7, 4, seed=12, down=False)
    socket_eye(h, (128, 106), 8, '#ffd04a', socket='#2a2030')
    socket_eye(h, (148, 106), 7, '#ffd04a', socket='#2a2030')
    # miner's helmet + lamp
    hel = [(84, 118), (92, 150), (124, 160), (156, 146), (166, 120), (176, 114), (80, 112)]
    P(h, hel, helm, rim='#f2d27a')
    h.flat(rect(82, 110, 176, 118), shade(helm, 0.7), smooth=False)
    S(h, ellipse(164, 138, 12, 12, n=14), '#fff2b0', rim=False)
    h.circle(164, 138, 6, '#ffffff')
    parts.append(h)
    for role, sh, layer, col in ((ARM_B, (30, 76), 1, skin_d), (ARM_F, (56, 66), 4, skin)):
        p = part('Crawler_' + role, role, sh, layer)
        el = (sh[0] + 44, sh[1] + 12)
        wr = (sh[0] + 84, 14)
        d = S(p, path_limb([sh, el, wr], [15, 12, 10]), col)
        p.clipped(d, path_limb([(sh[0] - 6, sh[1]), (sh[0] + 24, sh[1] + 8)], [17, 16]), shade(vest, 0.9 if role == ARM_F else 0.75))
        claw(p, wr, -10, 22, col, n=4, spread=18, curl=-26)
        parts.append(p)
    return parts


# ================================================================== 4. BLOATER: swollen ghoul bursting out of a red union suit

def bloater():
    skin = '#c9c06e'
    suit, suit_d = '#a6463a', '#7c3029'
    parts = []
    hip = (0, 86)
    for role, hx, layer, col in ((LEG_B, -54, 0, suit_d), (LEG_F, 50, 0.5, suit)):
        p = part('Bloater_' + role, role, (hx, hip[1]), layer)
        S(p, path_limb([(hx, 96), (hx + 4, 50), (hx + 8, 30)], [30, 26, 22]), col)
        boot(p, (hx + 8, 16), 64, '#3e2e24' if role == LEG_F else '#30241c')
        parts.append(p)
    p = part('Bloater_ArmBack', ARM_B, (-118, 262), 1)
    S(p, path_limb([(-118, 262), (-142, 210), (-140, 168)], [22, 18, 15]), suit_d)
    claw(p, (-140, 166), -84, 24, shade(skin, 0.82))
    parts.append(p)
    b = part('Bloater_Body', BODY, hip, 2)
    belly = blobby(4, 196, 146, 132, top=0.86, bottom=1.0, left=0.96, right=1.06, n=28, jitter=0.03, seed=8)
    bd = S(b, belly, suit)
    # union suit buttons & seam, split open over the belly
    b.clipped(bd, path_limb([(8, 330), (10, 110)], [3, 3]), suit_d)
    for y in (300, 270, 130, 104):
        b.circle(12, y, 5.5, '#efe2c4')
    tear = ragged_oval(14, 200, 92, 62, n=30, depth=0.22, seed=3)
    b.clipped(bd, [(x + 6, y + 4) for (x, y) in ragged_oval(14, 200, 100, 70, n=30, depth=0.22, seed=3)], suit_d, smooth=False)
    b.clipped(bd, tear, skin, smooth=False)
    b.clipped(bd, ragged_oval(30, 186, 78, 44, n=24, depth=0.15, seed=5), shade(skin, 0.88), opacity=0.6)
    for (x, y, r) in ((-30, 224, 16), (40, 210, 22), (80, 182, 12), (-6, 180, 10), (24, 170, 8), (-56, 196, 11)):
        b.clipped(bd, ellipse(x, y, r, r * 0.9, n=14), '#9ccc4a')
        b.clipped(bd, ellipse(x - r * 0.25, y + r * 0.3, r * 0.35, r * 0.3, n=10), '#efffbe')
    b.clipped(bd, path_limb([(-40, 192), (0, 186), (40, 192)], [1.5, 3, 1.5]), shade(skin, 0.6))
    for x in (-110, 120):
        b.clipped(bd, path_limb([(x, 310), (x * 0.8, 250), (x * 0.9, 190)], [1, 3, 1]), suit_d)
    parts.append(b)
    h = part('Bloater_Head', HEAD, (18, 318), 3)
    hd = S(h, blobby(30, 350, 44, 36, top=0.9, bottom=1.15, n=20, seed=9), skin)
    # double chin, little bowler hat
    h.clipped(hd, blobby(34, 320, 40, 12, n=12), shade(skin, 0.82))
    socket_eye(h, (20, 356), 7, '#ff8a2c', socket='#3a3020')
    socket_eye(h, (48, 358), 6, '#ff8a2c', socket='#3a3020')
    m = h.flat(blobby(40, 334, 15, 7, n=12), INK)
    teeth_row(h, m, 28, 52, 338, 5, 4, seed=2)
    h.flat(path_limb([(48, 330), (54, 312), (52, 300)], [3, 2.5, 3.5]), '#cfe86a')
    P(h, [(-10, 378), (70, 380), (66, 386), (-6, 386)], '#2a2228', rim=False)
    S(h, blobby(30, 398, 30, 18, bottom=0.4, n=14), '#332a30', rim='#5a4e56')
    h.flat(rect(0, 384, 60, 390), '#6a2a2a', smooth=False)
    parts.append(h)
    p = part('Bloater_ArmFront', ARM_F, (124, 262), 4)
    S(p, path_limb([(124, 262), (150, 214), (148, 166)], [22, 18, 15]), suit)
    claw(p, (148, 164), -78, 24, skin)
    parts.append(p)
    return parts


# ================================================================== 5. SPITTER: long-necked acid gargler in a poncho

def spitter():
    skin, skin_d = '#7d8c5a', '#5e6b44'
    pon, stripe, stripe2 = '#8c5c3a', '#e2d2a8', '#a83a2c'
    parts = []
    hip = (0, 160)
    for role, hx, foot_x, layer, col in ((LEG_B, -12, -20, 0, '#4a3e36'), (LEG_F, 12, 26, 0.5, '#5a4c42')):
        p = part('Spitter_' + role, role, (hx, hip[1]), layer)
        S(p, path_limb([(hx, 164), (hx + 8, 90), (foot_x, 26)], [15, 12, 11]), col)
        boot(p, (foot_x, 14), 46, '#2e2420')
        parts.append(p)
    p = part('Spitter_ArmBack', ARM_B, (0, 262), 1)
    S(p, path_limb([(0, 262), (-20, 210), (-6, 170)], [11, 9, 8]), skin_d)
    claw(p, (-6, 168), -70, 20, skin_d)
    parts.append(p)
    b = part('Spitter_Body', BODY, hip, 2)
    poncho = [(-56, 168), (70, 162), (60, 214), (44, 262), (20, 282), (-14, 278), (-36, 250)]
    pd = P(b, poncho, pon, rim='#b48256')
    for y, c in ((206, stripe), (196, stripe2), (186, stripe)):
        b.clipped(pd, [(-80, y + 4), (90, y - 4), (90, y - 9), (-80, y - 1)], c, smooth=False)
    for i in range(7):
        x = -50 + i * 18
        b.flat(path_limb([(x, 170 - (i % 2) * 4), (x + 2, 150)], [3.2, 2]), shade(pon, 0.78))
    b.clipped(pd, path_limb([(2, 276), (14, 214)], [2, 2]), shade(pon, 0.7))
    parts.append(b)
    h = part('Spitter_Head', HEAD, (22, 274), 3)
    # long neck with glowing goiter sac
    S(h, path_limb([(20, 270), (40, 318), (54, 352)], [11, 10, 10]), skin_d, rim=False)
    sac = blobby(48, 316, 30, 26, n=18, seed=4)
    sd = S(h, sac, '#8fe04a', rim='#e2ff9a')
    for (x, y, r) in ((40, 322, 5), (56, 310, 4), (50, 330, 3)):
        h.clipped(sd, ellipse(x, y, r, r, n=10), '#e8ffb0')
    head = [(40, 360), (48, 384), (74, 392), (100, 384), (110, 364), (100, 344), (70, 340), (48, 346)]
    d = S(h, head, skin)
    m = h.flat([(84, 352), (112, 350), (110, 340), (88, 340)], INK)
    teeth_row(h, m, 86, 110, 352, 6, 4, seed=5)
    h.flat(path_limb([(104, 344), (110, 322), (106, 300)], [4, 3, 5]), '#b8f04a')
    h.circle(106, 298, 6, '#b8f04a')
    socket_eye(h, (82, 370), 7, '#f0ff60', socket='#26301a')
    socket_eye(h, (100, 370), 6, '#f0ff60', socket='#26301a')
    # battered wide-brim hat
    P(h, [(30, 388), (122, 392), (128, 384), (110, 378), (40, 376), (22, 382)], '#6a5236', rim='#93754e')
    S(h, [(46, 386), (52, 414), (78, 420), (98, 412), (104, 388)], '#76603e', rim='#9c8058')
    h.flat(rect(48, 386, 104, 392), '#3a2a1e', smooth=False)
    parts.append(h)
    p = part('Spitter_ArmFront', ARM_F, (40, 260), 4)
    S(p, path_limb([(40, 262), (70, 226), (98, 230)], [11, 9, 8]), skin)
    S(p, path_limb([(38, 262), (60, 238)], [14, 12]), shade(pon, 0.92), rim=False)
    claw(p, (98, 230), 10, 20, skin, curl=-22)
    parts.append(p)
    return parts


# ================================================================== 6. LEAPER: crouching frog-thing with a bandolier

def leaper():
    skin, skin_d, belly = '#5f8f84', '#456c64', '#c8d4a2'
    parts = []
    for role, sx, layer, col in ((LEG_B, -1, 0, skin_d), (LEG_F, 1, 0.5, skin)):
        hp = (sx * 30 - 10, 104)
        p = part('Leaper_' + role, role, hp, layer)
        knee = (hp[0] + 62, 140)
        ank = (hp[0] - 14, 40)
        S(p, path_limb([hp, knee, ank], [26, 16, 10]), col)
        S(p, path_limb([ank, (ank[0] + 30, 12), (ank[0] + 70, 8)], [10, 8, 5]), col, rim=False)
        for i in range(3):
            tip = (ank[0] + 72 + i * 10, 2 + i * 6)
            p.flat(path_limb([(ank[0] + 60, 8), tip], [5, 2]), col)
            p.circle(tip[0], tip[1], 4, shade(col, 0.8))
        parts.append(p)
    p = part('Leaper_ArmBack', ARM_B, (16, 168), 1)
    S(p, path_limb([(16, 168), (30, 120), (44, 70)], [10, 8, 7]), skin_d)
    claw(p, (44, 68), -70, 18, skin_d, n=4, spread=16, nail='#d8e0c0')
    parts.append(p)
    b = part('Leaper_Body', BODY, (0, 104), 2)
    body = blobby(20, 150, 70, 56, top=0.9, bottom=1.0, left=1.1, right=0.9, n=22, seed=12)
    bd = S(b, body, skin)
    b.clipped(bd, blobby(42, 130, 40, 36, n=16), belly)
    for (x, y, r) in ((-20, 180, 9), (6, 196, 7), (-36, 150, 6), (24, 176, 5)):
        b.clipped(bd, ellipse(x, y, r, r * 0.8, n=10), skin_d)
    # bandolier with shotgun shells
    b.clipped(bd, path_limb([(-40, 190), (40, 120), (80, 110)], [7, 7, 7]), '#5a3e28')
    for i in range(6):
        q = lerp((-30, 182), (56, 116), i / 5)
        b.clipped(bd, rect(q[0] - 4, q[1] - 2, q[0] + 4, q[1] + 12), '#c43a2a')
        b.clipped(bd, rect(q[0] - 4, q[1] - 2, q[0] + 4, q[1] + 2), GOLD)
    parts.append(b)
    h = part('Leaper_Head', HEAD, (52, 184), 3)
    head = [(30, 196), (40, 224), (90, 236), (138, 220), (148, 196), (130, 176), (90, 170), (50, 178)]
    d = S(h, head, skin)
    h.clipped(d, [(60, 180), (150, 182), (150, 160), (60, 160)], belly, smooth=False)
    m = h.flat(path_limb([(66, 190), (110, 188), (146, 196)], [2, 3.5, 2]), INK)
    # bulging eyes on top
    for (x, y, r) in ((74, 232, 17), (108, 236, 15)):
        S(h, ellipse(x, y, r, r * 0.9, n=16), skin, rim=False)
        h.flat(ellipse(x + 2, y + 2, r * 0.74, r * 0.66, n=14), '#f2d84a')
        h.flat(ellipse(x + 3, y + 2, r * 0.16, r * 0.56, n=10), INK)
        h.circle(x - r * 0.25, y + r * 0.3, r * 0.15, '#fffbe6')
    h.circle(140, 206, 2.5, skin_d)
    # tongue lolling
    h.flat(path_limb([(130, 192), (146, 176), (142, 156)], [5, 6, 7]), '#d4606e')
    parts.append(h)
    p = part('Leaper_ArmFront', ARM_F, (60, 160), 4)
    S(p, path_limb([(60, 160), (82, 112), (96, 70)], [11, 9, 7]), skin)
    claw(p, (96, 68), -66, 18, skin, n=4, spread=16, nail='#d8e0c0')
    parts.append(p)
    return parts


# ================================================================== 7. CARRION WISP: buzzard skull on ragged wings, ghost-flame tail

def feather_wing(p, root, sx, span, col, col2, n=8, seed=0, lift=0.35):
    """Ragged bird wing: a bony arm reaching up and out, primaries fanning from the tip, coverts along the arm."""
    rnd = random.Random(seed)
    wrist = (root[0] + sx * span * 0.42, root[1] + span * lift)
    tip = (root[0] + sx * span * 0.98, root[1] + span * (lift * 0.75))
    feathers = []
    # secondaries hang off the inner arm, primaries fan out from the wrist toward the tip
    for i in range(n):
        t = i / (n - 1)
        base = lerp(root, wrist, t * 1.8) if t < 0.55 else lerp(wrist, tip, (t - 0.55) / 0.45)
        ang = math.radians(-95 + t * 75) if sx > 0 else math.radians(-85 - t * 75)
        L = span * (0.32 + 0.38 * t) * rnd.uniform(0.9, 1.05)
        end = (base[0] + math.cos(ang) * L, base[1] + math.sin(ang) * L)
        mid = lerp(base, end, 0.55)
        mid = (mid[0] + sx * L * 0.06, mid[1])
        feathers.append((base, mid, end, L))
    for k, (base, mid, end, L) in enumerate(feathers):
        c = col if k % 2 else col2
        p.shape(path_limb([base, mid, end], [L * 0.11, L * 0.09, L * 0.012], n_end=5), c, rim=False)
        p.flat(path_limb([lerp(base, mid, 0.2), lerp(mid, end, 0.7)], [1.2, 0.6]), shade(c, 0.7))
    # coverts: short rounded feathers along the arm
    for i in range(6):
        q = lerp(root, wrist, 0.1 + i * 0.16) if i < 4 else lerp(wrist, tip, (i - 3) * 0.2)
        p.shape(ellipse(q[0], q[1] - span * 0.05, span * 0.07, span * 0.06, n=10), shade(col, 1.12), rim=False)
    S(p, path_limb([root, wrist, tip], [span * 0.06, span * 0.045, span * 0.02]), shade(col, 1.2), rim=light(col, 1.5))


def wisp():
    parts = []
    for role, sx, layer, col in ((WING_B, -1, 0, '#2e2630'), (WING_F, 1, 1.2, '#463a44')):
        root = (sx * 24, 92)
        p = part('Wisp_' + role, role, root, layer)
        feather_wing(p, root, sx, 200, col, shade(col, 0.8), n=8, seed=3, lift=0.45)
        parts.append(p)
    t = part('Wisp_Tail', TAIL, (-20, 70), 1)
    for i, (r, c) in enumerate(((34, '#4ad0c0'), (24, '#8af0e0'), (12, '#e4fff8'))):
        t.flat([(-10, 70 + r), (-60 - i * 6, 60), (-120 + i * 18, 30), (-170 + i * 30, 70), (-110 + i * 16, 74), (-60, 90 + r * 0.4)], c, opacity=0.9 - i * 0.1)
    parts.append(t)
    b = part('Wisp_Body', BODY, (0, 72), 2)
    S(b, blobby(-6, 70, 30, 34, n=16), '#3a2e38', rim=False)
    # ruff of feathers
    for i in range(9):
        a = math.radians(200 - i * 26)
        b.shape(path_limb([(0, 86), (math.cos(a) * 46, 86 + math.sin(a) * 40)], [12, 3]), '#4e404a' if i % 2 else '#3a2e38', lit=False)
    # buzzard skull with long beak
    sk = [(-22, 108), (-12, 144), (24, 156), (56, 140), (110, 108), (128, 92), (112, 86), (60, 90), (20, 80), (-12, 88)]
    d = S(b, sk, BONE, rim='#fffaf0')
    b.clipped(d, [(52, 96), (112, 92), (110, 86), (52, 86)], BONE_S, smooth=False)
    b.flat(ellipse(20, 118, 17, 16, n=14), INK)
    b.circle(24, 118, 7, '#4af0d0')
    b.circle(26, 121, 2.6, '#ffffff')
    b.flat(ellipse(70, 110, 9, 4, n=8, rot=-0.2), INK)
    for x in (38, 50, 62, 74):
        b.flat([(x, 92), (x + 7, 92), (x + 3.5, 80)], '#f8f0dc', smooth=False)
    parts.append(b)
    return parts


# ================================================================== 8. BRUTE: sack-headed butcher with a cleaver

def brute():
    skin, skin_d = '#b07a64', '#8a5c4a'
    apron, sack = '#6e4a32', '#b8a274'
    parts = []
    hip = (0, 120)
    for role, hx, layer, col in ((LEG_B, -50, 0, '#3e322a'), (LEG_F, 48, 0.5, '#4c3e34')):
        p = part('Brute_' + role, role, (hx, hip[1]), layer)
        S(p, path_limb([(hx, 132), (hx + 4, 70), (hx + 8, 36)], [32, 28, 26]), col)
        boot(p, (hx + 8, 20), 82, '#2a201a')
        parts.append(p)
    p = part('Brute_ArmBack', ARM_B, (-104, 316), 1)
    S(p, path_limb([(-104, 318), (-140, 236), (-126, 152)], [38, 32, 28]), skin_d)
    mitt(p, (-124, 136), 34, skin_d)
    # meat hook
    p.stroke([(-124, 104), (-124, 70), (-110, 52), (-92, 64)], '#8a8e96', 7)
    parts.append(p)
    b = part('Brute_Body', BODY, hip, 2)
    torso = [(-74, 112), (80, 108), (112, 150), (128, 214), (140, 280), (124, 336), (70, 372), (0, 380), (-70, 366), (-118, 330), (-128, 262), (-110, 190), (-96, 140)]
    td = S(b, torso, skin)
    b.clipped(td, blobby(40, 304, 74, 30, n=16), skin_d)  # pec shadow
    b.clipped(td, path_limb([(-30, 300), (20, 280), (60, 290)], [1, 3, 1]), skin_d)
    stitches(b, (-60, 312), (-10, 250), 5, '#3a1e1a', w=3.5, cross=8)
    ap = [(-70, 100), (92, 100), (104, 180), (100, 250), (60, 272), (-40, 274), (-84, 250), (-88, 180)]
    ad = b.clipped(td, ap, apron, smooth=False)
    b.clipped(td, [(x + 12, y - 10) for (x, y) in ap], shade(apron, 0.8), smooth=False, opacity=0.5)
    for (x, y, r) in ((20, 200, 26), (-30, 160, 18), (60, 150, 14), (-10, 240, 12)):
        b.clipped(td, blobby(x, y, r, r * 0.8, n=12, jitter=0.35, seed=int(x + y)), BLOOD, opacity=0.9)
    b.clipped(td, path_limb([(-80, 252), (-60, 320), (-20, 372)], [4, 4, 4]), '#3e2a1e')
    b.clipped(td, path_limb([(98, 252), (90, 320), (60, 368)], [4, 4, 4]), '#3e2a1e')
    parts.append(b)
    h = part('Brute_Head', HEAD, (60, 350), 3)
    hd = S(h, blobby(72, 382, 42, 42, top=1.05, bottom=0.9, n=20, jitter=0.05, seed=33), sack)
    # rope noose tie at the neck, stitched holes for eyes, sewn mouth
    h.flat(path_limb([(34, 352), (72, 346), (112, 354)], [6, 7, 6]), '#7a5a34')
    h.flat(path_limb([(106, 354), (120, 328)], [4, 3]), '#7a5a34')
    for (x, y, r) in ((62, 390, 10), (92, 392, 9)):
        h.flat(blobby(x, y, r, r * 0.8, n=12, jitter=0.15, seed=x), INK)
        h.circle(x + 2, y, 3.2, '#ff3c2c')
        for k in range(5):
            a = math.radians(k * 72 + 20)
            h.stroke([(x + math.cos(a) * r * 0.9, y + math.sin(a) * r * 0.8), (x + math.cos(a) * r * 1.4, y + math.sin(a) * r * 1.25)], '#5a4628', 2.4)
    stitches(h, (62, 368), (102, 368), 5, '#4a3622', w=2.5, cross=6)
    h.clipped(hd, path_limb([(40, 398), (60, 416), (82, 422)], [1, 2.5, 1]), shade(sack, 0.75))
    h.clipped(hd, path_limb([(104, 410), (110, 382)], [1, 2.2]), shade(sack, 0.75))
    parts.append(h)
    p = part('Brute_ArmFront', ARM_F, (110, 316), 4)
    S(p, path_limb([(110, 318), (150, 236), (148, 150)], [38, 32, 28]), skin)
    mitt(p, (148, 134), 34, skin)
    # cleaver
    P(p, [(140, 132), (220, 150), (226, 122), (146, 108)], '#a8adb6', rim='#e8ecf2')
    p.flat([(140, 132), (220, 150), (222, 142), (142, 126)], '#d8dce4', smooth=False)
    p.circle(200, 132, 4, '#5a5e66')
    p.flat(path_limb([(118, 120), (146, 122)], [8, 8]), '#4a2e1c')
    p.flat(blobby(196, 128, 10, 6, n=8, jitter=0.3, seed=4), BLOOD)
    parts.append(p)
    return parts


# ================================================================== 9. SCREAMER: banshee widow in mourning black

def screamer():
    dress, dress_l = '#2c2832', '#433d4c'
    skin = '#d6d0ca'
    parts = []
    for role, hx, layer in ((LEG_B, -12, 0), (LEG_F, 14, 0.5)):
        p = part('Screamer_' + role, role, (hx, 70), layer)
        S(p, path_limb([(hx, 74), (hx + 4, 30)], [10, 8]), '#1e1a22')
        boot(p, (hx + 6, 14), 40, '#18141a', h=22)
        parts.append(p)
    p = part('Screamer_ArmBack', ARM_B, (-8, 300), 1)
    S(p, path_limb([(-8, 300), (-34, 344), (-30, 396)], [11, 9, 8]), shade(dress_l, 0.8))
    claw(p, (-30, 398), 96, 22, '#b8b2ae', n=4, spread=18)
    parts.append(p)
    b = part('Screamer_Body', BODY, (0, 70), 2)
    skirt = [(-72, 30), (-40, 16), (20, 12), (80, 24), (64, 90), (40, 180), (36, 250), (46, 300), (30, 318), (-20, 316), (-36, 290), (-28, 250), (-34, 180)]
    sd = S(b, skirt, dress, rim=dress_l)
    for x in (-40, -10, 20, 50):
        b.clipped(sd, path_limb([(x * 0.6, 200), (x, 20)], [1, 4]), shade(dress, 0.65))
    b.clipped(sd, jag((-90, 30), (90, 30), 10, 10, seed=7, side=-1) + [(90, 0), (-90, 0)], '#18141a', smooth=False)
    # lace collar & cameo
    b.flat([(-24, 320), (10, 330), (44, 320), (36, 300), (8, 310), (-16, 300)], '#e6dccc')
    for i in range(6):
        b.circle(-18 + i * 11, 300 + (i % 2) * 4, 4, '#e6dccc')
    b.shape(ellipse(10, 286, 8, 10, n=12), GOLD, lit=False)
    b.flat(ellipse(10, 286, 5, 7, n=10), '#a8424a')
    parts.append(b)
    h = part('Screamer_Head', HEAD, (10, 320), 3)
    # streaming white hair: separate wavy locks
    for i, (dy, L, w, c) in enumerate(((20, 150, 11, '#bcbac4'), (6, 170, 12, '#d8d6dc'), (-8, 140, 10, '#efeef2'), (-22, 120, 9, '#cfcdd6'), (32, 110, 8, '#a8a6b2'))):
        pts = []
        for k in range(6):
            t = k / 5
            pts.append((4 - L * t, 380 + dy - 40 * t * t + math.sin(t * 7 + i) * 9 * t))
        h.shape(path_limb(pts, [w, w * 1.1, w * 0.9, w * 0.7, w * 0.45, 1.2], n_end=5), c, lit=False)
    face = [(-4, 350), (0, 384), (24, 398), (50, 390), (58, 362), (54, 330), (36, 316), (12, 322)]
    d = S(h, face, skin)
    h.clipped(d, blobby(30, 358, 30, 10, n=12), shade(skin, 0.8))
    for (x, y, r) in ((22, 368, 9), (46, 368, 8)):
        h.flat(blobby(x, y, r, r * 1.3, n=12, seed=x), INK)
        h.circle(x + 1, y - 2, 2.2, '#ffffff')
    m = h.flat(blobby(36, 336, 12, 22, top=0.9, bottom=1.1, n=16), INK)
    h.clipped(m, ellipse(36, 326, 7, 8, n=10), '#7a2032')
    # widow's veil
    veil = [(-12, 386), (8, 410), (40, 412), (62, 396), (68, 360), (60, 380), (40, 400), (10, 396)]
    h.shape(veil, '#18141c', lit=False)
    h.flat([(-14, 388), (-40, 330), (-30, 300), (-6, 340)], '#18141c', opacity=0.8)
    # scream rings
    for r in (90, 112):
        h.stroke([(36 + r * 0.82, 366), (36 + r, 340), (36 + r * 0.82, 314)], '#f4eee4', 5, opacity=0.75)
    parts.append(h)
    p = part('Screamer_ArmFront', ARM_F, (30, 298), 4)
    S(p, path_limb([(30, 300), (70, 334), (84, 384)], [11, 9, 8]), dress_l)
    claw(p, (84, 386), 80, 22, '#cfc9c4', n=4, spread=20)
    parts.append(p)
    return parts


# ================================================================== 10. BURROWER: armour-banded digging beast

def burrower():
    skin, plate, plate_d = '#b08a64', '#7a5a3e', '#5e4430'
    parts = []
    b = part('Burrower_Body', BODY, (0, 44), 2)
    shell = blobby(-6, 92, 124, 72, top=1.0, bottom=0.6, left=1.0, right=0.95, n=26, seed=41)
    sd = S(b, shell, plate, rim='#a8825c')
    b.clipped(sd, rect(-160, 0, 160, 56), skin)
    for i in range(6):
        x = -100 + i * 38
        b.clipped(sd, path_limb([(x, 170), (x + 6, 60)], [3, 3]), plate_d)
        sp = [(x + 4, 152 - abs(i - 2.5) * 6), (x + 22, 152 - abs(i - 2.5) * 6), (x + 14, 196 - abs(i - 2.5) * 10)]
        b.shape(sp, '#ead8b0', smooth=False, rim=False)
    parts.append(b)
    t = part('Burrower_Tail', TAIL, (-118, 76), 1)
    S(t, path_limb([(-118, 76), (-160, 58), (-206, 30)], [20, 13, 4]), plate_d)
    for i in range(3):
        q = lerp((-130, 72), (-196, 34), i / 3)
        t.flat(path_limb([(q[0], q[1] + 12), (q[0], q[1] - 12)], [2, 2]), plate)
    parts.append(t)
    h = part('Burrower_Head', HEAD, (96, 88), 3)
    hd = S(h, [(88, 112), (110, 134), (150, 132), (196, 110), (214, 92), (200, 70), (150, 60), (100, 66)], skin)
    h.clipped(hd, [(96, 140), (150, 140), (190, 116), (150, 112), (110, 120)], plate, smooth=False)
    # star nose
    for i in range(8):
        a = math.radians(i * 45)
        h.flat(path_limb([(212, 92), (212 + math.cos(a) * 16, 92 + math.sin(a) * 16)], [5, 3]), '#e8909a')
    h.circle(212, 92, 7, '#f4b0b8')
    socket_eye(h, (156, 100), 5, '#ffd23c', socket='#2a2018', squint=0.4)
    m = h.flat([(150, 72), (200, 80), (196, 68), (160, 62)], INK)
    teeth_row(h, m, 158, 196, 78, 6, 5, seed=1)
    parts.append(h)
    for role, sh, layer, col in ((ARM_B, (52, 66), 1, shade(skin, 0.82)), (ARM_F, (82, 56), 4, skin)):
        p = part('Burrower_' + role, role, sh, layer)
        wr = (sh[0] + 44, 14)
        S(p, path_limb([sh, wr], [22, 18]), col)
        for i in range(3):
            a = math.radians(-40 + i * 24)
            tip = (wr[0] + math.cos(a) * 50, wr[1] + math.sin(a) * 50 + 6)
            p.shape(path_limb([wr, lerp(wr, tip, 0.6), tip], [9, 7, 1.5]), '#efe2c4', lit=False)
        parts.append(p)
    return parts


# ================================================================== 11. GILDED GHOUL: bow-legged bandit with a loot sack

def gilded():
    skin, skin_d = '#cfae52', '#a68836'
    coat, mask = '#5a3e2c', '#b8342a'
    parts = []
    hip = (0, 130)
    for role, hx, foot_x, layer, col in ((LEG_B, -14, -34, 0, '#3e2e26'), (LEG_F, 14, 36, 0.5, '#4e3a30')):
        p = part('Gilded_' + role, role, (hx, hip[1]), layer)
        knee = (hx + (foot_x - hx) * 1.3, 74)
        S(p, path_limb([(hx, 134), knee, (foot_x, 24)], [15, 12, 11]), col)
        boot(p, (foot_x, 14), 44, '#2a1e18')
        parts.append(p)
    # loot sack slung over the back shoulder (prop)
    s = part('Gilded_Sack', PROP, (-20, 250), 1.5)
    sk = blobby(-64, 236, 56, 62, top=0.8, bottom=1.1, n=22, seed=2)
    skd = S(s, sk, '#9a7444', rim='#c9a26a')
    s.clipped(skd, path_limb([(-110, 260), (-60, 230), (-20, 250)], [2, 3, 2]), '#6e522c')
    s.flat(path_limb([(-40, 290), (-10, 270)], [9, 9]), '#6e4f2c')
    for (dx, dy) in ((-62, 300), (-44, 298), (-76, 290), (-54, 312)):
        s.shape(ellipse(dx, dy, 10, 8, n=12), GOLD, rim='#fff1a6')
    S(s, [(-80, 228), (-52, 230), (-54, 256), (-82, 254)], '#d8be5a', smooth=False, rim=False)
    s.flat([(-74, 248), (-60, 248), (-66, 236)], '#5a3a1c', smooth=False)
    parts.append(s)
    p = part('Gilded_ArmBack', ARM_B, (-10, 238), 1)
    S(p, path_limb([(-10, 238), (-30, 264), (-30, 294)], [12, 10, 9]), shade(coat, 0.8))
    claw(p, (-30, 296), 80, 18, skin_d)
    parts.append(p)
    b = part('Gilded_Body', BODY, hip, 2)
    torso = [(-30, 126), (34, 124), (44, 170), (50, 228), (34, 252), (0, 256), (-28, 240), (-36, 180)]
    td = S(b, torso, coat, rim='#7a5a44')
    b.clipped(td, [(4, 260), (20, 260), (30, 124), (14, 124)], '#d8c8a0', smooth=False)
    b.clipped(td, [(10, 250), (24, 250), (18, 190)], mask, smooth=False)
    b.clipped(td, rect(-60, 140, 70, 152), '#2a1c14')
    b.circle(20, 146, 6, GOLD)
    for i in range(3):
        b.circle(36 + i * 4, 170 + i * 18, 3, GOLD)
    parts.append(b)
    h = part('Gilded_Head', HEAD, (20, 250), 3)
    head = [(4, 268), (8, 300), (36, 312), (60, 304), (66, 280), (60, 258), (34, 250), (12, 254)]
    d = S(h, head, skin, rim='#fff0a0')
    # hooked nose over the bandana
    S(h, [(56, 290), (80, 280), (82, 270), (66, 268), (58, 278)], skin, rim=False)
    bd = h.clipped(d, [(-10, 286), (90, 278), (90, 240), (-10, 240)], mask, smooth=False)
    h.flat([(4, 270), (-16, 256), (-20, 236), (2, 254)], mask, smooth=False)
    for (x, y) in ((24, 266), (44, 262), (14, 256)):
        h.circle(x, y, 2.5, '#efd8c8', opacity=0.8)
    socket_eye(h, (38, 294), 6, '#fff07a', socket='#2a2010', pupil=0.45)
    socket_eye(h, (56, 294), 5, '#fff07a', socket='#2a2010', pupil=0.45)
    # bowler hat
    P(h, [(-4, 306), (78, 310), (84, 304), (-8, 300)], '#2a2228', rim=False)
    S(h, blobby(36, 324, 32, 20, bottom=0.35, n=16), '#34292e', rim='#5e5058')
    parts.append(h)
    p = part('Gilded_ArmFront', ARM_F, (34, 236), 4)
    S(p, path_limb([(34, 236), (64, 200), (88, 198)], [12, 10, 9]), coat, rim='#7a5a44')
    claw(p, (88, 198), 10, 18, skin, curl=-28)
    p.shape(ellipse(108, 202, 9, 9, n=12), GOLD, rim='#fff1a6')
    parts.append(p)
    return parts


# ================================================================== 12. RIOT GHOUL: dead deputy behind a riveted mine-cart plate

def riot():
    skin = '#8a957a'
    coat, coat_d = '#6a5a48', '#4e4236'
    parts = []
    hip = (0, 172)
    for role, hx, foot_x, layer, col in ((LEG_B, -18, -24, 0, '#3a3430'), (LEG_F, 18, 30, 0.5, '#46403a')):
        p = part('Riot_' + role, role, (hx, hip[1]), layer)
        S(p, path_limb([(hx, 176), (hx + 4, 100), (foot_x, 30)], [20, 17, 16]), col)
        boot(p, (foot_x, 16), 58, '#2a221c')
        parts.append(p)
    p = part('Riot_ArmBack', ARM_B, (-14, 300), 1)
    S(p, path_limb([(-14, 300), (-24, 240), (-10, 190)], [17, 15, 13]), coat_d)
    mitt(p, (-8, 176), 18, shade(skin, 0.8))
    parts.append(p)
    b = part('Riot_Body', BODY, hip, 2)
    torso = [(-46, 100), (60, 100), (58, 180), (66, 270), (52, 320), (0, 330), (-40, 316), (-52, 250), (-56, 170)]
    td = S(b, torso, coat, rim='#8a7860')
    b.clipped(td, [(0, 330), (24, 330), (30, 96), (8, 96)], shade(coat, 0.7), smooth=False)
    b.clipped(td, [(-20, 330), (40, 330), (20, 290)], '#c9b896', smooth=False)
    # tin star
    star = [(30 + math.cos(math.radians(90 + i * 36)) * (12 if i % 2 == 0 else 5), 268 + math.sin(math.radians(90 + i * 36)) * (12 if i % 2 == 0 else 5)) for i in range(10)]
    b.shape(star, '#d8dce4', smooth=False, rim='#ffffff')
    b.clipped(td, rect(-70, 176, 80, 190), '#2a1e16')
    b.circle(10, 183, 6, '#c8c8cc')
    folds(b, td, [[(-30, 300), (-36, 240), (-30, 190)], [(44, 160), (40, 120)]], shade(coat, 0.75), 3)
    parts.append(b)
    h = part('Riot_Head', HEAD, (20, 326), 3)
    head = [(4, 346), (10, 374), (36, 384), (62, 374), (68, 350), (60, 328), (36, 322), (12, 328)]
    d = S(h, head, skin)
    # half the face rotted to bone
    h.clipped(d, [(40, 400), (90, 400), (90, 310), (44, 310), (36, 340)], BONE, smooth=False)
    m = h.flat([(30, 336), (66, 334), (66, 326), (32, 328)], INK, smooth=False)
    teeth_row(h, m, 44, 66, 336, 6, 5, seed=9, jaggy=0.1)
    socket_eye(h, (30, 356), 7, '#ff5a3c', socket='#2e2a24')
    socket_eye(h, (54, 356), 8, '#ff5a3c', socket=INK, pupil=0.4)
    # stetson
    P(h, [(-24, 372), (96, 376), (104, 386), (84, 382), (-16, 380), (-30, 384)], '#5e4a36', rim='#8a7052')
    S(h, [(6, 380), (12, 410), (36, 416), (64, 410), (72, 382)], '#6a5440', rim='#937a5c')
    h.flat([(8, 380), (70, 382), (70, 388), (8, 386)], '#2e2218', smooth=False)
    parts.append(h)
    p = part('Riot_ArmFront', ARM_F, (44, 300), 4)
    S(p, path_limb([(44, 300), (70, 250), (92, 214)], [17, 15, 13]), coat, rim='#8a7860')
    # riveted mine-cart plate shield
    x0, y0 = 70, 70
    plate = [(x0, y0), (x0 + 104, y0 - 6), (x0 + 112, y0 + 250), (x0 + 6, y0 + 258)]
    pd = P(p, plate, '#5a5f68', rim='#9aa0aa')
    for i in range(1, 4):
        y = y0 + i * 64
        p.clipped(pd, [(x0 - 10, y), (x0 + 130, y - 4), (x0 + 130, y - 9), (x0 - 10, y - 5)], '#3e424a', smooth=False)
    for (rx, ry) in ((x0 + 12, y0 + 12), (x0 + 96, y0 + 8), (x0 + 16, y0 + 244), (x0 + 100, y0 + 238), (x0 + 56, y0 + 128)):
        p.circle(rx, ry, 5, '#c8ccd4')
        p.circle(rx + 1, ry - 1, 2.2, '#6a6e76')
    p.clipped(pd, blobby(x0 + 60, y0 + 170, 30, 22, n=12, jitter=0.4, seed=3), '#8a4a2a', opacity=0.7)
    p.clipped(pd, blobby(x0 + 30, y0 + 60, 16, 12, n=12, jitter=0.4, seed=5), '#8a4a2a', opacity=0.6)
    for (a, bb) in (((x0 + 40, y0 + 210), (x0 + 52, y0 + 196)), ((x0 + 76, y0 + 100), (x0 + 88, y0 + 90))):
        p.stroke([a, bb], '#e8e0c8', 3)
    parts.append(p)
    return parts


# ================================================================== 13. HEX PRIEST: undead preacher with a hex lantern

def priest():
    coat, coat_l = '#2a2232', '#463a52'
    skin = '#a8a096'
    parts = []
    hip = (0, 120)
    for role, hx, layer in ((LEG_B, -14, 0), (LEG_F, 16, 0.5)):
        p = part('Priest_' + role, role, (hx, hip[1]), layer)
        S(p, path_limb([(hx, 124), (hx + 4, 40)], [14, 12]), '#1e1a22')
        boot(p, (hx + 8, 16), 50, '#141016')
        parts.append(p)
    p = part('Priest_ArmBack', ARM_B, (-12, 300), 1)
    S(p, path_limb([(-12, 300), (-26, 240), (-8, 196)], [14, 12, 11]), shade(coat_l, 0.8))
    # bible
    P(p, [(-24, 214), (12, 220), (16, 180), (-20, 174)], '#3a2418', rim='#5a3a28')
    p.flat(rect(-10, 196, -2, 206), GOLD, smooth=False)
    p.flat(rect(-14, 199, 2, 203), GOLD, smooth=False)
    parts.append(p)
    b = part('Priest_Body', BODY, hip, 2)
    frock = [(-56, 30), (62, 26), (54, 120), (50, 220), (56, 300), (40, 322), (-20, 320), (-40, 290), (-42, 200), (-46, 110)]
    fd = S(b, frock, coat, rim=coat_l)
    b.clipped(fd, [(0, 330), (16, 330), (24, 20), (8, 20)], shade(coat, 0.6), smooth=False)
    for y in (290, 260, 230, 200):
        b.circle(26, y, 3.5, '#8a7a9a')
    b.clipped(fd, rect(-80, 0, 90, 36), '#1a1420')
    b.clipped(fd, jag((-70, 36), (80, 36), 8, 8, seed=2, side=1) + [(80, 0), (-70, 0)], '#1a1420', smooth=False)
    b.flat([(4, 330), (36, 330), (34, 320), (6, 320)], '#f0eadc', smooth=False)
    parts.append(b)
    h = part('Priest_Head', HEAD, (20, 324), 3)
    face = [(2, 344), (6, 372), (30, 384), (54, 376), (62, 352), (56, 330), (34, 322), (10, 328)]
    d = S(h, face, skin)
    h.clipped(d, blobby(40, 342, 26, 14, n=12), shade(skin, 0.75))
    for (x, y) in ((24, 356), (48, 356)):
        h.flat(blobby(x, y, 8, 7, n=12, seed=x), INK)
        h.circle(x + 1, y, 3.5, '#c070ff')
    h.flat([(36, 350), (40, 342), (32, 342)], INK, smooth=False)
    m = h.flat(rect(26, 330, 54, 336), INK, smooth=False)
    for i in range(5):
        h.flat(rect(27 + i * 5.5, 330, 30 + i * 5.5, 336), BONE, smooth=False)
    # flat-crowned preacher hat
    P(h, [(-36, 376), (102, 380), (108, 388), (-40, 384)], '#18141c', rim='#3a3242')
    P(h, [(-2, 384), (66, 386), (62, 412), (2, 410)], '#1e1a24', rim='#3e3648')
    h.flat(rect(0, 386, 64, 392), '#4a2e5e', smooth=False)
    parts.append(h)
    p = part('Priest_ArmFront', ARM_F, (40, 300), 4)
    S(p, path_limb([(40, 300), (70, 250), (92, 236)], [14, 12, 11]), coat_l)
    mitt(p, (98, 234), 11, skin, knuckles=False)
    # staff with hanging hex lantern
    p.flat(path_limb([(96, 100), (100, 420)], [5, 5]), '#4a3220')
    p.stroke([(100, 414), (128, 424), (140, 404)], '#4a3220', 6)
    p.stroke([(140, 404), (140, 384)], '#8a8e96', 2.5)
    P(p, [(126, 384), (154, 384), (150, 344), (130, 344)], '#2e2a30', rim=False)
    p.flat(rect(130, 350, 150, 380), '#c070ff')
    p.flat(rect(134, 354, 146, 376), '#f0d8ff')
    p.flat([(124, 384), (156, 384), (140, 394)], '#2e2a30', smooth=False)
    parts.append(p)
    return parts


# ================================================================== BOSS 1. BIG TONY: the pit boss in a pinstripe suit

def big_tony():
    skin, skin_d = '#c08e72', '#9a6e56'
    suit, stripe = '#2e2c3a', '#4a4860'
    parts = []
    hip = (0, 120)
    for role, hx, layer, col in ((LEG_B, -40, 0, shade(suit, 0.85)), (LEG_F, 40, 0.5, suit)):
        p = part('BigTony_' + role, role, (hx, hip[1]), layer)
        d = S(p, path_limb([(hx, 128), (hx + 4, 50), (hx + 6, 30)], [28, 24, 22]), col)
        p.clipped(d, path_limb([(hx, 130), (hx + 4, 20)], [1.4, 1.4]), stripe)
        boot(p, (hx + 6, 18), 66, '#141216', sole='#0a0a0c')
        p.flat(rect(hx - 20, 30, hx + 30, 34), '#e8e4dc', smooth=False)
        parts.append(p)
    p = part('BigTony_ArmBack', ARM_B, (-96, 290), 1)
    d = S(p, path_limb([(-96, 290), (-124, 214), (-116, 150)], [28, 24, 22]), shade(suit, 0.85))
    p.flat(rect(-136, 150, -96, 162), '#e8e4dc', smooth=False)
    mitt(p, (-116, 132), 24, skin_d)
    parts.append(p)
    b = part('BigTony_Body', BODY, hip, 2)
    torso = blobby(6, 220, 110, 112, top=0.92, bottom=1.0, left=0.96, right=1.08, n=28, seed=51)
    td = S(b, torso, suit, rim='#56546a')
    for x in range(-110, 140, 22):
        b.clipped(td, path_limb([(x + 8, 340), (x, 100)], [1.3, 1.3]), stripe)
    # shirt, tie, lapels, gold chain, pocket square
    b.clipped(td, [(-14, 340), (46, 340), (34, 180), (8, 180)], '#ece8de', smooth=False)
    b.clipped(td, [(10, 330), (30, 330), (34, 210), (20, 196), (6, 210)], '#a01c2a', smooth=False)
    b.clipped(td, [(-30, 340), (-8, 340), (10, 190), (-20, 240)], shade(suit, 0.7), smooth=False)
    b.clipped(td, [(46, 340), (70, 340), (60, 240), (34, 190)], shade(suit, 0.7), smooth=False)
    b.stroke([(-70, 280), (-20, 230), (24, 220), (70, 230), (110, 270)], GOLD, 6)
    b.shape(ellipse(24, 216, 12, 12, n=14), GOLD, rim='#fff0a8')
    b.flat(ellipse(24, 216, 5, 5, n=8), '#a01c2a')
    b.flat([(-80, 272), (-54, 276), (-60, 290), (-74, 292)], '#a01c2a', smooth=False)
    b.clipped(td, rect(-140, 128, 160, 140), '#141216')
    b.flat(rect(14, 126, 36, 142), GOLD, smooth=False)
    parts.append(b)
    h = part('BigTony_Head', HEAD, (20, 324), 3)
    # big jowly head with stubble, heavy brow, cigar
    face = [(-14, 340), (-10, 372), (14, 394), (52, 396), (82, 380), (90, 352), (80, 324), (48, 308), (10, 314)]
    d = S(h, face, skin)
    h.clipped(d, blobby(40, 322, 54, 22, n=16), '#7e6a62', opacity=0.6)  # stubble
    h.clipped(d, blobby(76, 330, 20, 16, n=12), skin_d)
    h.clipped(d, path_limb([(14, 372), (46, 380), (80, 370)], [5, 7, 5]), '#3a2a24')  # brow
    for (x, y, r) in ((30, 362, 6), (64, 362, 5)):
        h.flat(blobby(x, y, r * 1.4, r, n=12), INK)
        h.circle(x + 1, y, r * 0.5, '#ffb02c')
    S(h, [(52, 360), (70, 352), (72, 338), (54, 336)], skin, rim=False)
    h.flat(path_limb([(40, 328), (70, 326)], [2, 2]), '#5a3428')
    h.flat(path_limb([(66, 330), (124, 336)], [5, 6]), '#6a4228')
    h.flat(rect(116, 330, 126, 342), '#3a2618', smooth=False)
    h.circle(127, 336, 6, '#ff7a2a')
    h.circle(128, 336, 3, '#fff0a0')
    # fedora with red band
    P(h, [(-46, 384), (118, 390), (108, 402), (-36, 398)], '#1e1c24', rim='#3a3842')
    S(h, [(-8, 398), (0, 436), (36, 448), (74, 440), (86, 400)], '#26242c', rim='#4a4856')
    h.flat([(-6, 400), (86, 402), (84, 414), (-4, 412)], '#a01c2a', smooth=False)
    h.flat([(30, 446), (42, 446), (40, 432), (32, 432)], '#16141a', smooth=False)
    parts.append(h)
    p = part('BigTony_ArmFront', ARM_F, (104, 290), 4)
    S(p, path_limb([(104, 290), (138, 214), (132, 150)], [28, 24, 22]), suit, rim='#56546a')
    p.flat(rect(112, 150, 152, 162), '#e8e4dc', smooth=False)
    mitt(p, (132, 132), 24, skin)
    for i in range(2):
        p.flat(rect(144 + i * 2, 120 + i * 14, 156 + i * 2, 128 + i * 14), GOLD, smooth=False)
    parts.append(p)
    return parts


# ================================================================== BOSS 2. THE ABOMINATION: stitched multi-headed flesh golem

def abomination():
    patches = ['#c4917a', '#9a6e66', '#b8a07c', '#8a7a8e', '#c8a898']
    parts = []
    hip = (0, 130)
    # mismatched legs: one meaty, one iron peg
    p = part('Abomination_LegBack', LEG_B, (-50, hip[1]), 0)
    S(p, path_limb([(-50, 136), (-56, 70), (-54, 34)], [34, 28, 26]), shade(patches[1], 0.85))
    boot(p, (-54, 20), 80, '#2a201a')
    parts.append(p)
    p = part('Abomination_LegFront', LEG_F, (50, hip[1]), 0.5)
    S(p, path_limb([(50, 136), (54, 90)], [36, 30]), patches[0])
    P(p, [(40, 96), (68, 96), (60, 10), (48, 10)], '#5a5e66', rim='#9aa0aa')
    p.flat(rect(34, 86, 74, 98), '#3a3e46', smooth=False)
    stitches(p, (30, 110), (72, 118), 4, '#3a1e1a', w=3)
    parts.append(p)
    # back arm: long thin with a hooked chain
    p = part('Abomination_ArmBack', ARM_B, (-110, 330), 1)
    S(p, path_limb([(-110, 330), (-160, 250), (-150, 150)], [26, 20, 16]), patches[3])
    claw(p, (-150, 146), -84, 30, shade(patches[3], 0.85), n=4)
    for i in range(6):
        p.stroke([(-150 + (i % 2) * 6, 140 - i * 16), (-150 + (i % 2) * 6, 128 - i * 16)], '#6a6e76', 5)
    parts.append(p)
    b = part('Abomination_Body', BODY, hip, 2)
    torso = [(-96, 120), (100, 120), (140, 200), (150, 300), (120, 360), (40, 386), (-60, 380), (-130, 340), (-140, 240), (-120, 170)]
    td = S(b, torso, patches[0])
    # patchwork skin
    regions = [[(-140, 400), (-20, 400), (-40, 250), (-150, 230)], [(30, 250), (160, 260), (160, 120), (40, 110)],
               [(-150, 230), (-40, 250), (-10, 120), (-150, 110)], [(-20, 400), (160, 400), (160, 260), (30, 250), (-40, 250)]]
    for i, reg in enumerate(regions):
        b.clipped(td, reg, patches[(i + 1) % len(patches)], smooth=False)
    stitches(b, (-150, 232), (-40, 250), 6, '#3a1e1a', w=3.5, cross=9)
    stitches(b, (-40, 250), (30, 250), 4, '#3a1e1a', w=3.5, cross=9)
    stitches(b, (30, 250), (40, 112), 7, '#3a1e1a', w=3.5, cross=9)
    stitches(b, (-40, 250), (-10, 120), 6, '#3a1e1a', w=3.5, cross=9)
    # iron bands and a padlock
    b.clipped(td, path_limb([(-150, 300), (0, 260), (160, 240)], [8, 8, 8]), '#4a4e56')
    for x in (-110, -50, 10, 70, 130):
        b.circle(x, 300 - (x + 150) * 0.2, 4, '#9aa0aa')
    P(b, [(-10, 230), (24, 230), (24, 196), (-10, 196)], '#c8a040', rim='#fff0a0')
    b.stroke([(-4, 230), (-2, 250), (16, 250), (18, 230)], '#9aa0aa', 5)
    # a second head sprouting from the shoulder
    sh = blobby(-90, 380, 34, 30, n=16, seed=5)
    shd = S(b, sh, patches[2])
    socket_eye(b, (-80, 386), 6, '#ff5a3c')
    socket_eye(b, (-102, 386), 5, '#ff5a3c')
    m = b.flat(blobby(-90, 366, 12, 6, n=10), INK)
    stitches(b, (-120, 396), (-70, 408), 3, '#3a1e1a', w=2.5, cross=5)
    parts.append(b)
    h = part('Abomination_Head', HEAD, (40, 380), 3)
    # main head: bald, one huge eye, stitched jaw, a pig head grafted beside it
    pig = blobby(104, 404, 34, 28, n=16, seed=7)
    pd = S(h, pig, '#e0a4a0', rim='#ffd0cc')
    h.shape(ellipse(132, 398, 12, 10, n=12), '#c88482', rim=False)
    h.circle(128, 398, 3, INK)
    h.circle(137, 398, 3, INK)
    h.circle(108, 414, 4, INK)
    h.flat([(90, 430), (100, 448), (110, 428)], '#c88482', smooth=False)
    main = [(10, 396), (14, 430), (42, 448), (74, 440), (86, 410), (80, 384), (52, 370), (24, 376)]
    d = S(h, main, patches[4])
    h.flat(ellipse(50, 416, 16, 16, n=16), INK)
    h.flat(ellipse(52, 416, 12, 12, n=16), '#f6e8c8')
    h.circle(56, 416, 6, '#d02c2c')
    h.circle(57, 416, 2.6, INK)
    m = h.flat([(30, 392), (82, 392), (78, 380), (36, 380)], INK, smooth=False)
    teeth_row(h, m, 34, 80, 392, 7, 7, seed=4)
    stitches(h, (14, 424), (40, 446), 3, '#3a1e1a', w=2.5, cross=5)
    stitches(h, (24, 384), (80, 386), 6, '#3a1e1a', w=2, cross=4)
    parts.append(h)
    p = part('Abomination_ArmFront', ARM_F, (120, 330), 4)
    S(p, path_limb([(120, 330), (176, 250), (172, 160)], [44, 38, 34]), patches[1])
    stitches(p, (140, 300), (176, 240), 4, '#3a1e1a', w=3.5, cross=8)
    # fused buzz-saw
    for i in range(12):
        a = math.radians(i * 30)
        tip = (180 + math.cos(a) * 62, 120 + math.sin(a) * 62)
        p.flat([(180 + math.cos(a - 0.2) * 48, 120 + math.sin(a - 0.2) * 48), tip, (180 + math.cos(a + 0.18) * 48, 120 + math.sin(a + 0.18) * 48)], '#c8ccd4', smooth=False)
    S(p, ellipse(180, 120, 50, 50, n=24), '#a8adb6', rim='#eef0f4')
    p.circle(180, 120, 14, '#5a5e66')
    p.flat(blobby(196, 140, 14, 10, n=10, jitter=0.3, seed=3), BLOOD)
    parts.append(p)
    return parts


# ================================================================== BOSS 3. MOTHER CARRION: vulture queen with a glowing egg sac

def mother_carrion():
    feather, feather_d = '#3a2e34', '#2a2026'
    parts = []
    for role, sx, layer, col in ((WING_B, -1, 0, feather_d), (WING_F, 1, 1.2, '#4a3c44')):
        root = (sx * 30, 260)
        p = part('Carrion_' + role, role, root, layer)
        feather_wing(p, root, sx, 330, col, shade(col, 0.8), n=10, seed=11, lift=0.4)
        parts.append(p)
    for role, hx, layer in ((LEG_B, -26, 0), (LEG_F, 30, 0.5)):
        p = part('Carrion_' + role, role, (hx, 120), layer)
        S(p, path_limb([(hx, 124), (hx + 10, 60), (hx + 4, 20)], [14, 9, 8]), '#c4a68a')
        for i in range(3):
            a = math.radians(-30 + i * 30)
            tip = (hx + 4 + math.cos(a) * 40, 14 + math.sin(a) * 12)
            p.flat(path_limb([(hx + 4, 18), tip], [6, 3]), '#c4a68a')
            p.flat(path_limb([tip, (tip[0] + 10, tip[1] - 8)], [3, 0.5]), INK)
        parts.append(p)
    b = part('Carrion_Body', BODY, (0, 120), 2)
    body = blobby(0, 230, 92, 120, top=0.9, bottom=1.0, n=24, seed=61)
    bd = S(b, body, feather, rim='#5a4a54')
    for i in range(14):
        x = -80 + (i % 7) * 26
        y = 300 - (i // 7) * 60
        b.clipped(bd, [(x - 14, y), (x + 14, y), (x, y - 30)], feather_d, smooth=False)
    # egg sac belly
    sac = blobby(10, 160, 60, 66, n=20, seed=62)
    sd = S(b, sac, '#5a2a3a', rim='#8a4a5a')
    for (x, y, r) in ((-14, 176, 18), (26, 150, 20), (6, 116, 14), (36, 196, 12), (-26, 136, 11)):
        b.clipped(sd, ellipse(x, y, r, r * 0.9, n=14), '#ff6a5a')
        b.clipped(sd, ellipse(x - r * 0.3, y + r * 0.3, r * 0.4, r * 0.3, n=10), '#ffd8c8')
    # feather ruff
    for i in range(11):
        a = math.radians(170 - i * 16)
        b.shape(path_limb([(10, 330), (10 + math.cos(a) * 70, 330 + math.sin(a) * 40)], [14, 3]), '#e8e0d4' if i % 2 else '#cfc6b8', lit=False)
    parts.append(b)
    h = part('Carrion_Head', HEAD, (20, 340), 3)
    S(h, path_limb([(16, 336), (40, 380), (60, 410)], [18, 14, 12]), '#c87a76', rim='#f0aaa4')
    head = [(40, 410), (48, 440), (76, 448), (100, 434), (150, 406), (162, 396), (150, 392), (100, 396), (70, 392), (46, 396)]
    d = S(h, head, '#d4847e', rim='#ffbcb4')
    h.clipped(d, [(100, 408), (164, 398), (160, 380), (100, 390)], '#e8d8a8', smooth=False)
    P(h, [(100, 404), (162, 396), (168, 382), (154, 384), (100, 394)], '#e8d8a8', rim='#fff6d8')
    h.flat(ellipse(78, 424, 9, 8, n=12), INK)
    h.circle(81, 424, 4, '#ffcc3a')
    for i in range(4):
        h.clipped(d, path_limb([(52 + i * 10, 412), (56 + i * 10, 440)], [1, 2]), '#a85a58')
    # crown
    crown = [(44, 444), (48, 482), (60, 462), (72, 492), (84, 462), (96, 484), (100, 442)]
    P(h, crown, GOLD, rim='#fff0a8')
    for x in (60, 72, 84):
        h.circle(x, 452, 4, '#a01c2a')
    parts.append(h)
    return parts


# ================================================================== BOSS 4. THE CROUPIER: four-armed dealer of fates

def croupier():
    skin, skin_d = '#9eb296', '#7a8e74'
    vest, shirt = '#1f5a3a', '#e8e2d4'
    parts = []
    hip = (0, 190)
    for role, hx, layer, col in ((LEG_B, -14, 0, '#1a1a20'), (LEG_F, 16, 0.5, '#22222a')):
        p = part('Croupier_' + role, role, (hx, hip[1]), layer)
        S(p, path_limb([(hx, 194), (hx + 6, 100), (hx + 4, 30)], [14, 12, 11]), col)
        boot(p, (hx + 6, 16), 52, '#0e0e12', sole='#000000')
        parts.append(p)

    def cards_fan(p, c, n=5, r=34):
        for i in range(n):
            a = math.radians(60 + i * 16)
            cc = (c[0] + math.cos(a) * r, c[1] + math.sin(a) * r)
            card = [(cc[0] - 14, cc[1] - 20), (cc[0] + 14, cc[1] - 20), (cc[0] + 14, cc[1] + 20), (cc[0] - 14, cc[1] + 20)]
            p.shape(card, '#f8f4ea', smooth=False, lit=False)
            p.flat(ellipse(cc[0], cc[1], 5, 7, n=4), '#c81c2a' if i % 2 else '#1a1a22', smooth=False)

    # upper extra arms (props) behind and in front
    for name, sh, layer, col, hand, top in (('Croupier_ArmUpperB', (-8, 360), 1.2, skin_d, (-60, 440), True),
                                            ('Croupier_ArmUpperF', (36, 362), 4.2, skin, (96, 452), False)):
        p = part(name, PROP, sh, layer)
        S(p, path_limb([sh, lerp(sh, hand, 0.5), hand], [11, 9, 8]), shirt if not top else shade(shirt, 0.8))
        p.flat(path_limb([lerp(sh, hand, 0.35), lerp(sh, hand, 0.45)], [10, 10]), '#a01c2a')
        claw(p, hand, 70 if not top else 110, 20, col, n=4, spread=18)
        if top:
            for i in range(4):
                p.shape(ellipse(hand[0] - 10, hand[1] + 30 + i * 7, 16, 5, n=14), ('#c81c2a', '#1a1a22', '#2a6ac8', GOLD)[i], rim=False)
        else:
            cards_fan(p, hand)
        parts.append(p)
    p = part('Croupier_ArmBack', ARM_B, (-10, 350), 1)
    S(p, path_limb([(-10, 350), (-30, 290), (-14, 240)], [12, 10, 9]), shade(shirt, 0.8))
    p.flat(path_limb([(-28, 300), (-22, 280)], [11, 11]), '#a01c2a')
    claw(p, (-14, 238), -70, 20, skin_d, n=4)
    parts.append(p)
    b = part('Croupier_Body', BODY, hip, 2)
    torso = [(-36, 180), (44, 178), (46, 260), (54, 340), (44, 372), (0, 380), (-30, 366), (-36, 300), (-40, 230)]
    td = S(b, torso, shirt)
    b.clipped(td, [(-60, 170), (2, 170), (2, 360), (-60, 360)], vest, smooth=False)
    b.clipped(td, [(12, 170), (70, 170), (70, 360), (12, 360)], vest, smooth=False)
    for y in (330, 300, 270, 240):
        b.circle(-6, y, 3.5, GOLD)
    b.flat([(-10, 382), (6, 374), (22, 382), (22, 368), (6, 374), (-10, 368)], '#a01c2a', smooth=False)
    b.stroke([(-30, 250), (-50, 240), (-36, 226)], GOLD, 2.5)
    b.clipped(td, rect(-60, 180, 70, 192), '#141418')
    parts.append(b)
    h = part('Croupier_Head', HEAD, (8, 378), 3)
    face = [(-6, 400), (-2, 436), (22, 452), (46, 444), (54, 410), (48, 384), (26, 374), (2, 380)]
    d = S(h, face, skin)
    # slicked hair with centre part, long nose, pencil moustache, grin
    h.clipped(d, [(-20, 470), (60, 470), (60, 436), (24, 446), (8, 436), (-20, 420)], '#1e1a1e', smooth=False)
    S(h, [(44, 420), (74, 404), (70, 396), (48, 400)], skin, rim=False)
    h.flat(path_limb([(30, 398), (46, 392), (62, 396)], [1.5, 3, 1.5]), '#1e1a1e')
    m = h.flat([(26, 388), (56, 388), (52, 380), (30, 380)], INK, smooth=False)
    teeth_row(h, m, 30, 54, 388, 5, 6, seed=8, jaggy=0.1)
    socket_eye(h, (22, 418), 6, '#7affb0', socket='#14281c')
    socket_eye(h, (42, 418), 5, '#7affb0', socket='#14281c')
    # green dealer's visor
    P(h, [(-12, 432), (76, 436), (100, 424), (40, 414), (-8, 420)], '#3ac87a', rim='#a0ffc8')
    h.flat([(-12, 432), (76, 436), (74, 440), (-10, 438)], '#1e7a48', smooth=False)
    parts.append(h)
    p = part('Croupier_ArmFront', ARM_F, (36, 352), 4)
    S(p, path_limb([(36, 352), (66, 300), (94, 282)], [12, 10, 9]), shirt)
    p.flat(path_limb([(56, 316), (64, 304)], [11, 11]), '#a01c2a')
    claw(p, (94, 282), 0, 20, skin, n=4)
    parts.append(p)
    return parts


# ================================================================== BOSS 5. THE GRAVEDIGGER: skeletal undertaker, owner of the house

def gravedigger():
    coat, coat_l = '#1c1c22', '#34343e'
    parts = []
    hip = (0, 190)
    for role, hx, layer in ((LEG_B, -14, 0), (LEG_F, 16, 0.5)):
        p = part('Gravedigger_' + role, role, (hx, hip[1]), layer)
        S(p, path_limb([(hx, 194), (hx + 4, 110), (hx + 2, 30)], [9, 7, 7]), BONE_S if role == LEG_B else BONE, rim=False)
        p.circle(hx + 4, 110, 9, BONE)
        boot(p, (hx + 6, 16), 54, '#141418', sole='#000000')
        parts.append(p)
    p = part('Gravedigger_ArmBack', ARM_B, (-12, 384), 1)
    S(p, path_limb([(-12, 384), (-30, 320), (-24, 264)], [14, 12, 11]), shade(coat_l, 0.8))
    claw(p, (-24, 262), -80, 22, BONE_S, n=4, palm=False)
    # hanging lantern
    p.stroke([(-24, 238), (-24, 210)], '#6a6e76', 3)
    P(p, [(-42, 210), (-6, 210), (-10, 160), (-38, 160)], '#2e2a26', rim=False)
    p.flat(rect(-36, 166, -12, 204), '#ffc24a')
    p.flat(rect(-30, 172, -18, 198), '#fff2c0')
    p.flat([(-44, 210), (-4, 210), (-24, 222)], '#2e2a26', smooth=False)
    parts.append(p)
    b = part('Gravedigger_Body', BODY, hip, 2)
    coat_pts = [(-70, 60), (-20, 70), (30, 64), (80, 50), (60, 190), (52, 300), (58, 380), (40, 404), (-20, 404), (-44, 380), (-46, 280), (-50, 180)]
    cd = S(b, coat_pts, coat, rim=coat_l)
    b.clipped(cd, jag((-90, 70), (90, 56), 10, 14, seed=4, side=-1) + [(90, 0), (-90, 0)], '#0c0c10', smooth=False)
    # open coat showing ribcage and spine
    gap = [(-6, 404), (30, 404), (34, 230), (14, 190), (-2, 230)]
    gd = b.clipped(cd, gap, '#0e0c10', smooth=False)
    b.clipped(cd, path_limb([(12, 396), (12, 230)], [4, 4]), BONE_S)
    for i in range(5):
        y = 380 - i * 26
        b.clipped(cd, path_limb([(0, y), (14, y - 2), (30, y - 8)], [2, 4, 2]), BONE)
    folds(b, cd, [[(-36, 360), (-40, 260), (-44, 120)], [(46, 340), (52, 200), (66, 80)]], shade(coat, 0.6), 4)
    for y in (360, 320, 280):
        b.circle(38, y, 3.5, '#8a8e96')
    parts.append(b)
    h = part('Gravedigger_Head', HEAD, (10, 404), 3)
    skull = [(-8, 426), (-4, 460), (22, 476), (48, 468), (58, 440), (52, 418), (34, 402), (8, 404)]
    d = S(h, skull, BONE, rim='#fffaf0')
    h.clipped(d, rect(-20, 380, 80, 414), BONE_S)
    for (x, y, r) in ((18, 440, 9), (42, 440, 8)):
        h.flat(blobby(x, y, r, r * 1.05, top=0.9, n=12, seed=x), INK)
        h.circle(x + 1, y, r * 0.42, '#ffd23c')
    h.flat([(32, 428), (36, 420), (28, 420)], INK, smooth=False)
    for i in range(6):
        h.flat(rect(14 + i * 6, 404, 18 + i * 6, 414), BONE)
        h.flat(rect(18 + i * 6, 404, 19.5 + i * 6, 414), INK)
    # tall top hat with mourning crepe
    P(h, [(-36, 468), (90, 472), (94, 480), (-40, 476)], '#121216', rim='#2e2e36')
    P(h, [(-4, 478), (60, 480), (64, 580), (-6, 576)], '#18181e', rim='#36363e')
    h.flat(rect(-6, 480, 62, 500), '#3a3a44', smooth=False)
    h.flat([(-6, 498), (-30, 470), (-42, 420), (-20, 480)], '#2a2a32', opacity=0.9)
    parts.append(h)
    p = part('Gravedigger_ArmFront', ARM_F, (36, 384), 4)
    S(p, path_limb([(36, 384), (66, 320), (84, 290)], [14, 12, 11]), coat_l)
    claw(p, (86, 288), -20, 22, BONE, n=4, palm=False)
    # shovel
    p.flat(path_limb([(74, 460), (104, 80)], [6, 6]), '#5a3e24')
    p.flat(path_limb([(64, 470), (86, 468)], [5, 5]), '#5a3e24')
    P(p, [(78, 92), (134, 100), (130, 30), (108, 0), (82, 24)], '#8a909a', rim='#d8dce4')
    p.flat(blobby(110, 40, 18, 12, n=10, jitter=0.4, seed=5), '#5a4030', opacity=0.8)
    parts.append(p)
    return parts


ROSTER = [
    ('Shambler', shambler), ('Sprinter', sprinter), ('Crawler', crawler), ('Bloater', bloater), ('Spitter', spitter),
    ('Leaper', leaper), ('Wisp', wisp), ('Brute', brute), ('Screamer', screamer), ('Burrower', burrower),
    ('Gilded', gilded), ('Riot', riot), ('Priest', priest),
    ('BigTony', big_tony), ('Abomination', abomination), ('Carrion', mother_carrion), ('Croupier', croupier), ('Gravedigger', gravedigger),
]
