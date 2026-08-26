import { CHAPTERS } from "../constants";
import { getChapterContent } from "../copy";
import { CustomRangePanel } from "../overlays/CustomRangePanel";
import { DashboardAttentionOverlay } from "../overlays/DashboardAttentionOverlay";
import { DayPreviewOverlay } from "../overlays/DayPreviewOverlay";
import { DayRail } from "../parts/DayRail";
import { FlightPathLegend } from "../parts/FlightPathLegend";
import { HistoryRail } from "../parts/HistoryRail";
import { PeriodNavigation } from "../parts/PeriodNavigation";
import { YesterdayComparison } from "../parts/YesterdayComparison";
import type { Chapter, DailyCheckInTask } from "../types";
import { BirdeeMascot } from "@/components/BirdeeMascot";
import { ChirpActivationPrompt } from "@/components/ChirpActivationPrompt";
import { ProductButton } from "@/components/ProductButton";
import { dashboardAttentionPrompt, dashboardPromptStorageKey } from "@/lib/dashboard/attention";
import type { DashboardAttentionPrompt } from "@/lib/dashboard/attention";
import { profit, signedProfit } from "@/lib/profit";
import type { HistoryRange, LedgerRow, PeriodKey } from "@/lib/profit";
import { ArrowRight, CalendarBlank, ChartLineUp, Flask, Plus } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function DashboardView({
  viewTitle,
  dateLabel,
  periodKey,
  availablePeriodKeys,
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
  dailyCheckInTask,
  incompleteDayTask,
  checkInDatesByDay,
  venueId,
  weekStart,
  currentDate,
  onCheckInDay,
}: {
  viewTitle: string;
  dateLabel: string;
  periodKey: PeriodKey;
  availablePeriodKeys: ReadonlySet<PeriodKey>;
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
  dailyCheckInTask: DailyCheckInTask | null;
  incompleteDayTask: Pick<DailyCheckInTask, "date" | "dayName"> | null;
  checkInDatesByDay: Record<number, string>;
  venueId: string;
  weekStart: string;
  currentDate: string;
  onCheckInDay: (date: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [dayPreviewOpen, setDayPreviewOpen] = useState(false);
  const [attentionPrompt, setAttentionPrompt] = useState<DashboardAttentionPrompt | null>(null);
  const yesterdayRow = periodKey === "yesterday" && selectedRow?.actual && selectedRow.variance
    ? selectedRow
    : null;
  const answerSupport = chapterContent.support;

  useEffect(() => {
    if (!venueId || !weekStart || !currentDate || periodKey !== "this-week") {
      setAttentionPrompt(null);
      return;
    }

    const nextPrompt = dashboardAttentionPrompt({
      venueId,
      weekStart,
      currentDate,
      periodKey,
      dailyTask: dailyCheckInTask,
    });

    if (!nextPrompt) {
      setAttentionPrompt(null);
      return;
    }

    const foreverKey = dashboardPromptStorageKey("hidden", nextPrompt.signature);
    const sessionKey = dashboardPromptStorageKey("later", nextPrompt.signature);
    if (
      window.localStorage.getItem(foreverKey) === "true" ||
      window.sessionStorage.getItem(sessionKey) === "true"
    ) {
      setAttentionPrompt(null);
      return;
    }
    setAttentionPrompt(nextPrompt);
  }, [currentDate, dailyCheckInTask, periodKey, venueId, weekStart]);

  useEffect(() => {
    if (!attentionPrompt) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [attentionPrompt]);

  const dismissAttentionPrompt = (forever: boolean) => {
    if (!attentionPrompt) return;
    const scope = forever ? "hidden" : "later";
    const key = dashboardPromptStorageKey(scope, attentionPrompt.signature);
    const storage = forever ? window.localStorage : window.sessionStorage;
    storage.setItem(key, "true");
    setAttentionPrompt(null);
  };

  const selectDay = (index: number) => {
    onSelectDay(index);
    setDayPreviewOpen(true);
  };

  const openSelectedDay = () => {
    setDayPreviewOpen(false);
    onOpenDay();
  };

  return (
    <div
      className={`dashboard-view ${incompleteDayTask ? "tone-neutral" : chapterContent.tone}`}
      data-day-preview-open={dayPreviewOpen ? "true" : "false"}
    >
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
          availablePeriodKeys={availablePeriodKeys}
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
          key={`${periodKey}-${chapter}-${incompleteDayTask ? "waiting" : "ready"}`}
          className="dashboard-profit-copy"
          initial={reduceMotion ? false : { opacity: 0, transform: "translateY(4px)" }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          transition={{ duration: reduceMotion ? 0 : 0.16, ease: [0.23, 1, 0.32, 1] }}
        >
          {incompleteDayTask ? (
            <>
              <p>Yesterday&rsquo;s result</p>
              <strong className="dashboard-waiting-title">Waiting for an actual</strong>
              <span>Add the sales total and Birdee will show how the day went.</span>
            </>
          ) : (
            <>
              <p>{chapterContent.label}</p>
              <strong className="tnum">{signedProfit(chapterContent.value)}</strong>
              <span>{answerSupport}</span>
            </>
          )}
        </motion.div>
        <div className="dashboard-profit-actions" aria-label="Explore this result">
          {incompleteDayTask ? (
            <ProductButton
              href={`/app/check-in?date=${encodeURIComponent(incompleteDayTask.date)}`}
              variant="secondary"
              className="result-action dashboard-primary-action"
              trailingIcon={<ArrowRight weight="bold" />}
            >
              Add {incompleteDayTask.dayName}&rsquo;s actual
            </ProductButton>
          ) : !isFuture && (
            <ProductButton
              variant="secondary"
              className="result-action dashboard-primary-action"
              onClick={onWhatHappened}
              leadingIcon={<ChartLineUp size={20} weight="bold" />}
            >
              What happened
            </ProductButton>
          )}
          {!incompleteDayTask && (
            <ProductButton
              variant="secondary"
              className="result-action dashboard-secondary-action"
              onClick={onWhatIf}
              leadingIcon={<Flask size={20} weight="bold" />}
            >
              What if
            </ProductButton>
          )}
        </div>
        <div className="dashboard-birdee-stage">
          <span className="dashboard-chirp" aria-hidden="true"><i /><i /></span>
          <BirdeeMascot
            state={incompleteDayTask ? "neutral" : chapterContent.value >= 0 ? "profit" : "loss"}
            size={210}
            className="dashboard-birdee"
          />
        </div>
      </aside>

      {dailyCheckInTask && (
        <section className="daily-check-in-task" aria-label="Daily actual needed">
          <span className="daily-check-in-task__icon" aria-hidden="true">
            <CalendarBlank weight="duotone" />
          </span>
          <div className="daily-check-in-task__copy">
            <strong>{dailyCheckInTask.dayName} is waiting for an actual.</strong>
            <span>
              {dailyCheckInTask.missingCount > 1
                ? `${dailyCheckInTask.missingCount} past days still need an actual.`
                : "Add it to finish Birdee's result for that day."}
            </span>
          </div>
          <ProductButton
            href={`/app/check-in?date=${encodeURIComponent(dailyCheckInTask.date)}`}
            variant="primary"
            size="compact"
            trailingIcon={<ArrowRight weight="bold" />}
          >
            Add {dailyCheckInTask.dayName}&rsquo;s actual
          </ProductButton>
        </section>
      )}

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
            checkInDatesByDay={checkInDatesByDay}
            onCheckIn={onCheckInDay}
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

      {!isWeek && !incompleteDayTask && (
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

      {dailyCheckInTask && (
        <div className="dashboard-mobile-dock" aria-label="Daily check-in">
          <ProductButton
            href={`/app/check-in?date=${encodeURIComponent(dailyCheckInTask.date)}`}
            variant="primary"
            fullWidth
            leadingIcon={<Plus size={20} weight="bold" />}
            trailingIcon={<ArrowRight size={18} weight="bold" />}
          >
            Add {dailyCheckInTask.dayName}&rsquo;s actual
          </ProductButton>
        </div>
      )}

      {dayPreviewOpen && selectedRow?.actual && typeof document !== "undefined" && createPortal(
        <DayPreviewOverlay
          row={selectedRow}
          onClose={() => setDayPreviewOpen(false)}
          onOpen={openSelectedDay}
        />,
        document.body,
      )}

      {attentionPrompt && typeof document !== "undefined" && createPortal(
        <DashboardAttentionOverlay
          prompt={attentionPrompt}
          onRemindLater={() => dismissAttentionPrompt(false)}
          onHide={() => dismissAttentionPrompt(true)}
          onDailyCheckIn={(date) => {
            setAttentionPrompt(null);
            onCheckInDay(date);
          }}
        />,
        document.body,
      )}
      <ChirpActivationPrompt
        active={periodKey === "this-week" && attentionPrompt === null}
      />
    </div>
  );
}
