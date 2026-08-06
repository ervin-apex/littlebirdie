import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

async function context() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to manage daily Chirps.", status: 401 } as const;
  const cookieStore = await cookies();
  const venueId = cookieStore.get("little-birdee-venue")?.value;
  if (!venueId) return { error: "Choose a venue first.", status: 409 } as const;
  const { data: venue, error } = await supabase
    .from("venues")
    .select("id, business_id, name, time_zone")
    .eq("id", venueId)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !venue) return { error: "That venue is not available.", status: 404 } as const;
  return { supabase, user, venue } as const;
}

export async function GET() {
  const current = await context();
  if ("error" in current) {
    return NextResponse.json({ error: current.error }, { status: current.status });
  }
  const { data, error } = await current.supabase
    .from("chirp_preferences")
    .select("id, enabled, delivery_time_local, time_zone, prompt_dismissed_at")
    .eq("venue_id", current.venue.id)
    .eq("user_id", current.user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Birdee could not load this preference." }, { status: 500 });
  return NextResponse.json({
    venueId: current.venue.id,
    venueName: current.venue.name,
    enabled: data?.enabled ?? false,
    deliveryTimeLocal: data?.delivery_time_local?.slice(0, 5) ?? "07:00",
    timeZone: data?.time_zone ?? current.venue.time_zone,
    promptDismissed: Boolean(data?.prompt_dismissed_at),
  });
}

export async function PUT(request: Request) {
  const current = await context();
  if ("error" in current) {
    return NextResponse.json({ error: current.error }, { status: current.status });
  }
  const body = await request.json().catch(() => null) as {
    enabled?: unknown;
    deliveryTimeLocal?: unknown;
  } | null;
  if (
    typeof body?.enabled !== "boolean"
    || typeof body.deliveryTimeLocal !== "string"
    || !TIME_PATTERN.test(body.deliveryTimeLocal)
  ) {
    return NextResponse.json({ error: "Choose a valid daily delivery time." }, { status: 400 });
  }
  const { data, error } = await current.supabase
    .from("chirp_preferences")
    .upsert({
      business_id: current.venue.business_id,
      venue_id: current.venue.id,
      user_id: current.user.id,
      enabled: body.enabled,
      delivery_time_local: body.deliveryTimeLocal,
      time_zone: current.venue.time_zone,
    }, { onConflict: "user_id,venue_id" })
    .select("enabled, delivery_time_local, time_zone")
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "Birdee could not save this Chirp preference." }, { status: 500 });
  }
  return NextResponse.json({
    enabled: data.enabled,
    deliveryTimeLocal: data.delivery_time_local.slice(0, 5),
    timeZone: data.time_zone,
  });
}

export async function PATCH(request: Request) {
  const current = await context();
  if ("error" in current) {
    return NextResponse.json({ error: current.error }, { status: current.status });
  }
  const body = await request.json().catch(() => null) as { promptDismissed?: unknown } | null;
  if (body?.promptDismissed !== true) {
    return NextResponse.json({ error: "That prompt action is not valid." }, { status: 400 });
  }
  const { error } = await current.supabase
    .from("chirp_preferences")
    .upsert({
      business_id: current.venue.business_id,
      venue_id: current.venue.id,
      user_id: current.user.id,
      enabled: false,
      delivery_time_local: "07:00",
      time_zone: current.venue.time_zone,
      prompt_dismissed_at: new Date().toISOString(),
    }, { onConflict: "user_id,venue_id" });
  if (error) return NextResponse.json({ error: "Birdee could not dismiss that prompt." }, { status: 500 });
  return NextResponse.json({ promptDismissed: true });
}
