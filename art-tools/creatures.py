"""
Polyshot creature art: FRONT-FACING flat vector cut-outs, flat fills with one hard shadow tone, no outlines, no
gradients, muted palettes with a single accent. The figures are drawn to real anatomy: about seven heads tall, a
ribcage that narrows to a waist, shoulders two and a half heads wide, arms that reach mid-thigh with an elbow and a
wrist, legs half the height with a knee and a calf, hands with four fingers and a thumb. They are corpses, so the
flesh is wasted over that frame: the skull shows through the face, the ribs through the chest.

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



# ================================================================== anatomy
# Everything below is built on one figure. `fig(H, w)` gives the landmarks of a person H units tall and w times as broad
# as an average build; the limb and head builders hang flesh on those landmarks.

def fig(H=400, w=1.0, hw=1.0):
    k = H / 400.0
    return dict(k=k, w=w, H=H, chin=344 * k, neck=326 * k, head_w=21 * k * hw, head_h=56 * k,
                sh=(50 * k * w, 314 * k), el=(58 * k * w, 246 * k), wr=(57 * k * w, 190 * k),
                hip=(20 * k * w, 200 * k), knee=(23 * k * w, 104 * k), ank=(22 * k * w, 16 * k))


def torso_pts(F, belly=0.0, chest=1.0, slump=0.0):
    """Half outline (x >= 0) from the pit of the neck down to the crotch. `belly` pushes the abdomen out; `chest` deepens
    the ribcage; `slump` drops the shoulders."""
    k, w = F['k'], F['w']
    return [(0, 331 * k), (9 * k, 331 * k), (30 * k * w, (326 - slump * 4) * k), (52 * k * w, (319 - slump * 9) * k), (55 * k * w, (305 - slump * 9) * k),
            (46 * k * w * chest, 288 * k), (44 * k * w * chest, 268 * k), ((38 + belly * 22) * k * w, 248 * k), ((33 + belly * 34) * k * w, 232 * k),
            ((37 + belly * 26) * k * w, 216 * k), (40 * k * w, 203 * k), (37 * k * w, 190 * k), (0, 184 * k)]


def ribs(b, td, F, col, n=4, y0=292, sternum=True, op=0.55):
    """Ribs showing through the skin: thin shadows that drop from the breastbone and curve out and down."""
    k, w = F['k'], F['w']
    for s in (-1, 1):
        for i in range(n):
            y = (y0 - i * 12) * k
            b.clipped(td, [(s * 4 * k, y), (s * 22 * k * w, y - 4 * k), (s * 42 * k * w, y - 13 * k), (s * 42 * k * w, y - 17 * k), (s * 22 * k * w, y - 9 * k), (s * 4 * k, y - 4.5 * k)], col, opacity=op)
    if sternum:
        b.clipped(td, [(-2.2 * k, (y0 + 12) * k), (2.2 * k, (y0 + 12) * k), (1.6 * k, (y0 - n * 12 + 4) * k), (-1.6 * k, (y0 - n * 12 + 4) * k)], col, smooth=False, opacity=op)
    for s in (-1, 1):   # collar bones
        b.clipped(td, [(s * 5 * k, 322 * k), (s * 30 * k * w, 318 * k), (s * 46 * k * w, 313 * k), (s * 46 * k * w, 309.5 * k), (s * 30 * k * w, 314 * k), (s * 5 * k, 318 * k)], col, opacity=op * 0.8)


def skull(cn, F, skin, cx=0.0, tilt=0.0, jaw=0.0, eye='#f1e3a0', hair=None, layer=2, teeth=(5, 4), gaunt=1.0, neck=True, brow=1.0, ears=True):
    """Head and neck. The outline is a skull with skin on it: wide at the temples, cheekbones, a narrow jaw. `jaw` drops
    the lower jaw open (0..1). Returns (part, face clip path, landmarks)."""
    k = F['k']; hw = F['head_w']; cy = F['chin']
    h = part(cn + '_Head', HEAD, (cx, F['neck'] - 4 * k), layer)
    u = hw / 21.0                                  # head units
    X = lambda x: cx + x * u + tilt * 0.0
    Y = lambda y: cy + y * u
    if neck:
        S(h, [(X(-8.5), Y(8)), (X(8.5), Y(8)), (X(10.5), Y(-16)), (X(13), Y(-22)), (X(-13), Y(-22)), (X(-10.5), Y(-16))], shade(skin, 0.86))
        for s in (-1, 1):   # the cords of the neck
            h.flat([(X(s * 2.5), Y(4)), (X(s * 5.5), Y(4)), (X(s * 8), Y(-19)), (X(s * 6), Y(-19))], shade(skin, 0.66), smooth=False, opacity=0.7)
    d = jaw * 11
    half = [(0, 57), (11, 55), (18.5, 47), (21, 36), (19.5, 25), (17 * gaunt, 15 - d * 0.3), (13 * gaunt, 5 - d * 0.8), (7, -0.5 - d), (0, -1.5 - d)]
    hd = S(h, [(X(x), Y(y)) for x, y in M(half)], skin)
    if ears:
        for s in (-1, 1):
            S(h, ellipse(X(s * 21.5), Y(30), 3.2 * u, 6.5 * u, n=10), shade(skin, 0.88))
    # the hollows: temples, under the cheekbones
    for s in (-1, 1):
        h.clipped(hd, [(X(s * 21), Y(40)), (X(s * 15.5), Y(43)), (X(s * 16.5), Y(34)), (X(s * 21), Y(30))], shade(skin, 0.7), opacity=0.55)
        h.clipped(hd, [(X(s * 19), Y(23)), (X(s * 9), Y(20)), (X(s * 11), Y(8 - d * 0.6)), (X(s * 16.5), Y(13 - d * 0.4))], shade(skin, 0.62), opacity=0.6)
    # brow, sockets, the point of light in each
    h.clipped(hd, [(X(-19), Y(38)), (X(-9), Y(36.5)), (X(0), Y(38)), (X(9), Y(36.5)), (X(19), Y(38)), (X(18), Y(40.5 + brow)), (X(0), Y(41 + brow)), (X(-18), Y(40.5 + brow))], shade(skin, 0.58), smooth=False, opacity=0.75)
    for s in (-1, 1):
        sock = [(X(s * 3.2), Y(33)), (X(s * 8), Y(36.4)), (X(s * 14.6), Y(35.2)), (X(s * 15.6), Y(30)), (X(s * 12), Y(26.4)), (X(s * 5.6), Y(27.2))]
        sd = h.flat(sock, SOCKET, smooth=True)
        if eye:
            h.clipped(sd, ellipse(X(s * 9.6), Y(30.6), 1.9 * u, 1.9 * u, n=8), eye)
    # the nose is a hole
    h.clipped(hd, [(X(0), Y(26.5)), (X(3.4), Y(18)), (X(1.2), Y(16.6)), (X(0), Y(18.6)), (X(-1.2), Y(16.6)), (X(-3.4), Y(18))], SOCKET, smooth=False)
    # the mouth: no lips left, so the teeth are simply there
    my = 9.2 - d * 0.45
    mw, mh = 11.5, 2.6 + d * 0.9
    md = h.clipped(hd, [(X(-mw), Y(my + 1)), (X(-mw + 2), Y(my + mh)), (X(mw - 2), Y(my + mh)), (X(mw), Y(my + 1)), (X(mw - 2.5), Y(my - mh)), (X(-mw + 2.5), Y(my - mh))], '#24100f', smooth=False)
    rnd = random.Random(int(F['H'] * 3 + cx * 7 + len(cn) * 13))
    tw = (mw * 2 - 4) / max(1, teeth[0])
    for i in range(teeth[0]):
        if rnd.random() < 0.14:
            continue
        x0 = -mw + 2 + i * tw
        L = 2.3 + rnd.random() * 1.2 + d * 0.15
        h.clipped(hd, [(X(x0 + 0.25), Y(my + mh)), (X(x0 + tw - 0.25), Y(my + mh)), (X(x0 + tw - 0.5), Y(my + mh - L)), (X(x0 + 0.5), Y(my + mh - L))], BONE if rnd.random() < 0.6 else mixc(BONE, '#a8905c', 0.35), smooth=False)
    if d > 1.5:
        tw2 = (mw * 2 - 7) / max(1, teeth[1])
        for i in range(teeth[1]):
            if rnd.random() < 0.2:
                continue
            x0 = -mw + 3.5 + i * tw2
            L = 1.8 + rnd.random() * 1.2
            h.clipped(hd, [(X(x0 + 0.3), Y(my - mh)), (X(x0 + tw2 - 0.3), Y(my - mh)), (X(x0 + tw2 - 0.6), Y(my - mh + L)), (X(x0 + 0.6), Y(my - mh + L))], mixc(BONE, '#a8905c', 0.3), smooth=False)
    if hair:
        kind, col = hair
        if kind == 'thin':      # a few strands left across a bald scalp
            for i, x in enumerate((-12, -4, 5, 13)):
                h.clipped(hd, [(X(x - 1.2), Y(57)), (X(x + 1.2), Y(57)), (X(x + 2.5 + i), Y(44 - i * 1.5)), (X(x + 0.8 + i), Y(44 - i * 1.5))], col, smooth=False, opacity=0.9)
        elif kind == 'cap':     # cropped
            h.clipped(hd, [(X(-22), Y(60)), (X(22), Y(60)), (X(22), Y(42)), (X(15), Y(47)), (X(6), Y(45.5)), (X(-8), Y(47.5)), (X(-17), Y(45)), (X(-22), Y(41))], col, smooth=False)
        elif kind == 'long':    # lank hair to the shoulders
            S(h, [(X(-20), Y(52)), (X(-24), Y(30)), (X(-27), Y(-4)), (X(-22), Y(-26)), (X(-15), Y(-8)), (X(-17), Y(20)), (X(-15), Y(44))], col)
            S(h, [(X(20), Y(52)), (X(24), Y(30)), (X(26), Y(0)), (X(21), Y(-20)), (X(15), Y(-6)), (X(17), Y(20)), (X(15), Y(44))], col)
            h.clipped(hd, [(X(-22), Y(60)), (X(22), Y(60)), (X(21), Y(44)), (X(9), Y(49)), (X(0), Y(45)), (X(-10), Y(49.5)), (X(-21), Y(43))], col, smooth=False)
    return h, hd, dict(X=X, Y=Y, u=u, d=d, cx=cx, cy=cy)


def hand2(p, c, r, col, ang=-90, claw=None, curl=0.0, spread=17, thumb=1):
    """A hand: a palm that narrows to the wrist, four fingers of two joints each and a thumb set low on one side.
    `r` is half the palm's width; `ang` is the way the fingers point; `thumb` is which side it is on (+1 / -1)."""
    a = math.radians(ang)
    ux, uy = math.cos(a), math.sin(a); nx, ny = -uy, ux
    pt = lambda f, sdw: (c[0] + ux * f * r + nx * sdw * r, c[1] + uy * f * r + ny * sdw * r)
    dark = shade(col, 0.7)
    for i in range(4):
        off = (i - 1.5) * 0.52
        fa = a + math.radians((i - 1.5) * spread)
        L = (1.75, 2.0, 1.9, 1.5)[i] * (1 - 0.35 * curl)
        b0 = pt(0.85, off)
        mid = (b0[0] + math.cos(fa) * r * L * 0.55, b0[1] + math.sin(fa) * r * L * 0.55)
        fa2 = fa + math.radians(-thumb * 38 * curl)
        tip = (mid[0] + math.cos(fa2) * r * L * 0.5, mid[1] + math.sin(fa2) * r * L * 0.5)
        if claw:
            p.flat(path_limb([tip, (tip[0] + math.cos(fa2) * r * 0.7, tip[1] + math.sin(fa2) * r * 0.7)], [r * 0.17, r * 0.03], n_end=3), claw)
        p.shape(path_limb([b0, mid, tip], [r * 0.25, r * 0.21, r * 0.15], n_end=5), col, lit=False)
        p.flat(ellipse(mid[0], mid[1], r * 0.14, r * 0.14, n=6), dark, opacity=0.5)   # the knuckle
    t0 = pt(0.1, thumb * 0.9)
    ta = a + math.radians(thumb * 52)
    t1 = (t0[0] + math.cos(ta) * r * 1.15, t0[1] + math.sin(ta) * r * 1.15)
    if claw:
        p.flat(path_limb([t1, (t1[0] + math.cos(ta) * r * 0.6, t1[1] + math.sin(ta) * r * 0.6)], [r * 0.17, r * 0.03], n_end=3), claw)
    p.shape(path_limb([t0, t1], [r * 0.32, r * 0.2], n_end=5), col, lit=False)
    S(p, [pt(-0.75, -0.62), pt(-0.75, 0.62), pt(0.1, 1.0), pt(1.0, 1.0), pt(1.05, 0), pt(1.0, -1.0), pt(0.1, -1.0)], col)
    for i in range(3):   # tendons on the back of the hand
        p.flat([pt(0.9, (i - 1) * 0.5 - 0.05), pt(0.9, (i - 1) * 0.5 + 0.05), pt(-0.3, (i - 1) * 0.22 + 0.04), pt(-0.3, (i - 1) * 0.22 - 0.04)], dark, smooth=False, opacity=0.45)


def arm2(cn, side, F, skin, sleeve=None, sleeve_to=0.5, el=None, wr=None, sh=None, layer=3, claw=None, hand_ang=None, hr=None, curl=0.15, bulk=1.0, hand=True, cuff=None, thumb=None):
    """Shoulder to fingertips. The upper arm tapers to the elbow, which shows as a point of bone; the forearm swells below
    it and narrows to the wrist. `sleeve` (colour) covers the arm down to `sleeve_to` (0..1 of the whole arm) and ends in rags."""
    k = F['k']
    role = ARM_F if side > 0 else ARM_B
    sh = sh or (side * F['sh'][0], F['sh'][1]); el = el or (side * F['el'][0], F['el'][1]); wr = wr or (side * F['wr'][0], F['wr'][1])
    p = part('%s_%s' % (cn, role), role, sh, layer)
    w0, w1, w2, w3 = 15.5 * k * bulk, 12 * k * bulk, 12.5 * k * bulk, 7.8 * k * (0.6 + 0.4 * bulk)
    f1 = lerp(el, wr, 0.3)
    S(p, path_limb([sh, lerp(sh, el, 0.45), el, f1, wr], [w0, w0 * 0.9, w1 * 0.86, w2 * 0.92, w3]), skin)
    out = 1 if el[0] >= (sh[0] + wr[0]) / 2 else -1
    p.flat([(el[0], el[1] + w1 * 0.7), (el[0] + out * w1 * 1.08, el[1] + w1 * 0.05), (el[0], el[1] - w1 * 0.7)], skin, smooth=False)           # the point of the elbow
    p.flat([lerp(el, wr, 0.2), lerp(el, wr, 0.95), (lerp(el, wr, 0.95)[0] + out * 1.4 * k, lerp(el, wr, 0.95)[1]), (lerp(el, wr, 0.2)[0] + out * 2.6 * k, lerp(el, wr, 0.2)[1])], shade(skin, 0.66), smooth=False, opacity=0.5)   # the groove between the forearm bones
    if sleeve:
        cut = sleeve_to * 2                        # 0..1 = upper arm, 1..2 = forearm
        if cut <= 1:
            c0 = lerp(sh, el, cut); pts = [sh, lerp(sh, el, cut * 0.5), c0]; rr = [w0 * 1.12, w0 * 1.04, lerp((w0, 0), (w1, 0), cut)[0] * 1.14]
        else:
            c0 = lerp(el, wr, cut - 1); pts = [sh, lerp(sh, el, 0.45), el, c0]; rr = [w0 * 1.12, w0 * 1.02, w1 * 1.05, lerp((w2, 0), (w3, 0), cut - 1)[0] * 1.2]
        S(p, path_limb(pts, rr), sleeve)
        dx, dy = pts[-1][0] - pts[-2][0], pts[-1][1] - pts[-2][1]
        dl = math.hypot(dx, dy) or 1; ux, uy = dx / dl, dy / dl; nx, ny = -uy, ux
        r = rr[-1]
        for j in (-1, 0, 1):                       # the cuff is rags
            b = (c0[0] + nx * j * r * 0.62, c0[1] + ny * j * r * 0.62)
            p.flat([(b[0] + nx * r * 0.34, b[1] + ny * r * 0.34), (b[0] - nx * r * 0.34, b[1] - ny * r * 0.34), (b[0] + ux * r * (0.9 + 0.5 * ((j + 2) % 3)), b[1] + uy * r * (0.9 + 0.5 * ((j + 2) % 3)))], cuff or sleeve, smooth=False)
        if cut > 1:
            p.flat([(el[0], el[1] + w1 * 0.75), (el[0] + out * w1 * 1.16, el[1] + w1 * 0.05), (el[0], el[1] - w1 * 0.75)], sleeve, smooth=False)
    if hand:
        ang = hand_ang if hand_ang is not None else math.degrees(math.atan2(wr[1] - el[1], wr[0] - el[0]))
        r = hr or 7.2 * k
        a = math.radians(ang)
        c = (wr[0] + math.cos(a) * r * 0.9, wr[1] + math.sin(a) * r * 0.9)
        hand2(p, c, r, skin, ang, claw=claw, curl=curl, thumb=thumb if thumb is not None else -side)
        p.hand_c = c
    return p


def leg2(cn, side, F, col, skin=None, torn=0.0, boot='#3a2c26', hip=None, knee=None, ank=None, layer=0, bulk=1.0, bare_foot=False, foot_w=1.0):
    """Hip to sole. The thigh tapers to the knee, the calf swells behind the shin and narrows to the ankle. `col` is the
    trouser; `torn` (0..1) is how far up from the ankle it has been ripped away to show `skin`."""
    k = F['k']
    role = LEG_F if side > 0 else LEG_B
    hip = hip or (side * F['hip'][0], F['hip'][1]); knee = knee or (side * F['knee'][0], F['knee'][1]); ank = ank or (side * F['ank'][0], F['ank'][1])
    p = part('%s_%s' % (cn, role), role, hip, layer)
    t0, t1, c0, c1 = 20.5 * k * bulk, 13.5 * k * bulk, 13.5 * k * bulk, 7.6 * k * (0.6 + 0.4 * bulk)
    calf = lerp(knee, ank, 0.3)
    base = skin if (skin and torn >= 1) else col
    S(p, path_limb([hip, lerp(hip, knee, 0.5), knee, calf, ank], [t0, t0 * 0.84, t1, c0, c1]), base)
    p.flat(ellipse(knee[0] + side * 1.5 * k, knee[1] + 1 * k, t1 * 0.62, t1 * 0.7, n=10), shade(base, 0.8), opacity=0.55)                      # kneecap
    if skin and 0 < torn < 1:
        cut = lerp(ank, knee, torn * 1.25) if torn < 0.8 else lerp(knee, hip, (torn - 0.8) * 2.5)
        if torn < 0.8:
            S(p, path_limb([cut, lerp(cut, ank, 0.5), ank], [lerp((c1, 0), (c0, 0), torn * 1.25)[0] * 0.92, c0 * 0.8 if torn > 0.5 else c1 * 1.05, c1 * 0.92]), skin)
        else:
            S(p, path_limb([cut, knee, calf, ank], [t1 * 1.1, t1 * 0.9, c0 * 0.9, c1 * 0.92]), skin)
        r = (c0 if torn < 0.8 else t1) * 1.05
        for j in (-1, 0, 1):
            p.flat([(cut[0] + j * r * 0.6 - r * 0.3, cut[1] + 2 * k), (cut[0] + j * r * 0.6 + r * 0.3, cut[1] + 2 * k), (cut[0] + j * r * 0.7, cut[1] - r * (0.8 + 0.4 * ((j + 1) % 3)))], col, smooth=False)
        p.flat([(ank[0] - 1.2 * k, ank[1] + 40 * k * min(1, torn * 1.5)), (ank[0] + 1.2 * k, ank[1] + 40 * k * min(1, torn * 1.5)), (ank[0] + 0.8 * k, ank[1] + 4 * k), (ank[0] - 0.8 * k, ank[1] + 4 * k)], shade(skin, 0.62), smooth=False, opacity=0.5)   # the shin bone
    x, y = ank
    fw = 11.5 * k * foot_w
    if bare_foot or not boot:
        sk = skin or col
        S(p, [(x - fw * 0.75, y + 6 * k), (x + fw * 0.75, y + 6 * k), (x + side * fw * 0.35 + fw * 1.0, y - 12 * k), (x + side * fw * 0.5 + fw * 0.9, y - 16 * k), (x + side * fw * 0.5 - fw * 0.9, y - 16 * k), (x + side * fw * 0.35 - fw * 1.0, y - 12 * k)], sk)
        for i in range(4):
            p.flat(ellipse(x + side * fw * 0.5 + (i - 1.5) * fw * 0.45, y - 15.5 * k, fw * 0.2, fw * 0.24, n=6), shade(sk, 0.62), opacity=0.6)
    else:
        # a boot seen from the front: shaft, then the toe box coming at you, wider and a little turned out
        P(p, [(x - fw * 0.8, y + 22 * k), (x + fw * 0.8, y + 22 * k), (x + fw * 0.86, y + 2 * k), (x + side * fw * 0.4 + fw * 1.12, y - 9 * k), (x + side * fw * 0.5 + fw * 1.0, y - 16 * k), (x + side * fw * 0.5 - fw * 1.0, y - 16 * k), (x + side * fw * 0.4 - fw * 1.12, y - 9 * k), (x - fw * 0.86, y + 2 * k)], boot)
        p.flat([(x + side * fw * 0.5 - fw * 1.06, y - 13 * k), (x + side * fw * 0.5 + fw * 1.06, y - 13 * k), (x + side * fw * 0.5 + fw * 1.0, y - 16.6 * k), (x + side * fw * 0.5 - fw * 1.0, y - 16.6 * k)], shade(boot, 0.55), smooth=False)   # sole
        p.flat([(x - fw * 0.82, y + 22 * k), (x + fw * 0.82, y + 22 * k), (x + fw * 0.82, y + 18.5 * k), (x - fw * 0.82, y + 18.5 * k)], shade(boot, 0.7), smooth=False)                             # the top of the shaft
    return p


def body(cn, F, col, belly=0.0, chest=1.0, slump=0.0, layer=1, pivot=None, half=None):
    """The trunk. Returns (part, clip path of the torso). `half` replaces the outline (in figure units, before scaling)."""
    b = part(cn + '_Body', BODY, pivot or (0, 200 * F['k']), layer)
    pts = [(x * F['k'] * (F['w'] if x > 12 else 1), y * F['k']) for x, y in half] if half else torso_pts(F, belly, chest, slump)
    td = S(b, M(pts), col)
    return b, td


def trousers_top(b, td, F, col, belt=None, y=236):
    k = F['k']
    b.clipped(td, rect(-90 * k * F['w'], 170 * k, 90 * k * F['w'], y * k), col, smooth=False)
    if belt:
        b.clipped(td, rect(-90 * k * F['w'], (y - 7) * k, 90 * k * F['w'], y * k), belt, smooth=False)
        b.clipped(td, rect(-5 * k, (y - 8.5) * k, 5 * k, (y + 1.5) * k), mixc(belt, '#c9a04a', 0.7), smooth=False)


def wound(b, td, c, r, seed=0, bone=False):
    splat(b, td, c, r, col=BLOOD, seed=seed, n=11)
    splat(b, td, (c[0] + r * 0.1, c[1] - r * 0.05), r * 0.55, col='#3d0c10', seed=seed + 5, n=9)
    if bone:
        for i in (-1, 0, 1):
            b.clipped(td, [(c[0] - r * 0.5, c[1] + i * r * 0.3 + r * 0.06), (c[0] + r * 0.5, c[1] + i * r * 0.3 - r * 0.04), (c[0] + r * 0.5, c[1] + i * r * 0.3 - r * 0.13), (c[0] - r * 0.5, c[1] + i * r * 0.3 - r * 0.04)], BONE, smooth=False)


# ================================================================== 1. SHAMBLER: a dead townsman. Suspenders, a slack jaw, a shirt torn off the ribs.

def shambler():
    cn = 'Shambler'; F = fig(400); k = F['k']
    skin, shirt, pants = '#8f9d7c', '#cdbf9f', '#54453c'
    parts = [leg2(cn, -1, F, pants, skin, torn=0.38), leg2(cn, 1, F, pants, skin, torn=0.0)]
    b, td = body(cn, F, shirt, slump=0.7)
    tear = b.flat([(8, 318), (44, 312), (47, 262), (30, 240), (12, 252), (4, 286)], skin, clip_to=td)
    ribs(b, tear, F, shade(skin, 0.55), n=4, op=0.7)
    for s in (-1, 1):
        b.clipped(td, [(s * 15, 332), (s * 23, 332), (s * 31, 234), (s * 23, 234)], '#7a3a2c', smooth=False)
    trousers_top(b, td, F, pants, belt='#2e2420')
    wound(b, td, (-20, 276), 15, seed=3)
    b.clipped(td, [(-40, 236), (-26, 252), (-14, 236)], skin, smooth=False)
    parts.append(b)
    h, hd, L = skull(cn, F, skin, cx=4, jaw=0.55, hair=('thin', '#3d342c'))
    wound(h, hd, (L['X'](-12), L['Y'](46)), 6 * L['u'], seed=7)
    parts.append(h)
    parts.append(arm2(cn, -1, F, skin, sleeve=shirt, sleeve_to=0.62, el=(-60, 246), wr=(-66, 192), hand_ang=-96, curl=0.35))
    parts.append(arm2(cn, 1, F, skin, sleeve=shirt, sleeve_to=0.3, el=(62, 250), wr=(60, 196), hand_ang=-84, curl=0.2))
    return parts


# ================================================================== 2. SPRINTER: starved and fast. Bare to the waist, every rib showing, hands up and open.

def sprinter():
    cn = 'Sprinter'; F = fig(372, w=0.9); k = F['k']
    skin, pants = '#b08a80', '#3f3a44'
    parts = [leg2(cn, -1, F, pants, skin, torn=0.55, bare_foot=True, knee=(-27 * k, 108 * k), ank=(-30 * k, 16 * k)), leg2(cn, 1, F, pants, skin, torn=0.9, bare_foot=True, knee=(25 * k, 104 * k), ank=(22 * k, 16 * k))]
    b, td = body(cn, F, skin, chest=1.04)
    ribs(b, td, F, shade(skin, 0.58), n=5, op=0.75)
    b.clipped(td, [(-26 * k, 252 * k), (0, 246 * k), (26 * k, 252 * k), (20 * k, 226 * k), (0, 218 * k), (-20 * k, 226 * k)], shade(skin, 0.66), opacity=0.5)    # the belly has fallen in
    trousers_top(b, td, F, pants, belt=None, y=222)
    for s in (-1, 1):
        b.clipped(td, [(s * 34 * k, 222 * k), (s * 22 * k, 232 * k), (s * 12 * k, 222 * k)], skin, smooth=False)
    wound(b, td, (14 * k, 284 * k), 12 * k, seed=11, bone=True)
    parts.append(b)
    h, hd, L = skull(cn, F, skin, jaw=1.0, eye='#ffd27a', hair=('cap', '#2a2228'), gaunt=0.92)
    parts.append(h)
    parts.append(arm2(cn, -1, F, skin, el=(-74 * k, 286 * k), wr=(-88 * k, 344 * k), hand_ang=100, claw='#2a1c1c', curl=0.3, hr=7.6 * k))
    parts.append(arm2(cn, 1, F, skin, el=(72 * k, 270 * k), wr=(94 * k, 318 * k), hand_ang=70, claw='#2a1c1c', curl=0.45, hr=7.6 * k))
    return parts


# ================================================================== 4. BLOATER: a drowned man swollen with gas. The belly is a drum about to split.

def bloater():
    cn = 'Bloater'; F = fig(440, w=1.22); k = F['k']
    skin, cloth = '#b4b06c', '#5a5246'
    parts = [leg2(cn, -1, F, cloth, skin, torn=0.3, bulk=1.5, hip=(-34 * k, 196 * k), knee=(-40 * k, 104 * k), ank=(-42 * k, 16 * k), foot_w=1.2), leg2(cn, 1, F, cloth, skin, torn=0.6, bulk=1.5, hip=(34 * k, 196 * k), knee=(40 * k, 104 * k), ank=(42 * k, 16 * k), foot_w=1.2)]
    b, td = body(cn, F, skin, half=[(0, 331), (9, 331), (28, 326), (46, 319), (50, 304), (47, 286), (53, 266), (68, 246), (80, 224), (78, 202), (62, 188), (40, 182), (0, 180)])   # a barrel that hangs over the belt
    # the skin is stretched thin: veins, a seam that has started to open, the glow of what is inside
    for (x0, y0, x1, y1, x2, y2) in ((-70, 250, -40, 232, -52, 204), (62, 262, 48, 236, 70, 214), (-20, 290, -34, 266, -16, 250), (26, 296, 40, 272, 22, 252)):
        b.clipped(td, path_limb([(x0 * k, y0 * k), (x1 * k, y1 * k), (x2 * k, y2 * k)], [2.2 * k, 1.6 * k, 0.8 * k], n_end=3), '#6c7a4a', opacity=0.75)
    b.clipped(td, [(-5 * k, 286 * k), (6 * k, 262 * k), (-4 * k, 236 * k), (7 * k, 212 * k), (0, 196 * k), (-9 * k, 214 * k), (-13 * k, 238 * k), (-6 * k, 262 * k)], '#3d2a16', smooth=False)
    b.clipped(td, [(-3 * k, 276 * k), (3 * k, 262 * k), (-4 * k, 240 * k), (3 * k, 218 * k), (-2 * k, 206 * k), (-7 * k, 238 * k), (-3 * k, 262 * k)], '#e2ea5a', smooth=False)
    for (x, y, r) in ((-58, 234, 9), (50, 250, 7), (-30, 212, 6), (64, 224, 8), (30, 282, 5), (-48, 276, 6)):
        b.clipped(td, ellipse(x * k, y * k, r * k, r * k, n=10), '#d6de6a'); b.clipped(td, ellipse((x - 1.5) * k, (y + 1.5) * k, r * 0.45 * k, r * 0.45 * k, n=8), '#f2f6b0')
    b.clipped(td, [(-140 * k, 170 * k), (140 * k, 170 * k), (140 * k, 196 * k), (60 * k, 190 * k), (0, 187 * k), (-60 * k, 190 * k), (-140 * k, 196 * k)], cloth, smooth=False)
    for s in (-1, 1):
        b.clipped(td, [(s * 16 * k, 332 * k), (s * 26 * k, 332 * k), (s * 62 * k, 204 * k), (s * 50 * k, 204 * k)], '#3a342e', smooth=False)   # braces, at full stretch
    parts.append(b)
    h, hd, L = skull(cn, F, skin, jaw=0.3, eye='#e8f07a', hair=('thin', '#4a4630'), gaunt=1.12)
    for s in (-1, 1):
        h.clipped(hd, ellipse(L['X'](s * 13), L['Y'](12), 7 * L['u'], 8 * L['u'], n=10), light(skin, 1.08), opacity=0.8)                      # swollen cheeks
    h.clipped(hd, ellipse(L['X'](-9), L['Y'](50), 3.2 * L['u'], 3.2 * L['u'], n=8), '#d6de6a')
    parts.append(h)
    parts.append(arm2(cn, -1, F, skin, sh=(-54 * k, 312 * k), el=(-82 * k, 254 * k), wr=(-104 * k, 200 * k), bulk=1.3, hand_ang=-104, curl=0.25, hr=8.4 * k))
    parts.append(arm2(cn, 1, F, skin, sh=(54 * k, 312 * k), el=(82 * k, 254 * k), wr=(102 * k, 198 * k), bulk=1.3, hand_ang=-76, curl=0.25, hr=8.4 * k))
    return parts


# ================================================================== 8. BRUTE: the slaughterhouse man. A sack over his head, an apron, arms like sides of beef.

def brute():
    cn = 'Brute'; F = fig(480, w=1.5, hw=1.12); k = F['k']
    skin, apron, pants = '#b88f7c', '#d9cdb4', '#3c3530'
    parts = [leg2(cn, -1, F, pants, bulk=1.55, hip=(-34 * k, 198 * k), knee=(-38 * k, 104 * k), ank=(-38 * k, 16 * k), boot='#2a211d', foot_w=1.3), leg2(cn, 1, F, pants, bulk=1.55, hip=(34 * k, 198 * k), knee=(38 * k, 104 * k), ank=(38 * k, 16 * k), boot='#2a211d', foot_w=1.3)]
    b, td = body(cn, F, skin, belly=0.55, chest=1.1)
    for s in (-1, 1):   # the slabs of the chest and the trapezius running up into the neck
        b.clipped(td, [(s * 4 * k, 318 * k), (s * 58 * k, 312 * k), (s * 62 * k, 286 * k), (s * 34 * k, 274 * k), (s * 4 * k, 280 * k)], shade(skin, 0.8), opacity=0.5)
        b.clipped(td, [(s * 10 * k, 334 * k), (s * 46 * k, 328 * k), (s * 30 * k, 320 * k)], shade(skin, 0.7), opacity=0.6)
    ap = b.flat([(-34 * k, 318 * k), (34 * k, 318 * k), (52 * k, 252 * k), (58 * k, 150 * k), (-58 * k, 150 * k), (-52 * k, 252 * k)], apron, smooth=False)
    b.flat([(-34 * k, 318 * k), (-26 * k, 318 * k), (-12 * k, 336 * k), (-18 * k, 338 * k)], shade(apron, 0.7), smooth=False); b.flat([(34 * k, 318 * k), (26 * k, 318 * k), (12 * k, 336 * k), (18 * k, 338 * k)], shade(apron, 0.7), smooth=False)
    b.clipped(ap, rect(-80 * k, 236 * k, 80 * k, 244 * k), shade(apron, 0.6), smooth=False)
    wound(b, ap, (-14 * k, 282 * k), 20 * k, seed=4); wound(b, ap, (22 * k, 210 * k), 24 * k, seed=9); wound(b, ap, (-30 * k, 180 * k), 14 * k, seed=13)
    parts.append(b)
    # the head is under a feed sack tied at the throat: two torn holes, stitched mouth
    h = part(cn + '_Head', HEAD, (0, F['neck'] - 4 * k), 2)
    u = F['head_w'] / 21.0; cy = F['chin']
    X = lambda x: x * u; Y = lambda y: cy + y * u
    S(h, [(X(-13), Y(-22)), (X(13), Y(-22)), (X(11), Y(-4)), (X(-11), Y(-4))], shade(skin, 0.82))
    sack = '#b39a6c'
    sd = S(h, [(X(x), Y(y)) for x, y in M([(0, 62), (14, 60), (23, 50), (25, 34), (23, 16), (19, 2), (15, -9), (0, -11)])], sack)
    h.flat([(X(-16), Y(-7)), (X(16), Y(-7)), (X(19), Y(-13)), (X(8), Y(-16)), (X(-6), Y(-15)), (X(-19), Y(-12))], shade(sack, 0.78), smooth=False)   # gathered at the neck
    h.flat([(X(-17), Y(-4)), (X(17), Y(-4)), (X(17), Y(-7.5)), (X(-17), Y(-7.5))], '#4a3626', smooth=False)                                         # the cord
    for s in (-1, 1):
        e = h.clipped(sd, [(X(s * 4), Y(34)), (X(s * 9), Y(38)), (X(s * 16), Y(36)), (X(s * 15), Y(29)), (X(s * 8), Y(27))], '#1a1214', smooth=False)
        h.clipped(sd, ellipse(X(s * 10), Y(32), 1.8 * u, 1.8 * u, n=8), '#ff8a5a')
    h.clipped(sd, [(X(-11), Y(13)), (X(11), Y(13)), (X(11), Y(11)), (X(-11), Y(11))], '#2a1c16', smooth=False)
    for i in range(6):
        h.clipped(sd, [(X(-10 + i * 4 - 0.6), Y(16.5)), (X(-10 + i * 4 + 0.6), Y(16.5)), (X(-10 + i * 4 + 0.6), Y(7.5)), (X(-10 + i * 4 - 0.6), Y(7.5))], '#2a1c16', smooth=False)
    h.clipped(sd, [(X(8), Y(60)), (X(26), Y(40)), (X(24), Y(20)), (X(14), Y(44))], shade(sack, 0.72), opacity=0.6)
    splat(h, sd, (X(-12), Y(20)), 7 * u, seed=5)
    parts.append(h)
    aL = arm2(cn, -1, F, skin, el=(-88 * k, 250 * k), wr=(-92 * k, 186 * k), bulk=1.75, hand_ang=-94, curl=0.7, hr=11 * k)
    parts.append(aL)
    aR = arm2(cn, 1, F, skin, el=(96 * k, 262 * k), wr=(108 * k, 316 * k), bulk=1.75, hand_ang=84, curl=0.85, hr=11 * k)
    c = aR.hand_c   # a cleaver in the raised fist
    P(aR, [(c[0] - 4 * k, c[1] - 22 * k), (c[0] + 4 * k, c[1] - 22 * k), (c[0] + 4 * k, c[1] + 16 * k), (c[0] - 4 * k, c[1] + 16 * k)], '#4a3226')
    P(aR, [(c[0] - 6 * k, c[1] + 14 * k), (c[0] + 46 * k, c[1] + 18 * k), (c[0] + 50 * k, c[1] + 78 * k), (c[0] + 30 * k, c[1] + 84 * k), (c[0] - 6 * k, c[1] + 80 * k)], '#aeb2ba')
    aR.flat([(c[0] + 40 * k, c[1] + 18 * k), (c[0] + 46 * k, c[1] + 18 * k), (c[0] + 50 * k, c[1] + 78 * k), (c[0] + 44 * k, c[1] + 80 * k)], '#e6e9ee', smooth=False)
    aR.flat(ellipse(c[0] + 2 * k, c[1] + 70 * k, 3.2 * k, 3.2 * k, n=8), '#2a2226')
    aR.flat([(c[0] + 18 * k, c[1] + 30 * k), (c[0] + 44 * k, c[1] + 34 * k), (c[0] + 46 * k, c[1] + 62 * k), (c[0] + 30 * k, c[1] + 54 * k), (c[0] + 20 * k, c[1] + 60 * k)], BLOOD)
    parts.append(aR)
    return parts

def skirt(b, F, col, top=238, hem_w=64, y0=0, rag=7, seed=1, waist=None):
    """A long garment from the waist to the ground, the hem in tatters. Drawn into the body part before the torso."""
    k = F['k']; w = F['w']; rnd = random.Random(seed)
    ww = waist or 34 * w
    pts = [(-ww * k, top * k), (ww * k, top * k), ((ww + (hem_w - ww) * 0.45) * k, (top * 0.5) * k), (hem_w * k, (y0 + 6) * k)]
    n = rag * 2
    for i in range(n + 1):
        x = hem_w - (2 * hem_w) * i / n
        pts.append((x * k, (y0 + (0 if i % 2 else rnd.uniform(8, 26))) * k))
    pts += [(-hem_w * k, (y0 + 6) * k), (-(ww + (hem_w - ww) * 0.45) * k, (top * 0.5) * k)]
    return P(b, pts, col)


# ================================================================== 5. SPITTER: a field hand whose throat has swollen into a sac of acid.

def spitter():
    cn = 'Spitter'; F = fig(404, w=0.96); k = F['k']
    skin, poncho, pants, acid = '#8ea57a', '#a8543c', '#4a4038', '#a6ec5a'
    parts = [leg2(cn, -1, F, pants, skin, torn=0.3), leg2(cn, 1, F, pants, skin, torn=0.5)]
    b, td = body(cn, F, '#6f6a58', slump=0.9)
    trousers_top(b, td, F, pants, belt='#2a221e')
    # a serape hangs from the shoulders to the hip, striped, the lower edge eaten away
    sp = S(b, [(-10 * k, 334 * k), (10 * k, 334 * k), (40 * k, 326 * k), (62 * k, 306 * k), (66 * k, 262 * k), (58 * k, 214 * k), (40 * k, 196 * k), (22 * k, 210 * k), (6 * k, 190 * k), (-14 * k, 206 * k), (-34 * k, 192 * k), (-56 * k, 212 * k), (-66 * k, 262 * k), (-62 * k, 306 * k), (-40 * k, 326 * k)], poncho, smooth=False)
    for y, c2 in ((300, '#e0c070'), (290, '#3e3a4a'), (252, '#e0c070'), (242, '#3e3a4a')):
        b.clipped(sp, rect(-80 * k, (y - 4) * k, 80 * k, y * k), c2, smooth=False)
    b.clipped(sp, [(-8 * k, 334 * k), (8 * k, 334 * k), (0, 306 * k)], '#2a221e', smooth=False)
    for (x, y, r) in ((14, 276, 9), (-22, 226, 7), (30, 222, 6)):   # acid has burned through it
        b.clipped(sp, ellipse(x * k, y * k, r * k, r * 1.2 * k, n=9), '#33402a'); b.clipped(sp, ellipse(x * k, (y - 1) * k, r * 0.5 * k, r * 0.6 * k, n=7), acid)
    parts.append(b)
    h, hd, L = skull(cn, F, skin, jaw=0.9, eye='#d6ff7a', hair=None, gaunt=0.95)
    X, Y, u = L['X'], L['Y'], L['u']
    # the sac under the jaw
    S(h, ellipse(X(0), Y(-13), 15 * u, 12 * u, n=14), mixc(skin, acid, 0.45)); h.flat(ellipse(X(-3), Y(-11), 8 * u, 6.5 * u, n=10), acid, opacity=0.85); h.flat(ellipse(X(-5), Y(-9), 3 * u, 2.5 * u, n=8), '#f0ffc0')
    for x in (-9, 8):
        h.flat(path_limb([(X(x), Y(-4)), (X(x * 1.2), Y(-18))], [1.2 * u, 0.6 * u], n_end=3), '#5d7a48', opacity=0.8)
    h.flat([(X(-3), Y(1 - L['d'])), (X(1), Y(1 - L['d'])), (X(0), Y(-13 - L['d'])), (X(-2), Y(-13 - L['d']))], acid, smooth=False)                         # it runs out of the mouth
    hat(h, X(0), Y(49), 21 * u, 20 * u, 46 * u, '#b39a62', band='#5a3a2a', brim_h=7 * u, taper=0.74, dent=0.12)
    h.flat([(X(30), Y(47)), (X(46), Y(49)), (X(40), Y(42))], '#3a3238', smooth=False)                                                                       # a bite out of the brim
    parts.append(h)
    parts.append(arm2(cn, -1, F, skin, sleeve='#6f6a58', sleeve_to=0.4, el=(-64 * k, 250 * k), wr=(-60 * k, 196 * k), hand_ang=-92, claw='#2f3a22', curl=0.3, layer=0.5))
    parts.append(arm2(cn, 1, F, skin, sleeve='#6f6a58', sleeve_to=0.4, el=(66 * k, 256 * k), wr=(70 * k, 204 * k), hand_ang=-84, claw='#2f3a22', curl=0.2))
    return parts


# ================================================================== 9. SCREAMER: a widow in her mourning dress. Her jaw has come unhinged.

def screamer():
    cn = 'Screamer'; F = fig(470, w=0.84, hw=0.96); k = F['k']
    skin, dress, hair = '#cfc6bc', '#1e1a22', '#9b958f'
    b = part(cn + '_Body', BODY, (0, 120), 1)
    skirt(b, F, dress, top=240, hem_w=58, rag=8, seed=4)
    td = S(b, M(torso_pts(F, 0, 0.96, 0.3)), dress)
    b.clipped(td, [(-9 * k, 331 * k), (9 * k, 331 * k), (0, 306 * k)], skin, smooth=False)                                              # an open collar: the breastbone
    b.clipped(td, [(-1.2 * k, 324 * k), (1.2 * k, 324 * k), (0.8 * k, 310 * k), (-0.8 * k, 310 * k)], shade(skin, 0.6), smooth=False)
    b.clipped(td, rect(-60 * k, 232 * k, 60 * k, 240 * k), '#3a2f3a', smooth=False)
    for i in range(5):
        b.clipped(td, ellipse(0, (296 - i * 12) * k, 1.8 * k, 1.8 * k, n=6), '#55495a')
    b.flat([(-30 * k, 200 * k), (-10 * k, 120 * k), (-22 * k, 30 * k), (-34 * k, 110 * k)], '#2b2530', opacity=0.9); b.flat([(22 * k, 210 * k), (36 * k, 110 * k), (26 * k, 20 * k), (14 * k, 120 * k)], '#2b2530', opacity=0.9)   # folds
    parts = [b]
    h, hd, L = skull(cn, F, skin, jaw=1.7, eye=None, hair=('long', hair), teeth=(6, 5), gaunt=0.9)
    X, Y, u = L['X'], L['Y'], L['u']
    for s in (-1, 1):   # what runs from the sockets
        h.clipped(hd, [(X(s * 8), Y(27)), (X(s * 11), Y(27)), (X(s * 10.5), Y(6)), (X(s * 9), Y(6))], '#17121a', smooth=False, opacity=0.85)
    parts.append(h)
    parts.append(arm2(cn, -1, F, skin, sleeve=dress, sleeve_to=0.86, el=(-66 * k, 290 * k), wr=(-54 * k, 352 * k), hand_ang=96, claw='#3a2f3a', curl=0.5, hr=7 * k, bulk=0.82))
    parts.append(arm2(cn, 1, F, skin, sleeve=dress, sleeve_to=0.86, el=(66 * k, 290 * k), wr=(54 * k, 352 * k), hand_ang=84, claw='#3a2f3a', curl=0.5, hr=7 * k, bulk=0.82))
    return parts


# ================================================================== 11. GILDED GHOUL: a claim jumper who died with his poke. The gold dust never came off.

def gilded():
    cn = 'Gilded'; F = fig(384, w=0.96); k = F['k']
    skin, coat, pants, gold = '#c9a544', '#5a4634', '#3f372f', '#f2d25a'
    parts = [leg2(cn, -1, F, pants, skin, torn=0.2), leg2(cn, 1, F, pants, skin, torn=0.0)]
    sack = part(cn + '_Prop', PROP, (-58 * k, 290 * k), 0.5)
    sd = S(sack, [(-52 * k, 330 * k), (-78 * k, 320 * k), (-98 * k, 280 * k), (-94 * k, 236 * k), (-66 * k, 222 * k), (-44 * k, 240 * k), (-40 * k, 290 * k)], '#8a7650')
    sack.clipped(sd, [(-90 * k, 268 * k), (-70 * k, 252 * k), (-58 * k, 276 * k), (-76 * k, 290 * k)], '#6f5e40', smooth=False)
    S(sack, [(-56 * k, 334 * k), (-44 * k, 340 * k), (-40 * k, 326 * k), (-52 * k, 322 * k)], '#6f5e40')
    for (x, y) in ((-70, 232), (-82, 226), (-60, 224)):
        sack.flat(ellipse(x * k, y * k, 5 * k, 5 * k, n=10), gold); sack.flat(ellipse((x - 1) * k, (y + 1) * k, 2.2 * k, 2.2 * k, n=8), '#fff3b0')
    parts.append(sack)
    b, td = body(cn, F, coat, slump=0.3)
    b.clipped(td, [(-12 * k, 331 * k), (12 * k, 331 * k), (6 * k, 250 * k), (-6 * k, 250 * k)], '#b7a888', smooth=False)                   # shirt front
    b.clipped(td, [(-12 * k, 331 * k), (-3 * k, 331 * k), (-9 * k, 244 * k), (-20 * k, 300 * k)], shade(coat, 0.75), smooth=False); b.clipped(td, [(12 * k, 331 * k), (3 * k, 331 * k), (9 * k, 244 * k), (20 * k, 300 * k)], shade(coat, 0.75), smooth=False)
    trousers_top(b, td, F, pants, belt='#2a2018')
    b.clipped(td, [(-60 * k, 318 * k), (-40 * k, 328 * k), (30 * k, 250 * k), (20 * k, 244 * k)], '#6f5e40', smooth=False)                 # the strap of the poke
    for (x, y, r) in ((24, 296, 5), (-26, 270, 4), (34, 262, 3.5)):
        b.clipped(td, ellipse(x * k, y * k, r * k, r * k, n=8), gold, opacity=0.9)
    parts.append(b)
    h, hd, L = skull(cn, F, skin, jaw=0.25, eye='#fffbe0', hair=None, gaunt=0.96, teeth=(6, 4))
    X, Y, u = L['X'], L['Y'], L['u']
    for (x, y, r) in ((-10, 48, 3), (12, 20, 2.4), (-14, 14, 2)):
        h.clipped(hd, ellipse(X(x), Y(y), r * u, r * u, n=8), gold)
    for (a, b2, c2, d2) in ((2, 56, 6, 44), (-16, 30, -19, 22), (15, 34, 18, 26)):   # the leaf has cracked
        h.clipped(hd, [(X(a), Y(b2)), (X(a + 1.2), Y(b2)), (X(c2 + 0.6), Y(d2)), (X(c2 - 0.6), Y(d2))], '#7a5a1e', smooth=False)
    hat(h, X(0), Y(50), 20 * u, 17 * u, 36 * u, '#4a3a2c', band='#2a2018', brim_h=5.5 * u, taper=0.8, dent=0.2)
    parts.append(h)
    parts.append(arm2(cn, -1, F, skin, sleeve=coat, sleeve_to=0.9, el=(-70 * k, 276 * k), wr=(-58 * k, 318 * k), hand_ang=70, curl=0.9))
    parts.append(arm2(cn, 1, F, skin, sleeve=coat, sleeve_to=0.9, el=(62 * k, 250 * k), wr=(64 * k, 196 * k), hand_ang=-86, curl=0.3, claw='#7a5a1e'))
    return parts


# ================================================================== 12. RIOT GHOUL: the jailer, still on duty behind a cell door.

def riot():
    cn = 'Riot'; F = fig(424, w=1.1); k = F['k']
    skin, coat, pants = '#7f8c8a', '#3d4a5a', '#2c3440'
    parts = [leg2(cn, -1, F, pants, boot='#1f2126'), leg2(cn, 1, F, pants, boot='#1f2126')]
    b, td = body(cn, F, coat, chest=1.06)
    b.clipped(td, [(-2.5 * k, 331 * k), (2.5 * k, 331 * k), (2.5 * k, 236 * k), (-2.5 * k, 236 * k)], shade(coat, 0.7), smooth=False)
    for i in range(5):
        b.clipped(td, ellipse(6 * k, (318 - i * 17) * k, 2.4 * k, 2.4 * k, n=8), '#c9a04a')
    b.clipped(td, [(20 * k, 304 * k), (29 * k, 300 * k), (32 * k, 290 * k), (25 * k, 283 * k), (18 * k, 290 * k)], '#c9a04a', smooth=False)   # the star
    trousers_top(b, td, F, pants, belt='#1f2126')
    wound(b, td, (-22 * k, 268 * k), 11 * k, seed=6)
    parts.append(b)
    h, hd, L = skull(cn, F, skin, jaw=0.35, eye='#bfe6ff', hair=None, gaunt=1.02)
    X, Y, u = L['X'], L['Y'], L['u']
    # a peaked cap
    P(h, [(X(-22), Y(45)), (X(22), Y(45)), (X(20), Y(62)), (X(10), Y(67)), (X(-10), Y(67)), (X(-20), Y(62))], '#2c3440')
    h.flat([(X(-22), Y(45)), (X(22), Y(45)), (X(22), Y(49)), (X(-22), Y(49))], '#1f2126', smooth=False)
    P(h, [(X(-24), Y(45)), (X(24), Y(45)), (X(20), Y(40)), (X(-20), Y(40))], '#17181c')
    h.flat(ellipse(X(0), Y(56), 3.4 * u, 3.4 * u, n=8), '#c9a04a')
    parts.append(h)
    aR = arm2(cn, 1, F, skin, sleeve=coat, sleeve_to=0.92, el=(74 * k, 252 * k), wr=(78 * k, 198 * k), hand_ang=-88, curl=0.9, bulk=1.1)
    c = aR.hand_c   # a truncheon
    aR.flat(path_limb([(c[0] - 2 * k, c[1] + 14 * k), (c[0] + 4 * k, c[1] - 62 * k)], [4.2 * k, 5.2 * k], n_end=5), '#2a1c14')
    aR.flat(rect(c[0] - 5 * k, c[1] + 3 * k, c[0] + 5 * k, c[1] + 6 * k), '#17100c', smooth=False)
    parts.append(aR)
    # the cell door he carries in front of him: strap iron and bars, his fingers through it
    d = part(cn + '_Prop', PROP, (-40 * k, 233 * k), 4)
    dd = P(d, rrect(-46 * k, 232 * k, 96 * k, 232 * k, 6 * k), '#4b525c')
    d.clipped(dd, rrect(-46 * k, 232 * k, 80 * k, 216 * k, 4 * k), '#2a2e36', smooth=False)
    for x in (-78, -62, -46, -30, -14):
        d.clipped(dd, rect((x - 3) * k, 124 * k, (x + 3) * k, 340 * k), '#6a7280', smooth=False)
    for y in (300, 232, 164):
        d.clipped(dd, rect(-96 * k, (y - 6) * k, 4 * k, (y + 6) * k), '#59606c', smooth=False)
        for x in (-86, -6):
            d.clipped(dd, ellipse(x * k, y * k, 2.2 * k, 2.2 * k, n=6), '#2a2e36')
    P(d, rrect(-8 * k, 232 * k, 14 * k, 34 * k, 3 * k), '#8a6a2a'); d.flat(ellipse(-8 * k, 228 * k, 2.4 * k, 3.4 * k, n=8), '#1a1410')              # the lock
    for (x, y, r) in ((-66, 270, 5), (-28, 196, 4)):
        d.clipped(dd, ellipse(x * k, y * k, r * k, r * k, n=8), '#17181c'); d.clipped(dd, ellipse(x * k, y * k, r * 1.7 * k, r * 1.7 * k, n=8), '#8f96a2', opacity=0.25)
    for i in range(4):   # the hand that holds it
        d.flat(path_limb([((-82 + i * 0.5) * k, (252 - i * 7) * k), ((-70 + i * 0.5) * k, (251 - i * 7) * k)], [3 * k, 2.4 * k], n_end=4), skin)
    splat(d, dd, (-40 * k, 150 * k), 16 * k, seed=8)
    parts.append(d)
    return parts


# ================================================================== 13. HEX PRIEST: the circuit preacher. He kept preaching.

def priest():
    cn = 'Priest'; F = fig(440, w=0.92); k = F['k']
    skin, robe, glow = '#978c9c', '#231d2b', '#b77aff'
    b = part(cn + '_Body', BODY, (0, 120), 1)
    skirt(b, F, robe, top=240, hem_w=54, rag=6, seed=9)
    td = S(b, M(torso_pts(F, 0, 1.0, 0.2)), robe)
    b.clipped(td, [(-8 * k, 331 * k), (8 * k, 331 * k), (6 * k, 322 * k), (-6 * k, 322 * k)], '#e8e2d6', smooth=False)                              # collar
    b.clipped(td, [(-3 * k, 322 * k), (3 * k, 322 * k), (3 * k, 240 * k), (-3 * k, 240 * k)], '#3a3146', smooth=False)
    for i in range(7):
        b.clipped(td, ellipse(0, (314 - i * 11) * k, 1.6 * k, 1.6 * k, n=6), '#7a6a8c')
    b.flat([(-4 * k, 236 * k), (4 * k, 236 * k), (5 * k, 150 * k), (10 * k, 60 * k), (-10 * k, 60 * k), (-5 * k, 150 * k)], '#3a3146', smooth=False)   # a stole down the front
    b.flat([(-3 * k, 108 * k), (3 * k, 108 * k), (3 * k, 78 * k), (-3 * k, 78 * k)], glow, smooth=False); b.flat([(-9 * k, 98 * k), (9 * k, 98 * k), (9 * k, 92 * k), (-9 * k, 92 * k)], glow, smooth=False)   # the cross, upside down
    parts = [b]
    h, hd, L = skull(cn, F, skin, jaw=0.15, eye=glow, hair=None, gaunt=0.9, teeth=(7, 4))
    X, Y, u = L['X'], L['Y'], L['u']
    hat(h, X(0), Y(47), 20 * u, 26 * u, 44 * u, '#17131c', band='#3a3146', brim_h=6 * u, taper=0.9, dent=0.0)
    parts.append(h)
    aL = arm2(cn, -1, F, skin, sleeve=robe, sleeve_to=0.94, el=(-62 * k, 262 * k), wr=(-34 * k, 252 * k), hand_ang=20, curl=0.8)
    c = aL.hand_c   # the book, open against his chest, its page alight
    P(aL, [(c[0] - 8 * k, c[1] - 20 * k), (c[0] + 30 * k, c[1] - 16 * k), (c[0] + 30 * k, c[1] + 24 * k), (c[0] - 8 * k, c[1] + 20 * k)], '#4a1f2a')
    P(aL, [(c[0] - 4 * k, c[1] - 15 * k), (c[0] + 26 * k, c[1] - 12 * k), (c[0] + 26 * k, c[1] + 19 * k), (c[0] - 4 * k, c[1] + 16 * k)], '#e3d8c0')
    aL.flat([(c[0] + 9 * k, c[1] - 6 * k), (c[0] + 13 * k, c[1] - 6 * k), (c[0] + 13 * k, c[1] + 12 * k), (c[0] + 9 * k, c[1] + 12 * k)], glow, smooth=False); aL.flat([(c[0] + 4 * k, c[1] + 2 * k), (c[0] + 18 * k, c[1] + 2 * k), (c[0] + 18 * k, c[1] + 6 * k), (c[0] + 4 * k, c[1] + 6 * k)], glow, smooth=False)
    parts.append(aL)
    aR = arm2(cn, 1, F, skin, sleeve=robe, sleeve_to=0.94, el=(72 * k, 262 * k), wr=(84 * k, 316 * k), hand_ang=92, curl=0.9)
    c = aR.hand_c   # a crook hung with charms
    aR.flat(path_limb([(c[0] - 2 * k, c[1] - 300 * k), (c[0], c[1]), (c[0] + 2 * k, c[1] + 96 * k), (c[0] - 14 * k, c[1] + 122 * k), (c[0] - 30 * k, c[1] + 104 * k)], [3.4 * k, 3.4 * k, 3 * k, 2.6 * k, 2 * k], n_end=4), '#3a2a22')
    aR.flat(ellipse(c[0] - 22 * k, c[1] + 86 * k, 9 * k, 9 * k, n=12), glow); aR.flat(ellipse(c[0] - 24 * k, c[1] + 88 * k, 4 * k, 4 * k, n=8), '#f0e0ff')
    aR.flat([(c[0] - 22.6 * k, c[1] + 104 * k), (c[0] - 21.4 * k, c[1] + 104 * k), (c[0] - 21.4 * k, c[1] + 94 * k), (c[0] - 22.6 * k, c[1] + 94 * k)], '#17131c', smooth=False)
    parts.append(aR)
    return parts

def F1(chin, hw=21.0, H=200):
    """A bare frame for placing a head (or limbs at unit scale) where no standing figure applies."""
    return dict(k=1.0, w=1.0, H=H, chin=chin, neck=chin - 14, head_w=hw, head_h=56)


# ================================================================== 3. GUTTER CRAWLER: half a man, hauling the rest of himself along on his elbows.

def crawler():
    cn = 'Crawler'; F = F1(40)
    skin, rag = '#8b7b6b', '#4e463f'
    b = part(cn + '_Body', BODY, (0, 60), 1)
    # what he drags: a rope of gut and the stump of the spine
    b.flat(path_limb([(18, 86), (70, 56), (118, 26), (160, 10)], [9, 7, 5, 3], n_end=4), '#7a2a2c'); b.flat(path_limb([(-10, 84), (-58, 46), (-100, 14)], [7, 5, 3], n_end=4), '#5e1f22')
    td = S(b, M([(0, 152), (26, 150), (52, 134), (62, 110), (54, 86), (30, 74), (0, 72)]), skin)
    b.clipped(td, [(-64, 100), (64, 100), (64, 60), (-64, 60)], rag, smooth=False)
    for s in (-1, 1):   # shoulder blades standing out under the skin
        b.clipped(td, [(s * 10, 140), (s * 40, 136), (s * 48, 112), (s * 20, 106)], shade(skin, 0.68), smooth=False, opacity=0.6)
    for i in range(6):  # the spine
        b.clipped(td, ellipse(0, 148 - i * 9, 4.2 - i * 0.2, 3.4, n=8), light(skin, 1.18))
    wound(b, td, (28, 122), 11, seed=4, bone=True)
    parts = [b]
    h, hd, L = skull(cn, F, skin, jaw=0.8, eye='#f1e3a0', hair=('thin', '#2f2a26'), neck=False)
    parts.append(h); h.pivot = (0, 76)
    parts.append(arm2(cn, -1, F, skin, sleeve=rag, sleeve_to=0.4, sh=(-50, 118), el=(-98, 134), wr=(-112, 46), hand_ang=-92, claw='#2a221e', curl=0.1, hr=8.5, bulk=1.05))
    parts.append(arm2(cn, 1, F, skin, sh=(50, 118), el=(100, 128), wr=(110, 44), hand_ang=-86, claw='#2a221e', curl=0.1, hr=8.5, bulk=1.05))
    return parts


# ================================================================== 6. LEAPER: folded up like a spider, knees above its shoulders, about to go.

def leaper():
    cn = 'Leaper'; z = 1.2; F = F1(134 * z, hw=21 * 1.06)
    skin = '#8d7aa2'
    Fk = dict(F); Fk['k'] = z
    parts = [leg2(cn, -1, Fk, skin, skin, torn=1, bare_foot=True, hip=(-30 * z, 72 * z), knee=(-102 * z, 150 * z), ank=(-86 * z, 16 * z), bulk=0.95),
             leg2(cn, 1, Fk, skin, skin, torn=1, bare_foot=True, hip=(30 * z, 72 * z), knee=(102 * z, 150 * z), ank=(86 * z, 16 * z), bulk=0.95)]
    b = part(cn + '_Body', BODY, (0, 60 * z), 1)
    td = S(b, [(x * z, y * z) for x, y in M([(0, 198), (26, 194), (50, 174), (48, 134), (36, 98), (24, 66), (0, 56)])], skin)
    for s in (-1, 1):
        for i in range(5):
            y = (168 - i * 13) * z
            b.clipped(td, [(s * 4 * z, y), (s * 24 * z, y - 4 * z), (s * 44 * z, y - 14 * z), (s * 44 * z, y - 18 * z), (s * 24 * z, y - 9 * z), (s * 4 * z, y - 4.5 * z)], shade(skin, 0.58), opacity=0.7)
        b.clipped(td, [(s * 6 * z, 186 * z), (s * 44 * z, 178 * z), (s * 44 * z, 174 * z), (s * 6 * z, 181 * z)], shade(skin, 0.6), opacity=0.6)
    b.clipped(td, [(-18 * z, 98 * z), (18 * z, 98 * z), (12 * z, 62 * z), (-12 * z, 62 * z)], '#3a3344', smooth=False)                    # a rag of loincloth
    parts.append(b)
    h, hd, L = skull(cn, F, skin, jaw=1.15, eye='#ff9a5a', hair=None, neck=False, gaunt=0.9, teeth=(6, 5))
    X, Y, u = L['X'], L['Y'], L['u']
    h.flat(path_limb([(X(0), Y(4 - L['d'])), (X(3), Y(-12 - L['d'])), (X(-2), Y(-26 - L['d']))], [3 * u, 2.4 * u, 1 * u], n_end=4), '#a8323a')   # the tongue
    h.pivot = (0, 150 * z)
    parts.append(h)
    parts.append(arm2(cn, -1, Fk, skin, sh=(-46 * z, 178 * z), el=(-62 * z, 104 * z), wr=(-42 * z, 44 * z), hand_ang=-96, claw='#231a2a', curl=0.05, hr=8.6 * z, bulk=0.9))
    parts.append(arm2(cn, 1, Fk, skin, sh=(46 * z, 178 * z), el=(62 * z, 104 * z), wr=(42 * z, 44 * z), hand_ang=-84, claw='#231a2a', curl=0.05, hr=8.6 * z, bulk=0.9))
    return parts


# ================================================================== 7. CARRION WISP: a head and the top of a spine, carried on a bat's arms.

def wing(cn, side, sh, col, bone, span=1.0, z=1.0, role=None, layer=1, tears=True):
    """A bat's wing drawn as what it is: an arm (upper arm, forearm) and three long fingers with skin between them."""
    role = role or (WING_F if side > 0 else WING_B)
    p = part('%s_%s' % (cn, role), role, sh, layer)
    q = lambda x, y: (sh[0] + side * x * span * z, sh[1] + y * z)
    el, wr = q(54, 46), q(124, 22)
    t1, t2, t3 = q(196, 66), q(200, -4), q(150, -58)
    root = q(6, -36)
    mem = [sh, el, wr, t1, q(176, 30), t2, q(160, -24), t3, q(96, -34), q(56, -62), q(34, -30), root]
    S(p, mem, col)
    if tears:
        for (x, y, r) in ((150, 26, 7), (118, -22, 5), (70, -26, 6)):
            c = q(x, y); p.flat(ellipse(c[0], c[1], r * z, r * 1.3 * z, n=7), shade(col, 0.45))
    for a, b2, r0, r1 in ((sh, el, 5, 4), (el, wr, 4, 3)):
        p.flat(path_limb([a, b2], [r0 * z, r1 * z], n_end=4), bone)
    for t in (t1, t2, t3):
        p.flat(path_limb([wr, t], [2.6 * z, 0.8 * z], n_end=3), bone)
    p.flat(path_limb([wr, q(132, 44)], [2.2 * z, 0.6 * z], n_end=3), bone)   # the thumb claw
    return p


def wisp():
    cn = 'Wisp'; F = F1(118, hw=22)
    bone, flesh, mem = '#d9cfb8', '#7a2a30', '#4b3b5b'
    t = part(cn + '_Tail', TAIL, (0, 78), 0)
    for i in range(7):   # vertebrae, smaller as they go, and the rags that hang from them
        y = 74 - i * 11; r = 8 - i * 0.8; x = math.sin(i * 0.7) * 3
        t.shape([(x - r, y + 3.6), (x - r * 0.5, y + 5), (x + r * 0.5, y + 5), (x + r, y + 3.6), (x + r * 1.5, y), (x + r, y - 3.6), (x - r, y - 3.6), (x - r * 1.5, y)], bone, smooth=False)
    t.flat(path_limb([(-4, 60), (-12, 30), (-6, 4)], [3, 2, 0.8], n_end=3), flesh); t.flat(path_limb([(5, 50), (11, 26), (8, 12)], [2.4, 1.6, 0.6], n_end=3), '#5e1f22')
    parts = [t, wing(cn, -1, (-26, 104), mem, '#2c2238'), wing(cn, 1, (26, 104), mem, '#2c2238')]
    b = part(cn + '_Body', BODY, (0, 100), 2)
    td = S(b, M([(0, 128), (14, 126), (30, 114), (32, 96), (24, 78), (10, 68), (0, 66)]), flesh)
    for s in (-1, 1):
        for i in range(4):
            y = 118 - i * 11
            b.clipped(td, [(s * 3, y), (s * 16, y - 2), (s * 30, y - 9), (s * 30, y - 13), (s * 16, y - 7), (s * 3, y - 4.5)], bone)
    b.clipped(td, [(-2.4, 128), (2.4, 128), (2, 74), (-2, 74)], bone, smooth=False)
    parts.append(b)
    h, hd, L = skull(cn, F, bone, jaw=0.95, eye='#ff5a4a', hair=None, neck=False, ears=False, teeth=(6, 5), gaunt=0.94)
    h.pivot = (0, 124)
    parts.append(h)
    return parts


# ================================================================== 10. BURROWER: something that used to dig graves, and now lives in them. Blind, plated, all forearm.

def burrower():
    cn = 'Burrower'; F = F1(60)
    hide, plate, pale = '#8a6c44', '#5a452c', '#b9a68a'
    b = part(cn + '_Body', BODY, (0, 30), 1)
    td = S(b, M([(0, 210), (40, 204), (80, 174), (94, 130), (86, 84), (60, 54), (0, 46)]), hide)
    for i in range(6):   # scabbed plates down the spine
        y = 202 - i * 22; w = 34 + i * 7
        b.clipped(td, [(-w, y - 6), (0, y + 8), (w, y - 6), (w * 0.8, y - 16), (0, y - 4), (-w * 0.8, y - 16)], plate, smooth=False)
    for (x, y) in ((-66, 150), (70, 120), (-74, 96), (58, 176)):   # bristles
        for j in range(3):
            b.flat([(x + j * 4 - 1.2, y), (x + j * 4 + 1.2, y), (x + j * 4 + (2 if x > 0 else -2), y + 14)], '#3a2c1c', smooth=False)
    b.clipped(td, rect(-100, 40, 100, 62), '#4a3a28', smooth=False, opacity=0.8)   # grave dirt caked along the belly
    parts = [b]
    h = part(cn + '_Head', HEAD, (0, 78), 2)
    hd = S(h, M([(0, 138), (22, 134), (38, 118), (42, 98), (34, 76), (22, 60), (12, 52), (0, 50)]), pale)
    for s in (-1, 1):   # the eyes have healed over
        h.clipped(hd, [(s * 10, 112), (s * 28, 116), (s * 30, 110), (s * 12, 106)], shade(pale, 0.6), smooth=False)
        for j in range(3):
            h.clipped(hd, [(s * (13 + j * 6) - 0.8, 118), (s * (13 + j * 6) + 0.8, 118), (s * (13 + j * 6) + 0.8, 105), (s * (13 + j * 6) - 0.8, 105)], '#3a2c1c', smooth=False)
        h.clipped(hd, [(s * 3, 92), (s * 9, 96), (s * 10, 86), (s * 5, 84)], SOCKET, smooth=False)                                   # nostrils
        h.clipped(hd, [(s * 40, 104), (s * 22, 96), (s * 26, 74), (s * 36, 80)], shade(pale, 0.66), opacity=0.55)
        S(h, [(s * 36, 130), (s * 50, 146), (s * 46, 122)], shade(pale, 0.85))                                                      # torn ears
    md = h.clipped(hd, [(-24, 80), (24, 80), (20, 56), (-20, 56)], '#24100f', smooth=False)
    for s in (-1, 1):
        h.flat([(s * 1, 82), (s * 11, 82), (s * 10, 56), (s * 6, 50), (s * 2, 56)], '#e6d9a8', smooth=False)                         # the incisors
        h.clipped(hd, [(s * 14, 80), (s * 19, 80), (s * 17, 70)], BONE, smooth=False)
    h.flat([(0.6, 82), (-0.6, 82), (-0.6, 54), (0.6, 54)], '#8a7a4a', smooth=False)
    parts.append(h)
    for side in (-1, 1):
        a = arm2(cn, side, F, hide, sh=(side * 72, 154), el=(side * 132, 124), wr=(side * 124, 58), bulk=2.0, hand=False)
        c = (side * 124, 54)
        S(a, ellipse(c[0], c[1] - 4, 20, 16, n=12), hide)
        for j in range(4):   # digging claws: long, flat, worn
            x = c[0] + (j - 1.5) * 10
            a.flat([(x - 4.6, c[1] - 6), (x + 4.6, c[1] - 6), (x + 3 + side * 2, c[1] - 40), (x + side * 2, c[1] - 48), (x - 3 + side * 2, c[1] - 40)], '#e0d4b4', smooth=False)
            a.flat([(x - 0.7, c[1] - 8), (x + 0.7, c[1] - 8), (x + side * 2, c[1] - 44)], '#9a8c66', smooth=False)
        parts.append(a)
    return parts

# ================================================================== BOSS 1. BIG TONY, the Foreman: the stockyard's enforcer. A leather apron, a chain and a hook.

def big_tony():
    cn = 'BigTony'; F = fig(500, w=1.42, hw=1.08); k = F['k']
    skin, shirt, vest, apron, pants = '#b08a6c', '#c8bca4', '#2e2e3a', '#5a3c2a', '#26242c'
    parts = [leg2(cn, -1, F, pants, bulk=1.5, hip=(-34 * k, 198 * k), knee=(-38 * k, 104 * k), ank=(-38 * k, 16 * k), boot='#1c1614', foot_w=1.3), leg2(cn, 1, F, pants, bulk=1.5, hip=(34 * k, 198 * k), knee=(38 * k, 104 * k), ank=(38 * k, 16 * k), boot='#1c1614', foot_w=1.3)]
    b, td = body(cn, F, shirt, half=[(0, 331), (9, 331), (30, 326), (52, 319), (56, 304), (50, 286), (50, 262), (54, 240), (56, 220), (50, 202), (42, 190), (0, 184)])
    for s in (-1, 1):   # waistcoat, open
        b.clipped(td, [(s * 9 * k, 331 * k), (s * 80 * k, 331 * k), (s * 80 * k, 196 * k), (s * 14 * k, 200 * k), (s * 20 * k, 270 * k)], vest, smooth=False)
    ap = b.flat([(-30 * k, 300 * k), (30 * k, 300 * k), (50 * k, 250 * k), (56 * k, 140 * k), (-56 * k, 140 * k), (-50 * k, 250 * k)], apron, smooth=False)
    for s in (-1, 1):
        b.flat([(s * 30 * k, 300 * k), (s * 24 * k, 300 * k), (s * 12 * k, 332 * k), (s * 18 * k, 334 * k)], shade(apron, 0.75), smooth=False)
    b.clipped(ap, rect(-80 * k, 238 * k, 80 * k, 246 * k), '#2a1c14', smooth=False)
    b.clipped(ap, [(-22 * k, 226 * k), (22 * k, 226 * k), (22 * k, 196 * k), (-22 * k, 196 * k)], shade(apron, 0.8), smooth=False)               # a pocket
    wound(b, ap, (16 * k, 276 * k), 16 * k, seed=3); wound(b, ap, (-28 * k, 180 * k), 20 * k, seed=8)
    parts.append(b)
    h, hd, L = skull(cn, F, skin, jaw=0.3, eye='#ffb060', hair=None, gaunt=1.1, teeth=(6, 4), brow=1.6)
    X, Y, u = L['X'], L['Y'], L['u']
    for s in (-1, 1):   # what is left of a moustache
        h.flat([(X(s * 1), Y(15.5)), (X(s * 8), Y(16.5)), (X(s * 15), Y(11)), (X(s * 16), Y(6)), (X(s * 9), Y(12.5)), (X(s * 1), Y(13))], '#3a2a20')
    hat(h, X(0), Y(49), 21 * u, 15 * u, 34 * u, '#1c1a22', band='#7a3a2c', brim_h=5 * u, taper=0.92, dent=0.0)
    parts.append(h)
    aL = arm2(cn, -1, F, skin, sleeve=shirt, sleeve_to=0.56, el=(-90 * k, 254 * k), wr=(-96 * k, 196 * k), bulk=1.7, hand_ang=-92, curl=0.9, hr=10.5 * k)
    c = aL.hand_c   # a chain wound round the fist, a meat hook swinging on the end of it
    for i in range(9):
        y = c[1] - 6 * k - i * 11 * k; x = c[0] + math.sin(i * 0.8) * 3 * k
        aL.flat(ellipse(x, y, (3.2 if i % 2 else 4.6) * k, (5.6 if i % 2 else 4) * k, n=8), '#8a8f99' if i % 2 else '#62666e')
    y = c[1] - 106 * k
    aL.flat(path_limb([(c[0], y + 6 * k), (c[0], y - 22 * k), (c[0] + 12 * k, y - 36 * k), (c[0] + 26 * k, y - 26 * k), (c[0] + 24 * k, y - 8 * k)], [3.6 * k, 3.6 * k, 3.4 * k, 2.8 * k, 0.8 * k], n_end=4), '#aeb2ba')
    aL.flat(ellipse(c[0] + 16 * k, y - 30 * k, 5 * k, 4 * k, n=8), BLOOD)
    parts.append(aL)
    parts.append(arm2(cn, 1, F, skin, sleeve=shirt, sleeve_to=0.56, el=(92 * k, 252 * k), wr=(100 * k, 194 * k), bulk=1.7, hand_ang=-86, curl=0.75, hr=10.5 * k))
    return parts


# ================================================================== BOSS 2. THE ABOMINATION: several men, sewn into one that works.

def abomination():
    cn = 'Abomination'; F = fig(450, w=1.85, hw=1.0); k = F['k']
    s1, s2, s3 = '#a8746c', '#c39a86', '#8d8a72'
    parts = [leg2(cn, -1, F, '#3c3530', s3, torn=0.7, bulk=1.7, hip=(-38 * k, 196 * k), knee=(-44 * k, 102 * k), ank=(-44 * k, 16 * k), bare_foot=True, foot_w=1.4), leg2(cn, 1, F, s1, s1, torn=1, bulk=1.9, hip=(38 * k, 196 * k), knee=(46 * k, 104 * k), ank=(44 * k, 16 * k), bare_foot=True, foot_w=1.5)]
    b, td = body(cn, F, s1, half=[(0, 334), (10, 334), (30, 330), (52, 322), (56, 304), (52, 284), (54, 258), (56, 236), (54, 214), (48, 198), (40, 188), (0, 182)])
    b.clipped(td, [(-140 * k, 340 * k), (-10 * k, 340 * k), (-28 * k, 280 * k), (-6 * k, 236 * k), (-34 * k, 180 * k), (-140 * k, 180 * k)], s2, smooth=False)       # a different man's left side
    b.clipped(td, [(20 * k, 250 * k), (140 * k, 262 * k), (140 * k, 180 * k), (10 * k, 180 * k)], s3, smooth=False)                                              # and a third's hip
    def stitch(pts):
        for a, c in zip(pts, pts[1:]):
            n = max(2, int(math.hypot(c[0] - a[0], c[1] - a[1]) / 9))
            dx, dy = c[0] - a[0], c[1] - a[1]; dl = math.hypot(dx, dy) or 1; nx, ny = -dy / dl * 5, dx / dl * 5
            b.clipped(td, [(a[0] * k - 1, a[1] * k), (c[0] * k - 1, c[1] * k), (c[0] * k + 1, c[1] * k), (a[0] * k + 1, a[1] * k)], '#3a1c1c', smooth=False)
            for i in range(n + 1):
                x, y = a[0] + dx * i / n, a[1] + dy * i / n
                b.clipped(td, [((x - nx) * k - 0.8, (y - ny) * k), ((x + nx) * k - 0.8, (y + ny) * k), ((x + nx) * k + 0.8, (y + ny) * k), ((x - nx) * k + 0.8, (y - ny) * k)], '#201416', smooth=False)
    stitch([(-10, 340), (-28, 280), (-6, 236), (-34, 180)]); stitch([(20, 250), (100, 258)]); stitch([(20, 250), (10, 182)])
    # a face that ended up in the chest: the eyes sewn, the mouth not
    for s in (-1, 1):
        b.clipped(td, [((34 + s * 12 - 7) * k, 300 * k), ((34 + s * 12 + 7) * k, 302 * k), ((34 + s * 12 + 6) * k, 294 * k), ((34 + s * 12 - 6) * k, 293 * k)], SOCKET, smooth=False)
        for j in (-1, 0, 1):
            b.clipped(td, [((34 + s * 12 + j * 4) * k - 0.7, 304 * k), ((34 + s * 12 + j * 4) * k + 0.7, 304 * k), ((34 + s * 12 + j * 4) * k + 0.7, 291 * k), ((34 + s * 12 + j * 4) * k - 0.7, 291 * k)], '#201416', smooth=False)
    b.clipped(td, [(20 * k, 280 * k), (48 * k, 282 * k), (50 * k, 268 * k), (34 * k, 262 * k), (18 * k, 268 * k)], '#24100f', smooth=False)
    for i in range(5):
        b.clipped(td, [((23 + i * 5) * k, 281 * k), ((26.5 + i * 5) * k, 281 * k), ((25 + i * 5) * k, 274 * k)], BONE, smooth=False)
    ribs(b, td, F, shade(s1, 0.6), n=3, y0=300, sternum=False, op=0.35)
    wound(b, td, (-44 * k, 226 * k), 18 * k, seed=5, bone=True)
    b.clipped(td, rect(-140 * k, 176 * k, 140 * k, 198 * k), '#3c3530', smooth=False)
    parts.append(b)
    h, hd, L = skull(cn, F, s2, cx=10 * k, jaw=0.85, eye='#ff7a5a', hair=('thin', '#2a2228'), gaunt=1.05, teeth=(6, 5))
    parts.append(h)
    # the second head, on the left shoulder, hanging
    F2 = dict(F); F2['chin'] = 330 * k; F2['neck'] = 318 * k; F2['head_w'] = F['head_w'] * 0.86
    h2, hd2, L2 = skull(cn + 'B', F2, s3, cx=-64 * k, jaw=0.2, eye=None, hair=None, gaunt=0.95, neck=False, layer=1.5)
    h2.name = cn + '_Prop'; h2.role = PROP; h2.pivot = (-64 * k, 330 * k)
    X2, Y2, u2 = L2['X'], L2['Y'], L2['u']
    for s in (-1, 1):
        for j in (-1, 0, 1):
            h2.clipped(hd2, [(X2(s * 9.5 + j * 3.4) - 0.6, Y2(36)), (X2(s * 9.5 + j * 3.4) + 0.6, Y2(36)), (X2(s * 9.5 + j * 3.4) + 0.6, Y2(26)), (X2(s * 9.5 + j * 3.4) - 0.6, Y2(26))], '#201416', smooth=False)
    parts.append(h2)
    aL = arm2(cn, -1, F, s2, sh=(-90 * k, 314 * k), el=(-122 * k, 240 * k), wr=(-128 * k, 164 * k), bulk=2.3, hand_ang=-94, curl=0.95, hr=14 * k)
    c = aL.hand_c
    for j in range(3):   # bone has been driven through the knuckles
        aL.flat([(c[0] + (j - 1) * 9 * k - 3 * k, c[1] - 8 * k), (c[0] + (j - 1) * 9 * k + 3 * k, c[1] - 8 * k), (c[0] + (j - 1) * 11 * k, c[1] - 40 * k)], '#e6dcc0', smooth=False)
    parts.append(aL)
    aR = arm2(cn, 1, F, s3, sh=(88 * k, 316 * k), el=(120 * k, 262 * k), wr=(150 * k, 206 * k), bulk=1.25, hand_ang=-60, curl=0.3, hr=9 * k, claw='#2a2420')
    # and a second forearm grafted on at the elbow, ending in a butcher's saw
    aR.flat(path_limb([(120 * k, 262 * k), (130 * k, 220 * k), (126 * k, 170 * k)], [11 * k, 10 * k, 7 * k], n_end=5), s1)
    saw = [(118 * k, 172 * k), (134 * k, 172 * k), (138 * k, 88 * k), (128 * k, 78 * k)]
    aR.flat(saw, '#aeb2ba', smooth=False)
    for i in range(9):
        aR.flat([(118 * k + i * 1.1 * k, (170 - i * 10) * k), (112 * k + i * 1.1 * k, (165 - i * 10) * k), (119 * k + i * 1.1 * k, (160 - i * 10) * k)], '#d9dde4', smooth=False)
    aR.flat(rect(116 * k, 168 * k, 136 * k, 176 * k), '#4a3226', smooth=False)
    parts.append(aR)
    return parts


# ================================================================== BOSS 3. MOTHER CARRION: a vulture the size of a horse with a woman's ribs, and her young inside them.

def feathers(p, base, tip, n, col, width, droop=0.0, seed=0):
    """A fan of long flight feathers from `base` toward `tip`, each a blade with a ragged end."""
    rnd = random.Random(seed)
    dx, dy = tip[0] - base[0], tip[1] - base[1]; L = math.hypot(dx, dy); a0 = math.atan2(dy, dx)
    for i in range(n):
        t = i / max(1, n - 1)
        a = a0 + (t - 0.5) * width - droop * t
        l = L * (0.72 + 0.28 * math.sin(t * math.pi)) * rnd.uniform(0.9, 1.05)
        ex, ey = base[0] + math.cos(a) * l, base[1] + math.sin(a) * l
        nx, ny = -math.sin(a), math.cos(a); w = L * 0.075
        mx, my = base[0] + math.cos(a) * l * 0.6, base[1] + math.sin(a) * l * 0.6
        p.shape([(base[0] + nx * w * 0.4, base[1] + ny * w * 0.4), (mx + nx * w, my + ny * w), (ex + nx * w * 0.3, ey + ny * w * 0.3), (ex - math.cos(a) * l * 0.05, ey - math.sin(a) * l * 0.05), (ex - nx * w * 0.5, ey - ny * w * 0.5), (mx - nx * w, my - ny * w), (base[0] - nx * w * 0.4, base[1] - ny * w * 0.4)], col if i % 2 else shade(col, 0.82), smooth=False, lit=False)


def mother_carrion():
    cn = 'Carrion'; F = fig(470, w=0.95); k = F['k']
    plume, skin, bone, glow = '#33263f', '#a88f8c', '#d9cfb8', '#ff5a4a'
    parts = []
    for side in (-1, 1):   # a bird's legs: the knee forward, the hock back, three toes and a spur
        role = LEG_F if side > 0 else LEG_B
        p = part('%s_%s' % (cn, role), role, (side * 36 * k, 196 * k), 0)
        feathers(p, (side * 34 * k, 200 * k), (side * 44 * k, 110 * k), 5, plume, 0.7, seed=3 + side)
        S(p, path_limb([(side * 36 * k, 150 * k), (side * 46 * k, 104 * k), (side * 34 * k, 54 * k), (side * 38 * k, 12 * k)], [9 * k, 6.5 * k, 5 * k, 5.5 * k]), '#8a7c62')
        for i in range(5):
            p.flat(rect((side * 36 - 5) * k, (22 + i * 8) * k, (side * 36 + 5) * k, (24 + i * 8) * k), '#5e5440', smooth=False)                              # scutes
        for dx in (-22, 0, 22):
            p.flat(path_limb([(side * 38 * k, 12 * k), ((side * 38 + dx) * k, 4 * k)], [4.6 * k, 3.2 * k], n_end=4), '#8a7c62')
            p.flat([((side * 38 + dx - 3) * k, 6 * k), ((side * 38 + dx + 3) * k, 6 * k), ((side * 38 + dx * 1.45) * k, -2 * k + 2)], '#1c1614', smooth=False)
        parts.append(p)
    for side in (-1, 1):
        role = WING_F if side > 0 else WING_B
        w = part('%s_%s' % (cn, role), role, (side * 56 * k, 312 * k), 0.5)
        sh, el, wr = (side * 56 * k, 312 * k), (side * 140 * k, 372 * k), (side * 232 * k, 318 * k)
        feathers(w, wr, (side * 330 * k, 250 * k), 7, plume, 1.05, droop=side * 0.25, seed=11 + side)                                     # primaries
        feathers(w, el, (side * 190 * k, 196 * k), 6, plume, 0.8, droop=side * 0.1, seed=17 + side)                                       # secondaries
        feathers(w, sh, (side * 96 * k, 190 * k), 5, plume, 0.7, seed=23 + side)
        S(w, path_limb([sh, el, wr], [15 * k, 11 * k, 7 * k]), shade(plume, 1.25))
        for t in (0.2, 0.45, 0.7):
            c = lerp(el, wr, t); w.flat([(c[0] - 5 * k, c[1] + 6 * k), (c[0] + 5 * k, c[1] + 6 * k), (c[0] + side * 3 * k, c[1] - 12 * k)], shade(plume, 0.7), smooth=False)
        parts.append(w)
    b, td = body(cn, F, skin, half=[(0, 331), (9, 331), (28, 327), (48, 320), (50, 304), (44, 286), (42, 262), (32, 240), (30, 226), (40, 208), (42, 190), (26, 176), (0, 170)], pivot=(0, 196 * k))
    cav = b.flat([(-30 * k, 308 * k), (30 * k, 308 * k), (38 * k, 270 * k), (26 * k, 236 * k), (-26 * k, 236 * k), (-38 * k, 270 * k)], '#2a1218', clip_to=td)   # the chest is open
    for (x, y, r) in ((-12, 284, 12), (13, 268, 11), (-4, 254, 9)):   # her young
        b.clipped(cav, ellipse(x * k, y * k, r * k, r * 1.15 * k, n=12), glow); b.clipped(cav, ellipse((x - 2) * k, (y + 2) * k, r * 0.5 * k, r * 0.55 * k, n=9), '#ffd0b0'); b.clipped(cav, ellipse((x + 2) * k, (y - 2) * k, r * 0.22 * k, r * 0.22 * k, n=6), '#2a1218')
    for s in (-1, 1):
        for i in range(5):
            y = (304 - i * 14) * k
            b.clipped(td, path_limb([(s * 2 * k, y), (s * 22 * k, y - 3 * k), (s * 38 * k, y - 14 * k)], [2.4 * k, 2.2 * k, 1.6 * k], n_end=3), bone)
    b.clipped(td, [(-2.6 * k, 316 * k), (2.6 * k, 316 * k), (2 * k, 244 * k), (-2 * k, 244 * k)], bone, smooth=False)
    feathers(b, (0, 226 * k), (0, 120 * k), 9, plume, 1.5, seed=31)                                                                     # a skirt of tail feathers
    for s in (-1, 1):
        feathers(b, (s * 40 * k, 322 * k), (s * 62 * k, 262 * k), 5, '#e8e2d6', 1.0, seed=37 + s)                                        # the white ruff
    parts.append(b)
    h, hd, L = skull(cn, F, '#b99a96', jaw=0.0, eye=glow, hair=None, gaunt=0.86, ears=False, teeth=(0, 0))
    X, Y, u = L['X'], L['Y'], L['u']
    S(h, [(X(-10), Y(22)), (X(10), Y(22)), (X(7), Y(4)), (X(3), Y(-16)), (X(-2), Y(-24)), (X(-4), Y(-12)), (X(-7), Y(4))], '#2a2428')              # the beak comes down over where a mouth was
    h.flat([(X(-10), Y(22)), (X(10), Y(22)), (X(6), Y(13)), (X(-6), Y(13))], '#c9a04a', smooth=False)
    h.flat([(X(-3.5), Y(14)), (X(-1.5), Y(14)), (X(-1.5), Y(10)), (X(-3.5), Y(10))], SOCKET, smooth=False); h.flat([(X(3.5), Y(14)), (X(1.5), Y(14)), (X(1.5), Y(10)), (X(3.5), Y(10))], SOCKET, smooth=False)
    cr = [(X(-19), Y(50)), (X(-21), Y(72)), (X(-12), Y(60)), (X(-7), Y(78)), (X(0), Y(62)), (X(7), Y(78)), (X(12), Y(60)), (X(21), Y(72)), (X(19), Y(50))]
    P(h, cr, '#b98f2e'); h.flat([(X(-19), Y(50)), (X(19), Y(50)), (X(19), Y(54)), (X(-19), Y(54))], '#7a5a1e', smooth=False); h.flat(ellipse(X(0), Y(57), 2.6 * u, 2.6 * u, n=8), glow)
    parts.append(h)
    return parts


# ================================================================== BOSS 4. THE UNDERTAKER: Keeper of the Nails. Very tall, very thin, and in no hurry.

def croupier():
    cn = 'Croupier'; F = fig(566, w=0.84, hw=0.94); k = F['k']
    skin, coat, vest = '#c9c2b4', '#17151b', '#3a3640'
    parts = [leg2(cn, -1, F, coat, boot='#0e0d10', bulk=0.86), leg2(cn, 1, F, coat, boot='#0e0d10', bulk=0.86)]
    for side in (-1, 1):   # the tails of a mourning cloak, behind him
        pr = part('%s_Prop%s' % (cn, 'L' if side < 0 else 'R'), PROP, (side * 46 * k, 318 * k), 0.5)
        P(pr, [(side * 30 * k, 322 * k), (side * 58 * k, 316 * k), (side * 82 * k, 220 * k), (side * 92 * k, 96 * k), (side * 80 * k, 112 * k), (side * 74 * k, 84 * k), (side * 62 * k, 110 * k), (side * 54 * k, 78 * k), (side * 44 * k, 120 * k), (side * 36 * k, 220 * k)], '#221f29')
        parts.append(pr)
    b, td = body(cn, F, coat, chest=0.98, slump=0.2)
    b.clipped(td, [(-13 * k, 331 * k), (13 * k, 331 * k), (10 * k, 240 * k), (-10 * k, 240 * k)], vest, smooth=False)
    b.clipped(td, [(-7 * k, 331 * k), (7 * k, 331 * k), (3 * k, 300 * k), (-3 * k, 300 * k)], '#e8e2d6', smooth=False)
    b.clipped(td, [(-4 * k, 326 * k), (4 * k, 326 * k), (6 * k, 314 * k), (0, 304 * k), (-6 * k, 314 * k)], '#0e0d10', smooth=False)             # cravat
    for i in range(4):
        b.clipped(td, ellipse(0, (290 - i * 13) * k, 1.6 * k, 1.6 * k, n=6), '#8a8690')
    b.flat([(-34 * k, 238 * k), (34 * k, 238 * k), (44 * k, 150 * k), (30 * k, 128 * k), (16 * k, 180 * k), (0, 196 * k), (-16 * k, 180 * k), (-30 * k, 128 * k), (-44 * k, 150 * k)], coat, smooth=False)   # the skirts of the coat
    b.clipped(td, [(10 * k, 262 * k), (24 * k, 266 * k), (22 * k, 250 * k)], '#c9a04a', smooth=False)                                       # a watch chain
    parts.append(b)
    h, hd, L = skull(cn, F, skin, jaw=0.0, eye='#9fe2ff', hair=None, gaunt=0.82, teeth=(8, 0))
    X, Y, u = L['X'], L['Y'], L['u']
    P(h, [(X(-17), Y(50)), (X(17), Y(50)), (X(18.5), Y(104)), (X(-18.5), Y(104))], '#0e0d10')                                              # a stovepipe hat
    P(h, [(X(-30), Y(49)), (X(30), Y(49)), (X(28), Y(53.5)), (X(-28), Y(53.5))], '#17151b')
    h.flat([(X(-17.2), Y(54)), (X(17.2), Y(54)), (X(17.6), Y(64)), (X(-17.6), Y(64))], '#3a3640', smooth=False)
    P(h, [(X(15), Y(64)), (X(19), Y(60)), (X(26), Y(18)), (X(20), Y(26))], '#2a2730')                                                       # the crepe, hanging
    parts.append(h)
    aL = arm2(cn, -1, F, skin, sleeve=coat, sleeve_to=0.93, el=(-56 * k, 250 * k), wr=(-62 * k, 192 * k), hand_ang=-94, curl=0.9, bulk=0.82, hr=7 * k)
    c = aL.hand_c   # a coffin mallet
    aL.flat(path_limb([(c[0], c[1] + 16 * k), (c[0] - 2 * k, c[1] - 72 * k)], [2.6 * k, 2.6 * k], n_end=4), '#3a2a22')
    P(aL, rrect(c[0] - 2 * k, c[1] - 84 * k, 44 * k, 24 * k, 4 * k), '#2a2226'); aL.flat(rect(c[0] - 24 * k, c[1] - 90 * k, c[0] - 20 * k, c[1] - 78 * k), '#5a565e', smooth=False); aL.flat(rect(c[0] + 16 * k, c[1] - 90 * k, c[0] + 20 * k, c[1] - 78 * k), '#5a565e', smooth=False)
    parts.append(aL)
    aR = arm2(cn, 1, F, skin, sleeve=coat, sleeve_to=0.93, el=(64 * k, 262 * k), wr=(74 * k, 304 * k), hand_ang=78, curl=0.75, bulk=0.82, hr=7 * k)
    c = aR.hand_c   # a fan of long nails
    for i in range(5):
        a = math.radians(50 + i * 20)
        e = (c[0] + math.cos(a) * 54 * k, c[1] + math.sin(a) * 54 * k)
        aR.flat([(c[0] - 1.6 * k, c[1]), (c[0] + 1.6 * k, c[1]), e], '#c9cdd6', smooth=False); aR.flat(ellipse(c[0] + math.cos(a) * 8 * k, c[1] + math.sin(a) * 8 * k, 2.6 * k, 2.6 * k, n=6), '#8a8f99')
    parts.append(aR)
    return parts


# ================================================================== BOSS 5. THE GRAVEDIGGER, Warden of Deadwater: hooded, a lantern and a spade.

def gravedigger():
    cn = 'Gravedigger'; F = fig(640, w=1.0, hw=1.0); k = F['k']
    cloak, skin, lamp = '#131116', '#8f8a80', '#f2c230'
    parts = [leg2(cn, -1, F, '#1c1a20', boot='#0e0d10'), leg2(cn, 1, F, '#1c1a20', boot='#0e0d10')]
    b, td = body(cn, F, cloak, chest=1.05)
    rnd = random.Random(5)
    hem = [(-58 * k, 250 * k), (-70 * k, 150 * k)] + [((-70 + i * 14) * k, (118 + (0 if i % 2 else rnd.uniform(10, 28))) * k) for i in range(11)] + [(70 * k, 150 * k), (58 * k, 250 * k), (56 * k, 320 * k), (-56 * k, 320 * k)]
    P(b, hem, cloak)                                                                                                                      # the cloak, to the knee, the hem in rags
    b.flat([(-6 * k, 318 * k), (6 * k, 318 * k), (10 * k, 130 * k), (-10 * k, 130 * k)], '#1f1c24', smooth=False)
    b.flat(rect(-60 * k, 232 * k, 60 * k, 242 * k), '#3a2a1c', smooth=False); b.flat(rrect(0, 237 * k, 16 * k, 14 * k, 2 * k), '#8a6a2a', smooth=False)   # a rope belt and its buckle
    for i in range(3):
        b.flat(path_limb([((-30 + i * 6) * k, 232 * k), ((-34 + i * 6) * k, 196 * k)], [1.6 * k, 1.2 * k], n_end=3), '#8a6a2a')              # keys
    parts.append(b)
    h, hd, L = skull(cn, F, skin, jaw=0.4, eye=lamp, hair=None, gaunt=0.9, teeth=(7, 5))
    X, Y, u = L['X'], L['Y'], L['u']
    hood = [(X(0), Y(74)), (X(18), Y(68)), (X(30), Y(46)), (X(32), Y(14)), (X(38), Y(-20)), (X(20), Y(-26)), (X(16), Y(6)), (X(15), Y(34)), (X(0), Y(47)), (X(-15), Y(34)), (X(-16), Y(6)), (X(-20), Y(-26)), (X(-38), Y(-20)), (X(-32), Y(14)), (X(-30), Y(46)), (X(-18), Y(68))]
    P(h, hood, cloak)
    h.clipped(hd, [(X(-22), Y(60)), (X(22), Y(60)), (X(22), Y(30)), (X(-22), Y(30))], '#0b0a0d', smooth=False, opacity=0.78)                 # the hood's shadow leaves the eyes and the jaw
    for s in (-1, 1):
        h.flat(ellipse(X(s * 9.6), Y(30.6), 2.2 * u, 2.2 * u, n=8), lamp)
    parts.append(h)
    aL = arm2(cn, -1, F, skin, sleeve=cloak, sleeve_to=0.92, el=(-66 * k, 252 * k), wr=(-72 * k, 200 * k), hand_ang=-92, curl=0.9)
    c = aL.hand_c   # the lantern
    aL.flat(path_limb([(c[0], c[1] - 4 * k), (c[0], c[1] - 20 * k)], [1.4 * k, 1.4 * k], n_end=3), '#5a565e')
    P(aL, [(c[0] - 12 * k, c[1] - 20 * k), (c[0] + 12 * k, c[1] - 20 * k), (c[0] + 9 * k, c[1] - 26 * k), (c[0] - 9 * k, c[1] - 26 * k)], '#2a2226')
    P(aL, [(c[0] - 10 * k, c[1] - 26 * k), (c[0] + 10 * k, c[1] - 26 * k), (c[0] + 12 * k, c[1] - 54 * k), (c[0] - 12 * k, c[1] - 54 * k)], lamp)
    aL.flat(ellipse(c[0], c[1] - 42 * k, 5 * k, 8 * k, n=10), '#fff3c0'); aL.flat(rect(c[0] - 1 * k, c[1] - 54 * k, c[0] + 1 * k, c[1] - 26 * k), '#2a2226', smooth=False)
    P(aL, [(c[0] - 14 * k, c[1] - 54 * k), (c[0] + 14 * k, c[1] - 54 * k), (c[0] + 10 * k, c[1] - 60 * k), (c[0] - 10 * k, c[1] - 60 * k)], '#2a2226')
    parts.append(aL)
    aR = arm2(cn, 1, F, skin, sleeve=cloak, sleeve_to=0.92, el=(72 * k, 262 * k), wr=(82 * k, 318 * k), hand_ang=90, curl=0.9)
    c = aR.hand_c   # the spade, blade up
    aR.flat(path_limb([(c[0], c[1] - 300 * k), (c[0], c[1] + 62 * k)], [3.6 * k, 3.6 * k], n_end=4), '#4a3626')
    P(aR, [(c[0] - 20 * k, c[1] + 60 * k), (c[0] + 20 * k, c[1] + 60 * k), (c[0] + 22 * k, c[1] + 96 * k), (c[0] + 11 * k, c[1] + 112 * k), (c[0], c[1] + 118 * k), (c[0] - 11 * k, c[1] + 112 * k), (c[0] - 22 * k, c[1] + 96 * k)], '#8a8f99')
    aR.flat([(c[0] - 11 * k, c[1] + 112 * k), (c[0], c[1] + 118 * k), (c[0] + 11 * k, c[1] + 112 * k), (c[0] + 8 * k, c[1] + 102 * k), (c[0] - 8 * k, c[1] + 102 * k)], '#4a3a28', smooth=False)   # earth still on it
    aR.flat(rect(c[0] - 1.2 * k, c[1] + 62 * k, c[0] + 1.2 * k, c[1] + 100 * k), '#5e626c', smooth=False)
    parts.append(aR)
    return parts


# ================================================================== BOSS 6. THE FOUNDER, Father of Deadwater Gulch: the frock coat he was buried in, an iron crown, his chest open on the thing that keeps him up.

def last_dealer():
    cn = 'LastDealer'; F = fig(630, w=1.5, hw=1.04); k = F['k']
    skin, coat, bone, glow = '#b9b0a0', '#1a1420', '#e0d6bc', '#ff5a3a'
    parts = [leg2(cn, -1, F, '#1f1a24', bulk=1.45, hip=(-34 * k, 198 * k), knee=(-38 * k, 104 * k), ank=(-38 * k, 16 * k), boot='#0e0d10', foot_w=1.3), leg2(cn, 1, F, '#1f1a24', bulk=1.45, hip=(34 * k, 198 * k), knee=(38 * k, 104 * k), ank=(38 * k, 16 * k), boot='#0e0d10', foot_w=1.3)]
    for side in (-1, 1):   # blades fanned behind each shoulder
        pr = part('%s_Prop%s' % (cn, 'L' if side < 0 else 'R'), PROP, (side * 70 * k, 318 * k), 0.5)
        for i in range(5):
            a = math.radians(90 - side * (18 + i * 22))
            base = (side * 66 * k, 316 * k); e = (base[0] + math.cos(a) * 120 * k, base[1] + math.sin(a) * 120 * k); nx, ny = -math.sin(a) * 6 * k, math.cos(a) * 6 * k
            pr.shape([(base[0] + nx, base[1] + ny), (base[0] + math.cos(a) * 96 * k + nx, base[1] + math.sin(a) * 96 * k + ny), e, (base[0] + math.cos(a) * 96 * k - nx * 0.4, base[1] + math.sin(a) * 96 * k - ny * 0.4), (base[0] - nx * 0.4, base[1] - ny * 0.4)], '#b9bec8', smooth=False)
        parts.append(pr)
    b, td = body(cn, F, coat, chest=1.08)
    b.flat([(-52 * k, 240 * k), (52 * k, 240 * k), (66 * k, 120 * k), (40 * k, 104 * k), (20 * k, 170 * k), (0, 190 * k), (-20 * k, 170 * k), (-40 * k, 104 * k), (-66 * k, 120 * k)], coat, smooth=False)   # the skirts of the frock coat
    cav = b.flat([(-34 * k, 318 * k), (34 * k, 318 * k), (40 * k, 276 * k), (30 * k, 244 * k), (-30 * k, 244 * k), (-40 * k, 276 * k)], '#2a0f10', clip_to=td)
    b.clipped(cav, ellipse(-4 * k, 284 * k, 15 * k, 17 * k, n=12), glow); b.clipped(cav, ellipse(-6 * k, 287 * k, 8 * k, 9 * k, n=10), '#ffc08a'); b.clipped(cav, ellipse(-7 * k, 289 * k, 3 * k, 3.4 * k, n=8), '#fff0d0')   # what keeps him up
    for s in (-1, 1):
        for i in range(5):
            y = (312 - i * 14) * k
            b.clipped(td, path_limb([(s * 3 * k, y), (s * 24 * k, y - 3 * k), (s * 40 * k, y - 15 * k)], [2.8 * k, 2.6 * k, 1.8 * k], n_end=3), bone)
    b.clipped(td, [(-3 * k, 322 * k), (3 * k, 322 * k), (2.4 * k, 250 * k), (-2.4 * k, 250 * k)], bone, smooth=False)
    for s in (-1, 1):   # lapels, and the gold he was buried with
        b.clipped(td, [(s * 9 * k, 331 * k), (s * 40 * k, 328 * k), (s * 44 * k, 276 * k), (s * 34 * k, 244 * k), (s * 30 * k, 244 * k), (s * 40 * k, 276 * k), (s * 34 * k, 318 * k)], '#3a2c46', smooth=False)
        for i in range(3):
            b.clipped(td, ellipse(s * 48 * k, (296 - i * 20) * k, 2.6 * k, 2.6 * k, n=8), '#c9a04a')
    parts.append(b)
    h, hd, L = skull(cn, F, skin, jaw=0.5, eye=glow, hair=None, gaunt=0.9, teeth=(8, 6), brow=1.8)
    X, Y, u = L['X'], L['Y'], L['u']
    S(h, [(X(-12), Y(8)), (X(-15), Y(-8)), (X(-9), Y(-30)), (X(-3), Y(-48)), (X(0), Y(-34)), (X(4), Y(-52)), (X(9), Y(-30)), (X(15), Y(-8)), (X(12), Y(8)), (X(6), Y(-2)), (X(0), Y(0)), (X(-6), Y(-2))], '#d8d2c6')   # the beard went on growing
    cr = [(X(-21), Y(46)), (X(-23), Y(66)), (X(-15), Y(57)), (X(-11), Y(74)), (X(-4), Y(58)), (X(0), Y(78)), (X(4), Y(58)), (X(11), Y(74)), (X(15), Y(57)), (X(23), Y(66)), (X(21), Y(46))]
    P(h, cr, '#3a3a44'); h.flat([(X(-21), Y(46)), (X(21), Y(46)), (X(21), Y(51)), (X(-21), Y(51))], '#23232a', smooth=False)
    for x in (-14, 0, 14):
        h.flat(ellipse(X(x), Y(48.5), 1.6 * u, 1.6 * u, n=6), '#8a8f99')
    parts.append(h)
    for side in (-1, 1):
        a = arm2(cn, side, F, skin, sleeve=coat, sleeve_to=0.9, sh=(side * 76 * k, 314 * k), el=(side * 104 * k, 262 * k), wr=(side * 128 * k, 300 * k) if side > 0 else (side * 112 * k, 204 * k), hand_ang=70 if side > 0 else -100, curl=0.25, bulk=1.5, hr=10 * k, claw='#1a1420')
        parts.append(a)
    return parts


ROSTER = [
    ('Shambler', shambler), ('Sprinter', sprinter), ('Crawler', crawler), ('Bloater', bloater), ('Spitter', spitter),
    ('Leaper', leaper), ('Wisp', wisp), ('Brute', brute), ('Screamer', screamer), ('Burrower', burrower),
    ('Gilded', gilded), ('Riot', riot), ('Priest', priest),
    ('BigTony', big_tony), ('Abomination', abomination), ('Carrion', mother_carrion), ('Croupier', croupier), ('Gravedigger', gravedigger), ('LastDealer', last_dealer),
]
