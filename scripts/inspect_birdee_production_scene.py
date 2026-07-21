"""Print mesh transforms and bounds from the current Birdee production file."""

from __future__ import annotations

import json

import bpy
from mathutils import Vector


def world_bounds(obj: bpy.types.Object) -> tuple[Vector, Vector]:
    corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    minimum = Vector((min(point[i] for point in corners) for i in range(3)))
    maximum = Vector((max(point[i] for point in corners) for i in range(3)))
    return minimum, maximum


report: list[dict[str, object]] = []
for obj in bpy.context.scene.objects:
    if obj.type != "MESH":
        continue
    minimum, maximum = world_bounds(obj)
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
        }
    )

print("BIRDEE_DIAGNOSTIC=" + json.dumps(report, sort_keys=True))
