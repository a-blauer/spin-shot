"""Frostbite Junction: the crew of a snowed-in mountain depot, what came down out of the pass, and the man who would not clear the line."""
from kit2 import *   # noqa: F401,F403

ICE, ICE_L, SNOW, FROST = '#8fd0f0', '#dff4ff', '#eef4f8', '#9fb4c4'


def _snow(p, pts, k=1.0):
    for (x, y, rx, ry) in pts:
        p.flat(ellipse(x * k, y * k, rx * k, ry * k, n=10), SNOW)


# ================================================================== 1. BRAKEMAN: froze at his post with the lamp still lit.
def brakeman():
    m = man('Brakeman', 400, skin=FROST, top='#3a3f52', pants='#2c2e3a', slump=0.5, jaw=0.45, eye=ICE_L, torn=(0.0, 0.0), sleeve_to=(0.9, 0.9), curl=(0.9, 0.9),
            pose=dict(L=((-62, 246), (-66, 194), -94), R=((62, 248), (64, 194), -86)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    coat_skirts(b, k, '#3a3f52', w=40, flare=46, bottom=130)
    for s in (-1, 1):
        for i in range(4):
            b.clipped(td, ellipse(s * 9 * k, (310 - i * 20) * k, 2.4 * k, 2.4 * k, n=8), '#b9974a')
    b.clipped(td, q(k, [(-12, 331), (12, 331), (0, 300)]), '#6a2a2a', smooth=False)                                                           # a red muffler
    _snow(b, [(-40, 322, 14, 5), (38, 321, 15, 5)], k)
    spikes(h, [(X(-9), Y(1), 13 * u, 1.8 * u, -92), (X(-3), Y(-1), 18 * u, 2 * u, -90), (X(4), Y(-1), 15 * u, 1.9 * u, -88), (X(10), Y(1), 11 * u, 1.6 * u, -86)], ICE, ICE_L)   # his beard froze
    peaked_cap(m, '#2c2e3a', '#1c1e28')
    for s in (-1, 1):
        P(h, [(X(s * 21), Y(46)), (X(s * 26), Y(44)), (X(s * 25), Y(22)), (X(s * 20), Y(26))], '#2c2e3a')                                      # ear flaps
    _snow(h, [(X(0) / 1, Y(67), 18 * u, 3.4 * u)])
    c = m.aL.hand_c   # the lamp
    m.aL.flat(path_limb([(c[0], c[1] - 2 * k), (c[0], c[1] - 16 * k)], [1.2 * k, 1.2 * k], n_end=3), '#5a5e66')
    P(m.aL, [(c[0] - 9 * k, c[1] - 16 * k), (c[0] + 9 * k, c[1] - 16 * k), (c[0] + 10 * k, c[1] - 44 * k), (c[0] - 10 * k, c[1] - 44 * k)], '#2a2226')
    m.aL.flat(rect(c[0] - 6.5 * k, c[1] - 40 * k, c[0] + 6.5 * k, c[1] - 20 * k), '#ff4a3a', smooth=False); m.aL.flat(ellipse(c[0], c[1] - 30 * k, 3 * k, 5 * k, n=8), '#ffd0b0')
    c = m.aR.hand_c   # a brake club
    m.aR.flat(path_limb([(c[0] - 2 * k, c[1] + 22 * k), (c[0] + 6 * k, c[1] - 92 * k)], [3 * k, 4.6 * k], n_end=4), '#6a4a2e')
    return m.parts()


# ================================================================== 2. SNOWBLIND: took his coat off at the end, as they do. Runs at warmth.
def snowblind():
    m = man('Snowblind', 384, w=0.92, skin='#a9b8c6', top='#a9b8c6', pants='#8a8f9a', slump=0.2, jaw=1.0, eye='#ffffff', gaunt=0.9, teeth=(6, 5), hair=('long', '#e8eef2'), torn=(0.5, 0.3), bare_feet=True,
            sleeve=False, claw='#1e1a22', curl=(0.0, 0.0), pose=dict(L=((-84, 276), (-104, 318), 108), R=((82, 270), (108, 304), 66)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    ribs(b, td, m.F, shade('#a9b8c6', 0.56), n=5, op=0.8)
    for (x, y, r) in ((-30, 300, 13), (26, 262, 12), (-10, 244, 9)):
        b.clipped(td, ellipse(x * k, y * k, r * k, r * 0.8 * k, n=9), '#5a4a6a', opacity=0.5)                                                # frostbite
    for a in (m.aL, m.aR):
        c = a.hand_c; a.flat(ellipse(c[0], c[1], 9 * k, 9 * k, n=10), '#2a2630', opacity=0.85)                                                # hands gone black
        spikes(a, [(c[0] - 4 * k, c[1] - 14 * k, 16 * k, 1.8 * k, -90), (c[0] + 5 * k, c[1] - 14 * k, 11 * k, 1.5 * k, -90)], ICE, ICE_L)
    for l in m.legs:
        pass
    spikes(h, [(X(-13), Y(8), 12 * u, 1.6 * u, -94), (X(13), Y(8), 14 * u, 1.6 * u, -86)], ICE, ICE_L)
    for s in (-1, 1):
        h.clipped(m.hd, [(X(s * 3), Y(34)), (X(s * 16), Y(36)), (X(s * 15), Y(27)), (X(s * 5), Y(27))], ICE_L, smooth=False, opacity=0.8)     # ice over the eyes
    return m.parts()


# ================================================================== 3. RIME CRAWLER: the drift took his legs. Ice has grown out of his back.
def rime_crawler():
    cn = 'RimeCrawler'; F = F1(40)
    skin, rag = '#8fa6ba', '#4a5568'
    b = part(cn + '_Body', BODY, (0, 60), 1)
    b.flat(path_limb([(18, 86), (70, 56), (118, 26), (150, 12)], [10, 8, 6, 4], n_end=4), rag); b.flat(path_limb([(-10, 84), (-58, 46), (-96, 16)], [9, 7, 4], n_end=4), shade(rag, 0.8))
    spikes(b, [(-30, 140, 70, 12, 112), (-4, 150, 96, 14, 92), (26, 144, 76, 12, 70), (44, 126, 50, 9, 48), (-48, 124, 44, 8, 138)], ICE, ICE_L)
    td = S(b, M([(0, 152), (26, 150), (52, 134), (62, 110), (54, 86), (30, 74), (0, 72)]), skin)
    b.clipped(td, [(-64, 104), (64, 104), (64, 60), (-64, 60)], rag, smooth=False)
    for s in (-1, 1):
        b.clipped(td, [(s * 10, 140), (s * 40, 136), (s * 48, 112), (s * 20, 106)], shade(skin, 0.68), smooth=False, opacity=0.6)
    _snow(b, [(-30, 148, 16, 5), (24, 150, 18, 5)])
    parts = [b]
    h, hd, L = skull(cn, F, skin, jaw=0.8, eye=ICE_L, hair=('thin', '#e8eef2'), neck=False)
    spikes(h, [(L['X'](-8), L['Y'](-6), 14, 2, -92), (L['X'](6), L['Y'](-8), 18, 2.2, -88)], ICE, ICE_L)
    h.pivot = (0, 76); parts.append(h)
    parts.append(arm2(cn, -1, F, skin, sleeve=rag, sleeve_to=0.4, sh=(-50, 118), el=(-98, 134), wr=(-112, 46), hand_ang=-92, claw='#2a2630', curl=0.1, hr=8.5, bulk=1.05))
    parts.append(arm2(cn, 1, F, skin, sh=(50, 118), el=(100, 128), wr=(110, 44), hand_ang=-86, claw='#2a2630', curl=0.1, hr=8.5, bulk=1.05))
    return parts


# ================================================================== 4. SCALD: a fireman with a boiler's worth of steam in him.
def scald():
    cn = 'Scald'; F = fig(440, w=1.22); k = F['k']
    skin, cloth = '#b8705e', '#2c2e3a'
    parts = [leg2(cn, -1, F, cloth, skin, torn=0.2, bulk=1.5, hip=(-34 * k, 196 * k), knee=(-40 * k, 104 * k), ank=(-42 * k, 16 * k), foot_w=1.2), leg2(cn, 1, F, cloth, skin, torn=0.3, bulk=1.5, hip=(34 * k, 196 * k), knee=(40 * k, 104 * k), ank=(42 * k, 16 * k), foot_w=1.2)]
    b, td = body(cn, F, skin, half=[(0, 331), (9, 331), (28, 326), (46, 319), (52, 304), (56, 284), (66, 262), (78, 240), (82, 218), (76, 198), (60, 186), (40, 181), (0, 179)])
    for (x, y, r) in ((-50, 290, 10), (44, 300, 8), (-66, 232, 9), (62, 262, 7)):
        b.clipped(td, ellipse(x * k, y * k, r * k, r * k, n=10), '#d89a8a'); b.clipped(td, ellipse((x - 1.5) * k, (y + 1.5) * k, r * 0.4 * k, r * 0.4 * k, n=8), '#f6d8d0')   # blisters
    pl = b.clipped(td, ellipse(0, 240 * k, 50 * k, 48 * k, n=20), '#3a3e46')                                                                 # a firebox door strapped across his belly
    b.clipped(td, ellipse(0, 240 * k, 38 * k, 36 * k, n=18), '#ff7a2a'); b.clipped(td, ellipse(0, 236 * k, 22 * k, 20 * k, n=14), '#ffd27a')
    for x in (-24, -8, 8, 24):
        b.clipped(td, q(k, [(x - 2.4, 280), (x + 2.4, 280), (x + 2.4, 200), (x - 2.4, 200)]), '#23262c', smooth=False)
    for i in range(10):
        a = i / 10 * 6.283; b.clipped(td, ellipse(math.cos(a) * 44 * k, (240 + math.sin(a) * 42) * k, 2.4 * k, 2.4 * k, n=6), '#8a8f99')
    b.clipped(td, q(k, [(-140, 170), (140, 170), (140, 198), (60, 190), (0, 186), (-60, 190), (-140, 198)]), cloth, smooth=False)
    for (x, y, r) in ((-70, 300, 15), (-84, 322, 11), (66, 310, 14), (82, 334, 10), (-60, 340, 9)):
        b.flat(ellipse(x * k, y * k, r * k, r * 0.8 * k, n=10), '#f2f4f6', opacity=0.75)                                                       # steam
    parts.append(b)
    h, hd, L = skull(cn, F, skin, jaw=0.6, eye='#ffb060', hair=None, gaunt=1.1, teeth=(6, 4))
    X, Y, u = L['X'], L['Y'], L['u']
    P(h, [(X(-22), Y(46)), (X(-21), Y(58)), (X(0), Y(64)), (X(21), Y(58)), (X(22), Y(46))], '#23262c'); P(h, [(X(-22), Y(47)), (X(22), Y(47)), (X(30), Y(43)), (X(24), Y(42)), (X(-22), Y(43))], '#16181c')
    h.clipped(hd, ellipse(X(8), Y(14), 6 * u, 5 * u, n=8), '#1e1a18', opacity=0.5)
    parts.append(h)
    parts.append(arm2(cn, -1, F, skin, sh=(-54 * k, 312 * k), el=(-86 * k, 254 * k), wr=(-106 * k, 200 * k), bulk=1.3, hand_ang=-104, curl=0.25, hr=8.4 * k))
    parts.append(arm2(cn, 1, F, skin, sh=(54 * k, 312 * k), el=(86 * k, 254 * k), wr=(104 * k, 198 * k), bulk=1.3, hand_ang=-76, curl=0.25, hr=8.4 * k))
    return parts


# ================================================================== 5. HAILER: breaks icicles off the eaves and throws them like a man who used to throw mail sacks.
def hailer():
    m = man('Hailer', 430, w=0.88, skin='#8fa6ba', top='#5a4a40', pants='#3a3a44', slump=0.3, jaw=0.2, eye=ICE_L, gaunt=0.9, torn=(0.0, 0.15), sleeve_to=(0.85, 0.85), curl=(0.7, 0.9),
            pose=dict(L=((-62, 246), (-58, 196), -90), R=((74, 270), (88, 330), 84)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    for i, y in enumerate((318, 300, 282, 264, 246)):   # a striped blanket for a coat
        b.clipped(td, rect(-90 * k, (y - 5) * k, 90 * k, y * k), '#8a3a2a' if i % 2 else '#c9b98a', smooth=False)
    h.clipped(m.hd, [(X(-22), Y(24)), (X(22), Y(24)), (X(19), Y(-6)), (X(-19), Y(-6))], '#7a2a2a', smooth=False)                               # a scarf up over the nose
    S(h, [(X(8), Y(0)), (X(16), Y(2)), (X(22), Y(-30)), (X(12), Y(-34))], '#7a2a2a')
    P(h, [(X(-22), Y(44)), (X(-20), Y(60)), (X(-8), Y(70)), (X(8), Y(70)), (X(20), Y(60)), (X(22), Y(44))], '#3a4a6a'); h.flat(rect(X(-23), Y(43), X(23), Y(49)), '#c9b98a', smooth=False); h.flat(ellipse(X(0), Y(74), 6 * u, 6 * u, n=10), '#c9b98a')
    c = m.aR.hand_c
    spikes(m.aR, [(c[0] - 1 * k, c[1] - 30 * k, 150 * k, 6 * k, 86)], ICE, ICE_L)                                                              # the one he is about to throw
    c = m.aL.hand_c
    spikes(m.aL, [(c[0] - 6 * k, c[1] + 10 * k, 66 * k, 3.6 * k, -98), (c[0], c[1] + 12 * k, 80 * k, 4 * k, -90), (c[0] + 6 * k, c[1] + 10 * k, 60 * k, 3.4 * k, -82)], ICE, ICE_L)   # and the next three
    return m.parts()


# ================================================================== 6. WHITEOUT OWL: silent until it is on you.
def snow_owl():
    cn = 'SnowOwl'
    wh, gr, dk = '#e6ecf0', '#aab4c0', '#4a5262'
    t = part(cn + '_Tail', TAIL, (0, 78), 0)
    feathers(t, (0, 82), (0, 22), 7, wh, 1.1, seed=3)
    for s in (-1, 1):
        t.flat(path_limb([(s * 10, 74), (s * 12, 56)], [4, 3], n_end=3), gr); spikes(t, [(s * 12 + j * 4, 58, 13, 1.5, -90 + j * 14) for j in (-1, 0, 1)], '#1c1614')
    parts = [t]
    for side in (-1, 1):
        role = WING_F if side > 0 else WING_B
        w = part('%s_%s' % (cn, role), role, (side * 26, 104), 1)
        sh, el, wr = (side * 26, 104), (side * 84, 138), (side * 150, 118)
        feathers(w, wr, (side * 236, 70), 7, wh, 1.0, droop=side * 0.2, seed=5 + side); feathers(w, el, (side * 124, 40), 6, gr, 0.8, seed=9 + side); feathers(w, sh, (side * 56, 44), 4, wh, 0.6, seed=13 + side)
        S(w, path_limb([sh, el, wr], [11, 8, 5]), wh)
        for tt in (0.25, 0.55, 0.8):
            c = lerp(el, wr, tt); w.flat([(c[0] - 4, c[1] - 6), (c[0] + 4, c[1] - 6), (c[0], c[1] - 16)], dk, smooth=False)
        parts.append(w)
    b = part(cn + '_Body', BODY, (0, 100), 2)
    td = S(b, M([(0, 134), (18, 132), (32, 116), (34, 94), (26, 76), (10, 66), (0, 64)]), wh)
    for i in range(4):
        for j in range(-2, 3):
            b.clipped(td, [(j * 11 - 4 + (i % 2) * 5, 116 - i * 12), (j * 11 + 4 + (i % 2) * 5, 116 - i * 12), (j * 11 + (i % 2) * 5, 110 - i * 12)], dk, smooth=False)
    parts.append(b)
    h = part(cn + '_Head', HEAD, (0, 124), 3)
    hd = S(h, M([(0, 172), (18, 170), (30, 156), (32, 138), (24, 122), (10, 114), (0, 112)]), wh)
    h.clipped(hd, M([(0, 164), (12, 166), (24, 154), (26, 138), (16, 124), (0, 120)]), '#f8fafc'); h.clipped(hd, [(-1.2, 166), (1.2, 166), (1.2, 140), (-1.2, 140)], gr, smooth=False)
    for s in (-1, 1):
        h.clipped(hd, ellipse(s * 12, 146, 8.6, 8.6, n=14), '#101014'); h.clipped(hd, ellipse(s * 12, 146, 6.6, 6.6, n=12), '#ffd24a'); h.clipped(hd, ellipse(s * 12, 146, 3.6, 3.6, n=10), '#101014'); h.clipped(hd, ellipse(s * 10.6, 147.6, 1.2, 1.2, n=6), '#ffffff')
        h.clipped(hd, [(s * 3, 160), (s * 22, 162), (s * 21, 157), (s * 4, 153)], gr, smooth=False, opacity=0.8)
    h.flat([(-4.4, 138), (4.4, 138), (2.4, 128), (0, 121), (-2.4, 128)], '#3a3a44', smooth=False)
    parts.append(h)
    return parts


# ================================================================== 7. TIMBER WOLF: came down out of the pass when the meat stopped running.
def timber_wolf():
    cn = 'TimberWolf'
    fur, dark, pale = '#8a94a0', '#5a6270', '#d8dee4'
    parts = []
    for side in (-1, 1):   # the hind legs, seen past the shoulders
        role = LEG_F if side > 0 else LEG_B
        p = part('%s_%s' % (cn, role), role, (side * 44, 96), 0)
        S(p, ellipse(side * 46, 96, 22, 30, n=14), dark)
        p.flat(path_limb([(side * 52, 78), (side * 66, 44), (side * 58, 8)], [9, 5.5, 5], n_end=4), dark); p.flat(ellipse(side * 60, 5, 9, 5, n=8), dark)
        parts.append(p)
    b = part(cn + '_Body', BODY, (0, 80), 1)
    td = S(b, M([(0, 156), (24, 154), (44, 134), (48, 104), (40, 76), (22, 58), (0, 54)]), fur)
    b.clipped(td, M([(0, 150), (14, 146), (22, 120), (16, 84), (0, 70)]), pale)
    spikes(b, [(x, y, 16, 5, a) for (x, y, a) in ((-44, 132, 200), (-48, 108, 190), (46, 130, -20), (48, 106, -10), (-30, 62, 250), (30, 62, 290), (-10, 56, 264), (12, 56, 276))], fur)
    for i in range(3):
        b.clipped(td, [(26, 128 - i * 12), (46, 122 - i * 12), (46, 118 - i * 12), (26, 123 - i * 12)], shade(fur, 0.6), smooth=False, opacity=0.8)    # ribs under a thin coat
    wound(b, td, (-26, 108), 11, seed=5, bone=True)
    parts.append(b)
    h = part(cn + '_Head', HEAD, (0, 124), 2)
    for s in (-1, 1):
        S(h, [(s * 12, 176), (s * 22, 214), (s * 36, 178), (s * 30, 164)], fur); h.flat([(s * 17, 178), (s * 23, 203), (s * 31, 178)], '#3a3038', smooth=False)
    S(h, M([(0, 122), (10, 122), (17, 112), (14, 92), (0, 86)]), dark)                                                                         # the lower jaw, hanging
    for s in (-1, 1):
        spikes(h, [(s * 11, 116, 13, 2.4, 90), (s * 6, 118, 8, 1.8, 90), (s * 2, 119, 6, 1.6, 90)], BONE)
    h.flat(M([(0, 116), (6, 114), (5, 98), (0, 94)]), '#7a2a30')
    hd = S(h, M([(0, 186), (16, 184), (32, 170), (36, 150), (26, 136), (16, 128), (12, 112), (0, 108)]), fur)
    h.clipped(hd, M([(0, 150), (8, 146), (12, 128), (11, 112), (0, 108)]), pale)
    for s in (-1, 1):
        h.clipped(hd, [(s * 8, 160), (s * 24, 168), (s * 26, 160), (s * 12, 153)], '#101014', smooth=False); h.clipped(hd, ellipse(s * 17, 161, 3.2, 2.6, n=8), ICE_L)
        spikes(h, [(s * 10, 114, 14, 2.6, -90)], BONE); spikes(h, [(s * 34, 150, 14, 5, 180 if s < 0 else 0), (s * 30, 138, 12, 4, 200 if s < 0 else -20)], fur)
    h.clipped(hd, [(-6, 118), (6, 118), (4, 110), (-4, 110)], '#101014', smooth=False)
    parts.append(h)
    for side in (-1, 1):
        role = ARM_F if side > 0 else ARM_B
        a = part('%s_%s' % (cn, role), role, (side * 24, 110), 3)
        S(a, path_limb([(side * 24, 112), (side * 28, 62), (side * 24, 10)], [12, 7.5, 6.5]), fur)
        a.flat(ellipse(side * 25, 6, 11, 6, n=10), fur); spikes(a, [(side * 25 + j * 6, 4, 8, 1.6, -90 + j * 10) for j in (-1, 0, 1)], '#1c1614')
        parts.append(a)
    return parts


# ================================================================== 8. WHITEPELT: what the old trappers would not name.
def whitepelt():
    fur, face = '#dfe6ec', '#4a5a70'
    m = man('Whitepelt', 480, w=1.5, hw=1.12, skin=fur, top=fur, pants=fur, boot=fur, belly=0.4, chest=1.12, slump=0.5, leg_bulk=1.6, foot_w=1.5, stance=(34, 40, 40), bare_feet=True,
            jaw=0.9, eye=ICE_L, gaunt=1.12, teeth=(7, 6), ears=False, sleeve=False, arm_bulk=1.9, hr=12, claw='#2a2630', curl=(0.2, 0.2), belt=None, torn=(0, 0),
            pose=dict(L=((-98, 240), (-108, 160), -96), R=((98, 240), (110, 160), -84)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    spikes(b, [(x * k, y * k, 20 * k, 7 * k, a) for (x, y, a) in ((-70, 318, 150), (-76, 296, 180), (-72, 268, 200), (-66, 232, 210), (70, 318, 30), (76, 296, 0), (72, 268, -20), (66, 232, -30), (-40, 190, 250), (-14, 184, 265), (14, 184, 275), (40, 190, 290))], fur, '#ffffff')
    for (x, y, r) in ((-30, 290, 22), (34, 276, 18), (0, 236, 24)):
        b.clipped(td, ellipse(x * k, y * k, r * k, r * 0.6 * k, n=10), '#c2ccd6', opacity=0.7)
    wound(b, td, (26 * k, 306 * k), 13 * k, seed=2)
    h.clipped(m.hd, [(X(-17), Y(46)), (X(17), Y(46)), (X(19), Y(30)), (X(13), Y(-6)), (X(-13), Y(-6)), (X(-19), Y(30))], face)                    # a bare face in all that fur
    for s in (-1, 1):
        h.clipped(m.hd, ellipse(X(s * 9.6), Y(30.6), 5.4 * u, 4.4 * u, n=10), '#101014'); h.clipped(m.hd, ellipse(X(s * 9.6), Y(30.6), 2.2 * u, 2.2 * u, n=8), ICE_L)
        spikes(h, [(X(s * 6), Y(-2), 12 * u, 2.2 * u, 90)], BONE)                                                                               # tusks up from the lower jaw
    h.clipped(m.hd, [(X(-9), Y(10)), (X(9), Y(10)), (X(7), Y(-4)), (X(-7), Y(-4))], '#1a0c10', smooth=False)
    spikes(h, [(X(x), Y(52), 16 * u, 6 * u, a) for (x, a) in ((-18, 130), (-8, 105), (4, 85), (16, 55))], fur, '#ffffff')
    for a in (m.aL, m.aR):
        c = a.hand_c; s = -1 if a is m.aL else 1
        spikes(a, [(c[0] - s * 14 * k, c[1] + (40 + j * 30) * k, 18 * k, 6 * k, 180 if s > 0 else 0) for j in range(3)], fur, '#ffffff')
    return m.parts()


# ================================================================== 9. PAYMASTER: the company's wages, and the man who would not put them down.
def paymaster():
    gold = '#f2d25a'
    m = man('Paymaster', 384, w=0.96, skin='#b8c4d0', top='#2a3550', pants='#232838', slump=0.3, jaw=0.25, eye='#fffbe0', gaunt=0.96, teeth=(6, 4), torn=(0.0, 0.0), sleeve_to=(0.9, 0.9), curl=(0.9, 0.3),
            pose=dict(L=((-70, 276), (-58, 318), 70), R=((62, 250), (64, 196), -86)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    box = part('Paymaster_Prop', PROP, (-58 * k, 290 * k), 0.5)
    P(box, q(k, [(-104, 322), (-42, 330), (-40, 250), (-100, 242)]), '#4a3a2c'); box.flat(q(k, [(-104, 322), (-42, 330), (-42, 318), (-104, 310)]), '#6a5440', smooth=False)
    for y in (300, 264):
        box.flat(q(k, [(-104, y), (-41, y + 8), (-41, y + 2), (-104, y - 6)]), '#2a2a2e', smooth=False)
    box.flat(ellipse(-72 * k, 286 * k, 5 * k, 6 * k, n=8), '#b9974a')
    for (x, y) in ((-96, 236), (-84, 230), (-70, 234), (-90, 224), (-60, 240)):
        box.flat(ellipse(x * k, y * k, 5 * k, 5 * k, n=10), gold); box.flat(ellipse((x - 1) * k, (y + 1) * k, 2.2 * k, 2.2 * k, n=8), '#fff3b0')
    m.extra.append(box)
    for s in (-1, 1):
        for i in range(4):
            b.clipped(td, ellipse(s * 9 * k, (310 - i * 18) * k, 2.4 * k, 2.4 * k, n=8), gold)
    b.clipped(td, q(k, [(-60, 318), (-40, 328), (30, 250), (20, 244)]), '#4a3a2c', smooth=False)
    for (x, y, r) in ((-10, 48, 3), (12, 20, 2.4), (-14, 14, 2)):
        h.clipped(m.hd, ellipse(X(x), Y(y), r * u, r * u, n=8), gold)
    peaked_cap(m, '#2a3550', gold)
    spikes(h, [(X(-6), Y(0), 10 * u, 1.5 * u, -90), (X(5), Y(-1), 13 * u, 1.6 * u, -90)], ICE, ICE_L)
    return m.parts()


# ================================================================== BOSS 1. THE CONDUCTOR: every ticket was punched. He is still collecting.
def conductor():
    m = man('Conductor', 566, w=0.86, hw=0.94, skin='#c2ccd6', top='#1c2238', pants='#161a2a', boot='#0e0d10', slump=0.2, chest=0.98, jaw=0.1, eye='#7af0a0', gaunt=0.84, teeth=(8, 0), leg_bulk=0.86,
            sleeve_to=(0.93, 0.93), arm_bulk=0.84, hr=7, curl=(0.9, 0.5), belt=None, torn=(0, 0), pose=dict(L=((-58, 250), (-64, 192), -94), R=((66, 264), (78, 306), 78)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    coat_skirts(b, k, '#1c2238', w=36, flare=50, bottom=70, split=196)
    for s in (-1, 1):
        for i in range(6):
            b.flat(ellipse(s * 8 * k, (312 - i * 20) * k, 2.2 * k, 2.2 * k, n=8), '#d8b85a')
        b.clipped(td, q(k, [(s * 30, 328), (s * 52, 322), (s * 54, 314), (s * 30, 318)]), '#d8b85a', smooth=False)                            # braid on the shoulders
    b.clipped(td, path_limb(q(k, [(8, 270), (22, 258), (34, 266)]), [1 * k] * 3, n_end=3), '#d8b85a'); b.clipped(td, ellipse(36 * k, 262 * k, 5 * k, 5 * k, n=10), '#f2e2a0')
    for s in (-1, 1):   # a long white moustache, frozen stiff
        spikes(h, [(X(s * 2), Y(13), 26 * u, 3 * u, 196 if s < 0 else -16)], '#e8eef2')
    peaked_cap(m, '#1c2238', '#7a2a2a'); P(h, [(X(-20), Y(64)), (X(20), Y(64)), (X(18), Y(74)), (X(-18), Y(74))], '#1c2238')
    c = m.aL.hand_c   # the signal lamp: green for go
    m.aL.flat(path_limb([(c[0], c[1] - 2 * k), (c[0], c[1] - 18 * k)], [1.2 * k, 1.2 * k], n_end=3), '#5a5e66')
    P(m.aL, [(c[0] - 11 * k, c[1] - 18 * k), (c[0] + 11 * k, c[1] - 18 * k), (c[0] + 12 * k, c[1] - 52 * k), (c[0] - 12 * k, c[1] - 52 * k)], '#2a2226')
    m.aL.flat(ellipse(c[0], c[1] - 35 * k, 8 * k, 11 * k, n=12), '#3ae08a'); m.aL.flat(ellipse(c[0], c[1] - 34 * k, 3.6 * k, 5.6 * k, n=8), '#d8ffe8')
    c = m.aR.hand_c   # a fan of tickets
    for i in range(5):
        a = math.radians(50 + i * 20); nx, ny = -math.sin(a) * 6 * k, math.cos(a) * 6 * k; e = (c[0] + math.cos(a) * 44 * k, c[1] + math.sin(a) * 44 * k); s0 = (c[0] + math.cos(a) * 8 * k, c[1] + math.sin(a) * 8 * k)
        m.aR.flat([(s0[0] + nx, s0[1] + ny), (e[0] + nx, e[1] + ny), (e[0] - nx, e[1] - ny), (s0[0] - nx, s0[1] - ny)], '#f2ead0' if i % 2 else '#e0c890', smooth=False)
        m.aR.flat(ellipse(c[0] + math.cos(a) * 34 * k, c[1] + math.sin(a) * 34 * k, 1.8 * k, 1.8 * k, n=6), '#1c2238')
    return m.parts()


# ================================================================== BOSS 2. THE STOKER: fed the firebox until the firebox fed on him.
def stoker():
    m = man('Stoker', 500, w=1.45, hw=1.08, skin='#7a4a3c', top='#7a4a3c', pants='#23262c', boot='#16181c', leg_bulk=1.5, foot_w=1.3, stance=(34, 38, 38), belly=0.5, chest=1.1,
            jaw=0.5, eye='#ffb060', gaunt=1.1, teeth=(6, 4), brow=1.6, sleeve=False, arm_bulk=1.75, hr=11, curl=(0.8, 0.9), belt='', torn=(0, 0),
            pose=dict(L=((-90, 250), (-96, 188), -94), R=((98, 262), (112, 314), 84)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    b.clipped(td, ellipse(0, 268 * k, 46 * k, 44 * k, n=20), '#2a2c32')                                                                         # the fire door, let into his chest
    fd = b.clipped(td, ellipse(0, 268 * k, 36 * k, 34 * k, n=18), '#ff6a1a'); b.clipped(td, ellipse(0, 262 * k, 22 * k, 18 * k, n=14), '#ffc04a'); b.clipped(td, ellipse(0, 258 * k, 10 * k, 8 * k, n=10), '#fff0b0')
    for x in (-22, -7, 8, 23):
        b.clipped(td, q(k, [(x - 2.6, 304), (x + 2.6, 304), (x + 2.6, 232), (x - 2.6, 232)]), '#16181c', smooth=False)
    for i in range(12):
        a = i / 12 * 6.283; b.clipped(td, ellipse(math.cos(a) * 41 * k, (268 + math.sin(a) * 39) * k, 2.4 * k, 2.4 * k, n=6), '#8a8f99')
    ap = b.flat(q(k, [(-50, 226), (50, 226), (58, 150), (-58, 150)]), '#3a2a20', smooth=False); b.flat(q(k, [(-52, 228), (52, 228), (52, 220), (-52, 220)]), '#1c1614', smooth=False)
    for (x, y, r) in ((-40, 310, 12), (44, 300, 10), (-56, 250, 9)):
        b.clipped(td, ellipse(x * k, y * k, r * k, r * 0.8 * k, n=9), '#1e1a18', opacity=0.6)
    P(h, [(X(-24), Y(40)), (X(24), Y(40)), (X(24), Y(50)), (X(-24), Y(50))], '#7a2a2a')                                                         # bandana
    for s in (-1, 1):
        h.flat(ellipse(X(s * 10), Y(58), 7.4 * u, 6 * u, n=12), '#3a3e46'); h.flat(ellipse(X(s * 10), Y(58), 5 * u, 4 * u, n=10), '#8a5a2a')     # goggles pushed up
    c = m.aR.hand_c   # the shovel
    m.aR.flat(path_limb([(c[0] - 4 * k, c[1] - 70 * k), (c[0] + 6 * k, c[1] + 90 * k)], [3.6 * k, 3.6 * k], n_end=4), '#4a3626')
    P(m.aR, [(c[0] - 22 * k, c[1] + 88 * k), (c[0] + 34 * k, c[1] + 90 * k), (c[0] + 36 * k, c[1] + 150 * k), (c[0] + 8 * k, c[1] + 164 * k), (c[0] - 22 * k, c[1] + 148 * k)], '#6a6e76')
    for (x, y, r) in ((0, 140, 9), (16, 132, 8), (-8, 124, 7), (22, 148, 6)):
        m.aR.flat(ellipse(c[0] + x * k, c[1] + y * k, r * k, r * 0.8 * k, n=7), '#ff7a2a' if r > 7 else '#1c1614')                               # a load of live coals
    return m.parts()


# ================================================================== BOSS 3. THE WHITE WIDOW: she waited on the platform for a train that is still coming.
def white_widow():
    m = man('Widow', 520, w=0.84, hw=0.96, skin='#cfe0ec', top='#e6eef4', pants='#e6eef4', slump=0.3, chest=0.96, jaw=1.2, eye=None, gaunt=0.86, teeth=(7, 6), hair=('long', '#f4f8fa'),
            sleeve_to=(0.7, 0.7), claw=ICE, curl=(0.1, 0.1), arm_bulk=0.8, hr=7.5, belt=None, pose=dict(L=((-70, 262), (-92, 204), -110), R=((70, 262), (94, 206), -70)),
            gown=dict(col='#e6eef4', top=240, hem_w=74, rag=9, seed=6))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    b.flat(q(k, [(-34, 200), (-12, 110), (-26, 24), (-40, 110)]), '#c2d0dc', opacity=0.9); b.flat(q(k, [(26, 206), (40, 110), (30, 20), (16, 120)]), '#c2d0dc', opacity=0.9); b.flat(q(k, [(-4, 190), (6, 100), (-2, 30), (-10, 100)]), '#d2dee8', opacity=0.9)
    for i in range(6):
        b.clipped(td, ellipse(0, (318 - i * 13) * k, 1.8 * k, 1.8 * k, n=6), '#aab8c6')
    b.clipped(td, rect(-60 * k, 234 * k, 60 * k, 242 * k), ICE, smooth=False)
    spikes(b, [(x * k, 16 * k, l * k, 4 * k, -90) for (x, l) in ((-60, 22), (-36, 30), (-10, 18), (18, 28), (44, 20), (64, 26))], ICE, ICE_L)   # the hem has frozen to icicles
    for s in (-1, 1):
        h.clipped(m.hd, [(X(s * 8), Y(27)), (X(s * 11), Y(27)), (X(s * 10.5), Y(8)), (X(s * 9), Y(8))], ICE, smooth=False, opacity=0.9)        # frozen tears
    S(h, [(X(-24), Y(54)), (X(-34), Y(10)), (X(-40), Y(-60)), (X(-20), Y(-40)), (X(-22), Y(20))], '#f4f8fa', opacity=0.55); S(h, [(X(24), Y(54)), (X(34), Y(10)), (X(42), Y(-50)), (X(22), Y(-30)), (X(22), Y(20))], '#f4f8fa', opacity=0.55)   # the veil
    spikes(h, [(X(x), Y(54), l * u, 3.4 * u, a) for (x, l, a) in ((-16, 22, 112), (-8, 34, 100), (0, 42, 90), (8, 34, 80), (16, 22, 68))], ICE, ICE_L)   # a tiara of ice
    for a in (m.aL, m.aR):
        c = a.hand_c; spikes(a, [(c[0] + j * 4 * k, c[1] - 8 * k, 34 * k, 2 * k, -90 + j * 12) for j in (-2, -1, 0, 1, 2)], ICE, ICE_L)
    return m.parts()


# ================================================================== BOSS 4. THE WENDIGO: the hunger that the pass is named for.
def wendigo():
    hide, bone = '#5a544e', '#d9cfb8'
    m = man('Wendigo', 640, w=0.95, hw=1.0, skin=hide, top=hide, pants='#3a342e', slump=0.6, chest=1.0, jaw=0.0, eye=None, gaunt=0.9, teeth=(0, 0), ears=False, bare_feet=True, torn=(0.7, 0.8),
            sleeve=False, claw='#1e1a16', curl=(0.0, 0.0), arm_bulk=0.82, hr=9.5, belt='', pose=dict(L=((-70, 236), (-86, 150), -100), R=((70, 236), (88, 152), -80)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    cav = b.clipped(td, q(k, [(-30, 312), (30, 312), (36, 270), (24, 240), (-24, 240), (-36, 270)]), '#1a1216', smooth=False)                  # nothing in him but the cold
    b.clipped(cav, ellipse(-4 * k, 280 * k, 11 * k, 13 * k, n=10), ICE); b.clipped(cav, ellipse(-5 * k, 282 * k, 5 * k, 6 * k, n=8), ICE_L)
    for s in (-1, 1):
        for i in range(5):
            y = 308 - i * 14
            b.clipped(td, path_limb(q(k, [(s * 3, y), (s * 22, y - 3), (s * 38, y - 14)]), [2.6 * k, 2.4 * k, 1.6 * k], n_end=3), bone)
    b.clipped(td, q(k, [(-2.6, 318), (2.6, 318), (2.2, 246), (-2.2, 246)]), bone, smooth=False)
    spikes(b, [(x * k, 326 * k, 30 * k, 9 * k, a) for (x, a) in ((-46, 200), (-36, 230), (36, -50), (46, -20))], '#3a342e')                      # a mantle of hide
    # a stag's skull where the head was
    h.clipped(m.hd, [(X(-30), Y(70)), (X(30), Y(70)), (X(30), Y(-30)), (X(-30), Y(-30))], hide, smooth=False)
    S(h, [(X(x), Y(y)) for x, y in M([(0, 60), (12, 58), (20, 46), (19, 30), (12, 12), (8, -14), (5, -32), (0, -36)])], bone)
    for s in (-1, 1):
        h.flat([(X(s * 5), Y(40)), (X(s * 16), Y(44)), (X(s * 17), Y(32)), (X(s * 8), Y(28))], SOCKET, smooth=False); h.flat(ellipse(X(s * 11), Y(36), 2.4 * u, 2.4 * u, n=8), ICE_L)
        h.flat([(X(s * 1), Y(-10)), (X(s * 4), Y(-8)), (X(s * 3.4), Y(-28)), (X(s * 1), Y(-30))], SOCKET, smooth=False)
        pts = [(X(s * 10), Y(56)), (X(s * 22), Y(84)), (X(s * 44), Y(104)), (X(s * 58), Y(140))]
        h.flat(path_limb(pts, [4.4 * u, 3.8 * u, 3 * u, 1 * u], n_end=3), '#b9ae94')
        for (bx, by, ex, ey) in ((22, 84, 14, 116), (34, 96, 36, 132), (44, 104, 66, 112), (50, 122, 70, 144)):
            h.flat(path_limb([(X(s * bx), Y(by)), (X(s * ex), Y(ey))], [2.8 * u, 0.8 * u], n_end=3), '#b9ae94')
    for i in range(5):
        h.flat(rect(X(-6 + i * 3 - 0.9), Y(-36), X(-6 + i * 3 + 0.9), Y(-28)), '#8a7a5a', smooth=False)
    return m.parts()


# ================================================================== BOSS 5. THE STATIONMASTER: he never cleared the line, so nothing ever left.
def stationmaster():
    coat, glow = '#1c2238', '#ff4a3a'
    m = man('Stationmaster', 630, w=1.42, hw=1.04, skin='#c2ccd6', top=coat, pants='#161a2a', boot='#0e0d10', leg_bulk=1.4, foot_w=1.3, stance=(34, 38, 38), belly=0.4, chest=1.08,
            jaw=0.45, eye=glow, gaunt=0.96, teeth=(8, 6), brow=1.8, sleeve_to=(0.9, 0.9), arm_bulk=1.45, hr=10, curl=(0.9, 0.25), belt=None, torn=(0, 0),
            sh=(74, 314), pose=dict(L=((-104, 262), (-114, 204), -100), R=((104, 262), (128, 300), 70)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    for side in (-1, 1):   # semaphore arms behind each shoulder, every one of them at danger
        pr = part('Stationmaster_Prop%s' % ('L' if side < 0 else 'R'), PROP, (side * 70 * k, 318 * k), 0.5)
        for i in range(4):
            a = math.radians(90 - side * (20 + i * 24)); base = (side * 66 * k, 316 * k); nx, ny = -math.sin(a) * 9 * k, math.cos(a) * 9 * k
            p0 = (base[0] + math.cos(a) * 40 * k, base[1] + math.sin(a) * 40 * k); p1 = (base[0] + math.cos(a) * 124 * k, base[1] + math.sin(a) * 124 * k); pm = lerp(p0, p1, 0.72)
            pr.flat(path_limb([base, p0], [2.6 * k, 2.6 * k], n_end=3), '#33363c')
            pr.shape([(p0[0] + nx, p0[1] + ny), (p1[0] + nx, p1[1] + ny), (p1[0] - nx, p1[1] - ny), (p0[0] - nx, p0[1] - ny)], '#c8322a', smooth=False)
            pr.flat([(pm[0] + nx, pm[1] + ny), (lerp(p0, p1, 0.86)[0] + nx, lerp(p0, p1, 0.86)[1] + ny), (lerp(p0, p1, 0.86)[0] - nx, lerp(p0, p1, 0.86)[1] - ny), (pm[0] - nx, pm[1] - ny)], '#f2f4f6', smooth=False)
            pr.flat(ellipse(p0[0], p0[1], 5 * k, 5 * k, n=8), glow)
        m.extra.append(pr)
    coat_skirts(b, k, coat, w=54, flare=72, bottom=110)
    spikes(b, [(x * k, 112 * k, l * k, 4.6 * k, -90) for (x, l) in ((-68, 26), (-52, 36), (-36, 22), (40, 30), (56, 38), (70, 24))], ICE, ICE_L)
    b.clipped(td, ellipse(0, 280 * k, 30 * k, 30 * k, n=18), '#2a2c32'); b.clipped(td, ellipse(0, 280 * k, 22 * k, 22 * k, n=16), glow); b.clipped(td, ellipse(-3 * k, 284 * k, 9 * k, 9 * k, n=10), '#ffd0c0')   # a signal lamp where his heart was
    for s in (-1, 1):
        b.clipped(td, q(k, [(s * 9, 331), (s * 46, 330), (s * 50, 300), (s * 34, 316)]), '#2a3350', smooth=False)
        for i in range(4):
            b.clipped(td, ellipse(s * 46 * k, (290 - i * 22) * k, 3 * k, 3 * k, n=8), '#d8b85a')
        b.clipped(td, q(k, [(s * 34, 330), (s * 76, 322), (s * 78, 312), (s * 34, 320)]), '#d8b85a', smooth=False)
    _snow(b, [(-62, 328, 18, 6), (60, 327, 20, 6)], k)
    S(h, [(X(-13), Y(8)), (X(-16), Y(-10)), (X(-9), Y(-34)), (X(0), Y(-26)), (X(8), Y(-38)), (X(16), Y(-10)), (X(13), Y(8)), (X(6), Y(-2)), (X(0), Y(0)), (X(-6), Y(-2))], '#e8eef2')   # a beard of rime
    spikes(h, [(X(x), Y(-30), l * u, 2.2 * u, -90) for (x, l) in ((-8, 16), (-2, 22), (5, 18), (10, 12))], ICE, ICE_L)
    peaked_cap(m, coat, '#c8322a'); P(h, [(X(-22), Y(64)), (X(22), Y(64)), (X(20), Y(76)), (X(-20), Y(76))], coat)
    spikes(h, [(X(x), Y(74), l * u, 3 * u, a) for (x, l, a) in ((-16, 18, 108), (-6, 28, 96), (6, 28, 84), (16, 18, 72))], ICE, ICE_L)
    c = m.aL.hand_c   # a hand bell
    m.aL.flat(path_limb([(c[0], c[1] + 6 * k), (c[0], c[1] - 20 * k)], [3 * k, 3 * k], n_end=3), '#4a3626'); P(m.aL, [(c[0] - 8 * k, c[1] - 20 * k), (c[0] + 8 * k, c[1] - 20 * k), (c[0] + 20 * k, c[1] - 56 * k), (c[0] - 20 * k, c[1] - 56 * k)], '#d8b85a'); m.aL.flat(ellipse(c[0], c[1] - 60 * k, 5 * k, 5 * k, n=8), '#8a6a2a')
    return m.parts()


ROSTER = [
    ('Brakeman', brakeman), ('Snowblind', snowblind), ('RimeCrawler', rime_crawler), ('Scald', scald), ('Hailer', hailer), ('SnowOwl', snow_owl), ('TimberWolf', timber_wolf), ('Whitepelt', whitepelt), ('Paymaster', paymaster),
    ('Conductor', conductor), ('Stoker', stoker), ('Widow', white_widow), ('Wendigo', wendigo), ('Stationmaster', stationmaster),
]
