"use client";

import { useState } from "react";
import {
  GST_DIVISOR,
  dayBreakeven,
  money,
  scopeBreakeven,
  signedProfit,
  type DayCell,
  type LedgerRow,
} from "@/lib/profit";
import { CellExplainer, type ExplainerKey } from "@/components/CellExplainer";

/**
 * Scott's day-by-day budget-vs-actual spreadsheet, as a little P&L waterfall
 * that reconciles top-to-bottom: Revenue − Cost of goods − Wages − GST −
 * Fixed & variable = Profit.
 *
 * Layout (Scott, round 3):
 *  • A frozen Week total column pins on the left next to the row labels (item 6)
 *    — both stay put while Mon–Sun scroll.
 *  • A break-even reference row sits under Revenue (item 7): the revenue each day
 *    needed, plus a cleared/short cue.
 *  • Revenue, Cost of goods and Wages are the live rows; GST + Fixed & variable
 *    drop into a quieter grey band (items 4/5). Only Revenue, Wages and Profit
 *    carry colour.
 *  • Every cell is tappable for Scott's plain-English explainer (item 8).
 */
type MetricKey = "rev" | "gst" | "cogs" | "lab" | "fix" | "net";

type Metric = {
  key: MetricKey;
  label: string;
  cost: boolean;
  color: boolean;
  quiet?: boolean;
};

const METRICS: Metric[] = [
  { key: "rev", label: "Revenue", cost: false, color: true },
  { key: "cogs", label: "Cost of goods", cost: true, color: false },
  { key: "lab", label: "Wages", cost: true, color: true },
  { key: "gst", label: "GST", cost: true, color: false, quiet: true },
  { key: "fix", label: "Fixed & variable", cost: true, color: false, quiet: true },
  { key: "net", label: "Profit", cost: false, color: true },
];

const LABEL_W = "w-[96px] sm:w-[124px]";
const WEEK_LEFT = "left-[96px] sm:left-[124px]";
const WEEK_W = "w-[92px] sm:w-[108px]";
const WEEK_SHADOW = "shadow-[6px_0_8px_-6px_rgba(15,23,42,0.12)]";

function cellValue(key: MetricKey, cell: DayCell): number {
  if (key === "gst") return cell.rev - cell.rev / GST_DIVISOR;
  return cell[key as keyof DayCell];
}

function fmt(m: Metric, n: number): string {
  if (m.key === "net") return signedProfit(n);
  const s = money(n);
  return m.cost ? `−${s}` : s;
}

type CellTone = { color: string; badge: boolean };

/** Profit: red on a loss, deep green + check on a beat, lighter green when in
 *  profit but under. Revenue & Wages mirror the beat as a two-tier. Rest neutral. */
function cellTone(m: Metric, actual: number, budget: number): CellTone {
  if (m.key === "net") {
    if (actual < 0) return { color: "text-red-600", badge: false };
    if (actual >= budget) return { color: "text-emerald-700", badge: true };
    return { color: "text-emerald-500", badge: false };
  }
  if (m.color) {
    const beat = m.cost ? actual <= budget : actual >= budget;
    return beat
      ? { color: "text-emerald-700", badge: true }
      : { color: "text-red-600", badge: false };
  }
  return { color: "text-ink", badge: false };
}

function variantOf(m: Metric): "net" | "quiet" | "main" {
  if (m.key === "net") return "net";
  if (m.quiet) return "quiet";
  return "main";
}

function numInner(m: Metric, actual: number | null, budget: number) {
  const variant = variantOf(m);

  if (variant === "quiet") {
    return (
      <div
        className={`tnum whitespace-nowrap font-display font-medium leading-tight ${
          m.key === "gst" ? "text-[12.5px] text-ink/45" : "text-[14px] text-ink/65"
        }`}
      >
        {fmt(m, actual !== null ? actual : budget)}
      </div>
    );
  }

  const size = variant === "net" ? "text-[18px]" : "text-[16px]";

  if (actual !== null) {
    const t = cellTone(m, actual, budget);
    return (
      <>
        <div
          className={`tnum whitespace-nowrap font-display font-semibold leading-tight ${size} ${
            t.color
          } ${t.badge ? "flex items-center justify-center gap-1" : ""}`}
        >
          {fmt(m, actual)}
          {t.badge && <BeatBadge />}
        </div>
        <div className="tnum mt-0.5 whitespace-nowrap text-[11px] text-ink/40">vs {fmt(m, budget)}</div>
      </>
    );
  }

  return (
    <>
      <div
        className={`tnum whitespace-nowrap font-display font-semibold leading-tight text-ink/80 ${size}`}
      >
        {fmt(m, budget)}
      </div>
      <div className="mt-0.5 text-[11px] text-ink/35">budget</div>
    </>
  );
}

export function WeekSpreadsheet({ rows, cogsPct }: { rows: LedgerRow[]; cogsPct: number }) {
  const [openKey, setOpenKey] = useState<ExplainerKey | null>(null);
  const cogsLabel = cogsPct % 1 === 0 ? `${cogsPct}%` : `${cogsPct.toFixed(1)}%`;

  const showWeek = rows.length > 1;
  const anyActual = rows.some((r) => r.actual);
  const weekBE = scopeBreakeven(rows, cogsPct).breakeven;

  const minWidth = (showWeek ? 232 : 124) + rows.length * 78;

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.3)]">
        <table className="w-full border-collapse text-left" style={{ minWidth: `${minWidth}px` }}>
          <thead>
            <tr>
              <th className={`sticky left-0 z-20 ${LABEL_W} bg-white p-3 align-bottom`}>
                <div className="font-display text-[12px] font-semibold text-ink/55">Actual</div>
                <div className="text-[10.5px] text-ink/40">vs budget</div>
              </th>
              {showWeek && (
                <th
                  className={`sticky ${WEEK_LEFT} z-20 ${WEEK_W} ${WEEK_SHADOW} bg-[#fef8ec] p-3 text-center align-bottom`}
                >
                  <div className="font-display text-[13px] font-semibold text-amber-800">Week</div>
                  <div className="text-[10.5px] text-amber-700/70">
                    {anyActual ? "projected" : "forecast"}
                  </div>
                </th>
              )}
              {rows.map((r) => {
                const today = r.status === "today";
                return (
                  <th key={r.index} className={`p-3 text-center ${today ? "bg-amber-50" : ""}`}>
                    <div className="font-display text-[14px] font-semibold text-ink">{r.label}</div>
                    <div
                      className={`text-[10.5px] ${today ? "font-medium text-amber-700" : "text-ink/45"}`}
                    >
                      {today ? "Today" : r.status === "future" ? "Upcoming" : "Done"}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m) => {
              const variant = variantOf(m);
              const isNet = variant === "net";
              const isQuiet = variant === "quiet";
              const labelBg = isNet ? "bg-[#fafbfc]" : isQuiet ? "bg-[#f4f5f7]" : "bg-white";
              const rowBorder = isNet
                ? "border-black/15"
                : m.key === "gst"
                  ? "border-black/10"
                  : "border-black/5";

              const weekBudget = rows.reduce((s, r) => s + cellValue(m.key, r.predicted), 0);
              const weekActual = anyActual
                ? rows.reduce((s, r) => s + cellValue(m.key, r.actual ?? r.predicted), 0)
                : null;
              const weekAlign = isQuiet ? "align-middle" : "align-top";
              const open = () => setOpenKey(m.key as ExplainerKey);

              const metricRow = (
                <tr key={m.key} className={`border-t ${rowBorder} ${isNet || isQuiet ? labelBg : ""}`}>
                  <th
                    onClick={open}
                    className={`sticky left-0 z-10 ${LABEL_W} ${labelBg} cursor-pointer p-3 font-medium transition-colors hover:text-ink ${
                      isNet
                        ? "text-[13px] text-ink"
                        : isQuiet
                          ? `text-[12px] ${m.key === "gst" ? "text-ink/45" : "text-ink/65"}`
                          : "text-[13px] text-ink/70"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {m.label}
                      <InfoDot />
                    </span>
                    {m.key === "cogs" && (
                      <span className="ml-1.5 whitespace-nowrap rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        {cogsLabel}
                      </span>
                    )}
                  </th>

                  {showWeek && (
                    <td
                      onClick={open}
                      className={`sticky ${WEEK_LEFT} z-10 ${WEEK_SHADOW} cursor-pointer bg-[#fef8ec] p-3 text-center ${weekAlign}`}
                    >
                      {numInner(m, weekActual, weekBudget)}
                    </td>
                  )}

                  {rows.map((r) => {
                    const budget = cellValue(m.key, r.predicted);
                    const actual = r.actual ? cellValue(m.key, r.actual) : null;
                    const today = r.status === "today";
                    return (
                      <td
                        key={r.index}
                        onClick={open}
                        className={`cursor-pointer p-3 text-center ${
                          isQuiet ? "align-middle" : "align-top"
                        } ${today ? "bg-amber-50/50" : ""}`}
                      >
                        {numInner(m, actual, budget)}
                      </td>
                    );
                  })}
                </tr>
              );

              // The break-even reference row sits directly under Revenue.
              if (m.key === "rev") {
                return [metricRow, renderBreakevenRow()];
              }
              return metricRow;
            })}
          </tbody>
        </table>
      </div>

      {openKey && <CellExplainer explainerKey={openKey} onClose={() => setOpenKey(null)} />}
    </>
  );

  function renderBreakevenRow() {
    const openBE = () => setOpenKey("breakeven");
    return (
      <tr key="breakeven" className="border-t border-dashed border-[#e8dcc4]">
        <th
          onClick={openBE}
          className={`sticky left-0 z-10 ${LABEL_W} cursor-pointer bg-[#fbfaf7] p-3 text-[12px] font-medium text-[#8a7a5c]`}
        >
          <span className="inline-flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor" aria-hidden>
              <path d="M128,60a68,68,0,1,0,68,68A68.07,68.07,0,0,0,128,60Zm0,120a52,52,0,1,1,52-52A52.06,52.06,0,0,1,128,180Zm12-52a12,12,0,1,1-12-12A12,12,0,0,1,140,128Z" />
            </svg>
            Break-even
            <InfoDot />
          </span>
        </th>
        {showWeek && (
          <td
            onClick={openBE}
            className={`sticky ${WEEK_LEFT} z-10 ${WEEK_SHADOW} cursor-pointer bg-[#fdf3e0] p-3 text-center align-middle`}
          >
            <div className="tnum whitespace-nowrap font-display text-[12.5px] font-semibold text-[#8a7a5c]">
              {money(weekBE)}
            </div>
          </td>
        )}
        {rows.map((r) => {
          const be = dayBreakeven(r, cogsPct);
          const showCue = r.actual != null;
          return (
            <td
              key={r.index}
              onClick={openBE}
              className="cursor-pointer bg-[#fbfaf7] p-3 text-center align-middle"
            >
              <div className="tnum whitespace-nowrap font-display text-[12.5px] font-semibold text-[#8a7a5c]">
                {money(be.breakeven)}
              </div>
              {showCue && (
                <div
                  className={`mt-0.5 whitespace-nowrap text-[9.5px] font-semibold tracking-wide ${
                    be.cleared ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {be.cleared ? "cleared" : `short ${money(-be.clearedBy)}`}
                </div>
              )}
            </td>
          );
        })}
      </tr>
    );
  }
}

/** Small "beat budget" badge — a check in a green circle. */
function BeatBadge() {
  return (
    <span
      aria-label="beat budget"
      className="inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
    >
      <svg width="9" height="9" viewBox="0 0 256 256" fill="currentColor" aria-hidden>
        <path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,0,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z" />
      </svg>
    </span>
  );
}

/** A subtle "tap for detail" affordance next to a row label. */
function InfoDot() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 256 256"
      fill="currentColor"
      className="shrink-0 text-ink/25"
      aria-hidden
    >
      <path d="M128,24A104,104,0,1,0,232,128,104.13,104.13,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z" />
    </svg>
  );
}
