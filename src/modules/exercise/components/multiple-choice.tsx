"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import type { ExerciseFeedback } from "@/shared/types/exercise";
import { Button } from "@/shared/ui/button";

interface MultipleChoiceProps {
  /** The question or sentence stem */
  prompt: string;
  /** Four options */
  options: string[];
  /** Feedback (null while answering) */
  feedback: ExerciseFeedback | null;
  /** Index of the correct option (shown after feedback) */
  correctIndex: number;
  /** Called when student selects an option */
  onSubmit: (answer: string, selectedIndex: number) => void;
  /** Disable buttons */
  disabled?: boolean;
}

export function MultipleChoice({
  prompt,
  options,
  feedback,
  correctIndex,
  onSubmit,
  disabled,
}: MultipleChoiceProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  function handleSelect(index: number) {
    if (disabled || feedback) return;
    setSelectedIndex(index);
    onSubmit(options[index], index);
  }

  // In lesson mode, correctIndex may be -1 (hidden from client).
  // After feedback, find the correct option by matching feedback.correctAnswer.
  const resolvedCorrectIndex =
    correctIndex >= 0
      ? correctIndex
      : feedback
        ? options.indexOf(feedback.correctAnswer)
        : -1;

  return (
    <div className="space-y-4">
      <p className="text-lg leading-relaxed">{prompt}</p>

      <div className="grid gap-2">
        {options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = index === resolvedCorrectIndex;
          const showResult = feedback !== null;

          return (
            <Button
              key={`${index}-${option}`}
              variant="outline"
              disabled={disabled || showResult}
              onClick={() => handleSelect(index)}
              className={cn(
                "h-auto min-h-11 px-4 py-3 text-left justify-start text-base font-normal whitespace-normal transition-all duration-300",
                showResult &&
                  isCorrect &&
                  "border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700 animate-pulse-once",
                showResult &&
                  isSelected &&
                  !isCorrect &&
                  "border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700 animate-shake",
              )}
            >
              <span className="mr-2 font-medium text-muted-foreground">
                {String.fromCharCode(65 + index)}.
              </span>
              {option}
            </Button>
          );
        })}
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
    </div>
  );
}
