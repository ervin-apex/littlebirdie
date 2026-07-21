"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CaretDown } from "@phosphor-icons/react";
import { BusinessOnboardingVisual } from "@/components/OnboardingVisuals";
import { OnboardingHeader } from "@/components/OnboardingHeader";
import { ProductButton } from "@/components/ProductButton";
import {
  CURRENCIES,
  DEFAULT_BUSINESS,
  INDUSTRIES,
  loadBusiness,
  saveBusiness,
  type Business,
} from "@/lib/business";
import "../onboarding-flow.css";

export default function OnboardingPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<Business>(DEFAULT_BUSINESS);

  useEffect(() => {
    const saved = loadBusiness();
    if (saved) setBusiness(saved);
  }, []);

  const set = <K extends keyof Business>(key: K, value: Business[K]) => {
    setBusiness((current) => ({ ...current, [key]: value }));
  };

  const canContinue = business.name.trim().length > 0;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canContinue) return;
    saveBusiness({ ...business, name: business.name.trim() });
    router.push("/setup?from=onboarding");
  };

  return (
    <div className="onboarding-page onboarding-page--business">
      <div className="onboarding-copy-column">
        <OnboardingHeader />

        <main className="onboarding-business-main">
          <div className="onboarding-progress" aria-label="Business setup">
            <strong>Business setup</strong>
            <span aria-hidden><i /></span>
          </div>

          <section className="onboarding-business-copy" aria-labelledby="business-heading">
            <h1 id="business-heading">Quick bit about ya business.</h1>
            <p>This keeps your numbers right. Takes less than a minute.</p>
          </section>

          <form className="onboarding-business-form" onSubmit={submit}>
            <Field label="Business name" htmlFor="business-name" className="onboarding-field--wide">
              <input
                id="business-name"
                name="business-name"
                type="text"
                value={business.name}
                onChange={(event) => set("name", event.target.value)}
                placeholder="e.g. Crema Café"
                autoComplete="organization"
                autoFocus
                required
              />
            </Field>

            <Field label="Industry" htmlFor="business-industry">
              <div className="onboarding-select-wrap">
                <select
                  id="business-industry"
                  name="business-industry"
                  value={business.industry}
                  onChange={(event) => set("industry", event.target.value)}
                >
                  {INDUSTRIES.map((industry) => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
                <CaretDown weight="bold" aria-hidden />
              </div>
            </Field>

            <Field label="Currency" htmlFor="business-currency">
              <div className="onboarding-select-wrap">
                <select
                  id="business-currency"
                  name="business-currency"
                  value={business.currency}
                  onChange={(event) => set("currency", event.target.value)}
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>{currency.label}</option>
                  ))}
                </select>
                <CaretDown weight="bold" aria-hidden />
              </div>
            </Field>

            <div className="onboarding-gst-row">
              <div>
                <strong>Prices include GST</strong>
                <p>Turn this on if GST is already built into what ya charge.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={business.gstIncluded}
                aria-label="Prices include GST"
                className="onboarding-switch"
                onClick={() => set("gstIncluded", !business.gstIncluded)}
              >
                <span />
              </button>
            </div>

            <div className="onboarding-form-actions">
              <ProductButton
                type="button"
                variant="secondary"
                className="onboarding-back"
                onClick={() => router.push("/")}
              >
                Back
              </ProductButton>
              <ProductButton
                type="submit"
                variant="primary"
                className="onboarding-next"
                disabled={!canContinue}
              >
                Next: my numbers
              </ProductButton>
            </div>
          </form>
        </main>
      </div>

      <BusinessOnboardingVisual />
    </div>
  );
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`onboarding-field ${className ?? ""}`} htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
    </label>
  );
}
