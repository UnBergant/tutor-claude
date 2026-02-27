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
import {
  hintMatchesAnswer,
  sanitizeGapFill,
  sanitizeMultipleChoice,
} from "@/shared/lib/ai/sanitize";
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
  hasAccentMismatch,
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
  type: GeneratableExerciseType,
  lessonId: string,
  lessonBlockId?: string,
): Promise<ExerciseClientItem> {
  generateExerciseSchema.parse({ topicId, type, lessonId, lessonBlockId });

  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const topic = TOPIC_BY_ID.get(topicId);
  if (!topic) throw new Error(`Unknown topic: ${topicId}`);

  const { content, correctAnswer, explanation, question } =
    await generateAndValidateExercise(type, topic, session.user.id);

  // Persist inside transaction to get consistent order
  const exercise = await prisma.$transaction(async (tx) => {
    const existingCount = await tx.exercise.count({
      where: { lessonId },
    });

    return tx.exercise.create({
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
  });

  return toClientItem(exercise.id, type, content);
}

/**
 * Generate a batch of exercises for a lesson block.
 * More cost-effective than individual calls.
 */
/** Exercise types currently supported for generation */
type GeneratableExerciseType = "gap_fill" | "multiple_choice";

export async function generateExerciseBatch(
  topicId: string,
  types: GeneratableExerciseType[],
  lessonBlockId: string,
  lessonId: string,
  count: number,
): Promise<ExerciseClientItem[]> {
  generateBatchSchema.parse({ topicId, types, lessonBlockId, lessonId, count });

  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  const topic = TOPIC_BY_ID.get(topicId);
  if (!topic) throw new Error(`Unknown topic: ${topicId}`);

  // Generate all exercises in parallel (AI calls are independent)
  const typeList = Array.from(
    { length: count },
    (_, i) => types[i % types.length],
  );
  const generated = await Promise.all(
    typeList.map((type) => generateAndValidateExercise(type, topic, userId)),
  );

  // Persist sequentially inside a transaction to ensure consistent ordering
  const exercises = await prisma.$transaction(async (tx) => {
    const existingCount = await tx.exercise.count({
      where: { lessonId },
    });

    const results: ExerciseClientItem[] = [];
    for (let i = 0; i < generated.length; i++) {
      const { content, correctAnswer, explanation, question } = generated[i];
      const type = typeList[i];

      const exercise = await tx.exercise.create({
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

      results.push(toClientItem(exercise.id, type, content));
    }
    return results;
  });

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
    include: { lesson: { include: { module: true } } },
  });

  if (!exercise) throw new Error("Exercise not found");
  if (exercise.lesson.module.userId !== userId) {
    throw new Error("Not authorized");
  }

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
          userId_relatedTopicId_category: {
            userId,
            relatedTopicId: topicId,
            category: mistakeCategory,
          },
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

  // Add accent warning if answer was accepted but had wrong accents
  const accentWarning =
    isCorrect && hasAccentMismatch(answer, exercise.correctAnswer)
      ? `Watch your accents! The correct spelling is: ${exercise.correctAnswer}`
      : undefined;

  return {
    isCorrect,
    correctAnswer: exercise.correctAnswer,
    explanation: accentWarning
      ? `${accentWarning}\n\n${exercise.explanation ?? ""}`
      : (exercise.explanation ?? ""),
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

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: { lesson: { include: { module: true } } },
  });
  if (!exercise) throw new Error("Exercise not found");
  if (exercise.lesson.module.userId !== session.user.id) {
    throw new Error("Not authorized");
  }

  // Store as a special ExerciseAttempt (not counted in analytics — userAnswer marks it as report)
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
    where: {
      lessonBlockId,
      lesson: { module: { userId: session.user.id } },
    },
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

// sanitizeGapFill, sanitizeMultipleChoice, hintMatchesAnswer
// → imported from @/shared/lib/ai/sanitize
