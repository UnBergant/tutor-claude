import { beforeEach, describe, expect, it } from "vitest";
import { useChatStore } from "./store";

function getState() {
  return useChatStore.getState();
}

describe("useChatStore", () => {
  beforeEach(() => {
    getState().reset();
  });

  describe("initial state", () => {
    it("starts with no session", () => {
      expect(getState().sessionId).toBeNull();
      expect(getState().situationId).toBeNull();
      expect(getState().messages).toEqual([]);
      expect(getState().isStreaming).toBe(false);
      expect(getState().isExtracting).toBe(false);
      expect(getState().error).toBeNull();
    });
  });

  describe("startSession", () => {
    it("creates a session with unique ID", () => {
      getState().startSession(null);
      expect(getState().sessionId).toBeTruthy();
      expect(getState().sessionId).toMatch(/^chat_/);
    });

    it("sets situation ID", () => {
      getState().startSession("restaurant");
      expect(getState().situationId).toBe("restaurant");
    });

    it("adds starter message when provided", () => {
      getState().startSession("restaurant", "¡Hola! ¿Qué desea pedir?");
      expect(getState().messages).toHaveLength(1);
      expect(getState().messages[0].role).toBe("assistant");
      expect(getState().messages[0].content).toBe("¡Hola! ¿Qué desea pedir?");
    });

    it("starts with empty messages when no starter", () => {
      getState().startSession(null);
      expect(getState().messages).toHaveLength(0);
    });

    it("resets previous state on new session", () => {
      getState().startSession(null);
      getState().setError("old error");
      getState().startSession("restaurant");
      expect(getState().error).toBeNull();
    });
  });

  describe("addUserMessage", () => {
    it("adds a user message", () => {
      getState().startSession(null);
      const msg = getState().addUserMessage("Hola, ¿cómo estás?");
      expect(msg.role).toBe("user");
      expect(msg.content).toBe("Hola, ¿cómo estás?");
      expect(getState().messages).toHaveLength(1);
    });

    it("generates unique message IDs", () => {
      getState().startSession(null);
      const msg1 = getState().addUserMessage("First");
      const msg2 = getState().addUserMessage("Second");
      expect(msg1.id).not.toBe(msg2.id);
    });

    it("appends to existing messages", () => {
      getState().startSession(null, "¡Hola!");
      getState().addUserMessage("Hi there");
      expect(getState().messages).toHaveLength(2);
      expect(getState().messages[0].role).toBe("assistant");
      expect(getState().messages[1].role).toBe("user");
    });
  });

  describe("addAssistantMessage", () => {
    it("adds empty assistant message placeholder", () => {
      getState().startSession(null);
      const msg = getState().addAssistantMessage();
      expect(msg.role).toBe("assistant");
      expect(msg.content).toBe("");
    });
  });

  describe("appendToAssistantMessage", () => {
    it("appends text to assistant message", () => {
      getState().startSession(null);
      const msg = getState().addAssistantMessage();
      getState().appendToAssistantMessage(msg.id, "¡Hola");
      getState().appendToAssistantMessage(msg.id, "! ¿Qué tal?");
      expect(getState().messages[0].content).toBe("¡Hola! ¿Qué tal?");
    });

    it("does not modify other messages", () => {
      getState().startSession(null);
      getState().addUserMessage("Hi");
      const assistantMsg = getState().addAssistantMessage();
      getState().appendToAssistantMessage(assistantMsg.id, "Hola");
      expect(getState().messages[0].content).toBe("Hi");
      expect(getState().messages[1].content).toBe("Hola");
    });
  });

  describe("loading states", () => {
    it("sets isStreaming", () => {
      getState().setIsStreaming(true);
      expect(getState().isStreaming).toBe(true);
      getState().setIsStreaming(false);
      expect(getState().isStreaming).toBe(false);
    });

    it("sets isExtracting", () => {
      getState().setIsExtracting(true);
      expect(getState().isExtracting).toBe(true);
    });

    it("sets error", () => {
      getState().setError("Something went wrong");
      expect(getState().error).toBe("Something went wrong");
      getState().setError(null);
      expect(getState().error).toBeNull();
    });
  });

  describe("reset", () => {
    it("resets all state to initial values", () => {
      getState().startSession("restaurant", "¡Hola!");
      getState().addUserMessage("Hi");
      getState().setIsStreaming(true);
      getState().setError("error");

      getState().reset();

      expect(getState().sessionId).toBeNull();
      expect(getState().situationId).toBeNull();
      expect(getState().messages).toEqual([]);
      expect(getState().isStreaming).toBe(false);
      expect(getState().isExtracting).toBe(false);
      expect(getState().error).toBeNull();
    });
  });
});
