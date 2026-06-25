"use client";

import { CurrencyDollar, Gear, Package, UsersThree } from "@phosphor-icons/react";
import type { ComponentType } from "react";
import {
  HISTORY,
  LEVER_META,
  historyTrends,
  leverDirection,
  money,
  worstLevers,
  type LeverKey,
} from "@/lib/profit";

type Dir = "good" | "bad" | "flat";

const BAR: Record<Dir, string> = { good: "#10b981", bad: "#ef4444", flat: "#94a3b8" };
const PILL: Record<Dir, string> = {
  good: "bg-emerald-50 text-emerald-700",
  bad: "bg-red-50 text-red-700",
  flat: "bg-slate-100 text-ink/55",
};
const CIRCLE: Record<Dir, string> = {
  good: "bg-emerald-50 text-emerald-600",
  bad: "bg-red-50 text-red-500",
  flat: "bg-slate-100 text-ink/40",
};
const ICON: Record<LeverKey, ComponentType<{ size?: number; weight?: "bold" }>> = {
  rev: CurrencyDollar,
  lab: UsersThree,
  cogs: Package,
  fix: Gear,
};
const KEYS: LeverKey[] = ["rev", "lab", "cogs", "fix"];

function signed(v: number): string {
  return `${v < 0 ? "−" : "+"}${money(Math.abs(Math.round(v)))}`;
}

/** Small per-week variance: bars grow up (over) or down (under) from a center
 *  forecast line; a flat line shows dots sitting on the line. HTML/CSS so the
 *  text stays crisp at any width. */
function MiniVariance({ values, dir }: { values: number[]; dir: Dir }) {
  const color = BAR[dir];
  return (
    <div className="w-full">
      <div className="relative" style={{ height: 40 }}>
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-300" />
        <div className="absolute inset-0 flex gap-1.5">
          {values.map((v, i) => {
            const h = Math.max(8, Math.min(100, (Math.abs(v) / 20) * 100)) / 2;
            return (
              <div key={i} className="relative flex-1">
                {dir === "flat" ? (
                  <div
                    className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ background: color }}
                  />
                ) : (
                  <div
                    className={`absolute left-1/2 w-[62%] max-w-[18px] -translate-x-1/2 ${
                      v > 0 ? "bottom-1/2 rounded-t-[3px]" : "top-1/2 rounded-b-[3px]"
                    }`}
                    style={{ background: color, height: `${h}%` }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-1 flex gap-1.5 text-[9px] text-ink/40">
        {values.map((_, i) => (
          <span key={i} className="flex-1 text-center">
            W{i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

function DriverCard({
  k,
  title,
  dir,
  chip,
  values,
}: {
  k: LeverKey;
  title: string;
  dir: Dir;
  chip: string;
  values: number[];
}) {
  const Icon = ICON[k];
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-3.5">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CIRCLE[dir]}`}
      >
        <Icon size={16} weight="bold" />
      </span>
      <div className="min-w-0">
        <div className="text-[13px] font-medium leading-tight text-ink">{title}</div>
        <span
          className={`tnum mt-1 inline-block rounded-full px-2 py-0.5 text-[10.5px] font-medium ${PILL[dir]}`}
        >
          {chip}
        </span>
      </div>
      <div className="ml-auto w-[42%] min-w-[112px] max-w-[180px]">
        <MiniVariance values={values} dir={dir} />
      </div>
    </div>
  );
}

/** The featured net-profit variance chart: actual minus forecast per week,
 *  against a $0 forecast line, with a real dollar axis. */
function NetProfitChart({ values, color }: { values: number[]; color: string }) {
  const maxV = Math.max(0, ...values);
  const minV = Math.min(0, ...values);
  const top = Math.max(1000, Math.ceil(maxV / 1000) * 1000);
  const bottom = Math.min(-1000, Math.floor(minV / 1000) * 1000);
  const range = top - bottom;
  const grid: number[] = [];
  for (let g = top; g >= bottom - 0.5; g -= 1000) grid.push(g);
  const zeroPct = ((top - 0) / range) * 100;
  const AXIS = 56;

  return (
    <div>
      <div className="relative" style={{ height: 196 }}>
        {grid.map((g) => {
          const yPct = ((top - g) / range) * 100;
          return (
            <div
              key={g}
              className="absolute inset-x-0 flex -translate-y-1/2 items-center"
              style={{ top: `${yPct}%` }}
            >
              <span
                className="shrink-0 pr-2 text-right text-[11px] text-ink/45 tnum"
                style={{ width: AXIS }}
              >
                {g === 0 ? "$0" : `${g < 0 ? "−" : ""}${money(Math.abs(g))}`}
              </span>
              <div
                className={g === 0 ? "h-px flex-1 bg-slate-300" : "flex-1 border-t border-dashed border-slate-200"}
              />
            </div>
          );
        })}
        <div className="absolute inset-0 flex" style={{ paddingLeft: AXIS }}>
          {values.map((v, i) => {
            const hPct = (Math.abs(v) / range) * 100;
            const neg = v < 0;
            const barTop = neg ? zeroPct : zeroPct - hPct;
            const labelTop = neg ? `calc(${zeroPct + hPct}% + 4px)` : `calc(${zeroPct - hPct}% - 20px)`;
            return (
              <div key={i} className="relative flex-1">
                <div
                  className={`absolute left-1/2 w-[56%] max-w-[80px] -translate-x-1/2 ${
                    neg ? "rounded-b-md" : "rounded-t-md"
                  }`}
                  style={{ background: color, top: `${barTop}%`, height: `${hPct}%` }}
                />
                <div
                  className="tnum absolute inset-x-0 text-center text-[12px] font-semibold text-red-600"
                  style={{ top: labelTop }}
                >
                  {signed(v)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex" style={{ paddingLeft: AXIS }}>
        {values.map((_, i) => (
          <div key={i} className="flex-1 text-center text-[12px] text-ink/55">
            Week {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BudgetVsActualHistory() {
  const t = historyTrends(HISTORY);
  const n = HISTORY.length;
  const worst = worstLevers(t).slice(0, 2);

  const netVals = HISTORY.map((w) => w.actNet - w.predNet);
  const netDiff = netVals.reduce((s, v) => s + v, 0);
  const netBehind = netDiff < 0;

  const bits = KEYS.map((k) => {
    const dir = leverDirection(k, t[k]);
    const pct = t[k];
    const over = pct > 0;
    return {
      k,
      title: LEVER_META[k].label,
      dir,
      chip: dir === "flat" ? "on forecast" : `${Math.abs(pct)}% ${over ? "over" : "under"}`,
      values: HISTORY.map((w) => {
        const f = w[k].predicted;
        return f ? ((w[k].actual - f) / f) * 100 : 0;
      }),
    };
  });

  const verb = (over: boolean) => (over ? "ran" : "came in");

  return (
    <div>
      <p className="rounded-2xl bg-[#f6f7f9] px-4 py-3 text-[13.5px] leading-relaxed text-ink/75">
        {worst.length === 0 ? (
          `Over the last ${n} weeks you've tracked close to forecast on all four, leaving net profit right on plan.`
        ) : (
          <>
            Over the last {n} weeks,{" "}
            {worst.map((w, i) => (
              <span key={w.key}>
                {i > 0 ? " and " : ""}
                <span className="font-semibold text-red-700">
                  {LEVER_META[w.key].label.toLowerCase()} {verb(w.dir === "over")} {Math.abs(w.pct)}%{" "}
                  {w.dir}
                </span>{" "}
                forecast
              </span>
            ))}
            , leaving net profit{" "}
            <span className="font-semibold text-red-700">
              {money(Math.abs(netDiff))} {netBehind ? "behind" : "ahead of"}
            </span>{" "}
            forecast.
          </>
        )}
      </p>

      <div className="mt-4 rounded-2xl border border-black/10 p-4 sm:p-5">
        <div className="mb-4 flex items-baseline justify-between gap-2">
          <span className="text-[14px] font-semibold text-ink">Net profit variance vs forecast</span>
          <span className="tnum text-[13.5px] font-semibold text-red-600">
            {money(Math.abs(netDiff))}{" "}
            <span className="font-normal text-ink/55">{netBehind ? "behind forecast" : "ahead"}</span>
          </span>
        </div>
        <NetProfitChart values={netVals} color={netBehind ? BAR.bad : BAR.good} />
      </div>

      <h3 className="mt-6 mb-3 font-display text-[15px] font-semibold tracking-tight text-ink">
        What drove the result
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {bits.map((b) => (
          <DriverCard
            key={b.k}
            k={b.k}
            title={b.title}
            dir={b.dir}
            chip={b.chip}
            values={b.values}
          />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-black/10 pt-4 text-[11px] text-ink/55">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden /> better than forecast
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden /> worse than forecast
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-400" aria-hidden /> on forecast
        </span>
      </div>
    </div>
  );
}
