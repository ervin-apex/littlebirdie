"use client";

import { useEffect, useState } from "react";
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

const STEP_EASE = [0.23, 1, 0.32, 1] as const;
const STEP_VARIANTS = {
  enter: (direction: number) => ({
    opacity: 0,
    transform: `translateX(${direction * 14}px)`,
  }),
  center: {
    opacity: 1,
    transform: "translateX(0px)",
  },
  exit: (direction: number) => ({
    opacity: 0,
    transform: `translateX(${direction * -10}px)`,
  }),
};

type StepDefinition = {
  key: SetupStepKey;
  label: string;
  title: string;
  description: string;
  helpLabel: string;
  help: string;
  scoreLabel: string;
  scoreCaption: string;
  nextLabel: string;
  birdeeAsset: string;
};

const VENUE_STEP: StepDefinition = {
  key: "venue",
  label: "Venue",
  title: "What should Birdee call this venue?",
  description: "Use the name you recognise in your roster or POS.",
  helpLabel: "Why does each venue need its own setup?",
  help: "Each venue keeps its own revenue and costs, so Birdee can show the right profit without mixing locations together.",
  scoreLabel: "Your new venue",
  scoreCaption: "Its numbers stay separate.",
  nextLabel: "Next: revenue",
  birdeeAsset: "/brand/birdee-reference-business-v1.png",
};

const NUMBER_STEPS: StepDefinition[] = [
  {
    key: "revenue",
    label: "Revenue",
    title: "What revenue are ya expecting?",
    description: "Pop in each day. We’ll keep the weekly total sorted.",
    helpLabel: "What counts as revenue?",
    help: "Enter the sales figure you normally use, then tell us below whether it already excludes GST.",
    scoreLabel: "Week total",
    scoreCaption: "Before costs",
    nextLabel: "Next: wages",
    birdeeAsset: "/brand/birdee-setup-revenue-v1.png",
  },
  {
    key: "wages",
    label: "Wages",
    title: "What will wages cost ya?",
    description: "Use the weekly total from your roster.",
    helpLabel: "What counts as wages?",
    help: "Your full roster cost, including super and other employment on-costs, plus your own wage if that applies.",
    scoreLabel: "Weekly wages",
    scoreCaption: "From your roster",
    nextLabel: "Next: COGS",
    birdeeAsset: "/brand/birdee-setup-wages-v1.png",
  },
  {
    key: "cogs",
    label: "COGS",
    title: "What’s your cost of goods rate?",
    description: "Use the share of GST-exclusive revenue spent making what you sell.",
    helpLabel: "What counts as COGS?",
    help: "The direct cost of what you sell, entered as a percentage of revenue excluding GST.",
    scoreLabel: "COGS rate",
    scoreCaption: "Of revenue excluding GST",
    nextLabel: "Next: other costs",
    birdeeAsset: "/brand/birdee-setup-cogs-v1.png",
  },
  {
    key: "fixed",
    label: "Fixed + variable",
    title: "What are your other weekly costs?",
    description: "Rent, power, insurance and the rest — one weekly total.",
    helpLabel: "What counts as other costs?",
    help: "Ordinary running costs such as rent, power, insurance and software. Leave out tax, interest, depreciation, loan principal and owner drawings.",
    scoreLabel: "Other costs",
    scoreCaption: "Weekly total",
    nextLabel: "Next: other income",
    birdeeAsset: "/brand/birdee-setup-other-costs-v1.png",
  },
  {
    key: "income",
    label: "Other income",
    title: "Any other income each week?",
    description: "Add ordinary, recurring income such as supplier rebates.",
    helpLabel: "What counts as other income?",
    help: "Include recurring operating income that belongs in EBITDA, such as regular supplier rebates. Leave out one-off or exceptional income.",
    scoreLabel: "Other income",
    scoreCaption: "Added to EBITDA",
    nextLabel: "See my profit",
    birdeeAsset: "/brand/birdee-setup-other-costs-v1.png",
  },
];

const VENUE_STEPS: StepDefinition[] = [VENUE_STEP, ...NUMBER_STEPS];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
          setupDraft?.completedSteps ?? legacyCompletedSteps,
        );
        setStepIndex(resumeSetupStepIndex(
          steps.map((item) => item.key),
          setupDraft?.nextStep ??
            (legacyCompletedSteps > 0 ? "revenue" : undefined),
        ));
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
  }, [isNewVenueFlow, steps]);

  useEffect(() => {
    if (!helpOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHelpOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [helpOpen]);

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

  const goBack = () => {
    setHelpOpen(false);
    if (stepIndex === 0) {
      if (setupSource === "onboarding") {
        router.push("/onboarding");
      } else if (includesVenueStep) {
        router.push(hasVenueRecord ? "/account?setup=pending" : "/account");
      } else {
        router.push("/app?period=this-week");
      }
      return;
    }
    setStepDirection(-1);
    setStepIndex((index) => index - 1);
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
        setStepDirection(1);
        setStepIndex((index) => index + 1);
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
      setStepDirection(1);
      setStepIndex((index) => index + 1);
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
                  ? "Weekly plan"
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

            <div className="setup-input-area">
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
                  ? "Saving your plan…"
                  : "Saving this step…"
              : loadingVenue
                ? "Opening venue…"
                : isWeeklyPlanEdit && stepIndex === steps.length - 1
                  ? "Save weekly plan"
                  : step.nextLabel}
          </ProductButton>
        </nav>
      </main>
    </div>
  );
}

function VenueNameInput({
  value,
  error,
  onChange,
}: {
  value: string;
  error: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <section className="venue-name-panel">
      <label htmlFor="setup-venue-name">Venue name</label>
      <div className={`venue-name-input${error ? " has-error" : ""}`}>
        <Storefront weight="duotone" aria-hidden="true" />
        <input
          id="setup-venue-name"
          value={value}
          maxLength={160}
          autoComplete="organization"
          placeholder="e.g. Newtown"
          autoFocus
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "setup-venue-name-error" : "setup-venue-name-confirmation"}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      {error ? (
        <p id="setup-venue-name-error" className="venue-name-error" role="alert">
          {error}
        </p>
      ) : (
        <p id="setup-venue-name-confirmation" className="input-confirmation">
          <span><Check weight="bold" /></span>
          {value.trim()
            ? `Nice — ${value.trim()} is ready for its numbers.`
            : "Start with the name you use every day."}
        </p>
      )}
    </section>
  );
}

function VenuePreview({
  name,
  birdeeAsset,
}: {
  name: string;
  birdeeAsset: string;
}) {
  const displayName = name.trim() || "Your venue";

  return (
    <div className="venue-preview">
      <span className="venue-preview__label">Your new venue</span>
      <div className="venue-preview__sign" aria-label={`Venue preview: ${displayName}`}>
        <i aria-hidden="true" />
        <strong>{displayName}</strong>
      </div>
      <small>Its numbers stay separate.</small>
      <div className="venue-preview__birdee" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetPath(birdeeAsset)} alt="" />
      </div>
    </div>
  );
}

function RevenueInputs({ week, onChange }: { week: Week; onChange: (week: Week) => void }) {
  const isRegistered = week.gstRegistration !== "not-registered";

  return (
    <section className="daily-revenue" aria-label="Daily revenue">
      <div className="daily-input-grid">
        {week.days.map((value, index) => (
          <label key={DAY_LABELS[index]}>
            <span>{DAY_LABELS[index]}</span>
            <div>
              <i>$</i>
              <input
                className="tnum"
                inputMode="numeric"
                value={formatInputMoney(value)}
                onChange={(event) => onChange(setDay(week, index, parseMoney(event.target.value)))}
                aria-label={`${DAY_LABELS[index]} revenue`}
              />
            </div>
          </label>
        ))}
      </div>
      <div className="revenue-tax-settings">
        <fieldset>
          <legend>Registered for GST?</legend>
          <div className="setup-choice-row">
            <button
              type="button"
              className={isRegistered ? "is-active" : ""}
              aria-pressed={isRegistered}
              onClick={() =>
                onChange({
                  ...week,
                  gstRegistration: "registered-fully-taxable",
                  revenueEntryBasis: "gst-inclusive",
                })
              }
            >
              Yes
            </button>
            <button
              type="button"
              className={!isRegistered ? "is-active" : ""}
              aria-pressed={!isRegistered}
              onClick={() =>
                onChange({
                  ...week,
                  gstRegistration: "not-registered",
                  revenueEntryBasis: "gst-exclusive",
                })
              }
            >
              No
            </button>
          </div>
        </fieldset>

        {isRegistered && (
          <fieldset>
            <legend>These revenue figures…</legend>
            <div className="setup-choice-row">
              <button
                type="button"
                className={week.revenueEntryBasis === "gst-inclusive" ? "is-active" : ""}
                aria-pressed={week.revenueEntryBasis === "gst-inclusive"}
                onClick={() =>
                  onChange({ ...week, revenueEntryBasis: "gst-inclusive" })
                }
              >
                Include GST
              </button>
              <button
                type="button"
                className={week.revenueEntryBasis === "gst-exclusive" ? "is-active" : ""}
                aria-pressed={week.revenueEntryBasis === "gst-exclusive"}
                onClick={() =>
                  onChange({ ...week, revenueEntryBasis: "gst-exclusive" })
                }
              >
                Exclude GST
              </button>
            </div>
          </fieldset>
        )}
      </div>
      {isRegistered && week.revenueEntryBasis === "gst-exclusive" && (
        <p className="revenue-tax-note">
          Use this option for GST-exclusive reports or mixed taxable and GST-free sales.
        </p>
      )}
      <p className="input-confirmation">
        <span><Check weight="bold" /></span>
        Nice — your days add up.
      </p>
    </section>
  );
}

function SingleInput({
  step,
  week,
  onChange,
}: {
  step: Exclude<SetupStepKey, "venue" | "revenue" | "income">;
  week: Week;
  onChange: (week: Week) => void;
}) {
  const config = step === "wages"
    ? {
        label: "Weekly wages",
        key: "lab" as const,
        prefix: "$",
        suffix: "",
        min: 0,
        max: 100000,
        confirmation: "Nice — wages are sorted.",
      }
    : step === "cogs"
      ? {
          label: "Cost of goods rate",
          key: "cogs" as const,
          prefix: "",
          suffix: "%",
          min: 0,
          max: 99,
          confirmation: "Got it — we’ll apply this to revenue.",
        }
      : {
          label: "Other weekly costs",
          key: "fix" as const,
          prefix: "$",
          suffix: "",
          min: 0,
          max: 100000,
          confirmation: "Nice — that’s the last number.",
        };
  const value = week[config.key];

  return (
    <section className="single-input-panel">
      <label htmlFor={`setup-${step}`}>{config.label}</label>
      <div className="single-money-input">
        {config.prefix && <span>{config.prefix}</span>}
        <input
          id={`setup-${step}`}
          className="tnum"
          inputMode="decimal"
          value={step === "cogs" ? value : formatInputMoney(value)}
          onChange={(event) => {
            const parsed = step === "cogs"
              ? Number(event.target.value.replace(/[^0-9.]/g, ""))
              : parseMoney(event.target.value);
            onChange({
              ...week,
              [config.key]: Math.max(
                config.min,
                Math.min(config.max, Number.isFinite(parsed) ? parsed : 0),
              ),
            });
          }}
        />
        {config.suffix && <span>{config.suffix}</span>}
      </div>
      <p className="input-confirmation">
        <span><Check weight="bold" /></span>
        {config.confirmation}
      </p>
    </section>
  );
}

function RecurringIncomeInput({
  week,
  onChange,
}: {
  week: Week;
  onChange: (week: Week) => void;
}) {
  const hasIncome = week.recurringIncome > 0;
  return (
    <section className="single-input-panel recurring-income-panel">
      <label htmlFor="setup-income">Weekly recurring income</label>
      <div className="single-money-input">
        <span>$</span>
        <input
          id="setup-income"
          className="tnum"
          inputMode="decimal"
          value={formatInputMoney(week.recurringIncome)}
          onChange={(event) => {
            const recurringIncome = parseMoney(event.target.value);
            onChange({
              ...week,
              recurringIncome,
              recurringIncomeConfirmed: recurringIncome > 0,
            });
          }}
        />
      </div>
      {!hasIncome && (
        <label className="income-zero-confirmation">
          <input
            type="checkbox"
            checked={Boolean(week.recurringIncomeConfirmed)}
            onChange={(event) =>
              onChange({
                ...week,
                recurringIncomeConfirmed: event.target.checked,
              })}
          />
          <span>
            <strong>We do not have recurring other income.</strong>
            <small>Confirm this so Birdee knows zero is intentional.</small>
          </span>
        </label>
      )}
      <p className="input-confirmation">
        <span><Check weight="bold" /></span>
        {hasIncome
          ? "Got it — this will be added to weekly EBITDA."
          : week.recurringIncomeConfirmed
            ? "Confirmed — no recurring other income."
            : "Confirm zero before Birdee saves the plan."}
      </p>
    </section>
  );
}

function formatInputMoney(value: number) {
  return new Intl.NumberFormat("en-AU", {
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(value);
}

function parseMoney(value: string) {
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}
