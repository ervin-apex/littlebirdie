import {
  BASIS_POINTS_SCALE,
  assertBasisPoints,
  assertMoneyCents,
} from "./money";
import type {
  AmountAdjustment,
  EbitdaInputs,
  EbitdaScenarioAdjustments,
  FinancialValue,
  MoneyCents,
} from "./types";

function applyAmountAdjustment(
  value: FinancialValue,
  adjustment: AmountAdjustment | undefined,
  label: string,
): FinancialValue {
  if (!adjustment) return value;

  let amountCents: MoneyCents;
  if (adjustment.kind === "amount") {
    assertMoneyCents(adjustment.amountCents, `${label} adjustment`);
    amountCents = value.amountCents + adjustment.amountCents;
  } else {
    assertBasisPoints(adjustment.basisPoints, `${label} adjustment`, {
      min: -BASIS_POINTS_SCALE,
      max: BASIS_POINTS_SCALE * 10,
    });
    amountCents = Math.round(
      value.amountCents *
        (1 + adjustment.basisPoints / BASIS_POINTS_SCALE),
    );
  }

  return {
    amountCents: Math.max(0, amountCents),
    provenance: {
      source: "derived",
      status: value.provenance.status,
      label: `${label} adjusted for this selected-period scenario`,
    },
  };
}
/**
 * Applies every dollar adjustment once to the selected period. Callers must not
 * multiply amount adjustments by the number of days in the period.
 */
export function applyEbitdaScenario(
  inputs: EbitdaInputs,
  adjustments: EbitdaScenarioAdjustments,
): EbitdaInputs {
  const cogsRateBasisPoints =
    inputs.cogsRate.basisPoints +
    (adjustments.cogsRateBasisPoints ?? 0);
  assertBasisPoints(cogsRateBasisPoints, "Scenario COGS rate", {
    max: BASIS_POINTS_SCALE - 1,
  });

  return {
    revenueExGst: applyAmountAdjustment(
      inputs.revenueExGst,
      adjustments.revenue,
      "Actual",
    ),
    cogsRate: {
      basisPoints: cogsRateBasisPoints,
      provenance:
        adjustments.cogsRateBasisPoints === undefined
          ? inputs.cogsRate.provenance
          : {
              source: "derived",
              status: inputs.cogsRate.provenance.status,
              label: "COGS rate adjusted for this selected-period scenario",
            },
    },
    labour: applyAmountAdjustment(
      inputs.labour,
      adjustments.labour,
      "Labour",
    ),
    otherOperatingCosts: applyAmountAdjustment(
      inputs.otherOperatingCosts,
      adjustments.otherOperatingCosts,
      "Other operating costs",
    ),
    recurringOperatingIncome: applyAmountAdjustment(
      inputs.recurringOperatingIncome,
      adjustments.recurringOperatingIncome,
      "Recurring operating income",
    ),
  };
}
