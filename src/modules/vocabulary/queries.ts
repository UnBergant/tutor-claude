import "server-only";

import { prisma } from "@/shared/lib/prisma";
import type { VocabularyStats, VocabularyWordItem } from "./types";

/**
 * Get all vocabulary words for a user, sorted by creation date (newest first).
 */
export async function getVocabularyWords(
  userId: string,
): Promise<VocabularyWordItem[]> {
  const words = await prisma.vocabularyWord.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return words.map(toWordItem);
}

/**
 * Get words due for review (nextReviewAt <= now OR never reviewed).
 */
export async function getReviewQueue(
  userId: string,
): Promise<VocabularyWordItem[]> {
  const now = new Date();

  const words = await prisma.vocabularyWord.findMany({
    where: {
      userId,
      OR: [{ nextReviewAt: { lte: now } }, { nextReviewAt: null }],
    },
    orderBy: { nextReviewAt: "asc" },
  });

  return words.map(toWordItem);
}

/**
 * Get vocabulary statistics: total, due for review, mastered.
 */
export async function getVocabularyStats(
  userId: string,
): Promise<VocabularyStats> {
  const now = new Date();

  const [total, dueForReview, mastered] = await Promise.all([
    prisma.vocabularyWord.count({ where: { userId } }),
    prisma.vocabularyWord.count({
      where: {
        userId,
        OR: [{ nextReviewAt: { lte: now } }, { nextReviewAt: null }],
      },
    }),
    prisma.vocabularyWord.count({
      where: { userId, interval: { gte: 21 } },
    }),
  ]);

  return { total, dueForReview, mastered };
}

function toWordItem(word: {
  id: string;
  word: string;
  translation: string;
  context: string | null;
  source: "LESSON" | "CHAT";
  nextReviewAt: Date | null;
  interval: number;
  easeFactor: number;
  repetitions: number;
  createdAt: Date;
  updatedAt: Date;
}): VocabularyWordItem {
  return {
    id: word.id,
    word: word.word,
    translation: word.translation,
    context: word.context,
    source: word.source,
    nextReviewAt: word.nextReviewAt,
    interval: word.interval,
    easeFactor: word.easeFactor,
    repetitions: word.repetitions,
    createdAt: word.createdAt,
    updatedAt: word.updatedAt,
  };
}
