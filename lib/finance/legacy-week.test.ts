import { describe, expect, it } from "vitest";

import { calculateEbitda } from "./ebitda";
import { legacyWeekToEbitdaInputs } from "./legacy-week";

describe("legacy Week compatibility boundary", () => {
  it("maps the old dollar model without repeating the GST/COGS basis bug", () => {
    const inputs = legacyWeekToEbitdaInputs(
      {
        rev: 11_000,
        lab: 2_500,
        fix: 2_000,
        cogs: 30,
      },
      {
        gstRegistration: "registered-fully-taxable",
        revenueEntryBasis: "gst-inclusive",
        revenueProvenance: {
          source: "forecast",
          status: "forecast",
        },
        labourProvenance: {
          source: "allocated-budget",
          status: "estimated",
        },
        otherCostsProvenance: {
          source: "pnl",
          status: "estimated",
        },
        cogsRateProvenance: {
          source: "pnl",
          status: "estimated",
        },
      },
    );
    const result = calculateEbitda(inputs);

    expect(inputs.revenueExGst.amountCents).toBe(1_000_000);
    expect(result.components.cogs.amountCents).toBe(300_000);
    expect(result.amountCents).toBe(250_000);
    expect(result.status).toBe("forecast");
  });
});
