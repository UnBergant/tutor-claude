"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/utils";
import type { ExerciseFeedback } from "@/shared/types/exercise";
import { Button } from "@/shared/ui/button";

interface FreeWritingProps {
  /** Writing task prompt (in English) */
  writingPrompt: string;
  /** Feedback (null while answering) */
  feedback: ExerciseFeedback | null;
  /** Called when student submits their writing */
  onSubmit: (answer: string) => void;
  /** Disable interaction */
  disabled?: boolean;
}

const MIN_CHARS = 10;

export function FreeWriting({
  writingPrompt,
  feedback,
  onSubmit,
  disabled,
}: FreeWritingProps) {
  const [value, setValue] = useState("");

  // Reset when prompt changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on exercise identity change
  useEffect(() => {
    setValue("");
  }, [writingPrompt]);

  function handleSubmit() {
    const trimmed = value.trim();
    if (trimmed.length >= MIN_CHARS && !disabled) {
      onSubmit(trimmed);
    }
  }

  return (
    <div className="space-y-4">
      {/* Writing prompt */}
      <div className="rounded-lg bg-muted/50 p-4">
        <p className="text-base leading-relaxed">{writingPrompt}</p>
      </div>

      {/* Textarea */}
      {!feedback ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          rows={4}
          className={cn(
            "w-full rounded-lg border border-input bg-background px-4 py-3 text-base",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "resize-y min-h-[100px]",
          )}
          placeholder="Write your answer in Spanish..."
          autoComplete="off"
          spellCheck={false}
        />
      ) : (
        <div className="rounded-lg border border-input bg-muted/30 px-4 py-3 text-base">
          {value}
        </div>
      )}

      {/* Character count */}
      {!feedback && (
        <p className="text-xs text-muted-foreground">
          {value.length} characters
          {value.length < MIN_CHARS && ` (minimum ${MIN_CHARS})`}
        </p>
      )}

      {/* Feedback */}
      {feedback && (
        <div
          className={cn(
            "rounded-lg p-4 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-3",
            feedback.isCorrect
              ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
              : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300",
          )}
        >
          {feedback.explanation.split("\n").map((line) => {
            if (!line.trim()) return null;
            // Lines containing → are corrections (e.g. "habla" → "hablo": explanation)
            if (line.includes("→")) {
              return (
                <p key={line} className="font-mono text-xs">
                  {line}
                </p>
              );
            }
            return <p key={line}>{line}</p>;
          })}
          {/* Sample answer from correctAnswer field (not parsed from explanation) */}
          {!feedback.isCorrect && feedback.correctAnswer && (
            <div className="pt-2 border-t border-current/10">
              <p className="font-medium text-xs uppercase tracking-wide opacity-70 mb-1">
                Sample answer
              </p>
              <p className="italic">{feedback.correctAnswer}</p>
            </div>
          )}
        </div>
      )}

      {/* Submit button */}
      {!feedback && (
        <Button
          onClick={handleSubmit}
          disabled={value.trim().length < MIN_CHARS || disabled}
          className="w-full sm:w-auto"
        >
          Submit
        </Button>
      )}
    </div>
  );
}
