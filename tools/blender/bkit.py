# Blender modelling kit for the Blight (run with plain python3: Blender is installed as the bpy module).
# Everything is built directly in game space: x right, y up, z toward the front, centimetres. Blender's modifiers do not
# care which way is up, so no axis swap is needed until something is rendered in Blender itself.
#
# The look (tools/blight/refs): stylised low-poly, chunky shapes, flat-shaded facets, flat painted colour per facet.
# So every piece is built smooth (skin, lathe, superellipsoid), then decimated to a modest count and shaded flat, and
# painted face by face by its own paint function.
#
# A paint is the kit's 6-vector: fixed colour r,g,b (0..1) and the cap, flesh, glow weights (the strain's colours are
# added in the game, per instance). Helpers C(), CAP(), FLESH(), GLOW(), mix() match tools/blight/kit.mjs.
import bpy, bmesh, math, json, random
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree


def C(h, k=1.0):
    return [((h >> 16) & 255) / 255 * k, ((h >> 8) & 255) / 255 * k, (h & 255) / 255 * k, 0, 0, 0]
def CAP(k=1.0): return [0, 0, 0, k, 0, 0]
def FLESH(k=1.0): return [0, 0, 0, 0, k, 0]
def GLOW(k=1.0): return [0, 0, 0, 0, 0, k]
def mix(a, b, t): return [x + (y - x) * t for x, y in zip(a, b)]


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def _obj(name, bm):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    return ob


def _apply(ob):
    """Bake every modifier of ob into its mesh."""
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    ob.modifiers.clear(); old = ob.data; ob.data = me; bpy.data.meshes.remove(old)
    return ob


def skin(points, radii, edges=None, sub=2, name='skin'):
    """A smooth tube through points (a chain, or any tree given by edges), radius per point (a number or (rx, rz))."""
    me = bpy.data.meshes.new(name)
    edges = edges if edges is not None else [(i, i + 1) for i in range(len(points) - 1)]
    me.from_pydata([tuple(p) for p in points], edges, [])
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    m = ob.modifiers.new('skin', 'SKIN'); m.use_smooth_shade = True; m.branch_smoothing = 0.6
    sv = me.skin_vertices[0].data
    for i, r in enumerate(radii):
        sv[i].radius = (r, r) if isinstance(r, (int, float)) else tuple(r)
    sv[0].use_root = True
    if sub: s = ob.modifiers.new('sub', 'SUBSURF'); s.levels = sub; s.render_levels = sub
    return _apply(ob)


def blob(c, r, e=1.0, rot=(0, 0, 0), seg=24, name='blob'):
    """An ellipsoid with radii r = (rx, ry, rz), squared off toward a rounded box as e falls below 1."""
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=1.0)
    for v in bm.verts:
        x, y, z = v.co
        f = lambda a: math.copysign(abs(a) ** e, a)
        v.co = Vector((f(x) * r[0], f(y) * r[1], f(z) * r[2]))
    ob = _obj(name, bm)
    ob.matrix_world = Matrix.Translation(Vector(c)) @ Matrix.Rotation(rot[1], 4, 'Y') @ Matrix.Rotation(rot[0], 4, 'X') @ Matrix.Rotation(rot[2], 4, 'Z')
    return ob


def lathe(profile, c=(0, 0, 0), seg=40, name='lathe', close=True):
    """Spin a profile [(radius, y), ...] (top to bottom) round the y axis."""
    bm = bmesh.new()
    vs = [bm.verts.new((r, y, 0)) for r, y in profile]
    es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 1, 0), angle=2 * math.pi, steps=seg, use_merge=True)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.01)
    ob = _obj(name, bm); ob.matrix_world = Matrix.Translation(Vector(c))
    return ob


def transform(ob, T):
    ob.matrix_world = T @ ob.matrix_world
    return ob


def bake_world(ob):
    """Move ob's transform into its vertices."""
    ob.data.transform(ob.matrix_world); ob.matrix_world = Matrix.Identity(4)
    return ob


def deform(ob, fn):
    """Move every vertex: fn(Vector) -> Vector, in world space."""
    bake_world(ob)
    for v in ob.data.vertices: v.co = fn(v.co.copy())
    ob.data.update()
    return ob


def decimate(ob, tris):
    """Cut ob down to about tris triangles (Blender's quadric collapse, which keeps the silhouette)."""
    bake_world(ob)
    n = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    if n > tris:
        m = ob.modifiers.new('dec', 'DECIMATE'); m.decimate_type = 'COLLAPSE'; m.ratio = tris / n; m.use_collapse_triangulate = True
        _apply(ob)
    return ob


def tri_faces(ob):
    """World-space triangles of ob: [(a, b, c), ...]."""
    bake_world(ob)
    bm = bmesh.new(); bm.from_mesh(ob.data); bmesh.ops.triangulate(bm, faces=bm.faces[:])
    out = [tuple(v.co.copy() for v in f.verts) for f in bm.faces]; bm.free()
    return out


class Part:
    """One rig part: a role and pivot, and pieces, each (object, paint function, tris budget). The paint function
    gets the facet's centre and normal (game space) and returns a paint."""
    def __init__(self, role, pivot, eyes=None, teeth=None):
        self.role, self.pivot, self.eyes, self.teeth, self.pieces = role, pivot, eyes, teeth, []
    def add(self, ob, paint, tris=None):
        if tris: decimate(ob, tris)
        self.pieces.append((ob, paint)); return ob


def export(name, parts, path, height, beast=False, scale=1.0, lean=1.0, ao_reach=24.0):
    """Flat-shade, paint and occlude every facet, and write the creature for tools/sculpt_blight.mjs."""
    allt = []
    for P in parts:
        for ob, paint in P.pieces: allt += tri_faces(ob)
    verts = [v for t in allt for v in t]
    bvh = BVHTree.FromPolygons(verts, [(i * 3, i * 3 + 1, i * 3 + 2) for i in range(len(allt))])
    rng = random.Random(7)
    dirs = []
    while len(dirs) < 10:
        d = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1)))
        if 0.1 < d.length <= 1: dirs.append(d.normalized())
    out = []
    for P in parts:
        pos, nor, rgb, w, ao = [], [], [], [], []
        for ob, paint in P.pieces:
            for a, b, c in tri_faces(ob):
                n = (b - a).cross(c - a)
                if n.length < 1e-9: continue
                n.normalize(); m = (a + b + c) / 3
                p = paint(m, n)
                hit = 0
                for d in dirs:
                    if d.dot(n) < 0: d = -d
                    if bvh.ray_cast(m + n * 0.3, d, ao_reach)[0] is not None: hit += 1
                occ = max(0.35, 1 - hit / len(dirs) * 0.8)
                for v in (a, b, c):
                    pos += [round(v.x, 2), round(v.y, 2), round(v.z, 2)]
                    nor += [round(n.x * 127), round(n.y * 127), round(n.z * 127)]
                    rgb += [max(0, min(255, round(p[i] * 255))) for i in range(3)]
                    w += [max(0, min(255, round(p[3 + i] * 255))) for i in range(3)]
                    ao.append(round(occ * 255))
        out.append({'role': P.role, 'pivot': P.pivot, 'eyes': P.eyes, 'teeth': P.teeth, 'flat': True,
                    'mesh': {'pos': pos, 'nor': nor, 'rgb': rgb, 'w': w, 'ao': ao, 'idx': list(range(len(pos) // 3))}})
        print(f'  {name}.{P.role}: {len(pos) // 9} tris')
    json.dump({'height': height, 'beast': beast, 'scale': scale, 'lean': lean, 'parts': out}, open(path, 'w'))
    print('wrote', path)


# ---- decals: flat painted shapes (spots, pores, a mouth, veins) made as thin geometry lying on a surface, so their
# edges stay clean however coarse the surface's facets are
def projector(*obs):
    """A ray-cast target built from objects (world space)."""
    vs, fs = [], []
    for ob in obs:
        bake_world(ob)
        for p in ob.data.polygons:
            base = len(vs); vs += [ob.data.vertices[i].co.copy() for i in p.vertices]; fs.append(tuple(range(base, base + len(p.vertices))))
    return BVHTree.FromPolygons(vs, fs)


def _drop(bvh, p, d, lift):
    hit = bvh.ray_cast(p + d * 40, -d, 80)
    if hit[0] is None: return p
    return hit[0] + hit[1] * lift


def decal(bvh, centre, direction, radius, seg=20, rings=3, lift=0.4, squash=(1.0, 1.0), spin=0.0, name='decal', wobble=0.0, seed=0):
    """A round (or squashed) disc laid on the surface: centre is near the surface, direction points out of it."""
    d = Vector(direction).normalized(); u = Vector((0, 1, 0)).cross(d)               # u runs level across the surface
    u = (u if u.length > 1e-3 else d.orthogonal()).normalized(); v = d.cross(u)
    cu, su = math.cos(spin), math.sin(spin); u, v = u * cu + v * su, v * cu - u * su
    c0 = Vector(centre)
    bm = bmesh.new(); mid = bm.verts.new(_drop(bvh, c0, d, lift)); ringv = []
    for k in range(1, rings + 1):
        rr = radius * k / rings
        wob = lambda a: 1 + wobble * (0.55 * math.sin(3 * a + seed) + 0.3 * math.sin(5 * a + seed * 2.3) + 0.15 * math.sin(9 * a + seed * 0.7))
        ringv.append([bm.verts.new(_drop(bvh, c0 + (u * math.cos(a) * squash[0] + v * math.sin(a) * squash[1]) * rr * wob(a), d, lift))
                      for a in (i * 2 * math.pi / seg for i in range(seg))])
    for i in range(seg):
        j = (i + 1) % seg; bm.faces.new((mid, ringv[0][i], ringv[0][j]))
        for k in range(rings - 1): bm.faces.new((ringv[k][i], ringv[k + 1][i], ringv[k + 1][j], ringv[k][j]))
    bm.normal_update()
    for f in bm.faces:
        if f.normal.dot(d) < 0: f.normal_flip()
    return _obj(name, bm)


def ribbon(bvh, pts, width, out, lift=0.35, name='ribbon', taper=True):
    """A thin painted strip along pts (near the surface), lying on it; out(p) gives the outward direction at p."""
    bm = bmesh.new(); L = []
    P = [Vector(p) for p in pts]
    for i, p in enumerate(P):
        t = (P[min(i + 1, len(P) - 1)] - P[max(i - 1, 0)]).normalized(); d = Vector(out(p)).normalized(); side = t.cross(d).normalized()
        w = width * (1 - 0.7 * i / (len(P) - 1) if taper else 1)
        L.append((bm.verts.new(_drop(bvh, p + side * w / 2, d, lift)), bm.verts.new(_drop(bvh, p - side * w / 2, d, lift)), d))
    for i in range(len(L) - 1):
        f = bm.faces.new((L[i][0], L[i + 1][0], L[i + 1][1], L[i][1]))
    bm.normal_update()
    for f, (_, _, d) in zip(bm.faces, L):
        if f.normal.dot(d) < 0: f.normal_flip()
    return _obj(name, bm)


# ---- studio preview in the game's look (Cycles, emission only): flat facets, two hard light bands, the strain's colours
# added to the paint, AO, the glow unlit; eyes drawn as the game draws them (a lit ball cut flat on top)
STRAINS = [(0xa4432a, 0xe2d8c0, 0xc4ff58), (0xc4782c, 0xdac9a6, 0xffd24e), (0x3e6c4c, 0xcfd3b4, 0x6effd2), (0x56367c, 0xd0c4da, 0xe27cff), (0x2a2326, 0x8e7e76, 0xff5a22)]
def _lin(h):
    c = [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]


def preview(path, out, yaws=(0.5,), el=0.06, strain=0, size=700, zoom=1.0):
    J = json.load(open(path))
    reset(); sc = bpy.context.scene
    cc, fc, gc = (_lin(h) for h in STRAINS[strain])
    mat = bpy.data.materials.new('toon'); mat.use_nodes = True; nt = mat.node_tree; nt.nodes.clear()
    attr = nt.nodes.new('ShaderNodeAttribute'); attr.attribute_name = 'col'
    glow = nt.nodes.new('ShaderNodeAttribute'); glow.attribute_name = 'glow'
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    dot = nt.nodes.new('ShaderNodeVectorMath'); dot.operation = 'DOT_PRODUCT'
    L = Vector((-0.45, 0.75, 0.55)).normalized(); dot.inputs[1].default_value = (L.x, L.y, L.z)
    nt.links.new(geo.outputs['Normal'], dot.inputs[0])
    gt = nt.nodes.new('ShaderNodeMath'); gt.operation = 'GREATER_THAN'; gt.inputs[1].default_value = 0.0
    nt.links.new(dot.outputs['Value'], gt.inputs[0])
    band = nt.nodes.new('ShaderNodeMapRange'); band.inputs['To Min'].default_value = 0.62; band.inputs['To Max'].default_value = 1.0
    nt.links.new(gt.outputs['Value'], band.inputs['Value'])
    mx = nt.nodes.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'; nt.links.new(band.outputs['Result'], mx.inputs[0]); nt.links.new(glow.outputs['Fac'], mx.inputs[1])
    mul = nt.nodes.new('ShaderNodeVectorMath'); mul.operation = 'SCALE'; nt.links.new(attr.outputs['Color'], mul.inputs[0]); nt.links.new(mx.outputs['Value'], mul.inputs['Scale'])
    em = nt.nodes.new('ShaderNodeEmission'); nt.links.new(mul.outputs['Vector'], em.inputs['Color'])
    o = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(em.outputs['Emission'], o.inputs['Surface'])
    lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
    for P in J['parts']:
        m = P['mesh']; n = len(m['pos']) // 3
        vs = [tuple(m['pos'][i * 3:i * 3 + 3]) for i in range(n)]
        me = bpy.data.meshes.new(P['role']); me.from_pydata(vs, [], [(i, i + 1, i + 2) for i in range(0, n, 3)])
        ca = me.color_attributes.new('col', 'FLOAT_COLOR', 'POINT'); ga = me.attributes.new('glow', 'FLOAT', 'POINT')
        for i in range(n):
            r = [m['rgb'][i * 3 + k] / 255 for k in range(3)]; r = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in r]
            w = [m['w'][i * 3 + k] / 255 for k in range(3)]; ao = m['ao'][i] / 255
            c = [r[k] + cc[k] * w[0] + fc[k] * w[1] + gc[k] * w[2] for k in range(3)]
            k2 = 1 if w[2] > 0.5 else 0.55 + 0.45 * ao
            ca.data[i].color = (c[0] * k2, c[1] * k2, c[2] * k2, 1); ga.data[i].value = 1.0 if w[2] > 0.5 else 0.0
            v = Vector(vs[i]); lo = Vector(map(min, lo, v)); hi = Vector(map(max, hi, v))
        me.materials.append(mat)
        ob = bpy.data.objects.new(P['role'], me); sc.collection.objects.link(ob)
        for e in P.get('eyes') or []:
            bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=12, radius=e['r'])
            s = e.get('s', 1)
            for vv in bm.verts:
                x, y, z = vv.co; top = (0.3 - 0.55 * (-s * x / e['r'])) * e['r']
                vv.co = Vector((x, min(y, top), z * 0.6))
            eo = _obj('eye', bm); eo.location = Vector(e['at']) + Vector(e['out']) * e['r'] * 0.1
            em2 = bpy.data.materials.new('eye'); em2.use_nodes = True; n2 = em2.node_tree; e2 = n2.nodes.get('Principled BSDF'); n2.nodes.remove(e2)
            ee = n2.nodes.new('ShaderNodeEmission'); ee.inputs['Color'].default_value = (*[min(1, x * 1.3) for x in gc], 1); n2.links.new(ee.outputs[0], n2.nodes['Material Output'].inputs['Surface'])
            eo.data.materials.append(em2)
    c = (lo + hi) / 2; r = max(hi - lo) * 0.6 / zoom
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 6; sc.cycles.device = 'CPU'; sc.cycles.use_denoising = False
    sc.render.resolution_x = sc.render.resolution_y = size; sc.render.film_transparent = False
    sc.world = bpy.data.worlds.new('w'); sc.world.use_nodes = True; sc.world.node_tree.nodes['Background'].inputs[0].default_value = (0.58, 0.6, 0.61, 1)
    sc.view_settings.view_transform = 'Standard'
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.lens = 60
    D = r / math.tan(cam.data.angle / 2)
    from PIL import Image
    ims = []
    for i, yw in enumerate(yaws):
        cam.location = c + Vector((math.sin(yw) * math.cos(el), math.sin(el), math.cos(yw) * math.cos(el))) * D
        f = (c - cam.location).normalized(); rt = f.cross(Vector((0, 1, 0))).normalized(); up = rt.cross(f)   # y is up here
        cam.matrix_world = Matrix((( rt.x, up.x, -f.x, cam.location.x), (rt.y, up.y, -f.y, cam.location.y), (rt.z, up.z, -f.z, cam.location.z), (0, 0, 0, 1)))
        sc.render.filepath = f'/tmp/_pv{i}.png'; bpy.ops.render.render(write_still=True); ims.append(Image.open(f'/tmp/_pv{i}.png').convert('RGB'))
    o = Image.new('RGB', (size * len(ims), size))
    for i, im in enumerate(ims): o.paste(im, (size * i, 0))
    o.save(out)


# ---- fusing: several pieces melted into one solid surface (Blender's voxel remesh), the joins softened with a few
# rounds of smoothing so they blend like sculpted clay, then cut down to facets. Each facet is painted by the piece it
# grew from (the nearest one), so colours stay where they were meant to be.
def fuse(pieces, voxel=1.2, smooth=6, factor=0.5, tris=2000, name='fused'):
    """pieces: [(object, paint function)] -> (one fused object, paint function for it)."""
    srcs = []
    for ob, paint in pieces:
        bake_world(ob)
        vs = [v.co.copy() for v in ob.data.vertices]; fs = [tuple(p.vertices) for p in ob.data.polygons]
        srcs.append((BVHTree.FromPolygons(vs, fs), paint))
    bpy.ops.object.select_all(action='DESELECT')
    obs = [ob for ob, _ in pieces]
    for ob in obs: ob.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]
    bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active; ob.name = name
    m = ob.modifiers.new('re', 'REMESH'); m.mode = 'VOXEL'; m.voxel_size = voxel; m.adaptivity = 0
    if smooth:
        s = ob.modifiers.new('sm', 'SMOOTH'); s.factor = factor; s.iterations = smooth
    _apply(ob)
    if tris: decimate(ob, tris)                           # tris 0: leave it dense (to reshape it first)
    def paint(mc, n):
        best, bp = 1e9, None
        for bvh, p in srcs:
            hit = bvh.find_nearest(mc)
            if hit[0] is not None and hit[3] < best: best, bp = hit[3], p
        return bp(mc, n)
    return ob, paint


def claw(base, tip, r, hook=(0, -1, 0), name='claw'):
    """A hooked claw: a cone from base (sunk in a fingertip) curving to a sharp tip, bending toward hook."""
    a, b = Vector(base), Vector(tip); hk = Vector(hook).normalized()
    mid = (a + b) / 2 + hk * (b - a).length * 0.18
    pts = [a, a.lerp(mid, 0.6), mid, mid.lerp(b, 0.6), b]
    return skin([tuple(p) for p in pts], [r, r * 0.85, r * 0.6, r * 0.32, 0.15], sub=1, name=name)


def tuft(c, out, r, n=7, seed=1, name='tuft'):
    """A tuft of pale mould: a cluster of small soft bumps round c, pushed out along out."""
    rng = random.Random(seed); o = Vector(out).normalized(); u = o.orthogonal().normalized(); v = o.cross(u); obs = []
    for i in range(n):
        a = rng.uniform(0, 2 * math.pi); t = rng.uniform(0, 1) ** 0.6 * r
        p = Vector(c) + (u * math.cos(a) + v * math.sin(a)) * t + o * rng.uniform(0, r * 0.25)
        k = r * rng.uniform(0.28, 0.45) * (1 - t / r * 0.4)
        obs.append(blob(tuple(p), (k, k, k), seg=10, name=name))
    return obs


def sharpen(ob, start, end, r0):
    """Taper the surface round the line start -> end to a sharp point at end: everything within about r0 of the line
    is pulled in toward it, more the nearer it is to end, and anything past end closes onto the point."""
    S, E = Vector(start), Vector(end); ax = E - S; L = ax.length; ax.normalize()
    bake_world(ob)
    for v in ob.data.vertices:
        d = v.co - S; u = d.dot(ax) / L
        if u < 0: continue
        rad = d - ax * d.dot(ax)
        if rad.length > r0 * 1.7: continue
        if u >= 1: v.co = E.copy(); continue
        k = (1 - u) ** 0.85
        v.co = S + ax * (u * L) + rad * k
    ob.data.update()
    return ob
