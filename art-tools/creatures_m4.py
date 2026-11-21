"""Carnival of Ash: the show burned, and went on."""
from kit2 import *   # noqa: F401,F403

RED, CREAM, ASH, EMBER, GOLDC = '#8a2a26', '#d8cfb4', '#3a3634', '#ff7a2a', '#d8b85a'


def _burn(b, td, pts, k=1.0):
    for (x, y, r) in pts:
        b.clipped(td, ellipse(x * k, y * k, r * k, r * 0.8 * k, n=9), '#1e1a18', opacity=0.6); b.clipped(td, ellipse(x * k, y * k, r * 0.4 * k, r * 0.3 * k, n=7), EMBER, opacity=0.8)


def _stripes(b, td, k, y0, y1, c1, c2, step=14, w=90):
    for i, x in enumerate(range(-w, w, step)):
        b.clipped(td, q(k, [(x, y1), (x + step, y1), (x + step, y0), (x, y0)]), c1 if i % 2 else c2, smooth=False)


def _greasepaint(m, smile='#8a2a26'):
    """A clown's white face, cracked, the smile painted wider than the mouth."""
    h, hd, X, Y, u = m.h, m.hd, m.X, m.Y, m.u
    h.clipped(hd, [(X(-20), Y(52)), (X(20), Y(52)), (X(19), Y(6)), (X(-19), Y(6))], '#e8e2d6', smooth=False, opacity=0.9)
    for s in (-1, 1):
        h.clipped(hd, [(X(s * 6), Y(36)), (X(s * 9.6), Y(46)), (X(s * 13), Y(36)), (X(s * 9.6), Y(22))], '#2a2a3a', smooth=False)
        h.clipped(hd, ellipse(X(s * 9.6), Y(30.6), 1.9 * u, 1.9 * u, n=8), '#ffd24a')
        h.clipped(hd, [(X(s * 10), Y(11)), (X(s * 17), Y(20)), (X(s * 16), Y(13)), (X(s * 11), Y(7))], smile, smooth=False)
    h.clipped(hd, ellipse(X(0), Y(21), 4.4 * u, 4.4 * u, n=10), smile)
    for (a, b2, c, d) in ((-14, 50, -9, 40), (12, 26, 16, 16), (-4, 14, -8, 6)):
        h.clipped(hd, [(X(a), Y(b2)), (X(a + 1), Y(b2)), (X(c + 0.5), Y(d)), (X(c - 0.5), Y(d))], '#6a6258', smooth=False)


# ================================================================== 1. ROUSTABOUT: drove the tent pegs. Still has the maul.
def roustabout():
    m = man('Roustabout', 400, skin='#8f8a7c', top=CREAM, pants='#3a3634', slump=0.6, jaw=0.5, eye='#ffb060', torn=(0.2, 0.0), sleeve_to=(0.35, 0.35), curl=(0.3, 0.9),
            pose=dict(L=((-60, 246), (-64, 190), -94), R=((64, 250), (70, 200), -86)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    for i, y in enumerate(range(240, 332, 13)):
        if i % 2:
            b.clipped(td, rect(-90 * k, y * k, 90 * k, (y + 13) * k), RED, smooth=False)
    for s in (-1, 1):
        b.clipped(td, q(k, [(s * 15, 332), (s * 22, 332), (s * 30, 236), (s * 23, 236)]), '#2a2420', smooth=False)
    _burn(b, td, [(-28, 290, 14), (30, 262, 12)], k); wound(b, td, (10 * k, 300 * k), 10 * k, seed=3)
    P(h, [(X(-23), Y(44)), (X(-22), Y(56)), (X(0), Y(63)), (X(22), Y(56)), (X(23), Y(44))], '#3a3634'); P(h, [(X(-23), Y(45)), (X(23), Y(45)), (X(32), Y(40)), (X(22), Y(40)), (X(-23), Y(41))], '#24201e')
    c = m.aR.hand_c
    m.aR.flat(path_limb([(c[0] - 2 * k, c[1] + 26 * k), (c[0] + 6 * k, c[1] - 120 * k)], [3 * k, 3 * k], n_end=4), '#6a4a2e'); P(m.aR, [(c[0] - 22 * k, c[1] - 112 * k), (c[0] + 34 * k, c[1] - 116 * k), (c[0] + 36 * k, c[1] - 146 * k), (c[0] - 20 * k, c[1] - 142 * k)], '#4a3a30')
    return m.parts()


# ================================================================== 2. TUMBLER: an acrobat, still in costume, still quick.
def tumbler():
    m = man('Tumbler', 376, w=0.9, skin='#b8ada0', top='#3a5a7a', pants='#3a5a7a', slump=0.1, jaw=0.9, eye='#ffd24a', gaunt=0.9, teeth=(6, 5), torn=(0.3, 0.5), bare_feet=True,
            sleeve_to=(0.2, 0.2), claw='#2a2420', curl=(0.0, 0.0), belt=None, pose=dict(L=((-82, 282), (-98, 338), 100), R=((84, 276), (104, 330), 76)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    for r in range(6):   # harlequin diamonds
        for c in range(-3, 4):
            if (r + c) % 2:
                x, y = c * 20 + (0), 320 - r * 24
                b.clipped(td, q(k, [(x, y + 12), (x + 10, y), (x, y - 12), (x - 10, y)]), GOLDC if (r + c) % 4 == 1 else RED, smooth=False)
    b.clipped(td, q(k, [(-14, 331), (14, 331), (0, 300)]), '#b8ada0', smooth=False); _burn(b, td, [(26, 250, 12)], k)
    _greasepaint(m)
    S(h, [(X(-8), Y(57)), (X(0), Y(74)), (X(8), Y(57))], RED); h.flat(ellipse(X(0), Y(75), 3 * u, 3 * u, n=8), GOLDC)
    return m.parts()


# ================================================================== 3. CONTORTIONIST: folded the way she folded for the crowd, and stayed that way.
def contortionist():
    cn = 'Contortionist'; F = F1(40)
    skin, cos = '#c2b4a8', '#5a2a5a'
    b = part(cn + '_Body', BODY, (0, 60), 1)
    for s in (-1, 1):   # her legs come over her own shoulders; the feet stand either side of her face
        b.shape(path_limb([(s * 26, 150), (s * 70, 176), (s * 104, 130), (s * 86, 60), (s * 78, 12)], [13, 11, 9, 7, 6], n_end=4), cos)
        b.flat(path_limb([(s * 86, 60), (s * 78, 12)], [7, 6], n_end=4), skin); b.flat(ellipse(s * 80, 6, 14, 7, n=10), skin)
        b.flat(ellipse(s * 103, 132, 8, 8, n=8), shade(cos, 0.7))
    td = S(b, M([(0, 160), (26, 158), (50, 140), (58, 112), (50, 88), (30, 74), (0, 72)]), cos)
    for i in range(5):
        b.clipped(td, ellipse(0, 150 - i * 12, 3.4, 3.4, n=6), GOLDC)
    for s in (-1, 1):
        b.clipped(td, [(s * 12, 146), (s * 42, 138), (s * 50, 112), (s * 22, 104)], shade(cos, 0.7), smooth=False, opacity=0.6)
    parts = [b]
    h, hd, L = skull(cn, F, skin, jaw=1.0, eye='#ffd24a', hair=('cap', '#1c1418'), neck=False, teeth=(7, 6), gaunt=0.9)
    X, Y, u = L['X'], L['Y'], L['u']
    h.flat(ellipse(X(0), Y(64), 9 * u, 8 * u, n=10), '#1c1418'); h.clipped(hd, [(X(-12), Y(12)), (X(12), Y(12)), (X(14), Y(18)), (X(-14), Y(18))], RED, smooth=False, opacity=0.8)
    h.pivot = (0, 76); parts.append(h)
    parts.append(arm2(cn, -1, F, skin, sh=(-44, 120), el=(-70, 150), wr=(-46, 44), hand_ang=-100, claw='#2a2420', curl=0.1, hr=8, bulk=0.85))
    parts.append(arm2(cn, 1, F, skin, sh=(44, 120), el=(72, 146), wr=(44, 42), hand_ang=-80, claw='#2a2420', curl=0.1, hr=8, bulk=0.85))
    return parts


# ================================================================== 4. THE GLUTTON: they paid to watch her eat. She has not stopped.
def glutton():
    cn = 'Glutton'; F = fig(440, w=1.22); k = F['k']
    skin, dress = '#c8a898', '#7a2a5a'
    parts = [leg2(cn, -1, F, skin, skin, torn=1, bulk=1.6, hip=(-34 * k, 196 * k), knee=(-40 * k, 104 * k), ank=(-42 * k, 16 * k), foot_w=1.2, boot='#2a2420'), leg2(cn, 1, F, skin, skin, torn=1, bulk=1.6, hip=(34 * k, 196 * k), knee=(40 * k, 104 * k), ank=(42 * k, 16 * k), foot_w=1.2, boot='#2a2420')]
    b, td = body(cn, F, dress, half=[(0, 331), (9, 331), (28, 326), (46, 319), (52, 304), (56, 284), (66, 262), (78, 240), (84, 214), (80, 190), (70, 170), (50, 158), (0, 154)])
    b.clipped(td, q(k, [(-30, 331), (30, 331), (36, 300), (0, 286), (-36, 300)]), skin, smooth=False)
    for (x, y) in ((-50, 270), (-20, 250), (14, 268), (46, 248), (-36, 220), (0, 216), (36, 214), (-58, 196), (-12, 186), (26, 184), (60, 190), (-30, 166), (20, 164)):
        b.clipped(td, ellipse(x * k, y * k, 6 * k, 6 * k, n=8), CREAM)
    b.clipped(td, q(k, [(-6, 300), (6, 300), (10, 190), (2, 170), (-8, 200)]), '#2a1014', smooth=False)                                       # the seam has gone down the front
    b.clipped(td, q(k, [(-3, 290), (3, 290), (5, 200), (-3, 208)]), '#d85a6a', smooth=False)
    for i in range(7):
        b.clipped(td, ellipse((-16 + i * 5.4) * k, (318 - abs(i - 3) * 3) * k, 3 * k, 3 * k, n=6), '#f2ead0')                                    # pearls
    b.flat(q(k, [(-80, 176), (80, 176), (90, 150), (60, 156), (30, 148), (0, 158), (-30, 148), (-60, 156), (-90, 150)]), shade(dress, 0.8), smooth=False)
    parts.append(b)
    h, hd, L = skull(cn, F, skin, jaw=1.1, eye='#ffd24a', hair=('cap', '#b8402a'), gaunt=1.14, teeth=(7, 6))
    X, Y, u = L['X'], L['Y'], L['u']
    for s in (-1, 1):
        h.clipped(hd, ellipse(X(s * 13), Y(12), 7 * u, 8 * u, n=10), light(skin, 1.08), opacity=0.8); h.clipped(hd, ellipse(X(s * 13), Y(18), 4 * u, 3 * u, n=8), '#d85a6a', opacity=0.6)
    h.clipped(hd, [(X(-14), Y(8)), (X(14), Y(8)), (X(10), Y(-14)), (X(-10), Y(-14))], '#f2ead0', smooth=False, opacity=0.7)                     # frosting, mostly
    spikes(h, [(X(x), Y(56), 26 * u, 4 * u, a) for (x, a) in ((-10, 110), (0, 90), (10, 70))], '#d8b85a', '#f2e2a0')
    parts.append(h)
    parts.append(arm2(cn, -1, F, skin, sh=(-54 * k, 312 * k), el=(-86 * k, 254 * k), wr=(-106 * k, 200 * k), bulk=1.4, hand_ang=-104, curl=0.25, hr=8.4 * k))
    parts.append(arm2(cn, 1, F, skin, sh=(54 * k, 312 * k), el=(86 * k, 254 * k), wr=(104 * k, 198 * k), bulk=1.4, hand_ang=-76, curl=0.25, hr=8.4 * k))
    return parts


# ================================================================== 5. KNIFE THROWER: he did the act blindfold. He still does.
def knife_thrower():
    m = man('KnifeThrower', 420, w=0.9, skin='#a89a8a', top='#2a2a34', pants='#2a2a34', slump=0.2, jaw=0.2, eye=None, gaunt=0.9, torn=(0.0, 0.0), sleeve_to=(0.3, 0.3), curl=(0.6, 0.6),
            pose=dict(L=((-62, 246), (-60, 196), -90), R=((74, 270), (88, 330), 84)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    b.clipped(td, q(k, [(-12, 331), (12, 331), (8, 244), (-8, 244)]), CREAM, smooth=False)
    for s in (-1, 1):
        b.clipped(td, q(k, [(s * 12, 331), (s * 26, 328), (s * 12, 250), (s * 8, 250)]), RED, smooth=False)
    b.clipped(td, q(k, [(-52, 322), (-40, 330), (44, 240), (32, 232)]), '#4a3226', smooth=False)
    for i in range(6):
        x, y = -40 + i * 15, 318 - i * 16
        b.clipped(td, q(k, [(x - 1.6, y + 12), (x + 1.6, y + 12), (x + 6, y - 16), (x + 3, y - 18)]), '#c9cdd6', smooth=False); b.clipped(td, q(k, [(x - 3, y + 16), (x + 2, y + 18), (x + 3, y + 10), (x - 2, y + 9)]), '#1c1614', smooth=False)
    h.clipped(m.hd, [(X(-22), Y(38)), (X(22), Y(38)), (X(22), Y(25)), (X(-22), Y(25))], RED, smooth=False); S(h, [(X(18), Y(36)), (X(26), Y(30)), (X(32), Y(4)), (X(24), Y(10))], RED)   # the blindfold
    for s in (-1, 1):
        spikes(h, [(X(s * 2), Y(13), 20 * u, 2.6 * u, 200 if s < 0 else -20)], '#1c1418')
    h.clipped(m.hd, [(X(-22), Y(60)), (X(22), Y(60)), (X(22), Y(46)), (X(8), Y(50)), (X(-6), Y(47)), (X(-22), Y(44))], '#1c1418', smooth=False)
    c = m.aR.hand_c
    for i in range(4):
        a = math.radians(60 + i * 20); e = (c[0] + math.cos(a) * 52 * k, c[1] + math.sin(a) * 52 * k); nx, ny = -math.sin(a) * 3.4 * k, math.cos(a) * 3.4 * k; s0 = (c[0] + math.cos(a) * 16 * k, c[1] + math.sin(a) * 16 * k)
        m.aR.flat([(s0[0] + nx, s0[1] + ny), e, (s0[0] - nx, s0[1] - ny)], '#c9cdd6', smooth=False); m.aR.flat(path_limb([c, s0], [2.6 * k, 2.6 * k], n_end=3), '#1c1614')
    return m.parts()


# ================================================================== 6. BALLOON CLOWN: the balloons outlasted him.
def balloon_clown():
    cn = 'BalloonClown'
    suit, skin = '#c8b83a', '#e8e2d6'
    t = part(cn + '_Tail', TAIL, (0, 78), 0)
    for s in (-1, 1):   # legs hanging, shoes too big
        t.flat(path_limb([(s * 9, 78), (s * 12, 46), (s * 10, 20)], [7, 5.4, 4.4], n_end=4), suit if s > 0 else shade(suit, 0.85))
        t.shape(ellipse(s * 14, 12, 15, 8, n=10), RED)
    parts = [t]
    cols = ['#b8322a', '#d8b83a', '#3a6a9a']
    for side in (-1, 1):   # a fist of strings each side, three balloons on each
        role = WING_F if side > 0 else WING_B
        w = part('%s_%s' % (cn, role), role, (side * 26, 104), 1)
        for i, (bx, by, r) in enumerate(((60, 196, 24), (98, 170, 22), (120, 214, 20))):
            w.flat(path_limb([(side * 28, 108), (side * bx * 0.6, by * 0.7 + 30), (side * bx, by - r)], [0.6, 0.5, 0.5], n_end=2), '#d8d8d0')
            d = w.shape(_bal(side * bx, by, r), cols[(i + (side > 0)) % 3]); w.flat(ellipse(side * bx - r * 0.3, by + r * 0.35, r * 0.22, r * 0.3, n=8), '#ffffff', opacity=0.5)
            w.flat([(side * bx - 3, by - r - 1), (side * bx + 3, by - r - 1), (side * bx, by - r - 7)], cols[(i + (side > 0)) % 3], smooth=False)
        parts.append(w)
    b = part(cn + '_Body', BODY, (0, 100), 2)
    td = S(b, M([(0, 132), (16, 130), (26, 116), (26, 94), (20, 78), (10, 70), (0, 68)]), suit)
    for i in range(3):
        b.clipped(td, ellipse(0, 120 - i * 16, 4.4, 4.4, n=8), RED)
    for s in (-1, 1):
        b.flat(path_limb([(s * 22, 122), (s * 30, 114), (s * 28, 108)], [5.4, 4.4, 4], n_end=4), suit); b.flat(ellipse(s * 28, 106, 5, 5, n=8), skin)
    b.flat([(-22, 136), (-12, 128), (0, 136), (12, 128), (22, 136), (16, 124), (0, 130), (-16, 124)], '#f2ead0', smooth=False)                 # the ruff
    parts.append(b)
    F = F1(122, hw=15); h, hd, L = skull(cn, F, skin, jaw=1.0, eye='#ffd24a', hair=None, neck=False, teeth=(6, 5))
    X, Y, u = L['X'], L['Y'], L['u']
    for s in (-1, 1):
        S(h, ellipse(X(s * 23), Y(40), 9 * u, 10 * u, n=10), '#b8402a'); h.clipped(hd, [(X(s * 6), Y(36)), (X(s * 9.6), Y(46)), (X(s * 13), Y(36)), (X(s * 9.6), Y(22))], '#2a2a3a', smooth=False); h.clipped(hd, ellipse(X(s * 9.6), Y(30.6), 1.9 * u, 1.9 * u, n=8), '#ffd24a')
    h.clipped(hd, ellipse(X(0), Y(21), 4.6 * u, 4.6 * u, n=10), RED)
    h.pivot = (0, 124); parts.append(h)
    return parts


def _bal(cx, cy, r):
    return [(cx + math.cos(t / 14 * 6.283) * r * 0.86, cy + math.sin(t / 14 * 6.283) * r * (1.06 if math.sin(t / 14 * 6.283) > 0 else 1.0)) for t in range(14)]


# ================================================================== 7. JACK: the box was a prop. What is in it now is not.
def jack():
    cn = 'Jack'
    b = part(cn + '_Body', BODY, (0, 30), 1)
    P(b, [(-56, 0), (56, 0), (56, 86), (-56, 86)], '#3a5a7a'); b.flat([(-56, 86), (56, 86), (56, 74), (-56, 74)], GOLDC, smooth=False); b.flat([(-56, 12), (56, 12), (56, 0), (-56, 0)], GOLDC, smooth=False)
    b.flat([(-20, 62), (0, 74), (20, 62), (0, 22)], RED, smooth=False); b.flat(ellipse(0, 46, 7, 7, n=8), GOLDC)
    P(b, [(-56, 86), (-64, 150), (-52, 152), (-44, 88)], '#2e4a66')                                                                           # the lid, thrown back
    b.flat(path_limb([(56, 50), (76, 54), (78, 70)], [2.4, 2.4, 2.4], n_end=3), '#8a8f99'); b.flat(ellipse(78, 74, 6, 6, n=8), RED)           # the crank
    for i in range(7):   # the spring
        y = 86 + i * 14; s = 1 if i % 2 else -1
        b.flat([(-26 * s, y), (26 * s, y + 14), (26 * s, y + 9), (-26 * s, y - 5)], '#8a8f99' if i % 2 else '#6a6e76', smooth=False)
    S(b, M([(0, 214), (22, 210), (34, 196), (30, 182), (0, 178)]), '#7a2a5a'); b.flat([(-34, 200), (-18, 188), (0, 200), (18, 188), (34, 200), (24, 180), (0, 190), (-24, 180)], '#f2ead0', smooth=False)
    parts = [b]
    F = F1(206, hw=20); h, hd, L = skull(cn, F, '#e8e2d6', jaw=1.4, eye='#ff5a4a', hair=None, neck=False, teeth=(8, 7), ears=False)
    X, Y, u = L['X'], L['Y'], L['u']
    for s in (-1, 1):
        h.clipped(hd, [(X(s * 5), Y(38)), (X(s * 9.6), Y(50)), (X(s * 14), Y(38)), (X(s * 9.6), Y(20))], '#2a2a3a', smooth=False); h.clipped(hd, ellipse(X(s * 9.6), Y(30.6), 2.2 * u, 2.2 * u, n=8), '#ff5a4a')
        h.clipped(hd, [(X(s * 11), Y(8)), (X(s * 20), Y(22)), (X(s * 19), Y(12)), (X(s * 12), Y(2))], RED, smooth=False)
        S(h, [(X(s * 4), Y(52)), (X(s * 22), Y(50)), (X(s * 42), Y(66)), (X(s * 50), Y(40)), (X(s * 30), Y(40))], RED if s > 0 else '#3a5a7a'); h.flat(ellipse(X(s * 50), Y(38), 4 * u, 4 * u, n=8), GOLDC)   # the cap and its bells
    h.clipped(hd, ellipse(X(0), Y(21), 4.4 * u, 4.4 * u, n=10), RED)
    h.pivot = (0, 200); parts.append(h)
    for side in (-1, 1):
        a = arm2(cn, side, F1(60), '#7a2a5a', sh=(side * 30, 198), el=(side * 76, 176), wr=(side * 96, 226), hand_ang=90 - side * 20, claw='#1c1614', curl=0.0, hr=9, bulk=0.9)
        parts.append(a)
    return parts


# ================================================================== 8. MANGY LION: nobody fed him after the fire.
def lion():
    return big_cat('Lion', '#8a7448', '#5e4c2c', '#b8a880', '#33241a', '#ffb04a')


# ================================================================== 9. STRONGMAN: lifted the bar every night, twice on Saturdays.
def strongman():
    m = man('Strongman', 480, w=1.5, hw=1.08, skin='#b89a86', top='#b89a86', pants='#2a2a34', boot='#1c1614', belly=0.35, chest=1.16, slump=0.1, leg_bulk=1.55, foot_w=1.3, stance=(34, 38, 38),
            jaw=0.3, eye='#ffb060', gaunt=1.1, teeth=(6, 4), sleeve=False, arm_bulk=1.9, hr=11, curl=(0.9, 0.9), belt=GOLDC, torn=(0, 0),
            pose=dict(L=((-100, 300), (-92, 366), 92), R=((100, 300), (92, 366), 88)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    sk = b.clipped(td, q(k, [(-58, 240), (58, 240), (60, 300), (20, 326), (-4, 290), (-40, 300), (-60, 280)]), '#c8a04a', smooth=False)           # a leopard skin, one shoulder
    for (x, y) in ((-40, 262), (-18, 270), (6, 258), (30, 274), (46, 254), (-28, 248), (16, 300), (40, 300), (-50, 284), (0, 280)):
        b.clipped(td, ellipse(x * k, y * k, 4.4 * k, 3.4 * k, n=7), '#3a2a1c')
    for s in (-1, 1):
        b.clipped(td, q(k, [(s * 4, 318), (s * 56, 312), (s * 60, 290), (s * 30, 284), (s * 4, 290)]), shade('#b89a86', 0.8), opacity=0.4)
    _burn(b, td, [(-30, 316, 12)], k)
    for s in (-1, 1):   # the moustache he waxed
        h.flat(path_limb([(X(s * 1), Y(14)), (X(s * 12), Y(11)), (X(s * 20), Y(18)), (X(s * 22), Y(24))], [2.6 * u, 2.4 * u, 1.6 * u, 0.6 * u], n_end=3), '#1c1418')
    bar = part('Strongman_Prop', PROP, (0, 366 * k), 3.5)                                                                                      # the bar, overhead
    bar.flat(q(k, [(-150, 369), (150, 369), (150, 363), (-150, 363)]), '#8a8f99', smooth=False)
    for s in (-1, 1):
        bar.shape(ellipse(s * 160 * k, 366 * k, 30 * k, 30 * k, n=16), '#23262c'); bar.flat(ellipse((s * 160 - 8) * k, 374 * k, 8 * k, 9 * k, n=8), '#4a4e54')
    m.extra.append(bar)
    return m.parts()


# ================================================================== 10. THE BARKER: he has the night's takings and he is not sharing.
def barker():
    m = man('Barker', 384, w=0.96, skin='#b8ada0', top=CREAM, pants='#2a2a34', slump=0.3, jaw=0.25, eye='#fffbe0', gaunt=0.96, teeth=(6, 4), torn=(0.0, 0.0), sleeve_to=(0.9, 0.9), curl=(0.9, 0.9),
            pose=dict(L=((-70, 276), (-58, 318), 70), R=((62, 250), (64, 196), -86)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    _stripes(b, td, k, 236, 334, RED, CREAM, 12)
    b.clipped(td, q(k, [(-9, 331), (9, 331), (5, 250), (-5, 250)]), '#f2ead0', smooth=False); b.clipped(td, q(k, [(-6, 326), (6, 326), (0, 316)]), '#1c1418', smooth=False)
    box = part('Barker_Prop', PROP, (-58 * k, 290 * k), 0.5)
    P(box, q(k, [(-100, 320), (-44, 328), (-42, 274), (-98, 266)]), '#3a5a4a'); box.flat(q(k, [(-100, 320), (-44, 328), (-44, 318), (-100, 310)]), '#4a7a5e', smooth=False); box.flat(ellipse(-72 * k, 296 * k, 4 * k, 5 * k, n=8), GOLDC)
    for (x, y) in ((-94, 260), (-82, 254), (-68, 258), (-88, 248), (-58, 264)):
        box.flat(ellipse(x * k, y * k, 5 * k, 5 * k, n=10), '#f2d25a'); box.flat(ellipse((x - 1) * k, (y + 1) * k, 2.2 * k, 2.2 * k, n=8), '#fff3b0')
    for (x, y, a) in ((-60, 336, 20), (-80, 340, -10)):
        box.flat(q(k, [(x - 8, y - 5), (x + 8, y - 3), (x + 7, y + 6), (x - 9, y + 4)]), '#8ab87a', smooth=False)                                # notes
    m.extra.append(box)
    hat(h, X(0), Y(49), 22 * u, 10 * u, 36 * u, '#d8c88a', band=RED, brim_h=5 * u, taper=1.0, dent=0.0)                                         # a straw boater
    c = m.aR.hand_c
    m.aR.flat(path_limb([(c[0], c[1] + 20 * k), (c[0] + 6 * k, c[1] - 150 * k)], [2.4 * k, 2 * k], n_end=3), '#1c1418'); m.aR.flat(ellipse(c[0], c[1] + 22 * k, 5 * k, 5 * k, n=8), GOLDC)
    return m.parts()


# ================================================================== BOSS 1. THE CANNONBALL: fired twice nightly. He liked it.
def cannonball():
    m = man('Cannonball', 500, w=1.42, hw=1.06, skin='#a89a8a', top='#7a2a26', pants='#7a2a26', boot='#1c1614', leg_bulk=1.5, foot_w=1.3, stance=(34, 38, 38), belly=0.3, chest=1.1,
            jaw=0.5, eye=EMBER, gaunt=1.06, teeth=(6, 5), brow=1.6, sleeve_to=(0.4, 0.4), arm_bulk=1.7, hr=10.5, curl=(0.9, 0.9), belt=GOLDC, torn=(0, 0),
            pose=dict(L=((-90, 250), (-96, 190), -94), R=((90, 250), (98, 190), -86)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    gun = part('Cannonball_Prop', PROP, (40 * k, 320 * k), 0.5)                                                                                # the gun he rode, across his back
    gun.shape(q(k, [(-130, 250), (-110, 226), (150, 372), (132, 400)]), '#33363c', smooth=False); gun.flat(q(k, [(118, 392), (156, 370), (166, 384), (128, 408)]), '#4a4e54', smooth=False)
    gun.flat(ellipse(144 * k, 392 * k, 14 * k, 9 * k, n=10), '#0e0d10'); gun.flat(ellipse(144 * k, 392 * k, 7 * k, 4.4 * k, n=8), EMBER)
    for t in (0.2, 0.5):
        cx, cy = -120 + 270 * t, 238 + 150 * t; gun.flat(q(k, [(cx - 14, cy + 16), (cx + 14, cy - 12), (cx + 20, cy - 4), (cx - 8, cy + 24)]), GOLDC, smooth=False)
    m.extra.append(gun)
    b.clipped(td, M(q(k, [(0, 322), (10, 322), (16, 300), (0, 290)])), '#f2ead0'); st = b.clipped(td, q(k, [(-10, 286), (0, 300), (10, 286), (6, 268), (-6, 268)]), GOLDC, smooth=False)   # a star on the chest
    for i in range(5):
        a = math.radians(90 + i * 72); b.clipped(td, [(0, 270 * k), (math.cos(a) * 26 * k, 270 * k + math.sin(a) * 26 * k), (math.cos(a + 0.63) * 10 * k, 270 * k + math.sin(a + 0.63) * 10 * k)], GOLDC, smooth=False)
    _burn(b, td, [(-40, 300, 16), (36, 250, 14), (-20, 240, 10)], k)
    P(h, [(X(-24), Y(40)), (X(-23), Y(58)), (X(-12), Y(68)), (X(12), Y(68)), (X(23), Y(58)), (X(24), Y(40)), (X(18), Y(30)), (X(16), Y(44)), (X(-16), Y(44)), (X(-18), Y(30))], '#b8b4a8')   # a leather flying helmet, scorched
    h.flat([(X(-23), Y(44)), (X(23), Y(44)), (X(23), Y(49)), (X(-23), Y(49))], '#1c1614', smooth=False)
    for s in (-1, 1):
        h.flat(ellipse(X(s * 10), Y(54), 7.4 * u, 6 * u, n=12), '#3a3e46'); h.flat(ellipse(X(s * 10), Y(54), 5 * u, 4 * u, n=10), '#8a5a2a')
    return m.parts()


# ================================================================== BOSS 2. MADAME ZORA: she saw the fire coming. She stayed for it.
def zora():
    m = man('Zora', 520, w=0.86, hw=0.96, skin='#b8a898', top='#3a2a5a', pants='#3a2a5a', slump=0.3, chest=0.98, jaw=0.4, eye='#b58cff', gaunt=0.86, teeth=(7, 5),
            sleeve_to=(0.8, 0.8), claw='#1c1418', curl=(0.3, 0.2), arm_bulk=0.84, hr=7.6, belt=None, pose=dict(L=((-66, 262), (-50, 232), 20), R=((72, 270), (84, 326), 84)),
            gown=dict(col='#3a2a5a', top=240, hem_w=70, rag=9, seed=7))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    for (x, y) in ((-40, 180), (-10, 130), (30, 170), (50, 90), (-50, 80), (0, 60), (20, 30), (-30, 30)):   # stars and moons on the skirts
        spikes(b, [(x * k, y * k, 9 * k, 3 * k, a) for a in (90, 162, 234, 306, 18)], GOLDC)
    b.clipped(td, q(k, [(-40, 331), (40, 331), (30, 300), (0, 310), (-30, 300)]), '#7a2a5a', smooth=False)                                      # a shawl
    spikes(b, [(x * k, 302 * k, 16 * k, 2 * k, -90) for x in range(-28, 29, 8)], GOLDC)
    for i in range(3):
        b.clipped(td, path_limb(q(k, [(-18, 326), (0, 296 - i * 10), (18, 326)]), [1.4 * k] * 3, n_end=2), GOLDC)
    P(h, [(X(-24), Y(40)), (X(-22), Y(60)), (X(0), Y(68)), (X(22), Y(60)), (X(24), Y(40)), (X(0), Y(46))], '#7a2a5a')                            # a headscarf
    S(h, [(X(18), Y(46)), (X(30), Y(36)), (X(36), Y(-4)), (X(24), Y(8))], '#7a2a5a'); h.flat(ellipse(X(0), Y(47), 4 * u, 4 * u, n=8), GOLDC)
    for s in (-1, 1):
        h.flat(path_limb([(X(s * 21.5), Y(26)), (X(s * 22), Y(14))], [0.6 * u, 0.6 * u], n_end=2), GOLDC); h.flat(ellipse(X(s * 22), Y(9), 4.4 * u, 4.4 * u, n=10), GOLDC); h.flat(ellipse(X(s * 22), Y(9), 2.6 * u, 2.6 * u, n=8), '#b8a898')
    c = m.aL.hand_c   # the ball
    m.aL.flat(ellipse(c[0] + 6 * k, c[1] + 22 * k, 22 * k, 22 * k, n=18), '#6a4ad8'); m.aL.flat(ellipse(c[0] + 6 * k, c[1] + 22 * k, 14 * k, 14 * k, n=14), '#b58cff'); m.aL.flat(ellipse(c[0], c[1] + 28 * k, 5 * k, 6 * k, n=8), '#f2e8ff')
    c = m.aR.hand_c   # the cards, fanned
    for i in range(5):
        a = math.radians(50 + i * 20); nx, ny = -math.sin(a) * 8 * k, math.cos(a) * 8 * k; e = (c[0] + math.cos(a) * 46 * k, c[1] + math.sin(a) * 46 * k); s0 = (c[0] + math.cos(a) * 8 * k, c[1] + math.sin(a) * 8 * k)
        m.aR.flat([(s0[0] + nx, s0[1] + ny), (e[0] + nx, e[1] + ny), (e[0] - nx, e[1] - ny), (s0[0] - nx, s0[1] - ny)], '#f2ead0' if i % 2 else '#e0d4b4', smooth=False)
        m.aR.flat(ellipse(c[0] + math.cos(a) * 32 * k, c[1] + math.sin(a) * 32 * k, 3 * k, 3 * k, n=6), '#1c1418' if i % 2 else RED)
    return m.parts()


# ================================================================== BOSS 3. THE TWINS: billed as inseparable.
def twins():
    m = man('Twins', 460, w=1.7, hw=0.96, skin='#b8a898', top='#2a5a5a', pants='#2a2a34', boot='#1c1614', leg_bulk=1.6, foot_w=1.3, stance=(38, 44, 44), belly=0.3, chest=1.0,
            jaw=0.9, eye='#ffd24a', gaunt=0.96, teeth=(6, 5), hx=34, sleeve_to=(0.5, 0.5), arm_bulk=1.5, hr=10, claw='#1c1418', curl=(0.2, 0.2), belt='#1c1614', torn=(0.2, 0.0),
            sh=(86, 314), pose=dict(L=((-126, 250), (-140, 188), -100), R=((126, 250), (140, 188), -80)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    b.clipped(td, q(k, [(0, 340), (140, 340), (140, 230), (0, 230)]), '#7a2a5a', smooth=False)                                                  # one coat, two tailors
    for i in range(7):   # where they were joined, and where somebody tried to undo it
        y = 322 - i * 13; b.clipped(td, q(k, [(-7, y + 2), (7, y - 2), (7, y - 4), (-7, y)]), '#1c1418', smooth=False)
    b.clipped(td, q(k, [(-1.4, 332), (1.4, 332), (1.4, 236), (-1.4, 236)]), '#5a1418', smooth=False)
    for s in (-1, 1):
        for i in range(3):
            b.clipped(td, ellipse(s * 40 * k, (300 - i * 22) * k, 3.4 * k, 3.4 * k, n=8), GOLDC)
    _burn(b, td, [(-60, 270, 14), (70, 300, 12)], k)
    h.clipped(m.hd, [(X(-22), Y(60)), (X(22), Y(60)), (X(22), Y(46)), (X(6), Y(50)), (X(-8), Y(47)), (X(-22), Y(44))], '#b8402a', smooth=False)
    F2 = dict(m.F); F2['head_w'] = m.F['head_w']
    h2, hd2, L2 = skull('TwinsB', F2, '#a89a8a', cx=-34 * k, jaw=0.2, eye='#ffd24a', hair=None, gaunt=0.92, teeth=(6, 4), layer=1.5)
    h2.name = 'Twins_Prop'; h2.role = PROP; h2.pivot = (-34 * k, m.F['neck'] - 4 * k)
    X2, Y2, u2 = L2['X'], L2['Y'], L2['u']
    h2.clipped(hd2, [(X2(-22), Y2(60)), (X2(22), Y2(60)), (X2(22), Y2(46)), (X2(8), Y2(49)), (X2(-6), Y2(46)), (X2(-22), Y2(43))], '#1c1418', smooth=False)
    h2.clipped(hd2, [(X2(-20), Y2(40)), (X2(-2), Y2(40)), (X2(-4), Y2(24)), (X2(-18), Y2(24))], '#1c1418', smooth=False)                           # a patch over one eye
    m.extra.append(h2)
    return m.parts()


# ================================================================== BOSS 4. GRIN: the last clown. He was never the funny one.
def grin():
    m = man('Grin', 600, w=1.0, hw=1.1, skin='#e8e2d6', top='#c8b83a', pants='#3a5a7a', boot=RED, slump=0.3, chest=1.04, belly=0.3, jaw=1.2, eye='#ff5a4a', gaunt=1.0, teeth=(9, 8), ears=False,
            sleeve_to=(0.9, 0.9), claw='#1c1418', curl=(0.9, 0.1), arm_bulk=1.0, hr=10, belt=None, foot_w=1.9, torn=(0, 0), pose=dict(L=((-68, 250), (-74, 196), -94), R=((74, 262), (92, 318), 80)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    b.clipped(td, q(k, [(0, 340), (140, 340), (140, 180), (0, 180)]), '#7a2a5a', smooth=False)                                                  # motley
    for i in range(4):
        b.clipped(td, ellipse(0, (310 - i * 26) * k, 7 * k, 7 * k, n=10), RED if i % 2 else '#3a5a7a')
    for (x, y, w2, h2c, c) in ((-34, 270, 22, 18, '#3a5a7a'), (30, 226, 20, 20, '#c8b83a'), (-20, 210, 16, 14, RED)):
        b.clipped(td, q(k, [(x - w2 / 2, y + h2c / 2), (x + w2 / 2, y + h2c / 2), (x + w2 / 2, y - h2c / 2), (x - w2 / 2, y - h2c / 2)]), c, smooth=False)
    _burn(b, td, [(40, 300, 14), (-44, 236, 12)], k)
    b.flat(q(k, [(-52, 336), (-34, 318), (-16, 336), (0, 318), (16, 336), (34, 318), (52, 336), (40, 308), (0, 318), (-40, 308)]), '#f2ead0', smooth=False)   # the ruff
    for s in (-1, 1):
        h.clipped(m.hd, [(X(s * 4), Y(40)), (X(s * 9.6), Y(54)), (X(s * 15), Y(40)), (X(s * 9.6), Y(16))], '#2a2a3a', smooth=False); h.clipped(m.hd, ellipse(X(s * 9.6), Y(30.6), 2.2 * u, 2.2 * u, n=8), '#ff5a4a')
        h.clipped(m.hd, [(X(s * 11), Y(8)), (X(s * 21), Y(26)), (X(s * 20), Y(12)), (X(s * 12), Y(0))], RED, smooth=False)
        for j in range(4):
            h.clipped(m.hd, [(X(s * (12 + j * 2.4) - 0.5), Y(8 + j * 4.6 + 3)), (X(s * (12 + j * 2.4) + 0.5), Y(8 + j * 4.6 + 3)), (X(s * (12 + j * 2.4) + 0.5), Y(8 + j * 4.6 - 3)), (X(s * (12 + j * 2.4) - 0.5), Y(8 + j * 4.6 - 3))], '#1c1418', smooth=False)   # the smile is stitched on
        S(h, ellipse(X(s * 25), Y(44), 12 * u, 14 * u, n=12), '#b8402a')
    h.clipped(m.hd, ellipse(X(0), Y(21), 5 * u, 5 * u, n=10), RED)
    P(h, [(X(-8), Y(56)), (X(8), Y(56)), (X(5), Y(84)), (X(-5), Y(84))], '#3a5a7a'); h.flat(ellipse(X(0), Y(86), 5 * u, 5 * u, n=8), '#c8b83a'); h.flat(rect(X(-8.6), Y(56), X(8.6), Y(60)), '#c8b83a', smooth=False)   # a hat far too small
    c = m.aL.hand_c
    m.aL.flat(path_limb([(c[0], c[1] + 10 * k), (c[0] - 4 * k, c[1] - 30 * k)], [3 * k, 3 * k], n_end=3), '#4a3226'); P(m.aL, [(c[0] - 10 * k, c[1] - 28 * k), (c[0] + 22 * k, c[1] - 30 * k), (c[0] + 26 * k, c[1] - 100 * k), (c[0] + 8 * k, c[1] - 108 * k), (c[0] - 12 * k, c[1] - 98 * k)], '#aeb2ba'); m.aL.flat(q(1, [(c[0] + 4 * k, c[1] - 50 * k), (c[0] + 22 * k, c[1] - 54 * k), (c[0] + 24 * k, c[1] - 84 * k), (c[0] + 8 * k, c[1] - 76 * k)]), BLOOD)   # a cleaver
    return m.parts()


# ================================================================== BOSS 5. THE RINGMASTER: the show must go on. He will see to it.
def ringmaster():
    m = man('Ringmaster', 630, w=1.4, hw=1.04, skin='#b9ada0', top='#8a1c1c', pants='#f2ead0', boot='#0e0d10', leg_bulk=1.4, foot_w=1.3, stance=(34, 38, 38), belly=0.35, chest=1.08,
            jaw=0.6, eye=EMBER, gaunt=0.96, teeth=(8, 6), brow=1.8, sleeve_to=(0.9, 0.9), arm_bulk=1.45, hr=10, curl=(0.9, 0.9), belt=None, torn=(0, 0),
            sh=(74, 314), pose=dict(L=((-104, 262), (-114, 204), -100), R=((104, 262), (128, 300), 70)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    for side in (-1, 1):   # hoops of fire turning behind each shoulder
        pr = part('Ringmaster_Prop%s' % ('L' if side < 0 else 'R'), PROP, (side * 70 * k, 318 * k), 0.5)
        for (r0, r1, col) in ((98, 76, '#ff7a2a'), (92, 82, '#ffc04a')):
            ring = [(side * 150 * k + math.cos(t / 32 * 6.283) * r0 * k, 360 * k + math.sin(t / 32 * 6.283) * r0 * k) for t in range(33)] + [(side * 150 * k + math.cos(t / 32 * 6.283) * r1 * k, 360 * k + math.sin(t / 32 * 6.283) * r1 * k) for t in range(32, -1, -1)]
            pr.flat(ring, col, smooth=False)
        spikes(pr, [(side * 150 * k + math.cos(a) * 92 * k, 360 * k + math.sin(a) * 92 * k, 26 * k, 8 * k, math.degrees(a) + 30) for a in [i / 10 * 6.283 for i in range(10)]], '#ff7a2a', '#ffc04a')
        m.extra.append(pr)
    coat_skirts(b, k, '#8a1c1c', w=54, flare=74, bottom=120, split=200)
    cav = b.clipped(td, q(k, [(-28, 314), (28, 314), (32, 276), (22, 248), (-22, 248), (-32, 276)]), '#1a0c0c', smooth=False)
    b.clipped(cav, ellipse(-2 * k, 282 * k, 13 * k, 15 * k, n=10), EMBER); b.clipped(cav, ellipse(-3 * k, 285 * k, 6 * k, 7 * k, n=8), '#ffe0a0')
    for s in (-1, 1):
        for i in range(5):
            y = 310 - i * 14; b.clipped(td, path_limb(q(k, [(s * 3, y), (s * 20, y - 3), (s * 34, y - 13)]), [2.4 * k, 2.2 * k, 1.5 * k], n_end=3), '#e0d6bc')
        b.clipped(td, q(k, [(s * 9, 331), (s * 44, 330), (s * 50, 300), (s * 40, 262), (s * 30, 246), (s * 26, 246), (s * 36, 276), (s * 30, 316)]), '#1c1418', smooth=False)
        for i in range(4):
            b.clipped(td, q(k, [(s * 34, 312 - i * 18), (s * 62, 316 - i * 18), (s * 62, 310 - i * 18), (s * 34, 306 - i * 18)]), GOLDC, smooth=False)   # frogging
        b.clipped(td, q(k, [(s * 34, 334), (s * 80, 326), (s * 84, 312), (s * 34, 322)]), GOLDC, smooth=False); spikes(b, [((s * (44 + j * 10)) * k, 314 * k, 14 * k, 2.4 * k, -90) for j in range(4)], GOLDC)
    for s in (-1, 1):
        h.flat(path_limb([(X(s * 1), Y(14)), (X(s * 14), Y(10)), (X(s * 24), Y(20)), (X(s * 26), Y(30))], [2.8 * u, 2.6 * u, 1.6 * u, 0.6 * u], n_end=3), '#1c1418')
    P(h, [(X(-19), Y(50)), (X(19), Y(50)), (X(22), Y(106)), (X(-22), Y(106))], '#0e0d10'); P(h, [(X(-33), Y(49)), (X(33), Y(49)), (X(30), Y(54)), (X(-30), Y(54))], '#17151b'); h.flat([(X(-19.3), Y(54)), (X(19.3), Y(54)), (X(19.8), Y(66)), (X(-19.8), Y(66))], '#8a1c1c', smooth=False)
    spikes(h, [(X(x), Y(106), l * u, 7 * u, a) for (x, l, a) in ((-14, 30, 104), (-4, 46, 92), (8, 38, 82), (17, 24, 70))], '#ff7a2a', '#ffc04a')   # the hat is still alight
    c = m.aR.hand_c   # the whip
    m.aR.flat(path_limb([(c[0], c[1] - 14 * k), (c[0] + 4 * k, c[1] + 26 * k)], [4 * k, 3 * k], n_end=3), '#1c1418')
    m.aR.flat(path_limb([(c[0] + 4 * k, c[1] + 26 * k), (c[0] + 50 * k, c[1] + 90 * k), (c[0] + 20 * k, c[1] + 150 * k), (c[0] + 80 * k, c[1] + 190 * k), (c[0] + 120 * k, c[1] + 150 * k)], [2 * k, 1.6 * k, 1.2 * k, 0.9 * k, 0.5 * k], n_end=3), '#3a2a20')
    c = m.aL.hand_c   # the megaphone
    P(m.aL, [(c[0] - 6 * k, c[1] + 8 * k), (c[0] + 6 * k, c[1] + 8 * k), (c[0] + 24 * k, c[1] - 60 * k), (c[0] - 24 * k, c[1] - 60 * k)], GOLDC); m.aL.flat(ellipse(c[0], c[1] - 60 * k, 24 * k, 7 * k, n=12), '#1c1418')
    return m.parts()


ROSTER = [
    ('Roustabout', roustabout), ('Tumbler', tumbler), ('Contortionist', contortionist), ('Glutton', glutton), ('KnifeThrower', knife_thrower), ('BalloonClown', balloon_clown), ('Jack', jack), ('Lion', lion), ('Strongman', strongman), ('Barker', barker),
    ('Cannonball', cannonball), ('Zora', zora), ('Twins', twins), ('Grin', grin), ('Ringmaster', ringmaster),
]
