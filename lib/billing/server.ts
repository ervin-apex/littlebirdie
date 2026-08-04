import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { deriveBillingEntitlement } from "./entitlement";
import type {
  BillingProjection,
  ComplimentaryGrantProjection,
  ComplimentaryGrantType,
  StripeSubscriptionStatus,
} from "./types";

const VENUE_COOKIE = "little-birdee-venue";

type SubscriptionRow = {
  business_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: StripeSubscriptionStatus;
  access_state: BillingProjection["accessState"];
  data_state: BillingProjection["dataState"];
  paid_through: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  payment_failed_at: string | null;
  canceled_at: string | null;
  ended_at: string | null;
};

type ComplimentaryGrantRow = {
  id: string;
  business_id: string;
  grant_type: ComplimentaryGrantType;
  starts_at: string;
  expires_at: string | null;
  retention_until: string | null;
  revoked_at: string | null;
};

export type BillingBusinessContext = {
  userId: string;
  userEmail: string | null;
  businessId: string;
  businessName: string;
  role: string;
  canManage: boolean;
  projection: BillingProjection | null;
  complimentaryGrant: ComplimentaryGrantProjection | null;
  entitlement: ReturnType<typeof deriveBillingEntitlement>;
};

function mapProjection(row: SubscriptionRow): BillingProjection {
  return {
    businessId: row.business_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripePriceId: row.stripe_price_id,
    status: row.status,
    accessState: row.access_state,
    dataState: row.data_state,
    paidThrough: row.paid_through,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    paymentFailedAt: row.payment_failed_at,
    canceledAt: row.canceled_at,
    endedAt: row.ended_at,
  };
}

function mapComplimentaryGrant(row: ComplimentaryGrantRow): ComplimentaryGrantProjection {
  return {
    id: row.id,
    businessId: row.business_id,
    grantType: row.grant_type,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    retentionUntil: row.retention_until,
    revokedAt: row.revoked_at,
  };
}
export async function loadBillingBusinessContext(): Promise<BillingBusinessContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const selectedVenueId = cookieStore.get(VENUE_COOKIE)?.value;
  let businessId: string | null = null;
  let businessName = "My business";

  if (selectedVenueId) {
    const { data: venue } = await supabase
      .from("venues")
      .select("business_id, businesses(trading_name)")
      .eq("id", selectedVenueId)
      .eq("is_active", true)
      .maybeSingle();
    businessId = venue?.business_id ?? null;
    const related = venue?.businesses as unknown as { trading_name?: string } | null;
    businessName = related?.trading_name?.trim() || businessName;
  }

  const membershipQuery = supabase
    .from("business_members")
    .select("business_id, role, businesses(trading_name)")
    .eq("user_id", user.id);
  const { data: membershipRows } = businessId
    ? await membershipQuery.eq("business_id", businessId).limit(1)
    : await membershipQuery.order("created_at").limit(1);
  const membership = membershipRows?.[0] as {
    business_id: string;
    role: string;
    businesses?: { trading_name?: string } | null;
  } | undefined;
  if (!membership) return null;

  businessId = membership.business_id;
  businessName = membership.businesses?.trading_name?.trim() || businessName;
  const [{ data: subscriptionRow }, { data: grantRow }] = await Promise.all([
    supabase
      .from("business_subscriptions")
      .select("business_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, status, access_state, data_state, paid_through, current_period_start, current_period_end, cancel_at_period_end, payment_failed_at, canceled_at, ended_at")
      .eq("business_id", businessId)
      .maybeSingle(),
    supabase
      .from("business_access_grants")
      .select("id, business_id, grant_type, starts_at, expires_at, retention_until, revoked_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const projection = subscriptionRow
    ? mapProjection(subscriptionRow as SubscriptionRow)
    : null;
  const complimentaryGrant = grantRow
    ? mapComplimentaryGrant(grantRow as ComplimentaryGrantRow)
    : null;

  return {
    userId: user.id,
    userEmail: user.email ?? null,
    businessId,
    businessName,
    role: membership.role,
    canManage: membership.role === "owner" || membership.role === "admin",
    projection,
    complimentaryGrant,
    entitlement: deriveBillingEntitlement(projection, complimentaryGrant),
  };
}

export function billingEnforcementEnabled() {
  return process.env.BILLING_ENFORCEMENT_ENABLED === "true";
}

export function formatPaidThrough(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Australia/Sydney",
  }).format(new Date(value));
}

export const formatAccessDate = formatPaidThrough;
