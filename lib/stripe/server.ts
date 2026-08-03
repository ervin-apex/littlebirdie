import "server-only";
import Stripe from "stripe";
import { getBillingConfig } from "@/lib/billing/config";

let stripeClient: Stripe | undefined;

export function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(getBillingConfig().stripeSecretKey, {
      appInfo: { name: "Little Birdee", version: "0.1.0" },
    });
  }
  return stripeClient;
}
