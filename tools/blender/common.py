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
            a = math.atan2(q.z, q.x); g = GILL_B if math.sin(a * 16) > 0.3 else GILL_A   # broad gills: 40 thin ones shimmered at range
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


def root_leg(s, role_pivot, hip, knee, ank, rad, toes=3, toe_len=16, toe_r=None, spread=1.1, paint=None, tris=1000, ball=None, tip=None, fwd=(0, 0, 1)):
    """A solid root leg: hip ball, knee, ankle, then toes fanning out along the floor and drawn to sharp points.
    s is the side (+1 right/front, -1 left/back). Returns a Part."""
    paint = paint or (lambda m, n: ROOT_D if m.y < 8 else ROOT)
    pts = [tuple(hip), tuple(knee), tuple(ank)]; R = list(rad); edges = [(0, 1), (1, 2)]
    tr = toe_r or R[2] * 0.5; f = Vector(fwd).normalized(); side = Vector((0, 1, 0)).cross(f).normalized()
    specs = []
    for k in range(toes):
        a = (k / max(1, toes - 1) - 0.5) * spread * (2 if toes > 1 else 0) + 0.15 * s
        d = f * math.cos(a) - side * math.sin(a)
        A = Vector(ank)
        specs.append(([tuple(A + d * toe_len * 0.35 + Vector((0, -A.y * 0.55, 0))), tuple(A + d * toe_len * 0.7 + Vector((0, -A.y + 3, 0))), tuple(A + d * toe_len + Vector((0, -A.y + 1.2, 0)))], tr))
    tps = digits(pts, R, edges, 2, specs)
    ob, pp = solid_limb(pts, R, edges, [(Vector(hip), ball or R[0] * 0.95)], tps, paint, tris, voxel=0.8, smooth=3, sharp_r=tr * 1.7, floor=0.5, tip=tip)
    P = Part('LegFront' if s > 0 else 'LegBack', list(role_pivot)); P.add(ob, pp)
    return P, ob


def root_arm(s, role_pivot, sho, elb, wri, rad, fingers=3, f_len=16, f_r=None, curl=(0, -1, 0.4), spread=0.5, thumb=True, paint=None, tris=1100, ball=None, tip=None):
    """A solid root arm: shoulder ball, elbow, wrist, then long fingers curling along curl, drawn to sharp points. Returns (Part, object)."""
    paint = paint or (lambda m, n: ROOT)
    pts = [tuple(sho), tuple(elb), tuple(wri)]; R = list(rad); edges = [(0, 1), (1, 2)]
    fr = f_r or R[2] * 0.45; W = Vector(wri); fa = (W - Vector(elb)).normalized(); cu = Vector(curl).normalized()
    side = fa.cross(cu).normalized()
    specs = []
    for k in range(fingers):
        o = (k / max(1, fingers - 1) - 0.5) * 2 * spread if fingers > 1 else 0
        b = W + fa * R[2] * 0.6 + side * o * R[2] * 0.9
        d1 = (fa + side * o * 0.35).normalized(); d2 = (fa * 0.5 + cu * 0.8 + side * o * 0.25).normalized()
        specs.append(([tuple(b), tuple(b + d1 * f_len * 0.5), tuple(b + d1 * f_len * 0.5 + d2 * f_len * 0.55)], fr))
    if thumb:
        b = W + cu * -0.2 - side * R[2] * 0.9 * (1 if fingers > 1 else 0.6)
        specs.append(([tuple(b - side * 3), tuple(b - side * 5 + (fa + cu).normalized() * f_len * 0.55)], fr * 0.95))
    digits(pts, R, edges, 2, specs)
    tps = [(Vector(c[-2]), Vector(c[-1]) + (Vector(c[-1]) - Vector(c[-2])).normalized() * fr * 0.6) for c, _ in specs]   # only the last joint tapers
    ob, pp = solid_limb(pts, R, edges, [(Vector(sho), ball or R[0] * 1.1), (W, R[2] * 1.15)], tps, paint, tris, voxel=min(0.9, max(0.5, fr * 0.14)), smooth=3, sharp_r=fr * 1.15, tip=tip)
    P = Part('ArmFront' if s > 0 else 'ArmBack', list(role_pivot)); P.add(ob, pp)
    return P, ob


def seat_eyes(eyes, pj, sink=0.35):
    """Move each eye onto the surface along its out direction, sunk by sink * its radius (so it sits in the face)."""
    for e in eyes:
        o = Vector(e['out']).normalized(); at = Vector(e['at'])
        h = pj.ray_cast(at + o * 40, -o, 80)
        if h[0] is not None: e['at'] = list(h[0] - o * e['r'] * sink)
    return eyes


def fan(root, pts, t=1.2, name='fan', scallop=0.0):
    """A thin membrane stretched from root over the points pts (a fan of triangles), t thick. scallop sags the edge
    between neighbouring points toward root by that fraction."""
    from bkit import _obj
    import bmesh as _bm
    bm = _bm.new(); R = Vector(root); P = [Vector(p) for p in pts]
    edge = []
    for i, p in enumerate(P):
        edge.append(p)
        if scallop and i + 1 < len(P): edge.append((p + P[i + 1]) / 2 * (1 - scallop) + R * scallop)
    n = (edge[0] - R).cross(edge[-1] - R)
    if n.length < 1e-6: n = Vector((1, 0, 0))
    n.normalize()
    for side in (1, -1):
        off = n * t * 0.5 * side
        r = bm.verts.new(R + off); vs = [bm.verts.new(e + off) for e in edge]
        for i in range(len(vs) - 1):
            f = bm.faces.new((r, vs[i], vs[i + 1]) if side > 0 else (r, vs[i + 1], vs[i]))
    bm.normal_update()
    return _obj(name, bm)


def carve(ob, cutter):
    """Cut cutter out of ob (a boolean difference); the cutter is removed."""
    import bpy
    from bkit import _apply
    m = ob.modifiers.new('carve', 'BOOLEAN'); m.operation = 'DIFFERENCE'; m.object = cutter; m.solver = 'EXACT'
    _apply(ob); bpy.data.objects.remove(cutter, do_unlink=True)
    return ob


def grooves(P, pj, axis_c, y0, y1, n, colour, width=3.0, skip=None, seed=0):
    """Vertical grooves of bark drawn down a trunk-like surface round the vertical axis through axis_c (x, z)."""
    import random as _r
    rr = _r.Random(seed)
    for k in range(n):
        a = k * 2 * math.pi / n + rr.uniform(-0.15, 0.15); pts = []
        for j in range(6):
            y = y1 - (y1 - y0) * j / 5; aa = a + math.sin(j * 1.7 + k) * 0.05
            o = Vector((math.cos(aa), 0, math.sin(aa)))
            h = pj.ray_cast(Vector((axis_c[0], y, axis_c[1])) + o * 300, -o, 400)
            if h[0] is not None and (skip is None or not skip(h[0])): pts.append(tuple(h[0]))
            elif len(pts) >= 2: break
        if len(pts) >= 3: P.add(ribbon(pj, pts, width * rr.uniform(0.7, 1.2), lambda p, c=axis_c: (p.x - c[0], 0, p.z - c[1]), lift=0.6, taper=False), lambda m, n: colour)
