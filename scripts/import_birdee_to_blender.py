import json
from pathlib import Path

import bpy


SOURCE_GLB = Path(r"F:\Little Birdie\design\3d\birdee\exports\birdee-smartmesh-rigged-v1.glb")
OUTPUT_BLEND = Path(r"F:\Little Birdie\design\3d\birdee\exports\birdee-smartmesh-rigged-v1.blend")


def main() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    bpy.ops.import_scene.gltf(filepath=str(SOURCE_GLB))

    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    armatures = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]

    if not meshes:
        raise RuntimeError("Expected at least one mesh")
    if len(armatures) != 1:
        raise RuntimeError(f"Expected one armature, found {len(armatures)}")

    rig = armatures[0]

    meshes.sort(key=lambda obj: len(obj.data.vertices), reverse=True)
    for index, mesh in enumerate(meshes, start=1):
        suffix = "" if index == 1 else f"_{index:02d}"
        mesh.name = f"Birdee_Mesh{suffix}"
        mesh.data.name = f"Birdee_MeshData{suffix}"

    rig.name = "Birdee_Rig"
    rig.data.name = "Birdee_Armature"
    rig.show_in_front = True
    rig.data.display_type = "OCTAHEDRAL"

    seen_materials = []
    for mesh in meshes:
        for material in mesh.data.materials:
            if material is not None and material not in seen_materials:
                seen_materials.append(material)

    for index, material in enumerate(seen_materials, start=1):
        material.name = "Birdee_Material" if index == 1 else f"Birdee_Material_{index:02d}"

    scene = bpy.context.scene
    scene.name = "Birdee_Rigged"
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0

    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND))

    summary = {
        "source": str(SOURCE_GLB),
        "blend": str(OUTPUT_BLEND),
        "mesh_objects": len(meshes),
        "mesh_names": [mesh.name for mesh in meshes],
        "vertices": sum(len(mesh.data.vertices) for mesh in meshes),
        "polygons": sum(len(mesh.data.polygons) for mesh in meshes),
        "materials": len(seen_materials),
        "armatures": len(armatures),
        "bones": len(rig.data.bones),
        "actions": len(bpy.data.actions),
        "images": len(bpy.data.images),
    }
    print("BIRDEE_IMPORT_SUMMARY=" + json.dumps(summary, sort_keys=True))


if __name__ == "__main__":
    main()
