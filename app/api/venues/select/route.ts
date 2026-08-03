import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { venueNeedsInitialSetup } from "@/lib/venues/setup-navigation";

export const dynamic = "force-dynamic";

const VENUE_COOKIE = "little-birdee-venue";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", request.url), 303);
  }

  const venueId = new URL(request.url).searchParams.get("venueId") ?? "";
  if (!venueId) {
    return NextResponse.redirect(new URL("/account?error=venue", request.url), 303);
  }

  const { data: venue } = await supabase
    .from("venues")
    .select("id")
    .eq("id", venueId)
    .eq("is_active", true)
    .maybeSingle();
  if (!venue) {
    return NextResponse.redirect(new URL("/account?error=venue", request.url), 303);
  }

  const { data: canStartInitialSetup } = await supabase.rpc(
    "can_start_initial_setup",
    { p_venue_id: venue.id },
  );

  const next = venueNeedsInitialSetup(canStartInitialSetup)
    ? "/setup?from=venue-switch"
    : "/app?period=this-week";
  const response = NextResponse.redirect(new URL(next, request.url), 303);
  response.cookies.set(VENUE_COOKIE, venue.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export async function POST(request: Request) {
  const isFormSubmission = request.headers
    .get("content-type")
    ?.includes("application/x-www-form-urlencoded") ?? false;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (isFormSubmission) {
      return NextResponse.redirect(new URL("/auth/login", request.url), 303);
    }
    return NextResponse.json({ error: "Sign in to change venue." }, { status: 401 });
  }

  const submittedVenueId = isFormSubmission
    ? (await request.formData()).get("venueId")
    : (
      await request.json().catch(() => null) as { venueId?: unknown } | null
    )?.venueId;
  const venueId = typeof submittedVenueId === "string" ? submittedVenueId : "";
  if (!venueId) {
    if (isFormSubmission) {
      return NextResponse.redirect(new URL("/account?error=venue", request.url), 303);
    }
    return NextResponse.json({ error: "Choose a venue." }, { status: 400 });
  }

  const { data: venue } = await supabase
    .from("venues")
    .select("id")
    .eq("id", venueId)
    .eq("is_active", true)
    .maybeSingle();

  // Venue RLS doubles as the authorization check.
  if (!venue) {
    if (isFormSubmission) {
      return NextResponse.redirect(new URL("/account?error=venue", request.url), 303);
    }
    return NextResponse.json(
      { error: "That venue is not available to this account." },
      { status: 403 },
    );
  }

  const { data: canStartInitialSetup } = await supabase.rpc(
    "can_start_initial_setup",
    { p_venue_id: venue.id },
  );

  const next = venueNeedsInitialSetup(canStartInitialSetup)
    ? "/setup?from=venue-switch"
    : "/app?period=this-week";
  const response = isFormSubmission
    ? NextResponse.redirect(new URL(next, request.url), 303)
    : NextResponse.json({ next });
  response.cookies.set(VENUE_COOKIE, venue.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
