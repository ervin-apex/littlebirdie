"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { LANDING_V2_MEDIA } from "../media";
import { usePrefersReducedMotion } from "../motion/useScrollStage";

export function HeroBirdeeV2() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          video.pause();
          return;
        }
        void video.play().catch(() => undefined);
      },
      { rootMargin: "15% 0px" },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [reduced]);

  if (reduced || failed) {
    return (
      <Image
        className="lb2-hero__bird lb2-hero__bird--still"
        src={LANDING_V2_MEDIA.hero.poster}
        alt=""
        width={1024}
        height={1024}
        priority
      />
    );
  }

  const restartHover = () => {
    const video = videoRef.current;
    if (!video) return;
    // This seek stays within the same decoded media element. The browser keeps
    // the last hover frame painted while it returns to the authored hover seam.
    video.currentTime = LANDING_V2_MEDIA.hero.hoverStart;
    void video.play().catch(() => undefined);
  };

  return (
    <video
      ref={videoRef}
      className="lb2-hero__bird lb2-hero__bird--master"
      muted
      playsInline
      preload="auto"
      poster={LANDING_V2_MEDIA.hero.poster}
      src={LANDING_V2_MEDIA.hero.master}
      aria-hidden="true"
      tabIndex={-1}
      onEnded={restartHover}
      onError={() => setFailed(true)}
    />
  );
}
