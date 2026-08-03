import Image from "next/image";
import Link from "next/link";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";
import { BillingRedirectButton } from "@/components/BillingRedirectButton";
import { assetPath, BRAND_LOGO_PATH } from "@/lib/site";
import { billingEnforcementEnabled, loadBillingBusinessContext } from "@/lib/billing/server";
import { BillingWave } from "./BillingWave";
import "./billing.css";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; preview?: string }>;
}) {
  const context = await loadBillingBusinessContext();
  if (!context) redirect("/auth/login");
  const { checkout, preview } = await searchParams;
  const reviewMode = !billingEnforcementEnabled() && preview === "offer";
  if (!reviewMode && context.entitlement.canUseProduct) redirect("/app");
  if (!reviewMode && context.entitlement.accessState === "locked_recovery") redirect("/billing/locked");

  return (
    <div className="billing-page billing-page--offer">
      <BillingWave />
      <header className="billing-header">
        <Link href="/app" className="billing-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetPath(BRAND_LOGO_PATH)} alt="" />
          <span>Little <strong>Birdee</strong></span>
        </Link>
        <span className="billing-header__business">{context.businessName}</span>
      </header>

      <main className="billing-layout">
        <section className="billing-content billing-offer__copy">
          <p className="billing-eyebrow">Setup complete</p>
          <h1>Your Birdee is ready.</h1>
          <p className="billing-lede">
            Keep every venue on track with one simple weekly subscription.
          </p>
          <div className="billing-price"><strong>$12</strong><span>per week</span></div>
          <ul className="billing-inclusions">
            {["GST included", "Your whole business", "Every venue", "Cancel anytime"].map((item) => (
              <li key={item}><CheckCircle weight="fill" aria-hidden />{item}</li>
            ))}
          </ul>
          {checkout === "cancelled" && (
            <p className="billing-cancelled">No charge was made. You can continue whenever you are ready.</p>
          )}
          <div className="billing-action-row">
            {context.canManage ? (
              <BillingRedirectButton endpoint="/api/stripe/checkout">
                Start my Little Birdee
              </BillingRedirectButton>
            ) : (
              <p>Ask a business owner or admin to activate Little Birdee.</p>
            )}
            <form action="/auth/logout" method="post">
              <button className="billing-quiet-link" type="submit">Not now — log out</button>
            </form>
          </div>
          <p className="billing-stripe-note">Secure checkout by Stripe · No free trial</p>
        </section>

        <aside className="billing-stage billing-offer__stage" aria-label="Your Little Birdee membership">
          <div className="billing-membership-card">
            <span>One weekly membership</span>
            <strong>{context.businessName}</strong>
          </div>
          <Image
            src={assetPath("/brand/birdee-billing-offer-v1.png")}
            width={1348}
            height={1167}
            alt="Birdee holding the key to the business membership"
            className="billing-offer__birdee"
            priority
          />
          {reviewMode && <span className="billing-review-chip">UI review · Offer</span>}
        </aside>
      </main>
    </div>
  );
}
