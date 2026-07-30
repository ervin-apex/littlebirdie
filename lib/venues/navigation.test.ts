import { describe, expect, it } from "vitest";
import { resolveSelectedVenueId } from "./selection";

const venues = [
  { id: "surry-hills" },
  { id: "newtown" },
];

describe("resolveSelectedVenueId", () => {
  it("preserves an authorized venue selected by the returning browser", () => {
    expect(resolveSelectedVenueId(venues, "newtown")).toBe("newtown");
  });

  it("falls back to the first authorized venue when the cookie is missing or invalid", () => {
    expect(resolveSelectedVenueId(venues)).toBe("surry-hills");
    expect(resolveSelectedVenueId(venues, "another-account")).toBe("surry-hills");
  });

  it("returns null when the account has no venues", () => {
    expect(resolveSelectedVenueId([], "newtown")).toBeNull();
  });
});
