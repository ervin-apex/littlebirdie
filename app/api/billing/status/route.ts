import { NextResponse } from "next/server";
import { billingEnforcementEnabled, loadBillingBusinessContext } from "@/lib/billing/server";
import { billingIsConfigured } from "@/lib/billing/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await loadBillingBusinessContext();
  if (!context) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  return NextResponse.json({
    configured: billingIsConfigured(),
    enforcementEnabled: billingEnforcementEnabled(),
    businessName: context.businessName,
    canManage: context.canManage,
    subscription: context.projection ? {
      status: context.projection.status,
      dataState: context.projection.dataState,
      paidThrough: context.projection.paidThrough,
      currentPeriodEnd: context.projection.currentPeriodEnd,
      cancelAtPeriodEnd: context.projection.cancelAtPeriodEnd,
    } : null,
    entitlement: context.entitlement,
  });
}
