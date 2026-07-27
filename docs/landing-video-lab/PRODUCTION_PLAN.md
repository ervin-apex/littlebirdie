# Little Birdee Landing Video Lab

Status: Seedance v4 faster entrance and exact-frame hover handoff are integrated and verified
Last updated: 2026-07-27
Owner route: `/landing-video-lab`

This document is the single source of truth for the new motion-led Little Birdee landing-page experiment. Update it whenever a reference, prompt, generation, implementation decision, or test result changes.

## Objective

Build a fast, mobile-first, vertical landing page in which Birdee guides the reader from section to section. Birdee is generated as short, controlled video plates rather than rendered as a live WebGL model.

The page has two jobs:

1. Explain clearly what Little Birdee does.
2. Capture the waitlist.

## Current production pass

- Provider/model: Seedance 2.0 reference-to-video.
- Reference input: `design/landing-page/video-lab/references/hero-birdee-seedance-motion-reference-v2.png` only.
- Downloaded source: `960 × 960`, 24 fps, 10.054 seconds.
- Background: generated yellow-on-yellow field derived from the dedicated reference image; no chroma key or alpha layer.
- Performance: Birdee enters from the right with forceful readable wingbeats, brakes, briefly turns toward the reader, then returns to a stable left-facing hover without leaving the frame.
- Source archive: `public/media/landing-video-lab/hero-birdee-seedance-v3-source.mp4`.
- Entrance: `public/media/landing-video-lab/hero-birdee-seedance-v4-entrance.mp4`, 6.792 seconds, 1,686,367 bytes. Source frames `0–143` are accelerated from 6 seconds to 5.25 seconds; source frames `144–180` retain their original settle timing.
- Hover loop: `public/media/landing-video-lab/hero-birdee-seedance-v4-hover-loop.mp4`, 2.375 seconds, 558,846 bytes. It uses source frames `180–235` and appends source frame `180` as the closing boundary frame.
- Poster: `public/media/landing-video-lab/hero-birdee-seedance-v4-poster.webp`, 27,090 bytes.
- Cleanup: the bottom-right `AI generated` mark is removed with `delogo=x=676:y=858:w=260:h=76`; Birdee's full 960 × 960 flight path remains uncropped.
- Playback: the entrance and loop are separate preloaded video layers. The entrance ends on source frame `180`, which is also the first and final frame of the hover asset. The page selects the paused first hover frame, switches layers instantly with no opacity transition, then begins hover playback on the next animation frame.
- Audio: omitted from the production files. The videos autoplay muted; any chirp will be added later as an intentional user-triggered sound.
- Responsive rule: the square master fills the diagonal yellow desktop media field and the full-width yellow mobile media stage. Birdee remains clear of real HTML copy and controls.
- The white/paper half of the hero remains live HTML/CSS. It is not part of the generated video and therefore cannot create keying or blend-mode edge problems.
- No chroma key, alpha video, `mix-blend-darken`, or generated website text is used in this pass.
- The current route uses this production pass. The older v1/v2/v3 and Wan assets remain archived for comparison only.

## Locked decisions

- Keep the existing `/landing-hero-lab` route untouched for comparison.
- Build the new experiment at `/landing-video-lab`.
- Keep a conventional vertical scroll. Do not use a horizontal-scroll site.
- Birdee is the connective tissue, but profit information and page copy stay in charge.
- All headlines, copy, buttons, inputs, cards, numbers, and UI are real HTML/CSS.
- Generated media contains Birdee and simple physical props only. It must not contain website text, UI, charts, logos, or fake controls.
- Prove the hero first before generating the other five sections.
- Use short, silent, locked-camera clips suitable for scroll-controlled playback or restrained looping.
- Every clip needs a still poster. `prefers-reduced-motion` uses the poster and no scrubbed animation.
- Start with the trial's 720p output. Do not upscale or generate all sections until the hero art direction is approved.

## Brand guardrails

Source of truth: `Little Birdee - Brand Identity Pack.pdf`, especially pages 5–19.

- Feel: cheeky, warm, plain-spoken, playful, confident, encouraging.
- Never: corporate, preachy, jargon-heavy, slick, judgy, or accountanty.
- Birdee: round, chunky, huggable; soft shapes; large expressive eyes; yellow body; deep-gold beak and feet; subtle sculpted texture and shadow.
- Birdee is cute but not babyish—roughly halfway to Duolingo's cartooniness.
- Motion is small, rewarding, and game-like. It should feel alive without getting in the way.
- One clear message per section.
- Hero line is always `Improve yr profit.`
- Display/headings: Poppins ExtraBold/Bold.
- Body/UI: Nunito, with Lato only as a fallback.
- Brand yellow: `#fcb400`; ink: `#10203c`; paper: `#f9f9f9`; yellow soft: `#fff5d6`.
- Green `#287a53` and red `#c94b43` are reserved for profit meaning, never decoration.

## Reference policy

The current `public/brand` renders are source material for Birdee's identity, proportions, finish, and approved emotional range. They are not complete video frames and should not be sent to the video model as a random mixed bundle.

Before video generation, create a small canonical motion reference pack from the approved identity inputs:

1. `birdee-motion-identity-sheet-v1.png` — neutral Birdee shown front, left three-quarter, side, and right three-quarter on a plain warm-paper background.
2. `hero-entrance-start-v1.png` — Birdee entering from the upper-right, body and gaze facing left toward the headline.
3. `hero-hover-end-v1.png` — Birdee settled in a soft hover beside the copy, still facing toward the message.

These new files must preserve one consistent body shape, eye size, beak length, wing anatomy, material, colour, and lighting. Only after they pass visual review should they be used as Seedance references.

Approved canonical sheet:

- `design/landing-page/video-lab/references/birdee-motion-identity-sheet-v1.png`
- Approved by the user on 2026-07-23.
- Approved qualities: sculpted finish, warm-paper field, stable proportions, clear front view, consistent lighting, and clean full-body spacing.
- Known limitation accepted at this stage: one requested left-facing view reads as a rear three-quarter angle. The dedicated hero frames establish the required left-facing flight view.

Hero keyframe explorations retained as look references:

- `design/landing-page/video-lab/references/hero-entrance-start-v1.png`
- `design/landing-page/video-lab/references/hero-hover-end-v1.png`
- Both preserve the approved left-facing flight treatment.
- Do not upload them as Seedance start and end frames. Their positions are too similar and would over-constrain the generated motion.
- Use only `hero-entrance-start-v1.png` as a character/reference image, not as a literal first frame.

### Approved identity inputs

| File | Use | Status |
| --- | --- | --- |
| `public/brand/birdee-reference-neutral-v1.png` | Primary body proportions, resting character, sculpted texture | Approved |
| `public/brand/birdee-reference-welcome-v1.png` | Flight silhouette and open-wing anatomy | Approved |
| `public/brand/birdee-reference-profit-v1.png` | Cheer pose and positive emotional range | Approved |
| `public/brand/birdee-reference-concerned-v1.png` | Calm concern for the problem section; never panic | Approved |
| `public/brand/birdee-reference-business-v1.png` | Prop interaction and guide behaviour | Approved with caution: do not inherit the clipboard |
| `tmp/pdfs/birdee-brand-pack/pages-11-19-contact-sheet.png` | Palette, type, layout, mascot, and motion rules | Approved as direction only |

### Supporting mood inputs

The following may help validate a specific expression, but should not be mixed into the first hero identity pass:

- `public/brand/birdee-reference-loss-v1.png`
- `public/brand/birdee-setup-revenue-v1.png`
- `public/brand/birdee-setup-wages-v1.png`
- `public/brand/birdee-setup-cogs-v1.png`
- `public/brand/birdee-setup-other-costs-v1.png`
- `public/brand/birdee-happy.png`
- `public/brand/birdee-worried.png`

### Rejected references

These must not be uploaded or used as visual references:

| File | Reason |
| --- | --- |
| `design/landing-page/direction-1-birdee-as-guide-web/03-hero-web-reference-yellow-path-left-hover.png` | Full-page concept, not a clean character reference; it would bake layout, typography, and an earlier Birdee treatment into the generated media |
| `public/brand/birdee-production-v2-hero-fallback.png` | Fallback from the retired live-3D approach; not the approved identity source for this video route |
| `public/brand/birdee-hero.png` | Older flat/vector hummingbird and chart composition; conflicts with the sculpted 3D mascot in the identity pack |
| `public/brand/birdee-flap-1.png` | Older flat/vector character system |
| `public/brand/birdee-flap-2.png` | Older flat/vector character system |
| `public/brand/birdee-flap-3.png` | Older flat/vector character system |

The rejected Higgsfield selection was never submitted. No upload agreement was accepted and no generation was produced from it.

## Page and motion plan

### 1. Hero

Copy:

- Eyebrow: `Little Birdee`
- Headline: `Improve yr profit.`
- Sub-line: `See your profit before and as it happens — using the numbers already in your business. For less than two coffees a week.`
- CTA: `Get on the list`

Birdee action:

- Enters from upper-right on a shallow yellow curve.
- Faces left toward the headline during the entrance.
- Eases into a hover beside the copy.
- Two restrained wing beats, a small body bob, one blink, and a tiny pleased lift when the sub-line resolves.
- No dramatic camera move, orbit, zoom, confetti, coins, charts, or text inside the video.

Landing/continuation:

- Birdee does not land in the hero.
- No visible flight path or dashed trajectory is drawn on the website.
- Continuity into the next section comes from matched exit and entrance direction, not a decorative line.

### 2. The problem

Copy: `Your accountant's great. Just… slow.`

Birdee action:

- Glances at a small physical desk calendar that turns to `10`.
- Patient, knowing side-eye; never angry, anxious, or distressed.
- Holds the reaction briefly, then looks down-page.

### 3. How it works

Copy: `Four numbers. One answer.`

Birdee action:

- Three short hops across simplified physical stepping stones.
- Step one represents revenue.
- Step two groups wages, cost of goods, and the rest.
- Step three represents profit and lights green only when Birdee lands.
- The actual explanatory labels and numbers remain HTML outside the video.

### 4. What's different

Copy: `Two things we do that nobody else does.`

Birdee action:

- Nudges a chunky `what if` lever; simple number tiles shift.
- Then points to a separate `what happened` panel.
- Props can use simple icons, but no legible generated text.
- Expression: curious, capable, slightly cheeky.

### 5. Pricing

Copy: `About two coffees a week.`

Birdee action:

- Sets two warm takeaway coffee cups on a bench beside the real HTML price.
- Small satisfied look to camera.
- No pricing table and no generated currency text.

### 6. Waitlist

Copy:

- Headline: `Don't know if you made money yesterday? Let's fix that.`
- CTA: `Get on the list`
- Confirmation: `You're in. Birdee will chirp when we're ready.`

Birdee action:

- Faces the reader beside the real HTML email field.
- On successful submit: one chirp-like beak motion, two quick flaps, and a pleased settle.
- No looping attention grab after confirmation.

## Scene-transition system

Do not attempt one continuous transparent Birdee layer across the whole page. Each section owns a short clip rendered or precomposited against that section's exact background.

Every section clip follows the same three-beat structure:

1. **Entrance:** Birdee enters from the same edge and direction used by the previous clip's exit.
2. **Reaction:** Birdee performs one clear section-specific action and holds briefly.
3. **Exit:** During the final 15–20% of the section, Birdee moves toward an edge, behind a card, or outside the reader's focal area.

Transition rules:

- Match direction, approximate scale, and velocity between outgoing and incoming clips.
- Hide cuts near a viewport edge, behind a section card, or during a full-bleed background change.
- Use a restrained 160–240 ms opacity handoff only when both clips share the exact same background colour.
- Never crossfade two differently coloured precomposited backgrounds.
- Load only the current and next clips.
- Reduced motion uses the reaction poster and an immediate section change.
- The reader should feel that Birdee continued travelling; Birdee does not need to be physically visible between every section.

## Hero generation workflow

### Stage A — Generate the canonical identity sheet

Use only the approved sculpted 3D identity inputs. Create a neutral turnaround/reference image, not a website composition.

Prompt:

> Create a clean character turnaround sheet for Little Birdee, the exact same small sculpted 3D yellow bird in every view. Show front, left three-quarter, clean side profile, and right three-quarter views. Preserve the round chunky huggable body, large expressive black-and-white eyes, short deep-gold beak and feet, layered soft wings, subtle tactile feather texture, and warm studio lighting from the supplied references. Cute but not babyish, playful and handmade rather than glossy or corporate. Plain warm paper background, even scale, full body visible, generous spacing, no text, no logo, no props, no chart, no coins, no accessories.

Negative constraints:

> No hummingbird silhouette, no long needle beak, no vector art, no flat icon, no photoreal animal, no extra limbs, no mismatched eyes, no eyelashes, no clothing, no clipboard, no typography, no UI, no dramatic cinematic background, no plastic toy gloss.

### Stage B — Select one character reference

Use:

- `design/landing-page/video-lab/references/hero-entrance-start-v1.png`

Upload it through Seedance's character/reference-image input. Do not assign it as the first frame and do not supply an end frame. The image establishes Birdee's identity, sculpted finish, left-facing direction, and flight anatomy; the prompt establishes motion, position, and background.

Why:

- A start/end pair encourages interpolation and produced too little travel.
- A single character reference gives Seedance room to create a real entrance while still anchoring identity.
- The old hover frame remains useful for judging the intended final pose, but is not a generation input.

### Stage C — Animate with Seedance

Preferred trial model: `Seedance 2.0 Std/Fast Unlimited`, 720p, reference-to-video mode.

Motion prompt:

> Use the supplied image only as the exact Little Birdee character reference, not as the first frame or composition. Locked camera, 16:9, one continuous five-second shot. The entire background is a perfectly flat uniform chroma blue #0000FF with no gradient, texture, shadow, floor, horizon, reflection, or lighting change. At 0.0 seconds the frame is almost empty: only part of Birdee's raised wing and head begin to appear beyond the upper-right edge; Birdee's centre is approximately x=94%, y=18%. From 0.0–2.2 seconds, the exact supplied Birdee flies diagonally down-left into frame while facing left, with two soft readable wing beats. From 2.2–3.5 seconds, Birdee decelerates along a shallow curve. By 3.5 seconds Birdee's centre settles at approximately x=74%, y=48%, fully visible on the right side and looking left toward the empty copy area. From 3.5–5.0 seconds, Birdee holds a gentle hover with one small body bob and one natural blink. Preserve the exact character design, proportions, yellow colour, short beak, eyes, wing anatomy, feet, tail, tactile sculpted material, and warm lighting. Motion is warm, playful, restrained, and readable on a phone.

Negative constraints:

> No camera movement, no pan, no zoom, no cut, no white or paper background, no blue spill or blue rim light on Birdee, no rotation to face right, no morphing, no body redesign, no duplicated wings or feet, no new objects, no text, no logos, no particles, no coins, no graphs, no scenery, no cast shadow, no talking, no audio, no exaggerated bouncing, no frantic flapping.

Target:

- Duration: 4–5 seconds.
- Aspect: 16:9 chroma-key character plate.
- Start position: centre at approximately `x=94%`, `y=18%`; mostly outside the upper-right frame.
- Hover position: centre at approximately `x=74%`, `y=48%`; fully visible at centre-right.
- Travel: an obvious diagonal down-left movement of roughly `20vw` and `30vh`.
- Loop: first hero version does not need a perfect infinite loop; it may play once and settle.
- Post-production: key out `#0000FF`, inspect edges and blue spill, then export a transparent WebM plus a still poster. Do not show the chroma colour on the live page.

## Web integration plan

Suggested asset paths:

```text
design/landing-page/video-lab/references/
  birdee-motion-identity-sheet-v1.png
  hero-entrance-start-v1.png
  hero-hover-end-v1.png

public/media/landing-video-lab/
  hero-birdee-seedance-v1-source.mp4
  hero-birdee-v1-paper.mp4
  hero-birdee-v1.webm
  hero-birdee-v1-poster.webp
```

Implementation:

- Native `<video muted playsInline preload="auto">`.
- WebM plus MP4 fallback.
- Load the hero immediately; lazy-load section clips close to the viewport.
- Use poster images before playback and for reduced motion.
- Scroll should cue or scrub only when it improves the handoff. Do not force the reader to scrub every wing beat.
- Crop and position with CSS so the character remains separate from real copy and controls.
- Keep DOM text selectable and accessible.

Initial performance targets:

- Hero poster: ideally under 120 KB.
- Hero video: ideally under 1.2 MB on the first approved pass.
- Later section clips: ideally under 800 KB each.
- No more than the current section plus the next section loaded on mobile.
- Avoid autoplaying multiple off-screen videos.

## Generation log

| Date | Tool/model | Inputs | Result |
| --- | --- | --- | --- |
| 2026-07-27 | Offline FFmpeg timing and boundary refinement | v3 Seedance source plus the accepted v3 timing | Shortened the entrance by 0.708 seconds while retaining the original final settle, forced the shared source frame `180` at the entrance/hover boundary, appended the same frame to close the hover loop, increased boundary encoding quality, and removed the 160 ms CSS crossfade. |
| 2026-07-24 | Seedance 2.0 reference-to-video, 960p square, 10 seconds | Single yellow-background reference: `hero-birdee-seedance-motion-reference-v2.png`; time-coded entrance, viewer acknowledgement, and no-exit hover prompt | Strong entrance wingbeats and reader acknowledgement succeeded. Birdee remained on-screen. Source was split into a 7.5-second entrance and a matching 2.333-second hover loop, the generator mark was removed without cropping, and both layers were integrated with a 160 ms handoff. |
| 2026-07-23 | Seedance reference-to-video, 960p square, 5 seconds | Single character reference: `hero-entrance-start-v1.png`; explicit full upstroke/downstroke prompt on flat `#FCB400` | Wing motion succeeded. Archived source, removed the bottom AI mark with a centred square crop, trimmed the stationary ending at 3.84 seconds, and produced the clean v2 candidate plus poster. |
| 2026-07-23 | Wan website, Wan2.7 Reference mode, 1080p, 1:1, 10 seconds | Single character reference: `hero-entrance-start-v1.png`; flat `#FCB400` entrance-and-hover prompt | Completed and downloaded as `hero-birdee-wan-v1-source.mp4`; rejected because the character translated across the frame but the raised wings remained effectively frozen. |
| 2026-07-23 | Higgsfield MCP, Seedance recommendation | Earlier landing concepts | API generation blocked with `only_website_usage_on_trial_is_available` |
| 2026-07-23 | Higgsfield website | Two now-rejected files | Stopped at first-upload agreement; agreement not accepted, upload not submitted, no generation |
| 2026-07-23 | Built-in image generation, first identity-sheet pass | Neutral, welcome, and profit sculpted Birdee renders | Material and proportions were strong; view ordering drifted and duplicated a right-facing angle |
| 2026-07-23 | Built-in image generation, targeted angle correction | First pass plus neutral sculpted Birdee render | Saved as `birdee-motion-identity-sheet-candidate-v1.png`; still contains a rear three-quarter interpretation and requires visual approval or another correction |
| 2026-07-23 | User review | `birdee-motion-identity-sheet-candidate-v1.png` | Identity approved and promoted to `birdee-motion-identity-sheet-v1.png` |
| 2026-07-23 | Built-in image generation, hero start keyframe | Canonical identity sheet plus approved welcome/flight render | Generated `hero-entrance-start-v1.png`: Birdee enters upper-right, faces left, raised wing, clean copy space |
| 2026-07-23 | Built-in image generation, matched hero end keyframe | Hero start frame plus canonical identity sheet | Generated `hero-hover-end-v1.png`: same Birdee settles slightly down-left with a calmer mid-beat wing |
| 2026-07-23 | Direction review | Hero start/end keyframe pair | Pair judged too positionally similar for an entrance; switched to one character reference plus a time-coded Seedance prompt and chroma-blue output |
| 2026-07-23 | Built-in image generation, attempted chroma start-frame revision | Hero start frame plus canonical identity sheet | Aborted by user before completion; no project asset produced |
| 2026-07-23 | Higgsfield website, Seedance 2.0, Unlimited, 720p, 16:9, 8 seconds | Single character reference: `hero-entrance-start-v1.png`; time-coded blue-screen motion prompt | Generation completed. Asset ID: `336846bc-7d63-4167-8470-62cb40975e07`. It produced a clear upper-right entrance, diagonal travel, two readable wing states, and a stable left-facing hover. |
| 2026-07-23 | Offline keying with FFmpeg | Raw Seedance source, sampled blue midpoint `#128BD3` | Accepted key: `colorkey=0x128BD3:0.26:0.04`, alpha extraction plus one-pixel erosion, then blue despill `mix=0.65:expand=0.15`. The erosion removed the remaining blue fringe from Birdee's yellow edge. |
| 2026-07-23 | Next.js integration | Transparent WebM, paper MP4 fallback, alpha WebP poster | New six-section route built at `/landing-video-lab`. Existing `/landing-hero-lab` remains untouched. Hero uses generated motion; later sections use only approved sculpted brand renders until their individual motion plates are worth producing. |

## Current accepted hero output — 2026-07-27

Final live assets:

| File | Purpose | Size |
| --- | --- | ---: |
| `public/media/landing-video-lab/hero-birdee-seedance-v4-entrance.mp4` | Faster entrance, braking action, and one-time viewer acknowledgement | 1,686,367 bytes |
| `public/media/landing-video-lab/hero-birdee-seedance-v4-hover-loop.mp4` | Exact-boundary continuous hover after the entrance completes | 558,846 bytes |
| `public/media/landing-video-lab/hero-birdee-seedance-v4-poster.webp` | Loading, boundary, and reduced-motion still | 27,090 bytes |
| `public/media/landing-video-lab/hero-birdee-seedance-v3-source.mp4` | Unmodified downloaded source archive | 4,330,678 bytes |

The route uses two stacked native video elements. Both are preloaded. The entrance plays once and ends on the hover's exact source boundary frame. The page switches instantly to the paused matching hover frame, then starts the loop on the following animation frame. There is no opacity transition. On `prefers-reduced-motion: reduce`, both videos are hidden and paused and the v4 poster is shown.

The full hero remains a live responsive webpage: logo, navigation, typography, CTA, badge, diagonal split, white/paper copy field, and yellow media field are HTML/CSS. Only Birdee and the yellow-on-yellow media texture are generated.

## Superseded keyed hero output — 2026-07-23

Higgsfield generation:

- Model: Seedance 2.0.
- Website mode: Unlimited.
- Output: 720p, 16:9, 8 seconds.
- Generation asset ID: `336846bc-7d63-4167-8470-62cb40975e07`.
- Reference input: `design/landing-page/video-lab/references/hero-entrance-start-v1.png` only.
- Raw download: `public/media/landing-video-lab/hero-birdee-seedance-v1-source.mp4`.
- The model returned a blue gradient rather than the requested pure `#0000FF`; this is why the final key uses the sampled midpoint rather than the prompt colour.

Final live assets:

| File | Purpose | Size |
| --- | --- | ---: |
| `public/media/landing-video-lab/hero-birdee-v4-paper.mp4` | Primary 1080p H.264 plate precomposited on `#fff5d6`; avoids moving alpha-channel shimmer | 1,616,148 bytes |
| `public/media/landing-video-lab/hero-birdee-v3.webm` | 1080p transparent VP9 alpha hero plate with refined edge matte | 1,975,847 bytes |
| `public/media/landing-video-lab/hero-birdee-v3-poster.webp` | 1080p reduced-motion and loading poster | 66,392 bytes |

The live hero plays once and holds the final frame. It does not loop. On `prefers-reduced-motion: reduce`, the video is hidden, paused at a safe point, and replaced with the still poster.

Edge refinement on 2026-07-23:

- The first 720p matte showed stair-stepping when enlarged to the desktop hero.
- The accepted v3 pass upscales colour and alpha separately to 1920 × 1080 with Lanczos before edge operations.
- The alpha receives two one-pixel high-resolution erosions followed by `gblur=sigma=1.45`.
- Blue despill is `mix=0.8:expand=0.2`.
- This removes the blue fringe and replaces the hard binary edge with a restrained sub-pixel feather.
- The v4 primary MP4 supersamples the key at 3840 × 2160, composites onto the exact hero colour, then downsamples to 1920 × 1080.
- The live page prefers the v4 MP4 so motion does not depend on a separately compressed VP9 alpha plane.
- The v3 WebM remains only as a fallback; the v3 poster remains the reduced-motion still.

## Implemented route

Route files:

- `app/landing-video-lab/page.tsx`
- `app/landing-video-lab/LandingVideoLab.tsx`
- `app/landing-video-lab/HeroBirdeeMedia.tsx`
- `app/landing-video-lab/VideoWaitlistForm.tsx`
- `app/landing-video-lab/video-lab.css`

Sections:

1. Hero with separate Seedance entrance and hover-loop layers plus real HTML copy.
2. Problem with the calendar and approved concerned Birdee render.
3. How it works with revenue, costs, and profit cards; Birdee never obscures the profit answer.
4. What's different with HTML/CSS `what if` and `what happened` tools.
5. Pricing with the coffee-bench scene.
6. Waitlist with real validation, success state, and a restrained CSS chirp response.

## Verification record

Verified on 2026-07-27:

- `npm.cmd run build`: successful; `/landing-video-lab` statically prerendered at 6.53 kB route code / 109 kB first load.
- `npx.cmd tsc --noEmit`: successful.
- Entrance duration is 6.792 seconds, 0.708 seconds shorter than v3.
- The first 6 seconds of source motion are compressed to 5.25 seconds; the final 1.542-second settle retains its original speed and pose.
- The entrance ends on source frame `180`; the hover starts and closes on that same frame.
- Browser handoff sampled every 16 ms: opacity switches directly from entrance `1` / loop `0` to entrance `0` / loop `1`, with no intermediate opacity values. Hover playback begins at `0.001` seconds.
- Camera acknowledgement remains readable at approximately 4.8 seconds.
- Mobile verified at 390 × 844 with no horizontal overflow; the handoff completes with both video layers fully buffered.

Verified on 2026-07-24:

- `npm.cmd run build`: successful; `/landing-video-lab` statically prerendered at 6.52 kB route code / 109 kB first load.
- `npx.cmd tsc --noEmit`: successful.
- Desktop inspected at the approved reference viewport, 1536 × 1024. The diagonal composition, wordmark, copy, CTA, badge, and hovering Birdee align with the approved full-bleed reference.
- Mobile inspected at 390 × 844. The media becomes a full-width yellow stage above the copy, Birdee remains completely visible, and document width equals viewport content width with no horizontal overflow.
- Runtime handoff sampled every 80 ms: the hover video had `readyState=4` before the entrance ended, then the two layers crossfaded from `1/0` opacity to `0/1` over 160 ms.
- After the handoff, the entrance is paused at exactly 7.5 seconds and the 2.333-second hover asset loops continuously.
- Browser console: no errors or warnings.
- Generator mark is absent from the processed entrance, loop, and poster without cropping Birdee's leftward entrance.
- Reduced-motion behavior remains poster-only.

Verified on 2026-07-23:

- `npm.cmd run build`: successful; `/landing-video-lab` statically prerendered.
- Route and all three live hero assets return HTTP `200`.
- Desktop: inspected hero and every section at a 1920 × 953 browser viewport.
- Mobile: inspected at an actual CDP-emulated 390 × 844 viewport; document width equals viewport width with no horizontal overflow.
- Mobile media correction: Tailwind's global `max-width: 100%` was capping the 180vw hero plate. The route now sets `max-width: none` for the mobile hero video and poster.
- Information hierarchy correction: the How It Works Birdee was moved so its wing no longer covers the profit figure.
- Reduced motion: video display is `none`, poster display is `block`, and playback is paused.
- Waitlist invalid state: `Pop a real email in first.`
- Waitlist success state: button disables, the message reads `You're in. Birdee will chirp when we're ready.`, and the chirp badge appears.
- Optimized first-load route code reported by the production build: approximately 6.52 kB route code / 109 kB first load.

## Resume here

The approved full-bleed hero and the complete page shell are live at `/landing-video-lab`. The hero now has a one-time entrance, a brief reader acknowledgement, and a continuous hover loop. Keep `/landing-hero-lab` untouched as the comparison route.

If the direction is approved, generate later section clips one at a time in this order:

1. Problem: knowing glance at the `10` calendar.
2. How it works: three hops, ending in the green profit state.
3. Waitlist: short chirp/flap confirmation.
4. What's different: lever nudge and panel point.
5. Pricing: two coffee cups on the bench.

For every later clip:

- Use one approved clean Birdee reference, not a mixed reference bundle.
- Keep the camera locked and the background keyable.
- Generate only Birdee and physical props; keep all explanatory text and numbers in HTML.
- Key, compress, add a poster, test at 390 × 844, and verify that Birdee never covers the answer.
