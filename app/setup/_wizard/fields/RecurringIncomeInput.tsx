import { formatInputMoney, parseMoney } from "../money";
import { money } from "@/lib/profit";
import type { Week } from "@/lib/profit";
import { Check } from "@phosphor-icons/react";

export function RecurringIncomeInput({
  week,
  onChange,
}: {
  week: Week;
  onChange: (week: Week) => void;
}) {
  const hasIncome = week.recurringIncome > 0;
  return (
    <section className="single-input-panel recurring-income-panel">
      <label htmlFor="setup-income">Weekly recurring income</label>
      <div className="single-money-input">
        <span>$</span>
        <input
          id="setup-income"
          className="tnum"
          inputMode="decimal"
          value={formatInputMoney(week.recurringIncome)}
          onChange={(event) => {
            const recurringIncome = parseMoney(event.target.value);
            onChange({
              ...week,
              recurringIncome,
              recurringIncomeConfirmed: recurringIncome > 0,
            });
          }}
        />
      </div>
      {!hasIncome && (
        <label className="income-zero-confirmation">
          <input
            type="checkbox"
            checked={Boolean(week.recurringIncomeConfirmed)}
            onChange={(event) =>
              onChange({
                ...week,
                recurringIncomeConfirmed: event.target.checked,
              })}
          />
          <span>
            <strong>We do not have recurring other income.</strong>
            <small>Confirm this so Birdee knows zero is intentional.</small>
          </span>
        </label>
      )}
      <p className="input-confirmation">
        <span><Check weight="bold" /></span>
        {hasIncome
          ? "Got it — this will be added to weekly EBITDA."
          : week.recurringIncomeConfirmed
            ? "Confirmed — no recurring other income."
            : "Confirm zero before Birdee saves the budget."}
      </p>
    </section>
  );
}
