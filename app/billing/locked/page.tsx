import Image from "next/image";
import Link from "next/link";
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
        <span className="billing-header__business">{context.businessName}</span>
      </header>
      <main className="billing-layout billing-recovery">
          <section className="billing-content billing-state__copy">
            <p className="billing-eyebrow">Payment needs attention</p>
            <h1>Let’s get Birdee flying again.</h1>
            <p className="billing-state__meta">
              Your last payment didn’t go through. Update it to reopen your numbers.
            </p>
            <p className="billing-recovery__notice">
              <span className="billing-dynamic-name">{context.businessName}</span>
              {context.projection?.paidThrough
                ? ` · Access ended ${formatPaidThrough(context.projection.paidThrough)}`
                : ""}
              <br />Your business is locked while Stripe retries the payment.
            </p>
            <div className="billing-action-row">
              <BillingRedirectButton endpoint="/api/stripe/portal">Fix my payment</BillingRedirectButton>
              <form action="/auth/logout" method="post">
                <button className="billing-quiet-link" type="submit">Log out</button>
              </form>
            </div>
            <p className="billing-stripe-note">Need help? Contact Little Birdee.</p>
          </section>
          <aside className="billing-stage billing-state__stage">
            <div className="billing-stage__message">
              <span>Nothing is lost</span>
              <strong>We can fix this.</strong>
            </div>
            <Image
              src={assetPath("/brand/birdee-billing-recovery-v1.png")}
              width={1254}
              height={1254}
              alt="Birdee ready with a repair kit"
              priority
            />
            {reviewMode && <span className="billing-review-chip">UI review · Recovery</span>}
          </aside>
      </main>
    </div>
  );
}
