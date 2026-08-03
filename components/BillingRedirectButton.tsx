"use client";

import { useState } from "react";
import { ArrowRight, CreditCard } from "@phosphor-icons/react";
import { ProductButton } from "@/components/ProductButton";

export function BillingRedirectButton({
  endpoint,
  children,
  variant = "primary",
}: {
  endpoint: "/api/stripe/checkout" | "/api/stripe/portal";
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function begin() {
    setState("loading");
    setError(null);
    try {
      const response = await fetch(endpoint, { method: "POST" });
      const body = await response.json().catch(() => null) as {
        url?: string;
        error?: string;
      } | null;
      if (!response.ok || !body?.url) {
        throw new Error(body?.error || "Billing is not ready yet. Try again shortly.");
      }
      window.location.assign(body.url);
    } catch (caught) {
      setState("error");
      setError(caught instanceof Error ? caught.message : "Billing is unavailable.");
    }
  }

  return (
    <div className="billing-redirect">
      <ProductButton
        variant={variant}
        state={state === "loading" ? "loading" : undefined}
        onClick={begin}
        leadingIcon={<CreditCard weight="bold" />}
        trailingIcon={<ArrowRight weight="bold" />}
      >
        {state === "loading" ? "Opening Stripe..." : children}
      </ProductButton>
      {error && <p className="billing-redirect__error" role="alert">{error}</p>}
    </div>
  );
}
