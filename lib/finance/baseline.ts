import { scalePeriodAmount } from "./period";
import type {
  DateRange,
  FinancialValue,
  HistoricalBaseline,
} from "./types";

/**
 * Converts a confirmed historical P&L baseline into a selected-period estimate.
 * Confirmation validates the account mapping; the future/current amount remains
 * estimated because it is a historical average rather than a live actual.
 */
export function baselineForPeriod(
  baseline: HistoricalBaseline,
  targetPeriod: DateRange,
  label: string,
): FinancialValue {
  if (!baseline.operatorConfirmed) {
    throw new Error(
      `${label} cannot be used until its P&L account classification is confirmed.`,
    );
  }

  return {
    amountCents: scalePeriodAmount(
      baseline.originalAmountCents,
      baseline.sourcePeriod,
      targetPeriod,
    ),
    provenance: {
      source: "pnl",
      status: "estimated",
      sourceId: baseline.provenance.sourceId,
      updatedAt: baseline.provenance.updatedAt,
      label: `${label} estimated from the confirmed historical P&L baseline`,
    },
  };
}
