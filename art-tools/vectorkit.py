"""
Tiny vector-art kit used to draw Dead Man's Hand's 2D sprites in a flat,
Sulfur-like style: chunky organic silhouettes, crescent shading (a darker
copy of each shape with the lit copy offset toward the light), no outlines.

Coordinates are y-UP "creature space" in design units (1 unit = 0.5 cm).
"""
import math
import random

LIGHT = (-0.16, 0.16)   # lit copy offset, as a fraction of the shape's size (up-left light)


def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgbhex(c):
    return '#%02x%02x%02x' % tuple(max(0, min(255, int(round(v)))) for v in c)


def shade(h, k=0.72, hue_to=(40, 50, 90), mix=0.18):
    """Darker, slightly cool-shifted version of a colour (vector shadow tone)."""
    r, g, b = hexrgb(h)
    r, g, b = r * k, g * k, b * k
    r = r * (1 - mix) + hue_to[0] * mix
    g = g * (1 - mix) + hue_to[1] * mix
    b = b * (1 - mix) + hue_to[2] * mix
    return rgbhex((r, g, b))


def light(h, k=1.12, warm=(255, 240, 210), mix=0.10):
    r, g, b = hexrgb(h)
    r, g, b = min(255, r * k), min(255, g * k), min(255, b * k)
    return rgbhex((r * (1 - mix) + warm[0] * mix, g * (1 - mix) + warm[1] * mix, b * (1 - mix) + warm[2] * mix))


def mixc(a, b, t):
    ca, cb = hexrgb(a), hexrgb(b)
    return rgbhex(tuple(ca[i] + (cb[i] - ca[i]) * t for i in range(3)))


# ------------------------------------------------------------------ point generators

def ellipse(cx, cy, rx, ry, n=18, rot=0.0, jitter=0.0, seed=0, start=0.0):
    rnd = random.Random(seed)
    pts = []
    for i in range(n):
        a = start + 2 * math.pi * i / n
        j = 1.0 + (rnd.uniform(-jitter, jitter) if jitter else 0.0)
        x, y = math.cos(a) * rx * j, math.sin(a) * ry * j
        c, s = math.cos(rot), math.sin(rot)
        pts.append((cx + x * c - y * s, cy + x * s + y * c))
    return pts


def blobby(cx, cy, rx, ry, top=1.0, bottom=1.0, left=1.0, right=1.0, n=20, jitter=0.0, seed=0):
    """Ellipse with per-side scaling (e.g. heads wider at the jaw)."""
    rnd = random.Random(seed)
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        x, y = math.cos(a), math.sin(a)
        sx = right if x > 0 else left
        sy = top if y > 0 else bottom
        j = 1.0 + (rnd.uniform(-jitter, jitter) if jitter else 0.0)
        pts.append((cx + x * rx * sx * j, cy + y * ry * sy * j))
    return pts


def limb(p0, p1, r0, r1, n_end=6):
    """Tapered capsule from p0 (radius r0) to p1 (radius r1)."""
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    L = math.hypot(dx, dy) or 1.0
    ux, uy = dx / L, dy / L
    nx, ny = -uy, ux
    pts = []
    base = math.atan2(uy, ux)
    for i in range(n_end + 1):
        a = base + math.pi / 2 + math.pi * i / n_end
        pts.append((p0[0] + math.cos(a) * r0, p0[1] + math.sin(a) * r0))
    for i in range(n_end + 1):
        a = base - math.pi / 2 + math.pi * i / n_end
        pts.append((p1[0] + math.cos(a) * r1, p1[1] + math.sin(a) * r1))
    return pts


def poly_bounds(pts):
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


# ------------------------------------------------------------------ path building

def smooth_path(pts, closed=True, tension=0.5):
    """Catmull-Rom spline through pts as an SVG path (y flipped for SVG)."""
    P = [(x, -y) for (x, y) in pts]
    n = len(P)
    if n < 3:
        return ''
    d = 'M %.2f %.2f ' % P[0]
    rng = range(n) if closed else range(n - 1)
    for i in rng:
        p0 = P[(i - 1) % n] if closed or i > 0 else P[i]
        p1 = P[i]
        p2 = P[(i + 1) % n]
        p3 = P[(i + 2) % n] if closed or i + 2 < n else P[(i + 1) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) * tension / 3, p1[1] + (p2[1] - p0[1]) * tension / 3)
        c2 = (p2[0] - (p3[0] - p1[0]) * tension / 3, p2[1] - (p3[1] - p1[1]) * tension / 3)
        d += 'C %.2f %.2f %.2f %.2f %.2f %.2f ' % (c1[0], c1[1], c2[0], c2[1], p2[0], p2[1])
    if closed:
        d += 'Z'
    return d


def sharp_path(pts, closed=True):
    P = [(x, -y) for (x, y) in pts]
    d = 'M ' + ' L '.join('%.2f %.2f' % p for p in P)
    return d + (' Z' if closed else '')


# ------------------------------------------------------------------ parts

class Part:
    """One sprite (a puppet part). Collects SVG elements in creature space."""
    _clip_id = 0

    def __init__(self, name, pivot, role, layer, parent=None):
        self.name = name
        self.pivot = pivot          # creature-space point the part rotates around
        self.role = role
        self.layer = layer
        self.parent = parent
        self.defs = []
        self.items = []
        self.pts_all = []

    def _clip(self, d):
        Part._clip_id += 1
        cid = 'c%d' % Part._clip_id
        self.defs.append('<clipPath id="%s"><path d="%s"/></clipPath>' % (cid, d))
        return cid

    def shape(self, pts, color, shadow=None, lit=True, smooth=True, offset=LIGHT, hl=None, opacity=1.0, rim=None, rim_w=0.022):
        """Filled shape with crescent shading: shadow-coloured base, lit copy shifted toward the light."""
        self.pts_all += pts
        d = smooth_path(pts) if smooth else sharp_path(pts)
        if shadow is None:
            shadow = shade(color)
        op = '' if opacity >= 1.0 else ' fill-opacity="%.2f"' % opacity
        if not lit:
            self.items.append('<path d="%s" fill="%s"%s/>' % (d, color, op))
            return d
        x0, y0, x1, y1 = poly_bounds(pts)
        w, h = x1 - x0, y1 - y0
        dx, dy = offset[0] * w, offset[1] * h
        moved = [(x + dx, y + dy) for (x, y) in pts]
        dm = smooth_path(moved) if smooth else sharp_path(moved)
        cid = self._clip(d)
        self.items.append('<path d="%s" fill="%s"%s/>' % (d, shadow, op))
        self.items.append('<path d="%s" fill="%s" clip-path="url(#%s)"%s/>' % (dm, color, cid, op))
        if rim:
            # crisp rim light hugging the up-left silhouette: light copy of the lit area, then the
            # base colour re-laid over it shifted down-right by the rim width (all inside the silhouette)
            rc = rim if isinstance(rim, str) else light(color, 1.16, mix=0.22)
            rw = max(1.6, min(5.0, rim_w * max(w, h)))
            self.items.append('<path d="%s" fill="%s" clip-path="url(#%s)"%s/>' % (dm, rc, cid, op))
            ds = [(x + rw * 0.75, y - rw) for (x, y) in pts]
            dsp = smooth_path(ds) if smooth else sharp_path(ds)
            cid_m = self._clip(dm)
            self.items.append('<g clip-path="url(#%s)"><path d="%s" fill="%s" clip-path="url(#%s)"%s/></g>' % (cid, dsp, color, cid_m, op))
        if hl:
            # small highlight sliver near the lit edge
            hx, hy = x0 + w * 0.3, y0 + h * 0.72
            hp = ellipse(hx, hy, w * 0.13, h * 0.07, n=10, rot=0.5)
            self.items.append('<path d="%s" fill="%s" clip-path="url(#%s)" fill-opacity="0.55"/>' % (smooth_path(hp), hl, cid))
        return d

    def flat(self, pts, color, smooth=True, opacity=1.0, clip_to=None):
        self.pts_all += pts
        d = smooth_path(pts) if smooth else sharp_path(pts)
        extra = ''
        if clip_to:
            extra = ' clip-path="url(#%s)"' % self._clip(clip_to)
        op = '' if opacity >= 1.0 else ' fill-opacity="%.2f"' % opacity
        self.items.append('<path d="%s" fill="%s"%s%s/>' % (d, color, op, extra))
        return d

    def clipped(self, clip_d, pts, color, smooth=True, opacity=1.0):
        """Shape drawn only inside another shape (clothes, spots, patches)."""
        d = smooth_path(pts) if smooth else sharp_path(pts)
        cid = self._clip(clip_d)
        op = '' if opacity >= 1.0 else ' fill-opacity="%.2f"' % opacity
        self.items.append('<path d="%s" fill="%s" clip-path="url(#%s)"%s/>' % (d, color, cid, op))

    def circle(self, cx, cy, r, color, opacity=1.0):
        self.pts_all += [(cx - r, cy - r), (cx + r, cy + r)]
        op = '' if opacity >= 1.0 else ' fill-opacity="%.2f"' % opacity
        self.items.append('<circle cx="%.2f" cy="%.2f" r="%.2f" fill="%s"%s/>' % (cx, -cy, r, color, op))

    def stroke(self, pts, color, width, smooth=True, closed=False, opacity=1.0, cap='round'):
        self.pts_all += [(x - width, y - width) for x, y in pts] + [(x + width, y + width) for x, y in pts]
        d = smooth_path(pts, closed=closed) if smooth else sharp_path(pts, closed=closed)
        op = '' if opacity >= 1.0 else ' stroke-opacity="%.2f"' % opacity
        self.items.append('<path d="%s" fill="none" stroke="%s" stroke-width="%.2f" stroke-linecap="%s" stroke-linejoin="round"%s/>'
                          % (d, color, width, cap, op))

    def raw(self, svg, bounds_pts):
        self.pts_all += bounds_pts
        self.items.append(svg)

    # -------- common features
    def eye(self, cx, cy, r, socket='#1d1418', glow='#ff5a3c', pupil=0.38, squint=0.0):
        sock = ellipse(cx, cy, r, r * (1.0 - squint), n=14)
        self.flat(sock, socket)
        self.circle(cx + r * 0.12, cy + r * 0.08, r * pupil, glow)
        self.circle(cx + r * 0.22, cy + r * 0.22, r * pupil * 0.35, '#fff3d6', opacity=0.9)

    def mouth(self, cx, cy, w, h, teeth=5, gum='#3a1418', tooth='#efe6cc', fang=False, seed=0):
        rnd = random.Random(seed)
        m = blobby(cx, cy, w / 2, h / 2, top=0.55, bottom=1.0, n=18)
        d = self.flat(m, gum)
        # upper teeth
        tw = w / (teeth + 0.5)
        for i in range(teeth):
            tx = cx - w / 2 + tw * (i + 0.75)
            th = h * (0.32 + rnd.uniform(0, 0.18)) * (1.6 if fang and i in (0, teeth - 1) else 1.0)
            tri = [(tx - tw * 0.38, cy + h * 0.28), (tx + tw * 0.38, cy + h * 0.28), (tx + tw * 0.05, cy + h * 0.28 - th)]
            self.clipped(d, tri, tooth, smooth=False)
        # lower teeth
        for i in range(teeth - 1):
            tx = cx - w / 2 + tw * (i + 1.2)
            th = h * (0.22 + rnd.uniform(0, 0.12))
            tri = [(tx - tw * 0.3, cy - h * 0.5), (tx + tw * 0.3, cy - h * 0.5), (tx, cy - h * 0.5 + th)]
            self.clipped(d, tri, tooth, smooth=False)


def render_part(part, scale=1.0, pad=6, max_px=512):
    """Returns (svg_text, png_w, png_h, center_offset_from_pivot (units), size (units))."""
    xf = getattr(part, 'xf', None)          # (sx, sy, ox, oy, dx, dy): scale about (ox, oy), then move
    pts = part.pts_all
    if xf:
        sx, sy, ox, oy, dx, dy = xf
        pts = [(ox + (x - ox) * sx + dx, oy + (y - oy) * sy + dy) for x, y in pts]
    x0, y0, x1, y1 = poly_bounds(pts)
    x0 -= pad
    y0 -= pad
    x1 += pad
    y1 += pad
    w, h = x1 - x0, y1 - y0
    s = scale
    if max(w, h) * s > max_px:
        s = max_px / max(w, h)
    pw, ph = max(4, int(math.ceil(w * s))), max(4, int(math.ceil(h * s)))
    # SVG coords: y flipped, so viewBox y from -y1 to -y0
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="%.2f %.2f %.2f %.2f">'
           '<defs>%s</defs>%s</svg>') % (pw, ph, x0, -y1, w, h, ''.join(part.defs),
                                          ('<g transform="translate(%.3f %.3f) scale(%.4f %.4f) translate(%.3f %.3f)">%s</g>' % (xf[2] + xf[4], -(xf[3] + xf[5]), xf[0], xf[1], -xf[2], xf[3], ''.join(part.items))) if xf else ''.join(part.items))
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    return svg, pw, ph, (cx - part.pivot[0], cy - part.pivot[1]), (w, h)


def bleed(img, passes=6):
    """Spread colour into fully transparent pixels so mipmaps/filtering don't pull in black fringes."""
    import numpy as np
    from scipy import ndimage
    a = np.asarray(img).astype(np.float32)
    rgb, al = a[..., :3], a[..., 3] / 255.0
    pre = rgb * al[..., None]
    for _ in range(passes):
        s = 9
        num = np.stack([ndimage.uniform_filter(pre[..., i], s) for i in range(3)], -1)
        den = ndimage.uniform_filter(al, s)
        fill = num / np.maximum(den, 1e-4)[..., None]
        mask = al < 0.02
        rgb = np.where(mask[..., None] & (den[..., None] > 1e-4), fill, rgb)
        pre = rgb * np.maximum(al, (den > 1e-4) * 1.0)[..., None]
        al2 = np.maximum(al, (den > 1e-4) * 1.0)
        pre = rgb * al2[..., None]
        al = al2
    out = np.concatenate([np.clip(rgb, 0, 255), a[..., 3:4]], -1).astype(np.uint8)
    from PIL import Image
    return Image.fromarray(out, 'RGBA')


def path_limb(points, radii, n_end=8):
    """Smooth tapered tube through several points (elbows/knees/tails), as one closed outline."""
    import math as _m
    L = len(points)
    left, right = [], []
    for i, (p, r) in enumerate(zip(points, radii)):
        if i == 0:
            dx, dy = points[1][0] - p[0], points[1][1] - p[1]
        elif i == L - 1:
            dx, dy = p[0] - points[i - 1][0], p[1] - points[i - 1][1]
        else:
            dx, dy = points[i + 1][0] - points[i - 1][0], points[i + 1][1] - points[i - 1][1]
        d = _m.hypot(dx, dy) or 1.0
        nx, ny = -dy / d, dx / d
        left.append((p[0] + nx * r, p[1] + ny * r))
        right.append((p[0] - nx * r, p[1] - ny * r))
    def cap(c, r, d_ang):
        # from d_ang+90deg sweeping through d_ang down to d_ang-90deg
        return [(c[0] + _m.cos(d_ang + _m.pi / 2 - _m.pi * k / n_end) * r, c[1] + _m.sin(d_ang + _m.pi / 2 - _m.pi * k / n_end) * r) for k in range(1, n_end)]
    p1, p0 = points[-1], points[-2]
    d_end = _m.atan2(p1[1] - p0[1], p1[0] - p0[0])
    q1, q0 = points[0], points[1]
    d_start = _m.atan2(q1[1] - q0[1], q1[0] - q0[0])
    return left + cap(p1, radii[-1], d_end) + right[::-1] + cap(q1, radii[0], d_start)


def rect(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


def quad(a, b, c, d):
    return [a, b, c, d]
