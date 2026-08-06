import { describe, expect, it } from "vitest";
import {
  assertExactBusinessConfirmation,
  assertSandboxKey,
  operationalSnapshotsMatch,
  stableRowsHash,
} from "../../scripts/manage-billing-recovery-fixture.mjs";

describe("Group 5 billing recovery fixture safety", () => {
  it("accepts only Stripe test secret keys", () => {
    expect(() => assertSandboxKey("sk_test_example")).not.toThrow();
    expect(() => assertSandboxKey("sk_live_example")).toThrow(/sandbox key/);
    expect(() => assertSandboxKey(undefined)).toThrow(/sandbox key/);
  });

  it("requires the operator to repeat the exact business id", () => {
    expect(() => assertExactBusinessConfirmation("business-a", "business-a")).not.toThrow();
    expect(() => assertExactBusinessConfirmation("business-a", "business-b"))
      .toThrow(/exactly match/);
  });

  it("hashes equivalent rows independently of row and object-key order", () => {
    const first = [
      { id: "two", amount: 200, nested: { right: true, left: false } },
      { id: "one", amount: 100 },
    ];
    const second = [
      { amount: 100, id: "one" },
      { nested: { left: false, right: true }, amount: 200, id: "two" },
    ];
    expect(stableRowsHash(first)).toBe(stableRowsHash(second));
  });

  it("detects a changed operational table checksum or count", () => {
    const tableNames = [
      "venues",
      "venue_members",
      "venue_settings",
      "venue_setup_drafts",
      "financial_assumptions",
      "weekly_plans",
      "weekly_plan_days",
      "daily_actual_revisions",
    ];
    const baseline = Object.fromEntries(
      tableNames.map((table) => [table, { count: 1, sha256: `${table}-hash` }]),
    );
    const changed = structuredClone(baseline);
    changed.weekly_plans.sha256 = "different";

    expect(operationalSnapshotsMatch(baseline, structuredClone(baseline))).toBe(true);
    expect(operationalSnapshotsMatch(baseline, changed)).toBe(false);
  });
});
