"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/utils";
import type { ExerciseFeedback } from "@/shared/types/exercise";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

interface GapFillProps {
  /** Text before the blank */
  before: string;
  /** Text after the blank */
  after: string;
  /** Spanish base form shown inline next to blank (e.g., infinitive, singular) */
  hint?: string;
  /** English translation shown below the sentence */
  translation?: string;
  /** Feedback (null while answering) */
  feedback: ExerciseFeedback | null;
  /** Called when student submits their answer */
  onSubmit: (answer: string) => void;
  /** Disable input (e.g., while checking) */
  disabled?: boolean;
  /** Submit button label (default: "Check") */
  submitLabel?: string;
}

export function GapFill({
  before,
  after,
  hint,
  translation,
  feedback,
  onSubmit,
  disabled,
  submitLabel = "Check",
}: GapFillProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit() {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSubmit(trimmed);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="space-y-4">
      {/* Sentence with inline blank */}
      <p className="text-lg leading-relaxed">
        {before}
        {feedback ? (
          <span
            className={cn(
              "inline-block mx-1 px-2 py-0.5 rounded font-semibold",
              feedback.isCorrect
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
            )}
          >
            {feedback.isCorrect ? value : feedback.correctAnswer}
          </span>
        ) : (
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="inline-block w-40 mx-1 text-center"
            placeholder="..."
            autoComplete="off"
            spellCheck={false}
          />
        )}
        {hint && (
          <span className="mx-1 text-muted-foreground italic">({hint})</span>
        )}
        {after}
      </p>

      {/* English translation */}
      {translation && (
        <p className="text-sm text-muted-foreground italic">{translation}</p>
      )}

      {/* Feedback */}
      {feedback && (
        <div
          className={cn(
            "rounded-lg p-3 text-sm",
            feedback.isCorrect
              ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
              : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300",
          )}
        >
          {!feedback.isCorrect && (
            <p className="font-medium mb-1">
              Correct answer: {feedback.correctAnswer}
            </p>
          )}
          <p>{feedback.explanation}</p>
        </div>
      )}

      {/* Submit button (hidden after feedback) */}
      {!feedback && (
        <Button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="w-full sm:w-auto"
        >
          {submitLabel}
        </Button>
      )}
    </div>
  );
}
