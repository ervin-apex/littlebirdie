import { describe, expect, it } from "vitest";
import { deriveBillingEntitlement } from "./entitlement";

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

describe("billing entitlement", () => {
  it("requires checkout when a business has no billing record", () => {
    expect(deriveBillingEntitlement(null, NOW)).toMatchObject({
      accessState: "pending",
      canUseProduct: false,
      canStartCheckout: true,
    });
  });

  it("allows an active subscription only through the last confirmed paid date", () => {
    expect(deriveBillingEntitlement(
      projection("active", "2026-08-10T02:00:00.000Z"), NOW,
    ).canUseProduct).toBe(true);
    expect(deriveBillingEntitlement(
      projection("active", "2026-08-03T01:59:59.000Z"), NOW,
    ).canUseProduct).toBe(false);
  });

  it("keeps access during a paid period after cancellation", () => {
    expect(deriveBillingEntitlement(
      projection("canceled", "2026-08-07T00:00:00.000Z"), NOW,
    )).toMatchObject({
      accessState: "active",
      canUseProduct: true,
      shouldDeleteOperationalData: false,
    });
  });

  it("locks recovery only after a failed renewal exhausts paid access", () => {
    expect(deriveBillingEntitlement(
      projection("past_due", "2026-08-04T00:00:00.000Z"), NOW,
    )).toMatchObject({ canUseProduct: true, showPaymentWarning: true });

    expect(deriveBillingEntitlement(
      projection("past_due", "2026-08-02T00:00:00.000Z"), NOW,
    )).toMatchObject({ accessState: "locked_recovery", canUseProduct: false });
  });

  it("marks terminal unpaid data for deletion after paid access ends", () => {
    expect(deriveBillingEntitlement(
      projection("unpaid", "2026-08-02T00:00:00.000Z"), NOW,
    )).toMatchObject({
      accessState: "ended",
      canUseProduct: false,
      shouldDeleteOperationalData: true,
    });
  });

  it("does not delete while Checkout is still incomplete", () => {
    expect(deriveBillingEntitlement(projection("incomplete", null), NOW)).toMatchObject({
      accessState: "pending",
      canStartCheckout: true,
      shouldDeleteOperationalData: false,
    });
  });
});
