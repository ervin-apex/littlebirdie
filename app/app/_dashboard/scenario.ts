import { money, type Week } from "@/lib/profit";
import type { Adjustment, Adjustments, Driver, DriverMode } from "./types";

export function applyScenario(week: Week, adjustments: Adjustments): Week {
  const revenue = adjustments.revenue.mode === "dollar" ? week.rev + adjustments.revenue.value : week.rev * (1 + adjustments.revenue.value / 100);
  const wages = adjustments.wages.mode === "dollar" ? week.lab + adjustments.wages.value : week.lab * (1 + adjustments.wages.value / 100);
  const fixed = adjustments.fixed.mode === "dollar" ? week.fix + adjustments.fixed.value : week.fix * (1 + adjustments.fixed.value / 100);
  return { ...week, rev: Math.max(0, revenue), lab: Math.max(0, wages), fix: Math.max(0, fixed), cogs: Math.max(0, Math.min(99, week.cogs + adjustments.cogs.value)) };
}

export type AdjustmentBounds = {
  min: number;
  max: number;
};

export function driverBaseline(driver: Driver, week: Week) {
  if (driver === "revenue") return week.rev;
  if (driver === "wages") return week.lab;
  if (driver === "fixed") return week.fix;
  return week.cogs;
}

export function adjustmentBounds(driver: Driver, mode: DriverMode, week: Week): AdjustmentBounds {
  if (driver === "cogs") {
    return { min: -week.cogs, max: 99 - week.cogs };
  }
  if (mode === "percent") {
    return { min: -100, max: Number.POSITIVE_INFINITY };
  }
  return { min: -driverBaseline(driver, week), max: Number.POSITIVE_INFINITY };
}

export function clampAdjustment(value: number, bounds: AdjustmentBounds) {
  return Math.max(bounds.min, Math.min(bounds.max, value));
}

export function parseAdjustmentDraft(value: string) {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized || ["-", "+", ".", "-.", "+."].includes(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatAdjustmentInput(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}

export function adjustmentDraftError(
  rawValue: string,
  parsed: number | null,
  bounds: AdjustmentBounds,
  driver: Driver,
  mode: DriverMode,
) {
  const normalized = rawValue.replace(/,/g, "").trim();
  if (!normalized || ["-", "+", ".", "-.", "+."].includes(normalized)) return null;
  if (parsed == null) return "Enter a number.";
  const unit = driver === "cogs" ? " pts" : mode === "percent" ? "%" : "";
  if (parsed < bounds.min) return `Lowest possible change is ${formatAdjustmentInput(bounds.min)}${unit}.`;
  if (parsed > bounds.max) return `Highest possible change is ${formatAdjustmentInput(bounds.max)}${unit}.`;
  return null;
}

export function scenarioDriverResultCopy(driver: Driver, scenarioWeek: Week, unchanged: boolean) {
  const prefix = unchanged ? "Current" : "New";
  if (driver === "revenue") return `${prefix} revenue ${money(scenarioWeek.rev)}`;
  if (driver === "wages") return `${prefix} wages ${money(scenarioWeek.lab)}`;
  if (driver === "fixed") return `${prefix} other costs ${money(scenarioWeek.fix)}`;
  return `${prefix} COGS rate ${formatAdjustmentInput(scenarioWeek.cogs)}%`;
}

export function sliderConfig(driver: Driver, mode: DriverMode, week: Week) {
  if (driver === "cogs") {
    return {
      min: Math.max(-week.cogs, -20),
      max: Math.min(99 - week.cogs, 20),
      step: 0.5,
    };
  }
  if (mode === "percent") return { min: -50, max: 100, step: 1 };

  const baseline = driverBaseline(driver, week);
  const step = baseline >= 10000 ? 100 : baseline >= 3000 ? 50 : baseline >= 1000 ? 25 : 10;
  const band = Math.max(step * 10, Math.ceil((baseline * 0.5) / step) * step);
  return { min: Math.max(-baseline, -band), max: band, step };
}

export function formatAdjustment(driver: Driver, adjustment: Adjustment) {
  if (adjustment.value === 0) return "No change";
  const sign = adjustment.value > 0 ? "+" : "−";
  const amount = Math.abs(adjustment.value);
  if (driver === "cogs" || adjustment.mode === "percent") return `${sign}${amount}%`;
  return `${sign}${money(amount)}`;
}
