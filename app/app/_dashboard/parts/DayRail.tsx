import { DayScore } from "../parts/DayScore";
import type { LedgerRow } from "@/lib/profit";

export function DayRail({
  rows,
  selectedDay,
  onSelect,
  onOpenSelected,
  compact = false,
  checkInDatesByDay,
  onCheckIn,
}: {
  rows: LedgerRow[];
  selectedDay: number | null;
  onSelect: (index: number) => void;
  onOpenSelected?: () => void;
  compact?: boolean;
  checkInDatesByDay?: Record<number, string>;
  onCheckIn?: (date: string) => void;
}) {
  return (
    <div className={`day-rail ${compact ? "is-compact" : ""}`} role="list" aria-label="Profit by day">
      {rows.map((row) => (
        <DayScore
          key={row.index}
          row={row}
          selected={selectedDay === row.index}
          compact={compact}
          onSelect={() => row.actual && onSelect(row.index)}
          onOpen={selectedDay === row.index ? onOpenSelected : undefined}
          onCheckIn={
            checkInDatesByDay?.[row.index] && onCheckIn
              ? () => onCheckIn(checkInDatesByDay[row.index])
              : undefined
          }
        />
      ))}
    </div>
  );
}
