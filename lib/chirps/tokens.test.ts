import { describe, expect, it } from "vitest";
import { createUnsubscribeToken, verifyUnsubscribeToken } from "./tokens";

describe("chirp unsubscribe tokens", () => {
  it("round-trips a valid preference and version", () => {
    const token = createUnsubscribeToken({ preferenceId: "pref-1", version: 2 }, "secret");
    expect(verifyUnsubscribeToken(token, "secret")).toEqual({
      preferenceId: "pref-1",
      version: 2,
    });
  });

  it("rejects tampering and the wrong secret", () => {
    const token = createUnsubscribeToken({ preferenceId: "pref-1", version: 2 }, "secret");
    expect(verifyUnsubscribeToken(`${token}x`, "secret")).toBeNull();
    expect(verifyUnsubscribeToken(token, "other-secret")).toBeNull();
  });
});
