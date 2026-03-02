"use client";

import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import { cn } from "@/shared/lib/utils";
import type { ChatMessage } from "../types";

/** Chat-optimized markdown component overrides — compact, conversational. */
const chatComponents: Components = {
  p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
  strong: ({ children }) => <span className="font-semibold">{children}</span>,
  em: ({ children }) => <em className="opacity-80">{children}</em>,
  // Suppress headers down to inline semibold
  h1: ({ children }) => <p className="mb-1 mt-1.5 font-semibold">{children}</p>,
  h2: ({ children }) => <p className="mb-1 mt-1.5 font-semibold">{children}</p>,
  h3: ({ children }) => <p className="mb-1 mt-1.5 font-semibold">{children}</p>,
  // Compact lists
  ul: ({ children }) => (
    <ul className="my-1 list-disc pl-5 space-y-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-1 list-decimal pl-5 space-y-0.5">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
};

interface MessageBubbleProps {
  message: ChatMessage;
}

/**
 * Renders a single chat message with role-appropriate styling.
 *
 * User messages: right-aligned, primary color.
 * Assistant messages: left-aligned, muted background, renders markdown
 * and highlights inline corrections [correction: ...].
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex animate-fade-in",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed text-pretty sm:max-w-[75%]",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <AssistantContent content={message.content} />
        )}
      </div>
    </div>
  );
}

/**
 * Split content into segments: corrections (styled inline) vs markdown text.
 * Each markdown segment is rendered via react-markdown; corrections are
 * rendered as styled spans. No rehype-raw needed — no XSS surface.
 */
function AssistantContent({ content }: { content: string }) {
  if (!content) return null;

  // Split on [correction:...] keeping the delimiter.
  // Square brackets don't conflict with markdown emphasis (* / **).
  const segments = content.split(/(\[correction:[^\]]+\])/g);

  return (
    <div className="chat-markdown">
      {segments.map((segment, i) => {
        const key = `${i}-${segment.slice(0, 20)}`;

        if (segment.startsWith("[correction:")) {
          return (
            <span key={key} className="text-warning mt-1 block text-xs italic">
              {segment.slice(1, -1)}
            </span>
          );
        }

        if (!segment.trim()) return null;

        return (
          <Markdown key={key} components={chatComponents}>
            {segment}
          </Markdown>
        );
      })}
    </div>
  );
}
