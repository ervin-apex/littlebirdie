"use client";

import { useState } from "react";
import { LittleBirdee, type BirdeeState } from "@/components/LittleBirdee";
import { assetPath } from "@/lib/site";

const SRC: Record<BirdeeState, string> = {
  profit: assetPath("/brand/birdee-happy.png"),
  neutral: assetPath("/brand/birdee-mark.png"),
  loss: assetPath("/brand/birdee-worried.png"),
};

const ALT: Record<BirdeeState, string> = {
  profit: "Little Birdee, happy",
  neutral: "Little Birdee",
  loss: "Little Birdee, worried",
};

/**
 * Little Birdee mascot — renders the Codex-generated transparent PNG for the
 * given state, with an optional gentle float animation. Falls back to the
 * inline SVG if the asset is missing so the app never shows a broken image.
 */
export function BirdeeMascot({
  state = "neutral",
  size = 76,
  className,
  float = false,
}: {
  state?: BirdeeState;
  size?: number;
  className?: string;
  float?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const cls = `${className ?? ""} ${float ? "birdee-float" : ""}`.trim();

  if (failed) {
    return <LittleBirdee state={state} size={size} className={cls} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC[state]}
      width={size}
      height={size}
      alt={ALT[state]}
      onError={() => setFailed(true)}
      className={cls}
      style={{ objectFit: "contain" }}
    />
  );
}
