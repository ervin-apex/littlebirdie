import { describe, expect, it } from "vitest";
import {
  completedStepsAfterAdvance,
  isResumableDraft,
  resumeSetupStepIndex,
  setupExitPath,
  setupStepsRemaining,
  type SetupStepKey,
} from "./setup-navigation";

describe("setupExitPath", () => {
  it("uses the account as the safe destination while venue state is loading", () => {
    expect(setupExitPath({
      loadingVenue: true,
      requiresFirstPlan: false,
    })).toBe("/account");
  });

  it("pauses an unfinished first venue without sending it through the dashboard", () => {
    expect(setupExitPath({
      loadingVenue: false,
      requiresFirstPlan: true,
    })).toBe("/setup/paused");
  });

  it("returns an already configured venue to its dashboard", () => {
    expect(setupExitPath({
      loadingVenue: false,
      requiresFirstPlan: false,
    })).toBe("/app?period=this-week");
  });
});

describe("resumable setup progress", () => {
  const sixSteps: SetupStepKey[] = [
    "venue",
    "revenue",
    "wages",
    "cogs",
    "fixed",
    "income",
  ];

  it("records the completed step without moving progress backwards", () => {
    expect(completedStepsAfterAdvance({
      currentCompletedSteps: 1,
      stepIndex: 1,
      totalSteps: 6,
    })).toBe(2);
    expect(completedStepsAfterAdvance({
      currentCompletedSteps: 3,
      stepIndex: 1,
      totalSteps: 6,
    })).toBe(3);
  });

  it("keeps the last financial step pending until the final plan save succeeds", () => {
    expect(completedStepsAfterAdvance({
      currentCompletedSteps: 5,
      stepIndex: 5,
      totalSteps: 6,
    })).toBe(5);
  });

  it("resumes at the persisted next step and derives how many remain", () => {
    expect(resumeSetupStepIndex(sixSteps, "wages")).toBe(2);
    expect(setupStepsRemaining(2, 6)).toBe(4);
  });

  it("falls back safely when a persisted step is unavailable", () => {
    expect(resumeSetupStepIndex(sixSteps, null)).toBe(0);
  });
});

describe("isResumableDraft", () => {
  const plan = "2026-07-30T07:29:47.000Z";

  it("resumes a draft started after the venue's plan was locked", () => {
    expect(isResumableDraft("2026-07-30T08:30:17.000Z", plan)).toBe(true);
  });

  it("discards a draft abandoned before the venue's plan was locked", () => {
    expect(isResumableDraft("2026-07-30T06:15:00.000Z", plan)).toBe(false);
  });

  it("discards a draft that ties the plan, so the saved plan always wins", () => {
    expect(isResumableDraft(plan, plan)).toBe(false);
  });

  it("resumes a draft for a venue that has never locked a plan", () => {
    expect(isResumableDraft("2026-07-30T08:30:17.000Z", null)).toBe(true);
  });

  it("has nothing to resume when no draft exists", () => {
    expect(isResumableDraft(null, plan)).toBe(false);
    expect(isResumableDraft(undefined, undefined)).toBe(false);
  });

  it("ignores an unparseable draft timestamp rather than outranking the plan", () => {
    expect(isResumableDraft("not-a-date", plan)).toBe(false);
  });
});
