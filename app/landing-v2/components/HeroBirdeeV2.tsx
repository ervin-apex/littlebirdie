"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { LANDING_V2_MEDIA } from "../media";
import { useHeroMediaMode } from "../motion/useHeroMediaMode";
import { revealAfterFirstVideoFrame } from "../motion/videoReadiness";

/*
 * Both masters hold the same 24fps animation with a real alpha channel. VP9
 * first because that is the one every engine except WebKit decodes with its
 * alpha intact; WebKit skips it and takes the HEVC.
 */
const MASTERS = [
  { src: LANDING_V2_MEDIA.hero.master, type: 'video/webm; codecs="vp9"' },
  { src: LANDING_V2_MEDIA.hero.masterHevc, type: 'video/mp4; codecs="hvc1"' },
] as const;

/**
 * Whether the browser is actually giving us the alpha channel.
 *
 * Some engines will happily decode a master and then paint it on an opaque
 * black square - it plays, so nothing errors, and the bird arrives in a box.
 * The first frame of the master is 93% transparent, so one drawn sample settles
 * it. Same-origin, so the canvas is never tainted.
 */
function videoKeepsAlpha(video: HTMLVideoElement) {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return true; // no way to tell; assume the browser is honest
  ctx.clearRect(0, 0, 32, 32);
  try {
    ctx.drawImage(video, 0, 0, 32, 32);
    const { data } = ctx.getImageData(0, 0, 32, 32);
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 250) return true;
    }
  } catch {
    return true;
  }
  return false;
}

/**
 * The next master this browser admits it can decode, at or after `from`.
 *
 * Skipping the ones it rejects outright matters on iOS, which cannot play the
 * WebM at all: without this it would fetch it, fail, and only then reach the
 * HEVC - a wasted round trip on the device this exists for.
 */
function nextPlayableMaster(from: number) {
  const probe = document.createElement("video");
  for (let i = from; i < MASTERS.length; i += 1) {
    if (probe.canPlayType(MASTERS[i].type) !== "") return i;
  }
  return MASTERS.length;
}

export function HeroBirdeeV2() {
  const videoRef = useRef<HTMLVideoElement>(null);
  // -1 until the client has picked one, so the server never guesses a master
  // and no rejected file is ever requested.
  const [master, setMaster] = useState(-1);
  const [ready, setReady] = useState(false);
  const [mobilePhase, setMobilePhase] = useState<"entrance" | "hover">("entrance");
  const mediaMode = useHeroMediaMode();

  // Every master rejected, or the browser has none: the animated image carries
  // the motion instead.
  const exhausted = master >= MASTERS.length;
  const showVideo = mediaMode === "video" && master >= 0 && !exhausted;
  const showAnimatedImage = mediaMode === "image" || (mediaMode === "video" && exhausted);

  useEffect(() => {
    setMaster(mediaMode === "video" ? nextPlayableMaster(0) : -1);
    setReady(false);
    setMobilePhase("entrance");
  }, [mediaMode]);

  useEffect(() => {
    if (!showAnimatedImage) return;
    const timer = window.setTimeout(
      () => setMobilePhase("hover"),
      LANDING_V2_MEDIA.hero.hoverStart * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [showAnimatedImage]);

  useEffect(() => {
    if (!showVideo) return;
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
  }, [showVideo, master]);

  const restartHover = () => {
    const video = videoRef.current;
    if (!video) return;
    // This seek stays within the same decoded media element. The browser keeps
    // the last hover frame painted while it returns to the authored hover seam.
    video.currentTime = LANDING_V2_MEDIA.hero.hoverStart;
    void video.play().catch(() => undefined);
  };

  // The poster stays on top until a master has proved it plays *and* keeps its
  // transparency, so a rejected one is swapped out without anything flashing.
  const onLoadedData = useCallback((video: HTMLVideoElement) => {
    if (!videoKeepsAlpha(video)) {
      setMaster((current) => nextPlayableMaster(current + 1));
      return;
    }
    revealAfterFirstVideoFrame(video, () => setReady(true));
  }, []);

  return (
    <>
      {showAnimatedImage ? (
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
      ) : (mediaMode !== "pending") && (
        <Image
          className="lb2-hero__bird lb2-hero__bird--still"
          data-hidden={showVideo && ready}
          src={LANDING_V2_MEDIA.hero.poster}
          alt=""
          width={1024}
          height={1024}
          priority
        />
      )}
      {showVideo && (
        <video
          key={master}
          ref={videoRef}
          className="lb2-hero__bird lb2-hero__bird--master"
          data-media-mode={mediaMode}
          data-ready={ready}
          autoPlay
          muted
          playsInline
          preload="auto"
          poster={LANDING_V2_MEDIA.hero.poster}
          src={MASTERS[master].src}
          aria-hidden="true"
          tabIndex={-1}
          onLoadedData={(event) => onLoadedData(event.currentTarget)}
          onEnded={restartHover}
          onError={() => {
            setReady(false);
            setMaster((current) => nextPlayableMaster(current + 1));
          }}
        />
      )}
    </>
  );
}
