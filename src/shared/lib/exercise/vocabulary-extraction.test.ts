import { describe, expect, it } from "vitest";
import type {
  FreeWritingContent,
  GapFillContent,
  MatchPairsContent,
  MultipleChoiceContent,
  ReadingComprehensionContent,
  ReorderWordsContent,
} from "@/shared/types/exercise";
import { extractVocabularyFromExercise } from "./vocabulary-extraction";

describe("extractVocabularyFromExercise", () => {
  describe("gap_fill", () => {
    it("extracts word from correct answer with translation and context", () => {
      const content: GapFillContent = {
        type: "gap_fill",
        before: "Yo ",
        after: " español.",
        correctAnswer: "hablo",
        translation: "I speak Spanish.",
        explanation: "Present tense of hablar",
      };

      const words = extractVocabularyFromExercise("gap_fill", content, "hablo");
      expect(words).toHaveLength(1);
      expect(words[0].word).toBe("hablo");
      expect(words[0].translation).toBe("I speak Spanish.");
      expect(words[0].context).toBe("Yo hablo español.");
    });

    it("returns empty array for empty correct answer", () => {
      const content: GapFillContent = {
        type: "gap_fill",
        before: "",
        after: "",
        correctAnswer: "",
        explanation: "",
      };
      const words = extractVocabularyFromExercise("gap_fill", content, "");
      expect(words).toHaveLength(0);
    });
  });

  describe("multiple_choice", () => {
    it("extracts correct answer with prompt as context", () => {
      const content: MultipleChoiceContent = {
        type: "multiple_choice",
        prompt: "¿Cómo ___ tú?",
        options: ["estás", "eres", "tienes", "haces"],
        correctIndex: 0,
        correctAnswer: "estás",
        explanation: "Estar for temporary states",
      };

      const words = extractVocabularyFromExercise(
        "multiple_choice",
        content,
        "estás",
      );
      expect(words).toHaveLength(1);
      expect(words[0].word).toBe("estás");
      expect(words[0].context).toBe("¿Cómo ___ tú?");
    });
  });

  describe("match_pairs", () => {
    it("extracts all pairs as vocabulary entries", () => {
      const content: MatchPairsContent = {
        type: "match_pairs",
        pairs: [
          { left: "gato", right: "cat" },
          { left: "perro", right: "dog" },
          { left: "pájaro", right: "bird" },
        ],
        shuffledRightItems: ["dog", "bird", "cat"],
        explanation: "Animals",
      };

      const words = extractVocabularyFromExercise(
        "match_pairs",
        content,
        JSON.stringify(content.pairs),
      );
      expect(words).toHaveLength(3);
      expect(words[0]).toEqual({ word: "gato", translation: "cat" });
      expect(words[1]).toEqual({ word: "perro", translation: "dog" });
      expect(words[2]).toEqual({ word: "pájaro", translation: "bird" });
    });
  });

  describe("reorder_words", () => {
    it("extracts full sentence with translation", () => {
      const content: ReorderWordsContent = {
        type: "reorder_words",
        correctSentence: "El gato negro duerme en la silla",
        words: ["la", "gato", "duerme", "negro", "silla", "en", "El"],
        translation: "The black cat sleeps on the chair",
        explanation: "Word order",
      };

      const words = extractVocabularyFromExercise(
        "reorder_words",
        content,
        "El gato negro duerme en la silla",
      );
      expect(words).toHaveLength(1);
      expect(words[0].word).toBe("El gato negro duerme en la silla");
      expect(words[0].translation).toBe("The black cat sleeps on the chair");
    });
  });

  describe("free_writing", () => {
    it("returns empty array", () => {
      const content: FreeWritingContent = {
        type: "free_writing",
        prompt: "Write about your day",
        explanation: "Practice",
      };
      const words = extractVocabularyFromExercise(
        "free_writing",
        content,
        "sample",
      );
      expect(words).toHaveLength(0);
    });
  });

  describe("reading_comprehension", () => {
    it("returns empty array", () => {
      const content: ReadingComprehensionContent = {
        type: "reading_comprehension",
        passage: "El parque es muy bonito.",
        questions: [
          {
            type: "multiple_choice",
            prompt: "¿Cómo es el parque?",
            options: ["bonito", "feo"],
            correctAnswer: "bonito",
            explanation: "Adjectives",
          },
        ],
        explanation: "Reading",
      };
      const words = extractVocabularyFromExercise(
        "reading_comprehension",
        content,
        "bonito",
      );
      expect(words).toHaveLength(0);
    });
  });
});
