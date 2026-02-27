"use server";

import type { Prisma } from "@/generated/prisma";
import { TOPIC_BY_ID } from "@/shared/data/grammar-topics";
import { generateStructured } from "@/shared/lib/ai/client";
import {
  buildLessonGenerationPrompt,
  buildModuleProposalPrompt,
  type GeneratedLesson,
  type GeneratedModuleProposal,
  LESSON_GENERATION_SCHEMA,
  MODULE_PROPOSAL_SCHEMA,
} from "@/shared/lib/ai/prompts/curriculum";
import { CELESTIA_SYSTEM_PROMPT } from "@/shared/lib/ai/prompts/system";
import { auth } from "@/shared/lib/auth";
import {
  categorizeMistake,
  checkAnswer,
  describeMistakePattern,
  hasAccentMismatch,
} from "@/shared/lib/exercise/answer-check";
import {
  exerciseRecordToClientItem,
  fromPrismaExerciseType,
  type GeneratableExerciseType,
  generateAndValidateExercise,
  toPrismaExerciseType,
} from "@/shared/lib/exercise/generation";
import { prisma } from "@/shared/lib/prisma";
import type { AssessmentResult } from "@/shared/types/assessment";
import type {
  ExerciseAttemptResult,
  ExerciseClientItem,
} from "@/shared/types/exercise";
import type { CEFRLevel } from "@/shared/types/grammar";
import { getLatestAssessment, getMistakeStats } from "./queries";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface ModuleProposal {
  id: string;
  title: string;
  description: string;
  topicId: string;
  level: string;
  lessonCount: number;
}

export interface LessonDetail {
  id: string;
  title: string;
  description: string;
  topicId: string;
  estimatedMinutes: number;
  order: number;
  blocks: BlockDetail[];
  progress: { status: string; score: number | null };
}

export interface BlockDetail {
  id: string;
  type: "REVIEW" | "NEW_MATERIAL";
  title: string;
  explanation: string;
  order: number;
  exercises: ExerciseClientItem[];
}

export interface LessonCompleteResult {
  score: number;
  nextReviewAt: Date;
  newInterval: number;
}

// ──────────────────────────────────────────────
// Spaced repetition intervals (days)
// ──────────────────────────────────────────────

const INTERVAL_SEQUENCE = [1, 3, 7, 14, 30];

function nextInterval(currentInterval: number): number {
  const idx = INTERVAL_SEQUENCE.indexOf(currentInterval);
  if (idx === -1 || idx === INTERVAL_SEQUENCE.length - 1) {
    return INTERVAL_SEQUENCE[INTERVAL_SEQUENCE.length - 1];
  }
  return INTERVAL_SEQUENCE[idx + 1];
}

// ──────────────────────────────────────────────
// Server Actions
// ──────────────────────────────────────────────

/**
 * Generate module proposals based on assessment results.
 * If modules already exist, returns them. Use regenerateModuleProposals to force new ones.
 */
export async function generateModuleProposals(): Promise<ModuleProposal[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  // Check if user already has modules
  const existing = await prisma.module.findMany({
    where: { userId },
    orderBy: { order: "asc" },
  });

  if (existing.length > 0) {
    return existing.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description ?? "",
      topicId: m.topicId,
      level: m.level,
      lessonCount: 0, // will be populated from lessons
    }));
  }

  // Load assessment data
  const assessment = await getLatestAssessment(userId);
  if (!assessment)
    throw new Error(
      "No completed assessment found. Please take the placement test first.",
    );

  const meta = assessment.metadata as unknown as {
    result: AssessmentResult;
    learningGoal: string;
  };
  const gapMap = meta.result.gapMap;
  const userLevel = meta.result.estimatedLevel;
  const learningGoal = meta.learningGoal ?? "personal";

  // Load recent mistakes
  const mistakes = await getMistakeStats(userId);
  const recentMistakes = mistakes.map((m) => ({
    category: m.category,
    pattern: m.pattern,
    count: m.count,
  }));

  // Generate proposals via AI
  const { data } = await generateStructured<GeneratedModuleProposal>({
    endpoint: "exercise",
    system: CELESTIA_SYSTEM_PROMPT,
    userMessage: buildModuleProposalPrompt({
      gapMap,
      userLevel,
      learningGoal,
      recentMistakes,
    }),
    toolName: "propose_modules",
    toolDescription: "Propose learning modules based on assessment results",
    schema: MODULE_PROPOSAL_SCHEMA,
    userId,
  });

  // Validate topic IDs and filter invalid ones
  const validModules = data.modules.filter((m) => TOPIC_BY_ID.has(m.topicId));
  if (validModules.length === 0) {
    throw new Error(
      "AI generated modules with invalid topic IDs. Please try again.",
    );
  }

  // Persist modules in transaction
  const created = await prisma.$transaction(
    validModules.map((m, i) =>
      prisma.module.create({
        data: {
          userId,
          title: m.title,
          description: m.description,
          topicId: m.topicId,
          level: m.level,
          order: i + 1,
        },
      }),
    ),
  );

  return created.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description ?? "",
    topicId: m.topicId,
    level: m.level,
    lessonCount:
      validModules.find((vm) => vm.topicId === m.topicId)?.lessonCount ?? 3,
  }));
}

/**
 * Delete existing modules and regenerate new proposals.
 */
export async function regenerateModuleProposals(): Promise<ModuleProposal[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  // Clear active module reference first
  await prisma.userProfile.updateMany({
    where: { userId: session.user.id },
    data: { activeModuleId: null },
  });

  // Delete all existing modules (cascades to lessons, blocks, exercises)
  await prisma.module.deleteMany({
    where: { userId: session.user.id },
  });

  return generateModuleProposals();
}

/**
 * Select a module to work on. Sets it as active and generates the first lesson if needed.
 */
export async function selectModule(moduleId: string): Promise<LessonDetail> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  // Verify ownership
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { lessons: { orderBy: { order: "asc" } } },
  });
  if (!module || module.userId !== userId) throw new Error("Module not found");

  // Set as active module
  await prisma.userProfile.update({
    where: { userId },
    data: { activeModuleId: moduleId },
  });

  // If no lessons exist, generate the first one
  if (module.lessons.length === 0) {
    return generateLesson(moduleId, 1);
  }

  // Return the first lesson
  return getLessonDetail(module.lessons[0].id);
}

/**
 * Generate a lesson for a module.
 * Creates lesson structure (blocks) via AI, then generates exercises in parallel.
 */
export async function generateLesson(
  moduleId: string,
  lessonOrder: number,
): Promise<LessonDetail> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  // Load module and topic
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        select: { title: true, topicId: true },
      },
    },
  });
  if (!module || module.userId !== userId) throw new Error("Module not found");

  const topic = TOPIC_BY_ID.get(module.topicId);
  if (!topic) throw new Error(`Unknown topic: ${module.topicId}`);

  // Get previously covered topics for REVIEW blocks
  const previousTopics = module.lessons.map((l) => l.title);

  // Load user profile for level
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { currentLevel: true },
  });

  // Count existing lessons to determine totalLessons
  const totalLessons = Math.max(module.lessons.length + 1, 3);

  // Generate lesson structure via AI
  const { data: lessonData } = await generateStructured<GeneratedLesson>({
    endpoint: "exercise",
    system: CELESTIA_SYSTEM_PROMPT,
    userMessage: buildLessonGenerationPrompt({
      topicTitle: topic.title,
      topicDescription: topic.description,
      topicLevel: topic.level,
      lessonOrder,
      totalLessons,
      moduleTitle: module.title,
      previousTopics,
      userLevel: (profile?.currentLevel ?? topic.level) as CEFRLevel,
    }),
    toolName: "generate_lesson",
    toolDescription: "Generate a structured Spanish grammar lesson",
    schema: LESSON_GENERATION_SCHEMA,
    userId,
  });

  // Create lesson and blocks in transaction
  const lesson = await prisma.$transaction(async (tx) => {
    const created = await tx.lesson.create({
      data: {
        moduleId,
        title: lessonData.title,
        description: lessonData.description,
        topicId: module.topicId,
        estimatedMinutes: 15,
        order: lessonOrder,
      },
    });

    // Create blocks
    for (let i = 0; i < lessonData.blocks.length; i++) {
      const block = lessonData.blocks[i];
      await tx.lessonBlock.create({
        data: {
          lessonId: created.id,
          type: block.type as "REVIEW" | "NEW_MATERIAL",
          title: block.title,
          content: block.explanation,
          order: i + 1,
        },
      });
    }

    // Create lesson progress
    await tx.lessonProgress.create({
      data: {
        userId,
        lessonId: created.id,
        status: "NOT_STARTED",
      },
    });

    return created;
  });

  // Load blocks for exercise generation
  const blocks = await prisma.lessonBlock.findMany({
    where: { lessonId: lesson.id },
    orderBy: { order: "asc" },
  });

  // Generate exercises for all blocks in parallel
  const exercisePromises = blocks.flatMap((block, blockIdx) => {
    const blockData = lessonData.blocks[blockIdx];
    if (!blockData) return [];

    const types = blockData.exerciseTypes as GeneratableExerciseType[];
    const count = blockData.exerciseCount;

    return Array.from({ length: count }, (_, i) => ({
      blockId: block.id,
      type: types[i % types.length],
      index: i,
    }));
  });

  const generatedExercises = await Promise.allSettled(
    exercisePromises.map(async (req) => {
      const result = await generateAndValidateExercise(req.type, topic, userId);
      return { ...req, result };
    }),
  );

  // Persist exercises per block
  const successfulExercises = generatedExercises
    .filter(
      (
        r,
      ): r is PromiseFulfilledResult<
        (typeof exercisePromises)[number] & {
          result: Awaited<ReturnType<typeof generateAndValidateExercise>>;
        }
      > => r.status === "fulfilled",
    )
    .map((r) => r.value);

  if (successfulExercises.length > 0) {
    await prisma.$transaction(
      successfulExercises.map((ex, i) =>
        prisma.exercise.create({
          data: {
            lessonId: lesson.id,
            lessonBlockId: ex.blockId,
            type: toPrismaExerciseType(ex.type),
            question: ex.result.question,
            content: ex.result.content as unknown as Prisma.InputJsonValue,
            correctAnswer: ex.result.correctAnswer,
            explanation: ex.result.explanation,
            order: i + 1,
          },
        }),
      ),
    );
  }

  return getLessonDetail(lesson.id);
}

/**
 * Get full lesson detail with blocks, exercises, and progress.
 */
export async function getLessonDetail(lessonId: string): Promise<LessonDetail> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: { select: { userId: true } },
      blocks: {
        orderBy: { order: "asc" },
        include: {
          exercises: {
            orderBy: { order: "asc" },
          },
        },
      },
      progress: {
        where: { userId },
        take: 1,
      },
    },
  });

  if (!lesson || lesson.module.userId !== userId) {
    throw new Error("Lesson not found");
  }

  const progress = lesson.progress[0];

  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description ?? "",
    topicId: lesson.topicId,
    estimatedMinutes: lesson.estimatedMinutes,
    order: lesson.order,
    blocks: lesson.blocks.map((block) => ({
      id: block.id,
      type: block.type as "REVIEW" | "NEW_MATERIAL",
      title: block.title,
      explanation: block.content,
      order: block.order,
      exercises: block.exercises.map((ex) => exerciseRecordToClientItem(ex)),
    })),
    progress: {
      status: progress?.status ?? "NOT_STARTED",
      score: progress?.score ?? null,
    },
  };
}

/**
 * Submit an answer for an exercise within a lesson.
 * Similar to submitExerciseAnswer but tracks lesson-level context.
 */
export async function submitLessonExercise(
  exerciseId: string,
  answer: string,
): Promise<ExerciseAttemptResult> {
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

  // Track mistake patterns
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

  // Mark lesson as IN_PROGRESS if it was NOT_STARTED
  operations.push(
    prisma.lessonProgress.updateMany({
      where: {
        userId,
        lessonId: exercise.lessonId,
        status: "NOT_STARTED",
      },
      data: { status: "IN_PROGRESS" },
    }),
  );

  await prisma.$transaction(operations);

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
 * Mark a lesson as complete. Computes score and schedules next review.
 */
export async function completeLesson(
  lessonId: string,
): Promise<LessonCompleteResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const userId = session.user.id;

  // Verify ownership
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { select: { userId: true } } },
  });
  if (!lesson || lesson.module.userId !== userId)
    throw new Error("Lesson not found");

  // Get progress
  const progress = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });
  if (!progress) throw new Error("Lesson progress not found");
  if (progress.status === "COMPLETED") {
    return {
      score: progress.score ?? 0,
      nextReviewAt: progress.nextReviewAt ?? new Date(),
      newInterval: progress.interval,
    };
  }

  // Compute score from exercise attempts
  const attempts = await prisma.exerciseAttempt.findMany({
    where: {
      userId,
      exercise: { lessonId },
      userAnswer: { not: "[ERROR_REPORT]" },
    },
  });

  const total = attempts.length;
  const correct = attempts.filter((a) => a.isCorrect).length;
  const score = total > 0 ? correct / total : 0;

  // Calculate next review
  const newInterval = nextInterval(progress.interval);
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  // Update progress + increment lessonsCompleted
  await prisma.$transaction([
    prisma.lessonProgress.update({
      where: { id: progress.id },
      data: {
        status: "COMPLETED",
        score,
        completedAt: new Date(),
        nextReviewAt,
        interval: newInterval,
      },
    }),
    prisma.userProfile.updateMany({
      where: { userId },
      data: { lessonsCompleted: { increment: 1 } },
    }),
  ]);

  return { score, nextReviewAt, newInterval };
}

/**
 * Generate the next lesson in a module (after completing the current one).
 */
export async function generateNextLesson(
  moduleId: string,
): Promise<LessonDetail | null> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { lessons: { orderBy: { order: "asc" } } },
  });
  if (!module || module.userId !== session.user.id)
    throw new Error("Module not found");

  const nextOrder = module.lessons.length + 1;
  if (nextOrder > 4) return null; // Max 4 lessons per module

  return generateLesson(moduleId, nextOrder);
}
