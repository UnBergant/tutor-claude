import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatExtractionResult } from "./types";

// Mock Prisma
const mockUpsert = vi.fn().mockResolvedValue({});
const mockCreate = vi.fn().mockResolvedValue({});
const mockTransaction = vi.fn().mockResolvedValue([]);

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    vocabularyWord: { upsert: (...args: unknown[]) => mockUpsert(...args) },
    userInterest: { upsert: (...args: unknown[]) => mockUpsert(...args) },
    mistakeEntry: { create: (...args: unknown[]) => mockCreate(...args) },
    $transaction: (ops: unknown[]) => mockTransaction(ops),
  },
}));

describe("saveChatExtractionData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates upsert operations for vocabulary, interests, and mistakes", async () => {
    const { saveChatExtractionData } = await import("./chat-helper");

    const data: ChatExtractionResult = {
      vocabulary: [
        {
          word: "la cuenta",
          translation: "the bill",
          context: "¿Me trae la cuenta?",
        },
      ],
      interests: [{ topic: "food", confidence: 80 }],
      mistakes: [{ category: "GRAMMAR", pattern: "ser/estar confusion" }],
    };

    await saveChatExtractionData("user-1", data);

    // Should call $transaction with 3 operations (1 vocab + 1 interest + 1 mistake)
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    const ops = mockTransaction.mock.calls[0][0];
    expect(ops).toHaveLength(3);
  });

  it("skips transaction when extraction data is empty", async () => {
    const { saveChatExtractionData } = await import("./chat-helper");

    const data: ChatExtractionResult = {
      vocabulary: [],
      interests: [],
      mistakes: [],
    };

    await saveChatExtractionData("user-1", data);

    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("handles multiple vocabulary items", async () => {
    const { saveChatExtractionData } = await import("./chat-helper");

    const data: ChatExtractionResult = {
      vocabulary: [
        { word: "hola", translation: "hello", context: "¡Hola!" },
        { word: "adiós", translation: "goodbye", context: "¡Adiós!" },
        {
          word: "gracias",
          translation: "thank you",
          context: "Muchas gracias",
        },
      ],
      interests: [],
      mistakes: [],
    };

    await saveChatExtractionData("user-1", data);

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    const ops = mockTransaction.mock.calls[0][0];
    expect(ops).toHaveLength(3);
  });

  it("does not throw when transaction fails", async () => {
    const { saveChatExtractionData } = await import("./chat-helper");

    mockTransaction.mockRejectedValueOnce(new Error("DB error"));

    const data: ChatExtractionResult = {
      vocabulary: [{ word: "error", translation: "error", context: "test" }],
      interests: [],
      mistakes: [],
    };

    // Should not throw
    await expect(
      saveChatExtractionData("user-1", data),
    ).resolves.toBeUndefined();
  });
});
