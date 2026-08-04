import Image from "next/image";
import Link from "next/link";
import { CaretDown, CreditCard, ShieldCheck, Storefront } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";
import { BillingRedirectButton } from "@/components/BillingRedirectButton";
import { assetPath, BRAND_LOGO_PATH } from "@/lib/site";
import { billingEnforcementEnabled, formatPaidThrough, loadBillingBusinessContext } from "@/lib/billing/server";
import { BillingWave } from "../BillingWave";
import "../billing.css";

export const dynamic = "force-dynamic";

export default async function BillingLockedPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const context = await loadBillingBusinessContext();
  if (!context) redirect("/auth/login");
  const { preview } = await searchParams;
  const reviewMode = !billingEnforcementEnabled() && preview === "locked";
  if (!reviewMode && context.entitlement.canUseProduct) redirect("/app");
  if (!reviewMode && context.entitlement.accessState === "pending") redirect("/billing");

  return (
    <div className="billing-page billing-page--recovery">
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
      <main className="billing-layout billing-recovery">
          <section className="billing-content billing-state__copy billing-recovery__copy">
            <p className="billing-eyebrow">Payment needs attention</p>
            <h1>Let&rsquo;s get Birdee flying again.</h1>
            <p className="billing-state__meta">
              Your last payment didn&rsquo;t go through. Update it to reopen your numbers.
            </p>

            <div className="billing-recovery__status" role="status">
              <div className="billing-recovery__status-header">
                <span className="billing-recovery__status-icon" aria-hidden>
                  <CreditCard weight="fill" />
                </span>
                <strong className="billing-dynamic-name">{context.businessName}</strong>
                <span className="billing-recovery__badge">Access paused</span>
              </div>
              <div className="billing-recovery__status-copy">
                <strong>Your numbers are safe.</strong>
                <span>Update your payment method and Stripe will retry the payment.</span>
                {context.projection?.paidThrough && (
                  <small>Paid access ended {formatPaidThrough(context.projection.paidThrough)}.</small>
                )}
              </div>
            </div>

            <div className="billing-action-row billing-recovery__actions">
              <BillingRedirectButton endpoint="/api/stripe/portal">Fix my payment</BillingRedirectButton>
              <form action="/auth/logout" method="post">
                <button className="billing-quiet-link" type="submit">Log out</button>
              </form>
            </div>
            <p className="billing-recovery__reassurance">
              <ShieldCheck weight="fill" aria-hidden />
              Nothing will be deleted while you fix this.
            </p>
          </section>
          <aside className="billing-stage billing-state__stage billing-recovery__stage">
            <div className="billing-stage__message">
              <span>Nothing is lost</span>
              <strong>Your numbers are safe.</strong>
            </div>
            <Image
              src={assetPath("/brand/birdee-billing-recovery-v2.png")}
              width={1536}
              height={1024}
              alt=""
              className="billing-recovery__illustration"
              priority
            />
          </aside>
      </main>
    </div>
  );
}
