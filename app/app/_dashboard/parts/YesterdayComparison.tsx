import { money, profit, signedProfit } from "@/lib/profit";
import type { LedgerRow } from "@/lib/profit";
import { ArrowRight } from "@phosphor-icons/react";

export function YesterdayComparison({ row }: { row: LedgerRow }) {
  if (!row.actual || !row.variance) return null;

  const variance = row.variance.net;
  const driverText = row.variance.driver === "revenue"
    ? `Actual was ${money(Math.abs(row.variance.rev))} ${row.variance.rev < 0 ? "below" : "above"} budget.`
    : row.variance.driver === "labour"
      ? `Wages were ${money(Math.abs(row.variance.lab))} ${row.variance.lab > 0 ? "over" : "under"} budget.`
      : "Actual and wages were the biggest drivers.";

  return (
    <section className="day-comparison" aria-labelledby="day-comparison-title">
      <div className="day-comparison-card">
        <h2 id="day-comparison-title">Yesterday vs budget</h2>
        <div className="day-comparison-track" aria-label={`Budget profit ${signedProfit(row.predicted.net)}, estimated profit ${signedProfit(row.actual.net)}`}>
          <div className="day-comparison-point is-budget">
            <span>Budget profit</span>
            <strong className="tnum">{signedProfit(row.predicted.net)}</strong>
          </div>
          <div className="day-comparison-arrow" aria-hidden="true">
            <span />
            <ArrowRight weight="bold" />
          </div>
          <div className="day-comparison-point is-actual">
            <span>Estimated profit</span>
            <strong className="tnum">{signedProfit(row.actual.net)}</strong>
          </div>
        </div>
        <div className={variance >= 0 ? "day-comparison-verdict is-positive" : "day-comparison-verdict is-concerned"}>
          <strong className="tnum">{signedProfit(variance)}</strong>
          <span>{variance >= 0 ? "ahead of budget" : "behind budget"}</span>
        </div>
        <p className="day-comparison-driver"><strong>Main driver:</strong> {driverText}</p>
      </div>
    </section>
  );
}
