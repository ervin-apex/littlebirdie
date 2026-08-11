"use client";

import { useEffect, useRef } from "react";
import type { VideoHTMLAttributes } from "react";

type ViewportLoopVideoProps = Omit<VideoHTMLAttributes<HTMLVideoElement>, "autoPlay" | "ref">;

export function ViewportLoopVideo(props: ViewportLoopVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => undefined);
        else video.pause();
      },
      { rootMargin: "15% 0px" },
    );

    observer.observe(video);
    return () => {
      observer.disconnect();
      video.pause();
    };
  }, []);

  return <video ref={videoRef} {...props} />;
}
