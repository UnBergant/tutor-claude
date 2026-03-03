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

  describe("timezone awareness", () => {
    it("treats same UTC instant as different days in different timezones", () => {
      // 2025-03-15 23:30 UTC → still March 15 in UTC, but March 16 in UTC+3
      const lateUtc = new Date("2025-03-15T23:30:00Z");
      const lastActivity = new Date("2025-03-15T10:00:00Z");

      // In UTC: both are March 15 → same day → keep streak
      const resultUtc = calculateStreak(
        {
          lastActivityDate: lastActivity,
          currentStreak: 5,
          longestStreak: 10,
          timezone: "UTC",
        },
        lateUtc,
      );
      expect(resultUtc.currentStreak).toBe(5);

      // In Europe/Moscow (UTC+3): lateUtc is March 16, lastActivity is March 15 → yesterday → increment
      const resultMoscow = calculateStreak(
        {
          lastActivityDate: lastActivity,
          currentStreak: 5,
          longestStreak: 10,
          timezone: "Europe/Moscow",
        },
        lateUtc,
      );
      expect(resultMoscow.currentStreak).toBe(6);
    });

    it("detects yesterday across timezone boundary", () => {
      // 2025-03-16 01:00 UTC → March 16 in UTC, March 16 in UTC+3
      const earlyUtc = new Date("2025-03-16T01:00:00Z");
      const lastActivity = new Date("2025-03-15T10:00:00Z");

      // In UTC: March 16 vs March 15 → yesterday → increment
      const resultUtc = calculateStreak(
        {
          lastActivityDate: lastActivity,
          currentStreak: 3,
          longestStreak: 7,
          timezone: "UTC",
        },
        earlyUtc,
      );
      expect(resultUtc.currentStreak).toBe(4);

      // In Europe/Moscow (UTC+3): earlyUtc is March 16 04:00, lastActivity is March 15 13:00
      // Both differ by one day → yesterday → increment
      const resultMoscow = calculateStreak(
        {
          lastActivityDate: lastActivity,
          currentStreak: 3,
          longestStreak: 7,
          timezone: "Europe/Moscow",
        },
        earlyUtc,
      );
      expect(resultMoscow.currentStreak).toBe(4);
    });

    it("resets streak when timezone shifts gap to 2+ days", () => {
      // 2025-03-15 00:30 UTC → still March 15 in UTC
      // In Pacific/Honolulu (UTC-10): it's March 14 14:30
      // lastActivity: 2025-03-12 23:00 UTC → in Honolulu: March 12 13:00
      // March 14 vs March 12 = 2 day gap → reset
      const now = new Date("2025-03-15T00:30:00Z");
      const lastActivity = new Date("2025-03-12T23:00:00Z");

      // In UTC: March 15 vs March 12 = 3 day gap → reset
      const resultUtc = calculateStreak(
        {
          lastActivityDate: lastActivity,
          currentStreak: 5,
          longestStreak: 10,
          timezone: "UTC",
        },
        now,
      );
      expect(resultUtc.currentStreak).toBe(1);

      // In Honolulu: March 14 vs March 12 = 2 day gap → also reset
      const resultHonolulu = calculateStreak(
        {
          lastActivityDate: lastActivity,
          currentStreak: 5,
          longestStreak: 10,
          timezone: "Pacific/Honolulu",
        },
        now,
      );
      expect(resultHonolulu.currentStreak).toBe(1);
    });

    it("defaults to UTC when no timezone is provided", () => {
      const result = calculateStreak(
        {
          lastActivityDate: new Date("2025-03-14T20:00:00Z"),
          currentStreak: 3,
          longestStreak: 7,
        },
        now,
      );
      expect(result.currentStreak).toBe(4);
    });
  });
});
