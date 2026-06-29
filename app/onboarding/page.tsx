"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BackButton } from "@/components/BackButton";
import { StepVisual } from "@/components/StepVisual";
import { assetPath } from "@/lib/site";
import {
  CURRENCIES,
  DEFAULT_BUSINESS,
  INDUSTRIES,
  loadBusiness,
  saveBusiness,
  type Business,
} from "@/lib/business";

/**
 * First onboarding step (round 2): tell Little Birdee about the business.
 * Name, industry, currency and whether prices are GST-inclusive. On continue we
 * save the profile and send the user to their home hub, where they're prompted
 * to enter their numbers next.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const [biz, setBiz] = useState<Business>(DEFAULT_BUSINESS);

  // Pre-fill if they've onboarded before.
  useEffect(() => {
    const saved = loadBusiness();
    if (saved) setBiz(saved);
  }, []);

  const set = <K extends keyof Business>(k: K, v: Business[K]) =>
    setBiz((b) => ({ ...b, [k]: v }));

  const canContinue = biz.name.trim().length > 0;

  const onContinue = () => {
    if (!canContinue) return;
    saveBusiness({ ...biz, name: biz.name.trim() });
    router.push("/home");
  };

  return (
    <AppShell maxWidth="max-w-xl" hideHeader>
      <div className="fade-up flex min-h-0 flex-1 flex-col">
        <BackButton to="/" />

        <div className="flex flex-col items-center text-center">
          <StepVisual src={assetPath("/brand/step-business.png")} size={104} />
          <h1 className="mt-2 font-display text-[22px] font-semibold leading-snug tracking-tight text-ink">
            Tell Little Birdee about your business
          </h1>
          <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink/65">
            A few quick details so your numbers are set up right.
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <Field label="Business name">
            <input
              type="text"
              value={biz.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Crema Café"
              autoFocus
              className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 font-display text-[15px] text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-amber-400"
            />
          </Field>

          <Field label="Industry">
            <Select
              value={biz.industry}
              onChange={(v) => set("industry", v)}
              options={INDUSTRIES.map((i) => ({ value: i, label: i }))}
            />
          </Field>

          <Field label="Currency">
            <Select
              value={biz.currency}
              onChange={(v) => set("currency", v)}
              options={CURRENCIES.map((c) => ({ value: c.code, label: c.label }))}
            />
          </Field>

          <div className="flex items-center justify-between rounded-xl border border-black/10 bg-white px-3.5 py-2.5">
            <div className="pr-3">
              <div className="font-display text-[14px] font-medium text-ink">
                GST included in my prices
              </div>
              <div className="mt-0.5 text-[12px] leading-snug text-ink/55">
                Turn on if the prices you charge already include GST.
              </div>
            </div>
            <Toggle
              on={biz.gstIncluded}
              onChange={(v) => set("gstIncluded", v)}
              label="GST included in my prices"
            />
          </div>
        </div>

        <div className="min-h-4 flex-1" />

        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="mt-4 w-full rounded-xl bg-amber-400 py-3 font-display text-[15px] font-semibold text-amber-950 transition hover:bg-amber-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-amber-200 disabled:text-amber-800/50"
        >
          Continue
        </button>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink/70">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none rounded-xl border border-black/10 bg-white px-3.5 py-3 font-display text-[15px] text-ink outline-none transition-colors focus:border-amber-400"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
        on ? "bg-amber-400" : "bg-black/15"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
