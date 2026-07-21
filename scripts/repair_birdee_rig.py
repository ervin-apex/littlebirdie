"""Rebuild Birdee's broken Tripo skin as a deterministic avian rig.

Run with Blender:
    blender.exe birdee-smartmesh-rigged-v1.blend --background \
        --python repair_birdee_rig.py

The source file is never overwritten. The script writes a v2 .blend and .glb,
then prints a JSON validation summary prefixed with BIRDEE_REPAIR_SUMMARY=.
"""

from __future__ import annotations

import json
import math
from collections import defaultdict, deque
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


EXPORT_DIR = Path(r"F:\Little Birdie\design\3d\birdee\exports")
OUTPUT_BLEND = EXPORT_DIR / "birdee-smartmesh-rigged-v2.blend"
OUTPUT_GLB = EXPORT_DIR / "birdee-smartmesh-rigged-v2.glb"


BONES = (
    # name, head, tail, parent, connected, deform
    ("Root_Control", (0.0, 0.0, 0.0), (0.0, 0.0, 0.05), None, False, False),
    ("Body", (0.0, 0.0, 0.05), (0.0, 0.0, 0.28), "Root_Control", True, True),
    ("Chest", (0.0, 0.0, 0.28), (0.0, -0.01, 0.40), "Body", True, True),
    ("Neck", (0.0, -0.01, 0.40), (0.0, -0.04, 0.48), "Chest", True, True),
    ("Head", (0.0, -0.04, 0.48), (0.0, -0.17, 0.58), "Neck", True, True),
    ("Wing.L.01", (0.08, 0.04, 0.36), (0.22, 0.13, 0.41), "Chest", False, True),
    ("Wing.L.02", (0.22, 0.13, 0.41), (0.36, 0.26, 0.49), "Wing.L.01", True, True),
    ("Wing.L.03", (0.36, 0.26, 0.49), (0.50, 0.40, 0.57), "Wing.L.02", True, True),
    ("Wing.R.01", (-0.08, 0.04, 0.36), (-0.22, 0.13, 0.41), "Chest", False, True),
    ("Wing.R.02", (-0.22, 0.13, 0.41), (-0.36, 0.26, 0.49), "Wing.R.01", True, True),
    ("Wing.R.03", (-0.36, 0.26, 0.49), (-0.50, 0.40, 0.57), "Wing.R.02", True, True),
    ("Tail.Center", (0.0, 0.05, 0.13), (0.0, 0.18, -0.10), "Body", False, True),
    ("Tail.L", (0.0, 0.08, 0.09), (0.15, 0.19, -0.08), "Tail.Center", False, True),
    ("Tail.R", (0.0, 0.08, 0.09), (-0.15, 0.19, -0.08), "Tail.Center", False, True),
)

DEFORM_BONES = tuple(spec[0] for spec in BONES if spec[5])


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def blend(a: str, b: str, t: float) -> dict[str, float]:
    t = clamp(t)
    if t <= 1.0e-6:
        return {a: 1.0}
    if t >= 1.0 - 1.0e-6:
        return {b: 1.0}
    return {a: 1.0 - t, b: t}


def select_only(obj: bpy.types.Object) -> None:
    bpy.ops.object.mode_set(mode="OBJECT") if bpy.context.object and bpy.context.object.mode != "OBJECT" else None
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def find_main_mesh() -> bpy.types.Object:
    meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError("No mesh object found in the source Blender file")
    return max(meshes, key=lambda obj: len(obj.data.vertices))


def strip_broken_rig(mesh_obj: bpy.types.Object) -> dict[str, object]:
    helper_meshes = [obj for obj in bpy.data.objects if obj.type == "MESH" and obj != mesh_obj]
    old_armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
    helper_names = [obj.name for obj in helper_meshes]
    armature_names = [obj.name for obj in old_armatures]

    world_matrix = mesh_obj.matrix_world.copy()
    mesh_obj.parent = None
    mesh_obj.matrix_world = world_matrix

    for modifier in list(mesh_obj.modifiers):
        if modifier.type == "ARMATURE":
            mesh_obj.modifiers.remove(modifier)
    for group in list(mesh_obj.vertex_groups):
        mesh_obj.vertex_groups.remove(group)

    for obj in helper_meshes + old_armatures:
        bpy.data.objects.remove(obj, do_unlink=True)

    mesh_obj.name = "Birdee_Mesh_v2"
    mesh_obj.data.name = "Birdee_Mesh_v2"
    return {
        "removed_helper_meshes": helper_names,
        "removed_armatures": armature_names,
    }


def build_armature() -> bpy.types.Object:
    armature_data = bpy.data.armatures.new("Birdee_Armature_v2")
    armature_obj = bpy.data.objects.new("Birdee_Rig_v2", armature_data)
    bpy.context.scene.collection.objects.link(armature_obj)
    armature_obj.show_in_front = True
    armature_obj.display_type = "WIRE"

    select_only(armature_obj)
    bpy.ops.object.mode_set(mode="EDIT")
    created: dict[str, bpy.types.EditBone] = {}
    for name, head, tail, parent_name, connected, deform in BONES:
        bone = armature_data.edit_bones.new(name)
        bone.head = head
        bone.tail = tail
        bone.use_deform = deform
        if parent_name:
            bone.parent = created[parent_name]
            bone.use_connect = connected
        created[name] = bone
    bpy.ops.object.mode_set(mode="OBJECT")

    armature_obj["rig_version"] = "Birdee deterministic avian rig v2"
    armature_obj["rig_notes"] = (
        "Rebuilt from the malformed Tripo skin. Symmetric wings; rigid feather-island weights; "
        "maximum two influences per vertex."
    )
    return armature_obj


def connected_components(mesh: bpy.types.Mesh) -> list[list[int]]:
    adjacency: dict[int, list[int]] = defaultdict(list)
    for edge in mesh.edges:
        a, b = edge.vertices
        adjacency[a].append(b)
        adjacency[b].append(a)

    unseen = set(range(len(mesh.vertices)))
    components: list[list[int]] = []
    while unseen:
        seed = unseen.pop()
        queue = deque([seed])
        component = [seed]
        while queue:
            current = queue.popleft()
            for neighbor in adjacency[current]:
                if neighbor in unseen:
                    unseen.remove(neighbor)
                    queue.append(neighbor)
                    component.append(neighbor)
        components.append(component)
    return components


def component_stats(mesh: bpy.types.Mesh, indices: list[int]) -> dict[str, object]:
    coords = [mesh.vertices[index].co for index in indices]
    centroid = sum(coords, Vector()) / len(coords)
    minimum = Vector((min(v.x for v in coords), min(v.y for v in coords), min(v.z for v in coords)))
    maximum = Vector((max(v.x for v in coords), max(v.y for v in coords), max(v.z for v in coords)))
    return {"centroid": centroid, "min": minimum, "max": maximum}


def wing_weights(abs_x: float, side: str) -> dict[str, float]:
    root = f"Wing.{side}.01"
    middle = f"Wing.{side}.02"
    tip = f"Wing.{side}.03"
    if abs_x <= 0.18:
        return {root: 1.0}
    if abs_x < 0.27:
        return blend(root, middle, (abs_x - 0.18) / 0.09)
    if abs_x <= 0.35:
        return {middle: 1.0}
    if abs_x < 0.44:
        return blend(middle, tip, (abs_x - 0.35) / 0.09)
    return {tip: 1.0}


def torso_weights(position: Vector) -> dict[str, float]:
    z = position.z
    y = position.y

    # Blend the continuous body shell only across narrow anatomical bands.
    if z >= 0.42:
        return {"Head": 1.0}
    if z >= 0.36:
        return blend("Neck", "Head", (z - 0.36) / 0.06)
    if z >= 0.29:
        return blend("Chest", "Neck", (z - 0.29) / 0.07)
    if z >= 0.16:
        return blend("Body", "Chest", (z - 0.16) / 0.13)

    # The underside stays with the body; the rear low section can flex with the
    # center tail without leaving isolated vertices behind.
    if y > 0.03 and z < 0.13:
        tail_amount = clamp(((0.13 - z) / 0.16) * clamp((y - 0.03) / 0.10))
        return blend("Body", "Tail.Center", tail_amount)
    return {"Body": 1.0}


def make_weights(mesh_obj: bpy.types.Object) -> dict[str, object]:
    mesh = mesh_obj.data
    components = connected_components(mesh)
    groups = {name: mesh_obj.vertex_groups.new(name=name) for name in DEFORM_BONES}
    weights_by_vertex: list[dict[str, float]] = [{} for _ in mesh.vertices]
    region_counts = defaultdict(int)

    for component in components:
        stats = component_stats(mesh, component)
        center: Vector = stats["centroid"]
        minimum: Vector = stats["min"]
        maximum: Vector = stats["max"]
        max_abs_x = max(abs(minimum.x), abs(maximum.x))

        is_wing = max_abs_x > 0.20 and maximum.z > 0.20 and center.y > -0.10
        is_tail = maximum.z < 0.18 and center.y > 0.02 and max_abs_x < 0.24
        is_head_piece = minimum.y < -0.08 and maximum.z > 0.34 and max_abs_x < 0.24

        if is_wing:
            region_counts["wing"] += len(component)
            # Large connected wing shells get smooth two-bone bands. Tiny
            # feather islands stay rigid to prevent the Tripo-style spikes.
            if len(component) >= 80 or (minimum.x < -0.08 and maximum.x > 0.08):
                for index in component:
                    position = mesh.vertices[index].co
                    side = "L" if position.x >= 0.0 else "R"
                    weights_by_vertex[index] = wing_weights(abs(position.x), side)
            else:
                side = "L" if center.x >= 0.0 else "R"
                rigid = max(wing_weights(abs(center.x), side), key=wing_weights(abs(center.x), side).get)
                for index in component:
                    weights_by_vertex[index] = {rigid: 1.0}
        elif is_tail:
            region_counts["tail"] += len(component)
            if abs(center.x) < 0.035:
                target = "Tail.Center"
            else:
                target = "Tail.L" if center.x >= 0.0 else "Tail.R"
            for index in component:
                weights_by_vertex[index] = {target: 1.0}
        elif is_head_piece:
            region_counts["head_accessory"] += len(component)
            for index in component:
                weights_by_vertex[index] = {"Head": 1.0}
        else:
            region_counts["torso"] += len(component)
            for index in component:
                weights_by_vertex[index] = torso_weights(mesh.vertices[index].co)

    group_totals = defaultdict(int)
    max_influences = 0
    for index, weights in enumerate(weights_by_vertex):
        total = sum(weights.values())
        if total <= 1.0e-8:
            raise RuntimeError(f"Vertex {index} has no assigned weight")
        normalized = {name: value / total for name, value in weights.items() if value > 1.0e-8}
        max_influences = max(max_influences, len(normalized))
        for name, value in normalized.items():
            groups[name].add([index], value, "REPLACE")
            group_totals[name] += 1

    return {
        "components": len(components),
        "vertices": len(mesh.vertices),
        "region_vertex_counts": dict(sorted(region_counts.items())),
        "group_vertex_counts": dict(sorted(group_totals.items())),
        "max_influences_per_vertex": max_influences,
    }


def bind_mesh(mesh_obj: bpy.types.Object, rig_obj: bpy.types.Object) -> None:
    world_matrix = mesh_obj.matrix_world.copy()
    mesh_obj.parent = rig_obj
    mesh_obj.matrix_world = world_matrix
    modifier = mesh_obj.modifiers.new(name="Birdee Armature", type="ARMATURE")
    modifier.object = rig_obj
    modifier.use_deform_preserve_volume = True
    mesh_obj["skin_version"] = "Deterministic v2 weights"


def reset_pose(rig_obj: bpy.types.Object) -> None:
    rig_obj.location = (0.0, 0.0, 0.0)
    rig_obj.rotation_euler = (0.0, 0.0, 0.0)
    rig_obj.scale = (1.0, 1.0, 1.0)
    for pose_bone in rig_obj.pose.bones:
        pose_bone.location = (0.0, 0.0, 0.0)
        pose_bone.rotation_mode = "XYZ"
        pose_bone.rotation_euler = (0.0, 0.0, 0.0)
        pose_bone.scale = (1.0, 1.0, 1.0)
    bpy.context.view_layer.update()


def evaluated_world_vertices(mesh_obj: bpy.types.Object) -> list[Vector]:
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated_obj = mesh_obj.evaluated_get(depsgraph)
    evaluated_mesh = evaluated_obj.to_mesh()
    try:
        return [evaluated_obj.matrix_world @ vertex.co for vertex in evaluated_mesh.vertices]
    finally:
        evaluated_obj.to_mesh_clear()


def edge_stretch(mesh: bpy.types.Mesh, rest: list[Vector], posed: list[Vector]) -> dict[str, float | int]:
    maximum = 1.0
    over_two = 0
    over_three = 0
    for edge in mesh.edges:
        a, b = edge.vertices
        rest_length = (rest[a] - rest[b]).length
        posed_length = (posed[a] - posed[b]).length
        if rest_length <= 1.0e-8:
            continue
        ratio = posed_length / rest_length
        maximum = max(maximum, ratio)
        over_two += int(ratio > 2.0)
        over_three += int(ratio > 3.0)
    return {
        "max_edge_stretch_ratio": round(maximum, 5),
        "edges_over_2x": over_two,
        "edges_over_3x": over_three,
    }


def validate(mesh_obj: bpy.types.Object, rig_obj: bpy.types.Object) -> dict[str, object]:
    reset_pose(rig_obj)
    rest = evaluated_world_vertices(mesh_obj)
    tests: dict[str, object] = {}

    # Whole-rig motion is the exact failure shown in the user's screenshot:
    # every vertex must move by the same vector, with none pinned at the origin.
    translation = Vector((0.37, -0.21, 0.29))
    rig_obj.pose.bones["Root_Control"].location = translation
    bpy.context.view_layer.update()
    moved = evaluated_world_vertices(mesh_obj)
    displacements = [moved[i] - rest[i] for i in range(len(rest))]
    mean_displacement = sum(displacements, Vector()) / len(displacements)
    errors = [(displacement - mean_displacement).length for displacement in displacements]
    tests["root_translation"] = {
        "movement_distance": round(mean_displacement.length, 8),
        "mean_displacement": [round(value, 8) for value in mean_displacement],
        "max_vertex_uniformity_error": round(max(errors), 8),
        "stuck_vertices": sum(error > 5.0e-5 for error in errors),
        **edge_stretch(mesh_obj.data, rest, moved),
    }

    pose_specs = {
        "wing_flap": {
            "Wing.L.01": (math.radians(-28.0), math.radians(10.0), 0.0),
            "Wing.R.01": (math.radians(-28.0), math.radians(-10.0), 0.0),
            "Wing.L.02": (0.0, math.radians(12.0), 0.0),
            "Wing.R.02": (0.0, math.radians(-12.0), 0.0),
        },
        "head_tilt": {"Neck": (0.0, math.radians(14.0), math.radians(12.0)), "Head": (0.0, 0.0, math.radians(-8.0))},
        "tail_sway": {
            "Tail.Center": (math.radians(12.0), 0.0, math.radians(10.0)),
            "Tail.L": (0.0, math.radians(-8.0), math.radians(8.0)),
            "Tail.R": (0.0, math.radians(8.0), math.radians(-8.0)),
        },
    }
    for test_name, rotations in pose_specs.items():
        reset_pose(rig_obj)
        for bone_name, rotation in rotations.items():
            rig_obj.pose.bones[bone_name].rotation_euler = rotation
        bpy.context.view_layer.update()
        posed = evaluated_world_vertices(mesh_obj)
        tests[test_name] = edge_stretch(mesh_obj.data, rest, posed)

    reset_pose(rig_obj)

    vertex_sums = [0.0 for _ in mesh_obj.data.vertices]
    vertex_influences = [0 for _ in mesh_obj.data.vertices]
    for vertex in mesh_obj.data.vertices:
        for membership in vertex.groups:
            vertex_sums[vertex.index] += membership.weight
            if membership.weight > 1.0e-8:
                vertex_influences[vertex.index] += 1

    tests["weights"] = {
        "unweighted_vertices": sum(total <= 1.0e-8 for total in vertex_sums),
        "non_normalized_vertices": sum(abs(total - 1.0) > 1.0e-5 for total in vertex_sums),
        "max_influences_per_vertex": max(vertex_influences),
    }
    return tests


def save_and_export(mesh_obj: bpy.types.Object, rig_obj: bpy.types.Object) -> None:
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    reset_pose(rig_obj)

    # Tripo's 42-vertex icosphere can survive as an orphan mesh datablock even
    # after its object is deleted. Remove every non-character mesh datablock so
    # it cannot leak into the GLB through an indirect reference.
    for obj in list(bpy.data.objects):
        if obj.type == "MESH" and obj != mesh_obj:
            bpy.data.objects.remove(obj, do_unlink=True)
    for mesh_data in list(bpy.data.meshes):
        if mesh_data != mesh_obj.data:
            bpy.data.meshes.remove(mesh_data, do_unlink=True)

    select_only(rig_obj)
    mesh_obj.select_set(True)

    scene = bpy.context.scene
    scene["birdee_rig_version"] = "v2"
    scene["birdee_source_note"] = "Original v1 preserved; malformed Tripo armature and helper icosphere removed."
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    bpy.ops.export_scene.gltf(
        filepath=str(OUTPUT_GLB),
        export_format="GLB",
        export_animations=False,
        export_yup=True,
        use_selection=True,
    )
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)


def main() -> None:
    mesh_obj = find_main_mesh()
    source_info = {
        "source_file": bpy.data.filepath,
        "source_mesh": mesh_obj.name,
        "source_vertices": len(mesh_obj.data.vertices),
        "source_polygons": len(mesh_obj.data.polygons),
    }
    cleanup_info = strip_broken_rig(mesh_obj)
    rig_obj = build_armature()
    weight_info = make_weights(mesh_obj)
    bind_mesh(mesh_obj, rig_obj)
    validation = validate(mesh_obj, rig_obj)

    root_check = validation["root_translation"]
    weight_check = validation["weights"]
    if (
        root_check["stuck_vertices"] != 0
        or root_check["max_vertex_uniformity_error"] > 5.0e-5
        or root_check["movement_distance"] < 0.1
    ):
        raise RuntimeError(f"Root-translation validation failed: {root_check}")
    if weight_check["unweighted_vertices"] != 0 or weight_check["non_normalized_vertices"] != 0:
        raise RuntimeError(f"Weight validation failed: {weight_check}")
    if any(
        validation[test_name]["max_edge_stretch_ratio"] > 3.0
        for test_name in ("wing_flap", "head_tilt", "tail_sway")
    ):
        raise RuntimeError(f"Deformation stretch validation failed: {validation}")

    save_and_export(mesh_obj, rig_obj)
    summary = {
        **source_info,
        **cleanup_info,
        **weight_info,
        "bones": len(rig_obj.data.bones),
        "deform_bones": len(DEFORM_BONES),
        "validation": validation,
        "output_blend": str(OUTPUT_BLEND),
        "output_glb": str(OUTPUT_GLB),
    }
    print("BIRDEE_REPAIR_SUMMARY=" + json.dumps(summary, sort_keys=True))


if __name__ == "__main__":
    main()
