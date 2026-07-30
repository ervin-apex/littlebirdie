import { describe, expect, it } from "vitest";

import {
  calculateBreakEvenRevenueExGst,
  calculateEbitda,
} from "./ebitda";
import type {
  EbitdaInputs,
  FinancialValue,
  Provenance,
  RateValue,
  ValueStatus,
} from "./types";

function provenance(
  source: Provenance["source"],
  status: ValueStatus,
): Provenance {
  return { source, status };
}

function value(
  amountCents: number,
  source: Provenance["source"],
  status: ValueStatus,
): FinancialValue {
  return { amountCents, provenance: provenance(source, status) };
}

const historicalCogsRate: RateValue = {
  basisPoints: 3_000,
  provenance: provenance("pnl", "estimated"),
};

function inputs(overrides: Partial<EbitdaInputs> = {}): EbitdaInputs {
  return {
    revenueExGst: value(1_000_000, "manual", "confirmed"),
    cogsRate: historicalCogsRate,
    labour: value(250_000, "timesheet-approved", "confirmed"),
    otherOperatingCosts: value(200_000, "pnl", "estimated"),
    recurringOperatingIncome: value(10_000, "pnl", "estimated"),
    ...overrides,
  };
}

describe("calculateEbitda", () => {
  it("uses Scott's EBITDA boundary", () => {
    const result = calculateEbitda(inputs());

    expect(result.components.cogs.amountCents).toBe(300_000);
    expect(result.amountCents).toBe(260_000);
  });

  it("remains estimated when revenue and labour are actual but baselines are historical", () => {
    const result = calculateEbitda(inputs());

    expect(result.status).toBe("estimated");
    expect(result.components.revenueExGst.provenance.status).toBe(
      "confirmed",
    );
    expect(result.components.labour.provenance.status).toBe("confirmed");
    expect(result.components.cogs.provenance.status).toBe("estimated");
  });

  it("is a forecast when the selected period still contains forecast inputs", () => {
    const result = calculateEbitda(
      inputs({
        revenueExGst: value(1_000_000, "forecast", "forecast"),
      }),
    );

    expect(result.status).toBe("forecast");
  });

  it("can produce a confirmed result only when every component is confirmed", () => {
    const result = calculateEbitda(
      inputs({
        cogsRate: {
          basisPoints: 3_000,
          provenance: provenance("manual", "confirmed"),
        },
        otherOperatingCosts: value(
          200_000,
          "manual",
          "confirmed",
        ),
        recurringOperatingIncome: value(
          10_000,
          "manual",
          "confirmed",
        ),
      }),
    );

    expect(result.status).toBe("confirmed");
  });
});
describe("calculateBreakEvenRevenueExGst", () => {
  it("reconciles the returned GST-exclusive revenue to zero EBITDA", () => {
    const breakEvenRevenue = calculateBreakEvenRevenueExGst(
      historicalCogsRate,
      250_000,
      200_000,
      10_000,
    );
    const result = calculateEbitda(
      inputs({
        revenueExGst: value(
          breakEvenRevenue,
          "derived",
          "estimated",
        ),
      }),
    );

    expect(breakEvenRevenue).toBe(628_572);
    expect(result.amountCents).toBe(0);
  });
});
