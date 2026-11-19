"""
FX, decal, prop and icon sprites for Dead Man's Hand (flat vector, Sulfur-like).
Writes PNGs to RawArt/Sprites/{FX,Decals,Props,Icons}.  Greyscale sprites are tinted in-game.
"""
import io
import math
import os
import random
import sys

import cairosvg
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from vectorkit import bleed, Part, ellipse, blobby, limb, smooth_path, shade, light, render_part  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
BASE = os.path.join(ROOT, 'RawArt', 'Sprites')

BLOOD = '#b0141c'
BLOOD_D = '#7a0c14'
BONE = '#ece0c4'
GOLD = '#f2c43a'
INK = '#1d1418'


def save(part, folder, name, size_px=256, square=True):
    svg, pw, ph, off, size = render_part(part, scale=1.0, pad=2, max_px=4096)
    # render at requested pixel size (longest side), keep aspect
    k = size_px / max(pw, ph)
    w, h = max(4, int(pw * k)), max(4, int(ph * k))
    data = cairosvg.svg2png(bytestring=svg.encode(), output_width=w, output_height=h)
    img = Image.open(io.BytesIO(data)).convert('RGBA')
    if square:
        s = max(w, h)
        sq = Image.new('RGBA', (s, s), (0, 0, 0, 0))
        sq.alpha_composite(img, ((s - w) // 2, (s - h) // 2))
        img = sq
    d = os.path.join(BASE, folder)
    os.makedirs(d, exist_ok=True)
    bleed(img).save(os.path.join(d, name + '.png'))
    return img


def P(name):
    return Part(name, (0, 0), 'Prop', 0)


def star(n, r_out, r_in, rot=0.0, jitter=0.0, seed=0):
    rnd = random.Random(seed)
    pts = []
    for i in range(n * 2):
        a = rot + math.pi * i / n
        r = (r_out if i % 2 == 0 else r_in) * (1 + rnd.uniform(-jitter, jitter))
        pts.append((math.cos(a) * r, math.sin(a) * r))
    return pts


def splat(r, n_drops=9, seed=0, lobes=11, wob=0.28):
    rnd = random.Random(seed)
    pts = []
    for i in range(lobes * 2):
        a = 2 * math.pi * i / (lobes * 2)
        rr = r * (1.0 + (rnd.uniform(0.1, wob) if i % 2 == 0 else -rnd.uniform(0.05, wob * 0.6)))
        pts.append((math.cos(a) * rr, math.sin(a) * rr))
    drops = []
    for i in range(n_drops):
        a = rnd.uniform(0, 2 * math.pi)
        d = r * rnd.uniform(1.25, 1.9)
        dr = r * rnd.uniform(0.06, 0.16)
        drops.append((math.cos(a) * d, math.sin(a) * d, dr))
    return pts, drops


# ------------------------------------------------------------------ FX
def fx():
    p = P('Star')
    p.flat(star(7, 100, 34, jitter=0.25, seed=1), '#ffb22e')
    p.flat(star(7, 66, 24, rot=0.2, jitter=0.2, seed=2), '#ffe36a')
    p.flat(ellipse(0, 0, 30, 30, n=14), '#fffbe8')
    save(p, 'FX', 'FX_Star', 256)

    p = P('Star2')
    p.flat(star(5, 100, 28, rot=0.4, jitter=0.3, seed=7), '#ffb22e')
    p.flat(star(5, 62, 20, rot=0.6, jitter=0.2, seed=8), '#ffe36a')
    p.flat(ellipse(0, 0, 26, 26, n=14), '#fffbe8')
    save(p, 'FX', 'FX_Star2', 256)

    p = P('Flame')   # side-on muzzle flame pointing +X
    p.flat([(0, 30), (60, 46), (120, 22), (200, 0), (120, -22), (60, -46), (0, -30)], '#ffb22e')
    p.flat([(0, 18), (50, 26), (130, 8), (150, 0), (130, -8), (50, -26), (0, -18)], '#ffe36a')
    p.flat(ellipse(10, 0, 20, 16, n=12), '#fffbe8')
    save(p, 'FX', 'FX_Flame', 256)

    p = P('Slash')   # white crescent impact streak
    outer = [(math.cos(a) * 100, math.sin(a) * 100) for a in [math.radians(t) for t in range(200, 341, 10)]]
    inner = [(math.cos(a) * 82 + 6, math.sin(a) * 70 + 14) for a in [math.radians(t) for t in range(340, 199, -10)]]
    p.flat(outer + inner, '#ffffff', smooth=True)
    save(p, 'FX', 'FX_Slash', 256)

    p = P('Puff')   # cloud: white with grey shading (tinted)
    blobs = [(-40, -10, 46), (10, 10, 56), (54, -14, 40), (0, -30, 44), (-60, -36, 30), (66, -40, 28)]
    for (x, y, r) in blobs:
        p.flat(ellipse(x, y - 8, r, r, n=16), '#b8b8b8')
    for (x, y, r) in blobs:
        p.flat(ellipse(x - r * 0.12, y + r * 0.08, r * 0.86, r * 0.86, n=16), '#ffffff')
    save(p, 'FX', 'FX_Puff', 256)

    p = P('Ring')
    o = ellipse(0, 0, 100, 100, n=40)
    i = ellipse(0, 0, 84, 84, n=40)[::-1]
    p.raw('<path d="%s %s" fill="#ffffff" fill-rule="evenodd"/>' % (smooth_path(o), smooth_path(i)), o)
    save(p, 'FX', 'FX_Ring', 256)

    p = P('Disc')
    p.flat(ellipse(0, 0, 100, 100, n=36), '#ffffff')
    save(p, 'FX', 'FX_Disc', 128)

    p = P('Spark')
    p.flat([(-100, 0), (0, 14), (100, 0), (0, -14)], '#ffffff', smooth=False)
    save(p, 'FX', 'FX_Spark', 128)

    p = P('Bolt')
    rnd = random.Random(4)
    pts = [(-100, 0)]
    for i in range(1, 8):
        pts.append((-100 + i * 25, rnd.uniform(-22, 22)))
    pts.append((100, 0))
    up = [(x, y + 7) for x, y in pts]
    dn = [(x, y - 7) for x, y in pts][::-1]
    p.flat(up + dn, '#ffffff', smooth=False)
    save(p, 'FX', 'FX_Bolt', 256)

    for k in range(4):
        p = P('Blood%d' % k)
        pts, drops = splat(60, n_drops=8 + k * 2, seed=10 + k, lobes=9 + k)
        p.flat(pts, BLOOD)
        inner, _ = splat(34, n_drops=0, seed=40 + k, lobes=7)
        p.flat([(x + 8, y - 6) for x, y in inner], BLOOD_D)
        for (x, y, r) in drops:
            p.flat(ellipse(x, y, r, r, n=10), BLOOD)
        save(p, 'FX', 'FX_Blood_%d' % k, 256)

    p = P('Spray')   # directional spray (+X)
    rnd = random.Random(3)
    p.flat(blobby(-40, 0, 50, 34, n=16, jitter=0.15, seed=2), BLOOD)
    for i in range(14):
        x = rnd.uniform(-10, 110)
        y = rnd.uniform(-30, 30) * (x + 40) / 120
        r = rnd.uniform(4, 14) * (1.2 - x / 160)
        p.flat(ellipse(x, y, r * 1.6, r, n=10), BLOOD)
    save(p, 'FX', 'FX_BloodSpray', 256)

    p = P('Acid')
    pts, drops = splat(60, n_drops=10, seed=77)
    p.flat(pts, '#8fd83a')
    inner, _ = splat(36, n_drops=0, seed=78)
    p.flat(inner, '#c6ff6a')
    for (x, y, r) in drops:
        p.flat(ellipse(x, y, r, r, n=10), '#8fd83a')
    save(p, 'FX', 'FX_Acid', 256)

    p = P('Scorch')
    pts, drops = splat(80, n_drops=6, seed=55, lobes=13, wob=0.35)
    p.flat(pts, '#1a1416')
    inner, _ = splat(50, n_drops=0, seed=56)
    p.flat(inner, '#2c2226')
    save(p, 'FX', 'FX_Scorch', 256)

    p = P('Hole')
    p.flat(star(8, 40, 22, jitter=0.3, seed=9), '#3a3036')
    p.flat(ellipse(0, 0, 16, 16, n=12), '#0e0a0c')
    save(p, 'FX', 'FX_Hole', 64)

    # gibs
    p = P('Bone')
    p.shape(limb((-60, 0), (60, 0), 10, 10), BONE, offset=(-0.05, 0.15))
    for x in (-60, 60):
        p.shape(ellipse(x, 10, 16, 14, n=12), BONE, offset=(-0.1, 0.15))
        p.shape(ellipse(x, -10, 16, 14, n=12), BONE, offset=(-0.1, 0.15))
    save(p, 'FX', 'FX_Gib_Bone', 128)

    for k, (col, seed) in enumerate((('#c43a46', 3), ('#a82c3a', 9))):
        p = P('Meat%d' % k)
        d = p.shape(blobby(0, 0, 60, 44, n=14, jitter=0.25, seed=seed), col, hl='#ff8a8a')
        p.clipped(d, blobby(-10, -8, 40, 14, n=10, seed=seed), '#f0b8b0', opacity=0.7)
        save(p, 'FX', 'FX_Gib_Meat_%d' % k, 128)

    p = P('Eye')
    p.shape(ellipse(0, 0, 50, 50, n=18), '#f4ecdc', hl='#ffffff')
    p.flat(ellipse(10, 6, 22, 22, n=14), '#ff5a3c')
    p.flat(ellipse(12, 8, 10, 10, n=12), INK)
    p.flat(limb((-46, -10), (-90, -30), 8, 4), '#c43a46')
    save(p, 'FX', 'FX_Gib_Eye', 128)

    p = P('Shell')
    p.shape([(-40, -12), (30, -12), (40, -8), (40, 8), (30, 12), (-40, 12)], '#e0a83a', smooth=False, hl='#fff0a0')
    p.flat([(-46, -14), (-38, -14), (-38, 14), (-46, 14)], '#a8762a', smooth=False)
    save(p, 'FX', 'FX_Shell', 64)

    p = P('Coin')
    p.shape(ellipse(0, 0, 60, 60, n=24), GOLD, hl='#fff6c0')
    p.flat(ellipse(0, 0, 44, 44, n=24), '#d9a52a')
    p.raw('<text x="0" y="22" font-family="Arial Black,Arial" font-weight="900" font-size="64" fill="%s" text-anchor="middle">$</text>' % GOLD, [(-60, -60), (60, 60)])
    save(p, 'FX', 'FX_Coin', 128)

    # soft glow (raster radial gradient, not vector)
    s = 256
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    px = img.load()
    for y in range(s):
        for x in range(s):
            d = math.hypot(x - s / 2 + 0.5, y - s / 2 + 0.5) / (s / 2)
            a = max(0.0, 1.0 - d) ** 2.2
            px[x, y] = (255, 255, 255, int(a * 255))
    img.save(os.path.join(BASE, 'FX', 'FX_Glow.png'))  # glow is white everywhere already


# ------------------------------------------------------------------ decals
def decals():
    for k in range(2):
        p = P('Crack%d' % k)
        rnd = random.Random(20 + k)

        def branch(x, y, a, length, w, depth):
            pts = [(x, y)]
            for i in range(5):
                a += rnd.uniform(-0.5, 0.5)
                x += math.cos(a) * length / 5
                y += math.sin(a) * length / 5
                pts.append((x, y))
            p.stroke(pts, '#1e1a1c', w, smooth=False)
            if depth < 2:
                for _ in range(2):
                    j = rnd.randint(1, 4)
                    branch(pts[j][0], pts[j][1], a + rnd.choice((-1, 1)) * rnd.uniform(0.5, 1.1), length * 0.55, w * 0.6, depth + 1)
        branch(-90, 0, 0.1, 190, 6, 0)
        save(p, 'Decals', 'D_Crack_%d' % k, 256)

    p = P('Patch')   # plaster chipped off, bricks underneath
    hole = blobby(0, 0, 100, 70, n=16, jitter=0.25, seed=5)
    d = p.flat(hole, '#7a3e34')
    for row in range(-4, 5):
        y = row * 18
        off = 18 if row % 2 else 0
        for col in range(-6, 7):
            x = col * 36 + off
            p.clipped(d, [(x - 15, y - 6.5), (x + 15, y - 6.5), (x + 15, y + 6.5), (x - 15, y + 6.5)], '#a85846' if (row + col) % 3 else '#9a4c3e', smooth=False)
    save(p, 'Decals', 'D_Patch', 256)

    p = P('Grime')
    for i, (x, y, r) in enumerate(((-30, 0, 70), (40, -20, 50), (10, 40, 40), (-60, -40, 30))):
        p.flat(blobby(x, y, r, r * 0.8, n=14, jitter=0.2, seed=i), '#000000', opacity=0.5)
    save(p, 'Decals', 'D_Grime', 256)

    p = P('Drip')     # vertical grime drips (wall tops)
    for i in range(7):
        x = -90 + i * 30
        L = 60 + (i * 37) % 90
        p.flat(limb((x, 100), (x + 2, 100 - L), 12, 6), '#000000', opacity=0.45)
    p.flat([(-110, 110), (110, 110), (110, 86), (-110, 86)], '#000000', smooth=False, opacity=0.45)
    save(p, 'Decals', 'D_Drip', 256)

    # Wanted poster
    p = P('Wanted')
    p.shape([(-70, -100), (70, -100), (74, 96), (-72, 100)], '#e8d6a8', smooth=False, offset=(0.0, 0.0), lit=False)
    p.flat([(-56, 30), (56, 30), (56, -50), (-56, -50)], '#c8b48a', smooth=False)
    p.flat(blobby(0, -12, 30, 32, n=16, seed=3), '#6a5a46')
    p.flat(ellipse(-12, -6, 6, 6, n=8), '#e8d6a8')
    p.flat(ellipse(12, -6, 6, 6, n=8), '#e8d6a8')
    p.raw('<text x="0" y="-62" font-family="Georgia,serif" font-weight="900" font-size="30" fill="#4a2a1a" text-anchor="middle">WANTED</text>', [(-80, -110), (80, 110)])
    p.raw('<text x="0" y="78" font-family="Georgia,serif" font-weight="700" font-size="20" fill="#7a1a1a" text-anchor="middle">$10,000</text>', [])
    save(p, 'Decals', 'D_Wanted', 256)

    # Casino ad poster
    p = P('Lucky')
    p.flat([(-80, -110), (80, -110), (80, 110), (-80, 110)], '#2a1438', smooth=False)
    p.flat([(-70, -100), (70, -100), (70, 100), (-70, 100)], '#4a1c3a', smooth=False)
    p.flat(star(5, 46, 20, rot=-math.pi / 2, seed=1), GOLD)
    p.raw('<text x="0" y="-52" font-family="Arial Black,Arial" font-weight="900" font-size="26" fill="#ff5a6a" text-anchor="middle">LUCKY\'S</text>', [])
    p.raw('<text x="0" y="78" font-family="Arial Black,Arial" font-weight="900" font-size="20" fill="#ffe36a" text-anchor="middle">JACKPOT!</text>', [])
    save(p, 'Decals', 'D_Lucky', 256)

    p = P('Arrow')
    p.flat([(-90, -14), (30, -14), (30, -40), (90, 0), (30, 40), (30, 14), (-90, 14)], '#e8e0d0', smooth=False, opacity=0.85)
    save(p, 'Decals', 'D_Arrow', 128)

    p = P('SkullG')   # painted skull graffiti
    p.flat(blobby(0, 20, 70, 64, bottom=1.2, n=18, seed=2), '#e8e0d0', opacity=0.9)
    p.flat(ellipse(-26, 20, 18, 20, n=12), '#2a2226')
    p.flat(ellipse(26, 20, 18, 20, n=12), '#2a2226')
    p.flat([(0, -6), (-8, -20), (8, -20)], '#2a2226', smooth=False)
    for i in range(5):
        p.flat([(-30 + i * 15, -46), (-22 + i * 15, -46), (-22 + i * 15, -70), (-30 + i * 15, -70)], '#e8e0d0', smooth=False, opacity=0.9)
    save(p, 'Decals', 'D_Skull', 256)


# ------------------------------------------------------------------ props (billboards, base at bottom centre)
def props():
    for k in range(3):
        p = P('Grass%d' % k)
        rnd = random.Random(30 + k)
        cols = ('#a8964a', '#8c7c3a', '#c2ae5a')
        for i in range(9):
            x = rnd.uniform(-60, 60)
            h = rnd.uniform(60, 120)
            lean = rnd.uniform(-30, 30)
            p.flat([(x - 8, 0), (x + 8, 0), (x + lean, h)], cols[i % 3], smooth=False)
        save(p, 'Props', 'P_Grass_%d' % k, 128)

    p = P('Bush')
    d = None
    for (x, y, r) in ((-50, 50, 50), (40, 56, 56), (0, 90, 54), (-10, 40, 50), (70, 30, 34), (-80, 28, 30)):
        p.flat(ellipse(x, y, r, r * 0.9, n=14), '#4e6a3a')
    for (x, y, r) in ((-56, 58, 40), (34, 66, 44), (-4, 100, 42), (66, 38, 24)):
        p.flat(ellipse(x, y, r, r * 0.86, n=14), '#6a8a46')
    save(p, 'Props', 'P_Bush', 256)

    for k in range(2):
        p = P('Cactus%d' % k)
        g, gs = '#5a8a4a', '#3e6a3a'
        p.shape(limb((0, 0), (0, 240 if k == 0 else 180), 30, 28), g, shadow=gs)
        p.shape(limb((26, 90), (70, 110), 14, 14), g, shadow=gs)
        p.shape(limb((70, 110), (72, 170), 14, 13), g, shadow=gs)
        if k == 0:
            p.shape(limb((-26, 130), (-66, 140), 13, 13), g, shadow=gs)
            p.shape(limb((-66, 140), (-68, 190), 13, 12), g, shadow=gs)
        for i in range(10):
            p.stroke([(-14 + (i % 3) * 14, 20 + i * 20), (-14 + (i % 3) * 14, 26 + i * 20)], '#d8e0a0', 2.5)
        if k == 1:
            p.flat(ellipse(0, 186, 14, 10, n=10), '#ff6a8a')
        save(p, 'Props', 'P_Cactus_%d' % k, 256)

    p = P('DeadTree')
    br = '#3a2e2a'

    def tbranch(x, y, a, L, w, depth):
        x2, y2 = x + math.cos(a) * L, y + math.sin(a) * L
        p.flat(limb((x, y), (x2, y2), w, w * 0.65), br)
        if depth < 3:
            tbranch(x2, y2, a + 0.45, L * 0.68, w * 0.62, depth + 1)
            tbranch(x2, y2, a - 0.5, L * 0.6, w * 0.6, depth + 1)
    tbranch(0, 0, math.pi / 2, 160, 22, 0)
    save(p, 'Props', 'P_DeadTree', 512)

    p = P('Tumble')
    rnd = random.Random(8)
    for i in range(26):
        a = rnd.uniform(0, 2 * math.pi)
        r = rnd.uniform(20, 70)
        pts = [(math.cos(a + t * 0.6) * (r + t * 6), 70 + math.sin(a + t * 0.6) * (r + t * 6)) for t in range(6)]
        p.stroke(pts, '#9a7a4a' if i % 2 else '#7a5e3a', 4)
    save(p, 'Props', 'P_Tumble', 256)

    p = P('Bones')
    p.shape(blobby(0, 30, 34, 30, n=16, seed=3), BONE)
    p.flat(ellipse(-12, 32, 8, 9, n=10), INK)
    p.flat(ellipse(12, 32, 8, 9, n=10), INK)
    for i in range(4):
        p.stroke([(40 + i * 18, 4), (48 + i * 18, 40 - i * 4), (58 + i * 18, 44 - i * 6)], BONE, 6)
    p.flat(limb((-80, 6), (-30, 4), 6, 6), BONE)
    save(p, 'Props', 'P_Bones', 256)

    p = P('Moon')
    p.flat(ellipse(0, 0, 100, 100, n=40), '#f4f0dc')
    p.flat(ellipse(-26, 24, 18, 18, n=16), '#dcd6be')
    p.flat(ellipse(30, -20, 24, 24, n=16), '#dcd6be')
    p.flat(ellipse(10, 44, 10, 10, n=12), '#dcd6be')
    save(p, 'Props', 'P_Moon', 256)

    p = P('Cloud')
    for (x, y, r) in ((-90, 0, 46), (-30, 20, 66), (50, 10, 56), (110, -4, 36), (0, -14, 50)):
        p.flat(ellipse(x, y, r, r * 0.7, n=16), '#ffffff')
    save(p, 'Props', 'P_Cloud', 512)


# ------------------------------------------------------------------ icons (pickups + HUD)
def icons():
    def bg(p, col):
        p.flat(ellipse(0, 0, 100, 100, n=36), '#1e1620')
        p.flat(ellipse(0, 0, 90, 90, n=36), col)

    p = P('Clover')
    bg(p, '#2e6a3a')
    for a in range(4):
        ang = math.pi / 4 + a * math.pi / 2
        cx, cy = math.cos(ang) * 30, math.sin(ang) * 30
        p.shape(ellipse(cx, cy, 30, 30, n=16), '#7ae06a', hl='#d8ffb0')
    p.flat(limb((0, 0), (20, -66), 7, 5), '#5ac04a')
    save(p, 'Icons', 'I_Clover', 128)

    p = P('MaxAmmo')
    bg(p, '#5a6a3a')
    p.shape([(-56, -44), (56, -44), (56, 30), (-56, 30)], '#8a7a4a', smooth=False, hl='#c8b47a')
    for i in range(4):
        x = -36 + i * 24
        p.shape([(x - 8, 30), (x + 8, 30), (x + 8, 60), (x, 74), (x - 8, 60)], '#e0a83a', smooth=False)
    p.flat([(-56, -10), (56, -10), (56, -2), (-56, -2)], '#5a4e2e', smooth=False)
    save(p, 'Icons', 'I_MaxAmmo', 128)

    p = P('Insta')
    bg(p, '#6a1c2a')
    p.shape(blobby(0, 10, 52, 48, bottom=1.25, n=18, seed=2), BONE)
    p.flat(ellipse(-20, 12, 14, 16, n=12), INK)
    p.flat(ellipse(20, 12, 14, 16, n=12), INK)
    p.flat(ellipse(-18, 12, 5, 5, n=8), '#ff5a3c')
    p.flat(ellipse(22, 12, 5, 5, n=8), '#ff5a3c')
    for i in range(4):
        p.flat([(-24 + i * 14, -34), (-16 + i * 14, -34), (-16 + i * 14, -52), (-24 + i * 14, -52)], BONE, smooth=False)
    save(p, 'Icons', 'I_InstaKill', 128)

    p = P('X2')
    bg(p, '#1c4a6a')
    p.raw('<text x="0" y="28" font-family="Arial Black,Arial" font-weight="900" font-size="84" fill="#ffe36a" text-anchor="middle">x2</text>', [(-90, -90), (90, 90)])
    save(p, 'Icons', 'I_DoublePoints', 128)

    p = P('Nuke')
    bg(p, '#6a4a1c')
    p.shape(ellipse(-6, -10, 50, 50, n=24), '#2a2a32', hl='#6a6a7a')
    p.flat([(20, 26), (40, 46), (34, 52), (14, 32)], '#4a4a52', smooth=False)
    p.stroke([(37, 49), (50, 66), (62, 60)], '#c8a060', 5)
    p.flat(star(6, 20, 8, seed=3), '#ffb22e')
    p.flat(ellipse(0, 0, 7, 7, n=8), '#fffbe8')
    save(p, 'Icons', 'I_Nuke', 128)

    p = P('FireSale')
    bg(p, '#8a2a1c')
    p.flat([(-50, -60), (50, -60), (60, 10), (0, 70), (-60, 10)], '#ff8a2e')
    p.flat([(-30, -60), (30, -60), (36, -10), (0, 30), (-36, -10)], '#ffe36a')
    p.raw('<text x="0" y="-26" font-family="Arial Black,Arial" font-weight="900" font-size="40" fill="#8a2a1c" text-anchor="middle">%</text>', [])
    save(p, 'Icons', 'I_FireSale', 128)

    p = P('Money')
    bg(p, '#3a5a2a')
    p.shape(blobby(0, -14, 56, 54, top=0.8, n=18, seed=4), '#b08a54', hl='#e0c48a')
    p.flat(limb((-20, 40), (20, 44), 10, 10), '#7a5a34')
    p.raw('<text x="0" y="6" font-family="Arial Black,Arial" font-weight="900" font-size="54" fill="#3a5a2a" text-anchor="middle">$</text>', [])
    save(p, 'Icons', 'I_MoneyBag', 128)

    p = P('Heart')
    p.shape([(0, -70), (-70, 0), (-74, 40), (-44, 70), (0, 44), (44, 70), (74, 40), (70, 0)], '#e03a46', hl='#ff9aa0')
    save(p, 'Icons', 'I_Heart', 128)

    p = P('Skull')
    p.shape(blobby(0, 10, 60, 56, bottom=1.25, n=18, seed=2), BONE)
    p.flat(ellipse(-22, 12, 16, 18, n=12), INK)
    p.flat(ellipse(22, 12, 16, 18, n=12), INK)
    for i in range(4):
        p.flat([(-26 + i * 16, -42), (-18 + i * 16, -42), (-18 + i * 16, -62), (-26 + i * 16, -62)], BONE, smooth=False)
    save(p, 'Icons', 'I_Skull', 128)

    p = P('Card')
    p.shape([(-50, -70), (50, -70), (50, 70), (-50, 70)], '#f8f4ea', smooth=False, lit=False)
    p.flat([(-42, -62), (42, -62), (42, 62), (-42, 62)], '#a01c2a', smooth=False)
    p.flat(star(4, 30, 12, rot=math.pi / 4, seed=1), GOLD)
    save(p, 'Icons', 'I_Card', 128)


def scope():
    # black mask with a soft-edged round window (sniper scope overlay)
    s = 512
    img = Image.new('RGBA', (s, s), (0, 0, 0, 255))
    px = img.load()
    for y in range(s):
        for x in range(s):
            d = math.hypot(x - s / 2 + 0.5, y - s / 2 + 0.5) / (s / 2)
            a = min(1.0, max(0.0, (d - 0.9) / 0.05))
            px[x, y] = (8, 6, 8, int(a * 255))
    os.makedirs(os.path.join(BASE, 'Icons'), exist_ok=True)
    img.save(os.path.join(BASE, 'Icons', 'I_Scope.png'))


if __name__ == '__main__':
    scope()
    fx()
    decals()
    props()
    icons()
    # preview sheet
    imgs = []
    for folder in ('FX', 'Decals', 'Props', 'Icons'):
        for f in sorted(os.listdir(os.path.join(BASE, folder))):
            imgs.append(Image.open(os.path.join(BASE, folder, f)).convert('RGBA'))
    cell, cols = 110, 12
    rows = (len(imgs) + cols - 1) // cols
    sheet = Image.new('RGBA', (cols * cell, rows * cell), (60, 80, 84, 255))
    for i, im in enumerate(imgs):
        im.thumbnail((cell - 8, cell - 8))
        sheet.alpha_composite(im, ((i % cols) * cell + 4, (i // cols) * cell + 4))
    os.makedirs(os.path.join(ROOT, 'RawArt', 'preview'), exist_ok=True)
    sheet.save(os.path.join(ROOT, 'RawArt', 'preview', 'fx.png'))
    print('fx sprites: %d' % len(imgs))
