"use client";

import { useEffect, useRef, useState } from "react";
import { revealAfterFirstVideoFrame } from "./videoReadiness";

type OneShotVideoProps = {
  active: boolean;
  className?: string;
  playKey: string | number;
  playbackRate?: number;
  poster?: string;
  src: string;
  onError?: () => void;
};

/** Plays once per active story act and leaves the authored final frame held. */
export function OneShotVideo({
  active,
  className,
  playKey,
  playbackRate = 1,
  poster,
  src,
  onError,
}: OneShotVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.08 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!active || !inView) {
      video.pause();
      return;
    }

    let cancelled = false;
    const playFromStart = () => {
      if (cancelled) return;
      video.playbackRate = playbackRate;
      video.currentTime = 0;
      void video.play().catch(() => undefined);
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) playFromStart();
    else video.addEventListener("canplay", playFromStart, { once: true });

    return () => {
      cancelled = true;
      video.removeEventListener("canplay", playFromStart);
    };
  }, [active, inView, playKey, playbackRate, src]);

  return (
    <video
      ref={videoRef}
      className={className}
      data-active={active}
      data-ready={ready}
      muted
      playsInline
      preload="auto"
      poster={poster}
      src={src}
      tabIndex={-1}
      aria-hidden="true"
      onLoadedData={(event) =>
        revealAfterFirstVideoFrame(event.currentTarget, () => setReady(true))
      }
      onError={onError}
    />
  );
}
