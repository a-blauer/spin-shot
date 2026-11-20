"""
Dead Man's Hand creature art, drawn the way Sulfur draws its enemies: FRONT-FACING flat vector cut-outs built
from a few bold, simple shapes. Big heads, stubby limbs, mitten hands, dot eyes, blocky teeth; flat fills with
one hard shadow tone, no outlines, no gradients, muted palettes with a single accent. Same style, but nothing here
is cute any more: sunken sockets, scowling lids, torn mouths of pointed teeth, clawed hands.

Creature space: y up, feet at y=0, x is the creature's left/right as seen from the front, 1 unit = 0.5 cm.
Each Part has a pivot; roles drive the in-game puppet animation ("Back" = viewer's left, "Front" = viewer's right).
"""
import math
import random
from vectorkit import Part, ellipse, blobby, limb, path_limb, rect, shade, light, mixc

BODY, HEAD, ARM_B, ARM_F, LEG_B, LEG_F, TAIL, WING_B, WING_F, PROP = (
    'Body', 'Head', 'ArmBack', 'ArmFront', 'LegBack', 'LegFront', 'Tail', 'WingBack', 'WingFront', 'Prop')

INK = '#1d1418'
BONE = '#efe4c8'
BLOOD = '#9c1f24'
GOLD = '#e8b83a'
OFF = (-0.09, 0.07)


# ------------------------------------------------------------------ kit

def part(name, role, pivot, layer):
    return Part(name, pivot, role, layer)


def S(p, pts, col, **kw):
    kw.setdefault('offset', OFF)
    if not hasattr(p, 'base_col'):
        p.base_col = col          # the first big shape drawn into a part is what it is made of
    return p.shape(pts, col, **kw)


def P(p, pts, col, **kw):
    kw.setdefault('offset', OFF)
    return p.shape(pts, col, smooth=False, **kw)


def M(half):
    """Mirror a right-hand half outline (top to bottom, x >= 0) into a full symmetric outline."""
    return list(half) + [(-x, y) for x, y in reversed(half)]


def mv(pts, dx, dy):
    return [(x + dx, y + dy) for x, y in pts]


def lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def rrect(cx, cy, w, h, r, n=5):
    """Rounded rectangle outline (for smooth=False shapes)."""
    pts = []
    for (sx, sy, a0) in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
        ox, oy = cx + sx * (w / 2 - r), cy + sy * (h / 2 - r)
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append((ox + math.cos(a) * r, oy + math.sin(a) * r))
    return pts


SOCKET = '#241a20'


def eyes(p, clip, cx, cy, gap, r, col='#f4e7a8', pupil=INK, pr=0.42, r2=None, brow=None, tilt=0.5, look=(0, -0.12)):
    """A skull's stare. Each socket is a hard-edged slant, low at the nose and high at the temple, with one cold point
    of light deep inside. Under them a nasal cavity and hollow cheeks. Nothing round, nothing wide: no child's face."""
    for s, rr in ((-1, r2 or r), (1, r)):
        x = cx + s * gap
        sock = [(x - s * rr * 1.2, cy + rr * 0.05), (x + s * rr * 1.25, cy + rr * 0.85), (x + s * rr * 1.15, cy - rr * 0.45),
                (x + s * rr * 0.1, cy - rr * 0.95), (x - s * rr * 0.95, cy - rr * 0.7)]
        sd = p.flat(sock, SOCKET, smooth=False)
        p.clipped(sd, ellipse(x + s * rr * 0.12, cy - rr * 0.12, rr * 0.3, rr * 0.3, n=8), col)
        ridge = [(x - s * rr * 1.45, cy + rr * 0.1), (x + s * rr * 1.5, cy + rr * 1.0), (x + s * rr * 1.5, cy + rr * 1.5), (x - s * rr * 1.45, cy + rr * 0.6)]
        p.clipped(clip, ridge, SOCKET, smooth=False, opacity=0.5)                                   # brow ridge
        p.clipped(clip, [(x - s * rr * 0.5, cy - rr * 1.25), (x + s * rr * 1.4, cy - rr * 0.95), (x + s * rr * 0.6, cy - rr * 3.4)], INK, smooth=False, opacity=0.2)   # hollow cheek
    if gap > r * 0.9:
        p.clipped(clip, [(cx - r * 0.5, cy - r * 1.9), (cx, cy - r * 0.7), (cx + r * 0.5, cy - r * 1.9), (cx, cy - r * 1.55)], SOCKET, smooth=False)   # nasal cavity


def mouth(p, clip, cx, cy, w, h, top=3, bot=0, col='#2a1216', tooth=BONE, r=None, tw=0.62, th=0.42, tongue=None):
    """A lipless grimace: corners dragged down, long uneven teeth, a thread of blood from one corner."""
    h = h * 0.92
    pts = [(cx - w * 0.52, cy - h * 0.1), (cx - w * 0.3, cy + h * 0.5), (cx + w * 0.3, cy + h * 0.5), (cx + w * 0.52, cy - h * 0.1),
           (cx + w * 0.4, cy - h * 0.5), (cx - w * 0.4, cy - h * 0.5)]
    d = p.flat(pts, col, smooth=False)
    rnd = random.Random(int(cx * 7 + cy * 13 + w * 3))
    stain = mixc(tooth, '#a8905c', 0.3)
    for n, up in ((top, True), (bot, False)):
        if not n:
            continue
        n2 = n + 3
        cw = w * 0.94 / n2
        for i in range(n2):
            if rnd.random() < 0.18:
                continue                                   # a missing tooth
            tx = cx - w * 0.47 + cw * (i + 0.5)
            L = h * (0.5 + rnd.random() * 0.45)
            lean = (rnd.random() - 0.5) * cw * 0.4
            if up:
                tri = [(tx - cw * 0.36, cy + h * 0.52), (tx + cw * 0.36, cy + h * 0.52), (tx + lean, cy + h * 0.5 - L)]
            else:
                tri = [(tx - cw * 0.36, cy - h * 0.52), (tx + cw * 0.36, cy - h * 0.52), (tx + lean, cy - h * 0.5 + L * 0.75)]
            p.clipped(d, tri, stain if rnd.random() < 0.5 else tooth, smooth=False)
    p.clipped(clip, [(cx + w * 0.36, cy - h * 0.45), (cx + w * 0.44, cy - h * 0.45), (cx + w * 0.41, cy - h * 1.7)], BLOOD, smooth=False)
    return d


def hand(p, c, r, col, ang=-90, fingers=3, claw=None, spread=34, flen=0.95):
    """A bony hand: a small palm, long thin fingers fanning along `ang` (degrees), every one ending in a dark nail."""
    a = math.radians(ang)
    claw = claw or shade(col, 0.42)
    flen = flen * 1.25
    spread = spread * 1.12
    for i in range(fingers):
        fa = a + math.radians((i - (fingers - 1) / 2) * spread)
        b = (c[0] + math.cos(fa) * r * 0.55, c[1] + math.sin(fa) * r * 0.55)
        e = (c[0] + math.cos(fa) * r * (0.9 + flen), c[1] + math.sin(fa) * r * (0.9 + flen))
        if claw:
            p.flat(path_limb([lerp(b, e, 0.55), (c[0] + math.cos(fa) * r * (1.5 + flen), c[1] + math.sin(fa) * r * (1.5 + flen))], [r * 0.2, r * 0.03], n_end=4), claw)
        p.shape(path_limb([b, e], [r * 0.26, r * 0.16], n_end=6), col, lit=False)
    S(p, ellipse(c[0], c[1], r * 0.9, r * 0.84, n=16), col)


def fist(p, c, r, col, ring=None):
    d = S(p, rrect(c[0], c[1], r * 2.1, r * 1.8, r * 0.7), col, smooth=False)
    for i in range(3):
        p.clipped(d, rect(c[0] - r * 0.62 + i * r * 0.62 - 1.5, c[1] - r, c[0] - r * 0.62 + i * r * 0.62 + 1.5, c[1] - r * 0.1), shade(col, 0.72), smooth=False)
    if ring:
        p.flat(rect(c[0] - r * 0.3, c[1] - r * 0.55, c[0] + r * 0.3, c[1] - r * 0.2), ring, smooth=False)
    return d


def arm(cn, side, sh, el, wr, w0, w1, col, hcol, hr, layer=3, ang=None, fingers=3, claw=None, sleeve=None, kind='hand', ring=None, flen=0.95, spread=34):
    role = ARM_F if side > 0 else ARM_B
    p = part('%s_%s' % (cn, role), role, sh, layer)
    S(p, path_limb([sh, el, wr], [w0, (w0 + w1) * 0.44, w1 * 0.8]), col)
    out = 1 if el[0] >= sh[0] else -1
    p.flat([(el[0], el[1] + w0 * 0.5), (el[0] + out * w0 * 1.05, el[1] - w0 * 0.15), (el[0], el[1] - w0 * 0.55)], col, smooth=False)   # the elbow juts out
    if sleeve:  # bare forearm past the sleeve, and the sleeve ends in rags
        c0 = lerp(el, wr, sleeve[1])
        S(p, path_limb([c0, wr], [w1 * 0.72, w1 * 0.62]), sleeve[0])
        for k in (-1, 0, 1):
            p.flat([(c0[0] + k * w1 * 0.55 - w1 * 0.3, c0[1] + 2), (c0[0] + k * w1 * 0.55 + w1 * 0.3, c0[1] + 2), (c0[0] + k * w1 * 0.7, c0[1] - w1 * (0.9 + 0.35 * (k + 1)))], col, smooth=False)
    if ang is None:
        ang = math.degrees(math.atan2(wr[1] - el[1], wr[0] - el[0]))
    a = math.radians(ang)
    c = (wr[0] + math.cos(a) * hr * 0.5, wr[1] + math.sin(a) * hr * 0.5)
    if kind == 'fist':
        fist(p, c, hr, hcol, ring)
    elif kind == 'hand':
        hand(p, c, hr, hcol, ang, fingers, claw, spread=spread, flen=flen)
    p.hand_c = c
    return p


def leg(cn, side, hip, foot, w0, w1, col, shoe, fw, fh, layer=0, knee=0.0, shin=None):
    role = LEG_F if side > 0 else LEG_B
    p = part('%s_%s' % (cn, role), role, hip, layer)
    mid = lerp(hip, foot, 0.5)
    mid = (mid[0] + side * knee, mid[1])
    S(p, path_limb([hip, mid, (foot[0], foot[1] + max(fh * 0.7, w1))], [w0, (w0 + w1) * 0.46, w1 * 0.86]), col)
    p.flat([(mid[0] + side * w0 * 0.3, mid[1] + w0 * 0.5), (mid[0] + side * w0 * 0.95, mid[1] - w0 * 0.1), (mid[0] + side * w0 * 0.3, mid[1] - w0 * 0.6)], col, smooth=False)   # a knob of knee
    hem = lerp(mid, foot, 0.42)
    if shin:
        S(p, path_limb([hem, (foot[0], foot[1] + fh * 0.7)], [w1 * 0.7, w1 * 0.62]), shin)
    for k in (-1, 0, 1):   # the trouser leg ends in tatters
        p.flat([(hem[0] + k * w1 * 0.5 - w1 * 0.28, hem[1] + 3), (hem[0] + k * w1 * 0.5 + w1 * 0.28, hem[1] + 3), (hem[0] + k * w1 * 0.66, hem[1] - w1 * (0.8 + 0.4 * (1 - k)))], col, smooth=False)
    if shoe:   # a split, square-toed boot: hard edges, no round shoes
        x = foot[0]
        boot = [(x - side * fw * 0.62, foot[1]), (x + side * fw * 1.12, foot[1]), (x + side * fw * 1.18, foot[1] + fh * 0.2), (x + side * fw * 0.5, foot[1] + fh * 0.52),
                (x + side * fw * 0.34, foot[1] + fh * 0.98), (x - side * fw * 0.56, foot[1] + fh * 0.98)]
        P(p, boot, shoe)
        p.flat(rect(x - fw * 1.2, foot[1] - 1, x + fw * 1.2, foot[1] + fh * 0.14), shade(shoe, 0.6), smooth=False)
    return p


def splat(p, clip, c, r, col=BLOOD, seed=0, n=11):
    rnd = random.Random(seed)
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        k = rnd.uniform(0.55, 1.15)
        pts.append((c[0] + math.cos(a) * r * k, c[1] + math.sin(a) * r * k * 0.8))
    p.clipped(clip, pts, col)


def hat(p, cx, y, crown_w, crown_h, brim_w, col, band=None, brim_h=9, taper=0.82, dent=0.0, tilt=0):
    """Front view hat: flat brim ellipse and a crown."""
    S(p, ellipse(cx, y, brim_w, brim_h, n=18), shade(col, 0.86))
    cr = [(cx - crown_w, y), (cx - crown_w * taper, y + crown_h), (cx, y + crown_h * (1 - dent)), (cx + crown_w * taper, y + crown_h), (cx + crown_w, y)]
    d = P(p, cr, col)
    if band:
        p.clipped(d, rect(cx - crown_w * 2, y + 2, cx + crown_w * 2, y + crown_h * 0.26), band, smooth=False)
    return d


# ================================================================== 1. SHAMBLER: dead townsfolk, suspenders, slack jaw

def shambler():
    cn = 'Shambler'
    skin, shirt, pants = '#9fb089', '#d8cdb0', '#5c4a40'
    parts = [leg(cn, -1, (-28, 150), (-34, 0), 24, 21, pants, '#3d2f28', 30, 26, shin=None),
             leg(cn, 1, (28, 150), (36, 0), 24, 21, pants, '#3d2f28', 30, 26)]
    b = part(cn + '_Body', BODY, (0, 150), 1)
    td = S(b, M([(0, 268), (52, 262), (66, 236), (62, 170), (56, 134), (0, 128)]), shirt)
    b.clipped(td, rect(-80, 120, 80, 152), pants, smooth=False)
    for s in (-1, 1):
        b.clipped(td, [(s * 22, 270), (s * 34, 270), (s * 44, 150), (s * 32, 150)], '#7a3a2c', smooth=False)
    splat(b, td, (-18, 196), 20, seed=3)
    b.clipped(td, [(30, 152), (44, 186), (58, 152)], skin, smooth=False)  # torn hem
    parts.append(b)
    h = part(cn + '_Head', HEAD, (4, 262), 2)
    hd = S(h, mv(rrect(0, 0, 150, 138, 52), 6, 328), skin)
    S(h, ellipse(-70, 322, 13, 18, n=12), shade(skin, 0.9)); S(h, ellipse(82, 322, 13, 18, n=12), shade(skin, 0.9))
    eyes(h, hd, 6, 340, 32, 17, r2=11, col='#f3e9a0', pr=0.34)
    h.clipped(hd, rrect(6, 394, 150, 30, 8), '#4a4038', smooth=False)   # thin hair cap
    mouth(h, hd, 8, 290, 62, 30, top=3, bot=2)
    h.clipped(hd, ellipse(-44, 372, 14, 9, n=10), shade(skin, 0.78))
    parts.append(h)
    parts.append(arm(cn, -1, (-62, 248), (-92, 204), (-84, 150), 20, 16, shirt, skin, 22, ang=-80, sleeve=(skin, 0.3)))
    parts.append(arm(cn, 1, (62, 248), (92, 204), (84, 150), 20, 16, shirt, skin, 22, ang=-100, sleeve=(skin, 0.3)))
    return parts


# ================================================================== 2. SPRINTER: gaunt feral runner, zigzag grin

def sprinter():
    cn = 'Sprinter'
    skin, rag = '#c2ccd0', '#3d4258'
    parts = [leg(cn, -1, (-22, 132), (-52, 0), 17, 13, rag, None, 0, 20, knee=-22, shin=skin),
             leg(cn, 1, (22, 132), (50, 0), 17, 13, rag, None, 0, 20, knee=22, shin=skin)]
    for lp, s in zip(parts, (-1, 1)):
        hand(lp, (s * 52 + s * 6, 10), 15, skin, ang=-90 + s * 40, fingers=3, claw=BONE, flen=0.5)
    b = part(cn + '_Body', BODY, (0, 132), 1)
    td = S(b, M([(0, 262), (64, 250), (72, 222), (30, 150), (26, 118), (0, 112)]), skin)
    for i in range(4):
        b.clipped(td, path_limb([(-36 + i * 3, 216 - i * 18), (0, 208 - i * 18), (36 - i * 3, 216 - i * 18)], [2.5, 4, 2.5]), shade(skin, 0.74))
    b.clipped(td, M([(0, 150), (40, 152), (40, 100), (0, 100)]), rag, smooth=False)
    parts.append(b)
    h = part(cn + '_Head', HEAD, (0, 236), 2)
    hd = S(h, M([(0, 330), (44, 322), (66, 290), (58, 244), (30, 220), (0, 216)]), skin)
    for s in (-1, 1):
        P(h, [(s * 56, 300), (s * 100, 318), (s * 62, 276)], shade(skin, 0.92))
    eyes(h, hd, 0, 286, 27, 12, col='#ff5040', pupil=None, brow=shade(skin, 0.7), tilt=0.9)
    md = h.flat(M([(0, 262), (48, 268), (44, 244), (0, 232)]), '#2a1216')
    for i in range(7):
        x = -39 + i * 13
        h.clipped(md, [(x - 7, 270), (x + 7, 270), (x, 250)], BONE, smooth=False)
        h.clipped(md, [(x - 1, 228), (x + 13, 228), (x + 6, 246)], BONE, smooth=False)
    parts.append(h)
    parts.append(arm(cn, -1, (-64, 240), (-112, 190), (-124, 122), 14, 10, skin, skin, 17, ang=-100, claw=BONE))
    parts.append(arm(cn, 1, (64, 240), (112, 190), (124, 122), 14, 10, skin, skin, 17, ang=-80, claw=BONE))
    return parts


# ================================================================== 3. CRAWLER: legless miner dragging itself along

def crawler():
    cn = 'Crawler'
    skin, cloth, hel = '#a99cb6', '#6b4a2e', '#d8a83a'
    b = part(cn + '_Body', BODY, (0, 30), 1)
    td = S(b, M([(0, 132), (70, 118), (96, 60), (84, 6), (0, 0)]), cloth)
    b.clipped(td, rect(-12, 0, 12, 140), shade(cloth, 0.7), smooth=False)
    for i in range(4):
        b.circle(0, 24 + i * 26, 5, GOLD)
    h = part(cn + '_Head', HEAD, (0, 60), 2)
    hd = S(h, rrect(0, 62, 120, 100, 40), skin, smooth=False)
    eyes(h, hd, 0, 66, 26, 13, col='#f3e9a0', brow=shade(skin, 0.7), tilt=0.6)
    mouth(h, hd, 0, 30, 70, 26, top=4, bot=3)
    hl = S(h, M([(0, 150), (40, 142), (64, 108), (70, 92), (0, 92)]), hel)
    h.clipped(hl, rect(-80, 88, 80, 100), shade(hel, 0.7), smooth=False)
    h.circle(0, 124, 17, '#3a3030'); h.circle(0, 124, 12, '#fff3b0')
    parts = [b, h]
    parts.append(arm(cn, -1, (-74, 96), (-128, 120), (-136, 34), 20, 16, cloth, skin, 22, ang=-90, claw=BONE, sleeve=(skin, 0.4)))
    parts.append(arm(cn, 1, (74, 96), (126, 134), (140, 44), 20, 16, cloth, skin, 22, ang=-90, claw=BONE, sleeve=(skin, 0.4)))
    return parts


# ================================================================== 4. BLOATER: a walking gas bag in a red union suit

def bloater():
    cn = 'Bloater'
    skin, suit, gas = '#b9b56a', '#b8443c', '#b8e04a'
    parts = [leg(cn, -1, (-56, 90), (-64, 0), 34, 28, suit, '#3a2a26', 38, 28),
             leg(cn, 1, (56, 90), (64, 0), 34, 28, suit, '#3a2a26', 38, 28)]
    b = part(cn + '_Body', BODY, (0, 110), 1)
    td = S(b, ellipse(0, 196, 168, 150, n=26), suit)
    tear = [(-78, 214), (-40, 248), (-12, 226), (22, 252), (58, 232), (84, 204), (60, 168), (70, 140), (24, 150), (-6, 128), (-34, 156), (-76, 162), (-58, 190)]
    gd = b.clipped(td, tear, gas, smooth=False)
    from vectorkit import sharp_path
    gclip = sharp_path(tear)
    for (x, y, r) in ((-30, 200, 22), (30, 196, 16), (2, 168, 12), (48, 218, 9), (-48, 172, 8)):
        b.clipped(gclip, ellipse(x, y, r, r, n=12), '#e6ff8a')
    for i in range(5):
        b.circle(0, 318 - i * 0, 0.01, suit)
    for y in (316, 286, 104, 76):
        b.clipped(td, ellipse(0, y, 8, 8, n=10), '#f0dca0')
    parts.append(b)
    h = part(cn + '_Head', HEAD, (0, 330), 2)
    hd = S(h, rrect(0, 372, 104, 92, 40), skin, smooth=False)
    eyes(h, hd, 0, 380, 22, 10, col=INK, pupil=None)
    mouth(h, hd, 0, 350, 40, 18, top=2)
    h.flat(path_limb([(14, 344), (16, 322), (14, 306)], [5, 4, 3]), gas)
    hat(h, 0, 414, 38, 34, 62, '#3a3038', band='#8a2a30', taper=0.9)
    parts.append(h)
    parts.append(arm(cn, -1, (-150, 250), (-196, 214), (-188, 166), 26, 20, suit, skin, 24, ang=-90))
    parts.append(arm(cn, 1, (150, 250), (196, 214), (188, 166), 26, 20, suit, skin, 24, ang=-90))
    return parts


# ================================================================== 5. SPITTER: poncho, wide hat, a glowing acid goitre

def spitter():
    cn = 'Spitter'
    skin, pon, acid = '#8fa878', '#a8623c', '#9be04a'
    parts = [leg(cn, -1, (-26, 150), (-30, 0), 18, 15, '#4a4038', '#2e2622', 28, 24),
             leg(cn, 1, (26, 150), (30, 0), 18, 15, '#4a4038', '#2e2622', 28, 24)]
    b = part(cn + '_Body', BODY, (0, 150), 1)
    pd = P(b, M([(0, 318), (34, 310), (128, 138), (96, 122), (64, 138), (32, 120), (0, 136)]), pon)
    for y, c, hgt in ((176, '#e8d8a8', 12), (196, '#5a2c22', 8), (236, '#e8d8a8', 6)):
        b.clipped(pd, rect(-140, y, 140, y + hgt), c, smooth=False)
    parts.append(b)
    h = part(cn + '_Head', HEAD, (0, 300), 2)
    S(h, ellipse(0, 300, 44, 40, n=18), acid)                 # goitre sac
    h.circle(-12, 308, 12, '#e6ff9a'); h.circle(16, 290, 7, '#e6ff9a')
    hd = S(h, rrect(0, 356, 112, 84, 34), skin, smooth=False)
    eyes(h, hd, 0, 362, 26, 11, col='#f3e9a0', brow=shade(skin, 0.7), tilt=0.5)
    mouth(h, hd, 0, 330, 44, 16, top=3)
    h.flat(path_limb([(-12, 326), (-14, 300), (-12, 276)], [5, 4, 2.5]), acid)
    hat(h, 0, 392, 44, 46, 104, '#6a5238', band='#3a2a20', dent=0.2)
    parts.append(h)
    parts.append(arm(cn, -1, (-70, 232), (-110, 190), (-104, 150), 12, 10, skin, skin, 18, layer=0.5, ang=-90))
    parts.append(arm(cn, 1, (70, 232), (110, 190), (104, 150), 12, 10, skin, skin, 18, layer=3, ang=-90))
    return parts


# ================================================================== 6. LEAPER: bandolier bullfrog

def leaper():
    cn = 'Leaper'
    skin, belly = '#5f9a8c', '#cfd8a8'
    parts = []
    for s in (-1, 1):
        role = LEG_F if s > 0 else LEG_B
        p = part('%s_%s' % (cn, role), role, (s * 84, 70), 0)
        S(p, path_limb([(s * 80, 60), (s * 150, 150), (s * 134, 30)], [34, 26, 18]), shade(skin, 0.9))
        hand(p, (s * 150, 16), 20, skin, ang=-90 + s * 50, fingers=3, spread=40)
        parts.append(p)
    b = part(cn + '_Body', BODY, (0, 60), 1)
    td = S(b, M([(0, 150), (80, 140), (112, 84), (86, 18), (0, 8)]), skin)
    b.clipped(td, ellipse(0, 54, 66, 60, n=16), belly)
    bd = b.clipped(td, [(-110, 140), (-84, 150), (96, 40), (72, 26)], '#6b4426', smooth=False)
    for i in range(5):
        t = i / 4
        b.clipped(td, rrect(-78 + t * 150, 132 - t * 92, 12, 22, 4), GOLD, smooth=False)
    parts.append(b)
    h = part(cn + '_Head', HEAD, (0, 130), 2)
    hd = S(h, M([(0, 232), (60, 228), (118, 196), (124, 158), (84, 126), (0, 118)]), skin)
    for s in (-1, 1):
        P(h, [(s * 36, 222), (s * 60, 252), (s * 100, 244), (s * 108, 214)], skin)                                     # a low bony brow, not a bulging eye
        sd = h.flat([(s * 44, 222), (s * 62, 240), (s * 98, 236), (s * 100, 218), (s * 70, 212)], SOCKET, smooth=False)
        h.clipped(sd, [(s * 60, 216), (s * 92, 226), (s * 90, 232), (s * 60, 222)], '#c9ac3c', smooth=False); h.clipped(sd, rrect(s * 76, 224, 4, 16, 1), INK, smooth=False)
        for k in range(3):
            h.flat([(s * (10 + k * 14), 230), (s * (22 + k * 14), 230), (s * (17 + k * 14), 252 - k * 4)], BONE, smooth=False)   # spines along the skull
    md = h.flat(M([(0, 176), (96, 184), (92, 166), (0, 150)]), '#3a1620')
    for i, x in enumerate(range(-84, 85, 14)):
        L = 14 + (i * 7 % 11)
        h.clipped(md, [(x - 6, 186), (x + 6, 186), (x + (i % 3 - 1) * 2, 186 - L - abs(x) * 0.06)], BONE if i % 3 else '#c9b88c', smooth=False)
        if i % 2: h.clipped(md, [(x - 5, 148), (x + 5, 148), (x, 148 + L * 0.7)], '#c9b88c', smooth=False)
    h.clipped(md, rect(-100, 148, 100, 154), BLOOD, smooth=False)
    h.flat(path_limb([(22, 152), (26, 130), (23, 112)], [5, 4, 2.5]), BLOOD)
    parts.append(h)
    parts.append(arm(cn, -1, (-50, 96), (-70, 50), (-52, 16), 16, 13, skin, skin, 18, ang=-90))
    parts.append(arm(cn, 1, (50, 96), (70, 50), (52, 16), 16, 13, skin, skin, 18, ang=-90))
    return parts


# ================================================================== 7. WISP: buzzard skull on ragged wings, trailing ghost fire

def wisp():
    cn = 'Wisp'
    fea, fire = '#3a3448', '#5ff0e0'
    parts = []
    t = part(cn + '_Tail', TAIL, (0, 70), 0)
    S(t, [(-26, 76), (26, 76), (34, 30), (14, 44), (4, 0), (-10, 38), (-32, 22)], fire)
    t.flat([(-10, 70), (10, 70), (8, 38), (0, 22), (-8, 42)], '#d8fff8')
    parts.append(t)
    for s in (-1, 1):
        role = WING_F if s > 0 else WING_B
        w = part('%s_%s' % (cn, role), role, (s * 26, 104), 1)
        pts = [(s * 20, 124), (s * 110, 168), (s * 214, 150), (s * 196, 122), (s * 206, 98), (s * 166, 96), (s * 170, 70), (s * 126, 76), (s * 122, 52), (s * 80, 66), (s * 20, 80)]
        P(w, pts if s > 0 else pts[::-1], fea)
        w.flat(path_limb([(s * 22, 118), (s * 108, 158), (s * 204, 146)], [9, 7, 3]), shade(fea, 1.5))
        parts.append(w)
    b = part(cn + '_Body', BODY, (0, 100), 2)
    S(b, ellipse(0, 100, 36, 42, n=16), fea)
    S(b, M([(0, 122), (40, 132), (30, 104), (0, 92)]), '#d8d0c0')   # ruff
    parts.append(b)
    h = part(cn + '_Head', HEAD, (0, 124), 3)
    hd = S(h, M([(0, 198), (40, 188), (52, 158), (30, 128), (0, 122)]), BONE)
    for s in (-1, 1):
        h.circle(s * 24, 162, 14, INK); h.circle(s * 24, 162, 6, fire)
    P(h, [(-13, 144), (13, 144), (5, 110), (0, 84), (-5, 110)], '#c9b48a')
    h.flat([(-4, 138), (4, 138), (0, 124)], INK, smooth=False)
    parts.append(h)
    return parts


# ================================================================== 8. BRUTE: sack-headed butcher

def brute():
    cn = 'Brute'
    skin, apron, sack = '#c08a72', '#d8ccb0', '#b89a66'
    parts = [leg(cn, -1, (-60, 120), (-70, 0), 40, 32, '#4a3c36', '#2e2420', 44, 30),
             leg(cn, 1, (60, 120), (70, 0), 40, 32, '#4a3c36', '#2e2420', 44, 30)]
    b = part(cn + '_Body', BODY, (0, 120), 1)
    td = S(b, M([(0, 372), (96, 366), (168, 322), (158, 220), (120, 120), (0, 100)]), skin)
    ad = b.clipped(td, M([(0, 316), (64, 316), (88, 96), (0, 96)]), apron, smooth=False)
    b.clipped(td, [(-64, 316), (-50, 316), (-84, 380), (-100, 380)], '#5a4030', smooth=False)
    b.clipped(td, [(64, 316), (50, 316), (84, 380), (100, 380)], '#5a4030', smooth=False)
    from vectorkit import sharp_path
    ac = sharp_path(M([(0, 316), (64, 316), (88, 96), (0, 96)]))
    for (x, y, r, sd) in ((-22, 250, 30, 1), (34, 180, 24, 5), (-10, 140, 16, 9)):
        splat(b, ac, (x, y), r, seed=sd)
    parts.append(b)
    h = part(cn + '_Head', HEAD, (0, 356), 2)
    hd = S(h, M([(0, 444), (40, 438), (58, 400), (52, 362), (34, 344), (0, 340)]), sack)
    for s in (-1, 1):
        h.flat(ellipse(s * 22, 400, 11, 13, n=10), INK); h.circle(s * 22, 398, 4.5, '#ff5040')
    h.flat(rect(-24, 366, 24, 370), '#4a3626', smooth=False)
    for i in range(5):
        h.flat(rect(-22 + i * 10, 360, -19 + i * 10, 376), '#4a3626', smooth=False)
    h.clipped(hd, rect(-70, 340, 70, 350), '#6a4a30', smooth=False)
    parts.append(h)
    a = arm(cn, -1, (-150, 320), (-204, 220), (-190, 120), 44, 34, skin, skin, 40, kind='fist')
    a.stroke([(-190, 96), (-190, 60), (-176, 44), (-164, 58)], '#8a8f9c', 7)   # meat hook
    parts.append(a)
    a = arm(cn, 1, (150, 320), (210, 240), (214, 300), 44, 34, skin, skin, 40, kind='fist', ang=90)
    P(a, [(196, 330), (270, 330), (270, 440), (212, 440), (196, 420)], '#c8ccd4')        # cleaver
    a.flat([(196, 330), (270, 330), (270, 346), (196, 346)], '#9aa0aa', smooth=False)
    splat(a, sharp_path([(196, 330), (270, 330), (270, 440), (212, 440), (196, 420)]), (250, 400), 22, seed=4)
    a.flat(rect(206, 280, 222, 332), '#5a3a26', smooth=False)
    parts.append(a)
    return parts


# ================================================================== 9. SCREAMER: wailing widow

def screamer():
    cn = 'Screamer'
    skin, dress, veil = '#dcd6d0', '#2c2630', '#a8a0b0'
    b = part(cn + '_Body', BODY, (0, 120), 1)
    td = S(b, M([(0, 330), (44, 322), (50, 250), (36, 210), (104, 40), (110, 0), (0, 0)]), dress)
    for x in (-60, -20, 24, 66):
        b.clipped(td, [(x - 4, 0), (x + 8, 0), (x * 0.5 + 6, 190), (x * 0.5, 190)], shade(dress, 0.7), smooth=False)
    b.circle(0, 296, 9, '#c8324a'); b.circle(0, 296, 4, GOLD)
    parts = [b]
    h = part(cn + '_Head', HEAD, (0, 318), 2)
    P(h, M([(0, 470), (60, 452), (92, 380), (120, 250), (84, 272), (62, 300), (0, 310)]), veil, opacity=0.9)
    hd = S(h, M([(0, 444), (46, 432), (58, 384), (42, 330), (0, 316)]), skin)
    for s in (-1, 1):
        h.flat(ellipse(s * 24, 396, 14, 18, n=12), INK); h.circle(s * 24, 392, 5, '#e8e0ff')
        h.flat(path_limb([(s * 24, 378), (s * 26, 356)], [4, 1.5]), INK)
    h.flat(ellipse(0, 346, 17, 26, n=14), '#2a1216')
    parts.append(h)
    parts.append(arm(cn, -1, (-46, 306), (-104, 330), (-86, 400), 12, 9, dress, skin, 17, ang=95, fingers=4, spread=26, flen=1.3))
    parts.append(arm(cn, 1, (46, 306), (104, 330), (86, 400), 12, 9, dress, skin, 17, ang=85, fingers=4, spread=26, flen=1.3))
    return parts


# ================================================================== 10. BURROWER: star-nosed armadillo-mole

def burrower():
    cn = 'Burrower'
    shell, fur = '#8a6a48', '#c0a078'
    b = part(cn + '_Body', BODY, (0, 30), 1)
    td = S(b, M([(0, 196), (70, 180), (120, 110), (124, 30), (0, 16)]), shell)
    for i in range(4):
        b.clipped(td, path_limb([(-130, 150 - i * 34), (0, 176 - i * 34), (130, 150 - i * 34)], [5, 5, 5]), shade(shell, 0.68))
    for i in range(5):
        x = -56 + i * 28
        P(b, [(x - 10, 180 - abs(i - 2) * 9), (x + 10, 180 - abs(i - 2) * 9), (x, 214 - abs(i - 2) * 12)], BONE)
    parts = [b]
    h = part(cn + '_Head', HEAD, (0, 70), 2)
    hd = S(h, M([(0, 112), (48, 100), (58, 62), (30, 22), (0, 14)]), fur)
    eyes(h, hd, 0, 84, 26, 6, col=INK, pupil=None)
    for i in range(8):
        a = 2 * math.pi * i / 8
        h.flat(path_limb([(0, 46), (math.cos(a) * 17, 46 + math.sin(a) * 17)], [4, 1.5]), '#7a3a40')
    h.circle(0, 46, 8, '#3a1c22')
    md = h.flat(rrect(0, 22, 44, 16, 4), '#2a1216', smooth=False)
    h.flat([(-10, 30), (-1, 30), (-4, 2)], '#d9c79a', smooth=False); h.flat([(1, 30), (10, 30), (5, 0)], BONE, smooth=False)
    for x in (-17, 17): h.clipped(md, [(x - 4, 31), (x + 4, 31), (x, 18)], BONE, smooth=False)
    parts.append(h)
    for s in (-1, 1):
        a = arm(cn, s, (s * 96, 70), (s * 140, 60), (s * 146, 30), 22, 20, fur, fur, 26, ang=-90 + s * 10, fingers=4, claw=BONE, spread=24, flen=0.4)
        parts.append(a)
    return parts


# ================================================================== 11. GILDED: masked bandit hauling the take

def gilded():
    cn = 'Gilded'
    skin, coat = '#b8a070', '#5a4634'
    parts = [leg(cn, -1, (-26, 130), (-32, 0), 22, 18, '#3e342e', '#2a211c', 30, 26),
             leg(cn, 1, (26, 130), (34, 0), 22, 18, '#3e342e', '#2a211c', 30, 26)]
    pr = part(cn + '_Prop', PROP, (-60, 250), 0.5)          # loot sack over the shoulder
    sd = S(pr, ellipse(-92, 250, 70, 78, n=20), '#c8a468')
    P(pr, [(-70, 318), (-40, 340), (-30, 300)], '#c8a468')
    pr.clipped(sd, rrect(-96, 246, 44, 44, 6), '#8a6a3a', smooth=False)
    P(pr, [(-106, 256), (-86, 256), (-96, 238)], GOLD)
    for (x, y) in ((-128, 332), (-104, 344), (-82, 336)):
        pr.circle(x, y, 13, GOLD); pr.circle(x, y, 7, '#fff0a0')
    parts.append(pr)
    b = part(cn + '_Body', BODY, (0, 130), 1)
    td = S(b, M([(0, 250), (50, 244), (62, 210), (58, 120), (0, 108)]), coat)
    b.clipped(td, M([(0, 250), (14, 250), (10, 108), (0, 108)]), '#c8b890', smooth=False)
    b.clipped(td, rect(-80, 132, 80, 146), '#2a211c', smooth=False); b.clipped(td, rrect(0, 139, 20, 16, 3), GOLD, smooth=False)
    parts.append(b)
    h = part(cn + '_Head', HEAD, (0, 246), 2)
    hd = S(h, rrect(0, 296, 118, 104, 42), skin, smooth=False)
    h.clipped(hd, rect(-80, 240, 80, 292), '#b02a30', smooth=False)             # bandana
    P(h, [(-20, 250), (20, 250), (0, 214)], '#b02a30')
    eyes(h, hd, 0, 310, 26, 11, col='#fff0a0', brow=shade(skin, 0.7), tilt=0.7)
    hat(h, 0, 338, 46, 48, 96, '#2e2830', band=GOLD, dent=0.18)
    parts.append(h)
    parts.append(arm(cn, -1, (-56, 236), (-92, 196), (-98, 150), 18, 15, coat, skin, 20, layer=3, ang=-90))
    parts.append(arm(cn, 1, (56, 236), (92, 196), (98, 150), 18, 15, coat, skin, 20, ang=-90))
    return parts


# ================================================================== 12. RIOT: dead deputy behind a boiler-plate shield

def riot():
    cn = 'Riot'
    skin, coat = '#a8b09a', '#8a7658'
    parts = [leg(cn, -1, (-30, 150), (-36, 0), 24, 20, '#4a4238', '#2a221e', 32, 26),
             leg(cn, 1, (30, 150), (38, 0), 24, 20, '#4a4238', '#2a221e', 32, 26)]
    b = part(cn + '_Body', BODY, (0, 150), 1)
    td = S(b, M([(0, 290), (58, 284), (72, 250), (66, 140), (0, 124)]), coat)
    P(b, [(40, 262), (48, 244), (66, 244), (52, 232), (58, 214), (40, 226), (22, 214), (28, 232), (14, 244), (32, 244)], GOLD)
    parts.append(b)
    h = part(cn + '_Head', HEAD, (0, 284), 2)
    hd = S(h, rrect(0, 338, 124, 112, 44), skin, smooth=False)
    eyes(h, hd, 0, 346, 28, 12, col='#f3e9a0', brow=shade(skin, 0.7), tilt=0.5)
    mouth(h, hd, 0, 308, 58, 20, top=4, bot=4, th=0.5)
    hat(h, 0, 384, 46, 44, 100, '#5a4a36', band='#2a221e', dent=0.16)
    parts.append(h)
    parts.append(arm(cn, 1, (66, 272), (104, 226), (100, 170), 20, 16, coat, skin, 22, ang=-90))
    sh = part(cn + '_Prop', PROP, (-40, 200), 4)
    outline = M([(0, 300), (92, 292), (100, 120), (70, 60), (0, 40)])
    sd = P(sh, mv(outline, -46, 0), '#7c8490')
    sh.clipped(sd, mv(M([(0, 286), (78, 280), (86, 124), (60, 74), (0, 56)]), -46, 0), '#646c78', smooth=False)
    sh.flat(mv(rrect(0, 238, 96, 16, 5), -46, 0), INK, smooth=False)            # vision slit
    for (x, y) in ((-78, 270), (78, 270), (-80, 150), (80, 150), (0, 70), (-50, 96), (50, 96)):
        sh.circle(x - 46, y, 6, '#b8bec8')
    splat(sh, sd, (-20, 150), 28, col='#8a4a30', seed=8)
    parts.append(sh)
    return parts


# ================================================================== 13. PRIEST: hex preacher with a soul lantern

def priest():
    cn = 'Priest'
    skin, robe, hex_ = '#c8c0cc', '#2e2836', '#b070ff'
    b = part(cn + '_Body', BODY, (0, 120), 1)
    td = S(b, M([(0, 310), (52, 304), (64, 250), (84, 30), (88, 0), (0, 0)]), robe)
    b.clipped(td, rect(-6, 0, 6, 320), shade(robe, 1.5), smooth=False)
    for i in range(6):
        b.circle(0, 60 + i * 42, 5, '#8a80a0')
    b.flat(rect(-12, 292, 12, 312), '#f0ece0', smooth=False)
    parts = [b]
    h = part(cn + '_Head', HEAD, (0, 304), 2)
    hd = S(h, M([(0, 396), (44, 388), (54, 350), (36, 312), (0, 304)]), skin)
    for s in (-1, 1):
        h.flat(ellipse(s * 22, 360, 13, 14, n=10), INK); h.circle(s * 22, 360, 6, hex_)
    h.flat([(-5, 340), (5, 340), (0, 328)], INK, smooth=False)
    md = h.flat(rect(-24, 314, 24, 324), INK, smooth=False)
    for i in range(6):
        h.flat(rect(-22 + i * 8, 314, -17 + i * 8, 324), BONE, smooth=False)
    hat(h, 0, 394, 42, 30, 116, '#201c28', band=hex_, taper=0.95, brim_h=10)
    parts.append(h)
    a = arm(cn, -1, (-56, 290), (-96, 240), (-84, 190), 20, 18, robe, skin, 18, ang=-90)
    P(a, mv(rrect(0, 0, 50, 62, 6), -88, 150), '#5a2030'); a.flat(rect(-92, 138, -84, 166), GOLD, smooth=False); a.flat(rect(-100, 152, -76, 158), GOLD, smooth=False)
    parts.append(a)
    a = arm(cn, 1, (56, 290), (100, 250), (110, 290), 20, 18, robe, skin, 18, ang=90, kind='none')
    a.flat(rect(106, 20, 116, 470), '#5a4030', smooth=False)                           # staff
    a.stroke([(111, 468), (111, 492), (140, 498), (150, 470)], '#5a4030', 8)
    P(a, mv(rrect(0, 0, 44, 60, 10), 150, 430), '#3a3444'); a.flat(ellipse(150, 430, 13, 20, n=12), hex_); a.flat(ellipse(150, 426, 6, 10, n=10), '#f0e0ff')
    fist(a, (112, 300), 18, skin)
    parts.append(a)
    return parts


# ================================================================== 14. BIG TONY: the pit boss

def big_tony():
    cn = 'BigTony'
    skin, suit, stripe = '#a8927a', '#4a3a2e', '#3a2c22'
    parts = [leg(cn, -1, (-62, 130), (-70, 0), 40, 32, suit, '#16141c', 46, 30),
             leg(cn, 1, (62, 130), (70, 0), 40, 32, suit, '#16141c', 46, 30)]
    for lp, s in zip(parts, (-1, 1)):
        lp.flat(rect(s * 70 - 40, 26, s * 70 + 40, 36), '#f0ece0', smooth=False)
    b = part(cn + '_Body', BODY, (0, 130), 1)
    td = S(b, M([(0, 380), (110, 372), (178, 320), (176, 190), (140, 116), (0, 100)]), suit)
    for i in range(-8, 9):
        b.clipped(td, rect(i * 21 - 1.5, 90, i * 21 + 1.5, 390), stripe, smooth=False)
    b.clipped(td, M([(0, 380), (44, 380), (0, 220)]), '#f0ece0', smooth=False)           # shirt V
    b.clipped(td, [(-13, 372), (13, 372), (17, 250), (0, 226), (-17, 250)], '#2a2018', smooth=False)   # apron strap
    for s in (-1, 1):
        b.clipped(td, [(s * 44, 384), (s * 96, 372), (s * 20, 214), (s * 4, 226)], shade(suit, 1.5), smooth=False)   # lapels
    b.stroke([(-96, 300), (-40, 236), (0, 222), (40, 236), (96, 300)], '#7e8494', 9)
    b.circle(0, 222, 17, '#7e8494'); b.circle(0, 222, 8, '#2a2018')
    b.clipped(td, M([(0, 214), (92, 206), (112, 118), (0, 110)]), '#5a3a26', smooth=False)   # leather apron
    splat(b, td, (38, 170), 26, seed=4); splat(b, td, (-52, 150), 18, seed=9)
    b.clipped(td, rect(-190, 122, 190, 140), '#16141c', smooth=False); b.clipped(td, rrect(0, 131, 30, 22, 4), GOLD, smooth=False)
    parts.append(b)
    h = part(cn + '_Head', HEAD, (0, 366), 2)
    hd = S(h, rrect(0, 410, 150, 110, 46), skin, smooth=False)
    h.clipped(hd, rect(-90, 350, 90, 392), shade(skin, 0.8), smooth=False)                # stubble jowls
    eyes(h, hd, 0, 420, 32, 10, col='#fff0a0', brow='#3a2a22', tilt=0.8)
    S(h, ellipse(0, 400, 17, 13, n=12), shade(skin, 1.08))
    h.flat(rrect(0, 376, 64, 9, 4), '#3a1a1a', smooth=False)
    h.flat(rect(26, 368, 92, 380), '#7a4a2a', smooth=False); h.circle(94, 374, 8, '#ff8a30'); h.circle(94, 374, 4, '#ffe080')
    hat(h, 0, 450, 62, 52, 116, '#22222e', band='#3a2c22', dent=0.22, brim_h=12)
    parts.append(h)
    parts.append(arm(cn, -1, (-164, 330), (-218, 240), (-206, 150), 44, 36, suit, skin, 40, kind='fist', ring='#7e8494'))
    parts.append(arm(cn, 1, (164, 330), (218, 240), (206, 150), 44, 36, suit, skin, 40, kind='fist', ring='#7e8494'))
    for a in parts[-2:]:
        s = -1 if a.role == ARM_B else 1
        a.flat(rect(s * 206 - 38, 150, s * 206 + 38, 164), '#f0ece0', smooth=False)
    return parts


# ================================================================== 15. ABOMINATION: three bodies stitched into one

def abomination():
    cn = 'Abomination'
    a_, b_, c_ = '#c8a090', '#9a8aa8', '#c8b480'
    p = leg(cn, -1, (-64, 120), (-72, 0), 44, 34, a_, None, 0, 20)
    S(p, rrect(-72, 16, 84, 34, 14), shade(a_, 0.9), smooth=False)
    parts = [p]
    p = part(cn + '_LegFront', LEG_F, (64, 120), 0)                                     # peg leg
    S(p, path_limb([(64, 120), (66, 70)], [40, 30]), b_)
    P(p, [(48, 72), (84, 72), (76, 0), (58, 0)], '#7a5a3a'); p.flat(rect(46, 66, 86, 76), '#8a8f9c', smooth=False)
    parts.append(p)
    b = part(cn + '_Body', BODY, (0, 120), 1)
    out = M([(0, 360), (110, 352), (176, 290), (168, 170), (120, 100), (0, 84)])
    td = S(b, out, a_)
    b.clipped(td, [(0, 400), (200, 400), (200, 210), (30, 230), (-10, 300)], b_, smooth=False)
    b.clipped(td, [(-200, 200), (-20, 214), (40, 150), (60, 60), (-200, 60)], c_, smooth=False)
    for (p0, p1) in (((-10, 300), (30, 230)), ((30, 230), (176, 212)), ((-20, 214), (40, 150)), ((-170, 200), (-20, 214)), ((0, 360), (-10, 300))):
        b.stroke([p0, p1], '#3a2a2a', 4)
        for k in range(1, 5):
            c = lerp(p0, p1, k / 5)
            dx, dy = p1[0] - p0[0], p1[1] - p0[1]; L = math.hypot(dx, dy)
            b.stroke([(c[0] - dy / L * 9, c[1] + dx / L * 9), (c[0] + dy / L * 9, c[1] - dx / L * 9)], '#3a2a2a', 3.5)
    b.clipped(td, rect(-190, 150, 190, 166), '#4a3a30', smooth=False)
    P(b, mv(rrect(0, 0, 40, 46, 6), 20, 132), GOLD); b.stroke([(8, 154), (8, 172), (32, 172), (32, 154)], '#8a8f9c', 6)
    parts.append(b)
    h = part(cn + '_Head', HEAD, (10, 340), 2)                                           # cyclops
    hd = S(h, rrect(10, 396, 124, 116, 48), b_, smooth=False)
    h.circle(10, 412, 30, SOCKET); h.circle(12, 408, 17, '#cfc39a'); h.circle(12, 408, 8, '#8a1f24'); h.circle(12, 408, 3, INK)
    h.flat([(-24, 418), (44, 436), (44, 446), (-24, 446)], SOCKET, smooth=False)
    mouth(h, hd, 10, 360, 70, 22, top=5, bot=4, th=0.5)
    parts.append(h)
    pr = part(cn + '_Prop', PROP, (-110, 340), 1.5)                                      # pig head on the shoulder
    pd = S(pr, rrect(-118, 376, 92, 82, 36), '#a88a86', smooth=False)
    P(pr, [(-158, 400), (-150, 436), (-130, 412)], '#a88a86'); P(pr, [(-78, 400), (-86, 436), (-106, 412)], '#a88a86')
    for ex in (-136, -100):
        pr.flat(ellipse(ex, 386, 10, 9, n=10), SOCKET); pr.flat([(ex - 6, 390), (ex + 6, 382), (ex + 5, 380), (ex - 7, 388)], '#8a4050', smooth=False); pr.flat([(ex - 6, 382), (ex + 6, 390), (ex + 5, 392), (ex - 7, 384)], '#8a4050', smooth=False)
    S(pr, ellipse(-118, 362, 22, 15, n=12), '#c9949c'); pr.circle(-126, 362, 4.5, '#5a2030'); pr.circle(-110, 362, 4.5, '#5a2030')
    pr.clipped(pd, rect(-170, 336, -60, 346), '#5a2030', smooth=False)
    for sx in range(-158, -76, 14): pr.clipped(pd, rect(sx, 330, sx + 3, 352), INK, smooth=False)
    splat(pr, pd, (-150, 404), 16, seed=5)
    parts.append(pr)
    parts.append(arm(cn, -1, (-160, 300), (-216, 210), (-200, 120), 40, 30, c_, c_, 36, ang=-90, claw=BONE, fingers=3))
    a = arm(cn, 1, (160, 300), (214, 230), (220, 170), 40, 30, b_, b_, 0, kind='none')
    a.flat(rect(206, 120, 234, 176), '#5a5a64', smooth=False)
    pts = []
    for i in range(24):
        ang = 2 * math.pi * i / 24; r = 62 if i % 2 else 48
        pts.append((220 + math.cos(ang) * r, 84 + math.sin(ang) * r))
    sd = P(a, pts, '#c8ccd4'); a.circle(220, 84, 14, '#5a5a64'); splat(a, sd, (244, 104), 20, seed=2)
    parts.append(a)
    return parts


# ================================================================== 16. MOTHER CARRION: the vulture queen

def mother_carrion():
    cn = 'Carrion'
    fea, pink, egg = '#342e40', '#d88a8a', '#c8324a'
    parts = []
    for s in (-1, 1):
        p = leg(cn, s, (s * 36, 150), (s * 44, 0), 15, 10, '#c8a040', None, 0, 12)
        hand(p, (s * 44, 12), 15, '#c8a040', ang=-90, fingers=3, claw=INK, spread=50, flen=0.6)
        parts.append(p)
        role = WING_F if s > 0 else WING_B
        w = part('%s_%s' % (cn, role), role, (s * 60, 300), 0.5)
        pts = [(s * 50, 330), (s * 180, 400), (s * 330, 380), (s * 306, 330), (s * 322, 280), (s * 270, 270), (s * 280, 214), (s * 224, 216), (s * 226, 160), (s * 170, 174), (s * 160, 124), (s * 110, 150), (s * 50, 170)]
        P(w, pts if s > 0 else pts[::-1], fea)
        w.flat(path_limb([(s * 56, 320), (s * 178, 386), (s * 318, 372)], [15, 11, 4]), shade(fea, 1.5))
        parts.append(w)
    b = part(cn + '_Body', BODY, (0, 150), 1)
    td = S(b, M([(0, 350), (60, 336), (86, 250), (64, 150), (0, 124)]), fea)
    b.clipped(td, ellipse(0, 204, 52, 60, n=16), egg)
    for (x, y, r) in ((-18, 224, 14), (20, 208, 12), (-6, 176, 13), (26, 238, 8), (-30, 190, 7)):
        b.circle(x, y, r, '#f0a0a0'); b.circle(x - r * 0.25, y + r * 0.25, r * 0.4, '#fff0e0')
    S(b, M([(0, 366), (30, 372), (66, 356), (72, 320), (44, 332), (22, 310), (0, 326)]), '#e8e0d0')    # ruff
    parts.append(b)
    h = part(cn + '_Head', HEAD, (0, 340), 2)
    S(h, path_limb([(0, 340), (0, 410)], [17, 15]), pink)
    hd = S(h, rrect(0, 440, 84, 78, 34), pink, smooth=False)
    eyes(h, hd, 0, 450, 20, 9, col='#ffe060', brow=shade(pink, 0.7), tilt=0.9)
    P(h, [(-15, 436), (15, 436), (8, 396), (0, 376), (-8, 396)], '#3a3030')
    P(h, [(-30, 476), (-30, 506), (-15, 490), (0, 512), (15, 490), (30, 506), (30, 476)], GOLD)
    h.circle(0, 484, 5, egg)
    parts.append(h)
    return parts


# ================================================================== 17. THE CROUPIER: four-armed dealer

def croupier():
    cn = 'Croupier'
    skin, vest, shirt = '#9aa89c', '#1c1a22', '#cfc6b0'
    parts = [leg(cn, -1, (-24, 220), (-28, 0), 18, 14, '#1c1a22', '#101014', 28, 22),
             leg(cn, 1, (24, 220), (28, 0), 18, 14, '#1c1a22', '#101014', 28, 22)]
    b = part(cn + '_Body', BODY, (0, 220), 1)
    td = S(b, M([(0, 420), (50, 414), (60, 380), (44, 220), (0, 204)]), vest)
    b.clipped(td, M([(0, 420), (30, 420), (0, 300)]), shirt, smooth=False)
    b.clipped(td, [(-18, 404), (0, 396), (18, 404), (18, 386), (0, 394), (-18, 386)], '#3a3440', smooth=False)
    for i in range(4):
        b.circle(0, 280 - i * 22, 4.5, BONE)
    b.clipped(td, M([(0, 204), (50, 204), (0, 250)]), '#1c1a22', smooth=False)
    parts.append(b)
    h = part(cn + '_Head', HEAD, (0, 414), 2)
    hd = S(h, M([(0, 510), (40, 502), (52, 462), (38, 424), (0, 414)]), skin)
    eyes(h, hd, 0, 462, 21, 9, col='#fff0a0', pupil=None)
    md = h.flat(M([(0, 444), (34, 450), (30, 434), (0, 428)]), '#2a1216')
    for i in range(6):
        h.clipped(md, rect(-28 + i * 10, 438, -21 + i * 10, 452), BONE, smooth=False)
    hat(h, 0, 494, 66, 40, 124, '#141218', band='#3a3440', brim_h=9)                        # wide flat-brimmed hat
    parts.append(h)
    parts.append(arm(cn, -1, (-52, 372), (-90, 320), (-80, 262), 12, 10, shirt, skin, 16, ang=-90, fingers=4, spread=24, flen=1.2))
    parts.append(arm(cn, 1, (52, 372), (90, 320), (80, 262), 12, 10, shirt, skin, 16, ang=-90, fingers=4, spread=24, flen=1.2))
    for s, nm in ((-1, 'B'), (1, 'F')):
        a = arm(cn, s, (s * 50, 398), (s * 108, 420), (s * 104, 486), 12, 10, shirt, skin, 16, layer=0.5, ang=90, fingers=4, spread=24, flen=1.0)
        a.name = cn + '_ArmUpper' + nm
        a.role = PROP
        if s > 0:
            for k in range(-2, 3):
                ang = math.radians(90 - k * 20)
                c = (104 + math.cos(ang) * 44, 500 + math.sin(ang) * 44)
                ux, uy = math.cos(ang), math.sin(ang)
                card = [(c[0] - uy * 15 - ux * 24, c[1] + ux * 15 - uy * 24), (c[0] + uy * 15 - ux * 24, c[1] - ux * 15 - uy * 24), (c[0] + uy * 15 + ux * 24, c[1] - ux * 15 + uy * 24), (c[0] - uy * 15 + ux * 24, c[1] + ux * 15 + uy * 24)]
                P(a, [(c[0] - uy * 5 - ux * 26, c[1] + ux * 5 - uy * 26), (c[0] + uy * 5 - ux * 26, c[1] - ux * 5 - uy * 26), (c[0] + ux * 40, c[1] + uy * 40)], '#b9bcc6')   # a coffin nail
                a.flat(rrect(c[0] - ux * 26, c[1] - uy * 26, 16, 7, 2), '#7e8494', smooth=False)
        else:
            a.flat(rrect(-104, 536, 12, 70, 3), '#6b4a30', smooth=False)                    # a mallet
            a.flat(rrect(-104, 574, 58, 28, 5), '#4a4e5a', smooth=False)
        parts.append(a)
    return parts


# ================================================================== 18. THE GRAVEDIGGER: top-hatted skeleton with a shovel

def gravedigger():
    cn = 'Gravedigger'
    coat = '#24202a'
    parts = [leg(cn, -1, (-26, 250), (-30, 0), 9, 7, BONE, '#18141a', 28, 22),
             leg(cn, 1, (26, 250), (30, 0), 9, 7, BONE, '#18141a', 28, 22)]
    b = part(cn + '_Body', BODY, (0, 250), 1)
    td = S(b, M([(0, 470), (56, 462), (66, 420), (58, 300), (84, 120), (40, 132), (0, 110)]), coat)
    b.clipped(td, M([(0, 470), (22, 470), (16, 250), (0, 240)]), '#3a3440', smooth=False)
    for i in range(5):
        b.clipped(td, path_limb([(-17, 430 - i * 26), (0, 424 - i * 26), (17, 430 - i * 26)], [3, 4.5, 3]), BONE)
    b.clipped(td, rect(-3, 300, 3, 450), BONE, smooth=False)
    parts.append(b)
    h = part(cn + '_Head', HEAD, (0, 462), 2)
    hd = S(h, M([(0, 560), (44, 552), (54, 514), (40, 486), (26, 466), (0, 462)]), BONE)
    for s in (-1, 1):
        h.flat(ellipse(s * 22, 520, 14, 16, n=10), INK); h.circle(s * 22, 520, 6, '#ffb030')
    h.flat([(-6, 498), (6, 498), (0, 484)], INK, smooth=False)
    md = h.flat(rect(-26, 468, 26, 480), INK, smooth=False)
    for i in range(6):
        h.flat(rect(-24 + i * 8.5, 468, -19 + i * 8.5, 480), BONE, smooth=False)
    hat(h, 0, 556, 44, 104, 78, '#18141a', band='#6a2030', taper=1.06, brim_h=9)
    parts.append(h)
    a = arm(cn, -1, (-60, 448), (-104, 380), (-100, 310), 13, 11, coat, BONE, 16, ang=-90, fingers=4, spread=22, flen=1.1)
    a.stroke([(-100, 290), (-100, 262)], '#8a8f9c', 4)
    P(a, mv(rrect(0, 0, 48, 64, 10), -100, 228), '#3a3444'); a.flat(ellipse(-100, 228, 14, 22, n=12), '#ffb030'); a.flat(ellipse(-100, 224, 7, 11, n=10), '#fff0c0')
    parts.append(a)
    a = arm(cn, 1, (60, 448), (108, 390), (112, 420), 13, 11, coat, BONE, 0, kind='none')
    a.flat(rect(106, 60, 118, 520), '#6a4a30', smooth=False)
    P(a, [(84, 520), (140, 520), (144, 600), (112, 640), (80, 600)], '#9aa0aa'); a.flat([(84, 520), (140, 520), (140, 534), (84, 534)], '#6a707c', smooth=False)
    fist(a, (112, 420), 17, BONE)
    parts.append(a)
    return parts


# ================================================================== FINAL: THE LAST DEALER, a towering skeletal croupier with four arms

def last_dealer():
    cn = 'LastDealer'
    coat, trim, red = '#2c1c26', '#b08a3a', '#8a1f24'
    parts = [leg(cn, -1, (-40, 150), (-46, 0), 26, 20, '#1a0e14', '#0c0608', 40, 26),
             leg(cn, 1, (40, 150), (46, 0), 26, 20, '#1a0e14', '#0c0608', 40, 26)]
    for lp, s in zip(parts, (-1, 1)):
        pass
    b = part(cn + '_Body', BODY, (0, 150), 1)
    td = S(b, M([(0, 430), (96, 424), (150, 380), (128, 250), (104, 140), (0, 124)]), coat)
    b.clipped(td, M([(0, 430), (40, 430), (0, 250)]), '#cfc6b0', smooth=False)                   # grave-stained shirt
    b.clipped(td, [(-11, 424), (11, 424), (15, 300), (0, 278), (-15, 300)], '#141018', smooth=False)   # black string tie
    for s in (-1, 1):
        b.clipped(td, [(s * 40, 432), (s * 92, 422), (s * 22, 262), (s * 4, 274)], trim, smooth=False)   # gold lapels
    # the coat hangs open on a ribcage with something still burning inside
    b.clipped(td, rrect(0, 210, 150, 58, 8), '#1a0e14', smooth=False)
    for i in (-1, 0, 1):
        b.clipped(td, rrect(0, 210 + i * 17, 132 - abs(i) * 14, 9, 4), BONE, smooth=False)   # ribs
    b.clipped(td, rect(-5, 184, 5, 236), BONE, smooth=False)
    b.circle(0, 210, 13, '#ff5a20', opacity=0.95); b.circle(0, 210, 6, '#ffe080')
    b.clipped(td, rect(-160, 146, 160, 162), '#1a0e14', smooth=False); b.clipped(td, rrect(0, 154, 34, 22, 4), trim, smooth=False)
    parts.append(b)
    h = part(cn + '_Head', HEAD, (0, 420), 2)
    hd = S(h, M([(0, 540), (64, 530), (78, 480), (58, 440), (38, 418), (0, 412)]), BONE)
    for s in (-1, 1):
        h.flat(ellipse(s * 30, 488, 20, 22, n=12), INK); h.circle(s * 30, 488, 9, '#ff3020'); h.circle(s * 30, 488, 4, '#ffe080')
    h.flat([(-8, 458), (8, 458), (0, 440)], INK, smooth=False)
    h.flat(rect(-38, 418, 38, 434), INK, smooth=False)
    for i in range(8):
        h.flat(rect(-36 + i * 9.2, 418, -30 + i * 9.2, 434), trim if i in (2, 5) else BONE, smooth=False)   # gold teeth
    # a crown of rusted iron spikes
    h.flat(rect(-66, 536, 66, 552), '#3a3440', smooth=False); h.flat(rect(-66, 548, 66, 553), trim, smooth=False)
    for k in range(-2, 3):
        cx = k * 30
        P(h, [(cx - 12, 550), (cx + 12, 550), (cx + (k * 3), 622 - abs(k) * 12)], '#4a4450')
    parts.append(h)
    parts.append(arm(cn, -1, (-132, 392), (-196, 300), (-184, 200), 34, 26, coat, BONE, 30, ang=-90, fingers=4, claw=trim, spread=24, flen=1.2))
    parts.append(arm(cn, 1, (132, 392), (196, 300), (184, 200), 34, 26, coat, BONE, 30, ang=-90, fingers=4, claw=trim, spread=24, flen=1.2))
    for a in parts[-2:]:
        s = -1 if a.role == ARM_B else 1
        a.flat(rect(s * 184 - 30, 204, s * 184 + 30, 218), trim, smooth=False)
    # upper pair: raised, each holding a fan of long blades
    for s, nm in ((-1, 'B'), (1, 'F')):
        a = arm(cn, s, (s * 110, 410), (s * 190, 440), (s * 196, 520), 24, 18, coat, BONE, 24, layer=0.5, ang=90, fingers=4, spread=24, flen=1.0)
        a.name = cn + '_ArmUpper' + nm
        a.role = PROP
        for k in range(-2, 3):
            ang = math.radians(90 - k * 18 * s)
            c0 = (s * 196 + math.cos(ang) * 60, 540 + math.sin(ang) * 60)
            ux, uy = math.cos(ang), math.sin(ang)
            vx, vy = -uy, ux
            P(a, [(c0[0] - vx * 7 - ux * 30, c0[1] - vy * 7 - uy * 30), (c0[0] + vx * 7 - ux * 30, c0[1] + vy * 7 - uy * 30), (c0[0] + vx * 3 + ux * 20, c0[1] + vy * 3 + uy * 20), (c0[0] + ux * 46, c0[1] + uy * 46)], '#b9bcc6')
            a.flat([(c0[0] - vx * 9 - ux * 32, c0[1] - vy * 9 - uy * 32), (c0[0] + vx * 9 - ux * 32, c0[1] + vy * 9 - uy * 32), (c0[0] + vx * 9 - ux * 26, c0[1] + vy * 9 - uy * 26), (c0[0] - vx * 9 - ux * 26, c0[1] - vy * 9 - uy * 26)], '#3a3440', smooth=False)
        parts.append(a)
    return parts


BIPEDS = ('Shambler', 'Sprinter', 'Bloater', 'Spitter', 'Brute', 'Screamer', 'Gilded', 'Riot', 'Priest')
BOSS_BIPEDS = ('BigTony', 'Croupier', 'Gravedigger', 'LastDealer')


def restyle(cname, parts):
    """Adult proportions instead of a child's: a smaller, narrower head, longer legs and arms. Then break the outline:
    rags hanging off the hem, a shard of bone through one shoulder."""
    if cname in BIPEDS:
        head, legk, legw, armk = (0.74, 0.84), 1.22, 0.9, 1.12
    elif cname in BOSS_BIPEDS:
        head, legk, legw, armk = (0.88, 0.94), 1.08, 0.95, 1.04
    else:
        return parts
    hips = [p.pivot[1] for p in parts if p.role in (LEG_F, LEG_B)]
    dy = (legk - 1) * (max(hips) if hips else 0)
    for p in parts:
        px, py = p.pivot
        if p.role == BODY and cname in BIPEDS and p.pts_all:
            x0, y0, x1, y1 = min(q[0] for q in p.pts_all), min(q[1] for q in p.pts_all), max(q[0] for q in p.pts_all), max(q[1] for q in p.pts_all)
            w, col = x1 - x0, shade(getattr(p, 'base_col', '#5c4a40'), 0.82)
            for i in range(5):
                x = x0 + w * (0.16 + 0.17 * i)
                p.flat([(x - 10, y0 + 8), (x + 10, y0 + 8), (x + (i % 3 - 1) * 6, y0 - 14 - (i * 37) % 19)], col, smooth=False)
            sh = [q.pivot for q in parts if q.role == ARM_F]
            if sh:
                sx, sy = sh[0][0] - 10, sh[0][1] - 4
                p.flat([(sx - 9, sy), (sx + 7, sy - 4), (sx + 12, sy + 26)], BONE, smooth=False)
                p.flat([(sx - 11, sy + 3), (sx + 9, sy - 2), (sx + 4, sy - 12), (sx - 10, sy - 9)], BLOOD, smooth=False)
        if p.role in (LEG_F, LEG_B):
            p.xf = (legw, legk, px, 0, 0, 0); p.pivot = (px, py * legk)
        elif p.role == HEAD:
            p.xf = (head[0], head[1], px, py, 0, dy); p.pivot = (px, py + dy)
        elif p.role in (ARM_F, ARM_B):
            p.xf = (0.94, armk, px, py, 0, dy); p.pivot = (px, py + dy)
        else:
            p.xf = (1, 1, px, py, 0, dy); p.pivot = (px, py + dy)
    return parts


def _styled(name, fn):
    return lambda: restyle(name, fn())


ROSTER = [
    ('Shambler', shambler), ('Sprinter', sprinter), ('Crawler', crawler), ('Bloater', bloater), ('Spitter', spitter),
    ('Leaper', leaper), ('Wisp', wisp), ('Brute', brute), ('Screamer', screamer), ('Burrower', burrower),
    ('Gilded', gilded), ('Riot', riot), ('Priest', priest),
    ('BigTony', big_tony), ('Abomination', abomination), ('Carrion', mother_carrion), ('Croupier', croupier), ('Gravedigger', gravedigger), ('LastDealer', last_dealer),
]
ROSTER = [(n, _styled(n, f)) for n, f in ROSTER]
