"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import "./v4.css";
import { V4Header } from "@/components/v4/V4Header";
import { PeriodTabs } from "@/components/v4/PeriodTabs";
import { HeroVerdict, type HeroMode } from "@/components/v4/HeroVerdict";
import { BreakevenBar } from "@/components/v4/BreakevenBar";
import { DayStrip } from "@/components/v4/DayStrip";
import { DayDetail } from "@/components/v4/DayDetail";
import { WeekBreakdown } from "@/components/v4/WeekBreakdown";
import {
  DEFAULTS,
  LAST_WEEK,
  dailyLedger,
  forecastActuals,
  loadActuals,
  loadWeek,
  scopeBreakeven,
  seedActuals,
  weekStatus,
  type PeriodKey,
  type Week,
  type WeekActuals,
} from "@/lib/profit";

/**
 * v4 dashboard — a subtraction pass on v3: one flat instrument panel on a
 * quiet cream canvas instead of Hum's multi-accent card system. The
 * data/logic layer below (period resolution with real dates, loading
 * skeleton, hero label/value/budget/mode + daysLeft computation, celebration
 * trigger logic) is copied verbatim from app/v3/page.tsx — only the visual
 * language and the hero micro-label copy change (the date now lives in the
 * panel header row, so the hero label is content-only, e.g. "THIS WEEK'S
 * PROFIT SO FAR" rather than v3's "THIS WEEK · <date>").
 *
 * New route, new components only; app/v3/page.tsx and everything under
 * app/v2/ and app/app/ stay untouched.
 */

// Mirrors the (unexported) ACTUALS_KEY constant in lib/profit.ts. Read-only —
// lets a hard-loaded v4 dashboard tell a genuinely-saved actuals record apart
// from loadActuals()'s seeded-demo fallback, so only real saved actuals keep
// their stored todayIndex overridden to today's real date (see resolveView).
const ACTUALS_STORAGE_KEY = "little-birdee-actuals";

function dayIndexOf(d: Date): number {
  return (d.getDay() + 6) % 7; // 0 = Mon .. 6 = Sun
}

function startOfWeekMonday(d: Date): Date {
  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - dayIndexOf(d));
  return monday;
}

function addDays(d: Date, n: number): Date {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
}

const WD_FMT = new Intl.DateTimeFormat("en-AU", { weekday: "short" });
const WD_FULL_FMT = new Intl.DateTimeFormat("en-AU", { weekday: "long" });
const DAY_FMT = new Intl.DateTimeFormat("en-AU", { day: "numeric" });
const MONTH_FMT = new Intl.DateTimeFormat("en-AU", { month: "short" });

/** "Mon 13 – Sun 19 Jul" (date range for the panel header row, month shown
 * once, or on both ends if it spans two). */
function formatRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const start = `${WD_FMT.format(monday)} ${DAY_FMT.format(monday)}`;
  const end = `${WD_FMT.format(sunday)} ${DAY_FMT.format(sunday)} ${MONTH_FMT.format(sunday)}`;
  return sameMonth ? `${start} – ${end}` : `${start} ${MONTH_FMT.format(monday)} – ${end}`;
}

/** "Wednesday, 25 Jun" */
function formatDay(d: Date): string {
  return `${WD_FULL_FMT.format(d)}, ${DAY_FMT.format(d)} ${MONTH_FMT.format(d)}`;
}

type V4View = {
  key: PeriodKey;
  title: string;
  dateLabel: string;
  week: Week;
  actuals: WeekActuals;
  scope: "week" | "day";
  dayIndex: number | null;
};

/** Own period resolution (real dates, not hard-coded June strings). Copied
 * verbatim from app/v3/page.tsx's resolveView. */
function resolveView(key: PeriodKey, baseWeek: Week, baseActuals: WeekActuals, today: Date): V4View {
  const monday = startOfWeekMonday(today);
  switch (key) {
    case "last-week": {
      const lastMonday = addDays(monday, -7);
      return {
        key,
        title: "Last week",
        dateLabel: formatRange(lastMonday),
        week: LAST_WEEK,
        actuals: seedActuals(LAST_WEEK, 7),
        scope: "week",
        dayIndex: null,
      };
    }
    case "next-week": {
      const nextMonday = addDays(monday, 7);
      return {
        key,
        title: "Next week",
        dateLabel: formatRange(nextMonday),
        week: baseWeek,
        actuals: forecastActuals(),
        scope: "week",
        dayIndex: null,
      };
    }
    case "yesterday": {
      const yi = Math.max(0, baseActuals.todayIndex - 1);
      return {
        key,
        title: "Yesterday",
        dateLabel: formatDay(addDays(monday, yi)),
        week: baseWeek,
        actuals: baseActuals,
        scope: "day",
        dayIndex: yi,
      };
    }
    case "this-week":
    default:
      return {
        key: "this-week",
        title: "This week",
        dateLabel: formatRange(monday),
        week: baseWeek,
        actuals: baseActuals,
        scope: "week",
        dayIndex: null,
      };
  }
}

export default function DashboardV4Page() {
  return (
    <Suspense fallback={<SkeletonPage />}>
      <DashboardV4Inner />
    </Suspense>
  );
}

function DashboardV4Inner() {
  const params = useSearchParams();
  const urlPeriod = ((params.get("period") as PeriodKey) || "this-week") as PeriodKey;

  const [periodKey, setPeriodKey] = useState<PeriodKey>(urlPeriod);
  const [ready, setReady] = useState(false);
  const [week, setWeek] = useState<Week>(DEFAULTS);
  const [actuals, setActuals] = useState<WeekActuals>(() => seedActuals(DEFAULTS));
  const [today, setToday] = useState<Date | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Keep local state in sync with the URL (back/forward nav, a direct link).
  useEffect(() => {
    setPeriodKey(urlPeriod);
  }, [urlPeriod]);

  // Loading discipline: nothing renders except the skeleton until this runs,
  // so demo DEFAULTS/June dates never flash on a hard load.
  useEffect(() => {
    const now = new Date();
    const w = loadWeek();
    const realTodayIndex = dayIndexOf(now);

    let hasSavedActuals = false;
    try {
      hasSavedActuals = window.localStorage.getItem(ACTUALS_STORAGE_KEY) != null;
    } catch {
      hasSavedActuals = false;
    }

    const a: WeekActuals = hasSavedActuals
      ? { ...loadActuals(w), todayIndex: realTodayIndex }
      : seedActuals(w, realTodayIndex);

    setWeek(w);
    setActuals(a);
    setToday(now);
    setReady(true);
  }, []);

  const view = useMemo(
    () => (today ? resolveView(periodKey, week, actuals, today) : null),
    [periodKey, week, actuals, today],
  );

  const ledger = useMemo(() => (view ? dailyLedger(view.week, view.actuals) : []), [view]);

  // Default the selected day whenever the resolved period changes: the
  // single resolved day for "yesterday", else the most recently finished day.
  useEffect(() => {
    if (!view) return;
    if (view.scope === "day") {
      setSelectedDay(view.dayIndex);
    } else {
      setSelectedDay(Math.max(0, view.actuals.todayIndex - 1));
    }
  }, [view]);

  if (!ready || !view) {
    return <SkeletonPage />;
  }

  const isDay = view.scope === "day" && view.dayIndex != null;
  const beRows = isDay ? [ledger[view.dayIndex as number]] : ledger;

  let heroLabel: string;
  let heroValue: number;
  let heroBudget: number;
  let heroMode: HeroMode;
  let heroDaysLeft = 0;

  if (isDay) {
    const row = ledger[view.dayIndex as number];
    const actualNet = row.actual ? row.actual.net : row.predicted.net;
    heroLabel = "YESTERDAY'S PROFIT";
    heroValue = actualNet;
    heroBudget = row.predicted.net;
    heroMode = row.actual ? "compare" : "forecast";
  } else if (periodKey === "next-week") {
    const status = weekStatus(view.week, view.actuals);
    heroLabel = "NEXT WEEK'S FORECAST";
    heroValue = status.predictedNet;
    heroBudget = status.predictedNet;
    heroMode = "forecast";
  } else if (periodKey === "last-week") {
    const status = weekStatus(view.week, view.actuals);
    heroLabel = "LAST WEEK'S PROFIT";
    heroValue = status.projectedNet;
    heroBudget = status.predictedNet;
    heroMode = "compare";
  } else {
    const status = weekStatus(view.week, view.actuals);
    heroLabel = "THIS WEEK'S PROFIT SO FAR";
    heroValue = status.projectedNet;
    heroBudget = status.predictedNet;
    heroMode = "compare";
    // Days after today left in the week (Mon=0..Sun=6), floored at 0.
    heroDaysLeft = Math.max(0, 6 - view.actuals.todayIndex);
  }

  const be = scopeBreakeven(beRows, view.week.cogs);
  const selectedRow = selectedDay != null ? (ledger[selectedDay] ?? null) : null;

  return (
    <div className="v4 v4-root">
      <div className="v4-page">
        <V4Header />
        <hr className="v4-rule" />

        <section className="v4-panel">
          <PeriodTabs active={periodKey} onChange={setPeriodKey} dateLabel={view.dateLabel} />

          <HeroVerdict
            key={view.key}
            label={heroLabel}
            value={heroValue}
            budgetValue={heroBudget}
            mode={heroMode}
            periodKey={view.key}
            daysLeft={heroDaysLeft}
          />

          <hr className="v4-rule" />

          <BreakevenBar be={be} cogsPct={view.week.cogs} />

          <hr className="v4-rule" />

          {/* For a single-day scope (yesterday) the strip would just repeat the
              one day already shown in DayDetail, so it's hidden here rather
              than rendering a 1-token row. */}
          {!isDay && <DayStrip rows={ledger} selected={selectedDay} onSelect={setSelectedDay} />}

          <DayDetail row={selectedRow} open={selectedDay != null} />

          {/* Same reasoning as the day strip: a week table with one column adds
              nothing over the day detail panel already on screen. */}
          {!isDay && <WeekBreakdown rows={ledger} />}
        </section>
      </div>
    </div>
  );
}

function SkeletonPage() {
  return (
    <div className="v4 v4-root">
      <div className="v4-page">
        <div className="v4-header">
          <div className="v4-skel" style={{ width: 140, height: 20 }} />
          <div className="v4-skel" style={{ width: 32, height: 32, borderRadius: 999 }} />
        </div>
        <hr className="v4-rule" />

        <section className="v4-panel">
          <div style={{ height: 56, padding: "0 24px", display: "flex", alignItems: "center" }}>
            <div className="v4-skel" style={{ width: "100%", height: 16 }} />
          </div>
          <hr className="v4-rule" />
          <div style={{ padding: "32px 24px" }}>
            <div className="v4-skel" style={{ width: 160, height: 56 }} />
          </div>
          <hr className="v4-rule" />
          <div style={{ padding: "16px 24px" }}>
            <div className="v4-skel" style={{ width: "100%", height: 8, borderRadius: 4 }} />
          </div>
          <hr className="v4-rule" />
          <div
            style={{
              padding: "16px 24px",
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gap: 8,
            }}
          >
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="v4-skel" style={{ height: 64 }} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
