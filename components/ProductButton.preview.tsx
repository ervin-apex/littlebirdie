"use client";

import { ArrowRight, Check, Warning } from "@phosphor-icons/react";
import { ProductButton } from "@/components/ProductButton";

const states = [
  { label: "Default", button: <ProductButton variant="primary" trailingIcon={<ArrowRight />}>Continue</ProductButton> },
  { label: "Hover", button: <ProductButton variant="primary" className="is-hover" trailingIcon={<ArrowRight />}>Continue</ProductButton> },
  { label: "Focus", button: <ProductButton variant="primary" className="is-focus" trailingIcon={<ArrowRight />}>Continue</ProductButton> },
  { label: "Active", button: <ProductButton variant="primary" className="is-active" trailingIcon={<ArrowRight />}>Continue</ProductButton> },
  { label: "Disabled", button: <ProductButton variant="primary" disabled trailingIcon={<ArrowRight />}>Continue</ProductButton> },
  { label: "Loading", button: <ProductButton variant="primary" state="loading">Saving numbers</ProductButton> },
  { label: "Error", button: <ProductButton variant="primary" state="error" leadingIcon={<Warning />}>Try again</ProductButton> },
  { label: "Success", button: <ProductButton variant="primary" state="success" leadingIcon={<Check />}>Numbers saved</ProductButton> },
] as const;

export function ProductButtonPreview() {
  return (
    <section className="mx-auto grid max-w-3xl gap-3 rounded-3xl bg-white p-8 shadow-sm" aria-label="Little Birdee button states">
      <header className="mb-3">
        <p className="text-sm font-semibold text-ink/55">Component preview</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">Product button</h1>
      </header>
      {states.map((state) => (
        <div key={state.label} className="grid min-h-16 grid-cols-[100px_1fr] items-center gap-6 border-t border-black/5 pt-3">
          <span className="text-sm font-semibold text-ink/55">{state.label}</span>
          <div>{state.button}</div>
        </div>
      ))}
    </section>
  );
}
