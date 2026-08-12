"use client";

import { useEffect, useState } from "react";
import {
  machineSequenceAct,
  machineSequenceActWithHysteresis,
  MACHINE_SEQUENCE_SETTLE_MS,
} from "./machineSequence";

export function useMachineSequenceAct(progress: number) {
  const [act, setAct] = useState(() => machineSequenceAct(progress));

  useEffect(() => {
    // Momentum scrolling can cross several boundaries in a few frames. Wait
    // for the native scroll position to settle, then choose exactly one
    // destination. This prevents programmatic follow-on slides.
    const timeout = window.setTimeout(() => {
      setAct((current) => machineSequenceActWithHysteresis(current, progress));
    }, MACHINE_SEQUENCE_SETTLE_MS);

    return () => window.clearTimeout(timeout);
  }, [progress]);

  return act;
}
