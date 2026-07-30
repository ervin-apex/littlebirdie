import { combineStatuses, derivedProvenance } from "./status";
import type {
  EbitdaComponents,
  EbitdaResult,
  FinancialValue,
} from "./types";

function sumValues(
  values: readonly FinancialValue[],
  label: string,
): FinancialValue {
  return {
    amountCents: values.reduce(
      (sum, value) => sum + value.amountCents,
      0,
    ),
    provenance: derivedProvenance(
      values.map((value) => value.provenance),
      label,
    ),
  };
}
/**
 * Aggregates already-calculated days without reapplying percentages or period
 * scaling. This prevents monthly/custom views from inventing a second formula.
 */
export function aggregateEbitdaResults(
  results: readonly EbitdaResult[],
): EbitdaResult {
  if (results.length === 0) {
    throw new Error("At least one EBITDA result is required.");
  }

  const components: EbitdaComponents = {
    revenueExGst: sumValues(
      results.map((result) => result.components.revenueExGst),
      "GST-exclusive revenue aggregated for the selected period",
    ),
    recurringOperatingIncome: sumValues(
      results.map(
        (result) => result.components.recurringOperatingIncome,
      ),
      "Recurring operating income aggregated for the selected period",
    ),
    cogs: sumValues(
      results.map((result) => result.components.cogs),
      "COGS aggregated for the selected period",
    ),
    labour: sumValues(
      results.map((result) => result.components.labour),
      "Labour aggregated for the selected period",
    ),
    otherOperatingCosts: sumValues(
      results.map((result) => result.components.otherOperatingCosts),
      "Other operating costs aggregated for the selected period",
    ),
  };

  return {
    amountCents: results.reduce(
      (sum, result) => sum + result.amountCents,
      0,
    ),
    status: combineStatuses(results.map((result) => result.status)),
    components,
  };
}
