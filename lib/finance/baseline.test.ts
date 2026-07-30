import { describe, expect, it } from "vitest";

import { baselineForPeriod } from "./baseline";
import type { HistoricalBaseline } from "./types";

const annualBaseline: HistoricalBaseline = {
  originalAmountCents: 36_600,
  sourcePeriod: { from: "2024-01-01", to: "2024-12-31" },
  provenance: {
    source: "pnl",
    status: "estimated",
    sourceId: "sample-pnl",
  },
  operatorConfirmed: true,
};

describe("baselineForPeriod", () => {
  it("scales a confirmed P&L baseline by exact inclusive days", () => {
    const value = baselineForPeriod(
      annualBaseline,
      { from: "2024-06-03", to: "2024-06-09" },
      "Other operating costs",
    );

    expect(value.amountCents).toBe(700);
    expect(value.provenance).toMatchObject({
      source: "pnl",
      status: "estimated",
      sourceId: "sample-pnl",
    });
  });

  it("does not silently use unconfirmed AI account classifications", () => {
    expect(() =>
      baselineForPeriod(
        { ...annualBaseline, operatorConfirmed: false },
        { from: "2024-06-03", to: "2024-06-09" },
        "Other operating costs",
      ),
    ).toThrow("classification is confirmed");
  });
});
