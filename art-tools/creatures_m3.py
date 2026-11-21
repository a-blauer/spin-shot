"""Mourning Bayou: the drowned, what the water bred, and the mother of the lagoon."""
from kit2 import *   # noqa: F401,F403

WEED, WEED_D, MUD, WISP = '#4a6a3a', '#2e4a2a', '#3a3226', '#b6f06a'


def _weed(p, pts, k=1.0, col=WEED):
    """Strands of water weed hanging from (x, y) down `l`."""
    for i, (x, y, l) in enumerate(pts):
        p.flat(path_limb([(x * k, y * k), ((x + (3 if i % 2 else -3)) * k, (y - l * 0.5) * k), ((x + (i % 3 - 1) * 2) * k, (y - l) * k)], [2.6 * k, 2 * k, 0.7 * k], n_end=3), col if i % 2 else WEED_D)


def _oval(cx, cy, rx, ry, ang, n=16):
    a = math.radians(ang); out = []
    for i in range(n):
        t = i / n * 6.283; x, y = math.cos(t) * rx, math.sin(t) * ry
        out.append((cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a)))
    return out


# ================================================================== 1. THE DROWNED: came up out of the lagoon with the weed still on him.
def drowned():
    m = man('Drowned', 400, skin='#8fa89a', top='#6a705e', pants='#3e4638', slump=0.7, jaw=0.6, eye='#d8f0c0', hair=('thin', '#2a3a2a'), gaunt=1.06, torn=(0.4, 0.2), sleeve_to=(0.4, 0.55), curl=(0.3, 0.25), bare_feet=True,
            pose=dict(L=((-60, 246), (-68, 192), -98), R=((62, 250), (60, 196), -84)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    b.clipped(td, q(k, [(14, 332), (23, 332), (32, 234), (23, 234)]), '#4a4034', smooth=False)                                               # one brace left
    tear = b.clipped(td, q(k, [(-44, 314), (-8, 318), (-4, 262), (-28, 244), (-46, 268)]), '#8fa89a', smooth=False)
    for (x, y, r) in ((-30, 296, 8), (-18, 272, 6), (24, 282, 7)):
        b.clipped(td, ellipse(x * k, y * k, r * k, r * 0.8 * k, n=8), '#b8c8b0', opacity=0.8)                                                # bloat
    b.clipped(td, rect(-90 * k, 170 * k, 90 * k, 206 * k), MUD, smooth=False, opacity=0.85)
    _weed(b, [(-46, 322, 60), (-30, 326, 40), (36, 324, 74), (48, 318, 46), (8, 330, 30)], k)
    _weed(h, [(X(-14) / 1, Y(52), 30 * u), (X(6), Y(56), 22 * u), (X(16), Y(50), 36 * u)])
    for a in (m.aL, m.aR):
        c = a.hand_c; _weed(a, [(c[0] / k + 2, c[1] / k + 30, 40)], k)
    return m.parts()


# ================================================================== 2. MUDSKIPPER: caked to the chest, quick across soft ground.
def mudskipper():
    m = man('Mudskipper', 380, w=0.9, skin='#7a8a6a', top='#7a8a6a', pants=MUD, slump=0.2, jaw=1.0, eye='#ffffff', gaunt=0.88, teeth=(7, 6), torn=(0, 0), bare_feet=True,
            sleeve=False, claw='#2a2218', curl=(0.0, 0.0), belt=None, pose=dict(L=((-86, 262), (-112, 300), 120), R=((84, 268), (106, 316), 62)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    ribs(b, td, m.F, shade('#7a8a6a', 0.56), n=5, op=0.8)
    b.clipped(td, q(k, [(-90, 170), (90, 170), (90, 262), (40, 276), (10, 258), (-22, 280), (-56, 264), (-90, 276)]), MUD, smooth=False)       # the mud line
    for (x, y, r) in ((-30, 300, 7), (22, 310, 5), (40, 292, 6)):
        b.clipped(td, ellipse(x * k, y * k, r * k, r * 0.7 * k, n=7), MUD)
    h.clipped(m.hd, [(X(-24), Y(-10)), (X(24), Y(-10)), (X(24), Y(14)), (X(8), Y(20)), (X(-10), Y(12)), (X(-24), Y(22))], MUD, smooth=False)
    for a in (m.aL, m.aR):
        c = a.hand_c; a.flat(ellipse(c[0], c[1], 10 * k, 10 * k, n=10), MUD, opacity=0.9)
    spikes(h, [(X(-10), Y(56), 26 * u, 1.6 * u, 100), (X(2), Y(57), 34 * u, 1.6 * u, 86), (X(12), Y(55), 22 * u, 1.4 * u, 70)], '#8a9a4a')                # reeds stuck in what hair is left
    return m.parts()


# ================================================================== 3. GATOR: twelve feet of it, most of that mouth.
def gator():
    cn = 'Gator'
    hide, dark, belly = '#4e5e3a', '#36422a', '#b8b88a'
    b = part(cn + '_Body', BODY, (0, 60), 1)
    b.flat(path_limb([(50, 86), (120, 104), (176, 80), (196, 40)], [24, 18, 11, 3], n_end=4), dark)                                             # the tail, coming round
    spikes(b, [(110 + i * 20, 118 - i * 9, 14, 6, 80 - i * 12) for i in range(4)], hide)
    td = S(b, M([(0, 124), (40, 120), (80, 98), (90, 66), (72, 42), (0, 36)]), hide)
    b.clipped(td, M([(0, 62), (50, 60), (64, 46), (0, 36)]), belly)
    for r in range(3):
        for i in range(-3, 4):
            b.clipped(td, [(i * 22 - 8 + (r % 2) * 11, 112 - r * 16), (i * 22 + 8 + (r % 2) * 11, 112 - r * 16), (i * 22 + (r % 2) * 11, 100 - r * 16)], dark, smooth=False)
    spikes(b, [(x, 122 - abs(x) * 0.1, 15, 7, 90) for x in (-48, -24, 0, 24, 48)], dark)
    parts = [b]
    h = part(cn + '_Head', HEAD, (0, 70), 2)
    S(h, M([(0, 76), (46, 78), (54, 58), (36, 44), (0, 42)]), dark)                                                                            # the lower jaw
    h.flat(M([(0, 80), (44, 80), (46, 66), (0, 62)]), '#5a1418'); h.flat(M([(0, 70), (22, 68), (26, 58), (0, 54)]), '#b85a5a')
    spikes(h, [(x, 62, 10, 3, 90) for x in (-40, -30, -20, -10, 10, 20, 30, 40)], BONE)
    hd = S(h, M([(0, 130), (30, 128), (52, 114), (60, 94), (50, 80), (0, 78)]), hide)
    spikes(h, [(x, 80, 13 if abs(x) in (36, 14) else 9, 3.2, -90) for x in (-46, -36, -25, -14, -4, 4, 14, 25, 36, 46)], BONE)
    for s in (-1, 1):
        S(h, ellipse(s * 30, 130, 13, 11, n=12), hide); h.flat(ellipse(s * 30, 131, 8, 6.4, n=10), '#d8c84a'); h.flat(ellipse(s * 30, 131, 1.6, 6, n=6), INK)
        h.clipped(hd, ellipse(s * 9, 88, 4, 2.6, n=8), INK)
        for j in range(3):
            h.clipped(hd, [(s * (16 + j * 12) - 6, 112 - j * 6), (s * (16 + j * 12) + 6, 112 - j * 6), (s * (16 + j * 12), 104 - j * 6)], dark, smooth=False)
    parts.append(h)
    for side in (-1, 1):
        role = ARM_F if side > 0 else ARM_B
        a = part('%s_%s' % (cn, role), role, (side * 62, 72), 3)
        S(a, path_limb([(side * 60, 76), (side * 108, 70), (side * 116, 16)], [17, 13, 9]), hide)
        a.flat(ellipse(side * 118, 8, 16, 8, n=10), hide); spikes(a, [(side * 118 + j * 8, 6, 12, 2.4, -90 + j * 16 * 1) for j in (-1.5, -0.5, 0.5, 1.5)], '#1c1614')
        parts.append(a)
    return parts


# ================================================================== 4. BOG BLOAT: marsh gas under the skin, toadstools on top.
def bog_bloat():
    cn = 'BogBloat'; F = fig(440, w=1.22); k = F['k']
    skin, cloth = '#7a8a5a', '#3e4638'
    parts = [leg2(cn, -1, F, cloth, skin, torn=0.4, bulk=1.5, hip=(-34 * k, 196 * k), knee=(-40 * k, 104 * k), ank=(-42 * k, 16 * k), foot_w=1.2, bare_foot=True), leg2(cn, 1, F, cloth, skin, torn=0.6, bulk=1.5, hip=(34 * k, 196 * k), knee=(40 * k, 104 * k), ank=(42 * k, 16 * k), foot_w=1.2, bare_foot=True)]
    b, td = body(cn, F, skin, half=[(0, 331), (9, 331), (28, 326), (46, 319), (52, 304), (56, 284), (66, 262), (78, 240), (82, 218), (76, 198), (60, 186), (40, 181), (0, 179)])
    win = b.clipped(td, ellipse(4 * k, 236 * k, 46 * k, 40 * k, n=18), '#a8b86a')                                                              # the skin of the belly has gone thin as a lamp
    b.clipped(td, ellipse(4 * k, 232 * k, 34 * k, 28 * k, n=16), '#d6de6a', opacity=0.7)
    for (x, y, a) in ((-14, 244, 20), (16, 230, -30), (0, 218, 80), (24, 250, 60), (-22, 224, -50)):   # and things swim in it
        b.clipped(td, _oval(x * k, y * k, 9 * k, 2.6 * k, a, 8), '#2a2218')
    for (x, y, r) in ((-58, 280, 9), (56, 290, 7), (-66, 228, 8)):
        b.clipped(td, ellipse(x * k, y * k, r * k, r * k, n=10), '#5a6a3a')
    b.clipped(td, q(k, [(-140, 170), (140, 170), (140, 198), (60, 190), (0, 186), (-60, 190), (-140, 198)]), cloth, smooth=False)
    for (x, y, s) in ((-52, 322, 1.0), (-36, 330, 0.7), (48, 324, 0.9), (60, 314, 0.6)):   # toadstools on the shoulders
        b.flat(rect((x - 2 * s) * k, y * k, (x + 2 * s) * k, (y + 14 * s) * k), '#d8d0b0', smooth=False); b.flat([((x - 11 * s) * k, (y + 13 * s) * k), (x * k, (y + 24 * s) * k), ((x + 11 * s) * k, (y + 13 * s) * k)], '#b8402a'); b.flat(ellipse((x - 3 * s) * k, (y + 17 * s) * k, 1.6 * s * k, 1.6 * s * k, n=6), '#f2ead0')
    parts.append(b)
    h, hd, L = skull(cn, F, skin, jaw=0.4, eye=WISP, hair=None, gaunt=1.12, teeth=(5, 4))
    X, Y, u = L['X'], L['Y'], L['u']
    hat(h, X(0), Y(49), 19 * u, 12 * u, 42 * u, '#b8a060', band='#6a5a30', brim_h=6 * u, taper=0.7, dent=0.1)
    spikes(h, [(X(-40), Y(49), 8 * u, 3 * u, 200), (X(40), Y(48), 9 * u, 3 * u, -20), (X(-30), Y(44), 7 * u, 2.4 * u, 250)], '#b8a060')
    parts.append(h)
    parts.append(arm2(cn, -1, F, skin, sh=(-54 * k, 312 * k), el=(-86 * k, 254 * k), wr=(-106 * k, 200 * k), bulk=1.3, hand_ang=-104, curl=0.25, hr=8.4 * k))
    parts.append(arm2(cn, 1, F, skin, sh=(54 * k, 312 * k), el=(86 * k, 254 * k), wr=(104 * k, 198 * k), bulk=1.3, hand_ang=-76, curl=0.25, hr=8.4 * k))
    return parts


# ================================================================== 5. ANGLER: still fishing. The hooks are for you.
def angler():
    m = man('Angler', 410, w=0.92, skin='#8a9a80', top='#5a5e48', pants='#3a3a30', slump=0.4, jaw=0.3, eye='#d8f0c0', gaunt=0.92, torn=(0.3, 0.0), sleeve_to=(0.6, 0.6), curl=(0.5, 0.9),
            pose=dict(L=((-62, 246), (-62, 194), -92), R=((70, 262), (60, 318), 100)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    b.clipped(td, q(k, [(-52, 322), (-40, 330), (44, 236), (32, 228)]), '#4a4034', smooth=False)
    cr = part('Angler_Prop', PROP, (40 * k, 226 * k), 3.5)                                                                                    # the creel on his hip
    P(cr, q(k, [(26, 232), (60, 232), (64, 196), (22, 196)]), '#a89060')
    for i in range(4):
        cr.flat(q(k, [(22, 224 - i * 8), (64, 224 - i * 8), (64, 222 - i * 8), (22, 222 - i * 8)]), '#7a6840', smooth=False)
    cr.flat(_oval(44 * k, 240 * k, 14 * k, 5 * k, 20, 10), '#8fa8b0'); cr.flat(q(k, [(54, 244), (64, 252), (62, 238)]), '#8fa8b0', smooth=False)
    m.extra.append(cr)
    for (x, y) in ((-30, 300), (24, 280), (-12, 262)):   # hooks set in him, where he practised
        b.clipped(td, path_limb(q(k, [(x, y + 6), (x, y - 4), (x + 5, y - 7), (x + 7, y - 1)]), [0.9 * k] * 4, n_end=2), '#c9cdd6')
    hat(h, X(0), Y(49), 18 * u, 13 * u, 44 * u, '#b8a060', band='#4a4034', brim_h=6.5 * u, taper=0.72, dent=0.0)
    c = m.aR.hand_c   # the cane pole, and the hook swinging off it
    m.aR.flat(path_limb([(c[0] + 8 * k, c[1] - 40 * k), (c[0] - 6 * k, c[1] + 60 * k), (c[0] - 40 * k, c[1] + 170 * k)], [3 * k, 2.4 * k, 1 * k], n_end=3), '#a89060')
    m.aR.flat(path_limb([(c[0] - 40 * k, c[1] + 170 * k), (c[0] - 70 * k, c[1] + 110 * k), (c[0] - 78 * k, c[1] + 50 * k)], [0.6 * k] * 3, n_end=2), '#d8d8d0')
    m.aR.flat(path_limb([(c[0] - 78 * k, c[1] + 50 * k), (c[0] - 78 * k, c[1] + 30 * k), (c[0] - 68 * k, c[1] + 24 * k), (c[0] - 62 * k, c[1] + 36 * k)], [1.8 * k, 1.8 * k, 1.6 * k, 0.6 * k], n_end=3), '#c9cdd6')
    return m.parts()


# ================================================================== 6. SKEETER: the size of a heron and it has already fed.
def skeeter():
    cn = 'Skeeter'
    dk, blood, wingc = '#2a2a26', '#a8242a', '#c8d8d0'
    t = part(cn + '_Tail', TAIL, (0, 96), 0)
    for s in (-1, 1):
        for j, (kx, ky, fx, fy) in enumerate(((30, 70, 22, 16), (46, 84, 52, 22), (56, 100, 78, 40))):
            t.flat(path_limb([(s * 8, 100), (s * kx, ky + 20), (s * fx, fy)], [2.4, 1.8, 0.8], n_end=3), dk)
    parts = [t]
    for side in (-1, 1):
        role = WING_F if side > 0 else WING_B
        w = part('%s_%s' % (cn, role), role, (side * 14, 118), 1)
        for (cx, cy, rx, ry, ang) in ((100, 150, 96, 22, 22), (88, 116, 76, 17, -4)):
            d = w.shape(_oval(side * cx, cy, rx, ry, side * ang), wingc, opacity=0.72, lit=False)
            for j in range(4):
                a = math.radians(side * ang + (j - 1.5) * 9); w.flat(path_limb([(side * 14, 118), (side * 14 + math.cos(a) * side * (rx * 1.7), 118 + math.sin(a) * side * (rx * 1.7) * side + (cy - 118) * 0.9)], [0.7, 0.4], n_end=2), '#6a7a74', opacity=0.6)
        parts.append(w)
    b = part(cn + '_Body', BODY, (0, 100), 2)
    S(b, [(-13, 104), (13, 104), (20, 70), (16, 38), (0, 18), (-16, 38), (-20, 70)], blood)                                                     # the abdomen, full
    for i in range(4):
        b.flat([(-19 + i * 1.4, 88 - i * 16), (19 - i * 1.4, 88 - i * 16), (18 - i * 1.6, 82 - i * 16), (-18 + i * 1.6, 82 - i * 16)], dk, smooth=False)
    b.flat(ellipse(-6, 56, 4, 9, n=8), '#e86a6a', opacity=0.7)
    S(b, ellipse(0, 114, 21, 17, n=14), dk)
    parts.append(b)
    h = part(cn + '_Head', HEAD, (0, 128), 3)
    h.flat(path_limb([(0, 132), (1, 96), (0, 54)], [2.6, 1.6, 0.5], n_end=3), '#1c1614')                                                       # the needle
    S(h, ellipse(0, 138, 13, 12, n=12), dk)
    for s in (-1, 1):
        h.flat(ellipse(s * 10, 141, 8, 9, n=12), '#7a2a22'); h.flat(ellipse(s * 11.5, 143.5, 2.6, 3, n=6), '#e8a08a')
        h.flat(path_limb([(s * 4, 148), (s * 14, 168), (s * 26, 176)], [1.2, 0.9, 0.5], n_end=2), dk); spikes(h, [(s * (10 + j * 5), 160 + j * 6, 7, 0.8, 90 + s * 40) for j in range(3)], dk)
    parts.append(h)
    return parts


# ================================================================== 7. BULLFROG: sits in the shallows like a boulder, and then does not.
def bullfrog():
    cn = 'Bullfrog'
    hide, dark, belly = '#4a5a34', '#2c3a22', '#a8a67a'
    parts = []
    for side in (-1, 1):
        role = LEG_F if side > 0 else LEG_B
        p = part('%s_%s' % (cn, role), role, (side * 46, 50), 0)
        S(p, path_limb([(side * 40, 46), (side * 88, 98), (side * 74, 22)], [20, 13, 9]), hide)
        p.flat(path_limb([(side * 74, 22), (side * 104, 8)], [8, 5], n_end=4), hide)
        for j in (-1, 0, 1):
            p.flat([(side * 100 - 3, 10), (side * 100 + 3, 10), (side * (116 + j * 2), 2 + j * 9)], dark, smooth=False)
        p.flat(ellipse(side * 86, 92, 7, 6, n=8), dark)
        parts.append(p)
    b = part(cn + '_Body', BODY, (0, 60), 1)
    td = S(b, M([(0, 122), (38, 118), (62, 94), (66, 60), (46, 34), (0, 28)]), hide)
    b.clipped(td, M([(0, 96), (34, 90), (44, 62), (30, 38), (0, 30)]), belly)
    for (x, y, r) in ((-48, 100, 6), (50, 84, 7), (-56, 70, 5), (40, 110, 4), (-30, 114, 5), (56, 60, 4), (-40, 50, 5), (20, 116, 3.4)):
        b.clipped(td, ellipse(x, y, r, r * 0.8, n=8), dark)
    wound(b, td, (-20, 80), 10, seed=6)
    parts.append(b)
    h = part(cn + '_Head', HEAD, (0, 96), 2)
    S(h, M([(0, 100), (40, 100), (58, 88), (50, 72), (0, 66)]), belly)                                                                          # the throat, and the lower lip
    h.flat(M([(0, 108), (52, 108), (58, 94), (0, 84)]), '#3a0c10')
    spikes(h, [(x, 90 + abs(x) * 0.08, 9, 2.2, 90) for x in range(-48, 49, 8)], BONE)
    hd = S(h, M([(0, 152), (30, 150), (56, 134), (64, 114), (54, 104), (0, 104)]), hide)
    for s in (-1, 1):
        S(h, ellipse(s * 34, 150, 15, 12, n=14), hide); h.flat(ellipse(s * 34, 151, 8, 5.4, n=12), '#d85a2a'); h.flat(ellipse(s * 34, 151, 1.6, 5, n=8), INK)
        h.flat([(s * 20, 158), (s * 50, 162), (s * 50, 155), (s * 22, 152)], dark, smooth=False)
        spikes(h, [(s * x, 106, 11, 2.4, -90) for x in (10, 22, 34, 46)], BONE)
        h.clipped(hd, ellipse(s * 8, 118, 2.4, 1.6, n=6), INK)
        h.clipped(hd, ellipse(s * 44, 124, 6, 5, n=8), dark)
    parts.append(h)
    for side in (-1, 1):
        role = ARM_F if side > 0 else ARM_B
        a = part('%s_%s' % (cn, role), role, (side * 40, 70), 3)
        S(a, path_limb([(side * 40, 72), (side * 56, 38), (side * 46, 8)], [11, 8, 6]), hide)
        for j in (-1, 0, 1):
            a.flat(path_limb([(side * 46, 8), (side * 46 + j * 12, 0)], [3, 2.2], n_end=3), hide)
        parts.append(a)
    return parts


# ================================================================== 8. MOSSBACK: something the swamp grew in the shape of a man.
def mossback():
    moss, root = '#3e5a30', '#4a3a26'
    m = man('Mossback', 480, w=1.5, hw=1.1, skin=moss, top=moss, pants='#33462a', boot='#2a3a22', belly=0.5, chest=1.12, slump=0.6, leg_bulk=1.6, foot_w=1.5, stance=(34, 40, 40), bare_feet=True,
            jaw=0.0, eye=None, gaunt=1.12, teeth=(0, 0), ears=False, sleeve=False, arm_bulk=1.85, hr=12, claw=root, curl=(0.2, 0.2), belt=None, torn=(0, 0),
            pose=dict(L=((-98, 240), (-108, 160), -96), R=((98, 240), (110, 160), -84)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    for (pts, w) in (([(-50, 320), (-20, 280), (-36, 236), (-10, 196)], 5), ([(46, 322), (26, 290), (40, 250), (16, 210)], 4.4), ([(-6, 326), (4, 290), (-6, 250)], 3.6)):   # roots through him like ribs
        b.clipped(td, path_limb(q(k, pts), [w * k] * (len(pts) - 1) + [1.5 * k], n_end=3), root)
    for (x, y, r) in ((-40, 300, 16), (36, 270, 18), (-6, 230, 20), (50, 310, 10), (-56, 250, 12)):
        b.clipped(td, ellipse(x * k, y * k, r * k, r * 0.7 * k, n=10), '#56763c', opacity=0.9)
    _weed(b, [(x, 196, l) for (x, l) in ((-60, 50), (-40, 70), (-18, 46), (6, 76), (30, 54), (54, 66))], k, '#56763c')
    _weed(b, [(-74, 320, 60), (72, 318, 70), (-64, 300, 40), (62, 296, 46)], k, '#56763c')
    for (x, y, s) in ((-56, 326, 1.2), (-38, 334, 0.8), (52, 328, 1.0)):
        b.flat(rect((x - 2 * s) * k, y * k, (x + 2 * s) * k, (y + 14 * s) * k), '#d8d0b0', smooth=False); b.flat([((x - 12 * s) * k, (y + 13 * s) * k), (x * k, (y + 25 * s) * k), ((x + 12 * s) * k, (y + 13 * s) * k)], '#c8a03a')
    h.clipped(m.hd, [(X(-30), Y(70)), (X(30), Y(70)), (X(30), Y(-30)), (X(-30), Y(-30))], moss, smooth=False)                                 # no face: a hood of moss, and two lights well back in it
    h.clipped(m.hd, [(X(-15), Y(40)), (X(15), Y(40)), (X(13), Y(20)), (X(-13), Y(20))], '#16200f', smooth=False)
    for s in (-1, 1):
        h.clipped(m.hd, ellipse(X(s * 7.5), Y(30), 2.6 * u, 2.6 * u, n=8), '#ffb04a')
    _weed(h, [(X(x), Y(18), l * u) for (x, l) in ((-16, 30), (-8, 44), (0, 36), (8, 48), (16, 28))], 1, '#56763c')
    spikes(h, [(X(x), Y(54), l * u, 3 * u, a) for (x, l, a) in ((-14, 26, 118), (-2, 34, 96), (12, 24, 70))], root)
    return m.parts()


# ================================================================== 9. GRAVE ROBBER: what he took out of the tombs is still on him.
def grave_robber():
    gold = '#f2d25a'
    m = man('GraveRobber', 384, w=0.96, skin='#9aa88a', top='#3a3a30', pants='#2e2e28', slump=0.4, jaw=0.25, eye='#fffbe0', gaunt=0.96, teeth=(6, 4), torn=(0.2, 0.0), sleeve_to=(0.9, 0.9), curl=(0.9, 0.3),
            pose=dict(L=((-70, 276), (-58, 318), 70), R=((62, 250), (64, 196), -86)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    sack = part('GraveRobber_Prop', PROP, (-58 * k, 290 * k), 0.5)
    sd = S(sack, q(k, [(-52, 330), (-78, 320), (-98, 280), (-94, 236), (-66, 222), (-44, 240), (-40, 290)]), '#6a6450')
    sack.clipped(sd, q(k, [(-90, 268), (-70, 252), (-58, 276), (-76, 290)]), '#545040', smooth=False)
    sack.flat(q(k, [(-92, 330), (-88, 372), (-84, 330)]), gold, smooth=False); sack.flat(q(k, [(-100, 356), (-76, 356), (-76, 352), (-100, 352)]), gold, smooth=False)   # a candlestick, a cross
    sack.flat(ellipse(-70 * k, 338 * k, 9 * k, 7 * k, n=10), gold); sack.flat(ellipse(-70 * k, 338 * k, 5 * k, 4 * k, n=8), '#6a6450')
    for (x, y) in ((-70, 230), (-84, 226), (-58, 226)):
        sack.flat(ellipse(x * k, y * k, 5 * k, 5 * k, n=10), gold)
    m.extra.append(sack)
    b.clipped(td, q(k, [(-60, 318), (-40, 328), (30, 250), (20, 244)]), '#545040', smooth=False)
    for i in range(3):   # ropes of other people's pearls
        b.clipped(td, path_limb(q(k, [(-22, 326), (0, 300 - i * 12), (22, 326)]), [1.4 * k] * 3, n_end=2), '#f2ead0' if i % 2 else gold)
    P(h, [(X(-23), Y(44)), (X(-22), Y(56)), (X(0), Y(64)), (X(22), Y(56)), (X(23), Y(44))], '#2e2e28'); P(h, [(X(-23), Y(45)), (X(23), Y(45)), (X(33), Y(40)), (X(22), Y(40)), (X(-23), Y(41))], '#1c1c18')   # a flat cap
    h.clipped(m.hd, [(X(-22), Y(22)), (X(22), Y(22)), (X(19), Y(-6)), (X(-19), Y(-6))], '#545040', smooth=False)                               # a kerchief over the nose, for the smell
    c = m.aR.hand_c
    m.aR.flat(path_limb([(c[0] - 2 * k, c[1] + 30 * k), (c[0] + 4 * k, c[1] - 90 * k)], [2.6 * k, 2.6 * k], n_end=3), '#33363c'); m.aR.flat(q(1, [(c[0] - 2 * k, c[1] - 88 * k), (c[0] + 16 * k, c[1] - 98 * k), (c[0] + 10 * k, c[1] - 106 * k)]), '#33363c', smooth=False)   # a crowbar
    return m.parts()


# ================================================================== BOSS 1. OLD SCRATCH: the gator they stopped hunting.
def old_scratch():
    hide, dark, belly = '#aeac94', '#6e6c58', '#cfcab0'      # white, the way the stories have him
    m = man('OldScratch', 500, w=1.5, hw=1.3, skin=hide, top=hide, pants=hide, boot=hide, leg_bulk=1.6, foot_w=1.5, stance=(36, 42, 44), bare_feet=True, belly=0.6, chest=1.14, slump=0.5,
            jaw=0.0, eye=None, teeth=(0, 0), ears=False, neck=False, sleeve=False, arm_bulk=1.7, hr=11, claw='#3a3020', curl=(0.1, 0.1), belt=None, torn=(0, 0),
            pose=dict(L=((-94, 250), (-108, 190), -104), R=((94, 250), (108, 190), -76)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    tl = part('OldScratch_Tail', TAIL, (30 * k, 190 * k), 0.5)
    tl.shape(path_limb(q(k, [(20, 200), (100, 150), (150, 70), (180, 14)]), [30 * k, 24 * k, 14 * k, 3 * k], n_end=4), dark); spikes(tl, [((70 + i * 22) * k, (190 - i * 34) * k, 20 * k, 8 * k, 40 - i * 4) for i in range(5)], hide)
    m.extra.append(tl)
    b.clipped(td, M(q(k, [(0, 322), (34, 314), (44, 270), (50, 222), (34, 190), (0, 184)])), belly)
    for i in range(7):
        b.clipped(td, q(k, [(-52, 308 - i * 18), (52, 308 - i * 18), (52, 306 - i * 18), (-52, 306 - i * 18)]), dark, smooth=False, opacity=0.5)
    for s in (-1, 1):
        for i in range(5):
            b.clipped(td, q(k, [(s * 52, 318 - i * 24), (s * 80, 322 - i * 24), (s * 66, 304 - i * 24)]), dark, smooth=False)
    for (x0, y0, x1, y1) in ((-30, 300, -6, 250), (10, 240, 34, 204), (-40, 230, -22, 206)):
        b.clipped(td, q(k, [(x0, y0), (x0 + 3, y0), (x1 + 1.5, y1), (x1, y1)]), '#7a3a3a', smooth=False)
    for (x, y, a) in ((-58, 318, 120), (40, 330, 70), (64, 300, 40)):   # the irons of everyone who tried
        r = math.radians(a); b.flat(path_limb([(x * k, y * k), ((x + math.cos(r) * 70) * k, (y + math.sin(r) * 70) * k)], [2.4 * k, 2.4 * k], n_end=3), '#4a3626'); b.flat(ellipse(x * k, y * k, 5 * k, 5 * k, n=8), BLOOD)
    wound(b, td, (-24 * k, 262 * k), 14 * k, seed=4)
    # the head: all jaw
    h.clipped(m.hd, [(X(-40), Y(80)), (X(40), Y(80)), (X(40), Y(-40)), (X(-40), Y(-40))], hide, smooth=False)
    S(h, [(X(x), Y(y)) for x, y in M([(0, 6), (30, 8), (36, -18), (22, -34), (0, -38)])], dark)
    h.flat([(X(x), Y(y)) for x, y in M([(0, 12), (30, 12), (32, -8), (0, -14)])], '#5a1418'); h.flat([(X(x), Y(y)) for x, y in M([(0, 0), (14, -2), (16, -14), (0, -18)])], '#b85a5a')
    spikes(h, [(X(x), Y(-10), 9 * u, 2.6 * u, 90) for x in (-26, -18, -10, 10, 18, 26)], BONE)
    S(h, [(X(x), Y(y)) for x, y in M([(0, 62), (20, 60), (34, 46), (40, 26), (34, 12), (0, 10)])], hide)
    spikes(h, [(X(x), Y(12), (12 if abs(x) in (24, 8) else 8) * u, 2.8 * u, -90) for x in (-32, -24, -16, -8, 0, 8, 16, 24, 32)], BONE)
    for s in (-1, 1):
        S(h, ellipse(X(s * 20), Y(60), 9 * u, 7 * u, n=12), dark); h.flat(ellipse(X(s * 20), Y(60), 4.4 * u, 2.8 * u, n=10), '#ff5a4a'); h.flat(ellipse(X(s * 20), Y(60), 0.9 * u, 2.6 * u, n=6), INK)
        for j in range(4):
            h.flat([(X(s * (8 + j * 8) - 3), Y(48 - j * 7)), (X(s * (8 + j * 8) + 3), Y(48 - j * 7)), (X(s * (8 + j * 8)), Y(43 - j * 7))], dark, smooth=False)
        h.flat(ellipse(X(s * 6), Y(18), 2.6 * u, 1.8 * u, n=8), INK)
    spikes(h, [(X(x), Y(60), 10 * u, 5 * u, 90) for x in (-8, 0, 8)], dark)
    return m.parts()


# ================================================================== BOSS 2. MAMA SKEETER: every one of them is hers.
def mama_skeeter():
    cn = 'MamaSkeeter'; k = 2.3
    dk, blood, wingc = '#2a2a26', '#a8242a', '#c8d8d0'
    parts = []
    for side in (-1, 1):
        role = LEG_F if side > 0 else LEG_B
        p = part('%s_%s' % (cn, role), role, (side * 14 * k, 104 * k), 0)
        for (kx, ky, fx, fy) in ((34, 96, 26, 2), (52, 110, 62, 8), (64, 128, 96, 30)):
            p.flat(path_limb(q(k, [(side * 8, 104), (side * kx, ky), (side * fx, fy)]), [3 * k, 2.2 * k, 0.9 * k], n_end=3), dk)
        parts.append(p)
    for side in (-1, 1):
        role = WING_F if side > 0 else WING_B
        w = part('%s_%s' % (cn, role), role, (side * 14 * k, 122 * k), 0.5)
        for (cx, cy, rx, ry, ang) in ((104, 158, 100, 24, 24), (92, 120, 80, 19, -2)):
            w.shape(_oval(side * cx * k, cy * k, rx * k, ry * k, side * ang), wingc, opacity=0.72, lit=False)
            for j in range(5):
                a = math.radians(side * ang + (j - 2) * 8); w.flat(path_limb([(side * 14 * k, 122 * k), (side * 14 * k + math.cos(a) * side * rx * 1.7 * k, 122 * k + math.sin(a) * rx * 1.7 * k + (cy - 122) * 0.9 * k)], [1.4, 0.8], n_end=2), '#6a7a74', opacity=0.6)
        parts.append(w)
    b = part(cn + '_Body', BODY, (0, 104 * k), 1)
    S(b, q(k, [(-15, 108), (15, 108), (30, 74), (26, 36), (0, 8), (-26, 36), (-30, 74)]), blood)
    for i in range(5):
        b.flat(q(k, [(-28 + i * 1.6, 92 - i * 15), (28 - i * 1.6, 92 - i * 15), (27 - i * 2, 86 - i * 15), (-27 + i * 2, 86 - i * 15)]), dk, smooth=False)
    for (x, y, r) in ((-10, 60, 5), (8, 44, 4), (-4, 30, 3.4), (14, 70, 3)):   # eggs, showing through
        b.flat(ellipse(x * k, y * k, r * k, r * 1.2 * k, n=8), '#f2c0b0', opacity=0.85)
    S(b, ellipse(0, 120 * k, 24 * k, 19 * k, n=14), dk)
    spikes(b, [(x * k, 132 * k, 12 * k, 2 * k, a) for (x, a) in ((-14, 120), (-5, 100), (5, 80), (14, 60))], dk)
    parts.append(b)
    h = part(cn + '_Head', HEAD, (0, 134 * k), 2)
    h.flat(path_limb(q(k, [(0, 138), (1, 100), (0, 50)]), [3 * k, 1.8 * k, 0.5 * k], n_end=3), '#1c1614')
    S(h, ellipse(0, 146 * k, 15 * k, 14 * k, n=12), dk)
    for s in (-1, 1):
        h.flat(ellipse(s * 11 * k, 149 * k, 9.4 * k, 10.4 * k, n=12), '#7a2a22'); h.flat(ellipse(s * 13 * k, 152 * k, 3 * k, 3.4 * k, n=6), '#e8a08a')
        h.flat(path_limb(q(k, [(s * 5, 157), (s * 18, 180), (s * 34, 190)]), [1.3 * k, 1 * k, 0.5 * k], n_end=2), dk); spikes(h, [(s * (13 + j * 6) * k, (172 + j * 6) * k, 9 * k, 0.9 * k, 90 + s * 40) for j in range(3)], dk)
    spikes(h, [(x * k, 158 * k, l * k, 2.4 * k, a) for (x, l, a) in ((-8, 14, 110), (0, 20, 90), (8, 14, 70))], '#d8b85a')                           # she wears a crown; nobody knows whose
    parts.append(h)
    return parts


# ================================================================== BOSS 3. DEACON MOSS: he is still preaching, and the lagoon is his congregation.
def deacon():
    m = man('Deacon', 540, w=0.9, hw=0.96, skin='#9aa88a', top='#16181a', pants='#16181a', slump=0.3, chest=0.98, jaw=0.9, eye=WISP, gaunt=0.84, teeth=(7, 6),
            sleeve_to=(0.9, 0.9), curl=(0.9, 0.9), arm_bulk=0.86, hr=7.6, belt=None, pose=dict(L=((-62, 250), (-66, 194), -94), R=((70, 266), (80, 318), 86)),
            gown=dict(col='#16181a', top=240, hem_w=66, rag=9, seed=3))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    b.flat(q(k, [(-30, 200), (-10, 110), (-24, 24), (-38, 110)]), '#22262a', opacity=0.9); b.flat(q(k, [(24, 206), (38, 110), (28, 20), (14, 120)]), '#22262a', opacity=0.9)
    b.clipped(td, q(k, [(-6, 331), (6, 331), (6, 318), (-6, 318)]), '#e8e2d0', smooth=False)                                                   # the collar
    b.clipped(td, q(k, [(-9, 318), (9, 318), (6, 250), (-6, 250)]), '#3a2a4a', smooth=False); b.clipped(td, q(k, [(-1.6, 300), (1.6, 300), (1.6, 268), (-1.6, 268)]), '#d8b85a', smooth=False); b.clipped(td, q(k, [(-6, 291), (6, 291), (6, 288), (-6, 288)]), '#d8b85a', smooth=False)   # a stole
    b.clipped(td, rect(-70 * k, 120 * k, 70 * k, 170 * k), MUD, smooth=False, opacity=0.7)
    _weed(b, [(-44, 326, 80), (-30, 328, 50), (40, 326, 90), (50, 322, 56)], k)
    S(h, [(X(-13), Y(8)), (X(-17), Y(-14)), (X(-8), Y(-44)), (X(0), Y(-30)), (X(7), Y(-50)), (X(16), Y(-12)), (X(13), Y(8)), (X(6), Y(-2)), (X(0), Y(0)), (X(-6), Y(-2))], '#56763c')   # a beard of moss
    hat(h, X(0), Y(49), 20 * u, 22 * u, 46 * u, '#16181a', band='#3a2a4a', brim_h=6 * u, taper=0.94, dent=0.0)
    c = m.aL.hand_c   # the thurible: a lamp on a chain, burning marsh gas
    for j in range(6):
        m.aL.flat(ellipse(c[0], c[1] - (8 + j * 9) * k, (2.6 if j % 2 else 3.8) * k, (4.6 if j % 2 else 3.2) * k, n=8), '#8a8f99' if j % 2 else '#6a6e76')
    P(m.aL, [(c[0] - 12 * k, c[1] - 62 * k), (c[0] + 12 * k, c[1] - 62 * k), (c[0] + 9 * k, c[1] - 92 * k), (c[0] - 9 * k, c[1] - 92 * k)], '#b9974a'); m.aL.flat(ellipse(c[0], c[1] - 76 * k, 6 * k, 8 * k, n=10), WISP)
    for (dx, dy, r) in ((-6, -50, 6), (6, -40, 8), (-2, -28, 5)):
        m.aL.flat(ellipse(c[0] + dx * k, c[1] + dy * k, r * k, r * 0.8 * k, n=8), WISP, opacity=0.35)
    c = m.aR.hand_c   # the book, held up
    P(m.aR, [(c[0] - 22 * k, c[1] - 6 * k), (c[0] + 22 * k, c[1] - 6 * k), (c[0] + 22 * k, c[1] + 50 * k), (c[0] - 22 * k, c[1] + 50 * k)], '#2a1a1a'); m.aR.flat(rect(c[0] - 18 * k, c[1] - 2 * k, c[0] + 18 * k, c[1] + 46 * k), '#e8e2d0', smooth=False)
    m.aR.flat(rect(c[0] - 1 * k, c[1] - 6 * k, c[0] + 1 * k, c[1] + 50 * k), '#2a1a1a', smooth=False)
    for i in range(5):
        m.aR.flat(rect(c[0] - 15 * k, c[1] + (6 + i * 8) * k, c[0] - 4 * k, c[1] + (8 + i * 8) * k), '#8a8478', smooth=False); m.aR.flat(rect(c[0] + 4 * k, c[1] + (6 + i * 8) * k, c[0] + 15 * k, c[1] + (8 + i * 8) * k), '#8a8478', smooth=False)
    return m.parts()


# ================================================================== BOSS 4. THE FERRYMAN: he will take you across. Everyone goes across.
def ferryman():
    m = man('Ferryman', 640, w=0.96, hw=1.0, skin='#b8b8a0', top='#1a201c', pants='#1a201c', slump=0.4, chest=1.04, jaw=0.4, eye=None, gaunt=0.9, teeth=(7, 5),
            sleeve_to=(0.92, 0.92), curl=(0.9, 0.9), arm_bulk=0.95, hr=9, belt=None, pose=dict(L=((-66, 252), (-72, 200), -92), R=((72, 262), (82, 318), 90)),
            gown=dict(col='#1a201c', top=250, hem_w=72, rag=10, seed=5))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    b.flat(q(k, [(-6, 318), (6, 318), (10, 40), (-10, 40)]), '#242c26', smooth=False)
    b.flat(rect(-60 * k, 232 * k, 60 * k, 242 * k), '#6a5a3a', smooth=False)
    for i in range(4):   # his fares, on a cord
        b.flat(ellipse((-30 + i * 9) * k, (226 - (i % 2) * 6) * k, 4.4 * k, 4.4 * k, n=8), '#d8b85a')
    b.clipped(td, rect(-90 * k, 100 * k, 90 * k, 150 * k), MUD, smooth=False, opacity=0.6)
    _weed(b, [(-40, 60, 40), (-10, 50, 34), (30, 56, 44), (52, 70, 30)], k)
    hood = [(X(0), Y(74)), (X(18), Y(68)), (X(30), Y(46)), (X(32), Y(14)), (X(38), Y(-20)), (X(20), Y(-26)), (X(16), Y(6)), (X(15), Y(34)), (X(0), Y(47)), (X(-15), Y(34)), (X(-16), Y(6)), (X(-20), Y(-26)), (X(-38), Y(-20)), (X(-32), Y(14)), (X(-30), Y(46)), (X(-18), Y(68))]
    P(h, hood, '#1a201c')
    for s in (-1, 1):
        h.flat(ellipse(X(s * 9.6), Y(30.6), 4.6 * u, 4.6 * u, n=10), '#d8b85a'); h.flat(ellipse(X(s * 10.4), Y(31.6), 1.8 * u, 1.8 * u, n=6), '#fff3b0')     # a coin on each eye
    c = m.aL.hand_c   # the lantern
    m.aL.flat(path_limb([(c[0], c[1] - 4 * k), (c[0], c[1] - 20 * k)], [1.4 * k, 1.4 * k], n_end=3), '#5a5e66')
    P(m.aL, [(c[0] - 12 * k, c[1] - 20 * k), (c[0] + 12 * k, c[1] - 20 * k), (c[0] + 12 * k, c[1] - 56 * k), (c[0] - 12 * k, c[1] - 56 * k)], '#2a2226'); m.aL.flat(rect(c[0] - 9 * k, c[1] - 52 * k, c[0] + 9 * k, c[1] - 24 * k), WISP, smooth=False); m.aL.flat(ellipse(c[0], c[1] - 40 * k, 4 * k, 7 * k, n=8), '#f2ffd0')
    c = m.aR.hand_c   # the pole: a boat hook at the top
    m.aR.flat(path_limb([(c[0], c[1] - 300 * k), (c[0], c[1] + 96 * k)], [3.4 * k, 3 * k], n_end=4), '#4a3a26')
    m.aR.flat(path_limb([(c[0], c[1] + 92 * k), (c[0], c[1] + 126 * k)], [2.6 * k, 0.8 * k], n_end=3), '#8a8f99'); m.aR.flat(path_limb([(c[0], c[1] + 96 * k), (c[0] + 16 * k, c[1] + 108 * k), (c[0] + 22 * k, c[1] + 92 * k), (c[0] + 14 * k, c[1] + 84 * k)], [2.6 * k, 2.4 * k, 2 * k, 0.7 * k], n_end=3), '#8a8f99')
    return m.parts()


# ================================================================== BOSS 5. MOTHER MOURN: the lagoon took her, and then it was hers.
def mother_mourn():
    m = man('MotherMourn', 640, w=1.3, hw=1.02, skin='#a8b8a0', top='#2a3a2e', pants='#2a3a2e', slump=0.3, chest=1.06, belly=0.2, jaw=0.6, eye=WISP, gaunt=0.9, teeth=(8, 6), brow=1.6, hair=('long', '#2e4a2a'),
            sleeve_to=(0.6, 0.6), claw='#2a2218', curl=(0.2, 0.2), arm_bulk=1.2, hr=10, belt=None, sh=(66, 314), pose=dict(L=((-98, 262), (-118, 206), -108), R=((98, 262), (120, 300), 66)),
            gown=dict(col='#2a3a2e', top=246, hem_w=96, rag=11, seed=9))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    for side in (-1, 1):   # roots rise behind each shoulder, a wisp alight on every tip
        pr = part('MotherMourn_Prop%s' % ('L' if side < 0 else 'R'), PROP, (side * 62 * k, 318 * k), 0.5)
        for i in range(4):
            a = math.radians(90 - side * (16 + i * 26)); base = (side * 60 * k, 316 * k); mid = (base[0] + math.cos(a + side * 0.3) * 70 * k, base[1] + math.sin(a + side * 0.3) * 70 * k); tip = (base[0] + math.cos(a) * 128 * k, base[1] + math.sin(a) * 128 * k)
            pr.flat(path_limb([base, mid, tip], [5 * k, 3.6 * k, 1.2 * k], n_end=3), '#4a3a26')
            pr.flat(ellipse(tip[0], tip[1], 8 * k, 9 * k, n=10), WISP); pr.flat(ellipse(tip[0] - 1.5 * k, tip[1] + 2 * k, 3.4 * k, 4 * k, n=8), '#f2ffd0')
        m.extra.append(pr)
    for (x, y, r) in ((-60, 200, 16), (-20, 150, 20), (40, 180, 18), (70, 110, 15), (-70, 90, 17), (10, 70, 16), (-36, 40, 14), (50, 40, 13)):   # lily pads down her skirts, some in flower
        b.flat(_oval(x * k, y * k, r * k, r * 0.5 * k, (x % 40) - 20, 12), '#4a6a3a'); b.flat(q(k, [(x, y), (x + r * 0.9, y + 2), (x + r * 0.8, y - 3)]), '#2a3a2e', smooth=False)
        if r > 15:
            for j in range(5):
                a = j / 5 * 6.283; b.flat(_oval((x + math.cos(a) * 3) * k, (y + 5 + math.sin(a) * 2) * k, 5 * k, 2.4 * k, a * 57.3, 8), '#f2ead0')
            b.flat(ellipse(x * k, (y + 5) * k, 2 * k, 1.6 * k, n=6), '#e8c84a')
    cav = b.clipped(td, q(k, [(-26, 314), (26, 314), (30, 276), (22, 250), (-22, 250), (-30, 276)]), '#101a12', smooth=False)
    b.clipped(cav, ellipse(0, 282 * k, 13 * k, 15 * k, n=10), WISP); b.clipped(cav, ellipse(-2 * k, 285 * k, 6 * k, 7 * k, n=8), '#f2ffd0')
    for (pts, w) in (([(-28, 318), (-10, 290), (-22, 256)], 3), ([(28, 318), (10, 294), (24, 260)], 3), ([(0, 322), (-4, 300), (4, 270), (0, 250)], 2.4)):
        b.clipped(td, path_limb(q(k, pts), [w * k] * (len(pts) - 1) + [1 * k], n_end=3), '#4a3a26')
    _weed(b, [(-58, 322, 90), (-44, 326, 60), (46, 326, 100), (60, 320, 70)], k)
    spikes(h, [(X(x), Y(54), l * u, 3.2 * u, a) for (x, l, a) in ((-18, 40, 124), (-10, 60, 106), (-2, 44, 94), (8, 64, 80), (17, 38, 60))], '#4a3a26')   # a crown of cypress root
    for (x, l, a) in ((-10, 60, 106), (8, 64, 80)):
        r = math.radians(a); tx, ty = X(x) + math.cos(r) * l * u * 0.6, Y(54) + math.sin(r) * l * u * 0.6
        _weed(h, [(tx, ty, 30 * u), (tx + 6 * u, ty + 4 * u, 20 * u)], 1, '#7a8a7a')
    S(h, [(X(-24), Y(54)), (X(-36), Y(10)), (X(-44), Y(-70)), (X(-22), Y(-44)), (X(-22), Y(20))], '#7a8a7a', opacity=0.4); S(h, [(X(24), Y(54)), (X(36), Y(10)), (X(46), Y(-60)), (X(24), Y(-36)), (X(22), Y(20))], '#7a8a7a', opacity=0.4)   # a veil of moss
    return m.parts()


ROSTER = [
    ('Drowned', drowned), ('Mudskipper', mudskipper), ('Gator', gator), ('BogBloat', bog_bloat), ('Angler', angler), ('Skeeter', skeeter), ('Bullfrog', bullfrog), ('Mossback', mossback), ('GraveRobber', grave_robber),
    ('OldScratch', old_scratch), ('MamaSkeeter', mama_skeeter), ('Deacon', deacon), ('Ferryman', ferryman), ('MotherMourn', mother_mourn),
]
