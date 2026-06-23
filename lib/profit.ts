export type Week = {
  rev: number; // predicted revenue for the week (≈ sum of days)
  lab: number; // total labour cost
  fix: number; // fixed & variable costs (weekly, amortised from the P&L)
  cogs: number; // cost of goods, as a % of revenue
  days: number[]; // Mon..Sun predicted revenue split
};

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// GST is 10% in Australia — taken off the top revenue line to get a net figure.
export const GST_DIVISOR = 1.1;

// A typical café week (example data). days sum to rev; weekends run hotter.
export const DEFAULTS: Week = {
  rev: 20000,
  lab: 6000,
  fix: 5620,
  cogs: 35,
  days: [2400, 2400, 2600, 2900, 3300, 3400, 3000],
};

export function profit(w: Week): number {
  const netRevenue = w.rev / GST_DIVISOR;
  const cogs = (w.cogs / 100) * w.rev;
  return netRevenue - cogs - w.lab - w.fix;
}

/** Per-day predicted revenue scaled to the current weekly total (robust to
 *  any drift between `rev` and the stored `days`). */
export function dayBreakdown(w: Week): number[] {
  const sum = w.days.reduce((a, b) => a + b, 0) || 1;
  return w.days.map((d) => Math.round((w.rev * d) / sum));
}

/** Scale every day proportionally so the week totals `total`. */
export function scaleRevenue(w: Week, total: number): Week {
  const sum = w.days.reduce((a, b) => a + b, 0) || 1;
  const f = total / sum;
  return { ...w, rev: total, days: w.days.map((d) => d * f) };
}

/** Set one day's revenue; the weekly total follows. */
export function setDay(w: Week, i: number, val: number): Week {
  const days = [...w.days];
  days[i] = val;
  return { ...w, days, rev: days.reduce((a, b) => a + b, 0) };
}

const aud = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

/** Absolute dollar figure, rounded, e.g. "$438". */
export function money(n: number): string {
  return aud.format(Math.round(Math.abs(n)));
}

/** Signed profit, e.g. "+$223" or "−$438" (true minus sign). */
export function signedProfit(n: number): string {
  const rounded = Math.round(n);
  return `${rounded >= 0 ? "+" : "−"}${money(rounded)}`;
}

export type Suggestion = {
  key: keyof Week;
  action: string; // e.g. "Trim labour 2%"
  reason: string; // concise diagnosis, e.g. "Labour is 30% of revenue — high"
  apply: Partial<Week>;
  gain: number; // extra $ next week vs the current plan
  result: number; // resulting weekly profit if applied alone
};

/** Birdie's three what-ifs for the current week, biggest gain first. */
export function suggestions(w: Week): Suggestion[] {
  const base = profit(w);
  const labPct = Math.round((w.lab / w.rev) * 100);
  const cogsLabel = w.cogs % 1 === 0 ? `${w.cogs}` : w.cogs.toFixed(1);
  const defs: Pick<Suggestion, "key" | "action" | "reason" | "apply">[] = [
    {
      key: "rev",
      action: "Lift revenue 3%",
      reason: "A small lift clears your break-even line.",
      apply: { rev: Math.round((w.rev * 1.03) / 10) * 10 },
    },
    {
      key: "cogs",
      action: "Cut cost of goods 1pt",
      reason: `Cost of goods at ${cogsLabel}% is squeezing your margin.`,
      apply: { cogs: Math.max(0, Math.round((w.cogs - 1) * 2) / 2) },
    },
    {
      key: "lab",
      action: "Trim labour 2%",
      reason: `Labour is ${labPct}% of revenue, running a touch high.`,
      apply: { lab: Math.round((w.lab * 0.98) / 10) * 10 },
    },
  ];
  return defs
    .map((d) => {
      const result = profit({ ...w, ...d.apply });
      return { ...d, result, gain: result - base };
    })
    .sort((a, b) => b.gain - a.gain);
}

/** The week with all three suggestions applied. */
export function applyAll(w: Week): Week {
  return suggestions(w).reduce((acc, s) => ({ ...acc, ...s.apply }), { ...w });
}

const STORAGE_KEY = "little-birdee-week";

export function loadWeek(): Week {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function saveWeek(w: Week): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(w));
  } catch {
    // ignore — storage is a convenience, not required
  }
}
