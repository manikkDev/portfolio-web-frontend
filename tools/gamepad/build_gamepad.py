"""
Builds the cyber gamepad used by the site intro and exports it as a GLB.

    blender -b -P build_gamepad.py -- --out ../../public/models/gamepad.glb [--preview preview.png]

Everything is generated from the numbers in this file, so the model can be rebuilt
or adjusted without opening Blender. Object names (Btn_A, Stick_L, Dpad_Up, ...) are
read by the intro code to light parts up; keep them if you edit this.
"""
import math
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def arg(name, default=None):
    return ARGS[ARGS.index(name) + 1] if name in ARGS else default


# ───────────────────────── helpers ─────────────────────────

def srgb(hex_color):
    h = hex_color.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]


MATS = {}


def mat(name, color, metallic=0.0, rough=0.5, emit=None, strength=0.0):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    if not m.node_tree:
        m.use_nodes = True
    bsdf = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = (*srgb(color), 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = rough
    if emit:
        bsdf.inputs["Emission Color"].default_value = (*srgb(emit), 1)
        bsdf.inputs["Emission Strength"].default_value = strength
    MATS[name] = m
    return m


def make(name, bm, material, parent=None, sharp=38):
    """Turns a bmesh into a smooth-shaded object."""
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    me.set_sharp_from_angle(angle=math.radians(sharp))
    me.materials.append(material)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    if parent:
        ob.parent = parent
    return ob


def empty(name, parent=None):
    ob = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(ob)
    if parent:
        ob.parent = parent
    return ob


def circle(r, n=40, cx=0.0, cy=0.0):
    return [(cx + r * math.cos(2 * math.pi * i / n), cy + r * math.sin(2 * math.pi * i / n)) for i in range(n)]


def rounded_rect(w, h, r, n=8):
    pts = []
    for cx, cy, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def prism(pts, height, bevel=0.0, seg=3, dish=0.0, dish_inset=0.0):
    """Extrudes a 2D outline upward; optionally rounds the top edge and dishes the top."""
    bm = bmesh.new()
    face = bm.faces.new([bm.verts.new((x, y, 0)) for x, y in pts])
    face.normal_update()
    if face.normal.z < 0:
        face.normal_flip()
    geom = bmesh.ops.extrude_face_region(bm, geom=[face])["geom"]
    bmesh.ops.translate(bm, vec=(0, 0, height), verts=[g for g in geom if isinstance(g, bmesh.types.BMVert)])
    top = next(g for g in geom if isinstance(g, bmesh.types.BMFace))
    if dish:
        bmesh.ops.inset_region(bm, faces=[top], thickness=dish_inset, depth=-dish, use_even_offset=True, use_boundary=True)
    if bevel:
        rim = [e for e in bm.edges if all(abs(v.co.z - height) < 1e-6 for v in e.verts) and len(e.link_faces) == 2
               and any(abs(f.normal.z) < 0.5 for f in e.link_faces)]
        bmesh.ops.bevel(bm, geom=rim, offset=bevel, segments=seg, profile=0.5, affect="EDGES", clamp_overlap=True)
    return bm


def tube(points, radius, seg=10, closed=True):
    """Sweeps a circle along a polyline (used for the neon seam)."""
    bm = bmesh.new()
    n = len(points)
    rings = []
    for i, p in enumerate(points):
        a, b = points[(i - 1) % n], points[(i + 1) % n]
        tangent = (Vector(b) - Vector(a)).normalized()
        side = tangent.cross(Vector((0, 0, 1)))
        side = side.normalized() if side.length > 1e-6 else Vector((1, 0, 0))
        up = side.cross(tangent).normalized()
        rings.append([bm.verts.new(Vector(p) + radius * (math.cos(2 * math.pi * k / seg) * side + math.sin(2 * math.pi * k / seg) * up))
                      for k in range(seg)])
    for i in range(n if closed else n - 1):
        r0, r1 = rings[i], rings[(i + 1) % n]
        for k in range(seg):
            bm.faces.new((r0[k], r0[(k + 1) % seg], r1[(k + 1) % seg], r1[k]))
    return bm


# ───────────────────────── shape ─────────────────────────

# Right half of the top-view outline, from the top centre round to the bottom centre.
HALF = [
    (0.00, 0.43), (0.30, 0.45), (0.58, 0.43), (0.78, 0.35), (0.90, 0.19), (0.95, -0.04),
    (0.94, -0.30), (0.88, -0.54), (0.78, -0.70), (0.655, -0.75), (0.535, -0.69), (0.455, -0.54),
    (0.395, -0.37), (0.30, -0.27), (0.15, -0.235), (0.00, -0.225),
]
OUTLINE = HALF + [(-x, y) for x, y in reversed(HALF[1:-1])]

GRIP_START = -0.16  # grips curve downward below this y


def droop(co):
    """Bends the grips down and slightly back, like a real controller."""
    if co.y < GRIP_START:
        t = GRIP_START - co.y
        co.z -= 0.72 * t * t
    return co


def build_body():
    bm = bmesh.new()
    face = bm.faces.new([bm.verts.new((x, y, 0)) for x, y in OUTLINE])
    face.normal_update()
    if face.normal.z < 0:
        face.normal_flip()
    # Pillow profile: wall, shoulder, dome, flat top.
    for thickness, depth in ((0.002, 0.060), (0.035, 0.060), (0.060, 0.034), (0.045, 0.010)):
        bmesh.ops.inset_region(bm, faces=[face], thickness=thickness, depth=depth, use_even_offset=True, use_boundary=True)
    bmesh.ops.poke(bm, faces=[face])
    # Underside: the same profile mirrored.
    geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.mirror(bm, geom=geom, axis="Z", merge_dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])

    me = bpy.data.meshes.new("BodyCage")
    bm.to_mesh(me)
    bm.free()
    cage = bpy.data.objects.new("BodyCage", me)
    bpy.context.scene.collection.objects.link(cage)
    cage.modifiers.new("subsurf", "SUBSURF").levels = 2
    dense = bpy.data.meshes.new_from_object(cage.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bpy.data.objects.remove(cage)

    # The equator loop (z == 0 before bending) becomes the neon seam.
    bm = bmesh.new()
    bm.from_mesh(dense)
    seam_edges = [e for e in bm.edges if all(abs(v.co.z) < 1e-5 for v in e.verts)]
    loop, edge = [], seam_edges[0]
    vert = edge.verts[0]
    for _ in range(len(seam_edges)):
        loop.append(tuple(vert.co))
        nxt = edge.other_vert(vert)
        edge = next(e for e in nxt.link_edges if e in seam_edges and e is not edge)
        vert = nxt
    for v in bm.verts:
        if v.co.z < 0:
            v.co.z *= 1.2  # underside a little deeper than the top
        droop(v.co)
    return bm, [tuple(droop(Vector(p))) for p in loop]


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    body_m = mat("Body", "#161922", metallic=0.75, rough=0.34)
    dark_m = mat("BodyDark", "#0a0b10", metallic=0.6, rough=0.45)
    rubber = mat("Rubber", "#07080b", metallic=0.0, rough=0.82)
    glass = mat("Glass", "#04060c", metallic=0.2, rough=0.06)
    button = mat("Button", "#1d212c", metallic=0.5, rough=0.25)
    cyan = mat("AccentCyan", "#00121a", emit="#00f5ff", strength=6)
    magenta = mat("AccentMagenta", "#1a0016", emit="#ff00d4", strength=6)
    green = mat("AccentGreen", "#061a00", emit="#39ff14", strength=6)

    root = empty("Gamepad")

    bm, seam = build_body()
    body = make("Body", bm, body_m, root, sharp=60)
    make("Seam", tube(seam, 0.0075, seg=8), cyan, root)

    # Surface lookup so every control sits on the shell.
    bm = bmesh.new()
    bm.from_mesh(body.data)
    bvh = BVHTree.FromBMesh(bm)

    def on_surface(x, y, sink=0.004):
        hit, normal, _, _ = bvh.ray_cast(Vector((x, y, 2)), Vector((0, 0, -1)))
        # Keep the body's left-right direction; only tilt to follow the shell.
        x_axis = (Vector((1, 0, 0)) - normal * normal.x).normalized()
        y_axis = normal.cross(x_axis)
        rot = Matrix((x_axis, y_axis, normal)).transposed().to_4x4()
        return Matrix.Translation(hit - normal * sink) @ rot

    def place(ob, x, y, sink=0.004):
        ob.matrix_local = on_surface(x, y, sink)
        return ob

    # ── Analog sticks (group pivots at the base so they can tilt) ──
    for name, sx in (("Stick_L", -0.285), ("Stick_R", 0.285)):
        sy = -0.035
        base = place(empty(name + "_Base", root), sx, sy)
        make(name + "_Well", prism(circle(0.118), 0.008, bevel=0.003, seg=2), rubber, base)
        ring = make(name + "_Ring", prism(circle(0.130, 48), 0.004), cyan if sx < 0 else magenta, base)
        ring.location.z = 0.0012
        stick = empty(name, base)
        stick.location.z = 0.006
        make(name + "_Stem", prism(circle(0.046, 28), 0.060, bevel=0.004, seg=2), dark_m, stick)
        cap = make(name + "_Cap", prism(circle(0.088, 40), 0.030, bevel=0.012, seg=4, dish=0.010, dish_inset=0.024), rubber, stick)
        cap.location.z = 0.052

    # ── D-pad ──
    dpad = place(empty("Dpad", root), -0.585, 0.135)
    make("Dpad_Plate", prism(circle(0.150, 48), 0.005, bevel=0.003, seg=2), dark_m, dpad)
    a, b = 0.043, 0.118
    plus = [(a, b), (-a, b), (-a, a), (-b, a), (-b, -a), (-a, -a), (-a, -b), (a, -b), (a, -a), (b, -a), (b, a), (a, a)]
    cross = make("Dpad_Cross", prism(plus, 0.026, bevel=0.007, seg=3), button, dpad)
    cross.location.z = 0.004
    tri = [(0, 0.022), (-0.020, -0.012), (0.020, -0.012)]
    for name, ang in (("Dpad_Up", 0), ("Dpad_Left", 90), ("Dpad_Down", 180), ("Dpad_Right", 270)):
        arrow = make(name, prism(tri, 0.0035), cyan, dpad)
        r = math.radians(ang)
        arrow.location = (-math.sin(r) * 0.083, math.cos(r) * 0.083, 0.0295)
        arrow.rotation_euler.z = r

    # ── Face buttons ──
    cx, cy, d = 0.585, 0.135, 0.092
    for name, (dx, dy), accent in (("Btn_A", (0, -d), green), ("Btn_B", (d, 0), magenta),
                                   ("Btn_X", (-d, 0), cyan), ("Btn_Y", (0, d), cyan)):
        grp = place(empty(name + "_Base", root), cx + dx, cy + dy)
        halo = make(name + "_Halo", prism(circle(0.062, 40), 0.004), accent, grp)
        halo.location.z = 0.0015
        btn = make(name, prism(circle(0.050, 40), 0.026, bevel=0.010, seg=4, dish=0.003, dish_inset=0.016), button, grp)
        btn.location.z = 0.0045

    # ── Centre: touch panel, start/select, home ──
    panel = place(empty("Panel", root), 0, 0.205)
    make("Panel_Frame", prism(rounded_rect(0.40, 0.215, 0.035), 0.006), cyan, panel).location.z = 0.001
    make("Panel_Glass", prism(rounded_rect(0.386, 0.201, 0.030), 0.012, bevel=0.004, seg=2), glass, panel).location.z = 0.002
    for name, sx in (("Select", -0.285), ("Start", 0.285)):
        pill = place(make(name, prism(rounded_rect(0.085, 0.034, 0.0165, n=6), 0.014, bevel=0.005, seg=2), button, root), sx, 0.275)
        pill.rotation_euler.rotate_axis("Z", math.radians(-28 if sx > 0 else 28))
    home = place(empty("Home_Base", root), 0, -0.075)
    make("Home_Halo", prism(circle(0.049, 40), 0.004), green, home).location.z = 0.0015
    make("Home", prism(circle(0.039, 36), 0.016, bevel=0.007, seg=3), button, home).location.z = 0.004

    # ── Shoulders: bumpers and triggers, plus a light bar across the back ──
    for name, sx in (("Bumper_L", -1), ("Bumper_R", 1)):
        pts = rounded_rect(0.36, 0.105, 0.045)
        bumper = make(name, prism(pts, 0.070, bevel=0.022, seg=4), dark_m, root)
        bumper.location = (sx * 0.555, 0.385, 0.045)
        bumper.rotation_euler = (math.radians(-58), 0, math.radians(-sx * 13))
        trigger = make(name.replace("Bumper", "Trigger"), prism(rounded_rect(0.26, 0.15, 0.06), 0.060, bevel=0.024, seg=4), rubber, root)
        trigger.location = (sx * 0.565, 0.405, -0.075)
        trigger.rotation_euler = (math.radians(-98), 0, math.radians(-sx * 12))
    bar = make("LightBar", prism(rounded_rect(0.50, 0.030, 0.014, n=5), 0.022, bevel=0.006, seg=2), magenta, root)
    bar.location = (0, 0.452, 0.012)
    bar.rotation_euler = (math.radians(-90), 0, 0)

    # ── Grip accents: three short neon vents on each handle ──
    for sx in (-1, 1):
        for i in range(3):
            x, y = sx * (0.735 - i * 0.012), -0.30 - i * 0.075
            vent = place(make(f"Vent_{'L' if sx < 0 else 'R'}{i}", prism(rounded_rect(0.115 - i * 0.012, 0.016, 0.0075, n=4), 0.004), cyan if sx < 0 else magenta, root), x, y, sink=0.001)
            vent.rotation_euler.rotate_axis("Z", math.radians(sx * 12))

    tris = sum(len(p.vertices) - 2 for o in scene.objects if o.type == "MESH" for p in o.data.polygons)
    print(f"GAMEPAD objects={len(scene.objects)} triangles={tris}")

    out = arg("--out")
    if out:
        bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True, export_texcoords=False,
                                  export_yup=True, export_cameras=False, export_lights=False)
        print("GAMEPAD exported", out)

    preview = arg("--preview")
    if preview:
        render_preview(scene, preview)


def render_preview(scene, path):
    """Quick lit render to check the shape. Not used by the site."""
    world = bpy.data.worlds.new("w")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.012, 0.014, 0.03, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 1.0

    def light(loc, energy, color, size):
        data = bpy.data.lights.new("l", "AREA")
        data.energy, data.color, data.size = energy, color, size
        ob = bpy.data.objects.new("l", data)
        scene.collection.objects.link(ob)
        ob.location = loc
        ob.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()

    light((1.6, -1.2, 2.2), 260, (0.75, 0.9, 1.0), 2.0)
    light((-2.0, 1.0, 1.2), 160, (1.0, 0.35, 0.9), 2.0)
    light((0.0, -2.2, 0.4), 90, (0.5, 1.0, 1.0), 1.5)

    views = {"a": ((1.9, -3.1, 2.6), (0, -0.12, -0.05)), "b": ((0.0, -0.6, 4.6), (0, -0.12, 0)), "c": ((-3.4, -2.6, 0.9), (0, -0.12, -0.08))}
    cam_data = bpy.data.cameras.new("c")
    cam_data.lens = 60
    cam = bpy.data.objects.new("c", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y = 1100, 760
    try:
        scene.render.engine = "BLENDER_EEVEE"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.image_settings.file_format = "PNG"
    for key, (loc, target) in views.items():
        cam.location = loc
        cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = path.replace(".png", f"_{key}.png")
        bpy.ops.render.render(write_still=True)
        print("GAMEPAD preview", scene.render.filepath)


main()
