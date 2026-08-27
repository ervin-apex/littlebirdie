import { House, NotePencil, Wallet } from "@phosphor-icons/react";

/** The three things anyone opens Little Birdee to do. Scott, on the call:
 *  "Are you here to look at your results? Are you here to enter new numbers?
 *  Or are you here to change your setup?"
 *
 *  One definition, rendered two ways: a bottom bar on phones and labelled
 *  links in the header on wider screens. */
export type AppNavItem = {
  key: "home" | "actuals" | "budget";
  href: string;
  label: string;
  icon: typeof House;
  /** Paths that should light this item up, longest match wins. */
  match: string[];
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    key: "home",
    href: "/app?period=this-week",
    label: "Home",
    icon: House,
    match: ["/app", "/app/what-happened"],
  },
  {
    key: "actuals",
    href: "/app/check-in",
    label: "Actuals",
    icon: NotePencil,
    match: ["/app/check-in", "/app/update"],
  },
  {
    // Route is still /setup, but the wizard's whole job is the weekly budget -
    // revenue, wages, COGS, other costs, other income. "Budget" says what you
    // do there and pairs with Actuals as the two halves of the comparison.
    key: "budget",
    href: "/setup",
    label: "My Budget",
    icon: Wallet,
    match: ["/setup", "/app/plan", "/venues/new"],
  },
];

/** Longest match wins, so /app/check-in selects Actuals rather than Home. */
export function activeNavKey(pathname: string): AppNavItem["key"] | null {
  let best: { key: AppNavItem["key"]; length: number } | null = null;

  for (const item of APP_NAV_ITEMS) {
    for (const path of item.match) {
      const hit = pathname === path || pathname.startsWith(`${path}/`);
      if (hit && (!best || path.length > best.length)) {
        best = { key: item.key, length: path.length };
      }
    }
  }

  return best?.key ?? null;
}
