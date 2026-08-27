import { ChartLineUp, Cube, Leaf, UsersThree } from "@phosphor-icons/react";
import type { Adjustments, Chapter, Driver, Screen } from "./types";

export const CHAPTERS: { key: Chapter; label: string }[] = [
  { key: "revenue", label: "Actual" },
  { key: "budget", label: "Budget" },
  { key: "week", label: "Week" },
];

export const DRIVER_LABELS: Record<Driver, string> = {
  revenue: "Revenue",
  cogs: "COGS",
  wages: "Wages",
  fixed: "Fixed & variable",
};

export const DRIVER_ICONS = {
  revenue: ChartLineUp,
  cogs: Cube,
  wages: UsersThree,
  fixed: Leaf,
};

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  revenue: { value: 0, mode: "dollar" },
  cogs: { value: 0, mode: "percent" },
  wages: { value: 0, mode: "dollar" },
  fixed: { value: 0, mode: "dollar" },
};

export const DEFAULT_ADJUSTMENT_DRAFTS: Record<Driver, string> = {
  revenue: "0",
  cogs: "0",
  wages: "0",
  fixed: "0",
};

export const SCREENS: Screen[] = [
  "dashboard",
  "what-happened",
  "what-if",
  "full-numbers",
  "day-verdict",
  "day-explanation",
];

export const CHAPTER_KEYS: Chapter[] = ["revenue", "budget", "week"];
