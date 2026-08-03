import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BillingRedirectButton } from "@/components/BillingRedirectButton";
import { assetPath, BRAND_LOGO_PATH } from "@/lib/site";
import { formatPaidThrough, loadBillingBusinessContext } from "@/lib/billing/server";
import "../billing.css";

export const dynamic = "force-dynamic";

export default async function BillingLockedPage() {
  const context = await loadBillingBusinessContext();
  if (!context) redirect("/auth/login");
  if (context.entitlement.canUseProduct) redirect("/app");
  if (context.entitlement.accessState === "pending") redirect("/billing");

  return (
    <div className="billing-page">
      <header className="billing-header">
        <Link href="/" className="billing-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetPath(BRAND_LOGO_PATH)} alt="" />
          <span>Little <strong>Birdee</strong></span>
        </Link>
        <span className="billing-header__business">{context.businessName}</span>
      </header>
      <main className="billing-state-shell">
        <div className="billing-recovery">
          <section className="billing-state__copy">
            <p className="billing-eyebrow">Payment needs attention</p>
            <h1>Let’s get Birdee flying again.</h1>
            <p className="billing-state__meta">
              Your last payment didn’t go through. Update it to reopen your numbers.
            </p>
            <p className="billing-recovery__notice">
              {context.businessName}
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
          <aside className="billing-state__stage">
            <Image src={assetPath("/brand/birdee-reference-concerned-v1.png")} width={420} height={420} alt="Birdee ready to help" priority />
          </aside>
        </div>
      </main>
    </div>
  );
}
