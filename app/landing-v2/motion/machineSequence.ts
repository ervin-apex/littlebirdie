export const MACHINE_SEQUENCE_RANGES = [
  [0, 2],
  [3, 6],
  [7, 9],
  [10, 11],
  [12, 14],
] as const;

export const MACHINE_SEQUENCE_SLIDE_MS = 280;
export const MACHINE_SEQUENCE_HYSTERESIS = 0.02;
export const MACHINE_SEQUENCE_SETTLE_MS = 140;

// Give each of the five approved chapters the same amount of active scroll
// distance. The section-level timeline still keeps its separate end hold.
export const MACHINE_SEQUENCE_BOUNDARIES = [0.2, 0.4, 0.6, 0.8] as const;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function machineSequenceAct(progress: number) {
  const nextProgress = clamp01(progress);
  return MACHINE_SEQUENCE_BOUNDARIES.findIndex(
    (boundary) => nextProgress < boundary,
  ) === -1
    ? MACHINE_SEQUENCE_RANGES.length - 1
    : MACHINE_SEQUENCE_BOUNDARIES.findIndex(
      (boundary) => nextProgress < boundary,
    );
}

export function machineSequenceActWithHysteresis(
  currentAct: number,
  progress: number,
) {
  const lastAct = MACHINE_SEQUENCE_RANGES.length - 1;
  let nextAct = Math.max(0, Math.min(lastAct, currentAct));
  const nextProgress = clamp01(progress);

  // The 4%-wide deadband around each boundary prevents iOS momentum scroll
  // from rapidly toggling chapters when it settles near a threshold.
  while (
    nextAct < lastAct
    && nextProgress >= MACHINE_SEQUENCE_BOUNDARIES[nextAct]
      + MACHINE_SEQUENCE_HYSTERESIS
  ) {
    nextAct += 1;
  }

  while (
    nextAct > 0
    && nextProgress < MACHINE_SEQUENCE_BOUNDARIES[nextAct - 1]
      - MACHINE_SEQUENCE_HYSTERESIS
  ) {
    nextAct -= 1;
  }

  return nextAct;
}

export function machineSequenceRange(act: number, frameCount: number) {
  if (frameCount <= 1) return [0, 0] as const;

  if (frameCount === 15) {
    const safeAct = Math.max(
      0,
      Math.min(MACHINE_SEQUENCE_RANGES.length - 1, act),
    );
    return MACHINE_SEQUENCE_RANGES[safeAct];
  }

  const actCount = MACHINE_SEQUENCE_RANGES.length;
  const safeAct = Math.max(0, Math.min(actCount - 1, act));
  const start = Math.round((safeAct / actCount) * frameCount);
  const end = Math.min(
    frameCount - 1,
    Math.round(((safeAct + 1) / actCount) * frameCount) - 1,
  );

  return [start, Math.max(start, end)] as const;
}

export function machineSequenceSlideIndex(act: number, frameCount: number) {
  const [, end] = machineSequenceRange(act, frameCount);
  return end;
}
