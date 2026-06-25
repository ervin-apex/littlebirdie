"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowUp,
  CalendarBlank,
  SlidersHorizontal,
  Target,
} from "@phosphor-icons/react";
import { BirdeeMascot } from "@/components/BirdeeMascot";
import { Flap } from "@/components/Flap";
import { Reveal } from "@/components/Reveal";
import { DayTracker } from "@/components/DayTracker";
import { NeedsAttention } from "@/components/NeedsAttention";
import { BudgetVsActualHistory } from "@/components/BudgetVsActualHistory";
import { RevenueBars } from "@/components/RevenueBars";
import { Collapsible } from "@/components/Collapsible";
import { TrafficLight } from "@/components/TrafficLight";
import {
  DEFAULTS,
  GST_DIVISOR,
  applyAll,
  dailyLedger,
  loadActuals,
  loadWeek,
  money,
  profit,
  saveActuals,
  seedActuals,
  setDay,
  signedProfit,
  suggestions,
  weekStatus,
  type Week,
  type WeekActuals,
} from "@/lib/profit";

export default function DashboardPage() {
  const [week, setWeek] = useState<Week>(DEFAULTS);
  const [actuals, setActuals] = useState<WeekActuals>(() => seedActuals(DEFAULTS));
  const [engaged, setEngaged] = useState(false);
  // Pre-select the day before today (the most recent finished day); no slideshow.
  const [selectedDay, setSelectedDay] = useState<number | null>(() =>
    Math.max(0, seedActuals(DEFAULTS).todayIndex - 1),
  );
  const baseRef = useRef<Week>(DEFAULTS);
  const weekRef = useRef<Week>(week);
  weekRef.current = week;
  const rafRef = useRef<number | null>(null);
  const introRafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introDone = useRef(false);
  const reduce = useReducedMotion();

  // Verdict number. A short count-up on mount, then instant on edits. We drive
  // a raw `animate(0, target, {onUpdate})` into local state — the heavy bits
  // (cards, status, ledger) are memoised, so the per-frame render stays cheap.
  const [profitText, setProfitText] = useState(() => signedProfit(0));

  // The headline = actual-to-date + predicted-for-the-rest.
  const status = useMemo(() => weekStatus(week, actuals), [week, actuals]);
  const ledger = useMemo(() => dailyLedger(week, actuals), [week, actuals]);
  const inProfit = status.inProfit;

  // Pure predicted plan — used for the "See the math" breakdown.
  const p = profit(week);

  useEffect(() => {
    const w = loadWeek();
    const a = loadActuals(w);
    baseRef.current = w;
    weekRef.current = w;
    setWeek(w);
    setActuals(a);
    setSelectedDay(Math.max(0, a.todayIndex - 1));
    const target = weekStatus(w, a).projectedNet;
    if (reduce) {
      setProfitText(signedProfit(target));
      introDone.current = true;
      return;
    }
    // Count up from 0 to the projected figure with a manual rAF tween.
    const dur = 850;
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setProfitText(signedProfit(target * e));
      if (k < 1) introRafRef.current = requestAnimationFrame(tick);
      else introDone.current = true;
    };
    introRafRef.current = requestAnimationFrame(tick);
    // Fallback: rAF is suspended in a background/hidden tab, so land on the
    // final figure via a timer too — the verdict is never stuck at $0.
    const settle = setTimeout(() => {
      if (!introDone.current) {
        setProfitText(signedProfit(target));
        introDone.current = true;
      }
    }, 1100);
    return () => {
      if (introRafRef.current) cancelAnimationFrame(introRafRef.current);
      clearTimeout(settle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After the intro, keep the number synced to live edits, applies and actuals.
  useEffect(() => {
    if (introDone.current) setProfitText(signedProfit(status.projectedNet));
  }, [status.projectedNet]);

  const animateTo = useCallback(
    (target: Partial<Week>) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
      const start = weekRef.current;
      const goal: Week = { ...start, ...target };
      if (reduce) {
        setWeek(goal);
        return;
      }
      const dur = 560;
      const t0 = performance.now();
      const tick = (now: number) => {
        const k = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        setWeek({
          ...goal,
          rev: start.rev + (goal.rev - start.rev) * e,
          lab: start.lab + (goal.lab - start.lab) * e,
          fix: start.fix + (goal.fix - start.fix) * e,
          cogs: start.cogs + (goal.cogs - start.cogs) * e,
        });
        if (k < 1) rafRef.current = requestAnimationFrame(tick);
        else setWeek(goal);
      };
      rafRef.current = requestAnimationFrame(tick);
      timerRef.current = setTimeout(() => setWeek(goal), dur + 80);
    },
    [reduce],
  );

  const onEditActual = useCallback(
    (i: number, patch: { rev?: number; lab?: number }) => {
      setActuals((a) => {
        const next: WeekActuals = {
          ...a,
          actuals: a.actuals.map((d, idx) =>
            idx === i ? { rev: d?.rev ?? 0, lab: d?.lab ?? 0, ...patch } : d,
          ),
        };
        saveActuals(next);
        return next;
      });
    },
    [],
  );

  const selectDay = useCallback((i: number) => {
    setSelectedDay(i);
  }, []);

  const base = baseRef.current;
  const sugg = useMemo(() => suggestions(base), [base]);
  const allWeek = useMemo(() => applyAll(base), [base]);
  const allResult = profit(allWeek);
  const earnBack = allResult - profit(base);
  const netRevenue = week.rev / GST_DIVISOR;
  const gst = week.rev - netRevenue;
  const cogsAmount = (week.cogs / 100) * week.rev;
  const cogsPct = week.cogs % 1 === 0 ? `${week.cogs}%` : `${week.cogs.toFixed(1)}%`;

  // How the projection compares to the plan (>0 = tracking under plan).
  const behind = status.predictedNet - status.projectedNet;

  // Memoised so slider drags / the count-up don't re-render the cards
  // (they depend only on the saved base week, not the live edits).
  const cards = useMemo(
    () =>
      sugg.map((s, i) => (
        <motion.button
          key={s.key}
          onClick={() => {
            setEngaged(true);
            animateTo(s.apply);
          }}
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          whileHover={reduce ? undefined : { y: -3 }}
          className="group rounded-2xl border border-black/10 bg-white p-4 text-left transition-colors hover:border-amber-300 hover:shadow-[0_10px_30px_-14px_rgba(15,23,42,0.3)]"
        >
          <div className="font-display text-[14px] font-medium text-ink">
            {s.action}
          </div>
          <div className="tnum mt-2 font-display text-[28px] font-semibold leading-none tracking-tight text-emerald-600">
            +{money(s.gain)}
          </div>
          <div className="mt-2 text-[12.5px] leading-snug text-ink/65">
            {s.reason}
          </div>
        </motion.button>
      )),
    [sugg, animateTo, reduce],
  );

  return (
    <div>
      <Reveal>
        <div className="mb-5">
          <h1 className="font-display text-[22px] font-semibold tracking-tight">
            This week
          </h1>
          <p className="text-[13px] text-ink/60">
            Mon 23 to Sun 29 Jun
            {status.daysIn > 0 ? ` · ${status.daysIn} days in` : ""}
          </p>
        </div>
      </Reveal>

      {/* verdict + what needs attention */}
      <Reveal delay={0.05}>
        <div className="grid gap-4 lg:grid-cols-5">
          <section
            className={`rounded-3xl border p-6 transition-colors duration-300 sm:p-7 lg:col-span-3 ${
              inProfit ? "border-emerald-200 bg-emerald-50/60" : "border-red-200 bg-red-50/60"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <TrafficLight inProfit={inProfit} />
                <p
                  className={`tnum mt-3 font-display text-[52px] font-semibold leading-none tracking-tight transition-colors duration-300 sm:text-[68px] ${
                    inProfit ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {profitText}
                </p>
                <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-ink/70">
                  {inProfit ? (
                    <>
                      Projected profit looks healthy
                      {behind > 0 ? (
                        <>
                          , but you&apos;re{" "}
                          <span className="font-semibold text-red-700">
                            {money(behind)} behind forecast
                          </span>{" "}
                          so far
                        </>
                      ) : behind < 0 ? (
                        <>
                          {" "}
                          and{" "}
                          <span className="font-semibold text-emerald-700">
                            {money(-behind)} ahead of forecast
                          </span>
                        </>
                      ) : null}
                      .
                    </>
                  ) : (
                    <>
                      You&apos;re heading for a loss
                      {behind > 0 ? (
                        <>
                          ,{" "}
                          <span className="font-semibold text-red-700">
                            {money(behind)} behind forecast
                          </span>
                        </>
                      ) : null}
                      . The fixes are at the bottom.
                    </>
                  )}
                </p>
              </div>
              {inProfit ? (
                <Flap size={84} className="shrink-0 opacity-90" />
              ) : (
                <BirdeeMascot state="loss" size={84} float className="shrink-0 opacity-90" />
              )}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-black/10 pt-4">
              <MiniStat
                icon={<Target size={15} weight="bold" />}
                label="Forecast said"
                value={signedProfit(status.predictedNet)}
              />
              <MiniStat
                icon={
                  behind > 0 ? (
                    <ArrowDown size={15} weight="bold" />
                  ) : (
                    <ArrowUp size={15} weight="bold" />
                  )
                }
                label={behind > 0 ? "Behind forecast" : behind < 0 ? "Ahead of forecast" : "On forecast"}
                value={behind === 0 ? "On track" : money(Math.abs(behind))}
                tone={behind > 0 ? "text-red-700" : behind < 0 ? "text-emerald-700" : "text-ink"}
              />
              <MiniStat
                icon={<CalendarBlank size={15} weight="bold" />}
                label="Days in"
                value={`${status.daysIn} of 7`}
              />
            </div>
          </section>

          <aside className="lg:col-span-2">
            <NeedsAttention rows={ledger} status={status} />
          </aside>
        </div>
      </Reveal>

      {/* the day-by-day budget vs actual tracker — the centerpiece */}
      <Reveal delay={0.12}>
        <div className="mt-8">
          <DayTracker
            rows={ledger}
            selected={selectedDay}
            onSelect={selectDay}
            onEditActual={onEditActual}
          />
        </div>
      </Reveal>

      {/* see the math, tucked under the day tracker, collapsed */}
      <Reveal delay={0.18}>
        <div className="mt-8">
          <Collapsible title="See the math">
            <div className="text-[13px]">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-ink/70">Predicted revenue</span>
                <span className="tnum font-display text-ink">{money(week.rev)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-ink/70">GST removed (10% off the top)</span>
                <span className="tnum font-display text-ink/70">−{money(gst)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-ink/70">Cost of goods ({cogsPct} of revenue)</span>
                <span className="tnum font-display text-ink/70">−{money(cogsAmount)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-ink/70">Labour</span>
                <span className="tnum font-display text-ink/70">−{money(week.lab)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-ink/70">Fixed &amp; variable</span>
                <span className="tnum font-display text-ink/70">−{money(week.fix)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between border-t border-black/10 pt-2.5">
                <span className="font-medium text-ink">Predicted profit</span>
                <span
                  className={`tnum font-display font-semibold ${
                    p >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {signedProfit(p)}
                </span>
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-ink/60">
              GST comes off the top line first. Cost of goods is a share of
              revenue; labour and fixed costs come straight off. It all updates as
              you change your numbers below.
            </p>
          </Collapsible>
        </div>
      </Reveal>

      {/* adjust: controllable predicted numbers */}
      <Reveal delay={0.2}>
        <div className="mb-4 mt-8 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <SlidersHorizontal size={18} weight="bold" />
          </span>
          <div>
            <h2 className="font-display text-[18px] font-semibold tracking-tight">
              Adjust this week&apos;s predicted numbers
            </h2>
            <p className="text-[12.5px] text-ink/60">
              These move the days that haven&apos;t happened yet. Past days stay
              as your actuals.
            </p>
          </div>
        </div>
        <div className="lg:flex lg:items-stretch lg:gap-4">
          <div className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5 lg:flex-1">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-[13px] font-medium text-ink/80">Revenue, by day</span>
              <span className="tnum font-display text-[15px] font-semibold text-amber-700">
                {money(week.rev)} / week
              </span>
            </div>
            <RevenueBars
              days={week.days}
              height={140}
              onChange={(i, val) => setWeek(setDay(week, i, val))}
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:mt-0 lg:w-72 lg:shrink-0 lg:grid-cols-1">
            <Lever label="Labour" display={money(week.lab)} min={0} max={9000} step={20} value={week.lab} onChange={(v) => setWeek((w) => ({ ...w, lab: v }))} />
            <Lever label="Cost of what you sell" display={`${week.cogs % 1 === 0 ? week.cogs : week.cogs.toFixed(1)}%`} min={0} max={99} step={0.5} value={week.cogs} onChange={(v) => setWeek((w) => ({ ...w, cogs: v }))} />
            <Lever label="Rent, power and bills" display={money(week.fix)} min={0} max={9000} step={20} value={week.fix} onChange={(v) => setWeek((w) => ({ ...w, fix: v }))} />
          </div>
        </div>
      </Reveal>

      {/* Birdie's 3 tips, right under the levers */}
      <Reveal delay={0.26}>
        <div className="mt-8">
          <Collapsible title="Birdie's 3 tips to earn more">
            <div className="flex items-center gap-3">
              <BirdeeMascot state="profit" size={36} className="shrink-0" />
              <h3 className="font-display text-[16px] font-semibold leading-tight tracking-tight">
                Do these 3 things and you&apos;ll earn back{" "}
                <span className="tnum text-emerald-600">{money(earnBack)}</span>{" "}
                next week
              </h3>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">{cards}</div>
            <button
              onClick={() => {
                setEngaged(true);
                animateTo(allWeek);
              }}
              className={`tnum mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-3.5 font-display text-[15px] font-semibold transition active:scale-[0.99] ${
                engaged
                  ? "bg-amber-400 text-amber-950 hover:bg-amber-300"
                  : "border border-amber-300 bg-transparent text-amber-700 hover:bg-amber-50"
              }`}
            >
              Do all three and next week becomes {signedProfit(allResult)}
            </button>
          </Collapsible>
        </div>
      </Reveal>

      {/* forecast vs actual history */}
      <Reveal delay={0.32}>
        <div className="mt-8">
          <Collapsible title="Forecast vs actual history">
            <BudgetVsActualHistory />
          </Collapsible>
        </div>
      </Reveal>

      <Reveal delay={0.4}>
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => animateTo(baseRef.current)}
            className="inline-flex min-h-[44px] items-center text-[13px] font-medium text-ink/60 underline underline-offset-2 transition-colors hover:text-ink/70"
          >
            Reset to my week
          </button>
          <Link href="/" className="inline-flex min-h-[44px] items-center text-[12px] text-ink/60 transition-colors hover:text-ink/80">
            Restart demo
          </Link>
        </div>
      </Reveal>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-ink/55">
        <span className="text-ink/45">{icon}</span>
        <span className="truncate text-[11px] font-medium">{label}</span>
      </div>
      <div className={`tnum mt-0.5 font-display text-[16px] font-semibold leading-tight ${tone ?? "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}

function Lever({
  label,
  display,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  display: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <div className="rounded-xl border border-black/10 bg-white p-3.5 transition-colors hover:border-amber-200">
      <div className="mb-2.5 flex items-baseline justify-between">
        <span className="text-[13px] text-ink/70">{label}</span>
        <span className="tnum font-display text-[15px] font-semibold text-amber-700">
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        style={{
          background: `linear-gradient(to right, #f59e0b ${pct}%, #e5e7eb ${pct}%)`,
        }}
      />
    </div>
  );
}
