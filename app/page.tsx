import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { HeroVisual } from "@/components/HeroVisual";

export default function WelcomePage() {
  return (
    <AppShell maxWidth="max-w-md" center>
      <div className="fade-up flex flex-col items-center text-center">
        <HeroVisual size={208} />
        <h1 className="mt-7 font-display text-[40px] font-semibold leading-[1.04] tracking-tight text-ink sm:text-[48px]">
          Know next week&apos;s profit today.
        </h1>
        <p className="mt-4 max-w-sm text-[16px] leading-relaxed text-ink/60">
          Forecast your weekly performance and discover the exact tweaks that
          turn targets into actual profits.
        </p>
        <Link
          href="/setup"
          className="mt-8 w-full max-w-xs rounded-xl bg-amber-400 py-3.5 text-center font-display text-[15px] font-semibold text-amber-950 transition hover:bg-amber-300 active:scale-[0.98]"
        >
          Get started
        </Link>
        <Link
          href="/app"
          className="mt-3 text-[13px] font-medium text-ink/60 transition-colors hover:text-ink/80"
        >
          I already have an account
        </Link>
      </div>
    </AppShell>
  );
}
