import { NextResponse } from "next/server";
import { getChirpTokenSecret } from "@/lib/chirps/config";
import { disableChirpsWithToken } from "@/lib/chirps/unsubscribe";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = new URL("/chirps/unsubscribe", url.origin);
  const token = url.searchParams.get("token");
  if (token) page.searchParams.set("token", token);
  return NextResponse.redirect(page);
}

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing unsubscribe token." }, { status: 400 });
  const result = await disableChirpsWithToken(token, getChirpTokenSecret());
  if (!result.ok && result.reason === "invalid") {
    return NextResponse.json({ error: "Invalid unsubscribe token." }, { status: 400 });
  }
  // An already-used link is still a successful one-click unsubscribe outcome.
  return new NextResponse(null, { status: 204 });
}
