import type { Metadata } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import { LandingPage } from "@/app/landing/LandingPage";
import { createClient } from "@/lib/supabase/server";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-lb-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-lb-body",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Little Birdee — Improve yr profit",
  description:
    "See your profit before and as it happens, using the numbers already in your business. 5 min a week, $12 AUD.",
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const homeHref = data?.claims ? "/app" : "/";

  return (
    <LandingPage
      fontClassName={`${outfit.variable} ${dmSans.variable}`}
      homeHref={homeHref}
    />
  );
}
