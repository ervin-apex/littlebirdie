import { describe, expect, it } from "vitest";
import {
  accountantAct,
  clamp01,
  machineAct,
  machineMediaProgress,
  visibilityAct,
} from "./timeline";

describe("landing v2 story timelines", () => {
  it("clamps progress", () => {
    expect(clamp01(-2)).toBe(0);
    expect(clamp01(0.45)).toBe(0.45);
    expect(clamp01(4)).toBe(1);
  });

  it("maps the visibility story to three even, discrete acts", () => {
    expect(visibilityAct(0)).toBe(0);
    expect(visibilityAct(1 / 3 - 0.001)).toBe(0);
    expect(visibilityAct(1 / 3)).toBe(1);
    expect(visibilityAct(2 / 3 - 0.001)).toBe(1);
    expect(visibilityAct(2 / 3)).toBe(2);
    expect(visibilityAct(1)).toBe(2);
  });

  it("maps all four accountant acts", () => {
    expect([0.1, 0.3, 0.6, 0.9].map(accountantAct)).toEqual([0, 1, 2, 3]);
  });

  it("maps machine progress to the five approved video beats", () => {
    expect([0.05, 0.14, 0.25, 0.5, 0.95].map(machineAct)).toEqual([0, 1, 2, 3, 4]);
  });

  it("holds the finished machine frame for the tail of the scroll story", () => {
    expect(machineMediaProgress(0)).toBe(0);
    expect(machineMediaProgress(0.47)).toBeCloseTo(0.5);
    expect(machineMediaProgress(0.94)).toBe(1);
    expect(machineMediaProgress(0.98)).toBe(1);
  });
});
