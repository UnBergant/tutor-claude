"use client";

import { useEffect, useRef } from "react";
import { useChatStore } from "../store";
import type { ChatMessage } from "../types";
import { FlashcardBubble } from "./flashcard-bubble";
import { MessageBubble } from "./message-bubble";
import { QuizBubble, QuizLoadingSkeleton } from "./quiz-bubble";
import { TypingIndicator } from "./typing-indicator";

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

/**
 * Scrollable message area with auto-scroll to bottom.
 * Shows typing indicator during streaming when the last message
 * is still empty (before first token arrives).
 */
export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const isQuizLoading = useChatStore((s) => s.isQuizLoading);

  // Scroll to bottom after every render (component only re-renders when messages change)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  const lastMessage = messages[messages.length - 1];
  const showTyping =
    isStreaming &&
    (!lastMessage ||
      lastMessage.role !== "assistant" ||
      (lastMessage.type === "text" && lastMessage.content === ""));

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="mx-auto flex max-w-2xl flex-col gap-3">
        {messages.map((message) => {
          if (message.type === "flashcard") {
            return <FlashcardBubble key={message.id} message={message} />;
          }
          if (message.type === "quiz") {
            return <QuizBubble key={message.id} message={message} />;
          }
          // Skip rendering empty assistant placeholders — typing indicator covers this
          if (message.content === "" && message.role === "assistant") {
            return null;
          }
          return <MessageBubble key={message.id} message={message} />;
        })}
        {isQuizLoading && <QuizLoadingSkeleton />}
        {showTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
