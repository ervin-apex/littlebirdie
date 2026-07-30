import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { loadVenueNavigation } from "@/lib/venues/navigation";

export async function GET(request: Request) {
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

  if (!profile?.onboarding_completed_at) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  const cookieStore = await cookies();
  const venueNavigation = await loadVenueNavigation(
    supabase,
    cookieStore.get("little-birdee-venue")?.value,
  );
  const venue = venueNavigation.venues.find(
    (item) => item.id === venueNavigation.selectedVenueId,
  );

  if (!venue) {
    return NextResponse.redirect(new URL("/auth/login?error=setup", request.url));
  }

  const response = NextResponse.redirect(
    new URL(venue.hasPlan ? "/app?period=this-week" : "/setup", request.url),
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
