"use server";

import { generateStructured } from "@/shared/lib/ai/client";
import { auth } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import { sm2 } from "@/shared/lib/srs";
import { saveChatExtractionData } from "./chat-helper";
import type {
  ChatExtractionResult,
  MessageTranslation,
  TextMessage,
} from "./types";

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    vocabulary: {
      type: "array",
      description:
        "New Spanish words the student used or learned during the conversation",
      items: {
        type: "object",
        properties: {
          word: { type: "string", description: "Spanish word or phrase" },
          translation: { type: "string", description: "English translation" },
          context: {
            type: "string",
            description: "Example sentence from the conversation",
          },
        },
        required: ["word", "translation", "context"],
      },
    },
    interests: {
      type: "array",
      description:
        "Topics the student showed interest in during the conversation",
      items: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "Topic name (e.g., 'travel', 'cooking', 'sports')",
          },
          confidence: {
            type: "integer",
            description:
              "How confident are you this is a genuine interest (integer 0-100)",
          },
        },
        required: ["topic", "confidence"],
      },
    },
    mistakes: {
      type: "array",
      description: "Grammar or vocabulary mistakes the student made",
      items: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["GRAMMAR", "VOCABULARY", "WORD_ORDER"],
            description: "Type of mistake",
          },
          pattern: {
            type: "string",
            description:
              "Brief description of the mistake pattern (e.g., 'ser/estar confusion', 'subjunctive after cuando')",
          },
        },
        required: ["category", "pattern"],
      },
    },
  },
  required: ["vocabulary", "interests", "mistakes"],
};

/**
 * Extract structured learning data from a completed chat session.
 *
 * Uses Haiku (via "evaluation" endpoint) to analyze the conversation
 * and extract vocabulary, interests, and mistakes.
 */
export async function extractChatData(
  messages: Pick<TextMessage, "role" | "content">[],
): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false };
  }

  const userId = session.user.id;

  // Skip extraction for very short conversations
  if (messages.length < 4) {
    return { success: true };
  }

  try {
    const conversationText = messages
      .map((m) => `${m.role === "user" ? "Student" : "Celestia"}: ${m.content}`)
      .join("\n\n");

    const { data } = await generateStructured<ChatExtractionResult>({
      endpoint: "evaluation",
      system:
        "You are analyzing a Spanish conversation between a student and their tutor Celestia. Extract useful learning data from the conversation.",
      userMessage: `Analyze this conversation and extract:\n1. New vocabulary the student encountered or used\n2. Topics the student seems interested in\n3. Mistakes the student made in Spanish\n\nConversation:\n${conversationText}`,
      toolName: "extract_chat_data",
      toolDescription:
        "Extract vocabulary, interests, and mistakes from a chat conversation",
      schema: EXTRACTION_SCHEMA,
      userId,
    });

    await saveChatExtractionData(userId, data);

    return { success: true };
  } catch (error) {
    console.error("[extractChatData] Failed:", error);
    return { success: false };
  }
}

const TRANSLATION_SCHEMA = {
  type: "object",
  properties: {
    words: {
      type: "array",
      description: "Translations for each Spanish word in the message",
      items: {
        type: "object",
        properties: {
          word: {
            type: "string",
            description: "Original word from the message",
          },
          translation: { type: "string", description: "English translation" },
          partOfSpeech: {
            type: "string",
            description:
              "Part of speech (e.g., 'noun', 'verb', 'adjective', 'adverb', 'preposition', 'article', 'pronoun', 'conjunction')",
          },
          form: {
            type: "string",
            description:
              "Conjugation/inflection form for verbs (e.g., 'presente, 1a persona singular'). Omit for non-verbs.",
          },
        },
        required: ["word", "translation", "partOfSpeech"],
      },
    },
  },
  required: ["words"],
};

/**
 * Translate all Spanish words in a message using Haiku.
 *
 * Returns word-by-word translations with part of speech and optional verb form.
 */
export async function translateMessage(
  messageText: string,
): Promise<MessageTranslation> {
  const session = await auth();
  if (!session?.user?.id) {
    return { words: [] };
  }

  const userId = session.user.id;

  try {
    const { data } = await generateStructured<MessageTranslation>({
      endpoint: "evaluation",
      system:
        "You are a Spanish-English translation assistant. Translate each Spanish word in context. For verbs, include the conjugation form (e.g., 'presente, 1a persona singular'). For non-Spanish words (English, punctuation, numbers), skip them.",
      userMessage: messageText,
      toolName: "translate_words",
      toolDescription: "Translate all Spanish words in a message",
      schema: TRANSLATION_SCHEMA,
      userId,
      maxTokens: 2048,
    });

    return data;
  } catch (error) {
    console.error("[translateMessage] Failed:", error);
    return { words: [] };
  }
}

/**
 * Get the next vocabulary word due for flashcard review.
 *
 * Prioritizes never-reviewed words (nextReviewAt IS NULL), then oldest due.
 * Returns null if no words are due for review.
 */
export async function getFlashcardWord(): Promise<{
  wordId: string;
  word: string;
  prompt: string;
  hint: string | null;
} | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const now = new Date();

  const vocabularyWord = await prisma.vocabularyWord.findFirst({
    where: {
      userId: session.user.id,
      OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }],
    },
    orderBy: {
      nextReviewAt: { sort: "asc", nulls: "first" },
    },
  });

  if (!vocabularyWord) {
    return null;
  }

  return {
    wordId: vocabularyWord.id,
    word: vocabularyWord.word,
    prompt: vocabularyWord.translation,
    hint: vocabularyWord.context,
  };
}

/**
 * Submit a flashcard review answer and update SRS scheduling.
 *
 * Maps correct/incorrect to SM-2 quality:
 *   correct=true  → quality 4 (correct after hesitation)
 *   correct=false → quality 1 (incorrect; correct answer remembered on reveal)
 */
export async function submitFlashcardAnswer(
  wordId: string,
  correct: boolean,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    return;
  }

  const vocabularyWord = await prisma.vocabularyWord.findFirst({
    where: {
      id: wordId,
      userId: session.user.id,
    },
  });

  if (!vocabularyWord) {
    return;
  }

  const quality = correct ? 4 : 1;

  const result = sm2({
    quality,
    repetitions: vocabularyWord.repetitions,
    easeFactor: vocabularyWord.easeFactor,
    interval: vocabularyWord.interval,
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
}
