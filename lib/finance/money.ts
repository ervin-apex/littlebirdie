import type { BasisPoints, MoneyCents } from "./types";

export const BASIS_POINTS_SCALE = 10_000;
export const AUSTRALIAN_GST_BASIS_POINTS = 1_000;

export function assertMoneyCents(
  value: number,
  label = "Money value",
): asserts value is MoneyCents {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError(`${label} must be an integer number of cents.`);
  }
}
export function assertNonNegativeMoneyCents(
  value: number,
  label = "Money value",
): asserts value is MoneyCents {
  assertMoneyCents(value, label);
  if (value < 0) {
    throw new RangeError(`${label} must not be negative.`);
  }
}

export function assertBasisPoints(
  value: number,
  label = "Rate",
  options: { min?: number; max?: number } = {},
): asserts value is BasisPoints {
  const min = options.min ?? 0;
  const max = options.max ?? BASIS_POINTS_SCALE;

  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new RangeError(
      `${label} must be an integer between ${min} and ${max} basis points.`,
    );
  }
}

export function percentageOf(
  amountCents: MoneyCents,
  basisPoints: BasisPoints,
): MoneyCents {
  assertMoneyCents(amountCents);
  assertBasisPoints(basisPoints);
  return Math.round((amountCents * basisPoints) / BASIS_POINTS_SCALE);
}
