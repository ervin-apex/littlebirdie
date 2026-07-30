import { assertMoneyCents } from "./money";
import type { DateRange, IsoDate, MoneyCents } from "./types";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MILLISECONDS_PER_DAY = 86_400_000;

function parseIsoDate(value: IsoDate): number {
  const match = ISO_DATE.exec(value);
  if (!match) {
    throw new Error(`Invalid ISO date: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  return timestamp;
}
export function inclusiveDayCount(range: DateRange): number {
  const from = parseIsoDate(range.from);
  const to = parseIsoDate(range.to);

  if (to < from) {
    throw new Error("The period end date must not be before its start date.");
  }

  return Math.floor((to - from) / MILLISECONDS_PER_DAY) + 1;
}

export function scalePeriodAmount(
  sourceAmountCents: MoneyCents,
  sourcePeriod: DateRange,
  targetPeriod: DateRange,
): MoneyCents {
  assertMoneyCents(sourceAmountCents, "Source-period amount");
  const sourceDays = inclusiveDayCount(sourcePeriod);
  const targetDays = inclusiveDayCount(targetPeriod);
  return Math.round((sourceAmountCents * targetDays) / sourceDays);
}

export function calendarMonthRange(
  year: number,
  month: number,
): DateRange {
  if (
    !Number.isSafeInteger(year) ||
    !Number.isSafeInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error("A valid year and calendar month are required.");
  }

  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthText = String(month).padStart(2, "0");

  return {
    from: `${year}-${monthText}-01`,
    to: `${year}-${monthText}-${String(lastDay).padStart(2, "0")}`,
  };
}
