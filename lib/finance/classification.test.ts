import { describe, expect, it } from "vitest";

import {
  EBITDA_CATEGORY_TREATMENT,
  summarizeClassifiedPnl,
  type ClassifiedPnlAccount,
  type PnlAccountCategory,
} from "./classification";

function account(
  id: string,
  category: PnlAccountCategory,
  amountCents = 10_000,
  operatorConfirmed = true,
): ClassifiedPnlAccount {
  return {
    id,
    label: id,
    amountCents,
    category,
    operatorConfirmed,
  };
}

describe("Scott's EBITDA account-classification policy", () => {
  it("includes recurring operating income and ordinary operating buckets", () => {
    const summary = summarizeClassifiedPnl([
      account("sales", "revenue", 100_000),
      account("rebates", "recurring-operating-income", 5_000),
      account("stock", "cogs", 30_000),
      account("wages", "labour", 25_000),
      account("rent", "other-operating-cost", 20_000),
    ]);

    expect(summary).toMatchObject({
      revenueCents: 100_000,
      recurringOperatingIncomeCents: 5_000,
      cogsCents: 30_000,
      labourCents: 25_000,
      otherOperatingCostsCents: 20_000,
      excludedAccounts: [],
    });
  });

  it.each([
    "depreciation",
    "amortisation",
    "finance-interest",
    "income-tax",
    "loan-principal",
    "owner-drawings",
    "exceptional-income",
    "exceptional-expense",
  ] satisfies PnlAccountCategory[])("excludes %s", (category) => {
    expect(EBITDA_CATEGORY_TREATMENT[category]).toBe("excluded");
  });

  it("retains excluded and unconfirmed accounts for operator review", () => {
    const unconfirmedInterest = account(
      "loan interest",
      "finance-interest",
      10_000,
      false,
    );
    const summary = summarizeClassifiedPnl([unconfirmedInterest]);

    expect(summary.excludedAccounts).toEqual([unconfirmedInterest]);
    expect(summary.unconfirmedAccounts).toEqual([unconfirmedInterest]);
  });
});
