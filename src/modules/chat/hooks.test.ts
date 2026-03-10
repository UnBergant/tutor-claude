import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTranslationStore } from "./translation-store";

// Mock the server action
vi.mock("./actions", () => ({
  extractChatData: vi.fn(),
  translateMessage: vi.fn(),
}));

import { translateMessage } from "./actions";
import { translateAssistantMessage } from "./hooks";

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
