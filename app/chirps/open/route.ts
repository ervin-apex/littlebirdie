import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeDate(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function safeDestination(value: string | null) {
  return value === "setup" || value === "check-in" || value === "day" ? value : null;
}

function dayIndex(date: string) {
  const value = new Date(`${date}T00:00:00Z`);
  return (value.getUTCDay() + 6) % 7;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const venueId = url.searchParams.get("venue");
  const date = safeDate(url.searchParams.get("date"));
  const destination = safeDestination(url.searchParams.get("destination"));
  if (!venueId || !date || !destination) {
    return NextResponse.redirect(new URL("/app?chirp=invalid", url.origin));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const next = `${url.pathname}${url.search}`;
    const login = new URL("/auth", url.origin);
    login.searchParams.set("mode", "login");
    login.searchParams.set("next", next);
    return NextResponse.redirect(login);
  }

  const { data: venue } = await supabase
    .from("venues")
    .select("id")
    .eq("id", venueId)
    .eq("is_active", true)
    .maybeSingle();
  if (!venue) return NextResponse.redirect(new URL("/account?error=venue", url.origin));

  const target = destination === "setup"
    ? "/setup?from=chirp"
    : destination === "check-in"
      ? `/app/check-in?date=${date}`
      : `/app?period=this-week&view=day-verdict&day=${dayIndex(date)}&scope=day&service-date=${date}`;
  const response = NextResponse.redirect(new URL(target, url.origin));
  response.cookies.set("little-birdee-venue", venue.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
