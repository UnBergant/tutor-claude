"use server";

import { z } from "zod/v4";
import type {
  Prisma,
  ExerciseType as PrismaExerciseType,
} from "@/generated/prisma";
import { TOPIC_BY_ID } from "@/shared/data/grammar-topics";
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
import { auth } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import type {
  ExerciseAttemptResult,
  ExerciseClientItem,
  ExerciseType,
  GapFillContent,
  MultipleChoiceContent,
} from "@/shared/types/exercise";
import type { GrammarTopic } from "@/shared/types/grammar";
import {
  categorizeMistake,
  checkAnswer,
  describeMistakePattern,
} from "./lib/answer-check";
import {
  generateWithRetry,
  validateGapFill,
  validateMultipleChoice,
} from "./lib/validation";

// ──────────────────────────────────────────────
// Input validation schemas
// ──────────────────────────────────────────────

const generateExerciseSchema = z.object({
  topicId: z.string().min(1),
  type: z.enum(["gap_fill", "multiple_choice"]),
  lessonId: z.string().min(1),
  lessonBlockId: z.string().optional(),
});

const generateBatchSchema = z.object({
  topicId: z.string().min(1),
  types: z.array(z.enum(["gap_fill", "multiple_choice"])),
  lessonBlockId: z.string().min(1),
  lessonId: z.string().min(1),
  count: z.number().int().min(1).max(10),
});

const submitAnswerSchema = z.object({
  exerciseId: z.string().min(1),
  answer: z.string().min(1).max(1000),
});

const reportErrorSchema = z.object({
  exerciseId: z.string().min(1),
  description: z.string().min(1).max(1000),
});

// ──────────────────────────────────────────────
// Server Actions
// ──────────────────────────────────────────────

/**
 * Generate a single exercise for a grammar topic.
 * Validates through the full pipeline (schema + blocklist + confidence).
 */
export async function generateExercise(
  topicId: string,
  type: ExerciseType,
  lessonId: string,
  lessonBlockId?: string,
): Promise<ExerciseClientItem> {
  generateExerciseSchema.parse({ topicId, type, lessonId, lessonBlockId });

  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const topic = TOPIC_BY_ID.get(topicId);
  if (!topic) throw new Error(`Unknown topic: ${topicId}`);

  // Count existing exercises to determine order
  const existingCount = await prisma.exercise.count({
    where: { lessonId },
  });

  const { content, correctAnswer, explanation, question } =
    await generateAndValidateExercise(type, topic, session.user.id);

  // Persist to DB
  const exercise = await prisma.exercise.create({
    data: {
      lessonId,
      lessonBlockId: lessonBlockId ?? null,
      type: toPrismaExerciseType(type),
      question,
      content: content as unknown as Prisma.InputJsonValue,
      correctAnswer,
      explanation,
      order: existingCount + 1,
    },
  });

  return toClientItem(exercise.id, type, content);
}

/**
 * Generate a batch of exercises for a lesson block.
 * More cost-effective than individual calls.
 */
export async function generateExerciseBatch(
  topicId: string,
  types: ExerciseType[],
  lessonBlockId: string,
  lessonId: string,
  count: number,
): Promise<ExerciseClientItem[]> {
  generateBatchSchema.parse({ topicId, types, lessonBlockId, lessonId, count });

  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const topic = TOPIC_BY_ID.get(topicId);
  if (!topic) throw new Error(`Unknown topic: ${topicId}`);

  const existingCount = await prisma.exercise.count({
    where: { lessonId },
  });

  const exercises: ExerciseClientItem[] = [];

  for (let i = 0; i < count; i++) {
    // Alternate between provided types
    const type = types[i % types.length];

    const { content, correctAnswer, explanation, question } =
      await generateAndValidateExercise(type, topic, session.user.id);

    const exercise = await prisma.exercise.create({
      data: {
        lessonId,
        lessonBlockId,
        type: toPrismaExerciseType(type),
        question,
        content: content as unknown as Prisma.InputJsonValue,
        correctAnswer,
        explanation,
        order: existingCount + i + 1,
      },
    });

    exercises.push(toClientItem(exercise.id, type, content));
  }

  return exercises;
}

/**
 * Submit an answer for an exercise.
 * Validates, creates ExerciseAttempt, categorizes mistakes, returns feedback.
 */
export async function submitExerciseAnswer(
  exerciseId: string,
  answer: string,
): Promise<ExerciseAttemptResult> {
  submitAnswerSchema.parse({ exerciseId, answer });

  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: { lesson: true },
  });

  if (!exercise) throw new Error("Exercise not found");

  const exerciseType = fromPrismaExerciseType(exercise.type);
  const isCorrect = checkAnswer(answer, exercise.correctAnswer, exerciseType);

  const mistakeCategory = isCorrect
    ? null
    : categorizeMistake(answer, exercise.correctAnswer, exerciseType);

  // Persist attempt + optionally create/update MistakeEntry
  const operations: Prisma.PrismaPromise<unknown>[] = [
    prisma.exerciseAttempt.create({
      data: {
        userId,
        exerciseId,
        userAnswer: answer,
        isCorrect,
        category: mistakeCategory,
        feedback: exercise.explanation,
      },
    }),
  ];

  // Track mistake patterns for curriculum adaptation
  if (!isCorrect && mistakeCategory) {
    const topicId = exercise.lesson.topicId;
    const pattern = describeMistakePattern(
      answer,
      exercise.correctAnswer,
      topicId,
      exerciseType,
    );

    operations.push(
      prisma.mistakeEntry.upsert({
        where: {
          id: `${userId}-${topicId}-${mistakeCategory}`,
        },
        create: {
          userId,
          category: mistakeCategory,
          pattern,
          relatedTopicId: topicId,
          count: 1,
        },
        update: {
          count: { increment: 1 },
          pattern,
          lastOccurred: new Date(),
        },
      }),
    );
  }

  await prisma.$transaction(operations);

  return {
    isCorrect,
    correctAnswer: exercise.correctAnswer,
    explanation: exercise.explanation ?? "",
    mistakeCategory,
    retryTopicId: !isCorrect ? exercise.lesson.topicId : undefined,
  };
}

/**
 * Report an error in an exercise (user-submitted bug report).
 */
export async function reportExerciseError(
  exerciseId: string,
  description: string,
): Promise<void> {
  reportErrorSchema.parse({ exerciseId, description });

  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  // Store as a special ExerciseAttempt with isCorrect: false and feedback containing the report
  await prisma.exerciseAttempt.create({
    data: {
      userId: session.user.id,
      exerciseId,
      userAnswer: "[ERROR_REPORT]",
      isCorrect: false,
      feedback: `USER REPORT: ${description}`,
    },
  });
}

/**
 * Load exercises for a lesson block (pre-generated).
 */
export async function getBlockExercises(
  lessonBlockId: string,
): Promise<ExerciseClientItem[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const exercises = await prisma.exercise.findMany({
    where: { lessonBlockId },
    orderBy: { order: "asc" },
  });

  return exercises.map((ex) => {
    const type = fromPrismaExerciseType(ex.type);
    const content = ex.content as unknown as
      | GapFillContent
      | MultipleChoiceContent;
    return toClientItem(ex.id, type, content);
  });
}

// ──────────────────────────────────────────────
// Internal helpers
// ──────────────────────────────────────────────

interface GeneratedExerciseResult {
  content: GapFillContent | MultipleChoiceContent;
  correctAnswer: string;
  explanation: string;
  question: string;
}

/**
 * Generate and validate a single exercise through the full pipeline.
 * Shared by generateExercise and generateExerciseBatch.
 */
async function generateAndValidateExercise(
  type: ExerciseType,
  topic: GrammarTopic,
  userId: string,
): Promise<GeneratedExerciseResult> {
  if (type === "gap_fill") {
    const prompt = buildExerciseGapFillPrompt(topic);
    const data = await generateWithRetry(async () => {
      const { data } = await generateStructured<GeneratedExerciseGapFill>({
        endpoint: "exercise",
        system: CELESTIA_SYSTEM_PROMPT,
        userMessage: prompt,
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
  const prompt = buildExerciseMultipleChoicePrompt(topic);
  const data = await generateWithRetry(async () => {
    const { data } = await generateStructured<GeneratedExerciseMultipleChoice>({
      endpoint: "exercise",
      system: CELESTIA_SYSTEM_PROMPT,
      userMessage: prompt,
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

/** Convert lowercase exercise type to Prisma enum */
function toPrismaExerciseType(type: ExerciseType): PrismaExerciseType {
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
function fromPrismaExerciseType(type: PrismaExerciseType): ExerciseType {
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
function toClientItem(
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

// ──────────────────────────────────────────────
// Sanitization (shared with assessment)
// ──────────────────────────────────────────────

/** Re-split gap-fill if AI included underscores in before/after */
function sanitizeGapFill(
  before: string,
  after: string,
): { before: string; after: string } {
  const blankPattern = /_{2,}|\.{3,}|…/;
  const beforeMatch = blankPattern.exec(before);
  const afterMatch = blankPattern.exec(after);

  if (beforeMatch) {
    const realBefore = before.slice(0, beforeMatch.index);
    const rest = before.slice(beforeMatch.index + beforeMatch[0].length);
    return { before: realBefore, after: rest + after };
  }

  if (afterMatch) {
    const rest = after.slice(0, afterMatch.index);
    const realAfter = after.slice(afterMatch.index + afterMatch[0].length);
    return { before: before + rest, after: realAfter };
  }

  return { before, after };
}

/** De-duplicate MC options and fix answer leaking */
function sanitizeMultipleChoice(
  data: GeneratedExerciseMultipleChoice,
): GeneratedExerciseMultipleChoice {
  const seen = new Set<string>();
  const options = data.options.map((opt) => {
    let unique = opt;
    let suffix = 2;
    while (seen.has(unique)) {
      unique = `${opt} (${suffix})`;
      suffix++;
    }
    seen.add(unique);
    return unique;
  });

  let prompt = data.prompt;
  const blankIdx = prompt.indexOf("___");
  if (blankIdx !== -1) {
    const afterBlank = prompt.slice(blankIdx + 3).trim();
    const correctAnswer = options[data.correctIndex];
    const correctWords = correctAnswer.toLowerCase().split(/\s+/);
    const afterWords = afterBlank.toLowerCase().split(/\s+/);

    let leakedCount = 0;
    for (let i = 0; i < afterWords.length && i < correctWords.length; i++) {
      const afterClean = afterWords[i].replace(/[.,;:!?]/g, "");
      if (correctWords.includes(afterClean)) {
        leakedCount++;
      } else {
        break;
      }
    }
    if (leakedCount > 0) {
      const afterBlankWords = afterBlank.split(/\s+/);
      const cleaned = afterBlankWords.slice(leakedCount).join(" ");
      prompt = `${prompt.slice(0, blankIdx + 3)} ${cleaned}`;
    }
  }

  return {
    ...data,
    prompt,
    options,
    correctAnswer: options[data.correctIndex],
  };
}

/** Check if hint reveals the answer */
function hintMatchesAnswer(hint: string, correctAnswer: string): boolean {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  return normalize(hint) === normalize(correctAnswer);
}
