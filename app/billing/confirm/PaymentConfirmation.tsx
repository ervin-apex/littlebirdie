"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Key, LockSimple, ShieldCheck } from "@phosphor-icons/react";
import { ProductButton } from "@/components/ProductButton";
import { assetPath } from "@/lib/site";

type State = "checking" | "confirmed" | "delayed";
type BillingStatusResponse = {
  entitlement?: { canUseProduct?: boolean };
};

type ProgressStep = {
  label: string;
  detail: string;
  status: "complete" | "active" | "pending";
};

function ConfirmationProgress({ steps }: { steps: ProgressStep[] }) {
  return (
    <ol className="billing-confirmation-progress" aria-label="Payment confirmation progress">
      {steps.map((step) => (
        <li
          key={step.label}
          className={`billing-confirmation-step billing-confirmation-step--${step.status}`}
          aria-current={step.status === "active" ? "step" : undefined}
        >
          <span className="billing-confirmation-step__icon" aria-hidden>
            {step.status === "complete" ? <Check weight="bold" /> : step.status === "active" ? <Key weight="bold" /> : <LockSimple weight="bold" />}
          </span>
          <span className="billing-confirmation-step__copy">
            <strong>{step.label}</strong>
            <span>{step.detail}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function PaymentConfirmation({
  businessName,
  needsSetup,
  previewState = null,
}: {
  businessName: string;
  needsSetup: boolean;
  previewState?: State | null;
}) {
  const [state, setState] = useState<State>(previewState ?? "checking");
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (previewState) {
      setState(previewState);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let timer: number | undefined;

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
      timer = window.setTimeout(check, 1250);
    }

    setState("checking");
    void check();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [previewState, retryToken]);

  const confirmed = state === "confirmed";
  const delayed = state === "delayed";
  const steps: ProgressStep[] = confirmed
    ? [
        { label: "Payment received", detail: "Your weekly membership is active.", status: "complete" },
        { label: "Business opened", detail: "Every venue is included.", status: "complete" },
        { label: "Ready", detail: "Your numbers are waiting.", status: "complete" },
      ]
    : [
        { label: "Checkout complete", detail: "Stripe sent you back safely.", status: "complete" },
        { label: "Confirming payment", detail: "Waiting for Stripe’s signed confirmation.", status: "active" },
        { label: "Open your numbers", detail: "Ready as soon as confirmation arrives.", status: "pending" },
      ];

  const retry = () => {
    setState("checking");
    setRetryToken((token) => token + 1);
  };

  return (
    <>
      <div className="billing-content billing-confirm__content">
        <section className="billing-state__copy" aria-live="polite">
          <p className="billing-eyebrow">{confirmed ? "Payment confirmed" : delayed ? "Taking a little longer" : "Finishing securely"}</p>
          <h1>{confirmed ? "You’re in." : delayed ? "Payment is still confirming." : "Birdee is confirming your payment."}</h1>
          <p className="billing-state__meta">
            {confirmed
              ? <>Birdee has opened <span className="billing-dynamic-name">{businessName}</span>.</>
              : delayed
                ? "Stripe’s confirmation is taking longer than usual. Your checkout is complete and you have not been charged twice."
                : "You’re back from Stripe. This usually takes a few seconds."}
          </p>

          <ConfirmationProgress steps={steps} />

          {confirmed ? (
            <div className="billing-confirmation-complete">
              <ProductButton
                href={needsSetup ? "/setup" : "/app"}
                variant="primary"
                fullWidth
                trailingIcon={<ArrowRight weight="bold" />}
              >
                {needsSetup ? "Set up my numbers" : "Open my numbers"}
              </ProductButton>
              <p className="billing-stripe-note">$12 weekly · GST included · <span className="billing-dynamic-name">{businessName}</span></p>
            </div>
          ) : (
            <div className="billing-confirmation-waiting">
              <p><ShieldCheck weight="bold" aria-hidden />You won’t be charged again.</p>
              <button className="billing-confirmation-retry" type="button" onClick={retry}>
                {delayed ? "Check again" : "Taking a while? Check again"}
              </button>
            </div>
          )}
        </section>
      </div>

      <aside
        className={`billing-stage billing-state__stage billing-confirm__stage billing-confirm__stage--${state}`}
        aria-label={confirmed ? "Payment confirmed. All sorted." : "Secure payment confirmation in progress. Nearly there."}
      >
        <div className="billing-stage__message">
          <span>{confirmed ? "Payment confirmed" : "Secure check"}</span>
          <strong>{confirmed ? "All sorted." : delayed ? "Still checking." : "Nearly there."}</strong>
        </div>
        <Image
          key={state}
          src={assetPath(confirmed ? "/brand/birdee-payment-confirmed-v2.png" : "/brand/birdee-payment-confirming-v1.png")}
          width={1536}
          height={1024}
          alt=""
          className="billing-confirm__illustration"
          priority
        />
      </aside>
    </>
  );
}
