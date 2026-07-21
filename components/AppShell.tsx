import { PageBackground } from "@/components/PageBackground";
import { BrandHeader } from "@/components/BrandHeader";

/**
 * Shared app shell: the generated cream background + a floating brand header,
 * with a centered content column. Used across the welcome / onboarding / numbers
 * flow and the home hub so they all share the same chrome.
 */
export function AppShell({
  children,
  maxWidth = "max-w-3xl",
  center = false,
  hideHeader = false,
  headerVariant = "default",
}: {
  children: React.ReactNode;
  maxWidth?: string;
  center?: boolean;
  hideHeader?: boolean;
  headerVariant?: "default" | "home";
}) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col text-ink">
      <PageBackground />

      {!hideHeader && (
        <div
          className={
            headerVariant === "home"
              ? "relative z-10 mx-auto w-full max-w-none px-4 pt-4 sm:px-8"
              : "relative z-10 mx-auto w-full max-w-5xl px-4 pt-4 sm:px-6"
          }
        >
          <BrandHeader variant={headerVariant} />
        </div>
      )}

      <main
        className={`relative z-10 mx-auto flex w-full flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 ${maxWidth} ${
          center ? "justify-center" : ""
        }`}
      >
        {children}
      </main>
    </div>
  );
}
