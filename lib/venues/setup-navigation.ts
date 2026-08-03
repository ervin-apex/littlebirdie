export const SETUP_STEP_KEYS = [
  "venue",
  "revenue",
  "wages",
  "cogs",
  "fixed",
  "income",
] as const;

export type SetupStepKey = (typeof SETUP_STEP_KEYS)[number];

export function setupExitPath({
  loadingVenue,
  requiresFirstPlan,
}: {
  loadingVenue: boolean;
  requiresFirstPlan: boolean;
}) {
  if (loadingVenue) return "/account";
  if (requiresFirstPlan) return "/setup/paused";
  return "/app?period=this-week";
}

export function completedStepsAfterAdvance({
  currentCompletedSteps,
  stepIndex,
  totalSteps,
}: {
  currentCompletedSteps: number;
  stepIndex: number;
  totalSteps: number;
}) {
  return Math.min(
    Math.max(1, totalSteps - 1),
    Math.max(currentCompletedSteps, stepIndex + 1),
  );
}

export function resumeSetupStepIndex(
  steps: readonly SetupStepKey[],
  nextStep: SetupStepKey | null | undefined,
) {
  if (!nextStep) return 0;
  const index = steps.indexOf(nextStep);
  return index >= 0 ? index : 0;
}

export function setupStepsRemaining(completedSteps: number, totalSteps: number) {
  return Math.max(0, totalSteps - completedSteps);
}

/** Billing RLS deliberately hides an existing locked plan after access ends.
 *  The setup eligibility RPC is therefore the authoritative answer for whether
 *  a venue is genuinely new, instead of treating an invisible plan as absent. */
export function venueNeedsInitialSetup(canStartInitialSetup: unknown) {
  return canStartInitialSetup === true;
}

/** A setup draft is unfinished work, so it may only be resumed while it is newer
 *  than the venue's locked plan. A draft left behind by an abandoned pass must
 *  never outrank a plan saved since, or Setup would show numbers that contradict
 *  the dashboard and offer to re-save them as if they had been confirmed. */
export function isResumableDraft(
  draftUpdatedAt: string | null | undefined,
  planUpdatedAt: string | null | undefined,
) {
  if (!draftUpdatedAt) return false;
  if (!planUpdatedAt) return true;
  const draftAt = Date.parse(draftUpdatedAt);
  const planAt = Date.parse(planUpdatedAt);
  if (Number.isNaN(draftAt)) return false;
  if (Number.isNaN(planAt)) return true;
  return draftAt > planAt;
}
