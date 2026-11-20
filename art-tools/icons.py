"""Item icons for Dead Man's Hand: one flat vector object per upgrade and tonic on a dark tile (no emoji, no
outlines), in the game's palette. Writes RawArt/Sprites/Icons/U_<index>.png and TN_<index>.png."""
import json, math, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from vectorkit import Part, ellipse, blobby, limb, path_limb, rect, shade  # noqa: E402
import fxart  # noqa: E402

RED, GOLD, GREEN, BLUE, PURPLE, BONE, STEEL, ORANGE, PINK, BROWN, INK = '#c8342c', '#f2c43a', '#6ad06a', '#5ab8f0', '#b070ff', '#ece0c4', '#9aa0b0', '#ff8a30', '#ff6fae', '#8a5a34', '#1d1418'
OFF = (-0.08, 0.07)

def S(p, pts, c, smooth=True): return p.shape(pts, c, smooth=smooth, offset=OFF)
def F(p, pts, c, smooth=False): return p.flat(pts, c, smooth=smooth)
def rr(cx, cy, w, h, r, n=5):
    pts = []
    for (sx, sy, a0) in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
        ox, oy = cx + sx * (w / 2 - r), cy + sy * (h / 2 - r)
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n); pts.append((ox + math.cos(a) * r, oy + math.sin(a) * r))
    return pts
def star(cx, cy, r, n=5, k=0.45, rot=90):
    return [(cx + math.cos(math.radians(rot) + i * math.pi / n) * (r * k if i % 2 else r), cy + math.sin(math.radians(rot) + i * math.pi / n) * (r * k if i % 2 else r)) for i in range(n * 2)]
def rot(pts, deg, cx=0, cy=0):
    a = math.radians(deg); c, s = math.cos(a), math.sin(a)
    return [(cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c) for x, y in pts]

# ------------------------------------------------------------------ glyphs (drawn within about +-70 units)
def bullet(p, c):
    S(p, rot([(-16, -60), (16, -60), (16, 14), (10, 44), (0, 62), (-10, 44), (-16, 14)], -30), c, False)
    F(p, rot(rect(-19, -66, 19, -50), -30), shade(c, 0.6)); F(p, rot(rect(-16, 6, 16, 14), -30), shade(c, 0.7))
def shells(p, c):
    for x in (-34, 0, 34):
        S(p, rect(x - 13, -50, x + 13, 40), c, False); F(p, rect(x - 15, -58, x + 15, -34), GOLD); F(p, rr(x, 44, 26, 14, 6), shade(c, 0.75))
def mag(p, c):
    S(p, [(-22, 58), (22, 58), (34, -52), (-6, -58)], c, False)
    for i in range(3): F(p, rect(-16 + i * 3, 30 - i * 26, 22 + i * 3, 40 - i * 26), GOLD)
def boot(p, c):
    S(p, [(-34, 60), (6, 60), (8, -6), (56, -24), (60, -52), (-36, -52)], c, False); F(p, rect(-40, -62, 62, -50), shade(c, 0.55)); F(p, rect(-34, 44, 6, 54), shade(c, 0.7))
def heart(p, c):
    S(p, [(0, -58), (-56, 2), (-58, 34), (-36, 56), (-12, 52), (0, 34), (12, 52), (36, 56), (58, 34), (56, 2)], c)
def shield(p, c):
    S(p, [(0, 64), (52, 46), (48, -14), (0, -64), (-48, -14), (-52, 46)], c, False); F(p, [(0, 46), (32, 34), (30, -8), (0, -42)], shade(c, 0.72))
def coin(p, c):
    S(p, ellipse(0, 0, 56, 56, n=24), c); F(p, ellipse(0, 0, 40, 40, n=20), shade(c, 0.78), True); F(p, rect(-7, -26, 7, 26), c); F(p, rect(-18, 10, 18, 20), c); F(p, rect(-18, -20, 18, -10), c)
def flame(p, c):
    S(p, [(0, 66), (30, 22), (52, -8), (40, -48), (0, -62), (-40, -48), (-50, -14), (-28, 8), (-22, 36)], c); F(p, [(2, 14), (22, -18), (12, -46), (-12, -46), (-22, -22)], '#ffe27a', True)
def snow(p, c):
    for a in (0, 60, 120):
        F(p, rot(rect(-7, -62, 7, 62), a), c)
        for s in (-1, 1): F(p, rot([(0, s * 34), (20, s * 54), (12, s * 58), (0, s * 46), (-12, s * 58), (-20, s * 54)], a), c)
    F(p, ellipse(0, 0, 14, 14, n=12), '#ffffff', True)
def bolt(p, c):
    S(p, [(14, 66), (-38, -4), (-6, -4), (-18, -66), (40, 12), (6, 12)], c, False)
def skull(p, c):
    S(p, [(0, 60), (44, 48), (54, 10), (40, -18), (26, -24), (26, -52), (-26, -52), (-26, -24), (-40, -18), (-54, 10), (-44, 48)], c)
    for s in (-1, 1): F(p, ellipse(s * 22, 8, 14, 16, n=12), INK, True)
    F(p, [(0, -6), (8, -22), (-8, -22)], INK)
    for i in range(3): F(p, rect(-17 + i * 13, -52, -11 + i * 13, -34), INK)
def feather(p, c):
    S(p, rot([(0, 68), (26, 30), (28, -20), (8, -50), (-8, -50), (-28, -20), (-26, 30)], -35), c); F(p, rot(rect(-3, -66, 3, 52), -35), shade(c, 0.6))
def wing(p, c):
    S(p, [(-56, -10), (-30, 40), (20, 60), (60, 44), (36, 30), (56, 14), (26, 6), (44, -12), (10, -14), (22, -34), (-20, -30)], c, False)
def dash(p, c):
    for i, x in enumerate((-40, -4, 32)):
        F(p, [(x - 14, 46), (x + 22, 0), (x - 14, -46), (x - 30, -46), (x + 6, 0), (x - 30, 46)], c if i == 2 else shade(c, 0.6 + i * 0.15))
def hook(p, c):
    p.stroke([(-10, 64), (-10, 4), (-8, -30), (18, -48), (44, -30), (42, -4)], c, 15); F(p, [(30, 2), (58, 2), (42, 30)], c); F(p, ellipse(-10, 60, 16, 16, n=12), shade(c, 0.7), True); F(p, ellipse(-10, 60, 7, 7, n=10), INK, True)
def cross(p, c):
    p.stroke(ellipse(0, 0, 46, 46, n=24), c, 10, closed=True)
    for a in (0, 90, 180, 270): F(p, rot(rect(-5, 30, 5, 66), a), c)
    F(p, ellipse(0, 0, 9, 9, n=10), RED, True)
def clock(p, c):
    S(p, ellipse(0, 0, 58, 58, n=24), c); F(p, ellipse(0, 0, 44, 44, n=20), BONE, True); F(p, rect(-4, -2, 4, 34), INK); F(p, rot(rect(-4, -2, 4, 26), -110), INK)
def blast(p, c):
    S(p, star(0, 0, 66, 8, 0.55, 12), c, False); F(p, star(0, 0, 38, 8, 0.55, 30), '#ffe27a')
def drop(p, c):
    S(p, [(0, 66), (34, 8), (40, -24), (22, -52), (0, -60), (-22, -52), (-40, -24), (-34, 8)], c)
def fang(p, c):
    for s in (-1, 1): S(p, [(s * 10, 50), (s * 46, 50), (s * 40, 0), (s * 26, -58), (s * 14, -6)], c, False)
    F(p, rect(-52, 46, 52, 62), RED)
def crown(p, c):
    S(p, [(-54, -40), (-58, 36), (-28, 4), (0, 52), (28, 4), (58, 36), (54, -40)], c, False); F(p, rect(-54, -48, 54, -30), shade(c, 0.7))
    for x in (-30, 0, 30): F(p, ellipse(x, -39, 6, 6, n=8), RED, True)
def dice(p, c):
    S(p, rot(rr(0, 0, 100, 100, 18), 12), c, False)
    for (x, y) in ((-26, 26), (26, -26), (0, 0), (-26, -26), (26, 26)): F(p, ellipse(*rot([(x, y)], 12)[0], 10, 10, n=10), INK, True)
def card(p, c):
    S(p, rot(rr(-14, 0, 70, 104, 10), 12), shade(BONE, 0.8), False); S(p, rot(rr(12, 0, 70, 104, 10), -8), BONE, False)
    F(p, rot([(12, 30), (34, 0), (12, -30), (-10, 0)], -8), c)
def shoe(p, c):
    p.stroke([(-36, -54), (-46, 0), (-30, 42), (0, 56), (30, 42), (46, 0), (36, -54)], c, 22)
    for (x, y) in ((-42, -24), (42, -24), (-30, 30), (30, 30), (0, 52)): F(p, ellipse(x, y, 5, 5, n=8), INK, True)
def key(p, c):
    p.stroke(ellipse(-28, 28, 22, 22, n=16), c, 14, closed=True); F(p, rot(rect(-8, -8, 78, 8), -45, 0, 0), c); F(p, rot(rect(44, -26, 58, 0), -45), c); F(p, rot(rect(64, -22, 76, 0), -45), c)
def pig(p, c):
    S(p, ellipse(0, 0, 60, 46, n=22), c); F(p, ellipse(48, 4, 18, 14, n=12), shade(c, 0.8), True); F(p, [(-26, 38), (-8, 62), (0, 40)], c); F(p, rect(-36, -58, -18, -34), c); F(p, rect(16, -58, 34, -34), c); F(p, ellipse(20, 18, 6, 6, n=8), INK, True); F(p, rect(-16, 40, 12, 47), INK)
def battery(p, c):
    S(p, rr(0, -4, 76, 112, 12), STEEL, False); F(p, rect(-16, 52, 16, 66), STEEL); F(p, rect(-28, -50, 28, 20), c); F(p, [(8, 16), (-18, -18), (0, -18), (-8, -46), (18, -10), (0, -10)], INK)
def rocket(p, c):
    S(p, rot([(0, 68), (22, 34), (22, -30), (-22, -30), (-22, 34)], -40), c, False); F(p, rot([(22, -6), (44, -40), (22, -30)], -40), RED); F(p, rot([(-22, -6), (-44, -40), (-22, -30)], -40), RED); F(p, rot([(-12, -30), (12, -30), (0, -64)], -40), ORANGE); F(p, ellipse(*rot([(0, 22)], -40)[0], 10, 10, n=10), '#bfe6ff', True)
def dagger(p, c):
    S(p, rot([(0, 70), (16, 20), (12, -14), (-12, -14), (-16, 20)], 35), c, False); F(p, rot(rect(-30, -24, 30, -12), 35), GOLD); F(p, rot(rect(-8, -62, 8, -24), 35), BROWN)
def hammer(p, c):
    F(p, rot(rect(-8, -66, 8, 30), 30), BROWN); S(p, rot(rr(0, 40, 92, 48, 8), 30), c, False)
def eye(p, c):
    S(p, [(-64, 0), (-30, 36), (0, 44), (30, 36), (64, 0), (30, -36), (0, -44), (-30, -36)], BONE); F(p, ellipse(0, 0, 28, 28, n=16), c, True); F(p, ellipse(0, 0, 12, 12, n=10), INK, True)
def bottle(p, c):
    S(p, [(-14, 66), (14, 66), (14, 30), (36, 6), (36, -60), (-36, -60), (-36, 6), (-14, 30)], c, False); F(p, rect(-18, 58, 18, 70), BROWN); F(p, rect(-36, -36, 36, 0), BONE)
def starg(p, c): S(p, star(0, 0, 66), c, False)
def magnet(p, c):
    p.stroke([(-34, 50), (-34, -10), (-24, -38), (0, -50), (24, -38), (34, -10), (34, 50)], c, 26, cap='butt'); F(p, rect(-47, 30, -21, 52), BONE); F(p, rect(21, 30, 47, 52), BONE)
def plus(p, c):
    S(p, rr(0, 0, 116, 116, 20), BONE, False); F(p, rect(-14, -42, 14, 42), c); F(p, rect(-42, -14, 42, 14), c)
def chain(p, c):
    for i, (x, y) in enumerate(((-34, 34), (0, 0), (34, -34))): p.stroke(rot(rr(0, 0, 54, 34, 16), -45, 0, 0) and [(px + x, py + y) for px, py in rot(rr(0, 0, 54, 34, 16), -45)], c if i != 1 else shade(c, 0.7), 10, smooth=False, closed=True)
def gear(p, c):
    S(p, star(0, 0, 64, 8, 0.74, 0), c, False); F(p, ellipse(0, 0, 22, 22, n=14), INK, True)
def spring(p, c):
    p.stroke([(-34, -56), (34, -44), (-34, -20), (34, -8), (-34, 16), (34, 28), (-34, 52)], c, 12, smooth=False); F(p, rect(-44, -66, 44, -54), shade(c, 0.6)); F(p, rect(-44, 50, 44, 62), shade(c, 0.6))
def wind(p, c):
    for i, y in enumerate((36, 0, -36)): p.stroke([(-62, y), (20 + i * 10, y), (40 + i * 8, y + 16), (22 + i * 8, y + 26)], c, 11)
def fist(p, c):
    S(p, rr(0, 0, 104, 88, 26), c, False)
    for i in range(3): F(p, rect(-22 + i * 26 - 2, 4, -22 + i * 26 + 2, 44), shade(c, 0.6))
    F(p, rr(-34, -30, 50, 26, 10), shade(c, 0.8))
def bag(p, c):
    S(p, [(-20, 40), (20, 40), (50, -10), (44, -52), (-44, -52), (-50, -10)], c); F(p, [(-22, 40), (22, 40), (30, 62), (0, 52), (-30, 62)], c); F(p, rect(-22, 34, 22, 44), shade(c, 0.6)); F(p, rect(-5, -34, 5, 14), GOLD); F(p, rect(-16, -6, 16, 2), GOLD); F(p, rect(-16, -26, 16, -18), GOLD)
def hat(p, c):
    S(p, ellipse(0, -24, 68, 14, n=20), shade(c, 0.8)); S(p, [(-36, -22), (-30, 40), (0, 30), (30, 40), (36, -22)], c, False); F(p, rect(-36, -22, 36, -8), RED)
def lens(p, c):
    p.stroke(ellipse(-8, 10, 40, 40, n=20), GOLD, 12, closed=True); F(p, ellipse(-8, 10, 33, 33, n=18), c, True); F(p, rot(rect(-6, -70, 8, -30), -40, -8, 10), BROWN)
def clover(p, c):
    for a in range(4):
        ang = math.pi / 4 + a * math.pi / 2; S(p, ellipse(math.cos(ang) * 28, 6 + math.sin(ang) * 28, 28, 28, n=14), c)
    F(p, limb((0, 0), (18, -64), 7, 5), shade(c, 0.7), True)
def plate(p, c):
    S(p, rr(0, 0, 112, 100, 12), c, False)
    for (x, y) in ((-40, 34), (40, 34), (-40, -34), (40, -34)): F(p, ellipse(x, y, 7, 7, n=8), shade(c, 0.55), True)
    F(p, rect(-56, -4, 56, 4), shade(c, 0.75))
def tooth(p, c): S(p, [(-34, 56), (34, 56), (40, 14), (22, -60), (4, -10), (-10, -58), (-40, 12)], c)
def barrel(p, c):
    S(p, rect(-62, -14, 46, 22), c, False); F(p, rect(46, -20, 64, 28), shade(c, 0.7)); F(p, ellipse(64, 4, 6, 12, n=10), INK, True); F(p, rect(-62, -44, -34, -14), BROWN)
def tape(p, c):
    S(p, ellipse(0, 0, 58, 58, n=22), c); F(p, ellipse(0, 0, 24, 24, n=14), INK, True); F(p, [(40, -44), (70, -62), (66, -30)], c)
def thorn(p, c):
    S(p, rr(0, -6, 84, 96, 16), c, False); F(p, [(-42, 42), (-20, 42), (0, 14), (20, 42), (42, 42), (42, 60), (-42, 60)], INK)
    for (x, y, a) in ((-46, 10, 90), (46, 10, -90), (-46, -30, 90), (46, -30, -90)): F(p, rot([(x - 9, y), (x + 9, y), (x, y + 26)], a, x, y), BONE)

G = dict(bullet=bullet, shells=shells, mag=mag, boot=boot, heart=heart, shield=shield, coin=coin, flame=flame, snow=snow, bolt=bolt, skull=skull, feather=feather,
         wing=wing, dash=dash, hook=hook, cross=cross, clock=clock, blast=blast, drop=drop, fang=fang, crown=crown, dice=dice, card=card, shoe=shoe, key=key, pig=pig,
         battery=battery, rocket=rocket, dagger=dagger, hammer=hammer, eye=eye, bottle=bottle, star=starg, magnet=magnet, plus=plus, chain=chain, gear=gear, spring=spring,
         wind=wind, fist=fist, bag=bag, hat=hat, lens=lens, clover=clover, plate=plate, tooth=tooth, barrel=barrel, tape=tape, thorn=thorn)

# upgrade name -> (glyph, colour[, small corner glyph, its colour])
MAP = {
 'Underbarrel Launcher': ('barrel', STEEL, 'blast', ORANGE), 'Gravity Coil': ('magnet', PURPLE, 'star', BONE), 'Rail Capacitor': ('battery', BLUE, 'bolt', GOLD), 'Flak Tube': ('shells', STEEL, 'blast', RED),
 'Active Reload': ('mag', GOLD, 'clock', BONE), 'Echo Chamber': ('bullet', BLUE, 'bullet', BONE), 'Ricochet Rounds': ('bullet', GREEN, 'chain', GOLD), 'Closer': ('mag', RED, 'skull', BONE),
 'Opening Hand': ('card', BONE, 'bullet', GOLD), 'Fan the Hammer': ('barrel', GOLD, 'wind', BONE), "Reaper's Feed": ('skull', BONE, 'mag', STEEL), 'Steady Aim': ('cross', GOLD, 'clock', BONE),
 'Shrapnel Jacket': ('blast', STEEL, 'fang', BONE), 'Hollow Charge': ('bullet', PURPLE, 'dash', BONE), 'Twin Link': ('bullet', GOLD, 'plus', BONE), 'Drum Magazine': ('gear', STEEL, 'mag', GOLD),
 'Battering Ram': ('fist', RED, 'clock', BONE), 'Bone Breaker': ('hammer', BONE, 'blast', RED), 'Iron Gut': ('plate', RED, 'heart', RED), 'Blood Frenzy': ('fang', RED, 'dash', BONE), 'Meat Shield': ('shield', RED, 'fist', BROWN),
 'Overclocked Servos': ('gear', GOLD, 'bolt', BLUE), 'Bored-Out Barrel': ('barrel', ORANGE, 'gear', STEEL), 'Twin Mount': ('gear', BLUE, 'plus', GOLD), 'Shock Fence': ('bolt', BLUE, 'gear', STEEL), 'Field Repairs': ('hammer', GREEN, 'plus', RED),
 'Slow Hands': ('clock', GOLD, 'eye', BONE), 'Trick Holster': ('barrel', BROWN, 'clock', BONE), 'Dead to Rights': ('eye', RED, 'skull', BONE), 'Two-Gun Kid': ('barrel', GOLD, 'barrel', STEEL), 'Fanning Practice': ('hat', BROWN, 'wind', BONE),
 'Eagle Eye': ('eye', GOLD, 'cross', BONE), "Crow's Nest": ('wing', BLUE, 'cross', BONE), 'Marked for Death': ('cross', RED, 'skull', BONE), 'Steady Breath': ('lens', GREEN, 'cross', BONE), 'Reel Spring': ('hook', GOLD, 'spring', STEEL),
 'Bigger Boom': ('blast', ORANGE, 'plus', BONE), 'Bomb Belt': ('bag', GREEN, 'blast', RED), 'Short Fuse': ('blast', RED, 'clock', BONE), 'Daisy Chain': ('blast', PURPLE, 'chain', GOLD), 'Fire in the Hole': ('rocket', RED, 'blast', ORANGE),
 'Whetstone': ('dagger', STEEL), 'Quick Wrists': ('fist', BROWN, 'bolt', GOLD), 'Long Reach': ('dagger', BONE, 'plus', GOLD), 'Brass Knuckles': ('fist', GOLD),
 "Butcher's Apron": ('dagger', RED, 'heart', RED), 'Wide Swing': ('dagger', STEEL, 'wind', BONE), 'Serrated Edge': ('fang', STEEL, 'drop', RED), 'Pickpocket': ('fist', BROWN, 'coin', GOLD),
 'Cheap Shot': ('dagger', GOLD, 'cross', BONE), 'Hot Iron': ('hammer', ORANGE), 'Live Wire': ('dagger', BLUE, 'bolt', GOLD), 'Bayonet Drill': ('dagger', STEEL, 'bullet', GOLD),
 'Second Wind': ('fist', BLUE, 'dash', BONE), 'Riot Guard': ('plate', STEEL, 'fist', BROWN), 'Headsman': ('hammer', RED), 'Whirlwind': ('wind', BONE, 'dagger', STEEL),
 'Berserker': ('fist', RED, 'fang', BONE), "Hangman's Mask": ('hat', RED, 'dagger', BONE),
 'Hollow Points': ('bullet', GOLD), 'Quick Hands': ('fist', BROWN, 'dash', BONE), 'Hair Trigger': ('barrel', STEEL, 'bolt', GOLD), 'Extended Mag': ('mag', STEEL),
 'Bandolier': ('shells', RED), 'Running Shoes': ('boot', BROWN), 'Spring Heels': ('spring', STEEL), 'Tough Hide': ('heart', RED), 'Bandage Roll': ('tape', BONE, 'plus', RED),
 'Lucky Penny': ('coin', ORANGE, 'clover', GREEN), 'Loose Change': ('coin', GOLD), 'Lens Shard': ('lens', BLUE), 'Steady Grip': ('fist', BROWN, 'cross', BONE),
 'Scrap Plating': ('plate', STEEL), 'Bloodletter': ('dagger', STEEL, 'drop', RED), 'Matchbook': ('flame', ORANGE), 'Cold Rounds': ('bullet', BLUE, 'snow', BONE),
 'Slide Grease': ('bottle', GREEN, 'dash', BONE), 'Coffee Thermos': ('bottle', BROWN, 'flame', ORANGE), 'Wind Chime': ('wind', BLUE), 'Rusty Shiv': ('dagger', ORANGE),
 'Pry Bar': ('hammer', RED), 'Skeleton Key': ('key', BONE), 'Piggy Bank': ('pig', PINK), 'Dash Boots': ('boot', BLUE, 'dash', BONE), 'Grapple Oil': ('bottle', GOLD, 'hook', STEEL),
 "Climber's Chalk": ('bag', BONE), 'Hot Lead': ('bullet', ORANGE, 'flame', RED), 'Medkit': ('plus', RED), 'Monster Tooth': ('tooth', BONE), 'Coin Purse': ('bag', BROWN),
 'Headhunter Scope': ('cross', BONE, 'skull', BONE), 'Momentum Rounds': ('bullet', GREEN, 'dash', BONE), 'Featherweight': ('feather', BONE), 'Horseshoe Magnet': ('magnet', RED),
 'Steel Toes': ('boot', STEEL),
 "Hopper's Feather": ('feather', GREEN), 'Spare Battery': ('battery', GREEN), 'Ukulele Wire': ('chain', GOLD, 'bolt', BLUE), 'Wisp Jar': ('bottle', '#5ff0e0', 'blast', ORANGE),
 'Gasoline Can': ('bottle', RED, 'flame', ORANGE), 'Topaz Brooch': ('shield', GOLD), 'Leech Seed': ('drop', GREEN), 'Tailwind Ribbon': ('wind', PINK), 'Sticky Dynamite': ('blast', RED),
 'ATG Rocket': ('rocket', STEEL), 'Tri-Tip': ('dagger', RED, 'drop', RED), 'Quick-Draw Holster': ('barrel', BROWN, 'dash', GOLD), 'Blast Holster': ('barrel', BROWN, 'blast', ORANGE),
 'Thunderclap Boots': ('boot', PURPLE, 'bolt', GOLD), 'Parkour Tape': ('tape', GREEN), 'Hookshot Spring': ('hook', STEEL, 'spring', GOLD), 'Dash Blades': ('dash', STEEL, 'dagger', BONE),
 'Energy Drink': ('bottle', BLUE, 'bolt', GOLD), "Gambler's Monocle": ('lens', GOLD), 'Bounty Poster': ('card', RED, 'skull', BONE), "Rabbit's Foot": ('boot', BONE, 'clover', GREEN),
 'Fuel Cell': ('battery', ORANGE), 'Rebar Rounds': ('bullet', STEEL, 'dash', RED), 'Buckshot Extender': ('shells', ORANGE), 'Adrenal Gland': ('heart', ORANGE, 'bolt', GOLD),
 'Blast Powder': ('bag', RED, 'blast', ORANGE), 'Hard Hat': ('hat', GOLD), 'Cowboy Spurs': ('gear', GOLD), 'Mag Coupler': ('mag', GOLD), 'Thorny Vest': ('thorn', GREEN),
 'High Ground': ('wing', BLUE), 'Comp Card': ('card', GOLD), 'Mantle Spikes': ('thorn', STEEL), 'Second Barrel': ('barrel', STEEL, 'blast', ORANGE),
 'Behemoth Shell': ('shells', PURPLE, 'blast', ORANGE), 'Spirit Daggers': ('dagger', '#5ff0e0'), "Winter's Halo": ('snow', BLUE), 'Tesla Battery': ('battery', BLUE),
 'Storm Caller': ('bolt', BLUE), "Executioner's Hood": ('skull', RED), 'Vampire Fang': ('fang', BONE), 'Kinetic Converter': ('gear', GREEN, 'dash', BONE), 'Heavy Barrel': ('barrel', INK and '#5a6070'),
 'Wind Walker': ('wing', GREEN), 'Mercury Sandals': ('boot', GOLD, 'wing', BONE), 'Deadeye Glass': ('eye', RED), 'Ammo Printer': ('mag', BLUE, 'gear', BONE), 'Gilded Rounds': ('bullet', GOLD, 'coin', GOLD),
 'Barrier Coil': ('shield', BLUE), 'Afterburner': ('dash', ORANGE, 'flame', RED), 'Fire Walker': ('boot', RED, 'flame', ORANGE), 'Overclock': ('clock', RED), 'Marked Cards': ('card', PURPLE),
 "Croupier's Rake": ('hook', GOLD, 'coin', GOLD), 'Grapple Shock': ('hook', BLUE, 'bolt', GOLD), 'Phantom Step': ('dash', PURPLE),
 'Chain Reaction': ('blast', PURPLE), 'Double Down': ('bullet', RED, 'bullet', GOLD), 'Time Dilator': ('clock', BLUE, 'snow', BONE), 'Bloodlust Engine': ('gear', RED, 'drop', RED),
 'Storm Anchor': ('hook', PURPLE, 'bolt', BLUE), 'Air Supremacy': ('wing', GOLD), 'Lucky Seven': ('dice', GREEN), 'Overflow Rounds': ('shells', BLUE), 'Overdrive': ('dash', RED, 'fist', GOLD),
 'Momentum Core': ('gear', PURPLE), 'Wild Card': ('card', GREEN), 'Hex Bullets': ('bullet', PURPLE, 'eye', PURPLE),
 'Phoenix Feather': ('feather', ORANGE, 'flame', RED), 'Bottomless Chamber': ('mag', PURPLE, 'star', GOLD), 'Royal Flush': ('card', RED, 'crown', GOLD), 'Ace of Spades': ('card', INK and '#3a3440', 'skull', BONE),
 'Storm Crown': ('crown', BLUE, 'bolt', GOLD), 'Midas Touch': ('fist', GOLD), "Hermes' Wings": ('wing', BONE, 'star', GOLD), 'Four-Leaf Crown': ('crown', GREEN, 'clover', GREEN),
 'Glass Cannon': ('barrel', BLUE, 'skull', RED), 'Blood Pact': ('drop', RED, 'skull', BONE), "Devil's Dice": ('dice', RED), 'Loan Shark': ('fang', GOLD), "Berserker's Brand": ('flame', RED, 'skull', BONE),
 'Hollow Bones': ('tooth', STEEL, 'wing', BONE), 'Cursed Coin': ('coin', PURPLE, 'skull', BONE), 'Death Wish': ('skull', PURPLE),
}
TONIC = [('heart', RED), ('fist', RED), ('boot', GREEN), ('cross', GOLD), ('clock', BLUE), ('clover', GREEN), ('barrel', STEEL), ('feather', BLUE)]
TILE = {'Common': '#3a343c', 'Uncommon': '#24402c', 'Rare': '#22344e', 'Epic': '#3a2452', 'Legendary': '#4e3a16', 'Cursed': '#4a1a1e'}

def draw(name, spec, tile):
    p = Part(name, (0, 0), 'Prop', 0)
    p.flat(rr(0, 0, 200, 200, 30), '#16101a', smooth=False)
    p.flat(rr(0, 0, 184, 184, 24), tile, smooth=False)
    G[spec[0]](p, spec[1])
    if len(spec) > 2:
        # small second object in the corner on its own dark disc
        q = Part(name + 'b', (0, 0), 'Prop', 0)
        G[spec[2]](q, spec[3])
        p.flat(ellipse(56, -56, 40, 40, n=22), '#16101a')
        p.raw('<g transform="translate(56,56) scale(0.42)">%s</g>' % ''.join(q.items), [(0, 0)])
        p.defs += q.defs
    return p

def build(content_json):
    d = json.load(open(content_json))
    miss = []
    for i, u in enumerate(d['upgrades']):
        spec = MAP.get(u['name'])
        if not spec: miss.append(u['name']); spec = ('star', GOLD)
        fxart.save(draw('U%d' % i, spec, TILE[u['rarity']]), 'Icons', 'U_%d' % i, 96)
    for i, spec in enumerate(TONIC):
        fxart.save(draw('TN%d' % i, spec, '#4a2a1e'), 'Icons', 'TN_%d' % i, 96)
    print('icons', len(d['upgrades']), 'missing', miss)

if __name__ == '__main__':
    build(sys.argv[1])
