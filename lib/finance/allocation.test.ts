import { describe, expect, it } from "vitest";

import { allocateCentsByWeights } from "./allocation";

describe("allocateCentsByWeights", () => {
  it("preserves the exact total using largest remainders", () => {
    expect(allocateCentsByWeights(100, [1, 1, 1])).toEqual([
      34, 33, 33,
    ]);
  });

  it("supports signed totals without losing a cent", () => {
    expect(allocateCentsByWeights(-100, [1, 1, 1])).toEqual([
      -34, -33, -33,
    ]);
  });

  it("does not allocate money to a zero-weight day", () => {
    expect(allocateCentsByWeights(100, [0, 1])).toEqual([0, 100]);
  });

  it("requires an explicit fallback for an all-zero forecast", () => {
    expect(() => allocateCentsByWeights(100, [0, 0])).toThrow(
      "explicit fallback",
    );
  });

  it("can preserve costs by distributing an all-zero forecast evenly", () => {
    expect(allocateCentsByWeights(5, [0, 0], "even")).toEqual([3, 2]);
  });
});
