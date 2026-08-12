"use client";

import { useEffect, useState } from "react";

export type RichStoryMediaPolicy = {
  hasFinePointer: boolean;
  hasHover: boolean;
  hasWideAspectRatio: boolean;
  isWideEnough: boolean;
  prefersReducedMotion: boolean;
  supportsVp9Webm: boolean;
};

export function shouldUseRichStoryMedia({
  hasFinePointer,
  hasHover,
  hasWideAspectRatio,
  isWideEnough,
  prefersReducedMotion,
  supportsVp9Webm,
}: RichStoryMediaPolicy) {
  return (
    isWideEnough &&
    hasWideAspectRatio &&
    hasHover &&
    hasFinePointer &&
    !prefersReducedMotion &&
    supportsVp9Webm
  );
}

/**
 * Rich story video is an enhancement for desktop-like browsing contexts.
 * SSR, touch devices, reduced-motion users, and browsers without VP9 WebM
 * support keep the complete static composition instead.
 */
export function useRichStoryMedia(minimumWidth = 821) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const widthQuery = window.matchMedia(`(min-width: ${minimumWidth}px)`);
    const aspectQuery = window.matchMedia("(min-aspect-ratio: 3/2)");
    const hoverQuery = window.matchMedia("(hover: hover)");
    const pointerQuery = window.matchMedia("(pointer: fine)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const probe = document.createElement("video");
    const supportsVp9Webm =
      probe.canPlayType('video/webm; codecs="vp9"') !== "";

    const update = () => {
      setEnabled(
        shouldUseRichStoryMedia({
          hasFinePointer: pointerQuery.matches,
          hasHover: hoverQuery.matches,
          hasWideAspectRatio: aspectQuery.matches,
          isWideEnough: widthQuery.matches,
          prefersReducedMotion: motionQuery.matches,
          supportsVp9Webm,
        }),
      );
    };

    const queries = [
      widthQuery,
      aspectQuery,
      hoverQuery,
      pointerQuery,
      motionQuery,
    ];
    queries.forEach((query) => {
      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", update);
      } else {
        query.addListener(update);
      }
    });
    update();

    return () => {
      queries.forEach((query) => {
        if (typeof query.removeEventListener === "function") {
          query.removeEventListener("change", update);
        } else {
          query.removeListener(update);
        }
      });
    };
  }, [minimumWidth]);

  return enabled;
}
