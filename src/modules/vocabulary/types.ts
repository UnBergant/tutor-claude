import type { VocabSource } from "@/generated/prisma";

export interface VocabularyWordItem {
  id: string;
  word: string;
  translation: string;
  context: string | null;
  source: VocabSource;
  nextReviewAt: Date | null;
  interval: number;
  easeFactor: number;
  repetitions: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface VocabularyStats {
  total: number;
  dueForReview: number;
  mastered: number; // interval >= 21 days
}
