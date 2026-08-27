import { totalCells } from "../numbers";
import { ViewBack } from "../parts/ViewBack";
import { BirdeeMascot } from "@/components/BirdeeMascot";
import { ProductButton } from "@/components/ProductButton";
import { cogsForRevenue, money, profit, revenueExGst, signedProfit } from "@/lib/profit";
import type { DayCell, LedgerRow, Week } from "@/lib/profit";
import { ArrowDown, ArrowRight, ArrowUp, ChartBar, Wallet } from "@phosphor-icons/react";

export function ResultExplanationView({
  backLabel,
  resultLabel,
  title,
  numbersActionLabel,
  rows,
  week,
  onBack,
  onFullNumbers,
}: {
  backLabel: string;
  resultLabel: string;
  title: string;
  numbersActionLabel: string;
  rows: LedgerRow[];
  week: Week;
  onBack: () => void;
  onFullNumbers: () => void;
}) {
  const actual = totalCells(rows, "actual");
  const budget = totalCells(rows, "predicted");
  const difference = actual.net - budget.net;
  const drivers = profitDrivers(actual, budget, week);
  const leadDriver = drivers[0];
  const leadDriverInsight = leadDriver?.key === "revenue"
    ? "Actual sales did most of the pulling."
    : leadDriver?.key === "wages"
      ? "Wages moved profit the most."
      : leadDriver?.key === "cogs"
        ? "Your cost of goods rate moved profit the most."
        : "Your other costs made the biggest difference.";
  const matchedBudget = Math.abs(difference) < 0.5;

  return (
    <div className="detail-view result-explanation-view">
      <ViewBack label={backLabel} onClick={onBack} />
      <div className="detail-title-row">
        <div>
          <h1>
            <span className="detail-title-full">{title}</span>
            <span className="detail-title-compact">What happened?</span>
          </h1>
          <p>Your result, without the spreadsheet.</p>
        </div>
      </div>

      <section className="result-explanation-panel" aria-labelledby="result-explanation-headline">
        <div className="result-explanation-answer">
          <BirdeeMascot state={difference >= 0 ? "profit" : "loss"} variant={difference < 0 ? "concerned" : undefined} size={88} />
          <div className="result-explanation-verdict">
            <h2 id="result-explanation-headline">
              {matchedBudget ? (
                "Profit matched budget."
              ) : (
                <>
                  Profit finished{" "}
                  <strong className={difference >= 0 ? "good" : "bad"}>{money(Math.abs(difference))}</strong>{" "}
                  {difference >= 0 ? "ahead of" : "behind"} budget.
                </>
              )}
            </h2>
            <p className="result-explanation-comparison">
              <span>Estimated <strong className={`tnum ${actual.net >= 0 ? "good" : "bad"}`}>{signedProfit(actual.net)}</strong></span>
              <i aria-hidden>{"\u00b7"}</i>
              <span>Budget <strong className={`tnum ${budget.net >= 0 ? "good" : "bad"}`}>{signedProfit(budget.net)}</strong></span>
            </p>
          </div>
        </div>

        <div className="result-explanation-evidence">
          <div className="bridge-section-head">
            <h3>Biggest drivers</h3>
          </div>

          <div className="profit-bridge" role="list" aria-label="How budget profit became estimated profit">
            <BridgeStep kind="start" label="Budget profit" value={budget.net} />
            {drivers.map((driver) => (
              <BridgeStep key={driver.key} kind="driver" label={driver.label} value={driver.impact} detail={driver.detail} />
            ))}
            <BridgeStep kind="finish" label="Estimated profit" value={actual.net} />
          </div>

          <div className="result-driver-insight">
            <BirdeeMascot state={difference >= 0 ? "profit" : "loss"} variant={difference < 0 ? "concerned" : undefined} size={78} />
            <p>{leadDriverInsight}</p>
          </div>
          <p className="bridge-note">Actual impact includes GST and budgeted COGS.</p>
        </div>
      </section>

      <div className="detail-footer">
        <ProductButton
          variant="tertiary"
          size="compact"
          onClick={onFullNumbers}
          trailingIcon={<ArrowRight weight="bold" />}
        >
          <span className="result-action-full">{numbersActionLabel}</span>
        </ProductButton>
      </div>
    </div>
  );
}

export type ProfitDriver = {
  key: string;
  label: string;
  detail: string;
  impact: number;
};

export function profitDrivers(actual: DayCell, budget: DayCell, week: Week): ProfitDriver[] {
  const revenueDelta = actual.rev - budget.rev;
  const wageDelta = actual.lab - budget.lab;
  const fixedDelta = actual.fix - budget.fix;
  const revenueImpact =
    revenueExGst(week, actual.rev) -
    revenueExGst(week, budget.rev) -
    (cogsForRevenue(week, actual.rev) -
      cogsForRevenue(week, budget.rev));
  const expectedActualCogs = cogsForRevenue(week, actual.rev);
  const cogsRateImpact = -(actual.cogs - expectedActualCogs);
  const wageImpact = -wageDelta;
  const fixedImpact = -fixedDelta;

  const candidates: ProfitDriver[] = [
    {
      key: "revenue",
      label: "Revenue",
      detail: `${money(revenueDelta)} ${revenueDelta >= 0 ? "above" : "below"} budget`,
      impact: revenueImpact,
    },
    {
      key: "cogs",
      label: "COGS rate",
      detail: `${money(actual.cogs - expectedActualCogs)} ${actual.cogs <= expectedActualCogs ? "under" : "over"} budget`,
      impact: cogsRateImpact,
    },
    {
      key: "wages",
      label: "Wages",
      detail: `${money(wageDelta)} ${wageDelta <= 0 ? "under" : "over"} budget`,
      impact: wageImpact,
    },
    {
      key: "fixed",
      label: "Fixed & variable",
      detail: `${money(fixedDelta)} ${fixedDelta <= 0 ? "under" : "over"} budget`,
      impact: fixedImpact,
    },
  ].filter((driver) => Math.abs(driver.impact) >= 0.5);

  const explained = candidates.reduce((sum, driver) => sum + driver.impact, 0);
  const difference = actual.net - budget.net;
  const residual = difference - explained;
  if (Math.abs(residual) >= 0.5) {
    candidates.push({ key: "residual", label: "Other", detail: "Other small movements", impact: residual });
  }

  const sorted = candidates.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  if (sorted.length <= 3) return sorted;
  const visible = sorted.slice(0, 2);
  const otherImpact = sorted.slice(2).reduce((sum, driver) => sum + driver.impact, 0);
  return [...visible, { key: "combined-other", label: "Other", detail: "Remaining movements combined", impact: otherImpact }];
}

export function BridgeStep({ kind, label, value, detail }: {
  kind: "start" | "driver" | "finish";
  label: string;
  value: number;
  detail?: string;
}) {
  const MovementIcon = value >= 0 ? ArrowUp : ArrowDown;

  return (
    <div className={`bridge-step is-${kind} ${kind !== "start" ? value >= 0 ? "is-positive" : "is-negative" : ""}`} role="listitem">
      <span className="bridge-node" aria-hidden>
        {kind === "start" ? <Wallet weight="bold" /> : kind === "finish" ? <ChartBar weight="bold" /> : <MovementIcon weight="bold" />}
      </span>
      <span className="bridge-step-copy">
        <strong>{label}</strong>
      </span>
      <span className="bridge-step-value">
        <strong className={`tnum ${value >= 0 ? "good" : "bad"}`}>{signedProfit(value)}</strong>
      </span>
      {detail && <small className="bridge-step-detail">{detail}</small>}
    </div>
  );
}
