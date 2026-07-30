# Auth Birdee Seedance handoff v2

## Reference

`references/auth-birdee-seedance-reference-v2.png`

Use the image as the first-frame image input. Do not add an end-frame image.

## Configuration

- Model: Seedance 2.0
- Mode: image-to-video / first frame
- Aspect ratio: 1:1
- Duration: 5 seconds
- Resolution: 720p for the first review; highest available after approval
- Frame rate: 24 fps
- Camera: locked
- Motion strength: low
- Subject or image adherence: high
- Audio: off
- Variants: 3

If the interface does not expose a named motion-strength or adherence control,
use the closest low-motion and high-reference-fidelity settings available.

## Prompt

Use the supplied image as the exact first frame and exact Little Birdee
character reference. Locked camera, square 1:1, one continuous five-second
shot.

Birdee remains standing in precisely the same position and at precisely the
same scale for the entire shot. Both orange feet remain fully planted on the
same invisible horizontal baseline. Every toe stays locked in place with no
sliding, lifting, curling or deformation.

Create only a calm, restrained idle:

- from 0.0–1.5 seconds, a barely visible chest breath;
- around 1.6–2.1 seconds, one natural blink;
- from 2.2–3.2 seconds, one very small attentive head tilt down-left toward the
  form;
- from 3.2–4.5 seconds, gently return to the exact starting head angle;
- from 4.5–5.0 seconds, hold the original pose.

Preserve the exact round body, single visible glossy eye, short orange beak,
orange legs and feet, tucked wings, layered tail feathers, warm golden-yellow
colour, tactile feather texture and soft studio lighting of the supplied
image. Keep the beak closed and the expression reassuring and quietly
friendly.

The entire background remains a uniform near-white paper field with no floor,
horizon, texture, gradient, vignette, lighting change, reflection, cast shadow
or contact shadow.

The first and final pose must match as closely as possible.

No camera movement, pan, zoom, crop change, body translation, body rotation,
hopping, walking, flying, bouncing, wing opening, wing flapping, speaking,
beak opening, foot movement, toe deformation, extra limbs, extra toes,
morphing, character redesign, props, perch, shelf, text, logo, watermark or
audio.

## Post-production

1. Extract the near-white border-connected background while preserving
   enclosed white details such as the eye.
2. Review the matte frame by frame for foot-edge stability.
3. Composite the cleaned result onto exact product yellow `#FCB400`.
4. Export an H.264 MP4 for the live page.
5. Export a still poster from the final resting frame.
6. Keep a transparent WebM only as a fallback if needed.
