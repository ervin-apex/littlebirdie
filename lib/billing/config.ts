export type BillingConfig = {
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  stripePriceId: string;
  stripeTaxRateId: string;
};

export function billingIsConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY
    && process.env.STRIPE_WEBHOOK_SECRET
    && process.env.STRIPE_PRICE_ID
    && process.env.STRIPE_TAX_RATE_ID
    && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
export function getBillingConfig(): BillingConfig {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripePriceId = process.env.STRIPE_PRICE_ID;
  const stripeTaxRateId = process.env.STRIPE_TAX_RATE_ID;

  if (!stripeSecretKey || !stripeWebhookSecret || !stripePriceId || !stripeTaxRateId) {
    throw new Error("Stripe billing is not configured on this environment.");
  }

  return { stripeSecretKey, stripeWebhookSecret, stripePriceId, stripeTaxRateId };
}
