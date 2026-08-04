import { describe, expect, it } from "vitest";
import {
  dashboardAttentionPrompt,
  dashboardPromptStorageKey,
  formatLongDate,
  formatWeekRange,
  mondayForIsoDate,
  type DashboardAttentionTask,
} from "./attention";

const dailyTask: DashboardAttentionTask = {
  date: "2026-08-05",
  dayIndex: 2,
  dayName: "Wednesday",
  missingCount: 1,
};

describe("dashboardAttentionPrompt", () => {
  it("prioritises a new-week review over stale daily tasks", () => {
    expect(dashboardAttentionPrompt({
      venueId: "venue-1",
      weekStart: "2026-07-27",
      currentDate: "2026-08-04",
      periodKey: "this-week",
      dailyTask,
    })).toEqual({
      kind: "weekly",
      signature: "venue-1:weekly:2026-08-03",
      targetWeekStart: "2026-08-03",
    });
  });

  it("offers the latest missing daily revenue when the plan is current", () => {
    expect(dashboardAttentionPrompt({
      venueId: "venue-1",
      weekStart: "2026-08-03",
      currentDate: "2026-08-06",
      periodKey: "this-week",
      dailyTask,
    })).toEqual({
      kind: "daily",
      signature: "venue-1:daily:2026-08-05",
      task: dailyTask,
    });
  });

  it("does not interrupt other reporting periods", () => {
    expect(dashboardAttentionPrompt({
      venueId: "venue-1",
      weekStart: "2026-08-03",
      currentDate: "2026-08-06",
      periodKey: "last-week",
      dailyTask,
    })).toBeNull();
  });

  it("stays quiet when the current week has no missing daily revenue", () => {
    expect(dashboardAttentionPrompt({
      venueId: "venue-1",
      weekStart: "2026-08-03",
      currentDate: "2026-08-06",
      periodKey: "this-week",
      dailyTask: null,
    })).toBeNull();
  });
});

describe("dashboard attention dates and storage", () => {
  it("finds the current Monday from any day in the week", () => {
    expect(mondayForIsoDate("2026-08-03")).toBe("2026-08-03");
    expect(mondayForIsoDate("2026-08-09")).toBe("2026-08-03");
  });

  it("formats the date language used by the prompt", () => {
    expect(formatWeekRange("2026-08-03")).toBe("Mon 3 Aug – Sun 9 Aug");
    expect(formatLongDate("2026-08-05")).toBe("Wednesday 5 August");
  });

  it("scopes dismissal to the exact venue and prompt signature", () => {
    expect(dashboardPromptStorageKey("hidden", "venue-1:daily:2026-08-05"))
      .toBe("little-birdee:dashboard-prompt:hidden:venue-1:daily:2026-08-05");
  });
});
