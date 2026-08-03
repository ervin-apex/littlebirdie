import { describe, expect, it } from "vitest";
import { canOpenVenueFinancialRecords } from "./venue-access";

describe("venue financial access", () => {
  it("allows the first setup before a venue has locked a plan", () => {
    expect(canOpenVenueFinancialRecords({
      enforcementEnabled: true,
      canUseProduct: false,
      canStartInitialSetup: true,
    })).toBe(true);
  });

  it("requires paid access after initial setup closes", () => {
    expect(canOpenVenueFinancialRecords({
      enforcementEnabled: true,
      canUseProduct: false,
      canStartInitialSetup: false,
    })).toBe(false);
  });

  it("allows an entitled business and disabled enforcement", () => {
    expect(canOpenVenueFinancialRecords({
      enforcementEnabled: true,
      canUseProduct: true,
      canStartInitialSetup: false,
    })).toBe(true);
    expect(canOpenVenueFinancialRecords({
      enforcementEnabled: false,
      canUseProduct: false,
      canStartInitialSetup: false,
    })).toBe(true);
  });
});
