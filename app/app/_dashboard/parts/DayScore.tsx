import { fullDayName } from "../copy";
import { money, signedProfit } from "@/lib/profit";
import type { LedgerRow } from "@/lib/profit";
import { ArrowDown, ArrowRight, ArrowUp, Check, Minus, Plus } from "@phosphor-icons/react";

export function DayScore({
  row,
  selected,
  compact,
  onSelect,
  onOpen,
  onCheckIn,
}: {
  row: LedgerRow;
  selected: boolean;
  compact: boolean;
  onSelect: () => void;
  onOpen?: () => void;
  onCheckIn?: () => void;
}) {
  const actual = row.actual?.net;
  const difference = row.variance?.net;
  const isCompleted = actual != null;
  const isToday = row.status === "today";

  if (compact) {
    return (
      <button
        type="button"
        role="listitem"
        className={`day-score ${selected ? "is-selected" : ""} ${!isCompleted ? "is-upcoming" : ""}`}
        onClick={isCompleted ? onSelect : onCheckIn}
        disabled={!isCompleted && !onCheckIn}
        aria-pressed={selected}
      >
        <span className="day-name">{row.label}</span>
        <span className={`day-dot ${isCompleted ? (difference ?? 0) >= 0 ? "is-good" : "is-behind" : ""}`}>
          {isCompleted ? <Check weight="bold" /> : ""}
        </span>
      </button>
    );
  }

  const performance = !isCompleted
    ? "pending"
    : Math.round(difference ?? 0) === 0
      ? "on-budget"
      : (difference ?? 0) > 0
        ? "ahead"
        : "behind";
  const PerformanceIcon = performance === "ahead"
    ? ArrowUp
    : performance === "behind"
      ? ArrowDown
      : Minus;
  const performanceLabel = performance === "ahead"
    ? "ahead"
    : performance === "behind"
      ? "behind"
      : performance === "on-budget"
        ? "on budget"
        : isToday
          ? "Today"
          : "Not done yet";

  return (
    <div
      role="listitem"
      className={`day-flight-stop is-${performance} ${selected ? "is-selected" : ""} ${onCheckIn && !isCompleted ? "is-check-in" : ""}`}
    >
      <button
        type="button"
        className="day-flight-trigger"
        onClick={isCompleted ? onSelect : onCheckIn}
        disabled={!isCompleted && !onCheckIn}
        aria-pressed={selected}
        aria-label={isCompleted
          ? `${fullDayName(row.label)}, ${signedProfit(difference ?? 0)} ${performanceLabel} budget`
          : onCheckIn
            ? `Add ${fullDayName(row.label)} actual`
            : `${fullDayName(row.label)}, ${performanceLabel}`}
      >
        <span className="day-name">{row.label}</span>
        <span className="day-flight-marker" aria-hidden="true">
          {isCompleted
            ? <PerformanceIcon weight="bold" />
            : onCheckIn
              ? <Plus weight="bold" />
              : null}
        </span>
        {isCompleted ? (
          <>
            <strong className="tnum day-flight-variance">{signedProfit(difference ?? 0)}</strong>
            <small>{performanceLabel}</small>
          </>
        ) : (
          <small>{onCheckIn ? "Add actual" : performanceLabel}</small>
        )}
      </button>

      {selected && isCompleted && (
        <div className="day-flight-breakdown" aria-label={`${fullDayName(row.label)} budget breakdown`}>
          <strong>{fullDayName(row.label)}</strong>
          <dl>
            <div><dt>Estimated</dt><dd className="tnum">{signedProfit(actual)}</dd></div>
            <div><dt>Budget</dt><dd className="tnum">{signedProfit(row.predicted.net)}</dd></div>
          </dl>
          <p className={`tnum is-${performance}`}>
            {money(Math.abs(difference ?? 0))} {performanceLabel} budget
          </p>
          {onOpen && (
            <button
              type="button"
              className="day-breakdown-action"
              onClick={onOpen}
              aria-label={`See ${fullDayName(row.label)} numbers`}
            >
              See {fullDayName(row.label)}&rsquo;s numbers
              <ArrowRight weight="bold" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
