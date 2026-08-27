import { signedProfit } from "@/lib/profit";
import type { Chapter } from "./types";

export function getChapterContent({ chapter, periodProfit, budgetDifference, projected, budget, isFuture, isHistory }: { chapter: Chapter; periodProfit: number; budgetDifference: number; projected: number; budget: number; isFuture: boolean; isHistory: boolean }) {
  if (chapter === "budget") return { label: "Compared with budget", value: isFuture ? 0 : budgetDifference, support: isFuture ? "No actual result yet" : budgetDifference >= 0 ? "Ahead of budget" : "Behind budget", tone: budgetDifference >= 0 ? "tone-positive" : "tone-concerned" };
  if (chapter === "week") return { label: isFuture ? "Your forecast" : isHistory ? "Period result" : "Projected profit", value: isFuture ? budget : projected, support: `Budget ${signedProfit(budget)}`, tone: projected >= 0 ? "tone-focused" : "tone-concerned" };
  return { label: isFuture ? "Your forecast" : "Your estimated profit", value: periodProfit, support: isFuture ? "From the numbers you entered" : isHistory ? "Estimated EBITDA for this range" : "Available actuals, with remaining costs estimated", tone: periodProfit >= 0 ? "tone-positive" : "tone-concerned" };
}

export function fullDayName(short: string) {
  return ({ Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" } as Record<string, string>)[short] ?? short;
}

export function periodExplanationTitle(periodTitle: string) {
  if (periodTitle === "Yesterday") return "What happened yesterday?";
  if (periodTitle === "This week") return "What happened this week?";
  if (periodTitle === "Last week") return "What happened last week?";
  if (periodTitle === "Custom range") return "What happened in this range?";
  return `What happened in ${periodTitle}?`;
}

export function periodNumbersActionLabel(periodTitle: string) {
  if (periodTitle === "Yesterday") return "See all yesterday’s numbers";
  if (periodTitle === "This week") return "See all this week’s numbers";
  if (periodTitle === "Last week") return "See all last week’s numbers";
  if (periodTitle === "Custom range") return "See all this range’s numbers";
  return `See all ${periodTitle} numbers`;
}
