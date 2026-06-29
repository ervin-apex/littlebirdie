import Link from "next/link";
import { AppShell } from "@/components/AppShell";

/**
 * Period selector (round 2). Reached from the landing hub's
 * "How's my profit looking?" button. Four big buttons; only "This week" is
 * wired to real data for the prototype — the others are visible-but-stubbed.
 */
const PERIODS: { key: string; label: string; href: string | null }[] = [
  { key: "yesterday", label: "Yesterday", href: null },
  { key: "last-week", label: "Last week", href: null },
  { key: "this-week", label: "This week", href: "/app" },
  { key: "next-week", label: "Next week", href: null },
];

export default function ProfitPeriodPage() {
  return (
    <AppShell maxWidth="max-w-2xl" center>
      <div className="fade-up flex w-full flex-col">
        <Link
          href="/home"
          className="mb-6 inline-flex items-center gap-1.5 self-start text-[13px] font-medium text-ink/55 transition-colors hover:text-ink/80"
        >
          <span aria-hidden>←</span> Back
        </Link>

        <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-ink">
          How&apos;s my profit looking?
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink/60">
          Pick a period to see budget vs actual.
        </p>

        <div className="mt-7 grid grid-cols-1 gap-3.5">
          {PERIODS.map((p) =>
            p.href ? (
              <Link
                key={p.key}
                href={p.href}
                className="flex w-full items-center justify-between rounded-2xl bg-amber-400 px-6 py-5 font-display text-[19px] font-semibold text-ink transition hover:bg-amber-300 active:scale-[0.98]"
              >
                {p.label}
                <span aria-hidden className="text-ink/50">→</span>
              </Link>
            ) : (
              <div
                key={p.key}
                aria-disabled
                className="flex w-full cursor-not-allowed items-center justify-between rounded-2xl bg-amber-100/70 px-6 py-5 font-display text-[19px] font-semibold text-ink/40"
              >
                {p.label}
                <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium text-ink/45">
                  Soon
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </AppShell>
  );
}
