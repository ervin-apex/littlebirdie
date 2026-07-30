import {
  ArrowRight,
  Buildings,
  PencilSimpleLine,
} from "@phosphor-icons/react/dist/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BirdeeMascot } from "@/components/BirdeeMascot";
import { ProductButton } from "@/components/ProductButton";
import { createClient } from "@/lib/supabase/server";
import { loadVenueNavigation } from "@/lib/venues/navigation";
import { setupStepsRemaining } from "@/lib/venues/setup-navigation";
import "./paused.css";

export const dynamic = "force-dynamic";

export default async function SetupPausedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, cookieStore] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle(),
    cookies(),
  ]);
  const venueNavigation = await loadVenueNavigation(
    supabase,
    cookieStore.get("little-birdee-venue")?.value,
  );
  const selectedVenue = venueNavigation.venues.find(
    (venue) => venue.id === venueNavigation.selectedVenueId,
  );
  if (!selectedVenue) redirect("/account");
  if (selectedVenue.hasPlan) redirect("/app?period=this-week");

  const displayName =
    profile?.display_name?.trim()
    || user.email?.split("@")[0]
    || "Account";
  const accountLabel = displayName.split(/\s+/)[0];
  const remainingSteps = setupStepsRemaining(
    selectedVenue.setupCompletedSteps,
    selectedVenue.setupTotalSteps,
  );

  return (
    <AppShell
      maxWidth="max-w-5xl"
      center
      accountLabel={accountLabel}
      venues={venueNavigation.venues}
      selectedVenueId={venueNavigation.selectedVenueId}
      headerWide
    >
      <section className="setup-paused fade-up" aria-labelledby="setup-paused-heading">
        <div className="setup-paused__birdee" aria-hidden>
          <BirdeeMascot state="neutral" size={230} />
        </div>

        <div className="setup-paused__content">
          <span>Setup paused</span>
          <h1 id="setup-paused-heading">{selectedVenue.name} still needs its numbers.</h1>
          <p>
            {selectedVenue.setupCompletedSteps} of {selectedVenue.setupTotalSteps} steps are saved.
            {" "}
            Continue with the {remainingSteps} {remainingSteps === 1 ? "step" : "steps"} remaining,
            or return to your venue list.
          </p>

          <div className="setup-paused__actions">
            <ProductButton
              href="/setup?from=venue-switch"
              variant="primary"
              size="choice"
              fullWidth
              leadingIcon={<PencilSimpleLine weight="duotone" />}
              trailingIcon={<ArrowRight weight="bold" />}
              description={`Continue with ${remainingSteps} ${remainingSteps === 1 ? "step" : "steps"} remaining.`}
            >
              Continue setting up {selectedVenue.name}
            </ProductButton>

            <ProductButton
              href="/account?setup=pending"
              variant="secondary"
              size="choice"
              fullWidth
              leadingIcon={<Buildings weight="duotone" />}
              trailingIcon={<ArrowRight weight="bold" />}
              description="Switch venues, add another one, or manage your account."
            >
              Account &amp; venues
            </ProductButton>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
