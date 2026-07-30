import { describe, expect, it } from "vitest";
import { actualsFromRevisions, currentMondayIso, weekToPlanPayload } from "./week-record";
import { DEFAULTS } from "../profit";

describe("venue week persistence mapping", () => {
  it("uses the Sydney calendar week and returns its Monday", () => {
    expect(currentMondayIso(new Date("2026-07-28T13:00:00Z"))).toBe("2026-07-27");
  });

  it("preserves exact weekly cents across daily allocations", () => {
    const payload = weekToPlanPayload(
      { ...DEFAULTS, lab: 100.01, fix: 70.03, recurringIncome: 10.02 },
      "venue-id",
      "2026-07-27",
    );

    expect(payload.p_days.reduce((sum, day) => sum + day.planned_labour_cents, 0)).toBe(10001);
    expect(payload.p_days.reduce((sum, day) => sum + day.planned_other_operating_costs_cents, 0)).toBe(7003);
    expect(payload.p_days.reduce((sum, day) => sum + day.planned_recurring_operating_income_cents, 0)).toBe(1002);
  });

  it("uses planned values only for the missing half of a hybrid actual", () => {
    const days = [{
      id: "day-1",
      service_date: "2026-07-27",
      day_index: 0,
      planned_revenue_cents: 100000,
      planned_labour_cents: 25000,
    }];
    const result = actualsFromRevisions(days, [{
      service_date: "2026-07-27",
      revision: 1,
      entered_revenue_cents: 120000,
      labour_cents: null,
    }]);

    expect(result.actuals[0]).toEqual({ rev: 1200, lab: 250 });
  });
});
