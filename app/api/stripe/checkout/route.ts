import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBillingConfig } from "@/lib/billing/config";
import { loadBillingBusinessContext } from "@/lib/billing/server";
import { getStripe } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = await loadBillingBusinessContext();
  if (!context) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!context.canManage) {
    return NextResponse.json({ error: "Only an owner or admin can start billing." }, { status: 403 });
  }
  if (context.entitlement.canUseProduct) {
    return NextResponse.json({ url: "/app" });
  }

  const stripe = getStripe();
  const config = getBillingConfig();
  const admin = createAdminClient();
  const { error: prepareError } = await admin
    .from("business_subscriptions")
    .upsert({ business_id: context.businessId }, { onConflict: "business_id", ignoreDuplicates: true });
  if (prepareError) {
    return NextResponse.json({ error: "Birdee could not prepare billing." }, { status: 500 });
  }

  let customerId = context.projection?.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: context.userEmail ?? undefined,
      name: context.businessName,
      metadata: { little_birdee_business_id: context.businessId },
    });
    customerId = customer.id;
    const { error } = await admin
      .from("business_subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("business_id", context.businessId)
      .is("stripe_customer_id", null);
    if (error) throw error;
  }

  const existingSubscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });
  const openSubscription = existingSubscriptions.data.find((subscription) =>
    ["active", "trialing", "past_due", "unpaid", "paused"].includes(subscription.status),
  );
  if (openSubscription) {
    const origin = new URL(request.url).origin;
    if (openSubscription.status !== "active" && openSubscription.status !== "trialing") {
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/billing/confirm`,
      });
      return NextResponse.json({ url: portal.url });
    }
    return NextResponse.json({
      url: `${origin}/billing/confirm`,
    });
  }

  const origin = new URL(request.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: context.businessId,
    line_items: [{ price: config.stripePriceId, quantity: 1 }],
    subscription_data: {
      default_tax_rates: [config.stripeTaxRateId],
      metadata: { little_birdee_business_id: context.businessId },
    },
    metadata: { little_birdee_business_id: context.businessId },
    success_url: `${origin}/billing/confirm?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/billing?checkout=cancelled`,
    allow_promotion_codes: false,
  }, {
    idempotencyKey: `lb_checkout_${context.businessId}_${Math.floor(Date.now() / 600000)}`,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Stripe did not return a checkout link." }, { status: 502 });
  }
  return NextResponse.json({ url: session.url });
}
