# Little Birdee auth animation — Seedance 2 reference workflow

## Intended result

A seamless five-second idle loop for the Birdee perched beside the auth form.

Seedance should animate only one very small upper-chest breath. The head, eye, beak, wings, tail, legs, feet, toes, camera and overall body position must remain fixed. Cursor-following eye movement will be added separately in the website, so the generated video must not animate the eye.

## Reference inputs

Upload both files as ordinary Seedance 2 reference images. Do not assign either file as a first frame or last frame.

1. `@Image 1` — character identity and neutral pose lock  
   `references/auth-birdee-seedance-reference-v2.png`
2. `@Image 2` — motion storyboard  
   `references/auth-birdee-cursor-ready-breathing-storyboard-v2.png`

Interpret `@Image 2` from left to right:

1. neutral rest;
2. tiny upper-chest inhale;
3. neutral rest.

The third storyboard panel is an exact duplicate of the first so the intended loop is unambiguous.

## Configuration

| Setting | Value |
| --- | --- |
| Model | Seedance 2.0 |
| Workflow / mode | Reference-to-video or multimodal reference |
| Reference images | Both images above |
| First-frame input | None |
| Last-frame input | None |
| Elements / reference system | On |
| Preset | General |
| Duration | 5 seconds |
| Aspect ratio | 1:1 |
| Resolution | 720p for trials; highest available after approval |
| Frame rate | 24 fps, if configurable |
| Camera motion | Locked / none |
| Motion strength | Low, if configurable |
| Subject or reference adherence | High, if configurable |
| Audio | Off |
| Variants | Generate 3 and select the least active clean loop |

Avoid a portrait, cinematic, character-performance or high-motion preset. Those presets encourage extra head, eye, wing and body movement.

## Copy-and-paste prompt

```text
@Image 1 is the exact Little Birdee character identity, proportions, materials, neutral standing pose, composition, scale, lighting, head, visible eye, legs, feet, toes and ground-baseline reference.

@Image 2 is a technical motion storyboard only. Read its three panels from left to right as REST, TINY INHALE, REST. Do not render the storyboard, panels, grid, separators, split screen or multiple birds in the output.

Create one continuous five-second 1:1 shot containing exactly one Little Birdee. The camera is completely locked.

Motion timing:
- 0.00–1.25 seconds: hold the exact neutral resting pose.
- 1.25–2.50 seconds: only the upper/front chest expands outward and lifts by approximately 1–2 percent, matching the middle panel of @Image 2. This is a very quiet, nearly imperceptible inhale.
- 2.50–3.75 seconds: the upper chest smoothly returns to the exact resting shape.
- 3.75–5.00 seconds: hold the exact neutral resting pose so the final frame matches the opening frame.

Keep the overall body position, body scale and body centre fixed. Do not bob, hop, translate, rotate, squash or stretch the whole character.

The head, eye socket, visible eye, pupil, eyelid, eyebrow area, beak, wings, tail, legs, feet and every toe remain completely static for the entire shot. The eye must stay fully open with the same neutral friendly expression. The website will replace the eye movement with an interactive cursor-following layer, so any generated eye, pupil, eyelid, blink, gaze or head movement is incorrect.

Keep both feet and every toe pixel-position locked to the same baseline. Preserve the exact character identity, proportions, golden-yellow surface texture, lighting and side-facing pose from @Image 1.

Use a uniform near-white background with no shadow, floor line, horizon, scenery or camera movement. Silent output.

Strict exclusions: no blink, no eyelid movement, no pupil movement, no gaze change, no sad or sleepy expression, no head tilt, no beak movement, no talking, no wing movement, no tail movement, no leg movement, no foot movement, no toe deformation, no body bob, no hop, no walking, no overall scaling, no camera push, no camera pan, no camera shake, no second bird, no storyboard panels, no text, no logo, no watermark and no audio.
```

## Selection checklist

Accept a generated variant only if all of these are true:

- exactly one Birdee appears;
- the eye stays fully open and unchanged;
- the head and beak do not move;
- the feet and toes keep the same shape and baseline;
- the body does not shift, bob or scale;
- only the upper chest shows a very small breath;
- the opening and ending poses appear identical;
- the background stays uniformly near-white;
- there is no shadow, text, watermark or audio.

Reject a variant if it looks more animated than a calm website idle state. In this use case, less motion is the better result.
