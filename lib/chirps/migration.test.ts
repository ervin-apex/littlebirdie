import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260804074356_group_6_scheduled_email_chirps.sql"),
  "utf8",
).toLowerCase();
const indexMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260804080434_add_group_6_fk_indexes.sql"),
  "utf8",
).toLowerCase();

describe("Group 6 chirp migration", () => {
  it("enables RLS on every public chirp table", () => {
    for (const table of ["chirp_preferences", "chirp_deliveries", "chirp_delivery_events"]) {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("keeps delivery mutation and claiming away from authenticated clients", () => {
    expect(migration).toContain("grant select on table public.chirp_deliveries to authenticated");
    expect(migration).not.toContain("grant select, insert, update, delete on table public.chirp_deliveries to authenticated");
    expect(migration).toContain("grant execute on function public.claim_due_chirp_deliveries(timestamptz, integer)\nto service_role");
    expect(migration).toContain("only the email service can rotate an unsubscribe token");
  });

  it("uses a unique operator, venue, and date boundary for duplicate prevention", () => {
    expect(migration).toContain("unique (user_id, venue_id)");
    expect(migration).toContain("unique (preference_id, service_date)");
    expect(migration).toContain("for update of delivery skip locked");
  });

  it("cascades venue deletion through preferences, deliveries, and events", () => {
    expect(migration).toContain("references public.venues (id, business_id) on delete cascade");
    expect(migration).toContain("references public.chirp_preferences (id) on delete cascade");
    expect(migration).toContain("references public.chirp_deliveries (id) on delete cascade");
  });

  it("adds covering indexes for every new foreign-key shape", () => {
    expect(indexMigration).toContain("chirp_preferences (venue_id, business_id)");
    expect(indexMigration).toContain("chirp_deliveries (business_id)");
    expect(indexMigration).toContain("chirp_deliveries (venue_id, business_id)");
  });
});
