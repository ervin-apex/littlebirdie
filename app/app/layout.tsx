import { PageBackground } from "@/components/PageBackground";
import { BrandHeader } from "@/components/BrandHeader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col text-ink">
      <PageBackground faint />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pt-5 sm:px-6">
        <BrandHeader />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
