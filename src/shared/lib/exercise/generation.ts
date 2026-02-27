import type {
  Prisma,
  ExerciseType as PrismaExerciseType,
} from "@/generated/prisma";
import { generateStructured } from "@/shared/lib/ai/client";
import {
  buildExerciseFreeWritingPrompt,
  buildExerciseGapFillPrompt,
  buildExerciseMatchPairsPrompt,
  buildExerciseMultipleChoicePrompt,
  buildExerciseReadingComprehensionPrompt,
  buildExerciseReorderWordsPrompt,
  EXERCISE_FREE_WRITING_SCHEMA,
  EXERCISE_GAP_FILL_SCHEMA,
  EXERCISE_MATCH_PAIRS_SCHEMA,
  EXERCISE_MULTIPLE_CHOICE_SCHEMA,
  EXERCISE_READING_COMPREHENSION_SCHEMA,
  EXERCISE_REORDER_WORDS_SCHEMA,
  type GeneratedExerciseFreeWriting,
  type GeneratedExerciseGapFill,
  type GeneratedExerciseMatchPairs,
  type GeneratedExerciseMultipleChoice,
  type GeneratedExerciseReadingComprehension,
  type GeneratedExerciseReorderWords,
} from "@/shared/lib/ai/prompts/exercise";
import { CELESTIA_SYSTEM_PROMPT } from "@/shared/lib/ai/prompts/system";
import {
  hintMatchesAnswer,
  sanitizeGapFill,
  sanitizeMultipleChoice,
} from "@/shared/lib/ai/sanitize";
import type {
  ExerciseClientItem,
  ExerciseContent,
  ExerciseType,
  FreeWritingContent,
  GapFillContent,
  MatchPairsContent,
  MultipleChoiceContent,
  ReadingComprehensionContent,
  ReorderWordsContent,
} from "@/shared/types/exercise";
import type { GrammarTopic } from "@/shared/types/grammar";
import {
  generateWithRetry,
  validateFreeWriting,
  validateGapFill,
  validateMatchPairs,
  validateMultipleChoice,
  validateReadingComprehension,
  validateReorderWords,
} from "./validation";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface GeneratedExerciseResult {
  content: ExerciseContent;
  correctAnswer: string;
  explanation: string;
  question: string;
}

// ──────────────────────────────────────────────
// Shuffle helper
// ──────────────────────────────────────────────

/**
 * Fisher-Yates shuffle that ensures the result differs from the original order.
 * Returns a new array — never mutates the input.
 */
export function shuffleUntilDifferent<T>(arr: readonly T[]): T[] {
  if (arr.length <= 1) return [...arr];

  const shuffle = (a: T[]): T[] => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const isSameOrder = (a: readonly T[], b: readonly T[]): boolean =>
    a.every((val, idx) => val === b[idx]);

  let result = shuffle([...arr]);
  let attempts = 0;
  while (isSameOrder(arr, result) && attempts < 10) {
    result = shuffle([...arr]);
    attempts++;
  }
  return result;
}

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
  switch (type) {
    case "gap_fill":
      return generateGapFill(topic, userId);
    case "multiple_choice":
      return generateMultipleChoice(topic, userId);
    case "reorder_words":
      return generateReorderWords(topic, userId);
    case "match_pairs":
      return generateMatchPairs(topic, userId);
    case "free_writing":
      return generateFreeWriting(topic, userId);
    case "reading_comprehension":
      return generateReadingComprehension(topic, userId);
    default:
      throw new Error(`Unsupported exercise type: ${type}`);
  }
}

// ──────────────────────────────────────────────
// Per-type generators
// ──────────────────────────────────────────────

async function generateGapFill(
  topic: GrammarTopic,
  userId: string,
): Promise<GeneratedExerciseResult> {
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

async function generateMultipleChoice(
  topic: GrammarTopic,
  userId: string,
): Promise<GeneratedExerciseResult> {
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

async function generateReorderWords(
  topic: GrammarTopic,
  userId: string,
): Promise<GeneratedExerciseResult> {
  const basePrompt = buildExerciseReorderWordsPrompt(topic);
  const data = await generateWithRetry(async (previousErrors) => {
    const userMessage = previousErrors
      ? `${basePrompt}\n\nIMPORTANT: Your previous attempt was rejected for these reasons: ${previousErrors.join("; ")}. Fix these issues.`
      : basePrompt;
    const { data } = await generateStructured<GeneratedExerciseReorderWords>({
      endpoint: "exercise",
      system: CELESTIA_SYSTEM_PROMPT,
      userMessage,
      toolName: "generate_exercise_reorder_words",
      toolDescription:
        "Generate a reorder-words exercise for a Spanish grammar lesson",
      schema: EXERCISE_REORDER_WORDS_SCHEMA,
      userId,
    });
    return data;
  }, validateReorderWords);

  const content: ReorderWordsContent = {
    type: "reorder_words",
    correctSentence: data.correctSentence,
    words: shuffleUntilDifferent(data.words),
    translation: data.translation,
    explanation: data.explanation,
  };

  return {
    content,
    correctAnswer: data.correctSentence,
    explanation: data.explanation,
    question: data.words.join(" "),
  };
}

async function generateMatchPairs(
  topic: GrammarTopic,
  userId: string,
): Promise<GeneratedExerciseResult> {
  const basePrompt = buildExerciseMatchPairsPrompt(topic);
  const data = await generateWithRetry(async (previousErrors) => {
    const userMessage = previousErrors
      ? `${basePrompt}\n\nIMPORTANT: Your previous attempt was rejected for these reasons: ${previousErrors.join("; ")}. Fix these issues.`
      : basePrompt;
    const { data } = await generateStructured<GeneratedExerciseMatchPairs>({
      endpoint: "exercise",
      system: CELESTIA_SYSTEM_PROMPT,
      userMessage,
      toolName: "generate_exercise_match_pairs",
      toolDescription:
        "Generate a match-pairs exercise for a Spanish grammar lesson",
      schema: EXERCISE_MATCH_PAIRS_SCHEMA,
      userId,
    });
    return data;
  }, validateMatchPairs);

  // Sort pairs by left item for deterministic correctAnswer
  const sortedPairs = [...data.pairs].sort((a, b) =>
    a.left.localeCompare(b.left),
  );

  const content: MatchPairsContent = {
    type: "match_pairs",
    pairs: sortedPairs,
    shuffledRightItems: shuffleUntilDifferent(sortedPairs.map((p) => p.right)),
    explanation: data.explanation,
  };

  return {
    content,
    correctAnswer: JSON.stringify(sortedPairs),
    explanation: data.explanation,
    question: sortedPairs.map((p) => `${p.left} → ${p.right}`).join(", "),
  };
}

async function generateFreeWriting(
  topic: GrammarTopic,
  userId: string,
): Promise<GeneratedExerciseResult> {
  const basePrompt = buildExerciseFreeWritingPrompt(topic);
  const data = await generateWithRetry(async (previousErrors) => {
    const userMessage = previousErrors
      ? `${basePrompt}\n\nIMPORTANT: Your previous attempt was rejected for these reasons: ${previousErrors.join("; ")}. Fix these issues.`
      : basePrompt;
    const { data } = await generateStructured<GeneratedExerciseFreeWriting>({
      endpoint: "exercise",
      system: CELESTIA_SYSTEM_PROMPT,
      userMessage,
      toolName: "generate_exercise_free_writing",
      toolDescription:
        "Generate a free-writing exercise for a Spanish grammar lesson",
      schema: EXERCISE_FREE_WRITING_SCHEMA,
      userId,
    });
    return data;
  }, validateFreeWriting);

  const content: FreeWritingContent = {
    type: "free_writing",
    prompt: data.prompt,
    sampleAnswer: data.sampleAnswer,
    explanation: data.explanation,
  };

  return {
    content,
    correctAnswer: data.sampleAnswer ?? "",
    explanation: data.explanation,
    question: data.prompt,
  };
}

async function generateReadingComprehension(
  topic: GrammarTopic,
  userId: string,
): Promise<GeneratedExerciseResult> {
  const basePrompt = buildExerciseReadingComprehensionPrompt(topic);
  const data = await generateWithRetry(async (previousErrors) => {
    const userMessage = previousErrors
      ? `${basePrompt}\n\nIMPORTANT: Your previous attempt was rejected for these reasons: ${previousErrors.join("; ")}. Fix these issues.`
      : basePrompt;
    const { data } =
      await generateStructured<GeneratedExerciseReadingComprehension>({
        endpoint: "exercise",
        system: CELESTIA_SYSTEM_PROMPT,
        userMessage,
        toolName: "generate_exercise_reading_comprehension",
        toolDescription:
          "Generate a reading comprehension exercise for a Spanish grammar lesson",
        schema: EXERCISE_READING_COMPREHENSION_SCHEMA,
        userId,
        maxTokens: 2048,
      });
    return data;
  }, validateReadingComprehension);

  const content: ReadingComprehensionContent = {
    type: "reading_comprehension",
    passage: data.passage,
    questions: data.questions,
    explanation: data.explanation,
  };

  return {
    content,
    correctAnswer: JSON.stringify(data.questions.map((q) => q.correctAnswer)),
    explanation: data.explanation,
    question: data.passage.slice(0, 100),
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
  content: ExerciseContent,
): ExerciseClientItem {
  switch (type) {
    case "gap_fill": {
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
    case "multiple_choice": {
      const mc = content as MultipleChoiceContent;
      return {
        exerciseId,
        type: "multiple_choice",
        prompt: mc.prompt,
        options: [...mc.options],
      };
    }
    case "reorder_words": {
      const rw = content as ReorderWordsContent;
      return {
        exerciseId,
        type: "reorder_words",
        words: [...rw.words],
        translation: rw.translation,
      };
    }
    case "match_pairs": {
      const mp = content as MatchPairsContent;
      return {
        exerciseId,
        type: "match_pairs",
        leftItems: mp.pairs.map((p) => p.left),
        rightItems:
          mp.shuffledRightItems ??
          shuffleUntilDifferent(mp.pairs.map((p) => p.right)),
      };
    }
    case "free_writing": {
      const fw = content as FreeWritingContent;
      return {
        exerciseId,
        type: "free_writing",
        writingPrompt: fw.prompt,
      };
    }
    case "reading_comprehension": {
      const rc = content as ReadingComprehensionContent;
      return {
        exerciseId,
        type: "reading_comprehension",
        passage: rc.passage,
        questions: rc.questions.map((q) => ({
          type: q.type,
          prompt: q.prompt,
          options: q.options,
        })),
      };
    }
    default:
      throw new Error(`Unknown exercise type: ${type}`);
  }
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
  const content = exercise.content as unknown as ExerciseContent;
  return toClientItem(exercise.id, type, content);
}
