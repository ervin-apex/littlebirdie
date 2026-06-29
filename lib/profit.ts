export type Week = {
  rev: number; // predicted revenue for the week (≈ sum of days)
  lab: number; // total labour cost
  fix: number; // fixed & variable costs (weekly, amortised from the P&L)
  cogs: number; // cost of goods, as a % of revenue
  days: number[]; // Mon..Sun predicted revenue split
};

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const DAY_FULL = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// The demo week runs Mon 23 to Sun 29 Jun; day i falls on the 23+i.
export function dayDateLabel(i: number): string {
  return `${DAY_FULL[i]}, ${23 + i} Jun`;
}

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

/** Birdee's three what-ifs for the current week, biggest gain first. */
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

/** Has the user actually saved their own numbers yet? The week key is only ever
 *  written when setup completes, so its presence gates the "How's my profit
 *  looking?" path (without it, loadWeek falls back to the demo DEFAULTS). */
export function hasSavedWeek(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

// ── Budget vs actual: per-day actuals (Mon..Sun) ──────────────────────────
export type DayActual = { rev: number; lab: number } | null;

export type WeekActuals = {
  todayIndex: number; // 0..6 (Mon..Sun); days before this are "past" (have actuals)
  actuals: DayActual[]; // length 7; null = today/future (no actual yet)
};

// Seeded variance vs the predicted day (only the first `todayIndex` are used).
// Tuned so a typical café week reads believably: revenue running under,
// labour running over, with one green beat (Tue) in the mix.
const SEED_REV_FACTORS = [0.9, 1.1, 0.86, 0.96, 0.94, 1.04, 0.98];
const SEED_LAB_FACTORS = [1.12, 0.98, 1.15, 1.08, 1.06, 1.04, 1.07];

/** Believable mock actuals for the days before `todayIndex` (demo data). */
export function seedActuals(w: Week, todayIndex = 3): WeekActuals {
  const pred = dayBreakdown(w);
  const sum = pred.reduce((s, x) => s + x, 0) || 1;
  const actuals: DayActual[] = pred.map((dayRev, i) => {
    if (i >= todayIndex) return null;
    const share = dayRev / sum;
    return {
      rev: Math.round(dayRev * SEED_REV_FACTORS[i]),
      lab: Math.round(share * w.lab * SEED_LAB_FACTORS[i]),
    };
  });
  return { todayIndex, actuals };
}

export type DayCell = {
  rev: number;
  cogs: number;
  lab: number;
  fix: number;
  net: number;
};

export type LedgerRow = {
  index: number;
  label: string;
  share: number; // predicted share of the week (0..1)
  predicted: DayCell;
  actual: DayCell | null;
  status: "past" | "today" | "future";
  light: "green" | "red" | null; // from actual net; null for today/future
  variance:
    | { net: number; rev: number; lab: number; driver: "revenue" | "labour" | "both" }
    | null;
};

function cell(rev: number, lab: number, fix: number, cogsPct: number): DayCell {
  const cogs = (cogsPct / 100) * rev;
  return { rev, cogs, lab, fix, net: rev / GST_DIVISOR - cogs - lab - fix };
}

/** The single source of truth for the day-by-day view. Predicted vs actual per
 *  day; fixed costs are always allocated by the *predicted* daily share, cost
 *  of goods is a flat %, and labour actual comes from the roster (mock/manual). */
export function dailyLedger(w: Week, a: WeekActuals): LedgerRow[] {
  const pred = dayBreakdown(w);
  const sum = pred.reduce((s, x) => s + x, 0) || 1;
  return pred.map((dayRev, i) => {
    const share = dayRev / sum;
    const predFix = share * w.fix;
    const predicted = cell(dayRev, share * w.lab, predFix, w.cogs);
    const av = a.actuals[i];
    const actual = av ? cell(av.rev, av.lab, predFix, w.cogs) : null;
    const status: LedgerRow["status"] =
      i < a.todayIndex ? "past" : i === a.todayIndex ? "today" : "future";
    let light: LedgerRow["light"] = null;
    let variance: LedgerRow["variance"] = null;
    if (actual) {
      // Scott's rule: the light shows whether the day BEAT its predicted target,
      // not whether it merely turned a profit.
      light = actual.net >= predicted.net ? "green" : "red";
      const revDelta = actual.rev - predicted.rev;
      const labDelta = actual.lab - predicted.lab;
      const revImpact = revDelta / GST_DIVISOR - (w.cogs / 100) * revDelta;
      const labImpact = -labDelta;
      const driver: "revenue" | "labour" | "both" =
        Math.abs(revImpact) >= Math.abs(labImpact) * 1.25
          ? "revenue"
          : Math.abs(labImpact) >= Math.abs(revImpact) * 1.25
            ? "labour"
            : "both";
      variance = {
        net: actual.net - predicted.net,
        rev: revDelta,
        lab: labDelta,
        driver,
      };
    }
    return { index: i, label: DAY_LABELS[i], share, predicted, actual, status, light, variance };
  });
}

export type WeekStatus = {
  toDateNet: number; // sum of actual net for past days
  remainingNet: number; // sum of predicted net for today + future
  projectedNet: number; // toDateNet + remainingNet (the headline number)
  predictedNet: number; // profit(w) — the pure plan
  inProfit: boolean;
  daysIn: number; // how many days have actuals
  variance: { rev: number; lab: number; cogs: number; net: number }; // actual − predicted, to date
};

/** Actual-to-date + predicted-for-the-rest. Equals the pure plan when there
 *  are no actuals (preserves the original verdict for a fresh week). */
export function weekStatus(w: Week, a: WeekActuals): WeekStatus {
  const rows = dailyLedger(w, a);
  let toDateNet = 0;
  let remainingNet = 0;
  let daysIn = 0;
  const v = { rev: 0, lab: 0, cogs: 0, net: 0 };
  for (const r of rows) {
    if (r.actual) {
      toDateNet += r.actual.net;
      daysIn += 1;
      v.rev += r.actual.rev - r.predicted.rev;
      v.lab += r.actual.lab - r.predicted.lab;
      v.cogs += r.actual.cogs - r.predicted.cogs;
      v.net += r.actual.net - r.predicted.net;
    } else {
      remainingNet += r.predicted.net;
    }
  }
  const projectedNet = toDateNet + remainingNet;
  return {
    toDateNet,
    remainingNet,
    projectedNet,
    predictedNet: profit(w),
    inProfit: projectedNet >= 0,
    daysIn,
    variance: v,
  };
}

const ACTUALS_KEY = "little-birdee-actuals";

export function loadActuals(w: Week): WeekActuals {
  if (typeof window === "undefined") return seedActuals(w);
  try {
    const raw = window.localStorage.getItem(ACTUALS_KEY);
    return raw ? (JSON.parse(raw) as WeekActuals) : seedActuals(w);
  } catch {
    return seedActuals(w);
  }
}

export function saveActuals(a: WeekActuals): void {
  try {
    window.localStorage.setItem(ACTUALS_KEY, JSON.stringify(a));
  } catch {
    // ignore
  }
}

// ── History: budget vs actual over recent weeks ───────────────────────────
export type HistoryBit = { predicted: number; actual: number };
export type HistoryWeek = {
  label: string;
  predNet: number;
  actNet: number;
  rev: HistoryBit;
  lab: HistoryBit;
  cogs: HistoryBit;
  fix: HistoryBit;
};

function histWeek(
  label: string,
  predRev: number,
  predLab: number,
  actRev: number,
  actLab: number,
  cogsPct = 35,
  fix = 5620,
): HistoryWeek {
  const predCogs = (cogsPct / 100) * predRev;
  const actCogs = (cogsPct / 100) * actRev;
  return {
    label,
    predNet: predRev / GST_DIVISOR - predCogs - predLab - fix,
    actNet: actRev / GST_DIVISOR - actCogs - actLab - fix,
    rev: { predicted: predRev, actual: actRev },
    lab: { predicted: predLab, actual: actLab },
    cogs: { predicted: predCogs, actual: actCogs },
    fix: { predicted: fix, actual: fix },
  };
}

// Seeded so the trend reads ~7% under revenue, ~11% over labour.
export const HISTORY: HistoryWeek[] = [
  histWeek("4 wks ago", 19000, 5800, 17500, 6500),
  histWeek("3 wks ago", 20500, 6100, 19200, 6800),
  histWeek("2 wks ago", 21000, 6200, 19400, 6900),
  histWeek("Last week", 20000, 6000, 18600, 6700),
];

export type TrendSummary = { rev: number; lab: number; cogs: number; fix: number };

/** Percentage that actual ran vs forecast across the window, per data bit.
 *  Negative = under forecast, positive = over forecast. */
export function historyTrends(h: HistoryWeek[]): TrendSummary {
  const pct = (key: "rev" | "lab" | "cogs" | "fix") => {
    const p = h.reduce((s, w) => s + w[key].predicted, 0);
    const a = h.reduce((s, w) => s + w[key].actual, 0);
    return p ? Math.round(((a - p) / p) * 100) : 0;
  };
  return { rev: pct("rev"), lab: pct("lab"), cogs: pct("cogs"), fix: pct("fix") };
}

export type LeverKey = "rev" | "lab" | "cogs" | "fix";

export const LEVER_META: Record<LeverKey, { label: string; cost: boolean }> = {
  rev: { label: "Revenue", cost: false },
  lab: { label: "Labour", cost: true },
  cogs: { label: "Cost of goods", cost: true },
  fix: { label: "Fixed costs", cost: true },
};

/** Is a variance % good, bad, or roughly on forecast for this lever? Revenue
 *  under forecast is bad; a cost over forecast is bad. Within ±2% = flat. */
export function leverDirection(key: LeverKey, pct: number): "good" | "bad" | "flat" {
  if (Math.abs(pct) <= 2) return "flat";
  const over = pct > 0;
  return over === LEVER_META[key].cost ? "bad" : "good";
}

/** The levers running against forecast, worst first, for the headline. */
export function worstLevers(
  t: TrendSummary,
): { key: LeverKey; pct: number; dir: "under" | "over" }[] {
  return (Object.keys(LEVER_META) as LeverKey[])
    .filter((k) => leverDirection(k, t[k]) === "bad")
    .sort((a, b) => Math.abs(t[b]) - Math.abs(t[a]))
    .map((k) => ({ key: k, pct: t[k], dir: t[k] > 0 ? "over" : "under" }));
}

/** Per-week variance vs forecast for one lever, oldest first (the sparkline). */
export function perWeekVariance(
  h: HistoryWeek[],
  key: LeverKey,
): { pct: number; dir: "good" | "bad" | "flat" }[] {
  return h.map((w) => {
    const bit = w[key];
    const pct = bit.predicted
      ? Math.round(((bit.actual - bit.predicted) / bit.predicted) * 100)
      : 0;
    return { pct, dir: leverDirection(key, pct) };
  });
}

/** Average net profit vs forecast across the window, for the footer. */
export function historyNetVariance(h: HistoryWeek[]): {
  avg: number;
  dir: "behind" | "ahead";
} {
  const total = h.reduce((s, w) => s + (w.actNet - w.predNet), 0);
  const avg = total / (h.length || 1);
  return { avg, dir: avg < 0 ? "behind" : "ahead" };
}
