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
 *
 * Uses useLessonStore.getState() inside callbacks to avoid stale closures
 * and ensure useCallback memoization works correctly (store object changes
 * reference on every state update, so [store] deps are effectively no-ops).
 */
export function useLesson() {
  const store = useLessonStore();

  const initLesson = useCallback((lesson: LessonDetail) => {
    useLessonStore.getState().initLesson(lesson);
  }, []);

  const handleStartExercises = useCallback(() => {
    useLessonStore.getState().startExercises();
  }, []);

  const handleSubmitAnswer = useCallback(async (answer: string) => {
    const state = useLessonStore.getState();
    const exercise = state.blockExercises[state.currentExerciseIndex];
    if (!exercise || state.isSubmitting) return;

    state.setIsSubmitting(true);
    state.setError(null);

    try {
      const result = await submitLessonExercise(exercise.exerciseId, answer);

      const current = useLessonStore.getState();
      current.recordAnswer(result.isCorrect);
      current.setExerciseFeedback({
        isCorrect: result.isCorrect,
        correctAnswer: result.correctAnswer,
        explanation: result.explanation,
        retryTopicId: result.retryTopicId,
        mistakeCategory: result.mistakeCategory ?? undefined,
      });
    } catch (err) {
      useLessonStore
        .getState()
        .setError(
          err instanceof Error ? err.message : "Failed to submit answer",
        );
    } finally {
      useLessonStore.getState().setIsSubmitting(false);
    }
  }, []);

  const handleNextExercise = useCallback(() => {
    useLessonStore.getState().advanceExercise();
  }, []);

  const handleContinueToNextBlock = useCallback(() => {
    useLessonStore.getState().advanceToNextBlock();
  }, []);

  const handleCompleteLesson = useCallback(async () => {
    const state = useLessonStore.getState();
    if (!state.lesson || state.isCompleting) return null;

    state.setIsCompleting(true);
    state.setError(null);

    try {
      const result = await completeLessonAction(state.lesson.id);
      useLessonStore.getState().completeLesson();
      return result;
    } catch (err) {
      useLessonStore
        .getState()
        .setError(
          err instanceof Error ? err.message : "Failed to complete lesson",
        );
      return null;
    } finally {
      useLessonStore.getState().setIsCompleting(false);
    }
  }, []);

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
