# Auth Birdee Seedance handoff v4

This pass replaces the breathing-only motion with one purposeful
acknowledgement: Birdee briefly looks from the form toward the user, then
returns attention to the form.

## Inputs

1. `references/auth-birdee-seedance-reference-v2.png`
   - exact first frame;
   - character, composition, feet and baseline lock.
2. `references/auth-birdee-user-glance-storyboard-v1.png`
   - motion storyboard only;
   - read left to right as form attention, user acknowledgement, form
     attention.

Never use the storyboard as the only image or as the first frame.

## Higgsfield configuration

- Model: Seedance 2.0
- Mode: image/reference-to-video
- Elements: on
- Preset: General
- Duration: 5 seconds
- Aspect ratio: 1:1
- Resolution: 720p for the trial; highest available after approval
- Frame rate: 24 fps
- Camera: locked
- Motion strength: low
- Image/subject adherence: high
- Audio: off
- Variants: 3

If the interface provides a dedicated first-frame field, place Image 1 there
and add Image 2 as a secondary reference. If it only provides asset references,
upload both and address them explicitly as `@Image 1` and `@Image 2`.

## Prompt

`@Image 1` is the exact opening frame, exact Little Birdee character reference
and exact composition lock.

`@Image 2` is a motion storyboard only. Read its panels from left to right as
sequential poses of the same single Birdee: looking down-left toward the form,
briefly acknowledging the user, then looking down-left toward the form again.
Do not render the contact sheet, panel dividers, multiple birds or a split
screen.

Locked camera, square 1:1, one continuous five-second shot. Render exactly one
Birdee.

Birdee remains in precisely the same location and at precisely the same scale
for the entire shot. The round body, wings, tail, legs, feet and every toe
remain pixel-position locked. Both feet stay planted on the same invisible
horizontal baseline.

Follow only this motion:

- 0.0–0.8 seconds: hold the form-attention pose from the left panel of
  `@Image 2`;
- 0.8–1.6 seconds: gently lift the head by only 4–6 degrees and rotate it only
  2–3 degrees toward the camera, while the visible pupil shifts subtly toward
  the viewer;
- 1.6–2.2 seconds: hold a warm, attentive look toward the viewer;
- 2.2–3.2 seconds: reverse the same small head and pupil movement and return
  attention to the form;
- 3.2–5.0 seconds: hold the exact opening pose.

Keep the same single-eye three-quarter-left silhouette throughout. Never
reveal a second eye or turn the head front-facing. The visible eye remains
fully open, bright and attentive. The eyelid stays fully raised. The beak stays
closed. Both wings remain completely tucked.

Preserve the exact body proportions, single visible glossy eye, short orange
beak, orange legs and feet, wing and tail anatomy, golden-yellow colour,
tactile feather texture and warm studio lighting from `@Image 1`.

The background remains a uniform near-white paper field with no floor,
horizon, gradient, vignette, lighting change, cast shadow, contact shadow or
reflection.

The final pose must match the first pose exactly.

No blink, lowered eyelid, half-closed eye, sleepy expression, sad expression,
angry expression, second visible eye, front-facing head, smile, beak opening,
speaking, body bob, chest expansion, foot movement, toe deformation, hopping,
walking, flying, wing movement, tail movement, camera movement, pan, zoom,
crop change, character morphing, extra limbs, extra toes, props, perch, shelf,
text, logo, watermark, split screen, contact-sheet layout, multiple birds or
audio.

## Post-production

1. Reject any result with eyelid, second-eye, foot, toe or baseline drift.
2. Extract the border-connected near-white background while preserving the
   enclosed white eye.
3. Composite onto exact product yellow `#FCB400`.
4. Export H.264 MP4 and a final-frame poster.
5. Keep a transparent WebM only as a fallback if needed.
