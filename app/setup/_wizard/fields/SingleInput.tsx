import { formatInputMoney, parseMoney } from "../money";
import { money } from "@/lib/profit";
import type { Week } from "@/lib/profit";
import type { SetupStepKey } from "@/lib/venues/setup-navigation";
import { Check } from "@phosphor-icons/react";

export function SingleInput({
  step,
  week,
  onChange,
}: {
  step: Exclude<SetupStepKey, "venue" | "revenue" | "income">;
  week: Week;
  onChange: (week: Week) => void;
}) {
  const config = step === "wages"
    ? {
        label: "Weekly wages",
        key: "lab" as const,
        prefix: "$",
        suffix: "",
        min: 0,
        max: 100000,
        confirmation: "Nice — wages are sorted.",
      }
    : step === "cogs"
      ? {
          label: "Cost of goods rate",
          key: "cogs" as const,
          prefix: "",
          suffix: "%",
          min: 0,
          max: 99,
          confirmation: "Got it — we’ll apply this to revenue.",
        }
      : {
          label: "Other weekly costs",
          key: "fix" as const,
          prefix: "$",
          suffix: "",
          min: 0,
          max: 100000,
          confirmation: "Nice — that’s the last number.",
        };
  const value = week[config.key];

  return (
    <section className="single-input-panel">
      <label htmlFor={`setup-${step}`}>{config.label}</label>
      <div className="single-money-input">
        {config.prefix && <span>{config.prefix}</span>}
        <input
          id={`setup-${step}`}
          className="tnum"
          inputMode="decimal"
          value={step === "cogs" ? value : formatInputMoney(value)}
          onChange={(event) => {
            const parsed = step === "cogs"
              ? Number(event.target.value.replace(/[^0-9.]/g, ""))
              : parseMoney(event.target.value);
            onChange({
              ...week,
              [config.key]: Math.max(
                config.min,
                Math.min(config.max, Number.isFinite(parsed) ? parsed : 0),
              ),
            });
          }}
        />
        {config.suffix && <span>{config.suffix}</span>}
      </div>
      <p className="input-confirmation">
        <span><Check weight="bold" /></span>
        {config.confirmation}
      </p>
    </section>
  );
}
