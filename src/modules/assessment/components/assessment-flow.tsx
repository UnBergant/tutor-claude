"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { ExerciseShell } from "@/modules/exercise/components/exercise-shell";
import { GapFill } from "@/modules/exercise/components/gap-fill";
import { MultipleChoice } from "@/modules/exercise/components/multiple-choice";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  goBackAssessment,
  startAssessment,
  submitAssessmentAnswer,
} from "../actions";
import { MAX_ITEMS } from "../lib/bayesian";
import { useAssessmentStore } from "../store";

/** Map indexOf -1 to undefined (for defaultSelectedIndex prop). */
function indexOrUndefined(
  arr: string[] | null | undefined,
  value: string,
): number | undefined {
  const idx = arr?.indexOf(value) ?? -1;
  return idx === -1 ? undefined : idx;
}

export function AssessmentFlow() {
  const {
    experienceLevel,
    learningGoal,
    assessmentId,
    currentItem,
    questionNumber,
    isGenerating,
    isSubmitting,
    error,
    setAssessmentId,
    setCurrentItem,
    setQuestionNumber,
    setIsGenerating,
    setIsSubmitting,
    setError,
    setResult,
    setStep,
    previousAnswer,
    setPreviousAnswer,
    canGoBack,
    setCanGoBack,
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
    setError(null);
    try {
      const result = await startAssessment(experienceLevel, learningGoal);
      setAssessmentId(result.assessmentId);
      setCurrentItem(result.item);
      setQuestionNumber(1);
    } catch (err) {
      console.error("Failed to start assessment:", err);
      initCalledRef.current = false; // allow retry on error
      setError("Failed to start the assessment. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [
    assessmentId,
    experienceLevel,
    learningGoal,
    setAssessmentId,
    setCurrentItem,
    setError,
    setIsGenerating,
    setQuestionNumber,
  ]);

  useEffect(() => {
    initAssessment();
  }, [initAssessment]);

  // Submit answer and immediately advance (no feedback in assessment)
  async function handleSubmit(answer: string, _selectedIndex?: number) {
    if (!assessmentId || isSubmitting) return;

    setPreviousAnswer(null);
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

      if (result.nextItem) {
        setCurrentItem(result.nextItem);
      }
      setCanGoBack(result.canGoBack);
    } catch (error) {
      console.error("Failed to submit answer:", error);
      toast.error("Failed to submit your answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Go back to the previous question
  async function handleGoBack() {
    if (!assessmentId || isSubmitting || questionNumber <= 1) return;

    setIsSubmitting(true);
    try {
      const result = await goBackAssessment(assessmentId);
      setCurrentItem(result.item);
      setQuestionNumber(result.questionNumber);
      setPreviousAnswer(result.previousAnswer);
      setCanGoBack(false);
    } catch (error) {
      console.error("Failed to go back:", error);
      toast.error("Failed to go back. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Error state with retry
  if (error) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => initAssessment()}>Try again</Button>
        </CardContent>
      </Card>
    );
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
      submitting={isSubmitting}
    >
      {canGoBack && (
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            disabled={isSubmitting}
            className="text-muted-foreground"
          >
            ← Back
          </Button>
        </div>
      )}
      <div key={questionNumber} className="animate-fade-in-up">
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
            defaultValue={previousAnswer ?? undefined}
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
              defaultSelectedIndex={
                previousAnswer != null
                  ? indexOrUndefined(currentItem.options, previousAnswer)
                  : undefined
              }
            />
          )}
      </div>
    </ExerciseShell>
  );
}
