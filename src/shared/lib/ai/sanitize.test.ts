import { describe, expect, it } from "vitest";
import { hintMatchesAnswer, sanitizeGapFill } from "./sanitize";

describe("hintMatchesAnswer", () => {
  it("returns true when hint equals answer (exact match)", () => {
    expect(hintMatchesAnswer("yo", "yo")).toBe(true);
  });

  it("returns true when hint equals answer (case-insensitive)", () => {
    expect(hintMatchesAnswer("El", "el")).toBe(true);
  });

  it("returns true when hint equals answer (extra whitespace)", () => {
    expect(hintMatchesAnswer("  yo  ", "yo")).toBe(true);
  });

  it("returns false when hint differs from answer (verb conjugation)", () => {
    expect(hintMatchesAnswer("ir", "van")).toBe(false);
  });

  it("returns false when hint differs from answer (noun plural)", () => {
    expect(hintMatchesAnswer("cuaderno", "cuadernos")).toBe(false);
  });

  it("returns false for contraction hint", () => {
    expect(hintMatchesAnswer("a + el", "al")).toBe(false);
  });
});

describe("sanitizeGapFill", () => {
  it("returns unchanged when no blanks present", () => {
    const result = sanitizeGapFill("Los niños ", " al parque.");
    expect(result).toEqual({ before: "Los niños ", after: " al parque." });
  });

  it("re-splits when underscores appear in before", () => {
    const result = sanitizeGapFill("Los niños ___ al parque", ".");
    expect(result).toEqual({ before: "Los niños ", after: " al parque." });
  });

  it("re-splits when underscores appear in after", () => {
    const result = sanitizeGapFill("Los niños", "___ al parque.");
    expect(result).toEqual({ before: "Los niños", after: " al parque." });
  });

  it("handles ellipsis in before", () => {
    const result = sanitizeGapFill("Los niños ... al parque", ".");
    expect(result).toEqual({ before: "Los niños ", after: " al parque." });
  });
});
