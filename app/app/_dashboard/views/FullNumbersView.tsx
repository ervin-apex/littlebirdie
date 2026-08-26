import { fullDayName } from "../copy";
import { totalCells } from "../numbers";
import { ReconciliationTable } from "../parts/ReconciliationTable";
import { ViewBack } from "../parts/ViewBack";
import { BirdeeMascot } from "@/components/BirdeeMascot";
import { ProductButton } from "@/components/ProductButton";
import { money, profit, scopeBreakeven, signedProfit } from "@/lib/profit";
import type { LedgerRow, Week } from "@/lib/profit";
import { ArrowDown, ArrowRight, Check, PencilSimpleLine } from "@phosphor-icons/react";
import { useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";

export function FullNumbersView({
  backLabel,
  title,
  rows,
  week,
  mode,
  rowLabel,
  onBack,
  onSelectDay,
}: {
  backLabel: string;
  title: string;
  rows: LedgerRow[];
  week: Week;
  mode: "week" | "day" | "history";
  rowLabel: "Day" | "Week";
  onBack: () => void;
  onSelectDay: (index: number) => void;
}) {
  const [activeView, setActiveView] = useState<"overview" | "detail">("overview");
  const [showAllNumbers, setShowAllNumbers] = useState(mode === "day");
  const completed = rows.filter((row) => row.actual);
  const actual = totalCells(completed, "actual");
  const budgetToDate = totalCells(completed, "predicted");
  const scopeBudget = totalCells(rows, "predicted");
  const isFutureScope = rows.length > 0 && rows.every((row) => !row.actual);
  const displayedResult = isFutureScope ? scopeBudget : actual;
  const comparisonBudget = isFutureScope ? scopeBudget : budgetToDate;
  const difference = displayedResult.net - comparisonBudget.net;
  const be = scopeBreakeven(rows, week);
  const breakEvenDelta = scopeBudget.rev - be.breakeven;
  const isShortOfBreakEven = breakEvenDelta < 0;
  const breakEvenGap = Math.abs(breakEvenDelta);
  const breakEvenScale = Math.max(1, scopeBudget.rev, be.breakeven);
  const revenuePlanPosition = Math.min(100, (scopeBudget.rev / breakEvenScale) * 100);
  const breakEvenPosition = Math.min(100, (be.breakeven / breakEvenScale) * 100);
  const gapPosition = (revenuePlanPosition + breakEvenPosition) / 2;
  const wagesPct = scopeBudget.netRevenue > 0
    ? (scopeBudget.lab / scopeBudget.netRevenue) * 100
    : 0;
  const scopeKicker = mode === "day"
    ? "Day outlook"
    : mode === "history"
      ? "Selected-range outlook"
      : "Full-week outlook";
  const breakEvenStatus = `${money(breakEvenGap)} ${isShortOfBreakEven ? "short of" : "above"} break-even`;
  const breakEvenSupport = isShortOfBreakEven
    ? "Your sales budget is close, but it does not cover the current cost mix yet."
    : "Your sales budget clears the current cost mix."
  const breakEvenCallout = isShortOfBreakEven
    ? `At this cost mix, you need another ${money(breakEvenGap)} in sales to reach $0 profit.`
    : `At this cost mix, the budget clears break-even by ${money(breakEvenGap)}.`;
  const enteredRows = rows.filter((row) => row.actual).length;
  const currentRow = rows.find((row) => row.status === "today");
  const isDailyDetail = rowLabel === "Day";
  const detailTitle = isDailyDetail ? "Daily profit" : "Weekly profit";
  const detailSummary = isDailyDetail
    ? `${enteredRows} of ${rows.length} days entered${currentRow ? ` · Today is ${fullDayName(currentRow.label)}` : ""}`
    : `${enteredRows} ${enteredRows === 1 ? "week" : "weeks"} in this range`;

  return (
    <>
      <div className="full-numbers-view">
      <div className="full-numbers-heading">
        <ViewBack label={backLabel} onClick={onBack} />
        <h1>{title}</h1>
      </div>

      <section className={`full-profit-hero is-${mode}`} aria-labelledby="full-profit-value">
        <BirdeeMascot
          state={difference >= 0 ? "profit" : "loss"}
          variant={difference < 0 ? "concerned" : undefined}
          size={122}
          className="full-profit-birdee"
        />
        <div className="full-profit-result">
          <strong
            id="full-profit-value"
            className={`tnum ${displayedResult.net >= 0 ? "good" : "bad"}`}
          >
            {signedProfit(displayedResult.net)}
          </strong>
          <span>
            {isFutureScope
              ? "Forecast EBITDA · not cash flow"
              : mode === "week"
                ? "Estimated EBITDA to date · not cash flow"
                : "Estimated EBITDA · not cash flow"}
          </span>
        </div>
        <div className="full-profit-comparison">
          <p>
            {Math.abs(difference) < 0.5 ? (
              "Right on budget."
            ) : (
              <>
                You&apos;re <strong className={difference >= 0 ? "good" : "bad"}>{money(Math.abs(difference))}</strong>{" "}
                {difference >= 0 ? "ahead of" : "behind"} budget.
              </>
            )}
          </p>
          <span>
            <strong className="tnum">{signedProfit(comparisonBudget.net)}</strong>{" "}
            {isFutureScope ? "from your budget" : mode === "week" ? "budget to date" : "budget"}
          </span>
        </div>
      </section>

      {mode !== "day" && (
        <div className="full-numbers-tabs" role="tablist" aria-label="Numbers view">
          <button
            type="button"
            role="tab"
            aria-selected={activeView === "overview"}
            className={activeView === "overview" ? "is-active" : ""}
            onClick={() => setActiveView("overview")}
          >
            <Check weight="bold" aria-hidden />
            Overview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === "detail"}
            className={activeView === "detail" ? "is-active" : ""}
            onClick={() => setActiveView("detail")}
          >
            By {rowLabel.toLowerCase()}
          </button>
        </div>
      )}

      {(mode === "day" || activeView === "overview") ? (
        <div className="full-numbers-layout" role="tabpanel" aria-label="Overview">
          <ReconciliationTable
            actual={displayedResult}
            budget={comparisonBudget}
            gstActual={displayedResult.gst}
            gstBudget={comparisonBudget.gst}
            actualLabel={isFutureScope ? "Forecast" : "Result"}
            expanded={showAllNumbers}
            onToggle={() => setShowAllNumbers((current) => !current)}
          />

          <section className={`break-even-panel ${isShortOfBreakEven ? "is-short" : "is-clear"}`} aria-labelledby="break-even-title">
            <header className="break-even-title">
              <span>{scopeKicker}</span>
              <h2 id="break-even-title">Break-even picture</h2>
            </header>

            <p className="break-even-status">
              <strong className="tnum">{money(breakEvenGap)}</strong>{" "}
              {isShortOfBreakEven ? "short of" : "above"} break-even
            </p>
            <p className="break-even-support">{breakEvenSupport}</p>

            <div
              className="break-even-comparison"
              role="img"
              aria-label={`Sales budget ${money(scopeBudget.rev)}. Break-even ${money(be.breakeven)}. ${breakEvenStatus}.`}
            >
              <div className="break-even-comparison-labels">
                <span>Sales budget<strong className="tnum">{money(scopeBudget.rev)}</strong></span>
                <span>Break-even<strong className="tnum">{money(be.breakeven)}</strong></span>
              </div>
              <div
                className="break-even-track"
                style={{
                  "--revenue-plan-position": `${revenuePlanPosition}%`,
                  "--break-even-position": `${breakEvenPosition}%`,
                  "--gap-position": `${gapPosition}%`,
                } as CSSProperties}
              >
                <span className="break-even-progress" />
                <span className="break-even-plan-marker" />
                <span className="break-even-threshold-marker" />
                {breakEvenGap >= 0.5 && (
                  <span className="break-even-gap-label">{money(breakEvenGap)} gap</span>
                )}
              </div>
            </div>

            <div className="break-even-cost-context">
              <div><span>Wages</span><strong className="tnum">{wagesPct.toFixed(1)}%</strong><small>of net sales</small></div>
              <div><span>COGS rate</span><strong className="tnum">{week.cogs.toFixed(1)}%</strong><small>of sales excluding GST</small></div>
            </div>

            <div className="break-even-callout">
              <BirdeeMascot state="neutral" size={42} />
              <p>{breakEvenCallout}</p>
            </div>
          </section>
        </div>
      ) : (
        <section className="daily-numbers-panel full-numbers-detail-panel" role="tabpanel" aria-label={`By ${rowLabel.toLowerCase()}`}>
          <header className="daily-panel-heading">
            <div>
              <h2>{detailTitle}</h2>
              <p>{detailSummary}</p>
            </div>
            {isDailyDetail && <span>Open a completed day for its full breakdown.</span>}
          </header>
          <div className="daily-table-head"><span>{rowLabel}</span><span>Estimated</span><span>Budget</span><span>Vs budget</span></div>
          {rows.map((row) => {
            const delta = row.variance?.net ?? 0;
            const canOpen = Boolean(row.actual && mode === "week");
            const isAhead = delta >= 0;
            const statusLabel = row.actual
              ? isAhead ? "Ahead" : "Behind"
              : row.status === "past"
                ? "Missing"
                : row.status === "today" ? "Today" : "Upcoming";
            const emptyValueLabel =
              row.status === "future" ? "Not yet" : "Not entered";
            const rowClassName = [
              "daily-table-row",
              row.actual ? "is-complete" : "",
              canOpen ? "is-actionable" : "",
              `is-${row.status}`,
            ].filter(Boolean).join(" ");
            const rowContent = (
              <>
                <span className="daily-day-cell">
                  <strong>{isDailyDetail ? fullDayName(row.label) : row.label}</strong>
                  <span className={`daily-status ${row.actual ? isAhead ? "is-ahead" : "is-behind" : row.status === "past" ? "is-missing" : row.status === "today" ? "is-current" : "is-upcoming"}`}>
                    {row.actual && (isAhead ? <Check weight="bold" aria-hidden /> : <ArrowDown weight="bold" aria-hidden />)}
                    {!row.actual && <i aria-hidden />}
                    {statusLabel}
                  </span>
                </span>
                <strong className={`tnum daily-actual ${row.actual ? row.actual.net >= 0 ? "good" : "bad" : "daily-empty"}`}>
                  {row.actual ? signedProfit(row.actual.net) : emptyValueLabel}
                </strong>
                <span className="tnum daily-budget">{signedProfit(row.predicted.net)}</span>
                <span className={`daily-variance ${row.actual ? isAhead ? "good" : "bad" : "daily-empty"}`}>
                  {row.actual ? (
                    <>
                      <strong className="tnum">{money(Math.abs(delta))}</strong>
                      <small>{isAhead ? "ahead" : "behind"}</small>
                    </>
                  ) : (
                    <strong aria-label="No comparison yet">—</strong>
                  )}
                  {canOpen && <ArrowRight className="daily-row-arrow" weight="bold" aria-hidden />}
                </span>
              </>
            );

            return canOpen ? (
              <button
                type="button"
                key={row.index}
                className={rowClassName}
                onClick={() => onSelectDay(row.index)}
                aria-label={`View ${fullDayName(row.label)} details`}
              >
                {rowContent}
              </button>
            ) : (
              <div className={rowClassName} key={row.index}>
                {rowContent}
              </div>
            );
          })}
        </section>
      )}

      </div>

      {typeof document !== "undefined" && createPortal(
        <div className="full-numbers-mobile-dock" aria-label="Full numbers action">
          <ProductButton
            href="/app/plan"
            variant="primary"
            fullWidth
            leadingIcon={<PencilSimpleLine weight="bold" />}
          >
            Weekly budget
          </ProductButton>
        </div>,
        document.body,
      )}
    </>
  );
}
