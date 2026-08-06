import { describe, expect, it } from "vitest";
import { buildChirpContent } from "./content";
import type { ChirpSource } from "./types";

const base: ChirpSource = {
  deliveryId: "delivery-1",
  preferenceId: "preference-1",
  venueId: "venue-1",
  venueName: "Newtown",
  businessName: "North Star Café",
  userId: "user-1",
  recipientEmail: "operator@example.com",
  recipientName: "Ervin",
  serviceDate: "2026-08-03",
  planDay: {
    plannedRevenueCents: 220_000,
    plannedLabourCents: 52_000,
    plannedOtherOperatingCostsCents: 44_000,
    plannedRecurringOperatingIncomeCents: 0,
    cogsRateBasisPoints: 3_000,
    gstRegistration: "registered-fully-taxable",
    revenueEntryBasis: "gst-inclusive",
  },
  actual: null,
};

describe("buildChirpContent", () => {
  it("asks for setup when no locked plan covers the date", () => {
    const content = buildChirpContent({ ...base, planDay: null });
    expect(content.kind).toBe("setup_needed");
    expect(content.destination).toBe("setup");
    expect(content.dateLabel).toBe("Monday, 3 August");
    expect(content.subject).not.toContain("Newtown");
  });

  it("asks for exactly one revenue number when yesterday is missing", () => {
    const content = buildChirpContent(base);
    expect(content.kind).toBe("revenue_needed");
    expect(content.destination).toBe("check-in");
    expect(content.assumptionNote).toContain("Labour remains an estimate");
  });

  it("calculates the same estimated EBITDA contract used by the app", () => {
    const content = buildChirpContent({
      ...base,
      actual: {
        enteredRevenueCents: 220_000,
        labourCents: null,
        revenueSource: "manual",
        revenueStatus: "confirmed",
        labourSource: null,
        labourStatus: null,
        revenueEntryBasis: "gst-inclusive",
        gstRegistration: "registered-fully-taxable",
        cogsRateBasisPoints: 3_000,
        otherOperatingCostsCents: 44_000,
        recurringOperatingIncomeCents: 0,
      },
    });

    expect(content.kind).toBe("estimated_result");
    expect(content.amountCents).toBe(44_000);
    expect(content.amountLabel).toBe("+$440 EBITDA");
    expect(content.heading).toBe("Your estimated profit");
    expect(content.intro).toBe("Newtown finished on budget.");
    expect(content.ctaLabel).toBe("See Monday’s numbers");
    expect(content.subject).not.toContain("$440");
    expect(content.assumptionNote).toContain("Labour and other costs");
  });

  it("treats zero revenue as an entered actual, not a missing value", () => {
    const content = buildChirpContent({
      ...base,
      actual: {
        enteredRevenueCents: 0,
        labourCents: null,
        revenueSource: "manual",
        revenueStatus: "confirmed",
        labourSource: null,
        labourStatus: null,
        revenueEntryBasis: "gst-inclusive",
        gstRegistration: "registered-fully-taxable",
        cogsRateBasisPoints: 3_000,
        otherOperatingCostsCents: 44_000,
        recurringOperatingIncomeCents: 0,
      },
    });
    expect(content.kind).toBe("estimated_result");
    expect(content.amountCents).toBe(-96_000);
  });
});
