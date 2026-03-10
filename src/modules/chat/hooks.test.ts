import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTranslationStore } from "./translation-store";
import type { ChatMessage, FlashcardMessage, TextMessage } from "./types";

// Mock the server action
vi.mock("./actions", () => ({
  extractChatData: vi.fn(),
  translateMessage: vi.fn(),
  getFlashcardWord: vi.fn(),
}));

import { translateMessage } from "./actions";
import { shouldInsertFlashcard, translateAssistantMessage } from "./hooks";

const mockTranslateMessage = vi.mocked(translateMessage);

function getTranslationState() {
  return useTranslationStore.getState();
}

describe("translateAssistantMessage", () => {
  beforeEach(() => {
    getTranslationState().reset();
    vi.clearAllMocks();
  });

  it("calls translateMessage and stores result", async () => {
    mockTranslateMessage.mockResolvedValue({
      words: [
        { word: "Hola", translation: "Hello", partOfSpeech: "interjection" },
      ],
    });

    await translateAssistantMessage("msg_1", "Hola!");

    expect(mockTranslateMessage).toHaveBeenCalledWith("Hola!");
    expect(getTranslationState().getTranslation("msg_1", "hola")).toBeDefined();
    expect(
      getTranslationState().getTranslation("msg_1", "hola")?.translation,
    ).toBe("Hello");
  });

  it("sets loading true during translation and false after", async () => {
    let resolveTranslation!: (value: { words: never[] }) => void;
    mockTranslateMessage.mockReturnValue(
      new Promise((resolve) => {
        resolveTranslation = resolve;
      }),
    );

    const promise = translateAssistantMessage("msg_1", "Hola");

    expect(getTranslationState().isLoading("msg_1")).toBe(true);

    resolveTranslation({ words: [] });
    await promise;

    expect(getTranslationState().isLoading("msg_1")).toBe(false);
  });

  it("skips translation if already cached", async () => {
    getTranslationState().setTranslations("msg_1", [
      { word: "Hola", translation: "Hello", partOfSpeech: "interjection" },
    ]);

    await translateAssistantMessage("msg_1", "Hola!");

    expect(mockTranslateMessage).not.toHaveBeenCalled();
  });

  it("clears loading on error", async () => {
    mockTranslateMessage.mockRejectedValue(new Error("API error"));

    await translateAssistantMessage("msg_1", "Hola");

    expect(getTranslationState().isLoading("msg_1")).toBe(false);
  });

  it("does not store translations on error", async () => {
    mockTranslateMessage.mockRejectedValue(new Error("API error"));

    await translateAssistantMessage("msg_1", "Hola");

    expect(
      getTranslationState().getTranslation("msg_1", "hola"),
    ).toBeUndefined();
  });
});

// --- Helpers for shouldInsertFlashcard tests ---

let msgCounter = 0;

function makeTextMessage(
  role: "user" | "assistant",
  content = "test",
): TextMessage {
  msgCounter += 1;
  return {
    id: `msg_${msgCounter}`,
    type: "text",
    role,
    content,
    createdAt: new Date(),
  };
}

function makeFlashcard(
  status: "pending" | "correct" | "incorrect" = "correct",
): FlashcardMessage {
  msgCounter += 1;
  return {
    id: `msg_${msgCounter}`,
    type: "flashcard",
    role: "assistant",
    wordId: "w1",
    word: "hola",
    prompt: "hello",
    status,
    createdAt: new Date(),
  };
}

/** Generate N alternating user/assistant text message pairs */
function makeExchanges(pairs: number): ChatMessage[] {
  const messages: ChatMessage[] = [];
  for (let i = 0; i < pairs; i++) {
    messages.push(makeTextMessage("user"));
    messages.push(makeTextMessage("assistant"));
  }
  return messages;
}

describe("shouldInsertFlashcard", () => {
  beforeEach(() => {
    msgCounter = 0;
  });

  it("returns false when fewer than 4 text messages", () => {
    const messages = [
      makeTextMessage("user"),
      makeTextMessage("assistant"),
      makeTextMessage("user"),
    ];
    expect(shouldInsertFlashcard(messages)).toBe(false);
  });

  it("returns false when a pending flashcard exists", () => {
    const messages: ChatMessage[] = [
      ...makeExchanges(4),
      makeFlashcard("pending"),
    ];
    expect(shouldInsertFlashcard(messages)).toBe(false);
  });

  it("returns true after 6+ text messages with no flashcards", () => {
    // 3 pairs = 6 text messages, no flashcards
    const messages = makeExchanges(3);
    expect(shouldInsertFlashcard(messages)).toBe(true);
  });

  it("returns false when fewer than 6 text messages since last flashcard", () => {
    // 3 pairs (6 text) + completed flashcard + 2 pairs (4 text) = not enough since flashcard
    const messages: ChatMessage[] = [
      ...makeExchanges(3),
      makeFlashcard("correct"),
      ...makeExchanges(2),
    ];
    expect(shouldInsertFlashcard(messages)).toBe(false);
  });

  it("returns true when 6+ text messages since last flashcard", () => {
    // 3 pairs (6 text) + completed flashcard + 3 pairs (6 text)
    const messages: ChatMessage[] = [
      ...makeExchanges(3),
      makeFlashcard("correct"),
      ...makeExchanges(3),
    ];
    expect(shouldInsertFlashcard(messages)).toBe(true);
  });
});

describe("flashcard answer matching", () => {
  // The matching logic used in chat-input.tsx:
  // userInput.trim().toLowerCase() === flashcard.word.toLowerCase()
  function isCorrectAnswer(userInput: string, word: string): boolean {
    return userInput.trim().toLowerCase() === word.toLowerCase();
  }

  it("exact match is correct", () => {
    expect(isCorrectAnswer("hola", "hola")).toBe(true);
  });

  it("case insensitive match is correct", () => {
    expect(isCorrectAnswer("Hola", "hola")).toBe(true);
    expect(isCorrectAnswer("HOLA", "hola")).toBe(true);
  });

  it("extra whitespace is trimmed and matches", () => {
    expect(isCorrectAnswer("  hola  ", "hola")).toBe(true);
    expect(isCorrectAnswer("\thola\n", "hola")).toBe(true);
  });

  it("wrong answer is incorrect", () => {
    expect(isCorrectAnswer("adios", "hola")).toBe(false);
    expect(isCorrectAnswer("", "hola")).toBe(false);
  });
});
