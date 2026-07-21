"""Create Birdee's web animation library from the corrected v2 rig.

Run with Blender 5.2:
    blender.exe birdee-smartmesh-rigged-v2.blend --background \
        --python create_birdee_web_animations.py

The corrected production rig is never overwritten. This script creates a
web-specific .blend and an animated GLB containing six semantic clips.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

import bpy
from mathutils import Vector


ROOT = Path(r"F:\Little Birdie")
OUTPUT_BLEND = ROOT / "design" / "3d" / "birdee" / "exports" / "birdee-web-animated-v1.blend"
OUTPUT_GLB = ROOT / "public" / "models" / "birdee-web-animated-v1.glb"
WEB_TEXTURE_DIR = ROOT / "design" / "3d" / "birdee" / "exports" / "textures"
FPS = 30

RIG_NAME = "Birdee_Rig_v2"
MESH_NAME = "Birdee_Mesh_v2"

CONTROL_BONES = (
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
)


def radians(values: tuple[float, float, float]) -> tuple[float, float, float]:
    return tuple(math.radians(value) for value in values)


def transform(
    *,
    location: tuple[float, float, float] = (0.0, 0.0, 0.0),
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
    scale: tuple[float, float, float] = (1.0, 1.0, 1.0),
) -> dict[str, tuple[float, float, float]]:
    return {"location": location, "rotation": radians(rotation), "scale": scale}


def mirrored_wings(
    root_x: float,
    root_y: float,
    middle_x: float = 0.0,
    middle_y: float = 0.0,
    tip_x: float = 0.0,
    tip_y: float = 0.0,
    roll: float = 0.0,
) -> dict[str, dict[str, tuple[float, float, float]]]:
    # The Tripo mesh contains many disconnected feather islands. Rotating the
    # child wing joints independently can create visible gaps even when the
    # numerical edge-stretch audit passes, because those islands have no shared
    # topology. Animate each wing as one clean silhouette from the shoulder;
    # child-weighted feathers still inherit that shoulder motion.
    return {
        "Wing.L.01": transform(rotation=(root_x, root_y, roll)),
        "Wing.L.02": transform(),
        "Wing.L.03": transform(),
        "Wing.R.01": transform(rotation=(root_x, -root_y, -roll)),
        "Wing.R.02": transform(),
        "Wing.R.03": transform(),
    }


def pose(
    base: dict[str, dict[str, tuple[float, float, float]]] | None = None,
    **bones: dict[str, tuple[float, float, float]],
) -> dict[str, dict[str, tuple[float, float, float]]]:
    result = dict(base or {})
    result.update(bones)
    return result


REST = pose(base=mirrored_wings(0.0, 0.0))


CLIPS: tuple[dict[str, Any], ...] = (
    {
        "name": "ready_hover",
        "label": "Ready",
        "semantic": "A calm, balanced hover for entry and neutral states.",
        "loop": True,
        "end": 73,
        "keys": (
            (1, pose(base=mirrored_wings(-2.0, 1.5), Root_Control=transform(), Body=transform(), Neck=transform(), Head=transform(), **{"Tail.Center": transform()})),
            (10, pose(base=mirrored_wings(-7.0, 4.0, -3.0, 2.0), Root_Control=transform(location=(0.0, 0.006, 0.0)), Body=transform(rotation=(0.7, 0.0, -0.5)), Neck=transform(rotation=(0.0, 0.0, 1.2)), **{"Tail.Center": transform(rotation=(0.0, 0.0, -1.5))})),
            (19, pose(base=mirrored_wings(2.0, 1.0, 3.0, 1.0), Root_Control=transform(location=(0.002, 0.011, 0.0)), Body=transform(rotation=(0.0, 0.0, 0.8)), Neck=transform(rotation=(0.0, 0.0, -1.0)), Head=transform(rotation=(0.0, 0.0, 0.8)), **{"Tail.Center": transform(rotation=(1.0, 0.0, 1.0))})),
            (28, pose(base=mirrored_wings(-5.0, 3.0, -2.0, 1.0), Root_Control=transform(location=(0.0, 0.006, 0.0)), Body=transform(rotation=(-0.5, 0.0, 0.3)), Neck=transform(rotation=(0.0, 0.0, -0.4)), **{"Tail.Center": transform(rotation=(-1.0, 0.0, 0.0))})),
            (37, pose(base=mirrored_wings(1.0, 0.5, 2.0, 0.5), Root_Control=transform(), Body=transform(rotation=(0.0, 0.0, -0.6)), Neck=transform(rotation=(0.0, 0.0, 1.0)), Head=transform(rotation=(0.0, 0.0, -0.7)), **{"Tail.Center": transform(rotation=(0.0, 0.0, -0.8))})),
            (46, pose(base=mirrored_wings(-6.0, 3.5, -2.5, 1.5), Root_Control=transform(location=(-0.002, -0.004, 0.0)), Body=transform(rotation=(0.5, 0.0, -0.3)), Neck=transform(rotation=(0.0, 0.0, 0.4)), **{"Tail.Center": transform(rotation=(1.0, 0.0, 0.0))})),
            (55, pose(base=mirrored_wings(2.0, 1.0, 3.0, 0.5), Root_Control=transform(location=(0.0, 0.002, 0.0)), Body=transform(rotation=(0.0, 0.0, 0.6)), Neck=transform(rotation=(0.0, 0.0, -0.8)), Head=transform(rotation=(0.0, 0.0, 0.6)), **{"Tail.Center": transform(rotation=(-0.5, 0.0, 1.0))})),
            (64, pose(base=mirrored_wings(-5.0, 3.0, -2.0, 1.0), Root_Control=transform(location=(0.001, 0.006, 0.0)), Body=transform(rotation=(-0.4, 0.0, 0.2)), Neck=transform(rotation=(0.0, 0.0, -0.3)), **{"Tail.Center": transform(rotation=(0.5, 0.0, 0.2))})),
            (73, pose(base=mirrored_wings(-2.0, 1.5), Root_Control=transform(), Body=transform(), Neck=transform(), Head=transform(), **{"Tail.Center": transform()})),
        ),
    },
    {
        "name": "encouraging_lift",
        "label": "Encouraging",
        "semantic": "A warm upward lift for positive movement without over-celebrating.",
        "loop": False,
        "end": 24,
        "keys": (
            (1, REST),
            (5, pose(base=mirrored_wings(5.0, -2.0), Root_Control=transform(location=(0.0, -0.006, 0.0)), Body=transform(rotation=(2.0, 0.0, 0.0)), Neck=transform(rotation=(2.0, 0.0, 0.0)))),
            (12, pose(base=mirrored_wings(-28.0, 14.0, -12.0, 10.0, -5.0, 6.0, 3.0), Root_Control=transform(location=(0.0, 0.035, -0.003)), Body=transform(rotation=(-4.0, 0.0, 0.0)), Chest=transform(rotation=(-3.0, 0.0, 0.0)), Neck=transform(rotation=(-5.0, 0.0, 0.0)), Head=transform(rotation=(-3.0, 0.0, 0.0)), **{"Tail.Center": transform(rotation=(-6.0, 0.0, 0.0)), "Tail.L": transform(rotation=(0.0, -7.0, 7.0)), "Tail.R": transform(rotation=(0.0, 7.0, -7.0))})),
            (18, pose(base=mirrored_wings(-16.0, 9.0, -6.0, 6.0, -2.0, 3.0, 1.5), Root_Control=transform(location=(0.0, 0.018, 0.0)), Body=transform(rotation=(-2.0, 0.0, 0.0)), Chest=transform(rotation=(-1.5, 0.0, 0.0)), Neck=transform(rotation=(-3.0, 0.0, 0.0)), Head=transform(rotation=(-1.5, 0.0, 0.0)), **{"Tail.Center": transform(rotation=(-3.0, 0.0, 0.0)), "Tail.L": transform(rotation=(0.0, -4.0, 4.0)), "Tail.R": transform(rotation=(0.0, 4.0, -4.0))})),
            (24, pose(base=mirrored_wings(-11.0, 7.0, -4.0, 4.0, -1.0, 2.0, 1.0), Root_Control=transform(location=(0.0, 0.011, 0.0)), Body=transform(rotation=(-1.0, 0.0, 0.0)), Chest=transform(rotation=(-1.0, 0.0, 0.0)), Neck=transform(rotation=(-2.0, 0.0, 0.0)), Head=transform(rotation=(-1.0, 0.0, 0.0)), **{"Tail.Center": transform(rotation=(-2.0, 0.0, 0.0)), "Tail.L": transform(rotation=(0.0, -3.0, 3.0)), "Tail.R": transform(rotation=(0.0, 3.0, -3.0))})),
        ),
    },
    {
        "name": "concerned_settle",
        "label": "Concerned",
        "semantic": "A soft downward settle for difficult results—never shame or panic.",
        "loop": False,
        "end": 24,
        "keys": (
            (1, REST),
            (7, pose(base=mirrored_wings(-4.0, 3.0), Root_Control=transform(location=(0.0, 0.004, 0.0)), Neck=transform(rotation=(-1.0, 0.0, 0.0)), Head=transform(rotation=(-1.0, 0.0, 0.0)))),
            (15, pose(base=mirrored_wings(18.0, -11.0), Root_Control=transform(location=(0.0, -0.017, 0.002)), Body=transform(rotation=(3.5, 0.0, 0.0)), Chest=transform(rotation=(3.5, 0.0, 0.0)), Neck=transform(rotation=(9.0, 0.0, 5.0)), Head=transform(rotation=(7.0, 0.0, 4.0)), **{"Tail.Center": transform(rotation=(5.0, 0.0, 0.0)), "Tail.L": transform(rotation=(0.0, 3.0, -2.0)), "Tail.R": transform(rotation=(0.0, -3.0, 2.0))})),
            (24, pose(base=mirrored_wings(14.0, -9.0), Root_Control=transform(location=(0.0, -0.011, 0.001)), Body=transform(rotation=(2.5, 0.0, 0.0)), Chest=transform(rotation=(2.5, 0.0, 0.0)), Neck=transform(rotation=(7.0, 0.0, 4.0)), Head=transform(rotation=(5.5, 0.0, 3.0)), **{"Tail.Center": transform(rotation=(3.0, 0.0, 0.0)), "Tail.L": transform(rotation=(0.0, 2.0, -1.5)), "Tail.R": transform(rotation=(0.0, -2.0, 1.5))})),
        ),
    },
    {
        "name": "focused_lean",
        "label": "Focused",
        "semantic": "A composed forward lean toward forecast and comparison evidence.",
        "loop": False,
        "end": 20,
        "keys": (
            (1, REST),
            (8, pose(base=mirrored_wings(-8.0, 5.0, -3.0, 3.0), Root_Control=transform(location=(0.0, 0.003, -0.008)), Body=transform(rotation=(-3.0, 0.0, 0.0)), Chest=transform(rotation=(-4.0, 0.0, 0.0)), Neck=transform(rotation=(-4.0, 0.0, -2.0)), Head=transform(rotation=(-3.0, 0.0, -2.0)), **{"Tail.Center": transform(rotation=(-3.0, 0.0, 0.0))})),
            (20, pose(base=mirrored_wings(-5.0, 4.0, -2.0, 2.0), Root_Control=transform(location=(0.0, 0.001, -0.006)), Body=transform(rotation=(-2.0, 0.0, 0.0)), Chest=transform(rotation=(-3.0, 0.0, 0.0)), Neck=transform(rotation=(-3.0, 0.0, -2.5)), Head=transform(rotation=(-2.0, 0.0, -2.0)), **{"Tail.Center": transform(rotation=(-2.0, 0.0, 0.0))})),
        ),
    },
    {
        "name": "curious_tilt",
        "label": "Curious",
        "semantic": "A gentle head tilt and asymmetrical wing response for What If.",
        "loop": False,
        "end": 22,
        "keys": (
            (1, REST),
            (7, pose(base={**mirrored_wings(-7.0, 5.0), "Wing.L.01": transform(rotation=(-15.0, 9.0, 4.0)), "Wing.R.01": transform(rotation=(2.0, -2.0, -1.0))}, Root_Control=transform(location=(-0.004, 0.005, 0.0)), Body=transform(rotation=(0.0, 0.0, 2.0)), Neck=transform(rotation=(0.0, 0.0, 8.0)), Head=transform(rotation=(0.0, 0.0, 13.0)), **{"Tail.Center": transform(rotation=(0.0, 0.0, -3.0))})),
            (14, pose(base={**mirrored_wings(-5.0, 4.0), "Wing.L.01": transform(rotation=(-11.0, 7.0, 3.0)), "Wing.R.01": transform(rotation=(1.0, -1.5, -0.5))}, Root_Control=transform(location=(-0.002, 0.003, 0.0)), Body=transform(rotation=(0.0, 0.0, 1.5)), Neck=transform(rotation=(0.0, 0.0, 6.0)), Head=transform(rotation=(0.0, 0.0, 10.0)), **{"Tail.Center": transform(rotation=(0.0, 0.0, -2.0))})),
            (22, pose(base={**mirrored_wings(-4.0, 3.0), "Wing.L.01": transform(rotation=(-9.0, 6.0, 2.5)), "Wing.R.01": transform(rotation=(0.0, -1.0, -0.5))}, Root_Control=transform(location=(-0.001, 0.002, 0.0)), Body=transform(rotation=(0.0, 0.0, 1.0)), Neck=transform(rotation=(0.0, 0.0, 5.0)), Head=transform(rotation=(0.0, 0.0, 8.0)), **{"Tail.Center": transform(rotation=(0.0, 0.0, -1.5))})),
        ),
    },
    {
        "name": "attentive_settle",
        "label": "Attentive",
        "semantic": "A small orientation cue toward explanatory evidence, then stillness.",
        "loop": False,
        "end": 20,
        "keys": (
            (1, REST),
            (6, pose(base=mirrored_wings(-8.0, 5.0, -4.0, 2.0), Root_Control=transform(location=(0.003, 0.004, 0.0)), Body=transform(rotation=(0.0, 0.0, -2.0)), Neck=transform(rotation=(0.0, 0.0, -6.0)), Head=transform(rotation=(0.0, 0.0, -7.0)), **{"Tail.Center": transform(rotation=(0.0, 0.0, 2.0))})),
            (12, pose(base=mirrored_wings(-3.0, 3.0, -1.0, 1.0), Root_Control=transform(location=(0.001, 0.001, 0.0)), Body=transform(rotation=(0.0, 0.0, -1.0)), Neck=transform(rotation=(0.0, 0.0, -4.0)), Head=transform(rotation=(0.0, 0.0, -5.0)), **{"Tail.Center": transform(rotation=(0.0, 0.0, 1.0))})),
            (20, pose(base=mirrored_wings(-2.0, 2.0), Root_Control=transform(), Body=transform(rotation=(0.0, 0.0, -0.5)), Neck=transform(rotation=(0.0, 0.0, -3.0)), Head=transform(rotation=(0.0, 0.0, -4.0)), **{"Tail.Center": transform(rotation=(0.0, 0.0, 0.5))})),
        ),
    },
)


def get_scene_objects() -> tuple[bpy.types.Object, bpy.types.Object]:
    rig = bpy.data.objects.get(RIG_NAME)
    mesh = bpy.data.objects.get(MESH_NAME)
    if not rig or rig.type != "ARMATURE":
        raise RuntimeError(f"Missing corrected rig: {RIG_NAME}")
    if not mesh or mesh.type != "MESH":
        raise RuntimeError(f"Missing corrected mesh: {MESH_NAME}")
    missing = [name for name in CONTROL_BONES if name not in rig.pose.bones]
    if missing:
        raise RuntimeError(f"Missing required controls: {missing}")
    return rig, mesh


def reset_pose(rig: bpy.types.Object) -> None:
    for name in CONTROL_BONES:
        bone = rig.pose.bones[name]
        bone.rotation_mode = "XYZ"
        bone.location = (0.0, 0.0, 0.0)
        bone.rotation_euler = (0.0, 0.0, 0.0)
        bone.scale = (1.0, 1.0, 1.0)


def apply_pose(rig: bpy.types.Object, keyed_pose: dict[str, dict[str, tuple[float, float, float]]]) -> None:
    reset_pose(rig)
    for name, values in keyed_pose.items():
        bone = rig.pose.bones[name]
        bone.location = values.get("location", (0.0, 0.0, 0.0))
        bone.rotation_euler = values.get("rotation", (0.0, 0.0, 0.0))
        bone.scale = values.get("scale", (1.0, 1.0, 1.0))


def action_fcurves(action: bpy.types.Action) -> list[Any]:
    if hasattr(action, "fcurves"):
        try:
            return list(action.fcurves)
        except Exception:
            pass
    curves: list[Any] = []
    for layer in getattr(action, "layers", []):
        for strip in getattr(layer, "strips", []):
            for channelbag in getattr(strip, "channelbags", []):
                curves.extend(list(getattr(channelbag, "fcurves", [])))
    return curves


def create_action(rig: bpy.types.Object, clip: dict[str, Any]) -> bpy.types.Action:
    action = bpy.data.actions.new(clip["name"])
    action.use_fake_user = True
    action["birdee_label"] = clip["label"]
    action["birdee_semantic"] = clip["semantic"]
    action["birdee_loop"] = bool(clip["loop"])

    rig.animation_data_create()
    rig.animation_data.action = action
    for frame, keyed_pose in clip["keys"]:
        bpy.context.scene.frame_set(frame)
        apply_pose(rig, keyed_pose)
        for name in CONTROL_BONES:
            bone = rig.pose.bones[name]
            bone.keyframe_insert(data_path="location", frame=frame, group=name)
            bone.keyframe_insert(data_path="rotation_euler", frame=frame, group=name)
            bone.keyframe_insert(data_path="scale", frame=frame, group=name)

    curves = action_fcurves(action)
    if not curves:
        raise RuntimeError(f"No curves were created for {clip['name']}")
    for curve in curves:
        for keyframe in curve.keyframe_points:
            keyframe.interpolation = "BEZIER"
            keyframe.handle_left_type = "AUTO_CLAMPED"
            keyframe.handle_right_type = "AUTO_CLAMPED"

    reset_pose(rig)
    return action


def evaluated_world_vertices(mesh_obj: bpy.types.Object) -> list[Vector]:
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = mesh_obj.evaluated_get(depsgraph)
    evaluated_mesh = evaluated.to_mesh()
    try:
        return [evaluated.matrix_world @ vertex.co for vertex in evaluated_mesh.vertices]
    finally:
        evaluated.to_mesh_clear()


def validate_actions(
    rig: bpy.types.Object,
    mesh: bpy.types.Object,
    actions: dict[str, bpy.types.Action],
) -> dict[str, dict[str, float | int]]:
    rig.animation_data.action = None
    reset_pose(rig)
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()
    rest = evaluated_world_vertices(mesh)
    rest_lengths = [
        (rest[edge.vertices[0]] - rest[edge.vertices[1]]).length
        for edge in mesh.data.edges
    ]

    report: dict[str, dict[str, float | int]] = {}
    for clip in CLIPS:
        action = actions[clip["name"]]
        rig.animation_data.action = action
        max_stretch = 1.0
        edges_over_two = 0
        max_displacement = 0.0
        key_frames = [int(frame) for frame, _ in clip["keys"]]
        sampled_frames = sorted(
            set(
                key_frames
                + [round((left + right) / 2) for left, right in zip(key_frames, key_frames[1:])]
            )
        )
        for frame in sampled_frames:
            bpy.context.scene.frame_set(frame)
            bpy.context.view_layer.update()
            posed = evaluated_world_vertices(mesh)
            max_displacement = max(
                max_displacement,
                max((posed[index] - rest[index]).length for index in range(len(rest))),
            )
            frame_edges_over_two = 0
            for edge_index, edge in enumerate(mesh.data.edges):
                rest_length = rest_lengths[edge_index]
                if rest_length <= 1.0e-8:
                    continue
                a, b = edge.vertices
                ratio = (posed[a] - posed[b]).length / rest_length
                max_stretch = max(max_stretch, ratio)
                frame_edges_over_two += int(ratio > 2.0)
            edges_over_two = max(edges_over_two, frame_edges_over_two)

        report[clip["name"]] = {
            "frames": int(clip["end"]),
            "duration_seconds": round((int(clip["end"]) - 1) / FPS, 3),
            "max_edge_stretch": round(max_stretch, 5),
            "max_edges_over_2x": edges_over_two,
            "max_vertex_displacement": round(max_displacement, 5),
        }
        if max_stretch > 2.5 or edges_over_two > 12:
            raise RuntimeError(f"{clip['name']} exceeded deformation tolerance: {report[clip['name']]}")

    rig.animation_data.action = None
    reset_pose(rig)
    bpy.context.scene.frame_set(1)
    return report


def optimize_images() -> list[dict[str, object]]:
    optimized: list[dict[str, object]] = []
    WEB_TEXTURE_DIR.mkdir(parents=True, exist_ok=True)
    for image in list(bpy.data.images):
        if image.name in {"Render Result", "Viewer Node"}:
            continue
        if not image.has_data:
            try:
                _ = image.pixels[0]
            except Exception:
                try:
                    image.reload()
                except Exception:
                    pass
        if not image.has_data:
            optimized.append({"name": image.name, "skipped": "pixel data could not be loaded"})
            continue
        before = (int(image.size[0]), int(image.size[1]))
        largest = max(before)
        if largest > 1024:
            ratio = 1024 / largest
            target = (max(1, round(before[0] * ratio)), max(1, round(before[1] * ratio)))
            image.scale(*target)
        else:
            target = before

        # Packing an already-packed image can restore its original source bytes.
        # Write the resized pixel buffer, reload it, and replace every material
        # reference so the web .blend and GLB genuinely use the 1K texture.
        output_name = f"{Path(image.name).stem}-web-1024.jpg"
        output_path = WEB_TEXTURE_DIR / output_name
        render_settings = bpy.context.scene.render.image_settings
        previous = (render_settings.file_format, render_settings.color_mode, render_settings.quality)
        render_settings.file_format = "JPEG"
        render_settings.color_mode = "RGB"
        render_settings.quality = 84
        image.save_render(filepath=str(output_path), scene=bpy.context.scene)
        render_settings.file_format, render_settings.color_mode, render_settings.quality = previous

        web_image = bpy.data.images.load(str(output_path), check_existing=False)
        web_image.name = f"{Path(image.name).stem}_web_1024"
        web_image.colorspace_settings.name = image.colorspace_settings.name
        for material in bpy.data.materials:
            if not material.use_nodes:
                continue
            for node in material.node_tree.nodes:
                if node.type == "TEX_IMAGE" and node.image == image:
                    node.image = web_image
        web_image.pack()
        after = (int(web_image.size[0]), int(web_image.size[1]))
        optimized.append(
            {
                "name": image.name,
                "before": before,
                "after": after,
                "web_image": web_image.name,
                "source_bytes": output_path.stat().st_size,
            }
        )
        if image.users == 0:
            bpy.data.images.remove(image)
    return optimized


def select_for_export(rig: bpy.types.Object, mesh: bpy.types.Object) -> None:
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="DESELECT")
    rig.select_set(True)
    mesh.select_set(True)
    bpy.context.view_layer.objects.active = rig


def export_web_glb(rig: bpy.types.Object, mesh: bpy.types.Object) -> dict[str, object]:
    OUTPUT_GLB.parent.mkdir(parents=True, exist_ok=True)
    select_for_export(rig, mesh)

    supported = {prop.identifier for prop in bpy.ops.export_scene.gltf.get_rna_type().properties}
    candidates: dict[str, object] = {
        "filepath": str(OUTPUT_GLB),
        "export_format": "GLB",
        "use_selection": True,
        "export_animations": True,
        "export_animation_mode": "ACTIONS",
        "export_force_sampling": True,
        "export_anim_slide_to_zero": True,
        "export_optimize_animation_size": True,
        "export_image_format": "JPEG",
        "export_image_quality": 86,
        "export_yup": True,
    }
    kwargs = {key: value for key, value in candidates.items() if key in supported}
    bpy.ops.export_scene.gltf(**kwargs)
    return {"used_options": kwargs, "supported_option_count": len(supported)}


def weight_report(mesh: bpy.types.Object) -> dict[str, int]:
    unweighted = 0
    non_normalized = 0
    max_influences = 0
    for vertex in mesh.data.vertices:
        weights = [membership.weight for membership in vertex.groups if membership.weight > 1.0e-8]
        total = sum(weights)
        unweighted += int(total <= 1.0e-8)
        non_normalized += int(abs(total - 1.0) > 1.0e-5)
        max_influences = max(max_influences, len(weights))
    return {
        "unweighted_vertices": unweighted,
        "non_normalized_vertices": non_normalized,
        "max_influences_per_vertex": max_influences,
    }


def main() -> None:
    rig, mesh = get_scene_objects()
    bpy.context.scene.render.fps = FPS
    bpy.context.scene.frame_start = 1

    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)

    actions = {clip["name"]: create_action(rig, clip) for clip in CLIPS}
    validation = validate_actions(rig, mesh, actions)
    weights = weight_report(mesh)
    if weights["unweighted_vertices"] or weights["non_normalized_vertices"]:
        raise RuntimeError(f"The source skin is invalid: {weights}")

    images = optimize_images()
    rig["web_animation_set"] = ",".join(actions)
    rig["web_animation_fps"] = FPS
    mesh["web_asset_version"] = "birdee-web-animated-v1"

    OUTPUT_BLEND.parent.mkdir(parents=True, exist_ok=True)
    rig.animation_data.action = None
    reset_pose(rig)
    bpy.context.scene.frame_set(1)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    export_info = export_web_glb(rig, mesh)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)

    summary = {
        "source": bpy.data.filepath,
        "output_blend": str(OUTPUT_BLEND),
        "output_glb": str(OUTPUT_GLB),
        "output_glb_bytes": OUTPUT_GLB.stat().st_size,
        "clips": [clip["name"] for clip in CLIPS],
        "fps": FPS,
        "images": images,
        "weights": weights,
        "validation": validation,
        "export": export_info,
    }
    print("BIRDEE_WEB_ANIMATIONS=" + json.dumps(summary, sort_keys=True))


if __name__ == "__main__":
    main()
