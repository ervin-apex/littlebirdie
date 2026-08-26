import Image from "next/image";
import Link from "next/link";
import { CaretDown, CheckCircle, ShieldCheck, Storefront } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";
import { BillingRedirectButton } from "@/components/BillingRedirectButton";
import { assetPath, BRAND_LOGO_PATH } from "@/lib/site";
import { billingEnforcementEnabled, formatAccessDate, loadBillingBusinessContext } from "@/lib/billing/server";
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
  const billingPreviewEnabled = !billingEnforcementEnabled();
  const reviewMode = billingPreviewEnabled
    && (preview === "offer" || preview === "cancelled" || preview === "conversion");
  const checkoutCancelled = checkout === "cancelled" || (billingPreviewEnabled && preview === "cancelled");
  const conversionLocked = context.entitlement.accessState === "locked_conversion"
    || (billingPreviewEnabled && preview === "conversion");
  const retentionDate = formatAccessDate(context.complimentaryGrant?.retentionUntil ?? null);
  if (!reviewMode && context.entitlement.canUseProduct) redirect("/app");
  if (!reviewMode && context.entitlement.accessState === "locked_recovery") redirect("/billing/locked");

  return (
    <div className={`billing-page billing-page--offer${checkoutCancelled ? " billing-page--checkout-cancelled" : ""}`}>
      <BillingWave />
      <header className="billing-header">
        <Link href="/app" className="billing-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetPath(BRAND_LOGO_PATH)} alt="" />
          <span>Little <strong>Birdee</strong></span>
        </Link>
        <Link
          href="/account"
          className="billing-header__business"
          aria-label={`Open account for ${context.businessName}`}
        >
          <Storefront weight="bold" aria-hidden />
          <span>{context.businessName}</span>
          <CaretDown weight="bold" aria-hidden />
        </Link>
      </header>

      <main className="billing-layout">
        <section className="billing-content billing-offer__copy">
          <p className="billing-eyebrow">
            {checkoutCancelled ? "Checkout paused" : conversionLocked ? "Beta month complete" : "Setup complete"}
          </p>
          <h1>
            {checkoutCancelled ? "Nothing was charged." : conversionLocked ? "Keep Birdee flying." : "Your Birdee is ready."}
          </h1>
          <p className="billing-lede">
            {checkoutCancelled
              ? "Your setup is still here. Start your Little Birdee whenever you are ready."
              : conversionLocked
                ? "Subscribe to reopen every venue with the numbers you already entered."
              : "Keep every venue on track with one simple weekly subscription."}
          </p>
          {(checkoutCancelled || conversionLocked) && (
            <div className="billing-cancelled" role="status">
              <ShieldCheck weight="fill" aria-hidden />
              <div>
                <strong>Your numbers are safe.</strong>
                <span>
                  {checkoutCancelled
                    ? "Checkout closed before payment, so your setup has not changed."
                    : retentionDate
                      ? `Subscribe by ${retentionDate} to restore access without losing your work.`
                      : "Subscribe during the conversion window to restore access without losing your work."}
                </span>
              </div>
            </div>
          )}
          <div className="billing-price-card">
            <div className="billing-price"><strong>$12</strong><span>per week</span></div>
            <div className="billing-price-card__gst">
              <CheckCircle weight="fill" aria-hidden />
              <span>GST included</span>
            </div>
          </div>
          <ul className="billing-inclusions">
            {["Your whole business", "Every venue", "Cancel anytime"].map((item) => (
              <li key={item}><CheckCircle weight="fill" aria-hidden />{item}</li>
            ))}
          </ul>
          <div className="billing-action-row">
            {context.canManage ? (
              <BillingRedirectButton endpoint="/api/stripe/checkout">
                {checkoutCancelled
                  ? "Return to secure checkout"
                  : conversionLocked
                    ? "Continue for $12 a week"
                    : "Start my Little Birdee"}
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

        <aside
          className="billing-stage billing-offer__stage"
          aria-label={`One weekly membership for ${context.businessName}. Every venue. One simple price.`}
        >
          <div className="billing-offer-art">
            <Image
              src={assetPath("/brand/birdee-billing-membership-v2.png")}
              width={997}
              height={1578}
              alt=""
              className="billing-offer-art__image billing-offer-art__image--desktop"
              priority
            />
            <Image
              src={assetPath("/brand/birdee-billing-membership-compact-v3.png")}
              width={1536}
              height={1024}
              alt=""
              className="billing-offer-art__image billing-offer-art__image--compact"
              priority
            />
            <div className="billing-offer-art__copy billing-offer-art__copy--desktop" aria-hidden="true">
              <span>One weekly membership</span>
              <strong>{context.businessName}</strong>
              <p>Every venue. One simple price.</p>
            </div>
            <div className="billing-offer-art__copy billing-offer-art__copy--compact" aria-hidden="true">
              <span>One weekly membership</span>
              <strong>{context.businessName}</strong>
              <p>Every venue. One simple price.</p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
