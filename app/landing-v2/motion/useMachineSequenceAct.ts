"use client";

import { useEffect, useState } from "react";
import {
  machineSequenceAct,
  machineSequenceActWithHysteresis,
} from "./machineSequence";

export function useMachineSequenceAct(progress: number) {
  const [act, setAct] = useState(() => machineSequenceAct(progress));

  useEffect(() => {
    // Follow crossed chapter boundaries while the finger is still moving.
    // Hysteresis remains around each boundary to prevent a small momentum
    // bounce from flickering between adjacent slides.
    setAct((current) => machineSequenceActWithHysteresis(current, progress));
  }, [progress]);

  return act;
}
