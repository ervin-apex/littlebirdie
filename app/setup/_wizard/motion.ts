export const STEP_EASE = [0.23, 1, 0.32, 1] as const;

export const STEP_VARIANTS = {
  enter: (direction: number) => ({
    opacity: 0,
    transform: `translateX(${direction * 14}px)`,
  }),
  center: {
    opacity: 1,
    transform: "translateX(0px)",
  },
  exit: (direction: number) => ({
    opacity: 0,
    transform: `translateX(${direction * -10}px)`,
  }),
};
