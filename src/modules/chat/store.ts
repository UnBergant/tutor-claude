import { create } from "zustand";
import type { ChatMessage } from "./types";

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
  addUserMessage: (content: string) => ChatMessage;
  addAssistantMessage: () => ChatMessage;
  appendToAssistantMessage: (messageId: string, text: string) => void;
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
    const message: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      content,
      createdAt: new Date(),
    };
    set({ messages: [...get().messages, message] });
    return message;
  },

  addAssistantMessage: () => {
    const message: ChatMessage = {
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
      m.id === messageId ? { ...m, content: m.content + text } : m,
    );
    set({ messages });
  },

  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setIsExtracting: (isExtracting) => set({ isExtracting }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
