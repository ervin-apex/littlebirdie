import { describe, expect, it } from "vitest";

import { normalizeRevenue } from "./revenue";
import type { Provenance, RevenueInput } from "./types";

const manualActual: Provenance = {
  source: "manual",
  status: "confirmed",
  label: "Revenue entered by the operator",
};

function revenueInput(
  overrides: Partial<RevenueInput> = {},
): RevenueInput {
  return {
    enteredAmountCents: 110_000,
    entryBasis: "gst-inclusive",
    gstRegistration: "registered-fully-taxable",
    provenance: manualActual,
    ...overrides,
  };
}

describe("normalizeRevenue", () => {
  it("normalizes fully taxable GST-inclusive revenue once at the boundary", () => {
    const result = normalizeRevenue(revenueInput());

    expect(result.revenueExGst.amountCents).toBe(100_000);
    expect(result.gstAmountCents).toBe(10_000);
    expect(result.revenueExGst.provenance).toBe(manualActual);
  });

  it("keeps GST-exclusive revenue unchanged", () => {
    const result = normalizeRevenue(
      revenueInput({
        enteredAmountCents: 100_000,
        entryBasis: "gst-exclusive",
      }),
    );

    expect(result.revenueExGst.amountCents).toBe(100_000);
    expect(result.gstAmountCents).toBe(10_000);
  });

  it("does not remove GST for a business that is not registered", () => {
    const result = normalizeRevenue(
      revenueInput({
        gstRegistration: "not-registered",
        entryBasis: "gst-exclusive",
      }),
    );

    expect(result.revenueExGst.amountCents).toBe(110_000);
    expect(result.gstAmountCents).toBe(0);
  });

  it("accepts mixed sales only when the operator supplies GST-exclusive revenue", () => {
    const result = normalizeRevenue(
      revenueInput({
        enteredAmountCents: 100_000,
        gstRegistration: "registered-mixed",
        entryBasis: "gst-exclusive",
      }),
    );

    expect(result.revenueExGst.amountCents).toBe(100_000);
    expect(result.gstAmountCents).toBeNull();
  });

  it("rejects GST-inclusive mixed sales", () => {
    expect(() =>
      normalizeRevenue(
        revenueInput({ gstRegistration: "registered-mixed" }),
      ),
    ).toThrow("must be entered GST-exclusive");
  });

  it("rejects a GST-inclusive basis for a non-registered business", () => {
    expect(() =>
      normalizeRevenue(
        revenueInput({ gstRegistration: "not-registered" }),
      ),
    ).toThrow("not GST-registered");
  });
});
