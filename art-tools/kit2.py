"""Shared builders for the creature packs of the later maps. Everything stands on the anatomy kit in creatures.py."""
import math
import random
from types import SimpleNamespace
from vectorkit import Part, ellipse, blobby, limb, path_limb, rect, shade, light, mixc
from creatures import (BODY, HEAD, ARM_B, ARM_F, LEG_B, LEG_F, TAIL, WING_B, WING_F, PROP, INK, BONE, BLOOD, GOLD, SOCKET,
                       part, S, P, M, mv, lerp, rrect, hat, fig, torso_pts, ribs, skull, hand2, arm2, leg2, body, trousers_top, wound, splat,
                       skirt, F1, wing, feathers)

POSE = dict(L=((-60, 246), (-66, 192), -96), R=((62, 250), (60, 196), -84))


def man(cn, H=400, w=1.0, hw=1.0, skin='#8f9d7c', top='#cdbf9f', pants='#54453c', boot='#3a2c26', slump=0.4, belly=0.0, chest=1.0,
        jaw=0.5, eye='#f1e3a0', hair=None, gaunt=1.0, teeth=(5, 4), brow=1.0, ears=True, hx=0, torn=(0.3, 0.0), bare_feet=False,
        leg_bulk=1.0, foot_w=1.0, stance=None, pose=None, sleeve=True, sleeve_to=(0.6, 0.3), claw=None, curl=(0.3, 0.2), hr=None, arm_bulk=1.0,
        belt='#2e2420', half=None, sh=None, legs=True, neck=True, gown=None):
    """A standing figure: legs, trunk, head, arms. Returns the parts by name so the caller can dress them.
    `pose` gives each arm's elbow, wrist (in 400-figure units) and hand angle; `stance` = (hip x, knee x, ankle x) for a broad build."""
    F = fig(H, w, hw); k = F['k']
    m = SimpleNamespace(F=F, k=k, cn=cn, extra=[])
    m.legs = []
    if legs:
        for i, side in enumerate((-1, 1)):
            kw = dict(hip=(side * stance[0] * k, 198 * k), knee=(side * stance[1] * k, 104 * k), ank=(side * stance[2] * k, 16 * k)) if stance else {}
            m.legs.append(leg2(cn, side, F, pants, skin, torn=torn[i], boot=boot, bulk=leg_bulk, bare_foot=bare_feet, foot_w=foot_w, **kw))
    if gown:   # robed: no legs, a long garment to the ground drawn under the trunk
        m.legs = []
        m.b = part(cn + '_Body', BODY, (0, 120 * k), 1)
        skirt(m.b, F, **gown)
        m.td = S(m.b, M(torso_pts(F, belly, chest, slump)), top)
    else:
        m.b, m.td = body(cn, F, top, belly=belly, chest=chest, slump=slump, half=half)
    if belt is not None:
        trousers_top(m.b, m.td, F, pants, belt=belt or None)
    m.h, m.hd, m.L = skull(cn, F, skin, cx=hx * k, jaw=jaw, eye=eye, hair=hair, gaunt=gaunt, teeth=teeth, brow=brow, ears=ears, neck=neck)
    m.X, m.Y, m.u = m.L['X'], m.L['Y'], m.L['u']
    pose = pose or POSE
    arms = []
    for i, (side, key) in enumerate(((-1, 'L'), (1, 'R'))):
        el, wr, ang = pose[key]
        kw = dict(sh=(side * sh[0] * k, sh[1] * k)) if sh else {}
        arms.append(arm2(cn, side, F, skin, sleeve=top if sleeve else None, sleeve_to=sleeve_to[i], el=(el[0] * k, el[1] * k), wr=(wr[0] * k, wr[1] * k),
                         hand_ang=ang, curl=curl[i], claw=claw, hr=hr * k if hr else None, bulk=arm_bulk, **kw))
    m.aL, m.aR = arms
    m.parts = lambda: m.legs + m.extra + [m.b, m.h, m.aL, m.aR]
    return m


def q(k, pts):
    return [(x * k, y * k) for x, y in pts]


def bird_leg(cn, side, hipx, k, col, plume=None, seed=0):
    """A bird's leg: knee forward, hock back, three toes and a spur."""
    role = LEG_F if side > 0 else LEG_B
    p = part('%s_%s' % (cn, role), role, (side * hipx * k, 196 * k), 0)
    if plume:
        feathers(p, (side * (hipx - 2) * k, 200 * k), (side * (hipx + 8) * k, 110 * k), 5, plume, 0.7, seed=seed + side)
    S(p, path_limb([(side * hipx * k, 150 * k), (side * (hipx + 10) * k, 104 * k), (side * (hipx - 2) * k, 54 * k), (side * (hipx + 2) * k, 12 * k)], [9 * k, 6.5 * k, 5 * k, 5.5 * k]), col)
    for i in range(5):
        p.flat(rect((side * hipx - 5) * k, (22 + i * 8) * k, (side * hipx + 5) * k, (24 + i * 8) * k), shade(col, 0.66), smooth=False)
    for dx in (-22, 0, 22):
        p.flat(path_limb([(side * (hipx + 2) * k, 12 * k), ((side * (hipx + 2) + dx) * k, 4 * k)], [4.6 * k, 3.2 * k], n_end=4), col)
        p.flat([((side * (hipx + 2) + dx - 3) * k, 6 * k), ((side * (hipx + 2) + dx + 3) * k, 6 * k), ((side * (hipx + 2) + dx * 1.45) * k, -2 * k + 2)], '#1c1614', smooth=False)
    return p


def coat_skirts(b, k, col, w=54, flare=70, bottom=116, split=190):
    """The skirts of a long coat, hanging open below the waist."""
    b.flat(q(k, [(-w, 240), (w, 240), (flare, bottom), (flare * 0.6, bottom - 16), (20, split - 22), (0, split), (-20, split - 22), (-flare * 0.6, bottom - 16), (-flare, bottom)]), col, smooth=False)


def spikes(p, pts, col, hl=None):
    """Icicles, thorns, teeth: each (x, y, length, half-width, angle in degrees)."""
    for (x, y, l, w, ang) in pts:
        a = math.radians(ang); nx, ny = -math.sin(a) * w, math.cos(a) * w; e = (x + math.cos(a) * l, y + math.sin(a) * l)
        p.flat([(x + nx, y + ny), e, (x - nx, y - ny)], col, smooth=False)
        if hl:
            p.flat([(x + nx, y + ny), e, (x + nx * 0.2, y + ny * 0.2)], hl, smooth=False)


def peaked_cap(m, col, band, badge='#d8b85a'):
    """A railwayman's or officer's cap: flat crown, band, a short shiny peak."""
    h, X, Y = m.h, m.X, m.Y
    P(h, [(X(-23), Y(46)), (X(-26), Y(60)), (X(-14), Y(66)), (X(14), Y(66)), (X(26), Y(60)), (X(23), Y(46))], col)
    h.flat([(X(-23), Y(46)), (X(23), Y(46)), (X(24), Y(52)), (X(-24), Y(52))], band, smooth=False)
    P(h, [(X(-22), Y(46.5)), (X(22), Y(46.5)), (X(19), Y(41)), (X(0), Y(39)), (X(-19), Y(41))], '#101014')
    h.flat(ellipse(X(0), Y(55), 3.6 * m.u, 4 * m.u, n=8), badge)


def big_cat(cn, fur, dark, pale, mane, eye):
    """A lion seen from the front: a mane round a broad skull, the chest, forelegs under it, haunches past the shoulders."""
    parts = []
    for side in (-1, 1):
        role = LEG_F if side > 0 else LEG_B
        p = part('%s_%s' % (cn, role), role, (side * 50, 100), 0)
        S(p, ellipse(side * 52, 100, 24, 34, n=14), dark)
        p.flat(path_limb([(side * 58, 80), (side * 72, 44), (side * 64, 8)], [10, 6.5, 6], n_end=4), dark); p.flat(ellipse(side * 66, 5, 11, 6, n=8), dark)
        parts.append(p)
    b = part(cn + '_Body', BODY, (0, 84), 1)
    b.flat(path_limb([(40, 120), (96, 150), (120, 110), (112, 70)], [5, 4, 3, 2.4], n_end=3), fur); b.flat(ellipse(112, 64, 9, 12, n=8), mane)     # the tail and its tuft
    td = S(b, M([(0, 162), (26, 160), (48, 138), (52, 106), (44, 78), (24, 60), (0, 56)]), fur)
    b.clipped(td, M([(0, 150), (14, 146), (20, 116), (14, 84), (0, 72)]), pale)
    for i in range(4):
        b.clipped(td, [(28, 134 - i * 12), (50, 128 - i * 12), (50, 124 - i * 12), (28, 129 - i * 12)], shade(fur, 0.6), smooth=False, opacity=0.8)
        b.clipped(td, [(-28, 134 - i * 12), (-50, 128 - i * 12), (-50, 124 - i * 12), (-28, 129 - i * 12)], shade(fur, 0.6), smooth=False, opacity=0.8)
    parts.append(b)
    h = part(cn + '_Head', HEAD, (0, 132), 2)
    rnd = random.Random(7)
    spikes(h, [(math.cos(a) * 30, 168 + math.sin(a) * 28, 26 + rnd.uniform(0, 34), 7 + rnd.uniform(0, 5), math.degrees(a) + rnd.uniform(-14, 14)) for a in [i / 22 * 6.283 for i in range(22) if i not in (3, 4, 15)]], mane, shade(mane, 0.8))
    S(h, blobby(0, 168, 42, 40, n=18, jitter=0.12, seed=4), mane)
    S(h, M([(0, 128), (12, 128), (20, 118), (16, 98), (0, 92)]), dark)                                                                         # lower jaw
    h.flat(M([(0, 122), (8, 120), (7, 104), (0, 100)]), '#7a2a30')
    for s in (-1, 1):
        spikes(h, [(s * 13, 122, 13, 2.6, 90), (s * 6, 124, 7, 1.8, 90)], BONE)
    hd = S(h, M([(0, 196), (16, 194), (30, 180), (32, 160), (26, 144), (18, 134), (14, 118), (0, 114)]), fur)
    h.clipped(hd, M([(0, 156), (9, 152), (14, 134), (13, 118), (0, 114)]), pale)
    for s in (-1, 1):
        S(h, ellipse(s * 26, 196, 9, 9, n=10), fur); h.flat(ellipse(s * 26, 196, 5, 5, n=8), '#3a3038')
        h.clipped(hd, [(s * 7, 168), (s * 22, 174), (s * 24, 166), (s * 10, 161)], '#101014', smooth=False); h.clipped(hd, ellipse(s * 15.5, 167.5, 3, 2.4, n=8), eye)
        spikes(h, [(s * 12, 120, 16, 3, -90)], BONE)
        for j in range(3):
            h.clipped(hd, path_limb([(s * 12, 132 - j * 3), (s * 34, 136 - j * 7)], [0.5, 0.3], n_end=2), '#e8e2d0')
    h.clipped(hd, [(-7, 126), (7, 126), (4, 117), (-4, 117)], '#101014', smooth=False)
    h.clipped(hd, [(-12, 122), (12, 122), (9, 113), (-9, 113)], BLOOD, smooth=False, opacity=0.7)
    h.clipped(hd, [(14, 186), (17, 186), (24, 150), (21, 150)], '#7a3a3a', smooth=False)
    for s in (-1, 1):
        h.clipped(hd, [(s * 20, 158), (s * 30, 160), (s * 24, 140), (s * 17, 138)], shade(fur, 0.6), smooth=False, opacity=0.7)
    parts.append(h)
    for side in (-1, 1):
        role = ARM_F if side > 0 else ARM_B
        a = part('%s_%s' % (cn, role), role, (side * 26, 114), 3)
        S(a, path_limb([(side * 26, 116), (side * 30, 64), (side * 26, 10)], [14, 9, 8]), fur)
        a.flat(ellipse(side * 27, 6, 13, 7, n=10), fur); spikes(a, [(side * 27 + j * 7, 4, 9, 1.8, -90 + j * 10) for j in (-1, 0, 1)], '#1c1614')
        parts.append(a)
    return parts
