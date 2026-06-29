"use client";

import {
  GST_DIVISOR,
  money,
  signedProfit,
  type DayCell,
  type LedgerRow,
} from "@/lib/profit";

/**
 * Scott's day-by-day budget-vs-actual spreadsheet (round 2), as a full little
 * P&L waterfall so the numbers visibly reconcile: Revenue − GST − Cost of goods
 * − Wages − Fixed & variable = Profit. Past days show actual (big) vs budget
 * (small); today + upcoming days show budget only.
 *
 * Cost of goods is a flat % of revenue, so its rate rides in the row label and
 * the per-day $ scales with that day's revenue. GST and cost-of-goods variance
 * just mirror revenue, so they're left neutral; only revenue, wages and profit
 * carry the green/red beat-vs-miss colour.
 */
type MetricKey = "rev" | "gst" | "cogs" | "lab" | "fix" | "net";

type Metric = { key: MetricKey; label: string; cost: boolean; color: boolean };

const METRICS: Metric[] = [
  { key: "rev", label: "Revenue", cost: false, color: true },
  { key: "gst", label: "GST", cost: true, color: false },
  { key: "cogs", label: "Cost of goods", cost: true, color: false },
  { key: "lab", label: "Wages", cost: true, color: true },
  { key: "fix", label: "Fixed & variable", cost: true, color: false },
  { key: "net", label: "Profit", cost: false, color: true },
];

/** Pull a metric's value off a day cell (GST is derived from revenue). */
function cellValue(key: MetricKey, cell: DayCell): number {
  if (key === "gst") return cell.rev - cell.rev / GST_DIVISOR;
  return cell[key as keyof DayCell];
}

function fmt(m: Metric, n: number): string {
  if (m.key === "net") return signedProfit(n);
  const s = money(n);
  return m.cost ? `−${s}` : s;
}

/** Colour an actual figure vs its budget for the metrics where it's meaningful
 *  (revenue up = good; wages down = good). Others stay neutral. */
function tone(m: Metric, actual: number, budget: number): string {
  if (!m.color || Math.abs(actual - budget) < 1) return "text-ink";
  const better = m.cost ? actual < budget : actual > budget;
  return better ? "text-emerald-600" : "text-red-600";
}

export function WeekSpreadsheet({ rows, cogsPct }: { rows: LedgerRow[]; cogsPct: number }) {
  const cogsLabel = cogsPct % 1 === 0 ? `${cogsPct}%` : `${cogsPct.toFixed(1)}%`;

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.3)]">
      <table className="w-full min-w-[680px] border-collapse text-left">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white p-3 align-bottom">
              <div className="font-display text-[12px] font-semibold text-ink/55">Actual</div>
              <div className="text-[10.5px] text-ink/40">vs budget</div>
            </th>
            {rows.map((r) => {
              const today = r.status === "today";
              return (
                <th key={r.index} className={`p-3 text-center ${today ? "bg-amber-50" : ""}`}>
                  <div className="font-display text-[14px] font-semibold text-ink">{r.label}</div>
                  <div
                    className={`text-[10.5px] ${today ? "font-medium text-amber-700" : "text-ink/45"}`}
                  >
                    {today ? "Today" : r.status === "future" ? "Upcoming" : "Done"}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {METRICS.map((m) => {
            const isNet = m.key === "net";
            const rowBg = isNet ? "bg-[#fafbfc]" : "bg-white";
            return (
              <tr
                key={m.key}
                className={`border-t ${isNet ? "border-black/15 bg-[#fafbfc]" : "border-black/5"}`}
              >
                <th
                  className={`sticky left-0 z-10 ${rowBg} p-3 text-[13px] font-medium ${
                    isNet ? "text-ink" : "text-ink/70"
                  }`}
                >
                  {m.label}
                  {m.key === "cogs" && (
                    <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                      {cogsLabel}
                    </span>
                  )}
                </th>
                {rows.map((r) => {
                  const budget = cellValue(m.key, r.predicted);
                  const actual = r.actual ? cellValue(m.key, r.actual) : null;
                  const today = r.status === "today";
                  return (
                    <td
                      key={r.index}
                      className={`p-3 text-center align-top ${today ? "bg-amber-50/50" : ""}`}
                    >
                      {actual !== null ? (
                        <>
                          <div
                            className={`tnum font-display font-semibold leading-tight ${
                              isNet ? "text-[18px]" : "text-[16px]"
                            } ${tone(m, actual, budget)}`}
                          >
                            {fmt(m, actual)}
                          </div>
                          <div className="tnum mt-0.5 text-[11px] text-ink/40">
                            vs {fmt(m, budget)}
                          </div>
                        </>
                      ) : (
                        <>
                          <div
                            className={`tnum font-display font-semibold leading-tight text-ink/80 ${
                              isNet ? "text-[18px]" : "text-[16px]"
                            }`}
                          >
                            {fmt(m, budget)}
                          </div>
                          <div className="mt-0.5 text-[11px] text-ink/35">budget</div>
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
