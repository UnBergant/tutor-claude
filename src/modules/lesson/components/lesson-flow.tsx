"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/shared/ui/button";
import { ExerciseFactory } from "@/shared/ui/exercises/exercise-factory";
import { ExerciseShell } from "@/shared/ui/exercises/exercise-shell";
import type { LessonCompleteResult, LessonDetail } from "../actions";
import { useLesson } from "../hooks";
import { BlockExplanation } from "./block-explanation";
import { BlockTransition } from "./block-transition";
import { LessonComplete } from "./lesson-complete";

interface LessonFlowProps {
  lesson: LessonDetail;
}

export function LessonFlow({ lesson }: LessonFlowProps) {
  const {
    phase,
    currentBlock,
    currentBlockIndex,
    totalBlocks,
    currentExercise,
    currentExerciseIndex,
    totalBlockExercises,
    exerciseFeedback,
    blockScores,
    isSubmitting,
    isCompleting,
    error,
    initLesson,
    handleStartExercises,
    handleSubmitAnswer,
    handleNextExercise,
    handleContinueToNextBlock,
    handleCompleteLesson,
  } = useLesson();

  const [completionResult, setCompletionResult] =
    useState<LessonCompleteResult | null>(null);

  // Initialize lesson on mount
  const initRef = useRef(false);
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      initLesson(lesson);
    }
  }, [lesson, initLesson]);

  // Explanation phase
  if (phase === "explanation" && currentBlock) {
    return (
      <BlockExplanation
        title={currentBlock.title}
        explanation={currentBlock.explanation}
        type={currentBlock.type}
        blockNumber={currentBlockIndex + 1}
        totalBlocks={totalBlocks}
        exerciseCount={currentBlock.exercises.length}
        onStartExercises={handleStartExercises}
      />
    );
  }

  // Exercise phase
  if (phase === "exercises" && currentExercise) {
    return (
      <ExerciseShell
        current={currentExerciseIndex + 1}
        total={totalBlockExercises}
        title={currentBlock?.title}
      >
        {error && (
          <div className="rounded-lg p-3 text-sm bg-destructive/10 text-destructive mb-4">
            {error}
          </div>
        )}

        <ExerciseFactory
          exercise={currentExercise}
          feedback={exerciseFeedback}
          onSubmit={handleSubmitAnswer}
          disabled={isSubmitting || exerciseFeedback !== null}
        />

        {exerciseFeedback && (
          <div className="mt-4">
            <Button onClick={handleNextExercise} className="w-full">
              Next
            </Button>
          </div>
        )}
      </ExerciseShell>
    );
  }

  // Transition phase (between blocks)
  if (phase === "transition" && lesson.blocks[currentBlockIndex + 1]) {
    const nextBlock = lesson.blocks[currentBlockIndex + 1];
    return (
      <BlockTransition
        blockScore={blockScores[currentBlockIndex] ?? { correct: 0, total: 0 }}
        blockNumber={currentBlockIndex + 1}
        nextBlockTitle={nextBlock.title}
        nextBlockType={nextBlock.type}
        onContinue={handleContinueToNextBlock}
      />
    );
  }

  // Complete phase
  if (phase === "complete") {
    return (
      <LessonComplete
        lessonTitle={lesson.title}
        blockScores={blockScores.map((score, i) => ({
          title: lesson.blocks[i]?.title ?? `Block ${i + 1}`,
          ...score,
        }))}
        result={completionResult}
        isCompleting={isCompleting}
        onComplete={async () => {
          const result = await handleCompleteLesson();
          if (result) setCompletionResult(result);
        }}
        showBackButton
      />
    );
  }

  // Fallback
  return (
    <div className="text-center py-8 text-muted-foreground">
      Loading lesson...
    </div>
  );
}
