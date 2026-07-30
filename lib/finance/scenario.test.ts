import { describe, expect, it } from "vitest";

import { applyEbitdaScenario } from "./scenario";
import type { EbitdaInputs, Provenance } from "./types";

const estimatedPnl: Provenance = {
  source: "pnl",
  status: "estimated",
};

const base: EbitdaInputs = {
  revenueExGst: {
    amountCents: 1_000_000,
    provenance: { source: "forecast", status: "forecast" },
  },
  cogsRate: { basisPoints: 3_000, provenance: estimatedPnl },
  labour: {
    amountCents: 250_000,
    provenance: { source: "roster-scheduled", status: "estimated" },
  },
  otherOperatingCosts: {
    amountCents: 200_000,
    provenance: estimatedPnl,
  },
  recurringOperatingIncome: {
    amountCents: 10_000,
    provenance: estimatedPnl,
  },
};

describe("applyEbitdaScenario", () => {
  it("applies dollar adjustments once to the whole selected period", () => {
    const result = applyEbitdaScenario(base, {
      revenue: { kind: "amount", amountCents: 10_000 },
      labour: { kind: "amount", amountCents: -5_000 },
    });

    expect(result.revenueExGst.amountCents).toBe(1_010_000);
    expect(result.labour.amountCents).toBe(245_000);
  });

  it("supports percentage adjustments and COGS point changes", () => {
    const result = applyEbitdaScenario(base, {
      revenue: { kind: "percentage", basisPoints: 1_000 },
      cogsRateBasisPoints: -100,
    });

    expect(result.revenueExGst.amountCents).toBe(1_100_000);
    expect(result.cogsRate.basisPoints).toBe(2_900);
  });

  it("never lets a scenario turn a cost or revenue negative", () => {
    const result = applyEbitdaScenario(base, {
      labour: { kind: "amount", amountCents: -999_999 },
    });

    expect(result.labour.amountCents).toBe(0);
  });
});
