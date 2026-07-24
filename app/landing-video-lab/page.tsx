import type { Metadata } from "next";
import { LandingVideoLab } from "./LandingVideoLab";

export const metadata: Metadata = {
  title: "Little Birdee — Improve yr profit",
  description:
    "See your profit before and as it happens, using the numbers already in your business.",
  robots: { index: false, follow: false },
};

export default function LandingVideoLabPage() {
  return <LandingVideoLab />;
}
