import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { venueNeedsInitialSetup } from "@/lib/venues/setup-navigation";

export const dynamic = "force-dynamic";

const VENUE_COOKIE = "little-birdee-venue";

function venueNameFrom(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return name.length >= 1 && name.length <= 160 ? name : null;
}

function setVenueCookie(response: NextResponse, venueId: string) {
  response.cookies.set(VENUE_COOKIE, venueId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to create a venue." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { name?: unknown } | null;
  const name = venueNameFrom(body?.name);
  if (!name) {
    return NextResponse.json(
      { error: "Enter a venue name between 1 and 160 characters." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const selectedVenueId = cookieStore.get(VENUE_COOKIE)?.value;
  let businessId: string | null = null;

  if (selectedVenueId) {
    const { data: selectedVenue } = await supabase
      .from("venues")
      .select("business_id")
      .eq("id", selectedVenueId)
      .eq("is_active", true)
      .maybeSingle();
    businessId = selectedVenue?.business_id ?? null;

    if (businessId) {
      const { data: membership } = await supabase
        .from("business_members")
        .select("business_id")
        .eq("business_id", businessId)
        .eq("user_id", user.id)
        .in("role", ["owner", "admin"])
        .maybeSingle();
      if (!membership) businessId = null;
    }
  }

  if (!businessId) {
    const { data: membership } = await supabase
      .from("business_members")
      .select("business_id")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"])
      .limit(1)
      .maybeSingle();
    businessId = membership?.business_id ?? null;
  }

  if (!businessId) {
    return NextResponse.json(
      { error: "Only a business owner or admin can add a venue." },
      { status: 403 },
    );
  }

  const { data: venueId, error } = await supabase.rpc("create_venue", {
    p_business_id: businessId,
    p_name: name,
    p_time_zone: "Australia/Sydney",
  });

  if (error || !venueId) {
    return NextResponse.json(
      { error: "Birdee could not create that venue. Try a different name." },
      { status: 409 },
    );
  }

  return setVenueCookie(
    NextResponse.json({
      venueId,
      businessId,
      venueName: name,
      hasPlan: false,
    }),
    venueId,
  );
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to update a venue." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { name?: unknown } | null;
  const name = venueNameFrom(body?.name);
  if (!name) {
    return NextResponse.json(
      { error: "Enter a venue name between 1 and 160 characters." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const venueId = cookieStore.get(VENUE_COOKIE)?.value;
  if (!venueId) {
    return NextResponse.json({ error: "Choose a venue first." }, { status: 409 });
  }

  const { data: canStartInitialSetup } = await supabase.rpc(
    "can_start_initial_setup",
    { p_venue_id: venueId },
  );

  if (!venueNeedsInitialSetup(canStartInitialSetup)) {
    return NextResponse.json(
      { error: "This venue is already set up. Change its name from venue settings." },
      { status: 409 },
    );
  }

  const { data: venue, error } = await supabase
    .from("venues")
    .update({ name })
    .eq("id", venueId)
    .eq("is_active", true)
    .select("id, business_id, name")
    .maybeSingle();

  if (error || !venue) {
    return NextResponse.json(
      { error: "Birdee could not update that venue name." },
      { status: 409 },
    );
  }

  return NextResponse.json({
    venueId: venue.id,
    businessId: venue.business_id,
    venueName: venue.name,
    hasPlan: false,
  });
}
