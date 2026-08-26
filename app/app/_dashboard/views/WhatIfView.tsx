import { DEFAULT_ADJUSTMENTS, DEFAULT_ADJUSTMENT_DRAFTS, DRIVER_ICONS, DRIVER_LABELS } from "../constants";
import { ViewBack } from "../parts/ViewBack";
import { adjustmentBounds, adjustmentDraftError, applyScenario, clampAdjustment, formatAdjustment, formatAdjustmentInput, parseAdjustmentDraft, scenarioDriverResultCopy, sliderConfig } from "../scenario";
import type { Adjustments, Driver, DriverMode } from "../types";
import { ProductButton } from "@/components/ProductButton";
import { profit, signedProfit } from "@/lib/profit";
import type { Week } from "@/lib/profit";
import { assetPath } from "@/lib/site";
import { ArrowCounterClockwise, CaretDown, CaretUp, Minus, Plus, ShieldCheck } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

export function WhatIfView({
  periodTitle,
  week,
  onBack,
}: {
  periodTitle: string;
  week: Week;
  onBack: () => void;
}) {
  const [activeDriver, setActiveDriver] = useState<Driver>("revenue");
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [adjustmentDrafts, setAdjustmentDrafts] = useState<Record<Driver, string>>(DEFAULT_ADJUSTMENT_DRAFTS);
  const reduceMotion = useReducedMotion();
  const active = adjustments[activeDriver];
  const activeDraft = adjustmentDrafts[activeDriver];

  const baseline = profit(week);
  const scenarioWeek = applyScenario(week, adjustments);
  const scenarioResult = profit(scenarioWeek);
  const change = scenarioResult - baseline;
  const config = sliderConfig(activeDriver, active.mode, week);
  const bounds = adjustmentBounds(activeDriver, active.mode, week);
  const parsedDraft = parseAdjustmentDraft(activeDraft);
  const draftError = adjustmentDraftError(activeDraft, parsedDraft, bounds, activeDriver, active.mode);
  const sliderMin = Math.min(config.min, active.value);
  const sliderMax = Math.max(config.max, active.value);
  const estimatedHours =
    activeDriver === "wages" &&
    active.mode === "dollar" &&
    week.loadedHourlyLabourCost
    ? Math.abs(active.value / week.loadedHourlyLabourCost)
    : 0;
  const scenarioDeltaCopy = Math.abs(change) < 0.5
    ? "Same as now"
    : `${signedProfit(change)} ${change >= 0 ? "better" : "worse"} than now`;
  const activeResultCopy = scenarioDriverResultCopy(activeDriver, scenarioWeek, active.value === 0);
  const activeInputUnit = activeDriver === "cogs" ? "pts" : active.mode === "percent" ? "%" : "$";
  const activeInputId = `what-if-${activeDriver}-value`;
  const activeInputHelpId = `what-if-${activeDriver}-value-help`;

  const setActiveMode = (mode: DriverMode) => {
    setAdjustments((current) => ({
      ...current,
      [activeDriver]: { value: 0, mode },
    }));
    setAdjustmentDrafts((current) => ({ ...current, [activeDriver]: "0" }));
  };

  const setActiveValue = (value: number, syncDraft = true) => {
    const nextValue = clampAdjustment(value, bounds);
    setAdjustments((current) => ({
      ...current,
      [activeDriver]: { ...current[activeDriver], value: nextValue },
    }));
    if (syncDraft) {
      setAdjustmentDrafts((current) => ({
        ...current,
        [activeDriver]: formatAdjustmentInput(nextValue),
      }));
    }
  };

  const updateActiveDraft = (value: string) => {
    setAdjustmentDrafts((current) => ({ ...current, [activeDriver]: value }));
    const parsed = parseAdjustmentDraft(value);
    if (parsed == null || adjustmentDraftError(value, parsed, bounds, activeDriver, active.mode)) return;
    setActiveValue(parsed, false);
  };

  const commitActiveDraft = () => {
    const parsed = parseAdjustmentDraft(activeDraft);
    setActiveValue(parsed == null ? active.value : parsed);
  };

  const resetScenario = () => {
    setAdjustments({
      revenue: { value: 0, mode: "dollar" },
      cogs: { value: 0, mode: "percent" },
      wages: { value: 0, mode: "dollar" },
      fixed: { value: 0, mode: "dollar" },
    });
    setAdjustmentDrafts(DEFAULT_ADJUSTMENT_DRAFTS);
    setActiveDriver("revenue");
  };

  const driverSummary = (driver: Driver) => {
    if (driver === "cogs") return `${scenarioWeek.cogs}%`;
    return formatAdjustment(driver, adjustments[driver]);
  };

  const driverTone = (driver: Driver, value: number) => {
    if (value === 0) return "";
    const helpsProfit = driver === "revenue" ? value > 0 : value < 0;
    return helpsProfit ? "good" : "bad";
  };

  const driverHint: Record<Driver, string> = {
    revenue: "See what a little more sales could do.",
    wages: "Try a roster change and see where profit lands.",
    cogs: "Test a different cost-of-goods rate.",
    fixed: "See how an overhead change affects this period.",
  };

  return (
    <div className="what-if-view">
      <ViewBack label={periodTitle} onClick={onBack} />

      <p className="what-if-notice">
        <ShieldCheck weight="regular" aria-hidden />
        <span>Temporary — nothing here changes your reports.</span>
      </p>

      <main className="what-if-workspace">
        <section className="what-if-result-card" aria-labelledby="scenario-profit-title">
          <div className="what-if-result-main">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetPath("/brand/birdee-semantic-curious-calculator-v1.png")}
              alt="Little Birdee checking a calculator"
              className="what-if-birdee"
            />
            <div className="what-if-result-copy">
              <span id="scenario-profit-title">Scenario profit</span>
              <strong className="tnum">{signedProfit(scenarioResult)}</strong>
              <em className={change >= 0 ? "good" : "bad"}>{scenarioDeltaCopy}</em>
            </div>
          </div>
          <div className="what-if-baseline">
            <span>Right now <small>{periodTitle}</small></span>
            <strong className="tnum">{signedProfit(baseline)}</strong>
          </div>
        </section>

        <section className="what-if-adjuster" aria-labelledby="try-a-change-title">
          <h2 id="try-a-change-title">Try a change</h2>
          <div className="what-if-accordion">
            {(Object.keys(DRIVER_LABELS) as Driver[]).map((driver) => {
              const Icon = DRIVER_ICONS[driver];
              const isActive = activeDriver === driver;
              const panelId = `what-if-${driver}-controls`;
              const value = adjustments[driver];
              const tone = driverTone(driver, value.value);

              return (
                <section className={`what-if-driver ${isActive ? "is-active" : ""}`} key={driver}>
                  <button
                    type="button"
                    className="what-if-driver-row"
                    onClick={() => setActiveDriver(driver)}
                    aria-expanded={isActive}
                    aria-controls={panelId}
                  >
                    <span className={`what-if-driver-icon is-${driver}`}><Icon weight="regular" /></span>
                    <span className="what-if-driver-label">{DRIVER_LABELS[driver]}</span>
                    <strong className={`tnum ${tone === "good" ? "is-positive" : tone === "bad" ? "is-negative" : ""}`}>{driverSummary(driver)}</strong>
                    {isActive ? <CaretUp weight="bold" aria-hidden /> : <CaretDown weight="bold" aria-hidden />}
                  </button>

                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        id={panelId}
                        className="what-if-driver-control"
                        initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div className="what-if-control-inner">
                          {activeDriver !== "cogs" && (
                            <div className="what-if-mode-row">
                              <span>Adjust by</span>
                              <div className="mode-control" role="group" aria-label="Choose adjustment unit">
                                <button type="button" className={active.mode === "dollar" ? "is-active" : ""} onClick={() => setActiveMode("dollar")}>$</button>
                                <button type="button" className={active.mode === "percent" ? "is-active" : ""} onClick={() => setActiveMode("percent")}>%</button>
                              </div>
                            </div>
                          )}

                          <div className="what-if-stepper">
                            <button
                              type="button"
                              aria-label={`Decrease ${DRIVER_LABELS[activeDriver]}`}
                              onClick={() => setActiveValue(active.value - config.step)}
                            >
                              <Minus weight="regular" />
                            </button>
                            <label className="what-if-value-entry" htmlFor={activeInputId}>
                              <span>Change by</span>
                              <span className={`what-if-number-field ${draftError ? "has-error" : ""} ${driverTone(activeDriver, active.value)}`}>
                                {activeInputUnit === "$" && <i aria-hidden>$</i>}
                                <input
                                  id={activeInputId}
                                  className="tnum"
                                  type="text"
                                  inputMode="decimal"
                                  value={activeDraft}
                                  onChange={(event) => updateActiveDraft(event.target.value)}
                                  onBlur={commitActiveDraft}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") event.currentTarget.blur();
                                  }}
                                  aria-label={`${DRIVER_LABELS[activeDriver]} change`}
                                  aria-invalid={Boolean(draftError)}
                                  aria-describedby={activeInputHelpId}
                                />
                                {activeInputUnit !== "$" && <i aria-hidden>{activeInputUnit}</i>}
                              </span>
                              <small id={activeInputHelpId} className={draftError ? "is-error" : ""}>
                                {draftError ?? activeResultCopy}
                              </small>
                            </label>
                            <button
                              type="button"
                              aria-label={`Increase ${DRIVER_LABELS[activeDriver]}`}
                              onClick={() => setActiveValue(active.value + config.step)}
                            >
                              <Plus weight="regular" />
                            </button>
                          </div>

                          <input
                            className="what-if-range"
                            type="range"
                            min={sliderMin}
                            max={sliderMax}
                            step={config.step}
                            value={active.value}
                            onChange={(event) => setActiveValue(Number(event.target.value))}
                            aria-label={`Adjust ${DRIVER_LABELS[activeDriver]}`}
                            aria-valuetext={formatAdjustment(activeDriver, active)}
                          />
                          <p>{driverHint[activeDriver]}</p>
                          {estimatedHours > 0 && <small>About {estimatedHours.toFixed(1)} loaded labour hours in this period.</small>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              );
            })}
          </div>

          <div className="what-if-actions">
            <ProductButton
              variant="tertiary"
              size="compact"
              className="what-if-reset"
              onClick={resetScenario}
              leadingIcon={<ArrowCounterClockwise weight="bold" />}
            >
              Reset
            </ProductButton>
            <ProductButton variant="secondary" size="compact" className="what-if-done" onClick={onBack}>
              Close scenario
            </ProductButton>
          </div>
        </section>
      </main>
    </div>
  );
}
