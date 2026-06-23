import { DAY_LABELS } from "@/lib/profit";

/** A compact Mon–Sun bar row of predicted daily revenue. */
export function DayBreakdown({ days }: { days: number[] }) {
  const max = Math.max(...days, 1);
  return (
    <div className="flex items-end gap-2">
      {days.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="tnum font-display text-[11px] font-medium text-ink/70">
            {(d / 1000).toFixed(1)}k
          </span>
          <div
            className="w-full rounded-t-md bg-amber-300"
            style={{ height: `${10 + (d / max) * 52}px` }}
          />
          <span className="text-[11px] text-ink/60">{DAY_LABELS[i]}</span>
        </div>
      ))}
    </div>
  );
}
