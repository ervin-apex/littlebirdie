"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type BirdeeGuideStep = "problem" | "how" | "different";

type BirdeeGuideState = {
  activeStep: BirdeeGuideStep | null;
  howPhase: 0 | 1 | 2;
  differentPhase: 0 | 1 | 2;
  guidedDesktop: boolean;
  motionReady: boolean;
  reducedMotion: boolean;
};

const BirdeeGuideContext = createContext<BirdeeGuideState>({
  activeStep: null,
  howPhase: 2,
  differentPhase: 2,
  guidedDesktop: false,
  motionReady: false,
  reducedMotion: false,
});

type GuidedBirdeeChapterProps = {
  children: ReactNode;
};

const GUIDE_STEPS: BirdeeGuideStep[] = ["problem", "how", "different"];
const GUIDE_MOTION_TARGETS: Record<BirdeeGuideStep, string> = {
  problem: ".vlab-problem-scene",
  how: ".vlab-profit-perch-scroll",
  different: ".vlab-workbench",
};

export function useBirdeeGuide() {
  return useContext(BirdeeGuideContext);
}

export function GuidedBirdeeChapter({
  children,
}: GuidedBirdeeChapterProps) {
  const chapterRef = useRef<HTMLDivElement>(null);
  const phaseTimersRef = useRef<number[]>([]);
  const visibleStepsRef = useRef<Set<BirdeeGuideStep>>(new Set());
  const [activeStep, setActiveStep] = useState<BirdeeGuideStep | null>(null);
  const [howPhase, setHowPhase] = useState<0 | 1 | 2>(2);
  const [differentPhase, setDifferentPhase] = useState<0 | 1 | 2>(2);
  const [guidedDesktop, setGuidedDesktop] = useState(false);
  const [motionReady, setMotionReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [scrollStarted, setScrollStarted] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(min-width: 1024px) and (min-height: 680px)",
    );
    const updateLayout = () => setGuidedDesktop(mediaQuery.matches);

    updateLayout();
    mediaQuery.addEventListener("change", updateLayout);
    return () => mediaQuery.removeEventListener("change", updateLayout);
  }, []);

  useEffect(() => {
    const initialScrollY = window.scrollY;
    const markScrollStarted = () => {
      if (Math.abs(window.scrollY - initialScrollY) < 4) return;
      setScrollStarted(true);
      window.removeEventListener("scroll", markScrollStarted);
    };

    window.addEventListener("scroll", markScrollStarted, { passive: true });
    return () => window.removeEventListener("scroll", markScrollStarted);
  }, []);

  useEffect(() => {
    const chapter = chapterRef.current;
    if (!chapter) return;

    const clearPhaseTimers = () => {
      phaseTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      phaseTimersRef.current = [];
    };

    if (reducedMotion) {
      clearPhaseTimers();
      visibleStepsRef.current.clear();
      setActiveStep(null);
      setHowPhase(2);
      setDifferentPhase(2);
      setMotionReady(false);
      return;
    }

    const targetsByStep = new Map<BirdeeGuideStep, HTMLElement>();
    const stepsByTarget = new Map<Element, BirdeeGuideStep>();

    GUIDE_STEPS.forEach((step) => {
      const section = chapter.querySelector<HTMLElement>(
        `[data-guide-step="${step}"]`,
      );
      const target =
        section?.querySelector<HTMLElement>(GUIDE_MOTION_TARGETS[step]) ??
        section;

      if (!target) return;
      targetsByStep.set(step, target);
      stepsByTarget.set(target, step);
    });

    if (!targetsByStep.size) return;

    const playSectionMoment = (step: BirdeeGuideStep) => {
      setActiveStep(step);

      clearPhaseTimers();

      if (step !== "how") setHowPhase(2);
      if (step !== "different") setDifferentPhase(2);

      if (step === "how") {
        setHowPhase(2);
      }

      if (step === "different") {
        setDifferentPhase(0);
        phaseTimersRef.current = [
          window.setTimeout(() => setDifferentPhase(1), 620),
          window.setTimeout(() => setDifferentPhase(2), 1540),
        ];
      }
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const step = stepsByTarget.get(entry.target);
        if (!step) return;

        const hasEntered =
          entry.isIntersecting && entry.intersectionRatio >= 0.32;
        const hasExited =
          !entry.isIntersecting || entry.intersectionRatio < 0.08;

        if (step === "problem" && !scrollStarted) return;

        if (hasEntered && !visibleStepsRef.current.has(step)) {
          visibleStepsRef.current.add(step);
          playSectionMoment(step);
        } else if (hasExited) {
          visibleStepsRef.current.delete(step);
        }
      });
    }, {
      rootMargin: "0px 0px -14% 0px",
      threshold: [0, 0.08, 0.32, 0.55],
    });

    targetsByStep.forEach((target) => observer.observe(target));
    setMotionReady(true);

    return () => {
      observer.disconnect();
      clearPhaseTimers();
      visibleStepsRef.current.clear();
    };
  }, [reducedMotion, scrollStarted]);

  const value: BirdeeGuideState = {
    activeStep,
    howPhase,
    differentPhase,
    guidedDesktop,
    motionReady,
    reducedMotion,
  };

  return (
    <BirdeeGuideContext.Provider value={value}>
      <div
        ref={chapterRef}
        className="vlab-guide-chapter"
        data-active-step={activeStep ?? "none"}
        data-how-phase={howPhase}
        data-different-phase={differentPhase}
        data-guided-desktop={guidedDesktop ? "true" : "false"}
        data-motion-ready={motionReady ? "true" : "false"}
        data-reduced-motion={reducedMotion ? "true" : "false"}
      >
        {children}
      </div>
    </BirdeeGuideContext.Provider>
  );
}
