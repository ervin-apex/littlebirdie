"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CaretDown,
  ChatCircleDots,
  Check,
} from "@phosphor-icons/react";
import { ProductButton } from "@/components/ProductButton";
import {
  DEFAULTS,
  loadWeek,
  money,
  saveWeek,
  setDay,
  type Week,
} from "@/lib/profit";
import { assetPath } from "@/lib/site";
import "./setup.css";

type StepKey = "revenue" | "wages" | "cogs" | "fixed";

type StepDefinition = {
  key: StepKey;
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

const STEPS: StepDefinition[] = [
  {
    key: "revenue",
    label: "Revenue",
    title: "What revenue are ya expecting?",
    description: "Pop in each day. We’ll keep the weekly total sorted.",
    helpLabel: "What counts as revenue?",
    help: "Money you expect to take before GST and costs. A solid estimate is enough.",
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
    help: "Your full roster cost for the week, including your own wage if that applies.",
    scoreLabel: "Weekly wages",
    scoreCaption: "From your roster",
    nextLabel: "Next: COGS",
    birdeeAsset: "/brand/birdee-setup-wages-v1.png",
  },
  {
    key: "cogs",
    label: "COGS",
    title: "What’s your cost of goods rate?",
    description: "Use the share of revenue spent making what you sell.",
    helpLabel: "What counts as COGS?",
    help: "The direct cost of what you sell, entered as a percentage of revenue.",
    scoreLabel: "COGS rate",
    scoreCaption: "Of revenue",
    nextLabel: "Next: other costs",
    birdeeAsset: "/brand/birdee-setup-cogs-v1.png",
  },
  {
    key: "fixed",
    label: "Fixed + variable",
    title: "What are your other weekly costs?",
    description: "Rent, power, insurance and the rest — one weekly total.",
    helpLabel: "What counts as other costs?",
    help: "Everything else — rent, power, insurance and subscriptions — as one weekly total.",
    scoreLabel: "Other costs",
    scoreCaption: "Weekly total",
    nextLabel: "See my profit",
    birdeeAsset: "/brand/birdee-setup-other-costs-v1.png",
  },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SetupPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [week, setWeek] = useState<Week>(DEFAULTS);
  const [stepIndex, setStepIndex] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    setWeek(loadWeek());
  }, []);

  useEffect(() => {
    if (!helpOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHelpOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [helpOpen]);

  const step = STEPS[stepIndex];
  const scoreValue = step.key === "revenue"
    ? money(week.rev)
    : step.key === "wages"
      ? money(week.lab)
      : step.key === "cogs"
        ? `${week.cogs}%`
        : money(week.fix);

  const toggleHelp = () => {
    setHelpOpen((open) => !open);
  };

  const goBack = () => {
    setHelpOpen(false);
    if (stepIndex === 0) {
      const cameFromOnboarding =
        new URLSearchParams(window.location.search).get("from") === "onboarding";
      router.push(cameFromOnboarding ? "/onboarding" : "/home");
      return;
    }
    setStepIndex((index) => index - 1);
  };

  const goNext = () => {
    setHelpOpen(false);
    if (stepIndex === STEPS.length - 1) {
      saveWeek(week);
      router.push("/app?period=this-week");
      return;
    }
    setStepIndex((index) => index + 1);
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
        <Link href="/home" className="setup-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetPath("/brand/birdee-mark.png")} width={34} height={34} alt="" />
          <span>Little <strong>Birdee</strong></span>
        </Link>
        <ProductButton href="/home" variant="tertiary" size="compact" className="exit-setup">
          Exit setup
        </ProductButton>
      </header>

      <main className="setup-layout">
        <div className="setup-progress" aria-label={`Step ${stepIndex + 1} of ${STEPS.length}: ${step.label}`}>
          <div className="setup-progress-segments" aria-hidden="true">
            {STEPS.map((item, index) => (
              <span key={item.key} className={index <= stepIndex ? "is-complete" : ""} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={step.key}
            className="setup-screen"
            initial={reduceMotion ? false : { opacity: 0, x: 24, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -16, filter: "blur(3px)" }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
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
              {step.key === "revenue" ? (
                <RevenueInputs week={week} onChange={setWeek} />
              ) : (
                <SingleInput step={step.key} week={week} onChange={setWeek} />
              )}
            </div>
          </motion.section>
        </AnimatePresence>

        <aside className="setup-score-panel" aria-live="polite">
          <div className="setup-score-copy">
            <span>{step.scoreLabel}</span>
            <strong className="tnum">{scoreValue}</strong>
            <small>{step.scoreCaption}</small>
          </div>
          <div className="setup-score-birdee" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetPath(step.birdeeAsset)} alt="" />
          </div>
        </aside>

        <nav className="setup-actions" aria-label="Setup steps">
          <ProductButton
            variant="secondary"
            className="setup-back"
            onClick={goBack}
            leadingIcon={<ArrowLeft weight="bold" />}
          >
            Back
          </ProductButton>
          <ProductButton
            variant="primary"
            className="setup-continue"
            onClick={goNext}
            trailingIcon={<ArrowRight weight="bold" />}
          >
            {step.nextLabel}
          </ProductButton>
        </nav>
      </main>
    </div>
  );
}

function RevenueInputs({ week, onChange }: { week: Week; onChange: (week: Week) => void }) {
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
  step: Exclude<StepKey, "revenue">;
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
          inputMode={step === "cogs" ? "decimal" : "numeric"}
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

function formatInputMoney(value: number) {
  return new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 }).format(Math.round(value));
}

function parseMoney(value: string) {
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}
