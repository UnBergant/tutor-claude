"use client";

import { useCallback } from "react";
import type { ExerciseClientItem } from "@/shared/types/exercise";
import { reportExerciseError, submitExerciseAnswer } from "./actions";
import { useExerciseStore } from "./store";

/**
 * Hook that connects the exercise store to server actions.
 * Provides handleSubmit, handleNext, handleRetryTopic, and handleReport.
 */
export function useExercise() {
  const {
    exercises,
    currentIndex,
    currentExercise,
    feedback,
    isLoading,
    isSubmitting,
    error,
    correctCount,
    totalAnswered,
    setExercises,
    setFeedback,
    setIsSubmitting,
    setError,
    incrementCorrect,
    incrementTotal,
    advanceToNext,
    reset,
  } = useExerciseStore();

  /** Submit an answer for the current exercise */
  const handleSubmit = useCallback(
    async (answer: string) => {
      if (!currentExercise || isSubmitting) return;

      setIsSubmitting(true);
      setError(null);

      try {
        const result = await submitExerciseAnswer(
          currentExercise.exerciseId,
          answer,
        );

        incrementTotal();
        if (result.isCorrect) {
          incrementCorrect();
        }

        setFeedback({
          isCorrect: result.isCorrect,
          correctAnswer: result.correctAnswer,
          explanation: result.explanation,
          retryTopicId: result.retryTopicId,
          mistakeCategory: result.mistakeCategory ?? undefined,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to submit answer",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      currentExercise,
      isSubmitting,
      setIsSubmitting,
      setError,
      incrementTotal,
      incrementCorrect,
      setFeedback,
    ],
  );

  /** Move to the next exercise (after feedback is shown) */
  const handleNext = useCallback(() => {
    advanceToNext();
  }, [advanceToNext]);

  /** Flag a topic for retry/review (curriculum adaptation) */
  const handleRetryTopic = useCallback(
    (_topicId: string) => {
      // In Phase 3b, this will integrate with curriculum to schedule topic review.
      // For now, the mistake is already tracked in MistakeEntry via submitExerciseAnswer.
      handleNext();
    },
    [handleNext],
  );

  /** Report an error in the current exercise */
  const handleReport = useCallback(
    async (description: string) => {
      if (!currentExercise) return;

      try {
        await reportExerciseError(currentExercise.exerciseId, description);
      } catch {
        // Silently fail — error reports are non-critical
      }
    },
    [currentExercise],
  );

  /** Initialize exercises for a block */
  const initExercises = useCallback(
    (items: ExerciseClientItem[]) => {
      setExercises(items);
    },
    [setExercises],
  );

  return {
    // State
    currentExercise,
    feedback,
    isLoading,
    isSubmitting,
    error,
    correctCount,
    totalAnswered,
    totalExercises: exercises.length,
    currentIndex,
    isComplete: currentExercise === null && totalAnswered > 0,

    // Actions
    handleSubmit,
    handleNext,
    handleRetryTopic,
    handleReport,
    initExercises,
    reset,
  };
}
