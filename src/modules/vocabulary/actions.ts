"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import { sm2 } from "@/shared/lib/srs";

/**
 * Review a vocabulary word: "know" (quality 4) or "don't know" (quality 1).
 * Updates SM-2 parameters and schedules next review.
 */
export async function reviewWord(wordId: string, know: boolean): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const word = await prisma.vocabularyWord.findUnique({
    where: { id: wordId },
  });
  if (!word || word.userId !== session.user.id) {
    throw new Error("Word not found");
  }

  const quality = know ? 4 : 1;
  const result = sm2({
    quality,
    repetitions: word.repetitions,
    easeFactor: word.easeFactor,
    interval: word.interval,
  });

  await prisma.vocabularyWord.update({
    where: { id: wordId },
    data: {
      repetitions: result.repetitions,
      easeFactor: result.easeFactor,
      interval: result.interval,
      nextReviewAt: result.nextReviewAt,
    },
  });

  revalidatePath("/vocabulary");
}

/**
 * Delete a vocabulary word.
 */
export async function deleteWord(wordId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const word = await prisma.vocabularyWord.findUnique({
    where: { id: wordId },
  });
  if (!word || word.userId !== session.user.id) {
    throw new Error("Word not found");
  }

  await prisma.vocabularyWord.delete({ where: { id: wordId } });
  revalidatePath("/vocabulary");
}
