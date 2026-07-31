import { PageBackground } from "@/components/PageBackground";
import { BrandHeader } from "@/components/BrandHeader";
import type { VenueNavigationItem } from "@/lib/venues/navigation";

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
  accountLabel,
  venues,
  selectedVenueId,
  headerWide = false,
  brandHref,
}: {
  children: React.ReactNode;
  maxWidth?: string;
  center?: boolean;
  hideHeader?: boolean;
  headerVariant?: "default" | "home";
  accountLabel?: string;
  venues?: VenueNavigationItem[];
  selectedVenueId?: string | null;
  headerWide?: boolean;
  brandHref?: string;
}) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col text-ink">
      <PageBackground />

      {!hideHeader && (
        <div
          className={
            headerVariant === "home"
              ? "relative z-10 mx-auto w-full max-w-none px-4 pt-4 sm:px-8"
              : headerWide
                ? "product-brand-bar relative z-30 w-full pt-3"
              : "relative z-10 mx-auto w-full max-w-5xl px-4 pt-4 sm:px-6"
          }
        >
          <BrandHeader
            variant={headerVariant}
            accountLabel={accountLabel}
            venues={venues}
            selectedVenueId={selectedVenueId}
            brandHref={brandHref}
          />
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
