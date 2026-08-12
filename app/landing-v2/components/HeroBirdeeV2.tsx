"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { LANDING_V2_MEDIA } from "../media";
import { useHeroMediaMode } from "../motion/useHeroMediaMode";
import { revealAfterFirstVideoFrame } from "../motion/videoReadiness";

export function HeroBirdeeV2() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const mediaMode = useHeroMediaMode();
  const richMedia = mediaMode === "rich";
  const mobileMedia = mediaMode === "mobile";
  const videoEnabled = richMedia || mobileMedia;

  useEffect(() => {
    setFailed(false);
    setReady(false);
  }, [mediaMode]);

  useEffect(() => {
    if (!videoEnabled || failed) return;
    const video = videoRef.current;
    if (!video) return;

    if (!("IntersectionObserver" in window)) {
      void video.play().catch(() => undefined);
      return;
    }

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
  }, [failed, videoEnabled]);

  const restartHover = () => {
    const video = videoRef.current;
    if (!video) return;
    // This seek stays within the same decoded media element. The browser keeps
    // the last hover frame painted while it returns to the authored hover seam.
    video.currentTime = LANDING_V2_MEDIA.hero.hoverStart;
    void video.play().catch(() => undefined);
  };

  return (
    <>
      {(richMedia || mediaMode === "still") && (
        <Image
          className="lb2-hero__bird lb2-hero__bird--still"
          data-hidden={richMedia && !failed && ready}
          src={LANDING_V2_MEDIA.hero.poster}
          alt=""
          width={1024}
          height={1024}
          priority
        />
      )}
      {videoEnabled && !failed && (
        <video
          ref={videoRef}
          className="lb2-hero__bird lb2-hero__bird--master"
          data-media-mode={mediaMode}
          data-ready={ready}
          autoPlay
          muted
          playsInline
          preload="auto"
          poster={richMedia ? LANDING_V2_MEDIA.hero.poster : undefined}
          src={
            mobileMedia
              ? LANDING_V2_MEDIA.hero.mobileMaster
              : LANDING_V2_MEDIA.hero.master
          }
          aria-hidden="true"
          tabIndex={-1}
          onLoadedData={(event) =>
            revealAfterFirstVideoFrame(event.currentTarget, () => setReady(true))
          }
          onEnded={restartHover}
          onError={() => {
            setReady(false);
            setFailed(true);
          }}
        />
      )}
    </>
  );
}
