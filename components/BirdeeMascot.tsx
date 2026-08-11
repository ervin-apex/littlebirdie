"use client";

import { useState } from "react";
import { LittleBirdee, type BirdeeState } from "@/components/LittleBirdee";
import { assetPath } from "@/lib/site";

const SRC: Record<BirdeeState, string> = {
  profit: assetPath("/brand/birdee-semantic-encouraging-v1.png"),
  neutral: assetPath("/brand/birdee-semantic-attentive-v1.png"),
  loss: assetPath("/brand/birdee-semantic-supportive-v1.png"),
};

const ALT: Record<BirdeeState, string> = {
  profit: "Little Birdee, encouraging",
  neutral: "Little Birdee, attentive",
  loss: "Little Birdee, supportive",
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
  variant,
}: {
  state?: BirdeeState;
  size?: number;
  className?: string;
  float?: boolean;
  variant?: "concerned";
}) {
  const [failed, setFailed] = useState(false);
  const cls = `${className ?? ""} ${float ? "birdee-float" : ""}`.trim();
  const src = variant === "concerned"
    ? assetPath("/brand/birdee-semantic-supportive-v1.png")
    : SRC[state];
  const alt = variant === "concerned" ? "Little Birdee, supportive" : ALT[state];

  if (failed) {
    return <LittleBirdee state={state} size={size} className={cls} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      width={size}
      height={size}
      alt={alt}
      onError={() => setFailed(true)}
      className={cls}
      style={{ objectFit: "contain" }}
    />
  );
}
