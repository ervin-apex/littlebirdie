"""Create the reference-driven Birdee production blockout in Blender.

Imports the Tripo 10K quad FBX, preserves its textures, adds the missing
cartoon feet as isolated objects, extends the beak, saves a Blender working
file, and renders front/side/three-quarter quality-control images.
"""

from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(r"F:\Little Birdie")
SOURCE = (
    ROOT
    / r"design\3d\birdee\production-v2\source\fbx"
    / "tripo_convert_0abf0b57-e264-42dd-9267-a9684052c6ad.fbx"
)
OUTPUT_DIR = ROOT / r"design\3d\birdee\production-v2"
QC_DIR = OUTPUT_DIR / "qc"
BLEND_PATH = OUTPUT_DIR / "birdee-production-v2.blend"


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def make_material(name: str, color: tuple[float, float, float, float], roughness: float):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    principled = material.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = color
    principled.inputs["Roughness"].default_value = roughness
    principled.inputs["Metallic"].default_value = 0.0
    principled.inputs["Specular IOR Level"].default_value = 0.25
    return material


def smooth_object(obj: bpy.types.Object) -> None:
    if obj.type != "MESH":
        return
    for polygon in obj.data.polygons:
        polygon.use_smooth = True


def capsule_between(
    name: str,
    start: tuple[float, float, float],
    end: tuple[float, float, float],
    radius: float,
    material: bpy.types.Material,
) -> bpy.types.Object:
    start_vec = Vector(start)
    end_vec = Vector(end)
    direction = end_vec - start_vec
    length = direction.length
    midpoint = (start_vec + end_vec) * 0.5

    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=16,
        ring_count=8,
        location=midpoint,
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (radius, radius, length * 0.5)
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = direction.to_track_quat("Z", "Y")
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    smooth_object(obj)
    return obj


def tapered_toe_between(
    name: str,
    start: tuple[float, float, float],
    end: tuple[float, float, float],
    base_radius: float,
    tip_radius: float,
    material: bpy.types.Material,
) -> bpy.types.Object:
    start_vec = Vector(start)
    end_vec = Vector(end)
    direction = end_vec - start_vec
    midpoint = (start_vec + end_vec) * 0.5
    bpy.ops.mesh.primitive_cone_add(
        vertices=16,
        radius1=base_radius,
        radius2=tip_radius,
        depth=direction.length,
        location=midpoint,
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = direction.to_track_quat("Z", "Y")
    obj.data.materials.append(material)
    smooth_object(obj)
    return obj


def create_unified_foot(
    side: str,
    sign: float,
    material: bpy.types.Material,
) -> bpy.types.Object:
    """Create one continuous, rounded ankle-and-toes mesh with a Skin modifier."""
    x = 0.102 * sign
    vertices = [
        (x, -0.115, 0.192),  # ankle, partly inside the belly
        (x, -0.122, 0.137),  # compact palm directly below it
        (x - 0.018 * sign, -0.154, 0.116),
        (x - 0.028 * sign, -0.193, 0.101),
        (x, -0.160, 0.111),
        (x, -0.205, 0.095),
        (x + 0.026 * sign, -0.150, 0.120),
        (x + 0.043 * sign, -0.188, 0.105),
    ]
    edges = [
        (0, 1),
        (1, 2),
        (2, 3),
        (1, 4),
        (4, 5),
        (1, 6),
        (6, 7),
    ]
    mesh = bpy.data.meshes.new(f"Foot.{side}.Mesh")
    mesh.from_pydata(vertices, edges, [])
    mesh.update()
    foot = bpy.data.objects.new(f"Foot.{side}", mesh)
    bpy.context.collection.objects.link(foot)
    foot.data.materials.append(material)

    skin = foot.modifiers.new("Rounded_Foot", "SKIN")
    bpy.context.view_layer.objects.active = foot
    foot.select_set(True)
    bpy.context.view_layer.update()
    radii = [
        (0.019, 0.019),
        (0.024, 0.022),
        (0.016, 0.014),
        (0.007, 0.006),
        (0.017, 0.015),
        (0.007, 0.006),
        (0.016, 0.014),
        (0.007, 0.006),
    ]
    skin_vertices = mesh.skin_vertices[0].data
    for index, radius in enumerate(radii):
        skin_vertices[index].radius = radius
    skin_vertices[0].use_root = True

    subdivision = foot.modifiers.new("Foot_Soften", "SUBSURF")
    subdivision.subdivision_type = "CATMULL_CLARK"
    subdivision.levels = 2
    subdivision.render_levels = 2
    bpy.ops.object.modifier_apply(modifier=skin.name)
    bpy.ops.object.modifier_apply(modifier=subdivision.name)
    smooth_object(foot)
    foot.select_set(False)
    return foot


def create_feet(material: bpy.types.Material) -> list[bpy.types.Object]:
    return [
        create_unified_foot("L", -1.0, material),
        create_unified_foot("R", 1.0, material),
    ]


def reshape_original_beak(body: bpy.types.Object) -> int:
    """Lengthen only the existing beak tip, preserving its texture and seam."""
    pivot_y = -0.270
    selected = 0
    for vertex in body.data.vertices:
        point = vertex.co
        if (
            point.y < pivot_y
            and 0.515 < point.z < 0.635
            and abs(point.x) < 0.090
        ):
            point.y = pivot_y + (point.y - pivot_y) * 2.55
            selected += 1
    body.data.update()
    if selected < 100:
        raise RuntimeError(f"Beak vertex selection was unexpectedly small: {selected}")
    return selected


def configure_body_material(body: bpy.types.Object) -> None:
    material = body.data.materials[0]
    material.name = "Birdee_Golden_Matte"
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    principled = nodes.get("Principled BSDF")
    if principled is None:
        raise RuntimeError("Tripo material has no Principled BSDF node")

    base_link = next((link for link in links if link.to_node == principled and link.to_socket.name == "Base Color"), None)
    if base_link is None:
        raise RuntimeError("Tripo material has no base-color texture link")

    color_source_node = base_link.from_node
    color_source_socket = base_link.from_socket
    links.remove(base_link)
    saturation = nodes.new("ShaderNodeHueSaturation")
    saturation.name = "Birdee_Gold_Correction"
    saturation.inputs["Hue"].default_value = 0.48
    saturation.inputs["Saturation"].default_value = 1.12
    saturation.inputs["Value"].default_value = 0.87
    links.new(color_source_socket, saturation.inputs["Color"])
    links.new(saturation.outputs["Color"], principled.inputs["Base Color"])

    for socket_name in ("Normal", "Metallic"):
        for link in list(links):
            if link.to_node == principled and link.to_socket.name == socket_name:
                links.remove(link)
    principled.inputs["Metallic"].default_value = 0.0
    principled.inputs["Roughness"].default_value = 0.80
    principled.inputs["Specular IOR Level"].default_value = 0.22


def look_at(obj: bpy.types.Object, target: tuple[float, float, float]) -> None:
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_lighting() -> None:
    world = bpy.context.scene.world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (
        0.040,
        0.045,
        0.055,
        1.0,
    )
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.60

    def area(name: str, location, energy: float, size: float, color) -> None:
        data = bpy.data.lights.new(name, "AREA")
        data.energy = energy
        data.shape = "DISK"
        data.size = size
        data.color = color
        obj = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(obj)
        obj.location = location
        look_at(obj, (0.0, 0.0, 0.48))

    area("Key", (-2.0, -2.4, 3.0), 160.0, 3.0, (1.0, 0.90, 0.76))
    area("Fill", (2.4, -1.0, 1.6), 185.0, 2.5, (0.82, 0.90, 1.0))
    area("Rim", (0.4, 2.0, 2.5), 105.0, 2.0, (1.0, 0.78, 0.48))


def add_floor() -> None:
    floor_material = make_material("QC_Floor", (0.08, 0.095, 0.12, 1.0), 0.9)
    bpy.ops.mesh.primitive_plane_add(size=20.0, location=(0.0, 0.0, -0.035))
    floor = bpy.context.active_object
    floor.name = "QC_Floor"
    floor.data.materials.append(floor_material)


def setup_camera() -> bpy.types.Object:
    data = bpy.data.cameras.new("QC_Camera")
    data.type = "ORTHO"
    data.ortho_scale = 1.28
    camera = bpy.data.objects.new("QC_Camera", data)
    bpy.context.collection.objects.link(camera)
    bpy.context.scene.camera = camera
    return camera


def render_qc(camera: bpy.types.Object) -> None:
    QC_DIR.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 640
    scene.render.resolution_y = 640
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"

    views = {
        "front": ((0.0, -3.2, 0.54), (0.0, 0.0, 0.49)),
        "side": ((3.0, 0.0, 0.54), (0.0, 0.0, 0.49)),
        "three-quarter": ((2.25, -2.55, 1.05), (0.0, 0.0, 0.47)),
    }
    for name, (location, target) in views.items():
        camera.location = location
        look_at(camera, target)
        scene.render.filepath = str(QC_DIR / f"{name}.png")
        bpy.ops.render.render(write_still=True)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    clear_scene()
    bpy.ops.import_scene.fbx(filepath=str(SOURCE), use_image_search=True)

    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if len(meshes) != 1:
        raise RuntimeError(f"Expected one Tripo mesh, found {[obj.name for obj in meshes]}")
    body = meshes[0]
    body.name = "Birdee_Body_10K"
    body.data.name = "Birdee_Body_10K_Mesh"
    smooth_object(body)
    configure_body_material(body)
    beak_vertex_count = reshape_original_beak(body)

    feet_material = make_material("Birdee_Feet", (0.56, 0.17, 0.012, 1.0), 0.86)
    create_feet(feet_material)

    add_floor()
    add_lighting()
    camera = setup_camera()

    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    render_qc(camera)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))

    print(f"Saved: {BLEND_PATH}")
    print(f"Body faces: {len(body.data.polygons)}")
    print(f"Foot objects: {len([o for o in bpy.data.objects if o.name.startswith('Foot.')])}")
    print(f"Beak vertices reshaped: {beak_vertex_count}")


if __name__ == "__main__":
    main()
