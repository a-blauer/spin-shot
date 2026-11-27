# Pieces shared by the Blender-made Blight (see rotcap.py for the first, worked example).
# Look: chunky stylised forms, flat facets, flat paint; limbs are single solid pieces (fuse) with joint balls that sit
# in sockets on the body; fingers and toes taper to sharp dark points (sharpen); the Blight rots them: sores with a
# lit wet core, olive rot patches, pale mould tufts, glowing cracks, bitten sagging caps with ooze.
import math
from bkit import *                     # (imports bpy first, which provides mathutils)
from mathutils import Vector, Matrix

ROOT, ROOT_D, ROOT_L = C(0x6e4a30), C(0x4c3222), C(0x8a6444)
GILL_A, GILL_B = C(0x4a3222), C(0x6e5038)
MOUTH, TOOTH, BLACK = C(0x1a0e0c), C(0xe8dcc0), C(0x1c120c)
ROT, ROT2, MOLD, OOZE = C(0x2e2c18), C(0x55542e), C(0xc4cab0), GLOW(0.75)
SPOT = FLESH(1.0)
FACE = [0.06, 0.055, 0.05, 0, 0.62, 0]


def sore(add, pj, c, d, r, seed):
    """A rotting sore: a ragged dark patch, a sicker rim, a lit wet core."""
    add(decal(pj, c, d, r * 1.45, seg=22, rings=2, lift=1.0, wobble=0.35, seed=seed), lambda m, n: ROT2)
    add(decal(pj, c, d, r, seg=22, rings=2, lift=1.3, wobble=0.3, seed=seed + 1), lambda m, n: ROT)
    add(decal(pj, c, d, r * 0.42, seg=14, rings=1, lift=1.6, wobble=0.2, seed=seed + 2), lambda m, n: OOZE)


def rot_patch(add, pj, c, d, r, seed, mold=True):
    add(decal(pj, c, d, r * 1.35, seg=26, rings=3, lift=0.8, wobble=0.45, seed=seed), lambda m, n: ROT2)
    add(decal(pj, c, d, r, seg=26, rings=3, lift=1.2, wobble=0.45, seed=seed + 1), lambda m, n: ROT)
    if mold:
        hit = pj.ray_cast(Vector(c) + Vector(d).normalized() * 30, -Vector(d).normalized(), 80)
        if hit[0] is not None:
            for o in tuft(hit[0], hit[1], r * 0.45, n=6, seed=seed + 2): add(o, lambda m, n: MOLD, 50)


def mushroom(base, up, h, r):
    """A little mushroom growing out of a surface at base, leaning along up: (stalk, cap)."""
    u = Vector(up).normalized(); top = Vector(base) + u * h
    st = skin([tuple(base), tuple(top)], [r * 0.5, r * 0.36], sub=1, name='stalk')
    cap = lathe([(0, r * 0.82), (r * 0.42, r * 0.76), (r * 0.78, r * 0.52), (r, r * 0.2), (r * 0.96, 0), (r * 0.3, r * 0.1), (0, r * 0.12)], seg=20, name='mcap')   # a domed cap
    q = Vector((0, 1, 0)).rotation_difference(u)
    cap.matrix_world = Matrix.Translation(top) @ q.to_matrix().to_4x4(); bake_world(cap)
    return st, cap


def grow_mushrooms(P, pj, spots, cap_paint=None, glow_spots=False):
    """Little mushrooms on a surface: spots = [(near, up, height, radius)]."""
    for base, up, h, r in spots:
        u = Vector(up).normalized(); hit = pj.ray_cast(Vector(base) + u * 30, -u, 80)
        if hit[0] is not None: base = hit[0] - u * 1.5
        st, cp = mushroom(base, up, h, r)
        P.add(st, lambda m, n: FLESH(0.9), 80)
        cpaint = cap_paint or (lambda m, n, u=u: CAP(1) if n.dot(u) > -0.2 else GILL_A)
        P.add(cp, cpaint, 160)
        if glow_spots:
            pc = projector(cp); top = Vector(base) + u * (h + r * 0.62)
            for k in range(3):
                a = k * 2.1 + r
                sp = top + (u.orthogonal().normalized() * math.cos(a) + u.cross(u.orthogonal().normalized()) * math.sin(a)) * r * 0.5
                P.add(decal(pc, sp, (sp - (Vector(base) + u * h)).normalized(), r * 0.22, seg=10, rings=1, lift=0.3), lambda m, n: GLOW(1))


def digits(pts, rad, edges, root_i, specs, X=lambda x: x):
    """Add fingers or toes to a skin skeleton. specs: [[p0, p1, ...]] chains of points (each finger from root_i),
    radii taper from the first radius given per finger. Returns the tip segments [(start, end)] to sharpen."""
    tips = []
    for chain, r0 in specs:
        i = len(pts); n = len(chain)
        pts += [tuple(p) for p in chain]
        rad += [r0 * (1 - 0.55 * k / max(1, n - 1)) for k in range(n)]
        edges += [(root_i, i)] + [(i + k, i + k + 1) for k in range(n - 1)]
        tips.append((Vector(chain[-3] if n >= 3 else chain[0]), Vector(chain[-1])))
    return tips


def solid_limb(pts, rad, edges, balls, tips, paint, tris, voxel=0.7, smooth=3, sharp_r=6.0, floor=None, tip=None):
    """One solid limb: the skeleton, the joint balls [(centre, radius)], fused; each tip drawn to a sharp point."""
    sk = skin(pts, rad, edges, sub=2, name='limb')
    pieces = [(sk, paint)] + [(blob(tuple(c), (r, r, r), name='ball'), paint) for c, r in balls]
    ob, pf = fuse(pieces, voxel=voxel, smooth=smooth, factor=0.5, tris=0, name='limb')
    for a, b in tips: sharpen(ob, a, b, sharp_r)
    if floor is not None: deform(ob, lambda v: Vector((v.x, max(v.y, floor), v.z)))
    decimate(ob, tris)
    def paint2(m, n):
        for a, b in tips:
            if (m - b).length < 6: return tip or mix(ROOT_D, BLACK, 0.6)
        return pf(m, n)
    return ob, paint2


def rotten_cap(profile, M, bites, seg=96, rim_from=60, rim_to=96):
    """A cap spun from profile, its brim bitten and sagging (bites = [(angle, width, depth)]), placed by matrix M.
    Returns (object, paint, local->world function for brim points)."""
    cap = lathe(profile, seg=seg, name='cap')
    span = rim_to - rim_from
    def _rot(v):
        r = math.hypot(v.x, v.z)
        if r < rim_from: return v
        a = math.atan2(v.z, v.x); bite = 0
        for a0, w, dep in bites:
            da = (a - a0 + math.pi) % (2 * math.pi) - math.pi; bite = max(bite, dep * math.exp(-(da / w) ** 2))
        k = (r - rim_from) / span; nr = r - bite * k
        return Vector((v.x * nr / r, v.y - bite * 0.35 * k - 2.5 * k * (1 + math.sin(a * 3 + 1)), v.z * nr / r))
    deform(cap, _rot)
    cap.matrix_world = M; bake_world(cap)
    MI = M.inverted()
    def paint(m, n):
        q = MI @ m; r = math.hypot(q.x, q.z)
        if (M.to_3x3().inverted() @ n).y < -0.25:
            a = math.atan2(q.z, q.x); g = GILL_B if math.sin(a * 40) > 0.25 else GILL_A
            return mix(g, ROT, 0.5) if r > rim_to * 0.78 else g
        t = max(0.0, min(1.0, (r - rim_to * 0.66) / (rim_to * 0.32)))
        return mix(CAP(1), ROT, 0.55 * t)
    return cap, paint, (lambda lv: M @ _rot(Vector(lv)))


def cap_spots(P, cap, M, spots, rim=90, glow=False):
    """Round spots laid on a cap from above: spots = [(angle, how far out 0..1, radius)]."""
    pc = projector(cap); up = (M.to_3x3() @ Vector((0, 1, 0))).normalized()
    for a, t, r in spots:
        wc = M @ Vector((math.cos(a) * t * rim, rim, math.sin(a) * t * rim))
        hit = pc.ray_cast(wc, -up, rim * 3)
        if hit[0] is None: continue
        P.add(decal(pc, hit[0], hit[1], r, seg=18, rings=2, lift=0.45, wobble=0.15, seed=a), (lambda m, n: GLOW(1)) if glow else (lambda m, n: SPOT))
    return pc


def cap_rot(P, pc, M, patches, rim=90):
    up = (M.to_3x3() @ Vector((0, 1, 0))).normalized()
    for i, (a, t, r) in enumerate(patches):
        wc = M @ Vector((math.cos(a) * t * rim, rim, math.sin(a) * t * rim))
        hit = pc.ray_cast(wc, -up, rim * 3)
        if hit[0] is None: continue
        rot_patch(P.add, pc, hit[0], hit[1], r, 40 + i)


def drips(P, brim, angles, rim, M):
    for i, a in enumerate(angles):
        top = brim((math.cos(a) * rim, 1, math.sin(a) * rim)); L = 6 + (i % 3) * 4
        P.add(skin([tuple(top + Vector((0, 1, 0))), tuple(top - Vector((0, L * 0.6, 0))), tuple(top - Vector((0, L, 0)))], [2.4, 1.6, 0.8], sub=1, name='drip'), lambda m, n: OOZE, 60)


def spikes(P, pj, base_pts, out, length, r, paint):
    """Sharp spines standing out of a surface along out(p)."""
    for p in base_pts:
        o = Vector(out(Vector(p))).normalized(); hit = pj.ray_cast(Vector(p) + o * 30, -o, 80)
        b = (hit[0] - o * 1.0) if hit[0] is not None else Vector(p)
        P.add(skin([tuple(b), tuple(b + o * length * 0.55), tuple(b + o * length)], [r, r * 0.55, 0.12], sub=1, name='spike'), paint, 70)


def out_path(name):
    import os
    d = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'); os.makedirs(d, exist_ok=True)
    return os.path.join(d, name + '.json')
