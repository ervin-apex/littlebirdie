"use client";

import { useEffect, useState } from "react";

export type HeroMediaMode = "pending" | "video" | "image" | "still";

export type HeroMediaPolicy = {
  canPlayAlphaVideo: boolean;
  prefersReducedMotion: boolean;
  saveData: boolean;
};

/**
 * Which Birdee the hero shows.
 *
 * The only questions that matter are whether the browser can play one of the
 * transparent masters and whether the reader has asked us not to move. Screen
 * width, aspect ratio, hover and pointer used to gate this too, which meant any
 * browser window narrower than 3:2 - an ordinary 1280x900 - fell all the way
 * through to a still poster, and every touch device got a 7.5fps animated WebP
 * instead of the 24fps master. None of those things say anything about whether
 * a video will play.
 */
export function chooseHeroMediaMode(policy: HeroMediaPolicy): HeroMediaMode {
  if (policy.prefersReducedMotion || policy.saveData) return "still";
  return policy.canPlayAlphaVideo ? "video" : "image";
}

type NetworkInformation = EventTarget & {
  saveData?: boolean;
};

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformation;
};

/**
 * Chooses one hero asset before rendering it. The pending state deliberately
 * renders no Birdee, so the hero never flashes a poster before the video.
 */
export function useHeroMediaMode() {
  const [mode, setMode] = useState<HeroMediaMode>("pending");

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const probe = document.createElement("video");
    /*
     * Either master will do. Both carry a real alpha channel: VP9 keeps it in a
     * second WebM stream, HEVC in an auxiliary layer. A browser that claims one
     * of these but then paints the bird on an opaque black square is caught at
     * runtime by the alpha probe in the hero, which moves it down the list.
     */
    const canPlayAlphaVideo =
      probe.canPlayType('video/webm; codecs="vp9"') !== "" ||
      probe.canPlayType('video/mp4; codecs="hvc1"') !== "";
    const connection = (navigator as NavigatorWithConnection).connection;

    const update = () => {
      setMode(
        chooseHeroMediaMode({
          canPlayAlphaVideo,
          prefersReducedMotion: motionQuery.matches,
          saveData: connection?.saveData === true,
        }),
      );
    };

    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", update);
    } else {
      motionQuery.addListener(update);
    }
    connection?.addEventListener?.("change", update);
    update();

    return () => {
      if (typeof motionQuery.removeEventListener === "function") {
        motionQuery.removeEventListener("change", update);
      } else {
        motionQuery.removeListener(update);
      }
      connection?.removeEventListener?.("change", update);
    };
  }, []);

  return mode;
}
