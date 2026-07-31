"use client";

import { useEffect, useRef } from "react";

/* Alpha WebM only, matching the design. The paired .mp4 in public/ has no alpha
   channel, so it would render an opaque plate over the calendar. There is no
   poster: the scene stays transparent until real video frames are available. */
export function ProblemBirdee() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      return;
    }

    void video.play().catch(() => {
      // A decoded first frame can still render; no static substitute jumps ahead.
    });
  }, []);

  return (
    <video
      ref={videoRef}
      className="lb-problem__birdee"
      muted
      playsInline
      preload="auto"
      src="/media/landing-video-lab/problem-birdee-seedance-v2-alpha.webm"
    />
  );
}
