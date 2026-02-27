"use server";

import { z } from "zod/v4";
import type { Prisma } from "@/generated/prisma";
import { TOPIC_BY_ID } from "@/shared/data/grammar-topics";
import { auth } from "@/shared/lib/auth";
import {
  categorizeMistake,
  checkAnswer,
  describeMistakePattern,
  hasAccentMismatch,
} from "@/shared/lib/exercise/answer-check";
import {
  fromPrismaExerciseType,
  type GeneratableExerciseType,
  generateAndValidateExercise,
  toClientItem,
  toPrismaExerciseType,
} from "@/shared/lib/exercise/generation";
import { prisma } from "@/shared/lib/prisma";
import type {
  ExerciseAttemptResult,
  ExerciseClientItem,
  GapFillContent,
  MultipleChoiceContent,
} from "@/shared/types/exercise";

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
