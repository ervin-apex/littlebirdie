"use client";

import { useEffect, useRef, useState } from "react";

type SegmentedVideoProps = {
  activeSegment: number;
  className?: string;
  delayMs?: number;
  poster?: string;
  segmentDuration: number;
  segmentCount: number;
  playbackRates: readonly number[];
  src: string;
  onError?: () => void;
};

type PlaybackConfig = Pick<
  SegmentedVideoProps,
  "delayMs" | "playbackRates" | "segmentCount" | "segmentDuration"
>;

/**
 * Plays authored video segments as discrete one-shot states and holds each
 * endpoint. Scroll chooses the state; it never controls individual frames.
 */
export function SegmentedVideo({
  activeSegment,
  className,
  delayMs = 120,
  poster,
  segmentDuration,
  segmentCount,
  playbackRates,
  src,
  onError,
}: SegmentedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestedSegment = useRef(activeSegment);
  const playingSegment = useRef<number | null>(null);
  const animationFrame = useRef(0);
  const delayTimer = useRef<number | null>(null);
  const inViewRef = useRef(false);
  const playSegmentRef = useRef<(segment: number) => void>(() => undefined);
  const configRef = useRef<PlaybackConfig>({
    delayMs,
    playbackRates,
    segmentCount,
    segmentDuration,
  });
  const [inView, setInView] = useState(false);

  configRef.current = { delayMs, playbackRates, segmentCount, segmentDuration };

  const clearAnimationFrame = () => {
    if (animationFrame.current) window.cancelAnimationFrame(animationFrame.current);
    animationFrame.current = 0;
  };

  const clearDelay = () => {
    if (delayTimer.current !== null) window.clearTimeout(delayTimer.current);
    delayTimer.current = null;
  };

  const scheduleSegment = (segment: number, wait: number) => {
    clearDelay();
    delayTimer.current = window.setTimeout(() => {
      delayTimer.current = null;
      playSegmentRef.current(segment);
    }, wait);
  };

  playSegmentRef.current = (segment: number) => {
    const video = videoRef.current;
    if (!video || !inViewRef.current) return;

    const config = configRef.current;
    const safeSegment = Math.min(config.segmentCount - 1, Math.max(0, segment));

    if (video.readyState < 1) {
      scheduleSegment(safeSegment, 50);
      return;
    }

    const start = safeSegment * config.segmentDuration;
    const authoredEnd = Math.min(
      (safeSegment + 1) * config.segmentDuration,
      video.duration || Infinity,
    );
    const holdFrame = Math.max(start, authoredEnd - 1 / 24);

    clearAnimationFrame();
    playingSegment.current = safeSegment;
    if (Math.abs(video.currentTime - start) > 0.08) video.currentTime = start;
    video.playbackRate = config.playbackRates[safeSegment] ?? 1;
    void video.play().catch(() => undefined);

    const monitor = () => {
      if (!inViewRef.current) return;

      if (video.currentTime >= holdFrame) {
        video.pause();
        video.currentTime = holdFrame;
        playingSegment.current = null;
        animationFrame.current = 0;

        if (requestedSegment.current !== safeSegment) {
          scheduleSegment(requestedSegment.current, configRef.current.delayMs ?? 120);
        }
        return;
      }

      animationFrame.current = window.requestAnimationFrame(monitor);
    };

    animationFrame.current = window.requestAnimationFrame(monitor);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        setInView(entry.isIntersecting);
      },
      { threshold: 0.08 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    requestedSegment.current = Math.min(segmentCount - 1, Math.max(0, activeSegment));

    if (!inView) {
      clearDelay();
      clearAnimationFrame();
      playingSegment.current = null;
      video.pause();
      return;
    }

    if (playingSegment.current === null) {
      scheduleSegment(requestedSegment.current, delayMs);
      return;
    }

    if (requestedSegment.current > playingSegment.current) {
      // A quick forward scroll completes the current idea briskly, then lands
      // on the latest requested idea instead of hard-cutting Birdee mid-pose.
      video.playbackRate = Math.max(video.playbackRate, 3);
      return;
    }

    if (requestedSegment.current < playingSegment.current) {
      // Reverse navigation should feel responsive. The previous authored pose
      // begins cleanly rather than playing the current gesture backwards.
      clearAnimationFrame();
      video.pause();
      playingSegment.current = null;
      scheduleSegment(requestedSegment.current, delayMs);
    }
  }, [activeSegment, delayMs, inView, segmentCount]);

  useEffect(
    () => () => {
      clearDelay();
      clearAnimationFrame();
      videoRef.current?.pause();
      playingSegment.current = null;
    },
    [],
  );

  return (
    <video
      ref={videoRef}
      className={className}
      muted
      playsInline
      preload="auto"
      poster={poster}
      src={src}
      tabIndex={-1}
      aria-hidden="true"
      onError={onError}
    />
  );
}
