"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowCounterClockwise,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Buildings,
  CaretLeft,
  CaretRight,
  ChartLineUp,
  Check,
  Flask,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import { BirdeeMascot } from "@/components/BirdeeMascot";
import { ProductButton } from "@/components/ProductButton";
import {
  DEFAULTS,
  DEMO_HISTORY_RANGE,
  GST_DIVISOR,
  PERIODS,
  buildPeriodView,
  dailyLedger,
  hasSavedWeek,
  loadActuals,
  loadWeek,
  money,
  profit,
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
import "./scoreboard.css";

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
  cogs: ShoppingBag,
  wages: UsersThree,
  fixed: Buildings,
};

const DEFAULT_ADJUSTMENTS: Adjustments = {
  revenue: { value: 0, mode: "dollar" },
  cogs: { value: 0, mode: "percent" },
  wages: { value: -62, mode: "dollar" },
  fixed: { value: 0, mode: "dollar" },
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

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const params = useSearchParams();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const initialPeriod = periodFromParam(params.get("period"));
  const screenParam = params.get("view");
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
  const [screen, setScreen] = useState<Screen>(() => screenFromParam(screenParam));
  const [week, setWeek] = useState<Week>(DEFAULTS);
  const [actuals, setActuals] = useState<WeekActuals>(() => seedActuals(DEFAULTS));
  const [ready, setReady] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(dayParam);
  const [customRange, setCustomRange] = useState<HistoryRange>(initialRange);
  const [customDraft, setCustomDraft] = useState<HistoryRange>(initialRange);
  const [customOpen, setCustomOpen] = useState(false);

  useEffect(() => {
    if (!hasSavedWeek()) {
      router.replace("/home");
      return;
    }
    const savedWeek = loadWeek();
    const savedActuals = loadActuals(savedWeek);
    setWeek(savedWeek);
    setActuals(savedActuals);
    setReady(true);
  }, [router]);

  useEffect(() => {
    setPeriodKey(initialPeriod);
  }, [initialPeriod]);

  useEffect(() => {
    setScreen(screenFromParam(screenParam));
  }, [screenParam]);

  useEffect(() => {
    setChapter(chapterParam);
  }, [chapterParam]);

  useEffect(() => {
    if (initialPeriod !== "custom") return;
    setCustomRange(initialRange);
    setCustomDraft(initialRange);
  }, [initialPeriod, initialRange.from, initialRange.to]);

  const view = useMemo(
    () => buildPeriodView(periodKey, week, actuals, customRange),
    [periodKey, week, actuals, customRange],
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
    router.replace(`/app?${query.toString()}`, { scroll: false });
  };

  const selectPeriod = (key: PeriodKey) => {
    if (key === "custom") {
      setCustomOpen((current) => !current);
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

  const isFuture = periodKey === "next-week";
  const isHistory = view.scope === "history";
  const periodProfit = view.scope === "day"
    ? (ledger[view.dayIndex ?? 0]?.actual ?? ledger[view.dayIndex ?? 0]?.predicted).net
    : isFuture
      ? status.predictedNet
      : actualTotals.net;

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
            cogsPct={view.week.cogs}
            onBack={navigateBack}
            onFullNumbers={() => openChild("full-numbers", { scope: view.scope === "day" ? "day" : "period", day: selectedDay })}
          />
        );
      case "what-if":
        return (
          <WhatIfView
            periodTitle={view.title}
            week={view.week}
            baseline={status.projectedNet}
            scenarioDays={view.scenarioDays ?? (view.scope === "day" ? 1 : 7)}
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
            cogsPct={view.week.cogs}
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
          key={screen}
          className="scoreboard-screen"
          initial={reduceMotion ? false : { opacity: 0, x: 30, filter: "blur(5px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -18, filter: "blur(3px)" }}
          transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
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
  const yesterdayRow = periodKey === "yesterday" && selectedRow?.actual && selectedRow.variance
    ? selectedRow
    : null;
  const answerSupport = periodKey === "yesterday" && chapter === "revenue" && selectedRow
    ? `${fullDayName(selectedRow.label)}’s final result`
    : chapterContent.support;

  return (
    <div className={`dashboard-view ${chapterContent.tone}`}>
      <div className="dashboard-evidence">
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
            onPeriod={onPeriod}
          />
        </section>

        {customOpen && (
          <CustomRangePanel
            value={customDraft}
            onChange={onCustomDraft}
            onApply={onApplyCustom}
            onClose={onCloseCustom}
          />
        )}

        <div className="chapter-tabs" role="tablist" aria-label="Choose the main result">
          {CHAPTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={chapter === item.key}
              className={chapter === item.key ? "chapter-tab is-active" : "chapter-tab"}
              onClick={() => onChapter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {isWeek && (
          <section className="week-progress" aria-labelledby="week-progress-title">
            <div className="flight-path-intro">
              <div>
                <h2 id="week-progress-title">Your week so far</h2>
                <p>{ledger.filter((row) => row.actual).length} of {ledger.length} days done</p>
              </div>
              <FlightPathLegend />
            </div>
            <DayRail
              rows={ledger}
              selectedDay={selectedDay}
              onSelect={onSelectDay}
              onOpenSelected={onOpenDay}
            />
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
      </div>

      <aside className="dashboard-answer" aria-live="polite">
        <div className="dashboard-profit-copy">
          <p>{chapterContent.label}</p>
          <strong className="tnum">{signedProfit(chapterContent.value)}</strong>
          <span>{answerSupport}</span>
        </div>
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
        <BirdeeMascot
          state={chapterContent.value >= 0 ? "profit" : "loss"}
          size={210}
          className="dashboard-birdee"
        />
      </aside>
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
        <div className="day-comparison-track" aria-label={`Budget profit ${signedProfit(row.predicted.net)}, actual profit ${signedProfit(row.actual.net)}`}>
          <div className="day-comparison-point is-budget">
            <span>Budget profit</span>
            <strong className="tnum">{signedProfit(row.predicted.net)}</strong>
          </div>
          <div className="day-comparison-arrow" aria-hidden="true">
            <span />
            <ArrowRight weight="bold" />
          </div>
          <div className="day-comparison-point is-actual">
            <span>Actual profit</span>
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
  const invalid = value.from > value.to;
  return (
    <section className="custom-range-panel" role="dialog" aria-label="Choose custom reporting dates">
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
    </section>
  );
}

function ResultExplanationView({
  backLabel,
  resultLabel,
  title,
  numbersActionLabel,
  rows,
  cogsPct,
  onBack,
  onFullNumbers,
}: {
  backLabel: string;
  resultLabel: string;
  title: string;
  numbersActionLabel: string;
  rows: LedgerRow[];
  cogsPct: number;
  onBack: () => void;
  onFullNumbers: () => void;
}) {
  const actual = totalCells(rows, "actual");
  const budget = totalCells(rows, "predicted");
  const difference = actual.net - budget.net;
  const drivers = profitDrivers(actual, budget, cogsPct);
  const headline = Math.abs(difference) < 0.5
    ? "Profit matched budget."
    : `Profit finished ${money(difference)} ${difference >= 0 ? "ahead of" : "behind"} budget.`;

  return (
    <div className="detail-view result-explanation-view">
      <ViewBack label={backLabel} onClick={onBack} />
      <div className="detail-title-row">
        <div>
          <h1>{title}</h1>
          <p>{resultLabel}, explained.</p>
        </div>
      </div>

      <section className="result-explanation-panel" aria-labelledby="result-explanation-headline">
        <div className="result-explanation-answer">
          <p className="result-explanation-kicker">{resultLabel}</p>
          <BirdeeMascot state={difference >= 0 ? "profit" : "loss"} size={88} />
          <div className="result-explanation-verdict">
            <h2 id="result-explanation-headline">{headline}</h2>
            <p className="result-explanation-comparison">
              <span>Actual <strong className={`tnum ${actual.net >= 0 ? "good" : "bad"}`}>{signedProfit(actual.net)}</strong></span>
              <i aria-hidden>{"\u00b7"}</i>
              <span>Budget <strong className="tnum">{signedProfit(budget.net)}</strong></span>
            </p>
          </div>
        </div>

        <div className="result-explanation-evidence">
          <div className="bridge-section-head">
            <h3>Biggest drivers</h3>
          </div>

          <div className="profit-bridge" role="list" aria-label="How budget profit became actual profit">
            <BridgeStep kind="start" label="Budget profit" value={budget.net} />
            {drivers.map((driver) => (
              <BridgeStep key={driver.key} kind="driver" label={driver.label} value={driver.impact} detail={driver.detail} />
            ))}
            <BridgeStep kind="finish" label="Actual profit" value={actual.net} />
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
          {numbersActionLabel}
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

function profitDrivers(actual: DayCell, budget: DayCell, cogsPct: number): ProfitDriver[] {
  const revenueDelta = actual.rev - budget.rev;
  const wageDelta = actual.lab - budget.lab;
  const fixedDelta = actual.fix - budget.fix;
  const budgetCogsRate = budget.rev ? budget.cogs / budget.rev : cogsPct / 100;
  const revenueImpact = revenueDelta / GST_DIVISOR - budgetCogsRate * revenueDelta;
  const expectedActualCogs = budget.cogs + budgetCogsRate * revenueDelta;
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
        {kind === "driver" ? <MovementIcon weight="bold" /> : <span>=</span>}
      </span>
      <span className="bridge-step-copy">
        <strong>{label}</strong>
        {detail && <small>{detail}</small>}
      </span>
      <span className="bridge-step-value">
        <strong className={`tnum ${kind === "driver" || kind === "finish" ? value >= 0 ? "good" : "bad" : ""}`}>{signedProfit(value)}</strong>
        {kind === "driver" && <small>Profit impact</small>}
      </span>
    </div>
  );
}

function WhatIfView({
  periodTitle,
  week,
  baseline,
  scenarioDays,
  onBack,
}: {
  periodTitle: string;
  week: Week;
  baseline: number;
  scenarioDays: number;
  onBack: () => void;
}) {
  const [activeDriver, setActiveDriver] = useState<Driver>("wages");
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const active = adjustments[activeDriver];

  const scenarioWeek = applyScenario(week, adjustments, scenarioDays);
  const scenarioResult = baseline + (profit(scenarioWeek) - profit(week));
  const change = scenarioResult - baseline;
  const config = sliderConfig(activeDriver, active.mode);
  const estimatedHours = activeDriver === "wages" && active.mode === "dollar"
    ? Math.abs(active.value / 31)
    : 0;

  const setActive = (patch: Partial<Adjustment>) => {
    setAdjustments((current) => ({
      ...current,
      [activeDriver]: { ...current[activeDriver], ...patch },
    }));
  };

  return (
    <div className="what-if-view">
      <ViewBack label={periodTitle} onClick={onBack} />
      <div className="detail-title-row what-if-title">
        <div>
          <div className="title-with-tag"><h1>What if?</h1><span>Concept scenario</span></div>
          <p>Test a change. Reports unchanged.</p>
        </div>
      </div>

      <section className="scenario-workspace">
        <div className="scenario-summary">
          <div><span>Baseline ({periodTitle})</span><strong className="tnum">{signedProfit(baseline)}</strong></div>
          <ArrowRight className="scenario-arrow" weight="light" aria-hidden />
          <div><span>Concept scenario</span><strong className="tnum">{signedProfit(scenarioResult)}</strong></div>
          <div className="scenario-change"><span>Change</span><strong className="tnum">{signedProfit(change)}</strong></div>
        </div>

        <div className="scenario-columns">
          <div className="driver-list">
            <h2>Drivers</h2>
            {(Object.keys(DRIVER_LABELS) as Driver[]).map((driver) => {
              const Icon = DRIVER_ICONS[driver];
              return (
                <button
                  type="button"
                  key={driver}
                  className={activeDriver === driver ? "driver-row is-active" : "driver-row"}
                  onClick={() => setActiveDriver(driver)}
                >
                  <span className="driver-icon"><Icon weight="regular" /></span>
                  <span>{DRIVER_LABELS[driver]}</span>
                  <strong className="tnum">{formatAdjustment(driver, adjustments[driver])}</strong>
                </button>
              );
            })}
          </div>

          <div className="driver-control">
            <h2>Adjust {DRIVER_LABELS[activeDriver].toLowerCase()}</h2>
            {activeDriver !== "cogs" && (
              <div className="mode-control" role="group" aria-label="Choose adjustment unit">
                <button type="button" className={active.mode === "dollar" ? "is-active" : ""} onClick={() => setActive({ mode: "dollar", value: 0 })}>$</button>
                <button type="button" className={active.mode === "percent" ? "is-active" : ""} onClick={() => setActive({ mode: "percent", value: 0 })}>%</button>
              </div>
            )}
            <div className="slider-row">
              <button type="button" aria-label="Decrease" onClick={() => setActive({ value: Math.max(config.min, active.value - config.step) })}><Minus weight="bold" /></button>
              <input
                type="range"
                min={config.min}
                max={config.max}
                step={config.step}
                value={active.value}
                onChange={(event) => setActive({ value: Number(event.target.value) })}
                aria-label={`Adjust ${DRIVER_LABELS[activeDriver]}`}
              />
              <button type="button" aria-label="Increase" onClick={() => setActive({ value: Math.min(config.max, active.value + config.step) })}><Plus weight="bold" /></button>
            </div>
            <div className="active-adjustment">
              <strong className="tnum">{formatAdjustment(activeDriver, active)}</strong>
              {active.mode === "dollar" && activeDriver !== "fixed" && <span>per day</span>}
              {activeDriver === "fixed" && active.mode === "dollar" && <span>per week</span>}
              {estimatedHours > 0 && <em>≈{estimatedHours.toFixed(1)} fewer hours/day</em>}
            </div>
            <BirdeeMascot state="neutral" size={82} className="scenario-birdee" />
          </div>

          <aside className="scenario-impact">
            <h2>Scenario impact</h2>
            <div><span>Concept scenario</span><strong className="tnum">{signedProfit(scenarioResult)}</strong></div>
            <div><span>Change vs. baseline</span><strong className={`tnum ${change >= 0 ? "good" : "bad"}`}>{signedProfit(change)}</strong></div>
          </aside>
        </div>
      </section>

      <div className="scenario-footer">
        <span><ShieldCheck size={22} weight="regular" /> Reports unchanged</span>
        <div>
          <ProductButton
            variant="tertiary"
            size="compact"
            className="reset-action"
            onClick={() => setAdjustments({
              revenue: { value: 0, mode: "dollar" },
              cogs: { value: 0, mode: "percent" },
              wages: { value: 0, mode: "dollar" },
              fixed: { value: 0, mode: "dollar" },
            })}
            leadingIcon={<ArrowCounterClockwise weight="bold" />}
          >
            Reset
          </ProductButton>
          <ProductButton variant="secondary" size="compact" className="secondary-action" onClick={onBack}>
            Close scenario
          </ProductButton>
        </div>
      </div>
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
  const completed = rows.filter((row) => row.actual);
  const actual = totalCells(completed, "actual");
  const budgetToDate = totalCells(completed, "predicted");
  const difference = actual.net - budgetToDate.net;
  const be = scopeBreakeven(rows, week.cogs);
  const margin = 1 / GST_DIVISOR - week.cogs / 100;
  const profitAboveLine = Math.max(0, be.clearedBy * margin);
  const extraCostsAboveLine = Math.max(0, be.clearedBy - profitAboveLine);
  const totalWidth = Math.max(1, be.revenue);
  const beWidth = Math.min(100, (be.breakeven / totalWidth) * 100);
  const extraWidth = Math.min(100 - beWidth, (extraCostsAboveLine / totalWidth) * 100);
  const profitWidth = Math.max(0, 100 - beWidth - extraWidth);

  return (
    <div className="full-numbers-view">
      <div className="full-numbers-heading">
        <ViewBack label={backLabel} onClick={onBack} />
        <h1>{title}</h1>
      </div>

      <section className={`full-summary-strip is-${mode}`}>
        <BirdeeMascot state={difference >= 0 ? "profit" : "loss"} size={54} />
        <SummaryValue label="Result" value={actual.net} tone={actual.net >= 0 ? "good" : "bad"} />
        <SummaryValue label="Budget" value={budgetToDate.net} />
        <SummaryValue label="Difference" value={difference} tone={difference >= 0 ? "good" : "bad"} />
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
            actual={actual}
            budget={budgetToDate}
            gstActual={gstFromGross(actual.rev)}
            gstBudget={gstFromGross(budgetToDate.rev)}
            cogsPct={week.cogs}
          />

          <section className="break-even-panel">
          <div className="percentage-pair">
            <div><span>Wages</span><strong>{((week.lab / (week.rev / GST_DIVISOR)) * 100).toFixed(1)}%</strong><small>of net revenue</small></div>
            <div><span>COGS</span><strong>{week.cogs.toFixed(1)}%</strong><small>of net revenue</small></div>
          </div>
          <div className="break-even-head"><div><span>Break-even revenue</span><strong className="tnum">{money(be.breakeven)}</strong></div><div><span>Budget revenue</span><strong className="tnum">{money(week.rev)}</strong></div></div>
          <div className="break-even-bar" aria-label="Break-even revenue composition">
            <span className="be-costs" style={{ width: `${beWidth}%` }} />
            <span className="be-extra" style={{ width: `${extraWidth}%` }} />
            <span className="be-profit" style={{ width: `${profitWidth}%` }} />
          </div>
          <div className="break-even-legend">
            <div><i className="be-costs" /><span>Costs covered to break even</span><strong>{money(be.breakeven)}</strong></div>
            <div><i className="be-extra" /><span>Extra COGS + GST</span><strong>{money(extraCostsAboveLine)}</strong></div>
            <div><i className="be-profit" /><span>Profit</span><strong>{money(profitAboveLine)}</strong></div>
          </div>
          <div className="budget-revenue-row"><span>Budget revenue</span><strong className="tnum">{money(week.rev)}</strong></div>
          </section>
        </div>
      ) : (
        <section className="daily-numbers-panel full-numbers-detail-panel" role="tabpanel" aria-label={`By ${rowLabel.toLowerCase()}`}>
          <div className="daily-table-head"><span>{rowLabel}</span><span>Status</span><span>Actual</span><span>Budget</span><span>Difference</span></div>
          {rows.map((row) => {
            const delta = row.variance?.net ?? 0;
            return (
              <button
                type="button"
                key={row.index}
                className={`daily-table-row ${row.actual && mode === "week" ? "is-complete" : ""} ${row.status === "today" ? "is-today" : ""}`}
                onClick={() => row.actual && mode === "week" && onSelectDay(row.index)}
                disabled={!row.actual || mode !== "week"}
              >
                <span>{row.label}</span>
                <span><StatusDot row={row} /></span>
                <strong className={`tnum ${row.actual ? row.actual.net >= 0 ? "good" : "bad" : ""}`}>{row.actual ? signedProfit(row.actual.net) : "—"}</strong>
                <span className="tnum">{signedProfit(row.predicted.net)}</span>
                <span className={`tnum ${row.actual ? delta >= 0 ? "good" : "bad" : ""}`}>{row.actual ? signedProfit(delta) : "—"}</span>
              </button>
            );
          })}
        </section>
      )}
    </div>
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
            <span>Actual profit</span>
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
            <div><dt>Actual</dt><dd className="tnum">{signedProfit(actual)}</dd></div>
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

function ReconciliationTable({ actual, budget, gstActual, gstBudget, cogsPct }: { actual: DayCell; budget: DayCell; gstActual: number; gstBudget: number; cogsPct: number }) {
  const rows = [
    { label: "Revenue", actual: actual.rev, budget: budget.rev, meaning: varianceMeaning(actual.rev - budget.rev, "above", "below") },
    { label: "COGS", actual: -actual.cogs, budget: -budget.cogs, meaning: `${cogsPct.toFixed(0)}% of revenue` },
    { label: "Wages", actual: -actual.lab, budget: -budget.lab, meaning: varianceMeaning(actual.lab - budget.lab, "over", "under") },
    { label: "GST", actual: -gstActual, budget: -gstBudget, meaning: "Removed from gross revenue" },
    { label: "Fixed & variable", actual: -actual.fix, budget: -budget.fix, meaning: varianceMeaning(actual.fix - budget.fix, "over", "under") },
    { label: "Profit", actual: actual.net, budget: budget.net, meaning: varianceMeaning(actual.net - budget.net, "ahead", "behind") },
  ];
  return (
    <div className="reconciliation-table" role="table" aria-label="Actual compared with budget">
      <div className="reconciliation-head" role="row"><span /><span>Actual</span><span>Budget</span><span>Meaning</span></div>
      {rows.map((item) => <div className="reconciliation-row" role="row" key={item.label}><strong>{item.label}</strong><span className="tnum">{signedProfit(item.actual)}</span><span className="tnum">{signedProfit(item.budget)}</span><span>{item.meaning}</span></div>)}
    </div>
  );
}

function varianceMeaning(delta: number, positive: string, negative: string) {
  if (Math.abs(delta) < 0.5) return "On budget";
  return `${money(delta)} ${delta > 0 ? positive : negative} budget`;
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

function SummaryValue({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return <div className="summary-value"><strong className={`tnum ${tone ?? ""}`}>{signedProfit(value)}</strong><span>{label}</span></div>;
}

function StatusDot({ row }: { row: LedgerRow }) {
  if (!row.actual) return <span className="table-status upcoming" />;
  const good = (row.variance?.net ?? 0) >= 0;
  return <span className={`table-status ${good ? "is-good" : "is-behind"}`}>{good ? <Check weight="bold" /> : ""}</span>;
}

function getChapterContent({ chapter, periodProfit, budgetDifference, projected, budget, isFuture, isHistory }: { chapter: Chapter; periodProfit: number; budgetDifference: number; projected: number; budget: number; isFuture: boolean; isHistory: boolean }) {
  if (chapter === "budget") return { label: "Compared with budget", value: isFuture ? 0 : budgetDifference, support: isFuture ? "No actual result yet" : budgetDifference >= 0 ? "Ahead of budget" : "Behind budget", tone: budgetDifference >= 0 ? "tone-positive" : "tone-concerned" };
  if (chapter === "week") return { label: isFuture ? "Your forecast" : isHistory ? "Period result" : "Projected profit", value: isFuture ? budget : projected, support: `Budget ${signedProfit(budget)}`, tone: projected >= 0 ? "tone-focused" : "tone-concerned" };
  return { label: isFuture ? "Your forecast" : "Your profit", value: periodProfit, support: isFuture ? "From the numbers you entered" : isHistory ? "Profit from this selected range" : "Profit from the days you’ve finished", tone: periodProfit >= 0 ? "tone-positive" : "tone-concerned" };
}

function totalCells(rows: LedgerRow[], source: "actual" | "predicted"): DayCell {
  return rows.reduce<DayCell>((sum, row) => {
    const cell = source === "actual" ? row.actual : row.predicted;
    if (!cell) return sum;
    return { rev: sum.rev + cell.rev, cogs: sum.cogs + cell.cogs, lab: sum.lab + cell.lab, fix: sum.fix + cell.fix, net: sum.net + cell.net };
  }, { rev: 0, cogs: 0, lab: 0, fix: 0, net: 0 });
}

function gstFromGross(revenue: number) { return revenue - revenue / GST_DIVISOR; }

function applyScenario(week: Week, adjustments: Adjustments, scenarioDays = 7): Week {
  const scenarioWeeks = scenarioDays / 7;
  const revenue = adjustments.revenue.mode === "dollar" ? week.rev + adjustments.revenue.value * scenarioDays : week.rev * (1 + adjustments.revenue.value / 100);
  const wages = adjustments.wages.mode === "dollar" ? week.lab + adjustments.wages.value * scenarioDays : week.lab * (1 + adjustments.wages.value / 100);
  const fixed = adjustments.fixed.mode === "dollar" ? week.fix + adjustments.fixed.value * scenarioWeeks : week.fix * (1 + adjustments.fixed.value / 100);
  return { ...week, rev: Math.max(0, revenue), lab: Math.max(0, wages), fix: Math.max(0, fixed), cogs: Math.max(0, Math.min(99, week.cogs + adjustments.cogs.value)) };
}

function sliderConfig(driver: Driver, mode: DriverMode) {
  if (driver === "cogs") return { min: -10, max: 10, step: 0.5 };
  if (mode === "percent") return { min: -30, max: 30, step: 1 };
  if (driver === "fixed") return { min: -2000, max: 2000, step: 50 };
  return { min: -300, max: 300, step: 10 };
}

function formatAdjustment(driver: Driver, adjustment: Adjustment) {
  if (adjustment.value === 0) return "No change";
  const sign = adjustment.value > 0 ? "+" : "−";
  const amount = Math.abs(adjustment.value);
  if (driver === "cogs" || adjustment.mode === "percent") return `${sign}${amount}%`;
  return `${sign}${money(amount)}${driver === "fixed" ? "/week" : "/day"}`;
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
