import Link from "next/link";
import { assetPath } from "@/lib/site";

/**
 * Responsive web-app shell: a sticky top bar + a centered content column.
 * Full-width and comfortable on mobile, a real web layout on desktop —
 * deliberately NOT a phone mockup.
 */
export function AppShell({
  children,
  maxWidth = "max-w-2xl",
  center = false,
}: {
  children: React.ReactNode;
  maxWidth?: string;
  center?: boolean;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f6f7f9] text-ink">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetPath("/brand/birdee-mark.png")} width={26} height={26} alt="" />
            <span className="font-display text-[16px] font-semibold">
              <span className="text-ink">Little </span>
              <span className="text-amber-600">Birdie</span>
            </span>
          </Link>
          <span className="text-[12px] text-ink/60">Week of 23 to 29 Jun</span>
        </div>
      </header>
      <main
        className={`mx-auto flex w-full flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10 ${maxWidth} ${
          center ? "justify-center" : ""
        }`}
      >
        {children}
      </main>
    </div>
  );
}
