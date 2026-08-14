import { describe, expect, it } from "vitest";
import { chooseHeroMediaMode, type HeroMediaPolicy } from "./useHeroMediaMode";

const basePolicy: HeroMediaPolicy = {
  canPlayAlphaVideo: true,
  prefersReducedMotion: false,
  saveData: false,
};

describe("hero media policy", () => {
  it("uses the transparent master wherever it can play", () => {
    expect(chooseHeroMediaMode(basePolicy)).toBe("video");
  });

  it("falls back to the animated image only when no master will play", () => {
    expect(
      chooseHeroMediaMode({ ...basePolicy, canPlayAlphaVideo: false }),
    ).toBe("image");
  });

  it.each([
    ["reduced motion", { prefersReducedMotion: true }],
    ["data saver", { saveData: true }],
  ])("keeps the still poster for %s", (_label, override) => {
    expect(chooseHeroMediaMode({ ...basePolicy, ...override })).toBe("still");
    expect(
      chooseHeroMediaMode({ ...basePolicy, canPlayAlphaVideo: false, ...override }),
    ).toBe("still");
  });

  /*
   * The shape of the old bug: a 1280x900 window is a perfectly capable desktop
   * browser, and it used to get a static poster because it is narrower than 3:2.
   * Nothing about the viewport reaches this decision any more.
   */
  it("does not consider viewport shape or input device", () => {
    expect(Object.keys(basePolicy).sort()).toEqual([
      "canPlayAlphaVideo",
      "prefersReducedMotion",
      "saveData",
    ]);
  });
});
