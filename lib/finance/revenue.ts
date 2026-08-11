import {
  AUSTRALIAN_GST_BASIS_POINTS,
  BASIS_POINTS_SCALE,
  assertBasisPoints,
  assertNonNegativeMoneyCents,
  percentageOf,
} from "./money";
import type { NormalizedRevenue, RevenueInput } from "./types";

export function normalizeRevenue(input: RevenueInput): NormalizedRevenue {
  assertNonNegativeMoneyCents(
    input.enteredAmountCents,
    "Entered actual",
  );

  const gstRateBasisPoints =
    input.gstRateBasisPoints ?? AUSTRALIAN_GST_BASIS_POINTS;
  assertBasisPoints(gstRateBasisPoints, "GST rate");

  if (
    input.gstRegistration === "not-registered" &&
    input.entryBasis === "gst-inclusive"
  ) {
    throw new Error(
      "A business that is not GST-registered cannot enter a GST-inclusive actual.",
    );
  }

  if (
    input.gstRegistration === "registered-mixed" &&
    input.entryBasis === "gst-inclusive"
  ) {
    throw new Error(
      "Mixed taxable and GST-free sales must be entered GST-exclusive.",
    );
  }

  if (input.gstRegistration === "not-registered") {
    return {
      enteredAmountCents: input.enteredAmountCents,
      entryBasis: input.entryBasis,
      gstRegistration: input.gstRegistration,
      gstAmountCents: 0,
      revenueExGst: {
        amountCents: input.enteredAmountCents,
        provenance: input.provenance,
      },
    };
  }

  if (input.entryBasis === "gst-exclusive") {
    return {
      enteredAmountCents: input.enteredAmountCents,
      entryBasis: input.entryBasis,
      gstRegistration: input.gstRegistration,
      gstAmountCents:
        input.gstRegistration === "registered-fully-taxable"
          ? percentageOf(input.enteredAmountCents, gstRateBasisPoints)
          : null,
      revenueExGst: {
        amountCents: input.enteredAmountCents,
        provenance: input.provenance,
      },
    };
  }

  const revenueExGstCents = Math.round(
    (input.enteredAmountCents * BASIS_POINTS_SCALE) /
      (BASIS_POINTS_SCALE + gstRateBasisPoints),
  );

  return {
    enteredAmountCents: input.enteredAmountCents,
    entryBasis: input.entryBasis,
    gstRegistration: input.gstRegistration,
    gstAmountCents: input.enteredAmountCents - revenueExGstCents,
    revenueExGst: {
      amountCents: revenueExGstCents,
      provenance: input.provenance,
    },
  };
}
