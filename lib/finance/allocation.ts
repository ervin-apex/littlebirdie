import { assertMoneyCents } from "./money";
import type { MoneyCents } from "./types";

export type ZeroWeightFallback = "error" | "even";

/**
 * Allocates integer cents using largest remainders, preserving the exact total.
 * Zero weights must be handled explicitly so real costs can never disappear.
 */
export function allocateCentsByWeights(
  totalCents: MoneyCents,
  weights: readonly number[],
  zeroWeightFallback: ZeroWeightFallback = "error",
): MoneyCents[] {
  assertMoneyCents(totalCents, "Allocation total");

  if (weights.length === 0) {
    throw new Error("At least one allocation weight is required.");
  }
  if (
    weights.some(
      (weight) => !Number.isFinite(weight) || weight < 0,
    )
  ) {
    throw new RangeError(
      "Allocation weights must be finite, non-negative numbers.",
    );
  }

  let effectiveWeights = [...weights];
  let weightTotal = effectiveWeights.reduce(
    (sum, weight) => sum + weight,
    0,
  );

  if (weightTotal === 0) {
    if (zeroWeightFallback === "error") {
      throw new Error(
        "Cannot allocate a non-zero financial total across zero weights without an explicit fallback.",
      );
    }
    effectiveWeights = effectiveWeights.map(() => 1);
    weightTotal = effectiveWeights.length;
  }

  const sign = Math.sign(totalCents) || 1;
  const absoluteTotal = Math.abs(totalCents);
  const rawAllocations = effectiveWeights.map(
    (weight) => (absoluteTotal * weight) / weightTotal,
  );
  const allocations = rawAllocations.map(Math.floor);
  let centsRemaining =
    absoluteTotal -
    allocations.reduce((sum, allocation) => sum + allocation, 0);

  const remainderOrder = rawAllocations
    .map((raw, index) => ({
      index,
      remainder: raw - Math.floor(raw),
    }))
    .sort(
      (left, right) =>
        right.remainder - left.remainder || left.index - right.index,
    );

  for (let index = 0; centsRemaining > 0; index += 1) {
    allocations[remainderOrder[index % remainderOrder.length].index] += 1;
    centsRemaining -= 1;
  }

  return allocations.map((allocation) => allocation * sign);
}
