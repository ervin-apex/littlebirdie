import type {
  BillingAccessSource,
  BillingAccessState,
  BillingProjection,
  ComplimentaryGrantProjection,
  StripeSubscriptionStatus,
} from "./types";

const TERMINAL_STATUSES = new Set<StripeSubscriptionStatus>([
  "incomplete_expired",
  "canceled",
  "unpaid",
]);

export type BillingEntitlement = {
  accessState: BillingAccessState;
  accessSource: BillingAccessSource;
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

function isCurrentOrPast(value: string | null | undefined, now: Date) {
  if (!value) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed <= now.getTime();
}

export function deriveBillingEntitlement(
  projection: Pick<
    BillingProjection,
    "status" | "paidThrough" | "stripeCustomerId" | "dataState"
  > | null,
  complimentaryGrant: Pick<
    ComplimentaryGrantProjection,
    "grantType" | "startsAt" | "expiresAt" | "retentionUntil" | "revokedAt"
  > | null = null,
  now = new Date(),
): BillingEntitlement {
  const dataIsPresent = projection?.dataState !== "deleted"
    && projection?.dataState !== "deletion_pending";
  const paidAccessRemains = isFuture(projection?.paidThrough, now);
  const terminal = projection ? TERMINAL_STATUSES.has(projection.status) : false;
  const stripeCanUseProduct =
    Boolean(projection)
    && projection?.dataState === "present"
    && paidAccessRemains
    && (projection?.status === "active"
      || projection?.status === "trialing"
      || projection?.status === "past_due"
      || projection?.status === "canceled");

  const grantHasStarted = complimentaryGrant
    ? isCurrentOrPast(complimentaryGrant.startsAt, now)
    : false;
  const grantIsActive = Boolean(
    complimentaryGrant
    && complimentaryGrant.revokedAt === null
    && grantHasStarted
    && (
      complimentaryGrant.grantType === "permanent"
      || isFuture(complimentaryGrant.expiresAt, now)
    ),
  );
  const conversionWindowOpen = Boolean(
    complimentaryGrant?.grantType === "beta"
    && grantHasStarted
    && isCurrentOrPast(
      complimentaryGrant.revokedAt ?? complimentaryGrant.expiresAt,
      now,
    )
    && isFuture(complimentaryGrant.retentionUntil, now),
  );
  const complimentaryCanUseProduct = dataIsPresent && grantIsActive;
  const canUseProduct = stripeCanUseProduct || complimentaryCanUseProduct;
  const accessSource: BillingAccessSource = stripeCanUseProduct
    ? "stripe"
    : complimentaryCanUseProduct
      ? "complimentary"
      : null;

  let accessState: BillingAccessState = "pending";
  if (canUseProduct) accessState = "active";
  else if (conversionWindowOpen) accessState = "locked_conversion";
  else if (projection?.status === "past_due") accessState = "locked_recovery";
  else if (terminal || (projection && projection.dataState !== "present")) accessState = "ended";

  const grantRetentionEnded = Boolean(
    complimentaryGrant?.grantType === "beta"
    && isCurrentOrPast(complimentaryGrant.retentionUntil, now),
  );

  return {
    accessState,
    accessSource,
    canUseProduct,
    canStartCheckout:
      accessState === "pending"
      || accessState === "locked_conversion"
      || accessState === "ended",
    canManageBilling: Boolean(projection?.stripeCustomerId),
    showPaymentWarning: projection?.status === "past_due" && paidAccessRemains,
    shouldDeleteOperationalData:
      projection?.dataState === "present"
      && !canUseProduct
      && !conversionWindowOpen
      && ((terminal && !paidAccessRemains) || grantRetentionEnded),
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
