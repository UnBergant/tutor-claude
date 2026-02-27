import "server-only";

import type { MistakeCategory } from "@/generated/prisma";
import { TOPIC_BY_ID } from "@/shared/data/grammar-topics";
import { prisma } from "@/shared/lib/prisma";

// ── Types ───────────────────────────────────────

export interface OverallAccuracy {
  correct: number;
  total: number;
  percentage: number;
}

export interface ModuleProgressStat {
  id: string;
  title: string;
  level: string;
  completedLessons: number;
  totalLessons: number;
  avgScore: number | null;
}

export interface MistakeJournalEntry {
  id: string;
  pattern: string;
  count: number;
  category: MistakeCategory;
  topicTitle: string | null;
  lastOccurred: Date;
  /** Link to the first lesson in the module that covers this topic */
  practiceLessonId: string | null;
}

// ── Queries ─────────────────────────────────────

/**
 * Overall accuracy across all exercise attempts.
 */
export async function getOverallAccuracy(
  userId: string,
): Promise<OverallAccuracy> {
  const groups = await prisma.exerciseAttempt.groupBy({
    by: ["isCorrect"],
    where: { userId },
    _count: { _all: true },
  });

  let correct = 0;
  let total = 0;
  for (const g of groups) {
    total += g._count._all;
    if (g.isCorrect) correct = g._count._all;
  }

  return {
    correct,
    total,
    percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
  };
}

/**
 * Per-module progress: completed/total lessons and average score.
 */
export async function getModuleProgressStats(
  userId: string,
): Promise<ModuleProgressStat[]> {
  const modules = await prisma.module.findMany({
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

  return modules.map((mod) => {
    const totalLessons = mod.lessons.length;
    let completedLessons = 0;
    let scoreSum = 0;
    let scoredCount = 0;

    for (const lesson of mod.lessons) {
      const progress = lesson.progress[0];
      if (progress?.status === "COMPLETED") {
        completedLessons++;
        if (progress.score != null) {
          scoreSum += progress.score;
          scoredCount++;
        }
      }
    }

    return {
      id: mod.id,
      title: mod.title,
      level: mod.level,
      completedLessons,
      totalLessons,
      avgScore: scoredCount > 0 ? Math.round(scoreSum / scoredCount) : null,
    };
  });
}

/**
 * Mistake journal: all mistake entries with resolved topic titles
 * and links to related lessons for practice.
 */
export async function getMistakeJournalEntries(
  userId: string,
): Promise<MistakeJournalEntry[]> {
  const [entries, modules] = await Promise.all([
    prisma.mistakeEntry.findMany({
      where: { userId },
      orderBy: { count: "desc" },
    }),
    prisma.module.findMany({
      where: { userId },
      select: {
        topicId: true,
        lessons: {
          orderBy: { order: "asc" },
          take: 1,
          select: { id: true },
        },
      },
    }),
  ]);

  // topicId → first lesson ID
  const topicLessonMap = new Map<string, string>();
  for (const mod of modules) {
    if (mod.lessons[0]) {
      topicLessonMap.set(mod.topicId, mod.lessons[0].id);
    }
  }

  return entries.map((entry) => ({
    id: entry.id,
    pattern: entry.pattern,
    count: entry.count,
    category: entry.category,
    topicTitle: entry.relatedTopicId
      ? (TOPIC_BY_ID.get(entry.relatedTopicId)?.title ?? null)
      : null,
    lastOccurred: entry.lastOccurred,
    practiceLessonId: entry.relatedTopicId
      ? (topicLessonMap.get(entry.relatedTopicId) ?? null)
      : null,
  }));
}

/**
 * Mistake count breakdown by category.
 */
export async function getCategoryBreakdown(
  userId: string,
): Promise<Record<MistakeCategory, number>> {
  const groups = await prisma.mistakeEntry.groupBy({
    by: ["category"],
    where: { userId },
    _sum: { count: true },
  });

  const result: Record<MistakeCategory, number> = {
    GRAMMAR: 0,
    VOCABULARY: 0,
    WORD_ORDER: 0,
  };

  for (const g of groups) {
    result[g.category] = g._sum.count ?? 0;
  }

  return result;
}
