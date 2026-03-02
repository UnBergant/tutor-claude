import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/shared/lib/prisma";
import type { ChatExtractionResult } from "./types";

/**
 * Upsert extracted vocabulary, interests, and mistakes from a chat session.
 * Fire-and-forget — errors are logged but don't propagate.
 */
export async function saveChatExtractionData(
  userId: string,
  data: ChatExtractionResult,
): Promise<void> {
  try {
    const operations: Prisma.PrismaPromise<unknown>[] = [];

    // Vocabulary upserts (source: CHAT)
    for (const word of data.vocabulary ?? []) {
      operations.push(
        prisma.vocabularyWord.upsert({
          where: { userId_word: { userId, word: word.word } },
          create: {
            userId,
            word: word.word,
            translation: word.translation,
            context: word.context,
            source: "CHAT",
          },
          update: {
            updatedAt: new Date(),
          },
        }),
      );
    }

    // Interest upserts
    for (const interest of data.interests ?? []) {
      operations.push(
        prisma.userInterest.upsert({
          where: { userId_topic: { userId, topic: interest.topic } },
          create: {
            userId,
            topic: interest.topic,
            confidence: interest.confidence,
            source: "chat",
            mentionCount: 1,
          },
          update: {
            confidence: interest.confidence,
            mentionCount: { increment: 1 },
            lastMentioned: new Date(),
          },
        }),
      );
    }

    // Mistake creates — chat mistakes have no grammar topic link (relatedTopicId: null)
    // Using create instead of upsert because each AI extraction produces unique pattern strings
    for (const mistake of data.mistakes ?? []) {
      operations.push(
        prisma.mistakeEntry.create({
          data: {
            userId,
            category: mistake.category,
            pattern: mistake.pattern,
            relatedTopicId: null,
          },
        }),
      );
    }

    if (operations.length > 0) {
      await prisma.$transaction(operations);
    }
  } catch (error) {
    console.error("[saveChatExtractionData] Failed:", error);
  }
}
