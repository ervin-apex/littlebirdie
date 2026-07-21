"use client";

import { usePathname, useRouter } from "next/navigation";
import { PERIODS, type PeriodKey } from "@/lib/profit";

/**
 * Segmented period control — pill track, filled active segment, 44px tall.
 * Drives the parent's period state immediately (for a snappy switch) and
 * persists the choice to the URL via router.replace (shallow, no scroll).
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
    <div className="v2-tabs" role="tablist" aria-label="Choose a period">
      {PERIODS.map((p) => (
        <button
          key={p.key}
          type="button"
          role="tab"
          aria-selected={active === p.key}
          className="v2-tab v2-focusable"
          onClick={() => select(p.key)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
