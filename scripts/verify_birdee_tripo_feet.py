"""Verify the production Birdee file after the Tripo foot replacement."""

from __future__ import annotations

import math

import bmesh
import bpy


body = bpy.data.objects.get("Birdee_Body_10K")
right = bpy.data.objects.get("Foot.R")
left = bpy.data.objects.get("Foot.L")

assert body is not None and body.type == "MESH"
assert len(body.data.polygons) == 9452, "Accepted body topology changed"
assert right is not None and left is not None

for foot in (right, left):
    assert foot.type == "MESH"
    assert len(foot.data.vertices) == 1980
    assert len(foot.data.polygons) == 1966
    assert foot.data.materials[0].name == "Birdee_Feet"
    assert foot.get("tripo_asset_id") == "b09a8f0a-6a58-42bb-bee5-f63df53ae23f"
    assert foot.get("sealed_boundary_edges") == 29
    subdivisions = [modifier for modifier in foot.modifiers if modifier.type == "SUBSURF"]
    assert len(subdivisions) == 1 and subdivisions[0].levels == 1
    assert min(polygon.area for polygon in foot.data.polygons) > 1e-10

    mesh = bmesh.new()
    mesh.from_mesh(foot.data)
    non_manifold = [edge for edge in mesh.edges if not edge.is_manifold]
    boundary = [edge for edge in non_manifold if edge.is_boundary]
    wire = [edge for edge in non_manifold if edge.is_wire]
    print(
        f"{foot.name}: non_manifold={len(non_manifold)}, "
        f"boundary={len(boundary)}, wire={len(wire)}"
    )
    mesh.free()
    assert not non_manifold, f"{foot.name} contains non-manifold edges"

assert math.isclose(right.location.x, -left.location.x, abs_tol=1e-6)
assert math.isclose(right.location.y, left.location.y, abs_tol=1e-6)
assert math.isclose(right.location.z, left.location.z, abs_tol=1e-6)
assert all(
    math.isclose(right.dimensions[index], left.dimensions[index], abs_tol=1e-6)
    for index in range(3)
)

print("BIRDEE_TRIPO_FEET_VERIFY=PASS")
