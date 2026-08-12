"use client";

import { useEffect, useState } from "react";
import {
  shouldUseRichStoryMedia,
  type RichStoryMediaPolicy,
} from "./useRichStoryMedia";

export type HeroMediaMode = "pending" | "rich" | "mobile" | "still";

export type HeroMediaPolicy = RichStoryMediaPolicy & {
  isMobileContext: boolean;
  saveData: boolean;
};

export function chooseHeroMediaMode(policy: HeroMediaPolicy): HeroMediaMode {
  if (shouldUseRichStoryMedia(policy)) return "rich";

  if (
    policy.isMobileContext &&
    !policy.prefersReducedMotion &&
    !policy.saveData &&
    policy.supportsVp9Webm
  ) {
    return "mobile";
  }

  return "still";
}

type NetworkInformation = EventTarget & {
  saveData?: boolean;
};

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformation;
};

/**
 * Chooses one hero asset before rendering it. The pending state deliberately
 * renders no Birdee, so mobile never flashes a poster before the entrance video.
 */
export function useHeroMediaMode() {
  const [mode, setMode] = useState<HeroMediaMode>("pending");

  useEffect(() => {
    const widthQuery = window.matchMedia("(min-width: 821px)");
    const aspectQuery = window.matchMedia("(min-aspect-ratio: 3/2)");
    const hoverQuery = window.matchMedia("(hover: hover)");
    const pointerQuery = window.matchMedia("(pointer: fine)");
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const probe = document.createElement("video");
    const supportsVp9Webm =
      probe.canPlayType('video/webm; codecs="vp9"') !== "";
    const connection = (navigator as NavigatorWithConnection).connection;

    const update = () => {
      setMode(
        chooseHeroMediaMode({
          hasFinePointer: pointerQuery.matches,
          hasHover: hoverQuery.matches,
          hasWideAspectRatio: aspectQuery.matches,
          isWideEnough: widthQuery.matches,
          isMobileContext:
            !widthQuery.matches || coarsePointerQuery.matches || !hoverQuery.matches,
          prefersReducedMotion: motionQuery.matches,
          saveData: connection?.saveData === true,
          supportsVp9Webm,
        }),
      );
    };

    const queries = [
      widthQuery,
      aspectQuery,
      hoverQuery,
      pointerQuery,
      coarsePointerQuery,
      motionQuery,
    ];

    queries.forEach((query) => {
      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", update);
      } else {
        query.addListener(update);
      }
    });
    connection?.addEventListener?.("change", update);
    update();

    return () => {
      queries.forEach((query) => {
        if (typeof query.removeEventListener === "function") {
          query.removeEventListener("change", update);
        } else {
          query.removeListener(update);
        }
      });
      connection?.removeEventListener?.("change", update);
    };
  }, []);

  return mode;
}
