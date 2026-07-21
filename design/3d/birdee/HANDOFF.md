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

## Web animation set

The first product-facing motion library and its review page were completed on
2026-07-21.

- `exports/birdee-web-animated-v1.blend`
  - Blender 5.2 animation master derived from the corrected v2 rig.
  - Six actions authored at 30 fps: `ready_hover`, `encouraging_lift`,
    `concerned_settle`, `focused_lean`, `curious_tilt`, and
    `attentive_settle`.
- `../../../../public/models/birdee-web-animated-v1.glb`
  - Website asset with all six named clips and an embedded 1K JPEG texture.
  - 476,936 bytes (477 KB), 14 bones, and no more than two skin influences per
    vertex.
  - Clean-import validation found zero unweighted or non-normalized vertices,
    a seamless `ready_hover` loop, and zero tested edges above `2x` stretch.
- `../../../../app/birdee-motion-lab/page.tsx`
  - Separate review route at `/birdee-motion-lab` with manual state selection,
    replay, and an optional auto tour.
  - The Three.js stage lazy-loads the GLB, caps device pixel ratio, pauses when
    hidden or offscreen, and uses a static final pose when reduced motion is
    requested.
  - Desktop and 390 x 844 mobile layouts were visually reviewed. Reduced-motion
    hydration, replay, auto-tour pause/advance, and the single-scroll mobile
    flow were browser-tested.

Rebuild the web files with `scripts/create_birdee_web_animations.py` against the
corrected v2 `.blend`. Verify the resulting GLB in a clean Blender session with
`scripts/verify_birdee_web_animations.py`.

## Source views

The Tripo multiview order was Front, Left, Right, Back. See
`multiview-v1/INPUT_ORDER.txt` for the exact filenames.

## Known cleanup

- The generated beak texture has slight mottling and should be cleaned before
  final production renders.
- The six web clips cover the current scoreboard information states. Add point,
  peek, and exit clips only after their exact UI placements and triggers are
  approved; do not turn Birdee into ambient decoration across every screen.
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
