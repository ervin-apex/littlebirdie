import type { DashboardAttentionTask } from "@/lib/dashboard/attention";

export type Chapter = "revenue" | "budget" | "week";

export type Screen =
  | "dashboard"
  | "what-happened"
  | "what-if"
  | "full-numbers"
  | "day-verdict"
  | "day-explanation";

export type Driver = "revenue" | "cogs" | "wages" | "fixed";
export type DriverMode = "dollar" | "percent";
export type Adjustment = { value: number; mode: DriverMode };
export type Adjustments = Record<Driver, Adjustment>;
export type DailyCheckInTask = DashboardAttentionTask;
