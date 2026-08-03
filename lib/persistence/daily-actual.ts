const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function revenueToCents(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value < 0 || value > 10_000_000) return null;
  return Math.round(value * 100);
}

export function isoDateAtIndex(weekStart: string, dayIndex: number): string {
  const date = new Date(`${weekStart}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + dayIndex);
  return date.toISOString().slice(0, 10);
}

export function dayIndexForDate(
  weekStart: string,
  serviceDate: string,
): number | null {
  const index = Array.from({ length: 7 }, (_, dayIndex) =>
    isoDateAtIndex(weekStart, dayIndex)).indexOf(serviceDate);
  return index >= 0 ? index : null;
}

export function eligibleDailyDates(
  weekStart: string,
  currentDate: string,
): string[] {
  return Array.from({ length: 7 }, (_, index) =>
    isoDateAtIndex(weekStart, index))
    .filter((date) => date <= currentDate);
}

export function missingPastDailyRevenueDates(
  weekStart: string,
  currentDate: string,
  actuals: readonly unknown[],
): string[] {
  return eligibleDailyDates(weekStart, currentDate)
    .filter((date) => date < currentDate)
    .filter((date) => {
      const dayIndex = Array.from({ length: 7 }, (_, index) =>
        isoDateAtIndex(weekStart, index)).indexOf(date);
      return dayIndex >= 0 && actuals[dayIndex] == null;
    });
}
