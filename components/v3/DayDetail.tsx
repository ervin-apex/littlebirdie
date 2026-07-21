"use client";

import { GST_DIVISOR, money, signedProfit, type LedgerRow } from "@/lib/profit";

/**
 * v3 day detail — dashed-rule ledger rows (label left in sans, figures
 * right in mono tabular, "vs budget" at 65% ink), reading as a till receipt
 * rather than a card. The Profit row gets a 2px solid ink rule above it and
 * its figure in state ink. Same field set and budget-comparison logic as
 * v2's DayDetail.
 */
export function DayDetail({ row, open }: { row: LedgerRow | null; open: boolean }) {
  return (
    <div className={`v3-collapse ${open && row ? "is-open" : ""}`}>
      <div>
        {row && (
          <section className="v3-ledger">
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

  let tone: string | undefined;
  if (emphasize) {
    tone = value >= 0 ? "var(--profit-ink)" : "var(--loss-ink)";
  }

  return (
    <div className={`v3-ledger-row ${emphasize ? "v3-ledger-row--profit" : ""}`}>
      <span className="v3-body" style={{ fontWeight: emphasize ? 600 : 400 }}>
        {label}
      </span>
      <span style={{ textAlign: "right" }}>
        <span
          className="tnum v3-ledger-figure"
          style={{ display: "block", fontWeight: emphasize ? 700 : 500, fontSize: emphasize ? 18 : 15, color: tone }}
        >
          {display}
        </span>
        {hasActual && Math.abs(delta) >= 1 ? (
          <span className="tnum v3-small v3-ledger-vs">
            {field === "net"
              ? delta >= 0
                ? `${money(delta)} ahead of budget`
                : `${money(-delta)} behind budget`
              : `vs budget ${money(budget)}`}
          </span>
        ) : !hasActual ? (
          <span className="v3-small v3-ledger-vs">budget</span>
        ) : null}
      </span>
    </div>
  );
}
