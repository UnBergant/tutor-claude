"use client";

import { X } from "lucide-react";
import { useChat } from "../hooks";
import { useChatStore } from "../store";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import { SituationPicker } from "./situation-picker";

interface ChatContainerProps {
  level: string;
}

/**
 * Top-level chat client component.
 *
 * Two states:
 * 1. No session → show situation picker
 * 2. Active session → show message list + input
 */
export function ChatContainer({ level }: ChatContainerProps) {
  const {
    messages,
    isStreaming,
    isExtracting,
    error,
    sessionId,
    sendMessage,
    startSession,
    endSession,
  } = useChat();

  // No active session → show situation picker
  if (!sessionId) {
    return <SituationPicker onSelect={startSession} level={level} />;
  }

  return (
    <div className="flex h-full flex-col">
      <ChatHeader onEndChat={endSession} isExtracting={isExtracting} />
      <MessageList messages={messages} isStreaming={isStreaming} />
      {error && (
        <div className="bg-destructive/10 text-destructive flex items-center justify-center gap-2 px-4 py-2 text-sm">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => useChatStore.getState().setError(null)}
            className="text-destructive/60 hover:text-destructive"
            aria-label="Dismiss error"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
      <ChatInput onSend={sendMessage} disabled={isStreaming || isExtracting} />
    </div>
  );
}

function ChatHeader({
  onEndChat,
  isExtracting,
}: {
  onEndChat: () => void;
  isExtracting: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-3">
      <div>
        <h2 className="text-sm font-semibold">Chat with Celestia</h2>
        <p className="text-muted-foreground text-xs">
          Practice conversational Spanish
        </p>
      </div>
      <button
        type="button"
        onClick={onEndChat}
        disabled={isExtracting}
        className="text-muted-foreground hover:text-foreground text-sm transition-colors disabled:opacity-50"
      >
        {isExtracting ? "Saving..." : "End Chat"}
      </button>
    </div>
  );
}
