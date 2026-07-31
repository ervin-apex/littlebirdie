import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { LandingVideoLab } from "./LandingVideoLab";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Little Birdee — Improve yr profit",
  description:
    "See your profit before and as it happens, using the numbers already in your business.",
  robots: { index: false, follow: false },
};

export default async function LandingVideoLabPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return <LandingVideoLab homeHref={data?.claims ? "/app" : "/"} />;
}
