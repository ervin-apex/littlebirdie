import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { BirdeeMascot } from "@/components/BirdeeMascot";

/**
 * Period selector (round 2). Reached from the landing hub's
 * "How's my profit looking?" button. All four periods are wired to their data
 * on the dashboard via /app?period=<key>.
 */
const PERIODS: { key: string; label: string; sub: string }[] = [
  { key: "yesterday", label: "Yesterday", sub: "How yesterday landed" },
  { key: "last-week", label: "Last week", sub: "The finished week" },
  { key: "this-week", label: "This week", sub: "Tracking so far" },
  { key: "next-week", label: "Next week", sub: "Your forecast" },
];

export default function ProfitPeriodPage() {
  return (
    <AppShell maxWidth="max-w-2xl" center>
      <div className="fade-up w-full rounded-[28px] bg-white/95 p-6 shadow-[0_36px_70px_-34px_rgba(15,23,42,0.4)] sm:p-8 sm:px-10">
        <div className="flex w-full flex-col">
          <Link
            href="/home"
            className="mb-5 inline-flex items-center gap-1.5 self-start text-[13px] font-medium text-ink/55 transition-colors hover:text-ink/80"
          >
            <span aria-hidden>←</span> Back
          </Link>

          <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-ink">
              How&apos;s my profit looking?
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-ink/60">
              Pick a period to see budget vs actual.
            </p>
          </div>
          <BirdeeMascot
            state="profit"
            size={108}
            float
            className="hidden shrink-0 sm:block"
          />
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {PERIODS.map((p) => (
            <Link
              key={p.key}
              href={`/app?period=${p.key}`}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 transition hover:bg-amber-100 active:scale-[0.98]"
            >
              <span className="text-left">
                <span className="block font-display text-[18px] font-semibold leading-tight text-ink">
                  {p.label}
                </span>
                <span className="block text-[12px] text-ink/50">{p.sub}</span>
              </span>
              <span aria-hidden className="shrink-0 text-ink/40">
                →
              </span>
            </Link>
          ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
