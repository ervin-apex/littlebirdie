import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { billingEnforcementEnabled, loadBillingBusinessContext } from "@/lib/billing/server";
import { canOpenVenueFinancialRecords } from "@/lib/billing/venue-access";
import { createClient } from "@/lib/supabase/server";

const VENUE_COOKIE = "little-birdee-venue";

export const dynamic = "force-dynamic";

export default async function SetupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!billingEnforcementEnabled()) return children;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const venueId = (await cookies()).get(VENUE_COOKIE)?.value;
  const billing = await loadBillingBusinessContext();
  if (!venueId) {
    if (billing?.entitlement.canUseProduct) return children;
    redirect(
      billing?.entitlement.accessState === "locked_recovery"
        ? "/billing/locked"
        : "/billing",
    );
  }

  const { data: canStartInitialSetup } = await supabase.rpc(
    "can_start_initial_setup",
    { p_venue_id: venueId },
  );
  const canUseSetup = canOpenVenueFinancialRecords({
    enforcementEnabled: true,
    canUseProduct: billing?.entitlement.canUseProduct ?? false,
    canStartInitialSetup: canStartInitialSetup === true,
  });

  if (!canUseSetup) {
    redirect(
      billing?.entitlement.accessState === "locked_recovery"
        ? "/billing/locked"
        : "/billing",
    );
  }

  return children;
}
