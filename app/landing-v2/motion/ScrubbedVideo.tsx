"use client";

import { useEffect, useRef, useState } from "react";
import { clamp } from "./useScrollStage";

type ScrubbedVideoProps = {
  className?: string;
  duration: number;
  progress: number;
  src: string;
  mobileSrc?: string;
  poster?: string;
  onError?: () => void;
};

export function ScrubbedVideo({
  className,
  duration,
  progress,
  src,
  mobileSrc,
  poster,
  onError,
}: ScrubbedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const desiredTimeRef = useRef(0);
  const scheduleSeekRef = useRef<(() => void) | null>(null);
  const [canLoad, setCanLoad] = useState(false);
  const [activeSrc, setActiveSrc] = useState<string>();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActiveSrc(
            mobileSrc && window.matchMedia("(max-width: 820px)").matches
              ? mobileSrc
              : src,
          );
          setCanLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [mobileSrc, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !canLoad || !activeSrc) return;

    let disposed = false;
    let frame = 0;

    const flushLatestSeek = () => {
      frame = 0;
      if (disposed || video.readyState < 1 || video.seeking) return;

      const target = desiredTimeRef.current;
      if (Math.abs(video.currentTime - target) > 0.018) {
        video.currentTime = target;
      }
      video.pause();
    };

    const scheduleLatestSeek = () => {
      if (!frame) frame = window.requestAnimationFrame(flushLatestSeek);
    };

    scheduleSeekRef.current = scheduleLatestSeek;
    video.addEventListener("loadedmetadata", scheduleLatestSeek);
    video.addEventListener("seeked", scheduleLatestSeek);
    scheduleLatestSeek();

    return () => {
      disposed = true;
      scheduleSeekRef.current = null;
      video.removeEventListener("loadedmetadata", scheduleLatestSeek);
      video.removeEventListener("seeked", scheduleLatestSeek);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [activeSrc, canLoad]);

  useEffect(() => {
    const video = videoRef.current;
    const available = video && Number.isFinite(video.duration)
      ? Math.min(duration, video.duration)
      : duration;

    desiredTimeRef.current = clamp(progress) * Math.max(0, available - 0.04);
    scheduleSeekRef.current?.();
  }, [duration, progress]);

  return (
    <video
      ref={videoRef}
      className={className}
      muted
      playsInline
      preload="auto"
      poster={poster}
      src={canLoad ? activeSrc : undefined}
      tabIndex={-1}
      aria-hidden="true"
      onError={onError}
    />
  );
}
