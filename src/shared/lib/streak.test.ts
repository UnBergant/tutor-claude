import { describe, expect, it } from "vitest";
import { calculateStreak } from "./streak";

describe("calculateStreak", () => {
  const now = new Date("2025-03-15T14:30:00Z");

  it("returns 1 when lastActivityDate is null (first activity)", () => {
    const result = calculateStreak(
      { lastActivityDate: null, currentStreak: 0, longestStreak: 0 },
      now,
    );
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it("keeps streak unchanged on same calendar day", () => {
    const today = new Date("2025-03-15T08:00:00Z");
    const result = calculateStreak(
      { lastActivityDate: today, currentStreak: 5, longestStreak: 10 },
      now,
    );
    expect(result.currentStreak).toBe(5);
    expect(result.longestStreak).toBe(10);
  });

  it("increments streak when last activity was yesterday", () => {
    const yesterday = new Date("2025-03-14T20:00:00Z");
    const result = calculateStreak(
      { lastActivityDate: yesterday, currentStreak: 3, longestStreak: 7 },
      now,
    );
    expect(result.currentStreak).toBe(4);
    expect(result.longestStreak).toBe(7);
  });

  it("resets streak on gap (2+ days)", () => {
    const twoDaysAgo = new Date("2025-03-13T12:00:00Z");
    const result = calculateStreak(
      { lastActivityDate: twoDaysAgo, currentStreak: 10, longestStreak: 15 },
      now,
    );
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(15);
  });

  it("updates longestStreak when current exceeds it", () => {
    const yesterday = new Date("2025-03-14T12:00:00Z");
    const result = calculateStreak(
      { lastActivityDate: yesterday, currentStreak: 7, longestStreak: 7 },
      now,
    );
    expect(result.currentStreak).toBe(8);
    expect(result.longestStreak).toBe(8);
  });

  it("always sets lastActivityDate to now", () => {
    const result = calculateStreak(
      { lastActivityDate: null, currentStreak: 0, longestStreak: 0 },
      now,
    );
    expect(result.lastActivityDate).toBe(now);
  });

  it("handles very old lastActivityDate", () => {
    const veryOld = new Date("2020-01-01T00:00:00Z");
    const result = calculateStreak(
      { lastActivityDate: veryOld, currentStreak: 100, longestStreak: 200 },
      now,
    );
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(200);
  });
});
