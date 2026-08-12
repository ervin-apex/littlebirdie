import { describe, expect, it } from "vitest";
import { shouldUseRichStoryMedia } from "./useRichStoryMedia";

const desktopPolicy = {
  hasFinePointer: true,
  hasHover: true,
  hasWideAspectRatio: true,
  isWideEnough: true,
  prefersReducedMotion: false,
  supportsVp9Webm: true,
};

describe("rich landing story media policy", () => {
  it("enables the video enhancement for capable desktop contexts", () => {
    expect(shouldUseRichStoryMedia(desktopPolicy)).toBe(true);
  });

  it.each([
    ["touch pointer", { hasFinePointer: false }],
    ["no hover", { hasHover: false }],
    ["narrow viewport", { isWideEnough: false }],
    ["near-square viewport", { hasWideAspectRatio: false }],
    ["reduced motion", { prefersReducedMotion: true }],
    ["no VP9 WebM support", { supportsVp9Webm: false }],
  ])("keeps the complete static experience for %s", (_label, override) => {
    expect(
      shouldUseRichStoryMedia({
        ...desktopPolicy,
        ...override,
      }),
    ).toBe(false);
  });
});
