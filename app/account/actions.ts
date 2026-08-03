"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { venueNeedsInitialSetup } from "@/lib/venues/setup-navigation";

export async function switchVenue(formData: FormData) {
  const venueId = String(formData.get("venueId") ?? "");
  if (!venueId) redirect("/account?error=venue");

  const supabase = await createClient();
  const { data: venue } = await supabase
    .from("venues")
    .select("id")
    .eq("id", venueId)
    .maybeSingle();

  // RLS makes this lookup double as the authorization check.
  if (!venue) redirect("/account?error=venue");

  const cookieStore = await cookies();
  cookieStore.set("little-birdee-venue", venue.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  const { data: canStartInitialSetup } = await supabase.rpc(
    "can_start_initial_setup",
    { p_venue_id: venue.id },
  );

  redirect(venueNeedsInitialSetup(canStartInitialSetup)
    ? "/setup?from=venue-switch"
    : "/app?period=this-week");
}

export async function createVenue(formData: FormData) {
  const businessId = String(formData.get("businessId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!businessId || !name) redirect("/venues/new?error=create-venue");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: venueId, error } = await supabase.rpc("create_venue", {
    p_business_id: businessId,
    p_name: name,
    p_time_zone: "Australia/Sydney",
  });
  if (error || !venueId) redirect("/venues/new?error=create-venue");

  const cookieStore = await cookies();
  cookieStore.set("little-birdee-venue", venueId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/setup?from=new-venue");
}

export async function updateVenueDetails(formData: FormData) {
  const venueId = String(formData.get("venueId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!venueId || !name) redirect("/venues/new?mode=edit&error=update-venue");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: venue, error } = await supabase
    .from("venues")
    .update({ name })
    .eq("id", venueId)
    .select("id")
    .maybeSingle();

  if (error || !venue) {
    redirect("/venues/new?mode=edit&error=update-venue");
  }

  redirect("/setup?from=new-venue");
}
