export type ExistingSubscriptionBinding = {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  status: string;
  accessState: string;
  dataState: string;
};

type SubscriptionBindingInput = {
  businessId: string;
  customerBusinessId: string | null;
  subscriptionBusinessId: string | null;
  customerId: string;
  subscriptionId: string;
  priceId: string;
  expectedPriceId: string;
  itemCount: number;
  quantity: number | null | undefined;
  existing: ExistingSubscriptionBinding | null;
};

function canReplaceEndedSubscription(existing: ExistingSubscriptionBinding) {
  return existing.accessState === "ended"
    && existing.dataState === "deleted"
    && ["canceled", "unpaid", "incomplete_expired"].includes(existing.status);
}

export function assertSubscriptionBinding(input: SubscriptionBindingInput) {
  if (!input.existing) throw new Error("subscription_business_not_prepared");
  if (input.itemCount !== 1) throw new Error("subscription_invalid_item_count");
  if (input.quantity !== 1) throw new Error("subscription_invalid_quantity");
  if (input.priceId !== input.expectedPriceId) throw new Error("subscription_price_mismatch");
  if (input.subscriptionBusinessId !== input.businessId) {
    throw new Error("subscription_business_metadata_mismatch");
  }
  if (input.customerBusinessId !== input.businessId) {
    throw new Error("customer_business_metadata_mismatch");
  }
  if (!input.existing.stripeCustomerId) {
    throw new Error("subscription_customer_not_prebound");
  }
  if (input.existing.stripeCustomerId !== input.customerId) {
    throw new Error("subscription_customer_mismatch");
  }
  if (input.existing.stripePriceId && input.existing.stripePriceId !== input.priceId) {
    throw new Error("subscription_existing_price_mismatch");
  }
  if (
    input.existing.stripeSubscriptionId
    && input.existing.stripeSubscriptionId !== input.subscriptionId
    && !canReplaceEndedSubscription(input.existing)
  ) {
    throw new Error("subscription_existing_id_mismatch");
  }
}

export function isStripeCancellationScheduled(
  cancelAtPeriodEnd: boolean,
  cancelAt: number | null | undefined,
) {
  return cancelAtPeriodEnd || cancelAt != null;
}
