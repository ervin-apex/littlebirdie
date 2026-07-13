import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { HeroVisual } from "@/components/HeroVisual";

/**
 * Welcome / splash (round 2 entry). "Get started" begins onboarding with the
 * business-info step; returning users can jump straight to their home hub.
 */
export default function WelcomePage() {
  return (
    <AppShell maxWidth="max-w-2xl" center hideHeader>
      <div className="fade-up flex flex-col items-center text-center">
        {/* Hero in a barely-there frosted panel with a few sparkle accents. */}
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 rounded-[52px] bg-amber-50/30 shadow-[0_30px_60px_-40px_rgba(190,140,30,0.38)] ring-1 ring-white/30 backdrop-blur-[3px]"
          />
          <div className="relative px-6 py-5">
            <HeroVisual size={208} />
          </div>
          <Sparkle className="absolute right-3 top-5 text-amber-300/75" size={13} />
          <Sparkle className="absolute left-4 top-16 text-amber-200/80" size={9} />
          <Sparkle className="absolute bottom-9 left-12 text-amber-300/60" size={8} />
        </div>

        <p className="mt-7 font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-amber-700">
          Little Birdee
        </p>
        <h1 className="mt-2 font-display text-[34px] font-bold leading-[1.05] tracking-tight text-ink sm:text-[40px]">
          Improve Your Profit
        </h1>

        <p className="mt-5 max-w-md font-display text-[17px] font-medium leading-snug text-ink/85 sm:text-[18px]">
          Why can&apos;t you see your profit in real time?
        </p>
        <div aria-hidden className="mt-3 h-[3px] w-10 rounded-full bg-amber-400" />

        <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-ink/55">
          See your profit and what&apos;s impacting it in real time for
          yesterday, today, last week, this week, next week.
        </p>
        <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-ink/55">
          Seems like a pretty simple way to make more money, right? Yeah, we
          think so too.
        </p>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-[11.5px] font-medium uppercase tracking-[0.08em] text-ink/40">
          <ShieldCheckIcon className="text-amber-500" size={14} />
          Made by Operators, for operators
        </p>

        <Link
          href="/onboarding"
          className="mt-8 flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-amber-400 py-3.5 text-center font-display text-[15px] font-semibold text-amber-950 transition hover:bg-amber-300 active:scale-[0.98]"
        >
          Get started
          <ArrowRightIcon size={17} />
        </Link>
        <Link
          href="/home"
          className="mt-3 text-[13px] font-medium text-ink/60 underline decoration-dotted decoration-ink/30 underline-offset-4 transition-colors hover:text-ink/80"
        >
          I&apos;ve already set up
        </Link>
      </div>
    </AppShell>
  );
}

/** A 4-point sparkle accent for the hero. */
function Sparkle({ className = "", size = 12 }: { className?: string; size?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 0c0 7 5 12 12 12-7 0-12 5-12 12 0-7-5-12-12-12 7 0 12-5 12-12Z" />
    </svg>
  );
}

/** Phosphor ShieldCheck (regular), inlined so the page stays a server component. */
function ShieldCheckIcon({ className = "", size = 14 }: { className?: string; size?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      className={className}
    >
      <path d="M208,40H48A16,16,0,0,0,32,56v58.78c0,89.61,75.82,119.34,91,124.39a15.53,15.53,0,0,0,10,0c15.2-5.05,91-34.78,91-124.39V56A16,16,0,0,0,208,40Zm-34.34,69.66-48,48a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L120,140.69l42.34-42.35a8,8,0,0,1,11.32,11.32Z" />
    </svg>
  );
}

/** Phosphor ArrowRight (regular), inlined. */
function ArrowRightIcon({ className = "", size = 17 }: { className?: string; size?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      className={className}
    >
      <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" />
    </svg>
  );
}
