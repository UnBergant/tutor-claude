"use client";

import { cn } from "@/shared/lib/utils";
import type { FlashcardMessage } from "../types";

// ---------------------------------------------------------------------------
// FlashcardBubble — renders an inline vocabulary quiz card in the chat
// ---------------------------------------------------------------------------

/** Replace all whole-word occurrences of `word` in `text` with "___" (case-insensitive). */
function redactWord(text: string, word: string): string {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${escaped}\\b`, "gi");
  return text.replace(pattern, "___");
}

interface FlashcardBubbleProps {
  message: FlashcardMessage;
}

/**
 * Renders a flashcard quiz element inside the chat stream.
 *
 * Left-aligned (assistant side) but visually distinct from text bubbles —
 * uses a bordered card style with status-dependent accents.
 */
export function FlashcardBubble({ message }: FlashcardBubbleProps) {
  const { status, prompt, hint, word, userAnswer } = message;

  return (
    <div className="flex animate-fade-in justify-start">
      <div
        className={cn(
          "max-w-[85%] rounded-2xl border px-4 py-3 text-sm sm:max-w-[75%]",
          status === "correct" && "border-green-500/50 bg-green-500/10",
          status === "incorrect" && "border-amber-500/50 bg-amber-500/10",
          status === "pending" && "border-border bg-card animate-pulse-border",
        )}
      >
        {/* Header */}
        <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span aria-hidden="true">{"📝"}</span>
          <span className="font-medium">Vocabulary Check</span>
        </div>

        {/* Prompt word */}
        <p className="text-base font-semibold leading-snug">{prompt}</p>

        {/* Optional hint — redact the target word so it doesn't give away the answer */}
        {hint && (
          <p className="mt-1 text-xs text-muted-foreground italic">
            {redactWord(hint, word)}
          </p>
        )}

        {/* Status-dependent footer */}
        <div className="mt-2.5">
          {status === "pending" && <PendingFooter />}
          {status === "correct" && (
            <CorrectFooter answer={userAnswer} word={word} />
          )}
          {status === "incorrect" && (
            <IncorrectFooter answer={userAnswer} word={word} />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Footer sub-components
// ---------------------------------------------------------------------------

function PendingFooter() {
  return (
    <p className="text-xs text-muted-foreground">
      Type the Spanish translation...
    </p>
  );
}

function CorrectFooter({
  answer,
  word,
}: {
  answer: string | undefined;
  word: string;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-green-600">{"✓ "}Correct!</p>
      {answer && (
        <p className="text-xs text-green-700">
          {answer} — {word}
        </p>
      )}
    </div>
  );
}

function IncorrectFooter({
  answer,
  word,
}: {
  answer: string | undefined;
  word: string;
}) {
  return (
    <div className="space-y-0.5">
      {answer && (
        <p className="text-xs text-muted-foreground line-through">{answer}</p>
      )}
      <p className="text-xs font-medium text-amber-600">
        The answer is: <span className="font-semibold">{word}</span>
      </p>
    </div>
  );
}
