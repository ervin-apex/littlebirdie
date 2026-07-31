import { describe, expect, it } from "vitest";

import {
  DEFAULTS,
  breakevenRevenue,
  buildPeriodView,
  dailyLedger,
  forecastActuals,
  periodHeadlineProfit,
  profit,
  weekDateLabel,
  weekStatus,
  type Week,
} from "./profit";

function week(overrides: Partial<Week> = {}): Week {
  return {
    ...DEFAULTS,
    rev: 11_000,
    lab: 2_500,
    fix: 2_000,
    cogs: 30,
    days: [11_000, 0, 0, 0, 0, 0, 0],
    recurringIncome: 0,
    gstRegistration: "registered-fully-taxable",
    revenueEntryBasis: "gst-inclusive",
    ...overrides,
  };
}

describe("legacy screen model on the Group 0 engine", () => {
  it("applies historical COGS to GST-exclusive revenue", () => {
    expect(profit(week())).toBe(2_500);
  });

  it("produces the same EBITDA from economically equivalent revenue entry bases", () => {
    const inclusive = profit(week());
    const exclusive = profit(
      week({
        rev: 10_000,
        days: [10_000, 0, 0, 0, 0, 0, 0],
        revenueEntryBasis: "gst-exclusive",
      }),
    );
    const notRegistered = profit(
      week({
        rev: 10_000,
        days: [10_000, 0, 0, 0, 0, 0, 0],
        gstRegistration: "not-registered",
        revenueEntryBasis: "gst-exclusive",
      }),
    );

    expect(exclusive).toBe(inclusive);
    expect(notRegistered).toBe(inclusive);
  });

  it("includes recurring operating other income", () => {
    expect(profit(week({ recurringIncome: 100 }))).toBe(2_600);
  });

  it("keeps completed-day results estimated while P&L baselines are historical", () => {
    const [row] = dailyLedger(week(), {
      todayIndex: 1,
      actuals: [
        {
          rev: 11_000,
          lab: 2_500,
          revenueSource: "manual",
          revenueStatus: "confirmed",
          labourSource: "allocated-budget",
          labourStatus: "estimated",
          revision: 1,
          snapshot: {
            rev: 11_000,
            lab: 2_500,
            fix: 2_000,
            otherIncome: 0,
            cogs: 30,
            gstRegistration: "registered-fully-taxable",
            revenueEntryBasis: "gst-inclusive",
          },
        },
        null,
        null,
        null,
        null,
        null,
        null,
      ],
    });

    expect(row.actual?.cogs).toBe(3_000);
    expect(row.actual?.net).toBe(2_500);
    expect(row.actual?.resultStatus).toBe("estimated");
  });

  it("keeps an actual day's original plan comparison after the weekly plan changes", () => {
    const [row] = dailyLedger(
      week({
        rev: 22_000,
        days: [22_000, 0, 0, 0, 0, 0, 0],
        lab: 4_000,
      }),
      {
        todayIndex: 1,
        actuals: [{
          rev: 12_000,
          lab: 2_500,
          revenueSource: "manual",
          revenueStatus: "confirmed",
          labourSource: "allocated-budget",
          labourStatus: "estimated",
          revision: 2,
          snapshot: {
            rev: 11_000,
            lab: 2_500,
            fix: 2_000,
            otherIncome: 0,
            cogs: 30,
            gstRegistration: "registered-fully-taxable",
            revenueEntryBasis: "gst-inclusive",
          },
        }, null, null, null, null, null, null],
      },
    );

    expect(row.predicted.rev).toBe(11_000);
    expect(row.variance?.rev).toBe(1_000);
    expect(row.variance?.lab).toBe(0);
    expect(row.variance?.driver).toBe("revenue");
  });

  it("does not lose labour or other costs in an all-zero forecast week", () => {
    const rows = dailyLedger(
      week({
        rev: 0,
        days: [0, 0, 0, 0, 0, 0, 0],
        lab: 700,
        fix: 1_400,
      }),
      { todayIndex: -1, actuals: Array(7).fill(null) },
    );

    expect(
      rows.reduce((sum, row) => sum + row.predicted.lab, 0),
    ).toBe(700);
    expect(
      rows.reduce((sum, row) => sum + row.predicted.fix, 0),
    ).toBe(1_400);
  });

  it("returns break-even revenue in the operator's entered revenue basis", () => {
    const base = week();
    const revenue = breakevenRevenue(base, base.lab, base.fix);

    expect(profit({ ...base, rev: revenue })).toBe(0);
  });
});

describe("dashboard period presentation", () => {
  it("shows the saved week dates instead of the retired demo dates", () => {
    const view = buildPeriodView(
      "this-week",
      week(),
      forecastActuals(),
      "2026-07-27",
    );

    expect(view.dateLabel).toBe("Mon 27 Jul to Sun 2 Aug");
    expect(weekDateLabel("2026-08-03")).toBe("Mon 3 to Sun 9 Aug");
  });

  it("uses projected EBITDA for an unfinished current week", () => {
    const plan = week({
      rev: 11_000,
      lab: 2_000,
      fix: 1_500,
      days: [1_000, 1_000, 1_000, 1_000, 2_000, 3_000, 2_000],
    });
    const actuals = forecastActuals();
    const status = weekStatus(plan, actuals);

    expect(Math.round(status.projectedNet)).toBe(3_500);
    expect(
      Math.round(periodHeadlineProfit({
        scope: "week",
        isFuture: false,
        projectedNet: status.projectedNet,
        predictedNet: status.predictedNet,
        historyActualNet: 0,
      })),
    ).toBe(3_500);
  });
});
