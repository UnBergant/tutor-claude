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

  return (
    <div className="space-y-4">
      <p className="text-lg leading-relaxed">{prompt}</p>

      <div className="grid gap-2">
        {options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = index === correctIndex;
          const showResult = feedback !== null;

          return (
            <Button
              key={option}
              variant="outline"
              disabled={disabled || showResult}
              onClick={() => handleSelect(index)}
              className={cn(
                "h-auto min-h-11 px-4 py-3 text-left justify-start text-base font-normal whitespace-normal",
                showResult &&
                  isCorrect &&
                  "border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700",
                showResult &&
                  isSelected &&
                  !isCorrect &&
                  "border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700",
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
    </div>
  );
}
