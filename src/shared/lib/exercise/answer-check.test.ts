import { describe, expect, it } from "vitest";
import {
  categorizeMistake,
  checkAnswer,
  formatAnswerWarning,
  getAnswerWarning,
} from "./answer-check";

describe("checkAnswer", () => {
  describe("gap_fill", () => {
    it("accepts exact match", () => {
      expect(checkAnswer("hablo", "hablo", "gap_fill")).toBe(true);
    });

    it("accepts case-insensitive match", () => {
      expect(checkAnswer("Hablo", "hablo", "gap_fill")).toBe(true);
    });

    it("accepts trailing punctuation differences", () => {
      expect(checkAnswer("hablo.", "hablo", "gap_fill")).toBe(true);
    });

    it("accepts accent-tolerant match", () => {
      expect(checkAnswer("cafe", "café", "gap_fill")).toBe(true);
    });

    it("accepts small typos for long words", () => {
      expect(checkAnswer("desayunno", "desayuno", "gap_fill")).toBe(true);
    });

    it("rejects wrong answer", () => {
      expect(checkAnswer("como", "hablo", "gap_fill")).toBe(false);
    });

    it("rejects typos in short words", () => {
      expect(checkAnswer("syo", "soy", "gap_fill")).toBe(false);
    });
  });

  describe("multiple_choice", () => {
    it("accepts exact match", () => {
      expect(checkAnswer("estás", "estás", "multiple_choice")).toBe(true);
    });

    it("rejects different option", () => {
      expect(checkAnswer("eres", "estás", "multiple_choice")).toBe(false);
    });
  });

  describe("reorder_words", () => {
    it("accepts correct sentence", () => {
      expect(
        checkAnswer(
          "El gato duerme en la silla",
          "El gato duerme en la silla",
          "reorder_words",
        ),
      ).toBe(true);
    });

    it("accepts accent-tolerant match", () => {
      expect(checkAnswer("El esta aqui", "Él está aquí", "reorder_words")).toBe(
        true,
      );
    });
  });

  describe("match_pairs", () => {
    it("accepts correct pairs in different JSON order", () => {
      const correct = JSON.stringify([
        { left: "a", right: "1" },
        { left: "b", right: "2" },
      ]);
      const user = JSON.stringify([
        { left: "b", right: "2" },
        { left: "a", right: "1" },
      ]);
      expect(checkAnswer(user, correct, "match_pairs")).toBe(true);
    });

    it("rejects wrong pairing", () => {
      const correct = JSON.stringify([
        { left: "a", right: "1" },
        { left: "b", right: "2" },
      ]);
      const user = JSON.stringify([
        { left: "a", right: "2" },
        { left: "b", right: "1" },
      ]);
      expect(checkAnswer(user, correct, "match_pairs")).toBe(false);
    });
  });

  describe("free_writing", () => {
    it("always returns false (uses AI evaluation)", () => {
      expect(checkAnswer("anything", "anything", "free_writing")).toBe(false);
    });
  });

  describe("reading_comprehension", () => {
    it("accepts all correct sub-answers", () => {
      const user = JSON.stringify(["bonito", "grande"]);
      const correct = JSON.stringify(["bonito", "grande"]);
      expect(checkAnswer(user, correct, "reading_comprehension")).toBe(true);
    });

    it("accepts accent-tolerant sub-answers", () => {
      const user = JSON.stringify(["cafe"]);
      const correct = JSON.stringify(["café"]);
      expect(checkAnswer(user, correct, "reading_comprehension")).toBe(true);
    });

    it("rejects if any sub-answer is wrong", () => {
      const user = JSON.stringify(["bonito", "pequeño"]);
      const correct = JSON.stringify(["bonito", "grande"]);
      expect(checkAnswer(user, correct, "reading_comprehension")).toBe(false);
    });
  });
});

describe("categorizeMistake", () => {
  it("returns WORD_ORDER for reorder_words", () => {
    expect(categorizeMistake("a b c", "c b a", "reorder_words")).toBe(
      "WORD_ORDER",
    );
  });

  it("returns VOCABULARY for match_pairs", () => {
    expect(categorizeMistake("wrong", "correct", "match_pairs")).toBe(
      "VOCABULARY",
    );
  });

  it("returns GRAMMAR for free_writing", () => {
    expect(categorizeMistake("any", "answer", "free_writing")).toBe("GRAMMAR");
  });

  it("returns WORD_ORDER when same words different order", () => {
    expect(categorizeMistake("gato el", "el gato", "gap_fill")).toBe(
      "WORD_ORDER",
    );
  });

  it("returns GRAMMAR when words share common root", () => {
    // shareCommonRoot requires MIN_ROOT_LENGTH+2 (5) char prefix match
    // "hablamos" and "hablando" share "habla" (5 chars)
    expect(categorizeMistake("hablamos", "hablando", "gap_fill")).toBe(
      "GRAMMAR",
    );
  });

  it("returns VOCABULARY for completely different words", () => {
    expect(categorizeMistake("perro", "gato", "gap_fill")).toBe("VOCABULARY");
  });
});

describe("getAnswerWarning", () => {
  it("returns null for exact match", () => {
    expect(getAnswerWarning("hablo", "hablo", "gap_fill")).toBe(null);
  });

  it("returns 'accent' for accent mismatch", () => {
    expect(getAnswerWarning("cafe", "café", "gap_fill")).toBe("accent");
  });

  it("returns 'typo' for typo match", () => {
    expect(getAnswerWarning("desayunno", "desayuno", "gap_fill")).toBe("typo");
  });

  it("returns null for non-text types", () => {
    expect(getAnswerWarning("x", "x", "multiple_choice")).toBe(null);
  });
});

describe("formatAnswerWarning", () => {
  it("returns null for no warning", () => {
    expect(formatAnswerWarning(null, "hablo")).toBe(null);
  });

  it("returns accent message", () => {
    const msg = formatAnswerWarning("accent", "café");
    expect(msg).toContain("accent");
    expect(msg).toContain("café");
  });

  it("returns typo message", () => {
    const msg = formatAnswerWarning("typo", "desayuno");
    expect(msg).toContain("spelling");
    expect(msg).toContain("desayuno");
  });
});
