import {
  BASIS_POINTS_SCALE,
  assertBasisPoints,
  assertNonNegativeMoneyCents,
  percentageOf,
} from "./money";
import { combineStatuses, derivedProvenance } from "./status";
import type {
  EbitdaInputs,
  EbitdaResult,
  MoneyCents,
  RateValue,
} from "./types";

export function calculateEbitda(inputs: EbitdaInputs): EbitdaResult {
  assertNonNegativeMoneyCents(
    inputs.revenueExGst.amountCents,
    "Actual excluding GST",
  );
  assertNonNegativeMoneyCents(inputs.labour.amountCents, "Labour");
  assertNonNegativeMoneyCents(
    inputs.otherOperatingCosts.amountCents,
    "Other operating costs",
  );
  assertNonNegativeMoneyCents(
    inputs.recurringOperatingIncome.amountCents,
    "Recurring operating income",
  );
  assertBasisPoints(inputs.cogsRate.basisPoints, "COGS rate", {
    max: BASIS_POINTS_SCALE - 1,
  });

  const cogsAmountCents = percentageOf(
    inputs.revenueExGst.amountCents,
    inputs.cogsRate.basisPoints,
  );
  const cogs = {
    amountCents: cogsAmountCents,
    provenance: derivedProvenance(
      [inputs.revenueExGst.provenance, inputs.cogsRate.provenance],
      "COGS estimated from GST-exclusive sales and the configured rate",
    ),
  };

  const components = {
    revenueExGst: inputs.revenueExGst,
    recurringOperatingIncome: inputs.recurringOperatingIncome,
    cogs,
    labour: inputs.labour,
    otherOperatingCosts: inputs.otherOperatingCosts,
  };

  return {
    amountCents:
      components.revenueExGst.amountCents +
      components.recurringOperatingIncome.amountCents -
      components.cogs.amountCents -
      components.labour.amountCents -
      components.otherOperatingCosts.amountCents,
    status: combineStatuses(
      Object.values(components).map(
        (component) => component.provenance.status,
      ),
    ),
    components,
  };
}

export function calculateBreakEvenRevenueExGst(
  cogsRate: RateValue,
  labourCents: MoneyCents,
  otherOperatingCostsCents: MoneyCents,
  recurringOperatingIncomeCents: MoneyCents,
): MoneyCents {
  assertBasisPoints(cogsRate.basisPoints, "COGS rate", {
    max: BASIS_POINTS_SCALE - 1,
  });
  assertNonNegativeMoneyCents(labourCents, "Labour");
  assertNonNegativeMoneyCents(
    otherOperatingCostsCents,
    "Other operating costs",
  );
  assertNonNegativeMoneyCents(
    recurringOperatingIncomeCents,
    "Recurring operating income",
  );

  const amountToCover = Math.max(
    0,
    labourCents +
      otherOperatingCostsCents -
      recurringOperatingIncomeCents,
  );
  const contributionBasisPoints =
    BASIS_POINTS_SCALE - cogsRate.basisPoints;

  return Math.ceil(
    (amountToCover * BASIS_POINTS_SCALE) / contributionBasisPoints,
  );
}
