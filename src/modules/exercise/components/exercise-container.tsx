"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/shared/ui/button";
import { ExerciseFactory } from "@/shared/ui/exercises/exercise-factory";
import { ExerciseShell } from "@/shared/ui/exercises/exercise-shell";
import { useExercise } from "../hooks";

interface ExerciseContainerProps {
  /** Optional title shown in the shell header */
  title?: string;
  /** Called when all exercises are completed */
  onComplete?: (score: { correct: number; total: number }) => void;
}

/**
 * Container component for exercise sequences.
 * Connects the Zustand store (via useExercise hook) to presentational components.
 * Handles: exercise rendering, feedback display, Next button, error reporting, completion.
 */
export function ExerciseContainer({
  title,
  onComplete,
}: ExerciseContainerProps) {
  const {
    currentExercise,
    feedback,
    isLoading,
    isSubmitting,
    error,
    correctCount,
    totalAnswered,
    totalExercises,
    currentIndex,
    isComplete,
    handleSubmit,
    handleNext,
    handleReport,
  } = useExercise();

  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");

  // Fire onComplete exactly once when all exercises are done
  const completeFiredRef = useRef(false);
  useEffect(() => {
    if (isComplete && !completeFiredRef.current) {
      completeFiredRef.current = true;
      onComplete?.({ correct: correctCount, total: totalAnswered });
    }
  }, [isComplete, correctCount, totalAnswered, onComplete]);

  // Completed all exercises
  if (isComplete) {
    return (
      <ExerciseShell
        current={totalExercises}
        total={totalExercises}
        title={title}
      >
        <div className="text-center space-y-4 py-4">
          <div className="text-4xl">
            {correctCount === totalAnswered ? "🎉" : "📚"}
          </div>
          <h3 className="text-lg font-semibold">Exercise Set Complete</h3>
          <p className="text-muted-foreground">
            Score: {correctCount}/{totalAnswered} correct (
            {totalAnswered > 0
              ? Math.round((correctCount / totalAnswered) * 100)
              : 0}
            %)
          </p>
        </div>
      </ExerciseShell>
    );
  }

  // Loading or no exercises
  if (!currentExercise) {
    return (
      <ExerciseShell
        current={0}
        total={totalExercises || 1}
        title={title}
        loading={isLoading}
      >
        {!isLoading && (
          <p className="text-muted-foreground text-center py-4">
            No exercises available.
          </p>
        )}
      </ExerciseShell>
    );
  }

  return (
    <ExerciseShell
      current={currentIndex + 1}
      total={totalExercises}
      title={title}
      loading={isLoading}
    >
      {error && (
        <div className="rounded-lg p-3 text-sm bg-destructive/10 text-destructive mb-4">
          {error}
        </div>
      )}

      <ExerciseFactory
        exercise={currentExercise}
        feedback={feedback}
        onSubmit={handleSubmit}
        disabled={isSubmitting || feedback !== null}
      />

      {/* Post-feedback actions */}
      {feedback && (
        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={handleNext} className="w-full">
            Next
          </Button>

          <div className="flex gap-2">
            {/* "Review this topic" button hidden until Phase 3b implements actual review navigation */}

            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground ml-auto"
              onClick={() => setReportOpen(!reportOpen)}
            >
              Report an error
            </Button>
          </div>

          {reportOpen && (
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Describe the problem..."
                className="flex-1 rounded-md border px-3 py-1.5 text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={!reportText.trim()}
                onClick={async () => {
                  await handleReport(reportText.trim());
                  setReportText("");
                  setReportOpen(false);
                }}
              >
                Send
              </Button>
            </div>
          )}
        </div>
      )}
    </ExerciseShell>
  );
}
