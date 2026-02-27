"use client";

import type {
  ExerciseClientItem,
  ExerciseFeedback,
} from "@/shared/types/exercise";
import { FreeWriting } from "./free-writing";
import { GapFill } from "./gap-fill";
import { MatchPairs } from "./match-pairs";
import { MultipleChoice } from "./multiple-choice";
import { ReadingComprehension } from "./reading-comprehension";
import { ReorderWords } from "./reorder-words";

interface ExerciseFactoryProps {
  exercise: ExerciseClientItem;
  feedback: ExerciseFeedback | null;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

/**
 * Renders the correct exercise component based on exercise type.
 * Acts as a routing layer — no logic, just delegation.
 */
export function ExerciseFactory({
  exercise,
  feedback,
  onSubmit,
  disabled,
}: ExerciseFactoryProps) {
  switch (exercise.type) {
    case "gap_fill":
      return (
        <GapFill
          before={exercise.before}
          after={exercise.after}
          hint={exercise.hint}
          translation={exercise.translation}
          feedback={feedback}
          onSubmit={onSubmit}
          disabled={disabled}
          submitLabel="Check"
        />
      );

    case "multiple_choice":
      return (
        <MultipleChoice
          prompt={exercise.prompt}
          options={exercise.options}
          feedback={feedback}
          correctIndex={-1} // hidden from client; MC shows correct after feedback
          onSubmit={(answer) => onSubmit(answer)}
          disabled={disabled}
        />
      );

    case "reorder_words":
      return (
        <ReorderWords
          words={exercise.words}
          translation={exercise.translation}
          feedback={feedback}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );

    case "match_pairs":
      return (
        <MatchPairs
          leftItems={exercise.leftItems}
          rightItems={exercise.rightItems}
          feedback={feedback}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );

    case "free_writing":
      return (
        <FreeWriting
          writingPrompt={exercise.writingPrompt}
          feedback={feedback}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );

    case "reading_comprehension":
      return (
        <ReadingComprehension
          passage={exercise.passage}
          questions={exercise.questions}
          feedback={feedback}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );

    default:
      return (
        <div className="text-destructive text-center py-8">
          Unknown exercise type.
        </div>
      );
  }
}
