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
import "./scoreboard.css";
import "./what-happened.css";
import "./what-if.css";

type Chapter = "revenue" | "budget" | "week";
type Screen =
  | "dashboard"
  | "what-happened"
  | "what-if"
  | "full-numbers"
  | "day-verdict"
  | "day-explanation";
type Driver = "revenue" | "cogs" | "wages" | "fixed";
type DriverMode = "dollar" | "percent";
type Adjustment = { value: number; mode: DriverMode };
type Adjustments = Record<Driver, Adjustment>;

const CHAPTERS: { key: Chapter; label: string }[] = [
  { key: "revenue", label: "Revenue" },
  { key: "budget", label: "Budget" },
  { key: "week", label: "Week" },
];

const DRIVER_LABELS: Record<Driver, string> = {
  revenue: "Revenue",
  cogs: "COGS",
  wages: "Wages",
  fixed: "Fixed & variable",
};

const DRIVER_ICONS = {
  revenue: ChartLineUp,
  cogs: Cube,
  wages: UsersThree,
  fixed: Leaf,
};

const DEFAULT_ADJUSTMENTS: Adjustments = {
  revenue: { value: 0, mode: "dollar" },
  cogs: { value: 0, mode: "percent" },
  wages: { value: 0, mode: "dollar" },
  fixed: { value: 0, mode: "dollar" },
};

const DEFAULT_ADJUSTMENT_DRAFTS: Record<Driver, string> = {
  revenue: "0",
  cogs: "0",
  wages: "0",
  fixed: "0",
};

const SCREENS: Screen[] = ["dashboard", "what-happened", "what-if", "full-numbers", "day-verdict", "day-explanation"];
const CHAPTER_KEYS: Chapter[] = ["revenue", "budget", "week"];

function screenFromParam(value: string | null): Screen {
  return SCREENS.includes(value as Screen) ? (value as Screen) : "dashboard";
}

function periodFromParam(value: string | null): PeriodKey {
  return PERIODS.some((period) => period.key === value) ? (value as PeriodKey) : "this-week";
}

function chapterFromParam(value: string | null): Chapter {
  return CHAPTER_KEYS.includes(value as Chapter) ? (value as Chapter) : "revenue";
}

function dayFromParam(value: string | null): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 6 ? parsed : null;
}

function trailFromParam(value: string | null): Screen[] {
  if (!value) return [];
  return value
    .split(",")
    .filter((item): item is Screen => SCREENS.includes(item as Screen) && item !== "dashboard");
}

function appPathForScreen(screen: Screen, query: URLSearchParams) {
  query.delete("view");

  if (screen === "what-happened") {
    const search = query.toString();
    return `/app/what-happened${search ? `?${search}` : ""}`;
  }

  if (screen !== "dashboard") query.set("view", screen);
  const search = query.toString();
  return `/app${search ? `?${search}` : ""}`;
}

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
  const [actuals, setActuals] = useState<WeekActuals>(() => forecastActuals());
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(dayParam);
  const [customRange, setCustomRange] = useState<HistoryRange>(initialRange);
  const [customDraft, setCustomDraft] = useState<HistoryRange>(initialRange);
  const [customOpen, setCustomOpen] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    loadVenueState()
      .then((state) => {
        if (!active) return;
        if (!state.week) {
          router.replace("/setup");
          return;
        }
        setWeek(state.week);
        setWeekStart(state.weekStart ?? "2026-06-22");
        setActuals(state.actuals ?? forecastActuals());
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
  }, [router]);

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

  const view = useMemo(
    () => buildPeriodView(periodKey, week, actuals, weekStart, customRange),
    [periodKey, week, actuals, weekStart, customRange],
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
  }, [periodKey, view.dayIndex, view.scope, ledger, dayParam]);

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
    const query = new URLSearchParams({ period: periodKey });
    if (chapter !== "revenue") query.set("chapter", chapter);
    if (periodKey === "custom") {
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
    const query = new URLSearchParams({ period: periodKey });
    if (nextChapter !== "revenue") query.set("chapter", nextChapter);
    if (periodKey === "custom") {
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

  const isFuture = periodKey === "next-week";
  const isHistory = view.scope === "history";
  const selectedPeriodDay = view.scope === "day"
    ? ledger[view.dayIndex ?? 0]
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
            periodKey={periodKey}
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

function DashboardView({
  viewTitle,
  dateLabel,
  periodKey,
  chapter,
  chapterContent,
  ledger,
  selectedDay,
  selectedRow,
  isWeek,
  isFuture,
  isDemo,
  historyRows,
  customOpen,
  customDraft,
  onPeriod,
  onCustomDraft,
  onApplyCustom,
  onCloseCustom,
  onChapter,
  onWhatHappened,
  onWhatIf,
  onSelectDay,
  onOpenDay,
  onFullNumbers,
}: {
  viewTitle: string;
  dateLabel: string;
  periodKey: PeriodKey;
  chapter: Chapter;
  chapterContent: ReturnType<typeof getChapterContent>;
  ledger: LedgerRow[];
  selectedDay: number | null;
  selectedRow: LedgerRow | null;
  isWeek: boolean;
  isFuture: boolean;
  isDemo: boolean;
  historyRows?: LedgerRow[];
  customOpen: boolean;
  customDraft: HistoryRange;
  onPeriod: (key: PeriodKey) => void;
  onCustomDraft: (range: HistoryRange) => void;
  onApplyCustom: () => void;
  onCloseCustom: () => void;
  onChapter: (chapter: Chapter) => void;
  onWhatHappened: () => void;
  onWhatIf: () => void;
  onSelectDay: (index: number) => void;
  onOpenDay: () => void;
  onFullNumbers: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [dayPreviewOpen, setDayPreviewOpen] = useState(false);
  const yesterdayRow = periodKey === "yesterday" && selectedRow?.actual && selectedRow.variance
    ? selectedRow
    : null;
  const answerSupport = chapterContent.support;

  const selectDay = (index: number) => {
    onSelectDay(index);
    setDayPreviewOpen(true);
  };

  const openSelectedDay = () => {
    setDayPreviewOpen(false);
    onOpenDay();
  };

  return (
    <div className={`dashboard-view ${chapterContent.tone}`} data-day-preview-open={dayPreviewOpen ? "true" : "false"}>
      <section className="scoreboard-heading" aria-labelledby="scoreboard-title">
        <div>
          <p className="scoreboard-date">{dateLabel}</p>
          <div className="scoreboard-title-line">
            <h1 id="scoreboard-title">{viewTitle}</h1>
            {isDemo && <span className="demo-badge">Demo history</span>}
          </div>
        </div>
        <PeriodNavigation
          periodKey={periodKey}
          onPeriod={(key) => {
            setDayPreviewOpen(false);
            onPeriod(key);
          }}
        />
      </section>

      <AnimatePresence initial={false}>
        {customOpen && (
          <CustomRangePanel
            key="custom-range"
            value={customDraft}
            onChange={onCustomDraft}
            onApply={onApplyCustom}
            onClose={onCloseCustom}
          />
        )}
      </AnimatePresence>

      <div className="chapter-tabs" role="tablist" aria-label="Choose the main result">
        {CHAPTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={chapter === item.key}
            className={chapter === item.key ? "chapter-tab is-active" : "chapter-tab"}
            onClick={() => {
              setDayPreviewOpen(false);
              onChapter(item.key);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <aside className="dashboard-answer" aria-live="polite">
        <motion.div
          key={`${periodKey}-${chapter}`}
          className="dashboard-profit-copy"
          initial={reduceMotion ? false : { opacity: 0, transform: "translateY(4px)" }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          transition={{ duration: reduceMotion ? 0 : 0.16, ease: [0.23, 1, 0.32, 1] }}
        >
          <p>{chapterContent.label}</p>
          <strong className="tnum">{signedProfit(chapterContent.value)}</strong>
          <span>{answerSupport}</span>
        </motion.div>
        <div className="dashboard-profit-actions" aria-label="Explore this result">
          {!isFuture && (
            <ProductButton
              variant="secondary"
              className="result-action dashboard-primary-action"
              onClick={onWhatHappened}
              leadingIcon={<ChartLineUp size={20} weight="bold" />}
            >
              What happened
            </ProductButton>
          )}
          <ProductButton
            variant="secondary"
            className="result-action dashboard-secondary-action"
            onClick={onWhatIf}
            leadingIcon={<Flask size={20} weight="bold" />}
          >
            What if
          </ProductButton>
        </div>
        <div className="dashboard-birdee-stage">
          <span className="dashboard-chirp" aria-hidden="true"><i /><i /></span>
          <BirdeeMascot
            state={chapterContent.value >= 0 ? "profit" : "loss"}
            size={210}
            className="dashboard-birdee"
          />
        </div>
      </aside>

      {isWeek && (
        <section className="week-progress" aria-labelledby="week-progress-title">
          <div className="flight-path-intro">
            <div>
              <h2 id="week-progress-title">How the week&rsquo;s tracking</h2>
              <p>{ledger.filter((row) => row.actual).length} of {ledger.length} days done</p>
            </div>
          </div>
          <DayRail
            rows={ledger}
            selectedDay={selectedDay}
            onSelect={selectDay}
            onOpenSelected={openSelectedDay}
          />
          <FlightPathLegend />
          <div className="view-footer-action">
            <ProductButton
              variant="tertiary"
              size="compact"
              onClick={onFullNumbers}
              trailingIcon={<ArrowRight weight="bold" />}
            >
              See all numbers
            </ProductButton>
          </div>
        </section>
      )}

      {yesterdayRow && <YesterdayComparison row={yesterdayRow} />}

      {historyRows && historyRows.length > 0 && (
        <section className="history-progress" aria-labelledby="history-progress-title">
          <div className="section-intro">
            <div>
              <h2 id="history-progress-title">Recorded history</h2>
              <p>Each column is one completed demo-data slice in this range.</p>
            </div>
          </div>
          <HistoryRail rows={historyRows} />
        </section>
      )}

      {!isWeek && (
        <div className="view-footer-action">
          <ProductButton
            variant="tertiary"
            size="compact"
            onClick={onFullNumbers}
            trailingIcon={<ArrowRight weight="bold" />}
          >
            See all numbers
          </ProductButton>
        </div>
      )}

      <div className="dashboard-mobile-dock" aria-label="Dashboard action">
        <ProductButton
          href="/setup"
          variant="primary"
          fullWidth
          leadingIcon={<Plus size={20} weight="bold" />}
          trailingIcon={<ArrowRight size={18} weight="bold" />}
        >
          Update numbers
        </ProductButton>
      </div>

      {dayPreviewOpen && selectedRow?.actual && typeof document !== "undefined" && createPortal(
        <DayPreviewOverlay
          row={selectedRow}
          onClose={() => setDayPreviewOpen(false)}
          onOpen={openSelectedDay}
        />,
        document.body,
      )}
    </div>
  );
}

function DayPreviewOverlay({ row, onClose, onOpen }: {
  row: LedgerRow;
  onClose: () => void;
  onOpen: () => void;
}) {
  if (!row.actual) return null;
  const difference = row.variance?.net ?? row.actual.net - row.predicted.net;
  const performance = Math.round(difference) === 0 ? "on budget" : difference > 0 ? "ahead" : "behind";
  const statusLabel = performance === "on budget"
    ? "On budget"
    : performance === "ahead"
      ? "Ahead of budget"
      : "Behind budget";
  const verdictLabel = performance === "on budget"
    ? "on budget"
    : performance === "ahead"
      ? "ahead of budget"
      : "behind budget";
  const dayName = fullDayName(row.label);
  const driverInsight = row.variance?.driver === "revenue"
    ? "Revenue did most of the pulling."
    : row.variance?.driver === "labour"
      ? "Wages made the biggest difference."
      : "Your daily costs made the biggest difference.";

  return (
    <div className="day-preview-layer">
      <button type="button" className="day-preview-scrim" aria-label="Close day summary" onClick={onClose} />
      <section className="day-preview-panel" role="dialog" aria-modal="true" aria-labelledby="day-preview-title">
        <span className="day-preview-handle" aria-hidden="true" />
        <button type="button" className="day-breakdown-close" aria-label="Close day summary" onClick={onClose}>
          <X weight="bold" aria-hidden="true" />
        </button>
        <h2 id="day-preview-title">{dayName}</h2>
        <p className={`day-preview-status is-${performance.replace(" ", "-")}`}>{statusLabel}</p>
        <strong className={`tnum day-preview-verdict is-${performance.replace(" ", "-")}`}>
          {money(Math.abs(difference))} {verdictLabel}
        </strong>
        <p className="day-preview-support">
          Estimated profit finished at {signedProfit(row.actual.net)} against a budget of {signedProfit(row.predicted.net)}.
        </p>
        <dl className="day-preview-values">
          <div><dt>Estimated</dt><dd className="tnum">{signedProfit(row.actual.net)}</dd></div>
          <div><dt>Budget</dt><dd className="tnum">{signedProfit(row.predicted.net)}</dd></div>
        </dl>
        <div className="day-preview-insight">
          <BirdeeMascot state={difference >= 0 ? "profit" : "loss"} size={74} />
          <p>{driverInsight}</p>
        </div>
        <ProductButton variant="secondary" fullWidth onClick={onOpen} trailingIcon={<ArrowRight weight="bold" />}>
          See {dayName}&rsquo;s numbers
        </ProductButton>
        <button type="button" className="day-preview-close-action" onClick={onClose}>Close</button>
      </section>
    </div>
  );
}

function YesterdayComparison({ row }: { row: LedgerRow }) {
  if (!row.actual || !row.variance) return null;

  const variance = row.variance.net;
  const driverText = row.variance.driver === "revenue"
    ? `Revenue was ${money(Math.abs(row.variance.rev))} ${row.variance.rev < 0 ? "below" : "above"} budget.`
    : row.variance.driver === "labour"
      ? `Wages were ${money(Math.abs(row.variance.lab))} ${row.variance.lab > 0 ? "over" : "under"} budget.`
      : "Revenue and wages were the biggest drivers.";

  return (
    <section className="day-comparison" aria-labelledby="day-comparison-title">
      <div className="day-comparison-card">
        <h2 id="day-comparison-title">Yesterday vs budget</h2>
        <div className="day-comparison-track" aria-label={`Budget profit ${signedProfit(row.predicted.net)}, estimated profit ${signedProfit(row.actual.net)}`}>
          <div className="day-comparison-point is-budget">
            <span>Budget profit</span>
            <strong className="tnum">{signedProfit(row.predicted.net)}</strong>
          </div>
          <div className="day-comparison-arrow" aria-hidden="true">
            <span />
            <ArrowRight weight="bold" />
          </div>
          <div className="day-comparison-point is-actual">
            <span>Estimated profit</span>
            <strong className="tnum">{signedProfit(row.actual.net)}</strong>
          </div>
        </div>
        <div className={variance >= 0 ? "day-comparison-verdict is-positive" : "day-comparison-verdict is-concerned"}>
          <strong className="tnum">{signedProfit(variance)}</strong>
          <span>{variance >= 0 ? "ahead of budget" : "behind budget"}</span>
        </div>
        <p className="day-comparison-driver"><strong>Main driver:</strong> {driverText}</p>
      </div>
    </section>
  );
}

function PeriodNavigation({
  periodKey,
  onPeriod,
}: {
  periodKey: PeriodKey;
  onPeriod: (key: PeriodKey) => void;
}) {
  const activeIndex = PERIODS.findIndex((period) => period.key === periodKey);
  const previous = PERIODS[Math.max(0, activeIndex - 1)]?.key ?? PERIODS[0].key;
  const next = PERIODS[Math.min(PERIODS.length - 1, activeIndex + 1)]?.key ?? PERIODS[PERIODS.length - 1].key;
  return (
    <div className="period-nav" aria-label="Choose reporting period">
      <button className="period-arrow" type="button" aria-label="Previous period" disabled={activeIndex <= 0} onClick={() => onPeriod(previous)}><CaretLeft weight="bold" /></button>
      {PERIODS.map((period) => (
        <button
          key={period.key}
          type="button"
          className={periodKey === period.key ? "period-button is-active" : "period-button"}
          aria-pressed={periodKey === period.key}
          aria-haspopup={period.key === "custom" ? "dialog" : undefined}
          onClick={() => onPeriod(period.key)}
        >
          {period.label}
        </button>
      ))}
      <button className="period-arrow" type="button" aria-label="Next period" disabled={activeIndex >= PERIODS.length - 1} onClick={() => onPeriod(next)}><CaretRight weight="bold" /></button>
    </div>
  );
}

function CustomRangePanel({ value, onChange, onApply, onClose }: {
  value: HistoryRange;
  onChange: (range: HistoryRange) => void;
  onApply: () => void;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const invalid = value.from > value.to;
  return (
    <motion.section
      className="custom-range-panel"
      role="dialog"
      aria-label="Choose custom reporting dates"
      initial={reduceMotion ? false : { opacity: 0, transform: "translateY(-8px) scale(0.98)" }}
      animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
      exit={reduceMotion ? { opacity: 0 } : {
        opacity: 0,
        transform: "translateY(-5px) scale(0.985)",
        transition: { duration: 0.14, ease: [0.23, 1, 0.32, 1] },
      }}
      transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.23, 1, 0.32, 1] }}
    >
      <div>
        <strong>Custom range</strong>
        <span>Demo records are available from 1 to 30 June 2026.</span>
      </div>
      <label>
        <span>From</span>
        <input type="date" min={DEMO_HISTORY_RANGE.from} max={DEMO_HISTORY_RANGE.to} value={value.from} onChange={(event) => onChange({ ...value, from: event.target.value })} />
      </label>
      <label>
        <span>To</span>
        <input type="date" min={DEMO_HISTORY_RANGE.from} max={DEMO_HISTORY_RANGE.to} value={value.to} onChange={(event) => onChange({ ...value, to: event.target.value })} />
      </label>
      <ProductButton variant="primary" size="compact" onClick={onApply} disabled={invalid}>View range</ProductButton>
      <button type="button" className="custom-range-close" onClick={onClose} aria-label="Close custom range"><X aria-hidden /></button>
    </motion.section>
  );
}

function ResultExplanationView({
  backLabel,
  resultLabel,
  title,
  numbersActionLabel,
  rows,
  week,
  onBack,
  onFullNumbers,
}: {
  backLabel: string;
  resultLabel: string;
  title: string;
  numbersActionLabel: string;
  rows: LedgerRow[];
  week: Week;
  onBack: () => void;
  onFullNumbers: () => void;
}) {
  const actual = totalCells(rows, "actual");
  const budget = totalCells(rows, "predicted");
  const difference = actual.net - budget.net;
  const drivers = profitDrivers(actual, budget, week);
  const leadDriver = drivers[0];
  const leadDriverInsight = leadDriver?.key === "revenue"
    ? "Revenue did most of the pulling."
    : leadDriver?.key === "wages"
      ? "Wages moved profit the most."
      : leadDriver?.key === "cogs"
        ? "Your cost of goods rate moved profit the most."
        : "Your other costs made the biggest difference.";
  const matchedBudget = Math.abs(difference) < 0.5;

  return (
    <div className="detail-view result-explanation-view">
      <ViewBack label={backLabel} onClick={onBack} />
      <div className="detail-title-row">
        <div>
          <h1>
            <span className="detail-title-full">{title}</span>
            <span className="detail-title-compact">What happened?</span>
          </h1>
          <p>Your result, without the spreadsheet.</p>
        </div>
      </div>

      <section className="result-explanation-panel" aria-labelledby="result-explanation-headline">
        <div className="result-explanation-answer">
          <BirdeeMascot state={difference >= 0 ? "profit" : "loss"} variant={difference < 0 ? "concerned" : undefined} size={88} />
          <div className="result-explanation-verdict">
            <h2 id="result-explanation-headline">
              {matchedBudget ? (
                "Profit matched budget."
              ) : (
                <>
                  Profit finished{" "}
                  <strong className={difference >= 0 ? "good" : "bad"}>{money(Math.abs(difference))}</strong>{" "}
                  {difference >= 0 ? "ahead of" : "behind"} budget.
                </>
              )}
            </h2>
            <p className="result-explanation-comparison">
              <span>Estimated <strong className={`tnum ${actual.net >= 0 ? "good" : "bad"}`}>{signedProfit(actual.net)}</strong></span>
              <i aria-hidden>{"\u00b7"}</i>
              <span>Budget <strong className={`tnum ${budget.net >= 0 ? "good" : "bad"}`}>{signedProfit(budget.net)}</strong></span>
            </p>
          </div>
        </div>

        <div className="result-explanation-evidence">
          <div className="bridge-section-head">
            <h3>Biggest drivers</h3>
          </div>

          <div className="profit-bridge" role="list" aria-label="How budget profit became estimated profit">
            <BridgeStep kind="start" label="Budget profit" value={budget.net} />
            {drivers.map((driver) => (
              <BridgeStep key={driver.key} kind="driver" label={driver.label} value={driver.impact} detail={driver.detail} />
            ))}
            <BridgeStep kind="finish" label="Estimated profit" value={actual.net} />
          </div>

          <div className="result-driver-insight">
            <BirdeeMascot state={difference >= 0 ? "profit" : "loss"} variant={difference < 0 ? "concerned" : undefined} size={78} />
            <p>{leadDriverInsight}</p>
          </div>
          <p className="bridge-note">Revenue impact includes GST and budgeted COGS.</p>
        </div>
      </section>

      <div className="detail-footer">
        <ProductButton
          variant="tertiary"
          size="compact"
          onClick={onFullNumbers}
          trailingIcon={<ArrowRight weight="bold" />}
        >
          <span className="result-action-full">{numbersActionLabel}</span>
        </ProductButton>
      </div>
    </div>
  );
}

type ProfitDriver = {
  key: string;
  label: string;
  detail: string;
  impact: number;
};

function profitDrivers(actual: DayCell, budget: DayCell, week: Week): ProfitDriver[] {
  const revenueDelta = actual.rev - budget.rev;
  const wageDelta = actual.lab - budget.lab;
  const fixedDelta = actual.fix - budget.fix;
  const revenueImpact =
    revenueExGst(week, actual.rev) -
    revenueExGst(week, budget.rev) -
    (cogsForRevenue(week, actual.rev) -
      cogsForRevenue(week, budget.rev));
  const expectedActualCogs = cogsForRevenue(week, actual.rev);
  const cogsRateImpact = -(actual.cogs - expectedActualCogs);
  const wageImpact = -wageDelta;
  const fixedImpact = -fixedDelta;

  const candidates: ProfitDriver[] = [
    {
      key: "revenue",
      label: "Revenue",
      detail: `${money(revenueDelta)} ${revenueDelta >= 0 ? "above" : "below"} budget`,
      impact: revenueImpact,
    },
    {
      key: "cogs",
      label: "COGS rate",
      detail: `${money(actual.cogs - expectedActualCogs)} ${actual.cogs <= expectedActualCogs ? "under" : "over"} budget`,
      impact: cogsRateImpact,
    },
    {
      key: "wages",
      label: "Wages",
      detail: `${money(wageDelta)} ${wageDelta <= 0 ? "under" : "over"} budget`,
      impact: wageImpact,
    },
    {
      key: "fixed",
      label: "Fixed & variable",
      detail: `${money(fixedDelta)} ${fixedDelta <= 0 ? "under" : "over"} budget`,
      impact: fixedImpact,
    },
  ].filter((driver) => Math.abs(driver.impact) >= 0.5);

  const explained = candidates.reduce((sum, driver) => sum + driver.impact, 0);
  const difference = actual.net - budget.net;
  const residual = difference - explained;
  if (Math.abs(residual) >= 0.5) {
    candidates.push({ key: "residual", label: "Other", detail: "Other small movements", impact: residual });
  }

  const sorted = candidates.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  if (sorted.length <= 3) return sorted;
  const visible = sorted.slice(0, 2);
  const otherImpact = sorted.slice(2).reduce((sum, driver) => sum + driver.impact, 0);
  return [...visible, { key: "combined-other", label: "Other", detail: "Remaining movements combined", impact: otherImpact }];
}

function BridgeStep({ kind, label, value, detail }: {
  kind: "start" | "driver" | "finish";
  label: string;
  value: number;
  detail?: string;
}) {
  const MovementIcon = value >= 0 ? ArrowUp : ArrowDown;

  return (
    <div className={`bridge-step is-${kind} ${kind !== "start" ? value >= 0 ? "is-positive" : "is-negative" : ""}`} role="listitem">
      <span className="bridge-node" aria-hidden>
        {kind === "start" ? <Wallet weight="bold" /> : kind === "finish" ? <ChartBar weight="bold" /> : <MovementIcon weight="bold" />}
      </span>
      <span className="bridge-step-copy">
        <strong>{label}</strong>
      </span>
      <span className="bridge-step-value">
        <strong className={`tnum ${value >= 0 ? "good" : "bad"}`}>{signedProfit(value)}</strong>
      </span>
      {detail && <small className="bridge-step-detail">{detail}</small>}
    </div>
  );
}

function WhatIfView({
  periodTitle,
  week,
  onBack,
}: {
  periodTitle: string;
  week: Week;
  onBack: () => void;
}) {
  const [activeDriver, setActiveDriver] = useState<Driver>("revenue");
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [adjustmentDrafts, setAdjustmentDrafts] = useState<Record<Driver, string>>(DEFAULT_ADJUSTMENT_DRAFTS);
  const reduceMotion = useReducedMotion();
  const active = adjustments[activeDriver];
  const activeDraft = adjustmentDrafts[activeDriver];

  const baseline = profit(week);
  const scenarioWeek = applyScenario(week, adjustments);
  const scenarioResult = profit(scenarioWeek);
  const change = scenarioResult - baseline;
  const config = sliderConfig(activeDriver, active.mode, week);
  const bounds = adjustmentBounds(activeDriver, active.mode, week);
  const parsedDraft = parseAdjustmentDraft(activeDraft);
  const draftError = adjustmentDraftError(activeDraft, parsedDraft, bounds, activeDriver, active.mode);
  const sliderMin = Math.min(config.min, active.value);
  const sliderMax = Math.max(config.max, active.value);
  const estimatedHours =
    activeDriver === "wages" &&
    active.mode === "dollar" &&
    week.loadedHourlyLabourCost
    ? Math.abs(active.value / week.loadedHourlyLabourCost)
    : 0;
  const scenarioDeltaCopy = Math.abs(change) < 0.5
    ? "Same as now"
    : `${signedProfit(change)} ${change >= 0 ? "better" : "worse"} than now`;
  const activeResultCopy = scenarioDriverResultCopy(activeDriver, scenarioWeek, active.value === 0);
  const activeInputUnit = activeDriver === "cogs" ? "pts" : active.mode === "percent" ? "%" : "$";
  const activeInputId = `what-if-${activeDriver}-value`;
  const activeInputHelpId = `what-if-${activeDriver}-value-help`;

  const setActiveMode = (mode: DriverMode) => {
    setAdjustments((current) => ({
      ...current,
      [activeDriver]: { value: 0, mode },
    }));
    setAdjustmentDrafts((current) => ({ ...current, [activeDriver]: "0" }));
  };

  const setActiveValue = (value: number, syncDraft = true) => {
    const nextValue = clampAdjustment(value, bounds);
    setAdjustments((current) => ({
      ...current,
      [activeDriver]: { ...current[activeDriver], value: nextValue },
    }));
    if (syncDraft) {
      setAdjustmentDrafts((current) => ({
        ...current,
        [activeDriver]: formatAdjustmentInput(nextValue),
      }));
    }
  };

  const updateActiveDraft = (value: string) => {
    setAdjustmentDrafts((current) => ({ ...current, [activeDriver]: value }));
    const parsed = parseAdjustmentDraft(value);
    if (parsed == null || adjustmentDraftError(value, parsed, bounds, activeDriver, active.mode)) return;
    setActiveValue(parsed, false);
  };

  const commitActiveDraft = () => {
    const parsed = parseAdjustmentDraft(activeDraft);
    setActiveValue(parsed == null ? active.value : parsed);
  };

  const resetScenario = () => {
    setAdjustments({
      revenue: { value: 0, mode: "dollar" },
      cogs: { value: 0, mode: "percent" },
      wages: { value: 0, mode: "dollar" },
      fixed: { value: 0, mode: "dollar" },
    });
    setAdjustmentDrafts(DEFAULT_ADJUSTMENT_DRAFTS);
    setActiveDriver("revenue");
  };

  const driverSummary = (driver: Driver) => {
    if (driver === "cogs") return `${scenarioWeek.cogs}%`;
    return formatAdjustment(driver, adjustments[driver]);
  };

  const driverTone = (driver: Driver, value: number) => {
    if (value === 0) return "";
    const helpsProfit = driver === "revenue" ? value > 0 : value < 0;
    return helpsProfit ? "good" : "bad";
  };

  const driverHint: Record<Driver, string> = {
    revenue: "See what a little more revenue could do.",
    wages: "Try a roster change and see where profit lands.",
    cogs: "Test a different cost-of-goods rate.",
    fixed: "See how an overhead change affects this period.",
  };

  return (
    <div className="what-if-view">
      <ViewBack label={periodTitle} onClick={onBack} />

      <p className="what-if-notice">
        <ShieldCheck weight="regular" aria-hidden />
        <span>Temporary — nothing here changes your reports.</span>
      </p>

      <main className="what-if-workspace">
        <section className="what-if-result-card" aria-labelledby="scenario-profit-title">
          <div className="what-if-result-main">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetPath("/brand/birdee-what-if-calculator-v1.png")}
              alt="Little Birdee checking a calculator"
              className="what-if-birdee"
            />
            <div className="what-if-result-copy">
              <span id="scenario-profit-title">Scenario profit</span>
              <strong className="tnum">{signedProfit(scenarioResult)}</strong>
              <em className={change >= 0 ? "good" : "bad"}>{scenarioDeltaCopy}</em>
            </div>
          </div>
          <div className="what-if-baseline">
            <span>Right now <small>{periodTitle}</small></span>
            <strong className="tnum">{signedProfit(baseline)}</strong>
          </div>
        </section>

        <section className="what-if-adjuster" aria-labelledby="try-a-change-title">
          <h2 id="try-a-change-title">Try a change</h2>
          <div className="what-if-accordion">
            {(Object.keys(DRIVER_LABELS) as Driver[]).map((driver) => {
              const Icon = DRIVER_ICONS[driver];
              const isActive = activeDriver === driver;
              const panelId = `what-if-${driver}-controls`;
              const value = adjustments[driver];
              const tone = driverTone(driver, value.value);

              return (
                <section className={`what-if-driver ${isActive ? "is-active" : ""}`} key={driver}>
                  <button
                    type="button"
                    className="what-if-driver-row"
                    onClick={() => setActiveDriver(driver)}
                    aria-expanded={isActive}
                    aria-controls={panelId}
                  >
                    <span className={`what-if-driver-icon is-${driver}`}><Icon weight="regular" /></span>
                    <span className="what-if-driver-label">{DRIVER_LABELS[driver]}</span>
                    <strong className={`tnum ${tone === "good" ? "is-positive" : tone === "bad" ? "is-negative" : ""}`}>{driverSummary(driver)}</strong>
                    {isActive ? <CaretUp weight="bold" aria-hidden /> : <CaretDown weight="bold" aria-hidden />}
                  </button>

                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        id={panelId}
                        className="what-if-driver-control"
                        initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div className="what-if-control-inner">
                          {activeDriver !== "cogs" && (
                            <div className="what-if-mode-row">
                              <span>Adjust by</span>
                              <div className="mode-control" role="group" aria-label="Choose adjustment unit">
                                <button type="button" className={active.mode === "dollar" ? "is-active" : ""} onClick={() => setActiveMode("dollar")}>$</button>
                                <button type="button" className={active.mode === "percent" ? "is-active" : ""} onClick={() => setActiveMode("percent")}>%</button>
                              </div>
                            </div>
                          )}

                          <div className="what-if-stepper">
                            <button
                              type="button"
                              aria-label={`Decrease ${DRIVER_LABELS[activeDriver]}`}
                              onClick={() => setActiveValue(active.value - config.step)}
                            >
                              <Minus weight="regular" />
                            </button>
                            <label className="what-if-value-entry" htmlFor={activeInputId}>
                              <span>Change by</span>
                              <span className={`what-if-number-field ${draftError ? "has-error" : ""} ${driverTone(activeDriver, active.value)}`}>
                                {activeInputUnit === "$" && <i aria-hidden>$</i>}
                                <input
                                  id={activeInputId}
                                  className="tnum"
                                  type="text"
                                  inputMode="decimal"
                                  value={activeDraft}
                                  onChange={(event) => updateActiveDraft(event.target.value)}
                                  onBlur={commitActiveDraft}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") event.currentTarget.blur();
                                  }}
                                  aria-label={`${DRIVER_LABELS[activeDriver]} change`}
                                  aria-invalid={Boolean(draftError)}
                                  aria-describedby={activeInputHelpId}
                                />
                                {activeInputUnit !== "$" && <i aria-hidden>{activeInputUnit}</i>}
                              </span>
                              <small id={activeInputHelpId} className={draftError ? "is-error" : ""}>
                                {draftError ?? activeResultCopy}
                              </small>
                            </label>
                            <button
                              type="button"
                              aria-label={`Increase ${DRIVER_LABELS[activeDriver]}`}
                              onClick={() => setActiveValue(active.value + config.step)}
                            >
                              <Plus weight="regular" />
                            </button>
                          </div>

                          <input
                            className="what-if-range"
                            type="range"
                            min={sliderMin}
                            max={sliderMax}
                            step={config.step}
                            value={active.value}
                            onChange={(event) => setActiveValue(Number(event.target.value))}
                            aria-label={`Adjust ${DRIVER_LABELS[activeDriver]}`}
                            aria-valuetext={formatAdjustment(activeDriver, active)}
                          />
                          <p>{driverHint[activeDriver]}</p>
                          {estimatedHours > 0 && <small>About {estimatedHours.toFixed(1)} loaded labour hours in this period.</small>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              );
            })}
          </div>

          <div className="what-if-actions">
            <ProductButton
              variant="tertiary"
              size="compact"
              className="what-if-reset"
              onClick={resetScenario}
              leadingIcon={<ArrowCounterClockwise weight="bold" />}
            >
              Reset
            </ProductButton>
            <ProductButton variant="secondary" size="compact" className="what-if-done" onClick={onBack}>
              Close scenario
            </ProductButton>
          </div>
        </section>
      </main>
    </div>
  );
}

function FullNumbersView({
  backLabel,
  title,
  rows,
  week,
  mode,
  rowLabel,
  onBack,
  onSelectDay,
}: {
  backLabel: string;
  title: string;
  rows: LedgerRow[];
  week: Week;
  mode: "week" | "day" | "history";
  rowLabel: "Day" | "Week";
  onBack: () => void;
  onSelectDay: (index: number) => void;
}) {
  const [activeView, setActiveView] = useState<"overview" | "detail">("overview");
  const [showAllNumbers, setShowAllNumbers] = useState(mode === "day");
  const completed = rows.filter((row) => row.actual);
  const actual = totalCells(completed, "actual");
  const budgetToDate = totalCells(completed, "predicted");
  const scopeBudget = totalCells(rows, "predicted");
  const isFutureScope = rows.length > 0 && rows.every((row) => !row.actual);
  const displayedResult = isFutureScope ? scopeBudget : actual;
  const comparisonBudget = isFutureScope ? scopeBudget : budgetToDate;
  const difference = displayedResult.net - comparisonBudget.net;
  const be = scopeBreakeven(rows, week);
  const breakEvenDelta = scopeBudget.rev - be.breakeven;
  const isShortOfBreakEven = breakEvenDelta < 0;
  const breakEvenGap = Math.abs(breakEvenDelta);
  const breakEvenScale = Math.max(1, scopeBudget.rev, be.breakeven);
  const revenuePlanPosition = Math.min(100, (scopeBudget.rev / breakEvenScale) * 100);
  const breakEvenPosition = Math.min(100, (be.breakeven / breakEvenScale) * 100);
  const gapPosition = (revenuePlanPosition + breakEvenPosition) / 2;
  const wagesPct = scopeBudget.netRevenue > 0
    ? (scopeBudget.lab / scopeBudget.netRevenue) * 100
    : 0;
  const scopeKicker = mode === "day"
    ? "Day outlook"
    : mode === "history"
      ? "Selected-range outlook"
      : "Full-week outlook";
  const breakEvenStatus = `${money(breakEvenGap)} ${isShortOfBreakEven ? "short of" : "above"} break-even`;
  const breakEvenSupport = isShortOfBreakEven
    ? "Your revenue plan is close, but it does not cover the current cost mix yet."
    : "Your revenue plan clears the current cost mix."
  const breakEvenCallout = isShortOfBreakEven
    ? `At this cost mix, you need another ${money(breakEvenGap)} in revenue to reach $0 profit.`
    : `At this cost mix, the plan clears break-even by ${money(breakEvenGap)}.`;
  const enteredRows = rows.filter((row) => row.actual).length;
  const currentRow = rows.find((row) => row.status === "today");
  const isDailyDetail = rowLabel === "Day";
  const detailTitle = isDailyDetail ? "Daily profit" : "Weekly profit";
  const detailSummary = isDailyDetail
    ? `${enteredRows} of ${rows.length} days entered${currentRow ? ` · Today is ${fullDayName(currentRow.label)}` : ""}`
    : `${enteredRows} ${enteredRows === 1 ? "week" : "weeks"} in this range`;

  return (
    <>
      <div className="full-numbers-view">
      <div className="full-numbers-heading">
        <ViewBack label={backLabel} onClick={onBack} />
        <h1>{title}</h1>
      </div>

      <section className={`full-profit-hero is-${mode}`} aria-labelledby="full-profit-value">
        <BirdeeMascot
          state={difference >= 0 ? "profit" : "loss"}
          variant={difference < 0 ? "concerned" : undefined}
          size={122}
          className="full-profit-birdee"
        />
        <div className="full-profit-result">
          <strong
            id="full-profit-value"
            className={`tnum ${displayedResult.net >= 0 ? "good" : "bad"}`}
          >
            {signedProfit(displayedResult.net)}
          </strong>
          <span>
            {isFutureScope
              ? "Forecast profit"
              : mode === "week"
                ? "Estimated profit to date"
                : "Estimated profit"}
          </span>
        </div>
        <div className="full-profit-comparison">
          <p>
            {Math.abs(difference) < 0.5 ? (
              "Right on budget."
            ) : (
              <>
                You&apos;re <strong className={difference >= 0 ? "good" : "bad"}>{money(Math.abs(difference))}</strong>{" "}
                {difference >= 0 ? "ahead of" : "behind"} budget.
              </>
            )}
          </p>
          <span>
            <strong className="tnum">{signedProfit(comparisonBudget.net)}</strong>{" "}
            {isFutureScope ? "from your budget" : mode === "week" ? "budget to date" : "budget"}
          </span>
        </div>
      </section>

      {mode !== "day" && (
        <div className="full-numbers-tabs" role="tablist" aria-label="Numbers view">
          <button
            type="button"
            role="tab"
            aria-selected={activeView === "overview"}
            className={activeView === "overview" ? "is-active" : ""}
            onClick={() => setActiveView("overview")}
          >
            <Check weight="bold" aria-hidden />
            Overview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === "detail"}
            className={activeView === "detail" ? "is-active" : ""}
            onClick={() => setActiveView("detail")}
          >
            By {rowLabel.toLowerCase()}
          </button>
        </div>
      )}

      {(mode === "day" || activeView === "overview") ? (
        <div className="full-numbers-layout" role="tabpanel" aria-label="Overview">
          <ReconciliationTable
            actual={displayedResult}
            budget={comparisonBudget}
            gstActual={displayedResult.gst}
            gstBudget={comparisonBudget.gst}
            actualLabel={isFutureScope ? "Forecast" : "Result"}
            expanded={showAllNumbers}
            onToggle={() => setShowAllNumbers((current) => !current)}
          />

          <section className={`break-even-panel ${isShortOfBreakEven ? "is-short" : "is-clear"}`} aria-labelledby="break-even-title">
            <header className="break-even-title">
              <span>{scopeKicker}</span>
              <h2 id="break-even-title">Break-even picture</h2>
            </header>

            <p className="break-even-status">
              <strong className="tnum">{money(breakEvenGap)}</strong>{" "}
              {isShortOfBreakEven ? "short of" : "above"} break-even
            </p>
            <p className="break-even-support">{breakEvenSupport}</p>

            <div
              className="break-even-comparison"
              role="img"
              aria-label={`Revenue plan ${money(scopeBudget.rev)}. Break-even ${money(be.breakeven)}. ${breakEvenStatus}.`}
            >
              <div className="break-even-comparison-labels">
                <span>Revenue plan<strong className="tnum">{money(scopeBudget.rev)}</strong></span>
                <span>Break-even<strong className="tnum">{money(be.breakeven)}</strong></span>
              </div>
              <div
                className="break-even-track"
                style={{
                  "--revenue-plan-position": `${revenuePlanPosition}%`,
                  "--break-even-position": `${breakEvenPosition}%`,
                  "--gap-position": `${gapPosition}%`,
                } as CSSProperties}
              >
                <span className="break-even-progress" />
                <span className="break-even-plan-marker" />
                <span className="break-even-threshold-marker" />
                {breakEvenGap >= 0.5 && (
                  <span className="break-even-gap-label">{money(breakEvenGap)} gap</span>
                )}
              </div>
            </div>

            <div className="break-even-cost-context">
              <div><span>Wages</span><strong className="tnum">{wagesPct.toFixed(1)}%</strong><small>of net revenue</small></div>
              <div><span>COGS rate</span><strong className="tnum">{week.cogs.toFixed(1)}%</strong><small>of revenue excluding GST</small></div>
            </div>

            <div className="break-even-callout">
              <BirdeeMascot state="neutral" size={42} />
              <p>{breakEvenCallout}</p>
            </div>
          </section>
        </div>
      ) : (
        <section className="daily-numbers-panel full-numbers-detail-panel" role="tabpanel" aria-label={`By ${rowLabel.toLowerCase()}`}>
          <header className="daily-panel-heading">
            <div>
              <h2>{detailTitle}</h2>
              <p>{detailSummary}</p>
            </div>
            {isDailyDetail && <span>Open a completed day for its full breakdown.</span>}
          </header>
          <div className="daily-table-head"><span>{rowLabel}</span><span>Estimated</span><span>Budget</span><span>Vs budget</span></div>
          {rows.map((row) => {
            const delta = row.variance?.net ?? 0;
            const canOpen = Boolean(row.actual && mode === "week");
            const isAhead = delta >= 0;
            const statusLabel = row.actual
              ? isAhead ? "Ahead" : "Behind"
              : row.status === "today" ? "Today" : "Upcoming";
            const rowClassName = [
              "daily-table-row",
              row.actual ? "is-complete" : "",
              canOpen ? "is-actionable" : "",
              `is-${row.status}`,
            ].filter(Boolean).join(" ");
            const rowContent = (
              <>
                <span className="daily-day-cell">
                  <strong>{isDailyDetail ? fullDayName(row.label) : row.label}</strong>
                  <span className={`daily-status ${row.actual ? isAhead ? "is-ahead" : "is-behind" : row.status === "today" ? "is-current" : "is-upcoming"}`}>
                    {row.actual && (isAhead ? <Check weight="bold" aria-hidden /> : <ArrowDown weight="bold" aria-hidden />)}
                    {!row.actual && <i aria-hidden />}
                    {statusLabel}
                  </span>
                </span>
                <strong className={`tnum daily-actual ${row.actual ? row.actual.net >= 0 ? "good" : "bad" : "daily-empty"}`}>
                  {row.actual ? signedProfit(row.actual.net) : row.status === "today" ? "Not entered" : "Not yet"}
                </strong>
                <span className="tnum daily-budget">{signedProfit(row.predicted.net)}</span>
                <span className={`daily-variance ${row.actual ? isAhead ? "good" : "bad" : "daily-empty"}`}>
                  {row.actual ? (
                    <>
                      <strong className="tnum">{money(Math.abs(delta))}</strong>
                      <small>{isAhead ? "ahead" : "behind"}</small>
                    </>
                  ) : (
                    <strong aria-label="No comparison yet">—</strong>
                  )}
                  {canOpen && <ArrowRight className="daily-row-arrow" weight="bold" aria-hidden />}
                </span>
              </>
            );

            return canOpen ? (
              <button
                type="button"
                key={row.index}
                className={rowClassName}
                onClick={() => onSelectDay(row.index)}
                aria-label={`View ${fullDayName(row.label)} details`}
              >
                {rowContent}
              </button>
            ) : (
              <div className={rowClassName} key={row.index}>
                {rowContent}
              </div>
            );
          })}
        </section>
      )}

      </div>

      {typeof document !== "undefined" && createPortal(
        <div className="full-numbers-mobile-dock" aria-label="Full numbers action">
          <ProductButton
            href="/setup"
            variant="primary"
            fullWidth
            leadingIcon={<PencilSimpleLine weight="bold" />}
          >
            Update numbers
          </ProductButton>
        </div>,
        document.body,
      )}
    </>
  );
}

function DayVerdictView({
  row,
  rows,
  periodTitle,
  onBack,
  onExplain,
  onSelectDay,
}: {
  row: LedgerRow;
  rows: LedgerRow[];
  periodTitle: string;
  onBack: () => void;
  onExplain: () => void;
  onSelectDay: (index: number) => void;
}) {
  const actual = row.actual as DayCell;
  const difference = actual.net - row.predicted.net;
  const dayName = fullDayName(row.label);
  const verdict = Math.abs(difference) < 0.5
    ? `${dayName} matched budget.`
    : `${dayName} finished ${money(Math.abs(difference))} ${difference >= 0 ? "ahead of" : "behind"} budget.`;
  return (
    <div className="day-verdict-view">
      <ViewBack label={periodTitle} onClick={onBack} />
      <div className="day-title"><h1>{dayName}</h1><span className={difference >= 0 ? "status-check" : "status-concern"}>{difference >= 0 ? <Check weight="bold" /> : "•"}</span></div>
      <section className="day-verdict-strip" aria-labelledby="day-verdict-headline">
        <div className="day-verdict-answer">
          <BirdeeMascot state={difference >= 0 ? "profit" : "loss"} size={116} />
          <div>
            <h2 id="day-verdict-headline">{verdict}</h2>
            <span>Estimated profit</span>
            <strong className={`tnum ${actual.net >= 0 ? "good" : "bad"}`}>{signedProfit(actual.net)}</strong>
          </div>
        </div>
        <div className="day-verdict-comparison">
          <div><span>Budget</span><strong className="tnum">{signedProfit(row.predicted.net)}</strong></div>
          <div><span>Difference</span><strong className={`tnum ${difference >= 0 ? "good" : "bad"}`}>{signedProfit(difference)}</strong></div>
          <ProductButton variant="primary" className="primary-action" onClick={onExplain} leadingIcon={<ChartLineUp size={20} weight="bold" />}>
            What happened
          </ProductButton>
        </div>
      </section>
      <div className="day-verdict-rail"><DayRail rows={rows} selectedDay={row.index} onSelect={onSelectDay} compact /></div>
    </div>
  );
}

function FlightPathLegend() {
  return (
    <div className="flight-path-legend" aria-label="Budget performance legend">
      <span><i className="is-ahead"><ArrowUp weight="bold" /></i>Ahead of budget</span>
      <span><i className="is-behind"><ArrowDown weight="bold" /></i>Behind budget</span>
      <span><i className="is-on-budget"><Minus weight="bold" /></i>On budget</span>
      <span><i className="is-pending" />Not done yet</span>
    </div>
  );
}

function DayRail({
  rows,
  selectedDay,
  onSelect,
  onOpenSelected,
  compact = false,
}: {
  rows: LedgerRow[];
  selectedDay: number | null;
  onSelect: (index: number) => void;
  onOpenSelected?: () => void;
  compact?: boolean;
}) {
  return (
    <div className={`day-rail ${compact ? "is-compact" : ""}`} role="list" aria-label="Profit by day">
      {rows.map((row) => (
        <DayScore
          key={row.index}
          row={row}
          selected={selectedDay === row.index}
          compact={compact}
          onSelect={() => row.actual && onSelect(row.index)}
          onOpen={selectedDay === row.index ? onOpenSelected : undefined}
        />
      ))}
    </div>
  );
}

function HistoryRail({ rows }: { rows: LedgerRow[] }) {
  return (
    <div className="history-rail" role="list" aria-label="Profit history by week">
      {rows.map((row) => {
        const actual = row.actual as DayCell;
        const difference = actual.net - row.predicted.net;
        return (
          <div className="history-score" role="listitem" key={`${row.index}-${row.label}`}>
            <span>{row.label}</span>
            <strong className={`tnum ${actual.net >= 0 ? "good" : "bad"}`}>{signedProfit(actual.net)}</strong>
            <small>Budget {signedProfit(row.predicted.net)}</small>
            <em className={`tnum ${difference >= 0 ? "good" : "bad"}`}>{signedProfit(difference)}</em>
          </div>
        );
      })}
    </div>
  );
}

function DayScore({
  row,
  selected,
  compact,
  onSelect,
  onOpen,
}: {
  row: LedgerRow;
  selected: boolean;
  compact: boolean;
  onSelect: () => void;
  onOpen?: () => void;
}) {
  const actual = row.actual?.net;
  const difference = row.variance?.net;
  const isCompleted = actual != null;
  const isToday = row.status === "today";

  if (compact) {
    return (
      <button
        type="button"
        role="listitem"
        className={`day-score ${selected ? "is-selected" : ""} ${!isCompleted ? "is-upcoming" : ""}`}
        onClick={onSelect}
        disabled={!isCompleted}
        aria-pressed={selected}
      >
        <span className="day-name">{row.label}</span>
        <span className={`day-dot ${isCompleted ? (difference ?? 0) >= 0 ? "is-good" : "is-behind" : ""}`}>
          {isCompleted ? <Check weight="bold" /> : ""}
        </span>
      </button>
    );
  }

  const performance = !isCompleted
    ? "pending"
    : Math.round(difference ?? 0) === 0
      ? "on-budget"
      : (difference ?? 0) > 0
        ? "ahead"
        : "behind";
  const PerformanceIcon = performance === "ahead"
    ? ArrowUp
    : performance === "behind"
      ? ArrowDown
      : Minus;
  const performanceLabel = performance === "ahead"
    ? "ahead"
    : performance === "behind"
      ? "behind"
      : performance === "on-budget"
        ? "on budget"
        : isToday
          ? "Today"
          : "Not done yet";

  return (
    <div
      role="listitem"
      className={`day-flight-stop is-${performance} ${selected ? "is-selected" : ""}`}
    >
      <button
        type="button"
        className="day-flight-trigger"
        onClick={onSelect}
        disabled={!isCompleted}
        aria-pressed={selected}
        aria-label={isCompleted
          ? `${fullDayName(row.label)}, ${signedProfit(difference ?? 0)} ${performanceLabel} budget`
          : `${fullDayName(row.label)}, ${performanceLabel}`}
      >
        <span className="day-name">{row.label}</span>
        <span className="day-flight-marker" aria-hidden="true">
          {isCompleted && <PerformanceIcon weight="bold" />}
        </span>
        {isCompleted ? (
          <>
            <strong className="tnum day-flight-variance">{signedProfit(difference ?? 0)}</strong>
            <small>{performanceLabel}</small>
          </>
        ) : (
          <small>{performanceLabel}</small>
        )}
      </button>

      {selected && isCompleted && (
        <div className="day-flight-breakdown" aria-label={`${fullDayName(row.label)} budget breakdown`}>
          <strong>{fullDayName(row.label)}</strong>
          <dl>
            <div><dt>Estimated</dt><dd className="tnum">{signedProfit(actual)}</dd></div>
            <div><dt>Budget</dt><dd className="tnum">{signedProfit(row.predicted.net)}</dd></div>
          </dl>
          <p className={`tnum is-${performance}`}>
            {money(Math.abs(difference ?? 0))} {performanceLabel} budget
          </p>
          {onOpen && (
            <button
              type="button"
              className="day-breakdown-action"
              onClick={onOpen}
              aria-label={`See ${fullDayName(row.label)} numbers`}
            >
              See {fullDayName(row.label)}&rsquo;s numbers
              <ArrowRight weight="bold" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ReconciliationTable({
  actual,
  budget,
  gstActual,
  gstBudget,
  actualLabel,
  expanded,
  onToggle,
}: {
  actual: DayCell;
  budget: DayCell;
  gstActual: number;
  gstBudget: number;
  actualLabel: "Result" | "Forecast";
  expanded: boolean;
  onToggle: () => void;
}) {
  const rows = [
    {
      key: "revenue",
      label: "Revenue",
      actual: actual.rev,
      budget: budget.rev,
      variance: actual.rev - budget.rev,
      positive: "above budget",
      negative: "below budget",
      driver: true,
      evidence: actual.componentProvenance.revenue,
    },
    {
      key: "other-income",
      label: "Recurring other income",
      actual: actual.otherIncome,
      budget: budget.otherIncome,
      variance: actual.otherIncome - budget.otherIncome,
      positive: "above budget",
      negative: "below budget",
      driver: false,
      evidence: actual.componentProvenance.recurringIncome,
    },
    {
      key: "cogs",
      label: "COGS",
      actual: -actual.cogs,
      budget: -budget.cogs,
      variance: 0,
      positive: "rate lower",
      negative: "rate higher",
      neutralLabel: "rate unchanged",
      driver: false,
      evidence: actual.componentProvenance.cogs,
    },
    {
      key: "wages",
      label: "Wages",
      actual: -actual.lab,
      budget: -budget.lab,
      variance: budget.lab - actual.lab,
      positive: "better than budget",
      negative: "over budget",
      driver: true,
      evidence: actual.componentProvenance.labour,
    },
    {
      key: "gst",
      label: "GST",
      actual: -gstActual,
      budget: -gstBudget,
      variance: 0,
      positive: "lower",
      negative: "higher",
      neutralLabel: "follows revenue",
      driver: false,
      evidence: actual.componentProvenance.gst,
    },
    {
      key: "fixed",
      label: "Fixed & variable",
      actual: -actual.fix,
      budget: -budget.fix,
      variance: budget.fix - actual.fix,
      positive: "better than budget",
      negative: "over budget",
      driver: false,
      evidence: actual.componentProvenance.otherCosts,
    },
    {
      key: "profit",
      label: "Estimated profit",
      actual: actual.net,
      budget: budget.net,
      variance: actual.net - budget.net,
      positive: "ahead of budget",
      negative: "behind budget",
      driver: false,
      evidence: actual.componentProvenance.profit,
    },
  ];
  const visibleRows = expanded ? rows : rows.filter((row) => row.driver);

  return (
    <section className={`numbers-reconciliation ${expanded ? "is-expanded" : "is-collapsed"}`} aria-labelledby="reconciliation-title">
      <div id="full-reconciliation-table" className="reconciliation-table" role="table" aria-label={`${actualLabel} compared with budget`}>
        <div className="reconciliation-head" role="row">
          <div role="columnheader">
            <h2 id="reconciliation-title">Where the gap came from</h2>
          </div>
          {expanded && (
            <>
              <span role="columnheader">{actualLabel}</span>
              <span role="columnheader">Budget</span>
              <span role="columnheader">Vs budget</span>
            </>
          )}
        </div>
        {visibleRows.map((item) => {
          const neutral = Math.abs(item.variance) < 0.5;
          const tone = neutral ? "neutral" : item.variance > 0 ? "good" : "bad";
          const descriptor = neutral ? item.neutralLabel ?? "on budget" : item.variance > 0 ? item.positive : item.negative;
          return (
            <div
              className={`reconciliation-row is-${item.key} ${item.driver ? "is-driver" : ""}`}
              role="row"
              key={item.key}
            >
              <span className="reconciliation-label">
                <strong>
                  {item.driver && <i aria-hidden="true" />}
                  {item.label}
                </strong>
                {expanded && (
                  <small>{componentEvidenceLabel(item.evidence)}</small>
                )}
              </span>
              <span className="tnum" data-label={actualLabel}>{reconciliationValue(item.actual)}</span>
              <span className="tnum" data-label="Budget">{reconciliationValue(item.budget)}</span>
              <span className="reconciliation-variance">
                <strong className={`tnum ${tone}`}>{varianceValue(item.variance)}</strong>
                <small>{descriptor}</small>
              </span>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className="numbers-disclosure"
        aria-expanded={expanded}
        aria-controls="full-reconciliation-table"
        onClick={onToggle}
      >
        {expanded ? "Hide numbers" : "See all numbers"}
        {expanded ? <CaretUp weight="bold" /> : <CaretDown weight="bold" />}
      </button>
    </section>
  );
}

function reconciliationValue(value: number) {
  return value >= 0 ? money(value) : signedProfit(value);
}

function componentEvidenceLabel(
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

function varianceValue(value: number) {
  return Math.abs(value) < 0.5 ? "$0" : money(Math.abs(value));
}

function ViewBack({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <ProductButton
      variant="tertiary"
      size="compact"
      className="view-back"
      onClick={onClick}
      leadingIcon={<ArrowLeft weight="bold" />}
    >
      {label}
    </ProductButton>
  );
}

function getChapterContent({ chapter, periodProfit, budgetDifference, projected, budget, isFuture, isHistory }: { chapter: Chapter; periodProfit: number; budgetDifference: number; projected: number; budget: number; isFuture: boolean; isHistory: boolean }) {
  if (chapter === "budget") return { label: "Compared with budget", value: isFuture ? 0 : budgetDifference, support: isFuture ? "No actual result yet" : budgetDifference >= 0 ? "Ahead of budget" : "Behind budget", tone: budgetDifference >= 0 ? "tone-positive" : "tone-concerned" };
  if (chapter === "week") return { label: isFuture ? "Your forecast" : isHistory ? "Period result" : "Projected profit", value: isFuture ? budget : projected, support: `Budget ${signedProfit(budget)}`, tone: projected >= 0 ? "tone-focused" : "tone-concerned" };
  return { label: isFuture ? "Your forecast" : "Your estimated profit", value: periodProfit, support: isFuture ? "From the numbers you entered" : isHistory ? "Estimated EBITDA for this range" : "Available actuals, with remaining costs estimated", tone: periodProfit >= 0 ? "tone-positive" : "tone-concerned" };
}

function totalCells(
  rows: LedgerRow[],
  source: "actual" | "predicted" | "selected",
): DayCell {
  return rows.reduce<DayCell>((sum, row) => {
    const cell =
      source === "actual"
        ? row.actual
        : source === "selected"
          ? row.actual ?? row.predicted
          : row.predicted;
    if (!cell) return sum;
    return {
      rev: sum.rev + cell.rev,
      netRevenue: sum.netRevenue + cell.netRevenue,
      gst: sum.gst + cell.gst,
      cogs: sum.cogs + cell.cogs,
      lab: sum.lab + cell.lab,
      fix: sum.fix + cell.fix,
      otherIncome: sum.otherIncome + cell.otherIncome,
      net: sum.net + cell.net,
      resultStatus:
        sum.resultStatus === "forecast" || cell.resultStatus === "forecast"
          ? "forecast"
          : "estimated",
      componentProvenance: mergeComponentProvenance(
        sum.componentProvenance,
        cell.componentProvenance,
      ),
    };
  }, {
    rev: 0,
    netRevenue: 0,
    gst: 0,
    cogs: 0,
    lab: 0,
    fix: 0,
    otherIncome: 0,
    net: 0,
    resultStatus: source === "predicted" ? "forecast" : "estimated",
    componentProvenance: emptyComponentProvenance(
      source === "predicted" ? "forecast" : "estimated",
    ),
  });
}

function applyScenario(week: Week, adjustments: Adjustments): Week {
  const revenue = adjustments.revenue.mode === "dollar" ? week.rev + adjustments.revenue.value : week.rev * (1 + adjustments.revenue.value / 100);
  const wages = adjustments.wages.mode === "dollar" ? week.lab + adjustments.wages.value : week.lab * (1 + adjustments.wages.value / 100);
  const fixed = adjustments.fixed.mode === "dollar" ? week.fix + adjustments.fixed.value : week.fix * (1 + adjustments.fixed.value / 100);
  return { ...week, rev: Math.max(0, revenue), lab: Math.max(0, wages), fix: Math.max(0, fixed), cogs: Math.max(0, Math.min(99, week.cogs + adjustments.cogs.value)) };
}

type AdjustmentBounds = {
  min: number;
  max: number;
};

function driverBaseline(driver: Driver, week: Week) {
  if (driver === "revenue") return week.rev;
  if (driver === "wages") return week.lab;
  if (driver === "fixed") return week.fix;
  return week.cogs;
}

function adjustmentBounds(driver: Driver, mode: DriverMode, week: Week): AdjustmentBounds {
  if (driver === "cogs") {
    return { min: -week.cogs, max: 99 - week.cogs };
  }
  if (mode === "percent") {
    return { min: -100, max: Number.POSITIVE_INFINITY };
  }
  return { min: -driverBaseline(driver, week), max: Number.POSITIVE_INFINITY };
}

function clampAdjustment(value: number, bounds: AdjustmentBounds) {
  return Math.max(bounds.min, Math.min(bounds.max, value));
}

function parseAdjustmentDraft(value: string) {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized || ["-", "+", ".", "-.", "+."].includes(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatAdjustmentInput(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}

function adjustmentDraftError(
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

function scenarioDriverResultCopy(driver: Driver, scenarioWeek: Week, unchanged: boolean) {
  const prefix = unchanged ? "Current" : "New";
  if (driver === "revenue") return `${prefix} revenue ${money(scenarioWeek.rev)}`;
  if (driver === "wages") return `${prefix} wages ${money(scenarioWeek.lab)}`;
  if (driver === "fixed") return `${prefix} other costs ${money(scenarioWeek.fix)}`;
  return `${prefix} COGS rate ${formatAdjustmentInput(scenarioWeek.cogs)}%`;
}

function sliderConfig(driver: Driver, mode: DriverMode, week: Week) {
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

function formatAdjustment(driver: Driver, adjustment: Adjustment) {
  if (adjustment.value === 0) return "No change";
  const sign = adjustment.value > 0 ? "+" : "−";
  const amount = Math.abs(adjustment.value);
  if (driver === "cogs" || adjustment.mode === "percent") return `${sign}${amount}%`;
  return `${sign}${money(amount)}`;
}

function fullDayName(short: string) {
  return ({ Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" } as Record<string, string>)[short] ?? short;
}

function periodExplanationTitle(periodTitle: string) {
  if (periodTitle === "Yesterday") return "What happened yesterday?";
  if (periodTitle === "This week") return "What happened this week?";
  if (periodTitle === "Last week") return "What happened last week?";
  if (periodTitle === "Custom range") return "What happened in this range?";
  return `What happened in ${periodTitle}?`;
}

function periodNumbersActionLabel(periodTitle: string) {
  if (periodTitle === "Yesterday") return "See yesterday’s numbers";
  if (periodTitle === "This week") return "See this week’s numbers";
  if (periodTitle === "Last week") return "See last week’s numbers";
  if (periodTitle === "Custom range") return "See this range’s numbers";
  return `See ${periodTitle} numbers`;
}

function DashboardSkeleton() {
  return <div className="scoreboard-skeleton" aria-label="Loading dashboard"><div /><div /><div /></div>;
}

function DashboardLoadError({ message }: { message: string }) {
  return (
    <section className="scoreboard-load-error" role="alert">
      <BirdeeMascot state="loss" size={120} />
      <div>
        <h1>Birdee couldn&apos;t open this venue.</h1>
        <p>{message}</p>
        <ProductButton href="/account" variant="primary">
          Check my venue
        </ProductButton>
      </div>
    </section>
  );
}
