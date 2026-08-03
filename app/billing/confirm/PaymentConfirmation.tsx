"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "@phosphor-icons/react";
import { ProductButton } from "@/components/ProductButton";

type State = "checking" | "confirmed" | "delayed";
type BillingStatusResponse = {
  entitlement?: { canUseProduct?: boolean };
};

export function PaymentConfirmation({
  businessName,
  needsSetup,
}: {
  businessName: string;
  needsSetup: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    async function check() {
      attempts += 1;
      let body: BillingStatusResponse | null = null;
      try {
        const response = await fetch("/api/billing/status", { cache: "no-store" });
        body = await response.json().catch(() => null) as BillingStatusResponse | null;
      } catch {
        body = null;
      }
      if (cancelled) return;
      if (body?.entitlement?.canUseProduct) {
        setState("confirmed");
        return;
      }
      if (attempts >= 12) {
        setState("delayed");
        return;
      }
      window.setTimeout(check, 1250);
    }
    void check();
    return () => { cancelled = true; };
  }, []);

  if (state !== "confirmed") {
    return (
      <section className="billing-state__copy" aria-live="polite">
        <p className="billing-eyebrow">Finishing securely</p>
        <h1>{state === "checking" ? "Birdee is opening your business." : "Payment is still confirming."}</h1>
        <p className="billing-state__meta">
          {state === "checking"
            ? "Stripe has sent you back. Birdee is waiting for the signed payment confirmation."
            : "This can occasionally take a moment. You have not been asked to pay twice."}
        </p>
        <ProductButton variant="secondary" onClick={() => router.refresh()}>
          Check again
        </ProductButton>
      </section>
    );
  }

  return (
    <section className="billing-state__copy">
      <p className="billing-eyebrow">Payment confirmed</p>
      <h1>You’re in.</h1>
      <p className="billing-state__meta">Birdee has opened {businessName}.</p>
      <ul className="billing-state__steps">
        {["Payment received", "Business opened", "Ready"].map((step) => (
          <li key={step}><CheckCircle weight="fill" aria-hidden />{step}</li>
        ))}
      </ul>
      <ProductButton href={needsSetup ? "/setup" : "/app"} variant="primary">
        {needsSetup ? "Set up my numbers" : "Open my numbers"}
      </ProductButton>
      <p className="billing-stripe-note">$12 weekly · GST included · {businessName}</p>
    </section>
  );
}
