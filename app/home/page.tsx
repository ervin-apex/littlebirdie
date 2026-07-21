"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockSimple, PencilSimple } from "@phosphor-icons/react";
import { AppShell } from "@/components/AppShell";
import { BirdeeMascot } from "@/components/BirdeeMascot";
import { ProductButton } from "@/components/ProductButton";
import { hasSavedWeek } from "@/lib/profit";
import "./home.css";

/**
 * Two-job home hub. The wide composition follows the approved Scoreboard
 * Birdee reference while retaining the real first-run lock state.
 */
export default function HomeHub() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (hasSavedWeek()) {
      router.replace("/app?period=this-week");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <AppShell maxWidth="max-w-7xl" headerVariant="home">
        <div className="home-route-check" aria-label="Opening Little Birdee" aria-busy="true" />
      </AppShell>
    );
  }

  return (
    <AppShell maxWidth="max-w-7xl" headerVariant="home">
      <div className="home-hub fade-up" aria-busy={!ready}>
        <section className="home-workspace" aria-labelledby="home-question">
          <div className="home-birdee-stage" aria-hidden>
            <BirdeeMascot state="neutral" size={300} className="home-birdee" float />
          </div>

          <div className="home-choice-pane">
            <h1 id="home-question">What would you like to do?</h1>

            <div className="home-actions">
              <ProductButton
                variant="secondary"
                size="choice"
                fullWidth
                disabled
                leadingIcon={<LockSimple weight="regular" />}
                description="Enter your numbers first to unlock this."
              >
                How&apos;s my profit looking?
              </ProductButton>

              <ProductButton
                href="/setup"
                variant="primary"
                size="choice"
                fullWidth
                leadingIcon={<PencilSimple weight="regular" />}
                trailingIcon={<ArrowRight weight="regular" />}
                description="Add next week’s expectations."
              >
                Enter my numbers
              </ProductButton>
            </div>
          </div>
        </section>

        <footer className="home-rhythm-note">
          <span aria-hidden />
          <p>Check daily. Update weekly.</p>
          <span aria-hidden />
        </footer>
      </div>
    </AppShell>
  );
}
