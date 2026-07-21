"use client";

import { GST_DIVISOR, money, signedProfit, type LedgerRow } from "@/lib/profit";

/**
 * v4 day detail — one hairline-separated row per field, figure and "vs
 * budget" sharing a single right-aligned line (columns line up across rows
 * via a fixed min-width on the vs span). Same field set and budget-
 * comparison logic as v3's DayDetail — data mapping only, restyled markup.
 */
export function DayDetail({ row, open }: { row: LedgerRow | null; open: boolean }) {
  if (!open || !row) return null;

  return (
    <section className="v4-detail">
      <Row label="Revenue" cell={row} field="rev" />
      <Row label="Cost of goods" cell={row} field="cogs" isCost />
      <Row label="Wages" cell={row} field="lab" isCost />
      <Row label="GST" cell={row} field="gst" isCost />
      <Row label="Fixed & variable" cell={row} field="fix" isCost />
      <Row label="Profit" cell={row} field="net" emphasize />
    </section>
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

  let figureClass = "tnum v4-detail-figure";
  if (!hasActual) {
    figureClass += " v4-detail-figure--upcoming";
  } else if (emphasize) {
    figureClass += value >= 0 ? " v4-state-profit" : " v4-state-loss";
  }

  return (
    <div className={`v4-detail-row ${emphasize ? "v4-detail-row--profit" : ""}`}>
      <span className={`v4-detail-label ${emphasize ? "v4-detail-label--emphasize" : ""}`}>{label}</span>
      <span className="v4-detail-right">
        <span className={figureClass}>{display}</span>
        {hasActual ? (
          <span className="tnum v4-detail-vs">
            {field === "net"
              ? delta >= 0
                ? `${money(delta)} ahead of budget`
                : `${money(-delta)} behind budget`
              : `vs ${money(budget)}`}
          </span>
        ) : (
          <span className="v4-detail-vs">budget</span>
        )}
      </span>
    </div>
  );
}
