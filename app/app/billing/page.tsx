import {
  CreditCard,
  DownloadSimple,
  Lightning,
} from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/Reveal";

const INVOICES = [
  { date: "1 Jun 2026", desc: "Little Birdie Pro · monthly", amount: "$49.00" },
  { date: "1 May 2026", desc: "Little Birdie Pro · monthly", amount: "$49.00" },
  { date: "1 Apr 2026", desc: "Little Birdie Pro · monthly", amount: "$49.00" },
  { date: "1 Mar 2026", desc: "Little Birdie Pro · monthly", amount: "$49.00" },
];

export default function BillingPage() {
  return (
    <div>
      <Reveal>
        <div className="mb-6">
          <h1 className="font-display text-[22px] font-semibold tracking-tight">
            Billing
          </h1>
          <p className="mt-0.5 text-[13px] text-ink/60">
            Your plan and payments.
          </p>
        </div>
      </Reveal>

      <div className="flex flex-col gap-5">
        {/* Current plan */}
        <section className="rounded-2xl border border-black/10 bg-white p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
                Current plan
              </p>
              <div className="mt-2 flex items-center gap-2.5">
                <h2 className="font-display text-[16px] font-semibold text-ink">
                  Little Birdie Pro
                </h2>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                  Active
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-display text-[26px] font-semibold tnum">
                  $49.00
                </span>
                <span className="text-[13px] text-ink/65 tnum">/ month AUD</span>
              </div>
              <p className="mt-2 text-[13px] text-ink/65">
                Next charge · 1 Jul 2026
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button className="rounded-xl bg-amber-400 px-4 py-2.5 font-display text-[14px] font-semibold text-amber-950 transition hover:bg-amber-300">
                Manage plan
              </button>
              <a
                href="#"
                className="inline-flex min-h-[44px] items-center text-[13px] font-medium text-ink/65 hover:text-ink/80"
              >
                View as PDF
              </a>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-2 border-t border-black/5 pt-4 text-[12px] text-ink/65">
            <Lightning
              size={18}
              weight="fill"
              aria-hidden="true"
              className="mt-px shrink-0 text-amber-600"
            />
            <p>
              You were auto-credentialed by email when you paid. No manual
              setup.
            </p>
          </div>
        </section>

        {/* Payment method */}
        <section className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
            Payment method
          </p>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f6f7f9] text-ink/70">
                <CreditCard size={20} aria-hidden="true" />
              </span>
              <div>
                <div className="text-[14px] font-medium text-ink">
                  Visa ending 4242
                </div>
                <div className="text-[12px] text-ink/65 tnum">
                  Expires 09/28
                </div>
              </div>
            </div>
            <button className="inline-flex min-h-[44px] items-center text-[13px] font-medium text-ink/65 hover:text-ink/80">
              Update
            </button>
          </div>
        </section>

        {/* Invoices */}
        <section className="rounded-2xl border border-black/10 bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
            Invoices
          </p>
          <ul className="mt-2 divide-y divide-black/5">
            {INVOICES.map((inv) => (
              <li
                key={inv.date}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium text-ink tnum">
                    {inv.date}
                  </div>
                  <div className="text-[12px] text-ink/65">{inv.desc}</div>
                </div>
                <div className="text-[14px] font-medium text-ink tnum">
                  {inv.amount}
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                  Paid
                </span>
                <button
                  aria-label={`Download invoice for ${inv.date}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink/60 transition hover:bg-black/[0.04] hover:text-ink/80"
                >
                  <DownloadSimple size={18} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
