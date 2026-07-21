import { PageBackground } from "@/components/PageBackground";
import { BrandHeader } from "@/components/BrandHeader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-[100dvh] w-screen max-w-full min-h-0 flex-col overflow-hidden text-ink">
      <PageBackground faint />
      <svg
        className="app-dashboard-backdrop"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="dashboard-yellow-field" cx="66%" cy="42%" r="68%">
            <stop offset="0%" stopColor="var(--lb-yellow-hover)" />
            <stop offset="62%" stopColor="var(--lb-yellow)" />
            <stop offset="100%" stopColor="var(--lb-yellow)" />
          </radialGradient>
        </defs>
        <path
          className="dashboard-wave"
          d="M 735 0 C 690 120 675 260 685 360 C 695 460 725 545 725 650 C 725 770 675 930 600 1000 L 1000 1000 L 1000 0 Z"
        />
      </svg>

      <div className="app-brand-bar relative z-30 w-full px-4 pt-3 sm:px-6 lg:px-8">
        <BrandHeader />
      </div>

      <main className="app-main relative z-10 min-h-0 w-full flex-1 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        {children}
      </main>
    </div>
  );
}
