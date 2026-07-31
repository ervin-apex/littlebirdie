"use client";

import { useBirdeeGuide } from "./GuidedBirdeeChapter";

export function DifferenceLeverValues() {
  const { differentPhase, reducedMotion } = useBirdeeGuide();
  const adjusted = reducedMotion || differentPhase >= 1;

  return (
    <div
      className="vlab-lever-values"
      data-adjusted={adjusted ? "true" : "false"}
      aria-label={
        adjusted
          ? "Example adjustment: wages decrease by 360 dollars and profit increases by 360 dollars."
          : "Example adjustment ready. Move the lever to preview its effect."
      }
    >
      <span>
        Wages <strong>{adjusted ? "− $360" : "$0"}</strong>
      </span>
      <span>
        Profit <strong>{adjusted ? "+ $360" : "$0"}</strong>
      </span>
    </div>
  );
}
