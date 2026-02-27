import type {
  Prisma,
  ExerciseType as PrismaExerciseType,
} from "@/generated/prisma";
import { generateStructured } from "@/shared/lib/ai/client";
import {
  buildExerciseGapFillPrompt,
  buildExerciseMultipleChoicePrompt,
  EXERCISE_GAP_FILL_SCHEMA,
  EXERCISE_MULTIPLE_CHOICE_SCHEMA,
  type GeneratedExerciseGapFill,
  type GeneratedExerciseMultipleChoice,
} from "@/shared/lib/ai/prompts/exercise";
import { CELESTIA_SYSTEM_PROMPT } from "@/shared/lib/ai/prompts/system";
import {
  hintMatchesAnswer,
  sanitizeGapFill,
  sanitizeMultipleChoice,
} from "@/shared/lib/ai/sanitize";
import type {
  ExerciseClientItem,
  ExerciseType,
  GapFillContent,
  MultipleChoiceContent,
} from "@/shared/types/exercise";
import type { GrammarTopic } from "@/shared/types/grammar";
import {
  generateWithRetry,
  validateGapFill,
  validateMultipleChoice,
} from "./validation";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface GeneratedExerciseResult {
  content: GapFillContent | MultipleChoiceContent;
  correctAnswer: string;
  explanation: string;
  question: string;
}

/** Exercise types currently supported for generation */
export type GeneratableExerciseType = "gap_fill" | "multiple_choice";

// ──────────────────────────────────────────────
// Exercise generation + validation pipeline
// ──────────────────────────────────────────────

/**
 * Generate and validate a single exercise through the full pipeline.
 * Shared by exercise module, lesson module, and batch generation.
 */
export async function generateAndValidateExercise(
  type: ExerciseType,
  topic: GrammarTopic,
  userId: string,
): Promise<GeneratedExerciseResult> {
  if (type === "gap_fill") {
    const basePrompt = buildExerciseGapFillPrompt(topic);
    const data = await generateWithRetry(async (previousErrors) => {
      const userMessage = previousErrors
        ? `${basePrompt}\n\nIMPORTANT: Your previous attempt was rejected for these reasons: ${previousErrors.join("; ")}. Fix these issues.`
        : basePrompt;
      const { data } = await generateStructured<GeneratedExerciseGapFill>({
        endpoint: "exercise",
        system: CELESTIA_SYSTEM_PROMPT,
        userMessage,
        toolName: "generate_exercise_gap_fill",
        toolDescription:
          "Generate a gap-fill exercise for a Spanish grammar lesson",
        schema: EXERCISE_GAP_FILL_SCHEMA,
        userId,
      });
      return data;
    }, validateGapFill);

    const sanitized = sanitizeGapFill(data.before, data.after);
    const content: GapFillContent = {
      type: "gap_fill",
      before: sanitized.before,
      after: sanitized.after,
      correctAnswer: data.correctAnswer,
      hint: hintMatchesAnswer(data.hint, data.correctAnswer)
        ? undefined
        : data.hint,
      translation: data.translation,
      explanation: data.explanation,
    };

    return {
      content,
      correctAnswer: data.correctAnswer,
      explanation: data.explanation,
      question: `${sanitized.before}___${sanitized.after}`,
    };
  }

  // Multiple choice
  const basePrompt = buildExerciseMultipleChoicePrompt(topic);
  const data = await generateWithRetry(async (previousErrors) => {
    const userMessage = previousErrors
      ? `${basePrompt}\n\nIMPORTANT: Your previous attempt was rejected for these reasons: ${previousErrors.join("; ")}. Fix these issues.`
      : basePrompt;
    const { data } = await generateStructured<GeneratedExerciseMultipleChoice>({
      endpoint: "exercise",
      system: CELESTIA_SYSTEM_PROMPT,
      userMessage,
      toolName: "generate_exercise_multiple_choice",
      toolDescription:
        "Generate a multiple-choice exercise for a Spanish grammar lesson",
      schema: EXERCISE_MULTIPLE_CHOICE_SCHEMA,
      userId,
    });
    return data;
  }, validateMultipleChoice);

  const sanitized = sanitizeMultipleChoice(data);
  const content: MultipleChoiceContent = {
    type: "multiple_choice",
    prompt: sanitized.prompt,
    options: sanitized.options as [string, string, string, string],
    correctIndex: sanitized.correctIndex,
    correctAnswer: sanitized.correctAnswer,
    explanation: sanitized.explanation,
  };

  return {
    content,
    correctAnswer: sanitized.correctAnswer,
    explanation: sanitized.explanation,
    question: sanitized.prompt,
  };
}

// ──────────────────────────────────────────────
// Type converters
// ──────────────────────────────────────────────

/** Convert lowercase exercise type to Prisma enum */
export function toPrismaExerciseType(type: ExerciseType): PrismaExerciseType {
  const map: Record<ExerciseType, PrismaExerciseType> = {
    gap_fill: "GAP_FILL",
    multiple_choice: "MULTIPLE_CHOICE",
    match_pairs: "MATCH_PAIRS",
    reorder_words: "REORDER_WORDS",
    free_writing: "FREE_WRITING",
    reading_comprehension: "READING_COMPREHENSION",
  };
  return map[type];
}

/** Convert Prisma enum to lowercase exercise type */
export function fromPrismaExerciseType(type: PrismaExerciseType): ExerciseType {
  const map: Record<PrismaExerciseType, ExerciseType> = {
    GAP_FILL: "gap_fill",
    MULTIPLE_CHOICE: "multiple_choice",
    MATCH_PAIRS: "match_pairs",
    REORDER_WORDS: "reorder_words",
    FREE_WRITING: "free_writing",
    READING_COMPREHENSION: "reading_comprehension",
  };
  return map[type];
}

/**
 * Convert exercise content to client-safe item (strips correctAnswer).
 */
export function toClientItem(
  exerciseId: string,
  type: ExerciseType,
  content: GapFillContent | MultipleChoiceContent,
): ExerciseClientItem {
  if (type === "gap_fill") {
    const gf = content as GapFillContent;
    return {
      exerciseId,
      type: "gap_fill",
      before: gf.before,
      after: gf.after,
      hint: gf.hint,
      translation: gf.translation,
    };
  }

  const mc = content as MultipleChoiceContent;
  return {
    exerciseId,
    type: "multiple_choice",
    prompt: mc.prompt,
    options: [...mc.options],
  };
}

/**
 * Convert a Prisma Exercise record to client-safe ExerciseClientItem.
 * Convenience wrapper that reads type + content from the DB record shape.
 */
export function exerciseRecordToClientItem(exercise: {
  id: string;
  type: PrismaExerciseType;
  content: Prisma.JsonValue;
}): ExerciseClientItem {
  const type = fromPrismaExerciseType(exercise.type);
  const content = exercise.content as unknown as
    | GapFillContent
    | MultipleChoiceContent;
  return toClientItem(exercise.id, type, content);
}
