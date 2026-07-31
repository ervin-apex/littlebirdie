import { describe, expect, it } from "vitest";
import {
  eligibleDailyDates,
  isIsoDate,
  isoDateAtIndex,
  missingPastDailyRevenueDates,
  revenueToCents,
} from "./daily-actual";

describe("daily actual input contract", () => {
  it("accepts zero revenue as a completed value", () => {
    expect(revenueToCents(0)).toBe(0);
  });

  it("rounds valid revenue to integer cents", () => {
    expect(revenueToCents(123.456)).toBe(12346);
  });

  it("rejects missing, negative, non-finite, and implausibly large values", () => {
    expect(revenueToCents(undefined)).toBeNull();
    expect(revenueToCents(-1)).toBeNull();
    expect(revenueToCents(Number.NaN)).toBeNull();
    expect(revenueToCents(10_000_001)).toBeNull();
  });

  it("validates real ISO calendar dates", () => {
    expect(isIsoDate("2026-07-30")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("30/07/2026")).toBe(false);
  });

  it("allows only dates through the venue-local current day", () => {
    expect(eligibleDailyDates("2026-07-27", "2026-07-29")).toEqual([
      "2026-07-27",
      "2026-07-28",
      "2026-07-29",
    ]);
    expect(isoDateAtIndex("2026-07-27", 6)).toBe("2026-08-02");
  });

  it("prompts only for missing past days, never today or future days", () => {
    const actuals = [{ rev: 100 }, null, null, null, null, null, null];
    expect(
      missingPastDailyRevenueDates("2026-07-27", "2026-07-30", actuals),
    ).toEqual(["2026-07-28", "2026-07-29"]);
  });

  it("returns no prompt when every past day has revenue", () => {
    const actuals = [{ rev: 100 }, { rev: 0 }, { rev: 250 }];
    expect(
      missingPastDailyRevenueDates("2026-07-27", "2026-07-30", actuals),
    ).toEqual([]);
  });
});
