"""Verify the animated Birdee web GLB in a clean Blender session."""

from __future__ import annotations

import json
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(r"F:\Little Birdie")
GLB_PATH = ROOT / "public" / "models" / "birdee-web-animated-v1.glb"
EXPECTED_CLIPS = {
    "ready_hover",
    "encouraging_lift",
    "concerned_settle",
    "focused_lean",
    "curious_tilt",
    "attentive_settle",
}


def evaluated_world_vertices(mesh_obj: bpy.types.Object) -> list[Vector]:
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = mesh_obj.evaluated_get(depsgraph)
    evaluated_mesh = evaluated.to_mesh()
    try:
        return [evaluated.matrix_world @ vertex.co for vertex in evaluated_mesh.vertices]
    finally:
        evaluated.to_mesh_clear()


def reset_pose(rig: bpy.types.Object) -> None:
    for bone in rig.pose.bones:
        bone.location = (0.0, 0.0, 0.0)
        bone.rotation_mode = "XYZ"
        bone.rotation_euler = (0.0, 0.0, 0.0)
        bone.scale = (1.0, 1.0, 1.0)
    bpy.context.view_layer.update()


def edge_stretch(
    mesh: bpy.types.Mesh,
    rest: list[Vector],
    posed: list[Vector],
) -> tuple[float, int]:
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


def main() -> None:
    if not GLB_PATH.exists():
        raise RuntimeError(f"Missing animated GLB: {GLB_PATH}")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = 30
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
        raise RuntimeError(
            f"Expected one character mesh and rig, got meshes={[obj.name for obj in character_meshes]} "
            f"and rigs={[obj.name for obj in rigs]}"
        )

    mesh = character_meshes[0]
    rig = rigs[0]
    actions = {action.name: action for action in bpy.data.actions}
    missing_clips = sorted(EXPECTED_CLIPS - set(actions))
    unexpected_clips = sorted(set(actions) - EXPECTED_CLIPS)

    weight_sums = []
    max_influences = 0
    for vertex in mesh.data.vertices:
        weights = [membership.weight for membership in vertex.groups if membership.weight > 1.0e-8]
        weight_sums.append(sum(weights))
        max_influences = max(max_influences, len(weights))

    rig.animation_data_create()
    rig.animation_data.action = None
    reset_pose(rig)
    bpy.context.scene.frame_set(0)
    rest = evaluated_world_vertices(mesh)

    clip_report: dict[str, dict[str, float | int]] = {}
    loop_seam_error = 0.0
    for clip_name in sorted(EXPECTED_CLIPS & set(actions)):
        action = actions[clip_name]
        rig.animation_data.action = action
        start = round(action.frame_range[0])
        end = round(action.frame_range[1])
        middle = round((start + end) / 2)
        maximum = 1.0
        over_two = 0
        samples: dict[int, list[Vector]] = {}
        for frame in sorted({start, middle, end}):
            bpy.context.scene.frame_set(frame)
            bpy.context.view_layer.update()
            posed = evaluated_world_vertices(mesh)
            samples[frame] = posed
            stretch, count = edge_stretch(mesh.data, rest, posed)
            maximum = max(maximum, stretch)
            over_two = max(over_two, count)
        if clip_name == "ready_hover":
            first = samples[start]
            last = samples[end]
            loop_seam_error = max((first[index] - last[index]).length for index in range(len(first)))
        clip_report[clip_name] = {
            "start_frame": start,
            "end_frame": end,
            "max_edge_stretch": round(maximum, 5),
            "max_edges_over_2x": over_two,
        }

    image_report = [
        {"name": image.name, "width": int(image.size[0]), "height": int(image.size[1])}
        for image in bpy.data.images
        if image.name not in {"Render Result", "Viewer Node"}
    ]
    report = {
        "glb": str(GLB_PATH),
        "size_bytes": GLB_PATH.stat().st_size,
        "mesh": mesh.name,
        "vertices": len(mesh.data.vertices),
        "polygons": len(mesh.data.polygons),
        "armature": rig.name,
        "bones": len(rig.data.bones),
        "mesh_parent": mesh.parent.name if mesh.parent else None,
        "armature_modifiers": sum(modifier.type == "ARMATURE" for modifier in mesh.modifiers),
        "clips": clip_report,
        "missing_clips": missing_clips,
        "unexpected_clips": unexpected_clips,
        "ready_loop_seam_error": round(loop_seam_error, 8),
        "unweighted_vertices": sum(total <= 1.0e-8 for total in weight_sums),
        "non_normalized_vertices": sum(abs(total - 1.0) > 1.0e-4 for total in weight_sums),
        "max_influences_per_vertex": max_influences,
        "images": image_report,
        "importer_helper_meshes": [obj.name for obj in helper_meshes],
    }

    failures = []
    if report["size_bytes"] > 750_000:
        failures.append("web GLB exceeds 750 KB")
    if missing_clips or unexpected_clips:
        failures.append("animation set mismatch")
    if report["mesh_parent"] != rig.name or report["armature_modifiers"] != 1:
        failures.append("mesh-rig relationship is broken")
    if report["unweighted_vertices"] or report["non_normalized_vertices"]:
        failures.append("imported skin weights are invalid")
    if max_influences > 2:
        failures.append("too many imported bone influences")
    if loop_seam_error > 1.0e-4:
        failures.append("ready hover loop is not seamless")
    if any(values["max_edge_stretch"] > 2.0 or values["max_edges_over_2x"] for values in clip_report.values()):
        failures.append("imported animation exceeded stretch tolerance")
    if not image_report or max(max(image["width"], image["height"]) for image in image_report) > 1024:
        failures.append("web texture exceeds 1K")

    print("BIRDEE_WEB_VERIFY=" + json.dumps(report, sort_keys=True))
    if failures:
        raise RuntimeError("; ".join(failures))


if __name__ == "__main__":
    main()
