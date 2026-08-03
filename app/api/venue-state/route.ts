import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  actualsFromRevisions,
  currentMondayIso,
  localDateIso,
  weekFromPlan,
  weekToPlanPayload,
  type DailyActualRevisionRecord,
  type WeeklyPlanDayRecord,
  type WeeklyPlanRecord,
} from "@/lib/persistence/week-record";
import type { Week } from "@/lib/profit";
import { createClient } from "@/lib/supabase/server";
import {
  SETUP_STEP_KEYS,
  isResumableDraft,
  type SetupStepKey,
} from "@/lib/venues/setup-navigation";
import { billingEnforcementEnabled, loadBillingBusinessContext } from "@/lib/billing/server";
import { canOpenVenueFinancialRecords } from "@/lib/billing/venue-access";

export const dynamic = "force-dynamic";

function validWeek(value: unknown): value is Week {
  if (!value || typeof value !== "object") return false;
  const week = value as Partial<Week>;
  const validNumbers = [week.rev, week.lab, week.fix, week.cogs, week.recurringIncome]
    .every((item) => typeof item === "number" && Number.isFinite(item) && item >= 0);
  const validDays = Array.isArray(week.days)
    && week.days.length === 7
    && week.days.every((day) => typeof day === "number" && Number.isFinite(day) && day >= 0);
  const validGst = [
    "not-registered",
    "registered-fully-taxable",
    "registered-mixed",
  ].includes(String(week.gstRegistration));
  const validBasis = ["gst-inclusive", "gst-exclusive"].includes(
    String(week.revenueEntryBasis),
  );
  return validNumbers
    && validDays
    && validGst
    && validBasis
    && Number(week.cogs) <= 100;
}

type SetupDraftRow = {
  week: unknown;
  completed_steps: number;
  total_steps: number;
  next_step: SetupStepKey;
  updated_at: string;
};

function validDraftProgress(value: unknown): value is {
  week: Week;
  completedSteps: number;
  totalSteps: number;
  nextStep: SetupStepKey;
} {
  if (!value || typeof value !== "object") return false;
  const draft = value as {
    week?: unknown;
    completedSteps?: unknown;
    totalSteps?: unknown;
    nextStep?: unknown;
  };
  const totalSteps = Number(draft.totalSteps);
  const completedSteps = Number(draft.completedSteps);
  return validWeek(draft.week)
    && Number.isInteger(totalSteps)
    && [4, 5, 6].includes(totalSteps)
    && Number.isInteger(completedSteps)
    && completedSteps >= 1
    && completedSteps < totalSteps
    && SETUP_STEP_KEYS.includes(draft.nextStep as SetupStepKey);
}

function setupDraftFrom(row: SetupDraftRow | null) {
  if (!row || !validWeek(row.week)) return null;
  return {
    week: row.week,
    completedSteps: row.completed_steps,
    totalSteps: row.total_steps,
    nextStep: row.next_step,
    updatedAt: row.updated_at,
  };
}

function resumableDraft(
  row: SetupDraftRow | null,
  planUpdatedAt: string | null,
) {
  const draft = setupDraftFrom(row);
  if (!draft) return null;
  return isResumableDraft(draft.updatedAt, planUpdatedAt) ? draft : null;
}

async function selectedVenue() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to open venue records.", status: 401 } as const;

  const cookieStore = await cookies();
  const requestedVenueId = cookieStore.get("little-birdee-venue")?.value;

  // Only a cookie can identify the venue the user actually chose. Without one,
  // fall through to the ordered fallback below and persist the result, so two
  // requests in the same session can never resolve to different venues.
  if (requestedVenueId) {
    const { data: requestedVenue } = await supabase
      .from("venues")
      .select("id, business_id, name, time_zone")
      .eq("is_active", true)
      .eq("id", requestedVenueId)
      .maybeSingle();

    // RLS makes this lookup double as the authorization check: a venue id from
    // another account returns nothing and falls back to an authorized venue.
    if (requestedVenue) {
      return { supabase, user, venue: requestedVenue, shouldSetCookie: false } as const;
    }
  }

  const { data: fallbackVenue } = await supabase
    .from("venues")
    .select("id, business_id, name, time_zone")
    .eq("is_active", true)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!fallbackVenue) {
    return { error: "No venue is available for this account.", status: 409 } as const;
  }

  return { supabase, user, venue: fallbackVenue, shouldSetCookie: true } as const;
}

function withVenueCookie(
  response: NextResponse,
  venueId: string,
  shouldSetCookie: boolean,
) {
  if (shouldSetCookie) {
    response.cookies.set("little-birdee-venue", venueId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}

async function venueBillingGate({
  supabase,
  venueId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  venueId: string;
}) {
  if (!billingEnforcementEnabled()) return null;

  const [billing, { data: canStartInitialSetup, error: setupError }] = await Promise.all([
    loadBillingBusinessContext(),
    supabase.rpc("can_start_initial_setup", { p_venue_id: venueId }),
  ]);
  if (setupError || !canOpenVenueFinancialRecords({
    enforcementEnabled: true,
    canUseProduct: billing?.entitlement.canUseProduct ?? false,
    canStartInitialSetup: canStartInitialSetup === true,
  })) {
    return NextResponse.json(
      { error: "Your Little Birdee subscription needs attention." },
      { status: 402 },
    );
  }

  return null;
}

export async function GET() {
  const selection = await selectedVenue();
  if ("error" in selection) {
    return NextResponse.json({ error: selection.error }, { status: selection.status });
  }
  const { supabase, venue, shouldSetCookie } = selection;
  const billingResponse = await venueBillingGate({ supabase, venueId: venue.id });
  if (billingResponse) return billingResponse;

  const [
    { data: planRow, error: planError },
    { data: draftRow, error: draftError },
  ] = await Promise.all([
    supabase
      .from("weekly_plans")
      .select(`
        id, business_id, venue_id, week_start, version, gst_registration,
        revenue_entry_basis, cogs_rate_basis_points, weekly_labour_cents,
        weekly_other_operating_costs_cents, weekly_recurring_operating_income_cents,
        loaded_hourly_labour_cost_cents, updated_at
      `)
      .eq("venue_id", venue.id)
      .eq("status", "locked")
      .order("week_start", { ascending: false })
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("venue_setup_drafts")
      .select("week, completed_steps, total_steps, next_step, updated_at")
      .eq("venue_id", venue.id)
      .maybeSingle(),
  ]);

  if (planError || draftError) {
    return NextResponse.json({ error: "Birdee could not load this venue's plan." }, { status: 500 });
  }
  const setupDraft = resumableDraft(
    draftRow as SetupDraftRow | null,
    (planRow as { updated_at?: string } | null)?.updated_at ?? null,
  );

  if (!planRow) {
    const currentDate = localDateIso(new Date(), venue.time_zone);
    return withVenueCookie(NextResponse.json({
      venueId: venue.id,
      businessId: venue.business_id,
      venueName: venue.name,
      hasPlan: false,
      weekStart: null,
      week: null,
      actuals: null,
      currentDate,
      setupDraft,
    }), venue.id, shouldSetCookie);
  }

  const { data: dayRows, error: dayError } = await supabase
    .from("weekly_plan_days")
    .select(`
      id, weekly_plan_id, service_date, day_index, planned_revenue_cents,
      planned_labour_cents, planned_other_operating_costs_cents,
      planned_recurring_operating_income_cents
    `)
    .eq("weekly_plan_id", planRow.id)
    .order("day_index");

  if (dayError || dayRows?.length !== 7) {
    return NextResponse.json({ error: "This saved plan is missing its daily allocations." }, { status: 500 });
  }

  const from = dayRows[0].service_date;
  const to = dayRows[dayRows.length - 1].service_date;
  const { data: revisionRows, error: revisionError } = await supabase
    .from("daily_actual_revisions")
    .select(`
      service_date, revision, entered_revenue_cents, labour_cents,
      revenue_source, revenue_status, labour_source, labour_status,
      revenue_entry_basis, gst_registration, cogs_rate_basis_points,
      other_operating_costs_cents, recurring_operating_income_cents,
      source_updated_at, plan_day_snapshot_id
    `)
    .eq("venue_id", venue.id)
    .gte("service_date", from)
    .lte("service_date", to)
    .order("service_date")
    .order("revision", { ascending: false });

  if (revisionError) {
    return NextResponse.json({ error: "Birdee could not load this venue's actuals." }, { status: 500 });
  }

  const plan = planRow as WeeklyPlanRecord;
  const days = dayRows as WeeklyPlanDayRecord[];
  const revisionRecords = (revisionRows ?? []) as DailyActualRevisionRecord[];
  const snapshotIds = [
    ...new Set(
      revisionRecords
        .map((revision) => revision.plan_day_snapshot_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const { data: snapshotRows, error: snapshotError } = snapshotIds.length
    ? await supabase
      .from("weekly_plan_days")
      .select(`
        id, weekly_plan_id, planned_revenue_cents, planned_labour_cents,
        planned_other_operating_costs_cents,
        planned_recurring_operating_income_cents
      `)
      .in("id", snapshotIds)
    : { data: [], error: null };

  if (snapshotError) {
    return NextResponse.json(
      { error: "Birdee could not load the saved comparison snapshots." },
      { status: 500 },
    );
  }

  type SnapshotRow = {
    id: string;
    weekly_plan_id: string;
    planned_revenue_cents: number | string;
    planned_labour_cents: number | string;
    planned_other_operating_costs_cents: number | string;
    planned_recurring_operating_income_cents: number | string;
  };
  const snapshots = (snapshotRows ?? []) as SnapshotRow[];
  const snapshotPlanIds = [
    ...new Set(snapshots.map((snapshot) => snapshot.weekly_plan_id)),
  ];
  const { data: snapshotPlanRows, error: snapshotPlanError } =
    snapshotPlanIds.length
      ? await supabase
        .from("weekly_plans")
        .select(`
          id, cogs_rate_basis_points, gst_registration, revenue_entry_basis
        `)
        .in("id", snapshotPlanIds)
      : { data: [], error: null };

  if (snapshotPlanError) {
    return NextResponse.json(
      { error: "Birdee could not load the saved plan assumptions." },
      { status: 500 },
    );
  }

  type SnapshotPlanRow = Pick<
    WeeklyPlanRecord,
    "id" | "cogs_rate_basis_points" | "gst_registration" | "revenue_entry_basis"
  >;
  const snapshotById = new Map(
    snapshots.map((snapshot) => [snapshot.id, snapshot]),
  );
  const snapshotPlanById = new Map(
    ((snapshotPlanRows ?? []) as SnapshotPlanRow[])
      .map((snapshotPlan) => [snapshotPlan.id, snapshotPlan]),
  );
  const revisions = revisionRecords.map((revision) => {
    const snapshot = revision.plan_day_snapshot_id
      ? snapshotById.get(revision.plan_day_snapshot_id)
      : undefined;
    const snapshotPlan = snapshot
      ? snapshotPlanById.get(snapshot.weekly_plan_id)
      : undefined;
    if (!snapshot || !snapshotPlan) return revision;
    return {
      ...revision,
      snapshot: {
        planned_revenue_cents: snapshot.planned_revenue_cents,
        planned_labour_cents: snapshot.planned_labour_cents,
        planned_other_operating_costs_cents:
          snapshot.planned_other_operating_costs_cents,
        planned_recurring_operating_income_cents:
          snapshot.planned_recurring_operating_income_cents,
        cogs_rate_basis_points: snapshotPlan.cogs_rate_basis_points,
        gst_registration: snapshotPlan.gst_registration,
        revenue_entry_basis: snapshotPlan.revenue_entry_basis,
      },
    };
  });
  const currentDate = localDateIso(new Date(), venue.time_zone);
  return withVenueCookie(NextResponse.json({
    venueId: venue.id,
    businessId: venue.business_id,
    venueName: venue.name,
    hasPlan: true,
    weekStart: plan.week_start,
    week: weekFromPlan(plan, days),
    actuals: actualsFromRevisions(days, revisions, currentDate),
    currentDate,
    setupDraft,
  }), venue.id, shouldSetCookie);
}

export async function PATCH(request: Request) {
  const selection = await selectedVenue();
  if ("error" in selection) {
    return NextResponse.json({ error: selection.error }, { status: selection.status });
  }
  const { supabase, user, venue, shouldSetCookie } = selection;
  const billingResponse = await venueBillingGate({ supabase, venueId: venue.id });
  if (billingResponse) return billingResponse;
  const body = await request.json().catch(() => null);
  if (!validDraftProgress(body)) {
    return NextResponse.json(
      { error: "Birdee could not save this setup step. Check the values and try again." },
      { status: 400 },
    );
  }

  const { data: existingDraft, error: existingError } = await supabase
    .from("venue_setup_drafts")
    .select("completed_steps, total_steps, next_step")
    .eq("venue_id", venue.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: "Birdee could not open this setup draft." }, { status: 500 });
  }

  const sameFlow = existingDraft?.total_steps === body.totalSteps;
  const completedSteps = sameFlow
    ? Math.max(existingDraft.completed_steps, body.completedSteps)
    : body.completedSteps;
  const nextStep = sameFlow && existingDraft.completed_steps > body.completedSteps
    ? existingDraft.next_step
    : body.nextStep;
  const values = {
    week: body.week,
    completed_steps: completedSteps,
    total_steps: body.totalSteps,
    next_step: nextStep,
    updated_by: user.id,
  };

  const query = existingDraft
    ? supabase
      .from("venue_setup_drafts")
      .update(values)
      .eq("venue_id", venue.id)
    : supabase
      .from("venue_setup_drafts")
      .insert({
        venue_id: venue.id,
        business_id: venue.business_id,
        ...values,
        created_by: user.id,
      });
  const { data: savedDraft, error: saveError } = await query
    .select("week, completed_steps, total_steps, next_step, updated_at")
    .single();

  if (saveError || !savedDraft) {
    return NextResponse.json({ error: "Birdee could not save this setup step." }, { status: 500 });
  }

  return withVenueCookie(
    NextResponse.json({
      setupDraft: setupDraftFrom(savedDraft as SetupDraftRow),
    }),
    venue.id,
    shouldSetCookie,
  );
}

export async function PUT(request: Request) {
  const selection = await selectedVenue();
  if ("error" in selection) {
    return NextResponse.json({ error: selection.error }, { status: selection.status });
  }
  const { supabase, venue, shouldSetCookie } = selection;
  const billingResponse = await venueBillingGate({ supabase, venueId: venue.id });
  if (billingResponse) return billingResponse;
  const body = await request.json().catch(() => null) as { week?: unknown } | null;
  if (!validWeek(body?.week)) {
    return NextResponse.json({ error: "Check the weekly values and try again." }, { status: 400 });
  }
  if (
    body.week.recurringIncome === 0
    && body.week.recurringIncomeConfirmed !== true
  ) {
    return NextResponse.json(
      { error: "Confirm that this venue has no recurring other income." },
      { status: 400 },
    );
  }

  const payload = weekToPlanPayload(
    body.week,
    venue.id,
    currentMondayIso(new Date(), venue.time_zone),
  );
  const { data, error } = await supabase.rpc("save_week_plan", payload);

  if (error || !data?.[0]) {
    return NextResponse.json({ error: "Birdee could not save this weekly plan." }, { status: 500 });
  }

  // Setup is finished for this venue, so the in-progress draft is spent. Leaving
  // it behind would make the next Setup visit resume stale numbers over the plan
  // that was just locked.
  await supabase.from("venue_setup_drafts").delete().eq("venue_id", venue.id);

  return withVenueCookie(NextResponse.json({
    planId: data[0].plan_id,
    version: data[0].plan_version,
  }), venue.id, shouldSetCookie);
}
