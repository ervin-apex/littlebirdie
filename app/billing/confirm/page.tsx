import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PaymentConfirmation } from "./PaymentConfirmation";
import { assetPath, BRAND_LOGO_PATH } from "@/lib/site";
import { loadBillingBusinessContext } from "@/lib/billing/server";
import "../billing.css";

export const dynamic = "force-dynamic";

export default async function BillingConfirmPage() {
  const context = await loadBillingBusinessContext();
  if (!context) redirect("/auth/login");

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
        <div className="billing-confirm">
          <PaymentConfirmation
            businessName={context.businessName}
            needsSetup={context.projection?.dataState === "deleted"}
          />
          <aside className="billing-state__stage">
            <Image src={assetPath("/brand/birdee-reference-profit-v1.png")} width={420} height={420} alt="Birdee celebrating" priority />
          </aside>
        </div>
      </main>
    </div>
  );
}
