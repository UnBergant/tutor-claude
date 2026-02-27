import "server-only";

import { prisma } from "@/shared/lib/prisma";

/**
 * Get the user's active module with its lessons and progress.
 * Single query with join (instead of two sequential queries).
 */
export async function getActiveModuleWithProgress(userId: string) {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: {
      activeModule: {
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: {
              progress: {
                where: { userId },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  return profile?.activeModule ?? null;
}

/**
 * Get the next lesson the user should work on (first NOT_STARTED or IN_PROGRESS).
 */
export async function getNextLessonForUser(userId: string) {
  const activeModule = await getActiveModuleWithProgress(userId);
  if (!activeModule) return null;

  // Find first lesson that's not completed
  for (const lesson of activeModule.lessons) {
    const progress = lesson.progress[0];
    if (!progress || progress.status !== "COMPLETED") {
      return {
        lessonId: lesson.id,
        title: lesson.title,
        order: lesson.order,
        moduleTitle: activeModule.title,
        status: progress?.status ?? "NOT_STARTED",
      };
    }
  }

  return null; // All lessons completed
}

/**
 * Get lessons due for spaced review.
 */
export async function getDueReviews(userId: string) {
  const now = new Date();

  return prisma.lessonProgress.findMany({
    where: {
      userId,
      status: "COMPLETED",
      nextReviewAt: { lte: now },
    },
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          topicId: true,
          module: { select: { title: true } },
        },
      },
    },
    orderBy: { nextReviewAt: "asc" },
  });
}

/**
 * Get mistake stats for curriculum adaptation.
 */
export async function getMistakeStats(userId: string) {
  return prisma.mistakeEntry.findMany({
    where: { userId },
    orderBy: { count: "desc" },
    take: 20,
  });
}

/**
 * Get all modules for a user (for module selection).
 */
export async function getUserModules(userId: string) {
  return prisma.module.findMany({
    where: { userId },
    orderBy: { order: "asc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        include: {
          progress: {
            where: { userId },
            take: 1,
          },
        },
      },
    },
  });
}

/**
 * Get the latest completed assessment with gap map.
 */
export async function getLatestAssessment(userId: string) {
  return prisma.assessment.findFirst({
    where: {
      userId,
      status: "COMPLETED",
    },
    orderBy: { completedAt: "desc" },
  });
}
