"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Question, X } from "@phosphor-icons/react";
import { PageBackground } from "@/components/PageBackground";
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
  help: string;
};

const STEPS: StepDefinition[] = [
  {
    key: "revenue",
    label: "Revenue",
    title: "What revenue do you expect next week?",
    description: "Your best estimate before any costs.",
    help: "Revenue is the total money you expect to take across the week, before GST and costs come out. A rough but realistic estimate is enough.",
  },
  {
    key: "wages",
    label: "Wages",
    title: "What will wages cost next week?",
    description: "Use the total from your roster, including your own wage if applicable.",
    help: "Enter the full weekly wage cost you expect from the roster. Little Birdee uses it to compare labour with net revenue.",
  },
  {
    key: "cogs",
    label: "COGS",
    title: "What percentage is cost of goods?",
    description: "The share of revenue spent producing what you sell.",
    help: "Cost of goods is entered as a percentage of revenue. It can be anywhere from 0% to 99%, depending on the business.",
  },
  {
    key: "fixed",
    label: "Fixed & variable",
    title: "What are your other weekly costs?",
    description: "Rent, power, insurance, subscriptions and other operating costs.",
    help: "Use the weekly amount for costs that are not wages or cost of goods. Your annual profit and loss can help you estimate it.",
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

  const step = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const goBack = () => {
    setHelpOpen(false);
    if (stepIndex === 0) router.push("/home");
    else setStepIndex((index) => index - 1);
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
      <PageBackground />
      <header className="setup-header">
        <Link href="/home" className="setup-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetPath("/brand/birdee-mark.png")} width={28} height={28} alt="" />
          <span>Little <strong>Birdee</strong></span>
        </Link>
        <ProductButton href="/home" variant="tertiary" size="compact" className="exit-setup">
          Exit setup
        </ProductButton>
      </header>

      <main className="setup-stage">
        <div className="setup-progress-copy"><strong>{stepIndex + 1} of {STEPS.length}</strong><span>·</span><span>{step.label}</span></div>
        <div className="setup-progress-track"><span style={{ width: `${progress}%` }} /></div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={step.key}
            className="setup-screen"
            initial={reduceMotion ? false : { opacity: 0, x: 30, filter: "blur(5px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -18, filter: "blur(3px)" }}
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="setup-question">
              <h1>{step.title}</h1>
              <p>{step.description}</p>
              <button type="button" className="setup-help" onClick={() => setHelpOpen((open) => !open)} aria-expanded={helpOpen}>
                <Question weight="bold" /> What does this mean?
              </button>
              {helpOpen && (
                <div className="setup-help-panel" role="status">
                  <span>{step.help}</span>
                  <button type="button" onClick={() => setHelpOpen(false)} aria-label="Close help"><X /></button>
                </div>
              )}
            </div>

            <div className="setup-input-area">
              {step.key === "revenue" ? (
                <RevenueInputs week={week} onChange={setWeek} />
              ) : (
                <SingleInput step={step.key} week={week} onChange={setWeek} />
              )}
            </div>

            <div className="setup-actions">
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
                {stepIndex === STEPS.length - 1 ? "Save numbers" : "Continue"}
              </ProductButton>
            </div>
          </motion.section>
        </AnimatePresence>
      </main>
    </div>
  );
}

function RevenueInputs({ week, onChange }: { week: Week; onChange: (week: Week) => void }) {
  return (
    <>
      <section className="week-total">
        <span>Week total</span>
        <strong className="tnum">{money(week.rev)}</strong>
        <small>Updates automatically from the daily amounts.</small>
      </section>

      <section className="daily-revenue">
        <div><h2>Daily revenue</h2><p>Enter your best estimate for each day.</p></div>
        <div className="daily-input-grid">
          {week.days.map((value, index) => (
            <label key={DAY_LABELS[index]}>
              <span>{DAY_LABELS[index]}</span>
              <div><i>$</i><input className="tnum" inputMode="numeric" value={formatInputMoney(value)} onChange={(event) => onChange(setDay(week, index, parseMoney(event.target.value)))} aria-label={`${DAY_LABELS[index]} revenue`} /></div>
            </label>
          ))}
        </div>
        <p className="input-confirmation"><span><Check weight="bold" /></span> Daily amounts add up to {money(week.rev)}.</p>
      </section>
    </>
  );
}

function SingleInput({ step, week, onChange }: { step: Exclude<StepKey, "revenue">; week: Week; onChange: (week: Week) => void }) {
  const config = step === "wages"
    ? { label: "Weekly wages", key: "lab" as const, prefix: "$", suffix: "", min: 0, max: 100000 }
    : step === "cogs"
      ? { label: "Cost of goods", key: "cogs" as const, prefix: "", suffix: "%", min: 0, max: 99 }
      : { label: "Weekly fixed & variable costs", key: "fix" as const, prefix: "$", suffix: "", min: 0, max: 100000 };
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
            const parsed = step === "cogs" ? Number(event.target.value.replace(/[^0-9.]/g, "")) : parseMoney(event.target.value);
            onChange({ ...week, [config.key]: Math.max(config.min, Math.min(config.max, Number.isFinite(parsed) ? parsed : 0)) });
          }}
        />
        {config.suffix && <span>{config.suffix}</span>}
      </div>
      <p>{step === "cogs" ? "Use the percentage that matches your business." : "Enter one total for the full week."}</p>
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
