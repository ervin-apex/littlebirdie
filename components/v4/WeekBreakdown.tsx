"use client";

import { useState } from "react";
import { GST_DIVISOR, money, signedProfit, type DayCell, type LedgerRow } from "@/lib/profit";

type Field = "rev" | "cogs" | "lab" | "gst" | "fix" | "net";

const METRICS: { field: Field; label: string; isCost?: boolean }[] = [
  { field: "rev", label: "Revenue" },
  { field: "cogs", label: "Cost of goods", isCost: true },
  { field: "lab", label: "Wages", isCost: true },
  { field: "gst", label: "GST", isCost: true },
  { field: "fix", label: "Fixed & variable", isCost: true },
  { field: "net", label: "Profit" },
];

function fieldValue(cell: DayCell, field: Field): number {
  if (field === "gst") return cell.rev - cell.rev / GST_DIVISOR;
  return cell[field as keyof DayCell];
}

/**
 * v4 panel footer + full breakdown table — a flat text toggle ("Full
 * breakdown") with a rotating chevron, table restyled with hairline row
 * rules and no card chrome, scrolling inside its own container. Same data
 * shape and week/day totals as v3's WeekBreakdown.
 */
export function WeekBreakdown({ rows }: { rows: LedgerRow[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="v4-footer">
      <button
        type="button"
        className="v4-footer-btn v4-focusable"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{open ? "Hide full breakdown" : "Full breakdown"}</span>
        <span className={`v4-chevron ${open ? "v4-chevron--open" : ""}`} aria-hidden>
          ▸
        </span>
      </button>

      {open && (
        <div className="v4-table-section">
          <div className="v4-table-wrap">
            <table className="v4-table">
              <thead>
                <tr>
                  <th />
                  <th>Week</th>
                  {rows.map((r) => (
                    <th key={r.index}>{r.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m) => {
                  const weekBudget = rows.reduce((s, r) => s + fieldValue(r.predicted, m.field), 0);
                  const weekActual = rows.reduce(
                    (s, r) => s + fieldValue(r.actual ?? r.predicted, m.field),
                    0,
                  );
                  const fmt = (n: number) =>
                    m.field === "net" ? signedProfit(n) : `${m.isCost ? "−" : ""}${money(n)}`;
                  const isProfitRow = m.field === "net";

                  return (
                    <tr key={m.field} className={isProfitRow ? "v4-table-row--profit" : ""}>
                      <th scope="row">{m.label}</th>
                      <td>
                        <Cell
                          display={fmt(weekActual)}
                          budget={fmt(weekBudget)}
                          isProfitRow={isProfitRow}
                          value={weekActual}
                        />
                      </td>
                      {rows.map((r) => {
                        const cell = r.actual ?? r.predicted;
                        const val = fieldValue(cell, m.field);
                        const budget = fieldValue(r.predicted, m.field);
                        return (
                          <td key={r.index}>
                            <Cell
                              display={fmt(val)}
                              budget={fmt(budget)}
                              isProfitRow={isProfitRow}
                              value={val}
                              showBudget={r.actual != null}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Cell({
  display,
  budget,
  isProfitRow,
  value,
  showBudget = true,
}: {
  display: string;
  budget: string;
  isProfitRow?: boolean;
  value: number;
  showBudget?: boolean;
}) {
  const figureClass = isProfitRow
    ? `tnum ${value >= 0 ? "v4-table-figure--profit" : "v4-table-figure--loss"}`
    : "tnum";
  return (
    <span className="v4-table-cell">
      <span className={figureClass}>{display}</span>
      {showBudget && <span className="tnum v4-table-cell__budget">{budget}</span>}
    </span>
  );
}
