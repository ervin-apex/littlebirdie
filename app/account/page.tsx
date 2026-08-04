import Image from "next/image";
import {
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
  const billingContext = await loadBillingBusinessContext();
  const billing = billingContext?.projection;
  const complimentaryGrant = billingContext?.complimentaryGrant;
  const billingEntitlement = billingContext?.entitlement;
  const hasComplimentaryAccess = billingEntitlement?.accessSource === "complimentary";
  const billingStatus = hasComplimentaryAccess
    ? "Complimentary"
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
    >
      <div className="account-page fade-up">
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
              <span data-state={billingEntitlement?.accessState ?? "pending"}>{billingStatus}</span>
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
        </section>

        <section className="account-venue-section" aria-labelledby="venue-list-heading">
          <div className="account-section-heading">
            <h2 id="venue-list-heading">Your venues</h2>
            <p>The venue in the header controls which numbers you see throughout the app.</p>
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
