import type { createClient } from "@/lib/supabase/server";
import {
  isResumableDraft,
  venueNeedsInitialSetup,
} from "@/lib/venues/setup-navigation";
import { resolveSelectedVenueId } from "./selection";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type VenueRow = {
  id: string;
  business_id: string;
  name: string;
};

type BusinessRow = {
  id: string;
  trading_name: string;
};

type PlanRow = {
  venue_id: string;
  updated_at: string;
};

type SetupDraftRow = {
  venue_id: string;
  completed_steps: number;
  total_steps: number;
  next_step: string;
  updated_at: string;
};

export type VenueNavigationItem = {
  id: string;
  businessId: string;
  name: string;
  businessName: string;
  hasPlan: boolean;
  setupCompletedSteps: number;
  setupTotalSteps: number;
  setupNextStep: string | null;
};

export type VenueNavigation = {
  venues: VenueNavigationItem[];
  selectedVenueId: string | null;
  error: string | null;
};

export async function loadVenueNavigation(
  supabase: SupabaseServerClient,
  requestedVenueId?: string,
): Promise<VenueNavigation> {
  const { data: venueRows, error: venueError } = await supabase
    .from("venues")
    .select("id, business_id, name")
    .eq("is_active", true)
    .order("created_at");

  if (venueError) {
    return {
      venues: [],
      selectedVenueId: null,
      error: venueError.message,
    };
  }

  if (!venueRows?.length) {
    return { venues: [], selectedVenueId: null, error: null };
  }

  const venues = venueRows as VenueRow[];
  const venueIds = venues.map((venue) => venue.id);
  const businessIds = [...new Set(venues.map((venue) => venue.business_id))];
  const [
    { data: businessRows },
    { data: planRows },
    { data: setupDraftRows },
    setupEligibility,
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, trading_name")
      .in("id", businessIds),
    supabase
      .from("weekly_plans")
      .select("venue_id, updated_at")
      .in("venue_id", venueIds)
      .eq("status", "locked"),
    supabase
      .from("venue_setup_drafts")
      .select("venue_id, completed_steps, total_steps, next_step, updated_at")
      .in("venue_id", venueIds),
    Promise.all(venueIds.map(async (venueId) => {
      const { data } = await supabase.rpc("can_start_initial_setup", {
        p_venue_id: venueId,
      });
      return [venueId, venueNeedsInitialSetup(data)] as const;
    })),
  ]);

  const businessById = new Map(
    ((businessRows ?? []) as BusinessRow[]).map((business) => [
      business.id,
      business.trading_name,
    ]),
  );
  const plans = (planRows ?? []) as PlanRow[];
  const venuesWithPlan = new Set(plans.map((plan) => plan.venue_id));
  const venuesNeedingInitialSetup = new Set(
    setupEligibility
      .filter(([, needsSetup]) => needsSetup)
      .map(([venueId]) => venueId),
  );
  const latestPlanAtByVenueId = new Map<string, string>();
  for (const plan of plans) {
    const known = latestPlanAtByVenueId.get(plan.venue_id);
    if (!known || Date.parse(plan.updated_at) > Date.parse(known)) {
      latestPlanAtByVenueId.set(plan.venue_id, plan.updated_at);
    }
  }
  // Matches the venue-state rule: a draft older than the venue's locked plan is
  // abandoned setup, so it must not drive the header's progress badge either.
  const setupDraftByVenueId = new Map(
    ((setupDraftRows ?? []) as SetupDraftRow[])
      .filter((draft) => isResumableDraft(
        draft.updated_at,
        latestPlanAtByVenueId.get(draft.venue_id),
      ))
      .map((draft) => [draft.venue_id, draft]),
  );
  const items = venues.map((venue) => {
    const hasPlan = venuesWithPlan.has(venue.id)
      || !venuesNeedingInitialSetup.has(venue.id);
    const setupDraft = setupDraftByVenueId.get(venue.id);
    return {
      id: venue.id,
      businessId: venue.business_id,
      name: venue.name,
      businessName: businessById.get(venue.business_id) ?? "My business",
      hasPlan,
      /* Fallbacks for a venue with no saved draft. Every venue in this list
         already exists and is already named, so the work left is the five
         number steps - the six-step flow only applies while a venue is being
         created, and such a venue is not in this list yet. Defaulting to
         "1 of 6" made the paused screen claim a step was saved and offer a
         different total from the wizard, which showed "1 of 5". */
      setupCompletedSteps: setupDraft?.completed_steps ?? 0,
      setupTotalSteps: setupDraft?.total_steps ?? 5,
      setupNextStep: setupDraft?.next_step ?? (hasPlan ? null : "revenue"),
    };
  });
  const selectedVenueId = resolveSelectedVenueId(items, requestedVenueId);

  return { venues: items, selectedVenueId, error: null };
}
