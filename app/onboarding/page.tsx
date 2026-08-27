"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CaretDown } from "@phosphor-icons/react";
import { BusinessOnboardingVisual } from "@/components/OnboardingVisuals";
import { OnboardingHeader } from "@/components/OnboardingHeader";
import { ProductButton } from "@/components/ProductButton";
import { createClient } from "@/lib/supabase/client";
import "../onboarding-flow.css";

const INDUSTRIES = [
  "Café / Restaurant",
  "Bar / Pub",
  "Retail shop",
  "Hair / Beauty salon",
  "Fitness / Wellness",
  "Professional services",
  "Other",
] as const;

type OnboardingDetails = {
  displayName: string;
  businessName: string;
  venueName: string;
  industry: string;
};

const EMPTY_DETAILS: OnboardingDetails = {
  displayName: "",
  businessName: "",
  venueName: "",
  industry: INDUSTRIES[0],
};

export default function OnboardingPage() {
  const router = useRouter();
  const [details, setDetails] = useState<OnboardingDetails>(EMPTY_DETAILS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  /* Most operators run one place, so the venue name is the business name
     again. Mirror it while they type rather than asking twice - but stop the
     moment they set it themselves, and never touch a name they already
     chose on an earlier visit. */
  const [venueRenamed, setVenueRenamed] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/onboarding", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Birdee could not load your business.");
        return body as OnboardingDetails;
      })
      .then((body) => {
        if (!active) return;
        setDetails(body);
        // A name already on the record is the operator's own choice.
        if (body.venueName.trim()) setVenueRenamed(true);
      })
      .catch((error: unknown) => {
        if (active) {
          setMessage(
            error instanceof Error ? error.message : "Birdee could not load your business.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function set<K extends keyof OnboardingDetails>(key: K, value: OnboardingDetails[K]) {
    setDetails((current) => ({ ...current, [key]: value }));
  }

  function setBusinessName(value: string) {
    setDetails((current) => ({
      ...current,
      businessName: value,
      venueName: venueRenamed ? current.venueName : value,
    }));
  }

  function setVenueName(value: string) {
    setVenueRenamed(true);
    set("venueName", value);
  }

  const canContinue =
    !loading &&
    details.displayName.trim().length > 0 &&
    details.businessName.trim().length > 0 &&
    details.venueName.trim().length > 0 &&
    details.industry.trim().length > 0;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canContinue || saving) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Birdee could not save your business.");
      router.push("/setup?from=onboarding");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Birdee could not save your business.",
      );
      setSaving(false);
    }
  }

  async function useAnotherAccount() {
    setSaving(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/");
  }

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
            <h1 id="business-heading">Quick bit about your business.</h1>
            <p>This keeps your numbers in the right place. Takes less than a minute.</p>
          </section>

          <form className="onboarding-business-form" onSubmit={submit} aria-busy={loading || saving}>
            <Field label="Your name" htmlFor="display-name">
              <input
                id="display-name"
                name="display-name"
                type="text"
                value={details.displayName}
                onChange={(event) => set("displayName", event.target.value)}
                autoComplete="name"
                maxLength={120}
                disabled={loading}
                required
              />
            </Field>

            <Field label="Industry" htmlFor="business-industry">
              <div className="onboarding-select-wrap">
                <select
                  id="business-industry"
                  name="business-industry"
                  value={details.industry}
                  onChange={(event) => set("industry", event.target.value)}
                  disabled={loading}
                >
                  {INDUSTRIES.map((industry) => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
                <CaretDown weight="bold" aria-hidden />
              </div>
            </Field>

            <Field
              label="Business name"
              htmlFor="business-name"
              className="onboarding-field--wide"
            >
              <input
                id="business-name"
                name="business-name"
                type="text"
                value={details.businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="e.g. Crema Café"
                autoComplete="organization"
                maxLength={160}
                disabled={loading}
                required
              />
            </Field>

            <Field
              label="Venue name"
              htmlFor="venue-name"
              hint="Only matters if you run more than one place. Leaving this as your business name is fine."
              className="onboarding-field--wide"
            >
              <input
                id="venue-name"
                name="venue-name"
                type="text"
                value={details.venueName}
                onChange={(event) => setVenueName(event.target.value)}
                maxLength={160}
                disabled={loading}
                required
              />
            </Field>

            <div className="onboarding-currency-note">
              <div>
                <strong>Currency</strong>
                <p>Australian dollars (AUD)</p>
              </div>
              <span>GST choices come next with your revenue.</span>
            </div>

            {message && <p className="onboarding-form-message" role="alert">{message}</p>}

            <div className="onboarding-form-actions">
              <ProductButton
                type="button"
                variant="secondary"
                className="onboarding-back"
                onClick={useAnotherAccount}
                disabled={saving}
              >
                Use another account
              </ProductButton>
              <ProductButton
                type="submit"
                variant="primary"
                className="onboarding-next"
                state={saving ? "loading" : undefined}
                disabled={!canContinue}
              >
                {saving ? "Saving…" : "Next: my numbers"}
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
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`onboarding-field ${className ?? ""}`} htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
      {hint && <small className="onboarding-field__hint">{hint}</small>}
    </label>
  );
}
