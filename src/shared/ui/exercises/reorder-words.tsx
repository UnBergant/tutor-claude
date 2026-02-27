"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/utils";
import type { ExerciseFeedback } from "@/shared/types/exercise";
import { Button } from "@/shared/ui/button";

interface ReorderWordsProps {
  /** Shuffled words to reorder */
  words: string[];
  /** English translation hint */
  translation?: string;
  /** Feedback (null while answering) */
  feedback: ExerciseFeedback | null;
  /** Called when student submits their sentence */
  onSubmit: (answer: string) => void;
  /** Disable interaction */
  disabled?: boolean;
}

export function ReorderWords({
  words,
  translation,
  feedback,
  onSubmit,
  disabled,
}: ReorderWordsProps) {
  const [pool, setPool] = useState<string[]>([]);
  const [sentence, setSentence] = useState<string[]>([]);

  // Reset when words change (new exercise)
  useEffect(() => {
    setPool([...words]);
    setSentence([]);
  }, [words]);

  function handlePoolTap(index: number) {
    if (disabled || feedback) return;
    const word = pool[index];
    setPool((prev) => prev.filter((_, i) => i !== index));
    setSentence((prev) => [...prev, word]);
  }

  function handleSentenceTap(index: number) {
    if (disabled || feedback) return;
    const word = sentence[index];
    setSentence((prev) => prev.filter((_, i) => i !== index));
    setPool((prev) => [...prev, word]);
  }

  function handleSubmit() {
    if (sentence.length > 0 && !disabled) {
      onSubmit(sentence.join(" "));
    }
  }

  return (
    <div className="space-y-4">
      {/* Translation hint */}
      {translation && (
        <p className="text-sm text-muted-foreground italic">{translation}</p>
      )}

      {/* Sentence area — placed words */}
      <div
        className={cn(
          "min-h-16 rounded-lg border-2 border-dashed p-3 flex flex-wrap gap-2 items-start transition-colors",
          feedback
            ? feedback.isCorrect
              ? "border-green-300 bg-green-50/50 dark:border-green-700 dark:bg-green-900/10"
              : "border-red-300 bg-red-50/50 dark:border-red-700 dark:bg-red-900/10"
            : "border-muted-foreground/25",
        )}
      >
        {sentence.length === 0 && !feedback && (
          <span className="text-muted-foreground text-sm">
            Tap words below to build the sentence...
          </span>
        )}
        {sentence.map((word, index) => (
          <button
            key={`s-${index}-${word}`}
            type="button"
            onClick={() => handleSentenceTap(index)}
            disabled={disabled || !!feedback}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
              feedback
                ? feedback.isCorrect
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                : "bg-primary text-primary-foreground hover:opacity-80 cursor-pointer",
            )}
          >
            {word}
          </button>
        ))}
      </div>

      {/* Word pool — available chips */}
      <div className="flex flex-wrap gap-2 min-h-10">
        {pool.map((word, index) => (
          <button
            key={`p-${index}-${word}`}
            type="button"
            onClick={() => handlePoolTap(index)}
            disabled={disabled || !!feedback}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-muted hover:bg-muted/80 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {word}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={cn(
            "rounded-lg p-3 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300",
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

      {/* Submit button */}
      {!feedback && (
        <Button
          onClick={handleSubmit}
          disabled={sentence.length === 0 || disabled}
          className="w-full sm:w-auto"
        >
          Check
        </Button>
      )}
    </div>
  );
}
