import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  isIsoDate,
  revenueToCents,
} from "@/lib/persistence/daily-actual";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to update this venue." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null) as {
    serviceDate?: unknown;
    revenue?: unknown;
  } | null;
  const revenueCents = revenueToCents(body?.revenue);
  if (!isIsoDate(body?.serviceDate) || revenueCents == null) {
    return NextResponse.json(
      { error: "Choose a valid day and enter revenue of zero or more." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const venueId = cookieStore.get("little-birdee-venue")?.value;
  if (!venueId) {
    return NextResponse.json(
      { error: "Choose a venue before updating its numbers." },
      { status: 409 },
    );
  }

  const { data, error } = await supabase.rpc(
    "save_daily_actual_revenue",
    {
      p_venue_id: venueId,
      p_service_date: body.serviceDate,
      p_entered_revenue_cents: revenueCents,
    },
  );

  if (error || !data?.[0]) {
    const message = error?.message?.includes("Future revenue")
      ? "That day has not happened yet."
      : error?.message?.includes("No locked weekly plan")
        ? "Set up a weekly plan before entering daily revenue."
        : "Birdee could not save this day's revenue.";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  return NextResponse.json({
    actualRevisionId: data[0].actual_revision_id,
    revision: data[0].actual_revision,
  });
}
