"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { Flap } from "@/components/Flap";
import { BirdeeMascot } from "@/components/BirdeeMascot";
import { WeekSpreadsheet } from "@/components/WeekSpreadsheet";
import {
  DEFAULTS,
  dailyLedger,
  loadActuals,
  loadWeek,
  money,
  seedActuals,
  signedProfit,
  weekStatus,
  type Week,
  type WeekActuals,
} from "@/lib/profit";

/**
 * New dashboard (round 2) — budget vs actual, right in your face. Leads with the
 * projected-profit verdict and the day-by-day spreadsheet. The detailed v1
 * dashboard (levers, tips, history) lives at /app/v1.
 */
export default function DashboardPage() {
  const [week, setWeek] = useState<Week>(DEFAULTS);
  const [actuals, setActuals] = useState<WeekActuals>(() => seedActuals(DEFAULTS));

  useEffect(() => {
    const w = loadWeek();
    setWeek(w);
    setActuals(loadActuals(w));
  }, []);

  const status = weekStatus(week, actuals);
  const ledger = dailyLedger(week, actuals);
  const inProfit = status.inProfit;
  // > 0 = tracking behind the forecast so far.
  const behind = status.predictedNet - status.projectedNet;

  return (
    <div>
      <Reveal>
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-[22px] font-semibold tracking-tight">
              This week
            </h1>
            <p className="text-[13px] text-ink/60">
              Mon 23 to Sun 29 Jun
              {status.daysIn > 0 ? ` · ${status.daysIn} days in` : ""}
            </p>
          </div>
          <Link
            href="/profit"
            className="inline-flex min-h-[40px] items-center rounded-xl border border-black/10 bg-white px-3 text-[13px] font-medium text-ink/70 transition-colors hover:border-amber-300 hover:text-ink"
          >
            Change period
          </Link>
        </div>
      </Reveal>

      {/* budget vs actual verdict — front and centre */}
      <Reveal delay={0.05}>
        <section
          className={`rounded-3xl border bg-white p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.35)] transition-colors sm:p-7 ${
            inProfit ? "border-emerald-200" : "border-red-200"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[12px] font-medium uppercase tracking-wide text-ink/50">
                Projected profit this week
              </div>
              <p
                className={`tnum mt-1 font-display text-[52px] font-semibold leading-none tracking-tight sm:text-[64px] ${
                  inProfit ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {signedProfit(status.projectedNet)}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px]">
                <span className="inline-flex items-center rounded-full bg-[#f6f7f9] px-3 py-1.5 font-medium text-ink/65">
                  Budget said {signedProfit(status.predictedNet)}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1.5 font-semibold ${
                    behind > 0
                      ? "bg-red-100 text-red-700"
                      : behind < 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-[#f6f7f9] text-ink/70"
                  }`}
                >
                  {behind === 0
                    ? "On forecast"
                    : `${money(Math.abs(behind))} ${behind > 0 ? "behind forecast" : "ahead of forecast"}`}
                </span>
              </div>
            </div>
            {inProfit ? (
              <Flap size={88} className="shrink-0 opacity-90" />
            ) : (
              <BirdeeMascot state="loss" size={88} float className="shrink-0 opacity-90" />
            )}
          </div>
        </section>
      </Reveal>

      {/* day-by-day budget vs actual spreadsheet */}
      <Reveal delay={0.12}>
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-[16px] font-semibold tracking-tight">
              Budget vs actual, by day
            </h2>
            <div className="flex items-center gap-3 text-[11px] text-ink/50">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> beat
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" /> under
              </span>
            </div>
          </div>
          <WeekSpreadsheet rows={ledger} cogsPct={week.cogs} />
          <p className="mt-2 text-[11.5px] leading-relaxed text-ink/45">
            Big number = actual, small = budget. Upcoming days show budget only.
            Swipe sideways to see the whole week.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="mt-7 flex items-center justify-end text-[12.5px]">
          <Link
            href="/home"
            className="inline-flex min-h-[40px] items-center text-ink/55 transition-colors hover:text-ink/80"
          >
            Home
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
