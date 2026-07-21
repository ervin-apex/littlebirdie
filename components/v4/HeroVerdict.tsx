"use client";

import { useEffect, useRef, useState } from "react";
import { BirdeeMascot } from "@/components/BirdeeMascot";
import { money, signedProfit, type PeriodKey } from "@/lib/profit";

export type HeroMode = "compare" | "forecast";

/** Copied verbatim from components/v3/HeroVerdict.tsx's subline() — the
 * humane, period-aware subline copy must survive the subtraction pass
 * exactly. Never red framing; returns null when no benchmarked situation
 * applies (no line is safer than an invented one). */
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
 * v4 hero — one flat row inside the panel, no band, no tint on the block
 * itself. State colour is reserved for the numeral and the ahead/behind
 * word only. Count-up is the only number animation (500ms, instant under
 * reduced motion).
 */
export function HeroVerdict({
  label,
  value,
  budgetValue,
  mode,
  periodKey,
  daysLeft,
}: {
  label: string;
  value: number;
  budgetValue: number;
  mode: HeroMode;
  periodKey: PeriodKey;
  daysLeft: number;
}) {
  const inProfit = value >= 0;
  const delta = value - budgetValue; // > 0 = ahead of plan
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
    const dur = 500;
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
    }, dur + 100);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
    // Intentionally mount-only: the count-up plays once per verdict panel
    // instance (the page keys this panel by period so it replays on switch).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sub = subline(periodKey, mode, value, budgetValue, daysLeft, celebrate);

  let deltaSpan: React.ReactNode;
  if (delta > 0) {
    deltaSpan = <span className="v4-state-profit">{money(delta)} ahead</span>;
  } else if (delta < 0) {
    deltaSpan = <span className="v4-state-loss">{money(-delta)} behind</span>;
  } else {
    deltaSpan = <span>on plan</span>;
  }

  return (
    <section className="v4-hero">
      <div className="v4-hero-main">
        <p className="v4-hero-label">{label}</p>

        {celebrate && <span className="v4-chip">Ahead of plan</span>}

        <p className={`tnum v4-hero-figure ${inProfit ? "v4-hero-figure--profit" : "v4-hero-figure--loss"}`}>
          {display}
        </p>

        <p className="tnum v4-hero-plan">
          {mode === "compare" ? (
            <>Plan {signedProfit(budgetValue)} · {deltaSpan}</>
          ) : (
            "Forecast from your planned numbers"
          )}
        </p>

        {sub && <p className="v4-hero-sub">{sub}</p>}
      </div>

      <div className="v4-hero-mascot">
        <BirdeeMascot state={inProfit ? "profit" : "loss"} size={64} float={false} />
      </div>
    </section>
  );
}
