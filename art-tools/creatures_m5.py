"""Gallows Wharf: the drowned crews, what came up the pilings, and the man who did the hanging."""
from kit2 import *   # noqa: F401,F403

SEA, SEA_L, BARN, OIL, BRASS, WET = '#3aa890', '#b8f0e0', '#b8b4a0', '#c8a83a', '#b8923a', '#7f96a0'


def _barnacles(p, clip, pts, k=1.0):
    for (x, y, r) in pts:
        f = (lambda *a: p.clipped(clip, *a)) if clip else p.flat
        f(ellipse(x * k, y * k, r * k, r * k, n=8), BARN); f(ellipse(x * k, y * k, r * 0.45 * k, r * 0.45 * k, n=6), '#3a3a34')


def _souwester(m, col=OIL):
    h, X, Y, u = m.h, m.X, m.Y, m.u
    P(h, [(X(-22), Y(44)), (X(-20), Y(58)), (X(-8), Y(66)), (X(8), Y(66)), (X(20), Y(58)), (X(22), Y(44))], col)
    P(h, [(X(-30), Y(46)), (X(30), Y(46)), (X(36), Y(34)), (X(24), Y(40)), (X(-24), Y(40)), (X(-36), Y(34))], shade(col, 0.8))


# ================================================================== 1. DECKHAND: went down with the ship and walked back.
def deckhand():
    m = man('Deckhand', 400, skin=WET, top='#e8e2d0', pants='#2a3040', slump=0.6, jaw=0.5, eye=SEA_L, torn=(0.35, 0.1), sleeve_to=(0.5, 0.4), curl=(0.3, 0.9), bare_feet=True,
            pose=dict(L=((-60, 246), (-64, 190), -94), R=((64, 250), (70, 200), -86)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    for i, y in enumerate(range(240, 332, 11)):
        if i % 2:
            b.clipped(td, rect(-90 * k, y * k, 90 * k, (y + 11) * k), '#2a3a5a', smooth=False)
    b.clipped(td, path_limb(q(k, [(-46, 326), (-10, 280), (30, 246), (44, 236)]), [5 * k] * 4, n_end=3), '#a89060'); b.clipped(td, path_limb(q(k, [(-36, 330), (0, 290), (40, 256)]), [4 * k] * 3, n_end=3), '#8a7648')   # a coil of line over the shoulder
    _barnacles(b, td, [(-34, 296, 5), (-26, 286, 3.4), (30, 300, 4), (-40, 256, 4)], k); wound(b, td, (14 * k, 266 * k), 11 * k, seed=3)
    _barnacles(h, m.hd, [(X(-14), Y(44), 3 * u), (X(12), Y(18), 2.4 * u)])
    _souwester(m)
    c = m.aR.hand_c
    m.aR.flat(path_limb([(c[0] - 2 * k, c[1] + 110 * k), (c[0] + 6 * k, c[1] - 120 * k)], [2.6 * k, 2.6 * k], n_end=3), '#6a4a2e'); m.aR.flat(path_limb([(c[0] - 2 * k, c[1] + 108 * k), (c[0] - 3 * k, c[1] + 132 * k)], [2 * k, 0.6 * k], n_end=2), '#8a8f99'); m.aR.flat(path_limb([(c[0] - 2 * k, c[1] + 112 * k), (c[0] + 12 * k, c[1] + 122 * k), (c[0] + 16 * k, c[1] + 110 * k)], [2 * k, 1.8 * k, 0.6 * k], n_end=2), '#8a8f99')
    return m.parts()


# ================================================================== 2. RIGGER: went aloft in any weather. Comes down fast.
def rigger():
    m = man('Rigger', 380, w=0.9, skin='#8fa4a8', top='#8fa4a8', pants='#3a3a34', slump=0.2, jaw=0.9, eye=SEA_L, gaunt=0.9, teeth=(6, 5), torn=(0.5, 0.4), bare_feet=True,
            sleeve=False, claw='#1e2428', curl=(0.0, 0.0), pose=dict(L=((-82, 282), (-98, 338), 100), R=((84, 276), (104, 330), 76)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    ribs(b, td, m.F, shade('#8fa4a8', 0.56), n=5, op=0.8)
    b.clipped(td, path_limb(q(k, [(-8, 300), (-8, 270)]), [1.6 * k, 1.6 * k], n_end=2), '#2a3a5a'); b.clipped(td, path_limb(q(k, [(-18, 276), (-8, 266), (2, 276)]), [1.6 * k] * 3, n_end=2), '#2a3a5a'); b.clipped(td, q(k, [(-14, 296), (-2, 296), (-2, 293), (-14, 293)]), '#2a3a5a', smooth=False)   # an anchor, inked
    b.clipped(td, q(k, [(-60, 334), (60, 334), (40, 322), (0, 328), (-40, 322)]), '#a89060', smooth=False)                                         # a halyard round his neck
    for a in (m.aL, m.aR):
        c = a.hand_c; a.flat(path_limb([(c[0], c[1] - 6 * k), (c[0] + 4 * k, c[1] - 50 * k), (c[0] - 4 * k, c[1] - 90 * k)], [2.2 * k, 2 * k, 1.4 * k], n_end=3), '#a89060')
    P(h, [(X(-23), Y(40)), (X(-21), Y(58)), (X(0), Y(64)), (X(21), Y(58)), (X(23), Y(40)), (X(0), Y(46))], '#7a2a26'); S(h, [(X(18), Y(46)), (X(28), Y(40)), (X(34), Y(14)), (X(24), Y(22))], '#7a2a26')
    return m.parts()


# ================================================================== 3. WHARF CRAB: the size of a cart, and it has learned what a boot is for.
def crab():
    cn = 'Crab'
    shell, dark, pale = '#8a3a2a', '#5e241c', '#d8b89a'
    b = part(cn + '_Body', BODY, (0, 50), 1)
    for s in (-1, 1):
        for j, (kx, ky, fx) in enumerate(((122, 84, 150), (132, 70, 172), (120, 54, 160))):
            b.flat(path_limb([(s * 78, 56 - j * 4), (s * kx, ky), (s * fx, 4)], [7, 5, 2], n_end=3), dark)
    td = S(b, M([(0, 100), (52, 96), (94, 78), (108, 54), (88, 34), (0, 26)]), shell)
    b.clipped(td, M([(0, 52), (70, 50), (84, 36), (0, 26)]), pale)
    spikes(b, [(x, 96 - abs(x) * 0.18, 12, 5, 90 + x * 0.3) for x in (-84, -60, -34, 34, 60, 84)], dark)
    for (x, y, r) in ((-40, 80, 9), (30, 84, 7), (64, 70, 6), (-70, 66, 5)):
        b.clipped(td, ellipse(x, y, r, r * 0.7, n=8), dark, opacity=0.7)
    _barnacles(b, td, [(10, 86, 5), (-18, 74, 4), (48, 62, 4.4), (-56, 84, 3.4)])
    parts = [b]
    h = part(cn + '_Head', HEAD, (0, 64), 2)
    for s in (-1, 1):
        h.flat(path_limb([(s * 16, 92), (s * 22, 128)], [3, 2.4], n_end=3), shell); h.shape(ellipse(s * 22, 132, 7, 7, n=10), '#101014'); h.flat(ellipse(s * 20, 134, 2, 2, n=6), '#ffffff')
        h.flat([(s * 3, 58), (s * 16, 60), (s * 14, 40), (s * 6, 34)], dark, smooth=False); spikes(h, [(s * 8, 40, 10, 2.4, -90)], pale)
    h.flat([(-12, 62), (12, 62), (10, 52), (-10, 52)], '#2a1014', smooth=False)
    parts.append(h)
    for side in (-1, 1):
        role = ARM_F if side > 0 else ARM_B
        a = part('%s_%s' % (cn, role), role, (side * 84, 62), 3)
        S(a, path_limb([(side * 84, 64), (side * 128, 92), (side * 150, 66)], [13, 12, 14]), shell)
        big = 1.25 if side > 0 else 1.0
        a.shape([(side * 138, 78), (side * 172 * big, 96 * big), (side * 186 * big, 66), (side * 176 * big, 30), (side * 150, 22), (side * 158, 48), (side * 140, 52)], shell, smooth=False)       # the fixed jaw
        a.shape([(side * 138, 50), (side * 150, 20), (side * 136, 0), (side * 122, 14), (side * 130, 34)], dark, smooth=False)                                                                # the one that closes
        spikes(a, [(side * (160 + j * 7) * big, 44 - j * 6, 7, 2.4, 180 if side > 0 else 0) for j in range(3)], pale)
        parts.append(a)
    return parts


# ================================================================== 4. THE COOK: went into the hold for the salt pork and the hold flooded.
def cook():
    cn = 'Cook'; F = fig(440, w=1.22); k = F['k']
    skin, cloth = '#7f9aa0', '#2a3040'
    parts = [leg2(cn, -1, F, cloth, skin, torn=0.3, bulk=1.5, hip=(-34 * k, 196 * k), knee=(-40 * k, 104 * k), ank=(-42 * k, 16 * k), foot_w=1.2), leg2(cn, 1, F, cloth, skin, torn=0.5, bulk=1.5, hip=(34 * k, 196 * k), knee=(40 * k, 104 * k), ank=(42 * k, 16 * k), foot_w=1.2)]
    b, td = body(cn, F, skin, half=[(0, 331), (9, 331), (28, 326), (46, 319), (52, 304), (56, 284), (66, 262), (78, 240), (82, 218), (76, 198), (60, 186), (40, 181), (0, 179)])
    ap = b.clipped(td, q(k, [(-36, 318), (36, 318), (60, 260), (70, 190), (-70, 190), (-60, 260)]), '#c8c2b0', smooth=False)
    for s in (-1, 1):
        b.clipped(td, q(k, [(s * 36, 318), (s * 28, 318), (s * 14, 334), (s * 20, 334)]), '#a8a290', smooth=False)
    b.clipped(td, q(k, [(-8, 290), (8, 262), (-6, 230), (6, 204), (-2, 190), (-12, 232), (-4, 262)]), '#1a2a2e', smooth=False); b.clipped(td, q(k, [(-4, 280), (3, 262), (-4, 236), (2, 212), (-6, 236), (-2, 262)]), SEA, smooth=False)   # the seam, and the sea in him
    wound(b, td, (-36 * k, 270 * k), 14 * k, seed=4); wound(b, td, (38 * k, 222 * k), 12 * k, seed=9)
    _barnacles(b, td, [(52, 286, 5), (-58, 236, 5), (44, 300, 3.4)], k)
    b.clipped(td, q(k, [(-140, 170), (140, 170), (140, 196), (60, 190), (0, 186), (-60, 190), (-140, 196)]), cloth, smooth=False)
    parts.append(b)
    h, hd, L = skull(cn, F, skin, jaw=0.5, eye=SEA_L, hair=None, gaunt=1.12, teeth=(5, 4))
    X, Y, u = L['X'], L['Y'], L['u']
    P(h, [(X(-22), Y(46)), (X(22), Y(46)), (X(22), Y(54)), (X(-22), Y(54))], '#e8e2d0'); S(h, blobby(X(0), Y(66), 26 * u, 16 * u, n=14, jitter=0.1, seed=3), '#e8e2d0')   # what is left of his cap
    parts.append(h)
    parts.append(arm2(cn, -1, F, skin, sh=(-54 * k, 312 * k), el=(-86 * k, 254 * k), wr=(-106 * k, 200 * k), bulk=1.3, hand_ang=-104, curl=0.25, hr=8.4 * k))
    aR = arm2(cn, 1, F, skin, sh=(54 * k, 312 * k), el=(86 * k, 254 * k), wr=(104 * k, 198 * k), bulk=1.3, hand_ang=-76, curl=0.9, hr=8.4 * k)
    c = aR.hand_c
    aR.flat(path_limb([(c[0], c[1] + 14 * k), (c[0] + 4 * k, c[1] - 30 * k)], [3 * k, 3 * k], n_end=3), '#4a3226'); P(aR, [(c[0] - 8 * k, c[1] - 28 * k), (c[0] + 20 * k, c[1] - 30 * k), (c[0] + 24 * k, c[1] - 84 * k), (c[0] - 10 * k, c[1] - 80 * k)], '#aeb2ba')
    parts.append(aR)
    return parts


# ================================================================== 5. HARPOONER: never missed a whale. You are a good deal closer.
def harpooner():
    m = man('Harpooner', 420, w=0.96, skin=WET, top=OIL, pants='#2a3040', slump=0.3, jaw=0.3, eye=SEA_L, gaunt=0.94, torn=(0.0, 0.0), sleeve_to=(0.85, 0.85), curl=(0.5, 0.9),
            pose=dict(L=((-62, 246), (-60, 196), -90), R=((74, 270), (84, 330), 86)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    coat_skirts(b, k, OIL, w=40, flare=48, bottom=140)
    for i in range(4):
        b.clipped(td, ellipse(6 * k, (312 - i * 20) * k, 2.6 * k, 2.6 * k, n=8), '#2a2420')
    b.clipped(td, q(k, [(-2, 331), (2, 331), (2, 240), (-2, 240)]), shade(OIL, 0.7), smooth=False)
    _barnacles(b, td, [(-30, 290, 4), (34, 264, 4)], k)
    _souwester(m, '#a88a2a')
    S(h, [(X(-13), Y(8)), (X(-16), Y(-8)), (X(-6), Y(-22)), (X(0), Y(-14)), (X(7), Y(-24)), (X(16), Y(-8)), (X(13), Y(8)), (X(6), Y(-2)), (X(0), Y(0)), (X(-6), Y(-2))], '#c8c8c0')
    c = m.aR.hand_c   # the iron
    m.aR.flat(path_limb([(c[0] + 4 * k, c[1] - 100 * k), (c[0] - 2 * k, c[1] + 90 * k)], [2.8 * k, 2.4 * k], n_end=3), '#6a4a2e')
    m.aR.flat(path_limb([(c[0] - 2 * k, c[1] + 88 * k), (c[0] - 4 * k, c[1] + 150 * k)], [1.8 * k, 1.2 * k], n_end=2), '#8a8f99'); m.aR.flat(q(1, [(c[0] - 4 * k, c[1] + 172 * k), (c[0] - 16 * k, c[1] + 142 * k), (c[0] - 4 * k, c[1] + 150 * k), (c[0] + 8 * k, c[1] + 142 * k)]), '#c9cdd6', smooth=False)
    m.aR.flat(path_limb([(c[0] + 4 * k, c[1] - 100 * k), (c[0] + 30 * k, c[1] - 130 * k), (c[0] + 20 * k, c[1] - 170 * k)], [1.2 * k] * 3, n_end=2), '#a89060')
    return m.parts()


# ================================================================== 6. CARRION GULL: follows the boats in. Follows you.
def gull():
    cn = 'Gull'
    wh, gr, dk = '#d8dcd8', '#8a9498', '#3a4248'
    t = part(cn + '_Tail', TAIL, (0, 78), 0)
    feathers(t, (0, 82), (0, 30), 5, wh, 0.9, seed=3)
    for s in (-1, 1):
        t.flat(path_limb([(s * 8, 74), (s * 10, 54)], [2.4, 1.8], n_end=3), '#c8a03a'); t.flat([(s * 10 - 8, 56), (s * 10 + 8, 56), (s * 10, 44)], '#c8a03a', smooth=False)
    parts = [t]
    for side in (-1, 1):
        role = WING_F if side > 0 else WING_B
        w = part('%s_%s' % (cn, role), role, (side * 22, 104), 1)
        sh, el, wr = (side * 22, 104), (side * 86, 128), (side * 160, 108)
        feathers(w, wr, (side * 250, 86), 6, gr, 0.7, droop=side * 0.25, seed=5 + side); feathers(w, el, (side * 130, 52), 6, gr, 0.7, seed=9 + side); feathers(w, sh, (side * 56, 54), 4, wh, 0.6, seed=13 + side)
        S(w, path_limb([sh, el, wr], [9, 7, 4]), wh); spikes(w, [(side * 244, 88, 20, 5, 180 - side * 0 if side < 0 else 0)], dk)
        parts.append(w)
    b = part(cn + '_Body', BODY, (0, 100), 2)
    td = S(b, M([(0, 132), (16, 130), (26, 114), (26, 94), (18, 76), (8, 68), (0, 66)]), wh)
    wound(b, td, (6, 96), 9, seed=4, bone=True); b.clipped(td, [(-26, 110), (-8, 112), (-10, 84), (-24, 80)], gr, smooth=False, opacity=0.7)
    parts.append(b)
    h = part(cn + '_Head', HEAD, (0, 124), 3)
    hd = S(h, M([(0, 162), (12, 160), (19, 148), (18, 134), (10, 124), (0, 122)]), wh)
    for s in (-1, 1):
        h.clipped(hd, ellipse(s * 9, 146, 4.6, 4.6, n=10), '#101014'); h.clipped(hd, ellipse(s * 9, 146, 2.6, 2.6, n=8), '#ffd24a'); h.clipped(hd, ellipse(s * 9, 146, 1, 1, n=6), '#101014')
    h.shape([(-6, 138), (6, 138), (5, 118), (2, 100), (-1, 94), (-3, 104), (-5, 118)], '#c8a03a', smooth=False); h.flat([(-3, 112), (4, 112), (2, 100), (-1, 96)], BLOOD, smooth=False)
    parts.append(h)
    return parts


# ================================================================== 7. WHARF RAT: grown fat on what the tide leaves.
def rat():
    cn = 'Rat'
    fur, dark, pink = '#5a524a', '#3a3430', '#b88a8a'
    parts = []
    for side in (-1, 1):
        role = LEG_F if side > 0 else LEG_B
        p = part('%s_%s' % (cn, role), role, (side * 44, 60), 0)
        S(p, ellipse(side * 46, 60, 24, 30, n=14), dark); p.flat(path_limb([(side * 54, 40), (side * 66, 8)], [7, 4], n_end=3), pink); spikes(p, [(side * 66 + j * 5, 6, 8, 1.4, -90 + j * 14) for j in (-1, 0, 1)], '#e8e2d0')
        parts.append(p)
    b = part(cn + '_Body', BODY, (0, 60), 1)
    b.flat(path_limb([(40, 60), (100, 40), (130, 70), (160, 50), (176, 16)], [6, 5, 4, 3, 1.4], n_end=3), pink)                                    # the tail
    for i in range(8):
        b.flat(rect(60 + i * 14, 34 + (i % 3) * 8, 62 + i * 14, 44 + (i % 3) * 8), shade(pink, 0.7), smooth=False)
    td = S(b, M([(0, 128), (30, 124), (50, 100), (52, 70), (40, 44), (0, 36)]), fur)
    spikes(b, [(x, y, 13, 4, a) for (x, y, a) in ((-30, 124, 110), (-12, 128, 96), (10, 128, 84), (30, 124, 70), (-50, 100, 160), (50, 98, 20))], dark)
    wound(b, td, (22, 88), 10, seed=3); b.clipped(td, ellipse(-20, 70, 12, 9, n=8), pink, opacity=0.7)
    parts.append(b)
    h = part(cn + '_Head', HEAD, (0, 96), 2)
    for s in (-1, 1):
        S(h, [(s * 16, 138), (s * 22, 156), (s * 34, 150), (s * 30, 142), (s * 36, 136), (s * 30, 126)], dark); h.flat([(s * 20, 138), (s * 24, 150), (s * 30, 144), (s * 28, 132)], shade(pink, 0.7), smooth=False)
    hd = S(h, M([(0, 146), (16, 144), (26, 128), (24, 108), (12, 84), (5, 70), (0, 66)]), fur)
    for s in (-1, 1):
        h.clipped(hd, ellipse(s * 13, 120, 5, 5, n=10), '#101014'); h.clipped(hd, ellipse(s * 13, 120, 2.6, 2.6, n=8), '#ff5a4a')
        for j in range(3):
            h.flat(path_limb([(s * 6, 78 + j * 3), (s * 34, 84 + j * 8)], [0.5, 0.3], n_end=2), '#c8c8c0')
        h.flat([(s * 0.6, 70), (s * 4.4, 70), (s * 4, 54), (s * 1, 52)], '#e8d8a0', smooth=False)
    h.flat(ellipse(0, 70, 5, 4, n=8), pink)
    parts.append(h)
    for side in (-1, 1):
        role = ARM_F if side > 0 else ARM_B
        a = part('%s_%s' % (cn, role), role, (side * 22, 70), 3)
        S(a, path_limb([(side * 22, 72), (side * 28, 36), (side * 24, 8)], [9, 6, 4]), fur); spikes(a, [(side * 24 + j * 5, 6, 8, 1.4, -90 + j * 16) for j in (-1, 0, 1)], '#e8e2d0')
        parts.append(a)
    return parts


# ================================================================== 8. THE DIVER: they never hauled him up. He walked back along the bottom.
def diver():
    canvas, copper = '#8a8468', '#b86a3a'
    m = man('Diver', 480, w=1.45, hw=1.1, skin=canvas, top=canvas, pants=canvas, boot='#3a3a40', belly=0.4, chest=1.12, slump=0.2, leg_bulk=1.6, foot_w=1.6, stance=(34, 38, 38),
            jaw=0.0, eye=None, teeth=(0, 0), ears=False, neck=False, sleeve=False, arm_bulk=1.7, hr=11, curl=(0.7, 0.7), belt='#3a2a20', torn=(0, 0),
            pose=dict(L=((-90, 250), (-96, 188), -94), R=((90, 250), (98, 188), -86)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    b.clipped(td, q(k, [(-60, 334), (60, 334), (64, 300), (0, 286), (-64, 300)]), copper, smooth=False)                                           # the corselet
    for x in (-44, -22, 0, 22, 44):
        b.clipped(td, ellipse(x * k, (304 - abs(x) * 0.12) * k, 3.4 * k, 3.4 * k, n=8), BRASS)
    for s in (-1, 1):
        b.clipped(td, q(k, [(s * 12, 280), (s * 44, 276), (s * 44, 226), (s * 12, 230)]), '#5a5e66', smooth=False); b.clipped(td, q(k, [(s * 12, 280), (s * 44, 276), (s * 44, 270), (s * 12, 274)]), '#8a8f99', smooth=False)   # lead weights
    for (x0, y0, x1, y1) in ((-56, 260, -40, 200), (50, 250, 58, 206)):
        b.clipped(td, q(k, [(x0, y0), (x0 + 2, y0), (x1 + 1, y1), (x1, y1)]), shade(canvas, 0.6), smooth=False)
    _barnacles(b, td, [(-50, 290, 5), (56, 240, 5), (-30, 210, 4), (20, 196, 3.6)], k)
    hose = part('Diver_Prop', PROP, (30 * k, 380 * k), 0.5)
    hose.flat(path_limb(q(k, [(26, 380), (70, 420), (120, 380), (130, 300), (150, 200), (140, 120)]), [5 * k] * 5 + [4 * k], n_end=4), '#5a3a2a'); hose.flat(path_limb(q(k, [(140, 120), (150, 90)]), [5 * k, 2 * k], n_end=3), '#3a2a20')
    m.extra.append(hose)
    S(h, ellipse(X(0), Y(28), 32 * u, 34 * u, n=22), copper)                                                                                      # the helmet
    h.flat(ellipse(X(0), Y(28), 18 * u, 18 * u, n=18), BRASS); h.flat(ellipse(X(0), Y(28), 14 * u, 14 * u, n=16), '#0e1a1c'); h.flat(ellipse(X(-3), Y(31), 5 * u, 5 * u, n=10), SEA); h.flat(ellipse(X(5), Y(24), 2.4 * u, 2.4 * u, n=8), SEA_L)
    for a in (0, 90, 180, 270):
        r = math.radians(a + 45); h.flat(ellipse(X(math.cos(r) * 16), Y(28 + math.sin(r) * 16), 2 * u, 2 * u, n=6), '#5e3a1e')
    for s in (-1, 1):
        h.flat(ellipse(X(s * 30), Y(30), 8 * u, 9 * u, n=12), BRASS); h.flat(ellipse(X(s * 30), Y(30), 5 * u, 6 * u, n=10), '#0e1a1c')
    h.flat(rect(X(-26), Y(-8), X(26), Y(0)), BRASS, smooth=False); h.flat(ellipse(X(8), Y(60), 6 * u, 5 * u, n=8), BRASS)
    return m.parts()


# ================================================================== 9. SMUGGLER: a keg of the best, duty unpaid, and he means to keep it.
def smuggler():
    gold = '#f2d25a'
    m = man('Smuggler', 384, w=0.96, skin='#9aa8a8', top='#3a3040', pants='#2a2a30', slump=0.3, jaw=0.25, eye='#fffbe0', gaunt=0.96, teeth=(6, 4), torn=(0.0, 0.0), sleeve_to=(0.9, 0.9), curl=(0.9, 0.9),
            pose=dict(L=((-70, 276), (-58, 318), 70), R=((62, 250), (64, 196), -86)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    keg = part('Smuggler_Prop', PROP, (-58 * k, 290 * k), 0.5)
    S(keg, q(k, [(-102, 318), (-72, 334), (-42, 320), (-38, 270), (-56, 248), (-90, 250), (-106, 276)]), '#6a4a2e')
    for y in (312, 290, 266):
        keg.flat(q(k, [(-106, y), (-38, y + 4), (-38, y - 2), (-106, y - 6)]), '#33363c', smooth=False)
    for (x, y) in ((-96, 244), (-84, 238), (-70, 242), (-60, 250), (-90, 232)):
        keg.flat(ellipse(x * k, y * k, 5 * k, 5 * k, n=10), gold); keg.flat(ellipse((x - 1) * k, (y + 1) * k, 2.2 * k, 2.2 * k, n=8), '#fff3b0')
    m.extra.append(keg)
    b.clipped(td, q(k, [(-60, 318), (-40, 328), (30, 250), (20, 244)]), '#4a3226', smooth=False)
    for i in range(5):
        b.clipped(td, ellipse(4 * k, (316 - i * 16) * k, 2.4 * k, 2.4 * k, n=8), gold)
    h.clipped(m.hd, [(X(-22), Y(24)), (X(22), Y(24)), (X(19), Y(-6)), (X(-19), Y(-6))], '#2a2a30', smooth=False)                                   # a muffler up over the mouth
    P(h, [(X(-30), Y(44)), (X(0), Y(40)), (X(30), Y(44)), (X(20), Y(62)), (X(0), Y(56)), (X(-20), Y(62))], '#1c1a20'); h.flat([(X(-20), Y(62)), (X(0), Y(56)), (X(20), Y(62)), (X(0), Y(66))], '#2a2630', smooth=False)   # a cocked hat
    c = m.aR.hand_c   # a dark lantern
    m.aR.flat(path_limb([(c[0], c[1] - 2 * k), (c[0], c[1] - 14 * k)], [1.2 * k, 1.2 * k], n_end=3), '#5a5e66'); P(m.aR, [(c[0] - 9 * k, c[1] - 14 * k), (c[0] + 9 * k, c[1] - 14 * k), (c[0] + 9 * k, c[1] - 42 * k), (c[0] - 9 * k, c[1] - 42 * k)], '#1c1a20'); m.aR.flat(rect(c[0] - 2 * k, c[1] - 38 * k, c[0] + 7 * k, c[1] - 18 * k), OIL, smooth=False)
    return m.parts()


# ================================================================== BOSS 1. THE HARBOURMASTER: nothing docked without his say. Nothing leaves without it either.
def harbourmaster():
    m = man('Harbourmaster', 500, w=1.42, hw=1.08, skin='#9aa8a8', top='#1c2a44', pants='#e8e2d0', boot='#0e0d10', leg_bulk=1.5, foot_w=1.3, stance=(34, 38, 38), belly=0.45, chest=1.08,
            jaw=0.4, eye=SEA_L, gaunt=1.08, teeth=(6, 4), brow=1.6, sleeve_to=(0.9, 0.9), arm_bulk=1.6, hr=10.5, curl=(0.9, 0.9), belt=None, torn=(0, 0),
            pose=dict(L=((-90, 250), (-96, 190), -94), R=((96, 262), (108, 314), 86)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    coat_skirts(b, k, '#1c2a44', w=58, flare=74, bottom=130)
    b.clipped(td, q(k, [(-14, 331), (14, 331), (8, 250), (-8, 250)]), '#e8e2d0', smooth=False)
    for s in (-1, 1):
        b.clipped(td, q(k, [(s * 14, 331), (s * 30, 328), (s * 16, 250), (s * 8, 250)]), '#c8322a', smooth=False)
        for i in range(5):
            b.clipped(td, ellipse(s * 36 * k, (310 - i * 18) * k, 3 * k, 3 * k, n=8), BRASS)
        b.clipped(td, q(k, [(s * 40, 334), (s * 86, 326), (s * 90, 312), (s * 40, 320)]), BRASS, smooth=False); spikes(b, [((s * (48 + j * 9)) * k, 314 * k, 14 * k, 2.2 * k, -90) for j in range(5)], BRASS)
    _barnacles(b, td, [(-50, 280, 6), (-42, 268, 4), (56, 240, 6)], k); wound(b, td, (30 * k, 286 * k), 12 * k, seed=5)
    for s in (-1, 1):
        S(h, [(X(s * 14), Y(30)), (X(s * 23), Y(28)), (X(s * 26), Y(4)), (X(s * 16), Y(-10)), (X(s * 12), Y(6))], '#c8c8c0')                          # whiskers
    P(h, [(X(-36), Y(44)), (X(0), Y(38)), (X(36), Y(44)), (X(22), Y(66)), (X(0), Y(58)), (X(-22), Y(66))], '#1c2a44'); h.flat([(X(-34), Y(46)), (X(0), Y(40)), (X(34), Y(46)), (X(0), Y(44))], BRASS, smooth=False); h.flat(ellipse(X(0), Y(54), 4 * u, 4 * u, n=8), BRASS)   # a bicorne
    c = m.aR.hand_c   # a boat hook the length of a mast
    m.aR.flat(path_limb([(c[0] + 4 * k, c[1] - 240 * k), (c[0] - 2 * k, c[1] + 110 * k)], [3.6 * k, 3.2 * k], n_end=4), '#4a3626')
    m.aR.flat(path_limb([(c[0] - 2 * k, c[1] + 106 * k), (c[0] - 4 * k, c[1] + 146 * k)], [2.8 * k, 0.8 * k], n_end=3), '#8a8f99'); m.aR.flat(path_limb([(c[0] - 2 * k, c[1] + 112 * k), (c[0] + 20 * k, c[1] + 128 * k), (c[0] + 28 * k, c[1] + 108 * k), (c[0] + 18 * k, c[1] + 98 * k)], [2.8 * k, 2.6 * k, 2 * k, 0.7 * k], n_end=3), '#8a8f99')
    c = m.aL.hand_c
    m.aL.flat(path_limb([(c[0], c[1] + 6 * k), (c[0], c[1] - 16 * k)], [3 * k, 3 * k], n_end=3), '#4a3626'); P(m.aL, [(c[0] - 8 * k, c[1] - 16 * k), (c[0] + 8 * k, c[1] - 16 * k), (c[0] + 20 * k, c[1] - 52 * k), (c[0] - 20 * k, c[1] - 52 * k)], BRASS)
    return m.parts()


# ================================================================== BOSS 2. THE NET-MENDER: she mended for every boat on the wharf. She is mending still.
def net_mender():
    m = man('NetMender', 500, w=0.9, hw=0.98, skin='#9aa8a0', top='#3a4640', pants='#3a4640', slump=0.9, chest=0.98, jaw=0.5, eye=SEA_L, gaunt=0.88, teeth=(6, 4), hair=('long', '#c8c8c0'),
            sleeve_to=(0.8, 0.8), claw='#1e2428', curl=(0.2, 0.4), arm_bulk=0.86, hr=8, belt=None, pose=dict(L=((-68, 262), (-92, 210), -110), R=((70, 262), (94, 214), -70)),
            gown=dict(col='#3a4640', top=240, hem_w=70, rag=9, seed=11))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    b.clipped(td, q(k, [(-46, 331), (46, 331), (36, 290), (0, 304), (-36, 290)]), '#5a4a5a', smooth=False)
    net = part('NetMender_Prop', PROP, (0, 210 * k), 3.5)                                                                                         # the net, hand to hand and down to the ground
    for i in range(9):
        x0 = -92 + i * 23; net.flat(path_limb(q(k, [(x0, 214 - abs(i - 4) * 4), (x0 + (i - 4) * 4, 110), (x0 + (i - 4) * 9, 10)]), [0.9 * k] * 3, n_end=2), '#a89a70')
    for j in range(8):
        y = 196 - j * 24; wd = 96 + j * 5; net.flat(path_limb(q(k, [(-wd, y), (0, y - 10), (wd, y)]), [0.9 * k] * 3, n_end=2), '#a89a70')
    for (x, y) in ((-60, 120), (40, 80), (-20, 40), (70, 150)):
        net.flat(ellipse(x * k, y * k, 5 * k, 5 * k, n=8), '#6a8a8a'); net.flat(ellipse(x * k, y * k, 2.4 * k, 2.4 * k, n=6), SEA)                     # glass floats
    net.flat(q(k, [(10, 60), (30, 70), (36, 52), (18, 46)]), '#d8d0b8', smooth=False)
    m.extra.append(net)
    _barnacles(b, td, [(-30, 270, 4), (26, 256, 4)], k)
    S(h, [(X(-24), Y(52)), (X(-30), Y(20)), (X(-26), Y(-20)), (X(26), Y(-20)), (X(30), Y(20)), (X(24), Y(52)), (X(16), Y(40)), (X(18), Y(4)), (X(-18), Y(4)), (X(-16), Y(40))], '#5a4a5a')   # a shawl over the head
    c = m.aR.hand_c
    m.aR.flat(path_limb([(c[0] - 4 * k, c[1] + 10 * k), (c[0] + 10 * k, c[1] - 60 * k)], [1.8 * k, 0.6 * k], n_end=2), '#e8e2d0')                    # the needle: whalebone, a foot long
    return m.parts()


# ================================================================== BOSS 3. THE KEEPER: the lamp went out the night they needed it. He has not let it go out since.
def keeper():
    m = man('Keeper', 560, w=0.92, hw=1.0, skin='#9aa8a8', top=OIL, pants='#2a3040', boot='#0e0d10', slump=0.3, chest=1.0, jaw=0.0, eye=None, teeth=(0, 0), ears=False, gaunt=0.9,
            sleeve_to=(0.92, 0.92), curl=(0.9, 0.9), arm_bulk=0.92, hr=8, belt=None, torn=(0, 0), pose=dict(L=((-62, 250), (-66, 194), -94), R=((70, 264), (80, 316), 86)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    coat_skirts(b, k, OIL, w=44, flare=56, bottom=90, split=196)
    for i in range(5):
        b.clipped(td, ellipse(6 * k, (314 - i * 18) * k, 2.6 * k, 2.6 * k, n=8), '#2a2420')
    b.clipped(td, q(k, [(-2, 331), (2, 331), (2, 236), (-2, 236)]), shade(OIL, 0.7), smooth=False); _barnacles(b, td, [(-34, 286, 5), (36, 250, 5)], k)
    # where his head was, the lamp: brass cage, the glass, the light
    h.clipped(m.hd, [(X(-40), Y(80)), (X(40), Y(80)), (X(40), Y(-10)), (X(-40), Y(-10))], shade(OIL, 0.6), smooth=False)
    P(h, [(X(-24), Y(0)), (X(24), Y(0)), (X(20), Y(8)), (X(-20), Y(8))], BRASS)
    gl = S(h, [(X(-19), Y(8)), (X(19), Y(8)), (X(19), Y(52)), (X(-19), Y(52))], '#ffe27a', smooth=False)
    h.clipped(gl, ellipse(X(0), Y(30), 12 * u, 18 * u, n=14), '#fff6c8'); h.clipped(gl, ellipse(X(0), Y(30), 5 * u, 9 * u, n=10), '#ffffff')
    for x in (-19, -9.5, 0, 9.5, 19):
        h.flat(rect(X(x - 1.2), Y(8), X(x + 1.2), Y(52)), BRASS, smooth=False)
    P(h, [(X(-24), Y(52)), (X(24), Y(52)), (X(12), Y(70)), (X(-12), Y(70))], BRASS); h.flat(ellipse(X(0), Y(74), 4.4 * u, 4.4 * u, n=8), BRASS)
    c = m.aL.hand_c
    m.aL.flat(path_limb([(c[0], c[1] - 4 * k), (c[0], c[1] - 18 * k)], [1.4 * k, 1.4 * k], n_end=3), '#5a5e66'); P(m.aL, [(c[0] - 8 * k, c[1] - 18 * k), (c[0] + 8 * k, c[1] - 18 * k), (c[0] + 12 * k, c[1] - 60 * k), (c[0] - 12 * k, c[1] - 60 * k)], '#6a3a2a')   # the oil can
    m.aL.flat(path_limb([(c[0] + 8 * k, c[1] - 50 * k), (c[0] + 30 * k, c[1] - 30 * k)], [2 * k, 1 * k], n_end=3), '#6a3a2a')
    c = m.aR.hand_c
    m.aR.flat(path_limb([(c[0] - 2 * k, c[1] - 30 * k), (c[0] + 4 * k, c[1] + 80 * k)], [2.6 * k, 2.6 * k], n_end=3), '#4a3626'); m.aR.flat(ellipse(c[0] + 4 * k, c[1] + 90 * k, 9 * k, 12 * k, n=10), '#ffb04a'); m.aR.flat(ellipse(c[0] + 4 * k, c[1] + 92 * k, 4 * k, 6 * k, n=8), '#fff0b0')   # a lit taper
    return m.parts()


# ================================================================== BOSS 4. CAPTAIN GRAVES: master of the Providence. He went down with her and brought her back.
def captain():
    m = man('Captain', 620, w=1.05, hw=1.0, skin='#8fa4a8', top='#2a1c2a', pants='#2a2a30', boot='#0e0d10', slump=0.3, chest=1.06, jaw=0.6, eye=SEA_L, gaunt=0.9, teeth=(7, 5), brow=1.6,
            sleeve_to=(0.9, 0.9), curl=(0.9, 0.2), arm_bulk=1.05, hr=9.5, belt=None, torn=(0, 0.0), pose=dict(L=((-70, 252), (-76, 198), -94), R=((76, 264), (92, 318), 84)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    coat_skirts(b, k, '#2a1c2a', w=50, flare=72, bottom=80, split=196)
    b.clipped(td, q(k, [(-12, 331), (12, 331), (8, 246), (-8, 246)]), '#c8c2b0', smooth=False)
    for s in (-1, 1):
        b.clipped(td, q(k, [(s * 12, 331), (s * 34, 328), (s * 20, 246), (s * 8, 246)]), '#4a2a4a', smooth=False)
        for i in range(5):
            b.clipped(td, ellipse(s * 30 * k, (312 - i * 16) * k, 2.6 * k, 2.6 * k, n=8), BRASS)
    b.flat(q(k, [(-56, 244), (56, 236), (56, 226), (-56, 234)]), '#7a2a26', smooth=False); _barnacles(b, td, [(-40, 290, 6), (44, 270, 5), (-30, 256, 4)], k)
    _weedy = [(-46, 326, 70), (40, 326, 90), (52, 320, 50)]
    for i, (x, y, l) in enumerate(_weedy):
        b.flat(path_limb(q(k, [(x, y), (x + 3, y - l * 0.5), (x - 2, y - l)]), [2.6 * k, 2 * k, 0.7 * k], n_end=3), '#2e5a4a')
    S(h, [(X(-13), Y(8)), (X(-17), Y(-14)), (X(-8), Y(-40)), (X(0), Y(-28)), (X(7), Y(-46)), (X(16), Y(-12)), (X(13), Y(8)), (X(6), Y(-2)), (X(0), Y(0)), (X(-6), Y(-2))], '#3a3a40')
    P(h, [(X(-40), Y(44)), (X(-20), Y(40)), (X(0), Y(46)), (X(20), Y(40)), (X(40), Y(44)), (X(26), Y(70)), (X(0), Y(62)), (X(-26), Y(70))], '#1c1a20'); h.flat([(X(-38), Y(46)), (X(-20), Y(42)), (X(0), Y(48)), (X(20), Y(42)), (X(38), Y(46)), (X(0), Y(52))], BRASS, smooth=False)   # a tricorne, salt-white at the edges
    h.clipped(m.hd, [(X(2), Y(40)), (X(18), Y(40)), (X(17), Y(24)), (X(4), Y(24))], '#1c1a20', smooth=False); h.clipped(m.hd, [(X(-22), Y(44)), (X(22), Y(36)), (X(22), Y(33)), (X(-22), Y(41))], '#1c1a20', smooth=False)     # a patch
    c = m.aL.hand_c   # the hook
    m.aL.flat(ellipse(c[0], c[1], 11 * k, 11 * k, n=12), BRASS); m.aL.flat(path_limb([(c[0], c[1] - 6 * k), (c[0], c[1] - 30 * k), (c[0] + 16 * k, c[1] - 44 * k), (c[0] + 26 * k, c[1] - 30 * k), (c[0] + 22 * k, c[1] - 18 * k)], [3.4 * k, 3.2 * k, 3 * k, 2.4 * k, 0.8 * k], n_end=3), '#aeb2ba')
    c = m.aR.hand_c   # the cutlass
    m.aR.flat(path_limb([(c[0], c[1] - 12 * k), (c[0], c[1] + 10 * k)], [3.4 * k, 3.4 * k], n_end=3), '#2a2420'); m.aR.flat(path_limb([(c[0] - 14 * k, c[1] + 8 * k), (c[0] + 12 * k, c[1] + 14 * k), (c[0] + 14 * k, c[1] - 10 * k)], [2 * k, 2.4 * k, 1.6 * k], n_end=3), BRASS)
    m.aR.flat([(c[0] - 7 * k, c[1] + 12 * k), (c[0] + 7 * k, c[1] + 14 * k), (c[0] + 20 * k, c[1] + 90 * k), (c[0] + 34 * k, c[1] + 138 * k), (c[0] + 10 * k, c[1] + 104 * k)], '#c9cdd6', smooth=False)
    return m.parts()


# ================================================================== BOSS 5. THE HANGMAN: the wharf is named for his work.
def hangman():
    rope = '#a89060'
    m = man('Hangman', 630, w=1.45, hw=1.06, skin='#8fa0a0', top='#8fa0a0', pants='#1c1a20', boot='#0e0d10', leg_bulk=1.45, foot_w=1.3, stance=(34, 38, 38), belly=0.45, chest=1.12,
            jaw=0.0, eye=None, teeth=(0, 0), ears=False, gaunt=1.1, sleeve=False, arm_bulk=1.6, hr=10.5, curl=(0.9, 0.9), belt='#3a2a20', torn=(0, 0),
            sh=(76, 314), pose=dict(L=((-106, 262), (-116, 204), -100), R=((106, 262), (128, 300), 70)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    for side in (-1, 1):   # a gibbet arm behind each shoulder, and what hangs from it
        pr = part('Hangman_Prop%s' % ('L' if side < 0 else 'R'), PROP, (side * 70 * k, 318 * k), 0.5)
        pr.flat(path_limb(q(k, [(side * 60, 300), (side * 76, 420), (side * 190, 440)]), [7 * k, 6 * k, 5 * k], n_end=3), '#3a2a20'); pr.flat(path_limb(q(k, [(side * 78, 380), (side * 120, 432)]), [3.4 * k, 3.4 * k], n_end=3), '#3a2a20')
        for i, x in enumerate((110, 146, 182)):
            l = 60 + (i * 37) % 50
            pr.flat(path_limb(q(k, [(side * x, 436), (side * x, 436 - l)]), [1.6 * k, 1.6 * k], n_end=2), rope)
            ring = [(side * x * k + math.cos(t / 14 * 6.283) * 12 * k, (420 - l) * k + math.sin(t / 14 * 6.283) * 16 * k) for t in range(15)] + [(side * x * k + math.cos(t / 14 * 6.283) * 8 * k, (420 - l) * k + math.sin(t / 14 * 6.283) * 12 * k) for t in range(14, -1, -1)]
            pr.flat(ring, rope, smooth=False)
        m.extra.append(pr)
    cav = b.clipped(td, q(k, [(-30, 312), (30, 312), (36, 272), (26, 244), (-26, 244), (-36, 272)]), '#0e1a1c', smooth=False)
    b.clipped(cav, ellipse(-3 * k, 280 * k, 13 * k, 15 * k, n=10), SEA); b.clipped(cav, ellipse(-4 * k, 283 * k, 6 * k, 7 * k, n=8), SEA_L)
    for s in (-1, 1):
        for i in range(5):
            y = 308 - i * 14; b.clipped(td, path_limb(q(k, [(s * 3, y), (s * 22, y - 3), (s * 38, y - 14)]), [2.6 * k, 2.4 * k, 1.6 * k], n_end=3), '#d9cfb8')
    b.clipped(td, q(k, [(-2.6, 318), (2.6, 318), (2.2, 248), (-2.2, 248)]), '#d9cfb8', smooth=False)
    for i in range(4):   # rope, wound round and round the waist
        b.clipped(td, q(k, [(-80, 236 - i * 9), (80, 232 - i * 9), (80, 226 - i * 9), (-80, 230 - i * 9)]), rope if i % 2 else shade(rope, 0.8), smooth=False)
    b.flat(q(k, [(-52, 204), (52, 204), (64, 110), (36, 96), (18, 160), (0, 180), (-18, 160), (-36, 96), (-64, 110)]), '#1c1a20', smooth=False)
    _barnacles(b, td, [(-56, 296, 6), (58, 282, 6), (-48, 262, 4)], k)
    # the hood: black, two holes, a rope still round the neck
    hood = [(X(0), Y(70)), (X(16), Y(66)), (X(26), Y(48)), (X(27), Y(20)), (X(32), Y(-14)), (X(18), Y(-22)), (X(0), Y(-16)), (X(-18), Y(-22)), (X(-32), Y(-14)), (X(-27), Y(20)), (X(-26), Y(48)), (X(-16), Y(66))]
    hd2 = P(h, hood, '#17151b')
    for s in (-1, 1):
        h.clipped(hd2, [(X(s * 4), Y(36)), (X(s * 15), Y(38)), (X(s * 14), Y(27)), (X(s * 6), Y(26))], '#000000', smooth=False); h.clipped(hd2, ellipse(X(s * 9.6), Y(31), 2.2 * u, 2.2 * u, n=8), SEA_L)
    h.clipped(hd2, [(X(10), Y(66)), (X(28), Y(44)), (X(27), Y(18)), (X(16), Y(44))], '#221f29', smooth=False, opacity=0.7)
    for i in range(3):
        h.flat([(X(-20), Y(-6 - i * 5)), (X(20), Y(-8 - i * 5)), (X(20), Y(-12 - i * 5)), (X(-20), Y(-10 - i * 5))], rope if i % 2 else shade(rope, 0.8), smooth=False)
    h.flat(path_limb([(X(14), Y(-16)), (X(18), Y(-50)), (X(12), Y(-80))], [2.2 * u, 2 * u, 1.4 * u], n_end=3), rope)
    c = m.aL.hand_c   # the anchor, on its chain
    for j in range(5):
        m.aL.flat(ellipse(c[0], c[1] - (8 + j * 10) * k, (3.2 if j % 2 else 4.6) * k, (5.4 if j % 2 else 4) * k, n=8), '#6a6e76' if j % 2 else '#8a8f99')
    y = c[1] - 60 * k
    m.aL.flat(path_limb([(c[0], y), (c[0], y - 90 * k)], [4 * k, 4.6 * k], n_end=3), '#3a3e46'); m.aL.flat(path_limb([(c[0] - 44 * k, y - 60 * k), (c[0] - 30 * k, y - 86 * k), (c[0], y - 96 * k), (c[0] + 30 * k, y - 86 * k), (c[0] + 44 * k, y - 60 * k)], [1 * k, 4.4 * k, 6 * k, 4.4 * k, 1 * k], n_end=3), '#3a3e46')
    m.aL.flat(rect(c[0] - 22 * k, y - 16 * k, c[0] + 22 * k, y - 10 * k), '#3a3e46', smooth=False)
    c = m.aR.hand_c   # and a noose, ready
    m.aR.flat(path_limb([(c[0], c[1] + 10 * k), (c[0] + 4 * k, c[1] - 30 * k)], [2 * k, 2 * k], n_end=2), rope)
    ring = [(c[0] + 4 * k + math.cos(t / 16 * 6.283) * 18 * k, c[1] - 52 * k + math.sin(t / 16 * 6.283) * 24 * k) for t in range(17)] + [(c[0] + 4 * k + math.cos(t / 16 * 6.283) * 13 * k, c[1] - 52 * k + math.sin(t / 16 * 6.283) * 19 * k) for t in range(16, -1, -1)]
    m.aR.flat(ring, rope, smooth=False)
    return m.parts()


ROSTER = [
    ('Deckhand', deckhand), ('Rigger', rigger), ('Crab', crab), ('Cook', cook), ('Harpooner', harpooner), ('Gull', gull), ('Rat', rat), ('Diver', diver), ('Smuggler', smuggler),
    ('Harbourmaster', harbourmaster), ('NetMender', net_mender), ('Keeper', keeper), ('Captain', captain), ('Hangman', hangman),
]
