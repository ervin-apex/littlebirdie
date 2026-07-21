"use client";

import { GST_DIVISOR, money, signedProfit, type LedgerRow } from "@/lib/profit";

/**
 * Mini P&L for one selected day: Revenue, Cost of goods, Wages, GST,
 * Fixed & variable, Profit. Uses the actual if the day has one, else the
 * budget; every row keeps the budget figure as a small muted comparison.
 * Height/opacity animates via the .v2-collapse grid-rows trick in v2.css
 * (reduced-motion collapses that to an instant opacity swap).
 */
export function DayDetail({ row, open }: { row: LedgerRow | null; open: boolean }) {
  return (
    <div className={`v2-collapse ${open && row ? "is-open" : ""}`}>
      <div>
        {row && (
          <section className="v2-panel" style={{ marginTop: 16, padding: "4px 20px 6px" }}>
            <Row label="Revenue" cell={row} field="rev" />
            <Row label="Cost of goods" cell={row} field="cogs" isCost />
            <Row label="Wages" cell={row} field="lab" isCost />
            <Row label="GST" cell={row} field="gst" isCost />
            <Row label="Fixed & variable" cell={row} field="fix" isCost />
            <Row label="Profit" cell={row} field="net" emphasize />
          </section>
        )}
      </div>
    </div>
  );
}

type Field = "rev" | "cogs" | "lab" | "gst" | "fix" | "net";

function fieldValue(cell: LedgerRow["predicted"], field: Field): number {
  if (field === "gst") return cell.rev - cell.rev / GST_DIVISOR;
  return cell[field as keyof typeof cell] as number;
}

function Row({
  label,
  cell,
  field,
  isCost,
  emphasize,
}: {
  label: string;
  cell: LedgerRow;
  field: Field;
  isCost?: boolean;
  emphasize?: boolean;
}) {
  const actualCell = cell.actual ?? cell.predicted;
  const hasActual = cell.actual != null;
  const value = fieldValue(actualCell, field);
  const budget = fieldValue(cell.predicted, field);
  const delta = value - budget;

  const display = field === "net" ? signedProfit(value) : `${isCost ? "−" : ""}${money(value)}`;

  let tone = "";
  if (emphasize) {
    tone = value >= 0 ? "var(--v2-profit-ink)" : "var(--v2-loss-ink)";
  }

  return (
    <div className="v2-detail-row">
      <span className={emphasize ? "v2-body" : "v2-body-regular"} style={{ color: "var(--v2-ink)" }}>
        {label}
      </span>
      <span style={{ textAlign: "right" }}>
        <span
          className={`tnum ${emphasize ? "v2-body" : "v2-body-regular"}`}
          style={{ display: "block", fontWeight: emphasize ? 700 : 500, color: tone || undefined }}
        >
          {display}
        </span>
        {hasActual && Math.abs(delta) >= 1 ? (
          <span className="tnum v2-small v2-muted" style={{ display: "block" }}>
            {field === "net"
              ? delta >= 0
                ? `${money(delta)} ahead of budget`
                : `${money(-delta)} behind budget`
              : `vs budget ${money(budget)}`}
          </span>
        ) : !hasActual ? (
          <span className="v2-small v2-muted" style={{ display: "block" }}>
            budget
          </span>
        ) : null}
      </span>
    </div>
  );
}
