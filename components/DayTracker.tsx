"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChartBar } from "@phosphor-icons/react";
import { dayDateLabel, money, signedProfit, type LedgerRow } from "@/lib/profit";

type Kind = "beat" | "behind" | "today" | "upcoming";

function kindOf(r: LedgerRow): Kind {
  if (r.status === "today") return "today";
  if (r.status === "future") return "upcoming";
  return r.light === "green" ? "beat" : "behind";
}

const PALETTE: Record<Kind, { card: string; ring: string; fig: string; dot: string; label: string }> = {
  beat: { card: "bg-emerald-50", ring: "ring-emerald-400", fig: "text-emerald-600", dot: "bg-emerald-500", label: "beat" },
  behind: { card: "bg-red-50", ring: "ring-red-400", fig: "text-red-600", dot: "bg-red-500", label: "behind" },
  today: { card: "bg-amber-50", ring: "ring-amber-400", fig: "text-amber-700", dot: "bg-amber-400", label: "today" },
  upcoming: { card: "bg-black/[0.035]", ring: "ring-black/25", fig: "text-ink/45", dot: "bg-black/15", label: "to come" },
};

function driverSentence(row: LedgerRow): string {
  const v = row.variance;
  if (!v) return "";
  if (v.driver === "revenue")
    return `Revenue came in ${money(Math.abs(v.rev))} ${v.rev < 0 ? "under" : "over"} forecast.`;
  if (v.driver === "labour")
    return `Labour ran ${money(Math.abs(v.lab))} ${v.lab > 0 ? "over" : "under"} forecast.`;
  return "Revenue and labour both moved against the forecast.";
}

function StatusPill({ kind }: { kind: Kind }) {
  const map: Record<Kind, string> = {
    beat: "bg-emerald-100 text-emerald-800",
    behind: "bg-red-100 text-red-800",
    today: "bg-amber-100 text-amber-800",
    upcoming: "bg-black/[0.06] text-ink/60",
  };
  const text: Record<Kind, string> = {
    beat: "Beat forecast",
    behind: "Behind forecast",
    today: "Today",
    upcoming: "Upcoming",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${map[kind]}`}
    >
      {text[kind]}
    </span>
  );
}

/** A read-only labelled figure (PLAN / ACTUAL). */
function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">{label}</div>
      <div className={`tnum font-display text-[16px] font-semibold leading-tight ${tone ?? "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}

/** The hero figure: the difference vs plan. */
function DiffStat({ value, sub, green }: { value: string; sub: string; green: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">Difference</div>
      <div
        className={`tnum font-display text-[20px] font-bold leading-tight ${green ? "text-emerald-600" : "text-red-600"}`}
      >
        {value}
      </div>
      <div className={`text-[10.5px] font-medium ${green ? "text-emerald-700" : "text-red-700"}`}>{sub}</div>
    </div>
  );
}

/** An editable actual, with the forecast figure shown beneath for context. */
function InputStat({
  label,
  value,
  plan,
  onChange,
}: {
  label: string;
  value: number;
  plan: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">{label}</div>
      <div className="mt-1 flex items-center rounded-lg border border-black/10 bg-white px-2.5">
        <span className="text-[13px] text-ink/45">$</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="tnum w-full bg-transparent py-1.5 pl-1 text-[14px] font-semibold text-ink outline-none"
        />
      </div>
      <div className="mt-1 text-[10.5px] text-ink/50">Forecast {money(plan)}</div>
    </div>
  );
}

/** The 7-day Mon–Sun tracker: colored tiles (beat / behind / today / upcoming),
 *  an auto-advancing slideshow, and a detail row for the selected day. */
export function DayTracker({
  rows,
  selected,
  onSelect,
  onEditActual,
}: {
  rows: LedgerRow[];
  selected: number | null;
  onSelect: (i: number) => void;
  onEditActual: (i: number, patch: { rev?: number; lab?: number }) => void;
}) {
  const sel = selected === null ? null : rows[selected];
  const stripRef = useRef<HTMLDivElement>(null);

  // Keep the active day centered when the strip scrolls horizontally (mobile).
  useEffect(() => {
    const c = stripRef.current;
    if (!c || selected === null) return;
    const tile = c.children[selected] as HTMLElement | undefined;
    if (!tile) return;
    const left = tile.offsetLeft - (c.clientWidth - tile.clientWidth) / 2;
    c.scrollTo({ left, behavior: "smooth" });
  }, [selected]);

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-4 sm:p-5">
      <div className="mb-3">
        <h2 className="font-display text-[15px] font-semibold tracking-tight">
          This week, day by day
        </h2>
        <p className="text-[11.5px] text-ink/55">how each day did vs your forecast</p>
      </div>

      <div
        ref={stripRef}
        className="hide-scrollbar -m-1.5 flex snap-x snap-mandatory items-stretch gap-1.5 overflow-x-auto p-1.5 sm:m-0 sm:overflow-visible sm:p-0"
      >
        {rows.map((r) => {
          const kind = kindOf(r);
          const p = PALETTE[kind];
          const isSel = selected === r.index;
          const isPast = r.status === "past";
          const figure = isPast ? signedProfit(r.variance?.net ?? 0) : signedProfit(r.predicted.net);
          return (
            <button
              key={r.index}
              onClick={() => onSelect(r.index)}
              aria-pressed={isSel}
              className={`flex w-[68px] shrink-0 snap-center flex-col items-center gap-1 rounded-2xl px-1.5 py-2.5 transition sm:w-auto sm:flex-1 sm:shrink ${p.card} ${
                isSel ? `ring-2 ${p.ring}` : "ring-1 ring-transparent hover:ring-black/10"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[10.5px] font-semibold uppercase tracking-wide text-ink/60">
                  {r.label}
                </span>
                <span className={`h-2 w-2 rounded-full ${p.dot}`} />
              </div>
              <span
                className={`tnum whitespace-nowrap font-display text-[14px] font-semibold leading-none ${p.fig}`}
              >
                {figure}
              </span>
              <span className="text-[10px] font-medium text-ink/45">{p.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {sel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="mt-3 rounded-2xl bg-[#f6f7f9] p-4 sm:p-5">
              {sel.actual ? (
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
                  {/* narrative */}
                  <div className="lg:flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                        <ChartBar size={16} weight="bold" />
                      </span>
                      <span className="font-display text-[15px] font-semibold">
                        {dayDateLabel(sel.index)}
                      </span>
                      <StatusPill kind={kindOf(sel)} />
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink/65">
                      {driverSentence(sel)}
                    </p>
                  </div>

                  {/* result stats */}
                  <div className="grid grid-cols-3 gap-3 sm:gap-5">
                    <Stat label="Forecast" value={signedProfit(sel.predicted.net)} tone="text-ink/70" />
                    <Stat label="Actual" value={signedProfit(sel.actual.net)} />
                    <DiffStat
                      value={signedProfit(sel.variance?.net ?? 0)}
                      sub={(sel.variance?.net ?? 0) >= 0 ? "ahead of forecast" : "behind forecast"}
                      green={sel.light === "green"}
                    />
                  </div>

                  {/* editable actuals */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:w-[300px]">
                    <InputStat
                      label="Actual revenue"
                      value={Math.round(sel.actual.rev)}
                      plan={sel.predicted.rev}
                      onChange={(v) => onEditActual(sel.index, { rev: v })}
                    />
                    <InputStat
                      label="Actual labour"
                      value={Math.round(sel.actual.lab)}
                      plan={sel.predicted.lab}
                      onChange={(v) => onEditActual(sel.index, { lab: v })}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                  <div className="lg:flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                        <ChartBar size={16} weight="bold" />
                      </span>
                      <span className="font-display text-[15px] font-semibold">
                        {dayDateLabel(sel.index)}
                      </span>
                      <StatusPill kind={kindOf(sel)} />
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink/65">
                      {sel.status === "today" ? "Today is still running" : "This day hasn't happened yet"}.
                      Your forecast is{" "}
                      <span className="tnum font-medium text-ink">{signedProfit(sel.predicted.net)}</span>{" "}
                      on {money(sel.predicted.rev)} revenue.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:gap-5">
                    <Stat label="Forecast net" value={signedProfit(sel.predicted.net)} />
                    <Stat label="Forecast revenue" value={money(sel.predicted.rev)} tone="text-ink/70" />
                    <Stat label="Forecast labour" value={money(sel.predicted.lab)} tone="text-ink/70" />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
