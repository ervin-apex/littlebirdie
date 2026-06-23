"use client";

import { useState } from "react";
import { BirdeeMascot } from "@/components/BirdeeMascot";

/**
 * Per-step illustration for the setup wizard. Uses the Codex-generated
 * step image when present; falls back to the floating mascot otherwise.
 */
export function StepVisual({ src, size = 132 }: { src: string; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <BirdeeMascot state="profit" size={size} float />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      onError={() => setFailed(true)}
      className="birdee-float"
      style={{ objectFit: "contain" }}
    />
  );
}
