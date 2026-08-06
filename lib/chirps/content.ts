import {
  calculateEbitda,
  normalizeRevenue,
  type FinancialSource,
  type Provenance,
  type ValueStatus,
} from "../finance";
import type { ChirpContent, ChirpSource } from "./types";

const aud = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

function money(cents: number) {
  return aud.format(Math.round(Math.abs(cents) / 100));
}

function signedMoney(cents: number) {
  return `${cents >= 0 ? "+" : "−"}${money(cents)}`;
}

function dateLabel(serviceDate: string) {
  const formatted = new Intl.DateTimeFormat("en-AU", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${serviceDate}T00:00:00Z`));
  return formatted.replace(/^(\S+)\s/, "$1, ");
}

function weekdayLabel(serviceDate: string) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "UTC",
    weekday: "long",
  }).format(new Date(`${serviceDate}T00:00:00Z`));
}

function provenance(
  source: FinancialSource,
  status: ValueStatus,
  label: string,
): Provenance {
  return { source, status, label };
}

export function buildChirpContent(source: ChirpSource): ChirpContent {
  const day = dateLabel(source.serviceDate);
  const weekday = weekdayLabel(source.serviceDate);

  if (!source.planDay) {
    return {
      kind: "setup_needed",
      subject: "A quick setup note from Little Birdee",
      preheader: `Finish ${source.venueName}'s weekly budget to unlock daily Chirps.`,
      dateLabel: day,
      eyebrow: "One quick setup step",
      heading: `Finish ${source.venueName}'s weekly budget.`,
      intro: "Once that is saved, I can turn each day's revenue into an estimated EBITDA update.",
      amountCents: null,
      amountLabel: null,
      detailLines: [
        "Your venue stays separate from every other venue.",
        "Labour and other costs come from the saved weekly budget.",
      ],
      assumptionNote: null,
      ctaLabel: "Finish venue setup",
      destination: "setup",
    };
  }

  if (!source.actual || source.actual.enteredRevenueCents === null) {
    return {
      kind: "revenue_needed",
      subject: "Birdee needs one number from you",
      preheader: `Add ${day}'s revenue to see how ${source.venueName} went.`,
      dateLabel: day,
      eyebrow: "Daily check-in",
      heading: `What did ${source.venueName} make?`,
      intro: "Pop in one revenue number and Birdee will work out the rest from the weekly budget.",
      amountCents: null,
      amountLabel: null,
      detailLines: ["One revenue number is all Birdee needs at launch."],
      assumptionNote: "Labour remains an estimate allocated from the weekly budget.",
      ctaLabel: `Add ${weekday}’s revenue`,
      destination: "check-in",
    };
  }

  const plan = source.planDay;
  const actual = source.actual;
  const revenue = normalizeRevenue({
    enteredAmountCents: actual.enteredRevenueCents!,
    entryBasis: actual.revenueEntryBasis ?? plan.revenueEntryBasis,
    gstRegistration: actual.gstRegistration ?? plan.gstRegistration,
    provenance: provenance(
      actual.revenueSource ?? "manual",
      actual.revenueStatus ?? "confirmed",
      "Yesterday's entered revenue",
    ),
  });
  const usesPlannedLabour = actual.labourCents === null;
  const result = calculateEbitda({
    revenueExGst: revenue.revenueExGst,
    cogsRate: {
      basisPoints: actual.cogsRateBasisPoints ?? plan.cogsRateBasisPoints,
      provenance: provenance("pnl", "estimated", "Historical COGS rate"),
    },
    labour: {
      amountCents: actual.labourCents ?? plan.plannedLabourCents,
      provenance: usesPlannedLabour
        ? provenance("allocated-budget", "estimated", "Allocated weekly labour budget")
        : provenance(
          actual.labourSource ?? "manual",
          actual.labourStatus ?? "estimated",
          "Recorded labour cost",
        ),
    },
    otherOperatingCosts: {
      amountCents: actual.otherOperatingCostsCents,
      provenance: provenance("pnl", "estimated", "Allocated weekly other costs"),
    },
    recurringOperatingIncome: {
      amountCents: actual.recurringOperatingIncomeCents,
      provenance: provenance("pnl", "estimated", "Allocated recurring operating income"),
    },
  });
  const plannedRevenue = normalizeRevenue({
    enteredAmountCents: plan.plannedRevenueCents,
    entryBasis: plan.revenueEntryBasis,
    gstRegistration: plan.gstRegistration,
    provenance: provenance("manual", "estimated", "Planned revenue"),
  });
  const plannedResult = calculateEbitda({
    revenueExGst: plannedRevenue.revenueExGst,
    cogsRate: {
      basisPoints: plan.cogsRateBasisPoints,
      provenance: provenance("pnl", "estimated", "Historical COGS rate"),
    },
    labour: {
      amountCents: plan.plannedLabourCents,
      provenance: provenance("allocated-budget", "estimated", "Allocated weekly labour budget"),
    },
    otherOperatingCosts: {
      amountCents: plan.plannedOtherOperatingCostsCents,
      provenance: provenance("pnl", "estimated", "Allocated weekly other costs"),
    },
    recurringOperatingIncome: {
      amountCents: plan.plannedRecurringOperatingIncomeCents,
      provenance: provenance("pnl", "estimated", "Allocated recurring operating income"),
    },
  });
  const varianceCents = result.amountCents - plannedResult.amountCents;
  const resultSummary = Math.abs(varianceCents) < 50
    ? `${source.venueName} finished on budget.`
    : `${source.venueName} finished ${varianceCents > 0 ? "ahead" : "behind"}.`;

  return {
    kind: "estimated_result",
    subject: "Your Little Birdee update is ready",
    preheader: `${source.venueName}'s estimated EBITDA for ${day} is ready.`,
    dateLabel: day,
    eyebrow: "Yesterday’s result",
    heading: "Your estimated profit",
    intro: resultSummary,
    amountCents: result.amountCents,
    amountLabel: `${signedMoney(result.amountCents)} EBITDA`,
    detailLines: [
      `Revenue excluding GST: ${money(result.components.revenueExGst.amountCents)}`,
      `COGS: ${money(result.components.cogs.amountCents)}`,
      `Labour: ${money(result.components.labour.amountCents)}`,
      `Other operating costs: ${money(result.components.otherOperatingCosts.amountCents)}`,
    ],
    assumptionNote: usesPlannedLabour
      ? `Labour and other costs use ${weekday}’s share of your weekly budget.`
      : "COGS and other costs use the locked weekly assumptions.",
    ctaLabel: `See ${weekday}’s numbers`,
    destination: "day",
  };
}
