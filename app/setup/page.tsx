"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CaretDown,
  ChatCircleDots,
  Check,
  Storefront,
} from "@phosphor-icons/react";
import { ProductButton } from "@/components/ProductButton";
import {
  BLANK_WEEK,
  clearLegacyWeekStorage,
  money,
  setDay,
  type Week,
} from "@/lib/profit";
import {
  createVenueDraft,
  loadVenueState,
  saveVenueSetupDraft,
  saveVenueWeek,
  updateVenueDraftName,
} from "@/lib/persistence/venue-state";
import { assetPath, BRAND_LOGO_PATH } from "@/lib/site";
import {
  completedStepsAfterAdvance,
  resumeSetupStepIndex,
  setupExitPath,
  type SetupStepKey,
} from "@/lib/venues/setup-navigation";
import "./setup.css";
import { STEP_EASE, STEP_VARIANTS } from "./_wizard/motion";
import { NUMBER_STEPS, VENUE_STEPS } from "./_wizard/steps";
import { RecurringIncomeInput } from "./_wizard/fields/RecurringIncomeInput";
import { RevenueInputs } from "./_wizard/fields/RevenueInputs";
import { SingleInput } from "./_wizard/fields/SingleInput";
import { VenueNameInput } from "./_wizard/fields/VenueNameInput";
import { VenuePreview } from "./_wizard/fields/VenuePreview";


export default function SetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const setupSource = searchParams.get("from");
  const isNewVenueFlow = setupSource === "new-venue";
  const isWeeklyPlanEdit = setupSource === "weekly-update";
  const includesVenueStep =
    isNewVenueFlow || setupSource === "venue-switch";
  const steps = includesVenueStep
    ? VENUE_STEPS
    : NUMBER_STEPS;
  const [week, setWeek] = useState<Week | null>(() =>
    isNewVenueFlow ? BLANK_WEEK : null,
  );
  const [stepIndex, setStepIndex] = useState(0);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const [stepDirection, setStepDirection] = useState(1);
  const [helpOpen, setHelpOpen] = useState(false);
  const [loadingVenue, setLoadingVenue] = useState(!isNewVenueFlow);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [venueName, setVenueName] = useState(isNewVenueFlow ? "" : "your venue");
  const [venueNameError, setVenueNameError] = useState<string | null>(null);
  const [hasVenueRecord, setHasVenueRecord] = useState(!isNewVenueFlow);
  const [requiresFirstPlan, setRequiresFirstPlan] = useState(isNewVenueFlow);
  const [savedCompletedSteps, setSavedCompletedSteps] = useState(0);

  useEffect(() => {
    // The authenticated product is server-authoritative. Local storage is only
    // ever a leftover from the demo, and it is not scoped to a venue, so it is
    // cleared rather than read.
    clearLegacyWeekStorage();
    if (isNewVenueFlow) {
      setWeek(BLANK_WEEK);
      setVenueName("");
      setRequiresFirstPlan(true);
      setLoadingVenue(false);
      return;
    }

    let active = true;
    loadVenueState()
      .then((state) => {
        if (!active) return;
        // A local week can seed the form, but only an explicit final save makes
        // it authoritative for the selected authenticated venue.
        const setupDraft = state.setupDraft;
        const legacyCompletedSteps =
          includesVenueStep && !state.hasPlan ? 1 : 0;
        setWeek(setupDraft?.week ?? state.week ?? BLANK_WEEK);
        setVenueName(state.venueName);
        setRequiresFirstPlan(!state.hasPlan);
        setHasVenueRecord(true);
        setSavedCompletedSteps(
          isWeeklyPlanEdit
            ? 0
            : setupDraft?.completedSteps ?? legacyCompletedSteps,
        );
        setStepIndex(
          isWeeklyPlanEdit
            ? 0
            : resumeSetupStepIndex(
                steps.map((item) => item.key),
                setupDraft?.nextStep ??
                  (legacyCompletedSteps > 0 ? "revenue" : undefined),
              ),
        );
      })
      .catch((error: unknown) => {
        if (!active) return;
        // Leave the form empty rather than showing numbers that were never
        // this venue's; the error tells the user the load failed.
        setWeek(BLANK_WEEK);
        setSaveError(error instanceof Error ? error.message : "Birdee could not load this venue.");
      })
      .finally(() => {
        if (active) setLoadingVenue(false);
      });
    return () => {
      active = false;
    };
  }, [isNewVenueFlow, isWeeklyPlanEdit, steps]);

  useEffect(() => {
    if (!helpOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHelpOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [helpOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPopState = (event: PopStateEvent) => {
      const target = (event.state as { setupStep?: unknown } | null)?.setupStep;
      if (typeof target !== "number") return;
      setHelpOpen(false);
      setStepDirection(-1);
      setStepIndex(target);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Tag the entry the wizard opened on, so returning to it restores step 0
  // rather than leaving a bare entry the popstate handler ignores.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window.history.state as { setupStep?: unknown } | null)?.setupStep !== undefined) return;
    window.history.replaceState(
      { ...window.history.state, setupStep: stepIndex },
      "",
    );
    // Only ever tags the first entry; later steps are pushed by advanceToStep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leaveSetup = () => {
    if (isWeeklyPlanEdit) {
      router.push("/app?period=this-week");
      return;
    }
    if (isNewVenueFlow && !hasVenueRecord) {
      router.push("/account");
      return;
    }
    router.push(setupExitPath({ loadingVenue, requiresFirstPlan }));
  };

  if (!week) {
    return (
      <div className="setup-page" aria-busy={loadingVenue}>
        <svg
          className="setup-wave"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className="setup-wave-edge"
            d="M167 0H1000V1000H177C177 870 222 830 222 700C222 560 107 540 107 400C107 240 167 180 167 0Z"
          />
          <path
            className="setup-wave-fill"
            d="M185 0H1000V1000H195C195 870 240 830 240 700C240 560 125 540 125 400C125 240 185 180 185 0Z"
          />
        </svg>

        <header className="setup-header">
          <Link href="/app" className="setup-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetPath(BRAND_LOGO_PATH)} width={34} height={34} alt="" />
            <span>Little <strong>Birdee</strong></span>
          </Link>
          <ProductButton
            type="button"
            variant="tertiary"
            size="compact"
            className="exit-setup"
            onClick={leaveSetup}
          >
            {isWeeklyPlanEdit ? "Back to dashboard" : "Exit setup"}
          </ProductButton>
        </header>

        <main className="setup-layout">
          <section className="setup-screen setup-loading-state" role="status" aria-live="polite">
            <span>Opening your venue...</span>
            <strong>Bringing your latest saved numbers into place.</strong>
          </section>
        </main>
      </div>
    );
  }

  const step = steps[stepIndex];
  const scoreValue = step.key === "venue"
    ? null
    : step.key === "revenue"
    ? money(week.rev)
    : step.key === "wages"
      ? money(week.lab)
      : step.key === "cogs"
      ? `${week.cogs}%`
        : step.key === "fixed"
          ? money(week.fix)
          : money(week.recurringIncome);

  const toggleHelp = () => {
    setHelpOpen((open) => !open);
  };

  /* Enter moves to the next field, and from the last field to the next step.
     The revenue step has seven day inputs, so tabbing or reaching for the
     button between each was the slow part. Mirrors the disabled state of the
     Continue button so Enter can never advance past a step the button itself
     would refuse. */
  const stepBlocked =
    loadingVenue
    || (step.key === "venue" && !venueName.trim())
    || (
      step.key === "income"
      && week.recurringIncome === 0
      && !week.recurringIncomeConfirmed
    );

  const onStepKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    const field = event.target as HTMLElement;
    if (field.tagName !== "INPUT") return;
    const type = (field as HTMLInputElement).type;
    if (type === "checkbox" || type === "radio") return;

    event.preventDefault();

    const fields = Array.from(
      inputAreaRef.current?.querySelectorAll<HTMLInputElement>(
        'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([disabled])',
      ) ?? [],
    );
    const next = fields[fields.indexOf(field as HTMLInputElement) + 1];
    if (next) {
      next.focus();
      next.select();
      return;
    }
    if (saving || stepBlocked) return;
    void goNext();
  };

  /* Each step gets its own history entry so the phone's back gesture steps
     back through the wizard instead of dropping the operator out of it. The
     URL does not change - the step lives in history state - so this stays out
     of the way of the draft-resume logic, which is the sole owner of which
     step you land on. Next's own history state is preserved on each entry. */
  const advanceToStep = (nextIndex: number) => {
    setStepDirection(1);
    setStepIndex(nextIndex);
    if (typeof window === "undefined") return;
    window.history.pushState(
      { ...window.history.state, setupStep: nextIndex },
      "",
    );
  };



  const goBack = () => {
    setHelpOpen(false);
    // Let the browser pop, so the in-wizard Back and the phone gesture stay
    // on the same history stack rather than drifting apart.
    if (stepIndex > 0) {
      window.history.back();
      return;
    }
    // Step 0: leave the wizard for wherever this flow was entered from.
    if (setupSource === "onboarding") {
      router.push("/onboarding");
    } else if (includesVenueStep) {
      router.push(hasVenueRecord ? "/account?setup=pending" : "/account");
    } else {
      router.push("/app?period=this-week");
    }
  };

  const goNext = async () => {
    setHelpOpen(false);
    setSaveError(null);

    if (step.key === "venue") {
      const cleanName = venueName.trim();
      if (!cleanName) {
        setVenueNameError("Give this venue a name before continuing.");
        return;
      }

      setSaving(true);
      setVenueNameError(null);
      try {
        const venue = hasVenueRecord
          ? await updateVenueDraftName(cleanName)
          : await createVenueDraft(cleanName);
        setVenueName(venue.venueName);
        setHasVenueRecord(true);
        setRequiresFirstPlan(true);
        const completedSteps = completedStepsAfterAdvance({
          currentCompletedSteps: savedCompletedSteps,
          stepIndex,
          totalSteps: steps.length,
        });
        const { setupDraft } = await saveVenueSetupDraft({
          week,
          completedSteps,
          totalSteps: steps.length,
          nextStep: steps[stepIndex + 1].key,
        });
        setSavedCompletedSteps(setupDraft.completedSteps);
        setSaving(false);
        advanceToStep(stepIndex + 1);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Birdee could not save this venue.";
        setVenueNameError(message);
        setSaving(false);
      }
      return;
    }

    if (stepIndex === steps.length - 1) {
      setSaving(true);
      try {
        const completedSteps = Math.min(
          steps.length - 1,
          Math.max(savedCompletedSteps, stepIndex),
        );
        await saveVenueSetupDraft({
          week,
          completedSteps,
          totalSteps: steps.length,
          nextStep: step.key,
        });
        await saveVenueWeek(week);
        const billingResponse = await fetch("/api/billing/status", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const billing = await billingResponse.json().catch(() => null) as {
          enforcementEnabled?: boolean;
          entitlement?: { canUseProduct?: boolean };
        } | null;
        router.push(
          billing?.enforcementEnabled && !billing.entitlement?.canUseProduct
            ? "/billing"
            : "/app?period=this-week",
        );
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : "Birdee could not save these numbers.",
        );
        setSaving(false);
      }
      return;
    }

    setSaving(true);
    try {
      const completedSteps = completedStepsAfterAdvance({
        currentCompletedSteps: savedCompletedSteps,
        stepIndex,
        totalSteps: steps.length,
      });
      const { setupDraft } = await saveVenueSetupDraft({
        week,
        completedSteps,
        totalSteps: steps.length,
        nextStep: steps[stepIndex + 1].key,
      });
      setSavedCompletedSteps(setupDraft.completedSteps);
      setSaving(false);
      advanceToStep(stepIndex + 1);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Birdee could not save this setup step.",
      );
      setSaving(false);
    }
  };

  return (
    <div className="setup-page">
      <svg
        className="setup-wave"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          className="setup-wave-edge"
          d="M167 0H1000V1000H177C177 870 222 830 222 700C222 560 107 540 107 400C107 240 167 180 167 0Z"
        />
        <path
          className="setup-wave-fill"
          d="M185 0H1000V1000H195C195 870 240 830 240 700C240 560 125 540 125 400C125 240 185 180 185 0Z"
        />
      </svg>

      <header className="setup-header">
        <Link href="/app" className="setup-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetPath(BRAND_LOGO_PATH)} width={34} height={34} alt="" />
          <span>Little <strong>Birdee</strong></span>
        </Link>
        <ProductButton
          type="button"
          variant="tertiary"
          size="compact"
          className="exit-setup"
          onClick={leaveSetup}
        >
          {isWeeklyPlanEdit ? "Back to dashboard" : "Exit setup"}
        </ProductButton>
      </header>

      <main className="setup-layout">
        <div className="setup-progress" aria-label={`Step ${stepIndex + 1} of ${steps.length}: ${step.label}`}>
          {(requiresFirstPlan || includesVenueStep || isWeeklyPlanEdit) && (
            <div className="setup-venue-context" role="status">
              <span>
                {isWeeklyPlanEdit
                  ? "Weekly budget"
                  : includesVenueStep
                    ? "New venue setup"
                    : "Setting up"}
              </span>
              <strong>{venueName.trim() || "Name your venue"}</strong>
              <p>{stepIndex + 1} of {steps.length} · {step.label}</p>
            </div>
          )}
          <div className="setup-progress-segments" aria-hidden="true">
            {steps.map((item, index) => (
              <span key={item.key} className={index <= stepIndex ? "is-complete" : ""} />
            ))}
          </div>
        </div>

        <motion.section
          key={step.key}
          custom={stepDirection}
          className="setup-screen"
          variants={STEP_VARIANTS}
          initial={reduceMotion ? false : "enter"}
          animate="center"
          transition={{ duration: reduceMotion ? 0 : 0.22, ease: STEP_EASE }}
        >
            <div className="setup-question">
              <h1>{step.title}</h1>
              <p className="setup-description">{step.description}</p>
            </div>

            <div className={`setup-help-disclosure${helpOpen ? " is-open" : ""}`}>
                <button
                  id="setup-help-trigger"
                  type="button"
                  className="setup-help"
                  onClick={toggleHelp}
                  aria-expanded={helpOpen}
                  aria-controls="setup-help-answer"
                >
                  <span className="setup-help-icon" aria-hidden="true">
                    <ChatCircleDots weight="fill" />
                  </span>
                  <span className="setup-help-copy">
                    <strong>Ask Birdee:</strong>
                    <span>{step.helpLabel}</span>
                  </span>
                  <CaretDown className="setup-help-caret" weight="bold" aria-hidden="true" />
                </button>
                <AnimatePresence initial={false}>
                  {helpOpen && (
                    <motion.div
                      id="setup-help-answer"
                      className="setup-birdee-answer"
                      role="region"
                      aria-labelledby="setup-help-trigger"
                      initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={reduceMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <span className="setup-answer-mark" aria-hidden="true">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={assetPath("/brand/birdee-mark.png")} alt="" />
                      </span>
                      <strong className="setup-answer-title">Birdee’s tip</strong>
                      <p>{step.help}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>

            <div className="setup-input-area" ref={inputAreaRef} onKeyDown={onStepKeyDown}>
              {step.key === "venue" ? (
                <VenueNameInput
                  value={venueName}
                  error={venueNameError}
                  onChange={(value) => {
                    setVenueName(value);
                    if (venueNameError) setVenueNameError(null);
                  }}
                />
              ) : step.key === "revenue" ? (
                <RevenueInputs week={week} onChange={setWeek} />
              ) : step.key === "income" ? (
                <RecurringIncomeInput week={week} onChange={setWeek} />
              ) : (
                <SingleInput step={step.key} week={week} onChange={setWeek} />
              )}
            </div>
        </motion.section>

        <aside
          className={`setup-score-panel${step.key === "venue" ? " setup-score-panel--venue" : ""}`}
          aria-live="polite"
        >
          {step.key === "venue" ? (
            <VenuePreview name={venueName} birdeeAsset={step.birdeeAsset} />
          ) : (
            <>
              <div className="setup-score-copy">
                <span>{step.scoreLabel}</span>
                <strong className="tnum">{scoreValue}</strong>
                <small>{step.scoreCaption}</small>
              </div>
              <div className="setup-score-birdee" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assetPath(step.birdeeAsset)} alt="" />
              </div>
              {step.key === "income" && (
                <p className="setup-score-rule">
                  Regular income only — leave out one-offs.
                </p>
              )}
            </>
          )}
        </aside>

        {saveError && (
          <p className="setup-save-error" role="alert">
            {saveError}
          </p>
        )}
        <nav
          className={`setup-actions ${stepIndex === 0 && step.key !== "venue" ? "is-first-step" : ""}`}
          aria-label="Setup steps"
        >
          {(stepIndex > 0 || step.key === "venue") && (
            <ProductButton
              variant="secondary"
              className="setup-back"
              onClick={goBack}
              leadingIcon={<ArrowLeft weight="bold" />}
            >
              Back
            </ProductButton>
          )}
          <ProductButton
            variant="primary"
            className="setup-continue"
            onClick={goNext}
            disabled={
              loadingVenue
              || (step.key === "venue" && !venueName.trim())
              || (
                step.key === "income"
                && week.recurringIncome === 0
                && !week.recurringIncomeConfirmed
              )
            }
            state={saving ? "loading" : undefined}
            trailingIcon={<ArrowRight weight="bold" />}
          >
            {saving
              ? step.key === "venue"
                ? "Saving venue…"
                : stepIndex === steps.length - 1
                  ? "Saving your budget…"
                  : "Saving this step…"
              : loadingVenue
                ? "Opening venue…"
                : isWeeklyPlanEdit && stepIndex === steps.length - 1
                  ? "Save weekly budget"
                  : step.nextLabel}
          </ProductButton>
        </nav>
      </main>
    </div>
  );
}


