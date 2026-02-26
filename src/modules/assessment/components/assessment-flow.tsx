"use client";

import { useCallback, useEffect } from "react";
import { ExerciseShell } from "@/modules/exercise/components/exercise-shell";
import { GapFill } from "@/modules/exercise/components/gap-fill";
import { MultipleChoice } from "@/modules/exercise/components/multiple-choice";
import { Button } from "@/shared/ui/button";
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
    feedback,
    isGenerating,
    isSubmitting,
    setAssessmentId,
    setCurrentItem,
    setQuestionNumber,
    setFeedback,
    setIsGenerating,
    setIsSubmitting,
    setResult,
    setStep,
  } = useAssessmentStore();

  // Start assessment on mount
  const initAssessment = useCallback(async () => {
    if (assessmentId || !experienceLevel || !learningGoal) return;

    setIsGenerating(true);
    try {
      const result = await startAssessment(experienceLevel, learningGoal);
      setAssessmentId(result.assessmentId);
      setCurrentItem(result.item);
      setQuestionNumber(1);
    } catch (error) {
      console.error("Failed to start assessment:", error);
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

  // Submit answer
  async function handleSubmit(answer: string, _selectedIndex?: number) {
    if (!assessmentId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await submitAssessmentAnswer(assessmentId, answer);

      // Show feedback
      setFeedback({
        isCorrect: result.isCorrect,
        correctAnswer: result.correctAnswer,
        explanation: result.explanation,
      });

      setQuestionNumber(result.questionNumber + 1);

      // If assessment is complete, store result
      if (result.result) {
        setResult(result.result);
      }

      // Store next item for after feedback
      if (result.nextItem) {
        // Wait for user to dismiss feedback before showing next item
        setTimeout(() => {}, 0);
        // Store in a ref-like pattern via the store
        useAssessmentStore.setState({ _nextItem: result.nextItem } as never);
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Advance to next question or results
  function handleNext() {
    const store = useAssessmentStore.getState();
    const result = store.result;
    const nextItem = (store as unknown as { _nextItem: typeof currentItem })
      ._nextItem;

    if (result) {
      setStep("results");
      return;
    }

    if (nextItem) {
      setCurrentItem(nextItem);
      setFeedback(null);
      useAssessmentStore.setState({ _nextItem: null } as never);
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
    <div className="space-y-4">
      <ExerciseShell
        current={Math.min(questionNumber, MAX_ITEMS)}
        total={MAX_ITEMS}
        loading={false}
      >
        {currentItem.exerciseType === "gap_fill" && (
          <GapFill
            before={currentItem.before ?? ""}
            after={currentItem.after ?? ""}
            feedback={feedback}
            onSubmit={handleSubmit}
            disabled={isSubmitting || !!feedback}
          />
        )}

        {currentItem.exerciseType === "multiple_choice" &&
          currentItem.options && (
            <MultipleChoice
              prompt={currentItem.prompt}
              options={currentItem.options}
              feedback={feedback}
              correctIndex={-1} // Not exposed to client until feedback
              onSubmit={handleSubmit}
              disabled={isSubmitting || !!feedback}
            />
          )}
      </ExerciseShell>

      {/* Next button (shown after feedback) */}
      {feedback && (
        <div className="flex justify-center">
          <Button onClick={handleNext} size="lg">
            {useAssessmentStore.getState().result
              ? "See results"
              : "Next question"}
          </Button>
        </div>
      )}
    </div>
  );
}
