import Image from "next/image";
import Link from "next/link";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";
import { BillingRedirectButton } from "@/components/BillingRedirectButton";
import { assetPath, BRAND_LOGO_PATH } from "@/lib/site";
import { loadBillingBusinessContext } from "@/lib/billing/server";
import "./billing.css";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const context = await loadBillingBusinessContext();
  if (!context) redirect("/auth/login");
  if (context.entitlement.canUseProduct) redirect("/app");
  if (context.entitlement.accessState === "locked_recovery") redirect("/billing/locked");
  const { checkout } = await searchParams;

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

      <main className="billing-offer">
        <section className="billing-offer__copy">
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

        <aside className="billing-offer__stage" aria-label="Your Little Birdee membership">
          <div className="billing-membership-card">
            <span>One weekly membership</span>
            <strong>{context.businessName}</strong>
          </div>
          <Image
            src={assetPath("/brand/birdee-reference-business-v1.png")}
            width={520}
            height={460}
            alt="Birdee holding the business numbers"
            className="billing-offer__birdee"
            priority
          />
        </aside>
      </main>
    </div>
  );
}
