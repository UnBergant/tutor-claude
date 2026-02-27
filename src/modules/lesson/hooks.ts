"use client";

import { useCallback, useMemo } from "react";
import type { LessonDetail } from "./actions";
import {
  completeLesson as completeLessonAction,
  submitLessonExercise,
} from "./actions";
import { useLessonStore } from "./store";

/**
 * Hook that drives the lesson flow.
 * Manages block-level progression: explanation → exercises → transition → complete.
 */
export function useLesson() {
  const store = useLessonStore();

  const initLesson = useCallback(
    (lesson: LessonDetail) => {
      store.initLesson(lesson);
    },
    [store.initLesson],
  );

  const handleStartExercises = useCallback(() => {
    store.startExercises();
  }, [store.startExercises]);

  const handleSubmitAnswer = useCallback(
    async (answer: string) => {
      const { blockExercises, currentExerciseIndex } =
        useLessonStore.getState();
      const exercise = blockExercises[currentExerciseIndex];
      if (!exercise || store.isSubmitting) return;

      store.setIsSubmitting(true);
      store.setError(null);

      try {
        const result = await submitLessonExercise(exercise.exerciseId, answer);

        store.recordAnswer(result.isCorrect);
        store.setExerciseFeedback({
          isCorrect: result.isCorrect,
          correctAnswer: result.correctAnswer,
          explanation: result.explanation,
          retryTopicId: result.retryTopicId,
          mistakeCategory: result.mistakeCategory ?? undefined,
        });
      } catch (err) {
        store.setError(
          err instanceof Error ? err.message : "Failed to submit answer",
        );
      } finally {
        store.setIsSubmitting(false);
      }
    },
    [store],
  );

  const handleNextExercise = useCallback(() => {
    store.advanceExercise();
  }, [store.advanceExercise]);

  const handleContinueToNextBlock = useCallback(() => {
    store.advanceToNextBlock();
  }, [store.advanceToNextBlock]);

  const handleCompleteLesson = useCallback(async () => {
    const { lesson } = useLessonStore.getState();
    if (!lesson || store.isCompleting) return;

    store.setIsCompleting(true);
    store.setError(null);

    try {
      const result = await completeLessonAction(lesson.id);
      store.completeLesson();
      return result;
    } catch (err) {
      store.setError(
        err instanceof Error ? err.message : "Failed to complete lesson",
      );
      return null;
    } finally {
      store.setIsCompleting(false);
    }
  }, [store]);

  // Computed values
  const currentBlock = useMemo(() => {
    if (!store.lesson) return null;
    return store.lesson.blocks[store.currentBlockIndex] ?? null;
  }, [store.lesson, store.currentBlockIndex]);

  const totalBlocks = store.lesson?.blocks.length ?? 0;

  const overallScore = useMemo(() => {
    const totals = store.blockScores.reduce(
      (acc, s) => ({
        correct: acc.correct + s.correct,
        total: acc.total + s.total,
      }),
      { correct: 0, total: 0 },
    );
    return totals;
  }, [store.blockScores]);

  const currentExercise = useMemo(() => {
    return store.blockExercises[store.currentExerciseIndex] ?? null;
  }, [store.blockExercises, store.currentExerciseIndex]);

  const isLastBlock = store.lesson
    ? store.currentBlockIndex >= store.lesson.blocks.length - 1
    : true;

  return {
    // State
    lesson: store.lesson,
    phase: store.phase,
    currentBlock,
    currentBlockIndex: store.currentBlockIndex,
    totalBlocks,
    currentExercise,
    currentExerciseIndex: store.currentExerciseIndex,
    totalBlockExercises: store.blockExercises.length,
    exerciseFeedback: store.exerciseFeedback,
    blockScores: store.blockScores,
    overallScore,
    isLastBlock,
    isGenerating: store.isGenerating,
    isSubmitting: store.isSubmitting,
    isCompleting: store.isCompleting,
    error: store.error,

    // Actions
    initLesson,
    handleStartExercises,
    handleSubmitAnswer,
    handleNextExercise,
    handleContinueToNextBlock,
    handleCompleteLesson,
    reset: store.reset,
  };
}
