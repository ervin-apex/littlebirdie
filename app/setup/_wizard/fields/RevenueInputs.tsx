import { formatInputMoney, parseMoney } from "../money";
import { DAY_LABELS } from "../steps";
import { setDay } from "@/lib/profit";
import type { Week } from "@/lib/profit";
import { Check } from "@phosphor-icons/react";

export function RevenueInputs({ week, onChange }: { week: Week; onChange: (week: Week) => void }) {
  const isRegistered = week.gstRegistration !== "not-registered";

  return (
    <section className="daily-revenue" aria-label="Daily revenue">
      <div className="daily-input-grid">
        {week.days.map((value, index) => (
          <label key={DAY_LABELS[index]}>
            <span>{DAY_LABELS[index]}</span>
            <div>
              <i>$</i>
              <input
                className="tnum"
                inputMode="numeric"
                value={formatInputMoney(value)}
                onChange={(event) => onChange(setDay(week, index, parseMoney(event.target.value)))}
                aria-label={`${DAY_LABELS[index]} revenue`}
              />
            </div>
          </label>
        ))}
      </div>
      <div className="revenue-tax-settings">
        <fieldset>
          <legend>Registered for GST?</legend>
          <div className="setup-choice-row">
            <button
              type="button"
              className={isRegistered ? "is-active" : ""}
              aria-pressed={isRegistered}
              onClick={() =>
                onChange({
                  ...week,
                  gstRegistration: "registered-fully-taxable",
                  revenueEntryBasis: "gst-inclusive",
                })
              }
            >
              Yes
            </button>
            <button
              type="button"
              className={!isRegistered ? "is-active" : ""}
              aria-pressed={!isRegistered}
              onClick={() =>
                onChange({
                  ...week,
                  gstRegistration: "not-registered",
                  revenueEntryBasis: "gst-exclusive",
                })
              }
            >
              No
            </button>
          </div>
        </fieldset>

        {isRegistered && (
          <fieldset>
            <legend>These revenue figures…</legend>
            <div className="setup-choice-row">
              <button
                type="button"
                className={week.revenueEntryBasis === "gst-inclusive" ? "is-active" : ""}
                aria-pressed={week.revenueEntryBasis === "gst-inclusive"}
                onClick={() =>
                  onChange({ ...week, revenueEntryBasis: "gst-inclusive" })
                }
              >
                Include GST
              </button>
              <button
                type="button"
                className={week.revenueEntryBasis === "gst-exclusive" ? "is-active" : ""}
                aria-pressed={week.revenueEntryBasis === "gst-exclusive"}
                onClick={() =>
                  onChange({ ...week, revenueEntryBasis: "gst-exclusive" })
                }
              >
                Exclude GST
              </button>
            </div>
          </fieldset>
        )}
      </div>
      {isRegistered && week.revenueEntryBasis === "gst-exclusive" && (
        <p className="revenue-tax-note">
          Use this option for GST-exclusive reports or mixed taxable and GST-free sales.
        </p>
      )}
      <p className="input-confirmation">
        <span><Check weight="bold" /></span>
        Nice — your days add up.
      </p>
    </section>
  );
}
