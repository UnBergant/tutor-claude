"use client";

import type {
  ExerciseClientItem,
  ExerciseFeedback,
} from "@/shared/types/exercise";
import { GapFill } from "./gap-fill";
import { MultipleChoice } from "./multiple-choice";

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

    // Phase 3c stubs — will be implemented later
    case "match_pairs":
    case "reorder_words":
    case "free_writing":
    case "reading_comprehension":
      return (
        <div className="text-muted-foreground text-center py-8">
          Exercise type &quot;{exercise.type}&quot; is coming soon.
        </div>
      );

    default:
      return (
        <div className="text-destructive text-center py-8">
          Unknown exercise type.
        </div>
      );
  }
}
