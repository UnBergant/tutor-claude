"use client";

import { MessageStream } from "@anthropic-ai/sdk/lib/MessageStream";
import { useCallback, useEffect, useRef } from "react";
import { extractChatData } from "./actions";
import { useChatStore } from "./store";

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

    // Prepare messages for API (exclude IDs and dates — only role + content)
    const apiMessages = useChatStore.getState().messages.map((m) => ({
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

    // Run extraction if there are enough messages
    if (messages.length >= 4) {
      state.setIsExtracting(true);
      try {
        await extractChatData(
          messages.map((m) => ({ role: m.role, content: m.content })),
        );
      } catch (error) {
        console.error("[useChat] Extraction failed:", error);
      } finally {
        useChatStore.getState().setIsExtracting(false);
      }
    }

    useChatStore.getState().reset();
  }, []);

  // Cleanup: abort stream on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    messages: store.messages,
    isStreaming: store.isStreaming,
    isExtracting: store.isExtracting,
    error: store.error,
    sessionId: store.sessionId,
    situationId: store.situationId,
    sendMessage,
    startSession: store.startSession,
    endSession,
    reset: store.reset,
  };
}
