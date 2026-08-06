import type { Week, WeekActuals } from "@/lib/profit";
import type { SetupStepKey } from "@/lib/venues/setup-navigation";

export type VenueSetupDraft = {
  week: Week;
  completedSteps: number;
  totalSteps: number;
  nextStep: SetupStepKey;
  updatedAt: string;
};

export type VenueState = {
  venueId: string;
  businessId: string;
  venueName: string;
  hasPlan: boolean;
  weekStart: string | null;
  week: Week | null;
  actuals: WeekActuals | null;
  currentDate: string;
  setupDraft: VenueSetupDraft | null;
};

export type VenueDraft = Pick<
  VenueState,
  "venueId" | "businessId" | "venueName" | "hasPlan"
>;

async function readError(response: Response) {
  const body = await response.json().catch(() => null) as { error?: string } | null;
  return body?.error ?? "Little Birdee could not reach this venue's records.";
}

export async function loadVenueState(serviceDate?: string): Promise<VenueState> {
  const query = serviceDate
    ? `?service-date=${encodeURIComponent(serviceDate)}`
    : "";
  const response = await fetch(`/api/venue-state${query}`, {
    cache: "no-store",
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<VenueState>;
}

export async function saveVenueWeek(week: Week) {
  const response = await fetch("/api/venue-state", {
    method: "PUT",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ week }),
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<{ planId: string; version: number }>;
}

export async function saveDailyRevenue({
  serviceDate,
  revenue,
}: {
  serviceDate: string;
  revenue: number;
}) {
  const response = await fetch("/api/daily-actuals", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ serviceDate, revenue }),
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<{
    actualRevisionId: string;
    revision: number;
  }>;
}

export async function saveVenueSetupDraft({
  week,
  completedSteps,
  totalSteps,
  nextStep,
}: {
  week: Week;
  completedSteps: number;
  totalSteps: number;
  nextStep: SetupStepKey;
}) {
  const response = await fetch("/api/venue-state", {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      week,
      completedSteps,
      totalSteps,
      nextStep,
    }),
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<{ setupDraft: VenueSetupDraft }>;
}

async function writeVenueName(method: "POST" | "PATCH", name: string) {
  const response = await fetch("/api/venues", {
    method,
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<VenueDraft>;
}

export function createVenueDraft(name: string) {
  return writeVenueName("POST", name);
}

export function updateVenueDraftName(name: string) {
  return writeVenueName("PATCH", name);
}
