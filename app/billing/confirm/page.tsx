import Link from "next/link";
import { CaretDown, Storefront } from "@phosphor-icons/react/dist/ssr";
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
  const previewState = !billingEnforcementEnabled()
    && (preview === "checking" || preview === "delayed" || preview === "confirmed")
    ? preview
    : null;

  return (
    <div className="billing-page billing-page--confirmed">
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
      <main className="billing-layout billing-confirm">
        <PaymentConfirmation
          businessName={context.businessName}
          needsSetup={context.projection?.dataState === "deleted"}
          previewState={previewState}
        />
      </main>
    </div>
  );
}
