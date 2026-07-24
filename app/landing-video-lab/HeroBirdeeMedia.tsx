"use client";

import { useEffect, useRef, useState } from "react";

export function HeroBirdeeMedia() {
  const entranceRef = useRef<HTMLVideoElement>(null);
  const loopRef = useRef<HTMLVideoElement>(null);
  const [loopActive, setLoopActive] = useState(false);

  const startHoverLoop = () => {
    const loop = loopRef.current;
    if (!loop) return;

    loop.currentTime = 0;
    void loop.play().then(
      () => setLoopActive(true),
      () => {
        // The entrance holds its final matching frame if playback is blocked.
      },
    );
  };

  useEffect(() => {
    const entrance = entranceRef.current;
    const loop = loopRef.current;
    if (!entrance || !loop) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const syncMotionPreference = () => {
      if (reducedMotion.matches) {
        entrance.pause();
        loop.pause();
        setLoopActive(false);
        return;
      }

      loop.pause();
      loop.currentTime = 0;
      entrance.currentTime = 0;
      setLoopActive(false);
      void entrance.play().catch(() => {
        // The poster remains a complete fallback when autoplay is unavailable.
      });
    };

    syncMotionPreference();
    reducedMotion.addEventListener("change", syncMotionPreference);

    return () => {
      reducedMotion.removeEventListener("change", syncMotionPreference);
    };
  }, []);

  return (
    <div className="vlab-hero-media" aria-hidden="true">
      <video
        ref={entranceRef}
        className={`vlab-hero-video vlab-hero-video-entrance${
          loopActive ? " is-finished" : ""
        }`}
        autoPlay
        muted
        playsInline
        preload="auto"
        poster="/media/landing-video-lab/hero-birdee-seedance-v3-poster.webp"
        onEnded={startHoverLoop}
      >
        <source
          src="/media/landing-video-lab/hero-birdee-seedance-v3-entrance.mp4"
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
        preload="auto"
        loop
      >
        <source
          src="/media/landing-video-lab/hero-birdee-seedance-v3-hover-loop.mp4"
          type="video/mp4"
        />
      </video>

      <img
        className="vlab-hero-poster"
        src="/media/landing-video-lab/hero-birdee-seedance-v3-poster.webp"
        alt=""
      />
    </div>
  );
}
