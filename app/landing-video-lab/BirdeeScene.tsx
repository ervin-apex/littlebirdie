"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  type BirdeeGuideStep,
  useBirdeeGuide,
} from "./GuidedBirdeeChapter";

type BirdeeCue = {
  at: number;
  name: string;
};

type BirdeeSceneProps = {
  step: BirdeeGuideStep;
  className: string;
  poster: string;
  width: number;
  height: number;
  sizes: string;
  videoSrc?: string;
  mobileVideoSrc?: string;
  finalPoster?: string;
  cuePoints?: BirdeeCue[];
  onCue?: (cue: string) => void;
  playOnce?: boolean;
  style?: CSSProperties;
};

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (
    callback: (
      now: number,
      metadata: {
        mediaTime: number;
      },
    ) => void,
  ) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

const NO_CUES: BirdeeCue[] = [];

export function BirdeeScene({
  step,
  className,
  poster,
  width,
  height,
  sizes,
  videoSrc,
  mobileVideoSrc,
  finalPoster,
  cuePoints = NO_CUES,
  onCue,
  playOnce = false,
  style,
}: BirdeeSceneProps) {
  const { activeStep, reducedMotion } = useBirdeeGuide();
  const rootRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<VideoWithFrameCallback>(null);
  const playedRef = useRef(false);
  const cueIndexRef = useRef(0);
  const [nearViewport, setNearViewport] = useState(false);
  const [mobileLayout, setMobileLayout] = useState(false);
  const [finished, setFinished] = useState(false);
  const [playing, setPlaying] = useState(false);
  const active = activeStep === step;
  const selectedVideo =
    mobileLayout && mobileVideoSrc ? mobileVideoSrc : videoSrc;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 760px)");
    const updateLayout = () => setMobileLayout(mediaQuery.matches);

    updateLayout();
    mediaQuery.addEventListener("change", updateLayout);
    return () => mediaQuery.removeEventListener("change", updateLayout);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      ([entry]) => setNearViewport(entry.isIntersecting),
      { rootMargin: "100% 0px" },
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !nearViewport) return;

    if (reducedMotion) {
      video.pause();
      setPlaying(false);
      return;
    }

    if (!active) {
      video.pause();
      setPlaying(false);
      if (!playOnce) {
        video.currentTime = 0;
        cueIndexRef.current = 0;
        setFinished(false);
      }
      return;
    }

    if (playOnce && playedRef.current) return;

    cueIndexRef.current = 0;
    setFinished(false);
    video.currentTime = 0;
    setPlaying(true);
    void video.play().catch(() => {
      setPlaying(false);
      // The poster remains the complete fallback when autoplay is unavailable.
    });
  }, [active, nearViewport, playOnce, reducedMotion, selectedVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !active || reducedMotion || !cuePoints.length || !onCue) {
      return;
    }

    const emitPassedCues = (mediaTime: number) => {
      while (
        cueIndexRef.current < cuePoints.length &&
        mediaTime >= cuePoints[cueIndexRef.current].at
      ) {
        onCue(cuePoints[cueIndexRef.current].name);
        cueIndexRef.current += 1;
      }
    };

    let callbackHandle: number | null = null;
    const tick = (_now: number, metadata: { mediaTime: number }) => {
      emitPassedCues(metadata.mediaTime);
      callbackHandle = video.requestVideoFrameCallback?.(tick) ?? null;
    };
    const onTimeUpdate = () => emitPassedCues(video.currentTime);

    if (video.requestVideoFrameCallback) {
      callbackHandle = video.requestVideoFrameCallback(tick);
    } else {
      video.addEventListener("timeupdate", onTimeUpdate);
    }

    return () => {
      if (callbackHandle !== null) {
        video.cancelVideoFrameCallback?.(callbackHandle);
      }
      video.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [active, cuePoints, onCue, reducedMotion]);

  const visiblePoster = finished && finalPoster ? finalPoster : poster;
  const attachVideo = Boolean(
    selectedVideo &&
      nearViewport &&
      !reducedMotion &&
      !(finished && playOnce),
  );

  return (
    <span
      ref={rootRef}
      className={`vlab-birdee-scene ${className}${
        active ? " is-active" : ""
      }${playing ? " is-playing" : ""}${finished ? " is-finished" : ""}`}
      data-scene-step={step}
      style={style}
      aria-hidden="true"
    >
      {attachVideo && (
        <video
          ref={videoRef}
          className="vlab-scene-video"
          muted
          playsInline
          preload="metadata"
          poster={visiblePoster}
          onEnded={() => {
            playedRef.current = true;
            setPlaying(false);
            setFinished(true);
          }}
          onError={() => setPlaying(false)}
        >
          <source
            src={selectedVideo}
            type={selectedVideo?.endsWith(".webm") ? "video/webm" : "video/mp4"}
          />
        </video>
      )}

      <Image
        className="vlab-scene-poster"
        src={visiblePoster}
        alt=""
        width={width}
        height={height}
        sizes={sizes}
      />
    </span>
  );
}
