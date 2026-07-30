/**
 * Little Birdee's canonical financial contract.
 *
 * Monetary values are integer Australian cents. Percentages are basis points:
 * 1 basis point = 0.01%, so 30% = 3_000 basis points.
 */
export type MoneyCents = number;
export type BasisPoints = number;
export type IsoDate = string;

export type ValueStatus =
  | "forecast"
  | "estimated"
  | "provisional"
  | "confirmed";

export type FinancialSource =
  | "forecast"
  | "manual"
  | "pos"
  | "pnl"
  | "allocated-budget"
  | "roster-scheduled"
  | "timesheet-worked"
  | "timesheet-approved"
  | "derived";

export type Provenance = {
  source: FinancialSource;
  status: ValueStatus;
  label?: string;
  sourceId?: string;
  updatedAt?: string;
};

export type FinancialValue = {
  amountCents: MoneyCents;
  provenance: Provenance;
};

export type RateValue = {
  basisPoints: BasisPoints;
  provenance: Provenance;
};

export type GstRegistration =
  | "not-registered"
  | "registered-fully-taxable"
  | "registered-mixed";

export type RevenueEntryBasis = "gst-inclusive" | "gst-exclusive";

export type RevenueInput = {
  enteredAmountCents: MoneyCents;
  entryBasis: RevenueEntryBasis;
  gstRegistration: GstRegistration;
  provenance: Provenance;
  gstRateBasisPoints?: BasisPoints;
};

export type NormalizedRevenue = {
  enteredAmountCents: MoneyCents;
  entryBasis: RevenueEntryBasis;
  gstRegistration: GstRegistration;
  gstAmountCents: MoneyCents | null;
  revenueExGst: FinancialValue;
};

export type DateRange = {
  from: IsoDate;
  to: IsoDate;
};

export type HistoricalBaseline = {
  originalAmountCents: MoneyCents;
  sourcePeriod: DateRange;
  provenance: Provenance;
  includedAccountIds?: string[];
  excludedAccountIds?: string[];
  operatorConfirmed: boolean;
};

export type EbitdaInputs = {
  revenueExGst: FinancialValue;
  cogsRate: RateValue;
  labour: FinancialValue;
  otherOperatingCosts: FinancialValue;
  recurringOperatingIncome: FinancialValue;
};

export type EbitdaComponents = {
  revenueExGst: FinancialValue;
  recurringOperatingIncome: FinancialValue;
  cogs: FinancialValue;
  labour: FinancialValue;
  otherOperatingCosts: FinancialValue;
};

export type EbitdaResult = {
  amountCents: MoneyCents;
  status: ValueStatus;
  components: EbitdaComponents;
};

export type PeriodPosition = "completed" | "current" | "future";

export type EbitdaPresentation = {
  label:
    | "Forecast EBITDA"
    | "Projected EBITDA"
    | "Estimated EBITDA"
    | "Provisional EBITDA"
    | "Confirmed EBITDA";
  explanation: string;
};

export type AmountAdjustment =
  | { kind: "amount"; amountCents: MoneyCents }
  | { kind: "percentage"; basisPoints: BasisPoints };

export type EbitdaScenarioAdjustments = {
  revenue?: AmountAdjustment;
  labour?: AmountAdjustment;
  otherOperatingCosts?: AmountAdjustment;
  recurringOperatingIncome?: AmountAdjustment;
  cogsRateBasisPoints?: BasisPoints;
};
