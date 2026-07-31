"use client";

import { useEffect, useRef, useState } from "react";

export function HeroBirdeeMedia() {
  const entranceRef = useRef<HTMLVideoElement>(null);
  const loopRef = useRef<HTMLVideoElement>(null);
  const [loopActive, setLoopActive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const startHoverLoop = () => {
    const loop = loopRef.current;
    if (!loop) return;

    loop.pause();
    loop.currentTime = 0;
    setLoopActive(true);

    requestAnimationFrame(() => {
      if (reducedMotion) return;

      void loop.play().catch(() => {
        // The exact matching hover frame remains visible if playback is blocked.
      });
    });
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setReducedMotion(mediaQuery.matches);

    syncMotionPreference();
    mediaQuery.addEventListener("change", syncMotionPreference);

    return () => {
      mediaQuery.removeEventListener("change", syncMotionPreference);
    };
  }, []);

  useEffect(() => {
    const entrance = entranceRef.current;
    const loop = loopRef.current;
    if (!entrance || !loop) return;

    if (reducedMotion) {
      entrance.pause();
      loop.pause();
      return;
    }

    const activeVideo = loopActive ? loop : entrance;
    void activeVideo.play().catch(() => {
      // The current frame remains a complete fallback when autoplay is blocked.
    });
  }, [loopActive, reducedMotion]);

  return (
    <div className="vlab-hero-media">
      <video
        ref={entranceRef}
        className={`vlab-hero-video vlab-hero-video-entrance${
          loopActive ? " is-finished" : ""
        }`}
        autoPlay
        muted
        playsInline
        aria-hidden="true"
        preload="auto"
        poster="/media/landing-video-lab/hero-birdee-seedance-v4-alpha-poster.webp"
        onEnded={startHoverLoop}
      >
        <source
          src="/media/landing-video-lab/hero-birdee-seedance-v4-entrance-alpha.webm"
          type="video/webm"
        />
        <source
          src="/media/landing-video-lab/hero-birdee-seedance-v4-entrance.mp4"
          type="video/mp4"
        />
      </video>

      <video
        ref={loopRef}
        className={`vlab-hero-video vlab-hero-video-loop${
          loopActive ? " is-active" : ""
        }`}
        muted
        playsInline
        aria-hidden="true"
        preload="auto"
        loop
        poster="/media/landing-video-lab/hero-birdee-seedance-v4-alpha-poster.webp"
      >
        <source
          src="/media/landing-video-lab/hero-birdee-seedance-v4-hover-loop-alpha.webm"
          type="video/webm"
        />
        <source
          src="/media/landing-video-lab/hero-birdee-seedance-v4-hover-loop.mp4"
          type="video/mp4"
        />
      </video>

      <img
        className="vlab-hero-poster"
        src="/media/landing-video-lab/hero-birdee-seedance-v4-alpha-poster.webp"
        alt=""
      />
    </div>
  );
}
