import { normalizeRevenue } from "./revenue";
import type {
  EbitdaInputs,
  GstRegistration,
  Provenance,
  RevenueEntryBasis,
} from "./types";

export type LegacyWeekLike = {
  rev: number;
  lab: number;
  fix: number;
  cogs: number;
};

export type LegacyWeekConversion = {
  gstRegistration: GstRegistration;
  revenueEntryBasis: RevenueEntryBasis;
  revenueProvenance: Provenance;
  labourProvenance: Provenance;
  otherCostsProvenance: Provenance;
  cogsRateProvenance: Provenance;
  recurringOperatingIncomeDollars?: number;
  recurringOperatingIncomeProvenance?: Provenance;
};

function dollarsToCents(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite dollar amount.`);
  }
  return Math.round(value * 100);
}
/**
 * Temporary bridge for the browser-local demo Week model. Every ambiguous fact
 * is required from the caller so the adapter cannot silently assume GST or
 * actual-data semantics.
 */
export function legacyWeekToEbitdaInputs(
  week: LegacyWeekLike,
  conversion: LegacyWeekConversion,
): EbitdaInputs {
  const revenue = normalizeRevenue({
    enteredAmountCents: dollarsToCents(week.rev, "Revenue"),
    entryBasis: conversion.revenueEntryBasis,
    gstRegistration: conversion.gstRegistration,
    provenance: conversion.revenueProvenance,
  });
  const recurringOperatingIncomeDollars =
    conversion.recurringOperatingIncomeDollars ?? 0;

  return {
    revenueExGst: revenue.revenueExGst,
    cogsRate: {
      basisPoints: Math.round(week.cogs * 100),
      provenance: conversion.cogsRateProvenance,
    },
    labour: {
      amountCents: dollarsToCents(week.lab, "Labour"),
      provenance: conversion.labourProvenance,
    },
    otherOperatingCosts: {
      amountCents: dollarsToCents(week.fix, "Other operating costs"),
      provenance: conversion.otherCostsProvenance,
    },
    recurringOperatingIncome: {
      amountCents: dollarsToCents(
        recurringOperatingIncomeDollars,
        "Recurring operating income",
      ),
      provenance:
        conversion.recurringOperatingIncomeProvenance ??
        conversion.otherCostsProvenance,
    },
  };
}
