"use client";

import { useEffect } from "react";
import { assetPath } from "@/lib/site";

/**
 * Change 8: tap a table cell to learn what it is. Copy is Scott's, lightly
 * tidied but kept in his operator voice, structured as lead → detail → a
 * Birdee callout (the encouraging "LB thinks yes" beat) → optional masterclass
 * CTA (placeholder until that content exists). Each modal opens with a brand
 * spot illustration on a cream header band.
 */
export type ExplainerKey = "rev" | "cogs" | "lab" | "gst" | "fix" | "net" | "breakeven";

type Explainer = {
  title: string;
  kicker: string; // one-line framing under the title
  image: string; // brand spot illustration
  lead: string; // opening paragraph, slightly larger
  paras?: string[]; // supporting detail
  note?: string; // small factual footnote (quiet)
  callout?: string; // the "Little Birdee thinks yes" beat, in a branded box
  link?: string; // masterclass CTA label (not yet wired)
  linkNote?: string; // Scott's humble disclaimer under the CTA
};

export const EXPLAINERS: Record<ExplainerKey, Explainer> = {
  rev: {
    title: "Revenue",
    kicker: "Money through the till",
    image: "/brand/step-revenue.png",
    lead: "You know what this one is — we won't ask silly questions.",
    callout:
      "The only question that matters: have you linked your POS, so these numbers are actually accurate?",
  },
  breakeven: {
    title: "Break-even",
    kicker: "The revenue where profit hits $0",
    image: "/brand/spot-breakeven.png",
    lead: "The revenue you need to cover every cost — the point where profit is exactly $0. Clear the line and you're making money; fall short and the day is a loss.",
    paras: [
      "It's worked out from your wages and fixed costs, divided by the margin each revenue dollar leaves after GST and cost of goods.",
    ],
    note: "Break-even = (Wages + Fixed & variable) ÷ margin per revenue dollar",
    callout: "Everything you sell above the line is profit — that's the number to chase each day.",
  },
  cogs: {
    title: "Cost of goods",
    kicker: "A key profit driver",
    image: "/brand/step-cogs.png",
    lead: "This percentage is pulled from your previous P&Ls — an accurate picture of your cost of goods for what's actually happened in your business.",
    paras: [
      "This is a KEY profit driver. Making it visible — and showing the impact it has on your profit — gives you the tools to know where the profit bleed is.",
    ],
    callout:
      "The big question: can you maintain customer experience whilst dropping your COGS? Little Birdee thinks yes!",
    link: "Go to the COGS masterclasses",
    linkNote:
      "LB would never tell you how to run your business — but these masterclasses might give you a few insights into how other operators trimmed that % without impacting customer experience.",
  },
  lab: {
    title: "Wages",
    kicker: "Usually your biggest cost",
    image: "/brand/step-labour.png",
    lead: "If you've linked your rostering software, this is the day's casual wages, plus a share of the full-timers working, office staff, and directly-employed cleaners.",
    paras: [
      "Contract cleaners aren't here — their cost shows up in the amortised Fixed & variable line instead.",
      "That method doesn't suit every business, so you can opt in here to amortise your whole wage bill instead — including super, leave loading, workers comp and payroll tax, but not uniforms or staff meals (those live in F+V).",
    ],
    note: "Amortise (it's important — you'll see it a lot): taking a big yearly cost and spreading it into small daily slices, so it shows up where it belongs.",
    callout:
      "Wages are often the biggest cost a business has — and rightly so, because we love our team, right? But can you trim those costs without negatively impacting team culture, revenue or the customer experience? Little Birdee thinks yes!",
    link: "Go to the Wages masterclasses",
    linkNote:
      "LB would never tell you how to run your business — but these masterclasses might give you a few insights into how other operators trimmed that % without impacting customer experience.",
  },
  gst: {
    title: "GST",
    kicker: "Collected, not kept",
    image: "/brand/spot-gst.png",
    lead: "The 10% you collect on sales and owe the ATO. Little Birdee takes it off the top before working out profit, so what you see is truly yours.",
    note: "That's why it sits quietly in the table — it's not a lever you pull.",
  },
  fix: {
    title: "Fixed & variable",
    kicker: "The non-prime costs, amortised",
    image: "/brand/step-fixed.png",
    lead: "How do you see the cost of insurance, rent, power, waste or marketing on a daily basis in your business? It's not perfect, but we think amortising the yearly cost of all the “non-prime” costs is a good way to see them.",
    paras: [
      "Fixed costs stay the same no matter what you sell (rent, insurance); variable ones move around a little (power, waste, marketing). LB simply takes the yearly total of both and breaks it down into a daily, weekly and monthly representation of where your money is going.",
    ],
    note: "Once your week's forecast is set, each day's figure stays put — it doesn't move with revenue.",
  },
  net: {
    title: "Profit",
    kicker: "The reason this app exists",
    image: "/brand/spot-profit.png",
    lead: "You know this one: revenue, minus GST, minus all your costs.",
    callout:
      "The good news — if you see it daily, you can change it while it's still happening. No more waiting for your accountant's P&L on the 10th of next month to know if you made money today.",
  },
};

export function CellExplainer({
  explainerKey,
  onClose,
}: {
  explainerKey: ExplainerKey;
  onClose: () => void;
}) {
  const e = EXPLAINERS[explainerKey];

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={e.title}
    >
      <div
        className="fade-up flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-20px_60px_-30px_rgba(15,23,42,0.5)] sm:rounded-[28px]"
        onClick={(ev) => ev.stopPropagation()}
      >
        {/* cream illustration band */}
        <div className="relative flex shrink-0 items-center justify-center bg-[#fbf3e6] pb-4 pt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetPath(e.image)}
            width={116}
            height={116}
            alt=""
            style={{ objectFit: "contain" }}
          />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-ink/45 shadow-sm transition-colors hover:bg-white hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden>
              <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
            </svg>
          </button>
        </div>

        {/* content */}
        <div className="overflow-y-auto px-6 pb-6 pt-5 sm:px-7">
          <h2 className="font-display text-[22px] font-bold leading-tight tracking-tight text-ink">
            {e.title}
          </h2>
          <p className="mt-0.5 font-display text-[12.5px] font-medium uppercase tracking-[0.08em] text-amber-700">
            {e.kicker}
          </p>

          <p className="mt-4 text-[15px] leading-relaxed text-ink/80">{e.lead}</p>

          {e.paras?.map((p, i) => (
            <p key={i} className="mt-3 text-[13.5px] leading-relaxed text-ink/60">
              {p}
            </p>
          ))}

          {e.note && (
            <p className="tnum mt-4 rounded-xl bg-[#f6f7f9] px-3.5 py-2.5 text-[12px] leading-snug text-ink/55">
              {e.note}
            </p>
          )}

          {e.callout && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50 px-4 py-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetPath("/brand/birdee-mark.png")}
                width={26}
                height={26}
                alt=""
                className="mt-0.5 shrink-0"
              />
              <p className="text-[13.5px] font-medium leading-relaxed text-amber-950/85">
                {e.callout}
              </p>
            </div>
          )}

          {e.link && (
            <>
              <button
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 font-display text-[14px] font-semibold text-amber-950 transition hover:bg-amber-300 active:scale-[0.99]"
                onClick={onClose}
              >
                {e.link}
                <svg width="15" height="15" viewBox="0 0 256 256" fill="currentColor" aria-hidden>
                  <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" />
                </svg>
              </button>
              {e.linkNote && (
                <p className="mt-2.5 text-center text-[11.5px] leading-relaxed text-ink/40">
                  {e.linkNote}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
