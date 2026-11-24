"""The Descent: what lives below the six maps. None of it was ever a person."""
from kit3 import *   # noqa: F401,F403


def Qk(k):
    return lambda pts: [(x * k, y * k) for x, y in pts]


# ================================================================== spiders
def spider(cn, k=1.0, col='#3c323c', dark='#221a24', eye='#ff3a2a', mark='#c0322a', eggs=False):
    Q = Qk(k); parts = []
    for side in (-1, 1):
        for j in (0, 1):
            role = (LEG_B if side < 0 else LEG_F) if j == 0 else (ARM_B if side < 0 else ARM_F)
            p = pt(cn, role, (side * 20 * k, 44 * k), 0 if j == 0 else 3)
            for i in (0, 1):
                n = j * 2 + i
                knee = (side * (60 + n * 15), 96 - n * 12); foot = (side * (112 + n * 4 - (n == 3) * 34), 0)
                S(p, path_limb(Q([(side * 20, 48 - n * 3), knee, foot]), [7 * k, 5.4 * k, 2 * k], n_end=4), col if j else dark)
                p.flat(ellipse(knee[0] * k, knee[1] * k, 6.4 * k, 6.4 * k, n=8), dark)
            parts.append(p)
    b = pt(cn, BODY, (0, 50 * k), 1)
    td = S(b, Q(M([(0, 112), (28, 108), (46, 88), (48, 62), (34, 44), (0, 38)])), col)
    b.clipped(td, Q([(-11, 100), (11, 100), (2.5, 82), (13, 64), (-13, 64), (-2.5, 82)]), mark, smooth=False)
    spikes(b, [(x * k, (104 - abs(x) * 0.5) * k, 9 * k, 2 * k, 90 + x) for x in (-30, -16, 0, 16, 30)], dark)
    if eggs:
        for (x, y, r) in ((-30, 78, 9), (28, 84, 8), (-22, 56, 7), (26, 58, 9), (0, 52, 6)):
            b.clipped(td, ellipse(x * k, y * k, r * k, r * k, n=10), '#d8d0b0'); b.clipped(td, ellipse(x * k + 2, y * k + 2, r * k * 0.4, r * k * 0.4, n=6), '#fff8e0')
    parts.append(b)
    h = pt(cn, HEAD, (0, 50 * k), 2)
    for s in (-1, 1):
        h.flat(path_limb(Q([(s * 8, 30), (s * 13, 18), (s * 6, 6)]), [5 * k, 4 * k, 1.4 * k], n_end=3), dark)
        spikes(h, [(s * 6 * k, 8 * k, 9 * k, 2.2 * k, -90 - s * 20)], BONE)
    S(h, Q(M([(0, 64), (17, 62), (27, 48), (24, 34), (12, 25), (0, 23)])), light(col, 1.25))
    for s in (-1, 1):
        geye(h, s * 9 * k, 46 * k, 6.5 * k, eye); geye(h, s * 19 * k, 50 * k, 3.6 * k, eye); h.circle(s * 5 * k, 57 * k, 2.2 * k, eye); h.circle(s * 14 * k, 59 * k, 1.8 * k, eye)
    parts.append(h)
    return parts


def skitterling():
    return spider('Skitterling', 0.78, '#4a3a2c', '#2a2018', '#ffb020', '#d8a03a')


def webspinner():
    return spider('Webspinner', 1.35, '#34303e', '#1e1a26', '#7aff5a', '#5ad83a')


# ================================================================== slime
def slime(cn, k=1.0, col='#4a6a3a', deep='#1e3018', eye='#d8ff7a', crown=False):
    Q = Qk(k); parts = []
    b = pt(cn, BODY, (0, 30 * k), 1)
    for (x, r) in ((-84, 18), (74, 22), (96, 9), (-56, 10)):   # what it leaves behind it
        b.flat(ellipse(x * k, 5 * k, r * k, 5 * k, n=10), deep)
    td = S(b, Q([(0, 138), (30, 132), (58, 108), (74, 70), (84, 30), (70, 6), (0, 0), (-66, 4), (-78, 34), (-66, 78), (-50, 104), (-24, 126)]), col, opacity=0.94)
    b.clipped(td, Q([(-60, 60), (-20, 100), (30, 96), (60, 50), (40, 14), (-30, 10)]), deep, opacity=0.75)   # the dark in the middle of it
    # what it has not finished with: skulls, a ribcage, an arm
    sk = [(-26, 86, 1.0, -0.2), (22, 58, 0.8, 0.3)] + ([(4, 104, 0.7, 0.1), (-40, 44, 0.75, -0.5), (44, 92, 0.6, 0.4)] if crown else [])
    for (x, y, z, r) in sk:
        c, sn = math.cos(r), math.sin(r); T = lambda pts: [((x + (px * c - py * sn) * z) * k, (y + (px * sn + py * c) * z) * k) for px, py in pts]
        b.clipped(td, T(M([(0, 16), (13, 13), (16, 0), (10, -12), (5, -20), (0, -21)])), BONE, opacity=0.9)
        for e in (-1, 1):
            b.clipped(td, T([(e * 3, 3), (e * 11, 6), (e * 11, -3), (e * 4, -5)]), '#0c0608', smooth=False); b.clipped(td, T([(e * 6, 1), (e * 8, 1), (e * 7, -1)]), eye, smooth=False)
        b.clipped(td, T([(-2, -8), (2, -8), (0, -13)]), '#0c0608', smooth=False); b.clipped(td, T([(-7, -15), (7, -15), (6, -18), (-6, -18)]), '#0c0608', smooth=False)
    for i in range(4):
        b.clipped(td, Q([(-8, 46 - i * 9), (16, 40 - i * 9), (36, 46 - i * 9), (36, 43 - i * 9), (16, 37 - i * 9), (-8, 43 - i * 9)]), BONE, opacity=0.8)
    b.clipped(td, path_limb(Q([(-58, 30), (-30, 22), (-6, 30)]), [3.4 * k, 2.6 * k, 3 * k], n_end=3), BONE, opacity=0.8)
    for (x, y, l) in ((-70, 40, 30), (78, 34, 26), (60, 90, 18), (-52, 96, 22)):   # it runs
        b.flat(path_limb(Q([(x, y), (x + 2, y - l)]), [5 * k, 1.6 * k], n_end=3), col, opacity=0.94)
    parts.append(b)
    h = pt(cn, HEAD, (0, 70 * k), 2)   # no face: a wound that opens, full of teeth
    h.flat(Q([(-4, 132), (8, 112), (16, 84), (10, 52), (-2, 34), (-12, 60), (-16, 90), (-12, 116)]), '#16040a')
    for i in range(7):
        y = 118 - i * 12; w = 11 - abs(i - 3) * 1.6
        h.flat(Q([(-13 + i % 2, y), (-13 + i % 2, y - 7), (-13 + w, y - 3)]), BONE, smooth=False); h.flat(Q([(13, y - 5), (13, y - 12), (13 - w, y - 9)]), BONE, smooth=False)
    parts.append(h)
    for side in (-1, 1):   # what it reaches with: an arm of itself with a dead hand on the end
        a = pt(cn, ARM_F if side > 0 else ARM_B, (side * 66 * k, 60 * k), 3)
        S(a, path_limb(Q([(side * 62, 62), (side * 98, 80), (side * 124, 56)]), [15 * k, 10 * k, 6 * k], n_end=5), col, opacity=0.94)
        for j in range(3):
            a.flat(path_limb(Q([(side * 122, 58), (side * (136 + j * 4), 50 - j * 8), (side * (146 + j * 2), 36 - j * 9)]), [2.4 * k, 2 * k, 0.8 * k], n_end=3), BONE)
        parts.append(a)
    return parts


def ooze():
    return slime('Ooze')


# ================================================================== the eye
def eyeball(cn, k=1.0, flesh='#8a3a4a', iris='#ffcf3a', vein='#c0322a', ring=0):
    Q = Qk(k); parts = []
    t = pt(cn, TAIL, (0, 96 * k), 0)
    rnd = random.Random(5)
    for i in range(6):   # the nerves it trails
        x = (i - 2.5) * 13
        tendril(t, Q([(x, 96), (x + rnd.uniform(-10, 10), 64), (x + rnd.uniform(-16, 16), 34), (x + rnd.uniform(-20, 20), 8)]), 6 * k, shade(flesh, 0.75 + (i % 2) * 0.2))
    parts.append(t)
    for side in (-1, 1):
        w = pt(cn, WING_F if side > 0 else WING_B, (side * 46 * k, 140 * k), 1)
        for (dx, dy, r) in ((60, 30, 8), (72, -6, 7), (50, -40, 6)):
            tendril(w, Q([(side * 44, 140), (side * (44 + dx * 0.5), 140 + dy * 0.2 + 18), (side * (44 + dx), 140 + dy)]), r * k, shade(flesh, 0.8))
            if ring:
                geye(w, side * (44 + dx) * k, (140 + dy) * k, 7 * k, iris)
        parts.append(w)
    b = pt(cn, BODY, (0, 140 * k), 2)
    td = S(b, ellipse(0, 140 * k, 56 * k, 54 * k, n=22), '#e8dccc', hl='#ffffff')
    rnd = random.Random(9)
    for i in range(9):   # veins in from the rim
        a = i / 9 * math.tau + 0.3; r0 = 56; r1 = rnd.uniform(26, 36)
        b.clipped(td, path_limb(Q([(math.cos(a) * r0, 140 + math.sin(a) * r0), (math.cos(a + 0.2) * (r0 + r1) / 2, 140 + math.sin(a + 0.2) * (r0 + r1) / 2), (math.cos(a) * r1, 140 + math.sin(a) * r1)]), [2.6 * k, 1.8 * k, 0.6 * k], n_end=3), vein)
    b.clipped(td, Q(M([(0, 196), (40, 190), (58, 168), (60, 150), (0, 166)])), flesh)   # the lid, half down
    parts.append(b)
    h = pt(cn, HEAD, (0, 136 * k), 3)
    h.flat(ellipse(0, 134 * k, 27 * k, 27 * k, n=18), shade(iris, 0.6)); h.flat(ellipse(0, 134 * k, 23 * k, 23 * k, n=18), iris)
    h.flat(ellipse(0, 134 * k, 4 * k, 20 * k, n=12), '#0c0608')
    parts.append(h)
    return parts


def watcher():
    return eyeball('Watcher')


# ================================================================== hounds
def hound(cn, k=1.0, fur='#3a2a26', dark='#1e1414', glow='#ff7a2a', bone=False):
    Q = Qk(k); parts = []
    for side in (-1, 1):   # hind legs, seen past the front ones
        p = pt(cn, LEG_F if side > 0 else LEG_B, (side * 34 * k, 70 * k), 0)
        S(p, path_limb(Q([(side * 34, 74), (side * 50, 40), (side * 44, 4)]), [13 * k, 8 * k, 5 * k], n_end=4), dark)
        spikes(p, [((side * 44 + j * 5) * k, 3 * k, 8 * k, 1.6 * k, -90 + j * 16) for j in (-1, 0, 1)], BONE)
        parts.append(p)
    b = pt(cn, BODY, (0, 80 * k), 1)
    b.flat(path_limb(Q([(10, 100), (60, 124), (88, 100)]), [7 * k, 5 * k, 2 * k], n_end=3), dark)   # tail
    td = S(b, Q(M([(0, 132), (30, 128), (46, 108), (44, 78), (32, 58), (0, 52)])), fur)
    spikes(b, [(x * k, (128 - abs(x) * 0.3) * k, 16 * k, 4 * k, 90 + x * 1.2) for x in (-28, -14, 0, 14, 28)], dark)
    if bone:
        for i in range(4):
            b.clipped(td, Q([(-40, 104 - i * 12), (0, 98 - i * 12), (40, 104 - i * 12), (40, 100 - i * 12), (0, 94 - i * 12), (-40, 100 - i * 12)]), BONE)
    else:
        for (x, y, l) in ((-22, 110, 20), (18, 96, 26), (-8, 78, 18)):   # where the fire shows through the hide
            b.clipped(td, Q([(x, y), (x + 5, y - l * 0.5), (x - 2, y - l), (x - 6, y - l * 0.4)]), glow, smooth=False)
    parts.append(b)
    for side in (-1, 1):
        a = pt(cn, ARM_F if side > 0 else ARM_B, (side * 26 * k, 70 * k), 3)
        S(a, path_limb(Q([(side * 26, 76), (side * 30, 36), (side * 26, 4)]), [12 * k, 8 * k, 6 * k], n_end=4), fur)
        spikes(a, [((side * 26 + j * 6) * k, 3 * k, 9 * k, 1.8 * k, -90 + j * 16) for j in (-1, 0, 1)], BONE)
        parts.append(a)
    h = pt(cn, HEAD, (0, 96 * k), 4)
    for s in (-1, 1):
        P(h, Q([(s * 14, 124), (s * 22, 150), (s * 30, 122)]), dark)
    hd = S(h, Q(M([(0, 132), (20, 128), (28, 110), (22, 90), (12, 70), (8, 62), (0, 60)])), light(fur, 1.15))
    h.flat(Q(M([(0, 78), (10, 76), (13, 66), (0, 58)])), '#2a0c0c'); teeth(h, -11 * k, 11 * k, 77 * k, 5, 8 * k, seed=2); teeth(h, -9 * k, 9 * k, 60 * k, 4, 6 * k, down=False, seed=4)
    h.flat(Q(M([(0, 90), (5, 88), (4, 83), (0, 82)])), INK)
    for s in (-1, 1):
        geye(h, s * 13 * k, 108 * k, 5.5 * k, glow, slit=True); P(h, Q([(s * 4, 116), (s * 24, 122), (s * 22, 116)]), dark)
    parts.append(h)
    return parts


def cinder_hound():
    return hound('CinderHound')


# ================================================================== scarab
def scarab():
    cn = 'Scarab'; shell, dark, gold = '#1e4a4a', '#0e2428', '#c8a03a'
    parts = []
    for side in (-1, 1):
        for j, role in enumerate(((LEG_B if side < 0 else LEG_F), (ARM_B if side < 0 else ARM_F))):
            p = pt(cn, role, (side * 40, 30), 0)
            for i in range(2 if j == 0 else 1):
                y = 40 - i * 14 + j * 22
                p.flat(path_limb([(side * 40, y), (side * 76, y + 14), (side * (92 + j * 6), 2)], [6, 4.4, 2], n_end=3), dark)
                spikes(p, [(side * 66, y + 10, 8, 2, 90 - side * 40)], dark)
            parts.append(p)
    b = pt(cn, BODY, (0, 44), 1)
    td = S(b, M([(0, 104), (30, 100), (52, 80), (58, 50), (46, 22), (0, 12)]), shell, hl='#9af0e0')
    b.clipped(td, [(-1.6, 104), (1.6, 104), (1.6, 12), (-1.6, 12)], dark, smooth=False)
    for s in (-1, 1):
        b.clipped(td, [(s * 14, 92), (s * 40, 80), (s * 48, 50), (s * 36, 26), (s * 30, 50), (s * 26, 76)], light(shell, 1.3), opacity=0.5)
    P(b, M([(0, 108), (26, 104), (40, 88), (0, 82)]), gold)   # the collar
    parts.append(b)
    h = pt(cn, HEAD, (0, 96), 2)
    S(h, M([(0, 122), (16, 118), (22, 104), (0, 96)]), dark)
    horn(h, 0, 116, 44, 7, 90, gold, curve=0.0)
    for s in (-1, 1):
        horn(h, s * 12, 112, 30, 5, 90 - s * 40, dark, curve=-s * 0.4); geye(h, s * 10, 108, 4, '#ffcf3a')
    parts.append(h)
    return parts


# ================================================================== wasps
def wasp(cn, k=1.0, yel='#e8b020', blk='#1e1a16', eye='#c0322a', crown=False):
    Q = Qk(k); parts = []
    t = pt(cn, TAIL, (0, 96 * k), 0)
    td = S(t, Q(M([(0, 100), (22, 94), (30, 70), (22, 40), (8, 18), (0, 6)])), yel)
    for y in (84, 66, 48, 30):
        t.clipped(td, Q([(-34, y), (34, y), (34, y - 8), (-34, y - 8)]), blk, smooth=False)
    spikes(t, [(0, 8 * k, 22 * k, 3 * k, -90)], blk)
    parts.append(t)
    for side in (-1, 1):
        w = pt(cn, WING_F if side > 0 else WING_B, (side * 14 * k, 132 * k), 1)
        w.flat(Q([(side * 12, 134), (side * 60, 176), (side * 128, 168), (side * 140, 140), (side * 80, 122)]), '#d8f0ff', opacity=0.55)
        w.flat(Q([(side * 12, 128), (side * 70, 116), (side * 112, 92), (side * 84, 84), (side * 30, 110)]), '#d8f0ff', opacity=0.45)
        w.stroke(Q([(side * 12, 134), (side * 70, 156), (side * 134, 152)]), '#6a8a9a', 1.4 * k, opacity=0.7); w.stroke(Q([(side * 12, 128), (side * 60, 108), (side * 100, 92)]), '#6a8a9a', 1.2 * k, opacity=0.7)
        parts.append(w)
    b = pt(cn, BODY, (0, 124 * k), 2)
    for s in (-1, 1):
        for j in range(3):
            b.flat(path_limb(Q([(s * 14, 118 - j * 8), (s * (34 + j * 4), 100 - j * 10), (s * (26 + j * 6), 76 - j * 10)]), [3.4 * k, 2.6 * k, 1.2 * k], n_end=3), blk)
    S(b, Q(M([(0, 150), (20, 146), (28, 128), (20, 108), (0, 100)])), blk)
    b.flat(Q(M([(0, 140), (16, 136), (18, 124), (0, 120)])), shade(yel, 0.8))
    parts.append(b)
    h = pt(cn, HEAD, (0, 146 * k), 3)
    for s in (-1, 1):
        h.stroke(Q([(s * 8, 172), (s * 20, 196), (s * 34, 200)]), blk, 2.4 * k)
        h.flat(path_limb(Q([(s * 8, 150), (s * 12, 140), (s * 4, 132)]), [4 * k, 3 * k, 1 * k], n_end=3), shade(yel, 0.6))
    S(h, Q(M([(0, 180), (16, 176), (22, 162), (14, 148), (0, 144)])), yel)
    for s in (-1, 1):
        h.flat(ellipse(s * 13 * k, 166 * k, 8 * k, 11 * k, n=12, rot=s * 0.3), '#16080a'); h.flat(ellipse(s * 13.6 * k, 165 * k, 5.6 * k, 8 * k, n=12, rot=s * 0.3), shade(eye, 0.75))
    for s in (-1, 1):
        S(h, path_limb(Q([(s * 9, 150), (s * (18 if crown else 13), 136), (s * 3, 124 if crown else 130)]), [4.4 * k, 3.4 * k, 1 * k], n_end=3), blk)
    parts.append(h)
    return parts


def hornet():
    return wasp('Hornet')


# ================================================================== cobra
def cobra():
    cn = 'Cobra'; sc, belly, dark = '#4a5a2a', '#c8b878', '#2a3418'
    parts = []
    t = pt(cn, TAIL, (40, 20), 0)
    S(t, path_limb([(0, 20), (50, 30), (84, 16), (70, 0), (30, 4), (-30, 8), (-70, 22), (-104, 10)], [20, 19, 17, 16, 15, 12, 8, 3], n_end=5), sc)
    parts.append(t)
    b = pt(cn, BODY, (0, 30), 1)
    td = S(b, M([(0, 196), (16, 194), (22, 150), (20, 90), (22, 30), (0, 20)]), sc)
    b.clipped(td, M([(0, 196), (10, 194), (13, 150), (12, 90), (13, 30), (0, 20)]), belly)
    for y in range(40, 190, 12):
        b.clipped(td, [(-13, y), (13, y), (13, y - 1.6), (-13, y - 1.6)], shade(belly, 0.75), smooth=False)
    parts.append(b)
    h = pt(cn, HEAD, (0, 170), 2)
    hd = S(h, M([(0, 250), (30, 240), (58, 206), (54, 168), (30, 144), (0, 136)]), sc)   # the hood
    h.clipped(hd, M([(0, 236), (16, 230), (22, 200), (14, 160), (0, 150)]), belly)
    for s in (-1, 1):
        h.clipped(hd, ellipse(s * 34, 198, 11, 15, n=12), dark); h.clipped(hd, ellipse(s * 34, 198, 5, 8, n=10), '#e8d86a')
    S(h, M([(0, 258), (15, 254), (20, 240), (14, 224), (0, 218)]), light(sc, 1.2))
    h.flat(M([(0, 232), (10, 230), (8, 220), (0, 216)]), '#3a0c10'); spikes(h, [(-6, 230, 11, 1.8, -90), (6, 230, 11, 1.8, -90)], BONE)
    h.stroke([(0, 218), (0, 206), (-4, 200)], '#c0322a', 1.6); h.stroke([(0, 206), (4, 200)], '#c0322a', 1.6)
    for s in (-1, 1):
        geye(h, s * 9, 244, 4, '#ffcf3a', slit=True)
    parts.append(h)
    return parts


# ================================================================== sporecap
def sporecap():
    cn = 'Sporecap'; stalk, cap, spot, dark = '#a89c80', '#6a2420', '#c8b890', '#3a1010'
    parts = []
    for side in (-1, 1):
        p = pt(cn, LEG_F if side > 0 else LEG_B, (side * 18, 30), 0)
        for j in range(2):
            p.flat(path_limb([(side * 16, 34), (side * (34 + j * 16), 18), (side * (44 + j * 22), 0)], [7, 5, 2], n_end=3), shade(stalk, 0.7 + j * 0.1))
        parts.append(p)
    b = pt(cn, BODY, (0, 30), 1)
    td = S(b, M([(0, 120), (22, 118), (28, 80), (34, 40), (26, 22), (0, 18)]), stalk)
    b.clipped(td, M([(0, 112), (30, 104), (30, 96), (0, 100)]), shade(stalk, 0.6))
    b.clipped(td, [(-5, 96), (7, 86), (10, 60), (4, 36), (-6, 30), (-10, 56), (-9, 80)], '#16040a')   # it has split down the front
    for i in range(5):
        y = 88 - i * 11
        b.clipped(td, [(-10, y), (-10, y - 6), (-2, y - 2)], BONE, smooth=False); b.clipped(td, [(10, y - 4), (10, y - 10), (2, y - 7)], BONE, smooth=False)
    for (x, y, r) in ((-18, 70, 5), (20, 52, 4), (-16, 40, 3.4), (18, 88, 3)):
        b.clipped(td, ellipse(x, y, r, r * 1.2, n=8), '#3a2a1a'); b.clipped(td, ellipse(x, y, r * 0.45, r * 0.6, n=6), '#b8ff5a')
    parts.append(b)
    h = pt(cn, HEAD, (0, 112), 3)
    hd = S(h, [(0, 192), (44, 186), (78, 150), (90, 118), (70, 104), (0, 104), (-74, 100), (-92, 124), (-72, 160), (-36, 184)], cap)
    spots(h, hd, [(-40, 160, 13), (20, 172, 10), (50, 140, 12), (-10, 136, 8), (-66, 126, 8), (66, 118, 6)], spot, op=0.8)
    spots(h, hd, [(-40, 160, 6), (50, 140, 6), (20, 172, 4)], '#3a2a1a', op=0.9)   # every blister has burst
    h.clipped(hd, [(30, 196), (60, 170), (40, 150), (56, 128), (30, 104), (90, 100), (96, 200)], shade(cap, 0.5), smooth=False)   # a bite out of the cap, gone black
    for x in range(-60, 61, 12):
        h.flat([(x - 1.4, 106), (x + 1.4, 106), (x + 2, 90 - (x % 24)), (x - 1, 90 - (x % 24))], dark, smooth=False)
    for (x, y, r) in ((-96, 150, 3), (104, 170, 2.4), (-84, 190, 2), (92, 132, 3), (-110, 118, 2.4), (60, 206, 2)):   # what it is breathing out
        h.circle(x, y, r, '#b8ff5a', opacity=0.7)
    parts.append(h)
    for side in (-1, 1):
        a = pt(cn, ARM_F if side > 0 else ARM_B, (side * 24, 86), 2)
        S(a, path_limb([(side * 24, 88), (side * 48, 70), (side * 54, 44)], [6, 5, 3], n_end=4), stalk)
        parts.append(a)
    return parts


# ================================================================== golems
def golem(cn, k=1.0, rock='#4e4e58', dark='#26262e', glow='#3ad8ff', furnace=False, brass=False):
    Q = Qk(k); parts = []
    for side in (-1, 1):
        p = pt(cn, LEG_F if side > 0 else LEG_B, (side * 34 * k, 96 * k), 0)
        P(p, Q([(side * 14, 100), (side * 56, 100), (side * 60, 50), (side * 66, 0), (side * 16, 0), (side * 20, 50)]), rock)
        p.flat(Q([(side * 18, 54), (side * 62, 54), (side * 60, 46), (side * 20, 46)]), dark, smooth=False)
        parts.append(p)
    b = pt(cn, BODY, (0, 100 * k), 1)
    td = P(b, Q(M([(0, 250), (60, 244), (104, 214), (96, 150), (70, 96), (0, 88)])), rock)
    for pts in ([(-60, 230), (-20, 200), (-34, 160)], [(40, 236), (56, 190), (30, 170)], [(-70, 150), (-30, 130)], [(20, 130), (60, 110)]):   # cracks
        b.stroke(Q(pts), dark, 2.6 * k, smooth=False)
    if furnace:
        b.clipped(td, Q(M([(0, 196), (40, 190), (46, 140), (0, 124)])), '#1a0c08', smooth=False)
        b.clipped(td, Q(M([(0, 186), (30, 180), (34, 146), (0, 136)])), glow, smooth=False)
        for x in (-22, -8, 6, 20):
            b.clipped(td, Q([(x, 196), (x + 5, 196), (x + 5, 124), (x, 124)]), '#2a1a14', smooth=False)
        for s in (-1, 1):
            P(b, Q([(s * 70, 240), (s * 92, 240), (s * 90, 300), (s * 72, 300)]), dark); b.flat(Q([(s * 68, 300), (s * 94, 300), (s * 94, 310), (s * 68, 310)]), rock, smooth=False)
    else:
        b.clipped(td, ellipse(0, 172 * k, 20 * k, 20 * k, n=8), dark); b.clipped(td, ellipse(0, 172 * k, 13 * k, 13 * k, n=8), glow)   # the heart-stone
    if brass:
        for (x, y, r) in ((-52, 190, 20), (54, 150, 16)):
            b.clipped(td, ellipse(x * k, y * k, r * k, r * k, n=12), dark); b.clipped(td, ellipse(x * k, y * k, r * 0.7 * k, r * 0.7 * k, n=12), '#e8c860'); b.clipped(td, ellipse(x * k, y * k, r * 0.25 * k, r * 0.25 * k, n=8), dark)
            spikes(b, [((x + math.cos(a) * r) * k, (y + math.sin(a) * r) * k, 7 * k, 3 * k, math.degrees(a)) for a in [i * math.tau / 8 for i in range(8)]], dark)
    parts.append(b)
    spikes(b, [(x * k, (246 - abs(x) * 0.3) * k, l * k, 11 * k, 90 + x * 0.25) for (x, l) in ((-88, 46), (-62, 30), (60, 38), (90, 54), (-40, 22))], dark)
    for pts in ([(-20, 200), (-8, 172), (-22, 150)], [(56, 190), (40, 168)]):
        b.stroke(Q(pts), glow, 1.6 * k, smooth=False, opacity=0.85)
    h = pt(cn, HEAD, (0, 214 * k), 2)
    P(h, Q([(-30, 252), (-8, 262), (22, 256), (34, 232), (24, 206), (-4, 198), (-28, 212)]), shade(rock, 0.8))
    h.flat(Q([(-26, 238), (28, 240), (26, 214), (4, 204), (-22, 216)]), '#08080c', smooth=False)   # no face: a hole with one light in it
    h.flat(Q([(-12, 232), (4, 234), (2, 224), (-10, 223)]), glow, smooth=False); h.flat(Q([(-7, 230), (-2, 231), (-3, 226), (-6, 226)]), '#ffffff', smooth=False, opacity=0.7)
    parts.append(h)
    for side in (-1, 1):
        a = pt(cn, ARM_F if side > 0 else ARM_B, (side * 100 * k, 214 * k), 3)
        P(a, Q([(side * 84, 236), (side * 128, 226), (side * 140, 160), (side * 112, 150), (side * 92, 170)]), rock)
        P(a, Q([(side * 104, 160), (side * 148, 156), (side * 160, 80), (side * 150, 50), (side * 110, 50), (side * 100, 90)]), light(rock, 1.1))
        a.flat(Q([(side * 104, 92), (side * 158, 92), (side * 158, 84), (side * 102, 84)]), dark, smooth=False)
        parts.append(a)
    return parts


def stone_golem():
    return golem('StoneGolem', 0.82)


# ================================================================== wraith
def wraith(cn='Wraith', k=1.0, cloth='#3a4a5a', glow='#9af0ff', queen=False):
    Q = Qk(k); parts = []
    b = pt(cn, BODY, (0, 150 * k), 1)
    td = S(b, Q(M([(0, 300), (40, 292), (56, 240), (62, 160), (76, 80), (60, 30), (44, 50), (30, 14), (14, 44), (0, 6)])), cloth, opacity=0.92)
    b.clipped(td, Q(M([(0, 280), (16, 276), (20, 200), (10, 120), (0, 110)])), shade(cloth, 0.5))
    for i in range(5):   # ribs showing in the dark of it
        b.clipped(td, Q([(-16, 250 - i * 16), (0, 244 - i * 16), (16, 250 - i * 16), (16, 246 - i * 16), (0, 240 - i * 16), (-16, 246 - i * 16)]), glow, opacity=0.5)
    if queen:
        for (x, y, a) in ((-44, 200, 20), (40, 150, -30), (-30, 110, 40), (50, 220, 10)):   # mirror shards worn like scales
            b.clipped(td, Q([(x, y + 18), (x + 10, y), (x, y - 18), (x - 10, y)]), '#d8f6ff', smooth=False); b.clipped(td, Q([(x, y + 18), (x + 10, y), (x, y)]), '#ffffff', smooth=False)
    parts.append(b)
    h = pt(cn, HEAD, (0, 290 * k), 2)
    hd = S(h, Q(M([(0, 356), (30, 346), (42, 312), (34, 284), (0, 276)])), light(cloth, 1.15))
    h.clipped(hd, Q(M([(0, 340), (20, 334), (26, 312), (18, 292), (0, 288)])), '#080a10')
    for s in (-1, 1):
        h.flat(Q([(s * 5, 318), (s * 17, 324), (s * 15, 314), (s * 6, 311)]), glow, smooth=False)
    if queen:
        for x in (-28, -14, 0, 14, 28):
            P(h, Q([(x - 6, 348 - abs(x) * 0.3), (x, 396 - abs(x) * 0.9), (x + 6, 348 - abs(x) * 0.3)]), '#d8f6ff')
    parts.append(h)
    for side in (-1, 1):
        a = pt(cn, ARM_F if side > 0 else ARM_B, (side * 46 * k, 270 * k), 3)
        S(a, Q([(side * 40, 284), (side * 64, 268), (side * 96, 210), (side * 110, 150), (side * 86, 170), (side * 70, 150), (side * 60, 200), (side * 44, 236)]), cloth, opacity=0.92)
        for j in range(4):   # long fingers out of the sleeve
            a.flat(path_limb(Q([(side * 92, 166), (side * (100 + j * 7), 140 - j * 2), (side * (104 + j * 9), 112 + j * 5)]), [2.6 * k, 2 * k, 0.8 * k], n_end=3), '#c8d8d8')
        parts.append(a)
    return parts


# ================================================================== bat
def fiend_bat():
    cn = 'FiendBat'; fur, mem = '#3a2a34', '#5a2a3a'
    parts = [wing(cn, -1, (-22, 118), mem, '#2a1a22', span=1.15), wing(cn, 1, (22, 118), mem, '#2a1a22', span=1.15)]
    b = pt(cn, BODY, (0, 110), 2)
    S(b, M([(0, 144), (20, 140), (28, 116), (20, 88), (0, 78)]), fur)
    for s in (-1, 1):
        b.flat(path_limb([(s * 10, 84), (s * 14, 66)], [3, 2], n_end=3), '#2a1a22'); spikes(b, [(s * 14 + j * 4, 66, 8, 1.4, -90 + j * 20) for j in (-1, 0, 1)], '#2a1a22')
    parts.append(b)
    h = pt(cn, HEAD, (0, 138), 3)
    for s in (-1, 1):
        P(h, [(s * 8, 162), (s * 26, 200), (s * 30, 160)], fur); h.flat([(s * 14, 164), (s * 24, 190), (s * 26, 164)], '#b86a7a', smooth=False)
    S(h, M([(0, 174), (18, 170), (24, 154), (16, 138), (0, 134)]), light(fur, 1.2))
    h.flat(M([(0, 150), (11, 148), (9, 138), (0, 135)]), '#3a0c10'); spikes(h, [(-7, 149, 10, 2, -90), (7, 149, 10, 2, -90)], BONE)
    h.flat(M([(0, 158), (5, 157), (4, 152), (0, 152)]), '#b86a7a')
    for s in (-1, 1):
        geye(h, s * 10, 163, 4.4, '#ff3a2a')
    parts.append(h)
    return parts


# ================================================================== scorpion
def scorpion():
    cn = 'Scorpion'; sh, dark, sting = '#8a5a2a', '#4a2e16', '#b8ff5a'
    parts = []
    t = pt(cn, TAIL, (0, 60), 0)
    segs = [(0, 62), (5, 98), (-4, 132), (4, 162), (0, 186)]   # the tail, seen from in front: straight up over its back
    for i in range(len(segs) - 1):
        (ax, ay), (bx, by) = segs[i], segs[i + 1]
        S(t, path_limb([(ax, ay), (bx, by)], [13 - i * 1.4, 12 - i * 1.4], n_end=5), sh if i % 2 == 0 else light(sh, 1.15))
    S(t, ellipse(0, 190, 15, 13, n=12), dark); spikes(t, [(0, 180, 40, 6, -90)], sting); t.circle(0, 144, 3, sting, opacity=0.8)   # and the sting hanging over, pointed at you
    parts.append(t)
    for side in (-1, 1):
        p = pt(cn, LEG_F if side > 0 else LEG_B, (side * 34, 34), 0)
        for j in range(3):
            p.flat(path_limb([(side * 30, 40 - j * 4), (side * (64 + j * 6), 56 - j * 12), (side * (84 + j * 8), 0)], [5, 4, 1.6], n_end=3), dark)
        parts.append(p)
    b = pt(cn, BODY, (0, 40), 1)
    td = S(b, M([(0, 76), (30, 72), (44, 52), (38, 28), (0, 20)]), sh)
    plates(b, td, 0, 62, 30, 4, 46, dark, bow=6)
    for s in (-1, 1):
        geye(b, s * 8, 68, 3, '#ff3a2a'); b.flat(path_limb([(s * 6, 26), (s * 9, 14)], [3, 1.4], n_end=3), dark)
    parts.append(b)
    for side in (-1, 1):
        a = pt(cn, ARM_F if side > 0 else ARM_B, (side * 38, 50), 3)
        S(a, path_limb([(side * 38, 52), (side * 78, 72), (side * 104, 58)], [8, 7, 8], n_end=4), sh)
        S(a, [(side * 100, 66), (side * 126, 84), (side * 150, 70), (side * 128, 62)], light(sh, 1.15)); S(a, [(side * 100, 54), (side * 128, 54), (side * 148, 62), (side * 124, 40)], sh)
        parts.append(a)
    return parts


# ================================================================== mimic
def mimic(cn='Mimic', k=1.0, wood='#6a4428', band='#c8a03a'):
    Q = Qk(k); parts = []
    for side in (-1, 1):
        p = pt(cn, LEG_F if side > 0 else LEG_B, (side * 40 * k, 20 * k), 0)
        p.flat(path_limb(Q([(side * 40, 24), (side * 56, 10), (side * 50, 0)]), [7 * k, 5 * k, 4 * k], n_end=3), '#8a3a4a')
        spikes(p, [((side * 50 + j * 6) * k, 2 * k, 8 * k, 1.6 * k, -90 + j * 24) for j in (-1, 0, 1)], BONE)
        parts.append(p)
    b = pt(cn, BODY, (0, 20 * k), 1)
    td = P(b, Q([(-70, 72), (70, 72), (64, 16), (-64, 16)]), wood)
    for x in (-52, 0, 52):
        b.clipped(td, Q([(x - 7, 72), (x + 7, 72), (x + 7, 16), (x - 7, 16)]), band, smooth=False)
    b.flat(Q([(-66, 80), (66, 80), (66, 66), (-66, 66)]), '#3a0c14', smooth=False); teeth(b, -64 * k, 64 * k, 66 * k, 9, 16 * k, down=False, seed=7)
    S(b, path_limb(Q([(0, 72), (20, 50), (10, 24), (34, 6)]), [16 * k, 13 * k, 10 * k, 6 * k], n_end=5), '#c0486a')   # the tongue
    parts.append(b)
    h = pt(cn, HEAD, (-66 * k, 84 * k), 2)   # the lid, hinged at the back
    hd = S(h, Q([(-72, 84), (-70, 120), (-40, 144), (40, 144), (70, 120), (72, 84)]), light(wood, 1.1))
    for x in (-52, 0, 52):
        h.clipped(hd, Q([(x - 7, 150), (x + 7, 150), (x + 7, 84), (x - 7, 84)]), band, smooth=False)
    teeth(h, -66 * k, 66 * k, 86 * k, 9, 18 * k, seed=3)
    for s in (-1, 1):
        geye(h, s * 26 * k, 116 * k, 9 * k, '#ffcf3a', slit=True)
    parts.append(h)
    return parts


# ================================================================== snapvine
def snapvine(cn='Snapvine', k=1.0, green='#3a6a2a', pod='#a82a4a'):
    Q = Qk(k); parts = []
    for side in (-1, 1):
        p = pt(cn, LEG_F if side > 0 else LEG_B, (side * 10 * k, 24 * k), 0)
        for j in range(3):
            tendril(p, Q([(side * 8, 26), (side * (30 + j * 18), 22 - j * 4), (side * (56 + j * 22), 6), (side * (70 + j * 24), 0)]), 6 * k, shade(green, 0.6 + j * 0.1))
        parts.append(p)
    b = pt(cn, BODY, (0, 24 * k), 1)
    S(b, path_limb(Q([(0, 20), (-12, 70), (10, 120), (0, 168)]), [14 * k, 12 * k, 11 * k, 10 * k], n_end=5), green)
    spikes(b, [(x * k, y * k, 12 * k, 3 * k, a) for (x, y, a) in ((-22, 60, 170), (4, 74, 10), (20, 110, 20), (-4, 124, 170), (10, 150, 10))], shade(green, 0.6))
    parts.append(b)
    for side in (-1, 1):
        a = pt(cn, ARM_F if side > 0 else ARM_B, (side * 8 * k, 110 * k), 2)
        tendril(a, Q([(side * 8, 112), (side * 44, 130), (side * 76, 112), (side * 92, 76)]), 7 * k, green, lit=True)
        S(a, Q([(side * 84, 84), (side * 116, 92), (side * 124, 60), (side * 100, 44)]), shade(green, 0.85))   # a leaf like a blade
        parts.append(a)
    h = pt(cn, HEAD, (0, 164 * k), 3)
    S(h, Q(M([(0, 180), (40, 190), (60, 232), (40, 262), (14, 232), (0, 240)])), pod)   # the upper jaw, split like a seed
    S(h, Q(M([(0, 176), (36, 178), (52, 160), (30, 140), (0, 136)])), shade(pod, 0.85))
    h.flat(Q(M([(0, 232), (30, 222), (40, 192), (34, 178), (0, 176)])), '#3a0c14')
    teeth(h, -34 * k, 34 * k, 178 * k, 7, 12 * k, down=False, seed=2); teeth(h, -30 * k, 30 * k, 224 * k, 6, 14 * k, seed=6)
    for (x, y, r) in ((-46, 236, 5), (48, 226, 4), (-30, 150, 4), (34, 152, 5)):
        h.circle(x * k, y * k, r * k, '#f0d86a')
    parts.append(h)
    return parts


# ================================================================== grub
def grub(cn='Grub', k=1.0, col='#d8c8a0', dark='#8a6a4a', mawcol='#7a1c24', rings=5):
    Q = Qk(k); parts = []
    t = pt(cn, TAIL, (0, 30 * k), 0)
    for i in range(rings, 0, -1):   # the rest of it, seen head-on: ring behind ring, rising and narrowing
        r = 38 - i * 4.4; y = 40 + i * 17; x = (4 if i % 2 else -4) * (i > 1)
        S(t, ellipse(x * k, y * k, r * 1.02 * k, r * k, n=16), shade(col, 0.62 + 0.07 * (rings - i)) if i % 2 else shade(col, 0.74 + 0.05 * (rings - i)))
        spikes(t, [((x - r * 0.9) * k, y * k, 9 * k, 2.4 * k, 170), ((x + r * 0.9) * k, y * k, 9 * k, 2.4 * k, 10)], dark)
    parts.append(t)
    b = pt(cn, BODY, (0, 34 * k), 1)
    td = S(b, ellipse(0, 40 * k, 40 * k, 40 * k, n=20), col, hl='#fffbe8')
    for s in (-1, 1):
        for j in range(3):
            b.flat(path_limb(Q([(s * (20 + j * 8), 10), (s * (26 + j * 9), 0)]), [3 * k, 1.4 * k], n_end=3), dark)
    parts.append(b)
    h = pt(cn, HEAD, (0, 40 * k), 2)
    h.flat(ellipse(0, 42 * k, 24 * k, 24 * k, n=18), mawcol); h.flat(ellipse(0, 42 * k, 10 * k, 10 * k, n=12), '#200608')
    for i in range(10):   # a ring of teeth, all pointing in
        a = i / 10 * math.tau
        spikes(h, [(math.cos(a) * 24 * k, (42 + math.sin(a) * 24) * k, 13 * k, 3.4 * k, math.degrees(a) + 180)], BONE)
    for s in (-1, 1):
        S(h, path_limb(Q([(s * 22, 62), (s * 40, 74), (s * 44, 56)]), [5 * k, 4 * k, 1.4 * k], n_end=3), dark)   # mandibles
    parts.append(h)
    return parts


# ================================================================== jelly
def jelly(cn='Jelly', k=1.0, bell='#3a4a8a', glow='#9ad0ff', n=7, beak=False):
    Q = Qk(k); parts = []
    t = pt(cn, TAIL, (0, 120 * k), 0)
    rnd = random.Random(11)
    for i in range(n):
        x = (i - (n - 1) / 2) * (84 / n)
        tendril(t, Q([(x, 122), (x + rnd.uniform(-8, 8), 86), (x + rnd.uniform(-14, 14), 50), (x + rnd.uniform(-18, 18), 14)]), 4.6 * k, shade(bell, 0.8) if i % 2 else light(bell, 1.2))
    parts.append(t)
    b = pt(cn, BODY, (0, 130 * k), 1)
    td = S(b, Q(M([(0, 196), (30, 190), (52, 164), (56, 134), (44, 118), (30, 126), (16, 116), (0, 124)])), bell, opacity=0.9, hl='#ffffff')
    b.clipped(td, Q(M([(0, 180), (18, 176), (26, 152), (16, 136), (0, 134)])), glow, opacity=0.55)
    parts.append(b)
    h = pt(cn, HEAD, (0, 150 * k), 2)
    if beak:
        h.flat(ellipse(0, 158 * k, 30 * k, 20 * k, n=16), '#0c0608'); h.flat(ellipse(0, 158 * k, 24 * k, 15 * k, n=16), '#ffb020'); h.flat(ellipse(0, 158 * k, 4 * k, 15 * k, n=10), '#0c0608')   # one eye, and it has found you
        P(h, Q([(-16, 132), (16, 132), (4, 100), (0, 92), (-4, 100)]), '#1a1014'); h.flat(Q([(-9, 130), (9, 130), (0, 108)]), '#5a3a2a', smooth=False)
    else:
        h.flat(Q(M([(0, 172), (11, 169), (13, 158), (8, 148), (0, 146)])), BONE, opacity=0.85)
        for s in (-1, 1):
            h.flat(Q([(s * 2.5, 162), (s * 9, 164), (s * 9, 157), (s * 3.4, 155)]), '#0c0608', smooth=False); h.circle(s * 6 * k, 160 * k, 1.3 * k, glow)
        h.flat(Q([(-6, 150), (6, 150), (5, 147), (-5, 147)]), '#0c0608', smooth=False)
    parts.append(h)
    return parts


# ================================================================== idol
def idol():
    cn = 'Idol'; st, dark, glow = '#6a6258', '#3a342e', '#ff5aff'
    parts = []
    b = pt(cn, BODY, (0, 0), 1)
    td = P(b, M([(0, 250), (40, 246), (52, 200), (46, 60), (60, 20), (64, 0), (0, 0)]), st)
    for y in (60, 110):
        b.clipped(td, [(-60, y), (60, y), (60, y - 5), (-60, y - 5)], dark, smooth=False)
    for i, x in enumerate((-30, -10, 10, 30)):
        b.clipped(td, [(x - 4, 100), (x + 4, 100), (x + 4, 70), (x - 4, 70)], glow if i % 2 else dark, smooth=False)
    parts.append(b)
    h = pt(cn, HEAD, (0, 150), 2)
    h.flat(M([(0, 196), (26, 190), (30, 150), (18, 124), (0, 120)]), '#100810'); h.flat(M([(0, 186), (16, 182), (20, 152), (10, 134), (0, 132)]), glow)   # the mouth it screams from
    teeth(h, -24, 24, 192, 5, 12, st, seed=1); teeth(h, -18, 18, 126, 4, 10, st, down=False, seed=2)
    for s in (-1, 1):
        geye(h, s * 20, 222, 9, glow, sock='#100810'); P(h, [(s * 6, 238), (s * 36, 244), (s * 34, 234)], dark)
        horn(h, s * 40, 240, 46, 8, 90 - s * 50, dark, curve=-s * 0.5)
    parts.append(h)
    return parts


# ================================================================== things bosses make
def egg_sac():
    cn = 'EggSac'; web, egg = '#d8d4c8', '#b8c86a'
    b = pt(cn, BODY, (0, 0), 1)
    for (x, y) in ((-60, 0), (60, 0), (-40, 110), (44, 104)):
        b.stroke([(0, 50), (x, y)], web, 2.4, smooth=False)
    td = S(b, M([(0, 108), (26, 102), (40, 70), (34, 30), (0, 8)]), web, hl='#ffffff')
    for (x, y, r) in ((-12, 70, 13), (14, 52, 12), (-6, 34, 10), (16, 84, 9)):
        b.clipped(td, ellipse(x, y, r, r, n=10), egg, opacity=0.85); b.clipped(td, ellipse(x + 2, y - 2, r * 0.4, r * 0.5, n=6), '#2a3410')
    for i in range(5):
        b.clipped(td, [(-44, 96 - i * 20), (44, 80 - i * 20), (44, 78 - i * 20), (-44, 94 - i * 20)], shade(web, 0.8), smooth=False)
    return [b]


def tentacle():
    cn = 'Tentacle'; sk, suck = '#5a3a6a', '#d8a0b8'
    b = pt(cn, BODY, (0, 0), 1)
    pts = [(0, 0), (-14, 70), (10, 140), (-6, 210), (26, 262), (60, 270)]; rad = [34, 30, 25, 19, 12, 4]
    td = S(b, path_limb(pts, rad, n_end=5), sk)
    for i, (x, y) in enumerate(((6, 30), (-2, 70), (12, 104), (8, 140), (4, 176), (10, 206), (26, 240))):
        b.clipped(td, ellipse(x + 10, y, 8 - i * 0.7, 6 - i * 0.5, n=8), suck); b.clipped(td, ellipse(x + 10, y, 3.4 - i * 0.3, 2.6 - i * 0.2, n=6), shade(sk, 0.6))
    b.flat(ellipse(0, 4, 54, 8, n=14), '#1a1420', opacity=0.5)
    return [b]


ROSTER = [
    ('Skitterling', skitterling), ('Webspinner', webspinner), ('Ooze', ooze), ('Watcher', watcher), ('CinderHound', cinder_hound), ('Scarab', scarab),
    ('Hornet', hornet), ('Cobra', cobra), ('Sporecap', sporecap), ('StoneGolem', stone_golem), ('Wraith', wraith), ('FiendBat', fiend_bat),
    ('Scorpion', scorpion), ('Mimic', mimic), ('Snapvine', snapvine), ('Grub', grub), ('Jelly', jelly), ('Idol', idol),
    ('EggSac', egg_sac), ('Tentacle', tentacle),
]
