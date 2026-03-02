import { describe, expect, it } from "vitest";
import { SITUATIONS } from "./situations";

describe("SITUATIONS", () => {
  it("has at least 6 situations", () => {
    expect(SITUATIONS.length).toBeGreaterThanOrEqual(6);
  });

  it("has unique IDs", () => {
    const ids = SITUATIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all situations have required fields", () => {
    for (const s of SITUATIONS) {
      expect(s.id).toBeTruthy();
      expect(s.title).toBeTruthy();
      expect(s.description).toBeTruthy();
      expect(s.icon).toBeTruthy();
      expect(s.starterMessage).toBeTruthy();
      expect(s.minLevel).toBeTruthy();
      expect(Array.isArray(s.targetVocabulary)).toBe(true);
      expect(typeof s.systemPromptAddition).toBe("string");
    }
  });

  it("all minLevel values are valid CEFR levels", () => {
    const validLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];
    for (const s of SITUATIONS) {
      expect(validLevels).toContain(s.minLevel);
    }
  });

  it("starter messages are in Spanish", () => {
    for (const s of SITUATIONS) {
      // Basic check — starter messages should contain Spanish punctuation or common words
      const hasSpanish =
        s.starterMessage.includes("¿") ||
        s.starterMessage.includes("¡") ||
        s.starterMessage.includes("Hola") ||
        s.starterMessage.includes("Buenos");
      expect(hasSpanish).toBe(true);
    }
  });

  it("includes 'free' conversation as the first option", () => {
    expect(SITUATIONS[0].id).toBe("free");
    expect(SITUATIONS[0].minLevel).toBe("A1");
  });

  it("free conversation has empty systemPromptAddition", () => {
    const free = SITUATIONS.find((s) => s.id === "free");
    expect(free?.systemPromptAddition).toBe("");
  });

  it("non-free situations have non-empty systemPromptAddition", () => {
    const nonFree = SITUATIONS.filter((s) => s.id !== "free");
    for (const s of nonFree) {
      expect(s.systemPromptAddition.length).toBeGreaterThan(0);
    }
  });
});
