import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { loadVenueNavigation } from "@/lib/venues/navigation";
import {
  billingEnforcementEnabled,
  loadBillingBusinessContext,
} from "@/lib/billing/server";
import { resolveFinishSetupDestination } from "@/lib/auth/finish-setup-destination";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedNext = url.searchParams.get("next");
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  const cookieStore = await cookies();
  const [billing, venueNavigation] = await Promise.all([
    loadBillingBusinessContext(),
    loadVenueNavigation(
      supabase,
      cookieStore.get("little-birdee-venue")?.value,
    ),
  ]);
  const venue = venueNavigation.venues.find(
    (item) => item.id === venueNavigation.selectedVenueId,
  );

  const destination = resolveFinishSetupDestination({
    billing: billing ? {
      accessState: billing.entitlement.accessState,
      canUseProduct: billing.entitlement.canUseProduct,
      dataState: billing.projection?.dataState ?? null,
    } : null,
    billingEnforcementEnabled: billingEnforcementEnabled(),
    hasCompletedOnboarding: Boolean(profile?.onboarding_completed_at),
    hasPlan: venue?.hasPlan ?? null,
    next,
    venueNavigationError: Boolean(venueNavigation.error),
  });
  const normalVenueDestination = venue
    ? next ?? (venue.hasPlan ? "/app?period=this-week" : "/setup")
    : null;

  if (!venue || destination !== normalVenueDestination) {
    return NextResponse.redirect(new URL(destination, request.url));
  }

  const response = NextResponse.redirect(
    new URL(destination, request.url),
  );
  response.cookies.set("little-birdee-venue", venue.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
