"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createPortal } from "react-dom";
import {
  ArrowCounterClockwise,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  CalendarBlank,
  ChartBar,
  ChartLineUp,
  Check,
  Cube,
  Flask,
  Leaf,
  Minus,
  PencilSimpleLine,
  Plus,
  ShieldCheck,
  UsersThree,
  Wallet,
  X,
} from "@phosphor-icons/react";
import { BirdeeMascot } from "@/components/BirdeeMascot";
import { ProductButton } from "@/components/ProductButton";
import { ChirpActivationPrompt } from "@/components/ChirpActivationPrompt";
import { assetPath, withoutBasePath } from "@/lib/site";
import {
  DEFAULTS,
  DEMO_HISTORY_RANGE,
  PERIODS,
  buildPeriodView,
  cogsForRevenue,
  dailyLedger,
  emptyComponentProvenance,
  forecastActuals,
  isAvailableReportingPeriod,
  money,
  mergeComponentProvenance,
  periodHeadlineProfit,
  profit,
  revenueExGst,
  scopeBreakeven,
  seedActuals,
  signedProfit,
  weekStatus,
  type DayCell,
  type HistoryRange,
  type LedgerRow,
  type PeriodKey,
  type Week,
  type WeekActuals,
} from "@/lib/profit";
import { loadVenueState } from "@/lib/persistence/venue-state";
import {
  dashboardAttentionPrompt,
  dashboardPromptStorageKey,
  formatLongDate,
  formatWeekRange,
  type DashboardAttentionPrompt,
  type DashboardAttentionTask,
} from "@/lib/dashboard/attention";
import {
  dayIndexForDate,
  isoDateAtIndex,
  missingPastDailyRevenueDates,
} from "@/lib/persistence/daily-actual";
import "./scoreboard.css";
import "./what-happened.css";
import "./what-if.css";
import {
  CHAPTERS,
  CHAPTER_KEYS,
  DEFAULT_ADJUSTMENTS,
  DEFAULT_ADJUSTMENT_DRAFTS,
  DRIVER_ICONS,
  DRIVER_LABELS,
  SCREENS,
} from "./_dashboard/constants";
import {
  appPathForScreen,
  chapterFromParam,
  dayFromParam,
  periodFromParam,
  screenFromParam,
  trailFromParam,
} from "./_dashboard/navigation";
import { getChapterContent, fullDayName, periodExplanationTitle, periodNumbersActionLabel } from "./_dashboard/copy";
import { totalCells } from "./_dashboard/numbers";
import { componentEvidenceLabel, reconciliationValue, varianceValue } from "./_dashboard/reconciliation";
import {
  adjustmentBounds,
  adjustmentDraftError,
  applyScenario,
  clampAdjustment,
  driverBaseline,
  formatAdjustment,
  formatAdjustmentInput,
  parseAdjustmentDraft,
  scenarioDriverResultCopy,
  sliderConfig,
} from "./_dashboard/scenario";
import { DashboardView } from "./_dashboard/views/DashboardView";
import { DayVerdictView } from "./_dashboard/views/DayVerdictView";
import { FullNumbersView } from "./_dashboard/views/FullNumbersView";
import { ResultExplanationView } from "./_dashboard/views/ResultExplanationView";
import { WhatIfView } from "./_dashboard/views/WhatIfView";
import { DashboardLoadError, DashboardSkeleton } from "./_dashboard/parts/DashboardStates";
import { ViewBack } from "./_dashboard/parts/ViewBack";
import type {
  Adjustment,
  Adjustments,
  Chapter,
  DailyCheckInTask,
  Driver,
  DriverMode,
  Screen,
} from "./_dashboard/types";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const params = useSearchParams();
  const pathname = withoutBasePath(usePathname());
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const initialScreen: Screen = pathname === "/app/what-happened" ? "what-happened" : "dashboard";
  const initialPeriod = periodFromParam(params.get("period"));
  const screenParam = params.get("view");
  const requestedScreen = screenParam ?? initialScreen;
  const chapterParam = chapterFromParam(params.get("chapter"));
  const dayParam = dayFromParam(params.get("day"));
  const requestedServiceDate = params.get("service-date") ?? undefined;
  const navigationTrail = trailFromParam(params.get("trail"));
  const numbersScope = params.get("scope") === "day" ? "day" : "period";
  const initialRange: HistoryRange = {
    from: params.get("from-date") ?? DEMO_HISTORY_RANGE.from,
    to: params.get("to-date") ?? DEMO_HISTORY_RANGE.to,
  };

  const [periodKey, setPeriodKey] = useState<PeriodKey>(initialPeriod);
  const [chapter, setChapter] = useState<Chapter>(chapterParam);
  const [screen, setScreen] = useState<Screen>(() => screenFromParam(requestedScreen));
  const [week, setWeek] = useState<Week>(DEFAULTS);
  const [weekStart, setWeekStart] = useState("2026-06-22");
  const [venueId, setVenueId] = useState("");
  const [actuals, setActuals] = useState<WeekActuals>(() => forecastActuals());
  const [currentDate, setCurrentDate] = useState("");
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(dayParam);
  const [customRange, setCustomRange] = useState<HistoryRange>(initialRange);
  const [customDraft, setCustomDraft] = useState<HistoryRange>(initialRange);
  const [customOpen, setCustomOpen] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    loadVenueState(requestedServiceDate)
      .then((state) => {
        if (!active) return;
        if (!state.week) {
          router.replace("/setup");
          return;
        }
        setWeek(state.week);
        setWeekStart(state.weekStart ?? "2026-06-22");
        setVenueId(state.venueId);
        setActuals(state.actuals ?? forecastActuals());
        setCurrentDate(state.currentDate);
        setReady(true);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(
          error instanceof Error ? error.message : "Birdee could not load this venue.",
        );
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, [requestedServiceDate, router]);

  useEffect(() => {
    setPeriodKey(initialPeriod);
  }, [initialPeriod]);

  useEffect(() => {
    setScreen(screenFromParam(requestedScreen));
  }, [requestedScreen]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      screenRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
    return () => cancelAnimationFrame(frame);
  }, [screen]);

  useEffect(() => {
    if (screenParam !== "what-happened" || initialScreen === "what-happened") return;
    const query = new URLSearchParams(params.toString());
    router.replace(appPathForScreen("what-happened", query), { scroll: false });
  }, [initialScreen, params, router, screenParam]);

  useEffect(() => {
    setChapter(chapterParam);
  }, [chapterParam]);

  useEffect(() => {
    if (initialPeriod !== "custom") return;
    setCustomRange(initialRange);
    setCustomDraft(initialRange);
  }, [initialPeriod, initialRange.from, initialRange.to]);

  const weekDates = useMemo(
    () => weekStart
      ? Array.from({ length: 7 }, (_, index) => isoDateAtIndex(weekStart, index))
      : [],
    [weekStart],
  );
  const yesterdayDate = currentDate ? isoDateAtIndex(currentDate, -1) : "";
  const yesterdayIndex = yesterdayDate
    ? dayIndexForDate(weekStart, yesterdayDate) ?? -1
    : -1;
  const availablePeriodKeys = useMemo(
    () => new Set<PeriodKey>(
      PERIODS
        .filter((period) => period.available)
        .filter((period) => period.key !== "yesterday" || yesterdayIndex >= 0)
        .map((period) => period.key),
    ),
    [yesterdayIndex],
  );
  const effectivePeriodKey = availablePeriodKeys.has(periodKey)
    ? periodKey
    : "this-week";

  useEffect(() => {
    if (!ready || effectivePeriodKey === periodKey) return;
    setPeriodKey(effectivePeriodKey);
    setChapter("revenue");
    setScreen("dashboard");
    router.replace(`/app?period=${effectivePeriodKey}`, { scroll: false });
  }, [effectivePeriodKey, periodKey, ready, router]);

  const view = useMemo(
    () => buildPeriodView(effectivePeriodKey, week, actuals, weekStart, customRange),
    [effectivePeriodKey, week, actuals, weekStart, customRange],
  );
  const dailyRows = useMemo(
    () => dailyLedger(view.week, view.actuals),
    [view.week, view.actuals],
  );
  const ledger = view.scope === "history" ? (view.historyRows ?? []) : dailyRows;
  const rawStatus = useMemo(
    () => weekStatus(view.week, view.actuals),
    [view.week, view.actuals],
  );
  const dailyCheckInTasks = useMemo<DailyCheckInTask[]>(() => {
    if (!weekStart || !currentDate) return [];
    const missing = missingPastDailyRevenueDates(
      weekStart,
      currentDate,
      actuals.actuals,
    )
      .map((date) => {
        const dayIndex = weekDates.indexOf(date);
        return {
          date,
          dayIndex,
          dayName: fullDayName(dailyRows[dayIndex]?.label ?? ""),
          missingCount: 0,
        };
      })
      .filter((task) => task.dayIndex >= 0 && !actuals.actuals[task.dayIndex]);
    return missing.map((task) => ({ ...task, missingCount: missing.length }));
  }, [actuals, currentDate, dailyRows, weekDates, weekStart]);
  const dailyCheckInTask =
    effectivePeriodKey === "this-week" ? dailyCheckInTasks.at(-1) ?? null : null;
  const checkInDatesByDay = useMemo(
    () =>
      Object.fromEntries(
        dailyCheckInTasks.map((task) => [task.dayIndex, task.date]),
      ),
    [dailyCheckInTasks],
  );

  const scopedRows = view.scope === "day" && view.dayIndex != null
    ? [ledger[view.dayIndex]]
    : ledger;
  const completedRows = scopedRows.filter((row) => row.actual);
  const actualTotals = totalCells(completedRows, "actual");
  const budgetTotals = totalCells(completedRows, "predicted");
  const budgetDifference = actualTotals.net - budgetTotals.net;
  const selectedRow = view.scope === "history" || selectedDay == null ? null : ledger[selectedDay] ?? null;
  const status = view.scope === "history"
    ? { ...rawStatus, projectedNet: actualTotals.net, predictedNet: budgetTotals.net }
    : rawStatus;

  useEffect(() => {
    if (view.scope === "history") {
      setSelectedDay(null);
      return;
    }
    if (dayParam != null && ledger[dayParam]?.actual) {
      setSelectedDay(dayParam);
      return;
    }
    const lastCompleted = [...ledger].reverse().find((row) => row.actual)?.index ?? null;
    setSelectedDay(view.scope === "day" ? view.dayIndex : lastCompleted);
  }, [effectivePeriodKey, view.dayIndex, view.scope, ledger, dayParam]);

  const navigateScreen = (
    next: Screen,
    options: {
      trail?: Screen[];
      day?: number | null;
      scope?: "period" | "day";
    } = {},
  ) => {
    setScreen(next);
    if (options.day !== undefined) setSelectedDay(options.day);
    const query = new URLSearchParams({ period: effectivePeriodKey });
    if (chapter !== "revenue") query.set("chapter", chapter);
    if (effectivePeriodKey === "custom") {
      query.set("from-date", customRange.from);
      query.set("to-date", customRange.to);
    }
    if (next !== "dashboard") query.set("view", next);
    const contextDay = options.day !== undefined ? options.day : selectedDay;
    if (contextDay != null && (next.startsWith("day-") || options.scope === "day")) {
      query.set("day", String(contextDay));
    }
    if (options.trail?.length && next !== "dashboard") {
      query.set("trail", options.trail.join(","));
    }
    if (options.scope === "day") query.set("scope", "day");
    router.replace(appPathForScreen(next, query), { scroll: false });
  };

  const selectPeriod = (key: PeriodKey) => {
    if (!availablePeriodKeys.has(key)) return;
    if (key === "custom") {
      setPeriodKey("custom");
      setCustomRange(customDraft);
      setChapter("revenue");
      setScreen("dashboard");
      setCustomOpen(true);
      const query = new URLSearchParams({
        period: "custom",
        "from-date": customDraft.from,
        "to-date": customDraft.to,
      });
      router.replace(`/app?${query.toString()}`, { scroll: false });
      return;
    }
    setPeriodKey(key);
    setChapter("revenue");
    setCustomOpen(false);
    setScreen("dashboard");
    router.replace(`/app?period=${key}`, { scroll: false });
  };

  const selectChapter = (nextChapter: Chapter) => {
    setChapter(nextChapter);
    const query = new URLSearchParams({ period: effectivePeriodKey });
    if (nextChapter !== "revenue") query.set("chapter", nextChapter);
    if (effectivePeriodKey === "custom") {
      query.set("from-date", customRange.from);
      query.set("to-date", customRange.to);
    }
    router.replace(`/app?${query.toString()}`, { scroll: false });
  };

  const applyCustomRange = () => {
    if (customDraft.from > customDraft.to) return;
    setCustomRange(customDraft);
    setPeriodKey("custom");
    setChapter("revenue");
    setScreen("dashboard");
    setCustomOpen(false);
    const query = new URLSearchParams({
      period: "custom",
      "from-date": customDraft.from,
      "to-date": customDraft.to,
    });
    router.replace(`/app?${query.toString()}`, { scroll: false });
  };

  if (!ready) return <DashboardSkeleton />;
  if (loadError) return <DashboardLoadError message={loadError} />;

  const isFuture = effectivePeriodKey === "next-week";
  const isHistory = view.scope === "history";
  const selectedPeriodDay = view.scope === "day"
    ? ledger[view.dayIndex ?? 0]
    : null;
  const incompleteDayTask = effectivePeriodKey === "yesterday"
    && selectedPeriodDay
    && !selectedPeriodDay.actual
    && yesterdayIndex >= 0
      ? {
          date: yesterdayDate,
          dayName: fullDayName(selectedPeriodDay.label),
        }
      : null;
  const periodProfit = periodHeadlineProfit({
    scope: view.scope,
    isFuture,
    dayActualNet: selectedPeriodDay?.actual?.net,
    dayPredictedNet: selectedPeriodDay?.predicted.net,
    projectedNet: status.projectedNet,
    predictedNet: status.predictedNet,
    historyActualNet: actualTotals.net,
  });

  const chapterContent = getChapterContent({
    chapter,
    periodProfit,
    budgetDifference,
    projected: status.projectedNet,
    budget: status.predictedNet,
    isFuture,
    isHistory,
  });

  const openSelectedDay = () => {
    if (selectedRow?.actual) navigateScreen("day-verdict", { trail: [], day: selectedRow.index });
  };

  const openChild = (
    next: Screen,
    options: { day?: number | null; scope?: "period" | "day" } = {},
  ) => {
    const trail = screen === "dashboard" ? navigationTrail : [...navigationTrail, screen];
    navigateScreen(next, { ...options, trail });
  };

  const navigateBack = () => {
    const trail = [...navigationTrail];
    const parent = trail.pop() ?? "dashboard";
    navigateScreen(parent, {
      trail,
      day: selectedDay,
      scope: numbersScope,
    });
  };

  const fullNumbersScope: "period" | "day" =
    numbersScope === "day" || view.scope === "day" ? "day" : "period";
  const fullNumbersRows = fullNumbersScope === "day" && selectedRow ? [selectedRow] : scopedRows;
  const scenarioBaseCell = totalCells(scopedRows, "selected");
  const scenarioBaseWeek: Week = {
    ...view.week,
    rev: scenarioBaseCell.rev,
    lab: scenarioBaseCell.lab,
    fix: scenarioBaseCell.fix,
    recurringIncome: scenarioBaseCell.otherIncome,
  };
  const fullNumbersTitle = fullNumbersScope === "day" && selectedRow
    ? `${fullDayName(selectedRow.label)} numbers`
    : `${view.title} numbers`;
  const immediateParent = navigationTrail[navigationTrail.length - 1] ?? "dashboard";

  const screenNode = (() => {
    switch (screen) {
      case "what-happened":
        return (
          <ResultExplanationView
            backLabel={view.title}
            resultLabel={`${view.title}'s result`}
            title={periodExplanationTitle(view.title)}
            numbersActionLabel={periodNumbersActionLabel(view.title)}
            rows={completedRows}
            week={view.week}
            onBack={navigateBack}
            onFullNumbers={() => openChild("full-numbers", { scope: view.scope === "day" ? "day" : "period", day: selectedDay })}
          />
        );
      case "what-if":
        return (
          <WhatIfView
            periodTitle={view.title}
            week={scenarioBaseWeek}
            onBack={navigateBack}
          />
        );
      case "full-numbers":
        return (
          <FullNumbersView
            backLabel={immediateParent === "what-happened" ? "What happened" : immediateParent === "day-explanation" && selectedRow ? fullDayName(selectedRow.label) : view.title}
            title={fullNumbersTitle}
            rows={fullNumbersRows}
            week={view.week}
            mode={isHistory ? "history" : fullNumbersScope === "day" ? "day" : "week"}
            rowLabel={isHistory ? "Week" : "Day"}
            onBack={navigateBack}
            onSelectDay={(index) => {
              const row = ledger[index];
              if (row?.actual) {
                setSelectedDay(index);
                openChild("day-verdict", { day: index, scope: fullNumbersScope });
              }
            }}
          />
        );
      case "day-verdict":
        return selectedRow?.actual ? (
          <DayVerdictView
            row={selectedRow}
            rows={ledger}
            periodTitle={view.title}
            onBack={navigateBack}
            onExplain={() => openChild("day-explanation", { day: selectedRow.index })}
            onSelectDay={(index) => {
              if (ledger[index]?.actual) navigateScreen("day-verdict", { trail: navigationTrail, day: index });
            }}
          />
        ) : null;
      case "day-explanation":
        return selectedRow?.actual ? (
          <ResultExplanationView
            backLabel={fullDayName(selectedRow.label)}
            resultLabel={`${fullDayName(selectedRow.label)}'s result`}
            title="What happened?"
            numbersActionLabel={`See ${fullDayName(selectedRow.label)}’s numbers`}
            rows={[selectedRow]}
            week={view.week}
            onBack={navigateBack}
            onFullNumbers={() => openChild("full-numbers", { day: selectedRow.index, scope: "day" })}
          />
        ) : null;
      case "dashboard":
      default:
        return (
          <DashboardView
            viewTitle={view.title}
            dateLabel={view.dateLabel}
            periodKey={effectivePeriodKey}
            availablePeriodKeys={availablePeriodKeys}
            chapter={chapter}
            chapterContent={chapterContent}
            ledger={ledger}
            selectedDay={selectedDay}
            selectedRow={selectedRow}
            isWeek={view.scope === "week"}
            isFuture={isFuture}
            isDemo={Boolean(view.isDemo)}
            historyRows={view.historyRows}
            customOpen={customOpen}
            customDraft={customDraft}
            onPeriod={selectPeriod}
            onCustomDraft={setCustomDraft}
            onApplyCustom={applyCustomRange}
            onCloseCustom={() => setCustomOpen(false)}
            onChapter={selectChapter}
            onWhatHappened={() => openChild("what-happened")}
            onWhatIf={() => openChild("what-if")}
            onSelectDay={setSelectedDay}
            onOpenDay={openSelectedDay}
            onFullNumbers={() => openChild("full-numbers", { scope: view.scope === "day" ? "day" : "period", day: selectedDay })}
            dailyCheckInTask={dailyCheckInTask}
            incompleteDayTask={incompleteDayTask}
            checkInDatesByDay={checkInDatesByDay}
            venueId={venueId}
            weekStart={weekStart}
            currentDate={currentDate}
            onCheckInDay={(date) =>
              router.push(`/app/check-in?date=${encodeURIComponent(date)}`)}
          />
        );
    }
  })();

  return (
    <div className="scoreboard-stage">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          ref={screenRef}
          key={screen}
          className="scoreboard-screen"
          initial={reduceMotion ? false : { opacity: 0, transform: "translateX(10px)" }}
          animate={{ opacity: 1, transform: "translateX(0px)" }}
          exit={reduceMotion ? { opacity: 1 } : {
            opacity: 0,
            transform: "translateX(-6px)",
            transition: { duration: 0.14, ease: [0.23, 1, 0.32, 1] },
          }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.23, 1, 0.32, 1] }}
        >
          {screenNode}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}


