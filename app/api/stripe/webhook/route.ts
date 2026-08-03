import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getBillingConfig } from "@/lib/billing/config";
import { deriveBillingEntitlement, normalizeStripeSubscriptionStatus } from "@/lib/billing/entitlement";
import {
  assertSubscriptionBinding,
  isStripeCancellationScheduled,
} from "@/lib/billing/webhook-validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

function isoFromUnix(value: number | null | undefined) {
  return value == null ? null : new Date(value * 1000).toISOString();
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice) {
  const subscription = invoice.parent?.subscription_details?.subscription;
  if (!subscription) return null;
  return typeof subscription === "string" ? subscription : subscription.id;
}

function stripeId(value: string | { id: string }) {
  return typeof value === "string" ? value : value.id;
}

async function applySubscription(
  subscription: Stripe.Subscription,
  event: Stripe.Event,
  options: { paidInvoice?: boolean; paymentFailed?: boolean } = {},
) {
  const admin = createAdminClient();
  const stripe = getStripe();
  const config = getBillingConfig();
  const businessId = subscription.metadata.little_birdee_business_id;
  if (!businessId) throw new Error("subscription_missing_business_metadata");

  const item = subscription.items.data[0];
  if (!item) throw new Error("subscription_missing_price_item");
  const customerId = stripeId(subscription.customer);
  const customer = await stripe.customers.retrieve(customerId);
  const customerBusinessId = customer.deleted
    ? null
    : customer.metadata.little_birdee_business_id ?? null;

  const { data: existing } = await admin
    .from("business_subscriptions")
    .select("paid_through, stripe_customer_id, stripe_subscription_id, stripe_price_id, status, access_state, data_state, payment_failed_at")
    .eq("business_id", businessId)
    .maybeSingle();

  assertSubscriptionBinding({
    businessId,
    customerBusinessId,
    subscriptionBusinessId: subscription.metadata.little_birdee_business_id ?? null,
    customerId,
    subscriptionId: subscription.id,
    priceId: item.price.id,
    expectedPriceId: config.stripePriceId,
    itemCount: subscription.items.data.length,
    quantity: item.quantity,
    existing: existing ? {
      stripeCustomerId: existing.stripe_customer_id,
      stripeSubscriptionId: existing.stripe_subscription_id,
      stripePriceId: existing.stripe_price_id,
      status: existing.status,
      accessState: existing.access_state,
      dataState: existing.data_state,
    } : null,
  });

  const paidThrough = options.paidInvoice
    ? isoFromUnix(item.current_period_end)
    : existing?.paid_through ?? null;
  const status = normalizeStripeSubscriptionStatus(subscription.status);
  const dataState = options.paidInvoice && (status === "active" || status === "trialing")
    ? "present"
    : existing?.data_state ?? "present";
  const entitlement = deriveBillingEntitlement({
    status,
    paidThrough,
    stripeCustomerId: customerId,
    dataState,
  });

  const { error } = await admin.rpc("apply_business_subscription_event", {
    p_business_id: businessId,
    p_stripe_customer_id: customerId,
    p_stripe_subscription_id: subscription.id,
    p_stripe_price_id: item.price.id,
    p_status: status,
    p_access_state: entitlement.accessState,
    p_paid_through: paidThrough,
    p_current_period_start: isoFromUnix(item.current_period_start),
    p_current_period_end: isoFromUnix(item.current_period_end),
    p_cancel_at_period_end: isStripeCancellationScheduled(
      subscription.cancel_at_period_end,
      subscription.cancel_at,
    ),
    p_payment_failed_at: options.paymentFailed
      ? isoFromUnix(event.created)
      : options.paidInvoice
        ? null
        : existing?.payment_failed_at ?? null,
    p_canceled_at: isoFromUnix(subscription.canceled_at),
    p_ended_at: isoFromUnix(subscription.ended_at),
    p_event_id: event.id,
    p_event_created: event.created,
  });
  if (error) throw error;

  const { data: applied, error: appliedError } = await admin
    .from("business_subscriptions")
    .select("last_stripe_event_id, access_state, data_state")
    .eq("business_id", businessId)
    .single();
  if (appliedError) throw appliedError;

  if (
    applied.last_stripe_event_id === event.id
    && applied.access_state === "ended"
    && applied.data_state !== "deleted"
    && entitlement.shouldDeleteOperationalData
  ) {
    const { error: deletionError } = await admin.rpc("delete_business_operational_data", {
      p_business_id: businessId,
      p_reason: `stripe_${status}`,
      p_stripe_event_id: event.id,
    });
    if (deletionError) throw deletionError;
  }
}

async function processEvent(event: Stripe.Event) {
  const stripe = getStripe();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const subscriptionId = typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;
      if (!subscriptionId) throw new Error("checkout_missing_subscription");
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await applySubscription(subscription, event);
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = await stripe.subscriptions.retrieve(event.data.object.id);
      await applySubscription(subscription, event);
      return;
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      const subscriptionId = subscriptionIdFromInvoice(event.data.object);
      if (!subscriptionId) return;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await applySubscription(subscription, event, {
        paidInvoice: event.type === "invoice.paid",
        paymentFailed: event.type === "invoice.payment_failed",
      });
      return;
    }
    default:
      return;
  }
}

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new NextResponse("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      payload,
      signature,
      getBillingConfig().stripeWebhookSecret,
    );
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const object = event.data.object;
  const objectId = "id" in object && typeof object.id === "string" ? object.id : "unknown";
  const admin = createAdminClient();
  const { data: claim, error: claimError } = await admin.rpc("claim_stripe_webhook_event", {
    p_event_id: event.id,
    p_event_type: event.type,
    p_object_id: objectId,
    p_event_created: event.created,
  });
  if (claimError) return new NextResponse("Could not claim event", { status: 500 });
  if (claim === "duplicate" || claim === "busy") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await processEvent(event);
    const { error } = await admin.rpc("complete_stripe_webhook_event", {
      p_event_id: event.id,
    });
    if (error) throw error;
    return NextResponse.json({ received: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "webhook_processing_failed";
    await admin.rpc("fail_stripe_webhook_event", {
      p_event_id: event.id,
      p_error_code: code.slice(0, 120),
    });
    return new NextResponse("Webhook processing failed", { status: 500 });
  }
}
