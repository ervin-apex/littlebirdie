import { fullDayName } from "../copy";
import { DayRail } from "../parts/DayRail";
import { ViewBack } from "../parts/ViewBack";
import { BirdeeMascot } from "@/components/BirdeeMascot";
import { ProductButton } from "@/components/ProductButton";
import { money, profit, signedProfit } from "@/lib/profit";
import type { DayCell, LedgerRow } from "@/lib/profit";
import { ChartLineUp, Check } from "@phosphor-icons/react";

export function DayVerdictView({
  row,
  rows,
  periodTitle,
  onBack,
  onExplain,
  onSelectDay,
}: {
  row: LedgerRow;
  rows: LedgerRow[];
  periodTitle: string;
  onBack: () => void;
  onExplain: () => void;
  onSelectDay: (index: number) => void;
}) {
  const actual = row.actual as DayCell;
  const difference = actual.net - row.predicted.net;
  const dayName = fullDayName(row.label);
  const verdict = Math.abs(difference) < 0.5
    ? `${dayName} matched budget.`
    : `${dayName} finished ${money(Math.abs(difference))} ${difference >= 0 ? "ahead of" : "behind"} budget.`;
  return (
    <div className="day-verdict-view">
      <ViewBack label={periodTitle} onClick={onBack} />
      <div className="day-title"><h1>{dayName}</h1><span className={difference >= 0 ? "status-check" : "status-concern"}>{difference >= 0 ? <Check weight="bold" /> : "•"}</span></div>
      <section className="day-verdict-strip" aria-labelledby="day-verdict-headline">
        <div className="day-verdict-answer">
          <BirdeeMascot state={difference >= 0 ? "profit" : "loss"} size={116} />
          <div>
            <h2 id="day-verdict-headline">{verdict}</h2>
            <span>Estimated profit</span>
            <strong className={`tnum ${actual.net >= 0 ? "good" : "bad"}`}>{signedProfit(actual.net)}</strong>
          </div>
        </div>
        <div className="day-verdict-comparison">
          <div><span>Budget</span><strong className="tnum">{signedProfit(row.predicted.net)}</strong></div>
          <div><span>Difference</span><strong className={`tnum ${difference >= 0 ? "good" : "bad"}`}>{signedProfit(difference)}</strong></div>
          <ProductButton variant="primary" className="primary-action" onClick={onExplain} leadingIcon={<ChartLineUp size={20} weight="bold" />}>
            What happened
          </ProductButton>
        </div>
      </section>
      <div className="day-verdict-rail"><DayRail rows={rows} selectedDay={row.index} onSelect={onSelectDay} compact /></div>
    </div>
  );
}
