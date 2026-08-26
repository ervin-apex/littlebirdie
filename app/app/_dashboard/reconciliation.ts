import { money, signedProfit, type DayCell } from "@/lib/profit";

export function reconciliationValue(value: number) {
  return value >= 0 ? money(value) : signedProfit(value);
}

export function componentEvidenceLabel(
  evidence: DayCell["componentProvenance"]["revenue"],
) {
  const isDemo = evidence.label?.toLowerCase().includes("demo");
  const source = isDemo
    ? "Demo"
    : evidence.source === "derived"
      ? "Calculated"
      : evidence.source === "forecast"
        ? "Manual"
        : evidence.source === "allocated-budget"
          ? "Allocated"
          : evidence.source === "pnl"
            ? "P&L"
            : evidence.source === "pos"
              ? "POS"
              : evidence.source.startsWith("timesheet")
                ? "Timesheet"
                : evidence.source === "roster-scheduled"
                  ? "Roster"
                  : "Manual";
  const certainty = evidence.status === "forecast"
    ? "forecast"
    : evidence.status === "confirmed"
      ? "confirmed"
      : evidence.status === "provisional"
        ? "provisional"
        : "estimate";
  const updated = evidence.updatedAt ? ` · ${evidence.updatedAt}` : " · Not live";
  return `${source} ${certainty}${updated}`;
}

export function varianceValue(value: number) {
  return Math.abs(value) < 0.5 ? "$0" : money(Math.abs(value));
}
