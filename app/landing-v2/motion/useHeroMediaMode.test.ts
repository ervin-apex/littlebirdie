import { describe, expect, it } from "vitest";
import { chooseHeroMediaMode, type HeroMediaPolicy } from "./useHeroMediaMode";

const basePolicy: HeroMediaPolicy = {
  hasFinePointer: true,
  hasHover: true,
  hasWideAspectRatio: true,
  isWideEnough: true,
  isMobileContext: false,
  prefersReducedMotion: false,
  saveData: false,
  supportsVp9Webm: true,
};

describe("hero media policy", () => {
  it("uses the authored WebM on capable desktop contexts", () => {
    expect(chooseHeroMediaMode(basePolicy)).toBe("rich");
  });

  it("uses the mobile-safe animated image path on touch/mobile contexts", () => {
    expect(
      chooseHeroMediaMode({
        ...basePolicy,
        hasFinePointer: false,
        hasHover: false,
        isMobileContext: true,
        isWideEnough: false,
      }),
    ).toBe("mobile");
  });

  it.each([
    ["reduced motion", { prefersReducedMotion: true }],
    ["data saver", { saveData: true }],
    ["missing transparent VP9 WebM", { supportsVp9Webm: false }],
  ])("keeps the still fallback for mobile users with %s", (_label, override) => {
    expect(
      chooseHeroMediaMode({
        ...basePolicy,
        hasFinePointer: false,
        hasHover: false,
        isMobileContext: true,
        isWideEnough: false,
        ...override,
      }),
    ).toBe("still");
  });
});
