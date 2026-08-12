"use client";

import Image from "next/image";
import { useRef } from "react";
import { LANDING_V2_MEDIA } from "../media";
import { usePrefersReducedMotion, useScrollStage } from "../motion/useScrollStage";
import { machineMediaProgress } from "../motion/timeline";
import { useMachineSequenceAct } from "../motion/useMachineSequenceAct";
import { MachineImageSequence } from "./MachineImageSequence";

const MACHINE_ACTS = [
  { lead: "Takes", accent: "historical numbers", tail: "from yr business." },
  { lead: "Plus", accent: "a prediction of revenue", tail: "from yr experience" },
  { lead: "Packages", accent: "it up.", tail: "" },
  { lead: "So you can", accent: "impact yr profit", tail: "in real time." },
  { lead: "Then compares that", accent: "budget to actual", tail: "" },
] as const;

export function ProfitMachineStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollStage(sectionRef);
  const mediaProgress = machineMediaProgress(progress);
  const reduced = usePrefersReducedMotion();
  const sequenceAct = useMachineSequenceAct(mediaProgress);
  const actIndex = sequenceAct;

  if (reduced) {
    return (
      <section
        className="lb2-machine lb2-reduced-story lb2-reduced-story--machine"
        id="how-it-works"
        aria-labelledby="lb2-machine-title"
      >
        <div className="lb2-shell">
          <p className="lb2-kicker">What Little Birdee does.</p>
          <h2 id="lb2-machine-title">Your probable profit, <em>before it happens.</em></h2>
          <div className="lb2-reduced-story__grid">
            {MACHINE_ACTS.map((item, index) => (
              <article key={item.accent}>
                <div className="lb2-reduced-story__machine-frame">
                  <Image src={LANDING_V2_MEDIA.machine.posters[index]} alt="" fill sizes="(max-width: 700px) 92vw, 44vw" />
                </div>
                <span>0{index + 1}</span>
                <h3>{item.lead} <em>{item.accent}</em> {item.tail}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="lb2-machine lb2-scroll-story"
      id="how-it-works"
      aria-labelledby="lb2-machine-title"
    >
      <div className="lb2-scroll-story__sticky">
        <div className="lb2-machine__stage" aria-hidden="true" data-act={actIndex + 1}>
          <div className="lb2-machine__mobile-copy" key={actIndex}>
            <p>What Little Birdee does.</p>
            <h2><span className="lb2-machine__phrase">{MACHINE_ACTS[actIndex].lead} <em>{MACHINE_ACTS[actIndex].accent}</em></span>{MACHINE_ACTS[actIndex].tail && <> {MACHINE_ACTS[actIndex].tail}</>}</h2>
          </div>
          <div className="lb2-machine__media">
            <MachineImageSequence
              activeAct={sequenceAct}
              frames={LANDING_V2_MEDIA.machine.mobileSequence}
              phoneFrames={LANDING_V2_MEDIA.machine.phoneSequence}
              desktopFrames={LANDING_V2_MEDIA.machine.desktopSequence}
            />
          </div>
        </div>
      </div>

      <div className="lb2-sr-only">
        <h2 id="lb2-machine-title">What Little Birdee does</h2>
        <ol>
          <li>Takes historical numbers from your business.</li>
          <li>Plus a prediction of revenue from yr experience.</li>
          <li>Packages it into a probable profit result.</li>
          <li>So you can impact yr profit in real time.</li>
          <li>Then compares that budget to actual.</li>
        </ol>
      </div>
    </section>
  );
}
