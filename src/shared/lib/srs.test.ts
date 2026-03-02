import { describe, expect, it } from "vitest";
import { sm2 } from "./srs";

describe("sm2", () => {
  it("resets repetitions on quality < 3 (failed recall)", () => {
    const result = sm2({
      quality: 1,
      repetitions: 5,
      easeFactor: 2.5,
      interval: 30,
    });
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  it("sets interval to 1 on first successful recall", () => {
    const result = sm2({
      quality: 4,
      repetitions: 0,
      easeFactor: 2.5,
      interval: 1,
    });
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
  });

  it("sets interval to 6 on second successful recall", () => {
    const result = sm2({
      quality: 4,
      repetitions: 1,
      easeFactor: 2.5,
      interval: 1,
    });
    expect(result.repetitions).toBe(2);
    expect(result.interval).toBe(6);
  });

  it("multiplies interval by ease factor after 2+ repetitions", () => {
    const result = sm2({
      quality: 4,
      repetitions: 2,
      easeFactor: 2.5,
      interval: 6,
    });
    expect(result.repetitions).toBe(3);
    expect(result.interval).toBe(15); // Math.round(6 * 2.5)
  });

  it("never drops ease factor below 1.3", () => {
    const result = sm2({
      quality: 0,
      repetitions: 3,
      easeFactor: 1.3,
      interval: 15,
    });
    expect(result.easeFactor).toBe(1.3);
  });

  it("increases ease factor for quality 5 (perfect)", () => {
    const result = sm2({
      quality: 5,
      repetitions: 2,
      easeFactor: 2.5,
      interval: 6,
    });
    expect(result.easeFactor).toBe(2.6);
  });

  it("decreases ease factor for quality 3 (difficult)", () => {
    const result = sm2({
      quality: 3,
      repetitions: 2,
      easeFactor: 2.5,
      interval: 6,
    });
    expect(result.easeFactor).toBeLessThan(2.5);
  });

  it("preserves ease factor on failure (quality < 3)", () => {
    const result = sm2({
      quality: 2,
      repetitions: 3,
      easeFactor: 2.2,
      interval: 15,
    });
    // ease factor is preserved but clamped to min
    expect(result.easeFactor).toBe(2.2);
  });

  it("returns a future nextReviewAt date", () => {
    const before = new Date();
    const result = sm2({
      quality: 4,
      repetitions: 0,
      easeFactor: 2.5,
      interval: 1,
    });
    expect(result.nextReviewAt.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
  });

  it("clamps quality to 0-5 range", () => {
    const tooHigh = sm2({
      quality: 10,
      repetitions: 0,
      easeFactor: 2.5,
      interval: 1,
    });
    expect(tooHigh.repetitions).toBe(1); // quality 5 → success

    const tooLow = sm2({
      quality: -3,
      repetitions: 5,
      easeFactor: 2.5,
      interval: 30,
    });
    expect(tooLow.repetitions).toBe(0); // quality 0 → failure
  });

  it("progresses intervals correctly over multiple reviews", () => {
    let state = { repetitions: 0, easeFactor: 2.5, interval: 1 };

    // First review (quality 4)
    let result = sm2({ quality: 4, ...state });
    expect(result.interval).toBe(1);
    state = result;

    // Second review
    result = sm2({ quality: 4, ...state });
    expect(result.interval).toBe(6);
    state = result;

    // Third review
    result = sm2({ quality: 4, ...state });
    expect(result.interval).toBe(Math.round(6 * state.easeFactor));
  });
});
