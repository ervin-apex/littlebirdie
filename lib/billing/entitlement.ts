import type {
  BillingAccessState,
  BillingProjection,
  StripeSubscriptionStatus,
} from "./types";

const TERMINAL_STATUSES = new Set<StripeSubscriptionStatus>([
  "incomplete_expired",
  "canceled",
  "unpaid",
]);

export type BillingEntitlement = {
  accessState: BillingAccessState;
  canUseProduct: boolean;
  canStartCheckout: boolean;
  canManageBilling: boolean;
  showPaymentWarning: boolean;
  shouldDeleteOperationalData: boolean;
};

function isFuture(value: string | null | undefined, now: Date) {
  if (!value) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed > now.getTime();
}
export function deriveBillingEntitlement(
  projection: Pick<
    BillingProjection,
    "status" | "paidThrough" | "stripeCustomerId" | "dataState"
  > | null,
  now = new Date(),
): BillingEntitlement {
  if (!projection) {
    return {
      accessState: "pending",
      canUseProduct: false,
      canStartCheckout: true,
      canManageBilling: false,
      showPaymentWarning: false,
      shouldDeleteOperationalData: false,
    };
  }

  const paidAccessRemains = isFuture(projection.paidThrough, now);
  const terminal = TERMINAL_STATUSES.has(projection.status);
  const canUseProduct =
    projection.dataState === "present"
    && paidAccessRemains
    && (projection.status === "active"
      || projection.status === "trialing"
      || projection.status === "past_due"
      || projection.status === "canceled");

  let accessState: BillingAccessState = "pending";
  if (canUseProduct) accessState = "active";
  else if (projection.status === "past_due") accessState = "locked_recovery";
  else if (terminal || projection.dataState !== "present") accessState = "ended";

  return {
    accessState,
    canUseProduct,
    canStartCheckout: accessState === "pending" || accessState === "ended",
    canManageBilling: Boolean(projection.stripeCustomerId),
    showPaymentWarning: projection.status === "past_due" && paidAccessRemains,
    shouldDeleteOperationalData:
      projection.dataState === "present" && terminal && !paidAccessRemains,
  };
}

export function normalizeStripeSubscriptionStatus(
  value: string | null | undefined,
): StripeSubscriptionStatus {
  switch (value) {
    case "incomplete":
    case "incomplete_expired":
    case "trialing":
    case "active":
    case "past_due":
    case "canceled":
    case "unpaid":
    case "paused":
      return value;
    default:
      return "none";
  }
}
