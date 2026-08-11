import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClaimedChirpDelivery, ChirpSource } from "./types";

function integer(value: number | string | null | undefined, label: string) {
  const parsed = Number(value ?? 0);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`${label} is not a valid non-negative cent value.`);
  }
  return parsed;
}

function mondayForIsoDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  const isoDay = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - (isoDay - 1));
  return date.toISOString().slice(0, 10);
}

export async function loadChirpSource(
  admin: SupabaseClient,
  delivery: ClaimedChirpDelivery,
): Promise<ChirpSource> {
  const [
    { data: venue, error: venueError },
    { data: business, error: businessError },
    { data: profile, error: profileError },
    { data: authUser, error: authError },
  ] = await Promise.all([
    admin
      .from("venues")
      .select("id, name, business_id")
      .eq("id", delivery.venueId)
      .eq("business_id", delivery.businessId)
      .eq("is_active", true)
      .maybeSingle(),
    admin
      .from("businesses")
      .select("id, trading_name")
      .eq("id", delivery.businessId)
      .maybeSingle(),
    admin
      .from("profiles")
      .select("display_name")
      .eq("id", delivery.userId)
      .maybeSingle(),
    admin.auth.admin.getUserById(delivery.userId),
  ]);

  if (venueError || businessError || profileError || authError) {
    throw new Error("Birdee could not load the chirp recipient or venue.");
  }
  if (!venue || !business || !authUser.user?.email) {
    throw new Error("The chirp recipient or venue is no longer available.");
  }

  const { data: plan, error: planError } = await admin
    .from("weekly_plans")
    .select(`
      id, gst_registration, revenue_entry_basis, cogs_rate_basis_points
    `)
    .eq("venue_id", delivery.venueId)
    .eq("week_start", mondayForIsoDate(delivery.serviceDate))
    .eq("status", "locked")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (planError) throw new Error("Birdee could not load the chirp's weekly budget.");

  let planDay: ChirpSource["planDay"] = null;
  if (plan) {
    const { data: day, error: dayError } = await admin
      .from("weekly_plan_days")
      .select(`
        planned_revenue_cents, planned_labour_cents,
        planned_other_operating_costs_cents,
        planned_recurring_operating_income_cents
      `)
      .eq("weekly_plan_id", plan.id)
      .eq("service_date", delivery.serviceDate)
      .maybeSingle();
    if (dayError) throw new Error("Birdee could not load the chirp's daily allocation.");
    if (day) {
      planDay = {
        plannedRevenueCents: integer(day.planned_revenue_cents, "Sales budget"),
        plannedLabourCents: integer(day.planned_labour_cents, "Planned labour"),
        plannedOtherOperatingCostsCents: integer(
          day.planned_other_operating_costs_cents,
          "Planned other costs",
        ),
        plannedRecurringOperatingIncomeCents: integer(
          day.planned_recurring_operating_income_cents,
          "Planned recurring income",
        ),
        cogsRateBasisPoints: integer(plan.cogs_rate_basis_points, "COGS rate"),
        gstRegistration: plan.gst_registration,
        revenueEntryBasis: plan.revenue_entry_basis,
      };
    }
  }

  const { data: actual, error: actualError } = await admin
    .from("daily_actual_revisions")
    .select(`
      entered_revenue_cents, labour_cents, revenue_source, revenue_status,
      labour_source, labour_status, revenue_entry_basis, gst_registration,
      cogs_rate_basis_points, other_operating_costs_cents,
      recurring_operating_income_cents
    `)
    .eq("venue_id", delivery.venueId)
    .eq("service_date", delivery.serviceDate)
    .order("revision", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (actualError) throw new Error("Birdee could not load yesterday's saved numbers.");

  return {
    deliveryId: delivery.deliveryId,
    preferenceId: delivery.preferenceId,
    venueId: venue.id,
    venueName: venue.name,
    businessName: business.trading_name,
    userId: delivery.userId,
    recipientEmail: authUser.user.email,
    recipientName:
      profile?.display_name?.trim()
      || authUser.user.email.split("@")[0]
      || "there",
    serviceDate: delivery.serviceDate,
    planDay,
    actual: actual
      ? {
        enteredRevenueCents: actual.entered_revenue_cents == null
          ? null
          : integer(actual.entered_revenue_cents, "Entered actual"),
        labourCents: actual.labour_cents == null
          ? null
          : integer(actual.labour_cents, "Labour"),
        revenueSource: actual.revenue_source,
        revenueStatus: actual.revenue_status,
        labourSource: actual.labour_source,
        labourStatus: actual.labour_status,
        revenueEntryBasis: actual.revenue_entry_basis,
        gstRegistration: actual.gst_registration,
        cogsRateBasisPoints: integer(actual.cogs_rate_basis_points, "COGS rate"),
        otherOperatingCostsCents: integer(
          actual.other_operating_costs_cents,
          "Other operating costs",
        ),
        recurringOperatingIncomeCents: integer(
          actual.recurring_operating_income_cents,
          "Recurring operating income",
        ),
      }
      : null,
  };
}
