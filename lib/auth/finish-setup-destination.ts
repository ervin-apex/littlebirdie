import type { BillingAccessState, BillingDataState } from "@/lib/billing/types";

type BillingEntryState = {
  accessState: BillingAccessState;
  canUseProduct: boolean;
  dataState: BillingDataState | null;
} | null;

type FinishSetupDestinationInput = {
  billing: BillingEntryState;
  billingEnforcementEnabled: boolean;
  hasCompletedOnboarding: boolean;
  hasPlan: boolean | null;
  next: string | null;
  venueNavigationError: boolean;
};

export function resolveFinishSetupDestination({
  billing,
  billingEnforcementEnabled,
  hasCompletedOnboarding,
  hasPlan,
  next,
  venueNavigationError,
}: FinishSetupDestinationInput) {
  if (!hasCompletedOnboarding) return "/onboarding";

  // Operational records have already been removed (or are being removed), so
  // the old venue cookie cannot be repaired. Take the operator to re-subscribe
  // instead of sending an authenticated session back through the login route.
  if (billing?.dataState === "deleted" || billing?.dataState === "deletion_pending") {
    return "/billing";
  }

  if (billingEnforcementEnabled && billing && !billing.canUseProduct) {
    return billing.accessState === "locked_recovery"
      ? "/billing/locked"
      : "/billing";
  }

  if (venueNavigationError) return "/account?error=venues-unavailable";

  if (hasPlan === null) {
    // A paid or complimentary business can legitimately have no venues after
    // terminal-data deletion and reactivation. Start a clean venue setup.
    if (!billingEnforcementEnabled || billing?.canUseProduct) {
      return "/setup?from=new-venue";
    }

    // Missing business context is an account-data problem, not an auth error.
    return "/account?error=business-unavailable";
  }

  return next ?? (hasPlan ? "/app?period=this-week" : "/setup");
}
