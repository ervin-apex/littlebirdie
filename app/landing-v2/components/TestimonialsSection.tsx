"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { LANDING_V2_MEDIA } from "../media";

const TESTIMONIALS = [
  {
    quote: "I stopped waiting for month end to know how we were going",
    attribution: "SAMPLE TESTIMONIAL  ·  HOSPITALITY OWNER",
  },
  {
    quote: "I can check the week and know where I stand without digging through reports",
    attribution: "SAMPLE TESTIMONIAL  ·  RETAIL OWNER",
  },
  {
    quote: "It takes the guesswork out of a busy week",
    attribution: "SAMPLE TESTIMONIAL  ·  FOODTRUCK OWNER",
  },
] as const;

type Direction = "previous" | "next";
type BirdeeMediaMode = "pending" | "video" | "still";

const TESTIMONIAL_TRANSITION_MS = 880;

function getSlot(index: number, activeIndex: number) {
  const offset = (index - activeIndex + TESTIMONIALS.length) % TESTIMONIALS.length;
  if (offset === 0) return "active";
  return offset === 1 ? "right" : "left";
}

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasPlayedBirdeeRef = useRef(false);
  const animationTimerRef = useRef<number | null>(null);
  const activeAnimationRef = useRef(false);
  const queuedDirectionRef = useRef<Direction | null>(null);
  const moveRef = useRef<(direction: Direction) => void>(() => undefined);
  const [activeIndex, setActiveIndex] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mediaMode, setMediaMode] = useState<BirdeeMediaMode>("pending");

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (
      navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }
    ).connection;

    const updateMode = () => {
      if (motionQuery.matches || connection?.saveData === true) {
        setMediaMode("still");
        return;
      }

      const probe = document.createElement("video");
      setMediaMode(
        probe.canPlayType('video/mp4; codecs="avc1"') !== "" ? "video" : "still",
      );
    };

    motionQuery.addEventListener?.("change", updateMode);
    connection?.addEventListener?.("change", updateMode);
    updateMode();

    return () => {
      motionQuery.removeEventListener?.("change", updateMode);
      connection?.removeEventListener?.("change", updateMode);
    };
  }, []);

  useEffect(() => {
    if (mediaMode !== "video") return;

    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    let cancelled = false;
    const playOnce = () => {
      if (cancelled || hasPlayedBirdeeRef.current) return;
      hasPlayedBirdeeRef.current = true;
      video.currentTime = 0;
      void video.play().catch(() => {
        hasPlayedBirdeeRef.current = false;
        setMediaMode("still");
      });
    };

    const startWhenReady = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) playOnce();
      else video.addEventListener("canplay", playOnce, { once: true });
    };

    if (!("IntersectionObserver" in window)) {
      startWhenReady();
      return () => {
        cancelled = true;
        video.removeEventListener("canplay", playOnce);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        startWhenReady();
      },
      { rootMargin: "20% 0px 20% 0px", threshold: 0.01 },
    );

    observer.observe(section);
    return () => {
      cancelled = true;
      observer.disconnect();
      video.removeEventListener("canplay", playOnce);
    };
  }, [mediaMode]);

  const move = useCallback((nextDirection: Direction) => {
    if (activeAnimationRef.current) {
      queuedDirectionRef.current = nextDirection;
      return;
    }

    const delta = nextDirection === "next" ? 1 : -1;
    activeAnimationRef.current = true;
    setIsAnimating(true);
    setActiveIndex(
      (current) =>
        (current + delta + TESTIMONIALS.length) % TESTIMONIALS.length,
    );

    animationTimerRef.current = window.setTimeout(() => {
      setIsAnimating(false);
      activeAnimationRef.current = false;

      const queuedDirection = queuedDirectionRef.current;
      queuedDirectionRef.current = null;
      if (queuedDirection) {
        window.requestAnimationFrame(() => moveRef.current(queuedDirection));
      }
    }, TESTIMONIAL_TRANSITION_MS);
  }, []);

  moveRef.current = move;

  useEffect(
    () => () => {
      if (animationTimerRef.current !== null) {
        window.clearTimeout(animationTimerRef.current);
      }
    },
    [],
  );

  const activeTestimonial = TESTIMONIALS[activeIndex];

  return (
    <section
      ref={sectionRef}
      className="lb2-testimonials"
      id="testimonials"
      aria-labelledby="lb2-testimonials-title"
    >
      <div className="lb2-shell lb2-testimonials__grid">
        <div className="lb2-testimonials__heading">
          <p>What business owners say</p>
          <h2 id="lb2-testimonials-title">
            Less from us
            <em>more from them</em>
          </h2>
        </div>

        <div className="lb2-testimonials__guide" aria-hidden="true">
          {mediaMode === "video" ? (
            <video
              ref={videoRef}
              className="lb2-testimonials__guide-media"
              muted
              playsInline
              poster={LANDING_V2_MEDIA.testimonials.idlePoster}
              preload="auto"
              src={LANDING_V2_MEDIA.testimonials.idleVideo}
              tabIndex={-1}
              onError={() => setMediaMode("still")}
            />
          ) : (
            <Image
              className="lb2-testimonials__guide-media"
              src={LANDING_V2_MEDIA.testimonials.idlePoster}
              alt=""
              width={544}
              height={544}
              sizes="(max-width: 620px) 170px, (max-width: 900px) 220px, 310px"
            />
          )}
        </div>

        <div className="lb2-testimonials__stage" data-animating={isAnimating}>
          <div className="lb2-testimonials__deck" aria-hidden="true">
            {TESTIMONIALS.map((testimonial, index) => {
              const slot = getSlot(index, activeIndex);
              return (
                <article
                  className="lb2-testimonials__card"
                  data-slot={slot}
                  key={testimonial.attribution}
                >
                  <span className="lb2-testimonials__quote-mark">“</span>
                  <blockquote>{testimonial.quote}</blockquote>
                  <small>{testimonial.attribution}</small>
                </article>
              );
            })}
          </div>

          <p className="lb2-sr-only" aria-live="polite" aria-atomic="true">
            {activeTestimonial.quote} {activeTestimonial.attribution}
          </p>
        </div>

        <div className="lb2-testimonials__controls">
          <button
            type="button"
            onClick={() => move("previous")}
            aria-label="Previous testimonial"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 5 3 12l7 7M4 12h17" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => move("next")}
            aria-label="Next testimonial"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m14 5 7 7-7 7M20 12H3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
