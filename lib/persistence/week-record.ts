import { allocateCentsByWeights } from "../finance/allocation";
import type { Provenance } from "../finance";
import type { DayActual, Week, WeekActuals } from "../profit";

export type WeeklyPlanRecord = {
  id: string;
  business_id: string;
  venue_id: string;
  week_start: string;
  version: number;
  gst_registration: Week["gstRegistration"];
  revenue_entry_basis: Week["revenueEntryBasis"];
  cogs_rate_basis_points: number;
  weekly_labour_cents: number | string;
  weekly_other_operating_costs_cents: number | string;
  weekly_recurring_operating_income_cents: number | string;
  loaded_hourly_labour_cost_cents: number | string | null;
  updated_at: string;
};

export type WeeklyPlanDayRecord = {
  id: string;
  weekly_plan_id?: string;
  service_date: string;
  day_index: number;
  planned_revenue_cents: number | string;
  planned_labour_cents: number | string;
  planned_other_operating_costs_cents?: number | string;
  planned_recurring_operating_income_cents?: number | string;
};

export type DailyActualRevisionRecord = {
  service_date: string;
  revision: number;
  entered_revenue_cents: number | string | null;
  labour_cents: number | string | null;
  revenue_source?: "manual" | "pos" | null;
  revenue_status?: "estimated" | "provisional" | "confirmed" | null;
  labour_source?:
    | "manual"
    | "allocated-budget"
    | "roster-scheduled"
    | "timesheet-worked"
    | "timesheet-approved"
    | null;
  labour_status?: "estimated" | "provisional" | "confirmed" | null;
  revenue_entry_basis?: Week["revenueEntryBasis"] | null;
  gst_registration?: Week["gstRegistration"] | null;
  cogs_rate_basis_points?: number | null;
  other_operating_costs_cents?: number | string | null;
  recurring_operating_income_cents?: number | string | null;
  source_updated_at?: string | null;
  plan_day_snapshot_id?: string | null;
  snapshot?: {
    planned_revenue_cents: number | string;
    planned_labour_cents: number | string;
    planned_other_operating_costs_cents: number | string;
    planned_recurring_operating_income_cents: number | string;
    cogs_rate_basis_points: number;
    gst_registration: Week["gstRegistration"];
    revenue_entry_basis: Week["revenueEntryBasis"];
  };
};

export type SaveWeekPlanPayload = {
  p_venue_id: string;
  p_week_start: string;
  p_gst_registration: Week["gstRegistration"];
  p_revenue_entry_basis: Week["revenueEntryBasis"];
  p_cogs_rate_basis_points: number;
  p_weekly_labour_cents: number;
  p_weekly_other_operating_costs_cents: number;
  p_weekly_recurring_operating_income_cents: number;
  p_loaded_hourly_labour_cost_cents: number | null;
  p_days: Array<{
    day_index: number;
    planned_revenue_cents: number;
    planned_labour_cents: number;
    planned_other_operating_costs_cents: number;
    planned_recurring_operating_income_cents: number;
  }>;
};

function cents(value: number) {
  return Math.round(value * 100);
}

function dollars(value: number | string | null | undefined) {
  return Number(value ?? 0) / 100;
}

export function currentMondayIso(
  now = new Date(),
  timeZone = "Australia/Sydney",
): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  const localDate = `${part("year")}-${part("month")}-${part("day")}`;
  const atUtcMidnight = new Date(`${localDate}T00:00:00Z`);
  const isoDay = atUtcMidnight.getUTCDay() || 7;
  atUtcMidnight.setUTCDate(atUtcMidnight.getUTCDate() - (isoDay - 1));
  return atUtcMidnight.toISOString().slice(0, 10);
}

export function localDateIso(
  now = new Date(),
  timeZone = "Australia/Sydney",
): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function weekToPlanPayload(
  week: Week,
  venueId: string,
  weekStart = currentMondayIso(),
): SaveWeekPlanPayload {
  const revenueCents = week.days.map(cents);
  const weeklyLabourCents = cents(week.lab);
  const weeklyOtherCostsCents = cents(week.fix);
  const weeklyRecurringIncomeCents = cents(week.recurringIncome);
  const labour = allocateCentsByWeights(weeklyLabourCents, revenueCents, "even");
  const otherCosts = allocateCentsByWeights(weeklyOtherCostsCents, revenueCents, "even");
  const recurringIncome = allocateCentsByWeights(
    weeklyRecurringIncomeCents,
    revenueCents,
    "even",
  );

  return {
    p_venue_id: venueId,
    p_week_start: weekStart,
    p_gst_registration: week.gstRegistration,
    p_revenue_entry_basis: week.revenueEntryBasis,
    p_cogs_rate_basis_points: Math.round(week.cogs * 100),
    p_weekly_labour_cents: weeklyLabourCents,
    p_weekly_other_operating_costs_cents: weeklyOtherCostsCents,
    p_weekly_recurring_operating_income_cents: weeklyRecurringIncomeCents,
    p_loaded_hourly_labour_cost_cents:
      week.loadedHourlyLabourCost == null
        ? null
        : cents(week.loadedHourlyLabourCost),
    p_days: revenueCents.map((plannedRevenueCents, dayIndex) => ({
      day_index: dayIndex,
      planned_revenue_cents: plannedRevenueCents,
      planned_labour_cents: labour[dayIndex],
      planned_other_operating_costs_cents: otherCosts[dayIndex],
      planned_recurring_operating_income_cents: recurringIncome[dayIndex],
    })),
  };
}

export function weekFromPlan(
  plan: WeeklyPlanRecord,
  dayRows: WeeklyPlanDayRecord[],
): Week {
  const days = [...dayRows]
    .sort((left, right) => left.day_index - right.day_index)
    .map((day) => dollars(day.planned_revenue_cents));
  const provenance: Provenance = {
    source: "manual",
    status: "estimated",
    label: "Saved for this venue",
    updatedAt: plan.updated_at,
  };

  return {
    rev: days.reduce((total, day) => total + day, 0),
    lab: dollars(plan.weekly_labour_cents),
    fix: dollars(plan.weekly_other_operating_costs_cents),
    cogs: plan.cogs_rate_basis_points / 100,
    days,
    gstRegistration: plan.gst_registration,
    revenueEntryBasis: plan.revenue_entry_basis,
    recurringIncome: dollars(plan.weekly_recurring_operating_income_cents),
    recurringIncomeConfirmed: true,
    loadedHourlyLabourCost:
      plan.loaded_hourly_labour_cost_cents == null
        ? undefined
        : dollars(plan.loaded_hourly_labour_cost_cents),
    cogsProvenance: provenance,
    labourProvenance: provenance,
    otherCostsProvenance: provenance,
    recurringIncomeProvenance: provenance,
  };
}

export function actualsFromRevisions(
  dayRows: WeeklyPlanDayRecord[],
  revisions: DailyActualRevisionRecord[],
  currentDate = localDateIso(),
): WeekActuals {
  const latestByDate = new Map<string, DailyActualRevisionRecord>();
  for (const revision of revisions) {
    const previous = latestByDate.get(revision.service_date);
    if (!previous || revision.revision > previous.revision) {
      latestByDate.set(revision.service_date, revision);
    }
  }

  const orderedDays = [...dayRows]
    .sort((left, right) => left.day_index - right.day_index);
  const actuals: DayActual[] = orderedDays
    .map((day) => {
      const revision = latestByDate.get(day.service_date);
      if (!revision) return null;
      const snapshot = revision.snapshot ?? {
        planned_revenue_cents: day.planned_revenue_cents,
        planned_labour_cents: day.planned_labour_cents,
        planned_other_operating_costs_cents:
          day.planned_other_operating_costs_cents ?? 0,
        planned_recurring_operating_income_cents:
          day.planned_recurring_operating_income_cents ?? 0,
        cogs_rate_basis_points: revision.cogs_rate_basis_points ?? 0,
        gst_registration:
          revision.gst_registration ?? "registered-fully-taxable",
        revenue_entry_basis:
          revision.revenue_entry_basis ?? "gst-inclusive",
      };
      return {
        rev: dollars(revision.entered_revenue_cents),
        lab: dollars(revision.labour_cents ?? snapshot.planned_labour_cents),
        revenueSource: revision.revenue_source ?? "manual",
        revenueStatus: revision.revenue_status ?? "confirmed",
        labourSource: revision.labour_source ?? "allocated-budget",
        labourStatus: revision.labour_status ?? "estimated",
        revision: revision.revision,
        updatedAt: revision.source_updated_at ?? undefined,
        snapshot: {
          rev: dollars(snapshot.planned_revenue_cents),
          lab: dollars(snapshot.planned_labour_cents),
          fix: dollars(snapshot.planned_other_operating_costs_cents),
          otherIncome: dollars(
            snapshot.planned_recurring_operating_income_cents,
          ),
          cogs: snapshot.cogs_rate_basis_points / 100,
          gstRegistration: snapshot.gst_registration,
          revenueEntryBasis: snapshot.revenue_entry_basis,
        },
      };
    });

  let todayIndex = orderedDays.findIndex(
    (day) => day.service_date >= currentDate,
  );
  if (todayIndex < 0) todayIndex = 7;

  return {
    todayIndex,
    actuals,
  };
}
