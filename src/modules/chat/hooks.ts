"use client";

import { MessageStream } from "@anthropic-ai/sdk/lib/MessageStream";
import { useCallback, useEffect, useRef } from "react";
import { extractChatData, getFlashcardWord, translateMessage } from "./actions";
import { useChatStore } from "./store";
import { useTranslationStore } from "./translation-store";
import type { ChatMessage } from "./types";

/**
 * Determine if it's time to inject a flashcard into the chat.
 *
 * Rules:
 * - At least 4 text messages in session before first flashcard
 * - No pending flashcard already in messages
 * - At least 6 text messages since the last flashcard (3 user + 3 assistant exchanges)
 */
export function shouldInsertFlashcard(messages: ChatMessage[]): boolean {
  const textMessages = messages.filter((m) => m.type === "text");
  const hasPending = messages.some(
    (m) => m.type === "flashcard" && m.status === "pending",
  );

  if (hasPending || textMessages.length < 4) return false;

  // Find last flashcard position
  const lastFlashcardIndex = messages.findLastIndex(
    (m) => m.type === "flashcard",
  );
  const messagesSinceFlashcard =
    lastFlashcardIndex === -1
      ? textMessages.length
      : messages.slice(lastFlashcardIndex + 1).filter((m) => m.type === "text")
          .length;

  return messagesSinceFlashcard >= 6;
}

/**
 * Fire-and-forget translation of an assistant message.
 * Exported so components can trigger it for starter messages too.
 */
const inflightTranslations = new Set<string>();

export async function translateAssistantMessage(
  messageId: string,
  content: string,
) {
  const store = useTranslationStore.getState();
  if (store.cache[messageId] || inflightTranslations.has(messageId)) return;
  inflightTranslations.add(messageId);
  store.setLoading(messageId, true);
  try {
    const result = await translateMessage(content);
    useTranslationStore.getState().setTranslations(messageId, result.words);
  } catch (error) {
    console.error("[useChat] Translation failed:", error);
  } finally {
    inflightTranslations.delete(messageId);
    useTranslationStore.getState().setLoading(messageId, false);
  }
}

/**
 * Hook orchestrating chat store + fetch + SSE stream consumption.
 *
 * Flow:
 * 1. User calls sendMessage(text)
 * 2. User message added to store
 * 3. POST /api/chat with message history + situationId
 * 4. Response is SSE stream → MessageStream.fromReadableStream()
 * 5. .on("text") appends deltas to assistant message in store
 * 6. On completion, streaming flag cleared
 *
 * Level is read server-side from UserProfile — never sent by client.
 */
export function useChat() {
  const store = useChatStore();
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    const state = useChatStore.getState();
    if (state.isStreaming || state.isExtracting) return;

    state.addUserMessage(text);
    state.setIsStreaming(true);
    state.setError(null);

    // Prepare messages for API (only text messages — exclude flashcards)
    const apiMessages = useChatStore
      .getState()
      .messages.filter((m) => m.type === "text")
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    // Create empty assistant message placeholder
    const assistantMsg = useChatStore.getState().addAssistantMessage();

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          situationId: useChatStore.getState().situationId,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (response.status === 429) {
          throw new Error(
            "Celestia is taking a moment to think... please wait a bit before sending another message.",
          );
        }
        throw new Error(
          errorData?.message || `Chat request failed (${response.status})`,
        );
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      // Consume SSE stream using Anthropic SDK helper
      const stream = MessageStream.fromReadableStream(response.body);

      stream.on("text", (textDelta) => {
        useChatStore
          .getState()
          .appendToAssistantMessage(assistantMsg.id, textDelta);
      });

      stream.on("error", (error) => {
        console.error("[useChat] Stream error:", error);
        useChatStore
          .getState()
          .setError("Stream interrupted. Please try again.");
      });

      await stream.done();

      // Fire-and-forget: translate the completed assistant message
      // TODO: auto-translate + chat requests share 5 req/min limit — consider on-demand translation
      const finalMsg = useChatStore
        .getState()
        .messages.find((m) => m.id === assistantMsg.id);
      if (finalMsg?.type === "text" && finalMsg.content) {
        translateAssistantMessage(finalMsg.id, finalMsg.content);
      }

      // Inject a flashcard if conditions are met (awaited — blocks isStreaming reset)
      try {
        if (shouldInsertFlashcard(useChatStore.getState().messages)) {
          const flashcardWord = await getFlashcardWord();
          if (flashcardWord) {
            useChatStore.getState().addFlashcardMessage({
              wordId: flashcardWord.wordId,
              word: flashcardWord.word,
              prompt: flashcardWord.prompt,
              hint: flashcardWord.hint ?? undefined,
            });
          }
        }
      } catch (error) {
        console.error("[useChat] Flashcard injection failed:", error);
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      console.error("[useChat] Error:", error);
      useChatStore
        .getState()
        .setError((error as Error).message || "Something went wrong");
    } finally {
      useChatStore.getState().setIsStreaming(false);
      abortRef.current = null;
    }
  }, []);

  const endSession = useCallback(async () => {
    const state = useChatStore.getState();
    if (state.isStreaming || state.isExtracting) return;

    const messages = state.messages;

    // Run extraction if there are enough text messages
    const textMessages = messages.filter((m) => m.type === "text");
    if (textMessages.length >= 4) {
      state.setIsExtracting(true);
      try {
        await extractChatData(
          textMessages.map((m) => ({ role: m.role, content: m.content })),
        );
      } catch (error) {
        console.error("[useChat] Extraction failed:", error);
      } finally {
        useChatStore.getState().setIsExtracting(false);
      }
    }

    useChatStore.getState().reset();
    useTranslationStore.getState().reset();
  }, []);

  // Cleanup: abort stream on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const startSession = useCallback(
    (situationId: string | null, starterMessage?: string) => {
      useChatStore.getState().startSession(situationId, starterMessage);

      // Translate the starter message if present
      if (starterMessage) {
        const messages = useChatStore.getState().messages;
        const firstMsg = messages[0];
        if (firstMsg?.type === "text" && firstMsg.role === "assistant") {
          translateAssistantMessage(firstMsg.id, firstMsg.content);
        }
      }
    },
    [],
  );

  return {
    messages: store.messages,
    isStreaming: store.isStreaming,
    isExtracting: store.isExtracting,
    error: store.error,
    sessionId: store.sessionId,
    situationId: store.situationId,
    sendMessage,
    startSession,
    endSession,
    reset: store.reset,
  };
}
