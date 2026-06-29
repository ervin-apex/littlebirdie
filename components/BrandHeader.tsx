import Link from "next/link";
import { CalendarBlank, CaretDown } from "@phosphor-icons/react/dist/ssr";
import { assetPath } from "@/lib/site";

/**
 * Floating brand header used across the onboarding / numbers flow and the home
 * hub. Rounded white bar: wordmark on the left, a "this week" date pill on the
 * right by default (override via `right`).
 */
export function BrandHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between rounded-2xl bg-white/90 px-4 py-2.5 shadow-[0_12px_34px_-20px_rgba(15,23,42,0.4)] backdrop-blur sm:px-5">
      <Link href="/" className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetPath("/brand/birdee-mark.png")} width={28} height={28} alt="" />
        <span className="font-display text-[17px] font-semibold">
          <span className="text-ink">Little </span>
          <span className="text-amber-500">Birdee</span>
        </span>
      </Link>
      {right ?? <DatePill />}
    </header>
  );
}

export function DatePill() {
  return (
    <Link
      href="/profit"
      className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[13px] font-medium text-ink/70 transition-colors hover:bg-amber-100"
    >
      <CalendarBlank size={16} weight="bold" className="text-amber-600" />
      <span className="hidden sm:inline">Week of 23 to 29 Jun</span>
      <span className="sm:hidden">This week</span>
      <CaretDown size={13} weight="bold" className="text-ink/40" />
    </Link>
  );
}
