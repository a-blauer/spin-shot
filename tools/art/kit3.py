"""Bits for things that were never people: eyes that glow, rows of teeth, jointed legs, plates, tendrils."""
from kit2 import *   # noqa: F401,F403
import math
import random


def pt(cn, role, pivot, layer, sfx=''):
    return part('%s_%s%s' % (cn, role, sfx), role, pivot, layer)


def geye(p, x, y, r, col='#ffd24a', slit=False, sock='#0c0608', ry=1.0):
    """An eye with nothing kind in it: a deep socket and a small hard light far back, or a slit. No glint, no white."""
    p.flat(ellipse(x, y, r, r * ry * 0.82, n=14), sock)
    if slit:
        p.flat(ellipse(x, y, r * 0.62, r * 0.5 * ry, n=12), shade(col, 0.55)); p.flat(ellipse(x, y, r * 0.5, r * 0.4 * ry, n=12), col); p.flat(ellipse(x, y, r * 0.1, r * 0.46 * ry, n=8), '#0c0608')
    else:
        p.flat(ellipse(x, y - r * 0.08, r * 0.36, r * 0.36 * ry, n=10), shade(col, 0.5)); p.flat(ellipse(x, y - r * 0.08, r * 0.2, r * 0.2 * ry, n=8), col)


def teeth(p, x0, x1, y, n, l, col=BONE, down=True, jag=0.25, seed=0, clip=None):
    """A row of pointed teeth between x0 and x1 hanging from (or standing on) y."""
    rnd = random.Random(seed); w = (x1 - x0) / n
    for i in range(n):
        x = x0 + w * (i + 0.5); ll = l * (1 - jag + rnd.random() * jag * 2) * (1 if down else -1)
        tri = [(x - w * 0.46, y), (x + w * 0.46, y), (x + w * rnd.uniform(-0.12, 0.12), y - ll)]
        if clip:
            p.clipped(clip, tri, col, smooth=False)
        else:
            p.flat(tri, col, smooth=False)


def jleg(cn, role, sfx, pts, radii, col, layer, claw=None, cl=14, lit=True):
    """A jointed leg as its own part, hinged where it starts. `claw` (colour) puts a talon on the end."""
    p = pt(cn, role, pts[0], layer, sfx)
    if lit:
        S(p, path_limb(pts, radii, n_end=4), col)
    else:
        p.flat(path_limb(pts, radii, n_end=4), col)
    for (x, y) in pts[1:-1]:
        p.flat(ellipse(x, y, radii[1] * 0.9, radii[1] * 0.9, n=8), shade(col, 0.7))
    if claw:
        (ax, ay), (bx, by) = pts[-2], pts[-1]; a = math.degrees(math.atan2(by - ay, bx - ax))
        spikes(p, [(bx, by, cl, radii[-1] * 0.9, a)], claw)
    return p


def plates(p, clip, cx, y0, y1, n, w, col, bow=10):
    """Bands across a body (a carapace, a grub's rings): `n` arcs between y0 and y1, bowed downward."""
    for i in range(n):
        y = y0 + (y1 - y0) * i / max(1, n - 1)
        p.clipped(clip, [(cx - w, y + bow), (cx, y - 2), (cx + w, y + bow), (cx + w, y + bow + 4), (cx, y + 3), (cx - w, y + bow + 4)], col)


def tendril(p, pts, r0, col, lit=False):
    radii = [r0 * (1 - i / (len(pts) - 0.4)) for i in range(len(pts))]
    if lit:
        S(p, path_limb(pts, radii, n_end=4), col)
    else:
        p.flat(path_limb(pts, radii, n_end=4), col)


def spots(p, clip, pts, col, op=0.8):
    for (x, y, r) in pts:
        p.clipped(clip, ellipse(x, y, r, r * 0.8, n=9), col, opacity=op)


def horn(p, x, y, l, w, ang, col, curve=0.35):
    """A curved horn from (x, y), `l` long, pointing along `ang` degrees and hooking round by `curve`."""
    a = math.radians(ang); pts_o, pts_i = [], []
    for i in range(6):
        t = i / 5; aa = a + curve * t * 2.2; px = x + math.cos(a + curve * t) * l * t; py = y + math.sin(a + curve * t) * l * t
        ww = w * (1 - t) + 0.6; nx, ny = -math.sin(aa) * ww, math.cos(aa) * ww
        pts_o.append((px + nx, py + ny)); pts_i.append((px - nx, py - ny))
    S(p, pts_o + pts_i[::-1], col)
