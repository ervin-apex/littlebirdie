import {
  calculateBreakEvenRevenueExGst,
  calculateEbitda,
  combineStatuses,
  normalizeRevenue,
  type GstRegistration,
  type Provenance,
  type RevenueEntryBasis,
  type ValueStatus,
} from "./finance";

export type Week = {
  rev: number; // predicted revenue for the week (≈ sum of days)
  lab: number; // total labour cost
  fix: number; // fixed & variable costs (weekly, amortised from the P&L)
  cogs: number; // cost of goods, as a % of revenue
  days: number[]; // Mon..Sun predicted revenue split
  gstRegistration: GstRegistration;
  revenueEntryBasis: RevenueEntryBasis;
  recurringIncome: number; // recurring operating other income for the week
  recurringIncomeConfirmed?: boolean;
  loadedHourlyLabourCost?: number;
  cogsProvenance?: Provenance;
  labourProvenance?: Provenance;
  otherCostsProvenance?: Provenance;
  recurringIncomeProvenance?: Provenance;
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

const SHORT_MONTH = new Intl.DateTimeFormat("en-AU", {
  month: "short",
  timeZone: "UTC",
});

function isoDateOffset(isoDate: string, days: number): Date {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function compactDate(date: Date): string {
  return `${date.getUTCDate()} ${SHORT_MONTH.format(date)}`;
}

export function weekDateLabel(weekStart: string): string {
  const start = isoDateOffset(weekStart, 0);
  const end = isoDateOffset(weekStart, 6);
  const startDate = start.getUTCMonth() === end.getUTCMonth()
    ? `${start.getUTCDate()}`
    : compactDate(start);
  return `Mon ${startDate} to Sun ${compactDate(end)}`;
}

export function dayDateLabel(i: number, weekStart: string): string {
  return `${DAY_FULL[i]}, ${compactDate(isoDateOffset(weekStart, i))}`;
}

// Australian GST gross-up factor, used only when a registered business enters
// fully taxable revenue on a GST-inclusive basis.
export const GST_DIVISOR = 1.1;

// A typical café week (example data). days sum to rev; weekends run hotter.
// Tuned to a healthy weekly profit so the demo shows the full colour range
// (a beat, an in-profit-but-under day, and a loss) rather than an all-red week.
export const DEFAULTS: Week = {
  rev: 20000,
  lab: 5200,
  fix: 4400,
  cogs: 30,
  days: [2400, 2400, 2600, 2900, 3300, 3400, 3000],
  gstRegistration: "registered-fully-taxable",
  revenueEntryBasis: "gst-inclusive",
  recurringIncome: 0,
  recurringIncomeConfirmed: true,
};

// The starting point for a venue that has never saved a plan. Authenticated
// setup must never seed one venue's form from another venue's numbers, so a
// first-time venue starts empty rather than from DEFAULTS or local storage.
export const BLANK_WEEK: Week = {
  rev: 0,
  lab: 0,
  fix: 0,
  cogs: 0,
  days: [0, 0, 0, 0, 0, 0, 0],
  gstRegistration: "registered-fully-taxable",
  revenueEntryBasis: "gst-inclusive",
  recurringIncome: 0,
  recurringIncomeConfirmed: false,
};

const forecastProvenance: Provenance = {
  source: "forecast",
  status: "forecast",
  label: "Entered sales budget; no live sync",
};
const setupEstimateProvenance: Provenance = {
  source: "manual",
  status: "estimated",
  label: "Entered during setup; no live sync",
};
const rosterBudgetProvenance: Provenance = {
  source: "manual",
  status: "estimated",
  label: "Entered roster budget; no live sync",
};
const demoRevenueProvenance: Provenance = {
  source: "manual",
  status: "estimated",
  label: "Demo actual data; no live sync",
};
const demoLabourProvenance: Provenance = {
  source: "manual",
  status: "estimated",
  label: "Demo labour data; no live sync",
};

function cogsProvenance(w: Week): Provenance {
  return w.cogsProvenance ?? setupEstimateProvenance;
}

function labourProvenance(w: Week): Provenance {
  return w.labourProvenance ?? rosterBudgetProvenance;
}

function otherCostsProvenance(w: Week): Provenance {
  return w.otherCostsProvenance ?? setupEstimateProvenance;
}

function recurringIncomeProvenance(w: Week): Provenance {
  return w.recurringIncomeProvenance ?? setupEstimateProvenance;
}

function dollarsToCents(value: number): number {
  return Math.round(value * 100);
}

function centsToDollars(value: number): number {
  return value / 100;
}

export function normalizedRevenue(
  w: Week,
  revenue = w.rev,
  provenance: Provenance = forecastProvenance,
) {
  return normalizeRevenue({
    enteredAmountCents: dollarsToCents(revenue),
    entryBasis: w.revenueEntryBasis,
    gstRegistration: w.gstRegistration,
    provenance,
  });
}

export function revenueExGst(w: Week, revenue = w.rev): number {
  return centsToDollars(
    normalizedRevenue(w, revenue).revenueExGst.amountCents,
  );
}

export function gstFromRevenue(w: Week, revenue = w.rev): number {
  if (w.revenueEntryBasis === "gst-exclusive") return 0;
  return centsToDollars(
    normalizedRevenue(w, revenue).gstAmountCents ?? 0,
  );
}

export function enteredRevenueFromExGst(
  w: Week,
  netRevenue: number,
): number {
  if (
    w.gstRegistration === "registered-fully-taxable" &&
    w.revenueEntryBasis === "gst-inclusive"
  ) {
    return netRevenue * GST_DIVISOR;
  }
  return netRevenue;
}

export function cogsForRevenue(w: Week, revenue = w.rev): number {
  return revenueExGst(w, revenue) * (w.cogs / 100);
}

export function profit(w: Week): number {
  const result = calculateEbitda({
    revenueExGst: normalizedRevenue(w).revenueExGst,
    cogsRate: {
      basisPoints: Math.round(w.cogs * 100),
      provenance: cogsProvenance(w),
    },
    labour: {
      amountCents: dollarsToCents(w.lab),
      provenance: labourProvenance(w),
    },
    otherOperatingCosts: {
      amountCents: dollarsToCents(w.fix),
      provenance: otherCostsProvenance(w),
    },
    recurringOperatingIncome: {
      amountCents: dollarsToCents(w.recurringIncome),
      provenance: recurringIncomeProvenance(w),
    },
  });
  return centsToDollars(result.amountCents);
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
  const netRevenue = revenueExGst(w);
  const labPct = netRevenue > 0 ? Math.round((w.lab / netRevenue) * 100) : 0;
  const cogsLabel = w.cogs % 1 === 0 ? `${w.cogs}` : w.cogs.toFixed(1);
  const defs: Pick<Suggestion, "key" | "action" | "reason" | "apply">[] = [
    {
      key: "rev",
      action: "Lift sales 3%",
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
      reason: `Labour is ${labPct}% of sales, running a touch high.`,
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

/** Local storage key from the pre-authentication demo. It is a single global
 *  key with no venue scope, so anything reading it in the authenticated product
 *  seeds one venue's form with another venue's numbers. Nothing writes it any
 *  more; this clears the leftover so a stale value cannot resurface. */
const LEGACY_STORAGE_KEY = "little-birdee-week";

export function clearLegacyWeekStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore — storage is a convenience, not required
  }
}

// ── Budget vs actual: per-day actuals (Mon..Sun) ──────────────────────────
export type DayActualSnapshot = {
  rev: number;
  lab: number;
  fix: number;
  otherIncome: number;
  cogs: number;
  gstRegistration: GstRegistration;
  revenueEntryBasis: RevenueEntryBasis;
};

export type DayActual = {
  rev: number;
  lab: number;
  revenueSource: "manual" | "pos";
  revenueStatus: ValueStatus;
  labourSource:
    | "manual"
    | "allocated-budget"
    | "roster-scheduled"
    | "timesheet-worked"
    | "timesheet-approved";
  labourStatus: ValueStatus;
  revision: number;
  updatedAt?: string;
  snapshot: DayActualSnapshot;
} | null;

export type WeekActuals = {
  todayIndex: number; // 0..6 (Mon..Sun); days before this are "past" (have actuals)
  actuals: DayActual[]; // length 7; null = today/future (no actual yet)
};

// Seeded variance vs the predicted day (only the first `todayIndex` are used).
// Tuned so the demo week shows the full profit-colour range across Mon–Wed:
// Mon lands in profit but under budget (light green), Tue beats budget (deep
// green + check), Wed tips into a loss (red).
const SEED_REV_FACTORS = [0.9, 1.1, 0.82, 0.96, 0.94, 1.04, 0.98];
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
        revenueSource: "manual",
        revenueStatus: "estimated",
        labourSource: "manual",
        labourStatus: "estimated",
        revision: 1,
        snapshot: {
          rev: dayRev,
          lab: Math.round(share * w.lab),
          fix: share * w.fix,
          otherIncome: share * w.recurringIncome,
          cogs: w.cogs,
          gstRegistration: w.gstRegistration,
          revenueEntryBasis: w.revenueEntryBasis,
        },
      };
  });
  return { todayIndex, actuals };
}

export type DayCell = {
  rev: number;
  netRevenue: number;
  gst: number;
  cogs: number;
  lab: number;
  fix: number;
  otherIncome: number;
  net: number;
  resultStatus: ValueStatus;
  componentProvenance: ComponentProvenance;
};

export type ComponentProvenance = {
  revenue: Provenance;
  recurringIncome: Provenance;
  cogs: Provenance;
  labour: Provenance;
  gst: Provenance;
  otherCosts: Provenance;
  profit: Provenance;
};

function mergeProvenance(
  left: Provenance,
  right: Provenance,
): Provenance {
  if (left.label === "No values in this scope") return right;
  if (
    left.source === right.source &&
    left.status === right.status &&
    left.label === right.label &&
    left.updatedAt === right.updatedAt
  ) {
    return left;
  }
  return {
    source: "derived",
    status: combineStatuses([left.status, right.status]),
    label: "Mixed sources across the selected period",
    updatedAt:
      [left.updatedAt, right.updatedAt]
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1),
  };
}

export function mergeComponentProvenance(
  left: ComponentProvenance,
  right: ComponentProvenance,
): ComponentProvenance {
  return {
    revenue: mergeProvenance(left.revenue, right.revenue),
    recurringIncome: mergeProvenance(
      left.recurringIncome,
      right.recurringIncome,
    ),
    cogs: mergeProvenance(left.cogs, right.cogs),
    labour: mergeProvenance(left.labour, right.labour),
    gst: mergeProvenance(left.gst, right.gst),
    otherCosts: mergeProvenance(left.otherCosts, right.otherCosts),
    profit: mergeProvenance(left.profit, right.profit),
  };
}

export function emptyComponentProvenance(
  status: ValueStatus,
): ComponentProvenance {
  const empty: Provenance = {
    source: "derived",
    status,
    label: "No values in this scope",
  };
  return {
    revenue: empty,
    recurringIncome: empty,
    cogs: empty,
    labour: empty,
    gst: empty,
    otherCosts: empty,
    profit: empty,
  };
}

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

function cell(
  w: Week,
  rev: number,
  lab: number,
  fix: number,
  otherIncome: number,
  inputStatus: "forecast" | "confirmed",
  actualInput?: Exclude<DayActual, null>,
): DayCell {
  const revenueProvenance: Provenance = inputStatus === "forecast"
    ? forecastProvenance
    : actualInput
      ? {
          source: actualInput.revenueSource,
          status: actualInput.revenueStatus,
          label:
            actualInput.revenueSource === "manual"
              ? "Entered manually for this day"
              : "Imported from the venue POS",
          updatedAt: actualInput.updatedAt,
        }
      : demoRevenueProvenance;
  const revenue = normalizedRevenue(w, rev, revenueProvenance);
  const result = calculateEbitda({
    revenueExGst: revenue.revenueExGst,
    cogsRate: {
      basisPoints: Math.round(w.cogs * 100),
      provenance: cogsProvenance(w),
    },
    labour: {
      amountCents: dollarsToCents(lab),
      provenance: inputStatus === "forecast"
        ? labourProvenance(w)
        : actualInput
          ? {
              source: actualInput.labourSource,
              status: actualInput.labourStatus,
              label:
                actualInput.labourSource === "allocated-budget"
                  ? "Estimated from the locked weekly roster budget"
                  : "Recorded labour for this day",
              updatedAt: actualInput.updatedAt,
            }
          : demoLabourProvenance,
    },
    otherOperatingCosts: {
      amountCents: dollarsToCents(fix),
      provenance: otherCostsProvenance(w),
    },
    recurringOperatingIncome: {
      amountCents: dollarsToCents(otherIncome),
      provenance: recurringIncomeProvenance(w),
    },
  });

  return {
    rev,
    netRevenue: centsToDollars(
      result.components.revenueExGst.amountCents,
    ),
    gst: gstFromRevenue(w, rev),
    cogs: centsToDollars(result.components.cogs.amountCents),
    lab,
    fix,
    otherIncome,
    net: centsToDollars(result.amountCents),
    resultStatus: result.status,
    componentProvenance: {
      revenue: result.components.revenueExGst.provenance,
      recurringIncome:
        result.components.recurringOperatingIncome.provenance,
      cogs: result.components.cogs.provenance,
      labour: result.components.labour.provenance,
      gst: {
        source: "derived",
        status: revenueProvenance.status,
        label:
          w.revenueEntryBasis === "gst-inclusive"
            ? "Calculated from the GST-inclusive actual"
            : "No GST removed from the GST-exclusive actual",
      },
      otherCosts: result.components.otherOperatingCosts.provenance,
      profit: {
        source: "derived",
        status: result.status,
        label: "Calculated from the components shown here",
      },
    },
  };
}

/** The single source of truth for the day-by-day view. Predicted vs actual per
 *  day; fixed costs are always allocated by the *predicted* daily share, cost
 *  of goods is a flat %, and labour actual comes from the roster (mock/manual). */
export function dailyLedger(w: Week, a: WeekActuals): LedgerRow[] {
  const pred = dayBreakdown(w);
  const sum = pred.reduce((s, x) => s + x, 0);
  return pred.map((dayRev, i) => {
    const share = sum > 0 ? dayRev / sum : 1 / pred.length;
    const predFix = share * w.fix;
    const predOtherIncome = share * w.recurringIncome;
    const predicted = cell(
      w,
      dayRev,
      share * w.lab,
      predFix,
      predOtherIncome,
      "forecast",
    );
    const av = a.actuals[i];
    const comparisonWeek = av
      ? {
          ...w,
          cogs: av.snapshot.cogs,
          gstRegistration: av.snapshot.gstRegistration,
          revenueEntryBasis: av.snapshot.revenueEntryBasis,
        }
      : w;
    const comparisonPredicted = av
      ? cell(
          comparisonWeek,
          av.snapshot.rev,
          av.snapshot.lab,
          av.snapshot.fix,
          av.snapshot.otherIncome,
          "forecast",
        )
      : predicted;
    const actual = av
      ? cell(
          comparisonWeek,
          av.rev,
          av.lab,
          av.snapshot.fix,
          av.snapshot.otherIncome,
          "confirmed",
          av,
        )
      : null;
    const status: LedgerRow["status"] =
      i < a.todayIndex ? "past" : i === a.todayIndex ? "today" : "future";
    let light: LedgerRow["light"] = null;
    let variance: LedgerRow["variance"] = null;
    if (actual) {
      // Scott's rule: the light shows whether the day BEAT its predicted target,
      // not whether it merely turned a profit.
      light = actual.net >= comparisonPredicted.net ? "green" : "red";
      const revDelta = actual.rev - comparisonPredicted.rev;
      const labDelta = actual.lab - comparisonPredicted.lab;
      const revImpact =
        actual.netRevenue -
        comparisonPredicted.netRevenue -
        (actual.cogs - comparisonPredicted.cogs);
      const labourIsEstimated = av?.labourSource === "allocated-budget";
      const labImpact = labourIsEstimated ? 0 : -labDelta;
      const driver: "revenue" | "labour" | "both" =
        labourIsEstimated || Math.abs(revImpact) >= Math.abs(labImpact) * 1.25
          ? "revenue"
          : Math.abs(labImpact) >= Math.abs(revImpact) * 1.25
            ? "labour"
            : "both";
      variance = {
        net: actual.net - comparisonPredicted.net,
        rev: revDelta,
        lab: labDelta,
        driver,
      };
    }
    return {
      index: i,
      label: DAY_LABELS[i],
      share,
      predicted: comparisonPredicted,
      actual,
      status,
      light,
      variance,
    };
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

// ── Break-even (Scott, round 3) ───────────────────────────────────────────
// Break-even = the revenue at which profit is exactly $0. GST and cost of goods
// scale with revenue, so they live in the "margin rate"; wages + fixed are the
// lump that revenue's margin has to cover. Profit = margin × (revenue − b/e),
// so the gauge can never contradict the profit figure. Uses actual wages once a
// day has them (projected for the week), budget otherwise — matching the
// numbers already on screen. See docs / breakeven design.
export type Breakeven = {
  breakeven: number; // revenue needed to hit $0 profit
  revenue: number; // revenue achieved / projected / forecast for the scope
  clearedBy: number; // revenue − breakeven (negative = short)
  cleared: boolean;
};

/** Break-even revenue in the same entered/display basis as the Week. */
export function breakevenRevenue(
  w: Week,
  wages: number,
  fix: number,
  otherIncome = 0,
): number {
  const netBreakEvenCents = calculateBreakEvenRevenueExGst(
    {
      basisPoints: Math.round(w.cogs * 100),
      provenance: cogsProvenance(w),
    },
    dollarsToCents(wages),
    dollarsToCents(fix),
    dollarsToCents(otherIncome),
  );
  let enteredRevenueCents = dollarsToCents(
    enteredRevenueFromExGst(
      w,
      centsToDollars(netBreakEvenCents),
    ),
  );

  const ebitdaAt = (candidateCents: number) =>
    calculateEbitda({
      revenueExGst: normalizeRevenue({
        enteredAmountCents: candidateCents,
        entryBasis: w.revenueEntryBasis,
        gstRegistration: w.gstRegistration,
        provenance: forecastProvenance,
      }).revenueExGst,
      cogsRate: {
        basisPoints: Math.round(w.cogs * 100),
        provenance: cogsProvenance(w),
      },
      labour: {
        amountCents: dollarsToCents(wages),
        provenance: {
          source: "allocated-budget",
          status: "estimated",
        },
      },
      otherOperatingCosts: {
        amountCents: dollarsToCents(fix),
        provenance: otherCostsProvenance(w),
      },
      recurringOperatingIncome: {
        amountCents: dollarsToCents(otherIncome),
        provenance: recurringIncomeProvenance(w),
      },
    }).amountCents;

  while (ebitdaAt(enteredRevenueCents) < 0) {
    enteredRevenueCents += 1;
  }
  while (
    enteredRevenueCents > 0 &&
    ebitdaAt(enteredRevenueCents - 1) >= 0
  ) {
    enteredRevenueCents -= 1;
  }

  return centsToDollars(enteredRevenueCents);
}

/** One day's break-even: actual wages once the day has them, else budget;
 *  fixed is the static allocation either way. */
export function dayBreakeven(row: LedgerRow, w: Week): Breakeven {
  const selectedCell = row.actual ?? row.predicted;
  const breakeven = breakevenRevenue(
    w,
    selectedCell.lab,
    selectedCell.fix,
    selectedCell.otherIncome,
  );
  return {
    breakeven,
    revenue: selectedCell.rev,
    clearedBy: selectedCell.rev - breakeven,
    cleared: selectedCell.rev >= breakeven,
  };
}

/** Break-even for a whole scope (a week, or a single day). Sums projected wages
 *  (actuals-to-date + budget for the rest) and total fixed vs projected revenue,
 *  so it always agrees with the projected profit. */
export function scopeBreakeven(rows: LedgerRow[], w: Week): Breakeven {
  let wages = 0;
  let fix = 0;
  let otherIncome = 0;
  let revenue = 0;
  for (const r of rows) {
    const selectedCell = r.actual ?? r.predicted;
    wages += selectedCell.lab;
    fix += r.predicted.fix;
    otherIncome += r.predicted.otherIncome;
    revenue += selectedCell.rev;
  }
  const breakeven = breakevenRevenue(w, wages, fix, otherIncome);
  return { breakeven, revenue, clearedBy: revenue - breakeven, cleared: revenue >= breakeven };
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

// ── Periods: yesterday / this week / last week / next week ─────────────────
export type PeriodKey =
  | "yesterday"
  | "this-week"
  | "last-week"
  | "next-week"
  | "month"
  | "custom";

export type HistoryRange = { from: string; to: string };

export const DEMO_HISTORY_RANGE: HistoryRange = {
  from: "2026-06-01",
  to: "2026-06-30",
};

export type ReportingPeriodOption = {
  key: PeriodKey;
  label: string;
  available: boolean;
};

/**
 * Only periods backed by records for the selected venue are selectable during
 * the manual launch. The other labels stay visible so the roadmap remains
 * understandable, but they must never open the retired seeded/demo builders.
 */
export const PERIODS: ReportingPeriodOption[] = [
  { key: "yesterday", label: "Yesterday", available: true },
  { key: "last-week", label: "Last week", available: false },
  { key: "this-week", label: "This week", available: true },
  { key: "next-week", label: "Next week", available: false },
  { key: "month", label: "Month", available: false },
  { key: "custom", label: "Custom", available: false },
];

export function isAvailableReportingPeriod(
  value: string | null | undefined,
): value is PeriodKey {
  return PERIODS.some((period) => period.key === value && period.available);
}

// A believable completed prior week — the predicted plan; actuals are seeded for
// all seven days so it reads as a finished week (came in a touch under).
export const LAST_WEEK: Week = {
  ...DEFAULTS,
  rev: 19000,
  lab: 6100,
  fix: 5620,
  cogs: 35,
  days: [2200, 2300, 2500, 2800, 3100, 3200, 2900],
};

/** No actuals yet — every day shows budget only (a pure forecast). todayIndex
 *  is -1 so no day is flagged "today"; all seven read as upcoming. */
export function forecastActuals(): WeekActuals {
  return { todayIndex: -1, actuals: Array.from({ length: 7 }, () => null) };
}

export type PeriodView = {
  key: PeriodKey;
  title: string;
  dateLabel: string;
  week: Week;
  actuals: WeekActuals;
  scope: "week" | "day" | "history";
  dayIndex: number | null; // set when scope === "day"
  historyRows?: LedgerRow[];
  isDemo?: boolean;
};

export function periodHeadlineProfit({
  scope,
  isFuture,
  dayActualNet,
  dayPredictedNet,
  projectedNet,
  predictedNet,
  historyActualNet,
}: {
  scope: PeriodView["scope"];
  isFuture: boolean;
  dayActualNet?: number;
  dayPredictedNet?: number;
  projectedNet: number;
  predictedNet: number;
  historyActualNet: number;
}): number {
  if (scope === "day") return dayActualNet ?? dayPredictedNet ?? 0;
  if (scope === "history") return historyActualNet;
  return isFuture ? predictedNet : projectedNet;
}

type DemoHistoryRecord = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  predicted: DayCell;
  actual: DayCell;
};

function historyCell(
  rev: number,
  lab: number,
  fix: number,
  cogsPct = 30,
  status: "forecast" | "confirmed" = "confirmed",
): DayCell {
  return cell(
    { ...DEFAULTS, cogs: cogsPct },
    rev,
    lab,
    fix,
    0,
    status,
  );
}

/** Dated concept records used only to exercise the Month and Custom flows. */
const DEMO_HISTORY_RECORDS: DemoHistoryRecord[] = [
  { id: "2026-06-01", label: "1–7 Jun", startDate: "2026-06-01", endDate: "2026-06-07", predicted: historyCell(19000, 5000, 4400, 30, "forecast"), actual: historyCell(17800, 5300, 4400) },
  { id: "2026-06-08", label: "8–14 Jun", startDate: "2026-06-08", endDate: "2026-06-14", predicted: historyCell(20500, 5200, 4400, 30, "forecast"), actual: historyCell(19600, 5450, 4400) },
  { id: "2026-06-15", label: "15–21 Jun", startDate: "2026-06-15", endDate: "2026-06-21", predicted: historyCell(21000, 5300, 4400, 30, "forecast"), actual: historyCell(21400, 5200, 4400) },
  { id: "2026-06-22", label: "22–28 Jun", startDate: "2026-06-22", endDate: "2026-06-28", predicted: historyCell(20000, 5200, 4400, 30, "forecast"), actual: historyCell(19200, 5400, 4400) },
  { id: "2026-06-29", label: "29–30 Jun", startDate: "2026-06-29", endDate: "2026-06-30", predicted: historyCell(6000, 1500, 1260, 30, "forecast"), actual: historyCell(5900, 1560, 1260) },
];

const DAY_MS = 86_400_000;

function isoTime(value: string): number {
  return Date.parse(`${value}T00:00:00Z`);
}

function isoFromTime(value: number): string {
  return new Date(value).toISOString().slice(0, 10);
}

function inclusiveDays(from: string, to: string): number {
  return Math.max(0, Math.round((isoTime(to) - isoTime(from)) / DAY_MS) + 1);
}

function clampHistoryRange(range?: HistoryRange): HistoryRange {
  const requestedFrom = range?.from && !Number.isNaN(isoTime(range.from)) ? range.from : DEMO_HISTORY_RANGE.from;
  const requestedTo = range?.to && !Number.isNaN(isoTime(range.to)) ? range.to : DEMO_HISTORY_RANGE.to;
  const from = isoFromTime(Math.max(isoTime(DEMO_HISTORY_RANGE.from), isoTime(requestedFrom)));
  const to = isoFromTime(Math.min(isoTime(DEMO_HISTORY_RANGE.to), isoTime(requestedTo)));
  return isoTime(from) <= isoTime(to) ? { from, to } : DEMO_HISTORY_RANGE;
}

function scaleCell(source: DayCell, factor: number): DayCell {
  return {
    rev: source.rev * factor,
    netRevenue: source.netRevenue * factor,
    gst: source.gst * factor,
    cogs: source.cogs * factor,
    lab: source.lab * factor,
    fix: source.fix * factor,
    otherIncome: source.otherIncome * factor,
    net: source.net * factor,
    resultStatus: source.resultStatus,
    componentProvenance: source.componentProvenance,
  };
}

function historyRows(range: HistoryRange): LedgerRow[] {
  const rows = DEMO_HISTORY_RECORDS.flatMap((record) => {
    const from = isoFromTime(Math.max(isoTime(range.from), isoTime(record.startDate)));
    const to = isoFromTime(Math.min(isoTime(range.to), isoTime(record.endDate)));
    if (isoTime(from) > isoTime(to)) return [];

    const factor = inclusiveDays(from, to) / inclusiveDays(record.startDate, record.endDate);
    const predicted = scaleCell(record.predicted, factor);
    const actual = scaleCell(record.actual, factor);
    const revDelta = actual.rev - predicted.rev;
    const labDelta = actual.lab - predicted.lab;
    const revImpact =
      actual.netRevenue -
      predicted.netRevenue -
      (actual.cogs - predicted.cogs);
    const labImpact = -labDelta;
    const driver: "revenue" | "labour" | "both" =
      Math.abs(revImpact) >= Math.abs(labImpact) * 1.25
        ? "revenue"
        : Math.abs(labImpact) >= Math.abs(revImpact) * 1.25
          ? "labour"
          : "both";
    const isFullRecord = from === record.startDate && to === record.endDate;
    const label = isFullRecord ? record.label : formatDemoDateRange(from, to);

    return [{
      index: 0,
      label,
      share: 0,
      predicted,
      actual,
      status: "past" as const,
      light: actual.net >= predicted.net ? "green" as const : "red" as const,
      variance: { net: actual.net - predicted.net, rev: revDelta, lab: labDelta, driver },
    }];
  });

  const totalRevenue = rows.reduce((sum, row) => sum + row.predicted.rev, 0) || 1;
  return rows.map((row, index) => ({
    ...row,
    index,
    share: row.predicted.rev / totalRevenue,
  }));
}

function formatDemoDateRange(from: string, to: string): string {
  const formatter = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", timeZone: "UTC" });
  const start = formatter.format(new Date(`${from}T00:00:00Z`));
  const end = formatter.format(new Date(`${to}T00:00:00Z`));
  return start === end ? start : `${start}–${end}`;
}

function aggregateCells(rows: LedgerRow[], source: "predicted" | "actual"): DayCell {
  return rows.reduce<DayCell>((sum, row) => {
    const value = source === "predicted" ? row.predicted : row.actual;
    if (!value) return sum;
    return {
      rev: sum.rev + value.rev,
      netRevenue: sum.netRevenue + value.netRevenue,
      gst: sum.gst + value.gst,
      cogs: sum.cogs + value.cogs,
      lab: sum.lab + value.lab,
      fix: sum.fix + value.fix,
      otherIncome: sum.otherIncome + value.otherIncome,
      net: sum.net + value.net,
      resultStatus: sum.resultStatus,
      componentProvenance: mergeComponentProvenance(
        sum.componentProvenance,
        value.componentProvenance,
      ),
    };
  }, {
    rev: 0,
    netRevenue: 0,
    gst: 0,
    cogs: 0,
    lab: 0,
    fix: 0,
    otherIncome: 0,
    net: 0,
    resultStatus: source === "predicted" ? "forecast" : "estimated",
    componentProvenance: emptyComponentProvenance(
      source === "predicted" ? "forecast" : "estimated",
    ),
  });
}

function buildHistoryPeriod(key: "month" | "custom", requestedRange?: HistoryRange): PeriodView {
  const range = key === "month" ? DEMO_HISTORY_RANGE : clampHistoryRange(requestedRange);
  const rows = historyRows(range);
  const predicted = aggregateCells(rows, "predicted");
  const cogsPct = predicted.netRevenue
    ? (predicted.cogs / predicted.netRevenue) * 100
    : 30;
  const weights = DEFAULTS.days.map((day) => day / DEFAULTS.rev);
  const week: Week = {
    ...DEFAULTS,
    rev: predicted.rev,
    lab: predicted.lab,
    fix: predicted.fix,
    cogs: cogsPct,
    days: weights.map((weight) => predicted.rev * weight),
  };

  return {
    key,
    title: key === "month" ? "June 2026" : "Custom range",
    dateLabel: `${formatDemoDateRange(range.from, range.to)} · Demo data`,
    week,
    actuals: forecastActuals(),
    scope: "history",
    dayIndex: null,
    historyRows: rows,
    isDemo: true,
  };
}

/** Resolve a period key to the week + actuals (and framing) the dashboard
 *  renders. `baseWeek` / `baseActuals` are the user's saved current week. */
export function buildPeriodView(
  key: PeriodKey,
  baseWeek: Week,
  baseActuals: WeekActuals,
  baseWeekStart: string,
  historyRange?: HistoryRange,
): PeriodView {
  switch (key) {
    case "month":
    case "custom":
      return buildHistoryPeriod(key, historyRange);
    case "last-week":
      return {
        key,
        title: "Last week",
        dateLabel: weekDateLabel(
          isoDateOffset(baseWeekStart, -7).toISOString().slice(0, 10),
        ),
        week: LAST_WEEK,
        actuals: seedActuals(LAST_WEEK, 7),
        scope: "week",
        dayIndex: null,
      };
    case "next-week":
      return {
        key,
        title: "Next week",
        dateLabel: weekDateLabel(
          isoDateOffset(baseWeekStart, 7).toISOString().slice(0, 10),
        ),
        week: baseWeek,
        actuals: forecastActuals(),
        scope: "week",
        dayIndex: null,
      };
    case "yesterday": {
      const yi = Math.max(0, baseActuals.todayIndex - 1);
      return {
        key,
        title: "Yesterday",
        dateLabel: dayDateLabel(yi, baseWeekStart),
        week: baseWeek,
        actuals: baseActuals,
        scope: "day",
        dayIndex: yi,
      };
    }
    case "this-week":
    default:
      return {
        key,
        title: "This week",
        dateLabel: weekDateLabel(baseWeekStart),
        week: baseWeek,
        actuals: baseActuals,
        scope: "week",
        dayIndex: null,
      };
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
  const historyWeek = { ...DEFAULTS, cogs: cogsPct };
  const predicted = cell(
    historyWeek,
    predRev,
    predLab,
    fix,
    0,
    "forecast",
  );
  const actual = cell(
    historyWeek,
    actRev,
    actLab,
    fix,
    0,
    "confirmed",
  );
  return {
    label,
    predNet: predicted.net,
    actNet: actual.net,
    rev: { predicted: predRev, actual: actRev },
    lab: { predicted: predLab, actual: actLab },
    cogs: { predicted: predicted.cogs, actual: actual.cogs },
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
  rev: { label: "Actual", cost: false },
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
