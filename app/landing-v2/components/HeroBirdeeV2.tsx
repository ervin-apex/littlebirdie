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
  const [mobilePhase, setMobilePhase] = useState<"entrance" | "hover">("entrance");
  const mediaMode = useHeroMediaMode();
  const richMedia = mediaMode === "rich";
  const mobileMedia = mediaMode === "mobile";
  // The authored WebM is yuv420p and therefore has no real alpha channel.
  // Keep it on the desktop composition where its canvas blends into the hero,
  // but never hand it to iOS/mobile browsers as a transparent asset.
  const videoEnabled = richMedia;

  useEffect(() => {
    setFailed(false);
    setReady(false);
    setMobilePhase("entrance");
  }, [mediaMode]);

  useEffect(() => {
    if (!mobileMedia) return;
    const timer = window.setTimeout(
      () => setMobilePhase("hover"),
      LANDING_V2_MEDIA.hero.hoverStart * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [mobileMedia]);

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
      {mobileMedia ? (
        <Image
          key={mobilePhase}
          className="lb2-hero__bird lb2-hero__bird--still"
          src={
            mobilePhase === "entrance"
              ? LANDING_V2_MEDIA.hero.mobileEntrance
              : LANDING_V2_MEDIA.hero.mobileHover
          }
          alt=""
          width={640}
          height={640}
          priority
          unoptimized
        />
      ) : (richMedia || mediaMode === "still") && (
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
          src={LANDING_V2_MEDIA.hero.master}
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
