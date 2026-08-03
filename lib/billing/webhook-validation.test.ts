import { describe, expect, it } from "vitest";
import {
  assertSubscriptionBinding,
  isStripeCancellationScheduled,
  type ExistingSubscriptionBinding,
} from "./webhook-validation";

const existing: ExistingSubscriptionBinding = {
  stripeCustomerId: "cus_expected",
  stripeSubscriptionId: "sub_expected",
  stripePriceId: "price_weekly",
  status: "active",
  accessState: "active",
  dataState: "present",
};

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    businessId: "business-a",
    customerBusinessId: "business-a",
    subscriptionBusinessId: "business-a",
    customerId: "cus_expected",
    subscriptionId: "sub_expected",
    priceId: "price_weekly",
    expectedPriceId: "price_weekly",
    itemCount: 1,
    quantity: 1,
    existing,
    ...overrides,
  };
}

describe("assertSubscriptionBinding", () => {
  it("accepts the configured, pre-bound business subscription", () => {
    expect(() => assertSubscriptionBinding(validInput())).not.toThrow();
  });

  it.each([
    ["wrong price", { priceId: "price_other" }, "subscription_price_mismatch"],
    ["foreign customer", { customerId: "cus_other" }, "subscription_customer_mismatch"],
    ["foreign customer metadata", { customerBusinessId: "business-b" }, "customer_business_metadata_mismatch"],
    ["foreign subscription metadata", { subscriptionBusinessId: "business-b" }, "subscription_business_metadata_mismatch"],
    ["multiple items", { itemCount: 2 }, "subscription_invalid_item_count"],
    ["wrong quantity", { quantity: 2 }, "subscription_invalid_quantity"],
    ["foreign subscription", { subscriptionId: "sub_other" }, "subscription_existing_id_mismatch"],
    ["unprepared business", { existing: null }, "subscription_business_not_prepared"],
  ])("rejects %s", (_label, overrides, code) => {
    expect(() => assertSubscriptionBinding(validInput(overrides))).toThrow(code);
  });

  it("allows a new subscription after terminal business data was deleted", () => {
    expect(() => assertSubscriptionBinding(validInput({
      subscriptionId: "sub_new",
      existing: {
        ...existing,
        status: "canceled",
        accessState: "ended",
        dataState: "deleted",
      },
    }))).not.toThrow();
  });
});

describe("isStripeCancellationScheduled", () => {
  it.each([
    [true, null, true],
    [false, 1_786_322_400, true],
    [false, null, false],
  ])("normalizes period-end and scheduled timestamp cancellation", (atPeriodEnd, cancelAt, expected) => {
    expect(isStripeCancellationScheduled(atPeriodEnd, cancelAt)).toBe(expected);
  });
});
