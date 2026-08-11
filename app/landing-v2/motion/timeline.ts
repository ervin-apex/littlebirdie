export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function visibilityAct(progress: number) {
  if (progress < 1 / 3) return 0;
  if (progress < 2 / 3) return 1;
  return 2;
}

export function accountantAct(progress: number) {
  return Math.min(3, Math.floor(clamp01(progress) * 4));
}

export function machineAct(progress: number) {
  if (progress < 0.105) return 0;
  if (progress < 0.182) return 1;
  if (progress < 0.364) return 2;
  if (progress < 0.818) return 3;
  return 4;
}

export const MACHINE_SCRUB_END = 0.86;

export function machineMediaProgress(progress: number) {
  return clamp01(progress / MACHINE_SCRUB_END);
}
