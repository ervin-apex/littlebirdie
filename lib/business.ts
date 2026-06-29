// Business profile captured during onboarding (round 2). Stored separately from
// the weekly numbers so the two onboarding steps stay independent.

export type Business = {
  name: string;
  industry: string;
  currency: string; // ISO-ish code, e.g. "AUD"
  gstIncluded: boolean; // are prices entered GST-inclusive?
};

export const INDUSTRIES = [
  "Café / Restaurant",
  "Bar / Pub",
  "Retail shop",
  "Hair / Beauty salon",
  "Fitness / Wellness",
  "Professional services",
  "Other",
];

export const CURRENCIES = [
  { code: "AUD", label: "AUD — Australian dollar" },
  { code: "NZD", label: "NZD — New Zealand dollar" },
  { code: "USD", label: "USD — US dollar" },
  { code: "GBP", label: "GBP — British pound" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "CAD", label: "CAD — Canadian dollar" },
];

export const DEFAULT_BUSINESS: Business = {
  name: "",
  industry: INDUSTRIES[0],
  currency: "AUD",
  gstIncluded: true,
};

const BUSINESS_KEY = "little-birdee-business";

export function loadBusiness(): Business | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BUSINESS_KEY);
    return raw ? { ...DEFAULT_BUSINESS, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

export function saveBusiness(b: Business): void {
  try {
    window.localStorage.setItem(BUSINESS_KEY, JSON.stringify(b));
  } catch {
    // ignore — storage is a convenience, not required
  }
}

export function hasBusiness(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(BUSINESS_KEY) !== null;
  } catch {
    return false;
  }
}
