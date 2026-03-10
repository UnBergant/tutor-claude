import { beforeEach, describe, expect, it } from "vitest";
import { useTranslationStore } from "./translation-store";
import type { WordTranslation } from "./types";

function getState() {
  return useTranslationStore.getState();
}

const sampleWords: WordTranslation[] = [
  { word: "Hola", translation: "Hello", partOfSpeech: "interjection" },
  {
    word: "estoy",
    translation: "I am",
    partOfSpeech: "verb",
    form: "presente, 1a persona singular",
  },
  { word: "bien", translation: "well", partOfSpeech: "adverb" },
];

describe("useTranslationStore", () => {
  beforeEach(() => {
    getState().reset();
  });

  describe("initial state", () => {
    it("starts with empty cache and loading", () => {
      expect(getState().cache).toEqual({});
      expect(getState().loading).toEqual({});
    });
  });

  describe("setTranslations", () => {
    it("stores translations keyed by messageId", () => {
      getState().setTranslations("msg_1", sampleWords);
      expect(getState().cache).toHaveProperty("msg_1");
    });

    it("indexes words by normalized (lowercase) key", () => {
      getState().setTranslations("msg_1", sampleWords);
      const msgCache = getState().cache.msg_1;
      expect(msgCache).toHaveProperty("hola");
      expect(msgCache).toHaveProperty("estoy");
      expect(msgCache).toHaveProperty("bien");
    });

    it("preserves original word casing in the value", () => {
      getState().setTranslations("msg_1", sampleWords);
      const entry = getState().cache.msg_1.hola;
      expect(entry.word).toBe("Hola");
      expect(entry.translation).toBe("Hello");
    });

    it("stores translations for multiple messages independently", () => {
      const otherWords: WordTranslation[] = [
        { word: "Adiós", translation: "Goodbye", partOfSpeech: "interjection" },
      ];
      getState().setTranslations("msg_1", sampleWords);
      getState().setTranslations("msg_2", otherWords);

      expect(Object.keys(getState().cache)).toHaveLength(2);
      expect(getState().cache.msg_1).toHaveProperty("hola");
      expect(getState().cache.msg_2).toHaveProperty("adiós");
    });

    it("overwrites translations for the same messageId", () => {
      getState().setTranslations("msg_1", sampleWords);
      const newWords: WordTranslation[] = [
        { word: "Gracias", translation: "Thank you", partOfSpeech: "noun" },
      ];
      getState().setTranslations("msg_1", newWords);

      const msgCache = getState().cache.msg_1;
      expect(msgCache).toHaveProperty("gracias");
      expect(msgCache).not.toHaveProperty("hola");
    });
  });

  describe("getTranslation", () => {
    it("returns translation for exact word match", () => {
      getState().setTranslations("msg_1", sampleWords);
      const result = getState().getTranslation("msg_1", "hola");
      expect(result).toBeDefined();
      expect(result?.translation).toBe("Hello");
    });

    it("normalizes word lookup (case-insensitive)", () => {
      getState().setTranslations("msg_1", sampleWords);
      const result = getState().getTranslation("msg_1", "HOLA");
      expect(result).toBeDefined();
      expect(result?.translation).toBe("Hello");
    });

    it("trims whitespace in lookup", () => {
      getState().setTranslations("msg_1", sampleWords);
      const result = getState().getTranslation("msg_1", "  hola  ");
      expect(result).toBeDefined();
      expect(result?.translation).toBe("Hello");
    });

    it("returns undefined for unknown word", () => {
      getState().setTranslations("msg_1", sampleWords);
      const result = getState().getTranslation("msg_1", "desconocido");
      expect(result).toBeUndefined();
    });

    it("returns undefined for unknown messageId", () => {
      getState().setTranslations("msg_1", sampleWords);
      const result = getState().getTranslation("msg_999", "hola");
      expect(result).toBeUndefined();
    });

    it("includes optional form field for verbs", () => {
      getState().setTranslations("msg_1", sampleWords);
      const result = getState().getTranslation("msg_1", "estoy");
      expect(result?.form).toBe("presente, 1a persona singular");
    });

    it("returns undefined form for non-verbs", () => {
      getState().setTranslations("msg_1", sampleWords);
      const result = getState().getTranslation("msg_1", "bien");
      expect(result?.form).toBeUndefined();
    });
  });

  describe("loading state", () => {
    it("defaults to not loading for unknown messageId", () => {
      expect(getState().isLoading("msg_unknown")).toBe(false);
    });

    it("sets loading state per message", () => {
      getState().setLoading("msg_1", true);
      expect(getState().isLoading("msg_1")).toBe(true);
      expect(getState().isLoading("msg_2")).toBe(false);
    });

    it("clears loading state", () => {
      getState().setLoading("msg_1", true);
      getState().setLoading("msg_1", false);
      expect(getState().isLoading("msg_1")).toBe(false);
    });

    it("tracks loading for multiple messages independently", () => {
      getState().setLoading("msg_1", true);
      getState().setLoading("msg_2", true);
      getState().setLoading("msg_1", false);

      expect(getState().isLoading("msg_1")).toBe(false);
      expect(getState().isLoading("msg_2")).toBe(true);
    });
  });

  describe("reset", () => {
    it("clears all cache and loading state", () => {
      getState().setTranslations("msg_1", sampleWords);
      getState().setLoading("msg_1", true);

      getState().reset();

      expect(getState().cache).toEqual({});
      expect(getState().loading).toEqual({});
      expect(getState().isLoading("msg_1")).toBe(false);
      expect(getState().getTranslation("msg_1", "hola")).toBeUndefined();
    });
  });
});
