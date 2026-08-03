export const PRIVATE_API_CACHE_CONTROL = "private, no-store, max-age=0";

export function applyPrivateApiCacheHeaders(headers: Headers) {
  headers.set("Cache-Control", PRIVATE_API_CACHE_CONTROL);
  headers.set("Pragma", "no-cache");

  const vary = new Set(
    (headers.get("Vary") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  vary.add("Cookie");
  vary.add("Authorization");
  headers.set("Vary", [...vary].join(", "));
}
