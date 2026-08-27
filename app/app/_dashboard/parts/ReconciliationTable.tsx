import { componentEvidenceLabel, reconciliationValue, varianceValue } from "../reconciliation";
import { profit } from "@/lib/profit";
import type { DayCell } from "@/lib/profit";
import type { RevenueEntryBasis } from "@/lib/finance";
import { CaretDown, CaretUp } from "@phosphor-icons/react";

export function ReconciliationTable({
  actual,
  budget,
  gstActual,
  gstBudget,
  actualLabel,
  revenueEntryBasis,
  expanded,
  onToggle,
}: {
  actual: DayCell;
  budget: DayCell;
  gstActual: number;
  gstBudget: number;
  actualLabel: "Result" | "Forecast";
  revenueEntryBasis: RevenueEntryBasis;
  expanded: boolean;
  onToggle: () => void;
}) {
  const rows = [
    {
      key: "revenue",
      label: "Revenue",
      /* The row is named for the thing, not the mode - the Result and Budget
         columns already say which lens each figure is under. What an operator
         cannot tell from the columns is whether the figure carries GST, so
         that is what the definition line spells out. The wording tracks the
         venue's entry basis so it always matches the prompt on the check-in
         screen where the number was typed in. */
      definition: revenueEntryBasis === "gst-inclusive"
        ? "Sales including GST"
        : "Sales excluding GST",
      actual: actual.rev,
      budget: budget.rev,
      variance: actual.rev - budget.rev,
      positive: "above budget",
      negative: "below budget",
      driver: true,
      evidence: actual.componentProvenance.revenue,
    },
    {
      key: "other-income",
      label: "Recurring other income",
      actual: actual.otherIncome,
      budget: budget.otherIncome,
      variance: actual.otherIncome - budget.otherIncome,
      positive: "above budget",
      negative: "below budget",
      driver: false,
      evidence: actual.componentProvenance.recurringIncome,
    },
    {
      key: "cogs",
      label: "COGS",
      actual: -actual.cogs,
      budget: -budget.cogs,
      variance: 0,
      positive: "rate lower",
      negative: "rate higher",
      neutralLabel: "rate unchanged",
      driver: false,
      evidence: actual.componentProvenance.cogs,
    },
    {
      key: "wages",
      label: "Wages",
      actual: -actual.lab,
      budget: -budget.lab,
      variance: budget.lab - actual.lab,
      positive: "better than budget",
      negative: "over budget",
      driver: true,
      evidence: actual.componentProvenance.labour,
    },
    {
      key: "gst",
      label: "GST",
      actual: -gstActual,
      budget: -gstBudget,
      variance: 0,
      positive: "lower",
      negative: "higher",
      neutralLabel: "follows actual",
      driver: false,
      evidence: actual.componentProvenance.gst,
    },
    {
      key: "fixed",
      label: "Fixed & variable",
      actual: -actual.fix,
      budget: -budget.fix,
      variance: budget.fix - actual.fix,
      positive: "better than budget",
      negative: "over budget",
      driver: false,
      evidence: actual.componentProvenance.otherCosts,
    },
    {
      key: "profit",
      label: "Estimated EBITDA",
      actual: actual.net,
      budget: budget.net,
      variance: actual.net - budget.net,
      positive: "ahead of budget",
      negative: "behind budget",
      driver: false,
      evidence: actual.componentProvenance.profit,
    },
  ];
  const visibleRows = expanded ? rows : rows.filter((row) => row.driver);

  return (
    <section className={`numbers-reconciliation ${expanded ? "is-expanded" : "is-collapsed"}`} aria-labelledby="reconciliation-title">
      <div id="full-reconciliation-table" className="reconciliation-table" role="table" aria-label={`${actualLabel} compared with budget`}>
        <div className="reconciliation-head" role="row">
          <div role="columnheader">
            <h2 id="reconciliation-title">Where the gap came from</h2>
          </div>
          {expanded && (
            <>
              <span role="columnheader">{actualLabel}</span>
              <span role="columnheader">Budget</span>
              <span role="columnheader">Vs budget</span>
            </>
          )}
        </div>
        {visibleRows.map((item) => {
          const neutral = Math.abs(item.variance) < 0.5;
          const tone = neutral ? "neutral" : item.variance > 0 ? "good" : "bad";
          const descriptor = neutral ? item.neutralLabel ?? "on budget" : item.variance > 0 ? item.positive : item.negative;
          return (
            <div
              className={`reconciliation-row is-${item.key} ${item.driver ? "is-driver" : ""}`}
              role="row"
              key={item.key}
            >
              <span className="reconciliation-label">
                <strong>
                  {item.driver && <i aria-hidden="true" />}
                  {item.label}
                </strong>
                {item.definition && <small>{item.definition}</small>}
                {expanded && (
                  <small>{componentEvidenceLabel(item.evidence)}</small>
                )}
              </span>
              <span className="tnum" data-label={actualLabel}>{reconciliationValue(item.actual)}</span>
              <span className="tnum" data-label="Budget">{reconciliationValue(item.budget)}</span>
              <span className="reconciliation-variance">
                <strong className={`tnum ${tone}`}>{varianceValue(item.variance)}</strong>
                <small>{descriptor}</small>
              </span>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className="numbers-disclosure"
        aria-expanded={expanded}
        aria-controls="full-reconciliation-table"
        onClick={onToggle}
      >
        {expanded ? "Hide the breakdown" : "Show the breakdown"}
        {expanded ? <CaretUp weight="bold" /> : <CaretDown weight="bold" />}
      </button>
    </section>
  );
}
