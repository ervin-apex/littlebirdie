import {
  ArrowsClockwise,
  CheckCircle,
  Clock,
  PlugsConnected,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/Reveal";
import { assetPath } from "@/lib/site";

export default function ConnectionsPage() {
  return (
    <div>
      <Reveal>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[22px] font-semibold tracking-tight">
              Connections
            </h1>
            <p className="mt-0.5 text-[13px] text-ink/60">
              Connect your accounting and Birdee fills in your costs
              automatically, just once.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetPath("/brand/spot-connect.png")}
            alt=""
            className="hidden h-[84px] w-auto sm:block"
          />
        </div>
      </Reveal>

      {/* Accounting providers */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
          Accounting
        </p>

        <div className="mt-3 space-y-4">
          {/* Xero */}
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold lowercase text-white"
                  style={{ backgroundColor: "#13B5EA" }}
                  aria-hidden="true"
                >
                  xero
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-[15px] font-semibold text-ink">
                      Xero
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                      <CheckCircle size={13} weight="fill" aria-hidden="true" />
                      Connected
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink/65">
                    <Clock size={14} weight="regular" aria-hidden="true" />
                    Last synced today, 6:02am
                  </p>
                </div>
              </div>
            </div>

            {/* Auto-filled inset */}
            <div className="mt-4 rounded-xl border border-black/[0.06] bg-black/[0.02] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
                Auto-filled
              </p>
              <dl className="mt-2 grid gap-3 sm:grid-cols-2">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-[13px] text-ink/65">Cost of goods</dt>
                  <dd className="tnum text-[14px] font-semibold text-ink">
                    35%
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-[13px] text-ink/65">Fixed &amp; variable</dt>
                  <dd className="tnum text-[14px] font-semibold text-ink">
                    $5,620 / wk
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-4 flex items-center gap-5">
              <button
                type="button"
                className="inline-flex min-h-[44px] items-center gap-1.5 text-[13px] font-medium text-ink/65 transition hover:text-ink/80"
              >
                <ArrowsClockwise size={15} weight="regular" aria-hidden="true" />
                Reconnect
              </button>
              <button
                type="button"
                className="inline-flex min-h-[44px] items-center text-[13px] font-medium text-red-600 transition hover:text-red-500"
              >
                Disconnect
              </button>
            </div>
          </div>

          {/* MYOB */}
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold lowercase text-white"
                  style={{ backgroundColor: "#6100A5" }}
                  aria-hidden="true"
                >
                  myob
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-[15px] font-semibold text-ink">
                      MYOB
                    </h2>
                    <span className="inline-flex items-center rounded-full bg-black/5 px-2.5 py-0.5 text-[11px] font-medium text-ink/60">
                      Not connected
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 font-display text-[14px] font-semibold text-amber-950 transition hover:bg-amber-300"
              >
                <PlugsConnected size={18} weight="regular" aria-hidden="true" />
                Connect
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* What Birdee pulls */}
      <section className="mt-8">
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <ShieldCheck size={22} weight="fill" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-[15px] font-semibold text-ink">
                What Birdee pulls
              </h2>
              <p className="mt-1 max-w-prose text-[13px] leading-relaxed text-ink/65">
                12 months of your P&amp;L → your cost-of-goods % and a weekly
                fixed-cost figure. Read-only. We never see your bank login.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rostering — Phase 2 teaser */}
      <section className="mt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
          Rostering
        </p>
        <div className="mt-3 rounded-2xl border border-black/10 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-[15px] font-semibold text-ink">
                  Deputy
                </h2>
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                  Coming soon
                </span>
              </div>
              <p className="mt-1 text-[13px] text-ink/65">
                Auto-pull labour so it stops being a manual entry.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
