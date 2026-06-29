"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { assetPath } from "@/lib/site";

// Ping-pong frame order so the wingbeat eases up→mid→down→mid with no snap.
const FRAMES = [
  assetPath("/brand/birdee-flap-1.png"),
  assetPath("/brand/birdee-flap-2.png"),
  assetPath("/brand/birdee-flap-3.png"),
  assetPath("/brand/birdee-flap-2.png"),
];

/**
 * Little Birdee flaps a few times on mount, then settles to a resting frame
 * with only a faint float. Motion is brief and deliberate so it doesn't steal
 * attention from the numbers. Static under prefers-reduced-motion.
 */
export function Flap({
  size = 120,
  speed = 200,
  beats = 14,
  className,
}: {
  size?: number;
  speed?: number;
  beats?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);

  useEffect(() => {
    if (reduce) return;
    let count = 0;
    const id = setInterval(() => {
      count += 1;
      setI((p) => (p + 1) % FRAMES.length);
      if (count >= beats) {
        clearInterval(id);
        setI(0); // settle, wings up at rest
      }
    }, speed);
    return () => clearInterval(id);
  }, [reduce, speed, beats]);

  return (
    <motion.div
      className={className}
      style={{ width: size, height: size }}
      animate={reduce ? undefined : { y: [0, -4, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={reduce ? FRAMES[0] : FRAMES[i]}
        alt="Little Birdee"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </motion.div>
  );
}
