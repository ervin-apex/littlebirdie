"use client";

import { useEffect, useRef, useState } from "react";
import { BirdeeMascot } from "@/components/BirdeeMascot";
import { money, signedProfit, type PeriodKey } from "@/lib/profit";

export type HeroMode = "compare" | "forecast";

/** One warm, period-aware line under the delta pill. Never red — humane
 * framing of the outcome, not another alarm. Returns null when none of the
 * benchmarked situations apply (no line is safer than an invented one). */
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
 * Full-width panel whose background IS the state (profit/loss wash). Hero
 * number counts up from 0 on mount (skipped under prefers-reduced-motion),
 * a scoreboard-style ledger line (PLAN figure) in compare mode, one
 * budget-delta pill, a humane period-aware subline, Birdee reacting to the
 * verdict, and a one-time sparkle burst on genuinely-ahead days. Flat pills
 * on the wash — no nested white cards.
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
    const dur = 600;
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

  let pill: { text: string; tone: "profit" | "loss" | "neutral" };
  if (mode === "forecast") {
    pill = { text: "Forecast from your planned numbers", tone: "neutral" };
  } else if (celebrate) {
    // Outcome-tied win: always the positive-green pill, even at exactly
    // on-budget (behind === 0) — the celebration state overrides the
    // neutral "On budget" tone used on an ordinary, non-celebrating day.
    pill =
      behind === 0
        ? { text: "On budget", tone: "profit" }
        : { text: `${money(-behind)} ahead of budget`, tone: "profit" };
  } else if (behind > 0) {
    pill = { text: `${money(behind)} behind budget`, tone: "loss" };
  } else if (behind < 0) {
    pill = { text: `${money(-behind)} ahead of budget`, tone: "profit" };
  } else {
    pill = { text: "On budget", tone: "neutral" };
  }

  const sub = subline(periodKey, mode, value, budgetValue, daysLeft, celebrate);

  const panelStateClass = celebrate
    ? "v2-hero-panel--celebrate"
    : inProfit
      ? "v2-hero-panel--profit"
      : "v2-hero-panel--loss";

  return (
    <section className={`v2-hero-panel ${panelStateClass}`}>
      {celebrate && (
        <div className="v2-sparkle-field" aria-hidden="true">
          <span className="v2-sparkle v2-sparkle-1 v2-sparkle--sm" />
          <span className="v2-sparkle v2-sparkle-2 v2-sparkle--lg v2-sparkle--profit" />
          <span className="v2-sparkle v2-sparkle-3 v2-sparkle--sm v2-sparkle--profit" />
          <span className="v2-sparkle v2-sparkle-4 v2-sparkle--lg" />
          <span className="v2-sparkle v2-sparkle-5 v2-sparkle--sm" />
        </div>
      )}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <p className="v2-micro v2-muted">{label}</p>
          <p
            className={`tnum v2-hero ${inProfit ? "v2-hero-figure--profit" : "v2-hero-figure--loss"}`}
            style={{ margin: "6px 0 0" }}
          >
            {display}
          </p>

          {mode === "compare" && (
            <div className="v2-ledger">
              <span className="v2-ledger__label tnum">PLAN {signedProfit(budgetValue)}</span>
            </div>
          )}

          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
            <span
              className={`v2-pill ${
                pill.tone === "profit"
                  ? "v2-pill--profit"
                  : pill.tone === "loss"
                    ? "v2-pill--loss"
                    : "v2-pill--neutral"
              }`}
            >
              {pill.text}
            </span>
            {sub && <span className="v2-small v2-hero-subline">{sub}</span>}
          </div>
        </div>
        <BirdeeMascot
          state={inProfit ? "profit" : "loss"}
          size={92}
          float={false}
          className="v2-mascot"
        />
      </div>
    </section>
  );
}
