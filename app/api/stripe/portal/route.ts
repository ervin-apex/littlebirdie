import { NextResponse } from "next/server";
import { loadBillingBusinessContext } from "@/lib/billing/server";
import { getStripe } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = await loadBillingBusinessContext();
  if (!context) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!context.canManage) {
    return NextResponse.json({ error: "Only an owner or admin can manage billing." }, { status: 403 });
  }
  const customerId = context.projection?.stripeCustomerId;
  if (!customerId) {
    return NextResponse.json({ error: "No billing account exists yet." }, { status: 409 });
  }

  const origin = new URL(request.url).origin;
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/account`,
  });
  return NextResponse.json({ url: session.url });
}
