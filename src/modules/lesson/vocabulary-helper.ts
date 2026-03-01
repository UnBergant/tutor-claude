import type { Prisma } from "@/generated/prisma";
import { extractVocabularyFromExercise } from "@/shared/lib/exercise/vocabulary-extraction";
import { prisma } from "@/shared/lib/prisma";
import type { ExerciseContent, ExerciseType } from "@/shared/types/exercise";

/**
 * Extract vocabulary from a correctly answered exercise and save to DB.
 * Fire-and-forget — errors are logged but don't block the main flow.
 */
export async function extractAndSaveVocabulary(
  userId: string,
  exerciseType: ExerciseType,
  content: ExerciseContent,
  correctAnswer: string,
): Promise<void> {
  try {
    const words = extractVocabularyFromExercise(
      exerciseType,
      content,
      correctAnswer,
    );
    if (words.length === 0) return;

    const operations: Prisma.PrismaPromise<unknown>[] = words.map((w) =>
      prisma.vocabularyWord.upsert({
        where: { userId_word: { userId, word: w.word } },
        create: {
          userId,
          word: w.word,
          translation: w.translation,
          context: w.context ?? null,
          source: "LESSON",
        },
        update: {
          updatedAt: new Date(),
        },
      }),
    );

    await prisma.$transaction(operations);
  } catch (error) {
    console.error("[extractAndSaveVocabulary] Failed:", error);
  }
}
