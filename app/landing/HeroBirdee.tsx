"use client";

import { useEffect, useRef, useState } from "react";

const ENTRANCE = "/media/landing-video-lab/hero-birdee-seedance-v4-entrance-alpha.webm";
const HOVER_LOOP = "/media/landing-video-lab/hero-birdee-seedance-v4-hover-loop-alpha.webm";

/* Birdee flies in from the right once, then settles into a hover loop.
   Alpha WebM only, matching the design: the paired .mp4 files in public/ carry
   no alpha channel and would render an opaque plate over the hero curve. She is
   decorative (this layer is aria-hidden), so when the WebM cannot decode the
   hero simply renders without her.

   The entrance carries no poster on purpose. Its poster frame is Birdee
   *already landed*, so showing it before playback put her at centre, then the
   video snapped her back to the right edge to fly in.

   The loop also has no poster. A static substitute can paint before the video
   decoder is ready, which makes Birdee appear in her landed pose ahead of the
   entrance. The layer remains transparent until real video frames are ready.

   Handoff order matters and is copied from /landing-video-lab: park the loop on
   frame 0, swap, and only then start it moving. Starting playback before the
   swap lets the loop advance while hidden, so the cut lands on a pose Birdee has
   already moved past — visible as a flicker. */
export function HeroBirdee() {
  const entranceRef = useRef<HTMLVideoElement>(null);
  const loopRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<"entrance" | "loop">("entrance");

  useEffect(() => {
    const entrance = entranceRef.current;
    if (!entrance) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Hold the landed pose without ever animating into it.
      const holdLandedPose = () => {
        entrance.currentTime = Math.max(0, entrance.duration - 0.05);
      };
      if (entrance.readyState >= 1) holdLandedPose();
      else entrance.addEventListener("loadedmetadata", holdLandedPose, { once: true });
      return;
    }

    void entrance.play().catch(() => {
      // Autoplay refused: she stays on her first frame, off at the right edge.
    });
  }, []);

  const handOffToLoop = () => {
    const loop = loopRef.current;
    if (!loop) return;

    // Park on the opening frame — the same landed pose the entrance just ended
    // on — while the loop is still hidden.
    loop.pause();
    loop.currentTime = 0;
    setMode("loop");

    // Begin the bob only once the swap has had a frame to paint.
    requestAnimationFrame(() => {
      void loop.play().catch(() => {
        // Frame 0 is the landed pose, so a blocked loop still leaves Birdee
        // perched exactly where the entrance set her down.
      });
    });
  };

  return (
    <div className="lb-hero__birdlayer" data-mode={mode} aria-hidden="true">
      <video
        ref={entranceRef}
        className="lb-hero__bird lb-hero__bird--entrance"
        muted
        playsInline
        preload="auto"
        src={ENTRANCE}
        onEnded={handOffToLoop}
      />

      <video
        ref={loopRef}
        className="lb-hero__bird lb-hero__bird--loop"
        muted
        playsInline
        loop
        preload="auto"
        src={HOVER_LOOP}
      />
    </div>
  );
}
