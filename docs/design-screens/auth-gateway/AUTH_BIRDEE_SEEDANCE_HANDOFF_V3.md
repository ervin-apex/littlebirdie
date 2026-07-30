# Auth Birdee Seedance handoff v3

This pass uses two image inputs:

1. `references/auth-birdee-seedance-reference-v2.png`
   - exact first frame;
   - character, composition, feet and baseline lock.
2. `references/auth-birdee-breathing-storyboard-v1.png`
   - motion storyboard only;
   - read left to right as rest, tiny inhale, rest.

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
upload both images and address them explicitly as `@Image 1` and `@Image 2` in
the prompt.

## Prompt

`@Image 1` is the exact opening frame, exact Little Birdee character reference,
and exact composition lock.

`@Image 2` is a motion storyboard only. Read its three panels from left to
right as sequential poses of the same single Birdee: resting pose, tiny inhale
peak, resting pose. Do not render the contact sheet, panel dividers, multiple
birds or a split screen in the output.

Locked camera, square 1:1, one continuous five-second shot. Render exactly one
Birdee.

Birdee remains in precisely the same location, at precisely the same scale and
with precisely the same orientation for the entire shot. Both orange feet and
every toe remain pixel-position locked to the same invisible horizontal
baseline.

Follow only this motion:

- 0.0–1.25 seconds: hold the resting pose from the left panel of `@Image 2`;
- 1.25–2.5 seconds: slowly expand only the upper chest by approximately
  1–2 percent until it matches the centre panel of `@Image 2`;
- 2.5–3.75 seconds: slowly return only the chest to the resting pose;
- 3.75–5.0 seconds: hold the exact opening pose.

The breathing movement must come from a tiny local deformation of the upper
breast feathers. Do not scale, translate, bob or rotate the whole body.

Keep the eye fully open, bright and attentive for all five seconds. Keep the
pupil fixed. Keep the eyelid fully raised. Keep the beak closed. Keep both
wings completely tucked.

Preserve the exact round body, single visible glossy eye, short orange beak,
orange legs and feet, wing and tail anatomy, golden-yellow colour, tactile
feather texture and warm studio lighting from `@Image 1`.

The background remains a uniform near-white paper field with no floor,
horizon, gradient, vignette, lighting change, cast shadow, contact shadow or
reflection.

The final pose must match the first pose exactly.

No blink, lowered eyelid, sleepy expression, sad expression, angry expression,
head tilt, gaze change, eye movement, beak opening, speaking, foot movement,
toe deformation, body bob, hopping, walking, flying, wing movement, tail
movement, camera movement, pan, zoom, crop change, character morphing, extra
limbs, extra toes, props, perch, shelf, text, logo, watermark, split screen,
contact-sheet layout, multiple birds or audio.

## Post-production

1. Reject any result with eyelid, toe, foot or baseline drift.
2. Extract the border-connected near-white background while preserving the
   enclosed white eye.
3. Composite onto exact product yellow `#FCB400`.
4. Export H.264 MP4 and a final-frame poster.
5. Keep a transparent WebM only as a fallback if needed.
