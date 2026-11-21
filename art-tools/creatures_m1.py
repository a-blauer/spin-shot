"""Blackwater Mine: the night shift, what lived in the dark before them, and the man who owns it all."""
from kit2 import *   # noqa: F401,F403

COAL = '#26262b'


def _helmet(m, col='#2e2a28', lamp=True):
    """A miner's hard leather cap with a tallow lamp hooked on the front."""
    h, X, Y, u = m.h, m.X, m.Y, m.u
    P(h, [(X(-23), Y(43)), (X(-22), Y(55)), (X(-13), Y(63)), (X(0), Y(65.5)), (X(13), Y(63)), (X(22), Y(55)), (X(23), Y(43)), (X(0), Y(46.5))], col)
    P(h, [(X(-27), Y(42)), (X(27), Y(42)), (X(23), Y(47)), (X(0), Y(49.5)), (X(-23), Y(47))], shade(col, 0.72))
    if lamp:
        h.flat(rect(X(-4.5), Y(49), X(4.5), Y(59)), '#9a8650', smooth=False); h.flat(rect(X(-6), Y(58), X(6), Y(60.5)), '#6a5a30', smooth=False)
        h.flat([(X(-3.4), Y(60.5)), (X(-1.5), Y(68)), (X(0), Y(75)), (X(2.2), Y(67)), (X(3.4), Y(60.5))], '#ffb030'); h.flat([(X(-1.6), Y(60.5)), (X(0), Y(68)), (X(1.6), Y(60.5))], '#fff0b0')


def _pick(a, k, down=True, head='#8a8f99'):
    """A pickaxe gripped in the fist of arm `a`."""
    c = a.hand_c; s = -1 if down else 1
    a.flat(path_limb([(c[0] - 3 * k, c[1] - s * 30 * k), (c[0] + 5 * k, c[1] + s * 128 * k)], [3.2 * k, 3.2 * k], n_end=4), '#6a4a2e')
    t = (c[0] + 5 * k, c[1] + s * 124 * k)
    a.flat(path_limb([(t[0] - 58 * k, t[1] - s * 16 * k), (t[0] - 26 * k, t[1] + s * 2 * k), t, (t[0] + 26 * k, t[1] + s * 2 * k), (t[0] + 58 * k, t[1] - s * 16 * k)], [0.8 * k, 4.4 * k, 6 * k, 4.4 * k, 0.8 * k], n_end=3), head)
    a.flat(rect(t[0] - 5 * k, t[1] - 7 * k, t[0] + 5 * k, t[1] + 7 * k), shade(head, 0.6), smooth=False)


# ================================================================== 1. PIT HAND: a miner who never clocked off.
def pit_hand():
    m = man('PitHand', 400, skin='#7f8a78', top='#8a8474', pants='#3a4048', slump=0.6, jaw=0.5, torn=(0.25, 0.0), sleeve_to=(0.5, 0.42), curl=(0.3, 0.9),
            pose=dict(L=((-60, 246), (-64, 190), -94), R=((64, 250), (70, 200), -86)))
    b, td, k = m.b, m.td, m.k
    bib = b.clipped(td, q(k, [(-27, 302), (27, 302), (31, 232), (-31, 232)]), '#3a4048', smooth=False)                      # bib and brace
    for s in (-1, 1):
        b.clipped(td, q(k, [(s * 19, 300), (s * 27, 300), (s * 30, 333), (s * 21, 333)]), '#3a4048', smooth=False); b.clipped(td, ellipse(s * 23 * k, 297 * k, 2.6 * k, 2.6 * k, n=8), '#b9974a')
    b.clipped(td, q(k, [(-14, 286), (14, 286), (14, 262), (-14, 262)]), shade('#3a4048', 0.8), smooth=False)
    for (x, y, r) in ((-34, 316, 9), (36, 270, 11), (-6, 246, 12), (30, 306, 7)):
        b.clipped(td, ellipse(x * k, y * k, r * k, r * 0.7 * k, n=9), COAL, opacity=0.45)                                    # coal dust
    wound(b, td, (-22 * k, 276 * k), 13 * k, seed=3)
    for (x, y, r) in ((-12, 22, 6), (13, 40, 5), (4, 6, 4)):
        m.h.clipped(m.hd, ellipse(m.X(x), m.Y(y), r * m.u, r * 0.8 * m.u, n=8), COAL, opacity=0.4)
    _helmet(m); _pick(m.aR, k)
    return m.parts()


# ================================================================== 2. TALLOW RUNNER: dipped in candle wax and still burning.
def tallow():
    wax = '#e6dab0'
    m = man('Tallow', 380, w=0.9, skin='#cfc39a', top='#cfc39a', pants='#4a4238', slump=0.2, jaw=0.9, eye='#ff9a3a', gaunt=0.9, teeth=(6, 5), torn=(0.6, 0.45), bare_feet=True,
            sleeve=False, claw='#3a2c1e', curl=(0.0, 0.0), pose=dict(L=((-82, 282), (-98, 338), 100), R=((84, 276), (104, 330), 76)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    ribs(b, td, m.F, shade('#cfc39a', 0.56), n=5, op=0.8)
    for (x, y0, l, w) in ((-40, 322, 46, 7), (-22, 328, 70, 6), (-4, 330, 38, 5), (16, 328, 82, 7), (38, 322, 54, 6), (30, 300, 30, 4)):   # wax has run down him and set
        b.clipped(td, path_limb([(x * k, y0 * k), ((x + 1) * k, (y0 - l * 0.6) * k), (x * k, (y0 - l) * k)], [w * k, w * 0.7 * k, w * 0.95 * k], n_end=4), wax)
    b.clipped(td, q(k, [(-60, 334), (60, 334), (56, 316), (20, 322), (-18, 320), (-56, 314)]), wax, smooth=False)
    S(h, [(X(-21), Y(42)), (X(-14), Y(55)), (X(0), Y(59)), (X(14), Y(55)), (X(21), Y(42)), (X(17), Y(30)), (X(13), Y(41)), (X(6), Y(36)), (X(0), Y(44)), (X(-8), Y(38)), (X(-14), Y(43)), (X(-18), Y(28))], wax)   # a cap of it over the skull
    for x in (-9, 0, 10):   # three stubs still alight
        h.flat(rect(X(x - 2.4), Y(56), X(x + 2.4), Y(64 + (x % 3))), '#f2ead0', smooth=False)
        h.flat([(X(x - 2.2), Y(64 + (x % 3))), (X(x - 0.6), Y(70)), (X(x), Y(77 + (x % 3))), (X(x + 1.6), Y(70)), (X(x + 2.2), Y(64 + (x % 3)))], '#ff9a2a'); h.flat([(X(x - 1), Y(64 + (x % 3))), (X(x), Y(71)), (X(x + 1), Y(64 + (x % 3)))], '#fff0b0')
    for a in (m.aL, m.aR):
        c = a.hand_c; a.flat(path_limb([(c[0], c[1] - 4 * k), (c[0], c[1] - 26 * k)], [3 * k, 2 * k], n_end=3), wax)
    return m.parts()


# ================================================================== 3. PALE CRAWLER: born in the dark. No eyes; ears like a bat's.
def pale_crawler():
    cn = 'PaleCrawler'; F = F1(40)
    skin, vein = '#d2c8cc', '#8a8fb0'
    b = part(cn + '_Body', BODY, (0, 60), 1)
    for s, pts in ((-1, [(-20, 84), (-62, 60), (-70, 26), (-104, 10)]), (1, [(22, 86), (58, 66), (84, 34), (120, 14)])):   # wasted legs trailing behind
        b.flat(path_limb(pts, [9, 6, 4.5, 3], n_end=4), shade(skin, 0.8))
    td = S(b, M([(0, 156), (24, 154), (50, 138), (60, 112), (50, 88), (28, 74), (0, 70)]), skin)
    for s in (-1, 1):
        for i in range(4):
            y = 140 - i * 13
            b.clipped(td, [(s * 5, y), (s * 28, y - 3), (s * 54, y - 12), (s * 54, y - 16), (s * 28, y - 8), (s * 5, y - 4.5)], shade(skin, 0.7), opacity=0.7)
        b.clipped(td, path_limb([(s * 14, 150), (s * 30, 120), (s * 22, 86)], [1.6, 1.2, 0.8], n_end=3), vein, opacity=0.6)
    for i in range(7):
        b.clipped(td, ellipse(0, 152 - i * 11, 4.6 - i * 0.2, 3.6, n=8), light(skin, 1.12))
    parts = [b]
    h, hd, L = skull(cn, F, skin, jaw=1.3, eye=None, hair=None, neck=False, ears=False, teeth=(9, 8), gaunt=0.86, brow=2.2)
    X, Y, u = L['X'], L['Y'], L['u']
    for s in (-1, 1):
        h.clipped(hd, [(X(s * 2), Y(40)), (X(s * 18), Y(40)), (X(s * 17), Y(24)), (X(s * 3), Y(24))], skin, smooth=False)                 # where the eyes would be: smooth skin
        h.clipped(hd, [(X(s * 4), Y(34)), (X(s * 15), Y(35)), (X(s * 15), Y(33.4)), (X(s * 4), Y(32.4))], shade(skin, 0.7), smooth=False, opacity=0.7)
        S(h, [(X(s * 15), Y(44)), (X(s * 30), Y(80)), (X(s * 36), Y(58)), (X(s * 26), Y(36)), (X(s * 20), Y(30))], skin)                   # the ears
        h.flat([(X(s * 19), Y(42)), (X(s * 29), Y(70)), (X(s * 31), Y(54)), (X(s * 24), Y(38))], '#b08a94', smooth=False)
    h.pivot = (0, 76)
    parts.append(h)
    parts.append(arm2(cn, -1, F, skin, sh=(-48, 122), el=(-104, 146), wr=(-128, 48), hand_ang=-96, claw='#4a4450', curl=0.0, hr=8.5, bulk=0.9))
    parts.append(arm2(cn, 1, F, skin, sh=(48, 122), el=(106, 140), wr=(126, 46), hand_ang=-84, claw='#4a4450', curl=0.0, hr=8.5, bulk=0.9))
    return parts


# ================================================================== 4. GASBAG: swollen with firedamp, and something in there is lit.
def gasbag():
    cn = 'Gasbag'; F = fig(440, w=1.22); k = F['k']
    skin, cloth, gas = '#8fa074', '#3a4048', '#b6f06a'
    parts = [leg2(cn, -1, F, cloth, skin, torn=0.2, bulk=1.5, hip=(-34 * k, 196 * k), knee=(-40 * k, 104 * k), ank=(-42 * k, 16 * k), foot_w=1.2), leg2(cn, 1, F, cloth, skin, torn=0.5, bulk=1.5, hip=(34 * k, 196 * k), knee=(40 * k, 104 * k), ank=(42 * k, 16 * k), foot_w=1.2)]
    b, td = body(cn, F, skin, half=[(0, 331), (9, 331), (28, 326), (46, 319), (52, 304), (56, 284), (66, 262), (78, 240), (82, 218), (76, 198), (60, 186), (40, 181), (0, 179)])
    for (pts, w) in (([(0, 300), (-8, 270), (4, 244), (-6, 214), (2, 194)], 3.2), ([(-6, 268), (-34, 258), (-58, 236)], 2.2), ([(4, 244), (36, 240), (62, 222)], 2.2), ([(-6, 214), (-40, 206)], 1.8), ([(-34, 258), (-44, 284)], 1.6), ([(36, 240), (50, 268)], 1.6)):   # the skin has cracked, and it glows through
        b.clipped(td, path_limb(q(k, pts), [w * k] * (len(pts) - 1) + [0.6 * k], n_end=3), gas)
    b.clipped(td, ellipse(-2 * k, 246 * k, 22 * k, 26 * k, n=14), gas, opacity=0.28)
    b.clipped(td, q(k, [(-140, 170), (140, 170), (140, 198), (60, 190), (0, 186), (-60, 190), (-140, 198)]), cloth, smooth=False)
    for s in (-1, 1):
        b.clipped(td, q(k, [(s * 16, 332), (s * 25, 332), (s * 66, 208), (s * 55, 206)]), cloth, smooth=False)
    b.clipped(td, q(k, [(60, 208), (78, 212), (74, 196), (58, 194)]), shade(cloth, 0.7), smooth=False)
    parts.append(b)
    h, hd, L = skull(cn, F, skin, jaw=0.0, eye=None, hair=None, gaunt=1.1, teeth=(0, 0))
    X, Y, u = L['X'], L['Y'], L['u']
    h.clipped(hd, [(X(-22), Y(22)), (X(22), Y(22)), (X(18), Y(-4)), (X(-18), Y(-4))], '#6a6250', smooth=False)                              # a rag tied over the mouth
    h.clipped(hd, [(X(-22), Y(22)), (X(22), Y(22)), (X(22), Y(18)), (X(-22), Y(18))], '#4e4838', smooth=False)
    P(h, [(X(-24), Y(38)), (X(24), Y(38)), (X(24), Y(26)), (X(-24), Y(26))], '#2e2a28')                                                      # the strap of his goggles
    for s in (-1, 1):
        h.flat(ellipse(X(s * 10), Y(31), 8.4 * u, 8.4 * u, n=14), '#4a4238'); h.flat(ellipse(X(s * 10), Y(31), 6.2 * u, 6.2 * u, n=12), gas); h.flat(ellipse(X(s * 8.4), Y(33), 2 * u, 2 * u, n=8), '#f2ffd0')
    parts.append(h)
    parts.append(arm2(cn, -1, F, skin, sh=(-54 * k, 312 * k), el=(-86 * k, 254 * k), wr=(-106 * k, 200 * k), bulk=1.3, hand_ang=-104, curl=0.25, hr=8.4 * k))
    parts.append(arm2(cn, 1, F, skin, sh=(54 * k, 312 * k), el=(86 * k, 254 * k), wr=(104 * k, 198 * k), bulk=1.3, hand_ang=-76, curl=0.25, hr=8.4 * k))
    return parts


# ================================================================== 5. POWDERMAN: still setting charges. One is lit.
def powderman():
    m = man('Powderman', 410, w=0.94, skin='#5a4a40', top='#7a6248', pants='#3c342c', slump=0.3, jaw=0.6, eye='#ffb04a', gaunt=0.92, torn=(0.0, 0.2), sleeve_to=(0.8, 0.8), curl=(0.4, 0.9),
            pose=dict(L=((-62, 246), (-64, 190), -94), R=((72, 268), (84, 326), 84)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    b.clipped(td, q(k, [(-52, 322), (-40, 330), (44, 236), (32, 228)]), '#3a2a1c', smooth=False)                                            # a bandolier of sticks
    for i in range(6):
        x, y = -40 + i * 15, 318 - i * 16.5
        b.clipped(td, q(k, [(x - 5, y + 9), (x + 3, y + 13), (x + 11, y - 5), (x + 3, y - 9)]), '#a8322a', smooth=False); b.clipped(td, q(k, [(x - 5, y + 9), (x + 3, y + 13), (x + 4.5, y + 9.5), (x - 3.5, y + 5.5)]), '#d8c9a0', smooth=False)
    for (x, y, r) in ((30, 310, 12), (-30, 262, 14), (10, 250, 9)):
        b.clipped(td, ellipse(x * k, y * k, r * k, r * 0.8 * k, n=9), '#1e1a18', opacity=0.5)                                               # scorched
    h.clipped(m.hd, [(X(-22), Y(60)), (X(2), Y(60)), (X(-4), Y(30)), (X(-22), Y(18))], '#2a2220', smooth=False, opacity=0.7)               # half his face is burnt black
    hat(h, X(0), Y(49), 20 * u, 15 * u, 37 * u, '#3a3028', band='#1e1a18', brim_h=5.5 * u, taper=0.78, dent=0.25)
    c = m.aR.hand_c   # the lit stick, held up
    m.aR.flat(q(1, [(c[0] - 5 * k, c[1] - 12 * k), (c[0] + 5 * k, c[1] - 12 * k), (c[0] + 5 * k, c[1] + 40 * k), (c[0] - 5 * k, c[1] + 40 * k)]), '#a8322a', smooth=False)
    m.aR.flat(rect(c[0] - 5 * k, c[1] + 32 * k, c[0] + 5 * k, c[1] + 40 * k), '#d8c9a0', smooth=False)
    m.aR.flat(path_limb([(c[0], c[1] + 40 * k), (c[0] + 5 * k, c[1] + 52 * k), (c[0] + 2 * k, c[1] + 62 * k)], [1 * k, 1 * k, 0.8 * k], n_end=3), '#2a2220')
    for i in range(7):
        a = i * 0.9; r = (9 if i % 2 else 15) * k
        m.aR.flat([(c[0] + 2 * k - 1.6 * k, c[1] + 62 * k), (c[0] + 2 * k + 1.6 * k, c[1] + 62 * k), (c[0] + 2 * k + math.cos(a) * r, c[1] + 62 * k + math.sin(a) * r)], '#ffb030' if i % 2 else '#fff0b0', smooth=False)
    return m.parts()


# ================================================================== 6. GLOOM BAT: hangs from the roof until it hears you.
def gloom_bat():
    cn = 'GloomBat'
    fur, mem, pale = '#3a3038', '#4a3a48', '#6a5560'
    t = part(cn + '_Tail', TAIL, (0, 78), 0)
    for s in (-1, 1):   # hind legs hanging, the little hooked feet
        t.flat(path_limb([(s * 9, 74), (s * 13, 52), (s * 9, 34)], [4.4, 3, 2.2], n_end=4), fur)
        for j in (-1, 0, 1):
            t.flat([(s * 9 + j * 4 - 1.4, 36), (s * 9 + j * 4 + 1.4, 36), (s * 9 + j * 5, 22)], '#1c1614', smooth=False)
    t.flat([(-9, 72), (9, 72), (4, 52), (0, 44), (-4, 52)], mem, smooth=False)
    parts = [t, wing(cn, -1, (-26, 104), mem, '#221a26', span=1.08), wing(cn, 1, (26, 104), mem, '#221a26', span=1.08)]
    b = part(cn + '_Body', BODY, (0, 100), 2)
    td = S(b, M([(0, 132), (16, 130), (30, 116), (32, 96), (24, 78), (10, 68), (0, 66)]), fur)
    b.clipped(td, M([(0, 124), (10, 122), (18, 108), (16, 88), (8, 76), (0, 74)]), pale)
    for i in range(5):
        b.clipped(td, [(-14 + i * 7 - 2, 96 - (i % 2) * 6), (-14 + i * 7 + 2, 96 - (i % 2) * 6), (-14 + i * 7, 84 - (i % 2) * 6)], fur, smooth=False)
    parts.append(b)
    h = part(cn + '_Head', HEAD, (0, 124), 3)
    for s in (-1, 1):
        S(h, [(s * 10, 150), (s * 16, 196), (s * 34, 176), (s * 30, 150), (s * 22, 138)], fur); h.flat([(s * 15, 152), (s * 19, 184), (s * 29, 170), (s * 26, 150)], '#a06a7a', smooth=False)
    hd = S(h, M([(0, 164), (14, 162), (24, 150), (26, 136), (20, 122), (10, 113), (0, 111)]), fur)
    for s in (-1, 1):
        h.clipped(hd, ellipse(s * 11, 142, 6, 5, n=10), SOCKET); h.clipped(hd, ellipse(s * 11, 142, 3.4, 3.4, n=8), '#ffd24a'); h.clipped(hd, ellipse(s * 11, 142, 1, 2.6, n=6), INK)
    h.clipped(hd, [(0, 138), (5, 132), (4, 127), (0, 129), (-4, 127), (-5, 132)], '#a06a7a', smooth=False)                                    # the nose leaf
    md = h.clipped(hd, [(-12, 124), (12, 124), (8, 112), (-8, 112)], '#2a1014', smooth=False)
    for s in (-1, 1):
        h.clipped(hd, [(s * 9, 124), (s * 5, 124), (s * 6.6, 114)], BONE, smooth=False); h.clipped(hd, [(s * 3.6, 124), (s * 1, 124), (s * 2.2, 119)], BONE, smooth=False)
    parts.append(h)
    return parts


# ================================================================== 7. ROCKWORM: chews through the seam and comes up under your feet.
def rockworm():
    cn = 'Rockworm'
    hide, plate, gum = '#6a5a50', '#4a3e38', '#8a3a40'
    b = part(cn + '_Body', BODY, (0, 30), 1)
    for (x, y, w, h2) in ((-70, 14, 46, 22), (64, 10, 52, 20), (-20, 6, 40, 16), (30, 18, 36, 20)):   # the floor it broke through
        b.shape([(x - w, y - h2 * 0.5), (x - w * 0.5, y + h2), (x + w * 0.4, y + h2 * 0.8), (x + w, y - h2 * 0.5)], '#3a3632', smooth=False)
    segs = [(0, 30, 62), (4, 62, 60), (9, 94, 57), (12, 126, 54), (10, 158, 52), (6, 188, 50)]
    for i, (x, y, w) in enumerate(segs):
        d = S(b, ellipse(x, y, w, 24, n=16), hide if i % 2 else shade(hide, 0.9))
        b.clipped(d, [(x - w, y + 8), (x + w, y + 8), (x + w, y + 30), (x - w, y + 30)], plate, smooth=False)
        for s in (-1, 1):
            b.flat([(x + s * (w - 3), y + 6), (x + s * (w + 12), y + 2), (x + s * (w - 3), y - 6)], '#d8ccb0', smooth=False)                 # a spur on every ring
    parts = [b]
    h = part(cn + '_Head', HEAD, (6, 196), 2)
    S(h, ellipse(4, 232, 60, 52, n=20), hide); h.flat(ellipse(4, 232, 50, 43, n=20), gum); h.flat(ellipse(4, 232, 28, 24, n=16), '#1a0c0e')
    for ring, (r, n, l) in enumerate(((47, 14, 13), (34, 11, 10), (22, 8, 7))):
        for i in range(n):
            a = i / n * 6.283 + ring * 0.2; cx, cy = 4 + math.cos(a) * r, 232 + math.sin(a) * r * 0.86; nx, ny = -math.sin(a), math.cos(a) * 0.86
            h.flat([(cx + nx * 3.4, cy + ny * 3.4), (cx - nx * 3.4, cy - ny * 3.4), (cx - math.cos(a) * l, cy - math.sin(a) * l * 0.86)], BONE if (i + ring) % 3 else '#c9b98a', smooth=False)
    parts.append(h)
    for side in (-1, 1):   # two hooked mandibles to pull the rock (and you) in
        role = ARM_F if side > 0 else ARM_B
        a = part('%s_%s' % (cn, role), role, (4 + side * 52, 214), 3)
        a.shape(path_limb([(4 + side * 50, 212), (4 + side * 92, 236), (4 + side * 98, 278), (4 + side * 70, 300)], [11, 9, 6, 1.2], n_end=4), plate)
        a.flat(path_limb([(4 + side * 90, 258), (4 + side * 78, 250)], [3, 0.8], n_end=3), '#d8ccb0')
        parts.append(a)
    return parts


# ================================================================== 8. THE MULE: hauled ore carts alive, and is plated in what it hauled.
def mule():
    m = man('Mule', 480, w=1.5, hw=1.1, skin='#8a7466', top='#8a7466', pants='#34302c', boot='#201a18', belly=0.5, chest=1.1, slump=0.2, leg_bulk=1.55, foot_w=1.3, stance=(34, 38, 38),
            jaw=0.0, eye='#ffb04a', gaunt=1.1, teeth=(0, 0), sleeve=False, arm_bulk=1.75, hr=11, curl=(0.8, 0.8), belt='', pose=dict(L=((-90, 250), (-96, 188), -94), R=((90, 250), (98, 188), -86)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    rock = ['#4a4640', '#3a3632', '#565048']
    for i, pts in enumerate(([(-58, 316), (-8, 322), (-12, 270), (-50, 262)], [(8, 322), (58, 314), (52, 266), (12, 274)], [(-40, 258), (36, 262), (30, 214), (-34, 218)])):   # slabs of ore strapped across him
        b.flat(q(k, pts), rock[i], smooth=False); b.flat(q(k, [pts[0], pts[1], ((pts[1][0] + pts[2][0]) / 2, (pts[1][1] + pts[2][1]) / 2 + 8)]), light(rock[i], 1.12), smooth=False)
    for y in (300, 244):
        b.flat(q(k, [(-64, y + 4), (64, y + 4), (64, y - 4), (-64, y - 4)]), '#2a2a2e', smooth=False)
        for x in (-48, -16, 16, 48):
            b.flat(ellipse(x * k, y * k, 2.6 * k, 2.6 * k, n=6), '#8a8f99')
    for s in (-1, 1):   # the yoke across his shoulders, a chain off each end
        b.flat(q(k, [(s * 10, 336), (s * 74, 332), (s * 78, 322), (s * 10, 326)]), '#5a3e28', smooth=False)
        for j in range(7):
            b.flat(ellipse(s * 74 * k, (314 - j * 10) * k, (3 if j % 2 else 4.4) * k, (5 if j % 2 else 3.6) * k, n=8), '#6a6e76' if j % 2 else '#8a8f99')
    # blinkers and a muzzle: they kept him facing forward
    P(h, [(X(-23), Y(52)), (X(23), Y(52)), (X(24), Y(20)), (X(12), Y(-2)), (X(-12), Y(-2)), (X(-24), Y(20))], '#3a2a20')
    for s in (-1, 1):
        P(h, [(X(s * 21), Y(42)), (X(s * 31), Y(40)), (X(s * 31), Y(22)), (X(s * 21), Y(24))], '#2a1e18'); h.flat(ellipse(X(s * 10), Y(31), 4.6 * u, 3.6 * u, n=10), '#120c0c'); h.flat(ellipse(X(s * 10), Y(31), 1.9 * u, 1.9 * u, n=8), '#ffb04a')
    for i in range(5):
        h.flat(rect(X(-10 + i * 5 - 0.9), Y(2), X(-10 + i * 5 + 0.9), Y(16)), '#8a8f99', smooth=False)
    h.flat(rect(X(-13), Y(15), X(13), Y(17.5)), '#8a8f99', smooth=False); h.flat(rect(X(-13), Y(0), X(13), Y(2.5)), '#8a8f99', smooth=False)
    for a in (m.aL, m.aR):
        c = a.hand_c
        for j in range(5):
            a.flat(ellipse(c[0], c[1] - (8 + j * 10) * k, (3.2 if j % 2 else 4.6) * k, (5.4 if j % 2 else 4) * k, n=8), '#6a6e76' if j % 2 else '#8a8f99')
    return m.parts()


# ================================================================== 9. NUGGET THIEF: making for the lift with a sack of silver.
def nugget():
    silver = '#c9cdd6'
    m = man('Nugget', 384, w=0.96, skin='#aab0ba', top='#4a4640', pants='#35322e', slump=0.3, jaw=0.25, eye='#ffffff', gaunt=0.96, teeth=(6, 4), torn=(0.2, 0.0), sleeve_to=(0.9, 0.9), curl=(0.9, 0.3), claw='#5a5e66',
            pose=dict(L=((-70, 276), (-58, 318), 70), R=((62, 250), (64, 196), -86)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    sack = part('Nugget_Prop', PROP, (-58 * k, 290 * k), 0.5)
    sd = S(sack, q(k, [(-52, 330), (-78, 320), (-98, 280), (-94, 236), (-66, 222), (-44, 240), (-40, 290)]), '#6a5e50')
    sack.clipped(sd, q(k, [(-90, 268), (-70, 252), (-58, 276), (-76, 290)]), '#54493c', smooth=False)
    S(sack, q(k, [(-56, 334), (-44, 340), (-40, 326), (-52, 322)]), '#54493c')
    for (x, y) in ((-70, 232), (-83, 228), (-58, 226), (-76, 240)):
        sack.flat(q(k, [(x - 6, y - 3), (x - 2, y + 5), (x + 5, y + 3), (x + 6, y - 4)]), silver, smooth=False); sack.flat(q(k, [(x - 2, y + 5), (x + 5, y + 3), (x + 1, y)]), '#ffffff', smooth=False)
    m.extra.append(sack)
    b.clipped(td, q(k, [(-12, 331), (12, 331), (6, 250), (-6, 250)]), '#8a8474', smooth=False)
    b.clipped(td, q(k, [(-60, 318), (-40, 328), (30, 250), (20, 244)]), '#54493c', smooth=False)
    for (x, y, r) in ((24, 296, 5), (-26, 270, 4), (34, 262, 3.5)):
        b.clipped(td, ellipse(x * k, y * k, r * k, r * k, n=6), silver)
    for (x, y, r) in ((-10, 48, 3), (12, 20, 2.4), (-14, 14, 2)):
        h.clipped(m.hd, ellipse(X(x), Y(y), r * u, r * u, n=6), '#ffffff')
    _helmet(m, '#3a3630', lamp=False)
    return m.parts()


# ================================================================== BOSS 1. THE SHIFT BOSS: derby hat, watch chain, and a steam drill.
def shift_boss():
    m = man('ShiftBoss', 500, w=1.42, hw=1.08, skin='#a8866c', top='#c8bca4', pants='#2a2a30', boot='#1c1614', leg_bulk=1.5, foot_w=1.3, stance=(34, 38, 38), belly=0.35,
            jaw=0.35, eye='#ffb060', gaunt=1.1, teeth=(6, 4), brow=1.6, sleeve_to=(0.5, 0.5), arm_bulk=1.7, hr=10.5, curl=(0.9, 0.9), belt='#1c1614',
            pose=dict(L=((-90, 252), (-70, 206), -40), R=((92, 250), (74, 204), -140)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    for s in (-1, 1):   # a waistcoat that no longer meets
        b.clipped(td, q(k, [(s * 9, 331), (s * 84, 331), (s * 84, 228), (s * 16, 234), (s * 22, 280)]), '#3a3a44', smooth=False)
        for i in range(3):
            b.clipped(td, ellipse(s * 21 * k, (272 - i * 14) * k, 2 * k, 2 * k, n=6), '#b9974a')
    b.clipped(td, path_limb(q(k, [(22, 262), (34, 250), (50, 258)]), [1.2 * k] * 3, n_end=3), '#b9974a'); b.clipped(td, ellipse(52 * k, 254 * k, 6 * k, 6 * k, n=10), '#d8b85a')   # the watch that timed the shift
    wound(b, td, (-30 * k, 300 * k), 14 * k, seed=6)
    for s in (-1, 1):   # walrus moustache
        h.flat([(X(s * 1), Y(16)), (X(s * 9), Y(17)), (X(s * 17), Y(9)), (X(s * 17), Y(1)), (X(s * 10), Y(9)), (X(s * 1), Y(12.5))], '#3a2a20')
    P(h, [(X(-22), Y(48)), (X(-20), Y(62)), (X(-10), Y(70)), (X(10), Y(70)), (X(20), Y(62)), (X(22), Y(48))], '#1c1a22')                      # a derby
    P(h, [(X(-31), Y(47)), (X(31), Y(47)), (X(27), Y(51.5)), (X(-27), Y(51.5))], '#16141a'); h.flat(rect(X(-21.5), Y(51.5), X(21.5), Y(55)), '#5a2a24', smooth=False)
    # the drill, held across him in both fists: a cylinder, a hose, and a bit as long as your arm
    d = part('ShiftBoss_Prop', PROP, (0, 204 * k), 3.5)
    P(d, q(k, [(-96, 222), (40, 222), (40, 186), (-96, 186)]), '#5a5e66'); d.flat(q(k, [(-96, 222), (40, 222), (40, 214), (-96, 214)]), '#8a8f99', smooth=False)
    for x in (-80, -40, 0):
        d.flat(q(k, [(x - 4, 224), (x + 4, 224), (x + 4, 184), (x - 4, 184)]), '#33363c', smooth=False)
    P(d, q(k, [(40, 216), (64, 212), (64, 196), (40, 192)]), '#33363c')
    d.flat(q(k, [(64, 208), (150, 205), (166, 204), (150, 203), (64, 200)]), '#c9cdd6', smooth=False)
    for i in range(6):
        d.flat(q(k, [(72 + i * 13, 208), (78 + i * 13, 208), (74 + i * 13, 200), (68 + i * 13, 200)]), '#6a6e76', smooth=False)
    d.flat(path_limb(q(k, [(-96, 204), (-120, 196), (-128, 150), (-112, 110)]), [5 * k, 5 * k, 4.6 * k, 4 * k], n_end=4), '#2a2226')
    for (x, y) in ((-104, 232), (-112, 244), (-98, 250)):
        d.flat(ellipse(x * k, y * k, 7 * k, 6 * k, n=9), '#e8e4dc', opacity=0.7)                                                               # steam off the back
    m.extra.append(d)
    return m.parts()


# ================================================================== BOSS 2. THE CANARY: the cage, and what stopped singing in it.
def canary():
    cn = 'Canary'; F = fig(470, w=0.95); k = F['k']
    plume, bone, glow = '#c9a82a', '#d9cfb8', '#ffe27a'
    parts = [bird_leg(cn, -1, 34, k, '#8a7c62', plume, 3), bird_leg(cn, 1, 34, k, '#8a7c62', plume, 3)]
    for side in (-1, 1):
        role = WING_F if side > 0 else WING_B
        w = part('%s_%s' % (cn, role), role, (side * 56 * k, 312 * k), 0.5)
        sh, el, wr = (side * 56 * k, 312 * k), (side * 136 * k, 366 * k), (side * 224 * k, 318 * k)
        feathers(w, wr, (side * 318 * k, 244 * k), 7, plume, 1.05, droop=side * 0.25, seed=11 + side)
        feathers(w, el, (side * 186 * k, 200 * k), 6, shade(plume, 0.9), 0.8, droop=side * 0.1, seed=17 + side)
        feathers(w, sh, (side * 96 * k, 196 * k), 5, plume, 0.7, seed=23 + side)
        S(w, path_limb([sh, el, wr], [14 * k, 10 * k, 6 * k]), shade(plume, 0.8))
        for (t, r) in ((0.3, 9), (0.62, 7)):   # the feathers are coming out in patches
            c = lerp(el, wr, t); w.flat(ellipse(c[0], c[1] - 26 * k, r * k, r * 1.4 * k, n=8), '#3a2c1e')
        parts.append(w)
    b, td = body(cn, F, '#2a2420', half=[(0, 331), (9, 331), (28, 327), (48, 320), (52, 300), (50, 270), (44, 240), (36, 218), (40, 204), (40, 190), (26, 176), (0, 170)], pivot=(0, 196 * k))
    b.clipped(td, ellipse(0, 266 * k, 30 * k, 44 * k, n=16), '#120e0c')
    b.clipped(td, ellipse(0, 262 * k, 15 * k, 19 * k, n=12), glow); b.clipped(td, ellipse(-2 * k, 265 * k, 8 * k, 10 * k, n=10), '#fff6c8')        # what is left of the bird, still lit
    b.clipped(td, q(k, [(-3, 250), (3, 250), (0, 240)]), '#c9861e', smooth=False)
    for x in (-36, -24, -12, 0, 12, 24, 36):   # the bars
        b.clipped(td, q(k, [(x - 1.6, 322), (x + 1.6, 322), (x * 0.9 + 1.6, 206), (x * 0.9 - 1.6, 206)]), '#b9974a', smooth=False)
    for y in (318, 268, 212):
        b.clipped(td, rect(-70 * k, (y - 3) * k, 70 * k, (y + 3) * k), '#8a6a2a', smooth=False)
    b.flat(ellipse(0, 338 * k, 6 * k, 5 * k, n=8), '#8a6a2a')
    feathers(b, (0, 226 * k), (0, 124 * k), 9, plume, 1.4, seed=31)
    parts.append(b)
    h, hd, L = skull(cn, F, '#d8c47a', jaw=0.0, eye=glow, hair=None, gaunt=0.84, ears=False, teeth=(0, 0))
    X, Y, u = L['X'], L['Y'], L['u']
    S(h, [(X(-9), Y(22)), (X(9), Y(22)), (X(6), Y(6)), (X(0), Y(-18)), (X(-6), Y(6))], '#c9861e')                                             # a short seed-cracker's beak
    h.flat([(X(-9), Y(22)), (X(9), Y(22)), (X(5), Y(15)), (X(-5), Y(15))], '#e8a83a', smooth=False); h.flat([(X(-6), Y(7)), (X(6), Y(7)), (X(5.4), Y(4.6)), (X(-5.4), Y(4.6))], '#3a2410', smooth=False)
    for i in range(5):   # a crest
        a = math.radians(60 + i * 15); h.flat([(X(-3 + i * 1.5), Y(54)), (X(1 + i * 1.5), Y(54)), (X(math.cos(a) * 26), Y(54 + math.sin(a) * 26))], plume if i % 2 else shade(plume, 0.8), smooth=False)
    for s in (-1, 1):
        feathers(h, (X(s * 14), Y(4)), (X(s * 30), Y(-26)), 4, plume, 0.9, seed=41 + s)
    parts.append(h)
    return parts


# ================================================================== BOSS 3. THE MOTHERLODE: ore, crystal, and whoever dug too close.
def motherlode():
    cn = 'Motherlode'; k = 1.0
    rock, rock2, cr1, cr2 = '#4a5560', '#394450', '#8ad8ff', '#b58cff'
    def spike(p, x, y, l, w, ang, col):
        a = math.radians(ang); ex, ey = x + math.cos(a) * l, y + math.sin(a) * l; nx, ny = -math.sin(a) * w, math.cos(a) * w
        p.flat([(x + nx, y + ny), (x + math.cos(a) * l * 0.7 + nx * 0.8, y + math.sin(a) * l * 0.7 + ny * 0.8), (ex, ey), (x + math.cos(a) * l * 0.7 - nx * 0.8, y + math.sin(a) * l * 0.7 - ny * 0.8), (x - nx, y - ny)], col, smooth=False)
        p.flat([(x + nx * 0.2, y + ny * 0.2), (ex, ey), (x + math.cos(a) * l * 0.7 + nx * 0.8, y + math.sin(a) * l * 0.7 + ny * 0.8), (x + nx, y + ny)], light(col, 1.25), smooth=False)
    parts = []
    for side in (-1, 1):
        role = LEG_F if side > 0 else LEG_B
        p = part('%s_%s' % (cn, role), role, (side * 60, 130), 0)
        p.shape([(side * 30, 150), (side * 96, 150), (side * 104, 70), (side * 112, 0), (side * 28, 0), (side * 36, 70)], rock2, smooth=False)
        p.flat([(side * 36, 70), (side * 104, 70), (side * 100, 58), (side * 40, 58)], shade(rock2, 0.7), smooth=False)
        spike(p, side * 96, 96, 44, 9, 90 - side * 50, cr1)
        parts.append(p)
    b = part(cn + '_Body', BODY, (0, 130), 1)
    td = S(b, [(-150, 330), (-60, 372), (40, 380), (140, 342), (176, 262), (150, 170), (90, 120), (-80, 116), (-160, 176), (-184, 258)], rock, smooth=False)
    for pts, c in (([(-150, 330), (-60, 372), (-40, 300), (-120, 270)], light(rock, 1.14)), ([(40, 380), (140, 342), (110, 280), (20, 310)], light(rock, 1.08)), ([(-184, 258), (-120, 270), (-90, 180), (-160, 176)], shade(rock, 0.8)), ([(110, 280), (176, 262), (150, 170), (96, 200)], shade(rock, 0.74)), ([(-90, 180), (96, 200), (90, 120), (-80, 116)], shade(rock, 0.66))):
        b.clipped(td, pts, c, smooth=False)
    b.clipped(td, [(-40, 300), (20, 310), (36, 236), (-10, 210), (-56, 240)], '#1a1418', smooth=False)                                        # a hollow in the chest
    F = F1(232, hw=17); hh, hd2, L2 = skull(cn + 'In', F, '#b9b0a0', jaw=0.9, eye=cr1, hair=None, neck=False, ears=False)                        # and a face in it
    # crystals have grown through him at the shoulders and the back
    for (x, y, l, w, ang, c) in ((-120, 330, 150, 20, 118, cr1), (-80, 356, 110, 16, 100, cr2), (-150, 300, 96, 14, 146, cr2), (100, 352, 170, 22, 66, cr2), (140, 320, 120, 16, 40, cr1), (60, 372, 90, 13, 84, cr1), (170, 250, 70, 12, 14, cr1), (-180, 240, 64, 11, 170, cr1)):
        spike(b, x, y, l, w, ang, c)
    for (x, y, r) in ((-110, 220, 9), (70, 160, 8), (126, 232, 7), (-40, 150, 6)):
        b.clipped(td, [(x - r, y), (x, y + r * 1.3), (x + r, y), (x, y - r * 1.3)], cr1, smooth=False)
    parts.append(b)
    hh.name = cn + '_Head'; hh.role = HEAD; hh.pivot = (-8, 250); hh.layer = 2
    X, Y, u = L2['X'], L2['Y'], L2['u']
    P(hh, [(X(-23), Y(43)), (X(-21), Y(56)), (X(0), Y(64)), (X(21), Y(56)), (X(23), Y(43)), (X(0), Y(47))], '#2e2a28')                          # still in his cap
    spike(hh, X(14), Y(50), 34 * u, 5 * u, 70, cr2); spike(hh, X(-12), Y(54), 24 * u, 4 * u, 112, cr1)
    parts.append(hh)
    for side in (-1, 1):
        role = ARM_F if side > 0 else ARM_B
        a = part('%s_%s' % (cn, role), role, (side * 160, 300), 3)
        a.shape([(side * 136, 330), (side * 200, 318), (side * 232, 236), (side * 244, 140), (side * 262, 84), (side * 196, 60), (side * 168, 110), (side * 176, 220)], rock2 if side < 0 else rock, smooth=False)
        a.flat([(side * 176, 220), (side * 232, 236), (side * 244, 140), (side * 172, 130)], shade(rock2, 0.76), smooth=False)
        for (x, y, l, w, ang, c) in ((214, 60, 70, 13, -90 - side * 0, cr1), (240, 74, 58, 11, -62, cr2), (190, 62, 54, 10, -112, cr2)):
            spike(a, side * x, y, l, w, ang if side > 0 else 180 - ang, c)
        spike(a, side * 214, 300, 60, 11, 90 - side * 30, cr1)
        parts.append(a)
    return parts


# ================================================================== BOSS 4. THE KING BELOW: what the mine was dug to reach.
def deep_king():
    glow = '#6af0c0'
    m = man('DeepKing', 600, w=0.9, hw=0.96, skin='#4a4a5a', top='#17161c', pants='#17161c', boot='#0e0d10', slump=0.5, chest=0.96, jaw=1.5, eye=None, gaunt=0.8, teeth=(9, 8), ears=False, brow=2.0,
            torn=(0.0, 0.0), sleeve_to=(0.55, 0.55), claw='#c9cdd6', curl=(0.0, 0.0), arm_bulk=0.8, hr=9, belt=None,
            pose=dict(L=((-66, 236), (-80, 150), -98), R=((66, 236), (82, 152), -82)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    rnd = random.Random(8)
    hem = [(-52, 250), (-66, 150)] + [(-66 + i * 12, 96 + (0 if i % 2 else rnd.uniform(10, 34))) for i in range(12)] + [(66, 150), (52, 250), (50, 320), (-50, 320)]
    P(b, q(k, hem), '#17161c')                                                                                                                 # a robe of something wet, in rags to the knee
    for (pts, w) in (([(0, 318), (-6, 280), (5, 246), (-4, 206), (2, 170)], 3), ([(-6, 280), (-28, 268)], 2), ([(5, 246), (30, 236)], 2), ([(-4, 206), (-24, 190)], 1.6)):   # light comes up through the cracks in him
        b.flat(path_limb(q(k, pts), [w * k] * (len(pts) - 1) + [0.5 * k], n_end=3), glow)
    h.clipped(m.hd, ellipse(X(0), Y(-1), 6 * u, 9 * u, n=12), glow, opacity=0.9); h.clipped(m.hd, ellipse(X(0), Y(0), 3 * u, 5 * u, n=10), '#eafff6')   # and out of his throat
    for (x, l, a) in ((-17, 30, 108), (-10, 44, 98), (-2, 36, 92), (7, 50, 84), (15, 32, 72)):   # a crown of stone teeth, grown, not made
        r = math.radians(a); h.flat([(X(x - 3.4), Y(54)), (X(x + 3.4), Y(54)), (X(x + math.cos(r) * l), Y(54 + math.sin(r) * l))], '#4a4a56' if x % 2 else '#3a3a44', smooth=False)
    h.flat(path_limb([(X(0), Y(56)), (X(6), Y(84)), (X(26), Y(96)), (X(42), Y(80)), (X(44), Y(56))], [2 * u, 1.6 * u, 1.3 * u, 1.1 * u, 0.9 * u], n_end=3), '#2a2a34')   # the lure
    h.flat(ellipse(X(44), Y(46), 9 * u, 11 * u, n=14), glow); h.flat(ellipse(X(42.5), Y(48.5), 4.4 * u, 5.4 * u, n=10), '#eafff6')
    return m.parts()


# ================================================================== BOSS 5. BARON BLACKWATER: he sealed the shaft with the night shift in it.
def baron():
    silver, glow, coat = '#c9cdd6', '#eaf6ff', '#1c1a24'
    m = man('Baron', 630, w=1.4, hw=1.04, skin='#b9b0a0', top=coat, pants='#201c26', boot='#0e0d10', leg_bulk=1.4, foot_w=1.3, stance=(34, 38, 38), belly=0.45, chest=1.08,
            jaw=0.45, eye=glow, gaunt=0.96, teeth=(8, 6), brow=1.8, sleeve_to=(0.9, 0.9), arm_bulk=1.45, hr=10, curl=(0.25, 0.9), belt=None,
            sh=(74, 314), pose=dict(L=((-104, 262), (-114, 204), -100), R=((104, 258), (118, 206), -84)))
    b, td, k, h, X, Y, u = m.b, m.td, m.k, m.h, m.X, m.Y, m.u
    for side in (-1, 1):   # pickaxes fanned behind each shoulder: one for every man he left down here
        pr = part('Baron_Prop%s' % ('L' if side < 0 else 'R'), PROP, (side * 70 * k, 318 * k), 0.5)
        for i in range(4):
            a = math.radians(90 - side * (22 + i * 24)); base = (side * 66 * k, 316 * k); t = (base[0] + math.cos(a) * 118 * k, base[1] + math.sin(a) * 118 * k); nx, ny = -math.sin(a), math.cos(a)
            pr.flat(path_limb([base, t], [3 * k, 3 * k], n_end=3), '#5a4632')
            pr.flat(path_limb([(t[0] - nx * 40 * k - math.cos(a) * 12 * k, t[1] - ny * 40 * k - math.sin(a) * 12 * k), t, (t[0] + nx * 40 * k - math.cos(a) * 12 * k, t[1] + ny * 40 * k - math.sin(a) * 12 * k)], [0.8 * k, 5 * k, 0.8 * k], n_end=3), silver)
        m.extra.append(pr)
    b.flat(q(k, [(-54, 240), (54, 240), (70, 116), (42, 100), (20, 168), (0, 190), (-20, 168), (-42, 100), (-70, 116)]), coat, smooth=False)   # the skirts of the greatcoat
    cav = b.flat(q(k, [(-30, 316), (30, 316), (36, 276), (26, 246), (-26, 246), (-36, 276)]), '#101418', clip_to=td)
    b.clipped(cav, ellipse(-3 * k, 284 * k, 14 * k, 16 * k, n=8), silver); b.clipped(cav, q(k, [(-12, 292), (-3, 300), (6, 290), (-2, 280)]), glow, smooth=False)   # a heart of raw silver
    for s in (-1, 1):
        for i in range(5):
            y = 310 - i * 14
            b.clipped(td, path_limb(q(k, [(s * 3, y), (s * 22, y - 3), (s * 36, y - 14)]), [2.6 * k, 2.4 * k, 1.6 * k], n_end=3), '#e0d6bc')
        b.clipped(td, q(k, [(s * 9, 331), (s * 44, 330), (s * 52, 300), (s * 44, 270), (s * 34, 246), (s * 28, 246), (s * 38, 276), (s * 32, 316)]), '#5a4a3e', smooth=False)   # a fur collar and lapels
        for i in range(3):
            b.clipped(td, ellipse(s * 50 * k, (232 - i * 22) * k, 3 * k, 3 * k, n=8), silver)
    b.clipped(td, q(k, [(-2.6, 320), (2.6, 320), (2.2, 252), (-2.2, 252)]), '#e0d6bc', smooth=False)
    for s in (-1, 1):   # mutton chops
        S(h, [(X(s * 14), Y(30)), (X(s * 23), Y(28)), (X(s * 25), Y(8)), (X(s * 17), Y(-6)), (X(s * 12), Y(6))], '#d8d2c6')
    h.flat(ellipse(X(9.6), Y(30.6), 6.4 * u, 6.4 * u, n=14), '#b9974a'); h.flat(ellipse(X(9.6), Y(30.6), 4.8 * u, 4.8 * u, n=12), glow); h.flat(path_limb([(X(14), Y(26)), (X(20), Y(4)), (X(16), Y(-18))], [0.5 * u] * 3, n_end=2), '#b9974a')   # a monocle on its chain
    P(h, [(X(-18), Y(50)), (X(18), Y(50)), (X(20), Y(108)), (X(-20), Y(108))], '#0e0d10'); P(h, [(X(-31), Y(49)), (X(31), Y(49)), (X(29), Y(53.5)), (X(-29), Y(53.5))], '#17151b')
    h.flat([(X(-18.3), Y(54)), (X(18.3), Y(54)), (X(18.7), Y(64)), (X(-18.7), Y(64))], silver, smooth=False)
    c = m.aR.hand_c   # a cane with a pick for a head
    m.aR.flat(path_limb([(c[0], c[1] + 30 * k), (c[0] + 4 * k, c[1] - 196 * k)], [3 * k, 2.4 * k], n_end=4), '#0e0d10')
    m.aR.flat(path_limb([(c[0] - 34 * k, c[1] + 22 * k), (c[0], c[1] + 34 * k), (c[0] + 34 * k, c[1] + 22 * k)], [0.8 * k, 5 * k, 0.8 * k], n_end=3), silver)
    return m.parts()


ROSTER = [
    ('PitHand', pit_hand), ('Tallow', tallow), ('PaleCrawler', pale_crawler), ('Gasbag', gasbag), ('Powderman', powderman), ('GloomBat', gloom_bat), ('Rockworm', rockworm), ('Mule', mule), ('Nugget', nugget),
    ('ShiftBoss', shift_boss), ('Canary', canary), ('Motherlode', motherlode), ('DeepKing', deep_king), ('Baron', baron),
]
