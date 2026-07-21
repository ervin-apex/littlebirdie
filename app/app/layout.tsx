import { PageBackground } from "@/components/PageBackground";
import { BrandHeader } from "@/components/BrandHeader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-[100dvh] w-screen max-w-full min-h-0 flex-col overflow-hidden text-ink">
      <PageBackground faint />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
        <BrandHeader />
      </div>

      <main className="relative z-10 mx-auto min-h-0 w-full max-w-7xl flex-1 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        {children}
      </main>
    </div>
  );
}
