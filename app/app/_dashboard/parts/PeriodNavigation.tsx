import { PERIODS } from "@/lib/profit";
import type { PeriodKey } from "@/lib/profit";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

export function PeriodNavigation({
  periodKey,
  availablePeriodKeys,
  onPeriod,
}: {
  periodKey: PeriodKey;
  availablePeriodKeys: ReadonlySet<PeriodKey>;
  onPeriod: (key: PeriodKey) => void;
}) {
  const availablePeriods = PERIODS.filter((period) => availablePeriodKeys.has(period.key));
  const activeIndex = availablePeriods.findIndex((period) => period.key === periodKey);
  const previous = availablePeriods[Math.max(0, activeIndex - 1)]?.key
    ?? availablePeriods[0].key;
  const next = availablePeriods[Math.min(availablePeriods.length - 1, activeIndex + 1)]?.key
    ?? availablePeriods[availablePeriods.length - 1].key;
  return (
    <div className="period-nav" aria-label="Choose reporting period">
      <button className="period-arrow" type="button" aria-label="Previous period" disabled={activeIndex <= 0} onClick={() => onPeriod(previous)}><CaretLeft weight="bold" /></button>
      {PERIODS.map((period) => (
        <button
          key={period.key}
          type="button"
          className={periodKey === period.key ? "period-button is-active" : "period-button"}
          aria-pressed={periodKey === period.key}
          aria-label={availablePeriodKeys.has(period.key) ? period.label : `${period.label} — available after launch`}
          aria-haspopup={period.key === "custom" && availablePeriodKeys.has(period.key) ? "dialog" : undefined}
          disabled={!availablePeriodKeys.has(period.key)}
          title={availablePeriodKeys.has(period.key) ? undefined : "Available after launch"}
          onClick={() => onPeriod(period.key)}
        >
          {period.label}
        </button>
      ))}
      <button className="period-arrow" type="button" aria-label="Next period" disabled={activeIndex >= availablePeriods.length - 1} onClick={() => onPeriod(next)}><CaretRight weight="bold" /></button>
    </div>
  );
}
