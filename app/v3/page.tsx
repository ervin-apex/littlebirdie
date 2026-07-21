"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import "./v3.css";
import { V3Header } from "@/components/v3/V3Header";
import { PeriodTabs } from "@/components/v3/PeriodTabs";
import { HeroVerdict, type HeroMode } from "@/components/v3/HeroVerdict";
import { BreakevenBar } from "@/components/v3/BreakevenBar";
import { DayStrip } from "@/components/v3/DayStrip";
import { DayDetail } from "@/components/v3/DayDetail";
import { WeekBreakdown } from "@/components/v3/WeekBreakdown";
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
 * v3 dashboard — full visual reskin of /v2 using Hallmark's Hum theme,
 * brand-adapted (pear = Birdee gold, coral = loss/pop, domain profit stays
 * ink-green). The data/logic layer below (period resolution with real
 * dates, loading skeleton, hero label/value/budget/mode + daysLeft
 * computation, celebration trigger logic) is copied nearly verbatim from
 * app/v2/page.tsx — only the visual language changes.
 *
 * New route, new components only; app/v2/page.tsx and everything under
 * app/app/ stay untouched.
 */

// Mirrors the (unexported) ACTUALS_KEY constant in lib/profit.ts. Read-only —
// lets a hard-loaded v3 dashboard tell a genuinely-saved actuals record apart
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

/** "MON 14 – SUN 20 JUL" (mono eyebrow date range, month shown once, or on
 * both ends if it spans two). */
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

type V3View = {
  key: PeriodKey;
  title: string;
  dateLabel: string;
  week: Week;
  actuals: WeekActuals;
  scope: "week" | "day";
  dayIndex: number | null;
};

/** Own period resolution (real dates, not hard-coded June strings). Copied
 * verbatim from app/v2/page.tsx's resolveView. */
function resolveView(key: PeriodKey, baseWeek: Week, baseActuals: WeekActuals, today: Date): V3View {
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

export default function DashboardV3Page() {
  return (
    <Suspense fallback={<SkeletonPage />}>
      <DashboardV3Inner />
    </Suspense>
  );
}

function DashboardV3Inner() {
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
    heroLabel = `YESTERDAY · ${formatDay(addDays(startOfWeekMonday(today as Date), view.dayIndex as number)).toUpperCase()}`;
    heroValue = actualNet;
    heroBudget = row.predicted.net;
    heroMode = row.actual ? "compare" : "forecast";
  } else if (periodKey === "next-week") {
    const status = weekStatus(view.week, view.actuals);
    heroLabel = `NEXT WEEK · ${view.dateLabel.toUpperCase()}`;
    heroValue = status.predictedNet;
    heroBudget = status.predictedNet;
    heroMode = "forecast";
  } else if (periodKey === "last-week") {
    const status = weekStatus(view.week, view.actuals);
    heroLabel = `LAST WEEK · ${view.dateLabel.toUpperCase()}`;
    heroValue = status.projectedNet;
    heroBudget = status.predictedNet;
    heroMode = "compare";
  } else {
    const status = weekStatus(view.week, view.actuals);
    heroLabel = `THIS WEEK · ${view.dateLabel.toUpperCase()}`;
    heroValue = status.projectedNet;
    heroBudget = status.predictedNet;
    heroMode = "compare";
    // Days after today left in the week (Mon=0..Sun=6), floored at 0.
    heroDaysLeft = Math.max(0, 6 - view.actuals.todayIndex);
  }

  const be = scopeBreakeven(beRows, view.week.cogs);
  const selectedRow = selectedDay != null ? (ledger[selectedDay] ?? null) : null;

  return (
    <div className="v3 v3-root">
      <div className="v3-page">
        <V3Header />

        <div className="v3-section" style={{ paddingBottom: 0 }}>
          <PeriodTabs active={periodKey} onChange={setPeriodKey} />
        </div>

        <HeroVerdict
          key={view.key}
          label={heroLabel}
          value={heroValue}
          budgetValue={heroBudget}
          mode={heroMode}
          periodKey={view.key}
          daysLeft={heroDaysLeft}
        >
          <BreakevenBar be={be} cogsPct={view.week.cogs} />
        </HeroVerdict>

        {/* For a single-day scope (yesterday) the strip would just repeat the
            one day already shown in HeroVerdict/DayDetail, so it's hidden
            here rather than rendering a 1-token row. */}
        {!isDay && (
          <>
            <hr className="v3-seam" />
            <section className="v3-section" style={{ paddingBlock: 28 }}>
              <p className="v3-eyebrow" style={{ marginBottom: 12 }}>
                Days
              </p>
              <DayStrip rows={ledger} selected={selectedDay} onSelect={setSelectedDay} />
            </section>
          </>
        )}

        <div className="v3-section" style={{ paddingBlock: 0 }}>
          <DayDetail row={selectedRow} open={selectedDay != null} />
        </div>

        {/* Same reasoning as the day strip: a week table with one column adds
            nothing over the day detail panel already on screen. */}
        {!isDay && (
          <>
            <hr className="v3-seam" style={{ marginTop: 28 }} />
            <section className="v3-section" style={{ paddingBlock: 28 }}>
              <WeekBreakdown rows={ledger} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function SkeletonPage() {
  return (
    <div className="v3 v3-root">
      <div className="v3-page">
        <div className="v3-section" style={{ paddingBottom: 0 }}>
          <div className="v3-skel" style={{ height: 64 }} />
          <div className="v3-skel" style={{ height: 44, borderRadius: 999, marginTop: 16 }} />
        </div>
        <div className="v3-skel" style={{ height: 260, borderRadius: 0, marginTop: 28 }} />
        <div className="v3-section">
          <div className="v3-skel" style={{ height: 60 }} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gap: 8,
              marginTop: 24,
            }}
          >
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="v3-skel" style={{ height: 64, borderRadius: 14 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
