import { describe, expect, it } from "vitest";
import {
  machineSequenceAct,
  machineSequenceActWithHysteresis,
  machineSequenceRange,
  machineSequenceSlideIndex,
} from "../motion/machineSequence";

describe("machine image sequence", () => {
  it("maps the five copy acts to their authored frame groups", () => {
    expect(machineSequenceAct(0)).toBe(0);
    expect(machineSequenceAct(0.2)).toBe(1);
    expect(machineSequenceAct(0.4)).toBe(2);
    expect(machineSequenceAct(0.6)).toBe(3);
    expect(machineSequenceAct(0.7)).toBe(3);
    expect(machineSequenceAct(0.9)).toBe(4);

    expect(machineSequenceRange(0, 15)).toEqual([0, 2]);
    expect(machineSequenceRange(1, 15)).toEqual([3, 6]);
    expect(machineSequenceRange(2, 15)).toEqual([7, 9]);
    expect(machineSequenceRange(3, 15)).toEqual([10, 11]);
    expect(machineSequenceRange(4, 15)).toEqual([12, 14]);
  });

  it("holds the current act inside the boundary deadband", () => {
    expect(machineSequenceActWithHysteresis(0, 0.19)).toBe(0);
    expect(machineSequenceActWithHysteresis(0, 0.219)).toBe(0);
    expect(machineSequenceActWithHysteresis(0, 0.221)).toBe(1);
    expect(machineSequenceActWithHysteresis(1, 0.181)).toBe(1);
    expect(machineSequenceActWithHysteresis(1, 0.179)).toBe(0);
  });

  it("can traverse more than one chapter after a fast swipe", () => {
    expect(machineSequenceActWithHysteresis(0, 0.85)).toBe(4);
    expect(machineSequenceActWithHysteresis(4, 0.05)).toBe(0);
  });

  it("uses only the polished landing frame from each authored act", () => {
    expect(Array.from({ length: 5 }, (_, act) => (
      machineSequenceSlideIndex(act, 15)
    ))).toEqual([2, 6, 9, 11, 14]);

    expect(Array.from({ length: 5 }, (_, act) => (
      machineSequenceSlideIndex(act, 5)
    ))).toEqual([0, 1, 2, 3, 4]);
  });

  it("derives bounded groups for a non-standard frame count", () => {
    expect(machineSequenceRange(0, 10)).toEqual([0, 1]);
    expect(machineSequenceRange(4, 10)).toEqual([8, 9]);
  });
});
