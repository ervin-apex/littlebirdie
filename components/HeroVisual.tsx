"use client";

import { useState } from "react";
import { FlapBirdee } from "@/components/FlapBirdee";
import { assetPath } from "@/lib/site";

/**
 * Welcome hero: the finance-themed Birdee illustration (bird leading a rising
 * profit chart). Falls back to the flapping bird if the asset is missing.
 */
export function HeroVisual({ size = 200 }: { size?: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <FlapBirdee size={size} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={assetPath("/brand/birdee-hero.png")}
      width={size}
      height={size}
      alt="Little Birdee leading a rising profit chart"
      onError={() => setFailed(true)}
      className="birdee-float"
      style={{ objectFit: "contain" }}
    />
  );
}
