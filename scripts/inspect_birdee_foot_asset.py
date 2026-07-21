"""Inspect the exported Tripo foot FBX in Blender.

Run with Blender in background mode. The script prints stable object-space and
world-space bounds so the production integration script can fit the foot to
Birdee without guessing at Tripo's export scale.
"""

from __future__ import annotations

import json
from pathlib import Path

import bpy
from mathutils import Vector


SOURCE = Path(
    r"F:\Little Birdie\design\3d\birdee\production-v2\feet\tripo"
    r"\b09a8f0a-6a58-42bb-bee5-f63df53ae23f\extracted"
    r"\tripo_convert_0f3892ce-a5ad-4e27-8718-6e51d90b510f.fbx"
)


def world_bounds(obj: bpy.types.Object) -> tuple[Vector, Vector]:
    corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    minimum = Vector((min(point[i] for point in corners) for i in range(3)))
    maximum = Vector((max(point[i] for point in corners) for i in range(3)))
    return minimum, maximum


def main() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.fbx(filepath=str(SOURCE), use_image_search=True)

    report: list[dict[str, object]] = []
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        minimum, maximum = world_bounds(obj)
        world_vertices = [obj.matrix_world @ vertex.co for vertex in obj.data.vertices]
        height = maximum.z - minimum.z
        low_vertices = [point for point in world_vertices if point.z <= minimum.z + height * 0.28]
        high_vertices = [point for point in world_vertices if point.z >= maximum.z - height * 0.28]

        def centroid(points: list[Vector]) -> list[float]:
            center = sum(points, Vector()) / len(points)
            return list(center)

        report.append(
            {
                "name": obj.name,
                "vertices": len(obj.data.vertices),
                "faces": len(obj.data.polygons),
                "location": list(obj.location),
                "rotation_euler": list(obj.rotation_euler),
                "scale": list(obj.scale),
                "dimensions": list(obj.dimensions),
                "bounds_min": list(minimum),
                "bounds_max": list(maximum),
                "low_z_centroid": centroid(low_vertices),
                "high_z_centroid": centroid(high_vertices),
                "low_z_y_range": [
                    min(point.y for point in low_vertices),
                    max(point.y for point in low_vertices),
                ],
                "materials": [material.name for material in obj.data.materials],
            }
        )

    print("FOOT_DIAGNOSTIC=" + json.dumps(report, sort_keys=True))


if __name__ == "__main__":
    main()
