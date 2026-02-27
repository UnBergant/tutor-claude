"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/utils";
import type { ExerciseFeedback } from "@/shared/types/exercise";
import { Button } from "@/shared/ui/button";

interface MatchPairsProps {
  /** Left column items (original order) */
  leftItems: string[];
  /** Right column items (shuffled) */
  rightItems: string[];
  /** Feedback (null while answering) */
  feedback: ExerciseFeedback | null;
  /** Called when student submits their matches */
  onSubmit: (answer: string) => void;
  /** Disable interaction */
  disabled?: boolean;
}

const PAIR_COLORS = [
  "bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300",
  "bg-purple-100 border-purple-400 text-purple-800 dark:bg-purple-900/30 dark:border-purple-600 dark:text-purple-300",
  "bg-amber-100 border-amber-400 text-amber-800 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-300",
  "bg-teal-100 border-teal-400 text-teal-800 dark:bg-teal-900/30 dark:border-teal-600 dark:text-teal-300",
  "bg-pink-100 border-pink-400 text-pink-800 dark:bg-pink-900/30 dark:border-pink-600 dark:text-pink-300",
];

/** Parse JSON pairs into readable "left → right" strings, fallback to raw text */
function formatCorrectPairs(correctAnswer: string): string[] {
  try {
    const pairs = JSON.parse(correctAnswer) as {
      left: string;
      right: string;
    }[];
    return pairs.map((p) => `${p.left} → ${p.right}`);
  } catch {
    return [correctAnswer];
  }
}

export function MatchPairs({
  leftItems,
  rightItems,
  feedback,
  onSubmit,
  disabled,
}: MatchPairsProps) {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  // Each matched pair is stored as { leftIdx, rightIdx }
  const [matchedPairs, setMatchedPairs] = useState<
    { leftIdx: number; rightIdx: number }[]
  >([]);

  const matchedLeftSet = new Set(matchedPairs.map((p) => p.leftIdx));
  const matchedRightSet = new Set(matchedPairs.map((p) => p.rightIdx));

  // Reset when items change
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on exercise identity change
  useEffect(() => {
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatchedPairs([]);
  }, [leftItems, rightItems]);

  function getColorIndex(leftIdx: number): number {
    const pairIndex = matchedPairs.findIndex((p) => p.leftIdx === leftIdx);
    return pairIndex >= 0 ? pairIndex % PAIR_COLORS.length : -1;
  }

  function getColorIndexForRight(rightIdx: number): number {
    const pair = matchedPairs.find((p) => p.rightIdx === rightIdx);
    if (!pair) return -1;
    return getColorIndex(pair.leftIdx);
  }

  function handleLeftTap(index: number) {
    if (disabled || feedback) return;

    // If already matched, undo the match
    if (matchedLeftSet.has(index)) {
      setMatchedPairs((prev) => prev.filter((p) => p.leftIdx !== index));
      return;
    }

    setSelectedLeft(index);

    // If right is also selected, create a match
    if (selectedRight !== null && !matchedRightSet.has(selectedRight)) {
      setMatchedPairs((prev) => [
        ...prev,
        { leftIdx: index, rightIdx: selectedRight },
      ]);
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  }

  function handleRightTap(index: number) {
    if (disabled || feedback) return;

    // If already matched, undo the match
    if (matchedRightSet.has(index)) {
      setMatchedPairs((prev) => prev.filter((p) => p.rightIdx !== index));
      return;
    }

    setSelectedRight(index);

    // If left is also selected, create a match
    if (selectedLeft !== null && !matchedLeftSet.has(selectedLeft)) {
      setMatchedPairs((prev) => [
        ...prev,
        { leftIdx: selectedLeft, rightIdx: index },
      ]);
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  }

  function handleSubmit() {
    if (matchedPairs.length !== leftItems.length || disabled) return;

    // Build pairs sorted by left item for deterministic comparison
    const pairs = matchedPairs
      .map((p) => ({
        left: leftItems[p.leftIdx],
        right: rightItems[p.rightIdx],
      }))
      .sort((a, b) => a.left.localeCompare(b.left));

    onSubmit(JSON.stringify(pairs));
  }

  const allMatched = matchedPairs.length === leftItems.length;

  return (
    <div className="space-y-4">
      {/* Two columns */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left column */}
        <div className="space-y-2">
          {leftItems.map((item, index) => {
            const isMatched = matchedLeftSet.has(index);
            const isSelected = selectedLeft === index;
            const colorIdx = getColorIndex(index);

            return (
              <button
                key={`l-${index}-${item}`}
                type="button"
                onClick={() => handleLeftTap(index)}
                disabled={disabled || !!feedback}
                className={cn(
                  "w-full px-3 py-2.5 rounded-lg border-2 text-sm font-medium text-left transition-all duration-200",
                  isMatched && colorIdx >= 0
                    ? PAIR_COLORS[colorIdx]
                    : isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border hover:border-primary/50 cursor-pointer",
                  feedback?.isCorrect &&
                    "border-green-400 bg-green-50 dark:bg-green-900/20",
                  feedback &&
                    !feedback.isCorrect &&
                    "border-red-400 bg-red-50 dark:bg-red-900/20",
                  (disabled || feedback) && "cursor-default",
                )}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          {rightItems.map((item, index) => {
            const isMatched = matchedRightSet.has(index);
            const isSelected = selectedRight === index;
            const colorIdx = getColorIndexForRight(index);

            return (
              <button
                key={`r-${index}-${item}`}
                type="button"
                onClick={() => handleRightTap(index)}
                disabled={disabled || !!feedback}
                className={cn(
                  "w-full px-3 py-2.5 rounded-lg border-2 text-sm font-medium text-left transition-all duration-200",
                  isMatched && colorIdx >= 0
                    ? PAIR_COLORS[colorIdx]
                    : isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border hover:border-primary/50 cursor-pointer",
                  feedback?.isCorrect &&
                    "border-green-400 bg-green-50 dark:bg-green-900/20",
                  feedback &&
                    !feedback.isCorrect &&
                    "border-red-400 bg-red-50 dark:bg-red-900/20",
                  (disabled || feedback) && "cursor-default",
                )}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Match count indicator */}
      {!feedback && (
        <p className="text-sm text-muted-foreground text-center">
          {matchedPairs.length} / {leftItems.length} matched
        </p>
      )}

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
            <div className="mb-2">
              <p className="font-medium mb-1">Correct pairs:</p>
              <ul className="list-none space-y-0.5">
                {formatCorrectPairs(feedback.correctAnswer).map((pair) => (
                  <li key={pair} className="font-mono text-xs">
                    {pair}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p>{feedback.explanation}</p>
        </div>
      )}

      {/* Submit button */}
      {!feedback && (
        <Button
          onClick={handleSubmit}
          disabled={!allMatched || disabled}
          className="w-full sm:w-auto"
        >
          Check
        </Button>
      )}
    </div>
  );
}
