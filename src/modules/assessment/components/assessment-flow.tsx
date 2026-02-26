"use client";

import { useCallback, useEffect, useRef } from "react";
import { ExerciseShell } from "@/modules/exercise/components/exercise-shell";
import { GapFill } from "@/modules/exercise/components/gap-fill";
import { MultipleChoice } from "@/modules/exercise/components/multiple-choice";
import { startAssessment, submitAssessmentAnswer } from "../actions";
import { MAX_ITEMS } from "../lib/bayesian";
import { useAssessmentStore } from "../store";

export function AssessmentFlow() {
  const {
    experienceLevel,
    learningGoal,
    assessmentId,
    currentItem,
    questionNumber,
    isGenerating,
    isSubmitting,
    setAssessmentId,
    setCurrentItem,
    setQuestionNumber,
    setIsGenerating,
    setIsSubmitting,
    setResult,
    setStep,
  } = useAssessmentStore();

  // Guard against React Strict Mode double-mount calling startAssessment twice
  const initCalledRef = useRef(false);

  // Start assessment on mount
  const initAssessment = useCallback(async () => {
    if (
      initCalledRef.current ||
      assessmentId ||
      !experienceLevel ||
      !learningGoal
    )
      return;
    initCalledRef.current = true;

    setIsGenerating(true);
    try {
      const result = await startAssessment(experienceLevel, learningGoal);
      setAssessmentId(result.assessmentId);
      setCurrentItem(result.item);
      setQuestionNumber(1);
    } catch (error) {
      console.error("Failed to start assessment:", error);
      initCalledRef.current = false; // allow retry on error
    } finally {
      setIsGenerating(false);
    }
  }, [
    assessmentId,
    experienceLevel,
    learningGoal,
    setAssessmentId,
    setCurrentItem,
    setIsGenerating,
    setQuestionNumber,
  ]);

  useEffect(() => {
    initAssessment();
  }, [initAssessment]);

  // Submit answer and immediately advance (no feedback in assessment)
  async function handleSubmit(answer: string, _selectedIndex?: number) {
    if (!assessmentId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await submitAssessmentAnswer(assessmentId, answer);

      setQuestionNumber(result.questionNumber + 1);

      // Assessment complete → go to results
      if (result.result) {
        setResult(result.result);
        setStep("results");
        return;
      }

      // Immediately show next question
      if (result.nextItem) {
        setCurrentItem(result.nextItem);
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Loading state
  if (isGenerating || !currentItem) {
    return (
      <ExerciseShell current={1} total={MAX_ITEMS} loading>
        <div />
      </ExerciseShell>
    );
  }

  return (
    <ExerciseShell
      current={Math.min(questionNumber, MAX_ITEMS)}
      total={MAX_ITEMS}
      loading={isSubmitting}
    >
      {currentItem.exerciseType === "gap_fill" && (
        <GapFill
          key={currentItem.topicId}
          before={currentItem.before ?? ""}
          after={currentItem.after ?? ""}
          hint={currentItem.hint}
          translation={currentItem.translation}
          feedback={null}
          onSubmit={handleSubmit}
          disabled={isSubmitting}
          submitLabel="Continue"
        />
      )}

      {currentItem.exerciseType === "multiple_choice" &&
        currentItem.options && (
          <MultipleChoice
            key={currentItem.topicId}
            prompt={currentItem.prompt}
            options={currentItem.options}
            feedback={null}
            correctIndex={-1}
            onSubmit={handleSubmit}
            disabled={isSubmitting}
          />
        )}
    </ExerciseShell>
  );
}
