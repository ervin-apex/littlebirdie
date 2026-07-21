"use client";

import { usePathname, useRouter } from "next/navigation";
import { PERIODS, type PeriodKey } from "@/lib/profit";

/**
 * v4 panel header row — four flat text-button tabs (no pills, no fills);
 * the active tab gets a 2px gold underline sitting on the row's bottom
 * border. Date label sits right-aligned in the same row. Same data flow as
 * v3's PeriodTabs (drives parent state immediately, persists to the URL via
 * a shallow router.replace).
 */
export function PeriodTabs({
  active,
  onChange,
  dateLabel,
}: {
  active: PeriodKey;
  onChange: (key: PeriodKey) => void;
  dateLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const select = (key: PeriodKey) => {
    onChange(key);
    router.replace(`${pathname}?period=${key}`, { scroll: false });
  };

  return (
    <div className="v4-panel-head">
      <div className="v4-tabs" role="tablist" aria-label="Choose a period">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            role="tab"
            aria-selected={active === p.key}
            className="v4-tab v4-focusable"
            onClick={() => select(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <span className="v4-date tnum">{dateLabel}</span>
    </div>
  );
}
