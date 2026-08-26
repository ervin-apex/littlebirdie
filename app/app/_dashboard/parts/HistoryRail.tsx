import { signedProfit } from "@/lib/profit";
import type { DayCell, LedgerRow } from "@/lib/profit";

export function HistoryRail({ rows }: { rows: LedgerRow[] }) {
  return (
    <div className="history-rail" role="list" aria-label="Profit history by week">
      {rows.map((row) => {
        const actual = row.actual as DayCell;
        const difference = actual.net - row.predicted.net;
        return (
          <div className="history-score" role="listitem" key={`${row.index}-${row.label}`}>
            <span>{row.label}</span>
            <strong className={`tnum ${actual.net >= 0 ? "good" : "bad"}`}>{signedProfit(actual.net)}</strong>
            <small>Budget {signedProfit(row.predicted.net)}</small>
            <em className={`tnum ${difference >= 0 ? "good" : "bad"}`}>{signedProfit(difference)}</em>
          </div>
        );
      })}
    </div>
  );
}
