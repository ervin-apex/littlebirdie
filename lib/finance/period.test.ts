import { describe, expect, it } from "vitest";

import {
  calendarMonthRange,
  inclusiveDayCount,
  scalePeriodAmount,
} from "./period";

describe("financial periods", () => {
  it("counts exact inclusive days across a leap year", () => {
    expect(
      inclusiveDayCount({ from: "2024-01-01", to: "2024-12-31" }),
    ).toBe(366);
  });

  it("normalizes source-period money by exact days", () => {
    expect(
      scalePeriodAmount(
        36_600,
        { from: "2024-01-01", to: "2024-12-31" },
        { from: "2024-06-03", to: "2024-06-09" },
      ),
    ).toBe(700);
  });

  it("treats Month as a calendar month", () => {
    const range = calendarMonthRange(2024, 2);

    expect(range).toEqual({
      from: "2024-02-01",
      to: "2024-02-29",
    });
    expect(inclusiveDayCount(range)).toBe(29);
  });

  it("rejects impossible dates and reversed periods", () => {
    expect(() =>
      inclusiveDayCount({ from: "2024-02-30", to: "2024-03-01" }),
    ).toThrow("Invalid calendar date");
    expect(() =>
      inclusiveDayCount({ from: "2024-03-02", to: "2024-03-01" }),
    ).toThrow("must not be before");
  });
});
