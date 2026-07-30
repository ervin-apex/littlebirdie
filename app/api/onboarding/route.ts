import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type OnboardingPayload = {
  displayName?: unknown;
  businessName?: unknown;
  venueName?: unknown;
  industry?: unknown;
};

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Log in to continue." }, { status: 401 });

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("business_members")
      .select("business_id")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"])
      .order("created_at")
      .limit(1)
      .maybeSingle(),
  ]);

  if (!membership) {
    return NextResponse.json(
      { error: "Birdee could not find a business for this account." },
      { status: 409 },
    );
  }

  const [{ data: business }, { data: venue }] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, trading_name, industry")
      .eq("id", membership.business_id)
      .maybeSingle(),
    supabase
      .from("venues")
      .select("id, name")
      .eq("business_id", membership.business_id)
      .eq("is_active", true)
      .order("created_at")
      .limit(1)
      .maybeSingle(),
  ]);

  if (!business || !venue) {
    return NextResponse.json(
      { error: "Birdee could not find your first venue." },
      { status: 409 },
    );
  }

  return NextResponse.json({
    displayName:
      profile?.display_name ??
      clean(user.user_metadata?.full_name, 120) ??
      "",
    businessName: business.trading_name === "My business" ? "" : business.trading_name,
    venueName: venue.name === "My first venue" ? "" : venue.name,
    industry: business.industry ?? "Café / Restaurant",
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Log in to continue." }, { status: 401 });

  let payload: OnboardingPayload;
  try {
    payload = await request.json() as OnboardingPayload;
  } catch {
    return NextResponse.json({ error: "Those business details were not valid." }, { status: 400 });
  }

  const displayName = clean(payload.displayName, 120);
  const businessName = clean(payload.businessName, 160);
  const venueName = clean(payload.venueName, 160);
  const industry = clean(payload.industry, 80);

  if (!displayName || !businessName || !venueName || !industry) {
    return NextResponse.json({ error: "Complete every business detail to continue." }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: "Birdee could not find a business for this account." },
      { status: 409 },
    );
  }

  const { data: venue } = await supabase
    .from("venues")
    .select("id")
    .eq("business_id", membership.business_id)
    .eq("is_active", true)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!venue) {
    return NextResponse.json(
      { error: "Birdee could not find your first venue." },
      { status: 409 },
    );
  }

  const { error } = await supabase.rpc("complete_onboarding", {
    p_business_id: membership.business_id,
    p_venue_id: venue.id,
    p_display_name: displayName,
    p_business_name: businessName,
    p_venue_name: venueName,
    p_industry: industry,
  });

  if (error) {
    return NextResponse.json(
      { error: "Birdee could not save those business details." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set("little-birdee-venue", venue.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ ok: true });
}
