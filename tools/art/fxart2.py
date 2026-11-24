"""More FX sprites: one clear shape per kind of effect, all white/grey so the game tints them."""
import math, random, sys, os
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from fxart import P, save, star
from vectorkit import ellipse, smooth_path

def ringpath(ro, ri, n=48):
    o = ellipse(0, 0, ro, ro, n=n); i = ellipse(0, 0, ri, ri, n=n)[::-1]
    return '<path d="%s %s" fill="#ffffff" fill-rule="evenodd"/>' % (smooth_path(o), smooth_path(i)), o

def main():
    # a shockwave: a hard thin front, a fainter one behind it, and dashes thrown ahead
    p = P('Shock'); svg, b = ringpath(92, 84); p.raw(svg, b); svg, _ = ringpath(74, 71); p.raw(svg.replace('#ffffff', '#b0b0b0'), b)
    for k in range(16):
        a = k / 16 * 6.283 + 0.1; c, s = math.cos(a), math.sin(a); p.stroke([(c * 94, s * 94), (c * (100 if k % 2 else 97), s * (100 if k % 2 else 97))], '#ffffff', 3, smooth=False)
    save(p, 'FX', 'FX_Shock', 256)
    # a snow crystal
    p = P('Snow')
    for k in range(6):
        a = k / 6 * 6.283; c, s = math.cos(a), math.sin(a)
        p.stroke([(0, 0), (c * 96, s * 96)], '#ffffff', 9, smooth=False)
        for d, l in ((38, 30), (62, 24), (82, 14)):
            for e in (-1, 1):
                b2 = a + e * 1.05; p.stroke([(c * d, s * d), (c * d + math.cos(b2) * l, s * d + math.sin(b2) * l)], '#ffffff', 6, smooth=False)
    p.flat(star(6, 26, 14, rot=0.52), '#dcdcdc', smooth=False); p.flat(ellipse(0, 0, 8, 8, n=10), '#ffffff')
    save(p, 'FX', 'FX_Snow', 256)
    # a shard of ice, point toward +X
    p = P('Shard'); p.flat([(-100, 0), (-40, 22), (100, 0), (-40, -22)], '#c8c8c8', smooth=False); p.flat([(-100, 0), (-40, 22), (100, 0), (-30, 4)], '#ffffff', smooth=False)
    save(p, 'FX', 'FX_Shard', 128)
    # a circle of script for anything that marks the ground
    p = P('Rune'); svg, b = ringpath(100, 94); p.raw(svg, b); svg, _ = ringpath(80, 77); p.raw(svg, b)
    for k in range(24):
        a = k / 24 * 6.283; c, s = math.cos(a), math.sin(a)
        if k % 2: p.stroke([(c * 83, s * 83), (c * 91, s * 91)], '#ffffff', 4, smooth=False)
        else: p.flat([(c * 87 + s * 4, s * 87 - c * 4), (c * 91, s * 91), (c * 87 - s * 4, s * 87 + c * 4), (c * 83, s * 83)], '#ffffff', smooth=False)
    for t in range(2):
        pts = [(math.cos(t * 1.047 + k * 2.094) * 76, math.sin(t * 1.047 + k * 2.094) * 76) for k in range(3)]
        p.stroke(pts, '#ffffff', 3, smooth=False, closed=True)
    svg, _ = ringpath(30, 26); p.raw(svg, b); p.flat(star(4, 18, 6), '#ffffff', smooth=False)
    save(p, 'FX', 'FX_Rune', 256)
    # broken ground: cracks running out from a point
    p = P('Crack'); rnd = random.Random(5)
    for k in range(9):
        a = k / 9 * 6.283 + rnd.uniform(-0.2, 0.2); L = rnd.uniform(60, 100); pts = [(0, 0)]; n = 5
        for j in range(1, n + 1):
            r = L * j / n; aa = a + rnd.uniform(-0.25, 0.25); pts.append((math.cos(aa) * r, math.sin(aa) * r))
        for j in range(len(pts) - 1):
            p.stroke([pts[j], pts[j + 1]], '#120e10', max(1.5, 9 - j * 1.8), smooth=False)
        if k % 2:
            j = 2; bb = a + rnd.choice((-1, 1)) * 0.8; p.stroke([pts[j], (pts[j][0] + math.cos(bb) * 26, pts[j][1] + math.sin(bb) * 26)], '#120e10', 3, smooth=False)
    p.flat(star(9, 20, 9, jitter=0.3, seed=3), '#120e10', smooth=False)
    save(p, 'FX', 'FX_Crack', 256)
    # one tongue of flame, standing up
    p = P('FlameUp')
    p.flat([(0, 100), (26, 50), (44, 6), (40, -46), (0, -80), (-40, -46), (-46, 0), (-22, 36), (-30, 70)], '#b4b4b4')
    p.flat([(2, 56), (20, 14), (24, -34), (0, -66), (-24, -34), (-22, 6), (-6, 26)], '#e6e6e6')
    p.flat([(2, 6), (12, -30), (0, -54), (-12, -30)], '#ffffff')
    save(p, 'FX', 'FX_FlameUp', 128)
    # forked lightning along +X
    p = P('Zap'); rnd = random.Random(11)
    def bolt(x0, y0, x1, y1, w, n):
        pts = [(x0, y0)]
        for i in range(1, n): t = i / n; pts.append((x0 + (x1 - x0) * t + rnd.uniform(-6, 6), y0 + (y1 - y0) * t + rnd.uniform(-16, 16)))
        pts.append((x1, y1))
        for j in range(len(pts) - 1): p.stroke([pts[j], pts[j + 1]], '#ffffff', max(2, w * (1 - j / len(pts) * 0.6)), smooth=False, cap='butt')
        return pts
    m = bolt(-100, 0, 100, 0, 12, 8); bolt(m[3][0], m[3][1], 40, 52, 6, 4); bolt(m[5][0], m[5][1], 96, -40, 5, 3); bolt(m[2][0], m[2][1], -10, -46, 5, 3)
    save(p, 'FX', 'FX_Zap', 256)
    # a drop, heavy end toward +X
    p = P('Drop'); p.flat([(-100, 0), (-20, 16), (40, 30), (84, 22), (100, 0), (84, -22), (40, -30), (-20, -16)], '#ffffff'); save(p, 'FX', 'FX_Drop', 96)
    # a plus for anything that mends
    p = P('Cross'); p.flat([(-28, 100), (28, 100), (28, 28), (100, 28), (100, -28), (28, -28), (28, -100), (-28, -100), (-28, -28), (-100, -28), (-100, 28), (-28, 28)], '#ffffff', smooth=False); save(p, 'FX', 'FX_Cross', 96)
    # a skull for a killing blow
    p = P('SkullFx'); p.flat(ellipse(0, 14, 78, 74, n=24), '#ffffff'); p.flat([(-44, -30), (44, -30), (40, -86), (-40, -86)], '#ffffff', smooth=False)
    for e in (-1, 1): p.flat(ellipse(e * 30, 8, 22, 26, n=14), '#141014')
    p.flat([(0, -14), (12, -40), (-12, -40)], '#141014', smooth=False)
    for k in (-2, -1, 0, 1, 2): p.stroke([(k * 15, -56), (k * 15, -86)], '#141014', 4, smooth=False)
    save(p, 'FX', 'FX_SkullFx', 128)
    # a ring of fire seen from above: tongues leaning outward
    p = P('FireRing')
    for k in range(18):
        a = k / 18 * 6.283; c, s = math.cos(a), math.sin(a); r0, r1 = 62, (100 if k % 2 else 86); w = 13
        p.flat([(c * r0 - s * w, s * r0 + c * w), (c * (r0 + 14) - s * (w * 0.8) + c * 0, s * (r0 + 14) + c * (w * 0.8)), (c * r1 - s * 5, s * r1 + c * 5), (c * r0 + s * w, s * r0 - c * w)], '#ffffff' if k % 2 else '#c8c8c8')
    svg, b = ringpath(70, 56); p.raw(svg, b)
    save(p, 'FX', 'FX_FireRing', 256)
    # smoke: a softer, rounder cloud than the puff
    p = P('Smoke')
    for (x, y, r, col) in [(-34, 6, 50, '#8c8c8c'), (26, 14, 58, '#9a9a9a'), (0, -26, 54, '#b4b4b4'), (-46, -34, 34, '#c4c4c4'), (50, -30, 36, '#c4c4c4'), (4, -10, 40, '#d8d8d8')]:
        p.flat(ellipse(x, y, r, r, n=18), col)
    save(p, 'FX', 'FX_Smoke', 192)

main()
