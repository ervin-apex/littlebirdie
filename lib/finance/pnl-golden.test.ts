import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import goldenSamples from "../../docs/P and Ls/ground_truth.json";
import { baselineForPeriod } from "./baseline";
import { calculateEbitda } from "./ebitda";
import {
  summarizeClassifiedPnl,
  type ClassifiedPnlAccount,
  type PnlAccountCategory,
} from "./classification";
import { inclusiveDayCount, scalePeriodAmount } from "./period";
import type { DateRange, Provenance } from "./types";

type GoldenAccount = {
  label: string;
  amount: number;
  category: PnlAccountCategory;
  operator_confirmed: boolean;
};

type GoldenSample = (typeof goldenSamples)[number] & {
  little_birdee: {
    selected_value_column: string;
    period_days: number;
    expected_cogs_rate_basis_points: number;
    expected_labour: number;
    expected_other_operating_costs: number;
    expected_recurring_operating_income: number;
    expected_ebitda: number;
    expected_rate_based_ebitda: number;
    expected_weekly_other_operating_costs: number;
    accounts: GoldenAccount[];
    warnings: string[];
  };
};

const samples = goldenSamples as GoldenSample[];
const pnlProvenance: Provenance = {
  source: "pnl",
  status: "estimated",
};
const confirmedManualProvenance: Provenance = {
  source: "manual",
  status: "confirmed",
};
const sevenDayTarget: DateRange = {
  from: "2026-01-05",
  to: "2026-01-11",
};

function cents(dollars: number): number {
  return Math.round(dollars * 100);
}

function classifiedAccounts(sample: GoldenSample): ClassifiedPnlAccount[] {
  return sample.little_birdee.accounts.map((account, index) => ({
    id: `${sample.file}:${index}`,
    label: account.label,
    amountCents: cents(account.amount),
    category: account.category as PnlAccountCategory,
    operatorConfirmed: account.operator_confirmed,
  }));
}

function calculatedResult(
  sample: GoldenSample,
  provenance: Provenance,
) {
  const summary = summarizeClassifiedPnl(classifiedAccounts(sample));
  return {
    summary,
    result: calculateEbitda({
      revenueExGst: {
        amountCents: summary.revenueCents,
        provenance,
      },
      cogsRate: {
        basisPoints:
          sample.little_birdee.expected_cogs_rate_basis_points,
        provenance,
      },
      labour: {
        amountCents: summary.labourCents,
        provenance,
      },
      otherOperatingCosts: {
        amountCents: summary.otherOperatingCostsCents,
        provenance,
      },
      recurringOperatingIncome: {
        amountCents: summary.recurringOperatingIncomeCents,
        provenance,
      },
    }),
  };
}

describe("Scott's five P&L golden samples", () => {
  it("keeps all five source PDFs attached to the extraction oracle", () => {
    expect(samples).toHaveLength(5);

    for (const sample of samples) {
      expect(
        existsSync(resolve("docs", "P and Ls", sample.file)),
        `${sample.file} should exist`,
      ).toBe(true);
      expect(sample.gst_basis).toBe("Exclusive");
      expect(sample.little_birdee.selected_value_column.length).toBeGreaterThan(
        0,
      );
    }
  });

  it.each(samples)(
    "$business_type: reconciles classifications to Little Birdee EBITDA",
    (sample) => {
      const { summary, result } = calculatedResult(
        sample,
        pnlProvenance,
      );
      const expected = sample.little_birdee;

      expect(summary.revenueCents).toBe(cents(sample.total_revenue));
      expect(summary.cogsCents).toBe(cents(sample.total_cogs));
      expect(summary.labourCents).toBe(cents(expected.expected_labour));
      expect(summary.otherOperatingCostsCents).toBe(
        cents(expected.expected_other_operating_costs),
      );
      expect(summary.recurringOperatingIncomeCents).toBe(
        cents(expected.expected_recurring_operating_income),
      );
      const exactSourcePeriodEbitda =
        summary.revenueCents +
        summary.recurringOperatingIncomeCents -
        summary.cogsCents -
        summary.labourCents -
        summary.otherOperatingCostsCents;
      expect(exactSourcePeriodEbitda).toBe(
        cents(expected.expected_ebitda),
      );
      expect(result.amountCents).toBe(
        cents(expected.expected_rate_based_ebitda),
      );
      expect(result.status).toBe("estimated");

      expect(
        Math.round(
          (summary.cogsCents / summary.revenueCents) * 10_000,
        ),
      ).toBe(expected.expected_cogs_rate_basis_points);
      expect(summary.unconfirmedAccounts).toHaveLength(
        expected.warnings.length,
      );
    },
  );

  it.each(samples)(
    "$business_type: scales the proposed other-cost baseline by exact days",
    (sample) => {
      const sourcePeriod = {
        from: sample.period_start,
        to: sample.period_end,
      };
      expect(inclusiveDayCount(sourcePeriod)).toBe(
        sample.little_birdee.period_days,
      );
      expect(
        scalePeriodAmount(
          cents(
            sample.little_birdee.expected_other_operating_costs,
          ),
          sourcePeriod,
          sevenDayTarget,
        ),
      ).toBe(
        cents(
          sample.little_birdee
            .expected_weekly_other_operating_costs,
        ),
      );
    },
  );

  it.each(samples)(
    "$business_type: blocks an ambiguous baseline until operator confirmation",
    (sample) => {
      const baseline = {
        originalAmountCents: cents(
          sample.little_birdee.expected_other_operating_costs,
        ),
        sourcePeriod: {
          from: sample.period_start,
          to: sample.period_end,
        },
        provenance: {
          source: "pnl" as const,
          status: "confirmed" as const,
          sourceId: sample.file,
        },
        operatorConfirmed:
          sample.little_birdee.warnings.length === 0,
      };

      if (sample.little_birdee.warnings.length > 0) {
        expect(() =>
          baselineForPeriod(
            baseline,
            sevenDayTarget,
            "Other costs",
          ),
        ).toThrow("classification is confirmed");
        return;
      }

      expect(
        baselineForPeriod(
          baseline,
          sevenDayTarget,
          "Other costs",
        ).amountCents,
      ).toBe(
        cents(
          sample.little_birdee
            .expected_weekly_other_operating_costs,
        ),
      );
    },
  );

  it.each(samples)(
    "$business_type: gives manual and extracted equivalent inputs the same result",
    (sample) => {
      const extracted = calculatedResult(
        sample,
        pnlProvenance,
      ).result;
      const manual = calculatedResult(
        sample,
        confirmedManualProvenance,
      ).result;

      expect(manual.amountCents).toBe(extracted.amountCents);
      expect(manual.components.cogs.amountCents).toBe(
        extracted.components.cogs.amountCents,
      );
    },
  );
});
