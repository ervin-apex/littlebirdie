"use client";

import { useEffect, useRef, useState } from "react";
import { machineSequenceSlideIndex } from "../motion/machineSequence";

type MachineImageSequenceProps = {
  activeAct: number;
  frames: readonly string[];
  phoneFrames: readonly string[];
  desktopFrames: readonly string[];
};

/**
 * A five-composition horizontal track driven directly by the settled scroll
 * chapter. The transform is interruptible and has no internal queue, timers,
 * autoplay, crossfade, or intermediate cover.
 */
export function MachineImageSequence({
  activeAct,
  frames,
  phoneFrames,
  desktopFrames,
}: MachineImageSequenceProps) {
  const sequenceRef = useRef<HTMLDivElement>(null);
  const [loadSequence, setLoadSequence] = useState(false);

  useEffect(() => {
    const sequence = sequenceRef.current;
    if (!sequence) return;

    if (!("IntersectionObserver" in window)) {
      setLoadSequence(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setLoadSequence(true);
        observer.disconnect();
      },
      { rootMargin: "125% 0px" },
    );

    observer.observe(sequence);
    return () => observer.disconnect();
  }, []);

  const slides = Array.from({ length: 5 }, (_, act) => ({
    act,
    src: frames[machineSequenceSlideIndex(act, frames.length)] ?? frames[0],
    phoneSrc:
      phoneFrames[machineSequenceSlideIndex(act, phoneFrames.length)] ??
      phoneFrames[0],
    desktopSrc:
      desktopFrames[machineSequenceSlideIndex(act, desktopFrames.length)] ??
      desktopFrames[0],
  }));

  const firstFrame =
    frames[machineSequenceSlideIndex(0, frames.length)] ?? frames[0];
  const firstPhoneFrame =
    phoneFrames[machineSequenceSlideIndex(0, phoneFrames.length)] ??
    phoneFrames[0];
  const firstDesktopFrame =
    desktopFrames[machineSequenceSlideIndex(0, desktopFrames.length)] ??
    desktopFrames[0];

  return (
    <div
      ref={sequenceRef}
      className="lb2-machine__sequence"
      data-act={activeAct + 1}
    >
      <div
        className="lb2-machine__sequence-track"
        style={{ transform: `translate3d(-${activeAct * 20}%, 0, 0)` }}
      >
        {slides.map(({ act, src, phoneSrc, desktopSrc }) => (
          <div className="lb2-machine__sequence-slide" key={src}>
            <picture className="lb2-machine__sequence-picture">
              <source media="(min-width: 1101px)" srcSet={desktopSrc} />
              <source media="(max-width: 520px)" srcSet={phoneSrc} />
              <img
                className="lb2-machine__sequence-frame"
                src={src}
                alt=""
                width="1280"
                height="720"
                loading={loadSequence || act < 2 ? "eager" : "lazy"}
                decoding="async"
              />
            </picture>
          </div>
        ))}
      </div>
      {!loadSequence && (
        <picture className="lb2-machine__sequence-picture">
          <source media="(min-width: 1101px)" srcSet={firstDesktopFrame} />
          <source media="(max-width: 520px)" srcSet={firstPhoneFrame} />
          <img
            className="lb2-machine__sequence-frame lb2-machine__sequence-fallback"
            src={firstFrame}
            alt=""
            width="1280"
            height="720"
            loading="eager"
            decoding="async"
          />
        </picture>
      )}
    </div>
  );
}
