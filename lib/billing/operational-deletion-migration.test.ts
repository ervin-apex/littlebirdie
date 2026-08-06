import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = path.join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260804065631_purge_terminal_venues_and_memberships.sql",
);
const migration = readFileSync(migrationPath, "utf8").toLowerCase();

describe("terminal operational deletion migration", () => {
  it("suppresses audit capture only during the postgres-owned purge transaction", () => {
    expect(migration).toContain("current_user = 'postgres'");
    expect(migration).toContain("current_setting('little_birdee.operational_purge', true) = 'on'");
  });

  it("deletes venue membership and venue records before clearing audit payloads", () => {
    const venueMembers = migration.indexOf("delete from public.venue_members");
    const venues = migration.indexOf("delete from public.venues");
    const auditEvents = migration.indexOf("delete from public.audit_events");

    expect(venueMembers).toBeGreaterThan(-1);
    expect(venues).toBeGreaterThan(venueMembers);
    expect(auditEvents).toBeGreaterThan(venues);
  });

  it("retains the minimum business, owner membership and billing shell", () => {
    expect(migration).not.toMatch(/delete\s+from\s+public\.businesses\b/);
    expect(migration).not.toMatch(/delete\s+from\s+public\.business_members\b/);
    expect(migration).not.toMatch(/delete\s+from\s+public\.business_subscriptions\b/);
    expect(migration).toContain("'2026-08-04-v3'");
  });
});
