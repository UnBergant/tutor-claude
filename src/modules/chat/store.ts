import { create } from "zustand";
import type { ChatMessage, FlashcardMessage, TextMessage } from "./types";

interface ChatState {
  /** Current session ID (random, for tracking) */
  sessionId: string | null;
  /** Selected situation ID, or null for free conversation */
  situationId: string | null;
  /** Chat messages (ephemeral — only in memory) */
  messages: ChatMessage[];
  /** Whether the AI is currently streaming a response */
  isStreaming: boolean;
  /** Whether post-session extraction is in progress */
  isExtracting: boolean;
  /** Error message to display */
  error: string | null;

  // Actions
  startSession: (situationId: string | null, starterMessage?: string) => void;
  addUserMessage: (content: string) => TextMessage;
  addAssistantMessage: () => TextMessage;
  appendToAssistantMessage: (messageId: string, text: string) => void;
  addFlashcardMessage: (data: {
    wordId: string;
    word: string;
    prompt: string;
    hint?: string;
  }) => FlashcardMessage;
  updateFlashcardStatus: (
    messageId: string,
    status: "correct" | "incorrect",
    userAnswer: string,
  ) => void;
  setIsStreaming: (v: boolean) => void;
  setIsExtracting: (v: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  sessionId: null as string | null,
  situationId: null as string | null,
  messages: [] as ChatMessage[],
  isStreaming: false,
  isExtracting: false,
  error: null as string | null,
};

let messageCounter = 0;

function generateMessageId(): string {
  messageCounter += 1;
  return `msg_${Date.now()}_${messageCounter}`;
}

function generateSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useChatStore = create<ChatState>((set, get) => ({
  ...initialState,

  startSession: (situationId, starterMessage) => {
    const sessionId = generateSessionId();
    const messages: ChatMessage[] = [];

    if (starterMessage) {
      messages.push({
        type: "text",
        id: generateMessageId(),
        role: "assistant",
        content: starterMessage,
        createdAt: new Date(),
      });
    }

    set({
      ...initialState,
      sessionId,
      situationId,
      messages,
    });
  },

  addUserMessage: (content) => {
    const message: TextMessage = {
      type: "text",
      id: generateMessageId(),
      role: "user",
      content,
      createdAt: new Date(),
    };
    set({ messages: [...get().messages, message] });
    return message;
  },

  addAssistantMessage: () => {
    const message: TextMessage = {
      type: "text",
      id: generateMessageId(),
      role: "assistant",
      content: "",
      createdAt: new Date(),
    };
    set({ messages: [...get().messages, message] });
    return message;
  },

  appendToAssistantMessage: (messageId, text) => {
    const messages = get().messages.map((m) =>
      m.id === messageId && m.type === "text"
        ? { ...m, content: m.content + text }
        : m,
    );
    set({ messages });
  },

  addFlashcardMessage: (data) => {
    const message: FlashcardMessage = {
      type: "flashcard",
      id: generateMessageId(),
      role: "assistant",
      wordId: data.wordId,
      word: data.word,
      prompt: data.prompt,
      hint: data.hint,
      status: "pending",
      createdAt: new Date(),
    };
    set({ messages: [...get().messages, message] });
    return message;
  },

  updateFlashcardStatus: (messageId, status, userAnswer) => {
    const messages = get().messages.map((m) =>
      m.id === messageId && m.type === "flashcard"
        ? { ...m, status, userAnswer }
        : m,
    );
    set({ messages });
  },

  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setIsExtracting: (isExtracting) => set({ isExtracting }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
