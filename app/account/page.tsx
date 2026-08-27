import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Buildings,
  CalendarBlank,
  CheckCircle,
  Clock,
  CreditCard,
  Gift,
  Key,
  Storefront,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BillingRedirectButton } from "@/components/BillingRedirectButton";
import { ChirpPreferenceCard } from "@/components/ChirpPreferenceCard";
import { ProductButton } from "@/components/ProductButton";
import { assetPath } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { formatAccessDate, formatPaidThrough, loadBillingBusinessContext } from "@/lib/billing/server";
import { loadVenueNavigation } from "@/lib/venues/navigation";
import { setupStepsRemaining } from "@/lib/venues/setup-navigation";
import { switchVenue } from "./actions";
import "./account.css";

export const dynamic = "force-dynamic";

type Membership = {
  business_id: string;
  role: string;
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; setup?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: membershipRows }, cookieStore] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("business_members")
      .select("business_id, role")
      .eq("user_id", user.id),
    cookies(),
  ]);

  const memberships = (membershipRows ?? []) as Membership[];
  const roleByBusinessId = new Map(
    memberships.map((membership) => [membership.business_id, membership.role]),
  );
  const venueNavigation = await loadVenueNavigation(
    supabase,
    cookieStore.get("little-birdee-venue")?.value,
  );
  const selectedVenue = venueNavigation.venues.find(
    (venue) => venue.id === venueNavigation.selectedVenueId,
  );
  const { error, setup } = await searchParams;
  const displayName =
    profile?.display_name?.trim()
    || user.email?.split("@")[0]
    || "Little Birdee user";
  const accountLabel = displayName.split(/\s+/)[0];
  const provider =
    user.app_metadata?.provider === "google"
      ? "Google"
      : "Email and password";
  const memberSince = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(user.created_at));
  const currentRole = selectedVenue
    ? roleByBusinessId.get(selectedVenue.businessId) ?? "member"
    : "member";
  const currentRoleLabel =
    currentRole.slice(0, 1).toUpperCase() + currentRole.slice(1);
  const canAddVenue = memberships.some(
    (membership) => membership.role === "owner" || membership.role === "admin",
  );
  const selectedSetupRemaining = selectedVenue
    ? setupStepsRemaining(
      selectedVenue.setupCompletedSteps,
      selectedVenue.setupTotalSteps,
    )
    : 0;
  const { data: chirpPreference } = selectedVenue
    ? await supabase
      .from("chirp_preferences")
      .select("enabled, delivery_time_local, time_zone")
      .eq("venue_id", selectedVenue.id)
      .eq("user_id", user.id)
      .maybeSingle()
    : { data: null };
  const { data: lastChirpDelivery } = selectedVenue
    ? await supabase
      .from("chirp_deliveries")
      .select("status, service_date")
      .eq("venue_id", selectedVenue.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    : { data: null };
  const billingContext = await loadBillingBusinessContext();
  const billing = billingContext?.projection;
  const complimentaryGrant = billingContext?.complimentaryGrant;
  const billingEntitlement = billingContext?.entitlement;
  const hasComplimentaryAccess = billingEntitlement?.accessSource === "complimentary";
  const showPaymentWarning = Boolean(billingEntitlement?.showPaymentWarning);
  const billingStatus = hasComplimentaryAccess
    ? "Complimentary"
    : showPaymentWarning
      ? "Payment needed"
    : billingEntitlement?.canUseProduct
      ? billing?.cancelAtPeriodEnd ? "Ending" : "Active"
    : billingEntitlement?.accessState === "locked_recovery"
      ? "Payment needed"
      : billingEntitlement?.accessState === "locked_conversion"
        ? "Beta ended"
      : "Not active";
  const billingDate = formatPaidThrough(billing?.paidThrough ?? null);
  const grantExpiryDate = formatAccessDate(complimentaryGrant?.expiresAt ?? null);
  const retentionDate = formatAccessDate(complimentaryGrant?.retentionUntil ?? null);
  const planName = hasComplimentaryAccess
    ? complimentaryGrant?.grantType === "permanent"
      ? "Little Birdee complimentary"
      : "Little Birdee beta access"
    : "Little Birdee weekly";
  const planPrice = hasComplimentaryAccess
    ? complimentaryGrant?.grantType === "permanent"
      ? "All access, no expiry"
      : "One month complimentary"
    : "$12 / week";
  const planMeta = hasComplimentaryAccess
    ? "Covers your whole business · Every venue"
    : "GST included · Covers your whole business";
  const canShowBillingAction = billingContext?.canManage && !hasComplimentaryAccess;
  const shouldOpenBillingPortal = Boolean(
    billing?.stripeCustomerId
    && (
      billingEntitlement?.accessState === "active"
      || billingEntitlement?.accessState === "locked_recovery"
    ),
  );

  return (
    <AppShell
      maxWidth="max-w-6xl"
      accountLabel={accountLabel}
      venues={venueNavigation.venues}
      selectedVenueId={venueNavigation.selectedVenueId}
      headerWide
      showAppNav
    >
      <div className="account-page fade-up">
        {/* Reached from the header menu on any screen, and until now the only
            way out was that menu again or the browser's own back. */}
        <ProductButton
          href="/app?period=this-week"
          variant="tertiary"
          size="compact"
          leadingIcon={<ArrowLeft weight="bold" />}
        >
          Back to Home
        </ProductButton>

        <header className="account-heading">
          <h1>Account &amp; venues</h1>
          <p>Manage your sign-in and the places Birdee uses.</p>
        </header>

        {error === "venue" && (
          <p className="account-message account-message--error" role="alert">
            <WarningCircle weight="fill" aria-hidden />
            That venue is not available to this account.
          </p>
        )}
        {error === "venues-unavailable" && (
          <p className="account-message account-message--error" role="alert">
            <WarningCircle weight="fill" aria-hidden />
            Birdee could not load your venues. Please refresh and try again.
          </p>
        )}
        {error === "business-unavailable" && (
          <p className="account-message account-message--error" role="alert">
            <WarningCircle weight="fill" aria-hidden />
            Birdee could not find the business for this account. Please contact support.
          </p>
        )}

        {setup === "pending" && selectedVenue && !selectedVenue.hasPlan && (
          <section className="account-setup-paused" aria-labelledby="setup-paused-title">
            <WarningCircle weight="fill" aria-hidden />
            <div>
              <span>Setup paused</span>
              <h2 id="setup-paused-title">{selectedVenue.name} still needs its numbers.</h2>
              <p>
                {selectedVenue.setupCompletedSteps} of {selectedVenue.setupTotalSteps} steps saved
                {" · "}
                {selectedSetupRemaining} {selectedSetupRemaining === 1 ? "step" : "steps"} remaining.
              </p>
            </div>
            <ProductButton
              href="/setup?from=venue-switch"
              variant="primary"
              size="compact"
              trailingIcon={<ArrowRight weight="bold" />}
            >
              Continue setup
            </ProductButton>
          </section>
        )}

        <section className="account-identity-section" aria-labelledby="account-details-heading">
          <h2 id="account-details-heading">Account details</h2>
          <div className="account-identity">
            <div className="account-avatar" aria-hidden>
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <div className="account-identity__main">
              <strong>{displayName}</strong>
              <span>{user.email}</span>
            </div>
            <dl className="account-identity__details">
              <div>
                <dt><Key aria-hidden /> Sign-in</dt>
                <dd>{provider}</dd>
              </div>
              <div>
                <dt><Buildings aria-hidden /> Access</dt>
                <dd>{currentRoleLabel}</dd>
              </div>
              <div>
                <dt><CalendarBlank aria-hidden /> Member since</dt>
                <dd>{memberSince}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="account-billing-section" aria-labelledby="billing-heading">
          <h2 id="billing-heading">Billing</h2>
          <div className="account-billing">
            <div className="account-billing__icon" aria-hidden>
              {hasComplimentaryAccess ? <Gift weight="duotone" /> : <CreditCard weight="duotone" />}
            </div>
            <div className="account-billing__plan">
              <strong>{planName}</strong>
              <span>{planPrice}</span>
              <small>{planMeta}</small>
            </div>
            <div className="account-billing__status">
              <span
                data-state={showPaymentWarning
                  ? "payment_warning"
                  : billingEntitlement?.accessState ?? "pending"}
              >
                {billingStatus}
              </span>
              {hasComplimentaryAccess && complimentaryGrant?.grantType === "permanent" ? (
                <small>Provided by Little Birdee</small>
              ) : hasComplimentaryAccess && grantExpiryDate ? (
                <small>Access through {grantExpiryDate}</small>
              ) : billingEntitlement?.accessState === "locked_conversion" && retentionDate ? (
                <small>Numbers kept until {retentionDate}</small>
              ) : billingDate ? (
                <small>{billing?.cancelAtPeriodEnd ? "Access until" : "Paid through"} {billingDate}</small>
              ) : null}
            </div>
            {canShowBillingAction && (
              <BillingRedirectButton
                endpoint={shouldOpenBillingPortal ? "/api/stripe/portal" : "/api/stripe/checkout"}
                variant="secondary"
              >
                {shouldOpenBillingPortal ? "Manage billing" : "Start subscription"}
              </BillingRedirectButton>
            )}
          </div>
          <p className="account-billing__coverage">
            {billingEntitlement?.accessState === "locked_conversion"
              ? "Subscribe during the 30-day conversion window to reopen every venue with its numbers unchanged."
              : `Every current and future venue in ${billingContext?.businessName ?? "your business"} is included.`}
          </p>
          {showPaymentWarning && billingDate && (
            <div className="account-billing-warning" role="status" aria-live="polite">
              <WarningCircle weight="fill" aria-hidden />
              <div>
                <strong>Your latest payment didn’t go through.</strong>
                <p>
                  Your numbers stay open until {billingDate}. Use Manage billing to update
                  your payment method before then.
                </p>
              </div>
            </div>
          )}
        </section>

        {selectedVenue && (
          <section id="daily-chirps" className="account-chirp-section" aria-labelledby="chirp-heading">
            <div className="account-section-heading">
              <h2 id="chirp-heading">Daily Chirps</h2>
              <p>This setting applies only to {selectedVenue.name} and your signed-in email.</p>
            </div>
            <ChirpPreferenceCard initial={{
              venueName: selectedVenue.name,
              enabled: chirpPreference?.enabled ?? false,
              deliveryTimeLocal: chirpPreference?.delivery_time_local?.slice(0, 5) ?? "07:00",
              timeZone: chirpPreference?.time_zone ?? "Australia/Sydney",
              recipientEmail: user.email ?? "Your account email",
              lastDeliveryStatus: lastChirpDelivery?.status ?? null,
              lastServiceDate: lastChirpDelivery?.service_date ?? null,
            }} />
          </section>
        )}

        <section className="account-venue-section" aria-labelledby="venue-list-heading">
          {/* The header switcher only appears once there is a second venue,
              so pointing at it would be describing a control that is not
              there for most accounts. */}
          <div className="account-section-heading">
            <h2 id="venue-list-heading">
              {venueNavigation.venues.length > 1 ? "Your venues" : "Your venue"}
            </h2>
            <p>
              {venueNavigation.venues.length > 1
                ? "The venue in the header controls which numbers you see throughout the app."
                : "Everything in the app reports on this venue."}
            </p>
          </div>

          <div className="account-venues">
            {venueNavigation.venues.map((venue) => {
              const active = venue.id === venueNavigation.selectedVenueId;
              const remainingSteps = setupStepsRemaining(
                venue.setupCompletedSteps,
                venue.setupTotalSteps,
              );
              return (
                <article
                  className={`account-venue${active ? " is-current" : ""}${!venue.hasPlan ? " needs-setup" : ""}`}
                  key={venue.id}
                >
                  <div className="account-venue__icon" aria-hidden>
                    <Storefront weight="duotone" />
                  </div>
                  <div className="account-venue__identity">
                    <strong>{venue.name}</strong>
                    <span>{venue.businessName}</span>
                  </div>
                  <div className="account-venue__status">
                    {!venue.hasPlan ? (
                      <>
                        <span className="account-venue__setup">
                          <WarningCircle weight="fill" aria-hidden />
                          Setup needed
                        </span>
                        <small>
                          {venue.setupCompletedSteps} of {venue.setupTotalSteps} steps
                          {" · "}
                          {remainingSteps} left
                        </small>
                        <form action={switchVenue}>
                          <input type="hidden" name="venueId" value={venue.id} />
                          <button type="submit" className="account-venue__continue">
                            Continue setup
                            <ArrowRight weight="bold" aria-hidden />
                          </button>
                        </form>
                      </>
                    ) : active ? (
                      <span className="account-venue__current">
                        <CheckCircle weight="fill" aria-hidden />
                        Current
                      </span>
                    ) : (
                      <>
                        <span className="account-venue__ready">
                          <CheckCircle weight="fill" aria-hidden />
                          Ready
                        </span>
                        <form action={switchVenue}>
                          <input type="hidden" name="venueId" value={venue.id} />
                          <button type="submit">
                            Use venue
                            <ArrowRight weight="bold" aria-hidden />
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </article>
              );
            })}

          </div>

          {canAddVenue && (
            <aside className="account-add-venue" aria-labelledby="add-venue-heading">
              <Image
                src={assetPath("/brand/birdee-reference-business-v1.png")}
                width={150}
                height={132}
                alt=""
                className="account-add-venue__birdee"
              />
              <div className="account-add-venue__copy">
                <h3 id="add-venue-heading">Add another venue</h3>
                <p>
                  Every venue needs its own quick setup so Birdee can calculate
                  its profit correctly.
                </p>
                <span>
                  <Clock weight="bold" aria-hidden />
                  About 3 minutes
                  <i aria-hidden>·</i>
                  Connections can be added later
                </span>
              </div>
              <ProductButton
                href="/setup?from=new-venue"
                variant="primary"
                trailingIcon={<ArrowRight weight="bold" />}
                className="account-add-venue__button"
              >
                Start venue setup
              </ProductButton>
            </aside>
          )}
        </section>
      </div>
    </AppShell>
  );
}
