"use client";

import { useEffect, useRef, useState } from "react";
import { clamp } from "./useScrollStage";

type ScrubbedVideoProps = {
  className?: string;
  duration: number;
  progress: number;
  src: string;
  poster?: string;
  onError?: () => void;
};

export function ScrubbedVideo({
  className,
  duration,
  progress,
  src,
  poster,
  onError,
}: ScrubbedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canLoad, setCanLoad] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCanLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !canLoad) return;

    let frame = 0;
    const seek = () => {
      frame = 0;
      const available = Number.isFinite(video.duration)
        ? Math.min(duration, video.duration)
        : duration;
      const target = clamp(progress) * Math.max(0, available - 0.04);
      if (Math.abs(video.currentTime - target) > 0.025) video.currentTime = target;
      video.pause();
    };

    if (video.readyState >= 1) seek();
    else video.addEventListener("loadedmetadata", seek, { once: true });
    frame = window.requestAnimationFrame(seek);
    return () => {
      video.removeEventListener("loadedmetadata", seek);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [canLoad, duration, progress]);

  return (
    <video
      ref={videoRef}
      className={className}
      muted
      playsInline
      preload="metadata"
      poster={poster}
      src={canLoad ? src : undefined}
      tabIndex={-1}
      aria-hidden="true"
      onError={onError}
    />
  );
}
