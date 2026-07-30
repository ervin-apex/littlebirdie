import type {
  DateRange,
  FinancialValue,
  RevenueInput,
} from "./types";

export type FinancialProviderQuery = {
  businessId: string;
  venueId: string;
  period: DateRange;
  timeZone: string;
};

/**
 * POS-specific adapters normalize their response into the revenue boundary.
 * Manual entry uses the same RevenueInput contract without a provider.
 */
export interface RevenueActualProvider {
  readonly providerId: string;
  getRevenueActual(
    query: FinancialProviderQuery,
  ): Promise<RevenueInput | null>;
}
/**
 * Rostering adapters must label scheduled cost as estimated, worked cost as
 * provisional, and approved cost as confirmed. The provider is responsible for
 * documenting whether its amount includes Little Birdee's required on-costs.
 */
export interface LabourActualProvider {
  readonly providerId: string;
  getLabourActual(
    query: FinancialProviderQuery,
  ): Promise<FinancialValue | null>;
}
