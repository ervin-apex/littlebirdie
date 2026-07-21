# Birdee 3D handoff

## Status

The browser-based Tripo-to-Blender pipeline and corrective Blender rig pass
completed on 2026-07-20.

- Tripo asset ID: `13e35d02-a7d8-432a-a9ae-bc0422d81d12`
- Tripo asset: https://studio.tripo3d.ai/workspace/rigging/13e35d02-a7d8-432a-a9ae-bc0422d81d12
- Tripo classification: Avian
- Tripo Smart Mesh: 5,022 triangles
- Tripo texture: 4K source texture
- Tripo rig: 19-joint avian skeleton
- Stock animations: none available for Tripo's avian rig
- Credits used: 75 total (35 mesh, 20 texture, 20 rig)
- Credits remaining after rigging: 1,065

The Tripo skin was not production-usable: 4,927 of 4,935 vertices were weighted
entirely to `tripo::Root`, while only eight vertices had any other bone weight.
That caused isolated vertices to remain behind or shoot into long spikes when a
bone moved. The original files remain untouched for provenance; use v2 below.

## Blender-ready files

- `exports/birdee-smartmesh-rigged-v2.blend`
  - Corrected production working file for Blender 5.2.
  - One character mesh: `Birdee_Mesh_v2`.
  - One symmetric custom armature: `Birdee_Rig_v2`.
  - Fourteen bones total, thirteen deform bones.
  - Deterministic weights designed around the model's 435 disconnected surface
    islands, with no more than two influences per vertex.
- `exports/birdee-smartmesh-rigged-v2.glb`
  - Corrected portable handoff with embedded texture and skin.
  - Verified by importing into a clean Blender session.
- `exports/birdee-smartmesh-rigged-v1.glb`
  - Original Tripo GLB with embedded texture and malformed skin. Archive only.
- `exports/birdee-smartmesh-rigged-v1.blend`
  - Original Tripo import in Blender 5.2. Archive only.
  - Scene name: `Birdee_Rigged`
  - Mesh objects: `Birdee_Mesh`, `Birdee_Mesh_02`
  - Armature object: `Birdee_Rig`
  - Bone count: 19
  - No baked actions.

## V2 controls

- `Root_Control`: moves the complete character; it does not directly deform the
  mesh.
- `Body`, `Chest`, `Neck`, `Head`: torso and head chain.
- `Wing.L.01` through `.03` and `Wing.R.01` through `.03`: symmetric three-bone
  wing chains, from shoulder to tip.
- `Tail.Center`, `Tail.L`, `Tail.R`: tail sway and fan controls.

## V2 validation

- 4,935 source vertices; zero unweighted vertices.
- Zero non-normalized vertices; maximum two bone influences per vertex.
- Whole-character root motion: zero stuck vertices and `1.00001x` maximum edge
  stretch.
- Exaggerated wing flap: `1.08724x` maximum edge stretch, zero edges over `2x`.
- Exaggerated head tilt: `1.70884x` maximum edge stretch, zero edges over `2x`.
- Exaggerated tail sway: `1.16122x` maximum edge stretch, zero edges over `2x`.
- Clean GLB reimport: all 14 required bones, mesh parent, armature modifier, and
  normalized weights preserved. Blender may create an `Icosphere` helper inside
  its reserved `glTF_not_exported` collection on import; it is an importer rig
  display helper, not packaged Birdee geometry.

## Source views

The Tripo multiview order was Front, Left, Right, Back. See
`multiview-v1/INPUT_ORDER.txt` for the exact filenames.

## Known cleanup

- The generated beak texture has slight mottling and should be cleaned before
  final production renders.
- No matching stock animation clips were available. Create the
  interaction-specific idle, wing flap, point, celebrate, peek, and exit clips
  in Blender using the v2 controls.
- The v2 weights are mechanically validated. An animator can still make small
  artistic weight refinements after the first animation blocking pass, if the
  desired poses call for softer shoulder or neck deformation.

## Reproducible import

Run `scripts/import_birdee_to_blender.py` with Blender 5.2 in background mode to
rebuild the original v1 `.blend` from the Tripo GLB.

Run `scripts/repair_birdee_rig.py` against the original v1 `.blend` to reproduce
the corrected v2 `.blend` and `.glb`. Run
`scripts/verify_birdee_rigged_glb.py` in a clean Blender background session to
repeat the portable GLB validation.
