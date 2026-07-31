"use client";

import { useEffect, useRef } from "react";
import { useBirdeeGuide } from "./GuidedBirdeeChapter";

type HopDirection = "forward" | "backward";

const HOP_FRAME_COUNT = 9;
const FIRST_HOP = { start: 0.18, end: 0.42 };
const SECOND_HOP = { start: 0.55, end: 0.79 };

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

const smoothstep = (value: number) => value * value * (3 - 2 * value);

type HopState = {
  from: number;
  to: number;
  localProgress: number;
};

function getHopState(progress: number): HopState {
  if (progress < FIRST_HOP.start) {
    return { from: 0, to: 0, localProgress: 0 };
  }

  if (progress <= FIRST_HOP.end) {
    return {
      from: 0,
      to: 1,
      localProgress: clamp(
        (progress - FIRST_HOP.start) / (FIRST_HOP.end - FIRST_HOP.start),
      ),
    };
  }

  if (progress < SECOND_HOP.start) {
    return { from: 1, to: 1, localProgress: 0 };
  }

  if (progress <= SECOND_HOP.end) {
    return {
      from: 1,
      to: 2,
      localProgress: clamp(
        (progress - SECOND_HOP.start) / (SECOND_HOP.end - SECOND_HOP.start),
      ),
    };
  }

  return { from: 2, to: 2, localProgress: 0 };
}

export function HowBirdeeMotion() {
  const { activeStep, guidedDesktop, reducedMotion } = useBirdeeGuide();
  const birdeeRef = useRef<HTMLSpanElement>(null);
  const spriteRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const birdee = birdeeRef.current;
    const sprite = spriteRef.current;
    const track = birdee?.closest<HTMLElement>(".vlab-step-track");
    const section = birdee?.closest<HTMLElement>(".vlab-how");

    if (!birdee || !sprite || !track || !section) return;

    const cards = [
      track.querySelector<HTMLElement>(".vlab-step-card--revenue"),
      track.querySelector<HTMLElement>(".vlab-step-card--costs"),
      track.querySelector<HTMLElement>(".vlab-step-card--profit"),
    ];

    if (cards.some((card) => !card)) return;

    if (!guidedDesktop || reducedMotion) {
      track.dataset.howPhase = "2";
      birdee.classList.remove("is-scroll-guided", "is-moving");
      birdee.removeAttribute("style");
      birdee.dataset.hopDirection = "forward";
      sprite.removeAttribute("style");
      return;
    }

    birdee.classList.add("is-scroll-guided");

    let targetProgress = 0;
    let displayedProgress = 0;
    let lastRenderedProgress = 0;
    let animationFrame: number | null = null;
    let hasRendered = false;
    let direction: HopDirection = "forward";

    const readProgress = () => {
      const rect = section.getBoundingClientRect();
      const focusLine = window.innerHeight * 0.5;
      return clamp((focusLine - rect.top) / Math.max(rect.height, 1));
    };

    const render = (progress: number) => {
      const trackRect = track.getBoundingClientRect();
      const birdWidth = birdee.offsetWidth;
      const anchors = cards.map((card) => {
        const rect = card!.getBoundingClientRect();
        return rect.left - trackRect.left + rect.width * 0.5 - birdWidth * 0.5;
      });

      const hop = getHopState(progress);
      const easedHop = smoothstep(hop.localProgress);
      const x =
        anchors[hop.from] + (anchors[hop.to] - anchors[hop.from]) * easedHop;
      const hopHeight = clamp(trackRect.width * 0.035, 28, 48);
      const y =
        hop.from === hop.to
          ? 0
          : -Math.sin(hop.localProgress * Math.PI) * hopHeight;

      if (progress > lastRenderedProgress + 0.0008) {
        direction = "forward";
      } else if (progress < lastRenderedProgress - 0.0008) {
        direction = "backward";
      }

      const frame =
        hop.from === hop.to
          ? 0
          : Math.round(hop.localProgress * (HOP_FRAME_COUNT - 1));
      const framePosition = (frame / (HOP_FRAME_COUNT - 1)) * 100;

      birdee.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      birdee.dataset.hopDirection = direction;
      sprite.style.backgroundPosition = `${framePosition}% 50%`;
      lastRenderedProgress = progress;

      const phase =
        progress < FIRST_HOP.end ? 0 : progress < SECOND_HOP.end ? 1 : 2;
      track.dataset.howPhase = String(phase);
    };

    const animateTowardTarget = () => {
      animationFrame = null;
      const delta = targetProgress - displayedProgress;

      if (Math.abs(delta) < 0.0005) {
        displayedProgress = targetProgress;
        render(displayedProgress);
        birdee.classList.remove("is-moving");
        return;
      }

      displayedProgress += delta * 0.18;
      render(displayedProgress);
      birdee.classList.add("is-moving");
      animationFrame = window.requestAnimationFrame(animateTowardTarget);
    };

    const requestUpdate = () => {
      targetProgress = readProgress();

      if (!hasRendered || activeStep !== "how") {
        displayedProgress = targetProgress;
        render(displayedProgress);
        hasRendered = true;
        return;
      }

      if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(animateTowardTarget);
      }
    };

    const resizeObserver = new ResizeObserver(requestUpdate);
    resizeObserver.observe(track);
    cards.forEach((card) => resizeObserver.observe(card!));
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    requestUpdate();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [activeStep, guidedDesktop, reducedMotion]);

  return (
    <span
      ref={birdeeRef}
      className="vlab-how-birdee"
      data-hop-direction="forward"
      aria-hidden="true"
    >
      <span ref={spriteRef} className="vlab-how-sprite" />
    </span>
  );
}
