"use client";

import { signedProfit, type LedgerRow } from "@/lib/profit";

/**
 * 7 equal day chips. Done days show their actual $ + a status dot (deep
 * green = beat budget, soft green = profit but under budget, red = loss);
 * today gets an accent ring + "Today" label; upcoming days show the budget
 * number at 65% opacity. Whole chip is a >=44px-tall button.
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
    <div className="v2-daystrip" role="group" aria-label="Days of the week">
      {rows.map((row) => {
        const isToday = row.status === "today";
        const dot =
          row.status === "past" && row.actual
            ? row.actual.net >= row.predicted.net
              ? "deep"
              : row.actual.net >= 0
                ? "soft"
                : "red"
            : null;

        return (
          <button
            key={row.index}
            type="button"
            className={`v2-chip v2-focusable ${isToday ? "v2-chip--today" : ""}`}
            aria-pressed={selected === row.index}
            onClick={() => onSelect(row.index)}
          >
            <span className="v2-micro v2-muted">{row.label}</span>
            {row.status === "past" && row.actual ? (
              <>
                <span className="v2-small tnum">{signedProfit(row.actual.net)}</span>
                {dot && <span className={`v2-dot v2-dot--${dot}`} aria-hidden />}
              </>
            ) : isToday ? (
              <>
                <span className="v2-small tnum v2-muted">{signedProfit(row.predicted.net)}</span>
                <span className="v2-micro">Today</span>
              </>
            ) : (
              <span className="v2-small tnum v2-muted">{signedProfit(row.predicted.net)}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
