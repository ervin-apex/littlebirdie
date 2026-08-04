import type { PeriodKey } from "../profit";
import { isoDateAtIndex } from "../persistence/daily-actual";

export type DashboardAttentionTask = {
  date: string;
  dayIndex: number;
  dayName: string;
  missingCount: number;
};

export type DashboardAttentionPrompt =
  | {
      kind: "weekly";
      signature: string;
      targetWeekStart: string;
    }
  | {
      kind: "daily";
      signature: string;
      task: DashboardAttentionTask;
    };

export function dashboardAttentionPrompt({
  venueId,
  weekStart,
  currentDate,
  periodKey,
  dailyTask,
}: {
  venueId: string;
  weekStart: string;
  currentDate: string;
  periodKey: PeriodKey;
  dailyTask: DashboardAttentionTask | null;
}): DashboardAttentionPrompt | null {
  if (!venueId || !weekStart || !currentDate || periodKey !== "this-week") {
    return null;
  }

  const savedWeekEnd = isoDateAtIndex(weekStart, 6);
  if (currentDate > savedWeekEnd) {
    const targetWeekStart = mondayForIsoDate(currentDate);
    return {
      kind: "weekly",
      signature: `${venueId}:weekly:${targetWeekStart}`,
      targetWeekStart,
    };
  }

  if (!dailyTask) return null;
  return {
    kind: "daily",
    signature: `${venueId}:daily:${dailyTask.date}`,
    task: dailyTask,
  };
}

export function dashboardPromptStorageKey(
  scope: "hidden" | "later",
  signature: string,
) {
  return `little-birdee:dashboard-prompt:${scope}:${signature}`;
}

export function mondayForIsoDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  const isoDay = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - (isoDay - 1));
  return date.toISOString().slice(0, 10);
}

function formatPromptDate(
  value: string,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "UTC",
    ...options,
  }).format(new Date(`${value}T00:00:00Z`));
}

export function formatWeekRange(weekStart: string) {
  const end = isoDateAtIndex(weekStart, 6);
  return `${formatPromptDate(weekStart, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).replace(/,/g, "")} – ${formatPromptDate(end, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).replace(/,/g, "")}`;
}

export function formatLongDate(value: string) {
  return formatPromptDate(value, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
