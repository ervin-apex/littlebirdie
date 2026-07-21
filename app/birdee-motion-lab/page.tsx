"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowCounterClockwise,
  CheckCircle,
  Pause,
  Play,
} from "@phosphor-icons/react";
import {
  BirdeeMotionStage,
  type BirdeeClipName,
} from "@/components/BirdeeMotionStage";
import { assetPath } from "@/lib/site";
import "./motion-lab.css";

type MotionState = {
  clip: BirdeeClipName;
  label: string;
  shortLabel: string;
  posture: string;
  productUse: string;
  tone: string;
};

const STATES: MotionState[] = [
  {
    clip: "ready_hover",
    label: "Ready",
    shortLabel: "Ready",
    posture: "A calm hover with balanced wings. Present and awake, without asking for attention.",
    productUse: "Home and Update numbers",
    tone: "ready",
  },
  {
    clip: "encouraging_lift",
    label: "Encouraging",
    shortLabel: "Good news",
    posture: "A small lift and wider wings. Warm encouragement, never a victory lap.",
    productUse: "Positive profit movement",
    tone: "encouraging",
  },
  {
    clip: "concerned_settle",
    label: "Concerned",
    shortLabel: "Needs care",
    posture: "Head and body settle softly while the wings draw in. Concerned, never ashamed.",
    productUse: "Behind budget or a difficult completed day",
    tone: "concerned",
  },
  {
    clip: "focused_lean",
    label: "Focused",
    shortLabel: "Forecast",
    posture: "A composed forward lean that aims Birdee toward the comparison—not at the user.",
    productUse: "Forecast, Budget and Week",
    tone: "focused",
  },
  {
    clip: "curious_tilt",
    label: "Curious",
    shortLabel: "What if?",
    posture: "A gentle head tilt with one wing fractionally higher. Exploring, not recommending.",
    productUse: "What If scenarios",
    tone: "curious",
  },
  {
    clip: "attentive_settle",
    label: "Attentive",
    shortLabel: "Let’s look",
    posture: "A brief turn toward the evidence, then stillness so the numbers can do the talking.",
    productUse: "What happened and Full numbers",
    tone: "attentive",
  },
];

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getReducedMotionPreference() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerReducedMotionPreference() {
  return false;
}

export default function BirdeeMotionLabPage() {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionPreference,
    getServerReducedMotionPreference,
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [replayToken, setReplayToken] = useState(0);
  const [autoTour, setAutoTour] = useState(false);
  const [loadedClipCount, setLoadedClipCount] = useState(0);
  const active = STATES[activeIndex];

  const handleReady = useCallback((clipNames: string[]) => {
    setLoadedClipCount(clipNames.length);
  }, []);

  useEffect(() => {
    if (!autoTour || prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % STATES.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [autoTour, prefersReducedMotion]);

  const statusCopy = useMemo(() => {
    if (!loadedClipCount) return "Loading web model";
    return `${loadedClipCount} clips ready`;
  }, [loadedClipCount]);

  const chooseState = (index: number) => {
    setAutoTour(false);
    if (index === activeIndex) setReplayToken((value) => value + 1);
    setActiveIndex(index);
  };

  return (
    <main className={`motion-lab motion-lab--${active.tone}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="motion-lab__botanical"
        src={assetPath("/brand/bg-canvas.png")}
        alt=""
        aria-hidden="true"
      />

      <header className="motion-lab__header">
        <Link href="/app" className="motion-lab__brand" aria-label="Return to Little Birdee dashboard">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetPath("/brand/birdee-mark.png")} alt="" />
          <span>Little Birdee</span>
        </Link>
        <div className="motion-lab__titlebar">
          <strong>Motion lab</strong>
          <span>separate prototype</span>
        </div>
        <div className="motion-lab__status" aria-live="polite">
          <i className={loadedClipCount ? "is-ready" : ""} />
          {statusCopy}
        </div>
      </header>

      <div className="motion-lab__workspace">
        <section className="motion-lab__copy" aria-labelledby="motion-lab-heading">
          <p className="motion-lab__lede">Cute, but useful.</p>
          <h1 id="motion-lab-heading">One small bird. Six useful moods.</h1>
          <p className="motion-lab__intro">
            Birdee reacts to the information, helps orient the eye, then gets out of the numbers’ way.
            Pick a state to review the movement.
          </p>

          <div className="motion-lab__active-copy" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.clip}
                initial={prefersReducedMotion ? false : { opacity: 0, x: 12, filter: "blur(3px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -8 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="motion-lab__active-heading">
                  <span>{String(activeIndex + 1).padStart(2, "0")} / {String(STATES.length).padStart(2, "0")}</span>
                  <h2>{active.label}</h2>
                </div>
                <p>{active.posture}</p>
                <dl>
                  <dt>Use it for</dt>
                  <dd>{active.productUse}</dd>
                </dl>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        <section className="motion-lab__preview" aria-label={`${active.label} animation preview`}>
          <div className="motion-lab__preview-bar">
            <span><i /> Live 3D preview</span>
            <button
              type="button"
              onClick={() => setReplayToken((value) => value + 1)}
              aria-label={`Replay ${active.label} animation`}
            >
              <ArrowCounterClockwise size={18} weight="bold" />
              Replay
            </button>
          </div>

          <div className="motion-lab__stage-shell">
            <BirdeeMotionStage
              clip={active.clip}
              replayToken={replayToken}
              reducedMotion={prefersReducedMotion}
              onReady={handleReady}
            />
            <div className="motion-lab__stage-label" aria-hidden="true">
              <span>{active.shortLabel}</span>
              <i />
              <span>{active.clip}</span>
            </div>
          </div>
        </section>
      </div>

      <nav className="motion-lab__strip" aria-label="Birdee animation states">
        {STATES.map((state, index) => (
          <button
            key={state.clip}
            type="button"
            className={index === activeIndex ? "is-active" : ""}
            aria-current={index === activeIndex ? "true" : undefined}
            onClick={() => chooseState(index)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{state.label}</strong>
            {index === activeIndex && <CheckCircle size={19} weight="fill" aria-hidden="true" />}
          </button>
        ))}
      </nav>

      <footer className="motion-lab__footer">
        <div className="motion-lab__specs" aria-label="Web asset specifications">
          <span><strong>477 KB</strong> animated GLB</span>
          <span><strong>30 fps</strong> authored motion</span>
          <span><strong>1K</strong> web texture</span>
          <span><strong>6</strong> semantic clips</span>
        </div>
        <button
          type="button"
          className="motion-lab__tour"
          aria-pressed={autoTour}
          disabled={prefersReducedMotion}
          onClick={() => setAutoTour((value) => !value)}
        >
          {autoTour ? <Pause size={17} weight="fill" /> : <Play size={17} weight="fill" />}
          {prefersReducedMotion ? "Motion reduced" : autoTour ? "Pause tour" : "Auto tour"}
        </button>
      </footer>
    </main>
  );
}
