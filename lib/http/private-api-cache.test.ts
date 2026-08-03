import { describe, expect, it } from "vitest";
import {
  PRIVATE_API_CACHE_CONTROL,
  applyPrivateApiCacheHeaders,
} from "./private-api-cache";

describe("private API cache headers", () => {
  it("prevents authenticated API responses being reused after logout", () => {
    const headers = new Headers({ Vary: "Accept-Encoding" });

    applyPrivateApiCacheHeaders(headers);

    expect(headers.get("Cache-Control")).toBe(PRIVATE_API_CACHE_CONTROL);
    expect(headers.get("Pragma")).toBe("no-cache");
    expect(headers.get("Vary")).toBe("Accept-Encoding, Cookie, Authorization");
  });

  it("does not duplicate existing vary values", () => {
    const headers = new Headers({ Vary: "Cookie, Authorization" });

    applyPrivateApiCacheHeaders(headers);

    expect(headers.get("Vary")).toBe("Cookie, Authorization");
  });
});
