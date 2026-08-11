import type { Metadata } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import { LandingV2 } from "@/app/landing-v2/LandingV2";
import { createClient } from "@/lib/supabase/server";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-lb2-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-lb2-body",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Little Birdee — Yr profit, visible and increasable",
  description:
    "See probable profit while there is still time to improve it. Ten minutes to set up, one minute a day, $12 AUD a week.",
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return (
    <LandingV2
      fontClassName={`${outfit.variable} ${dmSans.variable}`}
      isAuthenticated={Boolean(data?.claims)}
    />
  );
}
