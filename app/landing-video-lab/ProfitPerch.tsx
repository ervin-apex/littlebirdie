"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";

const NUMBER_CHECKS = [
  {
    label: "Revenue",
    descriptor: "What comes in",
    value: "$18,420",
  },
  {
    label: "Wages",
    descriptor: "What goes out",
    value: "− $8,200",
  },
  {
    label: "COGS",
    descriptor: "What goes out",
    value: "− $3,140",
  },
  {
    label: "The rest",
    descriptor: "What goes out",
    value: "− $2,940",
  },
] as const;

const CHECK_DELAYS = [260, 720, 1180, 1640, 2240] as const;

export function ProfitPerch() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [checkStep, setCheckStep] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let hasPlayed = false;
    let timers: number[] = [];

    const clearTimers = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [];
    };

    const play = () => {
      if (hasPlayed) return;
      hasPlayed = true;
      clearTimers();

      if (reducedMotionQuery.matches) {
        setCheckStep(5);
        return;
      }

      setCheckStep(0);
      CHECK_DELAYS.forEach((delay, index) => {
        timers.push(
          window.setTimeout(() => {
            setCheckStep(index + 1);
          }, delay),
        );
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        play();
        observer.unobserve(root);
      },
      {
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.28,
      },
    );

    const handleReducedMotionChange = () => {
      clearTimers();

      if (reducedMotionQuery.matches) {
        hasPlayed = true;
        setCheckStep(5);
        observer.unobserve(root);
        return;
      }

      hasPlayed = false;
      setCheckStep(0);
      observer.observe(root);
    };

    observer.observe(root);
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);

    return () => {
      clearTimers();
      observer.disconnect();
      reducedMotionQuery.removeEventListener(
        "change",
        handleReducedMotionChange,
      );
    };
  }, []);

  const resolved = checkStep === 5;
  const readyCount = Math.min(checkStep, NUMBER_CHECKS.length);
  const birdeeTilt = ["-2deg", "1deg", "-1deg", "1.5deg", "0deg", "-1deg"][
    checkStep
  ];

  return (
    <div
      ref={rootRef}
      className="vlab-profit-checkin"
      data-check-step={checkStep}
      data-resolved={resolved ? "true" : "false"}
      style={
        {
          "--checkin-birdee-tilt": birdeeTilt,
        } as CSSProperties
      }
    >
      <div className="vlab-shell vlab-profit-checkin-shell">
        <div className="vlab-checkin-intro">
          <p className="vlab-eyebrow">How it works</p>
          <h2 id="how-title">
            Four numbers.
            <br />
            <span>One useful answer.</span>
          </h2>
          <p className="vlab-checkin-lede">
            <span>The numbers are already in yr business.</span>
            <strong>
              Birdee brings them together and shows you the one that matters.
            </strong>
          </p>
          <div className="vlab-checkin-promise">
            <span aria-hidden="true">✓</span>
            <p>
              No spreadsheets.
              <strong> Under 5 min a week.</strong>
            </p>
          </div>
        </div>

        <div className="vlab-checkin-product">
          <div className="vlab-checkin-toolbar">
            <div>
              <span className="vlab-checkin-live-dot" aria-hidden="true" />
              <strong>Your weekly numbers</strong>
            </div>
            <span className="vlab-checkin-ready" aria-live="polite">
              {resolved ? "Profit ready" : `${readyCount} of 4 ready`}
            </span>
          </div>

          <div className="vlab-checkin-birdee" aria-hidden="true">
            <img
              src="/media/landing-video-lab/birdee-four-numbers-perch-v1.webp"
              alt=""
              width={1254}
              height={1254}
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="vlab-checkin-rows">
            {NUMBER_CHECKS.map((item, index) => {
              const checked = index < readyCount;
              const active = index === checkStep && checkStep < 4;

              return (
                <article
                  key={item.label}
                  className="vlab-checkin-row"
                  data-active={active ? "true" : "false"}
                  data-checked={checked ? "true" : "false"}
                  aria-label={`${item.label}: ${item.value}`}
                  style={
                    {
                      "--checkin-row-shift": `${-0.15 - index * 0.035}rem`,
                    } as CSSProperties
                  }
                >
                  <span className="vlab-checkin-status" aria-hidden="true">
                    <i />
                  </span>
                  <div>
                    <small>{item.descriptor}</small>
                    <h3>{item.label}</h3>
                  </div>
                  <strong>{item.value}</strong>
                </article>
              );
            })}
          </div>

          <div className="vlab-checkin-result">
            <div className="vlab-checkin-result-waiting" aria-hidden="true">
              <span>One clear answer</span>
              <strong>Checking the four numbers…</strong>
            </div>

            <div
              className="vlab-checkin-result-ready"
              aria-hidden={resolved ? undefined : true}
            >
              <div>
                <span>Profit</span>
                <strong>$4,140</strong>
              </div>
              <p>
                <span aria-hidden="true">↗</span>
                Ahead of budget. Get in.
              </p>
            </div>
          </div>

          <p className="vlab-visually-hidden" aria-live="polite">
            {resolved
              ? "Revenue of $18,420 minus wages, COGS and the rest leaves $4,140 profit. You are ahead of budget."
              : ""}
          </p>
        </div>
      </div>

      <div id="how-it-works-result" className="vlab-checkin-result-anchor">
        <span className="vlab-visually-hidden">
          Revenue of $18,420 minus wages of $8,200, COGS of $3,140 and other
          costs of $2,940 leaves $4,140 profit, currently ahead of budget.
        </span>
      </div>
    </div>
  );
}
