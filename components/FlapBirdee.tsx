import type { CSSProperties } from "react";
import { assetPath } from "@/lib/site";

/**
 * Little Birdee mid-flight, wings flapping — a 3-frame loop built from the
 * Codex-generated spritesheet (birdee-flap-1..3.png), cycled via CSS plus a
 * gentle float. Pure CSS, so it pauses under prefers-reduced-motion.
 */
export function FlapBirdee({
  size = 150,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const style = {
    width: size,
    height: size,
    "--birdee-flap-1": `url("${assetPath("/brand/birdee-flap-1.png")}")`,
    "--birdee-flap-2": `url("${assetPath("/brand/birdee-flap-2.png")}")`,
    "--birdee-flap-3": `url("${assetPath("/brand/birdee-flap-3.png")}")`,
  } as CSSProperties;

  return (
    <div
      className={`birdee-flap ${className ?? ""}`}
      style={style}
      role="img"
      aria-label="Little Birdee"
    />
  );
}
