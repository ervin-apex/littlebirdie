"use client";

import { useEffect, useRef } from "react";
import { assetPath } from "@/lib/site";

const VIDEO_SRC = "/media/auth/birdee-auth-breathe-alpha.webm";
const POSTER_SRC = "/media/auth/birdee-auth-breathe-poster.webp";

export function AuthBirdee() {
  const eyeRef = useRef<HTMLSpanElement>(null);
  const pupilRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    function syncVideoMotion() {
      if (!video) return;

      if (reducedMotion.matches) {
        video.pause();
        video.currentTime = 0;
        return;
      }

      void video.play().catch(() => {
        // The poster remains a complete static fallback if autoplay is unavailable.
      });
    }

    syncVideoMotion();
    reducedMotion.addEventListener("change", syncVideoMotion);

    let blinkTimer = 0;
    let blinkEndTimer = 0;

    function scheduleBlink(delay = 5_000 + Math.random() * 4_000) {
      if (blinkTimer) window.clearTimeout(blinkTimer);
      blinkTimer = window.setTimeout(runBlink, delay);
    }

    function runBlink() {
      blinkTimer = 0;
      const eye = eyeRef.current;

      if (
        !eye ||
        reducedMotion.matches ||
        document.visibilityState !== "visible" ||
        eye.getAttribute("data-attention") === "glancing"
      ) {
        scheduleBlink(1_200);
        return;
      }

      eye.setAttribute("data-blinking", "true");
      blinkEndTimer = window.setTimeout(() => {
        blinkEndTimer = 0;
        eye.removeAttribute("data-blinking");
        scheduleBlink();
      }, 170);
    }

    if (!reducedMotion.matches) {
      scheduleBlink(1_800 + Math.random() * 1_400);
    }

    if (!finePointer.matches || reducedMotion.matches) {
      return () => {
        reducedMotion.removeEventListener("change", syncVideoMotion);
        if (blinkTimer) window.clearTimeout(blinkTimer);
        if (blinkEndTimer) window.clearTimeout(blinkEndTimer);
      };
    }

    let animationFrame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let glanceTimer = 0;
    let returnTimer = 0;
    let glanceActive = false;
    let cooldownUntil = Date.now() + 2_200;
    let latestPointer: { x: number; y: number } | null = null;

    function renderPupil() {
      const pupil = pupilRef.current;
      if (!pupil) return;

      velocityX = (velocityX + (targetX - currentX) * 0.12) * 0.72;
      velocityY = (velocityY + (targetY - currentY) * 0.12) * 0.72;
      currentX += velocityX;
      currentY += velocityY;
      pupil.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;

      const unsettled =
        Math.abs(targetX - currentX) +
          Math.abs(targetY - currentY) +
          Math.abs(velocityX) +
          Math.abs(velocityY) >
        0.04;

      animationFrame = unsettled ? window.requestAnimationFrame(renderPupil) : 0;
    }

    function requestPupilFrame() {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(renderPupil);
    }

    function resetGaze() {
      targetX = 0;
      targetY = 0;
      eyeRef.current?.setAttribute("data-attention", "rest");
      requestPupilFrame();
    }

    function glanceAtCursor() {
      glanceTimer = 0;
      const eye = eyeRef.current;
      if (!eye || !latestPointer || reducedMotion.matches || glanceActive) return;

      const bounds = eye.getBoundingClientRect();
      const deltaX = latestPointer.x - (bounds.left + bounds.width / 2);
      const deltaY = latestPointer.y - (bounds.top + bounds.height / 2);
      const distance = Math.hypot(deltaX, deltaY);
      const travel = Math.min(bounds.width, bounds.height) * 0.16;
      const attention = Math.min(distance / 180, 1);

      if (distance < 1) return;

      glanceActive = true;
      cooldownUntil = Date.now() + 8_000 + Math.random() * 4_000;
      targetX = (deltaX / distance) * travel * attention;
      targetY = (deltaY / distance) * travel * attention;
      eye.setAttribute("data-attention", "glancing");
      requestPupilFrame();

      returnTimer = window.setTimeout(() => {
        returnTimer = 0;
        glanceActive = false;
        resetGaze();
      }, 900);
    }

    function noticePointer(event: PointerEvent) {
      if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") {
        return;
      }

      latestPointer = { x: event.clientX, y: event.clientY };
      if (glanceActive) return;

      if (glanceTimer) window.clearTimeout(glanceTimer);
      const delayUntilEligible = Math.max(0, cooldownUntil - Date.now());
      glanceTimer = window.setTimeout(glanceAtCursor, delayUntilEligible + 700);
    }

    function stopNoticing() {
      latestPointer = null;
      glanceActive = false;
      if (glanceTimer) window.clearTimeout(glanceTimer);
      if (returnTimer) window.clearTimeout(returnTimer);
      glanceTimer = 0;
      returnTimer = 0;
      resetGaze();
    }

    window.addEventListener("pointermove", noticePointer, { passive: true });
    window.addEventListener("blur", stopNoticing);
    document.documentElement.addEventListener("mouseleave", stopNoticing);

    return () => {
      reducedMotion.removeEventListener("change", syncVideoMotion);
      window.removeEventListener("pointermove", noticePointer);
      window.removeEventListener("blur", stopNoticing);
      document.documentElement.removeEventListener("mouseleave", stopNoticing);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      if (glanceTimer) window.clearTimeout(glanceTimer);
      if (returnTimer) window.clearTimeout(returnTimer);
      if (blinkTimer) window.clearTimeout(blinkTimer);
      if (blinkEndTimer) window.clearTimeout(blinkEndTimer);
    };
  }, []);

  return (
    <div className="auth-birdee-motion">
      <video
        ref={videoRef}
        className="auth-birdee-motion__video"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster={assetPath(POSTER_SRC)}
        aria-hidden
      >
        <source src={assetPath(VIDEO_SRC)} type="video/webm" />
      </video>

      <span ref={eyeRef} className="auth-birdee-motion__eye" aria-hidden>
        <span ref={pupilRef} className="auth-birdee-motion__pupil" />
        <span className="auth-birdee-motion__eyelid" />
      </span>
    </div>
  );
}
