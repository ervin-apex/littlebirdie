"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock } from "@phosphor-icons/react";
import { OnboardingHeader } from "@/components/OnboardingHeader";
import { WelcomeOnboardingVisual } from "@/components/OnboardingVisuals";
import { ProductButton } from "@/components/ProductButton";
import { hasBusiness } from "@/lib/business";
import { hasSavedWeek } from "@/lib/profit";
import "./onboarding-flow.css";

export default function WelcomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (hasSavedWeek()) {
      router.replace("/app?period=this-week");
      return;
    }
    if (hasBusiness()) {
      router.replace("/home");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="onboarding-route-check" role="status" aria-label="Opening Little Birdee">
        <span />
      </div>
    );
  }

  return (
    <div className="onboarding-page onboarding-page--welcome">
      <div className="onboarding-copy-column">
        <OnboardingHeader />

        <main className="onboarding-welcome-copy">
          <div className="onboarding-heading-lockup">
            <h1>Improve ya profit.</h1>
            <span className="onboarding-chirp" aria-hidden>
              <i />
              <i />
              <i />
            </span>
          </div>

          <p className="onboarding-punchline">See it now. Improve it now.</p>
          <p className="onboarding-intro">
            Little Birdee pulls together the numbers already in your business and puts profit
            right in front of ya.
          </p>

          <p className="onboarding-proof">
            <Clock weight="regular" aria-hidden />
            <span>Five minutes a week. No numbers brain required.</span>
          </p>

          <div className="onboarding-welcome-actions">
            <ProductButton href="/onboarding" variant="primary" className="onboarding-primary">
              Let&apos;s go
            </ProductButton>
            <Link href="/home" className="onboarding-return-link">
              Already set up? <span>Fly in.</span>
            </Link>
          </div>
        </main>

        <footer className="onboarding-footer">Made by operators, for operators.</footer>
      </div>

      <WelcomeOnboardingVisual />
    </div>
  );
}
