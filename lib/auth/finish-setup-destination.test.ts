import { describe, expect, it } from "vitest";
import { resolveFinishSetupDestination } from "./finish-setup-destination";

const activeBilling = {
  accessState: "active" as const,
  canUseProduct: true,
  dataState: "present" as const,
};

function destination(overrides: Partial<Parameters<typeof resolveFinishSetupDestination>[0]> = {}) {
  return resolveFinishSetupDestination({
    billing: activeBilling,
    billingEnforcementEnabled: true,
    hasCompletedOnboarding: true,
    hasPlan: true,
    next: null,
    venueNavigationError: false,
    ...overrides,
  });
}

describe("finish-setup destination", () => {
  it("sends a terminal account with deleted data to billing instead of login", () => {
    expect(destination({
      billing: {
        accessState: "ended",
        canUseProduct: false,
        dataState: "deleted",
      },
      hasPlan: null,
    })).toBe("/billing");
  });

  it("sends an exhausted failed-payment account to recovery", () => {
    expect(destination({
      billing: {
        accessState: "locked_recovery",
        canUseProduct: false,
        dataState: "present",
      },
    })).toBe("/billing/locked");
  });

  it("starts a clean venue setup after a deleted account is reactivated", () => {
    expect(destination({ hasPlan: null })).toBe("/setup?from=new-venue");
  });

  it("does not mistake a venue query failure for a logged-out user", () => {
    expect(destination({ venueNavigationError: true })).toBe(
      "/account?error=venues-unavailable",
    );
  });

  it("preserves the normal setup and app destinations", () => {
    expect(destination({ hasPlan: false })).toBe("/setup");
    expect(destination()).toBe("/app?period=this-week");
    expect(destination({ next: "/account" })).toBe("/account");
  });

  it("keeps incomplete onboarding in onboarding", () => {
    expect(destination({ hasCompletedOnboarding: false })).toBe("/onboarding");
  });
});
