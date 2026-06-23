"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { SlidersHorizontal } from "@phosphor-icons/react";
import { BirdeeMascot } from "@/components/BirdeeMascot";
import { Flap } from "@/components/Flap";
import { Reveal } from "@/components/Reveal";
import { ProfitTrend } from "@/components/ProfitTrend";
import { DayBreakdown } from "@/components/DayBreakdown";
import { Collapsible } from "@/components/Collapsible";
import { TrafficLight } from "@/components/TrafficLight";
import {
  DEFAULTS,
  GST_DIVISOR,
  applyAll,
  dayBreakdown,
  loadWeek,
  money,
  profit,
  scaleRevenue,
  signedProfit,
  suggestions,
  type Week,
} from "@/lib/profit";

export default function DashboardPage() {
  const [week, setWeek] = useState<Week>(DEFAULTS);
  const [engaged, setEngaged] = useState(false);
  const baseRef = useRef<Week>(DEFAULTS);
  const weekRef = useRef<Week>(week);
  weekRef.current = week;
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introDone = useRef(false);
  const reduce = useReducedMotion();

  // Verdict number driven by a Motion value: it animates outside the React
  // render cycle, so the count-up and live updates don't re-render the tree.
  const profitMV = useMotionValue(0);
  const profitText = useTransform(profitMV, (v) => signedProfit(v));

  const p = profit(week);
  const inProfit = p >= 0;

  useEffect(() => {
    const w = loadWeek();
    baseRef.current = w;
    weekRef.current = w;
    setWeek(w);
    const target = profit(w);
    if (reduce) {
      profitMV.set(target);
      introDone.current = true;
      return;
    }
    const controls = animate(profitMV, target, {
      duration: 0.85,
      ease: [0.16, 1, 0.3, 1],
      onComplete: () => {
        introDone.current = true;
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After the intro, keep the number synced to live edits and applies.
  useEffect(() => {
    if (introDone.current) profitMV.set(p);
  }, [p, profitMV]);

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

  const base = baseRef.current;
  const sugg = useMemo(() => suggestions(base), [base]);
  const allWeek = useMemo(() => applyAll(base), [base]);
  const allResult = profit(allWeek);
  const earnBack = allResult - profit(base);
  const netRevenue = week.rev / GST_DIVISOR;
  const gst = week.rev - netRevenue;
  const cogsAmount = (week.cogs / 100) * week.rev;
  const cogsPct = week.cogs % 1 === 0 ? `${week.cogs}%` : `${week.cogs.toFixed(1)}%`;

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
          transition={{ duration: 0.45, delay: 0.7 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
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
            Mon 23 to Sun 29 Jun · your predicted profit, before it happens
          </p>
        </div>
      </Reveal>

      {/* verdict */}
      <Reveal delay={0.05}>
        <section
          className={`flex items-center justify-between gap-6 rounded-3xl p-6 transition-colors duration-300 sm:p-8 ${
            inProfit ? "bg-emerald-50" : "bg-red-50"
          }`}
        >
          <div className="max-w-sm">
            <TrafficLight inProfit={inProfit} />
            <motion.p
              className={`tnum mt-3 font-display text-[60px] font-semibold leading-none tracking-tight transition-colors duration-300 sm:text-[80px] ${
                inProfit ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {profitText}
            </motion.p>
            <p
              className={`mt-4 text-[15px] leading-relaxed ${
                inProfit ? "text-emerald-800" : "text-red-800"
              }`}
            >
              {inProfit
                ? "Chirp! You're on track for a profit next week. Keep it up and bank it."
                : "Chirp! You're on track to lose money next week. Tap a tip below and watch it turn green."}
            </p>
          </div>
          {inProfit ? (
            <Flap size={96} className="shrink-0 opacity-90" />
          ) : (
            <BirdeeMascot state="loss" size={96} float className="shrink-0 opacity-90" />
          )}
        </section>
      </Reveal>

      {/* Birdie's plan: the gains, second focal point */}
      <Reveal delay={0.55}>
        <div className="mt-10 flex items-center gap-3">
          <BirdeeMascot state="profit" size={40} className="shrink-0" />
          <h2 className="font-display text-[20px] font-semibold leading-tight tracking-tight sm:text-[23px]">
            Do these 3 things and you&apos;ll earn back{" "}
            <span className="tnum text-emerald-600">{money(earnBack)}</span> next
            week
          </h2>
        </div>
      </Reveal>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">{cards}</div>

      <Reveal delay={0.9}>
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
      </Reveal>

      {/* adjust: controllable variables */}
      <Reveal delay={1.0}>
        <div className="mb-4 mt-10 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <SlidersHorizontal size={18} weight="bold" />
        </span>
        <div>
          <h2 className="font-display text-[18px] font-semibold tracking-tight">
            Adjust this week&apos;s numbers
          </h2>
          <p className="text-[12.5px] text-ink/60">
            Drag any lever to see your profit update live.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Lever label="Revenue" display={money(week.rev)} min={10000} max={35000} step={100} value={week.rev} onChange={(v) => setWeek(scaleRevenue(week, v))} />
        <Lever label="Labour" display={money(week.lab)} min={3000} max={9000} step={20} value={week.lab} onChange={(v) => setWeek((w) => ({ ...w, lab: v }))} />
        <Lever label="Cost of goods" display={`${week.cogs % 1 === 0 ? week.cogs : week.cogs.toFixed(1)}%`} min={20} max={45} step={0.5} value={week.cogs} onChange={(v) => setWeek((w) => ({ ...w, cogs: v }))} />
        <Lever label="Fixed & variable" display={money(week.fix)} min={3000} max={9000} step={20} value={week.fix} onChange={(v) => setWeek((w) => ({ ...w, fix: v }))} />
        </div>
      </Reveal>

      {/* optional detail */}
      <Reveal delay={1.1}>
        <div className="mt-8 space-y-3">
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
                  inProfit ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {signedProfit(p)}
              </span>
            </div>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-ink/60">
            GST comes off the top line first. Cost of goods is a share of
            revenue; labour and fixed costs come straight off. It all updates as
            you drag the levers above.
          </p>
        </Collapsible>
        <Collapsible title="Revenue, day by day">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-[12px] text-ink/60">Predicted revenue per day</span>
            <span className="tnum text-[12px] text-ink/60">{money(week.rev)} / week</span>
          </div>
          <DayBreakdown days={dayBreakdown(week)} />
        </Collapsible>
        <Collapsible title="Net profit, last 6 weeks">
          <p className="mb-3 text-[12px] text-ink/60">
            This week&apos;s plan is your weakest, so act now.
          </p>
          <ProfitTrend />
        </Collapsible>
        </div>
      </Reveal>

      <Reveal delay={1.2}>
        <div className="mt-6 flex items-center justify-between">
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
