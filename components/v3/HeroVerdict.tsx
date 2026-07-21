"use client";

import { useEffect, useRef, useState } from "react";
import { BirdeeMascot } from "@/components/BirdeeMascot";
import { money, signedProfit, type PeriodKey } from "@/lib/profit";

export type HeroMode = "compare" | "forecast";

/** Copied verbatim from components/v2/HeroVerdict.tsx — the humane, period-
 * aware subline logic must survive the reskin exactly. Never red framing;
 * returns null when no benchmarked situation applies (no line is safer than
 * an invented one). */
function subline(
  periodKey: PeriodKey,
  mode: HeroMode,
  value: number,
  budgetValue: number,
  daysLeft: number,
  celebrate: boolean,
): string | null {
  if (celebrate) return "Ahead of plan — keep doing what you're doing.";

  const behindAmount = budgetValue - value; // > 0 = behind budget

  if (periodKey === "this-week" && mode === "compare") {
    if (value < 0) {
      return daysLeft === 0
        ? "Today's the last day to close the gap."
        : `There are ${daysLeft} days left this week to close the gap.`;
    }
    if (value > 0 && behindAmount > 0) {
      return daysLeft === 0
        ? "Behind plan, still in profit — one last push today."
        : `Behind plan, still in profit — ${daysLeft} days left to catch up.`;
    }
    return null;
  }

  if (periodKey === "yesterday") {
    if (value < 0) return "Yesterday's banked. Today's a clean slate.";
    return null;
  }

  if (periodKey === "last-week") {
    if (value < 0 || behindAmount > 0) {
      return "Last week's done — this week is the one you can change.";
    }
    return null;
  }

  if (periodKey === "next-week") {
    return value < 0
      ? "Your plan lands short. A small revenue or wages tweak could flip it."
      : "Your plan lands in the black. Lock it in.";
  }

  return null;
}

/**
 * v3 hero — Stat-Led. Full-bleed band tinted by state (profit-band /
 * loss-band / a richer celebrate tint); the giant JetBrains Mono numeral is
 * a scoreboard figure with the clipped-background highlighter running under
 * it (hum.md's emphasis technique, applied to the display number per that
 * file's guidance). A mono ledger sub-line replaces v2's delta pill
 * ("PLAN +$8,182 · $953 AHEAD"), then the same humane subline in body sans.
 * Birdee overlaps the band's bottom edge — the one off-grid character
 * moment. Star-burst fires once on mount when celebrate is true.
 */
export function HeroVerdict({
  label,
  value,
  budgetValue,
  mode,
  periodKey,
  daysLeft,
  children,
}: {
  label: string;
  value: number;
  budgetValue: number;
  mode: HeroMode;
  periodKey: PeriodKey;
  daysLeft: number;
  children?: React.ReactNode;
}) {
  const inProfit = value >= 0;
  const behind = budgetValue - value; // > 0 = behind budget
  // Outcome-tied only: genuinely in profit AND at/ahead of plan. Never for
  // forecasts (mode !== "compare"), never for merely-positive-but-behind days.
  const celebrate = mode === "compare" && value > 0 && value >= budgetValue;

  const [display, setDisplay] = useState(() => signedProfit(0));
  const raf = useRef<number | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(signedProfit(value));
      return;
    }
    let done = false;
    const dur = 1200; // hum.md's counter tick-up duration
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplay(signedProfit(value * eased));
      if (k < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        done = true;
      }
    };
    raf.current = requestAnimationFrame(tick);
    settleTimer.current = setTimeout(() => {
      if (!done) setDisplay(signedProfit(value));
    }, dur + 200);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
    // Intentionally mount-only: the count-up plays once per verdict panel
    // instance (the page keys this panel by period so it replays on switch).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let deltaText: string;
  let deltaTone: "profit" | "loss" | "neutral";
  if (celebrate) {
    deltaText = behind === 0 ? "ON BUDGET" : `${money(-behind)} AHEAD`;
    deltaTone = "profit";
  } else if (behind > 0) {
    deltaText = `${money(behind)} BEHIND`;
    deltaTone = "loss";
  } else if (behind < 0) {
    deltaText = `${money(-behind)} AHEAD`;
    deltaTone = "profit";
  } else {
    deltaText = "ON BUDGET";
    deltaTone = "neutral";
  }

  const sub = subline(periodKey, mode, value, budgetValue, daysLeft, celebrate);

  const bandClass = celebrate
    ? "v3-hero-band--celebrate"
    : inProfit
      ? "v3-hero-band--profit"
      : "v3-hero-band--loss";

  const toneClass =
    deltaTone === "profit" ? "v3-hero-sub__profit" : deltaTone === "loss" ? "v3-hero-sub__loss" : "";

  return (
    <section className={`v3-hero-band v3-band ${bandClass}`}>
      <div className="v3-band-inner">
        <div className="v3-hero-grid">
          <div className="v3-hero-main">
            <p className="v3-eyebrow">{label}</p>

            <p
              className={`tnum v3-hero-figure ${inProfit ? "v3-hero-figure--profit" : "v3-hero-figure--loss"}`}
            >
              <span>{display}</span>
              {/* star-burst rides the numeral itself — just off the last digit,
                  not floating in empty band space */}
              {celebrate && (
                <span
                  className="v3-star-burst"
                  aria-hidden="true"
                  style={{ top: "-0.08em", right: "-0.42em" }}
                />
              )}
            </p>

            <p className="tnum v3-hero-sub">
              {mode === "compare" ? (
                <>
                  PLAN {signedProfit(budgetValue)} · <span className={toneClass}>{deltaText}</span>
                </>
              ) : (
                <>FORECAST FROM PLAN {signedProfit(budgetValue)}</>
              )}
            </p>

            {sub && <p className="v3-body v3-hero-humane">{sub}</p>}
          </div>

          <div className="v3-mascot-wrap">
            <BirdeeMascot
              state={inProfit ? "profit" : "loss"}
              size={96}
              float={false}
              className="v3-mascot"
            />
          </div>

          {/* break-even docks inside the band — the verdict and its context
              are one instrument, and the band has no dead air */}
          {children && <div className="v3-hero-be">{children}</div>}
        </div>
      </div>
    </section>
  );
}
