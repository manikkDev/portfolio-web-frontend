"""
Builds the three hover vehicles that fly through the site background and exports them as ONE GLB.

    blender -b --factory-startup -P tools/vehicles/build_vehicles.py -- --out public/models/vehicles.glb
                                                                     [--preview some/dir/vehicles.png]

The file holds three mesh objects, all sitting on the world origin: HoverCar, HoverVan, Freighter.
Nose points to -Y here (+Z in three.js after the Y-up export), up is +Z, lowest point is z = 0.
The site finds the parts by MATERIAL NAME (Paint, Dark, Glass, Head, Tail, Neon, Glow, Window),
so keep those names if you edit this. Colours below are only for the preview render.
"""
import math
import random
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def arg(name, default=None):
    return ARGS[ARGS.index(name) + 1] if name in ARGS else default


# ───────────────────────── numbers ─────────────────────────

SHARP_ANGLE = 35                      # degrees; edges sharper than this stay crisp
BUDGET = {"HoverCar": (900, 1500), "HoverVan": (900, 1500), "Freighter": (1800, 2800)}  # triangles
ROUND = 12                            # sides of round parts (30 degrees a side, so they shade smooth)
# How far light parts stand proud of the body. Small values z-fight at a distance.
LIFT_SMALL, LIFT_BIG = 0.035, 0.10    # car and van / freighter

#            name      colour     metal rough  emission   strength
MATERIALS = [
    ("Paint",  "#b4bdcc", 0.60, 0.36, None, 0),
    ("Dark",   "#14161d", 0.50, 0.50, None, 0),
    ("Glass",  "#04070e", 0.20, 0.06, None, 0),
    ("Head",   "#101418", 0.0, 0.4, "#c8f6ff", 9),
    ("Tail",   "#180408", 0.0, 0.4, "#ff1e5a", 9),
    ("Neon",   "#16041a", 0.0, 0.4, "#ff3df0", 8),
    ("Glow",   "#041418", 0.0, 0.4, "#7df9ff", 10),
    ("Window", "#181208", 0.0, 0.4, "#ffd9a0", 6),
]
MAT_NAMES = [m[0] for m in MATERIALS]


# ───────────────────────── helpers ─────────────────────────

def srgb(hex_color):
    h = hex_color.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]


def mat(name, color, metallic=0.0, rough=0.5, emit=None, strength=0.0):
    m = bpy.data.materials.new(name)
    if not m.node_tree:
        m.use_nodes = True
    bsdf = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = (*srgb(color), 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = rough
    m.use_backface_culling = True         # exported as single-sided, like three.js draws it
    if emit:
        bsdf.inputs["Emission Color"].default_value = (*srgb(emit), 1)
        bsdf.inputs["Emission Strength"].default_value = strength
    return m


def ring(y, half):
    """Left-right symmetric closed ring at station y, from the right half's (half width, z) points, lowest first."""
    return [(x, y, z) for x, z in half] + [(-x, y, z) for x, z in reversed(half)]


def ring_mats(half, top, floor):
    """Materials per ring edge for ring(): the right half's edges, the top flat, the left half, the floor."""
    return half + [top] + half[::-1] + [floor]


def at(stations, y, i):
    """(half width, z) of ring point i of a body at any y, interpolated between its stations."""
    for a, b in zip(stations, stations[1:]):
        if a[0] - 1e-9 <= y <= b[0] + 1e-9:
            t = (y - a[0]) / (b[0] - a[0])
            return tuple(a[1 + i][c] + t * (b[1 + i][c] - a[1 + i][c]) for c in (0, 1))
    raise ValueError(f"y={y} is outside the body")


def on(stations, y, i, t=0.0):
    """Point (x, y, z) on the right side of a body at y: ring point i, or t of the way from it to point i + 1."""
    (w0, z0), (w1, z1) = at(stations, y, i), at(stations, y, i + (1 if t else 0))
    return (w0 + t * (w1 - w0), y, z0 + t * (z1 - z0))


def inside_out(bm):
    """Counts connected parts whose faces point inwards; three.js would not draw those."""
    seen, bad = set(), 0
    for seed in bm.faces:
        if seed in seen:
            continue
        part, todo = [], [seed]
        seen.add(seed)
        while todo:
            f = todo.pop()
            part.append(f)
            for e in f.edges:
                for g in e.link_faces:
                    if g not in seen:
                        seen.add(g)
                        todo.append(g)
        centre = sum((f.calc_center_median() for f in part), Vector()) / len(part)
        bad += sum(f.normal.dot(f.calc_center_median() - centre) * f.calc_area() for f in part) < -1e-9
    return bad


def flip(points):
    return [(-x, y, z) for x, y, z in points]


class Shape:
    """One vehicle: every part is added to the same bmesh, so it ends up as a single mesh object."""

    def __init__(self, name):
        self.name, self.bm = name, bmesh.new()

    def loft(self, rings, material, caps=(True, True), mats=None, cap_mat=None, chamfer=0.0, sym=False):
        """Skins closed rings (same point count each) with quads.
        mats: one material per ring edge, or a function (segment, edge) -> material."""
        if sym:
            self.loft([flip(r) for r in rings], material, caps, mats, cap_mat, chamfer)
        bm = self.bm
        vr = [[bm.verts.new(p) for p in r] for r in rings]
        n = len(vr[0])
        faces = []
        for j in range(len(vr) - 1):
            a, b = vr[j], vr[j + 1]
            for k in range(n):
                f = bm.faces.new((a[k], a[(k + 1) % n], b[(k + 1) % n], b[k]))
                name = material if mats is None else (mats(j, k) if callable(mats) else mats[k])
                f.material_index = MAT_NAMES.index(name)
                faces.append(f)
        for on, r in zip(caps, (vr[0], vr[-1])):
            if on:
                f = bm.faces.new(r)
                f.material_index = MAT_NAMES.index(cap_mat or material)
                faces.append(f)
        bmesh.ops.recalc_face_normals(bm, faces=faces)
        if chamfer:
            bm.normal_update()
            edges = list({e for f in faces for e in f.edges
                          if len(e.link_faces) == 2 and e.calc_face_angle() > math.radians(30)})
            bmesh.ops.bevel(bm, geom=edges, offset=chamfer, segments=1, profile=0.5, affect="EDGES", clamp_overlap=True)

    def box(self, lo, hi, material, chamfer=0.0, sym=False):
        (x0, y0, z0), (x1, y1, z1) = lo, hi
        self.loft([[(x0, y, z0), (x1, y, z0), (x1, y, z1), (x0, y, z1)] for y in (y0, y1)], material, chamfer=chamfer, sym=sym)

    def tube(self, axis, stations, material, caps=(True, True), mats=None, cap_mat=None, sym=False, n=ROUND):
        """Round loft along the world 'y' or 'z' axis; stations are ((x, y, z) centre, radius)."""
        def circle(c, r):
            pts = []
            for k in range(n):
                a = 2 * math.pi * (k + 0.5) / n
                u, v = r * math.cos(a), r * math.sin(a)
                pts.append((c[0] + u, c[1], c[2] + v) if axis == "y" else (c[0] + u, c[1] + v, c[2]))
            return pts
        self.loft([circle(c, r) for c, r in stations], material, caps, mats, cap_mat, sym=sym)

    def slab(self, pts, out, material, lift=LIFT_SMALL, sink=0.02, sym=False):
        """Thin raised panel on a flat face: pts lie on the face, `out` points roughly away from it."""
        if sym:
            self.slab(flip(pts), (-out[0], out[1], out[2]), material, lift, sink)
        v = [Vector(p) for p in pts]
        n = (v[1] - v[0]).cross(v[2] - v[0]).normalized()
        if n.dot(Vector(out)) < 0:
            n = -n
        self.loft([[p - n * sink for p in v], [p + n * lift for p in v]], material, caps=(False, True))

    def plate(self, pts, out, material, lift=LIFT_BIG):
        """A single quad floating `lift` above a flat face (two triangles: used for the many small windows)."""
        v = [Vector(p) for p in pts]
        n = (v[1] - v[0]).cross(v[2] - v[0]).normalized()
        if n.dot(Vector(out)) < 0:
            n = -n
        f = self.bm.faces.new([self.bm.verts.new(p + n * lift) for p in v])
        f.material_index = MAT_NAMES.index(material)
        f.normal_update()
        if f.normal.dot(n) < 0:
            f.normal_flip()

    def strip(self, path, material, half_h, proud, depth=0.03, sym=True):
        """A thin bar running along the right flank through path points (half width, y, z), standing `proud` of it."""
        self.loft([[(x - depth, y, z - half_h), (x + proud, y, z - half_h), (x + proud, y, z + half_h), (x - depth, y, z + half_h)]
                   for x, y, z in path], material, sym=sym)

    def windows(self, origin, along, up, out, count, w, h, pitch, rng, lit=0.8, sym=False):
        """A row of small lit windows; some stay dark so the rows do not look stamped."""
        for sx in ((1, -1) if sym else (1,)):
            o, a, u = (Vector((sx * v[0], v[1], v[2])) for v in (origin, along, up))
            for i in range(count):
                if rng.random() < lit:
                    p = o + a * (i * pitch)
                    self.plate([p, p + a * w, p + a * w + u * h, p + u * h], (sx * out[0], out[1], out[2]), "Window")

    def finish(self, materials):
        bm = self.bm
        bm.normal_update()
        assert not inside_out(bm), f"{self.name}: a part is inside out"
        bmesh.ops.triangulate(bm, faces=bm.faces[:])
        me = bpy.data.meshes.new(self.name)
        bm.to_mesh(me)
        bm.free()
        used = sorted({p.material_index for p in me.polygons})   # only the slots this vehicle needs
        slot = {old: new for new, old in enumerate(used)}
        for p in me.polygons:
            p.material_index = slot[p.material_index]
            p.use_smooth = True
        for i in used:
            me.materials.append(materials[MAT_NAMES[i]])
        me.set_sharp_from_angle(angle=math.radians(SHARP_ANGLE))
        ob = bpy.data.objects.new(self.name, me)
        bpy.context.scene.collection.objects.link(ob)
        return ob


# ───────────────────────── HoverCar ─────────────────────────

def build_car():
    s = Shape("HoverCar")
    # y, then (half width, z) of: floor edge, sill, belt crease, shoulder, deck edge
    body = [
        (-2.26, (0.42, 0.23), (0.52, 0.25), (0.60, 0.30), (0.56, 0.345), (0.44, 0.37)),
        (-2.00, (0.60, 0.14), (0.74, 0.20), (0.83, 0.34), (0.77, 0.43), (0.58, 0.47)),
        (-1.20, (0.70, 0.12), (0.80, 0.20), (0.90, 0.42), (0.84, 0.54), (0.68, 0.585)),
        (-0.55, (0.70, 0.12), (0.79, 0.20), (0.87, 0.48), (0.83, 0.61), (0.74, 0.66)),
        (0.50, (0.70, 0.12), (0.79, 0.20), (0.87, 0.52), (0.84, 0.65), (0.76, 0.70)),
        (1.40, (0.72, 0.12), (0.85, 0.22), (0.97, 0.58), (0.92, 0.73), (0.78, 0.80)),
        (2.02, (0.70, 0.18), (0.85, 0.28), (0.96, 0.60), (0.91, 0.75), (0.76, 0.82)),
        (2.26, (0.60, 0.34), (0.78, 0.40), (0.88, 0.60), (0.84, 0.73), (0.72, 0.80)),
    ]
    s.loft([ring(y, pts) for y, *pts in body], "Paint",
           mats=ring_mats(["Dark", "Paint", "Paint", "Paint"], "Paint", "Dark"))

    # Cabin: raked windscreen, short roof, fastback with a rear window. It sits sunk into the deck.
    def cab(y, w, z, ch=0.06):
        bw, bz = at(body, y, 4)
        return ring(y, [(bw - 0.02, bz - 0.03), (w, z - ch * 0.6), (w - ch, z)])

    def cab_mat(seg, edge):
        if edge == 5:
            return "Dark"                                   # underside, hidden in the body
        if edge in (0, 4):
            return "Glass" if seg < 2 else "Paint"          # side glass, then the rear buttress
        if edge in (1, 3):
            return "Paint"                                  # pillars and roof rails
        return ("Glass", "Paint", "Glass")[seg]             # windscreen, roof, rear window

    cabin = ((-0.95, 0.50, 0.64, 0.03), (0.10, 0.56, 1.12, 0.06), (0.65, 0.55, 1.13, 0.06), (1.95, 0.50, 0.89, 0.04))
    s.loft([cab(*c) for c in cabin], "Paint", mats=cab_mat)

    # Dark details: louvres over the rear window, a hood vent, an intake in each flank.
    (ya, wa, za, ca), (yb, wb, zb, cb) = cabin[2], cabin[3]
    for t in (0.20, 0.44, 0.68):
        (w0, y0, z0), (w1, y1, z1) = ((wa - ca + u * (wb - cb - wa + ca) - 0.05, ya + u * (yb - ya), za + u * (zb - za)) for u in (t, t + 0.10))
        s.slab([(-w0, y0, z0), (w0, y0, z0), (w1, y1, z1), (-w1, y1, z1)], (0, 0, 1), "Dark", lift=0.03)
    (y0, z0), (y1, z1) = ((y, at(body, y, 4)[1]) for y in (-1.80, -1.42))
    s.slab([(-0.20, y0, z0), (0.20, y0, z0), (0.34, y1, z1), (-0.34, y1, z1)], (0, 0, 1), "Dark", lift=0.025)
    s.slab([on(body, 0.58, 1, 0.22), on(body, 1.04, 1, 0.22), on(body, 1.10, 1, 0.86), on(body, 0.80, 1, 0.86)], (1, 0, 0), "Dark", lift=0.03, sym=True)

    # Rear wing on two pylons, with end plates.
    s.loft([[(x, 1.92, 0.935), (x, 2.33, 0.955), (x, 2.33, 0.995), (x, 1.92, 0.96)] for x in (-0.92, 0.92)], "Paint")
    s.box((0.40, 2.00, 0.78), (0.48, 2.20, 0.95), "Dark", sym=True)
    s.box((0.90, 1.86, 0.86), (0.94, 2.35, 1.03), "Paint", sym=True)

    # Dark aero parts: splitter, skirts, diffuser block and fins.
    s.box((-0.72, -2.30, 0.13), (0.72, -1.80, 0.17), "Dark")
    s.box((0.74, -0.92, 0.09), (0.91, 1.03, 0.19), "Dark", sym=True)
    s.box((-0.56, 1.80, 0.16), (0.56, 2.30, 0.33), "Dark")
    for x in (0.16, 0.42):
        s.box((x, 1.95, 0.09), (x + 0.035, 2.32, 0.30), "Dark", sym=True)

    # Four hover pods where the wheels would be: dark housing, glowing disc underneath.
    for y, r, x in ((-1.32, 0.30, 0.68), (1.46, 0.34, 0.66)):
        s.tube("z", [((x, y, 0.045), r), ((x, y, 0.24), r), ((x, y, 0.31), r - 0.07)], "Dark", sym=True)
        s.tube("z", [((x, y, 0.0), r - 0.06), ((x, y, 0.07), r - 0.06)], "Glow", caps=(True, False), sym=True)

    # Two rear thrusters.
    s.tube("y", [((0.40, 2.08, 0.50), 0.12), ((0.40, 2.33, 0.50), 0.135)], "Dark", caps=(False, True), sym=True)
    s.tube("y", [((0.40, 2.30, 0.50), 0.095), ((0.40, 2.37, 0.50), 0.095)], "Glow", caps=(False, True), sym=True)

    # Lights: thin bar across the nose, wide bar across the tail, neon line along the belt crease.
    s.box((-0.53, -2.31, 0.295), (0.53, -2.22, 0.342), "Head")
    s.box((-0.82, 2.20, 0.635), (0.82, 2.305, 0.705), "Tail")
    s.strip([on(body, b[0], 2) for b in body[1:7]], "Neon", half_h=0.022, proud=0.03)
    return s


# ───────────────────────── HoverVan ─────────────────────────

def build_van():
    s = Shape("HoverVan")
    # Window band: a flat, slightly leaning plane from the belt crease up to the roof edge.
    belt, lean, roof = (1.08, 1.02), (-0.10, 0.62), 1.78

    def band(v):
        return (belt[0] + v * lean[0], belt[1] + v * lean[1])

    # y, then (half width, z) of: floor edge, sill, belt crease, roof edge, roof
    body = [
        (-2.52, (0.80, 0.38), (0.98, 0.50), (1.02, 0.86), (1.00, 0.90), (0.86, 0.96)),   # nose
        (-2.20, (0.90, 0.26), (1.04, 0.40), belt, band(0.06), (0.94, 1.12)),             # windscreen base
        (-1.55, (0.90, 0.24), (1.05, 0.40), belt, band(1.0), (0.84, roof)),              # windscreen top
        (2.25, (0.90, 0.24), (1.05, 0.40), belt, band(1.0), (0.84, roof)),
        (2.52, (0.84, 0.36), (1.00, 0.50), (1.04, 1.02), (0.955, 1.58), (0.82, 1.70)),   # tail
    ]
    s.loft([ring(y, pts) for y, *pts in body], "Paint",
           mats=ring_mats(["Dark", "Paint", "Paint", "Paint"], "Paint", "Dark"))

    # Windscreen on the sloping face between stations 1 and 2.
    def screen(t, inset):
        (y0, *a), (y1, *b) = body[1], body[2]
        w = a[4][0] + t * (b[4][0] - a[4][0]) - inset
        return w, y0 + t * (y1 - y0), a[4][1] + t * (b[4][1] - a[4][1])
    (w0, ya, za), (w1, yb, zb) = screen(0.10, 0.07), screen(0.93, 0.07)
    s.slab([(-w0, ya, za), (w0, ya, za), (w1, yb, zb), (-w1, yb, zb)], (0, -1, 1), "Glass")

    # Side windows on the band: (y, v) corners, v = 0 at the belt and 1 at the roof edge.
    for quad in ([(-1.98, 0.10), (-0.42, 0.10), (-0.42, 0.88), (-1.50, 0.88)],
                 [(-0.26, 0.10), (0.98, 0.10), (0.98, 0.88), (-0.26, 0.88)],
                 [(1.14, 0.10), (2.12, 0.10), (2.12, 0.88), (1.14, 0.88)]):
        s.slab([(band(v)[0], y, band(v)[1]) for y, v in quad], (1, 0, 0.2), "Glass", sym=True)

    # Tail face: rear window and tall tail lights.
    s.slab([(-0.72, 2.52, 1.08), (0.72, 2.52, 1.08), (0.68, 2.52, 1.50), (-0.68, 2.52, 1.50)], (0, 1, 0), "Glass")
    s.slab([(0.79, 2.52, 0.94), (0.93, 2.52, 0.94), (0.90, 2.52, 1.48), (0.79, 2.52, 1.48)], (0, 1, 0), "Tail", sym=True)

    # Bumpers with light bars, and a thin light bar across the nose.
    s.box((-1.04, -2.60, 0.34), (1.04, -2.36, 0.60), "Dark", chamfer=0.04)
    s.box((-1.04, 2.36, 0.34), (1.04, 2.60, 0.62), "Dark", chamfer=0.04)
    s.slab([(-0.88, -2.52, 0.79), (0.88, -2.52, 0.79), (0.88, -2.52, 0.855), (-0.88, -2.52, 0.855)], (0, -1, 0), "Head")
    s.slab([(-0.70, -2.52, 0.635), (0.70, -2.52, 0.635), (0.70, -2.52, 0.755), (-0.70, -2.52, 0.755)], (0, -1, 0), "Dark", lift=0.025)
    s.box((0.46, -2.635, 0.44), (0.90, -2.56, 0.50), "Head", sym=True)
    s.box((-0.84, 2.56, 0.46), (0.84, 2.635, 0.525), "Tail")

    # Roof: rails, taxi sign, cooling unit, spoiler lip.
    r = roof - 0.02                      # roof parts start just inside the roof
    s.box((0.66, -1.35, r), (0.73, 2.15, r + 0.09), "Dark", sym=True)
    for y in (-0.45, 0.22, 2.02):
        s.box((-0.69, y, r + 0.045), (0.69, y + 0.06, r + 0.08), "Dark")
    s.box((-0.54, -1.28, r), (0.54, -0.78, r + 0.065), "Dark")
    s.box((-0.48, -1.20, r + 0.05), (0.48, -0.86, 2.00), "Neon", chamfer=0.035)
    s.box((-0.45, 0.85, r), (0.45, 1.90, r + 0.13), "Dark", chamfer=0.04)
    s.loft([[(x, 2.10, r), (x, 2.58, r + 0.04), (x, 2.58, r + 0.085), (x, 2.10, r + 0.05)] for x in (-0.80, 0.80)], "Paint")
    s.box((-0.50, 2.55, r + 0.048), (0.50, 2.615, r + 0.078), "Tail")

    # Flank detail: rub rail on the belt, neon stripe below it, door seams and a sliding-door track.
    s.strip([on(body, b[0], 2) for b in body[1:4]], "Dark", half_h=0.035, proud=0.025)

    def side(y, z):                      # point on the lower side panel (sill to belt)
        w0, z0 = at(body, y, 1)
        w1, z1 = at(body, y, 2)
        return (w0 + (z - z0) / (z1 - z0) * (w1 - w0), y, z)
    s.strip([side(y, 0.62) for y in (-2.20, -1.55, 2.25)], "Neon", half_h=0.03, proud=0.03)
    for y in (-0.40, 1.00):
        s.slab([side(y, 0.72), side(y + 0.03, 0.72), side(y + 0.03, 0.95), side(y, 0.95)], (1, 0, 0), "Dark", lift=0.02, sym=True)
    s.slab([side(-0.34, 0.86), side(0.98, 0.86), side(0.98, 0.90), side(-0.34, 0.90)], (1, 0, 0), "Dark", lift=0.02, sym=True)

    # Hover gear: four corner pods with glowing pads, two long glow panels under the floor.
    for y0, y1 in ((-2.05, -1.15), (1.15, 2.05)):
        s.box((0.60, y0, 0.06), (1.08, y1, 0.44), "Dark", chamfer=0.05, sym=True)
        s.box((0.66, y0 + 0.07, 0.0), (1.02, y1 - 0.07, 0.09), "Glow", sym=True)
    s.box((0.18, -1.00, 0.16), (0.50, 1.00, 0.27), "Glow", sym=True)
    s.box((0.94, -1.08, 0.29), (1.10, 1.08, 0.35), "Dark", sym=True)        # side steps
    return s


# ───────────────────────── Freighter ─────────────────────────

def build_freighter():
    s = Shape("Freighter")
    rng = random.Random(7)               # fixed seed: the same windows are lit on every build
    deck = 3.0
    # y, then (half width, z) of: keel edge, bilge, gunwale, deck edge
    hull = [
        (-20.0, (0.5, 2.0), (0.95, 2.3), (1.1, 2.75), (0.9, deck)),
        (-17.5, (1.3, 0.9), (2.5, 1.6), (2.7, 2.75), (2.5, deck)),
        (-13.0, (2.2, 0.12), (3.7, 1.1), (3.9, 2.75), (3.7, deck)),
        (13.0, (2.2, 0.12), (3.7, 1.1), (3.9, 2.75), (3.7, deck)),
        (17.5, (2.0, 0.5), (3.6, 1.35), (3.8, 2.75), (3.6, deck)),
        (20.0, (1.5, 1.5), (2.8, 2.0), (3.1, 2.75), (2.9, deck)),
    ]
    s.loft([ring(y, pts) for y, *pts in hull], "Paint", mats=ring_mats(["Dark", "Paint", "Paint"], "Dark", "Dark"))

    # Raised forecastle following the bow, with a foremast and a few crew windows.
    fc = ((-19.7, 0.95, 3.7), (-17.5, 2.3, 3.95), (-15.2, 3.0, 4.05))
    s.loft([[(-w, y, deck - 0.05), (w, y, deck - 0.05), (w, y, z), (-w, y, z)] for y, w, z in fc], "Paint", chamfer=0.12)
    s.box((-0.10, -17.2, 4.0), (0.10, -17.0, 6.4), "Dark")
    s.box((-0.9, -17.16, 5.7), (0.9, -17.04, 5.82), "Dark")
    s.box((-0.16, -17.26, 6.4), (0.16, -16.94, 6.62), "Head")
    s.box((0.45, -19.78, 3.25), (0.85, -19.66, 3.5), "Head", sym=True)
    (ya, wa, _), (yb, wb, _) = fc[1], fc[2]
    s.windows((wa + 0.15 * (wb - wa), ya + 0.15 * (yb - ya), 3.3), Vector((wb - wa, yb - ya, 0)).normalized(), (0, 0, 1),
              (1, -0.3, 0), 3, 0.42, 0.38, 0.62, rng, lit=1.0, sym=True)

    # Raised bulwark along the deck edge and ribs down the hull sides.
    s.loft([[(w - 0.16, y, deck - 0.05), (w - 0.03, y, deck - 0.05), (w - 0.03, y, deck + 0.45), (w - 0.16, y, deck + 0.45)]
            for y in (-15.2, -13.0, 13.0, 17.5, 20.0) for w in (at(hull, y, 3)[0],)], "Paint", sym=True)
    for y in (-12.2, -6.6, -3.8, -1.0, 1.4):
        s.slab([on(hull, y, 1, 0.08), on(hull, y + 0.3, 1, 0.08), on(hull, y + 0.3, 1, 0.92), on(hull, y, 1, 0.92)],
               (1, 0, 0), "Dark", lift=0.12, sink=0.05, sym=True)

    # Cargo: four rows of three stacks, one or two containers high, with a lashing frame between rows.
    stacks = ((1, 2, 1), (2, 2, 2), (2, 1, 2), (1, 2, 2))
    for row, heights in enumerate(stacks):
        y0 = -14.6 + row * 6.1
        for col, n in enumerate(heights):
            x = (col - 1) * 2.38
            for level in range(n):
                z0 = deck + 0.04 + level * 2.06
                dark = (2 * row + col + 3 * level) % 3 == 0          # one container in three is dark
                s.box((x - 1.075, y0, z0), (x + 1.075, y0 + 5.8, z0 + 2.0), "Dark" if dark else "Paint")
        if row:
            s.box((-3.5, y0 - 0.23, deck - 0.05), (3.5, y0 - 0.07, deck + 4.3), "Dark")

    # Bridge tower near the tail: two stepped blocks, a wide bridge leaning forward, funnel, mast and radome.
    t1, t2 = 3.05, 2.45                  # half widths of the two tower blocks
    s.box((-t1, 10.4, deck - 0.05), (t1, 16.6, 5.7), "Paint", chamfer=0.12)
    s.box((-t2, 11.0, 5.65), (t2, 15.8, 7.0), "Paint", chamfer=0.10)
    bx, bz0, bz1, by = 3.6, 6.95, 8.0, (10.5, 10.1, 13.4, 13.6)
    s.loft([[(-bx, by[0], bz0), (bx, by[0], bz0), (bx, by[1], bz1), (-bx, by[1], bz1)],
            [(-bx, by[2], bz0), (bx, by[2], bz0), (bx, by[3], bz1), (-bx, by[3], bz1)]], "Paint", chamfer=0.10)
    s.loft([[(-1.0, 14.0, 6.95), (1.0, 14.0, 6.95), (1.0, 15.6, 6.95), (-1.0, 15.6, 6.95)],
            [(-0.75, 14.5, 8.5), (0.75, 14.5, 8.5), (0.75, 15.9, 8.5), (-0.75, 15.9, 8.5)]], "Dark")
    s.box((-0.12, 12.0, 7.95), (0.12, 12.24, 8.85), "Dark")
    s.box((-1.2, 12.06, 8.45), (1.2, 12.18, 8.57), "Dark")
    s.box((-0.17, 11.95, 8.82), (0.17, 12.29, 9.0), "Tail")
    s.box((-0.9, 10.9, 7.95), (0.9, 11.2, 8.3), "Dark")
    s.tube("z", [((-2.3, 12.2, 7.95), 0.55), ((-2.3, 12.2, 8.35), 0.55), ((-2.3, 12.2, 8.6), 0.28)], "Paint", caps=(False, True))

    # Bridge windows: a band of panes round the front and sides.
    def front(x, t):                     # point on the leaning bridge front, t = 0 bottom .. 1 top
        return (x, by[0] + t * (by[1] - by[0]), bz0 + t * (bz1 - bz0))
    for i in range(7):
        x0 = -3.22 + i * 0.94
        s.plate([front(x0, 0.32), front(x0 + 0.80, 0.32), front(x0 + 0.80, 0.78), front(x0, 0.78)], (0, -1, 0.3), "Window")
    s.windows((bx, 10.75, 7.29), (0, 1, 0), (0, 0, 1), (1, 0, 0), 3, 0.7, 0.48, 0.85, rng, lit=1.0, sym=True)

    # Rows of small windows on the tower and the aft hull.
    for z in (3.75, 4.7):
        s.windows((t1, 10.9, z), (0, 1, 0), (0, 0, 1), (1, 0, 0), 8, 0.42, 0.42, 0.70, rng, sym=True)
        s.windows((-2.66, 16.6, z), (1, 0, 0), (0, 0, 1), (0, 1, 0), 8, 0.42, 0.42, 0.70, rng)
    s.windows((t2, 11.5, 6.1), (0, 1, 0), (0, 0, 1), (1, 0, 0), 6, 0.42, 0.42, 0.70, rng, sym=True)
    s.windows((-1.96, 11.0, 6.1), (1, 0, 0), (0, 0, 1), (0, -1, 0), 6, 0.42, 0.42, 0.70, rng)
    side = Vector(on(hull, 0, 2)) - Vector(on(hull, 0, 1))
    s.windows(on(hull, 2.6, 1, 0.48), (0, 1, 0), side.normalized(), (1, 0, 0), 11, 0.45, 0.40, 0.72, rng, sym=True)

    # Tail fins with a red light on top.
    s.loft([[(2.6 - t, ya, z), (2.6 + t, ya, z), (2.6 + t, yb, z), (2.6 - t, yb, z)]
            for t, ya, yb, z in ((0.18, 16.6, 19.6, deck - 0.05), (0.07, 18.3, 19.95, 6.8))], "Paint", sym=True)
    s.box((2.47, 19.2, 6.8), (2.73, 19.95, 7.0), "Tail", sym=True)

    # Engines: two big nacelles aft, two smaller forward, on stub wings, each with a glowing exhaust at the back.
    for x, y0, length, z, r in ((5.1, 9.6, 7.0, 1.9, 0.9), (5.05, -11.5, 5.0, 1.8, 0.75)):
        y1 = y0 + length
        s.tube("y", [((x, y0, z), 0.62 * r), ((x, y0 + 0.14 * length, z), r), ((x, y0 + 0.72 * length, z), r), ((x, y1, z), 0.78 * r)],
               "Dark", mats=lambda seg, edge: "Paint" if seg == 1 else "Dark", sym=True, n=16)
        s.tube("y", [((x, y1 - 0.1, z), 0.62 * r), ((x, y1 + 0.3, z), 0.5 * r)], "Glow", caps=(False, True), sym=True, n=16)
        ym = y0 + 0.45 * length
        s.loft([[(wx, ym - c0 * length, z - t), (wx, ym + c1 * length, z - t), (wx, ym + c1 * length, z + t), (wx, ym - c0 * length, z + t)]
                for wx, c0, c1, t in ((3.6, 0.27, 0.27, 0.27), (x - 0.4 * r, 0.14, 0.22, 0.17))], "Dark", sym=True)

    # Lift panels under the keel, neon line along the gunwale, stern lights.
    for y in (-8.0, 0.0, 8.0):
        s.box((-1.5, y - 1.5, 0.0), (1.5, y + 1.5, 0.22), "Glow")
    s.strip([on(hull, h[0], 2) for h in hull[1:5]], "Neon", half_h=0.09, proud=0.09, depth=0.1)
    s.box((1.7, 19.9, 2.25), (2.4, 20.1, 2.55), "Tail", sym=True)
    return s


# ───────────────────────── main ─────────────────────────

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    materials = {m[0]: mat(*m) for m in MATERIALS}
    objects = [build().finish(materials) for build in (build_car, build_van, build_freighter)]

    ok = True
    for ob in objects:
        tris, (lo, hi) = len(ob.data.polygons), BUDGET[ob.name]
        size = ob.dimensions
        fits = lo <= tris <= hi
        ok &= fits
        print(f"VEHICLES {ob.name}: triangles={tris} {'ok' if fits else f'OUTSIDE {lo}-{hi}'} "
              f"size x={size.x:.2f} y={size.y:.2f} z={size.z:.2f} materials={[m.name for m in ob.data.materials]}")

    out = arg("--out")
    if out and ok:
        bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True, export_texcoords=False,
                                  export_yup=True, export_cameras=False, export_lights=False)
        print("VEHICLES exported", out)

    preview = arg("--preview")
    if preview:
        render_preview(scene, objects, preview)
    if not ok:
        sys.exit("VEHICLES triangle budget broken: nothing exported")


def render_preview(scene, objects, path):
    """One contact sheet per vehicle (six views) to check the shapes. Not used by the site."""
    import numpy as np

    world = bpy.data.worlds.new("w")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.012, 0.014, 0.03, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 1.0

    def look(direction):
        """Rotation whose local -Z points along `direction`, built from explicit axes."""
        f = Vector(direction).normalized()
        r = f.cross(Vector((0, 0, 1)))
        r = r.normalized() if r.length > 1e-4 else Vector((1, 0, 0))
        u = r.cross(f)
        return Matrix((r, u, -f)).transposed()

    for direction, energy, color in (((-0.5, 0.8, -0.7), 3.2, (0.85, 0.93, 1.0)),     # cool key from front right
                                     ((0.8, -0.6, -0.35), 2.2, (1.0, 0.3, 0.85)),     # magenta rim from rear left
                                     ((0.3, 0.2, 1.0), 1.0, (0.3, 0.9, 1.0))):        # cyan from below
        data = bpy.data.lights.new("l", "SUN")
        data.energy, data.color = energy, color
        ob = bpy.data.objects.new("l", data)
        scene.collection.objects.link(ob)
        ob.rotation_euler = look(direction).to_euler()

    cam_data = bpy.data.cameras.new("c")
    cam_data.lens = 55
    cam = bpy.data.objects.new("c", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    w, h = 640, 420
    scene.render.resolution_x, scene.render.resolution_y = w, h
    try:
        scene.render.engine = "BLENDER_EEVEE"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.view_settings.view_transform = "Standard"
    scene.render.image_settings.file_format = "PNG"
    tan_h = 18 / cam_data.lens
    tan_v = tan_h * h / w

    # where the camera sits, as a direction from the vehicle
    views = (("front34", (0.75, -1.0, 0.42)), ("side", (1.0, 0.0, 0.06)), ("rear34", (-0.8, 1.0, 0.45)),
             ("top", (0.02, -0.3, 1.0)), ("front", (0.0, -1.0, 0.12)), ("below", (0.7, 0.9, -0.5)))
    for ob in objects:
        for other in objects:
            other.hide_render = other is not ob
        corners = [Vector(c) for c in ob.bound_box]
        centre = sum(corners, Vector()) / 8
        tiles = []
        for key, direction in views:
            rot = look(-Vector(direction))
            r, u, f = rot.col[0], rot.col[1], -rot.col[2]
            dist = max(max(abs((c - centre).dot(r)) / tan_h, abs((c - centre).dot(u)) / tan_v) - (c - centre).dot(f)
                       for c in corners) * 1.06
            cam.matrix_world = Matrix.Translation(centre - f * dist) @ rot.to_4x4()
            scene.render.filepath = path.replace(".png", f"_{ob.name}_{key}.png")
            bpy.ops.render.render(write_still=True)
            img = bpy.data.images.load(scene.render.filepath)
            px = np.empty(w * h * 4, dtype=np.float32)
            img.pixels.foreach_get(px)
            tiles.append(px.reshape(h, w, 4))
            bpy.data.images.remove(img)
        rows = [np.concatenate(tiles[i:i + 3], axis=1) for i in (0, 3)]
        grid = np.concatenate(rows[::-1], axis=0)             # image rows run bottom-up
        sheet = bpy.data.images.new("sheet", grid.shape[1], grid.shape[0])
        sheet.pixels.foreach_set(grid.ravel())
        sheet.filepath_raw = path.replace(".png", f"_{ob.name}.png")
        sheet.file_format = "PNG"
        sheet.save()
        print("VEHICLES preview", sheet.filepath_raw)


main()
