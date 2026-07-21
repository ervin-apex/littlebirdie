"use client";

import { usePathname, useRouter } from "next/navigation";
import { PERIODS, type PeriodKey } from "@/lib/profit";

/**
 * v3 period control — Hum push-button segmented rail (signature move #1),
 * NOT a pill track. Four .btn instances in a row with 8px gaps: the active
 * period is the chunky pear-filled push, the rest are .btn--soft. Same
 * data-flow as v2's PeriodTabs (drives parent state immediately, persists
 * to the URL via a shallow router.replace).
 */
export function PeriodTabs({
  active,
  onChange,
}: {
  active: PeriodKey;
  onChange: (key: PeriodKey) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const select = (key: PeriodKey) => {
    onChange(key);
    router.replace(`${pathname}?period=${key}`, { scroll: false });
  };

  return (
    <div className="v3-tabs" role="tablist" aria-label="Choose a period">
      {PERIODS.map((p) => (
        <button
          key={p.key}
          type="button"
          role="tab"
          aria-selected={active === p.key}
          className={`btn v3-focusable ${active === p.key ? "" : "btn--soft"}`}
          onClick={() => select(p.key)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
