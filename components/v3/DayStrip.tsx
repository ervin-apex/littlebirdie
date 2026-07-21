"use client";

import { signedProfit, type LedgerRow } from "@/lib/profit";

/**
 * v3 day strip — 7 chunky game tokens using the push-button physics (solid
 * edge, press-down on :active). Mono day ordinal, profit figure, status
 * dot. Selected = pear-filled with a deeper edge; Today = 2px ink outline
 * + a coral corner dot. Same domain logic as v2's DayStrip (status dot
 * colour: deep green beat budget, soft green profit-but-under, red loss).
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
    <div className="v3-daystrip" role="group" aria-label="Days of the week">
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
            className={`v3-token v3-focusable ${isToday ? "v3-token--today" : ""}`}
            aria-pressed={selected === row.index}
            onClick={() => onSelect(row.index)}
          >
            <span className="v3-token-day">{row.label}</span>
            {row.status === "past" && row.actual ? (
              <span className="tnum v3-token-figure">{signedProfit(row.actual.net)}</span>
            ) : isToday ? (
              <>
                <span className="tnum v3-token-figure v3-muted">
                  {signedProfit(row.predicted.net)}
                </span>
                <span className="v3-token-day">Today</span>
              </>
            ) : (
              <span className="tnum v3-token-figure v3-muted">
                {signedProfit(row.predicted.net)}
              </span>
            )}
            {dot && <span className={`v3-dot v3-dot--${dot}`} aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}
