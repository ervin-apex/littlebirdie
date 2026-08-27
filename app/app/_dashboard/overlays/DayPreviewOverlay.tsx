import { fullDayName } from "../copy";
import { BirdeeMascot } from "@/components/BirdeeMascot";
import { ProductButton } from "@/components/ProductButton";
import { money, profit, signedProfit } from "@/lib/profit";
import type { LedgerRow } from "@/lib/profit";
import { ArrowRight, X } from "@phosphor-icons/react";

export function DayPreviewOverlay({ row, onClose, onOpen }: {
  row: LedgerRow;
  onClose: () => void;
  onOpen: () => void;
}) {
  if (!row.actual) return null;
  const difference = row.variance?.net ?? row.actual.net - row.predicted.net;
  const performance = Math.round(difference) === 0 ? "on budget" : difference > 0 ? "ahead" : "behind";
  const statusLabel = performance === "on budget"
    ? "On budget"
    : performance === "ahead"
      ? "Ahead of budget"
      : "Behind budget";
  const verdictLabel = performance === "on budget"
    ? "on budget"
    : performance === "ahead"
      ? "ahead of budget"
      : "behind budget";
  const dayName = fullDayName(row.label);
  const driverInsight = row.variance?.driver === "revenue"
    ? "Actual sales did most of the pulling."
    : row.variance?.driver === "labour"
      ? "Wages made the biggest difference."
      : "Your daily costs made the biggest difference.";

  return (
    <div className="day-preview-layer">
      <button type="button" className="day-preview-scrim" aria-label="Close day summary" onClick={onClose} />
      <section className="day-preview-panel" role="dialog" aria-modal="true" aria-labelledby="day-preview-title">
        <span className="day-preview-handle" aria-hidden="true" />
        <button type="button" className="day-breakdown-close" aria-label="Close day summary" onClick={onClose}>
          <X weight="bold" aria-hidden="true" />
        </button>
        <h2 id="day-preview-title">{dayName}</h2>
        <p className={`day-preview-status is-${performance.replace(" ", "-")}`}>{statusLabel}</p>
        <strong className={`tnum day-preview-verdict is-${performance.replace(" ", "-")}`}>
          {money(Math.abs(difference))} {verdictLabel}
        </strong>
        <p className="day-preview-support">
          Estimated profit finished at {signedProfit(row.actual.net)} against a budget of {signedProfit(row.predicted.net)}.
        </p>
        <dl className="day-preview-values">
          <div><dt>Estimated</dt><dd className="tnum">{signedProfit(row.actual.net)}</dd></div>
          <div><dt>Budget</dt><dd className="tnum">{signedProfit(row.predicted.net)}</dd></div>
        </dl>
        <div className="day-preview-insight">
          <BirdeeMascot state={difference >= 0 ? "profit" : "loss"} size={74} />
          <p>{driverInsight}</p>
        </div>
        <ProductButton variant="secondary" fullWidth onClick={onOpen} trailingIcon={<ArrowRight weight="bold" />}>
          How {dayName} went
        </ProductButton>
        <button type="button" className="day-preview-close-action" onClick={onClose}>Close</button>
      </section>
    </div>
  );
}
