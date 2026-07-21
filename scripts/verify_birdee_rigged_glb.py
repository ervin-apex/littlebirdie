"""Fresh-session verification for Birdee's corrected rigged GLB."""

from __future__ import annotations

import json
import math
from pathlib import Path

import bpy
from mathutils import Vector


GLB_PATH = Path(r"F:\Little Birdie\design\3d\birdee\exports\birdee-smartmesh-rigged-v2.glb")


def evaluated_world_vertices(mesh_obj: bpy.types.Object) -> list[Vector]:
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated_obj = mesh_obj.evaluated_get(depsgraph)
    evaluated_mesh = evaluated_obj.to_mesh()
    try:
        return [evaluated_obj.matrix_world @ vertex.co for vertex in evaluated_mesh.vertices]
    finally:
        evaluated_obj.to_mesh_clear()


def edge_stretch(mesh: bpy.types.Mesh, rest: list[Vector], posed: list[Vector]) -> tuple[float, int]:
    maximum = 1.0
    over_two = 0
    for edge in mesh.edges:
        a, b = edge.vertices
        rest_length = (rest[a] - rest[b]).length
        if rest_length <= 1.0e-8:
            continue
        ratio = (posed[a] - posed[b]).length / rest_length
        maximum = max(maximum, ratio)
        over_two += int(ratio > 2.0)
    return maximum, over_two


def reset_pose(rig_obj: bpy.types.Object) -> None:
    for bone in rig_obj.pose.bones:
        bone.location = (0.0, 0.0, 0.0)
        bone.rotation_mode = "XYZ"
        bone.rotation_euler = (0.0, 0.0, 0.0)
        bone.scale = (1.0, 1.0, 1.0)
    bpy.context.view_layer.update()


def main() -> None:
    if not GLB_PATH.exists():
        raise RuntimeError(f"Missing GLB: {GLB_PATH}")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(GLB_PATH))

    meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
    helper_meshes = [
        obj
        for obj in meshes
        if any(collection.name == "glTF_not_exported" for collection in obj.users_collection)
    ]
    character_meshes = [obj for obj in meshes if obj not in helper_meshes]
    rigs = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
    if len(character_meshes) != 1 or len(rigs) != 1:
        mesh_details = [
            (
                obj.name,
                len(obj.data.vertices),
                len(obj.data.polygons),
                [collection.name for collection in obj.users_collection],
            )
            for obj in meshes
        ]
        rig_details = [(obj.name, len(obj.data.bones)) for obj in rigs]
        raise RuntimeError(
            f"Expected one character mesh and one armature, got meshes={mesh_details} and armatures={rig_details}"
        )
    mesh_obj = character_meshes[0]
    rig_obj = rigs[0]
    bone_names = {bone.name for bone in rig_obj.data.bones}
    required = {
        "Root_Control",
        "Body",
        "Chest",
        "Neck",
        "Head",
        "Wing.L.01",
        "Wing.L.02",
        "Wing.L.03",
        "Wing.R.01",
        "Wing.R.02",
        "Wing.R.03",
        "Tail.Center",
        "Tail.L",
        "Tail.R",
    }
    missing_bones = sorted(required - bone_names)

    weight_sums = []
    max_influences = 0
    for vertex in mesh_obj.data.vertices:
        weights = [membership.weight for membership in vertex.groups if membership.weight > 1.0e-8]
        weight_sums.append(sum(weights))
        max_influences = max(max_influences, len(weights))

    reset_pose(rig_obj)
    rest = evaluated_world_vertices(mesh_obj)
    rig_obj.pose.bones["Root_Control"].location = (0.19, 0.13, -0.17)
    bpy.context.view_layer.update()
    root_moved = evaluated_world_vertices(mesh_obj)
    displacements = [root_moved[i] - rest[i] for i in range(len(rest))]
    mean_displacement = sum(displacements, Vector()) / len(displacements)
    root_uniformity_error = max((movement - mean_displacement).length for movement in displacements)
    root_stretch, root_over_two = edge_stretch(mesh_obj.data, rest, root_moved)

    reset_pose(rig_obj)
    rig_obj.pose.bones["Wing.L.01"].rotation_euler.x = math.radians(-25.0)
    rig_obj.pose.bones["Wing.R.01"].rotation_euler.x = math.radians(-25.0)
    rig_obj.pose.bones["Wing.L.02"].rotation_euler.y = math.radians(10.0)
    rig_obj.pose.bones["Wing.R.02"].rotation_euler.y = math.radians(-10.0)
    bpy.context.view_layer.update()
    wing_pose = evaluated_world_vertices(mesh_obj)
    wing_stretch, wing_over_two = edge_stretch(mesh_obj.data, rest, wing_pose)
    reset_pose(rig_obj)

    report = {
        "glb": str(GLB_PATH),
        "size_bytes": GLB_PATH.stat().st_size,
        "mesh": mesh_obj.name,
        "importer_helper_meshes": [obj.name for obj in helper_meshes],
        "vertices": len(mesh_obj.data.vertices),
        "polygons": len(mesh_obj.data.polygons),
        "armature": rig_obj.name,
        "bones": len(rig_obj.data.bones),
        "missing_required_bones": missing_bones,
        "mesh_parent": mesh_obj.parent.name if mesh_obj.parent else None,
        "armature_modifiers": sum(modifier.type == "ARMATURE" for modifier in mesh_obj.modifiers),
        "unweighted_vertices": sum(total <= 1.0e-8 for total in weight_sums),
        "non_normalized_vertices": sum(abs(total - 1.0) > 1.0e-4 for total in weight_sums),
        "max_influences_per_vertex": max_influences,
        "root_movement_distance": round(mean_displacement.length, 8),
        "root_uniformity_error": round(root_uniformity_error, 8),
        "root_max_edge_stretch": round(root_stretch, 5),
        "root_edges_over_2x": root_over_two,
        "wing_max_edge_stretch": round(wing_stretch, 5),
        "wing_edges_over_2x": wing_over_two,
    }

    failures = []
    if missing_bones:
        failures.append("missing bones")
    if report["mesh_parent"] != rig_obj.name or report["armature_modifiers"] != 1:
        failures.append("broken mesh-armature relationship")
    if report["unweighted_vertices"] or report["non_normalized_vertices"]:
        failures.append("invalid imported weights")
    if max_influences > 2:
        failures.append("too many vertex influences")
    if report["root_movement_distance"] < 0.05 or root_uniformity_error > 5.0e-5 or root_over_two:
        failures.append("root movement left vertices behind")
    if wing_stretch > 2.0 or wing_over_two:
        failures.append("wing pose exceeded stretch tolerance")

    print("BIRDEE_GLB_VERIFY=" + json.dumps(report, sort_keys=True))
    if failures:
        raise RuntimeError("; ".join(failures))


if __name__ == "__main__":
    main()
