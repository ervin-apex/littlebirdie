import { assertNonNegativeMoneyCents } from "./money";
import type { MoneyCents } from "./types";

export type PnlAccountCategory =
  | "revenue"
  | "recurring-operating-income"
  | "cogs"
  | "labour"
  | "other-operating-cost"
  | "depreciation"
  | "amortisation"
  | "finance-interest"
  | "income-tax"
  | "loan-principal"
  | "owner-drawings"
  | "exceptional-income"
  | "exceptional-expense";

export type EbitdaBucket =
  | "revenue"
  | "recurringOperatingIncome"
  | "cogs"
  | "labour"
  | "otherOperatingCosts"
  | "excluded";

export const EBITDA_CATEGORY_TREATMENT: Record<
  PnlAccountCategory,
  EbitdaBucket
> = {
  revenue: "revenue",
  "recurring-operating-income": "recurringOperatingIncome",
  cogs: "cogs",
  labour: "labour",
  "other-operating-cost": "otherOperatingCosts",
  depreciation: "excluded",
  amortisation: "excluded",
  "finance-interest": "excluded",
  "income-tax": "excluded",
  "loan-principal": "excluded",
  "owner-drawings": "excluded",
  "exceptional-income": "excluded",
  "exceptional-expense": "excluded",
};

export type ClassifiedPnlAccount = {
  id: string;
  label: string;
  amountCents: MoneyCents;
  category: PnlAccountCategory;
  operatorConfirmed: boolean;
};

export type PnlEbitdaSummary = {
  revenueCents: MoneyCents;
  recurringOperatingIncomeCents: MoneyCents;
  cogsCents: MoneyCents;
  labourCents: MoneyCents;
  otherOperatingCostsCents: MoneyCents;
  excludedAccounts: ClassifiedPnlAccount[];
  unconfirmedAccounts: ClassifiedPnlAccount[];
};

export function summarizeClassifiedPnl(
  accounts: readonly ClassifiedPnlAccount[],
): PnlEbitdaSummary {
  const summary: PnlEbitdaSummary = {
    revenueCents: 0,
    recurringOperatingIncomeCents: 0,
    cogsCents: 0,
    labourCents: 0,
    otherOperatingCostsCents: 0,
    excludedAccounts: [],
    unconfirmedAccounts: [],
  };

  for (const account of accounts) {
    assertNonNegativeMoneyCents(
      account.amountCents,
      `P&L account "${account.label}"`,
    );
    const bucket = EBITDA_CATEGORY_TREATMENT[account.category];

    if (!account.operatorConfirmed) {
      summary.unconfirmedAccounts.push(account);
    }

    switch (bucket) {
      case "revenue":
        summary.revenueCents += account.amountCents;
        break;
      case "recurringOperatingIncome":
        summary.recurringOperatingIncomeCents += account.amountCents;
        break;
      case "cogs":
        summary.cogsCents += account.amountCents;
        break;
      case "labour":
        summary.labourCents += account.amountCents;
        break;
      case "otherOperatingCosts":
        summary.otherOperatingCostsCents += account.amountCents;
        break;
      case "excluded":
        summary.excludedAccounts.push(account);
        break;
    }
  }

  return summary;
}
