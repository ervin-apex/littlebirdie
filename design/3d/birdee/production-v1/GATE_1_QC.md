# Birdee production rebuild — Gate 1 QC

Status: **Awaiting visual approval**  
Asset: `birdee-production-neutral-v1.blend`  
Generator: `scripts/create_birdee_production_v1.py`

## Purpose

This checkpoint replaces the Tripo mesh with a clean, independently generated
production blockout. It validates silhouette, connected body topology, rigid
feather construction, and baseline deformation before final texturing or
facial controls are authored.

The Tripo-derived prototype remains unchanged.

## Structural checks

- Body: one connected component, 3,082 vertices and 3,652 polygons.
- Body and belly: zero unweighted vertices.
- Body and belly: zero non-normalized vertices.
- Maximum skin influences: two per vertex.
- Wing feathers: 26 separate rigid pieces, each parented to one wing bone.
- Tail feathers: five separate rigid pieces, each parented to one tail bone.
- Face: separate eye whites, pupils, catchlights and beak geometry.
- No generated or baked texture is used in this checkpoint.

## Deformation checks

| Pose | Maximum body edge ratio | Edges above 1.5x | Visual result |
|---|---:|---:|---|
| Forward settle | 1.18092 | 0 | Pass |
| Counter tilt | 1.51266 | 4 | Visually clean; refine at rig gate |
| Head / neck tilt | 1.56506 | 16 | Visually clean; corrective shape required at rig gate |

The prior Tripo failure mode—detached feather islands, long spikes and shoulder
tearing—does not occur because feathers no longer share blended weights across
multiple wing bones. The remaining numerical compression is localized to the
continuous neck surface and will be addressed with corrective shapes during the
production rig gate.

## Review images

- `qc/neutral-turnaround.png`
- `qc/deformation-stress-sheet.png`
- `qc/reference-comparison.png`
- Individual source renders are also stored in `qc/`.

## Visual approval questions

1. Is the compact body and head silhouette recognisably Birdee?
2. Are the eye size and spacing in the right character range?
3. Is the open wing fan direction correct before sculpting finer feather form?
4. Is the longer five-feather tail the right neutral-hover silhouette?

The approved front reference is a neutral hover while the side reference is a
forward-flight pose. The side QC therefore checks body volume, eye/beak
attachment and thickness; it is not intended to reproduce the reference's
different wing and tail pose.

## Next gate after approval

Create the clean surface system: final UVs, a controlled feather micro-detail
normal, and a hand-painted sunflower / muted-gold / butter palette with no
baked lighting or wood-grain artifacts.
