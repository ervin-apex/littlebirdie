import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PaymentConfirmation } from "./PaymentConfirmation";
import { assetPath, BRAND_LOGO_PATH } from "@/lib/site";
import { billingEnforcementEnabled, loadBillingBusinessContext } from "@/lib/billing/server";
import { BillingWave } from "../BillingWave";
import "../billing.css";

export const dynamic = "force-dynamic";

export default async function BillingConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const context = await loadBillingBusinessContext();
  if (!context) redirect("/auth/login");
  const { preview } = await searchParams;
  const reviewMode = !billingEnforcementEnabled() && preview === "confirmed";

  return (
    <div className="billing-page billing-page--confirmed">
      <BillingWave />
      <header className="billing-header">
        <Link href="/app" className="billing-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetPath(BRAND_LOGO_PATH)} alt="" />
          <span>Little <strong>Birdee</strong></span>
        </Link>
        <span className="billing-header__business">{context.businessName}</span>
      </header>
      <main className="billing-layout billing-confirm">
        <div className="billing-content">
          <PaymentConfirmation
            businessName={context.businessName}
            needsSetup={context.projection?.dataState === "deleted"}
            previewConfirmed={reviewMode}
          />
        </div>
        <aside className="billing-stage billing-state__stage">
          <div className="billing-stage__message">
            <span>Payment confirmed</span>
            <strong>All sorted.</strong>
          </div>
          <Image
            src={assetPath("/brand/birdee-billing-confirmed-v1.png")}
            width={1254}
            height={1254}
            alt="Birdee celebrating a confirmed payment"
            priority
          />
          {reviewMode && <span className="billing-review-chip">UI review · Confirmed</span>}
        </aside>
      </main>
    </div>
  );
}
