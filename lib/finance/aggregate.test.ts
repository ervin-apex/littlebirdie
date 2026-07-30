import { describe, expect, it } from "vitest";

import { aggregateEbitdaResults } from "./aggregate";
import { calculateEbitda } from "./ebitda";
import { describeEbitdaResult } from "./presentation";
import type {
  EbitdaInputs,
  Provenance,
  ValueStatus,
} from "./types";

function provenance(
  source: Provenance["source"],
  status: ValueStatus,
): Provenance {
  return { source, status };
}

function day(
  revenueCents: number,
  revenueStatus: ValueStatus,
): EbitdaInputs {
  return {
    revenueExGst: {
      amountCents: revenueCents,
      provenance: provenance(
        revenueStatus === "forecast" ? "forecast" : "manual",
        revenueStatus,
      ),
    },
    cogsRate: {
      basisPoints: 3_000,
      provenance: provenance("pnl", "estimated"),
    },
    labour: {
      amountCents: 25_000,
      provenance: provenance(
        revenueStatus === "forecast"
          ? "roster-scheduled"
          : "timesheet-approved",
        revenueStatus === "forecast" ? "estimated" : "confirmed",
      ),
    },
    otherOperatingCosts: {
      amountCents: 20_000,
      provenance: provenance("pnl", "estimated"),
    },
    recurringOperatingIncome: {
      amountCents: 1_000,
      provenance: provenance("pnl", "estimated"),
    },
  };
}

describe("period result aggregation and presentation", () => {
  it("sums calculated days without reapplying financial formulas", () => {
    const first = calculateEbitda(day(100_000, "confirmed"));
    const second = calculateEbitda(day(120_000, "confirmed"));
    const aggregate = aggregateEbitdaResults([first, second]);

    expect(aggregate.amountCents).toBe(
      first.amountCents + second.amountCents,
    );
    expect(aggregate.components.revenueExGst.amountCents).toBe(220_000);
    expect(aggregate.components.cogs.amountCents).toBe(66_000);
    expect(aggregate.status).toBe("estimated");
  });

  it("calls a current blend of actual and future days Projected EBITDA", () => {
    const aggregate = aggregateEbitdaResults([
      calculateEbitda(day(100_000, "confirmed")),
      calculateEbitda(day(120_000, "forecast")),
    ]);

    expect(aggregate.status).toBe("forecast");
    expect(describeEbitdaResult(aggregate, "current").label).toBe(
      "Projected EBITDA",
    );
  });

  it("calls a completed result with historical baselines Estimated EBITDA", () => {
    const result = calculateEbitda(day(100_000, "confirmed"));

    expect(describeEbitdaResult(result, "completed").label).toBe(
      "Estimated EBITDA",
    );
  });

  it("never labels a future zero or non-zero result as actual", () => {
    const result = calculateEbitda(day(0, "forecast"));

    expect(describeEbitdaResult(result, "future").label).toBe(
      "Forecast EBITDA",
    );
  });
});
