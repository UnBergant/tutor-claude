import { describe, expect, it } from "vitest";
import { getPhraseOfTheDay, PHRASES } from "./phrases";

describe("getPhraseOfTheDay", () => {
  it("returns a phrase object with required fields", () => {
    const phrase = getPhraseOfTheDay();
    expect(phrase).toHaveProperty("phrase");
    expect(phrase).toHaveProperty("translation");
    expect(typeof phrase.phrase).toBe("string");
    expect(typeof phrase.translation).toBe("string");
  });

  it("is deterministic for the same date", () => {
    const date = new Date("2025-06-15T10:00:00Z");
    const phrase1 = getPhraseOfTheDay(date);
    const phrase2 = getPhraseOfTheDay(date);
    expect(phrase1).toEqual(phrase2);
  });

  it("returns different phrases for different days", () => {
    const day1 = getPhraseOfTheDay(new Date("2025-01-01"));
    const day2 = getPhraseOfTheDay(new Date("2025-01-02"));
    // Adjacent days should give different phrases (unless wrapping hits same index)
    // With 60 phrases, day 1 and 2 will have different indices
    expect(day1).not.toEqual(day2);
  });

  it("wraps around after cycling through all phrases", () => {
    // Day 0 and day N (where N = phrases.length) should be the same
    const year = 2025;
    const first = getPhraseOfTheDay(new Date(year, 0, 1));

    // Create a date that's PHRASES.length days later
    const laterDate = new Date(year, 0, 1);
    laterDate.setDate(laterDate.getDate() + PHRASES.length);
    const wrapped = getPhraseOfTheDay(laterDate);

    expect(wrapped).toEqual(first);
  });

  it("has at least 50 phrases in the collection", () => {
    expect(PHRASES.length).toBeGreaterThanOrEqual(50);
  });

  it("all phrases have non-empty phrase and translation", () => {
    for (const p of PHRASES) {
      expect(p.phrase.length).toBeGreaterThan(0);
      expect(p.translation.length).toBeGreaterThan(0);
    }
  });
});
