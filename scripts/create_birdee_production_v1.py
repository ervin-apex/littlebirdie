"""Build the first clean production Birdee checkpoint in Blender 5.2.

This intentionally does not modify the Tripo-derived prototype. It creates a
new neutral model, a production-oriented skeleton, and rendered quality-control
views for the first approval gate.

Run with:
    blender.exe --background --python create_birdee_production_v1.py
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Iterable

import bpy
from mathutils import Vector


ROOT = Path(r"F:\Little Birdie")
PRODUCTION_DIR = ROOT / "design" / "3d" / "birdee" / "production-v1"
QC_DIR = PRODUCTION_DIR / "qc"
BLEND_PATH = PRODUCTION_DIR / "birdee-production-neutral-v1.blend"

SUNFLOWER = (0.92, 0.32, 0.012, 1.0)
WARM_GOLD = (1.0, 0.46, 0.025, 1.0)
MUTED_GOLD = (0.76, 0.19, 0.008, 1.0)
BUTTER = (1.0, 0.60, 0.13, 1.0)
DEEP_INK = (0.018, 0.045, 0.095, 1.0)
EYE_WHITE = (0.98, 0.965, 0.91, 1.0)
HIGHLIGHT = (1.0, 1.0, 1.0, 1.0)
CLAY = (0.82, 0.82, 0.79, 1.0)
BACKGROUND = (0.965, 0.95, 0.92, 1.0)


def clear_scene() -> None:
    bpy.ops.object.mode_set(mode="OBJECT") if bpy.context.object and bpy.context.object.mode != "OBJECT" else None
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.metaballs,
        bpy.data.armatures,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
    ):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def make_material(
    name: str,
    color: tuple[float, float, float, float],
    *,
    roughness: float = 0.58,
    specular: float = 0.28,
) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = specular
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.025
    return material


def smooth_object(obj: bpy.types.Object) -> None:
    if obj.type != "MESH":
        return
    for polygon in obj.data.polygons:
        polygon.use_smooth = True


def add_uv_sphere(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material: bpy.types.Material,
    *,
    segments: int = 48,
    rings: int = 32,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments,
        ring_count=rings,
        location=location,
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    smooth_object(obj)
    return obj


def add_body(material: bpy.types.Material) -> bpy.types.Object:
    metaball_data = bpy.data.metaballs.new("Birdee_Body_Field")
    metaball_data.resolution = 0.052
    metaball_data.render_resolution = 0.038
    body_field = bpy.data.objects.new("Birdee_Body_Field", metaball_data)
    bpy.context.collection.objects.link(body_field)
    body_field.scale = (1.04, 0.86, 1.0)

    for co, radius, stiffness in (
        ((0.0, 0.0, -0.10), 0.67, 2.2),
        ((0.0, 0.0, 0.36), 0.70, 2.15),
        ((0.0, -0.015, 0.82), 0.54, 2.05),
        ((0.0, -0.035, 1.19), 0.64, 2.15),
        ((0.0, -0.045, 1.45), 0.64, 2.2),
    ):
        element = metaball_data.elements.new()
        element.co = co
        element.radius = radius
        element.stiffness = stiffness

    bpy.context.view_layer.objects.active = body_field
    body_field.select_set(True)
    bpy.ops.object.convert(target="MESH")
    body = bpy.context.object
    body.name = "Birdee_Body"
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    body.data.materials.append(material)
    smooth_object(body)

    smooth = body.modifiers.new("Production surface smoothing", "LAPLACIANSMOOTH")
    smooth.iterations = 3
    smooth.lambda_factor = 0.18
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    return body


def add_feather(
    name: str,
    root: tuple[float, float, float],
    tip: tuple[float, float, float],
    width: float,
    thickness: float,
    material: bpy.types.Material,
    *,
    curve: float = 0.04,
    length_steps: int = 12,
    radial_steps: int = 10,
) -> bpy.types.Object:
    root_v = Vector(root)
    tip_v = Vector(tip)
    direction = tip_v - root_v
    length = direction.length

    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, int, int, int]] = []
    for longitudinal in range(length_steps + 1):
        t = longitudinal / length_steps
        envelope = max(0.015, math.sin(math.pi * t) ** 0.58)
        half_width = width * envelope * (1.0 - 0.12 * t)
        half_depth = thickness * (0.18 + 0.82 * envelope)
        center_z = curve * math.sin(math.pi * t)
        for radial in range(radial_steps):
            theta = 2.0 * math.pi * radial / radial_steps
            vertices.append(
                (
                    length * t,
                    half_depth * math.cos(theta),
                    center_z + half_width * math.sin(theta),
                )
            )

    for longitudinal in range(length_steps):
        current = longitudinal * radial_steps
        nxt = (longitudinal + 1) * radial_steps
        for radial in range(radial_steps):
            following = (radial + 1) % radial_steps
            faces.append((current + radial, current + following, nxt + following, nxt + radial))

    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    feather = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(feather)
    feather.location = root_v
    feather.rotation_mode = "QUATERNION"
    feather.rotation_quaternion = Vector((1.0, 0.0, 0.0)).rotation_difference(direction.normalized())
    feather.data.materials.append(material)
    smooth_object(feather)

    bevel = feather.modifiers.new("Soft feather edge", "BEVEL")
    bevel.width = min(0.018, thickness * 0.22)
    bevel.segments = 2
    return feather


def add_beak(material: bpy.types.Material) -> tuple[bpy.types.Object, bpy.types.Object]:
    base = Vector((0.0, -0.49, 1.36))
    tip = Vector((0.0, -1.42, 1.32))
    axis = tip - base
    length = axis.length
    radial_steps = 24
    vertices = []
    faces = []
    for ring, (distance, radius_x, radius_z) in enumerate(
        ((0.0, 0.135, 0.105), (length * 0.38, 0.09, 0.07), (length, 0.008, 0.006))
    ):
        for index in range(radial_steps):
            theta = 2.0 * math.pi * index / radial_steps
            vertices.append((radius_x * math.cos(theta), -distance, radius_z * math.sin(theta)))
        if ring:
            prev = (ring - 1) * radial_steps
            current = ring * radial_steps
            for index in range(radial_steps):
                following = (index + 1) % radial_steps
                faces.append((prev + index, prev + following, current + following, current + index))
    mesh = bpy.data.meshes.new("Birdee_Beak_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    beak = bpy.data.objects.new("Birdee_Beak", mesh)
    bpy.context.collection.objects.link(beak)
    beak.location = base
    beak.data.materials.append(material)
    smooth_object(beak)

    beak_base = add_uv_sphere(
        "Birdee_Beak_Base",
        tuple(base),
        (0.145, 0.10, 0.115),
        material,
        segments=32,
        rings=20,
    )
    return beak, beak_base


def build_armature() -> bpy.types.Object:
    armature_data = bpy.data.armatures.new("Birdee_Production_Rig_Data")
    rig = bpy.data.objects.new("Birdee_Production_Rig", armature_data)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")

    specs = (
        ("Root_Control", (0, 0, -1.35), (0, 0, -0.95), None, False),
        ("Body", (0, 0, -0.9), (0, 0, 0.38), "Root_Control", True),
        ("Chest", (0, 0, 0.30), (0, 0, 0.92), "Body", True),
        ("Neck", (0, 0, 0.82), (0, 0, 1.22), "Chest", True),
        ("Head", (0, 0, 1.12), (0, 0, 1.62), "Neck", True),
        ("Wing.L.01", (-0.48, 0, 0.95), (-1.04, 0, 1.08), "Chest", False),
        ("Wing.L.02", (-1.04, 0, 1.08), (-1.62, 0, 1.22), "Wing.L.01", False),
        ("Wing.L.03", (-1.62, 0, 1.22), (-2.18, 0, 1.40), "Wing.L.02", False),
        ("Wing.R.01", (0.48, 0, 0.95), (1.04, 0, 1.08), "Chest", False),
        ("Wing.R.02", (1.04, 0, 1.08), (1.62, 0, 1.22), "Wing.R.01", False),
        ("Wing.R.03", (1.62, 0, 1.22), (2.18, 0, 1.40), "Wing.R.02", False),
        ("Tail.Center", (0, 0.08, -0.58), (0, 0.09, -1.28), "Body", False),
        ("Tail.L", (-0.08, 0.09, -0.58), (-0.45, 0.10, -1.18), "Body", False),
        ("Tail.R", (0.08, 0.09, -0.58), (0.45, 0.10, -1.18), "Body", False),
    )
    for name, head, tail, parent_name, deform in specs:
        bone = armature_data.edit_bones.new(name)
        bone.head = head
        bone.tail = tail
        bone.use_deform = deform
        if parent_name:
            bone.parent = armature_data.edit_bones[parent_name]

    bpy.ops.object.mode_set(mode="OBJECT")
    rig.show_in_front = True
    rig.display_type = "WIRE"
    return rig


def add_smooth_body_weights(obj: bpy.types.Object, rig: bpy.types.Object) -> None:
    groups = {
        name: obj.vertex_groups.new(name=name)
        for name in ("Body", "Chest", "Neck", "Head")
    }

    def smoothstep(start: float, end: float, value: float) -> float:
        t = max(0.0, min(1.0, (value - start) / (end - start)))
        return t * t * (3.0 - 2.0 * t)

    for vertex in obj.data.vertices:
        z = vertex.co.z
        if z < 0.28:
            weights = {"Body": 1.0}
        elif z < 0.64:
            chest = smoothstep(0.28, 0.64, z)
            weights = {"Body": 1.0 - chest, "Chest": chest}
        elif z < 0.78:
            weights = {"Chest": 1.0}
        elif z < 1.05:
            neck = smoothstep(0.78, 1.05, z)
            weights = {"Chest": 1.0 - neck, "Neck": neck}
        elif z < 1.17:
            weights = {"Neck": 1.0}
        elif z < 1.38:
            head = smoothstep(1.17, 1.38, z)
            weights = {"Neck": 1.0 - head, "Head": head}
        else:
            weights = {"Head": 1.0}

        for name, weight in weights.items():
            if weight > 1.0e-7:
                groups[name].add([vertex.index], weight, "REPLACE")

    modifier = obj.modifiers.new("Birdee production armature", "ARMATURE")
    modifier.object = rig
    modifier.use_deform_preserve_volume = True
    obj.parent = rig


def parent_to_bone(obj: bpy.types.Object, rig: bpy.types.Object, bone_name: str) -> None:
    world_matrix = obj.matrix_world.copy()
    obj.parent = rig
    obj.parent_type = "BONE"
    obj.parent_bone = bone_name
    obj.matrix_world = world_matrix


def add_eye_set(
    side: str,
    x: float,
    white_material: bpy.types.Material,
    ink_material: bpy.types.Material,
    highlight_material: bpy.types.Material,
) -> list[bpy.types.Object]:
    white = add_uv_sphere(
        f"Eye.White.{side}",
        (x, -0.400, 1.47),
        (0.198, 0.175, 0.235),
        white_material,
    )
    pupil = add_uv_sphere(
        f"Eye.Pupil.{side}",
        (x * 0.98, -0.575, 1.46),
        (0.106, 0.075, 0.143),
        ink_material,
        segments=40,
        rings=28,
    )
    highlight = add_uv_sphere(
        f"Eye.Highlight.{side}",
        (x - 0.030 * (1 if x > 0 else -1), -0.642, 1.515),
        (0.034, 0.023, 0.043),
        highlight_material,
        segments=24,
        rings=16,
    )
    return [white, pupil, highlight]


def build_character() -> dict[str, object]:
    materials = {
        "sunflower": make_material("Sunflower plumage", SUNFLOWER, roughness=0.64),
        "warm_gold": make_material("Warm gold plumage", WARM_GOLD, roughness=0.62),
        "muted_gold": make_material("Muted gold plumage", MUTED_GOLD, roughness=0.66),
        "butter": make_material("Butter belly", BUTTER, roughness=0.68),
        "ink": make_material("Deep ink", DEEP_INK, roughness=0.38, specular=0.36),
        "eye_white": make_material("Warm eye white", EYE_WHITE, roughness=0.38, specular=0.38),
        "highlight": make_material("Eye catchlight", HIGHLIGHT, roughness=0.20, specular=0.5),
        "ground": make_material("Warm neutral ground", BACKGROUND, roughness=0.9, specular=0.05),
    }

    body = add_body(materials["sunflower"])
    belly = add_uv_sphere(
        "Birdee_Belly_Patch",
        (0.0, -0.330, 0.18),
        (0.43, 0.195, 0.70),
        materials["butter"],
        segments=56,
        rings=36,
    )
    beak, beak_base = add_beak(materials["ink"])
    face_objects = [
        *add_eye_set("L", -0.245, materials["eye_white"], materials["ink"], materials["highlight"]),
        *add_eye_set("R", 0.245, materials["eye_white"], materials["ink"], materials["highlight"]),
        beak,
        beak_base,
    ]

    wing_objects: dict[str, list[bpy.types.Object]] = {"L": [], "R": []}
    for side, sign in (("L", -1.0), ("R", 1.0)):
        root_x = 0.47 * sign
        primary_tips = (
            (2.12 * sign, 0.08, 1.82),
            (2.30 * sign, 0.07, 1.56),
            (2.36 * sign, 0.06, 1.29),
            (2.26 * sign, 0.05, 1.02),
            (2.04 * sign, 0.04, 0.78),
        )
        for index, tip in enumerate(primary_tips):
            root = (root_x, 0.08 + index * 0.008, 1.02 - index * 0.025)
            feather = add_feather(
                f"Wing.{side}.Primary.{index + 1:02d}",
                root,
                tip,
                0.22 + index * 0.012,
                0.075,
                materials["warm_gold" if index % 2 == 0 else "sunflower"],
                curve=0.055,
            )
            wing_objects[side].append(feather)

        secondary_tips = (
            (1.58 * sign, -0.05, 1.45),
            (1.73 * sign, -0.07, 1.23),
            (1.69 * sign, -0.09, 1.01),
            (1.51 * sign, -0.11, 0.81),
        )
        for index, tip in enumerate(secondary_tips):
            root = (root_x * 1.03, -0.04 - index * 0.015, 1.01 - index * 0.025)
            feather = add_feather(
                f"Wing.{side}.Secondary.{index + 1:02d}",
                root,
                tip,
                0.245,
                0.082,
                materials["sunflower" if index % 2 == 0 else "muted_gold"],
                curve=0.045,
            )
            wing_objects[side].append(feather)

        covert_tips = (
            (1.19 * sign, -0.18, 1.28),
            (1.29 * sign, -0.20, 1.08),
            (1.17 * sign, -0.22, 0.89),
        )
        for index, tip in enumerate(covert_tips):
            root = (root_x * 0.98, -0.16, 1.02 - index * 0.03)
            feather = add_feather(
                f"Wing.{side}.Covert.{index + 1:02d}",
                root,
                tip,
                0.225,
                0.085,
                materials["muted_gold" if index == 2 else "warm_gold"],
                curve=0.035,
                length_steps=10,
            )
            wing_objects[side].append(feather)

        shoulder = add_uv_sphere(
            f"Wing.{side}.Shoulder",
            (0.54 * sign, -0.005, 1.00),
            (0.26, 0.18, 0.32),
            materials["sunflower"],
            segments=40,
            rings=28,
        )
        wing_objects[side].append(shoulder)

    tail_objects: list[bpy.types.Object] = []
    tail_specs = (
        ((0.0, 0.11, -0.50), (0.0, 0.14, -1.58), 0.19, "Tail.Center"),
        ((-0.06, 0.11, -0.49), (-0.34, 0.14, -1.43), 0.18, "Tail.L"),
        ((0.06, 0.11, -0.49), (0.34, 0.14, -1.43), 0.18, "Tail.R"),
        ((-0.10, 0.12, -0.45), (-0.58, 0.15, -1.25), 0.17, "Tail.L"),
        ((0.10, 0.12, -0.45), (0.58, 0.15, -1.25), 0.17, "Tail.R"),
    )
    for index, (root, tip, width, _) in enumerate(tail_specs):
        tail_objects.append(
            add_feather(
                f"Tail.Feather.{index + 1:02d}",
                root,
                tip,
                width,
                0.072,
                materials["warm_gold" if index % 2 == 0 else "sunflower"],
                curve=0.025,
                length_steps=11,
            )
        )

    rig = build_armature()
    add_smooth_body_weights(body, rig)
    add_smooth_body_weights(belly, rig)
    for obj in face_objects:
        parent_to_bone(obj, rig, "Head")

    for side in ("L", "R"):
        for obj in wing_objects[side]:
            if ".Primary." in obj.name:
                bone = f"Wing.{side}.03"
            elif ".Secondary." in obj.name:
                bone = f"Wing.{side}.02"
            else:
                bone = f"Wing.{side}.01"
            parent_to_bone(obj, rig, bone)

    for obj, (_, _, _, bone_name) in zip(tail_objects, tail_specs):
        parent_to_bone(obj, rig, bone_name)

    return {
        "rig": rig,
        "body": body,
        "belly": belly,
        "face_objects": face_objects,
        "wing_objects": wing_objects,
        "tail_objects": tail_objects,
        "materials": materials,
    }


def add_ground(material: bpy.types.Material) -> bpy.types.Object:
    bpy.ops.mesh.primitive_plane_add(size=14.0, location=(0.0, 0.0, -1.52))
    ground = bpy.context.object
    ground.name = "QC_Ground"
    ground.data.materials.append(material)
    return ground


def add_area_light(
    name: str,
    location: tuple[float, float, float],
    energy: float,
    size: float,
    color: tuple[float, float, float],
) -> bpy.types.Object:
    light_data = bpy.data.lights.new(name, "AREA")
    light_data.energy = energy
    light_data.shape = "DISK"
    light_data.size = size
    light_data.color = color
    light = bpy.data.objects.new(name, light_data)
    light.location = location
    bpy.context.collection.objects.link(light)
    light.rotation_euler = (math.radians(15), 0.0, math.radians(25))
    point_camera(light, Vector((0.0, 0.0, 0.3)))
    return light


def point_camera(obj: bpy.types.Object, target: Vector) -> None:
    direction = target - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def setup_render(materials: dict[str, bpy.types.Material]) -> bpy.types.Object:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 720
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "Standard"
    scene.world.color = BACKGROUND[:3]
    world = scene.world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = BACKGROUND
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.75

    add_area_light("Key softbox", (-3.8, -4.5, 6.0), 520.0, 4.5, (1.0, 0.83, 0.65))
    add_area_light("Fill softbox", (4.0, -3.0, 3.5), 340.0, 4.0, (0.72, 0.84, 1.0))
    add_area_light("Rim softbox", (1.0, 4.0, 5.0), 440.0, 3.5, (1.0, 0.76, 0.46))

    camera_data = bpy.data.cameras.new("QC_Camera")
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = 5.35
    camera = bpy.data.objects.new("QC_Camera", camera_data)
    bpy.context.collection.objects.link(camera)
    scene.camera = camera
    return camera


def reset_pose(rig: bpy.types.Object) -> None:
    for bone in rig.pose.bones:
        bone.location = (0.0, 0.0, 0.0)
        bone.rotation_mode = "XYZ"
        bone.rotation_euler = (0.0, 0.0, 0.0)
        bone.scale = (1.0, 1.0, 1.0)
    bpy.context.view_layer.update()


def apply_pose(rig: bpy.types.Object, rotations: dict[str, tuple[float, float, float]]) -> None:
    reset_pose(rig)
    for name, degrees in rotations.items():
        bone = rig.pose.bones[name]
        bone.rotation_mode = "XYZ"
        bone.rotation_euler = tuple(math.radians(value) for value in degrees)
    bpy.context.view_layer.update()


def render_view(
    camera: bpy.types.Object,
    filename: str,
    location: tuple[float, float, float],
    *,
    target: tuple[float, float, float] = (0.0, 0.0, 0.30),
) -> None:
    camera.location = location
    point_camera(camera, Vector(target))
    bpy.context.scene.render.filepath = str(QC_DIR / filename)
    bpy.ops.render.render(write_still=True)


def evaluated_world_vertices(obj: bpy.types.Object) -> list[Vector]:
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(depsgraph)
    evaluated_mesh = evaluated.to_mesh()
    try:
        return [evaluated.matrix_world @ vertex.co for vertex in evaluated_mesh.vertices]
    finally:
        evaluated.to_mesh_clear()


def deformation_report(
    obj: bpy.types.Object,
    rig: bpy.types.Object,
    poses: dict[str, dict[str, tuple[float, float, float]]],
) -> dict[str, dict[str, float | int]]:
    reset_pose(rig)
    rest_vertices = evaluated_world_vertices(obj)
    edges = [tuple(edge.vertices) for edge in obj.data.edges]
    rest_lengths = [
        max((rest_vertices[second] - rest_vertices[first]).length, 1.0e-8)
        for first, second in edges
    ]
    results: dict[str, dict[str, float | int]] = {}
    for pose_name, rotations in poses.items():
        apply_pose(rig, rotations)
        posed_vertices = evaluated_world_vertices(obj)
        ratios = [
            (posed_vertices[second] - posed_vertices[first]).length / rest_length
            for (first, second), rest_length in zip(edges, rest_lengths)
        ]
        results[pose_name] = {
            "max_edge_stretch": round(max(ratios), 5),
            "min_edge_ratio": round(min(ratios), 5),
            "edges_over_1_5x": sum(ratio > 1.5 for ratio in ratios),
            "edges_under_0_65x": sum(ratio < 0.65 for ratio in ratios),
        }
    reset_pose(rig)
    return results


def validate_model(character: dict[str, object]) -> dict[str, object]:
    body = character["body"]
    belly = character["belly"]
    rig = character["rig"]
    report: dict[str, object] = {
        "body_vertices": len(body.data.vertices),
        "body_polygons": len(body.data.polygons),
        "body_connected_components": connected_component_count(body.data),
        "body_shape_keys": list(body.data.shape_keys.key_blocks) if body.data.shape_keys else [],
        "belly_vertices": len(belly.data.vertices),
        "bones": [bone.name for bone in rig.data.bones],
        "wing_objects": sum(len(items) for items in character["wing_objects"].values()),
        "tail_objects": len(character["tail_objects"]),
        "face_objects": [obj.name for obj in character["face_objects"]],
        "materials": list(character["materials"]),
    }

    stress_poses = {
        "head_tilt": {
            "Neck": (0.0, 0.0, -5.0),
            "Head": (0.0, 0.0, -11.0),
            "Chest": (0.0, 0.0, -2.0),
        },
        "forward_settle": {
            "Chest": (6.0, 0.0, 0.0),
            "Neck": (5.0, 0.0, 2.5),
            "Head": (4.0, 0.0, 2.0),
        },
        "counter_tilt": {
            "Chest": (0.0, 0.0, 2.0),
            "Neck": (0.0, 0.0, 6.0),
            "Head": (0.0, 0.0, 10.0),
        },
    }
    report["body_deformation"] = deformation_report(body, rig, stress_poses)
    report["belly_deformation"] = deformation_report(belly, rig, stress_poses)

    for obj in (body, belly):
        unweighted = 0
        non_normalized = 0
        max_influences = 0
        for vertex in obj.data.vertices:
            weights = [membership.weight for membership in vertex.groups if membership.weight > 1.0e-8]
            total = sum(weights)
            unweighted += int(total <= 1.0e-8)
            non_normalized += int(abs(total - 1.0) > 1.0e-5)
            max_influences = max(max_influences, len(weights))
        report[f"{obj.name}_weights"] = {
            "unweighted": unweighted,
            "non_normalized": non_normalized,
            "max_influences": max_influences,
        }
    return report


def connected_component_count(mesh: bpy.types.Mesh) -> int:
    adjacency: list[list[int]] = [[] for _ in mesh.vertices]
    for edge in mesh.edges:
        first, second = edge.vertices
        adjacency[first].append(second)
        adjacency[second].append(first)
    seen: set[int] = set()
    components = 0
    for start in range(len(mesh.vertices)):
        if start in seen:
            continue
        components += 1
        stack = [start]
        seen.add(start)
        while stack:
            current = stack.pop()
            for neighbor in adjacency[current]:
                if neighbor not in seen:
                    seen.add(neighbor)
                    stack.append(neighbor)
    return components


def hide_qc_helpers_for_save() -> None:
    for obj in bpy.context.scene.objects:
        if obj.name.startswith("QC_") or obj.name.endswith("softbox"):
            obj.hide_viewport = True
            obj.hide_render = True


def main() -> None:
    QC_DIR.mkdir(parents=True, exist_ok=True)
    clear_scene()
    character = build_character()
    camera = setup_render(character["materials"])
    rig = character["rig"]

    reset_pose(rig)
    render_view(camera, "neutral-front.png", (0.0, -7.5, 0.55))
    render_view(camera, "neutral-three-quarter.png", (4.3, -7.2, 1.15))
    render_view(camera, "neutral-side.png", (7.5, 0.0, 0.55))
    render_view(camera, "neutral-back.png", (0.0, 7.5, 0.55))

    apply_pose(
        rig,
        {
            "Neck": (0.0, 0.0, -5.0),
            "Head": (0.0, 0.0, -11.0),
            "Chest": (0.0, 0.0, -2.0),
        },
    )
    render_view(camera, "stress-head-tilt.png", (0.0, -7.5, 0.55))

    apply_pose(
        rig,
        {
            "Wing.L.01": (0.0, 0.0, 26.0),
            "Wing.R.01": (0.0, 0.0, -26.0),
            "Wing.L.02": (0.0, 0.0, 18.0),
            "Wing.R.02": (0.0, 0.0, -18.0),
        },
    )
    render_view(camera, "stress-wing-fold.png", (0.0, -7.5, 0.55))

    apply_pose(
        rig,
        {
            "Wing.L.01": (0.0, 0.0, -19.0),
            "Wing.R.01": (0.0, 0.0, 19.0),
            "Wing.L.02": (0.0, 0.0, -14.0),
            "Wing.R.02": (0.0, 0.0, 14.0),
            "Tail.L": (0.0, 15.0, -12.0),
            "Tail.R": (0.0, -15.0, 12.0),
        },
    )
    render_view(camera, "stress-wing-open.png", (0.0, -7.5, 0.55))

    reset_pose(rig)
    report = validate_model(character)
    hide_qc_helpers_for_save()
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH), compress=True)
    print("BIRDEE_PRODUCTION_V1=" + json.dumps(report, sort_keys=True))


if __name__ == "__main__":
    main()
