"use client";

import React, { useMemo } from "react";
import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import { cn } from "@/shared/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { useTranslationStore } from "../translation-store";
import type { ChatMessage } from "../types";

// ---------------------------------------------------------------------------
// Word tokenization
// ---------------------------------------------------------------------------

interface TextToken {
  text: string;
  isWord: boolean;
}

const wordSegmenter = new Intl.Segmenter("es", { granularity: "word" });

function tokenizeWords(text: string): TextToken[] {
  const segments = wordSegmenter.segment(text);
  return Array.from(segments).map((seg) => ({
    text: seg.segment,
    isWord: seg.isWordLike ?? false,
  }));
}

// ---------------------------------------------------------------------------
// WordWithTranslation — single clickable word with popover
// ---------------------------------------------------------------------------

function WordWithTranslation({
  word,
  messageId,
}: {
  word: string;
  messageId: string;
}) {
  const translation = useTranslationStore((s) =>
    s.getTranslation(messageId, word),
  );
  const loading = useTranslationStore((s) => s.isLoading(messageId));

  if (!translation && !loading) {
    return <span>{word}</span>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="cursor-pointer rounded-sm transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {word}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-64 p-3" side="top" align="center">
        {loading ? (
          <p className="text-muted-foreground text-xs">Loading...</p>
        ) : translation ? (
          <div className="space-y-1">
            <p className="font-semibold text-sm">{translation.translation}</p>
            <p className="text-muted-foreground text-xs">
              {translation.partOfSpeech}
            </p>
            {translation.form && (
              <p className="text-muted-foreground text-xs italic">
                {translation.form}
              </p>
            )}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// TranslatableText — tokenizes a string and renders each word as clickable
// ---------------------------------------------------------------------------

function TranslatableText({
  text,
  messageId,
}: {
  text: string;
  messageId: string;
}) {
  const tokens = tokenizeWords(text);
  return (
    <>
      {tokens.map((token, i) =>
        token.isWord ? (
          <WordWithTranslation
            key={`${i}-${token.text}`}
            word={token.text}
            messageId={messageId}
          />
        ) : (
          <span key={`${i}-${token.text}`}>{token.text}</span>
        ),
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively wrap string children with TranslatableText. */
function wrapTextChildren(
  children: React.ReactNode,
  messageId: string,
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === "string") {
      return <TranslatableText text={child} messageId={messageId} />;
    }
    if (
      React.isValidElement<{ children?: React.ReactNode }>(child) &&
      child.props.children
    ) {
      return React.cloneElement(
        child,
        {},
        wrapTextChildren(child.props.children, messageId),
      );
    }
    return child;
  });
}

// ---------------------------------------------------------------------------
// MessageBubble
// ---------------------------------------------------------------------------

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
          <AssistantContent content={message.content} messageId={message.id} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AssistantContent
// ---------------------------------------------------------------------------

/**
 * Split content into segments: corrections (styled inline) vs markdown text.
 * Each markdown segment is rendered via react-markdown; corrections are
 * rendered as styled spans. No rehype-raw needed — no XSS surface.
 */
function AssistantContent({
  content,
  messageId,
}: {
  content: string;
  messageId: string;
}) {
  const translatableComponents: Components = useMemo(
    () => ({
      p: ({ children }) => (
        <p className="mb-1.5 last:mb-0">
          {wrapTextChildren(children, messageId)}
        </p>
      ),
      strong: ({ children }) => (
        <span className="font-semibold">
          {wrapTextChildren(children, messageId)}
        </span>
      ),
      em: ({ children }) => (
        <em className="opacity-80">{wrapTextChildren(children, messageId)}</em>
      ),
      h1: ({ children }) => (
        <p className="mb-1 mt-1.5 font-semibold">
          {wrapTextChildren(children, messageId)}
        </p>
      ),
      h2: ({ children }) => (
        <p className="mb-1 mt-1.5 font-semibold">
          {wrapTextChildren(children, messageId)}
        </p>
      ),
      h3: ({ children }) => (
        <p className="mb-1 mt-1.5 font-semibold">
          {wrapTextChildren(children, messageId)}
        </p>
      ),
      ul: ({ children }) => (
        <ul className="my-1 list-disc pl-5 space-y-0.5">{children}</ul>
      ),
      ol: ({ children }) => (
        <ol className="my-1 list-decimal pl-5 space-y-0.5">{children}</ol>
      ),
      li: ({ children }) => (
        <li className="leading-relaxed">
          {wrapTextChildren(children, messageId)}
        </li>
      ),
    }),
    [messageId],
  );

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
          <Markdown key={key} components={translatableComponents}>
            {segment}
          </Markdown>
        );
      })}
    </div>
  );
}
