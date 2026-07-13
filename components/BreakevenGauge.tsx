"use client";

import { money, type Breakeven } from "@/lib/profit";

/**
 * Revenue-vs-break-even gauge (Scott, round 3). Layout follows the approved
 * reference: the break-even figure floats above its marker on the track, the
 * period's revenue and the budget target sit under the two ends, and a summary
 * chip spells out the gap ("$X more to break even — you're N% of the way
 * there") or the win. Brand palette: amber = covering costs, emerald = profit
 * zone, hatch = revenue still to come vs the target.
 */
export function BreakevenGauge({
  be,
  state,
  target,
  onInfo,
}: {
  be: Breakeven;
  state: "past" | "present" | "future";
  target?: number; // budget revenue for the scope (the right-hand goalpost)
  onInfo?: () => void; // opens the break-even explainer
}) {
  const { breakeven, revenue, clearedBy, cleared } = be;

  const goal = target && target > 0 ? target : revenue;
  const max = Math.max(revenue, breakeven, goal, 1) * 1.06;
  const pct = (n: number) => Math.min(100, (n / max) * 100);
  const bePct = pct(breakeven);
  const revPct = pct(revenue);
  const goalPct = pct(Math.max(goal, revenue));

  const progress = breakeven > 0 ? Math.round((revenue / breakeven) * 100) : 100;
  const amount = money(Math.abs(clearedBy));

  // Tense-aware chip copy.
  const headline = cleared
    ? state === "past"
      ? `Cleared break-even by ${amount}`
      : state === "future"
        ? `Forecasting ${amount} clear of break-even`
        : `${amount} past break-even`
    : state === "past"
      ? `Finished ${amount} short of break-even`
      : `${amount} more revenue to break even`;
  const sub = cleared
    ? "Past the line — everything above break-even is profit."
    : state === "past"
      ? `You got ${progress}% of the way there.`
      : `You're ${progress}% of the way there.`;

  const revLabel =
    state === "past" ? "Actual revenue" : state === "future" ? "Forecast revenue" : "Projected revenue";
  const showGoal = Math.abs(goal - revenue) >= 1;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1.5">
        <span className="text-[12px] font-medium uppercase tracking-wide text-ink/50">
          Revenue vs break-even
        </span>
        {onInfo && (
          <button
            onClick={onInfo}
            aria-label="What is break-even?"
            className="text-ink/30 transition-colors hover:text-ink/60"
          >
            <InfoIcon />
          </button>
        )}
      </div>

      {/* floating break-even label + marker */}
      <div className="relative mt-2 flex-1">
        <div
          className="tnum absolute -translate-x-1/2 whitespace-nowrap font-display text-[11.5px] leading-tight"
          style={{ left: `clamp(3.5rem, ${bePct}%, calc(100% - 3.5rem))` }}
        >
          <span className="font-bold text-ink">{money(breakeven)}</span>
          <span className="text-ink/50"> break-even</span>
        </div>

        <div className="relative mt-[22px] h-8 overflow-hidden rounded-full bg-[#f6f1e6]">
          {/* revenue earned, up to the break-even line: covering costs */}
          <div
            className="absolute inset-y-0 left-0 rounded-l-full bg-amber-300"
            style={{ width: `${Math.min(revPct, bePct)}%` }}
          />
          {/* revenue past break-even: the profit zone */}
          {revPct > bePct && (
            <div
              className="absolute inset-y-0 bg-emerald-500"
              style={{ left: `${bePct}%`, width: `${revPct - bePct}%` }}
            />
          )}
          {/* still to come vs the target: hatched */}
          {goalPct > revPct && (
            <div
              className="absolute inset-y-0"
              style={{
                left: `${revPct}%`,
                width: `${goalPct - revPct}%`,
                background:
                  "repeating-linear-gradient(45deg,#efe7d8,#efe7d8 5px,#f8f3e8 5px,#f8f3e8 10px)",
              }}
            />
          )}
          {/* break-even marker */}
          <div className="absolute inset-y-0 w-[2.5px] bg-ink" style={{ left: `${bePct}%` }} />
        </div>

        {/* end labels */}
        <div className="mt-1.5 flex items-start justify-between gap-3 font-display text-[11px]">
          <span>
            <span
              className={`tnum block text-[13px] font-bold ${
                cleared ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {money(revenue)}
            </span>
            <span className="text-ink/50">{revLabel}</span>
          </span>
          {showGoal && (
            <span className="text-right">
              <span className="tnum block text-[13px] font-bold text-ink/75">{money(goal)}</span>
              <span className="text-ink/50">Target revenue</span>
            </span>
          )}
        </div>
      </div>

      {/* summary chip — kept to a single tight line */}
      <div
        className={`mt-2.5 flex items-center gap-2.5 rounded-xl border px-3 py-1.5 ${
          cleared ? "border-emerald-200/80 bg-emerald-50" : "border-amber-200/80 bg-amber-50"
        }`}
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ${
            cleared ? "text-emerald-600" : "text-amber-600"
          }`}
        >
          {cleared ? <CheckIcon /> : <ArrowUpIcon />}
        </span>
        <span className="min-w-0 leading-tight">
          <span
            className={`font-display text-[12.5px] font-bold ${
              cleared ? "text-emerald-900" : "text-amber-950"
            }`}
          >
            {headline}
          </span>
          <span className={`text-[11px] ${cleared ? "text-emerald-800/70" : "text-amber-900/60"}`}>
            {" "}
            · {sub}
          </span>
        </span>
      </div>
    </div>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor" aria-hidden>
      <path d="M205.66,117.66a8,8,0,0,1-11.32,0L136,59.31V216a8,8,0,0,1-16,0V59.31L61.66,117.66a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0l72,72A8,8,0,0,1,205.66,117.66Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor" aria-hidden>
      <path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,0,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor" aria-hidden>
      <path d="M128,24A104,104,0,1,0,232,128,104.13,104.13,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z" />
    </svg>
  );
}
