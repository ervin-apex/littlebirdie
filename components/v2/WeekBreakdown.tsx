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
 * Quiet secondary disclosure: "Full breakdown" toggles a Week + 7-day table.
 * This is the "complexity behind taps" layer — collapsed by default,
 * horizontal-scrolling on its own so the page itself never needs to scroll
 * sideways.
 */
export function WeekBreakdown({ rows }: { rows: LedgerRow[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: 20 }}>
      <button
        type="button"
        className="v2-btn v2-btn-quiet v2-focusable"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{ paddingInline: 16 }}
      >
        <span className="v2-small">{open ? "Hide full breakdown" : "Full breakdown"}</span>
      </button>

      <div className={`v2-collapse ${open ? "is-open" : ""}`} style={{ marginTop: open ? 12 : 0 }}>
        <div>
          <div className="v2-table-wrap">
            <table className="v2-table">
              <thead>
                <tr>
                  <th />
                  <th>
                    <span className="v2-small">Week</span>
                  </th>
                  {rows.map((r) => (
                    <th key={r.index}>
                      <span className="v2-small">{r.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m) => {
                  const weekBudget = rows.reduce(
                    (s, r) => s + fieldValue(r.predicted, m.field),
                    0,
                  );
                  const weekActual = rows.reduce(
                    (s, r) => s + fieldValue(r.actual ?? r.predicted, m.field),
                    0,
                  );
                  const fmt = (n: number) =>
                    m.field === "net" ? signedProfit(n) : `${m.isCost ? "−" : ""}${money(n)}`;

                  return (
                    <tr key={m.field}>
                      <th scope="row">
                        <span className="v2-small">{m.label}</span>
                      </th>
                      <td>
                        <Cell display={fmt(weekActual)} budget={fmt(weekBudget)} emphasize={m.field === "net"} />
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
                              emphasize={m.field === "net"}
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
      </div>
    </div>
  );
}

function Cell({
  display,
  budget,
  emphasize,
  showBudget = true,
}: {
  display: string;
  budget: string;
  emphasize?: boolean;
  showBudget?: boolean;
}) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end" }}>
      <span className="tnum v2-body-regular" style={{ fontWeight: emphasize ? 700 : 500 }}>
        {display}
      </span>
      {showBudget && (
        <span className="tnum v2-small v2-muted">{budget}</span>
      )}
    </span>
  );
}
