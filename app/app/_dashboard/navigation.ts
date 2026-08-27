import { isAvailableReportingPeriod, type PeriodKey } from "@/lib/profit";
import { CHAPTER_KEYS, SCREENS } from "./constants";
import type { Chapter, Screen } from "./types";

export function screenFromParam(value: string | null): Screen {
  return SCREENS.includes(value as Screen) ? (value as Screen) : "dashboard";
}

export function periodFromParam(value: string | null): PeriodKey {
  return isAvailableReportingPeriod(value) ? value : "this-week";
}

export function chapterFromParam(value: string | null): Chapter {
  return CHAPTER_KEYS.includes(value as Chapter) ? (value as Chapter) : "revenue";
}

export function dayFromParam(value: string | null): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 6 ? parsed : null;
}

export function trailFromParam(value: string | null): Screen[] {
  if (!value) return [];
  return value
    .split(",")
    .filter((item): item is Screen => SCREENS.includes(item as Screen) && item !== "dashboard");
}

/** Every screen is a `view` on /app. "what-happened" used to be special-cased
 *  to its own route, which re-mounted the whole dashboard and threw away its
 *  state on every visit. /app/what-happened now redirects here instead. */
export function appPathForScreen(screen: Screen, query: URLSearchParams) {
  query.delete("view");
  if (screen !== "dashboard") query.set("view", screen);
  const search = query.toString();
  return `/app${search ? `?${search}` : ""}`;
}
