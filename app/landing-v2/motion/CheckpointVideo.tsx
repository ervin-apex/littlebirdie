"use client";

import { useEffect, useRef, useState } from "react";

type VideoCheckpoint = {
  start: number;
  end: number;
  playbackRate?: number;
};

type CheckpointVideoProps = {
  activeIndex: number;
  checkpoints: readonly VideoCheckpoint[];
  className?: string;
  delayMs?: number;
  poster: string;
  source: string;
  onError?: () => void;
};

type FrameMetadata = { mediaTime: number };

/**
 * Drives one continuous, preloaded alpha video as a segmented timeline.
 * Each scroll checkpoint plays one authored gesture and pauses on its final
 * painted frame. Because the DOM video source never changes, switching acts
 * cannot reveal the stage background between decoders.
 */
export function CheckpointVideo({
  activeIndex,
  checkpoints,
  className,
  delayMs = 70,
  poster,
  source,
  onError,
}: CheckpointVideoProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playTimerRef = useRef<number | null>(null);
  const frameCallbackRef = useRef<number | null>(null);
  const runRef = useRef(0);
  const previousIndexRef = useRef(activeIndex);
  const [inView, setInView] = useState(false);

  const safeIndex = Math.min(
    checkpoints.length - 1,
    Math.max(0, activeIndex),
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "18% 0px", threshold: 0.02 },
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const checkpoint = checkpoints[safeIndex];
    if (!video || !checkpoint) return;

    const run = ++runRef.current;
    const previousIndex = previousIndexRef.current;
    previousIndexRef.current = safeIndex;
    let cancelled = false;

    const clearScheduledWork = () => {
      if (playTimerRef.current !== null) {
        window.clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
      if (
        frameCallbackRef.current !== null &&
        typeof video.cancelVideoFrameCallback === "function"
      ) {
        video.cancelVideoFrameCallback(frameCallbackRef.current);
        frameCallbackRef.current = null;
      }
    };

    clearScheduledWork();

    if (!inView) {
      video.pause();
      return clearScheduledWork;
    }

    const stopOnFinalFrame = () => {
      if (typeof video.requestVideoFrameCallback !== "function") return;

      const inspectFrame = (_now: number, metadata: FrameMetadata) => {
        if (cancelled || runRef.current !== run) return;

        // The callback runs after the frame is submitted to the compositor,
        // so pausing here preserves the authored final pose on screen.
        if (metadata.mediaTime >= checkpoint.end - 1 / 48) {
          video.pause();
          frameCallbackRef.current = null;
          return;
        }

        frameCallbackRef.current = video.requestVideoFrameCallback(inspectFrame);
      };

      frameCallbackRef.current = video.requestVideoFrameCallback(inspectFrame);
    };

    const playSegment = () => {
      if (cancelled || runRef.current !== run) return;
      video.playbackRate = checkpoint.playbackRate ?? 1;
      stopOnFinalFrame();
      void video.play().catch(() => undefined);
    };

    const begin = () => {
      if (cancelled || runRef.current !== run) return;

      const previous = checkpoints[previousIndex];
      const continuingForward =
        safeIndex === previousIndex + 1 &&
        previous &&
        Math.abs(video.currentTime - previous.end) <= 0.12;
      const resumingCurrent =
        safeIndex === previousIndex &&
        video.currentTime >= checkpoint.start &&
        video.currentTime < checkpoint.end - 1 / 48;

      // Adjacent acts naturally cross the baked join from the held frame.
      // Jumps and reverse scrolling seek within the same already-decoded file.
      if (continuingForward || resumingCurrent) {
        playSegment();
        return;
      }

      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        playSegment();
      };

      video.pause();
      video.addEventListener("seeked", onSeeked, { once: true });
      video.currentTime = checkpoint.start;

      // Browsers do not consistently emit seeked when assigning the current
      // time already painted at zero.
      if (Math.abs(video.currentTime - checkpoint.start) < 1 / 1000) {
        window.requestAnimationFrame(() => {
          video.removeEventListener("seeked", onSeeked);
          playSegment();
        });
      }
    };

    const schedule = () => {
      playTimerRef.current = window.setTimeout(() => {
        playTimerRef.current = null;
        begin();
      }, delayMs);
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) schedule();
    else video.addEventListener("loadeddata", schedule, { once: true });

    return () => {
      cancelled = true;
      video.removeEventListener("loadeddata", schedule);
      clearScheduledWork();
    };
  }, [checkpoints, delayMs, inView, safeIndex]);

  useEffect(
    () => () => {
      const video = videoRef.current;
      if (playTimerRef.current !== null) {
        window.clearTimeout(playTimerRef.current);
      }
      if (
        video &&
        frameCallbackRef.current !== null &&
        typeof video.cancelVideoFrameCallback === "function"
      ) {
        video.cancelVideoFrameCallback(frameCallbackRef.current);
      }
      video?.pause();
    },
    [],
  );

  return (
    <div ref={rootRef} className={className}>
      <video
        ref={videoRef}
        className="lb2-checkpoint-video__media"
        muted
        playsInline
        preload="auto"
        poster={poster}
        src={source}
        tabIndex={-1}
        aria-hidden="true"
        onError={onError}
        onTimeUpdate={(event) => {
          // Fallback for browsers without requestVideoFrameCallback.
          if (typeof event.currentTarget.requestVideoFrameCallback === "function") {
            return;
          }
          const checkpoint = checkpoints[safeIndex];
          if (checkpoint && event.currentTarget.currentTime >= checkpoint.end) {
            event.currentTarget.pause();
          }
        }}
      />
    </div>
  );
}
