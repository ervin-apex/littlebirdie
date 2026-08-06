import type { GstRegistration, RevenueEntryBasis } from "../finance";

export type ChirpKind = "setup_needed" | "revenue_needed" | "estimated_result";

export type ClaimedChirpDelivery = {
  deliveryId: string;
  preferenceId: string;
  businessId: string;
  venueId: string;
  userId: string;
  serviceDate: string;
  scheduledFor: string;
  attemptCount: number;
};

export type ChirpPlanDay = {
  plannedRevenueCents: number;
  plannedLabourCents: number;
  plannedOtherOperatingCostsCents: number;
  plannedRecurringOperatingIncomeCents: number;
  cogsRateBasisPoints: number;
  gstRegistration: GstRegistration;
  revenueEntryBasis: RevenueEntryBasis;
};

export type ChirpActual = {
  enteredRevenueCents: number | null;
  labourCents: number | null;
  revenueSource: "manual" | "pos" | null;
  revenueStatus: "estimated" | "provisional" | "confirmed" | null;
  labourSource:
    | "manual"
    | "allocated-budget"
    | "roster-scheduled"
    | "timesheet-worked"
    | "timesheet-approved"
    | null;
  labourStatus: "estimated" | "provisional" | "confirmed" | null;
  revenueEntryBasis: RevenueEntryBasis | null;
  gstRegistration: GstRegistration | null;
  cogsRateBasisPoints: number;
  otherOperatingCostsCents: number;
  recurringOperatingIncomeCents: number;
};

export type ChirpSource = {
  deliveryId: string;
  preferenceId: string;
  venueId: string;
  venueName: string;
  businessName: string;
  userId: string;
  recipientEmail: string;
  recipientName: string;
  serviceDate: string;
  planDay: ChirpPlanDay | null;
  actual: ChirpActual | null;
};

export type ChirpContent = {
  kind: ChirpKind;
  subject: string;
  preheader: string;
  dateLabel: string;
  eyebrow: string;
  heading: string;
  intro: string;
  amountCents: number | null;
  amountLabel: string | null;
  detailLines: string[];
  assumptionNote: string | null;
  ctaLabel: string;
  destination: "setup" | "check-in" | "day";
};
