"use client";

import { signedProfit, type LedgerRow } from "@/lib/profit";

/**
 * v4 day strip — seven uniform 64px cells. Same domain logic as v3's
 * DayStrip (dot colour: deep profit green beat budget, profit-green at 45%
 * opacity for profit-but-under, loss colour for a loss day); upcoming days
 * always show an ink-8 dot rather than hiding it, per the v4 spec.
 */
export function DayStrip({
  rows,
  selected,
  onSelect,
}: {
  rows: LedgerRow[];
  selected: number | null;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="v4-daystrip" role="group" aria-label="Days of the week">
      {rows.map((row) => {
        const isToday = row.status === "today";
        const isPast = row.status === "past" && row.actual;

        let dotClass = "v4-day-dot";
        if (isPast && row.actual) {
          dotClass +=
            row.actual.net >= row.predicted.net
              ? " v4-day-dot--beat"
              : row.actual.net >= 0
                ? " v4-day-dot--under"
                : " v4-day-dot--loss";
        }

        const figure = isPast && row.actual ? row.actual.net : row.predicted.net;

        return (
          <button
            key={row.index}
            type="button"
            className={`v4-day v4-focusable ${isToday ? "v4-day--today" : ""}`}
            aria-pressed={selected === row.index}
            onClick={() => onSelect(row.index)}
          >
            <span className={`v4-day-label ${isToday ? "v4-day-label--today" : ""}`}>{row.label}</span>
            <span className={`tnum v4-day-figure ${isPast ? "" : "v4-day-figure--upcoming"}`}>
              {signedProfit(figure)}
            </span>
            <span className={dotClass} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
