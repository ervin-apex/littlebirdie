import { describe, expect, it } from "vitest";
import { deriveBillingEntitlement } from "./entitlement";
import type { ComplimentaryGrantProjection } from "./types";

const NOW = new Date("2026-08-03T02:00:00.000Z");

function projection(
  status: "active" | "past_due" | "canceled" | "unpaid" | "incomplete",
  paidThrough: string | null,
) {
  return {
    status,
    paidThrough,
    stripeCustomerId: "cus_test",
    dataState: "present" as const,
  };
}

function grant(
  grantType: "permanent" | "beta",
  options: Partial<ComplimentaryGrantProjection> = {},
): ComplimentaryGrantProjection {
  return {
    id: "grant_test",
    businessId: "business_test",
    grantType,
    startsAt: "2026-08-01T00:00:00.000Z",
    expiresAt: grantType === "beta" ? "2026-09-01T00:00:00.000Z" : null,
    retentionUntil: grantType === "beta" ? "2026-10-01T00:00:00.000Z" : null,
    revokedAt: null,
    ...options,
  };
}

describe("billing entitlement", () => {
  it("requires checkout when a business has no billing record", () => {
    expect(deriveBillingEntitlement(null, null, NOW)).toMatchObject({
      accessState: "pending",
      accessSource: null,
      canUseProduct: false,
      canStartCheckout: true,
    });
  });

  it("allows an active subscription only through the last confirmed paid date", () => {
    expect(deriveBillingEntitlement(
      projection("active", "2026-08-10T02:00:00.000Z"), null, NOW,
    ).canUseProduct).toBe(true);
    expect(deriveBillingEntitlement(
      projection("active", "2026-08-03T01:59:59.000Z"), null, NOW,
    ).canUseProduct).toBe(false);
  });

  it("keeps access during a paid period after cancellation", () => {
    expect(deriveBillingEntitlement(
      projection("canceled", "2026-08-07T00:00:00.000Z"), null, NOW,
    )).toMatchObject({
      accessState: "active",
      canUseProduct: true,
      shouldDeleteOperationalData: false,
    });
  });

  it("locks recovery only after a failed renewal exhausts paid access", () => {
    expect(deriveBillingEntitlement(
      projection("past_due", "2026-08-04T00:00:00.000Z"), null, NOW,
    )).toMatchObject({ canUseProduct: true, showPaymentWarning: true });

    expect(deriveBillingEntitlement(
      projection("past_due", "2026-08-02T00:00:00.000Z"), null, NOW,
    )).toMatchObject({ accessState: "locked_recovery", canUseProduct: false });
  });

  it("marks terminal unpaid data for deletion after paid access ends", () => {
    expect(deriveBillingEntitlement(
      projection("unpaid", "2026-08-02T00:00:00.000Z"), null, NOW,
    )).toMatchObject({
      accessState: "ended",
      canUseProduct: false,
      shouldDeleteOperationalData: true,
    });
  });

  it("does not delete while Checkout is still incomplete", () => {
    expect(deriveBillingEntitlement(projection("incomplete", null), null, NOW)).toMatchObject({
      accessState: "pending",
      canStartCheckout: true,
      shouldDeleteOperationalData: false,
    });
  });

  it("allows permanent complimentary access without Stripe", () => {
    expect(deriveBillingEntitlement(null, grant("permanent"), NOW)).toMatchObject({
      accessState: "active",
      accessSource: "complimentary",
      canUseProduct: true,
      canStartCheckout: false,
      shouldDeleteOperationalData: false,
    });
  });

  it("allows an active beta grant without collecting payment details", () => {
    expect(deriveBillingEntitlement(null, grant("beta"), NOW)).toMatchObject({
      accessState: "active",
      accessSource: "complimentary",
      canUseProduct: true,
      canStartCheckout: false,
    });
  });

  it("locks an expired beta for conversion while preserving its data", () => {
    const expiredBeta = grant("beta", {
      expiresAt: "2026-08-02T00:00:00.000Z",
      retentionUntil: "2026-09-01T00:00:00.000Z",
    });
    expect(deriveBillingEntitlement(null, expiredBeta, NOW)).toMatchObject({
      accessState: "locked_conversion",
      accessSource: null,
      canUseProduct: false,
      canStartCheckout: true,
      shouldDeleteOperationalData: false,
    });
  });

  it("marks beta data for deletion only after the conversion window", () => {
    const expiredBeta = grant("beta", {
      expiresAt: "2026-07-01T00:00:00.000Z",
      retentionUntil: "2026-08-02T00:00:00.000Z",
    });
    expect(deriveBillingEntitlement(
      projection("incomplete", null),
      expiredBeta,
      NOW,
    )).toMatchObject({
      accessState: "pending",
      canUseProduct: false,
      shouldDeleteOperationalData: true,
    });
  });

  it("prefers confirmed paid access when beta and Stripe overlap", () => {
    expect(deriveBillingEntitlement(
      projection("active", "2026-08-10T00:00:00.000Z"),
      grant("beta"),
      NOW,
    )).toMatchObject({
      accessState: "active",
      accessSource: "stripe",
      canUseProduct: true,
    });
  });

  it("does not let a terminal Stripe state override an active grant", () => {
    expect(deriveBillingEntitlement(
      projection("unpaid", "2026-08-02T00:00:00.000Z"),
      grant("permanent"),
      NOW,
    )).toMatchObject({
      accessState: "active",
      accessSource: "complimentary",
      canUseProduct: true,
      shouldDeleteOperationalData: false,
    });
  });

  it("does not let a terminal Stripe state delete data during beta conversion", () => {
    expect(deriveBillingEntitlement(
      projection("unpaid", "2026-08-02T00:00:00.000Z"),
      grant("beta", {
        expiresAt: "2026-08-02T00:00:00.000Z",
        retentionUntil: "2026-09-01T00:00:00.000Z",
      }),
      NOW,
    )).toMatchObject({
      accessState: "locked_conversion",
      canUseProduct: false,
      shouldDeleteOperationalData: false,
    });
  });

  it("keeps a revoked beta in its 30-day conversion window", () => {
    expect(deriveBillingEntitlement(null, grant("beta", {
      expiresAt: "2026-08-02T00:00:00.000Z",
      retentionUntil: "2026-09-02T00:00:00.000Z",
      revokedAt: "2026-08-02T00:00:00.000Z",
    }), NOW)).toMatchObject({
      accessState: "locked_conversion",
      canUseProduct: false,
      shouldDeleteOperationalData: false,
    });
  });
});
