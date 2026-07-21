"""Replace Birdee's procedural feet with the approved Tripo foot asset.

The Tripo export is kept as a low-poly quad cage with a non-destructive
subdivision modifier. One right-foot mesh is fitted to the existing body and
then mirrored for the left foot, guaranteeing bilateral symmetry while
preserving the accepted Birdee body and materials.
"""

from __future__ import annotations

import math
import shutil
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector


ROOT = Path(r"F:\Little Birdie")
OUTPUT_DIR = ROOT / r"design\3d\birdee\production-v2"
BLEND_PATH = OUTPUT_DIR / "birdee-production-v2.blend"
BACKUP_PATH = OUTPUT_DIR / "birdee-production-v2-before-tripo-feet.blend"
QC_DIR = OUTPUT_DIR / r"feet\qc-v1"
SOURCE = (
    OUTPUT_DIR
    / r"feet\tripo\b09a8f0a-6a58-42bb-bee5-f63df53ae23f\extracted"
    / "tripo_convert_0f3892ce-a5ad-4e27-8718-6e51d90b510f.fbx"
)

TRIPO_ASSET_ID = "b09a8f0a-6a58-42bb-bee5-f63df53ae23f"
TARGET_DIMENSIONS = Vector((0.090, 0.070, 0.110))
RIGHT_LOCATION = Vector((0.103, -0.150, 0.082))
FORWARD_TILT_DEGREES = -10.0


def smooth_object(obj: bpy.types.Object) -> None:
    for polygon in obj.data.polygons:
        polygon.use_smooth = True


def look_at(obj: bpy.types.Object, target: tuple[float, float, float]) -> None:
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def delete_old_feet() -> None:
    for obj in list(bpy.data.objects):
        if obj.name.startswith("Foot."):
            bpy.data.objects.remove(obj, do_unlink=True)


def seal_open_boundaries(obj: bpy.types.Object) -> int:
    """Cap Tripo's open ankle loop so the production foot is watertight."""
    mesh = bmesh.new()
    mesh.from_mesh(obj.data)
    boundary = [edge for edge in mesh.edges if edge.is_boundary]
    if boundary:
        bmesh.ops.holes_fill(mesh, edges=boundary, sides=0)
        mesh.to_mesh(obj.data)
        obj.data.update()
    mesh.free()
    return len(boundary)


def import_source_foot() -> bpy.types.Object:
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=str(SOURCE), use_image_search=True)
    imported_meshes = [
        obj for obj in bpy.data.objects if obj not in before and obj.type == "MESH"
    ]
    if len(imported_meshes) != 1:
        raise RuntimeError(
            f"Expected one imported foot mesh, found {[obj.name for obj in imported_meshes]}"
        )
    return imported_meshes[0]


def fit_right_foot(foot: bpy.types.Object) -> bpy.types.Object:
    foot.name = "Foot.R"
    foot.data.name = "Foot.R.Mesh"
    foot.location = (0.0, 0.0, 0.0)
    foot.rotation_euler = (0.0, 0.0, 0.0)
    foot.scale = tuple(
        TARGET_DIMENSIONS[index] / foot.dimensions[index] for index in range(3)
    )
    bpy.context.view_layer.objects.active = foot
    foot.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # A small forward tilt lets the toes hang in front of the ankle instead of
    # reading as a flat upright hand.
    foot.rotation_euler.x = math.radians(FORWARD_TILT_DEGREES)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    foot.location = RIGHT_LOCATION

    feet_material = bpy.data.materials.get("Birdee_Feet")
    if feet_material is None:
        raise RuntimeError("The production Birdee_Feet material is missing")
    foot.data.materials.clear()
    foot.data.materials.append(feet_material)
    sealed_edge_count = seal_open_boundaries(foot)
    smooth_object(foot)

    subdivision = foot.modifiers.new("Foot_Subdivision", "SUBSURF")
    subdivision.subdivision_type = "CATMULL_CLARK"
    subdivision.levels = 1
    subdivision.render_levels = 1

    foot["source"] = "Tripo image-to-3D, quad retopology"
    foot["tripo_asset_id"] = TRIPO_ASSET_ID
    foot["source_faces"] = 1963
    foot["sealed_boundary_edges"] = sealed_edge_count
    foot["role"] = "right foot cage"
    foot.select_set(False)
    return foot


def mirror_left_foot(right: bpy.types.Object) -> bpy.types.Object:
    left = right.copy()
    left.data = right.data.copy()
    bpy.context.collection.objects.link(left)
    left.name = "Foot.L"
    left.data.name = "Foot.L.Mesh"
    left.location = (-RIGHT_LOCATION.x, RIGHT_LOCATION.y, RIGHT_LOCATION.z)
    left.scale.x = -1.0
    bpy.context.view_layer.objects.active = left
    left.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    left["role"] = "mirrored left foot cage"
    left.select_set(False)
    return left


def render_qc() -> None:
    camera = bpy.context.scene.camera
    if camera is None:
        raise RuntimeError("The production QC camera is missing")

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
        "feet-closeup": ((0.0, -2.0, 0.23), (0.0, -0.12, 0.135)),
    }
    original_scale = camera.data.ortho_scale
    for name, (location, target) in views.items():
        camera.location = location
        camera.data.ortho_scale = 0.38 if name == "feet-closeup" else 1.28
        look_at(camera, target)
        scene.render.filepath = str(QC_DIR / f"{name}.png")
        bpy.ops.render.render(write_still=True)
    camera.data.ortho_scale = original_scale


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)
    if not BACKUP_PATH.exists():
        shutil.copy2(BLEND_PATH, BACKUP_PATH)

    delete_old_feet()
    right = fit_right_foot(import_source_foot())
    left = mirror_left_foot(right)

    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    render_qc()
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))

    print(f"Saved: {BLEND_PATH}")
    print(f"Backup: {BACKUP_PATH}")
    print(f"Foot.R cage: {len(right.data.vertices)} vertices, {len(right.data.polygons)} faces")
    print(f"Foot.L cage: {len(left.data.vertices)} vertices, {len(left.data.polygons)} faces")
    print(f"QC: {QC_DIR}")


if __name__ == "__main__":
    main()
