"""The Descent: the twenty that hold the seals. Half are the old kinds grown huge; half are their own thing."""
from kit3 import *   # noqa: F401,F403
from creatures_m6 import spider, slime, eyeball, hound, wasp, golem, wraith, grub, jelly, Qk


def brood_mother():
    return spider('BroodMother', 2.5, '#3a2a3a', '#1e141e', '#ff3a2a', '#c0322a', eggs=True)


def hive_queen():
    return wasp('HiveQueen', 2.2, '#e8a020', '#1e1610', '#ff3a2a', crown=True)


def king_ooze():
    return slime('KingOoze', 2.3, '#3a5a4a', '#16261e', '#7affc0', crown=True)


def wyrm():
    return grub('Wyrm', 3.4, '#b8926a', '#5a3a2a', '#7a1c24', rings=4)


def twin_hound():
    return hound('TwinHound', 2.3, '#2a2226', '#141014', '#ff5a1a')


def furnace():
    return golem('Furnace', 1.35, '#3e3230', '#1a1412', '#ff7a1a', furnace=True)


def titan():
    return golem('Titan', 1.5, '#6a5226', '#2a1e0e', '#7af0ff', brass=True)


def mirror_queen():
    return wraith('MirrorQueen', 1.3, '#4a5a7a', '#d8f6ff', queen=True)


def unblinking():
    return eyeball('Unblinking', 2.4, '#5a2a5a', '#c58cff', '#ff5aff', ring=1)


def leviathan():
    return jelly('Leviathan', 2.7, '#3a2650', '#8a5ab8', n=9, beak=True)


# ================================================================== Old Ironhide: a boar the size of a cart, armoured at the front
def ironhide():
    cn = 'Ironhide'; fur, dark, iron, tusk = '#4e3c30', '#2a1e18', '#7a7e86', '#efe4c8'
    parts = []
    for side in (-1, 1):
        p = pt(cn, LEG_F if side > 0 else LEG_B, (side * 84, 120), 0)
        S(p, path_limb([(side * 84, 130), (side * 96, 64), (side * 90, 10)], [26, 17, 13], n_end=5), dark); p.flat(rect(side * 90 - 15, 0, side * 90 + 15, 14), '#141014', smooth=False)
        parts.append(p)
    b = pt(cn, BODY, (0, 150), 1)
    td = S(b, M([(0, 330), (70, 322), (128, 276), (146, 200), (120, 130), (0, 110)]), fur)
    spikes(b, [(x, 322 - abs(x) * 0.36, 34, 7, 90 + x * 0.5) for x in range(-100, 101, 20)], dark)
    for s in (-1, 1):   # shoulder plates, riveted
        b.clipped(td, [(s * 50, 300), (s * 130, 270), (s * 150, 200), (s * 110, 170), (s * 60, 210)], iron, smooth=False)
        for (x, y) in ((70, 276), (112, 250), (124, 206), (84, 204)):
            b.clipped(td, ellipse(s * x, y, 5, 5, n=8), shade(iron, 0.6))
    wound(b, td, (-20, 250), 16, seed=4)
    parts.append(b)
    for side in (-1, 1):
        a = pt(cn, ARM_F if side > 0 else ARM_B, (side * 62, 150), 3)
        S(a, path_limb([(side * 62, 160), (side * 70, 76), (side * 62, 12)], [30, 20, 16], n_end=5), fur); a.flat(rect(side * 62 - 18, 0, side * 62 + 18, 16), '#141014', smooth=False)
        parts.append(a)
    h = pt(cn, HEAD, (0, 200), 4)
    for s in (-1, 1):
        P(h, [(s * 44, 250), (s * 86, 286), (s * 74, 232)], fur); h.flat([(s * 52, 252), (s * 78, 274), (s * 70, 240)], '#8a5a5a', smooth=False)
    hd = S(h, M([(0, 268), (52, 258), (78, 210), (66, 150), (40, 104), (0, 90)]), light(fur, 1.12))
    P(h, M([(0, 274), (40, 262), (36, 214), (0, 200)]), iron)   # the brow plate
    for (x, y) in ((-26, 252), (26, 252), (-22, 220), (22, 220), (0, 262)):
        h.circle(x, y, 4, shade(iron, 0.55))
    S(h, ellipse(0, 124, 38, 28, n=16), '#7a5650'); h.flat(ellipse(-13, 124, 6, 9, n=8), INK); h.flat(ellipse(13, 124, 6, 9, n=8), INK)
    h.circle(0, 104, 9, iron); h.flat(ellipse(0, 104, 5, 5, n=8), '#7a5650')   # a ring through the snout
    for s in (-1, 1):
        horn(h, s * 40, 112, 92, 12, 90 - s * 62, tusk, curve=s * 0.62); horn(h, s * 28, 104, 44, 7, 90 - s * 50, tusk, curve=s * 0.5)
        geye(h, s * 40, 190, 8, '#ff3a2a'); P(h, [(s * 22, 204), (s * 58, 210), (s * 54, 198)], dark)
    parts.append(h)
    return parts


# ================================================================== The Lamplighter: a deep-water angler that swims in air
def lamplighter():
    cn = 'Lamplighter'; skin, dark, lamp = '#22303e', '#101820', '#ffe27a'
    parts = []
    t = pt(cn, TAIL, (0, 170), 0)
    S(t, [(-20, 190), (-70, 250), (-130, 230), (-110, 170), (-130, 110), (-70, 100), (-20, 150)], dark); S(t, [(20, 190), (70, 250), (130, 230), (110, 170), (130, 110), (70, 100), (20, 150)], dark)
    parts.append(t)
    for side in (-1, 1):
        w = pt(cn, WING_F if side > 0 else WING_B, (side * 100, 180), 1)
        S(w, [(side * 96, 200), (side * 170, 236), (side * 196, 180), (side * 176, 130), (side * 100, 150)], shade(skin, 0.8))
        for j in range(4):
            w.stroke([(side * 100, 176), (side * (176 + (j == 1) * 14), 222 - j * 28)], dark, 2.4, smooth=False)
        parts.append(w)
    b = pt(cn, BODY, (0, 170), 2)
    td = S(b, ellipse(0, 180, 112, 100, n=26), skin, hl='#6a8aa0')
    spots(b, td, [(-70, 220, 10), (60, 240, 8), (84, 200, 6), (-40, 256, 7), (-90, 170, 6)], '#3a5a6a', op=0.7)
    b.clipped(td, M([(0, 196), (70, 184), (96, 150), (80, 104), (0, 86)]), '#200810')   # the mouth: most of it
    teeth(b, -86, 86, 186, 11, 44, '#e8f0e0', jag=0.4, seed=3, clip=td); teeth(b, -78, 78, 96, 10, 40, '#e8f0e0', down=False, jag=0.4, seed=8, clip=td)
    parts.append(b)
    h = pt(cn, HEAD, (0, 262), 3)
    for s in (-1, 1):
        geye(h, s * 46, 232, 10, '#f4ffff', sock=dark)
    h.stroke([(0, 276), (10, 330), (50, 362), (86, 340)], dark, 5)
    h.circle(90, 330, 30, lamp, opacity=0.25); h.circle(90, 330, 19, lamp, opacity=0.5); h.circle(90, 330, 11, '#fffbe0')
    parts.append(h)
    return parts


# ================================================================== Carapace: a crab that takes up the room
def carapace():
    cn = 'Carapace'; sh, dark, pale = '#3a5a6a', '#1e2e3a', '#c8d8c8'
    parts = []
    for side in (-1, 1):
        p = pt(cn, LEG_F if side > 0 else LEG_B, (side * 130, 90), 0)
        for j in range(3):
            S(p, path_limb([(side * 130, 100 - j * 8), (side * (210 + j * 16), 150 - j * 30), (side * (270 + j * 12), 4)], [14, 10, 4], n_end=4), dark)
        parts.append(p)
    b = pt(cn, BODY, (0, 90), 1)
    td = S(b, M([(0, 230), (110, 220), (200, 176), (224, 120), (180, 64), (0, 44)]), sh, hl='#9ad0e0')
    b.clipped(td, M([(0, 100), (150, 92), (178, 62), (0, 44)]), pale)
    spikes(b, [(x, 222 - abs(x) * 0.26, 30, 10, 90 + x * 0.2) for x in (-180, -130, -80, -30, 30, 80, 130, 180)], dark)
    spots(b, td, [(-90, 180, 22), (60, 190, 18), (140, 150, 14), (-150, 140, 12), (0, 150, 10), (-40, 120, 8)], dark, op=0.6)
    b.flat(rect(-36, 84, 36, 104), '#141014', smooth=False); teeth(b, -34, 34, 104, 6, 12, pale, seed=4)
    parts.append(b)
    h = pt(cn, HEAD, (0, 200), 2)
    for s in (-1, 1):
        S(h, path_limb([(s * 34, 214), (s * 46, 286)], [7, 5], n_end=4), sh); geye(h, s * 46, 296, 15, '#ffb020', slit=True)
    parts.append(h)
    for side in (-1, 1):
        a = pt(cn, ARM_F if side > 0 else ARM_B, (side * 170, 130), 3)
        S(a, path_limb([(side * 170, 134), (side * 250, 200), (side * 260, 270)], [24, 22, 26], n_end=5), sh)
        S(a, [(side * 236, 262), (side * 250, 360), (side * 300, 410), (side * 330, 350), (side * 300, 300), (side * 290, 262)], light(sh, 1.15)); S(a, [(side * 232, 268), (side * 190, 330), (side * 220, 400), (side * 262, 380), (side * 244, 330)], sh)
        teeth(a, side * 250, side * 296, 330, 3, -14 * side, pale, seed=2)
        parts.append(a)
    return parts


# ================================================================== Thunderhead: weather with a face
def thunderhead():
    cn = 'Thunderhead'; cl, dark, bolt = '#343a4c', '#1a1c28', '#ffe86a'
    parts = []
    t = pt(cn, TAIL, (0, 190), 0)
    rnd = random.Random(4)
    for i in range(16):   # the rain under it
        x = rnd.uniform(-130, 130); y = rnd.uniform(40, 170)
        t.flat([(x, y), (x + 3, y), (x - 5, y - 34), (x - 8, y - 34)], '#8ab8e0', smooth=False, opacity=0.7)
    parts.append(t)
    b = pt(cn, BODY, (0, 260), 1)
    for (x, y, rx, ry, c) in ((-110, 240, 70, 54, dark), (110, 236, 76, 56, dark), (0, 220, 110, 50, dark), (-60, 290, 86, 70, cl), (70, 296, 90, 72, cl), (0, 330, 84, 64, light(cl, 1.15)), (-130, 270, 50, 40, cl), (140, 272, 48, 38, cl)):
        S(b, ellipse(x, y, rx, ry, n=20), c)
    parts.append(b)
    h = pt(cn, HEAD, (0, 270), 2)
    h.flat(ellipse(0, 280, 70, 78, n=18), '#0e1018', opacity=0.75)   # the dark at the heart of it, and what looks out
    h.flat(M([(0, 340), (40, 330), (50, 290), (36, 256), (20, 226), (0, 220)]), '#9ab0c8', opacity=0.5)
    for s in (-1, 1):
        h.flat([(s * 8, 300), (s * 38, 312), (s * 36, 284), (s * 12, 278)], '#05060a', smooth=False); h.flat([(s * 20, 298), (s * 26, 299), (s * 23, 292)], bolt, smooth=False)
        h.flat([(s * 3, 268), (s * 9, 268), (s * 6, 254)], '#05060a', smooth=False)
    h.flat(M([(0, 246), (22, 242), (18, 226), (0, 220)]), '#05060a'); teeth(h, -18, 18, 245, 6, 9, '#9ab0c8', seed=3)
    h.flat([(-2, 340), (6, 318), (-4, 312), (4, 290), (0, 290), (-10, 314), (0, 320)], bolt, smooth=False)   # a crack of light down the brow
    parts.append(h)
    for side in (-1, 1):
        a = pt(cn, ARM_F if side > 0 else ARM_B, (side * 150, 250), 3)
        z = [(150, 256), (196, 214), (176, 206), (226, 150), (200, 146), (246, 70), (206, 124), (222, 128), (172, 180), (190, 186), (140, 236)]
        a.flat([(side * x, y) for x, y in z], bolt, smooth=False); a.flat([(side * (x - 5), y) for x, y in z[3:8]], '#fffbe0', smooth=False)
        parts.append(a)
    return parts


# ================================================================== The Hydra
def _drake_head(p, x, y, k, col, eye, tilt=0.0, s=1):
    q = lambda pts: [(x + (px * math.cos(tilt) - py * math.sin(tilt)) * k * s, y + (px * math.sin(tilt) + py * math.cos(tilt)) * k) for px, py in pts]
    for e in (-1, 1):
        S(p, q([(e * 16, 30), (e * 30, 70), (e * 24, 28)]), shade(col, 0.6))
    S(p, q(M([(0, 40), (24, 34), (32, 10), (22, -20), (12, -44), (0, -50)])), light(col, 1.15))
    p.flat(q(M([(0, -18), (16, -22), (12, -44), (0, -50)])), '#2a0c10');
    for e in (-1, 1):
        p.flat(q([(e * 13, -20), (e * 9, -46), (e * 5, -20)]), BONE, smooth=False); p.flat(q([(e * 4, -22), (e * 2, -34), (e * 0.5, -22)]), BONE, smooth=False)
        c = q([(e * 15, 10)])[0]; geye(p, c[0], c[1], 6 * k, eye, slit=True)
        p.flat(q([(e * 4, -8), (e * 8, -8), (e * 6, -12)]), INK, smooth=False)


def hydra():
    cn = 'Hydra'; sc, belly, eye = '#23483e', '#8a946a', '#ffcf3a'
    parts = []
    t = pt(cn, TAIL, (60, 60), 0)
    S(t, path_limb([(40, 70), (130, 60), (200, 100), (250, 60)], [36, 28, 16, 4], n_end=5), shade(sc, 0.8)); spikes(t, [(130 + i * 34, 86 + (i == 1) * 24, 22, 7, 80 - i * 14) for i in range(3)], shade(sc, 0.55))
    parts.append(t)
    for side in (-1, 1):
        p = pt(cn, LEG_F if side > 0 else LEG_B, (side * 80, 90), 0)
        S(p, path_limb([(side * 80, 100), (side * 110, 54), (side * 100, 8)], [30, 20, 16], n_end=5), shade(sc, 0.85)); spikes(p, [(side * 100 + j * 12, 6, 16, 4, -90 + j * 22) for j in (-1, 0, 1)], BONE)
        parts.append(p)
    b = pt(cn, BODY, (0, 110), 1)
    td = S(b, M([(0, 220), (70, 210), (120, 160), (124, 100), (90, 56), (0, 44)]), sc)
    b.clipped(td, M([(0, 190), (40, 180), (60, 130), (44, 70), (0, 56)]), belly); plates(b, td, 0, 180, 70, 7, 56, shade(belly, 0.7), bow=6)
    parts.append(b)
    for side in (-1, 1):
        a = pt(cn, ARM_F if side > 0 else ARM_B, (side * 70, 190), 2)
        S(a, path_limb([(side * 60, 180), (side * 130, 250), (side * 170, 320), (side * 150, 376)], [30, 24, 19, 16], n_end=5), sc)
        spikes(a, [(side * (128 + i * 22), 262 + i * 34, 20, 6, 90 - side * 60) for i in range(3)], shade(sc, 0.55))
        _drake_head(a, side * 146, 400, 1.5, sc, eye, tilt=-side * 0.35)
        parts.append(a)
    h = pt(cn, HEAD, (0, 210), 3)
    S(h, path_limb([(0, 200), (-14, 280), (10, 350), (0, 410)], [34, 27, 22, 18], n_end=5), sc); h.flat(path_limb([(0, 200), (-12, 280), (10, 350), (0, 400)], [14, 11, 9, 7], n_end=4), belly)
    _drake_head(h, 0, 446, 1.9, sc, '#ff5a2a')
    parts.append(h)
    return parts


# ================================================================== The Reaper Mantis
def mantis():
    cn = 'Mantis'; gr, dark, blade = '#5a8a3a', '#2e4a1e', '#d8e8c0'
    parts = []
    t = pt(cn, TAIL, (0, 150), 0)
    td = S(t, M([(0, 180), (34, 170), (46, 110), (30, 50), (0, 30)]), shade(gr, 0.8)); plates(t, td, 0, 160, 50, 6, 50, dark, bow=5)
    parts.append(t)
    for side in (-1, 1):
        w = pt(cn, WING_F if side > 0 else WING_B, (side * 20, 250), 0)
        w.flat([(side * 16, 256), (side * 90, 240), (side * 130, 130), (side * 100, 60), (side * 50, 140)], '#c8f0b0', opacity=0.4)
        w.stroke([(side * 16, 256), (side * 100, 160), (side * 104, 70)], dark, 1.6, opacity=0.6)
        parts.append(w)
        p = pt(cn, LEG_F if side > 0 else LEG_B, (side * 20, 170), 1)
        for j in range(2):
            S(p, path_limb([(side * 20, 176 - j * 16), (side * (90 + j * 30), 210 - j * 40), (side * (120 + j * 36), 0)], [7, 5.4, 2], n_end=4), dark if j else gr)
        parts.append(p)
    b = pt(cn, BODY, (0, 170), 2)
    S(b, M([(0, 330), (22, 322), (28, 250), (22, 180), (0, 166)]), gr); b.flat(M([(0, 316), (9, 312), (11, 250), (8, 190), (0, 180)]), light(gr, 1.3))
    parts.append(b)
    for side in (-1, 1):
        a = pt(cn, ARM_F if side > 0 else ARM_B, (side * 24, 310), 4)
        S(a, path_limb([(side * 24, 312), (side * 84, 250)], [10, 8], n_end=4), gr)
        S(a, path_limb([(side * 84, 250), (side * 110, 350)], [12, 9], n_end=4), light(gr, 1.1)); spikes(a, [(side * (88 + i * 5), 268 + i * 18, 14, 4, 0 if side > 0 else 180) for i in range(5)], dark)
        S(a, [(side * 104, 352), (side * 120, 356), (side * 150, 300), (side * 150, 220), (side * 130, 160), (side * 132, 230), (side * 122, 300)], blade); a.flat([(side * 120, 352), (side * 146, 300), (side * 147, 230), (side * 136, 180), (side * 140, 240), (side * 132, 300)], '#ffffff', smooth=False, opacity=0.7)
        parts.append(a)
    h = pt(cn, HEAD, (0, 330), 5)
    for s in (-1, 1):
        h.stroke([(s * 10, 384), (s * 30, 440), (s * 60, 456)], dark, 2.4)
    S(h, M([(0, 392), (30, 386), (46, 366), (20, 330), (0, 318)]), light(gr, 1.2))
    for s in (-1, 1):
        h.flat(ellipse(s * 30, 368, 13, 17, n=12, rot=-s * 0.5), '#ffb020'); h.flat(ellipse(s * 30, 366, 3, 5, n=8), INK)
        S(h, path_limb([(s * 6, 326), (s * 12, 310), (s * 4, 300)], [4, 3, 1], n_end=3), dark)
    parts.append(h)
    return parts


# ================================================================== Grandfather Toad
def toad():
    cn = 'Toad'; sk, belly, wart = '#3e4a2a', '#8a8a66', '#222c16'
    parts = []
    for side in (-1, 1):
        p = pt(cn, LEG_F if side > 0 else LEG_B, (side * 150, 90), 0)
        S(p, ellipse(side * 170, 90, 70, 86, n=18), shade(sk, 0.8)); S(p, path_limb([(side * 190, 40), (side * 250, 16), (side * 280, 6)], [20, 14, 8], n_end=4), sk)
        spikes(p, [(side * 270, 10, 30, 7, (0 if side > 0 else 180) + j * 22) for j in (-1, 0, 1)], sk)
        parts.append(p)
    b = pt(cn, BODY, (0, 80), 1)
    td = S(b, M([(0, 250), (90, 240), (160, 190), (184, 110), (150, 34), (0, 14)]), sk)
    b.clipped(td, M([(0, 150), (96, 140), (120, 80), (96, 30), (0, 14)]), belly)
    spots(b, td, [(-120, 190, 16), (110, 200, 13), (150, 150, 10), (-150, 130, 12), (-70, 226, 9), (60, 232, 8), (-30, 200, 7), (140, 100, 8)], wart, op=0.9)
    parts.append(b)
    for side in (-1, 1):
        a = pt(cn, ARM_F if side > 0 else ARM_B, (side * 100, 110), 3)
        S(a, path_limb([(side * 100, 116), (side * 124, 60), (side * 110, 10)], [26, 18, 13], n_end=5), sk)
        for j in (-1, 0, 1):
            a.flat(path_limb([(side * 110, 12), (side * (110 + j * 26 + side * 8), 0)], [7, 5], n_end=4), sk)
        parts.append(a)
    h = pt(cn, HEAD, (0, 180), 4)
    for s in (-1, 1):
        S(h, ellipse(s * 76, 250, 34, 26, n=16), sk); h.flat(ellipse(s * 76, 252, 22, 13, n=12), '#0c0608'); h.flat(ellipse(s * 76, 252, 17, 8, n=12), '#c8c0a0'); h.flat(rect(s * 76 - 15, 250, s * 76 + 15, 254), '#0c0608', smooth=False)
    h.flat(M([(0, 216), (120, 206), (150, 182), (90, 150), (0, 140)]), '#3a0c14'); teeth(h, -112, 112, 210, 13, 30, BONE, jag=0.5, seed=3); teeth(h, -92, 92, 150, 11, 24, BONE, down=False, jag=0.5, seed=9)
    for (x, y) in ((-60, 176), (56, 170)):
        h.flat(M([(0, 12), (9, 10), (11, 0), (6, -10), (0, -12)]) and [(x + px, y + py) for px, py in M([(0, 12), (9, 10), (11, 0), (6, -10), (0, -12)])], BONE)
    S(h, path_limb([(0, 170), (20, 130), (-10, 90), (16, 56)], [26, 20, 14, 8], n_end=5), '#c0486a')
    parts.append(h)
    return parts


class _Scaled:
    """Draw into a part through a scale about a point (to make one piece of a creature bigger without redrawing it)."""
    def __init__(self, p, cx, cy, k):
        self.p, self.cx, self.cy, self.k = p, cx, cy, k
    def T(self, pts):
        return [(self.cx + (x - self.cx) * self.k, self.cy + (y - self.cy) * self.k) for x, y in pts]
    def shape(self, pts, col, **kw):
        return self.p.shape(self.T(pts), col, **kw)
    def flat(self, pts, col, **kw):
        return self.p.flat(self.T(pts), col, **kw)
    def __getattr__(self, n):
        return getattr(self.p, n)


# ================================================================== The Bone Dragon
def bone_dragon():
    cn = 'BoneDragon'; bone, dark, fire = '#d8cfb8', '#6a6050', '#5ad8ff'
    parts = [wing(cn, -1, (-50, 300), '#3a4a5a', bone, span=1.9, z=1.5), wing(cn, 1, (50, 300), '#3a4a5a', bone, span=1.9, z=1.5)]
    t = pt(cn, TAIL, (40, 120), 0)
    for i in range(9):
        x = 50 + i * 26; y = 110 - i * 9 + (i > 5) * (i - 5) * 14; r = 15 - i * 1.3
        S(t, [(x - r, y + r * 0.6), (x, y + r), (x + r, y + r * 0.6), (x + r * 1.3, y), (x + r, y - r * 0.6), (x - r, y - r * 0.6), (x - r * 1.3, y)], bone, smooth=False)
    parts.append(t)
    for side in (-1, 1):
        p = pt(cn, LEG_F if side > 0 else LEG_B, (side * 60, 130), 1)
        S(p, path_limb([(side * 60, 136), (side * 96, 80), (side * 76, 14)], [13, 9, 7], n_end=4), bone); spikes(p, [(side * 76 + j * 12, 12, 22, 4, -90 + j * 26) for j in (-1, 0, 1)], bone)
        parts.append(p)
    b = pt(cn, BODY, (0, 140), 2)
    b.flat(M([(0, 300), (50, 290), (70, 230), (50, 150), (0, 130)]), fire, opacity=0.28)   # what burns where the heart was
    b.flat(M([(0, 270), (26, 262), (36, 220), (24, 170), (0, 160)]), fire, opacity=0.5)
    for i in range(6):
        y = 290 - i * 26; w = 74 - abs(i - 2) * 8
        for s in (-1, 1):
            S(b, path_limb([(0, y), (s * w * 0.7, y - 4), (s * w, y - 26), (s * w * 0.6, y - 44)], [6, 5.4, 4.4, 2], n_end=3), bone)
    b.flat(rect(-8, 120, 8, 320), bone, smooth=False)
    for i in range(8):
        b.flat(rect(-12, 128 + i * 24, 12, 138 + i * 24), dark, smooth=False)
    parts.append(b)
    h = pt(cn, HEAD, (0, 320), 3)
    _H = h; h = _Scaled(h, 0, 326, 1.7)
    S(h, path_limb([(0, 310), (0, 360)], [12, 10], n_end=4), bone)
    for s in (-1, 1):
        horn(h, s * 30, 440, 96, 12, 90 - s * 30, bone, curve=-s * 0.5); horn(h, s * 40, 416, 50, 8, 90 - s * 70, bone, curve=-s * 0.4)
    hd = S(h, M([(0, 456), (36, 446), (48, 410), (34, 368), (18, 336), (0, 328)]), light(bone, 1.08))
    for s in (-1, 1):
        h.flat([(s * 10, 416), (s * 36, 428), (s * 34, 404), (s * 14, 398)], '#100c10', smooth=False); h.flat(ellipse(s * 23, 412, 5, 6, n=8), fire)
        h.flat([(s * 3, 380), (s * 9, 380), (s * 6, 366)], '#100c10', smooth=False)
    h.flat(M([(0, 356), (20, 352), (16, 334), (0, 328)]), '#100c10'); teeth(h, -18, 18, 354, 6, 12, bone, seed=2); h.flat(M([(0, 344), (10, 342), (8, 334), (0, 332)]), fire, opacity=0.8)
    parts.append(_H)
    return parts


# ================================================================== The Devourer: a mouth that learned to walk
def devourer():
    cn = 'Devourer'; fl, dark, gum = '#7a2a3a', '#3a1420', '#c0486a'
    parts = []
    for side in (-1, 1):
        p = pt(cn, LEG_F if side > 0 else LEG_B, (side * 80, 70), 0)
        S(p, path_limb([(side * 80, 80), (side * 110, 40), (side * 100, 6)], [30, 22, 18], n_end=5), dark); spikes(p, [(side * 100 + j * 14, 6, 18, 5, -90 + j * 24) for j in (-1, 0, 1)], BONE)
        parts.append(p)
    b = pt(cn, BODY, (0, 180), 1)
    td = S(b, ellipse(0, 200, 170, 160, n=30), fl, hl='#e08a9a')
    rnd = random.Random(8)
    for i in range(9):   # eyes round the rim, none of them looking the same way
        a = math.pi * (0.12 + 0.76 * i / 8); x, y = math.cos(a) * 140, 200 + math.sin(a) * 132
        geye(b, x, y, 11 + (i % 3) * 3, '#ffe86a', slit=i % 2 == 0)
    parts.append(b)
    h = pt(cn, HEAD, (0, 190), 2)
    h.flat(ellipse(0, 180, 118, 100, n=26), gum); h.flat(ellipse(0, 176, 92, 76, n=24), '#4a0c18'); h.flat(ellipse(0, 172, 56, 44, n=20), '#16040a')
    for (r, n, l, ph) in ((114, 22, 30, 0), (90, 16, 24, 0.2), (58, 11, 18, 0.1)):   # three rings of teeth, each inside the last
        for i in range(n):
            a = i / n * math.tau + ph
            spikes(h, [(math.cos(a) * r, 178 + math.sin(a) * r * 0.85, l, 6.4, math.degrees(a) + 180)], BONE)
    parts.append(h)
    for side in (-1, 1):
        a = pt(cn, ARM_F if side > 0 else ARM_B, (side * 160, 190), 3)
        S(a, path_limb([(side * 156, 196), (side * 220, 150), (side * 226, 90)], [18, 13, 9], n_end=4), fl)
        spikes(a, [(side * 226 + j * 10, 90, 26, 4, -90 + j * 24) for j in (-1, 0, 1)], BONE)
        parts.append(a)
    return parts


# ================================================================== The Nameless
def nameless():
    cn = 'Nameless'; robe, deep, glow = '#1e1a2a', '#0c0a14', '#c58cff'
    parts = []
    t = pt(cn, TAIL, (0, 60), 0)
    rnd = random.Random(21)
    for i in range(9):
        x = (i - 4) * 26
        tendril(t, [(x * 0.5, 80), (x, 50), (x * 1.4 + rnd.uniform(-10, 10), 22), (x * 1.9 + rnd.uniform(-14, 14), 2)], 11, shade('#3a2a4a', 0.7 + (i % 3) * 0.15))
    parts.append(t)
    b = pt(cn, BODY, (0, 200), 1)
    td = S(b, M([(0, 430), (50, 420), (84, 360), (96, 240), (120, 120), (104, 50), (0, 40)]), robe)
    b.clipped(td, M([(0, 410), (22, 400), (30, 300), (22, 160), (0, 120)]), deep)
    for i in range(14):   # it is looking at you out of all of them
        x = rnd.uniform(-90, 90); y = rnd.uniform(70, 380); r = rnd.uniform(5, 12)
        b.clipped(td, ellipse(x, y, r * 1.3, r, n=10), '#080610'); b.clipped(td, ellipse(x, y, r * 0.8, r * 0.7, n=10), glow); b.clipped(td, ellipse(x, y, r * 0.2, r * 0.6, n=8), '#080610')
    parts.append(b)
    for side in (-1, 1):
        a = pt(cn, ARM_F if side > 0 else ARM_B, (side * 76, 390), 3)
        S(a, path_limb([(side * 70, 392), (side * 150, 330), (side * 170, 230), (side * 210, 150)], [20, 14, 10, 7], n_end=4), robe)
        for j in range(4):
            a.flat(path_limb([(side * 208, 152), (side * (220 + j * 12), 116 + j * 6), (side * (224 + j * 16), 70 + j * 12)], [4.4, 3.4, 1.2], n_end=3), '#b8a8c8')
        parts.append(a)
    h = pt(cn, HEAD, (0, 420), 4)
    for s in (-1, 1):   # antlers
        horn(h, s * 24, 500, 110, 9, 90 - s * 24, '#b8a8c8', curve=-s * 0.3)
        horn(h, s * 44, 546, 50, 6, 90 - s * 70, '#b8a8c8', curve=s * 0.3); horn(h, s * 60, 584, 44, 5, 90 - s * 60, '#b8a8c8', curve=s * 0.4); horn(h, s * 34, 524, 36, 5, 90 + s * 20, '#b8a8c8', curve=s * 0.2)
    S(h, M([(0, 520), (30, 512), (38, 480), (24, 440), (10, 410), (0, 404)]), '#d8cfc0')   # a deer's skull where a face should be
    for s in (-1, 1):
        h.flat(ellipse(s * 18, 482, 10, 13, n=10, rot=s * 0.4), '#080610'); h.circle(s * 18, 480, 4.4, glow)
        h.flat([(s * 3, 432), (s * 8, 432), (s * 5, 418)], '#080610', smooth=False)
    parts.append(h)
    return parts


ROSTER = [
    ('BroodMother', brood_mother), ('Ironhide', ironhide), ('HiveQueen', hive_queen), ('KingOoze', king_ooze), ('Lamplighter', lamplighter),
    ('Carapace', carapace), ('Wyrm', wyrm), ('Thunderhead', thunderhead), ('TwinHound', twin_hound), ('Furnace', furnace),
    ('Hydra', hydra), ('MirrorQueen', mirror_queen), ('Unblinking', unblinking), ('Mantis', mantis), ('Toad', toad),
    ('BoneDragon', bone_dragon), ('Titan', titan), ('Leviathan', leviathan), ('Devourer', devourer), ('Nameless', nameless),
]
