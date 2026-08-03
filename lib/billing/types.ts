export const STRIPE_SUBSCRIPTION_STATUSES = [
  "none",
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused",
] as const;

export type StripeSubscriptionStatus =
  (typeof STRIPE_SUBSCRIPTION_STATUSES)[number];

export type BillingAccessState =
  | "pending"
  | "active"
  | "locked_recovery"
  | "ended";

export type BillingDataState = "present" | "deletion_pending" | "deleted";

export type BillingProjection = {
  businessId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  status: StripeSubscriptionStatus;
  accessState: BillingAccessState;
  dataState: BillingDataState;
  paidThrough: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  paymentFailedAt: string | null;
  canceledAt: string | null;
  endedAt: string | null;
};
